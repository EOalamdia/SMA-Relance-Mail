// Minimal Service Worker to satisfy PWA install criteria
// Match the proven stable version from Parcours-Tech
const CACHE_NAME = 'app-starter-pwa-v2';

self.addEventListener('install', (event) => {
  self.skipWaiting(); // Force active immediately
  event.waitUntil(caches.open(CACHE_NAME));
});

self.addEventListener('activate', (event) => {
  event.waitUntil(clients.claim()); // Take control of all clients immediately
});

self.addEventListener('fetch', (event) => {
  // Network-first by default, with cache fallback
  event.respondWith(
    fetch(event.request).catch(() => caches.match(event.request))
  );
});
