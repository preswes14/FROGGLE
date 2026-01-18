// FROGGLE Service Worker - Offline PWA Support
const CACHE_NAME = 'froggle-v1.04';
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
  console.log('[SW] Installing new version:', CACHE_NAME);
  event.waitUntil(
    caches.open(CACHE_NAME).then(cache => {
      console.log('[SW] Caching core assets');
      return cache.addAll(ASSETS_TO_CACHE);
    })
  );
  // Activate immediately (don't wait for old SW to be released)
  self.skipWaiting();
});

// Listen for skip waiting message from client
self.addEventListener('message', event => {
  if (event.data && event.data.type === 'SKIP_WAITING') {
    console.log('[SW] Received SKIP_WAITING message, activating...');
    self.skipWaiting();
  }
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

// Fetch event - different strategies for different content types
self.addEventListener('fetch', event => {
  // Skip non-GET requests
  if (event.request.method !== 'GET') return;

  // Skip cross-origin requests
  if (!event.request.url.startsWith(self.location.origin)) return;

  const url = new URL(event.request.url);
  const isHTML = event.request.headers.get('accept')?.includes('text/html') ||
                 url.pathname.endsWith('.html') ||
                 url.pathname === '/' ||
                 url.pathname === '';

  if (isHTML) {
    // NETWORK-FIRST for HTML - always try to get latest version
    event.respondWith(
      fetch(event.request)
        .then(response => {
          // Got network response - cache it and return
          if (response && response.status === 200 && response.type === 'basic') {
            const responseToCache = response.clone();
            caches.open(CACHE_NAME).then(cache => {
              cache.put(event.request, responseToCache);
            });
          }
          return response;
        })
        .catch(() => {
          // Network failed - fall back to cache for offline support
          console.log('[SW] Network failed for HTML, using cache');
          return caches.match(event.request).then(cached => {
            return cached || caches.match('./index.html');
          });
        })
    );
  } else {
    // CACHE-FIRST for assets (images, json, etc.) - performance optimization
    event.respondWith(
      caches.match(event.request).then(cachedResponse => {
        if (cachedResponse) {
          return cachedResponse;
        }

        // Not in cache - fetch from network
        return fetch(event.request).then(response => {
          if (!response || response.status !== 200 || response.type !== 'basic') {
            return response;
          }

          // Cache assets for future use
          if (event.request.url.includes('/assets/') ||
              event.request.url.endsWith('.json')) {
            const responseToCache = response.clone();
            caches.open(CACHE_NAME).then(cache => {
              cache.put(event.request, responseToCache);
            });
          }

          return response;
        });
      })
    );
  }
});
