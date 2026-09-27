// A room you can walk round with your eyes.
//
// Some of the notebook diagrams are plans of a space with named installations
// sitting in it -- the Echoes of Earth chill zone, Nodeshed. This turns one of
// those plans into a 3-D drawing: the same pencil line, stood up and
// orbitable, with each installation lighting up and naming itself as the
// cursor finds it, and taking the reader to its write-up when clicked.
//
// It is drawn, not rendered. No shading, no materials, no lights -- every
// object is its own edges in the page's ink, because a shaded 3-D render would
// be the one thing on the page that is neither of its two tones. What "lights
// up" means here is what it means in a drawing: the line goes from a whisper to
// full ink, the accent comes up under it, and everything else steps back.
//
// SPEC SHAPE (the rooms themselves live in assets/spaces.js)
//   {
//     floor: { radius, from, to }       // a pie-slice plan with a curved wall
//        or: { poly: [[x, z], ...] }    // any outline, walls on every edge
//     wall:  { height, open: [i, ...] } // `open` leaves those poly edges wall-less
//     view:  { back, lift, target }     // optional camera tweaks (target: look-at height)
//     extra(a, T)                       // optional: more room lines (partitions)
//     items: [
//       { id, label, note, target, at: [x, z], build(a, T) }
//     ]
//   }
// `build` pushes line-segment coordinates into `a` using the toolkit `T`.
// `target` is the id of the heading a click on the item scrolls to.
//
// window.buildSpace(host, spec, { onSelect }) returns { highlight(id|null) }.
//
// A classic script, not a module, so it also runs when a page is opened
// straight off the disk (file://), where Chrome refuses module imports. It
// wants three.js's UMD build (window.THREE) loaded first.

