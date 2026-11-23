"""Haut de la coiffure moins bombé : au-dessus de la hauteur v_a (repère de tête), les cheveux sont tassés vers le bas
   (facteur f < 1), toutes les images de la coiffure suivent ; en dessous rien ne bouge.
   Usage : python3 tools/aplatir-haut.py <coiffure> <v_a> <f>"""
import sys, os, re, json, numpy as np, cv2
from PIL import Image
R = os.path.join(os.path.dirname(os.path.abspath(__file__)), '..'); os.chdir(R)
hid, va, f = sys.argv[1], float(sys.argv[2]), float(sys.argv[3])
P = lambda s: 'assets/coiffures/' + hid + s + '.png'
js = open('js/coiffures-art.js').read(); ix, iy, iw, ih = json.loads(re.search(r'"' + hid + r'":\{"img":(\[[^\]]*\])', js).group(1))
for s in ('', '-dos', '-peau', '-dos-peau'):
    if not os.path.exists(P(s)): continue
    d = np.array(Image.open(P(s)).convert('RGBA')).astype(np.float32); H, W = d.shape[:2]
    V = iy + (np.arange(H) + .5) * ih / H
    vs = np.where(V < va, va - (va - V) / f, V)   # rangée source
    Y = np.tile((((vs - iy) / ih * H) - .5).astype(np.float32)[:, None], (1, W)); X = np.tile(np.arange(W, dtype=np.float32), (H, 1))
    pm = d.copy(); pm[:, :, :3] *= pm[:, :, 3:] / 255
    o = cv2.remap(pm, X, Y, cv2.INTER_LINEAR, borderMode=cv2.BORDER_CONSTANT, borderValue=0)
    o[:, :, :3] /= np.maximum(o[:, :, 3:] / 255, 1e-3)
    Image.fromarray(o.clip(0, 255).astype(np.uint8)).save(P(s))
print(hid, ': haut tassé ×', f, 'au-dessus de v =', va)
