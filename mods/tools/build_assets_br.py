#!/usr/bin/env python3
"""
Borderlands Rising - asset builder.

Renders every image the mod ships - focus, spirit, decision category and
balance-of-power icons, the flags of its cosmetic tags, the Oppressed
Soldiers counter, the portraits and the thumbnail - and writes the
interface/*.gfx sprite definitions. Reuses the drawing and file helpers of
build_assets.py; the icon choices live in br_icons.py.

Each country has its own frame: Danzig round gold medallions, South Russia
heraldic shields, Azerbaijan medallions with a fire rim and Palanmir cyan
hexagons. Capstone focuses get a laurel wreath behind the glyph.

Glyphs come from the game-icons.net collection (CC BY 3.0), which is not
vendored here. The portraits are original vector drawings made by this
script; no photographs are used.

    git clone --depth 1 https://github.com/game-icons/icons.git game-icons
    pip install pillow cairosvg numpy
    python3 build_assets_br.py --icons game-icons --mod ../borderlands_rising
"""
import argparse
import io
import math
import os
import sys

import cairosvg
from PIL import Image, ImageDraw, ImageFilter, ImageFont

sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))
import build_assets as ba  # noqa: E402
import br_icons  # noqa: E402

SS = ba.SS

# --------------------------------------------------------------------------
# Themes: (dark, light, glyph_top, glyph_bottom, rim)
# --------------------------------------------------------------------------
GOLD = ((214, 170, 74), (255, 229, 150))
SILVER = ((140, 148, 160), (236, 240, 246))
FIRE = ((206, 72, 18), (255, 196, 84))
CYAN = ((18, 140, 172), (150, 244, 255))
RED_RIM = ((176, 22, 34), (244, 104, 104))

ba.THEMES.update({
    "dzg_question":   ((108, 12, 22), (196, 38, 50), (255, 255, 255), (236, 220, 220), GOLD),
    "dzg_berlin":     ((26, 26, 30), (92, 92, 100), (255, 255, 255), (214, 214, 222), GOLD),
    "dzg_warsaw":     ((148, 16, 40), (226, 80, 98), (255, 255, 255), (250, 230, 234), SILVER),
    "dzg_fascist":    ((60, 38, 22), (140, 92, 52), (255, 240, 214), (226, 196, 150), GOLD),
    "dzg_democratic": ((22, 46, 110), (64, 106, 200), (255, 255, 255), (214, 224, 250), GOLD),
    "dzg_nonaligned": ((28, 60, 58), (80, 132, 122), (255, 255, 255), (214, 236, 230), GOLD),
    "dzg_monarchist": ((52, 22, 82), (118, 70, 168), (255, 236, 160), (214, 168, 70), GOLD),
    "dzg_communist":  ((110, 8, 12), (196, 26, 26), (255, 232, 120), (226, 170, 40), GOLD),
    "azv_politics":   ((16, 16, 18), (72, 72, 78), (255, 232, 140), (214, 164, 60), GOLD),
    "azv_army":       ((38, 46, 28), (100, 112, 70), (255, 255, 255), (220, 224, 206), SILVER),
    "azv_navy":       ((12, 26, 60), (40, 76, 140), (255, 255, 255), (200, 212, 240), SILVER),
    "azv_air":        ((26, 58, 92), (76, 132, 186), (255, 255, 255), (210, 228, 245), SILVER),
    "azv_economy":    ((70, 44, 18), (150, 100, 48), (255, 246, 226), (230, 206, 160), GOLD),
    "azv_foreign":    ((20, 36, 92), (54, 86, 170), (255, 255, 255), (220, 226, 250), GOLD),
    "odl_president":  ((0, 88, 136), (0, 160, 214), (255, 255, 255), (214, 240, 250), FIRE),
    "odl_army":       ((0, 80, 50), (0, 148, 94), (255, 255, 255), (214, 240, 226), FIRE),
    "odl_oil":        ((24, 20, 18), (86, 72, 54), (255, 214, 120), (236, 150, 40), FIRE),
    "odl_foreign":    ((148, 16, 30), (226, 54, 66), (255, 255, 255), (250, 226, 226), FIRE),
    "odl_fire":       ((138, 30, 8), (240, 112, 22), (255, 246, 170), (255, 196, 60), FIRE),
    "plm_tech":       ((8, 16, 26), (30, 64, 86), (150, 244, 255), (40, 176, 214), CYAN),
    "plm_corporate":  ((24, 26, 32), (80, 84, 96), (255, 255, 255), (206, 212, 224), CYAN),
    "plm_research":   ((28, 20, 68), (80, 64, 162), (226, 220, 255), (154, 144, 240), CYAN),
    "plm_industry":   ((60, 36, 14), (150, 96, 40), (255, 238, 200), (236, 190, 110), CYAN),
    "plm_army":       ((22, 38, 28), (64, 100, 76), (206, 255, 226), (112, 212, 162), CYAN),
    "plm_foreign":    ((0, 78, 50), (0, 140, 90), (255, 214, 70), (240, 164, 20), CYAN),
    "krd":            ((16, 84, 40), (40, 150, 72), (255, 230, 80), (250, 180, 20), RED_RIM),
})

# Frame shape by key prefix.
FRAMES = {"DZG": "round", "AZV": "shield", "ODL": "round", "PLM": "hex", "KRD": "round"}

IDEOLOGIES = ba.IDEOLOGIES


