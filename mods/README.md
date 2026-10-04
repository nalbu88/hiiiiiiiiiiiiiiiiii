# Anatolian Ascendancy – Turkey Expanded

A Hearts of Iron IV mod that gives Turkey a new 101-focus national focus tree,
four new unit types, six formable nations, new decisions, events, characters
and national spirits. Built for game version **1.19.x**. No DLC is required.

## Installation

1. Copy `anatolian_ascendancy/` **and** `anatolian_ascendancy.mod` into your HOI4
   mod folder:
   - Windows: `Documents\Paradox Interactive\Hearts of Iron IV\mod\`
   - Linux: `~/.local/share/Paradox Interactive/Hearts of Iron IV/mod/`
   - macOS: `~/Documents/Paradox Interactive/Hearts of Iron IV/mod/`
2. Enable *Anatolian Ascendancy – Turkey Expanded* in the launcher's playset and start the game.

## What's in it

### Focus tree (101 focuses)

| Branch | Focuses | Highlights |
|---|---|---|
| Foreign policy | 13 | Montreux Convention, Saadabad Pact, Balkan Entente, your own alliance (Saadabad Accord or Balkan Pact), the Hatay/Mosul/Aegean/Western Thrace/Cyprus/Batum questions, Misak-ı Millî |
| Army | 13 | Unit unlocks, Harbiye Academy, two exclusive doctrines (Defence of Anatolia vs Lightning of the Akıncı), general mobilisation |
| Air force & navy | 12 | Turkish Aeronautical Association, Nuri Demirağ and Kayseri factories, Sabiha Gökçen, Gölcük shipyards, the Yavuz, submarines, Masters of the Straits |
| Politics | 43 | Five exclusive paths, each with its own leader and endgame (see below) |
| Economy | 13 | Five-year plans, Sümerbank, Etibank, Karabük steel, Raman oil, statism vs liberal market, Eastern Railways |
| Society & science | 7 | Village Institutes, Language Revolution, university reform (+1 research slot), Eastern Development Plan |

**Political paths**

| Path | Ideology | Leader | Endgame formable |
|---|---|---|---|
| Kemalist Republic – the Six Arrows | Non-aligned | current leader | Greater Turkey (Misak-ı Millî) |
| Democratic Opening | Democratic | Celal Bayar | Balkan–Anatolian Federation |
| Ottoman Restoration | Non-aligned (monarchy) | Abdülmecid II | Ottoman Empire, then Empire of Rûm (Kayser-i Rûm) |
| Turanism | Fascist | Nihal Atsız | Turan |
| Red Crescent | Communist | Şefik Hüsnü | Near Eastern Socialist Federation |

### New units (unlocked for Turkey only, through focuses)

| Unit | Type | Role |
|---|---|---|
| Janissary Guard | Line infantry | Elite infantry: 75 org, +15% defence, bonuses in cities. Not special forces. |
| Akıncı Cavalry | Cavalry | Fast raiders: +80% speed, +25% breakthrough, strong on plains and in deserts |
| Mountain Commandos | Special forces | Mountaineers with larger mountain and hill bonuses |
| Straits Fortress Artillery | Support company | Faster entrenchment, better defence on rivers and in cities |

Each unlock also creates a ready-made division template. The units reuse vanilla
equipment and models, so no new production lines are needed.

### Decisions

- **The Straits**: transit fees, fortifying the Bosphorus and the Dardanelles, closing the Straits in wartime.
- **The Eastern Question**: Turkey starts with a −5% stability spirit. Settle it by Reconciliation or Pacification
  before the *Dersim Crisis* mission runs out, then develop seven eastern states one by one.
- **Arms Procurement**: buy rifles, artillery, trucks and support equipment from Germany, the USSR, Britain and the USA.
- **Destiny of the Nation**: the six formable nations.
- **Lost Lands**: war-goal decisions for the Ottoman, Turanist and Socialist paths.

### Other content

- 34 events: 22 country events and 12 world news events.
- 38 national spirits.
- 18 characters: 4 path leaders, 11 advisors and 3 generals, with 16 custom traits.
- A game rule, under *AI Behaviour*, that picks which path an AI-controlled Turkey takes.

## Performance

The mod is written to add no measurable load to the game:

- **No polled events.** Every event is `is_triggered_only`, so none of them are checked on a timer.
- **No per-tick scripts.** There are no `on_daily`, `on_weekly` or `on_monthly` hooks; the only on-action
  is a one-time `on_startup` effect.
- **Decisions are Turkey-only.** Every decision has `allowed = { original_tag = TUR }`, which the game evaluates
  once at start-up, so other countries never check them.
- **State-targeted decisions are bounded.** They use an explicit list of seven states instead of scanning the map.
- **Map-wide loops run once.** `every_state` appears only in one-time rewards, never in triggers.
- **Small textures.** 146 uncompressed icons plus 90 tiny flag files, about 5 MB in total.

## Compatibility notes

- The new tree **replaces** Turkey's vanilla focus tree. Turkey's vanilla starting setup (history, OOB, characters,
  starting spirits) is left untouched, so the mod tracks future vanilla updates and DLC changes.
- No vanilla file is overwritten. Everything uses the `TRX_` prefix, so the mod combines well with mods that don't touch Turkey.
- Vanilla Turkish decisions and events that depend on vanilla Turkish focuses will simply not appear.
- The new characters have no portraits of their own; the game assigns generic regional portraits.
- Some historical figures (e.g. Fevzi Çakmak, Nihal Atsız) may also exist as vanilla characters with BftB.
  The mod's versions use their own IDs and only appear when their focus is completed.

## Testing status

The mod was **validated statically, not played**: there was no copy of the game available while building it.
`tools/validate_mod.py` parses every file and checks:

- syntax, and every cross-reference (focuses, spirits, events, characters, traits, units, sprites, textures, flags);
- localisation coverage;
- every effect, trigger and modifier name, against the game's own script documentation.

It reports 0 errors and 0 warnings. A mutation test showed it catches typos in effects, triggers and modifiers,
broken references, missing localisation, missing flags and unbalanced braces.

Things only an in-game test can confirm: AI behaviour, balance, and how the generated icons look next to vanilla art.
If something misbehaves, check `Documents/Paradox Interactive/Hearts of Iron IV/logs/error.log` first.

## Rebuilding and validating

```sh
pip install pillow cairosvg numpy
git clone --depth 1 https://github.com/game-icons/icons.git game-icons
git clone --depth 1 https://github.com/cwtools/cwtools-hoi4-config.git
python3 tools/build_assets.py --icons game-icons --mod anatolian_ascendancy   # icons, flags, gfx files
python3 tools/validate_mod.py --mod anatolian_ascendancy --cwtools cwtools-hoi4-config
```

`build_assets.py` regenerates every texture and the `interface/TRX_*.gfx` sprite files from a glyph table.
To change an icon, edit `FOCUS_ICONS` or `IDEA_ICONS` and rerun it.

## Sources and credits

- **Icons**: [game-icons.net](https://game-icons.net) (CC BY 3.0), recoloured and framed by `build_assets.py`.
  The full per-author list ships in `anatolian_ascendancy/gfx/ICON_CREDITS.txt`.
- **Flags and thumbnail**: drawn by `build_assets.py` from simple geometry (crescents, stars, stripes). No third-party images.
- **Event pictures, decision icons and the formables category picture**: existing vanilla sprites, referenced by name.
  No vanilla art is redistributed.
- **References used to build the mod**:
  - an offline snapshot of the HOI4 modding wiki and other examples in [Chaos Redux](https://github.com/klimpaskov/chaos-redux);
  - [CWTools HOI4 rules](https://github.com/cwtools/cwtools-hoi4-config), including the game's script documentation;
  - vanilla state IDs from vanilla decision files and a state table published with
    [nafoas/thing](https://github.com/nafoas/thing).

The scripts and mod content in this repository are MIT licensed (see `../LICENSE`), except the
game-icons.net glyphs, which remain CC BY 3.0.
