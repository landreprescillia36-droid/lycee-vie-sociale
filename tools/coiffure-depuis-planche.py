"""Coiffure reprise pixel par pixel d'une planche de Prescillia (cases sur fond bleu clair, visage différent du jeu).
   La case est recalée sur le jeu par les deux yeux (centre des iris -> yeux du jeu en (148, 205) et (252, 205), repère de tête) ;
   chaque pixel de l'image de la coiffure vient de la case, la transparence est retrouvée par rapport au fond local (bleu ou peau) ;
   les traits rouges de Prescillia sur la planche sont remplacés par le côté opposé (miroir) ; le bas coupé par le haut noir finit en pointes.
   Usage : python3 tools/coiffure-depuis-planche.py <coiffure> <planche> <xg yg xd yd> <case: X0 Y0 X1 Y1>"""
import sys, os, re, json, numpy as np, cv2
from PIL import Image
R = os.path.join(os.path.dirname(os.path.abspath(__file__)), '..'); os.chdir(R)
hid, cap = sys.argv[1], sys.argv[2]; xg, yg, xd, yd, X0, Y0, X1, Y1 = map(float, sys.argv[3:11])
OPT = sys.argv[11:]; DROIT = 'droit' in OPT
ATTACHE = 'attache' in OPT   # cheveux attachés (mèches fines le long du visage) : rien de rempli derrière le visage et le cou   # tresses qui pendent droit : pas écartées, passent derrière la mâchoire et le cou
P = lambda f: 'assets/coiffures/' + f + '.png'
js = open('js/coiffures-art.js').read()
if '"' + hid + '":{' not in js:   # nouvelle coiffure : même fiche que l'afro
    m = re.search(r'"bafro":(\{[^}]*\})', js); js = js.replace('"bafro":', '"' + hid + '":' + m.group(1) + ',"bafro":', 1)
r = 1.72   # px de l'image par unité de tête (comme les autres coiffures bouclées)
ref = cv2.imread(cap)[:, :, ::-1].astype(np.float32)
# traits rouges : remplacés par le pixel symétrique (axe = milieu des yeux)
red = (ref[:, :, 0] > 140) & (ref[:, :, 0] - ref[:, :, 1] > 70) & (ref[:, :, 0] - ref[:, :, 2] > 60)
red = cv2.dilate(red.astype(np.uint8), np.ones((5, 5), np.uint8)).astype(bool)
ax = (xg + xd) / 2; yy_, xx_ = np.where(red & (np.arange(ref.shape[1])[None, :] >= X0) & (np.arange(ref.shape[1])[None, :] < X1) & (np.arange(ref.shape[0])[:, None] >= Y0) & (np.arange(ref.shape[0])[:, None] < Y1))
mx = np.clip(np.round(2 * ax - xx_).astype(int), 0, ref.shape[1] - 1); ref[yy_, xx_] = ref[yy_, mx]
# repère : yeux de la case -> yeux du jeu
k = np.hypot(xd - xg, yd - yg) / 104; th = np.arctan2(yd - yg, xd - xg); ex, ey = (xg + xd) / 2, (yg + yd) / 2
def to_img(u, v):
    du, dv = (u - 200) * k, (v - 205) * k
    return ex + du * np.cos(th) - dv * np.sin(th), ey + du * np.sin(th) + dv * np.cos(th)
fu0, fu1 = 200 + (X0 + 6 - ex) / k, 200 + (X1 - 6 - ex) / k; fv0, fv1 = 205 + (Y0 + 4 - ey) / k, 205 + (Y1 - ey) / k
nu0, nu1, nv0, nv1 = fu0, fu1, fv0 - 45, max(fv1 + 4, 480 if DROIT else 0)   # au-dessus : place pour arrondir le haut quand la case coupe les cheveux
W, H = int(round((nu1 - nu0) * r)), int(round((nv1 - nv0) * r))
U = nu0 + (np.arange(W) + .5) / r; V = nv0 + (np.arange(H) + .5) / r; UU, VV = np.meshgrid(U, V)
X, Y = to_img(UU, VV); X = X.astype(np.float32); Y = Y.astype(np.float32)
C = cv2.remap(ref, X, Y, cv2.INTER_CUBIC, borderMode=cv2.BORDER_REPLICATE).clip(0, 255)
# le visage de la planche est plus court que celui du jeu : sous les yeux, les cheveux qui longent la joue et la mâchoire
# sont écartés jusqu'au bord du visage du jeu (demi-largeur mesurée sur le rendu, unités de tête) ; plus loin, rien ne bouge
GV = [228, 235, 240, 245, 250, 255, 260, 265, 270, 280, 285, 290, 295, 300, 305, 310, 315]
GW = [92, 89, 88, 86.5, 84.5, 82.5, 80, 78, 75, 68.6, 64.8, 60.4, 55.4, 49, 42.7, 35, 27]
Cl = C @ [.299, .587, .114]; skc = ((C[:, :, 0] - C[:, :, 2]) > 60) & (Cl > 110)
sw = np.full(H, np.nan); c0_ = int(np.argmin(np.abs(U - 200)))
for y in range(H):
    if not (GV[0] <= V[y] <= GV[-1]) or not skc[y, c0_]: continue
    l = c0_; rr = c0_
    while l > 0 and skc[y, l - 1]: l -= 1
    while rr < W - 1 and skc[y, rr + 1]: rr += 1
    sw[y] = (rr - l) / 2 / r
