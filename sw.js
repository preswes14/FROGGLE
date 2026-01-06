// FROGGLE Service Worker - Offline PWA Support
const CACHE_NAME = 'froggle-v12.72';
const ASSETS_TO_CACHE = [
  './',
  './index.html',
  './manifest.json',
  './assets/tapo.png',
  './assets/tapo-icon.png',
  './assets/tapo-icon-180.png',
  './assets/froggle_title.png',
  './assets/ribbleton.png',
  './assets/victory-room.png'
];

// Install event - cache core assets
self.addEventListener('install', event => {
  event.waitUntil(
    caches.open(CACHE_NAME).then(cache => {
      console.log('[SW] Caching core assets');
      return cache.addAll(ASSETS_TO_CACHE);
    })
  );
  // Activate immediately
  self.skipWaiting();
});

// Activate event - clean up old caches
self.addEventListener('activate', event => {
  event.waitUntil(
    caches.keys().then(cacheNames => {
      return Promise.all(
        cacheNames
          .filter(name => name.startsWith('froggle-') && name !== CACHE_NAME)
          .map(name => {
            console.log('[SW] Deleting old cache:', name);
            return caches.delete(name);
          })
      );
    })
  );
  // Take control of all pages immediately
  self.clients.claim();
});

// Fetch event - serve from cache, fall back to network
self.addEventListener('fetch', event => {
  // Skip non-GET requests
  if (event.request.method !== 'GET') return;

  // Skip cross-origin requests
  if (!event.request.url.startsWith(self.location.origin)) return;

  event.respondWith(
    caches.match(event.request).then(cachedResponse => {
      if (cachedResponse) {
        // Return cached version
        return cachedResponse;
      }

      // Not in cache - fetch from network
      return fetch(event.request).then(response => {
        // Don't cache non-successful responses
        if (!response || response.status !== 200 || response.type !== 'basic') {
          return response;
        }

        // Clone the response for caching
        const responseToCache = response.clone();

        // Cache assets (images, fonts) but not external resources
        if (event.request.url.includes('/assets/') ||
            event.request.url.endsWith('.html') ||
            event.request.url.endsWith('.json')) {
          caches.open(CACHE_NAME).then(cache => {
            cache.put(event.request, responseToCache);
          });
        }

        return response;
      }).catch(() => {
        // Network failed - return offline fallback for HTML requests
        if (event.request.headers.get('accept').includes('text/html')) {
          return caches.match('./index.html');
        }
      });
    })
  );
});
