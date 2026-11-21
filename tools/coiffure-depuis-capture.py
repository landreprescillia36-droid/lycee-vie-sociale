"""Coiffure reprise pixel par pixel d'une capture corrigée par Prescillia (atelier, vue Portrait).
   La capture est recalée sur le rendu du jeu par les yeux (même visage), puis chaque pixel de l'image de la coiffure
   (repère de tête) est relevé dans la capture ; la transparence est retrouvée par rapport au fond (jaune de la carte
   ou peau). Ce que la capture ne montre pas (haut du chignon, coupé par le cadre) reste celui de l'image d'origine.
   Usage : python3 tools/coiffure-depuis-capture.py <coiffure> <capture> <x0 y0 s lx ly haut_cadre a e f>
     (x0,y0) coin du patch des yeux dans la capture, s échelle, (lx,ly) position trouvée dans le rendu 690 px du jeu,
     haut_cadre = ordonnée du haut de la carte jaune dans la capture,
     a e f = matrice écran de l'image de la coiffure dans ce rendu (getScreenCTM : x = a·u + e, y = a·v + f)."""
import sys, os, re, json, numpy as np, cv2
from PIL import Image
R = os.path.join(os.path.dirname(os.path.abspath(__file__)), '..'); os.chdir(R)
hid, cap = sys.argv[1], sys.argv[2]; x0, y0, s, lx, ly, ctop, ca, ce, cf = map(float, sys.argv[3:12])
P = lambda f: 'assets/coiffures/' + f + '.png'
js = open('js/coiffures-art.js').read(); ix, iy, iw, ih = json.loads(re.search(r'"' + hid + r'":\{"img":(\[[^\]]*\])', js).group(1))
d = np.array(Image.open(P(hid)).convert('RGBA')).astype(float)
MX = int(sys.argv[12]) if len(sys.argv) > 12 else 0   # colonnes ajoutées de chaque côté (la capture montre plus large)
kx = iw / d.shape[1]; d = np.pad(d, ((0, 0), (MX, MX), (0, 0))); ix -= MX * kx; iw += 2 * MX * kx
H, W = d.shape[:2]
ref = cv2.imread(cap)[:, :, ::-1].astype(np.float32)
U = ix + (np.arange(W) + .5) * iw / W; V = iy + (np.arange(H) + .5) * ih / H; UU, VV = np.meshgrid(U, V)
# repère de tête -> page (HT) -> rendu 690 px (PVB 80 20 240 240) -> capture
ox = ca * UU + ce; oy = ca * VV + cf
X = ((ox - lx) / s + x0).astype(np.float32); Y = ((oy - ly) / s + y0).astype(np.float32)
C = cv2.remap(ref, X, Y, cv2.INTER_CUBIC, borderMode=cv2.BORDER_REPLICATE).clip(0, 255)
Cb = np.array([254, 242, 191.]); Cs = np.median(ref[int(y0) - 25:int(y0) - 5, int(x0) + 120:int(x0) + 170].reshape(-1, 3), 0)
Hc = np.array([30, 20, 14.])
def proj(bg):
    v = Hc - bg; return np.clip(((C - bg) @ v) / (v @ v), 0, 1)
