#!/usr/bin/env python3
"""Cut the drawings and photographs out of the old portfolio PDF.

Three sets: Chaos Structures (pages 3-11), A Slightly Emasculated Man (pages 51-60) and the Gamma Barbecue
pages (13-20) that gmmbbq.html is partly built from.

Chaos Structures (pages 3-11) is cut up too: its figures lifted off the
paper into the project page's ink, its renders kept as photographs, see
CHAOS_INKS below. `--chaos` builds only that set.

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
import json
import sys
from pathlib import Path

import pymupdf as fitz
import numpy as np
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


# Chaos Structures (pages 3-11), the old portfolio's first project. Its pages
# are 1280 x 800 images, so these boxes are in that page's own pixels and
# are cut from the embedded image itself rather than from a render of it.
#
#   ink:    figures, plots and drawings on white. Lifted off the paper and
#           set on transparency, so the page's own ground shows through.
#           Black and grey become the page's --tone-light; colour is snapped
#           to one clean, bright version of each hue (the attractor's red,
#           green and blue runs, the plots' blues), which is what clears the
#           JPEG noise the PDF's pages carry.
#   render: the 3-D renders, grey on a light floor. Lifted the same way but
#           with their shading kept, then laid on the page's ground as JPEG:
#           the ribbons come out as light on dark, like the line work.
#   dark:   pictures that are already dark (the displace outputs). Their
#           black is moved to the page's ground so no black box shows.
#   photo:  kept as it is (the TouchDesigner network, its own UI).
CHAOS_OUT = ROOT / "assets" / "jishnu" / "chaosstructures"
CHAOS_SRC = ROOT / "Jishnu" / "ChaosStructures"
CHAOS_INK = (0xF4, 0xF1, 0xEC)    # assets/project-page.css --tone-light
CHAOS_BG = (0x0B, 0x0E, 0x13)     # assets/project-page.css --tone-dark
# hue range in degrees -> the colour it is drawn in on the page
CHAOS_HUES = [
    ((330, 360), (255, 80, 100)), ((0, 40), (255, 80, 100)),     # red
    ((70, 170), (90, 235, 120)),                                 # green
    ((170, 222), (90, 185, 255)),                                # plot blue
    ((222, 300), (110, 125, 255)),                               # deep blue
]
# Each cut: (name, box, options). Options for lift_ink():
#   bold:  denoise hard before enlarging. Right for solid shapes; it eats
#          hairlines and small type, so the plots and equations go without.
#   fill:  how far (output pixels) a colour spreads into the grey around it.
#          The attractor is rendered tubes, whose highlights have no colour of
#          their own; filling gives each tube its run's colour edge to edge.
#   blank: boxes (page pixels) painted white before cutting.
#   sat:   how much colour marks a pixel as coloured; the plots' faint blue
#          hairlines need less than the default.
THIN = dict(lo=0.05, hi=0.40)
CHAOS_INKS = {
    # Reaches down past the top of the equations beside it, so the crop
    # runs to the attractor's lowest loop and the equations are painted out.
    4: [("lorenz", (688, 72, 1230, 496), dict(bold=True, fill=40, blank=[(676, 462, 905, 505)]))],
    5: [("nes-setup", (712, 92, 1091, 409), THIN), 
        # The four steps, one icon each, in boxes of one size so they sit
        # level in a row; the captions under them are set as text.
        ("nes-block", (72, 455, 252, 595), THIN), ("nes-pendulum", (390, 455, 570, 595), THIN),
        ("nes-magnet", (708, 455, 888, 595), THIN), ("nes-coil", (1027, 455, 1207, 595), THIN)],
    11: [("diffusion-1", (607, 225, 828, 470), dict(bold=True)), ("diffusion-2", (900, 208, 1203, 504), dict(bold=True)),
         ("type-field", (549, 515, 1280, 800), THIN)],
}
# The plots are rebuilt on the page: axes, ticks and labels as real text
# (the `plots` block in assets/render-project.js), and only the plotted data
# cut from the PDF, as a layer that fills the plot area. Each box is the
# plot's frame on the page -- the axis lines themselves, measured off the
# page -- so the layer lines up with axis limits set to the same frame
# (the `x` and `y` ranges in assets/project-details.js).
# Each also names how coloured a pixel must be to count as data (the phase
# plots' hairlines are faint, the bifurcation's markers solid) and the
# colours it is drawn in: a pixel takes whichever is nearer in hue, so two
# colours never blend into a third where they meet.
RED, DEEP_BLUE, PLOT_BLUE = (255, 80, 100), (110, 125, 255), (90, 185, 255)
PHASE = dict(lo=8, hi=30, colours=[(200, PLOT_BLUE)], smooth=1.6)
PHASE_THICK = dict(PHASE, lo=22, hi=60)   # the chaotic ones: thick, and noisier
CHAOS_PLOTS = {
    6: [("plot-bifurcation", (160, 483, 416, 680), dict(lo=30, hi=110, colours=[(0, RED), (240, DEEP_BLUE)])),
        ("plot-phase-035", (1033, 456, 1163, 508), PHASE)],
    7: [("plot-phase-070", (408, 61, 551, 117), PHASE), ("plot-phase-075", (1044, 70, 1188, 127), PHASE_THICK),
        ("plot-phase-080", (396, 439, 528, 491), PHASE), ("plot-phase-095", (1041, 434, 1174, 487), PHASE_THICK)],
}
PLOT_SCALE = 4
CHAOS_RENDERS = {
    11: [("c-render-1", (20, 249, 305, 484)), ("c-render-2", (337, 320, 518, 484)),
         ("c-render-3", (20, 518, 305, 784)), ("c-render-4", (337, 521, 518, 784))],
}
CHAOS_DARK = {
    10: [("c-displace-1", (0, 157, 305, 733)), ("c-displace-2", (338, 157, 624, 733)),
         ("c-displace-3", (656, 157, 942, 733)), ("c-displace-4", (975, 157, 1280, 733))],
}
CHAOS_PHOTOS = {
    9: [("c-network", (56, 116, 1223, 484))],
}
# The card's plates, in order: the 0.208 output, a render, the diffusion.
CHAOS_THUMBS = [(10, (656, 157, 942, 733)), (11, (20, 518, 305, 784)), (11, (900, 208, 1203, 504))]
CHAOS_SCALE = 3   # the PDF's pages are 1280 x 800; the cuts ship at 3x


def clean_up(img, scale=CHAOS_SCALE, strength=5):
    """Denoise at the page's own size, before the JPEG noise is enlarged
    into blotches; then up to size. Non-local means rather than a median:
    it averages each patch with others that look like it, so the blocking
    and mosquito noise go but edges, small type and real texture (the
    displace outputs are speckle by nature) stay. Past ~6 it starts to
    smear that texture; 0 skips it."""
    if strength:
        import cv2
        a = cv2.cvtColor(np.asarray(img.convert("RGB")), cv2.COLOR_RGB2BGR)
        a = cv2.fastNlMeansDenoisingColored(a, None, strength, strength, 5, 21)
        img = Image.fromarray(cv2.cvtColor(a, cv2.COLOR_BGR2RGB))
    return img.resize((img.width * scale, img.height * scale), Image.LANCZOS)


def lift_ink(img, lo=0.10, hi=0.50, keep_shading=False, fill=0, mono=False, bold=False, blank=(), sat=0.22):
    """Take a figure off white paper onto transparency.

    Alpha is how far a pixel is from white, softened a touch and pushed
    through a smoothstep between `lo` and `hi`, so paper grain goes to
    nothing and strokes go fully solid with a clean edge. `keep_shading`
    makes the ramp linear instead, for renders whose greys are the form."""
    rgb = np.asarray(img.convert("RGB"), dtype=np.float32)
    dark = 255 - rgb.min(axis=2)
    dark = np.asarray(Image.fromarray(dark.astype(np.uint8)).filter(ImageFilter.GaussianBlur(0.7)),
                      dtype=np.float32) / 255
    t = np.clip((dark - lo) / (hi - lo), 0, 1)
    alpha = t if keep_shading else t * t * (3 - 2 * t)

    # Colour, read off a blurred copy: JPEG keeps its colour at a quarter of
    # the resolution, in blocks, and the blur is what averages them out.
    soft = np.asarray(img.convert("RGB").filter(ImageFilter.GaussianBlur(1.5)), dtype=np.float32)
    mx, mn = soft.max(axis=2), soft.min(axis=2)
    saturation = (mx - mn) / np.maximum(mx, 1)
    r, g, b = soft[..., 0], soft[..., 1], soft[..., 2]
    d = np.maximum(mx - mn, 1e-3)
    hue = np.where(mx == r, ((g - b) / d) % 6, np.where(mx == g, (b - r) / d + 2, (r - g) / d + 4)) * 60

    out = np.empty(rgb.shape[:2] + (4,), dtype=np.float32)
    out[..., :3] = CHAOS_INK
    # Which of CHAOS_HUES each pixel is, 0 for none.
    cls = np.zeros(rgb.shape[:2], dtype=np.int8)
    if not mono:
        sure = saturation > sat
        for i, ((h0, h1), _) in enumerate(CHAOS_HUES, start=1):
            cls[sure & (hue >= h0) & (hue < h1)] = i
        # Spread each colour outward a pixel at a time into what has none.
        for _ in range(fill):
            open_ = cls == 0
            if not open_.any():
                break
            for dy, dx in ((0, 1), (0, -1), (1, 0), (-1, 0)):
                nb = np.roll(cls, (dy, dx), axis=(0, 1))
                take = open_ & (nb > 0) & (cls == 0)
                cls[take] = nb[take]
        for i, (_, col) in enumerate(CHAOS_HUES, start=1):
            out[cls == i, :3] = col
    coloured = cls > 0
    # a hairline in colour is fainter than one in black: give it more body
    alpha = np.where(coloured, np.minimum(1, alpha * 1.6), alpha)
    out[..., 3] = alpha * 255
    return Image.fromarray(out.round().astype(np.uint8), "RGBA")


def lift_data(img, lo, hi, colours, smooth=0, scale=PLOT_SCALE):
    """Only the plotted data off a MATLAB figure: what is coloured stays, in
    the nearest of `colours` (hue in degrees -> colour drawn); the grey
    frame, ticks and the printed numbers -- set as real text on the page
    instead -- go."""
    img = img.convert("RGB").resize((img.width * scale, img.height * scale), Image.LANCZOS)
    rgb = np.asarray(img, dtype=np.float32)
    chroma = rgb.max(axis=2) - rgb.min(axis=2)
    t = np.clip((chroma - lo) / (hi - lo), 0, 1)
    alpha = t * t * (3 - 2 * t)
    if smooth:
        # A hairline comes through the JPEG broken up; blurring its coverage
        # and pushing it back up joins it into one even line.
        a8 = Image.fromarray((alpha * 255).astype(np.uint8)).filter(ImageFilter.GaussianBlur(smooth))
        alpha = np.clip(np.asarray(a8, dtype=np.float32) / 255 * 2.2 - 0.15, 0, 1)
    soft = np.asarray(img.filter(ImageFilter.GaussianBlur(scale * 0.5)), dtype=np.float32)
    mx, mn = soft.max(axis=2), soft.min(axis=2)
    r, g, b = soft[..., 0], soft[..., 1], soft[..., 2]
    d = np.maximum(mx - mn, 1e-3)
    hue = np.where(mx == r, ((g - b) / d) % 6, np.where(mx == g, (b - r) / d + 2, (r - g) / d + 4)) * 60
    gap = np.stack([np.abs((hue - h + 180) % 360 - 180) for h, _ in colours])
    out = np.zeros(rgb.shape[:2] + (4,), dtype=np.float32)
    out[..., :3] = np.array([c for _, c in colours], dtype=np.float32)[gap.argmin(axis=0)]
    out[..., 3] = alpha * 255
    return Image.fromarray(out.round().astype(np.uint8), "RGBA")


def on_ground(rgba):
    ground = Image.new("RGB", rgba.size, CHAOS_BG)
    ground.paste(rgba, mask=rgba.getchannel("A"))
    return ground


def lift_dark(img):
    """Black to the page's ground, white stays white, linear between."""
    a = np.asarray(img.convert("RGB"), dtype=np.float32)
    bg = np.array(CHAOS_BG, dtype=np.float32)
    return Image.fromarray((bg + a * (255 - bg) / 255).round().astype(np.uint8))


