
// This service worker enables offline access and faster loading
self.addEventListener('install', (event) => {
  const CACHE_NAME = 'phone-number-grabber-v2'; // Incrementing cache version
  const BASE_PATH = '/decoder';
  const urlsToCache = [
    `${BASE_PATH}/`,
    `${BASE_PATH}/index.html`,
    `${BASE_PATH}/manifest.json`
    // Removing icon references to prevent caching errors
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
        
        // Clone the request because it's a one-time use stream
        const fetchRequest = event.request.clone();
        
        return fetch(fetchRequest).catch(() => {
          // Return a fallback for network errors
          if (event.request.url.includes('/index.html')) {
            return caches.match('/decoder/');
          }
          return new Response('Network error occurred', {
            status: 503,
            headers: new Headers({
              'Content-Type': 'text/plain'
            })
          });
        });
      })
  );
});

self.addEventListener('activate', (event) => {
  const CACHE_NAME = 'phone-number-grabber-v2'; // Match the updated cache name
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
