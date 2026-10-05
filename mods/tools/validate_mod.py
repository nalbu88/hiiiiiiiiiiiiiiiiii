#!/usr/bin/env python3
"""
Static validator for the mods in this repository (Anatolian Ascendancy,
Borderlands Rising).

Checks a mod without launching the game:
  * Clausewitz script syntax (tokens, balanced braces) for every .txt/.gfx
  * cross references: focuses, spirits, events, characters, traits, units,
    scripted effects/triggers, opinion modifiers, decisions, sprites, flags
  * localisation coverage, duplicate keys, UTF-8 BOM
  * effect, trigger and modifier names, checked against the game's own
    script documentation shipped with the CWTools HOI4 rules
    (https://github.com/cwtools/cwtools-hoi4-config)

Usage:
    git clone --depth 1 https://github.com/cwtools/cwtools-hoi4-config.git
    python3 validate_mod.py --mod ../anatolian_ascendancy --cwtools cwtools-hoi4-config
    python3 validate_mod.py --mod ../borderlands_rising --cwtools cwtools-hoi4-config

Each mod has a profile (see PROFILES below) listing the vanilla names it is
allowed to reference and its own rules, such as the longest focus allowed.

Exit code is non-zero when errors are found. Warnings never fail the run.
"""
import argparse
import glob
import json
import os
import re
import sys

# --------------------------------------------------------------------------
# Vanilla references this mod relies on. Every name here was cross-checked
# against shipped game content (see mods/README.md for how).
# --------------------------------------------------------------------------
VANILLA_SPRITES = {
    # event pictures
    "GFX_report_event_generic_conference", "GFX_report_event_gre_diplomacy",
    "GFX_report_event_generic_sign_treaty1", "GFX_report_event_generic_sign_treaty2",
    "GFX_report_event_generic_rally", "GFX_report_event_generic_rally2",
    "GFX_report_event_generic_handshake", "GFX_report_event_eng_royal_family",
    "GFX_report_event_generic_factory", "GFX_report_event_generic_research_lab",
    "GFX_report_event_lithuania_army", "GFX_report_event_yugoslavian_cavalry",
    "GFX_report_event_dead_soldiers", "GFX_news_event_generic_army",
    "GFX_news_event_generic_rally_3", "GFX_news_event_gathering_protest",
    "GFX_news_event_generic_riot",
    # decision icons and category picture
    "GFX_decision_generic_industry", "GFX_decision_generic_construction",
    "GFX_decision_generic_protection", "GFX_decision_generic_civil_support",
    "GFX_decision_oppression", "GFX_decision_generic_military",
    "GFX_decision_generic_form_nation", "GFX_decision_border_war",
    "GFX_decision_generic_ignite_civil_war", "GFX_decision_cat_generic_ottoman_empire",
    # decision icons added with the economy rework (vanilla resource and generic icons)
    "GFX_decision_oil", "GFX_decision_aluminium", "GFX_decision_chromium",
    "GFX_decision_tungsten", "GFX_decision_rubber", "GFX_decision_coal",
    "GFX_decision_generic_research", "GFX_decision_generic_army_support",
    "GFX_decision_generic_political_discourse", "GFX_decision_ger_mefo_bills",
    "GFX_decision_generic_nationalism", "GFX_decision_generic_tank",
    # event pictures added with the rework
    "GFX_report_event_generic_ruins", "GFX_news_event_tank_factory",
    # faction logo
    "GFX_faction_logo_generic_democratic",
}
VANILLA_TEXTURES = {
    "gfx/interface/counters/divisions_large/unit_infantry_icon.dds",
    "gfx/interface/counters/divisions_small/onmap_unit_infantry_icon.dds",
    "gfx/interface/goals/shine_overlay.dds",
    "gfx/FX/buttonstate.lua",
}
VANILLA_SUBUNITS = {"infantry", "artillery_brigade"}
# Unit leader traits, checked against common/unit_leader/00_traits.txt
VANILLA_UNIT_LEADER_TRAITS = {"cavalry_officer", "trait_mountaineer", "organizer", "old_guard",
                              "trait_cautious", "career_officer", "war_hero", "trickster"}
VANILLA_TAGS = {"TUR", "PER", "IRQ", "AFG", "GRE", "YUG", "ROM", "BUL", "ALB", "SOV",
                "GER", "ENG", "USA", "ITA", "SAU", "YEM", "KUW", "JOR", "SYR", "LEB",
                "PAL", "SIK", "FRA", "JAP"}
