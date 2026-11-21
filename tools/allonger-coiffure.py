"""Coiffure longue coupée net au-dessus des épaules (sur la planche, les épaules cachaient le bas) :
   python3 tools/allonger-coiffure.py <coiffure> <y_debut_lissage> [lignes_en_plus=120]
   - derrière (-dos) : les mèches continuent vers le bas (copie verticale, les cheveux tombent droit) ;
   - devant : le bas s'efface doucement, la suite passe derrière les épaules ;
   - bords extérieurs gauche et droit lisses (courbes ajustées sur le dessin) ;
   - met à jour la hauteur de l'image dans js/coiffures-art.js."""
import sys, re, numpy as np
from PIL import Image
D = 'assets/coiffures/'
name, Y0 = sys.argv[1], int(sys.argv[2]); E = int(sys.argv[3]) if len(sys.argv) > 3 else 120
load = lambda f: np.array(Image.open(D + f + '.png').convert('RGBA')).astype(float)
dos, fr = load(name + '-dos'), load(name); H, W = dos.shape[:2]
pad = lambda a: np.concatenate([a, np.zeros((E, W, 4))], 0)
dos, fr = pad(dos), pad(fr)
src = H - 15
for y in range(src + 1, H + E): dos[y] = np.where((dos[src, :, 3:] > 200), dos[src], dos[y]) if y >= H else np.where(dos[y, :, 3:] > 200, dos[y], dos[src])
ys, lo, hi = [], [], []
for y in range(Y0, src):
    xs = np.where(dos[y, :, 3] > 160)[0]
    if len(xs): ys.append(y); lo.append(xs.min()); hi.append(xs.max())
cl, cr = np.polyfit(ys, lo, 2), np.polyfit(ys, hi, 2); xs = np.arange(W)
def clip(img):
    for y in range(Y0, H + E):
        L, R = np.polyval(cl, y), np.polyval(cr, y)
        al = np.clip(np.minimum(xs - L + .5, R - xs + .5), 0, 1); row = img[y]
        for x in np.where((al > .5) & (row[:, 3] < 200) & ((xs < L + 25) | (xs > R - 25)))[0]:
            j = np.where(row[:, 3] > 200)[0]
            if len(j): k = j[np.argmin(abs(j - x))]; 
            if len(j) and abs(k - x) < 25: row[x, :3] = row[k, :3]; row[x, 3] = 255
        row[:, 3] = np.minimum(row[:, 3], al * 255)
    return img
dos = clip(dos); fr = clip(fr)
for y in range(H - 70, H + E): fr[y, :, 3] *= np.clip((H - 10 - y) / 60, 0, 1)
Image.fromarray(dos.clip(0, 255).astype(np.uint8)).save(D + name + '-dos.png', optimize=True)
Image.fromarray(fr.clip(0, 255).astype(np.uint8)).save(D + name + '.png', optimize=True)
for p in ('-peau', '-dos-peau'):
    try:
        a = load(name + p); Image.fromarray(np.concatenate([a, np.zeros((E, W, 4))], 0).astype(np.uint8)).save(D + name + p + '.png', optimize=True)
    except FileNotFoundError: pass
art = open('js/coiffures-art.js').read()
m = re.search(r'"%s":\{"img":\[([-\d.]+),([-\d.]+),([-\d.]+),([-\d.]+)\]' % re.escape(name), art)
nh = round(float(m.group(4)) * (H + E) / H, 2)
art = art.replace(m.group(0), m.group(0)[:m.group(0).rindex(m.group(4))] + str(nh) + ']'); open('js/coiffures-art.js', 'w').write(art)
print('ok', name, H, '->', H + E)
