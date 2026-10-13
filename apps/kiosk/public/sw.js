const CACHE_NAME = 'fazah-garage-v2';
const STATIC_ASSETS = [
  '/',
  '/index.html',
  '/manifest.json',
  '/logo.png',
  '/favicon.png',
  '/favicon.ico'
];

self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME).then(async (cache) => {
      // Use individual caching with catch to prevent any single asset 404 from breaking the install
      for (const asset of STATIC_ASSETS) {
        try {
          await cache.add(asset);
        } catch (e) {
          console.warn('PWA: Failed to precache asset:', asset, e);
        }
      }
    })
  );
  self.skipWaiting();
});

self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys().then((cacheNames) => {
      return Promise.all(
        cacheNames.map((name) => {
          if (name !== CACHE_NAME) {
            console.log('PWA: Deleting old cache:', name);
            return caches.delete(name);
          }
        })
      );
    })
  );
  self.clients.claim();
});

self.addEventListener('fetch', (event) => {
  const { request } = event;
  const url = new URL(request.url);

  // 1. API Requests: Always Network-First (Do not cache sensitive dynamic API calls)
  if (url.pathname.includes('/api/')) {
    event.respondWith(
      fetch(request).catch(() => {
        return new Response(
          JSON.stringify({ error: 'Offline', message: 'You are currently offline. Please check your internet connection.' }),
          { status: 503, headers: { 'Content-Type': 'application/json' } }
        );
      })
    );
    return;
  }

  // 2. SPA Navigation Requests (e.g. user visits /kiosk, /portal, /admin):
  // Try network first, fall back to cached /index.html if offline or network fails
  if (request.mode === 'navigate') {
    event.respondWith(
      fetch(request)
        .catch(async () => {
          const cached = await caches.match('/index.html');
          if (cached) return cached;
          return caches.match('/');
        })
    );
    return;
  }

  // 3. Static Assets (CSS, JS, Fonts, Images): Cache First with network update
  event.respondWith(
    caches.match(request).then((cachedResponse) => {
      if (cachedResponse) {
        // Fetch newer version in background
        fetch(request).then((networkResponse) => {
          if (networkResponse && networkResponse.status === 200 && networkResponse.type === 'basic') {
            caches.open(CACHE_NAME).then((cache) => cache.put(request, networkResponse));
          }
        }).catch(() => {});
        return cachedResponse;
      }

      return fetch(request).then((networkResponse) => {
        if (!networkResponse || networkResponse.status !== 200 || networkResponse.type !== 'basic') {
          return networkResponse;
        }
        const responseToCache = networkResponse.clone();
        caches.open(CACHE_NAME).then((cache) => {
          cache.put(request, responseToCache);
        });
        return networkResponse;
      }).catch(() => {
        // Fallback for image requests
        if (request.destination === 'image') {
          return caches.match('/logo.png');
        }
      });
    })
  );
});