ok_ = ~np.isnan(sw)
if DROIT:   # tresses qui pendent droit : décalées d'un bloc vers l'extérieur (sans être tordues) pour longer la mâchoire du jeu
    du = np.abs(UU - 200); shv = 4 * np.clip((VV - 200) / 25, 0, 1) * np.clip((du - 50) / 20, 0, 1)
    U2 = 200 + np.sign(UU - 200) * (du - shv)
    V2 = np.where(VV > 240, 240 + (VV - 240) * (351 - 240) / (381 - 240), VV)   # le cou du jeu est plus long : les tresses sont allongées pour finir sur les épaules, comme sur la planche
    X, Y = to_img(U2, V2); C = cv2.remap(ref, X.astype(np.float32), Y.astype(np.float32), cv2.INTER_CUBIC, borderMode=cv2.BORDER_REPLICATE).clip(0, 255)
if ok_.sum() > 10 and not DROIT:
    sw = np.interp(np.arange(H), np.where(ok_)[0], sw[ok_]); sw = cv2.GaussianBlur(sw.reshape(-1, 1), (0, 0), 10).ravel()
    gw = np.interp(V, GV, GW)
    wv = np.clip((V - 214) / 16, 0, 1) * np.clip((330 - V) / 10, 0, 1)   # fondu au-dessus (yeux) et au cou
    du = np.abs(UU - 200); g_ = gw[:, None]; s_ = np.minimum(sw, gw)[:, None]
    din = np.where(du < g_, du * s_ / g_, np.where(du < g_ + 60, s_ + (du - g_) * (g_ + 60 - s_) / 60, du))
    U2 = 200 + np.sign(UU - 200) * (du + (din - du) * wv[:, None])
    X, Y = to_img(U2, VV); X = X.astype(np.float32); Y = Y.astype(np.float32)
    C = cv2.remap(ref, X, Y, cv2.INTER_CUBIC, borderMode=cv2.BORDER_REPLICATE).clip(0, 255)
    print('  joues :', [(int(v), round(float(np.interp(v, V, sw)), 1), round(float(np.interp(v, GV, GW)), 1)) for v in (240, 260, 280, 300)])
