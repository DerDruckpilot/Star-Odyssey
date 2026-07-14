const CACHE_PREFIX = "star-odyssey-ui-";
const CACHE_NAME = `${CACHE_PREFIX}v2`;
const CORE_ASSETS = [
  "./controller.html",
  "./controller.webmanifest",
  "./src/styles.css",
  "./src/controller.css",
  "./src/space-ui.css",
  "./src/controller.js",
  "./public/assets/ui/backgrounds/star-odyssey-interface-4k.webp",
  "./public/assets/ui/brand/star-odyssey-app-192.png",
  "./public/assets/ui/brand/star-odyssey-app-512.png"
];

self.addEventListener("install", (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME).then(async (cache) => {
      await Promise.all(CORE_ASSETS.map(async (path) => {
        try {
          const response = await fetch(new URL(path, self.registration.scope), { cache: "reload" });
          if (response.ok) await cache.put(response.url, response);
        } catch {
          // The controller remains network-capable when an optional preload fails.
        }
      }));
    }).then(() => self.skipWaiting())
  );
});

self.addEventListener("activate", (event) => {
  event.waitUntil(
    caches.keys()
      .then((keys) => Promise.all(keys
        .filter((key) => key.startsWith(CACHE_PREFIX) && key !== CACHE_NAME)
        .map((key) => caches.delete(key))))
      .then(() => self.clients.claim())
  );
});

function getCacheKey(request) {
  const url = new URL(request.url);
  url.search = "";
  url.hash = "";
  return new Request(url.toString(), { method: "GET" });
}

async function networkFirst(request) {
  const cache = await caches.open(CACHE_NAME);
  const cacheKey = getCacheKey(request);
  try {
    const response = await fetch(request, { cache: "no-cache" });
    if (response.ok) await cache.put(cacheKey, response.clone());
    return response;
  } catch {
    return (await cache.match(cacheKey)) || Response.error();
  }
}

self.addEventListener("fetch", (event) => {
  const request = event.request;
  if (request.method !== "GET") return;
  const url = new URL(request.url);
  if (url.origin !== self.location.origin || url.pathname.includes("/api/") || url.pathname.includes("/ws")) return;
  event.respondWith(networkFirst(request));
});
