/* Service worker : met le jeu en cache pour qu'il marche hors ligne une fois installé.
   Stratégie : on répond tout de suite avec la copie en cache, et on la met à jour en arrière-plan
   (les modifications apparaissent donc au lancement suivant).
   Nouveau fichier dans le jeu (image, script…) : l'ajouter à FICHIERS et augmenter VERSION. */
const VERSION = 'v10';
const CACHE = 'lycee-' + VERSION;
const FICHIERS = [
  './', 'index.html', 'manifest.webmanifest',
  'css/style.css', 'css/fonts.css', 'js/app.js', 'js/config.js', 'js/cloud.js', 'js/vendor/supabase.js',
  'fonts/baloo-2-latin-600-normal.woff2', 'fonts/baloo-2-latin-700-normal.woff2', 'fonts/baloo-2-latin-800-normal.woff2',
  'fonts/nunito-latin-400-normal.woff2', 'fonts/nunito-latin-600-normal.woff2', 'fonts/nunito-latin-700-normal.woff2', 'fonts/nunito-latin-800-normal.woff2',
  'icons/icon-192.png', 'icons/icon-512.png', 'icons/apple-touch-icon.png', 'icons/favicon-32.png',
  ...['ines', 'kylian', 'maelle', 'noah', 'jade', 'anais', 'sacha'].map(n => `assets/chambres/${n}.jpg`),
];

self.addEventListener('install', e => {
  e.waitUntil(caches.open(CACHE).then(c => c.addAll(FICHIERS)).then(() => self.skipWaiting()));
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
    const enCache = await c.match(req, { ignoreSearch: true });
    const reseau = fetch(req).then(r => { if (r.ok) c.put(req, r.clone()); return r; }).catch(() => null);
    if (enCache) { e.waitUntil(reseau); return enCache; }
    return (await reseau) || (req.mode === 'navigate' ? c.match('index.html') : Response.error());
  }));
});
