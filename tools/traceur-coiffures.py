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
           'cut': [(211, 230, 97, 152)], 'back': (185, 258, 84, 166), 'extend': 50},
}
UP = 8
dbg = sys.argv[1] if len(sys.argv) > 1 else None
out = {}
for hid, c in HAIRS.items():
    im = cv2.imread(c['src'])[:, :, ::-1].astype(int)
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
    # le dessin est coupé par le cadre : on prolonge les mèches (même profil, mêmes reflets) de « extend » pixels
    ext = c.get('extend', 0)
    if ext:
        yb = np.where(hair.any(1))[0].max()
        hair = np.vstack([hair[:yb + 1], np.repeat(hair[yb - 1:yb], ext, 0), np.zeros((im.shape[0] - yb - 1, im.shape[1]), bool)])[:im.shape[0] + ext]
        im = np.vstack([im[:yb + 1], np.repeat(im[yb - 6:yb], -(-ext // 6), 0)[:ext], im[yb + 1:]])
        skin = np.vstack([skin, np.zeros((ext, skin.shape[1]), bool)])
    ys, xs = np.where(hair); top = ys.min()
    row = skin[c['face_row']]; fx = np.where(row)[0]
    fl, fr = fx.min(), fx.max(); cx = (fl + fr + 1) / 2
    sx = 188 / (fr - fl + 1); sy = (312 - 56) / (c['chin'] - top)
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
    box = np.zeros_like(M); box[by0 * UP:by1 * UP, bx0 * UP:bx1 * UP] = True   # à côté du cou : seulement derrière le corps
    out[hid] = {'main': hexc(rgb[main]), 'back': [['sil', paths(backR), hexc(rgb[0])]], 'front': layers(M & ~box), 'edge': paths(M)}
    if dbg:
        v = np.zeros_like(bigim); v[:] = 235
        for k in range(K): v[L == k] = rgb[k]
        cv2.imwrite(f'{dbg}/coiffure_{hid}.png', cv2.resize(v[:, :, ::-1], None, fx=.5, fy=.5))
    print(hid, 'visage', fl, fr, 'haut', top, 'échelle', round(sx, 3), round(sy, 3))
js = '/* formes décalquées par tools/traceur-coiffures.py sur docs/references/coiffures/ — ne pas modifier à la main */\nconst HAIR_ART=' + json.dumps(out, separators=(',', ':')) + ';\n'
open('js/coiffures-art.js', 'w').write(js)
print(len(js), 'octets')