# --------------------------------------------------------------------------
# Frames
# --------------------------------------------------------------------------
def frame_points(kind, box):
    """Outline of a non-round frame inside box, as a polygon."""
    l, t, r, b = box
    w, h = r - l, b - t
    cx = (l + r) / 2
    if kind == "hex":
        k = w * 0.24
        return [(l + k, t), (r - k, t), (r, t + h / 2), (r - k, b), (l + k, b), (l, t + h / 2)]
    # heraldic shield: flat top, straight sides, curved to a point
    right = [(r, t + h * 0.50)]
    for i in range(1, 25):
        s = i / 24
        x = (1 - s) ** 2 * r + 2 * (1 - s) * s * r + s ** 2 * cx
        y = (1 - s) ** 2 * (t + h * 0.50) + 2 * (1 - s) * s * (t + h * 0.88) + s ** 2 * b
        right.append((x, y))
    left = [(2 * cx - x, y) for x, y in reversed(right[:-1])]
    return [(l, t), (r, t)] + right + left


def frame_mask(size, kind, box):
    if kind == "round":
        return ba.shape_mask(size, "ellipse", box)
    m = Image.new("L", size, 0)
    ImageDraw.Draw(m).polygon(frame_points(kind, box), fill=255)
    return m


def badge(size, theme, kind, inset):
    """Framed badge: shadow, metal rim, radial body, hairline, gloss."""
    w, h = size
    dark, light, gtop, gbot, rim = ba.THEMES[theme]
    if kind == "shield":
        side = (w - h * 0.86) / 2
        outer = (side, inset, w - side, h - inset)
    else:
        outer = (inset, inset, w - inset, h - inset)
    canvas = Image.new("RGBA", size, (0, 0, 0, 0))
    sbox = (outer[0] + 2 * SS, outer[1] + 4 * SS, outer[2] + 2 * SS, outer[3] + 4 * SS)
    shadow = Image.new("RGBA", size, (0, 0, 0, 0))
    shadow.paste(Image.new("RGBA", size, (0, 0, 0, 170)), (0, 0), frame_mask(size, kind, sbox))
    canvas.alpha_composite(shadow.filter(ImageFilter.GaussianBlur(3 * SS)))
    canvas.paste(ba.vertical_gradient(size, rim[1], rim[0]), (0, 0), frame_mask(size, kind, outer))
    rw = 3 * SS
    inner = (outer[0] + rw, outer[1] + rw, outer[2] - rw, outer[3] - rw)
    canvas.paste(ba.radial_gradient(size, light, dark), (0, 0), frame_mask(size, kind, inner))
    # hairline just inside the rim
    hair_box = (inner[0] + 2 * SS, inner[1] + 2 * SS, inner[2] - 2 * SS, inner[3] - 2 * SS)
    ring = Image.new("RGBA", size, (0, 0, 0, 0))
    d = ImageDraw.Draw(ring)
    if kind == "round":
        d.ellipse(hair_box, outline=rim[1] + (110,), width=SS)
    else:
        pts = frame_points(kind, hair_box)
        d.line(pts + [pts[0]], fill=rim[1] + (110,), width=SS, joint="curve")
    canvas.alpha_composite(ring)
    if kind == "hex":
        canvas.alpha_composite(circuit_traces(size, inner, rim[1]))
    gloss = Image.new("RGBA", size, (0, 0, 0, 0))
    l, t, r, b = inner
    ImageDraw.Draw(gloss).ellipse((l + rw * 2, t + rw, r - rw * 2, t + (b - t) * 0.55), fill=(255, 255, 255, 30))
    gloss_mask = frame_mask(size, kind, inner)
    gloss_layer = Image.new("RGBA", size, (0, 0, 0, 0))
    gloss_layer.paste(gloss.filter(ImageFilter.GaussianBlur(4 * SS)), (0, 0), gloss_mask)
    canvas.alpha_composite(gloss_layer)
    return canvas, inner


def circuit_traces(size, box, color):
    """Faint circuit-board lines for the Palanmir hexagons."""
    layer = Image.new("RGBA", size, (0, 0, 0, 0))
    d = ImageDraw.Draw(layer)
    l, t, r, b = box
    w, h = r - l, b - t
    c = color + (46,)
    lw = max(1, SS)
    for fy, fx0, fx1, up in ((0.22, 0.30, 0.52, True), (0.80, 0.46, 0.72, False), (0.50, 0.06, 0.20, None),
                             (0.50, 0.80, 0.94, None)):
        y = t + h * fy
        x0, x1 = l + w * fx0, l + w * fx1
        d.line((x0, y, x1, y), fill=c, width=lw)
        if up is not None:
            dy = -h * 0.10 if up else h * 0.10
            d.line((x1, y, x1 + w * 0.06, y + dy), fill=c, width=lw)
            rr = 1.6 * SS
            d.ellipse((x1 + w * 0.06 - rr, y + dy - rr, x1 + w * 0.06 + rr, y + dy + rr), outline=c, width=lw)
        rr = 1.6 * SS
        d.ellipse((x0 - rr, y - rr, x0 + rr, y + rr), outline=c, width=lw)
    mask = frame_mask(size, "hex", box)
    out = Image.new("RGBA", size, (0, 0, 0, 0))
    out.paste(layer, (0, 0), mask)
    return out


