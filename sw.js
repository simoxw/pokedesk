const CACHE_NAME = 'pokedesk-v3';
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
  // Forza la fetch di sw.js in modo che il browser non usi una versione cache obsoleta
  if (event.request.url.endsWith('/sw.js')) {
    event.respondWith(fetch(event.request, { cache: 'no-store' }));
    return;
  }

  // Network-first per risorse stesse origini + fallback cache;
  // per risorse esterne (es. raw.githubusercontent.com) usiamo solo rete,
  // perché spesso restituiscono risposte opache/di terze parti che possono fallire con cache.put.
  const requestIsSameOrigin = new URL(event.request.url).origin === self.location.origin;

  if (!requestIsSameOrigin) {
    event.respondWith(
      fetch(event.request).catch(() => caches.match(event.request))
    );
    return;
  }

  event.respondWith((async () => {
    try {
      const response = await fetch(event.request);
      if (response && response.ok) {
        const cache = await caches.open(CACHE_NAME);
        cache.put(event.request, response.clone());
      }
      return response;
    } catch (e) {
      // Rete fallita, proveremo la cache
    }

    const cached = await caches.match(event.request);
    if (cached) return cached;

    if (event.request.mode === 'navigate') {
      return caches.match('index.html');
    }

    return Response.error();
  })());
});

