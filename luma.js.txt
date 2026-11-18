/* Luma: appointment booking for a hair and beauty studio.
   Screens: splash, welcome, home, services, service, choose stylist, choose time, review, confirmed, bookings, profile.
   Availability comes from one slots() function, so booked and unavailable times stay consistent everywhere. */
(function () {
  var K = window.Kit, h = K.h;
  var SERVICES = [
    { id: 'cut', name: 'Cut and Style', cat: 'hair', mins: 45, price: 48, tone: 1, desc: 'Consultation, wash, precision cut and blow-dry.', inc: ['Consultation', 'Wash and scalp massage', 'Cut and blow-dry'] },
    { id: 'blow', name: 'Blow-Dry', cat: 'hair', mins: 30, price: 32, tone: 2, desc: 'Wash and a smooth or bouncy finish.', inc: ['Wash', 'Heat protection', 'Styled finish'] },
    { id: 'braid', name: 'Braids', cat: 'hair', mins: 120, price: 95, tone: 3, desc: 'Box braids, cornrows or twists, with care advice.', inc: ['Consultation', 'Parting and braiding', 'Scalp oil'] },
    { id: 'color', name: 'Full Colour', cat: 'color', mins: 90, price: 110, tone: 4, desc: 'Root-to-tip colour with a gloss finish.', inc: ['Patch test check', 'Colour and gloss', 'Blow-dry'] },
    { id: 'lights', name: 'Highlights', cat: 'color', mins: 120, price: 140, tone: 1, desc: 'Foils or balayage, toned to suit you.', inc: ['Consultation', 'Lightening and toner', 'Blow-dry'] },
    { id: 'mani', name: 'Gel Manicure', cat: 'nails', mins: 45, price: 38, tone: 2, desc: 'Shape, cuticle care and long-wear gel.', inc: ['Shape and cuticle care', 'Gel colour', 'Hand massage'] },
    { id: 'pedi', name: 'Pedicure', cat: 'nails', mins: 50, price: 44, tone: 3, desc: 'Soak, exfoliation and polish.', inc: ['Soak and scrub', 'Nail care', 'Polish'] },
    { id: 'facial', name: 'Glow Facial', cat: 'spa', mins: 60, price: 72, tone: 4, desc: 'Cleanse, exfoliate, mask and massage.', inc: ['Skin check', 'Cleanse and mask', 'Facial massage'] },
    { id: 'massage', name: 'Back Massage', cat: 'spa', mins: 40, price: 55, tone: 1, desc: 'Deep pressure for back, neck and shoulders.', inc: ['Pressure check', 'Back, neck, shoulders', 'Aftercare'] }
  ];
  var TEAM = [
    { id: 'any', name: 'Any available', role: 'First open chair', cats: ['hair', 'color', 'nails', 'spa'] },
    { id: 'maya', name: 'Maya', role: 'Senior stylist · 9 years', cats: ['hair', 'color'] }, { id: 'jonas', name: 'Jonas', role: 'Colour specialist · 6 years', cats: ['hair', 'color'] },
    { id: 'priya', name: 'Priya', role: 'Nail artist · 5 years', cats: ['nails'] }, { id: 'elena', name: 'Elena', role: 'Therapist · 7 years', cats: ['spa'] }
  ];
  var CATS = [{ id: 'hair', label: 'Hair' }, { id: 'color', label: 'Colour' }, { id: 'nails', label: 'Nails' }, { id: 'spa', label: 'Spa' }];
  function by(list, id) { return list.filter(function (x) { return x.id === id; })[0]; }
  function dayKey(d) { return d.getFullYear() + '-' + (d.getMonth() + 1) + '-' + d.getDate(); }
  function nice(d) { var t = new Date(); t.setHours(0, 0, 0, 0); var diff = Math.round((new Date(d).setHours(0, 0, 0, 0) - t) / 864e5); return diff === 0 ? 'Today' : diff === 1 ? 'Tomorrow' : d.toLocaleDateString('en-GB', { weekday: 'short', day: 'numeric', month: 'short' }); }
  function clock(t) { var hh = Math.floor(t / 60), mm = t % 60; return (hh % 12 || 12) + ':' + (mm < 10 ? '0' : '') + mm + (hh < 12 ? ' am' : ' pm'); }
  // every half hour from 9:00 to 17:30; a slot is closed if it has passed, is taken by another client, or you already hold it
  function slots(S, date, stylist, ignoreId) {
    var out = [], now = new Date(), today = dayKey(now) === dayKey(date), seed = date.getDate() * 7 + date.getMonth() * 31 + stylist.length * 13;
    for (var t = 540; t <= 1050; t += 30) {
      var taken = ((t / 30 + seed) * 2654435761 % 97) < 30, past = today && t <= now.getHours() * 60 + now.getMinutes() + 30;
      var mine = S.bookings.some(function (b) { return b.status === 'upcoming' && b.id !== ignoreId && dayKey(b.date) === dayKey(date) && b.time === t; });
      out.push({ t: t, open: !taken && !past && !mine });
    }
    return out;
  }
  function avatar(p, cls) { return h('span', { class: 'lu-av ' + (cls || '') + ' t' + (p.id.length % 4 + 1), text: p.id === 'any' ? '✦' : p.name[0] }); }
  function progress(n) { return h('div', { class: 'lu-prog', 'aria-label': 'Step ' + n + ' of 3' }, [1, 2, 3].map(function (i) { return h('i', { class: i <= n ? 'on' : '' }); })); }
  function summary(S, d) {
    var s = by(SERVICES, d.service);
    function row(a, b) { return h('li', null, h('div', { class: 'k-row' }, h('span', { class: 'grow', text: a }), h('span', { class: 'end', text: b }))); }
    return h('ul', { class: 'k-list' }, row('Service', s.name), row('With', by(TEAM, d.stylist).name), row('When', nice(d.date) + ', ' + clock(d.time)), row('Duration', s.mins + ' min'), row('Price', K.money(s.price, S.currency)));
  }

  var screens = {
    splash: function (app) {
      app.later(function () { app.go('welcome', null, 'fade', true); }, 2000);
      return h('div', { class: 'k-center lu-splash' }, h('div', { class: 'lu-orb' }), h('h1', { class: 'lu-word', text: 'luma' }), h('p', { class: 'k-pop', style: { '--d': 9 }, text: 'Hair, colour, nails and spa' }));
    },
    welcome: function (app) {
      var S = app.state, input = h('input', { class: 'k-input', placeholder: 'Your first name', 'aria-label': 'Your first name', maxlength: 20 });
      return h('div', { class: 'k-pad' }, h('div', { class: 'k-center' }, h('div', { class: 'lu-orb sm' }), h('h1', { class: 'k-large k-pop', text: 'Your chair is waiting.' }), h('p', { class: 'k-sub k-pop', style: { '--d': 1 }, text: 'Book in under a minute. Change or cancel any time.' })), input,
        h('button', { class: 'k-btn', onclick: function () { S.name = input.value.trim() || 'there'; app.go('home', null, 'fade', true); } }, 'Get Started'));
    },
    home: function (app) {
      var S = app.state, next = S.bookings.filter(function (b) { return b.status === 'upcoming'; }).sort(function (a, b) { return a.date - b.date || a.time - b.time; })[0];
      function tile(id, d) { var s = by(SERVICES, id); return h('button', { class: 'lu-tile t' + s.tone + ' k-pop', style: { '--d': d }, onclick: function () { app.go('service', { id: id }); } }, h('b', { text: s.name }), h('span', { text: s.mins + ' min · ' + K.money(s.price, S.currency) })); }
      return h('div', { class: 'k-scroll' }, h('h1', { class: 'k-large', text: 'Hi, ' + S.name + '.' }),
        next ? h('button', { class: 'lu-next k-pop', onclick: function () { app.go('bookings', null, 'fade', true); } }, h('span', { class: 'lu-next-l', text: 'Your next appointment' }), h('b', { text: by(SERVICES, next.service).name }), h('span', { text: nice(next.date) + ' at ' + clock(next.time) + ' with ' + by(TEAM, next.stylist).name }))
          : h('div', { class: 'k-card lu-none k-pop' }, h('b', { text: 'Nothing booked yet' }), h('p', { class: 'k-sub', text: 'Pick a service and we will find you a time.' }), h('button', { class: 'k-btn', onclick: function () { app.go('services', null, 'fade', true); } }, 'Book an Appointment')),
        h('p', { class: 'k-h', text: 'Popular' }), h('div', { class: 'lu-tiles' }, tile('cut', 1), tile('mani', 2), tile('color', 3), tile('facial', 4)),
        h('p', { class: 'k-h', text: 'The team' }), h('div', { class: 'k-chips' }, TEAM.slice(1).map(function (p) { return h('div', { class: 'lu-person' }, avatar(p), h('b', { text: p.name }), h('span', { class: 'k-sub', text: p.role.split(' · ')[0] })); })));
    },
    services: function (app) {
      var S = app.state, cat = 'hair', list = h('ul', { class: 'k-list' });
      function render() { list.innerHTML = ''; SERVICES.filter(function (s) { return s.cat === cat; }).forEach(function (s, i) { K.add(list, h('li', { class: 'k-pop', style: { '--d': i } }, h('button', { class: 'k-row', onclick: function () { app.go('service', { id: s.id }); } }, h('i', { class: 'lu-dot t' + s.tone }), h('span', { class: 'grow' }, h('b', { text: s.name }), h('span', { text: s.mins + ' min' })), h('span', { class: 'end', text: K.money(s.price, S.currency) })))); }); }
      render();
      return h('div', { class: 'k-scroll' }, h('h1', { class: 'k-large', text: 'Services' }), K.seg(CATS, cat, function (v) { cat = v; render(); }, 'Category'), list);
    },
    service: function (app, p) {
      var S = app.state, s = by(SERVICES, p.id);
      return [K.bar(app, ''), h('div', { class: 'k-scroll lu-detail' }, h('div', { class: 'lu-hero t' + s.tone }, h('h1', { text: s.name }), h('p', { text: s.mins + ' min · ' + K.money(s.price, S.currency) })), h('p', { text: s.desc }),
        h('p', { class: 'k-h', text: 'Included' }), h('ul', { class: 'k-list' }, s.inc.map(function (x) { return h('li', null, h('div', { class: 'k-row' }, h('span', { class: 'lu-tick' }, K.icon('check', 16)), h('span', { class: 'grow', text: x }))); }))),
        h('div', { class: 'lu-foot' }, h('button', { class: 'k-btn', onclick: function () { S.draft = { service: s.id, stylist: 'any', date: null, time: null, note: '' }; app.go('stylist'); } }, 'Choose a Time'))];
    },
    stylist: function (app) {
      var S = app.state, d = S.draft, s = by(SERVICES, d.service), list = h('div', { class: 'lu-people' });
      TEAM.filter(function (p) { return p.cats.indexOf(s.cat) > -1; }).forEach(function (p, i) {
        K.add(list, h('button', { class: 'k-card lu-pick k-pop', style: { '--d': i }, 'aria-pressed': String(p.id === d.stylist), onclick: function (e) { d.stylist = p.id; [].forEach.call(list.children, function (b) { b.setAttribute('aria-pressed', String(b === e.currentTarget)); }); } }, avatar(p, 'lg'), h('span', { class: 'grow' }, h('b', { text: p.name }), h('span', { class: 'k-sub', text: p.role })), h('i', { class: 'lu-radio' })));
      });
      return [K.bar(app, s.name), h('div', { class: 'k-scroll' }, progress(1), h('h1', { class: 'k-large', text: 'Who would you like?' }), list), h('div', { class: 'lu-foot' }, h('button', { class: 'k-btn', onclick: function () { app.go('time'); } }, 'Continue'))];
    },
    time: function (app) {
      var S = app.state, d = S.draft, days = [], strip = h('div', { class: 'k-chips lu-days' }), grid = h('div', { class: 'lu-slots' }), note = h('p', { class: 'k-sub' }), cta = h('button', { class: 'k-btn', disabled: d.time == null, onclick: function () { app.go('review'); } }, 'Continue');
      for (var i = 0; i < 14; i++) { var x = new Date(); x.setHours(0, 0, 0, 0); x.setDate(x.getDate() + i); days.push(x); }
      if (!d.date) d.date = days[0];
      function render() {
        strip.innerHTML = ''; days.forEach(function (x) { K.add(strip, h('button', { class: 'lu-day', 'aria-pressed': String(dayKey(x) === dayKey(d.date)), onclick: function () { d.date = x; d.time = null; cta.disabled = true; render(); } }, h('span', { text: x.toLocaleDateString('en-GB', { weekday: 'short' }) }), h('b', { text: x.getDate() }))); });
        grid.innerHTML = ''; var list = slots(S, d.date, d.stylist, d.resched), open = list.filter(function (s) { return s.open; }).length;
        list.forEach(function (s, i) { K.add(grid, h('button', { class: 'lu-slot k-pop', style: { '--d': i % 6 }, disabled: !s.open, 'aria-pressed': String(d.time === s.t), onclick: function (e) { d.time = s.t; cta.disabled = false; [].forEach.call(grid.children, function (b) { b.setAttribute('aria-pressed', String(b === e.currentTarget)); }); } }, clock(s.t))); });
        note.textContent = open ? open + ' times open on ' + nice(d.date) : 'Fully booked on ' + nice(d.date) + '. Try another day.';
      }
      render();
      return [K.bar(app, d.resched ? 'Reschedule' : by(SERVICES, d.service).name), h('div', { class: 'k-scroll' }, progress(2), h('h1', { class: 'k-large', text: 'Pick a time.' }), strip, note, grid), h('div', { class: 'lu-foot' }, cta)];
    },
    review: function (app) {
      var S = app.state, d = S.draft, note = h('input', { class: 'k-input', placeholder: 'Anything we should know? (optional)', 'aria-label': 'Note for the studio', maxlength: 80, value: d.note || '' });
      return [K.bar(app, 'Review'), h('div', { class: 'k-scroll' }, progress(3), h('h1', { class: 'k-large', text: 'Looks right?' }), summary(S, d), note, h('p', { class: 'k-sub', text: 'Pay at the studio. Free to change or cancel up to 2 hours before.' })),
        h('div', { class: 'lu-foot' }, h('button', { class: 'k-btn', onclick: function () {
          d.note = note.value.trim();
          if (d.resched) { var b = by(S.bookings, d.resched); b.date = d.date; b.time = d.time; b.stylist = d.stylist; }
          else S.bookings.push({ id: 'b' + Date.now(), service: d.service, stylist: d.stylist, date: d.date, time: d.time, note: d.note, status: 'upcoming' });
          app.go('confirmed', { draft: d }, 'push', true);
        } }, d.resched ? 'Confirm New Time' : 'Confirm Booking'))];
    },
    confirmed: function (app, p) {
      var S = app.state, d = p.draft;
      return h('div', { class: 'k-pad' }, h('div', { class: 'k-center' }, h('div', { class: 'lu-check' }, K.icon('check', 54)), h('h1', { class: 'k-large k-pop', style: { '--d': 3 }, text: d.resched ? 'Time changed.' : 'You are booked.' }),
        h('p', { class: 'k-sub k-pop', style: { '--d': 4 }, text: by(SERVICES, d.service).name + ' on ' + nice(d.date) + ' at ' + clock(d.time) + ' with ' + by(TEAM, d.stylist).name + '.' })),
        h('button', { class: 'k-btn', onclick: function () { S.draft = null; app.go('bookings', null, 'fade', true); } }, 'View My Bookings'), h('button', { class: 'k-btn text', onclick: function () { S.draft = null; app.go('home', null, 'fade', true); } }, 'Back to Home'));
    },
    bookings: function (app) {
      var S = app.state, tab = 'upcoming', list = h('div', { class: 'lu-list' });
      function open(b) {
        app.sheet(function (close) {
          var area = h('div', { class: 'lu-sheet-actions' });
          function normal() { area.innerHTML = ''; K.add(area, [h('button', { class: 'k-btn', onclick: function () { close(); S.draft = { service: b.service, stylist: b.stylist, date: b.date, time: null, note: b.note, resched: b.id }; app.go('time'); } }, 'Reschedule'), h('button', { class: 'k-btn text lu-danger', onclick: ask }, 'Cancel Booking')]); }
          function ask() { area.innerHTML = ''; K.add(area, [h('p', { class: 'k-sub', style: { 'text-align': 'center' }, text: 'Cancel this appointment? This cannot be undone.' }), h('button', { class: 'k-btn lu-danger-fill', onclick: function () { b.status = 'cancelled'; close(); app.toast('Booking cancelled'); render(); } }, 'Yes, Cancel It'), h('button', { class: 'k-btn text', onclick: normal }, 'Keep Booking')]); }
          if (b.status === 'upcoming') normal();
          return [h('h3', { class: 'lu-sheet-t', text: by(SERVICES, b.service).name }), summary(S, b), b.note ? h('p', { class: 'k-sub', text: 'Note: ' + b.note }) : null, area];
        });
      }
      function render() {
        list.innerHTML = ''; var items = S.bookings.filter(function (b) { return tab === 'upcoming' ? b.status === 'upcoming' : b.status !== 'upcoming'; }).sort(function (a, b) { return a.date - b.date || a.time - b.time; });
        if (!items.length) { K.add(list, h('p', { class: 'k-empty', text: tab === 'upcoming' ? 'No upcoming appointments. Book one from Services.' : 'Past and cancelled appointments will appear here.' })); return; }
        items.forEach(function (b, i) { var s = by(SERVICES, b.service); K.add(list, h('button', { class: 'k-card lu-book k-pop', style: { '--d': i }, onclick: function () { open(b); } }, h('span', { class: 'lu-date t' + s.tone }, h('span', { text: b.date.toLocaleDateString('en-GB', { month: 'short' }) }), h('b', { text: b.date.getDate() })),
          h('span', { class: 'grow' }, h('b', { text: s.name }), h('span', { class: 'k-sub', text: clock(b.time) + ' · ' + by(TEAM, b.stylist).name }), b.status !== 'upcoming' ? h('span', { class: 'lu-state', text: b.status === 'cancelled' ? 'Cancelled' : 'Completed' }) : null))); });
      }
      render();
      return h('div', { class: 'k-scroll' }, h('h1', { class: 'k-large', text: 'Bookings' }), K.seg([{ id: 'upcoming', label: 'Upcoming' }, { id: 'past', label: 'Past' }], tab, function (v) { tab = v; render(); }, 'Show'), list);
    },
    profile: function (app) {
      var S = app.state, input = h('input', { class: 'k-input', value: S.name === 'there' ? '' : S.name, placeholder: 'Your first name', 'aria-label': 'Your first name', maxlength: 20, oninput: function () { S.name = input.value.trim() || 'there'; } });
      return h('div', { class: 'k-scroll' }, h('h1', { class: 'k-large', text: 'Profile' }), h('p', { class: 'k-h', text: 'Name' }), input,
        h('p', { class: 'k-h', text: 'Currency' }), K.seg(['USD', 'EUR', 'GBP'], S.currency, function (v) { S.currency = v; app.toast('Prices now in ' + v); }, 'Currency'),
        h('ul', { class: 'k-list' }, h('li', null, h('div', { class: 'k-row' }, h('span', { class: 'grow' }, h('b', { text: 'Appointments' })), h('span', { class: 'end', text: S.bookings.length }))), h('li', null, h('div', { class: 'k-row' }, h('span', { class: 'grow' }, h('b', { text: 'Studio hours' })), h('span', { class: 'end k-sub', text: '9 am to 6 pm' })))),
        h('p', { class: 'k-sub', style: { 'text-align': 'center' }, text: 'Luma is a portfolio project by Marvel Ogbeide. The studio, team and availability are simulated.' }));
    }
  };

  window.LumaApp = {
    name: 'Luma',
    mount: function (root, opts) {
      var past = new Date(); past.setHours(0, 0, 0, 0); past.setDate(past.getDate() - 12);
      var soon = new Date(); soon.setHours(0, 0, 0, 0); soon.setDate(soon.getDate() + 3);
      var S = { name: opts && opts.preview ? 'Alex' : 'there', currency: 'USD', draft: null, bookings: [{ id: 'b1', service: 'cut', stylist: 'maya', date: past, time: 630, note: '', status: 'past' }] };
      if (opts && opts.preview) S.bookings.push({ id: 'b2', service: 'mani', stylist: 'priya', date: soon, time: 870, note: '', status: 'upcoming' });
      return K.App(root, { theme: 'luma', first: opts && opts.preview ? 'home' : 'splash', screens: screens, state: S,
        tabs: [{ id: 'home', label: 'Home', icon: 'home' }, { id: 'services', label: 'Services', icon: 'spark' }, { id: 'bookings', label: 'Bookings', icon: 'cal' }, { id: 'profile', label: 'Profile', icon: 'user' }] });
    }
  };
})();
