"""Bords des hauts des garçons (assets/hauts/*.png) : les pixels à moitié transparents du contour gardaient la couleur
   du fond de la planche (clairs sur les hauts foncés, foncés sur les clairs). Une fois le haut reteint (marine, kaki…),
   ils devenaient des points blancs ou noirs le long des manches. On leur donne la couleur du tissu voisin
   (la transparence reste la même).  python3 tools/hauts-bords.py  (lancé aussi à la fin de traceur-hauts-garcons.py)"""
import os, glob, numpy as np, cv2
D = os.path.join(os.path.dirname(os.path.abspath(__file__)), '..', 'assets', 'hauts')
for f in sorted(glob.glob(os.path.join(D, '*.png'))):
    a = cv2.imread(f, cv2.IMREAD_UNCHANGED)
    al = a[..., 3]
    solid = al >= 250
    solid = cv2.erode(solid.astype(np.uint8), np.ones((3, 3), np.uint8)).astype(bool)   # le tissu sûr, loin du bord
    m = (~solid).astype(np.uint8)          # seules les zones de tissu plein servent de modèle (pas le fond transparent)
    rgb = cv2.inpaint(np.ascontiguousarray(a[..., :3]), m, 4, cv2.INPAINT_TELEA)
    out = a.copy(); out[..., :3] = np.where(m[..., None] > 0, rgb, a[..., :3]); out[al == 0, :3] = 0
    cv2.imwrite(f, out, [cv2.IMWRITE_PNG_COMPRESSION, 9])
    print(os.path.basename(f))
