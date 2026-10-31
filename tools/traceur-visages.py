"""Décalque les formes de visage de la planche de Prescillia (docs/references/visages/planche-visages.png).
   python3 tools/traceur-visages.py [dossier_debug]  ->  écrit le bloc FACE_ART dans js/app.js (entre les marqueurs)

   Pour chaque tête : silhouette de peau (le fond mauve est écarté), oreilles retirées (bords interpolés entre le dessus
   et le dessous de l'oreille), puis la mâchoire est suivie à l'intérieur de la silhouette (le cou est de la même couleur :
   on prend, colonne par colonne, la ligne où la peau devient plus sombre vers le bas = ombre sous le menton).
   Le contour est posé sur la tête du jeu : centre des yeux du dessin -> yeux du jeu (x 148 et 252, y 205)."""
import sys, os, json, re, numpy as np, cv2
SRC = 'docs/references/visages/planche-visages.png'
NAMES = ['ovale', 'rond', 'carre', 'rectangle', 'coeur', 'diamant', 'triangle', 'allonge', 'trapeze', 'losange']
dbg = sys.argv[1] if len(sys.argv) > 1 else None
im = cv2.imread(SRC); gray = cv2.cvtColor(im, cv2.COLOR_BGR2GRAY).astype(float)
hsv = cv2.cvtColor(im, cv2.COLOR_BGR2HSV)
sk = ((hsv[..., 0] < 25) & (hsv[..., 1] > 70)).astype(np.uint8)
sk = cv2.morphologyEx(sk, cv2.MORPH_CLOSE, np.ones((9, 9), np.uint8))
n, lab, st, cen = cv2.connectedComponentsWithStats(sk, 8)
heads = sorted([i for i in range(1, n) if st[i][4] > 5000], key=lambda i: (round(cen[i][1] / 150), cen[i][0]))
assert len(heads) == 20
gy = cv2.Sobel(cv2.GaussianBlur(gray, (0, 0), 1.2), cv2.CV_64F, 0, 1, ksize=3)
out = {'m': {}, 'f': {}}

def bez_path(P):
    """contour fermé (points) -> chemin de courbes de Bézier (Catmull-Rom), départ au point le plus bas du milieu"""
    P = np.array(P); N = len(P); s = []
    for i in range(N):
        p0, p1, p2, p3 = P[i - 1], P[i], P[(i + 1) % N], P[(i + 2) % N]
        c1 = p1 + (p2 - p0) / 6; c2 = p2 - (p3 - p1) / 6
        s.append('C%.1f,%.1f %.1f,%.1f %.1f,%.1f' % (c1[0], c1[1], c2[0], c2[1], p2[0], p2[1]))
    return 'M%.1f,%.1f ' % tuple(P[0]) + ' '.join(s) + 'Z'

