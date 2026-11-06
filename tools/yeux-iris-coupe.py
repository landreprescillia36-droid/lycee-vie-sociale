"""Coupe le bas des iris (assets/yeux/*-iris-*.png) qui dépasse sous la paupière inférieure.
La limite basse est la courbe (parabole) qui passe par le bas du blanc de l'œil de chaque côté de l'iris."""
import glob, os, sys
import numpy as np
from PIL import Image
D = os.path.join(os.path.dirname(__file__), '..', 'assets', 'yeux')
PRE = sys.argv[1] if len(sys.argv) > 1 else ''   # « yg » : seulement les yeux des garçons (fichiers g*)
for f in sorted(glob.glob(os.path.join(D, PRE + '*-iris-*.png'))):
    if not PRE and os.path.basename(f).startswith('yg'): continue   # yeux des garçons : à part
    e = np.array(Image.open(f.replace('-iris-', '-')).convert('RGBA')).astype(float)
    im = Image.open(f).convert('RGBA'); i = np.array(im).astype(float)
    H, W = e.shape[:2]; ea, ia = e[:, :, 3], i[:, :, 3].copy()
    xs, ys = [], []
    for x in range(W):
        col = np.where(ea[:, x] > 120)[0]
        if not len(col): continue
        b = col.max()
        xs.append(x); ys.append(b)
    icols = np.where(ia.max(axis=0) > 30)[0]; x0, x1 = icols.min(), icols.max()
    # bas du blanc de l'œil juste à côté de l'iris (moins de 30 px), là où il est bien sous l'iris
    sel = [(x, y) for x, y in zip(xs, ys) if (x0 - 30 <= x <= x1 + 30) and (ia[:, x].max() < 30 or y > np.where(ia[:, x] > 30)[0].max())]
    if len(sel) < 4: print('?', os.path.basename(f)); continue
    a, bb, c = np.polyfit([q[0] for q in sel], [q[1] for q in sel], 2)
    if a < 0: a, bb, c = 0, *np.polyfit([q[0] for q in sel], [q[1] for q in sel], 1)
    X = np.arange(W); xc, hw = (x0 + x1) / 2, max(1, (x1 - x0) / 2)
    lim = a * X * X + bb * X + c - 1.0 + 3.0 * np.clip(1 - ((X - xc) / hw) ** 2, 0, 1)  # paupière légèrement arrondie
    Y = np.arange(H)[:, None]
    k = np.clip((lim[None, :] - Y) / 2 + 1, 0, 1)  # 1 au-dessus de la limite, fondu sur 2 px
    i[:, :, 3] = ia * k
    Image.fromarray(i.astype(np.uint8)).save(f)
    print('ok', os.path.basename(f), int((ia > 30).sum() - (i[:, :, 3] > 30).sum()), 'px retirés')
