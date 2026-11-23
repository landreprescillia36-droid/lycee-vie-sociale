"""Forme du haut de la tête prise sur la planche (garçons) : silhouette du modèle (cheveux + peau, sans le fond ni les oreilles),
   du haut du crâne jusqu'au niveau des yeux, en coordonnées de la coiffure. Enregistrée en « tete » : le jeu ne dessine la peau
   du crâne qu'à l'intérieur de cette forme (plus de crâne du jeu qui dépasse de la coiffure).
   Usage : python3 tools/tete-planche.py <coiffure> <planche> <xg yg xd yd> <case X0 Y0 X1 Y1>"""
import sys, os, re, json, numpy as np, cv2
R = os.path.join(os.path.dirname(os.path.abspath(__file__)), '..'); os.chdir(R)
hid, cap = sys.argv[1], sys.argv[2]; xg, yg, xd, yd, X0, Y0, X1, Y1 = map(float, sys.argv[3:11])
im = cv2.imread(cap)[:, :, ::-1].astype(np.float32)
k = np.hypot(xd - xg, yd - yg) / 104; ex, ey = (xg + xd) / 2, (yg + yd) / 2; kk = 102.4 / 104
C = im[int(Y0):int(Y1), int(X0):int(X1)]
bg = np.median(np.r_[C[2:8].reshape(-1, 3), C[:, 2:8].reshape(-1, 3), C[:, -8:-2].reshape(-1, 3)], 0)
red = (C[:, :, 0] > 140) & (C[:, :, 0] - C[:, :, 1] > 70)
fg = ((np.abs(C - bg).sum(-1) > 40) & ~red).astype(np.uint8)
fg = cv2.morphologyEx(fg, cv2.MORPH_OPEN, np.ones((3, 3), np.uint8)); fg = cv2.morphologyEx(fg, cv2.MORPH_CLOSE, np.ones((7, 7), np.uint8))
n, lab, st, _ = cv2.connectedComponentsWithStats(fg, 8); fg = lab == 1 + np.argmax(st[1:, 4])
lum = C @ [.299, .587, .114]; hair = fg & (lum < 70)
def uv(X, Y):   # pixel de la case -> coordonnées de la coiffure
    u0 = 200 + (X + X0 - ex) / k; v0 = 205 + (Y + Y0 - ey) / k
    return 200 + (u0 - 200) * kk, 221.6 + (v0 - 205) * kk
L, Rr = [], []
for y in range(C.shape[0]):
    xs = np.where(fg[y])[0]
    if not len(xs): continue
    u, v = uv(0, y)
    if v > 214: break
    a, b = xs.min(), xs.max()
    if v > 185:   # oreilles de la planche : seulement les cheveux, sinon le bord du crâne au-dessus
        hx = np.where(hair[y])[0]
        a = min(a_prev, hx.min()) if len(hx) else a_prev; b = max(b_prev, hx.max()) if len(hx) else b_prev
        a = max(a, a_prev); b = min(b, b_prev) if not len(hx) else b
    a_prev, b_prev = a, b
    pa, pb = uv(a, y), uv(b + 1, y)
    if v > 115:   # près des oreilles : rejoint en douceur la largeur du visage du jeu (pas de marche sur la tempe)
        tt = np.clip((v - 115) / 40, 0, 1); tt = tt * tt * (3 - 2 * tt); gw = 99
        wa, wb = 200 - pa[0], pb[0] - 200
        pa = (200 - max(wa, wa + (gw - wa) * tt), pa[1]); pb = (200 + max(wb, wb + (gw - wb) * tt), pb[1])
    L.append(pa); Rr.append(pb)
L = np.array(L); Rr = np.array(Rr)
sm = lambda P: np.c_[cv2.GaussianBlur(P[:, 0].reshape(-1, 1), (0, 0), 2).ravel(), P[:, 1]]
L, Rr = sm(L), sm(Rr); st_ = max(1, len(L) // 70)
pts = list(L[::st_]) + [L[-1], (L[-1][0] - 40, L[-1][1] + 2), (Rr[-1][0] + 40, Rr[-1][1] + 2), Rr[-1]] + list(Rr[::-st_])
d = 'M' + ' '.join('%.1f,%.1f' % (p[0], p[1]) for p in pts) + 'Z'
js = open('js/coiffures-art.js').read(); blk = re.search(r'("' + hid + r'":\{)([^}]*)\}', js)
body = re.sub(r',"tete":"[^"]*"', '', blk.group(2)); body += ',"tete":"' + d + '"'
js = js[:blk.start(2)] + body + js[blk.end(2):]; open('js/coiffures-art.js', 'w').write(js)
print(hid, ': tête de la planche, haut v =', round(L[0][1], 1), 'jusqu\'à', round(L[-1][1], 1))
