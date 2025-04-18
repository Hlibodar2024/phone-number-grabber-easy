
// Цей Service Worker забезпечує офлайн-доступ і швидше завантаження
self.addEventListener('install', (event) => {
  const CACHE_NAME = 'phone-number-grabber-v5'; // Збільшуємо версію кешу
  const BASE_PATH = '/decoder';
  const urlsToCache = [
    `${BASE_PATH}/`,
    `${BASE_PATH}/index.html`,
    `${BASE_PATH}/manifest.json`,
    `${BASE_PATH}/favicon.ico`,
    `${BASE_PATH}/icon-192x192.png`
  ];
  
  event.waitUntil(
    caches.open(CACHE_NAME)
      .then((cache) => {
        console.log('Відкриття кешу');
        return cache.addAll(urlsToCache)
          .catch(error => {
            console.log('Не вдалося кешувати деякі ресурси:', error);
            // Продовжуємо, навіть якщо деякі ресурси не кешуються
            return cache.addAll([`${BASE_PATH}/`, `${BASE_PATH}/index.html`]);
          });
      })
  );
  // Пропускаємо очікування, щоб новий Service Worker був активним негайно
  self.skipWaiting();
});

self.addEventListener('fetch', (event) => {
  // Перехоплюємо лише запити, що стосуються нашого додатку
  if (event.request.url.includes('/decoder/')) {
    event.respondWith(
      caches.match(event.request)
        .then((response) => {
          // Кеш-хіт - повертаємо відповідь
          if (response) {
            return response;
          }
          
          // Клонуємо запит, оскільки це одноразовий потік
          const fetchRequest = event.request.clone();
          
          return fetch(fetchRequest)
            .then(response => {
              // Перевіряємо, чи отримали ми дійсну відповідь
              if (!response || response.status !== 200) {
                return response;
              }
              
              // Клонуємо відповідь, оскільки це одноразовий потік
              const responseToCache = response.clone();
              
              caches.open('phone-number-grabber-v5')
                .then(cache => {
                  cache.put(event.request, responseToCache);
                });
              
              return response;
            })
            .catch(() => {
              // Повертаємо запасний варіант для мережевих помилок
              if (event.request.url.includes('/index.html')) {
                return caches.match('/decoder/');
              }
              // Для зображень і інших ресурсів, показуємо помилку
              if (event.request.url.includes('.png') || 
                  event.request.url.includes('.ico') ||
                  event.request.url.includes('.jpg')) {
                return new Response(null, {status: 404});
              }
              return new Response('Сталася помилка мережі', {
                status: 503,
                headers: new Headers({
                  'Content-Type': 'text/plain'
                })
              });
            });
        })
    );
  }
});

self.addEventListener('activate', (event) => {
  const CACHE_NAME = 'phone-number-grabber-v5'; // Той самий оновлений кеш
  const cacheWhitelist = [CACHE_NAME];
  event.waitUntil(
    caches.keys().then((cacheNames) => {
      return Promise.all(
        cacheNames.map((cacheName) => {
          if (cacheWhitelist.indexOf(cacheName) === -1) {
            console.log('Видалення застарілого кешу:', cacheName);
            return caches.delete(cacheName);
          }
          return null;
        })
      );
    })
  );
  // Захоплюємо клієнтів для керування всіма відкритими клієнтами без перезавантаження
  event.waitUntil(clients.claim());
});

// Обробка повідомлень від клієнтів
self.addEventListener('message', (event) => {
  if (event.data && event.data.type === 'SKIP_WAITING') {
    self.skipWaiting();
  }
});
