# Portfolio2025 — full reference

Jishnu Roy Chaudhury's portfolio site. Static HTML/CSS/JS, no framework, no
build step for the site itself — the only tooling is two Python scripts that
turn raw camera media into web assets and generate the per-project pages.

This document covers everything in the folder: the repository, every file, how
the data flows, the background effects on each page, the conventions that will
silently break things if violated, and what is currently rough.

---

## 1. The repository

| | |
|---|---|
| Remote | `https://github.com/Jishnurc519/Portfolio2025.git` |
| Default branch | `main` |
| Other branches | `portfolio-media-galleries` (local + remote), `origin/Jishnurc519-patch-1` |
| Tracked files | 133, of which 126 are under `assets/` |
| CI / deploy config | none — no workflow, no `CNAME`, no `.nojekyll` |

The site is plain static files. It can be opened from disk, but **serve it over
HTTP while developing** (`python -m http.server`) — several things behave
differently on `file://`, most importantly that WebGL refuses to read a video
it considers cross-origin, which includes every local video on `file://`.

### What is deliberately not in the repo

`.gitignore`:

```
/GMMBBQ/
/Jishnu/
/OnebyZero/
/scripts/_tmp/
/scripts/_tmp_server.log
```

The top three are the **raw media source folders** — original HEIC/MOV files
straight off a camera or phone. They stay on the local machine. Only the
derived, compressed output under `assets/` is committed. This means:

- Cloning the repo gets you a working site, but not the ability to re-run
  `build_assets.py` — that needs the source folders.
- Deleting a source folder locally does not remove anything from the site until
  `build_assets.py` is re-run and the result committed.

### Commit history, in short

The history splits into two eras. Everything up to `a810d11 Update
facilitation.html` is the older hand-edited site — a run of "Fix HTML encoding
issues", "Add files via upload" and two stray `print statement from 'Hello' to
'Goodbye'` commits from an unrelated file. The current architecture starts at:

```
4a7624c Scaffold portfolio site with per-project galleries
149f82b Redesign homepage as single static page and polish site interactions
b51f016 Merge portfolio-media-galleries: new site build with project galleries
bef15c2 Make the hold-to-invert hint fade in and out instead of staying visible
```

### Uncommitted state at the time of writing

A large amount of the current architecture is **not yet committed**. Untracked:

```
assets/page-config.js       assets/render-project.js     assets/page.css
assets/project-details.js   assets/render-projects.js    assets/project-page.css
assets/scroll-nav.js        assets/hero/                 assets/jishnu/sobha/
projects/                   scripts/build_project_pages.py
```

Modified: `index.html`, `work.html`, `play.html`, `facilitation.html`,
`project.html`, `scripts/build_assets.py`, `assets/manifest.js`, and a batch of
re-encoded `vid-*.mp4` files. Deleted: `assets/jishnu/volumetrics/`.

That is worth knowing before any `git checkout` or `git stash` — most of the
site's shared runtime exists only in the working tree.

---

## 2. Site map

```
index.html                  front page — name, bio, three links
├── work.html               selected works        ─┐
├── play.html               experimental playground│ list pages, same shell
└── facilitation.html       facilitation & strategy┘
        └── projects/<slug>.html    one generated page per project (19)
