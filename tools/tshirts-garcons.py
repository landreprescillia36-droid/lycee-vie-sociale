"""T-shirts à motif des garçons repris pixel par pixel des planches de Prescillia
(docs/references/vetements/planche-tshirts-garcons-1.png et -2.jpg).
Le t-shirt du jeu (« gover », t-shirt ample) prend la couleur du t-shirt de la planche ; le motif (texte, dessin) est découpé
pixel par pixel sur la poitrine et posé au même endroit (repère : col, bas du t-shirt et largeur du torse de la case 1).
Sortie : assets/hauts/motifs/<id>.png et js/tshirts-art.js (TS_ART[id] = [x, y, l, h, couleur du t-shirt]).
Usage : python3 tools/tshirts-garcons.py [id ...]"""
import os, sys, json, numpy as np, cv2
R = os.path.join(os.path.dirname(os.path.abspath(__file__)), '..'); os.chdir(R)
REF = 'docs/references/vetements/'
P1, P2 = REF + 'planche-tshirts-garcons-1.png', REF + 'planche-tshirts-garcons-2.jpg'
# id : (planche, n° de case 0-9 de gauche à droite puis ligne 2, nom)
TS = {
 'tsbrooklyn': (P1, 0, 'T-shirt Brooklyn'), 'tsnewyork': (P1, 1, 'T-shirt New York City'), 'tsraye': (P1, 2, 'T-shirt rayé marine'),
 'tscalifornia': (P1, 3, 'T-shirt California'), 'tsbandes': (P1, 4, 'T-shirt noir à bandes'), 'tslosangeles': (P1, 5, 'T-shirt Los Angeles 92'),
 'tschill': (P1, 6, 'T-shirt Chill vert'), 'tsgoodvibes': (P1, 7, 'T-shirt Good Vibes gris'), 'tsdreambig': (P1, 8, 'T-shirt Dream Big'),
 'tspositive': (P1, 9, 'T-shirt Positive'),
 'tsbrooklyn2': (P2, 0, 'T-shirt Brooklyn tag'), 'tssmiley': (P2, 1, 'T-shirt smiley'), 'tsnewyork2': (P2, 2, 'T-shirt New York noir'),
 'tslacalifornia': (P2, 3, 'T-shirt Los Angeles California'), 'tscoeur': (P2, 4, 'T-shirt battement de cœur'), 'tsdream': (P2, 5, 'T-shirt Dream'),
 'tschill2': (P2, 8, 'T-shirt Chill marine'), 'tsgoodvibes2': (P2, 9, 'T-shirt Good Vibes crème'),
}
want = sys.argv[1:] or list(TS)
img = {f: cv2.imread(f)[:, :, ::-1].astype(np.float32) for f in (P1, P2)}
ref = img[P1]; FACE = ref[60:125, 85:165]   # visage de la case 1 (pour retrouver chaque case)
def cell_off(f, n):
    a = img[f]; H, W = a.shape[:2]; cx = int(round((n % 5) * W / 5)); cy = 0 if n < 5 else int(H * .5)
    sub = a[cy:cy + int(H * .5), cx:cx + int(W / 5)]
    m = cv2.matchTemplate(sub, FACE, cv2.TM_CCOEFF_NORMED); _, v, _, p = cv2.minMaxLoc(m)
    return cx + p[0] - 85, cy + p[1] - 60, v
