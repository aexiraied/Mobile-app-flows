/* Waka: a package delivery app for Lagos.
   Screens: splash, sign in, code, home map, new delivery, live tracking, rate rider, activity, account.
   The map is one SVG. Routes are computed between places on its road grid, and the rider follows the real path. */
(function () {
  var K = window.Kit, h = K.h, naira = K.naira;
  var PLACES = [
    { id: 'ikeja', name: 'Ikeja', x: 60, y: 90 }, { id: 'maryland', name: 'Maryland', x: 150, y: 90 },
    { id: 'yaba', name: 'Yaba', x: 150, y: 200 }, { id: 'ikoyi', name: 'Ikoyi', x: 240, y: 200 },
    { id: 'surulere', name: 'Surulere', x: 60, y: 300 }, { id: 'vi', name: 'Victoria Island', x: 150, y: 410 },
    { id: 'lekki', name: 'Lekki Phase 1', x: 240, y: 410 }
  ];
  var VEHICLES = [{ id: 'bike', name: 'Bike', mult: 1, pace: 1.2, note: 'Fastest in traffic' }, { id: 'car', name: 'Car', mult: 1.8, pace: 1.6, note: 'For fragile items' }, { id: 'van', name: 'Van', mult: 2.6, pace: 1.9, note: 'For bulky loads' }];
  var SIZES = [{ id: 'small', label: 'Small', mult: 1 }, { id: 'medium', label: 'Medium', mult: 1.15 }, { id: 'large', label: 'Large', mult: 1.35 }];
  var RIDERS = ['Tunde', 'Chinedu', 'Aisha', 'Emeka'];
  function place(id) { return PLACES.filter(function (p) { return p.id === id; })[0]; }
  function pick(list, id) { return list.filter(function (v) { return v.id === id; })[0]; }
  function km(a, b) { return Math.max(1, Math.round((Math.abs(a.x - b.x) + Math.abs(a.y - b.y)) * 0.045)); }
  function quote(o) {
    var a = place(o.from), b = place(o.to), d = km(a, b), v = pick(VEHICLES, o.vehicle), s = pick(SIZES, o.size);
    return { km: d, price: Math.round((600 + d * 130) * v.mult * s.mult / 50) * 50, mins: Math.max(4, Math.round(d * v.pace)) };
  }
  // roads run along the grid, so a route is one vertical leg and one horizontal leg
  function routeD(a, b) { return 'M' + a.x + ' ' + a.y + (a.y !== b.y ? ' V' + b.y : '') + (a.x !== b.x ? ' H' + b.x : ''); }
  function map(from, to) {
    var a = from && place(from), b = to && place(to), s = '<g class="wk-cam"><rect width="300" height="500" fill="#0c1016"/><rect y="336" width="300" height="40" fill="#0f2033"/>' +
      '<g stroke="#1b232e" stroke-width="11" stroke-linecap="round"><path d="M-10 90H310M-10 200H310M-10 300H310M-10 410H310M60 -10V510M150 -10V510M240 -10V510"/></g>' +
      '<g fill="#131920">' + [[75, 105], [165, 105], [75, 215], [165, 215], [255, 215], [-15, 215], [75, 425], [165, 425], [255, 105], [-15, 105]].map(function (p) { return '<rect x="' + p[0] + '" y="' + p[1] + '" width="60" height="' + (p[1] === 215 ? 70 : 80) + '" rx="7"/>'; }).join('') + '</g>';
    PLACES.forEach(function (p) {
      var on = (a && p.id === a.id) || (b && p.id === b.id);
      s += '<circle cx="' + p.x + '" cy="' + p.y + '" r="3.500" fill="' + (on ? '#F5F5F7' : '#4a5563') + '"/><text x="' + (p.x + 9) + '" y="' + (p.y - 9) + '" font-size="9.500" font-weight="600" fill="' + (on ? '#F5F5F7' : '#7b8696') + '" font-family="-apple-system,system-ui,sans-serif">' + p.name + '</text>';
    });
    if (a && b) {
      s += '<path d="' + routeD(a, b) + '" fill="none" stroke="#33404f" stroke-width="5" stroke-linecap="round" stroke-linejoin="round"/><path class="wk-route" d="' + routeD(a, b) + '" fill="none" stroke="#FFD60A" stroke-width="5" stroke-linecap="round" stroke-linejoin="round"/>' +
        '<circle cx="' + a.x + '" cy="' + a.y + '" r="9" fill="#F5F5F7"/><circle cx="' + a.x + '" cy="' + a.y + '" r="4" fill="#0c1016"/>' +
        '<rect x="' + (b.x - 9) + '" y="' + (b.y - 9) + '" width="18" height="18" rx="5" fill="#F5F5F7"/><rect x="' + (b.x - 4) + '" y="' + (b.y - 4) + '" width="8" height="8" rx="2" fill="#0c1016"/>' +
        '<g class="wk-rider" opacity="0"><circle r="16" fill="#FFD60A" opacity=".22"/><circle r="8" fill="#FFD60A" stroke="#000" stroke-width="2"/></g>';
    }
    return h('svg', { class: 'wk-map', viewBox: '0 0 300 500', preserveAspectRatio: 'xMidYMid slice', 'aria-hidden': 'true', html: s + '</g>' });
  }
  function placeSheet(app, title, exclude, onPick) {
    app.sheet(function (close) {
      return [h('h3', { class: 'wk-sheet-t', text: title }), h('ul', { class: 'k-list wk-inset' }, PLACES.filter(function (p) { return p.id !== exclude; }).map(function (p) {
        return h('li', null, h('button', { class: 'k-row', onclick: function () { onPick(p.id); close(); } }, h('span', { class: 'wk-pin' }, K.icon('map', 18)), h('span', { class: 'grow' }, h('b', { text: p.name }), h('span', { text: 'Lagos' }))));
      }))];
    });
  }
  function receipt(app, d) {
    app.sheet(function () {
      function row(a, b) { return h('li', null, h('div', { class: 'k-row' }, h('span', { class: 'grow', text: a }), h('span', { class: 'end', text: b }))); }
      return [h('h3', { class: 'wk-sheet-t', text: place(d.from).name + ' to ' + place(d.to).name }), h('p', { class: 'k-sub', text: d.when }),
        h('ul', { class: 'k-list wk-inset' }, row('Rider', d.rider), row('Vehicle', pick(VEHICLES, d.vehicle).name), row('Distance', d.km + ' km'), row('Tip', d.tip ? naira(d.tip) : 'None'), row('Total', naira(d.price + (d.tip || 0))))];
    });
  }

  var screens = {
    splash: function (app) {
      app.later(function () { app.go('signin', null, 'fade', true); }, 1900);
      return h('div', { class: 'k-center wk-splash' }, h('div', { class: 'wk-logo' }, h('i'), h('b')), h('h1', { class: 'wk-word', text: 'waka' }), h('p', { class: 'k-sub k-pop', style: { '--d': 9 }, text: 'Send anything across Lagos' }));
    },
    signin: function (app) {
      var S = app.state, input = h('input', { class: 'wk-phone', type: 'tel', inputmode: 'numeric', placeholder: '801 234 5678', 'aria-label': 'Phone number', maxlength: 11, oninput: function () { input.value = input.value.replace(/\D/g, ''); btn.disabled = input.value.length < 10; } });
      var btn = h('button', { class: 'k-btn', disabled: true, onclick: function () { S.phone = input.value.replace(/^0/, ''); app.go('code'); } }, 'Continue');
      return h('div', { class: 'k-pad' }, h('h1', { class: 'k-large k-pop', text: 'What is your number?' }), h('p', { class: 'k-sub k-pop', style: { '--d': 1 }, text: 'We will text you a code to sign in.' }),
        h('label', { class: 'wk-field k-pop', style: { '--d': 2 } }, h('span', { text: '+234' }), input), h('div', { style: { flex: 1 } }),
        h('button', { class: 'k-btn text', onclick: function () { input.value = '8012345678'; btn.disabled = false; } }, 'Use a Demo Number'), btn);
    },
    code: function (app) {
      var S = app.state, boxes = [0, 1, 2, 3].map(function () { return h('i'); }), status = h('p', { class: 'k-sub', text: 'Any four digits work in this demo.' });
      var input = h('input', { class: 'wk-code-input', type: 'tel', inputmode: 'numeric', maxlength: 4, autocomplete: 'one-time-code', 'aria-label': 'Four digit code', oninput: function () { fill(input.value.replace(/\D/g, '')); } });
      function fill(v) {
        input.value = v; boxes.forEach(function (b, i) { b.textContent = v[i] || ''; b.className = v[i] ? 'on' : i === v.length ? 'next' : ''; });
        if (v.length === 4) { status.textContent = 'Checking code'; input.disabled = true; app.later(function () { S.signedIn = true; app.go('home', null, 'fade', true); app.toast('Signed in'); }, 900); }
      }
      fill('');
      return [K.bar(app, ''), h('div', { class: 'k-pad' }, h('h1', { class: 'k-large', text: 'Enter the code' }), h('p', { class: 'k-sub', text: 'Sent to +234 ' + S.phone }),
        h('label', { class: 'wk-code' }, boxes, input), status, h('div', { style: { flex: 1 } }),
        h('button', { class: 'k-btn plain', onclick: function () { if (!input.disabled) fill('4821'); } }, 'Fill a Demo Code'))];
    },
    home: function (app) {
      var S = app.state, hr = new Date().getHours(), last = S.history[0];
      function start(from, to) { S.draft = { from: from, to: to, size: 'small', vehicle: 'bike' }; app.go('create'); }
      return [map(), h('div', { class: 'wk-top' }, h('span', { class: 'wk-pill' }, h('i', { class: 'wk-live' }), (hr < 12 ? 'Good morning' : hr < 17 ? 'Good afternoon' : 'Good evening') + ' in Lagos')),
        h('div', { class: 'wk-dock k-pop' }, h('h2', { text: 'Where is it going?' }),
          h('button', { class: 'k-btn', onclick: function () { start('yaba', 'lekki'); } }, 'Send a Package'),
          h('button', { class: 'k-row wk-again', onclick: function () { start(last.from, last.to); } }, h('span', { class: 'wk-pin' }, K.icon('clock', 18)), h('span', { class: 'grow' }, h('b', { text: place(last.from).name + ' to ' + place(last.to).name }), h('span', { text: 'Send again' }))))];
    },
    create: function (app) {
      var S = app.state, d = S.draft, holder = h('div', { class: 'wk-mini' }), fromB = h('b'), toB = h('b'), vList = h('ul', { class: 'k-list' }), cta = h('button', { class: 'k-btn', onclick: function () { app.go('track'); } });
      function sync() {
        var q = quote(d); fromB.textContent = place(d.from).name; toB.textContent = place(d.to).name;
        holder.innerHTML = ''; var m = map(d.from, d.to); K.add(holder, m);
        var a = place(d.from), b = place(d.to), minX = Math.min(a.x, b.x) - 50, minY = Math.min(a.y, b.y) - 40, w = Math.max(200, Math.abs(a.x - b.x) + 100), hh = Math.max(110, Math.abs(a.y - b.y) + 80);
        m.setAttribute('viewBox', minX + ' ' + minY + ' ' + w + ' ' + hh);
        vList.innerHTML = '';
        VEHICLES.forEach(function (v) {
          var qv = quote({ from: d.from, to: d.to, size: d.size, vehicle: v.id });
          K.add(vList, h('li', null, h('button', { class: 'k-row wk-veh', 'aria-pressed': String(v.id === d.vehicle), onclick: function () { d.vehicle = v.id; sync(); } }, h('span', { class: 'wk-pin' }, K.icon(v.id, 20)),
            h('span', { class: 'grow' }, h('b', { text: v.name }), h('span', { text: v.note + ' · ' + qv.mins + ' min' })), h('span', { class: 'end', text: naira(qv.price) }))));
        });
        cta.textContent = 'Request Rider · ' + naira(q.price);
      }
      sync();
      return [K.bar(app, 'New Delivery'), h('div', { class: 'k-scroll wk-create' }, holder,
        h('ul', { class: 'k-list' }, h('li', null, h('button', { class: 'k-row', onclick: function () { placeSheet(app, 'Pick up from', d.to, function (id) { d.from = id; sync(); }); } }, h('i', { class: 'wk-node' }), h('span', { class: 'grow' }, h('span', { text: 'Pick up from' }), fromB), h('span', { class: 'k-sub', text: 'Change' }))),
          h('li', null, h('button', { class: 'k-row', onclick: function () { placeSheet(app, 'Deliver to', d.from, function (id) { d.to = id; sync(); }); } }, h('i', { class: 'wk-node sq' }), h('span', { class: 'grow' }, h('span', { text: 'Deliver to' }), toB), h('span', { class: 'k-sub', text: 'Change' })))),
        h('p', { class: 'k-h', text: 'Package size' }), K.seg(SIZES, d.size, function (v) { d.size = v; sync(); }, 'Package size'),
        h('p', { class: 'k-h', text: 'Vehicle' }), vList), h('div', { class: 'wk-foot' }, cta)];
    },
    track: function (app) {
      var S = app.state, d = S.draft, q = quote(d), rider = RIDERS[S.history.length % RIDERS.length], m = map(d.from, d.to);
      var route = m.querySelector('.wk-route'), dot = m.querySelector('.wk-rider'), cam = m.querySelector('.wk-cam');
      var body = h('div', { class: 'wk-body' }), sheet = h('div', { class: 'wk-sheet' }), island = h('span', { class: 'wk-island' }), raf = 0, phase = 'finding', at = 'peek', L = 0;
      var REST = { open: 0, peek: 0.58, mid: 0.36 };
      function detent(n) { at = n; sheet.style.transform = 'translateY(' + REST[n] * 100 + '%)'; }
      function steps(done) { return h('ul', { class: 'wk-steps' }, ['Rider assigned', 'Picked up in ' + place(d.from).name, 'In transit', 'Delivered to ' + place(d.to).name].map(function (n, i) { return h('li', { class: i < done ? 'done' : '' }, h('i'), n); })); }
      function paint(nodes) { body.innerHTML = ''; K.add(body, nodes); }
      function finding() {
        island.textContent = 'Matching'; detent('peek');
        paint([h('div', { class: 'k-pop' }, h('h3', { text: 'Finding a Rider' }), h('p', { class: 'k-sub', text: 'Checking riders near ' + place(d.from).name })), h('div', { class: 'wk-prog busy' }, h('i')), steps(0),
          h('button', { class: 'k-btn text', onclick: function () { app.back(); } }, 'Cancel Request')]);
        app.later(enroute, 2100);
      }
      function enroute() {
        phase = 'enroute'; var eta = h('b', { text: q.mins + ' min' }), bar = h('i'), holder = h('div', null, steps(1)), last = 1, t0 = performance.now(), TRIP = 11000;
        paint([h('div', { class: 'k-pop' }, h('h3', { text: rider + ' Is on the Way' }), h('p', { class: 'k-sub' }, 'Arrives in ', eta, ' · ' + pick(VEHICLES, d.vehicle).name)), h('div', { class: 'wk-prog' }, bar), holder]);
        dot.setAttribute('opacity', 1); cam.style.transform = 'scale(1.08)';
        (function frame(now) {
          var t = Math.min(1, (now - t0) / TRIP), p = t < 0.5 ? 2 * t * t : 1 - Math.pow(-2 * t + 2, 2) / 2, pt = route.getPointAtLength(L * p);
          dot.setAttribute('transform', 'translate(' + pt.x + ' ' + pt.y + ')'); route.style.strokeDashoffset = L * (1 - p);
          var left = Math.max(1, Math.ceil((1 - p) * q.mins)); eta.textContent = left + ' min'; island.textContent = left + ' min'; bar.style.width = p * 100 + '%';
          var done = p > 0.3 ? 3 : p > 0.06 ? 2 : 1; if (done !== last) { last = done; holder.innerHTML = ''; K.add(holder, steps(done)); }
          if (t < 1) raf = requestAnimationFrame(frame); else app.later(delivered, 350);
        })(t0);
      }
      function delivered() {
        phase = 'delivered'; island.textContent = 'Delivered'; cam.style.transform = 'none'; detent('mid');
        paint([h('div', { class: 'k-pop' }, h('h3', { text: 'Delivered' }), h('p', { class: 'k-sub', text: 'Dropped off in ' + place(d.to).name + ' · ' + naira(q.price) })),
          h('button', { class: 'k-btn k-pop', style: { '--d': 1 }, onclick: function () { app.go('rate', { rider: rider, q: q }); } }, 'Rate ' + rider), steps(4)]);
      }
      var drag = null;
      sheet.addEventListener('pointerdown', function (e) { if (e.target.closest('button')) return; drag = { y: e.clientY, start: REST[at] * sheet.offsetHeight, moved: 0 }; sheet.setPointerCapture(e.pointerId); });
      sheet.addEventListener('pointermove', function (e) {
        if (!drag) return; var dy = e.clientY - drag.y; drag.moved = Math.max(drag.moved, Math.abs(dy)); if (drag.moved < 4) return;
        sheet.classList.add('dragging'); var y = drag.start + dy, max = sheet.offsetHeight * 0.64; if (y < 0) y *= 0.25; if (y > max) y = max + (y - max) * 0.25;
        drag.cur = y; sheet.style.transform = 'translateY(' + y + 'px)';
      });
      function end() {
        if (!drag) return; sheet.classList.remove('dragging'); var rest = phase === 'delivered' ? 'mid' : 'peek';
        if (drag.moved < 4) detent(at === 'open' ? rest : 'open'); else detent(drag.cur / sheet.offsetHeight < REST[rest] / 2 ? 'open' : rest);
        drag = null;
      }
      sheet.addEventListener('pointerup', end); sheet.addEventListener('pointercancel', end);
      K.add(sheet, [h('div', { class: 'kit-grab' }), body]);
      app.later(function () { L = route.getTotalLength(); route.style.strokeDasharray = L; route.style.strokeDashoffset = L; }, 0);
      app.onLeave(function () { cancelAnimationFrame(raf); });
      finding();
      return [m, h('div', { class: 'wk-top' }, island), sheet];
    },
    rate: function (app, p) {
      var S = app.state, d = S.draft, stars = 5, tip = 0, wrap = h('div', { class: 'wk-stars', role: 'radiogroup', 'aria-label': 'Rating' });
      function paintStars() { [].forEach.call(wrap.children, function (b, i) { b.setAttribute('aria-checked', String(i < stars)); }); }
      for (var i = 1; i <= 5; i++) (function (n) { K.add(wrap, h('button', { role: 'radio', 'aria-label': n + ' star' + (n > 1 ? 's' : ''), onclick: function (e) { stars = n; paintStars(); e.currentTarget.classList.remove('hit'); void e.currentTarget.offsetWidth; e.currentTarget.classList.add('hit'); } }, K.icon('star', 38))); })(i);
      paintStars();
      var tips = [0, 200, 500].map(function (v) { return h('button', { class: 'k-chip', 'aria-pressed': String(v === 0), onclick: function (e) { tip = v; [].forEach.call(e.currentTarget.parentNode.children, function (b) { b.setAttribute('aria-pressed', String(b === e.currentTarget)); }); } }, v ? naira(v) : 'No Tip'); });
      return h('div', { class: 'k-pad' }, h('div', { class: 'k-center' }, h('div', { class: 'wk-avatar k-pop', text: p.rider[0] }), h('h1', { class: 'k-large k-pop', style: { '--d': 1 }, text: 'How was ' + p.rider + '?' }), wrap,
        h('p', { class: 'k-h', text: 'Add a tip' }), h('div', { class: 'wk-tips' }, tips)),
        h('button', { class: 'k-btn', onclick: function () {
          S.history.unshift({ from: d.from, to: d.to, vehicle: d.vehicle, rider: p.rider, km: p.q.km, price: p.q.price, tip: tip, stars: stars, when: 'Today' });
          app.go('home', null, 'fade', true); app.toast('Saved to Activity');
        } }, 'Done'));
    },
    activity: function (app) {
      var S = app.state;
      return h('div', { class: 'k-scroll' }, h('h1', { class: 'k-large', text: 'Activity' }),
        h('ul', { class: 'k-list' }, S.history.map(function (d, i) {
          return h('li', { class: 'k-pop', style: { '--d': Math.min(i, 6) } }, h('button', { class: 'k-row', onclick: function () { receipt(app, d); } }, h('span', { class: 'wk-pin' }, K.icon(d.vehicle, 20)),
            h('span', { class: 'grow' }, h('b', { text: place(d.from).name + ' to ' + place(d.to).name }), h('span', { text: d.when + ' · ' + d.rider + ' · Delivered' })), h('span', { class: 'end', text: naira(d.price + (d.tip || 0)) })));
        })));
    },
    account: function (app) {
      var S = app.state;
      function row(a, b) { return h('li', null, h('div', { class: 'k-row' }, h('span', { class: 'grow' }, h('b', { text: a })), h('span', { class: 'end k-sub', text: b }))); }
      return h('div', { class: 'k-scroll' }, h('h1', { class: 'k-large', text: 'Account' }),
        h('div', { class: 'k-card wk-me' }, h('div', { class: 'wk-avatar', text: 'M' }), h('div', null, h('b', { text: 'Demo account' }), h('p', { class: 'k-sub', text: '+234 ' + (S.phone || '801 234 5678') }))),
        h('ul', { class: 'k-list' }, row('Deliveries', S.history.length), row('Payment', 'Pay on delivery'), row('City', 'Lagos')),
        h('button', { class: 'k-btn plain', onclick: function () { S.signedIn = false; app.go('signin', null, 'fade', true); } }, 'Sign Out'),
        h('p', { class: 'k-sub', style: { 'text-align': 'center' }, text: 'Waka is a portfolio project by Marvel Ogbeide. Riders, prices and trips are simulated.' }));
    }
  };

  window.WakaApp = {
    name: 'Waka',
    mount: function (root, opts) {
      return K.App(root, { theme: 'waka', first: opts && opts.preview ? 'home' : 'splash', screens: screens,
        state: { phone: '', draft: null, history: [
          { from: 'yaba', to: 'lekki', vehicle: 'bike', rider: 'Tunde', km: 14, price: 2400, tip: 200, stars: 5, when: 'Yesterday' },
          { from: 'ikeja', to: 'surulere', vehicle: 'car', rider: 'Aisha', km: 9, price: 3200, tip: 0, stars: 4, when: 'Last Friday' },
          { from: 'maryland', to: 'ikoyi', vehicle: 'bike', rider: 'Chinedu', km: 9, price: 1750, tip: 0, stars: 5, when: '2 Nov' }] },
        tabs: [{ id: 'home', label: 'Home', icon: 'map' }, { id: 'activity', label: 'Activity', icon: 'clock' }, { id: 'account', label: 'Account', icon: 'user' }] });
    }
  };
})();
