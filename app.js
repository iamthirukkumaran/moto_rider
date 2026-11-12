/* ============================================================
   MotoRiders — site behaviour
   Progressive enhancement: the page reads fine without any of it.
   ============================================================ */
(function () {
  'use strict';

  var root = document.documentElement;
  root.classList.add('js');

  var reduceMQ = window.matchMedia('(prefers-reduced-motion: reduce)');
  var darkMQ = window.matchMedia('(prefers-color-scheme: dark)');
  var reduce = function () { return reduceMQ.matches; };

  var NS = 'http://www.w3.org/2000/svg';
  function svgEl(name, attrs) {
    var n = document.createElementNS(NS, name);
    if (attrs) { for (var k in attrs) n.setAttribute(k, attrs[k]); }
    return n;
  }

  function onceInView(el, cb, threshold) {
    if (!el) return;
    if (!('IntersectionObserver' in window)) { cb(); return; }
    var o = new IntersectionObserver(function (entries) {
      entries.forEach(function (en) {
        if (!en.isIntersecting) return;
        o.disconnect();
        cb();
      });
    }, { threshold: threshold || 0.4 });
    o.observe(el);
  }

  /* ---------- 1. Theme ---------- */

  var STORE = 'motoriders-theme';
  var themeBtn = document.getElementById('themeBtn');
  var theme = 'auto';

  try { theme = localStorage.getItem(STORE) || 'auto'; } catch (e) { /* private mode */ }
  if (theme !== 'light' && theme !== 'dark') theme = 'auto';

  function resolved() {
    return theme === 'auto' ? (darkMQ.matches ? 'dark' : 'light') : theme;
  }

  function syncBrowserChrome() {
    // Once the user overrides the system theme the media-based theme-color
    // metas no longer describe the page, so replace them with one value.
    var metas = document.querySelectorAll('meta[name="theme-color"][media]');
    var i;
    if (theme === 'auto') {
      for (i = 0; i < metas.length; i++) {
        metas[i].setAttribute('content', metas[i].getAttribute('data-c') || metas[i].getAttribute('content'));
      }
      var old = document.querySelector('meta[name="theme-color"][data-dyn]');
      if (old) old.remove();
      return;
    }
    for (i = 0; i < metas.length; i++) {
      if (!metas[i].hasAttribute('data-c')) metas[i].setAttribute('data-c', metas[i].getAttribute('content'));
      metas[i].setAttribute('content', '');
    }
    var dyn = document.querySelector('meta[name="theme-color"][data-dyn]');
    if (!dyn) {
      dyn = document.createElement('meta');
      dyn.setAttribute('name', 'theme-color');
      dyn.setAttribute('data-dyn', '');
      document.head.appendChild(dyn);
    }
    dyn.setAttribute('content', getComputedStyle(document.body).backgroundColor);
  }

  function applyTheme(next, persist) {
    theme = next;
    if (theme === 'auto') root.removeAttribute('data-theme');
    else root.setAttribute('data-theme', theme);
    if (themeBtn) {
      themeBtn.setAttribute('aria-label',
        resolved() === 'dark' ? 'Switch to light theme' : 'Switch to dark theme');
    }
    if (persist) { try { localStorage.setItem(STORE, theme); } catch (e) {} }
    syncBrowserChrome();
  }

  applyTheme(theme, false);

  if (themeBtn) {
    themeBtn.addEventListener('click', function () {
      applyTheme(resolved() === 'dark' ? 'light' : 'dark', true);
    });
  }
  if (darkMQ.addEventListener) {
    darkMQ.addEventListener('change', function () { if (theme === 'auto') applyTheme('auto', false); });
  }

  /* ---------- 2. Nav material appears once content is behind it ---------- */

  var nav = document.getElementById('nav');
  if (nav) {
    var stuck = false;
    var onScroll = function () {
      var next = window.scrollY > 6;
      if (next !== stuck) { stuck = next; nav.classList.toggle('is-stuck', stuck); }
    };
    window.addEventListener('scroll', onScroll, { passive: true });
    onScroll();
  }

  /* ---------- 3. Scroll reveal (once, staggered) ---------- */

  var revealables = document.querySelectorAll('.reveal');
  if (!('IntersectionObserver' in window)) {
    for (var r = 0; r < revealables.length; r++) revealables[r].classList.add('is-in');
  } else {
    var revealObs = new IntersectionObserver(function (entries) {
      entries.forEach(function (en) {
        if (!en.isIntersecting) return;
        en.target.classList.add('is-in');
        revealObs.unobserve(en.target);
      });
    }, { rootMargin: '0px 0px -10% 0px', threshold: 0.1 });
    for (var i2 = 0; i2 < revealables.length; i2++) revealObs.observe(revealables[i2]);
  }

  /* ---------- 4. Hero: five riders on one route ---------- */

  var RIDERS = [
    { name: 'Arjun',  i: 'A', state: 'Leading',        color: 'var(--accent)', p: 0.88, v: 0.0118, tag: true },
    { name: 'Ravi',   i: 'R', state: 'Riding',         color: 'var(--green)',  p: 0.72, v: 0.0114 },
    { name: 'Sana',   i: 'S', state: 'Riding',         color: 'var(--green)',  p: 0.63, v: 0.0112 },
    { name: 'Meera',  i: 'M', state: 'On a break',     color: 'var(--blue)',   p: 0.40, v: 0, tag: true },
    { name: 'Vikram', i: 'V', state: 'Falling behind', color: 'var(--yellow)', p: 0.28, v: 0.0100 }
  ];

  /* Label sides are chosen per stop so a plate never lies along the road. */
  var STOPS = [
    { p: 0,    kind: 'end',  color: 'var(--green)' },
    { p: 0.19, label: 'Tea · 20m',  color: 'var(--accent-2)', side: 'right' },
    { p: 0.40, label: 'Fuel · 10m', color: 'var(--blue)',     side: 'left'  },
    { p: 0.68, label: 'Food · 45m', color: 'var(--green)',    side: 'right' },
    { p: 1,    kind: 'end',  color: 'var(--accent)' }
  ];

  var routePath = document.getElementById('routePath');
  var riderLayer = document.getElementById('riderLayer');
  var stopLayer = document.getElementById('stopLayer');
  var roster = document.getElementById('roster');

  if (routePath && riderLayer && stopLayer && routePath.getTotalLength) {
    var LEN = routePath.getTotalLength();
    var at = function (p) { return routePath.getPointAtLength(Math.max(0, Math.min(1, p)) * LEN); };

    /* Stops */
    STOPS.forEach(function (s) {
      var pt = at(s.p);
      var g = svgEl('g', { transform: 'translate(' + pt.x.toFixed(1) + ',' + pt.y.toFixed(1) + ')' });
      var isEnd = s.kind === 'end';

      g.appendChild(svgEl('circle', { r: isEnd ? 8 : 6.6, class: 'stop__ring' }));
      var inner = svgEl('circle', { r: isEnd ? 3.6 : 2.8 });
      inner.style.fill = s.color;
      g.appendChild(inner);

      if (s.label) {
        var w = s.label.length * 4.6 + 15;
        var plate = svgEl('g', {
          transform: 'translate(' + (s.side === 'left' ? -(w + 11) : 11) + ',0)'
        });
        plate.appendChild(svgEl('rect', { class: 'stop__plate', x: 0, y: -8.5, width: w.toFixed(1), height: 17, rx: 8.5 }));
        var lbl = svgEl('text', { class: 'stop__label', x: 7.5, y: 0.5 });
        lbl.textContent = s.label;
        plate.appendChild(lbl);
        g.appendChild(plate);
      }
      stopLayer.appendChild(g);
    });

    /* Riders */
    RIDERS.forEach(function (rd) {
      var g = svgEl('g', { class: 'rider' });

      var halo = svgEl('circle', { r: 14, class: 'rider__halo' });
      halo.style.fill = rd.color;
      g.appendChild(halo);

      var puck = svgEl('circle', { r: 8.5, class: 'rider__puck' });
      puck.style.fill = rd.color;
      g.appendChild(puck);

      var init = svgEl('text', { class: 'rider__initial', y: 0.5 });
      init.textContent = rd.i;
      g.appendChild(init);

      if (rd.tag) {
        var w = rd.name.length * 5.1 + 18;
        var tg = svgEl('g', { class: 'rider__tagwrap' });
        tg.appendChild(svgEl('rect', { class: 'rider__tag', x: 0, y: -9, width: w.toFixed(1), height: 18, rx: 9 }));
        var nm = svgEl('text', { class: 'rider__name', x: 9, y: 0.5 });
        nm.textContent = rd.name;
        tg.appendChild(nm);
        g.appendChild(tg);
        rd._tag = tg;
        rd._tagW = w;
      }

      riderLayer.appendChild(g);
      rd._g = g;
      rd._p = rd.p;
    });

    var place = function (rd) {
      var pt = at(rd._p);
      rd._g.setAttribute('transform', 'translate(' + pt.x.toFixed(2) + ',' + pt.y.toFixed(2) + ')');
      if (rd._tag) {
        var flip = pt.x > 196;
        rd._tag.setAttribute('transform',
          'translate(' + (flip ? -(rd._tagW + 13) : 13) + ',-15)');
      }
      // Fade across the wrap so the loop has no visible seam.
      var edge = Math.min(rd._p, 1 - rd._p);
      rd._g.style.opacity = rd.v === 0 ? 1 : Math.min(1, edge / 0.05).toFixed(3);
    };

    RIDERS.forEach(place);

    /* Roster inside the bottom sheet */
    if (roster) {
      RIDERS.forEach(function (rd) {
        var row = document.createElement('div');
        row.className = 'roster__row';
        var dot = document.createElement('span');
        dot.className = 'roster__dot';
        dot.style.background = rd.color;
        var name = document.createElement('span');
        name.className = 'roster__name';
        name.textContent = rd.name;
        var state = document.createElement('span');
        state.className = 'roster__state';
        state.textContent = rd.state;
        row.appendChild(dot); row.appendChild(name); row.appendChild(state);
        roster.appendChild(row);
      });
    }

    /* Animate — explanatory motion, so it may run long and slow.
       Paused when off-screen, on a hidden tab, or under reduced motion. */
    var raf = 0, last = 0, visible = true;

    var tick = function (now) {
      var dt = last ? Math.min(now - last, 60) / 1000 : 0;
      last = now;
      for (var k = 0; k < RIDERS.length; k++) {
        var rd = RIDERS[k];
        if (rd.v === 0) continue;
        rd._p += rd.v * dt;
        if (rd._p > 1) rd._p -= 1;
        place(rd);
      }
      raf = requestAnimationFrame(tick);
    };

    var start = function () {
      if (raf || reduce() || document.hidden || !visible) return;
      last = 0;
      raf = requestAnimationFrame(tick);
    };
    var stop = function () {
      if (!raf) return;
      cancelAnimationFrame(raf);
      raf = 0;
    };

    if ('IntersectionObserver' in window) {
      new IntersectionObserver(function (entries) {
        visible = entries[0].isIntersecting;
        if (visible) start(); else stop();
      }, { threshold: 0 }).observe(document.getElementById('heroMap'));
    } else {
      start();
    }

    document.addEventListener('visibilitychange', function () {
      if (document.hidden) stop(); else start();
    });
    if (reduceMQ.addEventListener) {
      reduceMQ.addEventListener('change', function () { reduce() ? stop() : start(); });
    }
    start();
  }

  /* ---------- 5. The invite QR ---------- */

  // Decorative, not a real payload — a plausible module grid so the phone
  // screen reads as an invite rather than a grey square.
  var qrBox = document.getElementById('qr');
  if (qrBox) {
    var N = 25, seed = 0x5bd1;
    var rand = function () {
      // xorshift: a fixed pattern, so the code never reflows between loads
      seed ^= seed << 7; seed ^= seed >>> 9; seed ^= seed << 8;
      return (seed >>> 0) / 4294967296;
    };
    var finder = function (x, y, cx, cy) {
      var dx = Math.abs(x - cx), dy = Math.abs(y - cy), d = Math.max(dx, dy);
      if (d > 3) return null;
      return d === 1 ? 0 : 1;          // ring, gap, core
    };
    var d = '';
    for (var y = 0; y < N; y++) {
      for (var x = 0; x < N; x++) {
        var f = finder(x, y, 3, 3);
        if (f === null) f = finder(x, y, N - 4, 3);
        if (f === null) f = finder(x, y, 3, N - 4);
        var on = f === null ? rand() > 0.52 : f === 1;
        if (on) d += 'M' + x + ' ' + y + 'h1v1h-1z';
      }
    }
    var svg = svgEl('svg', { viewBox: '-1 -1 ' + (N + 2) + ' ' + (N + 2), width: 168, height: 168 });
    svg.appendChild(svgEl('path', { d: d, fill: '#0A0A0A' }));
    qrBox.appendChild(svg);
  }

  /* ---------- 6. Create / Join ---------- */

  var sw = document.getElementById('switch');
  if (sw) {
    var tabs = Array.prototype.slice.call(sw.querySelectorAll('[role="tab"]'));
    var panes = Array.prototype.slice.call(document.querySelectorAll('[data-pane]'));

    var show = function (name, focus) {
      sw.style.setProperty('--on', name === 'join' ? 1 : 0);

      tabs.forEach(function (t) {
        var on = t.id === 'tab-' + name;
        t.setAttribute('aria-selected', String(on));
        t.tabIndex = on ? 0 : -1;
        if (on && focus) t.focus();
      });

      panes.forEach(function (p) {
        var on = p.getAttribute('data-pane') === name;
        if (on) {
          p.hidden = false;
          // It was display:none, so the reveal observer never fired on it.
          p.classList.add('is-in');
          // Let the element lay out before the class drives the transition.
          requestAnimationFrame(function () { p.classList.add('is-on'); });
        } else {
          p.classList.remove('is-on');
          if (p.classList.contains('scr')) {
            // The screen cross-fades; the list in the copy can go at once.
            setTimeout(function () { if (!p.classList.contains('is-on')) p.hidden = true; }, reduce() ? 180 : 280);
          } else {
            p.hidden = true;
          }
        }
      });
    };

    tabs.forEach(function (t) {
      t.addEventListener('click', function () { show(t.id.replace('tab-', ''), false); });
      t.addEventListener('keydown', function (e) {
        var k = e.key, i = tabs.indexOf(t), n = tabs.length;
        if (k !== 'ArrowRight' && k !== 'ArrowLeft' && k !== 'Home' && k !== 'End') return;
        e.preventDefault();
        var next = k === 'ArrowRight' ? (i + 1) % n
                 : k === 'ArrowLeft'  ? (i - 1 + n) % n
                 : k === 'Home'       ? 0 : n - 1;
        show(tabs[next].id.replace('tab-', ''), true);
      });
    });

    show('create', false);
  }

  /* ---------- 7. The odometer ---------- */

  var ODO = [
    { el: document.getElementById('odoNum'),   to: 12480 },
    { el: document.getElementById('odoRides'), to: 128 },
    { el: document.getElementById('odoGroup'), to: 7360 },
    { el: document.getElementById('odoSolo'),  to: 5120 }
  ];
  var fmt = function (n) { return n.toLocaleString('en-IN'); };

  onceInView(document.getElementById('odo'), function () {
    ODO.forEach(function (o, idx) {
      if (!o.el) return;
      if (reduce()) { o.el.textContent = fmt(o.to); return; }
      var dur = 1400, started = 0;
      setTimeout(function () {
        var step = function (now) {
          if (!started) started = now;
          var t = Math.min((now - started) / dur, 1);
          var eased = 1 - Math.pow(1 - t, 4);   // fast, then settles like a trip meter
          o.el.textContent = fmt(Math.round(o.to * eased));
          if (t < 1) requestAnimationFrame(step);
        };
        requestAnimationFrame(step);
      }, idx * 80);
    });
  }, 0.35);

  /* ---------- 8. SOS hold ---------- */

  var sosArc = document.getElementById('sosArc');
  var sosNum = document.getElementById('sosNum');

  if (sosArc && sosNum) {
    var DASH = 327, SECS = 3;

    var runSos = function () {
      if (reduce()) {
        sosArc.style.transition = 'none';
        sosArc.style.strokeDashoffset = '0';
        sosNum.textContent = '0';
        return;
      }
      sosArc.style.transition = 'none';
      sosArc.style.strokeDashoffset = DASH;
      sosNum.textContent = SECS;
      // Reflow so the reset is painted before the fill starts.
      void sosArc.getBoundingClientRect();
      sosArc.style.transition = 'stroke-dashoffset ' + (SECS * 1000) + 'ms linear';
      sosArc.style.strokeDashoffset = '0';

      var left = SECS;
      var iv = setInterval(function () {
        left -= 1;
        sosNum.textContent = Math.max(left, 0);
        if (left <= 0) clearInterval(iv);
      }, 1000);
    };

    // Runs each time the card comes back into view, not on a loop.
    if ('IntersectionObserver' in window) {
      var armed = true;
      new IntersectionObserver(function (entries) {
        entries.forEach(function (en) {
          if (en.isIntersecting && armed) { armed = false; runSos(); }
          else if (!en.isIntersecting) { armed = true; }
        });
      }, { threshold: 0.5 }).observe(document.getElementById('sos'));
    } else {
      runSos();
    }
  }
})();
