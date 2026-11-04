"""Décalque des jeans des filles sur docs/references/vetements/planche-jeans-filles.png (2e ligne, vus en pied) :
chaque jean est découpé tel qu'il est dessiné (pixels de la planche, fond, peau et chaussures retirés) dans assets/bas/jean-<coupe>.png,
et ses repères (haut de la ceinture, bas, centre, demi-largeur à la taille) sont écrits dans js/jeans-art.js."""
import json, os
import numpy as np
from PIL import Image, ImageFilter
from scipy import ndimage
R = os.path.join(os.path.dirname(__file__), '..')
im = Image.open(os.path.join(R, 'docs/references/vetements/planche-jeans-filles.png')).convert('RGB')
A = np.array(im).astype(float)
names = ['slim', 'mom', 'jdroit', 'jlarge', 'bootcut', 'bermuda']
Y0, Y1 = 372, 790
W = im.size[0] / 6
art = {}
for i, n in enumerate(names):
    x0, x1 = int(i * W), int((i + 1) * W)
    a = A[Y0:Y1, x0:x1]; r, g, b = a[..., 0], a[..., 1], a[..., 2]
    den = (b > r + 8) & (b > 50)
    m = ndimage.binary_closing(den, iterations=2)
    lab, k = ndimage.label(m); sz = ndimage.sum(m, lab, range(1, k + 1)); m = lab == (np.argmax(sz) + 1)
    m = ndimage.binary_fill_holes(m)
    # bord doux : alpha selon le bleu sur la frange extérieure
    soft = np.clip((b - r - 2) / 16, 0, 1)
    edge = m & ~ndimage.binary_erosion(m, iterations=1)
    al = np.where(m, 1.0, 0.0); al[edge] = np.maximum(soft[edge], .55)
    ys, xs = np.where(m); t, bt, l, rr = ys.min(), ys.max(), xs.min(), xs.max()
    rgba = np.dstack([a, al * 255]).astype(np.uint8)[t:bt + 1, l:rr + 1]
    Image.fromarray(rgba, 'RGBA').save(os.path.join(R, f'assets/bas/jean-{n}.png'))
    top = [np.where(m[y])[0] for y in range(t + 2, t + 8)]
    cx = float(np.median([(q.min() + q.max()) / 2 for q in top])) - l
    hw = float(np.median([(q.max() - q.min()) / 2 for q in top]))
    hip = max((np.where(m[y])[0].max() - np.where(m[y])[0].min()) / 2 for y in range(t, t + int((bt - t) * .25)))
    art[n] = dict(w=int(rr - l + 1), h=int(bt - t + 1), cx=round(cx, 1), waist=round(hw, 1), hip=round(float(hip), 1))
    print(n, art[n])
open(os.path.join(R, 'js/jeans-art.js'), 'w').write('/* jeans décalqués par tools/traceur-jeans.py sur docs/references/vetements/planche-jeans-filles.png — ne pas modifier à la main */\nconst JEAN_ART=' + json.dumps(art, separators=(',', ':')) + ';\n')
