"""Reprend les yeux dessinés par Prescillia (docs/references/yeux/planche-yeux.png) en images détourées.
   python3 tools/traceur-yeux.py  ->  assets/yeux/<forme>-<cils>-<d|g>.png, assets/yeux/<forme>-iris-<d|g>.png et js/yeux-art.js

   - 10 formes (rangées 1-2 de la planche), chaque œil (droit d, gauche g) gardé tel qu'elle l'a dessiné.
   - Autour de l'œil, la peau est reconstituée (inpainting) puis retirée : il reste le blanc, le trait, les cils, le pli.
   - L'iris est mis à part (image « iris ») : le jeu le recolore avec la couleur choisie (même clarté, autre teinte).
   - Les cils fins sont séparés du trait d'eye-liner ; les 5 styles de cils (rangée « cils » de la planche) sont reposés
     sur la paupière de chaque forme, en suivant sa courbe.
   Coordonnées en unités du jeu, relatives au centre de l'œil (le jeu le pose à ±52, y 205)."""
import json, os, numpy as np, cv2

SRC = 'docs/references/yeux/planche-yeux.png'
SHAPES = [('ronds', (20, 106, 226, 146)), ('amande', (265, 106, 230, 146)), ('amandelong', (514, 106, 231, 145)),
          ('enfonces', (763, 106, 229, 146)), ('sortants', (1011, 106, 226, 146)), ('petits', (20, 318, 226, 142)),
          ('grands', (265, 317, 230, 142)), ('tombantes', (514, 317, 231, 141)), ('monolides', (763, 317, 229, 142)),
          ('releves', (1011, 317, 226, 141))]
LASHES = [('naturels', (25, 867, 217, 121)), ('longs', (263, 867, 231, 121)), ('epais', (514, 865, 229, 121)),
          ('espaces', (763, 865, 228, 121)), ('recourbes', (1011, 865, 223, 121))]
S = 4                      # agrandissement des images enregistrées
im = cv2.imread(SRC)
os.makedirs('assets/yeux', exist_ok=True)


def skin_alpha(crop):
    """alpha = écart à la peau reconstituée ; couleur démélangée (posée sur n'importe quelle peau)"""
    lab = cv2.cvtColor(crop, cv2.COLOR_BGR2LAB).astype(np.float32)
    guess = np.zeros(crop.shape[:2], np.uint8); guess[6:-6, 6:-6] = 1
    skin = cv2.inpaint(crop, guess, 12, cv2.INPAINT_TELEA)
    for _ in range(3):
        d = np.linalg.norm(lab - cv2.cvtColor(skin, cv2.COLOR_BGR2LAB).astype(np.float32), axis=2)
        m = cv2.dilate((d > 6).astype(np.uint8), np.ones((5, 5), np.uint8))
        skin = cv2.inpaint(crop, m, 10, cv2.INPAINT_TELEA)
    skin = cv2.GaussianBlur(skin, (0, 0), 3)
    d = np.linalg.norm(lab - cv2.cvtColor(skin, cv2.COLOR_BGR2LAB).astype(np.float32), axis=2)
    a = np.clip((d - 3) / 10, 0, 1)
    cf, sf = crop.astype(np.float32), skin.astype(np.float32)
    col = np.clip(sf + (cf - sf) / np.maximum(a, .05)[..., None], 0, 255)
    return a, col, cf


