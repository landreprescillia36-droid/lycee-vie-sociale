"""Coupes courtes des garçons copiées sur le modèle de Prescillia (docs/references/coiffures/garcons/modele-coupes-courtes.png,
   écran « Forme du visage » : chaque visage porte une des 3 coupes).
   python3 tools/traceur-coupes-garcons.py  ->  assets/coiffures/<coupe>-modele.png + js/coupes-garcons.js

   - Chaque case est recalée sur notre rendu (mêmes yeux que tools/coupe-chauve.png, rendu 720 px du viewBox PVB).
   - Les cheveux = ce qui s'écarte de la peau ou du fond reconstitués autour (inpainting) : le dégradé des tempes
     garde sa transparence, la masse des cheveux reste pleine.
   - Le jeu pose ensuite la coupe sur le crâne de chaque forme de visage (coupeSVG, comme le « Taper »)."""
import json, os, numpy as np, cv2
from scipy import ndimage
R = os.path.join(os.path.dirname(__file__), '..')
SRC = cv2.imread(os.path.join(R, 'docs/references/coiffures/garcons/modele-coupes-courtes.png'))
# coupe : case (coin haut-gauche de la vignette), forme du visage de la case
COUPES = {'gvagues': (90, 250), 'gbouclette': (460, 250), 'gcourt': (825, 250)}
EYE_REF = (162.0, 113.0, 65.0)          # milieu des yeux et écart dans la 1re case (repéré à la main)
EYE_GAME = (359.5, 350.0, 173.0)        # même chose dans tools/coupe-chauve.png
HAIR_L = 55.0
out = {}
c0 = SRC[250:450, 90:410]
tpl = c0[int(EYE_REF[1]) - 22:int(EYE_REF[1]) + 22, int(EYE_REF[0]) - 60:int(EYE_REF[0]) + 60]
for cid, (x0, y0) in COUPES.items():
    cell = SRC[y0 - 10:y0 + 210, x0 - 10:x0 + 330]
    # yeux de la case : recalage sur la 1re case (même gabarit d'yeux)
    r = cv2.matchTemplate(cell, tpl, cv2.TM_CCOEFF_NORMED); _, _, _, mx = cv2.minMaxLoc(r)
    ex, ey = mx[0] + 60, mx[1] + 22
    S = 4
    C = cv2.resize(cell, None, fx=S, fy=S, interpolation=cv2.INTER_CUBIC)
    ex, ey = ex * S, ey * S
    H, W = C.shape[:2]; yy, xx = np.mgrid[:H, :W]
    Lc = C.astype(np.float32).mean(2)
    base = C.copy()
    for _ in range(4):
        d = np.abs(Lc - base.astype(np.float32).mean(2))
        m = cv2.dilate(((d > 10) | (Lc < 120)).astype(np.uint8), np.ones((9, 9), np.uint8))
        m[yy > ey + 60] = 0
        base = cv2.inpaint(C, m, 12, cv2.INPAINT_TELEA)
    base = cv2.GaussianBlur(base, (0, 0), 6)
    Lb = base.astype(np.float32).mean(2)
    alpha = np.clip((Lb - Lc - 8) / np.maximum(Lb - HAIR_L, 30), 0, 1)
    # sourcils, yeux, oreilles : rien (seules les tempes descendent jusqu'au-dessus des yeux)
    half = EYE_REF[2] * S * .88
    alpha[(yy > ey - 30 * S) & (np.abs(xx - ex) < half)] = 0
    alpha[yy > ey - 12 * S] = 0
    alpha[(yy > ey - 22 * S)] *= np.clip((ey - 12 * S - yy[(yy > ey - 22 * S)]) / (10 * S), 0, 1)
    mk = alpha > .15
    lab, n = ndimage.label(mk); sz = ndimage.sum(mk, lab, range(1, n + 1))
    keep = np.isin(lab, [i + 1 for i in np.where(sz > 2000)[0]])
    alpha = alpha * ndimage.binary_dilation(keep, iterations=4)
    solid = ndimage.binary_fill_holes(cv2.morphologyEx((alpha > .5).astype(np.uint8), cv2.MORPH_CLOSE, cv2.getStructuringElement(cv2.MORPH_ELLIPSE, (25, 25))))
    solid = ndimage.binary_erosion(solid, iterations=5)
    alpha = np.where(solid, 1.0, alpha)
    alpha = cv2.GaussianBlur(alpha.astype(np.float32), (0, 0), 1.2)
    Cf, Bf = C.astype(np.float32), base.astype(np.float32)
    col = np.clip(Bf + (Cf - Bf) / np.maximum(alpha, .08)[..., None], 0, 255)
    col = np.where((alpha > .9)[..., None], Cf, col)
    # bords fondus : pas de reflet clair qui viendrait du fond (les cheveux restent foncés)
    Lk = col.mean(2, keepdims=True); col = np.where(Lk > 70, col * 70 / np.maximum(Lk, 1), col)
    # vers le repère 720 px de notre rendu
    k = EYE_GAME[2] / (EYE_REF[2] * S)
    M = np.float32([[k, 0, EYE_GAME[0] - ex * k], [0, k, EYE_GAME[1] - ey * k]])
    rgba = np.dstack([col, alpha * 255]).astype(np.float32)
    w = cv2.warpAffine(rgba, M, (720, 720), flags=cv2.INTER_AREA, borderValue=0)
    a = w[..., 3]
    ys, xs = np.where(a > 5); Y0, Y1, X0, X1 = ys.min(), ys.max() + 1, xs.min(), xs.max() + 1
    img = w[Y0:Y1, X0:X1].clip(0, 255).astype(np.uint8)
    cv2.imwrite(os.path.join(R, f'assets/coiffures/{cid}-modele.png'), img, [cv2.IMWRITE_PNG_COMPRESSION, 9])
    sel = img[..., 3] > 200
    L = img[..., :3].astype(np.float32).mean(2)[sel] / 255
    lum = [round(float(np.percentile(L, q)), 3) for q in (3, 50, 97)]
    loc = lambda X, Y: ((80 + X / 3 - 90) / .55, (20 + Y / 3 - 16.2) / .55)
    lx0, ly0 = loc(X0, Y0); lx1, ly1 = loc(X1, Y1)
    out[cid] = {'img': [round(lx0, 2), round(ly0, 2), round(lx1 - lx0, 2), round(ly1 - ly0, 2)], 'lum': lum,
                'main': '#%02x%02x%02x' % tuple(int(v) for v in np.median(img[..., :3][sel], 0)[::-1])}
    print(cid, (ex / S, ey / S), out[cid], img.shape)
open(os.path.join(R, 'js/coupes-garcons.js'), 'w').write(
    '/* coupes courtes des garçons copiées sur le modèle de Prescillia par tools/traceur-coupes-garcons.py — ne pas modifier à la main */\n'
    'const COUPES_G=' + json.dumps(out) + ';\n')
