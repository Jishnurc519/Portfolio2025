// The floating speaker: the Gamma Barbecue mark, drifting over the whole page
// and inverting whatever it passes over -- type, cards, the pack -- by
// difference against the page's --tone-swap, the way the pack itself does.
// Above the pack, below the cursor. Clicking it goes to
// GMMBBQ. Shared by work, play and learn; index doesn't load it.
//
// It is drawn a channel at a time -- red, green and blue of the swap tone,
// combined by `lighten` inside a group of their own -- so that at rest the
// three add back up to the swap exactly, and under the pointer they pull
// apart into an RGB split while rings of sound come off it.
//
// It doesn't start on the page: a moment after load it flies in from
// somewhere past one of the edges, and only once it is fully on screen does
// it settle into its slow wander and start turning off the edges.
(function () {
  if (document.getElementById('gmm-float')) return;

  const css = `
    #gmm-float {
      position: fixed; left: 0; top: 0; z-index: 150;
      width: clamp(56px, 5.5vw, 84px); aspect-ratio: 900 / 1153;
      mix-blend-mode: difference; isolation: isolate;
      pointer-events: auto; cursor: pointer; will-change: transform;
      -webkit-tap-highlight-color: transparent;
      visibility: hidden;
    }
    #gmm-float.live { visibility: visible; }
    #gmm-float .inner {
      position: relative; display: block; width: 100%; height: 100%;
      transition: scale 0.3s cubic-bezier(0.34, 1.56, 0.64, 1);
    }
    #gmm-float .fc { position: absolute; inset: 0; mix-blend-mode: lighten; transition: transform 0.25s ease; }
    #gmm-float svg { display: block; width: 100%; height: 100%; }
    #gmm-float:hover .inner, #gmm-float:focus-visible .inner {
      scale: 1.2; animation: gmm-float-jitter 0.22s linear infinite;
    }
    #gmm-float:hover .fc-r, #gmm-float:focus-visible .fc-r { transform: translate(-5px, 2px); }
    #gmm-float:hover .fc-b, #gmm-float:focus-visible .fc-b { transform: translate(5px, -2px); }
    /* Rings off the cone's mouth, only while it is hovered: out, and gone. */
    #gmm-float .inner::before, #gmm-float .inner::after {
      content: ''; position: absolute; left: 50%; top: 40%;
      width: 120%; aspect-ratio: 1; margin: -60% 0 0 -60%;
      border: 2px solid var(--tone-swap); border-radius: 50%;
      mix-blend-mode: lighten; opacity: 0; pointer-events: none;
    }
    #gmm-float:hover .inner::before, #gmm-float:focus-visible .inner::before { animation: gmm-float-ring 1.1s ease-out infinite; }
    #gmm-float:hover .inner::after, #gmm-float:focus-visible .inner::after { animation: gmm-float-ring 1.1s ease-out 0.55s infinite; }
    @keyframes gmm-float-jitter {
      0%   { translate: 0 0; rotate: 0deg; }
      25%  { translate: 1px -0.5px; rotate: 0.6deg; }
      50%  { translate: -1px 0.5px; rotate: -0.6deg; }
      75%  { translate: 0.5px 1px; rotate: 0.3deg; }
      100% { translate: 0 0; rotate: 0deg; }
    }
    @keyframes gmm-float-ring {
      0%   { opacity: 0.9; scale: 0.4; }
      100% { opacity: 0; scale: 1.9; }
    }
    @media (prefers-reduced-motion: reduce) {
      #gmm-float:hover .inner, #gmm-float .inner::before, #gmm-float .inner::after { animation: none; }
    }
    /* What it says once the reader has reached the bottom of the page, in
       the page's highlight colour like the hold hint. Plain paint, not
       difference, so it is the same colour over anything. */
    #gmm-say {
      position: fixed; left: 0; top: 0; z-index: 151;
      font-family: 'Clash Display', sans-serif; font-size: 15px; font-weight: 600;
      white-space: nowrap; text-decoration: none;
      color: var(--hl, var(--tone-light, #f4f1ec));
      opacity: 0; pointer-events: none; transition: opacity 0.35s ease;
    }
    #gmm-say.on { opacity: 1; pointer-events: auto; }
    body.inverted-theme #gmm-say { color: var(--hl-alt, var(--hl, #0b0e13)); }
  `;
  const style = document.createElement('style');
  style.textContent = css;
  document.head.appendChild(style);

  // assets/gamma-speaker.svg, inline, so the pages need no <symbol> of their own.
  const mark =
    '<svg viewBox="0 0 900 1153" aria-hidden="true" focusable="false">' +
    '<path d="M76 186 A660 660 0 0 1 824 186 M158 296 A560 560 0 0 1 742 296 M268 414 A300 300 0 0 1 632 414"' +
    ' fill="none" stroke="currentColor" stroke-width="88" stroke-linecap="round"/>' +
    '<path d="M30 530 L870 530 L630 862 L630 1126 L270 1126 L270 862 Z"' +
    ' fill="currentColor" stroke="currentColor" stroke-width="44" stroke-linejoin="round"/></svg>';

  const el = document.createElement('a');
  el.href = 'gmmbbq.html';
  el.id = 'gmm-float';
  el.setAttribute('aria-label', 'GMMBBQ');
  el.innerHTML = '<span class="inner">' +
    '<span class="fc fc-r">' + mark + '</span>' +
    '<span class="fc fc-g">' + mark + '</span>' +
    '<span class="fc fc-b">' + mark + '</span></span>';

  // The channels are this page's swap tone, split: each page has its own.
  const rgb = getComputedStyle(document.documentElement)
    .getPropertyValue('--tone-swap-rgb').trim().split(',').map(Number);
  const [r, g, b] = rgb.length === 3 && rgb.every((n) => !isNaN(n)) ? rgb : [255, 255, 255];
  el.querySelector('.fc-r').style.color = 'rgb(' + r + ',0,0)';
  el.querySelector('.fc-g').style.color = 'rgb(0,' + g + ',0)';
  el.querySelector('.fc-b').style.color = 'rgb(0,0,' + b + ')';

  document.body.appendChild(el);

  // --- "click me or not, idc (pls click)" ---
  // Says it only at the bottom of the page, where the reader has seen
  // everything else and the speaker is the one thing left to do. The list
  // pages move by transform, so the bottom is read off the progress
  // assets/scroll-nav.js reports; a page that scrolls natively, off the
  // scroll position. It goes again if they head back up.
  const say = document.createElement('a');
  say.id = 'gmm-say';
  say.href = 'gmmbbq.html';
  say.textContent = 'click me or not, idc (pls click)';
  say.tabIndex = -1;
  ['pointerdown', 'mousedown', 'touchstart'].forEach((t) =>
    say.addEventListener(t, (e) => e.stopPropagation(), { passive: true }));
  document.body.appendChild(say);
  let atBottom = false;
  const bottom = (p) => {
    if (!atBottom && p >= 0.97) atBottom = true;
    else if (atBottom && p < 0.85) atBottom = false;
    say.classList.toggle('on', atBottom && el.classList.contains('live'));
  };
  window.addEventListener('navprogress', (e) => bottom(e.detail));
  window.addEventListener('scroll', () => {
    const max = document.documentElement.scrollHeight - window.innerHeight;
    if (max > 4) bottom(window.scrollY / max);
  }, { passive: true });

  const reduce = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  const SPEED = 38;          // px per second, wandering
  const ENTRY_SPEED = 120;   // px per second, flying in
  const DELAY = 900;         // ms after load before it shows up

  let x, y, a, entering, speed, spawnedAt = 0;
  let held = false, started = false, last = performance.now();
  el.addEventListener('pointerenter', () => { held = true; });
  el.addEventListener('pointerleave', () => { held = false; });

  function spawn() {
    const w = el.offsetWidth, h = el.offsetHeight;
    const W = window.innerWidth, H = window.innerHeight;
    if (reduce) {
      // No flight: it is simply there, and stays put.
      x = W * 0.72; y = H * 0.3; a = 0; entering = false; speed = 0;
      return;
    }
    // A random point just past a random edge, heading for somewhere in the
    // middle of the screen.
    const pad = 24;
    const edge = Math.floor(Math.random() * 4);
    if (edge === 0) { x = -w - pad; y = Math.random() * (H - h); }
    else if (edge === 1) { x = W + pad; y = Math.random() * (H - h); }
    else if (edge === 2) { x = Math.random() * (W - w); y = -h - pad; }
    else { x = Math.random() * (W - w); y = H + pad; }
    const tx = W * (0.25 + Math.random() * 0.5) - w / 2;
    const ty = H * (0.25 + Math.random() * 0.5) - h / 2;
    a = Math.atan2(ty - y, tx - x);
    entering = true;
    speed = ENTRY_SPEED;
  }

  setTimeout(() => {
    spawn();
    started = true;
    spawnedAt = performance.now();
    last = performance.now();
    // Placed before it shows, so it never flashes at the corner.
    el.style.transform = 'translate(' + x.toFixed(1) + 'px,' + y.toFixed(1) + 'px)';
    el.classList.add('live');
  }, reduce ? 0 : DELAY);

  // --- the pictures are walls too ---
  // It drifts over type and ground, but a photograph or a clip turns it
  // back, the way the screen's edges do. Whichever side it went in by the
  // least is the side it came through, so that is the axis it bounces on.
  // The pictures move under it as the page slides, and one can arrive on
  // top of it; then it is pushed back out quickly rather than in one jump,
  // so it reads as being shoved aside rather than teleported.
  const PICTURES = '.screen-media, .behance-frame, .frames figure, .bleed, .onward img, .posts .post';
  let pictures = [];
  const findPictures = () => { pictures = [].slice.call(document.querySelectorAll(PICTURES)); };
  findPictures();
  window.addEventListener('load', findPictures);
  window.addEventListener('resize', findPictures);
  function bounceOffPictures(w, h, W, H, dt) {
    const PAD = 6, SHOVE = 900 * dt;
    for (let i = 0; i < pictures.length; i++) {
      const r = pictures[i].getBoundingClientRect();
      if (r.width < 2 || r.bottom < 0 || r.top > H || r.right < 0 || r.left > W) continue;
      const left = r.left - PAD, right = r.right + PAD, top = r.top - PAD, bottom = r.bottom + PAD;
      if (x + w <= left || x >= right || y + h <= top || y >= bottom) continue;
      const outL = x + w - left, outR = right - x, outT = y + h - top, outB = bottom - y;
      const ox = Math.min(outL, outR), oy = Math.min(outT, outB);
      if (ox < oy) {
        const dir = outL < outR ? -1 : 1;
        x += dir * Math.min(ox, SHOVE);
        // Only turn round if it is heading in; otherwise it is already leaving.
        if (Math.sign(Math.cos(a)) === -dir) a = Math.PI - a;
      } else {
        const dir = outT < outB ? -1 : 1;
        y += dir * Math.min(oy, SHOVE);
        if (Math.sign(Math.sin(a)) === -dir) a = -a;
      }
    }
  }

  (function tick(now) {
    requestAnimationFrame(tick);
    const dt = Math.min(0.05, (now - last) / 1000);
    last = now;
    if (!started) return;
    const w = el.offsetWidth, h = el.offsetHeight;
    const W = window.innerWidth, H = window.innerHeight;
    if (!held && !reduce) {
      if (entering) {
        // Straight in, with only a slight weave; the walls don't count yet.
        a += Math.sin(now / 600) * 0.4 * dt;
        // Or, if it somehow hasn't made it in after a while, the walls take
        // over and pull it on.
        if ((x >= 8 && x <= W - w - 8 && y >= 60 && y <= H - h - 8) ||
            now - spawnedAt > 8000) entering = false;
      } else {
        // A heading that wanders a little every frame, and turns back in
        // from any edge it reaches.
        a += (Math.random() - 0.5) * 1.6 * dt + Math.sin(now / 2300) * 0.25 * dt;
      }
      // Eases down from the entry speed to the wander.
      speed += ((entering ? ENTRY_SPEED : SPEED) - speed) * Math.min(1, dt * 1.5);
      x += Math.cos(a) * speed * dt;
      y += Math.sin(a) * speed * dt;
      if (!entering) {
        if (x < 8) { x = 8; a = Math.PI - a; }
        if (x > W - w - 8) { x = W - w - 8; a = Math.PI - a; }
        if (y < 60) { y = 60; a = -a; }
        if (y > H - h - 8) { y = H - h - 8; a = -a; }
        bounceOffPictures(w, h, W, H, dt);
      }
    }
    el.style.transform = 'translate(' + x.toFixed(1) + 'px,' + y.toFixed(1) + 'px) rotate(' +
      (reduce ? 0 : Math.sin(now / 1700) * 8).toFixed(2) + 'deg)';
    // The chip rides beside it, on whichever side has room.
    if (atBottom) {
      const sw = say.offsetWidth, sh = say.offsetHeight;
      const sx = x + w + 10 + sw < W - 8 ? x + w + 10 : Math.max(8, x - sw - 10);
      const sy = Math.min(H - sh - 8, Math.max(8, y + h * 0.38 - sh / 2));
      say.style.transform = 'translate(' + sx.toFixed(1) + 'px,' + sy.toFixed(1) + 'px)';
    }
  })(last);
})();
