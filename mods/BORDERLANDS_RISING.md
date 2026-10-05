# Borderlands Rising – Danzig, Azov United, the Land of Fire and Palanmir

A Hearts of Iron IV mod for game version **1.19.x**. It makes three small states of the 1930s borderlands into
playable countries with full focus trees, and gives a fourth a technocratic satire. It also makes the Kurds
of Turkey and Iraq resist far harder than in the base game.

| Country | Tag | Focuses | In one line |
|---|---|---|---|
| Free City of Danzig | `DNZ` | 150 | Play Berlin against Warsaw, then build a fascist, democratic, non-aligned, monarchist or communist Danzig, and take land from both |
| South Russia → **Azov United** | `CRI` | 78 | Wrangel's Crimea survived 1920. A single fascist path, real White émigré figures, a huge army, and an arsenal where political power buys equipment |
| Azerbaijan → **Odlar Yurdu** | `AZR` | 65 | The Republic of 1918 survived. Its President is Ilham Aliyev, who is a baby. Unite North and South Azerbaijan into the Land of Fire |
| Lithuania → **Lithuanian Technate** | `LIT` | 50 | Teter Phiel installs Palanmir, a machine that collects everything, and runs the country for research and construction speed, not wellbeing |

**No focus takes longer than 42 days** (cost 6); the validator rejects anything over 45. No DLC is required.

## Installation

