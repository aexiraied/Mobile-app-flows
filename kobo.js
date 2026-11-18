/* Kobo: a personal spending tracker.
   Screens: splash, welcome, budget, home, activity, add expense, insights, settings.
   Everything on screen is derived from one list of transactions, so adding or deleting an expense updates every screen. */
(function () {
  var K = window.Kit, h = K.h, naira = K.naira;
  var GREEN = '#0A7D45';
  var CATS = [
    { id: 'food', name: 'Food', color: '#F08A00', notes: ['Jollof and chicken', 'Groceries', 'Suya', 'Bread and eggs', 'Lunch at work'], base: 3200 },
    { id: 'transport', name: 'Transport', color: '#0A6CFF', notes: ['Ride to VI', 'Danfo fare', 'Fuel', 'Keke'], base: 2100 },
    { id: 'data', name: 'Data', color: '#9B4DE0', notes: ['10GB data', 'Airtime', 'Weekly data plan'], base: 1500 },
    { id: 'bills', name: 'Bills', color: '#E0443A', notes: ['Electricity token', 'TV subscription', 'Water', 'Gas refill'], base: 5200 },
    { id: 'fun', name: 'Going out', color: '#0E9AAE', notes: ['Cinema', 'Football 5-a-side', 'Drinks with friends'], base: 4200 }
  ];
  function cat(id) { return CATS.filter(function (c) { return c.id === id; })[0]; }
  function day(d) { var x = new Date(d); x.setHours(0, 0, 0, 0); return x; }
  function sample() {
    var s = 21, out = [], id = 1, now = new Date();
    function r() { s = (s * 16807) % 2147483647; return (s - 1) / 2147483646; }
    for (var d = 44; d >= 0; d--) {
      var n = 1 + Math.floor(r() * 3.2);
      for (var i = 0; i < n; i++) {
        var c = CATS[Math.floor(Math.pow(r(), 1.5) * CATS.length)], when = new Date(now); when.setDate(now.getDate() - d); when.setHours(8 + Math.floor(r() * 12), Math.floor(r() * 60));
        if (when > now) when = new Date(now - 6e5);
        out.push({ id: id++, cat: c.id, amount: Math.round(c.base * (0.4 + r() * 1.5) / 50) * 50, note: c.notes[Math.floor(r() * c.notes.length)], date: when });
      }
    }
    return out;
  }
  function within(txs, days) { var from = day(new Date()); from.setDate(from.getDate() - days + 1); return txs.filter(function (t) { return t.date >= from; }); }
  function total(txs) { return txs.reduce(function (a, t) { return a + t.amount; }, 0); }
  function series(txs, days) {
    var out = [], labels = [], today = day(new Date());
    for (var i = days - 1; i >= 0; i--) {
      var d = new Date(today); d.setDate(today.getDate() - i); var next = new Date(d); next.setDate(d.getDate() + 1);
      out.push(total(txs.filter(function (t) { return t.date >= d && t.date < next; })));
      labels.push(d.toLocaleDateString('en-GB', days <= 7 ? { weekday: 'short' } : { day: 'numeric', month: 'short' }));
    }
    return { values: out, labels: labels };
  }
  function when(d) {
    var diff = Math.round((day(new Date()) - day(d)) / 864e5);
    return diff === 0 ? 'Today' : diff === 1 ? 'Yesterday' : d.toLocaleDateString('en-GB', { weekday: 'long', day: 'numeric', month: 'short' });
  }
  function badge(c) { return h('span', { class: 'kb-badge', style: { background: c.color }, text: c.name.slice(0, 2) }); }
  function countUp(el, to, app) {
    var t0 = performance.now(), raf;
    (function f(now) { var t = Math.min(1, (now - t0) / 800), e = 1 - Math.pow(1 - t, 3); el.textContent = naira(to * e); if (t < 1) raf = requestAnimationFrame(f); })(t0);
    app.onLeave(function () { cancelAnimationFrame(raf); });
  }

  // line chart on canvas: springs between data sets, drag to read a value
  function lineChart(app, canvas) {
    var ctx = canvas.getContext('2d'), S = 60, cur = new Float32Array(S), from = new Float32Array(S), to = new Float32Array(S), maxC = 1, maxF = 1, maxT = 1;
    var data = { values: [0], labels: [''] }, t0 = 0, raf = 0, hover = null, P = { l: 6, r: 6, t: 34, b: 22 };
    function res(a) { var o = new Float32Array(S); for (var i = 0; i < S; i++) { var p = i / (S - 1) * (a.length - 1), x = Math.floor(p), y = Math.min(a.length - 1, x + 1), f = p - x; f = f * f * (3 - 2 * f); o[i] = a[x] + (a[y] - a[x]) * f; } return o; }
    function size() { var w = canvas.clientWidth, hh = canvas.clientHeight, d = Math.min(devicePixelRatio || 1, 2); if (!w) return; canvas.width = w * d; canvas.height = hh * d; ctx.setTransform(d, 0, 0, d, 0, 0); }
    function pt(i, w, hh) { return [P.l + i / (S - 1) * (w - P.l - P.r), hh - P.b - cur[i] / maxC * (hh - P.t - P.b)]; }
    function draw() {
      var w = canvas.clientWidth, hh = canvas.clientHeight; if (!w) return;
      ctx.clearRect(0, 0, w, hh);
      ctx.strokeStyle = 'rgba(0,0,0,.07)'; ctx.lineWidth = 1;
      for (var g = 0; g < 3; g++) { var gy = P.t + g / 2 * (hh - P.t - P.b); ctx.beginPath(); ctx.moveTo(P.l, gy); ctx.lineTo(w - P.r, gy); ctx.stroke(); }
      ctx.beginPath(); var a = pt(0, w, hh); ctx.moveTo(a[0], a[1]);
      for (var i = 1; i < S; i++) { var p = pt(i, w, hh); ctx.lineTo(p[0], p[1]); }
      ctx.strokeStyle = GREEN; ctx.lineWidth = 2.5; ctx.lineJoin = ctx.lineCap = 'round'; ctx.stroke();
      var z = pt(S - 1, w, hh); ctx.lineTo(z[0], hh - P.b); ctx.lineTo(a[0], hh - P.b); ctx.closePath();
      var gr = ctx.createLinearGradient(0, P.t, 0, hh - P.b); gr.addColorStop(0, 'rgba(10,125,69,.22)'); gr.addColorStop(1, 'rgba(10,125,69,0)'); ctx.fillStyle = gr; ctx.fill();
      var n = data.values.length, idx = n - 1;
      if (hover != null) idx = Math.max(0, Math.min(n - 1, Math.round((hover - P.l) / (w - P.l - P.r) * (n - 1))));
      var q = pt(Math.round(idx / Math.max(1, n - 1) * (S - 1)), w, hh);
      if (hover != null) { ctx.strokeStyle = 'rgba(0,0,0,.2)'; ctx.lineWidth = 1; ctx.beginPath(); ctx.moveTo(q[0], P.t - 4); ctx.lineTo(q[0], hh - P.b); ctx.stroke(); }
      ctx.fillStyle = '#fff'; ctx.strokeStyle = GREEN; ctx.lineWidth = 3; ctx.beginPath(); ctx.arc(q[0], q[1], 5, 0, 6.3); ctx.fill(); ctx.stroke();
      ctx.font = '600 12px -apple-system, system-ui, sans-serif'; ctx.fillStyle = '#111113';
      var label = data.labels[idx] + '  ' + naira(data.values[idx]), tw = ctx.measureText(label).width;
      ctx.textAlign = 'left'; ctx.fillText(label, Math.max(P.l, Math.min(w - P.r - tw, q[0] - tw / 2)), 16);
      ctx.fillStyle = '#6B6B70'; ctx.font = '11px -apple-system, system-ui, sans-serif';
      ctx.textAlign = 'left'; ctx.fillText(data.labels[0], P.l, hh - 5); ctx.textAlign = 'right'; ctx.fillText(data.labels[n - 1], w - P.r, hh - 5);
    }
    function tick(now) {
      var t = Math.min(1, (now - t0) / 900), e = K.spring(t), l = 1 - Math.pow(1 - t, 3);
      for (var i = 0; i < S; i++) cur[i] = Math.max(0, from[i] + (to[i] - from[i]) * e);
      maxC = maxF + (maxT - maxF) * l; draw();
      raf = t < 1 ? requestAnimationFrame(tick) : 0;
    }
    function scrub(e) { var r = canvas.getBoundingClientRect(); hover = (e.clientX - r.left) / r.width * canvas.clientWidth; if (!raf) draw(); }
    canvas.addEventListener('pointerdown', scrub); canvas.addEventListener('pointermove', scrub);
    canvas.addEventListener('pointerleave', function () { hover = null; if (!raf) draw(); });
    app.onLeave(function () { cancelAnimationFrame(raf); });
    return { set: function (d) { data = d; size(); from.set(cur); to.set(res(d.values)); maxF = maxC; maxT = Math.max(1, Math.max.apply(null, d.values)) * 1.15; t0 = performance.now(); hover = null; if (!raf) raf = requestAnimationFrame(tick); } };
  }

  function txRow(app, t) {
    var c = cat(t.cat);
    return h('li', null, h('button', { class: 'k-row', onclick: function () { detail(app, t); } }, badge(c),
      h('span', { class: 'grow' }, h('b', { text: t.note }), h('span', { text: c.name + ' · ' + t.date.toLocaleTimeString('en-GB', { hour: '2-digit', minute: '2-digit' }) })),
      h('span', { class: 'end', text: '−' + naira(t.amount) })));
  }
  function detail(app, t) {
    var c = cat(t.cat);
    app.sheet(function (close) {
      return [h('div', { class: 'kb-detail' }, badge(c), h('p', { class: 'kb-big', text: naira(t.amount) }), h('p', { class: 'k-sub', text: t.note })),
        h('ul', { class: 'k-list kb-inset' }, h('li', null, h('div', { class: 'k-row' }, h('span', { class: 'grow', text: 'Category' }), h('span', { class: 'end', text: c.name }))),
          h('li', null, h('div', { class: 'k-row' }, h('span', { class: 'grow', text: 'Date' }), h('span', { class: 'end', text: when(t.date) })))),
        h('button', { class: 'k-btn plain kb-danger', onclick: function () {
          var S = app.state; S.txs = S.txs.filter(function (x) { return x !== t; }); close(); app.toast('Expense deleted');
          var top = app.stack[app.stack.length - 1]; app.stack.pop(); app.go(top.name, top.params, 'none');
        } }, K.icon('del', 20), 'Delete Expense')];
    });
  }

  var screens = {
    splash: function (app) {
      app.later(function () { app.go('welcome', null, 'fade', true); }, 1900);
      return h('div', { class: 'k-center kb-splash' }, h('div', { class: 'kb-coin' }, h('span', { text: '₦' })), h('h1', { class: 'kb-word', text: 'kobo' }));
    },
    welcome: function (app) {
      var bars = [38, 62, 46, 84, 58, 100].map(function (v, i) { return h('i', { style: { '--v': v + '%', '--d': i } }); });
      return h('div', { class: 'k-pad' }, h('div', { class: 'k-center' }, h('div', { class: 'kb-bars' }, bars),
        h('h1', { class: 'k-large k-pop', style: { '--d': 3 }, text: 'Know where every kobo goes.' }),
        h('p', { class: 'k-sub k-pop', style: { '--d': 4 }, text: 'Track spending in seconds, see the pattern, and stay under budget.' })),
        h('button', { class: 'k-btn k-pop', style: { '--d': 5 }, onclick: function () { app.go('budget'); } }, 'Get Started'));
    },
    budget: function (app, p) {
      var S = app.state, val = S.budget, out = h('p', { class: 'kb-big', text: naira(val) });
      function set(v) { val = Math.max(20000, Math.min(2000000, v)); out.textContent = naira(val); out.classList.remove('kb-bump'); void out.offsetWidth; out.classList.add('kb-bump'); chips.forEach(function (c) { c.setAttribute('aria-pressed', String(+c.dataset.v === val)); }); }
      var chips = [150000, 300000, 500000].map(function (v) { return h('button', { class: 'k-chip', 'data-v': v, 'aria-pressed': String(v === val), onclick: function () { set(v); } }, naira(v)); });
      return [K.bar(app, p.edit ? 'Monthly Budget' : 'Set a Budget'),
        h('div', { class: 'k-pad' }, h('div', { class: 'k-center' }, h('p', { class: 'k-sub', text: 'How much do you want to spend each month?' }),
          h('div', { class: 'kb-stepper' }, h('button', { class: 'k-icon-btn kb-step', 'aria-label': 'Decrease by 10,000', onclick: function () { set(val - 10000); } }, '−'), out,
            h('button', { class: 'k-icon-btn kb-step', 'aria-label': 'Increase by 10,000', onclick: function () { set(val + 10000); } }, '+')),
          h('div', { class: 'kb-row-chips' }, chips)),
          h('button', { class: 'k-btn', onclick: function () { S.budget = val; if (p.edit) { app.toast('Budget updated'); app.back(); } else app.go('home', null, 'fade', true); } }, p.edit ? 'Save Budget' : 'Continue'))];
    },
    home: function (app) {
      var S = app.state, month = within(S.txs, 30), spent = total(month), left = S.budget - spent, pct = Math.min(100, spent / S.budget * 100), hr = new Date().getHours();
      var amount = h('p', { class: 'kb-hero-amt', text: naira(spent) }), canvas = h('canvas', { class: 'kb-chart', role: 'img', 'aria-label': 'Daily spending. Drag across to read each day.' });
      var chart, range = 30;
      app.later(function () { chart = lineChart(app, canvas); chart.set(series(S.txs, range)); countUp(amount, spent, app); }, 60);
      var recent = S.txs.slice().sort(function (a, b) { return b.date - a.date; }).slice(0, 5);
      return h('div', { class: 'k-scroll' },
        h('h1', { class: 'k-large', text: hr < 12 ? 'Good morning' : hr < 17 ? 'Good afternoon' : 'Good evening' }),
        h('div', { class: 'kb-hero k-pop' }, h('p', { class: 'kb-hero-l', text: 'Spent in the last 30 days' }), amount,
          h('div', { class: 'kb-prog' }, h('i', { style: { '--w': pct + '%' } })),
          h('p', { class: 'kb-hero-l', text: left >= 0 ? naira(left) + ' left of ' + naira(S.budget) : naira(-left) + ' over your ' + naira(S.budget) + ' budget' })),
        h('div', { class: 'k-card k-pop', style: { '--d': 1 } }, K.seg([{ id: 7, label: 'Week' }, { id: 30, label: 'Month' }], range, function (v) { range = v; chart.set(series(S.txs, v)); }, 'Range'), canvas),
        h('p', { class: 'k-h', text: 'Recent' }),
        h('ul', { class: 'k-list k-pop', style: { '--d': 2 } }, recent.map(function (t) { return txRow(app, t); })));
    },
    activity: function (app) {
      var S = app.state, q = '', filter = 'all', list = h('div', { class: 'kb-groups' });
      function render() {
        list.innerHTML = '';
        var txs = S.txs.filter(function (t) { return (filter === 'all' || t.cat === filter) && (!q || t.note.toLowerCase().indexOf(q) > -1); }).sort(function (a, b) { return b.date - a.date; });
        if (!txs.length) { K.add(list, h('p', { class: 'k-empty', text: 'No expenses match. Try another search or category.' })); return; }
        var groups = {}, order = [];
        txs.forEach(function (t) { var k = when(t.date); if (!groups[k]) { groups[k] = []; order.push(k); } groups[k].push(t); });
        order.slice(0, 14).forEach(function (k) {
          K.add(list, [h('div', { class: 'kb-group-h' }, h('span', { class: 'k-h', text: k }), h('span', { class: 'k-sub', text: naira(total(groups[k])) })), h('ul', { class: 'k-list' }, groups[k].map(function (t) { return txRow(app, t); }))]);
        });
      }
      var chips = [{ id: 'all', name: 'All' }].concat(CATS).map(function (c) {
        return h('button', { class: 'k-chip', 'aria-pressed': String(c.id === 'all'), onclick: function (e) { filter = c.id; [].forEach.call(e.currentTarget.parentNode.children, function (b) { b.setAttribute('aria-pressed', String(b === e.currentTarget)); }); render(); } },
          c.color ? h('i', { class: 'kb-dot', style: { background: c.color } }) : null, c.name);
      });
      render();
      return h('div', { class: 'k-scroll' }, h('h1', { class: 'k-large', text: 'Activity' }),
        h('input', { class: 'k-input', type: 'search', placeholder: 'Search expenses', 'aria-label': 'Search expenses', oninput: function (e) { q = e.target.value.trim().toLowerCase(); render(); } }),
        h('div', { class: 'k-chips' }, chips), list);
    },
    add: function (app) {
      var S = app.state, digits = '', chosen = 'food', note = h('input', { class: 'k-input', placeholder: 'What was it for?', 'aria-label': 'Note', maxlength: 40 });
      var out = h('p', { class: 'kb-big kb-entry', text: naira(0) }), save = h('button', { class: 'k-btn', disabled: true, onclick: function () {
        var c = cat(chosen); S.txs.push({ id: Date.now(), cat: chosen, amount: +digits, note: note.value.trim() || c.name, date: new Date() });
        app.toast('Saved ' + naira(+digits)); app.go('home', null, 'fade', true);
      } }, 'Save Expense');
      function press(k) {
        if (k === 'del') digits = digits.slice(0, -1); else if (digits.length < 8 && !(digits === '' && (k === '0' || k === '00'))) digits += k;
        out.textContent = naira(+digits || 0); save.disabled = !(+digits > 0);
        out.classList.remove('kb-bump'); void out.offsetWidth; out.classList.add('kb-bump');
      }
      var keys = ['1', '2', '3', '4', '5', '6', '7', '8', '9', '00', '0', 'del'].map(function (k) {
        return h('button', { class: 'kb-key', 'aria-label': k === 'del' ? 'Delete' : k, onclick: function () { press(k); } }, k === 'del' ? '⌫' : k);
      });
      var chips = CATS.map(function (c) { return h('button', { class: 'k-chip', 'aria-pressed': String(c.id === chosen), onclick: function (e) { chosen = c.id; [].forEach.call(e.currentTarget.parentNode.children, function (b) { b.setAttribute('aria-pressed', String(b === e.currentTarget)); }); } }, h('i', { class: 'kb-dot', style: { background: c.color } }), c.name); });
      return h('div', { class: 'k-scroll kb-add' }, h('h1', { class: 'k-large', text: 'Add Expense' }), out, h('div', { class: 'k-chips' }, chips), note, h('div', { class: 'kb-keys' }, keys), save);
    },
    insights: function (app) {
      var S = app.state, month = within(S.txs, 30), sum = total(month) || 1, per = CATS.map(function (c) { return { c: c, v: total(month.filter(function (t) { return t.cat === c.id; })) }; }).sort(function (a, b) { return b.v - a.v; });
      var canvas = h('canvas', { class: 'kb-donut', role: 'img', 'aria-label': 'Spending by category' }), raf;
      app.later(function () {
        var d = Math.min(devicePixelRatio || 1, 2), w = canvas.clientWidth; canvas.width = canvas.height = w * d; var ctx = canvas.getContext('2d'); ctx.scale(d, d); var t0 = performance.now();
        (function f(now) {
          var t = Math.min(1, (now - t0) / 1100), e = K.spring(t), a = -Math.PI / 2; ctx.clearRect(0, 0, w, w); ctx.lineWidth = 26; ctx.lineCap = 'butt';
          per.forEach(function (p) { var len = p.v / sum * Math.PI * 2 * Math.min(1, e); ctx.strokeStyle = p.c.color; ctx.beginPath(); ctx.arc(w / 2, w / 2, w / 2 - 16, a + 0.02, Math.max(a + 0.02, a + len - 0.02)); ctx.stroke(); a += len; });
          if (t < 1) raf = requestAnimationFrame(f);
        })(t0);
      }, 80);
      app.onLeave(function () { cancelAnimationFrame(raf); });
      var days = series(S.txs, 30), big = Math.max.apply(null, days.values), bigDay = days.labels[days.values.indexOf(big)];
      return h('div', { class: 'k-scroll' }, h('h1', { class: 'k-large', text: 'Insights' }),
        h('div', { class: 'k-card kb-donut-card k-pop' }, h('div', { class: 'kb-donut-wrap' }, canvas, h('div', { class: 'kb-donut-mid' }, h('span', { class: 'k-sub', text: '30 days' }), h('b', { text: naira(total(month)) }))),
          h('ul', { class: 'kb-legend' }, per.map(function (p, i) {
            return h('li', null, h('div', { class: 'kb-leg-top' }, h('span', null, h('i', { class: 'kb-dot', style: { background: p.c.color } }), p.c.name), h('b', { text: Math.round(p.v / sum * 100) + '%' })),
              h('div', { class: 'kb-prog thin' }, h('i', { style: { '--w': p.v / per[0].v * 100 + '%', background: p.c.color, 'animation-delay': i * 80 + 'ms' } })), h('span', { class: 'k-sub', text: naira(p.v) }));
          }))),
        h('div', { class: 'kb-two' }, h('div', { class: 'k-card k-pop', style: { '--d': 1 } }, h('span', { class: 'k-sub', text: 'Daily average' }), h('b', { class: 'kb-stat', text: naira(total(month) / 30) })),
          h('div', { class: 'k-card k-pop', style: { '--d': 2 } }, h('span', { class: 'k-sub', text: 'Biggest day' }), h('b', { class: 'kb-stat', text: naira(big) }), h('span', { class: 'k-sub', text: bigDay }))));
    },
    you: function (app) {
      var S = app.state;
      return h('div', { class: 'k-scroll' }, h('h1', { class: 'k-large', text: 'Settings' }),
        h('ul', { class: 'k-list' }, h('li', null, h('button', { class: 'k-row', onclick: function () { app.go('budget', { edit: true }); } }, h('span', { class: 'grow' }, h('b', { text: 'Monthly budget' })), h('span', { class: 'end', text: naira(S.budget) }))),
          h('li', null, h('div', { class: 'k-row' }, h('span', { class: 'grow' }, h('b', { text: 'Currency' })), h('span', { class: 'end', text: 'Naira (₦)' }))),
          h('li', null, h('div', { class: 'k-row' }, h('span', { class: 'grow' }, h('b', { text: 'Expenses recorded' })), h('span', { class: 'end', text: S.txs.length })))),
        h('button', { class: 'k-btn plain', onclick: function () { S.txs = sample(); S.budget = 300000; app.toast('Sample data restored'); app.go('you', null, 'none', true); } }, 'Reset Sample Data'),
        h('p', { class: 'k-sub kb-about', text: 'Kobo is a portfolio project by Marvel Ogbeide. The expenses are sample data and nothing leaves this device.' }));
    }
  };

  window.KoboApp = {
    name: 'Kobo',
    mount: function (root, opts) {
      return K.App(root, { theme: 'kobo', first: opts && opts.preview ? 'home' : 'splash', screens: screens, state: { budget: 300000, txs: sample() },
        tabs: [{ id: 'home', label: 'Home', icon: 'home' }, { id: 'activity', label: 'Activity', icon: 'list' }, { id: 'add', label: 'Add Expense', icon: 'plus', big: true }, { id: 'insights', label: 'Insights', icon: 'chart' }, { id: 'you', label: 'Settings', icon: 'user' }] });
    }
  };
})();
