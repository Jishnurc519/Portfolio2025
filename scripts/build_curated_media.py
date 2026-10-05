#!/usr/bin/env python3
"""Convert hand-picked media into web assets + assets/curated-media.js.

build_assets.py takes whatever sorts first in a project's source folder, up to
8 stills and 2 clips. That is fine for a gallery, but a case study wants
particular files in particular places -- the BeePod clip next to the BeePod
paragraph, the Sobha visualisations before the finished install -- and the
files that matter are often not in the source folder at all but in
assets/NewAssets/, or lying raw under assets/<cat>/<slug>/.

So this script works from an explicit list (CURATED below): every entry names
a source file and gives it a short name. Each one is converted to

    assets/<cat>/<slug>/c-<name>.jpg                      (a still)
    assets/<cat>/<slug>/c-<name>.mp4 + c-<name>-poster.jpg (a clip)

and recorded in assets/curated-media.js under the same name, which is what
project-details.js refers to (`media: "beepod-1"`) and what render-project.js
looks up. `thumbs` replaces the manifest's card plates for that project.

It never touches assets/manifest.js, so build_assets.py can be rerun freely.
Outputs newer than their source are skipped, so a rerun only converts what
changed.

    python scripts/build_curated_media.py
"""
import json
import subprocess
import sys
from concurrent.futures import ThreadPoolExecutor
from pathlib import Path

sys.path.insert(0, str(Path(__file__).resolve().parent))
from build_assets import FFMPEG, TONEMAP_CHAIN, image_size, is_hdr, run_ffmpeg, TMP_DIR  # noqa: E402

ROOT = Path(__file__).resolve().parent.parent
ASSETS = ROOT / "assets"
NEW = "assets/NewAssets/Projects"

# Web budget. Long side, not width: a portrait phone clip limited by width
# alone stays 1080x1920, which is most of the weight of a page.
IMG_LONG_SIDE = 1600
VIDEO_LONG_SIDE = 1280
POSTER_LONG_SIDE = 1080
MAX_VIDEO_SECONDS = 20
VIDEO_CRF = "27"

