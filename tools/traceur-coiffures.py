"""Décalque les coiffures dessinées par Prescillia (docs/references/coiffures/) en formes SVG lisses.
   python3 tools/traceur-coiffures.py [dossier_debug]  ->  écrit js/coiffures-art.js

   Pour chaque coiffure : on isole les cheveux (pixels sombres ou gris, ni peau ni fond),
   on retire les accessoires (ras-de-cou…), on regroupe les nuances en quelques teintes,
   puis on trace les contours dans le repère local de la tête du jeu (HT) :
   le visage du modèle (largeur à hauteur des yeux) est posé sur le visage ovale du jeu
   (x 106 → 294), le haut des cheveux sur y = 56 et le menton sur y = 312.
   « back » = cheveux visibles derrière le cou (dessinés avant le corps), « front » = le reste
   (dessiné après le visage)."""
import sys, os, json, numpy as np, cv2

HAIRS = {
 # id du jeu : image, rangée du menton, rangée de mesure de la largeur du visage, zones à retirer, zone « derrière le cou »
 'longs': {'src': 'docs/references/coiffures/longs-lisses.jpg', 'chin': 212, 'face_row': 145, 'bottom': 356,
           'cut': [(216, 230, 103, 148)], 'back': (206, 262, 80, 170), 'extend': 50, 'volume': 0, 'tips': False, 'mirror': 'right', 'fcut': [345, 136]},
}
# planche de 15 coiffures (docs/references/coiffures/planche-coiffures.jpg, découpée en cases) : le visage de chaque case
# est retrouvé en le comparant à celui de la case « cheveux longs » (modele-visage.png), ce qui donne sa position et sa taille ;
# la case est ensuite posée sur la tête du jeu avec la même échelle que « longs » (validée par Prescillia)
ROW_BOTTOM = [298, 286, 268]   # au-dessous : étiquette du nom (une par rangée de la planche)
def case(nom, rang, back=True, **kw):
    return {'src': f'docs/references/coiffures/{nom}.png', 'match': True, 'bottom': ROW_BOTTOM[rang], 'back': back, 'tips': False, 'smooth': False, **kw}
HAIRS.update({
 'carrelisse': case('carrelisse', 0, False), 'queuehaute2': case('queuehaute2', 0, False, combler='gd', oreilles=True), 
 'mechesdevant': case('mechesdevant', 1), 'frangedroite': case('frangedroite', 1),
 'chignonhaut2': case('chignonhaut2', 1, False, oreilles=True), 'raiecotel': case('raiecotel', 1), 'deuxtresses': case('deuxtresses', 1, False, combler='gd', oreilles=True),
 'serretete': case('serretete', 2, accessoire='noir'), 'barrette': case('barrette', 2, accessoire='clair'),
 'raiemilieu': case('raiemilieu', 2), 'queuelisse': case('queuelisse', 2, True, combler='gd', oreilles=True),
})
# planche des coiffures bouclées et crépues (docs/references/coiffures/planche-bouclees.png) : autre modèle de visage,
# un peu plus grand (×1,033 d'après l'écart des yeux et la hauteur yeux-menton) ; rangées : étiquette du nom en bas de chaque case
# 14 coiffures décalquées sur la première planche (dossier bouclees/) ; les 6 qui y étaient dessinées de trois quarts
# (chignons, queues, tresses en arrière) sont reprises de la planche refaite de face avec le visage du jeu (bouclees-face/)
ROW_B, ROW_C = [268, 236, 219, 204], [274, 256, 251, 204]
FACE6 = ['bchignonhaut', 'bchignonbas', 'bchignonmeches', 'bqueue', 'btressesarriere', 'bqueuehaute']
def boucle(nom, rang, back=False, **kw):
    if nom in FACE6:
        return {'src': f'docs/references/coiffures/bouclees-face/{nom}.png', 'match': 'c', 'bottom': ROW_C[rang], 'back': back, 'tips': False, 'smooth': False, 'bord': 13, 'combler': 'gd', **kw}
    return {'src': f'docs/references/coiffures/bouclees/{nom}.png', 'match': 'b', 'bottom': ROW_B[rang], 'back': back, 'tips': False, 'smooth': False, 'bord': 13, **kw}
for i, ids in enumerate([['bafro', 'bbantu', 'bcarre', 'bchignon', 'bpuffs'], ['bbox', 'bcollees', 'bdemiqueue', 'bqueue', 'blongs'],
                         ['bchignonhaut', 'bchignonbas', 'btwists', 'bchignonmeches', 'bwashgo'], ['bfoulard', 'btressesboucles', 'bcourt', 'bqueuehaute', 'btressesarriere']]):
    for k in ids: HAIRS[k] = boucle(k, i)
