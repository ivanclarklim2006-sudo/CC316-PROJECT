// Auto-updating cache: CACHE_NAME is generated below from this file's own
// install time, so a fresh cache bucket is created automatically every time
// the browser installs a new version of this script — no manual version
// string to remember to bump on deploy. (It only reinstalls when this
// file's bytes actually change, which is normal: touching index.html alone
// doesn't need a service-worker.js change at all, because of the
// network-first fetch strategy below — that's what actually keeps content
// fresh. This auto-versioned cache just makes sure precached assets like
// icons/manifest never get stuck on someone's browser after an update to
// this file specifically.)
const CACHE_BASE = "roll-register";
let CACHE_NAME = CACHE_BASE + "-v8"; // placeholder until install() sets the real, auto-generated name
const ASSETS = [
  "./",
  "./index.html",
  "./manifest.json",
  "./icon-192.png",
  "./icon-512.png"
];

self.addEventListener("install", (event) => {
  CACHE_NAME = `${CACHE_BASE}-${Date.now()}`;
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
// copy — the cache only kicks in as an offline fallback. Every successful
// fetch also re-writes the cache entry for that file, so the offline
// fallback keeps itself current too, on top of the auto-versioned cache
// bucket created at install above.
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
