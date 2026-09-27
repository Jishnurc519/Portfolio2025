#!/usr/bin/env python3
"""Bring the web media already under assets/ down to one fast, playable budget.

    python scripts/optimize_web_media.py            # do it
    python scripts/optimize_web_media.py --dry-run  # just report

What counts as "needs work":
  vid-*.mp4  -- long side over 1280, not 8-bit yuv420p (a 10-bit High 10
                stream plays in Chrome and nowhere else), still tagged HLG/PQ
                (tonemapped to bt709 here), or over 3 MB. Re-encoded with the
                same settings as build_curated_media.py and its poster redrawn
                from the new file, so the still matches the clip it fronts.
  *.jpg      -- long side over 1600 or heavier than 300 KB. Kept only if the
                re-encode is actually smaller.

Files are replaced in place under their own names, so nothing that points at
them changes -- except the pixel sizes recorded in assets/manifest.js, which
are rewritten here to match. Raw camera files (HEIC/MOV), assets/NewAssets and
curated c-* outputs are left alone.
"""
import json
import os
import re
import subprocess
import sys
from pathlib import Path

sys.path.insert(0, str(Path(__file__).resolve().parent))
from build_assets import FFPROBE, image_size  # noqa: E402
from build_curated_media import (  # noqa: E402
    ASSETS, ROOT, IMG_LONG_SIDE, POSTER_LONG_SIDE, VIDEO_LONG_SIDE, clip, still_from,
)

MAX_VIDEO_BYTES = 3 * 1024 * 1024
MAX_JPG_BYTES = 300 * 1024
HDR = {"arib-std-b67", "smpte2084"}


def probe(path: Path):
    out = subprocess.run(
        [FFPROBE, "-v", "error", "-select_streams", "v:0",
         "-show_entries", "stream=width,height,pix_fmt,color_transfer:stream_side_data=rotation",
         "-of", "json", str(path)], capture_output=True, text=True).stdout
    s = (json.loads(out or "{}").get("streams") or [{}])[0]
    return s


def video_reasons(path: Path):
    s = probe(path)
    why = []
    if max(s.get("width", 0), s.get("height", 0)) > VIDEO_LONG_SIDE:
        why.append(f"{s.get('width')}x{s.get('height')}")
    if s.get("pix_fmt") != "yuv420p":
        why.append(s.get("pix_fmt", "?"))
    if s.get("color_transfer") in HDR:
        why.append(s["color_transfer"])
    if path.stat().st_size > MAX_VIDEO_BYTES:
        why.append(f"{path.stat().st_size // 1024}K")
    return why


def targets():
    for p in sorted(ASSETS.glob("*/*/*")):
        if "NewAssets" in p.parts or p.name.startswith("c-") or not re.match(r"(img|thumb|vid)-\d+", p.name):
            continue
        yield p


def main():
    sys.stdout.reconfigure(encoding="utf-8", errors="replace")
    dry = "--dry-run" in sys.argv
    tmp = ROOT / "scripts" / "_tmp"
    tmp.mkdir(parents=True, exist_ok=True)
    before = after = 0

    for p in targets():
        if re.fullmatch(r"vid-\d+\.mp4", p.name):
            why = video_reasons(p)
            if not why:
                continue
            print(f"  video {p.relative_to(ROOT).as_posix()}: {', '.join(why)}")
            if dry:
                continue
            out = tmp / p.name
            if not clip(p, out):
                continue
            before += p.stat().st_size
            after += out.stat().st_size
            os.replace(out, p)
            poster = p.with_name(p.stem + "-poster.jpg")
            still_from(p, poster, POSTER_LONG_SIDE, 0.3)

    for p in targets():
        if p.suffix.lower() != ".jpg" or re.fullmatch(r"vid-\d+-poster\.jpg", p.name) and p.stat().st_size < MAX_JPG_BYTES:
            continue
        wh = image_size(p) or (0, 0)
        if max(wh) <= IMG_LONG_SIDE and p.stat().st_size <= MAX_JPG_BYTES:
            continue
        print(f"  still {p.relative_to(ROOT).as_posix()}: {wh[0]}x{wh[1]} {p.stat().st_size // 1024}K")
        if dry:
            continue
        out = tmp / p.name
        if still_from(p, out, IMG_LONG_SIDE) and out.stat().st_size < p.stat().st_size:
            before += p.stat().st_size
            after += out.stat().st_size
            os.replace(out, p)
        else:
            out.unlink(missing_ok=True)

    if dry:
        return 0

    # Keep the manifest's recorded dimensions true to the files.
    mpath = ASSETS / "manifest.js"
    text = mpath.read_text(encoding="utf-8")
    manifest = json.loads(text[text.index("{"):text.rindex("}") + 1])
    changed = 0
    for entry in manifest.values():
        for rel in list(entry.get("sizes", {})):
            wh = image_size(ROOT / rel)
            if wh and list(wh) != entry["sizes"][rel]:
                entry["sizes"][rel] = list(wh)
                changed += 1
    mpath.write_text("const SITE_MANIFEST = " + json.dumps(manifest, indent=2) + ";\n", encoding="utf-8")
    print(f"\n{before // 1024} KB -> {after // 1024} KB across rewritten files; "
          f"{changed} manifest sizes updated")
    return 0


if __name__ == "__main__":
    sys.exit(main())
