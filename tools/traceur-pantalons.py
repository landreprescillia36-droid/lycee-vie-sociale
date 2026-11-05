"""Décalque des pantalons et de la jupe en jean des filles sur docs/references/vetements/planche-bas-filles.png
(même méthode que tools/traceur-jeans.py) : chaque pièce est découpée telle qu'elle est dessinée (pixels de la planche ;
fond, peau, haut blanc et chaussures retirés) dans assets/bas/jean-<id>.png, à l'échelle des jeans,
et ses repères sont ajoutés à JEAN_ART dans js/pantalons-art.js."""
import json, os, re
import numpy as np, cv2
from scipy import ndimage
R = os.path.join(os.path.dirname(__file__), '..')
im = cv2.imread(os.path.join(R, 'docs/references/vetements/planche-bas-filles.png'))
HSV = cv2.cvtColor(im, cv2.COLOR_BGR2HSV).astype(float)
# (id, x0, x1, y haut, y bas) : 2e ligne = pantalons, 1re ligne dernière case = jupe en jean
P = [('habpattes', 18, 192, 368, 652), ('habdroit', 198, 372, 368, 652), ('cargo', 378, 552, 368, 652),
     ('jogglarge', 555, 728, 368, 652), ('joggajust', 732, 902, 368, 652), ('lin', 905, 1078, 368, 652),
     ('jupejean', 905, 1078, 8, 120)]
