"""Pompon (puff) coupé à plat par la case : le haut qui manque est refait en faisant tourner les côtés dessinés
   (vraies boucles et vraies pointes du bord) autour du centre du pompon : côté droit vers le haut droit, côté gauche
   vers le haut gauche, raccord fondu au sommet et au niveau de la coupure. Images devant et derrière.
   Usage : python3 tools/pompon-rond2.py <coiffure> <v de la coupure> <v bas des côtés mesurés>"""
import sys, os, re, json, numpy as np, cv2
from PIL import Image
R = os.path.join(os.path.dirname(os.path.abspath(__file__)), '..'); os.chdir(R)
hid, vc, vb = sys.argv[1], float(sys.argv[2]), float(sys.argv[3])
P = lambda s: 'assets/coiffures/' + hid + s + '.png'
js = open('js/coiffures-art.js').read(); ix, iy, iw, ih = json.loads(re.search(r'"' + hid + r'":\{"img":(\[[^\]]*\])', js).group(1))
F = np.array(Image.open(P('')).convert('RGBA')).astype(np.float32); H, W = F.shape[:2]
U = ix + (np.arange(W) + .5) * iw / W; V = iy + (np.arange(H) + .5) * ih / H
al = F[:, :, 3] > 128; pts = []
for y in range(H):
    if vc + 3 < V[y] < vb and al[y].any():
        xs = np.where(al[y])[0]; pts += [(U[xs.min()], V[y]), (U[xs.max()], V[y])]
pts = np.array(pts); A = np.c_[pts[:, 0], pts[:, 1], np.ones(len(pts))]; b = -(pts[:, 0] ** 2 + pts[:, 1] ** 2)
D, E, Fc = np.linalg.lstsq(A, b, rcond=None)[0]; cu, cv = -D / 2, -E / 2; rr = np.sqrt(cu ** 2 + cv ** 2 - Fc)
top = cv - rr - 12; add = int(np.ceil((iy + 2 - top) * H / ih)) + 4 if top < iy + 2 else 0
print('cercle : centre', round(cu, 1), round(cv, 1), 'rayon', round(rr, 1), 'ajout', add)
ih2 = ih * (H + add) / H; iy2 = iy - ih * add / H; H2 = H + add
V2 = iy2 + (np.arange(H2) + .5) * ih2 / H2; UU, VV = np.meshgrid(U, V2)
r_ = np.hypot(UU - cu, VV - cv); th = np.degrees(np.arctan2(VV - cv, UU - cu))   # -90 = en haut
tc = np.degrees(np.arcsin(np.clip((vc - cv) / rr, -1, 1)))   # angle de la coupure à droite (négatif)
tcl = -180 - tc                                             # à gauche
rot = (tc - (-90)) if tc > -90 else 0                       # décalage : le côté sous la coupure vient au-dessus
rot = abs(-90 - tc) + 6
# droite : th dans [-90, tc] -> source th + rot ; gauche : th dans [tcl, -90] -> source th - rot
src_th = np.where(th > -90, th + rot, th - rot)
su = cu + r_ * np.cos(np.radians(src_th)); sv = cv + r_ * np.sin(np.radians(src_th))
X = ((su - ix) / iw * W - .5).astype(np.float32); Y = ((sv - iy2) / ih2 * H2 - .5).astype(np.float32)
above = VV < vc
w = np.clip((vc - VV) * W / iw / 10, 0, 1)   # fondu sur ~10 px sous la coupure
for s in ('', '-dos', '-peau', '-dos-peau'):
    if not os.path.exists(P(s)): continue
    d = np.array(Image.open(P(s)).convert('RGBA')).astype(np.float32)
    if add: d = np.pad(d, ((add, 0), (0, 0), (0, 0)))
    if s in ('', '-dos'):
        pm = d.copy(); pm[:, :, :3] *= pm[:, :, 3:] / 255
        Rr = cv2.remap(pm, X, Y, cv2.INTER_LINEAR, borderMode=cv2.BORDER_CONSTANT, borderValue=0); Rr[:, :, :3] /= np.maximum(Rr[:, :, 3:] / 255, 1e-3)
        # sommet : les deux moitiés se rejoignent, fondu sur ±6°
        seam = np.clip(1 - np.abs(th + 90) / 6, 0, 1)
        Rl_th = np.where(th > -90, th - rot, th + rot)   # l'autre côté, pour fondre au sommet
        su2 = cu + r_ * np.cos(np.radians(Rl_th)); sv2 = cv + r_ * np.sin(np.radians(Rl_th))
        X2 = ((su2 - ix) / iw * W - .5).astype(np.float32); Y2 = ((sv2 - iy2) / ih2 * H2 - .5).astype(np.float32)
        R2 = cv2.remap(pm, X2, Y2, cv2.INTER_LINEAR, borderMode=cv2.BORDER_CONSTANT, borderValue=0); R2[:, :, :3] /= np.maximum(R2[:, :, 3:] / 255, 1e-3)
        Rr = Rr * (1 - .5 * seam[:, :, None]) + R2 * (.5 * seam[:, :, None])
        k = (w * (r_ < rr + 30))[:, :, None]
        d = np.where(above[:, :, None], d * (1 - k) + Rr * k, d)
    Image.fromarray(d.clip(0, 255).astype(np.uint8)).save(P(s))
js = re.sub(r'("' + hid + r'":\{"img":)\[[^\]]*\]', lambda m: m.group(1) + json.dumps([ix, round(iy2, 2), iw, round(ih2, 2)]).replace(' ', ''), js, count=1)
open('js/coiffures-art.js', 'w').write(js); print(hid, ': haut du pompon refait avec les boucles des côtés')
