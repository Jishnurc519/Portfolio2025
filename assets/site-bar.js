// The site's navigation on every page but the front one, written the way the
// front page writes it: the wordmark in the top-left corner going home, and
// work / play / learn across the top, lowercase, no plate behind them. Under
// the section you are in, a thin line fills as you go down the page.
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
    .site-mark:focus-visible, .site-nav-bar a:focus-visible { outline: none; font-weight: 700; }
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
       to the right, and the mobile up-chevron steps down under them both. */
    @media (max-width: 700px) {
      .site-mark { left: 16px; font-size: 15px; }
      .site-nav-bar { left: auto; right: 16px; transform: none; gap: 16px; }
      .site-nav-bar a { font-size: 14px; }
      .mobile-nav-zone.nav-top { top: 52px; }
    }
    /* 320-wide phones: both a size down, so they never meet. */
    @media (max-width: 360px) {
      .site-mark { left: 12px; font-size: 13px; }
      .site-nav-bar { right: 12px; gap: 12px; }
      .site-nav-bar a { font-size: 13px; }
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
    : `<a href="${href}">${label}</a>`)).join('');

  document.body.appendChild(mark);
  document.body.appendChild(nav);

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
  if (!fill) return;
  const show = (p) => {
    fill.style.transform = `scaleX(${Math.max(0, Math.min(1, p)).toFixed(4)})`;
  };
  let fromNav = false;
  window.addEventListener('navprogress', (e) => { fromNav = true; show(e.detail); });
  function fromScroll() {
    if (fromNav) return;
    const max = document.documentElement.scrollHeight - window.innerHeight;
    show(max > 4 ? window.scrollY / max : 0);
  }
  window.addEventListener('scroll', fromScroll, { passive: true });
  window.addEventListener('resize', fromScroll);
  fromScroll();
})();
