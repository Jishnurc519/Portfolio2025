#!/usr/bin/env python3
"""Convert raw category/project media into web-ready assets + assets/manifest.js.

Source layout:  <ROOT>/<Category>/<Project>/**/*.{HEIC,JPG,PNG,GIF,MOV,MP4}
                <ROOT>/<Category>/<Project>/Thumbnails/*  -- optional, see below
Output layout:  <ROOT>/assets/<category-slug>/<project-slug>/{thumb-NN.jpg, img-NN.jpg,
                vid-NN.mp4, vid-NN-poster.jpg}

Live Photo pairs (same basename, one image + one .mp4) are collapsed to just the image,
since the .mp4 is only the motion component, not a distinct clip.

GIFs are copied through rather than converted, so they keep their animation.

A `Thumbnails/` folder picks what leads: its files become thumb-NN.jpg at the
head of the gallery, the first of them becomes the card's plate and the share
image, and the next two are what the card's stack fans out to. Put a JPEG of
the frame you want in there, not the clip it came from.
"""
import json
import shutil
import struct
import re
import subprocess
import sys
import tempfile
from pathlib import Path

ROOT = Path(__file__).resolve().parent.parent
FFMPEG = r"C:\Users\jishn\AppData\Local\Microsoft\WinGet\Packages\Gyan.FFmpeg_Microsoft.Winget.Source_8wekyb3d8bbwe\ffmpeg-9.0-full_build\bin\ffmpeg.exe"
FFPROBE = str(Path(FFMPEG).with_name("ffprobe.exe"))
ASSETS_DIR = ROOT / "assets"
TMP_DIR = ROOT / "scripts" / "_tmp"

IMAGE_EXTS = {".heic", ".jpg", ".jpeg", ".png", ".gif"}
# A GIF is the one still that is also a clip. Re-encoding it to a JPEG throws
# the animation away, so these are copied through untouched and keep their
# own extension in the manifest -- the gallery and the cards both render a
# still with an <img>, which plays a GIF without being asked to.
PASSTHROUGH_EXTS = {".gif"}
VIDEO_EXTS = {".mov", ".mp4"}

MAX_IMAGES = 8
MAX_VIDEOS = 2
# A card shows three plates fanned out. More than that in a Thumbnails/ folder
# is never seen as a thumbnail, so the rest would only be gallery images that
# happened to come in through the wrong door.
MAX_THUMBS = 3
MAX_VIDEO_SECONDS = 20
IMG_MAX_WIDTH = 1600
VIDEO_MAX_WIDTH = 1280

CATEGORIES = ["GMMBBQ", "Jishnu", "OnebyZero"]


JPEG_SOF_MARKERS = set(range(0xC0, 0xD0)) - {0xC4, 0xC8, 0xCC}


def image_size(path: Path):
    """(width, height) of a JPEG, PNG or GIF, read from its header.

    Recorded into the manifest as `sizes` so the project pages can set
    width/height on every still. Without it each image reflows the page as it
    arrives, which on a nine-image gallery is nine jumps under the reader.
    Header parsing rather than Pillow, because nothing else here needs a
    dependency.
    """
    try:
        with open(path, "rb") as f:
            head = f.read(8)
            if head == b"\x89PNG\r\n\x1a\n":
                f.seek(16)
                return struct.unpack(">II", f.read(8))
            if head[:6] in (b"GIF87a", b"GIF89a"):
                f.seek(6)
                return struct.unpack("<HH", f.read(4))
            if head[:2] != b"\xff\xd8":
                return None
            f.seek(2)
            while True:
                byte = f.read(1)
                if not byte:
                    return None
                if byte != b"\xff":
                    continue
                while byte == b"\xff":
                    byte = f.read(1)
                marker = byte[0]
                if marker in (0xD8, 0x01) or 0xD0 <= marker <= 0xD7:
                    continue
                raw = f.read(2)
                if len(raw) < 2:
                    return None
                seglen = struct.unpack(">H", raw)[0]
                if marker in JPEG_SOF_MARKERS:
                    seg = f.read(5)
                    if len(seg) < 5:
                        return None
                    height, width = struct.unpack(">HH", seg[1:5])
                    return (width, height)
                f.seek(seglen - 2, 1)
    except OSError:
        return None


def long_side(n: int) -> str:
    """A scale filter that fits the LONG side to n, never upscales, and keeps
    both sides even. Width alone let every portrait phone clip through at
    1080x1920 -- most of the weight of the site."""
    return f"scale='if(gte(iw,ih),min({n},iw),-2)':'if(gte(iw,ih),-2,min({n},ih))'"


