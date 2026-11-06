"""Coupe « bouclé court » des garçons copiée pixel par pixel sur le modèle de Prescillia
   (docs/references/coiffures/modele-boucle-court-garcon.png, 1re case).
   La case est recalée sur notre rendu (mêmes yeux), puis les cheveux = ce qui diffère du même nova chauve
   (tools/coupe-chauve.png, rendu 720 px du viewBox PVB) au-dessus des oreilles. Sur la peau (dégradé des tempes),
   la transparence vient de l'écart de clarté avec la peau ; sur le fond, de l'écart avec le fond.
   Sortie : assets/coiffures/gtaper-modele.png + js/coupe-modele.js (position en coordonnées de tête des garçons)."""
import json, os, sys, numpy as np, cv2
from scipy import ndimage
R = os.path.join(os.path.dirname(__file__), '..')
a = cv2.imread(os.path.join(R, 'docs/references/coiffures/modele-boucle-court-garcon.png'))[11:365, 28:382]
b = cv2.imread(os.path.join(R, 'tools/coupe-chauve.png'))
s = 2.046; M = np.float32([[s, 0, 359.55 - 191.8 * s], [0, s, 341.05 - 158.65 * s]])
w = cv2.warpAffine(a, M, (720, 720), flags=cv2.INTER_CUBIC, borderValue=(244, 236, 230)).astype(np.float32)
b = b.astype(np.float32)
H, W = 720, 720; yy, xx = np.mgrid[:H, :W]
Lw, Lb = w.mean(2), b.mean(2)
bgc = np.median(w[5:30, 5:30].reshape(-1, 3), 0)                 # fond bleu clair du modèle
isbg_b = np.linalg.norm(b - np.median(b[5:30, 5:30].reshape(-1, 3), 0), axis=2) < 18   # fond dans notre rendu
HAIR_L = 55.0
# sur le fond : alpha = écart au fond
a_bg = np.clip(np.linalg.norm(w - bgc, axis=2) / np.linalg.norm(bgc - np.array([30, 45, 70.])), 0, 1)
# sur la peau : alpha = assombrissement par rapport à la peau du nova chauve
a_sk = np.clip((Lb - Lw - 6) / np.maximum(Lb - HAIR_L, 20), 0, 1)
alpha = np.where(isbg_b, a_bg, a_sk)
Ylim = 300                                                       # au-dessus du haut des oreilles
alpha[yy > Ylim] = 0
alpha[(yy > Ylim - 22)] *= np.clip((Ylim - yy[(yy > Ylim - 22)]) / 22, 0, 1)
# sourcils (identiques dans les deux images) : rien
alpha = alpha * (np.abs(Lw - Lb) > 8)
m = alpha > .15
lab, n = ndimage.label(m); sz = ndimage.sum(m, lab, range(1, n + 1)); keep = np.isin(lab, [i + 1 for i in np.where(sz > 400)[0]])
alpha = alpha * ndimage.binary_dilation(keep, iterations=2)
alpha[(yy > 258) & (np.abs(xx - 360) < 140)] = 0                # sourcils et front : rien
# masse des cheveux : pleine (les reflets clairs des boucles ne deviennent pas transparents)
solid = ndimage.binary_fill_holes(cv2.morphologyEx((alpha > .45).astype(np.uint8), cv2.MORPH_CLOSE, cv2.getStructuringElement(cv2.MORPH_ELLIPSE, (15, 15))))
solid = ndimage.binary_erosion(solid, iterations=2)
alpha = np.where(solid, 1.0, alpha)
alpha = cv2.GaussianBlur(alpha.astype(np.float32), (0, 0), .6)
# couleur des cheveux démélangée (fond ou peau retirés)
base = np.where(isbg_b[..., None], bgc, b)
col = np.clip(base + (w - base) / np.maximum(alpha, .08)[..., None], 0, 255)
col = np.where((alpha > .9)[..., None], w, col)
ys, xs = np.where(alpha > .02); y0, y1, x0, x1 = ys.min(), ys.max() + 1, xs.min(), xs.max() + 1
rgba = np.dstack([col, alpha * 255])[y0:y1, x0:x1].clip(0, 255).astype(np.uint8)
cv2.imwrite(os.path.join(R, 'assets/coiffures/gtaper-modele.png'), rgba, [cv2.IMWRITE_PNG_COMPRESSION, 9])
L = col.mean(2)[alpha > .8] / 255; lum = [round(float(np.percentile(L, q)), 3) for q in (3, 50, 97)]
# 720 px = viewBox PVB (80 20 240 240) ; tête des garçons : translate(90,16.2) scale(.55)
loc = lambda X, Y: ((80 + X / 3 - 90) / .55, (20 + Y / 3 - 16.2) / .55)
lx0, ly0 = loc(x0, y0); lx1, ly1 = loc(x1, y1)
out = {'img': [round(lx0, 2), round(ly0, 2), round(lx1 - lx0, 2), round(ly1 - ly0, 2)], 'lum': lum, 'main': '#%02x%02x%02x' % tuple(int(v) for v in np.median(col[alpha > .9], 0)[::-1])}
open(os.path.join(R, 'js/coupe-modele.js'), 'w').write('/* coupe bouclée courte copiée sur le modèle de Prescillia par tools/traceur-coupe-modele.py — ne pas modifier à la main */\nconst COUPE_MODELE=' + json.dumps(out) + ';\n')
print(out, rgba.shape)
