"""Coiffure longue avec des mèches devant les épaules (sur la planche, l'épaule faisait une « marche » dans le contour) :
   python3 tools/epaules-coiffure.py <coiffure> <y_debut> <y_marche>
   - derrière (-dos) : la masse continue sous la marche (copie verticale) avec un bord extérieur lisse ;
   - devant : bords extérieurs lisses, au-dessus (courbe de la masse) puis sous la marche (courbe des mèches)."""
import sys, numpy as np
from PIL import Image
D = 'assets/coiffures/'; name, Y1, S = sys.argv[1], int(sys.argv[2]), int(sys.argv[3])
dos = np.array(Image.open(D + name + '-dos.png').convert('RGBA')).astype(float); H, W = dos.shape[:2]; xs = np.arange(W)
fr = np.array(Image.open(D + name + '.png').convert('RGBA')).astype(float)
def fit(a, y0, y1, side, deg=1):
    ys, v = [], []
    for y in range(y0, y1):
        r = np.where(a[y] > 160)[0]
        if len(r): ys.append(y); v.append(r.min() if side == 'L' else r.max())
    return np.polyfit(ys, v, deg)
cL, cR = fit(dos[..., 3], Y1, S, 'L'), fit(dos[..., 3], Y1, S, 'R')
for y in range(S + 1, H):
    L, R = np.polyval(cL, y), np.polyval(cR, y)
    for x in range(int(max(0, L - 1)), int(min(W, R + 2))):
        if dos[y, x, 3] < 200 and dos[S, x, 3] > 0: dos[y, x] = dos[S, x]
def clipr(img, cl, cr, y0, y1, ins=0):
    for y in range(y0, y1):
        L, R = np.polyval(cl, y) + ins, np.polyval(cr, y) - ins
        al = np.clip(np.minimum(xs - L + .5, R - xs + .5), 0, 1); k = min(1, (y - y0) / 25)
        img[y, :, 3] = img[y, :, 3] * (1 - k) + np.minimum(img[y, :, 3], al * 255) * k
clipr(dos, cL, cR, Y1, H)
fL, fR = fit(fr[..., 3], S + 25, H - 5, 'L', 2), fit(fr[..., 3], S + 25, H - 5, 'R', 2)
clipr(fr, cL, cR, Y1, S + 10); clipr(fr, fL, fR, S + 10, H)
def dark_edges(img, y0):
    """bords anti-crénelés : la couleur vient des cheveux voisins (plus de liseré clair venu du fond de la planche)"""
    for y in range(y0, img.shape[0]):
        op = np.where(img[y, :, 3] > 235)[0]
        if not len(op): continue
        for x in np.where((img[y, :, 3] > 0) & (img[y, :, 3] <= 235))[0]:
            img[y, x, :3] = img[y, op[np.argmin(abs(op - x))], :3]
def rim(img, y0):
    """liseré gris clair le long du bord extérieur (fond de la planche mélangé aux cheveux) : remplacé par la couleur des mèches juste à l'intérieur"""
    for y in range(y0, img.shape[0]):
        op = np.where(img[y, :, 3] > 30)[0]
        if len(op) < 30: continue
        for a, b, st in ((op.min(), op.min() + 12, 1), (op.max(), op.max() - 12, -1)):
            ref = img[y, b, :3]; lr = ref.mean()
            for x in range(a, b, st):
                if img[y, x, :3].mean() > lr * 1.25 + 6: img[y, x, :3] = ref
rim(dos, Y1 - 150); rim(fr, Y1 - 150)
dark_edges(dos, Y1 - 120); dark_edges(fr, Y1 - 120)
Image.fromarray(dos.clip(0, 255).astype(np.uint8)).save(D + name + '-dos.png', optimize=True)
Image.fromarray(fr.clip(0, 255).astype(np.uint8)).save(D + name + '.png', optimize=True)
print('ok', name)