(function () {
const THREE = window.THREE;

// --- the toolkit ---
// Each returns a flat array of line-segment endpoints in local space. Kept as
// segments rather than meshes so the whole scene is one drawing and a single
// material swap can light any part of it.
function seg(pts) {
  const a = [];
  for (let i = 0; i < pts.length - 1; i++) a.push(...pts[i], ...pts[i + 1]);
  return a;
}

function makeTools() {
  const T = {};

  T.box = (w, h, d, x = 0, y = 0, z = 0) => {
    const hx = w / 2, hy = h / 2, hz = d / 2;
    const c = [
      [-hx, -hy, -hz], [hx, -hy, -hz], [hx, -hy, hz], [-hx, -hy, hz],
      [-hx, hy, -hz], [hx, hy, -hz], [hx, hy, hz], [-hx, hy, hz]
    ].map((p) => [p[0] + x, p[1] + y, p[2] + z]);
    const e = [[0,1],[1,2],[2,3],[3,0],[4,5],[5,6],[6,7],[7,4],[0,4],[1,5],[2,6],[3,7]];
    const a = [];
    for (const [i, j] of e) a.push(...c[i], ...c[j]);
    return a;
  };

  // A ring in the XZ plane, optionally lifted and swept only part way round.
  T.ring = (r, y = 0, x = 0, z = 0, from = 0, to = Math.PI * 2, steps = 48) => {
    const pts = [];
    for (let i = 0; i <= steps; i++) {
      const a = from + (to - from) * (i / steps);
      pts.push([x + Math.cos(a) * r, y, z + Math.sin(a) * r]);
    }
    return seg(pts);
  };

  // A ring standing upright, facing along z (yaw turns it).
  T.hoop = (r, x = 0, y = 0, z = 0, yaw = 0, steps = 40) => {
    const pts = [];
    for (let i = 0; i <= steps; i++) {
      const a = (i / steps) * Math.PI * 2;
      const u = Math.cos(a) * r;
      pts.push([x + u * Math.cos(yaw), y + Math.sin(a) * r, z + u * Math.sin(yaw)]);
    }
    return seg(pts);
  };

  // A cone of lines hanging from a rim -- the canopy nets and the pod frames.
  T.basket = (r, depth, x = 0, y = 0, z = 0, ribs = 10) => {
    const a = T.ring(r, y, x, z);
    for (let i = 0; i < ribs; i++) {
      const t = (i / ribs) * Math.PI * 2;
      a.push(x + Math.cos(t) * r, y, z + Math.sin(t) * r, x, y - depth, z);
    }
    a.push(...T.ring(r * 0.55, y - depth * 0.5, x, z));
    return a;
  };

  // A rough ball of latitude/longitude lines: canopies, blossoms, eggs.
  T.blob = (r, x = 0, y = 0, z = 0, n = 3) => {
    const a = [];
    for (let i = 1; i <= n; i++) {
      const t = (i / (n + 1)) * Math.PI;
      a.push(...T.ring(r * Math.sin(t), y + r * Math.cos(t) * -1 + r, x, z, 0, Math.PI * 2, 20));
    }
    for (let i = 0; i < n + 1; i++) {
      const t = (i / (n + 1)) * Math.PI;
      const pts = [];
      for (let k = 0; k <= 16; k++) {
        const u = (k / 16) * Math.PI;
        pts.push([x + Math.sin(u) * Math.cos(t) * r, y + r - Math.cos(u) * r, z + Math.sin(u) * Math.sin(t) * r]);
      }
      a.push(...seg(pts));
    }
    return a;
  };

  T.line = (from, to) => [...from, ...to];

  // A flat panel standing at an angle -- screens, LED walls, mapped surfaces.
  T.panel = (w, h, x, y, z, yaw = 0, tilt = 0) => {
    const hw = w / 2, hh = h / 2;
    const corners = [[-hw, -hh], [hw, -hh], [hw, hh], [-hw, hh]].map(([u, v]) => {
      const ty = v * Math.cos(tilt), tz = v * Math.sin(tilt);
      return [x + u * Math.cos(yaw) - tz * Math.sin(yaw), y + ty, z + u * Math.sin(yaw) + tz * Math.cos(yaw)];
    });
    return seg([...corners, corners[0]]);
  };

  // A panel ruled into a grid -- LED tiles, a wall of screens.
  T.grid = (w, h, cols, rows, x, y, z, yaw = 0) => {
    const a = T.panel(w, h, x, y, z, yaw);
    const cx = Math.cos(yaw), sz = Math.sin(yaw);
    for (let i = 1; i < cols; i++) {
      const u = -w / 2 + (w * i) / cols;
      a.push(x + u * cx, y - h / 2, z + u * sz, x + u * cx, y + h / 2, z + u * sz);
    }
    for (let j = 1; j < rows; j++) {
      const v = y - h / 2 + (h * j) / rows;
      a.push(x - (w / 2) * cx, v, z - (w / 2) * sz, x + (w / 2) * cx, v, z + (w / 2) * sz);
    }
    return a;
  };

  return T;
}

// --- the tones, read from where the map sits rather than restated ---
// Read off the host, not :root: a project page's palette is set on <body>
// (body.sec-work and friends), so the root's values are the wrong pair.
function tones(host) {
  const cs = getComputedStyle(host);
  const pick = (n, fallback) => (cs.getPropertyValue(n).trim() || fallback);
  return {
    ink: pick('--tone-light', '#f4f1ec'),
    accent: pick('--accent', '#6fd9c8')
  };
}

function buildSpace(host, spec, opts = {}) {
  const T = makeTools();
  const scene = new THREE.Scene();

  const camera = new THREE.PerspectiveCamera(38, 1, 0.1, 400);
  const renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true });
  renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
  host.appendChild(renderer.domElement);

  // Labels are DOM, not sprites: they are type, and the page already has a
  // typeface and a colour for type. Positioned each frame from the projected
  // anchor.
  const layer = document.createElement('div');
  layer.className = 'space-labels';
  host.appendChild(layer);

  // Two groups: the outer turns, the inner is shoved so the middle of the
  // room sits on the axis. Spinning a single group turns the plan about its
  // origin, which is a corner of a pie-slice room and reads as the whole space
  // swinging past rather than as you walking round it.
  const root = new THREE.Group();
  const pivot = new THREE.Group();
  root.add(pivot);
  scene.add(root);

  const C = tones(host);
  const mat = (colour, opacity) => new THREE.LineBasicMaterial({
    color: new THREE.Color(colour), transparent: true, opacity
  });

  // --- the room ---
  const f = spec.floor;
  const wallH = spec.wall.height;
  const lines = [];
  let centre = [0, 0], span = 10;

  if (f.poly) {
    const P = f.poly;
    const open = new Set(spec.wall.open || []);
    const xs = P.map((p) => p[0]), zs = P.map((p) => p[1]);
    const minX = Math.min(...xs), maxX = Math.max(...xs);
    const minZ = Math.min(...zs), maxZ = Math.max(...zs);
    centre = [(minX + maxX) / 2, (minZ + maxZ) / 2];
    span = Math.max(maxX - minX, maxZ - minZ) / 2;
    for (let i = 0; i < P.length; i++) {
      const a = P[i], b = P[(i + 1) % P.length];
      lines.push(a[0], 0, a[1], b[0], 0, b[1]);
      if (open.has(i)) continue;
      lines.push(a[0], wallH, a[1], b[0], wallH, b[1]);
      // Uprights along each wall, so a wall reads as a surface and not a rail.
      const len = Math.hypot(b[0] - a[0], b[1] - a[1]);
      const n = Math.max(1, Math.round(len / 1.6));
      for (let k = 0; k <= n; k++) {
        const t = k / n;
        const x = a[0] + (b[0] - a[0]) * t, z = a[1] + (b[1] - a[1]) * t;
        lines.push(x, 0, z, x, wallH, z);
      }
    }
  } else {
    lines.push(...T.ring(f.radius, 0, 0, 0, f.from, f.to, 64));
    lines.push(...T.line([0, 0, 0], [Math.cos(f.from) * f.radius, 0, Math.sin(f.from) * f.radius]));
    lines.push(...T.line([0, 0, 0], [Math.cos(f.to) * f.radius, 0, Math.sin(f.to) * f.radius]));
    for (let i = 1; i < 4; i++) lines.push(...T.ring(f.radius * (i / 4), 0, 0, 0, f.from, f.to, 40));
    // The curved wall: uprights standing on the arc, capped top and bottom.
    const steps = 22;
    for (let i = 0; i <= steps; i++) {
      const a = f.from + (f.to - f.from) * (i / steps);
      const x = Math.cos(a) * f.radius, z = Math.sin(a) * f.radius;
      lines.push(...T.line([x, 0, z], [x, wallH, z]));
    }
    lines.push(...T.ring(f.radius, wallH, 0, 0, f.from, f.to, 64));
    centre = [0, f.radius * 0.46];
    span = f.radius;
  }
  if (spec.extra) spec.extra(lines, T);

  pivot.position.set(-centre[0], 0, -centre[1]);

  const shellGeom = new THREE.BufferGeometry();
  shellGeom.setAttribute('position', new THREE.Float32BufferAttribute(lines, 3));
  const shellMat = mat(C.ink, 0.16);
  pivot.add(new THREE.LineSegments(shellGeom, shellMat));

  // --- the installations ---
  const items = spec.items.map((def) => {
    const g = new THREE.Group();
    const bucket = [];
    def.build(bucket, T);
    const geom = new THREE.BufferGeometry();
    geom.setAttribute('position', new THREE.Float32BufferAttribute(bucket, 3));
    const m = mat(C.ink, 0.6);
    g.add(new THREE.LineSegments(geom, m));
    g.position.set(def.at[0], 0, def.at[1]);
    pivot.add(g);

    // An invisible box the pointer can actually hit. Raycasting lines wants a
    // threshold and still misses more often than it catches; a box around the
    // drawing is what the eye thinks it is pointing at anyway.
    geom.computeBoundingBox();
    const bb = geom.boundingBox;
    const size = new THREE.Vector3(); bb.getSize(size);
    const mid = new THREE.Vector3(); bb.getCenter(mid);
    const hit = new THREE.Mesh(
      new THREE.BoxGeometry(Math.max(size.x, 0.8), Math.max(size.y, 0.8), Math.max(size.z, 0.8)),
      new THREE.MeshBasicMaterial({ visible: false })
    );
    hit.position.copy(mid);
    g.add(hit);

    const el = document.createElement('div');
    el.className = 'space-label';
    el.innerHTML = '<span class="space-label-name"></span>' +
      (def.note ? '<span class="space-label-note"></span>' : '');
    el.querySelector('.space-label-name').textContent = def.label;
    if (def.note) el.querySelector('.space-label-note').textContent = def.note;
    layer.appendChild(el);

    return {
      def, group: g, mat: m, hit, el,
      anchor: new THREE.Vector3(mid.x, bb.max.y + 0.35, mid.z),
      lit: 0
    };
  });

  // --- pointer ---
  // Hover names an installation; a click (a press that did not turn into a
  // drag) opens its write-up. Touch has no hover, so there the first tap names
  // it and a second tap on the same one opens it.
  const ray = new THREE.Raycaster();
  const ptr = new THREE.Vector2(-10, -10);
  let hovered = null, pinned = null, forced = null;
  let dragging = false, downX = 0, downY = 0, lastX = 0, moved = 0, downType = 'mouse';
  let yaw = -0.5, aim = -0.5;

  const setPtr = (e) => {
    const r = host.getBoundingClientRect();
    ptr.set(((e.clientX - r.left) / r.width) * 2 - 1, -((e.clientY - r.top) / r.height) * 2 + 1);
  };
  const pick = () => {
    ray.setFromCamera(ptr, camera);
    const hits = ray.intersectObjects(items.map((i) => i.hit), false);
    return hits.length ? items.find((i) => i.hit === hits[0].object) : null;
  };

  host.addEventListener('pointermove', (e) => {
    if (e.pointerType === 'mouse') setPtr(e);
    if (dragging) {
      moved = Math.max(moved, Math.hypot(e.clientX - downX, e.clientY - downY));
      aim += (e.clientX - lastX) * 0.006;
      lastX = e.clientX;
    }
  });
  host.addEventListener('pointerleave', (e) => {
    if (e.pointerType === 'mouse') ptr.set(-10, -10);
    dragging = false;
  });
  host.addEventListener('pointerdown', (e) => {
    dragging = true; moved = 0; downType = e.pointerType;
    downX = lastX = e.clientX; downY = e.clientY;
  });
  window.addEventListener('pointerup', (e) => {
    if (!dragging) return;
    dragging = false;
    if (moved > 6 || !host.contains(e.target)) return;
    setPtr(e);
    const it = pick();
    if (downType === 'mouse') {
      if (it && opts.onSelect) opts.onSelect(it.def);
      return;
    }
    if (downType === 'touch' || downType === 'pen') ptr.set(-10, -10);
    if (!it) { pinned = null; return; }
    if (pinned === it && opts.onSelect) { opts.onSelect(it.def); pinned = null; return; }
    pinned = it;
  });

  // Vertical drags on a phone should still scroll the page; only sideways
  // ones turn the room.
  host.style.touchAction = 'pan-y';

  const view = spec.view || {};
  function resize() {
    const w = host.clientWidth, h = host.clientHeight;
    if (!w || !h) return;
    renderer.setSize(w, h, false);
    camera.aspect = w / h;
    // The room turns, so the frame has to hold its widest presentation, not
    // the one it happens to start on. Pull back further on a narrow page,
    // where the limit is the width.
    const back = (w / h < 1 ? 2.7 : 1.65) * (view.back || 1);
    camera.position.set(0, span * (view.lift || 1.0), span * back);
    camera.lookAt(0, view.target != null ? view.target : wallH * 0.3, 0);
    camera.updateProjectionMatrix();
  }
  resize();

  // Nothing is drawn while the map is off screen -- a page with a map near
  // the top should not keep a GPU busy for the reader of its last paragraph.
  let visible = true;
  if ('IntersectionObserver' in window) {
    new IntersectionObserver((entries) => {
      visible = entries[0].isIntersecting;
      if (visible) start();
    }).observe(host);
  }

  const reduce = window.matchMedia && window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  const v = new THREE.Vector3();
  const accent = new THREE.Color(C.accent);
  let last = performance.now();
  let running = false;

  function loop(now) {
    if (!visible) { running = false; return; }
    requestAnimationFrame(loop);
    frame(now);
  }
  function start() {
    if (running) return;
    running = true;
    last = performance.now();
    requestAnimationFrame(loop);
  }

  function frame(now) {
    const dt = Math.min(0.05, (now - last) / 1000); last = now;

    const under = ptr.x > -2 ? pick() : null;
    hovered = forced || under || pinned;
    host.style.cursor = under ? 'pointer' : (dragging ? 'grabbing' : 'grab');

    // A slow drift, so the thing reads as a space rather than a picture -- and
    // it stops the moment a hand is on it.
    if (!dragging && !hovered && !reduce) aim += dt * 0.055;
    yaw += (aim - yaw) * (1 - Math.exp(-dt * 6));
    root.rotation.y = yaw;

    shellMat.opacity = hovered ? 0.08 : 0.16;
    for (const it of items) {
      const want = it === hovered ? 1 : 0;
      it.lit += (want - it.lit) * (1 - Math.exp(-dt * 9));
      // Everything not being looked at steps back, so one object being lit is
      // a change in the whole drawing rather than a highlight stuck on top.
      const dim = hovered ? 0.14 : 0.6;
      it.mat.opacity = dim + (1 - dim) * it.lit;
      it.mat.color.set(C.ink).lerp(accent, it.lit);

      // The name pops up over the one being pointed at, and only that one.
      v.copy(it.anchor).applyMatrix4(it.group.matrixWorld).project(camera);
      const on = v.z < 1;
      it.el.style.opacity = on ? String(it.lit) : '0';
      it.el.style.transform =
        'translate(-50%,-100%) translate(' +
        ((v.x * 0.5 + 0.5) * host.clientWidth) + 'px,' +
        ((-v.y * 0.5 + 0.5) * host.clientHeight) + 'px)';
      it.el.classList.toggle('is-lit', it.lit > 0.5);
    }

    renderer.render(scene, camera);
  }
  start();

  let rt = 0;
  window.addEventListener('resize', () => { clearTimeout(rt); rt = setTimeout(resize, 150); });

  return {
    scene, root, items,
    // Light one installation from outside the map (the legend under it).
    highlight(id) {
      forced = id ? items.find((i) => i.def.id === id) || null : null;
    }
  };
}

window.buildSpace = buildSpace;
})();