def laurel(canvas, icons_dir, theme, gsize, center):
    """Gold laurel wreath behind a capstone glyph."""
    rim = ba.THEMES[theme][4]
    mask = ba.glyph_mask(icons_dir, "lorc/laurels", gsize)
    x, y = int(center[0] - gsize / 2), int(center[1] - gsize / 2)
    fill = ba.vertical_gradient((gsize, gsize), rim[1], rim[0])
    a = mask.point(lambda v: int(v * 0.62))
    layer = Image.new("RGBA", canvas.size, (0, 0, 0, 0))
    layer.paste(fill, (x, y), a)
    canvas.alpha_composite(layer)


def build_focus_icon(icons_dir, glyph, theme, kind, capstone):
    W, H = 100 * SS, 88 * SS
    canvas, inner = badge((W, H), theme, kind, inset=6 * SS)
    if kind == "shield":
        center, gsize = (W / 2, H * 0.44), 42 * SS
    elif kind == "hex":
        center, gsize = (W / 2, H / 2), 46 * SS
    else:
        center, gsize = (W / 2, H / 2), 50 * SS
    if capstone:
        laurel(canvas, icons_dir, theme, int(gsize * 1.42), (center[0], center[1] + 2 * SS))
        gsize = int(gsize * 0.84)
    ba.paste_glyph(canvas, icons_dir, glyph, theme, gsize, center)
    return ba.finish(canvas, (100, 88))


# --------------------------------------------------------------------------
# Sub-unit counter: the Oppressed Soldiers (infantry with a broken chain)
# --------------------------------------------------------------------------
def build_oppressed_counter(icons_dir, large):
    fw, fh = (76, 42) if large else (30, 12)
    W, H = fw * 2 * SS, fh * SS
    canvas = Image.new("RGBA", (W, H), (0, 0, 0, 0))
    d = ImageDraw.Draw(canvas)
    for frame in range(2):
        ox = frame * fw * SS
        if large:
            d.rounded_rectangle((ox + 2 * SS, 2 * SS, ox + (fw - 2) * SS, (fh - 2) * SS), radius=4 * SS,
                                fill=(44, 50, 40, 235),
                                outline=(214, 170, 74, 255) if frame else (120, 128, 110, 255), width=SS)
            box = (ox + 14 * SS, 10 * SS, ox + 46 * SS, 32 * SS)
            col = (238, 238, 228, 255)
            d.rectangle(box, outline=col, width=2 * SS)
            d.line((box[0], box[1], box[2], box[3]), fill=col, width=2 * SS)
            d.line((box[0], box[3], box[2], box[1]), fill=col, width=2 * SS)
            g = 20 * SS
            mask = ba.glyph_mask(icons_dir, "skoll/breaking-chain", g)
            chain = Image.new("RGBA", (g, g), (236, 190, 70, 255))
            canvas.paste(chain, (ox + 50 * SS, 11 * SS), mask)
        else:
            box = (ox + 7 * SS, 1 * SS, ox + 23 * SS, 11 * SS)
            col = (255, 255, 255, 255) if frame == 0 else (255, 220, 120, 255)
            d.rectangle(box, outline=col, width=SS)
            d.line((box[0], box[1], box[2], box[3]), fill=col, width=SS)
            d.line((box[0], box[3], box[2], box[1]), fill=col, width=SS)
    return canvas.resize((fw * 2, fh), Image.LANCZOS)


# --------------------------------------------------------------------------
# Flags (820 x 520 master, scaled to 82x52, 41x26 and 10x7)
# --------------------------------------------------------------------------
FW, FH = 820, 520


def stamp(img, icons_dir, glyph, color, center, size):
    """A game-icons glyph in one solid colour."""
    size = int(size)
    mask = ba.glyph_mask(icons_dir, glyph, size)
    layer = Image.new("RGBA", (size, size), color)
    img.paste(layer, (int(center[0] - size / 2), int(center[1] - size / 2)), mask)


def cross_pattee(d, cx, cy, r, color):
    """The crosses of the Danzig arms."""
    a = r * 0.34
    for dx, dy in ((0, -1), (0, 1), (-1, 0), (1, 0)):
        if dx == 0:
            d.polygon([(cx - a * 0.6, cy), (cx + a * 0.6, cy), (cx + a * 1.25, cy + dy * r), (cx - a * 1.25, cy + dy * r)],
                      fill=color)
        else:
            d.polygon([(cx, cy - a * 0.6), (cx, cy + a * 0.6), (cx + dx * r, cy + a * 1.25), (cx + dx * r, cy - a * 1.25)],
                      fill=color)


def danzig_arms(img, icons_dir, cx, top, scale, cross_col=(255, 255, 255, 255), crown_col=(240, 196, 64, 255),
                star=False):
    d = ImageDraw.Draw(img)
    r = 58 * scale
    if star:
        d.polygon(ba.star_points(cx, top + 52 * scale, 50 * scale, 20 * scale, 5), fill=crown_col)
    else:
        stamp(img, icons_dir, "lorc/crown", crown_col, (cx, top + 50 * scale), 120 * scale)
    cross_pattee(d, cx, top + 170 * scale, r, cross_col)
    cross_pattee(d, cx, top + 310 * scale, r, cross_col)


def hbands(d, colors):
    n = len(colors)
    for i, c in enumerate(colors):
        d.rectangle((0, FH * i / n, FW, FH * (i + 1) / n), fill=c)