SP = os.environ.get('SP', '/tmp')
ART = json.loads(re.search(r'const JEAN_ART=(\{.*?\});', open(os.path.join(R, 'js/jeans-art.js')).read(), re.S).group(1))
art = {}; masks = {}; store = {}
for n, x0, x1, ya, yb in P:
    a = im[ya:yb, x0:x1]; h, w = a.shape[:2]; hs = HSV[ya:yb, x0:x1]
    B, G, Rr = [a[..., i].astype(float) for i in range(3)]
    L = (B + G + Rr) / 3; sat = hs[..., 1] / 255; hue = hs[..., 0]
    bg = (L > 222) & (sat < .12)
    skin = (sat > .38) & (hue < 22) & (L < 185) & (Rr > G + 18)
    white = (L > 232)
    gm = np.full((h, w), cv2.GC_PR_FGD, np.uint8)
    gm[bg | skin] = cv2.GC_BGD
    gm[:, :3] = cv2.GC_BGD; gm[:, -3:] = cv2.GC_BGD
    # centre de chaque jambe : premier plan sûr
    cx = w // 2
    gm[int(h * .1):int(h * .85), cx - 30:cx - 8][~(bg | skin)[int(h * .1):int(h * .85), cx - 30:cx - 8]] = cv2.GC_FGD
    gm[int(h * .1):int(h * .85), cx + 8:cx + 30][~(bg | skin)[int(h * .1):int(h * .85), cx + 8:cx + 30]] = cv2.GC_FGD
    bgd = np.zeros((1, 65), np.float64); fgd = np.zeros((1, 65), np.float64)
    cv2.grabCut(a, gm, None, bgd, fgd, 6, cv2.GC_INIT_WITH_MASK)
    m = (gm == cv2.GC_FGD) | (gm == cv2.GC_PR_FGD)
    m &= ~skin
    m = ndimage.binary_opening(m, iterations=1)
    lab, k = ndimage.label(m); sz = ndimage.sum(m, lab, range(1, k + 1)); m = lab == (np.argmax(sz) + 1)
    m = ndimage.binary_fill_holes(m)
    # --- silhouette pleine : chaque ligne remplie d'un bord à l'autre ; en haut (hanches, où passent les mains) on prend
    #     le côté le plus large et on le reporte en miroir ; puis on recreuse l'espace entre les jambes (fond de la planche)
    ys = np.where(m.any(1))[0]; t, bt = ys.min(), ys.max()
    cx = int(round(np.median([(np.where(m[y])[0].min() + np.where(m[y])[0].max()) / 2 for y in range(t + 2, t + 12)])))
    full = np.zeros_like(m)
    # bords gauche et droit ligne par ligne ; là où une main ou un bras touche le bord, le bord est recalculé
    # par interpolation entre le dessus et le dessous de la main (le pantalon passe sous la main)
    rows = [y for y in range(t, bt + 1) if m[y].any()]
    EL = {y: np.where(m[y])[0].min() for y in rows}; ER = {y: np.where(m[y])[0].max() for y in rows}
    # en haut (jusqu'à l'entrejambe) : seulement le morceau continu qui contient le centre (les bras, séparés par le fond, sont exclus)
    yc = t + int((bt - t) * (.3 if n != 'jupejean' else 1))
    md = ndimage.binary_closing(m, structure=np.ones((1, 3)))
    for y in rows:
        if y > yc or not md[y, cx]: continue
        l = cx
        while l > 0 and md[y, l - 1]: l -= 1
        r = cx
        while r < w - 1 and md[y, r + 1]: r += 1
        EL[y], ER[y] = l, r
    top_ok = {y for y in rows if y <= yc}
    skd = ndimage.binary_dilation(skin, iterations=2)
    for E in (EL, ER):
        bad = np.zeros(h, bool)
        for y in rows:
            x = E[y]; lo, hi = max(0, x - 10), min(w, x + 10)
            if y not in top_ok and skd[y, lo:hi].sum() >= 2 and y < t + (bt - t) * .75: bad[y] = True
        bad = ndimage.binary_dilation(bad, iterations=8)
        lab_, nb = ndimage.label(bad)
        for i in range(1, nb + 1):
            yy = np.where(lab_ == i)[0]; y0, y1 = yy.min() - 1, yy.max() + 1
            a1 = E.get(y1); a0 = E.get(y0, a1)
            if a1 is None: continue
            for y in yy:
                if y in E: E[y] = int(round(a0 + (a1 - a0) * (y - y0) / max(1, y1 - y0)))
    ry = np.array(rows)
    el = ndimage.median_filter(np.array([EL[y] for y in rows], float), size=5); er = ndimage.median_filter(np.array([ER[y] for y in rows], float), size=5)
    for k_, y in enumerate(rows):
        l, r = el[k_], er[k_]
        full[y, int(max(0, l)):int(min(w - 1, r)) + 1] = True
    sk_ = np.zeros_like(skin); sk_[:t + 14] = (skin & (L < 150))[:t + 14]
    sl, sn = ndimage.label(sk_)
    for i in range(1, sn + 1):
        if (np.where(sl == i)[0].min() <= t + 1): full[ndimage.binary_dilation(sl == i, iterations=1)] = False
    medL = np.median(L[m]) if m.any() else 128
    lt_ = np.zeros_like(full); lt_[bt - 24:] = ((L > max(medL + 35, 150)) if n != 'lin' else (L > 236))[bt - 24:]
    ll, ln = ndimage.label(lt_)
    for i in range(1, ln + 1):
        if np.where(ll == i)[0].max() >= bt - 3: full[ll == i] = False   # chaussures (blanches, touchent le bas)
    full = ndimage.binary_fill_holes(full)
    bgc = np.median(a[bg], axis=0) if bg.any() else np.array([217, 229, 239])
    dbg = np.sqrt(((a.astype(float) - bgc) ** 2).sum(2))
    gap = (dbg < 12) | skin | (white & (np.arange(h)[:, None] > bt - 30)) | (~m & (dbg < 22))
    crotch = t + int((bt - t) * (.18 if n != 'jupejean' else 1.1))
    gl, gk = ndimage.label(gap & full)
    for i in range(1, gk + 1):
        c = gl == i; yy, xx = np.where(c)
        if yy.min() > crotch - 10 and (yy.max() >= bt - (bt - t) * .1 or (n != 'lin' and c.sum() > 30 and dbg[c].mean() < 14 and abs(xx.mean() - cx) < w * .12)):
            full[c] = False
    full = ndimage.binary_opening(full, iterations=1)
    lab, k = ndimage.label(full); sz = ndimage.sum(full, lab, range(1, k + 1)); full = lab == (np.argmax(sz) + 1)
    # couleurs des zones ajoutées (sous les mains) : reprises en miroir
    out = a.copy()
    add = full & ~m
    yy, xx = np.where(add)
    xm = np.clip(2 * cx - xx, 0, w - 1); ok = m[yy, xm]
    out[yy[ok], xx[ok]] = a[yy[ok], xm[ok]]
    # fond de la planche resté entre les jambes (près du centre) : repeint avec le tissu autour
    band = np.abs(np.arange(w)[None, :] - cx) < 12
    yy_ = np.arange(h)[:, None]; zone = (yy_ > t + (bt - t) * .1) & (yy_ < t + (bt - t) * .45)
    hole = (full & band & zone & (dbg < (9 if n == 'lin' else 24))).astype(np.uint8)
    hole = ndimage.binary_dilation(hole, iterations=1).astype(np.uint8) & full.astype(np.uint8)
    if hole.any(): out = cv2.inpaint(out, hole, 4, cv2.INPAINT_TELEA)
    if n == 'lin':
        # pantalon crème presque de la couleur du fond : silhouette du pantalon à pattes larges (même coupe), posée
        # sur l'emprise du lin (haut de la ceinture, bas de l'ourlet, largeur à l'ourlet)
        ys_, xs_ = np.where(full); t2, b2 = ys_.min(), ys_.max()
        hy_ = np.where(masks['habpattes'].any(1))[0]; t2, b2 = hy_.min(), hy_.max()   # même hauteur de ceinture et d'ourlet sur la planche
        hem = full[b2 - int((b2 - t2) * .25):b2]; hx = np.where(hem.any(0))[0]
        S_ = masks['habpattes'].astype(np.uint8); sy_, sx_ = np.where(S_); S_ = S_[sy_.min():sy_.max() + 1, sx_.min():sx_.max() + 1]
        W_, H_ = hx.max() - hx.min() + 1, b2 - t2 + 1
        Sr = cv2.resize(S_ * 255, (int(W_), int(H_)), interpolation=cv2.INTER_LINEAR) > 127
        full = np.zeros_like(full); full[t2:t2 + H_, hx.min():hx.min() + W_] = Sr[:, :min(W_, w - hx.min())]
    hl, hn = ndimage.label(~full)
    for i in range(1, hn + 1):
        c = hl == i
        if c.sum() < 40 and not (c[0].any() or c[-1].any() or c[:, 0].any() or c[:, -1].any()): full[c] = True
    m = full; a = out
    masks[n] = m
    cv2.imwrite(f'{SP}/mask-{n}.png', np.dstack([a, (m * 255).astype(np.uint8)]))
    store[n] = (a.copy(), m.copy())

