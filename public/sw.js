const CACHE_VERSION = "gbh-v2026-05-26";
const CACHE_NAME = CACHE_VERSION;
const STATIC_ASSETS = ["/", "/index.html", "/static/js/main.chunk.js", "/static/js/bundle.js", "/manifest.json"];

self.addEventListener("install", e => {
  self.skipWaiting();
  e.waitUntil(
    caches.open(CACHE_NAME).then(cache => cache.addAll(STATIC_ASSETS).catch(() => {}))
  );
});

self.addEventListener("activate", e => {
  e.waitUntil(
    caches.keys().then(keys =>
      Promise.all(keys.filter(k => k !== CACHE_NAME).map(k => caches.delete(k)))
    ).then(() => self.clients.claim())
  );
});

self.addEventListener("fetch", e => {
  if (e.request.method !== "GET") return;
  const url = new URL(e.request.url);
  // Supabase y API: siempre red
  if (url.hostname.includes("supabase") || url.hostname.includes("anthropic")) return;
  e.respondWith(
    caches.match(e.request).then(cached => {
      const network = fetch(e.request).then(res => {
        if (res.ok && res.type === "basic") {
          const clone = res.clone();
          caches.open(CACHE_NAME).then(c => c.put(e.request, clone));
        }
        return res;
      });
      return cached || network;
    })
  );
});

// Notificar a los clientes cuando hay nueva versión disponible
self.addEventListener("message", e => {
  if (e.data === "skipWaiting") self.skipWaiting();
});