# Vanilla Turkish spirits and state modifiers from Battle for the Bosporus
# (history/countries/TUR - Turkey.txt). The mod only ever removes them.
VANILLA_IDEAS = {
    "TUR_kemalist_army_officers_limited_power_loyal", "TUR_kemalist_army_officers_extended_power_loyal",
    "TUR_kemalist_army_officers_extended_power_neutral", "TUR_sectarian_woes",
    "TUR_disorganised_armed_forces", "TUR_disorganised_armed_forces_3", "TUR_debt_council",
}
VANILLA_DYNAMIC_MODIFIERS = {
    "kurdish_agitation", "kurdish_separatism", "islamist_opposition", "islamist_sedition",
    "islamist_insurgency",
}
# Vanilla Turkish characters recruited at game start; the mod checks for
# them with has_character so that its own copies never appear twice.
VANILLA_CHARACTERS = {
    "TUR_fevzi_cakmak", "TUR_celal_bayar", "TUR_sefik_husnu", "TUR_nihal_atsiz", "TUR_nazim_hikmet",
    "TUR_kazim_karabekir", "TUR_mustafa_muglali", "TUR_fahrettin_altay", "TUR_sabiha_gokcen",
    "TUR_rauf_orbay", "TUR_adnan_menderes", "TUR_nuri_demirag", "TUR_fethi_okyar",
    "TUR_sevket_sureyya_aydemir",
}
MAX_FOCUS_COST = 4.5   # 4.5 x 7 = 31 days; every focus must take less than 35 days
IDEOLOGIES = ["democratic", "fascism", "communism", "neutrality"]
DYNAMIC_MODIFIER_PATTERNS = [
    r"^production_speed_[a-z_]+_factor$",
    r"^(democratic|fascism|communism|neutrality)_(drift|acceptance)$",
]
FOCUS_FILTERS = {
    "FOCUS_FILTER_POLITICAL", "FOCUS_FILTER_RESEARCH", "FOCUS_FILTER_INDUSTRY",
    "FOCUS_FILTER_STABILITY", "FOCUS_FILTER_WAR_SUPPORT", "FOCUS_FILTER_MANPOWER",
    "FOCUS_FILTER_ANNEXATION", "FOCUS_FILTER_HISTORICAL", "FOCUS_FILTER_INTERNATIONAL_TRADE",
    "FOCUS_FILTER_ARMY_XP", "FOCUS_FILTER_NAVY_XP", "FOCUS_FILTER_AIR_XP",
    "FOCUS_FILTER_POLITICAL_CHARACTER", "FOCUS_FILTER_MILITARY_CHARACTER",
    # vanilla Turkish filters (Battle for the Bosporus)
    "FOCUS_FILTER_TUR_KURDISTAN", "FOCUS_FILTER_TUR_KEMALISM", "FOCUS_FILTER_TUR_TRADITIONALISM",
}
# Prefixes of the mod's own flags: a flag with one of these prefixes that is
# checked but never set is an error.
MOD_PREFIXES = ("TRX_",)
# Vanilla focuses the mod checks with has_completed_focus.
VANILLA_FOCUSES = set()
# Vanilla localisation keys the mod uses (e.g. in custom_effect_tooltip).
VANILLA_LOC = set()

# --------------------------------------------------------------------------
# Per-mod profiles. The constants above are the Anatolian Ascendancy
# profile; other mods replace them here. Selected by the mod folder name.
# --------------------------------------------------------------------------
_BR_TAGS = {
    "DNZ", "CRI", "AZR", "LIT", "LAT", "EST", "FIN", "SWE", "NOR", "DEN", "HOL", "BEL", "ENG",
    "FRA", "ITA", "SOV", "USA", "GER", "POL", "HUN", "ROM", "YUG", "BUL", "GRE", "JAP", "TUR",
    "IRQ", "PER", "KUR", "KSH", "PRE", "GEO", "ARM", "UKR", "SPR", "CZE", "AUS", "SWI",
}
PROFILES = {
    "borderlands_rising": {
        # Vanilla 1.19 sprites. The additions are used, never defined, by
        # Chaos Redux, which ships against the current game version.
        "VANILLA_SPRITES": VANILLA_SPRITES | {
            "GFX_decision_generic_political_rally", "GFX_decision_generic_prepare_civil_war",
            "GFX_report_event_soviet_purge_trial", "GFX_report_event_spr_spanish_civil_war",
        },
        "VANILLA_TEXTURES": VANILLA_TEXTURES,
        "VANILLA_SUBUNITS": {"infantry", "cavalry", "mountaineers", "motorized", "artillery_brigade",
                             "artillery", "recon"},
        # Unit leader traits (common/unit_leader) and vanilla advisor traits
        # (common/country_leader), as used by vanilla 1.19 character files.
        "VANILLA_UNIT_LEADER_TRAITS": {
            "career_officer", "trait_engineer", "trait_reckless", "old_guard", "thorough_planner",
            "brilliant_strategist", "war_hero", "defensive_doctrine", "harsh_leader", "cavalry_leader",
            "cavalry_officer", "trait_mountaineer", "trait_cautious", "naval_lineage",
            "superior_tactician", "armor_officer",
            "army_chief_drill_2", "army_chief_organizational_2", "army_infantry_2",
            "grand_battle_plan_expert", "navy_chief_decisive_battle_2", "air_chief_reform_2",
        },
        "VANILLA_TAGS": _BR_TAGS,
        # Vanilla laws set in the new countries' history files.
        "VANILLA_IDEAS": {
            "volunteer_only", "limited_conscription", "civilian_economy", "partial_economic_mobilisation",
            "free_trade", "export_focus",
        },
        # international_city: added to Danzig by Poland's history file.
        "VANILLA_DYNAMIC_MODIFIERS": {"kurdish_agitation", "kurdish_separatism", "international_city"},
        "VANILLA_CHARACTERS": set(),
        # Tooltips of focuses that unlock advisors, as the base game writes them.
        "VANILLA_LOC": {"available_political_advisor", "available_theorist", "available_chief_of_airforce"},
        "VANILLA_FOCUSES": {"GER_reassert_eastern_claims"},
        "MAX_FOCUS_COST": 6.4,   # 6.4 x 7 = 44.8 days: no focus may take longer than 45 days
        "MOD_PREFIXES": ("DZG_", "AZV_", "ODL_", "PLM_", "KRD_", "BRS_"),
    },
}

errors = []
warnings = []


def err(msg):
    errors.append(msg)


def warn(msg):
    warnings.append(msg)


# --------------------------------------------------------------------------
# Clausewitz parser
# --------------------------------------------------------------------------
TOKEN_RE = re.compile(r'\s+|#[^\n]*|"(?:[^"\\]|\\.)*"|[{}]|<=|>=|!=|[=<>]|[^\s{}=<>"#]+')


class Node:
    __slots__ = ("key", "op", "value", "line")

    def __init__(self, key, op, value, line):
        self.key, self.op, self.value, self.line = key, op, value, line

    @property
    def is_block(self):
        return isinstance(self.value, list)