# --- ajustement au corps de l'avatar (fille, corpulence moyenne : tools/fille-corps.json) :
#     1) la ceinture et les hanches épousent la taille (chaque ligne du haut est élargie ou resserrée jusqu'au bord du corps) ;
#     2) chaque jambe du pantalon est recentrée sur la jambe de l'avatar, pour que les pieds sortent bien du bas.
BODY = json.load(open(os.path.join(R, 'tools/fille-corps.json')))
def bodyAt(key, y):
    ks = sorted(int(k) for k in BODY[key]); y = min(max(y, ks[0]), ks[-1])
    return float(np.interp(y, ks, [BODY[key][str(k)] for k in ks]))
def runs(row):
    q = np.where(row)[0]
    if not len(q): return []
    cut = np.where(np.diff(q) > 1)[0]
    return [(int(a[0]), int(a[-1])) for a in np.split(q, cut + 1)]
def smooth(v, sig=5):
    v = np.array(v, float); ok = ~np.isnan(v)
    if not ok.any(): return np.zeros_like(v)
    idx = np.arange(len(v)); v = np.interp(idx, idx[ok], v[ok])
    return ndimage.gaussian_filter1d(v, sig, mode='nearest')
DEG = {'habpattes': 1, 'habdroit': 1, 'cargo': 1, 'jogglarge': 1, 'joggajust': 2, 'lin': 1}
HEM = {'habpattes': 62, 'habdroit': 56, 'cargo': 58, 'jogglarge': 60, 'lin': 60}   # demi-largeur à l'ourlet (unités de l'avatar)
def straighten(n, img, sv, sh):
    """jambes droites : les 4 bords des jambes (extérieur et intérieur, gauche et droite) suivent une droite
    (une courbe douce pour les joggings) ; chaque ligne est réétirée entre ces bords : plus de zigzag."""
    if n not in DEG: return img
    al = img[..., 3] > 127; H_, W_ = al.shape
    ys = [y for y in range(H_) if al[y].any()]; t, bt = ys[0], ys[-1]
    y0 = int(((445 if n in HEM else 500) - 376) / sv)            # sous les hanches
    yb = bt - 3
    E = {k: [] for k in ('l1', 'r1', 'l2', 'r2')}; Y2 = []; Y1 = []; EO = []
    for y in range(y0, yb):
        rr = [r_ for r_ in runs(al[y]) if r_[1] - r_[0] >= 4]
        if len(rr) >= 2: E['l1'].append(rr[0][0]); E['r1'].append(rr[0][1]); E['l2'].append(rr[-1][0]); E['r2'].append(rr[-1][1]); Y2.append(y)
        if rr: Y1.append(y); EO.append((rr[0][0], rr[-1][1]))
    if len(Y1) < 10: return img
    Y1 = np.array(Y1); EO = np.array(EO, float)
    d = DEG[n]
    fo_l = np.polyfit(Y1, EO[:, 0], d); fo_r = np.polyfit(Y1, EO[:, 1], d)
    # entrejambe : première ligne à partir de laquelle les deux jambes sont séparées la plupart du temps
    two = np.zeros(H_, bool); two[Y2] = True
    crotch = next((y for y in range(y0, yb) if two[y:y + 20].mean() > .6), H_)
    sel = [k for k, y in enumerate(Y2) if y >= crotch]
    if len(sel) > 10:
        Y2a = np.array(Y2)[sel]; fi_l = np.polyfit(Y2a, np.array(E['r1'])[sel], d); fi_r = np.polyfit(Y2a, np.array(E['l2'])[sel], d)
    else: fi_l = fi_r = None
    top_ = [np.where(al[y])[0] for y in range(t + 6, t + 50) if al[y].any()]; CX = float(np.median([(q.min() + q.max()) / 2 for q in top_]))
    out = img.copy(); xs = np.arange(W_, dtype=np.float32)
    def put(row, a0, a1, b0, b1, y):
        m_ = (xs >= b0) & (xs <= b1)
        src = a0 + (xs[m_] - b0) * (a1 - a0) / max(1e-3, b1 - b0)
        for c in range(4): row[m_, c] = np.interp(src, xs, img[y, :, c])
    for y in range(y0, bt + 1):
        rr = [r_ for r_ in runs(al[y]) if r_[1] - r_[0] >= 2]
        if not rr: continue
        w = min(1, (y - y0) / 25)          # transition douce sous les hanches
        L, R = np.polyval(fo_l, y), np.polyval(fo_r, y)
        hw_ = (R - L) / 2
        if n in HEM:   # jambes droites et collées : le bord extérieur va en ligne droite des hanches jusqu'à l'ourlet, posé sur les pieds
            h0 = (np.polyval(fo_r, y0) - np.polyval(fo_l, y0)) / 2; u = (y - y0) / max(1, bt - y0)
            hw_ = h0 + (HEM[n] / sh - h0) * u
        L, R = CX - hw_, CX + hw_   # les deux jambes symétriques
        L = rr[0][0] + (L - rr[0][0]) * w; R = rr[-1][1] + (R - rr[-1][1]) * w
        row = np.zeros((W_, 4), np.float32)
        if n in HEM and len(rr) >= 2 and rr[-1][0] - rr[0][1] > 1 and y >= crotch:
            # jambes collées : même au-dessus de l'entrejambe, le fond visible entre les jambes de la planche disparaît
            put(row, rr[0][0], rr[0][1] - 2.5, L, CX, y); put(row, rr[-1][0] + 2.5, rr[-1][1], CX, R, y)
        elif fi_l is not None and y >= crotch:
            IL, IR = np.polyval(fi_l, y), np.polyval(fi_r, y)
            gw_ = (IR - IL) / 2; IL, IR = CX - gw_, CX + gw_
            if n in HEM: IL = IR = CX   # jambes collées
            if IL >= IR - 1: IL = IR = (IL + IR) / 2
            wg = min(1, (y - crotch) / 30); mg = (IL + IR) / 2; IL = mg + (IL - mg) * wg; IR = mg + (IR - mg) * wg   # l'entrejambe s'ouvre en douceur
            if len(rr) >= 2 and rr[-1][0] - rr[0][1] > 3 and y > crotch + 15:
                tr = 2.5 if n in HEM else 0   # on enlève le liseré clair du bord intérieur (fond de la planche)
                sl, sr = (rr[0][0], rr[0][1] - tr), (rr[-1][0] + tr, rr[-1][1])
            else: mid = (rr[0][0] + rr[-1][1]) / 2; sl, sr = (rr[0][0], mid), (mid, rr[-1][1])
            put(row, sl[0], sl[1], L, IL, y); put(row, sr[0], sr[1], IR, R, y)
        else:
            put(row, rr[0][0], rr[-1][1], L, R, y)
        out[y] = row
    if n in HEM:
        # jambes collées : plus aucun jour entre les jambes (repeint avec le tissu autour)
        al2 = out[..., 3] > 127; band = np.abs(xs[None, :] - CX) < 14
        lft = np.maximum.accumulate(al2, axis=1); rgt = np.maximum.accumulate(al2[:, ::-1], axis=1)[:, ::-1]
        hole = (~al2) & band & lft & rgt; hole[:y0] = False
        # bande centrale sous l'entrejambe : le jour clair de la planche entre les jambes est repeint
        c0 = max(y0, crotch - 30); cb = np.abs(xs[None, :] - CX) < 5
        hole[c0:] |= (cb & lft & rgt)[c0:]
        if hole.any():
            rgb_ = np.clip(out[..., :3], 0, 255).astype(np.uint8)
            rgb_ = cv2.inpaint(rgb_, hole.astype(np.uint8), 5, cv2.INPAINT_TELEA)
            out[..., :3] = np.where(hole[..., None], rgb_, out[..., :3]); out[..., 3] = np.where(hole, 255, out[..., 3])
        # couture entre les deux jambes (léger trait foncé)
        ci = int(round(CX)); st0 = max(crotch, y0)
        for y in range(st0, H_):
            if out[y, ci, 3] > 127: out[y, ci, :3] *= .9
    return out

