/* Test sans navigateur : charge js/app.js avec un faux DOM, simule 3 jours de jeu et appelle les écrans principaux.
   Usage : node tools/simulate.js   (ou npm test). Le test échoue si une exception est levée. */
const fs=require('fs'),path=require('path');const code=fs.readFileSync(path.join(__dirname,'..','js','app.js'),'utf8');
function el(id){const o={id,hidden:true,innerHTML:'',textContent:'',value:'',dataset:{},style:{},className:'',
 classList:{add(){},remove(){},toggle(){}},addEventListener(){},setAttribute(){},focus(){},select(){},scrollTop:0,scrollHeight:0,disabled:false};return o}
const els={};global.document={getElementById:id=>els[id]||(els[id]=el(id)),querySelectorAll:()=>[],querySelector:()=>null,body:el('body'),activeElement:null,hidden:false,addEventListener(){}};
global.window={scrollTo(){},claude:null};global.localStorage={getItem:()=>null,setItem(){}};global.navigator={};
const timers=[];global.setInterval=(f)=>{timers.push(f);return 1};global.setTimeout=(f)=>{return 1};global.clearTimeout=()=>{};global.clearInterval=()=>{};
eval(code+`
els.famille=els.famille||el('famille');
showFamille(false);document.getElementById('famGo').onclick();
console.log('day',G.day,fmtT(G.min),phase().type,'msgs',Object.keys(G.threads));
els.game.hidden=false;
for(let d=0;d<3;d++){for(let i=0;i<60*15;i++){advance(1);if(!$("sheet").hidden)closeSheet()}G.energy=60;sleepNow()}
console.log('after 3 days',G.day,fmtT(G.min),'grades',G.grades.length,'couples',G.couples,'posts',G.posts.length,'threads',Object.entries(G.threads).map(([k,v])=>k+':'+v.length).join(' '),'energy',G.energy);
view='day';G.min=8*60+5;advance(1);drawDay();classAct('notes');classAct('voisin');classAct('dormir');console.log('acts',G.acts);
G.min=10*60+1;advance(1);drawDay();const ph=phase();const m=presence(ph);console.log(ph.type,JSON.stringify(m));
const someone=Object.values(m).flat()[0]; if(someone){G.place=Object.keys(m).find(k=>m[k].includes(someone));openPerson(someone);personAct(someone,'compliment');personAct(someone,'flirt');console.log(relChange(someone,0,0),G.rel[someone]);}
console.log(buildPrompt('jade').slice(0,300));
['home','messages','mates','insta','profil','day'].forEach(v=>{view=v;drawView()});
G.rel.jade.ami=40;G.ig.priv=true;for(let i=0;i<30;i++)followTick();console.log('insta demandes',G.ig.reqs);G.ig.reqs.slice().forEach(id=>igRequest(id,true));igFollow('jade');igFollow('kylian');openInsta('jade');drawInsta();
const jp=npcPost('jade',NPC_POSTS.jade[0]);G.posts.unshift(jp);cm=null;openComments(jp.id);console.log('débat',jp.comments.map(c=>c.by+(c.re?'↳':'')+':'+c.text.slice(0,28)).join(' | '));
const crit=jp.comments.find(c=>c.vs==='jade');if(crit){startReply(crit.id);sendReply('Laisse Jade tranquille','desaccord');console.log('après réponse',jp.comments.slice(-2).map(c=>c.by+'→'+c.to+':'+c.text).join(' | '))}
cm=null;openComments(jp.id);sendComment('Trop beau','gentil');console.log('abonnés',igCounts('me'),'objectifs',G.objDone);
openFiche('noah');openChat('noah');sleepNow();console.log('slept',G.day,fmtT(G.min),G.energy);
checkObjectives();console.log("obj",G.objDone);const pl=famPlan(G.family[0].id);console.log(planWhen(pl),pl.place);pl.status="accepted";startOuting(pl);famOuting("f_photo",pl.id);console.log("famRel",JSON.stringify(G.famRel),G.posts[0].text);openFamPerson(G.family[1].id);famAct(G.family[1].id,"sortie");console.log("likes",NPCS.map(n=>n.id+":"+npcLikesMe(n.id)+"/"+iLike(n.id)).join(" "));showFamille(false);editFamLook(0);state.hair="frange";document.getElementById("bFamDone").onclick();console.log("famlook",famDraft[0].av.hair,"player",state.name,state.hair);
console.log("OK : simulation terminée sans erreur");
`);
