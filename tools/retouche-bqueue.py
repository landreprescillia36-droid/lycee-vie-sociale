"""Retouche de « Queue de cheval bouclée » (bqueue), à lancer une seule fois sur les images d'origine :
   1. bas de la queue (coupé en biais, bord droit coupé tout droit) : la queue est prolongée avec la texture des boucles
      (recopiée d'au-dessus) et se termine par des pointes de boucles arrondies ;
   2. haut du front : l'espace vide entre le bandeau de cheveux et le front est rempli avec la texture des cheveux.
   Usage : python3 tools/retouche-bqueue.py"""
import os, re, json, numpy as np, cv2
from PIL import Image
R = os.path.join(os.path.dirname(os.path.abspath(__file__)), '..'); os.chdir(R)
hid = 'bqueue'; E = 90
P = lambda f: 'assets/coiffures/' + f + '.png'
js = open('js/coiffures-art.js').read(); m = re.search(r'("' + hid + r'":\{"img":)(\[[^\]]*\])', js); ix, iy, iw, ih = json.loads(m.group(2))
imgs = {s: np.array(Image.open(P(hid + s)).convert('RGBA')).astype(float) for s in ('', '-dos', '-peau', '-dos-peau') if os.path.exists(P(hid + s))}
H0, W = imgs[''].shape[:2]
for s in imgs: imgs[s] = np.concatenate([imgs[s], np.zeros((E, W, 4))], 0)
H = H0 + E; ihn = ih * H / H0
js = js[:m.start(2)] + json.dumps([ix, iy, iw, round(ihn, 2)]).replace(' ', '') + js[m.end(2):]
U = ix + (np.arange(W) + .5) * iw / W; V = iy + (np.arange(H) + .5) * ihn / H; UU, VV = np.meshgrid(U, V)
F, D = imgs[''], imgs['-dos']
src = open('tools/pointes-bouclees.py').read(); ns = {'np': np, 'cv2': cv2}
exec(src[src.index('def points_clairs'):src.index('def lobes')], ns)
for d in (F, D): ns['points_clairs'](d)   # points clairs du fond de la planche
rng = np.random.default_rng(4)

# ---------- 1. queue : nouvelle forme (bord gauche gardé, bord droit arrondi, bas en pointes) ----------
TX = 300   # la queue est à gauche de x = 300
def bords(d, y):
    o = np.where(d[y, :TX, 3] > 128)[0]; return (o.min(), o.max()) if len(o) else (None, None)
yR = np.array([300, 380, 440, 480, 520, 570, 620, 680, H - 40]); xR = np.array([220, 211, 220, 246, 268, 276, 268, 240, 205])
yL = list(range(300, 600, 10)); xl = [bords(F, y)[0] for y in yL]; cL = np.polyfit(yL, xl, 1)
# bas : pointes de boucles arrondies, de gauche à droite, le long d'une ligne un peu en biais
yb = np.full(W, -1.); x = 0
while x < 290:
    w = int(rng.integers(24, 34)); hw = w / 2; c = x + hw + rng.choice([-1, 1]) * .18 * hw; Lg = rng.uniform(0, 14)
    seg = np.arange(x, min(290, x + w)); u = np.clip((seg + .5 - c) / np.where(seg + .5 < c, c - x, x + w - c), -1, 1)
    yb[seg] = (H - 8) - .12 * seg - Lg - hw * .95 * (1 - np.sqrt(1 - u * u)); x += w
shape = np.zeros((H, W)); Yc = np.arange(H) + .5
for x in range(TX):
    shape[:, x] = np.clip(yb[x] - Yc + .5, 0, 1) if yb[x] > 0 else 0
for y in range(300, H):
    xr = np.interp(y, yR, xR); xl_ = max(np.polyval(cL, min(y, 600)), 2)
    shape[y, :TX] *= np.clip(xr - np.arange(TX) + .5, 0, 1) * np.clip(np.arange(TX) + .5 - xl_, 0, 1)
shape[:300] = 1
for d in (F, D):
    a = d[:, :, 3]
    # remplir avec la texture des boucles : recopie de la queue 110 px plus haut (même colonne), sinon 40 px à gauche
    for y in range(300, H):
        need = (shape[y, :TX] > 0) & (a[y, :TX] < 200)
        for x in np.where(need)[0]:
            for sy, sx in ((y - 110, x), (y - 220, x), (y - 110, x - 40), (y, x - 40), (y - 60, x - 60)):
                if 0 <= sx < W and 0 <= sy and d[sy, sx, 3] > 220:
                    d[y, x, :3] = d[sy, sx, :3]; d[y, x, 3] = 255; break
    d[300:, :TX, 3] = np.minimum(d[300:, :TX, 3], shape[300:, :TX] * 255)
    # relief au bout de chaque boucle
    sh = np.zeros((H, W))
    for x in range(TX):
        if yb[x] > 0: sh[:, x] = np.clip(1 - (yb[x] - Yc) / 7, 0, 1) * (Yc > yb[x] - 30)
    d[:, :, :3] *= (1 - .28 * sh[:, :, None])
for s in ('-peau', '-dos-peau'):
    if s in imgs: imgs[s][300:, :TX, 3] *= shape[300:, :TX]

# ---------- 2. haut du front : vide entre le bandeau et le front rempli de cheveux ----------
FT = json.load(open('tools/front-visages.json'))   # haut du front le plus bas des visages du jeu, par u
top_ = np.interp(UU, [p[0] for p in FT], [p[1] for p in FT], left=0, right=0)
gap = (np.abs(UU - 200) < 82) & (VV < top_ + 3.5) & (VV > 40)
for d in (F, D):
    a = d[:, :, 3]
    for x in range(W):
        col = np.where(gap[:, x] & (a[:, x] < 230))[0]
        if not len(col): continue
        above = np.where((a[:col.min(), x] > 230))[0]
        if not len(above): continue
        y0 = above.max()   # bas du bandeau dans cette colonne
        for y in col:
            sy = max(0, y0 - 2 - (y - y0) % 40)   # texture du bandeau, en miroir vers le bas
            k = 1 - a[y, x] / 255
            d[y, x, :3] = d[y, x, :3] * (1 - k) + d[sy, x, :3] * k; d[y, x, 3] = 255
for s, d in imgs.items(): Image.fromarray(d.clip(0, 255).astype(np.uint8)).save(P(hid + s))
open('js/coiffures-art.js', 'w').write(js)
print('bqueue retouchée, hauteur', ih, '->', round(ihn, 2))
