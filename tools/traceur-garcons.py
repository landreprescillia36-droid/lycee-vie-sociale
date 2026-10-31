"""Décalque pixel par pixel le bas du visage des garçons sur la version corrigée de Prescillia
   (docs/references/personnages/camarades-corriges.png : Kylian, Noah, Sacha), après superposition sur le rendu du jeu.
   python3 tools/traceur-garcons.py <rendu.png> <M.json>  ->  tools/garcons-machoire.json
   Le rendu (tools : rendu des 3 têtes, viewBox 92 14 216 290, 2 px par unité) et M (échelle, décalage) viennent du recalage sur les yeux."""
import sys, json, numpy as np, cv2
her = cv2.imread('docs/references/personnages/camarades-corriges.png'); M = json.load(open(sys.argv[2]))
LIFT = 9
lab = cv2.cvtColor(her, cv2.COLOR_BGR2LAB).astype(float)
g = cv2.GaussianBlur(cv2.cvtColor(her, cv2.COLOR_BGR2GRAY).astype(float), (0, 0), .8)
out = {}
for i, face in enumerate(['allonge', 'diamant', 'coeur']):
    s, ox, oy = M[i]
    toH = lambda px, py: (((px - ox) / s / 2 + 2) / .55, ((py - oy) / s / 2 + 14 - (25.2 - LIFT)) / .55)
    toP = lambda X, Y: (ox + ((90 + .55 * X) - 92) * 2 * s, oy + ((25.2 - LIFT + .55 * Y) - 14) * 2 * s)
    cx, cy = toP(200, 260); ref = lab[int(cy), int(cx) - 20:int(cx) + 20].mean(0)   # couleur de la joue
    d = np.linalg.norm(lab - ref, axis=-1); sk = (d < 22).astype(np.uint8)
    sk = cv2.morphologyEx(sk, cv2.MORPH_CLOSE, np.ones((3, 3), np.uint8))
    side = {-1: [], 1: []}
    for Y in np.arange(236, 330, 1.0):
        _, py = toP(200, Y); py = int(round(py)); c = int(round(cx))
        row = sk[py]
        if not row[c]: continue
        l = c
        while row[l - 1]: l -= 1
        r = c
        while row[r + 1]: r += 1
        # bord sous-pixel : milieu de la transition de distance de couleur
        side[-1].append((Y, toH(l - .5, 0)[0])); side[1].append((Y, toH(r + .5, 0)[0]))
    # menton : ligne d'ombre (assombrissement vers le bas) colonne par colonne, entre les bords du cou
    chin = []
    for X in np.arange(150, 251, 1.0):
        px, _ = toP(X, 0); px = int(round(px)); ya, yb = int(toP(0, 300)[1]), int(toP(0, 372)[1])
        col = g[ya:yb, px - 1:px + 2].mean(1); gy = np.gradient(col); j = int(np.argmin(gy))
        chin.append((X, toH(0, ya + j)[1], float(-gy[j])))
    out[face] = {'side': side, 'chin': chin}
json.dump(out, open('tools/garcons-machoire.json', 'w'), default=float)
print('ok')
