"""Coiffure longue reprise pixel par pixel d'une capture corrigée par Prescillia (atelier, vue Portrait, carte jaune).
   La capture est recalée sur le jeu par les yeux ; une nouvelle image (devant = derrière) couvre toute la carte :
   chaque pixel vient de la capture, la transparence est retrouvée par rapport au fond local (jaune ou peau) ;
   hors de la carte (au-dessus, en dessous) on garde l'image d'origine, et le bas finit en pointes de boucles.
   Usage : python3 tools/coiffure-capture-longue.py <coiffure> <capture> <x0 y0 s lx ly>  <carte: X0 Y0 X1 Y1>
     (x0,y0) coin du patch des yeux dans la capture, s échelle, (lx,ly) position dans le rendu 690 px du jeu
     (matrice de la tête dans ce rendu : x = 1.58125·u + 44.75, y = 1.58125·v + 34.95)."""
import sys, os, re, json, numpy as np, cv2
from PIL import Image
R = os.path.join(os.path.dirname(os.path.abspath(__file__)), '..'); os.chdir(R)
hid, cap = sys.argv[1], sys.argv[2]; x0, y0, s, lx, ly, X0, Y0, X1, Y1 = map(float, sys.argv[3:12])
CA, CE, CF = 1.58125, 44.75, 34.95
P = lambda f: 'assets/coiffures/' + f + '.png'
js = open('js/coiffures-art.js').read(); ix, iy, iw, ih = json.loads(re.search(r'"' + hid + r'":\{"img":(\[[^\]]*\])', js).group(1))
old = np.array(Image.open(P(hid)).convert('RGBA')).astype(np.float32); oH, oW = old.shape[:2]; r = oW / iw   # px par unité
ref = cv2.imread(cap)[:, :, ::-1].astype(np.float32)
cap2u = lambda X: ((X - x0) * s + lx - CE) / CA
cap2v = lambda Y: ((Y - y0) * s + ly - CF) / CA
fu0, fu1, fv0, fv1 = cap2u(X0 + 10), cap2u(X1 - 10), cap2v(Y0 + 6), cap2v(Y1 - 6)   # carte (sans les coins arrondis)
nu0, nu1 = min(ix, fu0), max(ix + iw, fu1); nv0, nv1 = min(iy, fv0), max(iy + ih, fv1) + 4
W, H = int(round((nu1 - nu0) * r)), int(round((nv1 - nv0) * r))
U = nu0 + (np.arange(W) + .5) / r; V = nv0 + (np.arange(H) + .5) / r; UU, VV = np.meshgrid(U, V)
X = (((CA * UU + CE) - lx) / s + x0).astype(np.float32); Y = (((CA * VV + CF) - ly) / s + y0).astype(np.float32)
C = cv2.remap(ref, X, Y, cv2.INTER_CUBIC, borderMode=cv2.BORDER_REPLICATE).clip(0, 255)
O = cv2.remap(old, ((UU - ix) * r - .5).astype(np.float32), ((VV - iy) * r - .5).astype(np.float32), cv2.INTER_LINEAR, borderMode=cv2.BORDER_CONSTANT, borderValue=0)
lum = C @ [.299, .587, .114]
# fond local : pixels nettement « fond » (jaune de la carte, peau du visage/cou/épaules, blanc des boucles d'oreilles)
yel = np.linalg.norm(C - [254, 242, 191], axis=2) < 40
skin = ((C[:, :, 0] - C[:, :, 2]) > 70) & (lum > 120)
clear = yel | skin | (lum > 200)
bg = cv2.inpaint(C.astype(np.uint8), (~clear).astype(np.uint8), 9, cv2.INPAINT_TELEA).astype(np.float32)
bg = cv2.GaussianBlur(bg, (0, 0), 3)
Hc = np.array([28, 18, 12.], np.float32)
v_ = Hc[None, None] - bg
a = np.clip(((C - bg) * v_).sum(-1) / np.maximum((v_ * v_).sum(-1), 1), 0, 1)
hard = cv2.erode((a > .55).astype(np.uint8), np.ones((5, 5), np.uint8)).astype(bool)
a = np.where(hard, 1, a); a[a < .1] = 0
face_in = (((UU - 200) / 96) ** 2 + ((VV - 205) / 120) ** 2 < 1)
a[(face_in & (lum > 70)) | (face_in & (np.abs(UU - 200) < 78) & (VV > 150))] = 0   # visage (yeux, sourcils, bouche) : jamais des cheveux
# bord du visage, du cou et des épaules, bijoux : les pixels clairs ou couleur peau ne sont jamais des cheveux
near = cv2.dilate((skin | (lum > 215)).astype(np.uint8), np.ones((5, 5), np.uint8)).astype(bool)
a[near & (lum > 75)] = 0
# petits trous à l'intérieur de la masse (reflets clairs pris pour du fond) : bouchés
op_ = (a > .5).astype(np.uint8); n_, lb_, st_, _ = cv2.connectedComponentsWithStats(1 - op_, connectivity=4)
small = np.isin(lb_, [i for i in range(1, n_) if st_[i, 4] < 300]) & ~face_in
a[small] = 1
nl, lab, st, _ = cv2.connectedComponentsWithStats((a > .3).astype(np.uint8), connectivity=8)
keepc = [i for i in range(1, nl) if st[i, 4] > 2000]
keep = cv2.dilate(np.isin(lab, keepc).astype(np.uint8), np.ones((7, 7), np.uint8)).astype(bool)
a = np.where(keep, a, 0)
um = (C - (1 - a[:, :, None]) * bg) / np.maximum(a[:, :, None], .05)
um = np.minimum(um, np.maximum(C, Hc))
lu = um @ [.299, .587, .114]; Lmax = np.percentile(lum[hard], 97)
um = um * np.minimum(1, Lmax / np.maximum(lu, 1))[:, :, None]
col = np.where(hard[:, :, None], C, um)
smd = cv2.dilate(small.astype(np.uint8), np.ones((5, 5), np.uint8)).astype(bool)   # trous bouchés : couleur des cheveux autour
col = np.where(smd[:, :, None], cv2.inpaint(col.clip(0, 255).astype(np.uint8), smd.astype(np.uint8), 5, cv2.INPAINT_TELEA), col); a[smd] = 1
new = np.dstack([col, a * 255])
if os.environ.get('DBG'): Image.fromarray(C.astype(np.uint8)).save('/tmp/claude-0/-home-claude/188c02e2-7576-5cbc-a5dc-25186038a661/scratchpad/ds/dbgC.png'); Image.fromarray((a*255).astype(np.uint8)).save('/tmp/claude-0/-home-claude/188c02e2-7576-5cbc-a5dc-25186038a661/scratchpad/ds/dbgA.png')
# carte -> image d'origine (au-dessus et en dessous), fondu sur 10 px
inC = np.clip(np.minimum.reduce([(UU - fu0) * r, (fu1 - UU) * r, (VV - fv0) * r, (fv1 - VV) * r]) / 10, 0, 1)
top = VV < fv0 + 8   # au-dessus de la carte : contour d'origine limité à la largeur vue dans la capture
row = int((fv0 - nv0) * r) + 14; xs_ = np.where(new[min(row, H - 1), :, 3] > 128)[0]
if len(xs_):
    lim = np.clip(np.minimum(np.arange(W) - xs_.min() + 3, xs_.max() + 3 - np.arange(W)) / 3, 0, 1)
    O[:, :, 3] *= np.where(top, lim[None, :], 1)
