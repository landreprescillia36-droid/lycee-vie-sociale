"""Décalque des sacs d'école sur docs/references/vetements/planche-sacs.jpg : pixels sombres du sac
(sac à main porté à l'épaule, bretelles du sac à dos) → assets/sacs/<modèle>.png + js/sacs-art.js (repères)."""
import json, os
import numpy as np
from PIL import Image
from scipy import ndimage
R = os.path.join(os.path.dirname(__file__), '..')
A = np.array(Image.open(os.path.join(R, 'docs/references/vetements/planche-sacs.jpg')).convert('RGB')).astype(float)
os.makedirs(os.path.join(R, 'assets/sacs'), exist_ok=True)
L = A.mean(axis=2)
def cut(name, box, seeds, lmax=95):
    x0, y0, x1, y1 = box
    a = A[y0:y1, x0:x1]; l = L[y0:y1, x0:x1]
    sat = a.max(axis=2) - a.min(axis=2)
    m = (l < lmax) & (sat < 16)   # noir neutre du sac (les cheveux et la jupe sont plus colorés)
    m = ndimage.binary_opening(m, iterations=1)
    m = ndimage.binary_closing(m, iterations=2)
    lab, k = ndimage.label(m)
    keep = np.zeros_like(m)
    for sx, sy in seeds:
        v = lab[sy - y0, sx - x0]
        if v: keep |= lab == v
    keep = ndimage.binary_fill_holes(keep)
    if name == 'sacmain':  # le bas de la jupe touche le coin du sac : on le coupe
        yy, xx = np.mgrid[y0:y1, x0:x1]; keep &= ~((yy > 800) & (xx < 545))
    al = np.clip((150 - l) / 60, 0, 1) * keep
    al = np.maximum(al, ndimage.binary_erosion(keep, iterations=1) * 1.0)
    ys, xs = np.where(keep); t, b, le, ri = ys.min(), ys.max(), xs.min(), xs.max()
    rgba = np.dstack([a, al * 255]).astype(np.uint8)[t:b + 1, le:ri + 1]
    Image.fromarray(rgba, 'RGBA').save(os.path.join(R, f'assets/sacs/{name}.png'))
    return dict(x=int(x0 + le), y=int(y0 + t), w=int(ri - le + 1), h=int(b - t + 1))
art = {}
art['sacmain'] = cut('sacmain', (490, 375, 680, 850), [(590, 700), (560, 420)], 85)
# sac à dos : la bretelle droite (non cachée par les cheveux), le jeu la reflète pour l'autre épaule
art['sacados'] = cut('sacados', (1200, 375, 1300, 850), [(1252, 650), (1252, 560)])
# repères du corps sur la planche : épaules (haut des bretelles), centre du corps
art['_ref'] = {'sacmain': {'cx': 440, 'top': 390}, 'sacados': {'cx': 1150, 'top': 390}}
print(art)
open(os.path.join(R, 'js/sacs-art.js'), 'w').write('/* sacs décalqués par tools/traceur-sacs.py sur docs/references/vetements/planche-sacs.jpg — ne pas modifier à la main */\nconst SAC_ART=' + json.dumps(art, separators=(',', ':')) + ';\n')
