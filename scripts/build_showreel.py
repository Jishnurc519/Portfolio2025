"""Cut the front page's showreel: a fast run of the best clips on the site,
each on screen for under a second, joined into one short looping file.

    python scripts/build_showreel.py

Writes assets/showreel/reel-wide.mp4 (for landscape screens) and
reel-tall.mp4 (for portrait ones). Every cut is cropped to fill the frame, so
portrait and landscape sources mix freely in both.

Why one pre-cut file rather than cutting live in the browser: switching a
<video> to a new source every half second stalls on every switch while it
seeks, and preloading twenty full clips to cut from would put most of the
site's video on the front page. A dozen seconds already cut is one small
download that loops on its own. The sound comes with each cut (silence for a
clip that has none), faded for a few milliseconds at each end so the cuts do
not click, and levelled across the whole reel.

To change the reel, edit CUTS: the clip under assets/ (no extension), where in
it to start as a fraction of its length, and how long the cut lasts. Keep
every cut under a second, and alternate bright and dark, warm and cold, so
the cuts read as cuts.
"""
import json
import os
import subprocess
import sys
from pathlib import Path

ROOT = Path(__file__).resolve().parent.parent
OUT = ROOT / "assets" / "showreel"

# Same install the other build scripts use; on another machine, point this at
# any ffmpeg/ffprobe pair, or leave them on PATH.
FFMPEG_DIR = Path(r"C:\Users\jishn\AppData\Local\Microsoft\WinGet\Packages"
                  r"\Gyan.FFmpeg_Microsoft.Winget.Source_8wekyb3d8bbwe\ffmpeg-9.0-full_build\bin")
FFMPEG = str(FFMPEG_DIR / "ffmpeg.exe") if (FFMPEG_DIR / "ffmpeg.exe").exists() else "ffmpeg"
FFPROBE = str(FFMPEG_DIR / "ffprobe.exe") if (FFMPEG_DIR / "ffprobe.exe").exists() else "ffprobe"

# (clip, start as a fraction of its length, seconds on screen)
CUTS = [
    ("onebyzero/echoesofearth/c-neel-1",      0.30, 0.70),
    ("gmmbbq/joyorbisonwhp/c-jo-3441",        0.30, 0.45),
    ("onebyzero/middleroom/c-roof-lava",      0.30, 0.50),
    ("onebyzero/nodeshed/c-signal",           0.70, 0.40),
    ("gmmbbq/aliengarden/vid-01",             0.30, 0.65),
    ("onebyzero/nodeshed/c-ledwalls",         0.30, 0.55),
    ("jishnu/jklu/c-cymora-1",                0.30, 0.45),
    # Sobha as it was made: the TouchDesigner visualisation, then the set
    # itself, the ")S(" -- and Nodeshed's Rained In, the LED rain wall,
    # between them.
    ("jishnu/sobha/c-viz-1",                  0.70, 0.75),
    ("onebyzero/nodeshed/c-rained-in",        0.40, 0.70),
    ("jishnu/sobha/c-set-1",                  0.30, 0.70),
    ("gmmbbq/joyorbisonwhp/c-jo-3409",        0.70, 0.50),
    ("onebyzero/nodeshed/c-painting-2",       0.30, 0.60),
    ("onebyzero/middleroom/c-r-9437",         0.30, 0.45),
    ("jishnu/jklu/c-unrealcurrents",          0.70, 0.70),
    ("gmmbbq/bloom/vid-01",                   0.70, 0.50),
    ("gmmbbq/joyorbisonwhp/c-jo-3465",        0.30, 0.45),
    ("onebyzero/middleroom/c-roof-tunnel",    0.70, 0.55),
    ("jishnu/unconference/vid-02",            0.30, 0.60),
    ("onebyzero/nodeshed/c-g-3074",           0.70, 0.50),
    ("gmmbbq/burrow/vid-02",                  0.30, 0.70),
    ("onebyzero/echoesofearth/c-clip-1664",   0.30, 0.45),
    ("jishnu/strate/c-navarasa",              0.30, 0.60),
]

FORMATS = {
    "reel-wide.mp4": (960, 540),
    "reel-tall.mp4": (540, 960),
}
FPS = 30


def duration(src):
    out = subprocess.run(
        [FFPROBE, "-v", "error", "-show_entries", "format=duration", "-of", "csv=p=0", str(src)],
        capture_output=True, text=True, check=True).stdout.strip()
    return float(out)


