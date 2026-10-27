"""Décalque les chaussures de docs/references/chaussures.png (modèle de Prescillia) en formes SVG.
   python3 tools/traceur-chaussures.py [dossier_debug]  ->  écrit js/chaussures-art.js
   Pour chaque vignette : on garde la chaussure de gauche, on enlève le fond et la jambe,
   on regroupe les couleurs en calques, on trace les contours et on les exprime dans le
   repère local de shoeSVG (x = 0 sur l'axe de la jambe, bas de la semelle à y = 42, 48 unités de large)."""
import sys, os, json, numpy as np, cv2
SRC='docs/references/chaussures.png'
TILES={ # (x, y) du coin haut-gauche de la vignette 240×190 dans l'image
 'ballerines':(495,190),'epaisses':(760,190),'basses':(495,530),'running':(760,530),
 'running_noire':(495,865),'retro':(760,865),'retro_creme':(495,1200),'sabots':(760,1200)}
UP=4  # suréchantillonnage pour des contours lisses
Y0={'ballerines':80}   # les parois de la ballerine sont trop fines pour être repérées seules
SAME={'retro_creme':'retro'}   # même modèle : on reprend les formes et on lit les couleurs de la vignette
keep={}
dbg=sys.argv[1] if len(sys.argv)>1 else None
img=cv2.imread(SRC)[:,:,::-1].astype(np.int32)  # RGB

def masks(t):
    r,g,b=t[...,0],t[...,1],t[...,2]
    mx=t.max(-1);mn=t.min(-1);sat=(mx-mn)
    cand=(sat<48)&(mx>170)&(r>=g-2)&(g>=b-2)&(r-b>=15)   # beige du fond et ombre au sol (le blanc des chaussures est plus neutre)
    # le fond est la partie de ces pixels reliée aux bords ; on l'amincit d'un pixel pour ne pas passer par les petits trous du contour
    c2=cv2.erode(cand.astype(np.uint8),np.ones((3,3),np.uint8))
    n,lab=cv2.connectedComponents(c2,connectivity=4)
    edge={int(v) for v in np.concatenate([lab[:,0],lab[:,-1],lab[-1],lab[0]]) if v}
    bg=cv2.dilate(np.isin(lab,list(edge)).astype(np.uint8),np.ones((3,3),np.uint8)).astype(bool)&cand
    skin=(r>165)&(g>95)&(g<160)&(b<110)&(r-b>75)&(r-g>45)
    return bg,skin

