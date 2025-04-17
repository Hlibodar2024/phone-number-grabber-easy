
// This ensures proper MIME type handling
self.addEventListener('install', (event) => {
  const CACHE_NAME = 'phone-number-grabber-v1';
  const BASE_PATH = '/decoder';
  const urlsToCache = [
    `${BASE_PATH}/`,
    `${BASE_PATH}/index.html`,
    `${BASE_PATH}/manifest.json`,
    `${BASE_PATH}/icon-192x192.png`,
    `${BASE_PATH}/icon-512x512.png`
  ];
  
  event.waitUntil(
    caches.open(CACHE_NAME)
      .then((cache) => {
        console.log('Opened cache');
        return cache.addAll(urlsToCache)
          .catch(error => {
            console.log('Failed to cache some resources:', error);
            // Still continue even if some resources fail
            return cache.addAll([`${BASE_PATH}/`, `${BASE_PATH}/index.html`]);
          });
      })
  );
  // Skip waiting to make the new service worker active immediately
  self.skipWaiting();
});

self.addEventListener('fetch', (event) => {
  event.respondWith(
    caches.match(event.request)
      .then((response) => {
        // Cache hit - return response
        if (response) {
          return response;
        }
        return fetch(event.request).catch(() => {
          // Return a fallback for network errors
          if (event.request.url.includes('/index.html')) {
            return caches.match('/decoder/');
          }
        });
      })
  );
});

self.addEventListener('activate', (event) => {
  const CACHE_NAME = 'phone-number-grabber-v1';
  const cacheWhitelist = [CACHE_NAME];
  event.waitUntil(
    caches.keys().then((cacheNames) => {
      return Promise.all(
        cacheNames.map((cacheName) => {
          if (cacheWhitelist.indexOf(cacheName) === -1) {
            return caches.delete(cacheName);
          }
          return null;
        })
      );
    })
  );
  // Claim clients to control all open clients without reloading
  event.waitUntil(clients.claim());
});
