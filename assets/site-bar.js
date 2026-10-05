// The site's navigation on every page but the front one, written the way the
// front page writes it: the wordmark in the top-left corner going home, and
// work / play / learn / contact across the top, lowercase, no plate behind
// them. Under the section you are in, a thin line fills as you go down the
// page. Once the page has moved, a band of the page's own ground fades in
// behind them, so copy and pictures no longer run through the navigation.
// It is first in the document, after a skip link, so a keyboard meets the
// way around before the content.
//
// Ink by difference against the page's --tone-swap, like the rest of the
// site's floating marks (the cursor, the counter): it comes out as the other
// tone over either ground, over a light canvas and over a photograph, without
// being told which way round the page is.
//
// Self-contained: it brings its own styles, so a page needs only
//   <script src="assets/site-bar.js" defer></script>
// Pages under projects/ carry <base href="../">, so the paths below resolve
// from the site root there too.
(function () {
  const LINKS = [
    ['work.html', 'work'],
    ['play.html', 'play'],
    ['facilitation.html', 'learn']
  ];
  const EMAIL = 'jishnurc519@gmail.com';

  // Which entry is "here". A project page counts as the section it belongs
  // to, which assets/render-project.js marks on <body> as sec-<section>;
  // GMMBBQ and its gigs sit under play. GMMBBQ has no entry of its own: the
  // way there is the speaker.
  const file = location.pathname.split('/').pop() || 'index.html';
  const sec = (document.body.className.match(/\bsec-(\w+)/) || [])[1];
  const here = sec ? (sec === 'gmmbbq' ? 'play.html' : sec + '.html')
    : (file === 'gmmbbq.html' ? 'play.html' : file);

  const style = document.createElement('style');
  style.textContent = `
    .site-mark, .site-nav-bar {
      position: fixed; top: max(18px, env(safe-area-inset-top)); z-index: 500;
      font-family: 'Clash Display', sans-serif; line-height: 1;
      color: var(--tone-swap, #ffffff); mix-blend-mode: difference;
      -webkit-user-select: none; user-select: none; touch-action: manipulation;
    }
    /* jishnu has an art page: jishnu, has (bold), an, art, page (bold). */
    .site-mark {
      left: max(20px, 5vw); padding: 8px 0;
      font-size: clamp(16px, 1.6vw, 19px); font-weight: 400;
      text-decoration: none; white-space: nowrap;
      transition: transform 0.3s ease;
    }
    .site-mark b { font-weight: 700; }
    .site-mark:hover, .site-mark:focus-visible { transform: translateY(-3px); }
    .site-nav-bar {
      left: 50%; transform: translateX(-50%);
      display: flex; gap: clamp(20px, 4vw, 48px);
    }
    .site-nav-bar a {
      position: relative; display: block; padding: 8px 0 10px;
      font-size: clamp(15px, 1.6vw, 18px); font-weight: 500;
      color: inherit; text-decoration: none;
      transition: transform 0.3s ease;
    }
    .site-nav-bar a:hover, .site-nav-bar a:focus-visible { transform: translateY(-4px); }
    .site-mark:focus-visible, .site-nav-bar a:focus-visible {
      outline: 2px solid currentColor; outline-offset: 4px; border-radius: 2px;
    }
    /* Behind the navigation once the page has moved: the page's own ground,
       solid under the words and fading out below them. Its colour is read
       from the page (see groundColour), so it follows each section's tones
       and the turn. */
    .site-band {
      position: fixed; top: 0; left: 0; right: 0; z-index: 499;
      height: calc(max(18px, env(safe-area-inset-top)) + 64px);
      pointer-events: none; opacity: 0; transition: opacity 0.3s ease;
    }
    .site-band.on { opacity: 1; }
    /* For a keyboard: straight past the navigation to the page. Out of sight
       until it has focus. */
    .skip-link {
      position: fixed; left: 12px; top: 12px; z-index: 600;
      padding: 8px 12px; border-radius: 2px;
      background: #0b0e13; color: #f4f1ec; font: 600 14px 'Clash Display', sans-serif;
      text-decoration: none; transform: translateY(-200%);
    }
    .skip-link:focus { transform: none; outline: 2px solid #f4f1ec; outline-offset: 2px; }
    /* How far down this page you are: a hairline under the section's name,
       a quarter-strength track with the travelled part solid. */
    .site-progress {
      position: absolute; left: 0; right: 0; bottom: 2px; height: 2px;
      background: rgba(var(--tone-swap-rgb, 255, 255, 255), 0.28);
    }
    .site-progress i {
      position: absolute; inset: 0; background: currentColor;
      transform-origin: left; transform: scaleX(0);
      transition: transform 0.3s ease;
    }

    /* Narrow screens: the wordmark keeps the left corner, the sections move
       to the right. */
    @media (max-width: 700px) {
      .site-mark { left: 16px; font-size: 15px; }
      .site-nav-bar { left: auto; right: 16px; transform: none; gap: 16px; }
      .site-nav-bar a { font-size: 14px; }
    }
    /* 320-wide phones: both a size down, so they never meet. */
    @media (max-width: 360px) {
      .site-mark { left: 12px; font-size: 13px; }
      .site-nav-bar { right: 12px; gap: 12px; }
      .site-nav-bar a { font-size: 13px; }
      /* No room for a fourth word; the front page carries the email too. */
      .site-nav-bar .site-contact { display: none; }
    }
  `;
  document.head.appendChild(style);

  const mark = document.createElement('a');
  mark.className = 'site-mark';
  mark.href = 'index.html';
  mark.setAttribute('aria-label', 'jishnu has an artpage, home');
  mark.innerHTML = 'jishnu<b>has</b>anart<b>page</b>';

  const nav = document.createElement('nav');
  nav.className = 'site-nav-bar';
  nav.setAttribute('aria-label', 'Sections');
  nav.innerHTML = LINKS.map(([href, label]) => (href === here
    ? `<a href="${href}" aria-current="page">${label}<span class="site-progress" aria-hidden="true"><i></i></span></a>`
    : `<a href="${href}">${label}</a>`)).join('')
    + `<a href="mailto:${EMAIL}" class="site-contact" aria-label="contact: email ${EMAIL}">contact</a>`;

  const band = document.createElement('div');
  band.className = 'site-band';
  band.setAttribute('aria-hidden', 'true');

  const main = document.getElementById('main-wrapper');
  const skip = document.createElement('a');
  skip.className = 'skip-link';
  skip.textContent = 'skip to content';
  skip.href = '#main-wrapper';
  if (main && !main.hasAttribute('tabindex')) main.setAttribute('tabindex', '-1');
  skip.addEventListener('click', (e) => {
    if (!main) return;
    e.preventDefault();
    main.focus({ preventScroll: true });
  });

  // First in the document, so a keyboard meets them before the page.
  const first = document.body.firstChild;
  [skip, band, mark, nav].forEach((n) => document.body.insertBefore(n, first));

  // The ground the page is on right now: the stage behind the list pages
  // (which turns over with the page), else the body, else the document.
  function groundColour() {
    const tries = [document.getElementById('stage-container'), document.body, document.documentElement];
    for (const t of tries) {
      if (!t) continue;
      const c = getComputedStyle(t).backgroundColor;
      const m = c.match(/rgba?\(([^)]+)\)/);
      if (!m) continue;
      const v = m[1].split(',').map((n) => parseFloat(n));
      if (v.length > 3 && v[3] === 0) continue;
      return v.slice(0, 3).map(Math.round).join(', ');
    }
    return '11, 14, 19';
  }
  function paintBand() {
    const g = groundColour();
    band.style.background = `linear-gradient(to bottom, rgb(${g}) 0%, rgb(${g}) 62%, rgba(${g}, 0) 100%)`;
  }
  paintBand();
  window.addEventListener('themechange', () => setTimeout(paintBand, 30));
  window.addEventListener('load', paintBand);
  const showBand = (moved) => band.classList.toggle('on', moved);

  // Every page's hold-to-invert listens on the window. A press on these is a
  // press on a link, not the start of a hold.
  [mark, nav].forEach((el) => ['pointerdown', 'mousedown', 'touchstart'].forEach((t) =>
    el.addEventListener(t, (e) => e.stopPropagation(), { passive: true })));

  // --- how far down ---
  // The list pages move by a transform rather than by scrolling, so they
  // report their own progress (assets/scroll-nav.js fires 'navprogress');
  // everything else scrolls natively and is read off the document. A page in
  // no section (the 404) has no line to fill.
  const fill = nav.querySelector('.site-progress i');
  const show = (p) => {
    if (fill) fill.style.transform = `scaleX(${Math.max(0, Math.min(1, p)).toFixed(4)})`;
  };
  let fromNav = false;
  window.addEventListener('navprogress', (e) => { fromNav = true; show(e.detail); showBand(e.detail > 0.002); });
  // The list pages move by transform; their wrapper's position says whether
  // anything has moved up under the navigation yet.
  if (main) {
    setInterval(() => {
      if (fromNav) showBand(main.getBoundingClientRect().top < -8);
    }, 200);
  }
  function fromScroll() {
    if (fromNav) return;
    const max = document.documentElement.scrollHeight - window.innerHeight;
    show(max > 4 ? window.scrollY / max : 0);
    showBand(window.scrollY > 8);
  }
  window.addEventListener('scroll', fromScroll, { passive: true });
  window.addEventListener('resize', fromScroll);
  fromScroll();
})();