def slugify(name: str) -> str:
    return re.sub(r"[^a-z0-9]", "", name.lower())


def run_ffmpeg(args):
    result = subprocess.run(
        [FFMPEG, "-y", "-hide_banner", "-loglevel", "error", *args],
        capture_output=True, text=True,
    )
    if result.returncode != 0:
        print(f"    ffmpeg FAILED: {' '.join(args)}\n    {result.stderr.strip()[:500]}")
        return False
    return True


def collect_thumbs(project_dir: Path):
    """The pictures a project wants on its card, in the order it wants them.

    A project says so by putting them in a `Thumbnails/` folder of its own (or
    `Thumbnail/`) next to its media. The first one becomes the manifest's
    `thumb` -- the plate on the card and the share image -- and the rest are
    what the card's stack fans out to underneath it.

    This exists because the default is "whatever sorted first", which is an
    accident of filenames rather than a choice, and the best frame of a project
    is very often not in the gallery at all: it is a still lifted out of a
    clip. Put that still here and it leads.

    Frames, not footage: drop a JPEG of the frame you want into the folder
    rather than the 50MB clip it came out of, and the choice is recorded
    rather than re-derived.
    """
    for name in ("Thumbnails", "Thumbnail"):
        d = project_dir / name
        if d.is_dir():
            return sorted(
                p for p in d.iterdir()
                if p.is_file() and p.suffix.lower() in IMAGE_EXTS
            )
    return []


def collect_media(project_dir: Path):
    """Return (images, videos) as sorted lists of Paths, deduping Live Photo pairs.

    `Thumbnails/` is skipped: collect_thumbs owns it, and a still that is
    already leading the gallery should not also turn up in the middle of it.
    """
    skip = {"thumbnails", "thumbnail"}
    all_files = sorted(
        p for p in project_dir.rglob("*")
        if p.is_file() and p.suffix.lower() in IMAGE_EXTS | VIDEO_EXTS
        and not any(part.lower() in skip for part in p.relative_to(project_dir).parts[:-1])
    )
    by_key = {}
    for p in all_files:
        key = (p.parent, p.stem.lower())
        by_key.setdefault(key, []).append(p)

    images, videos = [], []
    for key, group in sorted(by_key.items(), key=lambda kv: str(kv[1][0])):
        imgs = [p for p in group if p.suffix.lower() in IMAGE_EXTS]
        vids = [p for p in group if p.suffix.lower() in VIDEO_EXTS]
        if imgs:
            images.append(imgs[0])  # Live Photo companion video (if any) is skipped
        elif vids:
            videos.append(vids[0])
    return images, videos


def convert_image(src: Path, dst: Path) -> bool:
    """Two-pass: HEIC tile-grid sources choke when -vf is combined with the
    implicit tile-reconstruction filtergraph, so extract the raw frame first,
    then resize that as a plain JPEG."""
    dst.parent.mkdir(parents=True, exist_ok=True)
    TMP_DIR.mkdir(parents=True, exist_ok=True)
    with tempfile.TemporaryDirectory(dir=str(TMP_DIR)) as tmp:
        raw = Path(tmp) / "raw.jpg"
        if not run_ffmpeg(["-i", str(src), "-update", "1", "-frames:v", "1", "-q:v", "4", str(raw)]):
            return False
        return run_ffmpeg([
            "-i", str(raw),
            "-vf", long_side(IMG_MAX_WIDTH),
            "-update", "1", "-frames:v", "1", "-q:v", "4",
            str(dst),
        ])


HDR_TRANSFERS = {"arib-std-b67", "smpte2084"}  # HLG and PQ

# HLG/PQ sources decode to 10-bit. Handing that straight to libx264 yields a
# High 10 stream, which no browser can decode (the video reads as "corrupted"),
# and a naive 8-bit squash washes the picture out. Tonemap to bt709 instead.
TONEMAP_CHAIN = (
    "zscale=t=linear:npl=100,format=gbrpf32le,zscale=p=bt709,"
    "tonemap=tonemap=hable:desat=0,zscale=t=bt709:m=bt709:r=tv,format=yuv420p"
)


def is_hdr(src: Path) -> bool:
    result = subprocess.run(
        [FFPROBE, "-v", "error", "-select_streams", "v:0",
         "-show_entries", "stream=color_transfer", "-of", "csv=p=0", str(src)],
        capture_output=True, text=True,
    )
    return result.stdout.strip().lower() in HDR_TRANSFERS


def video_filter(src: Path) -> str:
    chain = long_side(VIDEO_MAX_WIDTH)
    return f"{chain},{TONEMAP_CHAIN}" if is_hdr(src) else f"{chain},format=yuv420p"


