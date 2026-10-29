/* Service worker : met le jeu en cache pour qu'il marche hors ligne une fois installé.
   Stratégie : réseau d'abord (toujours la dernière version quand il y a internet), copie en cache sinon.
   À l'installation, les fichiers sont téléchargés sans passer par le cache du navigateur (cache: 'reload').
   Nouveau fichier dans le jeu (image, script…) : l'ajouter à FICHIERS et augmenter VERSION. */
const VERSION = 'v22';
const CACHE = 'lycee-' + VERSION;
const FICHIERS = [
  './', 'index.html', 'manifest.webmanifest',
  'css/style.css', 'css/fonts.css', 'js/chaussures-art.js', 'js/coiffures-art.js', 'assets/coiffures/longs.png',
  'assets/coiffures/carrelisse.png',
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
  'icons/icon-192.png', 'icons/icon-512.png', 'icons/apple-touch-icon.png', 'icons/favicon-32.png',
  ...['ines', 'kylian', 'maelle', 'noah', 'jade', 'anais', 'sacha'].map(n => `assets/chambres/${n}.jpg`),
];

self.addEventListener('install', e => {
  e.waitUntil(caches.open(CACHE).then(c => c.addAll(FICHIERS.map(u => new Request(u, { cache: 'reload' })))).then(() => self.skipWaiting()));
});

self.addEventListener('activate', e => {
  e.waitUntil(caches.keys()
    .then(keys => Promise.all(keys.filter(k => k.startsWith('lycee-') && k !== CACHE).map(k => caches.delete(k))))
    .then(() => self.clients.claim()));
});

self.addEventListener('fetch', e => {
  const req = e.request;
  if (req.method !== 'GET' || new URL(req.url).origin !== location.origin) return;
  e.respondWith(caches.open(CACHE).then(async c => {
    try {
      const r = await fetch(req, { cache: 'no-cache' });   // revalide auprès du serveur : jamais de vieille copie
      if (r.ok) c.put(req, r.clone());
      return r;
    } catch (_) {                                          // hors ligne : la copie en cache
      return (await c.match(req, { ignoreSearch: true })) || (req.mode === 'navigate' ? c.match('index.html') : Response.error());
    }
  }));
});
