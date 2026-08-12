#!/usr/bin/env python3
"""Convert raw category/project media into web-ready assets + assets/manifest.js.

Source layout:  <ROOT>/<Category>/<Project>/**/*.{HEIC,JPG,PNG,MOV,MP4}
Output layout:  <ROOT>/assets/<category-slug>/<project-slug>/{img-NN.jpg, vid-NN.mp4, vid-NN-poster.jpg}

Live Photo pairs (same basename, one image + one .mp4) are collapsed to just the image,
since the .mp4 is only the motion component, not a distinct clip.
"""
import json
import re
import subprocess
import sys
import tempfile
from pathlib import Path

ROOT = Path(__file__).resolve().parent.parent
FFMPEG = r"C:\Users\jishn\AppData\Local\Microsoft\WinGet\Packages\Gyan.FFmpeg_Microsoft.Winget.Source_8wekyb3d8bbwe\ffmpeg-9.0-full_build\bin\ffmpeg.exe"
ASSETS_DIR = ROOT / "assets"
TMP_DIR = ROOT / "scripts" / "_tmp"

IMAGE_EXTS = {".heic", ".jpg", ".jpeg", ".png"}
VIDEO_EXTS = {".mov", ".mp4"}

MAX_IMAGES = 8
MAX_VIDEOS = 2
MAX_VIDEO_SECONDS = 20
IMG_MAX_WIDTH = 1600
VIDEO_MAX_WIDTH = 1280

CATEGORIES = ["GMMBBQ", "Jishnu", "OnebyZero"]


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


def collect_media(project_dir: Path):
    """Return (images, videos) as sorted lists of Paths, deduping Live Photo pairs."""
    all_files = sorted(
        p for p in project_dir.rglob("*")
        if p.is_file() and p.suffix.lower() in IMAGE_EXTS | VIDEO_EXTS
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
            "-vf", f"scale='min({IMG_MAX_WIDTH},iw)':'-2'",
            "-update", "1", "-frames:v", "1", "-q:v", "4",
            str(dst),
        ])


def convert_video(src: Path, dst: Path, poster_dst: Path) -> bool:
    dst.parent.mkdir(parents=True, exist_ok=True)
    ok = run_ffmpeg([
        "-i", str(src),
        "-t", str(MAX_VIDEO_SECONDS),
        "-vf", f"scale='min({VIDEO_MAX_WIDTH},iw)':'-2'",
        "-c:v", "libx264", "-preset", "veryfast", "-crf", "26",
        "-c:a", "aac", "-b:a", "128k", "-movflags", "+faststart",
        str(dst),
    ])
    if ok:
        run_ffmpeg([
            "-i", str(src), "-ss", "0.3",
            "-vf", f"scale='min({VIDEO_MAX_WIDTH},iw)':'-2'",
            "-frames:v", "1", "-q:v", "4",
            str(poster_dst),
        ])
    return ok


def main():
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

            images, videos = collect_media(project_dir)
            images = images[:MAX_IMAGES]
            videos = videos[:MAX_VIDEOS]

            out_dir = ASSETS_DIR / cat_slug / proj_slug
            entry_images, entry_videos = [], []

            for i, src in enumerate(images, start=1):
                dst = out_dir / f"img-{i:02d}.jpg"
                rel = dst.relative_to(ROOT).as_posix()
                print(f"  image {i}/{len(images)}: {src.name} -> {rel}")
                if convert_image(src, dst):
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

            manifest[key] = {
                "name": proj_name,
                "category": category,
                "thumb": thumb,
                "images": entry_images,
                "videos": entry_videos,
            }

    manifest_js = "const SITE_MANIFEST = " + json.dumps(manifest, indent=2) + ";\n"
    (ASSETS_DIR).mkdir(parents=True, exist_ok=True)
    (ASSETS_DIR / "manifest.js").write_text(manifest_js, encoding="utf-8")
    print(f"\nWrote {ASSETS_DIR / 'manifest.js'} with {len(manifest)} projects")

    if TMP_DIR.exists():
        import shutil
        shutil.rmtree(TMP_DIR, ignore_errors=True)


if __name__ == "__main__":
    sys.exit(main())