out={}
for name,(X,Y) in TILES.items():
    t=img[Y:Y+190,X:X+240]
    bg,skin=masks(t)
    # colonne de séparation entre les deux chaussures : la plus « fond » au milieu de la bande des chaussures
    band=slice(40,120)
    cols=[(bg[band,x].sum(),-abs(x-120),x) for x in range(105,136)]
    gap=max(cols)[2]
    L=t[:,:gap]; bgL,skinL=bg[:,:gap],skin[:,:gap]
    # jambe : pixels de peau reliés au bord haut
    n,lab=cv2.connectedComponents(skinL.astype(np.uint8),connectivity=4)
    top=set(lab[0][skinL[0]].tolist())
    leg=np.isin(lab,list(top))&skinL
    shoe=~bgL&~leg
    # le contour de la jambe touche le haut : la chaussure commence à la première ligne vraiment large
    legd=cv2.dilate(leg.astype(np.uint8),np.ones((5,5),np.uint8)).astype(bool)
    rows=(shoe&~legd).sum(1);raw=shoe.sum(1);y0=Y0.get(name,int(min(np.argmax(rows>5),np.argmax(raw>11))));shoe[:y0]=False
    n,lab=cv2.connectedComponents(shoe.astype(np.uint8),connectivity=8)
    if n>1:
        areas=[(lab==i).sum() for i in range(1,n)];shoe=lab==(1+int(np.argmax(areas)))
    # remplir chaque ligne entre ses bords (contours un peu ouverts), sans reprendre la jambe
    for y in range(shoe.shape[0]):
        xs=np.where(shoe[y])[0]
        if len(xs): shoe[y,xs.min():xs.max()+1]=True
    shoe&=~leg
    # bord du col : dans chaque colonne de la jambe, on descend tant que c'est encore la jambe (peau ou son contour)
    legl=(L[...,0]>175)&(L[...,0]-L[...,1]>58)&(L[...,0]-L[...,2]>98)
    lcols=np.where(leg[max(0,y0-6):y0+1].any(0))[0]
    if len(lcols) and name!='ballerines':
        for x in range(max(0,lcols.min()-2),min(L.shape[1],lcols.max()+3)):
            y=max(0,y0-6)
            while y<L.shape[0] and (leg[y,x] or legl[y,x] or (y<y0+3 and not shoe[y,x])): shoe[y,x]=False;leg[y,x]=leg[y,x] or legl[y,x];y+=1
    # le trait de contour de la jambe (brun) juste au-dessus du col ne fait pas partie de la chaussure
    near=cv2.dilate(leg.astype(np.uint8),np.ones((7,7),np.uint8)).astype(bool);rb=L[...,0]-L[...,2]
    top=np.zeros_like(shoe);top[:y0+7]=True
    shoe&=~(near&top&(rb>55)&(L[...,0]<215))
    # côté intérieur coupé droit (les deux semelles se touchent) : on le reconstruit en miroir du côté extérieur
    ys,xs=np.where(shoe);rows=range(ys.min(),ys.max()+1)
    lft={y:np.where(shoe[y])[0].min() for y in rows if shoe[y].any()};rgt={y:np.where(shoe[y])[0].max() for y in rows if shoe[y].any()}
    cut=[y for y in lft if rgt[y]>=shoe.shape[1]-2]
    if cut:
        wide=max(lft,key=lambda y:rgt[y]-lft[y]);c0=(lft[wide]+rgt[wide])/2
        cs=set(cut);ks0=sorted(lft)
        def interp(y):   # bord intérieur : entre les lignes voisines non coupées, sinon miroir du côté extérieur
            up=[v for v in ks0 if v<y and v not in cs];dn=[v for v in ks0 if v>y and v not in cs]
            if up and dn:
                a,b=up[-1],dn[0];return rgt[a]+(rgt[b]-rgt[a])*(y-a)/(b-a)
            return min(rgt[y],2*c0-lft[y])
        R={y:(interp(y) if y in cs else rgt[y]) for y in lft}
        ks=sorted(R);vals=np.array([R[y] for y in ks],float)
        sm=np.convolve(np.pad(vals,4,mode='edge'),np.ones(9)/9,mode='valid')   # bord intérieur lissé
        for y,v in zip(ks,sm):
            if y>=min(cut)-8: shoe[y,int(round(min(v,rgt[y])))+1:]=False
    foot=leg.copy();foot[:max(0,y0-4)]=False   # peau de la cheville (et du pied pour les ballerines) dans l'ouverture de la chaussure
    ys,xs=np.where(shoe);y1=ys.max();x0,x1=xs.min(),xs.max()
    lr=leg[max(0,y0-10):y0+1];lx=np.where(lr.any(0))[0];
    legc=(lx.min()+lx.max()+1)/2;legw=lx.max()-lx.min()+1
    s=(x1-x0+1)/46.0                               # 46 unités de large
    # couleurs : suréchantillonnage puis regroupement en quelques teintes
    big=cv2.resize(L.astype(np.uint8),None,fx=UP,fy=UP,interpolation=cv2.INTER_CUBIC)
    M=cv2.GaussianBlur(cv2.resize(shoe.astype(np.float32),None,fx=UP,fy=UP,interpolation=cv2.INTER_LINEAR),(15,15),0)>.5
    F=cv2.GaussianBlur(cv2.resize(cv2.dilate(foot.astype(np.uint8),np.ones((3,3),np.uint8)).astype(np.float32),None,fx=UP,fy=UP,interpolation=cv2.INTER_LINEAR),(17,17),0)>.5
    lab3=cv2.cvtColor(big[:,:,::-1],cv2.COLOR_BGR2LAB).reshape(-1,3).astype(np.float32)
    sel=M.reshape(-1)
    K=7
    crit=(cv2.TERM_CRITERIA_EPS+cv2.TERM_CRITERIA_MAX_ITER,40,.5)
    _,lbl,cent=cv2.kmeans(lab3[sel],K,None,crit,4,cv2.KMEANS_PP_CENTERS)
    lblimg=np.full(sel.shape,-1,np.int32);lblimg[sel]=lbl.reshape(-1);lblimg=lblimg.reshape(M.shape)
    # lissage des étiquettes (filtre majoritaire) pour éviter le bruit
    votes=np.stack([cv2.GaussianBlur((lblimg==k).astype(np.float32),(9,9),0) for k in range(K)])
    lblimg=np.where(M,votes.argmax(0),-1)
    rgbc=cv2.cvtColor(cent.reshape(1,-1,3).astype(np.uint8),cv2.COLOR_LAB2RGB).reshape(-1,3)
    if name in SAME:   # formes du modèle de base, couleurs relevées ici au même endroit
        b0=keep[SAME[name]];dx=(x0-b0['x0'])*UP;dy=(y1-b0['y1'])*UP
        def fit(a,fill):
            o=np.full(big.shape[:2],fill,a.dtype);h=min(a.shape[0],o.shape[0]);w=min(a.shape[1],o.shape[1]);o[:h,:w]=a[:h,:w];return o
        M=fit(np.roll(np.roll(b0['M'],dy,0),dx,1),False);lblimg=fit(np.roll(np.roll(b0['lbl'],dy,0),dx,1),-1)
        legc=b0['legc']+(x0-b0['x0']);s=b0['s'];y1=b0['y1']+(y1-b0['y1']);y0=b0['y0']+(y1-b0['y1'])
        rgbc=np.array([np.median(big[lblimg==k],0) if (lblimg==k).any() else [255,255,255] for k in range(K)]).astype(np.uint8)
        F=fit(np.roll(np.roll(b0['F'],dy,0),dx,1),False)
    keep[name]={'F':F,'M':M,'lbl':lblimg,'x0':x0,'y1':y1,'y0':y0,'legc':legc,'s':s}
    areas=[int((lblimg==k).sum()) for k in range(K)]
    H=M.shape[0]
    up=[int(((lblimg==k)&(np.arange(H)[:,None]<(y0+(y1-y0)*.55)*UP)).sum()) for k in range(K)]
    main=int(np.argmax(up))
    toU=lambda px,py:((px/UP-legc)/s,42+(py/UP-(y1+1))/s)
    def paths(mask):
        cs,_=cv2.findContours(mask.astype(np.uint8),cv2.RETR_CCOMP,cv2.CHAIN_APPROX_NONE)
        out=[]
        for c in cs:
            if cv2.contourArea(c)<UP*UP*1.2: continue
            c=cv2.approxPolyDP(c,UP*.45,True).reshape(-1,2)
            if len(c)<3: continue
            q=[toU(x,y) for x,y in c]
            out.append('M'+' '.join(f'{x:.1f},{y:.1f}' for x,y in q)+'Z')
        return ''.join(out)
    hexc=lambda c:'#%02x%02x%02x'%tuple(int(v) for v in c)
    order=sorted(range(K),key=lambda k:-areas[k])
    layers=[['sil',paths(M),hexc(rgbc[main])]]
    if F.any(): layers.insert(0,['skin',paths(F),''])
    for k in order:
        if k==main: continue
        d=paths(lblimg==k)
        if d: layers.append(['c',d,hexc(rgbc[k]),round(float(toU(0,np.where(lblimg==k)[0].mean())[1]),1)])
    ring=M&~cv2.erode(M.astype(np.uint8),np.ones((5,5),np.uint8)).astype(bool)
    edgec=np.percentile(big[ring].reshape(-1,3),25,axis=0) if ring.any() else [120,110,100]
    # l'image elle-même (pixels du modèle), détourée : la chaussure seule, fond et jambe transparents
    os.makedirs('assets/chaussures',exist_ok=True)
    if True:
        a=M.astype(np.float32);a[F]=0
        h2=cv2.resize(big,(big.shape[1]//2,big.shape[0]//2),interpolation=cv2.INTER_AREA);a2=cv2.resize(a,(big.shape[1]//2,big.shape[0]//2),interpolation=cv2.INTER_AREA)
        ys2,xs2=np.where(a2>.02);bx0,by0,bx1,by1=xs2.min(),ys2.min(),xs2.max()+1,ys2.max()+1
        rgba=np.dstack([h2[...,::-1],(a2*255).clip(0,255).astype(np.uint8)])[by0:by1,bx0:bx1]
        cv2.imwrite(f'assets/chaussures/{name}.png',rgba,[cv2.IMWRITE_PNG_COMPRESSION,9])
        u0=toU(bx0*2,by0*2);u1=toU(bx1*2,by1*2)
        ibox=[round(u0[0],2),round(u0[1],2),round(u1[0]-u0[0],2),round(u1[1]-u0[1],2)]
    else: ibox=None
    out[name]={'img':ibox,'edge':hexc(edgec),'main':hexc(rgbc[main]),'legw':round(legw/s,1),'top':round(toU(0,y0*UP)[1],1),'layers':layers}
    if dbg:
        v=np.zeros_like(big);v[:]=255
        for k in range(K): v[lblimg==k]=rgbc[k]
        cv2.imwrite(f'{dbg}/{name}_q.png',v[:,:,::-1])
import os
js='/* formes décalquées par tools/traceur-chaussures.py sur docs/references/chaussures.png — ne pas modifier à la main */\nconst SHOE_ART='+json.dumps(out,separators=(',',':'))+';\n'
open('js/chaussures-art.js','w').write(js)
print({k:(v['main'],v['legw'],v['top'],len(v['layers'])) for k,v in out.items()}, len(js))
