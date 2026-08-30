const CACHE = "dg-predictor-v3";
const CORE_ASSETS = ["./", "./index.html", "./style.css", "./app.js", "./i18n.js", "./manifest.json"];

self.addEventListener("install", (event) => {
  event.waitUntil(caches.open(CACHE).then((c) => c.addAll(CORE_ASSETS)));
  self.skipWaiting();
});

self.addEventListener("activate", (event) => {
  event.waitUntil(
    caches.keys().then((keys) => Promise.all(keys.filter((k) => k !== CACHE).map((k) => caches.delete(k))))
  );
  self.clients.claim();
});

// Network-first for everything: the dashboard changes often (new draws,
// new features), so freshness matters more than offline support. Cache is
// only a fallback for when the network is unavailable.
self.addEventListener("fetch", (event) => {
  event.respondWith(
    fetch(event.request)
      .then((res) => {
        // Only ever store a good GET response. Caching a 404 or a 5xx -- which
        // can happen for a moment while a new deploy swaps in -- would poison
        // the cache and keep serving that error page as the offline fallback.
        if (event.request.method === "GET" && res.ok && res.type !== "opaque") {
          const copy = res.clone();
          caches.open(CACHE).then((c) => c.put(event.request, copy)).catch(() => {});
        }
        return res;
      })
      .catch(() => caches.match(event.request))
  );
});