def has_audio(src):
    out = subprocess.run(
        [FFPROBE, "-v", "error", "-select_streams", "a", "-show_entries", "stream=index",
         "-of", "csv=p=0", str(src)], capture_output=True, text=True).stdout.strip()
    return bool(out)


def build(name, w, h):
    args = [FFMPEG, "-v", "error", "-y"]
    filters = []
    silent = []   # cuts with no sound of their own get silence, inputs added after
    for i, (clip, at, secs) in enumerate(CUTS):
        if secs >= 1:
            sys.exit(f"{clip}: a cut must be under a second, not {secs}")
        src = ROOT / "assets" / f"{clip}.mp4"
        start = max(0.0, min(duration(src) - secs - 0.05, duration(src) * at))
        args += ["-ss", f"{start:.3f}", "-t", f"{secs:.3f}", "-i", str(src)]
        # Fill the frame whatever the source's shape, then normalise rate,
        # pixel shape and timing so the pieces concatenate cleanly.
        filters.append(
            f"[{i}:v]scale={w}:{h}:force_original_aspect_ratio=increase,crop={w}:{h},"
            f"fps={FPS},setsar=1,format=yuv420p,trim=duration={secs:.3f},setpts=PTS-STARTPTS[v{i}]")
        # The sound cuts with the picture. A few milliseconds of fade at each
        # end, or every cut is a click.
        a_in = f"[{i}:a]" if has_audio(src) else None
        if a_in is None:
            silent.append((i, secs))
            continue
        filters.append(
            f"{a_in}atrim=duration={secs:.3f},asetpts=PTS-STARTPTS,aresample=48000,"
            f"aformat=channel_layouts=stereo,afade=t=in:d=0.015,"
            f"afade=t=out:st={secs - 0.02:.3f}:d=0.02[a{i}]")
    for k, (i, secs) in enumerate(silent):
        args += ["-f", "lavfi", "-t", f"{secs:.3f}", "-i", "anullsrc=r=48000:cl=stereo"]
        filters.append(f"[{len(CUTS) + k}:a]asetpts=PTS-STARTPTS[a{i}]")
    joined = "".join(f"[v{i}][a{i}]" for i in range(len(CUTS)))
    filters.append(f"{joined}concat=n={len(CUTS)}:v=1:a=1[out][aj]")
    # One level for the whole reel, so a quiet clip and a loud one do not
    # jump out at each other every half second.
    filters.append("[aj]loudnorm=I=-18:TP=-1.5:LRA=11,aresample=48000[aout]")
    out = OUT / name
    # A keyframe at the start of every cut, and at least every half second:
    # the front page's hold jumps the playhead from cut to cut, and a jump to
    # a keyframe lands at once instead of decoding its way there.
    starts, t = [], 0.0
    for _, _, secs in CUTS:
        starts.append(round(t, 3))
        t += secs
    args += ["-filter_complex", ";".join(filters), "-map", "[out]", "-map", "[aout]",
             "-c:v", "libx264", "-preset", "slow", "-crf", "28", "-pix_fmt", "yuv420p",
             "-g", "15", "-force_key_frames", ",".join(str(s) for s in starts),
             "-c:a", "aac", "-b:a", "128k", "-movflags", "+faststart", str(out)]
    subprocess.run(args, check=True)
    total = sum(s for _, _, s in CUTS)
    print(f"  wrote {out.relative_to(ROOT)}  ({len(CUTS)} cuts, {total:.1f}s, "
          f"{os.path.getsize(out) / 1024:.0f} KB)")


def main():
    OUT.mkdir(parents=True, exist_ok=True)
    for name, (w, h) in FORMATS.items():
        build(name, w, h)
    # The reel's tempo, for the front page: its beat is the average length of
    # a cut, so the stutter on a hold (index.html) chops at the rate the reel
    # itself is cutting.
    durs = [s for _, _, s in CUTS]
    meta = {"beat": round(sum(durs) / len(durs), 4), "duration": round(sum(durs), 3),
            "cuts": [round(s, 3) for s in durs]}
    (OUT / "reel.json").write_text(json.dumps(meta, indent=1) + "\n", encoding="utf-8")
    print(f"  wrote assets/showreel/reel.json  (beat {meta['beat']}s, {60 / meta['beat']:.0f} bpm)")


if __name__ == "__main__":
    main()
