"""Retouche de « Queue de cheval bouclée » (bqueue), à lancer une seule fois sur les images d'origine :
   1. queue égalisée : contour gauche et droit en courbes régulières (la queue n'est plus coupée par le bord de l'image),
      texture des boucles prolongée vers le bas sans raccord visible, taches claires du côté gauche fondues ;
   2. bas de la queue : pointes de boucles arrondies ;
   3. haut du front : le vide entre le bandeau de cheveux et le front, et les taches claires des mèches, remplis de cheveux.
   Usage : python3 tools/retouche-bqueue.py"""
import os, re, json, numpy as np, cv2
from PIL import Image
R = os.path.join(os.path.dirname(os.path.abspath(__file__)), '..'); os.chdir(R)
hid = 'bqueue'; E = 90; M = 40   # E lignes ajoutées en bas, M colonnes à gauche
P = lambda f: 'assets/coiffures/' + f + '.png'
js = open('js/coiffures-art.js').read(); m = re.search(r'("' + hid + r'":\{"img":)(\[[^\]]*\])', js); ix, iy, iw, ih = json.loads(m.group(2))
imgs = {s: np.array(Image.open(P(hid + s)).convert('RGBA')).astype(float) for s in ('', '-dos', '-peau', '-dos-peau') if os.path.exists(P(hid + s))}
H0, W0 = imgs[''].shape[:2]; k_ = iw / W0
for s in imgs: imgs[s] = np.pad(imgs[s], ((0, E), (M, 0), (0, 0)))
H, W = H0 + E, W0 + M; ihn = ih * H / H0; ix -= M * k_; iw += M * k_
js = js[:m.start(2)] + json.dumps([round(ix, 2), iy, round(iw, 2), round(ihn, 2)]).replace(' ', '') + js[m.end(2):]
U = ix + (np.arange(W) + .5) * iw / W; V = iy + (np.arange(H) + .5) * ihn / H; UU, VV = np.meshgrid(U, V)
F, D = imgs[''], imgs['-dos']
src = open('tools/pointes-bouclees.py').read(); ns = {'np': np, 'cv2': cv2}
exec(src[src.index('def points_clairs'):src.index('def lobes')], ns)
for d in (F, D): ns['points_clairs'](d)
rng = np.random.default_rng(4)
TX = 300 + M; Y0 = 300   # la queue : x < TX, sous Y0
X = np.arange(W); Yc = np.arange(H) + .5
g = np.median(F[(F[:, :, 3] > 230) & ((F[:, :, :3] @ [.299, .587, .114]) < 40)][:, :3], 0)

# ---------- 1. forme de la queue ----------
def bords(d, y):
    o = np.where(d[y, :TX, 3] > 128)[0]; return (o.min(), o.max()) if len(o) else (None, None)
# gauche : une seule courbe régulière (ajustée sur le bord dessiné, là où il ne touche pas le bord de l'image), prolongée vers le bas
# points de passage : le bord dessiné en haut, puis une courbe douce (légèrement bombée) qui se resserre vers les pointes
yk = np.array([22, 40, 60, 100, 180, 300, 420, 560, 700, H - 30]); xk = np.array([216, 200, 165, 130, 90, 59, 46, 44, 52, 68], float)
from scipy.interpolate import PchipInterpolator
fL = PchipInterpolator(yk, xk)
def xL(y): return float(fL(min(max(y, 22), H - 30)))
# droite : bord dessiné lissé en haut, puis courbe douce qui revient vers le bas
ro = np.array([bords(F, y)[1] if bords(F, y)[1] is not None else 0 for y in range(H)], float)
ro = cv2.GaussianBlur(ro.reshape(-1, 1), (0, 0), 6).ravel()
yR = np.array([540, 580, 620, 660, 700, H - 40]); xR = np.array([ro[540], 276 + M, 268 + M, 250 + M, 232 + M, 212 + M])
cr = np.polyfit(yR, xR, 3)
def xRr(y): return ro[y] if y < 540 else np.polyval(cr, y)
yb = np.full(W, -1.); x = int(xL(H - 40)) - 3; xend = int(xRr(H - 40)) + 3
while x < xend:   # pointes de boucles le long d'une ligne un peu en biais
    w = int(rng.integers(24, 34)); w = min(w, xend - x) if xend - x > 14 else w; hw = w / 2
    c = x + hw + rng.choice([-1, 1]) * .18 * hw; Lg = rng.uniform(0, 12)
    seg = np.arange(x, min(W, x + w)); u = np.clip((seg + .5 - c) / np.where(seg + .5 < c, c - x, x + w - c), -1, 1)
    yb[seg] = (H - 8) - .1 * (seg - M) - Lg - hw * .95 * (1 - np.sqrt(1 - u * u)); x += w
shape = np.ones((H, W))
for y in range(22, H):
    l, r = xL(y), (xRr(y) if y >= 540 else TX + 5)
    shape[y, :TX] = np.clip(r - X[:TX] + .5, 0, 1) * np.clip(X[:TX] + .5 - l, 0, 1)
for x in range(TX):
    shape[:, x] *= np.clip(yb[x] - Yc + .5, 0, 1) if yb[x] > 0 else (Yc < H - 30)
shape[:22] = 1

