"""Remplit en blanc le haut de l'œil laissé couleur peau entre l'iris et la paupière (coin extérieur surtout).
Limite haute = courbe de la paupière (9 points de EYE_ART, js/yeux-art.js) ; limite basse = bas du blanc ou de l'iris.
On ne touche qu'aux pixels transparents dans l'image de l'œil ET dans celle de l'iris."""
import json, os, re
import numpy as np
from PIL import Image
from scipy import ndimage
R = os.path.join(os.path.dirname(__file__), '..')
src = open(os.path.join(R, 'js', 'yeux-art.js')).read()
ART = json.loads(re.search(r'const EYE_ART=(\{.*?\});', src, re.S).group(1))
for k, sides in ART.items():
    for sd, A in sides.items():
        fe = os.path.join(R, 'assets', 'yeux', f'{k}-{sd}.png'); fi = os.path.join(R, 'assets', 'yeux', f'{k}-iris-{sd}.png')
        e = np.array(Image.open(fe).convert('RGBA')).astype(float); ia = np.array(Image.open(fi).convert('RGBA'))[..., 3].astype(float)
        H, W = e.shape[:2]; x0, y0, w, h = A[:4]; P = sorted(A[7:], key=lambda q: q[0])
        px = np.array([(q[0] - x0) / w * W for q in P]); py = np.array([(q[1] - y0) / h * H for q in P])
        ea = e[..., 3]; filled = 0
        sclera = (ea > 200) & (e[..., :3].min(axis=2) > 200)
        if not sclera.any(): continue
        white = np.median(e[sclera][:, :3], axis=0)
        for x in range(int(np.ceil(px.min())), int(px.max()) + 1):
            if x < 0 or x >= W: continue
            top = np.interp(x, px, py) + 4.5   # sous le trait de la paupière
            col = np.where(sclera[:, x] | (ia[:, x] > 60))[0]  # blanc de l'œil ou iris (pas le trait de la paupière du bas)
            col = col[col > top]
            if not len(col): continue
            for y in range(int(np.ceil(top)), col.min()):
                if 0 <= y < H and ea[y, x] < 120 and ia[y, x] < 60:
                    a = 255.0
                    e[y, x, :3] = e[y, x, :3] * (ea[y, x] / 255) + white * (1 - ea[y, x] / 255); e[y, x, 3] = a; filled += 1
        if filled:
            Image.fromarray(e.astype(np.uint8)).save(fe)
        print(k, sd, filled, 'px')
