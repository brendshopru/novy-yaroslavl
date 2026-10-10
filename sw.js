const CACHE = 'ny-shell-ccae5fae8aefc07f-v2';

const STATIC = [
  './',
  './manifest.webmanifest',
  './icons/icon-192-ccae5fae8aefc07f.png',
  './icons/icon-512-ccae5fae8aefc07f.png'
];

self.addEventListener('install', event => {
  event.waitUntil(
    caches.open(CACHE)
      .then(cache => cache.addAll(STATIC))
      .then(() => self.skipWaiting())
  );
});

self.addEventListener('activate', event => {
  event.waitUntil(
    caches.keys()
      .then(keys =>
        Promise.all(
          keys
            .filter(key => key !== CACHE)
            .map(key => caches.delete(key))
        )
      )
      .then(() => self.clients.claim())
  );
});

self.addEventListener('fetch', event => {
  const request = event.request;

  if (
    request.method !== 'GET' ||
    new URL(request.url).origin !== self.location.origin
  ) {
    return;
  }

  const url = new URL(request.url);

  const isAppFile = [
    '/data.js',
    '/app.js',
    '/styles.css',
    '/index.html',
    '/manifest.webmanifest'
  ].some(path => url.pathname.endsWith(path));

  // Страницы и файлы приложения: сеть в первую очередь.
  if (request.mode === 'navigate' || isAppFile) {
    event.respondWith(
      fetch(request, { cache: 'no-store' })
        .then(response => {
          if (response.ok) {
            const copy = response.clone();

            caches.open(CACHE)
              .then(cache => cache.put(request, copy))
              .catch(() => {});

          }

          return response;
        })
        .catch(async () => {
          const cached =
            await caches.match(request) ||
            (request.mode === 'navigate'
              ? await caches.match('./')
              : undefined);

          if (cached) return cached;

          return new Response('Нет подключения к интернету.', {
            status: 503,
            headers: { 'Content-Type': 'text/plain; charset=utf-8' }
          });
        })
    );

    return;
  }

  // Остальные ресурсы: сначала кэш, затем сеть.
  event.respondWith(
    caches.match(request).then(cached => {
      if (cached) return cached;

      return fetch(request).then(response => {
        if (response.ok) {
          const copy = response.clone();

          caches.open(CACHE)
            .then(cache => cache.put(request, copy))
            .catch(() => {});
        }

        return response;
      });
    })
  );
});
