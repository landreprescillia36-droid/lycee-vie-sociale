"""Bords extérieurs droits pour une coiffure longue (image + -dos) : chaque bord (gauche et droit) suit une droite
   ajustée sur les lignes y0..y1, prolongée jusqu'en bas (dans -dos, derrière les épaules) et jusqu'à y_devant dans l'image de devant.
   L'image est élargie de M pixels de chaque côté si la droite sort du cadre ; js/coiffures-art.js est mis à jour.
   Usage : python3 tools/bord-droit.py <coiffure> <y0> <y1> <y_devant> [cotes=gd]"""
import sys, re, os, numpy as np
from PIL import Image
R = os.path.join(os.path.dirname(os.path.abspath(__file__)), '..')
hid, y0, y1, yf = sys.argv[1], *map(int, sys.argv[2:5]); cotes = sys.argv[5] if len(sys.argv) > 5 else 'gd'
P = lambda f: os.path.join(R, 'assets/coiffures', f + '.png')
F = np.array(Image.open(P(hid)).convert('RGBA')).astype(float); D = np.array(Image.open(P(hid + '-dos')).convert('RGBA')).astype(float)
H, W = F.shape[:2]

def edges(d, y):
    a = d[y, :, 3] / 255.; op = np.where(a > .5)[0]
    if not len(op): return None
    l, r = op.min(), op.max()
    return l - a[max(0, l - 3):l].sum(), r + 1 + a[r + 1:r + 4].sum()

ys = [y for y in range(y0, y1) if edges(F, y)]
fl = np.polyfit(ys, [edges(F, y)[0] for y in ys], 1); fr = np.polyfit(ys, [edges(F, y)[1] for y in ys], 1)
need = max(0, -np.polyval(fl, H), np.polyval(fr, H) - W)
M = int(np.ceil(need)) + 2 if need > 0 else 0
if M:
    pad = lambda d: np.pad(d, ((0, 0), (M, M), (0, 0)))
    F, D = pad(F), pad(D); fl[1] += M; fr[1] += M; W += 2 * M
X = np.arange(W)

def fix(d, ya, yb):
    for y in range(ya, yb):
        a = d[y, :, 3]; op = np.where(a > 200)[0]
        if not len(op): continue
        if 'g' in cotes:
            L = max(np.polyval(fl, y), 0); x0 = op.min()
            for x in range(max(0, int(L)), x0): d[y, x, :3] = d[y, x0 + 2, :3]; d[y, x, 3] = 255
            m = X < x0 + 6; d[y, m, 3] = (np.clip(X - L + .5, 0, 1) * 255)[m]
        if 'd' in cotes:
            Rr = min(np.polyval(fr, y), W); x1 = op.max()
            for x in range(x1 + 1, min(W, int(np.ceil(Rr)))): d[y, x, :3] = d[y, x1 - 2, :3]; d[y, x, 3] = 255
            m = X > x1 - 6; d[y, m, 3] = (np.clip(Rr - X + .5, 0, 1) * 255)[m]
    return d

F = fix(F, y0, yf); D = fix(D, y0, H)
Image.fromarray(F.astype(np.uint8)).save(P(hid)); Image.fromarray(D.astype(np.uint8)).save(P(hid + '-dos'))
for s in ('-peau', '-dos-peau'):
    if M and os.path.exists(P(hid + s)):
        q = np.array(Image.open(P(hid + s)).convert('RGBA')); Image.fromarray(np.pad(q, ((0, 0), (M, M), (0, 0)))).save(P(hid + s))
if M:
    js = os.path.join(R, 'js/coiffures-art.js'); t = open(js).read()
    def rep(m):
        x, y, w, h = map(float, m.group(2).split(',')); k = w / (W - 2 * M)
        return m.group(1) + f'[{x - M * k:.2f},{y},{w + 2 * M * k:.2f},{h}]'
    t = re.sub(r'("' + hid + r'":\{"img":)\[([^\]]*)\]', rep, t, 1); open(js, 'w').write(t)
print(hid, 'élargie de', M, 'px de chaque côté' if M else '(pas d\'élargissement)')