# ---------- 2. texture : sous le bas d'origine, recopie périodique de la queue (sans raccord) ----------
for d in (F, D):
    a0 = d[:, :, 3].copy()
    # bord gauche : là où la queue touchait le bord de l'image, la texture est recopiée en miroir
    for y in range(60, H):
        l = int(xL(y)); o = np.where(a0[y, :TX] > 200)[0]
        if not len(o): continue
        e = o.min()
        for x in range(max(0, l - 1), e): d[y, x, :3] = d[y, min(TX - 1, 2 * e - x + 6), :3]; d[y, x, 3] = 255
    a = d[:, :, 3].copy(); orig = d.copy()
    for x in range(TX):
        if x >= int(xRr(540)) + 2: continue
        col = np.where(a[540:, x] > 200)[0]
        bot = 540 + col.max() - 22 if len(col) else 548   # bas dessiné, moins la bordure sombre (seulement sous y = 540)
        bot = max(548, min(bot, H0 - 22))
        Pd = 130
        for y in range(bot - 8, H):
            if shape[y, x] <= 0: continue
            sy = y
            while sy >= bot - 8: sy -= Pd
            sx = x
            if orig[sy, sx, 3] < 220:   # colonne vide plus haut (bord) : prendre plus à droite
                for dx in range(4, 120, 4):
                    if sx + dx < W and orig[sy, sx + dx, 3] > 220: sx += dx; break
            t = np.clip((y - (bot - 8)) / 8, 0, 1) if a[y, x] > 200 else 1   # fondu sur 8 lignes
            d[y, x, :3] = d[y, x, :3] * (1 - t) + orig[sy, sx, :3] * t; d[y, x, 3] = 255
    d[22:, :TX, 3] = np.minimum(d[22:, :TX, 3], shape[22:, :TX] * 255)
    # côté gauche : taches claires et floues fondues vers la couleur des cheveux voisins
    lum = d[:, :, :3] @ [.299, .587, .114]; med = cv2.medianBlur(d[:, :, :3].clip(0, 255).astype(np.uint8), 25).astype(float)
    lm = med @ [.299, .587, .114]; z = (X[None, :] < M + 110) & (Yc[:, None] > Y0 - 150) & (d[:, :, 3] > 0)
    kk = (np.clip((lum - lm + 2) / 12, 0, 1) * z)[:, :, None]
    d[:, :, :3] = d[:, :, :3] * (1 - kk) + med * kk
    # liseré clair du contour de la queue
    dist = cv2.distanceTransform((d[:, :, 3] > 128).astype(np.uint8), cv2.DIST_L2, 5)
    rim = (dist < 10) & (X[None, :] < TX) & (Yc[:, None] > Y0 - 150)
    kr = (np.clip((lum - (g @ [.299, .587, .114]) - 6) / 20, 0, 1) * rim)[:, :, None]
    d[:, :, :3] = d[:, :, :3] * (1 - kr) + g * kr
    sh = np.zeros((H, W))
    for x in range(TX):
        if yb[x] > 0: sh[:, x] = np.clip(1 - (yb[x] - Yc) / 7, 0, 1) * (Yc > yb[x] - 30)
    d[:, :, :3] *= (1 - .28 * sh[:, :, None])
for s in ('-peau', '-dos-peau'):
    if s in imgs: imgs[s][22:, :TX, 3] *= shape[22:, :TX]

# ---------- 3. haut du front ----------
FT = json.load(open('tools/front-visages.json'))
top_ = np.interp(UU, [p[0] for p in FT], [p[1] for p in FT], left=0, right=0)
gap = (np.abs(UU - 200) < 82) & (VV < top_ + 3.5) & (VV > 40)
for d in (F, D):
    a = d[:, :, 3]
    for x in range(W):
        col = np.where(gap[:, x] & (a[:, x] < 230))[0]
        if not len(col): continue
        above = np.where((a[:col.min(), x] > 230))[0]
        if not len(above): continue
        y0 = above.max()
        for y in col:
            sy = max(0, y0 - 2 - (y - y0) % 40); k = 1 - a[y, x] / 255
            d[y, x, :3] = d[y, x, :3] * (1 - k) + d[sy, x, :3] * k; d[y, x, 3] = 255
    # mèches de devant : taches claires (peau de la planche) et petits trous repeints couleur cheveux
    lum = d[:, :, :3] @ [.299, .587, .114]; z = (VV > 40) & (VV < 260) & (np.abs(UU - 200) < 112) & (np.abs(UU - 200) > 6)
    op = (d[:, :, 3] > 128).astype(np.uint8); n_, lab, st, _ = cv2.connectedComponentsWithStats(1 - op, connectivity=4)
    hole = np.isin(lab, [i for i in range(1, n_) if st[i, 4] < 400 and z[st[i, 1] + st[i, 3] // 2, st[i, 0] + st[i, 2] // 2]])
    hole = cv2.dilate(hole.astype(np.uint8), np.ones((3, 3), np.uint8)).astype(bool)
    d[hole, :3] = g; d[hole, 3] = 255
    kf = (np.clip((lum - (g @ [.299, .587, .114]) - 25) / 30, 0, 1) * z * (d[:, :, 3] > 0))[:, :, None]
    d[:, :, :3] = d[:, :, :3] * (1 - kf) + g * kf
for s, d in imgs.items(): Image.fromarray(d.clip(0, 255).astype(np.uint8)).save(P(hid + s))
open('js/coiffures-art.js', 'w').write(js)
print('bqueue retouchée')
