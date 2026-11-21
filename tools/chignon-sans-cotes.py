"""« Chignon haut bouclé » d'après la correction de Prescillia : les mèches qui tombaient sur les côtés du visage sont
   retirées ; il reste le chignon et la ligne de boucles qui suit le front jusqu'aux tempes (au-dessus des sourcils).
   À lancer sur l'image d'origine. Usage : python3 tools/chignon-sans-cotes.py"""
import os, re, json, numpy as np, cv2
from PIL import Image
R = os.path.join(os.path.dirname(os.path.abspath(__file__)), '..'); os.chdir(R)
hid = 'bchignonhaut'; P = lambda f: 'assets/coiffures/' + f + '.png'
js = open('js/coiffures-art.js').read(); ix, iy, iw, ih = json.loads(re.search(r'"' + hid + r'":\{"img":(\[[^\]]*\])', js).group(1))
imgs = {s: np.array(Image.open(P(hid + s)).convert('RGBA')).astype(float) for s in ('', '-peau') if os.path.exists(P(hid + s))}
d = imgs['']; H, W = d.shape[:2]
U = ix + (np.arange(W) + .5) * iw / W; V = iy + (np.arange(H) + .5) * ih / H; UU, VV = np.meshgrid(U, V)
# contour du visage (forme ovale du jeu), en pixels de l'image
pts = []
for P0, P1, P2, P3 in (((200, 312), (140, 312), (106, 262), (106, 190)), ((106, 190), (106, 112), (148, 70), (200, 70)),
                       ((200, 70), (252, 70), (294, 112), (294, 190)), ((294, 190), (294, 262), (260, 312), (200, 312))):
    for t in np.linspace(0, 1, 120):
        pts.append([(1 - t) ** 3 * P0[i] + 3 * (1 - t) ** 2 * t * P1[i] + 3 * (1 - t) * t * t * P2[i] + t ** 3 * P3[i] for i in (0, 1)])
pts = np.array(pts); px = np.stack([(pts[:, 0] - ix) * W / iw, (pts[:, 1] - iy) * H / ih], 1).astype(np.int32)
face = np.zeros((H, W), np.uint8); cv2.fillPoly(face, [px], 1)
out = cv2.distanceTransform((1 - face).astype(np.uint8), cv2.DIST_L2, 5) * iw / W   # distance au visage, en unités de tête
# largeur gardée hors du visage : tout le chignon en haut, puis une bande de boucles qui s'affine jusqu'aux tempes
band = np.interp(VV, [60, 76, 90, 106, 128, 150, 162], [400, 75, 48, 26, 13, 7, 0])
keep = (face > 0) | (out < band)
keep = cv2.GaussianBlur(keep.astype(float), (0, 0), 3.5)
keep = cv2.GaussianBlur((keep > .5).astype(float), (0, 0), .8)
for dd in imgs.values(): dd[:, :, 3] *= keep
for s, dd in imgs.items(): Image.fromarray(dd.clip(0, 255).astype(np.uint8)).save(P(hid + s))
print(hid, ': côtés retirés')
