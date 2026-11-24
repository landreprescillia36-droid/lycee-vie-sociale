"""Oreilles des modèles de la planche (garçons), pixel par pixel : copiées dans l'image de peau de derrière (<id>-dos-peau),
   recolorée en jeu à la couleur de peau choisie ; le visage du jeu passe devant leur bord intérieur. Le jeu ne dessine
   alors plus ses propres oreilles pour cette coiffure (« op »:1).
   Usage : python3 tools/oreilles-planche.py <coiffure> <planche> <xg yg xd yd> <case X0 Y0 X1 Y1>"""
import sys, os, re, json, numpy as np, cv2
from PIL import Image
R = os.path.join(os.path.dirname(os.path.abspath(__file__)), '..'); os.chdir(R)
hid, cap = sys.argv[1], sys.argv[2]; xg, yg, xd, yd, X0, Y0, X1, Y1 = map(float, sys.argv[3:11])
P = lambda s: 'assets/coiffures/' + hid + s + '.png'
ref = cv2.imread(cap)[:, :, ::-1].astype(np.float32)
k = np.hypot(xd - xg, yd - yg) / 104; th = np.arctan2(yd - yg, xd - xg); ex, ey = (xg + xd) / 2, (yg + yd) / 2; kk = 102.4 / 104
js = open('js/coiffures-art.js').read(); m = re.search(r'"' + hid + r'":\{"img":(\[[^\]]*\])', js); ix, iy, iw, ih = json.loads(m.group(1))
F = np.array(Image.open(P('')).convert('RGBA')); H, W = F.shape[:2]
U = ix + (np.arange(W) + .5) * iw / W; V = iy + (np.arange(H) + .5) * ih / H; UU, VV = np.meshgrid(U, V)
u0 = 200 + (UU - 200) / kk; v0 = 205 + (VV - 221.6) / kk   # coordonnées de l'extraction
du, dv = (u0 - 200) * k, (v0 - 205) * k
X = (ex + du * np.cos(th) - dv * np.sin(th)).astype(np.float32); Y = (ey + du * np.sin(th) + dv * np.cos(th)).astype(np.float32)
C = cv2.remap(ref, X, Y, cv2.INTER_CUBIC, borderMode=cv2.BORDER_REPLICATE).clip(0, 255)
inside = (X > X0 + 2) & (X < X1 - 2) & (Y > Y0 + 2) & (Y < Y1 - 2)
lum = C @ [.299, .587, .114]; bg = np.array([226, 236, 248.])
# détourage doux : opacité d'après l'écart au fond de la case (bord lisse, sans liseré clair), couleur « dé-mélangée » du fond
fgd = np.abs(C - bg).sum(-1); am = np.clip((fgd - 18) / 70, 0, 1)
Cu = ((C - (1 - am[:, :, None]) * bg) / np.maximum(am[:, :, None], .08)).clip(0, 255)
redm = (C[:, :, 0] > 160) & (C[:, :, 0] - C[:, :, 1] > 105) & (C[:, :, 0] - C[:, :, 2] > 95) & (C[:, :, 1] < 80)   # traits rouges de Prescillia
du_ = np.abs(UU - 200)
hwg = np.interp(VV, [176, 190, 200], [95, 97, 98])   # bord du visage du jeu près de la tempe
zone = (du_ > 80) & (du_ < 140) & (VV > 176) & (VV < 288) & inside & ~((VV < 200) & (du_ < hwg))
ear = ((am > .5) & (lum > 38) & zone & ~cv2.dilate(redm.astype(np.uint8), np.ones((9, 9), np.uint8)).astype(bool)).astype(np.uint8)
ear = cv2.morphologyEx(ear, cv2.MORPH_OPEN, np.ones((3, 3), np.uint8))
n, lab, st, _ = cv2.connectedComponentsWithStats(ear, 8)
keep = np.zeros(ear.shape, bool)
for side in (-1, 1):   # la plus grande tache de chaque côté
    cand = [i for i in range(1, n) if np.sign(U[int(st[i, 0] + st[i, 2] / 2)] - 200) == side]
    if cand: keep |= lab == max(cand, key=lambda i: st[i, 4])