def convert_video(src: Path, dst: Path, poster_dst: Path) -> bool:
    dst.parent.mkdir(parents=True, exist_ok=True)
    vf = video_filter(src)
    ok = run_ffmpeg([
        "-i", str(src),
        "-t", str(MAX_VIDEO_SECONDS),
        "-vf", vf,
        "-c:v", "libx264", "-preset", "veryfast", "-crf", "26",
        "-pix_fmt", "yuv420p", "-profile:v", "high",
        "-c:a", "aac", "-b:a", "128k", "-movflags", "+faststart",
        str(dst),
    ])
    if ok:
        run_ffmpeg([
            "-i", str(src), "-ss", "0.3",
            "-vf", vf,
            "-frames:v", "1", "-q:v", "4",
            str(poster_dst),
        ])
    return ok


def main():
    videos_only = "--videos-only" in sys.argv  # reuse already-built jpgs
    manifest = {}
    for category in CATEGORIES:
        cat_dir = ROOT / category
        if not cat_dir.is_dir():
            continue
        cat_slug = slugify(category)
        for project_dir in sorted(p for p in cat_dir.iterdir() if p.is_dir()):
            proj_name = project_dir.name
            proj_slug = slugify(proj_name)
            key = f"{cat_slug}/{proj_slug}"
            print(f"== {key} ({proj_name}) ==")

            thumbs = collect_thumbs(project_dir)[:MAX_THUMBS]
            images, videos = collect_media(project_dir)
            images = images[:MAX_IMAGES]
            videos = videos[:MAX_VIDEOS]

            out_dir = ASSETS_DIR / cat_slug / proj_slug
            entry_images, entry_videos = [], []

            # The chosen plates first, so they are what `thumb` and the card's
            # stack pick up, and so they read as the opening of the gallery
            # rather than as an interruption somewhere down it.
            for i, src in enumerate(thumbs, start=1):
                dst = out_dir / f"thumb-{i:02d}.jpg"
                rel = dst.relative_to(ROOT).as_posix()
                if videos_only and dst.exists():
                    entry_images.append(rel)
                    continue
                print(f"  thumb {i}/{len(thumbs)}: {src.name} -> {rel}")
                if convert_image(src, dst):
                    entry_images.append(rel)

            for i, src in enumerate(images, start=1):
                suffix = src.suffix.lower() if src.suffix.lower() in PASSTHROUGH_EXTS else ".jpg"
                dst = out_dir / f"img-{i:02d}{suffix}"
                rel = dst.relative_to(ROOT).as_posix()
                if videos_only and dst.exists():
                    entry_images.append(rel)
                    continue
                print(f"  image {i}/{len(images)}: {src.name} -> {rel}")
                if suffix in PASSTHROUGH_EXTS:
                    dst.parent.mkdir(parents=True, exist_ok=True)
                    shutil.copyfile(src, dst)
                    entry_images.append(rel)
                elif convert_image(src, dst):
                    entry_images.append(rel)

            for i, src in enumerate(videos, start=1):
                dst = out_dir / f"vid-{i:02d}.mp4"
                poster_dst = out_dir / f"vid-{i:02d}-poster.jpg"
                rel = dst.relative_to(ROOT).as_posix()
                poster_rel = poster_dst.relative_to(ROOT).as_posix()
                print(f"  video {i}/{len(videos)}: {src.name} -> {rel}")
                if convert_video(src, dst, poster_dst):
                    entry_videos.append({"src": rel, "poster": poster_rel})

            thumb = entry_images[0] if entry_images else (
                entry_videos[0]["poster"] if entry_videos else None
            )

            stills = list(entry_images)
            stills += [v["poster"] for v in entry_videos if v.get("poster")]
            if thumb:
                stills.append(thumb)
            sizes = {}
            for rel in dict.fromkeys(stills):
                wh = image_size(ROOT / rel)
                if wh:
                    sizes[rel] = [wh[0], wh[1]]

            manifest[key] = {
                "name": proj_name,
                "category": category,
                "thumb": thumb,
                "images": entry_images,
                "videos": entry_videos,
                "sizes": sizes,
            }

    manifest_js = "const SITE_MANIFEST = " + json.dumps(manifest, indent=2) + ";\n"
    (ASSETS_DIR).mkdir(parents=True, exist_ok=True)
    (ASSETS_DIR / "manifest.js").write_text(manifest_js, encoding="utf-8")
    print(f"\nWrote {ASSETS_DIR / 'manifest.js'} with {len(manifest)} projects")

    if TMP_DIR.exists():
        shutil.rmtree(TMP_DIR, ignore_errors=True)


if __name__ == "__main__":
    sys.exit(main())
