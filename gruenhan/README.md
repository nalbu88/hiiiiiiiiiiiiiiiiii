# Grünhan – Website

Website für **Grünhan**, ein Studio für Grafikdesign und IT-Lösungen in Stuttgart. Alles auf Deutsch, mit englischen Demo-Arbeiten und einem Schalter für Schwäbisch.

Die Seite ist reines HTML, CSS und JavaScript ohne Build-Schritt und ohne externe Abhängigkeiten. Sie läuft auf jedem Webspace (z. B. GitHub Pages, Netlify, klassisches Hosting).

## Lokal ansehen

```bash
cd gruenhan
python3 -m http.server 8000
# dann http://localhost:8000 öffnen
```

Ein Doppelklick auf `index.html` funktioniert meistens auch. Über einen kleinen Server laden Schriften und Demo-Websites aber zuverlässiger.

## Aufbau

| Datei / Ordner | Inhalt |
| --- | --- |
| `index.html` | Startseite mit allen Bereichen |
| `impressum.html`, `datenschutz.html` | Rechtstexte als **Platzhalter** (rot markierte Stellen ausfüllen) |
| `404.html` | Fehlerseite („Ha noi! Die Seite gibt’s net.“) |
| `demos/weingut.html`, `demos/fildercode.html` | Zwei klickbare Demo-Websites (DE und EN) für die Geräte-Vorschau |
| `assets/css/main.css` | Gestaltung, Farben, Schriften, Layout |
| `assets/js/works.js` | Alle Demo-Arbeiten als Vektorgrafik (SVG, per Code erzeugt) |
| `assets/js/social.js` | Social-Media-Demo: Beiträge, Stories, Redaktionsplan |
| `assets/js/main.js` | Interaktionen (Zeichenstift, Lightbox, Labor, Telefon, Formular …) |
| `assets/fonts/` | Selbst gehostete Schriften (SIL Open Font License, Lizenzen in `licenses/`) |
| `assets/img/` | Favicon und Vorschaubild für soziale Netzwerke |

## Bereiche der Startseite

- **Hero** mit interaktiver Vektor-Zeichenfläche (Ankerpunkte und Griffe lassen sich ziehen)
- **Leistungen** mit Vorschau am Mauszeiger
- **Arbeiten**: 17 Demo-Arbeiten mit Filter, Lightbox, Zoom und Konturansicht – Behörde, Speisekarten, Plakate, Billboards, Anzeigen, Branding, Retro, Modern, Abstrakt, Englisch
- **Werkstatt**: Skizze-zu-Vektor-Vergleich und generative „Kessel-Topografie“ (als SVG exportierbar)
- **Social Media**: funktionierendes Telefon mit zwei Beispiel-Accounts, Formatdemo (4:5, 3:4, 1:1, 9:16, 1,91:1, 16:9), Redaktionsplan und Hinweis zu Foto-Partnern
- **Websites**: echte Demo-Websites in Desktop-, Tablet- und Smartphone-Ansicht
- **Außenwerbung**: Straßenszene mit Großfläche und City-Light-Poster, Tag/Nacht
- **IT-Lösungen**, **Ablauf**, **Studio** (Regionskarte, Schwäbisch-Glossar), **FAQ**, **Kontakt** (Anfrage in drei Schritten)

## Vor dem Livegang ersetzen

1. **Kontaktdaten** in `index.html` (Abschnitt Kontakt und Footer, mit `PLATZHALTER` markiert) und die E-Mail-Adresse in `assets/js/main.js` (`CONFIG.email`).
2. **Impressum** und **Datenschutzerklärung**: alle rot markierten Angaben ausfüllen und rechtlich prüfen lassen. Der Link zur EU-Streitschlichtungsplattform ist seit dem 20. Juli 2025 nicht mehr nötig und deshalb bewusst nicht enthalten.
3. **Social-Media-Links** im Footer (`href="#"`).
4. **Vorschaubild**: In `index.html` bei `og:image` die vollständige Adresse eintragen, z. B. `https://www.ihre-domain.de/assets/img/og-image.png`.
5. **Kontaktformular**: Es sendet aktuell nichts an einen Server, sondern bereitet eine E-Mail vor (datenschutzfreundlich, ohne Backend). Wer einen Formular-Dienst nutzen möchte, muss ihn in der Datenschutzerklärung ergänzen.

## Hinweise

- Alle Demo-Arbeiten sind Konzeptstudien für **fiktive** Auftraggeber. Die Seite sagt das an mehreren Stellen offen.
- Keine Cookies, kein Tracking, keine externen Schriften oder Skripte. Die einzige gespeicherte Einstellung (Schwäbisch an/aus) liegt im Browser der Besucher.
- Barrierefreiheit: Tastaturbedienung, sichtbarer Fokus, Alternativtexte, `prefers-reduced-motion` wird respektiert.
