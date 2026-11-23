"""Coiffure resserrée en largeur selon la hauteur (dôme plus rond, collé au crâne) : u' = 200 + (u - 200)·k(v),
   k interpolé entre les points donnés (v:k), toutes les images de la coiffure suivent.
   Usage : python3 tools/serrer-v.py <coiffure> v1:k1 v2:k2 ..."""
import sys, os, re, json, numpy as np, cv2
from PIL import Image
R = os.path.join(os.path.dirname(os.path.abspath(__file__)), '..'); os.chdir(R)
hid = sys.argv[1]; pts = sorted(tuple(map(float, a.split(':'))) for a in sys.argv[2:]); PV = [p[0] for p in pts]; PK = [p[1] for p in pts]
P = lambda s: 'assets/coiffures/' + hid + s + '.png'
js = open('js/coiffures-art.js').read(); ix, iy, iw, ih = json.loads(re.search(r'"' + hid + r'":\{"img":(\[[^\]]*\])', js).group(1))
for s in ('', '-dos', '-peau', '-dos-peau'):
    if not os.path.exists(P(s)): continue
    d = np.array(Image.open(P(s)).convert('RGBA')).astype(np.float32); H, W = d.shape[:2]
    U = ix + (np.arange(W) + .5) * iw / W; V = iy + (np.arange(H) + .5) * ih / H; UU, VV = np.meshgrid(U, V)
    k = np.interp(VV, PV, PK); us = 200 + (UU - 200) / k
    X = ((us - ix) / iw * W - .5).astype(np.float32); Y = np.tile(np.arange(H, dtype=np.float32)[:, None], (1, W))
    pm = d.copy(); pm[:, :, :3] *= pm[:, :, 3:] / 255
    o = cv2.remap(pm, X, Y, cv2.INTER_LINEAR, borderMode=cv2.BORDER_CONSTANT, borderValue=0); o[:, :, :3] /= np.maximum(o[:, :, 3:] / 255, 1e-3)
    Image.fromarray(o.clip(0, 255).astype(np.uint8)).save(P(s))
print(hid, ': resserré', pts)
