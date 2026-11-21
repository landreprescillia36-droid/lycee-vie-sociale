"""Retouche de « Queue de cheval haute bouclée » (bqueuehaute), à lancer une seule fois sur les images d'origine :
   queue égalisée, pointes arrondies, cheveux autour des oreilles homogènes, coin près du cou arrondi."""
import os, re, json, sys, numpy as np, cv2
from PIL import Image
os.chdir(os.path.join(os.path.dirname(os.path.abspath(__file__)), '..'))
hid = 'bqueuehaute'; E = 50
P = lambda f: 'assets/coiffures/' + f + '.png'
# fonctions de l'outil des pointes
src = open('tools/pointes-bouclees.py').read(); ns = {}
exec(src[src.index('def points_clairs'):src.index('F = np.array(')].replace('rng.', 'RNG.'), {'np': np, 'cv2': cv2, 'HP': 60, 'RNG': np.random.default_rng(3)}, ns)
points_clairs, pointes = ns['points_clairs'], ns['pointes']
js = open('js/coiffures-art.js').read(); m = re.search(r'("' + hid + r'":\{"img":)(\[[^\]]*\])', js); ix, iy, iw, ih = json.loads(m.group(2))
imgs = {s: np.array(Image.open(P(hid + s)).convert('RGBA')).astype(float) for s in ('', '-dos', '-peau', '-dos-peau')}
H0, W = imgs[''].shape[:2]
for s in imgs: imgs[s] = np.concatenate([imgs[s], np.zeros((E, W, 4))], 0)
H = H0 + E; ihn = ih * H / H0
# la queue touche le bord gauche de l'image (coupée tout droit) : M colonnes ajoutées à gauche
M = 40; k_ = iw / W
for s in imgs: imgs[s] = np.concatenate([np.zeros((H, M, 4)), imgs[s]], 1)
W += M; ix -= M * k_; iw += M * k_
js = js[:m.start(2)] + json.dumps([round(ix, 2), iy, round(iw, 2), round(ihn, 2)]).replace(' ', '') + js[m.end(2):]
U = ix + (np.arange(W) + .5) * iw / W; V = iy + (np.arange(H) + .5) * ihn / H
F, D = imgs[''], imgs['-dos']
n = points_clairs(F) + points_clairs(D)
# contour gauche de la queue prolongé en arrondi là où l'image le coupait (texture copiée en miroir)
def bordg(d, y):
    o = np.where(d[y, :, 3] > 128)[0]; return o.min() if len(o) else None
eg = {y: bordg(F, y) for y in range(90, H0)}
tr = [y for y, e in eg.items() if e is not None and e <= M + 3]
if tr:
    ya, yb = min(tr), max(tr); y1, y3 = 110, yb + 15
    ys_ = [y for y in range(y1, y3 + 1) if eg.get(y) is not None and not (ya - 5 <= y <= yb)]
    cq = np.polyfit(ys_ + [int((ya + yb) / 2)] * 8, [eg[y] for y in ys_] + [M - 22] * 8, 3)   # un seul contour régulier
    for d in (F, D):
        for y in range(y1, y3 + 1):
            X = np.polyval(cq, y); e = bordg(d, y)
            if e is None: continue
            if X < e:   # prolonger vers l'extérieur (texture en miroir)
                for x in range(max(0, int(X)), e):
                    xm = min(W - 1, 2 * e - x + 2); d[y, x, :3] = d[y, xm, :3]; d[y, x, 3] = 255 * np.clip(x + 1 - X, 0, 1)
            else:   # rentrer les bosses qui dépassent
                xs_ = np.arange(W); m_ = xs_ < X + 2; d[y, m_, 3] *= np.clip(xs_[m_] + .5 - X, 0, 1)
# 1. queue de cheval : contour extérieur égalisé (lissé), partie gauche de l'image (x < 300 px), sous la tête
PX = 300 + M
def lisser(d):
    a = d[:, :, 3] / 255.; mk = (a > .5).astype(float)
    sm = cv2.GaussianBlur(mk, (0, 0), 5)
    new = np.clip((sm - .5) * 3 + .5, 0, 1)
    zone = np.zeros_like(mk, bool); zone[90:H0 - 1, :PX + 10] = True
    # le bord du côté du visage reste tel quel : seulement le contour extérieur (gauche) et le bas
    xs = np.arange(W)[None, :].repeat(H, 0); inner = (xs > 230 + M) & (np.arange(H)[:, None] < 420)
    zone &= ~inner
    add = zone & (new > a)
    rgb = d[:, :, :3].astype(np.uint8); hole = ((a < .5) & zone).astype(np.uint8)
    fill = cv2.inpaint(rgb, hole, 6, cv2.INPAINT_TELEA).astype(float)
    d[add, :3] = fill[add]
    d[zone, 3] = new[zone] * 255