project.html                legacy redirect shim for old ?p= links
```

| File | Lines | What it is |
|---|---|---|
| `index.html` | 459 | Self-contained. Canvas-2D brush effect, no shared CSS or JS. |
| `work.html` | 215 | List page. three.js instanced-torus field. |
| `play.html` | 263 | List page. three.js boid flock. Right-aligned header. |
| `facilitation.html` | 649 | List page. Raw WebGL2 light-and-shadow. Two tones only. |
| `project.html` | 36 | Redirects `project.html?p=cat/slug` → `projects/slug.html`. `noindex`. |
| `projects/*.html` | 40 each | Generated. Thin shells filled at load time. |

`index.html` shares nothing with the rest of the site — its own CSS, its own
script, no `page.css`, no `scroll-nav.js`. That is intentional: it is a single
static screen with no scrolling, no project list and no theme flip.

The three list pages are near-identical shells that differ only in their copy
and the WebGL scene behind them.

---

## 3. The data layer

Three files, all keyed the same way: **`"categoryslug/projectslug"`**, e.g.
`"gmmbbq/aliengarden"`. Slugs are the folder name lowercased with every
non-alphanumeric character stripped (`slugify` in `build_assets.py`), so
`Echoes of Earth` → `echoesofearth`.

### `assets/manifest.js` — generated, do not hand-edit

```js
const SITE_MANIFEST = {
  "gmmbbq/aliengarden": {
    "name": "AlienGarden",
    "category": "GMMBBQ",
    "thumb": "assets/gmmbbq/aliengarden/img-01.jpg",
    "images": [ "assets/gmmbbq/aliengarden/img-01.jpg", … ],
    "videos": [ { "src": "…/vid-01.mp4", "poster": "…/vid-01-poster.jpg" }, … ]
  },
  …
};
```

19 projects. Written wholesale by `scripts/build_assets.py`; anything typed
into it by hand is lost on the next run. Paths are relative to the site root.

### `assets/project-details.js` — hand-authored, never touched by scripts

Case-study text, same keys. Every field optional:

```js
{ year, role, tools: [], overview, process, credits }
```

`year`, `tools` and `overview` do double duty — they are also what the list
pages print on each card. A project left as `{}` renders a card with nothing
but a title and thumbnail.

### `assets/page-config.js` — hand-authored, the editorial layer

Decides **which projects appear on which page and in what order**:

```js
const PAGE_CONFIG = {
  work: [ { key: "jishnu/fieldlinesim", displayName: "FluidLineSim" }, … ],
  play: [ … ],
  facilitation: [ { key: "jishnu/jklu" }, { key: "jishnu/somaiya" }, … ]
};
```

Per entry: `key` (must match the manifest exactly), optional `displayName` (renames
on the site without renaming the source folder), optional `group: "dark" | "bright"`
(facilitation only — shows a card on only one theme; currently unused, so
facilitation shows all three cards on both themes).

Current distribution: **work** 7, **play** 9, **facilitation** 3 = 19, matching
the manifest exactly.

This file is also read by the per-project pages: a project's section, its back
link and its prev/next arrows all come from whichever array it sits in. A
project in no array still gets a page — it just links back home.

### How the three relate

```
build_assets.py ──writes──▶ manifest.js   (what media exists)
                                 │
project-details.js ──────────────┤        (what to say about it)
   hand-written                  │
                                 ▼
page-config.js ─────────▶ render-projects.js ▶ cards on work/play/facilitation
   hand-written          └▶ render-project.js  ▶ one page under projects/
                         └▶ build_project_pages.py ▶ the shells themselves
```

---

## 4. The build pipeline

### `scripts/build_assets.py` (200 lines)

Turns `<Category>/<Project>/**/*.{HEIC,JPG,PNG,MOV,MP4}` into
`assets/<cat>/<proj>/{img-NN.jpg, vid-NN.mp4, vid-NN-poster.jpg}` and rewrites
`assets/manifest.js`.

```
python scripts/build_assets.py
python scripts/build_assets.py --videos-only   # reuse already-built jpgs
```

Limits: 8 images, 2 videos, 20 seconds per video, images ≤1600px wide, video
≤1280px wide, H.264 CRF 26 with `+faststart`, AAC 128k.

Three details in there exist because of real failures:

- **Live Photo pairs.** An image and a `.mp4` sharing a basename are collapsed
  to just the image — the `.mp4` is the motion component, not a clip.
- **HEIC is converted in two passes.** HEIC tile-grid sources choke when `-vf`
  is combined with the implicit tile-reconstruction filtergraph, so the raw
  frame is extracted first and resized separately.
- **HDR is tonemapped, not squashed.** HLG/PQ sources decode to 10-bit; handing
  that to libx264 produces a High 10 stream no browser can decode (the video
  reads as "corrupted"), and a naive 8-bit conversion washes the picture out.
  Detected via `ffprobe` `color_transfer` and run through a
  `zscale`/`tonemap=hable` chain to bt709.

> **Hardcoded path.** `FFMPEG` points at a specific WinGet install:
> `C:\Users\jishn\AppData\Local\…\ffmpeg-9.0-full_build\bin\ffmpeg.exe`.
> On any other machine this must be edited or the script does nothing but print
> failures.

### `scripts/build_project_pages.py` (174 lines)

Generates `projects/<slug>.html`, one per manifest entry, all from one template.

```
python scripts/build_project_pages.py     # run after build_assets.py
```

The pages are thin shells. Baked in: title, category tag, back link, and the
project key on `<body data-project="…">`. Everything else is filled at load
time by `render-project.js`.

Three behaviours worth knowing:

- **`<base href="../">`** is in the template, because the pages live in
  `projects/` while every path in the manifest is relative to the site root.
  Remove it and every image on every project page breaks.
- **Slug collisions are a hard error.** Slugs come from the second half of the
  key only, so `gmmbbq/midroom` and `onebyzero/middleroom` are fine, but two
  projects with the same folder name in different categories would both want
  `projects/<slug>.html`. The script refuses and tells you to rename one.
- **Stale pages are deleted, hand-written ones are not.** Every generated file
  carries `<!-- generated by scripts/build_project_pages.py … -->`; only files
  with that marker are removed.

The script reads `page-config.js` with a **regex, not a JS engine**, so that
file must keep its one-entry-per-line shape. Anything the regex cannot read
falls back silently to a home-page back link, with a note printed.

---

### Hand-picked media, web formats, 3-D plans

Three more scripts sit after `build_assets.py`, run in this order:

```
python scripts/build_curated_media.py   # named files -> assets/curated-media.js
python scripts/optimize_web_media.py    # re-encode oversize / 10-bit / HDR clips, heavy jpgs
python scripts/build_web_formats.py     # AVIF + AV1 siblings -> assets/media-formats.js
```

- **`build_curated_media.py`** converts an explicit list of source files (from
  `assets/NewAssets/` or raw files under `assets/<cat>/<slug>/`) into
  `c-<name>.jpg` / `c-<name>.mp4` and records them by name. Stories point at
  them with `media: "beepod-1"`, galleries with `gallery: [...]`, and a
  project's `thumbs` there replace its card plates. It never touches
  `manifest.js`.
- **`optimize_web_media.py`** replaces files in place (long side ≤1280 for
  clips, ≤1600 for stills, 8-bit yuv420p, HLG/PQ tonemapped) and rewrites the
  manifest's recorded sizes to match.
- **`build_web_formats.py`** writes `.avif` beside stills and AV1 `.webm` beside
  clips, keeps only the ones that came out smaller, and lists them in
  `assets/media-formats.js`. Project pages serve those first and fall back to
  the JPEG/MP4, so older browsers are unaffected.

`assets/spaces.js` holds the notebook plans (Echoes of Earth, Nodeshed) that
`assets/space-3d.js` draws; a story embeds one with `{ space: "echoes" }`, and
each installation's `target` is the `id` of the heading a click scrolls to. The
full list of story block types is at the top of `assets/project-details.js`.

Raw camera files under `assets/` and all of `assets/NewAssets/` are
git-ignored: they are sources, not the site.

---

## 5. Shared runtime

### `assets/scroll-nav.js` (186 lines) — the shell for all three list pages

Native scrolling is off. One wheel tick, arrow key or chevron tap slides the
next `.scroll-target` to the centre of the viewport by transforming
`#main-wrapper`, and marks it `.active`.

