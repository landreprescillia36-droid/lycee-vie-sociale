"""Sourcils des GARÇONS décalqués sur docs/references/sourcils/planche-sourcils-garcons.png (16 formes, 4 × 4 cases).
   python3 tools/traceur-sourcils-garcons.py  ->  assets/sourcils/<forme>.png et js/sourcils-garcons-art.js

   - Dans chaque case : on repère les deux yeux (blanc de l'œil) -> centre du visage et écart entre les yeux.
   - Le sourcil de droite (côté écran) est détouré : la peau autour est reconstituée (inpainting) puis retirée.
   - L'image garde la clarté des poils (gris) ; le jeu la reteint à la couleur des sourcils, comme les barbes.
   - Échelle : l'écart entre les yeux de la planche devient 104 (yeux du jeu à ±52).
   Coordonnées [x, y, largeur, hauteur, clarté sombre, moyenne, claire], x par rapport au centre du visage,
   y par rapport au centre des yeux (Naturel posé à la hauteur des sourcils des filles)."""
import json, os, numpy as np, cv2

SRC = 'docs/references/sourcils/planche-sourcils-garcons.png'
IDS = ['bgnaturel', 'bgdroit', 'bgdoux', 'bgarque', 'bgepais', 'bgfin', 'bgcasseleger', 'bgcasse',
       'bgfonce', 'bgaile', 'bgarrondi', 'bgdroitepais', 'bgtouffu', 'bgebouriffe', 'bgdecontracte', 'bgnatepais']
CX = [(20, 310), (328, 620), (635, 925), (943, 1235)]
RY = [360, 585, 810, 1035]
S = 6                       # agrandissement des images enregistrées (par unité du jeu)
NAT_Y = -50                 # centre vertical du sourcil « Naturel » dans le jeu (par rapport au centre des yeux)
im = cv2.imread(SRC)
os.makedirs('assets/sourcils', exist_ok=True)


def eyes(cell):
    hsv = cv2.cvtColor(cell, cv2.COLOR_BGR2HSV)
    w = ((hsv[..., 2] > 185) & (hsv[..., 1] < 70)).astype(np.uint8)
    w[:95] = 0; w[165:] = 0; w[:, :25] = 0; w[:, -25:] = 0
    n, lb, st, cen = cv2.connectedComponentsWithStats(w, 8)
    P = [(cen[i][0], cen[i][1]) for i in range(1, n) if st[i][4] >= 90]
    L = [p for p in P if p[0] < cell.shape[1] / 2]; R = [p for p in P if p[0] >= cell.shape[1] / 2]
    c = lambda Q: (np.mean([q[0] for q in Q]), np.mean([q[1] for q in Q]))
    return c(L), c(R)


def skin_alpha(crop):
    lab = cv2.cvtColor(crop, cv2.COLOR_BGR2LAB).astype(np.float32)
    guess = np.zeros(crop.shape[:2], np.uint8); guess[5:-5, 5:-5] = 1
    skin = cv2.inpaint(crop, guess, 12, cv2.INPAINT_TELEA)
    for _ in range(3):
        d = np.linalg.norm(lab - cv2.cvtColor(skin, cv2.COLOR_BGR2LAB).astype(np.float32), axis=2)
        m = cv2.dilate((d > 6).astype(np.uint8), np.ones((5, 5), np.uint8))
        skin = cv2.inpaint(crop, m, 10, cv2.INPAINT_TELEA)
    skin = cv2.GaussianBlur(skin, (0, 0), 3)
    Ls = skin.astype(np.float32).mean(2); Lc = crop.astype(np.float32).mean(2)
    a = np.clip((Ls - Lc - 6) / np.maximum(Ls - 30, 30), 0, 1)
    Lb = np.clip((Lc - (1 - a) * Ls) / np.maximum(a, .05), 0, 255)
    return a, Lb


art, nat = {}, None
for r, y0 in enumerate(RY):
    for c, (x0, x1) in enumerate(CX):
        bid = IDS[r * 4 + c]
        cell = im[y0:y0 + 175, x0:x1]
        (lx, ly), (rx, ry) = eyes(cell)
        D = rx - lx; k = 104 / D; fx = (lx + rx) / 2; ey = (ly + ry) / 2
        # zone du sourcil droit (à l'écran) : au-dessus de l'œil, sans les cheveux ni la tempe
        X0, X1, Y0, Y1 = int(fx + 8), int(rx + 62), int(ey - 75), int(ey - 22)
        crop = cell[Y0:Y1, X0:X1]
        a, Lb = skin_alpha(crop)
        m = (a > .3).astype(np.uint8)
        n, lab, st, _ = cv2.connectedComponentsWithStats(m, 8)
        H, W = m.shape
        main = max(range(1, n), key=lambda i: st[i][4])
        bx, by_, bw, bh = st[main][:4]
        keep = (lab == main)
        for i in range(1, n):    # poils détachés (touffu, ébouriffé) : gardés s'ils sont contre le sourcil
            x, y, w, h, ar = st[i]
            if i != main and ar >= 4 and x < bx + bw + 3 and x + w > bx - 3 and y < by_ + bh + 4 and y + h > by_ - 6 \
                    and x + w < W - 1 and y > 0:
                keep |= lab == i
        keep = cv2.dilate(keep.astype(np.uint8), np.ones((5, 5), np.uint8)).astype(np.float32)
        a = a * cv2.GaussianBlur(keep, (0, 0), .8)
        a = a * np.clip((70 - Lb) / 25, 0, 1)      # ombre de peau, pas des poils
        ys, xs = np.where(a > .04)
        ax0, ax1, ay0, ay1 = xs.min() - 1, xs.max() + 2, ys.min() - 1, ys.max() + 2
        a, Lb = a[ay0:ay1, ax0:ax1], Lb[ay0:ay1, ax0:ax1]
        g = np.where(a > .03, Lb, 40)
        rgba = np.dstack([g, g, g, a * 255]).astype(np.float32)
        gw, gh = (ax1 - ax0) * k, (ay1 - ay0) * k
        big = cv2.resize(rgba, (round(gw * S), round(gh * S)), interpolation=cv2.INTER_CUBIC)
        cv2.imwrite(f'assets/sourcils/{bid}.png', np.clip(big, 0, 255).astype(np.uint8), [cv2.IMWRITE_PNG_COMPRESSION, 9])
        sel = a > .5
        v = np.sort(Lb[sel] / 255)
        l0, lm, l1 = [float(v[int(q * (len(v) - 1))]) for q in (.02, .5, .98)]
        gx = (X0 + ax0 - fx) * k; gy = (Y0 + ay0 - ey) * k
        if nat is None: nat = NAT_Y - (gy + gh / 2)
        art[bid] = [round(gx, 2), round(gy + nat, 2), round(gw, 2), round(gh, 2), round(l0, 3), round(lm, 3), round(max(l1, lm + .05), 3)]
        print(bid, round(D, 1), art[bid])
open('js/sourcils-garcons-art.js', 'w').write(
    '/* sourcils des garçons décalqués par tools/traceur-sourcils-garcons.py sur docs/references/sourcils/planche-sourcils-garcons.png — ne pas modifier à la main\n'
    '   [x (par rapport au centre du visage), y (par rapport au centre des yeux), largeur, hauteur, clarté sombre, moyenne, claire] */\n'
    'const BROW_ART_G=' + json.dumps(art, separators=(',', ':')) + ';\n')