def fit_body(n, img):
    al = img[..., 3] > 127; al = ndimage.binary_opening(al, iterations=1)
    lb_, nl_ = ndimage.label(al); al = lb_ == (np.argmax(ndimage.sum(al, lb_, range(1, nl_ + 1))) + 1)
    img = img.copy(); img[..., 3] *= al; H_, W_ = al.shape
    top = [np.where(al[y])[0] for y in range(6, 50) if al[y].any()]
    cx = float(np.median([(q.min() + q.max()) / 2 for q in top]))
    ref_y = int(round(ART['mom']['h'] * .12))
    q = np.where(al[min(ref_y, H_ - 1)])[0]; hip = (q.max() - q.min()) / 2
    sh = BODY['hip'] / hip; sv = (856 - 376) / ART['mom']['h']
    K1, C0, DL, DR = [], [], [], []
    for y in range(H_):
        yav = 376 + y * sv; rr = runs(al[y]); big_ = [r_ for r_ in rr if r_[1] - r_[0] >= 4]
        if big_:
            l, r = big_[0][0], big_[-1][1]
            K1.append((r - l) / 2 / (bodyAt('side', yav) / sh + .5)); C0.append((l + r) / 2)
        else: K1.append(np.nan); C0.append(np.nan)
        Ls = [r_ for r_ in big_ if (r_[0] + r_[1]) / 2 < cx]; Rs = [r_ for r_ in big_ if (r_[0] + r_[1]) / 2 >= cx]
        lc = cx - ((bodyAt('legO', yav) + bodyAt('legI', yav)) / 2) / sh; rc = cx + ((bodyAt('legO', yav) + bodyAt('legI', yav)) / 2) / sh
        sep = len(Ls) and len(Rs)
        DL.append(lc - (Ls[0][0] + Ls[-1][1]) / 2 if sep else np.nan); DR.append(rc - (Rs[0][0] + Rs[-1][1]) / 2 if sep else np.nan)
    K1, C0, DL, DR = smooth(K1, 3), smooth(C0, 3), smooth(DL, 6), smooth(DR, 6)
    out = np.zeros_like(img); xs = np.arange(W_, dtype=np.float32)
    for y in range(H_):
        yav = 376 + y * sv; src = xs.copy()
        w1 = 1 if yav <= 450 else max(0, 1 - (yav - 450) / 70)
        if w1 > 0: k = 1 + (K1[y] - 1) * w1; src = C0[y] + (xs - C0[y]) * k
        w2 = 0 if (yav < 560 or n != 'joggajust') else min(1, (yav - 560) / 100)   # seul le jogging ajusté (chevillères) suit la jambe ; les autres gardent leur forme, les pieds restent sous l'ourlet
        if w2 > 0: src = np.where(xs < cx, src - DL[y] * w2, src - DR[y] * w2)
        for c in range(4): out[y, :, c] = np.interp(src, xs, img[y, :, c], left=0, right=0)
    out = straighten(n, out, sv, sh)
    # contour lissé (les marches d'escalier du détourage disparaissent)
    A_ = out[..., 3] / 255.
    B_ = cv2.GaussianBlur(A_.astype(np.float32), (0, 0), 1.6)
    A2 = np.clip((B_ - .35) / .3, 0, 1)
    # couleur des pixels qui deviennent visibles au bord : celle du voisin opaque le plus proche
    inside = A_ > .5
    if (~inside).any():
        idx = ndimage.distance_transform_edt(~inside, return_distances=False, return_indices=True)
        for c in range(3): out[..., c] = np.where(inside, out[..., c], out[..., c][idx[0], idx[1]])
    out[..., 3] = A2 * 255
    return out

