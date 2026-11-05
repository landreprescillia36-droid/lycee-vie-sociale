"""Barbes des garçons (docs/references/barbes/planche-barbes.png, planche de Prescillia).
   Chaque visage de la planche est recalé sur le visage « Sans barbe » (même yeux, même nez) ; la barbe = ce qui est plus foncé
   que le visage sans barbe, au même endroit. On garde la clarté réelle des poils (texture), le jeu la reteint à la couleur
   des cheveux du nova. Placement : ligne des lèvres et largeur de la mâchoire de la planche → mêmes repères sur l'avatar."""
import json, numpy as np, cv2
S = 3
im = cv2.imread('docs/references/barbes/planche-barbes.png').astype(np.float32)
CX = [147, 398, 628, 863, 1107]; RY = [0, 310, 620]
IDS = [None, 'brb5j', 'brbcourte', 'brbmoyenne', 'brbcomplete', 'brbgoatee', 'brbmoustmenton', 'brbmoustache', 'brbmentonniere', 'brbetendue',
       'brbtaillee', 'brbprecise', 'brbfine', 'brbpatchy', 'brbsoul']
ref = im[165:240, 95:205]
X0, Y0, X1, Y1 = 62, 196, 236, 316          # zone de la barbe, coordonnées du visage « Sans barbe »
base = im[Y0:Y1, X0:X1]; L0 = base.mean(2)
LIP, CXF, CHIN, JAW = 244, 148.5, 282, 53.5    # repères relevés sur « Sans barbe »
# avatar garçon : lèvres à my-7.45, menton à my+37.4, demi-largeur de la mâchoire 64.9 à la hauteur des lèvres
SX, SY, LIPAV = 64.9 / JAW, 45 / (CHIN - LIP), -7.45
hh, ww = L0.shape; yy, xx = np.mgrid[0:hh, 0:ww]
# --- la barbe épouse le contour du visage de l'avatar garçon ---
# contour de la mâchoire relevé sur « Sans barbe » (demi-largeur depuis le centre 149.5, par hauteur)
from scipy.interpolate import RBFInterpolator
BJ = [(215, 59.5), (220, 59), (230, 57), (240, 54), (250, 48), (256, 45), (260, 39), (265, 31.5), (270, 23.5), (275, 15), (279, 7), (281, 0)]
BC = 149.5
FACE = json.load(open('tools/garcons-visage.json'))   # contour du visage de l'avatar garçon (moitié droite)
FY = np.array([q[1] for q in FACE]); FX = np.array([q[0] for q in FACE]); o = np.argsort(FY); FY, FX = FY[o], FX[o]
MY = 302; ALIP, ACHIN, AEYE, AEAR = MY - 7.45, 339.4, 215, 240
def Y(yb):   # hauteur planche → avatar (yeux, bas de l'oreille, lèvres, menton)
    return float(np.interp(yb, [187.5, 215, 244, 281], [AEYE, AEAR, ALIP, ACHIN], left=None, right=None)) if yb <= 281 else ACHIN + (yb - 281) * 1.2
def AE(ya): return float(np.interp(ya, FY, FX)) - 200
src, dst = [], []
for yb, hb in BJ:
    ya = Y(yb); ha = AE(ya) if yb < 281 else 0
    for k in (-1, 1):
        dst.append((BC + k * hb, yb)); src.append((200 + k * ha, ya))
# normales vers l'extérieur : l'épaisseur de la barbe hors du visage est gardée (×1.2)
BJa = np.array([(BC + hb, yb) for yb, hb in BJ]); AJa = np.array([(200 + (AE(Y(yb)) if yb < 281 else 0), Y(yb)) for yb, hb in BJ])
for i in range(len(BJ)):
    j0, j1 = max(0, i - 1), min(len(BJ) - 1, i + 1)
    for P, out in ((BJa, dst), (AJa, src)):
        t = P[j1] - P[j0]; n = np.array([t[1], -t[0]]); n /= np.linalg.norm(n) + 1e-9
        if n[0] < 0: n = -n
        sc = 1 if P is BJa else 1.2
        for d in (10, 22):
            q = P[i] + n * d * sc
            for k in (-1, 1): out.append((200 + k * (q[0] - 200) if P is AJa else BC + k * (q[0] - BC), q[1]))