1. Copy `borderlands_rising/` **and** `borderlands_rising.mod` into your HOI4 mod folder:
   - Windows: `Documents\Paradox Interactive\Hearts of Iron IV\mod\`
   - Linux: `~/.local/share/Paradox Interactive/Hearts of Iron IV/mod/`
   - macOS: `~/Documents/Paradox Interactive/Hearts of Iron IV/mod/`
2. Enable *Borderlands Rising* in the launcher and start a 1936 game. Danzig, South Russia and
   Azerbaijan are on the country selection map.

## The new countries on the map

Three vanilla state files are overridden so that the countries exist from the start. Provinces, manpower,
resources and victory points keep their vanilla values.

| State | Vanilla owner | New owner | Also changed |
|---|---|---|---|
| 85 Danzig | Poland | Danzig | Germany's claim is present from 1936 |
| 137 Crimea | Soviet Union | South Russia | — |
| 229 Baku | Soviet Union | Azerbaijan | one more civilian factory and one military factory |

The base game never starts a country's units inside another independent country, so the mod keeps it
that way:
- Poland's fleet starts in Gdynia instead of Danzig; the Soviet Black Sea Fleet starts in Odessa instead
  of Sevastopol, and its air brigade in Odessa instead of the Crimea (overrides of the base game's naval
  and air orders of battle for 1936 and 1939, changed only in those lines).
- At game start, Polish, German and Soviet divisions standing in the three states are moved to the
  nearest state of their own.

Also at game start (`common/on_actions/BRS_on_actions.txt`), because the base game only sets these up
at game start and never in its 1936 history files:
- South Russia and Azerbaijan sign a non-aggression pact with the Soviet Union (the armistice of 1920
  and the Treaty of Moscow);
- Danzig loses the "international city" modifier that Poland's history file puts on the city (-100%
  recruitable population and local factories, which would cripple a Free City that owns only Danzig);
- Gauleiter Forster's agitation starts pushing the Danzig Question towards Berlin.

## Danzig (150 focuses)

| Branch | Highlights |
|---|---|
| **The Danzig Question** (balance of power) | Berlin pulls one way, Warsaw the other. Leaning on one neighbour makes it easier to take land from the other |
| Foreign policy and claims | Decisions to demand, buy or fight for the border states: Gdynia and the Corridor, Pomerania, East Prussia, Memel. Integrate them with cores |
| Army | The **Oppressed Soldiers**, Landespolizei, the fortresses of the old city, street-fighting and river doctrines |
| Navy and air | Schichau and the Danziger Werft, U-boat pens, the Junkers licence, a coastal air shield |
| Politics | **Fascist** (Greiser and the Danziger Reich), **democratic** (Seán Lester's restoration and the New Hanseatic League), **non-aligned** (Rauschning's Free City Directorate, "the Baltic Switzerland"), **monarchist** (Prince Louis Ferdinand crowned in the Marienkirche, the Kingdom of Prussia), **communist** (Red Danzig, the Baltic Socialist Federation) |
| Economy and research | The free port, the Gulden, the Technische Hochschule, the Holm refinery, amber, the Zoppot casino |
| Society | The Forest Opera of Zoppot and the **Open Air Concert** |

- **The Oppressed Soldiers** (`dzg_oppressed_soldiers`): a line infantry battalion stronger than vanilla
  infantry: 30 strength (vanilla 25), 70 organisation (60), 0.45 morale (0.3), +20% soft attack and
  defence, +10% breakthrough and bonuses in cities, forts and river crossings. In exchange it needs
  1,100 manpower, 100 training days and more supply. Danzig unlocks it with a focus, and has its own
  counter icon.
- **Open Air Concert** (national spirit): **+0.5% stability per week, +20% political power and +20%
  monthly population growth**.
- Leaders for every ideology: Arthur Greiser, Seán Lester, Arthur Brill, Richard Stachnik,
  Anton Plenikowski, Ernst Ziehm, Hermann Rauschning and Louis Ferdinand of Prussia, with advisors
  (Albert Forster, Heinrich Sahm, Carl Jacob Burckhardt) and commanders.
- Germany gets decisions to demand Danzig and the Corridor, so its vanilla path still works now that
  Danzig is no longer Polish.
- Game rule **Danzig AI**: historical (fascist), or force any of the five paths, or random.

## South Russia / Azov United (78 focuses)

In November 1920 the Red Army broke on the Perekop line and the evacuation of the Crimea never happened.
Baron Wrangel still rules a garrison state of veterans.

- **One political branch, fascist**: the Veterans' Union, the Harbin delegation (Konstantin Rodzaevsky),
  the Putnam millions (Anastasy Vonsiatsky), Young Russia (Alexander Kazem-Bek), the White Idea
  (Ivan Ilyin), the Azov Congress, the **March on Simferopol** (Anton Turkul takes power) and
  **Azov United**, which renames the country. Then the Vozhd principle, the Tatar accord
  (Cafer Seydamet), the Cossack hosts and claims along the Sea of Azov, the Don and the Kuban.
- **Real figures**: Wrangel, Turkul, Slashchov, Kutepov, Krasnov, Shkuro, Sultan Klych-Girey,
  Shteifon and Admiral Kedrov as leaders, commanders and advisors; Pyotr Struve and the émigré
  ideologues as advisors.
- **Very militaristic**: 24 army focuses (the Perekop line, the coloured divisions, the Cossack hosts,
  the Wild Division, armour and artillery), navy and air branches, and military spirits throughout.
- **The Arsenal of the White Cause** (decisions): buy equipment for political power: rifles, Skoda
  guns, signals gear; then Fiat lorries and Bofors anti-tank and anti-air guns; then bulk contracts,
  Greek steamers and the arms for a whole Cossack host. Every purchase is multiplied by a delivery
  rate (1.0 at the start, up to 2.0) that three economy focuses raise.
- **The White Crusade**: a faction for the Soviet Union's neighbours, and a decision to strike when
  Moscow is at war, in a civil war or losing.

## Azerbaijan / Odlar Yurdu (65 focuses)

- **The Infant President**: Ilham Aliyev is the President of the Republic, as a baby. A Regency Council
  governs; choose the Musavat, the oil barons or the generals. Focuses let him grow up: his leader
  trait **and portrait** change from baby to toddler to boy wonder, and *The President Takes Charge*
  ends the regency. Events cover his first word, his first steps and his kindergarten cabinet.
- **Oil**: drill new wells, expand the Black City refineries, sell oil concessions (a factory each, at
  the cost of some oil) and trade oil for arms.
- Army (Shikhlinski's artillery, Karabakh mountain brigades, Aslanov's tanks), economy and foreign
  policy (One Nation, Two States with Turkey; the Caucasian House faction).
- **Odlar Yurdu** ("Land of Fire", *Ateş Ülkesi* in Turkish): a formable. Raise support in Tabriz,
  then press Iran with an uprising or a deal, and proclaim Odlar Yurdu once you own Baku (229),
  Tabriz/East Azerbaijan (1000) and West Azerbaijan (419). Cores, a new flag and name, and the
  *Land of Fire* spirit.

## Lithuania / Palanmir (50 focuses)

Teter Phiel is a **fictional, satirical** contrarian financier. Lithuania keeps its vanilla leaders until
he takes over through the focus tree.

- **Palanmir** is a national spirit that collects data every month. At 100, 250, 500 and 1000 data it
  levels up, adding up to **+20% research speed, +25% construction speed, +15% factory efficiency
  growth**, decryption and compliance, at a growing cost in stability.
- **The Phiel Administration** makes Teter Phiel *Chief Executive of the Nation* and the country the
  **Lithuanian Technate**. Its spirits trade stability, war support and population growth for extreme
  research and construction speed, and up to three extra research slots come from the tree.
- **Coring by integration**: once the Integration Protocol is done and Palanmir is at level 2, any state
  Lithuania **controls** can be integrated into Palanmir (decision, 45 days). When it completes,
  Lithuania gets a core on the state, and the state adds to Palanmir's monthly data.
- Sell Palanmir licences abroad (money, data and factories, with a chance of a surveillance scandal);
  reclaim Vilnius with an ultimatum.
- Game rule **Lithuania's focus tree**: the Palanmir Technate (default) or vanilla.

## The Kurds of Turkey and Iraq

At game start the Kurdish states owned by Turkey (Diyarbakır, Hakkâri, Tunceli, Van) and Iraq (Mosul)
get forced resistance, a Kurdistan core and a state modifier: higher resistance target and growth, more
resistance attacks and garrison losses, slower compliance, fewer recruits and less output. Kurdish
states that Turkey or Iraq conquer later join in.

- Every month, Kurdish states above 40% resistance may **rise**: resistance spikes, infrastructure
  is damaged and the owner loses manpower and stability.
- If at least two Kurdish states are in open revolt while the owner is at war with a great power, in
  a civil war or unstable, **Kurdistan is proclaimed**. It is released with Peshmerga brigades, and
  the former owner goes to war to take it back.
- Turkey and Iraq get counter-decisions: mountain sweeps (fast, but remembered), arming loyal tribes,
  and cultural concessions (lasting, at a political price).
- Game rule **Kurdish resistance**: Strong (default), Extreme or Base game.

## Performance

- Every event is `is_triggered_only`; nothing polls. The two recurring systems (Palanmir's data and the
  Kurdish unrest roll) are hidden events that schedule themselves once a month for one country each.
- The only on-action is a one-time `on_startup` effect guarded by a global flag.
- Decisions are gated by `allowed = { original_tag = ... }`, evaluated once at start-up.

## Compatibility notes

- Overridden vanilla files: `history/states/85-Danzig.txt`, `137-Crimea.txt`, `229-baku.txt`;
  `history/countries/DNZ - Danzig.txt`, `CRI - Crimea.txt`, `AZR - Azerbaijan.txt`; and the naval and
  air orders of battle `history/units/POL_1936_naval_*.txt`, `POL_1939_naval_*.txt`,
  `SOV_1936_naval_*.txt`, `SOV_1939_naval_*.txt`, `SOV_1936_air_*.txt`, `SOV_1939_air_*.txt`. The unit
  files are copies of the base game files of version 1.14.1 (the newest copy that was available) with
  only the Danzig and Sevastopol bases changed; if a later game version changed those fleets or air
  wings, the base game's newer version is replaced by this one. Everything else uses the `DZG_`, `AZV_`,
  `ODL_`, `PLM_`, `KRD_` and `BRS_` prefixes.
- Characters are recruited in history files, as HOI4 1.19 expects: the three new countries' history
  files, and `history/general/BRS_lithuania_characters.txt` for the Palanmir characters (Lithuania's own
  history file is not replaced). Advisors and generals stay hidden (`visible`) until the focus that
  introduces them; future leaders get their leader role with `add_country_leader_role`.
- Lithuania's history, leaders and vanilla tree are untouched (the vanilla tree stays available through
  the game rule).
- Mods that also edit these states, or Turkey's and Iraq's Kurdish provinces, may conflict.

## Testing status

Like Anatolian Ascendancy, the mod was **validated statically, not played**: no copy of the game was
available while building it. `tools/validate_mod.py` (profile `borderlands_rising`) checks syntax,
every cross-reference, effect, trigger and modifier name against the game's script documentation,
focus layouts per tree, the 45-day focus limit, sprites, textures, flags and localisation coverage.
It reports **0 errors and 0 warnings**. Balance, AI behaviour and how the art looks in game still need
an in-game test; check `Documents/Paradox Interactive/Hearts of Iron IV/logs/error.log` if something
misbehaves.

**First crash report (October 2026).** The game crashed while loading, before the main menu: the
error log stopped after the events were read, and system.log had none of the "Audio cached" lines a
launch writes once the main menu is up. The log itself did not name the cause, so the mod was changed
to do nothing at that stage that the base game does not do itself: the non-aggression pacts and the
balance-of-power modifier moved from the history files to the game-start effect, the foreign fleets
and air wings were moved out of the new countries, every `recruit_character` moved into history files
(the 24 warnings in that log), and the faction templates got the manifest the game expects. If the
game still crashes, the most useful files are in `Documents/Paradox Interactive/Hearts of Iron IV/crashes/`
(the newest folder: `exception.txt` and `meta.yml`). Starting the game once with the Steam launch option
`-crash_data_log` makes `meta.yml` name the last file the game read (`LastRead: ...`).

**Cause found (second report).** With `-crash_data_log`, `meta.yml` named the crashing script:
`common/national_focus/PLM_lithuania_focus_tree.txt:26: has_game_rule`. The game picks focus trees while
it loads, before game rules exist, and a `has_game_rule` in a tree's `country` block crashes it. The tree
no longer checks the rule there; with the rule's vanilla option, the game-start effect loads Lithuania's
base-game tree (`lithuania_tree` with No Step Back, otherwise `generic_focus`). The validator now
reports this pattern as an error.

## Art

- **Icons**: 343 focus, 88 spirit, 17 decision category and 2 balance-of-power icons, built from
  [game-icons.net](https://game-icons.net) glyphs (CC BY 3.0) in the framed, badge style many popular
  mods use. Each country has its own frame: Danzig gold medallions, Azov heraldic shields, Azerbaijani
  medallions with a fire rim and Palanmir cyan hexagons. Capstone focuses carry a laurel wreath.
  The per-author credits ship in `borderlands_rising/gfx/ICON_CREDITS.txt`.
- **Flags** for all eleven new country names, drawn from simple geometry (the Free City's crowned
  crosses, the Russian tricolour with St Andrew's saltire, the Azerbaijani tricolour with a flame, the
  Lithuanian tricolour with Palanmir's eye).
- **Portraits**: the three ages of the infant President and Teter Phiel are **original stylised
  drawings** produced by the build script. No photographs were used: image searches could not be
  reached from the build environment, and a photograph of a living head of state would bring
  publicity-rights questions that a Creative Commons licence on the photo does not settle. Other new
  characters get the game's generic portraits.
- Event pictures and decision icons are vanilla sprites referenced by name.

## Rebuilding and validating

```sh
pip install pillow cairosvg numpy
git clone --depth 1 https://github.com/game-icons/icons.git game-icons
git clone --depth 1 https://github.com/cwtools/cwtools-hoi4-config.git
python3 tools/build_assets_br.py --icons game-icons --mod borderlands_rising
python3 tools/validate_mod.py --mod borderlands_rising --cwtools cwtools-hoi4-config
```

To change an icon, edit `tools/br_icons.py` (glyph and colour theme per focus, spirit or category) and
rerun the builder.

## Sources

- Vanilla state data for Danzig, the Crimea, Baku and the Iranian Azerbaijani provinces from
  [Hoi4_1944](https://github.com/gastav3/Hoi4_1944); state names and IDs cross-checked against
  [Chaos Redux](https://github.com/klimpaskov/chaos-redux).
- Effect, trigger and modifier names from the [CWTools HOI4 rules](https://github.com/cwtools/cwtools-hoi4-config).
- Historical figures and places from standard histories of the Free City of Danzig, the White movement
  and its emigration, and the Azerbaijan Democratic Republic. Where the mod departs from history
  (a surviving White Crimea, a surviving Republic in Baku), the departure is the scenario.

The scripts and mod content are MIT licensed (see `../LICENSE`), except the game-icons.net glyphs,
which remain CC BY 3.0.
