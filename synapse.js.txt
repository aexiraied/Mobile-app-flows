/* Synapse: a neural network you can watch learn.
   Screens: splash, intro, train, network, learn.
   The network, backpropagation and the Adam optimizer are written by hand below. No AI library. */
(function () {
  // ---------- the network ----------
  function createNet(sizes, seed) {
    var s = seed || 11, W = [], B = [];
    function r() { s = (s * 16807) % 2147483647; return (s - 1) / 2147483646; }
    for (var l = 0; l < sizes.length - 1; l++) {
      var fin = sizes[l], fout = sizes[l + 1], w = new Float32Array(fin * fout), lim = Math.sqrt(6 / (fin + fout));
      for (var i = 0; i < w.length; i++) w[i] = (r() * 2 - 1) * lim;
      W.push(w); B.push(new Float32Array(fout));
    }
    function zeros(a) { return a.map(function (x) { return new Float32Array(x.length); }); }
    return { sizes: sizes, W: W, B: B, acts: sizes.map(function (k) { return new Float32Array(k); }), step: 0, epoch: 0, mW: zeros(W), vW: zeros(W), mB: zeros(B), vB: zeros(B) };
  }
  function forward(net, x, y) {
    var a = net.acts, S = net.sizes; a[0][0] = x; a[0][1] = y;
    for (var l = 0; l < net.W.length; l++) {
      var fin = S[l], fout = S[l + 1], w = net.W[l], b = net.B[l], inp = a[l], out = a[l + 1], last = l === net.W.length - 1;
      for (var j = 0; j < fout; j++) { var z = b[j]; for (var i = 0; i < fin; i++) z += w[j * fin + i] * inp[i]; out[j] = last ? 1 / (1 + Math.exp(-z)) : Math.tanh(z); }
    }
    return a[a.length - 1][0];
  }
  // one pass over every point: backpropagation, then an Adam update
  function train(net, pts, lr) {
    var S = net.sizes, Ln = net.W.length, gW = net.W.map(function (w) { return new Float32Array(w.length); }), gB = net.B.map(function (b) { return new Float32Array(b.length); });
    var loss = 0, right = 0, n = pts.length, deltas = S.map(function (k) { return new Float32Array(k); });
    for (var p = 0; p < n; p++) {
      var pt = pts[p], out = forward(net, pt.x, pt.y), t = pt.c;
      loss += -(t * Math.log(out + 1e-7) + (1 - t) * Math.log(1 - out + 1e-7));
      if ((out > 0.5) === (t === 1)) right++;
      deltas[Ln][0] = out - t;
      for (var l = Ln - 1; l >= 0; l--) {
        var fin = S[l], fout = S[l + 1], w = net.W[l], d = deltas[l + 1], inp = net.acts[l], dprev = deltas[l];
        if (l > 0) dprev.fill(0);
        for (var j = 0; j < fout; j++) { var dj = d[j]; gB[l][j] += dj; for (var i = 0; i < fin; i++) { gW[l][j * fin + i] += dj * inp[i]; if (l > 0) dprev[i] += dj * w[j * fin + i]; } }
        if (l > 0) for (var i2 = 0; i2 < fin; i2++) dprev[i2] *= 1 - inp[i2] * inp[i2];
      }
    }
    net.step++; net.epoch++;
    var b1 = 0.9, b2 = 0.999, c1 = 1 - Math.pow(b1, net.step), c2 = 1 - Math.pow(b2, net.step);
    function adam(P, G, M, V) { for (var k = 0; k < P.length; k++) { var g = G[k] / n; M[k] = b1 * M[k] + (1 - b1) * g; V[k] = b2 * V[k] + (1 - b2) * g * g; P[k] -= lr * (M[k] / c1) / (Math.sqrt(V[k] / c2) + 1e-8); } }
    for (var q = 0; q < Ln; q++) { adam(net.W[q], gW[q], net.mW[q], net.vW[q]); adam(net.B[q], gB[q], net.mB[q], net.vB[q]); }
    return { loss: loss / n, acc: right / n };
  }
  function preset(name) {
    var s = 5, pts = [], i, a, rad;
    function r() { s = (s * 16807) % 2147483647; return (s - 1) / 2147483646; }
    if (name === 'rings') {
      for (i = 0; i < 40; i++) { a = r() * 6.283; rad = Math.sqrt(r()) * 0.34; pts.push({ x: Math.cos(a) * rad, y: Math.sin(a) * rad, c: 1 }); }
      for (i = 0; i < 64; i++) { a = r() * 6.283; rad = 0.66 + r() * 0.26; pts.push({ x: Math.cos(a) * rad, y: Math.sin(a) * rad, c: 0 }); }
    } else if (name === 'spiral') {
      for (i = 0; i < 64; i++) for (var c = 0; c < 2; c++) { var t = i / 63; rad = 0.1 + t * 0.85; a = t * 2.6 * Math.PI * 0.62 * 2 + c * Math.PI; pts.push({ x: Math.cos(a) * rad + (r() - 0.5) * 0.05, y: Math.sin(a) * rad + (r() - 0.5) * 0.05, c: c }); }
    } else if (name === 'corners') {
      for (i = 0; i < 26; i++) [[0.55, 0.55, 1], [-0.55, -0.55, 1], [-0.55, 0.55, 0], [0.55, -0.55, 0]].forEach(function (q) { pts.push({ x: q[0] + (r() - 0.5) * 0.6, y: q[1] + (r() - 0.5) * 0.6, c: q[2] }); });
    }
    return pts;
  }
  if (typeof module !== 'undefined') { module.exports = { createNet: createNet, forward: forward, train: train, preset: preset }; return; }

  // ---------- the app ----------
  var K = window.Kit, h = K.h, AMBER = [255, 214, 10], COOL = [100, 210, 255], VIEW = 1.12, G = 46;
  function sizes(S) { return [2, S.hidden, S.hidden, 1]; }
  function rebuild(S, name) { if (name) S.preset = name; S.pts = preset(S.preset); S.net = createNet(sizes(S), ++S.seed); S.stats = { loss: 0, acc: 0 }; S.running = true; }
  function fit(c) { var w = c.clientWidth, hh = c.clientHeight, d = Math.min(devicePixelRatio || 1, 2); if (w) { c.width = Math.round(w * d); c.height = Math.round(hh * d); } }
  function drawNet(c, net) {
    var x = c.getContext('2d'), w = c.width, hh = c.height, d = w / (c.clientWidth || 1), S = net.sizes, px = 18 * d, py = 14 * d; x.clearRect(0, 0, w, hh);
    function pos(l, i) { var n = S[l], span = (hh - 2 * py) * (n < 3 ? 0.28 : 1); return [px + l / (S.length - 1) * (w - 2 * px), n === 1 ? hh / 2 : hh / 2 - span / 2 + i / (n - 1) * span]; }
    for (var l = 0; l < net.W.length; l++) {
      var fin = S[l], fout = S[l + 1], W = net.W[l], mx = 0.001; for (var k = 0; k < W.length; k++) mx = Math.max(mx, Math.abs(W[k]));
      for (var j = 0; j < fout; j++) for (var i = 0; i < fin; i++) {
        var v = W[j * fin + i], s = Math.abs(v) / mx; if (s < 0.1) continue; var a = pos(l, i), b = pos(l + 1, j);
        x.strokeStyle = 'rgba(' + (v > 0 ? AMBER : COOL).join(',') + ',' + (s * 0.75) + ')'; x.lineWidth = (0.4 + s * 2.6) * d; x.beginPath(); x.moveTo(a[0], a[1]); x.lineTo(b[0], b[1]); x.stroke();
      }
    }
    for (var L = 0; L < S.length; L++) for (var m = 0; m < S[L]; m++) { var c2 = pos(L, m); x.beginPath(); x.arc(c2[0], c2[1], 4.5 * d, 0, 6.3); x.fillStyle = '#F5F5F7'; x.fill(); x.lineWidth = 2 * d; x.strokeStyle = '#0d0a14'; x.stroke(); }
  }
  // keeps training while a screen is open, then calls that screen's draw
  function loop(app, draw) {
    var S = app.state, raf;
    (function f() {
      if (S.running && S.pts.length) for (var i = 0, n = S.speed; i < n; i++) S.stats = train(S.net, S.pts, S.lr);
      draw(); raf = requestAnimationFrame(f);
    })();
    app.onLeave(function () { cancelAnimationFrame(raf); });
  }

  var screens = {
    splash: function (app) {
      app.later(function () { app.go('intro', null, 'fade', true); }, 2000);
      return h('div', { class: 'k-center sy-splash' }, h('svg', { class: 'sy-logo', viewBox: '0 0 120 80', html:
        '<g stroke="#BF5AF2" stroke-width="2.500" stroke-linecap="round"><path d="M20 20L60 12M20 20L60 40M20 60L60 40M20 60L60 68M60 12L100 40M60 40L100 40M60 68L100 40"/></g>' +
        '<g fill="#F5F5F7"><circle cx="20" cy="20" r="7"/><circle cx="20" cy="60" r="7"/><circle cx="60" cy="12" r="7"/><circle cx="60" cy="40" r="7"/><circle cx="60" cy="68" r="7"/><circle cx="100" cy="40" r="9"/></g>' }),
        h('h1', { class: 'sy-word', text: 'synapse' }), h('p', { class: 'k-sub k-pop', style: { '--d': 9 }, text: 'Watch a machine learn' }));
    },
    intro: function (app) {
      var pages = [['It starts knowing nothing.', 'A new network guesses at random. Its picture of the world is a blur.'], ['It guesses, checks, adjusts.', 'Each round it measures how wrong it was and nudges every connection to be a little less wrong.'], ['You are the teacher.', 'Drop circles and crosses anywhere. The network redraws its map around your examples.']];
      var i = 0, title = h('h1', { class: 'k-large' }), text = h('p', { class: 'k-sub sy-intro-p' }), dots = h('div', { class: 'sy-dots' }, pages.map(function () { return h('i'); })), art = h('div', { class: 'sy-art' }, h('i'), h('i'), h('i'));
      var next = h('button', { class: 'k-btn', onclick: function () { if (i < pages.length - 1) { i++; paint(); } else done(); } });
      function done() { app.go('train', null, 'fade', true); }
      function paint() {
        title.textContent = pages[i][0]; text.textContent = pages[i][1]; next.textContent = i === pages.length - 1 ? 'Start Training' : 'Next';
        [title, text].forEach(function (el) { el.classList.remove('k-pop'); void el.offsetWidth; el.classList.add('k-pop'); });
        [].forEach.call(dots.children, function (d, k) { d.className = k === i ? 'on' : ''; }); art.setAttribute('data-step', i);
      }
      paint();
      return h('div', { class: 'k-pad' }, h('div', { class: 'k-center' }, art, title, text, dots), next, h('button', { class: 'k-btn text', onclick: done }, 'Skip'));
    },
    train: function (app) {
      var S = app.state, field = h('canvas', { class: 'sy-field', role: 'img', 'aria-label': 'Training area. Tap to add a point or ask the network.' }), fx = field.getContext('2d');
      var off = document.createElement('canvas'); off.width = off.height = G; var ox = off.getContext('2d'), img = ox.createImageData(G, G);
      var eEl = h('b'), lEl = h('b'), aEl = h('b'), bubble = h('div', { class: 'sy-bubble', hidden: true }), probe = null;
      var runBtn = h('button', { class: 'k-btn', onclick: function () { S.running = !S.running; runBtn.textContent = S.running ? 'Pause' : 'Train'; } }, S.running ? 'Pause' : 'Train');
      function cross(x, y, r) { fx.beginPath(); fx.moveTo(x - r, y - r); fx.lineTo(x + r, y + r); fx.moveTo(x + r, y - r); fx.lineTo(x - r, y + r); fx.stroke(); }
      function draw() {
        var net = S.net;
        for (var gy = 0; gy < G; gy++) for (var gx = 0; gx < G; gx++) {
          var o = forward(net, (gx / (G - 1) * 2 - 1) * VIEW, -(gy / (G - 1) * 2 - 1) * VIEW), k = Math.abs(o - 0.5) * 2, col = o > 0.5 ? AMBER : COOL, q = (gy * G + gx) * 4, m = 0.08 + k * 0.5;
          img.data[q] = col[0] * m; img.data[q + 1] = col[1] * m; img.data[q + 2] = col[2] * m; img.data[q + 3] = 255;
        }
        ox.putImageData(img, 0, 0);
        var w = field.width, hh = field.height, d = w / (field.clientWidth || 1); fx.imageSmoothingEnabled = true; fx.imageSmoothingQuality = 'high'; fx.drawImage(off, 0, 0, w, hh);
        for (var i = 0; i < S.pts.length; i++) {
          var p = S.pts[i], px = (p.x / VIEW + 1) / 2 * w, py = (1 - (p.y / VIEW + 1) / 2) * hh, r = 4.2 * d;
          if (p.c === 1) { fx.beginPath(); fx.arc(px, py, r, 0, 6.3); fx.fillStyle = 'rgb(255,214,10)'; fx.fill(); fx.lineWidth = 1.5 * d; fx.strokeStyle = '#000'; fx.stroke(); }
          else { fx.lineCap = 'round'; fx.strokeStyle = '#000'; fx.lineWidth = 4.5 * d; cross(px, py, r); fx.strokeStyle = 'rgb(100,210,255)'; fx.lineWidth = 2.2 * d; cross(px, py, r); }
        }
        if (probe) { var o2 = forward(net, probe.x, probe.y), sure = Math.round(Math.max(o2, 1 - o2) * 100); bubble.textContent = sure + '% sure: ' + (o2 > 0.5 ? 'Circle' : 'Cross'); }
        eEl.textContent = net.epoch; lEl.textContent = S.stats.loss.toFixed(3); aEl.textContent = Math.round(S.stats.acc * 100) + '%';
      }
      field.addEventListener('click', function (e) {
        var r = field.getBoundingClientRect(), x = ((e.clientX - r.left) / r.width * 2 - 1) * VIEW, y = -((e.clientY - r.top) / r.height * 2 - 1) * VIEW;
        if (S.mode === 'ask') { probe = { x: x, y: y }; bubble.hidden = false; bubble.style.left = (e.clientX - r.left) / r.width * 100 + '%'; bubble.style.top = (e.clientY - r.top) / r.height * 100 + '%'; bubble.classList.remove('k-pop'); void bubble.offsetWidth; bubble.classList.add('k-pop'); }
        else S.pts.push({ x: x, y: y, c: S.mode === 'circle' ? 1 : 0 });
      });
      app.later(function () { fit(field); loop(app, draw); }, 30);
      return h('div', { class: 'k-scroll' }, h('h1', { class: 'k-large', text: 'Train' }),
        K.seg([{ id: 'spiral', label: 'Spiral' }, { id: 'rings', label: 'Rings' }, { id: 'corners', label: 'Corners' }, { id: 'empty', label: 'Blank' }], S.preset, function (v) { rebuild(S, v); probe = null; bubble.hidden = true; runBtn.textContent = 'Pause'; }, 'Pattern'),
        h('div', { class: 'sy-stage' }, field, bubble),
        h('div', { class: 'sy-stats' }, h('p', null, h('span', { class: 'k-sub', text: 'Round' }), eEl), h('p', null, h('span', { class: 'k-sub', text: 'Error' }), lEl), h('p', null, h('span', { class: 'k-sub', text: 'Correct' }), aEl)),
        h('p', { class: 'k-h', text: 'Tap the square to' }),
        K.seg([{ id: 'circle', label: 'Add Circle' }, { id: 'cross', label: 'Add Cross' }, { id: 'ask', label: 'Ask It' }], S.mode, function (v) { S.mode = v; if (v !== 'ask') { probe = null; bubble.hidden = true; } }, 'Tap action'),
        h('div', { class: 'sy-btns' }, h('button', { class: 'k-btn plain', onclick: function () { rebuild(S); probe = null; bubble.hidden = true; runBtn.textContent = 'Pause'; } }, 'Start Over'), runBtn));
    },
    network: function (app) {
      var S = app.state, c = h('canvas', { class: 'sy-net' }), count = h('span', { class: 'end' }), shape = h('span', { class: 'end' }), round = h('span', { class: 'end' });
      function info() { var z = sizes(S), n = 0; for (var i = 0; i < z.length - 1; i++) n += z[i] * z[i + 1] + z[i + 1]; count.textContent = n; shape.textContent = z.join(' → '); }
      info();
      app.later(function () { fit(c); loop(app, function () { drawNet(c, S.net); round.textContent = S.net.epoch; }); }, 30);
      return h('div', { class: 'k-scroll' }, h('h1', { class: 'k-large', text: 'Network' }),
        h('div', { class: 'k-card' }, c, h('p', { class: 'k-sub', text: 'Each line is a connection. Thicker lines matter more. Yellow pushes toward Circle, blue toward Cross.' })),
        h('p', { class: 'k-h', text: 'Neurons per hidden layer' }), K.seg([4, 8, 12, 16].map(function (n) { return { id: n, label: String(n) }; }), S.hidden, function (v) { S.hidden = v; rebuild(S); info(); app.toast('New network: ' + v + ' neurons per layer'); }, 'Neurons'),
        h('p', { class: 'k-h', text: 'Learning speed' }), K.seg([{ id: 0.005, label: 'Careful' }, { id: 0.02, label: 'Normal' }, { id: 0.06, label: 'Bold' }], S.lr, function (v) { S.lr = v; }, 'Learning speed'),
        h('ul', { class: 'k-list' }, h('li', null, h('div', { class: 'k-row' }, h('span', { class: 'grow', text: 'Layers' }), shape)), h('li', null, h('div', { class: 'k-row' }, h('span', { class: 'grow', text: 'Adjustable numbers' }), count)), h('li', null, h('div', { class: 'k-row' }, h('span', { class: 'grow', text: 'Rounds trained' }), round))));
    },
    learn: function () {
      var steps = [['Examples', 'You give it points with the right answer attached: this spot is a circle, that spot is a cross.'], ['A guess', 'Each point passes through the layers. Every connection multiplies it by a number, and out comes a guess between 0 and 1.'],
        ['The error', 'The guess is compared with the right answer. One number, the error, says how wrong the network is overall.'], ['The nudge', 'Working backwards from the error, every connection is nudged in the direction that would have made the guess better. This is backpropagation.'],
        ['Repeat', 'Do that hundreds of times and the blur sharpens into a map. Nobody wrote the rule for a spiral. The network found it.']];
      return h('div', { class: 'k-scroll' }, h('h1', { class: 'k-large', text: 'How It Learns' }), h('p', { class: 'k-sub', text: 'Five steps, repeated every round.' }),
        steps.map(function (s, i) { return h('div', { class: 'k-card sy-step k-pop', style: { '--d': i } }, h('span', { class: 'sy-num', text: i + 1 }), h('div', null, h('h3', { text: s[0] }), h('p', { class: 'k-sub', text: s[1] }))); }),
        h('p', { class: 'k-sub', style: { 'text-align': 'center' }, text: 'Synapse is a portfolio project by Marvel Ogbeide. The network runs entirely on this device.' }));
    }
  };

  window.SynapseApp = {
    name: 'Synapse',
    mount: function (root, opts) {
      var S = { hidden: 12, lr: 0.02, speed: 3, seed: 11, mode: 'circle', preset: 'spiral' }; rebuild(S);
      return K.App(root, { theme: 'synapse', first: opts && opts.preview ? 'train' : 'splash', screens: screens, state: S, tabs: [{ id: 'train', label: 'Train', icon: 'play' }, { id: 'network', label: 'Network', icon: 'net' }, { id: 'learn', label: 'Learn', icon: 'book' }] });
    }
  };
})();
