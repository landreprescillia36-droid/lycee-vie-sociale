"""Pompon (puff) coupé à plat par la case de la planche : le cercle qui suit ses deux côtés (ajusté sur les bords dessinés
   sous la coupure) est complété au-dessus, avec la texture des boucles juste sous la coupure, en miroir.
   Images devant et derrière. Usage : python3 tools/pompon-rond.py <coiffure> <v de la coupure> <v bas des côtés mesurés>"""
import sys, os, re, json, numpy as np, cv2
from PIL import Image
R = os.path.join(os.path.dirname(os.path.abspath(__file__)), '..'); os.chdir(R)
hid, vc, vb = sys.argv[1], float(sys.argv[2]), float(sys.argv[3])
P = lambda s: 'assets/coiffures/' + hid + s + '.png'
js = open('js/coiffures-art.js').read(); ix, iy, iw, ih = json.loads(re.search(r'"' + hid + r'":\{"img":(\[[^\]]*\])', js).group(1))
F = np.array(Image.open(P('')).convert('RGBA')).astype(np.float32); H, W = F.shape[:2]
U = ix + (np.arange(W) + .5) * iw / W; V = iy + (np.arange(H) + .5) * ih / H
al = F[:, :, 3] > 128
pts = []
for y in range(H):
    if vc + 3 < V[y] < vb and al[y].any():
        xs = np.where(al[y])[0]; pts += [(U[xs.min()], V[y]), (U[xs.max()], V[y])]
pts = np.array(pts)
# cercle (centre sur l'axe des points) par moindres carrés : x² + y² + D x + E y + F = 0
A = np.c_[pts[:, 0], pts[:, 1], np.ones(len(pts))]; b = -(pts[:, 0] ** 2 + pts[:, 1] ** 2)
D, E, Fc = np.linalg.lstsq(A, b, rcond=None)[0]; cu, cv = -D / 2, -E / 2; rr = np.sqrt(cu ** 2 + cv ** 2 - Fc)
print('cercle : centre', round(cu, 1), round(cv, 1), 'rayon', round(rr, 1), '-> sommet v =', round(cv - rr, 1))
top = cv - rr
if top < iy + 2:   # l'image doit monter plus haut : on l'agrandit vers le haut
    add = int(np.ceil((iy + 2 - top) * H / ih)) + 4
else: add = 0
for s in ('', '-dos', '-peau', '-dos-peau'):
    if not os.path.exists(P(s)): continue
    d = np.array(Image.open(P(s)).convert('RGBA')).astype(np.float32)
    if add: d = np.pad(d, ((add, 0), (0, 0), (0, 0)))
    Image.fromarray(d.clip(0, 255).astype(np.uint8)).save(P(s))
ih2 = ih * (H + add) / H; iy2 = iy - ih * add / H; H2 = H + add
V = iy2 + (np.arange(H2) + .5) * ih2 / H2; UU, VV = np.meshgrid(U, V)
th = np.arctan2(VV - cv, UU - cu); lw = 0.16; j = np.floor(th / lw); tt = (th / lw - j) * 2 - 1
rng = np.random.default_rng(2); amp = 4 + 3 * rng.random(200)[(j.astype(int) % 200)]
rr_e = rr - amp + amp * np.sqrt(np.clip(1 - tt * tt, 0, 1))   # bord en petites boucles arrondies (comme les boucles du pompon)
inside = np.clip((rr_e - np.hypot(UU - cu, VV - cv)) * W / iw, 0, 1)
yc = int(np.argmin(np.abs(V - vc)))
for s in ('', '-dos'):
    d = np.array(Image.open(P(s)).convert('RGBA')).astype(np.float32)
    for y in range(0, yc + 8):
        sy = min(H2 - 1, 2 * (yc + 8) - y)
        k = 1 if y < yc else np.clip((yc + 8 - y) / 8, 0, 1)
        src = d[sy]; a_new = 255 * inside[y]
        col = np.where(src[:, 3:] > 20, src[:, :3], np.median(d[d[:, :, 3] > 250][:, :3], 0))
        d[y, :, :3] = d[y, :, :3] * (1 - k * inside[y][:, None]) + col * k * inside[y][:, None]
        d[y, :, 3] = np.maximum(d[y, :, 3] * (1 - k), a_new * k) if y < yc else np.maximum(d[y, :, 3], a_new * k)
    # ombre douce le long du bord du haut
    edge = np.clip(1 - (rr_e - np.hypot(UU - cu, VV - cv)) / 4, 0, 1) * (VV < vc) * (inside > 0)
    d[:, :, :3] *= (1 - .3 * edge[:, :, None])
    Image.fromarray(d.clip(0, 255).astype(np.uint8)).save(P(s))
js = re.sub(r'("' + hid + r'":\{"img":)\[[^\]]*\]', lambda m: m.group(1) + json.dumps([ix, round(iy2, 2), iw, round(ih2, 2)]).replace(' ', ''), js, count=1)
open('js/coiffures-art.js', 'w').write(js); print(hid, ': sommet du pompon rond')
