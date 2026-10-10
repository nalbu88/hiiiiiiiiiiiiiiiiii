/* ==========================================================================
   Grünhan – Interaktionen
   ========================================================================== */
(function () {
  'use strict';

  /* ---------- Einstellungen (vor Veröffentlichung anpassen) ---------- */
  var CONFIG = {
    email: 'hallo@gruenhan.de' // PLATZHALTER: echte Adresse eintragen
  };

  var $ = function (s, r) { return (r || document).querySelector(s); };
  var $$ = function (s, r) { return Array.prototype.slice.call((r || document).querySelectorAll(s)); };
  var reduceMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  var finePointer = window.matchMedia('(hover: hover) and (pointer: fine)').matches;
  var U = window.GH_UTIL;

  function store(key, val) {
    try {
      if (val === undefined) return window.localStorage.getItem(key);
      window.localStorage.setItem(key, val);
    } catch (e) { return null; }
    return null;
  }

  var toastEl = $('#toast'), toastT;
  function toast(msg) {
    if (!toastEl) return;
    toastEl.textContent = msg;
    toastEl.classList.add('is-on');
    clearTimeout(toastT);
    toastT = setTimeout(function () { toastEl.classList.remove('is-on'); }, 2600);
  }

  function copyText(text, okMsg, fallbackEl) {
    var done = function () { toast(okMsg); };
    var fail = function () {
      if (fallbackEl) {
        var range = document.createRange();
        range.selectNodeContents(fallbackEl);
        var sel = window.getSelection(); sel.removeAllRanges(); sel.addRange(range);
        toast('Text markiert – jetzt mit Strg/Cmd + C kopieren.');
      } else toast('Kopieren nicht möglich – bitte manuell markieren.');
    };
    try {
      if (navigator.clipboard && navigator.clipboard.writeText) navigator.clipboard.writeText(text).then(done, fail);
      else fail();
    } catch (e) { fail(); }
  }

  /* ======================================================================
     Header, Fortschritt, Navigation
     ====================================================================== */
  var header = $('.site-header'), bar = $('.progress__bar'), toTop = $('#to-top');
  var lastY = window.scrollY, ticking = false;
  function onScroll() {
    var y = window.scrollY, h = document.documentElement.scrollHeight - window.innerHeight;
    if (bar) bar.style.transform = 'scaleX(' + (h > 0 ? Math.min(1, y / h) : 0) + ')';
    if (header) {
      header.classList.toggle('is-scrolled', y > 10);
      var menuOpen = document.body.classList.contains('menu-open');
      header.classList.toggle('is-hidden', !menuOpen && y > 400 && y > lastY + 4);
      if (y < lastY - 4) header.classList.remove('is-hidden');
    }
    if (toTop) toTop.classList.toggle('is-on', y > 900);
    updateSteps();
    lastY = y; ticking = false;
  }
  window.addEventListener('scroll', function () { if (!ticking) { ticking = true; requestAnimationFrame(onScroll); } }, { passive: true });

  // Aktiver Navigationspunkt
  var navLinks = $$('.nav a');
  if ('IntersectionObserver' in window && navLinks.length) {
    var navIO = new IntersectionObserver(function (entries) {
      entries.forEach(function (en) {
        if (!en.isIntersecting) return;
        navLinks.forEach(function (a) { a.classList.toggle('is-current', a.getAttribute('href') === '#' + en.target.id); });
      });
    }, { rootMargin: '-45% 0px -50% 0px' });
    navLinks.forEach(function (a) { var t = $(a.getAttribute('href')); if (t) navIO.observe(t); });
  }

  // Mobiles Menü
  var menuBtn = $('.menu-toggle'), menu = $('#mobile-menu');
  function setMenu(open) {
    if (!menuBtn || !menu) return;
    menuBtn.setAttribute('aria-expanded', open ? 'true' : 'false');
    menuBtn.setAttribute('aria-label', open ? 'Menü schließen' : 'Menü öffnen');
    menu.classList.toggle('is-open', open);
    menu.setAttribute('aria-hidden', open ? 'false' : 'true');
    document.body.classList.toggle('menu-open', open);
    if (open) { header.classList.remove('is-hidden'); var f = $('a', menu); if (f) setTimeout(function () { f.focus(); }, 300); }
  }
  if (menuBtn) menuBtn.addEventListener('click', function () { setMenu(menuBtn.getAttribute('aria-expanded') !== 'true'); });
  $$('#mobile-menu a').forEach(function (a) { a.addEventListener('click', function () { setMenu(false); }); });
  document.addEventListener('keydown', function (e) { if (e.key === 'Escape' && document.body.classList.contains('menu-open')) { setMenu(false); menuBtn.focus(); } });

  // Lineal im Hero
  var ruler = $('.ruler'), rulerMarks = $('.ruler__marks'), rulerCursor = $('.ruler__cursor');
  if (ruler && rulerMarks) {
    var marks = '';
    for (var m = 0; m <= 2400; m += 100) marks += '<span style="left:' + m + 'px">' + m + '</span>';
    rulerMarks.innerHTML = marks;
    var hero = $('.hero');
    hero.addEventListener('pointermove', function (e) {
      var r = ruler.getBoundingClientRect(), x = Math.round(e.clientX - r.left);
      if (x < 0 || x > r.width) return;
      rulerCursor.style.left = x + 'px';
      rulerCursor.setAttribute('data-x', x + ' px');
    });
  }

  // Überschrift im Hero: nach der Einblendung Tooltip nicht mehr abschneiden
  var h1 = $('.h1');
  if (h1) setTimeout(function () { h1.classList.add('is-ready'); }, reduceMotion ? 0 : 1400);
  var styleReady = document.createElement('style');
  styleReady.textContent = '.h1.is-ready .line{overflow:visible}';
  document.head.appendChild(styleReady);

  // Begriffe mit Erklärung (Tippen auf Touchgeräten)
  $$('.term').forEach(function (t) {
    t.addEventListener('click', function (e) { e.stopPropagation(); t.classList.toggle('is-open'); });
    t.addEventListener('keydown', function (e) { if (e.key === 'Escape') t.classList.remove('is-open'); });
  });
  document.addEventListener('click', function () { $$('.term.is-open').forEach(function (t) { t.classList.remove('is-open'); }); });

  /* ======================================================================
     Hochdeutsch ⇄ Schwäbisch
     ====================================================================== */
  var dialectBtn = $('#dialect-toggle');
  function setDialect(on, silent) {
    $$('[data-swb]').forEach(function (el) {
      if (el.dataset.hd === undefined) el.dataset.hd = el.innerHTML;
      el.innerHTML = on ? el.getAttribute('data-swb') : el.dataset.hd;
    });
    if (dialectBtn) {
      dialectBtn.setAttribute('aria-pressed', on ? 'true' : 'false');
      var sr = $('.sr-only', dialectBtn);
      if (sr) sr.textContent = on ? 'Sprache der Überschriften: zurück zu Hochdeutsch' : 'Sprache der Überschriften: Schwäbisch einschalten';
    }
    document.documentElement.classList.toggle('is-swabian', on);
    store('gh-dialect', on ? '1' : '0');
    if (!silent) toast(on ? 'Hajo! Jetzt schwätzet mir Schwäbisch.' : 'Zurück zu Hochdeutsch. Ade, Dialekt!');
  }
  if (dialectBtn) {
    dialectBtn.addEventListener('click', function () { setDialect(dialectBtn.getAttribute('aria-pressed') !== 'true'); });
    if (store('gh-dialect') === '1') setDialect(true, true);
  }

  /* ======================================================================
     Zeichenstift-Spielwiese (Hero)
     ====================================================================== */
  (function pen() {
    var svg = $('#pen-svg');
    if (!svg) return;
    var NS = 'http://www.w3.org/2000/svg';
    var CX = 300, CY = 262;
    function makeShape(radii, jitter) {
      var n = radii.length, pts = [];
      for (var i = 0; i < n; i++) {
        var a = -Math.PI / 2 + i * Math.PI * 2 / n + (jitter ? jitter[i] : 0), r = radii[i];
        var x = CX + Math.cos(a) * r, y = CY + Math.sin(a) * r * 0.92;
        var tx = -Math.sin(a), ty = Math.cos(a), hl = r * 0.4;
        pts.push({ x: x, y: y, ix: x - tx * hl, iy: y - ty * hl * 0.92, ox: x + tx * hl, oy: y + ty * hl * 0.92 });
      }
      return pts;
    }
    var DEFAULT = makeShape([196, 150, 206, 168, 192, 140], [0, 0.08, -0.05, 0.04, -0.06, 0.1]);
    var pts = JSON.parse(JSON.stringify(DEFAULT));
    var fill = '#1FA15A', view = 'edit', sel = 0, dragging = null;

    svg.innerHTML =
      '<circle cx="478" cy="96" r="54" fill="#D8C69C"/>' +
      '<path class="shape" id="pen-shape" fill="' + fill + '"/>' +
      '<g id="pen-dim" font-family="JetBrains Mono, monospace" font-size="11" fill="#B3243E"></g>' +
      '<rect class="bbox" id="pen-bbox"/>' +
      '<g id="pen-ctrl"></g>';
    var shape = $('#pen-shape', svg), ctrl = $('#pen-ctrl', svg), bbox = $('#pen-bbox', svg), dim = $('#pen-dim', svg);
    var hint = $('#pen-hint');
    var rx = $('#pen-x'), ry = $('#pen-y'), rw = $('#pen-w'), rh = $('#pen-h');

    function d() {
      var s = 'M' + pts[0].x.toFixed(1) + ',' + pts[0].y.toFixed(1);
      for (var i = 0; i < pts.length; i++) {
        var a = pts[i], b = pts[(i + 1) % pts.length];
        s += 'C' + a.ox.toFixed(1) + ',' + a.oy.toFixed(1) + ' ' + b.ix.toFixed(1) + ',' + b.iy.toFixed(1) + ' ' + b.x.toFixed(1) + ',' + b.y.toFixed(1);
      }
      return s + 'Z';
    }
    function buildCtrl() {
      var h = '';
      pts.forEach(function (p, i) {
        h += '<line class="handle-line" data-l="' + i + 'i"/><line class="handle-line" data-l="' + i + 'o"/>';
      });
      pts.forEach(function (p, i) {
        h += '<circle class="hit" r="16" data-i="' + i + '" data-k="i"/><circle class="handle" r="5" data-i="' + i + '" data-k="i"/>';
        h += '<circle class="hit" r="16" data-i="' + i + '" data-k="o"/><circle class="handle" r="5" data-i="' + i + '" data-k="o"/>';
      });
      pts.forEach(function (p, i) {
        h += '<circle class="hit" r="20" data-i="' + i + '" data-k="a"/><rect class="anchor" width="11" height="11" data-i="' + i + '" data-k="a" tabindex="0" role="slider" aria-label="Ankerpunkt ' + (i + 1) + ' – mit Pfeiltasten verschieben"/>';
      });
      ctrl.innerHTML = h;
    }
    function draw() {
      shape.setAttribute('d', d());
      $$('.handle-line', ctrl).forEach(function (l) {
        var k = l.getAttribute('data-l'), p = pts[parseInt(k, 10)], hx = k.slice(-1) === 'i' ? p.ix : p.ox, hy = k.slice(-1) === 'i' ? p.iy : p.oy;
        l.setAttribute('x1', p.x); l.setAttribute('y1', p.y); l.setAttribute('x2', hx); l.setAttribute('y2', hy);
      });
      $$('[data-k]', ctrl).forEach(function (el) {
        var p = pts[+el.getAttribute('data-i')], k = el.getAttribute('data-k');
        var x = k === 'a' ? p.x : (k === 'i' ? p.ix : p.ox), y = k === 'a' ? p.y : (k === 'i' ? p.iy : p.oy);
        if (el.tagName === 'rect') { el.setAttribute('x', x - 5.5); el.setAttribute('y', y - 5.5); el.style.fill = +el.getAttribute('data-i') === sel ? '#B3243E' : '#fff'; el.style.stroke = '#B3243E'; }
        else { el.setAttribute('cx', x); el.setAttribute('cy', y); }
      });
      var b = shape.getBBox();
      bbox.setAttribute('x', b.x); bbox.setAttribute('y', b.y); bbox.setAttribute('width', b.width); bbox.setAttribute('height', b.height);
      var dy = Math.min(504, b.y + b.height + 22);
      dim.innerHTML = '<line x1="' + b.x + '" x2="' + (b.x + b.width) + '" y1="' + dy + '" y2="' + dy + '" stroke="#B3243E" stroke-width="1"/>' +
        '<line x1="' + b.x + '" x2="' + b.x + '" y1="' + (dy - 6) + '" y2="' + (dy + 6) + '" stroke="#B3243E"/><line x1="' + (b.x + b.width) + '" x2="' + (b.x + b.width) + '" y1="' + (dy - 6) + '" y2="' + (dy + 6) + '" stroke="#B3243E"/>' +
        '<rect x="' + (b.x + b.width / 2 - 34) + '" y="' + (dy - 9) + '" width="68" height="18" fill="#F7F8F4"/><text x="' + (b.x + b.width / 2) + '" y="' + (dy + 4) + '" text-anchor="middle">' + Math.round(b.width) + ' px</text>';
      var p = pts[sel];
      rx.textContent = Math.round(p.x); ry.textContent = Math.round(p.y); rw.textContent = Math.round(b.width); rh.textContent = Math.round(b.height);
    }
    function svgPoint(e) {
      var pt = svg.createSVGPoint(); pt.x = e.clientX; pt.y = e.clientY;
      return pt.matrixTransform(svg.getScreenCTM().inverse());
    }
    function clamp(v, a, b) { return Math.max(a, Math.min(b, v)); }
    function moveAnchor(i, dx, dy) { var p = pts[i]; p.x += dx; p.y += dy; p.ix += dx; p.iy += dy; p.ox += dx; p.oy += dy; }
    buildCtrl(); draw();

    ctrl.addEventListener('pointerdown', function (e) {
      var t = e.target.closest('[data-k]');
      if (!t || view === 'preview') return;
      e.preventDefault();
      var i = +t.getAttribute('data-i');
      sel = i;
      dragging = { i: i, k: t.getAttribute('data-k'), last: svgPoint(e), id: e.pointerId, alt: e.altKey };
      try { t.setPointerCapture(e.pointerId); } catch (err) { /* ignorieren */ }
      svg.classList.add('is-drag');
      if (hint) hint.classList.add('is-gone');
      draw();
    });
    ctrl.addEventListener('pointermove', function (e) {
      if (!dragging || e.pointerId !== dragging.id) return;
      var pt = svgPoint(e);
      pt.x = clamp(pt.x, 6, 594); pt.y = clamp(pt.y, 6, 510);
      var p = pts[dragging.i];
      if (dragging.k === 'a') moveAnchor(dragging.i, pt.x - p.x, pt.y - p.y);
      else {
        var mine = dragging.k, other = mine === 'i' ? 'o' : 'i';
        p[mine + 'x'] = pt.x; p[mine + 'y'] = pt.y;
        if (!e.altKey) {
          var len = Math.hypot(p[other + 'x'] - p.x, p[other + 'y'] - p.y);
          var vx = p.x - pt.x, vy = p.y - pt.y, vl = Math.hypot(vx, vy) || 1;
          p[other + 'x'] = p.x + vx / vl * len; p[other + 'y'] = p.y + vy / vl * len;
        }
      }
      draw();
    });
    function endDrag() { dragging = null; svg.classList.remove('is-drag'); }
    ctrl.addEventListener('pointerup', endDrag);
    ctrl.addEventListener('pointercancel', endDrag);
    ctrl.addEventListener('keydown', function (e) {
      var t = e.target.closest('[data-k="a"]');
      if (!t) return;
      var step = e.shiftKey ? 20 : 5, dx = 0, dy = 0;
      if (e.key === 'ArrowLeft') dx = -step; else if (e.key === 'ArrowRight') dx = step; else if (e.key === 'ArrowUp') dy = -step; else if (e.key === 'ArrowDown') dy = step; else return;
      e.preventDefault();
      sel = +t.getAttribute('data-i');
      moveAnchor(sel, dx, dy);
      if (hint) hint.classList.add('is-gone');
      draw();
    });
    ctrl.addEventListener('focusin', function (e) { var t = e.target.closest('[data-k="a"]'); if (t) { sel = +t.getAttribute('data-i'); draw(); } });

    function tweenTo(target) {
      var from = JSON.parse(JSON.stringify(pts)), t0 = performance.now(), dur = reduceMotion ? 1 : 650;
      function step(t) {
        var k = Math.min(1, (t - t0) / dur), e = 1 - Math.pow(1 - k, 3);
        pts.forEach(function (p, i) { ['x', 'y', 'ix', 'iy', 'ox', 'oy'].forEach(function (key) { p[key] = from[i][key] + (target[i][key] - from[i][key]) * e; }); });
        draw();
        if (k < 1) requestAnimationFrame(step);
      }
      requestAnimationFrame(step);
    }
    $('#pen-shuffle').addEventListener('click', function () {
      var radii = [], jit = [];
      for (var i = 0; i < 6; i++) { radii.push(110 + Math.random() * 120); jit.push((Math.random() - 0.5) * 0.5); }
      tweenTo(makeShape(radii, jit));
      if (hint) hint.classList.add('is-gone');
    });
    $('#pen-reset').addEventListener('click', function () { tweenTo(DEFAULT); });
    $$('.swatch').forEach(function (s) {
      s.addEventListener('click', function () {
        fill = s.getAttribute('data-fill');
        $$('.swatch').forEach(function (o) { o.setAttribute('aria-pressed', o === s ? 'true' : 'false'); });
        if (view !== 'outline') shape.setAttribute('fill', fill);
      });
    });
    $$('.pen__tool').forEach(function (b) {
      b.addEventListener('click', function () {
        view = b.getAttribute('data-view');
        $$('.pen__tool').forEach(function (o) { o.setAttribute('aria-pressed', o === b ? 'true' : 'false'); });
        ctrl.style.display = view === 'preview' ? 'none' : '';
        bbox.style.display = view === 'preview' ? 'none' : '';
        dim.style.display = view === 'preview' ? 'none' : '';
        if (view === 'outline') { shape.setAttribute('fill', 'none'); shape.setAttribute('stroke', '#0F2A20'); shape.setAttribute('stroke-width', '1.5'); }
        else { shape.setAttribute('fill', fill); shape.removeAttribute('stroke'); }
      });
    });
  })();

  /* ======================================================================
     Arbeiten: Raster, Filter, Lightbox
     ====================================================================== */
  var WORKS = window.GH_WORKS || [];
  var ORDER = ['poster-reise', 'bb-spaetzle', 'brand-bohne', 'poster-jazz', 'menu-staeffele', 'gov-staeffele', 'poster-tech', 'kesselblick', 'ad-kehrwoche', 'poster-bauhaus', 'bb-staeffele', 'lp-staeffele', 'ad-kochkurs', 'gov-abfall', 'gov-piktogramme', 'banner-brezel', 'menu-kitchen'];
  WORKS.sort(function (a, b) { return ORDER.indexOf(a.id) - ORDER.indexOf(b.id); });
  var byId = {};
  WORKS.forEach(function (w) { byId[w.id] = w; });
  var svgCache = {};
  function workSvg(w, prefix) { return w.svg(prefix || ('w-' + w.id + '-')); }

  var FILTERS = [
    ['alle', 'Alle'], ['behoerde', 'Behörden'], ['gastro', 'Gastronomie'], ['plakat', 'Plakate'], ['billboard', 'Billboards'],
    ['anzeige', 'Anzeigen'], ['branding', 'Branding'], ['illustration', 'Illustration'], ['retro', 'Retro'], ['modern', 'Modern'], ['abstrakt', 'Abstrakt'], ['english', 'English']
  ];
  var grid = $('#works-grid'), filterBar = $('#works-filters');
  var current = 'alle', visible = WORKS.slice();

  if (grid) {
    grid.innerHTML = WORKS.map(function (w) {
      var cls = w.size === 'wide' ? ' work--wide' : '';
      return '<article class="work' + cls + '" data-id="' + w.id + '" data-tags="' + w.tags.join(' ') + '">' +
        '<button class="work__btn" type="button" aria-label="Arbeit ansehen: ' + w.title.replace(/"/g, '&quot;') + '">' +
        '<span class="work__art">' + workSvg(w) + '</span>' +
        '<span class="work__sel" aria-hidden="true"><i></i><i></i><i></i><i></i><span>' + w.id + '.svg</span></span></button>' +
        '<div class="work__meta"><div><h3 class="work__title">' + w.title + '</h3><p class="work__cat">' + w.cat + '</p></div><span class="badge work__lang">' + w.lang + '</span></div></article>';
    }).join('');
    var gs = document.createElement('style');
    gs.textContent = '.work{align-self:stretch;grid-template-rows:1fr auto}.work__btn{height:100%}.work__art{height:100%}';
    document.head.appendChild(gs);
  }
  if (filterBar) {
    filterBar.innerHTML = FILTERS.map(function (f) {
      var n = f[0] === 'alle' ? WORKS.length : WORKS.filter(function (w) { return w.tags.indexOf(f[0]) > -1; }).length;
      return '<button class="chip" type="button" data-filter="' + f[0] + '" aria-pressed="' + (f[0] === 'alle') + '">' + f[1] + ' <span class="chip__count">' + n + '</span></button>';
    }).join('');
    filterBar.addEventListener('click', function (e) { var b = e.target.closest('[data-filter]'); if (b) applyFilter(b.getAttribute('data-filter')); });
  }

  function applyFilter(f) {
    if (!grid) return;
    current = f;
    $$('[data-filter]', filterBar).forEach(function (b) { b.setAttribute('aria-pressed', b.getAttribute('data-filter') === f ? 'true' : 'false'); });
    var cards = $$('.work', grid);
    var first = new Map();
    cards.forEach(function (c) { if (!c.hidden) first.set(c, c.getBoundingClientRect()); });
    cards.forEach(function (c) {
      var show = f === 'alle' || c.getAttribute('data-tags').split(' ').indexOf(f) > -1;
      c.hidden = !show;
    });
    visible = WORKS.filter(function (w) { return f === 'alle' || w.tags.indexOf(f) > -1; });
    if (reduceMotion) return;
    cards.forEach(function (c) {
      if (c.hidden) return;
      var last = c.getBoundingClientRect(), f0 = first.get(c);
      if (f0) {
        var dx = f0.left - last.left, dy = f0.top - last.top;
        if (dx || dy) c.animate([{ transform: 'translate(' + dx + 'px,' + dy + 'px)' }, { transform: 'none' }], { duration: 550, easing: 'cubic-bezier(.2,.7,.1,1)' });
      } else c.animate([{ opacity: 0, transform: 'scale(.94)' }, { opacity: 1, transform: 'none' }], { duration: 450, easing: 'cubic-bezier(.2,.7,.1,1)' });
    });
  }

  // Leistungen: Vorschau am Mauszeiger, Klick filtert
  var preview = $('#service-preview');
  var px = 0, py = 0, tx = 0, ty = 0, prevRaf = null;
  function prevLoop() {
    px += (tx - px) * 0.18; py += (ty - py) * 0.18;
    preview.style.transform = 'translate3d(' + (px - 130) + 'px,' + (py - 162) + 'px,0) rotate(' + Math.max(-8, Math.min(8, (tx - px) * 0.08)) + 'deg)';
    prevRaf = requestAnimationFrame(prevLoop);
  }
  $$('.service').forEach(function (s) {
    s.addEventListener('click', function () {
      var f = s.getAttribute('data-filter');
      if (s.getAttribute('href') === '#arbeiten' && f) setTimeout(function () { applyFilter(f); }, 50);
    });
    if (!finePointer || !preview) return;
    s.addEventListener('mouseenter', function (e) {
      var w = byId[s.getAttribute('data-preview')];
      if (!w) return;
      if (!svgCache[w.id]) svgCache[w.id] = workSvg(w, 'pv-' + w.id + '-');
      preview.innerHTML = svgCache[w.id];
      tx = px = e.clientX; ty = py = e.clientY;
      preview.classList.add('is-on');
      if (!prevRaf) prevLoop();
    });
    s.addEventListener('mousemove', function (e) { tx = e.clientX; ty = e.clientY; });
    s.addEventListener('mouseleave', function () { preview.classList.remove('is-on'); cancelAnimationFrame(prevRaf); prevRaf = null; });
  });

  // Etikett „Ansehen“ am Mauszeiger
  var cLabel = $('#cursor-label');
  if (finePointer && grid && cLabel) {
    grid.addEventListener('pointermove', function (e) {
      var on = !!e.target.closest('.work__btn');
      cLabel.classList.toggle('is-on', on);
      cLabel.style.left = e.clientX + 'px'; cLabel.style.top = e.clientY + 'px';
    });
    grid.addEventListener('pointerleave', function () { cLabel.classList.remove('is-on'); });
  }

  // Lightbox
  var lb = $('#lightbox'), lbCanvas = $('#lb-canvas'), lbStage = $('#lb-stage');
  var lbIndex = 0, lbOpener = null, z = { s: 1, x: 0, y: 0 };
  function setZoom(s, cx, cy) {
    var ns = Math.max(1, Math.min(8, s));
    if (cx !== undefined) {
      var r = lbStage.getBoundingClientRect();
      var ox = cx - (r.left + r.width / 2), oy = cy - (r.top + r.height / 2);
      z.x = ox - (ox - z.x) * ns / z.s; z.y = oy - (oy - z.y) * ns / z.s;
    }
    z.s = ns;
    if (z.s === 1) { z.x = 0; z.y = 0; }
    lbCanvas.style.transform = 'translate(' + z.x + 'px,' + z.y + 'px) scale(' + z.s + ')';
    $('#lb-zoom').textContent = Math.round(z.s * 100) + ' %';
  }
  function renderLb() {
    var w = visible[lbIndex];
    if (!w) return;
    lbCanvas.innerHTML = workSvg(w, 'lb-' + w.id + '-');
    window.GH_fitLeaders(lbCanvas);
    $('#lb-count').textContent = String(lbIndex + 1).padStart(2, '0') + ' / ' + String(visible.length).padStart(2, '0');
    $('#lb-cat').textContent = w.cat + ' · ' + (w.lang === 'EN' ? 'Englisch' : 'Deutsch');
    $('#lb-title').textContent = w.title;
    $('#lb-desc').textContent = w.desc;
    $('#lb-spec').innerHTML = [['Auftraggeber', w.client], ['Format', w.format], ['Leistungen', w.services], ['Schriften', w.fonts], ['Status', 'Konzeptstudie']].map(function (r) {
      return '<div><dt>' + r[0] + '</dt><dd>' + r[1] + '</dd></div>';
    }).join('');
    $('#lb-palette').innerHTML = w.palette.map(function (c) { return '<button type="button" style="--c:' + c + '" data-hex="' + c + '" aria-label="Farbe ' + c + ' kopieren"><i></i>' + c + '</button>'; }).join('');
    setZoom(1);
  }
  function openLb(id, opener) {
    lbIndex = Math.max(0, visible.findIndex(function (w) { return w.id === id; }));
    lbOpener = opener;
    renderLb();
    lb.hidden = false;
    document.body.style.overflow = 'hidden';
    document.body.classList.add('lb-open');
    requestAnimationFrame(function () { lb.classList.add('is-open'); $('#lb-close').focus(); });
  }
  function closeLb() {
    lb.classList.remove('is-open');
    lb.classList.remove('is-outline');
    $('#lb-outline').setAttribute('aria-pressed', 'false');
    document.body.style.overflow = '';
    document.body.classList.remove('lb-open');
    setTimeout(function () { lb.hidden = true; lbCanvas.innerHTML = ''; }, reduceMotion ? 0 : 350);
    if (lbOpener) lbOpener.focus();
  }
  function stepLb(d) { lbIndex = (lbIndex + d + visible.length) % visible.length; renderLb(); }
  function toggleOutline() {
    var on = !lb.classList.contains('is-outline');
    lb.classList.toggle('is-outline', on);
    $('#lb-outline').setAttribute('aria-pressed', on ? 'true' : 'false');
    if (on) toast('Konturansicht: So sehen die Vektorpfade aus.');
  }
  if (grid && lb) {
    grid.addEventListener('click', function (e) {
      var b = e.target.closest('.work__btn');
      if (b) openLb(b.closest('.work').getAttribute('data-id'), b);
    });
    $('#lb-close').addEventListener('click', closeLb);
    $('#lb-prev').addEventListener('click', function () { stepLb(-1); });
    $('#lb-next').addEventListener('click', function () { stepLb(1); });
    $('#lb-zoom-in').addEventListener('click', function () { setZoom(z.s * 1.5); });
    $('#lb-zoom-out').addEventListener('click', function () { setZoom(z.s / 1.5); });
    $('#lb-fit').addEventListener('click', function () { setZoom(1); });
    $('#lb-outline').addEventListener('click', toggleOutline);
    $('#lb-palette').addEventListener('click', function (e) {
      var b = e.target.closest('[data-hex]');
      if (b) copyText(b.getAttribute('data-hex'), 'Farbe ' + b.getAttribute('data-hex') + ' kopiert.');
    });
    lbStage.addEventListener('wheel', function (e) { e.preventDefault(); setZoom(z.s * (e.deltaY < 0 ? 1.15 : 1 / 1.15), e.clientX, e.clientY); }, { passive: false });
    var pointers = new Map(), pinch = null, pan = null;
    lbStage.addEventListener('pointerdown', function (e) {
      if (e.target.closest('.lightbox__toolbar')) return;
      pointers.set(e.pointerId, { x: e.clientX, y: e.clientY });
      try { lbStage.setPointerCapture(e.pointerId); } catch (err) { /* ignorieren */ }
      if (pointers.size === 2) {
        var p = Array.from(pointers.values());
        pinch = { d: Math.hypot(p[0].x - p[1].x, p[0].y - p[1].y), s: z.s };
        pan = null;
      } else pan = { x: e.clientX, y: e.clientY, zx: z.x, zy: z.y };
      lbStage.classList.add('is-panning');
    });
    lbStage.addEventListener('pointermove', function (e) {
      if (!pointers.has(e.pointerId)) return;
      pointers.set(e.pointerId, { x: e.clientX, y: e.clientY });
      if (pinch && pointers.size === 2) {
        var p = Array.from(pointers.values());
        var dd = Math.hypot(p[0].x - p[1].x, p[0].y - p[1].y);
        setZoom(pinch.s * dd / pinch.d, (p[0].x + p[1].x) / 2, (p[0].y + p[1].y) / 2);
      } else if (pan && z.s > 1) {
        z.x = pan.zx + e.clientX - pan.x; z.y = pan.zy + e.clientY - pan.y;
        lbCanvas.style.transform = 'translate(' + z.x + 'px,' + z.y + 'px) scale(' + z.s + ')';
      }
    });
    var lastTapLb = 0;
    function upLb(e) {
      pointers.delete(e.pointerId);
      if (pointers.size < 2) pinch = null;
      if (!pointers.size) { pan = null; lbStage.classList.remove('is-panning'); }
      if (e.type === 'pointerup' && !e.target.closest('.lightbox__toolbar')) {
        var now = Date.now();
        if (now - lastTapLb < 300) setZoom(z.s > 1 ? 1 : 2.5, e.clientX, e.clientY);
        lastTapLb = now;
      }
    }
    lbStage.addEventListener('pointerup', upLb);
    lbStage.addEventListener('pointercancel', upLb);
    document.addEventListener('keydown', function (e) {
      if (lb.hidden) return;
      if (e.key === 'Escape') closeLb();
      else if (e.key === 'ArrowRight') stepLb(1);
      else if (e.key === 'ArrowLeft') stepLb(-1);
      else if (e.key === '+' || e.key === '=') setZoom(z.s * 1.5);
      else if (e.key === '-') setZoom(z.s / 1.5);
      else if (e.key === '0') setZoom(1);
      else if (e.key === 'k' || e.key === 'K') toggleOutline();
      else if (e.key === 'Tab') {
        var f = $$('button, [href], [tabindex]:not([tabindex="-1"])', lb).filter(function (el) { return el.offsetParent !== null; });
        if (!f.length) return;
        var i = f.indexOf(document.activeElement);
        if (e.shiftKey && (i <= 0)) { e.preventDefault(); f[f.length - 1].focus(); }
        else if (!e.shiftKey && i === f.length - 1) { e.preventDefault(); f[0].focus(); }
      }
    });
  }

  /* ======================================================================
     Skizze ⇄ Vektor
     ====================================================================== */
  (function compare() {
    var c = $('#compare');
    if (!c || !window.GH_MASCOT) return;
    $('#compare-sketch').innerHTML = window.GH_MASCOT('cs-', 'sketch');
    $('#compare-final').innerHTML = window.GH_MASCOT('cf-', 'final');
    var range = $('#compare-range');
    function set(v) { c.style.setProperty('--pos', v + '%'); }
    range.addEventListener('input', function () { set(range.value); });
    set(range.value);
    if (!reduceMotion && 'IntersectionObserver' in window) {
      var io = new IntersectionObserver(function (en) {
        if (!en[0].isIntersecting) return;
        io.disconnect();
        var t0 = performance.now();
        (function wob(t) {
          var k = (t - t0) / 1600;
          if (k > 1 || document.activeElement === range) return;
          var v = 52 + Math.sin(k * Math.PI * 2) * 22 * (1 - k);
          range.value = v; set(v);
          requestAnimationFrame(wob);
        })(t0);
      }, { threshold: 0.6 });
      io.observe(c);
    }
  })();

  /* ======================================================================
     Labor: generative Höhenlinien (Canvas)
     ====================================================================== */
  (function lab() {
    var canvas = $('#lab-canvas');
    if (!canvas) return;
    var ctx = canvas.getContext('2d');
    var N = 96, seed = 711, levels = 13, theme = 0;
    var THEMES = [
      { name: 'Nacht', bg: '#0F2A20', line: [159, 230, 188], hi: '#D8C69C' },
      { name: 'Tag', bg: '#E7EAE1', line: [15, 42, 32], hi: '#B3243E' },
      { name: 'Sandstein', bg: '#D8C69C', line: [58, 42, 28], hi: '#1FA15A' }
    ];
    var base = new Float32Array((N + 1) * (N + 1)), field = new Float32Array((N + 1) * (N + 1));
    var bump = { x: 0.5, y: 0.5, a: 0, tx: 0.5, ty: 0.5, ta: 0 };
    var R;
    function hash(ix, iy) { var h = Math.imul(ix, 374761393) ^ Math.imul(iy, 668265263) ^ Math.imul(seed, 2246822519); h = Math.imul(h ^ (h >>> 13), 1274126177); return ((h ^ (h >>> 16)) >>> 0) / 4294967296; }
    function vnoise(x, y) {
      var ix = Math.floor(x), iy = Math.floor(y), fx = x - ix, fy = y - iy;
      var sx = fx * fx * (3 - 2 * fx), sy = fy * fy * (3 - 2 * fy);
      var a = hash(ix, iy), b = hash(ix + 1, iy), c = hash(ix, iy + 1), d = hash(ix + 1, iy + 1);
      return a + (b - a) * sx + (c - a) * sy + (a - b - c + d) * sx * sy;
    }
    function fbm(x, y) { return vnoise(x, y) * 0.55 + vnoise(x * 2.1, y * 2.1) * 0.28 + vnoise(x * 4.3, y * 4.3) * 0.17; }
    function buildBase() {
      R = U.rng(seed);
      var ox = R() * 3 - 1.5, oy = R() * 3 - 1.5;
      for (var j = 0; j <= N; j++) for (var i = 0; i <= N; i++) {
        var u = i / N, v = j / N, dx = u - 0.5 - ox * 0.04, dy = v - 0.52 - oy * 0.04;
        var r = Math.sqrt(dx * dx + dy * dy) / 0.62;
        base[j * (N + 1) + i] = Math.pow(r, 1.35) * 0.95 + fbm(u * 3.2 + ox, v * 3.2 + oy) * 0.5;
      }
    }
    function buildField() {
      for (var j = 0; j <= N; j++) for (var i = 0; i <= N; i++) {
        var u = i / N, v = j / N, dx = u - bump.x, dy = v - bump.y;
        field[j * (N + 1) + i] = base[j * (N + 1) + i] + bump.a * Math.exp(-(dx * dx + dy * dy) / 0.012);
      }
    }
    function segments(level) {
      var segs = [], W = N + 1;
      function lerp(a, b) { return (level - a) / (b - a); }
      for (var j = 0; j < N; j++) for (var i = 0; i < N; i++) {
        var a = field[j * W + i], b = field[j * W + i + 1], c = field[(j + 1) * W + i + 1], d = field[(j + 1) * W + i];
        var idx = (a > level ? 8 : 0) | (b > level ? 4 : 0) | (c > level ? 2 : 0) | (d > level ? 1 : 0);
        if (idx === 0 || idx === 15) continue;
        var top = [i + lerp(a, b), j], right = [i + 1, j + lerp(b, c)], bottom = [i + lerp(d, c), j + 1], left = [i, j + lerp(a, d)];
        switch (idx) {
          case 1: case 14: segs.push(left, bottom); break;
          case 2: case 13: segs.push(bottom, right); break;
          case 3: case 12: segs.push(left, right); break;
          case 4: case 11: segs.push(top, right); break;
          case 5: segs.push(left, top, bottom, right); break;
          case 6: case 9: segs.push(top, bottom); break;
          case 7: case 8: segs.push(left, top); break;
          case 10: segs.push(left, bottom, top, right); break;
        }
      }
      return segs;
    }
    var minV = 0.15, maxV = 1.25;
    function levelsList() { var arr = []; for (var k = 1; k <= levels; k++) arr.push(minV + (maxV - minV) * k / (levels + 1)); return arr; }
    var W = 0, dpr = 1;
    function resize() {
      var r = canvas.getBoundingClientRect();
      dpr = Math.min(2, window.devicePixelRatio || 1);
      W = r.width;
      canvas.width = Math.round(r.width * dpr); canvas.height = Math.round(r.height * dpr);
      draw();
    }
    function draw() {
      if (!W) return;
      var t = THEMES[theme], s = canvas.width / N;
      ctx.fillStyle = t.bg; ctx.fillRect(0, 0, canvas.width, canvas.height);
      buildField();
      var ls = levelsList();
      ls.forEach(function (lv, k) {
        var segs = segments(lv), last = k === ls.length - 1;
        ctx.beginPath();
        for (var q = 0; q < segs.length; q += 2) { ctx.moveTo(segs[q][0] * s, segs[q][1] * s); ctx.lineTo(segs[q + 1][0] * s, segs[q + 1][1] * s); }
        ctx.strokeStyle = last ? t.hi : 'rgba(' + t.line.join(',') + ',' + (0.35 + 0.65 * (k / ls.length)) + ')';
        ctx.lineWidth = (k % 4 === 0 ? 1.8 : 1) * dpr;
        ctx.stroke();
      });
    }
    var raf = null;
    function animate() {
      bump.x += (bump.tx - bump.x) * 0.2; bump.y += (bump.ty - bump.y) * 0.2; bump.a += (bump.ta - bump.a) * 0.12;
      draw();
      if (Math.abs(bump.ta - bump.a) > 0.002 || Math.abs(bump.tx - bump.x) > 0.001 || Math.abs(bump.ty - bump.y) > 0.001) raf = requestAnimationFrame(animate);
      else raf = null;
    }
    function kick() { if (!raf) raf = requestAnimationFrame(animate); }
    canvas.addEventListener('pointermove', function (e) {
      var r = canvas.getBoundingClientRect();
      bump.tx = (e.clientX - r.left) / r.width; bump.ty = (e.clientY - r.top) / r.height; bump.ta = 0.42;
      if (bump.a < 0.01) { bump.x = bump.tx; bump.y = bump.ty; }
      kick();
    });
    canvas.addEventListener('pointerleave', function () { bump.ta = 0; kick(); });
    function newSeed(sd) {
      seed = sd; buildBase(); draw();
      $('#lab-seed').textContent = 'Generative Grafik · Seed ' + String(seed).padStart(4, '0');
    }
    $('#lab-new').addEventListener('click', function () { newSeed(Math.floor(Math.random() * 9999)); });
    $('#lab-theme').addEventListener('click', function (e) {
      theme = (theme + 1) % THEMES.length;
      e.currentTarget.textContent = 'Farbe: ' + THEMES[theme].name;
      draw();
    });
    $('#lab-density').addEventListener('input', function (e) { levels = +e.target.value; draw(); });
    function exportSvg() {
      var t = THEMES[theme], sc = 600 / N, out = '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 600 600"><rect width="600" height="600" fill="' + t.bg + '"/>';
      var ls = levelsList();
      ls.forEach(function (lv, k) {
        var segs = segments(lv), dd = '';
        for (var q = 0; q < segs.length; q += 2) dd += 'M' + (segs[q][0] * sc).toFixed(1) + ' ' + (segs[q][1] * sc).toFixed(1) + 'L' + (segs[q + 1][0] * sc).toFixed(1) + ' ' + (segs[q + 1][1] * sc).toFixed(1);
        var col = k === ls.length - 1 ? t.hi : 'rgb(' + t.line.join(',') + ')';
        out += '<path d="' + dd + '" fill="none" stroke="' + col + '" stroke-opacity="' + (k === ls.length - 1 ? 1 : (0.35 + 0.65 * k / ls.length)).toFixed(2) + '" stroke-width="' + (k % 4 === 0 ? 1.8 : 1) + '"/>';
      });
      return out + '</svg>';
    }
    $('#lab-copy').addEventListener('click', function () { copyText(exportSvg(), 'SVG-Code kopiert – direkt in Illustrator oder Figma einfügen.'); });
    $('#lab-save').addEventListener('click', function () {
      try {
        var blob = new Blob([exportSvg()], { type: 'image/svg+xml' }), url = URL.createObjectURL(blob), a = document.createElement('a');
        a.href = url; a.download = 'kessel-topografie-' + seed + '.svg';
        document.body.appendChild(a); a.click(); a.remove();
        setTimeout(function () { URL.revokeObjectURL(url); }, 2000);
        toast('SVG wird gespeichert.');
      } catch (err) { toast('Speichern nicht möglich – nutzen Sie „SVG-Code kopieren“.'); }
    });
    buildBase();
    if ('ResizeObserver' in window) new ResizeObserver(resize).observe(canvas); else window.addEventListener('resize', resize);
    resize();
  })();

  /* ======================================================================
     Social Media: Telefon, Formate, Redaktionsplan
     ====================================================================== */
  (function social() {
    var screen = $('#phone-screen');
    if (screen && window.GH_Phone) {
      var phone = new window.GH_Phone(screen);
      phone.render();
      $$('[data-account]').forEach(function (b) {
        b.addEventListener('click', function () {
          $$('[data-account]').forEach(function (o) { o.setAttribute('aria-pressed', o === b ? 'true' : 'false'); });
          phone.setAccount(b.getAttribute('data-account'));
        });
      });
    }

    var fmt = $('#fmt');
    if (fmt) {
      $('#fmt-img').innerHTML = window.GH_FMT_ART || '';
      var LABELS = { '4x5': 'Feed · 1080 × 1350 px', '3x4': 'Profilraster · 1080 × 1440 px', '1x1': 'Quadrat · 1080 × 1080 px', '9x16': 'Story & Reel · 1080 × 1920 px', '191x1': 'Link-Vorschau · 1200 × 627 px', '16x9': 'Video & Thumbnail · 1920 × 1080 px' };
      $$('#fmt-buttons [data-f]').forEach(function (b) {
        b.addEventListener('click', function () {
          var f = b.getAttribute('data-f');
          $$('#fmt-buttons [data-f]').forEach(function (o) { o.setAttribute('aria-pressed', o === b ? 'true' : 'false'); });
          fmt.setAttribute('data-f', f);
          $('#fmt-label').textContent = LABELS[f];
        });
      });
      var safe = $('#fmt-safe');
      safe.addEventListener('click', function () {
        var on = safe.getAttribute('aria-pressed') !== 'true';
        safe.setAttribute('aria-pressed', on ? 'true' : 'false');
        fmt.classList.toggle('show-safe', on);
        if (on && fmt.getAttribute('data-f') !== '9x16') $('#fmt-buttons [data-f="9x16"]').click();
      });
    }

    var P = window.GH_PLAN, calGrid = $('#cal-grid'), detail = $('#cal-detail');
    if (P && calGrid) {
      var dows = ['Mo', 'Di', 'Mi', 'Do', 'Fr', 'Sa', 'So'];
      var first = new Date(P.year, P.month, 1), days = new Date(P.year, P.month + 1, 0).getDate();
      var offset = (first.getDay() + 6) % 7, html = dows.map(function (d) { return '<div class="cal__dow">' + d + '</div>'; }).join('');
      var total = Math.ceil((offset + days) / 7) * 7;
      for (var c = 0; c < total; c++) {
        var n = c - offset + 1;
        if (n < 1 || n > days) { html += '<div class="cal__day is-empty"></div>'; continue; }
        var post = P.posts[n];
        if (post) html += '<button class="cal__day" type="button" data-day="' + n + '" aria-pressed="false" aria-label="' + n + '. November: ' + post[1] + '"><span class="cal__num">' + n + '</span><span class="cal__post" style="--c:' + P.pillars[post[0]][1] + '">' + post[1] + '</span></button>';
        else html += '<div class="cal__day"><span class="cal__num">' + n + '</span></div>';
      }
      calGrid.innerHTML = html;
      var showDay = function (n) {
        var p = P.posts[n];
        $$('.cal__day[data-day]', calGrid).forEach(function (b) { b.setAttribute('aria-pressed', +b.getAttribute('data-day') === n ? 'true' : 'false'); });
        var wd = ['Sonntag', 'Montag', 'Dienstag', 'Mittwoch', 'Donnerstag', 'Freitag', 'Samstag'][new Date(P.year, P.month, n).getDay()];
        detail.innerHTML = '<span class="cal-detail__date">' + wd + ', ' + n + '. November 2026 · ' + p[3] + ' Uhr</span><h3>' + p[1] + '</h3><p>' + p[4] + '</p>' +
          '<dl><dt>Säule</dt><dd><span class="cal__post" style="--c:' + P.pillars[p[0]][1] + ';display:inline-block">' + P.pillars[p[0]][0] + '</span></dd><dt>Format</dt><dd>' + p[2] + '</dd><dt>Kanal</dt><dd>Instagram, Facebook' + (p[2].indexOf('Reel') > -1 ? ', TikTok' : '') + '</dd><dt>Account</dt><dd>@cafe.staeffele (Beispiel)</dd></dl>';
      };
      calGrid.addEventListener('click', function (e) { var b = e.target.closest('[data-day]'); if (b) showDay(+b.getAttribute('data-day')); });
      showDay(P.initial);
    }
  })();

  /* ======================================================================
     Websites: Geräte-Vorschau
     ====================================================================== */
  (function web() {
    var stage = $('#device-stage'), frame = $('#device-frame'), iframe = $('#web-frame');
    if (!stage || !frame) return;
    var SITES = { weingut: ['demos/weingut.html', 'weingut-kesselhang.de', 'Demo-Website Weingut Kesselhang'], fildercode: ['demos/fildercode.html', 'fildercode.io', 'Demo website Fildercode'] };
    var DEV = { desktop: [1280, 0], tablet: [820, 1180], mobile: [390, 844] };
    var device = 'desktop';
    function layout() {
      var W = stage.clientWidth, H = stage.clientHeight, d = DEV[device], s;
      if (device === 'desktop') {
        var fw = Math.max(d[0], W);
        s = Math.min(1, W / fw);
        frame.style.width = fw + 'px'; frame.style.height = (H / s) + 'px';
        stage.classList.remove('is-framed');
      } else {
        stage.classList.add('is-framed');
        s = Math.min(1, (H - 48) / d[1], (W - 40) / d[0]);
        frame.style.width = d[0] + 'px'; frame.style.height = d[1] + 'px';
      }
      frame.style.transform = 'scale(' + s + ')';
      $('#web-size').textContent = parseInt(frame.style.width, 10) + ' px · ' + Math.round(s * 100) + ' %';
    }
    $$('[data-device]').forEach(function (b) {
      b.addEventListener('click', function () {
        device = b.getAttribute('data-device');
        $$('[data-device]').forEach(function (o) { o.setAttribute('aria-pressed', o === b ? 'true' : 'false'); });
        layout();
      });
    });
    $$('[data-site]').forEach(function (b) {
      b.addEventListener('click', function () {
        var key = b.getAttribute('data-site'), s = SITES[key];
        $$('[data-site]').forEach(function (o) { o.setAttribute('aria-pressed', o === b ? 'true' : 'false'); });
        // Eingebettete Fassung (z. B. Einzeldatei-Vorschau) oder normale Unterseite
        if (window.GH_SRCDOC && window.GH_SRCDOC[key]) iframe.srcdoc = window.GH_SRCDOC[key]; else iframe.src = s[0];
        iframe.title = s[2]; $('#web-url').textContent = s[1];
      });
    });
    if ('ResizeObserver' in window) new ResizeObserver(layout).observe(stage); else window.addEventListener('resize', layout);
    layout();
  })();

  /* ======================================================================
     Außenwerbung: Straßenszene mit Tag/Nacht
     ====================================================================== */
  (function street() {
    var box = $('#street');
    if (!box || !U) return;
    var R = U.rng(48), s = '';
    s += '<svg viewBox="0 0 1200 560" role="img" aria-label="Straßenszene in Stuttgart mit Großflächenplakat, City-Light-Poster an der Haltestelle und vorbeifahrender Stadtbahn">';
    s += '<defs><linearGradient id="st-day" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#A9D3E3"/><stop offset="1" stop-color="#EAF4EE"/></linearGradient>' +
      '<linearGradient id="st-night" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#0B1330"/><stop offset="1" stop-color="#2E2A58"/></linearGradient>' +
      '<radialGradient id="st-lamp" cx=".5" cy="0" r="1"><stop offset="0" stop-color="#FFE6A3" stop-opacity=".75"/><stop offset="1" stop-color="#FFE6A3" stop-opacity="0"/></radialGradient>' +
      '<linearGradient id="st-cone" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#FFF4D0" stop-opacity=".55"/><stop offset="1" stop-color="#FFF4D0" stop-opacity="0"/></linearGradient></defs>';
    s += '<rect class="sky-day" width="1200" height="560" fill="url(#st-day)"/><rect class="sky-night" width="1200" height="560" fill="url(#st-night)"/>';
    s += '<g class="night-only">';
    for (var i = 0; i < 70; i++) s += '<circle cx="' + Math.round(R() * 1200) + '" cy="' + Math.round(R() * 200) + '" r="' + (0.6 + R()).toFixed(1) + '" fill="#fff" opacity="' + (0.4 + R() * 0.6).toFixed(2) + '"/>';
    s += '<circle cx="1060" cy="80" r="24" fill="#F6EBD0"/><circle cx="1070" cy="72" r="22" fill="#1A1E44"/></g>';
    s += '<circle class="day-only" cx="1040" cy="90" r="40" fill="#FFE08A"/>';
    // Hügel mit Fernsehturm und Häusern
    s += '<path d="' + U.hill([[0, 240], [160, 200], [330, 226], [520, 190], [700, 214], [900, 176], [1200, 214]], 560) + '" fill="#7FA98C"/>';
    s += U.tower(880, 196, 170, '#5E7F70', '#C0392B', '#D8E4DD');
    var vy = U.hill([[0, 300], [180, 262], [380, 290], [560, 256], [760, 286], [980, 252], [1200, 280]], 560);
    s += '<path d="' + vy + '" fill="#9BBF84"/>' + U.vineRows('st-vr', vy, 0, 1200, 250, 380, 16, 0.6, '#86AB6E', 3);
    var houses = '';
    var hx = [40, 96, 150, 240, 300, 360, 430, 500, 640, 700, 760, 830, 980, 1040, 1110];
    var wallC = ['#F2EDE2', '#E8DCC4', '#F6F1E7', '#DCE3E8'], roofC = ['#B5503A', '#8E4A3A', '#5F6B73'];
    for (var h = 0; h < hx.length; h++) {
      var w = 40 + R() * 26, hh = 40 + R() * 40, y = 300 + R() * 40 - (h % 3) * 8;
      houses += U.house(hx[h], Math.round(y), Math.round(w), Math.round(hh), wallC[h % 4], roofC[h % 3], '#C9DCE6');
    }
    // Häuserwände zuerst, Fenster leuchten später über der Abdunklung
    var walls = houses.replace(/<rect class="win"[^>]*>/g, ''), wins = houses.match(/<rect class="win"[^>]*>/g) || [];
    s += walls;
    // Straße, Gehweg, Gleise
    s += '<rect x="0" y="420" width="1200" height="140" fill="#6B7279"/><rect x="0" y="420" width="1200" height="14" fill="#C9C3B6"/><rect x="0" y="434" width="1200" height="4" fill="#9A958B"/>';
    s += '<rect x="0" y="500" width="1200" height="4" fill="#B9B1A3"/><rect x="0" y="520" width="1200" height="4" fill="#B9B1A3"/>';
    for (var k = 0; k < 40; k++) s += '<rect x="' + (k * 30) + '" y="498" width="10" height="28" fill="#5B6168"/>';
    s += '<line x1="0" y1="404" x2="1200" y2="404" stroke="#3C4248" stroke-width="1.5"/>';
    // Haltestelle mit City-Light-Poster
    s += '<rect x="120" y="270" width="210" height="10" fill="#3C4248"/><rect x="124" y="280" width="6" height="140" fill="#3C4248"/><rect x="320" y="280" width="6" height="140" fill="#3C4248"/>';
    s += '<rect x="152" y="268" width="80" height="6" fill="#F2C230"/><text x="192" y="263" text-anchor="middle" font-family="JetBrains Mono, monospace" font-size="10" fill="#3C4248">Haltestelle</text>';
    s += '<rect x="238" y="290" width="88" height="128" fill="#2C2F33"/>';
    // Großfläche: Beine und Rahmen
    s += '<rect x="640" y="400" width="12" height="36" fill="#2C2F33"/><rect x="908" y="400" width="12" height="36" fill="#2C2F33"/>';
    s += '<rect x="548" y="104" width="464" height="304" rx="4" fill="#2C2F33"/>';
    s += '<path d="M600,104v-14h14v14M946,104v-14h14v14" fill="#2C2F33"/><rect x="590" y="82" width="34" height="10" rx="3" fill="#3C4248"/><rect x="936" y="82" width="34" height="10" rx="3" fill="#3C4248"/>';
    // Laternen
    var lamps = [60, 470, 1110];
    lamps.forEach(function (lx) { s += '<rect x="' + (lx - 3) + '" y="300" width="6" height="122" fill="#3C4248"/><rect x="' + (lx - 16) + '" y="294" width="32" height="8" rx="4" fill="#3C4248"/>'; });
    // Abdunklung bei Nacht
    s += '<rect class="shade" width="1200" height="560" fill="#0A1030"/>';
    s += wins.join('');
    s += '<circle class="night-only blink" cx="880" cy="26" r="3.5" fill="#FF4A4A"/>';
    lamps.forEach(function (lx) { s += '<path class="night-only" d="M' + (lx - 12) + ',302L' + (lx - 70) + ',430H' + (lx + 70) + 'L' + (lx + 12) + ',302Z" fill="url(#st-lamp)"/><circle class="night-only" cx="' + lx + '" cy="303" r="5" fill="#FFF4D0"/>'; });
    // City-Light-Poster (hinterleuchtet)
    s += '<g class="night-only"><rect x="230" y="282" width="104" height="144" rx="6" fill="#FFF4D0" opacity=".25"/></g>';
    s += '<svg x="244" y="296" width="76" height="116" viewBox="0 0 600 840" preserveAspectRatio="xMidYMid slice">' + window.GH_WORKS.filter(function (w) { return w.id === 'poster-jazz'; })[0].svg('st-clp-').replace(/^<svg[^>]*>/, '').replace(/<\/svg>$/, '') + '</svg>';
    // Plakatmotiv
    s += '<g class="bb-light"><path d="M600,92L560,404H990L960,92Z" fill="url(#st-cone)"/></g>';
    s += '<svg id="bb-face" x="562" y="118" width="436" height="276" viewBox="0 0 712 504" preserveAspectRatio="xMidYMid slice"></svg>';
    s += '<g class="bb-light"><rect x="562" y="118" width="436" height="276" fill="#FFF8E0" opacity=".08"/></g>';
    // Stadtbahn
    s += '<g class="tram"><line x1="0" y1="404" x2="1200" y2="404" stroke="transparent"/>';
    var car = function (x) {
      var c = '<rect x="' + x + '" y="434" width="250" height="66" rx="14" fill="#F2C230"/><rect x="' + x + '" y="482" width="250" height="18" fill="#E2E6E8"/>';
      for (var q = 0; q < 6; q++) c += '<rect class="win" x="' + (x + 14 + q * 38) + '" y="446" width="30" height="24" rx="3" fill="#2E3A44"/>';
      c += '<rect x="' + (x + 30) + '" y="500" width="34" height="10" rx="5" fill="#2C2F33"/><rect x="' + (x + 186) + '" y="500" width="34" height="10" rx="5" fill="#2C2F33"/>';
      return c;
    };
    s += car(0) + car(258) + '<rect x="250" y="446" width="8" height="40" fill="#2C2F33"/>';
    s += '<path d="M440,434l26,-24l26,24M454,422h24" fill="none" stroke="#2C2F33" stroke-width="3"/>';
    s += '<rect x="496" y="452" width="10" height="14" rx="3" fill="#FFF4D0"/><text x="22" y="476" font-family="Bricolage Grotesque, sans-serif" font-weight="800" font-size="13" fill="#2C2F33">U14</text>';
    s += '<rect class="shade" x="0" y="434" width="508" height="76" fill="#0A1030" style="mix-blend-mode:multiply"/>';
    s += '</g></svg>';
    box.innerHTML = s;
    var face = $('#bb-face', box);
    function setMotif(id) {
      var w = window.GH_WORKS.filter(function (x) { return x.id === id; })[0];
      if (!w) return;
      face.innerHTML = w.svg('st-' + id + '-').replace(/^<svg[^>]*>/, '').replace(/<\/svg>$/, '');
      $$('#street-motifs [data-motif]').forEach(function (b) { b.setAttribute('aria-pressed', b.getAttribute('data-motif') === id ? 'true' : 'false'); });
    }
    setMotif('bb-spaetzle');
    $$('#street-motifs [data-motif]').forEach(function (b) { b.addEventListener('click', function () { setMotif(b.getAttribute('data-motif')); }); });
    var nightBtn = $('#street-night');
    nightBtn.addEventListener('click', function () {
      var on = nightBtn.getAttribute('aria-pressed') !== 'true';
      nightBtn.setAttribute('aria-pressed', on ? 'true' : 'false');
      nightBtn.textContent = on ? '☀ Tag' : '☾ Nacht';
      box.classList.toggle('is-night', on);
    });
  })();

  /* ======================================================================
     IT: Terminal und Zielwerte
     ====================================================================== */
  (function it() {
    var term = $('#terminal');
    if (!term) return;
    var SCRIPT = [
      ['cmd', 'grünhan check weingut-kesselhang.de'],
      ['ok', '  ✓ SSL-Zertifikat gültig (noch 74 Tage)'],
      ['ok', '  ✓ Ladezeit 0,8 s (Ziel: unter 1,5 s)'],
      ['ok', '  ✓ Barrierefreiheit: WCAG 2.1 AA, 0 Fehler'],
      ['ok', '  ✓ Backups: täglich, 30 Tage aufbewahrt'],
      ['warn', '  ! Plugin „Kontaktformular“ ist veraltet'],
      ['cmd', 'grünhan update --plugins'],
      ['dim', '  → 1 Update installiert, Seite neu geprüft'],
      ['cmd', 'grünhan deploy --live'],
      ['dim', '  → Baue Seite … fertig in 4,2 s'],
      ['ok', '  ✓ Live. Sodele.']
    ];
    var started = false;
    function esc(t) { return t.replace(/&/g, '&amp;').replace(/</g, '&lt;'); }
    function full() { term.innerHTML = SCRIPT.map(function (l) { return l[0] === 'cmd' ? '<span class="p">$</span> ' + esc(l[1]) : '<span class="' + l[0] + '">' + esc(l[1]) + '</span>'; }).join('\n') + '\n<span class="p">$</span> <span class="terminal__caret"></span>'; }
    full();
    function run() {
      if (started) return; started = true;
      if (reduceMotion) return;
      var out = '', li = 0, ci = 0;
      function frame() {
        if (li >= SCRIPT.length) { term.innerHTML = out + '<span class="p">$</span> <span class="terminal__caret"></span>'; return; }
        var l = SCRIPT[li];
        if (l[0] === 'cmd') {
          ci++;
          term.innerHTML = out + '<span class="p">$</span> ' + esc(l[1].slice(0, ci)) + '<span class="terminal__caret"></span>';
          if (ci >= l[1].length) { out += '<span class="p">$</span> ' + esc(l[1]) + '\n'; li++; ci = 0; setTimeout(frame, 380); }
          else setTimeout(frame, 28 + Math.random() * 40);
        } else {
          out += '<span class="' + l[0] + '">' + esc(l[1]) + '</span>\n'; li++;
          term.innerHTML = out + '<span class="terminal__caret"></span>';
          setTimeout(frame, 260);
        }
      }
      frame();
    }
    var gauges = $$('.g-fg');
    function fillGauges() { gauges.forEach(function (g) { g.style.strokeDashoffset = 251.3 * (1 - (+g.getAttribute('data-v')) / 100); }); }
    if ('IntersectionObserver' in window) {
      var io = new IntersectionObserver(function (en) {
        en.forEach(function (e) {
          if (!e.isIntersecting) return;
          if (e.target === term) run(); else fillGauges();
          io.unobserve(e.target);
        });
      }, { threshold: 0.35 });
      io.observe(term);
      if ($('#gauges')) io.observe($('#gauges'));
    } else { run(); fillGauges(); }
  })();

  /* ======================================================================
     Ablauf: Fortschrittslinie
     ====================================================================== */
  var stepsEl = $('#steps'), stepLine = $('.steps__line i'), stepItems = $$('.step');
  function updateSteps() {
    if (!stepsEl) return;
    var r = stepsEl.getBoundingClientRect(), vh = window.innerHeight;
    var p = Math.max(0, Math.min(1, (vh * 0.6 - r.top) / r.height));
    if (stepLine) stepLine.style.setProperty('--p', p.toFixed(3));
    stepItems.forEach(function (s) { s.classList.toggle('is-active', s.getBoundingClientRect().top < vh * 0.6); });
  }

  /* ======================================================================
     Studio: Regionskarte und Glossar
     ====================================================================== */
  (function map() {
    var svg = $('#region-map'), info = $('#map-info');
    if (!svg) return;
    function P(lat, lon) { return [Math.round((lon - 8.8) * 652), Math.round((49.02 - lat) * 988)]; }
    var TOWNS = [
      ['Stuttgart', 48.7758, 9.1829, 'Unser Kessel: über 400 Stäffele, ein Fernsehturm und sehr viel Kehrwoche.', 1],
      ['Ludwigsburg', 48.8975, 9.1922, 'Barockschloss, Blühendes Barock und jedes Jahr ein Meer aus Kürbissen.'],
      ['Bietigheim-Bissingen', 48.9667, 9.1333, 'Der Enzviadukt – ein Motiv wie gemalt.'],
      ['Backnang', 48.9474, 9.4303, 'Die alte Gerberstadt an der Murr.'],
      ['Waiblingen', 48.8303, 9.3169, 'Das Tor zum Remstal.'],
      ['Fellbach', 48.8095, 9.2758, 'Wein vom Kappelberg mit Blick über den Kessel.'],
      ['Schorndorf', 48.805, 9.527, 'Geburtsstadt von Gottlieb Daimler.'],
      ['Esslingen', 48.7406, 9.3108, 'Fachwerk, Weinberge und ein berühmter Mittelaltermarkt.'],
      ['Göppingen', 48.7031, 9.6522, 'Am Fuß des Hohenstaufen.'],
      ['Kirchheim u. T.', 48.6483, 9.4511, 'Fachwerk-Altstadt am Albtrauf.'],
      ['Nürtingen', 48.6267, 9.3353, 'Hier ging Hölderlin zur Lateinschule.'],
      ['Filderstadt', 48.6667, 9.2167, 'Auf den Fildern wächst das berühmte Filderkraut.'],
      ['Böblingen', 48.6856, 9.0153, 'Wo die Region tüftelt: Technik, Mobilität, Start-ups.'],
      ['Sindelfingen', 48.7133, 9.0028, 'Industrie und Ideen, Tür an Tür mit Böblingen.'],
      ['Leonberg', 48.8, 9.0167, 'Mit dem Pomeranzengarten aus der Renaissance.'],
      ['Herrenberg', 48.5967, 8.8708, 'Die Stiftskirche thront über der Altstadt.'],
      ['Tübingen', 48.5216, 9.0576, 'Stocherkähne auf dem Neckar und Studierende überall.'],
      ['Reutlingen', 48.4914, 9.2043, 'Hier steht eine der engsten Straßen der Welt.']
    ];
    var NECKAR = [[48.46, 8.92], [48.477, 8.934], [48.519, 9.05], [48.6, 9.25], [48.627, 9.336], [48.672, 9.379], [48.711, 9.418], [48.741, 9.305], [48.784, 9.255], [48.804, 9.218], [48.84, 9.225], [48.873, 9.27], [48.91, 9.21], [48.94, 9.26], [48.96, 9.235], [49.0, 9.15], [49.03, 9.14]].map(function (q) { return P(q[0], q[1]); });
    var st = P(48.7758, 9.1829), s = '';
    s += '<rect width="600" height="560" fill="#F7F8F4"/>';
    s += '<g stroke="#0F2A20" stroke-opacity=".05">';
    for (var gx = 0; gx <= 600; gx += 40) s += '<line x1="' + gx + '" y1="0" x2="' + gx + '" y2="560"/>';
    for (var gy = 0; gy <= 560; gy += 40) s += '<line x1="0" y1="' + gy + '" x2="600" y2="' + gy + '"/>';
    s += '</g>';
    var alb = [P(48.43, 9.0), P(48.47, 9.2), P(48.53, 9.38), P(48.6, 9.52), P(48.66, 9.7), P(48.66, 9.8)];
    s += '<path d="' + U.smooth(alb, false) + 'L600,560L0,560Z" fill="#E3E7DE"/>';
    s += '<path d="' + U.smooth(alb, false) + '" fill="none" stroke="#9DB1A5" stroke-width="1.5" stroke-dasharray="2 5"/>';
    s += '<text x="430" y="520" font-family="Instrument Serif, serif" font-style="italic" font-size="22" fill="#56675E">Schwäbische Alb</text>';
    s += '<ellipse cx="' + P(48.6, 9.07)[0] + '" cy="' + P(48.6, 9.07)[1] + '" rx="50" ry="32" fill="#DCE8D8"/><text x="' + (P(48.6, 9.07)[0] - 30) + '" y="' + (P(48.6, 9.07)[1] + 4) + '" font-family="Instrument Serif, serif" font-style="italic" font-size="15" fill="#56675E">Schönbuch</text>';
    s += '<text x="' + (P(48.83, 9.45)[0] - 14) + '" y="' + P(48.83, 9.45)[1] + '" font-family="Instrument Serif, serif" font-style="italic" font-size="15" fill="#56675E">Remstal</text>';
    s += '<text x="' + (P(48.69, 9.18)[0] - 10) + '" y="' + (P(48.69, 9.18)[1] + 6) + '" font-family="Instrument Serif, serif" font-style="italic" font-size="15" fill="#56675E">Filder</text>';
    s += '<path d="' + U.smooth(NECKAR, false) + '" fill="none" stroke="#8DBFD9" stroke-width="4" stroke-linecap="round"/>';
    s += '<text x="' + (P(48.66, 9.42)[0] + 8) + '" y="' + P(48.66, 9.42)[1] + '" font-family="Instrument Serif, serif" font-style="italic" font-size="15" fill="#4D88A8">Neckar</text>';
    s += '<circle cx="' + st[0] + '" cy="' + st[1] + '" r="178" fill="none" stroke="#1FA15A" stroke-width="1.2" stroke-dasharray="6 6"/>';
    s += '<text x="' + (st[0] + 128) + '" y="' + (st[1] - 128) + '" font-family="JetBrains Mono, monospace" font-size="10" fill="#11683A">20 km</text>';
    s += '<circle cx="' + st[0] + '" cy="' + st[1] + '" r="26" fill="#1FA15A" fill-opacity=".1" stroke="#1FA15A" stroke-width="1"/>';
    TOWNS.forEach(function (t, i) {
      var q = P(t[1], t[2]), main = t[4];
      var left = ['Sindelfingen', 'Leonberg', 'Tübingen', 'Bietigheim-Bissingen', 'Göppingen'].indexOf(t[0]) > -1;
      var below = ['Böblingen', 'Fellbach', 'Esslingen'].indexOf(t[0]) > -1;
      var lx = left ? q[0] - 10 : q[0] + 10, ly = below ? q[1] + 16 : q[1] + 4;
      s += '<g class="town' + (main ? ' is-on' : '') + '" tabindex="0" role="button" data-i="' + i + '" aria-label="' + t[0] + ': ' + t[3] + '">' +
        '<circle cx="' + q[0] + '" cy="' + q[1] + '" r="14" fill="transparent"/>' +
        '<circle class="dot" cx="' + q[0] + '" cy="' + q[1] + '" r="' + (main ? 7 : 4.5) + '"/>' +
        '<text x="' + lx + '" y="' + ly + '"' + (left ? ' text-anchor="end"' : '') + (main ? ' style="font-size:13px;font-weight:700"' : '') + '>' + t[0] + '</text></g>';
    });
    svg.innerHTML = s;
    function pick(g) {
      var t = TOWNS[+g.getAttribute('data-i')];
      $$('.town', svg).forEach(function (o) { o.classList.toggle('is-on', o === g); });
      info.innerHTML = '<b>' + t[0] + '</b><span>' + t[3] + '</span>';
    }
    $$('.town', svg).forEach(function (g) {
      g.addEventListener('mouseenter', function () { pick(g); });
      g.addEventListener('focus', function () { pick(g); });
      g.addEventListener('click', function () { pick(g); });
      g.addEventListener('keydown', function (e) { if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); pick(g); } });
    });
  })();

  (function glossary() {
    var box = $('#gloss-grid');
    if (!box) return;
    var G = [
      ['Muggeseggele', 'Maßeinheit', 'Winzig kleine Menge. Wörtlich: das Hodensäckchen einer Stubenfliege.', '„Rück a Muggeseggele nach links.“'],
      ['Stäffele', 'Bauwerk', 'Treppe. In Stuttgart gibt es über 400 davon – zusammen rund 20 bis 30 Kilometer.', '„Nemm d’Stäffele, des goht schneller.“'],
      ['Kehrwoche', 'Pflicht', 'Der Wochendienst fürs Putzen von Treppenhaus und Gehweg. Angezeigt per Schild an der Tür.', '„Du hosch Kehrwoch!“'],
      ['Viertele', 'Getränk', 'Ein Viertelliter Wein, am besten Trollinger, getrunken aus dem Henkelglas.', '„No a Viertele, bitte.“'],
      ['Hocketse', 'Fest', 'Geselliges Beisammensein mit Bierbänken, Würstle und Musik – im Hof, im Verein, auf der Straße.', '„Am Samschdig isch Hocketse.“'],
      ['Bruddler', 'Mensch', 'Jemand, der gern vor sich hin grummelt. Meistens herzensgut.', '„Der bruddelt bloß, der moint’s net so.“'],
      ['Gsälz', 'Essen', 'Marmelade. Hat mit Salz nichts zu tun, sondern mit Früchten und Zucker.', '„Gibsch mr mol s’Gsälz?“'],
      ['Besen', 'Lokal', 'Saisonale Weinstube eines Wengerters. Hängt ein Besen vor der Tür, ist geöffnet.', '„Heit gange mr in Besa.“'],
      ['Heilig’s Blechle', 'Ausruf', 'Ausdruck des Staunens, etwa „Ach du meine Güte!“', '„Heilig’s Blechle, isch des schee!“'],
      ['Sodele', 'Abschluss', '„So, das wär’s.“ Beendet jede Arbeit, jedes Telefonat und jede Diskussion.', '„Sodele, Feierabend.“']
    ];
    box.innerHTML = G.map(function (g, i) {
      return '<button class="gloss" type="button" aria-pressed="false" aria-label="' + g[0] + ': Bedeutung anzeigen"><span class="gloss__in">' +
        '<span class="gloss__face"><span class="gloss__type">' + g[1] + '</span><span class="gloss__word">' + g[0] + '</span><span class="gloss__turn"><span>Umdrehen</span><span aria-hidden="true">↻</span></span></span>' +
        '<span class="gloss__face gloss__face--back"><span class="gloss__mean">' + g[2] + '</span><span class="gloss__ex">' + g[3] + '</span></span></span></button>';
    }).join('');
    box.addEventListener('click', function (e) {
      var b = e.target.closest('.gloss');
      if (!b) return;
      var on = b.getAttribute('aria-pressed') !== 'true';
      b.setAttribute('aria-pressed', on ? 'true' : 'false');
      b.setAttribute('aria-label', b.querySelector('.gloss__word').textContent + (on ? ': ' + b.querySelector('.gloss__mean').textContent : ': Bedeutung anzeigen'));
    });
  })();

  /* ======================================================================
     Kontakt: Anfrage in drei Schritten
     ====================================================================== */
  (function wizard() {
    var form = $('#wizard');
    if (!form) return;
    var step = 1, sets = $$('fieldset[data-step]', form), next = $('#wizard-next'), back = $('#wizard-back'), err = $('#wizard-error');
    $$('[data-contact="email"]').forEach(function (a) { a.textContent = CONFIG.email; a.href = 'mailto:' + CONFIG.email; });
    $('#done-mail').textContent = CONFIG.email;
    function show(n) {
      step = n;
      sets.forEach(function (f) { f.hidden = +f.getAttribute('data-step') !== n; });
      $$('.wizard__steps span', form).forEach(function (s) {
        var k = +s.getAttribute('data-s');
        s.classList.toggle('is-on', k === n); s.classList.toggle('is-done', k < n);
      });
      back.hidden = n === 1;
      next.innerHTML = n === 3 ? 'Anfrage vorbereiten <span class="btn__arrow" aria-hidden="true">→</span>' : 'Weiter <span class="btn__arrow" aria-hidden="true">→</span>';
      err.textContent = '';
    }
    function checked(name) { return $$('input[name="' + name + '"]:checked', form).map(function (i) { return i.value; }); }
    function validate() {
      if (step === 1 && !checked('leistung').length) return 'Bitte wählen Sie mindestens eine Leistung aus.';
      if (step === 2 && !checked('zeit').length) return 'Bitte wählen Sie einen ungefähren Zeitraum.';
      if (step === 3) {
        if (!$('#f-name').value.trim()) { $('#f-name').focus(); return 'Bitte geben Sie Ihren Namen an.'; }
        if (!/^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test($('#f-mail').value.trim())) { $('#f-mail').focus(); return 'Bitte prüfen Sie Ihre E-Mail-Adresse (z. B. name@beispiel.de).'; }
        if (!$('#f-privacy').checked) return 'Bitte bestätigen Sie die Datenschutzhinweise.';
      }
      return '';
    }
    function finish() {
      var lines = [
        'Hallo Grünhan-Team,', '',
        'ich interessiere mich für: ' + checked('leistung').join(', '),
        'Zeitraum: ' + (checked('zeit')[0] || '–'),
        'Budgetrahmen: ' + (checked('budget')[0] || 'noch offen'), '',
        $('#f-msg').value.trim() || '(keine weitere Nachricht)', '',
        'Viele Grüße', $('#f-name').value.trim() + ($('#f-org').value.trim() ? ', ' + $('#f-org').value.trim() : ''),
        $('#f-mail').value.trim() + ($('#f-tel').value.trim() ? ' · ' + $('#f-tel').value.trim() : '')
      ];
      var text = lines.join('\n');
      $('#wizard-summary').textContent = text;
      $('#wizard-mailto').href = 'mailto:' + CONFIG.email + '?subject=' + encodeURIComponent('Projektanfrage über gruenhan.de') + '&body=' + encodeURIComponent(text);
      sets.forEach(function (f) { f.hidden = true; });
      $('#wizard-nav').hidden = true;
      $('.wizard__steps', form).hidden = true;
      $('#wizard-done').hidden = false;
      err.textContent = '';
      $('#wizard-done h3').setAttribute('tabindex', '-1');
      $('#wizard-done h3').focus();
    }
    next.addEventListener('click', function () {
      var m = validate();
      if (m) { err.textContent = m; return; }
      if (step < 3) show(step + 1); else finish();
    });
    back.addEventListener('click', function () { if (step > 1) show(step - 1); });
    form.addEventListener('submit', function (e) { e.preventDefault(); next.click(); });
    $('#wizard-copy').addEventListener('click', function () { copyText($('#wizard-summary').textContent, 'Anfrage kopiert.', $('#wizard-summary')); });
    $('#wizard-restart').addEventListener('click', function () {
      form.reset();
      $('#wizard-done').hidden = true; $('#wizard-nav').hidden = false; $('.wizard__steps', form).hidden = false;
      show(1);
    });
    show(1);
  })();

  /* ======================================================================
     Kleinigkeiten: Jahr, Kehrwoche, Logo-Klicks, Einblendungen
     ====================================================================== */
  var year = $('#year');
  if (year) year.textContent = new Date().getFullYear();

  var kehr = $('#kehrwoche');
  if (kehr) kehr.addEventListener('click', function () {
    if (reduceMotion) { toast('Sauber! Die Kehrwoche ist erledigt.'); return; }
    var layer = document.createElement('div');
    layer.className = 'kehrwoche';
    layer.setAttribute('aria-hidden', 'true');
    layer.innerHTML = '<svg class="kehrwoche__broom" viewBox="0 0 240 260"><rect x="112" y="0" width="16" height="150" rx="8" fill="#9A5B34"/><rect x="96" y="140" width="48" height="16" rx="4" fill="#0F2A20"/><path d="M70,154H170L196,256H44Z" fill="#D7B27A"/><path d="M80,160L60,254M100,160L92,254M120,160V254M140,160L148,254M160,160L180,254" stroke="#B48A4E" stroke-width="3"/></svg>';
    for (var i = 0; i < 26; i++) {
      var d = document.createElement('i');
      d.className = 'kehrwoche__dust';
      d.style.left = (Math.random() * 100) + 'vw';
      d.style.bottom = (4 + Math.random() * 14) + 'vh';
      d.animate([{ transform: 'none', opacity: 1 }, { transform: 'translate(' + (40 + Math.random() * 60) + 'vw,' + (-20 - Math.random() * 40) + 'px) scale(.2)', opacity: 0 }], { duration: 900, delay: 300 + Math.random() * 1600, fill: 'both', easing: 'ease-out' });
      layer.appendChild(d);
    }
    document.body.appendChild(layer);
    setTimeout(function () { layer.remove(); toast('Sauber! Die Kehrwoche ist erledigt. Bis nächste Woche.'); kehr.lastChild.textContent = ' Kehrwoche erledigt ✓'; }, 2700);
  });

  var logoClicks = 0, logoT;
  $$('.site-header .logo').forEach(function (l) {
    l.addEventListener('click', function () {
      logoClicks++; clearTimeout(logoT);
      logoT = setTimeout(function () { logoClicks = 0; }, 1500);
      if (logoClicks === 5) { toast('Heilig’s Blechle! Sie haben das Easter Egg gefunden.'); logoClicks = 0; }
    });
  });

  // Einblendungen: nur Elemente unterhalb des sichtbaren Bereichs, Ausgangszustand bleibt lesbar
  if ('IntersectionObserver' in window && !reduceMotion) {
    var rio = new IntersectionObserver(function (entries) {
      entries.forEach(function (e) { if (e.isIntersecting) { e.target.classList.remove('is-pending'); rio.unobserve(e.target); } });
    }, { rootMargin: '0px 0px -8% 0px' });
    $$('.reveal').forEach(function (el) {
      if (el.getBoundingClientRect().top > window.innerHeight) { el.classList.add('is-pending'); rio.observe(el); }
    });
  }

  // Schriften geladen: Punktlinien der Speisekarten an die Textbreite anpassen
  if (document.fonts && document.fonts.ready) document.fonts.ready.then(function () { if (grid) window.GH_fitLeaders(grid); });
  else if (grid) window.GH_fitLeaders(grid);

  onScroll();
})();
