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
    new = np.clip((sm - .5) * 10 + .5, 0, 1)   # bord net
    zone = np.zeros_like(mk, bool); zone[0:H0 - 1, :PX + 10] = True
    # le bord du côté du visage reste tel quel : seulement le contour extérieur (gauche) et le bas
    xs = np.arange(W)[None, :].repeat(H, 0); inner = (xs > 230 + M) & (np.arange(H)[:, None] < 420) | ((xs > 150 + M) & (np.arange(H)[:, None] > 60) & (np.arange(H)[:, None] < 330))
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
# mèches de devant (ligne des cheveux, boucles sur le front et les tempes) : trous bouchés, reflets orangés foncés, bord net
def meches(d):
    a = d[:, :, 3]; op = (a > 128).astype(np.uint8)
    zone = (V[:, None] > 20) & (V[:, None] < 260) & (np.abs(U[None, :] - 200) < 112)
    n_, lab, st, _ = cv2.connectedComponentsWithStats(1 - op, connectivity=4)
    trou = np.zeros(op.shape, bool)
    for i in range(1, n_):
        x, y, w, h, ar = st[i]
        if ar < 1500 and x > 0 and y > 0 and x + w < W and y + h < H and zone[y + h // 2, x + w // 2] and not (abs(U[x + w // 2] - 200) < 10 and V[y + h // 2] < 60):
            trou |= lab == i
    trou = cv2.dilate(trou.astype(np.uint8), np.ones((5, 5), np.uint8)).astype(bool)
    lum = d[:, :, :3] @ [.299, .587, .114]; g = np.median(d[(op > 0) & (lum < 45)][:, :3], 0)
    col = np.broadcast_to(g, d[:, :, :3].shape)
    d[trou, :3] = col[trou]; d[trou, 3] = 255
    rb = d[:, :, 0] - d[:, :, 2]; warm = (a > 20) & zone & ((lum > g @ [.299, .587, .114] + 10) | (rb > g[0] - g[2] + 10))
    k = np.clip(np.maximum((lum - g @ [.299, .587, .114]) / 30, (rb - (g[0] - g[2])) / 25), 0, 1)[:, :, None]
    d[:, :, :3] = np.where(warm[:, :, None], d[:, :, :3] * (1 - k) + col * k, d[:, :, :3])
    sh = np.clip((d[:, :, 3] / 255 - .5) * 4 + .5, 0, 1) * 255
    d[:, :, 3] = np.where(zone, sh, d[:, :, 3])
    return int(trou.sum())
n3 = meches(F) + meches(D)
# hors du visage (au-dessus du front et sur les tempes), plus aucun trou : on y voyait le fond
fp = []
for tt in np.linspace(0, 1, 300):
    for P0, P1, P2, P3 in (((200, 312), (140, 312), (106, 262), (106, 190)), ((106, 190), (106, 112), (148, 70), (200, 70)),
                           ((200, 70), (252, 70), (294, 112), (294, 190)), ((294, 190), (294, 262), (260, 312), (200, 312))):
        fp.append([(1 - tt) ** 3 * P0[i] + 3 * (1 - tt) ** 2 * tt * P1[i] + 3 * (1 - tt) * tt * tt * P2[i] + tt ** 3 * P3[i] for i in (0, 1)])
fp = np.array(fp, np.float32); UU, VV = np.meshgrid(U, V)
inside = np.zeros(UU.shape, np.uint8); pts = np.stack([(fp[:, 0] - ix) * W / iw, (fp[:, 1] - iy) * H / ihn], 1).astype(np.int32)
cv2.fillPoly(inside, [cv2.convexHull(pts)], 1); inside = cv2.erode(inside, np.ones((25, 25), np.uint8)).astype(bool)   # un peu en dedans : aucune fente entre front et cheveux
# haut du front : le plus bas des 10 visages du jeu (FACE_ART) ; au-dessus, les cheveux couvrent tout
FT = np.array([[115, 133.7], [116, 131.9], [117, 130.1], [118, 128.4], [119, 126.6], [120, 124.9], [121, 123.5], [122, 122.1], [123, 120.7], [124, 119.4], [125, 118.1], [126, 117.1], [127, 115.8], [128, 114.8], [129, 113.6], [130, 112.7], [131, 111.7], [132, 110.8], [133, 109.9], [134, 109], [135, 108.2], [136, 107.5], [137, 106.7], [138, 105.9], [139, 105.3], [140, 104.5], [141, 103.7], [142, 103.1], [143, 102.4], [144, 101.6], [145, 101.1], [146, 100.4], [147, 99.9], [148, 99.4], [149, 98.7], [150, 98.3], [151, 97.8], [152, 97.2], [153, 96.8], [154, 96.3], [155, 96], [156, 95.5], [157, 95.1], [158, 94.8], [159, 94.5], [160, 94.1], [161, 93.8], [162, 93.5], [163, 93.1], [164, 92.8], [165, 92.6], [166, 92.3], [167, 92], [168, 91.8], [169, 91.5], [170, 91.3], [171, 91], [172, 90.7], [173, 90.5], [174, 90.3], [175, 90.1], [176, 89.9], [177, 89.7], [178, 89.5], [179, 89.3], [180, 89.2], [181, 89], [182, 88.8], [183, 88.7], [184, 88.6], [185, 88.4], [186, 88.3], [187, 88.2], [188, 88.1], [189, 88], [190, 87.9], [191, 87.8], [192, 87.7], [193, 87.6], [194, 87.6], [195, 87.5], [196, 87.5], [197, 87.4], [198, 87.4], [199, 87.4], [200, 87.4], [201, 87.4], [202, 87.4], [203, 87.4], [204, 87.5], [205, 87.5], [206, 87.6], [207, 87.6], [208, 87.7], [209, 87.8], [210, 87.9], [211, 88], [212, 88.1], [213, 88.2], [214, 88.3], [215, 88.4], [216, 88.6], [217, 88.7], [218, 88.8], [219, 89], [220, 89.2], [221, 89.3], [222, 89.5], [223, 89.7], [224, 89.9], [225, 90.1], [226, 90.3], [227, 90.5], [228, 90.7], [229, 91], [230, 91.3], [231, 91.5], [232, 91.8], [233, 92], [234, 92.3], [235, 92.6], [236, 92.8], [237, 93.1], [238, 93.5], [239, 93.8], [240, 94.1], [241, 94.5], [242, 94.8], [243, 95.1], [244, 95.5], [245, 96], [246, 96.3], [247, 96.8], [248, 97.2], [249, 97.8], [250, 98.3], [251, 98.7], [252, 99.4], [253, 99.9], [254, 100.4], [255, 101.1], [256, 101.6], [257, 102.4], [258, 103.1], [259, 103.7], [260, 104.5], [261, 105.3], [262, 105.9], [263, 106.7], [264, 107.5], [265, 108.2], [266, 109], [267, 109.9], [268, 110.8], [269, 111.7], [270, 112.7], [271, 113.6], [272, 114.8], [273, 115.8], [274, 117.1], [275, 118.1], [276, 119.4], [277, 120.7], [278, 122.1], [279, 123.5], [280, 124.9], [281, 126.6], [282, 128.4], [283, 130.1], [284, 131.9], [285, 133.7]])
top_ = np.interp(UU, FT[:, 0], FT[:, 1], left=0, right=0)
front_ = (np.abs(UU - 200) < 85) & (VV < 150) & (VV < top_ + 3.5) & (VV > 72)
inside = np.where((np.abs(UU - 200) < 85) & (VV < 150), VV >= top_ + 3.5, inside)
for d in (F, D):
    a = d[:, :, 3]; lum = d[:, :, :3] @ [.299, .587, .114]; g = np.median(d[(a > 128) & (lum < 45)][:, :3], 0)
    hull = np.zeros(a.shape, np.uint8); op_ = (a > 128).astype(np.uint8)
    cs, _ = cv2.findContours(op_, cv2.RETR_EXTERNAL, cv2.CHAIN_APPROX_SIMPLE); cv2.fillPoly(hull, cs, 1)
    clo = cv2.morphologyEx(op_, cv2.MORPH_CLOSE, cv2.getStructuringElement(cv2.MORPH_ELLIPSE, (31, 31))) > 0
    hole = (~inside) & ((hull > 0) | clo | front_) & (a < 250) & (VV > 15) & (VV < 200) & (np.abs(UU - 200) < 105) & True
    d[hole, :3] = g; d[hole, 3] = 255
# peau du crâne dessinée sous les mèches : plus claire que le visage du jeu, elle faisait des taches ; on garde seulement la raie
for s in ('-peau', '-dos-peau'):
    q = imgs[s]; z = (np.abs(U[None, :] - 200) > 5) & (np.abs(U[None, :] - 200) < 112) & (V[:, None] < 300)
    q[:, :, 3] = np.where(z, 0, q[:, :, 3])
    # raie du milieu : fine ligne de peau, de la couette jusqu'au front
    med = np.median(q[q[:, :, 3] > 200][:, :3], 0) if (q[:, :, 3] > 200).any() else np.array([200, 150, 120.])
    for y in range(H):
        if 40 < V[y] < 86:
            c = np.clip(1.2 - np.abs(U - 200) / (iw / W) / 1.2, 0, 1) * min(1, (V[y] - 40) / 12)
            q[y, :, :3] = np.where(c[:, None] > 0, med, q[y, :, :3]); q[y, :, 3] = np.maximum(q[y, :, 3], c * 255)
# la raie se voit au travers des cheveux de devant
for d in (F, D):
    for y in range(H):
        if 40 < V[y] < 86:
            c = np.clip(1.2 - np.abs(U - 200) / (iw / W) / 1.2, 0, 1) * min(1, (V[y] - 40) / 12); d[y, :, 3] *= (1 - c)
for s, d in imgs.items(): Image.fromarray(d.clip(0, 255).astype(np.uint8)).save(P(hid + s))
open('js/coiffures-art.js', 'w').write(js)
print('points', n, 'oreilles', n2, 'h', ih, '->', round(ihn, 2))