HAIRS['bbox']['bottom'] = 222
HAIRS['bfoulard']['accessoire'] = 'foulard'
HAIRS['bafro']['trous'] = HAIRS['bcarre']['trous'] = [(140, 175, 280, 332), (225, 260, 280, 332)]   # sous la mâchoire, entre les boucles et le cou
HAIRS['bbantu']['fermer'] = [(265, 310, 55, 105)]   # tempe droite, entre les deux nœuds
for k in ['bbantu', 'bchignon', 'bpuffs', 'bcollees', 'bfoulard', 'bcourt'] + FACE6: HAIRS[k]['oreilles'] = True
# modèles de visage : image, découpe (sourcils -> bouche), centre des yeux et menton dans la découpe, taille par rapport au visage de « longs »
K_LONGS, CHIN_U = 1.785, 308.5
def _bez(d):   # contour du visage « ovale » du jeu (FACES.ovale dans js/app.js), en points
    n = [float(t) for t in d.replace('M', ' ').replace('C', ' ').replace('Z', ' ').replace(',', ' ').split()]
    P = [(n[0], n[1])]; pts = []
    for i in range(2, len(n), 6):
        p1, p2, p3 = (n[i], n[i + 1]), (n[i + 2], n[i + 3]), (n[i + 4], n[i + 5]); p0 = P[-1]
        for t in np.linspace(0, 1, 30):
            pts.append([(1 - t) ** 3 * p0[k] + 3 * (1 - t) ** 2 * t * p1[k] + 3 * (1 - t) * t * t * p2[k] + t ** 3 * p3[k] for k in (0, 1)])
        P.append(p3)
    return np.array(pts, np.float32)
FACE_OV = _bez('M200,312 C140,312 106,262 106,190 C106,112 148,70 200,70 C252,70 294,112 294,190 C294,262 260,312 200,312Z')
FACES_T = {True: (cv2.imread('docs/references/coiffures/modele-visage.png')[92:165, 70:138], 34, 25.5, 80, 1.0),
           'b': (cv2.imread('docs/references/coiffures/bouclees/bcarre.png')[116:186, 82:162], 39.25, 27, 82.75, 1.033),
           # visage du jeu dessiné par Prescillia : yeux à ±30 px et 59 px au-dessus du menton = yeux du jeu (±52, y 205) et menton (y 312)
           'c': (cv2.imread('docs/references/coiffures/bouclees-face/bcarre.png')[118:194, 95:191], 48, 30, 89.5, K_LONGS / 1.77)}
EYES_T = {True: (26.25, 54.5), 'b': (27.1, 56.3), 'c': (30, 59.5)}   # écart des yeux au centre et hauteur yeux-menton, en px du modèle (taille 1)
def visage(img, m=True):
    T, ex, ey_, ch, k = FACES_T[m]; best = None
    for s in np.arange(.8, 1.45, .01):
        t = cv2.resize(T, None, fx=s, fy=s, interpolation=cv2.INTER_AREA)
        r = cv2.matchTemplate(img, t, cv2.TM_CCOEFF_NORMED); _, v, _, loc = cv2.minMaxLoc(r)
        if best is None or v > best[0]: best = (v, s, loc)
    v, s, (x, y) = best
    return s * k, x + ex * s, y + ch * s