O[(VV > fv1 - 2), 3] = 0   # en dessous : pas de reste de l'ancienne image
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
zt = (VV < fv0 + 30)
s1 = cv2.GaussianBlur((cv2.GaussianBlur(m1.astype(float), (0, 0), 2) > .5).astype(float), (0, 0), .8) * 255
out[:, :, 3] = np.where(zt, s1, out[:, :, 3])
fr = out.copy()   # devant : rien sur les boucles d'oreilles (le jeu dessine les siennes)
bij = cv2.dilate(((lum > 200) & (VV > 200) & (VV < 300) & (np.abs(np.abs(UU - 200) - 95) < 25)).astype(np.uint8), cv2.getStructuringElement(cv2.MORPH_ELLIPSE, (13, 13))).astype(bool)
fr[bij, 3] = 0
Image.fromarray(fr.clip(0, 255).astype(np.uint8)).save(P(hid))
# derrière le corps : la masse est élargie de quelques pixels vers le visage et le cou (aucun liseré de fond entre les deux)
dos = out.copy(); m_ = (dos[:, :, 3] > 128).astype(np.uint8)
grow = (cv2.dilate(m_, cv2.getStructuringElement(cv2.MORPH_ELLIPSE, (15, 15))) > 0) & (m_ == 0) & (VV > 120)
dos[:, :, :3] = np.where(grow[:, :, None], cv2.inpaint(dos[:, :, :3].clip(0, 255).astype(np.uint8), grow.astype(np.uint8), 7, cv2.INPAINT_TELEA), dos[:, :, :3])
fx_ = np.abs(UU - 200) < 125   # seulement vers l'intérieur (cou, épaules), pas vers l'extérieur de la coiffure
skd = cv2.dilate(skin.astype(np.uint8), np.ones((9, 9), np.uint8)).astype(bool)
dos[:, :, 3] = np.where(grow & fx_ & skd, 255, dos[:, :, 3])
# derrière le visage, le cou et les épaules (quelle que soit la forme du visage) : rangée remplie d'un bord à l'autre
span = np.zeros((H, W), bool)
for y in range(H):
    if V[y] < 150: continue
    xs2 = np.where(dos[y, :, 3] > 128)[0]
    if len(xs2) > 1 and U[xs2.min()] < 150 and U[xs2.max()] > 250: span[y, xs2.min():xs2.max() + 1] = True
fill = span & (dos[:, :, 3] < 250)
dos[:, :, :3] = np.where(fill[:, :, None], cv2.inpaint(dos[:, :, :3].clip(0, 255).astype(np.uint8), fill.astype(np.uint8), 9, cv2.INPAINT_TELEA), dos[:, :, :3])
dos[fill, 3] = 255   # là où la capture montre la peau (le corps passe devant)
Image.fromarray(dos.clip(0, 255).astype(np.uint8)).save(P(hid + '-dos'))
# peau du crâne (raie, entre les mèches au-dessus du front) : teinte de la peau dessinée d'origine, reteinte par le jeu
FT = json.load(open('tools/front-visages.json')); topf = np.interp(UU, [p[0] for p in FT], [p[1] for p in FT], left=-999, right=-999)
dark = (out[:, :, 3] > 128).astype(np.uint8)
cs_, _ = cv2.findContours(cv2.morphologyEx(dark, cv2.MORPH_CLOSE, np.ones((9, 9), np.uint8)), cv2.RETR_EXTERNAL, cv2.CHAIN_APPROX_NONE)
inside = np.zeros_like(dark); cv2.drawContours(inside, [c for c in cs_ if cv2.contourArea(c) > 2000], -1, 1, -1)
scalp = (inside > 0) & (VV < topf + 12) & (VV > 0) & (np.abs(UU - 200) < 110)
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
