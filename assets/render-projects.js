// Builds a page's project cards from PAGE_CONFIG + SITE_MANIFEST +
// PROJECT_DETAILS. Shared by work.html / play.html / facilitation.html —
// the page key is taken from the filename, so work.html renders
// PAGE_CONFIG.work and so on. To rearrange projects, edit
// assets/page-config.js; the pages themselves never need to change.
//
// Load order matters: manifest.js, project-details.js and page-config.js
// must come first, and scroll-nav.js must come after, because it measures
// the cards this script appends.
(function renderProjectList() {
  const mount = document.getElementById('project-list');
  if (!mount) return;

  const pageKey = (location.pathname.split('/').pop() || '').replace(/\.html$/, '');
  const entries = (typeof PAGE_CONFIG !== 'undefined' ? PAGE_CONFIG[pageKey] : null) || [];
  if (!entries.length) console.warn('render-projects.js: no PAGE_CONFIG entries for page key:', pageKey);

  entries.forEach(({ key, group, displayName }) => {
    const data = (typeof SITE_MANIFEST !== 'undefined') ? SITE_MANIFEST[key] : null;
    if (!data) { console.warn('page-config.js references unknown project key:', key); return; }
    const info = (typeof PROJECT_DETAILS !== 'undefined' && PROJECT_DETAILS[key]) || {};

    // A project can exist before its media does (a folder with nothing in it
    // yet), in which case the stack is a single empty plate rather than an
    // <img> pointing at nothing.
    // Card plates picked by hand (a Thumbnails folder under NewAssets, turned
    // into jpgs by scripts/build_curated_media.py) lead when there are any.
    const picked = (typeof CURATED_MEDIA !== 'undefined' && CURATED_MEDIA[key] && CURATED_MEDIA[key].thumbs) || [];
    const mainSrc = picked[0] || data.thumb || '';
    const pool = [...picked.slice(1), ...(data.images || []), ...(data.videos || []).map(v => v.poster)]
      .filter((src) => src !== mainSrc);
    const bgLayers = mainSrc ? pool.slice(0, 2).map((src, i) =>
      `<img class="project-thumb thumb-bg-${i + 1}" src="${src}" alt="" loading="lazy">`
    ).join('') : '';
    const mainLayer = mainSrc
      ? `<img class="project-thumb thumb-main" src="${mainSrc}" alt="" loading="lazy">`
      : `<div class="project-thumb thumb-main thumb-empty"><span>soon</span></div>`;

    // A real link, not a div that listens for clicks. That is what makes the
    // list reachable by keyboard at all, and it is also what gives back
    // open-in-new-tab, middle click, copy-link and the URL preview in the
    // status bar — none of which a click handler can offer. onclick stays on
    // as a guard only: it cancels the navigation when the pointer was
    // mid-hold-to-invert and happened to come up over a card.
    const item = document.createElement('a');
    item.className = 'project-item scroll-target' + (group ? ` ${group}-only` : '');
    item.href = `projects/${key.split('/')[1]}.html`;
    item.dataset.project = key;
    item.dataset.top = '0';
    item.setAttribute('onclick', 'return handleProjectClick(event)');
    item.innerHTML = `
      <div class="thumb-stack">
        ${bgLayers}
        ${mainLayer}
      </div>
      <div class="project-details">
        ${info.year ? `<span class="project-year">${info.year}</span>` : ''}
        <h2 class="project-title">${displayName || data.name}</h2>
        ${info.tools && info.tools.length ? `<span class="project-tags">${info.tools.join(' • ')}</span>` : ''}
        ${info.overview ? `<p class="project-desc">${info.overview}</p>` : ''}
      </div>
    `;
    mount.appendChild(item);
  });

  // The stack fanning apart was a :hover effect, so a phone never saw the
  // second and third images at all. The same fan now happens on whichever card
  // is .active — which is how the list is navigated on a phone — and the
  // layers take turns in front, so all three get their moment rather than the
  // top one holding the card forever.
  if (!window.matchMedia || !window.matchMedia('(prefers-reduced-motion: reduce)').matches) {
    setInterval(() => {
      const card = document.querySelector('.project-item.active');
      if (!card || !card.querySelector('.thumb-bg-1')) return;
      card.dataset.top = String((Number(card.dataset.top || 0) + 1) % 3);
    }, 2200);
  }
})();
