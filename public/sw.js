const CACHE_PREFIX = "edo-joka-kitan-";
const SHELL_CACHE = `${CACHE_PREFIX}shell-v1`;
const ASSET_CACHE = `${CACHE_PREFIX}assets-v1`;
const ACTIVE_CACHES = new Set([SHELL_CACHE, ASSET_CACHE]);

const PRECACHE_PATHS = [
  "./",
  "./index.html",
  "./manifest.webmanifest",
  "./icons/icon-192.png",
  "./icons/icon-512.png",
];

const resolveScopeUrl = (relativePath) =>
  new URL(relativePath, self.registration.scope).toString();

self.addEventListener("install", (event) => {
  event.waitUntil(
    caches
      .open(SHELL_CACHE)
      .then((cache) => cache.addAll(PRECACHE_PATHS.map(resolveScopeUrl)))
      .then(() => self.skipWaiting()),
  );
});

self.addEventListener("activate", (event) => {
  event.waitUntil(
    caches
      .keys()
      .then((keys) =>
        Promise.all(
          keys
            .filter(
              (key) => key.startsWith(CACHE_PREFIX) && !ACTIVE_CACHES.has(key),
            )
            .map((key) => caches.delete(key)),
        ),
      )
      .then(() => self.clients.claim()),
  );
});

const handleNavigateRequest = async (request) => {
  const indexUrl = resolveScopeUrl("./index.html");
  try {
    const networkResponse = await fetch(request);
    if (networkResponse.ok) {
      const cache = await caches.open(SHELL_CACHE);
      await cache.put(indexUrl, networkResponse.clone());
    }
    return networkResponse;
  } catch {
    const cachedIndex = await caches.match(indexUrl);
    if (cachedIndex) {
      return cachedIndex;
    }
    const cachedRoot = await caches.match(resolveScopeUrl("./"));
    if (cachedRoot) {
      return cachedRoot;
    }
    return new Response("Offline", {
      status: 503,
      statusText: "Service Unavailable",
      headers: { "Content-Type": "text/plain; charset=utf-8" },
    });
  }
};

const handleImmutableAssetRequest = async (request) => {
  const cached = await caches.match(request);
  if (cached) {
    return cached;
  }
  const networkResponse = await fetch(request);
  if (networkResponse.ok) {
    const cache = await caches.open(ASSET_CACHE);
    await cache.put(request, networkResponse.clone());
  }
  return networkResponse;
};

const handleStaticRequest = async (request) => {
  try {
    const networkResponse = await fetch(request);
    if (networkResponse.ok) {
      const cache = await caches.open(SHELL_CACHE);
      await cache.put(request, networkResponse.clone());
    }
    return networkResponse;
  } catch {
    const cached = await caches.match(request);
    if (cached) {
      return cached;
    }
    return new Response("Offline", {
      status: 503,
      statusText: "Service Unavailable",
      headers: { "Content-Type": "text/plain; charset=utf-8" },
    });
  }
};

self.addEventListener("fetch", (event) => {
  const { request } = event;
  if (request.method !== "GET") {
    return;
  }

  const url = new URL(request.url);
  if (url.origin !== self.location.origin) {
    return;
  }

  if (!url.href.startsWith(self.registration.scope)) {
    return;
  }

  if (request.mode === "navigate") {
    event.respondWith(handleNavigateRequest(request));
    return;
  }

  if (url.pathname.includes("/assets/")) {
    event.respondWith(handleImmutableAssetRequest(request));
    return;
  }

  event.respondWith(handleStaticRequest(request));
});
