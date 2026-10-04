#!/usr/bin/env python3
"""
Anatolian Ascendancy - asset builder.

Renders every image the mod ships (focus icons, national spirit icons,
decision category icons, sub-unit counters, formable flags and the mod
thumbnail) and writes the matching interface/*.gfx sprite definitions.

Glyphs come from the game-icons.net collection (CC BY 3.0), which is not
vendored here. Clone it next to this script before running:

    git clone --depth 1 https://github.com/game-icons/icons.git game-icons
    pip install pillow cairosvg numpy
    python3 build_assets.py --icons game-icons --mod ../anatolian_ascendancy

Textures are written as uncompressed 32-bit DDS (A8R8G8B8, no mipmaps) and
flags as uncompressed 32-bit TGA with a bottom-left origin, which is what
Hearts of Iron IV expects.
"""
import argparse
import io
import math
import os
import re
import struct
import sys

import cairosvg
import numpy as np
from PIL import Image, ImageDraw, ImageFilter, ImageFont

SS = 4  # supersampling factor

# --------------------------------------------------------------------------
# Colour themes: (dark, light, glyph_top, glyph_bottom, rim)
# --------------------------------------------------------------------------
GOLD = ((214, 170, 74), (255, 229, 150))
THEMES = {
    "foreign":    ((18, 70, 78), (52, 140, 150), (255, 255, 255), (205, 232, 230), GOLD),
    "army":       ((52, 60, 28), (118, 132, 66), (255, 255, 255), (222, 226, 200), GOLD),
    "air":        ((24, 64, 104), (78, 142, 198), (255, 255, 255), (210, 228, 245), GOLD),
    "navy":       ((14, 30, 66), (44, 82, 150), (255, 255, 255), (200, 212, 240), GOLD),
    "politics":   ((96, 14, 20), (186, 40, 46), (255, 244, 214), (236, 200, 120), GOLD),
    "kemalist":   ((120, 10, 18), (214, 30, 40), (255, 255, 255), (236, 222, 222), GOLD),
    "democratic": ((22, 46, 110), (64, 106, 200), (255, 255, 255), (214, 224, 250), GOLD),
    "ottoman":    ((10, 64, 40), (36, 128, 82), (255, 236, 160), (214, 168, 70), GOLD),
    "turanist":   ((36, 66, 92), (92, 150, 196), (255, 255, 255), (200, 216, 230), GOLD),
    "socialist":  ((110, 8, 12), (196, 26, 26), (255, 232, 120), (226, 170, 40), GOLD),
    "economy":    ((84, 50, 18), (166, 108, 50), (255, 246, 226), (230, 206, 160), GOLD),
    "society":    ((54, 30, 92), (116, 76, 176), (255, 255, 255), (226, 214, 246), GOLD),
    "negative":   ((58, 20, 16), (120, 56, 44), (240, 228, 220), (200, 170, 160), ((150, 120, 90), (210, 190, 150))),
}

