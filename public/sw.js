const CACHE_NAME = 'helparo-v1';
const OFFLINE_URL = '/offline.html';

// Assets to cache immediately
const PRECACHE_ASSETS = [
  '/offline.html',
  '/favicon.ico',
  '/logo.svg',
];

// Install event - cache offline page
self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME).then((cache) => {
      console.log('[SW] Precaching offline assets');
      return cache.addAll(PRECACHE_ASSETS);
    })
  );
  self.skipWaiting();
});

// Activate event - clean old caches
self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys().then((cacheNames) => {
      return Promise.all(
        cacheNames.map((cacheName) => {
          if (cacheName !== CACHE_NAME) {
            console.log('[SW] Deleting old cache:', cacheName);
            return caches.delete(cacheName);
          }
        })
      );
    })
  );
  self.clients.claim();
});

// Fetch event - serve offline page when network fails
self.addEventListener('fetch', (event) => {
  // Only handle navigation requests (page loads)
  if (event.request.mode === 'navigate') {
    event.respondWith(
      fetch(event.request)
        .then((response) => {
          // If response is a 404 or other error, still show the page (let Next.js handle it)
          return response;
        })
        .catch(() => {
          // Network failed - show offline page
          // Store the URL user was trying to visit
          return caches.match(OFFLINE_URL).then((response) => {
            // Inject script to save original URL to sessionStorage
            if (response) {
              return response.text().then((html) => {
                const modifiedHtml = html.replace(
                  '</head>',
                  `<script>sessionStorage.setItem('helparo_offline_url', '${event.request.url}');</script></head>`
                );
                return new Response(modifiedHtml, {
                  headers: { 'Content-Type': 'text/html' }
                });
              });
            }
            return response;
          });
        })
    );
    return;
  }

  // For other requests, try network first, then cache
  event.respondWith(
    fetch(event.request)
      .then((response) => {
        // Cache successful responses for static assets
        if (response.ok && event.request.url.match(/\.(js|css|png|jpg|jpeg|gif|svg|ico|woff|woff2)$/)) {
          const responseClone = response.clone();
          caches.open(CACHE_NAME).then((cache) => {
            cache.put(event.request, responseClone);
          });
        }
        return response;
      })
      .catch(() => {
        // Try to serve from cache
        return caches.match(event.request);
      })
  );
});
