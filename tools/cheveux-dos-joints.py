"""Bouche les fines lignes claires (pixels à moitié transparents) à l'intérieur des images « -dos » des coiffures lisses :
ces joints faisaient apparaître un « carré blanc » autour du cou. Fermeture morphologique de l'opacité (5 px),
couleur reprise des pixels opaques voisins. Les bords extérieurs des cheveux ne bougent pas."""
import glob, os
import numpy as np
from PIL import Image
from scipy import ndimage
D = os.path.join(os.path.dirname(__file__), '..', 'assets', 'coiffures')
for f in sorted(glob.glob(os.path.join(D, '*-dos.png'))):
    n = os.path.basename(f)
    if n.startswith(('b', 'g')): continue
    a = np.array(Image.open(f).convert('RGBA')).astype(float)
    al = a[..., 3]
    cl = ndimage.grey_closing(al, size=(7, 7))
    fill = (cl > al + 20)
    if not fill.any(): continue
    op = al > 230
    idx = ndimage.distance_transform_edt(~op, return_distances=False, return_indices=True)
    for c in range(3):
        a[..., c] = np.where(fill, a[..., c][idx[0], idx[1]], a[..., c])
    a[..., 3] = np.where(fill, cl, al)
    Image.fromarray(a.astype(np.uint8)).save(f)
    print(n, int(fill.sum()), 'px bouchés')
