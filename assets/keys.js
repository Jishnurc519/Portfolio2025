// Keyboard equivalents for the two things you can otherwise only do with a
// pointer: turn the page over, and move between sections.
//
//   space   held, exactly like holding the pointer down — charges, then wipes
//   1 2 3   work / play / learn
//
// The hold is published as KEY_HOLD.held rather than faked as a mouse event,
// because every page charges its own way (index counts marks, work and play
// count particles, facilitation counts a shadow wipe) and each of those loops
// already has an `isHolding` of its own to OR this into. Publishing a flag
// keeps the gesture's owner where it is.
//
// Load as a classic script on every page. Pages under projects/ carry
// <base href="../">, so the bare filenames below resolve to the site root
// from there too.
(function () {
  window.KEY_HOLD = { held: false };

  // The shared channel for the hold-to-invert gesture, declared here because
  // this is the one script every page loads first. Whichever module owns the
  // charge on a given page writes `charge` into it each frame (index.html's
  // brush loop, work/play's particle loop, facilitation's shadow loop, or the
  // standby in assets/scroll-nav.js), and anything that needs to *read* the
  // gesture -- the card-vs-hold test in scroll-nav, the charge meter drawn on
  // the cursor in assets/cursor.js -- reads it from here. `limit` is the value
  // a full charge reaches, so a reader can normalise without knowing which
  // loop is counting.
  //
  // Created rather than replaced by later scripts: cursor.js loads before
  // scroll-nav.js and would otherwise hold a reference to a discarded object.
  window.HOLD_STATE = window.HOLD_STATE || { charge: 0, limit: 1500 };

  const DESTINATIONS = { '1': 'work.html', '2': 'play.html', '3': 'facilitation.html' };
  const here = (location.pathname.split('/').pop() || 'index.html');

  const typing = (el) => el && el.closest
    && el.closest('input, textarea, select, [contenteditable="true"]');

  window.addEventListener('keydown', (e) => {
    // Leave the browser's own shortcuts alone.
    if (e.metaKey || e.ctrlKey || e.altKey) return;
    if (typing(e.target)) return;

    if (e.code === 'Space') {
      // Space scrolls by default, and these pages have their own idea of what
      // scrolling means, so it has to be claimed either way.
      e.preventDefault();
      // Auto-repeat fires this many times a second while the key is down; the
      // first one is the press.
      if (!e.repeat) window.KEY_HOLD.held = true;
      return;
    }

    const dest = DESTINATIONS[e.key];
    if (dest && dest !== here) { e.preventDefault(); location.href = dest; }
  });

  // On a touch screen there is no space bar and no number keys, so the hint
  // says only the part a finger can do. Run here because this is the first
  // script on every page, ahead of anything that splits the hint into letters
  // (the front page's canvas) or copies it (assets/cursor.js).
  const touch = window.matchMedia('(hover: none) and (pointer: coarse)').matches;
  if (touch) {
    document.querySelectorAll('.hint').forEach((h) => { h.textContent = 'hold anywhere to invert'; });
  }

  // A finger held down long enough to invert the page is held long enough
  // for the browser's long-press menu, which opens over the page and ends the
  // hold. On the pages that have the gesture (a hint says so), a long press
  // is the gesture, not a request for a menu.
  if (touch && document.querySelector('.hint')) {
    window.addEventListener('contextmenu', (e) => e.preventDefault());
  }

  const release = () => { window.KEY_HOLD.held = false; };
  window.addEventListener('keyup', (e) => { if (e.code === 'Space') release(); });
  // A key held while the tab loses focus never sends its keyup.
  window.addEventListener('blur', release);
  document.addEventListener('visibilitychange', () => { if (document.hidden) release(); });
})();
