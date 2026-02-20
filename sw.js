// Service worker for offline caching (demo)
const CACHE = 'bs-cache-v2'; // bumped version to force update
const ASSETS = [
  '.',
  '/index.html',
  '/styles.css',
  '/app.js',
  '/auth.js',
  '/resident-auth.js',
  '/manifest.json',
  '/bank-sampah-icon.svg'
];

self.addEventListener('install', event => {
  event.waitUntil(
    caches.open(CACHE).then(cache => cache.addAll(ASSETS))
  );
  self.skipWaiting();
});

self.addEventListener('activate', event => {
  // Claim clients so the new service worker starts controlling pages immediately
  event.waitUntil(self.clients.claim());
});

self.addEventListener('fetch', event => {
  const req = event.request;
  const url = new URL(req.url);

  // Fallback: if an old manifest still requests /icons/icon-192.png, serve the SVG instead
  if (url.pathname === '/icons/icon-192.png' || url.pathname === '/icons/icon-512.png') {
    event.respondWith(
      caches.match('/bank-sampah-icon.svg').then(resp => resp || fetch('/bank-sampah-icon.svg'))
    );
    return;
  }

  // Normal cache-first strategy
  event.respondWith(
    caches.match(req).then(cached => cached || fetch(req))
  );
});
