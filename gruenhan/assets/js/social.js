/* ==========================================================================
   Grünhan – Social-Media-Demo
   Zwei fiktive Accounts (Café Stäffele, DE · Kessel Brew Co., EN), deren
   Beiträge aus einem kleinen Vorlagen-System erzeugt werden – genau so,
   wie wir es für Kundinnen und Kunden aufbauen.
   ========================================================================== */
(function () {
  'use strict';
  var U = window.GH_UTIL, F = U.F, r1 = U.r1;

  /* ---------- Kleine Illustrationen (zentriert auf 0,0) ---------- */
  var ICON = {
    cup: function (c) {
      return '<ellipse cx="0" cy="44" rx="62" ry="12" fill="' + c.dark + '" opacity=".25"/>' +
        '<path d="M-44,-6H44L36,36C34,44 26,48 18,48H-18C-26,48 -34,44 -36,36Z" fill="' + c.fg + '"/>' +
        '<path d="M42,4C66,2 66,30 38,30" fill="none" stroke="' + c.fg + '" stroke-width="9"/>' +
        '<ellipse cx="0" cy="-6" rx="44" ry="9" fill="' + c.dark + '"/><ellipse cx="0" cy="-5" rx="36" ry="6" fill="#8A5A3A"/>' +
        '<path d="M-14,-24c-8,-12 8,-18 0,-32M6,-26c-8,-12 8,-18 0,-32M24,-24c-8,-12 8,-18 0,-32" fill="none" stroke="' + c.fg + '" stroke-width="4.5" stroke-linecap="round" opacity=".8"/>';
    },
    ofen: function (c) {
      return '<ellipse cx="0" cy="40" rx="86" ry="14" fill="' + c.dark + '" opacity=".2"/>' +
        '<path d="M-78,0H78L68,38C66,44 60,46 54,46H-54C-60,46 -66,44 -68,38Z" fill="#E9E1D2"/>' +
        '<rect x="-96" y="-4" width="22" height="10" rx="5" fill="#E9E1D2"/><rect x="74" y="-4" width="22" height="10" rx="5" fill="#E9E1D2"/>' +
        '<ellipse cx="0" cy="0" rx="78" ry="18" fill="#C9852E"/><ellipse cx="0" cy="-2" rx="70" ry="14" fill="#E0A44A"/>' +
        '<path d="M-50,-4q10,-8 20,0M-10,-8q10,-8 20,0M30,-4q10,-8 20,0M-30,6q10,-8 20,0M14,6q10,-8 20,0" fill="none" stroke="#F6E2A6" stroke-width="5" stroke-linecap="round"/>' +
        '<path d="M-40,-2C-20,8 10,-12 40,2C50,6 56,2 60,-2" fill="none" stroke="#FFF6DD" stroke-width="7" stroke-linecap="round" opacity=".9"/>';
    },
    stairs: function (c) {
      var d = 'M-70,60', x = -70, y = 60;
      for (var i = 0; i < 6; i++) { y -= 20; d += 'V' + y; x += 24; d += 'H' + x; }
      return '<path d="' + d + 'V60Z" fill="' + c.fg + '"/><line x1="-70" y1="32" x2="74" y2="-88" stroke="' + c.fg + '" stroke-width="4"/>';
    },
    pretzel: function (c) { return U.pretzel(0, 0, 0.95, { seed: 3 }); },
    glass: function (c) {
      return '<path d="M-34,-56H34L26,58H-26Z" fill="#E8A33D"/><path d="M-34,-56H34L32,-30H-32Z" fill="#F4ECDC"/>' +
        '<circle cx="-18" cy="-60" r="12" fill="#F4ECDC"/><circle cx="0" cy="-64" r="14" fill="#F4ECDC"/><circle cx="18" cy="-60" r="12" fill="#F4ECDC"/>' +
        '<path d="M-18,-16L-14,46" stroke="#FFF" stroke-width="5" opacity=".35" stroke-linecap="round"/><circle cx="8" cy="10" r="2.5" fill="#FFF" opacity=".5"/><circle cx="14" cy="-4" r="2" fill="#FFF" opacity=".5"/>';
    },
    hop: function (c) {
      var s = '<path d="M0,-74c4,-10 14,-14 22,-12" fill="none" stroke="#5E8A3A" stroke-width="4" stroke-linecap="round"/>';
      var rows = [[0, -54, 1], [-14, -34, 2], [-22, -12, 3], [-16, 10, 3], [-10, 32, 2], [0, 52, 1]];
      for (var r = 0; r < rows.length; r++) for (var k = 0; k < rows[r][2]; k++) {
        var x = rows[r][0] + k * 22 - (rows[r][2] - 1) * 0 + (rows[r][2] === 1 ? 0 : 0);
        s += '<ellipse cx="' + (rows[r][2] === 1 ? 0 : x + (rows[r][2] === 3 ? 0 : 4)) + '" cy="' + rows[r][1] + '" rx="16" ry="20" fill="' + (k % 2 ? '#8DB255' : '#A6C86A') + '" stroke="#5E8A3A" stroke-width="2.5"/>';
      }
      return s + '<path d="M18,-66c26,-8 44,6 46,22c-18,4 -38,-4 -46,-22Z" fill="#5E8A3A"/>';
    },
    can: function (c) {
      return '<rect x="-38" y="-70" width="76" height="140" rx="10" fill="' + c.fg + '"/><rect x="-38" y="-70" width="76" height="12" rx="6" fill="#B9B4AA"/><rect x="-38" y="58" width="76" height="12" rx="6" fill="#B9B4AA"/>' +
        '<rect x="-38" y="-30" width="76" height="62" fill="' + c.acc + '"/><text x="0" y="-4" text-anchor="middle" font-family="' + F.poster + '" font-weight="900" font-size="22" fill="' + c.fg + '">HAZY</text><text x="0" y="20" text-anchor="middle" font-family="' + F.poster + '" font-weight="700" font-size="13" fill="' + c.fg + '">HALBHÖHE</text>';
    },
    quiz: function (c) {
      return '<circle cx="0" cy="0" r="62" fill="' + c.acc + '"/><text x="0" y="34" text-anchor="middle" font-family="' + F.poster + '" font-weight="900" font-size="100" fill="' + c.dark + '">?</text>';
    },
    mic: function (c) {
      return '<rect x="-20" y="-64" width="40" height="70" rx="20" fill="' + c.fg + '"/><path d="M-20,-40H20M-20,-26H20" stroke="' + c.dark + '" stroke-width="3" opacity=".4"/>' +
        '<path d="M-36,-14v6a36,36 0 0 0 72,0v-6M0,30V56M-24,58H24" fill="none" stroke="' + c.fg + '" stroke-width="6" stroke-linecap="round"/>';
    },
    stars: function (c) {
      var s = '';
      for (var i = 0; i < 5; i++) {
        var cx = -84 + i * 42, d = '';
        for (var k = 0; k < 10; k++) { var a = -Math.PI / 2 + k * Math.PI / 5, r = k % 2 ? 8 : 18; d += (k ? 'L' : 'M') + r1(cx + Math.cos(a) * r) + ',' + r1(Math.sin(a) * r); }
        s += '<path d="' + d + 'Z" fill="' + c.acc + '"/>';
      }
      return s;
    },
    confetti: function (c) {
      var R = U.rng(21), s = '', cols = [c.acc, c.fg, '#A3241F', '#3F6B4F'];
      for (var i = 0; i < 40; i++) s += '<rect x="' + r1(R() * 220 - 110) + '" y="' + r1(R() * 160 - 80) + '" width="8" height="4" rx="1" transform="rotate(' + r1(R() * 180) + ')" fill="' + cols[i % 4] + '"/>';
      return s;
    },
    schnecke: function (c) {
      return '<circle cx="0" cy="0" r="58" fill="#D9A05B"/><path d="M0,0m-6,0a6,6 0 1 1 12,0a14,14 0 1 1 -28,0a24,24 0 1 1 48,0a34,34 0 1 1 -68,0a44,44 0 1 1 88,0" fill="none" stroke="#8A4E22" stroke-width="5" stroke-linecap="round"/><path d="M-30,-30c10,4 20,-4 30,2M6,30c12,2 20,-6 30,-2" stroke="#FFF6E3" stroke-width="5" stroke-linecap="round" fill="none"/>';
    },
    face: function (c) {
      return '<circle cx="0" cy="-20" r="34" fill="#E9B98C"/><path d="M-34,-26c4,-30 64,-34 68,0c-10,-12 -40,-16 -68,0Z" fill="' + c.dark + '"/><circle cx="-12" cy="-18" r="3.5" fill="' + c.dark + '"/><circle cx="12" cy="-18" r="3.5" fill="' + c.dark + '"/><path d="M-10,-4q10,8 20,0" fill="none" stroke="' + c.dark + '" stroke-width="3" stroke-linecap="round"/><path d="M-20,6q20,22 40,0" fill="#B5622C"/>' +
        '<path d="M-56,74c0,-40 20,-60 56,-60s56,20 56,60Z" fill="' + c.acc + '"/>';
    },
    sun: function (c) {
      var s = '<circle cx="0" cy="0" r="42" fill="' + c.acc + '"/>';
      for (var i = 0; i < 12; i++) { var a = i * Math.PI / 6; s += '<line x1="' + r1(Math.cos(a) * 54) + '" y1="' + r1(Math.sin(a) * 54) + '" x2="' + r1(Math.cos(a) * 70) + '" y2="' + r1(Math.sin(a) * 70) + '" stroke="' + c.acc + '" stroke-width="6" stroke-linecap="round"/>'; }
      return s;
    }
  };

  /* ---------- Vorlagen: Beitrag 3:4 (300 × 400) ---------- */
  function post(p, d, acc) {
    var c = { bg: d.bg, fg: d.fg, dark: acc.dark, acc: d.acc || acc.acc };
    var head = acc.font === 'serif'
      ? 'font-family="' + F.serif + '" font-weight="800" style="font-variation-settings:\'SOFT\' 100, \'WONK\' 1"'
      : 'font-family="' + F.display + '" font-weight="800" style="font-stretch:75%"';
    var s = '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 300 400" role="img" aria-label="' + d.alt + '">';
    s += '<rect width="300" height="400" fill="' + d.bg + '"/>';
    if (d.layout === 'quote') {
      s += '<text x="26" y="64" font-family="' + F.serif + '" font-size="90" fill="' + c.acc + '" opacity=".9">„</text>';
      s += U.lines(26, 160, d.size * 1.02, d.h, head + ' font-size="' + d.size + '" fill="' + d.fg + '"');
      if (d.icon) s += '<g transform="translate(150 316) scale(.6)">' + ICON[d.icon](c) + '</g>';
    } else {
      s += '<g transform="translate(150 ' + (d.iy || 150) + ') scale(' + (d.is || 1) + ')">' + ICON[d.icon](c) + '</g>';
      s += U.lines(24, d.ty || 300, d.size * 1.02, d.h, head + ' font-size="' + d.size + '" fill="' + d.fg + '"');
    }
    if (d.kicker) s += '<text x="24" y="34" font-family="' + F.mono + '" font-size="10" letter-spacing="1" fill="' + d.fg + '" opacity=".75">' + d.kicker + '</text>';
    if (d.sub) s += '<text x="24" y="378" font-family="' + F.display + '" font-weight="600" font-size="12" fill="' + d.fg + '" opacity=".85">' + d.sub + '</text>';
    s += '<text x="276" y="378" text-anchor="end" font-family="' + F.mono + '" font-size="9" fill="' + d.fg + '" opacity=".6">' + acc.handle + '</text>';
    return s + '</svg>';
  }
  // Folgefolien eines Karussells
  function slideInfo(d, acc, n) {
    var s = '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 300 400" role="img" aria-label="Karussell-Folie ' + n + '">';
    s += '<rect width="300" height="400" fill="' + acc.paper + '"/><rect x="0" y="0" width="300" height="8" fill="' + d.bg + '"/>';
    s += '<text x="24" y="52" font-family="' + F.mono + '" font-size="10" letter-spacing="1" fill="' + acc.dark + '" opacity=".6">' + (n === 2 ? (acc.lang === 'EN' ? 'GOOD TO KNOW' : 'GUT ZU WISSEN') : (acc.lang === 'EN' ? 'SEE YOU SOON' : 'BIS GLEICH')) + '</text>';
    var arr = n === 2 ? d.more : acc.cta;
    s += U.lines(24, 110, 30, arr, 'font-family="' + (acc.font === 'serif' ? F.serif : F.display) + '" font-weight="700" font-size="25" fill="' + acc.dark + '"' + (acc.font === 'serif' ? '' : ' style="font-stretch:85%"'));
    s += '<g transform="translate(232 318) scale(.42)">' + ICON[n === 2 ? d.icon : (acc.lang === 'EN' ? 'glass' : 'cup')]({ bg: d.bg, fg: d.bg === acc.paper ? acc.dark : d.bg, dark: acc.dark, acc: acc.acc }) + '</g>';
    s += '<text x="24" y="378" font-family="' + F.mono + '" font-size="10" fill="' + acc.dark + '" opacity=".6">' + n + ' / 3</text>';
    return s + '</svg>';
  }
  // Story 9:16 (270 × 480)
  function story(d, acc) {
    var s = '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 270 480" preserveAspectRatio="xMidYMid slice" role="img" aria-label="' + d.alt + '">';
    s += '<rect width="270" height="480" fill="' + d.bg + '"/>';
    var c = { bg: d.bg, fg: d.fg, dark: acc.dark, acc: d.acc || acc.acc };
    s += '<g transform="translate(135 170) scale(' + (d.is || 0.9) + ')">' + ICON[d.icon](c) + '</g>';
    s += U.lines(135, 290, 34, d.h, 'text-anchor="middle" font-family="' + (acc.font === 'serif' ? F.serif : F.display) + '" font-weight="800" font-size="30" fill="' + d.fg + '"' + (acc.font === 'serif' ? ' style="font-variation-settings:\'SOFT\' 100"' : ' style="font-stretch:80%"'));
    if (d.poll) {
      s += '<rect x="35" y="360" width="200" height="40" rx="12" fill="#fff" opacity=".95"/><rect x="35" y="360" width="' + (200 * d.poll[2]) + '" height="40" rx="12" fill="' + c.acc + '" opacity=".6"/><text x="50" y="385" font-family="' + F.display + '" font-weight="700" font-size="14" fill="#111">' + d.poll[0] + '</text><text x="222" y="385" text-anchor="end" font-family="' + F.display + '" font-weight="700" font-size="14" fill="#111">' + Math.round(d.poll[2] * 100) + ' %</text>';
      s += '<rect x="35" y="408" width="200" height="40" rx="12" fill="#fff" opacity=".95"/><rect x="35" y="408" width="' + (200 * (1 - d.poll[2])) + '" height="40" rx="12" fill="' + c.acc + '" opacity=".3"/><text x="50" y="433" font-family="' + F.display + '" font-weight="700" font-size="14" fill="#111">' + d.poll[1] + '</text><text x="222" y="433" text-anchor="end" font-family="' + F.display + '" font-weight="700" font-size="14" fill="#111">' + Math.round((1 - d.poll[2]) * 100) + ' %</text>';
    } else if (d.link) {
      s += '<rect x="65" y="384" width="140" height="38" rx="19" fill="#fff"/><text x="135" y="408" text-anchor="middle" font-family="' + F.display + '" font-weight="700" font-size="14" fill="#111">↗ ' + d.link + '</text>';
    }
    return s + '</svg>';
  }
  function avatar(acc) {
    return '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 100 100" aria-hidden="true"><rect width="100" height="100" fill="' + acc.avBg + '"/><text x="50" y="66" text-anchor="middle" font-family="' + (acc.font === 'serif' ? F.serif : F.poster) + '" font-weight="900" font-size="' + (acc.font === 'serif' ? 44 : 46) + '" fill="' + acc.avFg + '"' + (acc.font === 'serif' ? ' style="font-variation-settings:\'SOFT\' 100, \'WONK\' 1"' : '') + '>' + acc.mono + '</text></svg>';
  }

  /* ---------- Accounts ---------- */
  var ACCOUNTS = {
    cafe: {
      handle: '@cafe.staeffele', user: 'cafe.staeffele', name: 'Café Stäffele', lang: 'DE', font: 'serif', mono: 'Cs',
      avBg: '#A3241F', avFg: '#F3E3B5', dark: '#2B1A12', acc: '#F6D776', paper: '#F7EEDB',
      stats: ['48', '2.140', '312'], statLabels: ['Beiträge', 'Follower', 'Gefolgt'],
      bio: 'Kaffee, Kuchen und Frühstück in Stuttgart-West, direkt an der Stäffele. Mo–Sa ab 7 Uhr.',
      tabs: ['Beiträge', 'Reels', 'Markiert'], likes: 'Gefällt {n} Mal', more: 'mehr',
      cta: ['Speichern,', 'teilen und', 'vorbeikommen!', 'Bis gleich im West.'],
      posts: [
        { layout: 'quote', bg: '#A3241F', fg: '#F3E3B5', acc: '#F6D776', h: ['Erst', 'Kaffee.', 'Dann der', 'Rest.'], size: 40, icon: 'cup', alt: 'Zitat-Beitrag: Erst Kaffee, dann der Rest', caption: 'Erst mal ankommen. Der Rest kann warten. ', tags: '#stuttgartwest #kaffeepause #schwäbisch', more: ['Unser Haus-', 'kaffee kommt', 'aus einer', 'Rösterei in', 'Feuerbach.'] },
        { bg: '#F6D776', fg: '#2B1A12', icon: 'ofen', iy: 150, h: ['Ofenschlupfer', 'ist zurück!'], size: 31, ty: 290, kicker: 'NEU IN DER VITRINE', sub: 'Nach Omas Rezept', alt: 'Produkt-Beitrag: Ofenschlupfer ist zurück', caption: 'Nach Omas Rezept, mit Äpfeln aus dem Remstal und warmer Vanillesoße. Nur solange der Vorrat reicht!', tags: '#ofenschlupfer #stuttgartfood #remstal', more: ['Äpfel aus', 'dem Remstal,', 'Vanillesoße', 'hausgemacht.'] },
        { bg: '#3F6B4F', fg: '#F3E3B5', icon: 'cup', iy: 150, h: ['6 Uhr.', 'Die erste Tasse', 'gehört uns.'], size: 28, ty: 280, kicker: 'HINTER DEN KULISSEN', alt: 'Hinter-den-Kulissen-Beitrag: die erste Tasse um 6 Uhr', caption: 'Bevor ihr kommt, probieren wir. Jeden Morgen. Versprochen.', tags: '#behindthescenes #barista #stuttgart', more: ['Jeden Morgen', 'stellen wir', 'die Mühle', 'neu ein.'] },
        { bg: '#2B1A12', fg: '#F3E3B5', acc: '#F6D776', icon: 'stairs', iy: 150, h: ['Stäffele-', 'Frühstück'], size: 36, ty: 290, kicker: 'SAMSTAG · 9 UHR', sub: 'Treffpunkt: Café', alt: 'Event-Beitrag: Stäffele-Frühstück am Samstag', caption: 'Erst 200 Stufen, dann Hefezopf. Wir laufen gemeinsam die Stäffele hoch und frühstücken danach. Anmeldung in der Story!', tags: '#stäffele #stuttgart #frühstück', more: ['Rund 3 km,', 'gut 200 Stufen,', 'danach', 'Hefezopf.'] },
        { layout: 'quote', bg: '#F7EEDB', fg: '#2B1A12', acc: '#A3241F', h: ['Muggeseggele', '(n.): winzig.', 'Kleiner geht’s', 'net.'], size: 26, icon: null, alt: 'Info-Beitrag: Schwäbisch für Anfänger, Muggeseggele', caption: 'Schwäbisch für Anfänger, Folge 7. Ihr wollt mehr? Schreibt uns eure Lieblingswörter.', tags: '#schwäbisch #dialekt #stuttgart', more: ['Benutzung:', '„Rück a', 'Muggeseggele', 'nach links.“'] },
        { bg: '#F2A7B4', fg: '#2B1A12', icon: 'pretzel', iy: 150, is: 1.2, h: ['Brezel', '+ Kaffee', '= 3,90 €'], size: 32, ty: 272, kicker: 'FRÜHSTÜCKS-DEAL', alt: 'Angebots-Beitrag: Brezel und Kaffee für 3,90 Euro', caption: 'Der Klassiker für unterwegs. Mo–Fr bis 10 Uhr.', tags: '#brezel #frühstück #stuttgartwest', more: ['Montag bis', 'Freitag,', '7 bis 10 Uhr.'] },
        { bg: '#F6D776', fg: '#2B1A12', icon: 'confetti', iy: 140, h: ['Danke, West!', '1 Jahr', 'Café Stäffele'], size: 30, ty: 260, kicker: 'JUBILÄUM', alt: 'Community-Beitrag: ein Jahr Café Stäffele', caption: 'Ein Jahr, unzählige Tassen und die besten Gäste der Stadt. Am Samstag gibt’s Kuchen aufs Haus.', tags: '#jubiläum #danke #stuttgartwest', more: ['Samstag:', 'Kuchen', 'aufs Haus.'] },
        { layout: 'quote', bg: '#3F6B4F', fg: '#F3E3B5', acc: '#F6D776', h: ['Danke für', 'über 200', 'Bewertungen!'], size: 29, icon: 'stars', alt: 'Beitrag: Danke für eure Bewertungen', caption: 'Und ihr habt sogar gelobt. Danke für über 200 Bewertungen!', tags: '#danke #bewertungen #stuttgart', more: ['Über 200', 'Bewertungen.', 'Wir sind', 'gerührt.'] },
        { bg: '#F7EEDB', fg: '#2B1A12', acc: '#A3241F', icon: 'schnecke', iy: 150, h: ['Zimtschnecken-', 'Woche'], size: 32, ty: 290, kicker: '16.–21. NOVEMBER', alt: 'Produkt-Beitrag: Zimtschnecken-Woche', caption: 'Jeden Tag frisch, jeden Tag anders: Klassisch, mit Apfel oder mit Walnuss.', tags: '#zimtschnecke #herbst #café', more: ['Klassisch,', 'mit Apfel', 'oder mit', 'Walnuss.'] }
      ],
      stories: [
        { bg: '#F6D776', fg: '#2B1A12', icon: 'sun', h: ['Guten Morgen,', 'West!'], alt: 'Story: Guten Morgen', label: 'Heute' },
        { bg: '#A3241F', fg: '#F3E3B5', icon: 'pretzel', is: 1.1, h: ['Brezel oder', 'Croissant?'], poll: ['Brezel', 'Croissant', 0.78], alt: 'Story-Umfrage: Brezel oder Croissant', label: 'Umfrage' },
        { bg: '#3F6B4F', fg: '#F3E3B5', icon: 'ofen', h: ['Heute in', 'der Vitrine'], link: 'Zur Karte', alt: 'Story: Heute in der Vitrine', label: 'Karte' }
      ]
    },
    brew: {
      handle: '@kesselbrew', user: 'kesselbrew', name: 'Kessel Brew Co.', lang: 'EN', font: 'display', mono: 'KB',
      avBg: '#14110F', avFg: '#E8A33D', dark: '#14110F', acc: '#E8A33D', paper: '#F4ECDC',
      stats: ['61', '3,870', '204'], statLabels: ['posts', 'followers', 'following'],
      bio: 'Craft beer brewed in the Kessel. Taproom in Stuttgart-Ost. English & Swabian spoken.',
      tabs: ['Posts', 'Reels', 'Tagged'], likes: '{n} likes', more: 'more',
      cta: ['Save this,', 'tag a friend', 'and come by', 'for a pint.'],
      posts: [
        { bg: '#14110F', fg: '#F4ECDC', acc: '#E8A33D', icon: 'glass', iy: 150, h: ['NEW ON TAP:', 'Stäffele', 'Pale Ale'], size: 32, ty: 272, kicker: 'TAPROOM · STUTTGART-OST', alt: 'Post: new Stäffele Pale Ale on tap', caption: 'Light, citrusy and easy on the legs. Perfect after climbing the Stäffele.', tags: '#craftbeer #stuttgart #paleale', more: ['5.2 % ABV.', 'Citrus, pine,', 'a hint of', 'Halbhöhe.'] },
        { bg: '#E8A33D', fg: '#14110F', acc: '#F4ECDC', icon: 'quiz', iy: 150, h: ['Pub Quiz', 'Tuesday, 7 pm'], size: 34, ty: 290, kicker: 'IN ENGLISH', alt: 'Post: pub quiz on Tuesday in English', caption: 'Teams of up to six. Questions in English, one Swabian bonus round. Winners drink free.', tags: '#pubquiz #expatsinstuttgart', more: ['Teams of', 'up to six.', 'One Swabian', 'bonus round.'] },
        { layout: 'quote', bg: '#F4ECDC', fg: '#14110F', acc: '#D6452B', h: ['Swabian 101:', '„Prost!“', '= Cheers.'], size: 34, icon: 'glass', alt: 'Post: Swabian 101, Prost means cheers', caption: 'Lesson one. Eye contact is mandatory. Lesson two next week.', tags: '#learngerman #swabian #prost', more: ['Lesson two:', '„No a Bier,', 'bitte.“', '= One more.'] },
        { bg: '#2C3A22', fg: '#F4ECDC', icon: 'hop', iy: 145, h: ['Brewed in', 'the Kessel.'], size: 36, ty: 290, kicker: 'OUR STORY', alt: 'Post: brewed in the Kessel', caption: 'Small batches, local malt, and hops from just down the road.', tags: '#hops #brewery #stuttgart', more: ['Malt from', 'the Alb,', 'hops from', 'Tettnang.'] },
        { bg: '#D6452B', fg: '#F4ECDC', acc: '#14110F', icon: 'mic', iy: 140, h: ['Live Friday:', 'Neckar Funk', 'Collective'], size: 29, ty: 272, kicker: 'MUSIC · FREE ENTRY', alt: 'Post: live music on Friday', caption: 'Funk, soul and a horn section that shakes the tanks. Doors at 8.', tags: '#livemusic #stuttgart #funk', more: ['Doors at 8.', 'Music at 9.', 'Free entry.'] },
        { bg: '#F4ECDC', fg: '#14110F', icon: 'pretzel', iy: 150, is: 1.15, h: ['Pretzel', '+ Pint', '= €7.50'], size: 34, ty: 272, kicker: 'HAPPY HOUR 5–7', alt: 'Post: pretzel and pint deal', caption: 'The most Swabian combo there is. Every weekday, 5 to 7 pm.', tags: '#happyhour #pretzel #beer', more: ['Weekdays', '5 to 7 pm.', 'Pretzels', 'from Degerloch.'] },
        { bg: '#8DB255', fg: '#14110F', acc: '#14110F', icon: 'face', iy: 150, h: ['Meet the', 'brewer: Jonas'], size: 31, ty: 290, kicker: 'TEAM', alt: 'Post: meet the brewer, illustrated portrait', caption: 'Born in Bad Cannstatt, trained in Bamberg, back in the Kessel. Ask him about water chemistry. Or don’t.', tags: '#meetthebrewer #team', more: ['Born in', 'Bad Cannstatt.', 'Favourite', 'beer: the next.'] },
        { bg: '#14110F', fg: '#F4ECDC', acc: '#8DB255', icon: 'can', iy: 150, h: ['Hazy', 'Halbhöhe IPA'], size: 34, ty: 290, kicker: 'NOW IN CANS', alt: 'Post: Hazy Halbhöhe IPA now in cans', caption: 'Our hazy IPA, named after the best addresses in town. Now to take home.', tags: '#ipa #craftbeer #cans', more: ['6.4 % ABV.', 'Mango, peach,', 'soft finish.'] },
        { layout: 'quote', bg: '#E8A33D', fg: '#14110F', acc: '#14110F', h: ['We’re', 'hiring!', 'Bar staff', '(m/f/d)'], size: 36, icon: null, alt: 'Post: we are hiring bar staff', caption: 'English required, Swabian a bonus. DM us or drop by the taproom.', tags: '#jobs #stuttgart #hiring', more: ['Part-time or', 'full-time.', 'English', 'required.'] }
      ],
      stories: [
        { bg: '#14110F', fg: '#F4ECDC', acc: '#E8A33D', icon: 'quiz', h: ['Tonight:', 'Pub Quiz'], alt: 'Story: pub quiz tonight', label: 'Tonight' },
        { bg: '#E8A33D', fg: '#14110F', icon: 'glass', h: ['Pale Ale', 'or IPA?'], poll: ['Pale Ale', 'IPA', 0.41], alt: 'Story poll: pale ale or IPA', label: 'Poll' },
        { bg: '#2C3A22', fg: '#F4ECDC', icon: 'hop', is: 0.8, h: ['Brew day', 'in the Kessel'], link: 'Tap list', alt: 'Story: brew day', label: 'Brew day' }
      ]
    }
  };

  /* ---------- Formatdemo: Ofenschlupfer ---------- */
  window.GH_FMT_ART = '<svg xmlns="http://www.w3.org/2000/svg" viewBox="-130 -90 260 170" preserveAspectRatio="xMidYMid meet" aria-hidden="true">' + ICON.ofen({ dark: '#2B1A12' }) +
    '<circle cx="-96" cy="-60" r="10" fill="#A3241F" opacity=".25"/><circle cx="100" cy="-50" r="6" fill="#A3241F" opacity=".3"/></svg>';

  /* ---------- Redaktionsplan November 2026 ---------- */
  var PILLARS = { produkt: ['Produkt', '#9FE6BC'], kulissen: ['Hinter den Kulissen', '#D8C69C'], aktion: ['Aktion', '#F2A7B4'], community: ['Community', '#A9C8F0'] };
  window.GH_PLAN = {
    year: 2026, month: 10, pillars: PILLARS, initial: 9,
    posts: {
      2: ['produkt', 'Neue Herbstkarte', 'Karussell', '07:30', 'Fünf neue Kuchen, zwei neue Kaffees. Wir stellen die Herbstkarte Folie für Folie vor.'],
      4: ['kulissen', 'Zu Besuch in der Rösterei', 'Reel', '18:00', 'Ein Nachmittag bei unserer Partner-Rösterei in Feuerbach. Gedreht von uns, geschnitten in 9:16.'],
      6: ['community', 'Feierabend-Tipp: Stäffele-Runde West', 'Beitrag', '16:00', 'Unsere liebste Treppenrunde im Westen – mit Karte zum Speichern.'],
      9: ['produkt', 'Ofenschlupfer ist zurück!', 'Beitrag + Story', '07:30', 'Die Saison beginnt. Das Motiv läuft in allen Formaten – siehe Reiter „Formate“.'],
      11: ['aktion', 'Martinstag: Hefegans zum Kaffee', 'Story', '08:00', 'Zum 11. November gibt’s die Hefegans aus der Backstube. Nur heute.'],
      13: ['kulissen', '6 Uhr: Die Brezeln kommen', 'Reel', '06:30', '15 Sekunden Ofentür, Laugenduft und Morgengrauen. Mit Ton.'],
      16: ['community', 'Eure Lieblingsecke im Café', 'Karussell', '12:00', 'Wir zeigen die Plätze, die ihr uns geschickt habt – mit eurer Erlaubnis.'],
      18: ['produkt', 'Zimtschnecken-Woche', 'Beitrag', '07:30', 'Klassisch, mit Apfel oder mit Walnuss. Jeden Tag frisch.'],
      20: ['aktion', 'Stäffele-Frühstück am Samstag', 'Story + Beitrag', '17:00', 'Gemeinsam die Treppen hoch, danach Hefezopf. Anmeldung per Story-Umfrage.'],
      23: ['kulissen', 'So entsteht unser Hefezopf', 'Reel', '18:00', 'Flechten im Zeitraffer. Spoiler: Es sind drei Stränge.'],
      25: ['community', 'Schwäbisch für Anfänger: Muggeseggele', 'Karussell', '12:00', 'Folge 8 unserer Dialekt-Reihe. Die meistgespeicherte Serie auf dem Account.'],
      27: ['aktion', 'Brezel-Freitag statt Black Friday', 'Beitrag', '07:00', 'Keine Rabattschlacht. Aber jede zweite Brezel geht aufs Haus.'],
      29: ['produkt', '1. Advent: Springerle & Glühmost', 'Beitrag + Story', '10:00', 'Die Adventszeit startet mit Anis-Springerle und heißem Most aus dem Remstal.'],
      30: ['kulissen', 'Vorschau Adventskalender', 'Reel', '18:00', '24 Türchen, 24 kleine Geschichten aus dem Café. Ab morgen jeden Tag.']
    }
  };

  /* ---------- Telefon-Oberfläche ---------- */
  function Phone(screen) {
    this.screen = screen;
    this.acc = 'cafe';
    this.storyTimer = null;
  }
  Phone.prototype.render = function () {
    var a = ACCOUNTS[this.acc], self = this;
    var html = '<div class="app" lang="' + (a.lang === 'EN' ? 'en' : 'de') + '">' +
      '<div class="app__status"><span>9:41</span><span aria-hidden="true">▂▄▆ ▮</span></div>' +
      '<div class="app__head"><span>' + a.user + '</span><span aria-hidden="true">≡</span></div>' +
      '<div class="app__profile"><div class="app__avatar"><div>' + avatar(a) + '</div></div><div class="app__stats">';
    for (var i = 0; i < 3; i++) html += '<span><b>' + a.stats[i] + '</b>' + a.statLabels[i] + '</span>';
    html += '</div></div><div class="app__bio"><b>' + a.name + '</b>' + a.bio + '</div><div class="app__stories">';
    a.stories.forEach(function (st, k) {
      html += '<button type="button" data-story="' + k + '" aria-label="Story ' + st.label + ' öffnen"><span><span>' + story(st, a) + '</span></span><span>' + st.label + '</span></button>';
    });
    html += '</div><div class="app__tabs"><span class="is-on">' + a.tabs[0] + '</span><span>' + a.tabs[1] + '</span><span>' + a.tabs[2] + '</span></div><div class="app__grid">';
    a.posts.forEach(function (ps, k) {
      html += '<button type="button" data-post="' + k + '" aria-label="Beitrag öffnen: ' + ps.alt + '">' + post('ph' + k, ps, a) + '</button>';
    });
    html += '</div><div class="app__nav" aria-hidden="true"><i></i><i></i><i></i><i></i><i></i></div></div>';
    this.screen.innerHTML = html;
    this.screen.querySelectorAll('[data-story]').forEach(function (b) { b.addEventListener('click', function () { self.openStory(+b.getAttribute('data-story')); }); });
    this.screen.querySelectorAll('[data-post]').forEach(function (b) { b.addEventListener('click', function () { self.openPost(+b.getAttribute('data-post')); }); });
  };
  Phone.prototype.closeOverlay = function () {
    cancelAnimationFrame(this.storyTimer);
    var o = this.screen.querySelector('.story, .post');
    if (o) o.remove();
  };
  Phone.prototype.openStory = function (idx) {
    var a = ACCOUNTS[this.acc], self = this;
    this.closeOverlay();
    var el = document.createElement('div');
    el.className = 'story';
    var bars = a.stories.map(function () { return '<span><i></i></span>'; }).join('');
    el.innerHTML = '<div class="story__media"></div><div class="story__bars">' + bars + '</div><div class="story__head"><span>' + avatar(a) + '</span>' + a.user + '<button class="story__close" type="button" aria-label="Story schließen">×</button></div>' +
      '<button class="story__tap story__tap--prev" type="button" aria-label="Vorherige Story"></button><button class="story__tap story__tap--next" type="button" aria-label="Nächste Story"></button>';
    this.screen.appendChild(el);
    var cur = idx, start = 0, DUR = 4200;
    var reduce = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    function show(i) {
      if (i < 0) i = 0;
      if (i >= a.stories.length) { self.closeOverlay(); return; }
      cur = i; start = performance.now();
      el.querySelector('.story__media').innerHTML = story(a.stories[i], a);
      el.querySelectorAll('.story__bars i').forEach(function (b, k) { b.style.width = k < i ? '100%' : '0%'; });
    }
    function tick(t) {
      var pr = Math.min(1, (t - start) / DUR);
      var bar = el.querySelectorAll('.story__bars i')[cur];
      if (bar) bar.style.width = (reduce ? 100 : pr * 100) + '%';
      if (pr >= 1 && !reduce) show(cur + 1);
      if (el.isConnected) self.storyTimer = requestAnimationFrame(tick);
    }
    el.querySelector('.story__close').addEventListener('click', function () { self.closeOverlay(); });
    el.querySelector('.story__tap--prev').addEventListener('click', function () { show(cur - 1); });
    el.querySelector('.story__tap--next').addEventListener('click', function () { show(cur + 1); });
    show(idx);
    this.storyTimer = requestAnimationFrame(tick);
  };
  Phone.prototype.openPost = function (idx) {
    var a = ACCOUNTS[this.acc], self = this, d = a.posts[idx];
    this.closeOverlay();
    var slides = [post('pv' + idx, d, a), slideInfo(d, a, 2), slideInfo(d, a, 3)];
    var likes = 80 + ((idx * 37) % 160);
    var el = document.createElement('div');
    el.className = 'post';
    el.innerHTML = '<div class="post__head"><button class="back" type="button" aria-label="Zurück zum Profil">‹</button><span class="av">' + avatar(a) + '</span>' + a.user + '</div>' +
      '<div class="post__media" style="aspect-ratio:3/4"><div class="post__slides">' + slides.map(function (s) { return '<div>' + s + '</div>'; }).join('') + '</div>' +
      '<button class="post__arrow post__arrow--prev" type="button" aria-label="Vorherige Folie">‹</button><button class="post__arrow post__arrow--next" type="button" aria-label="Nächste Folie">›</button>' +
      '<svg class="post__heart" viewBox="0 0 24 24" aria-hidden="true"><path fill="currentColor" d="M12 21s-7.5-4.6-9.6-9.2C.9 8.5 3 5 6.4 5c2 0 3.6 1.1 4.4 2.6h.4C12 6.1 13.6 5 15.6 5 19 5 21.1 8.5 19.6 11.8 17.5 16.4 12 21 12 21z"/></svg></div>' +
      '<div class="post__dots"><i class="is-on"></i><i></i><i></i></div>' +
      '<div class="post__actions"><button type="button" class="like" aria-pressed="false" aria-label="Gefällt mir"><svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M12 21s-7.5-4.6-9.6-9.2C.9 8.5 3 5 6.4 5c2 0 3.6 1.1 4.4 2.6h.4C12 6.1 13.6 5 15.6 5 19 5 21.1 8.5 19.6 11.8 17.5 16.4 12 21 12 21z"/></svg></button>' +
      '<button type="button" aria-label="Kommentieren"><svg width="21" height="21" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M21 12a8.5 8.5 0 01-12.6 7.4L3 21l1.6-5A8.5 8.5 0 1121 12z"/></svg></button>' +
      '<button type="button" aria-label="Teilen"><svg width="21" height="21" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M22 3L11 13M22 3l-7 18-4-8-8-4z"/></svg></button></div>' +
      '<div class="post__caption"><b class="likes">' + a.likes.replace('{n}', likes) + '</b><br><b>' + a.user + '</b> ' + d.caption + ' <span class="tags">' + d.tags + '</span></div>';
    this.screen.appendChild(el);
    var cur = 0, track = el.querySelector('.post__slides'), dots = el.querySelectorAll('.post__dots i');
    var likeBtn = el.querySelector('.like'), likesEl = el.querySelector('.likes'), heart = el.querySelector('.post__heart');
    function go(i) {
      cur = Math.max(0, Math.min(2, i));
      track.style.transform = 'translateX(' + (-cur * 100) + '%)';
      dots.forEach(function (dd, k) { dd.classList.toggle('is-on', k === cur); });
    }
    function setLike(on) {
      likeBtn.classList.toggle('is-liked', on);
      likeBtn.setAttribute('aria-pressed', on ? 'true' : 'false');
      likesEl.textContent = a.likes.replace('{n}', likes + (on ? 1 : 0));
    }
    el.querySelector('.back').addEventListener('click', function () { self.closeOverlay(); });
    el.querySelector('.post__arrow--prev').addEventListener('click', function () { go(cur - 1); });
    el.querySelector('.post__arrow--next').addEventListener('click', function () { go(cur + 1); });
    likeBtn.addEventListener('click', function () { setLike(!likeBtn.classList.contains('is-liked')); });
    var media = el.querySelector('.post__media'), sx = null, lastTap = 0;
    media.addEventListener('pointerdown', function (e) { sx = e.clientX; });
    media.addEventListener('pointerup', function (e) {
      if (sx === null) return;
      var dx = e.clientX - sx; sx = null;
      if (Math.abs(dx) > 30) { go(cur + (dx < 0 ? 1 : -1)); return; }
      if (e.target.closest('.post__arrow')) return;
      var now = Date.now();
      if (now - lastTap < 320) {
        setLike(true);
        heart.classList.remove('is-pop'); void heart.getBoundingClientRect(); heart.classList.add('is-pop');
      }
      lastTap = now;
    });
  };
  Phone.prototype.setAccount = function (k) { this.acc = k; this.closeOverlay(); this.render(); };

  window.GH_Phone = Phone;
})();