for j, i in enumerate(heads):
    g = 'm' if j < 10 else 'f'; k = NAMES[j % 10]
    x0, y0, w, h, _ = st[i]; M = lab == i
    top = np.where(M.any(1))[0].min()
    # yeux : pupilles (pixels très sombres) dans le haut du visage
    zone = np.zeros_like(M); zone[top + int(h * .25):top + int(h * .55), x0:x0 + w] = True
    filled = cv2.morphologyEx(M.astype(np.uint8), cv2.MORPH_CLOSE, np.ones((25, 25), np.uint8)).astype(bool)
    dk = (gray < 55) & zone & filled
    ys, xs = np.where(dk); cx = (xs.min() + xs.max()) / 2
    L_ = xs < cx; exl, exr = xs[L_].mean(), xs[~L_].mean(); ey = ys.mean()
    S = 104 / (exr - exl); ecx = (exl + exr) / 2
    U = lambda x, y: (200 + (x - ecx) * S, 205 + (y - ey) * S)
    rows = range(top, y0 + h)
    Le = {y: np.where(filled[y])[0].min() for y in rows if filled[y].any()}
    Re = {y: np.where(filled[y])[0].max() for y in rows if filled[y].any()}
    # oreilles : de la hauteur des sourcils jusqu'au nez, la largeur bondit ; on relie le bord juste au-dessus et juste en dessous
    D = exr - exl
    def ears(E, sgn):   # entre ey-0,3D et ey+0,62D (oreilles), le bord est remplacé par une courbe d'Hermite
        a, b = int(ey - .3 * D), int(ey + .62 * D)
        for y in range(int(ey - .7 * D), int(ey)):   # haut de l'oreille : le bord saute vers l'extérieur
            if (E[y] - E[y - 2]) * sgn > 2.2: a = min(a, y - 4); break
        for y in range(int(ey + .35 * D), int(ey + 1.0 * D)):   # bas de l'oreille : le bord saute vers l'intérieur
            if (E[y - 2] - E[y]) * sgn > 2.2: b = max(b, y + 4); break
        v0, v1 = E[a], E[b]; d0 = (E[a] - E[a - 6]) / 6 * (b - a); d1 = (E[b + 6] - E[b]) / 6 * (b - a)
        E = dict(E)
        for y in range(a, b + 1):
            t = (y - a) / (b - a); h00, h10, h01, h11 = 2*t**3-3*t*t+1, t**3-2*t*t+t, -2*t**3+3*t*t, t**3-t*t
            E[y] = h00 * v0 + h10 * d0 + h01 * v1 + h11 * d1
        return E
    Le = ears(Le, -1)
    Re = ears(Re, 1)
    # jonction avec le cou : là où le bord arrête de rentrer (largeur minimale sous la bouche)
    ys_ = sorted(Le); wd = np.array([Re[y] - Le[y] for y in ys_])
    cand = [y for y in ys_ if ey + 1.0 * (exr - exl) <= y <= ey + 1.45 * (exr - exl) and Re[y] - Le[y] > .4 * (exr - exl)]
    yn = cand[int(np.argmin([Re[y] - Le[y] for y in cand]))]   # le plus étroit = cou
    # mâchoire : ligne d'ombre (assombrissement vers le bas) colonne par colonne
    jaw = []
    for x in range(int(Le[yn]) - 30, int(Re[yn]) + 31):
        ya, yb = int(ey + .88 * D), int(ey + 1.5 * D)
        col = gy[ya:yb, x].copy(); col[~filled[ya:yb, x]] = 0
        jaw.append((x, ya + int(np.argmin(col)), -col.min()))
    jx = np.array([q[0] for q in jaw], float); jy = np.array([q[1] for q in jaw], float); js = np.array([q[2] for q in jaw])
    # mâchoire : ligne d'ombre sous le menton, gardée seulement au-dessus du cou (colonnes entre les bords du cou, où elle est nette)
    xc = (Le[yn] + Re[yn]) / 2; hn = (Re[yn] - Le[yn]) / 2
    ok = (js > 6) & (np.abs(jx - xc) < hn - 3)
    if os.environ.get("DBG"): print(k, g, "yn", yn, "ey", ey, "D", D, "hn", hn, "xc", xc, (js > 6).sum())
    jyS = cv2.GaussianBlur(jy[ok].reshape(1, -1).astype(np.float32), (0, 0), 2).ravel(); jxS = jx[ok]
    # côtés : bord de la silhouette jusqu'à la jonction avec le cou (là où le bord devient vertical)
    def junction(E):
        for y in range(int(ey + .62 * D), yn):
            if abs(E[y + 4] - E[y]) < 1.2: return y
        return yn
    yl, yr = junction(Le), junction(Re)
    left = [U(Le[y], y) for y in sorted(Le) if y <= yl]                # haut -> bas (gauche)
    right = [U(Re[y], y) for y in sorted(Re) if y <= yr][::-1]         # bas -> haut (droite)
    bottom = [U(x, y) for x, y in zip(jxS, jyS)]                        # gauche -> droite
    C = left + bottom + right
    # symétrie : moyenne avec le miroir (le dessin est presque symétrique)
    C = np.array(C)
    P = []
    ang = lambda p: np.arctan2(p[1] - 190, p[0] - 200)
    th = np.linspace(0, 2 * np.pi, 96, endpoint=False) + np.pi / 2   # départ en bas (menton)
    A = np.arctan2(C[:, 1] - 190, C[:, 0] - 200); R = np.hypot(C[:, 0] - 200, C[:, 1] - 190)
    o = np.argsort(A); A, R = A[o], R[o]
    Rf = lambda a: np.interp(((a + np.pi) % (2 * np.pi)) - np.pi, A, R, period=2 * np.pi)
    for t in th:
        r = (Rf(t) + Rf(np.pi - t)) / 2
        P.append((200 + r * np.cos(t), 190 + r * np.sin(t)))
    P = np.array(P)
    r_ = np.hypot(P[:, 0] - 200, P[:, 1] - 190); r_ = np.convolve(np.r_[r_[-3:], r_, r_[:3]], np.array([1, 2, 1]) / 4, 'same')[3:-3]   # petites bosses lissées
    P = np.c_[200 + r_ * np.cos(th), 190 + r_ * np.sin(th)]
    d = bez_path(P)
    def edge_at(yv, sgn):
        q = P[(P[:, 0] - 200) * sgn > 0]; i_ = np.argmin(np.abs(q[:, 1] - yv)); return q[i_, 0]
    ex = round(float(edge_at(207, -1)) + 1, 1)
    out[g][k] = {'d': d, 'ex': ex, 'chin': round(float(P[0][1]), 1)}
    print(g, k, 'menton', round(float(P[0][1]), 1), 'joue', ex, 'haut', round(float(P[:, 1].min()), 1))
    if dbg:
        v = im[y0:y0 + h, x0:x0 + w].copy(); v = cv2.resize(v, None, fx=3, fy=3)
        inv = lambda X, Y: (int(((X - 200) / S + ecx - x0) * 3), int(((Y - 205) / S + ey - y0) * 3))
        cv2.polylines(v, [np.array([inv(*p) for p in P], np.int32)], True, (0, 255, 0), 1)
        cv2.imwrite(f'{dbg}/{g}-{k}.png', v)
js = 'const FACE_ART=' + json.dumps(out, separators=(',', ':')) + ';'
p = 'js/app.js'; t = open(p, encoding='utf-8').read()
t = re.sub(r'/\* FACE_ART:debut \*/.*?/\* FACE_ART:fin \*/', lambda m_: '/* FACE_ART:debut */' + js + '/* FACE_ART:fin */', t, flags=re.S)
open(p, 'w', encoding='utf-8').write(t)