Public surface, which every page's effect module talks to:

| Global | Purpose |
|---|---|
| `window.HOLD_STATE.charge` | Current hold charge, published by each page's effect |
| `window.toggleInvert()` | Single owner of the light/dark flip; returns 1.0 / 0.0 |
| `window.recentre()` | Re-centre without changing card — after a flip or resize |
| `window.handleNav(dir)` | 1 = next, −1 = previous, 0 = re-centre |
| `window.wrapperYAt(now)` | Where the wrapper is at a given frame timestamp |
| `window.WRAPPER_Y` | Last applied wrapper offset |
| `window.handleProjectClick(e)` | Card click → `projects/<slug>.html` |
| `window.checkInteraction(e)` | Charge > 200 means that was a hold, not a tap |

Behaviours with a reason behind them:

- **Wheel is debounced to 500ms** and ignores `|deltaY| < 10`, so one trackpad
  flick does not skip four cards.
- **Hover is suspended for 750ms during a slide.** Cards pass under a
  stationary cursor and the browser re-evaluates `:hover` on whatever lands
  there, which made card inversions look like they were firing at random.
- **`touchmove` is `preventDefault`ed** document-wide so the transform is the
  only thing that ever moves. Pages that need touch coordinates still get the
  event — the default is cancelled, the event still propagates.
- **Targets are recomputed on every nav**, because facilitation's theme-gated
  cards enter and leave the DOM flow on every flip.
- **`.active` is cleared from every card, not just the current targets** — a
  card hidden by the theme is not in the target list and would keep a stale
  `.active` that reappears on the next flip.

**The wrapper is tweened in `requestAnimationFrame`, not by a CSS transition.**
This matters and is explained in §8.

### `assets/render-projects.js` (54 lines)

Builds the cards on whichever list page it is on. The page key is taken from
the filename — `work.html` renders `PAGE_CONFIG.work`. Each card gets a
three-layer thumbnail stack (main plus two peeking behind on hover), and a
`soon` placeholder plate if the project has no media yet.

**Load order is load-bearing:** `manifest.js`, `project-details.js` and
`page-config.js` must come before it, and `scroll-nav.js` must come after,
because scroll-nav measures the cards this script appends.

### `assets/render-project.js` (134 lines)

Fills one per-project page: meta row, overview, gallery, Process/Credits,
prev/next pager, lightbox. Prev/next is read **live** from `PAGE_CONFIG` rather
than baked in, so reordering a section moves the arrows without regenerating
every page. Only stills open in the lightbox; videos keep their own controls.

### `assets/cursor.js` — the pointer, and both gestures on it

Desktop only: it bails out for anything without `(hover: hover) and (pointer:
fine)`, and for `prefers-reduced-motion`. Touch keeps the native everything.

Three parts, and they are the reason the file is structured the way it is:

| Part | What it does |
|---|---|
| the ring | 34px outline, trailing the pointer on a spring and stretching into an ellipse along its direction of travel |
| the meter | 26px circle inside it. An arc sweeps the rim and a disc fills the middle, both completing exactly as the page turns over. Empty-but-visible over anything actionable — that is the hover cue |
| the label | the page's own `.hint` copy, moved off the layout and onto the pointer at 15px, split on its middot into two lines |

**Its ink is `var(--tone-swap)`,** so it follows whatever pair the page it is
on runs the inversion with — including facilitation's gold, which is the whole
reason that page restates the variable.

**One blend group, not one blend per part.** The wrapper carries
`mix-blend-mode: difference` and `isolation: isolate`; nothing inside it has a
blend mode of its own. Two difference layers stacked are the identity, so an
arc crossing the ring would have punched the ground colour back through both.
Inside the group the parts paint over each other normally and the finished mark
is inverted once.

**The wrapper carries position only.** The rotate/scale of the stretch goes on
the outline alone — a stretched progress meter does not read as a proportion.

**The meter reads `HOLD_STATE`, declared in `assets/keys.js`.** Whichever module
owns the charge on a page writes `charge` into it each frame; `limit` is what a
full charge reaches, so the meter normalises without knowing whether this page
is counting brush marks, particles or a shadow wipe. It is read fresh every
frame rather than captured, because `cursor.js` loads *before* `scroll-nav.js`.
A page that does not publish (the per-project pages, 404) simply never opens
the arc, and the hover cue still works.