ab, as_ = proj(Cb), proj(Cs)
# fond derrière chaque pixel : la peau à l'intérieur du contour de la coiffure, le jaune de la carte à l'extérieur
dark = (np.minimum(ab, as_) > .5).astype(np.uint8)
nl, lab, st, _ = cv2.connectedComponentsWithStats(dark, connectivity=8); dark = (lab == 1 + np.argmax(st[1:, 4])).astype(np.uint8)
cs_, _ = cv2.findContours(cv2.morphologyEx(dark, cv2.MORPH_CLOSE, np.ones((9, 9), np.uint8)), cv2.RETR_EXTERNAL, cv2.CHAIN_APPROX_NONE)
inside = np.zeros_like(dark); cv2.drawContours(inside, cs_, -1, 1, -1)
face_ = (((UU - 200) / 98) ** 2 + ((VV - 196) / 124) ** 2 < 1)   # visage (et tempes) : toujours peau dessous
skin_bg = (inside > 0) | face_
a = np.where(skin_bg, as_, ab)
hard = cv2.erode((a > .55).astype(np.uint8), np.ones((5, 5), np.uint8)).astype(bool)
a = np.where(hard, 1, a); a[a < np.where(skin_bg, .12, .06)] = 0
nl, lab, st, _ = cv2.connectedComponentsWithStats((a > .3).astype(np.uint8), connectivity=8)
main_ = 1 + np.argmax(st[1:, 4]); keep = cv2.dilate((lab == main_).astype(np.uint8), np.ones((7, 7), np.uint8)).astype(bool)
a = np.where(keep, a, 0)
# couleur : le jeu reteint les cheveux d'après leur clarté, donc aucun pixel « peau » opaque ne doit rester :
# sur la peau, la couleur des cheveux est démélangée de la peau locale (transparence = mélange de la capture) ;
# au bord extérieur (fond jaune), couleur des cheveux voisins : ni liseré jaune ni contour noir
sk = (as_ < .08) & skin_bg
Cs_loc = cv2.inpaint(C.astype(np.uint8), (~sk).astype(np.uint8), 9, cv2.INPAINT_TELEA).astype(float)
Cs_loc = cv2.GaussianBlur(Cs_loc, (0, 0), 4)
v_ = Hc[None, None, :] - Cs_loc
a_s = np.clip(((C - Cs_loc) * v_).sum(-1) / (v_ * v_).sum(-1), 0, 1)
a = np.where(skin_bg & ~hard, np.where(a_s < .12, 0, a_s), a)
um = (C - (1 - a[:, :, None]) * Cs_loc) / np.maximum(a[:, :, None], .05)
um = np.minimum(um, np.maximum(C, Hc))   # jamais plus clair que la capture
lu = um @ [.299, .587, .114]; Lmax = np.percentile((C @ [.299, .587, .114])[hard], 97)
um = um * np.minimum(1, Lmax / np.maximum(lu, 1))[:, :, None]   # ni reflet plus clair que les mèches dessinées
edge = (~skin_bg) & (a < .97)
inp = cv2.inpaint(C.astype(np.uint8), (edge | (a == 0)).astype(np.uint8), 5, cv2.INPAINT_TELEA).astype(float)
col = np.where(edge[:, :, None], inp, np.where((skin_bg & ~hard)[:, :, None], um, C)).clip(0, 255)
new = np.dstack([col, a * 255])
# hors de la capture (au-dessus du cadre) : image d'origine, fondu sur 12 px
w = np.clip((Y - ctop - 4) / 12, 0, 1)[:, :, None]
# au-dessus du cadre : le contour d'origine ne dépasse pas la largeur du chignon vue dans la capture (pas de bout qui dépasse)
yy = np.argmax(w[:, :, 0] > .99, axis=0); ys = int(np.median(yy[yy > 0])) if (yy > 0).any() else 0
xs_ = np.where(new[ys + 2, :, 3] > 128)[0]
if len(xs_):
    lim = np.clip(np.minimum(np.arange(W) - xs_.min() + 3, xs_.max() + 3 - np.arange(W)) / 3, 0, 1)
    d[:, :, 3] *= np.where(np.arange(H)[:, None] < ys + 14, lim[None, :], 1)
out = new * w + d * (1 - w)
# raccord cadre / image d'origine (haut du chignon) : petits bouts et trous clairs retirés, contour lisse
zt = (VV < 40)
m0 = (out[:, :, 3] > 128).astype(np.uint8)
m1 = cv2.morphologyEx(cv2.morphologyEx(m0, cv2.MORPH_OPEN, cv2.getStructuringElement(cv2.MORPH_ELLIPSE, (11, 11))), cv2.MORPH_CLOSE, cv2.getStructuringElement(cv2.MORPH_ELLIPSE, (7, 7)))
s1 = cv2.GaussianBlur(cv2.GaussianBlur(m1.astype(float), (0, 0), 2.5) .__gt__(.5).astype(float), (0, 0), .8)
grow = zt & (s1 * 255 > out[:, :, 3] + 10)
out[grow, :3] = cv2.inpaint(out[:, :, :3].clip(0, 255).astype(np.uint8), grow.astype(np.uint8), 5, cv2.INPAINT_TELEA)[grow]
out[:, :, 3] = np.where(zt, s1 * 255, out[:, :, 3])
lum_ = out[:, :, :3] @ [.299, .587, .114]; br = zt & (lum_ > 90) & (out[:, :, 3] > 0)   # points clairs
out[br, :3] = np.median(out[(out[:, :, 3] > 250) & zt][:, :3], 0)
Image.fromarray(out.clip(0, 255).astype(np.uint8)).save(P(hid))
js = re.sub(r'("' + hid + r'":\{"img":)\[[^\]]*\]', lambda m_: m_.group(1) + json.dumps([round(ix, 2), iy, round(iw, 2), ih]).replace(' ', ''), js, count=1); open('js/coiffures-art.js', 'w').write(js)
if os.path.exists(P(hid + '-peau')):   # la peau visible entre les boucles vient maintenant du visage du jeu
    q = np.pad(np.array(Image.open(P(hid + '-peau')).convert('RGBA')).astype(float), ((0, 0), (MX, MX), (0, 0)))
    # peau du crâne : seulement là où la capture montre de la peau hors du visage du jeu (raie, entre les mèches du haut)
    sc = np.zeros_like(q); sc[:, :, :3] = np.median(q[q[:, :, 3] > 200][:, :3], 0)   # même teinte que la peau dessinée (le jeu la reteint)
    FT = json.load(open('tools/front-visages.json')); top_ = np.interp(UU, [p_[0] for p_ in FT], [p_[1] for p_ in FT], left=999, right=999)
    hors = (VV < top_ + 12) | (np.abs(UU - 200) > 92)   # au-dessus du visage le plus haut, ou sur les tempes
    sc[:, :, 3] = cv2.GaussianBlur(((inside > 0) & hors).astype(float), (0, 0), 1) * 255
    q = q * (1 - w) + sc * w
    Image.fromarray(q.clip(0, 255).astype(np.uint8)).save(P(hid + '-peau'))
print(hid, ': repris de la capture', cap)