def eye_parts(crop):
    hsv = cv2.cvtColor(crop, cv2.COLOR_BGR2HSV)
    white = ((hsv[..., 2] > 175) & (hsv[..., 1] < 80)).astype(np.uint8)
    n, lb, st, _ = cv2.connectedComponentsWithStats(white, 8)
    H, W = white.shape
    big = [i for i in range(1, n) if st[i][4] >= 8 and st[i][0] > 1 and st[i][1] > 1
           and st[i][0] + st[i][2] < W - 1 and st[i][1] + st[i][3] < H - 1 and st[i][1] > H * .2]
    allw = np.isin(lb, big)
    ys, xs = np.where(allw)
    # blanc de l'œil : morceau qui touche le coin intérieur et morceau qui touche le coin extérieur
    iL, iR = lb[ys[xs.argmin()], xs.min()], lb[ys[xs.argmax()], xs.max()]
    scl = np.isin(lb, [iL, iR])
    ys, xs = np.where(scl)
    box = (xs.min(), ys.min(), xs.max(), ys.max())
    # bords de l'iris rangée par rangée, puis cercle des moindres carrés
    P = []
    for y in range(box[1], box[3] + 1):
        w_ = np.where(scl[y])[0]
        if len(w_) < 2: continue
        g = np.diff(w_); j = int(g.argmax())
        if g[j] > 5: P += [(w_[j] + .5, y), (w_[j + 1] - .5, y)]
    P = np.array(P, np.float64)
    if len(P) < 6: return scl, box, ((box[0]+box[2])/2, (box[1]+box[3])/2, (box[3]-box[1])*.5), white.astype(bool)
    A = np.c_[2 * P, np.ones(len(P))]; b = (P ** 2).sum(1)
    cx, cy, c = np.linalg.lstsq(A, b, rcond=None)[0]; r = np.sqrt(c + cx * cx + cy * cy)
    return scl, box, (cx, cy, r), white.astype(bool)


def lash_split(a, cf):
    """cils fins = traits sombres fins ; trait d'eye-liner = sombre épais"""
    dark = ((cf.mean(2) < 75) & (a > .5)).astype(np.uint8)
    thick = cv2.morphologyEx(dark, cv2.MORPH_OPEN, cv2.getStructuringElement(cv2.MORPH_ELLIPSE, (5, 5)))
    thick = cv2.dilate(thick, np.ones((2, 2), np.uint8))
    return dark.astype(bool) & ~thick.astype(bool), thick.astype(bool)


def lid_top(liner, x0, x1):
    """haut du trait de paupière, colonne par colonne (lissé)"""
    xs = np.arange(x0, x1 + 1); ys = []
    for x in xs:
        c = np.where(liner[:, x])[0]; ys.append(c.min() if len(c) else np.nan)
    ys = np.array(ys, float); ok = ~np.isnan(ys)
    ys = np.interp(xs, xs[ok], ys[ok])
    return xs, np.convolve(np.pad(ys, 3, mode='edge'), np.ones(7) / 7, 'valid')



def opening_top(interior, box):
    """haut de l'ouverture de l'œil colonne par colonne : premier pixel de blanc ou d'iris (lissé)"""
    xs = np.arange(box[0], box[2] + 1); ys = []
    for x in xs:
        c = np.where(interior[:, x])[0]; ys.append(c.min() if len(c) else np.nan)
    ys = np.array(ys, float); ok = ~np.isnan(ys)
    ys = np.interp(xs, xs[ok], ys[ok])
    from scipy.ndimage import median_filter
    ys = median_filter(ys, 7, mode='nearest')
    return xs, np.convolve(np.pad(ys, 2, mode='edge'), np.ones(5) / 5, 'valid')