def build_flag(icons_dir, tag):
    img = Image.new("RGBA", (FW, FH))
    d = ImageDraw.Draw(img)
    red = (200, 16, 32, 255)
    white = (255, 255, 255, 255)
    black = (20, 20, 20, 255)
    gold = (240, 196, 64, 255)
    if tag == "DZG_HANSEATIC_REPUBLIC":
        d.rectangle((0, 0, FW, FH), fill=red)
        danzig_arms(img, icons_dir, 200, 40, 1.05)
    elif tag == "DZG_DANZIGER_REICH":
        d.rectangle((0, 0, FW, FH), fill=black)
        d.rectangle((40, 40, FW - 41, FH - 41), fill=red)
        danzig_arms(img, icons_dir, 230, 60, 0.95)
    elif tag == "DZG_DIRECTORATE":
        hbands(d, [red, white, red])
        stamp(img, icons_dir, "lorc/crown", gold, (FW / 2, FH / 2 - 10), 150)
    elif tag == "DZG_ROYAL_DANZIG":
        d.rectangle((0, 0, FW, FH), fill=white)
        d.rectangle((0, 0, FW, 60), fill=black)
        d.rectangle((0, FH - 60, FW, FH), fill=black)
        d.rectangle((0, 60, 300, FH - 60), fill=red)
        danzig_arms(img, icons_dir, 150, 70, 0.85)
        stamp(img, icons_dir, "lorc/eagle-emblem", black, (560, FH / 2), 300)
    elif tag == "DZG_KINGDOM_OF_PRUSSIA":
        d.rectangle((0, 0, FW, FH), fill=white)
        d.rectangle((0, 0, FW, 70), fill=black)
        d.rectangle((0, FH - 70, FW, FH), fill=black)
        stamp(img, icons_dir, "lorc/eagle-emblem", black, (FW / 2, FH / 2), 340)
        stamp(img, icons_dir, "lorc/crown", gold, (FW / 2, FH / 2 - 150), 90)
    elif tag == "DZG_BALTIC_SOVIET":
        d.rectangle((0, 0, FW, FH), fill=red)
        stamp(img, icons_dir, "delapouite/hammer-sickle", gold, (180, 170), 220)
        for i in range(3):
            y = 380 + i * 34
            pts = [(x, y + 12 * math.sin(x / 40.0)) for x in range(0, FW + 1, 10)]
            d.line(pts, fill=gold, width=12)
    elif tag == "DZG_FREE_SOVIET_CITY":
        d.rectangle((0, 0, FW, FH), fill=red)
        danzig_arms(img, icons_dir, 200, 40, 1.05, star=True)
    elif tag == "AZV_SOUTH_RUSSIA":
        hbands(d, [white, (0, 57, 166, 255), (213, 43, 30, 255)])
        # canton with St Andrew's saltire, clipped to the canton
        cw, ch = 330, int(FH * 2 / 3)
        canton = Image.new("RGBA", (cw, ch), white)
        cd = ImageDraw.Draw(canton)
        cd.line((0, 0, cw, ch), fill=(0, 57, 166, 255), width=56)
        cd.line((0, ch, cw, 0), fill=(0, 57, 166, 255), width=56)
        cd.rectangle((0, 0, cw - 1, ch - 1), outline=(0, 57, 166, 255), width=8)
        img.paste(canton, (0, 0))
    elif tag == "AZV_AZOV_UNITED":
        hbands(d, [black, (250, 200, 30, 255), white])
        d.rectangle((0, 0, FW, 18), fill=gold)
        stamp(img, icons_dir, "lorc/anchor", black, (FW / 2, FH / 2), 250)
        stamp(img, icons_dir, "lorc/crown", (250, 200, 30, 255), (FW / 2, 86), 120)
    elif tag == "ODL_ODLAR_YURDU":
        hbands(d, [(0, 181, 226, 255), (239, 51, 64, 255), (80, 158, 47, 255)])
        stamp(img, icons_dir, "carl-olsen/flame", gold, (FW / 2, FH / 2), 250)
    elif tag == "PLM_TECHNATE":
        hbands(d, [(253, 185, 19, 255), (0, 106, 68, 255), (193, 39, 45, 255)])
        cx, cy, rr = FW / 2, FH / 2, 150
        hexpts = [(cx + rr * math.cos(math.pi / 3 * i), cy + rr * math.sin(math.pi / 3 * i)) for i in range(6)]
        d.polygon(hexpts, fill=(16, 22, 30, 255), outline=(150, 244, 255, 255), width=12)
        stamp(img, icons_dir, "delapouite/all-seeing-eye", (150, 244, 255, 255), (cx, cy), 210)
    return img


# --------------------------------------------------------------------------
# Portraits (original vector drawings, 156 x 210 plus a 65 x 67 crop)
# --------------------------------------------------------------------------
SASH = """
  <g clip-path="url(#body)">
    <path d="M30,150 L132,212 L118,226 L16,164 Z" fill="#00b5e2"/>
    <path d="M27,158 L129,220 L122,229 L20,167 Z" fill="#ef3340"/>
    <path d="M24,166 L126,228 L118,236 L17,175 Z" fill="#509e2f"/>
    <circle cx="70" cy="183" r="5" fill="#f2c640" stroke="#a8811e" stroke-width="1"/>
  </g>"""

