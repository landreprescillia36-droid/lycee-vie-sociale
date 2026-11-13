"""Bords des hauts des garçons (assets/hauts/*.png) : le décalque a laissé un contour en escalier, avec un liseré clair/foncé
   qui donnait des « ombres » dentelées le long des manches et des épaules.
   python3 tools/lisse-bords-hauts.py [fichiers…]
   - la silhouette est lissée (flou puis seuil) ;
   - la bande du bord (13 px) reprend la couleur du tissu juste à l'intérieur, sans le liseré ;
   - le bord est ensuite adouci (anticrénelage)."""
import sys, glob, numpy as np, cv2
from scipy import ndimage
files = sys.argv[1:] or sorted(glob.glob('assets/hauts/*.png'))
for f in files:
    im = cv2.imread(f, cv2.IMREAD_UNCHANGED).astype(np.float32)
    a = im[..., 3] / 255
    m = a > .5
    sm = cv2.GaussianBlur(m.astype(np.float32), (0, 0), 2.6) > .5          # silhouette lissée
    sm = ndimage.binary_fill_holes(sm) & ~(ndimage.binary_fill_holes(m) & ~m & ~ndimage.binary_dilation(m, iterations=3))
    inner = ndimage.binary_erosion(sm & m, iterations=13)                     # tissu sûr, loin du liseré
    _, (iy, ix) = ndimage.distance_transform_edt(~inner, return_indices=True)
    rgb = im[..., :3].copy()
    band = sm & ~inner
    near = cv2.GaussianBlur(rgb[iy, ix], (0, 0), 4)
    # le tissu du bord reprend la teinte de l'intérieur, en gardant un léger assombrissement vers l'extérieur
    d = ndimage.distance_transform_edt(sm)
    k = np.clip(d / 13, 0, 1)[..., None]
    rgb = np.where(band[..., None], near * (.9 + .1 * k), rgb)
    na = cv2.GaussianBlur(sm.astype(np.float32), (0, 0), .8)
    na = np.where(sm, np.maximum(na, np.minimum(a, 1) * 0 + na), na)
    out = np.dstack([np.clip(rgb, 0, 255), np.clip(na, 0, 1) * 255]).astype(np.uint8)
    cv2.imwrite(f, out, [cv2.IMWRITE_PNG_COMPRESSION, 9])
    print(f)