def lash_band(cf, skl, xs, top):
    """cils = sombre au-dessus du trait de paupière (épaisseur du trait = là où il n'y a pas de cil)"""
    dark = cf.mean(2) < skl * .62
    runs = []
    for x, t in zip(xs, top):
        y = int(round(t)) - 1; n = 0
        while y >= 0 and dark[y, x]: n += 1; y -= 1
        runs.append(n)
    runs = np.array(runs); mid = runs[len(runs) // 5: -len(runs) // 5] if len(runs) > 10 else runs
    T = max(2, np.percentile(mid, 25))
    m = np.zeros(dark.shape, bool)
    for x, t in zip(xs, top):
        y0 = int(max(0, t - T - 30)); y1 = int(max(0, t - T))
        m[y0:y1, x] = dark[y0:y1, x]
    alpha = np.clip((skl - cf.mean(2)) / np.maximum(skl, 1) * 1.7, 0, 1) * cv2.dilate(m.astype(np.uint8), np.ones((2, 2), np.uint8))
    return m, alpha, T

LASH_IDS = ['naturels', 'longs', 'epais', 'espaces', 'recourbes']


# ---------- formes ----------
centers, out, lids, irisL = [], {}, {}, []
for sid, (x, y, w, h) in SHAPES:
    for side in ('g', 'd'):
        hx = x + (0 if side == 'g' else w // 2)
        crop = im[y:y + h, hx:hx + w // 2].copy()
        a, col, cf = skin_alpha(crop)
        scl, box, (cx, cy, r), white = eye_parts(crop)
        thin, liner = lash_split(a, cf)
        # œil = ce qui touche le blanc et le trait, dans une ellipse autour de l'œil (pas le sourcil ni le nez)
        yy, xx = np.mgrid[:a.shape[0], :a.shape[1]]
        ex, ey = (box[0] + box[2]) / 2, (box[1] + box[3]) / 2
        bw, bh = box[2] - box[0], box[3] - box[1]
        ell = ((xx - ex) / (bw * .9)) ** 2 + ((yy - ey + bh * .1) / (bh * 1.35)) ** 2
        zone = np.clip((1.15 - ell) / .3, 0, 1)
        liner = liner & (yy > box[1] - bh * .35) & (zone > .5)        # le trait près de l'œil, pas le sourcil
        core = cv2.dilate((scl | liner).astype(np.uint8), np.ones((3, 3), np.uint8)).astype(bool)
        skL0 = cv2.GaussianBlur(cv2.inpaint(cf.astype(np.uint8), cv2.dilate(((a > .4)).astype(np.uint8), np.ones((5, 5), np.uint8)), 8, cv2.INPAINT_TELEA).astype(np.float32).mean(2), (0, 0), 6)
        inc0 = (xx - cx) ** 2 + (yy - cy) ** 2 <= (r + 1) ** 2
        interior = scl | (inc0 & (a > .5))
        lx, ly = opening_top(interior, box)
        thin0 = thin; thin = np.zeros(a.shape, bool)
        lyF = np.interp(np.arange(a.shape[1]), lx, ly)             # haut de l'ouverture, toutes colonnes
        hgt = lyF[None, :] - yy                                      # hauteur au-dessus de la paupière
        outer = 1 if side == 'd' else -1
        colok = (xx >= box[0] - 2) & (xx <= box[2] + 2) if True else None
        colok = colok | ((xx - ex) * outer > 0) & ((xx - ex) * outer < bw * .75)
        lm = thin0 & (hgt > 1) & (hgt < 30) & colok
        cand = (scl | (cf.mean(2) < skL0 * .55) | (inc0 & (a > .5))) & (zone > .5)
        n, lb, st, _ = cv2.connectedComponentsWithStats(cand.astype(np.uint8), 8)
        E = np.isin(lb, [l for l in np.unique(lb[core]) if l]) & ~thin
        E = cv2.morphologyEx(E.astype(np.uint8), cv2.MORPH_CLOSE, np.ones((3, 3), np.uint8))
        E = cv2.dilate(E, np.ones((2, 2), np.uint8)).astype(bool)
        zone = zone * (yy > box[1] - bh * .45)
        # autour : seulement l'ombre (pli de la paupière, creux), en brun très sombre transparent
        sf_ = cf - (cf - col) * a[..., None]
        Lc, Ls = cf.mean(2), np.clip((cf - (cf - col) * 0).mean(2), 1, 255)
        skL = cv2.inpaint(cf.astype(np.uint8), E.astype(np.uint8), 6, cv2.INPAINT_TELEA).astype(np.float32).mean(2)
        skL = cv2.GaussianBlur(skL, (0, 0), 6)
        rat = (skL0 - Lc) / np.maximum(skL0, 1)
        far = cv2.dilate(((rat > .3) & ~E).astype(np.uint8), np.ones((9, 9), np.uint8)).astype(bool)   # sourcil et son contour : rien
        sh = np.clip(rat * 1.5, 0, .45) * ~far * zone * ~E * ~thin
        sh = cv2.GaussianBlur(sh.astype(np.float32), (0, 0), 1)
        Hh, Ww = sh.shape; edge = np.minimum.reduce([xx, Ww - 1 - xx, yy, Hh - 1 - yy]).astype(np.float32)
        sh = sh * np.clip(edge / 14, 0, 1)                         # rien de coupé net au bord de la case
        # ouverture de l'œil (blanc + iris + ombre de la paupière sur le blanc) : pleine, avec les vrais pixels
        from scipy.ndimage import binary_fill_holes
        hsv_ = cv2.cvtColor(crop, cv2.COLOR_BGR2HSV)
        lab_ = cv2.cvtColor(crop, cv2.COLOR_BGR2LAB).astype(np.float32)
        skLab = cv2.cvtColor(cv2.GaussianBlur(cv2.inpaint(crop, cv2.dilate((a > .4).astype(np.uint8), np.ones((5, 5), np.uint8)), 8, cv2.INPAINT_TELEA), (0, 0), 6), cv2.COLOR_BGR2LAB).astype(np.float32)
        light = ((lab_[..., 0] - skLab[..., 0] > 6) | (lab_[..., 2] - skLab[..., 2] < -10)) & (zone > .3)   # blanc ombré, coin intérieur rosé
        seed = (scl | (inc0 & (a > .5))) & (zone > .3)
        light = light & cv2.dilate(seed.astype(np.uint8), cv2.getStructuringElement(cv2.MORPH_ELLIPSE, (9, 9))).astype(bool) & ~(yy < cy - r * 1.05)
        n_, l_, _, _ = cv2.connectedComponentsWithStats((light | seed).astype(np.uint8), 8)
        inside = np.isin(l_, [l for l in np.unique(l_[seed]) if l])
        inside = binary_fill_holes(cv2.morphologyEx(inside.astype(np.uint8), cv2.MORPH_CLOSE, cv2.getStructuringElement(cv2.MORPH_ELLIPSE, (7, 7))))
        near = cv2.dilate(inside.astype(np.uint8), np.ones((9, 9), np.uint8)).astype(bool)
        darkn = ((cf.mean(2) < skL0 * .72) | ((cf.mean(2) < skL0 * .9) & cv2.dilate(inside.astype(np.uint8), np.ones((5, 5), np.uint8)).astype(bool))) & near & (zone > .3)      # trait et cils autour de l'ouverture (coin intérieur compris)
        # tout ce qui est entouré par le trait de l'œil fait partie de l'œil (ombre du blanc sous la paupière comprise)
        encl = binary_fill_holes(cv2.morphologyEx((darkn | inside).astype(np.uint8), cv2.MORPH_CLOSE, np.ones((3, 3), np.uint8)))
        inside = inside | (encl & ~darkn)
        E = (E & ((cf.mean(2) < skL0 * .72) | inside)) | darkn | inside
        a = np.where(inside, 1.0, a)
        col = np.where(inside[..., None], cf, col)
        col = np.where(E[..., None], col, np.array([30, 20, 26], np.float32))
        a = np.where(E, a, sh)
        # iris : dans le cercle, ni peau, ni blanc (les reflets restent dans l'image du dessus)
        inc = (xx - cx) ** 2 + (yy - cy) ** 2 <= (r + .8) ** 2
        iris = inc & E & (a > .5) & ~white & (cf.mean(2) < 150)
        iris = cv2.dilate(iris.astype(np.uint8), np.ones((3, 3), np.uint8)).astype(bool) & inc
        ia = cv2.GaussianBlur(iris.astype(np.float32), (0, 0), .6)
        top = np.clip(a - ia, 0, 1)
        big = lambda v, i=cv2.INTER_CUBIC: cv2.resize(v, None, fx=S, fy=S, interpolation=i)
        # cadre commun (même pour toutes les images de cet œil)
        ys, xs = np.where(a > .04); X0, Y0, X1, Y1 = max(0, xs.min() - 6), max(0, ys.min() - 22), min(a.shape[1], xs.max() + 8), min(a.shape[0], ys.max() + 2)
        centers.append((sid, side, hx + ex, y + ey))
        def clean(A):
            n_, l_, st_, _ = cv2.connectedComponentsWithStats((A > .15).astype(np.uint8), 8)
            small = np.isin(l_, [i for i in range(1, n_) if st_[i][4] < 12])
            return A * ~small
        def save(name, A, C):
            A = clean(A)
            rgba = np.dstack([big(C), np.clip(big(A, cv2.INTER_LINEAR), 0, 1) * 255]).clip(0, 255).astype(np.uint8)
            cv2.imwrite(f'assets/yeux/{name}.png', rgba[Y0 * S:Y1 * S, X0 * S:X1 * S], [cv2.IMWRITE_PNG_COMPRESSION, 9])
        save(f'{sid}-iris-{side}', ia, cf)
        irisL.append(cf.mean(2)[iris])
        save(f'{sid}-{side}', top, col)
        # ligne de la paupière (pour poser les cils des autres styles), du coin intérieur au coin extérieur
        # haut du trait d'eye-liner : haut de l'œil une fois les cils fins retirés (ouverture morphologique), lissé
        Eo = cv2.morphologyEx((E & (a > .5)).astype(np.uint8), cv2.MORPH_OPEN, cv2.getStructuringElement(cv2.MORPH_ELLIPSE, (5, 5))).astype(bool) & (yy > cy - r * 1.45)
        LX, LY = [], []
        for x_ in range(box[0], box[2] + 1):
            c_ = np.where(Eo[:, x_])[0]
            if len(c_): LX.append(x_); LY.append(c_.min())
        from scipy.ndimage import median_filter
        LYs = median_filter(np.array(LY, float), 9, mode='nearest')
        cf2 = np.polyfit(LX, LYs, 4)
        P = [(float(x_), float(np.polyval(cf2, x_))) for x_ in np.linspace(box[0], box[2], 9)]
        if side == 'g': P = P[::-1]
        lids[sid + side] = [[round((px - ex) * 1, 2), round((py - ey) * 1, 2)] for px, py in P]
        out.setdefault(sid, {})[side] = [X0 - ex, Y0 - ey, X1 - X0, Y1 - Y0, cx - ex, cy - ey, r]
        print(sid, side, 'iris r', round(r, 1), 'box', box)

# échelle commune : distance moyenne entre les deux yeux d'une case = 2 × 52 unités du jeu
half = np.mean([abs(centers[i + 1][2] - centers[i][2]) / 2 for i in range(0, len(centers), 2)])
K = 52 / half
art = {sid: {s: [round(v * K, 2) for v in vals] + [[round(c * K, 2) for c in q] for q in lids[sid + s]] for s, vals in d.items()} for sid, d in out.items()}
js = ('/* yeux décalqués par tools/traceur-yeux.py sur docs/references/yeux/ — ne pas modifier à la main\n'
      '   [x, y, l, h] de l\'image par rapport au centre de l\'œil, centre x/y et rayon de l\'iris, puis 9 points de la paupière\n'
      '   (coin intérieur → extérieur) pour les cils dessinés par le jeu (unités du jeu) */\n'
      'const EYE_ART=' + json.dumps(art, separators=(',', ':')) + ';\nconst EYE_IRIS_LUM=' + json.dumps([round(float(np.percentile(np.concatenate(irisL), q)) / 255, 3) for q in (4, 55, 98)]) + ';\nconst EYE_LASHES=' + json.dumps(LASH_IDS) + ';\n')
open('js/yeux-art.js', 'w').write(js)
print('K', K)
