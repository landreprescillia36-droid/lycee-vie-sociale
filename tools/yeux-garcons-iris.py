"""Yeux des garçons : l'iris ne dépasse jamais de l'œil.
   À lancer en dernier (après traceur-yeux-garcons.py, yeux-blanc-haut.py yg et yeux-trait-bas.py yg) :
   pour chaque colonne, l'iris est coupé au trait du bas de l'œil (trait fin dessiné par yeux-trait-bas.py)."""
import glob, os
import numpy as np
from PIL import Image
D = os.path.join(os.path.dirname(__file__), '..', 'assets', 'yeux')
LINE = np.array([58, 36, 30], float)
for fe in sorted(glob.glob(os.path.join(D, 'yg*-[gd].png'))):
    if '-iris-' in fe: continue
    fi = fe[:-6] + '-iris-' + fe[-5:]
    e = np.array(Image.open(fe).convert('RGBA')).astype(float); i = np.array(Image.open(fi).convert('RGBA')).astype(float)
    H, W = e.shape[:2]; ia = i[..., 3]
    ys_i = np.where(ia.max(1) > 60)[0]; cy = (ys_i.min() + ys_i.max()) / 2 if len(ys_i) else H / 2
    line = (e[..., 3] > 90) & (np.abs(e[..., :3] - LINE).sum(2) < 90)
    n = 0
    for x in range(W):
        c = np.where(line[int(cy):, x])[0]
        if not len(c): continue
        yb = int(cy) + c.min()
        n += int((ia[yb:, x] > 30).sum()); ia[yb:, x] = 0
        if yb - 1 >= 0: ia[yb - 1, x] *= .5
    i[..., 3] = ia
    Image.fromarray(i.astype(np.uint8)).save(fi)
    print(os.path.basename(fe), n, 'px d\'iris sous le trait du bas retirés')
