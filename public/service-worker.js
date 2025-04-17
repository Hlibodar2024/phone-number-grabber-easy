
const CACHE_NAME = 'phone-number-grabber-v1';
const BASE_PATH = '/decoder';
const urlsToCache = [
  `${BASE_PATH}/`,
  `${BASE_PATH}/index.html`,
  `${BASE_PATH}/manifest.json`,
  `${BASE_PATH}/icon-192x192.png`,
  `${BASE_PATH}/icon-512x512.png`
];

self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME)
      .then((cache) => {
        // Make sure to only cache resources that exist
        return fetch(`${BASE_PATH}/manifest.json`)
          .then(() => cache.addAll(urlsToCache))
          .catch(() => {
            console.log('Skipping non-existent resources in cache');
            // Cache only basic resources if manifest is missing
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
        return fetch(event.request);
      })
  );
});

self.addEventListener('activate', (event) => {
  const cacheWhitelist = [CACHE_NAME];
  event.waitUntil(
    caches.keys().then((cacheNames) => {
      return Promise.all(
        cacheNames.map((cacheName) => {
          if (cacheWhitelist.indexOf(cacheName) === -1) {
            return caches.delete(cacheName);
          }
        })
      );
    })
  );
  // Claim clients to control all open clients without reloading
  event.waitUntil(clients.claim());
});
