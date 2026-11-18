/* Kit: a tiny app shell shared by Kobo, Waka and Synapse.
   It gives each app screens, a navigation stack, a tab bar, sheets and toasts. No framework. */
(function () {
  var SVG = /^(svg|path|circle|rect|g|line|polyline|text)$/;
  function add(el, c) {
    if (c == null || c === false) return;
    if (Array.isArray(c)) c.forEach(function (x) { add(el, x); });
    else el.appendChild(c.nodeType ? c : document.createTextNode(String(c)));
  }
  // h('div', { class: 'x', onclick: fn }, child, child...)
  function h(tag, attrs) {
    var el = SVG.test(tag) ? document.createElementNS('http://www.w3.org/2000/svg', tag) : document.createElement(tag);
    for (var k in attrs || {}) {
      var v = attrs[k];
      if (v == null || v === false) continue;
      if (k === 'html') el.innerHTML = v;
      else if (k === 'text') el.textContent = v;
      else if (k.slice(0, 2) === 'on') el.addEventListener(k.slice(2), v);
      else if (k === 'style' && typeof v === 'object') for (var s in v) el.style.setProperty(s, v[s]);
      else el.setAttribute(k, v === true ? '' : v);
    }
    for (var i = 2; i < arguments.length; i++) add(el, arguments[i]);
    return el;
  }
  var ICONS = {
    home: 'M4 11l8-7 8 7v8a1 1 0 0 1-1 1h-4v-6h-6v6H5a1 1 0 0 1-1-1z',
    list: 'M8 6h12M8 12h12M8 18h12M4 6h.01M4 12h.01M4 18h.01',
    plus: 'M12 5v14M5 12h14',
    chart: 'M5 20V10M12 20V4M19 20v-7',
    user: 'M12 12a4 4 0 1 0 0-8 4 4 0 0 0 0 8zM4 20c1.5-3.5 4.5-5 8-5s6.5 1.5 8 5',
    map: 'M12 21s7-6.2 7-11a7 7 0 0 0-14 0c0 4.800 7 11 7 11zM12 12.500a2.500 2.500 0 1 0 0-5 2.500 2.500 0 0 0 0 5z',
    clock: 'M12 21a9 9 0 1 0 0-18 9 9 0 0 0 0 18zM12 7v5l3 2',
    play: 'M7 5l12 7-12 7z',
    net: 'M5 6h.01M5 18h.01M12 12h.01M19 6h.01M19 18h.01M5 6l7 6 7-6M5 18l7-6 7 6',
    book: 'M5 4h10a3 3 0 0 1 3 3v13H8a3 3 0 0 1-3-3zM5 17a3 3 0 0 1 3-3h10',
    back: 'M15 5l-7 7 7 7',
    close: 'M6 6l12 12M18 6L6 18',
    check: 'M5 12.500l4.500 4.500L19 7.500',
    star: 'M12 3.500l2.600 5.400 5.900.800-4.300 4.100 1 5.900L12 17l-5.200 2.700 1-5.900-4.300-4.100 5.900-.800z',
    del: 'M4 6h16l-1.500 12a2 2 0 0 1-2 2h-9a2 2 0 0 1-2-2zM9 6l1-2h4l1 2',
    bike: 'M6 18a3 3 0 1 0 0-6 3 3 0 0 0 0 6zM18 18a3 3 0 1 0 0-6 3 3 0 0 0 0 6zM6 15l4-7h5l3 7M10 8l-1-2H7',
    car: 'M4 16v-4l2-5h12l2 5v4M4 16h16M7 16v2M17 16v2M6.500 12h11',
    van: 'M3 17V7h11v10M14 10h4l3 3v4h-7M7 19a2 2 0 1 0 0-4 2 2 0 0 0 0 4zM17 19a2 2 0 1 0 0-4 2 2 0 0 0 0 4z',
    search: 'M11 18a7 7 0 1 0 0-14 7 7 0 0 0 0 14zM20 20l-4-4',
    cup: 'M5 8h11v6a5 5 0 0 1-5 5h-1a5 5 0 0 1-5-5zM16 10h1.500a2.500 2.500 0 0 1 0 5H16M8 3v2M12 3v2',
    bag: 'M6 8h12l1 12H5zM9 8V7a3 3 0 0 1 6 0v1',
    gift: 'M4 11h16v9H4zM3 7h18v4H3zM12 7v13M12 7c-1-3-5-3-5-1s3 1 5 1zM12 7c1-3 5-3 5-1s-3 1-5 1z',
    cal: 'M5 6h14a1 1 0 0 1 1 1v12a1 1 0 0 1-1 1H5a1 1 0 0 1-1-1V7a1 1 0 0 1 1-1zM4 10h16M8 4v4M16 4v4',
    spark: 'M12 3l1.800 5.200L19 10l-5.200 1.800L12 17l-1.800-5.200L5 10l5.200-1.800z'
  };
  function icon(name, size) {
    var s = size || 24;
    return h('svg', { viewBox: '0 0 24 24', width: s, height: s, fill: 'none', stroke: 'currentColor', 'stroke-width': 2, 'stroke-linecap': 'round', 'stroke-linejoin': 'round', 'aria-hidden': 'true' },
      h('path', { d: ICONS[name] || '' }));
  }
  var RATES = { USD: 1, EUR: 0.92, GBP: 0.79 };
  // prices are stored in US dollars and shown in the chosen currency (fixed demo rates)
  function money(usd, cur) { cur = cur || 'USD'; return new Intl.NumberFormat(cur === 'USD' ? 'en-US' : cur === 'GBP' ? 'en-GB' : 'en-IE', { style: 'currency', currency: cur }).format(usd * RATES[cur]); }
  function naira(n) { return '₦' + Math.round(n).toLocaleString('en-NG'); }
  function spring(t) { return t >= 1 ? 1 : 1 - Math.exp(-6.5 * t) * Math.cos(8 * t); }

  function App(root, o) {
    var app = { state: o.state || {}, stack: [], root: root, h: h };
    var prevClass = root.className;
    root.className = (prevClass + ' kit ' + (o.theme || '')).trim();
    root.innerHTML = '';
    var view = h('div', { class: 'kit-view' }), tabs = h('nav', { class: 'kit-tabs', 'aria-label': 'App sections' }), layer = h('div', { class: 'kit-layer' });
    add(root, [view, tabs, layer]);
    (o.tabs || []).forEach(function (t) {
      add(tabs, h('button', { class: 'kit-tab' + (t.big ? ' big' : ''), 'data-tab': t.id, 'aria-label': t.label, onclick: function () { app.go(t.id, null, 'fade', true); } }, icon(t.icon, t.big ? 26 : 23), t.big ? null : h('span', { text: t.label })));
    });
    var current = null, cleanups = [], timers = [], dead = false;
    app.onLeave = function (fn) { cleanups.push(fn); };
    app.later = function (fn, ms) { var id = setTimeout(function () { if (!dead) fn(); }, ms); timers.push(id); return id; };
    function flush() { cleanups.splice(0).forEach(function (f) { try { f(); } catch (e) {} }); }
    function show(name, params, dir) {
      var isTab = (o.tabs || []).some(function (t) { return t.id === name; });
      var el = h('section', { class: 'kit-screen in-' + dir, 'data-screen': name });
      add(el, o.screens[name](app, params || {}));
      var old = current; current = el; add(view, el);
      if (old) { old.className = 'kit-screen out-' + dir; old.inert = true; setTimeout(function () { old.remove(); }, dir === 'none' ? 0 : 430); }
      tabs.classList.toggle('show', isTab);
      [].forEach.call(tabs.children, function (b) { if (b.dataset.tab === name) b.setAttribute('aria-current', 'page'); else b.removeAttribute('aria-current'); });
    }
    // dir: 'push' (forward), 'pop' (back), 'fade' (tabs), 'none'. reset clears the back stack.
    app.go = function (name, params, dir, reset) {
      if (!o.screens[name] || dead) return;
      flush(); if (reset) app.stack = [];
      app.stack.push({ name: name, params: params }); show(name, params, dir || 'push');
    };
    app.back = function () {
      if (app.stack.length < 2) return;
      flush(); app.stack.pop(); var t = app.stack[app.stack.length - 1]; show(t.name, t.params, 'pop');
    };
    app.sheet = function (build) {
      var scrim = h('div', { class: 'kit-scrim' }), sh = h('div', { class: 'kit-sheet', role: 'dialog', 'aria-modal': 'true' });
      function close() { scrim.classList.add('out'); sh.classList.add('out'); setTimeout(function () { scrim.remove(); sh.remove(); }, 340); }
      scrim.addEventListener('click', close);
      add(sh, [h('div', { class: 'kit-grab' }), build(close)]); add(layer, [scrim, sh]);
      return close;
    };
    app.toast = function (msg) {
      var t = h('div', { class: 'kit-toast', role: 'status', text: msg }); add(layer, t);
      setTimeout(function () { t.classList.add('out'); setTimeout(function () { t.remove(); }, 400); }, 1900);
    };
    // small count on a tab, such as items in a bag
    app.badge = function (id, n) { [].forEach.call(tabs.children, function (b) { if (b.dataset.tab === id) { if (n) b.setAttribute('data-badge', n); else b.removeAttribute('data-badge'); } }); };
    app.destroy = function () { dead = true; flush(); timers.forEach(clearTimeout); root.innerHTML = ''; root.className = prevClass; };
    app.go(o.first, null, 'none');
    return app;
  }
  // a standard top bar with an optional back button
  function bar(app, title, opts) {
    opts = opts || {};
    return h('header', { class: 'k-bar' },
      opts.back === false ? h('span', { class: 'k-bar-side' }) : h('button', { class: 'k-icon-btn', 'aria-label': 'Back', onclick: opts.onBack || function () { app.back(); } }, icon('back')),
      h('h2', { text: title }), h('span', { class: 'k-bar-side' }, opts.right || null));
  }
  function seg(options, value, onChange, label) {
    var el = h('div', { class: 'k-seg', role: 'tablist', 'aria-label': label || 'Options' });
    options.forEach(function (o) {
      var id = o.id != null ? o.id : o, b = h('button', { role: 'tab', 'aria-selected': String(id === value), text: o.label || o, onclick: function () {
        [].forEach.call(el.children, function (c) { c.setAttribute('aria-selected', String(c === b)); }); onChange(id);
      } });
      add(el, b);
    });
    return el;
  }
  window.Kit = { h: h, add: add, icon: icon, App: App, bar: bar, seg: seg, naira: naira, money: money, spring: spring };
})();
