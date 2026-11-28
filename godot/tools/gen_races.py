"""Варіанти арту героя/героїні для рас: перефарбування шкіри/волосся + домальовані вуха, роги, борода, хвіст.
Запуск: python3 godot/tools/gen_races.py (із кореня репозиторію). Вихід: assets/art/races/<race>_<m|f>[_big].png"""
import os
import numpy as np
from PIL import Image, ImageDraw

ROOT = os.path.join(os.path.dirname(__file__), '..', 'assets', 'art')
OUT = os.path.join(ROOT, 'races')
os.makedirs(OUT, exist_ok=True)
OUTL = (42, 26, 20, 255)

# опорні точки на великих артах (339x600 / 336x600)
A = {
    'm': {'src': 'hero_big.png', 'earL': (118, 205), 'earR': (258, 200), 'mouth': (195, 236), 'chinY': 262,
          'catL': [(100, 98), (118, 8), (168, 62)], 'catR': [(208, 58), (258, 6), (272, 96)],
          'hornL': [(140, 70), (92, -2), (118, 78)], 'hornR': [(232, 64), (282, -4), (256, 82)],
          'hip': (262, 470), 'cheekL': (150, 228), 'cheekR': (242, 224), 'sword': (0, 120, 112, 300), 'faceTop': 142},
    'f': {'src': 'hero_f_big.png', 'earL': (150, 196), 'earR': (262, 192), 'mouth': (206, 226), 'chinY': 252,
          'catL': [(118, 92), (136, 14), (184, 58)], 'catR': [(222, 54), (268, 10), (282, 92)],
          'hornL': [(160, 66), (118, 0), (142, 78)], 'hornR': [(240, 62), (288, -2), (262, 80)],
          'hip': (262, 470), 'cheekL': (168, 220), 'cheekR': (250, 216), 'sword': (0, 120, 100, 280), 'faceTop': 120},
}
BASE_SKIN = np.array([245, 205, 172], float)

RACES = {
    'human': {},
    'elf': {'skin': (250, 222, 196), 'ears': 'elf'},
    'darkelf': {'skin': (168, 150, 196), 'hair': 'silver', 'ears': 'elf'},
    'dwarf': {'skin': (236, 180, 140), 'beard': True, 'cheeks': True},
    'orc': {'skin': (128, 176, 92), 'tusks': True, 'ears': 'small'},
    'neko': {'cat': True, 'tail': 'hair'},
    'halfling': {'skin': (246, 200, 160), 'cheeks': True, 'freckles': True},
    'dragonkin': {'skin': (222, 150, 120), 'horns': True, 'tail': 'dragon'},
    'goblin': {'skin': (140, 196, 80), 'ears': 'goblin', 'cheeks': False},
}


def masks(im):
    r, g, b, a = [im[..., i] for i in range(4)]
    mx = np.maximum(np.maximum(r, g), b)
    mn = np.minimum(np.minimum(r, g), b)
    sat = (mx - mn) / (mx + 1e-6)
    val = mx / 255
    skin = (a > 120) & (r - g > 25) & (g - b > 8) & (val > 0.72) & (sat > 0.1) & (sat < 0.52)
    hair = (a > 120) & (r > g) & (g >= b) & (val > 0.15) & (val < 0.75) & (sat > 0.35)
    H = im.shape[0]
    hair[int(H * 0.5):] = False
    return skin, hair


def recolor(im, mask, target):
    t = np.array(target, float)
    px = im[..., :3]
    lum = px.mean(axis=2) / BASE_SKIN.mean()
    new = np.clip(t[None, None, :] * lum[..., None], 0, 255)
    im[..., :3] = np.where(mask[..., None], new, px)


def poly(d, pts, fill, w=4):
    d.polygon(pts, fill=fill)
    d.line(pts + [pts[0]], fill=OUTL, width=w, joint='curve')


def mirror(pts, cx):
    return [(2 * cx - x, y) for x, y in pts]