O = np.zeros((H, W, 4), np.float32)
lum = C @ [.299, .587, .114]
# fond local : pixels nettement « fond » (bleu de la case, peau du visage/cou/épaules, bijoux clairs)
yel = np.linalg.norm(C - [226, 236, 248], axis=2) < 30
skin = ((C[:, :, 0] - C[:, :, 2]) > 70) & (lum > 120)
clear = yel | skin | (lum > 200)
bg = cv2.inpaint(C.astype(np.uint8), (~clear).astype(np.uint8), 9, cv2.INPAINT_TELEA).astype(np.float32)
bg = cv2.GaussianBlur(bg, (0, 0), 3)
Hc = np.array([28, 18, 12.], np.float32)
v_ = Hc[None, None] - bg
a = np.clip(((C - bg) * v_).sum(-1) / np.maximum((v_ * v_).sum(-1), 1), 0, 1)
hard = cv2.erode((a > .55).astype(np.uint8), np.ones((5, 5), np.uint8)).astype(bool)
hard &= ~((((UU - 200) / 96) ** 2 + ((VV - 205) / 120) ** 2 < 1) & (VV < 215))   # baby hair : jamais forcés opaques
a = np.where(hard, 1, a); a[a < .1] = 0
face_in = (((UU - 200) / 96) ** 2 + ((VV - 205) / 120) ** 2 < 1)
bh = face_in & (VV < 215)   # front et tempes : baby hair
brows_eyes = face_in & (((np.abs(UU - 200) > 12) & (np.abs(UU - 200) < 74) & (VV > 152)) | (VV > 188) & (np.abs(UU - 200) < 72))
kill = cv2.GaussianBlur(((face_in & ~bh) | brows_eyes).astype(np.float32), (0, 0), 2.5)
a = a * (1 - np.clip(kill * 2, 0, 1))   # visage (yeux, sourcils, bouche) : jamais des cheveux, bord fondu
# bord du visage, du cou et des épaules, bijoux : les pixels clairs ou couleur peau ne sont jamais des cheveux
near = cv2.dilate((skin | (lum > 215)).astype(np.uint8), np.ones((5, 5), np.uint8)).astype(bool)
a[near & (lum > 75) & ~bh & (VV > 215)] = 0
# petits trous à l'intérieur de la masse (reflets clairs pris pour du fond) : bouchés
op_ = (a > .5).astype(np.uint8); n_, lb_, st_, _ = cv2.connectedComponentsWithStats(1 - op_, connectivity=4)
small = np.isin(lb_, [i for i in range(1, n_) if st_[i, 4] < 300]) & ~face_in & ~cv2.dilate(bh.astype(np.uint8), np.ones((15, 15), np.uint8)).astype(bool)
a[small] = 1
nl, lab, st, _ = cv2.connectedComponentsWithStats((a > .3).astype(np.uint8), connectivity=8)
keepc = [i for i in range(1, nl) if st[i, 4] > 2000 or (st[i, 4] > 25 and bh[st[i, 1] + st[i, 3] // 2, st[i, 0] + st[i, 2] // 2])]
keep = cv2.dilate(np.isin(lab, keepc).astype(np.uint8), cv2.getStructuringElement(cv2.MORPH_ELLIPSE, (5, 5))).astype(bool)
a = np.where(keep, a, 0)
um = (C - (1 - a[:, :, None]) * bg) / np.maximum(a[:, :, None], .05)
um = np.minimum(um, np.maximum(C, Hc))
lu = um @ [.299, .587, .114]; Lmax = np.percentile(lum[hard], 97)
um = um * np.minimum(1, Lmax / np.maximum(lu, 1))[:, :, None]
# demi-transparents : clarté démélangée de la peau, teinte des cheveux (jamais bleutée ni couleur peau)
hue = np.median(C[hard], 0); hl = hue @ [.299, .587, .114]
ul = np.clip(um @ [.299, .587, .114], 0, Lmax)
semi = hue[None, None] * (ul / max(hl, 1))[:, :, None]
semi = semi + np.clip(ul - 255 * 0, 0, 0)[:, :, None]
col = np.where(hard[:, :, None], C, semi)
smd = cv2.dilate(small.astype(np.uint8), cv2.getStructuringElement(cv2.MORPH_ELLIPSE, (5, 5))).astype(bool) & ~bh   # trous bouchés : couleur des cheveux autour
col = np.where(smd[:, :, None], cv2.inpaint(col.clip(0, 255).astype(np.uint8), smd.astype(np.uint8), 5, cv2.INPAINT_TELEA), col); a[smd] = 1
new = np.dstack([col, a * 255])
if os.environ.get('DBG'): Image.fromarray(C.astype(np.uint8)).save('/tmp/claude-0/-home-claude/188c02e2-7576-5cbc-a5dc-25186038a661/scratchpad/ds/dbgC.png'); Image.fromarray((a*255).astype(np.uint8)).save('/tmp/claude-0/-home-claude/188c02e2-7576-5cbc-a5dc-25186038a661/scratchpad/ds/dbgA.png')
# carte -> image d'origine (au-dessus et en dessous), fondu sur 10 px
inC = np.clip(np.minimum.reduce([(UU - fu0) * r, (fu1 - UU) * r, (VV - fv0) * r, (fv1 - VV) * r]) / 10, 0, 1)
yt = int(np.ceil((fv0 - nv0) * r)) + 2   # première ligne sûre de la case
O[:] = 0; new[:yt] = 0
# haut coupé par la case : chaque partie coupée (masse, chignon…) est fermée par un dôme bouclé : contour en petites boucles
# arrondies, texture des boucles juste en dessous recopiée en miroir, raccord fondu sur 10 lignes
rngc = np.random.default_rng(7); xx = np.arange(W); Yc0 = np.arange(H)[:, None] + .5
cut = new[yt + 1, :, 3] > 200   # cheveux coupés net par le haut de la case
domez = np.zeros(W, bool)
runs = np.split(np.where(cut)[0], np.where(np.diff(np.where(cut)[0]) > 3)[0] + 1) if cut.any() else []
for rn in runs:
    if len(rn) < 30: continue
    domez[rn[0]:rn[-1] + 1] = True
    c0, hw0 = (rn[0] + rn[-1] + 1) / 2, (rn[-1] + 1 - rn[0]) / 2; hc = min(.42 * hw0, yt - 4)
    top = np.full(W, np.inf); x = rn[0]
    while x <= rn[-1]:   # bord du dôme en boucles : largeur 18 à 30 px, bout arrondi
        w = int(rngc.integers(18, 30)); seg = np.arange(x, min(rn[-1] + 1, x + w)); hwl = max(len(seg) / 2, 1); cl = x + hwl
        u_ = np.clip((seg + .5 - cl) / hwl, -1, 1); q = np.clip(1 - ((seg + .5 - c0) / hw0) ** 2, 0, 1)
        top[seg] = yt + 2 - hc * np.sqrt(q) - rngc.uniform(0, 6) * np.sqrt(q) + hwl * .55 * (1 - np.sqrt(1 - u_ * u_)) * np.sqrt(q) + (1 - np.sqrt(q)) * 6
        x += w
    m = np.clip(Yc0 - top[None, :] + .5, 0, 1) * (Yc0 < yt + 12) * ((xx >= rn[0]) & (xx <= rn[-1]))[None, :]
    for y in range(max(0, int(top[np.isfinite(top)].min()) - 1), yt + 12):
        sy = min(H - 1, 2 * (yt + 12) - y); k_ = np.clip((yt + 12 - y) / 10, 0, 1)   # en dessous du raccord : la case telle quelle
        src = new[sy].copy(); src[:, 3] = np.minimum(src[:, 3] * 0 + 255, 255) * m[y]
        if y < yt: new[y] = src
        else: new[y, :, :3] = new[y, :, :3] * (1 - k_ * m[y][:, None]) + src[:, :3] * k_ * m[y][:, None]; new[y, :, 3] = np.maximum(new[y, :, 3] * (1 - k_), src[:, 3] * k_) if False else np.where(m[y] > 0, np.maximum(new[y, :, 3], src[:, 3]), new[y, :, 3])
    # ombre douce le long du bord du dôme (relief des boucles)
    sh_ = np.clip(1 - (Yc0 - top[None, :]) / 6, 0, 1) * (m > 0)
    new[:, :, :3] *= (1 - .3 * sh_[:, :, None])
inC = np.clip(np.minimum.reduce([(UU - fu0) * r, (fu1 - UU) * r, (fv1 - VV) * r]) / 10, 0, 1)
out = new * inC[:, :, None] + O * (1 - inC[:, :, None])
# bas (coupé par la carte) : pointes de boucles arrondies
rng = np.random.default_rng(3); al = out[:, :, 3] > 128
bot = np.array([np.where(al[:, x])[0].max() if al[:, x].any() else -1 for x in range(W)], float)
cols = bot > H - 12; yb = np.full(W, H + 5.); x = 0
while x < W:
    if not cols[x]: x += 1; continue
    w = int(rng.integers(22, 32)); hw = w / 2; c = x + hw + rng.choice([-1, 1]) * .18 * hw; L = rng.uniform(4, 14)
    seg = np.arange(x, min(W, x + w)); seg = seg[cols[seg]]
    u = np.clip((seg + .5 - c) / np.where(seg + .5 < c, max(c - x, 1), max(x + w - c, 1)), -1, 1)
    yb[seg] = (H - 4) - L - hw * .95 * (1 - np.sqrt(1 - u * u)); x += w
Yc = np.arange(H)[:, None] + .5
out[:, :, 3] *= np.where(Yc > H - 60, np.clip(yb[None, :] - Yc + .5, 0, 1), 1)
out[:, :, :3] *= (1 - .25 * np.clip(1 - (yb[None, :] - Yc) / 7, 0, 1) * (Yc > H - 60))[:, :, None]
# petits bouts et points clairs du contour, raccord du haut
m0 = (out[:, :, 3] > 128).astype(np.uint8)
m1 = cv2.morphologyEx(cv2.morphologyEx(m0, cv2.MORPH_OPEN, cv2.getStructuringElement(cv2.MORPH_ELLIPSE, (7, 7))), cv2.MORPH_CLOSE, cv2.getStructuringElement(cv2.MORPH_ELLIPSE, (5, 5)))
zt = (VV < fv0 + 30) & domez[None, :]   # seulement les dômes ajoutés (les boucles du haut dessinées restent telles quelles)
s1 = cv2.GaussianBlur((cv2.GaussianBlur(m1.astype(float), (0, 0), 2) > .5).astype(float), (0, 0), .8) * 255
out[:, :, 3] = np.where(zt, s1, out[:, :, 3])
if DROIT:
    # trous des boucles d'oreilles de la planche (étoiles retirées) : bouchés avec la texture des tresses autour
    hm = cv2.morphologyEx((out[:, :, 3] > 128).astype(np.uint8), cv2.MORPH_CLOSE, cv2.getStructuringElement(cv2.MORPH_ELLIPSE, (25, 25))).astype(bool)
    ez = (VV > 222) & (VV < 300) & (np.abs(np.abs(UU - 200) - 98) < 30)
    hole = ez & hm & (out[:, :, 3] < 230)
    hole |= ez & hm & ((out[:, :, :3] @ [.299, .587, .114]) > 95)
    hole = cv2.dilate(hole.astype(np.uint8), np.ones((5, 5), np.uint8)).astype(bool) & hm
    out[:, :, :3] = np.where(hole[:, :, None], cv2.inpaint(out[:, :, :3].clip(0, 255).astype(np.uint8), hole.astype(np.uint8), 7, cv2.INPAINT_TELEA), out[:, :, :3]); out[hole, 3] = 255
    # les tresses continuent derrière le dos (comme sur la planche) : texture recopiée vers le bas, pointes arrondies
    al3 = out[:, :, 3] > 128; vb = 372; yb0 = int(np.argmin(np.abs(V - vb)))
    colsb = np.where(al3[yb0 - 6] & (np.abs(U - 200) > 50))[0]
    yend = int(np.argmin(np.abs(V - 465))); Pp = int(50 * r); rng2 = np.random.default_rng(5)
    tipy = {}
    for x in colsb:
        for y in range(yb0 - 6, H):
            sy = y
            while sy >= yb0 - 6: sy -= Pp
            out[y, x] = out[sy, x]
    # bas : chaque tresse finit en pointe arrondie (largeur ~ une tresse)
    if len(colsb):
        runs2 = np.split(colsb, np.where(np.diff(colsb) > 1)[0] + 1); Yc2 = np.arange(H) + .5
        for rn in runs2:
            x = rn[0]
            while x <= rn[-1]:
                w = int(rng2.integers(int(9 * r), int(13 * r))); seg = np.arange(x, min(rn[-1] + 1, x + w)); hw = max(len(seg) / 2, 1); c_ = x + hw
                u_ = np.clip((seg + .5 - c_) / hw, -1, 1); ye = yend - rng2.uniform(0, 14 * r) - hw * 1.2 * (1 - np.sqrt(1 - u_ * u_))
                for i_, xx_ in enumerate(seg): out[:, xx_, 3] *= np.where(Yc2 > yb0, np.clip(ye[i_] - Yc2 + .5, 0, 1), 1)
                x += w
# miettes détachées (hors baby hair) : retirées
nl_, lb2, st2, _ = cv2.connectedComponentsWithStats((out[:, :, 3] > 40).astype(np.uint8), connectivity=8)
crumbs = np.isin(lb2, [i for i in range(1, nl_) if st2[i, 4] < 300 and not bh[st2[i, 1] + st2[i, 3] // 2, st2[i, 0] + st2[i, 2] // 2]])
out[cv2.dilate(crumbs.astype(np.uint8), np.ones((3, 3), np.uint8)).astype(bool), 3] = 0
fr = out.copy()
fr[:, :, 3] *= 1 - cv2.GaussianBlur(((VV > 228) & (VV < 285) & (np.abs(np.abs(UU - 200) - 96) < 20)).astype(np.float32), (0, 0), 3) * (lum > 150)   # devant : seulement les boucles d'oreilles de la planche (le jeu dessine les siennes) ; les cheveux sur les épaules restent devant   # devant : rien sur les boucles d'oreilles (le jeu dessine les siennes)
bij = cv2.dilate(((lum > 200) & (VV > 200) & (VV < 300) & (np.abs(np.abs(UU - 200) - 95) < 25)).astype(np.uint8), cv2.getStructuringElement(cv2.MORPH_ELLIPSE, (13, 13))).astype(bool)
fr[bij, 3] = 0
if DROIT:   # devant : rien sur le visage du jeu sous les oreilles (les tresses passent derrière la mâchoire, sans liseré)
    GV_ = [228, 240, 250, 260, 270, 280, 290, 300, 310, 315, 400]; GW_ = [92, 88, 84.5, 80, 75, 68.6, 60.4, 49, 35, 27, 27]
    gwv = np.interp(VV, GV_, GW_); fr[:, :, 3] *= np.where(VV > 232, np.clip((np.abs(UU - 200) - gwv + 1) / 2, 0, 1), 1)
    sv = np.interp(np.abs(UU - 200), [0, 30, 44, 52, 60, 76, 92, 108, 116, 124, 132], [336, 338, 342.5, 346.5, 351, 356, 360.5, 365, 368.7, 375, 382])   # haut des épaules du jeu
    fr[:, :, 3] *= np.clip((sv - VV) / 1.5, 0, 1)   # sur les épaules : les tresses passent derrière le dos (image de derrière), en suivant la ligne des épaules
Image.fromarray(fr.clip(0, 255).astype(np.uint8)).save(P(hid))
# derrière le corps : la masse est élargie de quelques pixels vers le visage et le cou (aucun liseré de fond entre les deux)
dos = out.copy(); m_ = (dos[:, :, 3] > 128).astype(np.uint8)
grow = (cv2.dilate(m_, cv2.getStructuringElement(cv2.MORPH_ELLIPSE, (15, 15))) > 0) & (m_ == 0) & (VV > 120) & ~(DROIT & (VV > 232)) & (not ATTACHE)
dos[:, :, :3] = np.where(grow[:, :, None], cv2.inpaint(dos[:, :, :3].clip(0, 255).astype(np.uint8), grow.astype(np.uint8), 7, cv2.INPAINT_TELEA), dos[:, :, :3])
fx_ = np.abs(UU - 200) < 125   # seulement vers l'intérieur (cou, épaules), pas vers l'extérieur de la coiffure
skd = cv2.dilate(skin.astype(np.uint8), np.ones((9, 9), np.uint8)).astype(bool)
dos[:, :, 3] = np.where(grow & fx_ & skd, 255, dos[:, :, 3])
# derrière le visage, le cou et les épaules (quelle que soit la forme du visage) : rangée remplie d'un bord à l'autre
span = np.zeros((H, W), bool)
for y in range(H):
    if V[y] < 150 or ATTACHE or DROIT and 232 < V[y] < 268: continue   # tresses : derrière la mâchoire, la rangée est déjà jointe
    xs2 = np.where(dos[y, :, 3] > 128)[0]
    if len(xs2) > 1 and U[xs2.min()] < 150 and U[xs2.max()] > 250: span[y, xs2.min():xs2.max() + 1] = True
fill = span & (dos[:, :, 3] < 250)
dos[:, :, :3] = np.where(fill[:, :, None], cv2.inpaint(dos[:, :, :3].clip(0, 255).astype(np.uint8), fill.astype(np.uint8), 9, cv2.INPAINT_TELEA), dos[:, :, :3])
dos[fill, 3] = 255   # là où la capture montre la peau (le corps passe devant)
if DROIT:   # derrière le cou : cheveux dans l'ombre (plus foncés), sans motif recopié
    dk = np.percentile((dos[dos[:, :, 3] > 250][:, :3] @ [.299, .587, .114]), 15); dc = np.median(dos[(dos[:, :, 3] > 250) & ((dos[:, :, :3] @ [.299, .587, .114]) <= dk)][:, :3], 0)
    nf = fill & (VV >= 268); dos[nf, :3] = dc
if DROIT:   # derrière : chaque rangée de tresses rejoint la mâchoire du jeu (pas de liseré de fond entre les deux)
    GV_ = [228, 240, 250, 260, 270, 280, 290, 300, 310, 315, 400]; GW_ = [92, 88, 84.5, 80, 75, 68.6, 60.4, 49, 35, 27, 27]
    gap = np.zeros((H, W), bool)
    for y in range(H):
        if not 238 < V[y] < 312: continue
        gw_ = np.interp(V[y], GV_, GW_)
        for sgn in (-1, 1):
            xs3 = np.where((dos[y, :, 3] > 200) & (np.sign(U - 200) == sgn) & (np.abs(U - 200) < gw_ + 25))[0]
            if not len(xs3): continue
            inner = xs3.max() if sgn < 0 else xs3.min()
            lim = np.argmin(np.abs(U - (200 + sgn * (gw_ - 6))))
            a_, b_ = sorted((inner, lim)); gap[y, a_:b_ + 1] = True
    gap &= dos[:, :, 3] < 200
    dos[:, :, :3] = np.where(gap[:, :, None], cv2.inpaint(dos[:, :, :3].clip(0, 255).astype(np.uint8), gap.astype(np.uint8), 5, cv2.INPAINT_TELEA), dos[:, :, :3]); dos[gap, 3] = 255
if DROIT:   # sous les oreilles : rien de clair (bord de la peau de la planche), seulement les tresses
    dl = dos[:, :, :3] @ [.299, .587, .114]; dos[:, :, 3] *= np.where((VV > 232) & (dl > 70), np.clip((110 - dl) / 40, 0, 1), 1)
eb = (VV > 222) & (VV < 292) & (np.abs(np.abs(UU - 200) - 98) < 26) & ((dos[:, :, :3] @ [.299, .587, .114]) > 120)   # boucles d'oreilles de la planche
dos[cv2.dilate(eb.astype(np.uint8), np.ones((5, 5), np.uint8)).astype(bool), 3] = 0
Image.fromarray(dos.clip(0, 255).astype(np.uint8)).save(P(hid + '-dos'))
# peau du crâne (raie, entre les mèches au-dessus du front) : teinte de la peau dessinée d'origine, reteinte par le jeu
FT = json.load(open('tools/front-visages.json')); topf = np.interp(UU, [p[0] for p in FT], [p[1] for p in FT], left=-999, right=-999)
dark = (out[:, :, 3] > 128).astype(np.uint8)
cs_, _ = cv2.findContours(cv2.morphologyEx(dark, cv2.MORPH_CLOSE, np.ones((9, 9), np.uint8)), cv2.RETR_EXTERNAL, cv2.CHAIN_APPROX_NONE)
inside = np.zeros_like(dark); cv2.drawContours(inside, [c for c in cs_ if cv2.contourArea(c) > 2000], -1, 1, -1)
inside = cv2.erode(inside, cv2.getStructuringElement(cv2.MORPH_ELLIPSE, (15, 15)))   # jamais au bord de la masse
scalp = (inside > 0) & (VV < topf + 1) & (np.abs(UU - 200) < 110) & (VV > fv0 + 8)
# raccord front / cheveux (le visage de la planche est plus court que celui du jeu) : bande de peau sous la ligne des cheveux
above = np.maximum.accumulate(dark, axis=0) > 0
scalp |= above & (np.abs(UU - 200) < 80) & (VV < topf + 10) & (VV > fv0 + 8)
pc = np.array([150, 90, 60.])
if os.path.exists(P(hid + '-peau')):
    q = np.array(Image.open(P(hid + '-peau')).convert('RGBA')); m_ = q[:, :, 3] > 200
    if m_.any(): pc = np.median(q[m_][:, :3], 0)
pe = np.zeros((H, W, 4)); pe[:, :, :3] = pc; pe[:, :, 3] = cv2.GaussianBlur(scalp.astype(float), (0, 0), 1) * 255
Image.fromarray(pe.astype(np.uint8)).save(P(hid + '-peau'))
pe[:, :, 3] = 0; Image.fromarray(pe.astype(np.uint8)).save(P(hid + '-dos-peau'))
js = re.sub(r'("' + hid + r'":\{"img":)\[[^\]]*\]', lambda m_: m_.group(1) + json.dumps([round(nu0, 2), round(nv0, 2), round(W / r, 2), round(H / r, 2)]).replace(' ', ''), js, count=1)
open('js/coiffures-art.js', 'w').write(js)
print(hid, ': repris de', cap, (W, H), [round(nu0, 1), round(nv0, 1), round(W / r, 1), round(H / r, 1)])
