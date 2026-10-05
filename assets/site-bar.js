// The site bar: a small frosted plate across the top of every page (after the
// one at the foot of dontmatter.eu). Where you can go, and -- in the darker
// fill behind the words -- how far down this page you are.
//
// It is its own plate rather than difference-blended ink like the rest of the
// site's marks, because it sits over three different pairs of tones, a light
// canvas and photographs, and has to read the same over all of them.
//
// Self-contained: it brings its own styles, so a page needs only
//   <script src="assets/site-bar.js" defer></script>
// Pages under projects/ carry <base href="../">, so the paths below resolve
// from the site root there too.
(function () {
  const LINKS = [
    ['index.html', 'Home'],
    ['work.html', 'Work'],
    ['play.html', 'Play'],
    ['facilitation.html', 'Learn']
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
    .site-bar {
      position: fixed; top: max(12px, env(safe-area-inset-top)); left: 50%;
      transform: translateX(-50%); z-index: 500;
      display: flex; align-items: center; gap: 2px;
      padding: 4px 6px; border-radius: 3px; overflow: hidden; isolation: isolate;
      background: rgba(11, 14, 19, 0.5);
      -webkit-backdrop-filter: blur(10px); backdrop-filter: blur(10px);
      font-family: 'Clash Display', sans-serif; font-size: 15px; font-weight: 500;
      line-height: 1; white-space: nowrap; mix-blend-mode: normal;
      -webkit-user-select: none; user-select: none; touch-action: manipulation;
    }
    .site-bar-fill {
      position: absolute; inset: 0; z-index: -1;
      background: rgba(11, 14, 19, 0.82);
      transform-origin: left; transform: scaleX(0);
      transition: transform 0.3s ease;
    }
    .site-bar a {
      color: #f4f1ec; text-decoration: none;
      padding: 9px 9px; border-radius: 2px; opacity: 0.72;
      transition: opacity 0.2s ease;
    }
    .site-bar a:hover, .site-bar a:focus-visible, .site-bar a[aria-current] { opacity: 1; }
    .site-bar a[aria-current] {
      text-decoration: underline; text-underline-offset: 5px; text-decoration-thickness: 1px;
    }
    .site-bar a:focus-visible { outline: 1px solid #f4f1ec; outline-offset: -2px; }
    .site-bar .sep { width: 1px; height: 14px; margin: 0 3px; background: rgba(244, 241, 236, 0.3); }

    /* Narrow screens: the bar takes the whole top edge, and what used to sit
       in the corners up there steps down under it. */
    @media (max-width: 700px) {
      .site-bar {
        left: 8px; right: 8px; transform: none; justify-content: space-between;
        font-size: 14px; padding: 2px 4px;
      }
      .site-bar a { padding: 10px 6px; }
      .site-bar .sep { display: none; }
      .mobile-nav-zone.nav-top { top: 52px; }
      .project-nav { top: 50px !important; }
    }
  `;
  document.head.appendChild(style);

  const bar = document.createElement('nav');
  bar.className = 'site-bar';
  bar.setAttribute('aria-label', 'Site');
  bar.innerHTML = '<span class="site-bar-fill" aria-hidden="true"></span>' + LINKS.map(([href, label], i) =>
    (i === 1 ? '<span class="sep" aria-hidden="true"></span>' : '') +
    `<a href="${href}"${href === here ? ' aria-current="page"' : ''}>${label}</a>`
  ).join('');
  document.body.appendChild(bar);

  // Every page's hold-to-invert listens on the window. A press on the bar is
  // a press on a link, not the start of a hold.
  ['pointerdown', 'mousedown', 'touchstart'].forEach((t) =>
    bar.addEventListener(t, (e) => e.stopPropagation(), { passive: true }));

  // --- how far down ---
  // The list pages move by a transform rather than by scrolling, so they
  // report their own progress (assets/scroll-nav.js fires 'navprogress');
  // everything else scrolls natively and is read off the document.
  const fill = bar.querySelector('.site-bar-fill');
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
