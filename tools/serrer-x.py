"""Coiffure resserrée en largeur (toutes ses images) autour de l'axe du visage, sans changer la hauteur :
   la partie plaquée colle au crâne du jeu. À relancer ensuite : baby-hair-chignon.py puis crane-coiffure.py.
   Usage : python3 tools/serrer-x.py <coiffure> <facteur, ex. 0.85>"""
import sys, os, re, json, numpy as np, cv2
from PIL import Image
R = os.path.join(os.path.dirname(os.path.abspath(__file__)), '..'); os.chdir(R)
hid, f = sys.argv[1], float(sys.argv[2])
P = lambda s: 'assets/coiffures/' + hid + s + '.png'
js = open('js/coiffures-art.js').read(); m = re.search(r'("' + hid + r'":\{"img":)(\[[^\]]*\])', js); ix, iy, iw, ih = json.loads(m.group(2))
# même image, boîte resserrée : x' = 200 + (x - 200)·f
nx, nw = 200 + (ix - 200) * f, iw * f
js = js[:m.start(2)] + json.dumps([round(nx, 2), iy, round(nw, 2), ih]).replace(' ', '') + js[m.end(2):]
open('js/coiffures-art.js', 'w').write(js)
print(hid, ': largeur ×', f)
