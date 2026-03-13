const CACHE_NAME = 'pokedesk-v' + Date.now(); // Cache dinamica basata sul tempo
const ASSETS_TO_CACHE = [
  '/pokedesk/',
  '/pokedesk/index.html',
  '/pokedesk/manifest.json'
];

self.addEventListener('install', (event) => {
  // Forza il Service Worker a diventare attivo immediatamente
  self.skipWaiting();
  event.waitUntil(
    caches.open(CACHE_NAME).then((cache) => {
      return cache.addAll(ASSETS_TO_CACHE);
    })
  );
});

self.addEventListener('activate', (event) => {
  // Pulisce le vecchie cache vecchie durante l'attivazione
  event.waitUntil(
    caches.keys().then((cacheNames) => {
      return Promise.all(
        cacheNames.map((cache) => {
          if (cache !== CACHE_NAME) {
            console.log('Svuotamento cache vecchia:', cache);
            return caches.delete(cache);
          }
        })
      );
    })
  );
  // Prende il controllo delle pagine immediatamente
  self.clients.claim();
});

self.addEventListener('fetch', (event) => {
  event.respondWith(
    caches.match(event.request).then((response) => {
      // Ritorna la risorsa dalla cache o scarica dal network
      return response || fetch(event.request);
    })
  );
});