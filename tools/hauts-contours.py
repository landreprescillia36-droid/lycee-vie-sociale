"""Contour net des hauts des garçons (assets/hauts/*.png).
   Le décalque ligne par ligne laissait un bord en dents de scie (épaules ondulées, ourlets bosselés), un bord flou
   sur les hauts clairs et des pixels de bord à la couleur du fond de la planche.
   Ici : le contour est retracé comme un chemin lissé (moyenne glissante le long du bord), rempli avec un bord
   anti-crénelé d'un pixel ; les pixels du bord prennent la couleur du tissu voisin.
   python3 tools/hauts-contours.py  (puis tools/bandes-garcons.py, qui part des t-shirts lissés)"""
import os, glob, numpy as np, cv2
from scipy import ndimage
D = os.path.join(os.path.dirname(os.path.abspath(__file__)), '..', 'assets', 'hauts')
SIG = 9.0      # lissage le long du contour (en pixels de contour)
SS = 4         # sur-échantillonnage pour l'anti-crénelage
def smooth_mask(m):
    H, W = m.shape
    cs, hier = cv2.findContours(m.astype(np.uint8), cv2.RETR_CCOMP, cv2.CHAIN_APPROX_NONE)
    big = np.zeros((H * SS, W * SS), np.uint8)
    if hier is None: return m.astype(np.float32)
    for i, c in enumerate(cs):
        if len(c) < 12: continue
        p = c[:, 0, :].astype(np.float32)
        q = np.stack([ndimage.gaussian_filter1d(p[:, k], SIG, mode='wrap') for k in (0, 1)], 1)
        pts = np.round((q + .5) * SS - .5).astype(np.int32)
        hole = hier[0][i][3] >= 0
        cv2.fillPoly(big, [pts], 0 if hole else 255, lineType=cv2.LINE_8)
    # dessin dans l'ordre : contours extérieurs puis trous
    big2 = np.zeros_like(big)
    order = sorted(range(len(cs)), key=lambda i: hier[0][i][3] >= 0)
    for i in order:
        c = cs[i]
        if len(c) < 12: continue
        p = c[:, 0, :].astype(np.float32)
        q = np.stack([ndimage.gaussian_filter1d(p[:, k], SIG, mode='wrap') for k in (0, 1)], 1)
        pts = np.round((q + .5) * SS - .5).astype(np.int32)
        cv2.fillPoly(big2, [pts], 0 if hier[0][i][3] >= 0 else 255, lineType=cv2.LINE_8)
    return cv2.resize(big2.astype(np.float32) / 255, (W, H), interpolation=cv2.INTER_AREA)
for f in sorted(glob.glob(os.path.join(D, '*.png'))):
    if os.path.basename(f).startswith('bandes-'): continue
    a = cv2.imread(f, cv2.IMREAD_UNCHANGED)
    al = a[..., 3].astype(np.float32) / 255
    m = ndimage.binary_opening(al > .5, iterations=1)
    new = smooth_mask(m)
    solid = ndimage.binary_erosion(al > .97, iterations=2)
    rgb = cv2.inpaint(np.ascontiguousarray(a[..., :3]), (~solid).astype(np.uint8), 3, cv2.INPAINT_TELEA)
    out = np.zeros_like(a); out[..., :3] = np.where(solid[..., None], a[..., :3], rgb)
    out[..., 3] = np.clip(new * 255, 0, 255).astype(np.uint8)
    out[out[..., 3] == 0, :3] = 0
    cv2.imwrite(f, out, [cv2.IMWRITE_PNG_COMPRESSION, 9])
    print(os.path.basename(f))