# --------------------------------------------------------------------------
# Focus icons: focus id -> (game-icons glyph, theme)
# --------------------------------------------------------------------------
FOCUS_ICONS = {
    # Foreign policy
    "TRX_peace_at_home": ("delapouite/peace-dove", "foreign"),
    "TRX_montreux_convention": ("lorc/anchor", "foreign"),
    "TRX_saadabad_pact": ("delapouite/scroll-quill", "foreign"),
    "TRX_balkan_entente": ("lorc/tied-scroll", "foreign"),
    "TRX_eastern_alliance": ("lorc/swords-emblem", "foreign"),
    "TRX_balkan_alliance": ("delapouite/ribbon-shield", "foreign"),
    "TRX_hatay_question": ("delapouite/tower-flag", "foreign"),
    "TRX_mosul_question": ("delapouite/oil-pump", "foreign"),
    "TRX_aegean_ambitions": ("delapouite/island", "foreign"),
    "TRX_national_pact": ("lorc/scroll-unfurled", "foreign"),
    "TRX_batum_question": ("delapouite/harbor-dock", "foreign"),
    "TRX_western_thrace": ("delapouite/village", "foreign"),
    "TRX_cyprus_question": ("delapouite/lighthouse", "foreign"),
    # Army
    "TRX_reform_the_army": ("lorc/battle-gear", "army"),
    "TRX_mehmetcik_spirit": ("skoll/bayonet", "army"),
    "TRX_kirikkale_arsenal": ("sbed/rifle", "army"),
    "TRX_janissary_guard": ("lorc/crescent-blade", "army"),
    "TRX_harbiye_academy": ("delapouite/graduate-cap", "army"),
    "TRX_straits_fortress_artillery": ("lorc/cannon", "army"),
    "TRX_mountain_commandos": ("caro-asercion/mountain-climbing", "army"),
    "TRX_akinci_raiders": ("delapouite/cavalry", "army"),
    "TRX_first_armored_brigade": ("cathelineau/great-war-tank", "army"),
    "TRX_defense_of_anatolia": ("delapouite/military-fort", "army"),
    "TRX_akinci_doctrine": ("lorc/crossed-sabres", "army"),
    "TRX_general_mobilization": ("delapouite/megaphone", "army"),
    "TRX_army_of_the_republic": ("delapouite/star-medal", "army"),
    # Air force
    "TRX_aeronautical_association": ("quoting/biplane", "air"),
    "TRX_nuri_demirag_works": ("delapouite/plane-wing", "air"),
    "TRX_kayseri_aircraft_factory": ("delapouite/factory", "air"),
    "TRX_sabiha_gokcen_academy": ("delapouite/plane-pilot", "air"),
    "TRX_fighter_command": ("delapouite/jet-fighter", "air"),
    "TRX_bomber_command": ("lord-berandas/bomber", "air"),
    "TRX_modern_air_force": ("skoll/airplane", "air"),
    # Navy
    "TRX_golcuk_shipyards": ("delapouite/ship-bow", "navy"),
    "TRX_refit_the_yavuz": ("cathelineau/battleship", "navy"),
    "TRX_black_sea_submarines": ("delapouite/submarine", "navy"),
    "TRX_coastal_fortifications": ("delapouite/watchtower", "navy"),
    "TRX_masters_of_the_straits": ("delapouite/suspension-bridge", "navy"),
    # Politics root
    "TRX_republic_at_the_crossroads": ("delapouite/crossroad", "politics"),
    "TRX_debate_the_future": ("delapouite/podium", "politics"),
    # Kemalist
    "TRX_kemalist_consolidation": ("lorc/arrow-cluster", "kemalist"),
    "TRX_arrow_republicanism": ("delapouite/greek-temple", "kemalist"),
    "TRX_arrow_nationalism": ("delapouite/star-flag", "kemalist"),
    "TRX_arrow_populism": ("delapouite/huts-village", "kemalist"),
    "TRX_arrow_statism": ("lorc/gears", "kemalist"),
    "TRX_arrow_laicism": ("lorc/scales", "kemalist"),
    "TRX_arrow_revolutionism": ("delapouite/torch", "kemalist"),
    "TRX_the_eternal_chief": ("lorc/laurel-crown", "kemalist"),
    "TRX_armed_neutrality": ("delapouite/shield-opposition", "kemalist"),
    "TRX_leader_of_the_near_east": ("lorc/globe", "kemalist"),
    # Democratic
    "TRX_multi_party_experiment": ("delapouite/public-speaker", "democratic"),
    "TRX_revive_the_free_party": ("lorc/freedom-dove", "democratic"),
    "TRX_free_elections": ("delapouite/vote", "democratic"),
    "TRX_democrat_party": ("delapouite/horse-head", "democratic"),
    "TRX_freedom_of_the_press": ("delapouite/newspaper", "democratic"),
    "TRX_align_with_the_west": ("lorc/compass", "democratic"),
    "TRX_balkan_partnership": ("delapouite/stone-bridge", "democratic"),
    "TRX_balkan_anatolian_federation": ("delapouite/european-flag", "democratic"),
    # Ottoman
    "TRX_invite_the_house_of_osman": ("delapouite/throne-king", "ottoman"),
    "TRX_restore_the_sultanate": ("delapouite/imperial-crown", "ottoman"),
    "TRX_reopen_the_sublime_porte": ("delapouite/medieval-gate", "ottoman"),
    "TRX_a_new_janissary_corps": ("lorc/dervish-swords", "ottoman"),
    "TRX_reclaim_rumelia": ("lorc/castle", "ottoman"),
    "TRX_reclaim_arabia": ("delapouite/camel", "ottoman"),
    "TRX_padishah_of_three_continents": ("lorc/world", "ottoman"),
    "TRX_kayser_i_rum": ("lorc/eagle-emblem", "ottoman"),
    # Turanist
    "TRX_turanist_awakening": ("lorc/wolf-howl", "turanist"),
    "TRX_the_grey_wolves": ("lorc/wolf-head", "turanist"),
    "TRX_atsiz_takes_power": ("lorc/quill-ink", "turanist"),
    "TRX_claims_on_the_caucasus": ("lorc/mountains", "turanist"),
    "TRX_turkic_brothers_of_the_east": ("caro-asercion/cloaked-figure-on-horseback", "turanist"),
    "TRX_seek_axis_partnership": ("skoll/fist", "turanist"),
    "TRX_road_to_turan": ("delapouite/horizon-road", "turanist"),
    "TRX_kizil_elma": ("lorc/shiny-apple", "turanist"),
    # Socialist
    "TRX_legalize_the_tkp": ("delapouite/hammer-sickle", "socialist"),
    "TRX_village_soviets": ("lorc/wheat", "socialist"),
    "TRX_red_crescent_revolution": ("lorc/fist", "socialist"),
    "TRX_friendship_with_moscow": ("delapouite/round-star", "socialist"),
    "TRX_independent_socialism": ("skoll/breaking-chain", "socialist"),
    "TRX_spread_the_revolution": ("carl-olsen/flame", "socialist"),
    "TRX_near_eastern_federation": ("delapouite/sunrise", "socialist"),
    # Economy
    "TRX_first_five_year_plan": ("delapouite/pencil-ruler", "economy"),
    "TRX_sumerbank": ("delapouite/bank", "economy"),
    "TRX_etibank": ("delapouite/miner", "economy"),
    "TRX_nationalize_the_railways": ("delapouite/steam-locomotive", "economy"),
    "TRX_karabuk_steel_works": ("lorc/anvil", "economy"),
    "TRX_statism": ("delapouite/factory", "economy"),
    "TRX_liberal_market": ("delapouite/coins-pile", "economy"),
    "TRX_eastern_railways": ("delapouite/railway", "economy"),
    "TRX_second_five_year_plan": ("lorc/gear-hammer", "economy"),
    "TRX_raman_oil_fields": ("delapouite/oil-rig", "economy"),
    "TRX_harness_the_euphrates": ("delapouite/dam", "economy"),
    "TRX_synthetic_fuel_program": ("delapouite/barrel", "economy"),
    "TRX_industrial_heartland": ("delapouite/factory-arm", "economy"),
    # Society and science
    "TRX_village_institutes": ("delapouite/teacher", "society"),
    "TRX_language_revolution": ("lorc/book-cover", "society"),
    "TRX_university_reform": ("lord-berandas/microscope", "society"),
    "TRX_eastern_development_plan": ("delapouite/mountain-road", "society"),
    "TRX_scientific_republic": ("delapouite/atom-core", "society"),
    "TRX_national_unity": ("lorc/laurels", "society"),
    "TRX_peoples_houses": ("delapouite/house", "society"),
}

