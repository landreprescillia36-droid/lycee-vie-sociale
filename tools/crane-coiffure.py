"""Coiffure qui adhère au crâne : derrière le visage (image -dos), tout le crâne du jeu (ellipse au-dessus des oreilles) est
   couvert de cheveux, couleur et texture reprises des cheveux voisins. Le visage du jeu passe devant ; on ne voit ces cheveux
   que là où il restait un vide entre la coiffure et la tête (tempes, au-dessus des oreilles, haut du crâne).
   Usage : python3 tools/crane-coiffure.py <coiffure> [haut de l'ellipse = 58]"""
import sys, os, re, json, numpy as np, cv2
from PIL import Image
R = os.path.join(os.path.dirname(os.path.abspath(__file__)), '..'); os.chdir(R)
hid = sys.argv[1]; top = float(sys.argv[2]) if len(sys.argv) > 2 else 58
P = lambda f: 'assets/coiffures/' + f + '.png'
js = open('js/coiffures-art.js').read(); ix, iy, iw, ih = json.loads(re.search(r'"' + hid + r'":\{"img":(\[[^\]]*\])', js).group(1))
d = np.array(Image.open(P(hid + '-dos')).convert('RGBA')).astype(np.float32); H, W = d.shape[:2]
U = ix + (np.arange(W) + .5) * iw / W; V = iy + (np.arange(H) + .5) * ih / H; UU, VV = np.meshgrid(U, V)
cy = (top + 232) / 2; ry = (232 - top) / 2
sk = (((UU - 200) / 110) ** 2 + ((VV - cy) / ry) ** 2 < 1) & (VV < 232)
fill = sk & (d[:, :, 3] < 250)
src = d[:, :, :3].clip(0, 255).astype(np.uint8)
inp = cv2.inpaint(src, (fill | (d[:, :, 3] < 128)).astype(np.uint8), 9, cv2.INPAINT_TELEA).astype(np.float32)
a = d[:, :, 3:] / 255
d[:, :, :3] = np.where(fill[:, :, None], d[:, :, :3] * a + inp * (1 - a), d[:, :, :3])
soft = cv2.GaussianBlur(sk.astype(np.float32), (0, 0), 1.2) * 255
d[:, :, 3] = np.maximum(d[:, :, 3], np.where(sk, 255, soft))
Image.fromarray(d.clip(0, 255).astype(np.uint8)).save(P(hid + '-dos'))
print(hid, ': crâne couvert,', int(fill.sum()), 'px')