# repère du dessin « longs » : 1,785 unité de tête par pixel du modèle, menton du modèle en y = 308,5
UP = 8
dbg = sys.argv[1] if len(sys.argv) > 1 else None
out = {}
ONLY = os.environ.get("ONLY", "").split(",") if os.environ.get("ONLY") else None
for hid, c in HAIRS.items():
    if ONLY and hid not in ONLY: continue
    im = cv2.imread(c['src'])[:, :, ::-1].astype(int)
    if c.get('match'):
        fs, fcx, fch = visage(cv2.imread(c['src']), c['match'])
        c['chin'] = int(fch); c['face'] = (fs, fcx, fch)
        if c.get('face3q'):   # tête de trois quarts sur la planche : redressée de face. À hauteur des sourcils, le bord des cheveux à gauche (arrière
            # du crâne, trop large) et à droite (côté visage, écrasé) est ramené à égale distance de l'axe des yeux ; repères mesurés sur chaque case
            Lo, Ro = fcx + c['face3q'][0], fcx + c['face3q'][1]; W = (Ro - Lo) / 2
            src_pts = [Lo, fcx, Ro]; dst_pts = [fcx - W, fcx, fcx + W]
            xo = np.arange(im.shape[1], dtype=np.float32)
            xs_ = np.interp(xo, dst_pts, src_pts).astype(np.float32)
            xs_[xo < dst_pts[0]] = xo[xo < dst_pts[0]] - (dst_pts[0] - src_pts[0])   # queue, chignon : suivent le bord sans être déformés
            xs_[xo > dst_pts[2]] = xo[xo > dst_pts[2]] - (dst_pts[2] - src_pts[2])
            mx = np.tile(xs_, (im.shape[0], 1)); my = np.tile(np.arange(im.shape[0], dtype=np.float32)[:, None], (1, im.shape[1]))
            if c.get('chignon'):   # chignon sur le dessus : décalé vers le milieu (fondu entre y0 et y1, au-dessus du crâne)
                S_, y0_, y1_ = c['chignon']; ys_ = np.arange(im.shape[0], dtype=np.float32)
                mx -= (S_ * np.clip((y1_ - ys_) / (y1_ - y0_), 0, 1))[:, None]
            im = cv2.remap(im.astype(np.uint8), mx, my, cv2.INTER_CUBIC, borderMode=cv2.BORDER_REPLICATE).astype(int)
        c['cut'] = [(int(fch + 4 * fs), int(fch + 22 * fs), int(fcx - 24 * fs), int(fcx + 24 * fs))]   # ras-de-cou
        ex_, ey_ = EYES_T[c['match']]; sc_ = fs / FACES_T[c['match']][4]   # les deux yeux (quand une mèche fine les touche, ils seraient pris pour des cheveux)
        ey = fch - ey_ * sc_
        mh, mw = {True: (10, 15), 'b': (10 * 1.033, 15 * 1.033), 'c': (11, 16)}[c['match']]
        c['cut'] += [(int(ey - mh * sc_), int(ey + mh * sc_), int(fcx + dx * sc_ - mw * sc_), int(fcx + dx * sc_ + mw * sc_)) for dx in (-ex_, ex_)]
        c['back'] = (int(fch - 6 * fs), c['bottom'], 0, im.shape[1]) if c['back'] else None
    if c.get('mirror'):   # moitié du dessin recopiée en miroir (Prescillia a validé ce côté-là)
        sk0 = (im[..., 0] - im[..., 2] > 45) & (im[..., 0] > 120); fx0 = np.where(sk0[c['face_row']])[0]; cx0 = (fx0.min() + fx0.max() + 1) / 2
        # axe = la raie (colonne la plus claire en haut du crâne), pour ne pas doubler la raie
        lu0 = (im * [.299, .587, .114]).sum(-1); dk = np.where((lu0 < 70).any(1))[0][0]
        cols = np.arange(int(cx0) - 10, int(cx0) + 11); cx0 = cols[np.argmax(lu0[dk + 4:dk + 22, cols].mean(0))] + .5
        xs0 = np.arange(im.shape[1]); src = np.clip(np.round(2 * cx0 - 1 - xs0).astype(int), 0, im.shape[1] - 1)
        side = xs0 < cx0 if c['mirror'] == 'right' else xs0 >= cx0
        im = im.copy(); im[:, side] = im[:, src[side]]
    lum = (im * [.299, .587, .114]).sum(-1); r, g, b = im[..., 0], im[..., 1], im[..., 2]
    skin = (r - b > 45) & (r > 120)
    cand = ((lum < 95) | ((lum < 130) & (abs(r - b) < 25))) & ~skin
    cand[c['bottom']:] = False
    for y0, y1, x0, x1 in c['cut']: cand[y0:y1, x0:x1] = False
    n, lab, st, _ = cv2.connectedComponentsWithStats(cand.astype(np.uint8), 8)
    amax = max(st[i][4] for i in range(1, n))
    big = [i for i in range(1, n) if st[i][4] > amax * .08]   # les cheveux, pas les yeux ni les sourcils
    hair = np.isin(lab, big)
    hair = cv2.morphologyEx(hair.astype(np.uint8), cv2.MORPH_CLOSE, np.ones((3, 3), np.uint8)).astype(bool)
    hair = cv2.morphologyEx(hair.astype(np.uint8), cv2.MORPH_OPEN, np.ones((7, 1), np.uint8)).astype(bool)   # enlève les traits fins horizontaux (contour des épaules)
    if c.get('match'):   # boucles d'oreilles du dessin (perles blanches cerclées de foncé) : retirées des cheveux, le trou sera bouché
        fs_ = c['face'][0]; pe = (lum > 185) & (abs(r - b) < 40)
        pe[:int(c['chin'] - 50 * fs_)] = False; pe[int(c['chin'] - 5 * fs_):] = False
        n_, lab_, st_, _ = cv2.connectedComponentsWithStats(pe.astype(np.uint8), 8)
        pe = np.isin(lab_, [i for i in range(1, n_) if st_[i][4] < 80 * fs_ ** 2])
        ring = cv2.dilate(pe.astype(np.uint8), cv2.getStructuringElement(cv2.MORPH_ELLIPSE, (11, 11))).astype(bool) & ~pe
        c['perle'] = (ring & hair) | pe; hair &= ~cv2.dilate(pe.astype(np.uint8), cv2.getStructuringElement(cv2.MORPH_ELLIPSE, (11, 11))).astype(bool)
    accM = None
    if c.get('accessoire'):   # barrette (claire) ou serre-tête (noir neutre) : calque à part, jamais reteint avec les cheveux
        if c['accessoire'] == 'clair': acc = (lum > 120) & (r - b < 20) & cv2.dilate(hair.astype(np.uint8), np.ones((9, 9), np.uint8)).astype(bool)
        elif c['accessoire'] == 'foulard': acc = (lum > 36) & (lum < 80) & (abs(g - b) <= 4) & (r - g > 10) & (r - g < 30)   # tissu prune, plus clair que les cheveux
        else: acc = ((r - b) < 6) & (lum < 70)
        acc[int(c['chin'] - 60 * c['face'][0]):] = False
        acc = cv2.morphologyEx(acc.astype(np.uint8), cv2.MORPH_CLOSE, np.ones((3, 3), np.uint8))
        n_, lab_, st_, _ = cv2.connectedComponentsWithStats(acc, 8); accM = lab_ == 1 + int(np.argmax(st_[1:, 4]))
        hair |= accM
    # le dessin est coupé par le cadre : on prolonge les mèches (même profil, mêmes reflets) de « extend » pixels
    ext = c.get('extend', 0)
    if ext:
        yb = np.where(hair.any(1))[0].max() - 4          # les dernières lignes touchent le bord du cadre
        band = im[yb - 28:yb]; reps = []                  # bande de 28 lignes répétée en miroir : pas de raccord visible
        while sum(len(x) for x in reps) < ext: reps.append(band[::-1] if len(reps) % 2 == 0 else band)
        hair = np.vstack([hair[:yb], np.repeat(hair[yb - 1:yb], ext, 0), np.zeros((im.shape[0] - yb, im.shape[1]), bool)])
        im = np.vstack([im[:yb], np.vstack(reps)[:ext], im[yb:]])
        skin = np.vstack([skin, np.zeros((ext, skin.shape[1]), bool)])
    # volume (demandé par Prescillia) : chaque mèche extérieure est étirée vers l'extérieur de « volume » pixels,
    # progressivement depuis le sommet du crâne ; les reflets suivent puisque ce sont les mêmes pixels étirés
    vol = c.get('volume', 0)
    if vol:
        t0 = np.where(hair.any(1))[0].min()
        im2 = im.copy(); h2 = hair.copy(); W = hair.shape[1]
        for y in range(t0, hair.shape[0]):
            d = vol * min(1, (y - t0) / 28)
            if d < .3: continue
            row = hair[y]; xs_ = np.where(row)[0]
            if not len(xs_): continue
            for side in (0, 1):
                if side == 0:
                    a = xs_.min(); b = a
                    while b + 1 < W and row[b + 1]: b += 1           # mèche de gauche : [a, b]
                    tgt = np.arange(max(0, int(a - d)), b + 1); src = b - (b - tgt) * (b - a) / (b - a + d)
                else:
                    b = xs_.max(); a = b
                    while a - 1 >= 0 and row[a - 1]: a -= 1          # mèche de droite : [a, b]
                    tgt = np.arange(a, min(W, int(b + d) + 1)); src = a + (tgt - a) * (b - a) / (b - a + d)
                si = np.clip(np.round(src).astype(int), 0, W - 1)
                im2[y, tgt] = im[y, si]; h2[y, tgt] = hair[y, si]
        im, hair = im2, h2
        # contour extérieur lissé (pas de marche à la hauteur des épaules) : on comble avec les pixels du bord
        rows = [y for y in range(hair.shape[0]) if hair[y].any()]
        L_ = np.array([np.where(hair[y])[0].min() for y in rows], float); R_ = np.array([np.where(hair[y])[0].max() for y in rows], float)
        # le bord extérieur ne peut rentrer que très lentement (0,15 px par ligne) : pas de marche aux épaules
        Ls = L_.copy(); Rs = R_.copy()
        for i in range(1, len(rows)):
            if rows[i] >= t0 + 100: Ls[i] = min(L_[i], Ls[i - 1] + .15); Rs[i] = max(R_[i], Rs[i - 1] - .15)
        for y, l0, ls, r0, rs in zip(rows, L_, Ls, R_, Rs):
            l0, r0 = int(l0), int(r0); ls = int(round(ls)); rs = int(round(rs))
            if ls < l0: n_ = l0 - ls; im[y, ls:l0] = im[y, l0 + 2:l0 + 2 + n_][::-1]; hair[y, ls:l0] = True   # mèches en miroir : même texture
            if rs > r0: n_ = rs - r0; im[y, r0 + 1:rs + 1] = im[y, r0 - 1 - n_:r0 - 1][::-1]; hair[y, r0 + 1:rs + 1] = True
    ys, xs = np.where(hair); top = ys.min()
    row = skin[c.get('face_row', c['chin'] - 30)]; fx = np.where(row)[0]
    fl, fr = fx.min(), fx.max(); cx = (fl + fr + 1) / 2
    sy = (312 - 56) / (c["chin"] - top); sx = sy   # même échelle en largeur et en hauteur : la forme du dessin est gardée telle quelle
    toU = lambda px, py: (200 + (px / UP - cx) * sx, 56 + (py / UP - top) * sy)
    if c.get('face'):
        fs, cx, fch = c['face']; sx = sy = K_LONGS / fs
        toU = lambda px, py: (200 + (px / UP - cx) * sx, CHIN_U + (py / UP - fch) * sy)
    # visage de trois quarts : l'oreille du dessin laisse un trou entre les cheveux, hors du visage du jeu ; on le remplit de mèches
    if c.get('combler') or c.get('trous') or c.get('fermer') or c.get('perle') is not None and c['perle'].any():
        fill = np.zeros_like(hair)
        for y, x in zip(*np.where(c.get('perle', fill))):   # contour sombre des perles retirées : rebouché en cheveux s'il est hors du visage du jeu
            u, v = toU(x * UP, y * UP)
            if ((u - 200) / 94) ** 2 + ((v - 190) / 122) ** 2 > 1: fill[y, x] = True
        exact = c.get('match') == 'c'   # planche au visage du jeu : contour exact du visage ovale, des tempes jusqu'au menton
        y1_ = int(c['chin']) if exact else int(c['chin'] - 28 * c['face'][0])
        for y in range(top, y1_ if c.get('combler') else top):   # jusqu'au bas de l'oreille
            xs_ = np.where(hair[y])[0]
            if len(xs_) < 2: continue
            for x in (range(hair.shape[1]) if exact else range(xs_.min(), xs_.max())):
                if hair[y, x]: continue
                u, v = toU(x * UP, y * UP)
                if exact:   # entre les cheveux (du côté extérieur) et le bord du visage, sur une bande de 22 unités : l'oreille du dessin est rebouchée
                    if not (140 < v < 245 and (xs_.min() < x if u < 200 else xs_.max() > x)): continue   # hauteur de l'oreille seulement
                    if -22 < cv2.pointPolygonTest(FACE_OV, (float(u), float(v)), True) < 4: fill[y, x] = True   # 4 unités sur le bord du visage : pas de liseré clair
                elif (u < 200 if c['combler'] == 'g' else True) and ((u - 200) / 94) ** 2 + ((v - 190) / 122) ** 2 > 1: fill[y, x] = True
        if c.get('fermer'):   # creux entre deux nœuds (ouvert vers l'extérieur) : refermé comme le dessin de l'autre côté
            cl = cv2.morphologyEx(hair.astype(np.uint8), cv2.MORPH_CLOSE, cv2.getStructuringElement(cv2.MORPH_ELLIPSE, (15, 15))).astype(bool) & ~hair
            for y, x in zip(*np.where(cl)):
                u, v = toU(x * UP, y * UP)
                if any(u0 <= u <= u1 and v0 <= v <= v1 for u0, u1, v0, v1 in c['fermer']): fill[y, x] = True
        for u0, u1, v0, v1 in c.get('trous', []):   # trous montrés par Prescillia (zones en unités de tête) : bouchés entre la mèche extérieure et le visage ou le cou
            for y in range(hair.shape[0]):
                xs_ = np.where(hair[y])[0]
                if not len(xs_): continue
                for x in range(hair.shape[1]):
                    if hair[y, x]: continue
                    u, v = toU(x * UP, y * UP)
                    if u0 <= u <= u1 and v0 <= v <= v1 and (xs_.min() < x if u < 200 else xs_.max() > x) \
                            and cv2.pointPolygonTest(FACE_OV, (float(u), float(v)), True) < 2: fill[y, x] = True
        n_, lab_, st_, _ = cv2.connectedComponentsWithStats(fill.astype(np.uint8), 8)
        fill = np.isin(lab_, [i for i in range(1, n_) if st_[i][4] > 6])
        # couleur unie des cheveux voisins (moyenne des seuls pixels de cheveux, très floutée) : pas de peau, pas de motif
        w_ = hair.astype(np.float32); sm_ = cv2.GaussianBlur(im.astype(np.float32) * w_[..., None], (0, 0), 6) / np.maximum(cv2.GaussianBlur(w_, (0, 0), 6), 1e-3)[..., None]
        im = im.copy(); im[fill] = (sm_[fill] * .85).astype(int)   # un peu plus foncé : ombre derrière l'oreille
        if c.get('trous') or c.get('fermer'):   # bord des zones rebouchées : même couleur sur 2 px, pour qu'aucun pixel du fond ne reste au bord
            ring = cv2.dilate(fill.astype(np.uint8), np.ones((5, 5), np.uint8)).astype(bool) & ~hair & ~fill
            im[ring] = (sm_[ring] * .85).astype(int)
        hair |= fill
    if c.get('front'):   # ligne du front : les petites encoches (petits cheveux du dessin) sont bouchées avec la mèche juste au-dessus
        ey = int(c['chin'] - 62 * c['face'][0])
        cl = cv2.morphologyEx(hair.astype(np.uint8), cv2.MORPH_CLOSE, cv2.getStructuringElement(cv2.MORPH_ELLIPSE, (13, 13))).astype(bool)
        cl[ey:] = False; new = cl & ~hair
        im = im.copy()
        for y, x in sorted(zip(*np.where(new))):
            ya = y
            while ya > 0 and not hair[ya, x]: ya -= 1
            im[y, x] = im[max(0, ya - (y - ya)), x]
        hair |= new
    n_, lab_, st_, _ = cv2.connectedComponentsWithStats(hair.astype(np.uint8), 8)   # petites taches isolées retirées
    hair = np.isin(lab_, [i for i in range(1, n_) if st_[i][4] > st_[1:, 4].max() * .01])
    bigim = cv2.resize(im.astype(np.uint8), None, fx=UP, fy=UP, interpolation=cv2.INTER_CUBIC)
    kb = c.get('bord', 41)   # lissage du contour (plus petit pour les boucles : leur contour est gardé)
    M = cv2.GaussianBlur(cv2.resize(hair.astype(np.float32), None, fx=UP, fy=UP, interpolation=cv2.INTER_LINEAR), (kb, kb), 0) > .5
    # pointes : le dessin s'arrête au bord de l'image ; on finit les mèches en pointes douces (dents de 21 px, hauteur 12 px)
    if c.get('tips', True):
        yb = np.where(M.any(1))[0].max(); per, amp = 21 * UP, 12 * UP
        xx = np.arange(M.shape[1]); tri = np.abs(((xx / per) % 1) * 2 - 1)   # 0 au milieu d'une dent, 1 entre deux
        for y in range(yb - amp, yb + 1):
            M[y, ((yb - y) < amp * tri ** .8)] = False
        M = cv2.GaussianBlur(M.astype(np.float32), (25, 25), 0) > .5
    # derrière le cou : on remplit tout l'espace entre les mèches (le cou du jeu passe devant)
    backR = np.zeros_like(M)
    by0, by1, bx0, bx1 = c['back'] or (0, 0, 0, 0)
    for y in range(by0 * UP, by1 * UP):
        xs_ = np.where(M[y])[0]
        if len(xs_): backR[y, xs_.min():xs_.max() + 1] = True
    # nuances : clarté lissée dans le sens des mèches (flou étiré à la verticale), puis 5 bandes de clarté
    lu = (bigim.astype(np.float32) * [.299, .587, .114]).sum(-1)
    w = M.astype(np.float32)
    k_ = (UP | 1, UP * 7 | 1)
    lu_s = cv2.GaussianBlur(lu * w, k_, 0) / np.maximum(cv2.GaussianBlur(w, k_, 0), 1e-3)
    K = 5
    qs = np.percentile(lu_s[M], [20, 45, 70, 90])
    L = np.where(M, np.digitize(lu_s, qs), -1)
    rgb = np.array([np.median(bigim[L == k], 0) if (L == k).any() else [0, 0, 0] for k in range(K)])
    hexc = lambda v: '#%02x%02x%02x' % tuple(int(t) for t in v)
    areas = [int((L == k).sum()) for k in range(K)]; main = int(np.argmax(areas))
    def paths(mask):
        cs, _ = cv2.findContours(mask.astype(np.uint8), cv2.RETR_CCOMP, cv2.CHAIN_APPROX_NONE)
        res = []
        for ct in cs:
            if cv2.contourArea(ct) < UP * UP * 1.5: continue
            ct = cv2.approxPolyDP(ct, UP * .35, True).reshape(-1, 2)
            if len(ct) < 3: continue
            res.append('M' + ' '.join('%.1f,%.1f' % toU(x, y) for x, y in ct) + 'Z')
        return ''.join(res)
    def layers(part):
        res = [['sil', paths(part), hexc(rgb[main])]]
        for k in sorted(range(K), key=lambda k: -areas[k]):
            if k == main: continue
            d = paths(part & (L == k))
            if d: res.append(['c', d, hexc(rgb[k])])
        return res
    box = np.zeros_like(M)   # tout est dessiné devant : le dessin montre déjà les cheveux derrière le cou
    # les vrais pixels du dessin (texture des mèches), détourés, en PNG ×3 : assets/coiffures/<id>.png
    os.makedirs('assets/coiffures', exist_ok=True)
    F = M & ~box; S = 3
    sz = (bigim.shape[1] * S // UP, bigim.shape[0] * S // UP)
    clean = cv2.fastNlMeansDenoisingColored(np.ascontiguousarray(im.astype(np.uint8)[:, :, ::-1]), None, 1, 1, 3, 7)[:, :, ::-1]   # enlève les blocs de la compression JPEG
    # trous dans les cheveux (là où le contour de l'épaule croisait les mèches) : bouchés et repeints avec les mèches voisines
    hole = np.zeros_like(F0 := cv2.resize(F.astype(np.uint8), (im.shape[1], im.shape[0]), interpolation=cv2.INTER_NEAREST))
    cs_, _ = cv2.findContours(F0, cv2.RETR_EXTERNAL, cv2.CHAIN_APPROX_SIMPLE); cv2.drawContours(hole, cs_, -1, 1, -1); hole = hole & (1 - F0)
    n_, lab_, st_, _ = cv2.connectedComponentsWithStats(hole, 8); hole = np.isin(lab_, [i for i in range(1, n_) if st_[i][4] < 400]).astype(np.uint8)   # petits trous seulement
    near = cv2.dilate(hole, np.ones((5, 5), np.uint8)).astype(bool)
    lumc = (clean.astype(float) * [.299, .587, .114]).sum(-1)
    sk_in = (((clean[..., 0].astype(int) - clean[..., 2] > 40) & (clean[..., 0] > 80)) | (near & (lumc > 55)) | hole.astype(bool)).astype(np.uint8)
    if c.get('match') in ('b', 'c'):   # bretelles blanches du débardeur et fond clair coincés entre les boucles ou les tresses : repeints en cheveux
        sk_in |= ((lumc > 140) & (abs(clean[..., 0].astype(int) - clean[..., 2]) < 45)).astype(np.uint8)
    if c.get('accessoire'): sk_in[cv2.dilate(hole, np.ones((5, 5), np.uint8)) > 0] = 0   # barrette : gardée telle quelle, pas repeinte en cheveux
    F = F | (cv2.resize(hole, (F.shape[1], F.shape[0]), interpolation=cv2.INTER_NEAREST) > 0)   # restes de peau ou de contour orangé dans les cheveux
    a = cv2.GaussianBlur(cv2.erode(F.astype(np.uint8), np.ones((UP // 2 * 2 + 1,) * 2, np.uint8)).astype(np.float32), (9, 9), 0)   # bord resserré : pas de liseré couleur peau
    # la raie (ligne de peau entre les deux côtés, en haut du crâne) est gardée telle quelle
    fy0 = np.where(skin[:, int(cx)])[0]; fy0 = fy0[fy0 > top + 3].min() if len(fy0[fy0 > top + 3]) else top + 30
    sk_in[:fy0, max(0, int(cx) - 3):int(cx) + 4] = 0
    if not c.get('front'): sk_in[:int(c['chin'] * .55)] = 0   # front : les petits cheveux orangés du dessin (couleur de peau) sont repeints en mèches
    for u0, u1, v0, v1 in c.get('fermer', []):   # dans les creux refermés : les pixels clairs du fond coincés entre les nœuds sont repeints
        for y, x in zip(*np.where((lumc > 120) & (abs(clean[..., 0].astype(int) - clean[..., 2]) < 45))):
            u, v = toU(x * UP, y * UP)
            if u0 <= u <= u1 and v0 <= v <= v1: sk_in[y, x] = 1
    if sk_in.any(): clean = cv2.inpaint(np.ascontiguousarray(clean[:, :, ::-1]), cv2.dilate(sk_in, np.ones((3, 3), np.uint8)), 3, cv2.INPAINT_TELEA)[:, :, ::-1]
    px = cv2.resize(cv2.resize(clean, (bigim.shape[1], bigim.shape[0]), interpolation=cv2.INTER_CUBIC), sz, interpolation=cv2.INTER_AREA); al = cv2.resize(a, sz, interpolation=cv2.INTER_AREA)
    # mèches verticales : un filtre médian vertical efface les petits traits horizontaux sans toucher aux mèches
    # lumière : les reflets du dessin sont renforcés (contraste local sur la clarté, net dans le sens des mèches)
    lab_ = cv2.cvtColor(px[:, :, ::-1], cv2.COLOR_BGR2LAB); Lc = lab_[..., 0].astype(np.float32)
    blur = cv2.GaussianBlur(Lc, (0, 0), sigmaX=9, sigmaY=25)
    Lc = np.clip(blur + (Lc - blur) * c.get('gloss', 1.0), 0, 255)
    lab_[..., 0] = Lc.astype(np.uint8); px = cv2.cvtColor(lab_, cv2.COLOR_LAB2BGR)[:, :, ::-1]
    al = cv2.morphologyEx(al, cv2.MORPH_CLOSE, np.ones((11, 11), np.uint8))   # bouche les encoches du bord
    al = np.clip((cv2.GaussianBlur(al, (0, 0), 4) - .5) * 3 + .5, 0, 1)   # contour adouci et régulier (pas de bosses)
    # contours extérieurs lisses sur les côtés (demandé par Prescillia) : sous les tempes, le bord gauche et le bord droit
    # suivent une courbe moyenne ; les bosses sont coupées, les creux comblés avec les mèches voisines (en miroir)
    rows_ = [y for y in range(al.shape[0]) if (al[y] > .5).any()]
    if rows_ and c.get('smooth', True):
        y0_ = rows_[0] + int((rows_[-1] - rows_[0]) * .22)
        Ys = [y for y in rows_ if y >= y0_]
        Lx = np.array([np.where(al[y] > .5)[0].min() for y in Ys], float); Rx = np.array([np.where(al[y] > .5)[0].max() for y in Ys], float)
        k = 45; sm = lambda v: np.convolve(np.pad(v, k, mode='edge'), np.ones(2 * k + 1) / (2 * k + 1), 'valid')
        Ls, Rs = sm(sm(Lx)), sm(sm(Rx))
        for y, l0, ls, r0, rs in zip(Ys, Lx, Ls, Rx, Rs):
            l0, r0, ls, rs = int(l0), int(r0), int(round(ls)), int(round(rs))
            if ls > l0: al[y, :ls] = 0
            elif ls < l0: n_ = l0 - ls; px[y, ls:l0] = px[y, l0 + 1:l0 + 1 + n_][::-1]; al[y, ls:l0] = al[y, l0 + 2]
            if rs < r0: al[y, rs + 1:] = 0
            elif rs > r0: n_ = rs - r0; px[y, r0 + 1:rs + 1] = px[y, r0 - n_:r0][::-1]; al[y, r0 + 1:rs + 1] = al[y, r0 - 2]
        al = np.clip((cv2.GaussianBlur(al, (0, 0), 1.5) - .5) * 2 + .5, 0, 1)
    ys2, xs2 = np.where(al > .02); X0, Y0, X1, Y1 = xs2.min(), ys2.min(), xs2.max() + 1, ys2.max() + 1
    rgba = np.dstack([px[..., ::-1], (al * 255).clip(0, 255).astype(np.uint8)])[Y0:Y1, X0:X1]
    cv2.imwrite(f'assets/coiffures/{hid}.png', rgba, [cv2.IMWRITE_PNG_COMPRESSION, 9])
    if accM is not None:
        aa = cv2.GaussianBlur(cv2.resize(accM.astype(np.float32), sz, interpolation=cv2.INTER_LINEAR), (0, 0), .8)
        aa = np.clip((aa - .5) * 2.5 + .5, 0, 1)
        po = cv2.resize(im.astype(np.uint8), sz, interpolation=cv2.INTER_CUBIC)
        cv2.imwrite(f'assets/coiffures/{hid}-acc.png', np.dstack([po[..., ::-1], (aa * 255).astype(np.uint8)])[Y0:Y1, X0:X1], [cv2.IMWRITE_PNG_COMPRESSION, 9])
    u0 = toU(X0 * UP / S, Y0 * UP / S); u1 = toU(X1 * UP / S, Y1 * UP / S)
    hl = lu[F] / 255
    out_img = {'img': [round(u0[0], 2), round(u0[1], 2), round(u1[0] - u0[0], 2), round(u1[1] - u0[1], 2)],
               'lum': [round(float(np.percentile(hl, 5)), 3), round(float(np.median(hl)), 3), round(float(np.percentile(hl, 98)), 3)]}
    if accM is not None: out_img['acc'] = 1
    if c.get('oreilles'): out_img['ears'] = 1   # oreilles du jeu visibles à travers les cheveux
    if c.get('fcut'): out_img['fcut'] = c['fcut']   # découpe des mèches de devant : [hauteur des épaules, demi-largeur]
    out[hid] = {**out_img, 'main': hexc(rgb[main]), 'back': [['sil', paths(backR), hexc(rgb[0])]], 'front': [['sil', '', hexc(rgb[main])]]}   # avec l'image, les calques vectoriels de devant ne servent pas (fichier 10 fois plus léger)
    if dbg:
        v = np.zeros_like(bigim); v[:] = 235
        for k in range(K): v[L == k] = rgb[k]
        cv2.imwrite(f'{dbg}/coiffure_{hid}.png', cv2.resize(v[:, :, ::-1], None, fx=.5, fy=.5))
    print(hid, 'visage', fl, fr, 'haut', top, 'échelle', round(sx, 3), round(sy, 3))
js = '/* formes décalquées par tools/traceur-coiffures.py sur docs/references/coiffures/ — ne pas modifier à la main */\nconst HAIR_ART=' + json.dumps(out, separators=(',', ':')) + ';\n'
open('js/coiffures-art.js', 'w').write(js)
print(len(js), 'octets')