# National spirit sprite (GFX_idea_<key>) -> (glyph, theme)
IDEA_ICONS = {
    "TRX_eastern_question": ("lorc/broken-shield", "negative"),
    "TRX_eastern_reconciliation": ("lorc/dove", "society"),
    "TRX_eastern_pacification": ("delapouite/military-fort", "army"),
    "TRX_straits_sovereignty": ("lorc/anchor", "navy"),
    "TRX_masters_of_the_straits_idea": ("delapouite/suspension-bridge", "navy"),
    "TRX_six_arrows": ("lorc/arrow-cluster", "kemalist"),
    "TRX_kemalist_state": ("lorc/laurel-crown", "kemalist"),
    "TRX_multi_party_democracy": ("delapouite/vote", "democratic"),
    "TRX_balkan_partnership_idea": ("delapouite/stone-bridge", "democratic"),
    "TRX_sublime_porte": ("delapouite/medieval-gate", "ottoman"),
    "TRX_ottoman_revival": ("delapouite/imperial-crown", "ottoman"),
    "TRX_grey_wolves": ("lorc/wolf-head", "turanist"),
    "TRX_kizil_elma_idea": ("lorc/shiny-apple", "turanist"),
    "TRX_village_soviets_idea": ("lorc/wheat", "socialist"),
    "TRX_red_crescent": ("lorc/fist", "socialist"),
    "TRX_reformed_army": ("lorc/battle-gear", "army"),
    "TRX_mehmetcik_spirit_idea": ("skoll/bayonet", "army"),
    "TRX_defense_of_anatolia_idea": ("delapouite/military-fort", "army"),
    "TRX_akinci_doctrine_idea": ("delapouite/cavalry", "army"),
    "TRX_general_mobilization_idea": ("delapouite/megaphone", "army"),
    "TRX_army_of_the_republic_idea": ("delapouite/star-medal", "army"),
    "TRX_aeronautical_association_idea": ("quoting/biplane", "air"),
    "TRX_modern_air_force_idea": ("skoll/airplane", "air"),
    "TRX_statist_drive": ("delapouite/pencil-ruler", "economy"),
    "TRX_statism_idea": ("delapouite/factory", "economy"),
    "TRX_liberal_market_idea": ("delapouite/coins-pile", "economy"),
    "TRX_industrial_heartland_idea": ("delapouite/factory-arm", "economy"),
    "TRX_village_institutes_idea": ("delapouite/teacher", "society"),
    "TRX_scientific_republic_idea": ("delapouite/atom-core", "society"),
    "TRX_national_unity_idea": ("lorc/laurels", "society"),
    "TRX_spirit_misak_fulfilled": ("lorc/scroll-unfurled", "kemalist"),
    "TRX_spirit_ottoman_restored": ("delapouite/throne-king", "ottoman"),
    "TRX_spirit_kayser_i_rum": ("lorc/eagle-emblem", "ottoman"),
    "TRX_spirit_turan_unity": ("lorc/wolf-howl", "turanist"),
    "TRX_spirit_balkan_federation": ("delapouite/european-flag", "democratic"),
    "TRX_spirit_near_east_socialist": ("delapouite/sunrise", "socialist"),
}

# Decision category icons (GFX_decision_category_<key>)
CATEGORY_ICONS = {
    "TRX_straits": ("lorc/anchor", "navy"),
    "TRX_east": ("lorc/mountains", "society"),
    "TRX_procurement": ("sbed/rifle", "army"),
    "TRX_formables": ("delapouite/imperial-crown", "ottoman"),
    "TRX_irredentism": ("delapouite/tower-flag", "foreign"),
}

IDEOLOGIES = ["democratic", "fascism", "communism", "neutrality"]


