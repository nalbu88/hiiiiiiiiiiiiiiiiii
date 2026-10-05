# Anatolian Ascendancy – Turkey Expanded

> This folder holds two mods. This page documents **Anatolian Ascendancy**. **Borderlands Rising** (Danzig, Azov United, Odlar Yurdu, Palanmir and the Kurdish resistance) is documented in [BORDERLANDS_RISING.md](BORDERLANDS_RISING.md), and the research behind both is in [MOD_RESEARCH.md](MOD_RESEARCH.md).

A Hearts of Iron IV mod that gives Turkey a new 209-focus national focus tree, an economy branch
modelled on Turkey's real economic ambitions, five linked political paths, a political-power stock
exchange, four new unit types, six formable nations, and new decisions, events, characters and
national spirits. Built for game version **1.19.x**. No DLC is required.

## Installation

1. Copy `anatolian_ascendancy/` **and** `anatolian_ascendancy.mod` into your HOI4
   mod folder:
   - Windows: `Documents\Paradox Interactive\Hearts of Iron IV\mod\`
   - Linux: `~/.local/share/Paradox Interactive/Hearts of Iron IV/mod/`
   - macOS: `~/Documents/Paradox Interactive/Hearts of Iron IV/mod/`
2. Enable *Anatolian Ascendancy – Turkey Expanded* in the launcher's playset and start the game.

## What's in it

### Focus tree (209 focuses)

**No focus takes longer than 35 days**: the longest cost 4.5 (31 days) and most take 18 to 28 days.
The validator rejects any focus above that limit.

| Branch | Focuses | Highlights |
|---|---|---|
| Foreign policy | 25 | Join the Allies or the Axis, or stay out with Active Neutrality (Istanbul, city of spies); found your own bloc (Saadabad Accord or Balkan Pact), grow it into the Ankara Pact and guarantee its members; the Hatay, Mosul, Aegean, Western Thrace, Cyprus and Batum questions |
| Army, air force, navy | 35 | Unit unlocks, reserve officers, gendarmerie, motorisation and an armoured corps, eastern frontier forts, two exclusive doctrines, Hürkuş designs, air defence, destroyers, Aegean and Black Sea bases |
| Politics | 71 | Five linked paths, each with a split, an integration focus and a formable (see below) |
| Economy | 65 | Finance and trade, statism or private enterprise, railways and megaprojects, mines, oil and dams, defence industry, agriculture (see below) |
| Society and the East | 13 | Village Institutes, Diyanet, women's rights, a research slot, and **Concessions to the East** |

**Political paths.** Only one path can be chosen, but they are linked:
*Kadro* leads from Kemalism into socialism, *Liberal Kemalism* into democracy, and the
*Turkish-Islamic Synthesis* is open to both Ottomanists and Turanists. Each path then splits in two.

| Path | Split | Leader | Joins or founds | Integration focus | Formable |
|---|---|---|---|---|---|
| Red Crescent (communist) | **Join the Comintern** or the Turkish Path to Socialism | Şefik Hüsnü | Comintern, or its own Red Crescent International | Brotherhood of Peoples: cores on every owned state | Near Eastern Socialist Federation |
| Kemalist Republic | National Chief, Kadro or Liberal Kemalism | current leader | — | One Citizenship: cores on owned claimed states | Greater Turkey |
| Democratic Opening | Democrat Party or Left of Centre | Celal Bayar | — | Federal Constitution: cores on claimed or 30%-compliant states | Balkan–Anatolian Federation |
| Ottoman Restoration | Constitutional Sultanate or Restored Caliphate | Abdülmecid II | — | Millet System: cores on claimed or 30%-compliant states | Ottoman Empire, then Empire of Rûm |
| Turanism | Atsız takes power or the Marshal's Junta | Nihal Atsız or Fevzi Çakmak | — | A Common Turkic Homeland: cores on Turkic and claimed states | Turan |

Every integration focus also unlocks **Integrate State**, a decision that turns any owned state you
claim, or that is at least 20% compliant, into a core.

**Joining the Comintern.** The focus sends Moscow a request. If the Soviet Union already leads a
faction, Turkey joins it; if not, the Soviet Union founds the Comintern with Turkey as its first member.

### The economy branch

The root focus, the **İzmir Economic Congress**, starts the **Kalkınma Hamlesi** (Development Drive).
This is a single national spirit that grows with almost every economy focus and megaproject:
construction speed, factory output, research speed, consumer goods, resource extraction and
political power. Each focus tooltip shows exactly what it adds.

| Sub-branch | Inspired by | Unlocks |
|---|---|---|
| Finance and trade | Central Bank, İş Bankası, the Ottoman debt, Istanbul Bourse, Milli Piyango, the Middle Corridor, the energy hub, Istanbul Finance Centre | the Bourse, the lottery, chromium diplomacy |
| Industry | Five-year plans, Sümerbank, Etibank, Karabük, Tekel, Koç and Sabancı, the Anatolian Tigers | **Statism vs Private Enterprise**, merging into the Mixed Economy; five-year plan missions |
| Infrastructure | Nationalised railways, *Demir Ağlar*, the Baghdad Railway, Black Sea ports | Bosphorus Bridge and **Kanal İstanbul** megaprojects |
| Energy and resources | MTA, Zonguldak, Divriği, Guleman, Raman oil, TPAO, the Seyhan and Keban dams, GAP | prospecting, wildcat drilling, the Atatürk Dam, a research reactor |
| Defence industry | MKE, the aviation industry, the *Devrim* car, military electronics, rockets | surplus arms sales |
| Agriculture | Tractors, Çukurova cotton, land reform | Breadbasket of the Middle East |

The branch ends in **Among the Great Powers**, which needs both the industry and the finance lines.

### Decisions

- **The Istanbul Bourse**: bet political power. One bet can be open at a time; it pays out when it expires.
  The *Insider Network* focus makes wins 50% more likely and losses 50% less likely, and unlocks All In.

  | Bet | Stake | Pays out after | Outcomes | Expected return |
  |---|---|---|---|---|
  | Small stake | 25 | 14 days | 45%: 60 · 35%: 35 · 20%: 0 | +57% |
  | Bold wager | 75 | 30 days | 40%: 200 · 35%: 100 · 25%: 0 | +53% |
  | All in | 150 | 45 days | 25%: 500 · 30%: 250 · 20%: 120 · 25%: 0 and −5% stability | +49% |
  | Lottery draw (yearly) | 40 | at once | 10%: 400 · 40%: 80 · 50%: 20 | +105% |

- **Kalkınma**: five-year plan missions (targets are relative to your factories when the plan starts)
  and megaprojects that occupy civilian factories while they are built: the Bosphorus Bridge,
  Kanal İstanbul, the Atatürk Dam, the Çekmece research reactor, a synthetic rubber plant, and surplus arms sales.
- **Mineral Research and Exploration**: open bauxite, tungsten, chromite and coal deposits, and
  wildcat drilling in nine south-eastern states, where each well is a gamble: a gusher, a small well or a dry hole.
- **Chromium Diplomacy**: sell chromium to Germany (arms), Britain (money and a factory) or the USSR
  (equipment). Each deal ties up 10% of resource output for 180 days and annoys the other camp.
- **Haymatloz: Exiles in Anatolia**: appears only while **Germany or the Soviet Union is in a civil war**.
  - German exiles: economists Fritz Neumark and Wilhelm Röpke, planner Ernst Reuter and
    mathematician Richard von Mises as advisors; Generals Hammerstein-Equord and von Rabenau.
  - Soviet exiles: Mammad Amin Rasulzade, Ayaz İshaki and Boris Bazhanov as advisors;
    Anton Denikin and Sultan Klych-Girey as commanders.
- **The Straits**, **Arms Procurement**, **Developing the East**, **Destiny of the Nation** (formables) and **Lost Lands** (war goals).

### The Kurdish question

The vanilla pacification decisions are gone: the mod ships an empty `common/decisions/TUR.txt`, which
replaces Turkey's vanilla decision file. Instead, **Concessions to the East** (21 days, available from
the start) gives cores on Diyarbakır, Hakkâri, Tunceli and Van. It also ends their resistance, removes
the vanilla Kurdish unrest modifiers and lifts the *Eastern Question* spirit.

### Leftover vanilla spirits

The vanilla tree that removed some *Battle for the Bosporus* spirits is replaced, so this tree removes them:

| Spirit or modifier | Removed by |
|---|---|
| Debt Council | Settle the Ottoman Debt |
| Disorganised Armed Forces | Reform the Army |
| Sectarian Woes and the religious unrest modifiers | Laicism, the Directorate of Religious Affairs or the Caliphate |
| Kemalist army officers | Any non-Kemalist government |

### Other content

- 58 events: 43 country events and 15 world news events.
- 59 national spirits, plus the Development Drive.
- 34 characters: path leaders, 23 advisors and 7 commanders, with 30 custom traits.
- Vanilla Turkish characters are reused when they exist, so nobody appears twice.
- A game rule, under *AI Behaviour*, that picks which path an AI-controlled Turkey takes.

### New units (unlocked for Turkey only, through focuses)

| Unit | Type | Role |
|---|---|---|
| Janissary Guard | Line infantry | Elite infantry: 75 org, +15% defence, bonuses in cities. Not special forces. |
| Akıncı Cavalry | Cavalry | Fast raiders: +80% speed, +25% breakthrough, strong on plains and in deserts |
| Mountain Commandos | Special forces | Mountaineers with larger mountain and hill bonuses |
| Straits Fortress Artillery | Support company | Faster entrenchment, better defence on rivers and in cities |

## Performance

The mod is written to add no measurable load to the game:

- **No polled events.** Every event is `is_triggered_only`.
- **No per-tick scripts.** No `on_daily`, `on_weekly` or `on_monthly` hooks; the only on-action is a one-time `on_startup` effect.
- **Decisions are Turkey-only.** Every decision has `allowed = { original_tag = TUR }`, evaluated once at start-up.
- **Bounded targets.** State decisions use an explicit target list or `state_target = any_owned_state`.
- **Variables change only on events.** The Development Drive reads variables that change only when a focus or decision completes.
- **Random rolls are one-off.** Bourse and drilling outcomes are rolled once, when the decision expires.
- **Map-wide loops run once.** They appear only in one-time rewards, and use `every_owned_state` where possible.

## Compatibility notes

- The new tree **replaces** Turkey's vanilla focus tree. Turkey's vanilla history, OOB and starting characters are left untouched.
- One vanilla file is overridden on purpose: `common/decisions/TUR.txt` (empty), to remove the
  vanilla Kurdish pacification decisions, which depend on the vanilla tree.
  Everything else uses the `TRX_` prefix.
- Vanilla Turkish decisions and events that depend on vanilla Turkish focuses will simply not appear.
- New characters without a vanilla counterpart have no portraits of their own; the game assigns generic ones.

## Testing status

The mod was **validated statically, not played**: there was no copy of the game available while building it.
`tools/validate_mod.py` parses every file and checks:

- syntax, and every cross-reference: focuses, spirits, dynamic modifiers, events, characters, traits,
  units, missions, sprites, textures, flags and the whitelisted vanilla names;
- that **every focus takes under 35 days**;
- the focus layout: no overlaps, prerequisites above their focus, mutual exclusions on both sides;
- localisation coverage;
- every effect, trigger and modifier name, against the game's own script documentation.

It reports 0 errors and 0 warnings. Only an in-game test can confirm AI behaviour, balance and how the generated
icons look next to vanilla art. If something misbehaves, check `Documents/Paradox Interactive/Hearts of Iron IV/logs/error.log` first.

## Rebuilding and validating

```sh
pip install pillow cairosvg numpy
git clone --depth 1 https://github.com/game-icons/icons.git game-icons
git clone --depth 1 https://github.com/cwtools/cwtools-hoi4-config.git
python3 tools/build_assets.py --icons game-icons --mod anatolian_ascendancy   # icons, flags, gfx files
python3 tools/validate_mod.py --mod anatolian_ascendancy --cwtools cwtools-hoi4-config
```

`build_assets.py` regenerates every texture and the `interface/TRX_*.gfx` sprite files from a glyph table.
To change an icon, edit `FOCUS_ICONS`, `IDEA_ICONS` or `CATEGORY_ICONS` and rerun it.

## Sources and credits

- **Icons**: [game-icons.net](https://game-icons.net) (CC BY 3.0), recoloured and framed by `build_assets.py`.
  The full per-author list ships in `anatolian_ascendancy/gfx/ICON_CREDITS.txt`.
- **Flags and thumbnail**: drawn by `build_assets.py` from simple geometry. No third-party images.
- **Event pictures and decision icons**: existing vanilla sprites, referenced by name. No vanilla art is redistributed.
- **References used to build the mod**:
  - the HOI4 modding wiki (offline snapshot in [Chaos Redux](https://github.com/klimpaskov/chaos-redux)),
    and Chaos Redux's faction-template code;
  - [CWTools HOI4 rules](https://github.com/cwtools/cwtools-hoi4-config), including the game's script documentation;
  - Turkey's vanilla start (characters, spirits, state modifiers) from [Hoi4_1944](https://github.com/gastav3/Hoi4_1944);
  - older vanilla files from a public mirror, for trait and technology names;
  - vanilla state IDs from a state table published with [nafoas/thing](https://github.com/nafoas/thing).

The scripts and mod content in this repository are MIT licensed (see `../LICENSE`), except the
game-icons.net glyphs, which remain CC BY 3.0.
