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

/* vie du lycée : dilemmes, clubs, projet, mini-jeux, bilan, fins, réglages, fêtes locales */
G.day=60;G.min=18*60;G.energy=100;view='day';G.pend=[];closeSheet();
drawDay();drawMates();drawProfile();console.log('groupes',JSON.stringify(cliques()));
for(const def of DILS){for(let i=0;i<3;i++){G.dil={id:def.id,A:'ines',B:'kylian',day:G.day};dilSheet();dilChoose(i)}}
console.log('rancunes',JSON.stringify(G.rancune),'mem',G.mem.length);Object.keys(G.rancune).forEach(id=>{G.energy=100;makeAmends(id)});
startDilemma();console.log('dilemme',G.dil&&G.dil.id,'file',G.pend.length);
extraClick({dataset:{x:'club:open'}});extraClick({dataset:{x:'club:set:anais'}});
for(let i=0;i<3;i++){G.clubWk=null;G.energy=100;G.min=18*60;clubAct(i)}console.log('club',G.club,G.clubXp,clubLevel());
G.clubXp=100;clubSheet();extraClick({dataset:{x:'club:change'}});
extraClick({dataset:{x:'proj:set:journal'}});for(let i=0;i<30&&!G.proj.done;i++){G.energy=100;G.min=18*60+i;G.proj.last=null;projWork()}console.log('projet',G.proj.pct,G.proj.done);
for(const k of Object.keys(SUBJ)){QUIZ[k].forEach(q=>{if(q[1].length!==4||new Set(q[1]).size!==4)throw new Error('quiz '+k+' '+q[0])})}
G.energy=100;revise('maths');mgStart('maths','quiz');for(let i=0;i<5;i++){extraClick({dataset:{x:'qa:0'}});quizNext()}console.log('quiz',G.know.maths,MG);
mgStart('svt','mem');let guard=0;while(MG&&guard++<80){const c=MG.cards;const i=MG.cards.findIndex((x,k)=>!MG.done.includes(k));const j=MG.cards.findIndex((x,k)=>k!==i&&x===c[i]&&!MG.done.includes(k));memFlip(i);if(MG)memFlip(j)}console.log('mémoire',G.know.svt,MG);
G.wkShown=null;G.wk=null;G.day=100;weeklyRecap();extraDay();console.log('bilan en file',G.pend.length);
G.ending=null;G.bac.result={ok:true,fin:13,ep:12,cc:14,ment:'Assez bien'};console.log('fin',computeEnding().t);endYearSheet();
['etoile','coeur','major','ame','bande','entoure','cicatrices','solitaire','dure','classique'].forEach(k=>{if(!ENDINGS[k])throw new Error(k)});
prefSheet();prefToggle('gros');prefToggle('contraste');prefToggle('gros');prefToggle('contraste');
for(const f of FETES){if(!['cyclone','toussaint','gwoka','tournoi','plage'].includes(f.id))continue;G.day=f.day;f.acts.forEach((a,i)=>{G.fetes={};G.energy=100;feteAct(f.id,i,a.pick?(a.pick==='list'?0:'ines'):undefined)});G.fetes={};feteSheet(f)}
console.log('fêtes locales', ['cyclone','toussaint','gwoka','tournoi','plage'].map(id=>id+':'+(FETES.find(f=>f.id===id).day)).join(' '));
view='day';drawDay();view='profil';drawProfile();view='mates';drawMates();
console.log("OK : simulation terminée sans erreur");
`);