# --------------------------------------------------------------------------
# File writers
# --------------------------------------------------------------------------
def write_dds(img, path):
    """Uncompressed A8R8G8B8 DDS, single mip level."""
    img = img.convert("RGBA")
    w, h = img.size
    r, g, b, a = img.split()
    data = Image.merge("RGBA", (b, g, r, a)).tobytes()  # stored as BGRA
    header = struct.pack(
        "<4s7I44s8I5I",
        b"DDS ",
        124,                            # dwSize
        0x1 | 0x2 | 0x4 | 0x8 | 0x1000,  # CAPS | HEIGHT | WIDTH | PITCH | PIXELFORMAT
        h, w,
        w * 4,                          # pitch
        0, 0,                           # depth, mipmap count
        b"\0" * 44,                     # reserved
        32, 0x41, 0,                    # pixel format: size, ALPHAPIXELS|RGB, fourCC
        32, 0x00FF0000, 0x0000FF00, 0x000000FF, 0xFF000000,
        0x1000, 0, 0, 0, 0,             # caps (TEXTURE), caps2-4, reserved2
    )
    os.makedirs(os.path.dirname(path), exist_ok=True)
    with open(path, "wb") as f:
        f.write(header)
        f.write(data)


def write_tga(img, path):
    """Uncompressed 32-bit TGA, bottom-left origin (HOI4 flag format)."""
    img = img.convert("RGBA")
    w, h = img.size
    r, g, b, a = img.split()
    data = Image.merge("RGBA", (b, g, r, a)).transpose(Image.FLIP_TOP_BOTTOM).tobytes()
    header = struct.pack("<BBBHHBHHHHBB", 0, 0, 2, 0, 0, 0, 0, 0, w, h, 32, 0x08)
    os.makedirs(os.path.dirname(path), exist_ok=True)
    with open(path, "wb") as f:
        f.write(header)
        f.write(data)


# --------------------------------------------------------------------------
# Drawing helpers
# --------------------------------------------------------------------------
_glyph_cache = {}
USED_GLYPHS = set()


def glyph_mask(icons_dir, name, size):
    """Render a game-icons SVG as an alpha mask of the given square size."""
    key = (name, size)
    if key in _glyph_cache:
        return _glyph_cache[key]
    path = os.path.join(icons_dir, name + ".svg")
    svg = open(path, encoding="utf-8").read()
    svg = re.sub(r'<path d="M0 0h512v512H0z"\s*/>', "", svg)
    svg = svg.replace('fill="#fff"', 'fill="#ffffff"')
    png = cairosvg.svg2png(bytestring=svg.encode("utf-8"), output_width=size, output_height=size)
    mask = Image.open(io.BytesIO(png)).convert("RGBA").split()[3]
    _glyph_cache[key] = mask
    USED_GLYPHS.add(name)
    return mask


def vertical_gradient(size, top, bottom):
    w, h = size
    grad = Image.new("RGBA", (1, h))
    for y in range(h):
        t = y / max(1, h - 1)
        grad.putpixel((0, y), tuple(int(top[i] + (bottom[i] - top[i]) * t) for i in range(3)) + (255,))
    return grad.resize((w, h))


def radial_gradient(size, inner, outer, center=(0.42, 0.38)):
    w, h = size
    cx, cy = center[0] * w, center[1] * h
    maxd = math.hypot(max(cx, w - cx), max(cy, h - cy))
    yy, xx = np.mgrid[0:h, 0:w]
    t = np.clip(np.hypot(xx - cx, yy - cy) / maxd, 0, 1) ** 1.2
    inner = np.array(inner, dtype=np.float32)
    outer = np.array(outer, dtype=np.float32)
    rgb = inner + (outer - inner) * t[..., None]
    alpha = np.full((h, w, 1), 255, dtype=np.float32)
    return Image.fromarray(np.concatenate([rgb, alpha], axis=2).astype(np.uint8), "RGBA")


def shape_mask(size, kind, box, radius=0):
    m = Image.new("L", size, 0)
    d = ImageDraw.Draw(m)
    if kind == "ellipse":
        d.ellipse(box, fill=255)
    else:
        d.rounded_rectangle(box, radius=radius, fill=255)
    return m


def paste_glyph(canvas, icons_dir, glyph, theme, gsize, center):
    """Glyph with a soft drop shadow and a vertical colour gradient."""
    dark, light, gtop, gbot, rim = THEMES[theme]
    mask = glyph_mask(icons_dir, glyph, gsize)
    x = int(center[0] - gsize / 2)
    y = int(center[1] - gsize / 2)
    shadow = Image.new("RGBA", canvas.size, (0, 0, 0, 0))
    sh = Image.new("RGBA", (gsize, gsize), (0, 0, 0, 200))
    shadow.paste(sh, (x + 2 * SS, y + 3 * SS), mask)
    shadow = shadow.filter(ImageFilter.GaussianBlur(2 * SS))
    canvas.alpha_composite(shadow)
    outline = Image.new("RGBA", canvas.size, (0, 0, 0, 0))
    ol = Image.new("RGBA", (gsize, gsize), tuple(int(c * 0.45) for c in dark) + (255,))
    grown = mask.filter(ImageFilter.MaxFilter(2 * SS + 1))
    outline.paste(ol, (x, y), grown)
    canvas.alpha_composite(outline)
    fill = vertical_gradient((gsize, gsize), gtop, gbot)
    layer = Image.new("RGBA", canvas.size, (0, 0, 0, 0))
    layer.paste(fill, (x, y), mask)
    canvas.alpha_composite(layer)


