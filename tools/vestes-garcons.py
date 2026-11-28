"""Vestes des garçons reprises pixel par pixel de docs/references/vetements/planche-bas-vestes-garcons.jpg
(veste universitaire, doudoune) : la veste entière est découpée (fond, peau, jean retirés) et posée à la place du haut du jeu.
Repère : yeux du modèle (milieu et écart) → même repère que la case 1 de la planche des t-shirts → unités du jeu.
Sortie : assets/hauts/vestes/<id>.png et js/vestes-garcons-art.js (FULL_ART[id] = {img:[x,y,l,h], n:nom})."""
import os, json, numpy as np, cv2
from scipy import ndimage
R = os.path.join(os.path.dirname(os.path.abspath(__file__)), '..'); os.chdir(R)
P = 'docs/references/vetements/planche-bas-vestes-garcons.jpg'
a = cv2.imread(P)[:, :, ::-1].astype(np.float32)
# id : (cadre x0, y0, x1, y1, œil gauche, œil droit (x, y), nom)
V = {'gvarsity': ((873, 775, 1041, 1000), (926, 741), (970, 741), 'Veste universitaire'),
     'gdoudoune': ((1049, 752, 1195, 1000), (1101, 742), (1141, 742), 'Doudoune')}
TEE_MID, TEE_D = (120.5, 93.0), 41.0        # yeux de la case 1 de la planche des t-shirts
EYE, WRIST, SX = 150, 464, 1.12
UP = {'gvarsity': 14}
HAND = {'g': 124.8, 'd': 275.2}               # centre des mains du jeu (corpulence moyenne), au poignet
SHOULDER, TORSO = 290, 62                      # le décalage des manches commence sous l'épaule ; le buste (±62) ne bouge pas                       # veste universitaire : épaules plus hautes (couvrent celles du corps)            # jeu : hauteur des yeux, des poignets ; étirement horizontal
os.makedirs('assets/hauts/vestes', exist_ok=True); art = {}
for k, ((x0, y0, x1, y1), eg, ed, nom) in V.items():
    sub = a[y0:y1, x0:x1].copy(); r, g, b = sub[..., 0], sub[..., 1], sub[..., 2]; L = sub.mean(-1)
    hsv = cv2.cvtColor(sub.clip(0, 255).astype(np.uint8), cv2.COLOR_RGB2HSV).astype(int)
    bg = (b > r + 6) & (L > 200)
    skin = ((hsv[..., 0] < 25) | (hsv[..., 0] > 170)) & (hsv[..., 1] > 70) & (hsv[..., 2] > 25)
    jean = (b > r + 25) & (b > 140)
    m = ~(bg | skin | jean)
    m = cv2.morphologyEx(m.astype(np.uint8), cv2.MORPH_OPEN, np.ones((3, 3), np.uint8))
    n_, lab, st, _ = cv2.connectedComponentsWithStats(m, 8); keep = lab == 1 + np.argmax(st[1:, 4])
    keep = cv2.morphologyEx(keep.astype(np.uint8), cv2.MORPH_CLOSE, np.ones((5, 5), np.uint8)).astype(bool)
    keep = ndimage.binary_fill_holes(keep)
    # contour lissé
    big = cv2.resize(keep.astype(np.float32), None, fx=4, fy=4, interpolation=cv2.INTER_LINEAR)
    big = (cv2.GaussianBlur(big, (0, 0), 4) > .5).astype(np.float32)
    al = cv2.resize(big, (keep.shape[1], keep.shape[0]), interpolation=cv2.INTER_AREA)
    keep2 = keep | (al > .02)
    inner = cv2.erode(keep.astype(np.uint8), np.ones((5, 5), np.uint8)).astype(bool)
    _, idx = ndimage.distance_transform_edt(~inner, return_indices=True)
    col = sub.copy(); ring = keep2 & ~inner; col[ring] = sub[idx[0][ring], idx[1][ring]]
    rgba = np.dstack([col.clip(0, 255), al * 255]).astype(np.uint8)
    ys, xs = np.nonzero(al > .02); a0, a1, b0, b1 = xs.min(), xs.max() + 1, ys.min(), ys.max() + 1
    cv2.imwrite('assets/hauts/vestes/' + k + '.png', cv2.cvtColor(rgba[b0:b1, a0:a1], cv2.COLOR_RGBA2BGRA))
    # repère : yeux du modèle → yeux du jeu (y 199), bas des poignets (bas de l'image) → poignets du jeu (y 452, début des mains)
    mid = ((eg[0] + ed[0]) / 2, (eg[1] + ed[1]) / 2); cuff = y0 + b1
    eye = EYE - UP.get(k, 0); s = (WRIST - eye) / (cuff - mid[1]); sx = s * SX
    art[k] = {'img': [round(200 + (x0 + a0 - mid[0]) * sx, 2), round(eye + (y0 + b0 - mid[1]) * s, 2), round((a1 - a0) * sx, 2), round((b1 - b0) * s, 2)], 'n': nom}
    # manches : chaque manche est déplacée (de plus en plus vers le poignet) pour que le poignet tombe sur la main du jeu
    fn = 'assets/hauts/vestes/' + k + '.png'; im = cv2.imread(fn, cv2.IMREAD_UNCHANGED).astype(np.float32)
    X, Y, W, H = art[k]['img']; h_, w_ = im.shape[:2]; ux = W / w_; uy = H / h_
    al_ = im[..., 3] > 100; out = im.copy(); xs = np.arange(w_, dtype=np.float32)
    rows = [y for y in range(h_) if al_[y].any()]; yb = rows[-1]
    cuffrow = al_[yb - 8:yb].any(0); cols = np.nonzero(cuffrow)[0]
    gx = X + cols * ux
    for side, sgn in (('g', -1), ('d', 1)):
        c = cols[(gx < 200) if sgn < 0 else (gx >= 200)]
        if not len(c): continue
        cg = X + (c.min() + c.max()) / 2 * ux                      # centre du poignet (jeu)
        dx = (HAND[side] - cg) / ux                                # décalage voulu (pixels de l'image)
        for y in range(h_):
            v = Y + y * uy; f = np.clip((v - SHOULDER) / (WRIST - SHOULDER), 0, 1) ** 1.3
            if f <= 0: continue
            gxs = X + xs * ux; wgt = np.clip((np.abs(gxs - 200) - TORSO) / 12, 0, 1) * ((gxs - 200) * sgn > 0)
            src = xs - dx * f * wgt
            for ch in range(4): out[y, :, ch] = np.where(wgt > 0, np.interp(src, xs, im[y, :, ch], left=0, right=0), out[y, :, ch])
            im_y = out[y]
    # épaules à la même hauteur des deux côtés : chaque colonne du côté le plus bas remonte jusqu'au haut de la colonne en miroir
    # (décalage complet en haut, nul au poignet), pour que l'épaule du corps ne dépasse pas
    cxp = (200 - X) / ux; al2 = out[..., 3] > 128; src = out.copy()
    def topy(x):
        q = np.nonzero(al2[:, x])[0]; return q.min() if len(q) else None
    D = np.zeros(w_); A_ = np.zeros(w_)
    for x in range(w_):
        xm = int(round(2 * cxp - x))
        if not (0 <= xm < w_) or abs(x - cxp) < 18: continue
        a_, b_ = topy(x), topy(xm)
        if a_ is None or b_ is None or a_ <= b_: continue
        D[x] = min(a_ - b_, 12); A_[x] = a_
    D = ndimage.gaussian_filter1d(ndimage.maximum_filter1d(D, 7), 3)   # décalage régulier d'une colonne à l'autre (bord lisse)
    for x in range(w_):
        d = D[x]
        if d < .3: continue
        a_ = A_[x] or topy(x) or 0
        ys = np.arange(h_, dtype=np.float32); wy = np.clip(1 - (ys - a_) / (h_ * .55), 0, 1)
        srcy = ys + d * wy
        for ch in range(4): out[:, x, ch] = np.interp(srcy, ys, src[:, x, ch], left=0, right=0)
    cv2.imwrite(fn, out.clip(0, 255).astype(np.uint8))
    print(k, art[k])
open('js/vestes-garcons-art.js', 'w').write('/* généré par tools/vestes-garcons.py — ne pas modifier à la main */\nconst FULL_ART=' + json.dumps(art, ensure_ascii=False) + ';\n')