def build_chaos(doc):
    sys.path.insert(0, str(ROOT / "scripts"))
    from build_assets import image_size

    CHAOS_OUT.mkdir(parents=True, exist_ok=True)
    (CHAOS_SRC / "Thumbnails").mkdir(parents=True, exist_ok=True)
    pages = {}

    def page(n):
        if n not in pages:
            pix = fitz.Pixmap(doc, doc[n - 1].get_images()[0][0])
            pages[n] = Image.frombytes("RGB", (pix.width, pix.height), pix.samples)
        return pages[n]

    def jpg(im, name):
        dst = CHAOS_OUT / f"{name}.jpg"
        im.save(dst, quality=90, optimize=True, progressive=True)
        made.append(dst)

    made = []
    for n, cuts in CHAOS_INKS.items():
        for name, box, opts in cuts:
            dst = CHAOS_OUT / f"{name}.png"
            src = page(n).copy()
            for bx in opts.get("blank", ()):
                ImageDraw.Draw(src).rectangle(bx, fill=(255, 255, 255))
            crop = clean_up(src.crop(box), strength=8 if opts.get("bold") else 0)
            lift_ink(crop, **opts).save(dst, optimize=True)
            made.append(dst)
    for n, cuts in CHAOS_PLOTS.items():
        for name, box, opts in cuts:
            dst = CHAOS_OUT / f"{name}.png"
            lift_data(page(n).crop(box), **opts).save(dst, optimize=True)
            made.append(dst)
    for n, cuts in CHAOS_RENDERS.items():
        for name, box in cuts:
            jpg(on_ground(lift_ink(clean_up(page(n).crop(box)), lo=0.12, hi=0.95, keep_shading=True, mono=True)), name)
    for n, cuts in CHAOS_DARK.items():
        for name, box in cuts:
            jpg(lift_dark(clean_up(page(n).crop(box), scale=2, strength=4)), name)
    for n, cuts in CHAOS_PHOTOS.items():
        for name, box in cuts:
            jpg(clean_up(page(n).crop(box), scale=2), name)
    # The plates go into the source folder as well, so a rerun of
    # build_assets.py finds the project and builds the same card.
    for i, (n, box) in enumerate(CHAOS_THUMBS, start=1):
        ph = page(n).crop(box)
        ph.save(CHAOS_SRC / "Thumbnails" / f"{i:02d}.jpg", quality=92)
        dst = CHAOS_OUT / f"thumb-{i:02d}.jpg"
        ph.save(dst, quality=88, optimize=True, progressive=True)
        made.append(dst)
    for dst in made:
        print(f"  chaos {dst.name} {image_size(dst)} {dst.stat().st_size // 1024}k")

    # Its manifest entry, as build_assets.py would write it from a folder of
    # nothing but Thumbnails/, plus the sizes of every cut so the story's
    # images hold their space before they load.
    mpath = ROOT / "assets" / "manifest.js"
    text = mpath.read_text(encoding="utf-8")
    manifest = json.loads(text[text.index("{"):text.rindex("}") + 1])
    thumbs = [f"assets/jishnu/chaosstructures/thumb-{i:02d}.jpg" for i in range(1, 4)]
    manifest["jishnu/chaosstructures"] = {
        "name": "ChaosStructures",
        "category": "Jishnu",
        "thumb": thumbs[0],
        "images": thumbs,
        "videos": [],
        "sizes": {d.relative_to(ROOT).as_posix(): list(image_size(d)) for d in made},
    }
    order = ["GMMBBQ", "Jishnu", "OnebyZero"]   # build_assets.py's order
    manifest = dict(sorted(manifest.items(), key=lambda kv: (order.index(kv[1]["category"]), kv[1]["name"])))
    mpath.write_text("const SITE_MANIFEST = " + json.dumps(manifest, indent=2) + ";\n", encoding="utf-8")


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
    build_chaos(doc)
    if "--chaos" in sys.argv:
        return
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