def medallion(size, theme, inset):
    """Round badge: shadow, gold rim, radial-gradient body, inner ring."""
    w, h = size
    dark, light, gtop, gbot, rim = THEMES[theme]
    canvas = Image.new("RGBA", size, (0, 0, 0, 0))
    l, t, r, b = inset, inset, w - inset, h - inset
    # drop shadow
    shadow = Image.new("RGBA", size, (0, 0, 0, 0))
    shadow.paste(Image.new("RGBA", size, (0, 0, 0, 170)), (0, 0),
                 shape_mask(size, "ellipse", (l + 2 * SS, t + 4 * SS, r + 2 * SS, b + 4 * SS)))
    canvas.alpha_composite(shadow.filter(ImageFilter.GaussianBlur(3 * SS)))
    # rim
    rim_img = vertical_gradient(size, rim[1], rim[0])
    canvas.paste(rim_img, (0, 0), shape_mask(size, "ellipse", (l, t, r, b)))
    # body
    rw = 3 * SS
    body = radial_gradient(size, light, dark)
    canvas.paste(body, (0, 0), shape_mask(size, "ellipse", (l + rw, t + rw, r - rw, b - rw)))
    # inner hairline ring
    ring = Image.new("RGBA", size, (0, 0, 0, 0))
    d = ImageDraw.Draw(ring)
    d.ellipse((l + rw + 2 * SS, t + rw + 2 * SS, r - rw - 2 * SS, b - rw - 2 * SS),
              outline=rim[1] + (110,), width=SS)
    canvas.alpha_composite(ring)
    # glossy highlight
    gloss = Image.new("RGBA", size, (0, 0, 0, 0))
    gd = ImageDraw.Draw(gloss)
    gd.ellipse((l + rw * 3, t + rw * 2, r - rw * 3, t + (b - t) * 0.55), fill=(255, 255, 255, 34))
    canvas.alpha_composite(gloss.filter(ImageFilter.GaussianBlur(4 * SS)))
    return canvas


def plaque(size, theme, radius):
    """Rounded-rectangle panel used for spirit and category icons."""
    w, h = size
    dark, light, gtop, gbot, rim = THEMES[theme]
    canvas = Image.new("RGBA", size, (0, 0, 0, 0))
    rim_img = vertical_gradient(size, rim[1], rim[0])
    canvas.paste(rim_img, (0, 0), shape_mask(size, "rect", (0, 0, w - 1, h - 1), radius))
    rw = 2 * SS
    body = radial_gradient(size, light, dark, center=(0.5, 0.3))
    canvas.paste(body, (0, 0), shape_mask(size, "rect", (rw, rw, w - 1 - rw, h - 1 - rw), max(1, radius - rw)))
    return canvas


def finish(img, final_size):
    return img.resize(final_size, Image.LANCZOS)


# --------------------------------------------------------------------------
# Builders
# --------------------------------------------------------------------------
def build_focus_icon(icons_dir, glyph, theme):
    W, H = 100 * SS, 88 * SS
    canvas = medallion((W, H), theme, inset=6 * SS)
    paste_glyph(canvas, icons_dir, glyph, theme, 50 * SS, (W / 2, H / 2))
    return finish(canvas, (100, 88))


def build_idea_icon(icons_dir, glyph, theme):
    W, H = 60 * SS, 68 * SS
    canvas = Image.new("RGBA", (W, H), (0, 0, 0, 0))
    canvas.alpha_composite(plaque((W - 4 * SS, H - 4 * SS), theme, 8 * SS), (2 * SS, 2 * SS))
    paste_glyph(canvas, icons_dir, glyph, theme, 40 * SS, (W / 2, H / 2))
    return finish(canvas, (60, 68))


def build_category_icon(icons_dir, glyph, theme):
    W, H = 52 * SS, 40 * SS
    canvas = Image.new("RGBA", (W, H), (0, 0, 0, 0))
    canvas.alpha_composite(plaque((W - 4 * SS, H - 4 * SS), theme, 7 * SS), (2 * SS, 2 * SS))
    paste_glyph(canvas, icons_dir, glyph, theme, 28 * SS, (W / 2, H / 2))
    return finish(canvas, (52, 40))


def nato_symbol(draw, box, kind, color, width):
    l, t, r, b = box
    draw.rectangle(box, outline=color, width=width)
    if kind == "cavalry":
        draw.line((l, b, r, t), fill=color, width=width)
    elif kind == "artillery":
        cx, cy = (l + r) / 2, (t + b) / 2
        rr = (b - t) * 0.18
        draw.ellipse((cx - rr, cy - rr, cx + rr, cy + rr), fill=color)
        # fortress battlements along the top edge
        step = (r - l) / 6
        for i in range(1, 6, 2):
            draw.rectangle((l + step * i, t - width * 2, l + step * (i + 1), t), fill=color)