# name -> source path (relative to the site root). A ".MOV/.mp4" becomes a
# clip; everything else a still. Prefix a name with "still:" in the value
# (a tuple) to take a single frame out of a clip instead.
CURATED = {
    "jishnu/sobha": {
        "thumbs": [
            f"{NEW}/SobhaRealty/Thumbnails/WhatsApp Image 2026-09-16 at 5.27.59 PM.jpeg",
            f"{NEW}/SobhaRealty/Thumbnails/WhatsApp Video 2026-09-16 at 5.28.14 PM.mp4",
        ],
        "items": {
            # The visualisations, from the original project folder.
            "viz-1": "Jishnu/Sobha/Photos-1-001(5)/1BCDCB5D-0095-412E-9290-F7C5A32993F0.mp4",
            "viz-2": "Jishnu/Sobha/Photos-1-001(5)/AAE37A0B-C9CA-4506-9E87-61B2DB6E6666.mp4",
            "viz-3": "Jishnu/Sobha/Photos-1-001(5)/E612E68E-ACFF-4063-8EBE-017EEC2D0742.mp4",
            "viz-4": "Jishnu/Sobha/Photos-1-001(5)/IMG_3116.MOV",
            # The finished set, from NewAssets.
            "set-still": f"{NEW}/SobhaRealty/WhatsApp Image 2026-09-16 at 5.27.59 PM.jpeg",
            "set-1": f"{NEW}/SobhaRealty/WhatsApp Video 2026-09-16 at 5.28.14 PM.mp4",
            "set-2": f"{NEW}/SobhaRealty/WhatsApp Video 2026-09-16 at 5.27.58 PM.mp4",
            "set-3": f"{NEW}/SobhaRealty/WhatsApp Video 2026-09-16 at 5.28.48 PM.mp4",
            "set-4": f"{NEW}/SobhaRealty/WhatsApp Video 2026-09-16 at 5.29.23 PM.mp4",
            "set-5": f"{NEW}/SobhaRealty/WhatsApp Video 2026-09-16 at 6.44.00 PM.mp4",
        },
    },
    "onebyzero/echoesofearth": {
        "items": {
            "wholespace": "assets/onebyzero/echoesofearth/IMG_1678.HEIC",
            "beepod-1": "assets/onebyzero/echoesofearth/IMG_1636.HEIC",
            "beepod-2": "assets/onebyzero/echoesofearth/IMG_1674.MOV",
            "beepod-3": "assets/onebyzero/echoesofearth/WhatsApp Video 2026-09-09 at 9.17.26 PM.mp4",
            "wasp-1": "assets/onebyzero/echoesofearth/vid-01.mp4",
            "wasp-2": "assets/onebyzero/echoesofearth/vid-02.mp4",
            "neel-1": "assets/onebyzero/echoesofearth/IMG_1673.MOV",
            # Under a second long -- a Live Photo's motion, not a clip.
            "neel-2": ("still", "assets/onebyzero/echoesofearth/IMG_1672.MOV"),
            "tree-1": "assets/onebyzero/echoesofearth/IMG_1623.HEIC",
            "process-1": "assets/onebyzero/echoesofearth/IMG_1634.HEIC",
            "process-2": "assets/onebyzero/echoesofearth/IMG_1624.HEIC",
            "card-1": f"{NEW}/Echoes/Card1.jpg",
            "card-2": f"{NEW}/Echoes/Card2.jpg",
            "crowd-1": "assets/onebyzero/echoesofearth/IMG_1631.HEIC",
            "clip-1664": "assets/onebyzero/echoesofearth/IMG_1664.MOV",
            "clip-1668": "assets/onebyzero/echoesofearth/IMG_1668.MOV",
            "clip-1670": "assets/onebyzero/echoesofearth/IMG_1670.MOV",
            "clip-1675": "assets/onebyzero/echoesofearth/IMG_1675.MOV",
        },
    },
    "onebyzero/nodeshed": {
        "items": {
            "signal": f"{NEW}/Nodeshed/[ 1 -- 0 ]█ ▊ ██ █ ▊E R R O R _ L O G - 0 0 1‹‹ signal received ››.mp4",
            "buddhabowl": "assets/onebyzero/nodeshed/IMG_3084.MOV",
            "balleballe": "assets/onebyzero/nodeshed/IMG_3035.MOV",
            "ledwalls": "assets/onebyzero/nodeshed/IMG_3071.MOV",
            "onlyfans": "assets/onebyzero/nodeshed/IMG_3052.MOV",
            "g-3026": "assets/onebyzero/nodeshed/IMG_3026.PNG",
            "g-3031": "assets/onebyzero/nodeshed/IMG_3031.HEIC",
            "g-3063": "assets/onebyzero/nodeshed/IMG_3063.JPG",
            "g-3074": "assets/onebyzero/nodeshed/IMG_3074.MOV",
            # Later stretches of the Only Fans clip and the other painting
            # take, for the gallery (the story already uses the openings).
            "onlyfans-2": ("at:34", "assets/onebyzero/nodeshed/IMG_3052.MOV"),
            "painting-2": ("at:24", "assets/onebyzero/nodeshed/IMG_3042(1).MOV"),
        },
    },
    # The best of the night's clips, one set per floor: roof projections in
    # the Conservatory (NewAssets), the Middle Room sign and the Courtyard's
    # LED wall (raw folder).
    "onebyzero/middleroom": {
        "items": {
            "roof-tunnel": f"{NEW}/MiddleRoom/VID_20260719_233237899.mp4",
            "roof-lava": f"{NEW}/MiddleRoom/VID_20260719_234223858.mp4",
            "roof-cells": f"{NEW}/MiddleRoom/VID_20260719_235210121.mp4",
            "r-9437": "assets/onebyzero/middleroom/IMG_9437.MOV",
            "r-9444": "assets/onebyzero/middleroom/IMG_9444.MOV",
        },
    },
    # Card plates only: the lightboard, then stills from the film itself
    # (frames at 17.5s, 42.5s and 22.5s of youtu.be/8thJDYB_lSU). None of the
    # drawings -- those belong to the write-up.
    "jishnu/emasculatedman": {
        "thumbs": [
            "assets/jishnu/emasculatedman/img-08.jpg",
            f"{NEW}/A Slightly Emasculated Man/Thumbnail/film-17.5s.jpg",
            f"{NEW}/A Slightly Emasculated Man/Thumbnail/film-42.5s.jpg",
            f"{NEW}/A Slightly Emasculated Man/Thumbnail/film-22.5s.jpg",
        ],
    },
    # The two prototype clips: the arm carrying the TV's own cardboard box
    # first, to prove the cable run before anything with a screen went on it.
    "jishnu/fucknrobot": {
        "items": {
            "proto-box": f"{NEW}/Robot/Prototype.MOV",
            "proto-screen": f"{NEW}/Robot/Prototype (2).MOV",
        },
    },
    # Phone clips from the floor at Warehouse Project, dropped straight into
    # the asset folder rather than the source one.
    "gmmbbq/joyorbisonwhp": {
        "items": {
            **{f"jo-{n}": f"assets/gmmbbq/joyorbisonwhp/IMG_{n}.MOV" for n in (
                "3395", "3409", "3441", "3445", "3447", "3449", "3454", "3465", "3466")},
            "jo-still": "GMMBBQ/JoyOrbisonWHP/Photos/IMG_3474.heic",
        },
    },
    # The learn page (facilitation.html): student work from the JKLU course,
    # all of it dropped into assets/Learn/JKLU/. Named after the piece rather
    # than the file, and the student is kept in the name so the page can say
    # whose it is. Matchpoint's first seconds are the curtain before the
    # projection comes up.
    "jishnu/jklu": {
        "items": {
            "tarotlumen": "assets/Learn/JKLU/Barkha_TarotLumen.mp4",
            "tarotlumen-still": "assets/Learn/JKLU/Barkha_TarotLumen.jpg",
            "cymora-1": "assets/Learn/JKLU/Maulika_Cymora.mp4",
            "cymora-2": "assets/Learn/JKLU/Maulika_Cymora (2).mp4",
            "unrealcurrents": "assets/Learn/JKLU/Megha_UnrealCurrents.MOV",
            "whenyouarrive-1": "assets/Learn/JKLU/Priyani_When  YouArrive.mp4",
            "whenyouarrive-2": "assets/Learn/JKLU/Priyani_WhenYouArrive2.mp4",
            # Full width on the learn page, so it keeps its full 1920.
            "lingert": ("long:1920", "assets/Learn/JKLU/Lingert.MOV"),
            "matchpoint": ("at:6", "assets/Learn/JKLU/Matchpoint.MOV"),
            "matchpoint-still": "assets/Learn/JKLU/Matchpoint.JPG",
        },
    },
    # Navarasa, from the new media design course at Strate. Its files sit in
    # the JKLU drop folder with the rest.
    "jishnu/strate": {
        "items": {
            "navarasa": ("at:5", "assets/Learn/JKLU/Navrasa.MOV"),
            "navarasa-still": "assets/Learn/JKLU/Strate_Navarasa.HEIC",
        },
    },
    # Someone at the wall, touching it -- the clip the project's screen on
    # work leads with. Thirty seconds in, past the walk up to it.
    "jishnu/unconference": {
        "items": {
            "touch-1": ("at:30", "Jishnu/Unconference/Photos-1-001(4)/IMG_3556.MOV"),
        },
    },
    # NewAssets only, every file once.
    "onebyzero/sixthsense": {
        "thumbs": [
            f"{NEW}/6thSense/Thumbnails/img-08.jpg",
            f"{NEW}/6thSense/IMG_4241.MOV",
        ],
        "items": {
            **{f"img-{n}": f"{NEW}/6thSense/img-{n}.jpg" for n in ("06", "08")},
            **{f"p-{n}": f"{NEW}/6thSense/IMG_{n}.JPG" for n in ("4240", "4243")},
            **{f"v-{n}": f"{NEW}/6thSense/IMG_{n}.MOV" for n in (
                "4209", "4216", "4223", "4226",
                "4230", "4231", "4232", "4238", "4241", "4242", "4244")},
        },
    },
}

