"""Cheveux longs : sur les épaules, les cheveux passent derrière (image de devant coupée sur la ligne des épaules du jeu) ;
   derrière, ils continuent jusqu'à v_fin avec la texture du bas recopiée, et finissent en pointes de boucles arrondies.
   Usage : python3 tools/longs-dos.py <coiffure> [v_fin = 440]"""
import sys, os, re, json, numpy as np, cv2
from PIL import Image
R = os.path.join(os.path.dirname(os.path.abspath(__file__)), '..'); os.chdir(R)
hid = sys.argv[1]; vend = float(sys.argv[2]) if len(sys.argv) > 2 else 440
P = lambda s: 'assets/coiffures/' + hid + s + '.png'
js = open('js/coiffures-art.js').read(); m = re.search(r'("' + hid + r'":\{"img":)(\[[^\]]*\])', js); ix, iy, iw, ih = json.loads(m.group(2))
imgs = {s: np.array(Image.open(P(s)).convert('RGBA')).astype(np.float32) for s in ('', '-dos', '-peau', '-dos-peau') if os.path.exists(P(s))}
H, W = imgs[''].shape[:2]; r = H / ih
add = max(0, int(np.ceil((vend + 4 - (iy + ih)) * r)))
for s in imgs: imgs[s] = np.pad(imgs[s], ((0, add), (0, 0), (0, 0)))
H2 = H + add; ih2 = ih + add / r
U = ix + (np.arange(W) + .5) * iw / W; V = iy + (np.arange(H2) + .5) / r; UU, VV = np.meshgrid(U, V)
du = np.abs(UU - 200)
sv = np.interp(du, [0, 30, 44, 52, 60, 76, 92, 108, 116, 124, 132, 160], [336, 338, 342.5, 346.5, 351, 356, 360.5, 365, 368.7, 375, 382, 395])   # haut des épaules
F, D = imgs[''], imgs['-dos']
F[:, :, 3] *= np.clip((sv - VV) / 1.5, 0, 1)
# derrière : bas d'origine (dernières rangées pleines) -> texture recopiée vers le bas
al = D[:, :, 3] > 128
yt0 = int((vend - 75 - iy) * r)   # zone des pointes : les 75 dernières unités
bot = np.array([np.where(al[:H, x])[0].max() if al[:H, x].any() else -1 for x in range(W)])
cols = np.where(bot > min(H - 40, yt0))[0]   # colonnes coupées par le bas de la case
Pp = int(45 * r); yb0 = H - 12; rng = np.random.default_rng(3)
for x in cols:
    for y in range(yb0, H2):
        sy = y
        while sy >= yb0: sy -= Pp
        D[y, x] = D[sy, x]
# pointes de boucles arrondies
yend = int((vend - iy) * r); Yc = np.arange(H2) + .5
if len(cols):
    for rn in np.split(cols, np.where(np.diff(cols) > 1)[0] + 1):
        x = rn[0]
        while x <= rn[-1]:
            w = int(rng.integers(int(8 * r), int(13 * r))); seg = np.arange(x, min(rn[-1] + 1, x + w)); hw = max(len(seg) / 2, 1); c_ = x + hw
            u_ = np.clip((seg + .5 - c_) / hw, -1, 1)
            # les côtés extérieurs remontent un peu (forme arrondie du bas)
            lift = 18 * r * (np.abs(U[seg] - 200) / 180) ** 2
            ye = yend - lift - rng.uniform(0, 14 * r) - hw * 1.1 * (1 - np.sqrt(1 - u_ * u_))
            for i_, xx in enumerate(seg): D[:, xx, 3] *= np.where(Yc > yt0, np.clip(ye[i_] - Yc + .5, 0, 1), 1)
            sh = np.clip(1 - (ye[:, None] - Yc[None, :]) / (6 * r), 0, 1)   # ombre au bout
            for i_, xx in enumerate(seg): D[:, xx, :3] *= (1 - .25 * sh[i_][:, None]) * (Yc[:, None] > yt0) + (Yc[:, None] <= yt0)
            x += w
for s, d in imgs.items(): Image.fromarray(d.clip(0, 255).astype(np.uint8)).save(P(s))
js = js[:m.start(2)] + json.dumps([ix, iy, iw, round(ih2, 2)]).replace(' ', '') + js[m.end(2):]
open('js/coiffures-art.js', 'w').write(js); print(hid, ': derrière les épaules, pointes jusqu\'à v =', vend)
