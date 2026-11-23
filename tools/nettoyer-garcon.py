"""Coiffure de garçon reprise d'une planche : retire ce qui n'est pas des cheveux
   — oreilles de la planche (gris/marron clair là où le jeu dessine ses oreilles),
   — col du t-shirt et ombres du cou (sous le menton, au milieu),
   — miettes détachées.  Usage : python3 tools/nettoyer-garcon.py <coiffure> [long]"""
import sys, os, re, json, numpy as np, cv2
from PIL import Image
R = os.path.join(os.path.dirname(os.path.abspath(__file__)), '..'); os.chdir(R)
hid = sys.argv[1]; LONG = 'long' in sys.argv[2:]
P = lambda s: 'assets/coiffures/' + hid + s + '.png'
js = open('js/coiffures-art.js').read(); ix, iy, iw, ih = json.loads(re.search(r'"' + hid + r'":\{"img":(\[[^\]]*\])', js).group(1))
for s in ('', '-dos'):
    d = np.array(Image.open(P(s)).convert('RGBA')).astype(np.float32); H, W = d.shape[:2]
    U = ix + (np.arange(W) + .5) * iw / W; V = iy + (np.arange(H) + .5) * ih / H; UU, VV = np.meshgrid(U, V); du = np.abs(UU - 200)
    lum = d[:, :, :3] @ [.299, .587, .114]
    ear = (du > 84) & (du < 122) & (VV > 195) & (VV < 270)
    d[:, :, 3] *= np.where(ear & (lum > 38), 0, 1)
    if not LONG:
        neck = (VV > 285) & (du < 95)
        d[:, :, 3] *= np.where(neck, 0, 1)
    else:
        d[:, :, 3] *= np.where((VV > 285) & (du < 60), 0, 1)
    n, lab, st, _ = cv2.connectedComponentsWithStats((d[:, :, 3] > 40).astype(np.uint8), 8)
    if n > 2:
        big = 1 + np.argmax(st[1:, 4]); keep = np.isin(lab, [i for i in range(1, n) if st[i, 4] > 1500 or i == big])
        d[:, :, 3] *= keep
    Image.fromarray(d.clip(0, 255).astype(np.uint8)).save(P(s))
print(hid, ': nettoyée')
