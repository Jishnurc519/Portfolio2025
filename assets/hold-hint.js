// The hold-to-invert gesture is the one thing on these pages nothing on screen
// announces, so the hint under the title says it. It says it three ways,
// because one quiet flash on load was easy to miss entirely:
//
//   1. On load, an introduction -- brighter and roughly half again as long as
//      the repeats. This is the only moment a first visitor is told the
//      gesture exists at all, so it is the showing that matters most.
//   2. After a short wait, one ordinary reminder.
//   3. After that, it stops being subtle and pulses, on the assumption that
//      two showings have now gone unread.
//
// Then it stops. A line that will not stop blinking at someone who has decided
// to ignore it is no longer a hint, so after MAX showings it has had its say
// and the page goes quiet.
//
// Any invert resets the whole sequence, so someone who is already flipping the
// page never sees any of it again.
//
// Load as a classic script after assets/scroll-nav.js, which owns the flip and
// fires 'themechange'. Pages that run their own invert (index.html) call
// window.noteInvert() instead.
(function () {
  const hint = document.querySelector('.hint');
  if (!hint) return;

  // Shorter than the idle gap: the first reminder is chasing an introduction
  // that may have been missed, and twenty seconds of nothing after it is long
  // enough to read as the page having finished talking.
  const FIRST_MS = 13000;
  const IDLE_MS = 20000;
  const URGE_AFTER = 2;   // showings gone unused before it raises its voice
  const MAX = 5;          // and after this many, it stops

  const CLASSES = ['hint-show', 'hint-intro', 'hint-urge'];
  let timer;
  let shown = 0;

  function play(cls, gap) {
    // The animation only plays once per element, so the class has to come off
    // and go back on -- with a forced reflow between, or the browser coalesces
    // the two changes into no change at all and nothing replays.
    hint.classList.remove.apply(hint.classList, CLASSES);
    void hint.offsetWidth;
    hint.classList.add(cls);
    clearTimeout(timer);
    if (gap) timer = setTimeout(next, gap);
  }

  function next() {
    shown++;
    if (shown > MAX) return;
    play(shown >= URGE_AFTER ? 'hint-urge' : 'hint-show', IDLE_MS);
  }

  // An invert means the hint has done its job: the count goes back to zero so
  // that if the page is left alone again later it starts over gently rather
  // than resuming mid-escalation.
  function reset() {
    shown = 0;
    clearTimeout(timer);
    timer = setTimeout(next, IDLE_MS);
  }

  window.noteInvert = reset;
  window.addEventListener('themechange', reset);

  // The first showing stays where it is, on the page, for its whole run --
  // whatever the pointer does. assets/cursor.js would otherwise lift it onto
  // the cursor the moment the mouse moved, and a visitor who nudged the mouse
  // on arrival lost the line before they had read it. `hint-pinned` on <html>
  // is what cursor.js (and index.html's canvas) wait on; it comes off when
  // the introduction has finished, and every later showing is the cursor's.
  const root = document.documentElement;
  root.classList.add('hint-pinned');
  const unpin = () => root.classList.remove('hint-pinned');
  hint.addEventListener('animationend', unpin, { once: true });
  setTimeout(unpin, 8000);   // in case the animation never runs (reduced motion, hidden tab)

  play('hint-intro', FIRST_MS);
})();
