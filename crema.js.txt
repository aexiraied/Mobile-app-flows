/* Crema: order-ahead for a coffee shop.
   Screens: splash, choose a cafe, home, menu, item, bag, order status, orders, account.
   Prices are stored in US dollars and shown in the customer's currency. The bag is the single source of truth for totals. */
(function () {
  var K = window.Kit, h = K.h;
  var MENU = [
    { id: 'flat', name: 'Flat White', cat: 'hot', price: 4.2, tone: ['#E9D8C3', '#B98A5E'], desc: 'Double shot, silky steamed milk', milk: true },
    { id: 'capp', name: 'Cappuccino', cat: 'hot', price: 4.4, tone: ['#F1E3D3', '#C79A6B'], desc: 'Espresso under thick foam', milk: true },
    { id: 'esp', name: 'Espresso', cat: 'hot', price: 3.0, tone: ['#D9C2A8', '#5B3A24'], desc: 'One short, bright shot' },
    { id: 'mocha', name: 'Mocha', cat: 'hot', price: 4.9, tone: ['#E3CDBB', '#7A4A2E'], desc: 'Espresso, dark chocolate, milk', milk: true },
    { id: 'chai', name: 'Chai Latte', cat: 'hot', price: 4.6, tone: ['#F3E2C4', '#C98F4B'], desc: 'Spiced black tea and milk', milk: true },
    { id: 'cold', name: 'Cold Brew', cat: 'iced', price: 4.5, tone: ['#CFE0EA', '#3B2A20'], desc: 'Steeped for 18 hours, served over ice' },
    { id: 'ilatte', name: 'Iced Latte', cat: 'iced', price: 4.8, tone: ['#D6E6F2', '#B98A5E'], desc: 'Double shot over cold milk', milk: true },
    { id: 'matcha', name: 'Iced Matcha', cat: 'iced', price: 5.2, tone: ['#DDEBCB', '#7FA650'], desc: 'Stone-ground matcha and milk', milk: true },
    { id: 'croi', name: 'Butter Croissant', cat: 'food', price: 3.6, tone: ['#F6E4BE', '#D9A441'], desc: 'Baked every morning' },
    { id: 'banana', name: 'Banana Bread', cat: 'food', price: 3.9, tone: ['#F0DCC0', '#A9713B'], desc: 'Walnuts, brown butter' },
    { id: 'roll', name: 'Cinnamon Roll', cat: 'food', price: 4.1, tone: ['#F4DFCC', '#C07A45'], desc: 'Warm, with vanilla glaze' }
  ];
  var CAFES = [{ id: 'downtown', name: 'Downtown', note: 'Open until 7 pm · 4 min walk' }, { id: 'river', name: 'Riverside', note: 'Open until 9 pm · 12 min walk' }, { id: 'station', name: 'Central Station', note: 'Open until 10 pm · 18 min walk' }];
  var SIZES = [{ id: 's', label: 'Small', add: 0 }, { id: 'm', label: 'Medium', add: 0.6 }, { id: 'l', label: 'Large', add: 1.2 }];
  var MILKS = [{ id: 'whole', label: 'Whole', add: 0 }, { id: 'oat', label: 'Oat', add: 0.7 }, { id: 'almond', label: 'Almond', add: 0.7 }];
  var EXTRAS = [{ id: 'shot', label: 'Extra shot', add: 0.9 }, { id: 'vanilla', label: 'Vanilla', add: 0.6 }, { id: 'caramel', label: 'Caramel', add: 0.6 }];
  var TAX = 0.08;
  function item(id) { return MENU.filter(function (m) { return m.id === id; })[0]; }
  function by(list, id) { return list.filter(function (x) { return x.id === id; })[0]; }
  function unit(line) {
    var m = item(line.id), p = m.price;
    if (m.cat !== 'food') p += by(SIZES, line.size).add; if (m.milk) p += by(MILKS, line.milk).add;
    line.extras.forEach(function (e) { p += by(EXTRAS, e).add; }); return p;
  }
  function describe(line) {
    var m = item(line.id), parts = []; if (m.cat !== 'food') parts.push(by(SIZES, line.size).label); if (m.milk && line.milk !== 'whole') parts.push(by(MILKS, line.milk).label + ' milk');
    line.extras.forEach(function (e) { parts.push(by(EXTRAS, e).label); }); return parts.join(', ') || 'As it comes';
  }
  function subtotal(bag) { return bag.reduce(function (a, l) { return a + unit(l) * l.qty; }, 0); }
  function count(bag) { return bag.reduce(function (a, l) { return a + l.qty; }, 0); }
  // drawn illustrations, so the app needs no image files
  function art(m, cls) {
    var d = m.tone[1], svg = m.cat === 'hot' ? '<path d="M22 34h44v18a20 20 0 0 1-20 20h-4a20 20 0 0 1-20-20z" fill="#fff"/><path d="M66 40h5a8 8 0 0 1 0 16h-6" fill="none" stroke="#fff" stroke-width="5"/><ellipse cx="44" cy="35" rx="20" ry="5" fill="' + d + '"/><path class="cr-steam" d="M36 24c-3-5 3-7 0-12M50 24c-3-5 3-7 0-12" fill="none" stroke="' + d + '" stroke-width="3" stroke-linecap="round"/>'
      : m.cat === 'iced' ? '<path d="M26 20h38l-5 54H31z" fill="#fff" opacity=".9"/><path d="M28.500 38h33l-3.300 36H31.800z" fill="' + d + '"/><rect x="34" y="42" width="11" height="11" rx="3" fill="#fff" opacity=".55" transform="rotate(-12 39 47)"/><rect x="47" y="50" width="10" height="10" rx="3" fill="#fff" opacity=".45" transform="rotate(14 52 55)"/><path d="M52 8l-6 34" stroke="' + d + '" stroke-width="4" stroke-linecap="round"/>'
      : '<path d="M14 56c0-16 14-28 31-28s31 12 31 28c0 6-6 10-14 10H28c-8 0-14-4-14-10z" fill="' + d + '"/><path d="M26 50c4-8 10-12 19-12M40 58c3-6 8-9 15-9" fill="none" stroke="#fff" stroke-width="4" stroke-linecap="round" opacity=".6"/>';
    return h('span', { class: 'cr-art ' + (cls || ''), style: { '--a': m.tone[0], '--b': m.tone[1] }, html: '<svg viewBox="0 0 90 84" aria-hidden="true">' + svg + '</svg>' });
  }
  function stepper(get, set, min) {
    var out = h('b', { text: get() });
    function bump(d) { set(Math.max(min, get() + d)); out.textContent = get(); out.classList.remove('cr-bump'); void out.offsetWidth; out.classList.add('cr-bump'); }
    return h('div', { class: 'cr-stepper' }, h('button', { 'aria-label': 'One fewer', onclick: function () { bump(-1); } }, '−'), out, h('button', { 'aria-label': 'One more', onclick: function () { bump(1); } }, '+'));
  }

  var screens = {
    splash: function (app) {
      app.later(function () { app.go('cafe', null, 'fade', true); }, 2000);
      return h('div', { class: 'k-center cr-splash' }, h('div', { class: 'cr-mark' }, h('i')), h('h1', { class: 'cr-word', text: 'crema' }), h('p', { class: 'k-pop', style: { '--d': 9 }, text: 'Coffee, ready when you are' }));
    },
    cafe: function (app, p) {
      var S = app.state, chosen = S.cafe, list = h('ul', { class: 'k-list' });
      CAFES.forEach(function (c) {
        K.add(list, h('li', null, h('button', { class: 'k-row cr-pick', 'aria-pressed': String(c.id === chosen), onclick: function (e) { chosen = c.id; [].forEach.call(list.querySelectorAll('.cr-pick'), function (b) { b.setAttribute('aria-pressed', String(b === e.currentTarget)); }); } },
          h('span', { class: 'grow' }, h('b', { text: c.name }), h('span', { text: c.note })), h('i', { class: 'cr-radio' }))));
      });
      return [p.edit ? K.bar(app, '') : null, h('div', { class: 'k-pad' }, h('h1', { class: 'k-large k-pop', text: 'Where are you picking up?' }), h('p', { class: 'k-sub k-pop', style: { '--d': 1 }, text: 'Order ahead and skip the line.' }), list, h('div', { style: { flex: 1 } }),
        h('button', { class: 'k-btn', onclick: function () { S.cafe = chosen; if (p.edit) app.back(); else app.go('home', null, 'fade', true); } }, p.edit ? 'Save' : 'Continue'))];
    },
    home: function (app) {
      var S = app.state, hr = new Date().getHours(), last = S.orders[0], goal = 100, pct = Math.min(100, S.stars / goal * 100);
      app.badge('bag', count(S.bag));
      function tile(m, d) { return h('button', { class: 'cr-tile k-pop', style: { '--d': d }, onclick: function () { app.go('item', { id: m.id }); } }, art(m), h('b', { text: m.name }), h('span', { text: K.money(m.price, S.currency) })); }
      return h('div', { class: 'k-scroll' }, h('p', { class: 'cr-store', text: 'Pickup at ' + by(CAFES, S.cafe).name }),
        h('h1', { class: 'k-large', text: hr < 12 ? 'Good morning.' : hr < 17 ? 'Good afternoon.' : 'Good evening.' }),
        h('div', { class: 'cr-reward k-pop' }, h('div', null, h('p', { class: 'cr-reward-n' }, h('b', { text: S.stars }), ' stars'), h('p', { text: S.stars >= goal ? 'You have a free drink waiting' : (goal - S.stars) + ' more for a free drink' })), h('div', { class: 'cr-ring', style: { '--p': pct } }, K.icon('gift', 22))),
        last ? h('button', { class: 'k-card cr-again k-pop', style: { '--d': 1 }, onclick: function () { last.lines.forEach(function (l) { S.bag.push(JSON.parse(JSON.stringify(l))); }); app.toast('Added to your bag'); app.go('bag', null, 'fade', true); } }, art(item(last.lines[0].id), 'sm'),
          h('span', { class: 'grow' }, h('span', { class: 'k-sub', text: 'Order again' }), h('b', { text: last.lines.map(function (l) { return item(l.id).name; }).join(', ') })), K.icon('plus', 22)) : null,
        h('p', { class: 'k-h', text: 'Popular today' }), h('div', { class: 'cr-tiles' }, tile(item('flat'), 2), tile(item('matcha'), 3), tile(item('croi'), 4), tile(item('cold'), 5)));
    },
    menu: function (app, p) {
      var S = app.state, cat = p.cat || 'hot', list = h('ul', { class: 'k-list' });
      function render() {
        list.innerHTML = '';
        MENU.filter(function (m) { return m.cat === cat; }).forEach(function (m, i) {
          K.add(list, h('li', { class: 'k-pop', style: { '--d': i } }, h('button', { class: 'k-row cr-row', onclick: function () { app.go('item', { id: m.id }); } }, art(m, 'sm'), h('span', { class: 'grow' }, h('b', { text: m.name }), h('span', { text: m.desc })), h('span', { class: 'end', text: K.money(m.price, S.currency) }))));
        });
      }
      render();
      return h('div', { class: 'k-scroll' }, h('h1', { class: 'k-large', text: 'Menu' }), K.seg([{ id: 'hot', label: 'Hot' }, { id: 'iced', label: 'Iced' }, { id: 'food', label: 'Bakery' }], cat, function (v) { cat = v; render(); }, 'Category'), list);
    },
    item: function (app, p) {
      var S = app.state, m = item(p.id), line = { id: m.id, size: 'm', milk: 'whole', extras: [], qty: 1 }, cta = h('button', { class: 'k-btn', onclick: function () {
        var same = S.bag.filter(function (l) { return l.id === line.id && l.size === line.size && l.milk === line.milk && l.extras.join() === line.extras.join(); })[0];
        if (same) same.qty += line.qty; else S.bag.push(line); app.badge('bag', count(S.bag)); app.toast(m.name + ' added'); app.back();
      } });
      function sync() { cta.textContent = 'Add to Bag · ' + K.money(unit(line) * line.qty, S.currency); }
      sync();
      var extras = EXTRAS.map(function (e) { return h('button', { class: 'k-chip', 'aria-pressed': 'false', onclick: function (ev) { var i = line.extras.indexOf(e.id); if (i > -1) line.extras.splice(i, 1); else line.extras.push(e.id); ev.currentTarget.setAttribute('aria-pressed', String(i === -1)); sync(); } }, e.label, h('span', { class: 'k-sub', text: '+' + K.money(e.add, S.currency) })); });
      function label(o) { return { id: o.id, label: o.label }; }
      return [K.bar(app, ''), h('div', { class: 'k-scroll cr-item' }, art(m, 'lg'), h('div', null, h('h1', { class: 'k-large', text: m.name }), h('p', { class: 'k-sub', text: m.desc })),
        m.cat !== 'food' ? [h('p', { class: 'k-h', text: 'Size' }), K.seg(SIZES.map(label), line.size, function (v) { line.size = v; sync(); }, 'Size')] : null,
        m.milk ? [h('p', { class: 'k-h', text: 'Milk' }), K.seg(MILKS.map(label), line.milk, function (v) { line.milk = v; sync(); }, 'Milk')] : null,
        m.cat !== 'food' ? [h('p', { class: 'k-h', text: 'Extras' }), h('div', { class: 'k-chips' }, extras)] : null,
        h('div', { class: 'cr-qty' }, h('b', { text: 'Quantity' }), stepper(function () { return line.qty; }, function (v) { line.qty = v; sync(); }, 1))),
        h('div', { class: 'cr-foot' }, cta)];
    },
    bag: function (app) {
      var S = app.state, list = h('ul', { class: 'k-list' }), totals = h('div', { class: 'k-card cr-totals' }), cta = h('button', { class: 'k-btn', onclick: function () {
        var sub = subtotal(S.bag), total = sub * (1 + TAX), order = { no: 'C' + (1042 + S.orders.length), lines: S.bag, total: total, when: 'Today', cafe: S.cafe, pickup: S.pickup, stars: Math.floor(total) };
        S.orders.unshift(order); S.bag = []; S.stars += order.stars; app.badge('bag', 0); app.go('status', { order: order }, 'push', true);
      } }), wrap = h('div', { class: 'cr-bag' });
      function render() {
        app.badge('bag', count(S.bag)); wrap.innerHTML = '';
        if (!S.bag.length) { K.add(wrap, h('div', { class: 'k-center cr-empty' }, art(item('flat'), 'lg'), h('h2', { text: 'Your bag is empty' }), h('p', { class: 'k-sub', text: 'Add a drink and it will show up here.' }), h('button', { class: 'k-btn', onclick: function () { app.go('menu', null, 'fade', true); } }, 'Browse the Menu'))); return; }
        list.innerHTML = ''; S.bag.forEach(function (l) {
          var m = item(l.id), price = h('span', { class: 'end', text: K.money(unit(l) * l.qty, S.currency) });
          K.add(list, h('li', null, h('div', { class: 'k-row cr-line' }, art(m, 'sm'), h('span', { class: 'grow' }, h('b', { text: m.name }), h('span', { text: describe(l) }), stepper(function () { return l.qty; }, function (v) { l.qty = v; if (v === 0) { S.bag.splice(S.bag.indexOf(l), 1); render(); } else { price.textContent = K.money(unit(l) * l.qty, S.currency); sums(); } }, 0)), price)));
        });
        K.add(wrap, [list, h('p', { class: 'k-h', text: 'Pickup time' }), K.seg([{ id: 'asap', label: 'ASAP' }, { id: '15', label: 'In 15 min' }, { id: '30', label: 'In 30 min' }], S.pickup, function (v) { S.pickup = v; }, 'Pickup time'), totals, cta]); sums();
      }
      function sums() {
        var sub = subtotal(S.bag); totals.innerHTML = ''; app.badge('bag', count(S.bag));
        function row(a, b, strong) { return h('p', { class: strong ? 'strong' : '' }, h('span', { text: a }), h('span', { text: K.money(b, S.currency) })); }
        K.add(totals, [row('Subtotal', sub), row('Tax', sub * TAX), row('Total', sub * (1 + TAX), true)]); cta.textContent = 'Place Order · ' + K.money(sub * (1 + TAX), S.currency);
      }
      render();
      return h('div', { class: 'k-scroll' }, h('h1', { class: 'k-large', text: 'Your Bag' }), wrap);
    },
    status: function (app, p) {
      var o = p.order, steps = ['Order received', 'Being made', 'Ready for pickup'], i = 0, title = h('h1', { class: 'k-large' }), ring = h('div', { class: 'cr-progress', style: { '--p': 8 } }, K.icon('cup', 44)), list = h('ul', { class: 'cr-steps' }, steps.map(function (s) { return h('li', null, h('i'), s); }));
      var done = h('button', { class: 'k-btn', disabled: true, onclick: function () { app.go('orders', null, 'fade', true); } }, 'Done');
      function paint() {
        title.textContent = i < 2 ? steps[i] : 'Ready. Enjoy.'; ring.style.setProperty('--p', [18, 62, 100][i]); ring.classList.toggle('ready', i === 2);
        [].forEach.call(list.children, function (li, k) { li.className = k <= i ? 'done' : ''; });
        if (i < 2) app.later(function () { i++; paint(); }, 2600); else done.disabled = false;
      }
      paint();
      return h('div', { class: 'k-pad' }, h('div', { class: 'k-center' }, ring, h('p', { class: 'cr-store', text: 'Order ' + o.no + ' · ' + by(CAFES, o.cafe).name }), title, list, h('p', { class: 'k-sub', text: 'You earned ' + o.stars + ' stars on this order.' })), done);
    },
    orders: function (app) {
      var S = app.state;
      return h('div', { class: 'k-scroll' }, h('h1', { class: 'k-large', text: 'Orders' }), S.orders.length ? S.orders.map(function (o, i) {
        return h('div', { class: 'k-card k-pop', style: { '--d': Math.min(i, 5) } }, h('div', { class: 'cr-order-top' }, h('b', { text: o.when + ' · ' + by(CAFES, o.cafe).name }), h('span', { class: 'k-sub', text: o.no })),
          h('p', { class: 'k-sub', text: o.lines.map(function (l) { return l.qty + ' × ' + item(l.id).name; }).join(', ') }),
          h('div', { class: 'cr-order-top' }, h('b', { text: K.money(o.total, S.currency) }), h('button', { class: 'cr-link', onclick: function () { o.lines.forEach(function (l) { S.bag.push(JSON.parse(JSON.stringify(l))); }); app.toast('Added to your bag'); app.go('bag', null, 'fade', true); } }, 'Order Again')));
      }) : h('p', { class: 'k-empty', text: 'Your orders will appear here.' }));
    },
    you: function (app) {
      var S = app.state;
      function tier(n, label) { return h('li', null, h('div', { class: 'k-row' }, h('span', { class: 'cr-tier' + (S.stars >= n ? ' on' : ''), text: n }), h('span', { class: 'grow' }, h('b', { text: label }), h('span', { text: S.stars >= n ? 'Unlocked' : (n - S.stars) + ' stars to go' })))); }
      return h('div', { class: 'k-scroll' }, h('h1', { class: 'k-large', text: 'Account' }),
        h('p', { class: 'k-h', text: 'Rewards' }), h('ul', { class: 'k-list' }, tier(50, 'Free pastry'), tier(100, 'Free drink'), tier(250, 'Bag of beans')),
        h('p', { class: 'k-h', text: 'Currency' }), K.seg(['USD', 'EUR', 'GBP'], S.currency, function (v) { S.currency = v; app.toast('Prices now in ' + v); }, 'Currency'),
        h('ul', { class: 'k-list' }, h('li', null, h('button', { class: 'k-row', onclick: function () { app.go('cafe', { edit: true }); } }, h('span', { class: 'grow' }, h('b', { text: 'Pickup cafe' })), h('span', { class: 'end k-sub', text: by(CAFES, S.cafe).name })))),
        h('p', { class: 'k-sub', style: { 'text-align': 'center' }, text: 'Crema is a portfolio project by Marvel Ogbeide. Orders, prices and exchange rates are simulated.' }));
    }
  };

  window.CremaApp = {
    name: 'Crema',
    mount: function (root, opts) {
      var seed = { no: 'C1041', lines: [{ id: 'flat', size: 'm', milk: 'oat', extras: [], qty: 1 }, { id: 'croi', size: 'm', milk: 'whole', extras: [], qty: 1 }], total: 9.18, when: 'Yesterday', cafe: 'downtown', pickup: 'asap', stars: 9 };
      return K.App(root, { theme: 'crema', first: opts && opts.preview ? 'home' : 'splash', screens: screens, state: { cafe: 'downtown', bag: [], orders: [seed], stars: 64, currency: 'USD', pickup: 'asap' },
        tabs: [{ id: 'home', label: 'Home', icon: 'home' }, { id: 'menu', label: 'Menu', icon: 'cup' }, { id: 'bag', label: 'Bag', icon: 'bag' }, { id: 'orders', label: 'Orders', icon: 'clock' }, { id: 'you', label: 'Account', icon: 'user' }] });
    }
  };
})();
