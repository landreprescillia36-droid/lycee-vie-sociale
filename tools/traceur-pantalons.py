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
    big = np.clip(big, 0, 255).astype(np.uint8)
    from PIL import Image
    Image.fromarray(big, 'RGBA').save(os.path.join(R, f'assets/bas/jean-{n}.png'), optimize=True)
    mm = m[t:bt + 1, l:rr + 1]
    top = [np.where(mm[y])[0] for y in range(2, 8)]
    cx = float(np.median([(q.min() + q.max()) / 2 for q in top]))
    hw = float(np.median([(q.max() - q.min()) / 2 for q in top]))
    yh = min(bt - t, int(round(ref * .12)))   # hanches : même hauteur sous la ceinture pour toutes les pièces
    hip = (np.where(mm[yh])[0].max() - np.where(mm[yh])[0].min()) / 2
    art[n] = dict(w=int(big.shape[1]), h=int(big.shape[0]), cx=round(float(cx) * K, 1), waist=round(float(hw) * K, 1), hip=round(float(hip) * K, 1))
    print(n, art[n])
open(os.path.join(R, 'js/pantalons-art.js'), 'w').write('/* pantalons et jupe en jean décalqués par tools/traceur-pantalons.py sur docs/references/vetements/planche-bas-filles.png — ne pas modifier à la main */\nObject.assign(JEAN_ART,' + json.dumps(art, separators=(',', ':')) + ');\n')