def tokenize(text, path):
    pos, line, out = 0, 1, []
    while pos < len(text):
        m = TOKEN_RE.match(text, pos)
        if not m:
            err("%s:%d: cannot tokenize near %r" % (path, line, text[pos:pos + 20]))
            return out
        tok = m.group(0)
        if not tok.isspace() and not tok.startswith("#"):
            out.append((tok, line))
        line += tok.count("\n")
        pos = m.end()
    return out


def parse(tokens, path):
    pos = 0

    def block(depth):
        nonlocal pos
        items = []
        while pos < len(tokens):
            tok, line = tokens[pos]
            if tok == "}":
                if depth == 0:
                    err("%s:%d: unmatched '}'" % (path, line))
                    pos += 1
                    continue
                pos += 1
                return items
            if tok == "{":
                pos += 1
                items.append(Node("", None, block(depth + 1), line))
                continue
            if pos + 1 < len(tokens) and tokens[pos + 1][0] in ("=", "<", ">", "<=", ">=", "!="):
                op = tokens[pos + 1][0]
                pos += 2
                if pos >= len(tokens):
                    err("%s:%d: missing value after %s" % (path, line, tok))
                    return items
                vtok, vline = tokens[pos]
                if vtok == "{":
                    pos += 1
                    items.append(Node(tok, op, block(depth + 1), line))
                elif vtok == "}":
                    err("%s:%d: missing value after %s" % (path, line, tok))
                else:
                    pos += 1
                    items.append(Node(tok, op, vtok.strip('"'), line))
            else:
                pos += 1
                items.append(Node("", None, tok.strip('"'), line))
        if depth != 0:
            err("%s: unexpected end of file, %d unclosed '{'" % (path, depth))
        return items

    return block(0)


def load(path):
    raw = open(path, "rb").read()
    if raw.startswith(b"\xef\xbb\xbf") and not path.endswith(".yml"):
        warn("%s: script file has a UTF-8 BOM" % path)
    text = raw.decode("utf-8-sig")
    return parse(tokenize(text, path), path)


def walk(nodes):
    for n in nodes:
        yield n
        if n.is_block:
            yield from walk(n.value)


def child(nodes, key):
    return [n for n in nodes if n.key == key]


def scalars(nodes):
    return [n.value for n in nodes if not n.is_block and n.key == ""]


# --------------------------------------------------------------------------
# Effect / trigger context checker
# --------------------------------------------------------------------------
class Checker:
    def __init__(self, effects, triggers, s_effects, s_triggers, characters, path):
        self.effects, self.triggers = effects, triggers
        self.s_effects, self.s_triggers = s_effects, s_triggers
        self.characters = characters
        self.path = path

    def is_scope(self, key):
        if re.fullmatch(r"[A-Z][A-Z0-9]{2}", key) or key.isdigit():
            return True
        if key in ("ROOT", "FROM", "PREV", "THIS", "owner", "controller", "capital_scope",
                   "FROM.FROM", "PREV.PREV", "overlord", "faction_leader"):
            return True
        if key.startswith("event_target:") or key in self.characters:
            return True
        return False

    def effect_block(self, nodes):
        for n in nodes:
            k = n.key
            if k == "":
                continue
            if k in ("if", "else_if"):
                self.effect_block([c for c in n.value if c.key != "limit"])
                for lim in child(n.value, "limit"):
                    self.trigger_block(lim.value)
            elif k in ("else", "hidden_effect"):
                self.effect_block(n.value)
            elif k == "random_list":
                for c in n.value:
                    if c.is_block:
                        self.effect_block([x for x in c.value if x.key != "modifier"])
            elif k.startswith(("every_", "random_")) and k in self.effects:
                for lim in child(n.value, "limit"):
                    self.trigger_block(lim.value)
                self.effect_block([c for c in n.value if c.key not in ("limit", "random_select_amount", "tooltip")])
            elif self.is_scope(k):
                if n.is_block:
                    self.effect_block(n.value)
            elif k in self.s_effects:
                if n.value != "yes":
                    err("%s:%d: scripted effect %s should be called with = yes" % (self.path, n.line, k))
            elif k not in self.effects:
                err("%s:%d: unknown effect '%s'" % (self.path, n.line, k))

    def trigger_block(self, nodes):
        for n in nodes:
            k = n.key
            if k == "":
                continue
            if k in ("OR", "AND", "NOT", "NOR", "NAND"):
                self.trigger_block(n.value)
            elif k == "custom_trigger_tooltip":
                self.trigger_block([c for c in n.value if c.key != "tooltip"])
            elif k.startswith(("any_", "all_")) and k in self.triggers:
                self.trigger_block(n.value)
            elif self.is_scope(k):
                if n.is_block:
                    self.trigger_block(n.value)
            elif k in self.s_triggers:
                pass
            elif k not in self.triggers:
                # ideology popularity comparisons, e.g. "democratic > 0.3"
                if k in IDEOLOGIES and n.op in (">", "<"):
                    continue
                err("%s:%d: unknown trigger '%s'" % (self.path, n.line, k))

    def mtth(self, nodes):
        for n in nodes:
            if n.key == "modifier":
                self.trigger_block([c for c in n.value if c.key not in ("factor", "add", "base")])


def check_modifiers(nodes, valid, path, where):
    for n in nodes:
        if n.key == "":
            continue
        if n.key in valid or any(re.match(p, n.key) for p in DYNAMIC_MODIFIER_PATTERNS):
            continue
        err("%s:%d: unknown modifier '%s' in %s" % (path, n.line, n.key, where))


# --------------------------------------------------------------------------
# Localisation
# --------------------------------------------------------------------------
LOC_RE = re.compile(r'^ ([A-Za-z0-9_.\-]+):\d* "(.*)"\s*$')


