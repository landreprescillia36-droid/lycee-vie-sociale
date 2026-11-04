"""Nettoie le haut des yeux (assets/yeux/<forme>-<g|d>.png) sous le trait de paupière dessiné par le jeu :
retire les restes du trait d'origine (« pâtés » sombres, surtout aux coins) et les éclats de blanc au-dessus de la paupière.
À lancer avant tools/yeux-blanc-haut.py."""
import json, os, re
import numpy as np
from PIL import Image
R = os.path.join(os.path.dirname(__file__), '..')
ART = json.loads(re.search(r'const EYE_ART=(\{.*?\});', open(os.path.join(R, 'js', 'yeux-art.js')).read(), re.S).group(1))
for k, sides in ART.items():
    for sd, A in sides.items():
        fe = os.path.join(R, 'assets', 'yeux', f'{k}-{sd}.png')
        e = np.array(Image.open(fe).convert('RGBA')).astype(float)
        H, W = e.shape[:2]; x0, y0, w, h = A[:4]; u = W / w
        P = sorted(A[7:], key=lambda q: q[0]); px = np.array([(q[0] - x0) / w * W for q in P]); py = np.array([(q[1] - y0) / h * H for q in P])
        X = np.arange(W); yl = np.interp(X, px, py)          # au-delà des coins : hauteur du coin
        Y = np.arange(H)[:, None]
        lum = e[..., :3].mean(axis=2); al = e[..., 3]
        above = Y < (yl[None, :] - 0.5 * u)
        dark = (lum < 120) & (Y < yl[None, :] + 2.6 * u)
        cut = (above | dark) & (al > 0)
        e[..., 3] = np.where(cut, 0, al)
        Image.fromarray(e.astype(np.uint8)).save(fe)
        # l'iris ne doit pas dépasser au-dessus de la paupière (fondu sous le trait)
        fi = os.path.join(R, 'assets', 'yeux', f'{k}-iris-{sd}.png')
        i = np.array(Image.open(fi).convert('RGBA')).astype(float)
        kk = np.clip((Y - (yl[None, :] + 0.3 * u)) / (0.8 * u), 0, 1)
        i[..., 3] = i[..., 3] * kk
        Image.fromarray(i.astype(np.uint8)).save(fi)
        print(k, sd, int(cut.sum()))
