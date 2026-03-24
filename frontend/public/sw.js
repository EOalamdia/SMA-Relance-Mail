// Minimal Service Worker to satisfy PWA install criteria
const CACHE_NAME = "sma-pwa-v1";

self.addEventListener("install", (event) => {
  self.skipWaiting(); // Force active immediately
  event.waitUntil(caches.open(CACHE_NAME));
});

self.addEventListener("activate", (event) => {
  event.waitUntil(
    Promise.all([
      clients.claim(), // Take control of all clients immediately
      caches.keys().then((keys) =>
        Promise.all(
          keys
            .filter((key) => key !== CACHE_NAME && (key.startsWith("app-starter-pwa-") || key.startsWith("sma-pwa-")))
            .map((key) => caches.delete(key)),
        ),
      ),
    ]),
  );
});

self.addEventListener("fetch", (event) => {
  // Network-first by default, with cache fallback
  event.respondWith(
    fetch(event.request).catch(() => caches.match(event.request)),
  );
});