# intérieur : centre des lèvres, commissures, milieu du menton, sous le nez
for (xb, yb), (xa, ya) in [((BC, 244), (200, ALIP)), ((127, 244), (175, ALIP)), ((172, 244), (225, ALIP)), ((BC, 265), (200, Y(265))), ((BC, 222), (200, 265)), ((132, 230), (178, 276)), ((167, 230), (222, 276)), ((BC, 300), (200, Y(300)))]:
    dst.append((xb, yb)); src.append((xa, ya))
RB = RBFInterpolator(np.array(src), np.array(dst), kernel='thin_plate_spline', smoothing=.5)
AX0, AX1, AY0, AY1 = 90, 310, round(Y(Y0)), round(Y(Y1))
gy, gx = np.mgrid[0:(AY1 - AY0) * S, 0:(AX1 - AX0) * S]
q = RB(np.column_stack([AX0 + (gx.ravel() + .5) / S, AY0 + (gy.ravel() + .5) / S]))
MAPX = (q[:, 0] - X0).reshape(gx.shape).astype(np.float32) - .5; MAPY = (q[:, 1] - Y0).reshape(gx.shape).astype(np.float32) - .5
art = {}
for k, bid in enumerate(IDS):
    if not bid: continue
    r, c = divmod(k, 5)
    x0, y0 = CX[c] - 110, 140 + RY[r]
    t = im[y0:y0 + 200, x0:x0 + 220]
    _, _, _, ml = cv2.minMaxLoc(cv2.matchTemplate(t, ref, cv2.TM_CCOEFF_NORMED))
    dx, dy = x0 + ml[0] - 95, y0 + ml[1] - 165
    T = im[Y0 + dy:Y1 + dy, X0 + dx:X1 + dx]; L = T.mean(2)
    d = L0 - L
    a = np.clip((d - 6) / np.maximum(L0 - 28, 30), 0, 1)
    # fond clair de la planche : seuls les vrais poils (très foncés) comptent ; les petits décalages de contour s'en vont
    bg = L0 > 190
    a[bg] = np.clip((120 - L[bg]) / 70, 0, 1)
    # traits fins (contours qui ne tombent pas pile) : ouverture morphologique
    m = (a > .12).astype(np.uint8)
    m = cv2.morphologyEx(m, cv2.MORPH_OPEN, np.ones((3, 3), np.uint8))
    n, lab, st, _ = cv2.connectedComponentsWithStats(m)
    keep = np.zeros_like(m)
    for i in range(1, n):
        if st[i, cv2.CC_STAT_AREA] >= 50: keep[lab == i] = 1
    keep = cv2.dilate(keep, np.ones((3, 3), np.uint8))
    a = a * cv2.GaussianBlur(keep.astype(np.float32), (0, 0), .8)
    # haut : on n'emporte pas les cheveux ni les oreilles (fondu)
    a *= np.clip((yy - 4) / 10, 0, 1)
    # clarté des poils seuls (on retire la peau qui transparaît)
    Lb = np.clip((L - (1 - a) * L0) / np.maximum(a, .05), 0, 255)
    Lb = np.where(a > .05, Lb, 40)
    # ombre douce de la planche sous la barbe (peau, pas des poils) : retirée
    a = a * np.clip((62 - Lb) / 22, 0, 1)
    g = np.clip(Lb, 0, 255)
    rgba = np.dstack([g, g, g, a * 255]).astype(np.float32)
    big = cv2.remap(rgba, MAPX, MAPY, cv2.INTER_CUBIC, borderMode=cv2.BORDER_CONSTANT, borderValue=0)
    cv2.imwrite(f'assets/barbes/{bid}.png', np.clip(big, 0, 255).astype(np.uint8), [cv2.IMWRITE_PNG_COMPRESSION, 9])
    sel = a > .5
    v = np.sort(Lb[sel] / 255) if sel.sum() > 30 else np.array([.1, .15, .3])
    l0, lm, l1 = [float(v[int(q * (len(v) - 1))]) for q in (.02, .5, .98)]
    art[bid] = [AX0 - 200, AY0 - MY, AX1 - AX0, AY1 - AY0, round(l0, 3), round(lm, 3), round(max(l1, lm + .05), 3)]
    print(bid, (dx, dy), art[bid])
open('js/barbes-art.js', 'w').write('/* barbes décalquées par tools/traceur-barbes.py sur docs/references/barbes/planche-barbes.png — ne pas modifier à la main\n   [x, y (par rapport au centre de la bouche), largeur, hauteur, clarté sombre, moyenne, claire] */\nconst BEARD_ART=' + json.dumps(art, separators=(',', ':')) + ';\n')
