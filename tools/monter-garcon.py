"""Coiffure de garçon (planche) montée de d unités (espace sourcils / cheveux comme sur la planche) : boîte de l'image et
   forme « tete » montées, oreilles (dans l'image de peau de derrière) laissées à leur place.
   Usage : python3 tools/monter-garcon.py <coiffure> <d>"""
import sys, os, re, json, numpy as np
from PIL import Image
R = os.path.join(os.path.dirname(os.path.abspath(__file__)), '..'); os.chdir(R)
hid, dd = sys.argv[1], float(sys.argv[2]); P = lambda s: 'assets/coiffures/' + hid + s + '.png'
js = open('js/coiffures-art.js').read(); m = re.search(r'("' + hid + r'":\{"img":)(\[[^\]]*\])', js); ix, iy, iw, ih = json.loads(m.group(2))
q = np.array(Image.open(P('-dos-peau')).convert('RGBA')); H, W = q.shape[:2]
U = ix + (np.arange(W) + .5) * iw / W; V = iy + (np.arange(H) + .5) * ih / H; UU, VV = np.meshgrid(U, V)
ear = (np.abs(UU - 200) > 70) & (VV > 160)
sh = int(round(dd * H / ih)); out = q.copy(); out[ear] = 0
src = q * ear[:, :, None]; mv = np.zeros_like(q); mv[sh:] = src[:H - sh]
out = np.where(mv[:, :, 3:] > 0, mv, out)
Image.fromarray(out).save(P('-dos-peau'))
js = js[:m.start(2)] + json.dumps([ix, round(iy - dd, 2), iw, ih]).replace(' ', '') + js[m.end(2):]
blk = re.search(r'("' + hid + r'":\{)([^}]*)\}', js); body = blk.group(2)
t = re.search(r'"tete":"([^"]*)"', body)
if t:
    def mv_(mm): return '%s,%.1f' % (mm.group(1), float(mm.group(2)) - dd)
    nt = re.sub(r'(-?[\d.]+),(-?[\d.]+)', mv_, t.group(1)); body = body.replace(t.group(1), nt)
ty = re.search(r'"teteY":([\d.]+)', body)
if ty: body = body.replace(ty.group(0), '"teteY":%.1f' % (float(ty.group(1)) - dd))
js = js[:blk.start(2)] + body + js[blk.end(2):]; open('js/coiffures-art.js', 'w').write(js)
print(hid, ': montée de', dd)
