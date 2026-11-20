"""Contours nets d'une coiffure longue décalquée (sur la planche, les épaules coupaient le bas des mèches).
   python3 tools/lisser-coiffure.py <coiffure> <y_haut> <y_bas_gauche> <x_coupe_gauche>
   - bords extérieurs gauche et droit : courbes lisses ajustées sur le dessin (plus de crans ni de halo) ;
   - derrière (-dos) : la mèche de gauche continue jusqu'en bas (copie verticale des mèches, les cheveux tombent droit) ;
   - devant : le bas de la mèche de gauche s'efface doucement, la suite est derrière l'épaule."""
import sys, numpy as np
from PIL import Image
D = 'assets/coiffures/'
name, Y0, YB, XC = sys.argv[1], int(sys.argv[2]), int(sys.argv[3]), int(sys.argv[4])

def outer_fit(a, Y1):
    ys, lo, hi = [], [], []
    for y in range(Y0, Y1):
        xs = np.where(a[y] > 160)[0]
        if len(xs): ys.append(y); lo.append(xs.min()); hi.append(xs.max())
    return np.polyfit(ys, lo, 2), np.polyfit(ys, hi, 2)

dos = np.array(Image.open(D + name + '-dos.png').convert('RGBA')).astype(float); H, W = dos.shape[:2]
cl, _ = outer_fit(dos[..., 3], YB)
_, cr = outer_fit(dos[..., 3], H)
xs = np.arange(W)

def clean(img, extend):
    out = img.copy()
    if extend:                       # la mèche de gauche continue jusqu'en bas
        for y in range(YB + 1, H): out[y, :XC] = img[YB, :XC]
    for y in range(Y0, H):
        L, R = np.polyval(cl, y), np.polyval(cr, y)
        al = np.clip(np.minimum(xs - L + .5, R - xs + .5), 0, 1)
        row = out[y]
        # trous le long du bord : on reprend la mèche voisine (vers l'intérieur)
        for x in np.where((al > .5) & (row[:, 3] < 200))[0]:
            if x < W // 2:
                j = np.where(row[x:W // 2, 3] > 200)[0]
                if len(j) and j[0] < 25: row[x, :3] = row[x + j[0], :3]; row[x, 3] = 255
            else:
                j = np.where(row[W // 2:x + 1, 3] > 200)[0]
                if len(j) and (x - (W // 2 + j[-1])) < 25: row[x, :3] = row[W // 2 + j[-1], :3]; row[x, 3] = 255
        row[:, 3] = np.minimum(row[:, 3], al * 255)
    return out

d2 = clean(dos, True)
f = np.array(Image.open(D + name + '.png').convert('RGBA')).astype(float)
f2 = clean(f, False)
for y in range(YB - 60, H):              # devant : le bas de la mèche de gauche s'efface (elle passe derrière l'épaule)
    f2[y, :XC, 3] *= np.clip((YB - y) / 60, 0, 1)
Image.fromarray(d2.clip(0, 255).astype(np.uint8)).save(D + name + '-dos.png', optimize=True)
Image.fromarray(f2.clip(0, 255).astype(np.uint8)).save(D + name + '.png', optimize=True)
print('ok', name)
