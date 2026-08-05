const CACHE_NAME = "pooja-samagri-pwa-v1";

const APP_FILES = [
  "./",
  "./index.html",
  "./manifest.json",
  "./icon-192.png",
  "./icon-512.png",
  "./logo.png"
];

const HTML2CANVAS_URL =
  "https://cdnjs.cloudflare.com/ajax/libs/html2canvas/1.4.1/html2canvas.min.js";

self.addEventListener("install", event => {
  event.waitUntil(
    caches.open(CACHE_NAME).then(async cache => {
      await cache.addAll(APP_FILES);

      // Try to cache html2canvas as an opaque response for offline use.
      try {
        const response = await fetch(HTML2CANVAS_URL, { mode: "no-cors" });
        await cache.put(HTML2CANVAS_URL, response);
      } catch (e) {
        console.log("html2canvas cache skipped:", e);
      }
    }).then(() => self.skipWaiting())
  );
});

self.addEventListener("activate", event => {
  event.waitUntil(
    caches.keys().then(keys =>
      Promise.all(
        keys
          .filter(key => key !== CACHE_NAME)
          .map(key => caches.delete(key))
      )
    ).then(() => self.clients.claim())
  );
});

self.addEventListener("fetch", event => {
  const request = event.request;

  event.respondWith(
    caches.match(request).then(cached => {
      if (cached) return cached;

      return fetch(request).then(response => {
        // Cache same-origin GET requests for better offline reliability.
        if (request.method === "GET" && new URL(request.url).origin === self.location.origin) {
          const copy = response.clone();
          caches.open(CACHE_NAME).then(cache => cache.put(request, copy));
        }
        return response;
      });
    }).catch(() => {
      if (request.mode === "navigate") {
        return caches.match("./index.html");
      }
    })
  );
});