VIDEO_EXTS = {".mov", ".mp4"}


def long_side_scale(n):
    # Fit the long side to n, never upscale, keep both sides even.
    return (f"scale='if(gte(iw,ih),min({n},iw),-2)':'if(gte(iw,ih),-2,min({n},ih))'")


def fresh(dst: Path, src: Path) -> bool:
    return dst.exists() and dst.stat().st_mtime >= src.stat().st_mtime


def still_from(src: Path, dst: Path, long_side: int, seek: float = 0.0) -> bool:
    """One frame, two passes: HEIC tile grids choke when a scale filter is
    combined with their implicit tile reconstruction (see build_assets.py)."""
    TMP_DIR.mkdir(parents=True, exist_ok=True)
    raw = TMP_DIR / (dst.stem + "-raw.png")
    args = ["-ss", str(seek)] if seek else []
    vf = ["-vf", TONEMAP_CHAIN] if src.suffix.lower() in VIDEO_EXTS and is_hdr(src) else []
    ok = run_ffmpeg([*args, "-i", str(src), *vf, "-frames:v", "1", "-update", "1", str(raw)])
    if not ok or not raw.exists():
        return False
    ok = run_ffmpeg(["-i", str(raw), "-vf", long_side_scale(long_side),
                     "-frames:v", "1", "-update", "1", "-q:v", "5", str(dst)])
    raw.unlink(missing_ok=True)
    return ok


