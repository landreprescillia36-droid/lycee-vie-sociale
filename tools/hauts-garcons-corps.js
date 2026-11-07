/* rend chaque haut des garçons sur le corps du jeu (avec et sans le haut) pour tools/traceur-hauts-garcons.py
   node tools/hauts-garcons-corps.js <dossier>  (serveur local sur :8765) */
const {chromium}=require('playwright');const OUT=process.argv[2];const fs=require('fs');
const L=JSON.parse(process.argv[3]);
(async()=>{const b=await chromium.launch();const p=await b.newPage({viewport:{width:1120,height:1440},deviceScaleFactor:1});
await p.goto('http://localhost:8765/index.html');await p.waitForTimeout(1500);
const VB='60 180 280 360';
const meta={};
for(const [k,t,c] of L){
 for(const bare of [0,1]){
  const m=await p.evaluate(([t,c,bare,VB])=>{let d=document.getElementById('pv');if(!d){d=document.createElement('div');d.id='pv';document.body.appendChild(d)}
   d.style.cssText='position:fixed;left:0;top:0;width:1120px;height:1440px;z-index:99999;background:#ff00ff';
   const s=normalize(Object.assign({},BASE_LOOK.m,{sexe:'m',hair:'chauve',skin:'#00ff00',top:t,topColor:c,jacket:'aucune',necklace:'aucun',bag:'aucun',bottom:'droit',bottomColor:'#0000ff',bgColor:'#ff00ff'}));
   const keep=window.topSVG;if(bare)window.topSVG=()=>'';
   d.innerHTML=`<div style="width:1120px;height:1440px">${render(s,VB,'x',false)}</div>`;window.topSVG=keep;
   const svg=d.querySelector('svg');svg.setAttribute('width','1120');svg.setAttribute('height','1440');
   const g=[...svg.querySelectorAll('g')].find(e=>(e.getAttribute('transform')||'').startsWith('translate(200,206)'));
   const M=g.getCTM();return [M.a,M.b,M.c,M.d,M.e,M.f]},[t,c,bare,VB]);
  await p.waitForTimeout(200);
  await p.screenshot({path:`${OUT}/corps-${k}-${bare}.png`,clip:{x:0,y:0,width:1120,height:1440}});
  meta[k]=m}}
fs.writeFileSync(OUT+'/corps-meta.json',JSON.stringify(meta));await b.close()})();