# repère (case 1) -> jeu : torse 72..174 à y 280 (centre 123), col y 168 -> v 211, bas y 339 ; jeu : u = 200,6 + (x-123)·1,2745 ; v = 211 + (y-168)·1,3607
KX, KY = 1.2745, 1.3607
CH = (58, 176, 190, 336)
FULL = {'tsraye', 'tsbandes'}   # rayures / bandes : tout le t-shirt (manches comprises), découpé ensuite par la forme du t-shirt du jeu
CHF = (30, 150, 216, 342)   # poitrine et ventre (sans les bras) dans la case 1 : x0, y0, x1, y1
art = json.load(open('js/tshirts-art.json')) if os.path.exists('js/tshirts-art.json') else {}
for k in want:
    f, n, nom = TS[k]; ox, oy, v = cell_off(f, n); a = img[f]
    full = k in FULL; Z = CHF if full else CH
    x0, y0, x1, y1 = Z[0] + ox, Z[1] + oy, Z[2] + ox, Z[3] + oy
    sub = a[y0:y1, x0:x1]; px = sub.reshape(-1, 3)
    if full: px = px[px.mean(1) < 90]   # couleur du tissu (sombre), sans le fond ni la peau
    base = np.median(px, 0)
    for _ in range(3): d = np.abs(px - base).sum(1); base = np.median(px[d < 45], 0)
    d = np.abs(sub - base).sum(-1)
    al = np.clip((d - 22) / 45, 0, 1)
    # motif = taches qui ne touchent pas le bord de la zone (les bords = bras, fond, plis des côtés)
    if full:
        L_ = sub.mean(-1); al = np.clip((L_ - 110) / 60, 0, 1) * (np.abs(sub[..., 0] - sub[..., 2]) < 30)   # seulement les rayures claires et neutres
        bgc = (sub[..., 2] > sub[..., 0] + 8) & (L_ > 200); al = al * ~cv2.dilate(bgc.astype(np.uint8), np.ones((5, 5), np.uint8)).astype(bool)
        n2, lab2, st2, _ = cv2.connectedComponentsWithStats((al > .2).astype(np.uint8), 8); kp = np.zeros(al.shape, bool)
        for i in range(1, n2):
            w_, h_ = st2[i, 2], st2[i, 3]
            if w_ >= 8 and h_ <= w_ * .8: kp |= lab2 == i   # rayures et bandes (horizontales) ; pas les reflets verticaux des bords
        al = al * cv2.dilate(kp.astype(np.uint8), np.ones((3, 3), np.uint8)).astype(bool)
    core = (al > .3).astype(np.uint8) if full else (d > 200).astype(np.uint8); n_, lab = cv2.connectedComponents(cv2.dilate(core, np.ones((3, 3), np.uint8)))
    keep = np.zeros_like(core, bool)
    for i in range(1, n_):
        c = lab == i; ys_, xs_ = np.nonzero(c)
        if ys_.min() > 1 and xs_.min() > 1 and ys_.max() < c.shape[0] - 2 and xs_.max() < c.shape[1] - 2 and c.sum() > 40 and not (ys_.max() - ys_.min() > 40 and xs_.max() - xs_.min() < 14): keep |= c   # plis verticaux ignorés
    if not full:
        big = keep
        ys2, xs2 = np.nonzero(big)
        if len(ys2):   # petites lettres (I, points) gardées si elles sont dans la zone du motif
            for i in range(1, n_):
                c = lab == i; ys_, xs_ = np.nonzero(c)
                if ys2.min() - 8 <= ys_.min() and ys_.max() <= ys2.max() + 8 and xs2.min() + 2 <= xs_.min() and xs_.max() <= xs2.max() - 2 and ys_.max() - ys_.min() < 30: big |= c
        al = al * cv2.dilate(big.astype(np.uint8), np.ones((5, 5), np.uint8)).astype(bool)
    ys, xs = np.nonzero(al > .05)
    if not len(ys): print(k, 'pas de motif'); continue
    a0, a1, b0, b1 = xs.min(), xs.max() + 1, ys.min(), ys.max() + 1
    al = al[b0:b1, a0:a1]; s2 = sub[b0:b1, a0:a1]
    col = ((s2 - (1 - al[..., None]) * base) / np.maximum(al[..., None], .25)).clip(0, 255)
    rgba = np.dstack([col, al * 255]).astype(np.uint8)
    cv2.imwrite('assets/hauts/motifs/' + k + '.png', cv2.cvtColor(rgba, cv2.COLOR_RGBA2BGRA))
    X, Y = x0 + a0 - ox, y0 + b0 - oy   # dans le repère de la case 1
    art[k] = [round(200.6 + (X - 123) * KX, 2), round(211 + (Y - 168) * KY, 2), round((a1 - a0) * KX, 2), round((b1 - b0) * KY, 2),
              '#%02x%02x%02x' % tuple(int(round(c)) for c in base), nom] + ([1] if full else [])
    print(k, 'case', (ox, oy), round(v, 2), 'couleur', art[k][4], art[k][:4])
json.dump(art, open('js/tshirts-art.json', 'w'), ensure_ascii=False)
open('js/tshirts-art.js', 'w').write('/* généré par tools/tshirts-garcons.py — ne pas modifier à la main */\nconst TS_ART=' + json.dumps(art, ensure_ascii=False) + ';\n')

