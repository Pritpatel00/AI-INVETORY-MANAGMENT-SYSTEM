const cacheName = "nirka-inventory-shell-v2";
const appShell = ["/", "/manifest.webmanifest", "/favicon.svg"];

self.addEventListener("fetch", (event) => {
  const request = event.request;

  if (request.method !== "GET") return;

  const url = new URL(request.url);

  if (url.origin !== self.location.origin) return;

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