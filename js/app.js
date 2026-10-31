/* numéro de version visible dans l'appli (à augmenter avec VERSION dans sw.js) */
const APP_VERSION='35';
/* gemmes mises de côté pour l'instant (demande de Prescillia) : le compteur G.gems continue en silence,
   mais rien ne les montre, ne les coûte ni ne les annonce. Remettre à true pour les réactiver. */
const GEMS_ON=false;
const gemTxt=t=>GEMS_ON?t:'';
/* énergie gagnée à chaque objectif atteint (a remplacé le bouton « Regarder une pub ») */
const OBJ_ENERGY=5;
try{document.getElementById('atVers').textContent='Version '+APP_VERSION}catch(_){}
/* mise à jour forcée : vide les copies en cache et le service worker, garde la partie (localStorage) */
async function forceUpdate(){try{toast('⏳ Mise à jour…')}catch(_){}
 try{if(window.caches)for(const k of await caches.keys())await caches.delete(k)}catch(_){}
 try{if(navigator.serviceWorker)for(const r of await navigator.serviceWorker.getRegistrations())await r.unregister()}catch(_){}
 location.replace(location.pathname+'?v='+Date.now())}
/* ---------- couleurs ---------- */
function rgb(h){h=h.replace('#','');return [0,2,4].map(i=>parseInt(h.substr(i,2),16))}
function mix(a,b,t){const A=rgb(a),B=rgb(b);return '#'+A.map((v,i)=>Math.round(v+(B[i]-v)*t).toString(16).padStart(2,'0')).join('')}
function shade(c,t){return t<0?mix(c,'#000000',-t):mix(c,'#ffffff',t)}

const SKIN=['#fde3cf','#f6cfae','#eab48a','#d4975f','#b8784a','#9a6140','#80502f','#6a4027'];
const HAIR=['#1c1412','#3b2219','#5a3522','#6e2a24','#8a5a35','#c08a4e','#e3c27a','#b8452e','#7d7f86','#e9e4dc','#5b4bd1','#e56aa6','#3a8f7d'];
/* iris : les 8 couleurs de la planche yeux de Prescillia (marron foncé, marron, châtain, noisette, vert, bleu, gris, noir) */
const IRIS=['#2f1d13','#5f3a23','#7a5430','#4b4124','#4c6549','#3c525e','#616162','#222224'];
const CLOTH=['#1f2127','#f4f1ea','#ece2cc','#a9adb3','#7a5236','#c49a6c','#f2c6d3','#d93b5e','#26314f','#3d6fd8','#5b5a3c','#2fa3a0','#f2c230','#e8613c','#7a4fd0'];
const lum=h=>{const [r,g,b]=rgb(h);return (0.299*r+0.587*g+0.114*b)/255};
const BOTC=['#86a6cc','#5b7fb5','#2f4a78','#9aa0a6','#c4c7cb','#f4f1ea','#1f2127','#c8b08a','#f2c6d3','#5a6b4a','#7a5236'];
const SHOEC=['#f4f1ea','#1f2127','#b8b6b0','#e9dfc8','#c49a6c','#7a5236','#6b2a2e','#f2c6d3','#26314f'];
const BGC=['#e9eef6','#fde8d4','#e3f2e6','#efe3fb','#fff3c4','#d6ecf7','#f7d9e3','#2d3550','#3b2a4a','#1f3d3a'];

/* ---------- formes ---------- */
const FACES={
 joufflu:{d:'M200,305 C128,305 92,255 95,185 C98,112 145,72 200,72 C255,72 302,112 305,185 C308,255 272,305 200,305Z',ex:97},
 ovale:{d:'M200,312 C140,312 106,262 106,190 C106,112 148,70 200,70 C252,70 294,112 294,190 C294,262 260,312 200,312Z',ex:108},
 rond:{d:'M200,300 C140,300 92,252 92,188 C92,124 140,74 200,74 C260,74 308,124 308,188 C308,252 260,300 200,300Z',ex:94},
 carre:{d:'M200,302 C150,302 102,288 100,232 L98,160 C98,105 142,72 200,72 C258,72 302,105 302,160 L300,232 C298,288 250,302 200,302Z',ex:100},
 coeur:{d:'M200,312 C160,310 108,270 98,205 C88,130 135,72 200,72 C265,72 312,130 302,205 C292,270 240,310 200,312Z',ex:99},
 naturel:{d:'M200,306 C160,306 124,292 108,264 C98,246 96,222 96,196 C96,114 142,74 200,74 C258,74 304,114 304,196 C304,222 302,246 292,264 C276,292 240,306 200,306Z',ex:96},
 anguleux:{d:'M200,308 C172,308 136,298 118,276 C104,258 100,230 99,196 C97,114 144,72 200,72 C256,72 303,114 301,196 C300,230 296,258 282,276 C264,298 228,308 200,308Z',ex:99},
 allonge:{d:'M200,316 C162,316 122,296 112,252 C106,226 104,206 104,184 C104,110 148,68 200,68 C252,68 296,110 296,184 C296,206 294,226 288,252 C278,296 238,316 200,316Z',ex:104}
};
/* crâne : même forme pour tous les visages, pour que les cheveux collent à la tête */
const SKULL='M96,214 C93,190 92,162 94,140 C98,100 140,72 200,72 C260,72 302,100 306,140 C308,162 307,190 304,214Z';
const BIG='M-31,0 A31,32 0 1,0 31,0 A31,32 0 1,0 -31,0Z';
const BIGLASH='M-34,-2 C-30,-36 28,-40 37,-12 L45,-19 L41,-3 C31,-29 -26,-30 -34,-2Z';
const EYES={
 grands:{w:BIG,ir:23,icx:-3,icy:3,lash:BIGLASH},
 brillants:{w:BIG,ir:27,icx:-2,icy:2,lash:BIGLASH,spark:true},
 amande:{w:'M-31,2 C-19,-21 19,-23 33,-2 C19,17 -19,17 -31,2Z',ir:17,icx:-2,icy:-1,lash:'M-33,3 C-20,-25 20,-27 36,-4 L43,-10 L39,1 C22,-21 -19,-19 -33,3Z'},
 ronds:{w:'M-20,0 A20,20 0 1,0 20,0 A20,20 0 1,0 -20,0Z',ir:14,icx:-2,icy:2,lash:'M-22,-2 C-18,-25 18,-27 24,-8 L30,-12 L27,-2 C19,-19 -16,-20 -22,-2Z'},
 endormis:{w:'M-30,2 C-18,-10 18,-10 32,0 C18,17 -18,17 -30,2Z',ir:17,icx:-2,icy:5,lash:'M-33,3 C-18,-13 18,-13 36,0 L42,-3 L38,4 C20,-7 -18,-7 -33,3Z'},
 chat:{w:'M-29,6 C-20,-14 18,-20 36,-12 C26,10 -10,18 -29,6Z',ir:16,icx:2,icy:0,lash:'M-31,7 C-20,-18 20,-24 40,-15 L47,-20 L43,-9 C22,-16 -18,-10 -31,7Z'},
 doux:{w:'M-33,3 C-25,-25 23,-27 35,-1 C25,21 -23,23 -33,3Z',ir:22,icx:0,icy:2,lash:'M-35,4 C-25,-30 24,-32 39,-2 L42,1 C25,-22 -22,-21 -35,6Z',soft:true},
 nets:{w:'M-31,2 C-19,-20 19,-22 33,-2 C19,16 -19,16 -31,2Z',ir:17,icx:-2,icy:-1,lash:'M-33,2 C-20,-24 20,-26 35,-3 C20,-19 -19,-18 -33,2Z'},
 rieurs:{closed:true}
};
const MIDPART='M88,240 C68,150 110,58 200,56 C290,58 332,150 312,240 C306,200 297,172 286,152 C262,130 226,112 200,98 C174,112 138,130 114,152 C103,172 94,200 88,240Z';
const BANGS='M90,220 C72,130 118,58 200,56 C282,58 328,130 310,220 C302,190 298,168 294,150 Q272,162 252,146 Q226,162 200,146 Q174,162 148,146 Q128,162 106,150 C102,168 98,190 90,220Z';
const SHORT='M96,200 C84,118 126,60 200,58 C274,60 316,118 304,200 C299,168 292,150 280,134 C256,118 232,116 200,112 C168,116 144,118 120,134 C108,150 101,168 96,200Z';
const SIDEPART='M90,225 C70,130 112,56 200,56 C290,58 330,135 314,225 C308,200 302,182 294,168 C268,166 228,150 198,128 C176,112 156,102 140,98 C128,120 114,138 104,152 C97,172 93,196 90,225Z';
const BLUNT='M90,222 C72,130 118,58 200,56 C282,58 328,130 310,222 C305,196 301,176 297,156 L103,156 C99,176 95,196 90,222Z';
const PIGFRONT='M92,210 C74,128 118,58 200,56 C282,58 326,128 308,210 C302,180 296,160 286,146 C262,128 228,112 200,98 C172,112 138,128 114,146 C104,160 98,180 92,210Z';
const PUFFRONT='M96,196 C84,118 126,60 200,58 C274,60 316,118 304,196 C298,172 292,158 286,148 Q262,140 248,150 Q228,138 210,150 Q190,138 172,150 Q152,138 136,150 Q122,140 114,148 C108,158 102,172 96,196Z';
const QUIFF='M100,192 C90,124 116,70 176,46 C210,30 262,28 292,52 C314,70 312,100 300,118 C306,140 304,164 300,192 C296,166 288,150 278,140 C252,130 226,128 200,128 C174,128 148,132 124,142 C112,156 104,172 100,192Z';
const SPIKY='M98,190 C90,140 104,104 120,90 L118,62 L144,78 L150,46 L174,70 L190,38 L208,66 L228,40 L240,70 L264,50 L266,80 L292,72 L284,98 C300,116 308,150 302,190 C296,160 288,146 278,136 C252,124 226,120 200,118 C174,120 148,124 122,136 C110,150 102,168 98,190Z';
const MECHE='M98,196 C86,120 126,60 200,58 C274,60 314,118 304,196 C298,172 292,156 284,146 C256,150 214,138 180,118 C160,106 140,104 124,110 C112,130 104,160 98,196Z';
const UNDER='M108,160 C104,104 140,62 198,58 C252,56 296,80 304,122 C310,150 298,156 292,150 C276,132 250,124 220,124 C184,124 146,132 120,150 C114,154 110,158 108,160Z';
const LF_BACK='M78,170 C72,56 328,56 322,170 L322,400 C324,470 324,530 326,600 L74,600 C76,530 76,470 78,400Z';
const LF_CUR='M78,250 L78,400 C76,480 76,540 76,612 L88,594 L97,618 L108,596 L119,610 L129,590 L142,600 C140,520 140,440 142,384 C144,344 146,314 152,292 C134,282 118,264 104,240Z';
const LF_TOP='M76,330 L78,200 C72,104 118,50 200,50 C282,50 328,104 322,200 L324,330 L312,316 L304,326 L298,306 L290,312 C282,270 278,226 282,188 C283,180 284,172 284,166 C282,176 275,188 268,198 C266,189 261,175 256,170 C254,180 247,190 240,200 C238,191 233,179 228,174 C226,184 229,176 222,186 C220,177 213,155 208,150 C206,160 199,186 192,196 C190,187 187,175 182,170 C180,180 169,196 162,206 C160,197 155,181 150,176 C148,186 143,186 136,196 C134,187 127,177 122,172 C118,178 118,184 118,190 C122,226 118,270 110,312 L102,306 L96,326 L88,316Z';
const LF_FRINGE_SH='M284,166 C282,176 275,188 268,198 C266,189 261,175 256,170 C254,180 247,190 240,200 C238,191 233,179 228,174 C226,184 229,176 222,186 C220,177 213,155 208,150 C206,160 199,186 192,196 C190,187 187,175 182,170 C180,180 169,196 162,206 C160,197 155,181 150,176 C148,186 143,186 136,196 C134,187 127,177 122,172 C118,178 118,184 118,190 C122,226 118,270 110,312 L100,312 C104,250 104,200 118,196 C160,200 240,200 282,196 C296,200 296,250 300,312 L290,312 C282,270 278,226 282,188Z';
const LOB_F='M200,106 C176,108 152,128 138,158 C126,186 118,226 110,262 C106,290 120,316 132,336 C134,350 134,380 134,400 Q102,404 70,400 C70,360 70,300 72,240 C66,120 110,40 200,40 C290,40 334,120 328,240 C330,300 330,360 330,400 Q298,404 268,400 C268,380 268,350 270,336 C282,316 294,290 290,262 C282,226 274,186 262,158 C248,128 224,108 200,106Z';
const LOB_B='M74,170 C66,48 334,48 326,170 L328,300 C330,340 330,370 330,400 L70,400 C70,370 70,340 72,300Z';
const MB_L=[[86,228],[64,240],[48,262],[40,288],[46,312],[68,328],[100,336],[132,334],[156,330],[168,318],[160,306],[140,300],[126,290],[114,270],[104,250],[96,236]];
const MB_R=[[294,224],[320,234],[342,256],[352,282],[348,308],[328,326],[296,336],[264,336],[240,330],[230,316],[240,306],[258,298],[272,286],[284,268],[292,248],[296,234]];
const MB_BACK=[[92,232],[200,236],[308,232],[338,260],[344,300],[310,336],[200,340],[90,336],[56,300],[62,260]];
const MB_TOP='M96,174 C82,110 110,52 200,46 C270,44 314,80 312,130 C312,150 314,168 313,186 C306,166 300,146 292,134 C284,126 278,124 274,118 C266,108 258,102 250,99 C240,92 230,86 222,87 C210,90 200,100 193,104 C176,110 156,114 140,120 C120,134 104,154 96,174Z';
const AN_PTS=[[300, -12], [297, 9], [289, 29], [276, 46], [259, 60], [238, 70], [216, 75], [192, 75], [170, 70], [149, 60], [132, 46], [119, 29], [111, 9], [108, -12], [111, -33], [119, -53], [132, -70], [149, -84], [170, -94], [192, -99], [216, -99], [238, -94], [259, -84], [276, -70], [289, -53], [297, -33]];
const AN_CAP='M84,194 C74,120 104,52 204,48 C300,52 330,120 318,194 C316,199 312,201 309,200 C301,196 298,186 298,172 C298,168 298,166 298,164 C296,142 290,126 280,117 C272,106 264,99 256,96 C238,90 218,89 198,90 C180,89 166,90 156,92 C136,98 120,108 113,121 C106,138 102,156 102,172 C102,186 99,196 91,200 C88,201 85,198 84,194Z';
const LB_BACK=[[200,10],[248,10],[300,30],[338,62],[356,92],[362,130],[360,170],[354,210],[352,240],[360,280],[368,310],[378,345],[370,380],[358,398],[300,404],[200,404],[100,404],[46,400],[38,380],[44,340],[50,310],[56,270],[50,230],[48,200],[56,140],[76,90],[106,46],[150,18]];
const LB_L=[[90,180],[64,200],[52,240],[58,270],[50,310],[44,345],[40,380],[48,400],[80,404],[120,402],[150,404],[170,396],[176,370],[172,340],[160,318],[146,296],[130,270],[112,240],[100,210]];
const LB_R=[[310,180],[338,196],[352,220],[350,250],[358,282],[366,312],[376,345],[368,378],[356,398],[320,404],[280,402],[246,404],[232,392],[230,366],[234,340],[246,318],[262,296],[278,270],[294,240],[304,210]];
const LB_TOP='M86,188 C70,120 90,60 140,28 C170,14 230,8 260,12 C310,24 346,56 360,96 C368,130 364,160 346,186 C338,176 330,168 323,162 C314,146 306,132 298,124 C288,112 278,104 268,105 C258,106 250,110 243,112 C234,108 228,102 222,102 C212,98 202,94 193,97 C190,104 188,110 182,112 C164,114 146,118 127,127 C114,134 106,140 102,147 C96,160 90,174 86,188Z';
const LW_BACK='M80,190 C64,70 336,70 320,190 L326,330 C330,420 330,500 330,580 L70,580 C70,500 70,420 74,330Z';
const LW_CUR='M80,190 C74,250 70,330 70,420 C70,500 70,550 72,594 L86,588 L98,600 L112,590 L126,600 L140,590 C140,540 140,480 142,420 C144,360 150,320 160,292 C140,268 122,236 112,196Z';
const DG_MASS='M88,108 Q76.0,96.0 86,84 Q79.3,69.7 94,60 Q93.1,45.3 112,40 Q117.6,25.9 140,26 Q150.4,12.5 172,18 Q186.3,6.1 204,16 Q222.7,6.3 236,18 Q257.2,12.9 266,26 Q287.7,27.2 292,42 Q310.1,47.6 308,62 Q321.8,71.9 314,86 Q324.0,97.1 312,108 C280,112 120,112 88,108Z';
const DG_SIDE='M86,104 L122,104 C118,130 112,158 104,190 L94,188 C88,160 86,130 86,104Z';
const DG_CURLS=[[126, 50], [166, 36], [208, 32], [250, 38], [288, 56], [110, 86], [150, 72], [192, 66], [234, 68], [274, 80], [134, 100], [176, 96], [218, 96], [260, 100]];
const TP_MASS='M324,110 Q331.5,106.5 325.0,100.0 Q332.5,96.5 326,90 Q331.7,83.7 323.0,77.0 Q328.7,70.7 320,64 Q323.6,57.2 313.0,53.0 Q316.6,46.2 306,42 Q307.6,34.7 296.0,33.0 Q297.6,25.7 286,24 Q285.2,16.6 273.0,18.0 Q272.2,10.6 260,12 Q256.6,4.3 245.0,8.5 Q241.6,0.8 230,5 Q224.0,-2.5 215.0,4.0 Q209.0,-3.5 200,3 Q191.0,-3.5 185.0,4.0 Q176.0,-2.5 170,5 Q158.4,0.8 155.0,8.5 Q143.4,4.3 140,12 Q127.8,10.6 127.0,18.0 Q114.8,16.6 114,24 Q102.4,25.7 104.0,33.0 Q92.4,34.7 94,42 Q83.4,46.2 87.0,53.0 Q76.4,57.2 80,64 Q71.3,70.7 77.0,77.0 Q68.3,83.7 74,90 Q67.5,96.5 75.0,100.0 Q68.5,106.5 76,110 C110,114 160,108 200,110 C240,108 290,114 324,110Z';
const TP_SIDE='M72,104 L118,108 C112,132 106,158 100,186 L88,184 C80,158 74,130 72,104Z';
const TP_PTS=[];
const TP_CURLS=[[159, 28, 12.6, 26, 248], [93, 53, 8.5, 33, 238], [276, 25, 9.6, 226, 285], [218, 50, 14.8, 17, 277], [156, 87, 9.3, 209, 258], [170, 63, 8.4, 21, 219], [242, 52, 10.2, 211, 241], [141, 66, 11.7, 315, 266], [151, 102, 8.8, 151, 268], [119, 58, 8.3, 241, 269], [217, 93, 10.2, 250, 253], [303, 57, 12.6, 22, 263], [175, 92, 8.6, 162, 249], [289, 88, 14.0, 100, 237], [119, 30, 9.6, 84, 244], [181, 47, 12.0, 343, 262], [204, 70, 12.7, 19, 281], [265, 93, 13.6, 141, 236], [108, 71, 8.4, 24, 219], [108, 47, 8.2, 315, 255], [210, 16, 11.7, 352, 278], [123, 83, 11.7, 280, 230], [256, 34, 11.6, 128, 203], [137, 32, 9.4, 225, 281], [279, 57, 12.6, 288, 208], [237, 96, 13.5, 270, 243], [87, 101, 12.5, 190, 284], [250, 73, 9.0, 318, 287], [197, 103, 13.8, 58, 239], [103, 91, 8.5, 311, 241], [88, 80, 11.9, 68, 243], [151, 47, 10.8, 360, 253], [182, 75, 9.4, 287, 267], [184, 18, 11.3, 134, 283]];
const DG_TOP=[[110,96],[100,76],[104,54],[124,38],[156,28],[200,24],[244,28],[276,40],[294,60],[292,82],[280,94],[262,90],[240,100],[214,104],[186,110],[160,104],[134,102]];
const WV_F='M98,192 C94,184 92,178 90,172 C80,166 68,158 58,148 C68,146 76,144 82,140 C74,130 62,120 54,110 C64,110 72,108 78,104 C68,92 70,76 82,64 C80,48 94,34 112,32 C118,16 138,8 152,14 C162,2 182,-2 194,6 C206,-4 226,-4 236,6 C246,0 258,2 266,8 C272,0 280,-6 288,-12 C288,-2 286,6 284,12 C298,12 312,22 314,34 C328,38 336,50 334,62 C342,66 348,70 354,72 C346,78 340,82 336,86 C344,94 350,100 356,106 C348,110 340,114 334,118 C334,134 328,148 320,156 C316,166 310,176 306,184 C302,170 300,158 296,148 C300,140 304,130 298,120 C290,132 282,142 272,150 C268,132 266,116 262,104 C246,96 222,96 206,100 C204,118 202,130 196,144 C192,132 182,124 170,128 C164,134 156,142 146,150 C144,140 138,134 128,138 C124,146 116,154 108,164 C104,174 100,184 98,192Z';
const FH_M='M92.0,114.0 Q88.7,110.8 88.4,108.3 Q84.3,103.6 83.6,100.1 Q80.2,95.3 80.0,92.0 Q76.0,87.6 78.7,84.7 Q76.5,80.1 78.7,77.3 Q76.3,72.5 80.0,70.0 Q79.4,65.1 82.7,62.5 Q82.0,57.2 86.7,55.0 Q87.8,50.1 92.0,48.0 Q93.1,42.8 98.7,41.5 Q101.6,36.8 106.8,35.4 Q109.6,30.4 116.0,30.0 Q120.5,25.8 126.4,25.3 Q131.1,20.7 138.0,21.3 Q143.8,17.6 150.0,18.0 Q155.8,13.7 162.4,15.4 Q169.2,12.2 175.2,13.5 Q182.1,9.5 188.0,12.0 Q195.5,9.1 200.8,10.9 Q208.8,7.3 213.6,10.2 Q221.6,8.0 226.0,10.0 Q234.3,7.1 237.8,10.1 Q245.6,8.5 249.1,10.6 Q257.5,8.8 260.0,12.0 Q267.8,11.8 270.6,14.4 Q279.0,14.2 280.7,17.8 Q288.0,18.9 290.0,22.0 Q297.7,23.3 298.4,27.2 Q304.8,29.7 305.9,33.3 Q312.4,35.9 312.0,40.0 Q316.8,43.7 316.6,47.5 Q321.6,51.4 319.9,55.6 Q323.3,60.1 322.0,64.0 Q325.9,68.6 323.3,72.6 Q325.5,77.7 323.4,81.4 Q325.8,86.5 322.0,90.0 Q321.7,95.5 317.9,99.0 Q315.6,104.5 312.1,107.9 Q310.8,111.8 308.0,114.0 C280,110 240,108 200,108 C160,108 120,110 92,114Z';
const FH_SIDE='M86,110 L120,112 C114,134 106,154 100,180 L90,178 C85,154 83,130 86,110Z';
const RS_M='M100,136 C92,126 82,114 80,100 C76,58 120,8 200,6 C274,6 322,52 320,100 C320,114 310,126 300,136 C294,122 282,110 266,104 C240,99 170,99 140,103 C126,106 116,112 110,118 C106,124 102,130 100,136Z';
const RS_SIDE='M83,102 L104,132 C102,150 100,166 98,186 L88,184 C84,160 81,130 83,102Z';
const LO_CAP='M84,184 C80,150 78,120 82,100 C86,50 140,20 200,20 C262,20 314,50 318,100 C322,120 320,150 316,184 L298,184 C296,166 290,152 277,141 C266,122 256,110 244,103 C226,96 208,94 190,94 C170,96 152,100 139,108 C126,118 116,130 112,141 C104,152 100,166 100,184Z';
const LO_CUR='M84,100 C78,160 70,240 62,320 C58,380 56,460 56,520 C56,540 56,556 58,568 L76,560 L92,572 L108,562 L124,572 L142,564 C140,500 140,420 142,350 C144,320 150,300 160,280 L160,100Z';
const LL_CAP='M100,184 C80,162 68,132 70,104 C74,58 134,32 200,32 C266,32 326,58 330,104 C332,132 320,162 300,184 C298,170 296,158 292,148 C278,112 240,88 200,84 C160,88 122,112 108,148 C104,158 102,170 100,184Z';
const LL_BACK='M72,110 C74,54 140,32 200,32 C260,32 326,54 328,110 C338,180 350,300 360,520 L40,520 C50,300 62,180 72,110Z';
const LL_CUR='M82,140 C68,170 58,208 52,252 C46,320 40,420 38,524 L84,520 L130,524 C128,450 130,372 136,318 C140,292 140,258 124,214 C112,192 100,168 92,140Z';
const CH_CAP='M96,184 C84,152 80,122 84,98 C92,64 140,50 200,50 C260,50 308,64 316,98 C320,122 316,152 304,184 C300,168 296,154 290,142 C276,108 240,82 200,78 C160,82 124,108 110,142 C104,154 100,168 96,184Z';
const CH_BUN=[[266, 4], [262, 22], [251, 37], [233, 49], [211, 55], [189, 55], [167, 49], [149, 37], [138, 22], [134, 4], [138, -14], [149, -29], [167, -41], [189, -47], [211, -47], [233, -41], [251, -29], [262, -14]];
const LONGBACK='M84,170 C68,66 332,66 316,170 L346,400 L54,400Z';
const LONGWAVE='M84,170 C68,66 332,66 316,170 C334,214 312,248 330,288 C348,328 320,360 342,400 L58,400 C80,360 52,328 70,288 C88,248 66,214 84,170Z';
const BOB='M78,190 C64,68 336,68 322,190 L326,298 Q300,306 270,300 L130,300 Q100,306 74,298Z';
const BOBWAVE='M80,190 C64,70 336,70 320,190 C330,222 342,252 330,282 C322,302 306,296 300,312 C286,300 270,316 258,304 C238,312 222,300 200,304 C178,300 162,312 142,304 C130,316 114,300 100,312 C94,296 78,302 70,282 C58,252 70,222 80,190Z';
const FLIP='M80,188 C64,70 336,70 320,188 C322,236 326,262 352,284 C334,298 306,296 288,290 L112,290 C94,296 66,298 48,284 C74,262 78,236 80,188Z';
const AFRONT='M96,200 C84,118 130,66 200,64 C270,66 316,118 304,200 C296,172 284,156 268,146 Q236,136 200,136 Q164,136 132,146 C116,156 104,172 96,200Z';
const TWA='M98,190 C86,118 128,58 200,56 C272,58 314,118 302,190 C296,166 290,152 282,144 Q240,132 200,132 Q160,132 118,144 C110,152 104,166 98,190Z';
const BRF='M96,196 C84,118 126,60 200,58 C274,60 316,118 304,196 C298,168 290,152 280,142 Q240,124 200,122 Q160,124 120,142 C110,152 102,168 96,196Z';
function bumps(cx,cy,rx,ry,r,f,full){let o=full?`<ellipse cx="${cx}" cy="${cy}" rx="${rx}" ry="${ry}" fill="${f}"/>`:'';const n=Math.round((rx+ry)/9);for(let i=0;i<n;i++){const a=i/n*Math.PI*2;o+=`<circle cx="${(cx+Math.cos(a)*rx*.92).toFixed(1)}" cy="${(cy+Math.sin(a)*ry*.92).toFixed(1)}" r="${r}" fill="${f}"/>`}return o}
function braids(s,hD,hL,len,w,dash,n){const hc=s.hairColor;let o='';
 for(const side of [1,-1])for(let i=0;i<n;i++){const x0=100+i*9,y0=176+i*14,x1=76+i*(64/n),y1=len-i*6,X=v=>side===1?v:400-v;const D=`M${X(x0)},${y0} Q${X(x0-10)},${(y0+y1)/2} ${X(x1)},${y1}`;
  o+=`<path d="${D}" stroke="${shade(hc,i%2?-.08:0)}" stroke-width="${w}" fill="none" stroke-linecap="round"/><path d="${D}" stroke="${hD}" stroke-width="${w}" fill="none" stroke-dasharray="${dash}" opacity=".55"/><path d="${D}" stroke="${hL}" stroke-width="${(w*.25).toFixed(1)}" fill="none" opacity=".35"/>`}
 return o}
function puff(cx,cy,r,f){let o=`<circle cx="${cx}" cy="${cy}" r="${r}" fill="${f}"/>`;for(let i=0;i<12;i++){const a=i/12*Math.PI*2;o+=`<circle cx="${(cx+Math.cos(a)*r*.86).toFixed(1)}" cy="${(cy+Math.sin(a)*r*.86).toFixed(1)}" r="${(r*.3).toFixed(1)}" fill="${f}"/>`}return o}
const SLICK='M97,185 C90,112 132,64 200,62 C268,64 310,112 303,185 C296,146 276,112 200,106 C124,112 104,146 97,185Z';

/* taches de rousseur : positions fixes */
const FRECK=(()=>{let a=7;const r=()=>{a|=0;a=a+0x6D2B79F5|0;let t=Math.imul(a^a>>>15,1|a);t=t+Math.imul(t^t>>>7,61|t)^t;return((t^t>>>14)>>>0)/4294967296};
 const pts=[];for(let i=0;i<44;i++){const side=i%2?1:-1;const ang=r()*Math.PI*2,rad=Math.sqrt(r());pts.push([200+side*(40+Math.cos(ang)*rad*32),242+Math.sin(ang)*rad*13,1.1+r()*1.4])}return pts})();

/* ---------- rendu ---------- */
const HS=.55,HX=90,HY=25.2,HT=`translate(${HX},${HY}) scale(${HS})`;
const hv=vb=>{const [x,y,w,h]=vb.split(' ').map(Number);return [HX+x*HS,HY+y*HS,w*HS,h*HS].map(v=>+v.toFixed(1)).join(' ')};
const AVB='104 28 192 192',PVB='80 20 240 240',FVB='26 -52 348 940',PHB='66 14 268 268';
/* taille et corpulence */
const TAILLE={petite:.9,moyenne:1,grande:1.1},TAILLE_F={grande:1.05},CORP={mince:{w:.93,WH:-3,HH:-2,au:-1,lk:.9,ak:.92},moyenne:{w:1,WH:0,HH:0,au:0,lk:1,ak:1},ronde:{w:1.06,WH:11,HH:6,au:3,lk:1.13,ak:1.12},forte:{w:1.12,WH:21,HH:11,au:5,lk:1.26,ak:1.24}};
/* épaisseur des jambes : on élargit chaque jambe autour de son axe, sans dépasser les hanches */
const legX=(G,v)=>{const k=G.lk||1;if(k===1)return v;if(v<=25)return 25-(25-v)*k;return Math.min(Math.max(v,G.HH+2),25+(v-25)*k)};
const BODY_Y=206,BODY_L=672,BODY_K=.9;
function render(s,vb,p,showBg){
 const hk=(s.sexe==='f'&&TAILLE_F[s.taille])||TAILLE[s.taille]||1,wk=(CORP[s.corpulence]||CORP.moyenne).w,vh=+String(vb).split(/[ ,]+/)[3],up=vh>=600?(hk-1)*BODY_L:0;
 if(s.hair==='ananas'||s.hair==='chignonhaut'){let [x,y,w,h]=String(vb).split(/[ ,]+/).map(Number);const top=(s.hair==='ananas'?-46:-14)-up;if(y>top){const h2=h+(y-top),w2=w*h2/h;x-=(w2-w)/2;vb=[x,top,w2,h2].map(v=>+v.toFixed(1)).join(' ')}}
 const a=s.adj, sk=s.skin, skD=mix(sk,'#5a2412',.2), skDD=mix(sk,'#3a140a',.4), skL=mix(sk,'#ffd9b8',.22);
 const hc=s.hairColor, hD=shade(hc,-.38), hL=shade(hc,.28);
 const F=FACES[s.face]||FACES.joufflu, E=EYES[s.eyes]||EYES.grands;
 const lip=mix(sk,'#d9546a',.42);
 const dx=52+a.eyesX, cy=205+a.eyesY, sc=a.eyesS;
 let o=`<svg viewBox="${vb}" xmlns="http://www.w3.org/2000/svg" aria-hidden="true"><defs>
 <radialGradient id="${p}sk" cx="45%" cy="38%" r="68%"><stop offset="0" stop-color="${skL}"/><stop offset=".6" stop-color="${sk}"/><stop offset="1" stop-color="${skD}"/></radialGradient>
 <linearGradient id="${p}hr" x1="0" y1="0" x2=".45" y2="1"><stop offset="0" stop-color="${hL}"/><stop offset=".45" stop-color="${hc}"/><stop offset="1" stop-color="${hD}"/></linearGradient>
 <radialGradient id="${p}ir" cx="50%" cy="62%" r="60%"><stop offset="0" stop-color="${mix(s.iris,'#ffffff',.35)}"/><stop offset=".55" stop-color="${s.iris}"/><stop offset="1" stop-color="${shade(s.iris,-.5)}"/></radialGradient>
 <radialGradient id="${p}bl"><stop offset="0" stop-color="#ff6d6d" stop-opacity=".7"/><stop offset="1" stop-color="#ff6d6d" stop-opacity="0"/></radialGradient>
 <pattern id="${p}coil" width="10" height="10" patternUnits="userSpaceOnUse"><path d="M1,5 q2,-4 4,0 q2,4 4,0" fill="none" stroke="#000" stroke-opacity=".25" stroke-width="1.4"/><path d="M0,1 q2,-2 4,0" fill="none" stroke="#fff" stroke-opacity=".15" stroke-width="1"/></pattern>
 <pattern id="${p}hrib" width="9" height="18" patternUnits="userSpaceOnUse"><path d="M4.5,0 V18" stroke="#000" stroke-opacity=".16" stroke-width="2.2"/></pattern>
 <pattern id="${p}hmad" width="44" height="44" patternUnits="userSpaceOnUse"><rect x="0" y="14" width="44" height="11" fill="#d93b5e" opacity=".45"/><rect x="14" y="0" width="11" height="44" fill="#d93b5e" opacity=".35"/><rect x="0" y="33" width="44" height="3" fill="#2fa36b" opacity=".6"/><rect x="33" y="0" width="3" height="44" fill="#2fa36b" opacity=".5"/><rect x="0" y="5" width="44" height="2" fill="#fff" opacity=".4"/><rect x="5" y="0" width="2" height="44" fill="#fff" opacity=".35"/></pattern>
 ${E.w?`<clipPath id="${p}ec"><path d="${E.w}"/></clipPath>`:''}
 </defs>`;
 if(showBg) o+=bgLayer(s,p);
 o+=`<g transform="translate(0,${fx(-up)})">`;
 /* fond de chevelure : bouche les trous entre la tête et les cheveux avec la couleur des cheveux */
 const GAPF='M97,214 C93,188 92,160 94,138 C98,98 140,70 200,70 C260,70 302,98 306,138 C308,160 307,188 303,214Z';
 o+=`<g transform="${HT}">${s.hair&&s.hair!=='chauve'&&!HART(s)?`<path d="${GAPF}" fill="${shade(hc,-.22)}"/>`:''}${HART(s)?hairArt(s,'back',p):hairBack(s,p,hD)}</g>`;
 o+=`<g transform="translate(200,${BODY_Y}) scale(${wk},${+(hk*BODY_K).toFixed(3)}) translate(-200,-${BODY_Y})">`+body(s,p,sk,skD,skDD,skL)+'</g>';
 o+=`<g transform="${HT}">`+(HART(s)?'':hairMid(s,p,hD,hL));
 const outl=mix(sk,'#6a2e14',.42);[F.ex,400-F.ex].forEach((x,i)=>{const k=i?-1:1,big=s.face==='naturel',rx=big?21:17,ry=big?31:27,xx=x-(big?3*k:0);o+=`<ellipse cx="${xx}" cy="207" rx="${rx}" ry="${ry}" fill="url(#${p}sk)" stroke="${outl}" stroke-width="2.2" stroke-opacity=".55"/><ellipse cx="${xx+4*k}" cy="209" rx="${rx*.47}" ry="${ry*.55}" fill="${skD}" opacity=".6"/><path d="M${xx-8*k},${207-ry*.55} C${xx+6*k},${207-ry*.6} ${xx+8*k},${207+ry*.3} ${xx-2*k},${207+ry*.5}" fill="none" stroke="${outl}" stroke-width="2" stroke-linecap="round" opacity=".45"/>`});
 o+=`<path d="${F.d}" fill="url(#${p}sk)"/><path d="${F.d}" fill="none" stroke="${outl}" stroke-width="2.4" opacity=".5"/>`;
 const blush={aucune:0,rose:.55,fort:1}[s.cheeks]??0;
 if(blush) o+=`<clipPath id="${p}fcb"><path d="${F.d}"/></clipPath><g opacity="${blush}" clip-path="url(#${p}fcb)"><ellipse cx="128" cy="258" rx="30" ry="20" fill="url(#${p}bl)"/><ellipse cx="272" cy="258" rx="30" ry="20" fill="url(#${p}bl)"/></g>`;
 const rk={fines:1,marquees:2}[s.rides]||0;
 if(rk){const ew=35*sc,R=200+dx+ew,Lx=200-dx-ew,n=252+a.noseY,mo=285+a.mouthY;
  let w=`M176,${n+6} Q164,${n+26} 171,${mo+10} M224,${n+6} Q236,${n+26} 229,${mo+10}`;
  w+=`M${200+dx-20*sc},${cy+27*sc} Q${200+dx},${cy+35*sc} ${200+dx+20*sc},${cy+26*sc} M${200-dx+20*sc},${cy+27*sc} Q${200-dx},${cy+35*sc} ${200-dx-20*sc},${cy+26*sc}`;
  w+=`M166,${cy-76} Q200,${cy-83} 234,${cy-76}`;
  if(rk===2){w+=`M${R+2},${cy-6} l9,-6 M${R+3},${cy+2} l10,0 M${R+2},${cy+10} l9,6 M${Lx-2},${cy-6} l-9,-6 M${Lx-3},${cy+2} l-10,0 M${Lx-2},${cy+10} l-9,6`;
   w+=`M176,${cy-64} Q200,${cy-69} 224,${cy-64} M178,${mo+8} q-5,10 1,18 M222,${mo+8} q5,10 -1,18 M188,${cy-40} l4,10 M212,${cy-40} l-4,10`}
  o+=`<path d="${w}" fill="none" stroke="${skDD}" stroke-width="${rk===2?2.4:2.2}" stroke-linecap="round" opacity="${rk===2?.4:.34}"/>`}
 const nf={aucune:0,legeres:18,beaucoup:44}[s.freckles]??0;
 if(nf) o+=`<g fill="${skDD}" opacity=".5">`+FRECK.slice(0,nf).map(q=>`<circle cx="${q[0].toFixed(1)}" cy="${(q[1]+a.eyesY*.4).toFixed(1)}" r="${q[2].toFixed(2)}"/>`).join('')+`</g>`;
 if(s.barbe&&s.barbe!=='aucune'){const my=285+a.mouthY,bc=shade(hc,-.12),B=s.barbe;
  const LOW=`M88,${my-52} C112,${my-24} 146,${my-24} 170,${my-17} C186,${my-13} 214,${my-13} 230,${my-17} C254,${my-24} 288,${my-24} 312,${my-52} L330,380 L70,380Z`;
  const MO=`M176,${my-7} C184,${my-18} 195,${my-16} 200,${my-12} C205,${my-16} 216,${my-18} 224,${my-7} C215,${my-5} 207,${my-7} 200,${my-9} C193,${my-7} 185,${my-5} 176,${my-7}Z`;
  const CH=`M182,${my+11} C190,${my+7} 210,${my+7} 218,${my+11} C220,${my+24} 213,${my+33} 200,${my+35} C187,${my+33} 180,${my+24} 182,${my+11}Z`;
  o+=`<defs><clipPath id="${p}fcl"><path d="${F.d}"/></clipPath><clipPath id="${p}lowc"><path d="${LOW}"/></clipPath><pattern id="${p}bd" width="7" height="7" patternUnits="userSpaceOnUse"><circle cx="2" cy="2" r="1" fill="${bc}"/><circle cx="5.5" cy="5" r=".8" fill="${bc}"/></pattern></defs><g clip-path="url(#${p}fcl)">`;
  if(B==='duvet')o+=`<path d="${LOW}" fill="url(#${p}bd)" opacity=".28"/><path d="${MO}" fill="${bc}" opacity=".22"/>`;
  else if(B==='barbe3j')o+=`<path d="${LOW}" fill="${bc}" opacity=".22"/><path d="${LOW}" fill="url(#${p}bd)" opacity=".55"/><path d="${MO}" fill="${bc}" opacity=".35"/>`;
  else if(B==='moustache')o+=`<path d="${MO}" fill="${bc}"/>`;
  else if(B==='bouc')o+=`<path d="${MO}" fill="${bc}"/><path d="${CH}" fill="${bc}"/><path d="M196,${my+9} L200,${my+13} L204,${my+9}" fill="none" stroke="${bc}" stroke-width="3" stroke-linecap="round"/>`;
  else if(B==='collier')o+=`<path d="${F.d}" fill="none" stroke="${bc}" stroke-width="20" clip-path="url(#${p}lowc)"/><path d="${CH}" fill="${bc}"/>`;
  else if(B==='courte')o+=`<path d="${LOW}" fill="${bc}"/><path d="${LOW}" fill="url(#${p}bd)" opacity=".5" style="mix-blend-mode:multiply"/><path d="M110,${my-36} C140,${my-18} 170,${my-14} 182,${my-12} M290,${my-36} C260,${my-18} 230,${my-14} 218,${my-12}" fill="none" stroke="${shade(bc,.25)}" stroke-width="2" opacity=".35"/><path d="${MO}" fill="${shade(bc,-.1)}"/>`;
  o+=`</g>`}
 o+=`<g transform="translate(200,${252+a.noseY}) scale(${a.noseS})">${nose(s.nose,sk,skDD)}</g>`;
 o+=`<g transform="translate(200,${285+a.mouthY}) scale(${a.mouthS})">${mouth(s.mouth,lip,sk,p)}</g>`;
 if(EYEART(s))o+=`<g transform="translate(${200+dx},${cy}) scale(${sc},${sc})">${eyeArt(s,'d',p)}</g><g transform="translate(${200-dx},${cy}) scale(${sc},${sc})">${eyeArt(s,'g',p)}</g>`;
 else o+=`<g transform="translate(${200+dx},${cy}) scale(${sc},${sc})">${eye(E,1,p,skDD)}</g><g transform="translate(${200-dx},${cy}) scale(${-sc},${sc})">${eye(E,-1,p,skDD)}</g>`;
 const bx=55+a.browsX, by=cy-47+a.browsY, bc=s.browColor||hD;
 o+=`<g transform="translate(${200+bx},${by})">${brow(s.brows,bc,p+'brR')}</g><g transform="translate(${200-bx},${by}) scale(-1,1)">${brow(s.brows,bc,p+'brL')}</g>`;
 /* avec une coiffure décalquée, les cheveux couvrent les oreilles : la boucle est posée au bord du visage, sur la peau */
 o+=(HART(s)?hairArt(s,'front',p):hairFront(s,p,hD,hL))+edgesSVG(s,hD)+earrings(s.earrings,F.ex+(HART(s)&&!HART(s).ears?11:0),HART(s)&&!HART(s).ears?15:0)+hatSVG(s,p)+glasses(s.glasses,dx,cy,sc,F.ex)+'</g>';
 return o+'</g></svg>';
}
function bgLayer(s,p){const c=s.bgColor,c2=shade(c,c<'#5'?.08:-.07),R='x="-400" y="-400" width="1200" height="1800"';
 switch(s.bgPattern){
  case 'degrade':return `<defs><linearGradient id="${p}bg" gradientUnits="userSpaceOnUse" x1="0" y1="14" x2="0" y2="270"><stop offset="0" stop-color="${shade(c,.18)}"/><stop offset="1" stop-color="${shade(c,-.18)}"/></linearGradient></defs><rect ${R} fill="url(#${p}bg)"/>`;
  case 'pois':return `<defs><pattern id="${p}pt" width="22" height="22" patternUnits="userSpaceOnUse"><rect width="22" height="22" fill="${c}"/><circle cx="5.5" cy="5.5" r="2.8" fill="${c2}"/><circle cx="16.5" cy="16.5" r="2.8" fill="${c2}"/></pattern></defs><rect ${R} fill="url(#${p}pt)"/>`;
  case 'rayures':return `<defs><pattern id="${p}pt" width="16" height="16" patternUnits="userSpaceOnUse" patternTransform="rotate(35)"><rect width="16" height="16" fill="${c}"/><rect width="8" height="16" fill="${c2}"/></pattern></defs><rect ${R} fill="url(#${p}pt)"/>`;
  case 'rayons':{let r=`<rect ${R} fill="${c}"/><g fill="${c2}">`;for(let i=0;i<18;i+=2){const t1=i*20*Math.PI/180,t2=(i+1)*20*Math.PI/180;r+=`<path d="M200,120 L${200+1500*Math.cos(t1)},${120+1500*Math.sin(t1)} L${200+1500*Math.cos(t2)},${120+1500*Math.sin(t2)}Z"/>`}return r+'</g>'}
  default:return `<rect ${R} fill="${c}"/>`;
 }}

/* yeux décalqués sur la planche de Prescillia (EYE_ART, js/yeux-art.js) : vrais pixels du dessin, chaque œil tel qu'elle l'a dessiné ;
   l'iris est une image à part, recolorée (même rapport de couleur que l'iris choisi avec son « marron ») ; les styles de cils
   autres que « naturels » ajoutent des cils dessinés le long de sa paupière */
const EYE_OLD={grands:'grands',brillants:'grands',amande:'amande',ronds:'ronds',endormis:'tombantes',chat:'releves',doux:'amande',nets:'amandelong',rieurs:'petits'};
const EYE_REF='#5f3a23';
const eyeKey=k=>typeof EYE_ART==='undefined'?k:EYE_ART[k]?k:(EYE_OLD[k]||'amande');
const EYEART=s=>typeof EYE_ART!=='undefined'&&EYE_ART[eyeKey(s.eyes)];
/* eye-liner du haut et cils dessinés par le jeu (nets à toutes les tailles), d'après la planche : trait fin au coin intérieur,
   épais vers l'extérieur, queue relevée ; cils fins et effilés, plus longs et couchés vers l'extérieur, pointe recourbée.
   P = 9 points du haut de l'ouverture de l'œil (coin intérieur → extérieur), relevés sur la planche de Prescillia. */
const LASH_STY={naturels:{n:11,len:[2.5,6.5],w:1,tilt:[10,55],bend:.42,u0:.2},longs:{n:12,len:[3.5,10],w:1.05,tilt:[10,58],bend:.4,u0:.15},
 epais:{n:16,len:[3,7],w:1.5,tilt:[10,55],bend:.38,u0:.12},espaces:{n:6,len:[4,8],w:1.15,tilt:[12,55],bend:.4,u0:.28},recourbes:{n:12,len:[3.5,8.5],w:1.1,tilt:[2,40],bend:.8,u0:.15}};
function lidCurve(P,n){const o=[];for(let k=0;k<=n;k++){const q=k/n*(P.length-1),j=Math.min(P.length-2,Math.floor(q)),t=q-j,p0=P[Math.max(0,j-1)],p1=P[j],p2=P[j+1],p3=P[Math.min(P.length-1,j+2)],t2=t*t,t3=t2*t;
 o.push([0,1].map(c=>.5*(2*p1[c]+(-p0[c]+p2[c])*t+(2*p0[c]-5*p1[c]+4*p2[c]-p3[c])*t2+(-p0[c]+3*p1[c]-3*p2[c]+p3[c])*t3)))}return o}
function lidSVG(P,sty){if(!P||P.length<3)return '';const f=v=>v.toFixed(2),C=lidCurve(P,32),N=C.length,sx=Math.sign(C[N-1][0]-C[0][0])||1;
 const nrm=k=>{const a=C[Math.max(0,k-1)],b=C[Math.min(N-1,k+1)];let tx=b[0]-a[0],ty=b[1]-a[1];const l=Math.hypot(tx,ty)||1;tx/=l;ty/=l;let nx=ty,ny=-tx;if(ny>0){nx=-nx;ny=-ny}return [tx,ty,nx,ny]};
 const th=u=>.5+3.6*Math.pow(Math.min(u,.75)/.75,1.15)*(u>.75?1-Math.pow((u-.75)/.25,1.5)*.85:1),bot=[],top=[];
 C.forEach((p,k)=>{const u=k/(N-1),[,,nx,ny]=nrm(k),t=th(u);bot.push([p[0]-nx*1.4,p[1]-ny*1.4]);top.push([p[0]+nx*t,p[1]+ny*t])});
 /* pas de queue : le trait s'arrête au coin extérieur de l'œil, en s'affinant */
 const liner=`M${bot.map(q=>f(q[0])+','+f(q[1])).join(' L')} L${top.slice().reverse().map(q=>f(q[0])+','+f(q[1])).join(' L')}Z`;
 const L=LASH_STY[sty]||LASH_STY.naturels;let d='';
 for(let i=0;i<L.n;i++){const jit=((i*7919)%13)/13-.5,u=Math.min(.93,L.u0+(.93-L.u0)*(i+jit*.35)/(L.n-1)),k=Math.round(u*(N-1)),[tx,ty,nx,ny]=nrm(k),b=top[k];
  const a=(L.tilt[0]+(L.tilt[1]-L.tilt[0])*u*u)*Math.PI/180,dx=nx*Math.cos(a)+tx*Math.sin(a),dy=ny*Math.cos(a)+ty*Math.sin(a);
  const len=(L.len[0]+(L.len[1]-L.len[0])*Math.pow(u,1.6))*(1+jit*.18)+.8,hw=L.w/2,bx=b[0]-nx*.8,by=b[1]-ny*.8;
  const mx=bx+dx*len*.55,my=by+dy*len*.55,ex=mx+(dx*Math.cos(L.bend)+tx*Math.sin(L.bend))*len*.5,ey=my+(dy*Math.cos(L.bend)+ty*Math.sin(L.bend))*len*.5;
  const px=-dy*hw,py=dx*hw;d+=`M${f(bx+px)},${f(by+py)} Q${f(mx+px*.45)},${f(my+py*.45)} ${f(ex)},${f(ey)} Q${f(mx-px*.45)},${f(my-py*.45)} ${f(bx-px)},${f(by-py)}Z`}
 return `<path d="${liner}" fill="#141012"/><path d="${d}" fill="#141012"/>`}
function eyeArt(s,side,p){const k=eyeKey(s.eyes),A=EYE_ART[k][side],[x,y,w,h]=A,P=A.slice(7);
 const g=rgb(s.iris||EYE_REF).map((v,i)=>v/Math.max(1,rgb(EYE_REF)[i])),same=g.every(v=>Math.abs(v-1)<.03),id=p+'if'+side;
 return (same?'':`<defs><filter id="${id}" color-interpolation-filters="sRGB"><feColorMatrix type="matrix" values="${g[0].toFixed(3)} 0 0 0 0 0 ${g[1].toFixed(3)} 0 0 0 0 0 ${g[2].toFixed(3)} 0 0 0 0 0 1 0"/></filter></defs>`)
  +`<image href="assets/yeux/${k}-iris-${side}.png" x="${x}" y="${y}" width="${w}" height="${h}" preserveAspectRatio="none"${same?'':` filter="url(#${id})"`}/>`
  +`<image href="assets/yeux/${k}-${side}.png" x="${x}" y="${y}" width="${w}" height="${h}" preserveAspectRatio="none"/>`
  +lidSVG(P,s.cils)}
function eye(E,m,p,skDD){
 const ink='#1d1411';
 if(E.closed) return `<path d="M-26,6 C-14,-16 14,-16 28,4" fill="none" stroke="${ink}" stroke-width="6" stroke-linecap="round"/><path d="M26,2 L37,-7" stroke="${ink}" stroke-width="4" stroke-linecap="round"/>`;
 const r=E.ir, x=E.icx, y=E.icy;
 let s=`<path d="${E.w}" fill="#fdfcfb"/><g clip-path="url(#${p}ec)">
  <circle cx="${x}" cy="${y}" r="${r}" fill="url(#${p}ir)"/><circle cx="${x}" cy="${y}" r="${r*.52}" fill="#120c0a"/>
  <circle cx="${x+r*.34*m}" cy="${y-r*.34}" r="${r*(E.spark?.3:.22)}" fill="#fff"/>
  <circle cx="${x-r*.32*m}" cy="${y+r*.4}" r="${r*.1}" fill="#fff" opacity=".85"/>
  ${E.spark?`<circle cx="${x-r*.1*m}" cy="${y-r*.55}" r="${r*.09}" fill="#fff"/>`:''}
  <path d="${E.w}" fill="none" stroke="#000" stroke-opacity=".14" stroke-width="9"/></g>
  <path d="${E.lash}" fill="${ink}"/>`;
 if(E.w===BIG) s+=`<path d="M-24,22 C-10,34 14,34 26,20" fill="none" stroke="${skDD}" stroke-width="1.6" opacity=".55"/>`;
 return s;
}
/* sourcils d'après la planche de Prescillia : forme (début, sommet, queue), épaisseur, et texture de poils
   (début fondu en petits poils obliques, corps dense, queue fine). Repère : début (côté nez) en x=-30, queue en x=31 */
const BROWS={naturels:{pk:.56,h:5,hi:5,ht:2,w0:6,wm:6.8},legers:{pk:.6,h:7.5,hi:6,ht:5,w0:6,wm:7},arques:{pk:.62,h:11,hi:7,ht:8,w0:5.8,wm:6.8},
 droits:{pk:.72,h:1.5,hi:2,ht:3.5,w0:6.4,wm:7},epais:{pk:.6,h:5.5,hi:5,ht:4,w0:9,wm:10},fins:{pk:.58,h:7,hi:5,ht:5,w0:3,wm:3.4},
 moyens:{pk:.6,h:7.5,hi:6,ht:6,w0:5,wm:5.4},fournis:{pk:.55,h:8.5,hi:6,ht:7,w0:10.5,wm:11.5},angle:{pk:.66,h:10,hi:7,ht:9,w0:6,wm:7,ang:1},
 clean:{pk:.64,h:9,hi:6,ht:8,w0:7.2,wm:8,ang:.6,net:1}};
const BROWC=['#1e1714','#3d2a1f','#6b4630'];
function browArt(B,c,id){
 const N=24,X0=-30,X1=31,px=X0+(X1-X0)*B.pk,f=v=>v.toFixed(1);
 /* ligne du milieu : monte du début au sommet, redescend jusqu'à la queue (arrondi, ou cassé pour « angle ») */
 const cy=t=>{const x=X0+(X1-X0)*t;
  if(x<=px){const u=(x-X0)/(px-X0),k=Math.sin(u*Math.PI/2);return B.hi+(-B.h-B.hi)*(B.ang?(1-B.ang)*k+B.ang*u:k)}
  const u=(x-px)/(X1-px);return -B.h+(B.ht+B.h)*(B.ang?(1-B.ang)*(1-Math.cos(u*Math.PI/2))+B.ang*Math.pow(u,1.3):1-Math.cos(u*Math.PI/2))};
 const w=t=>t<.22?B.w0+(B.wm-B.w0)*t/.22:t<B.pk?B.wm:B.wm*Math.max(.1,1-Math.pow((t-B.pk)/(1-B.pk),1.2)*.92);
 const sl=t=>(cy(Math.min(1,t+.02))-cy(Math.max(0,t-.02)))/((X1-X0)*.04);
 const P=[];for(let i=0;i<=N;i++){const t=i/N,dy=sl(t),l=Math.hypot(1,dy);P.push({t,x:X0+(X1-X0)*t,y:cy(t),nx:dy/l,ny:-1/l,w:w(t)})}
 const up=P.map(q=>[q.x+q.nx*q.w*.58,q.y+q.ny*q.w*.58]),lo=P.map(q=>[q.x-q.nx*q.w*.42,q.y-q.ny*q.w*.42]).reverse();
 const q0=P[0],hc=[q0.x-q0.w*.5,q0.y+q0.w*.1];   /* début arrondi */
 const d='M'+up.concat([[X1+1.2,cy(1)+.5]],lo).map(q=>f(q[0])+','+f(q[1])).join(' L')+` Q${f(hc[0])},${f(hc[1])} ${f(up[0][0])},${f(up[0][1])}Z`;
 const dk=shade(c,-.45),lt=shade(c,.3),net=B.net;
 let o=`<defs><linearGradient id="${id}g" x1="${f(X0-B.w0*.5)}" x2="${X1}" y1="0" y2="0" gradientUnits="userSpaceOnUse"><stop offset="0" stop-color="${c}" stop-opacity="${net?.7:.05}"/><stop offset=".3" stop-color="${c}" stop-opacity="${net?.92:.72}"/><stop offset=".75" stop-color="${c}" stop-opacity="${net?.97:.85}"/><stop offset="1" stop-color="${c}" stop-opacity=".8"/></linearGradient>`
  +`<clipPath id="${id}c"><path d="${d}"/></clipPath><filter id="${id}f" x="-10%" y="-40%" width="120%" height="180%"><feGaussianBlur stdDeviation="${net?.18:.38}"/></filter></defs>`;
 o+=`<path d="${d}" fill="url(#${id}g)" filter="url(#${id}f)"/>`;
 /* poils : traits fins dans le sens de la pousse (presque verticaux au début, couchés vers la queue), quelques-uns dépassent du bord */
 let a0='',a1='',a2='';const R=(i,m,k)=>((i*m+k)%101)/101;
 for(let i=0;i<120;i++){const t=Math.pow(R(i,37,5),1.15)*.97,q=P[Math.min(N,Math.round(t*N))],x0=X0+(X1-X0)*t,y0=cy(t),ww=w(t),
  off=(R(i,53,29)-.55)*.9,bx=x0+q.nx*ww*off,by=y0+q.ny*ww*off,ang=Math.atan(sl(t))-(t<.25?.9-t*1.6:.38),Ln=(t<.25?ww*.7:1.8+ww*.3)*(.7+R(i,19,7)*.5);
  const seg=`M${f(bx)},${f(by)} L${f(bx+Math.cos(ang)*Ln)},${f(by+Math.sin(ang)*Ln)} `;if(i%4==0)a2+=seg;else if(t<.22)a0+=seg;else a1+=seg}
 const sw=B.w0<4?.32:.42;
 o+=`<path d="${a0}" stroke="${dk}" stroke-width="${sw}" stroke-linecap="round" opacity="${net?.3:.5}" fill="none"/>`;   /* début : les poils dépassent (fondu) */
 o+=`<g clip-path="url(#${id}c)"><path d="${a1}" stroke="${dk}" stroke-width="${sw}" stroke-linecap="round" opacity="${net?.4:.6}" fill="none"/><path d="${a2}" stroke="${lt}" stroke-width="${sw*.8}" stroke-linecap="round" opacity=".3" fill="none"/></g>`;
 return o}
function brow(t,c,id){return browArt(BROWS[t]||BROWS.naturels,c,id)}
function nose(t,sk,skDD){
 const tip=mix(sk,'#e2766a',.22);
 switch(t){
  case 'petit':return `<path d="M-7,3 Q0,9 7,3" fill="none" stroke="${skDD}" stroke-width="2.6" stroke-linecap="round" opacity=".75"/>`;
  case 'pointu':return `<path d="M-1,-24 L8,5 Q2,10 -6,6" fill="none" stroke="${skDD}" stroke-width="2.6" stroke-linecap="round" stroke-linejoin="round" opacity=".7"/>`;
  case 'aucun':return '';
  case 'rond':return `<path d="M-20,4 C-20,-14 20,-14 20,4 C20,16 -20,16 -20,4Z" fill="${mix(sk,'#c9785a',.28)}"/><ellipse cx="-4" cy="-3" rx="6" ry="3.6" fill="#fff" opacity=".45"/><path d="M-10,11 Q0,15 10,11" fill="none" stroke="${skDD}" stroke-width="1.8" stroke-linecap="round" opacity=".35"/>`;
  default:return `<ellipse rx="17" ry="13" fill="${tip}"/><ellipse cx="-5" cy="-5" rx="6" ry="3.5" fill="#fff" opacity=".35"/><path d="M-9,7 Q-4,11 0,9 Q4,11 9,7" fill="none" stroke="${skDD}" stroke-width="2" stroke-linecap="round" opacity=".45"/>`;
 }}
/* bouches décalquées sur la planche de Prescillia (MOUTH_ART, js/bouches-art.js) : vrais pixels du dessin ;
   la couleur des lèvres suit la peau (même rapport que lip=mix(peau, rose) entre la peau du joueur et celle du modèle) */
const MOUTHS=typeof MOUTH_ART!=='undefined'?Object.keys(MOUTH_ART):['naturelle'],MOUTH_REF_SKIN='#a65e3f',MOUTH_OLD={sourire:'remontante',grand:'entrouverte',neutre:'fermee',surpris:'entrouverte',malicieux:'asymetrique',moue:'ronde'};
function mouth(t,lip,sk,p){
 if(typeof MOUTH_ART==='undefined')return '';
 const k=MOUTH_ART[t]?t:(MOUTH_OLD[t]||'naturelle'),[x,y,w,h]=MOUTH_ART[k];
 const g=rgb(lip).map((v,i)=>v/Math.max(1,rgb(mix(MOUTH_REF_SKIN,'#d9546a',.42))[i]));
 const same=g.every(v=>Math.abs(v-1)<.03),id=p+'mf';
 return (same?'':`<defs><filter id="${id}" color-interpolation-filters="sRGB"><feColorMatrix type="matrix" values="${g[0].toFixed(3)} 0 0 0 0 0 ${g[1].toFixed(3)} 0 0 0 0 0 ${g[2].toFixed(3)} 0 0 0 0 0 1 0"/></filter></defs>`)
  +`<image href="assets/bouches/${k}.png" x="${x}" y="${y}" width="${w}" height="${h}" preserveAspectRatio="none"${same?'':` filter="url(#${id})"`}/>`;
}
/* ---------- corps réaliste ---------- */
const GEO={f:{SH:70,WH:50,HH:59,au:15,f:1},m:{SH:80,WH:58,HH:58,au:18,f:0},nb:{SH:74,WH:53,HH:58,au:16,f:0}};
const lerp=(a,b,t)=>a+(b-a)*t;
const fx=n=>(+n).toFixed(1);
const pts=a=>a.map(q=>fx(q[0])+','+fx(q[1])).join(' L');
function sideX(G,y){const P=G.f?[[206,16],[214,G.SH-20],[222,G.SH-2],[234,G.SH],[266,G.SH-14],[280,G.SH-14.5],[300,G.SH-13],[316,G.SH-15],[330,G.WH-2],[348,G.WH-4],[363,G.WH-6],[380,G.WH-4],[392,G.WH],[402,G.HH-4],[432,G.HH],[480,G.HH-1]]:[[206,16],[214,G.SH-20],[222,G.SH-2],[234,G.SH],[266,G.SH-5],[316,G.WH+7],[372,G.WH],[432,G.HH],[480,G.HH-1]];
 if(y<=P[0][0])return P[0][1];for(let i=1;i<P.length;i++)if(y<=P[i][0]){const [y0,x0]=P[i-1],[y1,x1]=P[i];return lerp(x0,x1,(y-y0)/(y1-y0))}return P[P.length-1][1]}
function sidePts(G,y0,h,ext){const L=[],R=[];for(let y=y0;y<h;y+=8){const e=ext*Math.min(1,Math.max(0,(y-222)/80)),x=sideX(G,y)+e;L.push([200-x,y]);R.push([200+x,y])}const x=sideX(G,h)+ext;L.push([200-x,h]);R.push([200+x,h]);return [L,R]}
/* profil de l'épaule (cou → bras), partagé par le corps, les bras et tous les vêtements :
   pente douce du trapèze puis un grand arrondi jusqu'au bras (fini l'épaule carrée) */
function bez(a,b,c,d,n){const o=[];for(let i=1;i<=n;i++){const t=i/n,u=1-t;o.push([u*u*u*a[0]+3*u*u*t*b[0]+3*u*t*t*c[0]+t*t*t*d[0],u*u*u*a[1]+3*u*u*t*b[1]+3*u*t*t*c[1]+t*t*t*d[1]])}return o}
/* ox = bord extérieur du bras à la hauteur 246 (là où l'arrondi rejoint le bras) */
const armOut=(G,k,e)=>edge(armPts(G,k).O,246)+k*(e||0);
function shProf(G,k,ox){if(ox==null)ox=armOut(G,k);
 const P0=[200+k*15,213],T=[200+k*(G.SH-13),227.5],E=[ox,AY(258)];
 return [P0,...bez(P0,[200+k*29,218.5],[200+k*(G.SH-26),224],T,10),...bez(T,[T[0]+k*9,230.5],[ox-k*1,238],E,12)]}
function shY(G,k,x,ox){const P=shProf(G,k,ox),X=k*(x-200);if(X<=16)return 206;for(let i=1;i<P.length;i++){const a=k*(P[i-1][0]-200),b=k*(P[i][0]-200);if(X<=b)return P[i-1][1]+(P[i][1]-P[i-1][1])*((X-a)/((b-a)||1))}return P[P.length-1][1]}
const profTo=(G,k,lim,ox)=>shProf(G,k,ox).filter(q=>k*(q[0]-200)<=lim+.01);
function torsoD(G,h,ext,neck){
 ext=ext||0;neck=neck||'crew';
 if(neck==='cami'){const [L,R]=sidePts(G,274,h,ext);return `M155,266 Q200,310 245,266 L${pts(R)} L${pts(L.slice().reverse())}Z`}
 if(neck==='tube'){const [L,R]=sidePts(G,268,h,ext);return `M${fx(L[0][0])},268 Q200,262 ${fx(R[0][0])},268 L${pts(R)} L${pts(L.slice().reverse())}Z`}
 if(neck==='halter'){const [L,R]=sidePts(G,278,h,ext);return `M186,209 L214,209 Q${fx(R[0][0]-6)},250 ${fx(R[0][0])},278 L${pts(R)} L${pts(L.slice().reverse())} Q${fx(L[0][0]+6)},250 186,209Z`}
 if(neck==='tank'){const [L,R]=sidePts(G,284,h,ext),yl=fx(shY(G,-1,166)+1),yr=fx(shY(G,1,234)+1),yi=fx(shY(G,-1,175)+1);return `M166,${yl} L175,${yi} C175,262 184,268 200,268 C216,268 225,262 225,${yi} L234,${yr} L234,258 Q234,280 ${fx(R[0][0])},284 L${pts(R)} L${pts(L.slice().reverse())} Q166,280 166,258 L166,${yl}Z`}
 if(neck==='off'){const [L,R]=sidePts(G,244,h,ext),sh=sideX(G,240)+ext*.3+3;return `M${fx(200-sh)},240 Q200,252 ${fx(200+sh)},240 L${pts(R)} L${pts(L.slice().reverse())}Z`}
 const [L,R]=sidePts(G,222,h,ext),sh=sideX(G,222);
 if(neck==='scoopw'){const PL=profTo(G,-1,sh).filter(q=>q[0]<=160),PR=profTo(G,1,sh).filter(q=>q[0]>=240),Lf2=L.filter(q=>q[1]>=244),Rf2=R.filter(q=>q[1]>=244);
  return `M${pts(PL)} L${pts(Lf2)} L${pts(Rf2.slice().reverse())} L${pts(PR.reverse())} C238,262 222,282 200,282 C178,282 162,262 ${fx(PL[0][0])},${fx(PL[0][1])}Z`}
 if(neck==='cv'){const PL=profTo(G,-1,sh).filter(q=>q[0]<=172),PR=profTo(G,1,sh).filter(q=>q[0]>=228),Lf2=L.filter(q=>q[1]>=244),Rf2=R.filter(q=>q[1]>=244);
  return `M${pts(PL)} L${pts(Lf2)} L${pts(Rf2.slice().reverse())} L${pts(PR.reverse())} L200,326Z`}
 if(neck==='square'){const PL=profTo(G,-1,sh).filter(q=>q[0]<=160),PR=profTo(G,1,sh).filter(q=>q[0]>=240),Lf2=L.filter(q=>q[1]>=244),Rf2=R.filter(q=>q[1]>=244);
  return `M${pts(PL)} L${pts(Lf2)} L${pts(Rf2.slice().reverse())} L${pts(PR.reverse())} L238,274 L162,274Z`}
 const Lf=L.filter(q=>q[1]>=244),Rf=R.filter(q=>q[1]>=244);
 const head=`M${pts(profTo(G,-1,sh))} L${pts(Lf)}`;
 if(neck==='asym')return head+` L${pts(R.slice().reverse().filter(q=>q[1]>=272))} Q${fx(200+30)},246 185,217Z`;
 const nl={scoop:'Q200,250 185,217',square:'L236,236 L234,266 L166,266 L164,236 L185,217',v:'L200,262 L185,217',deepv:'L200,294 L185,217',cardi:'L200,330 L185,217',flat:'L185,217'}[neck]||'Q200,231 185,217';
 return head+` L${pts(Rf.slice().reverse())} L${pts(profTo(G,1,sh).reverse())} ${nl}Z`;
}
/* bras : on garde les mêmes repères mais tout ce qui est sous l'épaule est allongé */
const ARMK=1.08,AY=y=>y<=236?y:236+(y-236)*ARMK;
function armPts(G,k){const sx=200+k*(G.SH-9),ex=200+k*(G.SH+2.5),wx=200+k*(G.SH+2.5),au=G.au,ak=G.ak||1,e=12.5*ak,w=8.5*(1+(ak-1)*.5);
 return {sx,wx,au,O:[[sx+k*au,236],[ex+k*e,381],[wx+k*w,446]],I:[[200+k*(G.SH-16),272],[ex-k*e,381],[wx-k*w,446]]}}
function edge(P,y){if(P.length===3&&y>P[0][1]&&y<P[2][1]){const [[x0,y0],[x1,y1],[x2,y2]]=P;return x0*(y-y1)*(y-y2)/((y0-y1)*(y0-y2))+x1*(y-y0)*(y-y2)/((y1-y0)*(y1-y2))+x2*(y-y0)*(y-y1)/((y2-y0)*(y2-y1))}if(y<=P[0][1])return P[0][0];for(let i=1;i<P.length;i++)if(y<=P[i][1]){return lerp(P[i-1][0],P[i][0],(y-P[i-1][1])/(P[i][1]-P[i-1][1]))}return P[P.length-1][0]}
function armD(G,k,yEnd,ext,yTop){
 const A=armPts(G,k),e=ext||(()=>0);yEnd=yEnd||446;
 const o=[],i=[];for(let y=236;y<yEnd;y+=10)o.push([edge(A.O,y)+k*e(y),AY(y)]);o.push([edge(A.O,yEnd)+k*e(yEnd),AY(yEnd)]);
 for(let y=yEnd;y>272;y-=10)i.push([edge(A.I,y)-k*e(y),AY(y)]);i.push([edge(A.I,272)-k*e(272),AY(272)]);
 const sx=A.sx,au=A.au+e(236);
 if(yTop)return `M${fx(edge(A.I,272)-k*e(272))},${fx(AY(272))} L${fx(sx-k*(au-6))},${yTop+6} L${fx(sx+k*au)},${yTop} L${pts(o.filter(q=>q[1]>yTop))} L${pts(i)}Z`;
 const pr=shProf(G,k,edge(A.O,246)+k*e(246)).filter(q=>k*(q[0]-200)>=G.SH-16);
 return `M${pts(i.slice(-1))} C${fx(sx-k*(au-2))},${fx(AY(250))} ${fx(sx-k*12)},240 ${pts(pr.slice(0,1))} L${pts(pr)} L${pts(o.filter(q=>q[1]>Math.max(246.5,pr[pr.length-1][1]+1)))} L${pts(i)}Z`;
}
function handD(G,k){const w=armPts(G,k).wx,Y=v=>fx(AY(v));return `M${fx(w-k*8.5)},${Y(442)} C${fx(w-k*13)},${Y(470)} ${fx(w-k*10)},${Y(510)} ${fx(w+k*1)},${Y(520)} C${fx(w+k*10)},${Y(512)} ${fx(w+k*12)},${Y(472)} ${fx(w+k*8.5)},${Y(442)}Z`}
function legD(G,k,foot){const x=v=>fx(200+k*legX(G,v)),H=G.HH;
 return `M${x(H)},432 C${x(H+1)},480 ${x(60)},525 ${x(59)},563 C${x(57)},595 ${x(50)},640 ${x(48)},661 C${x(49)},680 ${x(51)},695 ${x(50.6)},705 C${x(51)},730 ${x(50)},745 ${x(49.5)},750 C${x(48)},770 ${x(46)},780 ${x(44)},795 C${x(42)},808 ${x(37)},822 ${x(35)},${foot?`838 C${x(36)},841 ${x(44)},846 ${x(46)},866 L${x(0)},866 C${x(1)},846 ${x(9)},841 ${x(11.5)},838`:`840 L${x(11.5)},840`} C${x(11.5)},822 ${x(11.8)},808 ${x(12)},795 C${x(11.5)},780 ${x(10.5)},760 ${x(10)},750 C${x(9)},730 ${x(8.5)},715 ${x(8.5)},705 C${x(8.5)},690 ${x(8.5)},670 ${x(8.5)},661 C${x(7)},640 ${x(6)},625 ${x(5.8)},616 C${x(4)},595 ${x(2)},575 ${x(2)},563 C${x(2)},530 ${x(1)},500 ${x(0)},478Z`}
const BOTTOMS=['droit','large','flare','cordon','jogging','yoga','short','jupe','jupejean','cycliste'];
function pantsLegD(G,k,t){const x=v=>fx(200+k*legX(G,v)),H=G.HH;
 switch(t){
  case 'large':return `M${x(H+2)},428 C${x(H+5)},540 ${x(66)},700 ${x(70)},858 Q${x(36)},868 ${x(1)},858 L${x(1)},478 L${x(1)},434Z`;
  case 'cordon':return `M${x(H+2)},428 C${x(H+4)},540 ${x(62)},700 ${x(63)},854 Q${x(34)},860 ${x(2)},854 L${x(1)},478 L${x(1)},434Z`;
  case 'flare':return `M${x(H+1)},428 C${x(H+2)},520 ${x(53)},598 ${x(52)},650 C${x(54)},730 ${x(66)},800 ${x(72)},858 Q${x(40)},866 ${x(3)},858 C${x(6)},800 ${x(9)},724 ${x(11)},650 C${x(8)},592 ${x(3)},526 ${x(1)},478 L${x(1)},434Z`;
  case 'yoga':return `M${x(H)},428 C${x(H+1)},520 ${x(51)},598 ${x(49)},650 C${x(52)},730 ${x(62)},800 ${x(68)},858 Q${x(38)},864 ${x(4)},858 C${x(7)},800 ${x(10)},724 ${x(11)},650 C${x(8)},592 ${x(3)},526 ${x(0)},478 L${x(1)},434Z`;
  case 'jogging':return `M${x(H+3)},428 C${x(H+8)},540 ${x(62)},690 ${x(54)},814 L${x(44)},848 L${x(10)},848 L${x(5)},814 C${x(3)},700 ${x(2)},560 ${x(1)},478 L${x(1)},434Z`;
  case 'cycliste':return `M${x(H)},428 C${x(H+1)},480 ${x(H-1)},540 ${x(52)},596 Q${x(28)},604 ${x(4)},596 L${x(1)},478 L${x(1)},434Z`;
  case 'short':return `M${x(H+1)},428 C${x(H+3)},480 ${x(H+3)},520 ${x(H+2)},560 L${x(5)},560 L${x(1)},478 L${x(1)},434Z`;
  default:return `M${x(H+1)},428 C${x(H+2)},540 ${x(56)},690 ${x(56)},854 L${x(5)},854 C${x(6)},700 ${x(4)},560 ${x(1)},478 L${x(1)},434Z`;
 }}
const DENIM=['#86a6cc','#5b7fb5','#2f4a78','#9aa0a6','#1f2127'];
const LN=(dd,col,w,op,dash)=>`<path d="${dd}" fill="none" stroke="${col}" stroke-width="${w}" stroke-linecap="round" stroke-linejoin="round" opacity="${op??1}"${dash?` stroke-dasharray="${dash}"`:''}/>`;
function bottomsSVG(G,s,p){const t=s.bottom,b=s.bottomColor,H=G.HH,wx=sideX(G,404)+1.5,dk=shade(b,-.3);
 const dn=['droit','large','flare','short'].includes(t)&&DENIM.includes(b),st=dn?'#d6a35c':shade(b,-.22);
 const d=`<defs><linearGradient id="${p}pl" x1="0" y1="0" x2="1" y2="0"><stop offset="0" stop-color="${shade(b,-.22)}"/><stop offset=".45" stop-color="${shade(b,.1)}"/><stop offset=".7" stop-color="${b}"/><stop offset="1" stop-color="${shade(b,-.18)}"/></linearGradient><pattern id="${p}ht" width="6" height="6" patternUnits="userSpaceOnUse"><circle cx="1" cy="2" r=".8" fill="#fff" fill-opacity=".28"/><circle cx="4" cy="5" r=".8" fill="#000" fill-opacity=".12"/></pattern><pattern id="${p}tw" width="5" height="5" patternUnits="userSpaceOnUse" patternTransform="rotate(-35)"><path d="M0,0 V5" stroke="#000" stroke-opacity=".07" stroke-width="1.4"/></pattern></defs>`;
 let o='';
 if(t==='jupejean'){/* jupe trapèze courte en jean : surpiqûres dorées, bouton, poches */
  const sk=`M${fx(200-wx)},404 Q200,410 ${fx(200+wx)},404 C${200+H+9},462 ${200+H+19},512 ${200+H+25},548 Q200,553 ${200-H-25},548 C${200-H-19},512 ${200-H-9},462 ${fx(200-wx)},404Z`,ts='#d6a35c';
  o+=`<path d="${sk}" fill="url(#${p}pl)"/><path d="${sk}" fill="url(#${p}tw)"/>`;
  o+=`<path d="M${fx(200-wx)},404 Q200,410 ${fx(200+wx)},404 L${fx(200+wx+1)},418 Q200,424 ${fx(200-wx-1)},418Z" fill="${shade(b,-.06)}"/>`;
  o+=LN(`M${fx(200-wx)},417 Q200,423 ${fx(200+wx)},417`,ts,1.3,.9,'3 2')+LN('M204,420 L204,551',ts,1.3,.9,'3 2')+LN(`M${200-H-21},540 Q200,548 ${200+H+21},540`,ts,1.3,.9,'3 2');
  o+=LN(`M${fx(200-wx+3)},421 Q${fx(200-wx+14)},446 174,424 M${fx(200+wx-3)},421 Q${fx(200+wx-14)},446 226,424`,ts,1.3,.9,'3 2')+`<circle cx="200" cy="411" r="2.6" fill="#c8a24a"/>`;
  o+=LN(`M${200-H+4},476 L${200-H-10},544 M${200+H-4},476 L${200+H+10},544`,dk,1.6,.3);
  return d+o;
 }
 if(t==='jupe'){
  const sk=`M${fx(200-wx)},404 Q200,410 ${fx(200+wx)},404 C${200+H+8},470 ${200+H+24},520 ${200+H+30},568 Q200,582 ${200-H-30},568 C${200-H-24},520 ${200-H-8},470 ${fx(200-wx)},404Z`;
  o+=`<path d="${sk}" fill="url(#${p}pl)"/>`;
  for(let i=-3;i<=3;i++)o+=LN(`M${200+i*14},420 L${200+i*30},576`,dk,2,.45)+LN(`M${200+i*14+4},420 L${200+i*30+9},576`,shade(b,.25),1.2,.4);
  o+=`<path d="M${fx(200-wx)},404 Q200,410 ${fx(200+wx)},404 L${fx(200+wx+1)},420 Q200,426 ${fx(200-wx-1)},420Z" fill="${shade(b,-.08)}"/>`;
  return d+o;
 }
 o+=`<path d="M${fx(200-wx)},404 Q200,410 ${fx(200+wx)},404 L${200+H+1},432 L${200+H+1},448 L${200-H-1},448 L${200-H-1},432Z" fill="${shade(b,.02)}"/>`;
 [-1,1].forEach(k=>{const D=pantsLegD(G,k,t);o+=`<path d="${D}" fill="url(#${p}pl)"/>`+(dn?`<path d="${D}" fill="url(#${p}tw)"/>`:'')+(t==='jogging'?`<path d="${D}" fill="url(#${p}ht)"/>`:'')});
 if(t==='yoga')o+=`<path d="M${fx(200-wx)},404 Q200,410 ${fx(200+wx)},404 L${fx(200+wx+1)},432 Q200,438 ${fx(200-wx-1)},432Z" fill="${shade(b,.14)}"/>`;
 else o+=LN(`M${fx(200-wx)},417 Q200,423 ${fx(200+wx)},417`,dk,1.5,.5);
 if(dn){o+=LN('M206,420 C208,444 206,460 200,474',st,1.4,.9,'3 2')+LN(`M${fx(200-wx+3)},421 Q${fx(200-wx+14)},446 174,424`,st,1.4,.9,'3 2')+LN(`M${fx(200+wx-3)},421 Q${fx(200+wx-14)},446 226,424`,st,1.4,.9,'3 2')
  +[-1,1].map(k=>`<ellipse cx="${200+k*28}" cy="${t==='short'?500:566}" rx="11" ry="${t==='short'?26:64}" fill="#fff" opacity=".1"/>`).join('')
  +`<rect x="${fx(200-wx+10)}" y="404" width="4" height="13" fill="${dk}" opacity=".5"/><rect x="${fx(200+wx-14)}" y="404" width="4" height="13" fill="${dk}" opacity=".5"/><circle cx="200" cy="411" r="2.6" fill="#c8a24a"/>`
  +(t!=='short'?[-1,1].map(k=>LN(`M${200+k*(H+1)},440 C${200+k*(H+2)},560 ${200+k*56},700 ${200+k*56},840`,st,1.2,.6,'3 2')).join(''):'');}
 else if(t!=='yoga')o+=LN('M200,420 L200,470',dk,1.5,.35);
 if(t==='jogging'||t==='cordon')o+=LN('M196,418 C194,436 190,446 188,458 M204,418 C206,436 210,446 212,458',lum(b)>.8?'#a9a294':'#f4f1ea',2,.95);
 if(t==='jogging')[-1,1].forEach(k=>{o+=`<path d="M${200+k*45},818 L${200+k*9},818 L${200+k*10},848 L${200+k*44},848Z" fill="${dk}" opacity=".3"/>`;for(let j=0;j<7;j++)o+=LN(`M${200+k*(13+j*5)},821 L${200+k*(13+j*5)},846`,dk,1,.35)});
 if(['large','cordon','jogging'].includes(t))[-1,1].forEach(k=>{o+=LN(`M${200+k*44},620 Q${200+k*36},680 ${200+k*44},760 M${200+k*22},700 Q${200+k*30},760 ${200+k*24},830 M${200+k*50},500 Q${200+k*40},540 ${200+k*46},580`,dk,2,.22)});
 if(['large','flare','cordon','yoga'].includes(t))[-1,1].forEach(k=>{o+=LN(`M${200+k*60},842 Q${200+k*40},852 ${200+k*8},846`,dk,2,.3)});
 if(t==='short')[-1,1].forEach(k=>{o+=LN(`M${200+k*(H+2)},552 L${200+k*5},552`,dk,2,.4)});
 if(t==='cycliste'){o+=`<path d="M${fx(200-wx)},404 Q200,410 ${fx(200+wx)},404 L${fx(200+wx+1)},424 Q200,430 ${fx(200-wx-1)},424Z" fill="${shade(b,.1)}"/>`;[-1,1].forEach(k=>{o+=LN(`M${fx(200+k*legX(G,51))},590 Q${fx(200+k*legX(G,28))},597 ${fx(200+k*legX(G,5))},590`,dk,2,.4)+LN(`M${fx(200+k*legX(G,G.HH-2))},450 Q${fx(200+k*legX(G,G.HH+1))},520 ${fx(200+k*legX(G,50))},588`,shade(b,.25),3,.35)})}
 return d+o;
}
const SHOES=['basses','montantes','running','retro','sabots','bottes','fourrees','sandales','ballerines'];
/* chaussures décalquées sur le modèle de Prescillia (js/chaussures-art.js, tools/traceur-chaussures.py) :
   la couleur du modèle est rendue telle quelle ; une autre couleur teinte le dessus et garde semelle, lacets et coutures */
const SHOE_MODEL={basses:[['basses','#f4f1ea']],running:[['epaisses','#f4f1ea'],['running_noire','#1f2127'],['running','#b8b6b0']],retro:[['retro_creme','#e9dfc8'],['retro','#6b2a2e']],sabots:[['sabots','#c49a6c']],ballerines:[['ballerines','#f2c6d3']]};
function shoeArt(t,c,sk,skFill){if(typeof SHOE_ART==='undefined'||!SHOE_MODEL[t])return '';
 const L=SHOE_MODEL[t],hit=L.find(m=>m[1]===c),pick=hit||(lum(c)>.8?L[0]:L[L.length-1]),A=SHOE_ART[pick[0]];if(!A)return '';
 /* couleur du modèle : on affiche le dessin de Prescillia lui-même (assets/chaussures), le pied à la couleur de peau */
 if(hit&&A.img){const [ix,iy,iw,ih]=A.img,sk0=A.layers.find(l=>l[0]==='skin');
  /* dessus du pied (ballerines) : forme du modèle, ombrée comme la jambe, qui part de la largeur de la cheville */
  const foot=sk0&&t!=='ballerines'?`<path d="${sk0[1]}" fill="${skFill||sk}" stroke="none"/>`:'';
  return foot+`<image href="assets/chaussures/${pick[0]}.png" x="${ix}" y="${iy}" width="${iw}" height="${ih}" preserveAspectRatio="none"/>`}
 const lm=lum(A.main),tint=f=>{if(hit)return f;const dc=Math.hypot(...rgb(f).map((v,i)=>v-rgb(A.main)[i]));return dc<45?shade(c,Math.max(-.6,Math.min(.6,(lum(f)-lm)*1.6))):f};
 return `<g stroke="none">`+A.layers.map(([k,d,f,cy])=>`<path d="${d}" fill="${k==='skin'?sk:k==='sil'?tint(f):(cy!=null&&cy>25&&!hit&&lum(A.main)>.8)?f:tint(f)}"/>`).join('')+`<path d="${A.layers.find(l=>l[0]==='sil')[1]}" fill="none" stroke="${hit?A.edge:shade(c,-.45)}" stroke-width=".8" stroke-linejoin="round" opacity=".8"/></g>`}
/* chaussures vues de face (modèle de Prescillia, docs/references/chaussures.png) : x local > 0 = côté intérieur du pied */
function shoeSVG(t,c,sk){const art=shoeArt(t,c,sk);if(art)return art;const d=shade(c,-.22),dd=shade(c,-.4),l=shade(c,.25),W='#f7f5ef',WD='#d9d5cc',light=lum(c)>.72;
 const P=(dd2,f,x)=>`<path d="${dd2}" fill="${f}"${x||''}/>`;
 const UPPER='M-14,-22 C-18,-14 -21,-2 -22,10 C-23,20 -21,26 -15,28 L15,28 C21,26 23,20 22,10 C21,-2 18,-14 14,-22 Q0,-17 -14,-22Z';
 const TOE='M-22,8 C-18,0 18,0 22,8 C23,18 20,28 0,28.5 C-20,28 -23,18 -22,8Z';
 const COLLAR='M-13,-24 Q0,-29 13,-24 L14,-17 Q0,-21 -14,-17Z';
 const TONGUE='M-7,-26 Q0,-28 7,-26 L8,0 Q0,2 -8,0Z';
 const sole=(f,H)=>{const y=42-H;return P(`M-21,${y} C-24,${fx(y+H*.15)} -25,${fx(y+H*.55)} -23,${fx(y+H*.8)} C-21,41 -17,42 -12,42 L12,42 C17,42 21,41 23,${fx(y+H*.8)} C25,${fx(y+H*.55)} 24,${fx(y+H*.15)} 21,${y} C12,${y+5} -12,${y+5} -21,${y}Z`,f)+LN(`M-23.5,${fx(y+H*.5)} Q0,${fx(y+H*.5+4)} 23.5,${fx(y+H*.5)}`,shade(f,-.12),1.2,.7)};
 const laces=(col,n,y0)=>{let o='';for(let i=0;i<n;i++){const y=y0+i*6.5;o+=`<path d="M-10,${fx(y+1)} Q0,${fx(y-1)} 10,${fx(y+1)} Q11.5,${fx(y+2.6)} 10,${fx(y+4)} Q0,${fx(y+2)} -10,${fx(y+4)} Q-11.5,${fx(y+2.6)} -10,${fx(y+1)}Z" fill="${col}" stroke-opacity=".16"/>`}
  return LN(`M-8,${y0+4} L8,${y0+6.5} M8,${y0+4} L-8,${y0+6.5}`+(n>2?` M-8,${y0+10.5} L8,${y0+13} M8,${y0+10.5} L-8,${y0+13}`:''),shade(col,-.3),1,.35)+o};
 const shine=`<ellipse cx="-6" cy="12" rx="9" ry="5" fill="#fff" opacity=".4" stroke="none"/>`,side=col=>LN('M-15,-15 C-19,-3 -18,8 -21,16 M15,-15 C19,-3 18,8 21,16',col,1.1,.35),eye=col=>LN('M-12,-21 C-10,-11 -11,-3 -13,3 Q0,8 13,3 C11,-3 10,-11 12,-21',col,1.1,.5);
 const sneaker=(up,lace,soleCol,h,extra)=>sole(soleCol,h)+P(COLLAR,shade(up,-.14))+P(UPPER,up)+P(TONGUE,shade(up,.03),' stroke-opacity=".05"')+eye(shade(up,-.2))+side(shade(up,-.22))+P(TOE,up,' stroke-opacity=".08"')+LN('M-21,7 C-12,1 12,1 21,7',shade(up,-.2),1.2,.55)+(extra||'')+laces(lace,3,-21)+shine;
 switch(t){
  case 'running':return sneaker(c,light?'#ffffff':shade(c,.18),W,19,light?'':P('M-22,6 C-16,3 -12,14 -16,26 L-22,24Z',l,' opacity=".6"'));
  case 'retro':{const ov=light?'#a49d92':shade(c,-.2),gum='#c98b4e';
   return P(COLLAR,shade(c,-.14))+P(UPPER,c)+P(TONGUE,shade(c,.08))+P(TOE,ov)+P('M-23,4 C-17,2 -14,12 -18,24 L-23,20Z',ov)+LN('M-21,7 C-12,1 12,1 21,7',shade(ov,-.2),1.3,.6)+laces(light?'#fbf8f1':shade(c,.3),3,-21)+sole(gum,17)}
  case 'sabots':return P('M-14,-12 Q0,-17 14,-12 L15,-4 Q0,-9 -15,-4Z',dd)+P('M-17,-10 C-22,-2 -24,9 -23,19 C-22,26 -16,29 0,29.5 C16,29 22,26 23,19 C24,9 22,-2 17,-10 Q0,-3 -17,-10Z',c)+`<ellipse cx="-5" cy="10" rx="9" ry="5" fill="#fff" opacity=".22" stroke="none"/>`+LN('M-16,-9 Q0,-2 16,-9',d,1.6,.7)+sole(shade(c,-.25),12);
  case 'ballerines':return P('M-12,-12 C-15,-2 -18,6 -19,14 L19,14 C18,6 15,-2 12,-12Z',sk)+P('M-21,8 C-16,4 -8,7 0,7 C8,7 16,4 21,8 C23,18 21,27 14,29 L-14,29 C-21,27 -23,18 -21,8Z',c)+LN('M-20,8 C-14,5 -7,8 0,8 C7,8 14,5 20,8',dd,1.4,.6)
   +`<ellipse cx="-5" cy="18" rx="8" ry="4" fill="#fff" opacity=".3" stroke="none"/><path d="M0,11 L-7,7 Q-9,11 -7,15Z M0,11 L7,7 Q9,11 7,15Z" fill="${shade(c,-.18)}"/><circle cx="0" cy="11" r="2.2" fill="#fbf6f2"/>`+P('M-21,25 C-21,31 -17,33 -12,33 L12,33 C17,33 21,31 21,25 C12,29 -12,29 -21,25Z',shade(c,-.45));
  case 'sandales':return P('M-12,-12 C-15,-2 -18,8 -19,18 C-19,24 -14,28 0,28 C14,28 19,24 19,18 C18,8 15,-2 12,-12Z',sk)+[-11,-4,3,10].map(x=>`<ellipse cx="${x}" cy="25" rx="3.2" ry="2.6" fill="${shade(sk,.08)}" stroke-opacity=".12"/>`).join('')
   +LN('M-17,6 L17,6',c,5,1)+LN('M-13,-6 L13,-6',c,4,1)+P('M-21,27 C-21,33 -16,35 -11,35 L11,35 C16,35 21,33 21,27 C12,30 -12,30 -21,27Z',shade(c,-.25));
  case 'montantes':return P('M-22,-48 C-21,-34 -18,-20 -16,-14 L16,-14 C16,-20 15,-34 15,-48Z',c)+P('M-22,-48 Q-4,-53 15,-48 L15,-42 Q-4,-47 -22,-42Z',shade(c,-.3))+P('M-8,-50 Q0,-52 8,-50 L9.5,5 Q0,8 -9.5,5Z',shade(c,.06))
   +laces(light?'#ffffff':shade(c,.3),3,-44)+P(UPPER,c)+P(TONGUE,shade(c,.06))+P(TOE,shade(c,-.04))+LN('M-21,7 C-12,1 12,1 21,7',shade(c,-.22),1.3,.6)+laces(light?'#ffffff':shade(c,.3),3,-21)+shine+sole(W,15);
  case 'bottes':return P('M-29,-206 L19,-206 C19,-160 17,-110 15,-60 C14,-40 15,-24 16,-14 L-16,-14 C-18,-30 -21,-50 -24,-80 C-27,-120 -29,-160 -29,-206Z',c)+P('M-29,-206 L19,-206 L19,-197 L-29,-197Z',dd)+LN('M-12,-194 C-11,-140 -9,-80 -5,-20',l,3,.4)
   +P('M-16,-16 C-21,-6 -24,6 -23,18 C-22,27 -16,30 0,30.5 C16,30 22,27 23,18 C24,6 21,-6 16,-16Z',c)+`<ellipse cx="-5" cy="10" rx="8" ry="5" fill="#fff" opacity=".2" stroke="none"/>`+sole(dd,11);
  case 'fourrees':return P('M-23,-46 L16,-46 C17,-30 17,-14 17,-8 L-17,-8 C-19,-20 -22,-34 -23,-46Z',c)+[-19,-10,-1,8,15].map(x=>`<circle cx="${x}" cy="-47" r="6.5" fill="#f3eadb" stroke-opacity=".1"/>`).join('')
   +P('M-17,-12 C-22,-2 -24,9 -23,19 C-22,27 -16,30 0,30.5 C16,30 22,27 23,19 C24,9 22,-2 17,-12Z',c)+LN('M-17,-10 Q0,-4 17,-10',d,1.6,.5)+`<ellipse cx="-5" cy="10" rx="9" ry="5" fill="#fff" opacity=".2" stroke="none"/>`+sole(shade(c,-.3),11);
  default:/* basses en toile : semelle plus fine, bout caoutchouc */
   return P(COLLAR,shade(c,-.14))+P(UPPER,c)+P(TONGUE,shade(c,.06))+P(TOE,shade(c,-.03))+LN('M-21,7 C-12,1 12,1 21,7',shade(c,-.2),1.3,.6)
    +LN('M-19,-6 C-15,0 -15,8 -17,12 M19,-6 C15,0 15,8 17,12',shade(c,-.2),1,.45,'2 2')+laces(light?'#ffffff':shade(c,.3),3,-21)+shine+sole(W,13)+P('M-20,24 C-12,27 12,27 20,24 L19,29 C10,31 -10,31 -19,29Z',WD,' opacity=".55"');
 }}
function shoesSVG(s,sk,G,skD,skL,p){const art=typeof SHOE_ART!=='undefined'&&!!SHOE_MODEL[s.shoes],lk=(CORP[s.corpulence]||CORP.moyenne).lk,w=['bottes','fourrees'].includes(s.shoes)?lk:1+(lk-1)*.4,sc=w*(art?1.12:1),g0=art?null:shoeSVG(s.shoes,s.shoesColor,sk);
 return `<g stroke-opacity=".18">`+[-1,1].map(k=>{const T=200+k*(art?23:24.5);let g=g0;
  if(art){/* la peau de la cheville dans la chaussure reprend exactement le dégradé de la jambe */
   let a=1e9,b=-1e9;if(G)for(const m of legD(G,k).matchAll(/(-?[\d.]+),/g)){const v=+m[1];a=Math.min(a,v);b=Math.max(b,v)}
   const L=x=>fx((x-T)/(-k*sc)),gid=(p||'')+'pd'+k,grad=G?`<defs><linearGradient id="${gid}" gradientUnits="userSpaceOnUse" x1="${L(a)}" y1="0" x2="${L(b)}" y2="0"><stop offset="0" stop-color="${skD}"/><stop offset=".45" stop-color="${skL}"/><stop offset=".7" stop-color="${sk}"/><stop offset="1" stop-color="${skD}"/></linearGradient></defs>`:'';
   g=grad+shoeArt(s.shoes,s.shoesColor,sk,G?`url(#${gid})`:sk);
   /* ballerines : le pied prolonge la jambe (même forme, même dégradé), découpé par l'ouverture de la chaussure */
   const A=SHOE_ART.ballerines,op=s.shoes==='ballerines'&&G&&A&&A.layers.find(l=>l[0]==='skin');
   if(op){const sy=+((1.12)/BODY_K).toFixed(3),cid=(p||'')+'bo'+k;g=`<defs><clipPath id="${cid}"><path d="${op[1]}${A.layers.find(l=>l[0]==='sil')[1]}M-30,-60 L30,-60 L30,${fx(A.top+3)} L-30,${fx(A.top+3)}Z"/></clipPath><linearGradient id="${cid}g" gradientUnits="userSpaceOnUse" x1="${fx(a)}" y1="0" x2="${fx(b)}" y2="0"><stop offset="0" stop-color="${skD}"/><stop offset=".45" stop-color="${skL}"/><stop offset=".7" stop-color="${sk}"/><stop offset="1" stop-color="${skD}"/></linearGradient></defs><g clip-path="url(#${cid})" stroke="none"><path transform="scale(${fx(1/(-k*sc))},${fx(1/sy)}) translate(${-T},-838)" d="${legD(G,k,1)}" fill="url(#${cid}g)"/></g>`+g}}
  return `<g transform="translate(${T},838) scale(${fx(-k*sc)},${+((art?1.12:1)/BODY_K).toFixed(3)})" stroke="#000" stroke-width="1.2">${g}</g>`}).join('')+'</g>'}
const DR={moulante:{hem:560,flare:2,neck:'strap',cami:1},maille:{hem:610,flare:4,neck:'crew',rib:1},robecol:{hem:575,flare:40,neck:'crew',sl:300,sx:4,collarw:1,seam:1},
 bretfleur:{hem:585,flare:40,neck:'sweet',cami:1,print:3,seam:1,ties:1},boutonnee:{hem:610,flare:26,neck:'square',cami:1,btns:1,seam:1},volants:{hem:590,flare:46,neck:'square',cami:1,tiers:1},fleurie:{hem:585,flare:40,neck:'sweet',cami:1,print:2,seam:1,ties:1},maxi:{hem:820,flare:-10,hug:1,neck:'strap',cami:1,slit:1},longue:{hem:812,flare:46,neck:'square',strap:6,print:1,seam:1},nuisette:{hem:700,flare:20,neck:'strap',strap:2.5,satin:1},tshirtdress:{hem:600,flare:16,neck:'crew',sl:302,sx:6,ext:6},
 portefeuille:{hem:620,flare:30,neck:'deepv',sl:400,sx:4,wrap:1,ext:2,seam:1},bretelles:{hem:590,flare:44,neck:'square',strap:11,print:1,seam:1},
 madras:{hem:780,flare:64,neck:'off',sl:300,sx:7,madras:1,seam:1},pull:{hem:560,flare:4,neck:'turtle',sl:446,sx:3,rib:1,ext:3}};
function gownD(G,D){
 const ext=D.ext||0,h=D.hem,H=G.HH+ext+(D.hug?0:4),hw=G.HH+D.flare;
 const y0=D.neck==='strap'||D.neck==='square'||D.neck==='sweet'?262:D.neck==='off'?244:222;
 const [L,R]=sidePts(G,y0,372,ext),xw=sideX(G,372)+ext;
 const mid=D.hug?`L${pts(L)} C${fx(200-H-2)},420 ${fx(200-H)},470 ${fx(200-H)},520 C${fx(200-H)},600 ${fx(200-hw)},${h-120} ${fx(200-hw)},${h} Q200,${h+8} ${fx(200+hw)},${h} C${fx(200+hw)},${h-120} ${fx(200+H)},600 ${fx(200+H)},520 C${fx(200+H)},470 ${fx(200+H+2)},420 ${fx(200+xw)},372 L${pts(R.slice().reverse())}`
  :`L${pts(L)} C${fx(200-H)},440 ${fx(200-hw+6)},${h-80} ${fx(200-hw)},${h} Q200,${h+12} ${fx(200+hw)},${h} C${fx(200+hw-6)},${h-80} ${fx(200+H)},440 ${fx(200+xw)},372 L${pts(R.slice().reverse())}`;
 const a=L[0][0],b=R[0][0];
 if(D.neck==='square')return `M${fx(a)},${y0} ${mid} L${fx(a)},${y0}Z`;
 if(D.neck==='sweet')return `M${fx(a)},${y0} ${mid} Q${fx(b-8)},${y0-8} 214,${y0+2} Q206,${y0-2} 200,${y0+12} Q194,${y0-2} 186,${y0+2} Q${fx(a+8)},${y0-8} ${fx(a)},${y0}Z`;
 if(D.neck==='strap')return `M${fx(a)},${y0} ${mid} Q216,${y0-12} 200,${y0+8} Q184,${y0-12} ${fx(a)},${y0}Z`;
 if(D.neck==='off')return `M${fx(a)},${y0} Q200,${y0+12} ${fx(b)},${y0} L${pts(R)} ${mid.replace('L'+pts(L),'').replace('L'+pts(R.slice().reverse()),'')}Z`.replace(/ L\s*$/,'');
 const sh=sideX(G,222),nl=D.neck==='deepv'?'L200,294 L185,217':'Q200,231 185,217';
 const mid2=mid.replace('L'+pts(L),'L'+pts(L.filter(q=>q[1]>=244))).replace('L'+pts(R.slice().reverse()),'L'+pts(R.filter(q=>q[1]>=244).reverse()));
 return `M${pts(profTo(G,-1,sh))} ${mid2} L${pts(profTo(G,1,sh).reverse())} ${nl}Z`;
}
function dressSVG(G,s,p,K,J){
 const D=DR[s.dress],c=s.dressColor,dk=shade(c,-.3),lt=shade(c,.22),{LM,sk}=K,h=D.hem,hw=G.HH+D.flare;
 let o=`<defs><linearGradient id="${p}dr" x1="0" y1="0" x2="1" y2="0"><stop offset="0" stop-color="${shade(c,-.22)}"/><stop offset=".42" stop-color="${shade(c,.1)}"/><stop offset=".66" stop-color="${c}"/><stop offset="1" stop-color="${shade(c,-.22)}"/></linearGradient></defs>`;
 const bare=D.neck==='off',straps=D.neck==='strap'||D.neck==='square'||D.neck==='sweet';
 if(bare)o+=[-1,1].map(k=>`<path d="${armD(G,k)}" fill="url(#${p}lm${k<0?'L':'R'})"/>`).join('')+yokeSVG(G,p,sk,252,false);
 let gd=gownD(G,D);
 if(D.neck==='off'){const [L,R]=sidePts(G,244,372,D.ext||0),xw=sideX(G,372)+(D.ext||0),H=G.HH+(D.ext||0)+4;
  gd=`M${fx(L[0][0])},244 Q200,256 ${fx(R[0][0])},244 L${pts(R)} C${fx(200+H)},440 ${fx(200+hw-6)},${h-80} ${fx(200+hw)},${h} Q200,${h+12} ${fx(200-hw)},${h} C${fx(200-hw+6)},${h-80} ${fx(200-H)},440 ${fx(200-xw)},372 L${pts(L.slice().reverse())}Z`}
 o+=`<path d="${gd}" fill="url(#${p}dr)"/>`;
 if(D.madras)o+=`<path d="${gd}" fill="url(#${p}mad)"/>`;
 if(D.print===2||D.print===3)o+=`<defs><pattern id="${p}flo2" width="16" height="16" patternUnits="userSpaceOnUse"><g fill="${D.print===3?'#4a6fc0':'#fff'}" opacity=".85"><circle cx="4" cy="4" r="1.3"/><circle cx="2.4" cy="4" r="1"/><circle cx="5.6" cy="4" r="1"/><circle cx="4" cy="2.4" r="1"/><circle cx="4" cy="5.6" r="1"/><circle cx="12" cy="11" r="1.1"/><circle cx="10.6" cy="11" r=".8"/><circle cx="13.4" cy="11" r=".8"/><circle cx="12" cy="9.6" r=".8"/><circle cx="12" cy="12.4" r=".8"/></g><path d="M6,7 q2,1 3,3 M14,14 q-2,0 -3,1" stroke="#fff" stroke-opacity=".5" stroke-width=".6" fill="none"/></pattern></defs><path d="${gd}" fill="url(#${p}flo2)"/>`;
 else if(D.print)o+=`<path d="${gd}" fill="url(#${p}flo)"/>`;
 if(D.rib)o+=`<path d="${gd}" fill="url(#${p}rib)"/>`;
 if(G.f)o+=bustSVG(p,c,.85,gd);
 if(D.satin)o+=LN('M176,300 C172,420 166,560 172,690',lt,6,.35)+LN('M226,310 C230,430 234,560 228,692',lt,4,.25);
 for(let i=-2;i<=2;i++)o+=LN(`M${200+i*14},${D.neck==='turtle'?470:392} Q${200+i*18},${(392+h)/2} ${fx(200+i*hw/2.6)},${h-4}`,dk,2,.22);
 if(D.seam)o+=LN(`M${fx(200-sideX(G,372))},372 Q200,378 ${fx(200+sideX(G,372))},372`,dk,2,.4);
 if(D.wrap)o+=LN('M185,217 L200,294 L238,372',dk,2,.55)+`<ellipse cx="244" cy="374" rx="10" ry="6" fill="${shade(c,-.08)}"/><ellipse cx="226" cy="374" rx="10" ry="6" fill="${shade(c,-.08)}"/>`+LN('M236,378 L232,420 M240,378 L248,414',shade(c,-.08),5);
 if(D.neck==='crew')o+=LN('M185,217 Q200,231 215,217',dk,3,.6);
 if(D.neck==='deepv')o+=LN('M185,217 L200,294 L215,217',dk,2.4,.7);
 if(D.neck==='turtle')o+=`<path d="M185,164 Q200,160 215,164 L217,212 Q200,220 183,212Z" fill="${shade(c,-.06)}"/><path d="M185,164 Q200,160 215,164 L217,212 Q200,220 183,212Z" fill="url(#${p}rib)"/>`;
 if(D.neck==='off')o+=LN(`M${fx(200-sideX(G,244)-2)},244 Q200,256 ${fx(200+sideX(G,244)+2)},244`,lt,7,.9);
 o+=LN(`M${fx(200-hw)},${h-2} Q200,${h+10} ${fx(200+hw)},${h-2}`,dk,2,.35);
 if(D.neck==='sweet')o+=LN(`M186,264 Q193,258 200,274 Q207,258 214,264`,dk,2,.5);
 if(D.collarw)o+=`<path d="M185,215 Q174,234 194,236 L200,226Z" fill="#f4f1ea"/><path d="M215,215 Q226,234 206,236 L200,226Z" fill="#f4f1ea"/>`+LN('M185,215 Q174,234 194,236 L200,226 L206,236 Q226,234 215,215','#c9c4b8',1,.8);
 if(D.btns)for(let y=280;y<h-10;y+=28)o+=`<circle cx="200" cy="${y}" r="3" fill="${shade(c,-.35)}"/>`;
 if(D.tiers)[h-120,h-62].forEach(y=>{const x=hw*(.55+.45*(y-372)/(h-372));let w='';for(let i=0;i<=8;i++){const xx=200-x+i*x/4;w+=(i?' Q'+fx(xx-x/8)+','+(y+5)+' ':'M')+fx(xx)+','+y}o+=LN(w,dk,2,.45)});
 if(D.ties)o+=LN('M200,274 L196,284 M200,274 L204,284',shade(c,-.35),1.4,.8);
 if(D.slit){const x0=200+G.HH*.35;o+=`<path d="M${fx(x0-6)},${h} L${fx(x0)},${h-170} L${fx(x0+14)},${h}Z" fill="${shade(sk,-.06)}"/>`+LN(`M${fx(x0)},${h-170} L${fx(x0-6)},${h} M${fx(x0)},${h-170} L${fx(x0+14)},${h}`,dk,1.4,.5)}
 o+=J.torso+(bare?'':[-1,1].map(k=>`<path d="${armD(G,k)}" fill="url(#${p}lm${k<0?'L':'R'})"/>`).join(''));
 if(straps)o+=yokeSVG(G,p,sk,D.cami?270:264,true);
 /* bretelles comme le débardeur blanc : fines, verticales, du bord du buste jusqu'au haut de l'épaule */
 if(D.cami){const stD=`M155,267 L153,${fx(shY(G,-1,153)+1.5)} M245,267 L247,${fx(shY(G,1,247)+1.5)}`;o+=LN(stD,c,3)+LN(stD,dk,1,.35)}
 if(D.strap)o+=LN(`M${D.neck==='square'||D.neck==='sweet'?172:178},262 L162,${fx(shY(G,-1,162)+1)} M${D.neck==='square'?228:222},262 L238,${fx(shY(G,1,238)+1)}`,c,D.strap);
 if(D.sl){const ex=()=>D.sx,yTop=D.neck==='off'?248:null;[-1,1].forEach(k=>{o+=`<path d="${armD(G,k,D.sl,ex,yTop)}" fill="url(#${p}dr)"/>`+(D.madras?`<path d="${armD(G,k,D.sl,ex,yTop)}" fill="url(#${p}mad)"/>`:'')+(D.rib?`<path d="${armD(G,k,D.sl,ex,yTop)}" fill="url(#${p}rib)"/>`:'')+(yTop?'':capPatch(G,p,k,'dr'+k,c,JKS,JKS,Math.max(G.HH+D.flare,torHalf(G,372,D.ext||0)),D.sx,Math.min(262,D.sl-6)))})}
 if(G.f&&D.sl&&!(s.jacket&&JK[s.jacket]))[-1,1].forEach(k=>{o+=bustLine(G,k,c,D.sx,D.neck==='off'?254:258)});
 o+=J.sleeves+[-1,1].map(k=>{const w=armPts(G,k).wx;return `<path d="${handD(G,k)}" fill="${sk}"/><ellipse cx="${fx(w-k*9)}" cy="${fx(AY(460))}" rx="3.6" ry="9" transform="rotate(${k*14} ${fx(w-k*9)} ${fx(AY(460))})" fill="${shade(sk,-.08)}"/>`}).join('');
 return o;
}
const JK={kimono:{h:500,ext:13,open:46,flo:1,wide:1,trim:1,sl:396},matelassee:{h:378,ext:10,closed:1,quilt:1,collar:'stand',band:1},cardigan:{h:486,ext:11,open:22,rib:1,btn:1,pockets:1},
 jean:{h:446,ext:10,open:14,shirt:1,denim:1,band:1,flaps:1},blazer:{h:476,ext:11,open:30,lapel:1},bomber:{h:440,ext:12,closed:1,collar:'rib',band:1}};
function panelD(G,J){const [L]=sidePts(G,222,J.h,J.ext),sh=sideX(G,222)+2,g=J.open;
 return `M${pts(profTo(G,-1,sh).filter(q=>q[0]<=186))} L${pts(L.filter(q=>q[1]>=244))} L${fx(200-g*.5)},${J.h} L${fx(200-g*.5-2)},300 L192,214Z`}
function jacketParts(G,s,p,sx){
 if(!s.jacket||!JK[s.jacket])return {torso:'',sleeves:''};
 const J=JK[s.jacket],c=s.jacketColor,dk=shade(c,-.3),h=J.h,F=`url(#${p}jk)`;
 const ov=d=>(J.quilt?`<path d="${d}" fill="url(#${p}qlt)"/>`:'')+(J.rib?`<path d="${d}" fill="url(#${p}rib)"/>`:'')+(J.denim?`<path d="${d}" fill="url(#${p}tw2)"/>`:'')+(J.flo?`<path d="${d}" fill="url(#${p}flo)"/>`:'');
 let t=`<defs><linearGradient id="${p}jk" x1="0" y1="0" x2="1" y2="0"><stop offset="0" stop-color="${shade(c,-.22)}"/><stop offset=".42" stop-color="${shade(c,.1)}"/><stop offset=".66" stop-color="${c}"/><stop offset="1" stop-color="${shade(c,-.22)}"/></linearGradient></defs>`;
 if(J.closed){const d=torsoD(G,h,J.ext,'crew');t+=`<path d="${d}" fill="${F}"/>`+ov(d)+LN(`M200,214 L200,${h}`,shade(c,-.42),2.4)+`<rect x="197" y="236" width="6" height="12" rx="2" fill="#c9c4b8"/>`;
  const col='M182,196 Q200,204 218,196 L220,214 Q200,226 180,214Z';t+=`<path d="${col}" fill="${J.collar==='rib'?dk:shade(c,-.08)}"/>`+(J.collar==='rib'?`<path d="${col}" fill="url(#${p}rib)"/>`:'');
  if(J.band){const x=sideX(G,h)+J.ext;t+=`<path d="M${fx(200-x)},${h-13} L${fx(200+x)},${h-13} L${fx(200+x)},${h} L${fx(200-x)},${h}Z" fill="${J.collar==='rib'?dk:shade(c,-.08)}"/><path d="M${fx(200-x)},${h-13} L${fx(200+x)},${h-13} L${fx(200+x)},${h} L${fx(200-x)},${h}Z" fill="url(#${p}rib)"/>`}}
 else{const pd=panelD(G,J),x=sideX(G,h)+J.ext,g=J.open*.5;
  [-1,1].forEach(k=>{t+=(k===1?'<g transform="translate(400,0) scale(-1,1)">':'<g>')+`<path d="${pd}" fill="${F}"/>`+ov(pd)+(J.band?`<path d="M${fx(200-x)},${h-13} L${fx(200-g)},${h-13} L${fx(200-g)},${h} L${fx(200-x)},${h}Z" fill="${shade(c,-.1)}"/>`:'')+LN(`M${fx(200-g-2)},300 L${fx(200-g)},${h}`,dk,2,.5)+'</g>'});
  if(J.trim)[-1,1].forEach(k=>{t+=(k===1?'<g transform="translate(400,0) scale(-1,1)">':'<g>')+LN(`M190,214 L${fx(200-g-3)},300 L${fx(200-g-1)},${h}`,shade(c,-.28),8,1)+LN(`M190,214 L${fx(200-g-3)},300 L${fx(200-g-1)},${h}`,shade(c,.2),1.4,.6)+'</g>'});
  if(J.lapel)[-1,1].forEach(k=>{t+=`<path d="M${200+k*8},212 L${200+k*32},226 L${200+k*20},264 L${fx(200+k*(g+2))},318Z" fill="${shade(c,-.12)}"/>`});
  if(J.shirt)[-1,1].forEach(k=>{t+=`<path d="M${200+k*12},204 L${200+k*34},220 L${200+k*26},246 L${200+k*10},216Z" fill="${shade(c,-.08)}"/>`});
  if(J.btn)for(let y=300;y<h-20;y+=40)t+=`<circle cx="${fx(200-g-6)}" cy="${y}" r="3.6" fill="${dk}"/>`;
  if(J.lapel)t+=`<circle cx="${fx(200-g-5)}" cy="392" r="4" fill="${dk}"/>`;
  if(J.flaps)[-1,1].forEach(k=>{t+=`<path d="M${200+k*22},288 L${200+k*52},288 L${200+k*50},304 L${200+k*37},310 L${200+k*24},304Z" fill="${shade(c,-.06)}" stroke="#d6a35c" stroke-width="1" stroke-dasharray="2 2"/>`});
  if(J.pockets)[-1,1].forEach(k=>{t+=`<path d="M${200+k*22},${h-80} L${200+k*54},${h-80} L${200+k*54},${h-30} L${200+k*22},${h-30}Z" fill="none" stroke="${dk}" stroke-width="2" opacity=".45"/>`});}
 let sl='';[-1,1].forEach(k=>{const yE=J.sl||446,exf=J.wide?(y=>sx+5+Math.max(0,y-262)/8):(()=>sx+5),d=armD(G,k,yE,exf);sl+=`<path d="${d}" fill="${F}"/>`+ov(d);const A=armPts(G,k),e=sx+5.5;
  if(J.wide){const a=edge(A.O,yE)+k*exf(yE),b2=edge(A.I,yE)-k*exf(yE);sl+=LN(`M${fx(a)},${fx(AY(yE)-1)} L${fx(b2)},${fx(AY(yE)-1)}`,shade(c,-.28),6,1)}
  else sl+=`<path d="M${fx(edge(A.O,432)+k*e)},${fx(AY(432))} L${fx(edge(A.O,446)+k*e)},${fx(AY(446))} L${fx(edge(A.I,446)-k*e)},${fx(AY(446))} L${fx(edge(A.I,432)-k*e)},${fx(AY(432))}Z" fill="${J.collar==='rib'?dk:shade(c,-.1)}"/>`;
  sl+=LN(`M${fx(edge(A.O,330)+k*e)},${fx(AY(330))} Q${fx(edge(A.O,345)+k*(e-6))},${fx(AY(346))} ${fx(edge(A.O,362)+k*e)},${fx(AY(362))}`,dk,1.6,.3);const th=torHalf(G,J.h,J.ext);sl+=capPatch(G,p,k,'jc'+k,c,JKS,JKS,J.closed?th:(x=>colAt(c,JKS,k<0?(x-(200-th))/(192-(200-th)):((200+th)-x)/((200+th)-208))),sx+5,262)});
 return {torso:t,sleeves:sl};
}
function accSVG(G,s){let o='';const bc=s.bagColor,bd=shade(bc,-.3);
 if(s.necklace==='chaine')o+=LN('M186,214 Q200,262 214,214','#d4af37',1.6)+`<circle cx="200" cy="244" r="3.6" fill="#d4af37"/>`;
 if(s.necklace==='perles')for(let i=0;i<=14;i++){const t=i/14,x=(1-t)*(1-t)*184+2*(1-t)*t*200+t*t*216,y=(1-t)*(1-t)*212+2*(1-t)*t*256+t*t*212;o+=`<circle cx="${fx(x)}" cy="${fx(y)}" r="2.7" fill="#f6f1e6" stroke="#c9bfa9" stroke-width=".6"/>`}
 if(s.necklace==='rasdecou')o+=`<path d="M186,198 Q200,204 214,198 L214,205 Q200,211 186,205Z" fill="#1f2127"/>`;
 if(s.bag==='bandouliere'){const x=200+G.HH;o+=LN(`M${200-G.SH+14},216 L${x-4},408`,bd,4)+`<rect x="${x-18}" y="398" width="44" height="34" rx="7" fill="${bc}"/>`+LN(`M${x-18},409 L${x+26},409`,bd,2)+`<circle cx="${x+4}" cy="415" r="2.4" fill="#d4af37"/>`}
 if(s.bag==='tote'){const x=200-G.SH-4;o+=LN(`M${x+14},218 C${x+4},260 ${x-4},300 ${x-8},330 M${x+22},220 C${x+20},260 ${x+18},300 ${x+16},330`,bd,3.4)+`<path d="M${x-26},330 L${x+30},330 L${x+36},412 L${x-32},412Z" fill="${bc}"/>`+LN(`M${x-26},342 L${x+30},342`,bd,1.4,.5)}
 if(s.bag==='banane')o+=LN(`M${200-G.SH+12},218 L${200+G.WH+4},372`,bd,5)+`<path d="M168,268 Q200,256 232,276 Q236,300 224,304 Q196,300 166,292Z" fill="${bc}"/>`+LN('M170,282 Q200,276 228,290',bd,1.6,.8,'2 2');
 return o;
}
function hatSVG(s,p){const c=s.hatColor,d=shade(c,-.3);
 switch(s.hat){
  case 'casquette':return `<path d="M94,156 C88,84 138,40 200,40 C262,40 312,84 306,156 Q200,134 94,156Z" fill="${c}"/>`+LN('M200,40 L200,140 M150,52 C140,90 136,120 138,146 M250,52 C260,90 264,120 262,146',d,2,.5)+`<circle cx="200" cy="42" r="6" fill="${d}"/><path d="M100,152 Q200,128 300,152 Q316,172 290,182 Q200,158 110,182 Q84,172 100,152Z" fill="${shade(c,-.12)}"/>`;
  case 'bob':return `<path d="M112,150 C108,84 148,48 200,48 C252,48 292,84 288,150Z" fill="${c}"/><path d="M80,170 Q200,120 320,170 Q332,190 300,192 Q200,160 100,192 Q68,190 80,170Z" fill="${shade(c,-.1)}"/>`+LN('M112,148 Q200,128 288,148',d,3,.5)+LN('M92,180 Q200,150 308,180',d,1.4,.4,'3 3');
  case 'bonnet':{const a='M96,176 C86,90 136,30 200,30 C264,30 314,90 304,176Z',b='M92,140 Q200,118 308,140 L310,180 Q200,160 90,180Z';return `<path d="${a}" fill="${c}"/><path d="${a}" fill="url(#${p}hrib)"/><path d="${b}" fill="${shade(c,-.1)}"/><path d="${b}" fill="url(#${p}hrib)"/>`}
  case 'foulard':{const a='M88,190 C70,96 130,22 200,22 C270,22 330,96 312,190 C300,160 280,146 250,140 Q200,132 150,140 C120,146 100,160 88,190Z',k='M200,30 C230,-6 270,6 262,36 C256,52 226,50 200,44 C174,50 144,52 138,36 C130,6 170,-6 200,30Z';
   return `<path d="${a}" fill="${c}"/><path d="${a}" fill="url(#${p}hmad)"/>`+LN('M120,140 C150,90 190,70 236,62 M140,150 C176,110 230,96 290,110',d,2,.35)+`<path d="${k}" fill="${c}"/><path d="${k}" fill="url(#${p}hmad)"/><circle cx="200" cy="38" r="12" fill="${d}"/>`}
  default:return '';
 }}
function edgesSVG(s,hD){return s.edges==='baby'?LN('M114,150 c-8,4 -10,14 -2,16 c6,1 8,-6 2,-8 M286,150 c8,4 10,14 2,16 c-6,1 -8,-6 -2,-8 M150,138 q4,-6 10,-2 M240,136 q6,-4 10,2 M120,168 q-4,6 2,10 M280,168 q4,6 -2,10',hD,1.8,.9):''}
const TOPS=['salopette','tshirt','crop','debardeur','ajuste','henley','asym','capuche','chemise','colroule','gilet','epaules','blouse','veste','cardigan'];
const TOP2={capuche2:{h:470,ext:13,sl:446,sx:9,neck:'v',hood2:1,band:1,cuff:1},tajuste:{h:392,ext:0,sl:298,sx:2,fit:1,neck:'scoop'},epaules2:{h:386,ext:1,sl:446,sx:2,neck:'off',fit:1,rib:1,cuff:1},bustier:{h:366,ext:0,neck:'tube',fit:1,nosl:1,rib:1},
 chemcrop:{h:394,ext:4,sl:446,sx:5,neck:'deepv',scol:1,btnv2:1,cuff:1,pocket:1},mlrose:{h:392,ext:0,sl:446,sx:1.5,fit:1,rib:1,neck:'square'},cardicrop:{h:392,ext:3,sl:446,sx:3.5,neck:'cv',rib:1,btnv:1,cuff:1,band:1},
 polo:{h:398,ext:1,sl:292,sx:1.5,band2:1,fit:1,neck:'v',pcol:1,placket2:1},mlnoir:{h:392,ext:0,sl:446,sx:1.5,fit:1,neck:'square'},tcrop:{h:372,ext:0,sl:298,sx:3,fit:1},
 pullfin:{h:412,ext:8,sl:446,sx:7,neck:'off',cuff:1},halter:{h:376,ext:0,neck:'halter',fit:1,nosl:1,keyhole:1},tanksport:{h:380,ext:0,neck:'tank',fit:1,nosl:1,trim:1,rib:1},
 blousecrop:{h:388,ext:2,sl:306,sx:4,puff:2,neck:'scoopw',tie:1,ruff:1,seams:1},tbasic:{h:392,ext:1,sl:298,sx:4,fit:1,neck:'square',bow:1},camicote:{h:372,ext:0,sl:0,sx:0,neck:'cami',fit:1,nosl:1,rib:1,btn1:1},debardeur:{h:396,ext:0,sl:0,sx:0,neck:'cami',fit:1,nosl:1},tshirt:{h:452,ext:5,sl:302,sx:5},ajuste:{h:404,ext:0,sl:446,sx:1,fit:1},crop:{h:350,ext:0,sl:446,sx:1,rib:1,fit:1},henley:{h:384,ext:1,sl:446,sx:1.5,rib:1,fit:1,hen:1},
 asym:{h:362,ext:0,neck:'asym',sl:446,sx:1,fit:1,rib:1},capuche:{h:458,ext:9,sl:446,sx:7,hood:1,band:1,cuff:1},chemise:{h:458,ext:6,sl:446,sx:5,collar:1,buttons:1,cuff:1},
 colroule:{h:446,ext:2,sl:446,sx:2,turtle:1,rib:1,fit:1},salopette:{h:440,ext:3,sl:300,sx:4,bib:1},gilet:{h:450,ext:5,vest:1},
 epaules:{h:384,ext:1,sl:446,sx:2,neck:'off',band:1,fit:1},blouse:{h:446,ext:6,sl:446,sx:4,neck:'deepv',puff:1,cuff:1},
 veste:{h:378,ext:8,sl:446,sx:7,collar:1,zip:1,quilt:1,band:1,cuff:1},cardigan:{h:486,ext:9,sl:446,sx:6,neck:'cardi',cardi:1,band:1,cuff:1,rib:1}};
function body(s,p,sk,skD,skDD,skL){
 const G0=GEO[s.sexe]||GEO.f,C=CORP[s.corpulence]||CORP.moyenne,G={...G0,WH:G0.WH+C.WH,HH:G0.HH+C.HH,au:G0.au+C.au,lk:C.lk,ak:C.ak},T=TOP2[s.top]||TOP2.tshirt,c=s.topColor,dk=shade(c,-.3),lt=shade(c,.22),h=T.h;
 const TF=`url(#${p}tp)`,LM=`url(#${p}lm)`,cont=lum(c)>.6?'#1f2127':'#f4f1ea';
 let d=`<defs><linearGradient id="${p}lm" x1="0" y1="0" x2="1" y2="0"><stop offset="0" stop-color="${skD}"/><stop offset=".45" stop-color="${skL}"/><stop offset=".7" stop-color="${sk}"/><stop offset="1" stop-color="${skD}"/></linearGradient>
 <linearGradient id="${p}lmL" x1="0" y1="0" x2="1" y2="0"><stop offset="0" stop-color="${skD}"/><stop offset=".42" stop-color="${skL}"/><stop offset="1" stop-color="${sk}"/></linearGradient><linearGradient id="${p}lmR" x1="0" y1="0" x2="1" y2="0"><stop offset="0" stop-color="${sk}"/><stop offset=".58" stop-color="${skL}"/><stop offset="1" stop-color="${skD}"/></linearGradient>
 <linearGradient id="${p}tpL" x1="0" y1="0" x2="1" y2="0"><stop offset="0" stop-color="${shade(c,-.22)}"/><stop offset=".45" stop-color="${shade(c,.06)}"/><stop offset="1" stop-color="${shade(c,-.18)}"/></linearGradient><linearGradient id="${p}tpR" x1="0" y1="0" x2="1" y2="0"><stop offset="0" stop-color="${shade(c,-.18)}"/><stop offset=".55" stop-color="${shade(c,.06)}"/><stop offset="1" stop-color="${shade(c,-.22)}"/></linearGradient>
 <linearGradient id="${p}tp" x1="0" y1="0" x2="1" y2="0"><stop offset="0" stop-color="${shade(c,T.fit?-.13:-.2)}"/><stop offset="${T.fit?.18:.4}" stop-color="${shade(c,.06)}"/><stop offset=".65" stop-color="${c}"/><stop offset="${T.fit?.86:1}" stop-color="${shade(c,T.fit?-.02:-.2)}"/><stop offset="1" stop-color="${shade(c,T.fit?-.14:-.2)}"/></linearGradient>
 <pattern id="${p}rib" width="5" height="10" patternUnits="userSpaceOnUse"><path d="M2.5,0 V10" stroke="#000" stroke-opacity=".13" stroke-width="1.3"/></pattern>
 <pattern id="${p}cab" width="24" height="26" patternUnits="userSpaceOnUse"><path d="M6,0 C14,6 14,7 6,13 C-2,19 -2,20 6,26 M18,0 C10,6 10,7 18,13 C26,19 26,20 18,26" fill="none" stroke="#000" stroke-opacity=".15" stroke-width="2"/><path d="M12,0 V26 M0,0 V26" stroke="#000" stroke-opacity=".08" stroke-width="1"/></pattern>
 <pattern id="${p}tw2" width="5" height="5" patternUnits="userSpaceOnUse" patternTransform="rotate(-35)"><path d="M0,0 V5" stroke="#000" stroke-opacity=".08" stroke-width="1.4"/></pattern>
 <pattern id="${p}mad" width="28" height="28" patternUnits="userSpaceOnUse"><rect x="0" y="9" width="28" height="7" fill="#d93b5e" opacity=".45"/><rect x="9" y="0" width="7" height="28" fill="#d93b5e" opacity=".35"/><rect x="0" y="21" width="28" height="2" fill="#2fa36b" opacity=".6"/><rect x="21" y="0" width="2" height="28" fill="#2fa36b" opacity=".5"/><rect x="0" y="3" width="28" height="1.5" fill="#fff" opacity=".4"/><rect x="3" y="0" width="1.5" height="28" fill="#fff" opacity=".35"/></pattern>
 <pattern id="${p}flo" width="22" height="22" patternUnits="userSpaceOnUse"><g fill="#fff" opacity=".75"><circle cx="6" cy="6" r="2"/><circle cx="3.5" cy="6" r="1.4"/><circle cx="8.5" cy="6" r="1.4"/><circle cx="6" cy="3.5" r="1.4"/><circle cx="6" cy="8.5" r="1.4"/></g><circle cx="6" cy="6" r="1" fill="#f2c230"/><circle cx="17" cy="16" r="1.6" fill="#fff" opacity=".6"/></pattern>
 <pattern id="${p}qlt" width="20" height="20" patternUnits="userSpaceOnUse" patternTransform="rotate(45)"><path d="M0,0 H20 M0,0 V20" stroke="#000" stroke-opacity=".2" stroke-width="1.4"/></pattern></defs>`;
 let o=`<ellipse cx="200" cy="878" rx="80" ry="9" fill="#000" opacity=".13"/>`;
  o+=[-1,1].map(k=>`<path d="${legD(G,k)}" fill="${LM}"/>`).join('');
 o+=`<path d="${torsoD(G,478,0,'flat')}" fill="${sk}"/><ellipse cx="200" cy="398" rx="2.2" ry="3.5" fill="${skDD}" opacity=".45"/>`;
 if(G.f)o+=LN('M170,360 Q186,372 200,378 Q214,372 230,360',skD,1.5,.25);
 if(T.hood)o+=`<path d="M160,222 C150,186 172,160 200,160 C228,160 250,186 240,222Z" fill="${dk}"/>`;
 if(T.hood2)o+=`<path d="M146,234 C140,200 162,182 200,180 C238,182 260,200 254,234 L226,234 Q214,206 200,204 Q186,206 174,234Z" fill="${shade(c,-.12)}"/>`+LN('M156,226 C156,204 174,192 200,190 C226,192 244,204 244,226',shade(c,-.4),1.4,.4);
 o+=`<path d="M185,150 L185,220 Q200,230 215,220 L215,150Z" fill="${skD}"/><ellipse cx="200" cy="190" rx="15" ry="9" fill="${skDD}" opacity=".35"/>`;
 if(T.neck==='off'||T.neck==='asym'||T.neck==='deepv')o+=LN('M168,226 Q182,231 194,227 M206,227 Q218,231 232,226',skDD,1.6,.35);
 const boot=s.shoes==='bottes';
 if(!boot)o+=shoesSVG(s,sk,G,skD,skL,p);
 if(!(s.dress&&s.dress!=='aucune'&&DR[s.dress]))o+=bottomsSVG(G,s,p);
 if(boot)o+=shoesSVG(s,sk,G,skD,skL,p);
 o+=topSVG(G,T,s,p,{TF,LM,c,dk,lt,cont,sk,skDD,h});
 o+=accSVG(G,s);
 return d+o;
}
/* épaules nues : la peau des épaules est une seule forme continue (trapèzes + arrondi de l'épaule),
   posée par-dessus le haut des bras, pour que les épaules ne paraissent pas « collées » au corps */
/* raccord d'épaule en tissu : recouvre le haut de la manche pour que l'épaule du vêtement soit une seule courbe du cou au bras */
let capN=0;
/* sl / tor : dégradés (offset, nuance) de la manche et du buste ; la pièce passe de l'un à l'autre sans couture */
const colAt=(c,st,t)=>{t=Math.max(0,Math.min(1,t));for(let i=1;i<st.length;i++)if(t<=st[i][0]){const [a,x]=st[i-1],[b,y]=st[i];return mix(shade(c,x),shade(c,y),(t-a)/((b-a)||1))}return shade(c,st[st.length-1][1])};
const torHalf=(G,h,ext)=>{let m=0;for(let y=222;y<=h;y+=6)m=Math.max(m,sideX(G,y)+ext*Math.min(1,Math.max(0,(y-222)/80)));return m};
/* hauteur de l'encolure du buste (courbe cou → épaule de torsoD) à une abscisse donnée */
function torsoTopY(G,x){const sh=sideX(G,222),X=Math.abs(x-200),P=[[15,213],[36,221],[sh-12,229],[sh,240]];let best=213,bd=1e9;
 for(let i=0;i<=60;i++){const t=i/60,u=1-t,xx=u*u*u*P[0][0]+3*u*u*t*P[1][0]+3*u*t*t*P[2][0]+t*t*t*P[3][0],yy=u*u*u*P[0][1]+3*u*u*t*P[1][1]+3*u*t*t*P[2][1]+t*t*t*P[3][1];if(Math.abs(xx-X)<bd){bd=Math.abs(xx-X);best=yy}}return best}
function capPatch(G,p,k,id,c,sl,tor,half,ext,yBot){
 /* half : demi-largeur du buste (dégradé symétrique) ou fonction x → couleur du buste */
 const A=armPts(G,k),sx=A.sx,au=A.au,e=ext||0,q=p+id+(capN++);
 const ox=sx+k*(au+e),ob=edge(A.O,yBot)+k*e,yb=AY(yBot);
 const xs=[];for(let y=236;y<=446;y+=10)xs.push(edge(A.O,y)+k*e,edge(A.I,Math.max(272,y))-k*e);xs.push(sx-k*(au-2),sx+k*(au+e));
 const x0=Math.min(...xs),x1=Math.max(...xs),bx0=200-(+half||0),bx1=200+(+half||0),xi=(k<0?x1:x0)-k*4,torC=typeof half==='function'?half:(x=>colAt(c,tor,(x-bx0)/(bx1-bx0)));
 let st='';for(let j=0;j<=8;j++){const t=j/8,x=ox+(xi-k*7-ox)*t,vs=colAt(c,sl,(x-x0)/(x1-x0)),vt=torC(x),w=Math.max(0,Math.min(1,(Math.abs(sx-200)+4-Math.abs(x-200))/(Math.abs(sx-200)+4-Math.abs(xi-200))));
  st+=`<stop offset="${fx(t)}" stop-color="${mix(vs,vt,w)}"/>`}
 const oe=edge(A.O,246)+k*e,xe=xi-k*7,pr=shProf(G,k,oe).filter(q=>k*(q[0]-200)>k*(xe-200));
 const d=`M${fx(xe)},${fx(shY(G,k,xe,oe)+.4)} L${pts(pr.map(q=>[q[0],q[1]+.3]))} L${fx(ob)},${fx(yb)} L${fx(xe)},${fx(yb)}Z`;
 return `<defs><linearGradient id="${q}g" gradientUnits="userSpaceOnUse" x1="${fx(ox)}" y1="0" x2="${fx(xi-k*7)}" y2="0">${st}</linearGradient>
 <linearGradient id="${q}v" gradientUnits="userSpaceOnUse" x1="0" y1="${fx(yb-28)}" x2="0" y2="${fx(yb)}"><stop offset="0" stop-color="#fff"/><stop offset="1" stop-color="#000"/></linearGradient>
 <mask id="${q}mv" maskUnits="userSpaceOnUse" x="0" y="150" width="400" height="200"><rect x="0" y="150" width="400" height="200" fill="url(#${q}v)"/></mask></defs>
 <path d="${d}" fill="url(#${q}g)" mask="url(#${q}mv)"/>`}
const SL_L=[[0,-.22],[.45,.06],[1,-.18]],SL_R=[[0,-.18],[.55,.06],[1,-.22]],TOR=[[0,-.2],[.4,.08],[.65,0],[1,-.2]],JKS=[[0,-.22],[.42,.1],[.66,0],[1,-.22]];
/* poitrine, d'après le modèle de Prescillia :
   1) ombre douce sous la poitrine et sur les côtés (dans le vêtement) ;
   2) un trait de contour de chaque côté : il descend le long de la manche depuis l'aisselle puis tourne vers l'intérieur sous la poitrine */
function bustSVG(p,c,k,clip){const q=p+'bs',d=shade(c,-.5),L=lum(c),o=L>.45?1:L>.25?.8:.65,oh=L>.45?1:L>.25?.5:.2;
 /* ombre sous chaque sein : un croissant flou qui part du crochet du contour et va vers le centre */
 const cres=x=>{const m=x<200?1:-1;return `M${200-m*55},312 C${200-m*49},328 ${200-m*26},334 ${200-m*4},329 C${200-m*22},343 ${200-m*50},338 ${200-m*58},316Z`};
 return `<defs><clipPath id="${q}c"><path d="${clip}"/></clipPath><filter id="${q}f" x="-30%" y="-60%" width="160%" height="220%"><feGaussianBlur stdDeviation="2.6"/></filter>
 <radialGradient id="${q}h"><stop offset="0" stop-color="#fff" stop-opacity="${fx(.12*k*oh)}"/><stop offset="1" stop-color="#fff" stop-opacity="0"/></radialGradient>
 <radialGradient id="${q}r" cx="50%" cy="30%" r="70%"><stop offset=".62" stop-color="${d}" stop-opacity="0"/><stop offset=".92" stop-color="${d}" stop-opacity="${fx(.08*k*o)}"/><stop offset="1" stop-color="${d}" stop-opacity="0"/></radialGradient></defs>
 <g clip-path="url(#${q}c)"><g filter="url(#${q}f)"><ellipse cx="171" cy="304" rx="29" ry="27" fill="url(#${q}r)"/><ellipse cx="229" cy="304" rx="29" ry="27" fill="url(#${q}r)"/></g><ellipse cx="174" cy="300" rx="20" ry="17" fill="url(#${q}h)"/><ellipse cx="226" cy="300" rx="20" ry="17" fill="url(#${q}h)"/>
 <g filter="url(#${q}f)" fill="${d}" opacity="${fx(.4*k*o)}"><path d="${cres(150)}"/><path d="${cres(250)}"/></g>
 <ellipse cx="200" cy="314" rx="3" ry="13" fill="${d}" opacity="${fx(.05*k*o)}" filter="url(#${q}f)"/><ellipse cx="200" cy="330" rx="46" ry="7" fill="${d}" opacity="${fx(.06*k*o)}" filter="url(#${q}f)"/></g>`}
function bustLine(G,k,c,ex,y0){/* trait de contour : suit le bord intérieur de la manche puis fait un crochet sous la poitrine */
 const A=armPts(G,k),e=y=>(typeof ex==='function'?ex(y):ex||0),X=Y=>{const y=Math.max(272,236+(Y-236)/ARMK);return edge(A.I,y)-k*e(y)};
 const a=X(272),b=X(304),m=X(312);
 return LN(`M${fx(a+k*.5)},${y0} L${fx(b)},304 C${fx(b)},310 ${fx(m-k*1)},314 ${fx(m-k*6)},318`,shade(c,-.34),1.7,.5)}
function yokeSVG(G,p,sk,yBot,fade){
 const skD=mix(sk,'#5a2412',.2),skL=mix(sk,'#ffd9b8',.22),skDD=mix(sk,'#3a140a',.4);
 const side=k=>{const sx=200+k*(G.SH-9),ox=sx+k*G.au,A=armPts(G,k),ob=edge(A.O,yBot);
  return {n:[200+k*13,205],c1:[200+k*28,207],c2:[sx-k*5,208],t:[ox-k*8,215],r1:[ox-k*1,219],r2:[ox,227],e:[ox,236],b:[ob,yBot]}};
 const L=side(-1),R=side(1),P=q=>fx(q[0])+','+fx(q[1]);
 const d=`M${pts(shProf(G,-1))} L${P(L.b)} L${P(R.b)} L${pts(shProf(G,1).reverse())} L215,219 Q200,229 185,219Z`;
 const x0=L.e[0],x1=R.e[0],W=x1-x0,a=(L.c2[0]+5-x0)/W;
 let o=`<defs><linearGradient id="${p}yk" gradientUnits="userSpaceOnUse" x1="${fx(x0)}" y1="0" x2="${fx(x1)}" y2="0"><stop offset="0" stop-color="${skD}"/><stop offset="${fx(a*.45)}" stop-color="${skL}"/><stop offset="${fx(a*1.25)}" stop-color="${sk}"/><stop offset="${fx(1-a*1.25)}" stop-color="${sk}"/><stop offset="${fx(1-a*.45)}" stop-color="${skL}"/><stop offset="1" stop-color="${skD}"/></linearGradient>`;
 if(fade)o+=`<linearGradient id="${p}ykf" gradientUnits="userSpaceOnUse" x1="0" y1="${yBot-30}" x2="0" y2="${yBot}"><stop offset="0" stop-color="#fff"/><stop offset="1" stop-color="#000"/></linearGradient><mask id="${p}ykm" maskUnits="userSpaceOnUse" x="0" y="150" width="400" height="200"><rect x="0" y="150" width="400" height="200" fill="url(#${p}ykf)"/></mask>`;
 o+=`</defs><path d="${d}" fill="url(#${p}yk)"${fade?` mask="url(#${p}ykm)"`:''}/>`;
 /* ombre douce sous le cou et clavicules */
 o+=`<path d="M186,218 Q200,229 214,218 Q200,238 186,218Z" fill="${skD}" opacity=".35"/>`+LN('M162,235 Q180,237 190,236 Q194,237 195,241 M238,235 Q220,237 210,236 Q206,237 205,241',skDD,1.6,.3);
 return o}
function topSVG(G,T,s,p,K){
 const {TF,LM,c,dk,lt,cont,sk,skDD,h}=K;let o='';
 const J=jacketParts(G,s,p,T.sx||3);
 if(s.dress&&s.dress!=='aucune'&&DR[s.dress])return dressSVG(G,s,p,K,J);
 const sleeve=(k,col,yEnd,ext,yTop)=>`<path d="${armD(G,k,yEnd,ext,yTop)}" fill="${col===TF?`url(#${p}tp${k<0?'L':'R'})`:col===LM?`url(#${p}lm${k<0?'L':'R'})`:col}"/>`;
 const cuff=(k,col,y0,y1,e)=>{const A=armPts(G,k),Y0=fx(AY(y0)),Y1=fx(AY(y1));return `<path d="M${fx(edge(A.O,y0)+k*e)},${Y0} L${fx(edge(A.O,y1)+k*e)},${Y1} L${fx(edge(A.I,y1)-k*e)},${Y1} L${fx(edge(A.I,y0)-k*e)},${Y0}Z" fill="${col}"/>`};
 const arms=()=>[-1,1].map(k=>`<path d="${armD(G,k)}" fill="url(#${p}lm${k<0?'L':'R'})"/>`).join('');
 const hands=()=>[-1,1].map(k=>{const w=armPts(G,k).wx;return `<path d="${handD(G,k)}" fill="${sk}"/><ellipse cx="${fx(w-k*9)}" cy="${fx(AY(460))}" rx="3.6" ry="9" transform="rotate(${k*14} ${fx(w-k*9)} ${fx(AY(460))})" fill="${shade(sk,-.08)}"/>`}).join('');
 const hemBand=(y,col,ext)=>{const x=sideX(G,y)+ext;return `<path d="M${fx(200-x)},${y-13} L${fx(200+x)},${y-13} L${fx(200+x)},${y} L${fx(200-x)},${y}Z" fill="${col}"/><path d="M${fx(200-x)},${y-13} L${fx(200+x)},${y-13} L${fx(200+x)},${y} L${fx(200-x)},${y}Z" fill="url(#${p}rib)"/>`};
 if(T.vest){
  const U=lum(c)>.5?'#1f2127':'#f4f1ea',VG={...G,SH:G.SH-8};
  o+=`<path d="${torsoD(G,446,3)}" fill="${U}"/>`;
  /* t-shirt du dessous : bras et manches d'abord (avec le raccord d'épaule), le pull sans manches par-dessus */
  o+=arms()+[-1,1].map(k=>sleeve(k,U,446,()=>3)+cuff(k,shade(U,lum(U)>.5?-.08:.12),434,446,3.4)+capPatch(G,p,k,'vs'+k,U,[[0,0],[1,0]],[[0,0],[1,0]],torHalf(G,446,3),3,262)).join('');
  const vt=torsoD(VG,h,T.ext,'deepv');
  o+=`<path d="${vt}" fill="${TF}"/><path d="${vt}" fill="url(#${p}cab)"/>`;
  o+=LN('M184,207 L200,293 L216,207',shade(c,-.06),9)+LN('M186,213 L200,284 L214,213',cont,2.2,.9);
  o+=hemBand(h,shade(c,-.05),T.ext)+LN(`M${fx(200-sideX(G,h)-T.ext)},${h-7} L${fx(200+sideX(G,h)+T.ext)},${h-7}`,cont,2,.85);
  o+=J.torso+J.sleeves+hands();
  return o;
 }
 if(T.cardi)o+=`<path d="${torsoD(G,446,2)}" fill="${lum(c)>.7?'#f4f1ea':'#f4f1ea'}"/>`+LN('M185,217 Q200,231 215,217',shade('#f4f1ea',-.15),2,1);
 if(T.bib)o+='';
 if(T.neck==='off'||T.neck==='asym')o+=arms()+yokeSVG(G,p,sk,T.neck==='off'?256:266,T.neck==='asym');
 if(T.neck==='tube'||T.neck==='halter'||T.neck==='tank')o+=arms()+yokeSVG(G,p,sk,T.neck==='tube'?272:T.neck==='tank'?272:284,true);
 const tor=torsoD(G,h,T.ext,T.neck);
 o+=`<path d="${tor}" fill="${TF}"/>`;
 if(T.rib)o+=`<path d="${tor}" fill="url(#${p}rib)"/>`;
 if(T.quilt)o+=`<path d="${tor}" fill="url(#${p}qlt)"/>`;
 if(G.f)o+=bustSVG(p,c,T.fit?1:.7,tor);
 if(T.ext>=5&&!T.vest)o+=LN(`M170,${h-44} Q176,${h-22} 170,${h-4} M232,${h-54} Q226,${h-28} 230,${h-4}`,dk,2,.22);
 if(T.neck==='off'){/* bande dessinée après les manches */}
 else if(T.neck==='deepv'&&!T.hood2&&!T.scol)o+=LN('M185,217 L200,294 L215,217',dk,2.4,.7);
 else if(T.neck==='cardi'){o+=LN('M185,217 L200,330 M215,217 L200,330',dk,4,.5)+LN(`M200,330 L200,${h}`,dk,1.5,.5);for(let y=346;y<h-14;y+=34)o+=`<circle cx="205" cy="${y}" r="4.2" fill="${shade(c,-.4)}"/>`;
  [-1,1].forEach(k=>{o+=`<path d="M${200+k*16},${h-78} L${200+k*50},${h-78} L${200+k*50},${h-30} L${200+k*16},${h-30}Z" fill="none" stroke="${dk}" stroke-width="2" opacity=".45"/>`})}
 else if(T.neck==='cami')o+=LN('M155,266 Q200,310 245,266',lt,2.4,.8);
 if(T.neck==='square'){{const a=profTo(G,-1,sideX(G,222)).filter(q=>q[0]<=160)[0],b=profTo(G,1,sideX(G,222)).filter(q=>q[0]>=240)[0],sq=`M${fx(a[0])},${fx(a[1])} L162,274 L238,274 L${fx(b[0])},${fx(b[1])}`;o+=LN(sq,lt,4,.9)+LN(sq,dk,1.2,.4)}if(G.f)o+=LN('M188,276 Q196,282 200,289 M212,276 Q204,282 200,289',skDD,1.6,.2)}
 if(T.bow)o+=`<path d="M200,280 L193,276 L193,284Z M200,280 L207,276 L207,284Z" fill="${shade(c,-.35)}"/><circle cx="200" cy="280" r="1.6" fill="${shade(c,-.45)}"/>`+LN('M199,281 L197,288 M201,281 L203,288',shade(c,-.35),1.2);
 if(T.btn1)o+=`<circle cx="200" cy="292" r="2.4" fill="${shade(c,-.25)}"/>`;
 if(G.f&&T.neck==='cv')o+=LN('M190,300 Q196,306 200,316 M210,300 Q204,306 200,316',skDD,1.6,.22);
 if(G.f&&T.neck==='cami')o+=LN('M190,274 Q197,280 200,287 M210,274 Q203,280 200,287',skDD,1.8,.24);
 else if(!['asym','square','tube','halter','tank','scoop','v','cv','scoopw'].includes(T.neck)&&!T.collar&&!T.turtle&&!T.hood2)o+=LN('M185,217 Q200,231 215,217',dk,3,.6);
 if(T.neck==='scoop')o+=LN('M185,217 Q200,250 215,217',dk,2.6,.6);
 if(T.neck==='v'&&!T.hood2&&!T.pcol)o+=LN('M185,217 L200,262 L215,217',dk,2.6,.6);
 if(T.neck==='tube')o+=LN(`M${fx(200-sideX(G,268))},268 Q200,262 ${fx(200+sideX(G,268))},268`,lt,3,.7);
 if(T.neck==='halter')o+=LN(`M186,210 Q${fx(200-sideX(G,278)+6)},250 ${fx(200-sideX(G,278))},278 M214,210 Q${fx(200+sideX(G,278)-6)},250 ${fx(200+sideX(G,278))},278`,dk,2,.4);
 if(T.keyhole){const kd='M200,220 Q190,236 183,252 Q192,266 200,276 Q208,266 217,252 Q210,236 200,220Z';o+=`<path d="${kd}" fill="${sk}"/>`+LN(kd,dk,1.6,.6)+LN('M188,214 Q204,236 217,252 M212,214 Q196,236 183,252',shade(c,.12),1.6,.6);
  o+=`<path d="M184,196 Q200,202 216,196 L216,212 Q200,218 184,212Z" fill="${shade(c,.08)}"/>`+LN('M184,212 Q200,218 216,212',dk,1.4,.5)}
 if(T.trim){const s2=x=>fx(shY(G,x<200?-1:1,x)+1);o+=LN(`M175,${s2(175)} C175,262 184,268 200,268 C216,268 225,262 225,${s2(225)}`,'#1f2127',4.4)+LN(`M177,${s2(177)+3} C177.5,260 185,264.5 200,264.5 C215,264.5 222.5,260 223,${s2(223)+3}`,'#f4f1ea',1.2,.8)+LN(`M166,${s2(166)} L166,258 Q166,280 ${fx(200-sideX(G,284))},284 M234,${s2(234)} L234,258 Q234,280 ${fx(200+sideX(G,284))},284`,'#1f2127',2.6)+`<text x="200" y="294" text-anchor="middle" font-family="cursive,serif" font-style="italic" font-size="9" fill="#1f2127" opacity=".8">Lycée</text>`+``}
 if(T.scol){const lc=shade(c,.08),oc=shade(c,-.3);const Lc='M186,206 C176,212 160,218 152,226 L170,250 L182,244 L200,294 L192,236Z',Rc='M214,206 C224,212 240,218 248,226 L230,250 L218,244 L200,294 L208,236Z';
  o+=`<path d="${Lc}" fill="${lc}"/><path d="${Rc}" fill="${lc}"/>`+LN(Lc,oc,1.4,.6)+LN(Rc,oc,1.4,.6)}
 if(T.btnv2){o+=LN(`M200,294 L200,${h}`,dk,1.4,.5)+LN(`M204,294 L204,${h}`,dk,1,.3);for(let y=306;y<h-6;y+=24)o+=`<circle cx="202" cy="${y}" r="2.6" fill="${shade(c,.2)}" stroke="${dk}" stroke-width=".8"/>`}
 if(T.pcol){const lc=shade(c,-.02),oc=shade(c,-.35);const Lc='M186,205 C181,208 176,212 172,218 L182,246 L196,258 L193,222Z',Rc='M214,205 C219,208 224,212 228,218 L218,246 L204,258 L207,222Z';
  o+=`<path d="${Lc}" fill="${lc}"/><path d="${Rc}" fill="${lc}"/>`+LN(Lc,oc,1.4,.7)+LN(Rc,oc,1.4,.7)}
 if(T.placket2)o+=LN('M196,262 L196,292 L204,292 L204,262',shade(c,-.3),1.2,.6)+`<circle cx="200" cy="270" r="2.3" fill="${shade(c,-.15)}" stroke="${shade(c,-.4)}" stroke-width=".7"/><circle cx="200" cy="283" r="2.3" fill="${shade(c,-.15)}" stroke="${shade(c,-.4)}" stroke-width=".7"/>`;
 if(T.ruff){const sq=(()=>{const a=profTo(G,-1,sideX(G,222)).filter(q=>q[0]<=160)[0],b=profTo(G,1,sideX(G,222)).filter(q=>q[0]>=240)[0];return [a,b]})();let w=`M${fx(sq[0][0])},${fx(sq[0][1])}`;const P=[];for(let i=0;i<=16;i++){const u=i/16,x=(1-u)**3*sq[0][0]+3*(1-u)**2*u*162+3*(1-u)*u*u*178+u**3*200,y=(1-u)**3*sq[0][1]+3*(1-u)**2*u*262+3*(1-u)*u*u*282+u**3*282;P.push([x,y])}for(let i=15;i>=0;i--)P.push([400-P[i][0],P[i][1]]);for(let s2=0;s2<P.length-1;s2++){const [x0,y0]=P[s2],[x1,y1]=P[s2+1],n=1;for(let i=1;i<=n;i++){const x=x0+(x1-x0)*i/n,y=y0+(y1-y0)*i/n,mx=x0+(x1-x0)*(i-.5)/n,my=y0+(y1-y0)*(i-.5)/n;w+=` Q${fx(mx)},${fx(my+2)} ${fx(x)},${fx(y)}`}}const nk=`M${fx(sq[0][0])},${fx(sq[0][1])} C162,262 178,282 200,282 C222,282 238,262 ${fx(sq[1][0])},${fx(sq[1][1])}`;let sc='';for(let s2=3;s2<P.length-4;s2++){const [x0,y0]=P[s2],[x1,y1]=P[s2+1],dx=x1-x0,dy=y1-y0,l=Math.hypot(dx,dy)||1,nx=-dy/l*3,ny=dx/l*3;sc+=`M${fx(x0+nx)},${fx(y0+ny)} Q${fx((x0+x1)/2+nx*1.9)},${fx((y0+y1)/2+ny*1.9)} ${fx(x1+nx)},${fx(y1+ny)} `}o+=LN(sc,dk,1,.5)+LN(nk,dk,1.6,.8)}
 if(T.seams)o+=LN(`M182,300 Q178,340 182,${h} M218,300 Q222,340 218,${h}`,dk,1.4,.3);
 if(T.pocket)o+=`<path d="M214,296 L240,296 L240,326 L214,326Z" fill="none" stroke="${dk}" stroke-width="1.6" opacity=".5"/><path d="M213,294 L241,294 L241,304 L227,308 L213,304Z" fill="${shade(c,.05)}" stroke="${dk}" stroke-width="1.2" stroke-opacity=".5"/>`;
 if(T.btnv){const y0=T.neck==='cv'?326:T.neck==='deepv'?294:262,a=T.neck==='cv'?profTo(G,-1,sideX(G,222)).filter(q=>q[0]<=172)[0]:[185,217],b=T.neck==='cv'?profTo(G,1,sideX(G,222)).filter(q=>q[0]>=228)[0]:[215,217],vd=`M${fx(a[0])},${fx(a[1])} L200,${y0} L${fx(b[0])},${fx(b[1])}`;o+=LN(`M200,${y0} L200,${h}`,dk,1.4,.5)+LN(vd,shade(c,-.08),6,.9)+LN(vd,dk,1,.4);for(let y=y0+12;y<h-14;y+=22)o+=`<circle cx="200" cy="${y}" r="3" fill="${shade(c,-.25)}"/>`}
 if(T.heart===1)o+=`<path d="M200,282 c-2,-3 -6,-2 -5,1 c1,2 5,4 5,4 c0,0 4,-2 5,-4 c1,-3 -3,-4 -5,-1Z" fill="${shade(c,-.3)}"/>`;
 if(T.heart===2)o+=`<path d="M200,286 c-3,-5 -10,-3 -8,2 c1.5,3.5 8,7 8,7 c0,0 6.5,-3.5 8,-7 c2,-5 -5,-7 -8,-2Z" fill="#d93b5e" opacity=".85"/>`;
 if(T.fly)o+=`<g fill="#f4f1ea" opacity=".9"><path d="M200,292 C194,280 184,282 188,292 C184,298 194,302 200,294Z"/><path d="M200,292 C206,280 216,282 212,292 C216,298 206,302 200,294Z"/></g>`+LN('M200,284 L200,300',shade(c,-.3),1.2);
 if(T.tie&&T.neck==='scoopw')o+='';
 if(T.tie)o+=LN('M200,284 C192,275 186,279 190,287 C193,291 198,287 200,284 C202,287 207,291 210,287 C214,279 208,275 200,284',shade(c,-.25),1.6)+LN('M199,286 C196,299 194,311 192,325 M201,286 C204,299 206,311 208,325',shade(c,-.25),1.4)+`<circle cx="200" cy="284" r="1.8" fill="${shade(c,-.3)}"/>`;
 if(T.neck==='asym')o+=LN(`M185,217 Q${fx(200+30)},246 ${fx(200+sideX(G,272))},272`,dk,2.4,.6);
 if(T.collar){const cc=T.zip?shade(c,-.1):lt;o+=`<path d="M184,204 L200,228 L190,244 L172,214Z" fill="${cc}"/><path d="M216,204 L200,228 L210,244 L228,214Z" fill="${cc}"/>`;if(T.placket)o+=LN('M184,204 L200,228 L190,244 L172,214Z M216,204 L200,228 L210,244 L228,214Z',dk,1.4,.6);
  if(T.placket){o+=LN('M200,228 L200,270',dk,1.5,.5)+`<circle cx="200" cy="242" r="2.8" fill="${dk}"/><circle cx="200" cy="260" r="2.8" fill="${dk}"/>`}
  if(T.buttons){o+=LN(`M200,228 L200,${h}`,dk,1.5,.5);for(let y=258;y<h-6;y+=38)o+=`<circle cx="200" cy="${y}" r="3.2" fill="${dk}"/>`}}
 if(T.zip)o+=LN(`M200,226 L200,${h}`,shade(c,-.42),2.4,1)+`<rect x="197" y="240" width="6" height="12" rx="2" fill="#c9c4b8"/>`;
 if(T.turtle)o+=`<path d="M185,164 Q200,160 215,164 L217,212 Q200,220 183,212Z" fill="${shade(c,-.06)}"/><path d="M185,164 Q200,160 215,164 L217,212 Q200,220 183,212Z" fill="url(#${p}rib)"/>`;
 if(T.hen)o+=LN('M200,212 L200,262',dk,1.5,.6)+[226,242,258].map(y=>`<circle cx="200" cy="${y}" r="2.6" fill="${shade(c,-.45)}"/>`).join('');

 if(T.hood)o+=LN('M168,212 Q200,242 232,212',dk,7,.9)+LN('M193,226 L191,272 M207,226 L209,272',lum(c)>.7?'#9a9488':'#f4f1ea',2.5,1)+`<path d="M160,${h-60} L240,${h-60} L250,${h-14} L150,${h-14}Z" fill="none" stroke="${dk}" stroke-width="2.4" opacity=".6"/>`;
 if(T.bib){const b=s.bottomColor,bd=shade(b,-.3);o+=`<path d="M166,300 L234,300 L240,410 L160,410Z" fill="${b}"/><path d="M180,320 L220,320 L220,354 L180,354Z" fill="none" stroke="#d6a35c" stroke-width="1.4" stroke-dasharray="3 2"/>`+LN('M170,302 L158,218 M230,302 L242,218',b,9)+LN('M170,302 L158,218 M230,302 L242,218','#d6a35c',1.2,.9,'3 2')+`<circle cx="170" cy="304" r="4.5" fill="#c8a24a"/><circle cx="230" cy="304" r="4.5" fill="#c8a24a"/>`+LN('M166,300 L234,300',bd,2,.4)}
 if(T.band)o+=hemBand(h,T.neck==='off'?lt:shade(c,-.06),T.ext);
 if(h<390&&!T.band)o+=LN(`M${fx(200-sideX(G,h))},${h-3} L${fx(200+sideX(G,h))},${h-3}`,dk,3,.4);
 const stD=`M155,267 L153,${fx(shY(G,-1,153)+1.5)} M245,267 L247,${fx(shY(G,1,247)+1.5)}`,camiStraps=LN(stD,c,3)+LN(stD,dk,1,.35),hasJk=!!(s.jacket&&JK[s.jacket]);
 if(T.neck==='cami'&&hasJk)o+=camiStraps;
 o+=J.torso;
 if(!['off','asym','tube','halter','tank'].includes(T.neck))o+=arms();
 if(T.neck==='cami'&&!hasJk)o+=yokeSVG(G,p,sk,270,true)+camiStraps;
 const ex=T.puff===2?(y=>4+9*Math.sin(Math.PI*(.22+.78*Math.max(0,Math.min(1,(y-232)/(T.sl-228)))))):T.puff?(y=>3+11*Math.sin(Math.PI*Math.min(1,(y-236)/200))):(()=>T.sx);
 const yTop=T.neck==='off'?240:null;
 [-1,1].forEach(k=>{
  if(T.nosl||(T.neck==='asym'&&k===1))return;
  o+=sleeve(k,TF,T.sl,ex,yTop);
  if(T.rib)o+=`<path d="${armD(G,k,T.sl,ex,yTop)}" fill="url(#${p}rib)"/>`;
  if(T.puff===2&&!(s.jacket&&JK[s.jacket]))o+=LN(armD(G,k,T.sl,ex,yTop),dk,1.4,.7);
  if(T.quilt)o+=`<path d="${armD(G,k,T.sl,ex,yTop)}" fill="url(#${p}qlt)"/>`;
  if(!yTop&&!(s.jacket&&JK[s.jacket]))o+=capPatch(G,p,k,'tp'+k,c,k<0?SL_L:SL_R,TOR,torHalf(G,h,T.ext),ex(240),262);
  if(T.sl<446)o+=cuff(k,T.band2?shade(c,-.06):dk,T.sl-(T.band2?9:5),T.sl,ex(T.sl)+.5).replace('/>',T.band2?'/>':' opacity=".35"/>')+(T.band2?cuff(k,dk,T.sl-9,T.sl-8,ex(T.sl)+.5).replace('/>',' opacity=".4"/>'):'');
  if(T.ruff&&T.sl<446){const A=armPts(G,k),y=T.sl,x0=edge(A.O,y)+k*(ex(y)+2),x1=edge(A.I,y)-k*(ex(y)+2),Y=AY(y);let w=`M${fx(x0)},${fx(Y)}`;for(let i=1;i<=5;i++){const x=x0+(x1-x0)*i/5,mx=x0+(x1-x0)*(i-.5)/5;w+=` Q${fx(mx)},${fx(Y+5)} ${fx(x)},${fx(Y)}`}o+=`<path d="${w} L${fx(x1)},${fx(Y-5)} L${fx(x0)},${fx(Y-5)}Z" fill="${shade(c,.06)}"/>`+LN(w,dk,1.1,.4)}
  else if(T.cuff)o+=cuff(k,shade(c,-.1),432,446,T.puff?2.5:ex(446)+.5);
  if(T.sl>362)o+=LN(`M${fx(edge(armPts(G,k).O,330)+k*ex(330))},${fx(AY(330))} Q${fx(edge(armPts(G,k).O,345)+k*(ex(345)-6))},${fx(AY(346))} ${fx(edge(armPts(G,k).O,362)+k*ex(362))},${fx(AY(362))}`,dk,1.6,.25);
 });
 /* encolure bateau : une seule bande élastique qui passe sur le buste et les manches */
 if(T.neck==='off'){const xl=armPts(G,-1).sx-G.au-ex(240)-1,xr=armPts(G,1).sx+G.au+ex(240)+1;o+=LN(`M${fx(xl)},241 Q200,256 ${fx(xr)},241`,lt,6,1)+LN(`M${fx(xl+2)},244.5 Q200,259.5 ${fx(xr-2)},244.5`,shade(lt,-.12),1.2,.5)}
 if(G.f&&!(s.jacket&&JK[s.jacket])&&!T.bib&&!T.nosl)[-1,1].forEach(k=>{if(T.neck==='asym'&&k===1)return;o+=bustLine(G,k,c,ex,yTop?yTop+6:258)});
 if(T.bib){const b=s.bottomColor;o+=LN('M170,302 L158,218 M230,302 L242,218',b,9)+LN('M170,302 L158,218 M230,302 L242,218','#d6a35c',1.2,.9,'3 2')}
 if(T.neck==='scoopw'&&!(s.jacket&&JK[s.jacket])){const sh=sideX(G,222),PL=profTo(G,-1,sh).filter(q=>q[0]<=160),PR=profTo(G,1,sh).filter(q=>q[0]>=240),a0=PL[0],b0=PR[0],mid=profTo(G,1,sh).filter(q=>q[0]<240&&q[0]>=200),midL=profTo(G,-1,sh).filter(q=>q[0]>160&&q[0]<200);
  const nk=`M${fx(a0[0])},${fx(a0[1])} C162,262 178,282 200,282 C222,282 238,262 ${fx(b0[0])},${fx(b0[1])}`;
  const top=midL.concat(mid).filter(q=>q[0]>a0[0]&&q[0]<b0[0]).sort((u,v)=>v[0]-u[0]);o+=`<path d="${nk} ${top.map(q=>'L'+fx(q[0])+','+fx(q[1]-.2)).join(' ')}Z" fill="${sk}"/>`+LN(nk,dk,1.6,.8)+[-1,1].map(k=>{const A=armPts(G,k),Q=shProf(G,k,edge(A.O,246)+k*ex(246)).filter(q=>k*(q[0]-200)>=40);const j=Q.findIndex(q=>k*(q[0]-200)>=G.SH-16);Q.splice(j+2);return LN('M'+(k<0?a0:b0).map(fx).join(',')+' L'+Q.map(q=>fx(q[0])+','+fx(q[1])).join(' L'),dk,1.4,.7)}).join('')}
 if(T.hood2&&!(s.jacket&&JK[s.jacket])){const hf=shade(c,.1),ho=shade(c,-.4);
  const Lf='M138,228 C144,200 164,186 182,188 C172,210 182,240 200,266 C172,262 148,250 138,228Z',Rf='M262,228 C256,200 236,186 218,188 C228,210 218,240 200,266 C228,262 252,250 262,228Z';
  o+=`<path d="${Rf}" fill="${hf}"/>`+LN(Rf,ho,2,.8)+`<path d="${Lf}" fill="${hf}"/>`+LN(Lf,ho,2,.8)+LN('M150,226 C160,208 174,200 186,200 M250,226 C240,208 226,200 214,200',ho,1.4,.35);
  const sc=lum(c)>.7?'#9a9488':'#f4f1ea';o+=`<circle cx="187" cy="240" r="2.2" fill="${ho}"/><circle cx="213" cy="240" r="2.2" fill="${ho}"/>`+LN('M187,240 L188,320 M213,240 L212,320',sc,2.6,1)+`<rect x="186.5" y="318" width="3" height="7" rx="1" fill="#b9b9b9"/><rect x="210.5" y="318" width="3" height="7" rx="1" fill="#b9b9b9"/>`;
  o+=`<path d="M156,${h-78} L244,${h-78} L256,${h-16} L144,${h-16}Z" fill="none" stroke="${ho}" stroke-width="2.4" opacity=".55"/>`+LN(`M156,${h-78} L144,${h-16} M244,${h-78} L256,${h-16}`,shade(c,.12),1.2,.4)}
 o+=J.sleeves;
 o+=hands();
 return o;
}
/* ---------- cheveux bouclés : contour en boucles et vrilles ---------- */
function scallop(pts,b,cx,cy){let d=`M${pts[0][0]},${pts[0][1]}`;const P=pts.concat([pts[0]]);
 for(let i=0;i<P.length-1;i++){const [x0,y0]=P[i],[x1,y1]=P[i+1],mx=(x0+x1)/2,my=(y0+y1)/2,ox=mx-cx,oy=my-cy,l=Math.hypot(ox,oy)||1;d+=` Q${(mx+ox/l*b).toFixed(1)},${(my+oy/l*b).toFixed(1)} ${x1},${y1}`}return d+'Z'}
/* lumière et ombre douces pour les cheveux crépus (pas de boucles dessinées) */
function softLight(p,id,clip,parts){return `<defs><clipPath id="${p}${id}c"><path d="${clip}"/></clipPath>${parts.map((q,i)=>`<radialGradient id="${p}${id}${i}"><stop offset="0" stop-color="${q[4]}" stop-opacity="${q[5]}"/><stop offset="1" stop-color="${q[4]}" stop-opacity="0"/></radialGradient>`).join('')}</defs><g clip-path="url(#${p}${id}c)">${parts.map((q,i)=>`<ellipse cx="${q[0]}" cy="${q[1]}" rx="${q[2]}" ry="${q[3]}" fill="url(#${p}${id}${i})"/>`).join('')}</g>`}
function ringlets(list,hD,hL){return list.map(([x,y,n,dir,w])=>{let d=`M${x},${y}`;for(let i=0;i<n;i++){const k=i%2?-dir:dir;d+=` c${k*16},4 ${k*16},22 0,26`}
 return `<path d="${d}" fill="none" stroke="${hD}" stroke-width="${w||5}" stroke-linecap="round" opacity=".6"/><path d="${d}" transform="translate(${dir*3},-3)" fill="none" stroke="${hL}" stroke-width="2.6" stroke-linecap="round" opacity=".5"/>`}).join('')}
const CURLY_BACK=[[200,46],[244,48],[282,64],[312,92],[334,130],[348,176],[356,226],[358,280],[352,334],[344,388],[300,410],[100,410],[56,388],[48,334],[44,280],[46,226],[54,176],[68,130],[90,92],[120,64],[158,48]];
const CURLY_L=[[104,200],[86,240],[74,290],[66,340],[62,390],[64,440],[72,490],[84,540],[100,570],[124,580],[146,566],[150,520],[146,470],[146,420],[150,370],[156,330],[162,296],[150,250],[126,214]];
const CURLY_R=[[296,200],[316,240],[328,290],[336,340],[338,390],[332,440],[322,490],[300,520],[276,512],[262,470],[256,420],[252,370],[248,330],[244,296],[262,250],[280,214]];
const CURLY_TOP=[[150,62],[196,50],[246,54],[286,76],[312,112],[322,156],[320,204],[306,248],[294,236],[284,206],[270,180],[248,160],[222,146],[198,136],[180,118],[166,98],[156,86],[140,108],[124,140],[112,176],[106,214],[100,180],[102,130],[120,90]];
function hgrad(p,s,hD,y2){return `<defs><linearGradient id="${p}lfg" gradientUnits="userSpaceOnUse" x1="0" y1="50" x2="0" y2="${y2}"><stop offset="0" stop-color="${shade(s.hairColor,.22)}"/><stop offset=".3" stop-color="${s.hairColor}"/><stop offset="1" stop-color="${hD}"/></linearGradient></defs>`}
const OUTL=(d,hD,w,op)=>`<path d="${d}" fill="none" stroke="${shade(hD,-.45)}" stroke-width="${w}" stroke-linejoin="round" opacity="${op}"/>`;
/* zone « bas du visage + cou » où les cheveux passent derrière : le contour suit la mâchoire du visage choisi
   (au-dessus de y0 les cheveux restent devant le visage, en dessous le visage et le cou les recouvrent) */
const NZ={};
function neckZone(face,FY){const k=face+FY;if(NZ[k])return NZ[k];const d=(FACES[face]||FACES.joufflu).d,n=d.match(/-?[\d.]+/g).map(Number);
 const P=[];let cx=n[0],cy=n[1];for(let i=2;i+5<n.length;i+=6){const [x1,y1,x2,y2,x3,y3]=n.slice(i,i+6);for(let t=0;t<=1;t+=.05){const u=1-t;P.push([u*u*u*cx+3*u*u*t*x1+3*u*t*t*x2+t*t*t*x3,u*u*u*cy+3*u*u*t*y1+3*u*t*t*y2+t*t*t*y3])}cx=x3;cy=y3}
 const y0=240,X0=126,X1=274,low=P.filter(q=>q[1]>=y0),L=low.filter(q=>q[0]<200&&q[0]<=X0).sort((a,b)=>a[1]-b[1]),R=low.filter(q=>q[0]>200&&q[0]>=X1).sort((a,b)=>b[1]-a[1]);
 const f=q=>q[0].toFixed(1)+','+q[1].toFixed(1);
 return NZ[k]=`M${[...L.map(f),`${X0},${FY}`,`${X1},${FY}`,...R.map(f)].join(' L')}Z`}
/* coiffures décalquées sur les dessins de Prescillia (js/coiffures-art.js) : dans une autre couleur,
   chaque nuance garde son écart de clarté avec la teinte principale ; les nuances sont adoucies (flou) dans la silhouette */
const HART=s=>typeof HAIR_ART!=='undefined'&&HAIR_ART[s.hair];
/* oreilles du jeu (même ellipse que leur dessin) : trous dans les cheveux de devant quand la coiffure les dégage */
function earHoles(s){const ex=(FACES[s.face]||FACES.joufflu).ex,big=s.face==='naturel',rx=(big?21:17)-1.5,ry=(big?31:27)-1.5;
 return [ex-(big?3:0),400-ex+(big?3:0)].map(x=>`M${x-rx},207 a${rx},${ry} 0 1,0 ${2*rx},0 a${rx},${ry} 0 1,0 ${-2*rx},0Z`).join(' ')}
function hairArt(s,part,p){const A=HART(s),L=A[part];if(!L||!L.length)return '';const hc=s.hairColor,m=A.main,same=Math.hypot(...rgb(hc).map((v,i)=>v-rgb(m)[i]))<40;
 const tint=f=>{if(same)return f;const d=lum(f)-lum(m);return d>=0?mix(hc,shade(hc,.55),Math.min(1,d*3.2)):mix(hc,shade(hc,-.6),Math.min(1,-d*3.2))};
 const id=p+'ha'+part,sil=L[0][1];
 /* devant : les vrais pixels du dessin ; dans une autre couleur, un filtre convertit la clarté de chaque pixel vers la nouvelle teinte
    (flou vertical avant, dans le sens des mèches : sans lui, les petits écarts des cheveux foncés deviennent des blocs en clair) */
 /* l'image est posée deux fois : derrière le corps (les cheveux de l'arrière passent derrière les épaules)
    et devant, découpée pour ne garder que la tête et les mèches qui tombent sur la poitrine */
 if(A.img){const [x,y,w,h]=A.img,[l0,lm,l1]=A.lum;let flt='',fid=p+'haf'+part,cid=p+'hac';
  if(!same){const dk=shade(hc,-.75),lt=shade(hc,.45),N=16,tab=[[],[],[]];
   for(let i=0;i<N;i++){const v=i/(N-1),c=v<=lm?mix(dk,hc,clamp((v-l0)/(lm-l0),0,1)):mix(hc,lt,clamp((v-lm)/(l1-lm),0,1));rgb(c).forEach((q,j)=>tab[j].push((q/255).toFixed(3)))}
   flt=`<defs><filter id="${fid}" color-interpolation-filters="sRGB"><feGaussianBlur stdDeviation=".45 1.3"/><feColorMatrix type="matrix" values=".299 .587 .114 0 0 .299 .587 .114 0 0 .299 .587 .114 0 0 0 0 0 1 0"/><feComponentTransfer><feFuncR type="table" tableValues="${tab[0].join(' ')}"/><feFuncG type="table" tableValues="${tab[1].join(' ')}"/><feFuncB type="table" tableValues="${tab[2].join(' ')}"/></feComponentTransfer><feComposite in2="SourceAlpha" operator="in"/></filter></defs>`}
  const img=`<image href="assets/coiffures/${s.hair}.png" x="${x}" y="${y}" width="${w}" height="${h}" preserveAspectRatio="none"${same?'':` filter="url(#${fid})"`}/>`;
  /* derrière le cou : fond sombre plein sous l'image, pour qu'il ne reste aucun trou entre les mèches et le cou */
  const FY=A.fcut?A.fcut[0]:345,FX=A.fcut?A.fcut[1]:112;
  if(part==='back'&&A.dos)return flt+img.replace(`${s.hair}.png`,`${s.hair}-dos.png`);   /* cheveux sous les épaules : vides remplis de mèches, derrière le corps */
  if(part==='back')return `<defs><clipPath id="${cid}n"><rect x="120" y="240" width="160" height="${FY-200}"/></clipPath></defs><path d="${L[0][1]}" fill="${shade(same?A.main:hc,same?-.5:-.62)}" clip-path="url(#${cid}n)"/>`+flt+img;
  return flt+`<defs><clipPath id="${cid}"><path d="M-400,-400 L800,-400 L800,${FY} L${200+FX},${FY} L${200+FX},1600 L${200-FX},1600 L${200-FX},${FY} L-400,${FY}Z ${neckZone(s.face,FY)}${A.ears?earHoles(s):''}" clip-rule="evenodd"/></clipPath></defs><g clip-path="url(#${cid})">${img}${A.acc?`<image href="assets/coiffures/${s.hair}-acc.png" x="${x}" y="${y}" width="${w}" height="${h}" preserveAspectRatio="none"/>`:''}</g>`}
 if(part==='back')return `<path d="${sil}" fill="${shade(tint(A.main),-.45)}"/>`;
 return `<defs><clipPath id="${id}c"><path d="${sil}"/></clipPath><filter id="${id}f" x="-5%" y="-5%" width="110%" height="110%"><feGaussianBlur stdDeviation="2.4"/></filter></defs>`
  +`<path d="${sil}" fill="${tint(L[0][2])}"/><g clip-path="url(#${id}c)"><g filter="url(#${id}f)">${L.slice(1).map(l=>`<path d="${l[1]}" fill="${tint(l[2])}"/>`).join('')}</g></g>`
  +`<path d="${A.edge||sil}" fill="none" stroke="${shade(tint(L[0][2]),-.35)}" stroke-width="1.6" stroke-linejoin="round" opacity=".7" clip-path="url(#${id}c)"/>`}
function hairBack(s,p,hD){
 const f=`url(#${p}hr)`;
 switch(s.hair){
  case 'tresse':return `<path d="M88,200 C80,100 320,100 312,200 L300,250 L100,250Z" fill="${hD}"/>`;
  case 'longs':return `<path d="M84,170 C68,66 332,66 316,170 L346,400 L54,400Z" fill="${f}"/><path d="M84,170 C68,66 332,66 316,170 L346,400 L54,400Z" fill="${hD}" opacity=".25"/>`;
  case 'carre':return `<path d="M78,190 C64,68 336,68 322,190 L330,300 Q300,322 262,312 L138,312 Q100,322 70,300Z" fill="${f}"/>`;
  case 'queue':return `<path d="M250,85 C330,58 372,140 354,230 C342,290 314,330 300,348 C318,272 312,190 266,130Z" fill="${f}"/>`;
  case 'chignon':return `<circle cx="200" cy="60" r="42" fill="${f}"/><path d="M168,50 C185,30 215,30 232,50" fill="none" stroke="${hD}" stroke-width="2.5" opacity=".45"/>`;
  case 'frange':return `<path d="${LONGBACK}" fill="${f}"/><path d="${LONGBACK}" fill="${hD}" opacity=".25"/>`;
  case 'demichignon':return `<path d="${LONGBACK}" fill="${f}"/><path d="${LONGBACK}" fill="${hD}" opacity=".25"/><circle cx="200" cy="44" r="34" fill="${f}"/><path d="M176,38 C190,22 212,22 226,38" fill="none" stroke="${hD}" stroke-width="2.5" opacity=".45"/>`;
  case 'longsondules':case 'ondulescote':return `<path d="${LONGWAVE}" fill="${f}"/><path d="${LONGWAVE}" fill="${hD}" opacity=".22"/><path d="M76,250 C92,280 64,310 80,350 M324,250 C308,280 336,310 320,350" stroke="${hD}" stroke-width="3" fill="none" opacity=".4"/>`;
  case 'boucleslongues':{let r=`<path d="${LONGWAVE}" fill="${f}"/>`;for(let y=140;y<=380;y+=30){r+=`<circle cx="${70+Math.sin(y)*6}" cy="${y}" r="30" fill="${f}"/><circle cx="${330-Math.sin(y)*6}" cy="${y}" r="30" fill="${f}"/>`}for(let x=90;x<=310;x+=44)r+=`<circle cx="${x}" cy="392" r="28" fill="${f}"/>`;return r+`<path d="${LONGWAVE}" fill="${hD}" opacity=".18"/>`}
  case 'lisselong':return `<defs><linearGradient id="${p}llg" gradientUnits="userSpaceOnUse" x1="0" y1="36" x2="0" y2="530"><stop offset="0" stop-color="${shade(s.hairColor,.05)}"/><stop offset=".35" stop-color="${shade(s.hairColor,-.08)}"/><stop offset="1" stop-color="${shade(s.hairColor,-.35)}"/></linearGradient></defs><path d="${LL_BACK}" fill="url(#${p}llg)"/><path d="M118,236 L282,236 L300,520 L100,520Z" fill="${shade(hD,-.45)}" opacity=".6"/>`+OUTL(LL_BACK,hD,2.4,.5);
  case 'longondule':return hgrad(p,s,hD,600)+`<path d="${LW_BACK}" fill="url(#${p}lfg)"/><path d="M118,236 L282,236 L290,580 L110,580Z" fill="${shade(hD,-.35)}" opacity=".55"/>`+OUTL(LW_BACK,hD,3,.65);
  case 'carreondule':return hgrad(p,s,hD,330)+`<path d="${BOBWAVE}" fill="url(#${p}lfg)"/><path d="M112,236 L288,236 L300,306 L100,306Z" fill="${shade(hD,-.35)}" opacity=".55"/>`+OUTL(BOBWAVE,hD,3,.65);
  case 'bouclesvol':return `<path d="${scallop(CURLY_BACK,15,200,220)}" fill="${f}"/><path d="${scallop(CURLY_BACK,15,200,220)}" fill="${hD}" opacity=".25"/>`+ringlets([[66,160,7,1],[92,190,6,-1],[334,160,7,-1],[310,190,6,1],[74,250,5,1],[328,250,5,-1]],shade(hD,-.2),shade(s.hairColor,.3));
  case 'miboucle':return hgrad(p,s,hD,360)+`<path d="M90,200 C76,72 130,44 200,44 C276,44 326,80 312,200Z" fill="url(#${p}lfg)"/><path d="${scallop(MB_BACK,11,200,290)}" fill="url(#${p}lfg)"/><path d="${scallop(MB_BACK,11,200,290)}" fill="${shade(hD,-.35)}" opacity=".5"/>`;
  case 'longboucle':{const b=scallop(LB_BACK,10,200,210);return hgrad(p,s,hD,420)+`<path d="${b}" fill="url(#${p}lfg)"/><path d="M146,236 L254,236 L246,404 L154,404Z" fill="${shade(hD,-.4)}" opacity=".6"/>`+OUTL(b,hD,3,.6)+ringlets([[70,110,4,1],[330,110,4,-1],[66,250,3,-1],[334,250,3,1]],hD,shade(s.hairColor,.28))}
  case 'ananas':{const pf=scallop(AN_PTS,10,204,-12);return `<defs><linearGradient id="${p}anp" gradientUnits="userSpaceOnUse" x1="0" y1="-100" x2="0" y2="82"><stop offset="0" stop-color="${shade(s.hairColor,.22)}"/><stop offset=".5" stop-color="${s.hairColor}"/><stop offset="1" stop-color="${hD}"/></linearGradient></defs><path d="${pf}" fill="url(#${p}anp)"/>`+OUTL(pf,hD,2.6,.6)+softLight(p,'anl',pf,[[178,-52,70,46,shade(s.hairColor,.42),.55],[244,-30,36,30,shade(s.hairColor,.3),.35],[204,62,110,36,shade(hD,-.45),.55],[110,-6,34,70,shade(hD,-.3),.4],[298,-6,34,70,shade(hD,-.3),.4]])}
  case 'lobraie':return hgrad(p,s,hD,420)+`<path d="${LOB_B}" fill="url(#${p}lfg)"/><path d="M118,236 L282,236 L268,400 L134,400Z" fill="${shade(hD,-.4)}" opacity=".6"/>`;
  case 'meches':return `<path d="M84,196 C64,60 336,60 316,196Z" fill="${shade(hD,-.25)}"/>`;
  case 'lisseoreilles':{const hc=s.hairColor,w=mix(hc,'#a0603a',.3);return `<defs><linearGradient id="${p}lfg" gradientUnits="userSpaceOnUse" x1="0" y1="20" x2="0" y2="600"><stop offset="0" stop-color="${mix(w,'#ffffff',.06)}"/><stop offset=".12" stop-color="${hc}"/><stop offset=".5" stop-color="${mix(hc,w,.35)}"/><stop offset="1" stop-color="${shade(hc,-.25)}"/></linearGradient></defs>`+`<path d="M96,190 C80,90 320,90 304,190 L300,566 L100,566Z" fill="${shade(hD,-.3)}"/>`}
  case 'carreplongeant':return hgrad(p,s,hD,320)+`<path d="${BOB}" fill="url(#${p}lfg)"/><path d="M112,236 L288,236 L300,298 L100,298Z" fill="${shade(hD,-.35)}" opacity=".55"/>`+OUTL(BOB,hD,3,.65);
  case 'longfrange':return hgrad(p,s,hD,620)+`<path d="${LF_BACK}" fill="url(#${p}lfg)"/><path d="${LF_BACK}" fill="${hD}" opacity=".3"/><path d="M132,250 L268,250 L290,590 L110,590Z" fill="${shade(hD,-.35)}" opacity=".55"/>`;
  case 'carreretrousse':return `<path d="${FLIP}" fill="${f}"/>`;
  case 'queuehaute':return `<path d="M176,52 C170,14 230,4 236,40 C240,62 214,72 200,66Z" fill="${f}"/><path d="M186,40 C196,22 220,22 226,40" stroke="${hD}" stroke-width="2.5" fill="none" opacity=".45"/>`;
  case 'macarons':return puff(84,212,52,f)+puff(316,212,52,f);
  case 'boucles':{let r=`<ellipse cx="200" cy="172" rx="140" ry="120" fill="${f}"/>`;for(let t=150;t<=390;t+=15){const q=t*Math.PI/180;r+=`<circle cx="${(200+140*Math.cos(q)).toFixed(1)}" cy="${(175+125*Math.sin(q)).toFixed(1)}" r="42" fill="${f}"/>`}return r}
  case 'afro':return `<ellipse cx="200" cy="150" rx="166" ry="148" fill="${f}"/>`+bumps(200,150,166,148,26,f)+`<ellipse cx="200" cy="150" rx="172" ry="154" fill="url(#${p}coil)"/>`;
  case 'afropuff':return bumps(200,6,74,66,18,f,true)+`<ellipse cx="200" cy="6" rx="78" ry="70" fill="url(#${p}coil)"/>`;
  case 'washgo':{const m='M80,190 C64,70 336,70 320,190 C338,240 342,300 322,352 L78,352 C58,300 62,240 80,190Z';return `<path d="${m}" fill="${f}"/>`+[[76,230],[70,290],[80,344],[324,230],[330,290],[320,344],[120,360],[160,366],[200,368],[240,366],[280,360]].map(([x,y])=>`<circle cx="${x}" cy="${y}" r="22" fill="${f}"/>`).join('')+`<path d="${m}" fill="url(#${p}coil)"/>`}
  case 'boxbraids':case 'vanilles':case 'locks':return `<path d="M84,170 C66,62 334,62 316,170 L336,440 L64,440Z" fill="${hD}"/>`;
  case 'nattes':return [150,180,220,250].map(x=>`<path d="M${x},120 Q${x+(x<200?-10:10)},300 ${x+(x<200?-14:14)},430" stroke="${hD}" stroke-width="12" fill="none" stroke-linecap="round"/>`).join('');
  default:return '';
 }}
function curtain(kind,f,hD,hL,side,len){
 const P=kind==='wavy'?`M98,190 C86,236 98,276 84,318 C70,360 94,398 80,440 C66,482 90,520 80,${len-6} Q102,${len+12} 126,${len} C136,${len-30} 122,${len-56} 136,${len-90} C150,${len-120} 138,410 150,382 C158,352 162,316 162,290 C140,268 120,236 112,196Z`
  :`M98,190 C90,250 82,320 78,400 C76,460 78,${len-40} 82,${len} L138,${len} C136,${len-40} 138,460 146,400 C152,350 158,312 162,290 C140,268 120,236 112,196Z`;
 const ln=(d,w,c,op)=>`<path d="${d}" fill="none" stroke="${c}" stroke-width="${w}" stroke-linecap="round" opacity="${op}"/>`;
 const L=kind==='wavy'?ln(`M112,250 C100,292 114,330 100,372 C86,414 108,452 96,${len-30}`,2.4,hD,.45)+ln(`M128,300 C120,340 132,380 120,420 C110,460 126,${len-60} 116,${len-10}`,2,hL,.35)
  :ln(`M112,260 C104,340 98,420 98,${len-10}`,2.2,hD,.4)+ln(`M128,300 C122,380 118,450 118,${len-6}`,2,hL,.35)+ln(`M96,300 C90,380 88,450 90,${len-20}`,1.6,hD,.3);
 return (side===-1?'<g transform="translate(400,0) scale(-1,1)">':'<g>')+`<path d="${P}" fill="${f}"/>`+L+'</g>';
}
function hairMid(s,p,hD,hL){
 const f=`url(#${p}hr)`,ln=(d,w,c,op)=>`<path d="${d}" fill="none" stroke="${c}" stroke-width="${w}" stroke-linecap="round" opacity="${op}"/>`;
 switch(s.hair){
  case 'bouclesvol':return `<path d="${scallop(CURLY_L,13,110,400)}" fill="${f}"/><path d="${scallop(CURLY_R,13,292,370)}" fill="${f}"/>`+ringlets([[84,290,10,1],[108,316,10,-1],[130,344,8,1],[94,430,5,1],[316,286,8,-1],[292,306,8,1],[272,340,6,-1]],hD,hL);
  case 'longboucle':{const l=scallop(LB_L,9,110,300),r=scallop(LB_R,9,300,300);return `<path d="${l}" fill="url(#${p}lfg)"/><path d="${r}" fill="url(#${p}lfg)"/>`+OUTL(l,hD,2.6,.6)+OUTL(r,hD,2.6,.6)+ringlets([[72,206,7,1],[96,226,6,-1],[120,262,5,1],[148,306,3,-1],[72,330,2,-1],[328,206,7,-1],[304,226,6,1],[280,262,5,-1],[254,306,3,1],[340,330,2,1]],hD,hL)}
  case 'lisseoreilles':{const one=`<path d="${LO_CUR}" fill="url(#${p}lfg)"/>`+OUTL('M84,100 C78,160 70,240 62,320 C58,380 56,460 56,520 C56,540 56,556 58,568 L76,560 L92,572 L108,562 L124,572 L142,564 C140,500 140,420 142,350 C144,320 150,300 160,280',hD,2.4,.55)
    +`<path d="M160,282 C150,300 144,320 142,350 C140,420 140,500 142,564 L132,568 C130,500 130,420 132,350 C134,316 140,296 150,276Z" fill="${hD}" opacity=".45"/>`
    +ln('M80,200 C72,280 66,380 66,470 C66,520 68,550 70,566',2,hD,.4)+ln('M98,220 C92,300 88,400 88,480 C88,530 90,555 92,570',2.2,hL,.45)+ln('M114,300 C110,380 108,460 108,520 C108,545 110,560 110,566',1.8,hD,.35)+ln('M126,320 C124,400 124,480 126,560',2,hL,.35)+ln('M72,300 C68,360 66,420 66,470',3.4,hL,.22);
   return one+`<g transform="translate(400,0) scale(-1,1)">${one}</g>`}
  case 'lisselong':{const dk=shade(s.hairColor,-.55),hi=shade(s.hairColor,.3);const one=`<path d="${LL_CUR}" fill="url(#${p}llg)"/>`+OUTL(LL_CUR,hD,2.2,.5)+`<path d="M124,214 C140,258 140,292 136,318 C130,372 128,450 130,524 L118,524 C118,450 120,372 126,318 C130,290 130,258 116,220Z" fill="${dk}" opacity=".35"/>`+ln('M74,200 C62,260 56,360 52,516',2,dk,.45)+ln('M92,190 C80,260 74,360 72,518',2,dk,.4)+ln('M110,230 C100,290 96,380 96,518',1.8,dk,.4)+ln('M84,220 C72,280 66,370 64,500',2.6,hi,.35)+ln('M102,250 C92,320 88,400 86,510',2.2,hi,.3);return one+`<g transform="translate(400,0) scale(-1,1)">${one}</g>`}
  case 'longondule':{const one=`<path d="${LW_CUR}" fill="url(#${p}lfg)"/>`+OUTL(LW_CUR,hD,2.6,.6)+`<path d="M160,292 C150,320 144,360 142,420 C140,480 140,540 140,590 L130,592 C130,540 130,480 132,420 C134,360 140,318 150,288Z" fill="${hD}" opacity=".45"/>`+ln('M92,226 C84,300 80,380 80,460 C80,520 82,560 86,588',2.2,hD,.45)+ln('M120,280 C114,340 112,400 112,460 C112,520 114,560 116,594',2.2,hL,.4)+ln('M104,250 C98,320 94,400 94,480 C94,540 96,570 98,598',1.6,hD,.35);return one+`<g transform="translate(400,0) scale(-1,1)">${one}</g>`}
  case 'miboucle':{const o=shade(hD,-.45);return `<path d="${scallop(MB_L,11,100,290)}" fill="url(#${p}lfg)"/><path d="${scallop(MB_R,11,300,290)}" fill="url(#${p}lfg)"/>`+OUTL(scallop(MB_L,11,100,290),hD,2.6,.6)+OUTL(scallop(MB_R,11,300,290),hD,2.6,.6)+softLight(p,'mbl',scallop(MB_L,11,100,290),[[78,258,40,26,shade(s.hairColor,.38),.5],[130,330,60,30,shade(hD,-.45),.55],[150,280,24,40,shade(hD,-.35),.45]])+softLight(p,'mbr',scallop(MB_R,11,300,290),[[322,258,40,26,shade(s.hairColor,.38),.5],[270,330,60,30,shade(hD,-.45),.55],[250,280,24,40,shade(hD,-.35),.45]])}
  case 'longfrange':{const one=`<path d="${LF_CUR}" fill="url(#${p}lfg)"/><path d="M152,292 C146,314 144,344 142,384 C140,440 140,520 140,596 L128,588 C128,520 128,440 130,384 C132,340 136,310 142,288Z" fill="${hD}" opacity=".5"/>`+ln('M100,300 C96,380 94,470 94,560 L99,610',2.2,hD,.45)+ln('M118,310 C116,390 116,480 118,560 L119,602',2.4,hL,.45)+ln('M90,330 C88,410 86,490 86,570',1.6,hD,.35)+ln('M110,340 C108,390 108,440 108,480',3.4,hL,.25);return one+`<g transform="translate(400,0) scale(-1,1)">${one}</g>`}
  case 'longs':return curtain('straight',f,hD,hL,1,566)+curtain('straight',f,hD,hL,-1,566);
  case 'demichignon':return curtain('straight',f,hD,hL,1,540)+curtain('straight',f,hD,hL,-1,540);
  case 'frange':return curtain('straight',f,hD,hL,-1,650);
  case 'longsondules':return curtain('wavy',f,hD,hL,1,560)+curtain('wavy',f,hD,hL,-1,560);
  case 'boucleslongues':{let r=curtain('wavy',f,hD,hL,1,560)+curtain('wavy',f,hD,hL,-1,560);[[86,330],[80,420],[88,500],[314,330],[320,420],[312,500]].forEach(([x,y])=>{r+=`<circle cx="${x}" cy="${y}" r="20" fill="${f}"/>`+ln(`M${x-10},${y-4} q10,-12 20,0`,2,hD,.4)});return r}
  case 'ondulescote':return curtain('straight',f,hD,hL,1,430)+`<path d="M296,196 C334,240 312,290 330,340 C350,392 318,440 336,500 C350,552 322,604 290,608 C274,604 268,592 280,580 C302,562 300,522 286,488 C270,448 296,412 282,372 C268,332 282,292 272,262Z" fill="${f}"/>`+ln('M300,236 C318,280 300,320 316,360 C332,400 304,440 320,490 C332,530 312,570 296,590',2.4,hD,.45)+ln('M290,270 C300,310 288,350 300,390 C310,430 294,470 304,520',2,hL,.35);
  case 'queuehaute':return `<path d="M232,54 C320,70 344,170 322,260 C304,340 338,410 320,490 C310,540 288,570 270,576 C286,540 284,500 278,470 C266,410 292,360 292,300 C292,220 272,130 214,70Z" fill="${f}"/>`+ln('M250,80 C300,120 316,190 306,260 C296,330 320,400 304,470 C298,510 288,540 278,560',2.4,hD,.45)+ln('M262,140 C290,200 290,260 284,310 C278,370 300,430 290,500',2,hL,.35);
  case 'couettes':return `<path d="M104,246 C60,250 34,302 44,352 C50,380 70,392 90,384 C74,374 70,356 80,344 C100,320 116,282 104,246Z" fill="${f}"/><path d="M296,246 C340,250 366,302 356,352 C350,380 330,392 310,384 C326,374 330,356 320,344 C300,320 284,282 296,246Z" fill="${f}"/>`+ln('M92,270 C70,296 62,330 70,360 M308,270 C330,296 338,330 330,360',2.4,hD,.45)+``;
  case 'tresse':{let b='',x=100,y=255;for(let i=0;i<12;i++){x=100+i*1.6;y=255+i*24;b+=`<ellipse cx="${fx(x)}" cy="${y}" rx="${23-i*.6}" ry="15" transform="rotate(${i%2?-28:28} ${fx(x)} ${y})" fill="${f}" stroke="${hD}" stroke-opacity=".4" stroke-width="2"/>`}
   return b+`<path d="M${fx(x-9)},${y+18} Q${fx(x)},${y+60} ${fx(x+10)},${y+18}Z" fill="${f}"/><rect x="${fx(x-10)}" y="${y+10}" width="20" height="9" rx="4.5" fill="#e7837b"/>`}
  case 'boxbraids':return braids(s,hD,hL,620,11,'2.5 5',7);
  case 'vanilles':return braids(s,hD,hL,520,13,'6 4',6);
  case 'locks':return braids(s,hD,hL,580,15,'10 3',6);
  case 'washgo':return [[90,300],[84,346],[310,300],[316,346]].map(([x,y])=>`<circle cx="${x}" cy="${y}" r="20" fill="${f}"/>`+ln(`M${x-9},${y-3} q9,-11 18,0`,2,hD,.4)).join('');
  default:return '';
 }}
function hairFront(s,p,hD,hL){
 const fd=`<path d="M100,184 C98,164 102,150 108,138 L134,140 C126,156 122,170 120,188 L110,186Z M300,184 C302,164 298,150 292,138 L266,140 C274,156 278,170 280,188 L290,186Z" fill="${mix(s.hairColor,s.skin,.5)}"/>`;
 const f=`url(#${p}hr)`, st=(d,w,c,op)=>`<path d="${d}" fill="none" stroke="${c}" stroke-width="${w}" stroke-linecap="round" opacity="${op}"/>`;
 const shine=st('M150,80 C130,92 116,112 108,135',6,hL,.35);
 switch(s.hair){
  case 'bouclesvol':return `<path d="${scallop(CURLY_TOP,11,210,140)}" fill="${f}"/>`+ringlets([[204,60,2,1],[246,68,3,-1],[284,96,4,1],[306,140,3,-1]],hD,hL)+`<path d="M260,146 C288,172 270,198 284,224 C296,248 282,270 266,278 C278,254 262,236 262,214 C262,192 248,172 260,146Z" fill="${f}"/>`+st('M262,154 C280,176 266,200 278,224 C288,244 278,262 270,270',3.4,hD,.6)+st('M156,86 C160,74 162,68 166,62',2,hD,.6)+st('M200,58 C240,60 280,82 300,120',5,hL,.3);

  case 'tresse':case 'longs':return `<path d="${MIDPART}" fill="${f}"/>`+st('M190,72 C156,86 122,122 100,200',2.2,hD,.4)+st('M210,72 C244,86 278,122 300,200',2.2,hD,.4)+st('M196,62 C150,70 112,110 100,170',2,hD,.35)+st('M204,62 C250,70 288,110 300,170',2,hD,.35)+st('M200,98 L200,60',2,hD,.5)+shine;
  case 'longsondules':case 'boucleslongues':return `<path d="${MIDPART}" fill="${f}"/>`+st('M190,72 C156,86 122,122 100,200',2.2,hD,.4)+st('M210,72 C244,86 278,122 300,200',2.2,hD,.4)+st('M200,98 L200,60',2,hD,.5)+shine;
  case 'ondulescote':case 'carreretrousse':return `<path d="${SIDEPART}" fill="${f}"/>`+st('M140,98 C190,112 250,140 290,166',2.2,hD,.45)+st('M140,98 C122,120 110,140 102,160',2,hD,.4)+st('M150,70 C200,72 260,96 296,140',2,hD,.3)+shine;
  case 'longfrange':return `<path d="${LF_FRINGE_SH}" fill="#3a1a10" opacity=".15" transform="translate(0,8)"/><path d="${LF_TOP}" fill="url(#${p}lfg)"/><path d="M200,54 C284,56 328,124 304,236 L300,262 C306,200 300,150 270,110 C250,90 226,80 200,80Z" fill="${hD}" opacity=".22"/>`+st('M120,114 C160,92 240,92 280,114',10,hL,.32)+st('M150,96 C140,130 142,170 136,192 M176,88 C170,130 172,170 162,202 M202,84 C206,110 208,130 208,148 M214,86 C214,130 200,170 192,194 M250,94 C248,140 246,170 240,198 M272,104 C274,140 274,170 268,196',2,hD,.42)+st('M166,110 C160,140 154,170 148,190 M232,100 C234,140 230,170 228,188 M190,96 C188,130 188,150 184,172',1.6,hD,.3)+st('M92,180 C90,230 90,280 92,320 M308,180 C310,230 310,280 308,320',2,hD,.4)+st('M106,200 C108,240 106,280 102,306 M294,200 C292,240 294,280 298,306',1.6,hL,.4)+st('M82,150 C76,210 76,300 78,400 C78,480 76,540 78,604',3,shade(hD,-.45),.7)+st('M318,150 C326,200 326,250 322,300 C322,350 322,420 322,604',3,shade(hD,-.45),.7)+st('M284,168 C300,166 316,170 322,186',2.6,shade(hD,-.4),.6)+st('M118,190 C110,230 100,280 96,320',2.6,shade(hD,-.4),.55)+st('M316,250 C314,300 306,350 302,410',2.6,shade(hD,-.4),.55);
  case 'miboucle':return `<path d="${MB_TOP}" fill="#3a1a10" opacity=".15" transform="translate(0,8)"/><path d="${MB_TOP}" fill="url(#${p}lfg)"/>`+OUTL(MB_TOP,hD,2.6,.6)+softLight(p,'mbt',MB_TOP,[[180,62,80,26,shade(s.hairColor,.4),.55],[200,120,120,22,shade(hD,-.4),.4]]);
  case 'longboucle':return `<path d="${LB_TOP}" fill="#3a1a10" opacity=".15" transform="translate(0,8)"/><path d="${LB_TOP}" fill="url(#${p}lfg)"/>`+OUTL(LB_TOP,hD,2.6,.6)+st('M120,80 C160,50 240,46 290,74',10,hL,.35)+ringlets([[140,34,2,1],[196,20,2,-1],[252,22,2,1],[306,48,2,-1],[112,62,1,1],[338,84,1,-1]],hD,hL);
  case 'ananas':return hgrad(p,s,hD,200)+`<path d="${AN_CAP}" fill="#3a1a10" opacity=".15" transform="translate(0,7)"/><path d="${AN_CAP}" fill="url(#${p}lfg)"/>`+OUTL(AN_CAP,hD,2.6,.6)+st('M120,92 C160,70 240,70 284,92',9,hL,.35)+st('M116,126 C130,98 156,76 184,60 M158,90 C170,80 184,70 196,58 M206,88 C206,78 206,68 204,56 M250,94 C240,82 228,70 216,58 M286,130 C276,104 256,80 230,62',2,hD,.45)+st('M134,104 C150,88 168,76 190,64 M228,88 C226,80 220,70 212,60',1.6,hL,.35);
  case 'lobraie':return `<path d="${LOB_F}" fill="#3a1a10" opacity=".15" transform="translate(0,8)"/><path d="${LOB_F}" fill="url(#${p}lfg)"/>`+OUTL(LOB_F,hD,2.6,.6)
   +st('M180,58 C148,68 124,90 110,122',12,hL,.5)+st('M220,58 C252,68 276,90 290,122',12,hL,.5)
   +st('M194,62 C160,76 134,110 124,150 C112,196 104,240 98,280 C96,320 100,360 104,396',2.2,hD,.45)+st('M206,62 C240,76 266,110 276,150 C288,196 296,240 302,280 C304,320 300,360 296,396',2.2,hD,.45)+st('M186,54 C140,68 104,116 94,176 C86,240 86,320 88,396',2,hD,.38)+st('M214,54 C260,68 296,116 306,176 C314,240 314,320 312,396',2,hD,.38)+st('M180,70 C150,90 130,130 120,180 C112,230 106,270 116,320 C120,350 120,380 120,396',1.8,hL,.4)+st('M220,70 C250,90 270,130 280,180 C288,230 294,270 284,320 C280,350 280,380 280,396',1.8,hL,.4)
   +st('M80,220 C78,280 78,340 80,396 M320,220 C322,280 322,340 320,396',1.8,hD,.35)
   +st('M200,106 L200,42',2.8,shade(hD,-.45),.75);
  case 'meches':{const hc=s.hairColor,dk=shade(hc,-.55),hi=shade(hc,.34);
   const L=[['M200,12 C170,24 160,44 150,64 C140,84 150,100 136,118 C126,132 130,142 122,152',3],['M228,8 C206,24 196,44 194,66 C192,86 206,100 200,118 C196,130 198,138 196,144',3.2],
    ['M252,12 C280,26 286,46 288,66 C290,86 278,100 286,118 C290,128 282,140 274,148',3],['M170,10 C136,24 116,44 106,68 C96,90 106,108 94,128 C88,140 90,156 96,170',2.6],
    ['M276,18 C306,34 318,56 320,80 C322,100 312,112 318,128',2.6],['M120,40 C100,58 88,80 80,104',2.2],['M214,30 C230,50 236,70 232,92',2.2],['M160,40 C176,58 178,80 170,100',2.2]];
   const H=[['M196,20 C176,34 168,52 162,70 C156,86 162,98 154,112',3.2],['M242,20 C262,34 270,52 270,72',3],['M150,28 C126,44 114,64 110,84',2.8],['M300,44 C312,62 316,80 312,96',2.6],['M226,40 C210,56 206,74 210,92',2.4]];
   return `<defs><linearGradient id="${p}wvg" gradientUnits="userSpaceOnUse" x1="0" y1="-10" x2="0" y2="190"><stop offset="0" stop-color="${shade(hc,.1)}"/><stop offset=".5" stop-color="${shade(hc,-.05)}"/><stop offset="1" stop-color="${shade(hc,-.32)}"/></linearGradient></defs><path d="${WV_F}" fill="#3a1a10" opacity=".15" transform="translate(0,7)"/><path d="${WV_F}" fill="url(#${p}wvg)"/>`
    +L.map(([d,w])=>st(d,w,dk,.55)).join('')+H.map(([d,w])=>st(d,w,hi,.42)).join('')
    +st('M96,150 C84,144 72,148 62,148 M90,118 C78,112 66,112 58,110 M314,96 C330,92 342,96 350,106 M310,70 C326,66 340,68 350,72',2.2,dk,.5)+st('M122,152 C114,150 112,142 118,138',2.4,dk,.6)+st('M196,144 C188,142 186,134 192,130',2.4,dk,.6)+st('M274,148 C282,146 284,138 278,134',2.4,dk,.6)+st('M146,150 C140,148 138,142 142,138',2,dk,.5)
    +OUTL(WV_F,hD,2.2,.55)}
  case 'raiecote':{const sk=s.skin,hc=s.hairColor,dk=shade(hc,-.55),hi=shade(hc,.3);
   const D=['M270,40 C230,18 170,16 120,40 C104,50 92,64 86,80','M268,58 C230,34 170,32 124,56 C108,66 96,80 90,96','M262,76 C226,54 172,52 132,72 C116,82 106,94 100,110','M258,92 C226,74 182,72 150,86 C136,94 126,102 118,110','M278,54 C294,66 306,82 312,100','M272,80 C286,90 296,104 300,120'];
   const Hh=['M250,48 C214,30 170,30 136,46','M244,70 C212,54 176,54 146,68','M286,72 C298,84 304,96 306,108'];
   return `<defs><linearGradient id="${p}rss" gradientUnits="userSpaceOnUse" x1="0" y1="104" x2="0" y2="188"><stop offset="0" stop-color="${shade(hc,-.25)}"/><stop offset=".35" stop-color="${shade(hc,-.12)}"/><stop offset=".78" stop-color="${mix(hc,sk,.72)}"/><stop offset="1" stop-color="${mix(hc,sk,.95)}"/></linearGradient><linearGradient id="${p}rsm" gradientUnits="userSpaceOnUse" x1="0" y1="0" x2="0" y2="136"><stop offset="0" stop-color="${shade(hc,.02)}"/><stop offset=".55" stop-color="${shade(hc,-.12)}"/><stop offset="1" stop-color="${shade(hc,-.38)}"/></linearGradient></defs>`
    +`<path d="${RS_SIDE}" fill="url(#${p}rss)"/><path d="${RS_SIDE}" transform="translate(400,0) scale(-1,1)" fill="url(#${p}rss)"/>`
    +`<path d="${RS_M}" fill="#3a1a10" opacity=".15" transform="translate(0,7)"/><path d="${RS_M}" fill="url(#${p}rsm)"/>`
    +st('M130,40 C170,22 230,22 266,34',8,hL,.28)+D.map(d=>st(d,2.2,dk,.5)).join('')+Hh.map(d=>st(d,2.6,hi,.38)).join('')
    +st('M112,116 C120,108 134,104 150,102 C190,99 240,99 266,104 C282,110 294,122 300,134',5,dk,.35)+st('M272,46 C268,68 264,88 262,102',2.6,mix(hc,sk,.55),.9)+OUTL(RS_M,hD,2,.5)}
  case 'chignonhaut':{const hc=s.hairColor,sk=s.skin,dk=shade(hc,-.55),hi=shade(hc,.32),bun=scallop(CH_BUN,5,200,4);
   const half=st('M116,134 C126,104 150,78 182,60',2,dk,.45)+st('M106,164 C108,124 128,88 166,62',2,dk,.4)+st('M134,108 C148,86 166,70 190,58',1.8,dk,.35)+st('M122,120 C136,94 158,74 186,62',3,hi,.32)
     +st('M132,108 q6,-6 12,-1 q6,5 12,-1',2.2,dk,.8)+st('M116,122 c-9,3 -9,14 -1,15 c8,1 8,-8 1,-9',2.2,dk,.85)+st('M107,146 c-7,3 -6,12 2,12',2,dk,.7);
   return `<defs><linearGradient id="${p}chg" gradientUnits="userSpaceOnUse" x1="0" y1="-50" x2="0" y2="186"><stop offset="0" stop-color="${shade(hc,.08)}"/><stop offset=".5" stop-color="${shade(hc,-.08)}"/><stop offset="1" stop-color="${shade(hc,-.3)}"/></linearGradient></defs>`
    +`<path d="${CH_CAP}" fill="#3a1a10" opacity=".14" transform="translate(0,7)"/><path d="${CH_CAP}" fill="url(#${p}chg)"/>`+OUTL(CH_CAP,hD,2.2,.5)
    +half+`<g transform="translate(400,0) scale(-1,1)">${half}</g>`
    +st('M200,52 L200,78',2.6,mix(hc,sk,.6),.9)
    +`<ellipse cx="200" cy="54" rx="52" ry="8" fill="${dk}" opacity=".45"/><path d="${bun}" fill="url(#${p}chg)"/>`+OUTL(bun,hD,2.2,.55)
    +st('M138,22 C156,-8 244,-8 262,22',2.4,dk,.5)+st('M146,42 C170,22 230,22 254,42',2.4,dk,.5)+st('M150,-26 C176,-44 224,-44 250,-26',2.2,dk,.45)+st('M136,0 C150,-30 186,-44 220,-40',2,dk,.4)+st('M262,-4 C252,-30 230,-42 206,-44',2,dk,.4)
    +st('M156,-6 C178,-24 222,-24 244,-6',4,hi,.38)+st('M162,30 C184,14 216,14 238,30',3,hi,.3)+st('M160,-34 C176,-42 194,-46 210,-44',3,hi,.3)}
  case 'fadehaut':{const sk=s.skin,hc=s.hairColor,dk=shade(hc,-.55),hi=shade(hc,.3);
   const D=['M96,106 C110,76 136,50 166,32','M110,106 C124,76 150,50 180,32','M124,106 C138,76 164,50 194,32','M138,106 C152,76 178,50 208,32','M152,106 C166,76 192,50 222,32','M166,106 C180,76 206,50 236,32','M180,106 C194,76 220,50 250,32','M194,106 C208,76 234,50 264,32','M208,106 C222,76 248,50 278,32','M222,106 C236,76 262,50 292,32','M236,106 C250,76 276,50 306,32','M250,106 C264,76 290,50 320,32','M264,106 C278,76 304,50 334,32','M278,106 C292,76 318,50 348,32','M292,106 C306,76 332,50 362,32','M306,106 C320,76 346,50 376,32'];
   const Hh=['M118,96 C134,70 160,52 192,40','M168,94 C186,68 214,50 246,40','M222,96 C240,72 266,58 296,52','M140,70 C158,48 184,34 214,26','M200,62 C222,42 250,30 280,30'];
   return `<defs><linearGradient id="${p}fhs" gradientUnits="userSpaceOnUse" x1="0" y1="108" x2="0" y2="182"><stop offset="0" stop-color="${shade(hc,-.3)}"/><stop offset=".3" stop-color="${shade(hc,-.15)}"/><stop offset=".75" stop-color="${mix(hc,sk,.72)}"/><stop offset="1" stop-color="${mix(hc,sk,.95)}"/></linearGradient><linearGradient id="${p}fhm" gradientUnits="userSpaceOnUse" x1="0" y1="10" x2="0" y2="116"><stop offset="0" stop-color="${shade(hc,.04)}"/><stop offset=".6" stop-color="${shade(hc,-.14)}"/><stop offset="1" stop-color="${shade(hc,-.4)}"/></linearGradient><clipPath id="${p}fhc"><path d="${FH_M}"/></clipPath></defs>`
    +`<path d="${FH_SIDE}" fill="url(#${p}fhs)"/><path d="${FH_SIDE}" transform="translate(400,0) scale(-1,1)" fill="url(#${p}fhs)"/>`
    +`<path d="M94,112 C140,106 260,106 306,112 L304,122 C260,116 140,116 96,122Z" fill="#3a1a10" opacity=".16"/><path d="${FH_M}" fill="url(#${p}fhm)"/>`
    +`<g clip-path="url(#${p}fhc)">`+D.map(d=>st(d,2,dk,.45)).join('')+Hh.map(d=>st(d,3,hi,.32)).join('')+st('M96,110 C140,104 260,104 306,110',6,dk,.35)+`</g>`+OUTL(FH_M,hD,1.8,.45)}
  case 'taper':{const sk=s.skin,hc=s.hairColor,m=TP_MASS,side=TP_SIDE,hi=shade(hc,.3),dk=shade(hc,-.55);
   const arc=([x,y,r,a0,sw])=>{const A=a0*Math.PI/180,B=(a0+sw)*Math.PI/180,x0=x+r*Math.cos(A),y0=y+r*Math.sin(A),x1=x+r*Math.cos(B),y1=y+r*Math.sin(B),d=`M${x0.toFixed(1)},${y0.toFixed(1)} A${r},${r} 0 ${sw>180?1:0},1 ${x1.toFixed(1)},${y1.toFixed(1)}`;
    return `<circle cx="${x+1}" cy="${y+3}" r="${r*.8}" fill="${dk}" opacity=".45"/><path d="${d}" transform="translate(1.5,2.2)" fill="none" stroke="${dk}" stroke-width="3.4" stroke-linecap="round" opacity=".7"/><path d="${d}" fill="none" stroke="${hi}" stroke-width="2" stroke-linecap="round" opacity=".6"/>`};
   return `<defs><linearGradient id="${p}tps" gradientUnits="userSpaceOnUse" x1="0" y1="104" x2="0" y2="188"><stop offset="0" stop-color="${shade(hc,-.2)}"/><stop offset=".45" stop-color="${shade(hc,-.12)}"/><stop offset="1" stop-color="${mix(hc,sk,.62)}"/></linearGradient><linearGradient id="${p}tpt" gradientUnits="userSpaceOnUse" x1="0" y1="0" x2="0" y2="114"><stop offset="0" stop-color="${shade(hc,.06)}"/><stop offset="1" stop-color="${shade(hc,-.22)}"/></linearGradient><clipPath id="${p}tpc"><path d="${m}"/></clipPath></defs>`
    +`<path d="${side}" fill="url(#${p}tps)"/><path d="${side}" transform="translate(400,0) scale(-1,1)" fill="url(#${p}tps)"/>`
    +[[73,114],[72,126],[74,138],[77,150]].map(([x,y])=>`<circle cx="${x}" cy="${y}" r="5" fill="${shade(hc,-.15)}"/><circle cx="${400-x}" cy="${y}" r="5" fill="${shade(hc,-.15)}"/>`).join('')
    
    +`<path d="M96,110 C150,104 250,104 304,110 L302,120 C250,114 150,114 98,120Z" fill="#3a1a10" opacity=".13"/><path d="${m}" fill="url(#${p}tpt)"/>`
    +softLight(p,'tpl',m,[[180,30,92,34,shade(hc,.4),.55],[204,126,130,22,shade(hD,-.45),.55],[86,90,28,50,shade(hD,-.3),.4],[316,90,28,50,shade(hD,-.3),.4]])+OUTL(m,hD,2.2,.55)}
  case 'degrade':{const sk=s.skin,sd=shade(hD,-.15),sl=mix(hD,sk,.45);
   const curl=([x,y],i)=>{const r=11+(i%3)*1.5;const a=`M${x-r},${y+2} A${r},${r} 0 1,1 ${x+r*.6},${y+r*.8}`;return `<path d="${a}" fill="none" stroke="${shade(hD,-.35)}" stroke-width="3.2" stroke-linecap="round" opacity=".55"/><path d="${a}" transform="translate(-1.5,-2)" fill="none" stroke="${hL}" stroke-width="1.6" stroke-linecap="round" opacity=".45"/>`};
   return `<defs><linearGradient id="${p}dgs" gradientUnits="userSpaceOnUse" x1="0" y1="104" x2="0" y2="192"><stop offset="0" stop-color="${sd}"/><stop offset=".6" stop-color="${hD}"/><stop offset="1" stop-color="${sl}"/></linearGradient><linearGradient id="${p}dgt" gradientUnits="userSpaceOnUse" x1="0" y1="10" x2="0" y2="112"><stop offset="0" stop-color="${shade(s.hairColor,.18)}"/><stop offset=".55" stop-color="${s.hairColor}"/><stop offset="1" stop-color="${hD}"/></linearGradient></defs>`
    +`<path d="${DG_SIDE}" fill="url(#${p}dgs)"/><path d="${DG_SIDE}" transform="translate(400,0) scale(-1,1)" fill="url(#${p}dgs)"/>`
    +OUTL('M122,104 C118,130 112,158 104,190',hD,2,.5)+OUTL('M278,104 C282,130 288,158 296,190',hD,2,.5)
    +`<path d="M92,108 C130,114 270,114 308,108 L306,118 C270,124 130,124 94,118Z" fill="#3a1a10" opacity=".14"/><path d="${DG_MASS}" fill="url(#${p}dgt)"/>`+OUTL(DG_MASS,hD,2.6,.6)
    +softLight(p,'dgl',DG_MASS,[[176,40,90,30,shade(s.hairColor,.4),.55],[200,106,130,18,shade(hD,-.45),.55],[96,80,26,40,shade(hD,-.3),.4],[304,80,26,40,shade(hD,-.3),.4]])+st('M96,108 C140,113 260,113 304,108',2.4,shade(hD,-.4),.55)}
  case 'lisseoreilles':{const sk=s.skin;return `<path d="${LO_CAP}" fill="#3a1a10" opacity=".14" transform="translate(0,7)"/><path d="${LO_CAP}" fill="url(#${p}lfg)"/>`+OUTL(LO_CAP,hD,2.2,.5)
    +st('M118,62 C156,40 244,40 284,62',11,mix(s.hairColor,'#c98a5a',.45),.45)+st('M132,74 C164,56 236,56 270,74',4,mix(s.hairColor,'#e0a878',.5),.35)
    +st('M186,28 C150,40 118,76 104,132 C100,152 98,168 98,182',2,hD,.45)+st('M194,28 C230,40 270,70 290,120 C296,140 298,160 300,182',2,hD,.45)
    +st('M178,40 C146,56 126,86 116,124',2.2,hL,.4)+st('M204,40 C236,54 262,82 276,120',2.2,hL,.4)+st('M168,30 C128,46 100,80 90,130',1.8,hD,.35)+st('M214,30 C256,44 292,76 306,124',1.8,hD,.35)
    +st('M190,24 L190,94',2.6,mix(s.hairColor,sk,.55),.85)}
  case 'lisselong':{const dk=shade(s.hairColor,-.55),hi=shade(s.hairColor,.32),sk=s.skin;return `<path d="${LL_CAP}" fill="#3a1a10" opacity=".14" transform="translate(0,7)"/><path d="${LL_CAP}" fill="url(#${p}llg)"/>`+OUTL(LL_CAP,hD,2.2,.5)+st('M196,40 C150,46 112,68 96,104 C88,126 86,148 88,170',2,dk,.45)+st('M204,40 C250,46 288,68 304,104 C312,126 314,148 312,170',2,dk,.45)+st('M190,50 C156,62 132,84 120,112',1.8,dk,.35)+st('M210,50 C244,62 268,84 280,112',1.8,dk,.35)+st('M186,40 C146,46 112,66 94,98',7,hi,.35)+st('M214,40 C254,46 288,66 306,98',7,hi,.35)+st('M176,62 C150,72 132,90 124,108',3,hi,.3)+st('M224,62 C250,72 268,90 276,108',3,hi,.3)+st('M200,34 L200,84',2.6,mix(s.hairColor,sk,.6),.9)}
  case 'longondule':return `<path d="${MIDPART}" fill="#3a1a10" opacity=".15" transform="translate(0,8)"/><path d="${MIDPART}" fill="url(#${p}lfg)"/>`+OUTL(MIDPART,hD,2.4,.5)+st('M120,114 C160,92 240,92 280,114',10,hL,.3)+st('M190,72 C156,86 122,122 100,200',2.2,hD,.45)+st('M210,72 C244,86 278,122 300,200',2.2,hD,.45)+st('M200,98 L200,58',2.4,shade(hD,-.4),.6);
  case 'carreondule':return `<path d="${MIDPART}" fill="#3a1a10" opacity=".15" transform="translate(0,8)"/><path d="${MIDPART}" fill="url(#${p}lfg)"/>`+OUTL(MIDPART,hD,2.4,.5)
   +st('M120,114 C160,92 240,92 280,114',10,hL,.3)
   +st('M190,72 C156,86 122,122 100,200',2.2,hD,.45)+st('M210,72 C244,86 278,122 300,200',2.2,hD,.45)+st('M200,98 L200,58',2.4,shade(hD,-.4),.6)
   +st('M86,200 C80,230 92,250 82,280 C78,292 86,300 92,306',2.2,hD,.45)+st('M314,200 C320,230 308,250 318,280 C322,292 314,300 308,306',2.2,hD,.45)
   +st('M100,214 C96,240 104,262 98,290',1.8,hL,.4)+st('M300,214 C304,240 296,262 302,290',1.8,hL,.4);
  case 'carreplongeant':return `<path d="${SIDEPART}" fill="#3a1a10" opacity=".15" transform="translate(0,8)"/><path d="${SIDEPART}" fill="url(#${p}lfg)"/>`+OUTL(SIDEPART,hD,2.4,.5)
   +st('M120,114 C160,92 240,92 280,114',10,hL,.3)
   +st('M140,98 C190,112 250,140 290,166',2.2,hD,.5)+st('M140,98 C122,120 110,140 102,160',2,hD,.45)+st('M150,70 C200,72 260,96 296,140',2,hD,.35)+st('M160,84 C210,92 256,118 286,152',1.8,hL,.4)
   +st('M86,200 C84,240 84,270 82,296 M314,200 C316,240 316,270 320,296',2.2,hD,.45)+st('M98,220 L96,292 M302,220 L304,292',1.8,hL,.4);
  case 'frange':return `<path d="${BLUNT}" fill="${f}"/>`+st('M140,72 L132,154 M170,64 L166,154 M200,62 L200,154 M230,64 L234,154 M260,72 L268,154',2,hD,.35)+shine;
  case 'couettes':return `<path d="${PIGFRONT}" fill="${f}"/>`+st('M200,98 C168,112 132,132 112,150',2.2,hD,.45)+st('M200,98 C232,112 268,132 288,150',2.2,hD,.45)+st('M200,98 L200,60',2,hD,.5)+shine;
  case 'queuehaute':return `<path d="${SLICK}" fill="${f}"/>`+st('M200,106 C196,86 198,74 202,66',2,hD,.4)+st('M150,112 C150,96 166,80 186,70',2,hD,.35)+st('M250,112 C250,96 234,80 214,70',2,hD,.35)+st('M110,150 C100,200 104,250 114,292',5,hD,.8)+`<ellipse cx="200" cy="62" rx="20" ry="9" fill="#f2a33a"/><path d="M184,60 Q200,54 216,60" stroke="#c97d1e" stroke-width="2" fill="none"/>`+shine;
  case 'demichignon':return `<path d="${SLICK}" fill="${f}"/>`+st('M200,106 C190,86 196,70 210,62',2,hD,.4)+st('M150,112 C140,96 140,82 150,70',2,hD,.35)+st('M250,112 C260,96 260,82 250,70',2,hD,.35)+shine;
  case 'macarons':return `<path d="${PUFFRONT}" fill="${f}"/>`+st('M130,80 C150,70 170,66 200,66 C230,66 252,70 270,80',2.4,hD,.35);
  case 'texture':return fd+`<path d="M100,196 C88,124 126,64 200,60 C276,62 314,122 302,196 C296,170 290,156 284,148 L272,160 L262,138 L246,156 L234,134 L218,152 L204,130 L190,150 L176,130 L162,152 L148,134 L134,156 L122,142 C112,156 104,172 100,196Z" fill="${f}"/>`+st('M150,74 L140,128 M180,66 L172,124 M210,64 L208,122 M240,68 L244,126 M266,80 L274,132',2.2,hD,.45)+st('M164,72 L156,120 M226,66 L226,114',2,hL,.4);
  case 'raie':return fd+`<path d="M100,196 C88,120 128,60 196,58 C268,58 312,104 304,170 C306,182 304,190 302,196 C298,172 292,156 282,144 C252,134 222,132 196,132 C176,132 160,126 150,116 L144,110 C128,124 110,150 100,196Z" fill="${f}"/>`+st('M144,110 C150,90 160,74 178,66',2.6,hL,.6)+st('M160,112 C200,96 250,98 290,130 M170,124 C210,112 256,116 292,146',2.2,hD,.45)+st('M156,96 C196,78 246,80 284,106',2,hL,.35);
  case 'rideau':return fd+`<path d="M100,196 C86,120 126,58 200,56 C276,56 318,112 306,196 C300,178 292,166 282,160 C250,170 196,168 150,150 C130,142 114,140 106,150 C102,166 101,180 100,196Z" fill="${f}"/>`+st('M120,120 C170,128 230,150 290,158 M140,96 C190,104 246,126 296,136 M170,72 C210,80 262,100 300,116',2.2,hD,.45)+st('M130,108 C180,116 236,138 292,148',2,hL,.4);
  case 'banane':return fd+`<path d="${QUIFF}" fill="${f}"/>`+st('M150,70 C190,48 250,44 286,62',3,hL,.45)+st('M136,96 C176,76 236,72 284,88',2.4,hD,.4)+st('M126,120 C170,104 230,102 290,112',2,hD,.35);
  case 'piques':return `<path d="${SPIKY}" fill="${f}"/>`+st('M150,100 L148,60 M200,100 L192,48 M240,100 L236,58',2,hD,.4);
  case 'meche':return fd+`<path d="${MECHE}" fill="${f}"/>`+st('M124,110 C170,112 230,130 284,146',2.4,hD,.45)+st('M150,72 C200,74 256,100 296,140',2,hD,.35)+shine;
  case 'fondu':return fd+`<path d="M100,204 C98,176 100,158 108,146 L124,146 C116,166 114,186 116,210Z M300,204 C302,176 300,158 292,146 L276,146 C284,166 286,186 284,210Z" fill="${hD}" opacity=".45"/><path d="${UNDER}" fill="${f}"/>`+st('M140,120 C180,96 240,90 292,118',2.4,hD,.4)+st('M150,84 C190,70 240,68 280,90',2,hL,.4);
  case 'plaque':return fd+`<path d="${SLICK}" fill="${f}"/>`+st('M140,110 C150,86 170,72 196,66',2.4,hD,.45)+st('M200,106 C204,84 214,72 230,66',2.4,hD,.45)+st('M256,110 C252,90 246,80 236,72',2.4,hD,.45)+shine;
  case 'carre':return `<path d="${BANGS}" fill="${f}"/>`+st('M200,62 C190,90 186,120 190,146',2,hD,.4)+st('M150,70 C142,100 140,124 148,146',2,hD,.4)+st('M250,70 C258,100 260,124 252,146',2,hD,.4)+shine;
  case 'court':return `<path d="${SHORT}" fill="${f}"/>`+st('M160,70 C150,90 140,108 130,128',2,hD,.4)+st('M240,70 C250,90 260,108 270,128',2,hD,.4)+shine;
  case 'queue':case 'chignon':return `<path d="${SLICK}" fill="${f}"/>`+st('M200,106 C180,90 170,74 175,63',2,hD,.4)+st('M150,112 C140,96 140,82 150,70',2,hD,.35)+st('M250,112 C260,96 260,82 250,70',2,hD,.35)+(s.hair==='queue'?`<circle cx="262" cy="94" r="11" fill="#e7837b"/>`:'')+shine;
  case 'boucles':{let r='';for(let t=200;t<=340;t+=20){const q=t*Math.PI/180;r+=`<circle cx="${(200+100*Math.cos(q)).toFixed(1)}" cy="${(172+97*Math.sin(q)).toFixed(1)}" r="27" fill="${f}"/>`}return r}
  case 'rase':return `<path d="${SLICK}" fill="${hD}" opacity=".55"/>`;
  case 'afro':return `<path d="${AFRONT}" fill="${f}"/><path d="${AFRONT}" fill="url(#${p}coil)"/>`+st('M132,146 Q164,136 200,136 Q236,136 268,146',3,hD,.45);
  case 'twa':{let r=`<path d="${TWA}" fill="${f}"/>`;for(let i=0;i<14;i++){const a=Math.PI*(1.05+i*.9/13);r+=`<circle cx="${(200+Math.cos(a)*104).toFixed(1)}" cy="${(150+Math.sin(a)*90).toFixed(1)}" r="11" fill="${f}"/>`}return r+`<path d="${TWA}" fill="url(#${p}coil)"/>`}
  case 'afropuff':return `<path d="${SLICK}" fill="${f}"/>`+st('M140,110 C150,86 170,72 196,66 M200,106 L200,64 M260,110 C250,86 230,72 204,66',2,hD,.5)+`<ellipse cx="200" cy="64" rx="34" ry="8" fill="#1f2127"/>`;
  case 'washgo':return `<path d="${PUFFRONT}" fill="${f}"/>`+[[124,140],[150,128],[178,122],[206,120],[234,124],[260,130],[282,142]].map(([x,y])=>`<circle cx="${x}" cy="${y}" r="15" fill="${f}"/>`+st(`M${x-7},${y+2} q7,-10 14,0`,1.8,hD,.45)).join('')+`<path d="${PUFFRONT}" fill="url(#${p}coil)"/>`;
  case 'bantu':return `<path d="${SLICK}" fill="${mix(s.hairColor,s.skin,.35)}"/>`+st('M200,62 L200,108 M140,70 L170,108 M260,70 L230,108 M110,120 L150,124 M290,120 L250,124',2,mix(s.hairColor,s.skin,.7),.8)+[[146,84],[200,56],[254,84],[110,138],[290,138]].map(([x,y])=>`<circle cx="${x}" cy="${y}" r="24" fill="${f}"/>`+st(`M${x},${y-14} a14,14 0 1,1 -12,8 a8,8 0 1,1 10,-4`,2,hD,.6)).join('');
  case 'boxbraids':case 'vanilles':case 'locks':return `<path d="${BRF}" fill="${f}"/>`+st('M150,74 L146,140 M200,62 L200,124 M250,74 L254,140 M124,104 L276,104 M116,128 L284,128',1.6,mix(s.hairColor,s.skin,.6),.7);
  case 'nattes':{let r=`<path d="${SLICK}" fill="${mix(s.hairColor,s.skin,.4)}"/>`;[120,146,172,200,228,254,280].forEach(x=>{const D=`M${x},${(106+Math.abs(x-200)*.55).toFixed(1)} Q${(200+(x-200)*.85).toFixed(1)},80 ${(200+(x-200)*.45).toFixed(1)},64`;r+=`<path d="${D}" stroke="${s.hairColor}" stroke-width="15" fill="none" stroke-linecap="round"/><path d="${D}" stroke="${hD}" stroke-width="15" fill="none" stroke-dasharray="3 4" opacity=".55"/>`});return r}
  default:return '';
 }}
function earrings(t,ex,dy){
 const xs=[ex-2,400-ex+2];dy=dy||0;
 const o=(()=>{switch(t){
  case 'anneaux':return xs.map(x=>`<circle cx="${x}" cy="242" r="10" fill="none" stroke="#d6a93e" stroke-width="3.5"/>`).join('');
  case 'perles':return xs.map(x=>`<circle cx="${x}" cy="234" r="5.5" fill="#fbf7ef" stroke="#d9cfbd" stroke-width="1"/><circle cx="${x-1.5}" cy="232.5" r="1.6" fill="#fff"/>`).join('');
  case 'etoiles':return xs.map(x=>`<path transform="translate(${x},240)" d="M0,-9 L2.6,-2.8 9,-2.8 3.8,1.2 5.6,7.6 0,3.8 -5.6,7.6 -3.8,1.2 -9,-2.8 -2.6,-2.8Z" fill="#f2c230" stroke="#b9861b" stroke-width="1"/>`).join('');
  default:return '';
 }})();return dy&&o?`<g transform="translate(0,${dy})">${o}</g>`:o}
function glasses(t,dx,cy,sc,ex){
 if(t==='aucune') return '';
 const L=200-dx,R=200+dx,r=36*sc, fr='#2b2320';
 const temples=w=>`<path d="M${L-r},${cy-4} L${ex+6},${cy-10} M${R+r},${cy-4} L${406-ex},${cy-10}" stroke="${t==='dorees'?'#c9a043':fr}" stroke-width="${w}" stroke-linecap="round"/>`;
 const bridge=w=>`<path d="M${L+r*.92},${cy-6} Q200,${cy-18} ${R-r*.92},${cy-6}" fill="none" stroke="${t==='dorees'?'#c9a043':fr}" stroke-width="${w}"/>`;
 switch(t){
  case 'carrees':return temples(4)+[L,R].map(x=>`<rect x="${x-r*1.05}" y="${cy-r*.78}" width="${r*2.1}" height="${r*1.56}" rx="12" fill="#fff" fill-opacity=".08" stroke="${fr}" stroke-width="5"/>`).join('')+bridge(5);
  case 'soleil':return temples(4)+[L,R].map(x=>`<ellipse cx="${x}" cy="${cy}" rx="${r*1.02}" ry="${r*.88}" fill="#1b1f2e" fill-opacity=".9" stroke="${fr}" stroke-width="4"/><path d="M${x-r*.5},${cy-r*.35} L${x-r*.1},${cy-r*.6}" stroke="#fff" stroke-width="4" stroke-linecap="round" opacity=".5"/>`).join('')+bridge(5);
  case 'dorees':return temples(2.5)+[L,R].map(x=>`<circle cx="${x}" cy="${cy}" r="${r*.95}" fill="#fff" fill-opacity=".06" stroke="#c9a043" stroke-width="2.6"/>`).join('')+bridge(2.6);
  case 'coeur':return temples(4)+[L,R].map(x=>`<path transform="translate(${x},${cy-4}) scale(${1.55*sc})" d="M0,16 C-32,-4 -26,-30 0,-15 C26,-30 32,-4 0,16Z" fill="#ff5f8f" fill-opacity=".45" stroke="#d43a6c" stroke-width="2.6"/>`).join('')+bridge(4);
  default:return temples(4)+[L,R].map(x=>`<circle cx="${x}" cy="${cy}" r="${r}" fill="#fff" fill-opacity=".08" stroke="${fr}" stroke-width="5"/>`).join('')+bridge(5);
 }}

/* ---------- données de l'interface ---------- */
const L={joufflu:'Joufflu',ovale:'Ovale',rond:'Rond',carre:'Carré',coeur:'Cœur',anguleux:'Anguleux',allonge:'Allongé',nets:'Nets',
 bouton:'Bouton',rond:'Rond doux',naturel:'Naturel',doux:'Doux',petit:'Petit',pointu:'Fin',aucun:'Aucun',
 fine:'Fine',moyenne:'Moyenne',pleine:'Pleine',coeur:'En cœur',rectangle:'Rectangulaire',ronde:'Ronde',pulpeuse:'Légèrement pulpeuse',trespulpeuse:'Très pulpeuse',asymetrique:'Asymétrique',superfine:'Avec une lèvre supérieure fine',inferieure:'Avec une lèvre inférieure plus pleine',tombante:'Aux commissures tombantes',remontante:'Aux commissures remontantes',entrouverte:'Bouche légèrement ouverte',fermee:'Bouche fermée',glossy:'Style glossy',mat:'Style mat',ombre:'Style ombré',glosscentre:'Avec gloss au centre',naturelle:'Naturelle',
 fines:'Fines',marquees:'Marquées',duvet:'Duvet',barbe3j:'Barbe de 3 jours',moustache:'Moustache',bouc:'Bouc',collier:'Collier',courte:'Barbe courte',aucune:'Aucune',rose:'Rosées',fort:'Très rosées',legeres:'Quelques-unes',beaucoup:'Beaucoup',
 grands:'Grands',brillants:'Brillants',amande:'Amandes',ronds:'Ronds',endormis:'Endormis',chat:'Félins',rieurs:'Rieurs',
 amandelong:'En amande allongés',enfonces:'Enfoncés',sortants:'Sortants',petits:'Petits',tombantes:'Paupières tombantes',monolides:'Paupières monolides',releves:'Aux coins relevés',espaces:'Espacés',recourbes:'Recourbés',
 naturels:'Naturels',legers:'Légèrement arqués',arques:'Plus arqués',droits:'Droits',epais:'Épais',fins:'Fins',moyens:'Moyens',fournis:'Épais et fournis',angle:'Avec un léger angle',clean:'Style clean',
 tresse:'Tresse',longs:'Longs',queue:'Queue de cheval',chignon:'Chignon',boucles:'Bouclés',court:'Courts',rase:'Rasés',
 salopette:'Salopette',tshirt:'T-shirt',capuche:'Sweat',chemise:'Chemise',colroule:'Col roulé',
 rondes:'Rondes',carrees:'Carrées',soleil:'Soleil',dorees:'Dorées',
 anneaux:'Anneaux',perles:'Perles',etoiles:'Étoiles',
 crop:'Crop top',gilet:'Pull sans manches',epaules:'Épaules dénudées',blouse:'Blouse',veste:'Veste courte',cardigan:'Gilet long',
 droit:'Jean droit',large:'Large',flare:'Évasé',jogging:'Jogging',yoga:'Legging évasé',short:'Short',jupe:'Jupe plissée',
 texture:'Texturés',raie:'Raie sur le côté',rideau:'Mèche longue',henley:'Henley',asym:'Asymétrique',cordon:'Large à cordon',sabots:'Sabots',
 montantes:'Montantes',running:'Running',basses:'Basses',retro:'Rétro',bottes:'Bottes',fourrees:'Fourrées',sandales:'Sandales',
 longsondules:'Longs ondulés',ondulescote:'Ondulés de côté',frange:'Frange',carreondule:'Carré ondulé',carreplongeant:'Carré plongeant',carreretrousse:'Carré retroussé',queuehaute:'Queue haute',couettes:'Couettes',demichignon:'Demi-chignon',macarons:'Macarons bouclés',boucleslongues:'Boucles longues',fondu:'Dégradé américain',banane:'Banane',piques:'En pics',meche:'Mèche de côté',plaque:'Plaqués',
 baby:'Avec baby hairs',
 uni:'Uni',degrade:'Dégradé',pois:'Pois',rayures:'Rayures',rayons:'Rayons'};
const HAIR_F=['tresse','longs','longsondules','ondulescote','frange','carre','carreondule','carreplongeant','carreretrousse','queue','queuehaute','couettes','chignon','demichignon','macarons','boucles','boucleslongues'];
const HAIR_M=['court','texture','banane','piques','meche','fondu','plaque','raie','rideau','rase'];
const REFS={C3:'ta planche « chignon haut »',L3:'ta planche « cheveux lâchés (longs) »',L2:'ta planche « cheveux lâchés (longs) »',R3:'ta planche « raie sur le côté »',F3:'ta planche « dégradé haut »',W2:'ta planche « cheveux lâchés (ondulés) »',T2:'ta planche « bouclé effilé » (face, profil, dos)',G2:'ta planche « dégradé bouclé » (face, profil, dos)',D:'ton dessin sur l’avatar chauve',I:'ta capture du jeu (coiffure d’Inès)',R:'ta référence « mi-longs raie au milieu »',L:'ta référence « cheveux longs à frange »',B:'ta référence « cheveux bouclés »',G:'ta 1re image (personnage à la tresse)',F:'ta planche de coiffures femmes',M:'ta planche de coiffures hommes',T:'ta capture de tenues',P:'ta capture de pantalons',S:'ta capture de chaussures'};
const VECT="Rendu vectoriel stylisé : la texture photographique et l'éclairage réel ne sont pas reproduits.";
const NOREF="Aucune image de référence fournie : proposition à valider ou à remplacer par ta propre référence.";
const CAT_H=[['all','Toutes'],['court','Courts'],['mi','Mi-longs'],['long','Longs'],['lisse','Lisses'],['ondule','Ondulés'],['boucle','Bouclés'],['crepu','Crépus'],['tresse','Tresses'],['chignon','Chignons'],['queue','Queues de cheval'],['attache','Attachées']];
const HAIRDB={
 couettes:{n:'Couettes basses',c:'mi lisse queue attache',r:'F',x:"Raie au milieu, couettes au niveau des oreilles et pointes recourbées respectées ; mèches fines simplifiées."},
 meches:{n:'Mèches lâchées ondulées',c:'court ondule',r:'W2',x:"Volume ébouriffé, grande mèche ondulée qui tombe sur le front, pointes recourbées sur les tempes et au-dessus des oreilles, d'après ta planche (vue de face)."},
 raiecote:{n:'Raie sur le côté',c:'court lisse',r:'R3',x:"Raie marquée à droite, cheveux plaqués et coiffés vers la gauche, ligne frontale arrondie, côtés en dégradé jusqu'au haut des oreilles, d'après ta planche (vue de face)."},
 chignonhaut:{n:'Chignon haut lisse',c:'chignon attache lisse',r:'C3',x:"Cheveux plaqués vers l'arrière, raie au milieu, petits cheveux (edges) dessinés aux tempes, oreilles dégagées et chignon enroulé sur le dessus, d'après ta planche (vue de face)."},
 fadehaut:{n:'Dégradé haut',c:'court lisse',r:'F3',x:"Dessus texturé coiffé vers le haut et vers l'arrière, ligne frontale nette, côtés en dégradé haut qui passent du foncé à la peau avant les oreilles, d'après ta planche (vue de face)."},
 taper:{n:'Bouclé effilé',c:'court boucle',r:'T2',x:"Grosse masse de petites boucles serrées qui débordent un peu sur le front, côtés courts qui s'éclaircissent jusqu'aux oreilles, d'après ta planche (vue de face)."},
 degrade:{n:'Dégradé bouclé',c:'court boucle',r:'G2',x:"Masse de boucles sur le dessus, ligne frontale nette et droite, côtés courts en couleur pleine jusqu'au haut des oreilles, d'après ta planche."},
 lisseoreilles:{n:'Longs lisses derrière les oreilles',c:'long lisse',r:'L2',x:"Raie au milieu marquée, cheveux lisses et brillants qui passent derrière les oreilles puis tombent tout droit devant les épaules jusqu'à la poitrine, d'après ta planche (vue de face)."},
 lisselong:{n:'Longs lâchés, raie au milieu',c:'long lisse',r:'L3',x:"Raie au milieu bien visible, dessus plaqué près de la tête, front dégagé en arc, oreilles visibles devant les cheveux, longueurs lisses qui retombent devant les épaules, d'après ta planche (vue de face)."},
 longondule:{n:'Longs lisses (dessin simple)',c:'long lisse',r:null,x:"Version longue du carré ondulé, sans ondulations : même raie et mêmes ombres, longueurs lisses jusqu'à la poitrine."},
 carreondule:{n:'Carré ondulé',c:'mi ondule boucle',r:'F',x:"Volume, raie et longueur respectés ; contour ondulé plus régulier que les mèches de la référence."},
 demichignon:{n:'Demi-chignon haut, longueurs lisses',c:'long lisse chignon attache',r:'F',x:"Chignon sur le dessus et longueurs lisses respectés."},
 queuehaute:{n:'Queue haute avec chouchou',c:'long ondule queue attache',r:'F',x:"Chouchou orange, queue ondulée sur l'épaule et mèche du visage reprises ; la queue est un peu plus courte."},
 carreplongeant:{n:'Carré lisse, mèche balayée',c:'mi lisse',r:'F',x:"Pointes nettes et mèche de côté respectées ; effilage des pointes simplifié."},
 bafro:{n:"Afro naturel",c:'mi crepu',r:'I',x:"Reprise de ta planche des coiffures bouclées et crépues : vrais pixels du dessin."},
 bbantu:{n:"Bantu knots",c:'court crepu attache chignon',r:'I',x:"Reprise de ta planche des coiffures bouclées et crépues : vrais pixels du dessin."},
 bcarre:{n:"Carré bouclé",c:'mi boucle',r:'I',x:"Reprise de ta planche des coiffures bouclées et crépues : vrais pixels du dessin."},
 bchignon:{n:"Chignon haut crépu",c:'chignon attache crepu',r:'I',x:"Reprise de ta planche des coiffures bouclées et crépues : vrais pixels du dessin."},
 bpuffs:{n:"Deux puffs",c:'crepu attache chignon',r:'I',x:"Reprise de ta planche des coiffures bouclées et crépues : vrais pixels du dessin."},
 bbox:{n:"Tresses box braids (avec boucles)",c:'long tresse crepu',r:'I',x:"Reprise de ta planche des coiffures bouclées et crépues : vrais pixels du dessin."},
 bcollees:{n:"Tresses collées",c:'long tresse attache crepu',r:'I',x:"Reprise de ta planche des coiffures bouclées et crépues : vrais pixels du dessin."},
 bdemiqueue:{n:"Demi-queue bouclée",c:'long boucle queue attache',r:'I',x:"Reprise de ta planche des coiffures bouclées et crépues : vrais pixels du dessin."},
 bqueue:{n:"Queue de cheval bouclée",c:'long boucle queue attache',r:'I',x:"Reprise de ta planche des coiffures bouclées et crépues : vrais pixels du dessin."},
 blongs:{n:"Cheveux longs bouclés",c:'long boucle',r:'I',x:"Reprise de ta planche des coiffures bouclées et crépues : vrais pixels du dessin."},
 bchignonhaut:{n:"Chignon haut bouclé",c:'chignon attache boucle',r:'I',x:"Reprise de ta planche des coiffures bouclées et crépues : vrais pixels du dessin."},
 bchignonbas:{n:"Chignon bas bouclé",c:'chignon attache boucle',r:'I',x:"Reprise de ta planche des coiffures bouclées et crépues : vrais pixels du dessin."},
 btwists:{n:"Twists",c:'long tresse crepu',r:'I',x:"Reprise de ta planche des coiffures bouclées et crépues : vrais pixels du dessin."},
 bchignonmeches:{n:"Chignon avec bouclés",c:'chignon attache boucle',r:'I',x:"Reprise de ta planche des coiffures bouclées et crépues : vrais pixels du dessin."},
 bwashgo:{n:"Wash and go",c:'mi boucle crepu',r:'I',x:"Reprise de ta planche des coiffures bouclées et crépues : vrais pixels du dessin."},
 bfoulard:{n:"Avec foulard",c:'court crepu attache',r:'I',x:"Reprise de ta planche des coiffures bouclées et crépues : vrais pixels du dessin."},
 btressesboucles:{n:"Tresses + boucles",c:'long tresse boucle',r:'I',x:"Reprise de ta planche des coiffures bouclées et crépues : vrais pixels du dessin."},
 bcourt:{n:"Court crépu",c:'court crepu',r:'I',x:"Reprise de ta planche des coiffures bouclées et crépues : vrais pixels du dessin."},
 bqueuehaute:{n:"Queue de cheval haute bouclée",c:'long boucle queue attache',r:'I',x:"Reprise de ta planche des coiffures bouclées et crépues : vrais pixels du dessin."},
 btressesarriere:{n:"Tresses en arrière",c:'mi tresse attache crepu',r:'I',x:"Reprise de ta planche des coiffures bouclées et crépues : vrais pixels du dessin."},
 longs:{n:'Cheveux longs lisses',c:'long lisse',r:'I',x:"Reprise de ton dessin : vrais pixels, raie au milieu, cheveux de l'arrière derrière les épaules."},
 carrelisse:{n:"Carré lisse",c:'mi lisse',r:'I',x:"Reprise de ta planche : vrais pixels du dessin."},
 queuehaute2:{n:"Queue de cheval haute",c:'long lisse queue attache',r:'I',x:"Reprise de ta planche : vrais pixels du dessin."},
 mechesdevant:{n:"Mèches devant",c:'long lisse',r:'I',x:"Reprise de ta planche : vrais pixels du dessin."},
 frangedroite:{n:"Frange droite",c:'long lisse frange',r:'I',x:"Reprise de ta planche : vrais pixels du dessin."},
 chignonhaut2:{n:"Chignon haut",c:'chignon attache lisse',r:'I',x:"Reprise de ta planche : vrais pixels du dessin."},
 raiecotel:{n:"Raie sur le côté",c:'long lisse',r:'I',x:"Reprise de ta planche : vrais pixels du dessin."},
 deuxtresses:{n:"Deux tresses",c:'long tresse attache',r:'I',x:"Reprise de ta planche : vrais pixels du dessin."},
 serretete:{n:"Avec serre-tête",c:'mi lisse',r:'I',x:"Reprise de ta planche : vrais pixels du dessin."},
 barrette:{n:"Avec barrette",c:'mi lisse',r:'I',x:"Reprise de ta planche : vrais pixels du dessin."},
 raiemilieu:{n:"Raie au milieu avec mèches",c:'long lisse',r:'I',x:"Reprise de ta planche : vrais pixels du dessin."},
 queuelisse:{n:"Queue de cheval haute lisse",c:'long lisse queue attache',r:'I',x:"Reprise de ta planche : vrais pixels du dessin."},
 ondulescote:{n:'Longs ondulés ramenés sur le côté',c:'long ondule',r:'F',x:"Grande mèche ondulée sur l'épaule respectée ; boucle finale plus simple."},
 longsondules:{n:'Longs ondulés',c:'long ondule',r:'F',x:"Ondulations régulières, un peu moins marquées que la référence."},
 longboucle:{n:'Longs bouclés volumineux',c:'long boucle',r:'D',x:"Gros volume, ligne des cheveux ondulée, boucles qui descendent jusqu'à la poitrine et retombent devant les épaules près du cou, d'après ton dessin."},
 ananas:{n:'Chignon bouclé haut',c:'chignon attache boucle court',r:'D',x:"Cheveux tirés en arrière, front dégagé, tempes et oreilles libres et pompon de boucles bien rond sur le dessus (le cadre s'agrandit pour l'afficher en entier), d'après ton dessin."},
 miboucle:{n:'Mi-longs bouclés',c:'mi boucle',r:'D',x:"Dessus près de la tête avec front dégagé, boucles regroupées sous les oreilles jusqu'aux épaules, d'après ton dessin."},
 lobraie:{n:'Mi-longs lisses, raie au milieu',c:'mi lisse',r:'R',x:"Raie au milieu, front dégagé, mèches qui encadrent et couvrent le bord du visage, longueur sur les épaules et pointes coupées droites respectées ; reflets du dessus simplifiés en deux bandes claires."},
 longfrange:{n:'Longs lisses, frange effilée',c:'long lisse frange',r:'L',x:"Frange effilée en pointes, mèches qui encadrent le visage, longueurs devant les épaules jusqu'à la poitrine et ombres (sous la frange, intérieur des longueurs, côté droit plus foncé) respectées ; mèches moins nombreuses que sur ta référence."},
 frange:{n:'Longs lisses à frange droite',c:'long lisse',r:'F',x:"Frange droite et longueur asymétrique respectées."},
 carreretrousse:{n:'Carré retroussé, raie de côté',c:'mi lisse',r:'F',x:"Pointes retournées et raie de côté respectées."},
 macarons:{n:'Macarons bouclés et frange',c:'mi boucle crepu attache',r:'F',x:"Deux volumes bouclés et frange respectés ; boucles dessinées plus régulières."},
 boucleslongues:{n:'Longs bouclés',c:'long boucle ondule',r:'F',x:"Volume et longueur respectés ; définition des boucles simplifiée."},
 tresse:{n:"Tresse épaisse sur l'épaule",c:'long lisse tresse attache',r:'G',x:"Tresse ramenée devant l'épaule et raie au milieu respectées ; mèches fines du visage non reproduites."},
 banane:{n:'Pompadour (banane)',c:'court lisse',r:'M',x:"Vague sur le devant et côtés plus courts respectés."},
 texture:{n:"Frange texturée vers l'avant",c:'court lisse',r:'M',x:"Mèches piquées vers l'avant respectées ; nombre de mèches réduit."},
 piques:{n:'Courts en pics',c:'court',r:'M',x:"Pointes dressées respectées ; dessin plus régulier."},
 meche:{n:'Mèche balayée, côtés dégradés',c:'court lisse',r:'M',x:"Mèche de côté et côtés gris dégradés respectés."},
 fondu:{n:'Dessus texturé, contour dégradé',c:'court',r:'M',x:"Contour dégradé repris ; texture du dessus simplifiée."},
 plaque:{n:'Plaqués en arrière, côtés dégradés',c:'court lisse',r:'M',x:"Coiffé en arrière avec côtés dégradés respectés."},
 raie:{n:'Raie sur le côté',c:'court lisse',r:'M',x:"Raie marquée et coiffé sur le côté respectés."},
 rideau:{n:'Mèche longue balayée',c:'court lisse',r:'M',x:"Longue mèche balayée sur le front respectée."},
 queue:{n:'Queue de cheval sur le côté',c:'long lisse queue attache',r:null},
 chignon:{n:'Chignon haut',c:'chignon attache',r:null},
 carre:{n:'Carré à frange',c:'mi lisse',r:null},
 boucles:{n:'Bouclés volumineux',c:'mi boucle',r:null},
 afro:{n:'Afro naturel',c:'mi crepu',r:null},
 twa:{n:'Crépus courts (TWA)',c:'court crepu',r:null},
 afropuff:{n:'Puff haut',c:'crepu attache chignon',r:null},
 washgo:{n:'Boucles définies mi-longues',c:'mi boucle crepu',r:null},
 bantu:{n:'Bantu knots',c:'court crepu attache chignon',r:null},
 boxbraids:{n:'Box braids longues',c:'long tresse crepu',r:null},
 vanilles:{n:'Vanilles',c:'mi tresse crepu',r:null},
 locks:{n:'Locks',c:'long crepu',r:null},
 nattes:{n:'Nattes collées',c:'court tresse attache crepu',r:null},
 court:{n:'Courts classiques',c:'court lisse',r:null},
 rase:{n:'Rasés',c:'court',r:null}};
const HAIR_ALL=['carrelisse','queuehaute2','mechesdevant','frangedroite','chignonhaut2','raiecotel','deuxtresses','serretete','barrette','raiemilieu','queuelisse','bafro','bcarre','bchignon','bbox','bcollees','bdemiqueue','bqueue','blongs','bchignonhaut','btwists','bchignonmeches','bwashgo','btressesboucles','bcourt','bqueuehaute'];
const COLSLOT={top:'topColor',bottom:'bottomColor',dress:'dressColor',jacket:'jacketColor',shoes:'shoesColor',hat:'hatColor',bag:'bagColor'};
const PALS={topColor:CLOTH,bottomColor:BOTC,dressColor:CLOTH,jacketColor:CLOTH.concat(['#5b7fb5','#2f4a78']),shoesColor:SHOEC,hatColor:CLOTH,bagColor:['#7a5236','#1f2127','#ece2cc','#c49a6c','#d93b5e','#26314f']};
const SHOE_NOTE="le design et le logo de la marque ne sont pas reproduits.";
const WEAR={
 top:{l:'Hauts',vb:'96 150 208 340',items:[
  {s:'top',v:'crop',c:'#1f2127',n:'Crop top côtelé noir, manches longues',r:'T',x:"Côtes, longueur courte et col rond respectés ; plis du tissu simplifiés."},
  {s:'top',v:'ajuste',c:'#7a5236',n:'Haut ajusté marron, manches longues',r:'T',x:"Coupe près du corps et teinte respectées ; maille fine simplifiée."},
  {s:'top',v:'gilet',g:'m',c:'#ece2cc',n:'Pull sans manches torsadé crème',r:'T',x:"Torsades, bordure noire en V et manches longues noires dessous respectées ; finesse des torsades simplifiée."},
  {s:'top',v:'epaules',c:'#f2c6d3',n:'Haut rose épaules dénudées',r:'T',x:"Encolure basse sur les épaules, manches longues et bande claire en bas respectées."},
  {s:'top',v:'henley',g:'m',c:'#7a5236',n:'Henley court marron boutonné',r:'T',x:"Patte boutonnée et longueur courte respectées."},
  {s:'top',v:'tshirt',g:'m',c:'#f4f1ea',n:'T-shirt blanc',r:null},{s:'top',v:'chemise',g:'m',c:'#f4f1ea',n:'Chemise blanche',r:null},
  {s:'top',v:'colroule',g:'m',c:'#1f2127',n:'Col roulé noir',r:null},{s:'top',v:'capuche',g:'m',c:'#a9adb3',n:'Sweat à capuche gris',r:null}]},
 bottom:{l:'Bas',vb:'106 390 188 490',items:[
  {s:'bottom',v:'large',c:'#9aa0a6',n:'Baggy gris délavé',r:'T',x:"Coupe large et délavage respectés ; usure du denim simplifiée."},
  {s:'bottom',v:'large',c:'#5b7fb5',n:'Jean large bleu',r:'T'},
  {s:'bottom',v:'flare',c:'#86a6cc',n:'Jean évasé délavé clair',r:'P',x:"Coupe évasée et délavage clair respectés ; surpiqûres simplifiées."},
  {s:'bottom',v:'jogging',c:'#c4c7cb',n:'Jogging gris chiné ample',r:'P',x:"Cordon blanc, chevilles resserrées et aspect chiné respectés."},
  {s:'bottom',v:'large',c:'#2f4a78',n:'Jean large brut',r:'P',x:"Coupe et teinte respectées ; l'étiquette de marque n'est pas reproduite."},
  {s:'bottom',v:'flare',c:'#2f4a78',n:'Jean évasé brut',r:'P'},
  {s:'bottom',v:'cordon',c:'#f4f1ea',n:'Pantalon large blanc à cordon',r:'P'},
  {s:'bottom',v:'yoga',c:'#c4c7cb',n:'Legging évasé gris à revers',r:'P',x:"Ceinture repliée plus claire et évasement respectés."},
  {s:'bottom',v:'yoga',c:'#f2c6d3',n:'Pantalon évasé rose',r:'T'},
  {s:'bottom',v:'short',c:'#1f2127',n:'Short noir',r:'T'},
  {s:'bottom',v:'droit',c:'#86a6cc',n:'Jean droit clair',r:'T'},
  {s:'bottom',v:'cordon',c:'#ece2cc',n:'Pantalon large crème',r:'T'},
  {s:'bottom',v:'jupe',c:'#1f2127',n:'Jupe plissée noire',r:null}]},
 dress:{l:'Robes',vb:'86 150 228 660',items:[
  {s:'dress',v:'aucune',n:'Sans robe (haut + bas)'},
  {s:'dress',v:'nuisette',c:'#7a5236',n:'Robe nuisette satinée',r:null},{s:'dress',v:'tshirtdress',c:'#a9adb3',n:'Robe t-shirt',r:null},
  {s:'dress',v:'portefeuille',c:'#d93b5e',n:'Robe portefeuille',r:null},{s:'dress',v:'bretelles',c:'#3d6fd8',n:"Robe d'été fleurie à bretelles",r:null},
  {s:'dress',v:'madras',c:'#f2c230',n:'Robe longue en madras',r:null},{s:'dress',v:'pull',c:'#ece2cc',n:'Robe pull col roulé',r:null}]},
 set:{l:'Ensembles',vb:FVB,items:[
  {n:'Crop noir et baggy gris',r:'T',x:"Pièces de ta capture ; baskets au plus proche, sans bandes ni logo de marque.",set:{top:'crop',topColor:'#1f2127',bottom:'large',bottomColor:'#9aa0a6',shoes:'retro',shoesColor:'#f4f1ea'}},
  {n:'Pull sans manches et jean large',r:'T',x:"Pièces de ta capture ; baskets au plus proche, sans bandes ni logo de marque.",set:{top:'gilet',topColor:'#ece2cc',bottom:'large',bottomColor:'#5b7fb5',shoes:'retro',shoesColor:'#1f2127'}},
  {n:'Haut marron et baggy gris',r:'T',x:"Pièces de ta capture ; sabots marron au plus proche.",set:{top:'ajuste',topColor:'#7a5236',bottom:'large',bottomColor:'#9aa0a6',shoes:'sabots',shoesColor:'#7a5236'}},
  {n:'Ensemble rose épaules dénudées',r:'T',x:"Haut, pantalon évasé et chaussons fourrés de ta capture.",set:{top:'epaules',topColor:'#f2c6d3',bottom:'yoga',bottomColor:'#f2c6d3',shoes:'fourrees',shoesColor:'#c49a6c'}},
  {n:'Blouse marine et jean gris',r:'T',x:"Pièces de ta capture ; les bottines marron sont rendues en sabots.",set:{top:'blouse',topColor:'#26314f',bottom:'large',bottomColor:'#9aa0a6',shoes:'sabots',shoesColor:'#7a5236'}},
  {n:'Blouson kaki, short et bottes',r:'T',x:"Blouson matelassé, short noir et bottes hautes de ta capture ; haut noir ajouté dessous.",set:{top:'crop',topColor:'#1f2127',jacket:'matelassee',jacketColor:'#5b5a3c',bottom:'short',bottomColor:'#1f2127',shoes:'bottes',shoesColor:'#1f2127'}},
  {n:'Henley marron et jean clair',r:'T',x:"Chaussures non visibles sur ta capture : choisies au plus proche.",set:{top:'henley',topColor:'#7a5236',bottom:'droit',bottomColor:'#86a6cc',shoes:'basses',shoesColor:'#f4f1ea'}},
  {n:'Crop asymétrique et jean',r:'T',x:"Chaussures non visibles sur ta capture : choisies au plus proche.",set:{top:'asym',topColor:'#1f2127',bottom:'droit',bottomColor:'#86a6cc',shoes:'basses',shoesColor:'#f4f1ea'}},
  {n:'Gilet long crème',r:'T',x:"Gilet et pantalon crème de ta capture ; t-shirt blanc dessous et chaussures choisis au plus proche.",set:{top:'tshirt',topColor:'#f4f1ea',jacket:'cardigan',jacketColor:'#ece2cc',bottom:'cordon',bottomColor:'#ece2cc',shoes:'basses',shoesColor:'#f4f1ea'}}]},
 jacket:{l:'Vestes',vb:'86 150 228 360',items:[
  {s:'jacket',v:'aucune',n:'Sans veste'},
  {s:'jacket',v:'matelassee',c:'#5b5a3c',n:'Blouson matelassé kaki court',r:'T',x:"Matelassage, col montant, longueur courte et teinte kaki respectés."},
  {s:'jacket',v:'cardigan',c:'#ece2cc',n:'Gilet long crème boutonné',r:'T',x:"Longueur, boutons et maille côtelée respectés ; porté ouvert."},
  {s:'jacket',v:'jean',c:'#5b7fb5',n:'Veste en jean',r:null},{s:'jacket',v:'blazer',c:'#1f2127',n:'Blazer noir',r:null},{s:'jacket',v:'bomber',c:'#26314f',n:'Bomber marine',r:null}]},
 shoes:{l:'Chaussures',vb:'138 736 124 100',items:[
  {s:'shoes',v:'running',c:'#f4f1ea',n:'Baskets épaisses blanches',r:'S',x:"Semelle épaisse et blanc respectés ; "+SHOE_NOTE},
  {s:'shoes',v:'basses',c:'#f4f1ea',n:'Baskets basses en toile blanche',r:'S',x:"Lacets foncés et semelle blanche respectés ; "+SHOE_NOTE},
  {s:'shoes',v:'running',c:'#b8b6b0',n:'Running grise',r:'S',x:"Volume et gris respectés ; "+SHOE_NOTE},
  {s:'shoes',v:'running',c:'#1f2127',n:'Running noire',r:'S',x:"Teinte et forme générale respectées ; "+SHOE_NOTE},
  {s:'shoes',v:'retro',c:'#6b2a2e',n:'Baskets rétro daim bordeaux',r:'S',x:"Daim bordeaux et semelle respectés ; les bandes de la marque sont remplacées par un empiècement uni."},
  {s:'shoes',v:'retro',c:'#e9dfc8',n:'Baskets rétro crème, semelle gomme',r:'S',x:"Crème et semelle gomme respectés ; les bandes de la marque sont remplacées par un empiècement uni."},
  {s:'shoes',v:'sabots',c:'#c49a6c',n:'Sabots en daim camel',r:'T'},{s:'shoes',v:'fourrees',c:'#c49a6c',n:'Chaussons fourrés',r:'T'},
  {s:'shoes',v:'bottes',c:'#1f2127',n:'Bottes hautes noires',r:'T'},
  {s:'shoes',v:'montantes',c:'#1f2127',n:'Baskets montantes noires',r:null},{s:'shoes',v:'sandales',c:'#7a5236',n:'Sandales à brides',r:null}]},
 acc:{l:'Accessoires',vb:hv('40 0 320 300'),items:[
  {s:'hat',v:'aucun',n:'Sans chapeau'},{s:'hat',v:'casquette',c:'#1f2127',n:'Casquette',r:null},{s:'hat',v:'bob',c:'#ece2cc',n:'Bob',r:null},
  {s:'hat',v:'bonnet',c:'#26314f',n:'Bonnet côtelé',r:null},{s:'hat',v:'foulard',c:'#f2c230',n:'Foulard en madras',r:null},
  {s:'bag',v:'aucun',n:'Sans sac',vb:'90 190 220 280'},{s:'bag',v:'bandouliere',c:'#7a5236',n:'Sac bandoulière',r:null,vb:'90 190 220 280'},
  {s:'bag',v:'tote',c:'#ece2cc',n:'Tote bag',r:null,vb:'90 190 220 280'},{s:'bag',v:'banane',c:'#1f2127',n:'Sac banane',r:null,vb:'90 190 220 280'},
  {s:'necklace',v:'aucun',n:'Sans collier',vb:'150 176 100 100'},{s:'necklace',v:'chaine',n:'Chaîne dorée',r:null,vb:'150 176 100 100'},
  {s:'necklace',v:'perles',n:'Collier de perles',r:null,vb:'150 176 100 100'},{s:'necklace',v:'rasdecou',n:'Ras-de-cou',r:null,vb:'150 176 100 100'},
  {s:'glasses',v:'aucune',n:'Sans lunettes',vb:hv('80 140 240 130')},{s:'glasses',v:'rondes',n:'Lunettes rondes',r:null,vb:hv('80 140 240 130')},{s:'glasses',v:'carrees',n:'Lunettes carrées',r:null,vb:hv('80 140 240 130')},
  {s:'glasses',v:'soleil',n:'Lunettes de soleil',r:null,vb:hv('80 140 240 130')},{s:'glasses',v:'dorees',n:'Monture dorée',r:null,vb:hv('80 140 240 130')},{s:'glasses',v:'coeur',n:'Lunettes cœur',r:null,vb:hv('80 140 240 130')},
  {s:'earrings',v:'aucune',n:"Sans boucles d'oreilles",vb:hv('55 175 110 100')},{s:'earrings',v:'anneaux',n:'Créoles dorées',r:null,vb:hv('55 175 110 100')},
  {s:'earrings',v:'perles',n:"Puces perle",r:null,vb:hv('55 175 110 100')},{s:'earrings',v:'etoiles',n:'Étoiles',r:null,vb:hv('55 175 110 100')}]}
};
/* ---------- catalogue filles / catalogue garçons ----------
   g:'f' = filles, g:'m' = garçons, sans g = dans les deux ; non-binaire = tout le catalogue */
REFS.K='tes captures des personnages';REFS.V='ta planche « Hauts et robes »';
WEAR.top.items.push({s:'top',v:'capuche',c:'#3d6fd8',n:'Sweat à capuche bleu',r:null,g:'m'},{s:'top',v:'tshirt',c:'#ece2cc',n:'T-shirt crème',r:null,g:'m'},{s:'top',v:'chemise',c:'#26314f',n:'Chemise marine',r:null,g:'m'});
WEAR.top.items.unshift({s:'top',v:'debardeur',c:'#f4f1ea',n:'Débardeur à fines bretelles',r:null,g:'f',nw:1});
/* hauts de la planche déjà publiés ; les autres sont dessinés (TOP2) mais pas encore dans le catalogue, en attente de son accord */
const TOPS_PUB=['tbasic','tajuste','epaules2','camicote','bustier','chemcrop','mlrose','cardicrop','capuche2','polo','mlnoir','tcrop','halter','tanksport','blousecrop'];
/* planche « Hauts et robes » de Prescillia (docs/references/vetements/planche-hauts-robes.png) — aperçu : 2 hauts, 2 robes */
WEAR.top.items.unshift(...[['tbasic','#f4f1ea','T-shirt basique'],['tajuste','#1f2127','T-shirt ajusté'],['epaules2','#a9adb3','Haut épaules dénudées'],['camicote','#f4f1ea','Débardeur côtelé'],['bustier','#1f2127','Bustier'],
 ['chemcrop','#a8bce6','Chemise courte'],['mlrose','#f2c6d3','Haut manches longues rose'],['cardicrop','#ece2cc','Cardigan court'],['capuche2','#24382a','Sweat à capuche vert'],['polo','#f4f1ea','Polo'],
 ['mlnoir','#1f2127','Haut manches longues noir'],['tcrop','#f2c6d3','T-shirt crop'],['halter','#1f2127','Haut dos nu'],['tanksport','#f4f1ea','Débardeur sport'],['blousecrop','#9aa8e0','Blouse']]
 .filter(([v])=>TOPS_PUB.includes(v)).map(([v,c,n])=>({s:'top',v,c,n,r:'V',g:'f',nw:1})));
WEAR.dress.items.splice(1,0,...[['moulante','#1f2127','Robe moulante'],['fleurie','#86a6e0','Robe fleurie'],['maille','#c8b08a','Robe en maille'],['robecol','#1f2127','Robe col'],
 ['bretfleur','#f4f1ea','Robe à bretelles fleurie'],['boutonnee','#5a6b4a','Robe boutonnée'],['volants','#f2c6d3','Robe à volants'],['maxi','#1f2127','Robe longue fendue']]
 .map(([v,c,n])=>({s:'dress',v,c,n,r:'V',g:'f',nw:1})));
WEAR.bottom.items.unshift({s:'bottom',v:'jupejean',c:'#5b7fb5',n:'Jupe en jean',r:null,g:'f',nw:1},{s:'bottom',v:'cycliste',c:'#1f2127',n:'Short cycliste',r:null,g:'f',nw:1});
WEAR.dress.items.splice(1,0,{s:'dress',v:'longue',c:'#d93b5e',n:'Robe longue fleurie',r:null,g:'f',nw:1});
WEAR.jacket.items.splice(1,0,{s:'jacket',v:'kimono',c:'#26314f',n:'Veste kimono fleurie',r:null,g:'f',nw:1});
WEAR.shoes.items.unshift({s:'shoes',v:'ballerines',c:'#f2c6d3',n:'Ballerines',r:null,g:'f',nw:1});
WEAR.bottom.items.push({s:'bottom',v:'cordon',c:'#1f2127',n:'Pantalon large noir à cordon',r:null,g:'m'},{s:'bottom',v:'jogging',c:'#1f2127',n:'Jogging noir',r:null,g:'m'});
WEAR.set.items.push(
 {n:'Tenue d\'Inès : robe portefeuille',r:'K',g:'f',x:"La tenue d'Inès telle que tu l'as créée.",set:{dress:'portefeuille',dressColor:'#d93b5e',bag:'tote',bagColor:'#ece2cc',necklace:'chaine',shoes:'basses',shoesColor:'#f4f1ea'}},
 {n:'Tenue de Maëlle : chemise et jupe plissée',r:'K',g:'f',x:"La tenue de Maëlle telle que tu l'as créée.",set:{bag:'aucun',top:'chemise',topColor:'#f4f1ea',bottom:'jupe',bottomColor:'#1f2127',shoes:'basses',shoesColor:'#f4f1ea',necklace:'perles'}},
 {n:'Tenue de Jade : chemise camel et pantalon noir',r:'K',g:'f',x:"La tenue de Jade telle que tu l'as créée.",set:{bag:'aucun',top:'chemise',topColor:'#c49a6c',bottom:'cordon',bottomColor:'#1f2127',shoes:'retro',shoesColor:'#f4f1ea',necklace:'rasdecou'}},
 {n:'Tenue d\'Enzo : pull sans manches et jean droit',r:'K',g:'m',x:"La tenue d'Enzo telle que tu l'as créée.",set:{top:'gilet',topColor:'#ece2cc',bottom:'droit',bottomColor:'#86a6cc',shoes:'basses',shoesColor:'#f4f1ea',bag:'bandouliere',bagColor:'#1f2127',necklace:'chaine'}},
 {n:'Tenue de Kylian : sweat bleu et jogging',r:'K',g:'m',x:"La tenue de Kylian telle que tu l'as créée.",set:{bag:'aucun',top:'capuche',topColor:'#3d6fd8',bottom:'jogging',bottomColor:'#c4c7cb',shoes:'running',shoesColor:'#f4f1ea',necklace:'chaine'}},
 {n:'Tenue de Noah : t-shirt crème et pantalon à cordon',r:'K',g:'m',x:"La tenue de Noah telle que tu l'as créée.",set:{bag:'aucun',top:'tshirt',topColor:'#ece2cc',bottom:'cordon',bottomColor:'#1f2127',shoes:'sabots',shoesColor:'#c49a6c',necklace:'chaine'}},
 {n:'Tenue de Sacha : col roulé et baggy gris',r:'K',g:'m',x:"La tenue de Sacha telle que tu l'as créée.",set:{bag:'aucun',top:'colroule',topColor:'#1f2127',bottom:'large',bottomColor:'#9aa0a6',shoes:'basses',shoesColor:'#f4f1ea',necklace:'chaine'}});
(()=>{const F={top:['crop','ajuste','epaules','blouse','henley','asym','salopette'],bottom:['flare','yoga','jupe'],dress:['nuisette','tshirtdress','portefeuille','bretelles','madras','pull'],jacket:['matelassee','cardigan'],shoes:['fourrees','bottes'],hat:['foulard'],necklace:['perles','rasdecou'],glasses:['coeur'],earrings:['anneaux','etoiles']};
 Object.values(WEAR).forEach(W=>W.items.forEach(it=>{if(it.g)return;if(it.set)it.g='f';else if(F[it.s]&&F[it.s].includes(it.v))it.g='f'}))})();
const wearVis=it=>!it.g||state.sexe==='nb'||it.g===state.sexe;
const wearHas=k=>WEAR[k].items.some(it=>wearVis(it)&&it.v!=='aucune'&&it.v!=='aucun');
const CATLBL={f:'Catalogue filles',m:'Catalogue garçons',nb:'Catalogue complet'};
const TABS=[
 {label:'Visage',subs:[
  {id:'face',label:'Forme',opts:Object.keys(FACES),vb:hv('60 40 280 300')},
  {id:'skin',label:'Peau',cols:SKIN},
  {id:'nose',label:'Nez',opts:['bouton','rond','petit','pointu','aucun'],vb:hv('150 208 100 80'),adj:'nose'},
  {id:'mouth',label:'Bouche',opts:MOUTHS,vb:hv('145 248 110 76'),adj:'mouth'},
  {id:'cheeks',label:'Joues',opts:['aucune','rose','fort'],vb:hv('95 175 210 140')},
  {id:'freckles',label:'Taches de rousseur',opts:['aucune','legeres','beaucoup'],vb:hv('115 195 170 95')},
  {id:'rides',label:'Rides',opts:['aucune','fines','marquees'],vb:hv('95 110 210 210')},
  {id:'barbe',label:'Barbe',noF:1,opts:['aucune','duvet','barbe3j','moustache','bouc','collier','courte'],vb:hv('100 215 200 125')}]},
 {label:'Yeux',subs:[
  {id:'eyes',label:'Forme',opts:typeof EYE_ART!=='undefined'?Object.keys(EYE_ART):Object.keys(EYES),vb:hv('112 155 176 100'),adj:'eyes'},
  {id:'cils',label:'Cils',opts:typeof EYE_LASHES!=='undefined'?EYE_LASHES:['naturels'],vb:hv('112 155 176 100')},
  {id:'iris',label:'Iris',cols:IRIS},
  {id:'brows',label:'Sourcils',opts:Object.keys(BROWS),vb:hv('112 128 176 100'),adj:'brows'},
  {id:'browColor',label:'Couleur des sourcils',cols:BROWC}]},
 {label:'Cheveux',subs:CAT_H.filter(([k])=>k==='all'||HAIR_ALL.some(h=>HAIRDB[h].c.split(' ').includes(k))).map(([k,l])=>({label:l,hairCat:k})).concat([{id:'hairColor',label:'Couleur',cols:HAIR},{id:'edges',label:'Baby hairs',opts:['aucun','baby'],vb:hv('90 100 220 120')}])},
 {label:'Tenue',subs:Object.entries(WEAR).map(([k,W])=>({label:W.l,wear:k}))},
 {label:'Corps',subs:[
  {id:'taille',label:'Taille',opts:Object.keys(TAILLE),vb:FVB,tall:1},
  {id:'corpulence',label:'Corpulence',opts:Object.keys(CORP),vb:'40 120 320 520',tall:1}]},
 {label:'Fond',subs:[
  {id:'bgPattern',label:'Motif',opts:['uni','degrade','pois','rayures','rayons'],vb:PVB,bg:true},
  {id:'bgColor',label:'Couleur',cols:BGC,bg:true}]}
];
const ADJ={
 eyes:{label:'Ajuster les yeux',k:[['eyesY',-2,'up','Monter'],['eyesY',2,'down','Descendre'],['eyesX',-2,'in','Rapprocher'],['eyesX',2,'out','Écarter'],['eyesS',-.05,'minus','Réduire'],['eyesS',.05,'plus','Agrandir']]},
 brows:{label:'Ajuster les sourcils',k:[['browsY',-2,'up','Monter'],['browsY',2,'down','Descendre'],['browsX',-2,'in','Rapprocher'],['browsX',2,'out','Écarter']]},
 mouth:{label:'Ajuster la bouche',k:[['mouthY',-2,'up','Monter'],['mouthY',2,'down','Descendre'],['mouthS',-.05,'minus','Réduire'],['mouthS',.05,'plus','Agrandir']]},
 nose:{label:'Ajuster le nez',k:[['noseY',-2,'up','Monter'],['noseY',2,'down','Descendre'],['noseS',-.05,'minus','Réduire'],['noseS',.05,'plus','Agrandir']]}
};
const LIM={eyesY:[-16,16],eyesX:[-14,14],eyesS:[.8,1.25],browsY:[-14,14],browsX:[-12,12],mouthY:[-14,14],mouthS:[.8,1.3],noseY:[-14,12],noseS:[.75,1.35]};
const ICON={
 up:'<path d="M10 16V4M5 9l5-5 5 5"/>',down:'<path d="M10 4v12M5 11l5 5 5-5"/>',
 in:'<path d="M2 10h6M5 7l3 3-3 3M18 10h-6M15 7l-3 3 3 3"/>',out:'<path d="M8 10H2M5 7l-3 3 3 3M12 10h6M15 7l3 3-3 3"/>',
 minus:'<circle cx="9" cy="9" r="6"/><path d="M6 9h6M14 14l4 4"/>',plus:'<circle cx="9" cy="9" r="6"/><path d="M6 9h6M9 6v6M14 14l4 4"/>'};

const DEFAULT={name:'Léa',nom:'Dupont',taille:'moyenne',corpulence:'moyenne',rides:'aucune',barbe:'aucune',face:'ovale',skin:SKIN[3],nose:'rond',mouth:'remontante',cheeks:'rose',freckles:'legeres',
 eyes:'amande',cils:'naturels',iris:IRIS[0],brows:'epais',hair:'blongs',hairColor:HAIR[0],top:'epaules',topColor:'#ece2cc',bottom:'large',bottomColor:'#9aa0a6',shoes:'basses',shoesColor:SHOEC[0],dress:'aucune',dressColor:'#ece2cc',jacket:'aucune',jacketColor:'#5b5a3c',hat:'aucun',hatColor:'#1f2127',bag:'aucun',bagColor:'#7a5236',necklace:'aucun',edges:'aucun',sexe:'f',orient:'hetero',
 glasses:'aucune',earrings:'aucune',browColor:'',bgPattern:'uni',bgColor:BGC[1],
 perso:'sociable',raison:'demenagement',ancien:'Lycée Baimbridge',niveau:'moyen',forts:[],
 adj:{eyesY:0,eyesX:0,eyesS:1,browsY:0,browsX:0,mouthY:0,mouthS:1,noseY:0,noseS:1}};
const KEY='atelier-avatar-v1';
const clone=o=>JSON.parse(JSON.stringify(o));
function normalize(x){const s=clone(DEFAULT);if(x&&typeof x==='object'){for(const k in s){if(k!=='adj'&&typeof x[k]===typeof s[k])s[k]=x[k]}if(x.adj)for(const k in s.adj){if(typeof x.adj[k]==='number')s.adj[k]=x.adj[k]}}if(s.hair==='tresse')s.hair='longondule';if(typeof EYE_ART!=='undefined'&&!EYE_ART[s.eyes])s.eyes=EYE_OLD[s.eyes]||'amande';if(typeof EYE_LASHES!=='undefined'&&!EYE_LASHES.includes(s.cils))s.cils='naturels';if(!BROWS[s.brows])s.brows='naturels';if(typeof MOUTH_ART!=='undefined'&&!MOUTH_ART[s.mouth])s.mouth=MOUTH_OLD[s.mouth]||'naturelle';if(x&&typeof x.nom!=='string'&&/\s/.test((s.name||'').trim())){const w=s.name.trim().split(/\s+/);s.name=w.shift();s.nom=w.join(' ').replace(/^./,c=>c.toUpperCase())}else if(x&&typeof x.nom!=='string')s.nom=['Léa','Enzo',''].includes((s.name||'').trim())?DEFAULT.nom:'';if(!(s.name||'').trim()){s.name=s.sexe==='m'?'Enzo':'Léa';if(!(s.nom||'').trim())s.nom=DEFAULT.nom}return s}
let state=(()=>{try{const v=localStorage.getItem(KEY);return v?normalize(JSON.parse(v)):clone(DEFAULT)}catch(e){return clone(DEFAULT)}})();
let tab=0, sub=0;

/* ---------- interface ---------- */
const $=id=>document.getElementById(id);
const portrait=$('portrait'),tabsEl=$('tabs'),subsEl=$('subs'),grid=$('grid'),adjust=$('adjust'),tools=$('tools'),nom=$('nom'),codeEl=$('code');

let pview='portrait';
function drawPortrait(){const full=pview==='full';portrait.classList.toggle('full',full);portrait.innerHTML=render(state,full?FVB:PVB,'pv',true);
 document.querySelectorAll('[data-pv]').forEach(b=>b.setAttribute('aria-pressed',b.dataset.pv===pview));
 drawIdent();
 if(document.activeElement!==codeEl) codeEl.value=JSON.stringify(state);}
/* ---------- parcours : personnalité, raison du changement, ancien lycée, niveau et facilités ---------- */
const PERSOS={sociable:{l:['Drôle et sociable','Drôle et sociable'],x:"+5 d'amitié avec tout le monde au départ"},timide:{l:['Timide et observatrice','Timide et observateur'],x:'Réservé·e, mais Jade et Jessica se sentent proches de toi (+10)'},ambitieux:{l:['Ambitieuse et travailleuse','Ambitieux et travailleur'],x:'+5 % de réussite dans toutes les matières'},
 sportif:{l:['Sportive et énergique','Sportif et énergique'],x:"EPS +15 % et les sportifs t'apprécient (+8)"},creatif:{l:['Rêveuse et créative','Rêveur et créatif'],x:"Français et philo +6 %, les artistes t'apprécient (+8)"},rebelle:{l:['Rebelle au grand cœur','Rebelle au grand cœur'],x:'Les populaires te remarquent (+8), mais les profs te surveillent'}};
const persoL=(k,sx)=>{const p=(PERSOS[k]||PERSOS.sociable).l;return sx==='m'?p[1]:p[0]};
const RAISONS={demenagement:'Ta famille a déménagé',metropole:'Retour de métropole',specialite:'Une spécialité qui n\'existait pas dans ton ancien lycée',renvoi:'Renvoyé·e de ton ancien lycée',depart:'Un nouveau départ après une année difficile',parents:'La séparation de tes parents'};
const ANCIENS=['Lycée Baimbridge (Les Abymes)','Lycée Carnot (Pointe-à-Pitre)','Lycée Gerville-Réache (Basse-Terre)','Lycée de Providence (Les Abymes)','Lycée Faustin-Fléret (Morne-à-l\'Eau)','Lycée de Bellevue (Fort-de-France)','Lycée Henri-IV (Paris)','Lycée Montaigne (Bordeaux)'];
const NIVEAUX={excellent:{l:'Excellent·e',start:58,k:1.3},bon:{l:'Bon niveau',start:48,k:1.15},moyen:{l:'Moyen',start:40,k:1},difficulte:{l:'En difficulté',start:30,k:.85}};
const FORTS_MAX=2;
/* gains de réussite selon le niveau et les facilités : on avance plus ou moins vite */
function gainK(sub,g){const s=me(),n=NIVEAUX[s.niveau]||NIVEAUX.moyen,f=(s.forts||[]).includes(sub);if(g>0)return Math.max(1,Math.round(g*n.k*(f?1.5:1)));return f?Math.round(g*.6):g}
function drawParcours(){let el=$('parcours');if(!el){el=document.createElement('div');el.id='parcours';el.className='ident';$('idBlock').after(el);
  el.addEventListener('click',e=>{const b=e.target.closest('[data-niv],[data-fort]');if(!b)return;
   if(b.dataset.niv)state.niveau=b.dataset.niv;else{const k=b.dataset.fort,F=state.forts||[];state.forts=F.includes(k)?F.filter(x=>x!==k):F.length>=FORTS_MAX?[...F.slice(1),k]:[...F,k]}drawParcours();codeEl.value=JSON.stringify(state)});
  el.addEventListener('change',e=>{const t=e.target;if(t.id==='pPerso')state.perso=t.value;if(t.id==='pRaison')state.raison=t.value;drawParcours();codeEl.value=JSON.stringify(state)});
  el.addEventListener('input',e=>{if(e.target.id==='pAncien'){state.ancien=e.target.value.slice(0,60);codeEl.value=JSON.stringify(state)}})}
 el.hidden=!!editFam;if(editFam)return;const sx=state.sexe,T=t=>gtxt(t,sx);
 el.innerHTML=`<div class="field"><label for="pPerso">Personnalité</label><select id="pPerso">${Object.entries(PERSOS).map(([k,v])=>`<option value="${k}" ${state.perso===k?'selected':''}>${esc(persoL(k,sx))}</option>`).join('')}</select></div>
 <p class="hint">${esc(T((PERSOS[state.perso]||PERSOS.sociable).x))}</p>
 <div class="field"><label for="pRaison">Pourquoi un nouveau lycée ?</label><select id="pRaison">${Object.entries(RAISONS).map(([k,v])=>`<option value="${k}" ${state.raison===k?'selected':''}>${esc(T(v))}</option>`).join('')}</select></div>
 <div class="field"><label for="pAncien">Ancien lycée</label><input id="pAncien" type="text" maxlength="60" list="pAnciens" autocomplete="off" value="${esc(state.ancien||'')}"><datalist id="pAnciens">${ANCIENS.map(a=>`<option value="${esc(a)}"></option>`).join('')}</datalist></div>
 <div class="field"><span class="lbl" id="lblNiv">Niveau scolaire</span><div class="segs" role="group" aria-labelledby="lblNiv">${Object.entries(NIVEAUX).map(([k,v])=>`<button class="sub" type="button" data-niv="${k}" aria-pressed="${state.niveau===k}">${esc(T(v.l))}</button>`).join('')}</div></div>
 <div class="field"><span class="lbl" id="lblFort">Facilités (${FORTS_MAX} matières max)</span><div class="segs" role="group" aria-labelledby="lblFort">${Object.entries(SUBJ).map(([k,v])=>`<button class="sub" type="button" data-fort="${k}" aria-pressed="${(state.forts||[]).includes(k)}">${esc(v)}</button>`).join('')}</div></div>
 <p class="hint">${esc(T(`Au départ, ${(NIVEAUX[state.niveau]||NIVEAUX.moyen).start} % de chances de réussite dans chaque matière (+12 % dans tes facilités). En cours, tu progresses plus ou moins vite selon ton niveau (×${String((NIVEAUX[state.niveau]||NIVEAUX.moyen).k).replace('.',',')}), et 1,5 fois plus vite dans tes facilités.`))}</p>`}
function applyParcours(g){const s=me(),n=NIVEAUX[s.niveau]||NIVEAUX.moyen;Object.keys(g.know).forEach(k=>{g.know[k]=n.start+((s.forts||[]).includes(k)?12:0)});
 const add=(ids,d)=>ids.forEach(i=>{if(g.rel[i])g.rel[i].ami=clamp(g.rel[i].ami+d,-30,100)});
 ({sociable:()=>add(NPCS.map(n=>n.id),5),timide:()=>add(['jade','jessica'],10),ambitieux:()=>Object.keys(g.know).forEach(k=>g.know[k]=clamp(g.know[k]+5,0,100)),
  sportif:()=>{g.know.eps=clamp(g.know.eps+15,0,100);add(GROUPS.sport.m,8)},creatif:()=>{g.know.francais+=6;g.know.philo+=6;add(GROUPS.art.m,8)},rebelle:()=>add(GROUPS.pop.m,8)}[s.perso]||(()=>{}))()}
const SEXES=[['f','Fille'],['m','Garçon'],['nb','Non-binaire']],ORIS=['hetero','homo','bi','pan','ace'];
const oriShort=(o,g)=>({hetero:'Hétéro',homo:g==='f'?'Lesbienne':g==='m'?'Gay':'Homo',bi:'Bi',pan:'Pan',ace:g==='f'?'Asexuelle':g==='m'?'Asexuel':'Asexuel·le'})[o];
function attracted(o,g,h){if(o==='ace')return false;if(o==='bi'||o==='pan')return true;return o==='homo'?g===h:g!==h}
function oriHint(g,o){if(o==='ace')return "Pas d'histoire de cœur : ton personnage vivra surtout des amitiés.";const who=o==='bi'||o==='pan'?'tout le monde':o==='homo'?{f:'des filles',m:'des garçons',nb:'des personnes non-binaires'}[g]:{f:'des garçons',m:'des filles',nb:'des filles et des garçons'}[g];return `Ton personnage pourra vivre des histoires de cœur avec ${who}. Chaque camarade a aussi sa propre attirance.`}
function drawIdent(){drawParcours();if(editFam)return;
 $('segSexe').innerHTML=SEXES.map(([k,l])=>`<button class="sub" type="button" data-sx="${k}" aria-pressed="${state.sexe===k}">${l}</button>`).join('');
 $('segOri').innerHTML=ORIS.map(k=>`<button class="sub" type="button" data-or="${k}" aria-pressed="${state.orient===k}">${oriShort(k,state.sexe)}</button>`).join('');
 $('oriHint').textContent=oriHint(state.sexe,state.orient);}
const BASE_LOOK={f:{face:'ovale',skin:SKIN[3],eyes:'amande',cils:'naturels',iris:IRIS[0],brows:'epais',nose:'rond',mouth:'remontante',cheeks:'rose',freckles:'legeres',hair:'blongs',hairColor:HAIR[0],top:'epaules',topColor:'#ece2cc',bottom:'large',bottomColor:'#9aa0a6',shoes:'basses',shoesColor:SHOEC[0],dress:'aucune',dressColor:'#ece2cc',earrings:'aucune',necklace:'aucun',bag:'aucun',jacket:'aucune',glasses:'aucune',barbe:'aucune',bgPattern:'uni',bgColor:BGC[1]},
 m:{face:'allonge',skin:SKIN[2],eyes:'amande',cils:'naturels',iris:IRIS[1],brows:'epais',nose:'petit',mouth:'remontante',cheeks:'aucune',freckles:'aucune',hair:'degrade',hairColor:HAIR[2],top:'gilet',topColor:'#ece2cc',bottom:'droit',bottomColor:BOTC[0],shoes:'basses',shoesColor:SHOEC[0],dress:'aucune',jacket:'aucune',earrings:'aucune',bag:'bandouliere',bagColor:'#1f2127',necklace:'chaine',glasses:'aucune',barbe:'aucune',bgPattern:'uni',bgColor:BGC[0],adj:{eyesY:0,eyesX:0,eyesS:1.1,browsY:0,browsX:0,mouthY:3,mouthS:1,noseY:6,noseS:1}}};
const BASE_NAME={f:'Léa',m:'Enzo'};
function applyBase(sx){const b=BASE_LOOK[sx];if(!b)return;Object.assign(state,clone(b));state.adj=clone(b.adj||DEFAULT.adj);if([...Object.values(BASE_NAME),'Léa Dupont','Enzo Dupont',''].includes((state.name||'').trim())){state.name=BASE_NAME[sx];if(!(state.nom||'').trim())state.nom=DEFAULT.nom}const n=document.getElementById('nom');if(n)n.value=state.name;const nf=document.getElementById('nomFam');if(nf)nf.value=state.nom||''}
$('idBlock').addEventListener('click',e=>{const b=e.target.closest('[data-sx],[data-or]');if(!b)return;if(b.dataset.sx){const prev=state.sexe;state.sexe=b.dataset.sx;if(prev!==state.sexe){applyBase(state.sexe);if(state.sexe==='m'){state.dress='aucune';['earrings','necklace','glasses','hat','jacket','shoes'].forEach(k=>{const it=Object.values(WEAR).flatMap(W=>W.items).find(x=>x.s===k&&x.v===state[k]);if(it&&it.g==='f')state[k]=k==='shoes'?'basses':k==='necklace'||k==='hat'?'aucun':'aucune'})}if(state.sexe==='f')state.barbe='aucune';drawSubs();if(typeof refresh==='function')refresh()}}else state.orient=b.dataset.or;drawIdent()});
$('viewSeg').addEventListener('click',e=>{const b=e.target.closest('[data-pv]');if(!b)return;pview=b.dataset.pv;drawPortrait()});
function drawTabs(){tabsEl.innerHTML=TABS.map((t,i)=>`<button class="tab" role="tab" type="button" data-i="${i}" aria-selected="${i===tab}">${t.label}</button>`).join('')}
function drawSubs(){const hid=s=>(s.noF&&state.sexe==='f')||(s.wear&&!wearHas(s.wear));if(TABS[tab].subs[sub]&&hid(TABS[tab].subs[sub]))sub=0;const wearTab=TABS[tab].subs.some(s=>s.wear);subsEl.innerHTML=(wearTab?`<span class="catlbl">${CATLBL[state.sexe]||CATLBL.nb}</span>`:'')+TABS[tab].subs.map((s,i)=>`<button class="sub" type="button" data-i="${i}" aria-pressed="${i===sub}" ${hid(s)?'hidden':''}>${s.label}</button>`).join('')}
const BODYL={petite:['Petite','Petit'],moyenne:['Moyenne','Moyen'],grande:['Grande','Grand'],mince:['Mince','Mince'],ronde:['Ronde','Rond'],forte:['Forte','Fort']};
const bodyLbl=o=>(BODYL[o]||[o,o])[state.sexe==='m'?1:0];
let catPick={},curList=[];
function catList(S){
 if(S.hairCat)return HAIR_ALL.filter(k=>S.hairCat==='all'||HAIRDB[k].c.split(' ').includes(S.hairCat)).map(k=>({s:'hair',v:k,...HAIRDB[k],vb:'58 -4 284 290'}));
 const W=WEAR[S.wear];return W.items.filter(wearVis).map(it=>({...it,vb:it.vb||W.vb}));
}
function entryState(e){if(e.set)return {...state,jacket:'aucune',dress:'aucune',...e.set};const o={...state};o[e.s]=e.v;const cs=COLSLOT[e.s];if(cs&&e.c)o[cs]=e.c;if(e.s==='top'||e.s==='bottom')o.dress='aucune';return o}
function isAct(e,list){if(e.set||state[e.s]!==e.v)return false;if((e.s==='top'||e.s==='bottom')&&state.dress!=='aucune')return false;
 const same=list.filter(x=>x.s===e.s&&x.v===e.v),cs=COLSLOT[e.s];if(same.length<2||!cs)return same[0]===e;const m=same.find(x=>x.c===state[cs]);return m?m===e:same[0]===e}
function drawDetail(S){const key=S.hairCat?'hair':S.wear,d=$('detail');
 const pk=catPick[key]&&curList.find(x=>x.n===catPick[key].n&&(x.set||isAct(x,curList))),e=pk||curList.find(x=>isAct(x,curList));
 const cs=e&&!e.set&&COLSLOT[e.s],pal=cs&&state[e.s]!=='aucune'&&state[e.s]!=='aucun'?PALS[cs]:null;
 d.hidden=false;d.dataset.slot=cs||'';
 d.innerHTML=e?`<b>${esc(e.n)}</b><span class="src">${e.r?`D'après ${REFS[e.r]}`:'Sans image de référence'}</span>${e.v==='aucune'||e.v==='aucun'?'':`<p>${esc(e.r?(e.x||'Coupe et couleur reprises de la référence.'):(e.x||NOREF))}</p>`}<p class="vect">${VECT}</p>${pal?`<span class="src">Couleur</span><div class="pal">${pal.map(c=>`<button type="button" data-col="${c}" aria-label="Couleur ${c}" aria-pressed="${state[cs]===c}" style="background:${c}"></button>`).join('')}</div>`:''}`
  :`<span class="src">Choisis un élément pour voir sa fiche.</span><p class="vect">${VECT}</p>`;
}
$('detail').addEventListener('click',e=>{const b=e.target.closest('[data-col]');if(!b)return;state[$('detail').dataset.slot]=b.dataset.col;refresh()});
function drawGrid(){
 const S=TABS[tab].subs[sub];
 if(S.hairCat||S.wear){curList=catList(S);grid.className='grid cat';adjust.hidden=true;
  grid.innerHTML=curList.map((e,i)=>`<button class="opt" type="button" data-ci="${i}" aria-pressed="${e.set?!!(catPick.set&&catPick.set.n===e.n&&Object.entries(e.set).every(([k,v])=>state[k]===v)):isAct(e,curList)}"><span class="th">${render({...entryState(e),taille:'moyenne'},e.vb,'t'+i,false)}</span><span class="nm">${esc(e.n)}</span>${e.nw?'<span class="refb nw">Nouveau</span>':e.r?'<span class="refb">Réf.</span>':''}</button>`).join('');
  drawDetail(S);return}
 $('detail').hidden=true;
 if(S.cols){grid.className='grid swatches';
  grid.innerHTML=S.cols.map(c=>`<button class="sw" type="button" data-v="${c}" aria-label="Couleur ${c}" aria-pressed="${state[S.id]===c}" style="background:${c}"></button>`).join('');}
 else{grid.className='grid';
  grid.className='grid'+(S.tall?' tall':'');
  grid.innerHTML=S.opts.map((o,i)=>`<button class="opt" type="button" data-v="${o}" aria-pressed="${state[S.id]===o}"><span class="th">${render({...state,[S.id]:o},S.vb,'t'+i,!!S.bg)}</span><span>${S.tall?bodyLbl(o):(L[o]||o)}</span></button>`).join('');}
 const A=S.adj&&ADJ[S.adj];
 adjust.hidden=!A;
 if(A){$('adjLbl').textContent=A.label;
  tools.innerHTML=A.k.map(([k,d,ic,lb])=>`<button class="tool" type="button" data-k="${k}" data-d="${d}" aria-label="${lb}" title="${lb}"><svg viewBox="0 0 20 20" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">${ICON[ic]}</svg></button>`).join('');}
}
function refresh(){drawPortrait();drawGrid()}

tabsEl.addEventListener('click',e=>{const b=e.target.closest('.tab');if(!b)return;tab=+b.dataset.i;sub=0;pview=['Tenue','Corps'].includes(TABS[tab].label)?'full':'portrait';drawTabs();drawSubs();refresh()});
subsEl.addEventListener('click',e=>{const b=e.target.closest('.sub');if(!b)return;sub=+b.dataset.i;drawSubs();drawGrid()});
grid.addEventListener('click',e=>{const ci=e.target.closest('[data-ci]');if(ci){const S=TABS[tab].subs[sub],en=curList[+ci.dataset.ci];if(!en)return;const n=state.name;state=en.set?{...state,jacket:'aucune',dress:'aucune',...en.set}:entryState(en);state.name=n;catPick[S.hairCat?'hair':S.wear]=en;refresh();return}
 const b=e.target.closest('[data-v]');if(!b)return;state[TABS[tab].subs[sub].id]=b.dataset.v;refresh()});
tools.addEventListener('click',e=>{const b=e.target.closest('.tool');if(!b)return;const k=b.dataset.k,[lo,hi]=LIM[k];
 state.adj[k]=Math.round(Math.min(hi,Math.max(lo,state.adj[k]+parseFloat(b.dataset.d)))*100)/100;refresh()});
nom.addEventListener('input',()=>{state.name=nom.value;drawPortrait()});
$('nomFam').addEventListener('input',()=>{state.nom=$('nomFam').value});
/* prénoms et noms au hasard (le dé) */
const PRENOMS={f:['Emma','Chloé','Manon','Camille','Lina','Zoé','Lola','Louise','Clara','Anaïs','Océane','Maya','Léna','Nina','Eva','Alice','Kenza','Naomi','Yasmine','Laly','Shaïna','Mélissa','Célia','Romane','Léa'],
 m:['Lucas','Hugo','Léo','Nathan','Théo','Ethan','Maël','Gabriel','Raphaël','Louis','Jules','Adam','Rayan','Mathis','Timéo','Liam','Évan','Nolan','Kenzo','Dylan','Ilan','Sohan','Loïc','Jordan','Enzo'],
 nb:['Charlie','Alex','Eden','Lou','Ange','Morgan','Andrea','Camille','Maxime','Dominique','Swann','Sam','Noa','Elie','Louison','Marley','Ari','Kim','Robin','Sasha']};
const NOMS=['Dupont','Martin','Bernard','Petit','Durand','Lefèvre','Moreau','Laurent','Girard','Fontaine','Chevalier','Lacroix','Bellegarde','Clairville','Florentin','Saint-Félix','Bélair','Gaspard','Lafleur','Desrosiers','Rosemond','Valentin','Hilaire','Augustin','Mathurin','Théodore'];
const pickOther=(list,cur)=>{const l=list.filter(x=>x!==cur);return l[Math.floor(Math.random()*l.length)]};
function rollDice(b){b.classList.remove('roll');void b.offsetWidth;b.classList.add('roll')}
$('diceNom').onclick=e=>{const sx=editFam?(/Mère|sœur|Tante|mère|Sœur/.test(famDraft[editFam.i].role)?'f':'m'):(state.sexe||'f');state.name=pickOther(PRENOMS[sx]||PRENOMS.f,state.name);nom.value=state.name;rollDice(e.currentTarget);if(editFam)setAtelierMode();drawPortrait()};
$('diceFam').onclick=e=>{state.nom=pickOther(NOMS,state.nom);$('nomFam').value=state.nom;rollDice(e.currentTarget)};
const fullName=s=>[s&&s.name,s&&s.nom].filter(x=>x&&String(x).trim()).join(' ');

const pick=a=>a[Math.floor(Math.random()*a.length)];
const NATURAL=HAIR.slice(0,8), LIGHTBG=BGC.slice(0,7);
const COMBOS=[['#d93b5e','#f7d9e3'],['#3d6fd8','#d6ecf7'],['#f2c230','#fff3c4'],['#2fa3a0','#e3f2e6'],['#7a4fd0','#efe3fb'],['#e8613c','#fde8d4'],['#4a9a4f','#e3f2e6'],['#2c2f3a','#e9eef6']];
function harmonious(){const s=clone(DEFAULT);s.dress='aucune';s.name=state.name;s.sexe=state.sexe;s.orient=state.orient;const male=state.sexe==='m'&&Math.random()<.85;
 s.face=male?pick(['naturel','naturel','anguleux','carre','allonge']):pick(['joufflu','ovale','rond','coeur','allonge']);s.skin=pick(SKIN);
 s.eyes=male?pick(['doux','doux','nets','amande']):pick(['grands','grands','brillants','amande','amande','rieurs']);s.iris=pick(IRIS.slice(0,6));
 s.brows=pick(['epais','epais','fins','arques']);s.nose=pick(['bouton','bouton','petit']);
 s.mouth=pick(MOUTHS);s.cheeks=pick(['rose','rose','aucune']);
 s.freckles=Math.random()<.2?'legeres':'aucune';
 s.hair=male?pick(['degrade','taper','fadehaut','raiecote']):pick(HAIR_ALL.filter(h=>!['degrade','taper','fadehaut','raiecote'].includes(h)));if(male){s.cheeks='aucune';s.freckles='aucune'}
 s.hairColor=Math.random()<.85?pick(NATURAL):pick(HAIR.slice(8));
 if(SKIN.indexOf(s.skin)>=5&&Math.random()<.7)s.hairColor=pick(HAIR.slice(0,3));
 const boy=state.sexe==='m';
 s.top=pick(boy?['tshirt','capuche','chemise','colroule','gilet']:TOPS);
 s.bottom=pick(boy?['droit','large','jogging','cordon','short']:BOTTOMS);s.bottomColor=pick(BOTC);s.shoes=pick(boy?['montantes','running','basses','retro']:SHOES);s.shoesColor=pick(SHOEC);
 const c=pick(COMBOS);s.topColor=c[0];s.bgColor=c[1];s.bgPattern=Math.random()<.75?'uni':pick(['degrade','pois']);
 s.glasses=Math.random()<.25?pick(['rondes','carrees','dorees']):'aucune';
 s.taille=pick(['petite','moyenne','moyenne','grande']);s.corpulence=pick(['mince','moyenne','moyenne','moyenne','ronde','forte']);
 s.earrings=Math.random()<(boy?.1:.35)?(boy?'perles':pick(['anneaux','perles'])):'aucune';
 return s}
$('bRand').onclick=()=>{state=harmonious();refresh();toast('Nouvel avatar tiré au sort')};
$('bReset').onclick=()=>{const n=state.name,nf=state.nom,sx=state.sexe,o=state.orient;state=clone(DEFAULT);if(BASE_LOOK[sx]){Object.assign(state,clone(BASE_LOOK[sx]));state.adj=clone(BASE_LOOK[sx].adj||DEFAULT.adj)}else state.dress='aucune';state.name=n;state.nom=nf;state.sexe=sx;state.orient=o;drawSubs();refresh();toast('Avatar réinitialisé')};
$('bSave').onclick=()=>{try{localStorage.setItem(KEY,JSON.stringify(state));cloudPush();toast(window.CLOUD&&window.CLOUD.user?'Avatar enregistré':'Avatar enregistré sur cet appareil')}catch(e){toast("Enregistrement impossible ici : copie plutôt le code")}};
$('bCopy').onclick=()=>{const t=JSON.stringify(state);codeEl.value=t;
 const fb=()=>{codeEl.focus();codeEl.select();toast('Code sélectionné : copie-le avec Ctrl+C')};
 try{navigator.clipboard.writeText(t).then(()=>toast('Code copié'),fb)}catch(e){fb()}};
$('bLoad').onclick=()=>{try{state=normalize(JSON.parse(codeEl.value));nom.value=state.name;$('nomFam').value=state.nom||'';refresh();toast('Avatar chargé')}catch(e){toast("Ce code n'est pas valide : vérifie qu'il est complet")}};

let tt;function toast(m){const t=$('toast');t.textContent=m;t.classList.add('on');clearTimeout(tt);tt=setTimeout(()=>t.classList.remove('on'),2200)}

/* =================== JEU : ÉCRAN D'ACCUEIL =================== */
function seeded(seed){let a=seed;return()=>{a|=0;a=a+0x6D2B79F5|0;let t=Math.imul(a^a>>>15,1|a);t=t+Math.imul(t^t>>>7,61|t)^t;return((t^t>>>14)>>>0)/4294967296}}
function randAvatar(seed,over){const r=seeded(seed),p=a=>a[Math.floor(r()*a.length)],s=clone(DEFAULT);
 TABS.forEach(t=>t.subs.forEach(x=>{s[x.id]=p(x.opts||x.cols)}));
 if(r()<.7)s.glasses='aucune';if(r()<.6)s.earrings='aucune';s.bgPattern='uni';s.dress='aucune';return Object.assign(s,over)}
const NPCS=[
 {id:'ines',name:'Inès',handle:'@ines.mrl',av:{face:'ovale',skin:'#b8784a',nose:'bouton',mouth:'remontante',cheeks:'rose',freckles:'aucune',eyes:'amande',iris:'#4a2a17',brows:'epais',hair:'longs',hairColor:'#1c1412',top:'tshirt',topColor:'#d93b5e',glasses:'aucune',earrings:'anneaux',bgPattern:'uni',bgColor:'#f7d9e3',adj:{eyesY:0,eyesX:0,eyesS:1,browsY:0,browsX:0,mouthY:0,mouthS:1,noseY:0,noseS:1}}},
 {id:'kylian',name:'Kylian',handle:'@kyky971',av:{face:'carre',skin:'#80502f',nose:'petit',mouth:'asymetrique',cheeks:'aucune',freckles:'aucune',eyes:'grands',iris:'#4a2a17',brows:'epais',hair:'court',hairColor:'#1c1412',top:'capuche',topColor:'#3d6fd8',glasses:'aucune',earrings:'aucune',bgPattern:'uni',bgColor:'#d6ecf7',adj:{eyesY:0,eyesX:0,eyesS:1,browsY:0,browsX:0,mouthY:0,mouthS:1,noseY:0,noseS:1}}},
 {id:'maelle',name:'Maëlle',handle:'@maelle_cheer',av:{face:'coeur',skin:'#f6cfae',nose:'bouton',mouth:'remontante',cheeks:'rose',freckles:'aucune',eyes:'brillants',iris:'#3d7f9a',brows:'arques',hair:'queue',hairColor:'#c08a4e',top:'chemise',topColor:'#e8613c',glasses:'aucune',earrings:'perles',bgPattern:'uni',bgColor:'#fff3c4',adj:{eyesY:0,eyesX:0,eyesS:1,browsY:0,browsX:0,mouthY:0,mouthS:1,noseY:0,noseS:1}}},
 {id:'noah',name:'Noah',handle:'@noah.bsk',av:{face:'rond',skin:'#9a6140',nose:'bouton',mouth:'entrouverte',cheeks:'aucune',freckles:'aucune',eyes:'grands',iris:'#4a2a17',brows:'epais',hair:'boucles',hairColor:'#1c1412',top:'tshirt',topColor:'#2fa3a0',glasses:'aucune',earrings:'aucune',bgPattern:'uni',bgColor:'#e3f2e6',adj:{eyesY:0,eyesX:0,eyesS:1,browsY:0,browsX:0,mouthY:0,mouthS:1,noseY:0,noseS:1}}},
 {id:'jade',name:'Jade',handle:'@jadou',av:{face:'joufflu',skin:'#eab48a',nose:'petit',mouth:'ronde',cheeks:'rose',freckles:'legeres',eyes:'grands',iris:'#4f7a3a',brows:'fins',hair:'carre',hairColor:'#3b2219',top:'colroule',topColor:'#7a4fd0',glasses:'rondes',earrings:'aucune',bgPattern:'uni',bgColor:'#efe3fb',adj:{eyesY:0,eyesX:0,eyesS:1,browsY:0,browsX:0,mouthY:0,mouthS:1,noseY:0,noseS:1}}},
 {id:'kenza',name:'Kenza',handle:'@kenza.lcx',av:{}},
 {id:'eva',name:'Eva',handle:'@eva.clrv',av:{}},
 {id:'noemie',name:'Noémie',handle:'@noemie.foot971',av:{}},
 {id:'jessica',name:'Jessica',handle:'@jess.drs',av:{}},
 {id:'meisha',name:'Meisha',handle:'@meisha.blr',av:{}},
 {id:'anais',name:'Anaïs',handle:'@anais_run971',av:{}},
 {id:'sacha',name:'Sacha',handle:'@sachamusic',av:{face:'ovale',skin:'#6a4027',nose:'bouton',mouth:'remontante',cheeks:'rose',freckles:'aucune',eyes:'amande',iris:'#4a2a17',brows:'epais',hair:'chignon',hairColor:'#1c1412',top:'chemise',topColor:'#2c2f3a',glasses:'aucune',earrings:'etoiles',bgPattern:'uni',bgColor:'#fde8d4',adj:{eyesY:0,eyesX:0,eyesS:1,browsY:0,browsX:0,mouthY:0,mouthS:1,noseY:0,noseS:1}}}
];
const POTINS={id:'potins',name:'Potins du lycée',handle:'@PotinsDuBahut',av:{face:'joufflu',skin:'#d4975f',nose:'bouton',mouth:'asymetrique',cheeks:'rose',freckles:'aucune',eyes:'amande',iris:'#4a2a17',brows:'epais',hair:'longs',hairColor:'#5b4bd1',top:'tshirt',topColor:'#2c2f3a',glasses:'soleil',earrings:'aucune',bgPattern:'rayons',bgColor:'#2d3550',adj:{eyesY:0,eyesX:0,eyesS:1,browsY:0,browsX:0,mouthY:0,mouthS:1,noseY:0,noseS:1}}};
/* noms de famille des camarades */
const NPC_NOM={ines:'Morel',kylian:'Calixte',maelle:'Lacour',noah:'Bellevue',jade:'Hilaire',anais:'Théodore',kenza:'Lacroix',eva:'Clairville',noemie:'Gaspard',jessica:'Derosiers',meisha:'Belaire',sacha:'Sylvestre'};
NPCS.forEach(n=>{n.nom=NPC_NOM[n.id]||''});
const fullNameOf=id=>{const n=WHO[id];return n?(n.nom?n.name+' '+n.nom:n.name):''};
const WHO=Object.fromEntries([...NPCS,POTINS].map(n=>[n.id,n]));
/* =================== MOTEUR DU JEU =================== */
let editFam=null;
const me=()=>editFam?editFam.saved:state;
const NPC_LOOK={ines:{sexe:'f',face:'ovale',skin:'#d4975f',eyes:'doux',iris:'#7a4a26',brows:'epais',nose:'rond',mouth:'remontante',cheeks:'aucune',freckles:'legeres',hair:'longondule',hairColor:'#1c1412',edges:'aucun',top:'tshirt',topColor:'#f4f1ea',bottom:'droit',bottomColor:'#86a6cc',dress:'portefeuille',dressColor:'#d93b5e',jacket:'aucune',hat:'aucun',bag:'tote',bagColor:'#ece2cc',necklace:'chaine',earrings:'anneaux',glasses:'aucune',shoes:'basses',shoesColor:'#f4f1ea',bgPattern:'uni',bgColor:'#fde8d4',adj:{eyesY:0,eyesX:0,eyesS:1,browsY:0,browsX:0,mouthY:0,mouthS:1,noseY:0,noseS:1}},
 kylian:{sexe:'m',face:'allonge',skin:'#9a6140',eyes:'nets',iris:'#7a4a26',brows:'epais',nose:'pointu',mouth:'asymetrique',cheeks:'aucune',freckles:'aucune',barbe:'aucune',hair:'degrade',hairColor:'#1c1412',edges:'aucun',top:'capuche',topColor:'#3d6fd8',bottom:'jogging',bottomColor:'#9aa3ad',dress:'aucune',jacket:'aucune',hat:'aucun',bag:'aucun',necklace:'chaine',earrings:'aucune',glasses:'aucune',shoes:'running',shoesColor:'#f4f1ea',bgPattern:'uni',bgColor:'#e9eef6',adj:{eyesY:0,eyesX:0,eyesS:1.1,browsY:0,browsX:0,mouthY:3,mouthS:1,noseY:6,noseS:1}},
 maelle:{sexe:'f',face:'ovale',skin:'#f6cfae',eyes:'doux',iris:'#3d7f9a',brows:'epais',nose:'rond',mouth:'remontante',cheeks:'rose',freckles:'legeres',hair:'carreondule',hairColor:'#e3c27a',edges:'aucun',top:'chemise',topColor:'#f4f1ea',bottom:'jupe',bottomColor:'#1f2127',dress:'aucune',jacket:'aucune',hat:'aucun',bag:'aucun',necklace:'perles',earrings:'perles',glasses:'aucune',shoes:'basses',shoesColor:'#f4f1ea',bgPattern:'uni',bgColor:'#fde8d4',adj:{eyesY:0,eyesX:0,eyesS:1,browsY:0,browsX:0,mouthY:0,mouthS:1,noseY:0,noseS:1}},
 noah:{sexe:'m',face:'anguleux',skin:'#eab48a',eyes:'doux',iris:'#7a4a26',brows:'epais',nose:'petit',mouth:'remontante',cheeks:'aucune',freckles:'aucune',barbe:'aucune',hair:'raiecote',hairColor:'#8a5a35',edges:'aucun',top:'tshirt',topColor:'#ece2cc',bottom:'cordon',bottomColor:'#1f2127',dress:'aucune',jacket:'aucune',hat:'aucun',bag:'aucun',necklace:'chaine',earrings:'aucune',glasses:'aucune',shoes:'sabots',shoesColor:'#c49a6c',bgPattern:'uni',bgColor:'#e9eef6',adj:{eyesY:0,eyesX:0,eyesS:1.1,browsY:-2,browsX:0,mouthY:0,mouthS:1,noseY:0,noseS:1}},
 jade:{sexe:'f',face:'ovale',skin:'#f6cfae',eyes:'doux',iris:'#9a7a3a',brows:'epais',nose:'petit',mouth:'fermee',cheeks:'rose',freckles:'legeres',hair:'carreondule',hairColor:'#c08a4e',edges:'aucun',top:'chemise',topColor:'#c49a6c',bottom:'cordon',bottomColor:'#1f2127',dress:'aucune',jacket:'aucune',hat:'aucun',bag:'aucun',necklace:'rasdecou',earrings:'perles',glasses:'carrees',shoes:'retro',shoesColor:'#f4f1ea',bgPattern:'uni',bgColor:'#fde8d4',adj:{eyesY:0,eyesX:0,eyesS:1,browsY:0,browsX:0,mouthY:0,mouthS:1,noseY:0,noseS:1}},
 sacha:{sexe:'m',face:'coeur',skin:'#eab48a',eyes:'doux',iris:'#3d7f9a',brows:'epais',nose:'rond',mouth:'asymetrique',cheeks:'aucune',freckles:'aucune',barbe:'aucune',hair:'raiecote',hairColor:'#c08a4e',edges:'aucun',top:'colroule',topColor:'#1f2127',bottom:'large',bottomColor:'#9aa0a6',dress:'aucune',jacket:'aucune',hat:'aucun',bag:'aucun',necklace:'chaine',earrings:'aucune',glasses:'aucune',shoes:'basses',shoesColor:'#f4f1ea',bgPattern:'uni',bgColor:'#e9eef6',adj:{eyesY:0,eyesX:0,eyesS:1.1,browsY:0,browsX:0,mouthY:0,mouthS:1,noseY:0,noseS:1}},
 kenza:{sexe:'f',face:'ovale',skin:'#eab48a',eyes:'doux',iris:'#7a4a26',brows:'epais',nose:'rond',mouth:'remontante',cheeks:'rose',freckles:'legeres',hair:'bcarre',hairColor:'#6e2a24',edges:'aucun',top:'debardeur',topColor:'#f4f1ea',bottom:'large',bottomColor:'#5b7fb5',dress:'aucune',jacket:'aucune',hat:'aucun',bag:'aucun',necklace:'aucun',earrings:'aucune',glasses:'aucune',shoes:'basses',shoesColor:'#f4f1ea',bgPattern:'uni',bgColor:'#fde8d4',adj:{eyesY:0,eyesX:0,eyesS:1,browsY:0,browsX:0,mouthY:0,mouthS:1,noseY:0,noseS:1}},
 eva:{sexe:'f',face:'ovale',skin:'#d4975f',eyes:'doux',iris:'#3d7f9a',brows:'epais',nose:'rond',mouth:'remontante',cheeks:'rose',freckles:'legeres',hair:'bcarre',hairColor:'#1c1412',edges:'aucun',top:'debardeur',topColor:'#ece2cc',bottom:'jupe',bottomColor:'#1f2127',dress:'aucune',jacket:'aucune',hat:'aucun',bag:'aucun',necklace:'aucun',earrings:'aucune',glasses:'aucune',shoes:'basses',shoesColor:'#f4f1ea',bgPattern:'uni',bgColor:'#efe3fb',adj:{eyesY:0,eyesX:0,eyesS:1,browsY:0,browsX:0,mouthY:0,mouthS:1,noseY:0,noseS:1}},
 noemie:{sexe:'f',face:'ovale',skin:'#80502f',eyes:'doux',iris:'#4a2a17',brows:'epais',nose:'rond',mouth:'remontante',cheeks:'rose',freckles:'legeres',hair:'bcollees',hairColor:'#1c1412',edges:'aucun',top:'debardeur',topColor:'#26314f',bottom:'cycliste',bottomColor:'#1f2127',dress:'aucune',jacket:'aucune',hat:'aucun',bag:'aucun',necklace:'chaine',earrings:'anneaux',glasses:'aucune',shoes:'basses',shoesColor:'#1f2127',bgPattern:'degrade',bgColor:'#c8b8a6',adj:{eyesY:0,eyesX:0,eyesS:1,browsY:0,browsX:0,mouthY:0,mouthS:1,noseY:0,noseS:1}},
 jessica:{sexe:'f',face:'ovale',skin:'#eab48a',eyes:'doux',iris:'#3d7f9a',brows:'epais',nose:'rond',mouth:'remontante',cheeks:'rose',freckles:'aucune',hair:'barrette',hairColor:'#6e2a24',edges:'aucun',top:'tshirt',topColor:'#f4f1ea',bottom:'droit',bottomColor:'#86a6cc',dress:'bretelles',dressColor:'#f4f1ea',jacket:'aucune',hat:'aucun',bag:'aucun',necklace:'perles',earrings:'perles',glasses:'carrees',shoes:'basses',shoesColor:'#f4f1ea',bgPattern:'uni',bgColor:'#fde8d4',adj:{eyesY:0,eyesX:0,eyesS:1,browsY:0,browsX:0,mouthY:0,mouthS:1,noseY:0,noseS:1}},
 meisha:{sexe:'f',face:'ovale',skin:'#9a6140',eyes:'doux',iris:'#4a2a17',brows:'epais',nose:'rond',mouth:'remontante',cheeks:'rose',freckles:'legeres',hair:'mechesdevant',hairColor:'#1c1412',edges:'aucun',top:'debardeur',topColor:'#f4f1ea',bottom:'jupejean',bottomColor:'#1f2127',dress:'aucune',jacket:'aucune',hat:'aucun',bag:'aucun',necklace:'aucun',earrings:'aucune',glasses:'aucune',shoes:'basses',shoesColor:'#f4f1ea',bgPattern:'uni',bgColor:'#fde8d4',adj:{eyesY:0,eyesX:0,eyesS:1,browsY:0,browsX:0,mouthY:0,mouthS:1,noseY:0,noseS:1}},
 anais:{sexe:'f',face:'ovale',skin:'#9a6140',eyes:'doux',iris:'#9a7a3a',brows:'epais',nose:'rond',mouth:'remontante',cheeks:'rose',freckles:'legeres',hair:'miboucle',hairColor:'#1c1412',edges:'aucun',top:'crop',topColor:'#1f2127',bottom:'large',bottomColor:'#9aa0a6',dress:'aucune',jacket:'aucune',hat:'bob',hatColor:'#ece2cc',bag:'aucun',necklace:'rasdecou',earrings:'perles',glasses:'aucune',shoes:'retro',shoesColor:'#f4f1ea',bgPattern:'uni',bgColor:'#fde8d4',adj:{eyesY:0,eyesX:0,eyesS:1,browsY:0,browsX:0,mouthY:0,mouthS:1,noseY:0,noseS:1}},
 potins:{bottom:'droit',shoes:'basses'}};
NPC_LOOK.potins={hair:'carreondule'};
[...NPCS,POTINS].forEach(n=>{n.av=Object.assign(normalize(n.av),{dress:'aucune'},NPC_LOOK[n.id]||{})});
let avUid=0;
const uid=()=>'g'+(avUid++)+'_';
const GKEY='atelier-partie-v3', RECHARGE=10*60*1000, BONUS_MAX=5;
const pickR=a=>a[Math.floor(Math.random()*a.length)];
const rnd=(a,b)=>a+Math.random()*(b-a);
const clamp=(v,a,b)=>Math.max(a,Math.min(b,v));
function hash(s){let h=2166136261;for(const c of String(s))h=Math.imul(h^c.charCodeAt(0),16777619);return h>>>0}
const esc=t=>String(t).replace(/[&<>"]/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;'}[c]));
const fmtText=t=>esc(t).replace(/(@[\w.]+)/g,'<span class="mention">$1</span>').replace(/\n/g,'<br>');
const fmtN=n=>n>=1000?(n/1000).toFixed(1).replace('.0','').replace('.',',')+' k':String(n);
const fmtT=m=>String(Math.floor(m/60)%24).padStart(2,'0')+':'+String(m%60).padStart(2,'0');
const fmtG=v=>v==null?'–':(Math.round(v*10)/10).toFixed(1).replace('.',',');

/* ---------- fiches des camarades ---------- */
const FICHES={
 ines:{g:'f',o:'hetero',age:17,soc:.8,stud:.5,rom:.7,hum:.6,
  passe:"Arrivée de Martinique en seconde, elle a dû se refaire des amis et garde la peur d'être mise de côté.",
  famille:"Vit avec sa mère infirmière et son petit frère Enzo, 9 ans, dont elle s'occupe souvent.",
  qualites:"Loyale, à l'écoute, généreuse",defauts:"Trop gentille, n'ose pas dire non, susceptible",
  peurs:"Être abandonnée par ses amis, décevoir sa mère",passions:"Danse dancehall, maquillage, séries coréennes",
  parle:"Douce, beaucoup d'emojis 🥺✨, dit souvent « mon cœur »",
  relations:"Meilleure amie de Maëlle depuis la seconde, admire beaucoup Sacha"},
 kylian:{g:'m',o:'hetero',age:17,soc:.9,stud:.2,rom:.5,hum:.9,
  passe:"Star de l'équipe de foot du collège, il a raté l'écrit de français l'an dernier et le cache à tout le monde.",
  famille:"Fils unique, père pêcheur à Saint-François, mère commerçante. Très proche de son grand-père.",
  qualites:"Drôle, courageux, protecteur",defauts:"Vantard, impulsif, mauvais perdant",
  peurs:"Paraître faible, finir sans diplôme",passions:"Foot, pêche avec son père, jeux vidéo",
  parle:"Direct, vannes, abréviations (wsh, frr, tkt)",
  relations:"En couple avec Eva, qu'il adore et affiche partout sur Insta ; meilleur pote de Noah, rivalité avec Sacha, en froid avec Jade ; a dragué Kenza avant Eva"},
 maelle:{g:'f',o:'bi',age:17,soc:1,stud:.4,rom:.6,hum:.5,
  passe:"Capitaine des pom-pom girls, populaire depuis toujours, elle a vécu le divorce difficile de ses parents l'an dernier.",
  famille:"Alterne entre la maison de sa mère au Gosier et l'appartement de son père à Pointe-à-Pitre. Une grande sœur étudiante à Paris.",
  qualites:"Charismatique, organisée, ambitieuse",defauts:"Jalouse, manipulatrice quand elle se sent menacée, adore le drama",
  peurs:"Perdre sa popularité, se retrouver seule le week-end",passions:"Danse, réseaux sociaux, organiser des soirées",
  parle:"Sûre d'elle, ironique, « genre », « littéralement », emojis 💅🙄",
  relations:"Meilleure amie d'Inès, rivale de Jade, a un faible secret pour Noah"},
 noah:{g:'m',o:'hetero',age:17,soc:.6,stud:.6,rom:.4,hum:.7,
  passe:"Ancien élève timide devenu meneur de l'équipe de basket après une grosse poussée de croissance.",
  famille:"Grande famille : parents professeurs, deux sœurs aînées et une petite sœur. La maison est toujours pleine.",
  qualites:"Gentil, patient, travailleur",defauts:"Indécis, tête en l'air, oublie tout",
  peurs:"Décevoir ses parents, parler en public",passions:"Basket, mangas, cuisine avec sa grand-mère",
  parle:"Calme, phrases courtes, dit « frère », rit avec « ptdr », très poli avec les adultes",
  relations:"Meilleur ami de Kylian, apprécie Jade en secret"},
 jade:{g:'f',o:'bi',age:16,soc:.3,stud:1,rom:.4,hum:.4,
  passe:"Première de la classe depuis la sixième, elle a sauté une classe et s'est toujours sentie un peu à part.",
  famille:"Vit avec sa grand-mère à Sainte-Anne depuis que ses parents travaillent en métropole.",
  qualites:"Intelligente, honnête, créative",defauts:"Froide au premier abord, perfectionniste, rancunière",
  peurs:"L'échec, qu'on se moque d'elle, l'océan profond",passions:"Lecture, poèmes, astronomie, dessin",
  parle:"Phrases soignées, jamais de majuscules en message, humour pince-sans-rire, rarement d'emojis",
  relations:"Rivale de Maëlle, s'entend bien avec Sacha, intriguée par Noah"},
 kenza:{g:'f',o:'hetero',age:17,soc:1,stud:.5,rom:.9,hum:.6,
  passe:"Arrivée au lycée en première, elle a fait tourner toutes les têtes dès le premier jour. Presque tous les garçons ont tenté leur chance, et elle a brisé quelques cœurs sans toujours le vouloir. À 15 ans, elle a posé pour une boutique de mode de Jarry.",
  famille:"Vit à Baie-Mahault avec son père avocat et sa mère qui tient un institut de beauté. Un grand frère en BTS, très protecteur, qui surveille de près les garçons qui l'approchent.",
  qualites:"Charismatique, sûre d'elle, drôle, très fidèle avec ses amies",defauts:"Aime être admirée, joue avec les sentiments des garçons, un peu superficielle en apparence, supporte mal la critique",
  peurs:"Qu'on ne l'aime que pour son physique, tomber vraiment amoureuse et souffrir, perdre sa place chez les populaires",passions:"Danse, mode et shopping, photos pour Insta, maquillage, R&B",
  parle:"Assurée et taquine, dit « bébé », « trop mignon », « jsp », emojis 😘💋✨, laisse parfois ses messages en vu exprès",
  relations:"Meilleure amie de Meisha depuis la maternelle ; membre des populaires avec Maëlle et Inès ; Maëlle la voit comme une rivale pour la place de reine du lycée ; Kylian l'a draguée sans succès avant de se mettre avec Eva ; Noah perd ses moyens devant elle"},
 eva:{g:'f',o:'hetero',age:17,soc:.6,stud:.7,rom:.8,hum:.6,
  passe:"Elle dessine depuis toute petite et a gagné l'an dernier le concours d'affiches de la région. Très timide en seconde, elle s'est ouverte en rencontrant Kylian, avec qui elle sort depuis l'été dernier.",
  famille:"Vit à Petit-Bourg avec sa mère, professeure d'arts plastiques, et son beau-père menuisier. Une petite sœur de 8 ans, Lou, qui veut tout faire comme elle.",
  qualites:"Gentille, douce, créative, toujours prête à aider",defauts:"Naïve, évite les disputes, doute beaucoup d'elle, un peu jalouse quand on tourne autour de Kylian",
  peurs:"Que Kylian la quitte pour une autre, que ses dessins ne valent rien, décevoir sa mère",passions:"Dessin, peinture, carnets de croquis, couchers de soleil, musique douce",
  parle:"Douce et polie, « oh c'est trop mignon », s'excuse souvent, emojis 🎨🌸💕",
  relations:"En couple avec Kylian depuis l'été ; amie de Jade et Sacha chez les artistes ; se méfie de Kenza, que Kylian a draguée avant elle"},
 noemie:{g:'f',o:'hetero',age:17,soc:.8,stud:.4,rom:.4,hum:.8,spo:1,
  passe:"Seule fille de l'équipe de foot du lycée depuis la seconde. Au début, certains garçons riaient ; elle a marqué un triplé dès son premier match et plus personne n'a rien dit. Elle rêve d'intégrer un centre de formation féminin en métropole.",
  famille:"Vit à Morne-à-l'Eau avec sa mère aide-soignante et ses trois grands frères, tous footballeurs. C'est avec eux qu'elle a appris à jouer dans la cour, pieds nus.",
  qualites:"Déterminée, franche, loyale, meneuse sur le terrain, très drôle",defauts:"Tête de mule, s'énerve vite, mauvaise perdante, cache ses émotions derrière des blagues",
  peurs:"Qu'on ne la prenne pas au sérieux parce qu'elle est une fille, se blesser avant les détections, quitter sa famille pour la métropole",passions:"Foot, matchs de l'équipe de France féminine, dancehall, cuisine créole de sa mère",
  parle:"Directe, chambreuse, « wesh », « vas-y », « on est ensemble », emojis ⚽😤😂",
  relations:"Coéquipière et amie de Kylian et Noah, qui la respectent sur le terrain ; meilleure amie d'Anaïs, avec qui elle s'entraîne ; Maëlle et Kenza la trouvent trop « brute »"},
 jessica:{g:'f',o:'hetero',age:17,soc:.5,stud:1,rom:.5,hum:.6,
  passe:"Major de sa promo depuis le collège, elle vise une prépa scientifique. L'an dernier, elle a commencé à donner des cours particuliers aux élèves en difficulté, le lundi et le mercredi soir, et elle a fait remonter la moyenne de toute la classe.",
  famille:"Vit aux Abymes avec ses parents, tous deux pharmaciens, et son petit frère Hugo, 12 ans, à qui elle fait réviser chaque soir.",
  qualites:"Brillante, patiente, pédagogue, organisée, bienveillante",defauts:"Perfectionniste, stresse pour tout, a du mal à dire non, un peu donneuse de leçons",
  peurs:"Rater le bac ou sa prépa, décevoir ses parents, qu'on ne l'apprécie que pour son aide",passions:"Sciences, énigmes et sudokus, romans policiers, pâtisserie",
  parle:"Claire et encourageante, « tu vas y arriver », « on reprend ensemble », adore les explications, emojis 📚✏️😊",
  relations:"Respecte Jade, sa rivale amicale pour la première place ; aide souvent Kylian et Noémie en maths ; Maëlle la trouve « trop scolaire »"},
 meisha:{g:'f',o:'hetero',age:17,soc:.95,stud:.55,rom:.7,hum:.8,
  passe:"Meilleure amie de Kenza depuis la maternelle, elle est toujours à ses côtés. Juste après Kenza, c'est la fille la plus convoitée du lycée, ce qui l'amuse plus qu'autre chose. Au journal du lycée, elle tient la rubrique mode, la plus lue de chaque numéro.",
  famille:"Vit à Baie-Mahault, dans la même rue que Kenza, avec sa mère qui tient une boutique de prêt-à-porter à Jarry et sa grand-mère. Son père travaille en Martinique et rentre un week-end sur deux.",
  qualites:"Drôle, fidèle, généreuse, a l'œil pour la mode, sait écouter",defauts:"Dépensière, un peu jalouse quand on lui « vole » Kenza, adore les potins, vit dans l'ombre de Kenza et le cache",
  peurs:"Perdre Kenza comme meilleure amie, n'être que « la copine de Kenza », manquer d'argent pour suivre les tendances",passions:"Shopping (surtout à Jarry), mode, écrire la rubrique mode du journal, TikTok, sorties entre filles",
  parle:"Pétillante, « trop beau », « on va shopper », « jsuis morte 😂 », emojis 🛍️💅😂, appelle Kenza « ma jumelle »",
  relations:"Meilleure amie de Kenza, sa « jumelle » ; dans le groupe des populaires avec Maëlle et Inès ; écrit au journal avec Jade et Jessica ; plusieurs garçons ont un faible pour elle"},
 anais:{g:'f',o:'hetero',age:17,soc:.9,stud:.5,rom:.5,hum:1,spo:1,
  passe:"Capitaine de l'équipe de handball du lycée, elle s'est blessée au genou l'an dernier et a tout fait pour revenir sur le terrain, toujours le sourire aux lèvres.",
  famille:"Vit à Sainte-Rose avec son père entraîneur de foot, sa mère kiné et ses deux petits frères jumeaux qui ne tiennent pas en place.",
  qualites:"Joviale, pleine d'énergie, généreuse, super esprit d'équipe",defauts:"Têtue, très compétitive, parle fort, ne tient jamais en place",
  peurs:"Se blesser à nouveau, devoir arrêter le sport, laisser tomber son équipe",passions:"Handball, footing au lever du soleil sur la plage, danse, playlists de motivation",
  parle:"Toujours de bonne humeur, plein d'exclamations, « allez ! », « trop fort », emojis 💪😂🔥, rigole beaucoup et motive tout le monde",
  relations:"Partenaire d'entraînement de Kylian et Noah, s'entend bien avec tout le monde, taquine gentiment Jade pour la sortir de ses livres"},
 sacha:{g:'m',o:'homo',age:17,soc:.7,stud:.3,rom:.8,hum:.7,
  passe:"Musicien autodidacte, il publie ses sons en ligne et rêve d'en vivre malgré l'avis de son père.",
  famille:"Père chef d'entreprise exigeant, mère chanteuse de gwo ka, un demi-frère plus âgé.",
  qualites:"Créatif, charmeur, ouvert",defauts:"Rêveur, toujours en retard, évite les conflits",
  peurs:"Que son père ait raison, rester un inconnu",passions:"Musique (zouk, gwo ka, rap), guitare, skate",
  parle:"Détendu, un peu poète, dit « gros » et « vibe », références musicales",
  relations:"Ami d'Inès (qui a un faible pour lui), très proche de Jade, rivalité amicale avec Kylian"}
};
const SEXC={f:'Fille',m:'Garçon',nb:'Non-binaire'},SEXL={f:'une fille',m:'un garçon',nb:'une personne non-binaire'};
/* accord : transforme « content·e », « amoureux·se », « lycéen·ne »… selon le genre (f, m ; nb garde l'écriture inclusive) */
function gtxt(str,sx){if(!str||(sx!=='f'&&sx!=='m'))return str;return String(str).replace(/([A-Za-zÀ-ÿ]+)·(rice|ère|e|ne|se|le)\b/g,(_,w,x)=>sx==='m'?w:x==='ère'?w.replace(/er$/,'ère'):x==='rice'?w.replace(/eur$/,'rice'):x==='se'?w.replace(/x$/,'se'):w+x)}
function sexOf(id){if(id==='me')return me().sexe;if(typeof isFam==='function'&&isFam(id)){const f=famById(id);return f&&/Mère|sœur|Tante|mère|Sœur/.test(f.role)?'f':'m'}if(FICHES[id])return FICHES[id].g;return 'nb'}
const P=t=>gtxt(t,me().sexe),S=(id,t)=>gtxt(t,sexOf(id));
const profSex=n=>/^(Mme|Mrs|Sra|Mlle)/.test(n)?'f':'m';
/* {p:…} = accord avec le joueur ou la joueuse ; le reste s'accorde avec la personne qui parle */
function genderize(t,speaker){return String(t).replace(/\{p:([^}]+)\}/g,(_,x)=>P(x)).replace(/\{s:([^}]+)\}/g,(_,x)=>S(speaker,x)).replace(/[A-Za-zÀ-ÿ]+·(rice|ère|e|ne|se|le)\b/g,w=>S(speaker,w))}
const oriLabel=(o,g)=>{const e=g==='f'?'le':g==='m'?'':'·le';return o==='homo'?(g==='f'?'Lesbienne':g==='m'?'Gay':'Homosexuel·le'):o==='hetero'?'Hétérosexuel'+e:o==='bi'?'Bisexuel'+e:o==='pan'?'Pansexuel'+e:'Asexuel'+e};
const npcLikesMe=id=>isNpc(id)&&attracted(FICHES[id].o,FICHES[id].g,me().sexe);
const iLike=id=>isNpc(id)&&attracted(me().orient,me().sexe,FICHES[id].g);
const objOk=o=>me().orient==='ace'?!o.rom:!o.ace;
const LINKS0={'ines>maelle':[85,0],'maelle>ines':[85,0],'ines>sacha':[60,40],'sacha>ines':[60,15],'kylian>noah':[88,0],'noah>kylian':[88,0],
 'kylian>sacha':[35,0],'sacha>kylian':[40,0],'jade>kylian':[25,0],'kylian>jade':[25,0],'jade>maelle':[15,0],'maelle>jade':[15,0],
 'anais>kylian':[72,0],'kylian>anais':[72,0],'anais>noah':[70,20],'noah>anais':[66,0],'anais>jade':[55,0],'jade>anais':[48,0],
 'anais>ines':[62,0],'ines>anais':[60,0],'anais>maelle':[50,0],'maelle>anais':[45,0],'anais>sacha':[58,0],'sacha>anais':[58,0],
 'maelle>noah':[55,50],'noah>maelle':[55,10],'noah>jade':[55,45],'jade>noah':[50,30],'jade>sacha':[65,10],'sacha>jade':[65,10],
 'kenza>ines':[75,0],'ines>kenza':[75,0],'kenza>maelle':[60,0],'maelle>kenza':[50,0],'kylian>kenza':[55,20],'kenza>kylian':[45,15],'noah>kenza':[45,35],'kenza>noah':[45,10],
 'sacha>kenza':[55,0],'kenza>sacha':[60,0],'jade>kenza':[15,0],'kenza>jade':[25,0],'anais>kenza':[50,0],'kenza>anais':[50,0],
 'eva>kylian':[85,90],'kylian>eva':[85,90],'eva>jade':[65,0],'jade>eva':[60,0],'eva>sacha':[65,0],'sacha>eva':[65,0],'eva>kenza':[30,0],'kenza>eva':[35,0],
 'eva>ines':[55,0],'ines>eva':[55,0],'eva>maelle':[40,0],'maelle>eva':[35,0],'eva>noah':[55,0],'noah>eva':[55,0],'eva>anais':[50,0],'anais>eva':[55,0],
 'noemie>anais':[85,0],'anais>noemie':[85,0],'noemie>kylian':[70,0],'kylian>noemie':[68,0],'noemie>noah':[72,15],'noah>noemie':[70,0],'noemie>maelle':[30,0],'maelle>noemie':[25,0],
 'noemie>kenza':[35,0],'kenza>noemie':[30,0],'noemie>ines':[50,0],'ines>noemie':[50,0],'noemie>jade':[45,0],'jade>noemie':[45,0],'noemie>sacha':[55,0],'sacha>noemie':[55,0],'noemie>eva':[55,0],'eva>noemie':[55,0],
 'jessica>jade':[65,0],'jade>jessica':[60,0],'jessica>kylian':[50,0],'kylian>jessica':[58,0],'jessica>noemie':[55,0],'noemie>jessica':[60,0],'jessica>maelle':[35,0],'maelle>jessica':[30,0],
 'jessica>noah':[55,10],'noah>jessica':[58,0],'jessica>ines':[55,0],'ines>jessica':[58,0],'jessica>sacha':[50,0],'sacha>jessica':[50,0],'jessica>eva':[60,0],'eva>jessica':[60,0],'jessica>anais':[50,0],'anais>jessica':[52,0],'jessica>kenza':[35,0],'kenza>jessica':[35,0],
 'meisha>kenza':[92,0],'kenza>meisha':[92,0],'meisha>ines':[70,0],'ines>meisha':[70,0],'meisha>maelle':[60,0],'maelle>meisha':[55,0],'meisha>jade':[35,0],'jade>meisha':[30,0],'meisha>jessica':[45,0],'jessica>meisha':[45,0],
 'noah>meisha':[50,45],'meisha>noah':[50,15],'kylian>meisha':[50,15],'meisha>kylian':[50,0],'sacha>meisha':[60,0],'meisha>sacha':[65,0],'meisha>eva':[40,0],'eva>meisha':[45,0],'meisha>noemie':[35,0],'noemie>meisha':[35,0],'meisha>anais':[45,0],'anais>meisha':[45,0]};
const VOICE={
 ines:{start:["Coucou mon cœur ✨ ça va ?","Tu fais quoi ? 🥺","T'as vu le dernier épisode ?? j'en peux plus"],happy:["Aww t'es trop chou 🥺💕","Mdr j'adore 😂✨","Ça me fait trop plaisir"],hurt:["Ah… ok 😔","Ça m'a un peu blessée là","Pourquoi tu dis ça ?"],neutral:["Ah ouais ?","Hmm je vois ✨","Et toi alors ?"]},
 kylian:{start:["wsh ça va ?","frr t'as fait les maths ?","t'es chaud pour un foot demain ?"],happy:["mdrr t'es un bon toi","tkt on est ensemble","ahah validé"],hurt:["wsh calme-toi","t'es sérieux là ?","ok vas-y laisse"],neutral:["ah ouais","grave","tkt"]},
 maelle:{start:["Genre t'as vu ce que Jade a posté ? 🙄","Coucou ! Tu viens à ma soirée ou quoi ? 💅","J'ai un potin de ouf, littéralement"],happy:["Ok t'es {p:validé·e} 💅","Littéralement trop bien","J'adore, on se capte"],hurt:["Wow. D'accord. 🙄","Tu te prends pour qui là ?","Pas besoin d'être comme ça"],neutral:["Genre ?","Mouais","Ok et ?"]},
 noah:{start:["Salut frère, ça va ?","T'as compris l'exo de physique ?","Tu fais quoi ce week-end ?"],happy:["ptdr t'es trop","Merci c'est gentil","Grave, on fait ça"],hurt:["Ah… ok","Je pensais pas que tu dirais ça","C'est pas cool"],neutral:["Ah ok","Ouais je vois","Peut-être"]},
 jade:{start:["tu as lu le chapitre pour demain ?","il y a des étoiles filantes ce soir","question sérieuse : thé ou café"],happy:["c'est gentil. vraiment.","ok tu m'as fait sourire","je retiens ça"],hurt:["d'accord. noté.","c'était inutile","je pensais mieux de toi"],neutral:["intéressant","peut-être","développe"]},
 kenza:{start:["Coucou toi 😘 tu fais quoi ?","T'as vu ma nouvelle photo ? Dis-moi la vérité ✨","Bébé t'es où ? On se capte à la récré 💋"],happy:["Trop mignon 🥰","T'es {p:adorable} toi, je garde 😘","Haha j'adore ✨"],hurt:["Ok… je m'attendais pas à ça de toi 😒","Wow. Tu peux le dire autrement ?","Vu. 💅"],neutral:["Jsp ✨","Ah ouais ?","Mmh… et ?"]},
 eva:{start:["Coucou 🌸 tu vas bien ?","Regarde mon dernier croquis, tu en penses quoi ? 🎨","Tu viens à l'atelier d'arts plastiques ce soir ? 💕"],happy:["Oh c'est trop mignon 🥹💕","Merci, ça me touche vraiment 🌸","Hihi t'es {p:adorable} 🎨"],hurt:["Oh… d'accord 😔","Ça m'a un peu blessée…","Pardon si j'ai dit quelque chose de mal"],neutral:["Ah oui ?","Je vois 🌸","Et toi ?"]},
 noemie:{start:["Wesh ! T'as vu le match d'hier ? ⚽","Entraînement ce soir, tu viens nous voir ?","Vas-y raconte ta journée 😂"],happy:["Ahah t'es {p:un·e} vrai·e toi 😂","On est ensemble 💪","Grave, validé ⚽"],hurt:["Wesh, ça c'était pas nécessaire 😤","Ok… je retiens","Vas-y laisse tomber"],neutral:["Ah ouais","Vas-y","Ok et ?"]},
 jessica:{start:["Coucou 😊 tu as compris le cours d'aujourd'hui ?","N'oublie pas : cours particulier lundi et mercredi à 17 h 📚","Tu révises quoi en ce moment ?"],happy:["Oh merci, ça me fait vraiment plaisir 😊","Tu vois que tu peux y arriver ✏️","Trop bien, je suis {p:fier·ère} de toi"],hurt:["Ah… ok, je ne pensais pas que tu le voyais comme ça 😕","Ça m'a un peu blessée","Je voulais juste aider…"],neutral:["D'accord 😊","Je vois","Et toi ?"]},
 meisha:{start:["Coucou ! Shopping à Jarry samedi, tu viens ? 🛍️","T'as vu la tenue de Kenza aujourd'hui ? Trop belle 😍","Jsuis morte, raconte ta journée 😂"],happy:["Trop mignon 🥹💅","Jsuis morte 😂 t'es {p:trop drôle}","Validé, on se capte 🛍️"],hurt:["Euh… pardon ? 😒","Ok, ça c'était pas cool","Je vais faire comme si j'avais rien lu 🙄"],neutral:["Ah ouais ?","Mmh","Ok 💅"]},
 anais:{start:["Hey ! Footing demain matin à la plage, t'es {p:chaud·e} ? 🏃‍♀️","Allez, raconte-moi ta journée 😄","Match de hand samedi, tu viens m'encourager ? 🔥"],happy:["Trop fort 😂🔥","T'es {p:génial·e} toi 💪","Haha j'adore, on fait une super équipe !"],hurt:["Aïe… ça pique un peu là 😕","Hé, doucement !","Ok… je vais courir pour me calmer"],neutral:["Ah ouais ?","Carrément !","Et après ?"]},
 sacha:{start:["Yo, j'ai un nouveau son, tu veux l'écouter ? 🎧","Grosse vibe aujourd'hui","T'es où là ?"],happy:["Gros t'es une vibe à toi tout seul","Ça me touche ça","Ahah j'kiffe"],hurt:["Pas cool gros","Ok… ça casse la vibe","Je préfère pas répondre à ça"],neutral:["Ah ouais","Tranquille","On verra"]},
 fam:{start:["Tout se passe bien au lycée ?","N'oublie pas de ranger ta chambre","On mange à 19h30 ce soir"],happy:["Je suis fier·ère de toi ❤️","Haha tu me fais rire","Ça me fait plaisir de t'entendre"],hurt:["On en reparle à la maison.","Ce ton, non merci.","Je ne t'ai pas élevé·e comme ça."],neutral:["D'accord.","Ok mon cœur.","On verra ça ce soir."]}
};
const CONFESS={ines:"Je peux te dire un truc ? 🥺 Je crois que je craque pour toi… vraiment.",kylian:"frr je vais pas tourner autour du pot… tu me plais. voilà c'est dit 😅",maelle:"Bon. Littéralement je pense à toi tout le temps. Tu me plais 💅❤️",noah:"Je sais pas trop comment le dire… mais je t'aime bien. Plus qu'un ami.",jade:"je préfère être honnête : je crois que je tiens à toi plus que je ne le devrais.",sacha:"Gros… t'es dans toutes mes chansons en ce moment. Tu me plais ❤️",anais:"Bon, je suis nulle pour tourner autour du pot alors je fonce : tu me plais 🙈 voilà, c'est dit !",meisha:"Promets-moi de pas le dire à Kenza tout de suite… mais tu me plais. Vraiment 🙈💕",jessica:"J'ai résolu des centaines d'équations, mais celle-là je n'arrive pas à la résoudre : je crois que tu me plais 🙈📚",noemie:"Bon, je suis pas douée pour ça… mais tu me plais. Voilà. Rigole pas 😤❤️",eva:"Je… je suis désolée, je ne devrais pas ressentir ça alors que je suis avec Kylian. Mais tu me plais 🥺💕",kenza:"Tout le monde croit que je joue avec les gens… mais avec toi c'est différent. Tu me plais vraiment 💋"};

/* ---------- emploi du temps ---------- */
const SUBJ={maths:'Maths',francais:'Français',histoire:'Histoire-Géo',svt:'SVT',anglais:'Anglais',physique:'Physique-Chimie',philo:'Philosophie',eps:'EPS',espagnol:'Espagnol'};
const PROFS={maths:['M. Lancelot',3],francais:['Mme Bélise',2],histoire:['M. Ducos',1],svt:['Mme Ramassamy',2],anglais:['Mrs Thomas',1],physique:['M. Jean-Baptiste',3],philo:['Mme Florent',2],eps:['M. Bourgeois',1],espagnol:['Sra Morales',2]};
const TT=[['maths','francais','histoire','svt','anglais'],['physique','philo','maths','eps','espagnol'],['francais','anglais','svt','histoire','maths'],['philo','maths','physique','espagnol','francais'],['svt','histoire','anglais','eps','philo']];
const DAYS=['Lundi','Mardi','Mercredi','Jeudi','Vendredi','Samedi','Dimanche'];
const SLOTS=[[0,420,'nuit'],[420,480,'matin'],[480,540,'cours',0],[540,600,'cours',1],[600,615,'recre'],[615,720,'cours',2],[720,840,'dej'],[840,900,'cours',3],[900,915,'recre'],[915,1020,'cours',4],[1020,1320,'soir'],[1320,1440,'nuit']];
const PLABEL={nuit:'Nuit',matin:'Avant les cours',cours:'Cours',recre:'Récréation',dej:'Pause déjeuner',soir:'Temps libre',weekend:'Week-end',eval:'Évaluation commune',bac:'Épreuves du bac'};
/* ---------- année de terminale : évaluations, trimestres, bac ---------- */
/* calendrier réel : du mardi 1er septembre 2026 au mercredi 30 juin 2027, vacances et jours fériés de Guadeloupe.
   G.day = jour du calendrier (1 = 1er sept.) ; « jour de cours » = numéro parmi les jours où il y a cours. */
const dateOf=d=>new Date(2026,8,d);
const isoOf=x=>x.getFullYear()+'-'+String(x.getMonth()+1).padStart(2,'0')+'-'+String(x.getDate()).padStart(2,'0');
const VACS=[['2026-10-24','2026-11-01','Vacances de la Toussaint'],['2026-12-19','2027-01-03','Vacances de Noël'],['2027-02-06','2027-02-14','Vacances de Carnaval'],['2027-03-27','2027-04-11','Vacances de Pâques']];
const FERIES={'2026-11-11':'Armistice','2027-05-01':'Fête du travail','2027-05-06':'Ascension','2027-05-07':"Pont de l'Ascension",'2027-05-08':'Victoire de 1945','2027-05-17':'Lundi de Pentecôte','2027-05-27':"Abolition de l'esclavage"};
const CAL=(()=>{const c=[null];let n=0;for(let d=1;isoOf(dateOf(d))<='2027-06-30';d++){const x=dateOf(d),k=isoOf(x),wd=(x.getDay()+6)%7,v=VACS.find(([a,b])=>k>=a&&k<=b),f=FERIES[k],sd=wd<5&&!v&&!f?++n:null;c.push({k,wd,sd,done:n,lbl:f?'Férié : '+f:v?v[2]:null})}return c})();
const CAL_END=CAL.length-1;
const YEAR_DAYS=CAL[CAL_END].done;
const sdOfDate=k=>CAL.find(c=>c&&c.k>=k).done;
/* fin des trimestres = un vendredi de cours (jour de l'évaluation qui déclenche le bulletin) */
const lastFri=max=>{for(let d=CAL_END;d>0;d--){const c=CAL[d];if(c.sd&&c.sd<=max&&c.wd===4)return c.sd}return max};
const TRI_END=[sdOfDate('2026-12-18'),sdOfDate('2027-03-26'),lastFri(YEAR_DAYS-5)],REV_DAY=YEAR_DAYS-4,BAC_DAYS=[YEAR_DAYS-3,YEAR_DAYS-2],RES_DAYS=[YEAR_DAYS-1,YEAR_DAYS];
const BAC_EP={[BAC_DAYS[0]]:{am:['philo','maths','physique'],pm:['svt','histoire']},[BAC_DAYS[1]]:{am:['francais','anglais'],pm:['espagnol','eps']}};
const wdOf=d=>(dateOf(d).getDay()+6)%7;
const schoolDay=d=>d>=1&&d<=CAL_END?CAL[d].sd:null;
const schoolDayToCal=n=>CAL.findIndex(c=>c&&c.sd===n);
const sdDone=d=>d<1?0:d>CAL_END?YEAR_DAYS:CAL[d].done;
const dayLbl=d=>d>CAL_END?'Grandes vacances':CAL[d].lbl;
const fmtDay=(d,long)=>dateOf(d).toLocaleDateString('fr-FR',long?{weekday:'long',day:'numeric',month:'long'}:{weekday:'short',day:'numeric',month:'short'});
const triOf=sd=>sd<=TRI_END[0]?1:sd<=TRI_END[1]?2:3;
const curTri=()=>triOf(Math.min(sdDone(G.day),TRI_END[2]));
const mean=a=>a.length?a.reduce((x,y)=>x+y,0)/a.length:null;
const r2=v=>Math.round(v*100)/100;
const PLACES={cour:'Cour',cdi:'CDI',foyer:'Foyer',cantine:'Cantine',maison:'Maison',plage:'Plage',centre:'Centre-ville'};
const PLACE_OUT={plage:'à la plage',centre:'au centre-ville',glacier:'au glacier du Gosier',sainteanne:'à la plage de Sainte-Anne',carbet:'aux chutes du Carbet',marche:'au marché de Pointe-à-Pitre',resto:'au restaurant créole',cinema:'au cinéma'};
const SEV=['','Cool','Exigeant·e','Sévère'];
const weekday=()=>wdOf(G.day);
function phase(){
 const wd=weekday(),m=G.min,sd=schoolDay(G.day);
 const free=sd===null?(dayLbl(G.day)||'Week-end'):sd===REV_DAY?'Révisions du bac':RES_DAYS.includes(sd)?'Résultats du bac':null;
 if(free){if(m<480||m>=1320)return{type:'nuit',start:m<480?0:1320,end:m<480?480:1440,key:G.day+'n'+(m<480?0:1)};return{type:'weekend',lbl:free,start:480,end:1320,key:G.day+'we'}}
 if(BAC_DAYS.includes(sd)){const e=BAC_EP[sd];if(m>=480&&m<720)return{type:'bac',part:'am',subs:e.am,start:480,end:720,key:G.day+'bac-am'};if(m>=840&&m<1020)return{type:'bac',part:'pm',subs:e.pm,start:840,end:1020,key:G.day+'bac-pm'}}
 else if(wd===4&&m>=840&&m<1020)return{type:'eval',start:840,end:1020,key:G.day+'eval'};
 if(wd>=5){if(m<480||m>=1320)return{type:'nuit',start:m<480?0:1320,end:m<480?480:1440,key:G.day+'n'+(m<480?0:1)};return{type:'weekend',start:480,end:1320,key:G.day+'we'}}
 for(const s of SLOTS)if(m>=s[0]&&m<s[1]){const p={type:s[2],start:s[0],end:s[1],key:G.day+'-'+s[0]};if(s[2]==='cours'){p.slot=s[3];p.sub=TT[wd][s[3]];p.prof=PROFS[p.sub]}return p}
 return{type:'nuit',start:1320,end:1440,key:G.day+'n1'};
}
function placesFor(t){return t==='recre'||t==='matin'?['cour','cdi','foyer']:t==='dej'?['cantine','cour','cdi','foyer']:t==='weekend'?['maison','plage','centre']:t==='soir'?['maison']:[]}

/* ---------- personnes ---------- */
const avOf=id=>id==='me'?me():isFam(id)?famById(id).av:WHO[id].av;
function avatarOf(id){return render(avOf(id),AVB,uid(),true)}
const slug=n=>'@'+((n||'moi').normalize('NFD').replace(/[̀-ͯ]/g,'').toLowerCase().replace(/[^a-z0-9]+/g,'')||'moi');
const myHandle=()=>slug(me().name)+(me().nom?'.'+slug(me().nom).slice(1):'');
const isFam=id=>typeof id==='string'&&id.startsWith('fam');
const famById=id=>G.family.find(f=>f.id===id);
const nameOf=id=>id==='me'?(me().name||'Moi'):isFam(id)?(famById(id)?.name||'Famille'):WHO[id].name;
const handleOf=id=>id==='me'?myHandle():isFam(id)?famById(id).role:WHO[id].handle;
const isNpc=id=>!!(id&&FICHES[id]);
const ilElle=id=>FICHES[id]?.g==='f'?'elle':'il';
function relChange(id,da=0,dl=0){
 if(!isNpc(id))return'';const r=G.rel[id];da=Math.round(da*markFactor(id,da));dl=Math.round(dl*(hasMark(id,'trahison')&&dl>0?.4:1));
 if(dl>0&&!npcLikesMe(id))dl=0;r.ami=clamp(r.ami+da,-30,100);r.amour=clamp(r.amour+dl,0,100);
 const p=[];if(da)p.push(`amitié ${da>0?'+':''}${da}`);if(dl)p.push(`amour ${dl>0?'+':''}${dl}`);
 return p.length?`${WHO[id].name} : ${p.join(', ')}`:'';
}
function famChange(id,d){if(G.famRel[id]!=null)G.famRel[id]=clamp(G.famRel[id]+d,0,100)}
function coupleOf(id){if(G.partner===id)return'me';const c=G.couples.find(c=>c.includes(id));return c?c.find(x=>x!==id):null}
function statusOf(id){const c=coupleOf(id);return c==='me'?'En couple avec toi 💞':c?`En couple avec ${WHO[c].name}`:'Célibataire'}
function ressenti(id){
 const r=G.rel[id],n=WHO[id].name;let a;
 if(r.ami>=85)a="Te considère comme son ou sa meilleure amie.";
 else if(r.ami>=65)a="Adore passer du temps avec toi.";
 else if(r.ami>=45)a="T'apprécie de plus en plus.";
 else if(r.ami>=25)a="Te trouve sympa, mais te connaît encore peu.";
 else if(r.ami>=8)a="Commence à te connaître.";
 else if(r.ami>=0)a="Ne te connaît pas encore.";
 else if(r.ami>=-15)a="Se méfie un peu de toi.";
 else a="Ne te supporte pas en ce moment.";
 let b='';
 if(G.partner===id)b=S(id," Est amoureux·se de toi et fier·ère d'être avec toi 💞");
 else if(!npcLikesMe(id))b=r.ami>=45?" Ne te voit pas de façon romantique.":"";
 else if(r.amour>=75)b=" Pense à toi tout le temps et rougit quand tu passes 💘";
 else if(r.amour>=50)b=P(" Te trouve vraiment mignon·ne, sans oser te le dire.");
 else if(r.amour>=25)b=" Il y a peut-être un petit quelque chose…";
 const mem=G.log.slice().reverse().find(l=>l.t.includes(n));
 return a+b+(mem?` Se souvient : « ${mem.t} »`:'');
}
const ressentiShort=id=>ressenti(id).split(' Se souvient')[0];
function gaugesHTML(id){const r=G.rel[id],off=!npcLikesMe(id)&&G.partner!==id;return `<div class="gg"><span>Amitié</span><div class="bar"><i style="width:${Math.max(0,r.ami)}%"></i></div><b>${r.ami}</b></div><div class="gg love${off?' off':''}" title="${off?'Pas attiré·e par toi':''}"><span>Amour</span><div class="bar"><i style="width:${off?0:r.amour}%"></i></div><b>${off?'–':r.amour}</b></div>`}

/* ---------- famille ---------- */
const ROLES=['Mère','Père','Belle-mère','Beau-père','Grande sœur','Petite sœur','Grand frère','Petit frère','Grand-mère','Grand-père','Tante','Oncle'];
const TRAITS=['Protecteur·rice','Strict·e','Cool','Drôle','Souvent absent·e','Curieux·se'];
const DEFAULT_FAM=[{role:'Mère',name:'Sandrine',trait:'Protecteur·rice'},{role:'Père',name:'Didier',trait:'Strict·e'},{role:'Petit frère',name:'Lenny',trait:'Drôle'}];
function famAvatar(role,seed){
 const r=seeded(seed),p=a=>a[Math.floor(r()*a.length)],s=clone(DEFAULT);
 const old=/Grand-/.test(role),fem=/Mère|sœur|Tante|mère/.test(role),adult=/Mère|Père|Belle-mère|Beau-père|Tante|Oncle/.test(role);
 s.rides=old?'marquees':adult?'fines':'aucune';s.dress='aucune';
 s.skin=me().skin;s.face=fem?p(['joufflu','ovale','rond','coeur']):p(['naturel','anguleux','carre','allonge']);s.eyes=fem?p(['grands','amande','rieurs']):p(['doux','nets','amande']);s.iris=me().iris;s.brows=p(['epais','fins','arques']);
 s.nose=p(['bouton','petit']);s.mouth=p(['naturelle','fermee','remontante','moyenne','fine']);s.cheeks=p(['rose','aucune']);s.freckles='aucune';
 s.hair=fem?p(HAIR_ALL.filter(h=>!['degrade','taper','fadehaut','raiecote'].includes(h))):p(['degrade','taper','fadehaut','raiecote']);
 s.hairColor=old?'#d9d4cc':(r()<.7?me().hairColor:p(HAIR.slice(0,5)));
 s.top=old?p(['chemise','colroule']):p(['tshirt','chemise','capuche','colroule']);const c=p(COMBOS);s.topColor=c[0];s.bgColor=c[1];s.bgPattern='uni';
 s.sexe=fem?'f':'m';s.bottom=p(fem&&!old?['droit','flare','large','jupe']:['droit','large']);s.bottomColor=p(BOTC.slice(0,7));s.shoes=p(old?['basses','retro']:['basses','running','retro','sandales']);s.shoesColor=p(SHOEC.slice(0,4));
 s.glasses=old&&r()<.6?'dorees':r()<.15?'rondes':'aucune';s.earrings=fem&&r()<.5?p(['perles','anneaux']):'aucune';
 if(!fem&&(adult||old))s.barbe=p(['aucune','aucune','barbe3j','courte','moustache','bouc','collier']);
 if(adult){if(s.eyes==='grands')s.eyes=fem?'amande':'doux';s.cheeks='aucune';s.adj.eyesS=.92;s.adj.mouthY=2;s.hairColor=mix(s.hairColor,'#a8a39b',.16)}
 return s;
}

/* ---------- photos ---------- */
const SCENES={plage:'Plage',cour:'Cour du lycée',couloir:'Couloir du lycée',basket:'Terrain de basket',cantine:'Cantine',soiree:'Soirée',chambre:'Chambre',cascade:'Chutes du Carbet',marche:'Marché'};
function sceneSVG(id,p){
 switch(id){
 case 'plage':{/* plage : style vectoriel plat, ciel clair, nuages à l'horizon, mer turquoise et sable doré */
  const cl=(c,sh)=>c.map(([x,y,r])=>`<circle cx="${x}" cy="${y+sh}" r="${r}"/>`).join('');
  const L1=[[-6,168,44],[48,158,40],[104,146,48],[168,160,40],[222,174,30],[258,184,20]],R1=[[352,182,22],[392,172,32],[446,156,44],[508,146,50],[566,154,44],[612,166,38]];
  return `<defs><linearGradient id="${p}sky" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#a9e7fb"/><stop offset="1" stop-color="#c9f1fd"/></linearGradient>
  <linearGradient id="${p}sea" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#29a9df"/><stop offset=".18" stop-color="#3cbcec"/><stop offset=".6" stop-color="#5ccff5"/><stop offset="1" stop-color="#86def8"/></linearGradient>
  <linearGradient id="${p}snd" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#f4d595"/><stop offset="1" stop-color="#efc77c"/></linearGradient></defs>
  <rect width="600" height="400" fill="url(#${p}sky)"/>
  <g fill="#d9f5fe" opacity=".75"><path d="M0,26 L215,40 L0,48Z"/><path d="M60,92 L300,104 L120,112Z"/><path d="M420,34 L600,22 L600,40Z"/><path d="M360,118 L600,104 L600,116 L470,124Z"/></g>
  <circle cx="452" cy="72" r="34" fill="#f8dc86"/><g fill="#fff" opacity=".9"><ellipse cx="468" cy="96" rx="34" ry="9"/><circle cx="458" cy="90" r="9"/><circle cx="474" cy="88" r="11"/></g>
  <g fill="none" stroke="#fff" stroke-width="2.2" stroke-linecap="round"><path d="M372,52 q5,-6 10,0 q5,-6 10,0"/><path d="M168,104 q4,-5 8,0 q4,-5 8,0"/><path d="M490,140 q4,-5 8,0 q4,-5 8,0"/></g>
  <g fill="#e4f6fc">${cl(L1,6)}${cl(R1,6)}</g><g fill="#fff">${cl(L1,0)}${cl(R1,0)}</g>
  <rect y="194" width="600" height="80" fill="url(#${p}sea)"/><rect y="194" width="600" height="5" fill="#1c9bd3"/>
  <g fill="#9fe8fb" opacity=".7"><ellipse cx="120" cy="214" rx="70" ry="2.5"/><ellipse cx="380" cy="208" rx="90" ry="2"/><ellipse cx="520" cy="226" rx="60" ry="3"/><ellipse cx="250" cy="236" rx="80" ry="3.5"/><ellipse cx="60" cy="246" rx="44" ry="3"/><ellipse cx="460" cy="250" rx="54" ry="3"/></g>
  <path d="M0,264 C40,258 70,266 110,262 C150,258 170,268 214,264 C260,260 290,270 330,265 C372,260 404,268 446,264 C490,260 530,270 600,262 L600,284 L0,284Z" fill="#fff"/>
  <path d="M0,276 C60,270 120,282 190,276 C260,270 330,284 410,277 C480,271 540,282 600,276 L600,400 L0,400Z" fill="url(#${p}snd)"/>
  <g fill="#fff" opacity=".85"><ellipse cx="96" cy="256" rx="26" ry="2.6"/><ellipse cx="300" cy="254" rx="20" ry="2.2"/><ellipse cx="520" cy="255" rx="30" ry="2.6"/><ellipse cx="190" cy="250" rx="12" ry="1.8"/></g>
  <path d="M0,276 C60,270 120,282 190,276 C260,270 330,284 410,277 C480,271 540,282 600,276 L600,286 C540,292 470,282 410,288 C330,295 260,281 190,287 C120,293 60,281 0,287Z" fill="#e9bf72" opacity=".45"/>
  <path d="M0,318 C90,308 180,326 300,316 C410,307 500,322 600,312 L600,330 C500,338 410,324 300,334 C180,344 90,326 0,336Z" fill="#f8deaa" opacity=".8"/>
  <path d="M0,366 C120,356 230,374 360,364 C460,356 540,368 600,362 L600,400 L0,400Z" fill="#ecc174" opacity=".55"/>
  <g fill="#e2b46a" opacity=".6"><circle cx="80" cy="300" r="1.6"/><circle cx="240" cy="352" r="1.4"/><circle cx="420" cy="306" r="1.6"/><circle cx="530" cy="348" r="1.4"/><circle cx="330" cy="384" r="1.6"/></g>`;}
 case 'basket':{/* gymnase : terrain de basket, panier au fond, fenêtre sur le ciel à droite */
  const NET='M274,93 C276,106 280,118 284,134 C290,137 310,137 316,134 C320,118 324,106 326,93Z';
  return `<defs><linearGradient id="${p}bw" x1="0" y1="0" x2="1" y2="0"><stop offset="0" stop-color="#3fa6cb"/><stop offset=".55" stop-color="#6cc2dc"/><stop offset="1" stop-color="#8fd2e6"/></linearGradient>
  <linearGradient id="${p}bwin" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#9fdcf0"/><stop offset=".6" stop-color="#bfe3c8"/><stop offset="1" stop-color="#d6df9a"/></linearGradient>
  <linearGradient id="${p}bfl" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#b8925c"/><stop offset="1" stop-color="#c79c5e"/></linearGradient>
  <pattern id="${p}bnet" width="9" height="9" patternUnits="userSpaceOnUse" patternTransform="rotate(45)"><path d="M0,0 V9 M0,0 H9" stroke="#f0d9a3" stroke-width="2.4"/></pattern><linearGradient id="${p}bpo" x1="0" y1="0" x2="1" y2="0"><stop offset="0" stop-color="#8d949b"/><stop offset=".45" stop-color="#e6eaee"/><stop offset="1" stop-color="#9aa1a8"/></linearGradient></defs>
  <rect width="600" height="400" fill="url(#${p}bw)"/>
  <path d="M0,0 L112,0 L112,206 L0,350Z" fill="#1f88b2"/><path d="M0,0 L112,0 L112,40 L0,150Z" fill="#2a95bf" opacity=".6"/>
  <path d="M487,0 L600,0 L600,350 L487,206Z" fill="#3b9cc8"/>
  <path d="M500,0 L600,0 L600,170 L490,38Z" fill="url(#${p}bwin)"/><path d="M490,38 L600,170" stroke="#e9f8ff" stroke-width="3" opacity=".8"/>
  <g fill="#fff4dc"><ellipse cx="540" cy="24" rx="34" ry="8"/><circle cx="530" cy="17" r="9"/><circle cx="546" cy="13" r="11"/><circle cx="560" cy="20" r="7"/><ellipse cx="575" cy="96" rx="28" ry="7"/><circle cx="568" cy="90" r="8"/><circle cx="582" cy="87" r="9"/></g>
  <path d="M112,0 L300,0 L112,140Z" fill="#fff" opacity=".1"/><path d="M380,0 L487,0 L487,120 L300,206 L250,206Z" fill="#fff" opacity=".08"/>
  <rect x="112" y="204" width="375" height="3" fill="#e9f4f8" opacity=".8"/>
  <path d="M112,206 L487,206 L640,400 L-40,400Z" fill="url(#${p}bfl)"/>
  <g fill="#a9824e" opacity=".35"><ellipse cx="190" cy="250" rx="60" ry="4"/><ellipse cx="420" cy="262" rx="70" ry="5"/><ellipse cx="240" cy="300" rx="90" ry="5"/><ellipse cx="460" cy="322" rx="80" ry="5"/><ellipse cx="150" cy="356" rx="70" ry="4"/></g>
  <g fill="#dcb67a" opacity=".45"><ellipse cx="330" cy="280" rx="80" ry="4"/><ellipse cx="420" cy="368" rx="90" ry="5"/></g>
  <g fill="none" stroke="#f4efe4" stroke-width="2.6" opacity=".9"><path d="M126,231 L474,231 L612,400 M126,231 L-12,400"/><path d="M152,231 C152,282 230,296 300,296 C370,296 448,282 448,231"/><path d="M209,231 L209,257 L391,257 L391,231"/><path d="M232,257 C232,276 262,281 300,281 C338,281 368,276 368,257"/><path d="M205,400 C215,368 255,362 300,362 C345,362 385,368 395,400"/></g>
  <path d="M112,206 L487,206 L640,400 L-40,400Z" fill="#fff" opacity=".04"/><path d="M500,206 L600,300 L600,400 L520,400 Z" fill="#fff" opacity=".1"/>
  <rect x="294" y="116" width="12" height="112" fill="url(#${p}bpo)"/><ellipse cx="300" cy="228" rx="12" ry="3" fill="#6b5634" opacity=".35"/>
  <rect x="238" y="14" width="124" height="102" rx="2" fill="#e9eef1"/><rect x="243" y="19" width="114" height="92" fill="#8fe3ee"/>
  <path d="M262,19 L300,19 L262,70Z M318,19 L330,19 L280,111 L268,111Z M340,40 L357,19 L357,30 L346,46Z" fill="#fff" opacity=".45"/>
  <rect x="258" y="33" width="84" height="57" fill="none" stroke="#e9eef1" stroke-width="4"/>
  <path d="${NET}" fill="url(#${p}bnet)"/><path d="M274,93 C276,106 280,118 284,134 M326,93 C324,106 320,118 316,134 M284,134 C290,137 310,137 316,134" stroke="#e8cf96" stroke-width="2.4" fill="none" stroke-linecap="round"/>
  <ellipse cx="300" cy="93" rx="26" ry="5" fill="none" stroke="#d6362c" stroke-width="4"/>`;}
 case 'couloir':{/* couloir du lycée en perspective : casiers orange, carrelage en damier, plafond à dalles */
  const VX=300,VY=168,HW=340,TOP=178,BOT=262,LK=60,ZM=5.2,S=z=>1/(1+z),X=(u,z)=>fx(VX+u*S(z)),Y=(v,z)=>fx(VY+v*S(z));
  const quad=(a,b,c,d)=>`M${a[0]},${a[1]} L${b[0]},${b[1]} L${c[0]},${c[1]} L${d[0]},${d[1]}Z`;
  let o=`<rect width="600" height="400" fill="#9ccbed"/>`;
  /* plafond : dalles */
  let cl='';for(let u=-HW;u<=HW;u+=85)cl+=`M${X(u,0)},${Y(-TOP,0)} L${X(u,ZM)},${Y(-TOP,ZM)} `;for(let z=0;z<=ZM;z+=.5)cl+=`M${X(-HW,z)},${Y(-TOP,z)} L${X(HW,z)},${Y(-TOP,z)} `;
  o+=`<path d="${cl}" stroke="#7fb1da" stroke-width="2" fill="none"/>`;
  /* mur du fond et portes */
  o+=`<rect x="${X(-HW,ZM)}" y="${Y(-TOP,ZM)}" width="${fx(2*HW*S(ZM))}" height="${fx((TOP+BOT)*S(ZM))}" fill="#d6eaf8"/>`;
  [-1,1].forEach(k=>{const x0=VX+k*4,x1=VX+k*26;o+=`<rect x="${Math.min(x0,x1)}" y="${fx(VY+BOT*S(ZM)-38)}" width="22" height="38" fill="#2f9fe0" stroke="#1d5f9a" stroke-width="1.5"/><rect x="${Math.min(x0,x1)+4}" y="${fx(VY+BOT*S(ZM)-34)}" width="14" height="12" fill="#8fd3f5"/>`});
  /* sol en damier */
  const cols=8,cw=2*HW/cols;let fl='';
  for(let i=0;i*.5<ZM;i++){const z0=i*.5,z1=Math.min(ZM,z0+.5);for(let j=0;j<cols;j++){const u0=-HW+j*cw,u1=u0+cw;fl+=`<path d="${quad([X(u0,z0),Y(BOT,z0)],[X(u1,z0),Y(BOT,z0)],[X(u1,z1),Y(BOT,z1)],[X(u0,z1),Y(BOT,z1)])}" fill="${(i+j)%2?'#3f7cc0':'#f2d3a2'}"/>`}}
  o+=fl+`<path d="M0,400 L${X(-HW,0)},${Y(BOT,0)} L${X(-HW,ZM)},${Y(BOT,ZM)} L${X(HW,ZM)},${Y(BOT,ZM)} L${X(HW,0)},${Y(BOT,0)} L600,400" fill="none" stroke="#2e5f96" stroke-width="2" opacity=".4"/>`;
  o+=`<path d="${quad([X(-HW*.5,0),Y(BOT,0)],[X(HW*.5,0),Y(BOT,0)],[X(18,ZM),Y(BOT,ZM)],[X(-18,ZM),Y(BOT,ZM)])}" fill="#fff" opacity=".12"/>`;
  /* murs latéraux : bandeau clair, liseré bleu, rangées de casiers */
  [-1,1].forEach(k=>{const u=k*HW;
   o+=`<path d="${quad([X(u,0),Y(-TOP,0)],[X(u,ZM),Y(-TOP,ZM)],[X(u,ZM),Y(-LK,ZM)],[X(u,0),Y(-LK,0)])}" fill="#e6f2fc"/>`;
   o+=`<path d="${quad([X(u,0),Y(-TOP,0)],[X(u,ZM),Y(-TOP,ZM)],[X(u,ZM),Y(-TOP+14,ZM)],[X(u,0),Y(-TOP+14,0)])}" fill="#2a5f9e"/>`;
   o+=`<path d="${quad([X(u,0),Y(-LK-14,0)],[X(u,ZM),Y(-LK-14,ZM)],[X(u,ZM),Y(-LK,ZM)],[X(u,0),Y(-LK,0)])}" fill="#b9d8f0"/>`;
   for(let z=ZM-.3;z>=0;z-=.3){const a=z,b=z+.3,c=k<0?'#e2782f':'#e07a30',vx=(t,v)=>[X(u,a+(b-a)*t),Y(v,a+(b-a)*t)];
    o+=`<path d="${quad(vx(0,-LK),vx(1,-LK),vx(1,BOT-18),vx(0,BOT-18))}" fill="${c}" stroke="#8a3d12" stroke-width="${fx(2.4*S(a))}"/>`;
    o+=`<path d="M${vx(.25,-LK+20).join(',')} L${vx(.75,-LK+20).join(',')} M${vx(.25,-LK+34).join(',')} L${vx(.75,-LK+34).join(',')} M${vx(.25,-LK+48).join(',')} L${vx(.75,-LK+48).join(',')}" stroke="#9e4a18" stroke-width="${fx(3*S(a))}" opacity=".7"/>`;
    o+=`<path d="${quad(vx(k<0?.12:.8,80),vx(k<0?.2:.88,80),vx(k<0?.2:.88,118),vx(k<0?.12:.8,118))}" fill="#7fa7c8" stroke="#3e5f7c" stroke-width="${fx(1.4*S(a))}"/>`;
    o+=`<path d="${quad(vx(0,BOT-18),vx(1,BOT-18),vx(1,BOT),vx(0,BOT))}" fill="#7a3a16"/>`}
   o+=`<path d="M${X(u,0)},${Y(-TOP,0)} L${X(u,ZM)},${Y(-TOP,ZM)} M${X(u,0)},${Y(BOT,0)} L${X(u,ZM)},${Y(BOT,ZM)}" stroke="#1d4f86" stroke-width="3" opacity=".6"/>`});
  /* néons du plafond */
  [.6,1.8,3.2,4.5].forEach(z=>{const z1=z+.35;o+=`<path d="${quad([X(-46,z),Y(-TOP,z)],[X(46,z),Y(-TOP,z)],[X(46,z1),Y(-TOP,z1)],[X(-46,z1),Y(-TOP,z1)])}" fill="#fffbe8" stroke="#f2c230" stroke-width="${fx(5*S(z))}"/>`});
  o+=`<rect x="${X(-HW,ZM)}" y="${Y(-TOP,ZM)}" width="${fx(2*HW*S(ZM))}" height="${fx((TOP+BOT)*S(ZM))}" fill="none" stroke="#1d4f86" stroke-width="2" opacity=".5"/>`;
  return o;}
 case 'ch_ines':case 'ch_maelle':case 'ch_sacha':case 'ch_kylian':case 'ch_noah':case 'ch_anais':case 'ch_jade':return `<rect width="600" height="400" fill="#e9d6c4"/><image href="assets/chambres/${id.slice(3)}.jpg" x="0" y="0" width="600" height="400" preserveAspectRatio="xMidYMid slice"/>`;
 case 'cour':{/* cour du lycée : bâtiment antillais aux jalousies bleues, palmiers, pelouses et cour pavée */
  const cloud=(x,y,k)=>`<g transform="translate(${x},${y}) scale(${k})" fill="#fff"><circle cx="0" cy="0" r="30"/><circle cx="32" cy="-14" r="36"/><circle cx="70" cy="-2" r="30"/><circle cx="98" cy="10" r="22"/><rect x="-20" y="0" width="130" height="30" rx="15"/></g>`;
  const win=(x,y,w,h)=>`<rect x="${x}" y="${y}" width="${w}" height="${h}" fill="#2f7fb8"/>`+[0,1,2,3,4].map(i=>`<rect x="${x+2}" y="${y+3+i*(h-4)/5}" width="${w-4}" height="${(h-4)/5-2}" fill="#5aa7d8"/>`).join('')+`<rect x="${x-3}" y="${y+h}" width="${w+6}" height="4" fill="#e8d2a2"/>`;
  let wings='';[[72,220],[380,528]].forEach(([a,b])=>{for(let x=a;x<b;x+=38){wings+=win(x+8,150,22,32)+win(x+8,204,22,32)}});
  const palm=(x,y,h,lean)=>{let o=`<path d="M${x},${y} C${x+lean*.3},${y-h*.4} ${x+lean*.7},${y-h*.75} ${x+lean},${y-h}" stroke="#9a7048" stroke-width="12" fill="none" stroke-linecap="round"/>`;for(let i=0;i<6;i++)o+=`<path d="M${x+lean},${y-h-i*1.6} l0,${-i*1.4}" stroke="#8a6040" stroke-width="13" opacity=".0"/>`;
   [[-70,-6],[-56,-40],[-20,-54],[24,-50],[60,-30],[72,4],[-40,18],[40,20]].forEach(([dx,dy])=>{const cx=x+lean,cy=y-h;o+=`<path d="M${cx},${cy} Q${cx+dx*.5},${cy+dy*.5-26} ${cx+dx},${cy+dy}" stroke="#3f9a4f" stroke-width="10" fill="none" stroke-linecap="round"/><path d="M${cx},${cy} Q${cx+dx*.5},${cy+dy*.5-26} ${cx+dx},${cy+dy}" stroke="#5cbf5f" stroke-width="3" fill="none" stroke-linecap="round" opacity=".7"/>`});
   return o+`<circle cx="${x+lean-6}" cy="${y-h+6}" r="6" fill="#7a5236"/><circle cx="${x+lean+5}" cy="${y-h+8}" r="6" fill="#6b4a2e"/>`};
  return `<defs><linearGradient id="${p}csky" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#6fbde8"/><stop offset="1" stop-color="#cdeefb"/></linearGradient>
  <linearGradient id="${p}cpav" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#d9d6cf"/><stop offset="1" stop-color="#bdb9b0"/></linearGradient>
  <linearGradient id="${p}cwall" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#f7e2b0"/><stop offset="1" stop-color="#efd096"/></linearGradient></defs>
  <rect width="600" height="400" fill="url(#${p}csky)"/>${cloud(40,70,1)}${cloud(430,56,.9)}${cloud(250,40,.5)}
  <rect x="60" y="128" width="480" height="128" fill="url(#${p}cwall)"/><rect x="54" y="120" width="492" height="12" fill="#c96a3c"/><rect x="60" y="190" width="480" height="5" fill="#e8d2a2"/>${wings}
  <rect x="226" y="84" width="148" height="172" fill="#fbecc8"/><path d="M216,84 L300,58 L384,84Z" fill="#c96a3c"/><rect x="212" y="82" width="176" height="10" fill="#b85a30"/>
  <rect x="248" y="98" width="104" height="26" rx="4" fill="#2c3a63"/><text x="300" y="117" text-anchor="middle" font-family="Baloo 2, Trebuchet MS, sans-serif" font-weight="800" font-size="17" fill="#ffd23f" letter-spacing="2">LYCÉE</text>
  ${win(246,138,22,30)}${win(289,138,22,30)}${win(332,138,22,30)}
  <rect x="236" y="186" width="128" height="8" fill="#e8d2a2"/>${[244,276,316,348].map(x=>`<rect x="${x}" y="194" width="10" height="62" fill="#fff"/><rect x="${x-3}" y="192" width="16" height="5" fill="#e8d2a2"/>`).join('')}
  <rect x="262" y="202" width="76" height="54" fill="#3d6f8f"/><rect x="266" y="206" width="32" height="50" fill="#8fd0ea"/><rect x="302" y="206" width="32" height="50" fill="#8fd0ea"/><path d="M270,250 L292,210 M306,250 L328,210" stroke="#fff" stroke-width="3" opacity=".5"/>
  <path d="M0,256 H600 V400 H0Z" fill="url(#${p}cpav)"/>
  <path d="M0,262 L232,262 C190,300 120,330 0,346Z" fill="#78c06a"/><path d="M600,262 L368,262 C410,300 480,330 600,346Z" fill="#78c06a"/>
  <path d="M0,346 C120,330 190,300 232,262" stroke="#e9e5dc" stroke-width="5" fill="none"/><path d="M600,346 C480,330 410,300 368,262" stroke="#e9e5dc" stroke-width="5" fill="none"/>
  <g fill="#3f8f4a">${[[30,268,20],[64,264,16],[96,266,18],[130,264,14],[470,264,14],[504,266,18],[536,264,16],[570,268,20]].map(([x,y,r])=>`<circle cx="${x}" cy="${y}" r="${r}"/>`).join('')}</g>
  <g fill="#5aab55">${[[36,262,12],[100,260,10],[498,260,10],[564,262,12]].map(([x,y,r])=>`<circle cx="${x}" cy="${y}" r="${r}"/>`).join('')}</g>
  <g opacity=".35" fill="#a8a49b"><path d="M150,300 L450,300 L470,312 L130,312Z"/><path d="M110,340 L490,340 L520,356 L80,356Z"/></g>
  <path d="M172,266 H428" stroke="#e9e5dc" stroke-width="3"/>
  <g transform="translate(468,300)"><rect x="0" y="0" width="70" height="8" rx="2" fill="#8a5a35"/><rect x="0" y="-16" width="70" height="7" rx="2" fill="#8a5a35"/><rect x="6" y="8" width="5" height="16" fill="#555"/><rect x="59" y="8" width="5" height="16" fill="#555"/></g>
  ${palm(560,402,250,-28)}${palm(520,404,200,22)}`;}
 case 'cascade':return `<rect width="600" height="400" fill="#2f6b3f"/><path d="M0,0 H600 V140 C520,120 460,170 380,150 C320,136 280,170 200,150 C120,130 60,160 0,140Z" fill="#3f8a4f"/><path d="M240,0 C250,120 236,240 250,330 L350,330 C364,240 350,120 360,0Z" fill="#dff4ff"/><path d="M262,0 C270,120 258,240 270,330 M300,0 C306,120 296,240 304,330 M338,0 C344,120 334,240 340,330" stroke="#a9dcf2" stroke-width="5" fill="none" opacity=".8"/><ellipse cx="300" cy="336" rx="190" ry="34" fill="#5fb8d9"/><rect y="350" width="600" height="50" fill="#4a8f9f"/><g fill="#57a85e"><circle cx="60" cy="120" r="50"/><circle cx="140" cy="90" r="44"/><circle cx="520" cy="110" r="52"/><circle cx="450" cy="80" r="40"/></g>`;
 case 'marche':{let st='';const cols=[['#e8613c','#fff3c4'],['#2fa36b','#f4f1ea'],['#f2c230','#d93b5e']];for(let i=0;i<3;i++){const x=20+i*195,[a,b]=cols[i];for(let k=0;k<6;k++)st+='';st+=`<rect x="${x}" y="60" width="180" height="50" fill="${a}"/>`+[0,1,2,3,4,5].map(k=>`<rect x="${x+k*30}" y="60" width="15" height="50" fill="${b}"/>`).join('')+`<rect x="${x+10}" y="110" width="8" height="150" fill="#7a4f2e"/><rect x="${x+162}" y="110" width="8" height="150" fill="#7a4f2e"/><rect x="${x}" y="220" width="180" height="40" rx="4" fill="#a8743f"/>`+['#ffb627','#e8613c','#7cc35f','#ffd23f','#d93b5e','#ff8a3d','#9bd16a'].map((f,k)=>`<circle cx="${x+18+k*24}" cy="212" r="11" fill="${f}"/>`).join('')}return `<rect width="600" height="400" fill="#bfe3ff"/>${st}<rect y="260" width="600" height="140" fill="#d8cdbb"/>`;}
 case 'cantine':{let f='';for(let i=0;i<12;i++)f+=`<rect x="${i*50}" y="300" width="25" height="100" fill="#e4dccd"/>`;
  return `<rect width="600" height="400" fill="#f6efe2"/><rect x="40" y="40" width="150" height="110" rx="8" fill="#a9d6ef" stroke="#fff" stroke-width="8"/><rect x="410" y="40" width="150" height="110" rx="8" fill="#a9d6ef" stroke="#fff" stroke-width="8"/><rect x="230" y="50" width="140" height="90" rx="8" fill="#2f4a3e"/><text x="300" y="82" text-anchor="middle" font-family="Baloo 2, Trebuchet MS, sans-serif" font-weight="700" font-size="17" fill="#f4f1ea">MENU</text><rect y="300" width="600" height="100" fill="#efe8da"/>${f}`;}
 case 'soiree':{let l='';const cols=['#ff5f8f','#ffd23f','#5fd3ff','#9b6bff','#3fcf8e'];for(let i=0;i<13;i++){const x=20+i*47,y=50+Math.sin(i/12*Math.PI)*45;l+=`<circle cx="${x}" cy="${y}" r="9" fill="${cols[i%5]}"/><circle cx="${x}" cy="${y}" r="20" fill="${cols[i%5]}" opacity=".18"/>`}
  return `<defs><radialGradient id="${p}sr" cx="50%" cy="40%" r="70%"><stop offset="0" stop-color="#4a2f7a"/><stop offset="1" stop-color="#1c1430"/></radialGradient></defs><rect width="600" height="400" fill="url(#${p}sr)"/>${l}`;}
 default:return `<rect width="600" height="400" fill="#f3d9e2"/><rect x="380" y="50" width="160" height="130" rx="6" fill="#bfe3ff" stroke="#fff" stroke-width="10"/><path d="M460,50 V180 M380,115 H540" stroke="#fff" stroke-width="6"/><rect x="60" y="60" width="90" height="120" rx="4" fill="#9b6bff" transform="rotate(-4 105 120)"/><rect y="320" width="600" height="80" fill="#8fb3e0"/><rect y="312" width="600" height="14" rx="7" fill="#f4f1ea"/>`;
 }}
/* chaque camarade a sa chambre (images créées par Prescillia, dans assets/chambres/) */
const ROOMS={ines:'ch_ines',sacha:'ch_sacha',kylian:'ch_kylian',noah:'ch_noah',anais:'ch_anais',jade:'ch_jade',maelle:'ch_maelle'};
function photoSVG(ph){
 const p=uid(),ppl=ph.people.filter(x=>x==='me'||WHO[x]||isFam(x)),n=Math.max(1,ppl.length);
 const w=n===1?330:n===2?290:Math.min(250,640/n);
 /* chambres vides de Prescillia : utilisées pour toutes les photos prises dans la chambre du camarade */
 const sc=ph.scene==='chambre'&&ROOMS[ph.author]?ROOMS[ph.author]:ph.scene;
 let o=`<svg viewBox="0 0 600 400" xmlns="http://www.w3.org/2000/svg" aria-hidden="true">`+sceneSVG(sc,p);
 ppl.forEach((id,i)=>{const cx=300+(i-(n-1)/2)*w*.66;
  o+=render(avOf(id),PHB,uid(),false).replace('<svg ',`<svg x="${(cx-w/2).toFixed(1)}" y="${(400-w).toFixed(1)}" width="${w.toFixed(1)}" height="${w.toFixed(1)}" `)});
 return o+'</svg>';
}
const tagLine=ph=>{const t=ph.people.filter(x=>x!==ph.author);return t.length?`<div class="tags">avec ${t.map(x=>`<span class="mention">${handleOf(x)}</span>`).join(', ')}</div>`:''};

/* ---------- contenu du fil ---------- */
const mkC=(by,text,o)=>Object.assign({id:'c'+Date.now().toString(36)+Math.floor(Math.random()*1e8).toString(36),by,text},o||{});
const C=(by,text)=>mkC(by,text);
const START_POSTS=[
 {by:'potins',text:"[Anonyme] : quelqu'un a vu avec qui Kylian est reparti après le match ?\n[Sceptique] : arrête d'inventer\n[Anonyme] : ouvrez bien les yeux demain matin devant les casiers.",c:15,r:848,l:18900,comments:[C('kylian',"n'importe quoi 🙄"),C('maelle',"oh le drama 👀")]},
 {by:'maelle',text:"Après-midi plage avant les contrôles 🌊",photo:{scene:'plage',people:['maelle','ines']},c:24,r:520,l:12400,comments:[C('ines',"meilleure journée 🥰"),C('noah',"et on m'invite pas ?")]},
 {by:'noah',text:"Entraînement annulé mais on a trouvé un ballon 🏀",photo:{scene:'basket',people:['noah','kylian']},c:40,r:96,l:2300,comments:[C('kylian',"je t'ai mis 3 paniers d'affilée")]},
 {by:'jade',text:"est-ce que le vent raconte nos secrets aux palmiers pendant qu'on dort",c:17,r:310,l:7200,comments:[C('sacha',"ça ferait une belle chanson")]},
 {by:'sacha',text:"nouvelle compo ce soir 🎧 venez en privé si vous voulez l'écouter en premier",photo:{scene:'chambre',people:['sacha']},c:31,r:210,l:5400,comments:[C('jade',"j'ai hâte")]},
 {by:'anais',text:"Footing de 6 h sur la plage ✅ qui me suit demain ? 💪🌅",photo:{scene:'plage',people:['anais']},c:22,r:180,l:4100,comments:[C('kylian',"6 h ?? t'es pas humaine 😭"),C('noah',"je viens si tu ralentis ptdr")]},
 {by:'kylian',text:"Ma copine est une artiste et moi je suis son modèle préféré 😎❤️",photo:{scene:'plage',people:['kylian','eva']},c:52,r:410,l:9800,comments:[C('eva',"t'es bête 🥹💕"),C('noah',"frérot est trop love ptdr"),C('kenza',"mignon 😘")]},
 {by:'noemie',text:"Triplé contre Baimbridge ⚽⚽⚽ merci l'équipe 💪",photo:{scene:'cour',people:['noemie','kylian']},c:38,r:260,l:7400,comments:[C('kylian',"elle m'a volé la vedette frr 😭"),C('anais',"MA MEILLEURE 🔥🔥")]},
 {by:'jessica',text:"Cours particuliers lundi et mercredi, 17 h – 19 h 📚 toutes les matières, inscriptions ouvertes 😊",photo:{scene:'couloir',people:['jessica']},c:19,r:120,l:2600,comments:[C('noemie',"elle m'a sauvée en maths 🙏"),C('maelle',"🙄")]},
 {by:'meisha',text:"Moi et ma jumelle, même tenue, zéro concertation 👯‍♀️💅",photo:{scene:'couloir',people:['meisha','kenza']},c:44,r:520,l:13600,comments:[C('kenza',"ma jumelle pour la vie 😘"),C('noah',"vous êtes trop 😳"),C('ines',"les reines 👑")]},
 {by:'kenza',text:"Nouvelle photo, nouveaux messages en attente 😂 désolée les garçons 💅",photo:{scene:'couloir',people:['kenza']},c:48,r:640,l:15800,comments:[C('kylian',"t'es trop belle sérieux 😍"),C('maelle',"🙄"),C('ines',"ma reine 👑")]}
];
const MEISHA_POST={by:'meisha',text:"Moi et ma jumelle, même tenue, zéro concertation 👯‍♀️💅",photo:{scene:'couloir',people:['meisha','kenza']},c:44,r:520,l:13600,comments:[C('kenza',"ma jumelle pour la vie 😘"),C('noah',"vous êtes trop 😳"),C('ines',"les reines 👑")]};
const JESSICA_POST={by:'jessica',text:"Cours particuliers lundi et mercredi, 17 h – 19 h 📚 toutes les matières, inscriptions ouvertes 😊",photo:{scene:'couloir',people:['jessica']},c:19,r:120,l:2600,comments:[C('noemie',"elle m'a sauvée en maths 🙏"),C('maelle',"🙄")]};
const NOEMIE_POST={by:'noemie',text:"Triplé contre Baimbridge ⚽⚽⚽ merci l'équipe 💪",photo:{scene:'cour',people:['noemie','kylian']},c:38,r:260,l:7400,comments:[C('kylian',"elle m'a volé la vedette frr 😭"),C('anais',"MA MEILLEURE 🔥🔥")]};
const EVA_POST={by:'kylian',text:"Ma copine est une artiste et moi je suis son modèle préféré 😎❤️",photo:{scene:'plage',people:['kylian','eva']},c:52,r:410,l:9800,comments:[C('eva',"t'es bête 🥹💕"),C('noah',"frérot est trop love ptdr"),C('kenza',"mignon 😘")]};
const KENZA_POST={by:'kenza',text:"Nouvelle photo, nouveaux messages en attente 😂 désolée les garçons 💅",photo:{scene:'couloir',people:['kenza']},c:48,r:640,l:15800,comments:[C('kylian',"t'es trop belle sérieux 😍"),C('maelle',"🙄"),C('ines',"ma reine 👑")]};
const ANAIS_POST={by:'anais',text:"Footing de 6 h sur la plage ✅ qui me suit demain ? 💪🌅",photo:{scene:'plage',people:['anais']},c:22,r:180,l:4100,comments:[C('kylian',"6 h ?? t'es pas humaine 😭"),C('noah',"je viens si tu ralentis ptdr")]};
const STORY_BG=['linear-gradient(160deg,#ff8a5c,#d93b5e)','linear-gradient(160deg,#5fd3ff,#4b4fd6)','linear-gradient(160deg,#3fcf8e,#1f7a6a)','linear-gradient(160deg,#ffd23f,#e8613c)','linear-gradient(160deg,#c49bff,#6a3fc0)','linear-gradient(160deg,#2c2f3a,#5b4bd1)'];
const START_STORIES=[
 {by:'ines',type:'text',text:"Qui vient à la plage samedi ? 🌴",bg:0},
 {by:'kylian',type:'photo',photo:{scene:'cour',people:['kylian','noah']},text:"Les champions de la récré"},
 {by:'maelle',type:'text',text:"Je connais un secret, mais je ne dirai rien 🤐",bg:4},
 {by:'jade',type:'photo',photo:{scene:'chambre',people:['jade']},text:"Révisions… ou pas"},
 {by:'sacha',type:'text',text:"Playlist du jour : que du zouk 🎶",bg:5},
 {by:'anais',type:'text',text:"Victoire au hand ce soir !! 🤾‍♀️🔥",bg:3},
 {by:'meisha',type:'text',text:"Shopping à Jarry après les cours, qui vient ? 🛍️",bg:4},
 {by:'noemie',type:'text',text:"Match samedi 15 h, venez nombreux ⚽🔥",bg:2},
 {by:'eva',type:'photo',photo:{scene:'plage',people:['eva','kylian']},text:"💕"},
 {by:'kenza',type:'text',text:"Qui m'a laissé un mot dans mon casier ? 👀💌",bg:0}
];
const STORY_POOL=["Contrôle de philo demain, priez pour moi 🙏","Meilleure journée de la semaine ☀️","Quelqu'un a vu mes écouteurs ??","Le prof de SVT est en forme aujourd'hui 😂","Petit gwo ka ce soir 🥁","Qui a le cours d'anglais ? Je l'ai raté"];
const POST_POOL=[
 {by:'ines',text:"Plage après les cours, ça ne se refuse pas 🌅",scene:'plage'},{by:'noah',text:"Qui joue au basket demain midi ? 🏀",scene:'basket'},
 {by:'kylian',text:"Récré légendaire aujourd'hui 😎",scene:'cour'},{by:'jade',text:"j'ai fini mon livre en une nuit et je ne regrette rien 📚"},
 {by:'sacha',text:"Répétition terminée, le son arrive bientôt 🎤",scene:'chambre'},{by:'maelle',text:"La soirée de vendredi se prépare… liste des invités secrète 🤫",scene:'soiree'},
 {by:'potins',text:"[Anonyme] : deux personnes de terminale se sont disputées à la cantine. Devinez qui 👀"},{by:'maelle',text:"Cantine du jour, au moins on rigole 😂",scene:'cantine'},
 {by:'anais',text:"Séance de sport du jour : validée 💪",scene:'plage'},{by:'anais',text:"Qui vient taper la balle à la récré ? Je vous attends 😄",scene:'cour'},{by:'anais',text:"Entraînement au gymnase ce soir, on lâche rien 💪🔥",scene:'basket'},{by:'kylian',text:"1 contre 1 au gymnase, j'ai gagné (évidemment) 😎",scene:'basket'},
 {by:'maelle',text:"Rendez-vous aux casiers à la pause, j'ai un truc à vous montrer 👀",scene:'couloir'},{by:'kenza',text:"Pause selfie entre deux cours 😘",scene:'couloir'},{by:'eva',text:"Croquis de la cour à la récré 🎨",scene:'cour'},{by:'kenza',text:"Choré de danse en préparation, vous allez adorer 💃",scene:'basket'},{by:'ines',text:"Entre deux cours avec ma meilleure 💕",scene:'couloir'},{by:'ines',text:"Soirée skincare et série coréenne dans ma chambre 🥰✨",scene:'chambre'},{by:'sacha',text:"Le couloir a une super acoustique, je dis ça je dis rien 🎶",scene:'couloir'}];
const TONES={
 gentil:{label:'Gentil',d:5,l:1,cls:'pos',lines:["Trop bien {n} 😍","Je valide à 100 %","Tu es au top !"],reply:["merci 🥰","t'es trop chou","❤️❤️"]},
 drole:{label:'Drôle',d:3,l:0,cls:'pos',lines:["Mdr je suis mort 😂","Le niveau de drama ce matin 🤣","J'ai ri beaucoup trop fort"],reply:["😂😂","t'es bête mdr","je savais que ça te ferait rire"]},
 neutre:{label:'Neutre',d:1,l:0,cls:'neu',lines:["Ok","Intéressant…","Vu 👀"],reply:["ok…","👍"]},
 moqueur:{label:'Moqueur',d:-4,l:-1,cls:'neg',lines:["Personne n'a demandé 🙄","Encore toi ?","On s'en passerait bien"],reply:["sérieux ?","ok, je retiens 😒","t'es jaloux ou quoi"]},
 mechant:{label:'Méchant',d:-8,l:-4,cls:'neg',lines:["C'est vraiment nul","Franchement, tu abuses","Arrête de poster, s'il te plaît"],reply:["wow… ok.","je ne te pensais pas comme ça"]}
};
function npcComment(id){const r=G.rel[id].ami;const tone=r>=65?pickR(['gentil','drole']):r>=30?pickR(['drole','neutre','gentil']):r>=0?pickR(['neutre','neutre','gentil']):pickR(['moqueur','neutre']);return mkC(id,genderize(pickR(TONES[tone].lines).replace('{n}',me().name||''),id),{tone})}

/* ---------- objectifs ---------- */
const OBJ=[
 {id:'talk2',day:1,t:"Parle à 2 camarades pendant une pause",gems:5,c:()=>G.st.talks>=2},
 {id:'notes1',day:1,t:"Prends des notes pendant un cours",gems:3,c:()=>G.st.notes>=1},
 {id:'msg1',day:1,t:"Envoie un message à quelqu'un",gems:3,c:()=>G.st.msgs>=1},
 {id:'lunch',day:2,t:"Déjeune à la cantine avec quelqu'un",gems:5,c:()=>G.st.lunchWith>=1},
 {id:'grade12',day:2,t:"Obtiens une note de 12 ou plus",gems:6,c:()=>G.grades.some(g=>g.v>=12)},
 {id:'post1',day:2,t:"Publie un post ou une story",gems:3,c:()=>G.st.posts+G.st.stories>=1},
 {id:'friend',day:3,t:"Deviens ami·e avec quelqu'un (amitié 65)",gems:8,c:()=>NPCS.some(n=>G.rel[n.id].ami>=65)},
 {id:'outing',day:3,t:"Sors avec un camarade après les cours",gems:8,c:()=>G.st.outings>=1},
 {id:'avg13',day:4,t:"Atteins 13 de moyenne (3 notes minimum)",gems:10,c:()=>G.grades.length>=3&&avg()>=13},
 {id:'clean',day:4,t:"Passe une journée de cours sans te faire prendre",gems:6,c:()=>G.st.cleanDays>=1},
 {id:'family',day:5,t:"Discute avec un membre de ta famille",gems:4,c:()=>G.st.famTalks>=1},
 {id:'insep',day:6,ace:1,t:"Deviens inséparable de quelqu'un (amitié 75)",gems:10,c:()=>NPCS.some(n=>G.rel[n.id].ami>=75)},
 {id:'famout',day:5,t:"Fais une sortie en famille",gems:6,c:()=>(G.st.famOut||0)>=1},
 {id:'crush',day:6,rom:1,t:"Fais craquer quelqu'un (amour 50)",gems:10,c:()=>NPCS.some(n=>G.rel[n.id].amour>=50)},
 {id:'bff',day:8,t:"Trouve ton ou ta meilleure amie (amitié 85)",gems:15,c:()=>NPCS.some(n=>G.rel[n.id].ami>=85)},
 {id:'couple',day:10,rom:1,t:"Vis ta première histoire de cœur",gems:20,c:()=>!!G.partner},
 {id:'avg15',day:12,t:"Atteins 15 de moyenne (6 notes minimum)",gems:20,c:()=>G.grades.length>=6&&avg()>=15},
 {id:'eval10',day:3,t:"Obtiens au moins 10 de note globale à une évaluation du vendredi",gems:8,c:()=>G.evals.some(e=>e.glob>=10)},
 {id:'tri1',day:5,t:"Obtiens la moyenne au 1er trimestre",gems:25,c:()=>G.bulletins.some(b=>b.tri===1&&b.ok)},
 {id:'tri2',day:85,t:"Obtiens la moyenne au 2e trimestre",gems:25,c:()=>G.bulletins.some(b=>b.tri===2&&b.ok)},
 {id:'tri3',day:169,t:"Obtiens la moyenne au 3e trimestre",gems:25,c:()=>G.bulletins.some(b=>b.tri===3&&b.ok)},
 {id:'igfollow',day:2,t:"Abonne-toi à 3 comptes Insta",gems:3,c:()=>Object.keys(G.ig.following).length>=3},
 {id:'igreply',day:2,t:"Réponds à un commentaire sous un post",gems:3,c:()=>(G.st.replies||0)>=1},
 {id:'igfans',day:5,t:"Fais-toi suivre par 3 camarades sur Insta",gems:6,c:()=>igFollowers().length>=3},
 {id:'bac',day:236,t:"Décroche ton bac",gems:60,c:()=>!!(G.bac.result&&G.bac.result.ok)}];
function avg(){return G.grades.length?G.grades.reduce((a,g)=>a+g.v,0)/G.grades.length:null}
function triAvg(t){const ev=G.evals.filter(e=>e.tri===t);return ev.length?mean(ev.map(e=>e.glob)):null}
function checkObjectives(){
 /* récompense des objectifs : remplace l'ancienne pub (+5 ⚡) */
 OBJ.filter(o=>objOk(o)&&o.day<=G.day&&!G.objDone.includes(o.id)&&o.c()).forEach(o=>{G.objDone.push(o.id);G.gems+=o.gems;G.energy=clamp(G.energy+OBJ_ENERGY,0,100);note(P(`Objectif atteint : ${o.t} (+${OBJ_ENERGY} ⚡${gemTxt(`, +${o.gems} gemmes`)})`));toast(P(`🎯 Objectif atteint : ${o.t} · +${OBJ_ENERGY} ⚡`));drawHUD()});
}

/* ---------- état ---------- */
function initLinks(){const L={};NPCS.forEach(a=>{L[a.id]={};NPCS.forEach(b=>{if(a.id!==b.id){const v=LINKS0[a.id+'>'+b.id]||[40,0];L[a.id][b.id]={ami:v[0],amour:attracted(FICHES[a.id].o,FICHES[a.id].g,FICHES[b.id].g)?v[1]:0}}})});return L}
const mkPost=o=>Object.assign({id:'p'+Date.now()+Math.floor(Math.random()*1e5),day:G?G.day:0,min:G?G.min:0,c:0,r:0,l:0,comments:[],liked:false,rt:false,fav:false,mine:false},o);
function newGame(fam){
 const g={day:1,min:7*60+30,energy:85,bonus:4,nextAt:Date.now()+RECHARGE,gems:45,events:0,
  rel:Object.fromEntries(NPCS.map(n=>[n.id,{ami:0,amour:0}])),links:initLinks(),couples:[['kylian','eva']],partner:null,
  family:fam.map((f,i)=>({role:f.role,name:f.name,trait:f.trait,id:'fam'+i,av:f.av||famAvatar(f.role,f.seed??hash(f.name+f.role+i))})),famRel:{},
  posts:START_POSTS.map(p=>{const q=mkPost({...clone(p),photo:p.photo&&{...p.photo,author:p.by}});q.day=0;q.min=900+Math.floor(Math.random()*480);q.comments.forEach(c=>c.id=mkC().id);if(p.by==='jade'){q.poem=true;q.comments.push(...debateThread(q))}return q}),
  met:{},talks:{},postQ:[],ig:{bio:'Terminale 📚 · Guadeloupe 🌴',priv:true,fans:12,following:{},followers:{},reqs:[],once:{}},
  stories:START_STORIES.map((s,i)=>({id:'st'+i,...s,photo:s.photo&&{...s.photo,author:s.by},seen:false,reacted:false})),
  log:[],unread:0,threads:{},unreadMsg:{},plans:[],lastPing:{},confessed:{},confessAns:{},
  know:Object.fromEntries(Object.keys(SUBJ).map(k=>[k,40])),grades:[],acts:0,cb:0,done:{},place:null,placeKey:null,pres:null,phaseKey:null,lastPhase:null,paused:false,
  objDone:[],st:{talks:0,notes:0,msgs:0,lunchWith:0,posts:0,outings:0,cleanDays:0,famTalks:0,comments:0,stories:0,caughtToday:false,schoolToday:false},adAt:0,ate:false,rested:false,outing:null,evals:[],bulletins:[],bac:{scores:{},bonus:{}},evalBonus:{},clubs:[],clubXP:{},marks:[],gstate:{},evOnce:[],studied:{},pend:[]};
 g.family.forEach(f=>g.famRel[f.id]=65);
 applyParcours(g);
 return g;
}
let G=(()=>{try{const v=localStorage.getItem(GKEY);return v?JSON.parse(v):null}catch(e){return null}})();
if(G&&G.family&&!G.dressFix){G.dressFix=1;G.family.forEach(f=>{if(f.av&&f.av.dress==='bretelles')f.av.dress='aucune'})}
if(G&&G.family)G.family.forEach(f=>{if(f.av&&!f.av.rides)f.av.rides=/Grand-/.test(f.role)?'marquees':/Mère|Père|Belle-mère|Beau-père|Tante|Oncle/.test(f.role)?'fines':'aucune'});
if(G&&G.rel){NPCS.forEach(n=>{if(!G.rel[n.id])G.rel[n.id]={ami:0,amour:0}});const L0=initLinks();G.links=G.links||{};for(const a in L0){G.links[a]=G.links[a]||{};for(const b in L0[a])if(!G.links[a][b])G.links[a][b]=L0[a][b]}
 if(!G.meishaIn){G.meishaIn=1;if(G.posts&&!G.posts.some(x=>x.by==='meisha'))G.posts.unshift(mkPost({...MEISHA_POST,photo:{...MEISHA_POST.photo,author:'meisha'}}))}
 if(!G.jessicaIn){G.jessicaIn=1;if(G.posts&&!G.posts.some(x=>x.by==='jessica'))G.posts.unshift(mkPost({...JESSICA_POST,photo:{...JESSICA_POST.photo,author:'jessica'}}))}
 if(!G.noemieIn){G.noemieIn=1;if(G.posts&&!G.posts.some(x=>x.by==='noemie'))G.posts.unshift(mkPost({...NOEMIE_POST,photo:{...NOEMIE_POST.photo,author:'noemie'}}))}
 if(!G.evaIn){G.evaIn=1;G.couples=G.couples||[];if(G.partner!=='kylian'&&!G.couples.some(c=>c.includes('kylian')||c.includes('eva')))G.couples.push(['kylian','eva']);if(G.posts&&!G.posts.some(x=>x.by==='kylian'&&x.photo&&x.photo.people.includes('eva')))G.posts.unshift(mkPost({...EVA_POST,photo:{...EVA_POST.photo,author:'kylian'}}))}
 if(!G.kenzaIn){G.kenzaIn=1;if(G.posts&&!G.posts.some(x=>x.by==='kenza'))G.posts.unshift(mkPost({...KENZA_POST,photo:{...KENZA_POST.photo,author:'kenza'}}))}
 if(!G.anaisIn){G.anaisIn=1;if(G.posts&&!G.posts.some(x=>x.by==='anais'))G.posts.unshift(mkPost({...ANAIS_POST,photo:{...ANAIS_POST.photo,author:'anais'}}))}}
/* Insta : abonnements et identifiants de commentaires (pour répondre) */
if(G&&G.posts){G.talks=G.talks||{};if(!G.postQ)planPosts();G.posts.forEach((p,i)=>{if(p.day==null){p.day=Math.max(0,G.day-Math.floor(i/5));p.min=1200-(i%5)*120}});if(!G.met){G.met={};Object.keys(G.threads||{}).forEach(id=>{if(FICHES[id]&&G.threads[id].length)G.met[id]=3})}if(!G.ig)G.ig={bio:'Terminale 📚 · Guadeloupe 🌴',priv:true,fans:12,following:{},followers:{},reqs:[],once:{}};G.posts.forEach(p=>(p.comments||[]).forEach(c=>{if(!c.id)c.id=mkC().id}))}
if(G){G.evals=G.evals||[];G.bulletins=G.bulletins||[];G.bac=G.bac||{scores:{}};G.bac.bonus=G.bac.bonus||{};G.evalBonus=G.evalBonus||{};G.clubs=G.clubs||(G.club?[{ines:'danse',kylian:'foot',maelle:'danse',noah:'basket',jade:'journal',anais:'hand',kenza:'danse',eva:'arts',noemie:'foot',jessica:'journal',meisha:'journal',sacha:'musique'}[G.club]].filter(Boolean):[]);G.clubXP=G.clubXP||{};G.speed=G.speed||1;G.marks=G.marks||[];G.gstate=G.gstate||{};G.evOnce=G.evOnce||[];G.studied=G.studied||{};G.pend=G.pend||[]}
/* sauvegarde en ligne (js/cloud.js) : ne fait rien sans compte */
const cloudPush=()=>{if(window.CLOUD)window.CLOUD.push()};
function saveG(){try{localStorage.setItem(GKEY,JSON.stringify(G))}catch(e){}cloudPush()}
function note(t){G.log.push({t,day:G.day,at:fmtT(G.min)});G.log=G.log.slice(-120);G.unread++}
let view='home';

/* ---------- IA ---------- */
let SAMPLE=null;
(async()=>{try{SAMPLE=(window.claude&&window.claude.use)?await window.claude.use('sample'):null}catch(e){SAMPLE=null}})();
function persona(id){
 if(isFam(id)){const f=famById(id);return `Tu es ${f.name}${me().nom?' '+me().nom:''}, ${f.role.toLowerCase()} de ${nameOf('me')} (${P('lycéen·ne')} en Guadeloupe). Caractère : ${f.trait}. Tu écris comme un membre de la famille, avec affection et selon ton caractère. Complicité avec ${nameOf('me')} : ${G.famRel[id]}/100.`}
 const f=FICHES[id],n=WHO[id],r=G.rel[id],c=coupleOf(id);
 return `Tu es ${n.name} ${n.nom||''} (${n.handle}), ${f.age} ans, en terminale dans un lycée de Guadeloupe.
Passé : ${f.passe}
Famille : ${f.famille}
Qualités : ${f.qualites}. Défauts : ${f.defauts}.
Peurs : ${f.peurs}. Passions : ${f.passions}.
Façon de parler : ${f.parle}.
Genre : ${f.g==='f'?'fille':'garçon'}. Orientation : ${oriLabel(f.o,f.g)}.
${markNote(id)}${G.rival===id?`Tu es en rivalité avec ${nameOf('me')} cette année : tu ne lui fais pas de cadeau.\n`:''}Relations : ${f.relations}. Situation amoureuse : ${c==='me'?'en couple avec '+nameOf('me'):c?'en couple avec '+WHO[c].name:'célibataire'}.
${(G.met[id]||0)<3?`IMPORTANT : ${nameOf('me')} est ${nouv()} au lycée cette année et tu ne ${me().sexe==='f'?'la':me().sexe==='m'?'le':'la ou le'} connais pas encore. Comporte-toi comme avec quelqu'un que tu découvres : pose-lui une question pour faire connaissance (d'où ${me().sexe==='f'?'elle':me().sexe==='m'?'il':'iel'} vient, ce qu'${me().sexe==='f'?'elle':me().sexe==='m'?'il':'iel'} aime, son ancien lycée, sa famille…) et ne fais pas comme si vous aviez des souvenirs ensemble.\n`:''}${seatToday()===id?`Aujourd'hui, en cours, ${nameOf('me')} a choisi de s'asseoir à côté de toi.\n`:''}Ce que tu ressens pour ${nameOf('me')} : amitié ${r.ami}/100, amour ${r.amour}/100. ${ressentiShort(id)}
${nameOf('me')} : personnalité « ${persoL(me().perso,me().sexe)} »${(G.met[id]||0)>=3?`, vient du ${me().ancien||'un autre lycée'} (raison du changement : ${gtxt(RAISONS[me().raison]||'',me().sexe).replace(/^Ta |^Tes /,'sa ').replace(/^La séparation de tes/,'la séparation de ses').replace(/ton ancien/,'son ancien')})`:` (tu ne sais pas encore d'où ${me().sexe==='m'?'il':'elle'} vient ni pourquoi ${me().sexe==='m'?'il':'elle'} a changé de lycée, sauf si ${me().sexe==='m'?'il':'elle'} te l'a dit)`}.
${nameOf('me')} est ${SEXL[me().sexe]}${me().sexe==='f'?' : parle-lui au féminin (accords, « la nouvelle », « contente »…)':me().sexe==='m'?' : parle-lui au masculin (accords, « le nouveau », « content »…)':' : utilise des formulations neutres pour parler de cette personne'}. ${npcLikesMe(id)?'':S(id,`Tu n'es pas attiré·e par son genre : si ${nameOf('me')} te drague, reste gentil·le mais fais comprendre que c'est amical, et garde "amour" à 0.`)}`;
}
function buildPrompt(id){
 const me=nameOf('me'),ph=phase();
 const th=(G.threads[id]||[]).slice(-14).map(m=>`${m.from==='me'?me:nameOf(id)} : ${m.text}`).join('\n');
 const mem=G.log.filter(l=>l.t.includes(nameOf(id))).slice(-5).map(l=>'- '+l.t).join('\n')||'- rien de notable';
 return `${persona(id)}

Souvenirs récents liés à ${me} :
${mem}

Moment présent : ${fmtDay(G.day,true)}${dayLbl(G.day)?' ('+dayLbl(G.day)+')':''}, ${fmtT(G.min)} (${ph.lbl||PLABEL[ph.type]}${ph.sub?' de '+SUBJ[ph.sub]:''}). C'est l'année de terminale : évaluation commune chaque vendredi après-midi, bac les ${BAC_DAYS.map(x=>fmtDay(schoolDayToCal(x),true)).join(' et ')} (on est au jour de cours ${Math.min(sdDone(G.day),YEAR_DAYS)}/${YEAR_DAYS}).

Conversation par messages (la plus récente en bas) :
${th}

Écris la prochaine réponse de ${nameOf(id)} comme une vraie personne qui envoie un message : 1 à 3 phrases courtes, uniquement en français (jamais en créole), avec sa façon de parler. Réponds à ce que ${me} vient d'écrire et varie les sujets : ne ramène pas sans cesse la conversation sur la nourriture ni sur une seule passion. Reste cohérent avec la personnalité et les sentiments : tu peux être vexé·e, distant·e, enthousiaste ou taquin·e selon ce que ${me} a écrit. Les histoires de cœur restent douces et adaptées à des lycéens, sans contenu sexuel. Ne dis jamais que tu es une IA ou un personnage.
Réponds uniquement avec un objet JSON :
{"reponse":"ton message","amitie":entier de -6 à 6,"amour":entier de -6 à 6,"proposition":null}
"amitie" et "amour" mesurent l'effet du dernier message de ${me} sur tes sentiments. Si tu proposes une sortie, remplace null par {"lieu":"plage|centre|glacier","quand":"ce soir|demain"}.`;
}
function sentiment(t){t=t.toLowerCase();if(/(nul|ferme[ -]la|idiot|débile|moche|dégage|tais-toi|je te déteste|chiant|bête|pathétique)/.test(t))return -1;if(/(merci|cool|trop bien|génial|j'adore|❤|😍|🥰|mdr|ptdr|haha|bravo|bisou|beau|belle|mignon|gentil|super|top|manqué|t'aime)/.test(t))return 1;return 0}
/* ---------- réponses de secours (sans IA) : selon le sujet du message, la personnalité, sans se répéter ---------- */
const TOPICS=[
 ['salut',/^(salut|coucou|bonjour|bonsoir|hey|yo|wesh|wsh|slt|cc)\b/],
 ['cava',/(ça va|ca va|cv\b|comment tu vas|la forme|tu vas bien)/],
 ['weekend',/(week-end|weekend|samedi|dimanche|ce soir|demain|sortir|sortie|plage|glacier|cinéma|cinema|soirée|soiree)/],
 ['origine',/(commune|d'où|d ou|tu viens|t'habites|tu habites|habite où|quel lycée|ancien lycée)/],
 ['activite',/(tu fais quoi|tu fais koi|tfq|t'es où|t es ou|tu es où|qu'est-ce que tu fais)/],
 ['lecture',/(lis\b|lire|livre|roman|manga|poème|poeme|poésie|écris|ecris|écrire)/],
 ['spe',/(spé(?![a-zà-ÿ])|spés\b|spécialité|specialite)/],
 ['ecole',/(lycée|cours|devoir|maths|philo|physique|français|anglais|espagnol|svt|histoire|contrôle|controle|interro|bac|prof|note|réviser|reviser|exam)/],
 ['sport',/(foot|basket|hand|sport|match|entraînement|entrainement|courir|footing|gym)/],
 ['musique',/(musique|son|chanson|zouk|gwo ka|gwoka|rap|dancehall|guitare|écoute|ecoute|playlist|danse)/],
 ['famille',/(famille|parents|mère|mere|père|pere|maman|papa|frère|frere|sœur|soeur|grand-mère|mamie)/],
 ['amour',/(crush|amoureux|amoureuse|copain|copine|tu me plais|je t'aime|t'aime|sortir avec|célibataire|celibataire|en couple|bisou)/],
 ['potins',/(potins|rumeur|drama|insta|post|story|tu as vu|t'as vu)/],
 ['fatigue',/(fatigué|fatigue|crevé|creve|dormir|sommeil|ennui|m'ennuie|ennuyer|nul aujourd)/],
 ['manger',/(manger|faim|cantine|déjeuner|dejeuner|repas|goûter|gouter|colombo|bokit|accras)/],
 ['merci',/(merci|trop gentil|c'est gentil)/]];
const REP={
 ines:{spe:["Moi j'ai pris HLP et anglais ✨","HLP et anglais ! Et toi ? 🥺"],origine:["À la base je viens de Martinique, maintenant on habite aux Abymes ✨","Martinique ➜ Guadeloupe, et toi ? 🥺"],lecture:["Moi je lis surtout des webtoons 🥺","Je lis pas trop, je regarde des K-dramas 😅"],salut:["Coucou toi ✨","Heyy 🥰 ça fait plaisir"],cava:["Ça va et toi ? Moi un peu fatiguée mais ça va 🥺","Super bien ! J'ai appris une nouvelle choré 💃"],activite:["Je regarde mon K-drama 🥺 et toi ?","Je garde mon petit frère, il me rend folle 😅"],
  ecole:["J'ai rien compris au dernier cours 🥺 tu m'expliques ?","Le contrôle m'a stressée de ouf"],sport:["Moi c'est la danse mon sport 💃","Le foot c'est pas trop mon truc, mais j'aime bien regarder ✨"],musique:["Dancehall forever 💃✨","Tu connais le dernier son qui tourne ? Je l'écoute en boucle 🎧"],
  weekend:["Samedi je suis libre ! On fait un truc ? ✨","Plage ce week-end avec Maëlle, tu viens ? 🌴"],famille:["Ma mère est infirmière, elle rentre tard… alors je garde Enzo 🥺","Mon petit frère Enzo c'est un phénomène 😂"],
  amour:["Ohh tu me racontes ? 👀💕","Moi l'amour… c'est compliqué 🥺"],potins:["Raconte !! 👀","J'ai vu ça ! Maëlle va encore faire un drama 😅"],fatigue:["Pareil, j'ai trop sommeil 🥺","Va te reposer mon cœur 💕"],manger:["J'ai trop faim 😩","La cantine aujourd'hui… pas ouf 🥺"],merci:["De rien mon cœur 💕","Avec plaisir ✨"],
  q:["Bonne question 🥺 je sais pas trop","Hmm… je dirais oui ? ✨","Ça dépend ! Et toi ?"],def:["Ah ouais ? Raconte ✨","Hmm je vois 🥺","Trop bien ça","Ah d'accord 🥰","C'est vrai que…","Tu m'étonnes 😅"]},
 kylian:{spe:["moi SES et EPS frr, logique","SES et sport, tranquille"],origine:["moi Saint-François frr, au bord de l'eau 🎣","Saint-François, le meilleur coin"],lecture:["frr je lis que les résultats de foot 😂","lire ? moi ? mdrr"],salut:["wsh bien ou quoi","yo"],cava:["tranquille et toi ?","ça va frr, un peu crevé avec l'entraînement"],activite:["je joue à FIFA tkt","je traîne dans la cour, viens"],
  ecole:["frr me parle pas des cours 😭","j'ai pas fait les devoirs, tu me les passes ?"],sport:["le foot c'est la vie frr ⚽","t'as vu mon but au dernier match ? 😎","viens jouer à la récré"],musique:["moi j'écoute du rap, le zouk c'est pour Sacha 😂","mets un son là"],
  weekend:["ce week-end match, après on peut traîner","pêche avec mon père samedi 🎣"],famille:["mon père est pêcheur, il me réveille à 5 h 😭","mon grand-père c'est un boss"],amour:["frr parle pas de ça 😅","t'as quelqu'un en tête toi ? 👀"],
  potins:["les Potins racontent n'importe quoi sur moi 🙄","wsh qui a encore balancé ?"],fatigue:["moi aussi je suis mort","dors frr"],manger:["j'ai la dalle","un bokit là ça passerait trop"],merci:["tkt","normal frr"],
  q:["bonne question frr","jsp trop, et toi ?","ça dépend"],def:["ah ouais ?","sérieux ?","mdr t'es marrant·e","vas-y raconte","ok ok","ah bon","c'est chaud ça"]},
 maelle:{spe:["SES et langues, littéralement parfait pour moi 💅","SES et LLCE anglais 💅"],origine:["Le Gosier chez ma mère, Pointe-à-Pitre chez mon père 🙄","Le Gosier, évidemment 💅"],lecture:["Je lis les magazines de mode, ça compte ? 💅","Lire c'est le truc de Jade 🙄"],salut:["Coucou 💅","Hey !"],cava:["Ça va, littéralement épuisée par les répétitions 📣","Super ! Et toi ?"],activite:["Je prépare la soirée de vendredi 💅","Shopping en ligne, comme d'hab"],
  ecole:["Les cours… littéralement l'enfer 🙄","J'ai copié sur Jade, chut 🤫"],sport:["Moi c'est pom-pom, c'est un sport, ok ? 📣","Le hand d'Anaïs ? Genre c'est intense"],musique:["Mets du dancehall, on danse 💃","La playlist de la soirée sera parfaite, fais-moi confiance"],
  weekend:["Soirée chez moi samedi, t'es sur la liste… peut-être 💅","Centre-ville samedi, shopping obligatoire"],famille:["Mes parents… c'est compliqué depuis le divorce 🙄","Ma sœur est à Paris, elle me manque"],
  amour:["Ohh dis-moi tout 👀💅","Genre t'as un crush ? Qui ??"],potins:["J'ai LITTÉRALEMENT tout vu 👀","Les Potins, je sais qui c'est… je dirai rien 🤐"],fatigue:["Moi aussi, mais je suis toujours belle 💅","Dors, t'as une tête de zombie 😂"],
  manger:["La cantine ? Jamais 🙄","On va au snack ?"],merci:["Je sais, je suis géniale 💅","De rien !"],q:["Genre ? Pourquoi tu demandes ? 👀","Évidemment","Bonne question… je dirais non 🙄"],def:["Genre ?","Mouais","Ok et ?","Intéressant 👀","Littéralement","Hmm, si tu le dis"]},
 noah:{spe:["Maths et physique… je galère ptdr","Maths-physique frère"],origine:["Baie-Mahault, dans une maison toujours pleine ptdr","Moi Baie-Mahault"],lecture:["Moi c'est les mangas, j'en ai plein","Tu lis des mangas toi ?"],salut:["Salut frère","Hey 👋"],cava:["Ça va bien, et toi ?","Ça va, j'ai bien mangé chez ma grand-mère 😄"],activite:["Je lis un manga","Je fais mes devoirs… enfin j'essaie ptdr"],
  ecole:["T'as compris l'exo ? Moi pas trop","Je peux t'aider en physique si tu veux"],sport:["Basket jeudi, viens nous voir 🏀","Le sport ça vide la tête"],musique:["J'écoute un peu de tout","Sacha fait des sons de fou"],
  weekend:["Ce week-end je cuisine avec mamie","On peut aller au glacier si tu veux"],famille:["Chez moi c'est toujours plein de monde ptdr","Mes sœurs me rendent fou"],amour:["Euh… je sais pas trop quoi dire 😅","Moi je suis nul pour ces trucs-là"],
  potins:["Je lis pas trop les Potins","Encore un drama ?"],fatigue:["Pareil frère","Repose-toi"],manger:["J'ai faim aussi","Ma grand-mère fait le meilleur colombo"],merci:["De rien 🙏","Avec plaisir"],
  q:["Hmm, peut-être","Je sais pas trop, et toi ?","Bonne question frère"],def:["Ah ok","Ouais je vois","Ptdr","Ah bon ?","C'est vrai","Intéressant"]},
 jade:{spe:["hlp et humanités. évidemment.","hlp. et maths, pour le plaisir."],origine:["sainte-anne. chez ma grand-mère, près de la mer.","sainte-anne."],lecture:["oui. des poèmes, surtout. et toi, tu lis quoi ?","j'écris un peu. je ne montre presque jamais."],salut:["bonjour.","salut."],cava:["ça va. je lis.","ça va. le ciel était beau ce matin."],activite:["je lis au cdi.","j'écris."],ecole:["j'ai déjà fini les exercices. tu veux de l'aide ?","le cours de philo était passionnant. vraiment."],
  sport:["le sport et moi, c'est compliqué.","je préfère marcher au bord de la mer."],musique:["j'aime le silence. et parfois sacha.","le gwo ka, ça me parle."],weekend:["ce week-end, étoiles depuis la plage de sainte-anne.","je reste avec ma grand-mère."],
  famille:["je vis avec ma grand-mère. elle sait tout.","mes parents sont en métropole."],amour:["l'amour, c'est un poème qu'on n'ose pas finir.","pourquoi cette question ?"],potins:["les potins ne m'intéressent pas.","encore un drama de maëlle ?"],
  fatigue:["dors. le monde attendra.","moi aussi. trop de livres, pas assez de nuits."],manger:["je mange au cdi. chut.","un thé suffira."],merci:["de rien.","avec plaisir. sincèrement."],
  q:["bonne question. je n'ai pas de réponse.","peut-être. et toi ?","ça dépend du point de vue."],def:["intéressant.","développe.","hmm.","je vois.","c'est noté.","pas mal."]},
 meisha:{spe:["SES et anglais, pour bosser dans la mode 💅","SES, comme Kenza 😂"],origine:["Baie-Mahault, même rue que Kenza 😂 et toi ?","Baie-Mahault, à cinq minutes de Jarry, c'est pas un hasard 🛍️"],lecture:["Les magazines de mode, je les dévore 📖","Je lis… les étiquettes des prix 😂"],salut:["Coucou 😘","Heyyy 💅"],cava:["Trop bien, j'ai trouvé un top à 5 € 😍","Ça va, et toi ?"],activite:["Je scrolle des tenues sur TikTok 📱","J'écris ma rubrique mode pour le journal ✍️"],
  ecole:["Les cours… je dessine des tenues dans la marge 😅","Si tu m'expliques les maths, je t'habille gratuitement 😂"],sport:["Le shopping, c'est du cardio 😂","Je marche beaucoup à Jarry, ça compte ?"],musique:["Dancehall et R&B, comme ma jumelle Kenza 💃","Les sons TikTok du moment 😂"],
  weekend:["Shopping à Jarry avec Kenza 🛍️","Soirée pyjama chez Kenza, comme d'hab 💅"],famille:["Ma mère a une boutique à Jarry, j'ai grandi entre les cintres 😂","Ma grand-mère critique toutes mes tenues 🙄 mais je l'adore"],amour:["Plein de garçons m'écrivent, mais aucun ne me fait vibrer 😏","Hihi pourquoi, t'as un nom ? 👀"],
  potins:["Raconte, raconte 👀","Jsuis morte, qui t'a dit ça ? 😂"],fatigue:["Pareil, j'ai trop marché à Jarry 😴","Masque visage et dodo 💆‍♀️"],manger:["Smoothie et cookies à Jarry 😋","Sushis avec Kenza ce soir 🍣"],merci:["De rien bébé 😘","Avec plaisir 💅"],
  q:["Jsp, et toi ?","Peut-être 😏","Faut demander à Kenza 😂"],def:["Trop beau 😍","Ah ouais ?","Jsuis morte 😂","Raconte","Mmh 💅","J'adore"]},
 jessica:{spe:["Maths et physique-chimie 📐","Maths et physique, pour la prépa ✏️"],origine:["Les Abymes 😊 et toi ?","Les Abymes, juste à côté du lycée"],lecture:["Des romans policiers, j'adore deviner le coupable 🔍","Agatha Christie, toujours 📚"],salut:["Coucou 😊","Salut !"],cava:["Ça va, un peu stressée par le bac 😅","Oui ! Et toi ?"],activite:["Je prépare les exercices pour lundi ✏️","Je fais réviser mon petit frère"],
  ecole:["Si tu bloques sur un exo, viens au cours particulier 📚","On reprend ensemble quand tu veux"],sport:["Le sport… je marche jusqu'au CDI, ça compte ? 😅","Je préfère les sudokus"],musique:["De la musique calme pour réviser 🎧","Un peu de tout"],
  weekend:["Pâtisserie et révisions 🧁","Je prépare mes fiches pour la semaine"],famille:["Mes parents sont pharmaciens, ils veulent que je fasse médecine… on verra","Mon petit frère Hugo me rend folle mais je l'adore"],amour:["L'amour ? Je n'ai pas le temps avec le bac 😅","Pourquoi cette question ? 🙈"],
  potins:["Les potins, ça ne fait pas réussir le bac 😅","Je préfère ne pas m'en mêler"],fatigue:["Dors bien, le cerveau retient mieux après une nuit 😊","Moi aussi… trop de fiches"],manger:["J'ai fait des cookies, tu en veux ? 🍪","La cantine, c'est mieux que rien 😅"],merci:["Avec plaisir 😊","C'est normal, on s'entraide"],
  q:["Bonne question, réfléchissons ensemble 🤔","Je pense que oui, mais vérifie","Ça dépend"],def:["D'accord 😊","Intéressant","Je vois","Ah oui ?","Tu vas y arriver","Super"]},
 noemie:{spe:["SES et EPS ⚽","Sport, évidemment 😂"],origine:["Morne-à-l'Eau 💪 et toi ?","Morne-à-l'Eau, terre de footballeurs ⚽"],lecture:["Des bios de joueuses, ça compte ? 😂","Le journal sportif, c'est tout"],salut:["Wesh ! 😄","Salut toi ⚽"],cava:["Tranquille, un peu courbaturée 😂","Ça va, et toi ?"],activite:["Je jongle dans le jardin ⚽","Je regarde un match"],
  ecole:["Les cours… je préfère le terrain 😅","On révise ensemble ? Je ramène les snacks"],sport:["Le foot c'est ma vie ⚽🔥","Viens jouer à la récré, je te fais une passe 😂"],musique:["Dancehall avant les matchs pour la motivation 🔥","Mes frères écoutent que du rap, j'ai pas le choix 😂"],
  weekend:["Match samedi, viens nous encourager ⚽","Foot sur la plage avec mes frères"],famille:["Trois grands frères, tous footeux, tu imagines le bruit 😂","Ma mère fait le meilleur colombo du monde 🍛"],amour:["L'amour ? J'ai entraînement 😂","Pourquoi, tu veux me présenter quelqu'un ? 👀"],
  potins:["Les potins, très peu pour moi 😂","Encore Maëlle qui parle ?"],fatigue:["Pareil, l'entraînement m'a tuée 😴","Dors, champion·ne"],manger:["Bokit après le match 🤤","J'ai une faim de footballeuse 😂"],merci:["De rien 💪","Normal, on est ensemble"],
  q:["Jsp, et toi ?","Peut-être 😂","Bonne question"],def:["Ah ouais ?","Vas-y","Grave","Ahah","Ok ok","Raconte"]},
 eva:{spe:["Arts plastiques et philo 🎨","Arts plastiques, évidemment 🌸"],origine:["Petit-Bourg 🌸 et toi ?","Petit-Bourg, j'adore dessiner la rivière là-bas"],lecture:["Des livres d'art et des BD 📚","Je dessine plus que je lis, pardon 😅"],salut:["Coucou 🌸","Hey toi 💕"],cava:["Oui ça va, et toi ? 🌸","Un peu fatiguée mais ça va 💕"],activite:["Je dessine 🎨","Je peins un coucher de soleil 🌅"],
  ecole:["Je dessine dans les marges, chut 🤫","On peut réviser ensemble si tu veux 🌸"],sport:["Moi je viens surtout encourager Kylian 😅⚽","Le sport c'est pas trop mon truc 🙈"],musique:["Musique douce pour dessiner 🎧","Sacha m'a fait écouter son nouveau son, trop beau 💕"],
  weekend:["Plage avec Kylian ce week-end 🌅💕","Je vais peindre au bord de la rivière"],famille:["Ma petite sœur Lou veut tout faire comme moi 🥹","Ma mère est prof d'arts plastiques, c'est elle qui m'a tout appris"],amour:["Je suis avec Kylian 💕 il est trop attentionné","Hihi pourquoi tu demandes ? 🙈"],
  potins:["Oh non, encore les Potins… 😅","Je préfère pas m'en mêler 🌸"],fatigue:["Repose-toi bien 💕","Moi aussi, j'ai dessiné jusqu'à minuit 😴"],manger:["Un sorbet coco ? 🥥","J'ai trop faim aussi 😅"],merci:["Avec plaisir 🌸","De rien, c'est normal 💕"],
  q:["Je ne sais pas trop… et toi ?","Peut-être 🌸","Bonne question 😅"],def:["Oh c'est mignon 🌸","Ah oui ?","Je vois 💕","Raconte","Trop bien","Hihi"]},
 kenza:{spe:["Anglais et SES, pour bosser dans la mode plus tard ✨","SES et anglais 💅"],origine:["Baie-Mahault 😘 et toi ?","Baie-Mahault, à côté de Jarry, la zone du shopping 💅"],lecture:["Des magazines de mode, ça compte ? 😅","Je lis surtout les commentaires sous mes photos 😂"],salut:["Coucou toi 😘","Hey bébé ✨"],cava:["Toujours 💅 et toi ?","Ça va, un peu fatiguée mais toujours belle 😂"],activite:["Je choisis ma tenue de demain ✨","Je retouche mes photos 📸"],
  ecole:["Les cours… je fais le minimum avec style 😅","Si on révise ensemble, je ramène les snacks 😘"],sport:["La danse, c'est mon sport 💃","Le sport oui, transpirer non 😂"],musique:["R&B et dancehall, rien d'autre ✨","Je danse sur tout, surtout en soirée 💃"],
  weekend:["Shopping à Jarry samedi, tu viens ? 🛍️","Soirée chez Maëlle, et toi tu fais quoi ? 💋"],famille:["Mon frère surveille tous les garçons qui m'écrivent 🙄","Ma mère a un institut, alors je suis toujours parfaite 😂✨"],amour:["L'amour ? Tout le monde veut sortir avec moi, mais personne ne me connaît vraiment 😏","Hihi pourquoi, t'as quelqu'un en tête ? 👀"],
  potins:["Encore moi dans les Potins ? 😂 ils m'adorent","Raconte, j'adore les potins 👀"],fatigue:["Masque visage et dodo, c'est la solution 💆‍♀️","Moi aussi, j'ai dansé toute la soirée 😴"],manger:["Sushis ou rien 🍣","La cantine ? Jamais de la vie 😂"],merci:["De rien bébé 😘","Avec plaisir ✨"],
  q:["Bonne question… je te dis demain 😏","Jsp, et toi ?","Peut-être 😘"],def:["Trop mignon 🥰","Ah ouais ? ✨","Mmh 😏","Raconte-moi tout","J'adore","Vu 💅"]},
 anais:{spe:["SVT et EPS, évidemment 😄💪","SVT et sport !"],origine:["Sainte-Rose ! 🌴 Et toi ?","Sainte-Rose, la plus belle commune 😄"],lecture:["Je lis des bios de sportifs, ça me motive 💪","Pas trop le temps de lire avec le sport 😂"],salut:["Hey !! 😄","Salut toi ! 🔥"],cava:["Trop bien ! Footing ce matin 💪","Super, et toi ?? 😄"],activite:["Je m'entraîne !","Je cours après mes petits frères 😂"],
  ecole:["Les cours c'est moins drôle que le sport 😂","Allez, on révise ensemble ? 💪"],sport:["Le sport c'est la vie !! 🔥","Viens courir demain à 6 h 😄"],musique:["Playlist de motivation à fond 🔥","Je danse sur tout 😂"],
  weekend:["Match samedi ! Viens m'encourager 🔥","Plage dimanche, on court ensemble ? 🌅"],famille:["Mes petits frères sont des tornades 😂","Mon père est entraîneur, devine d'où je tiens ça 😄"],amour:["Hihi raconte 🙈","L'amour ? J'ai pas le temps, j'ai entraînement 😂"],
  potins:["Haha encore les Potins 😂","Les gens parlent trop !"],fatigue:["Allez, un petit footing et ça repart ! 😂","Dors bien alors 😴"],manger:["J'ai trop faim après le sport 😩","Smoothie mangue ? 🥭"],merci:["De rien ! 😄","Avec plaisir 💪"],
  q:["Bonne question 😂 je dirais oui !","Hmm, je sais pas, et toi ?","Carrément !"],def:["Carrément !","Haha trop bien","Ah ouais ? 😄","Et après ?","Trop fort 😂","C'est ouf ça"]},
 sacha:{spe:["Musique et HLP, gros","Arts-musique, forcément 🎧"],origine:["Lamentin, gros","Moi je suis du Lamentin"],lecture:["J'écris des textes pour mes sons","Je lis des paroles de chansons, c'est de la poésie aussi"],salut:["Yo","Salut, bonne vibe ?"],cava:["Tranquille, la vibe est bonne","Ça va gros, et toi ?"],activite:["Je compose un son 🎧","Je gratte ma guitare au foyer"],
  ecole:["Les cours… j'arrive toujours en retard 😅","La musique devrait compter au bac"],sport:["Moi c'est skate","Le foot c'est le délire de Kylian"],musique:["T'écoutes quoi toi ? 🎧","Le zouk rétro c'est la base","Je t'envoie mon son si tu veux"],
  weekend:["Ce week-end je joue avec ma mère, gwo ka","Viens au foyer, on fait de la musique"],famille:["Mon père veut que je fasse du commerce… pas moi","Ma mère chante, c'est elle qui m'a tout appris"],amour:["L'amour c'est dans toutes mes chansons","Raconte, gros 👀"],
  potins:["Les Potins c'est pas ma vibe","Encore eux ?"],fatigue:["Moi je dors jamais, je compose","Repose-toi gros"],manger:["Un bokit et je suis bien","J'ai oublié de manger, encore"],merci:["Tranquille","De rien gros"],
  q:["Bonne question gros","Je sais pas, et toi ?","Peut-être, on verra"],def:["Ah ouais","Tranquille","Je vois la vibe","Intéressant","C'est lourd ça","Ok gros"]}};
/* une question de présentation déjà posée sur le même sujet (ex. la commune) */
const askedSame=(id,q)=>{const k=TOPICS.find(([,re])=>re.test(q.toLowerCase()));return lastLines(id).some(u=>u.includes(genderize(q,id))||(k&&k[0]!=='salut'&&u.includes('?')&&k[1].test(u.toLowerCase())))};
/* dernière phrase dite par la personne, pour ne pas se répéter */
const lastLines=id=>[...(G.threads[id]||[]),...((G.talks&&G.talks[id])||[])].filter(m=>m.from==='them').slice(-6).map(m=>m.text);
function smartLine(id,text,chan){
 let t=text.toLowerCase(),R=REP[id],s=sentiment(text),used=lastLines(id);
 const fresh=L=>{const f=L.map(x=>genderize(x,id)).filter(x=>!used.some(u=>u.includes(x)));return pickR(f.length?f:L.map(x=>genderize(x,id)))};
 if(!R){if(!isFam(id)){const v=voiceOf(id);return fresh(s>0?v.happy:s<0?v.hurt:v.neutral)}R=FAMREP[famKind(id)]}
 const V=isFam(id)?R:VOICE[id];
 /* d'abord comprendre la phrase (réponse à sa question, note, émotion, goût…) */
 const L=chan==='talk'?((G.talks&&G.talks[id])||[]):(G.threads[id]||[]),pv=L[L.length-2],lastQ=pv&&pv.from==='them'&&pv.text.includes('?')?pv.text.split(/(?<=[.!?])\s+/).filter(x=>x.includes('?')).pop():null;
 const u=understand(id,text,lastQ);if(u)return sty(id,fresh(u.c),u.mood);
 if(s<0)return fresh(V.hurt);
 /* « et toi ? » : répondre sur le sujet de sa dernière question */
 if(/(et toi|et vous|toi aussi|et de ton côté)/.test(t)&&used.length){const last=used[used.length-1].toLowerCase().split(/[.!]/).pop(),pr=last.match(/préf[eè]res? (?:la |le |les |l')?([a-zà-ÿ-]+) ou (?:la |le |les |l')?([a-zà-ÿ-]+)/);
  if(pr){const c=pickR([pr[1],pr[2]]);return id==='jade'?`${c}. sans hésiter.`:`Moi ? Plutôt ${c}, clairement`}
  const th=TOPICS.find(([k,re])=>!['salut','merci'].includes(k)&&re.test(last)&&R[k]);if(th)return fresh(R[th[0]])}
 const hit=TOPICS.find(([k,re])=>re.test(t)&&R[k]);
 if(hit)return fresh(R[hit[0]]);
 if(s>0&&/(t'es|tu es|\btoi\b|\bton\b|\bta\b|\btes\b|merci|bisou|❤|😍|🥰)/.test(t))return fresh(V.happy);
 return fresh(t.includes('?')?R.q:R.def);
}

/* ---------- comprendre la phrase (sans IA) : note, émotion, goût, question, réponse à sa question… puis répondre dans le style de chacun ---------- */
const LIKE={ines:['danse','choré','k-drama','kdrama','drama coréen','webtoon','dancehall','série','mode','martinique','danser','shopping'],
 kylian:['foot','fifa','pêche','peche','rap','bokit','sport','match','mer','ballon','console','jeux vidéo','jeu vidéo'],
 maelle:['mode','shopping','soirée','soiree','fête','fete','pom-pom','dancehall','insta','maquillage','danse','vêtement','fringue'],
 noah:['manga','basket','cuisine','colombo','physique','maths','anime','jeux vidéo','jeu vidéo','console','jeux'],
 jade:['poésie','poesie','poème','poeme','livre','lire','lecture','étoile','etoile','mer','philo','silence','thé','écrire','ecrire','gwo ka','gwoka','roman','pluie'],
 meisha:['shopping','mode','vêtement','vetement','fringue','tenue','soldes','jarry','tiktok','kenza','sac','chaussure','maquillage','journal','soirée','soiree'],
 jessica:['maths','physique','science','sciences','révision','revision','réviser','reviser','exercice','sudoku','énigme','enigme','livre','policier','pâtisserie','patisserie','cookie','bac'],
 noemie:['foot','football','but','match','ballon','sport','entraînement','entrainement','équipe','equipe','bokit','dancehall','courir','plage'],
 eva:['dessin','dessiner','peinture','peindre','art','croquis','couleur','musée','musee','coucher de soleil','fleur','kylian','aquarelle','bd'],
 kenza:['mode','shopping','vêtement','fringue','maquillage','danse','dancehall','r&b','soirée','soiree','photo','insta','compliment','sushi','plage'],
 anais:['sport','course','courir','hand','footing','plage','smoothie','mangue','match','basket','foot','muscu','natation'],
 sacha:['musique','zouk','guitare','gwo ka','gwoka','skate','son','rap','chanson','chanter','piano','concert','dancehall']};
const HATE={ines:['maths','horreur','film d\'horreur','solitude'],kylian:['cours','lecture','lire','devoirs','philo','livre','poésie','poeme','poème'],
 maelle:['cantine','lecture','lire','maths','course','courir','sport'],noah:['drama','potins','dispute','conflit'],
 jade:['potins','drama','foule','sport','soirée','soiree','bruit','foot','fête'],anais:['flemme','retard','chips','canapé','rester assis'],meisha:['moche','pauvre','sport','transpirer','cantine','pluie'],jessica:['tricher','triche','copier','flemme','retard','bruit'],noemie:['maquillage','shopping','flemme','perdre','défaite','defaite','arbitre'],eva:['dispute','méchant','mechant','moquerie','drama','critique'],kenza:['transpirer','cantine','critique','moche','pluie','lecture'],sacha:['horaires','commerce','réveil','reveil','maths','foot']};
const FAV={ines:{matière:'l\'anglais',plat:'le colombo de ma mère',couleur:'le rose',musique:'le dancehall',série:'les K-dramas',sport:'la danse',film:'les comédies romantiques',livre:'les webtoons',animal:'les chats'},
 kylian:{matière:'l\'EPS',plat:'le bokit',couleur:'le bleu',musique:'le rap',série:'les matchs de foot, ça compte ?',sport:'le foot',film:'les films d\'action',livre:'aucun 😂',animal:'les chiens'},
 maelle:{matière:'l\'anglais',plat:'les sushis',couleur:'le doré',musique:'le dancehall',série:'les séries de télé-réalité',sport:'le pom-pom',film:'les films de mode',livre:'les magazines',animal:'les chats'},
 noah:{matière:'la physique',plat:'le colombo de ma grand-mère',couleur:'le vert',musique:'un peu de tout',série:'les animes',sport:'le basket',film:'les films d\'animation',livre:'les mangas',animal:'les chiens'},
 jade:{matière:'la philo',plat:'le poisson grillé de ma grand-mère',couleur:'le bleu nuit',musique:'le gwo ka',série:'je n\'en regarde pas',sport:'la marche au bord de la mer',film:'les vieux films',livre:'les recueils de poèmes',animal:'les tortues'},
 meisha:{matière:'l\'anglais',plat:'les sushis',couleur:'le beige',musique:'les sons TikTok',série:'les séries de mode',sport:'le shopping',film:'les comédies romantiques',livre:'les magazines de mode',animal:'les petits chiens'},
 jessica:{matière:'les maths',plat:'les cookies maison',couleur:'le blanc',musique:'la musique calme',série:'les séries policières',sport:'la marche',film:'les films d\'enquête',livre:'les romans d\'Agatha Christie',animal:'les chats'},
 noemie:{matière:'l\'EPS',plat:'le bokit',couleur:'le bleu',musique:'le dancehall',série:'les docs sur le foot',sport:'le foot',film:'les films de sport',livre:'les bios de joueuses',animal:'les chiens'},
 eva:{matière:'les arts plastiques',plat:'le sorbet coco',couleur:'le lilas',musique:'la musique douce',série:'les animés Ghibli',sport:'la marche',film:'les films d\'animation',livre:'les livres d\'art',animal:'les papillons'},
 kenza:{matière:'l\'anglais',plat:'les sushis',couleur:'le rose poudré',musique:'le R&B',série:'les séries de télé-réalité',sport:'la danse',film:'les comédies romantiques',livre:'les magazines de mode',animal:'les chats'},
 anais:{matière:'les SVT',plat:'le smoothie mangue',couleur:'le orange',musique:'les playlists de motivation',série:'les documentaires de sport',sport:'le hand',film:'les films de sport',livre:'les biographies de sportifs',animal:'les chevaux'},
 sacha:{matière:'la musique',plat:'le bokit',couleur:'le violet',musique:'le zouk rétro',série:'les séries musicales',sport:'le skate',film:'les films musicaux',livre:'les recueils de paroles',animal:'les chats'}};
const FAVKEY=[['matière',/(matière|matiere|cours)/],['plat',/(plat|manger|bouffe|nourriture)/],['couleur',/couleur/],['musique',/(musique|chanteur|chanteuse|artiste|son|chanson|groupe)/],['série',/(série|serie)/],['sport',/sport/],['film',/film/],['livre',/(livre|bouquin|manga)/],['animal',/animal/]];
const YES=/^(oui|ouais|ouai|ouep|yes|grave|carrément|carrement|bien sûr|bien sur|un peu|trop|of course|évidemment|evidemment|si|exact|voilà|voila)\b/;
const NO=/^(non|nan|nope|pas trop|pas vraiment|bof|jamais|pas du tout|absolument pas|du tout)\b/;
/* « mon livre » → « ton livre » : reprendre les mots de l'autre de son point de vue */
const NB='(^|[^a-zà-ÿ\'])',NA='(?![a-zà-ÿ])';
const refl=x=>(' '+x+' ').replace(new RegExp(NB+'(mon|ma|mes|moi|me)'+NA,'g'),(_,a,w)=>a+({mon:'ton',ma:'ta',mes:'tes',moi:'toi',me:'te'})[w]).replace(new RegExp(NB+"m'",'g'),"$1t'").replace(new RegExp(NB+'je'+NA,'g'),'$1tu').replace(new RegExp(NB+"j'",'g'),"$1t'").trim();
/* « tu joues au foot » → « je joue au foot » */
const VERB_TU={as:"j'ai",es:'je suis',vas:'je vais',fais:'je fais',peux:'je peux',sais:'je sais',veux:'je veux',viens:'je viens',sors:'je sors',dors:'je dors',crois:'je crois',connais:'je connais',comprends:'je comprends',lis:'je lis',écris:"j'écris",ecris:"j'écris",bois:'je bois',prends:'je prends',mets:'je mets',dis:'je dis'};
function tuToJe(c){c=c.replace(/^t'es\b/,'tu es').replace(/^t'as\b/,'tu as');const m=c.match(/^tu\s+([a-zà-ÿ]+)(.*)$/);if(!m)return null;
 let v=VERB_TU[m[1]];if(!v){if(!/es$/.test(m[1])||m[1].length<4)return null;const b=m[1].slice(0,-1);v=(/^[aeéèiouyh]/.test(b)?"j'":'je ')+b}
 return (v+m[2].replace(new RegExp(NB+'(ton|ta|tes|toi|te)'+NA,'g'),(_,a,w)=>a+({ton:'mon',ta:'ma',tes:'mes',toi:'moi',te:'me'})[w]).replace(new RegExp(NB+"t'",'g'),"$1m'")).trim()}
const wordIn=(x,w)=>new RegExp(`(^|[^a-zà-ÿ])${w.replace(/[.*+?^${}()|[\]\\]/g,'\\$&')}s?(?![a-zà-ÿ])`).test(x);
const likes=(id,x)=>isNpc(id)&&LIKE[id].some(w=>wordIn(x,w)),hates=(id,x)=>isNpc(id)&&HATE[id].some(w=>wordIn(x,w));
const clean=x=>x.replace(/[?!.…,;]+$/,'').replace(/[\p{Extended_Pictographic}️]/gu,'').trim().slice(0,45);
/* style de chacun ajouté au bout de la phrase */
function sty(id,s,mood){
 const k=isFam(id)?'f_'+famKind(id):id,r=Math.random();
 const tic=w=>{const i=s.indexOf(', ');if(i>0&&i<14)return s.slice(0,i)+w+s.slice(i);const m=s.match(/^(.*?)(\s*[!?.…]*)((?:\s*[\p{Extended_Pictographic}️‍]+)*)\s*$/u);return m?m[1]+w+m[2]+m[3]:s+w};
 const emo=e=>{if(!/[\p{Extended_Pictographic}]\uFE0F?\s*$/u.test(s))s=s.replace(/\s*$/,'')+e};
 if(k==='jade'){s=s.toLowerCase().replace(/[\p{Extended_Pictographic}️‍]/gu,'').replace(/!+/g,'.').replace(/\s+([.?])/g,'$1').replace(/\s{2,}/g,' ').trim();if(!/[.?]$/.test(s))s+='.';return s}
 if(k==='kylian'){s=s.toLowerCase().replace(/\s*!+\s*(?=\S)/g,', ').replace(/\s*!+/g,'');if(r<.35)s=tic(' frr');return s}
 if(k==='maelle'){if(r<.3&&mood!=='sad')emo(' 💅');return s}
 if(k==='ines'){if(r<.55)emo(pickR(mood==='sad'?[' 🥺',' 💕']:[' ✨',' 🥺',' 🥰']));return s}
 if(k==='noah'){if(r<.25)s=tic(' frère');else if(r<.4&&mood!=='sad'&&!/\?/.test(s))emo(' ptdr');return s}
 if(k==='anais'){s=s.replace(/\.$/,' !');if(r<.4&&mood!=='sad')emo(pickR([' 😄',' 🔥',' 💪']));return s}
 if(k==='sacha'){if(r<.35)s=tic(' gros');return s}
 if(k==='f_parent'){if(r<.2)s=tic(' mon cœur');return s}
 if(k==='f_grand'){if(r<.3)s=tic(' doudou');return s}
 if(k==='f_petit'){s=s.replace(/!$/,'!!');if(r<.3&&mood!=='sad')emo(' 😁');return s}
 return s}
const SUBJ_RE='maths|math|philo|physique|chimie|svt|ses|français|francais|anglais|espagnol|histoire|géo|geo|hlp|eps|sport|musique|hggsp|nsi|llce|bio';
/* renvoie {c:[phrases possibles], mood} ou null si la phrase n'est pas reconnue */
function understand(id,raw,lastQ){
 const t=raw.toLowerCase().replace(/[’`]/g,"'").replace(/\s+/g,' ').trim(),fam=isFam(id),fk=fam?famKind(id):'',isQ=/\?\s*[\p{Extended_Pictographic}️]*$/u.test(t)||/^(est-ce que|pourquoi|comment|quand|où|ou est|qui|quel|quelle|c'est quoi|qu'est-ce)/.test(t);
 const R=(c,mood)=>({c,mood:mood||'neutral'}),fr=isNpc(id)?G.rel[id].ami:60,me=nameOf('me');
 /* au revoir */
 if(/(bonne nuit|à demain|a demain|\bbye\b|ciao|à plus|a plus|a\+|je dois (y )?aller|je vais dormir|je vais me coucher|je te laisse|bonne soirée|bonne soiree)/.test(t))
  return R(/nuit|dormir|coucher/.test(t)?['Bonne nuit !','Bonne nuit, dors bien !','Ok, bonne nuit, à demain !']:['À plus !','Ok, à demain !','Ça marche, à plus tard !','Bonne soirée !']);
 /* une note */
 const g=t.match(new RegExp(`(\\d{1,2}(?:[.,]5)?)\\s*(?:\\/\\s*20)?\\s*(?:en|de|au|à)\\s+(?:l'|la |le )?(${SUBJ_RE})`));
 if(g&&+g[1].replace(',','.')<=20&&!isQ){const n=+g[1].replace(',','.'),m=g[2],x=`${g[1]} en ${m}`;
  if(fam&&fk!=='petit')return R(n>=12?[`${x} ? Je suis fier·ère de toi !`,`Bravo pour ton ${x} ! Continue comme ça`]:n>=10?[`${x}, c'est correct. Tu peux faire mieux, je le sais`,`Ça passe, ${x}. Il faut continuer à travailler`]:[`${x}… il va falloir travailler plus`,`Aïe, ${x}. On regarde ça ensemble ce soir ?`],n>=10?'happy':'sad');
  return R(n>=16?[`Wow, ${x} ! T'es trop {p:fort·e}`,`${x} ?! Respect, c'est énorme`]:n>=12?[`Bien joué pour ton ${x} ! C'était sur quoi ?`,`${x}, pas mal du tout !`,`Bravo pour le ${x} !`]:n>=10?[`${x}, ça passe !`,`C'est la moyenne, c'est déjà ça`]:[`Aïe, ${x}… tu vas te rattraper`,`Ça arrive, le prochain sera mieux`,`${x}… t'inquiète, on peut réviser ensemble`],n>=10?'happy':'sad')}
 if(/(j'ai (raté|rate|loupé|foiré)|je me suis planté)/.test(t))return R(['Oh non… ça arrive à tout le monde','Aïe. Le prochain sera mieux, t\'inquiète','Mince… tu veux qu\'on révise ensemble ?'],'sad');
 if(/(j'ai réussi|j'ai eu mon|j'ai validé|j'ai gagné)/.test(t)){const x=clean(refl(t.replace(/^.*?j'ai (réussi|eu|validé|gagné)\s*/,'')));return R([`Bravo !! ${x?'T\'as '+x.replace(/^(mon|ma|mes)\b/,w=>({mon:'ton',ma:'ta',mes:'tes'})[w])+', ':''}c'est trop bien`,'Trop {p:fort·e} ! Félicitations','Ohh bravo, je suis content·e pour toi'],'happy')}
 /* un contrôle à venir */
 const ex=t.match(new RegExp(`(contrôle|controle|interro|exam|éval|eval|bac blanc|devoir surveillé|ds)\\s*(?:de |d'|en )?(${SUBJ_RE})?`));
 if(ex&&!isQ&&/(demain|lundi|mardi|mercredi|jeudi|vendredi|bientôt|bientot|semaine|j'ai un|j'ai une|on a)/.test(t)){const x=ex[2]?`ton ${ex[1]} de ${ex[2]}`:`ton ${ex[1]}`;
  return R(fam&&fk==='parent'?[`Révise bien pour ${x} ce soir`,`Tu es {p:prêt·e} pour ${x} ? Pas de téléphone ce soir alors`]:[`Bon courage pour ${x} ! T'as révisé ?`,`Ah ${x}… moi aussi je stresse pour ça`,`Tu vas gérer ${x}, t'inquiète`])}
 /* questions qu'on lui pose */
 if(/(comment tu t'appelles|tu t'appelles comment|c'est quoi ton (pré)?nom|ton prénom)/.test(t))return R([`Moi c'est ${nameOf(id)} !`,`${nameOf(id)}. Et toi c'est ${me}, c'est ça ?`]);
 if(/(quel âge|quel age|t'as quel|ton âge|ton age)/.test(t))return R(fam?['Tu le sais très bien !','Assez pour savoir ce qui est bon pour toi 😂']:[`J'ai ${FICHES[id].age} ans, et toi ?`,`${FICHES[id].age} ans !`]);
 const pf=t.match(/préf[eè]res?\s+(?:quoi\s*,?\s*)?(.+?)\s+ou\s+(.+?)\s*\?*$/);
 if(pf){const a=clean(pf[1]),b=clean(pf[2]),c=likes(id,b)&&!likes(id,a)?b:likes(id,a)?a:hates(id,a)?b:(hash(id+a+b)%2?a:b);return R([`${c}, sans hésiter !`,`Plutôt ${c}. Et toi ?`,`Hmm… ${c} !`].map(x=>x[0].toUpperCase()+x.slice(1)))}
 const fv=t.match(/(préféré|préférée|prefere|préferé|favori|favorite)/)&&FAVKEY.find(([k,re])=>re.test(t));
 if(fv&&isNpc(id)){const v=FAV[id][fv[0]];return R([`${v[0].toUpperCase()+v.slice(1)} ! Et toi ?`,`Je dirais ${v}. Et toi ?`])}
 const lk=t.match(/(?:tu aimes|t'aimes|tu kiffes|tu adores|t'adores|tu aimes bien|t'aimes bien)\s+(?:bien\s+)?(.+?)\s*\?*$/);
 if(lk){const x=clean(lk[1]);if(likes(id,x))return R([`Oui, j'adore ${x} !`,`Grave, ${x} c'est ma passion`,`Trop ! ${x}, c'est mon truc`],'happy');if(hates(id,x))return R([`Pas trop, ${x} c'est pas mon truc`,`Non… ${x}, très peu pour moi 😅`]);
  return R(fam?[`Oui, j'aime bien`,`Ça dépend… pourquoi ?`]:[`Ça va, ${x} c'est pas mal`,`Un peu ! Et toi, t'aimes ça ?`,`Bof, sans plus. Toi oui ?`])}
 if(/(tu veux|ça te dit|ca te dit|on (va|peut|pourrait|se fait|fait)|tu viens|t'es chaud|t'es chaude|chaud pour|tu m'accompagnes|on sort)/.test(t)&&isQ&&!/(sortir avec|ensemble|en couple|embrass|bisou|d'où|d'ou)/.test(t)){
  if(fam)return R(fk==='parent'?['Si tes devoirs sont faits, d\'accord','On verra ça ce soir','Pourquoi pas, on en parle à table']:fk==='grand'?['Avec plaisir doudou','Oh oui, ça me ferait plaisir']:fk==='petit'?['Ouiii !!','Trop bien, quand ?','Si tu m\'achètes une glace 😁']:['Si j\'ai le temps','Ok, pourquoi pas']);
  return R(fr>=30?['Ok, ça me dit ! On se dit quand ?','Avec plaisir !','Ouais, trop bien, je viens']:fr>=10?['Peut-être… on verra','Pourquoi pas, faut que je vois']:['Euh… on se connaît pas encore trop','Je sais pas, une autre fois peut-être']);}
 if(/^(t'es où|t es ou|tu es où|tu es ou|t'es ou|où es-tu|ou es tu)/.test(t)){const sc=schoolDay(G.day)&&G.min>=7*60+30&&G.min<17*60;return R(fam?(sc?['Au travail, je rentre ce soir','Je suis à la maison']:['À la maison','Je suis dans la cuisine']):sc?['Au lycée, comme toi 😅','Dans la cour','En cours, chut']:['Chez moi','Dans ma chambre, je me repose'])}
 if(/(t'as fait|tu as fait|t'as fini|tu as fini|t'as révisé|tu as révisé|t'as bossé|tu as bossé).*(devoir|exo|révis|revis|dm)/.test(t)||/(t'as révisé|tu as révisé)/.test(t)){const ok=isNpc(id)?FICHES[id].stud>.55:true;return R(ok?['Oui, j\'ai fini hier soir','Presque, il me reste un exo','Oui ! Tu veux que je t\'explique ?']:['Non pas encore 😅','Euh… tu me les passes ?','Pas du tout, je vais le faire à la dernière minute'])}
 if(/^(parce que|parce qu'|car |vu que|c'est parce)/.test(t))return R(['Ah, je comprends','Ah d\'accord, je vois','Ok, ça se tient']);
 if(/^pourquoi/.test(t))return R(['Je sais pas… c\'est comme ça','Bonne question 😅','Parce que ! Et toi, t\'en penses quoi ?']);
 if(/(tu me manques|tu m'as manqué)/.test(t))return R(fr>=30||fam?['Toi aussi tu me manques !','Ohh, toi aussi 🥹']:['Ah… c\'est gentil 😅'],'happy');
 if(/(t'es|tu es|t es)\s+(trop |vraiment |super |très |tres |grave )?(beau|belle|mignon|mignonne|gentil|gentille|drôle|drole|marrant|marrante|cool|sympa|intelligent|intelligente|fort|forte|stylé|stylée|style|génial|géniale|genial|adorable|incroyable)/.test(t)&&!isQ)
  return R(fam?['Ohh merci, toi aussi','C\'est gentil ça']:['Ohh merci, t\'es {p:gentil·le}','Arrête, tu me fais rougir 😳','Merci ! Toi aussi franchement'],'happy');
 if(/(désolé|desole|dsl|pardon|excuse)/.test(t))return R(['T\'inquiète, c\'est rien','C\'est pas grave','C\'est oublié']);
 if(/(ça va et toi|ca va et toi|bien et toi|ça va toi|ca va toi|tranquille et toi)/.test(t))return R(['Ça va bien aussi, merci !','Ça va, tranquille']);
 /* émotions */
 const fe=[[/(triste|déprim|deprim|pas bien|pas le moral|j'ai pleuré|je pleure|ça va pas|ca va pas|mal dans ma peau)/,['Oh non… qu\'est-ce qui se passe ?','Ça va pas ? Raconte-moi','Je suis là si tu veux parler'],'sad'],
  [/(stress|angoiss|j'ai peur|flipp)/,['Respire, ça va bien se passer','Pourquoi tu stresses ?','T\'inquiète, tu vas y arriver'],'sad'],
  [/(énervé|énervée|enerve|en colère|en colere|saoul|soûl|j'en ai marre|marre de)/,['Qu\'est-ce qui t\'énerve ?','Ah… raconte, il s\'est passé quoi ?','Respire. C\'est qui qui t\'a mis·e dans cet état ?'.replace('mis·e','{p:mis·e}')],'sad'],
  [/(malade|mal à la tête|mal a la tete|mal au ventre|fièvre|fievre|grippe|enrhum)/,['Oh, soigne-toi bien !','Repose-toi, j\'espère que ça ira mieux','Bois beaucoup d\'eau et repose-toi'],'sad'],
  [/(je suis nul|je suis nulle|je suis bête|je suis bete|je suis trop nul|je me trouve (moche|nul))/,['Mais non, dis pas ça !','T\'es pas {p:nul·le}, arrête','Arrête, tout le monde galère parfois'],'sad'],
  [/(fatigué|fatiguée|fatigue|crevé|crevée|creve|épuisé|epuise|naze|j'ai sommeil|je suis mort)/,['Repose-toi un peu, ça ira mieux','Moi aussi je suis fatigué·e… vivement le week-end','Dors bien ce soir alors'],'sad'],
  [/(je m'ennuie|je m'ennuis|ennuie|ennui)/,['Moi aussi… on fait un truc ?','Viens, on parle alors','Raconte-moi un truc pour passer le temps'],'neutral'],
  [/(je suis seule?|je me sens seule?|personne me parle)/,['T\'es pas {p:seul·e}, je suis là','Hé, tu peux compter sur moi'],'sad'],
  [/(content|contente|heureux|heureuse|trop bien|super bien|la joie|trop cool|je suis aux anges|trop happy)/,['Ça fait plaisir ! Il s\'est passé quoi ?','Trop bien ! Raconte','Ahh j\'aime te voir comme ça'],'happy']];
 for(const [re,c,mood] of fe)if(re.test(t)){if(/^(tu|t'|t es|est-ce que tu)/.test(t)&&isQ)return R(mood==='happy'?['Oui, ça va bien !']:['Non, ça va, t\'inquiète','Un peu… mais ça va']);return R(c,mood)}
 /* réponse à la question qu'il ou elle vient de poser */
 if(lastQ&&!isQ){const q=lastQ.toLowerCase(),y=YES.test(t),n=NO.test(t);let place=raw.match(/\s([A-ZÉÈ][\wà-ÿ'-]+(?:[ -](?:de |du |la |le )?[A-ZÉÈ][\wà-ÿ'-]+)*)/)||(raw.trim().split(/\s+/).length<=3&&/^[A-ZÉÈ]/.test(raw.trim())&&!/^(Je|J'|Moi|Oui|Non|Ouais|Nan|Parce|Bof|Euh|Ben|Bah|Pas|Si|Ok)\b/.test(raw.trim())?[0,clean(raw.trim())]:null);
  if(/(t'appelles|ton nom|prénom)/.test(q)){const nm=raw.trim().split(/\s+/).length<=3?clean(raw.replace(/^(moi c'est|je m'appelle|c'est)\s+/i,'')).replace(/^./,c=>c.toUpperCase()):me;return R([`Enchanté·e ${nm} ! Moi c'est ${nameOf(id)}`,`${nm}, c'est joli comme prénom`])}
  if(/(d'où|d'ou|commune|habites|t'es d'|tu viens)/.test(q)&&!y&&!n){const pp=raw.match(/(?:^|\s)(de|du|d'|à|au|aux|des|en|vers)\s?((?:la |le |les |l')?[A-ZÉÈa-zà-ÿ][\wà-ÿ'-]+(?:[ -](?:de |du |la |le )?[A-ZÉÈ][\wà-ÿ'-]+)*)/);if(pp&&!/^(mon|ma|la nouvelle|ici)$/.test(pp[2]))place=[0,(pp[1]==='du'?'Le ':pp[1]==='des'||pp[1]==='aux'?'les ':'')+pp[2]];const lw=t.match(/(?:^|\s)(?:de |du |d'|à |a |au |aux |des |en |vers )(?:la |le |l')?([a-zà-ÿ' -]{3,30})$/),pl=place?place[1]:lw?lw[1]:t.split(' ').length<=3?clean(t):null;
   if(pl){const P=pl.replace(/(^|[\s-])([a-zà-ÿ])/g,(m,a,b)=>a+b.toUpperCase());return R([`Ah, ${P} ! C'est joli là-bas`,`${P} ? Je connais un peu, c'est sympa`,`Ah ok, ${P}. Ça te change pas trop ici ?`])}}
  if(/(lycée avant|ancien lycée|quel lycée)/.test(q)&&place)return R([`Ah, ${place[1]} ! Et pourquoi t'as changé ?`,`${place[1]} ? J'ai un·e pote là-bas !`.replace('un·e pote','des potes')]);
  if(/(lycée avant|ancien lycée|quel lycée|pourquoi ce lycée|changé de lycée)/.test(q)&&(y||n||t.split(' ').length<=6||/(parce|car |déménag|demenag|mes parents|travail|à cause|a cause|pour )/.test(t)))return R(['Ah d\'accord. Et ici, tu t\'y plais ?','Je vois. Ça doit pas être facile d\'arriver en terminale','Ok ! Et tu connais déjà des gens ici ?']);
  if(/spé/.test(q)){const own=(REP[id]&&REP[id].spe||[]).join(' ').toLowerCase(),sp=t.match(new RegExp(SUBJ_RE,'g'))||[];if(!sp.length&&(y||n||t.length<15))return R(['Mais t\'as pris quoi du coup ? 😅','Genre, quelles spés ?']);if(sp.length)return R(sp.some(s=>own.includes(s))?['Comme moi ! On sera ensemble alors','Trop bien, on a une spé en commun !']:['Ah, pas mal ! C\'est dur ?','Ok ! Pourquoi t\'as choisi ça ?'])}
  if(/(préfères|ou )/.test(q)&&/ ou /.test(q)){const op=q.match(/([a-zà-ÿ-]+) ou (?:la |le |les |l')?([a-zà-ÿ-]+)/);if(op){const pick=t.includes(op[1])?op[1]:t.includes(op[2])?op[2]:null;if(pick){const mine=likes(id,op[2])?op[2]:likes(id,op[1])?op[1]:op[1];return R(pick===mine?[`Moi aussi, ${pick} !`,`Pareil, ${pick} c'est la base`]:[`Ah moi je préfère ${mine} 😅`,`Ah, ${pick} ? Moi c'est plutôt ${mine}`])}}}
  if(/(écoutes quoi|tu lis quoi|tu regardes quoi|tu fais quoi|tu joues à quoi)/.test(q)&&!y&&!n){const x=clean(t);return R(likes(id,x)?[`J'adore aussi ! On a les mêmes goûts`,`Ah trop bien, moi aussi !`]:[`Ah, pas mal ! C'est bien ?`,`Ok ! Tu me montreras ?`,`Ah ouais ? Je connais pas trop`])}
  if(/(ça va|ca va|la forme)\s*\??/.test(q)){if(n||/(mal|pas trop|bof|fatigu|bof)/.test(t))return R(['Ah… qu\'est-ce qui va pas ?','Oh, pourquoi ?'],'sad');if(y||/(bien|tranquille|ça va|ca va|super)/.test(t))return R(['Tant mieux !','Cool !','Ça fait plaisir'],'happy')}
  if(y)return R(/(sport|foot|danse|cours|joues|fais du|fais de la)/.test(q)?['Trop bien ! On pourra en faire ensemble','Ah cool ! Depuis longtemps ?']:/(insta|ajoute)/.test(q)?['Je t\'ajoute alors !']:['Ah cool !','Trop bien !','Ah ouais ? Raconte'],'happy');
  if(n)return R(/(sport|foot|danse|joues|fais du|fais de la)/.test(q)?['Ah dommage ! Tu fais quoi de ton temps libre alors ?','Ok, chacun son truc !']:['Ah d\'accord','Ok, pas grave','Ah bon ? Pourquoi ?'])}
 /* sa vie amoureuse, une déclaration */
 if(/((t'es|tu es|t es) (en couple|célibataire|celibataire|amoureu)|t'as (un|une) (copain|copine|crush|chéri)|tu as (un|une) (copain|copine|crush|chéri)|tu sors avec quelqu'un|t'as quelqu'un|tu as quelqu'un)/.test(t)){
  if(fam)return R(fk==='petit'?['Beurk, non !','Moi j\'ai une amoureuse… non je rigole 😂']:['Tu le sais bien 😂','Ça, ce sont mes affaires 😏']);
  const c=coupleOf(id);return R(c==='me'||G.partner===id?['Bah… avec toi 🥰','Tu le sais bien, avec toi 😳']:c?[`Oui, avec ${nameOf(c)} 🥰`,`Je suis avec ${nameOf(c)}, tu savais pas ?`]:['Non, je suis célibataire 😅','Non, personne pour l\'instant','Non… pourquoi, ça t\'intéresse ? 👀'])}
 if(isNpc(id)&&/(je t'aime(?! bien)|sortir avec moi|être avec moi|etre avec moi|on se met ensemble|être ensemble|etre ensemble|être ma copine|être mon copain|etre ma copine|etre mon copain|tu me plais|je suis amoureu|je te kiffe|je craque pour toi|t'es mon crush)/.test(t)){const am=G.rel[id].amour,ok=npcLikesMe(id);
  return R(ok&&am>=50?['Moi aussi… 🥰','Tu me plais aussi, beaucoup','J\'attendais que tu le dises 😳']:ok&&am>=20?['Oh… je sais pas quoi dire 😳','Tu me prends de court là…','C\'est… mignon. Laisse-moi un peu de temps']:['Euh… on se connaît pas assez 😅','Ah… je te vois plutôt comme {p:un·e} pote','Oh… c\'est gentil, mais non 😅'],ok&&am>=20?'happy':'sad')}
 /* un·e camarade nommé·e */
 if(isNpc(id)&&new RegExp(NB+nameOf(id).toLowerCase()+NA).test(t)&&/(connais|c'est qui|tu penses quoi|t'en penses)/.test(t))return R(['Mais… c\'est moi 😂','Haha, c\'est moi, ça !']);
 const who=NPCS.find(n=>n.id!==id&&new RegExp(NB+n.name.toLowerCase()+NA).test(t));
 if(who){const nm=who.name;if(fam)return R([`${nm} ? C'est quelqu'un de ta classe, non ?`,`Ah, ${nm}. Tu l'invites à la maison un jour ?`]);
  const l=G.links&&G.links[id]&&G.links[id][who.id],a=l?l.ami:40,c=coupleOf&&coupleOf(id)===who.id;
  return R(c?[`${nm} ? C'est mon cœur 🥰`,`Ne me parle pas trop de ${nm}, je vais rougir 😳`]:a>=70?[`${nm} ? C'est ma personne préférée !`,`${nm}, c'est une personne en or`]:a>=45?[`Oui, ${nm} ! On s'entend bien`,`${nm} ? Ouais, c'est cool`]:a>=25?[`${nm}… ça va, sans plus`,`On se parle un peu, avec ${nm}`]:[`${nm} ? On s'entend pas trop…`,`Parle-moi pas de ${nm} 🙄`])}
 if(/(je t'aime bien|je t'adore|t'es mon pote|t'es ma pote|t'es mon ami|t'es mon amie|t'es ma meilleure|t'es mon meilleur)/.test(t)||(fam&&/je t'aime/.test(t)))
  return R(fam?(fk==='petit'?['Beurk 🤢… moi aussi un peu','Hé hé, moi aussi']:['Moi aussi je t\'aime ❤️','Oh, moi aussi ❤️']):fr>=20?['Moi aussi je t\'aime bien !','Ohh, c\'est réciproque !']:['Ah… c\'est gentil 😊','Merci, c\'est cool de dire ça'],'happy');
 if(/^(moi aussi|pareil|moi non plus|même chose|pareille?)\W*$/.test(t))return R(['On se ressemble alors !','Haha, on est pareils','Ah, trop bien !']);
 /* « ma mère m'a grondée » → « ta mère t'a grondée ? » */
 const ev=t.match(/^((?:mon|ma|mes|le|la|les|un|une|des|notre|la prof|le prof|on|il|elle|ils|elles)\b[^?]{0,40}?\s(?:m'a|m'ont|a|ont|est|sont)\s[^?]{2,40})$/);
 if(ev&&!isQ){const x=clean(refl(ev[1]));return R(/(grond|disput|puni|crié|engueul|énerv|enerv|vir|frapp|insult|clash|moqu)/.test(t)?[`Quoi, ${x} ? Pourquoi ?`,`Aïe… ${x} ? T'avais fait quoi ?`]:[`Ah, ${x} ? Raconte !`,`Sérieux, ${x} ?`,`Ah ouais ? Et alors ?`])}
 /* ce qu'il ou elle fait en ce moment */
 const ac=t.match(/^(?:là |la |en ce moment |je suis en train de )?(?:je|j')\s?(regarde|écoute|ecoute|lis|joue|mange|fais|travaille|révise|revise|dessine|écris|ecris|cuisine|range|chante|danse|prépare|prepare|attends|cherche)\b\s*(.*)$/);
 if(ac&&!isQ){const vb=ac[1],tu=/e$/.test(vb)?vb+'s':vb,x=clean(refl(ac[2]));const L=likes(id,vb+' '+x);
  return R(L?[`Trop bien, j'adore ça aussi !`,`Ah, tu ${tu} ${x} ? Moi aussi j'aime trop`]:[`Ah, tu ${tu} ${x} ? C'est bien ?`,`Cool ! Ça a l'air bien`,/^(mange|bois|cuisine|prépare|prepare)/.test(vb)?`Miam, ça a l'air bon !`:`Ah, tu ${tu} ${x} ! Pas mal`].map(z=>z.replace(/\s+\?/,' ?').replace(/\s+!/,' !')))}
 /* ses goûts */
 const al=t.match(/(?:j'aime bien|j'aime|j'adore|je kiffe|je suis fan de|je suis fan d')\s+(?!pas\b)(.+)/);
 if(al&&!isQ){const x=clean(refl(al[1]));if(likes(id,x))return R([`Moi aussi j'adore ${x} !`,`Trop bien, ${x} c'est ma passion aussi`,`On a les mêmes goûts alors !`],'happy');if(hates(id,x))return R([`Ah… moi ${x} c'est pas trop mon truc 😅`,`Chacun ses goûts ! Moi ${x}, bof`]);
  return R(fam?['C\'est bien, ça','Ah oui ? Je savais pas']:[`Ah, ${x} ? Pourquoi tu aimes ça ?`,`Cool ! Ça fait longtemps que t'aimes ${x} ?`,`Ah ouais ? Tu me feras découvrir`])}
 const dl=t.match(/(?:je déteste|je deteste|j'aime pas|j'aime pas trop|je n'aime pas|je supporte pas|j'ai horreur de|j'ai horreur d')\s+(.+)/);
 if(dl&&!isQ){const x=clean(refl(dl[1]));return R(likes(id,x)?[`Quoi ? Moi j'adore ${x} 😅`,`Ah non, ${x} c'est trop bien pourtant`]:[`Pareil, ${x} c'est pas ouf`,`Moi non plus, je te comprends`,`Ah ouais ? Pourquoi ?`])}
 /* rire, accord */
 if(/^(mdr|ptdr|mdrr|haha|hahaha|lol|xd|😂|🤣)/.test(t))return R(id==='jade'?['ça me fait sourire.','tu es drôle, parfois.']:fk==='parent'||fk==='grand'?['Haha, tu me fais rire','Toi alors !']:['Mdrr','Haha 😂','😂😂','Je suis mort·e 😂'],'happy');
 /* la météo */
 if(/(il fait (trop |tellement |super )?chaud|quelle chaleur|cette chaleur|canicule|il pleut|la pluie|quelle pluie|il fait froid|il fait beau|grand soleil|cyclone|tempête|tempete)/.test(t)&&!isQ)return R(/(pleut|pluie|cyclone|tempête|tempete)/.test(t)?['Oui, il pleut des cordes','Avec ce temps je reste chez moi','J\'espère que ça va s\'arrêter vite']:/froid/.test(t)?['Froid ? On est en Guadeloupe 😂','Ah bon ? Moi ça va']:['Oui, cette chaleur… je fonds','Trop chaud ! Vivement la plage','C\'est la Guadeloupe 😅']);
 if(/^(ok|okay|oki|d'accord|dac|daccord|ça marche|ca marche|vas-y|ok ok)\W*$/.test(t))return R(['Ok !','Ça marche','Cool','Top']);
 /* d'où on vient */
 const og=raw.match(/(?:je viens|j'habite|je vis|je suis originaire|je suis|moi je suis|moi c'est)\s+(de|du|des|d'|à|a|au|aux|en)\s?((?:la |le |les )?[A-ZÉÈ][\wà-ÿ'-]+(?:[ -](?:de |du |la |le )?[A-ZÉÈ][\wà-ÿ'-]+)*)/i);
 if(og&&/^[A-ZÉÈ]|^(la|le|les) [A-ZÉÈ]/.test(og[2])&&!isQ){const P=(og[1]==='du'?'Le ':og[1]==='des'||og[1]==='aux'?'les ':'')+og[2];
  const home=REP[id]&&REP[id].origine.join(' ').toLowerCase().includes(og[2].toLowerCase());
  return R(fam?['Je sais bien 😂','Oui, je sais !']:home?[`${P} ? Comme moi ! On est presque voisins alors`,`Moi aussi je suis de ${og[2]} !`]:[`Ah, ${P} ! C'est joli là-bas`,`${P} ? Je connais un peu, c'est sympa`,`Ah ok, ${P}. Ça te change pas trop ici ?`])}
 /* il ou elle raconte quelque chose */
 if(!isQ){const st=t.match(/^(?:aujourd'hui |hier |ce matin |ce soir |demain |là |la )?(je vais|je viens de|je suis en train de|j'ai|je suis|j'étais|je pars)\s+(.+)/);
  if(st){const x=clean(refl(st[2])),v={"je vais":'tu vas',"je viens de":'tu viens de',"je suis en train de":'tu es en train de',"j'ai":"t'as","je suis":"t'es","j'étais":"t'étais","je pars":'tu pars'}[st[1]];
   const past=/^(je suis|j'étais)$/.test(st[1])&&/^(allée?s?|partie?s?|sortie?s?|venue?s?|rentrée?s?|tombée?s?|restée?s?|passée?s?|montée?s?|arrivée?s?|là-bas|chez)\b/.test(x);
   if(past)return R([`Ah, ${v} ${x} ? C'était bien ?`,`Ah cool ! C'était comment ?`,`Trop bien ! Tu t'es {p:amusé·e} ?`]);
   return R(st[1]==='je vais'||st[1]==='je pars'?[/avec /.test(x)?`Ah, ${v} ${x} ? Trop bien`:`Ah, ${v} ${x} ? Avec qui ?`,`Cool ! Tu me raconteras`,`Ah ${v} ${x} ! Amuse-toi bien`]:st[1]==="j'ai"?[`Ah, ${v} ${x} ? Raconte !`,`Sérieux ${v} ${x} ?`,`Ah ouais ? Et alors ?`]:[`Ah, ${v} ${x} ? Et ça se passe bien ?`,`Ah d'accord ! Et alors ?`,`Ah ouais, ${v} ${x} ?`])}}
 /* question oui / non sur lui ou elle */
 if(isQ){const c=t.replace(/^est-ce que\s+/,'').replace(/\s*\?+.*$/,''),je=tuToJe(c);
  if(je&&c.length<60&&!/(quoi|\bqui\b|où|\bou\b|comment|combien|quand|quel|lequel|laquelle|pourquoi|ça va|ca va|célibataire|celibataire|couple|amoureu|copain|copine|crush)/.test(c)&&!NPCS.some(n=>c.includes(n.name.toLowerCase()))){if(fam)return R(['Pourquoi tu me demandes ça ?','Hmm… oui, pourquoi ?','Ça dépend, pourquoi ?']);const yes=likes(id,c)?true:hates(id,c)?false:hash(id+c)%2===0;return R(yes?[`Oui, ${je} !`,`Ouais, ${je}. Et toi ?`]:[`Non, pas vraiment`,`Non… et toi ?`,`Pas trop, non`])}}
 return null}

/* ---------- la famille parle selon son rôle (parent, grand-parent, petit frère ou petite sœur, grand frère ou grande sœur) ---------- */
const famKind=id=>{const f=famById(id),r=f?f.role:'';return /^Grand-/.test(r)?'grand':/^Petit|^Petite/.test(r)?'petit':/^Grand |^Grande /.test(r)?'aine':'parent'};
const FAMREP={
 parent:{start:["Tout se passe bien au lycée ?","N'oublie pas de ranger ta chambre","On mange à 19h30 ce soir"],happy:["Je suis fier·ère de toi ❤️","Haha tu me fais rire","Ça me fait plaisir de t'entendre"],hurt:["On en reparle tout à l'heure.","Ce ton, non merci.","Je ne t'ai pas {p:élevé·e} comme ça."],neutral:["D'accord.","Ok mon cœur.","On verra ça ce soir."],
  salut:["Coucou mon cœur","Ah, te voilà !"],cava:["Ça va, un peu fatigué·e par le travail. Et toi, ta journée ?","Ça va bien. Et toi, ça s'est passé comment au lycée ?"],activite:["Je prépare à manger","Je termine un truc pour le travail"],
  ecole:["Et tes notes, ça avance ? Le bac arrive vite","Tu as des devoirs pour demain ?","Si tu as besoin d'aide, demande"],weekend:["Ce week-end on pourrait aller à la plage en famille","Samedi tu m'aides à faire les courses ?"],
  manger:["On mange à 19h30, sois à l'heure","Il reste du colombo dans le frigo"],amour:["Ah bon ? Tu as quelqu'un en vue ? 👀","Prends ton temps, concentre-toi sur le bac d'abord"],fatigue:["Va te coucher tôt ce soir","Tu dors assez ? Pose ce téléphone"],
  famille:["On est une famille, on se serre les coudes","Appelle ta grand-mère, ça lui fera plaisir"],merci:["De rien mon cœur","C'est normal"],q:["Bonne question… on en parle à table ?","Je ne sais pas, et toi, tu en penses quoi ?"],def:["Ah oui ?","D'accord, raconte","Je t'écoute","Hmm hmm","C'est bien"],
  maison:["Mets la table, s'il te plaît","Range un peu ta chambre"]},
 grand:{start:["Tu passes me voir dimanche ?","Tu manges bien au moins ?","Je pense à toi"],happy:["Oh, ça me fait chaud au cœur","Tu es un amour","Que Dieu te garde"],hurt:["On ne parle pas comme ça à ses aînés !","Tsss… les jeunes d'aujourd'hui"],neutral:["Ah bon…","Mm.","C'est comme ça."],
  salut:["Bonjour mon petit","Viens m'embrasser"],cava:["Ça va, à part mes genoux. Et toi ?","Ça va doucement. Et l'école ?"],activite:["Je regarde mon émission","J'arrose mes plantes"],ecole:["Travaille bien à l'école, c'est important","De mon temps, on n'avait pas tout ça"],
  weekend:["Dimanche je fais un bon repas, tu viens ?","Viens m'aider au jardin samedi"],manger:["Tu as faim ? J'ai fait des accras","Mange, tu es tout maigre"],amour:["Ah, l'amour… raconte-moi tout","Choisis quelqu'un de gentil, c'est ça le plus important"],
  fatigue:["Repose-toi, tu travailles trop","Une bonne tisane et au lit"],famille:["La famille, c'est sacré","Tes parents étaient pareils à ton âge"],merci:["De rien, mon petit","C'est normal"],q:["Je ne sais pas, demande à tes parents","Hmm, à mon âge on ne sait plus tout"],def:["Ah oui…","C'est bien ça","Raconte encore","Mm, mm"],
  maison:["Viens t'asseoir à côté de moi","Tu veux un jus de groseille ?"]},
 petit:{start:["Tu joues avec moi ?","C'est quoi le code du wifi ?","Je peux prendre ton chargeur ?"],happy:["Trop bien !! 😁","T'es trop {p:fort·e} 😁","Ouais !!"],hurt:["Je vais le dire à maman !","T'es {p:méchant·e} 😤","Pfff"],neutral:["Ok","Bof","Si tu veux"],
  salut:["Salut ! T'as ramené des bonbons ?","Yo !"],cava:["Ouais ça va ! J'ai gagné à la console 😁","Bof, j'ai eu une punition"],activite:["Je joue à la console","Je fais mes devoirs… enfin presque"],
  ecole:["J'ai eu 15 en maths ! Et toi ?","Ma maîtresse est trop sévère"],weekend:["On va à la plage ce week-end ? Dis oui !","Tu m'emmènes au glacier ?"],manger:["J'ai faim ! Y a quoi à manger ?","Tu me fais des crêpes ?"],
  amour:["Beurk 🤢","T'as quelqu'un ?? Je vais le dire à tout le monde 😂"],fatigue:["Moi je suis pas fatigué !","Pfff t'es toujours {p:fatigué·e}"],famille:["Maman a dit que je pouvais rester debout tard","Papa ronfle trop fort 😂"],merci:["De rien !","Hé hé"],
  q:["Je sais pas moi !","Euh… oui ? Non ?"],def:["Ah ouais ?","Cool","Et alors ?","Mdr","Ok ok"],maison:["Tu me prêtes ton téléphone ?","Tu veux voir mon dessin ?"]},
 aine:{start:["T'as encore pris mon chargeur ?","Tu me dois un service","Ça se passe bien la terminale ?"],happy:["Haha t'es bête","Ok là t'as raison","Trop bien"],hurt:["Calme-toi","Parle-moi mieux","Ok, laisse tomber"],neutral:["Ok","Ouais","Si tu veux"],
  salut:["Salut toi","Yo"],cava:["Ça va, fatigué·e par les cours. Et toi ?","Tranquille. Et la terminale ?"],activite:["Je regarde une série","Je révise, pour une fois"],ecole:["La terminale c'est dur, mais tu vas gérer","Si tu veux je t'aide en maths"],
  weekend:["Samedi je sors avec mes potes","On peut aller au centre-ville ensemble si tu veux"],manger:["Il reste des pâtes","On commande une pizza ?"],amour:["Ohh, raconte 👀","Fais attention à toi quand même"],fatigue:["Va dormir alors","Moi aussi, j'en peux plus"],
  famille:["Les parents sont sur mon dos en ce moment","Le petit est insupportable aujourd'hui 😂"],merci:["De rien","Tu me revaudras ça"],q:["Bonne question","Jsp, et toi ?"],def:["Ah ouais ?","Ok","Raconte","Pas mal"],maison:["Baisse le son, je travaille","Tu veux regarder un film ?"]}};

function fallbackReply(id,text){const v=VOICE[isFam(id)?'fam':id],s=sentiment(text);
 const love=/(t'aime|tu me plais|mignon|craque|beau|belle)/i.test(text);
 /* première rencontre : sa première réponse est une question pour faire connaissance, puis quelques questions de suite */
 const met=isNpc(id)?(G.met[id]||0):3;
 const words=(text.toLowerCase().match(/[a-zà-ÿ]{4,}/g)||[]),fq=isNpc(id)?FOLLOW_Q[id].filter(q=>!words.some(w=>q.toLowerCase().includes(w))&&!lastLines(id).some(u=>u.includes(genderize(q,id)))&&!askedSame(id,q)):[];
 const sl=met===0?'':smartLine(id,text);
 return{reponse:met===0?introLine(id):sl+(met<3&&fq.length&&!sl.includes('?')?(/[.!?…\p{Extended_Pictographic}]\s*$/u.test(sl)?' ':'. ')+pickR(fq):''),amitie:s*3+(s===0?1:0),amour:love&&isNpc(id)?(G.rel[id].ami>=50?4:-2):0,proposition:null}}

/* ---------- messages ---------- */
let chat=null,busyId=null;
function pushMsg(id,from,text,extra){
 text=genderize(text,from==='me'?'me':id);
 (G.threads[id]=G.threads[id]||[]).push(Object.assign({from,text,at:G.day*1440+G.min,tm:fmtT(G.min)},extra||{}));
 if(from!=='me'){if(!(chat&&chat.id===id)){G.unreadMsg[id]=(G.unreadMsg[id]||0)+1;if(!$('game').hidden)toast(`💬 ${nameOf(id)} : ${text.slice(0,48)}${text.length>48?'…':''}`)}}
 if(chat&&chat.id===id)drawChatMsgs();
 drawNav();if(view==='messages'&&!chat)drawView();
}
function makePlan(by,when){
 let day=G.day,hour=18;
 if(when==='demain'||G.min>=17*60+30){day=G.day+1;hour=wdOf(day)>=5||!schoolDay(day)?15:18}
 const plan={id:'pl'+Date.now()+Math.floor(Math.random()*999),by,day,hour,place:pickR(['plage','centre','glacier']),status:'pending'};
 G.plans.push(plan);return plan;
}
const planWhen=pl=>`${pl.day===G.day?(pl.hour>=17?'ce soir':"aujourd'hui"):pl.day===G.day+1?'demain':DAYS[wdOf(pl.day)].toLowerCase()} vers ${pl.hour}h`;
const proposalText=(id,pl)=>`${pickR(["Ça te dit","Tu veux bien","Chaud"])} qu'on aille ${PLACE_OUT[pl.place]} ${planWhen(pl)} ? ${id==='jade'?'':pickR(['😄','🌴','✨','😎'])}`.trim();
async function sendChat(text){
 text=(text||'').trim();if(!text||!chat||busyId)return;const id=chat.id;
 pushMsg(id,'me',text);G.st.msgs++;if(isFam(id))G.st.famTalks++;busyId=id;drawChatMsgs();
 let out=null;
 if(SAMPLE){try{out=await SAMPLE.json(buildPrompt(id),{modelTier:'quick',cache:false})}catch(e){if(e&&['not_granted','sampling_disabled','not_declared','capability_disabled','capability_removed'].includes(e.code))SAMPLE=null;out=null}}
 else await new Promise(r=>setTimeout(r,900+Math.random()*900));
 if(!out||typeof out.reponse!=='string'||!out.reponse.trim())out=fallbackReply(id,text);
 if(isNpc(id))G.met[id]=(G.met[id]||0)+1;
 busyId=null;
 const da=clamp(Math.round(+out.amitie||0),-6,6),dl=clamp(Math.round(+out.amour||0),-6,6);
 pushMsg(id,'them',out.reponse.trim().slice(0,400));
 if(isNpc(id)){const ch=relChange(id,da,dl);if(ch)toast(ch)}else famChange(id,da);
 const pr=out.proposition;
 if(pr&&typeof pr==='object'&&isNpc(id)&&!G.plans.some(p=>p.by===id&&p.status==='pending')){const pl=makePlan(id,pr.quand==='demain'?'demain':'ce soir');if(PLACE_OUT[pr.lieu])pl.place=pr.lieu;pushMsg(id,'them',proposalText(id,pl),{plan:pl.id})}
 checkObjectives();saveG();drawChatMsgs();if(chat&&chat.id===id&&$('chatSub'))$('chatSub').innerHTML=chatSub(id);
}
function npcPing(){
 const h=G.min/60;if(h>=23||h<7)return;const ph=phase(),now=G.day*1440+G.min;
 NPCS.forEach(n=>{
  const r=G.rel[n.id],last=G.lastPing[n.id]??-9999;if(r.ami<30||now-last<240||hasMark(n.id,'trahison'))return;
  let p=.03+r.ami/1500+r.amour/900;if(ph.type==='cours')p*=.4;
  /* sans réponse de ta part, il ou elle relance beaucoup moins */const th0=G.threads[n.id]||[];if(th0.length&&th0[th0.length-1].from!=='me')p*=.2;if(Math.random()>p)return;G.lastPing[n.id]=now;
  if(r.amour>=75&&r.ami>=45&&!G.partner&&!G.confessed[n.id]&&!coupleOf(n.id)){G.confessed[n.id]=1;pushMsg(n.id,'them',CONFESS[n.id],{kind:'confess'});note(`${n.name} t'a envoyé un message important 💌`);return}
  if(r.ami>=45&&Math.random()<.45&&h<20&&!G.plans.some(x=>x.by===n.id&&x.status==='pending')){const pl=makePlan(n.id,'ce soir');pushMsg(n.id,'them',proposalText(n.id,pl),{plan:pl.id});return}
  if(r.ami<25){pushMsg(n.id,'them',pickR(["T'as un problème avec moi ?","Je sais ce que t'as dit sur moi.","Évite-moi un peu, merci."]));return}
  /* pas encore fait connaissance : son premier message est une question de nouvelle */
  if(!G.met[n.id]){G.met[n.id]=1;pushMsg(n.id,'them',introLine(n.id));return}
  /* jamais deux fois de suite le même message */
  const th=G.threads[n.id]||[],lastTxt=th.length?th[th.length-1].text:'',L=VOICE[n.id].start.filter(t=>genderize(t,n.id)!==lastTxt&&!th.slice(-4).some(m=>m.text===genderize(t,n.id)));
  pushMsg(n.id,'them',pickR(L.length?L:VOICE[n.id].start.filter(t=>genderize(t,n.id)!==lastTxt)));
 });
}
function familyPing(){
 if(!G.family.length)return;const h=G.min/60,wd=weekday();
 const adulte=()=>pickR(G.family.filter(f=>['parent','grand'].includes(famKind(f.id))).concat(G.family).slice(0,Math.max(1,G.family.filter(f=>['parent','grand'].includes(famKind(f.id))).length))).id;
 if(h===7&&wd<5)pushMsg(adulte(),'them',pickR(["Bonne journée mon cœur ❤️ travaille bien","N'oublie pas ta gourde !","Bon courage pour aujourd'hui 💪"]));
 if(h===18&&!famPending()&&Math.random()<(wd===3||wd===4?.5:.2)){const f=pickR(G.family);const pl=famPlan(f.id);pushMsg(f.id,'them',famProposalText(pl),{plan:pl.id});return}
 if(h===18&&Math.random()<.6)pushMsg(adulte(),'them',pickR(["Tu rentres à quelle heure ?","On mange à 19h30, sois à l'heure","Tu as des devoirs pour demain ?"]));
}
function parentReact(kind){
 const p=G.family.find(f=>/Mère|Père|mère|père|Grand/.test(f.role))||G.family[0];if(!p)return;const strict=/Strict/.test(p.trait);
 const txt={colle:strict?"Une heure de colle ?! On en parle ce soir. Pas de téléphone ce week-end.":"Une colle… sérieusement ? Explique-moi ce qui s'est passé.",
  carnet:strict?"Le lycée m'a prévenu·e pour le mot dans ton carnet. Je ne suis pas content·e.":"J'ai vu le mot dans ton carnet… fais attention, d'accord ?",
  bonne:"Le lycée a mis en ligne ta note, bravo ! Je suis fier·ère de toi 🥰",mauvaise:strict?"Cette note n'est pas acceptable. Révisions ce soir.":"Petite note aujourd'hui… on regarde ça ensemble ce soir ?"}[kind];
 pushMsg(p.id,'them',txt);famChange(p.id,kind==='bonne'?3:strict?-8:-4);
}

/* ---------- autonomie des camarades ---------- */
function link(a,b){return G.links[a][b]}
function autoStep(ph){
 const map=presence(ph);
 Object.values(map).forEach(ids=>{
  for(let i=0;i<ids.length;i++)for(let j=i+1;j<ids.length;j++){
   if(Math.random()>.55)continue;const a=ids[i],b=ids[j],ab=link(a,b),ba=link(b,a);
   const d=Math.round(rnd(-2,4)+(ab.ami>60?1:0));ab.ami=clamp(ab.ami+d,0,100);ba.ami=clamp(ba.ami+d,0,100);
   if(ab.ami>50&&attracted(FICHES[a].o,FICHES[a].g,FICHES[b].g))ab.amour=clamp(ab.amour+Math.round(FICHES[a].rom*rnd(0,4)),0,100);
   if(ba.ami>50&&attracted(FICHES[b].o,FICHES[b].g,FICHES[a].g))ba.amour=clamp(ba.amour+Math.round(FICHES[b].rom*rnd(0,4)),0,100);
   if(ab.amour>60&&ba.amour>55&&!coupleOf(a)&&!coupleOf(b)&&Math.random()<.25){
    G.couples.push([a,b]);
    G.posts.unshift(mkPost({by:'potins',text:`[Officiel] 💞 ${WHO[a].handle} et ${WHO[b].handle} sont ensemble !! On l'avait vu venir ou pas ?`,c:30,r:400,l:9000,comments:[npcComment(pickR(NPCS.filter(n=>n.id!==a&&n.id!==b)).id)]}));
    note(`${WHO[a].name} et ${WHO[b].name} sont maintenant en couple`);
   } else if(d<=-2&&Math.random()<.2){note(`${WHO[a].name} et ${WHO[b].name} se sont accrochés ${PLACES[Object.keys(map).find(k=>map[k].includes(a))]?'au '+PLACES[Object.keys(map).find(k=>map[k].includes(a))].toLowerCase():''}`)}
  }
 });
 G.couples=G.couples.filter(([a,b])=>{if((link(a,b).ami<45||Math.random()<.02)&&Math.random()<.3){
  G.posts.unshift(mkPost({by:'potins',text:`[Anonyme] : c'est fini entre ${WHO[a].handle} et ${WHO[b].handle} 💔 l'ambiance est glaciale`,c:22,r:300,l:7000}));
  note(`${WHO[a].name} et ${WHO[b].name} se sont séparés`);link(a,b).amour=20;link(b,a).amour=20;return false}return true});
}
function presence(ph){
 if(G.pres&&G.pres.key===ph.key)return G.pres.map;
 const places=placesFor(ph.type).filter(p=>p!=='maison'),map=Object.fromEntries(places.map(p=>[p,[]]));
 if(places.length){const r=seeded(hash(ph.key));
  NPCS.forEach(n=>{const f=FICHES[n.id];if(ph.type==='weekend'&&r()<.45)return;
   const w=places.map(p=>p==='cdi'?f.stud+.1:p==='cour'?f.soc+(f.spo||0)*.5:p==='foyer'?(f.soc+f.rom)/2:p==='cantine'?1.6:p==='plage'?f.soc+.3+(f.spo||0)*.4:p==='centre'?f.rom+.3:.5);
   let x=r()*w.reduce((a,b)=>a+b),k=0;while(k<w.length-1&&x>w[k]){x-=w[k];k++}map[places[k]].push(n.id)});
  G.couples.forEach(([a,b])=>{const pa=places.find(p=>map[p].includes(a)),pb=places.find(p=>map[p].includes(b));if(pa&&pb&&pa!==pb){map[pb]=map[pb].filter(x=>x!==b);map[pa].push(b)}});
 }
 G.pres={key:ph.key,map};return map;
}

/* ---------- horloge ---------- */
function advance(n){
 for(let i=0;i<n;i++){
  G.min++;if(G.min>=1440){G.min=0;G.day++;onNewDay()}
  if(G.postQ&&G.postQ.length&&G.postQ[0].at<=G.min)publishDue();
  if(G.min%15===0&&!G.asleep)G.energy=clamp(G.energy-(G.min<420?2:1),0,100);
  if(G.min%60===0&&!G.asleep){npcPing();familyPing();followTick();checkObjectives()}
 }
 const ph=phase();
 if(ph.key!==G.phaseKey){const prev=G.lastPhase;G.phaseKey=ph.key;G.lastPhase=ph;onPhaseChange(prev,ph)}
 evalCatch();checkPlans();drawClock();if(G.min%5===0)saveG();
}
function onPhaseChange(prev,ph){
 if(prev&&prev.type==='cours'&&!G.asleep)endCourse(prev);
 if(prev&&prev.type==='eval')runEval();
 if(prev&&prev.type==='bac')runBacPart(prev);
 if(ph.type==='eval'&&!G.asleep)toast('📝 Évaluation commune : toutes les matières, jusqu\'à 17h');
 if(ph.type==='bac'&&!G.asleep)toast(`🎓 Bac : épreuves de ${ph.subs.map(k=>SUBJ[k]).join(', ')}`);
 if(ph.type==='cours'){G.acts=3;G.cb=0;G.st.schoolToday=true;if(!G.asleep)toast(`🔔 Cours de ${SUBJ[ph.sub]} avec ${ph.prof[0]}`)}
 if(['recre','dej','matin','weekend','soir'].includes(ph.type)){presence(ph);autoStep(ph);G.place=placesFor(ph.type)[0];G.placeKey=ph.key;if(!G.asleep&&ph.type!=='matin')toast(`🔔 ${ph.lbl||PLABEL[ph.type]} : choisis où aller`)}
 if(ph.type==='nuit'&&ph.start===1320&&!G.asleep)toast('🌙 22h : il est l\'heure de dormir');
 if(view==='day')drawView();
}
function endCourse(prev){if(G.cb>0)G.studied[prev.sub]=1}
/* note d'une matière tirée de la jauge de chances (0-100 %) */
function examGrade(k,stress){const p=G.know[k];return clamp(Math.round((p/100*20+rnd(-(stress||2.2),stress||2.2)+(G.energy<25?-1.5:0))*2)/2,0,20)}
function popSheet(html){if(G.asleep||$('game').hidden)G.pend.push(html);else openSheet(html,true)}
function flushPend(){/* une fête déjà passée ne s'affiche plus */G.pend=(G.pend||[]).filter(h=>!h.includes('data-fend=')||fetesOpen().some(f=>h.includes(`data-fend="${f.id}"`)));if(G.pend.length&&$('sheet').hidden)openSheet(G.pend.shift(),true)}
const sheetHead=(t,sub)=>`<div class="who"><div style="flex:1;min-width:0"><h2>${t}</h2>${sub?`<p class="muted" style="margin:2px 0 0">${sub}</p>`:''}</div><button class="gbtn ghost" type="button" data-close aria-label="Fermer">✕</button></div>`;
const gradeRows=o=>Object.keys(SUBJ).filter(k=>o[k]!=null).map(k=>`<div class="prof"><span>${SUBJ[k]}</span><b>${fmtG(o[k])}/20</b></div>`).join('');
function evalSheet(e){return sheetHead(`Évaluation du jour ${e.sd}`,`Trimestre ${e.tri} · note globale ${fmtG(e.glob)}/20`)+`<div class="card list">${gradeRows(e.grades)}</div><p class="muted">Chaque note vient de tes chances de réussite dans la matière au moment de l'évaluation.</p>`}
function evalCatch(){const wd=weekday();let d=G.day;if(wd===4&&G.min<1020)d-=7;else if(wd!==4)d-=wd>4?wd-4:wd+3;const sd=d>=1?schoolDay(d):null;if(sd&&sd<=TRI_END[2]&&!G.evals.some(e=>e.sd===sd))runEval(sd)}
function runEval(sdArg){
 const sd=sdArg||schoolDay(G.day);if(!sd||sd>TRI_END[2]||G.evals.some(e=>e.sd===sd))return;
 const bon=(G.evalBonus||{})[schoolDayToCal(sd)]||{},grades={};Object.keys(SUBJ).forEach(k=>{grades[k]=clamp(examGrade(k)+(bon[k]||0),0,20);G.grades.push({sub:k,v:grades[k],day:G.day,sd})});
 const e={sd,tri:triOf(sd),grades,glob:r2(mean(Object.values(grades)))};G.evals.push(e);
 note(`Évaluation du vendredi : ${fmtG(e.glob)}/20 de note globale`);if(!G.asleep)toast(`📝 Évaluation : ${fmtG(e.glob)}/20`);
 if(e.glob>=14)parentReact('bonne');else if(e.glob<9)parentReact('mauvaise');
 popSheet(evalSheet(e));
 if(TRI_END.includes(sd))makeBulletin(e.tri);
 checkObjectives();saveG();
}
const APP=v=>v>=16?'Excellent trimestre, bravo.':v>=14?'Très bon travail, continue ainsi.':v>=12?'Bon trimestre, travail sérieux.':v>=10?'Résultats satisfaisants, à consolider.':v>=8?'Résultats fragiles : il faut réviser davantage.':'Insuffisant : un vrai effort est attendu.';
const MENT=v=>v>=16?'Félicitations du conseil de classe':v>=14?'Compliments':v>=12?'Encouragements':v>=10?'Passage validé':v>=8?'Mise en garde travail':'Avertissement travail';
function bulletinSheet(b){return sheetHead(`Bulletin du ${b.tri===1?'1er':b.tri+'e'} trimestre`,`Moyenne générale ${fmtG(b.avg)}/20 · ${b.ok?'moyenne atteinte ✅':'moyenne non atteinte ❌'}`)
 +`<div class="card list">${Object.keys(SUBJ).filter(k=>b.subs[k]!=null).map(k=>`<div class="bul"><div class="prof"><span>${SUBJ[k]} <small class="muted">${PROFS[k][0]}</small></span><b>${fmtG(b.subs[k])}/20</b></div><small class="muted">${APP(b.subs[k])}</small></div>`).join('')}</div>
 <div class="card"><span class="eyebrow">Appréciation générale</span><p><b>${MENT(b.avg)}</b> · ${b.n} évaluation${b.n>1?'s':''} ce trimestre.</p></div>`}
function makeBulletin(t){
 if(G.bulletins.some(b=>b.tri===t))return;
 const ev=G.evals.filter(e=>e.tri===t);if(!ev.length)return;
 const subs={};Object.keys(SUBJ).forEach(k=>{subs[k]=r2(mean(ev.map(e=>e.grades[k])))});
 const a=r2(mean(Object.values(subs))),b={tri:t,subs,avg:a,ok:a>=10,n:ev.length};G.bulletins.push(b);
 note(`Bulletin du trimestre ${t} : ${fmtG(a)}/20 de moyenne`);if(!G.asleep)toast(`📄 Bulletin du trimestre ${t} : ${fmtG(a)}/20`);
 parentReact(b.ok?'bonne':'mauvaise');popSheet(bulletinSheet(b));
}
const bacGrade=k=>clamp(Math.round((examGrade(k,2.8)+((G.bac.bonus||{})[k]||0))*2)/2,0,20);
function runBacPart(ph){ph.subs.forEach(k=>{if(G.bac.scores[k]==null)G.bac.scores[k]=bacGrade(k)});note(`Bac : épreuves de ${ph.subs.map(k=>SUBJ[k]).join(', ')} terminées`);saveG()}
function bacSheet(r){return sheetHead('Résultats du bac',P(r.ok?`Admis·e${r.ment?' · mention '+r.ment:''} 🎉`:'Non admis·e 😔'))
 +`<div class="card"><div class="prof"><span>Épreuves finales (60 %)</span><b>${fmtG(r.ep)}/20</b></div><div class="prof"><span>Contrôle continu : moyenne des 3 trimestres (40 %)</span><b>${fmtG(r.cc)}/20</b></div><div class="prof"><span>Note finale</span><b>${fmtG(r.fin)}/20</b></div>${r.ratt?`<p class="muted">${P('Tu es passé·e')} par l'oral de rattrapage : ${r.ok?'réussi, tu obtiens ton bac !':'raté de peu.'}</p>`:''}</div>
 <div class="card list">${gradeRows(G.bac.scores)}</div>`}
function computeBac(){
 if(G.bac.result)return;
 Object.keys(SUBJ).forEach(k=>{if(G.bac.scores[k]==null)G.bac.scores[k]=bacGrade(k)});
 const ep=r2(mean(Object.values(G.bac.scores))),cc=r2(mean(G.bulletins.map(b=>b.avg))??ep),fin=r2(.6*ep+.4*cc);
 let ok=fin>=10,ratt=false;if(!ok&&fin>=8){ratt=true;ok=Math.random()<mean(Object.values(G.know))/100}
 const ment=!ok||ratt?null:fin>=16?'Très bien':fin>=14?'Bien':fin>=12?'Assez bien':null;
 G.bac.result={ep,cc,fin,ok,ratt,ment};
 note(P(`Résultats du bac : ${ok?'admis·e':'non admis·e'} (${fmtG(fin)}/20)`));parentReact(ok?'bonne':'mauvaise');popSheet(bacSheet(G.bac.result));checkObjectives();
}
function endYearSheet(){const r=G.bac.result||{};return sheetHead("Fin de l'année de terminale",r.ok?'Bac en poche 🎓':'Année terminée')
 +`<div class="card list">${G.bulletins.map(b=>`<div class="prof"><span>Trimestre ${b.tri}</span><b>${fmtG(b.avg)}/20 ${b.ok?'✅':'❌'}</b></div>`).join('')}<div class="prof"><span>Bac</span><b>${r.fin!=null?P(fmtG(r.fin)+'/20 · '+(r.ok?'admis·e':'non admis·e')):'–'}</b></div></div><p class="muted">Les vacances commencent : tu peux continuer à profiter de tes amis et de ta famille.</p>`}
function onNewDay(){
 fanDay();groupTick();weekTick();
 Object.keys(SUBJ).forEach(k=>{if(!G.studied[k]&&G.know[k]>15)G.know[k]=G.know[k]-1});G.studied={};
 {const sd=schoolDay(G.day);if(sd===RES_DAYS[0])computeBac();if(!G.yearDone&&sdDone(G.day)>=YEAR_DAYS&&schoolDay(G.day)===null&&G.day>schoolDayToCal(YEAR_DAYS)){G.yearDone=true;popSheet(endingSheet())}}
 if(G.st.schoolToday&&!G.st.caughtToday)G.st.cleanDays++;
 G.st.caughtToday=false;G.st.schoolToday=false;G.ate=false;G.rested=false;G.done={};
 dailyContent();incidentDay();feteDay();
 const fresh=OBJ.filter(o=>objOk(o)&&o.day===G.day);if(fresh.length){note(`Nouveaux objectifs : ${fresh.map(o=>o.t).join(' · ')}`);if(!G.asleep)toast('🎯 Nouveaux objectifs disponibles')}
 G.plans=G.plans.filter(p=>p.day>=G.day-1);
}
function dailyContent(){
 [...NPCS].sort(()=>Math.random()-.5).slice(0,3).forEach(n=>{
  if(Math.random()<.5)G.stories.push({id:'st'+Date.now()+n.id,by:n.id,type:'text',text:pickR(STORY_POOL),bg:Math.floor(Math.random()*STORY_BG.length),seen:false,reacted:false});
  else{const c=coupleOf(n.id),withMe=G.rel[n.id].ami>=65&&Math.random()<.5,friend=c&&c!=='me'?c:pickR(NPCS.filter(x=>x.id!==n.id)).id;
   G.stories.push({id:'st'+Date.now()+n.id,by:n.id,type:'photo',photo:{scene:pickR(Object.keys(SCENES)),people:[n.id,withMe?'me':friend],author:n.id},text:withMe?'Avec '+myHandle()+' 💛':c&&c!=='me'?'💞':'',seen:false,reacted:false});
   if(withMe)note(`${n.name} t'a identifié dans sa story`)}
 });
 /* posts du jour : 2 camarades selon leur personnalité, Jade poste souvent un poème, parfois un potin */
 planPosts();
 if(Math.random()<.5){G.postQ.push({pool:pickR(POST_POOL),at:480+Math.floor(Math.random()*780)});G.postQ.sort((a,b)=>a.at-b.at)}
 G.stories=G.stories.slice(-40);G.posts=G.posts.filter((p,i)=>i<120||p.by==='me');
}
/* ---------- fêtes et manifestations du lycée ----------
   date = vraie date de la fête ; si ce jour-là il n'y a pas cours, la fête a lieu le dernier jour de cours avant.
   Chaque fête propose des actions (FETE_MAX au choix) ; certaines demandent de choisir un personnage. */
const FETE_MAX=3;
const best=n=>NPCS.slice().sort((a,b)=>G.rel[b.id].ami-G.rel[a.id].ami).slice(0,n).map(x=>x.id);
const rndNpc=n=>NPCS.slice().sort(()=>Math.random()-.5).slice(0,n).map(x=>x.id);
const joinFx=a=>a.filter(Boolean).join(' · ');
const sayTo=(id,L)=>pushMsg(id,'them',genderize(pickR(L),id));
const CLUB={ines:'club de danse',kylian:'équipe de foot',maelle:'pom-pom girls',noah:'équipe de basket',jade:"atelier d'écriture",anais:'équipe de hand',kenza:'club de danse',eva:"atelier d'arts plastiques",noemie:'équipe de foot',jessica:'journal du lycée',meisha:'journal du lycée',sacha:'club de musique'};
function fPhoto(f,ppl,text,g){const p=mkPost({by:'me',text,photo:{scene:f.scene,people:['me',...ppl.slice(0,2)],author:'me'},l:30+Math.floor(Math.random()*60),mine:true});
 ppl.slice(0,2).forEach(id=>p.comments.push(npcComment(id)));G.posts.unshift(p);G.st.posts++;G.ig.fans+=g;G.ig.act=(G.ig.act||0)+1;return `photo publiée sur Insta, +${g} abonnés`}
const fPotins=t=>G.posts.unshift(mkPost({by:'potins',text:'[Anonyme] : '+t,c:30+Math.floor(Math.random()*30),r:300,l:9000+Math.floor(Math.random()*6000)}));
/* jalousie : un geste romantique pour quelqu'un d'autre que ton ou ta partenaire */
const jealous=to=>{if(!G.partner||G.partner===to)return '';sayTo(G.partner,["Sérieux ?? Devant tout le monde ? 😒","J'ai vu. On en parle plus tard.","Je pensais qu'on était ensemble…"]);return relChange(G.partner,-4,-10)};
const likesBack=(to,a)=>npcLikesMe(to)&&G.rel[to].ami>=a;
const LOVE={
 flamme(to){const n=WHO[to].name,r=G.rel[to],j=jealous(to);
  if(G.partner===to){sayTo(to,["Moi aussi je t'aime 🥹❤️","T'es la meilleure chose de mon année 💞"]);return joinFx([`${n} est déjà avec toi, et fond complètement 💞`,relChange(to,2,5),j])}
  if(likesBack(to,35)&&r.amour>=35&&!coupleOf(to)){G.partner=to;r.amour=Math.max(r.amour,90);G.confessAns[to]='yes';sayTo(to,["Moi aussi… depuis longtemps 🥹❤️","J'attendais que tu le dises 🙈💘"]);
   G.posts.unshift(mkPost({by:'potins',text:`[Officiel] 💘 Saint-Valentin : ${myHandle()} et ${WHO[to].handle}, c'est officiel !`,c:60,r:900,l:24000}));note(`Tu es en couple avec ${n} 💞`);return joinFx([`${n} dit oui ! Vous êtes en couple 💞`,j])}
  if(likesBack(to,25)){sayTo(to,["Je… je sais pas quoi dire 🙈 laisse-moi un peu de temps","Tu me fais rougir là… on en reparle ? 🥹"]);return joinFx([`${n} rougit et demande un peu de temps`,relChange(to,1,6),j])}
  sayTo(to,["T'es adorable, mais je ne te vois pas comme ça… désolé·e 😕","Je t'apprécie beaucoup, mais en ami·e."]);if(Math.random()<.4)fPotins(`une déclaration à ${WHO[to].handle} devant le foyer… et un râteau 😬`);
  return joinFx([`${n} te dit gentiment non 💔`,relChange(to,-2,0),j])},
 rencard(to){const n=WHO[to].name,j=jealous(to);
  if(likesBack(to,30)||G.partner===to){const pl=makePlan(to,'demain');pl.status='accepted';pl.place=pickR(['glacier','plage','centre']);note(`Rencard avec ${n} ${PLACE_OUT[pl.place]} ${planWhen(pl)}`);sayTo(to,["Un rencard ? Carrément 🥰","Ok… j'ai trop hâte 🙈"]);return joinFx([`${n} accepte un rencard ${PLACE_OUT[pl.place]} ${planWhen(pl)} 💕`,relChange(to,1,5),j])}
  sayTo(to,["Pas cette fois… mais merci 😅","Hmm, je préfère qu'on reste potes 😕"]);return joinFx([`${n} refuse le rencard`,relChange(to,-1,0),j])},
 rose(to){const n=WHO[to].name,j=jealous(to);fPotins(`quelqu'un a offert une rose à ${WHO[to].handle} ce matin 🌹 on enquête 👀`);
  if(likesBack(to,30)){sayTo(to,["une rose… pour moi ? 🥹🌹","je la garde, promis 🌹"]);return joinFx([`${n} est touché·e par ta rose 🌹`.replace('touché·e',S(to,'touché·e')),relChange(to,2,8),j])}
  sayTo(to,["merci pour la rose, c'est gentil 😊","oh, merci ! 🌹"]);return joinFx([`${n} te remercie pour la rose`,relChange(to,1,0),j])},
 lettre(to){const n=WHO[to].name,j=jealous(to);
  if(likesBack(to,20)){sayTo(to,["j'ai lu ta lettre trois fois 🥹","personne ne m'avait jamais écrit comme ça… 💌"]);return joinFx([`${n} adore ta lettre d'amour 💌`,relChange(to,2,7),j])}
  sayTo(to,["euh… j'ai lu ta lettre. c'est gentil mais 😅","merci pour la lettre… je sais pas trop quoi répondre"]);if(Math.random()<.3)fPotins(`une lettre d'amour pour ${WHO[to].handle} a été retrouvée dans le couloir 💌👀`);
  return joinFx([`${n} est un peu gêné·e par ta lettre`.replace('gêné·e',S(to,'gêné·e')),relChange(to,-1,0),j])},
 chocolats(to){const n=WHO[to].name;pushMsg(to,'them',pickR([P("Des chocolats !! T'es trop gentil·le 😍"),"merci pour les chocolats 🍫🥰","miam, merci ! 🍫"]));
  return joinFx([`${n} adore les chocolats 🍫`,relChange(to,3,likesBack(to,20)?3:0)])}};
const COSTUMES=['vampire 🧛','sorcière 🧙','zombie 🧟','soukougnan 🔥','chat noir 🐈‍⬛','squelette 💀'];
const CARNAVAL=['madras et foulard 🌺','diable rouge 😈','pierrot 🤡','super-héros 🦸','marin ⚓'];
const FETES=[
 /* événements locaux : free = à la vraie date, même sans cours */
 {id:'cyclone',date:'2026-09-15',n:'Alerte cyclone orange',ic:'🌀',scene:'chambre',post:"[Officiel] 🌀 Alerte orange cyclone : cours suspendus à midi. Rentrez chez vous, faites des réserves d'eau et restez à l'abri. Prenez soin de vous 🙏",info:"Météo-France place la Guadeloupe en alerte orange. Les cours s'arrêtent à midi et tout le monde rentre se mettre à l'abri.",acts:[
  {l:'Aider ta famille à préparer la maison',sm:'Famille',e:6,fx:()=>{G.family.forEach(f=>famChange(f.id,6));return "Volets fermés, bidons d'eau remplis, bougies prêtes : ta famille est fière de toi · complicité familiale +6"}},
  {l:"Envoyer un message rassurant à quelqu'un",sm:'Amitié',pick:'any',e:0,fx:to=>{pushMsg(to,'me',"Ça va chez toi ? Fais attention à toi pendant le cyclone 🙏");pushMsg(to,'them',pickR(["Merci, c'est gentil 🙏 On est à l'abri","Ça va, on a tout préparé. Merci d'avoir pensé à moi","Merci… ça me touche que tu m'écrives"]));return joinFx([`${WHO[to].name} est touché·e par ton message`.replace('touché·e',S(to,'touché·e')),relChange(to,6)])}},
  {l:'Réviser à la lueur des bougies',sm:'Une matière +6 %',pick:'list',list:Object.values(SUBJ),e:4,fx:i=>{const k=Object.keys(SUBJ)[i];G.know[k]=clamp(G.know[k]+6,0,100);return `Coupure de courant, mais tu révises ${SUBJ[k]} à la bougie · +6 %`}},
  {l:'Suivre les infos et dormir tôt',sm:'+15 énergie',e:0,fx:()=>{G.energy=clamp(G.energy+15,0,100);return "Le cyclone passe au large. Ouf ! · +15 énergie"}}],free:1},
 {id:'plage1',date:'2026-09-26',n:'Journée à la plage de la Datcha',ic:'🏖️',scene:'plage',post:"[Anonyme] Demain toute la terminale à la Datcha 🏖️ Qui ramène la glacière ? 😎",info:"Samedi de soleil : la moitié de la classe se retrouve à la plage de la Datcha, au Gosier.",acts:[
  {l:"Y aller avec quelqu'un",sm:'Grosse amitié',pick:'any',e:6,fx:(to,f)=>joinFx([`Baignade, bokits et fous rires avec ${WHO[to].name} 🌊`,relChange(to,7),fPhoto(f,[to],'Journée à la Datcha 🏖️☀️',4)])},
  {l:'Faire un volley sur la plage',sm:'Amitié avec les sportifs',e:8,fx:()=>joinFx(["Match de beach-volley endiablé 🏐",relChange('kylian',3),relChange('anais',3),relChange('noah',2)])},
  {l:'Aller à la plage en famille',sm:'Famille',e:3,fx:()=>{G.family.forEach(f=>famChange(f.id,5));return "Pique-nique en famille sous les raisins-bord-de-mer · complicité familiale +5"}},
  {l:'Rester chez toi',sm:'+20 énergie',e:0,fx:()=>{G.energy=clamp(G.energy+20,0,100);return "Grasse matinée et série : tu recharges tes batteries · +20 énergie"}}],free:1},
 {id:'toussaint',date:'2026-11-01',n:'Toussaint : les cimetières illuminés',ic:'🕯️',scene:'soiree',post:"[Officiel] 🕯️ Ce soir les cimetières de Guadeloupe s'illuminent. Pensées pour celles et ceux qui nous ont quittés 🤍",info:"Le soir de la Toussaint, les familles guadeloupéennes nettoient les tombes, allument des milliers de bougies et se retrouvent au cimetière jusque tard dans la nuit.",acts:[
  {l:'Aller au cimetière avec ta famille',sm:'Famille',e:4,fx:()=>{G.family.forEach(f=>famChange(f.id,7));return "Vous allumez des bougies sur la tombe de tes arrière-grands-parents. Ta famille te raconte des souvenirs · complicité familiale +7"}},
  {l:"Y retrouver quelqu'un",sm:'Amitié et confiance',pick:'any',e:3,fx:to=>joinFx([`Tu croises ${WHO[to].name} entre les bougies. Vous parlez longtemps de vos familles 🕯️`,relChange(to,6)])},
  {l:'Prendre une photo des bougies',sm:'Abonnés',e:0,fx:f=>'Une mer de lumière 🕯️ · '+fPhoto(f,[],'Les cimetières illuminés de la Toussaint 🕯️🤍',5)},
  {l:'Rester tranquille à la maison',sm:'+15 énergie',e:0,fx:()=>{G.energy=clamp(G.energy+15,0,100);return "Soirée calme · +15 énergie"}}],free:1},
 {id:'expose',date:'2027-01-21',n:"Projet de classe : l'exposé d'histoire",ic:'📚',scene:'couloir',post:"[Officiel] 📚 Présentation des exposés d'histoire aujourd'hui : « La Guadeloupe d'hier à aujourd'hui ». Bonne chance à tous les groupes !",info:"Chaque groupe présente son exposé devant la classe. La note compte pour le trimestre.",acts:[
  {l:"Présenter l'exposé avec quelqu'un",sm:'Note d\'histoire et amitié',pick:'any',e:4,fx:to=>{const v=clamp(Math.round((G.know.histoire/100*14+4+FICHES[to].stud*4+(G.rel[to].ami>=40?1:-1))*2)/2,0,20);G.grades.push({sub:'histoire',v,day:G.day,sd:schoolDay(G.day)});G.know.histoire=clamp(G.know.histoire+4,0,100);
   return joinFx([`Exposé avec ${WHO[to].name} : ${fmtG(v)}/20`,v>=12?relChange(to,6):relChange(to,2)])}},
  {l:'Faire tout le travail à la place du groupe',sm:'Bonne note, mais fatigue',e:12,fx:()=>{const v=clamp(Math.round((G.know.histoire/100*16+5)*2)/2,0,20);G.grades.push({sub:'histoire',v,day:G.day,sd:schoolDay(G.day)});return `Tu portes tout l'exposé : ${fmtG(v)}/20, mais tu es épuisé·e`.replace('épuisé·e',P('épuisé·e'))}},
  {l:'Laisser les autres présenter',sm:'Risqué',pick:'any',e:0,fx:to=>joinFx([`${WHO[to].name} présente à ta place… et te le reproche après`,relChange(to,-8),G.rel[to].ami<20?(mark(to,'abandon'),''):''])}]},
 {id:'rentree',date:'2026-09-01',n:'Rentrée des terminales',ic:'🎒',scene:'cour',post:"[Officiel] Bienvenue aux terminales 🎒 Nouvelle année, nouveaux drames. On vous surveille 👀",info:"C'est ta première journée dans ce lycée : discours de la proviseure, visite, inscriptions aux clubs.",acts:[
  {l:"Te présenter à quelqu'un",sm:"Faire connaissance",pick:'any',e:0,fx:to=>{G.met[to]=Math.max(G.met[to]||0,1);return joinFx([`Tu te présentes à ${WHO[to].name}. ${WHO[to].name} : « ${introLine(to)} »`,relChange(to,3)])}},
  {l:"Visiter le lycée avec quelqu'un",sm:"Amitié",pick:'any',e:3,fx:to=>joinFx([`${WHO[to].name} te fait visiter le lycée`,relChange(to,5)])},
  {l:"T'inscrire à un club",sm:"Grosse amitié avec un membre",pick:'club',e:0,fx:to=>{G.club=to;const k=CLUB_OLD[to];if(!myClubs().includes(k)&&myClubs().length<CLUB_MAX)G.clubs=[...myClubs(),k];return joinFx([`Tu rejoins le ${CLUBS[k].n.toLowerCase()} avec ${WHO[to].name}`,relChange(to,6)])}},
  {l:"Écouter le discours de la proviseure",sm:"Connaître les règles",e:0,fx:()=>{const id=pickR(NPCS).id;return joinFx([`La proviseure rappelle les règles. ${WHO[id].name} te chuchote une blague pendant le discours 😂`,relChange(id,2)])}}]},
 {id:'halloween',date:'2026-10-31',n:'Soirée Halloween au foyer',ic:'🎃',scene:'soiree',post:"[Officiel] 🎃 Soirée Halloween au foyer ! Déguisement obligatoire, même pour les profs 👻 Qui sera le plus effrayant ?",info:"Soirée déguisée au foyer après les cours.",acts:[
  {l:"Choisir ton déguisement",sm:"Photo sur Insta",pick:'list',list:COSTUMES,e:2,fx:(i,f)=>{G.costume=COSTUMES[i];return `Déguisement de ${COSTUMES[i]} · `+fPhoto(f,best(2),`🎃 Mon déguisement de ${COSTUMES[i]} pour Halloween`,4+Math.floor(Math.random()*5))}},
  {l:"Faire peur à quelqu'un",sm:"Ça passe… ou ça casse",pick:'any',e:2,fx:to=>FICHES[to].hum>.5?joinFx([`${WHO[to].name} hurle puis éclate de rire 😂`,relChange(to,4)]):joinFx([`${WHO[to].name} n'a pas du tout apprécié 😬`,relChange(to,-3)])},
  {l:"Concours du meilleur déguisement",sm:GEMS_ON?"Gemmes si tu gagnes":"Un titre si tu gagnes",e:3,fx:()=>{if(Math.random()<(G.costume?.55:.25)){G.gems+=5;fPotins(`${myHandle()} a gagné le concours du meilleur déguisement 🏆🎃`);return 'Tu gagnes le concours du meilleur déguisement 🏆'+gemTxt(' · +5 gemmes')}return 'Pas de victoire cette fois, mais tout le monde a adoré'}},
  {l:"Danser avec quelqu'un",sm:"Amitié, et plus si affinités",pick:'any',e:4,fx:to=>joinFx([`Tu danses avec ${WHO[to].name} 🕺`,relChange(to,3,likesBack(to,30)?4:0)])}]},
 {id:'telethon',date:'2026-12-04',n:'Téléthon du lycée',ic:'💛',scene:'basket',post:"[Officiel] 💛 Téléthon au gymnase aujourd'hui : tournoi de hand, ventes de gâteaux et défis. Anaïs a déjà promis 200 pompes 😂",info:"Tournoi, ventes et défis au gymnase pour récolter des dons.",acts:[
  {l:"Jouer le tournoi de hand avec Anaïs",sm:"Amitié avec Anaïs",e:8,fx:()=>{G.ig.fans+=3;return joinFx(['Vous gagnez deux matchs 🤾',relChange('anais',5)])}},
  {l:"Tenir le stand de gâteaux avec Noah",sm:"Amitié avec Noah",e:3,fx:()=>joinFx(['Le stand est vide en une heure 🍰',relChange('noah',5)])},
  {l:"Relever le défi des pompes",sm:"Abonnés",e:8,fx:()=>{const g=5+Math.floor(Math.random()*5);G.ig.fans+=g;fPotins(`${myHandle()} a fait 50 pompes devant tout le gymnase 💪`);return `Tout le gymnase t'applaudit · +${g} abonnés`}},
  {l:"Faire un don (5 gemmes)",gems:1,sm:"Le lycée apprécie",e:0,fx:()=>{if(G.gems<5)return "Il te faut 5 gemmes pour faire un don";G.gems-=5;return joinFx(['Merci pour ton don 💛',...rndNpc(2).map(id=>relChange(id,2))])}}]},
 {id:'nwel',date:'2026-12-18',n:'Chanté Nwèl au lycée',ic:'🎄',scene:'cour',post:"[Officiel] 🎄 Chanté Nwèl dans la cour cet après-midi ! Ka, cantiques et jus de groseille pays. Sacha a promis un solo de ka 🥁",info:"Dernier jour avant les vacances de Noël : on chante Nwèl tous ensemble dans la cour.",acts:[
  {l:"Chanter avec la chorale",sm:"Photo sur Insta",e:3,fx:f=>'Tu chantes à pleine voix 🎶 · '+fPhoto(f,best(2),'🎄 Chanté Nwèl au lycée 🎶',4+Math.floor(Math.random()*5))},
  {l:"Jouer du ka avec Sacha",sm:"Amitié avec Sacha",e:4,fx:()=>joinFx(['Sacha te montre les rythmes du ka 🥁',relChange('sacha',6)])},
  {l:"Servir le jus de groseille et le schrubb",sm:"Amitiés",e:2,fx:()=>joinFx(['Tout le monde vient te voir au stand 🥤',...rndNpc(2).map(id=>relChange(id,2))])},
  {l:"Offrir un cadeau à quelqu'un",sm:"Grosse amitié",pick:'any',e:0,fx:to=>{sayTo(to,["merci pour le cadeau 🎁🥹","t'as pensé à moi, c'est trop gentil 🎄"]);return joinFx([`${WHO[to].name} adore ton cadeau 🎁`,relChange(to,5)])}}]},
 {id:'carnaval',date:'2027-02-09',n:'Carnaval du lycée',ic:'🎭',scene:'cour',post:"[Officiel] 🎭 Défilé du carnaval du lycée aujourd'hui ! Costumes, groupe à peau et gwo ka. Les terminales défilent en dernier 🔥",info:"Grand défilé déguisé dans la cour et autour du lycée, au son du groupe à peau.",acts:[
  {l:"Choisir ton costume",sm:"Photo sur Insta",pick:'list',list:CARNAVAL,e:2,fx:(i,f)=>`Costume ${CARNAVAL[i]} · `+fPhoto(f,best(2),`🎭 En ${CARNAVAL[i]} pour le carnaval du lycée`,4+Math.floor(Math.random()*6))},
  {l:"Défiler avec le groupe à peau",sm:"Beaucoup d'abonnés",e:10,fx:()=>{const g=8+Math.floor(Math.random()*6);G.ig.fans+=g;return `Tu défiles au son des tambours 🥁🔥 · +${g} abonnés`}},
  {l:"Défiler avec quelqu'un",sm:"Amitié, photo ensemble",pick:'any',e:6,fx:(to,f)=>joinFx([`Tu défiles avec ${WHO[to].name}`,relChange(to,5),fPhoto(f,[to],`🎭 Carnaval avec ${WHO[to].handle}`,3)])},
  {l:"Filmer le défilé pour Insta",sm:"Abonnés",e:1,fx:()=>{const g=4+Math.floor(Math.random()*4);G.ig.fans+=g;return `Ta vidéo du défilé tourne dans tout le lycée · +${g} abonnés`}}]},
 {id:'valentin',date:'2027-02-14',n:'Saint-Valentin',ic:'💘',scene:'couloir',post:"[Anonyme] : Saint-Valentin au lycée 💘 roses, chocolats et lettres d'amour au foyer. On va enfin savoir qui aime qui 👀",info:"Roses, chocolats et lettres d'amour au foyer : c'est le moment de dire ce que tu ressens… ou pas.",acts:[
  {l:'Déclarer ta flamme',sm:'Tout ou rien 💘',pick:'love',e:0,fx:to=>LOVE.flamme(to)},
  {l:'Proposer un rencard',sm:'Sortie à deux',pick:'love',e:0,fx:to=>LOVE.rencard(to)},
  {l:'Offrir une rose',sm:'Amour',pick:'love',e:0,fx:to=>LOVE.rose(to)},
  {l:"Envoyer une lettre d'amour",sm:'Amour, un peu risqué',pick:'love',e:0,fx:to=>LOVE.lettre(to)},
  {l:'Offrir des chocolats',sm:'À qui tu veux',pick:'any',e:0,fx:to=>LOVE.chocolats(to)}]},
 {id:'micareme',date:'2027-03-04',n:'Mi-Carême',ic:'🖤',scene:'cour',post:"[Officiel] Mi-Carême 🖤❤️ Tenue rouge et noir demandée aujourd'hui. Petit défilé à la récré !",info:"Tout le lycée s'habille en rouge et noir, défilé pendant la récré.",acts:[
  {l:'Venir en rouge et noir',sm:'Photo sur Insta',e:0,fx:f=>'Tu es en rouge et noir 🖤❤️ · '+fPhoto(f,best(1),'🖤❤️ Mi-Carême au lycée',3+Math.floor(Math.random()*4))},
  {l:'Défiler pendant la récré',sm:'Amitiés',e:5,fx:()=>joinFx(['Tu défiles dans la cour 🥁',...rndNpc(2).map(id=>relChange(id,2))])},
  {l:"Défiler avec quelqu'un",sm:'Amitié',pick:'any',e:4,fx:to=>joinFx([`Tu défiles avec ${WHO[to].name}`,relChange(to,4)])}]},
 {id:'paques',date:'2027-03-28',n:'Pâques au lycée',ic:'🦀',scene:'cour',post:"[Officiel] 🐣 Chasse aux œufs au lycée avant les vacances ! Et le club cuisine prépare un matoutou crabe pour tout le monde 🦀",info:"Chasse aux œufs dans tout le lycée et matoutou crabe préparé par le club cuisine.",acts:[
  {l:"Chercher les œufs avec quelqu'un",sm:GEMS_ON?'Amitié, gemmes si tu trouves':'Amitié',pick:'any',e:4,fx:to=>{const ok=Math.random()<.5;if(ok)G.gems+=3;return joinFx([`Tu cherches les œufs avec ${WHO[to].name}${ok?' et vous trouvez le gros œuf doré 🥚✨'+gemTxt(' (+3 gemmes)'):''}`,relChange(to,4)])}},
  {l:'Goûter le matoutou crabe',sm:'+10 énergie',e:0,fx:()=>{G.energy=clamp(G.energy+10,0,100);return 'Le matoutou crabe est incroyable 🦀 · +10 énergie'}},
  {l:'Aider le club cuisine',sm:'Amitié avec Noah',e:4,fx:()=>joinFx(['Noah te montre le secret du matoutou 🦀',relChange('noah',5)])},
  {l:"Partager tes œufs en chocolat avec quelqu'un",sm:'Amitié',pick:'any',e:0,fx:to=>joinFx([`${WHO[to].name} est ravi·e`.replace('ravi·e',S(to,'ravi·e')),relChange(to,4,likesBack(to,30)?2:0)])}]},
 {id:'abolition',date:'2027-05-27',n:"Commémoration de l'abolition",ic:'✊🏾',scene:'couloir',post:"[Officiel] Le 27 mai, la Guadeloupe commémore l'abolition de l'esclavage (1848). Au CDI aujourd'hui : exposition des travaux des élèves. Venez nombreux.",info:"Exposition au CDI sur l'abolition de l'esclavage en Guadeloupe, préparée par les élèves. Un moment pour apprendre et se souvenir.",acts:[
  {l:"Visiter l'exposition au CDI",sm:'Histoire-Géo +5 %',e:0,fx:()=>{G.know.histoire=clamp(G.know.histoire+5,0,100);return "Tu découvres l'histoire de 1848 en Guadeloupe · Histoire-Géo +5 %"}},
  {l:'Écouter les élèves présenter leurs travaux',sm:'Histoire-Géo +3 %',e:0,fx:()=>{G.know.histoire=clamp(G.know.histoire+3,0,100);return joinFx(['Jade présente un texte très fort sur la mémoire',relChange('jade',2)])}},
  {l:"Écrire un message dans le livre d'or",sm:'Un mot pour se souvenir',e:0,fx:()=>'Tu laisses un message dans le livre d\'or de l\'exposition'}]},
 {id:'musique',date:'2027-06-21',n:'Fête de la musique',ic:'🎶',scene:'cour',post:"[Officiel] 🎶 Fête de la musique dans la cour à midi ! Scène ouverte : Sacha, Inès et le club de danse sont sur la liste 🔥",info:"Scène ouverte dans la cour à midi : chant, danse, musique.",acts:[
  {l:'Monter sur scène pour chanter',sm:'Beaucoup d\'abonnés… si ça marche',e:6,fx:()=>{if(Math.random()<.6){const g=10+Math.floor(Math.random()*8);G.ig.fans+=g;fPotins(`${myHandle()} a mis le feu à la scène ouverte 🎤🔥`);return `Le public adore 🎤🔥 · +${g} abonnés`}G.ig.fans+=2;return 'Un peu de trac, mais tu vas jusqu\'au bout 💪 · +2 abonnés'}},
  {l:"Faire un duo avec quelqu'un",sm:'Grosse amitié, photo',pick:'any',e:5,fx:(to,f)=>joinFx([`Duo avec ${WHO[to].name} 🎤`,relChange(to,6),fPhoto(f,[to],`🎶 Duo avec ${WHO[to].handle} à la fête de la musique`,5)])},
  {l:"Danser devant la scène avec quelqu'un",sm:'Amitié, et plus si affinités',pick:'any',e:4,fx:to=>joinFx([`Tu danses avec ${WHO[to].name} 💃`,relChange(to,3,likesBack(to,30)?3:0)])},
  {l:'Filmer la scène ouverte',sm:'Abonnés',e:1,fx:()=>{const g=4+Math.floor(Math.random()*4);G.ig.fans+=g;return `Ta vidéo fait le tour du lycée · +${g} abonnés`}}]},
 {id:'soufriere',date:'2027-03-11',n:'Projet SVT : sortie à la Soufrière',ic:'🌋',scene:'plage',post:"[Officiel] 🌋 Sortie SVT à la Soufrière pour les terminales ! Chaussures de marche et k-way obligatoires 🌧️",info:"Toute la classe monte sur le volcan avec Mme la prof de SVT pour étudier les roches et les fumerolles. Le compte rendu sera noté.",acts:[
  {l:"Faire le compte rendu en binôme",sm:'Note de SVT et amitié',pick:'any',e:6,fx:to=>{const v=clamp(Math.round((G.know.svt/100*14+4+FICHES[to].stud*4)*2)/2,0,20);G.grades.push({sub:'svt',v,day:G.day,sd:schoolDay(G.day)});G.know.svt=clamp(G.know.svt+5,0,100);return joinFx([`Compte rendu avec ${WHO[to].name} : ${fmtG(v)}/20`,relChange(to,v>=12?6:3)])}},
  {l:'Grimper jusqu\'au sommet',sm:'SVT +6 %, fatigue',e:12,fx:()=>{G.know.svt=clamp(G.know.svt+6,0,100);return "Brouillard, vent et odeur de soufre… mais tu arrives au sommet ! · SVT +6 %"}},
  {l:'Photo de groupe sur le volcan',sm:'Abonnés',e:0,fx:f=>'Souvenir de la Soufrière 🌋 · '+fPhoto(f,best(2),'Sortie à la Soufrière avec la classe 🌋🌧️',5)}]},
 {id:'debat',date:'2027-05-12',n:'Projet philo : le grand débat',ic:'🗣️',scene:'couloir',post:"[Officiel] 🗣️ Grand débat de philo aujourd'hui : « Peut-on être libre sans les autres ? » Qui va convaincre la classe ?",info:"La classe se divise en deux camps pour débattre devant Mme Florent. Les meilleures interventions sont notées.",acts:[
  {l:'Défendre ton point de vue',sm:'Note de philo',e:5,fx:()=>{const v=clamp(Math.round((G.know.philo/100*15+4+Math.random()*2)*2)/2,0,20);G.grades.push({sub:'philo',v,day:G.day,sd:schoolDay(G.day)});G.know.philo=clamp(G.know.philo+4,0,100);return `Ton intervention convainc une partie de la classe : ${fmtG(v)}/20`}},
  {l:"Soutenir quelqu'un de ton camp",sm:'Amitié',pick:'any',e:2,fx:to=>joinFx([`Tu appuies l'argument de ${WHO[to].name}, la classe applaudit`,relChange(to,6)])},
  {l:"Contredire quelqu'un devant tout le monde",sm:'Rivalité',pick:'any',e:2,fx:to=>{const r=G.rel[to].ami<20;if(r)mark(to,'rivalite');return joinFx([`Tu démontes l'argument de ${WHO[to].name}… qui n'apprécie pas du tout`,relChange(to,-7)])}}]},
 {id:'invitbal',date:'2027-06-14',n:'Invitations pour le bal',ic:'💌',scene:'couloir',post:"[Anonyme] 💌 Les invitations pour le bal ont commencé… qui va demander qui ? 👀 On veut des noms !",info:"Deux semaines avant le bal, tout le lycée cherche sa cavalière ou son cavalier. Les tenues se préparent.",acts:[
  {l:"Inviter quelqu'un au bal",sm:'Amour ou amitié',pick:'any',e:0,fx:to=>{if(likesBack(to,30)){G.balWith=to;return joinFx([`${WHO[to].name} dit oui avec un grand sourire 💃`,relChange(to,3,6),jealous(to)])}if(G.rel[to].ami>=45){G.balWith=to;return joinFx([S(to,`${WHO[to].name} accepte, en ami·e`),relChange(to,4)])}return joinFx([`${WHO[to].name} y va déjà avec quelqu'un d'autre…`,relChange(to,-1)])}},
  {l:'Choisir ta tenue de bal',sm:gemTxt('−5 gemmes · ')+'plus de chances d\'être élu·e',e:0,fx:()=>{if(GEMS_ON&&G.gems<5)return "Pas assez de gemmes pour la tenue de tes rêves";if(GEMS_ON)G.gems-=5;G.balOutfit=1;return "Tu trouves LA tenue parfaite ✨"+gemTxt(' · −5 gemmes')}},
  {l:"Organiser l'after avec tes amis",sm:'Amitié avec tes proches',e:3,fx:()=>joinFx(["After prévu chez toi après le bal 🎉",...best(3).map(i=>relChange(i,3))])}]},
 {id:'bal',date:'2027-06-30',n:'Bal des terminales',ic:'🥂',scene:'soiree',post:"[Officiel] 🥂 Bal des terminales ce soir ! Dernière soirée de l'année, sortez vos plus belles tenues ✨",info:"Dernier jour de l'année : le grand bal des terminales.",acts:[
  {l:"Arriver au bal avec la personne invitée",sm:'Amour',e:0,fx:()=>{const to=G.balWith;if(!to)return "Tu arrives avec tes amis : finalement c'est encore mieux 😄";return joinFx([`Tu fais ton entrée au bras de ${WHO[to].name} ✨ Tout le monde vous regarde`,relChange(to,3,likesBack(to,30)?5:0)])}},
  {l:"Inviter quelqu'un au bal",sm:'Amitié ou amour',pick:'any',e:0,fx:to=>likesBack(to,30)?joinFx([`${WHO[to].name} accepte d'être ton ou ta cavalière 💃`,relChange(to,2,6),jealous(to)]):G.rel[to].ami>=40?joinFx([S(to,`${WHO[to].name} vient avec toi, en ami·e`),relChange(to,4)]):joinFx([`${WHO[to].name} y va déjà avec quelqu'un`,relChange(to,-1)])},
  {l:"Danser un slow avec quelqu'un",sm:'Amour',pick:'love',e:3,fx:to=>likesBack(to,35)?joinFx([`Un slow avec ${WHO[to].name}… le temps s'arrête 💞`,relChange(to,2,8),jealous(to)]):joinFx([`Un slow un peu gênant avec ${WHO[to].name} 😅`,relChange(to,1)])},
  {l:'Photo de groupe avec tes amis',sm:'Beaucoup d\'abonnés',e:0,fx:f=>'Photo souvenir de la terminale 📸 · '+fPhoto(f,best(3),'🥂 Bal des terminales avec mes amis ✨',8+Math.floor(Math.random()*6))},
  {l:'Tenter d\'être élu·e roi ou reine du bal',sm:'Dépend de ta popularité',e:0,fx:()=>{const ch=Math.min(.85,.1+G.ig.fans/600+igFriends().length*.06+(G.balOutfit?.15:0)+(Object.values(G.gstate||{}).filter(x=>x==='adopte').length*.05));if(Math.random()<ch){G.gems+=10;fPotins(`${myHandle()} est ${me().sexe==='f'?'la reine':me().sexe==='m'?'le roi':'élu·e souverain·e'} du bal 👑`);return P('Tu es élu·e ')+(me().sexe==='f'?'reine':me().sexe==='m'?'roi':'souverain·e')+' du bal 👑'+gemTxt(' · +10 gemmes')}return "Pas élu·e cette fois, mais quelle soirée".replace('élu·e',P('élu·e'))}}]}];
/* jour de la fête = la vraie date si c'est un jour de cours, sinon le dernier jour de cours avant */
const feteDayOf=k=>{let d=CAL.findIndex(c=>c&&c.k===k);if(d<1)d=CAL_END;while(d>1&&!CAL[d].sd)d--;return d};
const FETE_ON={};FETES.forEach(f=>{f.day=f.free?CAL.findIndex(c=>c&&c.k===f.date):feteDayOf(f.date);(FETE_ON[f.day]=FETE_ON[f.day]||[]).push(f)});
const fetesToday=()=>FETE_ON[G.day]||[];
const fst=id=>(G.fetes=G.fetes||{})[id]||(G.fetes[id]={n:0,used:[],done:false});
const fetesOpen=()=>fetesToday().filter(f=>!fst(f.id).done);
/* prochaines fêtes et vacances, pour la carte « À venir » de la journée */
function upcoming(n){const out=[];for(let d=G.day+1;d<=CAL_END&&out.length<n;d++){(FETE_ON[d]||[]).forEach(f=>out.push([d,f.ic+' '+f.n]));const v=VACS.find(x=>x[0]===CAL[d].k);if(v)out.push([d,'🌴 '+v[2]])}return out.slice(0,n)}
const actOk=a=>(GEMS_ON||!a.gems)&&(a.pick!=='love'||(me().orient!=='ace'&&NPCS.some(n=>iLike(n.id))));
function feteSheet(f,msg){
 const st=fst(f.id),left=FETE_MAX-st.n,shift=!f.free&&f.date!==CAL[G.day].k,acts=f.acts.map((a,i)=>[a,i]).filter(([a,i])=>actOk(a)&&!st.used.includes(i));
 return sheetHead(`${f.ic} ${f.n}`,`${f.free?'Aujourd\'hui':'Aujourd\'hui au lycée'} · ${fmtDay(G.day,true)}`)
  +(shift?`<p class="muted" style="margin:0">Le vrai jour est le ${dateOf(CAL.findIndex(c=>c&&c.k===f.date)>0?CAL.findIndex(c=>c&&c.k===f.date):f.day).toLocaleDateString('fr-FR',{weekday:'long',day:'numeric',month:'long'})} : il n'y a pas cours ce jour-là, la fête a donc lieu aujourd'hui.</p>`:'')
  +`<p class="story-text">${esc(f.info)}</p>`+(msg?`<div class="card felt"><p style="margin:0">${esc(msg)}</p></div>`:'')
  +(left>0&&acts.length&&!st.done?`<span class="eyebrow">Que fais-tu ? · ${left} action${left>1?'s':''} restante${left>1?'s':''}</span><div class="choices">${acts.map(([a,i])=>`<button class="choice" type="button" data-fact="${f.id}:${i}">${esc(P(a.l))}<small class="t-pos">${a.pick?'Choisis ensuite '+(a.pick==='list'?'une option':a.pick==='club'?'un club':'un personnage')+' · ':''}${esc(a.sm)}${a.e?' · −'+a.e+' énergie':''}</small></button>`).join('')}</div>`:`<p class="muted">${st.n?'Tu as bien profité de la fête !':'La fête est finie.'}</p>`)
  +`<div class="row"><button class="gbtn ${left>0&&!st.done?'ghost':''}" type="button" data-fend="${f.id}">${left>0&&!st.done?'Terminer la fête':'Fermer'}</button></div>`}
function fetePick(f,i){const a=f.acts[i];
 const opts=a.pick==='list'?a.list.map((x,j)=>[j,x,'']):(a.pick==='love'?NPCS.filter(n=>iLike(n.id)):NPCS).map(n=>[n.id,a.pick==='club'?`${CLUBS[CLUB_OLD[n.id]].n} (${n.name})`:n.name,`amitié ${G.rel[n.id].ami}${npcLikesMe(n.id)&&a.pick==='love'?' · amour '+G.rel[n.id].amour:''}${G.partner===n.id?' · en couple 💞':''}`]);
 openSheet(sheetHead(`${f.ic} ${esc(P(a.l))}`,a.pick==='list'?'Choisis une option':a.pick==='club'?'Quel club ?':'Avec qui ?')+`<div class="choices">${opts.map(([v,l,sm])=>`<button class="choice" type="button" data-fact="${f.id}:${i}" data-to="${v}">${esc(l)}${sm?`<small>${esc(sm)}</small>`:''}</button>`).join('')}</div><div class="row"><button class="gbtn ghost" type="button" data-fback="${f.id}">Retour</button></div>`)}
function feteAct(fid,i,to){
 const f=FETES.find(x=>x.id===fid),a=f&&f.acts[i],st=f&&fst(fid);if(!f||f.day!==G.day||st.done||st.used.includes(i)){closeSheet();return}
 if(a.pick&&to==null){fetePick(f,i);return}
 if(G.energy<a.e){toast(`Pas assez d'énergie : il faut ${a.e}`);return}
 G.energy=clamp(G.energy-a.e,0,100);st.n++;st.used.push(i);if(st.n>=FETE_MAX)st.done=true;
 const msg=a.pick?a.fx(a.pick==='list'?+to:to,f):a.fx(f);
 note(`${f.ic} ${f.n} : ${msg}`);checkObjectives();saveG();drawHUD();openSheet(feteSheet(f,msg));
}
function feteEnd(fid){fst(fid).done=true;saveG();const next=fetesOpen()[0];if(next)openSheet(feteSheet(next));else{closeSheet();if(!$('game').hidden)drawGame()}}
/* le matin d'une fête : post du compte anonyme, notification, puis la fenêtre des actions */
const FETE_COM=["trop hâte 🔥","on y va ensemble ?","le meilleur jour de l'année","j'ai déjà ma tenue 😎","qui vient avec moi ?"];
function feteDay(){
 fetesToday().forEach(f=>{
  const p=mkPost({by:'potins',text:f.post,min:7*60,c:20+Math.floor(Math.random()*30),r:200+Math.floor(Math.random()*400),l:5000+Math.floor(Math.random()*9000)});
  if(f.id!=='abolition')rndNpc(2).forEach(id=>p.comments.push(mkC(id,genderize(pickR(FETE_COM),id))));
  G.posts.unshift(p);note(`${f.ic} ${f.n} aujourd'hui au lycée`);if(!G.asleep&&!$('game').hidden)toast(`${f.ic} ${f.n} aujourd'hui !`)});
 const f=fetesOpen()[0];if(f)popSheet(feteSheet(f));
}
/* première rencontre : ton personnage est nouveau, les camarades posent des questions pour faire connaissance */
const nouv=()=>me().sexe==='f'?'la nouvelle':me().sexe==='m'?'le nouveau':'le ou la nouvelle';
const INTRO_Q={ines:["Coucou ! C'est toi {nouv} ? ✨ Tu viens d'où ?","Hey, t'es {nouv} non ? Tu t'appelles comment ? 🥺"],kylian:["wsh c'est toi {nouv} ? t'étais dans quel lycée avant ?","frr t'es {nouv} ? tu viens d'où ?"],
 maelle:["Coucou, c'est toi {nouv} ? 💅 Tu viens d'où genre ?","Ah c'est toi {nouv} ! Tu connais déjà du monde ici ?"],noah:["Salut, t'es {nouv} c'est ça ? Tu viens d'où ?","Salut ! Bienvenue au lycée. T'habites où ?"],
 jade:["tu es {nouv}. tu lis quoi, en ce moment ?","tu es {nouv}, je crois. pourquoi ce lycée ?"],meisha:["Coucou, t'es {nouv} ? 😍 J'adore ton style, tu t'habilles où ?","Ah, {nouv} ! T'as déjà rencontré Kenza ? C'est ma jumelle 💅"],jessica:["Bonjour, tu es {nouv} ? 😊 Si tu as besoin d'aide pour rattraper, je donne des cours le lundi et le mercredi","Tu es {nouv} ? Bienvenue ! Tu étais dans quel lycée ?"],noemie:["Wesh, c'est toi {nouv} ? Tu joues au foot ? ⚽","T'es {nouv} ? Bienvenue ! Tu viens d'où ?"],eva:["Coucou, tu es {nouv} ? 🌸 Bienvenue ! Tu viens d'où ?","Oh c'est toi {nouv} ! Tu dessines, toi aussi ? 🎨"],kenza:["Coucou, c'est toi {nouv} ? 😘 Tu viens d'où ?","Ah, {nouv} ! Bienvenue chez les terminales ✨ T'as déjà repéré quelqu'un ? 👀"],anais:["Hey ! C'est toi {nouv} ? 😄 Tu fais du sport ?","Coucou {nouv} ! Tu viens d'où ? 🔥"],sacha:["Yo, t'es {nouv} ? Tu écoutes quoi comme musique ? 🎧","T'es {nouv} ? Bienvenue gros. Tu viens d'où ?"]};
const FOLLOW_Q={ines:["Et t'habites où en Guadeloupe ?","Tu fais de la danse ? 💃","T'as des frères et sœurs ?","Pourquoi t'as changé de lycée ? 🥺"],kylian:["tu joues au foot ?","t'es de quelle commune ?","t'as pris quoi comme spé ?"],
 maelle:["Tu sors le week-end ?","T'as Insta ? Je t'ajoute 💅","Genre t'avais un copain ou une copine dans ton ancien lycée ?"],noah:["Tu fais du sport ?","Tu lis des mangas ?","T'habites loin du lycée ?"],
 jade:["tu viens d'où ?","tu préfères la mer ou les étoiles ?","tu écris, toi aussi ?"],meisha:["Tu fais du shopping où ?","Tu viens à Jarry samedi ?","T'as un copain ou une copine ? 👀"],jessica:["Tu as pris quelles spécialités ?","Tu veux venir aux cours particuliers ? 📚","Tu habites loin ?"],noemie:["Tu fais quel sport ?","T'es de quelle commune ?","Tu viens voir notre match samedi ?"],eva:["Tu aimes l'art ? 🎨","Tu habites où ?","Tu veux venir à l'atelier d'arts plastiques ? 🌸"],kenza:["T'as Insta ? Je te suis 😘","Tu sors le week-end ?","T'as un copain ou une copine ? 👀"],anais:["Tu cours le matin ? 😂","Tu viendras voir nos matchs ?","T'es de quelle commune ?"],sacha:["T'es d'où ?","Tu joues d'un instrument ?","Zouk ou dancehall ?"]};
const introLine=id=>genderize(pickR(INTRO_Q[id]).replace('{nouv}',nouv()),id);

/* ---------- potins : un·e élève fait quelque chose qui sort de l'ordinaire, selon sa personnalité ---------- */
const INCIDENTS={
 meisha:[{t:"Meisha a dépensé tout son argent de poche du mois en une seule après-midi à Jarry… le 3 du mois 🛍️😭",self:"c'était des soldes, c'est un investissement 💅"},
  {t:"La rubrique mode de Meisha a classé les tenues des profs. M. Lancelot est arrivé dernier et ne s'en remet pas 😂",self:"j'ai été honnête, c'est tout 😇"},
  {t:"Meisha et Kenza sont venues au lycée avec exactement la même tenue. Par hasard, jurent-elles 👯‍♀️",self:"on est jumelles, c'est normal 😂"}],
 jessica:[{t:"Jessica a corrigé une erreur au tableau… du prof de maths. M. Lancelot a dû reconnaître qu'elle avait raison 😳📐",self:"je l'ai dit gentiment 😅"},
  {t:"Jessica a eu 20/20 au bac blanc de physique. Rumeur : elle a rendu sa copie 40 minutes en avance 🤯",self:"j'ai juste beaucoup révisé 😊"}],
 noemie:[{t:"Noémie a mis un petit pont à Kylian devant toute la cour. Il ne s'en remet toujours pas 😭⚽",self:"fallait pas me chauffer 😂"},
  {t:"Noémie a contesté une décision de l'arbitre pendant 10 minutes. Carton jaune… et standing ovation des supporters 😤",self:"il y avait main, tout le monde l'a vu !!"}],
 eva:[{t:"Eva a peint une fresque géante sur le mur du foyer… sans autorisation. La proviseure a fini par dire qu'elle la gardait 🎨😳",self:"je suis désolée… mais contente qu'elle reste 🥹"},
  {t:"Kylian a écrit « EVA ❤️ » avec des coquillages sur la plage et l'a posté. Tout le lycée en parle 🐚💕",self:"il est trop bête… je l'aime 🥹"}],
 kenza:[{t:"Kenza a reçu trois déclarations d'amour dans la même journée… dont une chantée devant la cantine 🎤😭",self:"je suis pas responsable de ce que ressentent les gens 😘"},
  {t:"Kenza est arrivée au cours de philo avec 20 minutes de retard… et des lunettes de soleil. Mme Florent n'a rien dit 😶",self:"le soleil tapait fort ce matin ✨"},
  {t:"Un garçon de première a offert un bouquet de roses à Kenza devant tout le lycée. Elle a pris une photo… et c'est tout 💐",self:"c'était mignon mais non 😅"}],
 anais:[{t:"Anaïs a été surprise en train d'escalader le portail du lycée à 6 h du matin… pour aller s'entraîner au gymnase 🤾‍♀️😭",self:"j'avais un match samedi, fallait bien s'entraîner 😂💪"},
  {t:"Anaïs a tagué « ALLEZ LES FILLES 🔥 » sur le mur du gymnase avant le match. Convoquée chez la proviseure 😬",self:"j'assume 😅 et on a gagné le match !"},
  {t:"Anaïs a fait tout le cours d'EPS en courant à reculons. M. Bourgeois ne sait plus quoi faire 😂",self:"échauffement spécial 😂"}],
 kylian:[{t:"Kylian a fait un petit pont au CPE dans la cour. Ballon confisqué pour la 3e fois ce mois-ci ⚽😭",self:"il était trop lent frr 😂"},
  {t:"Kylian a séché la philo pour regarder un match sur son téléphone dans les toilettes. Pris par la proviseure 📵",self:"c'était la finale wsh"}],
 maelle:[{t:"Maëlle a organisé un flash mob en pleine récré. Même la proviseure a dansé (un peu) 💃",self:"Littéralement le meilleur moment de l'année 💅"},
  {t:"Maëlle a lancé une pétition contre le poisson pané de la cantine : 214 signatures 🐟",self:"Le peuple a parlé 🙄"}],
 jade:[{t:"Un poème anonyme est apparu sur la porte du CDI ce matin. Tout le monde pense que c'est Jade 📜",self:"je ne confirme rien."},
  {t:"Jade a corrigé une faute de la prof de philo devant toute la classe. Silence total 😶",self:"une faute reste une faute."}],
 noah:[{t:"Noah s'est endormi en physique et a ronflé. M. Jean-Baptiste l'a laissé dormir 😂",self:"j'avais entraînement à 6 h ptdr"},
  {t:"Noah a fait goûter son colombo à toute la salle des profs. Ils veulent tous la recette 🍛",self:"secret de famille frère"}],
 ines:[{t:"Inès a fait une choré dancehall sur une table de la cantine. Applaudissements… puis heure de colle 💃😬",self:"ça valait le coup 🥺✨"},
  {t:"Inès a pleuré devant toute la classe pendant le film en anglais. Tout le monde a fait semblant de rien voir 🥺",self:"c'était trop triste ok 😭"}],
 sacha:[{t:"Sacha a branché une enceinte sous le préau : concert surprise de gwo ka. Coupé par le CPE au 3e morceau 🥁",self:"la vibe était là, c'est ce qui compte ✌️"},
  {t:"Sacha est arrivé en retard pour la 10e fois. Il a joué de la guitare devant la vie scolaire pour s'excuser 🎸",self:"ils ont souri, je compte ça comme un oui"},
  {t:"Des paroles de chanson ont été taguées sur le mur du préau. Sacha a été convoqué chez la proviseure 😬",self:"c'était de la poésie urbaine gros"}]};
const INC_COM=["😭😭😭","c'est tellement {n} ça","je savais que ça arriverait 😂","légende","la proviseure va craquer un jour","quelqu'un a une vidéo ??"];
function incidentDay(){
 if(!schoolDay(G.day)||fetesToday().length||Math.random()>.15)return;
 G.incUsed=G.incUsed||[];const all=Object.entries(INCIDENTS).flatMap(([id,L])=>L.map((x,i)=>({id,i,...x}))),free=all.filter(x=>!G.incUsed.includes(x.id+x.i));
 const inc=pickR(free.length?free:all);G.incUsed.push(inc.id+inc.i);if(!free.length)G.incUsed=[inc.id+inc.i];
 const p=mkPost({by:'potins',text:'[Anonyme] : '+inc.t,min:6*60+Math.floor(Math.random()*80),c:25+Math.floor(Math.random()*40),r:300+Math.floor(Math.random()*600),l:8000+Math.floor(Math.random()*14000)});
 const self=mkC(inc.id,genderize(inc.self,inc.id));p.comments.push(self);
 NPCS.filter(n=>n.id!==inc.id).sort(()=>Math.random()-.5).slice(0,2).forEach(n=>p.comments.push(mkC(n.id,genderize(pickR(INC_COM).replace('{n}',WHO[inc.id].name),n.id),Math.random()<.5?{re:self.id,to:inc.id}:{})));
 G.posts.unshift(p);note(`👀 Potins du lycée : ${inc.t}`);G.incToast=inc.t;
}
/* ---------- abonnés inconnus : plus tu es actif·ve sur Insta, plus des élèves du lycée s'abonnent ---------- */
function fanDay(){
 const a=G.ig.act||0;G.ig.act=0;
 /* plus le compte est gros, plus il est dur de gagner des abonnés (le lycée n'est pas infini) */
 const gain=a>0?Math.round((a*1.5+Math.random()*3)*Math.max(.15,1-G.ig.fans/1200)):(Math.random()<.35?-1:0);if(!gain)return;
 G.ig.fans=Math.max(0,G.ig.fans+gain);
 if(gain<0){note(P('Une personne s\'est désabonnée : tu as été peu actif·ve sur Insta hier'));return}
 const L=[...PRENOMS.f,...PRENOMS.m],hs=Array.from({length:Math.min(gain,3)},()=>slug(pickR(L))+pickR(['.971','_gwada','.off','971','_lyc','']));
 G.ig.newFans=[...hs,...(G.ig.newFans||[])].slice(0,12);
 note(`📈 +${gain} abonné${gain>1?'s':''} : ${hs.join(', ')}${gain>3?` et ${gain-3} autre${gain>4?'s':''}`:''}`);G.fanToast=gain;
}
function bond(id,d){if(isFam(id)){famChange(id,d);return d?`${nameOf(id)} : complicité ${d>0?'+':''}${d}`:''}return relChange(id,d)}
function checkPlans(){
 G.plans.forEach(p=>{
  if(p.status!=='pending'&&p.status!=='accepted')return;
  if(!(isNpc(p.by)||(isFam(p.by)&&famById(p.by)))){p.status='missed';return}
  const due=p.day<G.day||(p.day===G.day&&G.min>=p.hour*60);if(!due)return;
  const late=(G.day*1440+G.min)-(p.day*1440+p.hour*60);
  if(p.status==='pending'){p.status='missed';const ch=bond(p.by,-2);note(`Tu n'as pas répondu à la proposition de ${nameOf(p.by)}${ch?' ('+ch+')':''}`)}
  else if(late>180){p.status='missed';const ch=bond(p.by,p.fam?-6:-5);note(`Tu as manqué la sortie avec ${p.fam?'ta famille':nameOf(p.by)}${ch?' ('+ch+')':''}`);if(p.fam||G.rel[p.by].ami>=60)pushMsg(p.by,'them',p.fam?pickR(["On est partis sans toi… dommage.","On t'a {p:attendu·e} pour la sortie !"]):pickR(["Je t'ai {p:attendu·e}…","Sérieux, t'étais où ?","Merci pour le lapin 🙄"]))}
  else if($('sheet').hidden&&!$('game').hidden&&!G.asleep){p.status='done';startOuting(p)}
 });
}
const FAM_PLACES=['sainteanne','carbet','marche'],FAM_SCENE={sainteanne:'plage',carbet:'cascade',marche:'marche',resto:'cantine',cinema:'soiree'};
const famPending=()=>G.plans.some(p=>p.fam&&(p.status==='pending'||p.status==='accepted'));
function famPlan(by){
 const wd=weekday(),m=G.min;let day,hour,place;
 if(wd<5&&Math.random()<.4&&m<18*60){day=G.day;hour=19;place=pickR(['resto','cinema'])}
 else{hour=10;place=pickR(FAM_PLACES);day=wd<5?G.day+(5-wd):m<9*60?G.day:G.day+(wd===5?1:6)}
 if(day===G.day&&m>=hour*60-30)day++;
 const pl={id:'pl'+Date.now()+Math.floor(Math.random()*999),by,day,hour,place,status:'pending',fam:true};G.plans.push(pl);return pl;
}
const famProposalText=pl=>`${pickR(["Et si on faisait une sortie en famille ?","Petite sortie en famille, ça te dit ?","On a prévu un truc en famille !"])} On va ${PLACE_OUT[pl.place]} ${planWhen(pl)}. Tu viens ? 🥰`;
function startFamOuting(p){
 const fam=G.family;
 openSheet(`<h2>Sortie en famille ${PLACE_OUT[p.place]}</h2><p class="muted" style="margin:0">Proposée par ${esc(nameOf(p.by))} · ${fmtT(G.min)}</p>
 <div class="photo">${photoSVG({scene:FAM_SCENE[p.place]||'plage',people:['me',...fam.slice(0,3).map(f=>f.id)],author:'me'})}</div>
 <div class="choices">
 <button class="choice" type="button" data-out="f_fun" data-pl="${p.id}">Profiter du moment ensemble<small class="t-pos">Complicité de toute la famille</small></button>
 <button class="choice" type="button" data-out="f_talk" data-pl="${p.id}">Discuter vraiment avec ${esc(nameOf(p.by))}<small class="t-pos">Grosse complicité</small></button>
 <button class="choice" type="button" data-out="f_photo" data-pl="${p.id}">Prendre une photo de famille<small class="t-pos">Post sur le fil</small></button>
 <button class="choice" type="button" data-out="f_phone" data-pl="${p.id}">Rester sur ton téléphone<small class="t-neg">Ta famille sera déçue</small></button></div>`);
}
function famOuting(kind,pid){
 const p=G.plans.find(x=>x.id===pid);if(!p)return;let msg;
 if(kind==='f_fun'){G.family.forEach(f=>famChange(f.id,6));G.energy=clamp(G.energy-6,0,100);msg='Belle sortie en famille · complicité +6 pour tous'}
 else if(kind==='f_talk'){famChange(p.by,10);G.family.forEach(f=>{if(f.id!==p.by)famChange(f.id,3)});G.energy=clamp(G.energy-5,0,100);msg=`Vraie discussion avec ${nameOf(p.by)} · complicité +10`}
 else if(kind==='f_photo'){G.family.forEach(f=>famChange(f.id,4));G.posts.unshift(mkPost({by:'me',text:`Sortie en famille ${PLACE_OUT[p.place]} ❤️`,photo:{scene:FAM_SCENE[p.place]||'plage',people:['me',...G.family.slice(0,3).map(f=>f.id)],author:'me'},l:Math.floor(Math.random()*60)+20,mine:true,comments:[npcComment(pickR(NPCS).id)]}));G.st.posts++;msg='Photo de famille publiée · complicité +4'}
 else{G.family.forEach(f=>famChange(f.id,-5));G.energy=clamp(G.energy+4,0,100);msg=P('Tu es resté·e sur ton téléphone · complicité −5')}
 G.st.famOut=(G.st.famOut||0)+1;note(msg);closeSheet();toast(msg);checkObjectives();saveG();drawGame();
}
function openFamPerson(fid){
 const f=famById(fid),k=G.day+'fam'+fid;if(!f)return;
 openSheet(`<div class="who"><div class="av">${avatarOf(fid)}</div><div style="flex:1;min-width:0"><h2>${esc(f.name)} ${esc(me().nom||'')}</h2><p class="muted" style="margin:2px 0 0">${f.role} · ${S(f.id,f.trait)} · complicité ${G.famRel[fid]}</p></div><button class="gbtn ghost" type="button" data-close aria-label="Fermer">✕</button></div>
 <div class="acts"><button class="act" type="button" data-talk="${fid}"><span class="ico">🗣️</span><span>Parler en vrai</span></button><button class="act" type="button" data-chat="${fid}"><span class="ico">💬</span><span>Envoyer un message</span></button>
 <button class="act" type="button" data-fa="aider" data-id="${fid}" ${G.done[k+'aider']?'disabled':''}><span class="ico">🧹</span><span>Aider à la maison</span><small class="r-ok">−4 énergie</small></button>
 <button class="act" type="button" data-fa="sortie" data-id="${fid}" ${G.done[k+'sortie']||famPending()?'disabled':''}><span class="ico">🌴</span><span>Proposer une sortie en famille</span></button></div>
 <p class="story-text" id="paOut"></p>`);
}
function famAct(fid,a){
 const k=G.day+'fam'+fid,f=famById(fid);G.done[k+a]=1;let line;
 if(a==='aider'){G.energy=clamp(G.energy-4,0,100);famChange(fid,5);G.st.famTalks++;line=pickR(["Merci mon cœur, ça m'aide beaucoup ❤️","Oh, quelle bonne surprise !","Tu vois quand tu veux 😄"])}
 else if(Math.random()<G.famRel[fid]/100+.25){const pl=famPlan(fid);pl.status='accepted';famChange(fid,3);line=`Bonne idée ! On va ${PLACE_OUT[pl.place]} ${planWhen(pl)}.`;note(`Sortie en famille prévue ${PLACE_OUT[pl.place]} ${planWhen(pl)}`)}
 else line=pickR(["Pas cette semaine, on a trop de choses à faire.","Une autre fois, d'accord ?","Hmm… on verra ça plus tard."]);
 $('paOut').innerHTML=`<b>${esc(f.name)} :</b> « ${esc(line)} »`;document.querySelectorAll(`[data-fa="${a}"]`).forEach(b=>b.disabled=true);
 checkObjectives();saveG();drawHUD();
}
function sleepNow(){
 let n=G.min>=420?(1440-G.min)+420:420-G.min;const hours=n/60;
 closeSheet();G.asleep=true;advance(n);G.asleep=false;
 G.energy=clamp(G.energy+Math.round(hours*11),0,100);
 note(`Tu as dormi ${Math.round(hours)} h`);saveG();drawGame();toast(`☀️ ${fmtDay(G.day,true)} · énergie ${G.energy}`);flushPend();
 /* nouvelles de la nuit : potins et nouveaux abonnés */
 const news=[G.incToast&&'👀 Potins : '+G.incToast.slice(0,70)+(G.incToast.length>70?'…':''),G.fanToast&&`📈 +${G.fanToast} abonné${G.fanToast>1?'s':''} sur Insta`].filter(Boolean);G.incToast=G.fanToast=null;news.forEach((t,i)=>setTimeout(()=>toast(t),2400*(i+1)));
}

/* ---------- musique de fond : boucle originale générée en direct (Web Audio) ---------- */
const MUS={ctx:null,master:null,delay:null,noise:null,timer:null,step:0,next:0,on:false};
const MUSKEY='lycee-musique';
const musPref=()=>{try{return localStorage.getItem(MUSKEY)!=='off'}catch(e){return true}};
const NOTEF=n=>440*Math.pow(2,(n-69)/12);
const M_CH=[[48,52,55,59],[45,48,52,55],[41,45,48,52],[43,47,50,52]],M_BASS=[36,33,29,31];
const M_MEL=[[67,0,72,0,76,0,74,72, 69,0,0,72,0,76,0,0, 77,0,76,0,72,0,69,0, 71,0,74,0,72,0,0,0],
             [76,0,0,0,74,0,72,0, 72,0,69,0,0,0,67,0, 69,0,72,0,77,0,76,0, 74,0,0,71,0,72,0,0]];
function musInit(){
 const AC=window.AudioContext||window.webkitAudioContext;if(!AC)return false;
 if(MUS.ctx)return true;
 const c=new AC();MUS.ctx=c;MUS.master=c.createGain();MUS.master.gain.value=.32;MUS.master.connect(c.destination);
 MUS.delay=c.createDelay(1);MUS.delay.delayTime.value=.36;const fb=c.createGain();fb.gain.value=.28;const wet=c.createGain();wet.gain.value=.35;
 MUS.delay.connect(fb);fb.connect(MUS.delay);MUS.delay.connect(wet);wet.connect(MUS.master);
 const b=c.createBuffer(1,c.sampleRate*.5,c.sampleRate),d=b.getChannelData(0);for(let i=0;i<d.length;i++)d[i]=Math.random()*2-1;MUS.noise=b;
 return true;
}
function musTone(f,t,dur,type,vol,att,rel,toDelay,cut){
 const c=MUS.ctx,o=c.createOscillator(),g=c.createGain();o.type=type;o.frequency.value=f;
 let out=g;if(cut){const lp=c.createBiquadFilter();lp.type='lowpass';lp.frequency.value=cut;g.connect(lp);out=lp}
 g.gain.setValueAtTime(0,t);g.gain.linearRampToValueAtTime(vol,t+att);g.gain.setValueAtTime(vol,t+Math.max(att,dur-rel));g.gain.linearRampToValueAtTime(0,t+dur);
 o.connect(g);out.connect(MUS.master);if(toDelay)out.connect(MUS.delay);o.start(t);o.stop(t+dur+.05);
}
function musNoise(t,vol,type,freq,dur){const c=MUS.ctx,s=c.createBufferSource(),f=c.createBiquadFilter(),g=c.createGain();s.buffer=MUS.noise;f.type=type;f.frequency.value=freq;
 g.gain.setValueAtTime(vol,t);g.gain.exponentialRampToValueAtTime(.001,t+dur);s.connect(f);f.connect(g);g.connect(MUS.master);s.start(t);s.stop(t+dur+.02)}
function musKick(t){const c=MUS.ctx,o=c.createOscillator(),g=c.createGain();o.frequency.setValueAtTime(110,t);o.frequency.exponentialRampToValueAtTime(42,t+.14);
 g.gain.setValueAtTime(.32,t);g.gain.exponentialRampToValueAtTime(.001,t+.3);o.connect(g);g.connect(MUS.master);o.start(t);o.stop(t+.32)}
function musStep(st,t){
 const e=60/84/2,i=st%32,bar=Math.floor(i/8),pos=i%8,ph=G?phase():{type:'matin'},night=G&&(G.min<420||G.min>=1260),calm=ph.type==='eval'||ph.type==='bac';
 if(pos===0)M_CH[bar].forEach((n,k)=>{musTone(NOTEF(n),t,e*8+.4,'triangle',.035,.5,.7,false,950);musTone(NOTEF(n)*1.004,t,e*8+.4,'sine',.03,.6,.7,false)});
 if(pos===0||pos===4||(pos===7&&bar%2))musTone(NOTEF(M_BASS[bar]+(pos===7?7:0)),t,e*(pos===7?1:3),'sine',.16,.02,.2,false);
 if(!night&&!calm){if(pos===0||pos===4)musKick(t);if(pos===2||pos===6)musNoise(t,.05,'bandpass',1800,.12);if(pos%2)musNoise(t,.018,'highpass',7000,.05)}
 const m=M_MEL[Math.floor(st/32)%2][i];if(m&&!calm)musTone(NOTEF(m),t,e*1.8,'sine',night?.045:.07,.02,.3,true);
}
function musTick(){const c=MUS.ctx;while(MUS.next<c.currentTime+.15){musStep(MUS.step,MUS.next);MUS.next+=60/84/2;MUS.step=(MUS.step+1)%64}}
function musStart(){if(!musInit())return;const c=MUS.ctx;if(c.state==='suspended')c.resume();if(MUS.on)return;MUS.on=true;MUS.next=c.currentTime+.1;MUS.step=0;MUS.master.gain.cancelScheduledValues(c.currentTime);MUS.master.gain.setValueAtTime(.001,c.currentTime);MUS.master.gain.linearRampToValueAtTime(.32,c.currentTime+1.5);MUS.timer=setInterval(musTick,25);drawMusicBtn()}
function musStop(){if(!MUS.on)return;MUS.on=false;clearInterval(MUS.timer);if(MUS.ctx){const c=MUS.ctx;MUS.master.gain.cancelScheduledValues(c.currentTime);MUS.master.gain.setValueAtTime(MUS.master.gain.value,c.currentTime);MUS.master.gain.linearRampToValueAtTime(.001,c.currentTime+.4)}drawMusicBtn()}
function musAuto(){if(musPref())musStart();else drawMusicBtn()}
function drawMusicBtn(){const b=$('gMusic');if(!b)return;const on=MUS.on;b.innerHTML=`<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M9 18V5l11-2v13"/><circle cx="6" cy="18" r="3"/><circle cx="17" cy="16" r="3"/>${on?'':'<path d="M3 3l18 18"/>'}</svg>`;b.setAttribute('aria-label',on?'Couper la musique':'Activer la musique');b.setAttribute('aria-pressed',on)}
document.addEventListener('pointerdown',()=>{if(!$('game').hidden&&musPref()&&!MUS.on)musStart()});
document.addEventListener('visibilitychange',()=>{if(MUS.ctx){if(document.hidden)MUS.ctx.suspend();else if(MUS.on)MUS.ctx.resume()}});

/* ---------- HUD ---------- */
const SUN='<circle cx="16" cy="16" r="7" fill="#ffd23f"/><g stroke="#ffd23f" stroke-width="2.6" stroke-linecap="round"><path d="M16 2v4M16 26v4M2 16h4M26 16h4M6.1 6.1l2.8 2.8M23.1 23.1l2.8 2.8M6.1 25.9l2.8-2.8M23.1 8.9l2.8-2.8"/></g>';
const MOON='<path d="M21 4a12 12 0 1 0 7 17A10 10 0 0 1 21 4z" fill="#c9cdf5"/><circle cx="25" cy="8" r="1.4" fill="#fff"/><circle cx="8" cy="6" r="1" fill="#fff"/>';
function drawClock(){
 const ph=phase(),day=G.min>=360&&G.min<1140;
 $('gSky').innerHTML=day?SUN:MOON;{const sd=schoolDay(G.day);const dl=dayLbl(G.day),short=G.yearDone||G.day>CAL_END?'Vacances':dl?(dl.startsWith('Férié')?'Férié':'Vacances'):'Week-end';
  $('gDay').textContent=sd?`Jour ${sd}`:short;$('gDayBtn').setAttribute('aria-label',`${sd?`Jour ${sd} sur ${YEAR_DAYS}`:short}, ${fmtDay(G.day)}, ${fmtT(G.min)}${G.paused?', temps en pause':''}`)}
 $('gTime').textContent=fmtT(G.min);$('gPhase').textContent=ph.sub?SUBJ[ph.sub]:ph.lbl||PLABEL[ph.type];
 /* pause et vitesse sont dans le menu ⚙ : l'en-tête rappelle seulement l'état */
 $('gState').textContent=G.paused?' ⏸':'';
 {const sp=G.speed||1;$('gSpeedN').textContent='×'+sp;$('gSpeed').classList.toggle('on',sp>1);$('gSpeed').setAttribute('aria-label',`Vitesse du temps ×${sp} : touche pour accélérer`)}
 $('gEnergyN').textContent=G.energy;$('gEnergy').classList.toggle('low',G.energy<25);$('gEnergy').setAttribute('aria-label',`Énergie ${G.energy} sur 100`);
 const bar=$('phBar');if(bar)bar.style.width=(clamp((G.min-ph.start)/(ph.end-ph.start),0,1)*100)+'%';
}
function drawHUD(){
 $('gBonusDot').hidden=!G.bonus;$('gGems').textContent=G.gems;$('gGemsChip').hidden=$('gEnergyPlus').hidden=!GEMS_ON;drawClock();
 if(!$('sheet').hidden&&$('gMenuBody'))drawMenu();
}
function hudTick(){
 if(!G)return;let changed=false;
 while(G.bonus<BONUS_MAX&&Date.now()>=G.nextAt){G.bonus++;G.nextAt+=RECHARGE;changed=true}
 if(G.bonus>=BONUS_MAX)G.nextAt=Date.now()+RECHARGE;
 const ms=Math.max(0,G.nextAt-Date.now()),m=Math.floor(ms/60000),s=Math.floor(ms/1000)%60;
 const rc=$('gRecharge');if(rc)rc.textContent=G.bonus>=BONUS_MAX?'Bonus plein':`Recharge dans ${m}:${String(s).padStart(2,'0')}`;
 if(changed)drawHUD();
}
setInterval(()=>{if(!G||$('game').hidden)return;hudTick();if(!G.paused&&!document.hidden)advance(mg?1:(G.speed||1))},1000);

/* ---------- stories ---------- */
function drawStories(){
 const mine=G.stories.filter(s=>s.by==='me');
 const authors=NPCS.map(n=>n.id).filter(id=>G.stories.some(s=>s.by===id));
 authors.sort((a,b)=>(G.stories.some(s=>s.by===b&&!s.seen)?1:0)-(G.stories.some(s=>s.by===a&&!s.seen)?1:0));
 $('gStories').innerHTML=`<div class="story me ${mine.length?'':'none'}"><button class="ring" type="button" data-who="me" aria-label="Ma story">${avatarOf('me')}</button><button class="add" type="button" data-add="1" aria-label="Ajouter une story">+</button><span>Ma story</span></div>`+
  authors.map(id=>`<div class="story ${G.stories.some(s=>s.by===id&&!s.seen)?'':'seen'}"><button class="ring" type="button" data-who="${id}" aria-label="Story de ${WHO[id].name}">${avatarOf(id)}</button><span>${WHO[id].name}</span></div>`).join('');
}
let sv=null,svTimer=null;
function openStories(author){const list=G.stories.filter(s=>s.by===author);if(!list.length)return;let i=list.findIndex(s=>!s.seen);sv={author,list,i:i<0?0:i};showStory()}
function storyContent(s){
 if(s.type==='photo')return `<div class="sv-frame" style="background:#000">${photoSVG(s.photo)}${s.text?`<div class="sv-cap">${fmtText(s.text)}</div>`:''}</div>`;
 return `<div class="sv-frame" style="background:${STORY_BG[s.bg||0]}"><div class="sv-text">${fmtText(s.text)}</div></div>`;
}
function showStory(){
 clearTimeout(svTimer);const s=sv.list[sv.i];s.seen=true;saveG();
 openSheet(`<div class="sv-bars">${sv.list.map((_,k)=>`<span class="${k<sv.i?'done':k===sv.i?'cur':''}"><i></i></span>`).join('')}</div>
 <div class="who"><div class="av sm">${avatarOf(s.by)}</div><div style="flex:1;min-width:0"><b>${esc(nameOf(s.by))}</b> <span class="muted">${handleOf(s.by)}</span></div><button class="gbtn ghost" type="button" data-close aria-label="Fermer">✕</button></div>
 <div class="sv-stage">${storyContent(s)}<button class="sv-zone l" type="button" data-sv="prev" aria-label="Story précédente"></button><button class="sv-zone r" type="button" data-sv="next" aria-label="Story suivante"></button></div>
 ${s.type==='photo'?tagLine(s.photo):''}
 ${s.by==='me'?`<p class="muted" style="text-align:center">Vue par ${Math.min(NPCS.length,2+Math.floor(G.day*1.5))} personnes</p>`:`<div class="reacts">${['❤️','😂','😮','🔥'].map(e=>`<button type="button" data-react="${e}" aria-label="Réagir ${e}" ${s.reacted?'disabled':''}>${e}</button>`).join('')}</div>`}`,true);
 svTimer=setTimeout(nextStory,6000);
}
function nextStory(){if(!sv)return;if(sv.i<sv.list.length-1){sv.i++;showStory()}else closeSheet()}
function prevStory(){if(sv&&sv.i>0){sv.i--;showStory()}}

/* ---------- fil ---------- */
const VERIF='<svg class="ok" viewBox="0 0 24 24"><path d="M12 1.5l2.6 2 3.2-.3 1 3.1 2.8 1.6-.9 3.1.9 3.1-2.8 1.6-1 3.1-3.2-.3-2.6 2-2.6-2-3.2.3-1-3.1L2.4 14l.9-3.1-.9-3.1 2.8-1.6 1-3.1 3.2.3z" fill="#4f8ff0"/><path d="M7.5 12.2l3 3 6-6.2" fill="none" stroke="#fff" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round"/></svg>';
const I={
 c:'<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M4 12a8 8 0 1 1 3.3 6.5L3.5 20l1.3-3.6A8 8 0 0 1 4 12z" stroke-linejoin="round"/></svg>',
 r:'<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M17 2l4 4-4 4M3 11V9a3 3 0 0 1 3-3h15M7 22l-4-4 4-4M21 13v2a3 3 0 0 1-3 3H3"/></svg>',
 l:'<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linejoin="round"><path d="M12 20s-7.5-4.6-9.2-9.3C1.6 7.2 4 4 7.3 4c2 0 3.5 1.1 4.7 2.7C13.2 5.1 14.7 4 16.7 4 20 4 22.4 7.2 21.2 10.7 19.5 15.4 12 20 12 20z"/></svg>',
 f:'<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linejoin="round"><path d="M12 2.8l2.8 5.8 6.3.9-4.6 4.4 1.1 6.3L12 17.2l-5.6 3 1.1-6.3L2.9 9.5l6.3-.9z"/></svg>'};
let cm=null;
function postHTML(p){
 const prev=p.comments.slice(-2);
 return `${p.day!=null?`<div class="pdate">${postWhen(p)}</div>`:''}<article class="post${p.day!=null?' dated':''}" data-id="${p.id}"><button class="av avbtn" type="button" data-a="u" aria-label="Compte Insta de ${esc(nameOf(p.by))}">${avatarOf(p.by)}</button><div class="pbody">
  <div class="phead"><button class="pname" type="button" data-a="u">${esc(nameOf(p.by))}</button>${p.by==='me'?'':VERIF}<span class="h">${handleOf(p.by)}</span></div>
  <p>${fmtText(p.text)}</p>
  ${p.photo?`<div class="photo">${photoSVG(p.photo)}</div>${tagLine(p.photo)}`:''}
  ${prev.length?`<div class="cprev">${prev.map(c=>`<button class="peek" type="button" data-a="c"><b>${esc(nameOf(c.by))}</b> ${c.to?`<span class="mention">${esc(handleOf(c.to))}</span> `:''}${esc(c.text)}</button>`).join('')}${p.comments.length>2?`<button class="more" type="button" data-a="c">Voir les ${p.comments.length} commentaires</button>`:''}</div>`:''}
  <div class="pact"><button type="button" data-a="c" aria-label="Commenter">${I.c}${fmtN(p.c+p.comments.length)}</button>
   <button type="button" data-a="r" class="rt ${p.rt?'on':''}" aria-label="Republier">${I.r}${fmtN(p.r+(p.rt?1:0))}</button>
   <button type="button" data-a="l" class="like ${p.liked?'on':''}" aria-label="J'aime">${I.l}${fmtN(p.l+(p.liked?1:0))}</button>
   <button type="button" data-a="f" class="fav ${p.fav?'on':''}" aria-label="Favori">${I.f}</button></div></div></article>`;
}
/* ---------- commentaires : fils de discussion et réponses ----------
   un commentaire = {id, by, text, re (id du commentaire de départ si c'est une réponse), to (à qui il répond), vs (qui il critique)} */
const STANCES={
 accord:{label:"D'accord",cls:'pos',d:4,v:-3,lines:["Grave, t'as raison {n}","Tellement vrai 💯","Je pense exactement pareil"]},
 desaccord:{label:"Pas d'accord",cls:'neg',d:-4,v:4,lines:["Franchement je suis pas d'accord","Tu exagères un peu là {n}","Laisse {v} tranquille, sérieux"]},
 drole:{label:'Drôle',cls:'pos',d:2,v:0,lines:["Je prends le pop-corn 🍿","Le débat de l'année 😂","Mdr vous vous clashez en commentaires 😂"]},
 calmer:{label:'Apaiser',cls:'neu',d:1,v:2,lines:["Allez, on se calme, chacun son avis ✌️","On peut ne pas être d'accord sans se clasher 🙏","Vous avez tous un peu raison"]},
 mechant:{label:'Méchant',cls:'neg',d:-8,v:0,lines:["Personne t'a demandé ton avis","Franchement, tu saoules {n}"]}};
const THANKS=["merci de me défendre 🙏","enfin quelqu'un de raisonnable ❤️","merci, vraiment","ça fait plaisir de lire ça 🥹"];
const cmRow=c=>`<div class="cm${c.re?' re':''}"><div class="av sm">${avatarOf(c.by)}</div><div style="min-width:0;flex:1"><b>${esc(nameOf(c.by))}</b> <span class="muted">${handleOf(c.by)}</span><p>${c.to?`<span class="mention">${esc(handleOf(c.to))}</span> `:''}${fmtText(c.text)}</p>${c.by!=='me'?`<button class="rep" type="button" data-reply="${c.id}">Répondre</button>`:''}</div></div>`;
function threadHTML(p){const ids=new Set(p.comments.map(c=>c.id)),tops=p.comments.filter(c=>!c.re||!ids.has(c.re));
 return tops.map(c=>cmRow(c)+p.comments.filter(r=>r.re===c.id).map(cmRow).join('')).join('')}
function replySugg(R){const n=nameOf(R.by),v=R.vs&&R.vs!=='me'?nameOf(R.vs):null;
 return Object.keys(STANCES).map(t=>{const L=STANCES[t].lines.filter(l=>v||!l.includes('{v}'));return {t,text:pickR(L).replace('{n}',n).replace('{v}',v||'')}})}
function openComments(id){
 const p=G.posts.find(x=>x.id===id);if(!p)return;
 if(!cm||cm.id!==id)cm={id,tone:'gentil',stance:'accord',re:null,sugg:['gentil','drole','moqueur','mechant'].map(t=>({t,text:pickR(TONES[t].lines).replace('{n}',nameOf(p.by))}))};
 const target=p.by==='me'?null:nameOf(p.by),R=cm.re&&p.comments.find(c=>c.id===cm.re);
 let form;
 if(R)form=`<div class="replyto" id="cReplyTo"><span>Tu réponds à <b>${esc(nameOf(R.by))}</b></span><button class="gbtn ghost" type="button" data-cancelre>Annuler</button></div>
  <label class="muted" for="cTxt">Écris ta réponse</label><textarea id="cTxt" maxlength="160" placeholder="Ta réponse à ${esc(nameOf(R.by))}…" style="min-height:80px"></textarea>
  <span class="muted">Ton de ta réponse</span><div class="chips" role="group" aria-label="Ton de la réponse">${Object.entries(STANCES).map(([k,t])=>`<button class="chip" type="button" data-stance="${k}" aria-pressed="${cm.stance===k}">${t.label}</button>`).join('')}</div>
  <div class="row"><button class="gbtn" type="button" id="cSend">Répondre</button></div>
  <span class="muted">Ou choisis une réponse toute prête</span>
  <div class="choices">${cm.rsugg.map((s,i)=>`<button class="choice" type="button" data-rs="${i}">${esc(s.text)}<small class="t-${STANCES[s.t].cls}">${STANCES[s.t].label}</small></button>`).join('')}</div>`;
 else if(p.by==='me')form='<p class="muted">C\'est ton post : appuie sur « Répondre » sous un commentaire pour discuter.</p>';
 else form=`<p class="muted">${isNpc(p.by)?(p.mine?`Tu as déjà commenté : ${target} a vu ta réaction. Tu peux encore répondre aux commentaires.`:`Ton commentaire changera ta relation avec ${target}.`):'Compte anonyme : ton commentaire sera vu de tous.'}</p>
 <label class="muted" for="cTxt">Écris ton commentaire</label>
 <textarea id="cTxt" maxlength="160" placeholder="Ton commentaire…" style="min-height:80px"></textarea>
 <span class="muted">Ton de ton commentaire</span><div class="chips" role="group" aria-label="Ton du commentaire">${Object.entries(TONES).map(([k,t])=>`<button class="chip" type="button" data-tone="${k}" aria-pressed="${cm.tone===k}">${t.label}</button>`).join('')}</div>
 <div class="row"><button class="gbtn" type="button" id="cSend">Commenter</button></div>
 <span class="muted">Ou choisis un commentaire tout prêt</span>
 <div class="choices">${cm.sugg.map((s,i)=>`<button class="choice" type="button" data-sg="${i}">${esc(s.text)}<small class="t-${TONES[s.t].cls}">${TONES[s.t].label}</small></button>`).join('')}</div>`;
 openSheet(`<div class="who"><button class="av sm avbtn" type="button" data-ig="${p.by}" aria-label="Compte Insta">${avatarOf(p.by)}</button><div style="flex:1;min-width:0"><b>${esc(nameOf(p.by))}</b><p class="muted" style="margin:2px 0 0">${fmtText(p.text.length>90?p.text.slice(0,90)+'…':p.text)}</p></div><button class="gbtn ghost" type="button" data-close aria-label="Fermer">✕</button></div>
 <div class="clist">${p.comments.length?threadHTML(p):'<p class="muted">Aucun commentaire pour l\'instant.</p>'}</div>${form}`);
 if(R){const el=$('cReplyTo');if(el&&el.scrollIntoView)el.scrollIntoView({block:'start'});const t=$('cTxt');if(t&&t.focus)t.focus({preventScroll:true})}
}
function startReply(cid){const p=G.posts.find(x=>x.id===cm.id),R=p&&p.comments.find(c=>c.id===cid);if(!R)return;cm.re=cid;cm.stance='accord';cm.stanceSet=false;cm.rsugg=replySugg(R);openComments(p.id)}
function sendComment(text,tone){
 const p=G.posts.find(x=>x.id===cm.id);if(!p||!text)return;
 const mine=mkC('me',text);p.comments.push(mine);G.st.comments++;G.ig.act=(G.ig.act||0)+1;let msg='Commentaire publié';
 if(isNpc(p.by)&&!p.mine){const T=TONES[tone],ch=relChange(p.by,T.d,T.l);p.mine=true;p.comments.push(mkC(p.by,genderize(pickR(T.reply),p.by),{re:mine.id,to:'me'}));note(`Tu as commenté le post de ${WHO[p.by].name} (${T.label.toLowerCase()}) : ${ch}`);msg=ch||msg;
  /* le ou la critique habituel·le de l'auteur vient parfois te répondre : tu peux lui répondre à ton tour */
  const D=DEBATE[p.by];if(D&&TONES[tone].d>0&&Math.random()<.45)p.comments.push(mkC(D.critic,genderize(pickR(CRIT_ME),D.critic),{re:mine.id,to:'me',vs:'me'}))}
 cm.sugg=cm.sugg.map(s=>({t:s.t,text:pickR(TONES[s.t].lines).replace('{n}',nameOf(p.by))}));
 saveG();openComments(p.id);refreshPost(p);drawNav();toast(msg);
}
function sendReply(text,stance){
 const p=G.posts.find(x=>x.id===cm.id),R=p&&p.comments.find(c=>c.id===cm.re);if(!R||!text)return;
 const root=R.re||R.id,S=STANCES[stance]||STANCES.accord,parts=[];
 p.comments.push(mkC('me',text,{re:root,to:R.by,vs:stance==='desaccord'||stance==='mechant'?R.by:null}));G.st.comments++;G.ig.act=(G.ig.act||0)+1;G.st.replies=(G.st.replies||0)+1;
 if(isNpc(R.by)&&!R.answered){R.answered=1;
  const d=stance==='drole'?(FICHES[R.by].hum>.5?3:1):S.d,ch=relChange(R.by,d,0);if(ch)parts.push(ch);
  if(R.vs&&isNpc(R.vs)&&S.v){const c2=relChange(R.vs,S.v,0);if(c2)parts.push(c2)}
  const V=VOICE[R.by];p.comments.push(mkC(R.by,genderize(pickR(stance==='accord'||stance==='drole'?V.happy:stance==='calmer'?V.neutral:V.hurt),R.by),{re:root,to:'me'}));
  if(stance==='desaccord'&&R.vs&&isNpc(R.vs)&&Math.random()<.6)p.comments.push(mkC(R.vs,pickR(THANKS),{re:root,to:'me'}));
  note(`Tu as répondu à ${WHO[R.by].name} sous le post de ${nameOf(p.by)} (${S.label.toLowerCase()})${parts.length?' : '+parts.map(x=>x.split(' : ').join(' ')).join(', '):''}`)}
 cm.re=null;saveG();openComments(p.id);refreshPost(p);checkObjectives();toast(parts.join(' · ')||'Réponse publiée');
}
function refreshPost(p){document.querySelectorAll(`.post[data-id="${p.id}"]`).forEach(el=>el.outerHTML=postHTML(p))}

/* ---------- Insta : comptes, abonnements, débats ---------- */
const BIO={ines:"Danse dancehall 💃 · K-drama addict 🥺 · Martinique ➜ Guadeloupe ✨",kylian:"⚽ n°10 · Saint-François 🎣 · tkt",maelle:"Capitaine pom-pom 📣 · soirées au Gosier 💅 · DM pour la liste",noah:"🏀 meneur · mangas · la cuisine de mamie 🍛",jade:"poèmes dans la marge.\nastronomie. pas de majuscules.",meisha:"🛍️ shopping addict · rubrique mode du journal ✍️ · ma jumelle @kenza.lcx 👯‍♀️",jessica:"📚 cours particuliers lun & mer 17h-19h · maths 📐 · Les Abymes 😊",noemie:"⚽ seule fille de l'équipe · Morne-à-l'Eau 💪 · on est ensemble",eva:"🎨 dessin · peinture · Petit-Bourg 🌸 · 💕 @kyky971",kenza:"Danse 💃 · mode 💅 · Baie-Mahault 🌴 · DM fermés (ou presque) 😘",anais:"Capitaine hand 🤾‍♀️ · footing 6h 🌅 · toujours le smile 😄",sacha:"🎧 zouk · gwo ka · rap — nouveau son bientôt",potins:"Tout ce qui se passe au lycée 👀 · envoie tes potins en DM"};
const FANS0={ines:412,kylian:986,maelle:2310,noah:644,jade:158,anais:871,kenza:2680,eva:540,noemie:930,jessica:390,meisha:2140,sacha:1520,potins:3140};
const FOLLOW_AT=20;
/* posts des camarades selon leur personnalité (vie du lycée, passions, avis) ; Jade poste souvent des poèmes */
const NPC_POSTS={
 jade:[{text:"la cour à midi\ndes voix qui se croisent\net moi qui compte les nuages\ncomme on compte les jours avant le bac",poem:1},{text:"il pleut sur sainte-anne\nla mer ne sait pas qu'on a philo demain\nelle a de la chance",poem:1},
  {text:"nous sommes des étoiles en terminale\nbrillantes, fatiguées,\net un peu en retard",poem:1},{text:"le cdi est une île\nj'y accoste chaque midi\nsans passeport",poem:1,scene:'chambre'},
  {text:"ma grand-mère dit que les flamboyants fleurissent pour ceux qui savent attendre.\nj'attends.",poem:1},{text:"on m'a demandé pourquoi j'écris.\nparce que le silence aussi\na besoin d'une voix.",poem:1},
  {text:"avis impopulaire : le cdi devrait être ouvert le samedi."},{text:"la réforme du bac nous traite comme des statistiques. je dis ça, je dis rien."}],
 kylian:[{text:"Victoire 3-1 ce week-end ⚽ le n°10 a encore frappé 😎",scene:'cour'},{text:"Poisson pané 3 fois cette semaine à la cantine. C'est un complot 🐟",scene:'cantine'},
  {text:"Le bac c'est dans combien de temps déjà ? Demandez pas, c'est pour un ami 😅"},{text:"Qui a dit que le foot c'était pas intelligent ? Venez débattre 😤"},{text:"Pêche avec mon père ce matin, 3 vivaneaux 🎣 respectez",scene:'plage'}],
 maelle:[{text:"Soirée vendredi au Gosier 🎉 liste fermée 💅",scene:'soiree'},{text:"Honnêtement l'uniforme au lycée ce serait littéralement la fin de la mode 🙄"},
  {text:"Nouvelle choré des pom-pom ce soir, vous allez pas être prêts 📣",scene:'basket'},{text:"Les gens qui passent leur midi au CDI… vous allez bien ? 🙄"},{text:"Rendez-vous aux casiers, j'ai un truc à vous montrer 👀",scene:'couloir'}],
 meisha:[{text:"Haul de Jarry du jour 🛍️ j'ai été raisonnable (non)",scene:'couloir'},{text:"Nouvelle rubrique mode dans le journal : les tendances de la rentrée ✍️💅",scene:'couloir'},{text:"Ma jumelle et moi, toujours assorties 👯‍♀️ @kenza.lcx",scene:'plage'},
  {text:"Avis impopulaire : les crocs, c'est non. Point."},{text:"Shopping fini, mon porte-monnaie pleure 😭🛍️",scene:'chambre'}],
 jessica:[{text:"Cours particulier ce soir à 17 h, il reste des places 📚✏️",scene:'couloir'},{text:"Fiche de révision du jour : les suites en maths 📐"},{text:"J'ai fait des cookies pour le cours de mercredi 🍪",scene:'chambre'},
  {text:"Astuce du jour : relire ses cours le soir même, ça change tout 😊"},{text:"Fière de mes élèves : +3 points de moyenne en un mois 📈",scene:'couloir'}],
 noemie:[{text:"Triplé ce week-end ⚽⚽⚽ qui disait que le foot c'était pour les garçons ?",scene:'cour'},{text:"Entraînement sous la pluie, on lâche rien 💪",scene:'basket'},{text:"Le foot féminin mérite des stades pleins. Point."},
  {text:"Bokit d'après-match avec l'équipe 🤤",scene:'cantine'},{text:"Mes frères ont encore perdu contre moi au jardin 😂",scene:'plage'}],
 eva:[{text:"Croquis du jour 🎨 la cour sous la pluie",scene:'cour'},{text:"Coucher de soleil à peindre ce soir 🌅",scene:'plage'},{text:"Nouvelle toile terminée, je suis trop fière 🥹🎨",scene:'chambre'},
  {text:"L'atelier d'arts plastiques prépare une expo au CDI, venez ! 🌸",scene:'couloir'},{text:"Le lycée devrait avoir plus de murs à peindre, vous trouvez pas ? 🎨"}],
 kenza:[{text:"Nouvelle tenue, nouvelle moi ✨💅",scene:'couloir'},{text:"Golden hour à la plage, aucun filtre 🌅😘",scene:'plage'},{text:"Arrêtez de m'écrire « tu es libre samedi ? » 😂 la réponse est non"},
  {text:"Répétition du club de danse ce soir, la choré va vous tuer 💃",scene:'basket'},{text:"Soirée chez Maëlle 🎉 on était les plus belles, évidemment 💋",scene:'soiree'}],
 noah:[{text:"Colombo cuisiné avec ma grand-mère, 10/10 🍛",scene:'cantine'},{text:"Match de basket jeudi, venez nous soutenir 🏀",scene:'basket'},
  {text:"Honnêtement les devoirs le week-end, ça devrait être interdit"},{text:"Le prof de physique a expliqué un truc et j'ai TOUT compris. Moment historique ptdr"}],
 ines:[{text:"Nouvelle choré dancehall apprise ce week-end 💃✨",scene:'chambre'},{text:"Quelqu'un regarde le nouveau K-drama ? J'ai pleuré 3 fois 🥺"},
  {text:"Mon petit frère a eu 18 en maths, je suis trop fière 🥹"},{text:"On devrait avoir plus d'activités artistiques au lycée, vous trouvez pas ? ✨"},{text:"Entre deux cours avec ma meilleure 💕",scene:'couloir'}],
 anais:[{text:"Footing 6 h ✅ le lever de soleil valait le coup 🌅💪",scene:'plage'},{text:"Le hand féminin mérite autant de public que le foot. Venez samedi ! 🔥",scene:'basket'},
  {text:"Défi : 50 pompes avant le cours de maths, qui me suit ? 😂"},{text:"Journée sans sucre ! … jusqu'à 10 h 😂"}],
 sacha:[{text:"Nouveau son en écoute privée 🎧 le gwo ka c'est l'avenir",scene:'chambre'},{text:"La musique devrait compter pour le bac. Je dis ça…"},
  {text:"Répète au foyer à midi, passez écouter 🎸",scene:'couloir'},{text:"Le zouk c'est pas ringard, c'est notre histoire. Point."}]};
/* qui critique qui sous les posts, et qui prend la défense */
const DEBATE={
 jade:{critic:'kylian',p:.5,poem:.9,def:['sacha','anais','ines','noah'],
  crit:["encore un poème 😭 tu sais qu'on peut juste dire « il fait beau »","frr j'ai lu 3 fois j'ai toujours rien compris","wsh c'est insta ici, pas le cours de français","la poésie en terminale… respect mais non 😂","jade qui transforme la cantine en œuvre d'art, on aura tout vu"],
  defl:["ses poèmes sont plus beaux que tout ce que tu postes","la poésie c'est pas ringard, c'est toi qui l'es 😂","jade continue, on adore 🌙"],
  auth:["les critiques sont une forme d'attention. merci kylian.","je n'écris pas pour toi. et pourtant tu lis toujours jusqu'au bout.","il y a de la place pour tout le monde ici. même pour toi."]},
 maelle:{critic:'jade',p:.5,def:['ines','kylian'],
  crit:["« liste fermée ». la popularité n'est pas une personnalité.","fascinant. vraiment.","certaines personnes organisent des soirées, d'autres lisent. chacun ses priorités.","trois emojis et zéro idée. performance."],
  auth:["Jade, ton seul public c'est ta grand-mère 💅","Jalousie détectée 🙄","Littéralement personne t'a demandé ton avis"]},
 kylian:{critic:'sacha',p:.45,def:['noah','anais'],
  crit:["un but contre les derniers du championnat, calme-toi gros 😂","t'as oublié de dire que t'as raté le penalty","toujours en train de te la raconter, la vibe est pas là"],
  auth:["vas-y parle quand tu marques un but toi","jaloux va 😎","t'inquiète je te dédicace le prochain"]},
 sacha:{critic:'kylian',p:.45,def:['jade','ines'],
  crit:["ton son on dirait la radio de mon grand-père 😂","encore du gwo ka… change de disque gros","frr la musique ça te donnera pas le bac"],
  auth:["chacun sa vibe gros ✌️","le gwo ka c'est notre histoire, respecte","t'écouteras quand je serai connu"]},
 noah:{critic:'maelle',p:.3,def:['kylian','anais'],
  crit:["Genre tu cuisines maintenant ? 🙄 … ok c'est mignon","Noah qui comprend la physique, littéralement l'événement de l'année 💅"],
  auth:["ptdr t'es dure","Merci Maëlle… je crois ?"]},
 meisha:{critic:'jade',p:.3,def:['kenza','ines','sacha'],
  crit:["encore des achats. la planète apprécie.","une rubrique mode dans un journal du lycée. fascinant.","tu as acheté un nouveau sac pour ranger tes autres sacs ?"],
  defl:["laisse ma jumelle tranquille 🙄","sa rubrique c'est la plus lue du journal","jalousie 💅"],
  auth:["Jade, je t'offre un haut pour ton anniversaire, promis 😘","Chacun sa passion bébé 💅"]},
 jessica:{critic:'maelle',p:.3,def:['jade','noemie','kylian'],
  crit:["Genre tu postes des fiches de révision sur Insta ? 🙄","Littéralement la prof de la classe 💅","Personne t'a demandé un cours 🙄"],
  defl:["elle m'a sauvé en maths, respect","laisse-la, elle aide tout le monde","jessica c'est la meilleure"],
  auth:["La porte est ouverte lundi à 17 h, Maëlle 😊","Pas de souci, chacun son style 📚"]},
 noemie:{critic:'maelle',p:.3,def:['anais','kylian','noah'],
  crit:["Genre tu fais que du foot ? 🙄","Littéralement toujours en jogging 💅","Encore un match… passionnant 🙄"],
  defl:["elle a mis un triplé, toi t'as fait quoi ?","laisse-la tranquille 🙄","noémie c'est la meilleure de l'équipe"],
  auth:["Viens jouer et on en reparle 😂","T'inquiète, je joue mieux que je réponds ⚽"]},
 eva:{critic:'kenza',p:.25,def:['kylian','jade','sacha'],
  crit:["Encore un dessin ? Mignon 😘","Tu devrais mettre des photos de toi parfois, non ? ✨","C'est joli… pour une expo de collège 😅"],
  defl:["laisse-la tranquille 🙄","ses dessins sont magnifiques","eva c'est une vraie artiste, point"],
  auth:["Merci quand même 🌸","Chacun son style 💕","Pas grave, moi j'aime bien 🎨"]},
 kenza:{critic:'jade',p:.4,def:['ines','kylian','noah'],
  crit:["encore un selfie. le miroir doit être épuisé.","la beauté passe. les notes de philo restent.","fascinant, une photo de plus."],
  defl:["laisse-la briller 🙄","t'es juste jalouse de ses likes","kenza reine, point final 👑"],
  auth:["Jade, souris un peu, ça ne coûte rien 😘","Merci pour le like quand même 💋","Jalousie, quand tu nous tiens ✨"]},
 anais:{critic:'maelle',p:.3,def:['kylian','noah'],
  crit:["Le sport à 6 h c'est littéralement de la torture 🙄","Genre tu dors quand ?","On a compris, t'es sportive 💅"],
  auth:["Viens courir avec moi et on en reparle 😂💪","Le sport c'est la vie ! 🔥"]}};
const DEF_LINES=["personne t'oblige à lire, sérieux","t'as que ça à faire, critiquer sous chaque post ?","laisse {a} tranquille 🙄","moi j'aime bien, et je suis pas {s:seul·e}","c'est toujours toi qui viens clasher, ça devient lourd","respecte un peu, chacun son truc"];
const RETORT=["oh ça va, c'était pour rire 😅","je donne mon avis, c'est interdit ?","vous êtes tous ses avocats ou quoi mdr","personne t'a demandé de répondre"];
const CRIT_ME=["toi aussi tu valides ça ? 😂","sérieux, t'aimes vraiment ça ?","on n'a pas les mêmes goûts mdr"];
const DEF_ME=["t'as que ça à faire ? 🙄","respecte un peu, sérieux","la jalousie se voit d'ici 😂","laisse tomber, ce post est très bien"];
/* fil de débat sous un post : critique → défense → réplique → réponse de l'auteur */
function debateThread(p){
 const D=DEBATE[p.by];if(!D||Math.random()>(p.poem?D.poem:D.p*(p.daily?.3:1)))return [];
 const c=D.critic,cr=mkC(c,genderize(pickR(D.crit),c),{vs:p.by}),out=[cr],defs=D.def.filter(x=>x!==c);
 const line=(id,L)=>genderize(pickR(L).replace('{a}',nameOf(p.by)),id);
 const d=pickR(defs);out.push(mkC(d,line(d,D.defl&&Math.random()<.5?D.defl:DEF_LINES),{re:cr.id,to:c,vs:c}));
 if(Math.random()<.7)out.push(mkC(c,genderize(pickR(RETORT),c),{re:cr.id,to:d,vs:d}));
 if(Math.random()<.6)out.push(mkC(p.by,genderize(pickR(D.auth),p.by),{re:cr.id,to:c,vs:c}));
 const d2=pickR(defs.filter(x=>x!==d));if(d2&&Math.random()<.4)out.push(mkC(d2,line(d2,DEF_LINES),{re:cr.id,to:c,vs:c}));
 if(G&&G.links){link(c,p.by).ami=clamp(link(c,p.by).ami-1,0,100);link(d,c).ami=clamp(link(d,c).ami-1,0,100)}
 return out}
/* un camarade poste : texte de sa personnalité, photo éventuelle, commentaires et débat */
function npcPost(by,t){
 const ppl=t.with&&coupleOf(by)===t.with?[by,t.with]:t.scene?[by,...(Math.random()<.5?[pickR(NPCS.filter(x=>x.id!==by)).id]:[])]:null;
 const p=mkPost({by,text:t.text,poem:!!t.poem,daily:!!t.daily,photo:ppl?{scene:t.scene,people:ppl,author:by}:null,c:Math.floor(Math.random()*20)+2,r:Math.floor(Math.random()*200)+5,l:Math.floor(Math.random()*4000)+100});
 p.comments.push(...debateThread(p));
 NPCS.filter(x=>x.id!==by&&!p.comments.some(c=>c.by===x.id)).sort(()=>Math.random()-.5).slice(0,Math.random()<.5?1:2).forEach(x=>{
  const a=link(x.id,by).ami,tone=a>=60?pickR(['gentil','drole']):a>=35?pickR(['drole','neutre','gentil']):pickR(['neutre','moqueur']);
  p.comments.push(mkC(x.id,genderize(pickR(TONES[tone].lines).replace('{n}',nameOf(by)),x.id),{tone}))});
 return p}

/* abonnements : les camarades s'abonnent (ou demandent) quand l'amitié monte, se désabonnent si elle devient négative */
const igFollowers=()=>NPCS.map(n=>n.id).filter(id=>G.ig.followers[id]);
const igFriends=()=>igFollowers().filter(id=>G.ig.following[id]);
function followTick(){
 const ig=G.ig;let ch=false;
 NPCS.forEach(n=>{const id=n.id,a=G.rel[id].ami,f=ig.followers[id],rq=ig.reqs.includes(id),th=FOLLOW_AT-(ig.following[id]?6:0);
  if(!f&&!rq&&a>=th&&Math.random()<.3){ch=true;
   if(ig.priv){ig.reqs.push(id);note(`${n.name} veut s'abonner à ton compte Insta`);if(!G.asleep&&!$('game').hidden)toast(`📩 ${n.name} veut s'abonner à ton compte`)}
   else{ig.followers[id]=1;note(S(id,`${n.name} s'est abonné·e à ton compte Insta`));if(!G.asleep&&!$('game').hidden)toast(S(id,`➕ ${n.name} s'est abonné·e à toi`))}}
  else if(f&&a<0&&Math.random()<.25){delete ig.followers[id];ch=true;note(`${n.name} ne te suit plus sur Insta 💔`)}
  else if(rq&&a<0){ig.reqs=ig.reqs.filter(x=>x!==id);ch=true}});
 if(ch&&!$('game').hidden){drawNav();if(view==='insta')drawView()}
}
function igFollow(id){
 const ig=G.ig;let msg;
 if(ig.following[id]){delete ig.following[id];msg=`Tu ne suis plus ${nameOf(id)}`;if(isNpc(id)&&ig.followers[id]){const c=relChange(id,-2);if(c)msg+=' · '+c}}
 else{ig.following[id]=1;msg=P(`Tu t'es abonné·e à ${handleOf(id)}`);if(isNpc(id)&&!ig.once[id]){ig.once[id]=1;const c=relChange(id,1);if(c)msg+=' · '+c}note(msg)}
 checkObjectives();saveG();toast(msg);
}
function igRequest(id,ok){
 const ig=G.ig;ig.reqs=ig.reqs.filter(x=>x!==id);let c;
 if(ok){ig.followers[id]=1;c=relChange(id,2);note(`Tu as accepté la demande de ${WHO[id].name}`)}else{c=relChange(id,-3);note(`Tu as refusé la demande de ${WHO[id].name}`)}
 checkObjectives();saveG();drawNav();toast((ok?'Demande acceptée':'Demande refusée')+(c?' · '+c:''));
}
const igStat=(n,l)=>`<div><b>${fmtN(n)}</b><small>${l}</small></div>`;
function igCounts(id){
 if(id==='me'){const f=igFollowers().length;return {posts:G.posts.filter(p=>p.by==='me').length,fol:G.ig.fans+f,ing:Object.keys(G.ig.following).length}}
 const base=150+hash(id)%220;return {posts:G.posts.filter(p=>p.by===id).length,fol:(FANS0[id]||200)+(G.ig.following[id]?1:0),ing:base+(G.ig.followers[id]?1:0)}}
function igGrid(list){
 if(!list.length)return '<p class="muted">Aucune publication pour l\'instant.</p>';
 return `<div class="ig-grid">${list.map(p=>p.photo?`<button class="ig-tile" type="button" data-igpost="${p.id}" aria-label="Voir la publication">${photoSVG(p.photo).replace('<svg ','<svg preserveAspectRatio="xMidYMid slice" ')}</button>`
  :`<button class="ig-tile" type="button" data-igpost="${p.id}" style="background:${STORY_BG[hash(p.id)%STORY_BG.length]}"><span>${esc(p.text)}</span></button>`).join('')}</div>`}
const igPeople=(ids,extra)=>`<div class="present">${ids.map(id=>`<button class="pers" type="button" data-ig="${id}"><span class="av">${avatarOf(id)}</span><span>${esc(nameOf(id))}</span><small>${extra?extra(id):''}</small></button>`).join('')}</div>`;
function drawInsta(){
 const ig=G.ig,c=igCounts('me'),fol=igFollowers(),ing=Object.keys(ig.following),fr=igFriends();
 const disc=[...NPCS.map(n=>n.id),'potins'].filter(id=>!ig.following[id]);
 $('gView').innerHTML=`<div class="ig-top"><div class="ig-av">${avatarOf('me')}</div><div class="ig-stats">${igStat(c.posts,'publications')}${igStat(c.fol,'abonnés')}${igStat(c.ing,'abonnements')}</div></div>
 <div class="ig-id"><b>${esc(fullName(me())||'Moi')}</b><span class="muted">${myHandle()}${ig.priv?' · 🔒 compte privé':''}</span><p class="ig-bio">${ig.bio?fmtText(ig.bio):'<span class="muted">Pas encore de bio.</span>'}</p></div>
 <p class="muted" style="margin:0 0 10px">Plus tu publies et commentes, plus des élèves du lycée s'abonnent à toi.</p>
 <div class="row" style="justify-content:flex-start"><button class="gbtn ghost" type="button" data-igbio>Modifier la bio</button><button class="gbtn ghost" type="button" data-igpriv>${ig.priv?'Passer en public':'Passer en privé'}</button><button class="gbtn" type="button" data-igcompose>Publier</button></div>
 ${ig.reqs.length?`<div class="card"><span class="eyebrow">Demandes d'abonnement · ${ig.reqs.length}</span>${ig.reqs.map(id=>`<div class="relrow"><button class="av avbtn" type="button" data-ig="${id}">${avatarOf(id)}</button><div class="info"><b>${esc(fullNameOf(id))}</b><span class="muted">${WHO[id].handle} · amitié ${G.rel[id].ami}</span></div><button class="gbtn" type="button" data-req="${id}" data-ok="1">Accepter</button><button class="gbtn ghost" type="button" data-req="${id}" data-ok="0" aria-label="Refuser">✕</button></div>`).join('')}</div>`:''}
 <div class="card"><span class="eyebrow">Amis · ${fr.length}</span>${fr.length?igPeople(fr):'<p class="muted">Tes amis sont les comptes qui te suivent et que tu suis en retour.</p>'}</div>
 <div class="card"><span class="eyebrow">Abonnés · ${fmtN(c.fol)}</span>${fol.length?igPeople(fol,id=>ig.following[id]?'ami·e':''):''}${(ig.newFans||[]).length?`<span class="muted">Derniers abonnés : ${ig.newFans.slice(0,6).map(h=>`<span class="mention">${esc(h)}</span>`).join(', ')}</span>`:''}<p class="muted">${fol.length?`et ${ig.fans} autres élèves du lycée`:`${ig.fans} élèves du lycée te suivent. Tes camarades s'abonneront quand vous serez plus proches (amitié ${FOLLOW_AT}).`}</p></div>
 <div class="card"><span class="eyebrow">Abonnements · ${ing.length}</span>${ing.length?igPeople(ing,id=>ig.followers[id]?'te suit':''):'<p class="muted">Tu ne suis encore personne.</p>'}</div>
 ${disc.length?`<div class="card"><span class="eyebrow">Comptes à découvrir</span>${disc.map(id=>`<div class="relrow"><button class="av avbtn" type="button" data-ig="${id}">${avatarOf(id)}</button><div class="info"><b>${esc(nameOf(id))}</b><span class="muted">${handleOf(id)} · ${fmtN(igCounts(id).fol)} abonnés</span></div><button class="gbtn" type="button" data-follow="${id}">S'abonner</button></div>`).join('')}</div>`:''}
 <div class="sec-title">Mes publications</div>${igGrid(G.posts.filter(p=>p.by==='me'))}`;
}
function openInsta(id){
 if(id==='me'){closeSheet();view='insta';drawNav();drawView();window.scrollTo(0,0);return}
 const c=igCounts(id),ig=G.ig,f=ig.following[id],them=isNpc(id)&&ig.followers[id];
 openSheet(`<div class="row" style="justify-content:flex-end"><button class="gbtn ghost" type="button" data-close aria-label="Fermer">✕</button></div>
 <div class="ig-top" style="margin-top:0"><div class="ig-av">${avatarOf(id)}</div><div class="ig-stats">${igStat(c.posts,'publications')}${igStat(c.fol,'abonnés')}${igStat(c.ing,'abonnements')}</div></div>
 <div class="ig-id"><b>${esc(isNpc(id)?fullNameOf(id):nameOf(id))}</b><span class="muted">${handleOf(id)}${them?' · <span class="ig-chip">Te suit</span>':ig.reqs.includes(id)?' · <span class="ig-chip">Demande envoyée</span>':''}</span><p class="ig-bio">${fmtText(BIO[id]||'')}</p></div>
 <div class="row" style="justify-content:flex-start"><button class="gbtn ${f?'ghost':''}" type="button" data-follow="${id}">${f?'Abonné·e ✓':them?"S'abonner en retour":"S'abonner"}</button>${isNpc(id)?`<button class="gbtn ghost" type="button" data-chat="${id}">Message</button><button class="gbtn ghost" type="button" data-fiche="${id}">Fiche</button>`:''}</div>
 ${igGrid(G.posts.filter(p=>p.by===id))}`.replace('Abonné·e ✓',P('Abonné·e ✓')),true);
}
/* clics communs au fil, à l'onglet Insta et aux fiches */
function igClick(t){let b;
 if(b=t.closest('[data-follow]')){const id=b.dataset.follow;igFollow(id);if(!$('sheet').hidden&&$('sheetBody').querySelector('.ig-top'))openInsta(id);if(view==='insta')drawView();return true}
 if(b=t.closest('[data-req]')){igRequest(b.dataset.req,b.dataset.ok==='1');if(view==='insta')drawView();return true}
 if(b=t.closest('[data-ig]')){openInsta(b.dataset.ig);return true}
 if(b=t.closest('[data-igpost]')){cm=null;openComments(b.dataset.igpost);return true}
 if(t.closest('[data-igcompose]')){openCompose('post');return true}
 if(t.closest('[data-igpriv]')){const ig=G.ig;ig.priv=!ig.priv;if(!ig.priv&&ig.reqs.length){ig.reqs.slice().forEach(id=>igRequest(id,true))}saveG();toast(ig.priv?'🔒 Compte privé : les camarades devront te demander':'Compte public : tout le monde peut s\'abonner');drawNav();drawView();return true}
 if(t.closest('[data-igbio]')){openSheet(`${sheetHead('Ma bio Insta','150 caractères maximum')}<textarea id="igBioTxt" maxlength="150" style="min-height:90px">${esc(G.ig.bio||'')}</textarea><div class="row"><button class="gbtn" type="button" id="igBioSave">Enregistrer</button></div>`);return true}
 if(t.id==='igBioSave'){G.ig.bio=$('igBioTxt').value.trim();saveG();closeSheet();drawView();toast('Bio mise à jour');return true}
 return false}

/* ---------- vues ---------- */
const NAV=[
 ['home','Accueil','<path d="M3 11l9-8 9 8v9a1 1 0 0 1-1 1h-5v-6h-6v6H4a1 1 0 0 1-1-1z" fill="currentColor"/>'],
 ['day','Journée','<circle cx="12" cy="12" r="9.5" fill="none" stroke="currentColor" stroke-width="2.4"/><path d="M12 6.5V12l3.8 2.4" fill="none" stroke="currentColor" stroke-width="2.4" stroke-linecap="round"/>'],
 ['messages','Messages','<path d="M12 3a9 9 0 0 0-7.8 13.5L3 21l4.6-1.2A9 9 0 1 0 12 3z" fill="currentColor"/><circle cx="8" cy="12" r="1.4" fill="#16171c"/><circle cx="12" cy="12" r="1.4" fill="#16171c"/><circle cx="16" cy="12" r="1.4" fill="#16171c"/>'],
 ['mates','Camarades','<circle cx="8.5" cy="8" r="3.6" fill="currentColor"/><circle cx="16.5" cy="9" r="3" fill="currentColor"/><path d="M1.5 20c.6-4 3.4-6.3 7-6.3s6.4 2.3 7 6.3z" fill="currentColor"/><path d="M16.5 13.5c3 0 5.3 2 5.8 5.5h-5.2" fill="currentColor"/>'],
 ['insta','Insta','<rect x="3" y="3" width="18" height="18" rx="5.5" fill="none" stroke="currentColor" stroke-width="2.2"/><circle cx="12" cy="12" r="4.2" fill="none" stroke="currentColor" stroke-width="2.2"/><circle cx="17.4" cy="6.6" r="1.3" fill="currentColor"/>'],
 ['profil','Profil','<circle cx="12" cy="8" r="4.5" fill="currentColor"/><path d="M3.5 21c.8-4.4 4.2-7 8.5-7s7.7 2.6 8.5 7z" fill="currentColor"/>']];
function drawNav(){
 const unreadM=Object.values(G.unreadMsg).reduce((a,b)=>a+b,0);
 $('gNav').innerHTML=NAV.map(([id,lb,ic])=>`<button type="button" data-v="${id}" aria-label="${lb}" ${view===id?'aria-current="page"':''}><svg viewBox="0 0 24 24">${ic}</svg><small>${lb}</small>${id==='messages'&&unreadM?`<span class="badge">${unreadM}</span>`:''}${id==='insta'&&G.ig.reqs.length?`<span class="badge">${G.ig.reqs.length}</span>`:''}${id==='profil'&&G.unread?'<span class="dot"></span>':''}</button>`).join('');
}
function knowBars(only){return `<div class="kb">${(only||Object.keys(SUBJ)).map(k=>{const v=G.know[k],c=v>=60?'#3fcf8e':v>=45?'#ffd23f':'#ff7a6b';return `<div class="gg"><span>${SUBJ[k]}</span><div class="bar"><i style="width:${v}%;background:${c}"></i></div><b>${v}%</b></div>`}).join('')}</div>`}
function nextEvalTxt(){const sd=sdDone(G.day);if(sd>=TRI_END[2])return null;const wd=weekday();if(wd===4&&G.min<1020)return G.min<840?"aujourd'hui à 14h":'en cours';return 'vendredi à 14h'}
function schoolCard(){
 const sd=Math.min(sdDone(G.day),YEAR_DAYS),t=curTri(),ta=triAvg(t),left=BAC_DAYS[0]-sd,ne=nextEvalTxt(),r=G.bac.result;
 return `<div class="card"><div class="ph-top"><span class="eyebrow">Terminale · trimestre ${t}</span><span class="muted">jour ${sd}/${YEAR_DAYS}</span></div>
 <p class="muted">${r?P(`Bac : ${r.ok?'admis·e':'non admis·e'} (${fmtG(r.fin)}/20)`):left>0?`Bac dans ${left} jour${left>1?'s':''} de cours`:'Bac en cours'}${ne?` · prochaine évaluation ${ne}`:''} · moyenne du trimestre ${fmtG(ta)}/20</p></div>`}
function ttHTML(){
 const wd=weekday(),sd=schoolDay(G.day);
 if(sd===null)return `<p class="muted">Pas de cours ${dayLbl(G.day)?'('+dayLbl(G.day).toLowerCase()+')':'le week-end'}. Profite de ton temps libre pour réviser.</p>`;
 if(sd>YEAR_DAYS||sd===REV_DAY||RES_DAYS.includes(sd))return `<p class="muted">${sd===REV_DAY?'Journée banalisée pour réviser le bac.':sd>YEAR_DAYS?"L'année est terminée.":'Pas de cours : résultats du bac.'}</p>`;
 const row=(st,lb,sm,now)=>`<div class="${now?'now':''}"><span>${fmtT(st)}</span><b>${lb}</b>${sm?`<small>${sm}</small>`:''}</div>`,m=G.min;
 if(BAC_DAYS.includes(sd)){const e=BAC_EP[sd];return `<div class="tt">${row(480,'Bac : '+e.am.map(k=>SUBJ[k]).join(', '),'',m>=480&&m<720)}${row(720,'Pause déjeuner','',m>=720&&m<840)}${row(840,'Bac : '+e.pm.map(k=>SUBJ[k]).join(', '),'',m>=840&&m<1020)}</div>`}
 return `<div class="tt">${SLOTS.filter(s=>(s[2]==='cours'||s[2]==='dej'||s[2]==='recre')&&!(wd===4&&s[0]>=840&&s[0]<1020)).map(s=>row(s[0],s[2]==='cours'?SUBJ[TT[wd][s[3]]]:PLABEL[s[2]],s[2]==='cours'?PROFS[TT[wd][s[3]]][0]:'',m>=s[0]&&m<s[1])).join('')}${wd===4?row(840,'Évaluation commune','Toutes les matières',m>=840&&m<1020):''}</div>`}
function objectivesCard(){
 const open=OBJ.filter(o=>objOk(o)&&o.day<=G.day&&!G.objDone.includes(o.id)).slice(0,3);
 return `<div class="card"><div class="ph-top"><span class="eyebrow">Objectifs · niveau ${G.objDone.length}</span><span class="muted">${G.objDone.length}/${OBJ.filter(objOk).length}</span></div>
 ${open.length?`<div class="objs">${open.map(o=>`<div class="obj"><span class="chk"></span><span>${P(o.t)}</span>${GEMS_ON?`<b>+${o.gems}</b>`:''}</div>`).join('')}</div>`:`<p class="muted">Tous les objectifs du moment sont atteints. De nouveaux arrivent dans les prochains jours.</p>`}</div>`;
}
const ACTS={
 notes:{l:'Prendre des notes',e:4,risk:0,ico:'✏️'},exo:{l:"Faire l'exercice",e:3,risk:0,ico:'🧩'},main:{l:'Lever la main',e:3,risk:0,ico:'🙋'},voisin:{l:'Parler à ton voisin',e:2,risk:.12,ico:'💬'},
 mot:{l:'Écrire en cachette',e:2,risk:.15,ico:'📝'},dessin:{l:'Dessiner',e:0,risk:.06,ico:'🎨'},dormir:{l:'Dormir',e:0,risk:.18,ico:'😴'}};
const riskLbl=(r,s)=>{const x=r*s;return x===0?['Sans risque','ok']:x<.2?['Risque faible','lo']:x<.4?['Risque moyen','mid']:['Risque élevé','hi']};
function drawDay(){
 const ph=phase(),v=$('gView');
 const pct=clamp((G.min-ph.start)/(ph.end-ph.start),0,1)*100;
 const ft=fetesOpen();let h=(ft.length?`<div class="card"><span class="eyebrow">Aujourd'hui au lycée</span>${ft.map(f=>`<div class="prof"><b>${f.ic} ${f.n}</b><button class="gbtn" type="button" data-fetesheet="${f.id}">Participer</button></div>`).join('')}</div>`:'')+schoolCard()+(schoolDay(G.day)&&G.min<1020&&phase().type!=='cours'?`<div class="card"><span class="eyebrow">Ta place en classe aujourd'hui</span><div class="prof"><span>${seatToday()?'À côté de <b>'+WHO[seatToday()].name+'</b>':'Pas encore choisie : ce sera au hasard'}</span><button class="gbtn ${seatToday()?'ghost':''}" type="button" data-seatopen>${seatToday()?'Changer':'Choisir'}</button></div></div>`:'')+(()=>{const u=upcoming(3);return u.length?`<div class="card"><span class="eyebrow">À venir au lycée</span>${u.map(([d,t])=>`<div class="prof"><span>${t}</span><span class="muted">${fmtDay(d)}</span></div>`).join('')}</div>`:''})()+objectivesCard();
 h+=clubCard();h+=tutorCard();
 h+=`<div class="card phase"><div class="ph-top"><span class="eyebrow">${ph.lbl||PLABEL[ph.type]}${ph.sub?' · '+SUBJ[ph.sub]:''}</span><span class="muted">${fmtT(ph.start)} – ${fmtT(ph.end%1440)}</span></div><div class="bar"><i id="phBar" style="width:${pct}%"></i></div>`;
 if(ph.type==='cours'){
  const [prof,s]=ph.prof,nb=neighborOf(ph);
  h+=`<div class="prof"><div><b>${prof}</b><span class="muted"> · ${gtxt(SEV[s],profSex(prof))}</span></div><span class="sev">${'●'.repeat(s)}<i>${'●'.repeat(3-s)}</i></span></div>
  <p class="muted">À côté de toi : <b style="color:var(--g-ink)">${WHO[nb].name}</b>${seatToday()?'':' (au hasard)'} <button class="linkbtn" type="button" data-seatopen>Changer de place</button> · Actions restantes : ${G.acts}/3 · Chances de réussite en ${SUBJ[ph.sub]} : ${G.know[ph.sub]} %</p>
  <div class="acts">${Object.entries(ACTS).map(([k,a])=>{const [rl,rc]=riskLbl(a.risk,s);return `<button class="act" type="button" data-ca="${k}" ${G.acts<=0?'disabled':''}><span class="ico">${a.ico}</span><span>${a.l}</span><small class="r-${rc}">${rl}</small></button>`}).join('')}</div></div>`;
 }else if(['recre','dej','matin','weekend'].includes(ph.type)){
  if(G.placeKey!==ph.key){G.place=placesFor(ph.type)[0];G.placeKey=ph.key}
  const map=presence(ph),pls=placesFor(ph.type);
  h+=`<div class="chips">${pls.map(p=>`<button class="chip" type="button" data-place="${p}" aria-pressed="${G.place===p}">${PLACES[p]}</button>`).join('')}</div>`;
  h+=placeBody(ph,G.place,map)+'</div>';
 }else if(ph.type==='eval'){
  h+=`<p class="story-text">Évaluation commune : toutes les matières sont évaluées. Tes notes dépendent de tes chances de réussite dans chaque matière. Résultats à 17h.</p>${G.evalBonus[G.day]?'<p class="muted">✍️ Copie rendue : tes réponses compteront dans les notes.</p>':'<div class="row"><button class="gbtn" type="button" data-evalgame>✍️ Composer (une question par matière)</button></div>'}${knowBars()}</div>`;
 }else if(ph.type==='bac'){
  h+=`<p class="story-text">Épreuves du bac : ${ph.subs.map(k=>SUBJ[k]).join(', ')}. Concentre-toi, les résultats tomberont le ${fmtDay(schoolDayToCal(RES_DAYS[0]),true)}.</p><div class="acts two">${ph.subs.map(k=>`<button class="act" type="button" data-bacgame="${k}" ${G.bac.bonus[k]!=null?'disabled':''}><span class="ico">🎓</span><span>${SUBJ[k]}</span><small class="r-ok">${G.bac.bonus[k]!=null?'Épreuve passée':'Passer l\'épreuve'}</small></button>`).join('')}</div>${knowBars(ph.subs)}</div>`;
 }else if(ph.type==='soir'){
  h+=placeBody(ph,'maison',{})+'</div>';
 }else{
  h+=`<p class="story-text">Il est tard. Dors pour récupérer ton énergie avant ${weekday()>=5?'la journée':'les cours'} de demain.</p><div class="row"><button class="gbtn" type="button" data-do="sleep">Dormir jusqu'à 7h</button></div></div>`;
 }
 const plans=G.plans.filter(p=>p.status==='accepted');
 if(plans.length)h+=`<div class="card"><span class="eyebrow">Sorties prévues</span>${plans.map(p=>`<div class="relrow"><div class="av">${avatarOf(p.by)}</div><div class="info"><b>${esc(p.fam?'En famille':nameOf(p.by))}</b><span class="muted">${PLACE_OUT[p.place]} ${planWhen(p)}</span></div></div>`).join('')}</div>`;
 h+=`<div class="card"><span class="eyebrow">Emploi du temps · ${DAYS[weekday()]}</span>${ttHTML()}</div>`;
 v.innerHTML=h;
}
function clubCard(){const L=myClubs();if(!L.length)return `<div class="card"><span class="eyebrow">Clubs</span><div class="prof"><span class="muted">Théâtre, foot, journal du lycée… rejoins un club pour rencontrer du monde.</span><button class="gbtn" type="button" data-clubs>Voir</button></div></div>`;
 const evening=G.min>=1020&&G.min<1320;
 return `<div class="card"><span class="eyebrow">Tes clubs <button class="linkbtn" type="button" data-clubs>gérer</button></span>${L.map(k=>{const c=CLUBS[k],today=clubToday().includes(k),done=G.done[G.day+'club'+k];
  return `<div class="prof"><span>${c.ic} <b>${c.n}</b> <small class="muted">${(G.clubXP[k]||0)} séance${(G.clubXP[k]||0)>1?'s':''} · ${DAYS[c.wd].toLowerCase()} soir</small></span>${today&&!done?(evening?`<button class="gbtn" type="button" data-clubgo="${k}">Y aller</button>`:G.min<1020?'<small class="muted">ce soir</small>':'<small class="muted">trop tard</small>'):done?'<small class="muted">fait ✅</small>':''}</div>`}).join('')}</div>`}
function placeBody(ph,place,map){
 let h='';
 if(place==='maison'){
  const fam=G.family;
  h+=`<p class="muted">${ph.type==='soir'?P('Tu es rentré·e à la maison.'):'Tu es à la maison.'}</p>
  ${fam.length?`<div class="present">${fam.map(f=>`<button class="pers" type="button" data-fam="${f.id}"><span class="av">${avatarOf(f.id)}</span><span>${esc(f.name)}</span><small>${f.role}</small></button>`).join('')}</div>`:''}
  <div class="acts two"><button class="act" type="button" data-do="revise"><span class="ico">📚</span><span>Réviser</span><small class="r-ok">−6 énergie</small></button>
  <button class="act" type="button" data-do="rest" ${G.rested?'disabled':''}><span class="ico">🛋️</span><span>Se reposer</span><small class="r-ok">+15 énergie</small></button>
  ${G.min>=1260||ph.type==='nuit'?`<button class="act" type="button" data-do="sleep"><span class="ico">🌙</span><span>Dormir</span><small class="r-ok">jusqu'à 7h</small></button>`:''}</div>`;
  return h;
 }
 const ids=map[place]||[];
 if(place==='cantine')h+=`<div class="acts two"><button class="act" type="button" data-do="eat" ${G.ate?'disabled':''}><span class="ico">🍛</span><span>Manger</span><small class="r-ok">+15 énergie</small></button></div>`;
 if(place==='cdi')h+=`<div class="acts two"><button class="act" type="button" data-do="revise"><span class="ico">📚</span><span>Réviser au calme</span><small class="r-ok">−4 énergie</small></button></div>`;
 h+=ids.length?`<p class="muted">Présents ici :</p><div class="present">${ids.map(id=>{const c=coupleOf(id);return `<button class="pers" type="button" data-person="${id}"><span class="av">${avatarOf(id)}</span><span>${WHO[id].name}</span><small>${c&&c!=='me'&&ids.includes(c)?'avec '+WHO[c].name:G.rel[id].ami>=65?S(id,'ami·e'):''}</small></button>`}).join('')}</div>`:`<p class="muted">Personne ici pour l'instant.</p>`;
 return h;
}
function drawMates(){
 $('gView').innerHTML=`<div class="sec-title">Groupes</div>${groupsHTML()}<div class="sec-title">Camarades</div><div class="list">${NPCS.map(n=>`<button class="card mate" type="button" data-mate="${n.id}"><div class="relrow"><div class="av">${avatarOf(n.id)}</div><div class="info"><div class="top"><span>${esc(fullNameOf(n.id))}</span><small>${statusOf(n.id)}</small></div>${gaugesHTML(n.id)}<span class="muted">${esc(ressentiShort(n.id))}</span></div></div></button>`).join('')}</div>
 <div class="sec-title">Professeurs</div><div class="card list">${Object.entries(PROFS).map(([k,[n,s]])=>`<div class="prof"><div><b>${n}</b><span class="muted"> · ${SUBJ[k]}</span></div><span class="sev" title="${SEV[s]}">${'●'.repeat(s)}<i>${'●'.repeat(3-s)}</i></span></div>`).join('')}</div>`;
}
function drawMessages(){
 const ids=[...NPCS.map(n=>n.id),...G.family.map(f=>f.id)];
 ids.sort((a,b)=>((G.threads[b]||[]).slice(-1)[0]?.at??-1)-((G.threads[a]||[]).slice(-1)[0]?.at??-1));
 $('gView').innerHTML=`<div class="sec-title">Messages</div><p class="muted">${SAMPLE?'Tes camarades et ta famille te répondent avec leur propre personnalité.':'Les réponses utilisent la personnalité de chacun.'}</p><div class="list">${ids.map(id=>{const last=(G.threads[id]||[]).slice(-1)[0],u=G.unreadMsg[id]||0;
  return `<button class="card thread" type="button" data-chat="${id}"><div class="relrow"><div class="av">${avatarOf(id)}</div><div class="info"><div class="top"><span>${esc(nameOf(id))}</span><small>${last?last.tm:isFam(id)?famById(id).role:''}</small></div><span class="muted prev">${last?(last.from==='me'?'Toi : ':'')+esc(last.text):'Commencer une conversation'}</span></div>${u?`<span class="badge">${u}</span>`:''}</div></button>`}).join('')}</div>`;
}
function drawProfile(){
 const a=avg(),bySub={};G.grades.forEach(g=>(bySub[g.sub]=bySub[g.sub]||[]).push(g.v));
 G.unread=0;
 $('gView').innerHTML=`<div class="sec-title">${esc(fullName(me())||'Moi')} <span class="muted" style="font-size:15px">${myHandle()}</span></div>
 <div class="card" style="flex-direction:row;align-items:center;flex-wrap:wrap"><div class="full-av sm">${render(me(),FVB,uid(),true)}</div>
  <div style="display:flex;flex-direction:column;gap:6px;flex:1;min-width:160px"><p class="muted">${SEXC[me().sexe]} · ${oriLabel(me().orient,me().sexe)}</p><p class="muted">Niveau ${G.objDone.length} · Jour ${G.day} · ${G.partner?'En couple avec '+WHO[G.partner].name+' 💞':'Célibataire'}</p>
  <div class="gg"><span>Énergie</span><div class="bar"><i style="width:${G.energy}%;background:#ffd23f"></i></div><b>${G.energy}</b></div>
  <div class="gg"><span>Notes</span><div class="bar"><i style="width:${(a||0)*5}%;background:#3fcf8e"></i></div><b>${fmtG(a)}</b></div>
  <div class="row" style="justify-content:flex-start;flex-wrap:wrap"><button class="gbtn ghost" type="button" id="gEdit">Modifier mon avatar</button><button class="gbtn ghost" type="button" id="gFam">Modifier ma famille</button>${window.CLOUD?'<button class="gbtn ghost" type="button" id="gCompte">Mon compte</button>':''}<button class="gbtn ghost" type="button" id="gRestart">Recommencer la partie</button><button class="gbtn ghost" type="button" id="gMaj">🔄 Mettre à jour l'appli</button></div><p class="muted" style="margin:0">Version ${APP_VERSION}</p></div></div>
 <div class="sec-title">Ma famille${me().nom?' · '+esc(me().nom):''}</div><div class="card list">${G.family.length?G.family.map(f=>`<div class="relrow"><div class="av">${avatarOf(f.id)}</div><div class="info"><div class="top"><span>${esc(f.name)}</span><small>${f.role} · ${S(f.id,f.trait)}</small></div><div class="gg"><span>Complicité</span><div class="bar"><i style="width:${G.famRel[f.id]}%;background:#ff9f5a"></i></div><b>${G.famRel[f.id]}</b></div></div><button class="gbtn ghost" type="button" data-chat="${f.id}">Écrire</button></div>`).join(''):'<p class="muted">Aucun membre de famille.</p>'}</div>
 <div class="sec-title">Chances de réussite à l'examen</div><div class="card">${knowBars()}<p class="muted">Révise pendant ton temps libre (maison, CDI, week-end) et prends des notes en cours pour les faire monter. Une matière que tu ne travailles pas baisse un peu chaque jour.</p></div>
 <div class="sec-title">Évaluations du vendredi</div><div class="card list">${G.evals.length?G.evals.slice(-6).reverse().map(e=>`<button class="prof linkrow" type="button" data-evsd="${e.sd}"><span>Jour ${e.sd} · trimestre ${e.tri}</span><b>${fmtG(e.glob)}/20 ›</b></button>`).join(''):'<p class="muted">Pas encore d\'évaluation. La première a lieu vendredi à 14h.</p>'}</div>
 <div class="sec-title">Bulletins</div><div class="card list">${[1,2,3].map(t=>{const b=G.bulletins.find(x=>x.tri===t);return b?`<button class="prof linkrow" type="button" data-bul="${t}"><span>Trimestre ${t}</span><b>${fmtG(b.avg)}/20 ${b.ok?'✅':'❌'} ›</b></button>`:`<div class="prof"><span>Trimestre ${t}</span><span class="muted">${t===curTri()?'en cours · '+fmtG(triAvg(t))+'/20':'à venir'}</span></div>`}).join('')}
 <div class="prof"><span>Bac</span>${G.bac.result?`<button class="linkrow" type="button" data-bacres="1"><b>${fmtG(G.bac.result.fin)}/20 ${G.bac.result.ok?'✅':'❌'} ›</b></button>`:`<span class="muted">${BAC_DAYS.map(x=>fmtDay(schoolDayToCal(x))).join(' et ')}</span>`}</div></div>
 <div class="sec-title">Objectifs réussis</div><div class="card">${G.objDone.length?`<div class="objs">${G.objDone.map(id=>OBJ.find(o=>o.id===id)).map(o=>`<div class="obj done"><span class="chk">✓</span><span>${o.t}</span></div>`).join('')}</div>`:'<p class="muted">Aucun pour l\'instant.</p>'}</div>
 <div class="sec-title">Notifications</div>${G.log.length?`<div class="list">${G.log.slice().reverse().slice(0,40).map(l=>`<div class="card"><p style="margin:0">${esc(l.t)}</p><p class="muted">Jour ${l.day}${l.at?' · '+l.at:''}</p></div>`).join('')}</div>`:'<p class="muted">Rien pour l\'instant.</p>'}`;
 drawNav();saveG();
}
function drawView(){
 $('gStories').hidden=view!=='home';$('gFabs').hidden=view!=='home';
 if(view==='home'){const n=G.feedN||30;$('gView').innerHTML=G.posts.slice(0,n).map(postHTML).join('')+(G.posts.length>n?`<div class="row" style="justify-content:center;margin:14px 0"><button class="gbtn ghost" type="button" data-feedmore>Voir les posts plus anciens</button></div>`:'')}
 else if(view==='insta')drawInsta();
 else if(view==='day')drawDay();else if(view==='messages')drawMessages();else if(view==='mates')drawMates();else drawProfile();
}
function drawGame(){drawHUD();drawStories();drawNav();drawView()}

/* ---------- fiches et interactions ---------- */
function openSheet(html,full){$('sheetBody').className='sheet'+(full?' full':'');$('sheetBody').innerHTML=html;$('sheet').hidden=false;$('sheetBody').scrollTop=0}
function closeSheet(){$('sheetBody').onclick=null;clearTimeout(svTimer);miniStop();const wasStory=!!sv;sv=null;cm=null;chat=null;talk=null;$('sheet').hidden=true;if(wasStory)drawStories();if(!$('game').hidden){drawNav();if(view==='messages'||view==='mates'||view==='day')drawView()}}
$('sheet').addEventListener('click',e=>{if(e.target.id==='sheet'||e.target.closest('[data-close]'))closeSheet()});

function openFiche(id){
 const f=FICHES[id],n=WHO[id];
 const rels=NPCS.filter(x=>x.id!==id).map(x=>{const l=link(id,x.id),c=coupleOf(id)===x.id;return `<div class="prof"><span>${x.name}</span><span class="muted">${c?'en couple 💞':l.ami>=75?'très proches':l.ami>=55?'amis':l.ami>=35?'se connaissent':'en froid'}${!c&&l.amour>=60?' · semble attiré·e':''}</span></div>`}).join('');
 openSheet(`<div class="row" style="justify-content:flex-end"><button class="gbtn ghost" type="button" data-close aria-label="Fermer">✕</button></div>
 <div class="full-av">${render(avOf(id),FVB,uid(),true)}</div><h2 style="text-align:center">${esc(fullNameOf(id))}, ${f.age} ans</h2><p class="muted" style="text-align:center">${n.handle} · ${statusOf(id)}</p>
 <div class="card felt"><span class="eyebrow">Ce que ${ilElle(id)} pense de toi</span><p style="margin:0">${esc(ressenti(id))}</p>${gaugesHTML(id)}</div>
 <dl class="fiche">${[['Passé',f.passe],['Famille',f.famille],['Qualités',f.qualites],['Défauts',f.defauts],['Peurs',f.peurs],['Passions',f.passions],['Façon de parler',f.parle],['Relations',f.relations],['Attirance',oriLabel(f.o,f.g)]].map(([k,v])=>`<dt>${k}</dt><dd>${esc(v)}</dd>`).join('')}</dl>
 <div class="card list"><span class="eyebrow">Ses liens en ce moment</span>${rels}</div>
 <div class="row"><button class="gbtn" type="button" data-chat="${id}">Envoyer un message</button></div>`,true);
}
const PACTS=[['parler','Discuter'],['compliment','Complimenter'],['blague','Faire une blague'],['taquiner','Taquiner'],['flirt','Flirter'],['sortie','Proposer une sortie']];
function openPerson(id){
 const ph=phase(),k=ph.key+id,acts=(G.place==='cantine'?[['asseoir',"S'asseoir avec "+(ilElle(id)==='il'?'lui':'elle')],...PACTS]:PACTS).filter(x=>x[0]!=='flirt'||iLike(id));
 openSheet(`<div class="who"><div class="av">${avatarOf(id)}</div><div style="flex:1;min-width:0"><h2>${WHO[id].name}</h2><p class="muted" style="margin:2px 0 0">${PLACES[G.place]||'Au lycée'} · ${statusOf(id)}</p></div><button class="gbtn ghost" type="button" data-close aria-label="Fermer">✕</button></div>
 <p class="muted" style="margin:0">${esc(ressentiShort(id))}</p>${gaugesHTML(id)}
 <div class="acts">${acts.map(([a,l])=>`<button class="act" type="button" data-pa="${a}" data-id="${id}" ${G.done[k+a]?'disabled':''}><span>${l}</span></button>`).join('')}</div>
 ${romHTML(id)}
 <p class="story-text" id="paOut"></p>
 <div class="row"><button class="gbtn ghost" type="button" data-fiche="${id}">Voir sa fiche</button></div>`);
}
function personAct(id,a){
 const ph=phase(),k=ph.key+id,r=G.rel[id],f=FICHES[id],V=VOICE[id];
 if(a==='parler'){if(!G.done[k+'talk']){G.done[k+'talk']=1;G.st.talks++}closeSheet();openTalk(id);return}
 if(G.energy<2){toast(P('Trop fatigué·e : va manger ou te reposer'));return}
 G.done[k+a]=1;G.energy=clamp(G.energy-2,0,100);if(!G.done[k+'talk']){G.done[k+'talk']=1;G.st.talks++}
 let da=0,dl=0,line;
 if(a==='asseoir'){da=4;G.st.lunchWith++;line=pickR(V.happy)}
 else if(a==='compliment'){if(r.ami<30){da=1;line=pickR(V.neutral)}else{da=3;dl=Math.round(2*f.rom+1);line=pickR(V.happy)}}
 else if(a==='blague'){da=f.hum>.5?4:1;line=f.hum>.5?pickR(V.happy):pickR(V.neutral)}
 else if(a==='taquiner'){if(r.ami>=55){da=3;line=pickR(V.happy)}else{da=-3;line=pickR(V.hurt)}}
 else if(a==='flirt'){const taken=coupleOf(id)&&coupleOf(id)!=='me';
  if(!npcLikesMe(id)){da=0;dl=0;line=pickR(["T'es adorable, mais je ne te vois pas comme ça 😅","Haha… on reste potes, ok ?","Je t'apprécie beaucoup, mais en ami·e."])}
  else if(r.ami>=40&&!taken){dl=Math.round(4+f.rom*6);da=1;line=pickR(V.happy)}else{dl=-1;da=-3;line=pickR(V.hurt)+(taken?' (et je suis déjà avec quelqu\'un)':'')}
  if(G.partner&&G.partner!==id){const map=presence(ph);if((map[G.place]||[]).includes(G.partner)){relChange(G.partner,-4,-10);pushMsg(G.partner,'them',"J'ai tout vu. Sympa… 😒");note(P(`${WHO[G.partner].name} t'a vu·e flirter avec ${WHO[id].name}`))}}}
 else if(a==='sortie'){const p=(r.ami-30)/60+r.amour/200;
  if(Math.random()<p&&!G.plans.some(x=>x.by===id&&x.status==='accepted')){const pl=makePlan(id,ph.type==='weekend'||G.min<16*60?'ce soir':'demain');pl.status='accepted';line=`Ok, ${PLACE_OUT[pl.place]} ${planWhen(pl)} !`;da=2;note(`${WHO[id].name} a accepté une sortie ${PLACE_OUT[pl.place]} ${planWhen(pl)}`)}
  else{line=pickR(["Désolé·e, je ne peux pas…","Une autre fois peut-être","Hmm… pas cette fois"]);da=-1}}
 const ch=relChange(id,da,dl);
 $('paOut').innerHTML=`<b>${WHO[id].name} :</b> « ${esc(genderize(line,id))} »${ch?`<br><small class="muted">${esc(ch)}</small>`:''}`;
 document.querySelectorAll(`[data-pa="${a}"]`).forEach(b=>b.disabled=true);
 note(`${PACTS.concat([['asseoir',"Repas"]]).find(x=>x[0]===a)[1]} avec ${WHO[id].name}${ch?' : '+ch.split(' : ')[1]:''}`);
 checkObjectives();saveG();drawHUD();
}
/* ---------- romance : regards, mots doux, cadeaux, rendez-vous amoureux, déclaration ---------- */
const takenBy=id=>{const c=coupleOf(id);return c&&c!=='me'?c:null};
function seenFlirt(id){if(!G.partner||G.partner===id)return '';const map=presence(phase());if(!(map[G.place]||[]).includes(G.partner))return '';
 relChange(G.partner,-4,-10);pushMsg(G.partner,'them',pickR(["J'ai tout vu. Sympa… 😒","Sérieux ?? Devant moi ?","On en parle plus tard."]));const m=P(`${WHO[G.partner].name} t'a vu·e faire les yeux doux à ${WHO[id].name}`);note(m);return ' · '+m}
function romActs(id){return G.partner===id?[['calin','Faire un câlin 🤗'],['main','Lui prendre la main 🤝'],['bisou','Faire un bisou 😘'],['cadeau','Offrir un cadeau 🎁'],['rdv','Proposer un rendez-vous 💘']]
 :[['regard','Lancer un regard complice 👀'],['mot','Glisser un mot doux 💌'],['main','Lui frôler la main 🤭'],['cadeau','Offrir un cadeau romantique 🎁'],['rdv','Proposer un rendez-vous amoureux 💘'],['declarer','Déclarer tes sentiments ❤️']]}
function romHTML(id){if(!(iLike(id)||G.partner===id))return '';const k=phase().key+id;
 return `<span class="eyebrow">💘 Romance</span><div class="acts">${romActs(id).map(([a,l])=>{const off=a==='cadeau'?G.done[G.day+'gift'+id]:a==='rdv'?G.done[G.day+'rdv'+id]:a==='declarer'?G.done[G.day+'decl'+id]:G.done[k+'ro'+a];return `<button class="act" type="button" data-ro="${a}" data-id="${id}" ${off?'disabled':''}><span>${l}</span></button>`}).join('')}</div>`}
function romOut(id,line,ch,extra){const o=$('paOut');if(o)o.innerHTML=`<b>${WHO[id].name} :</b> « ${esc(genderize(line,id))} »${ch||extra?`<br><small class="muted">${esc([ch,extra].filter(Boolean).join(' · '))}</small>`:''}`}
function declareTo(id){const r=G.rel[id],t=takenBy(id);G.done[G.day+'decl'+id]=1;G.confessed=G.confessed||{};G.confessed[id]=1;
 if(t)return {line:`Je suis touché·e… mais je suis avec ${WHO[t].name}. Je suis désolé·e.`,ch:relChange(id,-1,-3)};
 if(npcLikesMe(id)&&r.amour>=50&&r.ami>=35){let ex='';if(G.partner&&G.partner!==id){const old=G.partner;ex=relChange(old,-10,-40);pushMsg(old,'them',"J'ai appris pour toi et "+WHO[id].name+"… c'est fini entre nous. 💔");note(`Tu as quitté ${WHO[old].name}`)}
  G.partner=id;r.amour=Math.max(r.amour,85);G.posts.unshift(mkPost({by:'potins',text:`[Officiel] 💞 ${myHandle()} et ${WHO[id].handle}, c'est confirmé !`,c:50,r:800,l:21000}));note(`Tu es en couple avec ${WHO[id].name} 💞`);
  return {line:pickR(["Moi aussi… depuis longtemps 🥹❤️","Tu peux pas savoir comme j'attendais ça 💕","Oui. Mille fois oui ❤️"]),ch:joinFx([relChange(id,5,10),ex]),ok:1}}
 return {line:pickR(npcLikesMe(id)?["Je… j'ai besoin de te connaître un peu plus avant 😳","C'est trop tôt pour moi, laisse-moi un peu de temps 🙈"]:["Je t'apprécie beaucoup, mais seulement en ami·e…","Oh… je suis désolé·e, je ne ressens pas la même chose."]),ch:relChange(id,-2,npcLikesMe(id)?-3:-8)}}
function romAct(id,a){const ph=phase(),k=ph.key+id,r=G.rel[id],f=FICHES[id],V=VOICE[id],t=takenBy(id),likes=npcLikesMe(id),mine=G.partner===id;
 if(a==='cadeau'){openSheet(giftSheet(id));return}
 if(a==='rdv'){openSheet(rdvSheet(id));return}
 if(G.energy<2){toast(P('Trop fatigué·e : va manger ou te reposer'));return}
 G.energy=clamp(G.energy-2,0,100);let da=0,dl=0,line;
 if(a==='declarer'){const d=declareTo(id);romOut(id,d.line,d.ch);if(d.ok)setTimeout(()=>openPerson(id),1600);checkObjectives();saveG();drawHUD();return}
 G.done[k+'ro'+a]=1;
 if(mine){if(a==='calin'){da=3;dl=4;line=pickR(["*se blottit contre toi* 🥹","J'avais besoin de ça 💕","Reste encore un peu…"])}
  else if(a==='main'){da=2;dl=4;line=pickR(["*serre ta main et sourit*","On marche comme ça jusqu'en cours ? 🥰","*entrelace ses doigts aux tiens*"])}
  else{da=2;dl=6;line=pickR(["*rougit* Pas devant tout le monde 🙈… encore un ?","😘❤️","T'es trop mignon·ne quand tu fais ça"]);if(Math.random()<.25)fPotins(`on a vu ${myHandle()} et ${WHO[id].handle} s'embrasser près des casiers 😳💞`)}}
 else if(a==='regard'){if(likes&&!t){da=1;dl=Math.round(2+f.rom*3);line=pickR(["*rougit et détourne les yeux* 🙈","*te rend ton sourire*","Pourquoi tu me regardes comme ça ? 😳"])}else{line=t?"*détourne le regard*":"*ne remarque rien et continue de parler*"}}
 else if(a==='mot'){if(likes&&!t&&r.amour>=10){da=1;dl=Math.round(4+f.rom*4);line=pickR(["J'ai trouvé ton mot… c'était toi ? 🥹","Ton petit mot m'a fait sourire toute la journée 💕","Je l'ai gardé dans ma trousse 🙈"])}
  else if(likes&&!t){dl=2;line="Un mot doux ? De toi ? 😳 Je… merci."}else{line=t?`C'est gentil, mais je suis avec ${WHO[t].name}…`:"Euh… merci ? 😅";da=t?-1:0}}
 else if(a==='main'){if(likes&&!t&&r.amour>=35){da=1;dl=Math.round(5+f.rom*4);line=pickR(["*ne retire pas sa main* 😳","*serre doucement ta main*","*sourit sans rien dire*"])}else{da=-2;dl=-2;line=pickR(["*retire sa main* Euh…","Qu'est-ce que tu fais ? 😅"])}}
 const ch=relChange(id,da,dl);romOut(id,line,ch,seenFlirt(id).replace(/^ · /,''));
 document.querySelectorAll(`[data-ro="${a}"]`).forEach(b=>b.disabled=true);note(`${romActs(id).find(x=>x[0]===a)[1]} · ${WHO[id].name}${ch?' : '+ch.split(' : ')[1]:''}`);checkObjectives();saveG();drawHUD()}
const giftsFor=id=>[{k:'hibiscus',n:"Une fleur d'hibiscus 🌺",g:0,dl:4,da:1},{k:'lettre',n:"Une lettre d'amour écrite à la main 💌",g:0,dl:8,da:0,need:30},{k:'choco',n:'Une boîte de chocolats 🍫',g:2,dl:6,da:2},
 {k:'peluche',n:'Une peluche 🧸',g:3,dl:7,da:2},{k:'fav',n:`Une surprise : ${FAV[id]?FAV[id].plat:'son plat préféré'} 😋`,g:3,dl:8,da:5},{k:'bracelet',n:'Un bracelet gravé à son prénom 📿',g:5,dl:12,da:3}];
function giftSheet(id,msg){const done=G.done[G.day+'gift'+id];
 return `<div class="who"><div class="av">${avatarOf(id)}</div><div style="flex:1;min-width:0"><h2>Offrir un cadeau</h2><p class="muted" style="margin:2px 0 0">à ${WHO[id].name}${gemTxt(` · tu as ${G.gems} gemmes`)}</p></div><button class="gbtn ghost" type="button" data-close aria-label="Fermer">✕</button></div>`
 +(msg?`<div class="card felt"><p style="margin:0">${msg}</p></div>`:'')
 +(done?`<p class="muted">Un cadeau par jour et par personne. Reviens demain 😉</p>`:`<div class="choices">${giftsFor(id).map(x=>`<button class="choice" type="button" data-gift="${x.k}" data-id="${id}" ${GEMS_ON&&x.g>G.gems?'disabled':''}>${esc(x.n)}${GEMS_ON?`<small class="t-pos">${x.g?x.g+' gemmes':'gratuit'}</small>`:''}</button>`).join('')}</div>`)
 +`<div class="row"><button class="gbtn ghost" type="button" data-pback="${id}">Retour</button></div>`}
function giveGift(id,gk){if(G.done[G.day+'gift'+id])return;const x=giftsFor(id).find(g=>g.k===gk);if(!x||GEMS_ON&&x.g>G.gems)return;const r=G.rel[id],t=takenBy(id),likes=npcLikesMe(id),mine=G.partner===id;
 if(GEMS_ON)G.gems-=x.g;G.done[G.day+'gift'+id]=1;let da=x.da,dl=x.dl,line;
 if(t){dl=0;da=Math.max(0,da-1);line=`C'est adorable… mais je suis avec ${WHO[t].name}, je ne peux pas accepter ça comme ça 😕`}
 else if(!likes){dl=0;da+=1;line=pickR(["Oh, merci ! C'est trop gentil… en ami·e, hein ? 😅","Trop mignon, merci 😊"])}
 else if(x.need&&r.amour<x.need&&!mine){dl=2;line="Une lettre d'amour ?? 😳 Je… je ne sais pas quoi dire. Je la garde."}
 else line=pickR(mine?["T'es le ou la meilleur·e 🥹❤️","Je vais le garder pour toujours 💕","Tu me gâtes trop…"]:["Pour moi ?? 🥹 Merci…","Je rougis là, arrête 🙈💕","Personne ne m'avait jamais offert ça…"]);
 if(gk==='fav'&&!t)line=`Mais comment tu savais que j'adore ${FAV[id]?FAV[id].plat:'ça'} ?? 😍`;
 const ch=relChange(id,da,dl),sf=seenFlirt(id);if(G.partner&&G.partner!==id&&!sf&&Math.random()<.3){fPotins(`${myHandle()} a offert un cadeau à ${WHO[id].handle}… et ce n'est pas son ou sa partenaire 👀`);jealous(id)}
 note(`Cadeau pour ${WHO[id].name} : ${x.n}${ch?' · '+ch.split(' : ')[1]:''}`);saveG();drawHUD();
 openSheet(giftSheet(id,`<b>${WHO[id].name} :</b> « ${esc(genderize(line,id))} »${ch?`<br><small class="muted">${esc(ch)}${GEMS_ON&&x.g?` · −${x.g} gemmes`:''}${esc(sf)}</small>`:''}`))}
const DATE_SPOTS={sainteanne:['Coucher de soleil à la plage de Sainte-Anne 🌅','plage'],glacier:['Une glace au glacier du Gosier 🍦','cantine'],cinema:['Une séance de cinéma 🍿','soiree'],resto:['Un dîner au restaurant créole 🕯️','soiree'],carbet:['Un pique-nique aux chutes du Carbet 🌿','plage']};
function rdvSheet(id,msg){const done=G.done[G.day+'rdv'+id];
 return `<div class="who"><div class="av">${avatarOf(id)}</div><div style="flex:1;min-width:0"><h2>Rendez-vous amoureux</h2><p class="muted" style="margin:2px 0 0">avec ${WHO[id].name} · amour ${G.rel[id].amour}</p></div><button class="gbtn ghost" type="button" data-close aria-label="Fermer">✕</button></div>`
 +(msg?`<div class="card felt"><p style="margin:0">${msg}</p></div>`:'')
 +(done?`<p class="muted">Tu as déjà proposé un rendez-vous aujourd'hui.</p>`:`<p class="story-text">Où veux-tu l'emmener ?</p><div class="choices">${Object.entries(DATE_SPOTS).map(([k,[n]])=>`<button class="choice" type="button" data-rdv="${k}" data-id="${id}">${esc(n)}</button>`).join('')}</div>`)
 +`<div class="row"><button class="gbtn ghost" type="button" data-pback="${id}">Retour</button></div>`}
function proposeDate(id,spot){if(G.done[G.day+'rdv'+id])return;G.done[G.day+'rdv'+id]=1;const r=G.rel[id],t=takenBy(id),mine=G.partner===id,ph=phase();
 const p=mine?.92:t||!npcLikesMe(id)?0:clamp((r.amour-10)/60+(r.ami-30)/120,.05,.95);let line,ch='';
 if(Math.random()<p&&!G.plans.some(x=>x.by===id&&x.status==='accepted')){
  let day=G.day,hour=18;if(ph.type!=='weekend'&&G.min>=16*60||G.min>=17*60+30){day=G.day+1;hour=wdOf(day)>=5||!schoolDay(day)?15:18}
  const pl={id:'pl'+Date.now()+Math.floor(Math.random()*999),by:id,day,hour,place:spot,status:'accepted',date:true};G.plans.push(pl);
  line=pickR(["Oui !! J'ai trop hâte 🥹💕","Un vrai rendez-vous ? Avec toi ? Oui 😳❤️","Carrément. Je mets ma plus belle tenue 😏"])+` · ${PLACE_OUT[spot]} ${planWhen(pl)}`;ch=relChange(id,1,3);note(`💘 Rendez-vous avec ${WHO[id].name} ${PLACE_OUT[spot]} ${planWhen(pl)}`);
  if(G.partner&&!mine)jealous(id)}
 else{line=t?`Je ne peux pas… je suis avec ${WHO[t].name}.`:!npcLikesMe(id)?pickR(["Un rendez-vous… en ami·e alors ? Non, désolé·e, je préfère pas 😅","Je t'adore, mais pas comme ça…"]):pickR(["C'est un peu tôt pour moi… 🙈","Pas cette fois, mais redemande-moi 😉","Je… je ne suis pas prêt·e"]);ch=relChange(id,-1,t||!npcLikesMe(id)?-4:-1)}
 saveG();drawHUD();openSheet(rdvSheet(id,`<b>${WHO[id].name} :</b> « ${esc(genderize(line,id))} »${ch?`<br><small class="muted">${esc(ch)}</small>`:''}`))}
const DATE_MOMENTS=[['d_main','Marcher main dans la main 🤝',3,8],['d_fleur',"Lui offrir une fleur d'hibiscus 🌺",2,7],['d_rire',"Rire ensemble jusqu'aux larmes 😂",5,4],['d_photo','Prendre une photo de couple 📸',3,5],['d_bisou','Tenter un bisou 😘',2,12],['d_declare','Lui avouer tes sentiments ❤️',0,0]];
function dateSheet(p,msg){const id=p.by,used=p.used||[],left=2-used.length,L=DATE_MOMENTS.filter(m=>!used.includes(m[0])&&!(m[0]==='d_declare'&&G.partner===id));
 return `<div class="who"><div class="av">${avatarOf(id)}</div><div><h2>💘 Rendez-vous ${PLACE_OUT[p.place]}</h2><p class="muted" style="margin:2px 0 0">avec ${WHO[id].name} · ${fmtT(G.min)}</p></div></div>`
 +(msg?`<div class="card felt"><p style="margin:0">${msg}</p></div>`:`<p class="story-text">${WHO[id].name} est arrivé·e en avance et t'attend avec un grand sourire. ${DATE_SPOTS[p.place][0]}… l'ambiance est parfaite.</p>`)
 +(left>0?`<span class="eyebrow">Que faites-vous ? · ${left} moment${left>1?'s':''}</span><div class="choices">${L.map(m=>`<button class="choice" type="button" data-out="${m[0]}" data-pl="${p.id}">${esc(m[1])}</button>`).join('')}</div>`:'')
 +`<div class="row"><button class="gbtn ${left>0?'ghost':''}" type="button" data-close>${left>0?'Rentrer':'Fin du rendez-vous 💕'}</button></div>`}
function dateMoment(p,k){const id=p.by,r=G.rel[id],m=DATE_MOMENTS.find(x=>x[0]===k);if(!m)return;p.used=p.used||[];if(p.used.length>=2||p.used.includes(k))return;
 if(!p.used.length){G.st.outings++;G.energy=clamp(G.energy-8,0,100);if(Math.random()<.4)fPotins(`${myHandle()} et ${WHO[id].handle} aperçus en amoureux ${PLACE_OUT[p.place]} 👀💘`)}
 p.used.push(k);let line,ch;
 if(k==='d_declare'){const d=declareTo(id);line=d.line;ch=d.ch}
 else if(k==='d_bisou'){if(G.partner===id||r.amour>=60){line=pickR(["*ferme les yeux* … 🥹❤️","Enfin… 😳💕","*sourit contre tes lèvres*"]);ch=relChange(id,m[2],m[3])}else{line=pickR(["*recule un peu* Doucement… 😅","Attends, c'est trop tôt 🙈"]);ch=relChange(id,-2,-5)}}
 else{line=pickR(VOICE[id].happy);ch=relChange(id,m[2],m[3]);
  if(k==='d_photo')G.posts.unshift(mkPost({by:id,text:pickR([`Meilleur rendez-vous ${PLACE_OUT[p.place]} 💕`,`Moi et ${myHandle()} 🥹`,'Soirée parfaite ✨💘']),photo:{scene:DATE_SPOTS[p.place][1],people:[id,'me'],author:id},c:8,r:40,l:900,comments:[npcComment(pickR(NPCS.filter(n=>n.id!==id)).id)]}))}
 note(`💘 Rendez-vous avec ${WHO[id].name} : ${(ch||'').split(' : ')[1]||'beau moment'}`);checkObjectives();saveG();drawHUD();
 openSheet(dateSheet(p,`${esc(m[1])}<br><b>${WHO[id].name} :</b> « ${esc(genderize(line,id))} »${ch?`<br><small class="muted">${esc(ch)}</small>`:''}`))}
function classAct(k){
 const ph=phase();if(ph.type!=='cours'||G.acts<=0)return;const A=ACTS[k],s=ph.prof[1],nb=neighborOf(ph);
 if(G.energy<A.e){toast("Pas assez d'énergie");return}
 if(k==='mot'){openNote(ph);return}
 if(k==='exo'){classGame(ph);return}
 G.acts--;G.energy=clamp(G.energy-A.e,0,100);
 let msg='';const caught=Math.random()<A.risk*s;
 if(k==='notes'){const g=gainK(ph.sub,7);G.know[ph.sub]=clamp(G.know[ph.sub]+g,0,100);G.cb+=1;G.st.notes++;msg=`Tu prends des notes. Chances de réussite en ${SUBJ[ph.sub]} +${g} %`}
 else if(k==='main'){const ok=Math.random()<.35+G.know[ph.sub]/150;if(ok){G.know[ph.sub]=clamp(G.know[ph.sub]+gainK(ph.sub,3),0,100);G.cb+=.5;msg=gtxt(`Bonne réponse ! ${ph.prof[0]} est content·e.`,profSex(ph.prof[0]))}else msg='Mauvaise réponse… quelques rires dans la classe.'}
 else if(k==='voisin'){if(caught)msg=punish(ph);else{const ch=relChange(nb,3);msg=`${WHO[nb].name} chuchote : « ${pickR(VOICE[nb].start)} » · ${ch}`}}
 else if(k==='dessin'){if(caught)msg=punish(ph);else{G.energy=clamp(G.energy+3,0,100);G.know[ph.sub]=clamp(G.know[ph.sub]-1,0,100);msg='Tu dessines dans la marge. Ça détend.'}}
 else if(k==='dormir'){if(caught)msg=punish(ph);else{G.energy=clamp(G.energy+15,0,100);G.cb-=1.5;msg='Petite sieste discrète… +15 énergie, mais tu as raté une partie du cours.'}}
 note(msg);toast(msg);checkObjectives();saveG();drawHUD();drawView();
}
function punish(ph){
 G.st.caughtToday=true;const [prof,s]=ph.prof;let msg;
 if(s===1)msg=`${prof} te fait une remarque devant toute la classe.`;
 else if(s===2){msg=`${prof} écrit un mot dans ton carnet !`;parentReact('carnet')}
 else{msg=`${prof} te met une heure de colle !`;G.energy=clamp(G.energy-10,0,100);parentReact('colle')}
 G.know[ph.sub]=clamp(G.know[ph.sub]-2,0,100);return '😬 '+msg;
}
function openNote(ph){
 openSheet(`<div class="who"><div style="flex:1"><h2>Écrire un mot en cachette</h2><p class="muted" style="margin:2px 0 0">${ph.prof[0]} est ${SEV[ph.prof[1]].toLowerCase()} : attention.</p></div><button class="gbtn ghost" type="button" data-close aria-label="Fermer">✕</button></div>
 <span class="muted">Pour qui ?</span><div class="chips">${NPCS.map((n,i)=>`<button class="chip" type="button" data-nto="${n.id}" aria-pressed="${i===0}">${n.name}</button>`).join('')}</div>
 <span class="muted">Quel genre de mot ?</span><div class="choices">${[['amical','Un mot amical 😊'],['drole','Un dessin drôle du prof 😂'],['romantique','Un mot doux 💌'],['ragot','Un ragot sur quelqu\'un 👀']].map(([k,l])=>`<button class="choice" type="button" data-ntone="${k}">${l}</button>`).join('')}</div>`);
 G._nto=NPCS[0].id;
}
function sendNote(tone){
 const ph=phase();if(ph.type!=='cours'){closeSheet();return}const to=G._nto,s=ph.prof[1],r=G.rel[to],f=FICHES[to];
 G.acts--;G.energy=clamp(G.energy-2,0,100);
 const caught=Math.random()<ACTS.mot.risk*s*(tone==='romantique'?1.2:1);let msg,da=0,dl=0;
 if(caught){msg=punish(ph)+` Le mot pour ${WHO[to].name} est lu à voix haute…`;
  if(tone==='romantique'){da=-2;dl=r.amour>=40?3:-3;G.posts.unshift(mkPost({by:'potins',text:`[Anonyme] : un mot doux de ${myHandle()} pour ${WHO[to].handle} lu devant TOUTE la classe 😭💌`,c:44,r:600,l:15000}))}
  else if(tone==='ragot'){da=-6}else da=-1;
 }else{
  if(tone==='amical'){da=4}else if(tone==='drole'){da=f.hum>.5?5:2}else if(tone==='romantique'){if(r.ami>=40){dl=Math.round(5+f.rom*5);da=1}else{dl=-2;da=-2}}else{da=r.ami>=50?3:-2}
  msg=`${WHO[to].name} lit ton mot discrètement.`;
  setTimeout(()=>{pushMsg(to,'them',tone==='romantique'?(dl>0?pickR(['ton mot… 🥺','j\'ai rougi en cours à cause de toi','garde ça pour toi mais… moi aussi 🙈']):'euh… ton mot m\'a mis·e mal à l\'aise'):pickR(VOICE[to].happy),{kind:'note'})},1500);
 }
 const ch=relChange(to,da,dl);msg+=ch?' · '+ch:'';note(msg);closeSheet();toast(msg);saveG();drawHUD();drawView();checkObjectives();
}
function doAct(k){
 const ph=phase();
 if(k==='sleep'){sleepNow();return}
 if(k==='eat'){if(G.ate)return;G.ate=true;G.energy=clamp(G.energy+15,0,100);toast('🍛 Bon appétit · +15 énergie')}
 if(k==='rest'){if(G.rested)return;G.rested=true;G.energy=clamp(G.energy+15,0,100);toast('🛋️ +15 énergie')}
 if(k==='revise'){openSheet(`<div class="who"><div style="flex:1"><h2>Réviser</h2><p class="muted" style="margin:2px 0 0">Quelle matière ?</p></div><button class="gbtn ghost" type="button" data-close aria-label="Fermer">✕</button></div><div class="choices">${Object.entries(SUBJ).map(([s,l])=>`<button class="choice" type="button" data-rev="${s}">${l}<small>Niveau ${G.know[s]}/100 · ${MINI_NAME[MINI_KIND(s)]} : de +3 à +12 %</small></button>`).join('')}</div><p class="muted">Pas le temps de jouer ? <button class="linkbtn" type="button" data-revquick>Réviser vite</button> (+4 %, matière choisie au hasard parmi les plus faibles)</p>`);return}
 saveG();drawHUD();drawView();
}
/* ---------- mini-jeux : révisions, exercices en cours, évaluations et bac ---------- */
/* chaque question : [énoncé, bonne réponse, mauvaise, mauvaise, mauvaise] */
const QUIZ={
 francais:[["Qui a écrit « Les Fleurs du mal » ?","Baudelaire","Victor Hugo","Molière","Rimbaud"],["« Cette obscure clarté » est…","un oxymore","une comparaison","une métaphore filée","une litote"],
  ["Qui a écrit « Cahier d'un retour au pays natal » ?","Aimé Césaire","Léopold Senghor","Maryse Condé","Simone Schwarz-Bart"],["Un alexandrin compte…","12 syllabes","10 syllabes","8 syllabes","14 syllabes"],
  ["Maryse Condé est née…","en Guadeloupe","en Martinique","en Haïti","au Sénégal"],["« Il est fort comme un lion » est…","une comparaison","une métaphore","une hyperbole","un oxymore"],
  ["Qui a écrit « Les Misérables » ?","Victor Hugo","Émile Zola","Balzac","Flaubert"],["Le narrateur qui dit « je » et vit l'histoire est…","interne","externe","omniscient","absent"],
  ["Molière a écrit…","Tartuffe","Phèdre","Le Cid","Candide"],["Qui a écrit « Pluie et vent sur Télumée Miracle » ?","Simone Schwarz-Bart","Aimé Césaire","Édouard Glissant","Patrick Chamoiseau"]],
 histoire:[["L'esclavage est aboli en Guadeloupe en…","1848","1789","1802","1946"],["La Guadeloupe devient un département en…","1946","1848","1958","1983"],
  ["La Seconde Guerre mondiale se termine en Europe en…","1945","1918","1939","1950"],["Le mur de Berlin tombe en…","1989","1961","1991","1975"],
  ["La guerre froide oppose…","les États-Unis et l'URSS","la France et l'Allemagne","la Chine et le Japon","le Royaume-Uni et l'Espagne"],["Victor Schœlcher est connu pour…","l'abolition de l'esclavage","la Révolution française","la Ve République","le droit de vote des femmes"],
  ["La Ve République commence en…","1958","1946","1968","1981"],["La préfecture de la Guadeloupe est…","Basse-Terre","Pointe-à-Pitre","Les Abymes","Le Gosier"],
  ["Les femmes votent pour la première fois en France en…","1945","1918","1968","1936"],["Le traité de Maastricht (Union européenne) date de…","1992","1957","2002","1985"]],
 svt:[["L'ADN se trouve surtout dans…","le noyau","la membrane","le cytoplasme seulement","les os"],["La photosynthèse produit…","du dioxygène","du dioxyde de carbone","de l'azote","du méthane"],
  ["Une cellule humaine a…","46 chromosomes","23 chromosomes","48 chromosomes","92 chromosomes"],["La mitose donne…","2 cellules identiques","4 cellules différentes","1 seule cellule","des gamètes"],
  ["Le volcan actif de la Guadeloupe est…","la Soufrière","la montagne Pelée","le Piton de la Fournaise","l'Etna"],["Les reins servent à…","filtrer le sang","digérer","respirer","produire des hormones de croissance"],
  ["Les globules blancs servent à…","défendre l'organisme","transporter l'oxygène","coaguler le sang","digérer"],["La méiose produit…","les gamètes","les neurones","les globules rouges","les muscles"],
  ["Les anticorps sont produits par…","les lymphocytes B","les globules rouges","les plaquettes","les neurones"],["Le gaz que l'on rejette en respirant est surtout…","le dioxyde de carbone","le dioxygène","l'hélium","l'azote pur"]],
 physique:[["L'unité de la force est…","le newton","le joule","le watt","le pascal"],["La vitesse se calcule par…","v = d / t","v = d × t","v = t / d","v = m × a"],
  ["Le symbole chimique du sodium est…","Na","So","S","Sd"],["Le pH d'une solution neutre (25 °C) est…","7","0","14","1"],
  ["L'unité de l'énergie est…","le joule","le newton","le volt","l'ampère"],["La loi d'Ohm s'écrit…","U = R × I","U = R / I","P = U + I","I = U × R"],
  ["La formule de l'eau est…","H₂O","CO₂","O₂","HO₂"],["L'intensité électrique se mesure en…","ampères","volts","ohms","watts"],
  ["La lumière va à environ…","300 000 km/s","300 km/s","3 000 km/h","30 000 km/s"],["Une solution de pH 3 est…","acide","basique","neutre","salée"]],
 philo:[["« Je pense, donc je suis » est de…","Descartes","Platon","Sartre","Kant"],["L'allégorie de la caverne est de…","Platon","Aristote","Nietzsche","Rousseau"],
  ["« L'homme est condamné à être libre » est de…","Sartre","Descartes","Pascal","Spinoza"],["« Connais-toi toi-même » est associé à…","Socrate","Kant","Hegel","Marx"],
  ["L'impératif catégorique est une idée de…","Kant","Épicure","Hume","Platon"],["Pour Épicure, le bonheur vient…","de plaisirs simples et modérés","de la richesse","de la gloire","de la souffrance"],
  ["Rousseau a écrit…","Du contrat social","Le Prince","Les Méditations","L'Éthique"],["Le doute méthodique est une démarche de…","Descartes","Sartre","Freud","Bergson"],
  ["Pour Freud, une grande partie du psychisme est…","inconsciente","toujours consciente","divine","inexistante"],["Aristote était l'élève de…","Platon","Socrate directement","Kant","Descartes"]],
 eps:[["Un match de foot dure…","90 minutes","60 minutes","120 minutes","45 minutes"],["Au handball, une équipe a sur le terrain…","7 joueurs","5 joueurs","11 joueurs","6 joueurs"],
  ["Au volley, une équipe a sur le terrain…","6 joueurs","5 joueurs","7 joueurs","9 joueurs"],["Un marathon fait…","42,195 km","21 km","50 km","10 km"],
  ["L'échauffement sert à…","préparer muscles et cœur","se fatiguer avant","perdre du poids","rien du tout"],["Au basket, un panier loin de la ligne vaut…","3 points","2 points","1 point","4 points"],
  ["Après l'effort, on doit surtout…","s'hydrater et s'étirer doucement","manger très sucré","s'arrêter net sans rien faire","courir plus vite"],["Le cœur au repos bat environ…","70 fois par minute","20 fois par minute","150 fois par minute","5 fois par minute"]]};
const PAIRS={anglais:[["beach","plage"],["tomorrow","demain"],["friend","ami"],["book","livre"],["always","toujours"],["weather","météo"],["to learn","apprendre"],["happy","heureux"],["school","école"],["house","maison"],["sea","mer"],["to win","gagner"]],
 espagnol:[["playa","plage"],["mañana","demain"],["amigo","ami"],["libro","livre"],["siempre","toujours"],["casa","maison"],["agua","eau"],["feliz","heureux"],["escuela","école"],["mar","mer"],["ganar","gagner"],["tiempo","temps"]]};
const shuf=a=>{a=a.slice();for(let i=a.length-1;i>0;i--){const j=Math.floor(Math.random()*(i+1));[a[i],a[j]]=[a[j],a[i]]}return a};
/* calcul mental (maths) : questions tirées au hasard */
function mathQ(){const r=n=>Math.floor(Math.random()*n),k=r(7);
 const opts=(ok,f)=>{const s=new Set([ok]);let g=0;while(s.size<4&&g++<40){const v=f();if(v!==ok)s.add(v)}return [...s].map(String)};
 if(k===0){const a=6+r(7),b=6+r(7);return [`${a} × ${b} = ?`,...opts(a*b,()=>a*b+(r(2)?1:-1)*(1+r(12)))]}
 if(k===1){const a=20+r(60),b=15+r(50);return [`${a} + ${b} = ?`,...opts(a+b,()=>a+b+(r(2)?1:-1)*(1+r(11)))]}
 if(k===2){const x=2+r(8),a=2+r(5),b=1+r(15);return [`Résous : ${a}x + ${b} = ${a*x+b}`,...opts(x,()=>x+(r(2)?1:-1)*(1+r(4))).map(v=>'x = '+v)]}
 if(k===3){const p=[10,20,25,50][r(4)],n=[40,60,80,120,200][r(5)];return [`${p} % de ${n} = ?`,...opts(n*p/100,()=>n*p/100+(r(2)?1:-1)*(2+r(10)))]}
 if(k===4){const n=[2,3,4,5][r(4)];return [`Dérivée de x${'⁰¹²³⁴⁵'[n]} ?`,...[`${n}x${n-1>1?'⁰¹²³⁴⁵'[n-1]:''}`,`x${'⁰¹²³⁴⁵'[n-1]}`,`${n}x${'⁰¹²³⁴⁵'[n]}`,`${n+1}x${'⁰¹²³⁴⁵'[n]}`]]}
 if(k===5){const n=[4,5,6,7,8,9,11,12][r(8)];return [`√${n*n} = ?`,...opts(n,()=>n+(r(2)?1:-1)*(1+r(3)))]}
 const a=4+r(8)*2,b=a+2*(1+r(4)),c=b+(b-a);return [`Moyenne de ${a}, ${b} et ${c} ?`,...opts(b,()=>b+(r(2)?1:-1)*(1+r(3)))]}
function quizFor(sub,n){if(sub==='maths')return Array.from({length:n},mathQ);
 if(PAIRS[sub]){const L=shuf(PAIRS[sub]).slice(0,n);return L.map(([w,t])=>[`Traduis « ${w} »`,t,...shuf(PAIRS[sub].filter(p=>p[1]!==t)).slice(0,3).map(p=>p[1])])}
 return shuf(QUIZ[sub]||QUIZ.francais).slice(0,n)}
const MINI_KIND=sub=>PAIRS[sub]?'memoire':sub==='eps'?'reflexes':'quiz';
const MINI_NAME={quiz:'Quiz',memoire:'Memory',reflexes:'Réflexes'};
/* mg = partie en cours : {kind, sub|subs, t (secondes), left, timer, done(score 0..1)} */
let mg=null;
function miniStop(){if(mg){clearInterval(mg.timer);mg=null}}
function miniEnd(score){if(!mg)return;const m=mg;clearInterval(m.timer);mg=null;m.done(clamp(score,0,1),m)}
function miniTick(){if(!mg)return;mg.left-=.1;const b=$('mgBar');if(b)b.style.width=Math.max(0,mg.left/mg.t*100)+'%';const n=$('mgSec');if(n)n.textContent=Math.ceil(Math.max(0,mg.left))+' s';
 if(mg.left<=0){mg.kind==='quiz'?miniEnd(mg.ok/mg.Q.length):mg.kind==='memoire'?miniEnd(mg.found/mg.P.length*.9):miniEnd(mg.hits/mg.goal)}}
const mgHead=(t,sub)=>`<div class="who"><div style="flex:1;min-width:0"><h2>${t}</h2><p class="muted" style="margin:2px 0 0">${sub}</p></div><b id="mgSec" class="mg-sec"></b></div><div class="bar mg-bar"><i id="mgBar" style="width:100%"></i></div>`;
/* opts : {sub, subs (évaluation : une question par matière), title, n, t} */
function playMini(o,done){miniStop();const subs=o.subs||[o.sub],kind=o.subs?'quiz':MINI_KIND(o.sub);
 mg={kind,t:o.t||(kind==='quiz'?30:kind==='memoire'?45:20),done,title:o.title,sub:o.sub};mg.left=mg.t;
 if(kind==='quiz'){mg.Q=o.subs?subs.map(s=>{const q=quizFor(s,1)[0];q.sub=s;return q}):quizFor(o.sub,o.n||5);mg.i=0;mg.ok=0;mg.res=[];drawQuiz()}
 else if(kind==='memoire'){const P=shuf(PAIRS[o.sub]).slice(0,6);mg.P=P;mg.cards=shuf(P.flatMap((p,i)=>[{i,t:p[0]},{i,t:p[1]}]));mg.open=[];mg.found=0;mg.tries=0;drawMemo()}
 else{mg.hits=0;mg.goal=10;drawReflex()}
 mg.timer=setInterval(miniTick,100);miniTick()}
function drawQuiz(){const q=mg.Q[mg.i],ans=shuf(q.slice(1));mg.cur={ok:q[1],sub:q.sub};
 openSheet(mgHead(mg.title,`${MINI_NAME.quiz}${q.sub?' · '+SUBJ[q.sub]:''} · question ${mg.i+1}/${mg.Q.length}`)+`<p class="story-text mg-q">${q[0]}</p><div class="choices">${ans.map(a=>`<button class="choice" type="button" data-mgq="${esc(a)}">${esc(a)}</button>`).join('')}</div>`,true)}
function quizPick(a,btn){if(!mg||mg.kind!=='quiz'||mg.lock)return;const good=a===mg.cur.ok;if(good)mg.ok++;mg.res.push({sub:mg.cur.sub,good});mg.lock=true;
 $('sheetBody').querySelectorAll('[data-mgq]').forEach(b=>{if(b.dataset.mgq===mg.cur.ok)b.classList.add('mg-good');else if(b===btn)b.classList.add('mg-bad');b.disabled=true});
 setTimeout(()=>{if(!mg)return;mg.lock=false;mg.i++;if(mg.i>=mg.Q.length)miniEnd(mg.ok/mg.Q.length);else drawQuiz()},good?450:900)}
function drawMemo(){openSheet(mgHead(mg.title,`${MINI_NAME.memoire} · ${SUBJ[mg.sub]} · retrouve chaque mot et sa traduction (${mg.found}/${mg.P.length})`)+`<div class="mg-grid">${mg.cards.map((c,k)=>`<button class="mg-card${c.f?' mg-found':mg.open.includes(k)?' mg-open':''}" type="button" data-mgc="${k}" ${c.f?'disabled':''}>${c.f||mg.open.includes(k)?esc(c.t):'?'}</button>`).join('')}</div>`,true)}
function memoPick(k){if(!mg||mg.kind!=='memoire'||mg.lock)return;const c=mg.cards[k];if(c.f||mg.open.includes(k))return;mg.open.push(k);drawMemo();miniTick();
 if(mg.open.length<2)return;mg.tries++;const [a,b]=mg.open.map(x=>mg.cards[x]);
 if(a.i===b.i){a.f=b.f=1;mg.found++;mg.open=[];setTimeout(()=>{if(!mg)return;if(mg.found>=mg.P.length)miniEnd(.75+.25*mg.left/mg.t);else{drawMemo();miniTick()}},250)}
 else{mg.lock=true;setTimeout(()=>{if(!mg)return;mg.lock=false;mg.open=[];drawMemo();miniTick()},700)}}
function drawReflex(){const x=8+Math.random()*76,y=8+Math.random()*70;
 openSheet(mgHead(mg.title,`${MINI_NAME.reflexes} · ${SUBJ.eps} · touche le ballon ${mg.goal} fois (${mg.hits}/${mg.goal})`)+`<div class="mg-zone"><button class="mg-ball" type="button" data-mgball style="left:${x}%;top:${y}%" aria-label="Ballon">🏀</button></div>`,true)}
function reflexHit(){if(!mg||mg.kind!=='reflexes')return;mg.hits++;if(mg.hits>=mg.goal)miniEnd(.8+.2*mg.left/mg.t);else{drawReflex();miniTick()}}
const scoreLbl=s=>s>=.85?'Excellent ! 🌟':s>=.65?'Bien joué 👍':s>=.4?'Pas mal':'Il faudra retravailler ça 😅';
function miniResult(title,line,extra){openSheet(sheetHead(title,line)+(extra||'')+`<div class="row"><button class="gbtn" type="button" data-close>Continuer</button></div>`)}
/* révisions : le mini-jeu remplace le +8 fixe (de +3 à +12 selon le score) */
function reviseGame(s){const cost=G.place==='cdi'&&phase().type!=='soir'?4:6;if(G.energy<cost){toast("Pas assez d'énergie pour réviser");return}
 G.energy=clamp(G.energy-cost,0,100);G.studied[s]=1;saveG();drawHUD();
 playMini({sub:s,title:'Révisions de '+SUBJ[s]},sc=>{const g=gainK(s,3+Math.round(9*sc));G.know[s]=clamp(G.know[s]+g,0,100);G.st.games=(G.st.games||0)+1;note(`Révisions de ${SUBJ[s]} (mini-jeu : ${Math.round(sc*100)} %)`);
  miniResult(scoreLbl(sc),`Score ${Math.round(sc*100)} % · ${SUBJ[s]} +${g} % de chances de réussite (${G.know[s]} %)`);saveG();drawHUD();drawView()})}
/* exercice en cours : 3 questions, de −8 à +8 selon la réussite (puis niveau et facilités) */
function classGame(ph){G.acts--;G.energy=clamp(G.energy-ACTS.exo.e,0,100);G.cb+=.5;saveG();
 playMini({sub:ph.sub,n:3,t:MINI_KIND(ph.sub)==='quiz'?25:undefined,title:`Exercice de ${SUBJ[ph.sub]}`},sc=>{const g=clamp(gainK(ph.sub,Math.round(16*sc-8)),-8,8);G.know[ph.sub]=clamp(G.know[ph.sub]+g,0,100);if(sc>=.65)G.cb+=.5;
  const msg=sc>=.65?gtxt(`${ph.prof[0]} est content·e de ton exercice !`,profSex(ph.prof[0])):sc>=.5?'Exercice moyen, tu progresses un peu.':'Exercice raté… tu perds un peu confiance dans cette matière.';note(msg);
  miniResult(scoreLbl(sc),`Score ${Math.round(sc*100)} % · ${SUBJ[ph.sub]} ${g>=0?'+':''}${g} %`,`<p class="muted">${msg}</p>`);checkObjectives();saveG();drawHUD();drawView()})}
/* évaluation du vendredi : une question par matière ; bonne réponse +1,5 sur la note, mauvaise −0,5 */
function evalGame(){if(G.evalBonus[G.day]){toast('Tu as déjà rendu ta copie');return}
 playMini({subs:Object.keys(SUBJ),t:75,title:'Évaluation commune'},(sc,m)=>{const b={};(m.res||[]).forEach(r=>{b[r.sub]=r.good?1.5:-.5});G.evalBonus[G.day]=b;
  miniResult('Copie rendue ✍️',`${m.ok}/${m.Q.length} bonnes réponses`,`<p class="muted">Chaque bonne réponse ajoute 1,5 point à la note de la matière, chaque erreur en retire 0,5. Résultats à 17h.</p>`);saveG();drawView()})}
/* bac : une épreuve par matière ; le score déplace la note de −2 à +2 */
function bacGame(k){if(G.bac.bonus[k]!=null){toast('Épreuve déjà passée');return}
 playMini({sub:k,n:6,t:MINI_KIND(k)==='quiz'?45:undefined,title:'Bac · '+SUBJ[k]},sc=>{G.bac.bonus[k]=r2((sc-.5)*4);
  miniResult(scoreLbl(sc),`Épreuve de ${SUBJ[k]} terminée · score ${Math.round(sc*100)} %`,`<p class="muted">Ton résultat compte dans la note de l'épreuve (de −2 à +2 points).</p>`);saveG();drawView()})}
function revise(s){const cost=G.place==='cdi'&&phase().type!=='soir'?4:6;if(G.energy<cost){toast("Pas assez d'énergie pour réviser");return}
 G.energy=clamp(G.energy-cost,0,100);G.know[s]=clamp(G.know[s]+gainK(s,4),0,100);G.studied[s]=1;closeSheet();toast(`📚 ${SUBJ[s]} : ${G.know[s]} % de chances de réussite`);note(`Révisions de ${SUBJ[s]}`);saveG();drawHUD();drawView()}
function startOuting(p){if(p.fam){startFamOuting(p);return}
 if(p.date){openSheet(dateSheet(p));return}
 openSheet(`<div class="who"><div class="av">${avatarOf(p.by)}</div><div><h2>Sortie ${PLACE_OUT[p.place]}</h2><p class="muted" style="margin:2px 0 0">avec ${WHO[p.by].name} · ${fmtT(G.min)}</p></div></div>
 <p class="story-text">${WHO[p.by].name} t'attend ${PLACE_OUT[p.place]}. Qu'est-ce que vous faites ?</p>
 <div class="choices"><button class="choice" type="button" data-out="fun" data-pl="${p.id}">On rigole et on se balade<small class="t-pos">Amitié</small></button>
 <button class="choice" type="button" data-out="deep" data-pl="${p.id}">On parle de choses sérieuses<small class="t-pos">Amitié et confiance</small></button>
 <button class="choice" type="button" data-out="photo" data-pl="${p.id}">On prend une photo ensemble<small class="t-pos">Post sur le fil</small></button>
 <button class="choice" type="button" data-out="romance" data-pl="${p.id}">Un moment plus romantique<small class="t-${G.rel[p.by].ami>=55?'pos':'neg'}">Amour</small></button></div>`);
}
function outing(kind,pid){
 const p=G.plans.find(x=>x.id===pid);if(!p)return;if(kind.startsWith('d_')){dateMoment(p,kind);return}const id=p.by,r=G.rel[id];let ch,msg;G.st.outings++;G.energy=clamp(G.energy-8,0,100);
 if(kind==='fun')ch=relChange(id,7,1);else if(kind==='deep')ch=relChange(id,6,2);
 else if(kind==='photo'){ch=relChange(id,5,1);G.posts.unshift(mkPost({by:id,text:`Sortie ${PLACE_OUT[p.place]} avec ${myHandle()} ✨`,photo:{scene:p.place==='plage'?'plage':p.place==='glacier'?'cantine':'cour',people:[id,'me'],author:id},c:5,r:30,l:600,comments:[npcComment(pickR(NPCS.filter(n=>n.id!==id)).id)]}))}
 else ch=r.ami>=55?relChange(id,2,9):relChange(id,-3,-2);
 msg=`Sortie avec ${WHO[id].name} : ${ch.split(' : ')[1]||'bon moment'}`;note(msg);closeSheet();toast(msg);checkObjectives();saveG();drawGame();
}

/* ---------- discussion ---------- */
const SUGG=["Ça va ?","Tu fais quoi ?","T'as fait les devoirs ?","Tu m'as manqué 😊","On se voit demain ?"];
const chatSub=id=>isNpc(id)?`Amitié ${G.rel[id].ami} · Amour ${G.rel[id].amour}`:isFam(id)?`${famById(id).role} · complicité ${G.famRel[id]}`:'';
function openChat(id,face){
 chat={id,face};G.unreadMsg[id]=0;
 openSheet(`<div class="who"><div class="av sm">${avatarOf(id)}</div><div style="flex:1;min-width:0"><b>${esc(nameOf(id))}</b><div class="muted" id="chatSub">${chatSub(id)}</div></div>${isNpc(id)?`<button class="gbtn ghost" type="button" data-fiche="${id}">Fiche</button>`:''}<button class="gbtn ghost" type="button" data-close aria-label="Fermer">✕</button></div>
 ${face?`<p class="muted" style="margin:0">Vous discutez ${PLACES[G.place]?'au '+PLACES[G.place].toLowerCase():''} en face à face.</p>`:''}
 <div class="msgs" id="chatMsgs"></div>
 <div class="chips">${SUGG.map(s=>`<button class="chip" type="button" data-sugg="${esc(s)}">${esc(s)}</button>`).join('')}</div>
 <form class="composer" id="chatForm"><label for="chatIn" class="vh">Message</label><input id="chatIn" maxlength="220" placeholder="Écris un message…" autocomplete="off"><button class="gbtn" type="submit">Envoyer</button></form>`,true);
 drawChatMsgs();drawNav();saveG();
}
function bubbleExtra(m){
 if(m.plan){const p=G.plans.find(x=>x.id===m.plan);if(!p)return'';
  if(p.status==='pending')return `<div class="bub-act"><button class="gbtn" type="button" data-plan="${p.id}" data-ans="yes">Accepter</button><button class="gbtn ghost" type="button" data-plan="${p.id}" data-ans="no">Refuser</button></div>`;
  return `<small class="bub-st">${{accepted:'✓ Acceptée',refused:'Refusée',missed:'Sans réponse',done:'✓ Sortie faite'}[p.status]||''}</small>`}
 if(m.kind==='confess'&&!G.confessAns[chat.id])return `<div class="bub-act"><button class="gbtn" type="button" data-conf="yes">Moi aussi 💘</button><button class="gbtn ghost" type="button" data-conf="no">Restons amis</button></div>`;
 return'';
}
function drawChatMsgs(){
 const box=$('chatMsgs');if(!box||!chat)return;const th=G.threads[chat.id]||[];
 box.innerHTML=(th.length?th.map(m=>`<div class="bub ${m.from==='me'?'me':''}">${fmtText(m.text)}<small class="tm">${m.tm||''}</small>${m.from==='me'?'':bubbleExtra(m)}</div>`).join(''):`<p class="muted" style="text-align:center">Écris le premier message à ${esc(nameOf(chat.id))}.</p>`)+(busyId===chat.id?`<div class="bub typing">${esc(nameOf(chat.id))} écrit…</div>`:'');
 box.scrollTop=box.scrollHeight;
}
const voiceOf=id=>isFam(id)?FAMREP[famKind(id)]:VOICE[id];
/* ---------- parler en vrai (face à face) ----------
   Différent des messages : dialogue à l'oral, au lieu où l'on se trouve, avec gestes ; historique séparé (G.talks).
   Le ou la camarade sait que c'est en vrai (consigne dans le prompt, gestes et remarques sur le lieu en secours). */
let talk=null;
const TALK_SCENE={cour:'cour',cdi:'couloir',foyer:'couloir',cantine:'cantine',maison:'chambre',plage:'plage',centre:'cour'};
const TALK_SUGG=["Salut !","Ça va ?","Tu fais quoi ici ?","On s'assoit ensemble ?","T'as vu le dernier post des Potins ?","Tu fais quoi ce week-end ?"];
const GESTES={pos:['*sourit*','*rigole*','*te tape dans la main*','*a les yeux qui brillent*'],neg:['*fronce les sourcils*','*croise les bras*','*soupire*','*détourne le regard*'],neu:['*hausse les épaules*','*hoche la tête*','*réfléchit une seconde*','*te regarde*']};
const PLACE_TALK={cour:["Il fait trop chaud dans cette cour 😅","Regarde, Kylian fait encore le show là-bas 😂"],cdi:["*chuchote* on va se faire griller par la documentaliste","*à voix basse* parle doucement, on est au CDI"],
 foyer:["Le foyer est blindé aujourd'hui","Quelqu'un a mis du zouk au foyer, j'adore"],cantine:["C'est quoi ce plat encore ?","Tu manges ça toi ? 😂"],plage:["L'eau est trop bonne aujourd'hui","Regarde le coucher de soleil…"],centre:["Y a trop de monde au centre-ville aujourd'hui","On passe au glacier après ?"],maison:["On est bien à la maison quand même","Tu as mangé ?"]};
const talkPlace=()=>{const ph=phase();return ph.type==='soir'||ph.type==='nuit'?'maison':G.place||'cour'};
function openTalk(id){
 const pl=isFam(id)?'maison':talkPlace();talk={id,pl,day:G.day};
 const th=(G.talks[id]=G.talks[id]||[]);if(th.length&&th[th.length-1].day!==G.day)th.push({sep:1,day:G.day,pl});
 if(isNpc(id)&&!G.done[G.day+'vrai'+id]){G.done[G.day+'vrai'+id]=1;G.st.talks++}
 openSheet(`<div class="who"><div class="av sm">${avatarOf(id)}</div><div style="flex:1;min-width:0"><b>${esc(nameOf(id))}</b><div class="muted" id="talkSub">En vrai · ${PLACES[pl]||'Maison'} · ${fmtT(G.min)}</div></div>${isNpc(id)?`<button class="gbtn ghost" type="button" data-fiche="${id}">Fiche</button>`:''}<button class="gbtn ghost" type="button" data-close aria-label="Partir">Partir</button></div>
 <div class="talk-scene">${photoSVG({scene:TALK_SCENE[pl]||'cour',people:[id,'me'],author:id})}<span class="talk-tag">🗣️ Vous parlez en vrai</span></div>
 <div class="talk" id="talkLines"></div>
 <div class="chips">${TALK_SUGG.map(s=>`<button class="chip" type="button" data-tsay="${esc(s)}">${esc(s)}</button>`).join('')}</div>
 <form class="composer" id="talkForm"><label for="talkIn" class="vh">Ce que tu dis</label><input id="talkIn" maxlength="220" placeholder="Dis quelque chose à ${esc(nameOf(id))}…" autocomplete="off"><button class="gbtn" type="submit">Dire</button></form>`,true);
 drawTalk();
}
function drawTalk(){
 const box=$('talkLines');if(!box||!talk)return;const th=(G.talks[talk.id]||[]).slice(-30);
 const line=m=>m.sep?`<div class="talk-sep">${fmtDay(m.day,true)} · ${PLACES[m.pl]||'Maison'}</div>`:m.from==='me'?`<div class="say me"><b>Toi</b><p>« ${fmtText(m.text)} »</p></div>`
  :`<div class="say"><b>${esc(nameOf(talk.id))}</b><p>${fmtText(m.text).replace(/\*([^*]+)\*/g,'<i class="geste">$1</i>')}</p></div>`;
 box.innerHTML=(th.length?th.map(line).join(''):`<p class="muted" style="text-align:center">${esc(nameOf(talk.id))} est devant toi. Dis-lui quelque chose.</p>`)+(busyId===talk.id?`<div class="say"><b>${esc(nameOf(talk.id))}</b><p><i class="geste">réfléchit…</i></p></div>`:'');
 box.scrollTop=box.scrollHeight;
}
function buildTalkPrompt(id){
 const me=nameOf('me'),ph=phase(),pl=talk.pl,map=presence(ph),autour=(map[pl]||[]).filter(x=>x!==id).map(x=>WHO[x].name);
 const th=(G.talks[id]||[]).filter(m=>!m.sep).slice(-14).map(m=>`${m.from==='me'?me:nameOf(id)} : ${m.text}`).join('\n');
 const mem=G.log.filter(l=>l.t.includes(nameOf(id))).slice(-5).map(l=>'- '+l.t).join('\n')||'- rien de notable';
 return `${persona(id)}

Souvenirs récents liés à ${me} :
${mem}

Moment présent : ${fmtDay(G.day,true)}, ${fmtT(G.min)} (${ph.lbl||PLABEL[ph.type]}${ph.sub?' de '+SUBJ[ph.sub]:''}).
IMPORTANT : vous êtes EN VRAI, face à face, ${pl==='maison'?'à la maison':'au '+(PLACES[pl]||'lycée').toLowerCase()}${autour.length?` (autour de vous : ${autour.join(', ')})`:''}. Ce n'est PAS un message sur le téléphone : c'est une conversation à l'oral. Tu vois ${me}, tu entends sa voix.

Conversation (la plus récente en bas) :
${th}

Écris ce que ${nameOf(id)} répond à voix haute : 1 ou 2 phrases courtes, à l'oral, uniquement en français (jamais en créole), avec sa façon de parler. Commence souvent par un petit geste ou une expression entre astérisques (*sourit*, *hausse les épaules*, *baisse la voix*). Tu peux réagir au lieu et aux gens autour. Pas d'emojis de message à la suite, pas de « mdr » écrit : c'est de l'oral. Reste cohérent avec la personnalité et les sentiments. Les histoires de cœur restent douces et adaptées à des lycéens, sans contenu sexuel. Ne dis jamais que tu es une IA ou un personnage.
Réponds uniquement avec un objet JSON :
{"reponse":"ce que tu dis","amitie":entier de -6 à 6,"amour":entier de -6 à 6}`;
}
function talkFallback(id,text){
 const s=sentiment(text),met=isNpc(id)?(G.met[id]||0):3,v=voiceOf(id),g=pickR(GESTES[s>0?'pos':s<0?'neg':'neu']);
 const strip=t=>t.replace(/\s*(mdr|ptdr|mdrr)\b/gi,'').trim();
 /* pas de question qui reprend ce que tu viens de dire */
 const words=(text.toLowerCase().match(/[a-zà-ÿ]{4,}/g)||[]),fq=isNpc(id)?FOLLOW_Q[id].filter(q=>!words.some(w=>q.toLowerCase().includes(w))&&!askedSame(id,q)):[];
 let r=met===0?'*te regarde avec curiosité* '+introLine(id):g+' '+(sl=>sl+(met<3&&fq.length&&!sl.includes('?')?(/[.!?…\p{Extended_Pictographic}]\s*$/u.test(sl)?' ':'. ')+pickR(fq):''))(strip(smartLine(id,text,'talk')));
 const pt=(isFam(id)?FAMREP[famKind(id)].maison:(PLACE_TALK[talk.pl]||PLACE_TALK.cour)).filter(x=>!x.includes(nameOf(id)));if(met>0&&pt.length&&Math.random()<.3)r+=' '+pickR(pt);
 const love=/(t'aime|tu me plais|mignon|craque|beau|belle)/i.test(text);
 return {reponse:r,amitie:s*3+(s===0?1:0),amour:love&&isNpc(id)?(G.rel[id].ami>=50?4:-2):0};
}
async function sendTalk(text){
 text=(text||'').trim();if(!text||!talk||busyId)return;const id=talk.id;
 (G.talks[id]=G.talks[id]||[]).push({from:'me',text:genderize(text,'me')});busyId=id;drawTalk();
 let out=null;
 if(SAMPLE){try{out=await SAMPLE.json(buildTalkPrompt(id),{modelTier:'quick',cache:false})}catch(e){if(e&&['not_granted','sampling_disabled','not_declared','capability_disabled','capability_removed'].includes(e.code))SAMPLE=null;out=null}}
 else await new Promise(r=>setTimeout(r,700+Math.random()*700));
 if(!out||typeof out.reponse!=='string'||!out.reponse.trim())out=talkFallback(id,text);
 busyId=null;if(isNpc(id))G.met[id]=(G.met[id]||0)+1;
 G.talks[id].push({from:'them',text:genderize(out.reponse.trim().slice(0,300),id)});G.talks[id]=G.talks[id].slice(-60);
 const da=clamp(Math.round(+out.amitie||0),-6,6),dl=clamp(Math.round(+out.amour||0),-6,6);
 if(isNpc(id)){const ch=relChange(id,da,dl);if(ch)toast(ch)}else famChange(id,da);
 if(!G.done[G.day+'vraiNote'+id]){G.done[G.day+'vraiNote'+id]=1;note(`Tu as parlé en vrai avec ${nameOf(id)} ${talk.pl==='maison'?'à la maison':'au '+(PLACES[talk.pl]||'lycée').toLowerCase()}`)}
 checkObjectives();saveG();drawTalk();
}

/* ---------- place en classe : on choisit chaque jour à côté de qui s'asseoir ---------- */
const seatToday=()=>G.seat&&G.seat.day===G.day?G.seat.id:null;
function neighborOf(ph){return seatToday()||NPCS[hash(G.day+'-'+ph.slot)%NPCS.length].id}
function openSeat(){
 openSheet(sheetHead('À côté de qui tu t\'assois ?',`Pour toute la journée de cours · ${fmtDay(G.day,true)}`)+`<div class="choices">${NPCS.slice().sort((a,b)=>G.rel[b.id].ami-G.rel[a.id].ami).map(n=>`<button class="choice" type="button" data-seat="${n.id}">${esc(fullNameOf(n.id))}<small>amitié ${G.rel[n.id].ami}${coupleOf(n.id)==='me'?' · en couple 💞':''}</small></button>`).join('')}</div>`);
}
function chooseSeat(id){
 const r=G.rel[id];let msg,line;
 if(r.ami<-10){line=pickR(["La place est prise.","*pose son sac sur la chaise* Désolé·e, c'est réservé."]);msg=`${WHO[id].name} ne veut pas que tu t'assoies à côté`;relChange(id,-1)}
 else{G.seat={day:G.day,id};const c=relChange(id,r.ami>=30?2:1);line=pickR(r.ami>=30?["Enfin, je t'attendais 😄","*pousse sa trousse pour te faire de la place*","Viens, on se met ensemble !"]:["*te fait un peu de place*","Ah, salut. Tu peux t'asseoir.","*hoche la tête* vas-y"]);msg=`Tu t'assois à côté de ${WHO[id].name} aujourd'hui${c?' · '+c:''}`}
 note(msg);closeSheet();toast(`${WHO[id].name} : « ${genderize(line,id).replace(/\*/g,'')} »`);setTimeout(()=>toast(msg),2300);saveG();drawView();
}

/* ---------- posts des camarades : au moins 2 par jour chacun, publiés à des heures différentes ---------- */
const DAILY={
 ines:{m:["Bonjour tout le monde ✨ {jour} motivée (ou pas) 🥺","Cours de {mat} ce matin… quelqu'un a compris ? 🥺"],j:["Pause goûter avec Maëlle 💕","Mon frère m'a encore piqué mon chargeur 😤","Qui est chaud pour une session révision demain ? 📚✨"],s:["Ce soir : skincare + K-drama, ne me dérangez pas 🥰","Petite choré dans ma chambre avant de dormir 💃","Bonne nuit les amis 🌙✨"]},
 kylian:{m:["{jour} matin, j'ai pas dormi frr 😴","Cours de {mat}… je vais dormir au fond 😂"],j:["Le CPE m'a encore grillé dans le couloir 😭","Qui a les devoirs de {mat} ? demandez pas pour un ami","Entraînement ce soir, qui vient voir ? ⚽"],s:["Victoire à FIFA ce soir, je suis imbattable 🎮","Mon père veut me réveiller à 5 h pour la pêche 🎣","Bonne nuit les fragiles 😎"]},
 maelle:{m:["{jour} : tenue validée 💅","Le cours de {mat} va être littéralement interminable 🙄"],j:["Répétition pom-pom à 17 h, soyez à l'heure 📣","Les potins du jour… je dis rien 🤐","Selfie du jour parce que pourquoi pas 💅"],s:["Qui vient faire du shopping samedi ?","Littéralement épuisée, bonne nuit 💤","Soirée Netflix et masque visage 💅"]},
 noah:{m:["Bonjour la team 🏀","{mat} ce matin, j'ai pris des notes pour une fois ptdr"],j:["Qui a compris l'exo 3 de {mat} ?","Shoot du jour : 8 paniers sur 10 🏀","Entraînement de basket ce soir 💪"],s:["Mamie a fait du gratin de christophine 😍","Nouveau tome de mon manga préféré 📚","Bonne nuit tout le monde"]},
 jade:{m:["{jour}. café. cours de {mat}. survivre.","le matin, la cour est silencieuse. c'est mon moment préféré."],j:["j'ai trouvé un livre de 1952 au cdi. je suis heureuse.","bibliothèque > tout le reste"],s:["le ciel est rose ce soir au-dessus de sainte-anne","la lune est presque pleine. levez les yeux ce soir.","bonne nuit à ceux qui regardent encore les étoiles"]},
 meisha:{m:["{jour} : tenue assortie avec Kenza 👯‍♀️","Cours de {mat}… je dessine des robes dans la marge 😅"],j:["Réunion du journal à midi ✍️","Qui vient à Jarry après les cours ? 🛍️","Kenza m'a encore piqué mon gloss 😤💅"],s:["Haul du jour en story 🛍️","J'écris ma rubrique mode 📝","Bonne nuit, demain on brille ✨"]},
 jessica:{m:["{jour} : fiches prêtes ✏️","Cours de {mat} ce matin, j'adore ce chapitre 😊"],j:["Pause cookies au CDI 🍪","Qui a besoin d'aide pour le devoir de {mat} ?","Cours particulier ce soir 17 h 📚"],s:["Mon petit frère a eu 17 en maths 🥹","Roman policier avant de dormir 🔍","Bonne nuit, et n'oubliez pas de relire vos cours 😊"]},
 noemie:{m:["{jour}, jonglage avant les cours ⚽","Cours de {mat}… j'ai mal aux jambes 😂"],j:["Foot à la récré, qui vient ? ⚽","Petit pont à Kylian, encore 😂","Entraînement ce soir 💪"],s:["Match de l'équipe de France féminine ce soir 🇫🇷⚽","Colombo de ma mère après l'entraînement 🍛","Bonne nuit, demain on gagne 💪"]},
 eva:{m:["Bonjour 🌸 {jour} commence avec un croquis","Cours de {mat}… j'ai dessiné dans la marge, pardon 🙈"],j:["Pause dessin au CDI 🎨","Kylian m'a apporté un sorbet coco 🥹💕","Atelier d'arts plastiques ce soir 🌸"],s:["Aquarelle avant de dormir 🎨","Ma petite sœur m'a dessiné un chat, trop mignon 🐱","Bonne nuit 🌙💕"]},
 kenza:{m:["{jour} : tenue du jour validée 💅✨","Cours de {mat}… réveillez-moi à la sonnerie 😴"],j:["Selfie de la récré parce que je le vaux bien 😘","Trois messages de garçons avant midi, record battu 😂","Répétition de danse ce soir 💃"],s:["Masque visage et R&B, bonne nuit 💆‍♀️","Je choisis déjà ma tenue de demain ✨","Bonne nuit, ne rêvez pas trop de moi 😘"]},
 anais:{m:["Footing de 6 h ✅ {jour} commence bien 🌅💪","Cours de {mat} puis entraînement, journée chargée ! 🔥"],j:["Séance de muscu au gymnase 💪","Qui vient courir sur la plage demain ? 🏃‍♀️","Victoire à l'entraînement, on lâche rien 🤾‍♀️"],s:["Mes petits frères ont transformé le salon en terrain de hand 😂","Smoothie mangue-passion après le sport 🥭","Bonne nuit, demain on recommence 💪😴"]},
 sacha:{m:["{jour}, nouvelle mélodie dans la tête 🎶","En retard au cours de {mat}… encore 😅"],j:["Session guitare au foyer à midi 🎸","Ma mère m'a appris un nouveau rythme de gwo ka 🥁","Le son avance, bientôt vous l'entendrez 🎧"],s:["Playlist du soir : zouk rétro 💿","Il pleut, parfait pour écrire 🌧️","Bonne nuit, la vibe est bonne ✌️"]}};
const KY_LOVE=[{text:"Ma préférée 💕 @eva.clrv",scene:'plage',with:'eva'},{text:"Elle m'a dessiné… je suis trop beau dedans 😎❤️",scene:'cour',with:'eva'},{text:"Coucher de soleil avec ma copine, rien de mieux 🌅💕",scene:'plage',with:'eva'},
 {text:"Je l'ai attendue après son atelier, elle m'a offert une peinture 🥹🎨",scene:'couloir',with:'eva'},{text:"Elle déteste quand je la prends en photo, donc je continue 😂❤️",scene:'cantine',with:'eva'},{text:"Merci la vie de m'avoir mis à côté d'elle en cours 🙏💕",scene:'couloir',with:'eva'}];
const DAILY_SCENE={m:['cour','couloir'],j:['cantine','cour','basket','couloir'],s:['chambre','plage']};
/* au début de chaque jour : 2 heures de publication par camarade (parfois 3), entre 7 h et 22 h 30 */
function planPosts(){
 G.postQ=[];NPCS.forEach(n=>{const k=2+(Math.random()<.3?1:0);for(let i=0;i<k;i++)G.postQ.push({by:n.id,at:420+Math.floor(Math.random()*930)})});
 G.postQ.sort((a,b)=>a.at-b.at);
}
function pickPostFor(by){
 if(by==='kylian'&&coupleOf('kylian')==='eva'&&Math.random()<.45){const r=G.posts.filter(p=>p.by===by).slice(0,8).map(p=>p.text),L=KY_LOVE.filter(t=>!r.includes(t.text));return pickR(L.length?L:KY_LOVE)}
 const recent=G.posts.filter(p=>p.by===by).slice(0,14).map(p=>p.text),sd=!!schoolDay(G.day),slot=G.min<660?'m':G.min>=1200?'s':'j';
 const fill=t=>t.replace('{jour}',t.startsWith('{jour}')&&by!=='jade'?DAYS[weekday()]:DAYS[weekday()].toLowerCase()).replace(/\{mat\}/g,()=>{const wd=weekday(),L=sd&&TT[wd]?TT[wd]:null;return L?SUBJ[pickR(L)].toLowerCase():'révisions'});
 const opinion=NPC_POSTS[by].filter(t=>!recent.includes(t.text)),daily=DAILY[by][slot].filter(t=>(sd||!t.includes('{mat}'))&&!recent.some(r=>r===fill(t)));
 if(by==='jade'&&Math.random()<.5){const poems=opinion.filter(t=>t.poem);if(poems.length)return pickR(poems)}
 if(opinion.length&&(Math.random()<.35||!daily.length))return pickR(opinion);
 const t=fill(pickR(daily.length?daily:DAILY[by][slot]));return {text:t,daily:1,scene:Math.random()<.35?pickR(DAILY_SCENE[slot]):null};
}
function publishDue(){
 while(G.postQ&&G.postQ.length&&G.postQ[0].at<=G.min){const q=G.postQ.shift(),t=q.pool;
  G.posts.unshift(t?(t.by==='potins'?mkPost({by:'potins',text:t.text,c:Math.floor(Math.random()*30)+5,r:Math.floor(Math.random()*300)+20,l:Math.floor(Math.random()*8000)+500}):npcPost(t.by,t)):npcPost(q.by,pickPostFor(q.by)))}
 if(G.posts.length>130)G.posts=G.posts.filter((p,i)=>i<120||p.by==='me');
}
const postWhen=p=>p.day==null?'':`${fmtDay(p.day,true)} · ${fmtT(p.min||0)}`;

function answerPlan(pid,yes){
 const p=G.plans.find(x=>x.id===pid);if(!p||p.status!=='pending')return;
 if(yes){p.status='accepted';pushMsg(p.by,'me','Carrément !');pushMsg(p.by,'them',pickR(voiceOf(p.by).happy)+` À ${planWhen(p).replace('vers ','')} !`);bond(p.by,2);note(`Sortie prévue avec ${p.fam?'ta famille':nameOf(p.by)} ${PLACE_OUT[p.place]} ${planWhen(p)}`)}
 else{p.status='refused';pushMsg(p.by,'me','Désolé·e, je ne peux pas…');pushMsg(p.by,'them',pickR(voiceOf(p.by).neutral));bond(p.by,-2)}
 saveG();drawChatMsgs();
}
function answerConfess(yes){
 const id=chat.id;G.confessAns[id]=yes?'yes':'no';
 if(yes){G.partner=id;G.rel[id].amour=Math.max(G.rel[id].amour,90);pushMsg(id,'me','Moi aussi 💘');pushMsg(id,'them',pickR(["Sérieux ?? 🥹❤️","Je suis trop content·e…","Oh… ok je souris comme un·e idiot·e là 🙈"]));
  G.posts.unshift(mkPost({by:'potins',text:`[Officiel] 💞 ${myHandle()} et ${WHO[id].handle}, c'est confirmé !`,c:50,r:800,l:21000}));note(`Tu es en couple avec ${WHO[id].name} 💞`)}
 else{relChange(id,-5,-25);pushMsg(id,'me','Je préfère qu\'on reste amis…');pushMsg(id,'them',pickR(VOICE[id].hurt))}
 checkObjectives();saveG();drawChatMsgs();
}

/* ---------- création : post ou story ---------- */
let cp=null;
function openCompose(kind){
 cp={kind,mode:'text',scene:'cour',tags:new Set(),bg:0};
 openSheet(`<div class="who"><div class="av sm">${avatarOf('me')}</div><div style="flex:1"><h2>${kind==='story'?'Nouvelle story':'Nouveau post'}</h2></div><button class="gbtn ghost" type="button" data-close aria-label="Fermer">✕</button></div>
 <div class="seg" role="group" aria-label="Type"><button type="button" data-mode="text" aria-pressed="true">Texte</button><button type="button" data-mode="photo" aria-pressed="false">Photo</button></div>
 <div class="prevwrap"><div class="prevlbl" id="cpPrevLbl" hidden><span class="muted">Aperçu de la photo</span><b id="cpPrevPlace"></b></div>
 <div id="cpPrev" class="preview"></div></div>
 <div id="cpText" ${kind==='story'?'':'hidden'}><span class="muted">Couleur du fond</span><div class="chips" style="margin-top:6px">${STORY_BG.map((b,i)=>`<button class="sw2" type="button" data-bg="${i}" aria-label="Fond ${i+1}" aria-pressed="${i===0}" style="background:${b}"></button>`).join('')}</div></div>
 <div id="cpPhoto" hidden class="stack">
  <div><span class="muted">Lieu de la photo</span><div class="chips" style="margin-top:6px">${Object.entries(SCENES).map(([k,l])=>`<button class="chip scn" type="button" data-scene="${k}" aria-pressed="${k==='cour'}"><span class="scth"><svg viewBox="0 0 600 400" xmlns="http://www.w3.org/2000/svg" aria-hidden="true">${sceneSVG(k,uid())}</svg></span>${l}</button>`).join('')}</div></div>
  <div><span class="muted">Identifier des amis</span><div class="chips" style="margin-top:6px">${NPCS.map(n=>`<button class="chip" type="button" data-tag="${n.id}" aria-pressed="false">${n.name}</button>`).join('')}</div></div></div>
 <label class="muted" for="cpTxt">${kind==='story'?'Texte de la story':'Ton message'}</label>
 <textarea id="cpTxt" maxlength="200" placeholder="${kind==='story'?'Écris quelque chose…':'Quoi de neuf au lycée ?'}" style="min-height:80px"></textarea>
 <div class="row"><button class="gbtn" type="button" id="cpSend">Publier</button></div>`);
 updatePreview();
}
function updatePreview(){
 const pv=$('cpPrev'),txt=($('cpTxt')||{}).value||'';
 const lb=$('cpPrevLbl');if(lb){lb.hidden=cp.mode!=='photo';$('cpPrevPlace').textContent=SCENES[cp.scene]||''}
 if(cp.mode==='photo')pv.innerHTML=photoSVG({scene:cp.scene,people:['me',...cp.tags],author:'me'});
 else if(cp.kind==='story')pv.innerHTML=`<div class="txtprev" style="background:${STORY_BG[cp.bg]}">${esc(txt||'Ta story')}</div>`;
 else pv.innerHTML='';
}
function publishCompose(){
 const text=$('cpTxt').value.trim();if(cp.mode==='text'&&!text){toast('Écris quelque chose avant de publier');return}
 const tags=[...cp.tags],photo=cp.mode==='photo'?{scene:cp.scene,people:['me',...tags],author:'me'}:null;
 const changes=tags.map(t=>relChange(t,G.rel[t].ami>=10?3:-1)).filter(Boolean);
 if(tags.length)note(`Tu as identifié ${tags.map(t=>WHO[t].name).join(', ')} : ${changes.map(c=>c.split(' : ')[1]).join(', ')}`);
 if(cp.kind==='story'){G.stories.push({id:'st'+Date.now(),by:'me',type:cp.mode,text,bg:cp.bg,photo,seen:true,reacted:false});G.st.stories++}
 else{const p=mkPost({by:'me',text:text||'📸',photo,l:Math.floor(Math.random()*40)+5,mine:true});
  const com=[...new Set([...tags,...[...NPCS].sort(()=>Math.random()-.5).slice(0,2).map(n=>n.id)])].slice(0,3);
  com.forEach(id=>p.comments.push(npcComment(id)));G.posts.unshift(p);G.st.posts++;G.ig.fans+=2+Math.floor(Math.random()*6);
  /* un·e ami·e prend ta défense si quelqu'un se moque de ton post */
  const mean=p.comments.find(c=>c.tone==='moqueur'),def=mean&&NPCS.find(n=>n.id!==mean.by&&G.rel[n.id].ami>=55);if(def)p.comments.push(mkC(def.id,genderize(pickR(DEF_ME),def.id),{re:mean.id,to:mean.by,vs:mean.by}));
  if(com.length)note(`${com.map(id=>WHO[id].name).join(', ')} ${com.length>1?'ont':'a'} commenté ton post`)}
 G.ig.act=(G.ig.act||0)+(cp.kind==='story'?2:3);
 const kind=cp.kind;saveG();closeSheet();view='home';drawGame();checkObjectives();
 toast((kind==='story'?'Story publiée':'Post publié')+(changes.length?' · '+changes.join(' · '):''));
}

/* ---------- événements aléatoires ---------- */
const EVENTS=[
 {who:'maelle',text:"Maëlle t'arrête dans le couloir : « Tu viens à la soirée de vendredi ? Tout le monde y sera. »",choices:[
  {t:"Carrément, j'y serai",rel:{maelle:8},post:{by:'maelle',text:"{me} confirmé pour vendredi 🎉",scene:'soiree'}},{t:"Je vais réfléchir",rel:{maelle:-2}},{t:"Non merci, ce n'est pas mon truc",rel:{maelle:-8,jade:3}}]},
 {who:'noah',text:"Noah a oublié son devoir de physique. Il te demande de lui passer le tien avant le cours.",choices:[
  {t:"Je lui prête mon devoir",rel:{noah:10}},{t:"Je l'aide à le refaire vite",rel:{noah:6},gems:2},{t:"Je refuse",rel:{noah:-6}}]},
 {who:'jade',text:"Jade est assise seule sur un banc, ses écouteurs sur les oreilles.",choices:[
  {t:"Je m'assois avec elle",rel:{jade:9}},{t:"Je lui fais un signe de loin",rel:{jade:2}},{t:"Je rejoins le groupe de Maëlle",rel:{maelle:4,jade:-3}}]},
 {who:'potins',text:"Un mot anonyme est glissé dans ton casier : « Je sais ce que Kylian raconte sur toi. »",choices:[
  {t:"Je vais voir Kylian",rel:{kylian:-5},post:{by:'potins',text:"[Anonyme] : grosse discussion entre {me} et @kyky971 près des casiers 👀"}},{t:"Je jette le mot",gems:1},{t:"J'en parle à Inès",rel:{ines:6}}]},
 {who:'sacha',text:"Sacha cherche quelqu'un pour chanter sur sa nouvelle compo.",choices:[
  {t:"Je me lance",rel:{sacha:10},post:{by:'sacha',text:"duo avec {me} enregistré 🎤",scene:'chambre'}},{t:"Je propose Inès à ma place",rel:{sacha:3,ines:4}},{t:"Je n'ai pas le temps",rel:{sacha:-4}}]},
 {who:'kylian',text:"Kylian te défie au foot devant toute la cour.",choices:[
  {t:"J'accepte le défi",rel:{kylian:7},gems:2,post:{by:'kylian',text:"match serré contre {me} ⚽ revanche demain",scene:'cour'}},{t:"Je propose d'arbitrer",rel:{kylian:2,noah:2}},{t:"Je l'ignore",rel:{kylian:-5}}]},
 {who:'ines',text:"Inès te confie qu'elle a raté son contrôle de SVT et qu'elle n'ose pas le dire chez elle.",choices:[
  {t:"Je la rassure",rel:{ines:9}},{t:"Je propose de réviser ensemble",rel:{ines:7},gems:1},{t:"Je change de sujet",rel:{ines:-6}}]},
 {who:'meisha',text:"Meisha te demande de l'accompagner à Jarry : Kenza ne peut pas venir et elle « déteste faire du shopping seule ».",choices:[
  {t:"J'y vais, on va tout dévaliser",rel:{meisha:8},post:{by:'meisha',text:"shopping à Jarry avec {me} 🛍️ nouvelle meilleure copine de shopping ?",scene:'couloir'}},{t:"Je propose d'écrire avec elle sa rubrique mode",rel:{meisha:6,jade:2}},{t:"Le shopping, très peu pour moi",rel:{meisha:-3}}]},
 {who:'jessica',text:"Jessica te voit galérer sur un exercice de maths au CDI. Elle s'assoit à côté de toi : « Tu veux que je t'explique ? »",choices:[
  {t:"Oui, merci beaucoup !",rel:{jessica:6}},{t:"Je m'inscris à ses cours particuliers",rel:{jessica:8},tutor:1},{t:"Non merci, je préfère chercher par moi-même",rel:{jessica:-2}}]},
 {who:'noemie',text:"Noémie te défie aux tirs au but devant toute la cour. Les garçons parient déjà contre toi.",choices:[
  {t:"J'accepte, je vais tout donner",rel:{noemie:8},post:{by:'noemie',text:"tirs au but contre {me} 😂 respect, t'as du cran ⚽",scene:'cour'}},{t:"Je propose d'être dans les buts à sa place",rel:{noemie:5,kylian:2}},{t:"Je refuse, trop de monde",rel:{noemie:-3}}]},
 {who:'eva',text:"Eva a vu Kenza rire très fort avec Kylian à la récré. Elle te demande, les larmes aux yeux, si elle doit s'inquiéter.",choices:[
  {t:"Je la rassure : Kylian n'a d'yeux que pour elle",rel:{eva:8,kylian:2}},{t:"Je lui conseille d'en parler à Kylian",rel:{eva:5}},{t:"Je lui dis de se méfier de Kenza",rel:{eva:4,kenza:-6}}]},
 {who:'kenza',text:"Kenza te demande ton avis : elle hésite entre deux garçons qui l'ont invitée samedi… et te fixe un peu trop longtemps.",choices:[
  {t:"Je lui conseille de suivre son cœur",rel:{kenza:6}},{t:"Je lui dis qu'elle joue trop avec les garçons",rel:{kenza:-6,jade:3}},{t:"Je lui propose plutôt une sortie avec moi",rel:{kenza:5},post:{by:'potins',text:"[Anonyme] : on a vu @kenza.lcx rigoler avec {me} pendant toute la récré 👀"}}]},
 {who:'anais',text:"Anaïs déboule dans la cour en riant : « Footing demain à 6 h sur la plage, tu viens avec moi ? »",choices:[
  {t:"Je viens, on va tout donner",rel:{anais:9},post:{by:'anais',text:"footing avec {me} ce matin 🏃‍♀️ on a tout donné !",scene:'plage'}},{t:"Je viendrai plutôt t'encourager au match",rel:{anais:4}},{t:"6 h ? Hors de question",rel:{anais:-2}}]}];
function playEvent(){
 if(G.energy<5){toast("Pas assez d'énergie : récupère ton bonus ou repose-toi");return}
 G.energy-=5;const pool=EVENTS.map((e,i)=>i).filter(i=>!(G.evOnce||[]).includes(i)),ei=pickR(pool.length?pool:EVENTS.map((e,i)=>i)),ev=EVENTS[ei];saveG();drawHUD();
 openSheet(`<div class="who"><div class="av">${avatarOf(ev.who)}</div><div><h2>${WHO[ev.who].name}</h2><p class="muted">Événement · ${fmtT(G.min)}</p></div></div><p class="story-text">${esc(ev.text)}</p>
 <div class="choices">${ev.choices.map((c,i)=>`<button class="choice" type="button" data-ev="${ei}" data-c="${i}">${esc(c.t)}</button>`).join('')}</div>`);
}
function resolve(ei,ci){
 const ev=EVENTS[ei],c=ev.choices[ci],parts=[];
 Object.entries(c.rel||{}).forEach(([k,d])=>{const s=relChange(k,d);if(s)parts.push(s)});
 if(c.gems){G.gems+=c.gems;if(GEMS_ON)parts.push(`+${c.gems} gemmes`)}
 if(c.mark){mark(c.mark[0],c.mark[1]);parts.push(`${WHO[c.mark[0]].name} s'en souviendra`)}
 if(c.potins)fPotins(c.potins);
 if(c.tutor&&!G.tutor){G.tutor=true;parts.push(P('Tu es inscrit·e aux cours particuliers de Jessica 📚 (lundi et mercredi, 17 h)'))}
 Object.entries(c.know||{}).forEach(([k,v])=>{G.know[k]=clamp(G.know[k]+v,0,100)});
 if(ev.choices.some(x=>x.mark))(G.evOnce=G.evOnce||[]).push(ei);groupTick();
 if(c.post){const by=c.post.by;G.posts.unshift(mkPost({by,text:c.post.text.replace('{me}',myHandle()),photo:c.post.scene?{scene:c.post.scene,people:[by,'me'],author:by}:null,c:Math.floor(Math.random()*30)+3,r:Math.floor(Math.random()*300)+10,l:Math.floor(Math.random()*6000)+200}));note(`${nameOf(by)} t'a identifié dans un post`)}
 G.events++;note(`${c.t} (${nameOf(ev.who)}) : ${parts.length?parts.join(', '):'aucun changement'}`);
 saveG();closeSheet();drawGame();checkObjectives();toast(parts.length?parts.join(' · '):'Choix enregistré');
}

/* ---------- clubs : séances le soir, projets et grands rendez-vous ---------- */
const CLUBS={
 foot:{n:'Équipe de foot',ic:'⚽',wd:1,m:['kylian','noah','noemie'],sub:'eps',game:'eps',big:"Match contre le lycée Baimbridge",won:"Victoire contre Baimbridge ⚽🔥",lost:"Défaite de justesse contre Baimbridge"},
 hand:{n:'Équipe de hand',ic:'🤾',wd:3,m:['anais'],sub:'eps',game:'eps',big:"Tournoi de hand de l'académie",won:"Le lycée remporte le tournoi de hand 🏆",lost:"Le lycée sort en demi-finale du tournoi"},
 basket:{n:'Équipe de basket',ic:'🏀',wd:3,m:['noah','kylian'],sub:'eps',game:'eps',big:"Finale du championnat de basket",won:"Champions de basket ! 🏀",lost:"Finale perdue, mais quelle saison"},
 danse:{n:'Club de danse',ic:'💃',wd:0,m:['ines','maelle','kenza'],sub:'eps',game:'eps',big:"Spectacle de danse au foyer",won:"Standing ovation pour le club de danse 💃",lost:"Petit raté dans la choré, mais ambiance de folie"},
 theatre:{n:'Club théâtre',ic:'🎭',wd:2,m:['jade','sacha'],sub:'francais',game:'francais',big:"Représentation de fin de trimestre",won:"La pièce du club théâtre fait salle comble 🎭",lost:"Trou de mémoire sur scène… le public a ri quand même"},
 journal:{n:'Journal du lycée',ic:'📰',wd:1,m:['jade','maelle','jessica','meisha'],sub:'francais',game:'francais',big:"Numéro spécial du journal",won:"Le numéro spécial du journal s'arrache 📰",lost:"Le journal sort avec deux jours de retard"},
 arts:{n:"Atelier d'arts plastiques",ic:'🎨',wd:2,m:['eva'],sub:'philo',game:'philo',big:"Exposition des élèves au CDI",won:"L'expo de l'atelier d'arts plastiques fait l'unanimité 🎨",lost:"Une toile est tombée pendant le vernissage… mais l'expo plaît quand même"},
 musique:{n:'Club de musique',ic:'🎸',wd:4,m:['sacha','ines'],sub:'anglais',game:'anglais',big:"Concert du club au foyer",won:"Le concert du club de musique enflamme le foyer 🎸",lost:"Coupure de son pendant le concert… mais tout le monde a chanté"}};
const CLUB_OLD={ines:'danse',kylian:'foot',maelle:'danse',noah:'basket',jade:'journal',anais:'hand',kenza:'danse',eva:'arts',noemie:'foot',jessica:'journal',meisha:'journal',sacha:'musique'};
const CLUB_MAX=2,CLUB_BIG=4;   /* 2 clubs au plus ; grand rendez-vous après 4 séances */
const myClubs=()=>G.clubs||[];
const clubToday=()=>myClubs().filter(c=>CLUBS[c].wd===weekday()&&schoolDay(G.day)!==null);
function clubsSheet(msg){return sheetHead('🏅 Clubs du lycée',`Tu peux en rejoindre ${CLUB_MAX} · séances le soir après les cours`)+(msg?`<div class="card felt"><p style="margin:0">${esc(msg)}</p></div>`:'')
 +`<div class="choices">${Object.entries(CLUBS).map(([k,c])=>{const inC=myClubs().includes(k);return `<button class="choice" type="button" data-club="${k}">${c.ic} ${c.n}${inC?' ✅':''}<small>${DAYS[c.wd]} soir · avec ${c.m.map(i=>WHO[i].name).join(' et ')} · ${inC?`${(G.clubXP[k]||0)} séance${(G.clubXP[k]||0)>1?'s':''} · touche pour quitter`:myClubs().length>=CLUB_MAX?'2 clubs maximum':'rejoindre'}</small></button>`}).join('')}</div>`}
function clubToggle(k){const c=CLUBS[k];if(!c)return;let msg;
 if(myClubs().includes(k)){G.clubs=myClubs().filter(x=>x!==k);msg=`Tu quittes le ${c.n.toLowerCase()}. `+c.m.map(i=>relChange(i,-3)).join(' · ');mark(c.m[0],'abandon')}
 else if(myClubs().length>=CLUB_MAX)msg='Tu fais déjà partie de 2 clubs : quittes-en un avant.';
 else{G.clubs=[...myClubs(),k];msg=joinFx([`Bienvenue au ${c.n.toLowerCase()} ! Séance chaque ${DAYS[c.wd].toLowerCase()} soir.`,...c.m.map(i=>relChange(i,4))]);note(`${c.ic} Tu rejoins : ${c.n}`)}
 saveG();openSheet(clubsSheet(msg));drawView()}
/* ---------- cours particuliers de Jessica : lundi et mercredi, 17 h – 19 h ; quiz toutes matières mélangées, puis discussion ---------- */
const TUTOR={who:'jessica',days:[0,2],start:1020,end:1140,e:6,subs:['maths','francais','histoire','svt','anglais','physique','philo','espagnol']};
const TUTOR_TALK=[
 {t:"La remercier pour son aide",r:["Avec plaisir 😊 tu progresses vraiment, tu sais","Oh, merci à toi de venir ! Ça me motive"],a:3},
 {t:"Lui demander pourquoi elle donne ces cours",r:["Quand j'explique, je comprends encore mieux. Et j'aime voir les autres réussir 😊","En seconde, quelqu'un m'a aidée en physique. Je rends la pareille"],a:4},
 {t:"Lui parler de ton stress pour le bac",r:["C'est normal… moi aussi je stresse. On fait un planning ensemble ? 📅","Respire. On avance chapitre par chapitre, et tu vas y arriver ✏️"],a:4},
 {t:"Lui demander comment elle tient le rythme",r:["Honnêtement ? Parfois je dors très peu… mais chut 😅","Des listes, des listes et encore des listes 😂 et des cookies"],a:3},
 {t:"Lui proposer de faire une pause ensemble",r:["Bonne idée, j'ai des cookies dans mon sac 🍪","Cinq minutes alors 😄 sinon je culpabilise"],a:4},
 {t:"Lui demander ce qu'elle fait en dehors des cours",r:["Je lis des romans policiers et je fais de la pâtisserie 🧁","Je fais réviser mon petit frère Hugo… et je regarde des séries policières 🔍"],a:3},
 {t:"La taquiner : « Tu n'as jamais eu en dessous de 18 ? »",r:["Si ! Un 12 en sport en troisième 😂","Haha… une fois, en espagnol. Je m'en souviens encore 😅"],a:2},
 {t:"Lui dire qu'elle devrait se reposer un peu",r:["Tu as peut-être raison… merci de t'inquiéter pour moi 🥹","Ma mère me dit pareil 😅 je vais essayer"],a:4}];
const tutorToday=()=>G.tutor&&TUTOR.days.includes(weekday())&&schoolDay(G.day)!==null;
function tutorCard(){const j=WHO[TUTOR.who];
 if(!G.tutor)return `<div class="card"><span class="eyebrow">Cours particuliers</span><div class="prof"><span>📚 <b>Avec ${j.name}</b> <small class="muted">lundi et mercredi · 17 h – 19 h · quiz toutes matières</small></span><button class="gbtn" type="button" data-tutorjoin>S'inscrire</button></div></div>`;
 const done=G.done[G.day+'tutor'],now=G.min>=TUTOR.start&&G.min<TUTOR.end;
 const act=!tutorToday()?'<small class="muted">lun. et mer.</small>':done?'<small class="muted">fait ✅</small>':now?'<button class="gbtn" type="button" data-tutorgo>Y aller</button>':G.min<TUTOR.start?'<small class="muted">à 17 h</small>':'<small class="muted">terminé</small>';
 return `<div class="card"><span class="eyebrow">Cours particuliers <button class="linkbtn" type="button" data-tutorquit>se désinscrire</button></span><div class="prof"><span>📚 <b>Avec ${j.name}</b> <small class="muted">${G.tutorN||0} cours suivi${(G.tutorN||0)>1?'s':''} · lundi et mercredi, 17 h – 19 h</small></span>${act}</div></div>`}
function tutorJoin(on){G.tutor=!!on;const m=on?joinFx(["Tu t'inscris aux cours particuliers de Jessica 📚",relChange(TUTOR.who,4)]):joinFx(['Tu te désinscris des cours particuliers',relChange(TUTOR.who,-2)]);
 if(on)sayTo(TUTOR.who,["Super ! Rendez-vous lundi ou mercredi à 17 h, salle 12 😊📚","Trop bien ! Apporte tes questions, on reprend tout ensemble ✏️"]);
 note(m);toast(m);saveG();drawView()}
function tutorGo(){if(!tutorToday()||G.done[G.day+'tutor'])return;if(G.min<TUTOR.start||G.min>=TUTOR.end){toast('Le cours a lieu de 17 h à 19 h');return}
 if(G.energy<TUTOR.e){toast("Pas assez d'énergie pour le cours");return}
 G.energy=clamp(G.energy-TUTOR.e,0,100);G.done[G.day+'tutor']=1;G.tutorN=(G.tutorN||0)+1;
 const subs=shuf(TUTOR.subs).slice(0,6);
 playMini({subs,title:'📚 Cours particulier avec Jessica'},(sc,m)=>{
  const gain={};(m.res||[]).forEach(r=>{gain[r.sub]=(gain[r.sub]||0)+gainK(r.sub,r.good?3:1)});
  Object.entries(gain).forEach(([k,v])=>{G.know[k]=clamp((G.know[k]||0)+v,0,100)});
  const rel=relChange(TUTOR.who,sc>=.65?3:2);
  if(G.min<TUTOR.end)advance(TUTOR.end-G.min);
  G.tutorTalk={n:0,opts:shuf(TUTOR_TALK.map((_,i)=>i)).slice(0,3),last:''};
  G.tutorRes=joinFx([`Score ${Math.round(sc*100)} %`,Object.entries(gain).map(([k,v])=>`${SUBJ[k]} +${v} %`).join(', '),rel]);
  note(`📚 Cours particulier avec Jessica : ${scoreLbl(sc)}`);saveG();drawHUD();openSheet(tutorTalkSheet());checkObjectives()})}
function tutorTalkSheet(){const T=G.tutorTalk||{n:2,opts:[]},left=2-T.n;
 return sheetHead('📚 Fin du cours avec Jessica',G.tutorRes||'')
  +(T.last?`<div class="card felt"><p style="margin:0">${esc(T.last)}</p></div>`:`<p class="story-text">Jessica range ses fiches. C'est le moment de discuter un peu avec elle.</p>`)
  +(left>0&&T.opts.length?`<span class="eyebrow">Discuter avec Jessica · ${left} échange${left>1?'s':''} possible${left>1?'s':''}</span><div class="choices">${T.opts.map(i=>`<button class="choice" type="button" data-tutortalk="${i}">${esc(P(TUTOR_TALK[i].t))}</button>`).join('')}</div>`:'')
  +`<div class="row"><button class="gbtn ${left>0?'ghost':''}" type="button" data-close>${left>0?'Rentrer':'Au revoir Jessica'}</button></div>`}
function tutorTalk(i){const T=G.tutorTalk;if(!T||T.n>=2||!T.opts.includes(i))return;const o=TUTOR_TALK[i];
 T.n++;T.opts=T.opts.filter(x=>x!==i);const c=relChange(TUTOR.who,o.a);T.last=`Jessica : « ${genderize(pickR(o.r),TUTOR.who)} »${c?' · '+c:''}`;
 saveG();openSheet(tutorTalkSheet())}
/* séance : −8 énergie, amitié avec les membres, progrès dans la matière ; la 4e séance lance le grand rendez-vous (mini-jeu) */
const CLUB_LINES={foot:["Entraînement sous la pluie, tout le monde finit couvert de boue 😂","Exercices de passes avec {a}","Petit match entre vous, {a} marque un but incroyable"],
 hand:["Entraînement de tirs avec {a}","Séance de cardio : {a} ne s'arrête jamais 🔥","Tactique au tableau, puis match"],basket:["Lancers francs avec {a}","Match à trois contre trois, {a} fait un dunk 😱","Séance de dribbles"],
 danse:["Nouvelle choré dancehall avec {a} 💃","Répétition devant le miroir, {a} corrige tes pas","Vous inventez un passage ensemble"],theatre:["Lecture de la pièce avec {a}","Improvisations : {a} te fait pleurer de rire","Répétition de ta scène avec {a}"],
 journal:["Conférence de rédaction : {a} veut un article sur la cantine","Tu écris un article avec {a}","Interview d'un prof avec {a}"],arts:["Croquis de modèle vivant avec {a} 🎨","{a} t'apprend l'aquarelle","Vous peignez une toile à quatre mains"],musique:["Répétition avec {a} 🎸","{a} t'apprend trois accords","Vous enregistrez une maquette au foyer"]};
function clubGo(k){const c=CLUBS[k];if(!c||!clubToday().includes(k))return;if(G.done[G.day+'club'+k]){toast('Séance déjà faite aujourd\'hui');return}
 if(G.energy<8){toast("Pas assez d'énergie pour la séance");return}
 G.energy=clamp(G.energy-8,0,100);G.done[G.day+'club'+k]=1;G.clubXP[k]=(G.clubXP[k]||0)+1;
 const a=pickR(c.m),line=pickR(CLUB_LINES[k]).replace('{a}',WHO[a].name);G.know[c.sub]=clamp(G.know[c.sub]+3,0,100);
 const msg=joinFx([line,...c.m.map(i=>relChange(i,3)),`${SUBJ[c.sub]} +3 %`]);note(`${c.ic} ${c.n} : ${line}`);saveG();drawHUD();drawView();
 if(G.clubXP[k]%CLUB_BIG===0)openSheet(sheetHead(`${c.ic} ${c.big}`,'Le grand rendez-vous du club')+`<p class="story-text">${esc(msg)}</p><p class="story-text">C'est le moment de montrer ce que vous valez. Tout le lycée regarde !</p><div class="row"><button class="gbtn" type="button" data-clubbig="${k}">C'est parti</button></div>`);
 else openSheet(sheetHead(`${c.ic} ${c.n}`,`Séance n° ${G.clubXP[k]} · prochain grand rendez-vous dans ${CLUB_BIG-G.clubXP[k]%CLUB_BIG} séance${CLUB_BIG-G.clubXP[k]%CLUB_BIG>1?'s':''}`)+`<p class="story-text">${esc(msg)}</p><div class="row"><button class="gbtn" type="button" data-close>Continuer</button></div>`)}
function clubBig(k){const c=CLUBS[k];playMini({sub:c.game,n:5,title:c.big},sc=>{const win=sc>=.6;
 G.posts.unshift(mkPost({by:'potins',text:`[Officiel] ${win?c.won:c.lost} · bravo à ${[...c.m.map(i=>WHO[i].name),nameOf('me')].join(', ')} !`,c:20+Math.floor(Math.random()*30),r:300,l:6000+Math.floor(Math.random()*6000)}));
 if(win){G.ig.fans+=15+Math.floor(sc*20);G.gems+=5}
 const msg=joinFx([win?c.won:c.lost,...c.m.map(i=>relChange(i,win?6:3)),win?gemTxt('+5 gemmes · ')+'nouveaux abonnés':'']);note(`${c.ic} ${c.big} : ${win?'réussi':'raté de peu'}`);
 miniResult(win?'Grand succès ! 🎉':'Raté de peu…',`Score ${Math.round(sc*100)} %`,`<p class="story-text">${esc(msg)}</p>`);checkObjectives();saveG();drawHUD()})}

/* ---------- traces durables : trahisons, confiance, rancunes ---------- */
/* G.marks : [{id, k, day}] ; k = trahison (90 jours), confiance (120 j), rivalite (toute l'année), abandon (30 j) */
var MARK_DAYS={trahison:90,confiance:120,rivalite:400,abandon:30};
function mark(id,k){if(!isNpc(id))return;(G.marks=G.marks||[]).push({id,k,day:G.day});note(`${WHO[id].name} s'en souviendra (${MARK_LBL[k]})`)}
const MARK_LBL={trahison:'trahison',confiance:'confiance',rivalite:'rivalité',abandon:'déception'};
function marksOf(id){return (G.marks||[]).filter(m=>m.id===id&&G.day-m.day<=MARK_DAYS[m.k])}
function hasMark(id,k){return marksOf(id).some(m=>m.k===k)}
/* effet sur les gains d'amitié : une trahison freine fort, la confiance aide */
function markFactor(id,da){if(da<=0)return 1;let f=1;if(hasMark(id,'trahison'))f*=.35;if(hasMark(id,'rivalite'))f*=.6;if(hasMark(id,'abandon'))f*=.8;if(hasMark(id,'confiance'))f*=1.25;return f}
const markNote=id=>{const L=marksOf(id).map(m=>({trahison:`${nameOf('me')} t'a trahi·e (${fmtDay(m.day,true)}) : tu lui en veux encore et tu restes méfiant·e.`,confiance:`${nameOf('me')} a gardé ton secret : tu lui fais confiance.`,rivalite:`Tu es en rivalité avec ${nameOf('me')} : tu le ou la piques souvent.`,abandon:`${nameOf('me')} a quitté ton club : tu es un peu déçu·e.`})[m.k]);return L.length?'Souvenirs importants : '+[...new Set(L)].join(' ')+'\n':''};

/* ---------- groupes d'amis : adopté·e ou rejeté·e ---------- */
const GROUPS={pop:{n:'Les populaires',ic:'💅',m:['maelle','ines','kenza','meisha']},sport:{n:'Les sportifs',ic:'⚽',m:['kylian','noah','anais','noemie']},art:{n:'Les artistes',ic:'🎨',m:['jade','sacha','eva']}};
function groupState(g){const G0=GROUPS[g],a=mean(G0.m.map(i=>G.rel[i].ami)),tr=G0.m.filter(i=>hasMark(i,'trahison')).length;
 return tr>=1&&a<45||a<0?'rejete':a>=55&&!tr?'adopte':'neutre'}
const GSTATE={adopte:'Ils t\'ont adopté·e 💛',neutre:'Ils te connaissent',rejete:'Ils te tiennent à l\'écart ❄️'};
function groupTick(){G.gstate=G.gstate||{};Object.keys(GROUPS).forEach(g=>{const s=groupState(g),old=G.gstate[g]||'neutre';if(s===old)return;G.gstate[g]=s;const G0=GROUPS[g];
 if(s==='adopte'){note(P(`${G0.ic} ${G0.n} t'ont adopté·e`));G.posts.unshift(mkPost({by:'potins',text:`[Anonyme] : ${myHandle()} traîne avec ${G0.n.toLowerCase()} maintenant 👀`,c:12,r:120,l:3000}));popSheet(sheetHead(`${G0.ic} ${G0.n}`,P('Tu fais partie du groupe !'))+`<p class="story-text">${G0.m.map(i=>WHO[i].name).join(', ')} ${P("te gardent une place à leur table. Tu es invité·e à leurs sorties et ils te défendent dans les commentaires.")}</p><div class="row"><button class="gbtn" type="button" data-close>Trop bien</button></div>`)}
 else if(s==='rejete'){note(`${G0.ic} ${G0.n} te tiennent à l'écart`);G.posts.unshift(mkPost({by:'potins',text:`[Anonyme] : ambiance glaciale entre ${myHandle()} et ${G0.n.toLowerCase()}… quelqu'un sait ce qui s'est passé ? 🥶`,c:25,r:300,l:7000}));popSheet(sheetHead(`${G0.ic} ${G0.n}`,'Le groupe te tourne le dos')+`<p class="story-text">${G0.m.map(i=>WHO[i].name).join(', ')} ne t'adressent presque plus la parole. Il faudra du temps (et de vrais efforts) pour regagner leur confiance.</p><div class="row"><button class="gbtn" type="button" data-close>D'accord</button></div>`)}})}
/* chaque semaine : un groupe qui t'a adopté·e te garde proche, un groupe qui te rejette s'éloigne encore */
function groupWeek(){Object.keys(GROUPS).forEach(g=>{const s=(G.gstate||{})[g];GROUPS[g].m.forEach(i=>{if(s==='adopte')G.rel[i].ami=clamp(G.rel[i].ami+1,-30,100);if(s==='rejete')G.rel[i].ami=clamp(G.rel[i].ami-2,-30,100)})})}
const groupsHTML=()=>`<div class="card list">${Object.entries(GROUPS).map(([g,G0])=>`<div class="prof"><span>${G0.ic} <b>${G0.n}</b> <small class="muted">${G0.m.map(i=>WHO[i].name).join(', ')}</small></span><small>${P(GSTATE[(G.gstate||{})[g]||'neutre'])}</small></div>`).join('')}</div>`;

/* nouveaux événements avec des conséquences qui durent */
const EVENTS2=[
 {who:'ines',text:"Inès te prend à part : « Je te dis un secret, mais tu le gardes pour toi… je crois que je craque pour Sacha. »",choices:[
  {t:"Je garde le secret",rel:{ines:8},mark:['ines','confiance']},{t:"Je l'encourage à lui parler",rel:{ines:5,sacha:1}},{t:"Je le répète à Maëlle",rel:{ines:-14,maelle:4},mark:['ines','trahison'],potins:"Inès craquerait pour quelqu'un du club de musique… 🎸👀"}]},
 {who:'noah',text:"Noah te montre en cachette qu'il a eu 6 en maths : « Ne dis rien à Kylian, il va se moquer. »",choices:[
  {t:"Je ne dis rien et je propose de l'aider",rel:{noah:9},mark:['noah','confiance'],know:{maths:2}},{t:"Je le rassure",rel:{noah:5}},{t:"Je raconte tout à Kylian pour rigoler",rel:{noah:-12,kylian:3},mark:['noah','trahison']}]},
 {who:'maelle',text:"Maëlle : « Choisis ton camp. Soit tu traînes avec nous, soit avec Jade. Pas les deux. »",choices:[
  {t:"Je reste avec Maëlle",rel:{maelle:8,jade:-8},mark:['jade','abandon']},{t:"Je défends Jade",rel:{jade:10,maelle:-10},mark:['maelle','rivalite']},{t:"Je refuse de choisir",rel:{maelle:-3,jade:3}}]},
 {who:'kylian',text:"Kylian a cassé la fenêtre du gymnase. La CPE cherche le coupable et te demande si tu as vu quelque chose.",choices:[
  {t:"Je ne dis rien",rel:{kylian:9},mark:['kylian','confiance']},{t:"Je conseille à Kylian d'avouer",rel:{kylian:2}},{t:"Je le dénonce",rel:{kylian:-15,noah:-5},mark:['kylian','trahison'],potins:"Quelqu'un a balancé Kylian pour la fenêtre du gymnase 😬"}]},
 {who:'jade',text:"Jade te fait lire un poème très personnel qu'elle n'a montré à personne.",choices:[
  {t:"Je lui dis sincèrement ce que j'en pense",rel:{jade:9},mark:['jade','confiance']},{t:"Je lui dis que c'est très beau",rel:{jade:4}},{t:"Je le prends en photo pour le montrer",rel:{jade:-16},mark:['jade','trahison'],potins:"Un poème de Jade circule dans toute la classe… 📜"}]},
 {who:'kenza',text:"Kenza te confie en pleurant qu'elle en a marre qu'on ne la remarque que pour son physique. Elle te demande de ne le dire à personne.",choices:[
  {t:"Je garde le secret et je la soutiens",rel:{kenza:9},mark:['kenza','confiance']},{t:"J'en parle à Maëlle",rel:{kenza:-8,maelle:3}},{t:"Je le poste en story",rel:{kenza:-15},mark:['kenza','trahison']}]},
 {who:'anais',text:"Anaïs s'est blessée au genou avant le tournoi. Elle te demande de ne pas le dire au coach.",choices:[
  {t:"Je garde le secret mais je lui dis de se soigner",rel:{anais:7},mark:['anais','confiance']},{t:"Je préviens le coach pour la protéger",rel:{anais:-4}},{t:"Je le poste en story",rel:{anais:-14},mark:['anais','trahison']}]},
 {who:'sacha',text:"Sacha t'avoue qu'il veut arrêter le lycée pour la musique, mais ses parents ne savent rien.",choices:[
  {t:"Je l'écoute et je garde ça pour moi",rel:{sacha:8},mark:['sacha','confiance']},{t:"Je lui conseille d'en parler à ses parents",rel:{sacha:4}},{t:"J'en parle à tout le monde",rel:{sacha:-14},mark:['sacha','trahison'],potins:"Sacha quitterait le lycée ?! 🎤"}]}];
/* une rivale ou un rival tiré·e au sort à chaque partie */
function pickRival(){const id=pickR(NPCS).id;G.rival=id;(G.marks=G.marks||[]).push({id,k:'rivalite',day:1});return id}

/* ---------- résumé de la semaine (chaque samedi matin) ---------- */
function weekSnap(){return {day:G.day,rel:Object.fromEntries(NPCS.map(n=>[n.id,{...G.rel[n.id]}])),fam:{...G.famRel},ng:G.grades.length,fans:G.ig.fans,log:G.log.length}}
function weekSheet(){const S0=G.wsnap||{day:1,rel:{},fam:{},ng:0,fans:G.ig.fans,log:0},ev=G.evals[G.evals.length-1];
 const rows=NPCS.map(n=>{const a=G.rel[n.id],b=S0.rel[n.id]||{ami:0,amour:0},da=a.ami-b.ami,dl=a.amour-b.amour;return {n,a,da,dl}}).filter(x=>x.da||x.dl).sort((x,y)=>Math.abs(y.da)+Math.abs(y.dl)-Math.abs(x.da)-Math.abs(x.dl));
 const sgn=v=>v>0?`<b class="t-pos">+${v}</b>`:`<b class="t-neg">${v}</b>`,love=NPCS.filter(n=>npcLikesMe(n.id)&&G.rel[n.id].amour>=40).sort((a,b)=>G.rel[b.id].amour-G.rel[a.id].amour);
 const fam=G.family.map(f=>[f,(G.famRel[f.id]||0)-(S0.fam[f.id]??G.famRel[f.id])]).filter(x=>x[1]);
 const evs=(G.log||[]).slice(S0.log).filter(l=>/[🎉🎭🎃💘⚽🏀🎸📰🌀🕯️🏖️💛✊🏾🎶🥂🎒🦀🖤🤾💃]/u.test(l.t)).slice(-4);
 return sheetHead('📅 Ta semaine',`Semaine du ${fmtDay(S0.day||G.day,true)} au ${fmtDay(G.day-1,true)}`)
  +`<div class="card"><span class="eyebrow">Notes</span>${ev&&G.grades.length>S0.ng?`<div class="prof"><span>Évaluation du vendredi</span><b>${fmtG(ev.glob)}/20</b></div>`:'<p class="muted">Pas d\'évaluation cette semaine.</p>'}${avg()!=null?`<div class="prof"><span>Moyenne de l'année</span><b>${fmtG(r2(avg()))}/20</b></div>`:''}</div>`
  +`<div class="card"><span class="eyebrow">Amitiés</span>${rows.length?rows.slice(0,6).map(x=>`<div class="prof"><span>${x.n.name}</span><span>amitié ${sgn(x.da)}${x.dl?' · amour '+sgn(x.dl):''} <small class="muted">(${x.a.ami})</small></span></div>`).join(''):'<p class="muted">Rien n\'a bougé cette semaine.</p>'}</div>`
  +`<div class="card"><span class="eyebrow">Histoires de cœur</span>${G.partner?`<p>En couple avec <b>${WHO[G.partner].name}</b> 💞</p>`:love.length?love.slice(0,2).map(n=>`<p style="margin:4px 0">${n.name} pense souvent à toi… 👀 <small class="muted">(amour ${G.rel[n.id].amour})</small></p>`).join(''):'<p class="muted">Rien de nouveau de ce côté-là.</p>'}</div>`
  +(fam.length?`<div class="card"><span class="eyebrow">Famille</span>${fam.map(([f,d])=>`<div class="prof"><span>${esc(f.name)} <small class="muted">${f.role}</small></span><span>${sgn(d)}</span></div>`).join('')}</div>`:'')
  +`<div class="card"><span class="eyebrow">Groupes</span>${groupsHTML()}${G.rival?`<p class="muted" style="margin:6px 0 0">Rivalité de l'année : <b>${WHO[G.rival].name}</b> (amitié ${G.rel[G.rival].ami})</p>`:''}</div>`
  +(evs.length?`<div class="card"><span class="eyebrow">Moments forts</span>${evs.map(l=>`<p style="margin:4px 0">${esc(l.t)}</p>`).join('')}</div>`:'')
  +`<div class="row"><span class="muted">Insta : ${G.ig.fans-S0.fans>=0?'+':''}${G.ig.fans-S0.fans} abonnés</span><button class="gbtn" type="button" data-close>Nouvelle semaine</button></div>`}
function weekTick(){if(wdOf(G.day)!==5||G.day<3)return;groupWeek();popSheet(weekSheet());G.wsnap=weekSnap()}

/* ---------- fins de l'année : selon le bac et les relations ---------- */
function ending(){const r=G.bac.result||{},friends=NPCS.filter(n=>G.rel[n.id].ami>=60),close=friends.length,fam=mean(G.family.map(f=>G.famRel[f.id]||0))||0,adopt=Object.values(G.gstate||{}).filter(s=>s==='adopte').length,betr=(G.marks||[]).filter(m=>m.k==='trahison').length;
 const bac=!r.ok?'rate':r.ment==='Très bien'?'tb':r.ment==='Bien'?'b':r.ment==='Assez bien'?'ab':r.ratt?'ratt':'admis';
 const soc=close>=4||adopt>=2?'entoure':close>=2||G.partner?'proche':'seul';
 const BAC={tb:'mention Très bien 🏅',b:'mention Bien',ab:'mention Assez bien',admis:'bac en poche, sans mention',ratt:"bac obtenu au rattrapage, de justesse",rate:'bac raté'};
 const T={
  'tb-entoure':["La légende de la promo",P("Mention très bien ET entouré·e de tes amis : tu as tout réussi. Ton nom restera dans les couloirs du lycée.")],
  'tb-proche':["Brillant·e et bien accompagné·e",P("Une mention très bien et quelques amis en or : l'équilibre parfait pour la suite.")],
  'tb-seul':["Major de promo… mais seul·e",P("Tu as la meilleure note du lycée, mais au moment de fêter ça, peu de monde autour de toi. Tes études commencent, il est temps d'ouvrir ton cœur.")],
  'b-entoure':["Le duo parfait : travail et amitié",P("Mention bien et une bande d'amis soudée : cet été sera inoubliable.")],
  'ab-entoure':["Bien entouré·e, bac assuré",P("Mention assez bien et des amis partout : tu as profité de ta terminale à fond.")],
  'admis-entoure':["Le cœur avant tout",P("Pas de mention, mais tout le lycée t'adore. Tes amis sont ta plus belle réussite.")],
  'ratt-entoure':["Sauvé·e par le gong",P("Le bac de justesse au rattrapage… et tes amis qui t'attendaient devant le lycée en criant. Quelle fin !")],
  'rate-entoure':["Bac raté, mais pas seul·e",P("Le bac n'est pas passé cette fois. Mais tes amis et ta famille sont là, et l'an prochain tu reviendras plus fort·e.")],
  'rate-proche':["Une année pour rebondir",P("Le bac est raté, mais quelques personnes comptent vraiment pour toi. Ensemble, vous préparez déjà la revanche.")],
  'rate-seul':["Un nouveau départ",P("Bac raté et peu d'amis : cette année a été dure. Mais c'est aussi le début d'une nouvelle histoire, ailleurs, avec de nouvelles chances.")]};
 const key=bac+'-'+soc,t=T[key]||T[(bac==='rate'?'rate':bac==='tb'?'tb':'admis')+'-'+soc]||[r.ok?"Une belle année":"Une année difficile",P(r.ok?"Tu as ton bac et des souvenirs plein la tête.":"Le bac n'est pas passé, mais l'histoire continue.")];
 const epi=NPCS.map(n=>{const a=G.rel[n.id].ami,c=G.partner===n.id;return `<div class="prof"><span>${n.name}</span><small class="muted">${c?'part en vacances avec toi 💞':hasMark(n.id,'trahison')?P("ne t'a jamais pardonné·e"):a>=75?(FICHES[n.id].g==='f'?'reste ta meilleure amie':'reste ton meilleur ami'):a>=50?'te promet de garder contact':a>=20?'te souhaite bonne chance':P('t\'a déjà oublié·e')}</small></div>`}).join('');
 return {key,title:t[0],text:t[1],bac:BAC[bac],epi,stats:{close,fam:Math.round(fam),adopt,betr}}}
function endingSheet(){const e=ending(),r=G.bac.result||{};
 return sheetHead('🎓 Fin de la terminale',e.bac)+`<div class="card felt"><h2 style="margin:0 0 6px">${esc(e.title)}</h2><p class="story-text" style="margin:0">${esc(e.text)}</p></div>`
  +`<div class="card list"><div class="prof"><span>Bac</span><b>${r.fin!=null?fmtG(r.fin)+'/20':'–'}</b></div><div class="prof"><span>Amis proches</span><b>${e.stats.close}</b></div><div class="prof"><span>${P("Groupes qui t'ont adopté·e")}</span><b>${e.stats.adopt}</b></div><div class="prof"><span>Complicité familiale</span><b>${e.stats.fam}/100</b></div>${e.stats.betr?`<div class="prof"><span>Trahisons</span><b>${e.stats.betr}</b></div>`:''}</div>`
  +`<div class="card"><span class="eyebrow">Et après ?</span>${e.epi}</div><p class="muted">Les vacances commencent : tu peux continuer à profiter de tes amis et de ta famille.</p>`}
EVENTS.push(...EVENTS2);

/* ---------- écouteurs ---------- */
$('sheetBody').addEventListener('click',e=>{
 const t=e.target;
 if(t.id==='gRestartOk'){restartGame();return}
 if(igClick(t))return;
 {let m;if(m=t.closest('[data-mgq]')){quizPick(m.dataset.mgq,m);return}if(m=t.closest('[data-mgc]')){memoPick(+m.dataset.mgc);return}if(t.closest('[data-mgball]')){reflexHit();return}
  if(m=t.closest('[data-clubbig]')){clubBig(m.dataset.clubbig);return}
  if(m=t.closest('[data-tutortalk]')){tutorTalk(+m.dataset.tutortalk);return}
  if(t.closest('[data-revquick]')){const w=Object.keys(SUBJ).sort((a,b)=>G.know[a]-G.know[b]).slice(0,3);revise(pickR(w));return}}
 const ch=t.closest('.choice');
 if(ch){const d=ch.dataset;
  if(d.ev!==undefined){resolve(+d.ev,+d.c);return}
  if(d.sg!==undefined){const s=cm.sugg[+d.sg];sendComment(s.text,s.t);return}
  if(d.fact){const [fid,i]=d.fact.split(':');feteAct(fid,+i,d.to);return}
  if(d.rs!==undefined){const s=cm.rsugg[+d.rs];sendReply(s.text,s.t);return}
  if(d.ntone){sendNote(d.ntone);return}
  if(d.rev){reviseGame(d.rev);return}
  if(d.club){clubToggle(d.club);return}
  if(d.out){d.out.startsWith('f_')?famOuting(d.out,d.pl):outing(d.out,d.pl);return}}
 const q=s=>t.closest(s);
 let b;
 if(b=q('[data-tone]')){cm.tone=b.dataset.tone;document.querySelectorAll('[data-tone]').forEach(x=>x.setAttribute('aria-pressed',x===b));return}
 if(b=q('[data-fend]')){feteEnd(b.dataset.fend);return}
 if(b=q('[data-fback]')){const f=FETES.find(x=>x.id===b.dataset.fback);if(f)openSheet(feteSheet(f));return}
 if(b=q('[data-reply]')){startReply(b.dataset.reply);return}
 if(q('[data-cancelre]')){cm.re=null;openComments(cm.id);return}
 if(b=q('[data-stance]')){cm.stance=b.dataset.stance;cm.stanceSet=true;document.querySelectorAll('[data-stance]').forEach(x=>x.setAttribute('aria-pressed',x===b));return}
 if(t.id==='cSend'){const v=$('cTxt').value.trim();if(!v){toast('Écris un commentaire ou choisis une suggestion');return}cm.re?sendReply(v,cm.stanceSet?cm.stance:(sentiment(v)<0?'mechant':'accord')):sendComment(v,cm.tone);return}
 if(b=q('[data-sv]')){b.dataset.sv==='next'?nextStory():prevStory();return}
 if(b=q('[data-react]')){if(!sv)return;const s=sv.list[sv.i];if(!s.reacted){s.reacted=true;const c2=relChange(s.by,1,b.dataset.react==='❤️'?1:0);note(`Tu as réagi ${b.dataset.react} à la story de ${nameOf(s.by)}`);saveG();toast(`Réaction envoyée${c2?' · '+c2:''}`);document.querySelectorAll('[data-react]').forEach(x=>x.disabled=true)}return}
 if(b=q('[data-pa]')){personAct(b.dataset.id,b.dataset.pa);return}
 if(b=q('[data-ro]')){romAct(b.dataset.id,b.dataset.ro);return}
 if(b=q('[data-gift]')){giveGift(b.dataset.id,b.dataset.gift);return}
 if(b=q('[data-rdv]')){proposeDate(b.dataset.id,b.dataset.rdv);return}
 if(b=q('[data-pback]')){openPerson(b.dataset.pback);return}
 if(b=q('[data-fa]')){famAct(b.dataset.id,b.dataset.fa);return}
 if(b=q('[data-fiche]')){const id=b.dataset.fiche;closeSheet();openFiche(id);return}
 if(b=q('[data-chat]')){const id=b.dataset.chat;closeSheet();openChat(id);return}
 if(b=q('[data-talk]')){const id=b.dataset.talk;closeSheet();openTalk(id);return}
 if(b=q('[data-tsay]')){sendTalk(b.dataset.tsay);return}
 if(b=q('[data-seat]')){chooseSeat(b.dataset.seat);return}
 if(b=q('[data-sugg]')){sendChat(b.dataset.sugg);return}
 if(b=q('[data-plan]')){answerPlan(b.dataset.plan,b.dataset.ans==='yes');return}
 if(b=q('[data-conf]')){answerConfess(b.dataset.conf==='yes');return}
 if(b=q('[data-nto]')){G._nto=b.dataset.nto;document.querySelectorAll('[data-nto]').forEach(x=>x.setAttribute('aria-pressed',x===b));return}
 if(cp){
  if(b=q('[data-mode]')){cp.mode=b.dataset.mode;document.querySelectorAll('[data-mode]').forEach(x=>x.setAttribute('aria-pressed',x===b));$('cpPhoto').hidden=cp.mode!=='photo';$('cpText').hidden=!(cp.kind==='story'&&cp.mode==='text');updatePreview();return}
  if(b=q('[data-scene]')){cp.scene=b.dataset.scene;document.querySelectorAll('[data-scene]').forEach(x=>x.setAttribute('aria-pressed',x===b));updatePreview();return}
  if(b=q('[data-tag]')){const id=b.dataset.tag;cp.tags.has(id)?cp.tags.delete(id):cp.tags.size<3?cp.tags.add(id):toast('3 amis maximum par photo');b.setAttribute('aria-pressed',cp.tags.has(id));updatePreview();return}
  if(b=q('[data-bg]')){cp.bg=+b.dataset.bg;document.querySelectorAll('[data-bg]').forEach(x=>x.setAttribute('aria-pressed',x===b));updatePreview();return}
  if(t.id==='cpSend'){publishCompose();return}
 }
});
$('sheetBody').addEventListener('submit',e=>{if(e.target.id==='chatForm'){e.preventDefault();const i=$('chatIn');const v=i.value;i.value='';sendChat(v)}if(e.target.id==='talkForm'){e.preventDefault();const i=$('talkIn');const v=i.value;i.value='';sendTalk(v)}});
$('sheetBody').addEventListener('input',e=>{if(e.target.id==='cpTxt'&&cp&&cp.kind==='story'&&cp.mode==='text')updatePreview()});
$('gStories').addEventListener('click',e=>{
 if(e.target.closest('[data-add]')){openCompose('story');return}
 const b=e.target.closest('[data-who]');if(!b)return;const w=b.dataset.who;
 if(w==='me'&&!G.stories.some(s=>s.by==='me')){openCompose('story');return}openStories(w);
});
$('gNav').addEventListener('click',e=>{const b=e.target.closest('button');if(!b)return;view=b.dataset.v;drawNav();drawView();window.scrollTo(0,0)});
$('gView').addEventListener('click',e=>{
 const t=e.target;let b;
 if(t.id==='gEdit'){showAtelier();return}
 if(igClick(t))return;
 if(t.closest('[data-seatopen]')){openSeat();return}
 if(t.closest('[data-feedmore]')){G.feedN=(G.feedN||30)+30;drawView();return}
 if(b=t.closest('[data-fetesheet]')){const f=FETES.find(x=>x.id===b.dataset.fetesheet);if(f)openSheet(feteSheet(f));return}
 if(t.id==='gFam'){showFamille(true);return}
 if(t.id==='gRestart'){askRestart();return}
 if(t.id==='gMaj'){forceUpdate();return}
 if(t.id==='gCompte'){window.CLOUD.open();return}
 if(b=t.closest('[data-evsd]')){const e=G.evals.find(x=>x.sd===+b.dataset.evsd);if(e)openSheet(evalSheet(e),true);return}
 if(b=t.closest('[data-bul]')){const x=G.bulletins.find(y=>y.tri===+b.dataset.bul);if(x)openSheet(bulletinSheet(x),true);return}
 if(b=t.closest('[data-bacres]')){openSheet(bacSheet(G.bac.result),true);return}
 if(b=t.closest('[data-ca]')){classAct(b.dataset.ca);return}
 if(t.closest('[data-evalgame]')){evalGame();return}
 if(t.closest('[data-clubs]')){openSheet(clubsSheet());return}
 if(b=t.closest('[data-clubgo]')){clubGo(b.dataset.clubgo);return}
 if(t.closest('[data-tutorjoin]')){tutorJoin(1);return}
 if(t.closest('[data-tutorquit]')){tutorJoin(0);return}
 if(t.closest('[data-tutorgo]')){tutorGo();return}
 if(b=t.closest('[data-bacgame]')){bacGame(b.dataset.bacgame);return}
 if(b=t.closest('[data-place]')){G.place=b.dataset.place;drawView();return}
 if(b=t.closest('[data-person]')){openPerson(b.dataset.person);return}
 if(b=t.closest('[data-do]')){doAct(b.dataset.do);return}
 if(b=t.closest('[data-fam]')){openFamPerson(b.dataset.fam);return}
 if(b=t.closest('[data-mate]')){openFiche(b.dataset.mate);return}
 if(b=t.closest('[data-chat]')){openChat(b.dataset.chat);return}
 b=t.closest('[data-a]');if(!b)return;const p=G.posts.find(x=>x.id===b.closest('.post').dataset.id);if(!p)return;
 const a=b.dataset.a;if(a==='u'){openInsta(p.by);return}if(a==='c'){cm=null;openComments(p.id);return}
 if(a==='l'){p.liked=!p.liked;if(p.liked&&isNpc(p.by)&&!p.likedOnce){p.likedOnce=true;relChange(p.by,1)}}
 if(a==='r')p.rt=!p.rt;if(a==='f')p.fav=!p.fav;saveG();refreshPost(p);
});
/* bouton flottant unique : événement du jour ou publication */
$('gAct').onclick=()=>{openSheet(`<h2>Que veux-tu faire ?</h2><div class="menu-list"><button class="mrow" type="button" data-a="ev"><span class="mic">🎲</span><span><b>Lancer un événement</b><small>Une surprise au lycée ou à la maison</small></span></button><button class="mrow" type="button" data-a="post"><span class="mic">📸</span><span><b>Publier un post</b><small>Photo ou texte sur ton Insta</small></span></button></div><button class="gbtn ghost" type="button" data-a="x">Fermer</button>`);
 $('sheetBody').onclick=e=>{const a=e.target.closest('[data-a]')?.dataset.a;if(!a)return;$('sheetBody').onclick=null;if(a==='x'){closeSheet();return}closeSheet();a==='ev'?playEvent():openCompose('post')}};
/* vitesse du temps : 1, 2, 5 ou 10 minutes de jeu par seconde (le temps repasse à ×1 pendant un mini-jeu) */
const SPEEDS=[1,2,5,10];
/* menu ⚙ : pause, vitesse, musique, notes, bonus d'énergie, boutique, quitter */
function drawMenu(){
 const sp=G.speed||1,avg=triAvg(curTri()),ms=Math.max(0,G.nextAt-Date.now());
 $('sheetBody').innerHTML=`<div id="gMenuBody"><h2>Menu</h2>
 <p class="muted">${fmtDay(G.day)} · ${fmtT(G.min)} · trimestre ${curTri()}</p>
 <div class="mgroup"><span class="mlbl">Temps</span><div class="mline">
  <button class="mbtn${G.paused?' on':''}" type="button" data-m="pause" aria-pressed="${!!G.paused}">${G.paused?'▶️ Reprendre':'⏸ Pause'}</button>
  <div class="mseg" role="group" aria-label="Vitesse du temps">${SPEEDS.map(v=>`<button type="button" data-m="sp${v}" aria-pressed="${sp===v}" class="${sp===v?'on':''}">×${v}</button>`).join('')}</div></div></div>
 <div class="mgroup"><span class="mlbl">Énergie ${G.energy}/100</span><div class="mline">
  <button class="mbtn${G.bonus?' on':''}" type="button" data-m="bonus"${G.bonus?'':' disabled'}>⚡ Bonus ${G.bonus}/${BONUS_MAX}${G.bonus?` : +${G.bonus*5}`:''}</button><span class="muted" id="gRecharge">${G.bonus>=BONUS_MAX?'Bonus plein':`Recharge dans ${Math.floor(ms/60000)}:${String(Math.floor(ms/1000)%60).padStart(2,'0')}`}</span></div>
  <p class="muted" style="margin:4px 0 0">🎯 Chaque objectif atteint : +${OBJ_ENERGY} ⚡</p></div>
 <div class="menu-list">
  <button class="mrow" type="button" data-m="music" aria-pressed="${MUS.on}"><span class="mic">${MUS.on?'🎵':'🔇'}</span><span><b>Musique</b><small>${MUS.on?'Activée : touche pour couper':'Coupée : touche pour activer'}</small></span></button>
  <button class="mrow" type="button" data-m="notes"><span class="mic">📊</span><span><b>Mes notes</b><small>Moyenne du trimestre : ${fmtG(avg)}/20</small></span></button>
  <button class="mrow" type="button" data-m="shop"><span class="mic">🛍️</span><span><b>Boutique</b><small>Bientôt disponible</small></span></button>
  <button class="mrow danger" type="button" data-m="quit"><span class="mic">🚪</span><span><b>Quitter la partie</b><small>Retour à l'atelier, ta partie est sauvegardée</small></span></button>
 </div><button class="gbtn ghost" type="button" data-m="x">Fermer</button></div>`;
 hudTick();
}
function openMenu(){openSheet('');drawMenu();$('sheetBody').onclick=menuClick}
function menuClick(e){const b=e.target.closest('[data-m]');if(!b||b.disabled)return;const m=b.dataset.m;
 if(m==='x'){$('sheetBody').onclick=null;closeSheet();return}
 if(m==='pause'){G.paused=!G.paused;toast(G.paused?'⏸ Temps en pause':'▶️ Le temps reprend')}
 else if(m.startsWith('sp')){G.speed=+m.slice(2);toast(G.speed===1?'⏱ Temps normal':`⏩ Temps accéléré ×${G.speed}`)}
 else if(m==='bonus'){const add=G.bonus*5;G.energy=clamp(G.energy+add,0,100);toast(`+${add} énergie récupérée`);G.bonus=0;G.nextAt=Date.now()+RECHARGE}
 else if(m==='music'){const on=!MUS.on;try{localStorage.setItem(MUSKEY,on?'on':'off')}catch(e){}on?musStart():musStop();toast(on?'🎵 Musique activée':'🔇 Musique coupée')}
 else if(m==='notes'){$('sheetBody').onclick=null;closeSheet();view='profil';drawNav();drawView();window.scrollTo(0,0);return}
 else if(m==='shop'){toast('La boutique arrive bientôt');return}
 else if(m==='quit'){$('sheetBody').innerHTML=`<div id="gMenuQuit"><h2>Quitter la partie ?</h2><p class="muted">Tu reviens à l'atelier. Ta partie est sauvegardée : « Commencer la partie » te ramène là où tu en étais.</p><div class="mline"><button class="gbtn ghost" type="button" data-m="back">Rester</button><button class="gbtn red" type="button" data-m="quitok">Quitter</button></div></div>`;return}
 else if(m==='back'){drawMenu();return}
 else if(m==='quitok'){$('sheetBody').onclick=null;saveG();showAtelier();return}
 saveG();drawHUD();drawMenu()}
/* bouton « Vitesse » de l'en-tête : ×1 → ×2 → ×5 → ×10 → ×1 */
$('gSpeed').onclick=()=>{G.speed=SPEEDS[(SPEEDS.indexOf(G.speed||1)+1)%SPEEDS.length];if(G.paused)G.paused=false;saveG();drawClock();toast(G.speed===1?'⏱ Temps normal':`⏩ Temps accéléré ×${G.speed}`)};
$('gMenu').onclick=openMenu;
$('gDayBtn').onclick=openMenu;
$('gEnergy').onclick=()=>{if(G.bonus){menuClick({target:{closest:()=>({dataset:{m:'bonus'}})}});return}toast(`Énergie ${G.energy}/100 : elle baisse avec le temps et les actions, remonte en dormant et en mangeant`)};
$('gEnergyPlus').onclick=()=>{if(G.gems<10){toast('Il faut 10 gemmes pour 25 énergie');return}G.gems-=10;G.energy=clamp(G.energy+25,0,100);saveG();drawHUD();toast('+25 énergie contre 10 gemmes')};
$('gGemsBtn').onclick=()=>toast(`${G.gems} gemmes : tu en gagnes en réussissant tes objectifs`);
$('gGemPlus').onclick=()=>toast('La boutique de gemmes arrive bientôt');

/* ---------- écrans : famille, jeu, atelier ---------- */
let famDraft=null,famEdit=false;
function showFamille(edit){
 famEdit=!!(edit&&G);famDraft=famEdit?G.family.map(f=>({id:f.id,role:f.role,name:f.name,trait:f.trait,av:f.av})):clone(DEFAULT_FAM).map(f=>({...f,seed:Math.floor(Math.random()*1e9)}));
 closeSheet();$('atelier').hidden=true;$('game').hidden=true;$('gFabs').hidden=true;document.body.classList.remove('playing');$('famille').hidden=false;
 $('famGo').textContent=famEdit?'Enregistrer et revenir au jeu':'Commencer la partie';drawFam();window.scrollTo(0,0);
}
function drawFam(){
 $('famNom').textContent=me().nom?`Toute la famille porte ton nom : ${me().nom}.`:'Ajoute un nom de famille dans l\'atelier pour que toute la famille le porte.';
 $('famList').innerHTML=famDraft.map((f,i)=>`<div class="fam-card" data-i="${i}"><button class="fam-av" type="button" data-look="${i}" aria-label="Modifier l'apparence de ${esc(f.name)}">${render(f.av||famAvatar(f.role,f.seed??hash(f.name+f.role+i)),AVB,uid(),true)}</button>
 <div class="fam-fields"><div class="field"><label for="fr${i}">Rôle</label><select id="fr${i}" data-k="role">${ROLES.map(r=>`<option ${r===f.role?'selected':''}>${r}</option>`).join('')}</select></div>
 <div class="field"><label for="fn${i}">Prénom</label><input id="fn${i}" data-k="name" maxlength="20" value="${esc(f.name)}"></div>${me().nom?`<div class="field"><span class="lbl">Nom</span><span class="famname">${esc(me().nom)}</span></div>`:''}
 <div class="field"><label for="ft${i}">Caractère</label><select id="ft${i}" data-k="trait">${TRAITS.map(r=>`<option ${r===f.trait?'selected':''}>${r}</option>`).join('')}</select></div></div>
 <div class="fam-btns"><button class="btn small" type="button" data-look="${i}">Apparence</button><button class="btn small" type="button" data-rm="${i}" aria-label="Retirer ${esc(f.name)}">Retirer</button></div></div>`).join('')||'<p class="hint">Aucun membre pour l\'instant. Ajoute au moins une personne qui vit avec toi.</p>';
}
$('famList').addEventListener('change',e=>{const c=e.target.closest('.fam-card');if(!c)return;famDraft[+c.dataset.i][e.target.dataset.k]=e.target.value;if(e.target.dataset.k!=='name')drawFam()});
$('famList').addEventListener('input',e=>{const c=e.target.closest('.fam-card');if(!c||e.target.dataset.k!=='name')return;famDraft[+c.dataset.i].name=e.target.value});
$('famList').addEventListener('click',e=>{const lk=e.target.closest('[data-look]');if(lk){editFamLook(+lk.dataset.look);return}const b=e.target.closest('[data-rm]');if(!b)return;famDraft.splice(+b.dataset.rm,1);drawFam()});
$('famAdd').onclick=()=>{if(famDraft.length>=6){toast('6 membres maximum');return}famDraft.push({role:pickR(['Grande sœur','Grand frère','Grand-mère','Tante']),name:pickR(['Maryse','Josué','Ketty','Rudy','Léonie','Fabrice']),trait:pickR(TRAITS),seed:Math.floor(Math.random()*1e9)});drawFam()};
$('famBack').onclick=()=>{$('famille').hidden=true;if(famEdit)showGame();else showAtelier()};
$('famGo').onclick=()=>{
 try{localStorage.setItem(KEY,JSON.stringify(me()))}catch(e){}
 famDraft.forEach(f=>{f.name=(f.name||'').trim()||f.role});
 if(famEdit){G.family=famDraft.map((f,i)=>{const old=G.family.find(x=>x.id===f.id);const id=old?old.id:'fam'+Date.now()+i;if(G.famRel[id]==null)G.famRel[id]=65;return{role:f.role,name:f.name,trait:f.trait,id,av:f.av||famAvatar(f.role,f.seed??hash(f.name+f.role+i))}});saveG();showGame();return}
 G=newGame(famDraft);planPosts();pickRival();G.wsnap=weekSnap();
 G.phaseKey=phase().key;G.lastPhase=phase();
 if(G.rel.ines&&G.rel.ines.ami>=60)pushMsg('ines','them',`Coucou ! C'est toi ${me().sexe==='f'?'la nouvelle':me().sexe==='m'?'le nouveau':'le ou la nouvelle'} ? Bienvenue au lycée ✨ si t'as besoin de quoi que ce soit, demande-moi 🥰`);
 if(G.family[0])pushMsg(G.family[0].id,'them',`Bonne rentrée ${me().name||''} ❤️ Les cours commencent à 8h, ne sois pas en retard !`);
 note('Bienvenue au lycée ! Les cours commencent à 8h.');saveG();showGame();feteDay();saveG();
};
function showGame(){
 if(!G){showFamille(false);return}
 $('atelier').hidden=true;$('famille').hidden=true;$('game').hidden=false;document.body.classList.add('playing');
 if(!G.phaseKey){G.phaseKey=phase().key;G.lastPhase=phase()}
 view='home';drawGame();window.scrollTo(0,0);musAuto();
}
function setAtelierMode(){const fm=!!editFam,f=fm&&famDraft[editFam.i];
 $('atTitle').textContent=fm?`Apparence de ${state.name||f.role}`:"Atelier d'avatar";
 $('atSub').textContent=fm?`${f.role} · visage, cheveux et tenue.`:'Crée le personnage qui entrera au lycée.';
 $('idBlock').hidden=fm;$('bSave').hidden=fm;$('bPlay').hidden=fm;$('codeBox').hidden=fm;$('bFamDone').hidden=!fm;$('nomLbl').textContent=fm?'Prénom':'Prénom du personnage';$('nomFamBox').hidden=fm;}
function editFamLook(i){
 const f=famDraft[i];editFam={i,saved:state};
 state=normalize(f.av||famAvatar(f.role,f.seed??hash(f.name+f.role+i)));state.name=f.name;
 $('famille').hidden=true;$('atelier').hidden=false;tab=0;sub=0;pview='portrait';setAtelierMode();drawTabs();drawSubs();nom.value=state.name;$('nomFam').value=state.nom||'';refresh();window.scrollTo(0,0);
}
$('bFamDone').onclick=()=>{const f=famDraft[editFam.i],av=clone(state);f.name=(state.name||'').trim()||f.role;delete av.name;f.av=av;
 state=editFam.saved;editFam=null;setAtelierMode();nom.value=state.name;$('nomFam').value=state.nom||'';$('atelier').hidden=true;$('famille').hidden=false;drawFam();window.scrollTo(0,0);toast(`Apparence de ${f.name} enregistrée`)};
function restartGame(){$('game').hidden=true;$('gFabs').hidden=true;document.body.classList.remove('playing');closeSheet();G=null;try{localStorage.removeItem(GKEY)}catch(e){}cloudPush();if(typeof musStop==='function')musStop();toast('Nouvelle partie : recrée ta famille puis commence');showFamille(false)}
function askRestart(){openSheet(`<div class="who"><div style="flex:1;min-width:0"><h2>Recommencer la partie ?</h2><p class="muted" style="margin:2px 0 0">Ta progression, tes notes, tes relations et tes messages seront effacés. Ton avatar est conservé.</p></div><button class="gbtn ghost" type="button" data-close aria-label="Fermer">✕</button></div><div class="row"><button class="gbtn ghost" type="button" data-close>Annuler</button><button class="gbtn danger" type="button" id="gRestartOk">Oui, recommencer</button></div>`)}
function showAtelier(){
 closeSheet();musStop();$('game').hidden=true;$('gFabs').hidden=true;$('famille').hidden=true;document.body.classList.remove('playing');$('atelier').hidden=false;
 $('bPlay').textContent=G?'Reprendre la partie':'Suivant : ma famille';$('bRestart').hidden=!G;refresh();window.scrollTo(0,0);
}
$('bPlay').onclick=()=>{try{localStorage.setItem(KEY,JSON.stringify(me()))}catch(e){}if(G)showGame();else showFamille(false)};

nom.value=me().name;$('nomFam').value=me().nom||'';drawTabs();drawSubs();refresh();
$('bPlay').textContent=G?'Reprendre la partie':'Suivant : ma famille';$('bRestart').hidden=!G;
$('bRestart').onclick=askRestart;
if(G)showGame();
