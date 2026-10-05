# How Hearts of Iron IV mods are built, and what makes them enjoyable

Research notes behind the two mods in this folder. Steam Workshop pages could not be opened from the
environment the mods were built in, so the Workshop findings below come from search results,
press round-ups of the most popular mods, community discussions and the HOI4 modding wiki.

## 1. How this repository is built

| Part | What it is |
|---|---|
| `python2/`, `python3/` | Small standalone helpers for tedious modding chores: localisation stubs from focus/event files, GFX entries for focus and idea icons, focus "shine" sprites, a file formatter, a state map generator, an election event generator, a tech-transfer effect generator |
| `mods/anatolian_ascendancy/` | A Turkey overhaul (209 focuses) |
| `mods/borderlands_rising/` | Danzig, South Russia / Azov United, Azerbaijan / Odlar Yurdu, the Palanmir Technate and the Kurdish resistance |
| `mods/tools/validate_mod.py` | A static validator: parses every script file, checks cross-references, focus layout and cost limits, sprites, flags, localisation, and every effect, trigger and modifier name against the game's own script documentation (from the CWTools rules). One profile per mod |
| `mods/tools/build_assets.py`, `build_assets_br.py` | Asset builders: icon frames and glyphs, flags, counters, portraits and thumbnails, written as uncompressed DDS and TGA, plus the matching `interface/*.gfx` files |

The approach is "everything generated or checked by a script": icons are rebuilt from a table, and the
validator must report zero errors before anything is committed, because the game itself was not
available to test with.

## 2. How a HOI4 mod is built

A mod is a folder that mirrors the game's own layout, plus a `.mod` descriptor. Files with the same path
as a vanilla file replace it; new files are added. The game reads Paradox's Clausewitz script: nested
`key = value` blocks.

| Folder | Contents |
|---|---|
| `descriptor.mod` | Name, supported game version (`1.19.*`), tags, thumbnail |
| `common/national_focus/` | Focus trees: each focus has a position (x, y), cost in weeks, prerequisites, mutual exclusions, `available`/`bypass` triggers, an AI weight and a `completion_reward` |
| `common/ideas/` | National spirits and laws: a list of modifiers |
| `common/dynamic_modifiers/` | Spirits whose values come from variables (Palanmir, the Kurdish resistance) |
| `common/decisions/` and `categories/` | Decisions: cost, availability, targets, timers, effects, AI weights |
| `common/characters/`, `common/country_leader/` | Leaders, advisors, commanders and their traits |
| `common/scripted_effects/`, `scripted_triggers/` | Reusable script blocks |
| `common/units/` | Sub-unit definitions (the Oppressed Soldiers) |
| `common/bop/` | Balance of power (the Danzig Question) |
| `common/on_actions/` | Hooks the game fires on game start, war, annexation and so on |
| `events/` | Country and news events |
| `history/countries/`, `history/states/`, `history/units/` | The 1936 start: politics, leaders, ownership, buildings, armies |
| `interface/*.gfx`, `gfx/` | Sprite definitions and textures (DDS), flags (TGA, three sizes), portraits |
| `localisation/english/*.yml` | Every visible text, UTF-8 **with BOM** |

Rules of thumb that matter in practice:

- Give everything a mod prefix (`DZG_`, `AZV_`...) so nothing collides with vanilla or other mods.
- Never let a focus, spirit and decision share an ID: they share one localisation key.
- `allowed` on decisions is evaluated once at start-up, so it is the cheapest gate there is.
- New countries need their state history overridden by the *exact* vanilla file name, or both files load.
- Graphics are the most time-consuming part: every focus needs an icon and a "shine" sprite.

## 3. What makes a mod enjoyable

### The most popular mods, and why

| Mod | Why players subscribe |
|---|---|
| **Road to 56** | "More of the game": extra alternate-history paths in vanilla style, a reworked tech tree, events to 1956 |
| **Kaiserreich** | The best-known alternate-history scenario: a coherent world, a tree and story for almost every country |
| **The New Order** | Narrative first: thousands of written events, "super events", custom interfaces for its own mechanics, strong art |
| **Millennium Dawn** | A modern-day setting with its own economic and political systems |
| **Old World Blues** | A total conversion (Fallout), proving a setting can carry a mod on its own |
| Smaller hits (Anime History, Hydration Breaks, DOOM, cosmetic and equipment-name mods) | Humour, novelty and low-commitment improvements also attract very large audiences |

