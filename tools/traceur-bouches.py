"""Reprend les bouches dessinées par Prescillia (docs/references/bouches/planche-bouches.png) en images détourées.
   python3 tools/traceur-bouches.py  ->  assets/bouches/<id>.png et js/bouches-art.js

   Chaque case de la planche a le même visage : les pupilles (x 41,5 et 201, y 14,3 dans la case) sont posées sur les yeux
   du jeu (±52, y 205). Autour des lèvres, la peau est reconstituée (inpainting) puis retirée : il ne reste que les lèvres,
   leur trait, leurs reflets et l'ombre sous la lèvre inférieure, avec une transparence progressive sur les bords."""
import json, os, numpy as np, cv2

SRC = 'docs/references/bouches/planche-bouches.png'
COLS = [(11, 256), (275, 519), (537, 780), (799, 1041), (1060, 1302)]
ROWS = [133, 399, 667, 937]
IDS = [['fine', 'moyenne', 'pleine', 'coeur', 'rectangle'],
       ['ronde', 'pulpeuse', 'trespulpeuse', 'asymetrique', 'superfine'],
       ['inferieure', 'tombante', 'remontante', 'entrouverte', 'fermee'],
       ['glossy', 'mat', 'ombre', 'glosscentre', 'naturelle']]
EYE_X, EYE_Y, EYE_HALF = 121.3, 14.3, 79.8   # pupilles dans une case
K = 52 / EYE_HALF                                # unités du jeu par pixel de la planche
MOUTH_Y = 285                                    # repère de la bouche dans le jeu
S = 4                                            # agrandissement de l'image enregistrée

