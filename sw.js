/* Service worker : met le jeu en cache pour qu'il marche hors ligne une fois installé.
   Stratégie : réseau d'abord (toujours la dernière version quand il y a internet), copie en cache sinon.
   À l'installation, les fichiers sont téléchargés sans passer par le cache du navigateur (cache: 'reload').
   Nouveau fichier dans le jeu (image, script…) : l'ajouter à FICHIERS et augmenter VERSION. */
const VERSION = 'v96';
const CACHE = 'lycee-' + VERSION;
const FICHIERS = [
  './', 'index.html', 'manifest.webmanifest', 'assets/logo.png',
  'css/style.css', 'css/fonts.css', 'js/chaussures-art.js', 'js/coiffures-art.js', 'js/jeans-art.js', 'js/hauts-garcons-art.js', 'js/sourcils-garcons-art.js', 'assets/sourcils/bgaile.png', 'assets/sourcils/bgarque.png', 'assets/sourcils/bgarrondi.png', 'assets/sourcils/bgcasse.png', 'assets/sourcils/bgcasseleger.png', 'assets/sourcils/bgdecontracte.png', 'assets/sourcils/bgdoux.png', 'assets/sourcils/bgdroit.png', 'assets/sourcils/bgdroitepais.png', 'assets/sourcils/bgebouriffe.png', 'assets/sourcils/bgepais.png', 'assets/sourcils/bgfin.png', 'assets/sourcils/bgfonce.png', 'assets/sourcils/bgnatepais.png', 'assets/sourcils/bgnaturel.png', 'assets/sourcils/bgtouffu.png', 'assets/hauts/bandes-blanc.png', 'assets/hauts/bandes-noir.png', 'assets/hauts/chem-noir.png', 'assets/hauts/cote-noir.png', 'assets/hauts/deb-blanc.png', 'assets/hauts/deb-noir.png', 'assets/hauts/hood-creme.png', 'assets/hauts/hood-gris.png', 'assets/hauts/hood-noir.png', 'assets/hauts/layer-blanc.png', 'assets/hauts/layer-noir.png', 'assets/hauts/lin-creme.png', 'assets/hauts/lin-noir.png', 'assets/hauts/nageur-blanc.png', 'assets/hauts/nageur-noir.png', 'assets/hauts/over-creme.png', 'assets/hauts/polo-blanc.png', 'assets/hauts/polo-noir.png', 'assets/hauts/polopk-creme.png', 'assets/hauts/pull-creme.png', 'assets/hauts/raye-creme.png', 'assets/hauts/raye-noir.png', 'assets/hauts/sport-blanc.png', 'assets/hauts/sport-noir.png', 'assets/hauts/sweat-gris.png', 'assets/hauts/sweat-noir.png', 'assets/hauts/tee-anthracite.png', 'assets/hauts/tee-blanc.png', 'assets/hauts/tee-creme.png', 'assets/hauts/tee-noir.png', 'assets/hauts/teepk-noir.png', 'assets/hauts/zip-noir.png', 'js/coupe-modele.js', 'assets/coiffures/gtaper-modele.png', 'js/yeux-garcons-art.js', 'assets/yeux/ygallonge-d.png', 'assets/yeux/ygallonge-g.png', 'assets/yeux/ygallonge-iris-d.png', 'assets/yeux/ygallonge-iris-g.png', 'assets/yeux/ygamande-d.png', 'assets/yeux/ygamande-g.png', 'assets/yeux/ygamande-iris-d.png', 'assets/yeux/ygamande-iris-g.png', 'assets/yeux/ygambas-d.png', 'assets/yeux/ygambas-g.png', 'assets/yeux/ygambas-iris-d.png', 'assets/yeux/ygambas-iris-g.png', 'assets/yeux/ygamhaut-d.png', 'assets/yeux/ygamhaut-g.png', 'assets/yeux/ygamhaut-iris-d.png', 'assets/yeux/ygamhaut-iris-g.png', 'assets/yeux/ygdroite-d.png', 'assets/yeux/ygdroite-g.png', 'assets/yeux/ygdroite-iris-d.png', 'assets/yeux/ygdroite-iris-g.png', 'assets/yeux/ygenfonce-d.png', 'assets/yeux/ygenfonce-g.png', 'assets/yeux/ygenfonce-iris-d.png', 'assets/yeux/ygenfonce-iris-g.png', 'assets/yeux/yggrand-d.png', 'assets/yeux/yggrand-g.png', 'assets/yeux/yggrand-iris-d.png', 'assets/yeux/yggrand-iris-g.png', 'assets/yeux/ygmoyen-d.png', 'assets/yeux/ygmoyen-g.png', 'assets/yeux/ygmoyen-iris-d.png', 'assets/yeux/ygmoyen-iris-g.png', 'assets/yeux/ygpetit-d.png', 'assets/yeux/ygpetit-g.png', 'assets/yeux/ygpetit-iris-d.png', 'assets/yeux/ygpetit-iris-g.png', 'assets/yeux/ygrond-d.png', 'assets/yeux/ygrond-g.png', 'assets/yeux/ygrond-iris-d.png', 'assets/yeux/ygrond-iris-g.png', 'assets/yeux/ygsaillant-d.png', 'assets/yeux/ygsaillant-g.png', 'assets/yeux/ygsaillant-iris-d.png', 'assets/yeux/ygsaillant-iris-g.png', 'assets/yeux/ygtrapu-d.png', 'assets/yeux/ygtrapu-g.png', 'assets/yeux/ygtrapu-iris-d.png', 'assets/yeux/ygtrapu-iris-g.png', 'js/pantalons-art.js', 'assets/bas/jean-jupejean.png', 'assets/bas/jean-habpattes.png', 'assets/bas/jean-habdroit.png', 'assets/bas/jean-cargo.png', 'assets/bas/jean-jogglarge.png', 'assets/bas/jean-joggajust.png', 'assets/bas/jean-lin.png', 'js/barbes-art.js', 'assets/barbes/brb5j.png', 'assets/barbes/brbcourte.png', 'assets/barbes/brbmoyenne.png', 'assets/barbes/brbcomplete.png', 'assets/barbes/brbgoatee.png', 'assets/barbes/brbmoustmenton.png', 'assets/barbes/brbmoustache.png', 'assets/barbes/brbmentonniere.png', 'assets/barbes/brbetendue.png', 'assets/barbes/brbtaillee.png', 'assets/barbes/brbprecise.png', 'assets/barbes/brbfine.png', 'assets/barbes/brbpatchy.png', 'assets/barbes/brbsoul.png', 'assets/bas/jean-slim.png', 'assets/bas/jean-mom.png', 'assets/bas/jean-jdroit.png', 'assets/bas/jean-jlarge.png', 'assets/bas/jean-bootcut.png', 'assets/bas/jean-bermuda.png', 'js/bouches-art.js', 'assets/bouches/gfermee.png', 'assets/bouches/gfine.png', 'assets/bouches/gmoyenne.png', 'assets/bouches/glarge.png', 'assets/bouches/gpleine.png', 'assets/bouches/gsourirel.png', 'assets/bouches/gsourire.png', 'assets/bouches/ggrand.png', 'assets/bouches/ggrand-dents.png', 'assets/bouches/gneutre.png', 'assets/bouches/gserieux.png', 'assets/bouches/gnasale.png', 'js/yeux-art.js', 'assets/yeux/amande-d.png', 'assets/yeux/amande-g.png', 'assets/yeux/amande-iris-d.png', 'assets/yeux/amande-iris-g.png', 'assets/yeux/amandelong-d.png', 'assets/yeux/amandelong-g.png', 'assets/yeux/amandelong-iris-d.png', 'assets/yeux/amandelong-iris-g.png', 'assets/yeux/enfonces-d.png', 'assets/yeux/enfonces-g.png', 'assets/yeux/enfonces-iris-d.png', 'assets/yeux/enfonces-iris-g.png', 'assets/yeux/grands-d.png', 'assets/yeux/grands-g.png', 'assets/yeux/grands-iris-d.png', 'assets/yeux/grands-iris-g.png', 'assets/yeux/monolides-d.png', 'assets/yeux/monolides-g.png', 'assets/yeux/monolides-iris-d.png', 'assets/yeux/monolides-iris-g.png', 'assets/yeux/petits-d.png', 'assets/yeux/petits-g.png', 'assets/yeux/petits-iris-d.png', 'assets/yeux/petits-iris-g.png', 'assets/yeux/releves-d.png', 'assets/yeux/releves-g.png', 'assets/yeux/releves-iris-d.png', 'assets/yeux/releves-iris-g.png', 'assets/yeux/ronds-d.png', 'assets/yeux/ronds-g.png', 'assets/yeux/ronds-iris-d.png', 'assets/yeux/ronds-iris-g.png', 'assets/yeux/sortants-d.png', 'assets/yeux/sortants-g.png', 'assets/yeux/sortants-iris-d.png', 'assets/yeux/sortants-iris-g.png', 'assets/yeux/tombantes-d.png', 'assets/yeux/tombantes-g.png', 'assets/yeux/tombantes-iris-d.png', 'assets/yeux/tombantes-iris-g.png', 'assets/bouches/fine.png', 'assets/bouches/moyenne.png', 'assets/bouches/pleine.png', 'assets/bouches/coeur.png', 'assets/bouches/rectangle.png', 'assets/bouches/ronde.png', 'assets/bouches/pulpeuse.png', 'assets/bouches/trespulpeuse.png', 'assets/bouches/asymetrique.png', 'assets/bouches/superfine.png', 'assets/bouches/inferieure.png', 'assets/bouches/tombante.png', 'assets/bouches/remontante.png', 'assets/bouches/entrouverte.png', 'assets/bouches/fermee.png', 'assets/bouches/glossy.png', 'assets/bouches/mat.png', 'assets/bouches/ombre.png', 'assets/bouches/glosscentre.png', 'assets/bouches/naturelle.png', 'assets/coiffures/longs.png',
  'assets/coiffures/carrelisse.png',
  'assets/coiffures/bafro-dos-peau.png',
  'assets/coiffures/bafro-peau.png',
  'assets/coiffures/barrette-peau.png',
  'assets/coiffures/bbantu-peau.png',
  'assets/coiffures/bbox-dos-peau.png',
  'assets/coiffures/bbox-peau.png',
  'assets/coiffures/bcarre-dos-peau.png',
  'assets/coiffures/bcarre-peau.png',
  'assets/coiffures/bchignon-peau.png',
  'assets/coiffures/bchignonbas-peau.png',
  'assets/coiffures/bchignonhaut-peau.png',
  'assets/coiffures/bchignonmeches-peau.png',
  'assets/coiffures/bcollees-dos-peau.png',
  'assets/coiffures/bcollees-peau.png',
  'assets/coiffures/bcourt-peau.png',
  'assets/coiffures/bdemiqueue-dos-peau.png',
  'assets/coiffures/bdemiqueue-peau.png',
  'assets/coiffures/blongs-dos-peau.png',
  'assets/coiffures/blongs-peau.png',
  'assets/coiffures/bpuffs-peau.png',
  'assets/coiffures/bqueue-dos-peau.png',
  'assets/coiffures/bqueue-peau.png',
  'assets/coiffures/bqueuehaute-dos-peau.png',
  'assets/coiffures/bqueuehaute-peau.png',
  'assets/coiffures/btressesarriere-dos-peau.png',
  'assets/coiffures/btressesarriere-peau.png',
  'assets/coiffures/btressesboucles-dos-peau.png',
  'assets/coiffures/btressesboucles-peau.png',
  'assets/coiffures/btwists-dos-peau.png',
  'assets/coiffures/btwists-peau.png',
  'assets/coiffures/bwashgo-dos-peau.png',
  'assets/coiffures/bwashgo-peau.png',
  'assets/coiffures/carrelisse-peau.png',
  'assets/coiffures/chignonhaut2-peau.png',
  'assets/coiffures/deuxtresses-dos-peau.png',
  'assets/coiffures/deuxtresses-peau.png',
  'assets/coiffures/frangedroite-dos-peau.png',
  'assets/coiffures/frangedroite-peau.png',
  'assets/coiffures/longs-peau.png',
  'assets/coiffures/mechesdevant-dos-peau.png',
  'assets/coiffures/mechesdevant-peau.png',
  'assets/coiffures/queuehaute2-dos-peau.png',
  'assets/coiffures/queuehaute2-peau.png',
  'assets/coiffures/queuelisse-dos-peau.png',
  'assets/coiffures/queuelisse-peau.png',
  'assets/coiffures/raiecotel-dos-peau.png',
  'assets/coiffures/raiecotel-peau.png',
  'assets/coiffures/raiemilieu-dos-peau.png',
  'assets/coiffures/raiemilieu-peau.png',
  'assets/coiffures/serretete-dos-peau.png',
  'assets/coiffures/serretete-peau.png',
  'assets/coiffures/gnaturel.png',
  'assets/coiffures/gdegbas.png',
  'assets/coiffures/gdegmoyen.png',
  'assets/coiffures/gdeghaut.png',
  'assets/coiffures/gbuzz.png',
  'assets/coiffures/gcarrecourt.png',
  'assets/coiffures/gcarremoyen.png',
  'assets/coiffures/gcarrelong.png',
  'assets/coiffures/gplaques.png',
  'assets/coiffures/graiemilieu.png',
  'assets/coiffures/graiecote.png',
  'assets/coiffures/gquiff.png',
  'assets/coiffures/gpompadour.png',
  'assets/coiffures/gtaper.png', 'js/coupes-garcons.js', 'assets/coiffures/gvagues-modele.png', 'assets/coiffures/gbouclette-modele.png', 'assets/coiffures/gcourt-modele.png',
  'assets/coiffures/gondule.png',
  'assets/coiffures/queuehaute2.png',
  'assets/coiffures/mechesdevant.png',
  'assets/coiffures/frangedroite.png',
  'assets/coiffures/chignonhaut2.png',
  'assets/coiffures/raiecotel.png',
  'assets/coiffures/deuxtresses.png',
  'assets/coiffures/serretete.png',
  'assets/coiffures/barrette.png',
  'assets/coiffures/raiemilieu.png',
  'assets/coiffures/queuelisse.png',
  'assets/coiffures/bafro.png',
  'assets/coiffures/bbantu.png',
  'assets/coiffures/bcarre.png',
  'assets/coiffures/bchignon.png',
  'assets/coiffures/bpuffs.png',
  'assets/coiffures/bafro-dos.png',
  'assets/coiffures/bbox-dos.png',
  'assets/coiffures/bcarre-dos.png',
  'assets/coiffures/bcollees-dos.png',
  'assets/coiffures/bdemiqueue-dos.png',
  'assets/coiffures/blongs-dos.png',
  'assets/coiffures/bqueue-dos.png',
  'assets/coiffures/bqueuehaute-dos.png',
  'assets/coiffures/btressesarriere-dos.png',
  'assets/coiffures/btressesboucles-dos.png',
  'assets/coiffures/btwists-dos.png',
  'assets/coiffures/bwashgo-dos.png',
  'assets/coiffures/deuxtresses-dos.png',
  'assets/coiffures/frangedroite-dos.png',
  'assets/coiffures/mechesdevant-dos.png',
  'assets/coiffures/queuehaute2-dos.png',
  'assets/coiffures/queuelisse-dos.png',
  'assets/coiffures/raiecotel-dos.png',
  'assets/coiffures/raiemilieu-dos.png',
  'assets/coiffures/serretete-dos.png',
  'assets/coiffures/bbox.png',
  'assets/coiffures/bcollees.png',
  'assets/coiffures/bdemiqueue.png',
  'assets/coiffures/bqueue.png',
  'assets/coiffures/blongs.png',
  'assets/coiffures/bchignonhaut.png',
  'assets/coiffures/bchignonbas.png',
  'assets/coiffures/btwists.png',
  'assets/coiffures/bchignonmeches.png',
  'assets/coiffures/bwashgo.png',
  'assets/coiffures/bfoulard.png',
  'assets/coiffures/btressesboucles.png',
  'assets/coiffures/bcourt.png',
  'assets/coiffures/bqueuehaute.png',
  'assets/coiffures/btressesarriere.png',
  'assets/coiffures/bfoulard-acc.png',
  'assets/coiffures/barrette-acc.png',
  'assets/coiffures/serretete-acc.png', 'assets/chaussures/ballerines.png', 'assets/chaussures/basses.png', 'assets/chaussures/epaisses.png', 'assets/chaussures/retro.png', 'assets/chaussures/retro_creme.png', 'assets/chaussures/running.png', 'assets/chaussures/running_noire.png', 'assets/chaussures/sabots.png', 'js/app.js', 'js/config.js', 'js/cloud.js', 'js/vendor/supabase.js',
  'fonts/baloo-2-latin-600-normal.woff2', 'fonts/baloo-2-latin-700-normal.woff2', 'fonts/baloo-2-latin-800-normal.woff2',
  'fonts/nunito-latin-400-normal.woff2', 'fonts/nunito-latin-600-normal.woff2', 'fonts/nunito-latin-700-normal.woff2', 'fonts/nunito-latin-800-normal.woff2',
  'icons/icon-192.png', 'icons/icon-512.png', 'icons/icon-maskable-512.png', 'icons/apple-touch-icon.png', 'icons/favicon-32.png',
  ...['ines', 'kylian', 'maelle', 'noah', 'jade', 'anais', 'sacha', 'kenza', 'meisha', 'eva', 'noemie', 'jessica'].map(n => `assets/chambres/${n}.jpg`),
];