def build(race, g):
    R = RACES[race]
    P = A[g]
    src = Image.open(os.path.join(ROOT, P['src'])).convert('RGBA')
    im = np.array(src).astype(float)
    skin, hair = masks(im)
    skin[:P['faceTop'], :] = False
    skin_col = tuple(int(c) for c in R.get('skin', BASE_SKIN))
    if 'skin' in R:
        recolor(im, skin, R['skin'])
    if R.get('hair') == 'silver':
        sx0, sy0, sx1, sy1 = P['sword']
        hm = hair.copy()
        v = im[..., :3].max(axis=2) / 255
        silver = np.stack([150 + 105 * v, 150 + 100 * v, 170 + 85 * v], axis=-1)
        im[..., :3] = np.where(hm[..., None], np.clip(silver, 0, 255), im[..., :3])
    hair_col = (232, 232, 245, 255) if R.get('hair') == 'silver' else (122, 70, 38, 255)
    body = Image.fromarray(im.astype('uint8'), 'RGBA')
    W, H = body.size
    back = Image.new('RGBA', (W + 80, H), (0, 0, 0, 0))
    db = ImageDraw.Draw(back)
    ox = 0
    # хвіст — позаду персонажа
    if R.get('tail'):
        hx, hy = P['hip']
        col = hair_col if R['tail'] == 'hair' else (178, 52, 44, 255)
        pts = [(hx - 20, hy), (hx + 30, hy - 10), (hx + 62, hy - 60), (hx + 70, hy - 120), (hx + 52, hy - 150)]
        db.line(pts, fill=OUTL, width=30, joint='curve')
        db.line(pts, fill=col, width=22, joint='curve')
        if R['tail'] == 'dragon':
            for i in range(1, 4):
                x, y = pts[i]
                poly(db, [(x - 6, y - 4), (x + 18, y - 16), (x + 6, y + 8)], (230, 120, 60, 255), 3)
    back.alpha_composite(body, (ox, 0))
    out = back
    d = ImageDraw.Draw(out)
    fill = skin_col + (255,)
    ex, ey = P['earL']
    rx, ry = P['earR']
    ears = R.get('ears')
    if ears == 'elf':
        poly(d, [(ex + 6, ey - 16), (ex - 58, ey - 66), (ex + 2, ey + 18)], fill)
        poly(d, [(rx - 6, ry - 16), (rx + 58, ry - 66), (rx - 2, ry + 18)], fill)
    elif ears == 'goblin':
        poly(d, [(ex + 6, ey - 22), (ex - 88, ey - 30), (ex + 2, ey + 24)], fill)
        poly(d, [(rx - 6, ry - 22), (rx + 88, ry - 30), (rx - 2, ry + 24)], fill)
    elif ears == 'small':
        poly(d, [(ex + 6, ey - 12), (ex - 30, ey - 30), (ex + 2, ey + 14)], fill)
        poly(d, [(rx - 6, ry - 12), (rx + 30, ry - 30), (rx - 2, ry + 14)], fill)
    if R.get('cat'):
        for tri in (P['catL'], P['catR']):
            poly(d, tri, hair_col, 5)
            cx = sum(p[0] for p in tri) / 3
            cy = sum(p[1] for p in tri) / 3
            inner = [(cx + (x - cx) * 0.55, cy + (y - cy) * 0.55 + 6) for x, y in tri]
            d.polygon(inner, fill=(255, 170, 200, 255))
    if R.get('horns'):
        for tri in (P['hornL'], P['hornR']):
            poly(d, tri, (120, 36, 40, 255), 4)
            d.line([tri[0], tri[1]], fill=(210, 110, 90, 255), width=3)
    mx_, my_ = P['mouth']
    if R.get('tusks'):
        poly(d, [(mx_ - 18, my_ + 4), (mx_ - 22, my_ - 16), (mx_ - 9, my_ + 4)], (250, 246, 230, 255), 3)
        poly(d, [(mx_ + 18, my_ + 4), (mx_ + 22, my_ - 16), (mx_ + 9, my_ + 4)], (250, 246, 230, 255), 3)
    if R.get('beard') and g == 'm':
        cy = P['chinY']
        beard = [(mx_ - 62, my_ - 12), (mx_ - 40, my_ - 2), (mx_, my_ + 2), (mx_ + 40, my_ - 4), (mx_ + 62, my_ - 16),
                 (mx_ + 56, cy + 30), (mx_ + 18, cy + 72), (mx_, cy + 58), (mx_ - 18, cy + 72), (mx_ - 56, cy + 30)]
        poly(d, beard, (150, 74, 34, 255), 4)
        d.line([(mx_ - 30, my_ - 6), (mx_, my_ - 2), (mx_ + 30, my_ - 8)], fill=(120, 52, 20, 255), width=6)
        for k in range(-30, 31, 15):
            d.line([(mx_ + k, cy + 10), (mx_ + k * 0.7, cy + 50)], fill=(130, 60, 24, 255), width=2)
    if R.get('cheeks'):
        for (cx, cy) in (P['cheekL'], P['cheekR']):
            blush = Image.new('RGBA', out.size, (0, 0, 0, 0))
            ImageDraw.Draw(blush).ellipse([cx - 14, cy - 8, cx + 14, cy + 8], fill=(255, 110, 130, 90))
            out.alpha_composite(blush)
    if R.get('freckles'):
        for (cx, cy) in (P['cheekL'], P['cheekR']):
            for dx, dy in ((-6, -3), (2, 2), (8, -2), (-2, 5)):
                d.ellipse([cx + dx - 2, cy + dy - 2, cx + dx + 2, cy + dy + 2], fill=(170, 100, 60, 255))
    bbox = out.getbbox()
    out = out.crop(bbox)
    big = out.resize((int(out.width * 600 / out.height), 600), Image.LANCZOS) if out.height != 600 else out
    big.save(os.path.join(OUT, f'{race}_{g}_big.png'))
    small = out.resize((max(1, int(out.width * 256 / out.height)), 256), Image.LANCZOS)
    small.save(os.path.join(OUT, f'{race}_{g}.png'))


for race in RACES:
    for g in ('m', 'f'):
        build(race, g)
print('ok', len(os.listdir(OUT)))