im = cv2.imread(SRC)
os.makedirs('assets/bouches', exist_ok=True)
out = {}
for r, y0 in enumerate(ROWS):
    for c, (x0, x1) in enumerate(COLS):
        hid = IDS[r][c]
        ox, oy = x0 + 56, y0 + 95                # zone de la bouche dans la case
        crop = im[oy:oy + 90, ox:ox + 132].copy()
        lab = cv2.cvtColor(crop, cv2.COLOR_BGR2LAB).astype(np.float32)
        # peau : couleur des bords de la zone, prolongée vers l'intérieur
        guess = np.zeros(crop.shape[:2], np.uint8); guess[8:-8, 10:-10] = 1
        skin = cv2.inpaint(crop, guess, 12, cv2.INPAINT_TELEA)
        for _ in range(2):   # on affine : tout ce qui ressemble à la peau sert à estimer la peau
            d = np.linalg.norm(lab - cv2.cvtColor(skin, cv2.COLOR_BGR2LAB).astype(np.float32), axis=2)
            m = cv2.dilate((d > 6).astype(np.uint8), np.ones((5, 5), np.uint8))
            skin = cv2.inpaint(crop, m, 10, cv2.INPAINT_TELEA)
        skin = cv2.GaussianBlur(skin, (0, 0), 3)
        d = np.linalg.norm(lab - cv2.cvtColor(skin, cv2.COLOR_BGR2LAB).astype(np.float32), axis=2)
        a = np.clip((d - 3) / 9, 0, 1)
        n, labm, st, _ = cv2.connectedComponentsWithStats((a > .5).astype(np.uint8), 8)
        keep = np.isin(labm, [1 + int(np.argmax(st[1:, 4]))])
        keep = cv2.dilate(keep.astype(np.uint8), np.ones((9, 9), np.uint8)) > 0   # les lèvres et leur ombre, pas les taches de rousseur
        a = a * keep
        # intérieur des lèvres : plein (aucun trou), avec les vrais pixels du dessin
        lips = np.zeros(a.shape, np.uint8)
        # lèvres = plus rouges que la peau (canal a* du Lab) ou plus foncées (trait entre les lèvres) ; dents blanches comprises
        sl = cv2.cvtColor(skin, cv2.COLOR_BGR2LAB).astype(np.float32)
        red = (lab[..., 1] - sl[..., 1] > 7) | ((sl[..., 0] - lab[..., 0] > 45) & (a > .5))
        red = cv2.morphologyEx(red.astype(np.uint8), cv2.MORPH_OPEN, np.ones((2, 2), np.uint8))
        cs, _ = cv2.findContours(cv2.morphologyEx((a > .45).astype(np.uint8), cv2.MORPH_CLOSE, np.ones((5, 5), np.uint8)), cv2.RETR_EXTERNAL, cv2.CHAIN_APPROX_NONE)
        cv2.drawContours(lips, [max(cs, key=cv2.contourArea)], -1, 1, -1)
        lips = cv2.erode(lips, np.ones((3, 3), np.uint8), iterations=2) | red   # contour resserré (pas de liseré de peau) + tout ce qui est rouge
        cs, _ = cv2.findContours(cv2.morphologyEx(lips, cv2.MORPH_CLOSE, np.ones((5, 5), np.uint8)), cv2.RETR_EXTERNAL, cv2.CHAIN_APPROX_NONE)
        lips = np.zeros(a.shape, np.uint8); cv2.drawContours(lips, [max(cs, key=cv2.contourArea)], -1, 1, -1)
        lips = cv2.morphologyEx(lips, cv2.MORPH_OPEN, cv2.getStructuringElement(cv2.MORPH_ELLIPSE, (5, 5)))   # petites bosses du contour retirées
        # couleur « démélangée » : ce qui, posé avec cette transparence sur la peau, redonne le pixel du dessin
        cf, sf = crop.astype(np.float32), skin.astype(np.float32)
        col = np.clip(sf + (cf - sf) / np.maximum(a, .05)[..., None], 0, 255)
        # autour des lèvres : seulement l'ombre (plus foncé que la peau), en brun très sombre transparent, pour qu'elle reste juste sur toutes les peaux
        Lc, Ls = cf.mean(2), sf.mean(2)
        sh = np.clip((Ls - Lc) / np.maximum(Ls, 1) * 1.6, 0, .55) * keep
        ys_ = np.where(lips.any(1))[0]; low = np.zeros(sh.shape, bool); low[int(ys_.mean()):] = True
        sh = cv2.GaussianBlur(sh * low * (1 - cv2.dilate(lips, np.ones((5, 5), np.uint8))), (0, 0), 1.5)   # ombre douce sous la lèvre inférieure seulement
        col[:] = (40, 22, 30); a = sh   # BGR
        col[lips.astype(bool)] = cf[lips.astype(bool)]
        # bord des lèvres : la couleur des lèvres est prolongée vers l'extérieur (pas de liseré de peau), le contour sera lissé à l'agrandissement
        fillc = cv2.inpaint(cf.astype(np.uint8), (1 - cv2.erode(lips, np.ones((3, 3), np.uint8))).astype(np.uint8), 3, cv2.INPAINT_TELEA).astype(np.float32)
        ring = cv2.dilate(lips, np.ones((5, 5), np.uint8)).astype(bool) & ~lips.astype(bool)
        col[ring] = fillc[ring]; lipsf = lips.astype(np.float32)
        big = lambda x, i=cv2.INTER_CUBIC: cv2.resize(x, None, fx=S, fy=S, interpolation=i)
        la = np.clip((cv2.GaussianBlur(big(lipsf, cv2.INTER_LINEAR), (0, 0), S * 1.1) - .5) * 2.6 + .5, 0, 1)   # contour lisse
        # trait de la bouche jusqu'aux commissures (fin, il serait effacé par le lissage) : remis tel quel par-dessus
        line = ((Ls - Lc) > 38) & keep & ~cv2.morphologyEx(lips, cv2.MORPH_ERODE, np.ones((3, 3), np.uint8)).astype(bool)
        n_, lb_, st_, _ = cv2.connectedComponentsWithStats(line.astype(np.uint8), 8)
        line = np.isin(lb_, [i for i in range(1, n_) if st_[i][4] >= 6])
        lw = np.clip(cv2.GaussianBlur(big(line.astype(np.float32), cv2.INTER_LINEAR), (0, 0), S * .3) * 1.4, 0, 1)
        col = np.where(line[..., None], cf, col)
        la = np.maximum(la, lw)
        A = np.maximum(la, np.clip(big(a.astype(np.float32)), 0, 1) * (1 - la))
        C = big(col) * la[..., None] + np.array([40, 22, 30], np.float32) * (1 - la[..., None])
        rgba = np.dstack([C, A * 255]).clip(0, 255).astype(np.uint8)
        ys, xs = np.where(rgba[..., 3] > 3); X0, Y0, X1, Y1 = xs.min(), ys.min(), xs.max() + 1, ys.max() + 1
        cv2.imwrite(f'assets/bouches/{hid}.png', rgba[Y0:Y1, X0:X1], [cv2.IMWRITE_PNG_COMPRESSION, 9])
        u = lambda px, py: ((ox - x0 + px / S - EYE_X) * K, 205 + (oy - y0 + py / S - EYE_Y) * K - MOUTH_Y)
        p0, p1 = u(X0, Y0), u(X1, Y1)
        out[hid] = [round(p0[0], 2), round(p0[1], 2), round(p1[0] - p0[0], 2), round(p1[1] - p0[1], 2)]
        print(hid, out[hid])
js = '/* bouches décalquées par tools/traceur-bouches.py sur docs/references/bouches/ — ne pas modifier à la main */\nconst MOUTH_ART=' + json.dumps(out, separators=(',', ':')) + ';\n'
open('js/bouches-art.js', 'w').write(js)
