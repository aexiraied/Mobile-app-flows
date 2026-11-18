/* The particle field: one cloud of points that re-forms into a new shape for each chapter.
   the name MARVEL -> bar chart -> phone -> neural network -> coffee cup -> calendar -> galaxy -> knot */
(function () {
  var canvas = document.getElementById('field');
  if (!window.THREE || !canvas) return;
  var T = window.THREE;
  var reduce = matchMedia('(prefers-reduced-motion: reduce)').matches;
  var small = Math.min(innerWidth, innerHeight) < 760;
  var N = small ? 5200 : 11000;

  var renderer;
  try { renderer = new T.WebGLRenderer({ canvas: canvas, antialias: false, alpha: true, powerPreference: 'high-performance' }); }
  catch (e) { return; }
  var dpr = Math.min(window.devicePixelRatio || 1, 2);
  renderer.setPixelRatio(dpr);
  var scene = new T.Scene();
  var camera = new T.PerspectiveCamera(45, 1, 0.1, 100);
  var group = new T.Group(); scene.add(group);

  // seeded random so shapes are identical on every load
  var seed = 7;
  function rnd() { seed = (seed * 16807) % 2147483647; return (seed - 1) / 2147483646; }
  function gauss() { return (rnd() + rnd() + rnd() - 1.5) * 0.9; }

  // the hero shape: a word, sampled from text drawn on a hidden canvas
  function word(text) {
    var c = document.createElement('canvas'), W = 900, H = 220; c.width = W; c.height = H;
    var x = c.getContext('2d'); x.fillStyle = '#fff'; x.textAlign = 'center'; x.textBaseline = 'middle';
    x.font = '900 190px "Arial Black", "Helvetica Neue", Arial, sans-serif';
    var tw = x.measureText(text).width, sc = Math.min(1, (W - 20) / tw); x.setTransform(sc, 0, 0, 1, W / 2, H / 2 + 8); x.fillText(text, 0, 0);
    var d = x.getImageData(0, 0, W, H).data, cells = [];
    for (var py = 0; py < H; py += 2) for (var px = 0; px < W; px += 2) if (d[(py * W + px) * 4 + 3] > 128) cells.push(px, py);
    var a = new Float32Array(N * 3), n = cells.length / 2;
    for (var i = 0; i < N; i++) {
      var k = Math.floor(rnd() * n) * 2;
      a[i * 3] = ((cells[k] + rnd() * 2) / W - 0.5) * 3.2; a[i * 3 + 1] = -((cells[k + 1] + rnd() * 2) / H - 0.5) * 3.2 * H / W; a[i * 3 + 2] = (rnd() - 0.5) * 0.16;
    }
    return n ? a : null;
  }
  function sphere() {
    var a = new Float32Array(N * 3), g = Math.PI * (3 - Math.sqrt(5));
    for (var i = 0; i < N; i++) {
      var y = 1 - (i / (N - 1)) * 2, rad = Math.sqrt(1 - y * y), th = g * i;
      a[i * 3] = Math.cos(th) * rad * 1.3; a[i * 3 + 1] = y * 1.3; a[i * 3 + 2] = Math.sin(th) * rad * 1.3;
    }
    return a;
  }
  function bars() {
    var a = new Float32Array(N * 3), hs = [0.5, 0.85, 0.65, 1.15, 0.95, 1.5, 1.95], tot = 0, w = 0.26, gap = 0.38;
    hs.forEach(function (h) { tot += h; });
    var i = 0;
    for (var b = 0; b < hs.length; b++) {
      var n = b === hs.length - 1 ? N - i : Math.round(N * hs[b] / tot), h = hs[b];
      var cx = (b - (hs.length - 1) / 2) * gap;
      for (var k = 0; k < n && i < N; k++, i++) {
        var f = rnd(), x = (rnd() - 0.5) * w, y = rnd() * h, z = (rnd() - 0.5) * w;
        if (f < 0.2) y = h; else if (f < 0.6) x = (rnd() < 0.5 ? -1 : 1) * w / 2; else z = (rnd() < 0.5 ? -1 : 1) * w / 2;
        a[i * 3] = cx + x; a[i * 3 + 1] = y - 1.0; a[i * 3 + 2] = z;
      }
    }
    return a;
  }
  function rrect(t, w, h, r) { // point on rounded-rect outline, t in 0..1
    var sw = w - 2 * r, sh = h - 2 * r, arc = Math.PI * r / 2, per = 2 * sw + 2 * sh + 4 * arc, d = t * per;
    var corners = [[sw / 2, sh / 2, 0], [-sw / 2, sh / 2, 1], [-sw / 2, -sh / 2, 2], [sw / 2, -sh / 2, 3]];
    // walk: top edge right->left? keep it simple, go counter-clockwise from the right edge
    var order = ['R', 'c0', 'T', 'c1', 'L', 'c2', 'B', 'c3'], lens = [sh, arc, sw, arc, sh, arc, sw, arc];
    for (var s = 0; s < 8; s++) {
      if (d <= lens[s]) {
        var u = d / lens[s];
        switch (order[s]) {
          case 'R': return [w / 2, -sh / 2 + u * sh];
          case 'T': return [sw / 2 - u * sw, h / 2];
          case 'L': return [-w / 2, sh / 2 - u * sh];
          case 'B': return [-sw / 2 + u * sw, -h / 2];
          default:
            var c = corners[+order[s][1]], ang = c[2] * Math.PI / 2 + u * Math.PI / 2;
            return [c[0] + Math.cos(ang) * r, c[1] + Math.sin(ang) * r];
        }
      }
      d -= lens[s];
    }
    return [w / 2, 0];
  }
  function phone() {
    var a = new Float32Array(N * 3), w = 1.3, h = 2.6, r = 0.26, dz = 0.08;
    // screen "cards": [y centre, height, x inset]
    var cards = [[0.86, 0.34, 0.14], [0.3, 0.5, 0.14], [-0.28, 0.3, 0.14], [-0.66, 0.3, 0.14], [-1.02, 0.14, 0.34]];
    for (var i = 0; i < N; i++) {
      var f = rnd(), x, y, z;
      if (f < 0.5) { var p = rrect(rnd(), w, h, r); x = p[0]; y = p[1]; z = (rnd() < 0.5 ? -1 : 1) * dz * (0.4 + rnd() * 0.6); }
      else if (f < 0.6) { var q = rrect(rnd(), w, h, r); x = q[0]; y = q[1]; z = (rnd() - 0.5) * 2 * dz; }
      else {
        var c = cards[Math.floor(rnd() * cards.length)], cw = w - 2 * c[2], q2 = rrect(rnd(), cw, c[1], Math.min(0.07, c[1] / 2.2));
        x = q2[0]; y = q2[1] + c[0]; z = dz;
        if (rnd() < 0.35) { x = (rnd() - 0.5) * cw; y = c[0] + (rnd() - 0.5) * c[1]; }
      }
      a[i * 3] = x; a[i * 3 + 1] = y; a[i * 3 + 2] = z;
    }
    return a;
  }
  function net() {
    var a = new Float32Array(N * 3), counts = [3, 5, 5, 2], nodes = [];
    counts.forEach(function (n, l) {
      var col = [];
      for (var k = 0; k < n; k++) col.push([(l - 1.5) * 0.95, (k - (n - 1) / 2) * 0.56, (l % 2 ? 0.18 : -0.18)]);
      nodes.push(col);
    });
    for (var i = 0; i < N; i++) {
      var x, y, z;
      if (rnd() < 0.34) {
        var l = Math.floor(rnd() * 4), nd = nodes[l][Math.floor(rnd() * nodes[l].length)];
        var u = rnd() * 2 - 1, th = rnd() * 6.283, s = Math.sqrt(1 - u * u), rr = 0.115;
        x = nd[0] + s * Math.cos(th) * rr; y = nd[1] + s * Math.sin(th) * rr; z = nd[2] + u * rr;
      } else {
        var l2 = Math.floor(rnd() * 3), p = nodes[l2][Math.floor(rnd() * nodes[l2].length)], q = nodes[l2 + 1][Math.floor(rnd() * nodes[l2 + 1].length)], t = rnd();
        x = p[0] + (q[0] - p[0]) * t + gauss() * 0.006; y = p[1] + (q[1] - p[1]) * t + gauss() * 0.006; z = p[2] + (q[2] - p[2]) * t;
      }
      a[i * 3] = x; a[i * 3 + 1] = y; a[i * 3 + 2] = z;
    }
    return a;
  }
  function cup() {
    var a = new Float32Array(N * 3);
    for (var i = 0; i < N; i++) {
      var f = rnd(), th = rnd() * 6.283, x, y, z;
      if (f < 0.5) { var t = rnd(), r = 0.52 + t * 0.24; x = Math.cos(th) * r; z = Math.sin(th) * r; y = -0.55 + t * 1.15; }           // body
      else if (f < 0.62) { var r2 = Math.sqrt(rnd()) * 0.74; x = Math.cos(th) * r2; z = Math.sin(th) * r2; y = 0.52; }                 // coffee surface
      else if (f < 0.76) { var ph = (rnd() - 0.5) * Math.PI; x = 0.74 + Math.cos(ph) * 0.34; y = 0.05 + Math.sin(ph) * 0.38; z = (rnd() - 0.5) * 0.1; } // handle
      else if (f < 0.92) { var r3 = 0.7 + rnd() * 0.55; x = Math.cos(th) * r3; z = Math.sin(th) * r3; y = -0.62 - (r3 - 0.7) * 0.1; }  // saucer
      else { var s = rnd(), k = i % 3 - 1; x = k * 0.3 + Math.sin(s * 6 + k) * 0.09; y = 0.7 + s * 0.8; z = Math.cos(s * 5) * 0.06; } // steam
      a[i * 3] = x; a[i * 3 + 1] = y - 0.15; a[i * 3 + 2] = z;
    }
    return a;
  }
  function calendar() {
    var a = new Float32Array(N * 3), w = 2.1, hgt = 2.0;
    for (var i = 0; i < N; i++) {
      var f = rnd(), x, y, z = (rnd() - 0.5) * 0.08;
      if (f < 0.3) { var p = rrect(rnd(), w, hgt, 0.2); x = p[0]; y = p[1]; }
      else if (f < 0.42) { x = (rnd() - 0.5) * (w - 0.2); y = hgt / 2 - 0.42 + (rnd() - 0.5) * 0.03; }
      else if (f < 0.5) { var side = rnd() < 0.5 ? -0.5 : 0.5, th = rnd() * 6.283; x = side + Math.cos(th) * 0.03; y = hgt / 2 + Math.sin(th) * 0.16; z = Math.cos(th) * 0.1; }
      else { var col = Math.floor(rnd() * 5), row = Math.floor(rnd() * 4), pick = col === 3 && row === 1, q = rrect(rnd(), 0.26, 0.24, 0.06); x = (col - 2) * 0.38 + q[0] * (pick ? 1 : 0.8) + (pick ? (rnd() - 0.5) * 0.2 : 0); y = 0.3 - row * 0.36 + q[1] * (pick ? 1 : 0.8) + (pick ? (rnd() - 0.5) * 0.18 : 0); }
      a[i * 3] = x; a[i * 3 + 1] = y; a[i * 3 + 2] = z;
    }
    return a;
  }
  function galaxy() {
    var a = new Float32Array(N * 3);
    for (var i = 0; i < N; i++) {
      var r = Math.pow(rnd(), 0.6) * 2.6 + 0.05, arm = (i % 3) * 2.094, th = arm + r * 1.5 + gauss() * 0.35;
      a[i * 3] = Math.cos(th) * r; a[i * 3 + 1] = gauss() * 0.14 * (1.3 - r / 2.8); a[i * 3 + 2] = Math.sin(th) * r;
    }
    return a;
  }
  function knot() {
    var a = new Float32Array(N * 3);
    for (var i = 0; i < N; i++) {
      var t = (i / N) * Math.PI * 2, p = 2, q = 3, r = 0.95 + 0.4 * Math.cos(q * t);
      a[i * 3] = r * Math.cos(p * t) + gauss() * 0.08;
      a[i * 3 + 1] = r * Math.sin(p * t) + gauss() * 0.08;
      a[i * 3 + 2] = -0.45 * Math.sin(q * t) + gauss() * 0.08;
    }
    return a;
  }

  var shapes = [word('MARVEL') || sphere(), bars(), phone(), net(), cup(), calendar(), galaxy(), knot()];
  // per shape: x offset (wide screens), y offset, scale, tilt x, how much it sways
  var pose = [
    { x: 0, y: 1.0, s: 1.55, py: 1.55, ps: 0.82, tx: 0.0, sway: 0.22 },
    { x: 0.25, y: 0.1, s: 1.0, py: 0.4, ps: 0.9, tx: 0.22, sway: 0.55 },
    { x: -0.25, y: 0.1, s: 0.95, py: 0.4, ps: 0.9, tx: 0.08, sway: 0.7 },
    { x: 0.25, y: 0.2, s: 1.05, py: 0.4, ps: 0.9, tx: 0.1, sway: 0.5 },
    { x: -0.25, y: 0.1, s: 1.0, py: 0.4, ps: 0.9, tx: 0.3, sway: 0.8 },
    { x: 0.25, y: 0.1, s: 0.95, py: 0.4, ps: 0.85, tx: 0.06, sway: 0.45 },
    { x: 0, y: -0.2, s: 1.15, py: 0, ps: 1.0, tx: 1.0, sway: 1.0 },
    { x: 0, y: 0.1, s: 1.1, py: 0.2, ps: 1.0, tx: 0.2, sway: 1.0 }
  ];
  var pos = new Float32Array(N * 3), dir = new Float32Array(N * 3), seeds = new Float32Array(N);
  for (var i = 0; i < N; i++) {
    var u = Math.random() * 2 - 1, th = Math.random() * 6.283, s = Math.sqrt(1 - u * u), m = 0.5 + Math.random() * 1.3;
    dir[i * 3] = s * Math.cos(th) * m; dir[i * 3 + 1] = u * m; dir[i * 3 + 2] = s * Math.sin(th) * m;
    seeds[i] = Math.random();
  }
  pos.set(shapes[0]);
  var geo = new T.BufferGeometry();
  geo.setAttribute('position', new T.BufferAttribute(pos, 3));
  geo.setAttribute('aSeed', new T.BufferAttribute(seeds, 1));
  var mat = new T.ShaderMaterial({
    transparent: true, depthWrite: false, blending: T.AdditiveBlending,
    uniforms: { uTime: { value: 0 }, uSize: { value: 15 * dpr }, uOpacity: { value: 1 } },
    vertexShader: 'attribute float aSeed; uniform float uTime, uSize; varying float vSeed;' +
      'void main(){ vSeed=aSeed; vec4 mv=modelViewMatrix*vec4(position,1.0);' +
      'gl_PointSize=uSize*(0.75+0.55*sin(uTime*1.4+aSeed*40.0))*(1.0/-mv.z)*(0.6+aSeed*0.8); gl_Position=projectionMatrix*mv; }',
    fragmentShader: 'precision mediump float; uniform float uOpacity; varying float vSeed;' +
      'void main(){ float d=length(gl_PointCoord-0.5); float a=smoothstep(0.5,0.05,d);' +
      'vec3 c=mix(vec3(0.93,0.94,0.97), vec3(1.0,0.84,0.04), step(0.8,vSeed));' +
      'gl_FragColor=vec4(c, a*uOpacity*0.8); }'
  });
  var points = new T.Points(geo, mat);
  points.frustumCulled = false;
  group.add(points);

  var portrait = false;
  function resize() {
    var w = canvas.clientWidth, h = canvas.clientHeight;
    renderer.setSize(w, h, false);
    camera.aspect = w / h; portrait = w / h < 0.9;
    camera.position.z = portrait ? 7.4 : 5.6;
    camera.updateProjectionMatrix();
    measure();
  }
  // anchors: every section that names a shape
  var anchors = [];
  function measure() {
    anchors = [].map.call(document.querySelectorAll('[data-shape]'), function (el) {
      var r = el.getBoundingClientRect();
      return { y: r.top + scrollY + r.height / 2, shape: +el.dataset.shape, dim: +el.dataset.dim };
    });
  }
  function sample() {
    var c = scrollY + innerHeight / 2, a = anchors;
    if (!a.length) return { shape: 0, dim: 1 };
    if (c <= a[0].y) return { shape: a[0].shape, dim: a[0].dim };
    for (var k = 0; k < a.length - 1; k++) {
      if (c <= a[k + 1].y) {
        var p = (c - a[k].y) / (a[k + 1].y - a[k].y);
        var e = Math.min(1, Math.max(0, (p - 0.35) / 0.6)); // hold the shape, then re-form as the next chapter arrives
        return { shape: a[k].shape + (a[k + 1].shape - a[k].shape) * e, dim: a[k].dim + (a[k + 1].dim - a[k].dim) * p };
      }
    }
    return { shape: a[a.length - 1].shape, dim: a[a.length - 1].dim };
  }

  var cur = 0, dim = 1, px = 0, py = 0, tx = 0, ty = 0, act = 0, lastMove = -1e9, ray = new T.Vector3(), hit = new T.Vector3(), paused = false;
  addEventListener('pointermove', function (e) { tx = e.clientX / innerWidth - 0.5; ty = e.clientY / innerHeight - 0.5; lastMove = performance.now(); }, { passive: true });
  addEventListener('resize', resize);
  addEventListener('load', measure);
  setTimeout(measure, 1200);

  function lerp(a, b, t) { return a + (b - a) * t; }
  var last = performance.now(), time = 0, visible = true;
  document.addEventListener('visibilitychange', function () { visible = !document.hidden; last = performance.now(); if (visible) requestAnimationFrame(frame); });

  function frame(now) {
    if (!visible || paused) return;
    var dt = Math.min(0.05, (now - last) / 1000); last = now; time += dt;
    var t = sample();
    var k = 1 - Math.exp(-dt * 5);
    cur = lerp(cur, t.shape, k); dim = lerp(dim, t.dim, k);
    px = lerp(px, tx, k * 0.6); py = lerp(py, ty, k * 0.6);

    var i0 = Math.max(0, Math.min(shapes.length - 1, Math.floor(cur))), i1 = Math.min(shapes.length - 1, i0 + 1), f = cur - i0;
    var e = f < 0.5 ? 4 * f * f * f : 1 - Math.pow(-2 * f + 2, 3) / 2;
    var burst = reduce ? 0 : Math.sin(Math.PI * f) * 0.75;
    var A = shapes[i0], B = shapes[i1];
    for (var i = 0; i < N * 3; i++) pos[i] = A[i] + (B[i] - A[i]) * e + dir[i] * burst;
    // particles scatter away from the pointer
    act += ((performance.now() - lastMove < 1600 ? 1 : 0) - act) * k;
    if (act > 0.02 && !reduce) {
      ray.set((tx + 0.5) * 2 - 1, -((ty + 0.5) * 2 - 1), 0.5).unproject(camera).sub(camera.position).normalize();
      hit.copy(camera.position).addScaledVector(ray, -camera.position.z / ray.z);
      group.updateMatrixWorld(); group.worldToLocal(hit);
      var R = 0.5, R2 = R * R;
      for (var j = 0; j < N; j++) {
        var dx = pos[j * 3] - hit.x, dy = pos[j * 3 + 1] - hit.y, d2 = dx * dx + dy * dy;
        if (d2 < R2) { var dd = Math.sqrt(d2) + 0.0001, f2 = (1 - dd / R) * 0.42 * act; pos[j * 3] += dx / dd * f2; pos[j * 3 + 1] += dy / dd * f2; pos[j * 3 + 2] += (seeds[j] - 0.5) * f2; }
      }
    }
    geo.attributes.position.needsUpdate = true;

    var pa = pose[i0], pb = pose[i1];
    group.position.x = portrait ? 0 : lerp(pa.x, pb.x, e);
    group.position.y = portrait ? lerp(pa.py, pb.py, e) : lerp(pa.y, pb.y, e);
    var sc = portrait ? lerp(pa.ps, pb.ps, e) : lerp(pa.s, pb.s, e) * Math.min(1, camera.aspect / 1.5);
    group.scale.set(sc, sc, sc);
    var sway = lerp(pa.sway, pb.sway, e);
    group.rotation.y = (reduce ? 0 : Math.sin(time * 0.35) * 0.75 * sway + time * 0.06 * (sway > 0.9 ? 1 : 0)) + px * 0.35 + burst * 1.2;
    group.rotation.x = lerp(pa.tx, pb.tx, e) + py * 0.2;

    mat.uniforms.uTime.value = time;
    mat.uniforms.uOpacity.value = dim * (portrait && cur > 0.5 && cur < 5.6 ? 0.6 : 1);
    renderer.render(scene, camera);
    requestAnimationFrame(frame);
  }
  resize();
  requestAnimationFrame(frame);
  window.Field = { pause: function (b) { if (paused === b) return; paused = b; last = performance.now(); if (!b) { resize(); requestAnimationFrame(frame); } } };
})();