# HDR to SDR for clips, on the GPU with perceptual gamut mapping. The zscale
# chain (TONEMAP_CHAIN) clips an iPhone's bt2020 colour into bt709, which
# turned a red-lit room into a flat red sheet; libplacebo keeps the
# gradations. Needs an ffmpeg with libplacebo and a Vulkan device.
HDR_CLIP_CHAIN = ("libplacebo=colorspace=bt709:color_primaries=bt709:color_trc=bt709:range=tv"
                  ":tonemapping=auto:gamut_mode=perceptual:format=yuv420p")


def clip(src: Path, dst: Path, seek: float = 0.0, long_side: int = VIDEO_LONG_SIDE) -> bool:
    hdr = is_hdr(src)
    chain = (HDR_CLIP_CHAIN + "," if hdr else "") + long_side_scale(long_side) + ",fps=30"
    chain += ",format=yuv420p"
    return run_ffmpeg([
        *(["-init_hw_device", "vulkan"] if hdr else []),
        *(["-ss", str(seek)] if seek else []),
        "-i", str(src), "-t", str(MAX_VIDEO_SECONDS), "-vf", chain,
        "-c:v", "libx264", "-preset", "slow", "-crf", VIDEO_CRF,
        "-pix_fmt", "yuv420p", "-profile:v", "high",
        "-c:a", "aac", "-b:a", "96k", "-ac", "2",
        "-movflags", "+faststart", str(dst),
    ])


