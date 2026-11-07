"""Hauts des garçons copiés sur la planche corrigée de Prescillia (docs/references/vetements/correction-hauts-garcons.png, 4 × 8).
   Étape 1 : chaque haut est détouré tel qu'il est dessiné (fond, peau, tête retirés)."""
import os, sys, json, numpy as np, cv2
from scipy import ndimage
R = os.path.join(os.path.dirname(__file__), '..')
im = cv2.imread(os.path.join(R, 'docs/references/vetements/correction-hauts-garcons.png'))
ROWS = [(27, 306), (314, 590), (600, 874), (883, 1158)]
COLS = [(17, 174), (180, 337), (348, 500), (508, 665), (671, 828), (836, 988), (1000, 1152), (1163, 1313)]
SP = sys.argv[1] if len(sys.argv) > 1 else '/tmp'
def cell(r, c, pad=6):
    (y0, y1), (x0, x1) = ROWS[r], COLS[c]
    return im[max(0, y0 - pad):y1 + pad, max(0, x0 - pad):x1 + pad].copy()
def garment(a):
    H, W = a.shape[:2]
    bgc = np.median(np.concatenate([a[:3].reshape(-1, 3), a[:, :3].reshape(-1, 3), a[:, -3:].reshape(-1, 3)]), 0)
    m = np.zeros((H + 2, W + 2), np.uint8); f = a.copy()
    for seed in [(0, 0), (W - 1, 0), (0, H - 1), (W - 1, H - 1), (W // 2, 0)]:
        cv2.floodFill(f, m, seed, (0, 0, 0), (2, 2, 2), (2, 2, 2), 4 | cv2.FLOODFILL_MASK_ONLY | (255 << 8))
    bg = m[1:-1, 1:-1] > 0
    hsv = cv2.cvtColor(a, cv2.COLOR_BGR2HSV).astype(int)
    skin = (hsv[..., 0] < 22) & (hsv[..., 1] > 70) & (hsv[..., 2] > 60) & (hsv[..., 2] < 230)
    skin = cv2.morphologyEx(skin.astype(np.uint8), cv2.MORPH_OPEN, np.ones((2, 2), np.uint8)).astype(bool)
    g = ~bg & ~skin
    g = cv2.morphologyEx(g.astype(np.uint8), cv2.MORPH_OPEN, np.ones((3, 3), np.uint8)).astype(bool)   # traits fins (contours des bras, du cou) : retirés
    # tête : tout ce qui est au-dessus du col (le col = première ligne où la masse du haut est large)
    wid = g.sum(1); yc = int(np.argmax(wid > W * .3)); g[:max(0, yc - 26)] = False
    hs_ = (hsv[..., 2] < 60) & (np.arange(H)[:, None] < yc + 4)   # cheveux
    lab, n = ndimage.label(g); sz = ndimage.sum(g, lab, range(1, n + 1))
    # composante la plus grande sous le menton
    cy = [ndimage.center_of_mass(g, lab, i + 1)[0] for i in range(n)]
    order = sorted(range(n), key=lambda i: -sz[i])
    keep = np.zeros_like(g)
    main = order[0]; keep |= lab == main + 1
    ys = np.where(keep)[0]; top = ys.min()
    for i in order[1:]:
        if sz[i] > 25 and cy[i] > top + 10: keep |= lab == i + 1   # rayures, cordons séparés
    keep = ndimage.binary_fill_holes(keep) & ~(skin & ~ndimage.binary_erosion(ndimage.binary_fill_holes(keep), iterations=2))
    return keep, bg, skin
if __name__ == '__main__' and len(sys.argv) > 2 and sys.argv[2] == 'masques':
    tiles = []
    for r in range(4):
        row = []
        for c in range(8):
            a = cell(r, c); k, bg, sk = garment(a)
            v = a.copy(); v[~k] = (255, 0, 255); row.append(cv2.resize(v, (150, 280)))
        tiles.append(np.hstack(row))
    cv2.imwrite(SP + '/hg-masks.png', np.vstack(tiles))

# ---------- étape 2 : posé sur le corps du jeu ----------
# (clé, haut du jeu, couleur, rangée, colonne) dans l'ordre de la planche
ITEMS = [('tee-blanc','gtee','#f4f1ea',0,0),('tee-noir','gtee','#1f2127',0,1),('tee-creme','gtee','#ece2cc',0,2),('tee-anthracite','gtee','#4a4b50',0,3),
 ('polo-blanc','gpolo','#f4f1ea',0,4),('polo-noir','gpolo','#1f2127',0,5),('polopk-creme','gpolopk','#ece2cc',0,6),('chem-noir','gchem','#1f2127',0,7),
 ('hood-gris','ghood','#a9adb3',1,0),('hood-noir','ghood','#1f2127',1,1),('hood-creme','ghood','#ece2cc',1,2),('zip-noir','gzip','#1f2127',1,3),
 ('sweat-noir','gsweat','#1f2127',1,4),('sweat-gris','gsweat','#a9adb3',1,5),('pull-creme','gpull','#ece2cc',1,6),('cote-noir','gcote','#1f2127',1,7),
 ('sport-blanc','gsport','#f4f1ea',2,0),('sport-noir','gsport','#1f2127',2,1),('bandes-blanc','gbandes','#f4f1ea',2,2),('bandes-noir','gbandes','#1f2127',2,3),
 ('deb-noir','gdeb','#1f2127',2,4),('deb-blanc','gdeb','#f4f1ea',2,5),('nageur-noir','gnageur','#1f2127',2,6),('nageur-blanc','gnageur','#f4f1ea',2,7),
 ('layer-noir','glayer','#1f2127',3,0),('layer-blanc','glayer','#f4f1ea',3,1),('teepk-noir','gteepk','#1f2127',3,2),('over-creme','gover','#ece2cc',3,3),
 ('lin-noir','glin','#1f2127',3,4),('lin-creme','glin','#ece2cc',3,5),('raye-noir','graye','#1f2127',3,6),('raye-creme','graye','#ece2cc',3,7)]
def ours_mask(png):
    a = cv2.imread(png).astype(int); B, G, Rr = a[..., 0], a[..., 1], a[..., 2]
    skin = (G > Rr + 40) & (G > B + 40); pants = (B > Rr + 40) & (B > G + 40); bg = (Rr > 200) & (B > 200) & (G < 80)
    m = ~(skin | pants | bg)
    m = cv2.morphologyEx(m.astype(np.uint8), cv2.MORPH_OPEN, np.ones((3, 3), np.uint8)).astype(bool)
    lab, n = ndimage.label(m); sz = ndimage.sum(m, lab, range(1, n + 1))
    return np.isin(lab, [i + 1 for i in range(n) if sz[i] > 300])
def runs(row, minw=3):
    q = np.where(row)[0]
    if not len(q): return []
    cut = np.where(np.diff(q) > 1)[0]
    return [(int(a[0]), int(a[-1])) for a in np.split(q, cut + 1) if a[-1] - a[0] >= minw]
def warp(src, sm, om):
    """src/sm : haut de la planche (pixels BGR, masque) ; om : masque de notre haut. Ligne par ligne, les morceaux
       (manche, buste, manche) de la planche sont étirés sur ceux du jeu."""
    H, W = om.shape; out = np.zeros((H, W, 4), np.float32)
    ys_o = np.where(om.any(1))[0]; ys_h = np.where(sm.any(1))[0]
    to, bo, th, bh = ys_o.min(), ys_o.max(), ys_h.min(), ys_h.max()
    xs = np.arange(W, dtype=np.float32); srcf = src.astype(np.float32)
    for y in range(to, bo + 1):
        ro = runs(om[y])
        if not ro: continue
        yh = th + (y - to) * (bh - th) / max(1, bo - to); y0 = int(np.clip(round(yh), th, bh))
        rh = runs(sm[y0])
        if not rh:
            for d in range(1, 6):
                for yy in (y0 - d, y0 + d):
                    if th <= yy <= bh and runs(sm[yy]): rh = runs(sm[yy]); y0 = yy; break
                if rh: break
        if not rh: continue
        if len(rh) != len(ro):
            ro2 = [(ro[0][0], ro[-1][1])]; rh2 = [(rh[0][0], rh[-1][1])]
        else: ro2, rh2 = ro, rh
        row = np.zeros((W, 4), np.float32)
        for (a0, a1), (b0, b1) in zip(ro2, rh2):
            msk = (xs >= a0) & (xs <= a1)
            sx = b0 + (xs[msk] - a0) * (b1 - b0) / max(1, a1 - a0)
            for c in range(3): row[msk, c] = np.interp(sx, np.arange(src.shape[1]), srcf[y0, :, c])
            row[msk, 3] = 255
        row[~om[y], 3] = 0
        out[y] = row
    return out

if __name__ == '__main__' and (len(sys.argv) < 3 or sys.argv[2] != 'masques'):
    import subprocess
    L = json.dumps([[k, t, c] for k, t, c, r, cc in ITEMS])
    if not (len(sys.argv) > 2 and sys.argv[2] == 'sans-rendu'):
        subprocess.run(['node', os.path.join(R, 'tools/hauts-garcons-corps.js'), SP, L], check=True)
    meta = json.load(open(SP + '/corps-meta.json'))
    os.makedirs(os.path.join(R, 'assets/hauts'), exist_ok=True)
    art = {}
    for k, t, c, r, cc in ITEMS:
        a = cell(r, cc); m, bg, sk = garment(a)
        m = ndimage.binary_erosion(m, iterations=2)
        # liseré clair du bord (fond de la planche mélangé) : couleur reprise de l'intérieur
        inner = ndimage.binary_erosion(m, iterations=2)
        idx = ndimage.distance_transform_edt(~inner, return_distances=False, return_indices=True)
        a = np.where((m & ~inner)[..., None], a[idx[0], idx[1]], a)
        om = ours_mask(f'{SP}/corps-{k}-0.png'); cv2.imwrite(f'{SP}/om-{k}.png', (om * 255).astype(np.uint8)[::2, ::2])
        # même cadre que notre haut (les proportions de la planche et du jeu sont presque identiques) : le dessin est gardé tel quel
        ys, xs = np.where(m); ty, by_, tx, bx = ys.min(), ys.max(), xs.min(), xs.max()
        yo, xo = np.where(om); oy0, oy1, ox0, ox1 = yo.min(), yo.max(), xo.min(), xo.max()
        Ma = np.float32([[(ox1 - ox0) / (bx - tx), 0, ox0 - tx * (ox1 - ox0) / (bx - tx)], [0, (oy1 - oy0) / (by_ - ty), oy0 - ty * (oy1 - oy0) / (by_ - ty)]])
        rgba = np.dstack([a, (m * 255).astype(np.uint8)])
        out = cv2.warpAffine(rgba, Ma, (om.shape[1], om.shape[0]), flags=cv2.INTER_CUBIC, borderValue=(0, 0, 0, 0)).astype(np.float32)
        out[..., 3] = cv2.warpAffine((m * 255).astype(np.uint8), Ma, (om.shape[1], om.shape[0]), flags=cv2.INTER_LINEAR)
        # bords doux
        al = cv2.GaussianBlur(out[..., 3], (0, 0), .8); out[..., 3] = np.minimum(out[..., 3], al * 1.3)
        ys, xs = np.where(out[..., 3] > 4); y0, y1, x0, x1 = ys.min(), ys.max() + 1, xs.min(), xs.max() + 1
        crop = out[y0:y1, x0:x1]
        small = cv2.resize(crop, ((x1 - x0) // 2, (y1 - y0) // 2), interpolation=cv2.INTER_AREA)
        cv2.imwrite(os.path.join(R, f'assets/hauts/{k}.png'), np.clip(small, 0, 255).astype(np.uint8), [cv2.IMWRITE_PNG_COMPRESSION, 9])
        A, B_, C_, D, E, F = meta[k]
        Lm = small[..., :3].mean(2)[small[..., 3] > 200] / 255
        art[k] = [round((x0 - E) / A, 2), round((y0 - F) / D, 2), round((x1 - x0) / A, 2), round((y1 - y0) / D, 2)] + [round(float(np.percentile(Lm, q)), 3) for q in (3, 50, 97)] + [t, c]
        print(k, art[k][:4])
    open(os.path.join(R, 'js/hauts-garcons-art.js'), 'w').write('/* hauts des garçons copiés sur la planche corrigée de Prescillia par tools/traceur-hauts-garcons.py — ne pas modifier à la main\n   [x, y, largeur, hauteur] dans le repère du corps */\nconst HG_ART=' + json.dumps(art, separators=(',', ':')) + ';\n')
