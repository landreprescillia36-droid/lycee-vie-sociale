"""Contour net des hauts des garçons (assets/hauts/*.png).
   Le décalque ligne par ligne laissait un bord en dents de scie (épaules ondulées, ourlets bosselés) et des pixels
   de bord à la couleur du fond de la planche. Ici : la silhouette est lissée (petites dents retirées, formes gardées),
   le bord est anti-crénelé sur 1 à 2 pixels, et les pixels du bord prennent la couleur du tissu voisin.
   python3 tools/hauts-contours.py  (puis tools/bandes-garcons.py, qui part des t-shirts lissés)"""
import os, glob, numpy as np, cv2
from scipy import ndimage
D = os.path.join(os.path.dirname(os.path.abspath(__file__)), '..', 'assets', 'hauts')
for f in sorted(glob.glob(os.path.join(D, '*.png'))):
    if os.path.basename(f).startswith('bandes-'): continue
    a = cv2.imread(f, cv2.IMREAD_UNCHANGED)
    al = a[..., 3].astype(np.float32) / 255
    m = (al > .5).astype(np.float32)
    # silhouette lissée : les dents de 2-3 px disparaissent, les coins du col et des manches restent
    ms = cv2.GaussianBlur(m, (0, 0), 2.6) > .5
    ms = ndimage.binary_fill_holes(ms) | (m > 0) & ndimage.binary_erosion(ms, iterations=2)   # trous du dessin (anses, poches) gardés
    new = cv2.GaussianBlur(ms.astype(np.float32), (0, 0), .8)
    new = np.clip((new - .5) * 1.6 + .5, 0, 1)
    new = np.where(ndimage.binary_erosion(ms, iterations=2), np.maximum(new, al), new)
    # couleur : tissu bien plein = modèle ; tout le reste (bord) pris sur le tissu voisin
    solid = ndimage.binary_erosion(al > .97, iterations=2)
    rgb = cv2.inpaint(np.ascontiguousarray(a[..., :3]), (~solid).astype(np.uint8), 3, cv2.INPAINT_TELEA)
    keep = solid | (ndimage.binary_erosion(ms, iterations=3) & (al > .97))
    out = np.zeros_like(a); out[..., :3] = np.where(keep[..., None], a[..., :3], rgb)
    out[..., 3] = np.clip(new * 255, 0, 255).astype(np.uint8)
    out[out[..., 3] == 0, :3] = 0
    cv2.imwrite(f, out, [cv2.IMWRITE_PNG_COMPRESSION, 9])
    print(os.path.basename(f))