/* Connexion lente : les images, polices et icônes déjà téléchargées sont reprises de l'ancien cache (pas de re-téléchargement
   à chaque mise à jour) ; seuls le code et les nouveaux fichiers passent par le réseau. */
const LOURD = u => /^(assets|fonts|icons)\//.test(u);
self.addEventListener('install', e => {
  e.waitUntil((async () => {
    const c = await caches.open(CACHE), olds = (await caches.keys()).filter(k => k.startsWith('lycee-') && k !== CACHE);
    await Promise.all(FICHIERS.map(async u => {
      if (LOURD(u)) for (const k of olds) { const r = await (await caches.open(k)).match(u); if (r) { await c.put(u, r); return } }
      try { await c.add(new Request(u, { cache: 'reload' })) } catch (_) { /* fichier repris plus tard, à la demande */ }
    }));
    await self.skipWaiting();
  })());
});

self.addEventListener('activate', e => {
  e.waitUntil(caches.keys()
    .then(keys => Promise.all(keys.filter(k => k.startsWith('lycee-') && k !== CACHE).map(k => caches.delete(k))))
    .then(() => self.clients.claim()));
});

/* Images : toujours depuis le cache ; une seule revérification par session, une à la fois et 20 s après l'ouverture
   (pour ne pas ralentir le démarrage). Code : depuis le cache de la version (il ne change qu'avec VERSION, et une nouvelle
   version recharge la page) ; le réseau seulement s'il manque. */