def load_loc(mod):
    keys = {}
    for path in glob.glob(os.path.join(mod, "localisation", "**", "*.yml"), recursive=True):
        raw = open(path, "rb").read()
        if not raw.startswith(b"\xef\xbb\xbf"):
            err("%s: localisation must be UTF-8 with BOM" % path)
        if not os.path.basename(path).endswith("_l_english.yml"):
            err("%s: file name must end with _l_english.yml" % path)
        lines = raw.decode("utf-8-sig").split("\n")
        if lines[0].strip() != "l_english:":
            err("%s: first line must be 'l_english:'" % path)
        for i, line in enumerate(lines[1:], 2):
            if not line.strip() or line.strip().startswith("#"):
                continue
            m = LOC_RE.match(line)
            if not m:
                err("%s:%d: malformed localisation line" % (path, i))
                continue
            k, v = m.groups()
            if '"' in v:
                err("%s:%d: unescaped quote inside %s" % (path, i, k))
            if k in keys:
                err("%s:%d: duplicate localisation key %s" % (path, i, k))
            keys[k] = v
    return keys


# --------------------------------------------------------------------------
# Main
# --------------------------------------------------------------------------
def main():
    ap = argparse.ArgumentParser(description=__doc__, formatter_class=argparse.RawDescriptionHelpFormatter)
    ap.add_argument("--mod", required=True)
    ap.add_argument("--cwtools", required=True, help="path to a cwtools-hoi4-config checkout")
    args = ap.parse_args()
    mod = args.mod
    profile = PROFILES.get(os.path.basename(os.path.normpath(mod)))
    if profile:
        globals().update(profile)

    # ---- game documentation ----
    cfg = os.path.join(args.cwtools, "Config")
    doc = json.load(open(os.path.join(cfg, "script_documentation.json"), encoding="utf-8"))
    effects, triggers = set(doc["effects"]), set(doc["triggers"])
    modifiers = {m["name"] for m in doc["modifiers"] if "name" in m}
    for f in glob.glob(os.path.join(cfg, "**", "*.cwt"), recursive=True):
        t = open(f, encoding="utf-8", errors="ignore").read()
        effects |= set(re.findall(r"alias\[effect:([A-Za-z_0-9]+)\]", t))
        triggers |= set(re.findall(r"alias\[trigger:([A-Za-z_0-9]+)\]", t))
        modifiers |= set(re.findall(r"alias\[modifier:([A-Za-z_0-9]+)\]", t))
    for line in open(os.path.join(cfg, "modifiers.cwt"), encoding="utf-8"):
        m = re.match(r"\s*([A-Za-z_0-9]+)\s*=\s*[a-z_]+", line)
        if m:
            modifiers.add(m.group(1))

    # ---- parse every script file ----
    files = {}
    for path in sorted(glob.glob(os.path.join(mod, "**", "*.txt"), recursive=True)
                       + glob.glob(os.path.join(mod, "**", "*.gfx"), recursive=True)):
        if os.path.basename(path) == "ICON_CREDITS.txt":
            continue
        files[os.path.relpath(path, mod)] = load(path)

    def tree(sub):
        return [(p, n) for p, n in files.items() if p.replace(os.sep, "/").startswith(sub)]

    loc = load_loc(mod)
    need_loc = set()

    # ---- collect definitions ----
    sprites, textures = {}, set()
    for p, nodes in tree("interface/"):
        for st in child(nodes, "spriteTypes"):
            for sp in st.value:
                if not sp.is_block:
                    continue
                name = (child(sp.value, "name") or [None])[0]
                tex = (child(sp.value, "texturefile") or child(sp.value, "textureFile") or [None])[0]
                if name is None or tex is None:
                    err("%s:%d: sprite without name or texturefile" % (p, sp.line))
                    continue
                if name.value in sprites:
                    err("%s:%d: duplicate sprite %s" % (p, sp.line, name.value))
                sprites[name.value] = tex.value
                for t in [tex] + [c for a in child(sp.value, "animation") for c in child(a.value, "animationmaskfile")]:
                    textures.add(t.value)
    for t in textures:
        if t not in VANILLA_TEXTURES and not os.path.isfile(os.path.join(mod, t)):
            err("texture %s does not exist" % t)
    all_sprites = set(sprites) | VANILLA_SPRITES

    # every sprite named anywhere in script (set_portraits, pictures, icons)
    for p, nodes in files.items():
        if p.replace(os.sep, "/").startswith("interface/"):
            continue
        for n in walk(nodes):
            if not n.is_block and n.value.startswith("GFX_") and n.value not in all_sprites:
                err("%s:%d: sprite %s undefined" % (p, n.line, n.value))

    s_effects, s_triggers = {}, {}
    for p, nodes in tree("common/scripted_effects/"):
        for n in nodes:
            s_effects[n.key] = (p, n)
    for p, nodes in tree("common/scripted_triggers/"):
        for n in nodes:
            s_triggers[n.key] = (p, n)

    characters = {}
    advisor_tokens = set()
    for p, nodes in tree("common/characters/"):
        for c in child(nodes, "characters"):
            for ch in c.value:
                characters[ch.key] = ch
                need_loc.add(ch.key)
                for adv in child(ch.value, "advisor"):
                    advisor_tokens.update(tk.value for tk in child(adv.value, "idea_token"))
                for role in child(ch.value, "country_leader"):
                    for d in child(role.value, "desc"):
                        need_loc.add(d.value)
                for pr in child(ch.value, "portraits"):
                    for kind in pr.value:
                        for size in kind.value if kind.is_block else []:
                            if size.value not in all_sprites:
                                err("%s:%d: portrait sprite %s undefined" % (p, size.line, size.value))

    traits = set()
    for p, nodes in tree("common/country_leader/"):
        for lt in child(nodes, "leader_traits"):
            for t in lt.value:
                traits.add(t.key)
                need_loc.add(t.key)
                check_modifiers([c for c in t.value if c.key not in ("random", "ai_will_do", "sprite")],
                                modifiers, p, "trait " + t.key)

    ideas = {}
    for p, nodes in tree("common/ideas/"):
        for top in child(nodes, "ideas"):
            for cat in top.value:
                for idea in cat.value:
                    ideas[idea.key] = idea
                    name = (child(idea.value, "name") or [None])[0]
                    lk = name.value if name else idea.key
                    need_loc.update([lk, lk + "_desc"])
                    pic = (child(idea.value, "picture") or [None])[0]
                    if "GFX_idea_" + idea.key not in all_sprites and (pic is None or "GFX_idea_" + pic.value not in all_sprites):
                        err("%s:%d: spirit %s has no sprite" % (p, idea.line, idea.key))
                    for m in child(idea.value, "modifier"):
                        check_modifiers(m.value, modifiers, p, "spirit " + idea.key)

    dyn_modifiers = set(VANILLA_DYNAMIC_MODIFIERS)
    for p, nodes in tree("common/dynamic_modifiers/"):
        for dm in nodes:
            dyn_modifiers.add(dm.key)
            need_loc.update([dm.key, dm.key + "_desc"])
            for ic in child(dm.value, "icon"):
                if ic.value not in all_sprites:
                    err("%s: dynamic modifier %s icon %s undefined" % (p, dm.key, ic.value))
            check_modifiers([c for c in dm.value if c.key not in ("icon", "enable", "remove_trigger", "attacker_modifier")],
                            modifiers, p, "dynamic modifier " + dm.key)

    static_modifiers = set()
    for p, nodes in tree("common/modifiers/"):
        for sm in nodes:
            static_modifiers.add(sm.key)
            need_loc.add(sm.key)
            check_modifiers(sm.value, modifiers, p, "static modifier " + sm.key)

    balances = set()
    for p, nodes in tree("common/bop/"):
        for bop in nodes:
            balances.add(bop.key)
            need_loc.add(bop.key)
            ranges = list(child(bop.value, "range"))
            for side in child(bop.value, "side"):
                for i in child(side.value, "id"):
                    need_loc.add(i.value)
                for ic in child(side.value, "icon"):
                    if ic.value not in all_sprites:
                        err("%s: balance of power side icon %s undefined" % (p, ic.value))
                ranges += child(side.value, "range")
            for r in ranges:
                for i in child(r.value, "id"):
                    need_loc.add(i.value)
                for m in child(r.value, "modifier"):
                    check_modifiers(m.value, modifiers, p, "balance of power " + bop.key)

    game_rules = {}
    for p, nodes in tree("common/game_rules/"):
        for rule in nodes:
            game_rules[rule.key] = {n.value for o in child(rule.value, "option") + child(rule.value, "default")
                                    for n in child(o.value, "name")}

    units = set(VANILLA_SUBUNITS)
    for p, nodes in tree("common/units/"):
        for su in child(nodes, "sub_units"):
            for u in su.value:
                units.add(u.key)
                need_loc.update([u.key, u.key + "_desc"])
                for suffix in ("_icon_medium", "_icon_medium_white"):
                    if "GFX_unit_%s%s" % (u.key, suffix) not in all_sprites:
                        err("%s: sub-unit %s lacks sprite GFX_unit_%s%s" % (p, u.key, u.key, suffix))
                if child(u.value, "sprite")[0].value not in ("infantry", "cavalry", "artillery"):
                    warn("%s: sub-unit %s uses a non-vanilla model" % (p, u.key))

    opinion = set()
    for p, nodes in tree("common/opinion_modifiers/"):
        for om in child(nodes, "opinion_modifiers"):
            for o in om.value:
                opinion.add(o.key)
                need_loc.add(o.key)

    templates = set()
    for p, nodes in tree("common/factions/templates/"):
        for t in nodes:
            templates.add(t.key)
            for nm in child(t.value, "name"):
                need_loc.add(nm.value)
            for ic in child(t.value, "icon"):
                if ic.value not in all_sprites:
                    err("%s: faction icon %s undefined" % (p, ic.value))

    for p, nodes in tree("common/game_rules/"):
        for rule in nodes:
            need_loc.update(n.value for n in child(rule.value, "name"))
            # mod-defined rule groups need a name; vanilla groups start with RULE_GROUP_
            need_loc.update(n.value for n in child(rule.value, "group") if not n.value.startswith("RULE_GROUP_"))
            for opt in child(rule.value, "option") + child(rule.value, "default"):
                need_loc.update(n.value for n in child(opt.value, "text") + child(opt.value, "desc"))

    # events
    events = {}
    namespaces = set()
    for p, nodes in tree("events/"):
        namespaces |= {n.value for n in child(nodes, "add_namespace")}
        for ev in nodes:
            if ev.key not in ("country_event", "news_event"):
                continue
            eid = child(ev.value, "id")[0].value
            if eid in events:
                err("%s: duplicate event id %s" % (p, eid))
            events[eid] = (p, ev)
            if eid.rsplit(".", 1)[0] not in namespaces:
                err("%s: event %s uses an undeclared namespace" % (p, eid))
            if not child(ev.value, "is_triggered_only"):
                warn("%s: event %s is not is_triggered_only (polled by MTTH)" % (p, eid))
            for k in ("title", "desc"):
                need_loc.update(n.value for n in child(ev.value, k))
            for pic in child(ev.value, "picture"):
                if pic.value not in all_sprites:
                    err("%s: event %s picture %s undefined" % (p, eid, pic.value))

    # focuses
    focuses = {}
    tree_of = {}   # focus id -> focus tree id; layouts are checked per tree
    for p, nodes in tree("common/national_focus/"):
        for ft in child(nodes, "focus_tree"):
            tree_id = child(ft.value, "id")[0].value
            need_loc.add(tree_id)
            for sc in child(ft.value, "shortcut"):
                need_loc.add(child(sc.value, "name")[0].value)
            for f in child(ft.value, "focus"):
                fid = child(f.value, "id")[0].value
                if fid in focuses:
                    err("%s: duplicate focus %s" % (p, fid))
                focuses[fid] = (p, f)
                tree_of[fid] = tree_id
                need_loc.update([fid, fid + "_desc"])
                for c in child(f.value, "cost"):
                    if float(c.value) > MAX_FOCUS_COST:
                        err("%s:%d: focus %s costs %s (%d days); the limit is %s"
                            % (p, c.line, fid, c.value, int(float(c.value) * 7), MAX_FOCUS_COST))
                icon = child(f.value, "icon")[0].value
                if icon not in all_sprites or icon + "_shine" not in all_sprites:
                    err("%s:%d: focus %s icon %s (or its _shine) undefined" % (p, f.line, fid, icon))
                for sf in child(f.value, "search_filters"):
                    for v in scalars(sf.value):
                        if v not in FOCUS_FILTERS:
                            err("%s: focus %s unknown search filter %s" % (p, fid, v))

    # decisions
    categories, decisions = {}, {}
    for p, nodes in tree("common/decisions/categories/"):
        for c in nodes:
            categories[c.key] = c
            need_loc.update([c.key, c.key + "_desc"])
            for ic in child(c.value, "icon") + child(c.value, "picture"):
                if ic.value not in all_sprites:
                    err("%s: category %s sprite %s undefined" % (p, c.key, ic.value))
    for p, nodes in files.items():
        if not p.replace(os.sep, "/").startswith("common/decisions/") or "categories" in p:
            continue
        for cat in nodes:
            if cat.key not in categories:
                err("%s: decisions placed in undefined category %s" % (p, cat.key))
            for d in cat.value:
                decisions[d.key] = (p, d)
                need_loc.update([d.key, d.key + "_desc"])
                for ic in child(d.value, "icon"):
                    if "GFX_decision_" + ic.value not in all_sprites and ic.value not in all_sprites:
                        err("%s: decision %s icon %s undefined" % (p, d.key, ic.value))
                if not child(d.value, "allowed"):
                    warn("%s: decision %s has no 'allowed' block" % (p, d.key))
                for m in child(d.value, "modifier"):
                    check_modifiers(m.value, modifiers, p, "decision " + d.key)

    # ---- context checks (effects and triggers) ----
    effect_keys = ("completion_reward", "complete_effect", "remove_effect", "timeout_effect",
                   "cancel_effect", "select_effect", "bypass_effect", "immediate", "after",
                   "on_activate", "on_deactivate", "instant_effect")
    trigger_keys = ("available", "visible", "allowed", "bypass", "trigger", "activation",
                    "target_trigger", "target_root_trigger", "cancel_trigger", "remove_trigger",
                    "allow_branch", "cancel", "historical_ai")

    for p, nodes in files.items():
        if p.startswith("interface"):
            continue
        ck = Checker(effects, triggers, s_effects, s_triggers, characters, p)
        rel = p.replace(os.sep, "/")
        if rel.startswith("common/scripted_effects/"):
            for n in nodes:
                ck.effect_block(n.value)
            continue
        if rel.startswith("common/scripted_triggers/"):
            for n in nodes:
                ck.trigger_block(n.value)
            continue
        if rel.startswith("history/countries/"):
            def history_block(nodes):
                for n in nodes:
                    if re.fullmatch(r"\d+\.\d+\.\d+", n.key):
                        history_block(n.value)
                    elif n.key in ("capital", "oob"):
                        continue
                    else:
                        ck.effect_block([n])
            history_block(nodes)
            for n in walk(nodes):
                if n.key in ("set_oob", "set_naval_oob", "set_air_oob", "oob") and not n.is_block:
                    if not os.path.isfile(os.path.join(mod, "history", "units", n.value + ".txt")):
                        err("%s:%d: order of battle %s not found in history/units" % (p, n.line, n.value))
            continue
        if rel.startswith(("history/states/", "history/units/")):
            continue
        if rel.startswith("common/on_actions/"):
            for oa in child(nodes, "on_actions"):
                for hook in oa.value:
                    for e in child(hook.value, "effect"):
                        ck.effect_block(e.value)
            continue
        for n in walk(nodes):
            if not n.is_block:
                continue
            if n.key in effect_keys:
                ck.effect_block(n.value)
            elif n.key == "option" and rel.startswith("events/"):
                ck.effect_block([c for c in n.value if c.key not in ("name", "trigger", "ai_chance", "original_recipient_only")])
                for t in child(n.value, "trigger"):
                    ck.trigger_block(t.value)
                for a in child(n.value, "ai_chance"):
                    ck.mtth(a.value)
            elif n.key in trigger_keys and not rel.startswith("common/factions"):
                # 'trigger' inside on-map offsets etc. is still a trigger block
                ck.trigger_block(n.value)
            elif n.key in ("ai_will_do", "ai_chance", "country", "priority") and rel.startswith(("common/national_focus", "common/decisions", "events")):
                ck.mtth(n.value)

    # ---- reference checks ----
    used_flags_set, used_flags_checked = set(), set()
    for p, nodes in files.items():
        if p.startswith("interface"):
            continue
        for n in walk(nodes):
            k, v = n.key, n.value
            if n.is_block:
                if k == "swap_ideas":
                    for c in n.value:
                        if c.key in ("add_idea", "remove_idea") and c.value not in ideas:
                            err("%s:%d: unknown spirit %s" % (p, c.line, c.value))
                elif k in ("country_event", "news_event") and child(n.value, "id") and not child(n.value, "option"):
                    # effect call: event definitions always have options
                    eid = child(n.value, "id")[0].value
                    if eid not in events:
                        err("%s:%d: unknown event %s" % (p, n.line, eid))
                elif k == "division_template":
                    for part in child(n.value, "regiments") + child(n.value, "support"):
                        for u in part.value:
                            if u.key not in units:
                                err("%s:%d: unknown sub-unit %s in template" % (p, u.line, u.key))
                elif k == "add_opinion_modifier":
                    for m in child(n.value, "modifier"):
                        if m.value not in opinion:
                            err("%s:%d: unknown opinion modifier %s" % (p, m.line, m.value))
                elif k == "create_faction_from_template":
                    for t in child(n.value, "template"):
                        if t.value not in templates:
                            err("%s:%d: unknown faction template %s" % (p, t.line, t.value))
                    for nm in child(n.value, "name"):
                        need_loc.add(nm.value)
                elif k in ("add_tech_bonus", "add_doctrine_cost_reduction"):
                    for nm in child(n.value, "name"):
                        need_loc.add(nm.value)
                elif k == "custom_trigger_tooltip":
                    for t in child(n.value, "tooltip"):
                        need_loc.add(t.value)
                elif k == "traits" and p.startswith("common" + os.sep + "characters"):
                    for t in scalars(n.value):
                        if t not in traits and t not in VANILLA_UNIT_LEADER_TRAITS:
                            err("%s:%d: unknown trait %s" % (p, n.line, t))
                elif k in ("add_dynamic_modifier", "remove_dynamic_modifier", "has_dynamic_modifier"):
                    for m in child(n.value, "modifier"):
                        if m.value not in dyn_modifiers:
                            err("%s:%d: unknown dynamic modifier %s" % (p, m.line, m.value))
                elif k == "add_timed_idea":
                    for m in child(n.value, "idea"):
                        if m.value not in ideas:
                            err("%s:%d: unknown spirit %s" % (p, m.line, m.value))
                elif k == "add_country_leader_role":
                    for c in child(n.value, "character"):
                        if c.value not in characters and c.value not in VANILLA_CHARACTERS:
                            err("%s:%d: unknown character %s" % (p, c.line, c.value))
                    for cl in child(n.value, "country_leader"):
                        for d in child(cl.value, "desc"):
                            need_loc.add(d.value)
                        for t in child(cl.value, "traits"):
                            for tr in scalars(t.value):
                                if tr not in traits:
                                    err("%s:%d: unknown trait %s" % (p, t.line, tr))
                elif k in ("add_ideas", "remove_ideas"):
                    for v2 in scalars(n.value):
                        if v2 not in ideas and v2 not in VANILLA_IDEAS:
                            err("%s:%d: unknown spirit %s" % (p, n.line, v2))
                elif k in ("add_power_balance_modifier", "remove_power_balance_modifier",
                           "add_power_balance_value", "set_power_balance", "power_balance_value",
                           "is_power_balance_in_range", "has_power_balance"):
                    for i in child(n.value, "id"):
                        if i.value not in balances:
                            err("%s:%d: unknown balance of power %s" % (p, i.line, i.value))
                    for m in child(n.value, "modifier"):
                        if m.value not in static_modifiers:
                            err("%s:%d: unknown static modifier %s" % (p, m.line, m.value))
                elif k == "has_game_rule":
                    rule = (child(n.value, "rule") or [None])[0]
                    opt = (child(n.value, "option") or [None])[0]
                    if rule is None or rule.value not in game_rules:
                        err("%s:%d: unknown game rule" % (p, n.line))
                    elif opt is not None and opt.value not in game_rules[rule.value]:
                        err("%s:%d: game rule %s has no option %s" % (p, n.line, rule.value, opt.value))
                elif k == "set_party_name":
                    for nm in child(n.value, "name") + child(n.value, "long_name"):
                        need_loc.add(nm.value)
                elif k == "add_named_threat":
                    for nm in child(n.value, "name"):
                        need_loc.add(nm.value)
                elif k == "add_unit_bonus":
                    for u in n.value:
                        if u.key not in units and not u.key.startswith("category_"):
                            err("%s:%d: unknown sub-unit %s in add_unit_bonus" % (p, u.line, u.key))
                continue
            if k in ("add_ideas", "remove_ideas", "has_idea") and v not in ideas and v not in VANILLA_IDEAS:
                err("%s:%d: unknown spirit %s" % (p, n.line, v))
            elif k in ("recruit_character", "promote_character") and v not in characters:
                err("%s:%d: unknown character %s" % (p, n.line, v))
            elif k == "has_character" and v not in characters and v not in VANILLA_CHARACTERS:
                err("%s:%d: unknown character %s" % (p, n.line, v))
            elif k == "activate_mission" and v not in decisions:
                err("%s:%d: unknown mission %s" % (p, n.line, v))
            elif k in ("country_event", "news_event") and v not in events:
                err("%s:%d: unknown event %s" % (p, n.line, v))
            elif k == "unlock_subunit" and v not in units:
                err("%s:%d: unknown sub-unit %s" % (p, n.line, v))
            elif k == "add_country_leader_trait" and v not in traits:
                err("%s:%d: unknown trait %s" % (p, n.line, v))
            elif k in ("has_completed_focus",) and v not in focuses and v not in VANILLA_FOCUSES:
                err("%s:%d: unknown focus %s" % (p, n.line, v))
            elif k in ("custom_effect_tooltip",):
                need_loc.add(v)
            elif k == "show_ideas_tooltip" and v not in ideas and v not in advisor_tokens:
                err("%s:%d: show_ideas_tooltip: unknown spirit or advisor %s" % (p, n.line, v))
            elif k in ("unlock_decision_tooltip", "activate_decision") and v not in decisions:
                err("%s:%d: unknown decision %s" % (p, n.line, v))
            elif k == "unlock_decision_category_tooltip" and v not in categories:
                err("%s:%d: unknown decision category %s" % (p, n.line, v))
            elif k == "set_country_flag":
                used_flags_set.add(v)
            elif k == "has_country_flag":
                used_flags_checked.add(v)
            elif k == "set_cosmetic_tag":
                for suffix in [""] + ["_" + i for i in IDEOLOGIES]:
                    for size in ("", "medium/", "small/"):
                        if not os.path.isfile(os.path.join(mod, "gfx/flags", size, v + suffix + ".tga")):
                            err("flag gfx/flags/%s%s%s.tga missing" % (size, v, suffix))
                    need_loc.update([v + suffix, v + suffix + "_ADJ", v + suffix + "_DEF"])
            elif k == "name" and n.key == "name" and p.startswith("events"):
                need_loc.add(v)
            elif re.fullmatch(r"[A-Z][A-Z0-9]{2}", k) and k not in VANILLA_TAGS:
                warn("%s:%d: tag %s is not in the list of tags this mod expects" % (p, n.line, k))
            if k in ("tag", "original_tag", "target", "country", "producer") and re.fullmatch(r"[A-Z][A-Z0-9]{2}", v) and v not in VANILLA_TAGS:
                warn("%s:%d: tag %s is not in the list of tags this mod expects" % (p, n.line, v))
            if k in s_triggers and v != "yes":
                warn("%s:%d: scripted trigger %s compared to %s" % (p, n.line, k, v))
        for n in walk(nodes):
            # block form: set_country_flag = { flag = X days = N }
            if n.key == "set_country_flag" and n.is_block:
                used_flags_set.update(c.value for c in child(n.value, "flag"))
            if n.key == "targets" and n.is_block and "decisions" in p:
                for t in scalars(n.value):
                    if not t.isdigit() and t not in VANILLA_TAGS:
                        warn("%s: decision target %s not a known tag" % (p, t))

    for f in used_flags_checked - used_flags_set:
        if f.startswith(MOD_PREFIXES):
            err("country flag %s is checked but never set" % f)

    # focus graph
    for fid, (p, f) in focuses.items():
        for blk in ("prerequisite", "mutually_exclusive"):
            for pr in child(f.value, blk):
                for c in child(pr.value, "focus"):
                    if c.value not in focuses:
                        err("%s: focus %s references unknown focus %s" % (p, fid, c.value))
        for r in child(f.value, "relative_position_id"):
            if r.value not in focuses:
                err("%s: focus %s positioned relative to unknown %s" % (p, fid, r.value))
        for me in child(f.value, "mutually_exclusive"):
            for c in child(me.value, "focus"):
                other = focuses.get(c.value)
                if other and fid not in [x.value for m2 in child(other[1].value, "mutually_exclusive") for x in child(m2.value, "focus")]:
                    warn("mutual exclusion %s -> %s is one-sided" % (fid, c.value))

    # focus layout: resolve positions, then look for overlaps and upward links
    pos = {}

    def resolve(fid, seen=()):
        if fid in pos:
            return pos[fid]
        if fid in seen or fid not in focuses:
            return None
        f = focuses[fid][1]
        x = int((child(f.value, "x") or [None])[0].value) if child(f.value, "x") else 0
        y = int((child(f.value, "y") or [None])[0].value) if child(f.value, "y") else 0
        rel = child(f.value, "relative_position_id")
        if rel:
            base = resolve(rel[0].value, seen + (fid,))
            if base is None:
                return None
            x, y = x + base[0], y + base[1]
        pos[fid] = (x, y)
        return pos[fid]

    for fid in focuses:
        resolve(fid)
    by_cell = {}
    for fid, xy in pos.items():
        by_cell.setdefault((tree_of[fid], xy), []).append(fid)
    for (_, xy), ids in by_cell.items():
        if len(ids) > 1:
            err("focuses %s overlap at x=%d y=%d" % (", ".join(sorted(ids)), xy[0], xy[1]))
    rows = {}
    for fid, (x, y) in pos.items():
        rows.setdefault((tree_of[fid], y), []).append((x, fid))
    for (_, y), row in rows.items():
        row.sort()
        for (x1, a), (x2, b) in zip(row, row[1:]):
            if 0 < x2 - x1 < 2:
                warn("focuses %s and %s are only %d column apart on row %d" % (a, b, x2 - x1, y))
    for fid, (p, f) in focuses.items():
        for pr in child(f.value, "prerequisite"):
            for c in child(pr.value, "focus"):
                if c.value in pos and fid in pos and pos[c.value][1] >= pos[fid][1]:
                    warn("focus %s is not below its prerequisite %s" % (fid, c.value))

    # event options need localisation
    for eid, (p, ev) in events.items():
        for opt in child(ev.value, "option"):
            need_loc.update(n.value for n in child(opt.value, "name"))

    for k in sorted(need_loc):
        if k not in loc and k not in VANILLA_LOC:
            err("missing localisation key %s" % k)
    unused = set(loc) - need_loc
    for k in sorted(unused):
        if not any(k == d or k == d + "_desc" for d in list(decisions) + list(categories)):
            warn("localisation key %s is never referenced" % k)

    print("Checked %d script files, %d localisation keys" % (len(files), len(loc)))
    print("  %d focuses, %d spirits, %d decisions, %d events, %d characters, %d sprites"
          % (len(focuses), len(ideas), len(decisions), len(events), len(characters), len(sprites)))
    for w in warnings:
        print("WARNING:", w)
    for e in errors:
        print("ERROR:", e)
    print("%d error(s), %d warning(s)" % (len(errors), len(warnings)))
    return 1 if errors else 0


if __name__ == "__main__":
    sys.exit(main())