**The label is timed by the page's `.hint`, not by its own clock.** That element
stays in the document under `html.has-ring .hint { color: transparent }` —
emptied by colour rather than `display` or `visibility`, because it has to stay
fully visible for its opacity animation to keep running, and its computed
opacity each frame *is* the label's alpha. So `assets/hold-hint.js` goes on
owning the schedule (once on load, again after every idle 20s) for both the
touch line and the desktop label, and the two cannot drift. On `index.html`,
whose canvas paints its own type, the same `.has-ring` class is what tells the
canvas to skip the hint glyphs so the hint is not shown twice.

---

## 6. Styling

### `assets/page.css` (188 lines) — the three list pages

Global locks kill tap highlight, text selection and touch gestures. `html, body`
are `position: fixed; overflow: hidden` — nothing scrolls natively.

The theme system has **two independent axes**, and both must stay consistent on
every page:

1. `body.inverted-theme` — the whole page flips to light.
2. `.project-item.active` / `:hover` — one card flips **against** whatever the
   page theme currently is.

Accents: teal `#6fd9c8` on dark grounds, amber `#f2b880` / `#b87a3d` on light.

**Grounds: `--tone-dark: #0b0e13`, `--tone-light: #f4f1ec`** — a cool near-black
and a warm cream, declared once in `:root` and used by name everywhere. Neither
is a pure black or a pure white: the site is ink on paper, not a screen being
switched on and off, and the pair reads 17.2:1 against each other, so nothing
is readability-marginal.

