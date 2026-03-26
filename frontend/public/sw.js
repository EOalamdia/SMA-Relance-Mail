// Minimal Service Worker to satisfy PWA install criteria
const CACHE_NAME = "sma-pwa-v2";

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
  const { request } = event

  // Non-GET requests: keep network behavior but always return a Response on failure.
  if (request.method !== "GET") {
    event.respondWith(
      fetch(request).catch(
        () =>
          new Response(JSON.stringify({ detail: "Offline" }), {
            status: 503,
            statusText: "Service Unavailable",
            headers: { "Content-Type": "application/json" },
          }),
      ),
    )
    return
  }

  // GET requests: network-first with cache fallback.
  event.respondWith(
    fetch(request).catch(async () => {
      const cachedResponse = await caches.match(request)
      if (cachedResponse) return cachedResponse
      return new Response("Offline", { status: 503, statusText: "Service Unavailable" })
    }),
  )
});
