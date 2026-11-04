"""Bouches des garçons (docs/references/bouches/planche-bouches-garcons.jpg + bouche-nasale.jpg).
   Sur ces planches les lèvres sont très proches de la peau : on garde la zone de la bouche telle quelle (vrais pixels,
   lèvres du haut et du bas, trait, ombre), avec des bords qui se fondent progressivement dans la peau. Le jeu recolore
   la zone selon la peau du nova (rapport entre sa peau et la peau de la planche, enregistrée avec chaque bouche).
   La bouche « moyenne » des garçons prend la largeur de la bouche « moyenne » des filles, au même endroit."""
import json, os, re, numpy as np, cv2
S = 3
TILES = []
for r, (y0, y1) in enumerate([(112, 288), (332, 507)]):
    for c, (x0, x1) in enumerate([(16, 251), (265, 500), (510, 746), (759, 993), (1004, 1238)]):
        TILES.append(('docs/references/bouches/planche-bouches-garcons.jpg', x0, y0, x1, y1))
TILES.append(('docs/references/bouches/bouche-nasale.jpg', 10, 33, 241, 208))
LINE = {'gfermee': (59, 169, 74), 'gfine': (57, 175, 73), 'gmoyenne': (55, 175, 74), 'glarge': (47, 186, 65), 'gpleine': (54, 182, 66),
        'gsourirel': (44, 192, 60), 'gsourire': (40, 187, 60), 'ggrand': (41, 195, 63), 'gneutre': (49, 187, 70), 'gserieux': (59, 181, 76), 'gnasale': (65, 170, 70)}
IDS = ['gfermee', 'gfine', 'gmoyenne', 'glarge', 'gpleine', 'gsourirel', 'gsourire', 'ggrand', 'gneutre', 'gserieux', 'gnasale']
res = {}
for hid, (src, x0, y0, x1, y1) in zip(IDS, TILES):
    im = cv2.imread(src).astype(np.float32); W = x1 - x0
    t = im[y0:y1, x0:x1]; L = t.mean(2)
    # trait de la bouche (commissure gauche, commissure droite, hauteur) relevé sur la planche, dans la case
    xl, xr, cy = LINE[hid]; cx = (xl + xr) / 2
    hw = (xr - xl) / 2 + 12; up, dn = 26, 40
    X0, X1, Y0, Y1 = int(cx - hw), int(cx + hw), cy - up, cy + dn
    X0 = max(X0, 0)
    crop = t[Y0:Y1, X0:X1]
    skin = np.median(np.concatenate([crop[:3].reshape(-1, 3), crop[:, :3].reshape(-1, 3), crop[:, -3:].reshape(-1, 3)]), axis=0)
    hh, ww = crop.shape[:2]; yy, xx = np.mgrid[0:hh, 0:ww]
    ex = np.abs(xx - (cx - X0)) / hw; ey = np.where(yy < cy - Y0, (cy - Y0 - yy) / up, (yy - (cy - Y0)) / dn)
    rr = np.sqrt(ex ** 6 + ey ** 2)   # bords arrondis, les commissures restent entières
    a = np.clip((1 - rr) / .35, 0, 1) ** 1.3
    big = cv2.resize(np.dstack([crop, a * 255]), None, fx=S, fy=S, interpolation=cv2.INTER_CUBIC)
    cv2.imwrite(f'assets/bouches/{hid}.png', np.clip(big, 0, 255).astype(np.uint8), [cv2.IMWRITE_PNG_COMPRESSION, 9])
    # dents : gardées à part (pas recolorées avec la peau)
    teeth = (crop.mean(2) > skin.mean() + 45) & (a > .5)
    if teeth.sum() > 20:
        ta = cv2.GaussianBlur(teeth.astype(np.float32), (0, 0), .7)
        tb = cv2.resize(np.dstack([crop, ta * 255]), None, fx=S, fy=S, interpolation=cv2.INTER_CUBIC)
        cv2.imwrite(f'assets/bouches/{hid}-dents.png', np.clip(tb, 0, 255).astype(np.uint8), [cv2.IMWRITE_PNG_COMPRESSION, 9])
    res[hid] = dict(x=X0 - cx, y=Y0 - cy, w=ww, h=hh, mw=xr - xl, skin='#%02x%02x%02x' % (int(skin[2]), int(skin[1]), int(skin[0])))
    print(hid, res[hid])
src = open('js/bouches-art.js').read()
ART = json.loads(re.search(r'const MOUTH_ART=(\{.*?\});', src, re.S).group(1))
ART = {k: v for k, v in ART.items() if not k.startswith('g')}
gm = ART['moyenne']; K = 62 / res['gmoyenne']['mw']; cyg = gm[1] + gm[3] * .45
for hid, v in res.items():
    ART[hid] = [round(v['x'] * K, 2), round(cyg + v['y'] * K, 2), round(v['w'] * K, 2), round(v['h'] * K, 2), v['skin']]
open('js/bouches-art.js', 'w').write('/* bouches décalquées par tools/traceur-bouches.py et tools/traceur-bouches-garcons.py sur docs/references/bouches/ — ne pas modifier à la main */\nconst MOUTH_ART=' + json.dumps(ART, separators=(',', ':')) + ';\n')
