"""Mèches de devant qui passent sur la joue : au lieu d'être coupées à plat par le jeu (à la hauteur v = 240, début de la
   zone du cou), elles finissent en arrondi sur le bord du visage (contour « ovale ») entre v0 et v1.
   Usage : python3 tools/meches-joue.py <coiffure> [v0=200] [v1=242] [cotes=gd]"""
import sys, os, re, json, numpy as np
from PIL import Image
R = os.path.join(os.path.dirname(os.path.abspath(__file__)), '..')
hid = sys.argv[1]; V0 = float(sys.argv[2]) if len(sys.argv) > 2 else 200; V1 = float(sys.argv[3]) if len(sys.argv) > 3 else 242
cotes = sys.argv[4] if len(sys.argv) > 4 else 'gd'
js = open(os.path.join(R, 'js/coiffures-art.js')).read()
ix, iy, iw, ih = json.loads(re.search(r'"' + hid + r'":\{"img":(\[[^\]]*\])', js).group(1))
f = os.path.join(R, 'assets/coiffures', hid + '.png')
F = np.array(Image.open(f).convert('RGBA')).astype(float); H, W = F.shape[:2]
U = ix + (np.arange(W) + .5) * iw / W; V = iy + (np.arange(H) + .5) * ih / H; px = iw / W
t = np.linspace(0, 1, 400); P = [np.array(q) for q in ([200, 312], [140, 312], [106, 262], [106, 190])]
B = ((1 - t) ** 3)[:, None] * P[0] + (3 * (1 - t) ** 2 * t)[:, None] * P[1] + (3 * (1 - t) * t * t)[:, None] * P[2] + (t ** 3)[:, None] * P[3]
fx = lambda v: np.interp(v, B[::-1, 1], B[::-1, 0])
def edge(y, side):
    s = [x for x in np.where(F[y, :, 3] > 128)[0] if (U[x] < 200) == (side < 0)]
    return (U[max(s)] if side < 0 else U[min(s)]) if s else None
y0 = int(np.argmin(np.abs(V - V0))); EL, ER = edge(y0, -1), edge(y0, 1)
for y in range(H):
    v = V[y]
    if v < V0 or v > V1 + 30: continue
    tt = min(1, (v - V0) / (V1 - V0)); k = 1 - tt * tt * (3 - 2 * tt)   # la mèche rejoint le bord du visage en douceur
    if 'g' in cotes and EL is not None and EL > fx(V0):
        XL = fx(v) + 1 + (EL - fx(v) - 1) * k; m = (U < 200) & (U > XL - 2)
        F[y, m, 3] = np.minimum(F[y, m, 3], np.clip((XL - U[m]) / px + .5, 0, 1) * 255)
    if 'd' in cotes and ER is not None and ER < 400 - fx(V0):
        XR = (400 - fx(v)) - 1 - ((400 - fx(v)) - 1 - ER) * k; m = (U > 200) & (U < XR + 2)
        F[y, m, 3] = np.minimum(F[y, m, 3], np.clip((U[m] - XR) / px + .5, 0, 1) * 255)
Image.fromarray(F.astype(np.uint8)).save(f)
print(hid, 'bords des mèches sur la joue à', EL, ER)
