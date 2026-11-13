"""T-shirt à bandes des garçons : le t-shirt de la planche (tee-noir / tee-blanc) + 3 fines bandes qui partent du col,
   suivent le dessus de l'épaule et descendent sur le côté de la manche jusqu'à l'ourlet (comme sur la planche).
   Les bandes sont tracées à distance fixe du bord du t-shirt : nettes, sans bavure.
   python3 tools/bandes-garcons.py  ->  assets/hauts/bandes-noir.png, bandes-blanc.png (même cadre que tee-*.png)"""
import os, numpy as np, cv2
from scipy import ndimage
D = os.path.join(os.path.dirname(os.path.abspath(__file__)), '..', 'assets', 'hauts')
def bandes(src, dst, col):
    a = cv2.imread(os.path.join(D, src), cv2.IMREAD_UNCHANGED).astype(np.float32)
    H, W = a.shape[:2]; m = a[..., 3] > 127
    ys, xs = np.where(m); cx = (xs.min() + xs.max()) / 2; top = ys.min()
    # encolure : largeur du vide du col sur la ligne du haut
    row = np.where(m[top + 3])[0]; inner = row[(row > cx - W * .3) & (row < cx + W * .3)]
    neck = max(abs(inner.min() - cx), abs(inner.max() - cx)) if len(inner) else W * .12
    gaps = [(x, ) for x in range(W)]
    # ourlet des manches : plus bas point du bord extérieur
    hem = max(np.where(m[:, :int(xs.min() + 12)].any(1))[0].max(), np.where(m[:, int(xs.max() - 12):].any(1))[0].max())
    dist, (iy, ix) = ndimage.distance_transform_edt(m, return_indices=True)
    by, bx = iy.astype(np.float32), ix.astype(np.float32)
    ok = m & (by < hem - 3) & (np.abs(bx - cx) > neck + 6) & (np.abs(bx - cx) > np.abs(np.arange(W)[None, :] - cx) - 1)
    # les bandes ne passent pas sous l'aisselle : seulement le bord du dessus et l'extérieur
    S = W / 202.0   # pixels par unité du jeu
    stripes = np.zeros((H, W), np.float32)
    for c in (3.2, 5.5, 7.8):
        w = .8
        stripes = np.maximum(stripes, np.clip(1 - np.abs(dist / S - c) / w, 0, 1) * 1.6)
    stripes = np.clip(stripes, 0, 1) * ok
    # début et fin en douceur (pas de bout carré au col)
    stripes = cv2.GaussianBlur(stripes, (0, 0), .5)
    out = a.copy()
    for k in range(3): out[..., k] = a[..., k] * (1 - stripes) + col[k] * stripes
    cv2.imwrite(os.path.join(D, dst), np.clip(out, 0, 255).astype(np.uint8), [cv2.IMWRITE_PNG_COMPRESSION, 9])
bandes('tee-noir.png', 'bandes-noir.png', (236, 238, 240))
bandes('tee-blanc.png', 'bandes-blanc.png', (36, 33, 31))
