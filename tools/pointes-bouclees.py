"""Pointes nettes pour une coiffure bouclée longue : le bas coupé à plat (la planche s'arrête sous les épaules)
   est remplacé par des pointes de boucles arrondies, et les petits points clairs restés sur les bords (reste du fond
   de la planche) sont repeints de la couleur des cheveux voisins.
   Usage : python3 tools/pointes-bouclees.py <coiffure> [hauteur des pointes en px = 60] [graine = 1]"""
import sys, os, numpy as np, cv2
from PIL import Image
R = os.path.join(os.path.dirname(os.path.abspath(__file__)), '..')
hid = sys.argv[1]; HP = int(sys.argv[2]) if len(sys.argv) > 2 else 60; rng = np.random.default_rng(int(sys.argv[3]) if len(sys.argv) > 3 else 1)
P = lambda f: os.path.join(R, 'assets/coiffures', f + '.png')

def points_clairs(d):
    """points clairs isolés près du bord ou dans la masse : couleur médiane des cheveux autour"""
    a = d[:, :, 3]; rgb = d[:, :, :3].astype(np.uint8)
    lum = rgb.astype(float) @ [.299, .587, .114]
    med = cv2.medianBlur(rgb, 21).astype(float); lm = med @ [.299, .587, .114]
    bord = cv2.distanceTransform((a > 128).astype(np.uint8), cv2.DIST_L2, 5) < 18   # près du contour : seuil plus bas
    m = (a > 40) & ((lum > lm + 45) | (bord & (lum > lm + 22)))
    m = cv2.dilate(m.astype(np.uint8), np.ones((3, 3), np.uint8)).astype(bool) & (a > 0)
    d[m, :3] = med[m]
    # petits trous dans la masse (le fond se voyait au travers) : bouchés avec la couleur des cheveux autour
    op = (a > 128).astype(np.uint8); n_, lab, st, _ = cv2.connectedComponentsWithStats(1 - op, connectivity=4)
    trou = np.isin(lab, [i for i in range(1, n_) if st[i, 4] < 80 and st[i, 0] > 0 and st[i, 1] > 0 and st[i, 0] + st[i, 2] < op.shape[1] and st[i, 1] + st[i, 3] < op.shape[0]])
    trou = cv2.dilate(trou.astype(np.uint8), np.ones((3, 3), np.uint8)).astype(bool)
    d[trou, :3] = med[trou]; d[trou, 3] = np.maximum(d[trou, 3], 255 * (cv2.erode(op, np.ones((3,3),np.uint8))[trou] | 1))
    return int(m.sum() + trou.sum())

def lobes(W, base):
    """bas de chaque colonne : une suite de boucles arrondies de largeur et de longueur variables"""
    yb = np.full(W, float(base)); x = 0
    while x < W:
        w = int(rng.integers(20, 34)); c = x + w / 2; hw = w / 2
        long_ = base - rng.uniform(0, HP * .55)   # bas de cette boucle
        xs = np.arange(x, min(W, x + w)); u = np.clip((xs + .5 - c) / hw, -1, 1)
        yb[xs] = long_ - hw * 1.15 * (1 - np.sqrt(1 - u * u))   # bout arrondi
        x += w
    return yb

def pointes(d, yb, y0):
    H, W = d.shape[:2]; Y = np.arange(H)[:, None] + .5
    cov = np.clip(yb[None, :] - Y + .5, 0, 1)   # bord antialiasé
    cov[:y0] = 1
    d[:, :, 3] = d[:, :, 3] * cov
    # ombre douce juste au-dessus du bout de chaque boucle (relief)
    sh = np.clip(1 - (yb[None, :] - Y) / 7, 0, 1) * (Y > y0)
    d[:, :, :3] = d[:, :, :3] * (1 - .28 * sh[:, :, None])

F = np.array(Image.open(P(hid)).convert('RGBA')).astype(float); D = np.array(Image.open(P(hid + '-dos')).convert('RGBA')).astype(float)
H, W = F.shape[:2]
n = points_clairs(F) + points_clairs(D)
# bas actuel (coupe à plat) dans l'image de derrière
op = np.where((D[:, :, 3] > 128).any(1))[0]; base = op.max() - 2
yb = lobes(W, base); y0 = int(base - HP * .55 - 40)
pointes(D, yb, y0)
# devant : seulement les colonnes qui descendent jusqu'en bas (mèches sur les côtés)
fb = np.array([np.where(F[:, x, 3] > 128)[0].max() if (F[:, x, 3] > 128).any() else 0 for x in range(W)])
ybF = np.where(fb > base - 30, yb, H + 5)
pointes(F, ybF, y0)
Image.fromarray(F.clip(0, 255).astype(np.uint8)).save(P(hid)); Image.fromarray(D.clip(0, 255).astype(np.uint8)).save(P(hid + '-dos'))
for s in ('-peau', '-dos-peau'):
    if os.path.exists(P(hid + s)):
        q = np.array(Image.open(P(hid + s)).convert('RGBA')).astype(float); pointes(q, yb, y0)
        Image.fromarray(q.clip(0, 255).astype(np.uint8)).save(P(hid + s))
print(hid, ': pointes arrondies sous', y0, ',', n, 'points clairs repeints')
