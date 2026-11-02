/* ============================================================
   MotoRiders — site behaviour
   Progressive enhancement: nothing here is required to read
   the page. JS only adds motion, theming and the accordion.
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

  /* ---------- 1. Theme (light / auto / dark) ---------- */

  var STORE = 'motoriders-theme';
  var seg = document.getElementById('seg');
  var themeBtn = document.getElementById('themeBtn');
  var SEG_INDEX = { light: 0, auto: 1, dark: 2 };
  var theme = 'auto';

  try { theme = localStorage.getItem(STORE) || 'auto'; } catch (e) { /* private mode */ }
  if (!SEG_INDEX.hasOwnProperty(theme)) theme = 'auto';

  function resolved() {
    return theme === 'auto' ? (darkMQ.matches ? 'dark' : 'light') : theme;
  }

  function syncBrowserChrome() {
    // When the user overrides the system theme, the media-based theme-color
    // metas no longer describe the page — replace them with a single value.
    var metas = document.querySelectorAll('meta[name="theme-color"]');
    var i;
    if (theme === 'auto') {
      for (i = 0; i < metas.length; i++) metas[i].removeAttribute('data-off');
      return;
    }
    for (i = 0; i < metas.length; i++) {
      if (metas[i].hasAttribute('media')) metas[i].setAttribute('content', '');
    }
    var bg = getComputedStyle(document.body).backgroundColor;
    var dyn = document.querySelector('meta[name="theme-color"][data-dyn]');
    if (!dyn) {
      dyn = document.createElement('meta');
      dyn.setAttribute('name', 'theme-color');
      dyn.setAttribute('data-dyn', '');
      document.head.appendChild(dyn);
    }
    dyn.setAttribute('content', bg);
  }

  function applyTheme(next, persist) {
    theme = next;
    if (theme === 'auto') root.removeAttribute('data-theme');
    else root.setAttribute('data-theme', theme);

    if (seg) {
      seg.style.setProperty('--seg', SEG_INDEX[theme]);
      var btns = seg.querySelectorAll('button[data-theme-set]');
      for (var i = 0; i < btns.length; i++) {
        btns[i].setAttribute('aria-pressed', String(btns[i].getAttribute('data-theme-set') === theme));
      }
    }
    if (themeBtn) {
      themeBtn.setAttribute('aria-label',
        resolved() === 'dark' ? 'Switch to light theme' : 'Switch to dark theme');
    }
    if (persist) { try { localStorage.setItem(STORE, theme); } catch (e) {} }
    syncBrowserChrome();
  }

  applyTheme(theme, false);

  if (seg) {
    seg.addEventListener('click', function (e) {
      var b = e.target.closest('button[data-theme-set]');
      if (b) applyTheme(b.getAttribute('data-theme-set'), true);
    });
  }
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
    }, { rootMargin: '0px 0px -12% 0px', threshold: 0.12 });

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

  /* ---------- 5. Feature tour: tabs drive the phone screen ---------- */

  var tourNav = document.querySelector('.tour__nav');

  if (tourNav) {
    var tabs = Array.prototype.slice.call(tourNav.querySelectorAll('[role="tab"]'));
    var panelOf = function (tab) { return document.getElementById(tab.getAttribute('aria-controls')); };
    var hideTimer = 0;

    var select = function (tab, focus) {
      if (tab.getAttribute('aria-selected') === 'true') return;

      tabs.forEach(function (t) {
        var panel = panelOf(t);
        var on = t === tab;
        t.setAttribute('aria-selected', String(on));
        t.tabIndex = on ? 0 : -1;
        if (!panel) return;
        if (on) {
          panel.hidden = false;
          // Let the browser lay the panel out before it transitions in.
          requestAnimationFrame(function () {
            requestAnimationFrame(function () { panel.classList.add('is-active'); });
          });
        } else {
          panel.classList.remove('is-active');
        }
      });

      // Keep the outgoing screen in the flow until its fade finishes.
      clearTimeout(hideTimer);
      hideTimer = setTimeout(function () {
        tabs.forEach(function (t) {
          var panel = panelOf(t);
          if (panel && !panel.classList.contains('is-active')) panel.hidden = true;
        });
      }, reduce() ? 0 : 300);

      if (focus) tab.focus();
      onPanelShown(tab.getAttribute('aria-controls'));
    };

    tabs.forEach(function (tab) {
      tab.addEventListener('click', function () { select(tab, false); });
      tab.addEventListener('keydown', function (e) {
        var i = tabs.indexOf(tab), next = null;
        if (e.key === 'ArrowDown' || e.key === 'ArrowRight') next = tabs[(i + 1) % tabs.length];
        else if (e.key === 'ArrowUp' || e.key === 'ArrowLeft') next = tabs[(i - 1 + tabs.length) % tabs.length];
        else if (e.key === 'Home') next = tabs[0];
        else if (e.key === 'End') next = tabs[tabs.length - 1];
        if (!next) return;
        e.preventDefault();
        select(next, true);
      });
    });
  }

  /* ---------- 6. Screens that come alive when their tab is opened ---------- */

  var sos = document.getElementById('sos');
  var sosNum = document.getElementById('sosNum');
  var sosTimer = 0;

  function runSos() {
    if (!sos || !sosNum) return;
    clearInterval(sosTimer);
    sos.classList.remove('is-running');
    sosNum.textContent = '10';
    // Reflow so the ring animation restarts rather than continuing.
    void sos.offsetWidth;
    sos.classList.add('is-running');
    var n = 10;
    sosTimer = setInterval(function () {
      n -= 1;
      sosNum.textContent = n;
      if (n <= 0) clearInterval(sosTimer);
    }, 1000);
  }

  var codePlate = document.getElementById('codePlate');

  function popCode() {
    if (!codePlate || reduce()) return;
    codePlate.classList.add('is-pop');
    setTimeout(function () { codePlate.classList.remove('is-pop'); }, 420);
  }

  var tabbar = document.getElementById('tabbar');
  var BAR = {
    'p-plan': 'plan', 'p-invite': 'plan',
    'p-map': 'ride', 'p-nav': 'ride', 'p-alerts': 'ride', 'p-sos': 'ride', 'p-breaks': 'ride',
    'p-report': 'reports', 'p-garage': 'you'
  };

  function onPanelShown(id) {
    if (tabbar && BAR[id]) tabbar.setAttribute('data-on', BAR[id]);
    if (id === 'p-sos') runSos();
    if (id === 'p-invite') popCode();
  }

  /* ---------- 8. FAQ accordion ---------- */

  var acc = document.getElementById('acc');
  if (acc) {
    acc.addEventListener('click', function (e) {
      var btn = e.target.closest('.acc__btn');
      if (!btn) return;
      var item = btn.closest('.acc__item');
      var panel = document.getElementById(btn.getAttribute('aria-controls'));
      if (!item || !panel) return;

      var open = item.classList.contains('is-open');

      if (open) {
        item.classList.remove('is-open');
        btn.setAttribute('aria-expanded', 'false');
        var hide = function () { if (!item.classList.contains('is-open')) panel.hidden = true; };
        if (reduce()) hide(); else setTimeout(hide, 300);
      } else {
        panel.hidden = false;
        // Let the browser lay the panel out before transitioning its rows.
        requestAnimationFrame(function () {
          requestAnimationFrame(function () {
            item.classList.add('is-open');
            btn.setAttribute('aria-expanded', 'true');
          });
        });
      }
    });
  }

  /* ---------- 9. Device parallax — decorative, pointer-only ---------- */

  var device = document.getElementById('heroDevice');
  if (device && window.matchMedia('(hover: hover) and (pointer: fine)').matches) {
    var hero = document.querySelector('.hero');
    var tx = 0, ty = 0, cx = 0, cy = 0, pr = 0;

    var render = function () {
      // Spring-ish easing toward the pointer so the tilt has momentum
      // instead of snapping, which reads as artificial.
      cx += (tx - cx) * 0.08;
      cy += (ty - cy) * 0.08;
      device.style.transform =
        'perspective(1400px) rotateY(' + (-9 + cx * 4).toFixed(2) + 'deg) ' +
        'rotateX(' + (2.5 - cy * 3).toFixed(2) + 'deg) translateZ(0)';
      if (Math.abs(tx - cx) > 0.001 || Math.abs(ty - cy) > 0.001) {
        pr = requestAnimationFrame(render);
      } else { pr = 0; }
    };

    hero.addEventListener('pointermove', function (e) {
      if (reduce() || e.pointerType !== 'mouse') return;
      var b = hero.getBoundingClientRect();
      tx = (e.clientX - b.left) / b.width * 2 - 1;
      ty = (e.clientY - b.top) / b.height * 2 - 1;
      if (!pr) pr = requestAnimationFrame(render);
    });
    hero.addEventListener('pointerleave', function () {
      tx = 0; ty = 0;
      if (!pr) pr = requestAnimationFrame(render);
    });
  }
})();