lisser(F); lisser(D)
# 2. pointes : bas de la queue (coupé en biais, et à plat par le bas de l'image) remplacé par des boucles arrondies
cols = np.arange(10, PX - 20)
bot = np.array([np.where(F[:H0, x, 3] > 128)[0].max() if (F[:H0, x, 3] > 128).any() else 0 for x in cols])
ok = (bot < H0 - 4) & (bot > 300)
c = np.polyfit(cols[ok], bot[ok], 2); base = np.polyval(c, np.arange(W))
base = np.where(np.arange(W) < PX, np.minimum(base, H - 6), 0)
lob = ns['lobes'](W, 0) * 0  # largeur des boucles
yb = np.full(W, float(H + 5)); x = 0; R = np.random.default_rng(5)
while x < PX:
    w = int(R.integers(20, 32)); hw = w / 2; cx = x + hw; L = R.uniform(0, 26)
    xs = np.arange(x, min(PX, x + w)); u = np.clip((xs + .5 - cx) / hw, -1, 1)
    yb[xs] = base[xs] + 12 - L - hw * 1.15 * (1 - np.sqrt(1 - u * u)); x += w
for d in (F, D, imgs['-peau'], imgs['-dos-peau']):
    # prolonger la queue jusqu'aux pointes (copie de la rangée au-dessus là où elle a été coupée par le bas de l'image)
    if d is F or d is D:
        for y in range(H0 - 3, H):
            m_ = (np.arange(W) < PX) & (y < yb) & (d[y, :, 3] < 200) & (d[y - 1, :, 3] > 200)
            d[y, m_] = d[y - 1, m_]
    Y = np.arange(H)[:, None] + .5; cov = np.clip(yb[None, :] - Y + .5, 0, 1); cov[:300] = 1
    d[:, :, 3] *= cov
    sh = np.clip(1 - (yb[None, :] - Y) / 7, 0, 1) * (Y > 300) * (np.arange(W)[None, :] < PX)
    d[:, :, :3] *= (1 - .28 * sh[:, :, None])
# 3. autour des oreilles : taches brunes (peau de la planche mêlée aux cheveux) repeintes couleur cheveux, mèche droite arrondie
def oreilles(d):
    a = d[:, :, 3]; op = a > 128; lum = d[:, :, :3] @ [.299, .587, .114]
    hw_ = (op & (lum < 50)).astype(float)
    num = np.stack([cv2.GaussianBlur(d[:, :, k] * hw_, (0, 0), 6) for k in range(3)], -1); den = cv2.GaussianBlur(hw_, (0, 0), 6)[:, :, None]
    g = np.median(d[op & (lum < 45)][:, :3], 0); col = np.broadcast_to(g, d[:, :, :3].shape).copy(); cl = col @ [.299, .587, .114]
    zone = (V[:, None] > 150) & (V[:, None] < 330) & ((np.abs(U[None, :] - 200) > 70))
    rb = d[:, :, 0] - d[:, :, 2]; crb = col[:, :, 0] - col[:, :, 2]
    warm = (a > 20) & zone & ((lum > cl + 6) | (rb > crb + 8))
    inner_ = cv2.erode(op.astype(np.uint8), np.ones((5, 5), np.uint8)).astype(bool) & zone; d[inner_, 3] = 255
    k = np.clip(np.maximum((lum - cl) / 30, (rb - crb) / 25), 0, 1)[:, :, None]
    d[:, :, :3] = np.where(warm[:, :, None], d[:, :, :3] * (1 - k) + col * k, d[:, :, :3])
    return int(warm.sum())
n2 = oreilles(F) + oreilles(D)
# mèche devant l'oreille droite : bout arrondi
xs_r = np.where(U > 260)[0]
botr = [np.where(F[:H0, x, 3] > 128)[0].max() for x in xs_r if (F[:H0, x, 3] > 128).any() and np.where(F[:H0, x, 3] > 128)[0].max() > 300]
for d in (F, D):
    cols_r = [x for x in xs_r if (d[300:H0, x, 3] > 128).any()]
    if not cols_r: continue
    x0, x1 = min(cols_r), max(cols_r); cx = (x0 + x1) / 2; hw = (x1 - x0) / 2 + .5; yend = max(botr) - 6
    for x in range(x0, x1 + 1):
        u = (x + .5 - cx) / hw; yl = yend - hw * 1.1 * (1 - np.sqrt(max(0, 1 - u * u)))
        Y = np.arange(H) + .5; cv_ = np.clip(yl - Y + .5, 0, 1); cv_[:300] = 1; d[:, x, 3] *= cv_
# coin bas-droit de la queue (bord vertical près du cou) arrondi
cy = np.array([440, 455, 470, 485, 500, 512, 525, 540]); cx = np.array([266, 272, 274, 270, 258, 240, 215, 185])
for d in (F, D, imgs['-peau'], imgs['-dos-peau']):
    for y in range(440, 541):
        X = np.interp(y, cy, cx) + M; xs_ = np.arange(W); m_ = (xs_ > X - 2) & (xs_ < 320 + M)
        d[y, m_, 3] *= np.clip(X - xs_[m_] + .5, 0, 1)
for s, d in imgs.items(): Image.fromarray(d.clip(0, 255).astype(np.uint8)).save(P(hid + s))
open('js/coiffures-art.js', 'w').write(js)
print('points', n, 'oreilles', n2, 'h', ih, '->', round(ihn, 2))
