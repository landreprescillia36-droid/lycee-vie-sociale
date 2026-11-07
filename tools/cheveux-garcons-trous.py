"""Bouche les trous fermés (zones transparentes entourées de cheveux) dans les coiffures de garçons décalquées :
   alpha plein, couleur reprise des cheveux autour (inpainting). Les bords extérieurs ne bougent pas.
   python3 tools/cheveux-garcons-trous.py gondule graiecote …"""
import sys, os, numpy as np, cv2
from scipy import ndimage
R = os.path.join(os.path.dirname(__file__), '..')
for f in sys.argv[1:]:
    p = os.path.join(R, 'assets/coiffures', f + '.png'); a = cv2.imread(p, cv2.IMREAD_UNCHANGED)
    al = a[..., 3]
    hole = ndimage.binary_fill_holes(al > 40) & (al <= 40)
    hole = ndimage.binary_dilation(hole, iterations=3) & (al < 250)
    rgb = cv2.inpaint(a[..., :3], hole.astype(np.uint8), 5, cv2.INPAINT_TELEA)
    a[..., :3] = np.where(hole[..., None], rgb, a[..., :3]); a[..., 3] = np.where(hole, 255, al)
    cv2.imwrite(p, a, [cv2.IMWRITE_PNG_COMPRESSION, 9]); print(f, int(hole.sum()), 'px bouchés')
