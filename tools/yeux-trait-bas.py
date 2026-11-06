"""Rend les yeux uniformes : retire des images assets/yeux/<forme>-<g|d>.png les traits sombres irréguliers
(bas de l'œil, coins) puis redessine le bas de l'œil avec le même trait fin et régulier pour toutes les formes.
Le trait du haut (eye-liner) est dessiné par le jeu (lidSVG). À lancer après yeux-iris-coupe.py et yeux-blanc-haut.py."""
import glob, os, sys
import numpy as np
from PIL import Image
D = os.path.join(os.path.dirname(__file__), '..', 'assets', 'yeux')
LINE = np.array([58, 36, 30], float)
PRE = sys.argv[1] if len(sys.argv) > 1 else ''   # « yg » : seulement les yeux des garçons
for f in sorted(glob.glob(os.path.join(D, PRE + '*-[gd].png'))):
    if '-iris-' in f: continue
    if not PRE and os.path.basename(f).startswith('yg'): continue   # yeux des garçons : à part
    a = np.array(Image.open(f).convert('RGBA')).astype(float)
    ia = np.array(Image.open(f.replace('.png', '').rsplit('-', 1)[0] + '-iris-' + f[-5] + '.png').convert('RGBA'))[..., 3].astype(float)
    H, W = a.shape[:2]; lum = a[..., :3].mean(axis=2); al = a[..., 3]
    dark = (al > 20) & (lum < 150)
    a[dark, 3] = 0  # plus de pâtés sombres
    sclera = (a[..., 3] > 150) & (a[..., :3].min(axis=2) > 170)
    eye = sclera | (ia > 60)
    xs, ys = [], []
    for x in range(W):
        c = np.where(eye[:, x])[0]
        if len(c): xs.append(x); ys.append(c.max())
    xs, ys = np.array(xs), np.array(ys)
    x0, x1 = xs.min(), xs.max()
    cf = np.polyfit(xs, ys, 4)
    # sous le trait du bas et hors des coins : plus aucun reste du dessin (taches claires ou orangées)
    for x in range(W):
        if x < x0 or x > x1:
            a[:, x, 3] = np.where(sclera[:, x], a[:, x, 3], 0); continue
        yb = int(np.polyval(cf, x) + 4.5)
        a[yb:, x, 3] = 0
        nonw = ~sclera[:, x] & (ia[:, x] < 60)
        lo = int(np.polyval(cf, x) - 3)
        a[lo:yb, x, 3] = np.where(nonw[lo:yb], 0, a[lo:yb, x, 3])
    out = a.copy()
    for x in range(x0, x1 + 1):
        u = (x - x0) / max(1, x1 - x0)
        t = 0.8 + 2.2 * np.sin(np.pi * u) ** 0.8          # épaisseur (px) : fine aux coins, plus marquée au milieu
        yc = np.polyval(cf, x) + 0.6
        for y in range(int(yc - t - 2), int(yc + t + 3)):
            if not 0 <= y < H: continue
            cov = np.clip(t / 2 + 0.5 - abs(y - yc), 0, 1) * 0.85
            if cov <= 0: continue
            A0 = out[y, x, 3] / 255; Ao = cov + A0 * (1 - cov)
            out[y, x, :3] = (LINE * cov + out[y, x, :3] * A0 * (1 - cov)) / max(Ao, 1e-6)
            out[y, x, 3] = Ao * 255
    Image.fromarray(np.clip(out, 0, 255).astype(np.uint8)).save(f)
    print(os.path.basename(f), int(dark.sum()), 'px sombres retirés')