# --- sortie à l'échelle des jeans : la hauteur du pantalon droit (taille → ourlet) = celle du jean mom
ref = None
ys_ = np.where(store['habdroit'][1].any(1))[0]; ref = ys_.max() - ys_.min() + 1
K = ART['mom']['h'] / ref
for n, (a, m) in store.items():
    ys, xs = np.where(m); t, bt, l, rr = ys.min(), ys.max(), xs.min(), xs.max()
    edge = m & ~ndimage.binary_erosion(m, iterations=1)
    al = np.where(m, 1.0, 0.0); al[edge] = .6
    al = np.minimum(al, cv2.GaussianBlur(al.astype(np.float32), (0, 0), .6) + .15) * m + cv2.GaussianBlur(al.astype(np.float32), (0, 0), .6) * (~m) * .5   # bords adoucis
    rgba = np.dstack([a[..., ::-1], al * 255]).astype(np.float32)[t:bt + 1, l:rr + 1]
    big = cv2.resize(rgba, None, fx=K, fy=K, interpolation=cv2.INTER_CUBIC)
    PAD = 40
    big = np.pad(np.clip(big, 0, 255), ((0, 0), (PAD, PAD), (0, 0)))
    big = fit_body(n, big)
    cols = np.where((big[..., 3] > 0).any(0))[0]; c0_ = max(0, cols.min() - 1); big = big[:, c0_:cols.max() + 2]
    shift = PAD - c0_
    big = np.clip(big, 0, 255).astype(np.uint8)
    from PIL import Image
    Image.fromarray(big, 'RGBA').save(os.path.join(R, f'assets/bas/jean-{n}.png'), optimize=True)
    mm = m[t:bt + 1, l:rr + 1]
    top = [np.where(mm[y])[0] for y in range(2, 8)]
    cx = float(np.median([(q.min() + q.max()) / 2 for q in top]))
    hw = float(np.median([(q.max() - q.min()) / 2 for q in top]))
    yh = min(bt - t, int(round(ref * .12)))   # hanches : même hauteur sous la ceinture pour toutes les pièces
    hip = (np.where(mm[yh])[0].max() - np.where(mm[yh])[0].min()) / 2
    art[n] = dict(w=int(big.shape[1]), h=int(big.shape[0]), cx=round(float(cx) * K + shift, 1), waist=round(float(hw) * K, 1), hip=round(float(hip) * K, 1))
    print(n, art[n])
open(os.path.join(R, 'js/pantalons-art.js'), 'w').write('/* pantalons et jupe en jean décalqués par tools/traceur-pantalons.py sur docs/references/vetements/planche-bas-filles.png — ne pas modifier à la main */\nObject.assign(JEAN_ART,' + json.dumps(art, separators=(',', ':')) + ');\n')
