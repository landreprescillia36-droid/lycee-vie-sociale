"""Bijoux garçons repris pixel par pixel des planches de Prescillia
(docs/references/accessoires/planche-bijoux-garcons-1.jpg et -2.jpg).
Sortie : assets/bijoux/<id>-g.png / -d.png (boucles, oreille gauche / droite de l'image) et <id>.png (chaînes),
et js/bijoux-art.js : taille en unités de la tête du jeu (échelle prise sur l'écart entre les yeux du modèle = 104 unités)."""
import json, os, sys
import numpy as np
from PIL import Image
from scipy import ndimage
R = os.path.join(os.path.dirname(__file__), '..')
REF = os.path.join(R, 'docs/references/accessoires')
OUT = os.path.join(R, 'assets/bijoux'); os.makedirs(OUT, exist_ok=True)
# forme de chaque bijou relevée à la main sur la planche (px) : clou/anneau = ellipse (cx, cy, rx, ry) par oreille ;
# chaîne = cadre serré autour de la chaîne. Yeux du modèle [x gauche, x droit, y] pour l'échelle. Choix de Prescillia (traits rouges).
EAR = {
 'gpuce':    ('planche-bijoux-garcons-1.jpg', (102.5,310,6,6), (316.5,309.5,6,6), (149.4,268.8,273.9), 'clou'),
 'gcreole':  ('planche-bijoux-garcons-1.jpg', (500,317,5.8,12.8,501,310.5,1.6,5), (708,317,5.8,12.8,709,310.5,1.6,5), (546.3,664.1,275.0), 'anneau'),
 'gboucle':  ('planche-bijoux-garcons-2.jpg', (128,291.5,3.2,3.2), (315.5,291.5,3.2,3.2), (169.2,275.0,261.7), 'clou'),
 'gcreole2': ('planche-bijoux-garcons-2.jpg', (517.5,298.5,5.4,7.2,517.5,295.5,1.6,2.8), (702.5,298.5,5.4,7.2,702.5,295.5,1.6,2.8), (555.5,661.0,261.7), 'anneau'),
}
CHAIN = {
 'gchfine':   ('planche-bijoux-garcons-1.jpg', (146,1036,272,1086), (150.3,269.8,881.4)),
 'gchmoy':    ('planche-bijoux-garcons-1.jpg', (545,1036,665,1088), (547.0,663.7,880.4)),
 'gchepaisse':('planche-bijoux-garcons-1.jpg', (940,1036,1068,1096), (944.0,1059.5,880.4)),
}
def load(f): return np.asarray(Image.open(os.path.join(REF, f)).convert('RGB')).astype(float)
def silver_alpha(px, dark_ok=False, strict=False):
    r, g, b = px[..., 0], px[..., 1], px[..., 2]
    mx = px.max(-1); mn = px.min(-1); ch = mx - mn; L = px.mean(-1)
    a = np.clip((34 - ch) / 14, 0, 1) * np.clip((16 - (b - r)) / 6, 0, 1)
    if dark_ok: a *= np.clip((L - 55) / 70, 0, 1)   # chaînes sur t-shirt noir : le noir n'est pas du métal
    else: a *= np.clip((L - 70) / 40, 0, 1)
    bg = ((b - r) > 12) & (L > 190)
    a *= ~ndimage.binary_dilation(bg, iterations=1)
    if strict:  # anneaux : le liseré rosé du bord de l'oreille n'est pas du métal
        rim = (r - b > 10) & (L > 150); a *= ~ndimage.binary_dilation(rim, iterations=1) | (ch < 10)
    return a
def cut(px, a):
    ys, xs = np.nonzero(a > .05); y0, y1, x0, x1 = ys.min(), ys.max() + 1, xs.min(), xs.max() + 1
    rgba = np.dstack([px[y0:y1, x0:x1], a[y0:y1, x0:x1] * 255]).astype(np.uint8)
    return rgba, (x0, y0, x1, y1)
def ell(px, cx, cy, rx, ry):
    """morceau de planche autour du bijou + masque ellipse au bord doux (1 px)"""
    X0, Y0 = int(cx - rx - 2), int(cy - ry - 2); sub = px[Y0:int(cy + ry + 3), X0:int(cx + rx + 3)]
    yy, xx = np.mgrid[0:sub.shape[0], 0:sub.shape[1]]; d = np.sqrt(((xx + X0 + .5 - cx) / rx) ** 2 + ((yy + Y0 + .5 - cy) / ry) ** 2)
    return sub, np.clip((1 - d) * min(rx, ry) + 1, 0, 1), X0, Y0
art = {}
for id, (f, eg, ed, (exg, exd, ey), kind) in EAR.items():
    px = load(f); k = 104 / (exd - exg); parts = {}
    for side, E in (('g', eg), ('d', ed)):
        cx, cy, rx, ry = E[:4]; sub, m, X0, Y0 = ell(px, cx, cy, rx, ry); a = m
        if kind == 'anneau':  # anneau = ellipse moins le trou (relevé sur la planche), sans le fond bleu
            yy, xx = np.mgrid[0:sub.shape[0], 0:sub.shape[1]]; hx, hy, hrx, hry = E[4:]
            d = np.sqrt(((xx + X0 + .5 - hx) / hrx) ** 2 + ((yy + Y0 + .5 - hy) / hry) ** 2)
            r_, b_ = sub[..., 0], sub[..., 2]; bg = ((b_ - r_) > 10) & (sub.mean(-1) > 200)
            ch_ = sub.max(-1) - sub.min(-1)  # la peau du lobe (devant le haut de l'anneau) reste celle du jeu
            a = m * np.clip(d - .6, 0, 1) * ~bg * np.clip((48 - ch_) / 16, 0, 1)
        if kind == 'clou': a = m  # clou : la pierre entière (reflets compris)
        rgba, (a0, b0, a1, b1) = cut(sub, a)
        Image.fromarray(rgba, 'RGBA').save(os.path.join(OUT, f'{id}-{side}.png'))
        # point d'attache = centre (clou) ou haut de l'anneau, en unités du jeu par rapport au coin de l'image
        ax, ay = (cx - X0 - a0) * k, ((cy - Y0 - b0) if kind == 'clou' else 1) * k
        parts[side] = [round((a1 - a0) * k, 2), round((b1 - b0) * k, 2), round(ax, 2), round(ay, 2)]
    art[id] = {'k': kind, 'g': parts['g'], 'd': parts['d']}
for id, (f, (x0, y0, x1, y1), (exg, exd, ey)) in CHAIN.items():
    px = load(f); k = 104 / (exd - exg); mid = (exg + exd) / 2
    sub = px[y0:y1, x0:x1]; rgba, (a0, b0, a1, b1) = cut(sub, silver_alpha(sub, True))
    Image.fromarray(rgba, 'RGBA').save(os.path.join(OUT, f'{id}.png'))
    # position dans le repère de la tête : yeux à x 200±52, y = cy (yeux) ; on garde la distance aux yeux
    art[id] = {'k': 'chaine', 'img': [round(200 + (x0 + a0 - mid) * k, 2), round((y0 + b0 - ey) * k, 2), round((a1 - a0) * k, 2), round((b1 - b0) * k, 2)]}
open(os.path.join(R, 'js/bijoux-art.js'), 'w').write('/* généré par tools/bijoux-garcons.py — ne pas modifier à la main */\nconst BIJOU_ART=' + json.dumps(art, ensure_ascii=False) + ';\n')
print(json.dumps(art, indent=0, ensure_ascii=False))
