"""Sépare la peau du crâne dessinée dans les coiffures (filles : lisses, bouclées, crépues) (raie, bords, espaces entre les tresses).
Ces pixels (teinte orangée de la peau du modèle) sont retirés de assets/coiffures/bXXX.png et enregistrés dans
assets/coiffures/bXXX-peau.png ; le jeu les recolore à la couleur de peau du personnage (skinTint).
À relancer seulement sur des images d'origine (sinon rien n'est trouvé)."""
import glob, os
import numpy as np
from PIL import Image
D = os.path.join(os.path.dirname(__file__), '..', 'assets', 'coiffures')
done = []
for f in sorted(glob.glob(os.path.join(D, '*.png'))):
    n = os.path.basename(f)[:-4]
    if n.endswith(('-acc', '-peau')) or n.startswith('g'): continue
    if os.path.exists(os.path.join(D, n + '-peau.png')): continue  # déjà séparée
    a = np.array(Image.open(f).convert('RGBA')).astype(float)
    r, g, b, al = a[..., 0], a[..., 1], a[..., 2], a[..., 3]
    w = np.clip((r - b - 28) / 24, 0, 1) * np.clip((r - 70) / 30, 0, 1) * (r > g)
    if (w * al > 60).sum() < 50: continue
    p = a.copy(); p[..., 3] = al * w
    a[..., 3] = al * (1 - w)
    Image.fromarray(a.astype(np.uint8)).save(f)
    Image.fromarray(p.astype(np.uint8)).save(os.path.join(D, n + '-peau.png'))
    done.append(n)
print(done)
