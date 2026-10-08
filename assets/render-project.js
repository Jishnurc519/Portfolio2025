// Fills in one per-project page under projects/.
//
// The page itself is a thin shell: scripts/build_project_pages.py bakes in the
// project key (<body data-project="...">), the title, the category tag and the
// back link, and this script fills everything that comes from data — meta row,
// overview, gallery, the case study, and the prev/next pager.
//
// Load order: manifest.js, project-details.js and page-config.js first.
//
// Because the pages sit in projects/ and carry <base href="../">, every path
// here is written relative to the site root, exactly as it appears in
// assets/manifest.js.
(function renderProjectPage() {
  const key = document.body.dataset.project;
  const project = (typeof SITE_MANIFEST !== 'undefined' && key) ? SITE_MANIFEST[key] : null;
  const details = (typeof PROJECT_DETAILS !== 'undefined' && key && PROJECT_DETAILS[key]) || {};
  // Named media picked out by scripts/build_curated_media.py -- the files a
  // case study points at by name ("beepod-1") rather than by gallery index.
  const curated = (typeof CURATED_MEDIA !== 'undefined' && key && CURATED_MEDIA[key]) || {};
  const curatedItems = curated.items || {};
  // Where this script was loaded from, so the 3-D map module resolves next to
  // it whatever <base> the page carries.
  const scriptBase = document.currentScript ? document.currentScript.src : location.href;

  const galleryEl = document.getElementById('project-gallery');
  const metaRowEl = document.getElementById('meta-row');
  const overviewEl = document.getElementById('project-overview');
  const extraEl = document.getElementById('extra-sections');
  const pagerEl = document.getElementById('project-pager');

  if (!project) {
    if (galleryEl) galleryEl.innerHTML =
      '<p class="empty-state">Couldn\'t find that project. Head back and try another one.</p>';
    console.warn('render-project.js: no manifest entry for', key);
    return;
  }

  // --- META ---
  function addMeta(label, value) {
    if (!value || !metaRowEl) return;
    const item = document.createElement('div');
    item.className = 'meta-item';
    item.innerHTML = '<span class="meta-label"></span><span class="meta-value"></span>';
    item.querySelector('.meta-label').textContent = label;
    item.querySelector('.meta-value').textContent = value;
    metaRowEl.appendChild(item);
  }
  addMeta('Year', details.year);
  addMeta('Role', details.role);
  if (details.tools && details.tools.length) addMeta('Tools', details.tools.join(', '));

  if (overviewEl && details.overview) overviewEl.textContent = details.overview;

  // --- MEDIA ---
  const images = project.images || [];
  const videos = project.videos || [];

  // Smaller copies in newer formats (scripts/build_web_formats.py): AVIF
  // beside a still, AV1 .webm beside a clip. Asked for only where the index
  // says one exists, and always with the original as the fallback.
  const formats = (typeof MEDIA_FORMATS !== 'undefined') ? MEDIA_FORMATS : {};
  const avifSet = new Set(formats.avif || []);
  const av1Set = new Set(formats.av1 || []);
  const swapExt = (src, ext) => src.replace(/\.[a-z0-9]+$/i, ext);
  // A <picture> falls back on its own; a video poster cannot, so posters wait
  // on one decode of a 2px AVIF to learn whether this browser reads them.
  const avifOK = new Promise((resolve) => {
    const probe = new Image();
    probe.onload = () => resolve(probe.width > 0);
    probe.onerror = () => resolve(false);
    probe.src = 'data:image/avif;base64,AAAAIGZ0eXBhdmlmAAAAAGF2aWZtaWYxbWlhZk1BMUIAAAD5bWV0YQAAAAAAAAAvaGRscgAAAAAAAAAAcGljdAAAAAAAAAAAAAAAAFBpY3R1cmVIYW5kbGVyAAAAAA5waXRtAAAAAAABAAAAHmlsb2MAAAAARAAAAQABAAAAAQAAASEAAAATAAAAKGlpbmYAAAAAAAEAAAAaaW5mZQIAAAAAAQAAYXYwMUNvbG9yAAAAAGppcHJwAAAAS2lwY28AAAAUaXNwZQAAAAAAAAACAAAAAgAAABBwaXhpAAAAAAMICAgAAAAMYXYxQ4EADAAAAAATY29scm5jbHgAAgACAAIAAAAAF2lwbWEAAAAAAAAAAQABBAECgwQAAAAbbWRhdAoFGAA2wCAyChyAAABYAABABMA=';
  });

  // Every still on the page is an <img> inside a <button>. Not decoration: a
  // plain <img> cannot be reached by keyboard, so the lightbox it opens was
  // mouse-only, and a button is the one element that already means "this does
  // something when you press it" to a screen reader and to the Tab key alike.
  function stillButton(src, index, alt, size) {
    const btn = document.createElement('button');
    btn.type = 'button';
    btn.className = 'still';
    btn.dataset.index = String(index);
    btn.setAttribute('aria-label', 'Enlarge image');
    const img = document.createElement('img');
    img.src = src;
    img.loading = 'lazy';
    img.decoding = 'async';
    // The manifest records what the file actually measures, so the space is
    // reserved before the bytes arrive and the page stops jumping under the
    // reader as each one lands.
    const dim = size || (project.sizes || {})[src];
    if (dim) { img.width = dim[0]; img.height = dim[1]; }
    // The gallery repeats one project's name on every image otherwise, which
    // is eight identical announcements and no information. These sit under a
    // heading that already names the work.
    img.alt = alt || '';
    if (avifSet.has(src)) {
      const pic = document.createElement('picture');
      const source = document.createElement('source');
      source.type = 'image/avif';
      source.srcset = swapExt(src, '.avif');
      pic.appendChild(source);
      pic.appendChild(img);
      btn.appendChild(pic);
    } else {
      btn.appendChild(img);
    }
    return btn;
  }

  // Where the finished film lives when the finished film is on YouTube. It
  // goes in ahead of the stills rather than among them: the stills are the
  // making of a thing, and the thing itself should not have to be scrolled
  // past eight photographs to be found.
  //
  // Every video on the site plays on its own, films included: the player is
  // swapped in, muted, the first time the film comes into view (a browser
  // will only start a video by itself with the sound off), and the reader
  // turns the sound up in YouTube's own controls. youtube-nocookie keeps the
  // visit off the viewer's watch history. Until then the film's own thumbnail
  // and a play mark stand in for it -- and on file:// they stay, because
  // YouTube refuses to play in a frame that sends no Referer, which is every
  // page opened straight from disk; there the press opens it on YouTube.
  function youtubeFrame(id, title) {
    const wrap = document.createElement('div');
    wrap.className = 'video-embed yt-facade';
    const watch = 'https://www.youtube.com/watch?v=' + encodeURIComponent(id);
    const thumb = document.createElement('img');
    thumb.alt = '';
    thumb.loading = 'lazy';
    thumb.src = 'https://i.ytimg.com/vi/' + encodeURIComponent(id) + '/maxresdefault.jpg';
    // maxres only exists for HD uploads; YouTube answers a missing one with a
    // 120px grey placeholder rather than an error, so check the size too.
    const fallback = () => { thumb.src = 'https://i.ytimg.com/vi/' + encodeURIComponent(id) + '/hqdefault.jpg'; };
    thumb.addEventListener('error', fallback, { once: true });
    thumb.addEventListener('load', () => { if (thumb.naturalWidth < 200) fallback(); }, { once: true });
    const btn = document.createElement('button');
    btn.type = 'button';
    btn.className = 'video-play';
    btn.setAttribute('aria-label', 'Play ' + (title || 'video'));
    const start = (muted) => {
      const frame = document.createElement('iframe');
      frame.src = 'https://www.youtube-nocookie.com/embed/' + encodeURIComponent(id)
        + '?autoplay=1&rel=0&playsinline=1' + (muted ? '&mute=1' : '');
      frame.title = title || 'Video';
      frame.allow = 'accelerometer; autoplay; clipboard-write; encrypted-media; picture-in-picture; fullscreen';
      frame.allowFullscreen = true;
      frame.referrerPolicy = 'strict-origin-when-cross-origin';
      frame.setAttribute('frameborder', '0');
      wrap.replaceChildren(frame);
    };
    btn.addEventListener('click', () => {
      if (location.protocol === 'file:') { window.open(watch, '_blank', 'noopener'); return; }
      start(false);
    });
    if (location.protocol !== 'file:' && 'IntersectionObserver' in window) {
      const io = new IntersectionObserver((entries) => {
        if (!entries.some((e) => e.isIntersecting)) return;
        io.disconnect();
        if (wrap.contains(btn)) start(true);
      }, { threshold: 0.35 });
      io.observe(wrap);
    }
    const link = document.createElement('a');
    link.className = 'yt-link';
    link.href = watch; link.target = '_blank'; link.rel = 'noopener';
    link.textContent = 'YouTube ↗';
    wrap.append(thumb, btn, link);
    return wrap;
  }

  // A documentation clip plays on its own, muted and looping, whenever it is
  // on screen -- every video on the site does. It has no controls until it
  // is asked for: `controls` draws the browser's own play bar, timecode and
  // overflow menu across a designed page. One small mark in the corner turns
  // the sound on, and brings the controls with it, by which point they are
  // what the reader asked for.
  function videoStill(v) {
    const wrap = document.createElement('div');
    wrap.className = 'video-still';
    const video = document.createElement('video');
    // AV1 first where there is one; the browser takes the first source it can
    // play, so anything without AV1 falls through to the H.264 MP4.
    if (av1Set.has(v.src)) {
      const webm = document.createElement('source');
      webm.src = swapExt(v.src, '.webm');
      webm.type = 'video/webm; codecs="av01.0.05M.08, opus"';
      video.appendChild(webm);
    }
    const mp4 = document.createElement('source');
    mp4.src = v.src;
    mp4.type = 'video/mp4';
    video.appendChild(mp4);
    if (v.poster) {
      avifOK.then((ok) => {
        video.poster = ok && avifSet.has(v.poster) ? swapExt(v.poster, '.avif') : v.poster;
      });
    }
    video.playsInline = true;
    video.muted = true; video.loop = true;
    video.setAttribute('muted', '');
    video.preload = 'none';
    video.controls = false;
    const dim = v.size || (project.sizes || {})[v.poster];
    if (dim) { video.width = dim[0]; video.height = dim[1]; }
    const btn = document.createElement('button');
    btn.type = 'button';
    btn.className = 'clip-sound';
    btn.setAttribute('aria-label', 'Sound on');
    btn.innerHTML = '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">'
      + '<path d="M11 5 6 9H3v6h3l5 4z" fill="currentColor"/><path d="m16 9 5 6m0-6-5 6"/></svg>';
    btn.addEventListener('click', function () {
      video.muted = false;
      video.controls = true;
      wrap.classList.add('playing');
      btn.remove();
      video.play().catch(() => {});
    });
    wrap.appendChild(video);
    wrap.appendChild(btn);
    playInView(video);
    return wrap;
  }

  // The finished film, where there is one, keeps its place above the write-up
  // in a slot of its own; the stills and the documentation clips now follow
  // the story rather than preceding it. The gallery used to come first in
  // full, which meant a reader met eight photographs of how a thing was made
  // before one line saying what it was. The argument goes first now and the
  // evidence follows -- but the work itself is not evidence, so the film
  // stays where it was.
  const filmEl = document.getElementById('project-film');
  if (details.youtube) (filmEl || galleryEl).appendChild(youtubeFrame(details.youtube, project.name));

  // A case study laid out as spreads (see `spread` in project-details.js) is
  // its own title page: the heading, the meta row and the overview would only
  // say again, above it, what its first spread says.
  if (details.layout === 'spread') document.body.classList.add('layout-spread');

  // One name for every kind of thing a story or a gallery can point at:
  //   2            -> the manifest's third still (the old `figure` index; wraps)
  //   "vid:0"      -> the manifest's first clip
  //   "beepod-1"   -> a named file from assets/curated-media.js
  //   "assets/..." -> a file by path (.svg draws as line art in the page's ink)
  // Returns { type: "image" | "video" | "diagram", src, poster?, size? }.
  function resolveMedia(ref) {
    if (typeof ref === 'number') {
      if (!images.length) return null;
      const i = ref % images.length;
      return { type: 'image', src: images[i], index: i };
    }
    if (typeof ref !== 'string') return null;
    if (curatedItems[ref]) return curatedItems[ref];
    const vid = /^vid:(\d+)$/.exec(ref);
    if (vid) {
      const v = videos[Number(vid[1])];
      return v ? { type: 'video', src: v.src, poster: v.poster } : null;
    }
    if (/\.svg$/i.test(ref)) return { type: 'diagram', src: ref };
    if (/\.mp4$/i.test(ref)) return { type: 'video', src: ref };
    if (ref.indexOf('/') > -1) return { type: 'image', src: ref };
    console.warn('render-project.js: unknown media', ref, 'on', key);
    return null;
  }

  // Line drawings are pulled in as markup rather than shown as <img>, so their
  // strokes can be `currentColor` and come out in the section's own ink. On
  // file:// (no fetch) they fall back to an <img>, which is still legible.
  // A drawing registered in assets/diagrams.js is written straight in, which
  // is the one route that keeps its ink on file:// as well.
  function diagramEl(src, alt) {
    const wrap = document.createElement('div');
    wrap.className = 'diagram';
    wrap.setAttribute('role', 'img');
    if (alt) wrap.setAttribute('aria-label', alt);
    const inlined = (typeof SITE_DIAGRAMS !== 'undefined') && SITE_DIAGRAMS[src];
    if (inlined) { wrap.innerHTML = inlined; return wrap; }
    fetch(src).then((r) => (r.ok ? r.text() : Promise.reject(r.status)))
      .then((text) => { wrap.innerHTML = text; })
      .catch(() => {
        const img = document.createElement('img');
        img.src = src; img.alt = alt || '';
        wrap.appendChild(img);
      });
    return wrap;
  }

  function mediaEl(m, alt) {
    if (!m) return null;
    if (m.type === 'video') return videoStill(m);
    if (m.type === 'diagram') return diagramEl(m.src, alt);
    return stillButton(m.src, m.index || 0, alt, m.size);
  }

  if (galleryEl) {
    const frag = document.createDocumentFragment();
    // A project can name its gallery outright, which is how a gallery leaves
    // out what the story has already shown and takes in files the manifest
    // never picked up.
    if (Array.isArray(details.gallery)) {
      details.gallery.forEach((ref) => {
        const el = mediaEl(resolveMedia(ref));
        if (el) frag.appendChild(el);
      });
    } else {
      images.forEach((src, i) => frag.appendChild(stillButton(src, i)));
      videos.forEach((v) => frag.appendChild(videoStill(v)));
    }

    // `gallery: []` is a project whose story already shows everything; it
    // gets no gallery at all rather than a note saying media is on its way.
    if (Array.isArray(details.gallery) && !details.gallery.length) {
      galleryEl.remove();
    } else if (!frag.childNodes.length && !details.youtube) {
      galleryEl.classList.remove('gallery');
      galleryEl.innerHTML = '<p class="empty-state">Media for this one is still being put together.</p>';
    } else {
      galleryEl.appendChild(frag);
    }
  }

  // --- THE CASE STUDY ---
  // A story is a list of blocks (see the shape documented in
  // assets/project-details.js). A project without one shows its gallery and
  // nothing else: the placeholder copy it used to borrow was public, and read
  // as lorem ipsum under his name. Those pages are also kept out of search
  // until written (scripts/build_project_pages.py).
  const story = (details.story && details.story.length) ? details.story : null;
  const blocks = story || [];

  // Enough markup to write a paragraph with, and no more. Everything else in
  // the string is escaped first, so a stray angle bracket in the copy stays a
  // stray angle bracket.
  function inline(text) {
    const esc = String(text)
      .replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');
    return esc
      // [a link](projects/nodeshed.html) -- site paths, #anchors and https
      // only, so a typo cannot turn into a javascript: URL.
      .replace(/\[([^\]]+)\]\(((?:https:\/\/|projects\/|#)[^)\s]*)\)/g, (m, text, href) =>
        `<a href="${href}"${/^https:/.test(href) ? ' target="_blank" rel="noopener"' : ''}>${text}</a>`)
      .replace(/\*\*([^*]+)\*\*/g, '<strong>$1</strong>')
      .replace(/\*([^*]+)\*/g, '<em>$1</em>');
  }

  // A figure index picks from this project's own stills and wraps, so one
  // story fits a project with two images and a project with nine.
  // `ref` may be a list, which sets the files side by side in one figure.
  // `loop` makes any clip in it play on its own, muted and on repeat, with
  // no controls -- for the clips that are pictures rather than films.
  // `captions`, a list beside a list of files, sets a line under each one.
  function figureFor(ref, side, caption, loop, captions) {
    const refs = Array.isArray(ref) ? ref : [ref];
    const els = refs.map((r, i) => {
      const m = resolveMedia(r);
      const el = (loop && m && m.type === 'video') ? loopClip(m) : mediaEl(m, (captions && captions[i]) || caption);
      if (!el || !captions || !captions[i]) return el;
      const cell = document.createElement('div');
      cell.className = 'figure-cell';
      const cap = document.createElement('p');
      cap.className = 'cell-caption';
      cap.textContent = captions[i];
      cell.append(el, cap);
      return cell;
    }).filter(Boolean);
    if (!els.length) return null;
    const fig = document.createElement('figure');
    fig.className = `story-figure side-${side || 'full'}` +
      (els.length > 1 ? ` multi n-${Math.min(els.length, 4)}` : '');
    els.forEach((el) => fig.appendChild(el));
    if (caption) {
      const cap = document.createElement('figcaption');
      cap.textContent = caption;
      fig.appendChild(cap);
    }
    return fig;
  }

  // Plots rebuilt as type: the plotted data is an image cut to the plot's
  // frame, and the axes, ticks, numbers and labels are real text laid over
  // it. Ticks sit at percentages of the plot area, so they stay on their
  // values at any width while the type keeps its own size.
  //   { plots: [{ src, x: [min, max], y: [min, max], xticks: [...],
  //     yticks: [...], xlabel, ylabel, box, title }], caption }
  function plotsFigure(plots, side, caption) {
    const fig = document.createElement('figure');
    fig.className = `story-figure plots side-${side || 'full'} n-${plots.length}`;
    const num = (v) => String(v).replace('-', '−');
    plots.forEach((p) => {
      const [x0, x1] = p.x, [y0, y1] = p.y;
      const plot = document.createElement('div');
      plot.className = 'plot';
      if (p.title) {
        const t = document.createElement('p');
        t.className = 'plot-title';
        t.textContent = p.title;
        plot.appendChild(t);
      }
      const yl = document.createElement('span');
      yl.className = 'plot-label y';
      // A label may be MathML, for what plain text cannot set (a dotted θ).
      const label = (el, v) => { if (/^</.test(v || '')) el.innerHTML = v; else el.textContent = v || ''; };
      label(yl, p.ylabel);
      const area = document.createElement('div');
      area.className = 'plot-area' + (p.box === false ? '' : ' box');
      // The data layer is cut to the frame, so its shape is the plot's.
      const dim = (project.sizes || {})[p.src];
      if (dim) area.style.aspectRatio = `${dim[0]} / ${dim[1]}`;
      const img = document.createElement('img');
      img.src = p.src;
      img.alt = '';
      img.decoding = 'async';
      img.loading = 'lazy';
      area.appendChild(img);
      (p.xticks || []).forEach((v) => {
        const t = document.createElement('span');
        t.className = 'tick x';
        t.style.left = `${(v - x0) / (x1 - x0) * 100}%`;
        t.textContent = num(v);
        area.appendChild(t);
      });
      (p.yticks || []).forEach((v) => {
        const t = document.createElement('span');
        t.className = 'tick y';
        t.style.bottom = `${(v - y0) / (y1 - y0) * 100}%`;
        t.textContent = num(v);
        area.appendChild(t);
      });
      const xl = document.createElement('span');
      xl.className = 'plot-label x';
      label(xl, p.xlabel);
      plot.append(yl, area, xl);
      fig.appendChild(plot);
    });
    if (caption) {
      const cap = document.createElement('figcaption');
      cap.textContent = caption;
      fig.appendChild(cap);
    }
    return fig;
  }

  // Numbered equations, set in MathML so they are type, not pictures.
  //   { equations: [["<math>…</math>", "40", [narrow lines…]], …] }
  // The optional third item is the equation broken into lines, shown
  // instead on screens too narrow for it in one.
  function equationsFigure(list, side) {
    const fig = document.createElement('figure');
    fig.className = `story-figure equations side-${side || 'full'}`;
    list.forEach(([math, n, lines]) => {
      const row = document.createElement('div');
      row.className = 'eq';
      const body = document.createElement('div');
      body.className = 'eq-body';
      body.innerHTML = math;
      if (lines) {
        body.classList.add('has-lines');
        const broken = document.createElement('div');
        broken.className = 'eq-lines';
        broken.innerHTML = lines.join('');
        body.appendChild(broken);
      }
      row.appendChild(body);
      if (n) {
        const tag = document.createElement('span');
        tag.className = 'eq-n';
        tag.textContent = `(${n})`;
        row.appendChild(tag);
      }
      fig.appendChild(row);
    });
    return fig;
  }

  // An Instagram post or reel, in Instagram's own player. No embed.js: the
  // player page works on its own, and the one thing the script adds -- sizing
  // the frame to the post -- is a single postMessage, handled below. The link
  // underneath is for anyone whose browser blocks third-party frames.
  function instagramEmbed(url, side) {
    const m = /instagram\.com\/(p|reel|tv)\/([^/?#]+)/.exec(url);
    const fig = document.createElement('figure');
    fig.className = `story-figure embed-figure side-${side || 'full'}`;
    if (m) {
      const frame = document.createElement('iframe');
      frame.className = 'ig-embed';
      frame.src = `https://www.instagram.com/${m[1]}/${m[2]}/embed/`;
      frame.title = 'Instagram post';
      frame.loading = 'lazy';
      frame.allow = 'encrypted-media; picture-in-picture; fullscreen';
      frame.setAttribute('scrolling', 'no');
      frame.setAttribute('frameborder', '0');
      fig.appendChild(frame);
    }
    const cap = document.createElement('figcaption');
    const a = document.createElement('a');
    a.href = url.split('?')[0];
    a.target = '_blank'; a.rel = 'noopener';
    a.textContent = 'Watch on Instagram ↗';
    cap.appendChild(a);
    fig.appendChild(cap);
    return fig;
  }
  window.addEventListener('message', (e) => {
    if (e.origin !== 'https://www.instagram.com') return;
    let data = e.data;
    try { if (typeof data === 'string') data = JSON.parse(data); } catch (err) { return; }
    if (!data || data.type !== 'MEASURE' || !data.details) return;
    document.querySelectorAll('iframe.ig-embed').forEach((f) => {
      if (f.contentWindow === e.source) f.style.height = Math.ceil(data.details.height) + 'px';
    });
  });

  // A plan from the notebook, stood up in 3-D (assets/space-3d.js; the rooms
  // themselves are in assets/spaces.js). The row of names under it is the
  // same set of installations as buttons -- the way in for a keyboard, a
  // screen reader, and any browser where the map itself does not load.
  // Plain <script> tags rather than import(): module imports are refused on
  // file://, and the maps should show however the page was opened.
  function loadScript(src) {
    return new Promise((resolve, reject) => {
      const s = document.createElement('script');
      s.src = src; s.onload = resolve; s.onerror = reject;
      document.head.appendChild(s);
    });
  }
  let spacesReady = null;
  function loadSpaces() {
    if (!spacesReady) {
      spacesReady = loadScript('https://cdn.jsdelivr.net/npm/three@0.149.0/build/three.min.js')
        .then(() => loadScript(new URL('space-3d.js', scriptBase).href))
        .then(() => loadScript(new URL('spaces.js', scriptBase).href));
    }
    return spacesReady;
  }

  function spaceBlock(b) {
    const wrap = document.createElement('div');
    wrap.className = 'space-block';
    const host = document.createElement('div');
    host.className = 'space-host';
    host.setAttribute('aria-hidden', 'true');
    wrap.appendChild(host);
    const list = document.createElement('div');
    list.className = 'space-legend';
    wrap.appendChild(list);

    const go = (id) => {
      const target = id && document.getElementById(id);
      if (!target) return;
      target.scrollIntoView({ behavior: 'smooth', block: 'start' });
      target.classList.remove('flash');
      void target.offsetWidth;
      target.classList.add('flash');
    };

    let api = null;
    loadSpaces().then(() => {
      const spec = window.SPACES[b.space];
      if (!spec) return;
      spec.items.forEach((it) => {
        const btn = document.createElement('button');
        btn.type = 'button';
        btn.textContent = it.label;
        btn.addEventListener('click', () => go(it.target));
        const lit = (on) => () => { if (api) api.highlight(on ? it.id : null); };
        btn.addEventListener('mouseenter', lit(true));
        btn.addEventListener('mouseleave', lit(false));
        btn.addEventListener('focus', lit(true));
        btn.addEventListener('blur', lit(false));
        list.appendChild(btn);
      });
      api = window.buildSpace(host, spec, { onSelect: (it) => go(it.target) });
    }).catch((err) => {
      console.warn('render-project.js: the 3-D map did not load', err);
      host.remove();
    });
    return wrap;
  }

  // A page laid out the way it was somewhere else -- a slide from the old
  // PDF, a page of the GMMBBQ Readymag site -- rather than as a column.
  //
  //   { spread: { w: 1024, h: 2780, items: [ ... ] } }
  //
  // `w` x `h` is the original page in its own units, and every item is placed
  // on it by x, y, w (and h, for anything that is not text) in those same
  // units, so the numbers can be read straight off the original. Type is sized
  // in those units too (`fs`) and scales with the spread, with a floor so it
  // never goes below reading size. Items are written in reading order, which
  // is the order they stack in on a phone, where there is no room for the
  // original arrangement and the spread becomes a column.
  //
  // An item is one of: media (any reference `media` takes; fills its box),
  // `art` (a transparent drawing, never cropped), `youtube`, or text --
  // `title`, `lead`, `h` (as a string), `p` (a string or a list of paragraphs), `tags` (a
  // list of ruled labels), `caption`, `link: { text, href }`.
  function spreadBlock(sp) {
    const W = sp.w, H = sp.h;
    const el = document.createElement('div');
    el.className = 'spread' + (sp.cls ? ' ' + sp.cls : '');
    el.style.setProperty('--sw', W);
    el.style.aspectRatio = W + ' / ' + H;
    if (sp.id) el.id = sp.id;
    const pct = (v, of) => (v / of * 100).toFixed(4) + '%';

    sp.items.forEach((it) => {
      const box = document.createElement('div');
      box.className = 'spread-item' + (it.cls ? ' ' + it.cls : '');
      box.style.left = pct(it.x, W);
      box.style.top = pct(it.y, H);
      box.style.width = pct(it.w, W);
      if (typeof it.h === 'number') box.style.height = pct(it.h, H);
      if (it.fs) box.style.setProperty('--fs', it.fs);
      if (it.align) box.style.textAlign = it.align;
      if (it.z) box.style.zIndex = it.z;
      // Narrow pieces pair up two to a row on a phone rather than each taking
      // the full width, which turned a row of four stills into four screens.
      if (it.w / W <= 0.36 && (it.media !== undefined || it.art)) box.classList.add('narrow');

      if (it.media !== undefined || it.art) {
        const m = resolveMedia(it.art || it.media);
        const node = m && (it.loop && m.type === 'video' ? loopClip(m) : mediaEl(m, it.alt || it.caption));
        if (node) box.appendChild(node);
        box.classList.add(it.art ? 'is-art' : 'is-media');
      }
      if (it.youtube) { box.appendChild(youtubeFrame(it.youtube, it.alt)); box.classList.add('is-media'); }
      const text = (tag, cls, s) => {
        const n = document.createElement(tag);
        if (cls) n.className = cls;
        n.innerHTML = inline(s);
        box.appendChild(n);
        return n;
      };
      if (it.title) text('h2', 'spread-title', it.title);
      if (it.lead) text('p', 'spread-lead', it.lead);
      // `h` is a box height when it is a number and a heading when it is text.
      if (typeof it.h === 'string') text('h3', 'spread-h', it.h);
      if (it.p) [].concat(it.p).forEach((s) => text('p', '', s));
      if (it.tags) it.tags.forEach((s) => text('span', 'spread-tag', s));
      if (it.caption && it.media === undefined && !it.art) text('p', 'spread-caption', it.caption);
      if (it.link) {
        const a = document.createElement('a');
        a.className = 'spread-link';
        a.href = it.link.href;
        a.textContent = it.link.text;
        box.appendChild(a);
      }
      el.appendChild(box);
    });
    return el;
  }

  // Plays while on screen and pauses off it, so a page of clips costs one or
  // two decoders at a time rather than all of them.
  function playInView(v) {
    if (!('IntersectionObserver' in window)) { v.play().catch(() => {}); return; }
    new IntersectionObserver((entries) => {
      entries.forEach((e) => { if (e.isIntersecting) v.play().catch(() => {}); else v.pause(); });
    }, { threshold: 0.25 }).observe(v);
  }

  // A clip that plays like the animated image it replaces: muted, looping,
  // no controls, and only while it is on screen.
  function loopClip(m) {
    const v = document.createElement('video');
    v.className = 'loop-clip';
    v.controls = false;
    v.disablePictureInPicture = true;
    v.muted = true; v.loop = true; v.playsInline = true; v.preload = 'none';
    v.setAttribute('muted', '');
    if (m.poster) v.poster = m.poster;
    v.src = m.src;
    playInView(v);
    return v;
  }

  if (extraEl && blocks.length) {
    const article = document.createElement('div');
    article.className = 'story';

    blocks.forEach((b) => {
      if (b.h) {
        const h = document.createElement('h2');
        h.textContent = b.h;
        // An id makes the heading somewhere the 3-D map can send the reader.
        if (b.id) h.id = b.id;
        article.appendChild(h);
        return;
      }
      if (b.space) {
        article.appendChild(spaceBlock(b));
        return;
      }
      if (b.spread) {
        article.appendChild(spreadBlock(b.spread));
        return;
      }
      // The finished film placed in the story itself, where a layout wants it
      // somewhere other than above the write-up.
      if (b.youtube && !b.p) {
        const film = youtubeFrame(b.youtube, b.caption || project.name);
        if (b.id) film.id = b.id;
        film.classList.add('story-film');
        article.appendChild(film);
        return;
      }
      if (b.quote) {
        const q = document.createElement('blockquote');
        q.innerHTML = inline(b.quote);
        if (b.cite) {
          const c = document.createElement('cite');
          c.textContent = b.cite;
          q.appendChild(c);
        }
        article.appendChild(q);
        return;
      }
      // A paragraph, an image, or a paragraph wrapped around an image.
      //
      // The side class is what splits the row into two columns, so it is only
      // worn when there is something to put in the second one. A story that
      // asks for a figure the project does not have -- every story on a
      // project whose stills have not been built yet -- used to get the grid
      // anyway, which left the paragraph capped at 46ch beside half a page of
      // nothing. Falling back to `full` lets it run at its natural measure.
      const ref = b.media !== undefined ? b.media : b.figure;
      // A film beside a paragraph: the same thumbnail-until-pressed player.
      const ytFig = (id) => {
        const f = document.createElement('figure');
        f.className = 'story-figure yt-figure side-' + (b.side || 'full');
        f.appendChild(youtubeFrame(id, b.caption || project.name));
        return f;
      };
      const fig = b.youtube ? ytFig(b.youtube)
        : b.embed ? instagramEmbed(b.embed, b.side)
        : b.plots ? plotsFigure(b.plots, b.side, b.caption)
        : b.equations ? equationsFigure(b.equations, b.side)
        : (ref !== undefined) ? figureFor(ref, b.side, b.caption, b.loop, b.captions) : null;
      if (fig && b.icons) fig.classList.add('icons');
      const row = document.createElement('div');
      row.className = fig ? `story-row side-${b.side || 'full'}` : 'story-row side-full';
      if (fig) row.appendChild(fig);
      if (b.p) {
        const para = document.createElement('p');
        para.innerHTML = inline(b.p);
        row.appendChild(para);
      }
      if (row.childNodes.length) article.appendChild(row);
    });

    extraEl.appendChild(article);
  }

  // --- PROCESS / CREDITS ---
  function addTextSection(heading, body) {
    if (!body || !extraEl) return;
    const section = document.createElement('div');
    section.className = 'text-section';
    section.innerHTML = '<h2></h2><p></p>';
    section.querySelector('h2').textContent = heading;
    section.querySelector('p').textContent = body;
    extraEl.appendChild(section);
  }
  addTextSection('Process', details.process);
  addTextSection('Credits', details.credits);

  // --- PREV / NEXT ---
  // Read live from PAGE_CONFIG rather than baked in, so reordering a section
  // moves the arrows without regenerating every page.
  if (pagerEl && typeof PAGE_CONFIG !== 'undefined') {
    const section = Object.keys(PAGE_CONFIG)
      .find((name) => PAGE_CONFIG[name].some((entry) => entry.key === key));
    // A project wears the palette of the list it was opened from. Without
    // this a case study stays on paper-and-black while the page that linked
    // to it is cyan, and the back button walks you between two colour schemes.
    if (section) document.body.classList.add('sec-' + section);
    const siblings = section ? PAGE_CONFIG[section] : [];
    const index = siblings.findIndex((entry) => entry.key === key);

    const addPager = (entry, label, className) => {
      if (!entry) return;
      const data = (typeof SITE_MANIFEST !== 'undefined') ? SITE_MANIFEST[entry.key] : null;
      const slug = entry.key.split('/')[1];
      const link = document.createElement('a');
      link.className = `pager-link ${className}`;
      link.href = `projects/${slug}.html`;
      link.innerHTML = '<span class="pager-label"></span><span class="pager-name"></span>';
      link.querySelector('.pager-label').textContent = label;
      link.querySelector('.pager-name').textContent =
        entry.displayName || (data && data.name) || slug;
      pagerEl.appendChild(link);
    };

    if (index > -1) {
      addPager(siblings[index - 1], 'Previous', 'pager-prev');
      addPager(siblings[index + 1], 'Next', 'pager-next');
    }
  }

  // --- LIGHTBOX ---
  // Videos keep their own controls; only stills open full-bleed.
  const lightbox = document.getElementById('lightbox');
  if (lightbox) {
    const lightboxImg = lightbox.querySelector('img');
    const closeBtn = lightbox.querySelector('.lightbox-close');
    // Where to put focus back. Sending it to the top of the document instead
    // loses a keyboard reader their place in a gallery of eight.
    let opener = null;

    const open = (btn) => {
      const img = btn.querySelector('img');
      if (!img) return;
      opener = btn;
      lightboxImg.src = img.currentSrc || img.src;
      lightboxImg.alt = img.alt || '';
      lightbox.classList.add('is-open');
      lightbox.setAttribute('aria-hidden', 'false');
      // The page behind used to keep scrolling under the overlay.
      document.body.classList.add('lightbox-open');
      if (closeBtn) closeBtn.focus();
    };

    const close = () => {
      if (!lightbox.classList.contains('is-open')) return;
      lightbox.classList.remove('is-open');
      lightbox.setAttribute('aria-hidden', 'true');
      document.body.classList.remove('lightbox-open');
      if (opener) { opener.focus(); opener = null; }
    };

    // Delegated, so stills inside the case study open it too.
    document.addEventListener('click', (e) => {
      const btn = e.target.closest && e.target.closest('.still');
      if (btn) { e.preventDefault(); open(btn); }
    });

    lightbox.addEventListener('click', (e) => {
      // Anywhere outside the image itself, which is the whole backdrop.
      if (e.target === lightboxImg) return;
      close();
    });
    if (closeBtn) closeBtn.addEventListener('click', close);

    window.addEventListener('keydown', (e) => {
      if (e.key === 'Escape') { close(); return; }
      // While it is open it is the only thing on the page, so Tab has to stay
      // inside it — there is exactly one stop, which makes the trap a loop of
      // one rather than a cycle to manage.
      if (e.key === 'Tab' && lightbox.classList.contains('is-open')) {
        e.preventDefault();
        if (closeBtn) closeBtn.focus();
      }
    });
  }

  // The story is built by script, so a link into it (facilitation.html sends
  // people to nodeshed.html#workshops) arrives before its heading exists and
  // the browser's own jump finds nothing. Do the jump once it does.
  if (location.hash.length > 1) {
    const jump = () => {
      const target = document.getElementById(decodeURIComponent(location.hash.slice(1)));
      if (target) target.scrollIntoView({ block: 'start' });
    };
    requestAnimationFrame(jump);
    window.addEventListener('load', jump);
  }
})();
