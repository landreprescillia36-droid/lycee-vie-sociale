"""Copies WebP (2 à 10 fois plus légères) de toutes les images du jeu : assets/**/*.png et *.jpg → même nom en .webp.
   Le service worker (sw.js) sert la version .webp à la place du .png / .jpg demandé ; sans service worker
   (fichier ouvert en local, premier chargement), le jeu prend l'original.
   À relancer après chaque nouvelle image ou chaque traceur :  python3 tools/webp.py"""
import os, sys
from PIL import Image
R = os.path.join(os.path.dirname(os.path.abspath(__file__)), '..', 'assets')
n = av = ap = 0
for d, _, fs in os.walk(R):
    for f in fs:
        if not f.lower().endswith(('.png', '.jpg')) or f == 'logo.png': continue
        src = os.path.join(d, f); dst = os.path.splitext(src)[0] + '.webp'
        if os.path.exists(dst) and os.path.getmtime(dst) >= os.path.getmtime(src) and '--tout' not in sys.argv: continue
        im = Image.open(src); im.load()
        if im.mode not in ('RGB', 'RGBA'): im = im.convert('RGBA' if 'A' in im.mode or 'transparency' in im.info else 'RGB')
        im.save(dst, 'WEBP', quality=90, alpha_quality=100, method=6)
        n += 1; av += os.path.getsize(src); ap += os.path.getsize(dst)
print(f'{n} images converties : {av/1e6:.1f} Mo → {ap/1e6:.1f} Mo')

# empreintes (assets/empreintes.json) : le service worker ne garde l'ancienne copie d'une image que si elle n'a pas changé
import hashlib, json
E = {}
for d, _, fs in os.walk(R):
    for f in fs:
        if f.endswith('.webp') or f == 'logo.png':
            pth = os.path.join(d, f); E[os.path.relpath(pth, os.path.join(R, '..')).replace(os.sep, '/')] = hashlib.md5(open(pth, 'rb').read()).hexdigest()[:10]
json.dump(dict(sorted(E.items())), open(os.path.join(R, 'empreintes.json'), 'w'), separators=(',', ':'))