# ---------- t-shirt entier (forme de la planche) ----------
# tout le t-shirt est découpé (fond bleu, peau, jean et tête retirés) et posé à la place du t-shirt du jeu (TS_ART[id][7] = 1)
CHT = (26, 140, 220, 346)
def tshirt_full(k):
    f, n, nom = TS[k]; ox, oy, v = cell_off(f, n); a = img[f]
    x0, y0, x1, y1 = CHT[0] + ox, CHT[1] + oy, CHT[2] + ox, CHT[3] + oy
    sub = a[y0:y1, x0:x1].copy(); r, g, b = sub[..., 0], sub[..., 1], sub[..., 2]; L = sub.mean(-1)
    hsv = cv2.cvtColor(sub.clip(0, 255).astype(np.uint8), cv2.COLOR_RGB2HSV).astype(int)
    bg = (b > r + 6) & (L > 200)
    skin = ((hsv[..., 0] < 25) | (hsv[..., 0] > 170)) & (hsv[..., 1] > 70) & (hsv[..., 2] > 25)
    jean = (b > r + 25) & (b > 140)
    m = ~(bg | skin | jean)
    m = cv2.morphologyEx(m.astype(np.uint8), cv2.MORPH_OPEN, np.ones((3, 3), np.uint8))
    n_, lab, st, _ = cv2.connectedComponentsWithStats(m, 8); keep = lab == 1 + np.argmax(st[1:, 4])
    keep = cv2.morphologyEx(keep.astype(np.uint8), cv2.MORPH_CLOSE, np.ones((5, 5), np.uint8)).astype(bool)
    from scipy import ndimage
    keep = ndimage.binary_fill_holes(keep)
    w = keep.sum(1); big = np.nonzero(w > w.max() * .5)[0]; top, hem = big.min(), big.max()
    keep[hem + 3:] = False                                      # sous l'ourlet : rien (braguette, ceinture)
    cx_ = int(np.median(np.nonzero(keep[hem])[0]))
    fab = np.median(sub[keep & (np.arange(keep.shape[0])[:, None] > top + 60)], 0)   # couleur du tissu
    near = np.abs(sub - fab).sum(-1) < 75
    zone = np.zeros_like(keep); zone[:top + 34, cx_ - 34:cx_ + 35] = True   # encolure : seulement le tissu (le cou est retiré, la courbe du col reste)
    keep &= ~zone | near
    keep = cv2.morphologyEx(keep.astype(np.uint8), cv2.MORPH_OPEN, np.ones((3, 3), np.uint8)).astype(bool)
    keep = ndimage.binary_fill_holes(keep)   # motifs dans l'encolure (couronnes, rayures) gardés
    lab2, n2 = ndimage.label(keep)
    if n2 > 1: sz = ndimage.sum(keep, lab2, range(1, n2 + 1)); keep = lab2 == 1 + int(np.argmax(sz))
    # contour lissé (sans escalier) : masque agrandi ×4, adouci, seuillé, puis ramené à la taille (bord anti-crénelé)
    big = cv2.resize(keep.astype(np.float32), None, fx=4, fy=4, interpolation=cv2.INTER_LINEAR)
    big = (cv2.GaussianBlur(big, (0, 0), 4) > .5).astype(np.float32)
    al = cv2.resize(big, (keep.shape[1], keep.shape[0]), interpolation=cv2.INTER_AREA)
    keep = keep | (al > .02)
    # bord : couleur du tissu voisin (pas de liseré de fond ni de peau)
    inner = cv2.erode(keep.astype(np.uint8), np.ones((5, 5), np.uint8)).astype(bool)
    _, idx = ndimage.distance_transform_edt(~inner, return_indices=True)
    col = sub.copy(); ring = keep & ~inner; col[ring] = sub[idx[0][ring], idx[1][ring]]
    rgba = np.dstack([col.clip(0, 255), al * 255]).astype(np.uint8)
    ys, xs = np.nonzero(al > .02); a0, a1, b0, b1 = xs.min(), xs.max() + 1, ys.min(), ys.max() + 1
    cv2.imwrite('assets/hauts/motifs/' + k + '-t.png', cv2.cvtColor(rgba[b0:b1, a0:a1], cv2.COLOR_RGBA2BGRA))
    X, Y = CHT[0] + a0, CHT[1] + b0
    return [round(200.6 + (X - 123) * KX, 2), round(211 + (Y - 168) * KY, 2), round((a1 - a0) * KX, 2), round((b1 - b0) * KY, 2)]
for k in want:
    if k in art: art[k] = art[k][:6] + [0] + [tshirt_full(k)]
json.dump(art, open('js/tshirts-art.json', 'w'), ensure_ascii=False)
open('js/tshirts-art.js', 'w').write('/* généré par tools/tshirts-garcons.py — ne pas modifier à la main */\nconst TS_ART=' + json.dumps(art, ensure_ascii=False) + ';\n')
