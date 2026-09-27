#!/usr/bin/env python3
"""Cut the drawings and photographs out of the old portfolio PDF.

Two sets: A Slightly Emasculated Man (pages 51-60) and the Gamma Barbecue
pages (13-20) that gmmbbq.html is partly built from.

A Slightly Emasculated Man is laid out on the site the way it was laid out in
the PDF (Old Portfolio.pdf, pages 51-60): each slide is rebuilt as a
`spread` in assets/project-details.js, with the copy set as real text and
the drawings placed where they were on the page.

The drawings themselves are pencil and pen on white paper, so they are turned
over here: every pixel keeps only how much darker than the paper around it it
is, as alpha, and is painted the play section's --tone-light. What comes out is
pink line work on a transparent ground, which reads as ink on the page's own
dark instead of a white card dropped onto it.

Baked into the PNG rather than tinted with a CSS mask, because a CSS mask is a
CORS fetch and would fail on every page opened straight from disk.

    python scripts/build_slide_art.py      (needs PyMuPDF and Pillow)
"""
from pathlib import Path

import pymupdf as fitz
from PIL import Image, ImageChops, ImageDraw, ImageFilter

ROOT = Path(__file__).resolve().parent.parent
PDF = ROOT / "Old Portfolio.pdf"
OUT = ROOT / "assets" / "jishnu" / "emasculatedman"

# play.html's --tone-light. Change it there, change it here, rerun.
INK = (0xEE, 0xAA, 0xE8)
DPI = 300          # 2560 x 1600 per slide
OUT_W = 1600       # what ships
U = 2560 / 1000    # slide units (1000 x 625) -> render pixels

# page -> how to lift the drawing off it.
#   boxes: text on the slide, in slide units, blanked before tracing (the copy
#          is set as live text on top instead)
#   crop:  only this part of the slide is traced
#   mode:  "paper" for clean white-ground drawings, "photo" for drawings that
#          were photographed (uneven light), where paper is estimated locally
SLIDES = {
    51: dict(mode="photo", crop=(360, 0, 1000, 625), radius=40, lo=4, span=70,
               boxes=[(60, 90, 440, 205), (60, 230, 390, 350), (60, 395, 210, 455)]),
    52: dict(mode="paper", boxes=[(60, 35, 835, 150), (60, 155, 425, 228), (730, 530, 940, 565)]),
    53: dict(mode="paper", boxes=[(60, 82, 910, 150), (60, 160, 425, 248), (555, 478, 918, 565)]),
    54: dict(mode="paper", boxes=[(585, 38, 895, 128), (90, 398, 415, 485)]),
    55: dict(mode="photo", crop=(628, 4, 998, 625), radius=18, lo=14, span=55),
    57: dict(mode="photo", crop=(80, 0, 905, 625), radius=18, lo=12, span=45),
}
# Photographs on the production slides, kept as photographs.
PHOTOS = {
    59: [("s59-a", (483, 115, 955, 381)), ("s59-b", (483, 403, 707, 529)), ("s59-c", (732, 403, 956, 529))],
    60: [("s60-a", (0, 246, 1000, 625))],
}


# The Gamma Barbecue slides, for gmmbbq.html. Same treatment: line work
# becomes pink ink, photographs stay photographs.
GMM_OUT = ROOT / "assets" / "gmmbbq" / "about"
GMM_ART = {
    # the point-cloud figure beside "What is Gamma Barbecue?"
    "pdf-figure": (13, dict(mode="paper", crop=(430, 60, 1000, 625), boxes=[(585, 515, 920, 570), (430, 20, 620, 80)])),
    # Abhyu's two covers, Superlinear and Intrication
    "pdf-abhyu-1": (17, dict(mode="paper", crop=(372, 278, 632, 548))),
    "pdf-abhyu-2": (17, dict(mode="paper", crop=(700, 278, 965, 548))),
}
GMM_PHOTOS = {
    14: [("pdf-seed", (405, 0, 1000, 625))],
    16: [("pdf-repaint-big", (598, 107, 825, 503)), ("pdf-repaint-1", (15, 388, 156, 612)),
         ("pdf-repaint-2", (181, 361, 322, 612)), ("pdf-repaint-3", (347, 333, 488, 612))],
    17: [("pdf-abhyu", (0, 0, 322, 625))],
    18: [("pdf-blend-big", (580, 88, 1000, 512)), ("pdf-blend-1", (15, 10, 155, 222)),
         ("pdf-blend-2", (180, 10, 322, 222)), ("pdf-blend-3", (15, 247, 155, 533)),
         ("pdf-blend-4", (180, 247, 322, 455))],
    19: [("pdf-gig-1", (15, 12, 238, 300)), ("pdf-gig-2", (265, 12, 735, 300)),
         ("pdf-gig-3", (760, 90, 985, 300)), ("pdf-gig-4", (15, 325, 322, 612)),
         ("pdf-gig-5", (347, 325, 985, 612))],
    20: [("pdf-gig-6", (15, 12, 652, 300)), ("pdf-gig-7", (678, 12, 985, 455)),
         ("pdf-gig-8", (12, 325, 655, 612))],
}


