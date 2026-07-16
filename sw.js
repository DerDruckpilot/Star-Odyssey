const CACHE_PREFIX = "star-odyssey-ui-";
const CACHE_NAME = `${CACHE_PREFIX}v3`;
const MAX_RUNTIME_ENTRIES = 240;
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
const CACHE_FIRST_EXTENSIONS = new Set([
  ".avif",
  ".gif",
  ".ico",
  ".jpeg",
  ".jpg",
  ".mp3",
  ".ogg",
  ".otf",
  ".png",
  ".svg",
  ".ttf",
  ".wav",
  ".webp",
  ".woff",
  ".woff2"
]);

self.addEventListener("install", (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME).then(async (cache) => {
      await Promise.all(CORE_ASSETS.map(async (path) => {
        try {
          const response = await fetch(new URL(path, self.registration.scope), { cache: "reload" });
          if (response.ok) await cache.put(getCacheKey(response.url), response);
        } catch {
          // Optional shell files can be recovered by the normal fetch path.
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

function getCacheKey(requestOrUrl) {
  const request = typeof requestOrUrl === "string" ? new Request(requestOrUrl) : requestOrUrl;
  const url = new URL(request.url);
  url.hash = "";
  return new Request(url.toString(), { method: "GET" });
}

function getExtension(pathname) {
  const filename = pathname.slice(pathname.lastIndexOf("/") + 1);
  const dotIndex = filename.lastIndexOf(".");
  return dotIndex >= 0 ? filename.slice(dotIndex).toLowerCase() : "";
}

async function cacheFirst(request, event) {
  const cache = await caches.open(CACHE_NAME);
  const cacheKey = getCacheKey(request);
  const cached = await cache.match(cacheKey);
  if (cached) return cached;

  try {
    const response = await fetch(request);
    if (response.ok) {
      await cache.put(cacheKey, response.clone());
      event?.waitUntil(trimRuntimeCache(cache));
    }
    return response;
  } catch {
    return Response.error();
  }
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

async function trimRuntimeCache(cache) {
  const keys = await cache.keys();
  if (keys.length <= MAX_RUNTIME_ENTRIES) return;
  await Promise.all(keys.slice(0, keys.length - MAX_RUNTIME_ENTRIES).map((key) => cache.delete(key)));
}

self.addEventListener("fetch", (event) => {
  const request = event.request;
  if (request.method !== "GET") return;
  const url = new URL(request.url);
  if (url.origin !== self.location.origin) return;
  if (url.pathname.startsWith("/api/") || url.pathname === "/ws") return;

  const extension = getExtension(url.pathname);
  if (request.mode === "navigate" || !CACHE_FIRST_EXTENSIONS.has(extension)) {
    event.respondWith(networkFirst(request));
    return;
  }
  event.respondWith(cacheFirst(request, event));
});
