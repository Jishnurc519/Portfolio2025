// A ring instead of an arrow, and the page's two gestures drawn on it.
//
// It is a stroke and nothing else, blended in difference, so it is never a
// colour — it is whatever it is standing on, inverted. Over the dark ground it
// is light, over a light card it is dark, and halfway across the wipe it is
// both, split down the same edge the wipe is on. The site's two tones are
// exact complements, so "inverted" lands on the other one exactly rather than
// somewhere near it. That is the same rule the rest of the site's ink follows,
// so the cursor belongs to the page rather than floating above it.
//
// Three things live here now:
//
//   the ring     trails the pointer on a spring. Flick and it stretches after
//                you; stop and it settles. Same elasticity the pinch-zoom has,
//                so the two gestures feel like they come from one place.
//   the meter    a smaller circle inside it. Nothing at rest; on a hold, an
//                arc sweeps the rim while a disc fills the middle, both
//                completing at the moment the page turns over. Its empty
//                track also carries the hover cue — over anything you can act
//                on, the circle appears, waiting.
//   the label    the hold hint, moved off the page and onto the pointer, which
//                is where the gesture is. The in-page .hint line stays for
//                touch, where there is no cursor to put it on. It is set in
//                the page's highlight colour (--hl), so it is the one part
//                that is NOT in the blend group below: differenced, that
//                colour would come out as whatever its backdrop is not. It is
//                its own fixed element, moved with the ring.
//
// ONE blend group. Everything is painted inside a single element carrying the
// difference blend, never one blend per part: two difference layers stacked
// cancel each other out, so an arc crossing the ring would have punched the
// ground back through both of them. Inside the group the parts paint over each
// other normally, and the finished mark is inverted once, as one mark.
//
// Only for pointers that hover. Touch has no cursor to replace and gets none.
(function () {
  if (!window.matchMedia || !window.matchMedia('(hover: hover) and (pointer: fine)').matches) return;
  if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) return;

  // Geometry. The ring is bigger than it was (26px) to leave room for the
  // meter inside it, and the hover scales came down by the same factor so a
  // hovered ring is still the ~52px across it always was.
  const RING = 34;        // px across
  const METER = 26;       // px across, the <svg> box
  const METER_R = 9;      // arc radius inside that box
  // The disc that fills, at full charge. Exactly the arc's inner edge
  // (METER_R − stroke/2), so a complete charge closes up into one solid disc
  // instead of a dot inside a ring with a gap of ground still showing between
  // them. Mid-charge the gap is what is left to fill, which is the point.
  const FILL_R = 7.75;
  const CIRC = 2 * Math.PI * METER_R;
  const FLASH = 0.28;     // seconds a completed meter stays up while it fades
  const MID = METER / 2;

  const style = document.createElement('style');
  style.textContent = [
    '.cursor-ring {',
    '  position: fixed; top: 0; left: 0; z-index: 9000;',
    '  width: 0; height: 0; pointer-events: none;',
    // The one blend for the whole cursor, and the isolation that keeps the
    // parts blending with each other rather than with the page.
    '  mix-blend-mode: difference; isolation: isolate;',
    '  will-change: transform; opacity: 0;',
    '  transition: opacity 0.25s ease;',
    '}',
    '.cursor-ring.is-live { opacity: 1; }',
    // border-box, and it is load-bearing. Every part centres itself by pulling
    // half its own width back with a negative margin, which only lands on the
    // pointer if that width is the whole visible box. Under the default
    // content-box the outline's 1.5px border sat outside its 34px, making the
    // circle 37px across and its centre 1.5px down and to the right — so the
    // meter, which has no border and was exactly centred, read as the thing
    // that was off. Stated here rather than inherited, so the cursor does not
    // depend on what the host page does about box-sizing.
    '.cursor-ring > * { position: absolute; left: 0; top: 0; box-sizing: border-box; }',
    // The stretchy part. It alone takes the rotate/scale, so the meter inside
    // is never squashed by a flick and never grows with a hover.
    '.cursor-ring-o {',
    '  width: ' + RING + 'px; height: ' + RING + 'px;',
    '  margin: ' + (-RING / 2) + 'px 0 0 ' + (-RING / 2) + 'px;',
    '  border: 1.5px solid var(--tone-swap, #ffffff); border-radius: 50%;',
    '}',
    '.cursor-ring-meter {',
    '  width: ' + METER + 'px; height: ' + METER + 'px;',
    '  margin: ' + (-METER / 2) + 'px 0 0 ' + (-METER / 2) + 'px;',
    '  overflow: visible; opacity: 0;',
    '}',
    '.cursor-ring-meter .m-track,',
    '.cursor-ring-meter .m-arc { fill: none; stroke: var(--tone-swap, #ffffff); }',
    // The track is the "empty" circle: a partial difference operand, so it
    // lands part-way between the ground and its opposite — a quiet line on
    // either ground, the same trick .nav-count-rule uses.
    '.cursor-ring-meter .m-track { stroke-width: 1; opacity: 0.38; }',
    '.cursor-ring-meter .m-arc { stroke-width: 2.5; }',
    '.cursor-ring-meter .m-fill { fill: var(--tone-swap, #ffffff); stroke: none; }',
    // The hint, in the page's highlight colour (--hl, and --hl-alt once the
    // page has turned to its light side). Plain text, no plate.
    '.cursor-ring-hint {',
    '  position: fixed; left: 0; top: 0; z-index: 9000; pointer-events: none;',
    "  font-family: 'Clash Display', sans-serif;",
    '  font-size: 15px; font-weight: 600; line-height: 1.35;',
    '  letter-spacing: 0.01em; white-space: nowrap;',
    '  color: var(--hl, var(--tone-swap, #ffffff)); opacity: 0;',
    '}',
    'body.inverted-theme .cursor-ring-hint { color: var(--hl-alt, var(--hl, #0b0e13)); }',
    '.cursor-ring-hint span { display: block; }',
    // The second line is smaller and that is all. No opacity on it: the label
    // is already being drawn at the hint keyframes' own peak (0.55 on the front
    // page), and dimming it again from there put it at ~3:1 against the
    // ground — the same mistake .project-tags is commented against in
    // assets/page.css. The hierarchy comes out of the size instead.
    '.cursor-ring-hint .l2 { font-size: 12px; }',
    // The native arrow is replaced, not hidden behind — anything that sets its
    // own cursor (zoom-in on a gallery still) is answered by the ring's own
    // states instead.
    'html.has-ring, html.has-ring * { cursor: none !important; }',
    // The page's hint line is the touch version of the label above, so on a
    // pointer it stops being ink and becomes a clock. Emptied by colour rather
    // than by visibility or display: the element has to stay fully visible for
    // its opacity animation to keep running and be readable frame by frame,
    // and it keeps the space it already occupied so nothing on the page moves.
    // !important because each page states its own .hint colour, and one of
    // those (facilitation) matches this selector's weight exactly.
    // .ring-live and not .has-ring: the swap waits until the pointer has
    // moved and the ring exists to carry the line.
    'html.has-ring.ring-live:not(.hint-pinned) .hint { color: transparent !important; }'
  ].join('\n');
  document.head.appendChild(style);

  const ring = document.createElement('div');
  ring.className = 'cursor-ring';
  ring.setAttribute('aria-hidden', 'true');
  ring.innerHTML = '<div class="cursor-ring-o"></div>'
    + '<svg class="cursor-ring-meter" viewBox="0 0 ' + METER + ' ' + METER + '">'
    + '<circle class="m-track" cx="' + MID + '" cy="' + MID + '" r="' + METER_R + '"/>'
    + '<circle class="m-arc" cx="' + MID + '" cy="' + MID + '" r="' + METER_R + '"'
    + ' transform="rotate(-90 ' + MID + ' ' + MID + ')"/>'
    + '<circle class="m-fill" cx="' + MID + '" cy="' + MID + '" r="0"/>'
    + '</svg>';
  const label = document.createElement('div');
  label.className = 'cursor-ring-hint';
  label.setAttribute('aria-hidden', 'true');

  const outline = ring.querySelector('.cursor-ring-o');
  const meter = ring.querySelector('.cursor-ring-meter');
  const arc = ring.querySelector('.m-arc');
  const fill = ring.querySelector('.m-fill');

  // The arc is one dash as long as the circle, pulled right back out of view.
  // At rest the whole circumference is offset, so nothing is drawn at all.
  arc.style.strokeDasharray = CIRC;
  arc.style.strokeDashoffset = CIRC;

  // The label says exactly what the page's own hint says — one source of truth,
  // so the two cannot drift. Split on the middot the copy already uses, because
  // "hold anywhere or space to invert" and "1 2 3 for work play learn" are two
  // different pieces of news, and read better stacked than run together
  // alongside a pointer.
  const hintSrc = document.querySelector('.hint');
  if (hintSrc) {
    hintSrc.textContent.trim().split(/\s*·\s*/).slice(0, 2).forEach(function (part, i) {
      const line = document.createElement('span');
      line.className = i ? 'l2' : 'l1';
      line.textContent = part;
      label.appendChild(line);
    });
  }

  document.documentElement.classList.add('has-ring');
  const attach = function () { document.body.appendChild(ring); document.body.appendChild(label); };
  if (document.body) attach(); else document.addEventListener('DOMContentLoaded', attach);

  // Where the pointer is, where the ring is, and how fast the ring is going.
  let px = window.innerWidth / 2, py = window.innerHeight / 2;
  let rx = px, ry = py, vx = 0, vy = 0;
  let scale = 1, scaleTarget = 1;
  let live = false, selectable = false;
  // Charge as drawn versus charge as counted, and how far open the meter is at
  // all. They are separate because the meter has to be able to sit visible and
  // empty over a link, and full and fading just after the page has turned.
  let shown = 0, open = 0, flash = 0;
  // Measured rather than read in the loop: the text never changes, so asking
  // for its width every frame would be a layout every frame for nothing.
  let labelW = 0, labelH = 0;
  function measure() { labelW = label.offsetWidth; labelH = label.offsetHeight; }

  const SELECTABLE = 'a, button, .project-item, .still, [role="button"]';
  const ZOOMABLE = '.gallery img, .lightbox-open';

  window.addEventListener('pointermove', function (e) {
    if (e.pointerType === 'touch') return;
    px = e.clientX; py = e.clientY;
    // The ring only takes the hint line off the page once it is actually on
    // screen, which is the first time the pointer moves. Handing it over at
    // load instead meant a visitor who opened the page and read it without
    // touching the mouse was told nothing at all: the page's own line had
    // already been made transparent for a ring that had not been drawn yet.
    if (!live) {
      live = true; rx = px; ry = py;
      ring.classList.add('is-live');
      document.documentElement.classList.add('ring-live');
    }
    // Anything you can act on opens the ring up; a still you can enlarge opens
    // it further, which is what replaces the zoom-in arrow.
    const t = e.target;
    const near = function (sel) { return t.closest && t.closest(sel); };
    selectable = !!(near(SELECTABLE) || near(ZOOMABLE));
    scaleTarget = near(ZOOMABLE) ? 1.55 : near(SELECTABLE) ? 1.32 : 1;
  }, { passive: true });

  window.addEventListener('pointerdown', function () { scaleTarget *= 0.62; });
  window.addEventListener('pointerup', function () { scaleTarget = Math.max(1, scaleTarget / 0.62); });
  document.addEventListener('mouseleave', function () { live = false; ring.classList.remove('is-live'); });
  window.addEventListener('resize', measure);
  if (document.fonts && document.fonts.ready) document.fonts.ready.then(measure);

  // Critically damped-ish spring. Stiffness and damping are per second, so the
  // trail is the same length whatever the refresh rate.
  const STIFF = 170, DAMP = 22;
  let last = performance.now();

  function frame(now) {
    requestAnimationFrame(frame);
    const dt = Math.min(0.05, (now - last) / 1000);
    last = now;

    const ax = (px - rx) * STIFF - vx * DAMP;
    const ay = (py - ry) * STIFF - vy * DAMP;
    vx += ax * dt; vy += ay * dt;
    rx += vx * dt; ry += vy * dt;

    scale += (scaleTarget - scale) * Math.min(1, dt * 14);

    // The group carries the position; the parts inside it carry their own
    // offsets, so a stretch cannot reach the meter or the label.
    ring.style.transform = 'translate(' + rx + 'px, ' + ry + 'px)';

    // Stretched along the direction of travel: the faster it is going the more
    // it leans into an ellipse, which is what makes it read as elastic rather
    // than merely late. The outline only — a stretched progress meter would be
    // unreadable as a proportion.
    const speed = Math.hypot(vx, vy);
    const stretch = Math.min(0.55, speed / 3200);
    const angle = speed > 1 ? Math.atan2(vy, vx) : 0;
    outline.style.transform = 'rotate(' + angle + 'rad) scale('
      + (scale * (1 + stretch)) + ', ' + (scale * (1 - stretch * 0.7)) + ')';

    // --- the meter ---
    // Whoever owns the gesture on this page publishes into HOLD_STATE
    // (assets/keys.js). Read fresh each frame rather than captured once,
    // because scroll-nav.js loads after this file.
    const hold = window.HOLD_STATE;
    const raw = hold ? Math.min(1, (hold.charge || 0) / (hold.limit || 1500)) : 0;

    // Three states, and exactly one of them runs per frame.
    //
    // A charge that was nearly full and is suddenly nothing is the page having
    // turned over, not the hold being let go of — a released hold unwinds over
    // ~0.4s and `shown` follows it down, so it never looks like this. On the
    // real thing the completed circle is held for a moment and faded, so the
    // gesture is seen to finish rather than vanishing one frame short of its
    // own arrival.
    if (flash > 0) {
      flash = Math.max(0, flash - dt);
      if (flash > 0) {
        shown = 1;
        // Handed to `open` directly rather than eased, so the fade is exactly
        // as long as the flash.
        open = flash / FLASH;
      } else {
        // Spent, and both are zeroed rather than left to decay. The re-arm test
        // below reads `shown`: leaving it pinned at 1 here re-armed the flash on
        // the very next frame, and then again, and again — the meter blinked on
        // and off for ever after every inversion instead of fading once.
        shown = 0;
        open = 0;
      }
    } else if (shown > 0.7 && raw < 0.1) {
      // Just arrived. Arming from here and nowhere else is what makes it a
      // one-shot: `shown` is now 0 until a genuinely new charge lifts it back
      // over the threshold.
      flash = FLASH;
      shown = 1;
      open = 1;
    } else {
      shown += (raw - shown) * Math.min(1, dt * 30);
      // Open over anything actionable even at rest — that is the hover cue —
      // and over any charge at all, wherever it is happening.
      const want = (raw > 0.01 || selectable) ? 1 : 0;
      open += (want - open) * Math.min(1, dt * 14);
    }

    meter.style.opacity = open < 0.002 ? 0 : open;
    arc.style.strokeDashoffset = CIRC * (1 - shown);
    fill.setAttribute('r', (FILL_R * shown).toFixed(2));

    // --- the label ---
    // Timed by the page's own hint element, which assets/hold-hint.js flashes
    // on load and again after every idle twenty seconds. Faded back out while
    // the hold is under way: by then it is describing what you are doing.
    let alpha = 0;
    // Not while the page's own first showing is pinned in place
    // (assets/hold-hint.js): the line is on the page then, and saying it
    // twice at once is noise.
    // And not while the pointer is off the page: the chip is outside the
    // ring's group, so the ring fading out no longer takes it along.
    if (live && hintSrc && !document.documentElement.classList.contains('hint-pinned')) {
      alpha = (parseFloat(getComputedStyle(hintSrc).opacity) || 0)
        * (1 - Math.min(1, shown * 1.6));
    }
    label.style.opacity = alpha;
    if (alpha > 0.002) {
      if (!labelW) measure();
      // Away from whichever edges are close, so a hint that catches the corner
      // of the window still fits on screen.
      const gap = RING / 2 + 8;
      const x = rx + gap + labelW < window.innerWidth - 8 ? gap : -gap - labelW;
      const y = ry + gap + labelH < window.innerHeight - 8 ? gap : -gap - labelH;
      label.style.transform = 'translate(' + (rx + x) + 'px, ' + (ry + y) + 'px)';
    }
  }
  requestAnimationFrame(frame);
})();