PORTRAIT_DEFS = """
  <defs>
    <radialGradient id="bg" cx="50%" cy="38%" r="78%">
      <stop offset="0" stop-color="{bg1}"/><stop offset="1" stop-color="{bg2}"/>
    </radialGradient>
    <radialGradient id="skin" cx="44%" cy="38%" r="70%">
      <stop offset="0" stop-color="#f7d6ba"/><stop offset="0.65" stop-color="#e9b691"/><stop offset="1" stop-color="#c88e6a"/>
    </radialGradient>
    <linearGradient id="suit" x1="0" y1="0" x2="0" y2="1">
      <stop offset="0" stop-color="{suit1}"/><stop offset="1" stop-color="{suit2}"/>
    </linearGradient>
    <radialGradient id="vig" cx="50%" cy="45%" r="75%">
      <stop offset="0.6" stop-color="#000" stop-opacity="0"/><stop offset="1" stop-color="#000" stop-opacity="0.55"/>
    </radialGradient>
    <clipPath id="body"><path d="{body}"/></clipPath>
  </defs>"""


def portrait_svg(kind):
    if kind == "baby":
        body = "M14,210 C18,170 44,150 78,150 C112,150 138,170 142,210 Z"
        head = """
  <ellipse cx="34" cy="100" rx="8" ry="10" fill="url(#skin)"/><ellipse cx="122" cy="100" rx="8" ry="10" fill="url(#skin)"/>
  <ellipse cx="78" cy="96" rx="45" ry="47" fill="url(#skin)"/>
  <path d="M74,52 C66,40 86,36 88,46 C90,54 80,57 77,51" stroke="#3b2a1d" stroke-width="3.2" fill="none" stroke-linecap="round"/>
  <ellipse cx="60" cy="98" rx="6.5" ry="7.5" fill="#2a1c12"/><ellipse cx="96" cy="98" rx="6.5" ry="7.5" fill="#2a1c12"/>
  <circle cx="62.5" cy="95.5" r="2.2" fill="#fff"/><circle cx="98.5" cy="95.5" r="2.2" fill="#fff"/>
  <path d="M53,86 Q60,82 67,86" stroke="#9c6c4c" stroke-width="1.6" fill="none"/><path d="M89,86 Q96,82 103,86" stroke="#9c6c4c" stroke-width="1.6" fill="none"/>
  <ellipse cx="78" cy="110" rx="4" ry="3" fill="#d79b78"/>
  <ellipse cx="50" cy="116" rx="9" ry="6" fill="#f08f86" opacity="0.45"/><ellipse cx="106" cy="116" rx="9" ry="6" fill="#f08f86" opacity="0.45"/>
  <path d="M66,122 Q78,133 90,122" stroke="#8e4a3c" stroke-width="2.6" fill="#c45f55" stroke-linecap="round"/>"""
        clothes = """
  <path d="{body}" fill="url(#suit)"/>
  <path d="M64,150 L78,176 L92,150 Z" fill="#f5f4f0"/>
  <path d="M70,156 L78,162 L86,156 L86,168 L78,162 L70,168 Z" fill="#c8102e"/>""".format(body=body)
        colors = dict(bg1="#7d8a96", bg2="#1d242c", suit1="#30384a", suit2="#161a24")
    elif kind == "toddler":
        body = "M10,210 C14,166 42,146 78,146 C114,146 142,166 146,210 Z"
        head = """
  <ellipse cx="37" cy="98" rx="7.5" ry="10" fill="url(#skin)"/><ellipse cx="119" cy="98" rx="7.5" ry="10" fill="url(#skin)"/>
  <ellipse cx="78" cy="94" rx="41" ry="45" fill="url(#skin)"/>
  <path d="M38,86 C38,56 58,46 78,46 C100,46 120,58 118,88 C112,72 100,64 88,62 C92,70 84,72 78,64 C72,72 62,70 64,62 C50,66 42,74 38,86 Z" fill="#33241a"/>
  <ellipse cx="62" cy="98" rx="5.5" ry="6.5" fill="#2a1c12"/><ellipse cx="94" cy="98" rx="5.5" ry="6.5" fill="#2a1c12"/>
  <circle cx="64" cy="96" r="1.9" fill="#fff"/><circle cx="96" cy="96" r="1.9" fill="#fff"/>
  <path d="M55,87 Q62,83 69,87" stroke="#5a3e2c" stroke-width="2" fill="none"/><path d="M87,87 Q94,83 101,87" stroke="#5a3e2c" stroke-width="2" fill="none"/>
  <path d="M75,104 Q78,112 81,104" stroke="#c98d6c" stroke-width="2" fill="none"/>
  <ellipse cx="52" cy="114" rx="8" ry="5" fill="#f08f86" opacity="0.4"/><ellipse cx="104" cy="114" rx="8" ry="5" fill="#f08f86" opacity="0.4"/>
  <path d="M64,119 Q78,134 92,119 Z" fill="#9b3f36"/><rect x="73" y="119" width="4" height="4" fill="#fff"/><rect x="79" y="119" width="4" height="4" fill="#fff"/>"""
        clothes = """
  <path d="{body}" fill="url(#suit)"/>
  <path d="M62,146 L78,176 L94,146 Z" fill="#f5f4f0"/>
  <path d="M76,152 L80,152 L83,180 L78,188 L73,180 Z" fill="#1f3f8a"/>""".format(body=body)
        colors = dict(bg1="#7a8693", bg2="#1b2229", suit1="#2c3446", suit2="#141822")
    elif kind == "boy":
        body = "M6,210 C10,164 40,142 78,142 C116,142 146,164 150,210 Z"
        head = """
  <rect x="68" y="118" width="20" height="26" rx="6" fill="#d9a07c"/>
  <ellipse cx="42" cy="94" rx="6.5" ry="10" fill="url(#skin)"/><ellipse cx="114" cy="94" rx="6.5" ry="10" fill="url(#skin)"/>
  <path d="M42,82 C42,54 58,42 78,42 C98,42 114,54 114,82 C114,110 100,128 78,128 C56,128 42,110 42,82 Z" fill="url(#skin)"/>
  <path d="M40,82 C38,50 60,36 80,36 C102,36 118,52 116,80 C110,62 96,56 84,56 C70,56 60,62 54,58 C50,68 44,74 40,82 Z" fill="#2c1f16"/>
  <path d="M84,56 C92,52 104,56 110,64" stroke="#1d140e" stroke-width="2" fill="none"/>
  <ellipse cx="63" cy="88" rx="4.5" ry="5" fill="#2a1c12"/><ellipse cx="93" cy="88" rx="4.5" ry="5" fill="#2a1c12"/>
  <circle cx="64.5" cy="86.5" r="1.5" fill="#fff"/><circle cx="94.5" cy="86.5" r="1.5" fill="#fff"/>
  <path d="M55,78 Q63,74 71,78" stroke="#3b2a1d" stroke-width="2.4" fill="none"/><path d="M85,78 Q93,74 101,78" stroke="#3b2a1d" stroke-width="2.4" fill="none"/>
  <path d="M78,90 L74,104 Q78,107 82,104" stroke="#b97f5f" stroke-width="2" fill="none"/>
  <path d="M67,113 Q78,120 89,113" stroke="#8e4a3c" stroke-width="2.4" fill="none" stroke-linecap="round"/>"""
        clothes = """
  <path d="{body}" fill="url(#suit)"/>
  <path d="M60,142 L78,178 L96,142 Z" fill="#f5f4f0"/>
  <path d="M75,148 L81,148 L84,182 L78,190 L72,182 Z" fill="#1f3f8a"/>""".format(body=body)
        colors = dict(bg1="#7c8994", bg2="#1a2027", suit1="#2a3242", suit2="#12161e")
    else:  # Teter Phiel
        body = "M0,210 C4,170 34,150 78,148 C122,150 152,170 156,210 Z"
        head = """
  <rect x="66" y="116" width="24" height="32" rx="8" fill="#e0aa86"/>
  <ellipse cx="44" cy="86" rx="6" ry="10" fill="url(#skin)"/><ellipse cx="112" cy="86" rx="6" ry="10" fill="url(#skin)"/>
  <path d="M44,74 C44,44 58,30 78,30 C98,30 112,44 112,74 C112,106 98,128 78,128 C58,128 44,106 44,74 Z" fill="url(#skin)"/>
  <path d="M44,70 C42,42 58,26 80,26 C100,26 114,40 112,68 C108,54 100,46 92,44 C84,42 72,42 64,46 C54,50 48,58 44,70 Z" fill="#8a6a4a"/>
  <path d="M64,46 C74,40 90,40 100,46" stroke="#6d523a" stroke-width="2" fill="none"/>
  <ellipse cx="64" cy="80" rx="4" ry="3.6" fill="#33424e"/><ellipse cx="92" cy="80" rx="4" ry="3.6" fill="#33424e"/>
  <circle cx="65" cy="79" r="1.2" fill="#fff"/><circle cx="93" cy="79" r="1.2" fill="#fff"/>
  <path d="M55,72 L72,71" stroke="#6d523a" stroke-width="2.6" stroke-linecap="round"/><path d="M84,71 L101,72" stroke="#6d523a" stroke-width="2.6" stroke-linecap="round"/>
  <path d="M78,82 L75,99 Q78,101 82,99" stroke="#b97f5f" stroke-width="2" fill="none"/>
  <path d="M68,110 L88,110" stroke="#8e5444" stroke-width="2.4" stroke-linecap="round"/>
  <path d="M52,92 Q56,112 70,120" stroke="#c88e6a" stroke-width="1.2" fill="none" opacity="0.6"/>"""
        clothes = """
  <path d="{body}" fill="url(#suit)"/>
  <path d="M58,148 L78,186 L98,148 L90,144 L78,166 L66,144 Z" fill="#f2f3f5"/>
  <path d="M58,148 L50,210 L40,210 L46,160 Z" fill="#20262f"/><path d="M98,148 L106,210 L116,210 L110,160 Z" fill="#20262f"/>
  <polygon points="118,172 124,168 130,172 130,180 124,184 118,180" fill="#0b141c" stroke="#96f4ff" stroke-width="1.2"/>
  <circle cx="124" cy="176" r="2.2" fill="#96f4ff"/>""".format(body=body)
        colors = dict(bg1="#3c4d5c", bg2="#0b1118", suit1="#3a4250", suit2="#191d25")
    defs = PORTRAIT_DEFS.format(body=body, **colors)
    extra = SASH if kind in ("baby", "toddler", "boy") else ""
    backdrop = ""
    if kind == "phiel":
        hexes = []
        for row in range(9):
            for col in range(7):
                cx = 12 + col * 24 + (12 if row % 2 else 0)
                cy = 10 + row * 21
                pts = " ".join("%.1f,%.1f" % (cx + 10 * math.cos(math.pi / 3 * i + math.pi / 6),
                                              cy + 10 * math.sin(math.pi / 3 * i + math.pi / 6)) for i in range(6))
                hexes.append('<polygon points="%s" fill="none" stroke="#96f4ff" stroke-width="0.6" opacity="0.18"/>' % pts)
        backdrop = "\n  ".join(hexes)
    else:
        backdrop = """<g opacity="0.22">
    <rect x="0" y="0" width="14" height="210" fill="#00b5e2"/><rect x="14" y="0" width="14" height="210" fill="#ef3340"/>
    <rect x="28" y="0" width="14" height="210" fill="#509e2f"/></g>"""
    return """<svg xmlns="http://www.w3.org/2000/svg" width="156" height="210" viewBox="0 0 156 210">{defs}
  <rect width="156" height="210" fill="url(#bg)"/>
  {backdrop}
  {clothes}
  {extra}
  {head}
  <rect width="156" height="210" fill="url(#vig)"/>
</svg>""".format(defs=defs, backdrop=backdrop, clothes=clothes, extra=extra, head=head)


