const cacheName = "nirka-inventory-shell-v3";

// Content-hashed build output (the /assets/* JavaScript and CSS chunks) is
// deliberately NOT handled by this worker.
//
// When a service worker answers a module request from Cache Storage, Chrome
// discards the matching <link rel="modulepreload"> hint with "is not used
// because it is a cross-world service worker resource mismatch" and then
// "was preloaded using link preload but not used within a few seconds". The
// preloaded bytes are downloaded and thrown away on every visit.
//
// Those files are immutable and served with a one-year cache header, so the
// browser HTTP cache already covers them offline. Skipping them here also
// prevents an older cached chunk from being served after a new deployment.
const buildAssetPrefixes = ["/assets/", "/_next/"];

function isBuildAsset(pathname) {
  return buildAssetPrefixes.some((prefix) => pathname.startsWith(prefix));
}

// Take over immediately so an existing installation stops intercepting build
// assets on the next visit, and drop the outdated shell caches left behind.
self.addEventListener("install", () => {
  self.skipWaiting();
});

self.addEventListener("activate", (event) => {
  event.waitUntil(
    (async () => {
      const keys = await caches.keys();

      await Promise.all(
        keys
          .filter(
            (key) =>
              key.startsWith("nirka-inventory-shell-") && key !== cacheName,
          )
          .map((key) => caches.delete(key)),
      );

      await self.clients.claim();
    })(),
  );
});

self.addEventListener("fetch", (event) => {
  const request = event.request;

  if (request.method !== "GET") return;

  const url = new URL(request.url);

  if (url.origin !== self.location.origin) return;

  // Let the browser (and its HTTP cache) handle build output and fonts.
  if (isBuildAsset(url.pathname)) return;

  const developmentAsset =
    url.pathname.startsWith("/@vite/") ||
    url.pathname.startsWith("/@id/") ||
    url.pathname.startsWith("/node_modules/") ||
    url.pathname.startsWith("/src/") ||
    url.pathname.startsWith("/app/");

  if (developmentAsset) return;

  if (request.mode === "navigate") {
    event.respondWith(
      (async () => {
        try {
          const response = await fetch(request);

          if (response.ok) {
            const cache = await caches.open(cacheName);
            await cache.put("/", response.clone());
          }

          return response;
        } catch {
          return (
            (await caches.match("/")) ||
            new Response("Offline", {
              status: 503,
              statusText: "Offline",
            })
          );
        }
      })(),
    );

    return;
  }

  event.respondWith(
    (async () => {
      const cached = await caches.match(request);

      if (cached) {
        return cached;
      }

      try {
        const response = await fetch(request);

        if (response.ok) {
          const cache = await caches.open(cacheName);
          await cache.put(request, response.clone());
        }

        return response;
      } catch {
        return new Response(null, {
          status: 504,
          statusText: "Network Error",
        });
      }
    })(),
  );
});