def job(key, name, spec):
    """Convert one entry. Returns (name, record) or (name, None)."""
    mode = "auto"
    if isinstance(spec, tuple):
        mode, spec = spec
    src = ROOT / spec
    out_dir = ASSETS / key
    rel = lambda p: p.relative_to(ROOT).as_posix()
    if not src.exists():
        # The source has gone but what was made from it is still here: keep
        # it. Dropping the record took the clip off every page that named it.
        clip_out, poster_out = out_dir / f"c-{name}.mp4", out_dir / f"c-{name}-poster.jpg"
        still_out = out_dir / f"c-{name}.jpg"
        if clip_out.exists() and poster_out.exists():
            print(f"  kept  {key} {name} (source gone: {spec})")
            wh = image_size(poster_out)
            return name, {"type": "video", "src": rel(clip_out), "poster": rel(poster_out),
                          "size": list(wh) if wh else None}
        if still_out.exists():
            print(f"  kept  {key} {name} (source gone: {spec})")
            wh = image_size(still_out)
            return name, {"type": "image", "src": rel(still_out), "size": list(wh) if wh else None}
        print(f"  MISSING {key} {name}: {spec}")
        return name, None
    out_dir.mkdir(parents=True, exist_ok=True)

    # ("at:30", path): the clip, but starting 30 seconds in -- for a second
    # stretch of a video whose first twenty seconds are already used.
    seek = float(mode[3:]) if mode.startswith("at:") else 0.0
    # ("long:1920", path): the clip at a bigger size than VIDEO_LONG_SIDE, for
    # one that is shown across the whole width of a page.
    long_side = int(mode[5:]) if mode.startswith("long:") else VIDEO_LONG_SIDE
    if (mode == "auto" or seek or mode.startswith("long:")) and src.suffix.lower() in VIDEO_EXTS:
        dst = out_dir / f"c-{name}.mp4"
        poster = out_dir / f"c-{name}-poster.jpg"
        if not fresh(dst, src):
            print(f"  clip  {key} {name} <- {src.name}")
            if not clip(src, dst, seek, long_side):
                return name, None
        if not fresh(poster, src):
            still_from(dst, poster, POSTER_LONG_SIDE, 0.3)
        wh = image_size(poster)
        return name, {"type": "video", "src": rel(dst), "poster": rel(poster),
                      "size": list(wh) if wh else None}

    dst = out_dir / f"c-{name}.jpg"
    if not fresh(dst, src):
        print(f"  still {key} {name} <- {src.name}")
        seek = 0.3 if src.suffix.lower() in VIDEO_EXTS else 0.0
        if not still_from(src, dst, IMG_LONG_SIDE, seek):
            return name, None
    wh = image_size(dst)
    return name, {"type": "image", "src": rel(dst), "size": list(wh) if wh else None}


def main():
    sys.stdout.reconfigure(encoding="utf-8", errors="replace")
    if not Path(FFMPEG).exists():
        print("ffmpeg not found at", FFMPEG)
        return 1
    out = {}
    with ThreadPoolExecutor(max_workers=3) as pool:
        for key, conf in CURATED.items():
            items = conf.get("items", {})
            futures = [pool.submit(job, key, n, s) for n, s in items.items()]
            thumbs = [pool.submit(job, key, f"thumb-{i:02d}", ("still", s) if Path(s).suffix.lower() in VIDEO_EXTS else s)
                      for i, s in enumerate(conf.get("thumbs", []), start=1)]
            rec = {"items": {}}
            for f in futures:
                name, r = f.result()
                if r:
                    rec["items"][name] = r
            if thumbs:
                rec["thumbs"] = [r["src"] for _, r in (t.result() for t in thumbs) if r]
            out[key] = rec

    js = ("// generated by scripts/build_curated_media.py -- do not hand-edit.\n"
          "// Named media per project; see that script for the source of each.\n"
          "const CURATED_MEDIA = " + json.dumps(out, indent=2, ensure_ascii=False) + ";\n")
    (ASSETS / "curated-media.js").write_text(js, encoding="utf-8")
    n = sum(len(v["items"]) for v in out.values())
    print(f"Wrote assets/curated-media.js ({n} items)")
    return 0


if __name__ == "__main__":
    sys.exit(main())