def render_portrait(kind):
    svg = portrait_svg(kind)
    png = cairosvg.svg2png(bytestring=svg.encode("utf-8"), output_width=156 * SS, output_height=210 * SS)
    big = Image.open(io.BytesIO(png)).convert("RGBA")
    large = big.resize((156, 210), Image.LANCZOS)
    # small: head and shoulders, 65 x 67
    crop = big.crop((18 * SS, 20 * SS, 138 * SS, 144 * SS))
    small = crop.resize((65, 67), Image.LANCZOS)
    return large, small


PORTRAITS = {
    "GFX_portrait_ODL_baby_ilham": "baby",
    "GFX_portrait_ODL_toddler_ilham": "toddler",
    "GFX_portrait_ODL_boy_ilham": "boy",
    "GFX_portrait_PLM_teter_phiel": "phiel",
}


# --------------------------------------------------------------------------
# Thumbnail
# --------------------------------------------------------------------------
def build_thumbnail(icons_dir, font_path):
    W = H = 512
    img = ba.radial_gradient((W, H), (60, 52, 46), (14, 12, 12), center=(0.5, 0.40))
    medals = [
        ("delapouite/medieval-gate", "dzg_question", "round"),
        ("lorc/eagle-emblem", "azv_politics", "shield"),
        ("carl-olsen/flame", "odl_fire", "round"),
        ("delapouite/all-seeing-eye", "plm_tech", "hex"),
    ]
    positions = [(128, 120), (384, 120), (128, 290), (384, 290)]
    for (glyph, theme, kind), (cx, cy) in zip(medals, positions):
        icon = build_focus_icon(icons_dir, glyph, theme, kind, False).resize((200, 176), Image.LANCZOS)
        img.alpha_composite(icon, (cx - 100, cy - 88))
    d = ImageDraw.Draw(img)
    d.rectangle((0, 392, W, H), fill=(18, 12, 10, 235))
    d.line((0, 392, W, 392), fill=(236, 190, 70, 255), width=4)
    size = 50
    big = ImageFont.truetype(font_path, size)
    while d.textlength("BORDERLANDS RISING", font=big) > W - 28:
        size -= 1
        big = ImageFont.truetype(font_path, size)
    small = ImageFont.truetype(font_path, 19)
    while d.textlength("Danzig - Azov United - Odlar Yurdu - Palanmir", font=small) > W - 20:
        small = ImageFont.truetype(font_path, small.size - 1)
    for text, font, y, col in (("BORDERLANDS RISING", big, 402, (244, 214, 120, 255)),
                               ("Danzig - Azov United - Odlar Yurdu - Palanmir", small, 466, (255, 255, 255, 230))):
        tw = d.textlength(text, font=font)
        d.text(((W - tw) / 2, y), text, font=font, fill=col)
    return img.convert("RGB")


