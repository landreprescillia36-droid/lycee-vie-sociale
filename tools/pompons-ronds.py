"""Pompons sur les côtés (Pompon bas) tassés en hauteur pour être bien ronds : à côté de la tête (|u − 200| > ~100),
   les rangées de la source [s0, s1] sont posées sur [d0, d1] ; fondu près du visage. Toutes les images suivent.
   Usage : python3 tools/pompons-ronds.py <coiffure> <s0> <s1> <d0> <d1>"""
import sys, os, re, json, numpy as np, cv2
from PIL import Image
R = os.path.join(os.path.dirname(os.path.abspath(__file__)), '..'); os.chdir(R)
hid = sys.argv[1]; s0, s1, d0, d1 = map(float, sys.argv[2:6])
P = lambda s: 'assets/coiffures/' + hid + s + '.png'
js = open('js/coiffures-art.js').read(); ix, iy, iw, ih = json.loads(re.search(r'"' + hid + r'":\{"img":(\[[^\]]*\])', js).group(1))
for s in ('', '-dos', '-peau', '-dos-peau'):
    if not os.path.exists(P(s)): continue
    d = np.array(Image.open(P(s)).convert('RGBA')).astype(np.float32); H, W = d.shape[:2]
    U = ix + (np.arange(W) + .5) * iw / W; V = iy + (np.arange(H) + .5) * ih / H; UU, VV = np.meshgrid(U, V)
    # rangée source : au-dessus du pompon, la zone vide plus haut ; dans le pompon, tassé ; en dessous, vide
    vs = np.where(VV < d0, s0 - (d0 - VV), np.where(VV <= d1, s0 + (VV - d0) * (s1 - s0) / (d1 - d0), s1 + (VV - d1)))
    w = np.clip((np.abs(UU - 200) - 98) / 14, 0, 1) * np.clip((VV - (d0 - 60)) / 20, 0, 1)
    vs = VV + w * (vs - VV)
    Y = (((vs - iy) / ih * H) - .5).astype(np.float32); X = np.tile(np.arange(W, dtype=np.float32), (H, 1))
    pm = d.copy(); pm[:, :, :3] *= pm[:, :, 3:] / 255
    o = cv2.remap(pm, X, Y, cv2.INTER_LINEAR, borderMode=cv2.BORDER_CONSTANT, borderValue=0)
    o[:, :, :3] /= np.maximum(o[:, :, 3:] / 255, 1e-3)
    Image.fromarray(o.clip(0, 255).astype(np.uint8)).save(P(s))
print(hid, ': pompons', s0, s1, '->', d0, d1)
