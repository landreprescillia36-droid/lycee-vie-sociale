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
     'gdoudoune': ((1053, 752, 1196, 1000), (1101, 742), (1141, 742), 'Doudoune')}
TEE_MID, TEE_D = (120.5, 93.0), 41.0        # yeux de la case 1 de la planche des t-shirts
EYE, WRIST, SX = 152, 456, 1.12
UP = {'gvarsity': 14}                       # veste universitaire : épaules plus hautes (couvrent celles du corps)            # jeu : hauteur des yeux, des poignets ; étirement horizontal
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
    print(k, art[k])
open('js/vestes-garcons-art.js', 'w').write('/* généré par tools/vestes-garcons.py — ne pas modifier à la main */\nconst FULL_ART=' + json.dumps(art, ensure_ascii=False) + ';\n')