# --------------------------------------------------------------------------
# Main
# --------------------------------------------------------------------------
def sprite(name, tex, extra=""):
    return '\tspriteType = {\n\t\tname = "%s"\n\t\ttexturefile = "%s"%s\n\t}\n' % (name, tex, extra)


def main():
    ap = argparse.ArgumentParser(description=__doc__, formatter_class=argparse.RawDescriptionHelpFormatter)
    ap.add_argument("--icons", required=True, help="path to a game-icons/icons checkout")
    ap.add_argument("--mod", required=True, help="path to the mod folder")
    ap.add_argument("--font", default="/usr/share/fonts/truetype/dejavu/DejaVuSerif-Bold.ttf")
    args = ap.parse_args()
    mod, icons = args.mod, args.icons

    def frame_of(key):
        return FRAMES[key.split("_", 1)[0]]

    # Focus icons
    goals = [ba.HEADER, "spriteTypes = {\n"]
    shines = [ba.HEADER, "spriteTypes = {\n"]
    for fid, spec in sorted(br_icons.FOCUS.items()):
        glyph, theme = spec[0], spec[1]
        capstone = len(spec) > 2
        tex = "gfx/interface/goals/brs/%s.dds" % fid
        ba.write_dds(build_focus_icon(icons, glyph, theme, frame_of(fid), capstone), os.path.join(mod, tex))
        goals.append(sprite("GFX_focus_%s" % fid, tex))
        shines.append(ba.SHINE.format(name="GFX_focus_%s" % fid, tex=tex))
    goals.append("}\n")
    shines.append("}\n")
    ba.write_text(os.path.join(mod, "interface/BRS_goals.gfx"), "".join(goals))
    ba.write_text(os.path.join(mod, "interface/BRS_goals_shine.gfx"), "".join(shines))

    sprites = [ba.HEADER, "spriteTypes = {\n"]
    # Spirits and dynamic modifiers
    for key, (glyph, theme) in sorted(br_icons.IDEA.items()):
        tex = "gfx/interface/ideas/brs/%s.dds" % key
        ba.write_dds(ba.build_idea_icon(icons, glyph, theme), os.path.join(mod, tex))
        sprites.append(sprite("GFX_idea_%s" % key, tex))
    # Decision categories
    for key, (glyph, theme) in sorted(br_icons.CATEGORY.items()):
        tex = "gfx/interface/decisions/brs/category_%s.dds" % key
        ba.write_dds(ba.build_category_icon(icons, glyph, theme), os.path.join(mod, tex))
        sprites.append(sprite("GFX_decision_category_%s" % key, tex))
    # Balance of power sides
    for key, (glyph, theme) in sorted(br_icons.BOP.items()):
        tex = "gfx/interface/bop/brs/%s.dds" % key
        ba.write_dds(build_focus_icon(icons, glyph, theme, "round", False), os.path.join(mod, tex))
        sprites.append(sprite("GFX_bop_%s" % key, tex))
    # Portraits
    for name, kind in sorted(PORTRAITS.items()):
        large, small = render_portrait(kind)
        tex = "gfx/leaders/brs/%s.dds" % name[len("GFX_portrait_"):]
        tex_small = "gfx/leaders/brs/%s_small.dds" % name[len("GFX_portrait_"):]
        ba.write_dds(large, os.path.join(mod, tex))
        ba.write_dds(small, os.path.join(mod, tex_small))
        sprites.append(sprite(name, tex))
        sprites.append(sprite(name + "_small", tex_small))
    sprites.append("}\n")
    ba.write_text(os.path.join(mod, "interface/BRS_sprites.gfx"), "".join(sprites))

    # The Oppressed Soldiers counter
    unit = "dzg_oppressed_soldiers"
    large = "gfx/interface/counters/divisions_large/%s_icon.dds" % unit
    small = "gfx/interface/counters/divisions_small/onmap_%s_icon.dds" % unit
    ba.write_dds(build_oppressed_counter(icons, True), os.path.join(mod, large))
    ba.write_dds(build_oppressed_counter(icons, False), os.path.join(mod, small))
    units = [ba.HEADER, "spriteTypes = {\n",
             '\tspriteType = { name = "GFX_unit_%s_icon_medium" texturefile = "%s" noOfFrames = 2 }\n' % (unit, large),
             '\tspriteType = { name = "GFX_unit_%s_icon_medium_white" texturefile = "%s" noOfFrames = 2 }\n' % (unit, small),
             '\tspriteType = { name = "GFX_unit_%s_icon_small" texturefile = "%s" noOfFrames = 2 legacy_lazy_load = no }\n'
             % (unit, small),
             "}\n"]
    ba.write_text(os.path.join(mod, "interface/BRS_units.gfx"), "".join(units))

    # Flags of the cosmetic tags
    tags = ["DZG_HANSEATIC_REPUBLIC", "DZG_DANZIGER_REICH", "DZG_DIRECTORATE", "DZG_ROYAL_DANZIG",
            "DZG_KINGDOM_OF_PRUSSIA", "DZG_BALTIC_SOVIET", "DZG_FREE_SOVIET_CITY", "AZV_SOUTH_RUSSIA",
            "AZV_AZOV_UNITED", "ODL_ODLAR_YURDU", "PLM_TECHNATE"]
    for tag in tags:
        big = build_flag(icons, tag)
        for suffix in [""] + ["_" + i for i in IDEOLOGIES]:
            name = tag + suffix + ".tga"
            ba.write_tga(big.resize((82, 52), Image.LANCZOS), os.path.join(mod, "gfx/flags", name))
            ba.write_tga(big.resize((41, 26), Image.LANCZOS), os.path.join(mod, "gfx/flags/medium", name))
            ba.write_tga(big.resize((10, 7), Image.LANCZOS), os.path.join(mod, "gfx/flags/small", name))

    build_thumbnail(icons, args.font).save(os.path.join(mod, "thumbnail.png"), optimize=True)

    authors = {}
    for g in sorted(ba.USED_GLYPHS):
        a, n = g.split("/")
        authors.setdefault(a, []).append(n)
    lines = ["# Generated by mods/tools/build_assets_br.py\n",
             "Icons from game-icons.net (https://game-icons.net), licensed CC BY 3.0\n",
             "(https://creativecommons.org/licenses/by/3.0/). Recoloured and framed.\n",
             "The portraits are original drawings made by the build script.\n\n"]
    for a in sorted(authors):
        lines.append("- %s: %s\n" % (a, ", ".join(authors[a])))
    ba.write_text(os.path.join(mod, "gfx/ICON_CREDITS.txt"), "".join(lines))
    print("built %d focus, %d spirit, %d category, %d balance-of-power icons, %d portraits, %d flags; %d glyphs"
          % (len(br_icons.FOCUS), len(br_icons.IDEA), len(br_icons.CATEGORY), len(br_icons.BOP), len(PORTRAITS),
             len(tags), len(ba.USED_GLYPHS)))


if __name__ == "__main__":
    sys.exit(main())
