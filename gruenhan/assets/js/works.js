/* ==========================================================================
   Grünhan – Demo-Arbeiten
   Jede Arbeit ist eine reine Vektorgrafik (SVG). Die Funktion svg(p) erhält
   ein Präfix, damit IDs (Verläufe, Masken, Filter) auf der Seite eindeutig
   bleiben, auch wenn eine Arbeit mehrfach angezeigt wird.
   Alle Auftraggeber sind fiktiv.
   ========================================================================== */
(function () {
  'use strict';

  /* ---------- Hilfsfunktionen ---------- */
  var F = {
    display: "'Bricolage Grotesque', 'Arial Narrow', Arial, sans-serif",
    serif: "'Fraunces', Georgia, serif",
    poster: "'Big Shoulders Display', 'Arial Narrow', Impact, sans-serif",
    hand: "'Caveat', 'Comic Sans MS', cursive",
    mono: "'JetBrains Mono', ui-monospace, Menlo, monospace",
    inst: "'Instrument Serif', Georgia, serif"
  };

  // Deterministischer Zufall, damit jede Grafik bei jedem Laden gleich aussieht
  function rng(seed) {
    var s = seed >>> 0;
    return function () { s = (Math.imul(s, 1664525) + 1013904223) >>> 0; return s / 4294967296; };
  }
  function r1(n) { return Math.round(n * 10) / 10; }

  // Catmull-Rom-Spline als Bézier-Pfad
  function smooth(pts, closed) {
    var n = pts.length, d = 'M' + r1(pts[0][0]) + ',' + r1(pts[0][1]);
    var last = closed ? n : n - 1;
    for (var i = 0; i < last; i++) {
      var p0 = pts[closed ? (i - 1 + n) % n : Math.max(i - 1, 0)];
      var p1 = pts[i];
      var p2 = pts[(i + 1) % n];
      var p3 = pts[closed ? (i + 2) % n : Math.min(i + 2, n - 1)];
      var c1x = p1[0] + (p2[0] - p0[0]) / 6, c1y = p1[1] + (p2[1] - p0[1]) / 6;
      var c2x = p2[0] - (p3[0] - p1[0]) / 6, c2y = p2[1] - (p3[1] - p1[1]) / 6;
      d += 'C' + r1(c1x) + ',' + r1(c1y) + ' ' + r1(c2x) + ',' + r1(c2y) + ' ' + r1(p2[0]) + ',' + r1(p2[1]);
    }
    return closed ? d + 'Z' : d;
  }
  // Hügel: offener Kamm, unten geschlossen
  function hill(pts, bottom) {
    var d = smooth(pts, false);
    return d + 'L' + pts[pts.length - 1][0] + ',' + bottom + 'L' + pts[0][0] + ',' + bottom + 'Z';
  }

  // Stuttgarter Fernsehturm (Schaft, Turmkorb, Antenne)
  function tower(x, by, h, c, ant, light) {
    var sb = h * 0.03, st = h * 0.014, ys = by - h * 0.69, yk = by - h * 0.75, kw = h * 0.05;
    var aw = h * 0.007;
    var s = '<g>' +
      '<path d="M' + r1(x - sb) + ',' + by + 'L' + r1(x - st) + ',' + r1(ys) + 'L' + r1(x + st) + ',' + r1(ys) + 'L' + r1(x + sb) + ',' + by + 'Z" fill="' + c + '"/>' +
      '<path d="M' + r1(x - kw * 0.82) + ',' + r1(ys + 2) + 'L' + r1(x - kw) + ',' + r1(yk + h * 0.012) + 'L' + r1(x - kw) + ',' + r1(yk) + 'L' + r1(x + kw) + ',' + r1(yk) + 'L' + r1(x + kw) + ',' + r1(yk + h * 0.012) + 'L' + r1(x + kw * 0.82) + ',' + r1(ys + 2) + 'Z" fill="' + c + '"/>';
    for (var i = 1; i < 4; i++) {
      var yy = yk + (ys - yk) * i / 4;
      s += '<rect x="' + r1(x - kw * 0.92) + '" y="' + r1(yy - 0.6) + '" width="' + r1(kw * 1.84) + '" height="1.2" fill="' + (light || c) + '" opacity=".55"/>';
    }
    s += '<rect x="' + r1(x - kw * 0.55) + '" y="' + r1(yk - h * 0.02) + '" width="' + r1(kw * 1.1) + '" height="' + r1(h * 0.02) + '" fill="' + c + '"/>';
    var ay0 = yk - h * 0.02, ay1 = by - h;
    var seg = 6;
    for (var j = 0; j < seg; j++) {
      var y0 = ay0 + (ay1 - ay0) * j / seg, y1 = ay0 + (ay1 - ay0) * (j + 1) / seg;
      var w0 = aw * (1 - j / seg * 0.6), w1 = aw * (1 - (j + 1) / seg * 0.6);
      s += '<path d="M' + r1(x - w0) + ',' + r1(y0) + 'L' + r1(x - w1) + ',' + r1(y1) + 'L' + r1(x + w1) + ',' + r1(y1) + 'L' + r1(x + w0) + ',' + r1(y0) + 'Z" fill="' + (j % 2 ? (light || '#fff') : ant) + '"/>';
    }
    return s + '</g>';
  }

  // Weinberg-Zeilen in einer Form (über clipPath)
  function vineRows(id, shapeD, x0, x1, y0, y1, gap, slope, color, sw) {
    var s = '<clipPath id="' + id + '"><path d="' + shapeD + '"/></clipPath><g clip-path="url(#' + id + ')" stroke="' + color + '" stroke-width="' + sw + '" stroke-linecap="round">';
    for (var x = x0 - (y1 - y0); x < x1; x += gap) {
      s += '<line x1="' + r1(x) + '" y1="' + y1 + '" x2="' + r1(x + (y1 - y0) * slope) + '" y2="' + y0 + '"/>';
    }
    return s + '</g>';
  }

  function house(x, y, w, h, wall, roof, win) {
    var rh = h * 0.55;
    var s = '<rect x="' + x + '" y="' + y + '" width="' + w + '" height="' + h + '" fill="' + wall + '"/>' +
      '<path d="M' + (x - 3) + ',' + y + 'L' + r1(x + w / 2) + ',' + r1(y - rh) + 'L' + (x + w + 3) + ',' + y + 'Z" fill="' + roof + '"/>';
    if (win) {
      var cols = Math.max(1, Math.floor(w / 9));
      for (var i = 0; i < cols; i++) {
        s += '<rect class="win" x="' + r1(x + 3 + i * (w - 6) / cols + 1) + '" y="' + r1(y + h * 0.28) + '" width="' + r1((w - 6) / cols - 3) + '" height="' + r1(h * 0.24) + '" fill="' + win + '"/>';
      }
    }
    return s;
  }

  // Laugenbrezel
  function pretzel(cx, cy, s, opt) {
    opt = opt || {};
    var dark = opt.dark || '#6E3410', mid = opt.mid || '#B5651D', hi = opt.hi || '#E9A25A';
    var loop = 'M-9,-12C-30,-46 -70,-38 -71,-6C-72,24 -42,40 0,40C42,40 72,24 71,-6C70,-38 30,-46 9,-12';
    var arms = 'M-9,-12C-2,0 6,10 24,33M9,-12C2,0 -6,10 -24,33';
    var g = '<g transform="translate(' + cx + ',' + cy + ') scale(' + s + ')" fill="none" stroke-linecap="round" stroke-linejoin="round">' +
      '<path d="' + loop + '" stroke="' + dark + '" stroke-width="19"/><path d="' + arms + '" stroke="' + dark + '" stroke-width="15"/>' +
      '<path d="' + loop + '" stroke="' + mid + '" stroke-width="14"/><path d="' + arms + '" stroke="' + mid + '" stroke-width="10"/>' +
      '<path d="M-60,-20C-56,-34 -40,-38 -28,-30M28,-30C40,-38 56,-34 60,-20M-40,33C-20,38 20,38 40,33" stroke="' + hi + '" stroke-width="3.2" opacity=".85"/>';
    var R = rng(opt.seed || 7);
    var salt = '';
    var spots = [[-62, -14], [-52, -32], [-34, -36], [-66, 8], [-50, 30], [-26, 37], [0, 39], [24, 37], [50, 30], [66, 8], [62, -14], [52, -32], [34, -36], [-4, -4], [10, 14], [-14, 16]];
    for (var i = 0; i < spots.length; i++) {
      var a = R() * 60 - 30;
      salt += '<rect x="' + r1(spots[i][0] + R() * 4 - 2) + '" y="' + r1(spots[i][1] + R() * 4 - 4) + '" width="3.4" height="2.4" rx=".8" transform="rotate(' + r1(a) + ' ' + spots[i][0] + ' ' + spots[i][1] + ')" fill="#FFFDF5" stroke="none"/>';
    }
    return g + salt + '</g>';
  }

  // Spätzle-Kringel
  function spaetzle(R, x0, y0, w, h, n, fill, edge) {
    var s = '<g fill="none" stroke-linecap="round">';
    for (var i = 0; i < n; i++) {
      var x = x0 + R() * w, y = y0 + R() * h, len = 14 + R() * 18, a = R() * Math.PI * 2;
      var dx = Math.cos(a) * len, dy = Math.sin(a) * len;
      var k = (R() - 0.5) * 18;
      var d = 'M' + r1(x) + ',' + r1(y) + 'q' + r1(dx / 2 - dy / len * k) + ',' + r1(dy / 2 + dx / len * k) + ' ' + r1(dx) + ',' + r1(dy);
      s += '<path d="' + d + '" stroke="' + edge + '" stroke-width="8.5"/><path d="' + d + '" stroke="' + fill + '" stroke-width="5.5"/>';
    }
    return s + '</g>';
  }

  function grain(p, alpha) {
    return '<filter id="' + p + 'grain" x="0" y="0" width="100%" height="100%"><feTurbulence type="fractalNoise" baseFrequency=".85" numOctaves="2" stitchTiles="stitch" result="n"/><feColorMatrix type="saturate" values="0"/><feComponentTransfer><feFuncA type="table" tableValues="0 ' + (alpha || 0.09) + '"/></feComponentTransfer></filter>';
  }

  function star4(x, y, r, c) {
    var k = r * 0.28;
    return '<path d="M' + x + ',' + (y - r) + 'C' + (x + k) + ',' + (y - k) + ' ' + (x + k) + ',' + (y - k) + ' ' + (x + r) + ',' + y + 'C' + (x + k) + ',' + (y + k) + ' ' + (x + k) + ',' + (y + k) + ' ' + x + ',' + (y + r) + 'C' + (x - k) + ',' + (y + k) + ' ' + (x - k) + ',' + (y + k) + ' ' + (x - r) + ',' + y + 'C' + (x - k) + ',' + (y - k) + ' ' + (x - k) + ',' + (y - k) + ' ' + x + ',' + (y - r) + 'Z" fill="' + c + '"/>';
  }

  function burst(cx, cy, r0, r1_, n, c, rot) {
    var d = '';
    for (var i = 0; i < n * 2; i++) {
      var a = (i / (n * 2)) * Math.PI * 2 + (rot || 0), r = i % 2 ? r0 : r1_;
      d += (i ? 'L' : 'M') + r1(cx + Math.cos(a) * r) + ',' + r1(cy + Math.sin(a) * r);
    }
    return '<path d="' + d + 'Z" fill="' + c + '"/>';
  }

  // Dekoratives QR-ähnliches Muster (kein echter Code)
  function qrish(x, y, size, seed, fg, bg) {
    var R = rng(seed), n = 21, c = size / n, s = '<g><rect x="' + x + '" y="' + y + '" width="' + size + '" height="' + size + '" fill="' + bg + '"/>';
    function finder(fx, fy) {
      return '<rect x="' + r1(x + fx * c) + '" y="' + r1(y + fy * c) + '" width="' + r1(7 * c) + '" height="' + r1(7 * c) + '" fill="' + fg + '"/>' +
        '<rect x="' + r1(x + (fx + 1) * c) + '" y="' + r1(y + (fy + 1) * c) + '" width="' + r1(5 * c) + '" height="' + r1(5 * c) + '" fill="' + bg + '"/>' +
        '<rect x="' + r1(x + (fx + 2) * c) + '" y="' + r1(y + (fy + 2) * c) + '" width="' + r1(3 * c) + '" height="' + r1(3 * c) + '" fill="' + fg + '"/>';
    }
    for (var i = 0; i < n; i++) for (var j = 0; j < n; j++) {
      var inF = (i < 8 && j < 8) || (i > 12 && j < 8) || (i < 8 && j > 12);
      if (!inF && R() > 0.52) s += '<rect x="' + r1(x + i * c) + '" y="' + r1(y + j * c) + '" width="' + r1(c + 0.2) + '" height="' + r1(c + 0.2) + '" fill="' + fg + '"/>';
    }
    return s + finder(0, 0) + finder(14, 0) + finder(0, 14) + '</g>';
  }

  // Text mit Zeilen (tspan)
  function lines(x, y, lh, arr, attrs) {
    var s = '<text x="' + x + '" y="' + y + '" ' + attrs + '>';
    for (var i = 0; i < arr.length; i++) s += '<tspan x="' + x + '" dy="' + (i ? lh : 0) + '">' + arr[i] + '</tspan>';
    return s + '</text>';
  }

  // Speisekarten-Zeile mit Punktlinie (Länge wird nach dem Rendern angepasst)
  function menuItem(x, px, y, name, price, desc, o) {
    var s = '<g class="lead" data-x="' + x + '" data-px="' + px + '">' +
      '<text x="' + x + '" y="' + y + '" font-family="' + o.nameFont + '" font-size="' + o.nameSize + '" font-weight="' + (o.nameWeight || 600) + '" fill="' + o.ink + '"' + (o.nameStyle ? ' style="' + o.nameStyle + '"' : '') + '>' + name + '</text>' +
      '<line x1="' + (x + 150) + '" x2="' + (px - 50) + '" y1="' + (y - 3) + '" y2="' + (y - 3) + '" stroke="' + o.lead + '" stroke-width="1.4" stroke-dasharray="0.1 5" stroke-linecap="round"/>' +
      '<text x="' + px + '" y="' + y + '" text-anchor="end" font-family="' + o.priceFont + '" font-size="' + o.priceSize + '" font-weight="600" fill="' + o.ink + '" style="font-variant-numeric:tabular-nums">' + price + '</text>';
    if (desc) s += '<text x="' + x + '" y="' + (y + o.descGap) + '" font-family="' + o.descFont + '" font-size="' + o.descSize + '" fill="' + o.desc + '"' + (o.descStyle ? ' style="' + o.descStyle + '"' : '') + '>' + desc + '</text>';
    return s + '</g>';
  }

  var SVG_OPEN = function (w, h, label) {
    return '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ' + w + ' ' + h + '" role="img" aria-label="' + label + '">';
  };

  var WORKS = [];

  /* ======================================================================
     1 · Reiseplakat (Retro)
     ====================================================================== */
  WORKS.push({
    id: 'poster-reise', size: 'tall',
    title: 'Zwischen Wald und Reben',
    cat: 'Plakat · Retro',
    tags: ['plakat', 'retro', 'illustration'],
    lang: 'DE',
    client: 'Tourismus-Kampagne (fiktiv)',
    format: 'DIN A1 · 594 × 841 mm',
    services: 'Illustration, Typografie, Druckvorstufe',
    fonts: 'Big Shoulders Display, Fraunces',
    palette: ['#F3E6C8', '#EFA65A', '#2E6B5E', '#1D3B35', '#A8342B', '#9DB86A'],
    desc: 'Ein Reiseplakat im Stil der 1950er: Fernsehturm, Weinberge in der Halbhöhenlage, der Neckar und die Häuser im Kessel. Gebaut aus flachen Farbflächen und einer feinen Druckkörnung – wie früher im Siebdruck, nur gestochen scharf.',
    svg: function (p) {
      var s = SVG_OPEN(600, 840, 'Retro-Reiseplakat Stuttgart mit Fernsehturm, Weinbergen und Neckar');
      s += '<defs>' +
        '<linearGradient id="' + p + 'sky" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#E98E4A"/><stop offset=".45" stop-color="#F3B76A"/><stop offset="1" stop-color="#F8DDA6"/></linearGradient>' +
        '<clipPath id="' + p + 'art"><rect x="32" y="32" width="536" height="660" rx="4"/></clipPath>' +
        '<mask id="' + p + 'sunm"><rect width="600" height="840" fill="#fff"/>' +
        '<rect x="0" y="318" width="600" height="5" fill="#000"/><rect x="0" y="336" width="600" height="7" fill="#000"/><rect x="0" y="356" width="600" height="9" fill="#000"/><rect x="0" y="378" width="600" height="12" fill="#000"/><rect x="0" y="403" width="600" height="15" fill="#000"/></mask>' +
        grain(p, 0.1) + '</defs>';
      s += '<rect width="600" height="840" fill="#F3E6C8"/>';
      s += '<g clip-path="url(#' + p + 'art)">';
      s += '<rect x="32" y="32" width="536" height="660" fill="url(#' + p + 'sky)"/>';
      s += '<circle cx="300" cy="318" r="128" fill="#FBE6A6" mask="url(#' + p + 'sunm)"/>';
      s += '<path d="M120 210q8-7 16 0q8-7 16 0M168 238q6-5 12 0q6-5 12 0M430 250q7-6 14 0q7-6 14 0" fill="none" stroke="#7A3B22" stroke-width="2.5" stroke-linecap="round"/>';
      // ferne Hügel
      var far = hill([[20, 455], [110, 418], [200, 440], [300, 424], [380, 398], [470, 382], [580, 410]], 700);
      s += '<path d="' + far + '" fill="#5E8466"/>';
      s += '<path d="' + hill([[20, 470], [110, 436], [200, 456], [300, 444], [380, 420], [470, 406], [580, 428]], 700) + '" fill="#4C7258"/>';
      for (var t = 0; t < 26; t++) {
        var tx = 40 + t * 21, ty = 452 - Math.sin(t * 0.55) * 14 - (t > 14 ? (t - 14) * 3.2 : 0);
        s += '<path d="M' + tx + ',' + r1(ty + 16) + 'l7,-22l7,22z" fill="#3B5F49"/>';
      }
      s += tower(468, 402, 236, '#1D3B35', '#B5372A', '#F3E6C8');
      // Weinberge
      var vy = hill([[20, 560], [90, 520], [170, 500], [250, 530], [300, 560]], 700);
      s += '<path d="' + vy + '" fill="#9DB86A"/>';
      s += vineRows(p + 'v1', vy, 20, 320, 495, 700, 13, 0.55, '#7D9C4D', 3.2);
      var vy2 = hill([[330, 575], [400, 540], [480, 522], [580, 535]], 700);
      s += '<path d="' + vy2 + '" fill="#A9C27A"/>';
      s += vineRows(p + 'v2', vy2, 320, 600, 515, 700, 13, -0.5, '#86A658', 3.2);
      // Stäffele
      var st = 'M70,600';
      for (var k = 0; k < 9; k++) st += 'h12v-9';
      s += '<path d="' + st + '" fill="none" stroke="#F3E6C8" stroke-width="4" stroke-linejoin="round"/>';
      s += '<path d="M70,588L178,507" stroke="#1D3B35" stroke-width="1.6"/>';
      // Kessel-Häuser
      var hx = [232, 252, 270, 292, 312, 334, 356, 378, 400, 248, 286, 330, 368];
      var hy = [592, 598, 588, 596, 586, 594, 588, 598, 590, 612, 610, 614, 612];
      for (var hI = 0; hI < hx.length; hI++) s += house(hx[hI], hy[hI], 18, 20, '#F3E6C8', hI % 3 ? '#A8342B' : '#7A3B22', '#2E6B5E');
      s += '<rect x="318" y="548" width="12" height="44" fill="#F3E6C8"/><path d="M314,548l10,-30l10,30z" fill="#1D3B35"/>';
      // Neckar
      s += '<path d="M32,652C150,628 230,676 340,650C430,628 500,640 568,620L568,700L32,700Z" fill="#2E6B5E"/>';
      s += '<path d="M70,666c30,-6 50,-6 80,0M260,670c30,-6 50,-6 80,0M420,646c26,-5 44,-5 70,0" fill="none" stroke="#7FB3A3" stroke-width="2.5" stroke-linecap="round"/>';
      s += '<g transform="translate(372 636)"><path d="M0,10h56l-8,10h-40z" fill="#F3E6C8"/><rect x="10" y="2" width="30" height="8" fill="#A8342B"/><rect x="14" y="4" width="4" height="4" fill="#F3E6C8"/><rect x="22" y="4" width="4" height="4" fill="#F3E6C8"/><rect x="30" y="4" width="4" height="4" fill="#F3E6C8"/></g>';
      // Reben im Vordergrund
      var leaf = function (x, y, sc, rot, c) {
        return '<path transform="translate(' + x + ' ' + y + ') rotate(' + rot + ') scale(' + sc + ')" d="M0,0C-10,-6 -22,-4 -30,-14C-26,-22 -34,-32 -26,-42C-16,-38 -12,-46 -2,-52C4,-44 12,-48 20,-42C22,-32 32,-28 30,-18C22,-16 18,-6 8,-4Z" fill="' + c + '"/>';
      };
      s += leaf(70, 700, 1.5, -20, '#1D3B35') + leaf(110, 712, 1.1, 30, '#28503F');
      s += leaf(540, 712, 1.6, 40, '#1D3B35') + leaf(500, 716, 1.1, -10, '#28503F');
      var gr = [[502, 664], [512, 664], [522, 664], [507, 673], [517, 673], [512, 682]];
      for (var gI = 0; gI < gr.length; gI++) s += '<circle cx="' + gr[gI][0] + '" cy="' + gr[gI][1] + '" r="5.6" fill="#6B2440"/><circle cx="' + (gr[gI][0] - 1.8) + '" cy="' + (gr[gI][1] - 1.8) + '" r="1.4" fill="#C47390"/>';
      s += '<path d="M512,658c0,-8 4,-14 10,-16" fill="none" stroke="#1D3B35" stroke-width="2"/>';
      s += '</g>';
      // Typografie
      s += '<text x="300" y="140" text-anchor="middle" font-family="' + F.poster + '" font-weight="900" font-size="118" letter-spacing="6" fill="#1D3B35">STUTTGART</text>';
      s += '<text x="300" y="176" text-anchor="middle" font-family="' + F.mono + '" font-size="13" letter-spacing="5" fill="#7A3B22">· IM HERZEN DES LÄNDLES ·</text>';
      s += '<rect x="32" y="32" width="536" height="660" rx="4" fill="none" stroke="#1D3B35" stroke-width="3"/>';
      s += '<text x="300" y="752" text-anchor="middle" font-family="' + F.serif + '" font-style="italic" font-weight="600" font-size="40" fill="#A8342B" style="font-variation-settings:\'SOFT\' 100, \'WONK\' 1">Zwischen Wald und Reben</text>';
      s += '<text x="300" y="792" text-anchor="middle" font-family="' + F.mono + '" font-size="12.5" letter-spacing="4" fill="#1D3B35">KESSEL · NECKAR · HALBHÖHENLAGE</text>';
      s += '<rect width="600" height="840" filter="url(#' + p + 'grain)"/>';
      return s + '</svg>';
    }
  });

  /* ======================================================================
     2 · Festivalplakat im Schweizer Stil (Modern)
     ====================================================================== */
  WORKS.push({
    id: 'poster-jazz', size: 'tall',
    title: 'Jazz im Kessel',
    cat: 'Plakat · Modern',
    tags: ['plakat', 'modern'],
    lang: 'DE',
    client: 'Freiluft-Konzertreihe (fiktiv)',
    format: 'DIN A1 · 594 × 841 mm, City-Light 1185 × 1750 mm',
    services: 'Plakatsystem, Typografie, Social-Media-Ableitungen',
    fonts: 'Bricolage Grotesque, Instrument Serif, JetBrains Mono',
    palette: ['#F0EEE8', '#141414', '#E0301E', '#1FA15A'],
    desc: 'Ein Plakat nach den Regeln der Schweizer Typografie: strenges Raster, linksbündiger Satz, viel Weißraum und konzentrische Kreise als Klangwellen. Das System lässt sich auf jede Spielstätte und jedes Format übertragen.',
    svg: function (p) {
      var s = SVG_OPEN(600, 840, 'Modernes Festivalplakat Jazz im Kessel mit Kreisen und großer Typografie');
      s += '<rect width="600" height="840" fill="#F0EEE8"/>';
      for (var c = 1; c < 6; c++) s += '<line x1="' + (36 + c * 88) + '" y1="0" x2="' + (36 + c * 88) + '" y2="840" stroke="#141414" stroke-opacity=".07"/>';
      s += '<line x1="0" y1="96" x2="600" y2="96" stroke="#141414" stroke-opacity=".07"/><line x1="0" y1="560" x2="600" y2="560" stroke="#141414" stroke-opacity=".07"/>';
      s += '<circle cx="398" cy="318" r="138" fill="#E0301E"/>';
      for (var r = 26; r <= 210; r += 23) s += '<circle cx="340" cy="292" r="' + r + '" fill="none" stroke="#141414" stroke-width="' + (r % 46 === 26 ? 2.4 : 1) + '"/>';
      s += '<circle cx="340" cy="292" r="11" fill="#141414"/>';
      s += '<circle cx="500" cy="430" r="18" fill="#1FA15A"/>';
      var R = rng(42);
      for (var b = 0; b < 44; b++) {
        var hgt = 6 + Math.abs(Math.sin(b * 0.42) * 30) + R() * 22;
        s += '<rect x="' + (36 + b * 12.3) + '" y="' + r1(516 - hgt) + '" width="6.5" height="' + r1(hgt) + '" fill="#141414"/>';
      }
      s += '<text x="36" y="70" font-family="' + F.display + '" font-weight="700" font-size="25" fill="#141414" style="font-stretch:85%">16.–18. Juli 2027</text>';
      s += '<text x="564" y="58" text-anchor="end" font-family="' + F.mono + '" font-size="11" fill="#141414">Freiluft-Konzertreihe</text>';
      s += '<text x="564" y="74" text-anchor="end" font-family="' + F.mono + '" font-size="11" fill="#141414">Stuttgart-Mitte</text>';
      s += '<text x="28" y="712" font-family="' + F.display + '" font-weight="800" font-size="262" letter-spacing="-12" fill="#141414" style="font-stretch:75%">Jazz</text>';
      s += '<text x="372" y="664" font-family="' + F.inst + '" font-style="italic" font-size="66" fill="#E0301E">im Kessel</text>';
      var ven = [['Fr 16.07.', 'Schlossplatz'], ['Sa 17.07.', 'Bohnenviertel'], ['So 18.07.', 'Feuersee']];
      for (var v = 0; v < 3; v++) {
        s += '<text x="' + (36 + v * 176) + '" y="760" font-family="' + F.display + '" font-weight="700" font-size="15" fill="#141414">' + ven[v][0] + '</text>';
        s += '<text x="' + (36 + v * 176) + '" y="780" font-family="' + F.display + '" font-size="15" fill="#141414">' + ven[v][1] + '</text>';
      }
      s += '<line x1="36" y1="736" x2="564" y2="736" stroke="#141414" stroke-width="1.5"/>';
      s += lines(36, 806, 15, ['Nachtschwärmer Trio · Ella Rebstock Quartett', 'Stäffele Brass Band · Neckar Funk Collective'], 'font-family="' + F.mono + '" font-size="10.5" fill="#141414"');
      s += '<text x="564" y="806" text-anchor="end" font-family="' + F.mono + '" font-size="10.5" fill="#E0301E">Eintritt frei</text>';
      s += '<text x="564" y="821" text-anchor="end" font-family="' + F.mono + '" font-size="10.5" fill="#141414">Hut geht rum</text>';
      return s + '</svg>';
    }
  });

  /* ======================================================================
     3 · Bauhaus-Hommage (Abstrakt)
     ====================================================================== */
  WORKS.push({
    id: 'poster-bauhaus', size: 'tall',
    title: 'Neues Bauen · Hommage',
    cat: 'Plakat · Abstrakt',
    tags: ['plakat', 'abstrakt', 'modern'],
    lang: 'DE',
    client: 'Freies Konzeptplakat',
    format: 'DIN A1 · 594 × 841 mm',
    services: 'Konzept, Komposition, Typografie',
    fonts: 'Bricolage Grotesque, JetBrains Mono',
    palette: ['#EEE8DA', '#D2402F', '#23408E', '#F1BE2C', '#171717'],
    desc: 'Eine Verbeugung vor der Weissenhofsiedlung auf dem Killesberg, die 1927 die Moderne nach Stuttgart brachte. Kreis, Quadrat und Dreieck in den Grundfarben, dazu die weißen Kuben mit ihren Fensterbändern – hundert Jahre später.',
    svg: function (p) {
      var s = SVG_OPEN(600, 840, 'Abstraktes Bauhaus-Plakat mit geometrischen Formen und weißen Kuben');
      s += '<rect width="600" height="840" fill="#EEE8DA"/>';
      s += '<circle cx="400" cy="292" r="170" fill="#F1BE2C"/>';
      s += '<rect x="138" y="128" width="172" height="360" fill="#23408E"/>';
      s += '<path d="M600,840L600,520L280,840Z" fill="#D2402F"/>';
      s += '<rect x="420" y="96" width="120" height="120" fill="#D2402F" transform="rotate(14 480 156)"/>';
      s += '<line x1="150" y1="800" x2="590" y2="230" stroke="#171717" stroke-width="10"/>';
      s += '<circle cx="196" cy="600" r="44" fill="none" stroke="#171717" stroke-width="10"/>';
      // weiße Kuben mit Fensterbändern
      s += '<g>' +
        '<rect x="196" y="352" width="252" height="132" fill="#FAF8F2" stroke="#171717" stroke-width="2.5"/>' +
        '<rect x="300" y="290" width="148" height="62" fill="#FAF8F2" stroke="#171717" stroke-width="2.5"/>' +
        '<rect x="214" y="380" width="150" height="16" fill="#171717"/><rect x="214" y="430" width="216" height="16" fill="#171717"/>' +
        '<rect x="316" y="310" width="116" height="14" fill="#171717"/>' +
        '<path d="M300,290v-14h148v14" fill="none" stroke="#171717" stroke-width="2"/>' +
        '<line x1="312" y1="276" x2="312" y2="290" stroke="#171717" stroke-width="2"/><line x1="340" y1="276" x2="340" y2="290" stroke="#171717" stroke-width="2"/><line x1="368" y1="276" x2="368" y2="290" stroke="#171717" stroke-width="2"/><line x1="396" y1="276" x2="396" y2="290" stroke="#171717" stroke-width="2"/><line x1="424" y1="276" x2="424" y2="290" stroke="#171717" stroke-width="2"/>' +
        '<rect x="390" y="456" width="34" height="28" fill="#D2402F"/>' +
        '</g>';
      s += '<text transform="translate(112 806) rotate(-90)" font-family="' + F.display + '" font-weight="800" font-size="104" letter-spacing="-3" fill="#171717" style="font-stretch:75%">NEUES BAUEN</text>';
      s += '<text x="560" y="636" text-anchor="end" font-family="' + F.display + '" font-weight="800" font-size="84" fill="#171717" style="font-stretch:75%">1927</text>';
      s += '<text x="560" y="712" text-anchor="end" font-family="' + F.display + '" font-weight="300" font-size="84" fill="#FAF8F2" style="font-stretch:75%">2027</text>';
      s += '<text x="138" y="70" font-family="' + F.mono + '" font-size="12" letter-spacing="2" fill="#171717">HOMMAGE AN DIE WEISSENHOFSIEDLUNG</text>';
      s += '<text x="138" y="90" font-family="' + F.mono + '" font-size="12" letter-spacing="2" fill="#171717">STUTTGART · KILLESBERG</text>';
      return s + '</svg>';
    }
  });

  /* ======================================================================
     4 · Tech-Meetup (Englisch, Abstrakt)
     ====================================================================== */
  WORKS.push({
    id: 'poster-tech', size: 'tall',
    title: 'Neckar Valley Tech Night',
    cat: 'Poster · Abstract',
    tags: ['plakat', 'abstrakt', 'modern', 'english'],
    lang: 'EN',
    client: 'Community-Meetup (fiktiv)',
    format: 'DIN A2 · 420 × 594 mm, Social 1080 × 1350 px',
    services: 'Key Visual, Poster, Event-Grafiken',
    fonts: 'Bricolage Grotesque, Instrument Serif, JetBrains Mono',
    palette: ['#0E1630', '#36D6C3', '#C6F35B', '#FF5DA2', '#F1F3EE'],
    desc: 'Ein englischsprachiges Plakat für ein internationales Tech-Meetup in Feuerbach. Hunderte parallele Linien formen den Neckar als Datenstrom – generiert per Code, reingezeichnet als Vektor.',
    svg: function (p) {
      var s = SVG_OPEN(600, 840, 'Englisches Plakat Neckar Valley Tech Night mit fließenden Linien');
      s += '<defs><linearGradient id="' + p + 'flow" x1="0" y1="0" x2="1" y2="0"><stop offset="0" stop-color="#36D6C3"/><stop offset=".55" stop-color="#C6F35B"/><stop offset="1" stop-color="#FF5DA2"/></linearGradient></defs>';
      s += '<rect width="600" height="840" fill="#0E1630"/>';
      s += '<g fill="none" stroke="url(#' + p + 'flow)" stroke-width="1.3">';
      for (var i = 0; i < 46; i++) {
        var y0 = 330 + i * 7.5, k = i / 46;
        s += '<path d="M-20,' + r1(y0 + 40) + 'C130,' + r1(y0 - 150 + k * 60) + ' 300,' + r1(y0 + 170 - k * 80) + ' 460,' + r1(y0 - 20) + 'S600,' + r1(y0 - 120 + k * 40) + ' 640,' + r1(y0 - 90) + '" opacity="' + r1(0.35 + 0.65 * Math.sin(k * Math.PI)) + '"/>';
      }
      s += '</g>';
      s += '<text x="40" y="76" font-family="' + F.mono + '" font-size="12" letter-spacing="1" fill="#C6F35B">#07 — COMMUNITY MEETUP</text>';
      s += '<text x="40" y="168" font-family="' + F.display + '" font-weight="800" font-size="100" letter-spacing="-3" fill="#F1F3EE" style="font-stretch:75%">NECKAR</text>';
      s += '<text x="40" y="258" font-family="' + F.display + '" font-weight="800" font-size="100" letter-spacing="-3" fill="#F1F3EE" style="font-stretch:75%">VALLEY</text>';
      s += '<text x="36" y="336" font-family="' + F.inst + '" font-style="italic" font-size="84" fill="#C6F35B">Tech Night</text>';
      s += lines(40, 692, 22, ['THU 12 NOV 2026 — 18:30', 'Stuttgart-Feuerbach · Hall 3', 'Talks · Demos · Brezeln &amp; Beer', 'Free entry — RSVP via QR code'], 'font-family="' + F.mono + '" font-size="14" fill="#F1F3EE"');
      s += qrish(452, 668, 108, 11, '#0E1630', '#F1F3EE');
      s += '<line x1="40" y1="650" x2="560" y2="650" stroke="#F1F3EE" stroke-opacity=".3"/>';
      return s + '</svg>';
    }
  });

  /* ======================================================================
     5 · Plattencover (Retro, 70er)
     ====================================================================== */
  WORKS.push({
    id: 'lp-staeffele', size: 'wide',
    title: 'Die Stäffelesrutscher – Live im Kessel',
    cat: 'Plattencover · Retro',
    tags: ['retro', 'illustration'],
    lang: 'DE',
    client: 'Band „Die Stäffelesrutscher“ (fiktiv)',
    format: 'LP-Cover · 315 × 315 mm',
    services: 'Cover-Illustration, Schriftzug, Label',
    fonts: 'Fraunces (Soft/Wonk), JetBrains Mono',
    palette: ['#F2E2BF', '#5A3825', '#D8652B', '#E9A93A', '#8A9A3B', '#2E6B5E'],
    desc: 'Ein Live-Album im Look der 70er: Regenbogen-Sonnenuntergang, weiche Schrift mit Charakter und eine Stäffele, deren Geländer als Rutsche dient. „Stäffelesrutscher“ nennt man in Stuttgart übrigens die Einheimischen.',
    svg: function (p) {
      var s = SVG_OPEN(760, 600, 'Retro-Plattencover mit Regenbogen-Sonnenuntergang und Treppe, daneben die Schallplatte');
      s += '<defs><clipPath id="' + p + 'sl"><rect width="600" height="600"/></clipPath>' + grain(p, 0.08) + '</defs>';
      s += '<rect width="760" height="600" fill="#E7DCC8"/>';
      // Platte
      s += '<circle cx="566" cy="300" r="252" fill="#141414"/>';
      for (var g = 96; g < 248; g += 7) s += '<circle cx="566" cy="300" r="' + g + '" fill="none" stroke="#2B2B2B" stroke-width="1.2"/>';
      s += '<path d="M640,62A252,252 0 0 1 756,186" fill="none" stroke="#3a3a3a" stroke-width="8" opacity=".6"/>';
      s += '<circle cx="566" cy="300" r="84" fill="#E9A93A"/><circle cx="566" cy="300" r="60" fill="none" stroke="#5A3825" stroke-width="2"/>';
      // Hülle
      s += '<g clip-path="url(#' + p + 'sl)"><rect width="600" height="600" fill="#F2E2BF"/>';
      var cols = ['#5A3825', '#D8652B', '#E9A93A', '#8A9A3B', '#2E6B5E', '#F2E2BF'];
      for (var c = 0; c < cols.length; c++) s += '<circle cx="300" cy="660" r="' + (346 - c * 40) + '" fill="' + cols[c] + '"/>';
      // Treppe mit Geländer und Rutscher
      var st = 'M40,600';
      for (var k = 0; k < 13; k++) st += 'V' + (600 - (k + 1) * 26) + 'H' + (40 + (k + 1) * 24);
      s += '<path d="' + st + 'V600Z" fill="#5A3825"/>';
      s += '<path d="' + st + '" fill="none" stroke="#F2E2BF" stroke-width="3"/>';
      s += '<line x1="40" y1="548" x2="358" y2="210" stroke="#F2E2BF" stroke-width="5" stroke-linecap="round"/>';
      for (var q = 0; q < 6; q++) { var lx = 70 + q * 56; s += '<line x1="' + lx + '" y1="' + r1(548 - (lx - 40) * 1.063) + '" x2="' + lx + '" y2="' + r1(574 - (lx - 40) * 1.083) + '" stroke="#F2E2BF" stroke-width="3"/>'; }
      s += '<g transform="translate(188 384) rotate(-46)"><ellipse cx="0" cy="-8" rx="20" ry="9" fill="#D8652B"/><circle cx="22" cy="-18" r="9" fill="#F2E2BF"/><path d="M-16,-10l-18,14M12,-14l16,-12M-6,-4l4,18" stroke="#F2E2BF" stroke-width="5" stroke-linecap="round"/><path d="M14,-26q10,-8 18,0" fill="none" stroke="#5A3825" stroke-width="4" stroke-linecap="round"/></g>';
      s += '</g>';
      s += '<text x="40" y="74" font-family="' + F.serif + '" font-style="italic" font-weight="600" font-size="30" fill="#5A3825" style="font-variation-settings:\'SOFT\' 100, \'WONK\' 1">Die</text>';
      var title = 'font-family="' + F.serif + '" font-weight="900" font-size="80" letter-spacing="-2" style="font-variation-settings:\'SOFT\' 100, \'WONK\' 1"';
      s += '<text x="36" y="148" ' + title + ' fill="#F2E2BF" stroke="#5A3825" stroke-width="12" stroke-linejoin="round">Stäffeles-</text><text x="36" y="148" ' + title + ' fill="#D8652B">Stäffeles-</text>';
      s += '<text x="36" y="222" ' + title + ' fill="#F2E2BF" stroke="#5A3825" stroke-width="12" stroke-linejoin="round">rutscher</text><text x="36" y="222" ' + title + ' fill="#D8652B">rutscher</text>';
      s += '<text x="44" y="270" font-family="' + F.serif + '" font-style="italic" font-weight="600" font-size="32" fill="#5A3825" style="font-variation-settings:\'SOFT\' 100">Live im Kessel</text>';
      s += '<circle cx="524" cy="78" r="44" fill="#5A3825"/><text x="524" y="78" text-anchor="middle" font-family="' + F.serif + '" font-weight="900" font-size="22" fill="#F2E2BF">33 1/3</text><text x="524" y="98" text-anchor="middle" font-family="' + F.mono + '" font-size="10" letter-spacing="2" fill="#F2E2BF">STEREO</text>';
      s += '<text x="560" y="584" text-anchor="end" font-family="' + F.mono + '" font-size="11" fill="#F2E2BF">KT 0711 · KESSELTON</text>';
      s += '<rect width="600" height="600" filter="url(#' + p + 'grain)"/>';
      return s + '</svg>';
    }
  });

  /* ======================================================================
     6 · Speisekarte Wirtshaus (Deutsch, traditionell)
     ====================================================================== */
  WORKS.push({
    id: 'menu-staeffele', size: 'tall',
    title: 'Speisekarte „Zum Goldenen Stäffele“',
    cat: 'Speisekarte · Klassisch',
    tags: ['gastro', 'retro', 'illustration'],
    lang: 'DE',
    client: 'Schwäbisches Wirtshaus in Heslach (fiktiv)',
    format: 'DIN A4 · 210 × 297 mm',
    services: 'Speisekarte, Vignette, Typografie',
    fonts: 'Fraunces, JetBrains Mono',
    palette: ['#F6EFDD', '#1F4D3A', '#9C2B2B', '#B8862E', '#2A231C'],
    desc: 'Eine Speisekarte für ein traditionelles Wirtshaus: Maultaschen, Kässpätzle und ein Viertele Trollinger, gesetzt in einer weichen Antiqua mit Punktlinien und einer runden Vignette mit Weinberg und Fernsehturm. Die Abschnitte heißen, wie man im Wirtshaus redet.',
    svg: function (p) {
      var ink = '#2A231C', green = '#1F4D3A', red = '#9C2B2B', gold = '#B8862E';
      var s = SVG_OPEN(600, 848, 'Traditionelle schwäbische Speisekarte mit Maultaschen, Kässpätzle und Trollinger');
      s += '<defs><clipPath id="' + p + 'vig"><circle cx="300" cy="118" r="70"/></clipPath></defs>';
      s += '<rect width="600" height="848" fill="#F6EFDD"/>';
      s += '<rect x="18" y="18" width="564" height="812" fill="none" stroke="' + green + '" stroke-width="2"/><rect x="25" y="25" width="550" height="798" fill="none" stroke="' + green + '" stroke-width=".8"/>';
      var corners = [[25, 25], [575, 25], [25, 823], [575, 823]];
      for (var c = 0; c < 4; c++) s += '<rect x="' + (corners[c][0] - 6) + '" y="' + (corners[c][1] - 6) + '" width="12" height="12" transform="rotate(45 ' + corners[c][0] + ' ' + corners[c][1] + ')" fill="' + gold + '"/>';
      // Vignette
      s += '<circle cx="300" cy="118" r="80" fill="none" stroke="' + green + '" stroke-width="1" stroke-dasharray="1 4" stroke-linecap="round"/>';
      s += '<g clip-path="url(#' + p + 'vig)"><rect x="220" y="40" width="160" height="160" fill="#F3DFAE"/><circle cx="300" cy="108" r="26" fill="#E8B54E"/>';
      var vh = hill([[220, 132], [262, 116], [300, 128], [340, 110], [380, 122]], 200);
      s += '<path d="' + vh + '" fill="#6E8B4A"/>' + vineRows(p + 'vr', vh, 220, 380, 108, 200, 8, 0.5, '#4E6B33', 2);
      s += tower(344, 116, 70, green, red, '#F6EFDD');
      s += '<path d="' + hill([[220, 160], [280, 150], [330, 164], [380, 152]], 200) + '" fill="' + green + '"/>';
      s += '</g><circle cx="300" cy="118" r="70" fill="none" stroke="' + green + '" stroke-width="2.5"/>';
      s += '<text x="300" y="226" text-anchor="middle" font-family="' + F.mono + '" font-size="11" letter-spacing="4" fill="' + red + '">ZUM GOLDENEN</text>';
      s += '<text x="300" y="268" text-anchor="middle" font-family="' + F.serif + '" font-weight="800" font-size="44" fill="' + green + '" style="font-variation-settings:\'SOFT\' 50, \'WONK\' 1">Stäffele</text>';
      s += '<text x="300" y="292" text-anchor="middle" font-family="' + F.serif + '" font-style="italic" font-size="14" fill="' + ink + '">Schwäbisches Wirtshaus · Stuttgart-Heslach · seit 1897</text>';
      s += '<path d="M150,312h110M340,312h110" stroke="' + gold + '" stroke-width="1.2"/><path d="M300,306l6,6-6,6-6-6z" fill="' + gold + '"/>';
      var o = { nameFont: F.serif, nameSize: 16, ink: ink, lead: '#8C7B5E', priceFont: F.serif, priceSize: 15, descFont: F.serif, descSize: 11.5, desc: '#6B5D49', descGap: 16, descStyle: 'font-style:italic' };
      var sec = function (y, t) { return '<text x="64" y="' + y + '" font-family="' + F.serif + '" font-style="italic" font-weight="700" font-size="21" fill="' + red + '" style="font-variation-settings:\'WONK\' 1">' + t + '</text><line x1="64" y1="' + (y + 8) + '" x2="536" y2="' + (y + 8) + '" stroke="' + red + '" stroke-width=".8" opacity=".5"/>'; };
      s += sec(350, 'Vorneweg');
      s += menuItem(64, 536, 380, 'Flädlesuppe', '6,90', 'Kräftige Rinderbrühe mit Pfannkuchenstreifen und Schnittlauch', o);
      s += menuItem(64, 536, 418, 'Schwäbischer Wurstsalat', '12,50', 'mit Zwiebeln, Essiggurken und Bauernbrot', o);
      s += sec(468, 'Hauptsach');
      s += menuItem(64, 536, 498, 'Maultaschen, gschmälzt', '16,90', 'mit Zwiebelschmelze und schwäbischem Kartoffelsalat', o);
      s += menuItem(64, 536, 536, 'Kässpätzle', '15,50', 'handgeschabt, mit Bergkäse, Röstzwiebeln und Endiviensalat', o);
      s += menuItem(64, 536, 574, 'Zwiebelrostbraten', '29,50', 'vom Albrind, mit Spätzle und Bratensoße', o);
      s += menuItem(64, 536, 612, 'Linsen mit Spätzle', '14,90', 'und Saitenwürstle – wie bei Oma am Samstag', o);
      s += sec(662, 'Ebbes Süßes');
      s += menuItem(64, 284, 692, 'Ofenschlupfer', '7,90', 'mit Vanillesoße', o);
      s += menuItem(64, 284, 730, 'Träubleskuchen', '4,90', 'mit Baiserhaube', o);
      s += '<text x="316" y="662" font-family="' + F.serif + '" font-style="italic" font-weight="700" font-size="21" fill="' + red + '" style="font-variation-settings:\'WONK\' 1">Zum Schlotza</text>';
      s += menuItem(316, 536, 692, 'Viertele Trollinger', '6,80', 'Halbhöhenlage, 0,25 l', o);
      s += menuItem(316, 536, 730, 'Most vom Fass', '4,20', 'naturtrüb, 0,5 l', o);
      s += '<path d="M90,770h420" stroke="' + gold + '" stroke-width="1"/>';
      s += '<text x="300" y="796" text-anchor="middle" font-family="' + F.serif + '" font-style="italic" font-weight="600" font-size="17" fill="' + green + '">Net gschimpft isch gnug globt.</text>';
      s += '<text x="300" y="814" text-anchor="middle" font-family="' + F.mono + '" font-size="8.5" fill="#6B5D49">Alle Preise in Euro inkl. MwSt. · Fragen Sie unser Team nach Allergenen.</text>';
      return s + '</svg>';
    }
  });

  /* ======================================================================
     7 · English Menu (modern)
     ====================================================================== */
  WORKS.push({
    id: 'menu-kitchen', size: 'tall',
    title: 'The Kessel Kitchen',
    cat: 'Menu · Modern',
    tags: ['gastro', 'modern', 'english'],
    lang: 'EN',
    client: 'Restaurant in Stuttgart-Mitte (fiktiv)',
    format: 'DIN A4 · 210 × 297 mm',
    services: 'Menu design, English copywriting, illustration',
    fonts: 'Bricolage Grotesque, Instrument Serif',
    palette: ['#FFF8EC', '#0E3B2E', '#F26B4F', '#F6D776', '#10241C'],
    desc: 'Eine englische Speisekarte für Gäste aus aller Welt: Jedes schwäbische Gericht wird kurz erklärt – inklusive der Legende, warum Maultaschen „Herrgottsbscheißerle“ heißen. Klare Farbflächen und viel Luft machen sie modern.',
    svg: function (p) {
      var g = '#0E3B2E', coral = '#F26B4F', butter = '#F6D776', ink = '#10241C', paper = '#FFF8EC';
      var s = SVG_OPEN(600, 848, 'Moderne englische Speisekarte für schwäbische Küche in Stuttgart');
      s += '<defs><clipPath id="' + p + 'hd"><rect width="600" height="236"/></clipPath></defs>';
      s += '<rect width="600" height="848" fill="' + paper + '"/>';
      s += '<g clip-path="url(#' + p + 'hd)"><rect width="600" height="236" fill="' + g + '"/>';
      s += '<circle cx="520" cy="96" r="128" fill="' + butter + '"/><circle cx="520" cy="96" r="104" fill="#FFF3CC"/>';
      var mt = function (x, y, rot) { return '<g transform="translate(' + x + ' ' + y + ') rotate(' + rot + ')"><rect x="-34" y="-24" width="68" height="48" rx="12" fill="' + coral + '"/><rect x="-28" y="-18" width="56" height="36" rx="8" fill="#F68A70"/><rect x="-34" y="-24" width="68" height="48" rx="12" fill="none" stroke="#D2533A" stroke-width="5" stroke-dasharray="1.5 6" stroke-linecap="round"/></g>'; };
      s += mt(488, 70, -18) + mt(552, 118, 12) + mt(476, 140, 8);
      s += '<path d="M520,44c8,-12 22,-12 28,-4M548,160c10,4 18,0 22,-8M450,104c-6,-10 -2,-20 8,-22" fill="none" stroke="#3E8C5A" stroke-width="4" stroke-linecap="round"/>';
      s += '</g>';
      s += '<text x="40" y="64" font-family="' + F.mono + '" font-size="11" letter-spacing="2" fill="' + butter + '">STUTTGART-MITTE · SINCE YESTERDAY</text>';
      s += '<text x="36" y="124" font-family="' + F.display + '" font-weight="800" font-size="62" letter-spacing="-2" fill="' + paper + '" style="font-stretch:75%">The Kessel</text>';
      s += '<text x="36" y="178" font-family="' + F.display + '" font-weight="800" font-size="62" letter-spacing="-2" fill="' + paper + '" style="font-stretch:75%">Kitchen</text>';
      s += '<text x="38" y="214" font-family="' + F.inst + '" font-style="italic" font-size="26" fill="' + butter + '">Swabian comfort food, explained.</text>';
      var items = [
        ['Maultaschen', 'Swabian pasta pockets', ['Filled with meat, spinach and herbs.', 'Legend says monks hid the meat from', 'God during Lent – hence the nickname', 'Herrgottsbscheißerle.'], '16.90'],
        ['Käsespätzle', 'Swabian mac ’n’ cheese', ['Hand-scraped egg noodles, Alpine', 'cheese and crispy fried onions.', 'Dangerously addictive.'], '15.50'],
        ['Zwiebelrostbraten', 'Roast beef &amp; onions', ['Pan-seared sirloin with fried', 'onions, gravy and Spätzle.'], '29.50'],
        ['Linsen mit Spätzle', 'Lentils &amp; noodles', ['With Saitenwürstle, the local', 'frankfurters. Every Swabian’s', 'Saturday lunch as a kid.'], '14.90'],
        ['Ofenschlupfer', 'Bread &amp; apple pudding', ['Baked with apples and raisins,', 'served with warm vanilla sauce.'], '7.90'],
        ['A Viertele Trollinger', 'Local light red, 0.25 l', ['Grown on vineyards inside the city.', 'Stuttgarters order wine by the', 'quarter litre. Now you do too.'], '6.80']
      ];
      for (var i = 0; i < items.length; i++) {
        var col = i % 2, row = Math.floor(i / 2);
        var x = 40 + col * 278, y = 286 + row * 160;
        var it = items[i];
        s += '<text x="' + x + '" y="' + y + '" font-family="' + F.display + '" font-weight="700" font-size="20" fill="' + ink + '" style="font-stretch:85%">' + it[0] + '</text>';
        s += '<text x="' + (x + 242) + '" y="' + y + '" text-anchor="end" font-family="' + F.display + '" font-weight="600" font-size="16" fill="' + coral + '">€' + it[3] + '</text>';
        s += '<text x="' + x + '" y="' + (y + 22) + '" font-family="' + F.inst + '" font-style="italic" font-size="17" fill="' + coral + '">' + it[1] + '</text>';
        s += lines(x, y + 46, 17, it[2], 'font-family="' + F.display + '" font-size="12.5" fill="#3D5248"');
        s += '<line x1="' + x + '" y1="' + (y + 128) + '" x2="' + (x + 242) + '" y2="' + (y + 128) + '" stroke="' + ink + '" stroke-opacity=".15"/>';
      }
      s += '<rect x="0" y="762" width="600" height="86" fill="' + butter + '"/>';
      s += '<text x="40" y="798" font-family="' + F.display + '" font-weight="700" font-size="17" fill="' + ink + '">How to sound local: „An Guada!“</text>';
      s += '<text x="40" y="820" font-family="' + F.inst + '" font-style="italic" font-size="16" fill="' + ink + '">= Enjoy your meal, Swabian style.</text>';
      s += '<text x="560" y="808" text-anchor="end" font-family="' + F.mono + '" font-size="11" fill="' + ink + '">Open daily · 11:30 – 22:00</text>';
      return s + '</svg>';
    }
  });

  /* ======================================================================
     8 · Bürgerbeteiligung (Behörde)
     ====================================================================== */
  WORKS.push({
    id: 'gov-staeffele', size: 'tall',
    title: 'Unsere Stäffele. Ihre Ideen.',
    cat: 'Behörde · Bürgerbeteiligung',
    tags: ['behoerde', 'plakat', 'illustration', 'modern'],
    lang: 'DE',
    client: 'Konzept für eine Kommune im Raum Stuttgart',
    format: 'DIN A1, A4-Flyer, Website-Banner',
    services: 'Kampagne, Illustration, barrierearme Gestaltung',
    fonts: 'Bricolage Grotesque',
    palette: ['#F5F7F6', '#14325C', '#FFC83D', '#2E8B57', '#DDE8F3'],
    desc: 'Eine Beteiligungskampagne zur Sanierung der städtischen Treppenanlagen. Große Schrift, hohe Kontraste und klare Handlungsaufforderungen – damit wirklich alle mitmachen können. Mit Hinweisen auf Leichte Sprache und barrierefreie Veranstaltungsorte.',
    svg: function (p) {
      var navy = '#14325C', yel = '#FFC83D', grn = '#2E8B57', sky = '#DDE8F3';
      var s = SVG_OPEN(600, 840, 'Plakat einer Bürgerbeteiligung zu Stuttgarter Stäffele mit Illustration von Treppen und Menschen');
      s += '<rect width="600" height="840" fill="#F5F7F6"/>';
      s += '<rect width="600" height="64" fill="' + navy + '"/>';
      s += '<g transform="translate(36 14)"><path d="M0,0h30v20c0,9 -7,15 -15,18c-8,-3 -15,-9 -15,-18z" fill="' + yel + '"/><path d="M6,26h6v-6h6v-6h6" fill="none" stroke="' + navy + '" stroke-width="3"/></g>';
      s += '<text x="80" y="31" font-family="' + F.display + '" font-weight="700" font-size="15" fill="#fff">Ihre Stadtverwaltung</text><text x="80" y="49" font-family="' + F.display + '" font-size="12" fill="#C9D6E6">Amt für Stadtplanung</text>';
      s += '<text x="564" y="40" text-anchor="end" font-family="' + F.mono + '" font-size="11" letter-spacing="1" fill="' + yel + '">BÜRGERBETEILIGUNG 2027</text>';
      // Illustration
      s += '<rect x="36" y="88" width="528" height="372" rx="14" fill="' + sky + '"/>';
      s += '<circle cx="470" cy="160" r="38" fill="' + yel + '"/>';
      s += '<path d="M36,330C140,250 260,220 360,200C440,186 520,190 564,196V446a14,14 0 0 1 -14,14H50a14,14 0 0 1 -14,-14Z" fill="#A9D3B5"/>';
      s += '<path d="M36,400C150,350 300,330 564,320V446a14,14 0 0 1 -14,14H50a14,14 0 0 1 -14,-14Z" fill="#7DBB92"/>';
      var st = 'M150,460', sx = 150, sy = 460;
      for (var k = 0; k < 12; k++) { sx += 18; sy -= 17; st += 'H' + sx + 'V' + sy; }
      s += '<path d="' + st + 'H' + (sx + 30) + 'V460Z" fill="#fff"/><path d="' + st + '" fill="none" stroke="' + navy + '" stroke-width="3" stroke-linejoin="round"/>';
      s += '<line x1="146" y1="432" x2="366" y2="226" stroke="' + navy + '" stroke-width="3" stroke-linecap="round"/>';
      s += house(80, 330, 46, 40, '#fff', '#C0583F', navy) + house(410, 236, 52, 44, '#fff', navy, '#7DA6D8') + house(474, 250, 40, 34, '#FFE7A0', '#C0583F', navy) + house(420, 330, 60, 50, '#fff', '#C0583F', navy);
      var tree = function (x, y, r) { return '<rect x="' + (x - 2) + '" y="' + y + '" width="4" height="' + (r + 6) + '" fill="' + navy + '"/><circle cx="' + x + '" cy="' + y + '" r="' + r + '" fill="' + grn + '"/>'; };
      s += tree(60, 290, 16) + tree(300, 300, 20) + tree(520, 300, 14) + tree(380, 420, 18);
      var person = function (x, y, c, sc) { return '<g transform="translate(' + x + ' ' + y + ') scale(' + (sc || 1) + ')"><circle cx="0" cy="-34" r="7" fill="' + navy + '"/><path d="M-9,-24h18l-2,22h-14z" fill="' + c + '"/><path d="M-5,-2l-3,14M5,-2l3,14" stroke="' + navy + '" stroke-width="4" stroke-linecap="round"/></g>'; };
      s += person(212, 402, '#E2574C') + person(268, 352, yel) + person(330, 296, grn, 0.9) + person(470, 420, '#7DA6D8', 1.1);
      s += '<g transform="translate(470 420)"><circle cx="18" cy="-46" r="12" fill="#fff" stroke="' + navy + '" stroke-width="2"/><text x="18" y="-41" text-anchor="middle" font-family="' + F.display + '" font-weight="800" font-size="14" fill="' + navy + '">!</text></g>';
      s += '<g transform="translate(268 352)"><path d="M10,-74h40a8,8 0 0 1 8,8v16a8,8 0 0 1 -8,8h-26l-10,8v-8h-4a8,8 0 0 1 -8,-8v-16a8,8 0 0 1 8,-8z" fill="#fff" stroke="' + navy + '" stroke-width="2"/><path d="M30,-68a7,7 0 0 1 4,13v3h-8v-3a7,7 0 0 1 4,-13z" fill="' + yel + '" stroke="' + navy + '" stroke-width="1.6"/></g>';
      // Text
      s += '<text x="36" y="526" font-family="' + F.display + '" font-weight="800" font-size="52" letter-spacing="-1.5" fill="' + navy + '" style="font-stretch:80%">Unsere Stäffele.</text>';
      s += '<text x="36" y="580" font-family="' + F.display + '" font-weight="800" font-size="52" letter-spacing="-1.5" fill="' + grn + '" style="font-stretch:80%">Ihre Ideen.</text>';
      s += lines(36, 616, 22, ['Geländer, Licht, Sitzplätze, Begrünung: Wie sollen die', 'städtischen Treppen in Zukunft aussehen? Sagen Sie es uns.'], 'font-family="' + F.display + '" font-size="17" fill="#22324A"');
      s += '<rect x="36" y="672" width="252" height="92" rx="10" fill="' + navy + '"/>';
      s += '<text x="54" y="700" font-family="' + F.mono + '" font-size="11" letter-spacing="1" fill="' + yel + '">ONLINE MITMACHEN</text><text x="54" y="726" font-family="' + F.display + '" font-weight="700" font-size="19" fill="#fff">bis 31. März 2027</text><text x="54" y="748" font-family="' + F.display + '" font-size="13" fill="#C9D6E6">ihre-stadt.de/staeffele</text>';
      s += '<rect x="300" y="672" width="264" height="92" rx="10" fill="#fff" stroke="' + navy + '" stroke-width="2"/>';
      s += '<text x="318" y="700" font-family="' + F.mono + '" font-size="11" letter-spacing="1" fill="' + navy + '">INFOABEND</text><text x="318" y="726" font-family="' + F.display + '" font-weight="700" font-size="19" fill="' + navy + '">Do, 21. Januar 2027</text><text x="318" y="748" font-family="' + F.display + '" font-size="13" fill="#22324A">18 Uhr · Bürgerhaus · barrierefrei</text>';
      s += '<g transform="translate(36 790)" fill="none" stroke="' + navy + '" stroke-width="2"><circle cx="13" cy="13" r="13"/><circle cx="13" cy="7" r="2" fill="' + navy + '" stroke="none"/><path d="M13,10v7h5l2,5M9,14a6,6 0 1 0 8,6"/></g>';
      s += '<g transform="translate(74 790)"><rect width="26" height="26" rx="5" fill="none" stroke="' + navy + '" stroke-width="2"/><text x="13" y="18" text-anchor="middle" font-family="' + F.display + '" font-weight="800" font-size="11" fill="' + navy + '">LS</text></g>';
      s += '<text x="112" y="808" font-family="' + F.display + '" font-size="13" fill="#22324A">Alle Informationen auch in Leichter Sprache</text>';
      s += qrish(500, 778, 52, 3, navy, '#F5F7F6');
      return s + '</svg>';
    }
  });

  /* ======================================================================
     9 · Piktogramm-System (Behörde)
     ====================================================================== */
  WORKS.push({
    id: 'gov-piktogramme', size: 'wide',
    title: 'Piktogramme für den Bürgerservice',
    cat: 'Behörde · Informationsdesign',
    tags: ['behoerde', 'modern', 'illustration'],
    lang: 'DE',
    client: 'Konzept für eine Stadtverwaltung',
    format: 'Raster 64 × 64 px, skalierbar bis Schildergröße',
    services: 'Icon-System, Leitsystem, Gestaltungsregeln',
    fonts: 'Bricolage Grotesque, JetBrains Mono',
    palette: ['#F4F6F8', '#14325C', '#FFC83D', '#DDE8F3'],
    desc: 'Zwölf Piktogramme für Wegweiser, Website und Formulare einer Stadtverwaltung – vom Bürgerbüro bis zur Kehrwoche. Einheitliche Strichstärke, ein festes Raster und abgerundete Enden sorgen dafür, dass sie auch auf Schildern aus der Ferne lesbar bleiben.',
    svg: function (p) {
      var navy = '#14325C', yel = '#FFC83D';
      var icons = [
        ['Bürgerbüro', '<path d="M8,24L32,10L56,24Z"/><path d="M8,54H56M16,28V50M26,28V50M38,28V50M48,28V50"/>'],
        ['Standesamt', '<circle cx="24" cy="38" r="13"/><circle cx="40" cy="38" r="13"/><path d="M24,25l-5,-7h10z" fill="' + yel + '"/>'],
        ['Bibliothek', '<path d="M32,18C24,12 14,12 8,15V50C14,47 24,47 32,52C40,47 50,47 56,50V15C50,12 40,12 32,18Z"/><path d="M32,18V52"/>'],
        ['Hallenbad', '<circle cx="44" cy="20" r="5" fill="' + yel + '"/><path d="M14,36L28,26L38,34M8,46c6,-5 10,-5 16,0s10,5 16,0s10,-5 16,0M8,55c6,-5 10,-5 16,0s10,5 16,0s10,-5 16,0"/>'],
        ['Stadtbahn', '<rect x="16" y="12" width="32" height="38" rx="7"/><rect x="21" y="18" width="22" height="13" rx="2" fill="' + yel + '"/><path d="M24,12L32,5L40,12M22,56L26,50M42,56L38,50"/><circle cx="23" cy="41" r="2" fill="' + navy + '"/><circle cx="41" cy="41" r="2" fill="' + navy + '"/>'],
        ['Parken', '<rect x="8" y="8" width="48" height="48" rx="9"/><path d="M25,46V18H35A8,8 0 0 1 35,34H25"/>'],
        ['Kita', '<path d="M10,30L32,12L54,30V54H10Z"/><path d="M32,48c-8,-6 -11,-10 -11,-14a5,5 0 0 1 11,-2a5,5 0 0 1 11,2c0,4 -3,8 -11,14Z" fill="' + yel + '"/>'],
        ['Wertstoffhof', '<path d="M26,14L32,8L38,14M34,10L47,32M47,32l-1,-8M47,32l-8,-2M42,46H18l-1,-8M18,46l7,-5M14,38L24,20"/>'],
        ['Kehrwoche', '<path d="M48,6L30,36"/><path d="M18,36H40L46,58H12Z" fill="' + yel + '"/><path d="M20,44V58M27,44V58M34,44V58M41,44V58"/>'],
        ['Barrierefrei', '<circle cx="30" cy="10" r="4" fill="' + navy + '"/><path d="M30,16V32H42L48,46M30,22H42M24,28a14,14 0 1 0 16,20"/>'],
        ['Information', '<circle cx="32" cy="32" r="24"/><path d="M32,28V44"/><circle cx="32" cy="20" r="2.5" fill="' + navy + '"/>'],
        ['Freies WLAN', '<path d="M10,26a32,32 0 0 1 44,0M17,34a22,22 0 0 1 30,0M24,42a12,12 0 0 1 16,0"/><circle cx="32" cy="50" r="3.5" fill="' + yel + '"/>']
      ];
      var s = SVG_OPEN(840, 600, 'Zwölf einheitliche Piktogramme für Bürgerservices einer Stadtverwaltung');
      s += '<rect width="840" height="600" fill="#F4F6F8"/>';
      s += '<text x="40" y="52" font-family="' + F.display + '" font-weight="800" font-size="26" fill="' + navy + '" style="font-stretch:85%">Piktogramm-System · Bürgerservice</text>';
      s += '<text x="800" y="50" text-anchor="end" font-family="' + F.mono + '" font-size="11" fill="#5B6B80">Raster 64 × 64 · Strich 4 · Enden rund</text>';
      for (var i = 0; i < icons.length; i++) {
        var col = i % 4, row = Math.floor(i / 4), x = 40 + col * 195, y = 80 + row * 165;
        s += '<rect x="' + x + '" y="' + y + '" width="180" height="150" rx="10" fill="#fff"/>';
        s += '<g transform="translate(' + (x + 58) + ' ' + (y + 22) + ')">';
        s += '<rect x="0" y="0" width="64" height="64" fill="none" stroke="#DDE8F3"/><circle cx="32" cy="32" r="28" fill="none" stroke="#DDE8F3"/><rect x="8" y="8" width="48" height="48" fill="none" stroke="#DDE8F3"/>';
        s += '<g fill="none" stroke="' + navy + '" stroke-width="4" stroke-linecap="round" stroke-linejoin="round">' + icons[i][1] + '</g></g>';
        s += '<text x="' + (x + 90) + '" y="' + (y + 122) + '" text-anchor="middle" font-family="' + F.display + '" font-weight="600" font-size="15" fill="' + navy + '">' + icons[i][0] + '</text>';
      }
      s += '<text x="40" y="584" font-family="' + F.mono + '" font-size="10.5" fill="#5B6B80">Kontrast Dunkelblau auf Weiß 12,6 : 1 · erfüllt WCAG 2.1 AAA</text>';
      return s + '</svg>';
    }
  });

  /* ======================================================================
     10 · Abfuhrkalender (Behörde)
     ====================================================================== */
  WORKS.push({
    id: 'gov-abfall', size: 'tall',
    title: 'Abfuhrkalender 2027',
    cat: 'Behörde · Bürgerinfo',
    tags: ['behoerde', 'modern'],
    lang: 'DE',
    client: 'Konzept für einen Abfallwirtschaftsbetrieb',
    format: 'DIN A4, Leporello, PDF barrierefrei',
    services: 'Informationsdesign, Kalender-System, Farbleitsystem',
    fonts: 'Bricolage Grotesque, JetBrains Mono',
    palette: ['#14325C', '#5B6670', '#8B5A2B', '#2F6DB5', '#F2C230'],
    desc: 'Ein Abfuhrkalender, den man versteht, ohne die Brille zu suchen: Jede Tonne hat ihre Farbe und zusätzlich ein Symbol, damit auch Menschen mit Farbsehschwäche sicher erkennen, was wann abgeholt wird. Feiertagsverschiebungen sind deutlich markiert.',
    svg: function (p) {
      var navy = '#14325C';
      var bins = { R: ['#5B6670', 'Restmüll', '●'], B: ['#8B5A2B', 'Biomüll', '▲'], P: ['#2F6DB5', 'Papier', '■'], G: ['#F2C230', 'Gelber Sack', '◆'] };
      var plan = { 5: ['R'], 7: ['B', 'P'], 11: ['G'], 14: ['B'], 19: ['R'], 21: ['B'], 25: ['G'], 28: ['B'] };
      var s = SVG_OPEN(600, 840, 'Abfuhrkalender Januar 2027 mit farbigen Markierungen für Restmüll, Biomüll, Papier und Gelben Sack');
      s += '<rect width="600" height="840" fill="#fff"/>';
      s += '<rect width="600" height="168" fill="' + navy + '"/>';
      s += '<text x="40" y="56" font-family="' + F.mono + '" font-size="11" letter-spacing="1.5" fill="#FFC83D">IHRE STADTVERWALTUNG · BEZIRK SÜD</text>';
      s += '<text x="38" y="110" font-family="' + F.display + '" font-weight="800" font-size="46" letter-spacing="-1" fill="#fff" style="font-stretch:80%">Abfuhrkalender</text>';
      s += '<text x="40" y="146" font-family="' + F.display + '" font-weight="300" font-size="30" fill="#C9D6E6" style="font-stretch:80%">2027</text>';
      var bin = function (x, c) { return '<g transform="translate(' + x + ' 64)"><rect x="0" y="12" width="34" height="58" rx="4" fill="' + c + '"/><rect x="-3" y="4" width="40" height="10" rx="3" fill="' + c + '" stroke="' + navy + '" stroke-width="1.5"/><rect x="4" y="22" width="26" height="3" fill="#fff" opacity=".35"/><circle cx="6" cy="72" r="4" fill="#0B1E38"/><circle cx="28" cy="72" r="4" fill="#0B1E38"/></g>'; };
      s += bin(380, '#5B6670') + bin(428, '#8B5A2B') + bin(476, '#2F6DB5') + bin(524, '#F2C230');
      s += '<text x="40" y="214" font-family="' + F.display + '" font-weight="800" font-size="26" fill="' + navy + '">Januar 2027</text>';
      var dows = ['Mo', 'Di', 'Mi', 'Do', 'Fr', 'Sa', 'So'];
      for (var d = 0; d < 7; d++) s += '<text x="' + (40 + d * 74 + 6) + '" y="246" font-family="' + F.mono + '" font-size="11" fill="#5B6B80">' + dows[d] + '</text>';
      var day = 1, start = 4;
      for (var cell = 0; cell < 35; cell++) {
        var col = cell % 7, row = Math.floor(cell / 7), x = 40 + col * 74, y = 256 + row * 66;
        var n = cell - start + 1;
        var we = col >= 5, hol = (n === 1 || n === 6);
        s += '<rect x="' + x + '" y="' + y + '" width="70" height="62" rx="6" fill="' + (n < 1 || n > 31 ? '#fff' : (hol ? '#FDECEC' : (we ? '#F1F3F6' : '#F8FAFC'))) + '"' + (n < 1 || n > 31 ? ' stroke="#EEF1F5"' : '') + '/>';
        if (n >= 1 && n <= 31) {
          s += '<text x="' + (x + 8) + '" y="' + (y + 20) + '" font-family="' + F.display + '" font-weight="700" font-size="15" fill="' + (hol ? '#B3243E' : navy) + '">' + n + '</text>';
          if (hol) s += '<text x="' + (x + 8) + '" y="' + (y + 52) + '" font-family="' + F.mono + '" font-size="9" fill="#B3243E">Feiertag</text>';
          var pl = plan[n] || [];
          for (var k = 0; k < pl.length; k++) {
            var b = bins[pl[k]];
            s += '<rect x="' + (x + 8 + k * 28) + '" y="' + (y + 30) + '" width="24" height="24" rx="5" fill="' + b[0] + '"/><text x="' + (x + 20 + k * 28) + '" y="' + (y + 47) + '" text-anchor="middle" font-size="12" fill="' + (pl[k] === 'G' ? navy : '#fff') + '">' + b[2] + '</text>';
          }
          if (n === 7) s += '<text x="' + (x + 64) + '" y="' + (y + 20) + '" text-anchor="end" font-family="' + F.mono + '" font-size="9" fill="#B3243E">verlegt</text>';
          if (n === 9 || n === 16) s += '<path d="M' + (x + 50) + ',' + (y + 50) + 'l8,-20l8,20z" fill="#2E8B57"/><rect x="' + (x + 56) + '" y="' + (y + 50) + '" width="4" height="5" fill="#8B5A2B"/>';
        }
      }
      var ly = 600;
      var keys = ['R', 'B', 'P', 'G'];
      for (var j = 0; j < 4; j++) {
        var bb = bins[keys[j]], lx = 40 + j * 132;
        s += '<rect x="' + lx + '" y="' + ly + '" width="24" height="24" rx="5" fill="' + bb[0] + '"/><text x="' + (lx + 12) + '" y="' + (ly + 17) + '" text-anchor="middle" font-size="12" fill="' + (keys[j] === 'G' ? navy : '#fff') + '">' + bb[2] + '</text>';
        s += '<text x="' + (lx + 32) + '" y="' + (ly + 17) + '" font-family="' + F.display + '" font-weight="600" font-size="14" fill="' + navy + '">' + bb[1] + '</text>';
      }
      s += '<line x1="40" y1="648" x2="560" y2="648" stroke="#DDE3EA"/>';
      s += lines(40, 678, 21, ['<tspan font-weight="700">Feiertag:</tspan> Die Abfuhr vom 6. Januar wird am 7. Januar nachgeholt.', '<tspan font-weight="700">Christbäume:</tspan> Abholung am 9. und 16. Januar (Baum-Symbol).', '<tspan font-weight="700">Bitte beachten:</tspan> Tonnen bis 6 Uhr am Straßenrand bereitstellen.'], 'font-family="' + F.display + '" font-size="14" fill="#22324A"');
      s += '<rect x="40" y="756" width="520" height="54" rx="10" fill="#EEF4FB"/>';
      s += '<g transform="translate(56 766)"><rect width="20" height="34" rx="4" fill="none" stroke="' + navy + '" stroke-width="2"/><circle cx="10" cy="29" r="1.6" fill="' + navy + '"/></g>';
      s += '<text x="90" y="780" font-family="' + F.display + '" font-weight="700" font-size="14" fill="' + navy + '">Nie wieder vergessen: Erinnerung per Abfall-App</text>';
      s += '<text x="90" y="799" font-family="' + F.display + '" font-size="12.5" fill="#22324A">P. S.: Die Kehrwoche erledigt sich leider nicht von selbst.</text>';
      return s + '</svg>';
    }
  });

  /* ======================================================================
     11 · Großfläche Spätzle (Schwäbisch)
     ====================================================================== */
  WORKS.push({
    id: 'bb-spaetzle', size: 'wide',
    title: 'Net gschimpft isch gnug globt.',
    cat: 'Billboard · 18/1 Großfläche',
    tags: ['billboard', 'anzeige', 'illustration', 'modern'],
    lang: 'DE',
    client: 'Bruddler Spätzle-Manufaktur, Stuttgart-Ost (fiktiv)',
    format: '18/1 Großfläche · 356 × 252 cm',
    services: 'Kampagnenidee, Text, Illustration, Reinzeichnung',
    fonts: 'Bricolage Grotesque, Fraunces',
    palette: ['#F3C13A', '#1E2B24', '#C2402A', '#23465A', '#FFE9A6'],
    desc: 'Das höchste Lob, das ein Schwabe vergibt, als Headline für handgeschabte Spätzle. Eine Zeile Dialekt, eine dampfende Schüssel, sonst nichts – lesbar in zwei Sekunden aus dem fahrenden Auto. Die kleine Übersetzung holt auch Neigschmeckte ab.',
    svg: function (p) {
      var dark = '#1E2B24', red = '#C2402A';
      var s = SVG_OPEN(712, 504, 'Großflächenplakat mit dem Spruch Net gschimpft isch gnug globt und einer Schüssel Spätzle');
      s += '<defs><clipPath id="' + p + 'pile"><path d="M398,334C406,268 468,232 540,232C612,232 674,268 682,334Z"/></clipPath></defs>';
      s += '<rect width="712" height="504" fill="#F3C13A"/>';
      s += '<circle cx="560" cy="300" r="190" fill="#F6CD58"/>';
      s += '<text x="38" y="118" font-family="' + F.display + '" font-weight="800" font-size="74" letter-spacing="-2" fill="' + dark + '" style="font-stretch:75%">Net gschimpft</text>';
      s += '<text x="38" y="192" font-family="' + F.display + '" font-weight="800" font-size="74" letter-spacing="-2" fill="' + red + '" style="font-stretch:75%">isch gnug globt.</text>';
      s += lines(40, 246, 24, ['Handgschabte Spätzle aus Stuttgart-Ost.', 'Seit Oma.'], 'font-family="' + F.display + '" font-weight="600" font-size="19" fill="' + dark + '"');
      s += '<text x="40" y="312" font-family="' + F.inst + '" font-style="italic" font-size="15" fill="' + dark + '">„Nicht geschimpft ist genug gelobt“ – das höchste Lob im Ländle.</text>';
      // Gabel
      s += '<g transform="rotate(14 600 200)"><rect x="594" y="96" width="12" height="150" rx="6" fill="#8E9A9C"/><path d="M584,238h32v18c0,8 -6,14 -16,14s-16,-6 -16,-14z" fill="#8E9A9C"/><path d="M587,238v-34M596,238v-34M604,238v-34M613,238v-34" stroke="#8E9A9C" stroke-width="5" stroke-linecap="round"/></g>';
      // Schüssel mit Spätzle
      s += '<ellipse cx="540" cy="334" rx="150" ry="30" fill="#16323F"/>';
      s += '<path d="M398,334C406,268 468,232 540,232C612,232 674,268 682,334Z" fill="#F2CE62"/>';
      s += '<g clip-path="url(#' + p + 'pile)">' + spaetzle(rng(5), 400, 230, 280, 110, 70, '#FFE9A6', '#D9A21B') + '</g>';
      var R = rng(9);
      for (var i = 0; i < 16; i++) s += '<ellipse cx="' + r1(430 + R() * 220) + '" cy="' + r1(270 + R() * 56) + '" rx="3.4" ry="2" transform="rotate(' + r1(R() * 180) + ' 0 0)" fill="#3E8C3A" opacity="0"/>';
      for (var j = 0; j < 14; j++) { var px = 432 + R() * 216, py = 262 + R() * 64; s += '<rect x="' + r1(px) + '" y="' + r1(py) + '" width="6" height="3" rx="1.5" fill="#3E7D35" transform="rotate(' + r1(R() * 180) + ' ' + r1(px) + ' ' + r1(py) + ')"/>'; }
      s += '<path d="M390,334C392,424 466,466 540,466C614,466 688,424 690,334Z" fill="#23465A"/>';
      s += '<path d="M390,334C392,350 400,364 412,376C460,392 620,392 668,376C680,364 688,350 690,334" fill="#2C5870"/>';
      s += '<path d="M420,410C470,440 610,440 660,410" fill="none" stroke="#F3C13A" stroke-width="5" stroke-dasharray="2 14" stroke-linecap="round"/>';
      s += '<path d="M500,214c-12,-18 12,-28 0,-46M548,206c-12,-18 12,-28 0,-46M596,214c-12,-18 12,-28 0,-46" fill="none" stroke="#FFF7DE" stroke-width="5" stroke-linecap="round" opacity=".85"/>';
      // Logo
      s += '<rect x="38" y="384" width="236" height="80" rx="40" fill="' + dark + '"/>';
      s += '<text x="70" y="428" font-family="' + F.serif + '" font-style="italic" font-weight="900" font-size="34" fill="#FFE9A6" style="font-variation-settings:\'SOFT\' 100, \'WONK\' 1">Bruddler</text>';
      s += '<text x="72" y="448" font-family="' + F.mono + '" font-size="9.5" letter-spacing="2" fill="#F3C13A">SPÄTZLE-MANUFAKTUR</text>';
      return s + '</svg>';
    }
  });

  /* ======================================================================
     12 · Billboard Fitness (Englisch)
     ====================================================================== */
  WORKS.push({
    id: 'bb-staeffele', size: 'wide',
    title: '400+ staircases. Zero excuses.',
    cat: 'Billboard · English',
    tags: ['billboard', 'anzeige', 'modern', 'english'],
    lang: 'EN',
    client: 'Stäffele Fitness, Stuttgart-Süd (fiktiv)',
    format: '18/1 Großfläche · 356 × 252 cm',
    services: 'Campaign concept, English copy, key visual',
    fonts: 'Big Shoulders Display, Bricolage Grotesque, JetBrains Mono',
    palette: ['#FF5B2E', '#1B1B1B', '#FFF1E0'],
    desc: 'Eine englische Kampagne für ein Fitnessstudio, das seine Kundschaft auf Stuttgarts öffentliche Treppen schickt. Eine Zahl, eine Treppe, ein kleiner Läufer ganz oben – plakativ genug für die Großfläche, international genug für Expats in der Region.',
    svg: function (p) {
      var dark = '#1B1B1B', cream = '#FFF1E0';
      var s = SVG_OPEN(712, 504, 'Englisches Großflächenplakat für ein Fitnessstudio mit einer großen Treppe');
      s += '<rect width="712" height="504" fill="#FF5B2E"/>';
      var st = 'M286,504', x = 286, y = 504;
      for (var k = 0; k < 12; k++) { y -= 30; st += 'V' + y; x += 36; st += 'H' + x; }
      s += '<path d="' + st + 'V504Z" fill="' + cream + '"/>';
      s += '<path d="' + st + '" fill="none" stroke="' + dark + '" stroke-width="2"/>';
      s += '<line x1="300" y1="460" x2="712" y2="116" stroke="' + dark + '" stroke-width="4"/>';
      for (var q = 0; q < 7; q++) { var lx = 330 + q * 60, ly = 460 - (lx - 300) * 0.835; s += '<line x1="' + lx + '" y1="' + r1(ly) + '" x2="' + lx + '" y2="' + r1(ly + 32) + '" stroke="' + dark + '" stroke-width="3"/>'; }
      s += '<g transform="translate(646 172)" stroke="' + dark + '" stroke-width="7" stroke-linecap="round" fill="none"><circle cx="2" cy="-58" r="9" fill="' + dark + '" stroke="none"/><path d="M0,-46L-6,-18"/><path d="M-6,-18L8,-4L4,14M-6,-18L-20,-4L-30,-8"/><path d="M0,-40L14,-28L24,-36M0,-40L-14,-30L-20,-18"/></g>';
      s += '<text x="30" y="214" font-family="' + F.poster + '" font-weight="900" font-size="214" letter-spacing="-4" fill="' + dark + '">400+</text>';
      s += '<text x="36" y="270" font-family="' + F.display + '" font-weight="800" font-size="56" letter-spacing="-1.5" fill="' + dark + '" style="font-stretch:75%">staircases.</text>';
      s += '<text x="36" y="326" font-family="' + F.display + '" font-weight="800" font-size="56" letter-spacing="-1.5" fill="' + cream + '" style="font-stretch:75%">Zero excuses.</text>';
      s += '<text x="676" y="40" text-anchor="end" font-family="' + F.mono + '" font-size="11" fill="' + dark + '">Stuttgart has more than 400 public staircases.</text>';
      s += '<text x="676" y="56" text-anchor="end" font-family="' + F.mono + '" font-size="11" fill="' + dark + '">We train on all of them.</text>';
      s += '<text x="36" y="430" font-family="' + F.poster + '" font-weight="800" font-size="32" letter-spacing="2" fill="' + dark + '">STÄFFELE FITNESS</text>';
      s += '<text x="36" y="456" font-family="' + F.mono + '" font-size="12.5" fill="' + dark + '">Stuttgart-Süd · First week free</text>';
      return s + '</svg>';
    }
  });

  /* ======================================================================
     13 · Retro-Anzeige Kehrwoche
     ====================================================================== */
  WORKS.push({
    id: 'ad-kehrwoche', size: 'tall',
    title: 'Kehrwoch? Mir machet’s!',
    cat: 'Anzeige · Retro',
    tags: ['anzeige', 'retro', 'illustration'],
    lang: 'DE',
    client: 'Blitzblank Kehrwochen-Service, Esslingen (fiktiv)',
    format: 'Zeitschriften-Anzeige · 1/1 Seite',
    services: 'Anzeige, Charakter-Illustration, Text',
    fonts: 'Fraunces (Soft/Wonk), Bricolage Grotesque',
    palette: ['#F6E9CF', '#D7263D', '#7FBFB0', '#E9B23C', '#2B2A33'],
    desc: 'Eine Anzeige im Stil der 1950er-Jahre für einen Reinigungsdienst, der Ihnen die schwäbischste aller Pflichten abnimmt. Mit Rasterpunkten, Strahlenkranz und zwei sehr gut gelaunten Putzutensilien.',
    svg: function (p) {
      var ink = '#2B2A33', cherry = '#D7263D', teal = '#7FBFB0', mus = '#E9B23C', cream = '#F6E9CF';
      var s = SVG_OPEN(600, 800, 'Retro-Anzeige für einen Kehrwochen-Service mit Besen und Kehrschaufel als Figuren');
      s += '<defs><pattern id="' + p + 'ht" width="12" height="12" patternUnits="userSpaceOnUse"><circle cx="6" cy="6" r="2.4" fill="' + teal + '"/></pattern>' + grain(p, 0.08) + '</defs>';
      s += '<rect width="600" height="800" fill="' + cream + '"/>';
      s += '<rect x="28" y="28" width="544" height="500" rx="20" fill="url(#' + p + 'ht)" opacity=".55"/>';
      s += burst(300, 330, 150, 196, 22, mus, 0.07);
      var shadowTxt = 'font-family="' + F.serif + '" font-style="italic" font-weight="900" font-size="94" text-anchor="middle" style="font-variation-settings:\'SOFT\' 100, \'WONK\' 1"';
      s += '<text x="305" y="133" ' + shadowTxt + ' fill="' + ink + '">Kehrwoch?</text><text x="300" y="128" ' + shadowTxt + ' fill="' + cherry + '">Kehrwoch?</text>';
      // Besen
      s += '<g transform="translate(232 342) rotate(-10)">' +
        '<rect x="-9" y="-200" width="18" height="150" rx="9" fill="#9A5B34"/><rect x="-24" y="-58" width="48" height="16" rx="4" fill="' + ink + '"/>' +
        '<path d="M-62,-44H62L82,72H-82Z" fill="#D7B27A"/>';
      for (var b = -70; b <= 70; b += 12) s += '<line x1="' + b * 0.82 + '" y1="-38" x2="' + b + '" y2="70" stroke="#B48A4E" stroke-width="2.5"/>';
      s += '<ellipse cx="-22" cy="-6" rx="11" ry="14" fill="#fff"/><ellipse cx="22" cy="-6" rx="11" ry="14" fill="#fff"/><circle cx="-19" cy="-2" r="6" fill="' + ink + '"/><circle cx="25" cy="-2" r="6" fill="' + ink + '"/>' +
        '<path d="M-18,22Q0,40 18,22" fill="' + cherry + '" stroke="' + ink + '" stroke-width="4" stroke-linejoin="round"/><circle cx="-40" cy="18" r="9" fill="#F08B8B" opacity=".7"/><circle cx="40" cy="18" r="9" fill="#F08B8B" opacity=".7"/>' +
        '<path d="M-64,0C-96,-10 -104,-40 -96,-62" fill="none" stroke="' + ink + '" stroke-width="6" stroke-linecap="round"/><circle cx="-96" cy="-70" r="11" fill="#fff" stroke="' + ink + '" stroke-width="4"/>' +
        '<path d="M64,6C92,10 104,-6 108,-24" fill="none" stroke="' + ink + '" stroke-width="6" stroke-linecap="round"/><path d="M98,-24h18v-14a6,6 0 0 0 -12,0" fill="#fff" stroke="' + ink + '" stroke-width="4" stroke-linejoin="round"/>' +
        '</g>';
      // Kehrschaufel
      s += '<g transform="translate(410 430) rotate(8)">' +
        '<rect x="-8" y="-120" width="16" height="70" rx="8" fill="' + ink + '"/>' +
        '<path d="M-66,-56H66L78,44Q0,62 -78,44Z" fill="' + cherry + '"/><path d="M-66,-56H66" stroke="' + ink + '" stroke-width="6" stroke-linecap="round"/>' +
        '<ellipse cx="-20" cy="-14" rx="10" ry="12" fill="#fff"/><ellipse cx="20" cy="-14" rx="10" ry="12" fill="#fff"/><circle cx="-17" cy="-10" r="5" fill="' + ink + '"/><circle cx="23" cy="-10" r="5" fill="' + ink + '"/>' +
        '<path d="M-14,14Q0,26 14,14" fill="none" stroke="#fff" stroke-width="4" stroke-linecap="round"/>' +
        '<circle cx="-92" cy="40" r="10" fill="#CDBFA3"/><circle cx="-108" cy="30" r="7" fill="#CDBFA3"/><circle cx="-104" cy="48" r="6" fill="#CDBFA3"/>' +
        '</g>';
      s += star4(118, 230, 18, '#fff') + star4(486, 268, 14, '#fff') + star4(150, 470, 12, '#fff') + star4(520, 476, 20, '#fff');
      s += '<g transform="translate(492 200) rotate(12)">' + burst(0, 0, 50, 62, 16, cherry, 0) + lines(0, -10, 15, ['Nachbarschafts-', 'frieden', 'garantiert!'], 'text-anchor="middle" font-family="' + F.display + '" font-weight="800" font-size="13" fill="' + cream + '"') + '</g>';
      s += '<text x="300" y="574" text-anchor="middle" font-family="' + F.serif + '" font-style="italic" font-weight="700" font-size="54" fill="' + ink + '" style="font-variation-settings:\'SOFT\' 100, \'WONK\' 1">Mir machet’s!</text>';
      s += '<g transform="rotate(-1.5 300 650)"><rect x="52" y="596" width="496" height="104" rx="6" fill="#FFF8EA" stroke="' + ink + '" stroke-width="2.5"/>';
      s += lines(76, 630, 23, ['Treppenhaus, Gehweg, Mülltonnen: Wir übernehmen Ihre', 'Kehrwoche – pünktlich, gründlich und so leise, dass', 'die Nachbarin nichts zu bruddeln hat.'], 'font-family="' + F.display + '" font-size="16" fill="' + ink + '"') + '</g>';
      s += '<text x="300" y="746" text-anchor="middle" font-family="' + F.serif + '" font-weight="800" font-size="28" fill="' + cherry + '">Blitzblank Kehrwochen-Service</text>';
      s += '<text x="300" y="772" text-anchor="middle" font-family="' + F.mono + '" font-size="12.5" fill="' + ink + '">Esslingen am Neckar · ab 19 € die Woche</text>';
      s += '<rect width="600" height="800" filter="url(#' + p + 'grain)"/>';
      return s + '</svg>';
    }
  });

  /* ======================================================================
     14 · Englische Anzeige Kochkurs
     ====================================================================== */
  WORKS.push({
    id: 'ad-kochkurs', size: 'tall',
    title: 'Scrape Spätzle like an Oma',
    cat: 'Ad · English',
    tags: ['anzeige', 'english', 'illustration', 'modern'],
    lang: 'EN',
    client: 'Swabian Kitchen School, Ludwigsburg (fiktiv)',
    format: 'Magazine ad · 1/1 page, Social 1080 × 1350 px',
    services: 'Ad design, illustration, English copy',
    fonts: 'Bricolage Grotesque, Instrument Serif',
    palette: ['#10322A', '#F26B4F', '#F6D776', '#FFF6E3', '#D9A05B'],
    desc: 'Eine englische Anzeige für Kochkurse, in denen internationale Fachkräfte lernen, wie man Spätzle vom Brett schabt. Die Illustration zeigt genau diesen Moment: Brett, Schaber, Teig, dampfender Topf.',
    svg: function (p) {
      var g = '#10322A', coral = '#F26B4F', butter = '#F6D776', cream = '#FFF6E3';
      var s = SVG_OPEN(600, 760, 'Englische Anzeige für einen Spätzle-Kochkurs mit Illustration von Spätzlebrett und Topf');
      s += '<rect width="600" height="760" fill="' + g + '"/>';
      s += '<circle cx="300" cy="230" r="190" fill="#164237"/>';
      s += '<path d="M222,160c-16,-20 14,-34 -2,-56M380,150c-16,-20 14,-34 -2,-56" fill="none" stroke="' + cream + '" stroke-width="5" stroke-linecap="round" opacity=".5"/>';
      // Topf
      s += '<path d="M168,300H432V372C432,404 410,420 380,420H220C190,420 168,404 168,372Z" fill="' + coral + '"/>';
      s += '<rect x="168" y="318" width="264" height="14" fill="#D9533A"/>';
      s += '<rect x="140" y="304" width="34" height="14" rx="7" fill="#D9533A"/><rect x="426" y="304" width="34" height="14" rx="7" fill="#D9533A"/>';
      s += '<ellipse cx="300" cy="300" rx="132" ry="22" fill="#E2E8E4"/><ellipse cx="300" cy="303" rx="120" ry="16" fill="#9FC9C0"/>';
      s += '<circle cx="250" cy="302" r="6" fill="#CFE6E0"/><circle cx="340" cy="298" r="8" fill="#CFE6E0"/><circle cx="380" cy="305" r="5" fill="#CFE6E0"/>';
      // Teigstreifen
      s += '<path d="M330,214c-6,22 8,40 -2,82M346,212c6,24 -8,44 4,80M362,210c-6,20 10,36 0,78M314,216c4,20 -6,40 2,72" fill="none" stroke="#F6E7B0" stroke-width="6" stroke-linecap="round"/>';
      // Brett und Schaber
      s += '<g transform="rotate(-14 300 196)"><path d="M120,182H400L420,196L400,210H120Z" fill="#D9A05B"/><rect x="92" y="186" width="34" height="20" rx="6" fill="#B07A3E"/><path d="M150,192H380M160,200H370" stroke="#B07A3E" stroke-width="1.6"/>' +
        '<path d="M240,182C250,160 300,154 330,170C350,178 372,176 388,182Z" fill="#F6E7B0"/>' +
        '<path d="M300,150L340,128L352,150L314,176Z" fill="#C9D3CF"/><rect x="330" y="104" width="12" height="36" rx="6" transform="rotate(30 336 122)" fill="' + butter + '"/></g>';
      s += '<text x="40" y="502" font-family="' + F.display + '" font-weight="800" font-size="64" letter-spacing="-2" fill="' + cream + '" style="font-stretch:75%">Learn to scrape</text>';
      s += '<text x="40" y="564" font-family="' + F.display + '" font-weight="800" font-size="64" letter-spacing="-2" fill="' + cream + '" style="font-stretch:75%">Spätzle</text>';
      s += '<text x="262" y="564" font-family="' + F.inst + '" font-style="italic" font-size="64" fill="' + butter + '">like an Oma.</text>';
      s += lines(40, 608, 22, ['Swabian cooking classes in English. Every Thursday,', '6:30 pm in Ludwigsburg. Aprons, recipes and a Viertele included.'], 'font-family="' + F.display + '" font-size="15" fill="' + cream + '" opacity=".88"');
      s += '<rect x="40" y="672" width="176" height="46" rx="23" fill="' + coral + '"/><text x="128" y="701" text-anchor="middle" font-family="' + F.display + '" font-weight="700" font-size="16" fill="' + g + '">Book a seat →</text>';
      s += '<text x="560" y="692" text-anchor="end" font-family="' + F.display + '" font-weight="700" font-size="16" fill="' + cream + '">Swabian Kitchen School</text>';
      s += '<text x="560" y="714" text-anchor="end" font-family="' + F.inst + '" font-style="italic" font-size="17" fill="' + butter + '">No Oma? We’ll lend you ours.</text>';
      return s + '</svg>';
    }
  });

  /* ======================================================================
     15 · Animierte Web-Banner (Bäckerei)
     ====================================================================== */
  WORKS.push({
    id: 'banner-brezel', size: 'wide',
    title: 'Banner-Set „Brezelbäck“',
    cat: 'Anzeige · Online-Banner',
    tags: ['anzeige', 'modern', 'illustration'],
    lang: 'DE',
    client: 'Bäckerei Brezelbäck, Degerloch (fiktiv)',
    format: '728 × 90, 300 × 250, 160 × 600, 320 × 50, 320 × 100 px',
    services: 'Animierte HTML5-Banner, Illustration, Text',
    fonts: 'Bricolage Grotesque, Fraunces',
    palette: ['#2B1B12', '#B5651D', '#F2C14E', '#FFF1DA'],
    desc: 'Ein Satz animierter Online-Banner in den gängigen Formaten. Die Brezel hüpft, der Dampf steigt, die Botschaft wechselt – alles als leichtgewichtige Vektoranimation, die auf jedem Bildschirm scharf bleibt. Die Animation läuft hier live.',
    svg: function (p) {
      var bg = '#2B1B12', cream = '#FFF1DA', gold = '#F2C14E';
      var s = SVG_OPEN(840, 600, 'Animierte Online-Banner einer Bäckerei in verschiedenen Formaten mit hüpfender Brezel');
      s += '<style>' +
        '.' + p + 'hop{animation:' + p + 'hop 2.6s ease-in-out infinite;transform-box:fill-box;transform-origin:50% 60%}' +
        '@keyframes ' + p + 'hop{0%,100%{transform:translateY(0) rotate(-5deg)}50%{transform:translateY(-5px) rotate(5deg)}}' +
        '.' + p + 'm1{animation:' + p + 'm1 6s infinite}.' + p + 'm2{animation:' + p + 'm2 6s infinite}' +
        '@keyframes ' + p + 'm1{0%,44%{opacity:1}50%,94%{opacity:0}100%{opacity:1}}' +
        '@keyframes ' + p + 'm2{0%,44%{opacity:0}50%,94%{opacity:1}100%{opacity:0}}' +
        '.' + p + 'pulse{animation:' + p + 'pulse 1.8s ease-in-out infinite;transform-box:fill-box;transform-origin:50% 50%}' +
        '@keyframes ' + p + 'pulse{50%{transform:scale(1.07)}}' +
        '.' + p + 'steam{animation:' + p + 'steam 2.4s ease-in-out infinite}' +
        '@keyframes ' + p + 'steam{0%{opacity:0;transform:translateY(6px)}40%{opacity:.85}100%{opacity:0;transform:translateY(-12px)}}' +
        '@media (prefers-reduced-motion: reduce){.' + p + 'hop,.' + p + 'm1,.' + p + 'm2,.' + p + 'pulse,.' + p + 'steam{animation:none}.' + p + 'm2{opacity:0}}' +
        '</style>';
      s += '<rect width="840" height="600" fill="#E9E6DD"/>';
      var label = function (x, y, t) { return '<text x="' + x + '" y="' + y + '" font-family="' + F.mono + '" font-size="11" fill="#5E5A50">' + t + '</text>'; };
      var cta = function (x, y, w, h, t, fs) { return '<g class="' + p + 'pulse"><rect x="' + x + '" y="' + y + '" width="' + w + '" height="' + h + '" rx="' + h / 2 + '" fill="' + gold + '"/><text x="' + (x + w / 2) + '" y="' + (y + h / 2 + fs * 0.36) + '" text-anchor="middle" font-family="' + F.display + '" font-weight="700" font-size="' + fs + '" fill="' + bg + '">' + t + '</text></g>'; };
      var steam = function (x, y, sc) { return '<g transform="translate(' + x + ' ' + y + ') scale(' + sc + ')" fill="none" stroke="' + cream + '" stroke-width="3" stroke-linecap="round"><path class="' + p + 'steam" d="M-14,0c-6,-8 6,-12 0,-22"/><path class="' + p + 'steam" style="animation-delay:.8s" d="M0,-2c-6,-8 6,-12 0,-22"/><path class="' + p + 'steam" style="animation-delay:1.6s" d="M14,0c-6,-8 6,-12 0,-22"/></g>'; };
      // Leaderboard
      s += label(56, 44, '728 × 90 · Leaderboard');
      s += '<g transform="translate(56 54)"><rect width="728" height="90" fill="' + bg + '"/>';
      s += '<g class="' + p + 'hop">' + pretzel(52, 46, 0.42, { seed: 2 }) + '</g>';
      s += '<g class="' + p + 'm1"><text x="104" y="50" font-family="' + F.display + '" font-weight="700" font-size="26" fill="' + cream + '">Frisch aus dem Ofen – ab 6 Uhr</text></g>';
      s += '<g class="' + p + 'm2"><text x="104" y="50" font-family="' + F.display + '" font-weight="700" font-size="26" fill="' + cream + '">Laugenbrezeln, Seelen &amp; Hefezopf</text></g>';
      s += '<text x="105" y="72" font-family="' + F.mono + '" font-size="11" fill="' + gold + '">BREZELBÄCK · DEGERLOCH</text>';
      s += cta(590, 25, 118, 40, 'Vorbestellen', 15) + '</g>';
      // Medium Rectangle
      s += label(56, 190, '300 × 250 · Medium Rectangle');
      s += '<g transform="translate(56 200)"><rect width="300" height="250" fill="' + bg + '"/>';
      s += steam(150, 42, 1.1) + '<g class="' + p + 'hop">' + pretzel(150, 96, 0.82, { seed: 4 }) + '</g>';
      s += '<g class="' + p + 'm1"><text x="150" y="172" text-anchor="middle" font-family="' + F.display + '" font-weight="800" font-size="24" fill="' + cream + '">Frisch aus dem Ofen</text></g>';
      s += '<g class="' + p + 'm2"><text x="150" y="172" text-anchor="middle" font-family="' + F.display + '" font-weight="800" font-size="24" fill="' + cream + '">Die Brezel zum Kaffee</text></g>';
      s += '<text x="150" y="194" text-anchor="middle" font-family="' + F.display + '" font-size="14" fill="' + gold + '">ab 6 Uhr in Degerloch</text>';
      s += cta(85, 208, 130, 30, 'Vorbestellen →', 13) + '</g>';
      // Skyscraper (verkleinert)
      s += label(392, 190, '160 × 600');
      s += '<g transform="translate(392 200) scale(.62)"><rect width="160" height="600" fill="' + bg + '"/>';
      s += '<text x="80" y="58" text-anchor="middle" font-family="' + F.serif + '" font-style="italic" font-weight="800" font-size="25" fill="' + cream + '">Brezelbäck</text>';
      s += steam(80, 118, 1) + '<g class="' + p + 'hop">' + pretzel(80, 168, 0.8, { seed: 6 }) + '</g>';
      s += '<g class="' + p + 'm1">' + lines(80, 300, 40, ['Frisch', 'aus dem', 'Ofen.'], 'text-anchor="middle" font-family="' + F.display + '" font-weight="800" font-size="36" fill="' + cream + '"') + '</g>';
      s += '<g class="' + p + 'm2">' + lines(80, 300, 40, ['Ab', '6 Uhr', 'offen.'], 'text-anchor="middle" font-family="' + F.display + '" font-weight="800" font-size="36" fill="' + gold + '"') + '</g>';
      s += '<text x="80" y="460" text-anchor="middle" font-family="' + F.mono + '" font-size="13" fill="' + gold + '">DEGERLOCH</text>';
      s += cta(15, 510, 130, 44, 'Vorbestellen', 17) + '</g>';
      // Mobile
      s += label(520, 190, '320 × 50 · Mobile');
      s += '<g transform="translate(520 200) scale(.9)"><rect width="320" height="50" fill="' + bg + '"/><g class="' + p + 'hop">' + pretzel(28, 26, 0.24, { seed: 8 }) + '</g>';
      s += '<text x="56" y="31" font-family="' + F.display + '" font-weight="700" font-size="15" fill="' + cream + '">Brezeln ab 6 Uhr – frisch!</text>' + cta(232, 11, 78, 28, 'Bestellen', 12) + '</g>';
      s += label(520, 272, '320 × 100 · Large Mobile');
      s += '<g transform="translate(520 282) scale(.9)"><rect width="320" height="100" fill="' + bg + '"/><g class="' + p + 'hop">' + pretzel(52, 52, 0.46, { seed: 3 }) + '</g>';
      s += '<g class="' + p + 'm1"><text x="104" y="44" font-family="' + F.display + '" font-weight="800" font-size="19" fill="' + cream + '">Frisch aus dem Ofen</text></g><g class="' + p + 'm2"><text x="104" y="44" font-family="' + F.display + '" font-weight="800" font-size="19" fill="' + cream + '">Brezel &amp; Kaffee: 2,90 €</text></g>';
      s += '<text x="104" y="64" font-family="' + F.mono + '" font-size="10" fill="' + gold + '">BREZELBÄCK · DEGERLOCH</text>' + cta(104, 72, 100, 20, 'Vorbestellen', 10.5) + '</g>';
      // Steckbrief
      s += '<rect x="520" y="400" width="288" height="172" rx="10" fill="#fff"/>';
      s += '<text x="540" y="432" font-family="' + F.display + '" font-weight="700" font-size="18" fill="' + bg + '">HTML5-Banner-Set</text>';
      s += lines(540, 460, 19, ['Animation: 6-Sekunden-Loop', 'Dateigröße: unter 150 KB', 'Formate: 5 Größen, 1 System', 'Barrierearm: Bewegung', 'abschaltbar'], 'font-family="' + F.mono + '" font-size="11.5" fill="#4A4036"');
      return s + '</svg>';
    }
  });

  /* ======================================================================
     16 · Markenidentität Café
     ====================================================================== */
  WORKS.push({
    id: 'brand-bohne', size: 'wide',
    title: 'Bohne & Brezel',
    cat: 'Branding · Corporate Design',
    tags: ['branding', 'modern'],
    lang: 'DE',
    client: 'Kaffeebar im Bohnenviertel (fiktiv)',
    format: 'Logo, Farben, Schriften, Geschäftsausstattung',
    services: 'Logo, Corporate Design, Verpackung, Visitenkarten',
    fonts: 'Fraunces, Bricolage Grotesque',
    palette: ['#3E2419', '#A35A2A', '#F3EBDD', '#3F6B4F', '#E3B27A'],
    desc: 'Ein Erscheinungsbild für eine Kaffeebar im Stuttgarter Bohnenviertel – das seinen Namen übrigens nicht vom Kaffee hat, sondern von den Bohnen, die die Bewohner früher in ihren Gärten anbauten. Die Mittellinie der Kaffeebohne schlingt sich zur Brezel. Mit Konstruktion, Farbsystem, Schriften, Becher und Visitenkarte.',
    svg: function (p) {
      var roast = '#3E2419', laugen = '#A35A2A', milk = '#F3EBDD', vine = '#3F6B4F', car = '#E3B27A';
      var mark = function (x, y, sc, bean, line) {
        return '<g transform="translate(' + x + ' ' + y + ') scale(' + sc + ')"><ellipse cx="0" cy="0" rx="50" ry="72" transform="rotate(-28)" fill="' + bean + '"/>' +
          '<path transform="rotate(-28)" d="M0,-62C-26,-30 30,-8 6,12C-14,30 -26,6 -8,0C12,-6 18,38 2,62" fill="none" stroke="' + line + '" stroke-width="7" stroke-linecap="round"/></g>';
      };
      var s = SVG_OPEN(840, 600, 'Corporate-Design-Übersicht für eine Kaffeebar mit Logo, Farben, Schriften, Becher und Visitenkarten');
      s += '<rect width="840" height="600" fill="' + milk + '"/>';
      s += '<rect width="360" height="600" fill="' + roast + '"/>';
      s += '<g fill="none" stroke="' + milk + '" stroke-opacity=".22"><circle cx="180" cy="230" r="112"/><circle cx="180" cy="230" r="76" stroke-dasharray="3 5"/><line x1="40" y1="230" x2="320" y2="230"/><line x1="180" y1="90" x2="180" y2="370"/><line x1="80" y1="130" x2="280" y2="330"/></g>';
      s += '<circle cx="180" cy="230" r="94" fill="none" stroke="' + milk + '" stroke-width="3"/>';
      s += mark(180, 230, 1, laugen, milk);
      s += '<text x="180" y="384" text-anchor="middle" font-family="' + F.serif + '" font-weight="600" font-size="38" fill="' + milk + '" style="font-variation-settings:\'SOFT\' 50">Bohne <tspan font-style="italic" fill="' + car + '">&amp;</tspan> Brezel</text>';
      s += '<text x="180" y="412" text-anchor="middle" font-family="' + F.mono + '" font-size="10.5" letter-spacing="2.5" fill="' + milk + '" opacity=".75">KAFFEEBAR IM BOHNENVIERTEL</text>';
      s += '<text x="32" y="572" font-family="' + F.mono + '" font-size="9.5" fill="' + milk + '" opacity=".5">LOGO-KONSTRUKTION · SCHUTZZONE = 1/2 BOHNENHÖHE</text>';
      var pal = [[roast, 'Röstbraun'], [laugen, 'Laugenbraun'], [milk, 'Milchschaum'], [vine, 'Rebengrün'], [car, 'Karamell']];
      for (var i = 0; i < pal.length; i++) {
        var x = 392 + i * 86;
        s += '<rect x="' + x + '" y="40" width="74" height="74" rx="6" fill="' + pal[i][0] + '" stroke="' + roast + '" stroke-opacity=".15"/>';
        s += '<text x="' + x + '" y="134" font-family="' + F.display + '" font-weight="600" font-size="11.5" fill="' + roast + '">' + pal[i][1] + '</text>';
        s += '<text x="' + x + '" y="149" font-family="' + F.mono + '" font-size="9.5" fill="#7A6A5C">' + pal[i][0] + '</text>';
      }
      s += '<line x1="392" y1="172" x2="808" y2="172" stroke="' + roast + '" stroke-opacity=".15"/>';
      s += '<text x="392" y="246" font-family="' + F.serif + '" font-weight="600" font-size="66" fill="' + roast + '">Aa</text><text x="392" y="270" font-family="' + F.mono + '" font-size="9.5" fill="#7A6A5C">FRAUNCES · ÜBERSCHRIFTEN</text>';
      s += '<text x="600" y="246" font-family="' + F.display + '" font-weight="600" font-size="66" fill="' + roast + '">Aa</text><text x="600" y="270" font-family="' + F.mono + '" font-size="9.5" fill="#7A6A5C">BRICOLAGE · FLIESSTEXT</text>';
      s += '<line x1="392" y1="294" x2="808" y2="294" stroke="' + roast + '" stroke-opacity=".15"/>';
      // Becher
      s += '<ellipse cx="470" cy="572" rx="58" ry="8" fill="' + roast + '" opacity=".12"/>';
      s += '<path d="M418,340H522L510,566H430Z" fill="#fff"/><path d="M424,410H516L512,490H428Z" fill="' + laugen + '"/>';
      s += mark(470, 450, 0.32, roast, milk);
      s += '<rect x="410" y="324" width="120" height="20" rx="6" fill="' + roast + '"/><rect x="424" y="316" width="92" height="12" rx="5" fill="' + roast + '"/>';
      // Visitenkarten
      s += '<g transform="rotate(8 680 430)"><rect x="588" y="374" width="196" height="112" rx="5" fill="' + roast + '"/>' + mark(686, 430, 0.36, laugen, milk) + '</g>';
      s += '<g transform="rotate(-5 640 500)"><rect x="548" y="444" width="196" height="112" rx="5" fill="#fff" stroke="' + roast + '" stroke-opacity=".12"/>';
      s += mark(576, 474, 0.2, laugen, roast);
      s += '<text x="566" y="516" font-family="' + F.serif + '" font-weight="600" font-size="15" fill="' + roast + '">Lena Brenner</text><text x="566" y="532" font-family="' + F.display + '" font-size="10" fill="#7A6A5C">Barista &amp; Inhaberin</text><text x="566" y="546" font-family="' + F.mono + '" font-size="8" fill="#7A6A5C">BOHNENVIERTEL · STUTTGART</text></g>';
      s += '<circle cx="770" cy="338" r="36" fill="' + vine + '"/>' + lines(770, 334, 12, ['FRISCH', 'GERÖSTET'], 'text-anchor="middle" font-family="' + F.mono + '" font-size="9" letter-spacing="1" fill="' + milk + '"');
      return s + '</svg>';
    }
  });

  /* ======================================================================
     17 · Kesselblick bei Nacht (Illustration)
     ====================================================================== */
  WORKS.push({
    id: 'kesselblick', size: 'wide',
    title: 'Kesselblick bei Nacht',
    cat: 'Illustration · Editorial',
    tags: ['illustration', 'abstrakt', 'modern'],
    lang: 'DE',
    client: 'Freie Arbeit · Editorial-Illustration',
    format: 'Querformat 16:10, skalierbar bis Wandgröße',
    services: 'Illustration, Lichtstimmung, Animation',
    fonts: '–',
    palette: ['#0A1230', '#22204A', '#573A62', '#FFD27A', '#FF3B3B'],
    desc: 'Der Blick von der Halbhöhe in den Stuttgarter Kessel: Hunderte Lichter, eine Stadtbahn als Lichtspur, beleuchtete Stäffele und der Fernsehturm mit blinkender Flugwarnleuchte. Jedes Licht ist ein eigener Vektorpunkt. Ideal für Editorial, Wandgestaltung oder als Hintergrund einer Kampagne.',
    svg: function (p) {
      var s = SVG_OPEN(840, 520, 'Nächtliche Illustration des Stuttgarter Kessels mit Stadtlichtern und Fernsehturm');
      s += '<defs><linearGradient id="' + p + 'sky" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#0A1230"/><stop offset=".55" stop-color="#22204A"/><stop offset="1" stop-color="#573A62"/></linearGradient>' +
        '<radialGradient id="' + p + 'glow" cx=".5" cy=".75" r=".5"><stop offset="0" stop-color="#FFB46B" stop-opacity=".55"/><stop offset="1" stop-color="#FFB46B" stop-opacity="0"/></radialGradient>' +
        '<mask id="' + p + 'moon"><rect width="840" height="520" fill="#fff"/><circle cx="184" cy="74" r="26" fill="#000"/></mask></defs>';
      s += '<style>.' + p + 'tw{animation:' + p + 'tw 3s ease-in-out infinite}@keyframes ' + p + 'tw{50%{opacity:.2}}.' + p + 'bl{animation:' + p + 'bl 1.8s steps(1) infinite}@keyframes ' + p + 'bl{50%{opacity:.1}}@media (prefers-reduced-motion: reduce){.' + p + 'tw,.' + p + 'bl{animation:none}}</style>';
      s += '<rect width="840" height="520" fill="url(#' + p + 'sky)"/>';
      var R = rng(711);
      for (var i = 0; i < 110; i++) {
        var sx = R() * 840, sy = R() * 250, sr = 0.4 + R() * 1.2;
        s += '<circle' + (i % 6 === 0 ? ' class="' + p + 'tw" style="animation-delay:' + r1(R() * 3) + 's"' : '') + ' cx="' + r1(sx) + '" cy="' + r1(sy) + '" r="' + r1(sr) + '" fill="#fff" opacity="' + r1(0.35 + R() * 0.65) + '"/>';
      }
      s += '<circle cx="172" cy="82" r="28" fill="#F6EBD0" mask="url(#' + p + 'moon)"/>';
      s += '<rect x="0" y="200" width="840" height="320" fill="url(#' + p + 'glow)"/>';
      s += '<path d="' + hill([[0, 250], [120, 236], [240, 280], [330, 330], [420, 344], [520, 330], [610, 268], [720, 222], [840, 234]], 520) + '" fill="#1A2346"/>';
      var ridge = [[0, 300], [90, 284], [200, 330], [300, 380], [420, 394], [540, 372], [650, 300], [760, 272], [840, 282]];
      var rAt = function (x) { for (var k = 0; k < ridge.length - 1; k++) if (x >= ridge[k][0] && x <= ridge[k + 1][0]) { var t = (x - ridge[k][0]) / (ridge[k + 1][0] - ridge[k][0]); return ridge[k][1] + (ridge[k + 1][1] - ridge[k][1]) * t; } return 300; };
      s += '<path d="' + hill(ridge, 520) + '" fill="#141C3A"/>';
      s += tower(668, 298, 232, '#2C355C', '#FF3B3B', '#3B4673');
      s += '<g fill="#FFD27A">';
      for (var w = 0; w < 4; w++) s += '<rect x="' + (668 - 9 + w * 5) + '' + '" y="' + r1(298 - 232 * 0.715) + '" width="2.4" height="2.4" opacity=".9"/>';
      s += '</g>';
      s += '<circle class="' + p + 'bl" cx="668" cy="' + r1(298 - 232) + '" r="3.2" fill="#FF3B3B"/><circle class="' + p + 'bl" style="animation-delay:.9s" cx="668" cy="' + r1(298 - 232 * 0.76) + '" r="2.6" fill="#FF3B3B"/>';
      var cols = ['#FFD27A', '#FFE3A8', '#FFB46B', '#FFF4D6'];
      s += '<g>';
      for (var j = 0; j < 2600; j++) {
        var x = R() * 840, y = 250 + R() * 270;
        var top = rAt(x) + 8;
        if (y < top) continue;
        var centre = Math.exp(-Math.pow((x - 420) / 190, 2));
        if (R() > 0.3 + centre * 0.7) continue;
        s += '<circle cx="' + r1(x) + '" cy="' + r1(y) + '" r="' + r1(0.5 + R() * 1.3) + '" fill="' + cols[Math.floor(R() * 4)] + '" opacity="' + r1(0.55 + R() * 0.45) + '"/>';
      }
      s += '</g>';
      s += '<path d="M250,520C300,470 360,450 420,452S540,440 600,400" fill="none" stroke="#FFE08A" stroke-width="2" opacity=".7"/>';
      s += '<path d="M180,520C240,480 330,486 400,470S520,470 640,520" fill="none" stroke="#FF9F5A" stroke-width="1.4" opacity=".5"/>';
      var st = [[150, 478], [174, 462], [160, 446], [186, 430], [172, 414], [198, 398], [184, 382], [210, 366]];
      s += '<polyline points="' + st.map(function (q) { return q.join(','); }).join(' ') + '" fill="none" stroke="#FFE3A8" stroke-width="1" opacity=".5"/>';
      for (var m = 0; m < st.length; m++) s += '<circle cx="' + st[m][0] + '" cy="' + st[m][1] + '" r="2.2" fill="#FFE3A8"/>';
      s += '<path d="M0,520V470C60,460 120,468 170,490C190,498 200,510 206,520Z" fill="#070B1A"/>';
      s += '<g fill="#070B1A"><rect x="60" y="452" width="70" height="6" rx="2"/><rect x="66" y="458" width="5" height="18"/><rect x="120" y="458" width="5" height="18"/><circle cx="84" cy="430" r="7"/><path d="M76,440h16l2,14h-20z"/><circle cx="106" cy="432" r="6.5"/><path d="M99,441h15l2,13h-19z"/></g>';
      s += '<text x="812" y="500" text-anchor="end" font-family="' + F.mono + '" font-size="11" fill="#F6EBD0" opacity=".6">Kesselblick · 22:47 Uhr</text>';
      return s + '</svg>';
    }
  });

  /* ======================================================================
     Maskottchen „Herr Maultasch“ – Skizze und Reinzeichnung
     ====================================================================== */
  function mascot(p, mode) {
    var sk = mode === 'sketch';
    var ink = '#3A2A1C';
    function el(tag, attrs, fill, stroke, sw) {
      if (sk) return '<' + tag + ' ' + attrs + ' fill="none" stroke="#3B3B3B" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round"/>';
      return '<' + tag + ' ' + attrs + ' fill="' + (fill || 'none') + '"' + (stroke ? ' stroke="' + stroke + '" stroke-width="' + sw + '" stroke-linecap="round" stroke-linejoin="round"' : '') + '/>';
    }
    var parts = '';
    parts += el('path', 'd="M258,440L248,502M342,440L352,502"', null, ink, 9);
    parts += el('ellipse', 'cx="240" cy="508" rx="24" ry="11"', ink) + el('ellipse', 'cx="362" cy="508" rx="24" ry="11"', ink);
    parts += el('path', 'd="M162,340C124,322 112,284 122,254"', null, ink, 9);
    parts += el('circle', 'cx="122" cy="244" r="14"', '#F1D9A0', ink, 4);
    parts += el('rect', 'x="150" y="232" width="300" height="214" rx="72" transform="rotate(-3 300 340)"', '#F1D9A0', '#B9893F', 5);
    if (!sk) parts += '<rect x="164" y="246" width="272" height="186" rx="60" transform="rotate(-3 300 340)" fill="none" stroke="#D7B068" stroke-width="9" stroke-dasharray="1 14" stroke-linecap="round"/><ellipse cx="226" cy="270" rx="40" ry="13" transform="rotate(-14 226 270)" fill="#fff" opacity=".45"/>';
    parts += el('path', 'd="M440,352C474,354 490,336 496,312"', null, ink, 9);
    parts += el('path', 'd="M482,248L526,248L520,306Q504,314 488,306Z"', '#8E1F3A', '#9FB7C0', 3);
    if (!sk) parts += '<path d="M486,262H522" stroke="#C04A63" stroke-width="3"/><path d="M490,270L494,300" stroke="#fff" stroke-width="3" opacity=".35" stroke-linecap="round"/>';
    parts += el('path', 'd="M524,260C548,260 548,294 520,294"', null, '#9FB7C0', 5);
    parts += el('circle', 'cx="496" cy="306" r="13"', '#F1D9A0', ink, 4);
    parts += el('ellipse', 'cx="258" cy="318" rx="21" ry="25"', '#fff') + el('ellipse', 'cx="342" cy="318" rx="21" ry="25"', '#fff');
    parts += el('circle', 'cx="263" cy="324" r="10"', '#2A1C12') + el('circle', 'cx="347" cy="324" r="10"', '#2A1C12');
    if (!sk) parts += '<circle cx="267" cy="318" r="3.6" fill="#fff"/><circle cx="351" cy="318" r="3.6" fill="#fff"/>';
    parts += el('path', 'd="M236,284Q258,272 280,282M320,282Q342,272 364,284"', null, ink, 6);
    parts += el('path', 'd="M300,352C286,338 262,340 250,356C246,346 236,344 232,352C246,350 262,364 300,362Z"', '#6B4226');
    parts += el('path', 'd="M300,352C314,338 338,340 350,356C354,346 364,344 368,352C354,350 338,364 300,362Z"', '#6B4226');
    parts += el('path', 'd="M284,374Q300,390 316,374"', null, ink, 5);
    if (!sk) parts += '<circle cx="226" cy="358" r="16" fill="#E98B7A" opacity=".45"/><circle cx="374" cy="358" r="16" fill="#E98B7A" opacity=".45"/>';
    parts += el('ellipse', 'cx="314" cy="236" rx="96" ry="15" transform="rotate(-8 314 236)"', '#2F5D46');
    parts += el('path', 'd="M252,240C252,198 270,180 312,176C354,174 370,192 370,226Z"', '#3F7A5B');
    parts += el('path', 'd="M254,226C290,216 334,212 370,214L370,226C332,224 290,228 253,238Z"', '#1F3D2E');
    parts += el('path', 'd="M360,214C372,190 392,174 404,168C398,186 384,204 366,218Z"', '#C9A15A');

    var s = '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 600 600" role="img" aria-label="' + (sk ? 'Bleistiftskizze' : 'Fertige Vektor-Illustration') + ' des Maskottchens Herr Maultasch">';
    if (sk) {
      s += '<defs><filter id="' + p + 'rough" x="-5%" y="-5%" width="110%" height="110%"><feTurbulence type="fractalNoise" baseFrequency=".03" numOctaves="2" seed="4" result="n"/><feDisplacementMap in="SourceGraphic" in2="n" scale="4"/></filter>' +
        '<pattern id="' + p + 'grid" width="24" height="24" patternUnits="userSpaceOnUse"><path d="M24,0H0V24" fill="none" stroke="#9CC3E6" stroke-width=".8" opacity=".55"/></pattern></defs>';
      s += '<rect width="600" height="600" fill="#F7F4EA"/><rect width="600" height="600" fill="url(#' + p + 'grid)"/>';
      s += '<g fill="none" stroke="#7BA7D9" stroke-width="1.4" stroke-dasharray="6 6"><circle cx="300" cy="340" r="176"/><line x1="300" y1="140" x2="300" y2="540"/><line x1="100" y1="320" x2="520" y2="320"/><ellipse cx="258" cy="318" rx="34" ry="38"/><ellipse cx="342" cy="318" rx="34" ry="38"/><path d="M120,520L480,160"/></g>';
      s += '<g filter="url(#' + p + 'rough)">' + parts + '</g>';
      s += '<g filter="url(#' + p + 'rough)" transform="translate(1.6 -1.2)" opacity=".35">' + parts + '</g>';
      s += '<g stroke="#3B3B3B" stroke-width="1" opacity=".55">';
      for (var h = 0; h < 9; h++) s += '<line x1="' + (262 + h * 11) + '" y1="234" x2="' + (276 + h * 11) + '" y2="190"/>';
      s += '</g>';
      var note = function (x, y, t, rot, c) { return '<text x="' + x + '" y="' + y + '" transform="rotate(' + rot + ' ' + x + ' ' + y + ')" font-family="' + F.hand + '" font-size="27" font-weight="600" fill="' + (c || '#2E5B9A') + '">' + t + '</text>'; };
      s += note(40, 116, 'Hut schief = sympathischer', -4);
      s += '<path d="M190,124C230,140 250,160 262,190" fill="none" stroke="#2E5B9A" stroke-width="2"/>';
      s += note(410, 118, 'Henkelglas', 4) + note(418, 146, '= Viertele ✓', 4, '#2E8B57');
      s += '<path d="M470,156C486,180 494,210 500,236" fill="none" stroke="#2E5B9A" stroke-width="2"/>';
      s += note(36, 410, 'Augen größer!', -6, '#C0392B');
      s += '<path d="M150,396C190,380 214,360 232,340" fill="none" stroke="#C0392B" stroke-width="2"/>';
      s += note(330, 562, 'Gabelabdrücke am Rand', -3);
      s += note(36, 576, 'Schnauzer: gezwirbelt!', 2);
    } else {
      s += '<rect width="600" height="600" fill="#F4F1E8"/><circle cx="300" cy="330" r="232" fill="#EAD9B0"/>';
      s += spaetzle(rng(17), 80, 90, 440, 80, 6, '#F6E6B8', '#E3C47E');
      s += '<ellipse cx="300" cy="522" rx="160" ry="16" fill="#3A2A1C" opacity=".12"/>';
      s += parts;
      s += star4(150, 170, 14, '#fff') + star4(470, 420, 11, '#fff');
      s += '<text x="300" y="574" text-anchor="middle" font-family="' + F.serif + '" font-style="italic" font-weight="700" font-size="24" fill="#3A2A1C" style="font-variation-settings:\'SOFT\' 100, \'WONK\' 1">Herr Maultasch</text>';
    }
    return s + '</svg>';
  }

  /* ---------- Punktlinien in Speisekarten an die echte Textbreite anpassen ---------- */
  function fitLeaders(root) {
    var groups = root.querySelectorAll ? root.querySelectorAll('g.lead') : [];
    for (var i = 0; i < groups.length; i++) {
      var g = groups[i], t = g.querySelectorAll('text'), l = g.querySelector('line');
      if (t.length < 2 || !l) continue;
      var x = +g.getAttribute('data-x'), px = +g.getAttribute('data-px');
      try {
        var a = t[0].getComputedTextLength(), b = t[1].getComputedTextLength();
        if (a > 0 && b > 0) { l.setAttribute('x1', r1(x + a + 6)); l.setAttribute('x2', r1(px - b - 6)); }
      } catch (e) { /* Grafik noch nicht im Dokument */ }
    }
  }

  window.GH_WORKS = WORKS;
  window.GH_MASCOT = mascot;
  window.GH_fitLeaders = fitLeaders;
  window.GH_UTIL = { F: F, rng: rng, r1: r1, smooth: smooth, hill: hill, tower: tower, house: house, pretzel: pretzel, spaetzle: spaetzle, star4: star4, burst: burst, lines: lines, vineRows: vineRows };
})();
