"""Côtés homogènes pour une coiffure (image de devant seulement, sans -dos) : contour extérieur lissé et net,
   liseré clair du bord retiré, taches claires ou brunâtres des côtés fondues vers la couleur des cheveux voisins.
   La ligne des cheveux autour du visage (boucles, baby hair) n'est pas touchée.
   Usage : python3 tools/cotes-homogenes.py <coiffure>"""
import sys, os, re, json, numpy as np, cv2
from PIL import Image
R = os.path.join(os.path.dirname(os.path.abspath(__file__)), '..')
hid = sys.argv[1]; P = lambda f: os.path.join(R, 'assets/coiffures', f + '.png')
js = open(os.path.join(R, 'js/coiffures-art.js')).read()
ix, iy, iw, ih = json.loads(re.search(r'"' + hid + r'":\{"img":(\[[^\]]*\])', js).group(1))
d = np.array(Image.open(P(hid)).convert('RGBA')).astype(float)
Mx = 24; k_ = iw / d.shape[1]   # marge ajoutée à gauche et à droite : le contour peut s'arrondir sans toucher le bord de l'image
d = np.pad(d, ((0, 0), (Mx, Mx), (0, 0))); H, W = d.shape[:2]; ix -= Mx * k_; iw += 2 * Mx * k_
U = ix + (np.arange(W) + .5) * iw / W; V = iy + (np.arange(H) + .5) * ih / H; UU, VV = np.meshgrid(U, V)
a = d[:, :, 3] / 255.; mk = (a > .5).astype(np.uint8)
# zone protégée : la ligne des cheveux autour du visage (bord intérieur), à moins de 22 px d'un pixel « visage »
face = (((UU - 200) / 96) ** 2 + ((VV - 200) / 122) ** 2 < 1)
near_face = cv2.distanceTransform((~face).astype(np.uint8), cv2.DIST_L2, 5) < 22
lum = d[:, :, :3] @ [.299, .587, .114]; g = np.median(d[(a > .9) & (lum < 40)][:, :3], 0); gl = g @ [.299, .587, .114]
# 1. contour extérieur : miettes retirées, bord lissé et net
nl, lab, st, _ = cv2.connectedComponentsWithStats(mk, connectivity=8)
if nl > 2: mk = np.isin(lab, [i for i in range(1, nl) if st[i, 4] > 300]).astype(np.uint8)
mk = cv2.morphologyEx(mk, cv2.MORPH_CLOSE, cv2.getStructuringElement(cv2.MORPH_ELLIPSE, (9, 9)))
mk = cv2.morphologyEx(mk, cv2.MORPH_OPEN, cv2.getStructuringElement(cv2.MORPH_ELLIPSE, (5, 5)))
sm1 = cv2.GaussianBlur(mk.astype(float), (0, 0), 3.5)
mkc = cv2.morphologyEx(mk, cv2.MORPH_CLOSE, cv2.getStructuringElement(cv2.MORPH_ELLIPSE, (35, 35)))   # creux du contour comblés
sm2 = cv2.GaussianBlur(mkc.astype(float), (0, 0), 7)   # côtés (sous le chignon) : contour plus régulier
ws = cv2.GaussianBlur(((np.abs(UU - 200) > 60) & (VV > 60)).astype(float), (0, 0), 8)
sm = sm1 * (1 - ws) + sm2 * ws
new = cv2.GaussianBlur((sm > .5).astype(float), (0, 0), .8)
# bas des côtés (coupés à plat par le bas de l'image) : bout arrondi
Yc = np.arange(H)[:, None] + .5
for half in (slice(0, W // 2), slice(W // 2, W)):
    cols = np.where((sm[H - 3, half] > .5))[0] + half.start
    if len(cols) < 6: continue
    x0, x1 = cols.min(), cols.max() + 1; hw = (x1 - x0) / 2; c = (x0 + x1) / 2; u = np.clip((np.arange(W) + .5 - c) / hw, -1, 1)
    yb = (H - 3) - hw * .9 * (1 - np.sqrt(1 - u * u)); m_ = (np.arange(W) >= x0 - 2) & (np.arange(W) < x1 + 2)
    sm[:, m_] = np.minimum(sm[:, m_], np.clip((yb[None, m_] - Yc) / 3 + .5, 0, 1))
keep = cv2.GaussianBlur((near_face | face).astype(float), (0, 0), 3)
new = new * (1 - keep) + a * keep
grow = new > a + .05; d[grow, :3] = g
d[:, :, 3] = new * 255
# 2. bord extérieur : liseré clair repeint ; côtés : taches claires / brunes fondues
inside = cv2.distanceTransform((new > .5).astype(np.uint8), cv2.DIST_L2, 5)
med = cv2.medianBlur(d[:, :, :3].clip(0, 255).astype(np.uint8), 21).astype(float); lm = med @ [.299, .587, .114]
rb = d[:, :, 0] - d[:, :, 2]
side = (np.abs(UU - 200) > 70) & ~near_face & ~face & (new > 0)
k1 = np.clip((lum - gl - 6) / 18, 0, 1) * (inside < 12)   # liseré
k2 = np.clip(np.maximum((lum - lm - 3) / 14, (rb - (g[0] - g[2]) - 10) / 20), 0, 1)   # taches
k = (np.maximum(k1, k2) * side)[:, :, None]
d[:, :, :3] = d[:, :, :3] * (1 - k) + np.where(k1[:, :, None] > k2[:, :, None], g, med) * k
# 3. côtés près du visage (tempes) : trous clairs entre les boucles (on voyait la peau) remplis couleur cheveux,
#    reflets brun clair foncés ; seule la bordure du visage (6 px) reste telle quelle
edge6 = cv2.distanceTransform((~face).astype(np.uint8), cv2.DIST_L2, 5) < 6
tz = (np.abs(UU - 200) > 55) & (VV > 110) & (VV < 260) & ~face & ~edge6
op = (d[:, :, 3] > 128).astype(np.uint8)
n_, lab, st, _ = cv2.connectedComponentsWithStats(1 - op, connectivity=4)
hole = np.isin(lab, [i for i in range(1, n_) if st[i, 4] < 600 and tz[st[i, 1] + st[i, 3] // 2, st[i, 0] + st[i, 2] // 2]]) & ~face
tz2 = ((UU < 150) | (UU > 250)) & (VV > 92) & (VV < 160)   # tempes : les creux entre les boucles (peau visible) comblés
clo = cv2.morphologyEx(op, cv2.MORPH_CLOSE, cv2.getStructuringElement(cv2.MORPH_ELLIPSE, (17, 17))) > 0
hole |= clo & tz2 & (op == 0)
hole = cv2.dilate(hole.astype(np.uint8), np.ones((3, 3), np.uint8)).astype(bool) & ~face
d[hole, :3] = g; d[hole, 3] = 255
lum = d[:, :, :3] @ [.299, .587, .114]; rb = d[:, :, 0] - d[:, :, 2]
k3 = (np.clip(np.maximum((lum - gl - 8) / 20, (rb - (g[0] - g[2]) - 6) / 16), 0, 1) * tz * (d[:, :, 3] > 0))[:, :, None]
d[:, :, :3] = d[:, :, :3] * (1 - k3) + g * k3
Image.fromarray(d.clip(0, 255).astype(np.uint8)).save(P(hid))
if os.path.exists(P(hid + '-peau')):
    q = np.pad(np.array(Image.open(P(hid + '-peau')).convert('RGBA')).astype(float), ((0, 0), (Mx, Mx), (0, 0))); q[:, :, 3] = np.minimum(q[:, :, 3], np.maximum(new, keep) * 255); q[hole, 3] = 0
    Image.fromarray(q.clip(0, 255).astype(np.uint8)).save(P(hid + '-peau'))
jsp = os.path.join(R, 'js/coiffures-art.js'); js = open(jsp).read()
js = re.sub(r'("' + hid + r'":\{"img":)\[[^\]]*\]', lambda m_: m_.group(1) + json.dumps([round(ix, 2), iy, round(iw, 2), ih]).replace(' ', ''), js, 1); open(jsp, 'w').write(js)
print(hid, ': côtés homogènes')
