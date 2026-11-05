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
    a = a * np.clip((70 - Lb) / 25, 0, 1)
    g = np.clip(Lb, 0, 255)
    rgba = np.dstack([g, g, g, a * 255])
    big = cv2.resize(rgba, None, fx=S, fy=S, interpolation=cv2.INTER_CUBIC)
    cv2.imwrite(f'assets/barbes/{bid}.png', np.clip(big, 0, 255).astype(np.uint8), [cv2.IMWRITE_PNG_COMPRESSION, 9])
    sel = a > .5
    v = np.sort(Lb[sel] / 255) if sel.sum() > 30 else np.array([.1, .15, .3])
    l0, lm, l1 = [float(v[int(q * (len(v) - 1))]) for q in (.02, .5, .98)]
    art[bid] = [round((X0 - CXF) * SX, 2), round(LIPAV + (Y0 - LIP) * SY, 2), round(ww * SX, 2), round(hh * SY, 2),
                round(l0, 3), round(lm, 3), round(max(l1, lm + .05), 3)]
    print(bid, (dx, dy), art[bid])
open('js/barbes-art.js', 'w').write('/* barbes décalquées par tools/traceur-barbes.py sur docs/references/barbes/planche-barbes.png — ne pas modifier à la main\n   [x, y (par rapport au centre de la bouche), largeur, hauteur, clarté sombre, moyenne, claire] */\nconst BEARD_ART=' + json.dumps(art, separators=(',', ':')) + ';\n')