const vu = new Set(), file = [];let tourne = false;
function revoir(c, req, rel) {
  if (vu.has(rel)) return; vu.add(rel); file.push([c, req]);
  if (tourne) return; tourne = true;
  setTimeout(async function suite() {
    const j = file.shift(); if (!j) { tourne = false; return }
    try { const r = await fetch(j[1], { cache: 'no-cache' }); if (r.ok) await j[0].put(j[1], r) } catch (_) {}
    setTimeout(suite, 300);
  }, 20000);
}
self.addEventListener('fetch', e => {
  const req = e.request, url = new URL(req.url);
  if (req.method !== 'GET' || url.origin !== location.origin) return;
  const rel = url.pathname.replace(/^.*?\/(assets|fonts|icons)\//, '$1/');
  e.respondWith(caches.open(CACHE).then(async c => {
    const hit = await c.match(req, { ignoreSearch: true }) || (req.mode === 'navigate' ? await c.match('index.html') : null);
    if (LOURD(rel)) {
      if (hit) { revoir(c, req, rel); return hit }
      try { const r = await fetch(req, { cache: 'no-cache' }); if (r.ok) c.put(req, r.clone()); return r } catch (_) { return Response.error() }
    }
    if (hit) return hit;
    try { const r = await fetch(req, { cache: 'no-cache' }); if (r.ok && !url.search) c.put(req, r.clone()); return r }
    catch (_) { return Response.error() }
  }));
});