def build_counter(kind, large):
    """Two-frame sub-unit counter in a NATO-symbol style."""
    if large:
        fw, fh = 76, 42
    else:
        fw, fh = 30, 12
    W, H = fw * 2 * SS, fh * SS
    canvas = Image.new("RGBA", (W, H), (0, 0, 0, 0))
    d = ImageDraw.Draw(canvas)
    for frame in range(2):
        ox = frame * fw * SS
        if large:
            d.rounded_rectangle((ox + 2 * SS, 2 * SS, ox + (fw - 2) * SS, (fh - 2) * SS),
                                radius=4 * SS, fill=(44, 50, 40, 235),
                                outline=(214, 170, 74, 255) if frame else (120, 128, 110, 255), width=SS)
            box = (ox + 22 * SS, 10 * SS, ox + 54 * SS, 32 * SS)
            nato_symbol(d, box, kind, (238, 238, 228, 255), 2 * SS)
        else:
            box = (ox + 7 * SS, 1 * SS, ox + 23 * SS, 11 * SS)
            col = (255, 255, 255, 255) if frame == 0 else (255, 220, 120, 255)
            nato_symbol(d, box, kind, col, SS)
    return canvas.resize((fw * 2, fh), Image.LANCZOS)


# ---- flags ---------------------------------------------------------------
def star_points(cx, cy, r_out, r_in, n, rot=-math.pi / 2):
    pts = []
    for i in range(n * 2):
        r = r_out if i % 2 == 0 else r_in
        a = rot + i * math.pi / n
        pts.append((cx + r * math.cos(a), cy + r * math.sin(a)))
    return pts


def crescent_and_star(d, W, H, color, cx_frac=0.40, scale=1.0, star_n=5, bg=None):
    G = H
    cx, cy = W * cx_frac, H / 2
    ro = 0.25 * G * scale
    ri = 0.20 * G * scale
    off = 0.0625 * G * scale
    d.ellipse((cx - ro, cy - ro, cx + ro, cy + ro), fill=color)
    d.ellipse((cx + off - ri, cy - ri, cx + off + ri, cy + ri), fill=bg)
    sx = cx + off + ri + 0.03 * G * scale + 0.125 * G * scale * 0.55
    rs = 0.125 * G * scale
    d.polygon(star_points(sx, cy, rs, rs * 0.40, star_n, rot=math.pi), fill=color)


def build_flag(tag):
    W, H = 820, 520
    img = Image.new("RGBA", (W, H))
    d = ImageDraw.Draw(img)
    if tag == "TRX_MISAK":
        red = (227, 10, 23, 255)
        d.rectangle((0, 0, W, H), fill=red)
        crescent_and_star(d, W, H, (255, 255, 255, 255), bg=red)
        d.rectangle((0, 0, W - 1, H - 1), outline=(240, 196, 64, 255), width=22)
    elif tag == "TRX_OTTOMAN":
        red = (190, 16, 36, 255)
        d.rectangle((0, 0, W, H), fill=red)
        crescent_and_star(d, W, H, (255, 255, 255, 255), cx_frac=0.45, scale=1.05, star_n=8, bg=red)
    elif tag == "TRX_KAYSER_I_RUM":
        purple = (88, 36, 120, 255)
        gold = (236, 190, 70, 255)
        d.rectangle((0, 0, W, H), fill=purple)
        crescent_and_star(d, W, H, gold, cx_frac=0.42, bg=purple)
        d.rectangle((0, 0, W - 1, H - 1), outline=gold, width=26)
        d.rectangle((40, 40, W - 41, H - 41), outline=gold, width=6)
    elif tag == "TRX_TURAN":
        blue = (64, 162, 222, 255)
        d.rectangle((0, 0, W, H), fill=blue)
        crescent_and_star(d, W, H, (255, 255, 255, 255), cx_frac=0.42, bg=blue)
        d.rectangle((0, 0, W, 46), fill=(240, 196, 64, 255))
        d.rectangle((0, H - 46, W, H), fill=(240, 196, 64, 255))
    elif tag == "TRX_BALKAN_FED":
        blue = (30, 72, 150, 255)
        d.rectangle((0, 0, W, H), fill=blue)
        cx, cy, rr = W / 2, H / 2, H * 0.32
        for i in range(5):
            a = -math.pi / 2 + i * 2 * math.pi / 5
            d.polygon(star_points(cx + rr * math.cos(a), cy + rr * math.sin(a), 34, 14, 5), fill=(248, 210, 80, 255))
        ro, ri, off = H * 0.15, H * 0.12, H * 0.04
        d.ellipse((cx - ro, cy - ro, cx + ro, cy + ro), fill=(255, 255, 255, 255))
        d.ellipse((cx + off - ri, cy - ri, cx + off + ri, cy + ri), fill=blue)
    elif tag == "TRX_NESF":
        red = (176, 18, 30, 255)
        gold = (248, 206, 70, 255)
        d.rectangle((0, 0, W, H), fill=red)
        crescent_and_star(d, W, H, gold, cx_frac=0.45, bg=red)
        d.polygon(star_points(110, 100, 60, 24, 5), fill=gold)
        d.rectangle((0, H - 60, W, H), fill=gold)
    return img