### Patterns that come up again and again

1. **Meaningful choices.** Players praise trees that open up more political paths and real
   alternatives, and criticise trees that are a single line of buffs.
2. **Writing and flavour.** Events, descriptions and historical details are what people remember.
   Bilingual or well-translated text is valued.
3. **Unique mechanics.** Something vanilla does not have (a custom panel, a balance of power, a resource
   to manage) makes a country feel different.
4. **Art.** Consistent, readable focus icons and portraits are one of the first things players judge
   on the Workshop page.
5. **Balance.** Getting modern tanks or capital ships in 1940 is a classic complaint. Rewards should be
   strong but plausible.
6. **Completion and maintenance.** Abandoned mods ("75% done") lose players. A finished, consistent
   scope beats a half-built large one, and mods must be updated for each game version.
7. **Performance.** Lag is the main reason players drop big mods. Polled events (mean time to happen)
   are the classic culprit; triggered events with delays are the cure.
8. **Player control.** Game rules for AI behaviour and optional features let people tune the experience.

## 4. How the findings were applied in Borderlands Rising

| Finding | In the mod |
|---|---|
| Meaningful choices | Danzig has five political paths, including monarchism for non-aligned, and the Danzig Question decides whose land is easier to take; Azerbaijan chooses its regency and how to win the South |
| Writing and flavour | Real figures (Greiser, Lester, Wrangel, Turkul, Rasulzade, Shikhlinski...), event chains, news events |
| Unique mechanics | A balance of power for Danzig, an equipment-for-political-power arsenal with a growing delivery rate for Azov United, a president who grows up (trait and portrait), Palanmir's data levels and coring by integration, a Kurdish uprising system |
| Humour | The baby president, his kindergarten cabinet and Palanmir's satire, kept affectionate and clearly fictional where real people are involved |
| Art | 450 icons in a framed badge style with a distinct frame per country, laurels on capstones, custom flags and portraits |
| Balance | Focus rewards are tech bonuses and spirits, not free modern equipment; strong spirits carry costs (stability, war support, manpower) |
| Performance | No polled events; two self-scheduling monthly events; one guarded start-up hook; decisions gated by `allowed` |
| Player control | Game rules for Danzig's AI path, Lithuania's tree and the strength of Kurdish resistance |

## Sources

- [The Steam Workshop for Hearts of Iron IV](https://steamcommunity.com/app/394360/workshop/)
- [PCGamesN: The best Hearts of Iron 4 mods](https://www.pcgamesn.com/hearts-of-iron-iv/mods-best)
- [Wargamer: Best HoI4 mods to play right now](https://www.wargamer.com/hearts-of-iron-4/mods)
- [Wargamer: The New Order is a narrative-driven HOI4 mod](https://www.wargamer.com/hearts-of-iron-4/mod-the-new-order)
- [EIP Gaming: Best mods in Hearts of Iron 4](https://eip.gg/hoi4/guides/best-mods/)
- [GameWatcher: The best HOI4 mods](https://www.gamewatcher.com/the-best-hoi-4-mods)
- [GamersDecide: Top 25 best Hearts of Iron 4 mods](https://www.gamersdecide.com/articles/best-hearts-of-iron-4-mods)
- [The New Order on the Steam Workshop](https://steamcommunity.com/sharedfiles/filedetails/?id=2438003901)
- [Steam Community: HOI4 discussion on focus-tree mods](https://steamcommunity.com/app/394360/discussions/0/1489992713695104530)
- [HOI4 Wiki: Event modding](https://hoi4.paradoxwikis.com/Event_modding) (performance of mean-time-to-happen events)
- [Paradox forum: a general guide to reducing lag](https://forum.paradoxplaza.com/forum/threads/heres-a-general-guide-to-reduce-lag.1068925/)
- [Paradox Mods: Hearts of Iron IV](https://mods.paradoxplaza.com/games/hoi4)