def px(box):
    return tuple(int(round(v * U)) for v in box)


def trace(page_img, spec):
    L = page_img.convert("L")
    if spec["mode"] == "paper":
        draw = ImageDraw.Draw(L)
        for b in spec.get("boxes", []):
            draw.rectangle(px(b), fill=255)
        # Darkness below the paper, with the paper's own grain cut off.
        a = L.point(lambda v: max(0, min(255, int((238 - v) * 255 / 130))))
    else:
        paper = L.filter(ImageFilter.GaussianBlur(spec["radius"] * U / 2.56))
        # Text is covered with the paper it sits on, not with white: a white
        # patch on a tinted lightbox would trace as a halo round its edge.
        for b in spec.get("boxes", []):
            L.paste(paper.crop(px(b)), px(b)[:2])
        diff = ImageChops.subtract(paper, L)
        lo, span = spec["lo"], spec["span"]
        a = diff.point(lambda v: max(0, min(255, int((v - lo) * 255 / span))))
    if "crop" in spec:
        a = a.crop(px(spec["crop"]))
    out = Image.new("RGBA", a.size, INK + (0,))
    out.putalpha(a)
    return out


def main():
    doc = fitz.open(PDF)
    OUT.mkdir(parents=True, exist_ok=True)
    for n in sorted(set(SLIDES) | set(PHOTOS)):
        pm = doc[n - 1].get_pixmap(dpi=DPI)
        img = Image.frombytes("RGB", (pm.width, pm.height), pm.samples)
        if n in SLIDES:
            art = trace(img, SLIDES[n])
            w = OUT_W if "crop" not in SLIDES[n] else int(OUT_W * art.width / img.width)
            art = art.resize((w, round(art.height * w / art.width)), Image.LANCZOS)
            dst = OUT / f"s{n}-art.png"
            art.save(dst, optimize=True)
            print(f"  art   {dst.name} {art.size} {dst.stat().st_size // 1024}k")
        for name, box in PHOTOS.get(n, []):
            ph = img.crop(px(box))
            ph.thumbnail((OUT_W, OUT_W))
            dst = OUT / f"{name}.jpg"
            ph.save(dst, quality=84, optimize=True, progressive=True)
            print(f"  photo {dst.name} {ph.size} {dst.stat().st_size // 1024}k")

    GMM_OUT.mkdir(parents=True, exist_ok=True)
    pages = sorted({n for n, _ in GMM_ART.values()} | set(GMM_PHOTOS))
    for n in pages:
        pm = doc[n - 1].get_pixmap(dpi=DPI)
        img = Image.frombytes("RGB", (pm.width, pm.height), pm.samples)
        for name, (page, spec) in GMM_ART.items():
            if page != n:
                continue
            art = trace(img, spec)
            art.thumbnail((1200, 1200), Image.LANCZOS)
            dst = GMM_OUT / f"{name}.png"
            art.save(dst, optimize=True)
            print(f"  art   {dst.name} {art.size} {dst.stat().st_size // 1024}k")
        for name, box in GMM_PHOTOS.get(n, []):
            ph = img.crop(px(box))
            ph.thumbnail((1400, 1400))
            dst = GMM_OUT / f"{name}.jpg"
            ph.save(dst, quality=82, optimize=True, progressive=True)
            print(f"  photo {dst.name} {ph.size} {dst.stat().st_size // 1024}k")


if __name__ == "__main__":
    main()
