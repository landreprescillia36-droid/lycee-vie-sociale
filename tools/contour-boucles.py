"""Contour net pour une coiffure bouclée (images <id>, <id>-dos et leurs -peau) :
   1. points clairs et petits trous (restes du fond de la planche) repeints couleur cheveux ;
   2. miettes détachées supprimées, contour lissé (plus de crans ni de picots) avec un bord fin et net ;
   3. bas des cheveux (coupé à plat ou en dents de scie) remplacé par des pointes de boucles arrondies
      qui suivent la forme de la coiffure.
   Le côté du visage (ligne du front, mèches autour du visage) n'est pas touché.
   Usage : python3 tools/contour-boucles.py <coiffure> [graine = 1]"""
import sys, os, re, json, numpy as np, cv2
from PIL import Image
R = os.path.join(os.path.dirname(os.path.abspath(__file__)), '..')
hid = sys.argv[1]; rng = np.random.default_rng(int(sys.argv[2]) if len(sys.argv) > 2 else 1)
P = lambda f: os.path.join(R, 'assets/coiffures', f + '.png')
src = open(os.path.join(R, 'tools/pointes-bouclees.py')).read(); ns = {'np': np, 'cv2': cv2}
exec(src[src.index('def points_clairs'):src.index('def lobes')], ns); points_clairs = ns['points_clairs']
js = open(os.path.join(R, 'js/coiffures-art.js')).read()
ix, iy, iw, ih = json.loads(re.search(r'"' + hid + r'":\{"img":(\[[^\]]*\])', js).group(1))
imgs = {s: np.array(Image.open(P(hid + s)).convert('RGBA')).astype(float) for s in ('', '-dos', '-peau', '-dos-peau') if os.path.exists(P(hid + s))}
F, D = imgs[''], imgs['-dos']; H, W = F.shape[:2]
U = ix + (np.arange(W) + .5) * iw / W; V = iy + (np.arange(H) + .5) * ih / H; UU, VV = np.meshgrid(U, V)
# visage du jeu (coordonnées de tête) un peu élargi : rien n'y est modifié
face = ((UU - 200) / 100) ** 2 + ((VV - 200) / 125) ** 2 < 1
n = points_clairs(F) + points_clairs(D)

def contour(d):
    a = d[:, :, 3] / 255.; mk = (a > .5).astype(np.uint8)
    nl, lab, st, _ = cv2.connectedComponentsWithStats(mk, connectivity=8)
    if nl > 2:   # miettes détachées
        big = 1 + np.argmax(st[1:, 4]); keep = np.isin(lab, [i for i in range(1, nl) if i == big or st[i, 4] > 400])
        mk = keep.astype(np.uint8)
    mk = cv2.morphologyEx(mk, cv2.MORPH_OPEN, cv2.getStructuringElement(cv2.MORPH_ELLIPSE, (5, 5)))
    mk = cv2.morphologyEx(mk, cv2.MORPH_CLOSE, cv2.getStructuringElement(cv2.MORPH_ELLIPSE, (7, 7)))
    sm = cv2.GaussianBlur(mk.astype(float), (0, 0), 3)
    new = cv2.GaussianBlur((sm > .5).astype(float), (0, 0), .8)
    keep_face = cv2.GaussianBlur(face.astype(float), (0, 0), 4)
    new = new * (1 - keep_face) + a * keep_face
    lum = d[:, :, :3] @ [.299, .587, .114]; g = np.median(d[(a > .9) & (lum < 45)][:, :3], 0)
    grow = new > a + .05; d[grow, :3] = g
    d[:, :, 3] = new * 255
    # liseré clair le long du bord extérieur : repeint couleur cheveux
    dist = cv2.distanceTransform((new > .5).astype(np.uint8), cv2.DIST_L2, 5)
    gl = g @ [.299, .587, .114]; rim = (dist < 14) & (new > 0) & (lum > gl + 10) & ~face
    k = (np.clip((lum - gl - 10) / 20, 0, 1) * np.clip((14 - dist) / 6, 0, 1))[:, :, None]
    d[:, :, :3] = np.where(rim[:, :, None], d[:, :, :3] * (1 - k) + g * k, d[:, :, :3])
for d in (F, D): contour(d)
# image de derrière : trous entre les cheveux et la joue (on voyait le fond) bouchés ; le visage passe devant
al = (np.maximum(F[:, :, 3], D[:, :, 3]) > 128).astype(np.uint8)
span = np.zeros(al.shape, bool)   # chaque rangée, entre le cheveu le plus à gauche et le plus à droite
for y in range(H):
    xs_ = np.where(al[y])[0]
    if len(xs_) and V[y] < 300: span[y, xs_.min():xs_.max() + 1] = True
hole = span & (D[:, :, 3] < 250)
g = np.median(D[(D[:, :, 3] > 230) & ((D[:, :, :3] @ [.299, .587, .114]) < 45)][:, :3], 0)
D[hole, :3] = g; D[hole, 3] = 255

# bas des cheveux : profil du bas (images devant + derrière), lissé, puis pointes arrondies
al = np.maximum(F[:, :, 3], D[:, :, 3]) > 128
bot = np.array([np.where(al[:, x])[0].max() if al[:, x].any() else -1 for x in range(W)], float)
cols = bot > H * .55   # colonnes dont le bas est dans la moitié inférieure
xs = np.where(cols)[0]
base = bot.copy()
if len(xs):
    b = cv2.GaussianBlur(bot[xs].reshape(1, -1), (0, 0), 6).ravel(); base[xs] = b
yb = np.full(W, H + 5.)
x = xs.min() if len(xs) else W
while len(xs) and x <= xs.max():
    w = int(rng.integers(22, 34)); hw = w / 2; c = x + hw; L = rng.uniform(2, 14)
    seg = np.arange(x, min(W, x + w)); seg = seg[cols[seg]]; u = np.clip((seg + .5 - c) / hw, -1, 1)
    yb[seg] = base[seg] - L - hw * 1.1 * (1 - np.sqrt(1 - u * u))
    x += w
yb[~cols] = H + 5
Y = np.arange(H)[:, None] + .5
cov = np.clip(yb[None, :] - Y + .5, 0, 1); top = (Y < (yb[None, :] - 45)); cov = np.where(top | face, 1, cov)
sh = np.clip(1 - (yb[None, :] - Y) / 7, 0, 1) * ~top * ~face
for d in imgs.values():
    d[:, :, 3] *= cov
for d in (F, D): d[:, :, :3] *= (1 - .28 * sh[:, :, None])
for s, d in imgs.items(): Image.fromarray(d.clip(0, 255).astype(np.uint8)).save(P(hid + s))
print(hid, ': contour net,', n, 'points clairs repeints,', len(xs), 'colonnes de pointes')
