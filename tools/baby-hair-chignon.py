"""Baby hairs du « Chignon haut bouclé » (bchignonhaut, repris de la capture de Prescillia) posés sur une autre coiffure :
   sur le visage (sous le haut du front le plus bas des visages du jeu, tools/front-visages.json), les mèches de la
   coiffure sont retirées et remplacées par celles du chignon, au même endroit du repère de tête.
   À lancer une seule fois sur l'image d'origine.  Usage : python3 tools/baby-hair-chignon.py <coiffure> [marge=4]"""
import sys, os, re, json, numpy as np, cv2
from PIL import Image
R = os.path.join(os.path.dirname(os.path.abspath(__file__)), '..'); os.chdir(R)
hid = sys.argv[1]; MG = float(sys.argv[2]) if len(sys.argv) > 2 else 4
P = lambda f: 'assets/coiffures/' + f + '.png'
js = open('js/coiffures-art.js').read()
box = lambda h: json.loads(re.search(r'"' + h + r'":\{"img":(\[[^\]]*\])', js).group(1))
sx, sy, sw, sh = box('bchignonhaut'); S = np.array(Image.open(P('bchignonhaut')).convert('RGBA')).astype(np.float32)
ix, iy, iw, ih = box(hid); d = np.array(Image.open(P(hid)).convert('RGBA')).astype(np.float32); H, W = d.shape[:2]
U = ix + (np.arange(W) + .5) * iw / W; V = iy + (np.arange(H) + .5) * ih / H; UU, VV = np.meshgrid(U, V)
FT = json.load(open('tools/front-visages.json')); top = np.interp(UU, [p[0] for p in FT], [p[1] for p in FT], left=-999, right=-999)
# zone des baby hairs : sur le front et les tempes, sous la ligne du front (au-dessus des sourcils et des oreilles)
zone = (VV > top + MG) & (VV < 222) & (np.abs(UU - 200) < 108) & (top > -900)
soft = cv2.GaussianBlur(zone.astype(np.float32), (0, 0), 7)
zone2 = (VV > top + MG) & (VV < 222) & (np.abs(UU - 200) < 104) & (top > -900)   # là, les mèches de la coiffure s'effacent
soft2 = cv2.GaussianBlur(zone2.astype(np.float32), (0, 0), 7)
X = ((UU - sx) / sw * S.shape[1] - .5).astype(np.float32); Y = ((VV - sy) / sh * S.shape[0] - .5).astype(np.float32)
Sp = S.copy(); Sp[:, :, :3] *= S[:, :, 3:] / 255   # couleurs prémultipliées : pas de liseré noir au bord des mèches
B = cv2.remap(Sp, X, Y, cv2.INTER_LINEAR, borderMode=cv2.BORDER_CONSTANT, borderValue=0)
B[:, :, :3] /= np.maximum(B[:, :, 3:] / 255, 1e-3)
# couleur : celle de la coiffure (clarté relative du chignon appliquée à la teinte foncée de la coiffure)
op = d[:, :, 3] > 230; lum = d[:, :, :3] @ [.299, .587, .114]
g = np.median(d[op & (lum < np.percentile(lum[op], 40))][:, :3], 0) if op.any() else np.array([30, 20, 14.])
gs = np.median(S[(S[:, :, 3] > 230)][:, :3], 0)
# couleur : même clarté que le chignon, prise sur la gamme de couleurs de la coiffure (du plus foncé au plus clair)
Bl = B[:, :, :3] @ [.299, .587, .114]
cl = lum[op]; cc = d[op][:, :3]; o = np.argsort(cl); cl, cc = cl[o], cc[o]
qs = np.linspace(0, 1, 33); Lq = np.quantile(cl, qs); Cq = np.array([np.median(cc[int(a * (len(cc) - 1)):max(int(a * (len(cc) - 1)) + 1, int(b * (len(cc) - 1)))], 0) for a, b in zip(qs[:-1], qs[1:])])
Ls = np.quantile(S[S[:, :, 3] > 230][:, :3] @ [.299, .587, .114], qs)   # clarté du chignon -> rang -> couleur de la coiffure
Cq = Cq[np.argsort(Cq @ [.299, .587, .114])]   # gamme rangée du plus foncé au plus clair
Cq = cv2.GaussianBlur(Cq.reshape(-1, 1, 3).astype(np.float32), (1, 0), sigmaX=0, sigmaY=1.5).reshape(-1, 3)
rank = np.minimum(np.interp(Bl, Ls, qs), .7) * 31   # jamais les reflets les plus clairs (gris) de la coiffure
Bc = np.stack([np.interp(rank, np.arange(32), Cq[:, c]) for c in range(3)], -1)
new = d.copy()
ba = B[:, :, 3] * soft
da = d[:, :, 3] / 255 * (1 - soft2); bb = ba / 255   # « par-dessus » : les mèches du chignon sur ce qui reste de la coiffure
na = bb + da * (1 - bb)
new[:, :, 3] = na * 255
w_ = np.where(na > 0, bb / np.maximum(na, 1e-3), 0).clip(0, 1)[:, :, None]
new[:, :, :3] = d[:, :, :3] * (1 - w_) + Bc * w_
Image.fromarray(new.clip(0, 255).astype(np.uint8)).save(P(hid))
for s in ('-peau',):   # peau du crâne de la coiffure : rien sur le front (c'est le visage du jeu)
    if os.path.exists(P(hid + s)):
        q = np.array(Image.open(P(hid + s)).convert('RGBA')).astype(np.float32)
        if q.shape[:2] == (H, W): q[:, :, 3] *= (1 - soft2); Image.fromarray(q.clip(0, 255).astype(np.uint8)).save(P(hid + s))
print(hid, ': baby hairs du chignon haut bouclé')
