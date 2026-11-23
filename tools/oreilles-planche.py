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
skin = (np.abs(C - bg).sum(-1) > 45) & (C[:, :, 0] - C[:, :, 2] > 25) & (lum > 55)
redm = (C[:, :, 0] > 160) & (C[:, :, 0] - C[:, :, 1] > 105) & (C[:, :, 0] - C[:, :, 2] > 95) & (C[:, :, 1] < 80)   # traits rouges de Prescillia
skin &= ~cv2.dilate(redm.astype(np.uint8), np.ones((9, 9), np.uint8)).astype(bool)
zone = (np.abs(UU - 200) > 80) & (np.abs(UU - 200) < 140) & (VV > 180) & (VV < 285) & inside & ~((VV < 200) & (np.abs(UU - 200) < 104))   # pas la tempe au-dessus de l oreille
ear = (skin & zone).astype(np.uint8)
ear = cv2.morphologyEx(ear, cv2.MORPH_CLOSE, np.ones((5, 5), np.uint8))
n, lab, st, _ = cv2.connectedComponentsWithStats(ear, 8)
keep = np.zeros_like(ear, bool)
for side in (-1, 1):   # la plus grande tache de chaque côté
    cand = [i for i in range(1, n) if np.sign(U[int(st[i, 0] + st[i, 2] / 2)] - 200) == side]
    if cand: keep |= lab == max(cand, key=lambda i: st[i, 4])
keep = cv2.morphologyEx(keep.astype(np.uint8), cv2.MORPH_CLOSE, np.ones((9, 9), np.uint8)).astype(bool)
# l'oreille est posée au bord du visage du jeu (plus large que celui de la planche) : décalée vers l'extérieur
# jusqu'à ce que son bord extérieur soit celui des oreilles du jeu (demi-largeur 117 dans le jeu, soit 126 avant l'ajustement de la coiffure à la tête)
ring0 = cv2.dilate(keep.astype(np.uint8), np.ones((5, 5), np.uint8)).astype(bool) & ~keep & zone & (np.abs(C - bg).sum(-1) > 45)
full = keep | ring0; Cs = C.copy(); full2 = np.zeros_like(full)
for side in (-1, 1):
    sm = full & ((np.sign(UU - 200)) == side)
    if not sm.any(): continue
    outer = np.abs(UU[sm] - 200).max(); sh = int(round((126 - outer) * W / iw)) * side
    vc = VV[sm].mean(); sy_ = int(round((225 - vc) * H / ih))
    M = np.float32([[1, 0, sh], [0, 1, sy_]])
    full2 |= cv2.warpAffine(sm.astype(np.uint8), M, (W, H)).astype(bool)
    cs = cv2.warpAffine(C, M, (W, H)); Cs = np.where(cv2.warpAffine(sm.astype(np.uint8), M, (W, H))[:, :, None] > 0, cs, Cs)
    print('  côté', side, 'bord', round(outer, 1), 'centre v', round(vc, 1))
keep, C = full2, Cs
# une oreille cachée (trait rouge, mèche) : on reprend l'autre en miroir
ar = [(keep & (np.sign(UU - 200) == sd)).sum() for sd in (-1, 1)]
if min(ar) < .75 * max(ar):
    good = -1 if ar[0] > ar[1] else 1
    mx = np.clip(np.round(((400 - UU) - ix) / iw * W - .5), 0, W - 1).astype(int)   # u -> 400 - u
    side_bad = np.sign(UU - 200) == -good
    mk = keep[np.arange(H)[:, None], mx]; mc = C[np.arange(H)[:, None], mx]
    keep = np.where(side_bad, mk, keep); C = np.where(side_bad[:, :, None], mc, C)
    print('  oreille', 'gauche' if good > 0 else 'droite', 'reprise en miroir')
keep = cv2.morphologyEx(keep.astype(np.uint8), cv2.MORPH_OPEN, cv2.getStructuringElement(cv2.MORPH_ELLIPSE, (17, 17))).astype(bool)   # pas de bout de tempe
n2, lb2, st2, _ = cv2.connectedComponentsWithStats(keep.astype(np.uint8), 8)
keep = np.isin(lb2, [i for i in range(1, n2) if st2[i, 4] > 800])
# bord : le contour sombre de l'oreille dessiné sur la planche est gardé (1 à 2 px autour)
ring = np.zeros_like(keep)
a = cv2.GaussianBlur((keep | ring).astype(np.float32), (0, 0), .7)
# côté visage : fondu (le visage du jeu passe devant)
hw = np.interp(VV, [180, 210, 240, 270, 285], [96, 97, 92, 84, 78])
a *= np.clip((np.abs(UU - 200) - (hw - 12)) / 4, 0, 1)
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