They are also **exact complements** — `11+244`, `14+241`, `19+236`, every
channel summing to 255 — and that is load-bearing, not decorative. Every piece
of ink that has to read on both grounds (`.back-btn`, `.nav-counter`, the
chevrons, the cursor ring, all of the front page's type) is painted by
`mix-blend-mode: difference` against `--tone-swap: #ffffff`, and difference
against white is `255 − backdrop`. Because the pair sums to 255, that lands
*exactly* on the other tone rather than a few units off it — so blended ink and
CSS-coloured ink are the same colour, on both sides of the flip.

`--tone-swap` is never a colour anyone sees. It is `--tone-dark + --tone-light`,
the one operand that maps either tone onto the other. **Move one tone and the
other has to move with it**, or the ink stops matching the ground.

And because every difference-blended mark resolves its ink from that one
variable, **a page running on a different pair only has to restate it.**
`facilitation.html` does: its pair is dark + gold, so its operand is
`#f5c65d`, declared in its own `:root` alongside `--tone-swap-rgb` for the
counter's rule. Getting this wrong is not subtle — the site operand against
that page's gold is `|eab84a − ffffff|` = `#1547b5`, a blue, which is what the
cursor ring, its charge meter and the section counter were all painting there
until the operand was restated.

`.back-btn` uses `mix-blend-mode: difference` and **deliberately has no
`body.inverted-theme` rule** — an explicit colour swap would cancel the blend
out at the exact moment the theme flips.

The `.hint` line fades in and back out over 4.5s via `hint-flash`, replayed by
`assets/hold-hint.js` after every idle 20s. On a pointer it is not what you
read: `assets/cursor.js` empties it and reprints the same copy on the cursor,
using this element only as the clock.

### `assets/project-page.css` (124 lines) — the per-project pages

The quiet end of the site: these scroll natively, have no WebGL, no theme flip.
Gallery is CSS columns (`columns: 3 320px`) so portrait photos keep their
aspect ratio instead of being cropped into a landscape box.

---

## 7. The four background effects

All four implement the same **hold-to-invert gesture** with the same numbers:

```js
CHARGE_LIMIT = 1500;   CHARGE_RATE = 1200/s;   RELEASE_RATE = 3600/s;
```

That is a 1.25s hold. It used to be written as "+20 per frame, −60 per frame",
which is 1.25s at 60fps and 0.6s on a 120Hz screen — the same numbers are now
expressed per second on all four pages so the gesture is the same length
everywhere.

| Page | Tech | Scene |
|---|---|---|
| `index.html` | Canvas 2D | Brush marks — eight shapes laid by distance travelled |
| `work.html` | three.js 0.160 (CDN) | 600 instanced tori on a Fibonacci sphere |
| `play.html` | three.js 0.160 (CDN) | 500 boids, box geometry stretched along velocity |
| `facilitation.html` | Raw WebGL2 | 1D shadow map, two tones |

### index.html — brush marks

Eight brushes (`disc, ring, square, triangle, bar, sweep, cross, petal`), each
drawing itself around the origin at a given radius. Marks are laid **by
distance travelled, not by time**, so moving slowly draws a line and flicking
throws them wide. A press throws 5–8 at once; holding spawns them faster and
further out as the charge builds; completing the hold turns the page over with
a barrage in the new tone plus one closing disc to guarantee full coverage.

Two rules hold it together:

- Marks **scale** in and out, never fade. The canvas is therefore only ever two
  tones, never a wash of greys.
- The text is drawn **last, in `difference`**, so it comes out as whatever its
  background is not — readable over ground, over a mark, and mid-turn, without
  ever being recoloured. The DOM text is `color: transparent`; the canvas draws
  every glyph and the social icons itself.

One fixed bug worth not reintroducing: the tones must be read **after** the
state flip, not at the top of the frame. Reading them first painted one frame
of the old ground with nothing on it.

### work.html and play.html

Both load three.js 0.160 from jsDelivr via an import map. Both follow the same
shape: an instanced mesh, a custom `ShaderMaterial` with `uColorA`/`uColorB`/
`uInvert`/`uCharge`/`uGrowth`, mouse position raycast onto the z=0 plane, and
an explode-and-invert sequence when the hold completes.

- **work** — 600 tori on a Fibonacci-sphere distribution, spring-returned to
  their home positions. Idle: they push away from the cursor. Charging: they
  pull toward it. Exploding: they blow outward and the theme flips partway
  through.
- **play** — 500 boids with alignment/cohesion/separation, base speed 0.10.
  Charging warps them along z by up to 15× and thickens them.

> These are the only two pages with a **network dependency at runtime**. With
> jsDelivr unreachable, their backgrounds are blank; the page content still
> works because navigation lives in `scroll-nav.js`.

---

## 8. facilitation.html — the light and shadow effect, in full

This one is described at length because most of the bugs in it produced the
same symptom — "the shadow is offset from the text" — with four unrelated
causes, and each one looked like the previous one had come back.

### What it does

One light at the cursor. Text blocks it and throws hard-edged shadows across
everything. Holding opens a disc that swallows the page and turns it over.
Exactly two tones: the site's `#0b0e13` and gold `#eab84a` (10.5:1).

### Layers

| Layer | What | Role |
|---|---|---|
| `groundCv` | 2D canvas in `#stage-container` | Flat fill in the current theme tone |
| the page | normal DOM | Cards, thumbnails, body copy |
| `#light-canvas` | WebGL2, fixed, `mix-blend-mode: difference` | Shadows, the turn-over disc, and the headline glyphs |

The overlay is painted in **neither of the two tones**. It is painted in their
sum, `SWAP = #f5c65d`, because that is the one operand difference blending
swaps a pair with:

```
|D − S| = Y   and   |Y − S| = D    ⟺    S = D + Y, channel by channel
```

`|0b0e13 − f5c65d| = eab84a` and `|eab84a − f5c65d| = 0b0e13`, exactly. One
operand serves both directions of the inversion, and it reaches the cards for
free. The only constraint on the pair is that no channel of `D + Y` exceeds
255 — here the red channel is `234 + 11 = 245`, with 10 to spare.

### Shadows: a 1D shadow map

A first pass renders a 2048 × 1 texture — one texel per angle around the light,
holding the distance to the first occluder in that direction. The composite
pass converts each screen pixel to an angle and asks that one texture whether
it is further from the light than its angle's entry.

This is why the shadows are clean. The obvious alternative — every pixel
marching toward the light on its own — makes every pixel guess separately, and
neighbours guess differently. That is the speckle earlier versions had.

Seven halvings refine the hit distance after the coarse march. Without it,
every distance is a multiple of one step and every wedge edge starts on that
grid, which reads as stair-stepping — visible only when the light is still.

### One raster, two masks

`occCv` holds the glyphs and is uploaded as a `LUMINANCE_ALPHA` texture:

- **alpha** — glyph plus a 1.5px stroke. This is what casts. The fattening
  exists because the march steps in finite increments and a stroke thinner than
  one step gets jumped clean over, punching holes in its own shadow.
- **luminance** — the letterform exactly as the browser set it. This is what
  gets painted back onto the page.

The page's own copy of those words stays in the document — layout, links and
screen readers unchanged — but transparent (`#main-wrapper .ch`). **There is
only ever one rendering of the text**, and the shadows are traced through the
same raster that draws it. Every offset bug below was possible only because
there were two renderings.

### The band

The raster covers ¾ of a screen height above and below the window
(`occMargin`). A slide covers most of a screen height, so text arriving from
off-screen is already in the raster and casting. Without it, shadows popped in
as text crossed the edge of the window.

The raster is **not redrawn while the page moves**. It records where it was
drawn (`baseY`); the shader reads it back through the current offset
(`uOccShiftY`). Redrawing costs a full glyph pass plus a texture upload;
reading through an offset costs nothing. It is redrawn once the page has been
still for 100ms.

### The four causes of "the shadow is offset"

**1. Rebuilding the raster during the slide.** Throttled to 20/s, which put the
shadow up to 50ms behind the text — tens of pixels at slide speed — and the
rebuild itself stalled frames. Fixed by the offset above.

**2. The wrapper was moving on a different thread.** `scroll-nav.js` slid
`#main-wrapper` with a CSS transition, which Chrome runs on the **compositor
thread**. The shadows are drawn each frame from where the letters are
*according to the main thread*. The two sample the same movement a frame apart,
and a slide opens at roughly 5px/ms, so one frame of phase put the shadow forty
pixels from its text for the whole 0.7s.

This resisted diagnosis longest, because a test that moves the wrapper from
JavaScript moves it on the main thread — the one case where both clocks agree.
It must be tested against a real composited transition.

`scroll-nav.js` now tweens the wrapper in `requestAnimationFrame` and publishes
`window.wrapperYAt(now)`. Both the tween and the effect derive the position
from the **same frame timestamp**, so callback order does not matter. The cost:
the slide is no longer compositor-driven and can be affected by main-thread
stalls. `work.html` and `play.html` share this file and were re-checked.

**3. `textBaseline = 'middle'` is not where the browser puts the letter.**
Canvas centres a glyph on its **em box**; CSS centres it in its **line box**.
The gap grows with type size:

| | size | error |
|---|---|---|
| headline | 100px | 3.7px |
| card titles | 48px | 2.3px |
| subtitle | 24px | 0.3px |

Which is exactly why it showed on the headline and titles and not the small
copy. Now drawn on `'alphabetic'` at the baseline from the font's own metrics:

```js
y = r.top + (r.height - (asc + desc)) / 2 + asc   // half-leading + ascent
```

Measured against the browser's real baseline as within 0.33px.

**4. The tones could not round-trip.** The dark tone used to be `#0a0a0a` and
the overlay used to be painted in the gold itself. Under difference blending:
dark ground under the gold overlay → `#f5c710`, duller than the text's
`#ffd11a`; gold ground → `#000000`, darker than the page's `#0a0a0a`. Both
tones wrong, in opposite directions, and only inside shadows.

The fix at the time was to force the dark tone to a true `#000000`, because
`D + Y = Y` only when `D` is zero. That worked, at the cost of the one hole in
the screen on a site that is otherwise ink on paper.

Naming the operand separately buys the near-black back. The identity needs
`|D − S| = Y` **and** `|Y − S| = D`; both hold for any pair with `S = D + Y`,
so `S` is now `#f5c65d` and `D` is the site's `--tone-dark`. The gold and the
dark tone are both chosen freely; the overlay colour is the one that is
derived, and it is derived from them.

### A letter must not stand in its own shadow

The map holds the distance to the **near** edge of the ink, so every pixel of a
letter's body lies behind its own entry and comes back "shadowed". Left alone
that inverts every letter against itself — a card title reads yellow on yellow
with a thin lit rim down one side.

Two approaches were tried and rejected:

- **Store the far edge instead.** Fails on the headline: a ray through a big
  letterform crosses several strokes, so "the first run of ink" is not a model
  of "this letter". Produced splinters and blocky striping.
- **Cut glyphs out of the mask entirely.** The letter then keeps its colour
  inside a shadow — with two tones, that means yellow on yellow. It disappears.

What works: a letter takes its tone from the **ground around it**, not the
ground underneath it. Eight taps on a ring outside the strokes (radius `0.022`
uv, ~18px), ignoring any that land on ink, decide whether the letter stands in
light or shadow; the letter is painted as the opposite. The decision is
thresholded with `step(0.5, …)` — a fraction of a flip is a colour between the
two tones, and the page only has two.

---

## 9. Conventions and invariants

Things that are quiet until they break.

1. **Script order on list pages** is `manifest → project-details → page-config →
   render-projects → scroll-nav`, then the page's effect module. scroll-nav
   measures cards render-projects appends.
2. **Keys must match exactly** across `manifest.js`, `project-details.js` and
   `page-config.js`. A typo in page-config logs `page-config.js references
   unknown project key` and silently drops the card.
3. **Slugs must be unique across categories** or `build_project_pages.py` aborts.
4. **`<base href="../">` stays** in the project page template.
5. **Never hand-edit `assets/manifest.js`** — it is overwritten wholesale.
6. **`page-config.js` must keep its one-entry-per-line shape**, because the
   build script parses it by regex.
7. **`.back-btn` gets no `inverted-theme` colour rule** on the shared stylesheet —
   its difference blend already handles both grounds.
8. **A third colour anywhere on facilitation breaks it.** The overlay only knows
   two tones; cream `#f4f1ec` differenced against the overlay comes out blue,
   which is why that page overrides the card hover colours.
   Its operand is **derived** — `--tone-dark + gold` — and is stated *twice*, as
   the shader's `SWAP` and as that page's `--tone-swap` / `--tone-swap-rgb`
   override. All three move together or they do not move.
9. **Any page whose pair is not dark/light must restate `--tone-swap`.** Shared
   difference-blended marks (`.back-btn`, `.nav-counter`, the chevrons, the
   whole of `assets/cursor.js`) take their ink from it and will otherwise be
   differenced with the wrong operand — visibly, as a blue.
10. **No pure black and no pure white renders anywhere.** The only `#ffffff` and
   `#000000` left in the source are difference *operands* (`--tone-swap`, the
   cursor ring, the front page's `SWAP`) and mask values (facilitation's
   occluder raster, where `#000`/`#fff` are the 0 and 1 the shader reads back
   as `.r` and `.a`). None of them is ever a colour on screen. Adding a literal
   white or black as an actual paint is the thing to catch in review.
11. **The cursor is one blend group.** Anything added to `assets/cursor.js` goes
    *inside* the `.cursor-ring` wrapper with no blend mode of its own. Give a
    part its own `mix-blend-mode: difference` and it cancels the wrapper's
    wherever the two overlap. Two more rules hold inside it:
    - **Parts are `border-box`.** Each one centres itself on the pointer by
      pulling half its own width back with a negative margin, which only lands
      if that width is the whole visible box. Under content-box the outline's
      1.5px border put its circle 1.5px down-right of the meter — and the meter,
      which is borderless and was exactly centred, is what looked wrong.
    - **The completion fade is a one-shot.** It arms only from the settled
      branch, and an expired flash sets `shown = 0`. The arming test reads
      `shown`, so leaving it pinned at 1 re-arms on the very next frame, and the
      next: the meter blinks on and off for ever after every inversion. Measured
      at 210 re-arms in 4s before the guard, 0 after.
12. **`HOLD_STATE` is declared in `assets/keys.js` and only ever filled in
    elsewhere** (`window.HOLD_STATE = window.HOLD_STATE || …`). `cursor.js`
    loads before `scroll-nav.js`, so replacing the object would hand the meter
    a reference nothing writes to any more. A page that owns the gesture must
    publish `charge` every frame, and its `CHARGE_LIMIT` must match `limit`.
13. **On facilitation, text has `transition: none`.** The canvas turns over in one
   frame; the shared `0.1s` colour fade left every word stranded between the two
   tones just after the background had switched.

---

## 10. Common tasks

**Add a project**
1. Drop the media in `GMMBBQ/`, `Jishnu/` or `OnebyZero/` under a new folder.
2. `python scripts/build_assets.py`
3. Add `{ key: "cat/slug" }` to the right array in `assets/page-config.js`.
4. Add its entry to `assets/project-details.js`.
5. `python scripts/build_project_pages.py`

**Reorder a page** — reorder that array in `page-config.js`. Nothing else. The
prev/next arrows follow automatically.

**Move a project between pages** — cut its entry from one array, paste into
another, then rerun `build_project_pages.py` so its back link updates.

**Rename on the site without renaming the folder** — add `displayName` to its
page-config entry.

**Re-encode video only** — `python scripts/build_assets.py --videos-only`.

---

## 11. Known rough edges

**Content / housekeeping**

- `assets/hero/` (`hero-loop.mp4`, `hero-poster.jpg`) is **referenced by
  nothing**. Left over from a version of `index.html` that had a video backdrop.
- `jishnu/somaiya` and `jishnu/strate` have **no media** — they render `soon`
  placeholder plates. Both are live on facilitation.
- `assets/jishnu/volumetrics/` is deleted in the working tree but the deletion
  is uncommitted.
- Most of the shared runtime is uncommitted (§1).

**facilitation.html**

- A letter straddling the edge of a shadow takes **one tone for the whole
  letter** — the ring probe is ~18px, wider than the edge crossing, so it does
  not split. On the side where the ground matches, contrast drops. Splitting
  along the edge is the alternative; it is a look decision.
- **Stripes when the cursor sits level with a line of text.** These are the
  ascenders' own shadows cast almost horizontally — the effect being correct
  rather than failing — but it reads as busy.
- **Ragged edges where the ring probe changes its mind** along a shadow boundary
  crossing a word, most visible at the right end of the headline.
- **Project thumbnails invert inside shadows.** They are photographs being
  differenced against yellow, so they go strange colours. Duotoning them is the
  obvious fix if it matters.
- **Glyphs are ~1.5px bolder than native**, since the same raster casts and
  draws and the draw mask sits inside the fattened stroke.

**Elsewhere**

- `work.html` / `play.html` depend on jsDelivr at runtime.
- `build_assets.py` has a hardcoded ffmpeg path.
- `project.html` exists only for old links and is `noindex`.

---

## 12. Dials

| Constant | Where | Now | Effect |
|---|---|---|---|
| `MAX_IMAGES` / `MAX_VIDEOS` | build_assets.py | 8 / 2 | Per project |
| `MAX_VIDEO_SECONDS` | build_assets.py | 20 | Clip length |
| `IMG_MAX_WIDTH` / `VIDEO_MAX_WIDTH` | build_assets.py | 1600 / 1280 | Output size |
| `CHARGE_LIMIT` / `CHARGE_RATE` / `RELEASE_RATE` | all four pages | 1500 / 1200 / 3600 | The 1.25s hold |
| `SLIDE_MS` | scroll-nav.js | 700 | Slide duration |
| wheel debounce | scroll-nav.js | 500ms | Skip protection |
| `ANGLES` | facilitation.html | 2048 | Shadow-map angular resolution |
| `MAX_DIST` | facilitation.html | 2.6 | Ray length, aspect-corrected uv |
| `STEPS` | shadow shader | 512 | Coarse march, ~4px per step |
| `lineWidth` | `drawOccluders` | 1.5 | Stroke fattening; must exceed one step |
| ring radius | composite shader | 0.022 | How far outside a letter to sample |
| `occMargin` | `resize` | 0.75 × height | Band; must cover one slide |
| `occScale` | `resize` | `min(dpr, 2400/width)` | Raster resolution |
| `REST_REACH` | facilitation.html | 2.6 | Light reach at rest — past the far corner |

---

## 13. Verifying a change

**Frames are throttled to zero when the window is hidden.** Check
`document.visibilityState` before trusting any timing or visual test — several
"verified" claims during development were worthless for this reason.

- **Shadow registration:** sample `window.wrapperYAt(t)` against
  `#header-section.getBoundingClientRect().top` inside a `requestAnimationFrame`
  during a real slide. Should be `0`, not "small".
- **Registration under displacement:** move the wrapper away from where the
  raster was taken while jiggling it >0.5px so it never settles and never
  rebuilds. The shadow can then only be placed by the band offset. A sign error
  shows as double the displacement.
- **Frame pacing:** collect frame intervals across a slide; should be
  indistinguishable from idle. Currently ~4.2ms median, nothing over 32ms.
- **Shader uniforms:** parse the `uniform` declarations out of each shader source
  and compare against the name list passed to `uni()`. A missing name silently
  gives `null`, the uniform keeps its last value, and the page renders something
  plausible but wrong. This cost hours once.
- **Do not trust brace or paren counting** as a syntax check on these files — the
  transform-matrix regexes contain literal `)` inside character classes.
- **Check the console first** when a WebGL page renders garbage. A shader that
  fails to compile still links and still draws; the error is only in the log.

---

## 14. Additions: spreads, the GMMBBQ page, slide art

**Spreads.** A story block `{ spread: { w, h, items } }` (assets/render-project.js)
places text and media at the x / y / w / h they had on some other page -- a
slide of `Old Portfolio.pdf`, a page of the GMMBBQ Readymag site -- in that
page's own units. Type is sized in the same units (`fs`) through a container
query, with a floor. Under 768px a spread becomes a column in authored order.
`layout: "spread"` on a project hides the stock header, meta row and overview,
since the first spread is the title page. Used by A Slightly Emasculated Man
(PDF pp. 51-60), String Theory and Mapping Materials (Readymag pp. 3 and 5).

**Films** are a thumbnail and a play mark until pressed (`youtubeFrame`).
YouTube will not play in a frame with no Referer, which is every page opened
from disk; there the press opens YouTube in a new tab instead.

**Line art.** `scripts/build_slide_art.py` cuts drawings out of the PDF and
bakes them as play-pink on transparent PNGs (a CSS mask would be a CORS fetch
and fail on file://), and saves the PDF's photographs as JPEGs. SVG drawings
that must follow the page's ink go in `assets/diagrams.js`, which
render-project.js checks before fetching the file.

**gmmbbq.html** is standalone and natively scrolling, with its own styles.
Behind it is the old play.html boid flock -- the three.js version's box,
camera, forces and hold/burst sequence, stepped at a fixed 60Hz -- drawn on a
2D canvas as small Gamma speakers: holding pulls them into the pointer and
stretches them, the burst throws them out and the page flips four steps in.
The gigs (Joy Orbison, Alien Garden, Burrow) are one mixed gallery whose names
show only on hover or focus; there are no links out. `assets/gamma-speaker.svg`
is the mark, and the hero uses the full logo (`assets/Asset 1.png`) inked pink
and near-black as `assets/gmmbbq/about/logo-*.png`, swapped on the turn.
play.html links to the page twice: a buzzing speaker in the page's ink (two
coloured ghosts for the RGB delay) in its own slide, and `#gmm-float`, one
that drifts over the whole page inverting what it crosses by difference. Both
grow and shake under the pointer and go on click. The floating one comes from
`assets/gmm-float.js`, which work.html loads too (not index.html or
facilitation.html): it flies in from past a random edge a moment after load, then
wanders, its RGB channels split from each page's `--tone-swap-rgb`.

**play.html's turn** no longer squares off. The pack swells into its
neighbours and the remaining holes are packed with circles, coarse to fine
(`FILL_LEVELS`), found once at firing by reading back a quarter-scale raster.

---

## 15. The site bar, project screens, the showreel

**The site bar** (`assets/site-bar.js`) is a frosted plate across the top of
every page -- Home, Work, Play, Learn -- after the one at the foot of
dontmatter.eu. A darker fill behind the words shows how far down the page you
are: list pages report it from `assets/scroll-nav.js` (a `navprogress` event,
since they move by transform), everything else is read off the scroll
position. The script brings its own styles; a page needs only
`<script src="assets/site-bar.js" defer></script>`. It replaced the front
page's three links and the section links on project pages, and on narrow
screens it takes the whole top edge. It stops presses from reaching the
window, so clicking it never starts a hold. The back links are gone; GMMBBQ
is reached through the speaker, which says "click me or not, idc (pls click)"
once the reader reaches the bottom of a page (assets/gmm-float.js).

**Highlights are a colour, not a plate**: `--hl` (and `--hl-alt` on the light
side), the next of the three section colours along -- magenta on work,
yellow on play, cyan on learn and the front page. It colours the hold hint
(the in-page line, the label on the cursor -- now outside the cursor's
difference group, which would otherwise invert it -- and the front page's
canvas), the speaker's line, and on project pages the bold phrases and the
category tag.

**One project to a screen** on work and play (`assets/render-projects.js`,
`.project-screen` in `assets/page.css`): the project's first clip, looping, or
its best still, beside the name, year and tools, the overview and a "View
project" link. Every other screen swaps sides. The cards, the thumbnail fan
and the dark-only / bright-only groups are gone. On work and play only the
pictures (`.screen-media`) are punched out of the inversion layer, so the type
beside them inverts with the ground.

**Every video autoplays**, muted, while it is on screen: project screens,
learn's student work, GMMBBQ, and on project pages the documentation clips
(a corner button turns the sound on and brings the controls) and the YouTube
films (swapped in muted the first time they scroll into view; on `file://`
they stay a thumbnail, since YouTube will not play without a Referer).

**Project page highlights** (`assets/project-page.css`): bold phrases and the
category tag in `--hl`, links a thick accent underline that turns `--hl` on
hover, and story headings a short accent bar.

**The showreel** behind the front page. `scripts/build_showreel.py` cuts 22
of the best clips into one 12-second loop, every cut under a second, twice --
`assets/showreel/reel-wide.mp4` and `reel-tall.mp4` (about 1.6 MB each), each
cut cropped to fill, so portrait and landscape sources mix. Edit `CUTS` and
rerun to change it. `index.html` draws the reel's frames into its canvas as
part of the ground (screened in, on the dark side only -- the light side is
the description, on plain paper), under the brush marks and the type -- the type is painted last in difference
against the canvas, so a video anywhere else would either be hidden or sit
outside the difference. `REEL_ALPHA` is the strength. Skipped under reduced
motion and Save-Data.

