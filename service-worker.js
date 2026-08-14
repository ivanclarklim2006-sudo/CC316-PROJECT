// Bump this on every deploy that changes index.html/manifest/icons. Changing
// this string is what makes the browser see the service worker file as
// "different" and install the update — without a change here, some browsers
// may not even notice a new deploy happened.
const CACHE_NAME = "roll-register-v2";
const ASSETS = [
  "./",
  "./index.html",
  "./manifest.json",
  "./icon-192.png",
  "./icon-512.png"
];

self.addEventListener("install", (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME).then((cache) => cache.addAll(ASSETS))
  );
  self.skipWaiting();
});

self.addEventListener("activate", (event) => {
  event.waitUntil(
    caches.keys().then((keys) =>
      Promise.all(keys.filter((k) => k !== CACHE_NAME).map((k) => caches.delete(k)))
    )
  );
  self.clients.claim();
});

// Network-first, falling back to cache. This is the actual fix for "users
// need to clear their history to see updates": as long as they're online,
// they always get the live file from GitHub Pages, never a stale cached
// copy — the cache only kicks in as an offline fallback. This matters more
// than the CACHE_NAME bump above; that bump helps precache correctly on
// install, but this strategy is what guarantees freshness on every load.
self.addEventListener("fetch", (event) => {
  if (event.request.method !== "GET") return;

  event.respondWith(
    fetch(event.request)
      .then((response) => {
        const copy = response.clone();
        caches.open(CACHE_NAME).then((cache) => cache.put(event.request, copy));
        return response;
      })
      .catch(() => caches.match(event.request).then((cached) => cached || caches.match("./index.html")))
  );
});
