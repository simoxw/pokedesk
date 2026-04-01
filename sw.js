const CACHE_NAME = 'pokedesk-v4';
const ASSETS_TO_CACHE = [
  'index.html',
  'manifest.json',
  'icon-192.png',
  'icon-512.png'
];

self.addEventListener('install', (event) => {
  self.skipWaiting();
  event.waitUntil(
    caches.open(CACHE_NAME).then((cache) => {
      return cache.addAll(ASSETS_TO_CACHE);
    })
  );
});

self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys().then((cacheNames) => {
      return Promise.all(
        cacheNames.map((cache) => {
          if (cache !== CACHE_NAME) return caches.delete(cache);
        })
      );
    })
  );
  self.clients.claim();
});

self.addEventListener('fetch', (event) => {
  // Propaga tutte le richieste non GET direttamente, per evitare crash su POST/PUT/AJAX.
  if (event.request.method !== 'GET') {
    return;
  }

  // Forza la fetch di sw.js in modo che il browser non usi una versione cache obsoleta
  if (event.request.url.endsWith('/sw.js')) {
    event.respondWith(fetch(event.request, { cache: 'no-store' }));
    return;
  }

  const requestIsSameOrigin = new URL(event.request.url).origin === self.location.origin;

  const SPRITE_HOSTS = ['raw.githubusercontent.com', 'play.pokemonshowdown.com'];
  const isSprite = SPRITE_HOSTS.includes(new URL(event.request.url).hostname);

  if (!requestIsSameOrigin) {
    if (isSprite) {
      event.respondWith((async () => {
        const cached = await caches.match(event.request);
        if (cached) return cached;
        try {
          const response = await fetch(event.request);
          if (response && response.ok) {
            const cache = await caches.open(CACHE_NAME);
            cache.put(event.request, response.clone());
            return response;
          }
          throw new Error('not ok');
        } catch {
          return new Response('', { status: 404 });
        }
      })());
      return;
    }
    event.respondWith(
      fetch(event.request).catch(async () => {
        const cached = await caches.match(event.request);
        return cached || Response.error();
      })
    );
    return;
  }

  event.respondWith((async () => {
    try {
      const response = await fetch(event.request);

      if (response && response.ok) {
        const cache = await caches.open(CACHE_NAME);
        cache.put(event.request, response.clone());
        return response;
      }

      const cached = await caches.match(event.request);
      if (cached) return cached;

      if (event.request.mode === 'navigate') {
        return caches.match('index.html');
      }

      return response;
    } catch (e) {
      const cached = await caches.match(event.request);
      if (cached) return cached;

      if (event.request.mode === 'navigate') {
        return caches.match('index.html');
      }

      // In caso di fallimento irreversibile, restituiamo 503 silenzioso (no console spam).
      return new Response('Service Unavailable', { status: 503, statusText: 'Service Unavailable' });
    }
  })());
});