def build_thumbnail(icons_dir, font_path):
    W = H = 512
    img = Image.new("RGBA", (W, H), (150, 12, 24, 255))
    bg = radial_gradient((W, H), (214, 32, 40), (96, 8, 14), center=(0.5, 0.42))
    img.paste(bg, (0, 0))
    d = ImageDraw.Draw(img)
    crescent_and_star(d, W, int(H * 0.75), (255, 255, 255, 255), cx_frac=0.44, scale=1.0, bg=None)
    # repaint crescent inner circle with the local background colour
    img2 = Image.new("RGBA", (W, H))
    img2.paste(bg, (0, 0))
    G = int(H * 0.75)
    cx, cy = W * 0.44, G / 2
    ro, ri, off = 0.25 * G, 0.20 * G, 0.0625 * G
    m = Image.new("L", (W, H), 0)
    ImageDraw.Draw(m).ellipse((cx + off - ri, cy - ri, cx + off + ri, cy + ri), fill=255)
    img.paste(img2, (0, 0), m)
    sx = cx + off + ri + 0.03 * G + 0.125 * G * 0.55
    rs = 0.125 * G
    ImageDraw.Draw(img).polygon(star_points(sx, cy, rs, rs * 0.4, 5, rot=math.pi), fill=(255, 255, 255, 255))
    # title
    big = ImageFont.truetype(font_path, 54)
    small = ImageFont.truetype(font_path, 30)
    d = ImageDraw.Draw(img)
    d.rectangle((0, 380, W, 512), fill=(20, 12, 10, 200))
    d.line((0, 380, W, 380), fill=(236, 190, 70, 255), width=4)
    for text, font, y in (("ANATOLIAN", big, 392), ("ASCENDANCY", big, 446)):
        tw = d.textlength(text, font=font)
        d.text(((W - tw) / 2, y), text, font=font, fill=(244, 214, 120, 255))
    sub = "Turkey Expanded"
    tw = d.textlength(sub, font=small)
    d.text(((W - tw) / 2, 330), sub, font=small, fill=(255, 255, 255, 230))
    return img.convert("RGB")


# --------------------------------------------------------------------------
# GFX definition writers
# --------------------------------------------------------------------------
SHINE = """\tspriteType = {{
\t\tname = "{name}_shine"
\t\ttexturefile = "{tex}"
\t\teffectFile = "gfx/FX/buttonstate.lua"
\t\tanimation = {{
\t\t\tanimationmaskfile = "{tex}"
\t\t\tanimationtexturefile = "gfx/interface/goals/shine_overlay.dds"
\t\t\tanimationrotation = -90.0
\t\t\tanimationlooping = no
\t\t\tanimationtime = 0.75
\t\t\tanimationdelay = 0
\t\t\tanimationblendmode = "add"
\t\t\tanimationtype = "scrolling"
\t\t\tanimationrotationoffset = {{ x = 0.0 y = 0.0 }}
\t\t\tanimationtexturescale = {{ x = 1.0 y = 1.0 }}
\t\t}}
\t\tanimation = {{
\t\t\tanimationmaskfile = "{tex}"
\t\t\tanimationtexturefile = "gfx/interface/goals/shine_overlay.dds"
\t\t\tanimationrotation = 90.0
\t\t\tanimationlooping = no
\t\t\tanimationtime = 0.75
\t\t\tanimationdelay = 0
\t\t\tanimationblendmode = "add"
\t\t\tanimationtype = "scrolling"
\t\t\tanimationrotationoffset = {{ x = 0.0 y = 0.0 }}
\t\t\tanimationtexturescale = {{ x = 1.0 y = 1.0 }}
\t\t}}
\t\tlegacy_lazy_load = no
\t}}
"""

HEADER = "# Generated by mods/tools/build_assets.py - do not edit by hand.\n"


def write_text(path, text):
    os.makedirs(os.path.dirname(path), exist_ok=True)
    with open(path, "w", encoding="utf-8", newline="\n") as f:
        f.write(text)


