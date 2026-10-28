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
           'cut': [(216, 230, 103, 148)], 'back': (206, 262, 80, 170), 'extend': 50, 'volume': 7, 'tips': False, 'mirror': 'right'},
}
UP = 8
dbg = sys.argv[1] if len(sys.argv) > 1 else None
out = {}
for hid, c in HAIRS.items():
    im = cv2.imread(c['src'])[:, :, ::-1].astype(int)
    if c.get('mirror'):   # moitié du dessin recopiée en miroir (Prescillia a validé ce côté-là)
        sk0 = (im[..., 0] - im[..., 2] > 45) & (im[..., 0] > 120); fx0 = np.where(sk0[c['face_row']])[0]; cx0 = (fx0.min() + fx0.max() + 1) / 2
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
    row = skin[c['face_row']]; fx = np.where(row)[0]
    fl, fr = fx.min(), fx.max(); cx = (fl + fr + 1) / 2
    sy = (312 - 56) / (c["chin"] - top); sx = sy   # même échelle en largeur et en hauteur : la forme du dessin est gardée telle quelle
    toU = lambda px, py: (200 + (px / UP - cx) * sx, 56 + (py / UP - top) * sy)
    bigim = cv2.resize(im.astype(np.uint8), None, fx=UP, fy=UP, interpolation=cv2.INTER_CUBIC)
    M = cv2.GaussianBlur(cv2.resize(hair.astype(np.float32), None, fx=UP, fy=UP, interpolation=cv2.INTER_LINEAR), (41, 41), 0) > .5
    # pointes : le dessin s'arrête au bord de l'image ; on finit les mèches en pointes douces (dents de 21 px, hauteur 12 px)
    if c.get('tips', True):
        yb = np.where(M.any(1))[0].max(); per, amp = 21 * UP, 12 * UP
        xx = np.arange(M.shape[1]); tri = np.abs(((xx / per) % 1) * 2 - 1)   # 0 au milieu d'une dent, 1 entre deux
        for y in range(yb - amp, yb + 1):
            M[y, ((yb - y) < amp * tri ** .8)] = False
        M = cv2.GaussianBlur(M.astype(np.float32), (25, 25), 0) > .5
    # derrière le cou : on remplit tout l'espace entre les mèches (le cou du jeu passe devant)
    by0, by1, bx0, bx1 = c['back']
    backR = np.zeros_like(M)
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
    clean = cv2.fastNlMeansDenoisingColored(np.ascontiguousarray(im.astype(np.uint8)[:, :, ::-1]), None, 5, 5, 5, 15)[:, :, ::-1]   # enlève les blocs de la compression JPEG
    # trous dans les cheveux (là où le contour de l'épaule croisait les mèches) : bouchés et repeints avec les mèches voisines
    hole = np.zeros_like(F0 := cv2.resize(F.astype(np.uint8), (im.shape[1], im.shape[0]), interpolation=cv2.INTER_NEAREST))
    cs_, _ = cv2.findContours(F0, cv2.RETR_EXTERNAL, cv2.CHAIN_APPROX_SIMPLE); cv2.drawContours(hole, cs_, -1, 1, -1); hole = hole & (1 - F0)
    n_, lab_, st_, _ = cv2.connectedComponentsWithStats(hole, 8); hole = np.isin(lab_, [i for i in range(1, n_) if st_[i][4] < 400]).astype(np.uint8)   # petits trous seulement
    near = cv2.dilate(hole, np.ones((5, 5), np.uint8)).astype(bool)
    lumc = (clean.astype(float) * [.299, .587, .114]).sum(-1)
    sk_in = (((clean[..., 0].astype(int) - clean[..., 2] > 40) & (clean[..., 0] > 80)) | (near & (lumc > 55)) | hole.astype(bool)).astype(np.uint8)
    F = F | (cv2.resize(hole, (F.shape[1], F.shape[0]), interpolation=cv2.INTER_NEAREST) > 0)   # restes de peau ou de contour orangé dans les cheveux
    a = cv2.GaussianBlur(cv2.erode(F.astype(np.uint8), np.ones((UP // 2 * 2 + 1,) * 2, np.uint8)).astype(np.float32), (9, 9), 0)   # bord resserré : pas de liseré couleur peau
    if sk_in.any(): clean = cv2.inpaint(np.ascontiguousarray(clean[:, :, ::-1]), cv2.dilate(sk_in, np.ones((3, 3), np.uint8)), 3, cv2.INPAINT_TELEA)[:, :, ::-1]
    px = cv2.resize(cv2.resize(clean, (bigim.shape[1], bigim.shape[0]), interpolation=cv2.INTER_CUBIC), sz, interpolation=cv2.INTER_AREA); al = cv2.resize(a, sz, interpolation=cv2.INTER_AREA)
    # mèches verticales : un filtre médian vertical efface les petits traits horizontaux sans toucher aux mèches
    px = np.median(np.stack([np.roll(px, k, 0) for k in range(-4, 5)]), 0).astype(np.uint8)
    al = cv2.morphologyEx(al, cv2.MORPH_CLOSE, np.ones((11, 11), np.uint8))   # bouche les encoches du bord
    ys2, xs2 = np.where(al > .02); X0, Y0, X1, Y1 = xs2.min(), ys2.min(), xs2.max() + 1, ys2.max() + 1
    rgba = np.dstack([px[..., ::-1], (al * 255).clip(0, 255).astype(np.uint8)])[Y0:Y1, X0:X1]
    cv2.imwrite(f'assets/coiffures/{hid}.png', rgba, [cv2.IMWRITE_PNG_COMPRESSION, 9])
    u0 = toU(X0 * UP / S, Y0 * UP / S); u1 = toU(X1 * UP / S, Y1 * UP / S)
    hl = lu[F] / 255
    out_img = {'img': [round(u0[0], 2), round(u0[1], 2), round(u1[0] - u0[0], 2), round(u1[1] - u0[1], 2)],
               'lum': [round(float(np.percentile(hl, 5)), 3), round(float(np.median(hl)), 3), round(float(np.percentile(hl, 98)), 3)]}
    out[hid] = {**out_img, 'main': hexc(rgb[main]), 'back': [['sil', paths(backR), hexc(rgb[0])]], 'front': layers(M & ~box), 'edge': paths(M)}
    if dbg:
        v = np.zeros_like(bigim); v[:] = 235
        for k in range(K): v[L == k] = rgb[k]
        cv2.imwrite(f'{dbg}/coiffure_{hid}.png', cv2.resize(v[:, :, ::-1], None, fx=.5, fy=.5))
    print(hid, 'visage', fl, fr, 'haut', top, 'échelle', round(sx, 3), round(sy, 3))
js = '/* formes décalquées par tools/traceur-coiffures.py sur docs/references/coiffures/ — ne pas modifier à la main */\nconst HAIR_ART=' + json.dumps(out, separators=(',', ':')) + ';\n'
open('js/coiffures-art.js', 'w').write(js)
print(len(js), 'octets')
