/* Page behaviour: headline animation, reveal on scroll, live app previews, full-screen app pages, small touches. */
(function () {
  var root = document.documentElement;
  root.classList.add('js');
  var reduce = matchMedia('(prefers-reduced-motion: reduce)').matches;
  function $(s, el) { return (el || document).querySelector(s); }
  function $$(s, el) { return [].slice.call((el || document).querySelectorAll(s)); }

  var APPS = {
    kobo: { app: window.KoboApp, kind: 'Frontend', blurb: 'A spending tracker. Every screen is drawn from one list of expenses, so a change in one place shows up everywhere.',
      tries: ['Set a budget, then check the Home screen', 'Tap the plus button and add an expense with the keypad', 'Open Insights to see where the money went', 'Search Activity, then delete an expense'] },
    waka: { app: window.WakaApp, kind: 'Mobile', blurb: 'A delivery app for Lagos. Routes are worked out on the map itself and the rider follows the real path.',
      tries: ['Sign in with the demo number and code', 'Change the pickup, drop-off and vehicle and watch the price', 'Request a rider and drag the sheet up while it travels', 'Rate the rider, then find the trip in Activity'] },
    synapse: { app: window.SynapseApp, kind: 'AI', blurb: 'A neural network written by hand. It trains on your device while you watch its map of the world sharpen.',
      tries: ['Let the spiral train until Correct reaches 100%', 'Choose Blank and draw your own circles and crosses', 'Switch to Ask It and tap anywhere', 'Open Network and give it fewer neurons'] },
    crema: { app: window.CremaApp, kind: 'Commerce', blurb: 'Order-ahead for a coffee shop. Prices are stored once and shown in the customer\'s currency, and the bag is the single source for every total.',
      tries: ['Pick a cafe, then open a drink from Popular today', 'Change size, milk and extras and watch the price', 'Place the order and follow it to Ready', 'Switch currency in Account, then reorder from Orders'] },
    luma: { app: window.LumaApp, kind: 'Booking', blurb: 'Appointment booking for a hair and beauty studio. One function decides which times are open, so the calendar never disagrees with itself.',
      tries: ['Book a service in three steps', 'Try a time that is crossed out', 'Open the booking and reschedule it', 'Cancel it and find it under Past'] }
  };

  // ---------- headline letters ----------
  $$('.split').forEach(function (el) {
    var text = el.textContent, i = 0;
    el.setAttribute('aria-label', text); el.textContent = '';
    text.split(' ').forEach(function (word, w, all) {
      var span = document.createElement('span'); span.style.display = 'inline-block'; span.style.whiteSpace = 'nowrap'; span.setAttribute('aria-hidden', 'true');
      word.split('').forEach(function (ch) { var c = document.createElement('span'); c.className = 'ch'; c.style.setProperty('--i', i++); c.textContent = ch; span.appendChild(c); });
      el.appendChild(span); if (w < all.length - 1) el.appendChild(document.createTextNode(' '));
    });
  });

  // ---------- reveal on scroll ----------
  var hasIO = 'IntersectionObserver' in window;
  if (hasIO) {
    var io = new IntersectionObserver(function (entries) { entries.forEach(function (en) { if (en.isIntersecting) { en.target.classList.add('in'); io.unobserve(en.target); } }); }, { threshold: 0.12, rootMargin: '0px 0px -6% 0px' });
    $$('.reveal').forEach(function (el, i) { el.style.transitionDelay = (i % 3) * 70 + 'ms'; io.observe(el); });
  } else $$('.reveal').forEach(function (el) { el.classList.add('in'); });

  // ---------- live previews: each phone runs the real app while it is on screen ----------
  var previews = [], pageOpen = false;
  $$('.device[data-app]').forEach(function (dev) {
    var p = { dev: dev, id: dev.dataset.app, inst: null, seen: false };
    previews.push(p);
    if (hasIO) new IntersectionObserver(function (en) { p.seen = en[0].isIntersecting; sync(p); }, { rootMargin: '10% 0px' }).observe(dev);
    else { p.seen = true; sync(p); }
  });
  function sync(p) {
    var want = p.seen && !pageOpen;
    if (want && !p.inst) p.inst = APPS[p.id].app.mount($('.device-screen', p.dev), { preview: true });
    else if (!want && p.inst) { p.inst.destroy(); p.inst = null; }
  }

  // ---------- tilt: phones lean toward the pointer and turn as they scroll past ----------
  function tilt(el, max, turn) {
    var rx = 0, ry = 0, vx = 0, vy = 0, tx = 0, ty = 0;
    (function step() {
      var r = el.getBoundingClientRect(), on = r.bottom > -200 && r.top < innerHeight + 200;
      if (on) {
        var c = (r.top + r.height / 2 - innerHeight / 2) / innerHeight, goalY = ty + Math.max(-1, Math.min(1, c)) * turn;
        vx += (tx - rx) * 0.12; vx *= 0.78; rx += vx; vy += (goalY - ry) * 0.12; vy *= 0.78; ry += vy;
        el.style.transform = 'rotateX(' + rx.toFixed(2) + 'deg) rotateY(' + ry.toFixed(2) + 'deg)';
      }
      requestAnimationFrame(step);
    })();
    el.addEventListener('pointermove', function (e) { if (e.pointerType === 'touch') return; var r = el.getBoundingClientRect(); ty = ((e.clientX - r.left) / r.width - 0.5) * 2 * max; tx = -((e.clientY - r.top) / r.height - 0.5) * 2 * max; });
    el.addEventListener('pointerleave', function () { tx = 0; ty = 0; });
  }
  if (!reduce) $$('.device[data-app]').forEach(function (d, i) { tilt(d, 5, i % 2 ? -26 : 26); });

  // ---------- app pages: #kobo, #waka and #synapse open the app full screen ----------
  var page = $('#app-page'), appRoot = $('#app-root'), current = null, currentId = null;
  function open(id) {
    var a = APPS[id]; if (current) current.destroy();
    pageOpen = true; previews.forEach(sync);
    $('#app-title').textContent = a.app.name; $('#app-name').textContent = a.app.name; $('#app-kind').textContent = a.kind; $('#app-blurb').textContent = a.blurb;
    $('#app-back').setAttribute('href', '#project-' + id);
    var ol = $('#app-tries'); ol.innerHTML = ''; a.tries.forEach(function (t) { var li = document.createElement('li'); li.textContent = t; ol.appendChild(li); });
    page.hidden = false; document.body.classList.add('app-open'); document.title = a.app.name + ' by Marvel Ogbeide';
    if (window.Field) window.Field.pause(true);
    currentId = id; current = a.app.mount(appRoot);
  }
  function close() {
    if (!current) return;
    current.destroy(); current = null; currentId = null; page.hidden = true; document.body.classList.remove('app-open'); document.title = 'Marvel Ogbeide Portfolio';
    pageOpen = false; previews.forEach(sync); if (window.Field) window.Field.pause(false);
  }
  function route() {
    var id = location.hash.slice(1);
    if (APPS[id]) { if (id !== currentId) open(id); }
    else { var was = currentId; close(); if (was) { var t = document.getElementById(id); if (t) t.scrollIntoView({ block: 'center' }); } }
  }
  addEventListener('hashchange', route); route();
  $('#app-restart').addEventListener('click', function () { if (currentId) open(currentId); });
  addEventListener('keydown', function (e) { if (e.key === 'Escape' && currentId) location.hash = 'project-' + currentId; });

  // ---------- small touches ----------
  var clock = $('#clock');
  function tick() { try { clock.textContent = new Intl.DateTimeFormat('en-GB', { timeZone: 'Africa/Lagos', hour: 'numeric', minute: '2-digit', hour12: true }).format(new Date()); } catch (e) {} }
  tick(); setInterval(tick, 20000);

  var copy = $('#copy-email'), EMAIL = 'marvelogbeide8@gmail.com';
  copy.addEventListener('click', function () {
    function done(ok) { copy.textContent = ok ? 'Copied' : 'Select the Address Above'; setTimeout(function () { copy.textContent = 'Copy Email'; }, 2200); }
    try { navigator.clipboard.writeText(EMAIL).then(function () { done(true); }, function () { done(false); }); } catch (e) { done(false); }
  });
})();