def main():
    ap = argparse.ArgumentParser(description=__doc__, formatter_class=argparse.RawDescriptionHelpFormatter)
    ap.add_argument("--icons", required=True, help="path to a game-icons/icons checkout")
    ap.add_argument("--mod", required=True, help="path to the mod folder")
    ap.add_argument("--font", default="/usr/share/fonts/truetype/dejavu/DejaVuSerif-Bold.ttf")
    args = ap.parse_args()
    mod = args.mod

    # Focus icons
    goals = [HEADER, "spriteTypes = {\n"]
    shines = [HEADER, "spriteTypes = {\n"]
    for fid, (glyph, theme) in sorted(FOCUS_ICONS.items()):
        tex = "gfx/interface/goals/trx/%s.dds" % fid
        write_dds(build_focus_icon(args.icons, glyph, theme), os.path.join(mod, tex))
        name = "GFX_focus_%s" % fid
        goals.append('\tspriteType = {\n\t\tname = "%s"\n\t\ttexturefile = "%s"\n\t}\n' % (name, tex))
        shines.append(SHINE.format(name=name, tex=tex))
    goals.append("}\n")
    shines.append("}\n")
    write_text(os.path.join(mod, "interface/TRX_goals.gfx"), "".join(goals))
    write_text(os.path.join(mod, "interface/TRX_goals_shine.gfx"), "".join(shines))

    # Spirit, category and unit sprites
    sprites = [HEADER, "spriteTypes = {\n"]
    for key, (glyph, theme) in sorted(IDEA_ICONS.items()):
        tex = "gfx/interface/ideas/trx/%s.dds" % key
        write_dds(build_idea_icon(args.icons, glyph, theme), os.path.join(mod, tex))
        sprites.append('\tspriteType = {\n\t\tname = "GFX_idea_%s"\n\t\ttexturefile = "%s"\n\t}\n' % (key, tex))
    for key, (glyph, theme) in sorted(CATEGORY_ICONS.items()):
        tex = "gfx/interface/decisions/trx/category_%s.dds" % key
        write_dds(build_category_icon(args.icons, glyph, theme), os.path.join(mod, tex))
        sprites.append('\tspriteType = {\n\t\tname = "GFX_decision_category_%s"\n\t\ttexturefile = "%s"\n\t}\n' % (key, tex))
    sprites.append("}\n")
    write_text(os.path.join(mod, "interface/TRX_sprites.gfx"), "".join(sprites))

    # Sub-unit counters. Infantry-type units reuse the vanilla infantry
    # counters; the cavalry and fortress artillery get their own symbols.
    units = [HEADER, "spriteTypes = {\n"]
    vanilla_large = "gfx/interface/counters/divisions_large/unit_infantry_icon.dds"
    vanilla_small = "gfx/interface/counters/divisions_small/onmap_unit_infantry_icon.dds"
    custom = {"trx_akinci_cavalry": "cavalry", "trx_straits_artillery": "artillery"}
    for kind_unit, kind in custom.items():
        write_dds(build_counter(kind, True),
                  os.path.join(mod, "gfx/interface/counters/divisions_large/%s_icon.dds" % kind_unit))
        write_dds(build_counter(kind, False),
                  os.path.join(mod, "gfx/interface/counters/divisions_small/onmap_%s_icon.dds" % kind_unit))
    for unit in ("trx_janissary_guard", "trx_mountain_commando", "trx_akinci_cavalry", "trx_straits_artillery"):
        if unit in custom:
            large = "gfx/interface/counters/divisions_large/%s_icon.dds" % unit
            small = "gfx/interface/counters/divisions_small/onmap_%s_icon.dds" % unit
        else:
            large, small = vanilla_large, vanilla_small
        units.append('\tspriteType = { name = "GFX_unit_%s_icon_medium" texturefile = "%s" noOfFrames = 2 }\n' % (unit, large))
        units.append('\tspriteType = { name = "GFX_unit_%s_icon_medium_white" texturefile = "%s" noOfFrames = 2 }\n' % (unit, small))
        units.append('\tspriteType = { name = "GFX_unit_%s_icon_small" texturefile = "%s" noOfFrames = 2 legacy_lazy_load = no }\n' % (unit, small))
    units.append("}\n")
    write_text(os.path.join(mod, "interface/TRX_units.gfx"), "".join(units))

    # Flags for the formable nations (cosmetic tags)
    for tag in ("TRX_MISAK", "TRX_OTTOMAN", "TRX_KAYSER_I_RUM", "TRX_TURAN", "TRX_BALKAN_FED", "TRX_NESF"):
        big = build_flag(tag)
        for suffix in [""] + ["_" + i for i in IDEOLOGIES]:
            name = tag + suffix + ".tga"
            write_tga(big.resize((82, 52), Image.LANCZOS), os.path.join(mod, "gfx/flags", name))
            write_tga(big.resize((41, 26), Image.LANCZOS), os.path.join(mod, "gfx/flags/medium", name))
            write_tga(big.resize((10, 7), Image.LANCZOS), os.path.join(mod, "gfx/flags/small", name))

    # Thumbnail
    build_thumbnail(args.icons, args.font).save(os.path.join(mod, "thumbnail.png"), optimize=True)

    # Attribution list for every glyph actually used
    authors = {}
    for g in sorted(USED_GLYPHS):
        a, n = g.split("/")
        authors.setdefault(a, []).append(n)
    lines = ["# Generated by mods/tools/build_assets.py\n",
             "Icons from game-icons.net (https://game-icons.net), licensed CC BY 3.0\n",
             "(https://creativecommons.org/licenses/by/3.0/). Recoloured and framed.\n\n"]
    for a in sorted(authors):
        lines.append("- %s: %s\n" % (a, ", ".join(authors[a])))
    write_text(os.path.join(mod, "gfx/ICON_CREDITS.txt"), "".join(lines))
    print("built %d focus icons, %d spirit icons, %d category icons, %d glyphs used"
          % (len(FOCUS_ICONS), len(IDEA_ICONS), len(CATEGORY_ICONS), len(USED_GLYPHS)))


if __name__ == "__main__":
    sys.exit(main())
