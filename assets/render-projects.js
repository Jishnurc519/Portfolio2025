// Builds a page's projects from PAGE_CONFIG + SITE_MANIFEST + PROJECT_DETAILS,
// one project to a screen: a large picture -- the project's own clip,
// looping, where it has one -- beside its name, year, tools and a line on
// what it is. Each section only has a handful of projects, so each one can
// have the whole screen. Shared by work.html and play.html; the page key is
// taken from the filename, so work.html renders PAGE_CONFIG.work. To
// rearrange projects, edit assets/page-config.js; the pages never change.
//
// Load order matters: manifest.js, curated-media.js, project-details.js and
// page-config.js must come first, and scroll-nav.js after, because it
// measures the screens this script appends.
(function renderProjectScreens() {
  const mount = document.getElementById('project-list');
  if (!mount) return;

  const pageKey = (location.pathname.split('/').pop() || '').replace(/\.html$/, '');
  const entries = (typeof PAGE_CONFIG !== 'undefined' ? PAGE_CONFIG[pageKey] : null) || [];
  if (!entries.length) console.warn('render-projects.js: no PAGE_CONFIG entries for page key:', pageKey);

  let n = 0;

  entries.forEach(({ key, displayName }) => {
    const data = (typeof SITE_MANIFEST !== 'undefined') ? SITE_MANIFEST[key] : null;
    if (!data) { console.warn('page-config.js references unknown project key:', key); return; }
    const info = (typeof PROJECT_DETAILS !== 'undefined' && PROJECT_DETAILS[key]) || {};
    n++;

    // The picture: a clip where there is one, because these are moving
    // pieces and a still undersells them -- the one named by `hero` in
    // assets/project-details.js, else the project's first clip. Otherwise the
    // plate picked by hand for it (assets/curated-media.js), else its
    // thumbnail. `hero` is there because the first clip in the manifest is
    // not always the one to lead with, and is not always still on disk.
    const curated = (typeof CURATED_MEDIA !== 'undefined' && CURATED_MEDIA[key]) || {};
    const picked = curated.thumbs || [];
    const named = info.hero && curated.items && curated.items[info.hero];
    const clip = (named && named.type === 'video') ? named : (data.videos || [])[0];
    const still = picked[0] || data.thumb || '';
    let media;
    if (clip) {
      media = `<video data-src="${clip.src}" poster="${clip.poster || still}" muted loop playsinline preload="none"></video>`;
    } else if (still) {
      media = `<img src="${still}" alt="" loading="lazy" decoding="async">`;
    } else {
      media = '<span class="screen-empty">soon</span>';
    }

    // A real link, so it is reachable by keyboard and keeps open-in-new-tab,
    // middle click and copy-link. onclick only guards against a hold to
    // invert that happened to end over it.
    const item = document.createElement('a');
    item.className = 'project-screen scroll-target' + (n % 2 === 0 ? ' flip' : '');
    item.href = `projects/${key.split('/')[1]}.html`;
    item.dataset.project = key;
    item.setAttribute('onclick', 'return handleProjectClick(event)');
    item.innerHTML = `
      <div class="screen-media">${media}</div>
      <div class="screen-text">
        <h2 class="project-title">${displayName || data.name}</h2>
        ${info.year || (info.tools && info.tools.length)
          ? `<span class="project-tags">${[info.year, ...(info.tools || [])].filter(Boolean).join(' • ')}</span>` : ''}
        ${info.overview ? `<p class="project-desc">${info.overview}</p>` : ''}
        <span class="screen-open">View project <span aria-hidden="true">→</span></span>
      </div>
    `;
    mount.appendChild(item);
  });

  // Clips load the first time their screen comes near and play only while
  // it is the one on screen, so a page of seven costs one decoder at a time.
  // The smaller AV1 copy first where there is one (assets/clip-source.js).
  const load = (v) => {
    if (window.setClipSource) window.setClipSource(v, v.dataset.src);
    else if (!v.src) v.src = v.dataset.src;
  };
  const clips = mount.querySelectorAll('video[data-src]');
  if (!('IntersectionObserver' in window)) {
    clips.forEach((v) => { load(v); v.play().catch(() => {}); });
    return;
  }
  const io = new IntersectionObserver((list) => {
    list.forEach(({ target: v, isIntersecting }) => {
      if (isIntersecting) {
        load(v);
        v.play().catch(() => {});
      } else if (!v.paused) {
        v.pause();
      }
    });
  }, { threshold: 0.4 });
  clips.forEach((v) => io.observe(v));
  // The browser pauses footage in a tab that goes out of sight, and nothing
  // above fires again when it comes back.
  document.addEventListener('visibilitychange', () => {
    if (document.visibilityState !== 'visible') return;
    clips.forEach((v) => {
      const r = v.getBoundingClientRect();
      if (v.src && r.bottom > 0 && r.top < window.innerHeight) v.play().catch(() => {});
    });
  });
})();
