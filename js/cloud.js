/* ---------- comptes et sauvegarde en ligne (Supabase) ----------
   Ne fait rien si js/config.js est vide : le jeu reste 100 % local.
   Sauvegarde = les deux mêmes données que le localStorage (KEY : avatar, GKEY : partie),
   envoyées dans la table « sauvegardes » (voir supabase/schema.sql).
   Envoi : au plus une fois toutes les 30 s pendant le jeu, et tout de suite quand l'appli passe en arrière-plan.
   À la connexion (ou à l'ouverture si déjà connecté·e) : si la partie en ligne est différente de celle
   de l'appareil, on demande laquelle garder. */
(()=>{
 const C=window.LYCEE_CONFIG||{};
 if(!C.supabaseUrl||!C.supabaseAnonKey||!window.supabase)return;
 const sb=window.supabase.createClient(C.supabaseUrl,C.supabaseAnonKey);
 const TABLE='sauvegardes',THROTTLE=30000;
 let user=null,timer=null,lastSent=null,status='',checked=false,pending=null;
 const read=k=>{try{return localStorage.getItem(k)}catch(e){return null}};
 const write=(k,v)=>{try{v==null?localStorage.removeItem(k):localStorage.setItem(k,v)}catch(e){}};
 const parse=s=>{try{return s?JSON.parse(s):null}catch(e){return null}};
 const local=()=>({avatar:parse(read(KEY)),partie:parse(read(GKEY))});
 const same=(a,b)=>JSON.stringify(a)===JSON.stringify(b);
 const dayTxt=p=>p&&p.day?`jour ${p.day}`:'pas de partie';
 const hhmm=d=>new Date(d).toLocaleString('fr-FR',{day:'numeric',month:'short',hour:'2-digit',minute:'2-digit'});

 async function pushNow(){
  clearTimeout(timer);timer=null;if(!user)return;
  const s=local(),str=JSON.stringify(s);if(str===lastSent)return;
  const {error}=await sb.from(TABLE).upsert({user_id:user.id,...s,updated_at:new Date().toISOString()});
  if(error){status='Sauvegarde en ligne impossible pour l\'instant (pas de réseau ?). Ta partie reste sur cet appareil.';return}
  lastSent=str;status='Sauvegardé en ligne à '+new Date().toLocaleTimeString('fr-FR',{hour:'2-digit',minute:'2-digit'});
 }
 function push(){if(user&&checked&&!timer)timer=setTimeout(pushNow,THROTTLE)}
 document.addEventListener('visibilitychange',()=>{if(document.hidden&&timer)pushNow()});

 /* compare la sauvegarde en ligne et celle de l'appareil */
 async function check(){
  checked=false;if(!user)return;
  const {data,error}=await sb.from(TABLE).select('avatar,partie,updated_at').eq('user_id',user.id).maybeSingle();
  if(error){status='Impossible de lire ta sauvegarde en ligne pour l\'instant.';return}
  const here=local();
  if(!data||(!data.avatar&&!data.partie)){checked=true;await pushNow();return}
  if(same({avatar:data.avatar,partie:data.partie},here)){checked=true;lastSent=JSON.stringify(here);return}
  if(!here.partie&&!here.avatar){useOnline(data);return}
  openSheet(`<div class="who"><div style="flex:1;min-width:0"><h2>Quelle partie garder ?</h2><p class="muted" style="margin:2px 0 0">Ta partie en ligne et celle de cet appareil sont différentes.</p></div></div>
  <div class="choices"><button class="choice" type="button" id="cloudUseOnline">Reprendre la partie en ligne<small>${dayTxt(data.partie)} · enregistrée le ${hhmm(data.updated_at)}</small></button>
  <button class="choice" type="button" id="cloudKeepLocal">Garder celle de cet appareil<small>${dayTxt(here.partie)} · elle remplacera la partie en ligne</small></button></div>`);
  pending=data;
 }
 function useOnline(d){write(KEY,d.avatar?JSON.stringify(d.avatar):null);write(GKEY,d.partie?JSON.stringify(d.partie):null);location.reload()}

 function open(){
  const msg=`<p class="muted" id="cloudMsg" role="status">${esc(status)}</p>`;
  if(user)openSheet(`${sheetHead('Mon compte',esc(user.email||''))}
   <p class="story-text">Ta partie est sauvegardée en ligne : connecte-toi avec le même compte sur ton téléphone ou ton ordinateur pour la retrouver.</p>${msg}
   <div class="row"><button class="gbtn ghost" type="button" id="cloudLogout">Se déconnecter</button><button class="gbtn" type="button" id="cloudSaveNow">Sauvegarder maintenant</button></div>`);
  else openSheet(`${sheetHead('Mon compte','Retrouve ta partie sur tous tes appareils')}
   <form class="stack" id="cloudForm"><label class="muted" for="cloudEmail">Adresse e-mail</label><div class="composer"><input id="cloudEmail" type="email" autocomplete="email" required></div>
   <label class="muted" for="cloudPass">Mot de passe (6 caractères minimum)</label><div class="composer"><input id="cloudPass" type="password" minlength="6" autocomplete="current-password" required></div>
   ${msg}<div class="row"><button class="gbtn ghost" type="button" id="cloudSignup">Créer un compte</button><button class="gbtn" type="submit">Se connecter</button></div></form>`);
 }
 const say=t=>{status=t;const m=$('cloudMsg');if(m)m.textContent=t};
 const creds=()=>({email:($('cloudEmail').value||'').trim(),password:$('cloudPass').value||''});
 async function login(){const c=creds();if(!c.email||c.password.length<6){say('Écris ton e-mail et un mot de passe de 6 caractères minimum.');return}
  say('Connexion…');const {error}=await sb.auth.signInWithPassword(c);
  if(error)say(/confirm/i.test(error.message)?'Confirme d\'abord ton adresse avec le lien reçu par e-mail.':'E-mail ou mot de passe incorrect.')}
 async function signup(){const c=creds();if(!c.email||c.password.length<6){say('Écris ton e-mail et un mot de passe de 6 caractères minimum.');return}
  say('Création du compte…');const {data,error}=await sb.auth.signUp({...c,options:{emailRedirectTo:location.origin+location.pathname}});
  if(error){say(/registered|exists/i.test(error.message)?'Ce compte existe déjà : clique sur « Se connecter ».':'Création impossible : '+error.message);return}
  if(!data.session)say('Compte créé ! Ouvre le lien reçu par e-mail pour le confirmer, puis connecte-toi.')}

 $('sheetBody').addEventListener('submit',e=>{if(e.target.id==='cloudForm'){e.preventDefault();login()}});
 $('sheetBody').addEventListener('click',e=>{const id=e.target.closest('button')?.id;
  if(id==='cloudSignup')signup();
  else if(id==='cloudSaveNow'){lastSent=null;say('Envoi…');pushNow().then(()=>say(status))}
  else if(id==='cloudLogout'){pushNow().finally(()=>sb.auth.signOut());closeSheet();toast('Déconnecté·e : ta partie reste sur cet appareil')}
  else if(id==='cloudUseOnline'&&pending)useOnline(pending);
  else if(id==='cloudKeepLocal'){checked=true;lastSent=null;closeSheet();pushNow().then(()=>toast('Partie de cet appareil envoyée en ligne'))}});

 sb.auth.onAuthStateChange((ev,session)=>{const was=user&&user.id;user=session?session.user:null;
  if(user&&user.id!==was){if(ev==='SIGNED_IN'&&!$('sheet').hidden)closeSheet();if(ev==='SIGNED_IN')toast('Connecté·e : '+(user.email||''));setTimeout(check,0)}
  if(!user){checked=false;lastSent=null}});

 window.CLOUD={push,open,get user(){return user}};
 const b=$('bCompte');if(b){b.hidden=false;b.onclick=open}
 if(typeof view!=='undefined'&&view==='profil'&&!$('game').hidden)drawView();
})();