keep = cv2.morphologyEx(keep.astype(np.uint8), cv2.MORPH_CLOSE, cv2.getStructuringElement(cv2.MORPH_ELLIPSE, (9, 9))).astype(bool)
keep = cv2.morphologyEx(keep.astype(np.uint8), cv2.MORPH_OPEN, cv2.getStructuringElement(cv2.MORPH_ELLIPSE, (11, 11))).astype(bool)   # pas de pointe de tempe
# trous à l'intérieur (creux sombre de l'oreille) : remplis
inv = (~keep).astype(np.uint8); n3, l3, s3, _ = cv2.connectedComponentsWithStats(inv, 4)
keep |= np.isin(l3, [i for i in range(1, n3) if s3[i, 4] < 3000])
A = am * cv2.GaussianBlur(cv2.dilate(keep.astype(np.uint8), np.ones((3, 3), np.uint8)).astype(np.float32), (0, 0), .6)
# l'oreille est posée au bord du visage du jeu : bord extérieur à 126 avant l'ajustement de la coiffure (117 dans le jeu)
ES = float(os.environ.get('OREILLE_ECHELLE', 1.3))   # oreilles agrandies (le visage du jeu est plus grand que celui de la planche)
As, Cs_ = np.zeros_like(A), Cu.copy(); keep_s = np.zeros_like(keep)
for side in (-1, 1):
    sm = keep & (np.sign(UU - 200) == side)
    if not sm.any(): continue
    ys_, xs_ = np.where(sm); px, py = (xs_.min() if side > 0 else xs_.max()), (ys_.min() + ys_.max()) / 2   # pivot : attache côté visage
    M = np.float32([[ES, 0, px * (1 - ES)], [0, ES, py * (1 - ES)]])
    half = (np.sign(UU - 200) == side).astype(np.float32)
    As += cv2.warpAffine(A * half, M, (W, H)) * half
    Cs_ = np.where((cv2.warpAffine(half, M, (W, H)) * half)[:, :, None] > .5, cv2.warpAffine(Cu.astype(np.float32), M, (W, H)), Cs_)
    keep_s |= (cv2.warpAffine(sm.astype(np.uint8), M, (W, H)) > 0) & (half > 0)
A, Cu, keep = As, Cs_, keep_s
A2 = np.zeros_like(A); C2 = Cu.copy()
for side in (-1, 1):
    sm = keep & (np.sign(UU - 200) == side)
    if not sm.any(): continue
    outer = du_[sm].max(); vc = VV[sm].mean()
    # décalage vers l'extérieur, moins en haut : le haut de l'oreille reste collé à la tête (comme sur la planche)
    sh = (126 - outer) - np.interp(VV, [185, 215, 240], [9, 3, 0])   # unités, par rangée
    Xs = (np.arange(W)[None, :] - sh * W / iw * side).astype(np.float32); Ys = np.tile(np.arange(H, dtype=np.float32)[:, None], (1, W))
    ms = cv2.remap((np.sign(UU - 200) == side).astype(np.float32), Xs, Ys, cv2.INTER_NEAREST) > .5
    A2 = np.where(ms, cv2.remap((A * (np.sign(UU - 200) == side)).astype(np.float32), Xs, Ys, cv2.INTER_LINEAR), A2)
    C2 = np.where(ms[:, :, None], cv2.remap(Cu.astype(np.float32), Xs, Ys, cv2.INTER_LINEAR), C2)
A, Cu = A2, C2
# une oreille cachée (trait rouge, mèche) : on reprend l'autre en miroir
ar = [(A * (np.sign(UU - 200) == sd)).sum() for sd in (-1, 1)]
if min(ar) < .75 * max(ar):
    good = -1 if ar[0] > ar[1] else 1
    mx = np.clip(np.round(((400 - UU) - ix) / iw * W - .5), 0, W - 1).astype(int); ry = np.arange(H)[:, None]
    bad = np.sign(UU - 200) == -good
    A = np.where(bad, A[ry, mx], A); Cu = np.where(bad[:, :, None], Cu[ry, mx], Cu)
    print('  oreille', 'gauche' if good > 0 else 'droite', 'reprise en miroir')
# côté visage : fondu (le visage du jeu passe devant)
hw = np.interp(VV, [180, 210, 240, 270, 285], [96, 97, 92, 84, 78])
A *= np.clip((du_ - (hw - 12)) / 4, 0, 1)
nA, lA, sA, _ = cv2.connectedComponentsWithStats((A > .05).astype(np.uint8), 8)   # seulement l'oreille, pas de miettes
if nA > 1:
    big = [max([i for i in range(1, nA) if np.sign(U[int(sA[i, 0] + sA[i, 2] / 2)] - 200) == sd] or [0], key=lambda i: sA[i, 4] if i else -1) for sd in (-1, 1)]
    A = A * np.isin(lA, [b for b in big if b])
a = A; C = Cu; keep = A > .5
D = np.zeros((H, W, 4), np.float32)
if os.path.exists(P('-dos-peau')):
    D = np.array(Image.open(P('-dos-peau')).convert('RGBA')).astype(np.float32)
D[:, :, :3] = np.where(a[:, :, None] > 0, C, D[:, :, :3]); D[:, :, 3] = np.maximum(D[:, :, 3], a * 255)
Image.fromarray(D.clip(0, 255).astype(np.uint8)).save(P('-dos-peau'))
# les cheveux de devant ne passent pas sur l'oreille dessinée (sauf s'ils sont vraiment là sur la planche)
blk = re.search(r'("' + hid + r'":\{)([^}]*)\}', js); body = blk.group(2)
if '"op":1' not in body: body += ',"op":1'
js = js[:blk.start(2)] + body + js[blk.end(2):]; open('js/coiffures-art.js', 'w').write(js)
print(hid, ': oreilles de la planche', int(keep.sum()), 'px')
