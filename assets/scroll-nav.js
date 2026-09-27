// Snap-scroll navigation shared by work.html / play.html / facilitation.html.
//
// Native scrolling is off (see the locks in assets/page.css). Instead, one
// wheel tick / arrow key / chevron tap slides the next .scroll-target to the
// centre of the viewport by transforming #main-wrapper, and marks it .active
// so it inverts against the page theme.
//
// Load this as a classic script AFTER assets/render-projects.js — it measures
// cards that script appends. Each page's WebGL module talks to it through
// three globals: HOLD_STATE.charge, toggleInvert(), and recentre().
(function () {
  const wrapper = document.getElementById('main-wrapper');
  const listEl = document.querySelector('.project-list');
  // <body data-scroll="free"> (facilitation.html) is one continuous read
  // rather than a stack of cards, so it glides wherever the wheel or finger
  // takes it instead of snapping from target to target. Its .scroll-targets
  // are chapter marks: the counter reads which one you are in, and the
  // chevrons / arrow keys step by a screen rather than by a card.
  // A phone gets it on every page: a finger expects to drag the page, and the
  // snap only ever answered the chevrons, so a swipe did nothing at all.
  const FREE = !!document.body && (document.body.dataset.scroll === 'free'
    || window.matchMedia('(hover: none) and (pointer: coarse)').matches);
  let targets = [];
  let currentIndex = 0;

  // Charge level of the hold-to-invert gesture, in the same units each page's
  // animate loop uses. Read here so checkInteraction() can tell a real tap on
  // a card from the tail end of a hold that happened to finish on one.
  // assets/keys.js declares it; this only fills it in if that never ran.
  window.HOLD_STATE = window.HOLD_STATE || { charge: 0, limit: 1500 };

  // While the list is sliding, cards pass underneath a stationary cursor and
  // the browser re-evaluates :hover on whatever lands there — which makes the
  // card inversion and the thumbnail reveal look like they are firing at
  // random. Suspend pointer-events on the list for the duration of the slide.
  let hoverLockTimeout;
  function suspendHover(duration) {
    if (!listEl) return;
    listEl.style.pointerEvents = 'none';
    clearTimeout(hoverLockTimeout);
    hoverLockTimeout = setTimeout(() => { listEl.style.pointerEvents = 'auto'; }, duration);
  }

  // Recomputed on every nav because facilitation.html's dark-only/bright-only
  // cards enter and leave the DOM flow whenever the theme flips.
  function updateTargets() {
    targets = Array.from(document.querySelectorAll('.scroll-target'))
      .filter((el) => window.getComputedStyle(el).display !== 'none');
    currentIndex = Math.max(0, Math.min(targets.length - 1, currentIndex));
    updateChevronVisibility();
    updateCounter();
    if (FREE) updateFreeProgress();
  }

  function updateChevronVisibility() {
    const up = document.getElementById('nav-up');
    const down = document.getElementById('nav-down');
    if (!up || !down) return;
    up.style.opacity = currentIndex <= 0 ? '0.2' : '1';
    down.style.opacity = currentIndex >= targets.length - 1 ? '0.2' : '1';
  }

  // --- WHERE AM I ---
  // The list has no scrollbar, so without this there is nothing on screen
  // saying how long the page is or how far down it you are. Built here rather
  // than in the markup so all three pages get it from one place.
  const counter = document.createElement('div');
  counter.className = 'nav-counter';
  counter.setAttribute('aria-hidden', 'true');
  counter.innerHTML = '<span class="nav-count-now"></span>'
    + '<span class="nav-count-rule"><i></i></span>'
    + '<span class="nav-count-all"></span>';
  const counterNow = counter.querySelector('.nav-count-now');
  const counterAll = counter.querySelector('.nav-count-all');
  const counterFill = counter.querySelector('.nav-count-rule i');
  document.addEventListener('DOMContentLoaded', () => document.body.appendChild(counter));
  if (document.body) document.body.appendChild(counter);

  const pad = (n) => String(n).padStart(2, '0');
  function updateCounter() {
    if (!targets.length) return;
    counterNow.textContent = pad(currentIndex + 1);
    counterAll.textContent = pad(targets.length);
    counterFill.style.transform =
      `scaleY(${targets.length < 2 ? 1 : (currentIndex + 1) / targets.length})`;
  }

  // The wrapper used to be slid with a CSS transition. That runs on the
  // compositor thread, which is the right place for it — except that
  // facilitation.html draws its shadows from where the letters are according
  // to the main thread. The two threads sample the same movement a frame
  // apart, and a slide opens at roughly 5px per millisecond, so that one frame
  // of phase put the shadow forty-odd pixels away from the text it belongs to
  // for the whole 0.7s. Tweening here costs the compositor hand-off and buys
  // back a single clock for the movement and everything drawn against it.
  const SLIDE_MS = 700;
  let slideFrom = 0, slideTarget = 0, slideStart = 0, sliding = false;
  // Matches the cubic-bezier(0.19, 1, 0.22, 1) it replaces closely enough to
  // be the same movement to the eye.
  const slideEase = (t) => (t >= 1 ? 1 : 1 - Math.pow(2, -10 * t));

  // Published so a page can read the exact position it is drawing against
  // rather than parsing a matrix back out of the computed style.
  window.WRAPPER_Y = 0;

  // Where the wrapper is at a given frame timestamp. A page drawing against
  // the wrapper reads this with its own rAF timestamp, so it gets the same
  // answer this loop does no matter which of the two callbacks the browser
  // happens to run first — otherwise whichever ran second would be drawing a
  // frame ahead of the other, which is the same off-by-one-frame offset in a
  // different disguise.
  window.wrapperYAt = (now) => {
    if (FREE) return freeAt(now);
    if (!sliding) return slideTarget;
    const t = Math.min(1, Math.max(0, (now - slideStart) / SLIDE_MS));
    return slideFrom + (slideTarget - slideFrom) * slideEase(t);
  };

  // --- FREE SCROLL ---
  // The wrapper eases toward freeTarget. It is advanced once per frame
  // timestamp inside freeAt, so this loop and a page drawing against the
  // wrapper get the same position for the same frame whichever runs first.
  let freeTarget = 0, freeY = 0, freeLast = 0, freeRunning = false;
  let touchScrolling = false;
  function freeMin() {
    return wrapper ? Math.min(0, window.innerHeight - wrapper.offsetHeight) : 0;
  }
  const clampFree = (y) => Math.max(freeMin(), Math.min(0, y));  function freeAt(now) {
    if (now > freeLast) {
      const dt = Math.min(0.05, (now - freeLast) / 1000);
      freeLast = now;
      if (!touchScrolling) {
        freeY += (freeTarget - freeY) * (1 - Math.exp(-dt * 9));
        if (Math.abs(freeTarget - freeY) < 0.3) freeY = freeTarget;
      }
    }
    return freeY;
  }
  function freeTick(now) {
    window.WRAPPER_Y = freeAt(now);
    applyTransform();
    updateFreeProgress();
    if (freeY !== freeTarget || touchScrolling) requestAnimationFrame(freeTick);
    else freeRunning = false;
  }
  function freeScrollTo(y) {
    freeTarget = clampFree(y);
    if (!freeRunning) { freeRunning = true; requestAnimationFrame(freeTick); }
  }
  // Which chapter the middle of the screen is in, and how far down the whole
  // page the reader is.
  function updateFreeProgress() {
    if (!targets.length) return;
    const mid = -freeY + window.innerHeight / 2;
    let idx = 0;
    // Measured against the wrapper, not offsetTop: the chapters sit inside a
    // positioned .flow, which offsetTop would be relative to instead.
    const wTop = wrapper.getBoundingClientRect().top;
    targets.forEach((el, i) => { if (el.getBoundingClientRect().top - wTop <= mid) idx = i; });
    if (idx !== currentIndex) {
      currentIndex = idx; counterNow.textContent = pad(idx + 1);
      // The card at the centre stands out, as a snapped-to card does.
      document.querySelectorAll('.project-item.active').forEach((t) => t.classList.remove('active'));
      if (targets[idx].classList.contains('project-item')) targets[idx].classList.add('active');
    }
    const min = freeMin();
    const p = min < 0 ? freeY / min : 1;
    counterFill.style.transform = `scaleY(${Math.max(0.02, Math.min(1, p))})`;
    const up = document.getElementById('nav-up');
    const down = document.getElementById('nav-down');
    if (up) up.style.opacity = freeY >= -1 ? '0.2' : '1';
    if (down) down.style.opacity = freeY <= min + 1 ? '0.2' : '1';
  }

  if (FREE) {
    // One finger drags the page 1:1 and lets go with the speed it had; the
    // ease above turns that speed into a glide that comes to rest.
    let fromY = 0, fromTarget = 0, lastY = 0, lastT = 0, vel = 0, moved = 0;
    window.addEventListener('touchstart', (e) => {
      if (e.touches.length !== 1 || zoom > 1.01) { touchScrolling = false; return; }
      touchScrolling = true;
      fromY = lastY = e.touches[0].clientY;
      lastT = performance.now();
      fromTarget = freeY; vel = 0; moved = 0;
      if (!freeRunning) { freeRunning = true; requestAnimationFrame(freeTick); }
    }, { passive: true });
    window.addEventListener('touchmove', (e) => {
      if (!touchScrolling || e.touches.length !== 1) { touchScrolling = false; return; }
      const y = e.touches[0].clientY, now = performance.now();
      moved = Math.max(moved, Math.abs(y - fromY));
      if (now > lastT) vel = 0.8 * ((y - lastY) / ((now - lastT) / 1000)) + 0.2 * vel;
      lastY = y; lastT = now;
      freeY = freeTarget = rubber(fromTarget + (y - fromY), freeMin(), 0);
      window.FREE_DRAG = moved > 10;
    }, { passive: true });
    const release = () => {
      if (!touchScrolling) return;
      touchScrolling = false;
      // A finger that stopped before lifting should not fling.
      if (performance.now() - lastT > 90) vel = 0;
      freeScrollTo(freeTarget + vel * 0.32);
      // The browser still sends a click to whatever a drag ended on.
      if (moved > 10) setTimeout(() => { window.FREE_DRAG = false; }, 350);
    };
    window.addEventListener('touchend', release, { passive: true });
    window.addEventListener('touchcancel', release, { passive: true });
    document.addEventListener('click', (e) => {
      if (window.FREE_DRAG) { e.preventDefault(); e.stopPropagation(); }
    }, true);
  }

  // --- PINCH ZOOM ---
  // The page locks native touch handling so that the transform above is the
  // only thing that ever moves — which took pinch-to-zoom with it, and small
  // type on a phone needs it. So the zoom is done here, on the same transform,
  // and given the elasticity the rest of the site's movement has: past either
  // limit it keeps answering the fingers but gives ground, and on release it
  // springs to the edge rather than clipping to it.
  const ZOOM_MIN = 1, ZOOM_MAX = 3.2;
  let zoom = 1, zoomVel = 0, zoomRest = 1;
  let panX = 0, panY = 0;
  let originX = 0, originY = 0;
  let pinching = false, pinchStartDist = 0, pinchStartZoom = 1;
  let panFromX = 0, panFromY = 0, dragFromX = 0, dragFromY = 0, dragging = false;
  let settling = false;

  // Past an end it keeps moving, but each further millimetre costs more.
  function rubber(v, min, max) {
    if (v < min) return min - Math.pow(min - v, 0.55);
    if (v > max) return max + Math.pow(v - max, 0.55);
    return v;
  }

  function applyTransform() {
    if (!wrapper) return;
    wrapper.style.transformOrigin = `${originX}px ${originY}px`;
    wrapper.style.transform =
      `translate(${panX}px, ${window.WRAPPER_Y + panY}px) scale(${zoom})`;
  }

  // How far the content may be dragged before it is off its own edges. Slack
  // grows with the zoom, which is what makes a deeply zoomed page pannable and
  // an unzoomed one stay put.
  function panBound() {
    const w = wrapper ? wrapper.offsetWidth : window.innerWidth;
    const h = wrapper ? wrapper.offsetHeight : window.innerHeight;
    return { x: Math.max(0, (w * (zoom - 1)) / 2), y: Math.max(0, (h * (zoom - 1)) / 2) };
  }

  function settle() {
    if (settling) return;
    settling = true;
    let last = performance.now();
    const step = (now) => {
      const dt = Math.min(0.05, (now - last) / 1000); last = now;
      // Spring on the zoom, ease on the pan — the zoom is the one that should
      // overshoot slightly, because that reads as the material springing back.
      const target = Math.min(ZOOM_MAX, Math.max(ZOOM_MIN, zoom));
      zoomVel += ((target - zoom) * 210 - zoomVel * 24) * dt;
      zoom += zoomVel * dt;

      const b = panBound();
      panX += (Math.max(-b.x, Math.min(b.x, panX)) - panX) * Math.min(1, dt * 12);
      panY += (Math.max(-b.y, Math.min(b.y, panY)) - panY) * Math.min(1, dt * 12);

      applyTransform();

      const done = Math.abs(zoom - target) < 0.001 && Math.abs(zoomVel) < 0.01
        && Math.abs(panX - Math.max(-b.x, Math.min(b.x, panX))) < 0.5
        && Math.abs(panY - Math.max(-b.y, Math.min(b.y, panY))) < 0.5;
      if (done) {
        zoom = target; zoomVel = 0; zoomRest = target;
        panX = Math.max(-b.x, Math.min(b.x, panX));
        panY = Math.max(-b.y, Math.min(b.y, panY));
        applyTransform();
        settling = false;
        document.body.classList.toggle('is-zoomed', zoom > 1.01);
        return;
      }
      requestAnimationFrame(step);
    };
    requestAnimationFrame(step);
  }

  const midpoint = (a, b) => ({ x: (a.clientX + b.clientX) / 2, y: (a.clientY + b.clientY) / 2 });
  const spread = (a, b) => Math.hypot(a.clientX - b.clientX, a.clientY - b.clientY);

  window.addEventListener('touchstart', (e) => {
    if (e.touches.length === 2) {
      pinching = true; settling = false; zoomVel = 0;
      pinchStartDist = spread(e.touches[0], e.touches[1]);
      pinchStartZoom = zoom;
      // The origin is only ever moved from rest. Changing it while the content
      // is already scaled would slide the whole page sideways under the
      // fingers, because the origin is what the scale is measured from.
      if (zoom <= 1.01 && wrapper) {
        const m = midpoint(e.touches[0], e.touches[1]);
        const r = wrapper.getBoundingClientRect();
        originX = (m.x - r.left) / zoom;
        originY = (m.y - r.top) / zoom;
        panX = 0; panY = 0;
      }
    } else if (e.touches.length === 1 && zoom > 1.01) {
      dragging = true;
      dragFromX = e.touches[0].clientX; dragFromY = e.touches[0].clientY;
      panFromX = panX; panFromY = panY;
    }
  }, { passive: true });

  window.addEventListener('touchmove', (e) => {
    if (pinching && e.touches.length === 2) {
      const d = spread(e.touches[0], e.touches[1]);
      if (pinchStartDist > 0) {
        zoom = rubber(pinchStartZoom * (d / pinchStartDist), ZOOM_MIN, ZOOM_MAX);
        applyTransform();
        document.body.classList.toggle('is-zoomed', zoom > 1.01);
      }
    } else if (dragging && e.touches.length === 1) {
      const b = panBound();
      panX = rubber(panFromX + (e.touches[0].clientX - dragFromX), -b.x, b.x);
      panY = rubber(panFromY + (e.touches[0].clientY - dragFromY), -b.y, b.y);
      applyTransform();
    }
  }, { passive: true });

  const endTouch = (e) => {
    if (e.touches.length < 2) pinching = false;
    if (e.touches.length === 0) { dragging = false; settle(); }
    else if (!pinching && e.touches.length === 1 && zoom > 1.01) {
      dragging = true;
      dragFromX = e.touches[0].clientX; dragFromY = e.touches[0].clientY;
      panFromX = panX; panFromY = panY;
    }
  };
  window.addEventListener('touchend', endTouch, { passive: true });
  window.addEventListener('touchcancel', endTouch, { passive: true });

  // Double tap puts it back. Without this the only way out of a zoom is to
  // pinch the other way, which is fiddly at the far end of the range.
  let lastTap = 0;
  window.addEventListener('touchend', (e) => {
    if (e.touches.length) return;
    const now = performance.now();
    if (now - lastTap < 300 && zoom > 1.01) {
      zoom = 1; zoomVel = 0; panX = 0; panY = 0; settle();
    }
    lastTap = now;
  }, { passive: true });

  window.resetZoom = () => { zoom = 1; zoomVel = 0; panX = 0; panY = 0; settle(); };

  function slideStep(now) {
    const t = Math.min(1, (now - slideStart) / SLIDE_MS);
    window.WRAPPER_Y = window.wrapperYAt(now);
    applyTransform();
    if (t < 1) requestAnimationFrame(slideStep); else { sliding = false; window.WRAPPER_Y = slideTarget; }
  }

  function slideTo(y) {
    wrapper.style.transition = 'none';
    slideFrom = window.WRAPPER_Y;
    slideTarget = y;
    slideStart = performance.now();
    // A slide arriving mid-slide retargets the one already running rather than
    // starting a second loop against it.
    if (!sliding) { sliding = true; requestAnimationFrame(slideStep); }
  }

  // dir: any integer. 1 = next, -1 = previous, 0 = re-centre the current
  // target, ±2 and beyond = a flick that carried further than one card.
  window.handleNav = (dir) => {
    updateTargets();
    if (!targets.length || !wrapper) return;
    if (FREE) {
      freeScrollTo(freeTarget - dir * window.innerHeight * 0.8);
      return;
    }

    const next = Math.max(0, Math.min(targets.length - 1, currentIndex + dir));
    if (next === currentIndex && dir !== 0) return;
    currentIndex = next;
    updateChevronVisibility();
    updateCounter();

    const el = targets[currentIndex];
    if (!el) return;

    const offset = (window.innerHeight / 2) - (el.offsetTop + el.offsetHeight / 2);
    slideTo(offset);
    suspendHover(750);

    // Clear every card, not just the ones currently in `targets` — a card the
    // theme has hidden is not in that list, and would keep a stale .active
    // that reappears the next time the theme flips back.
    document.querySelectorAll('.project-item.active').forEach((t) => t.classList.remove('active'));
    if (el.classList.contains('project-item')) el.classList.add('active');
  };

  // Re-centre without moving to a different card. Called after a theme flip
  // (which can add or remove cards above the current one) and on resize.
  window.recentre = () => window.handleNav(0);

  // --- DESKTOP WHEEL ---
  // A hard flick used to cost exactly as much as a nudge, so a nine-project
  // page was nine deliberate gestures. The delta is accumulated between
  // slides instead, and a big one carries more than one card.
  let lastWheel = 0, wheelAccum = 0;
  window.addEventListener('wheel', (e) => {
    if (FREE) {
      // Lines and pages, where a mouse reports them, turned into pixels.
      const unit = e.deltaMode === 1 ? 32 : e.deltaMode === 2 ? window.innerHeight : 1;
      freeScrollTo(freeTarget - e.deltaY * unit);
      return;
    }
    if (Math.abs(e.deltaY) < 4) return;
    // A reversal is a new intention, not more of the last one.
    if (wheelAccum !== 0 && Math.sign(e.deltaY) !== Math.sign(wheelAccum)) wheelAccum = 0;
    wheelAccum += e.deltaY;
    const now = performance.now();
    if (now - lastWheel < 190) return;
    lastWheel = now;
    const steps = Math.min(3, 1 + Math.floor(Math.abs(wheelAccum) / 260));
    const dir = wheelAccum > 0 ? 1 : -1;
    wheelAccum = 0;
    window.handleNav(dir * steps);
  }, { passive: true });

  window.addEventListener('keydown', (e) => {
    if (e.metaKey || e.ctrlKey || e.altKey) return;
    if (FREE) {
      const step = { ArrowDown: 120, ArrowUp: -120, PageDown: window.innerHeight * 0.85,
        PageUp: -window.innerHeight * 0.85, Home: -1e7, End: 1e7 }[e.key];
      if (step) { e.preventDefault(); freeScrollTo(freeTarget - step); }
      return;
    }
    if (e.key === 'ArrowDown') { e.preventDefault(); window.handleNav(1); }
    if (e.key === 'ArrowUp') { e.preventDefault(); window.handleNav(-1); }
    if (e.key === 'PageDown') { e.preventDefault(); window.handleNav(3); }
    if (e.key === 'PageUp') { e.preventDefault(); window.handleNav(-3); }
    if (e.key === 'Home') { e.preventDefault(); window.handleNav(-999); }
    if (e.key === 'End') { e.preventDefault(); window.handleNav(999); }
  });

  // --- MOBILE SCROLL LOCK ---
  // Prevents touchmove (scrolling/bouncing) on the document, locking the page
  // position so the transform above is the only thing that ever moves. Two
  // fingers are let through untouched, because that is the zoom above and
  // swallowing it is what took zooming away from the page in the first place.
  document.addEventListener('touchmove', (e) => {
    if (e.touches.length > 1) return;
    e.preventDefault();
  }, { passive: false });

  // Only a change of width is a new layout. Height alone is a phone's address
  // bar collapsing as you scroll, and re-centring on that jerked the list
  // sideways in the middle of an ordinary gesture.
  let lastWidth = window.innerWidth;
  window.addEventListener('resize', () => {
    if (window.innerWidth === lastWidth) return;
    lastWidth = window.innerWidth;
    window.recentre();
  });

  // --- THEME INVERSION ---
  // Single owner of the light/dark flip, so every page inverts identically.
  // Returns the value each page's shader should use for its uInvert uniform.
  window.toggleInvert = () => {
    const bg = document.getElementById('stage-container');
    const inverted = !document.body.classList.contains('inverted-theme');
    document.body.classList.toggle('inverted-theme', inverted);
    if (bg) bg.classList.toggle('inverted-bg', inverted);
    // The flip can show or hide theme-gated cards; re-measure and re-centre.
    window.recentre();
    // For anything a page wants to swap alongside the theme (facilitation.html
    // changes its subtitle). Listen for 'themechange' rather than touching the
    // classes directly, so the flip keeps a single owner.
    window.dispatchEvent(new CustomEvent('themechange', { detail: { inverted } }));
    return inverted ? 1.0 : 0.0;
  };

  // --- CARD CLICKS ---
  // A hold that has charged past ~200 is the invert gesture, not a tap.
  window.checkInteraction = (e) => {
    if (window.HOLD_STATE.charge > 200) { e.preventDefault(); e.stopPropagation(); return false; }
    return true;
  };

  // Cards are real links now, so the browser does the navigating and this only
  // has to stop the click when the pointer was mid-gesture rather than
  // choosing a project.
  window.handleProjectClick = (e) => window.checkInteraction(e);

  // --- IF THE SCENE NEVER ARRIVES ---
  // Every page keeps its hold-to-invert inside the module that draws its
  // background, and those modules can fail to run: work and play import three
  // from a CDN, facilitation needs a WebGL2 context. When one does, the page
  // used to lose the gesture along with the picture, silently. This is the
  // same gesture with nothing behind it -- same charge, same length, same
  // flip -- installed only if no module has claimed the gesture by now.
  setTimeout(() => {
    if (window.HOLD_STATE.owned) return;
    document.body.classList.add('no-scene');

    const LIMIT = 1500, RATE = 1400, RELEASE = 3600;
    let holding = false, charge = 0, last = performance.now();

    const down = (e) => { if (!e.target.closest('a, .mobile-nav-zone')) holding = true; };
    window.addEventListener('mousedown', down);
    window.addEventListener('touchstart', down, { passive: true });
    ['mouseup', 'touchend', 'touchcancel', 'blur'].forEach(
      (evt) => window.addEventListener(evt, () => { holding = false; }));

    (function tick(now) {
      requestAnimationFrame(tick);
      const dt = Math.min(0.05, (now - last) / 1000); last = now;
      const held = (holding && !window.FREE_DRAG) || (window.KEY_HOLD && window.KEY_HOLD.held);
      charge = held ? Math.min(LIMIT, charge + dt * RATE) : Math.max(0, charge - dt * RELEASE);
      window.HOLD_STATE.charge = charge;
      if (charge >= LIMIT) { charge = 0; window.toggleInvert(); }
    })(last);
  }, 2500);

  // Cards are already in the DOM (render-projects.js runs first), but images
  // still have no intrinsic height, so offsetTop/offsetHeight are wrong until
  // layout settles. Measure once now and again after load.
  updateTargets();
  window.addEventListener('load', () => window.recentre());
})();
