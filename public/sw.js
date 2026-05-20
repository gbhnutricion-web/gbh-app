// ─── GBH Service Worker ─────────────────────────────────────────────────────
const CACHE_VERSION = "gbh-v2026-05-20";
const CACHE_NAME = CACHE_VERSION;

const PRECACHE_URLS = [
  "/",
  "/index.html",
  "/manifest.json",
];

// ── Install ──────────────────────────────────────────────────────────────────
self.addEventListener("install", (event) => {
  self.skipWaiting();
  event.waitUntil(
    caches.open(CACHE_NAME).then((cache) => cache.addAll(PRECACHE_URLS))
  );
});

// ── Activate — purge old caches ──────────────────────────────────────────────
self.addEventListener("activate", (event) => {
  event.waitUntil(
    caches.keys().then((keys) =>
      Promise.all(
        keys
          .filter((k) => k !== CACHE_NAME)
          .map((k) => caches.delete(k))
      )
    ).then(() => self.clients.claim())
  );
});

// ── Fetch — network-first, fallback to cache ─────────────────────────────────
self.addEventListener("fetch", (event) => {
  // Skip non-GET and cross-origin requests (e.g. Supabase API)
  if (event.request.method !== "GET") return;
  const url = new URL(event.request.url);
  if (url.origin !== self.location.origin) return;

  event.respondWith(
    fetch(event.request)
      .then((response) => {
        // Clone and cache successful responses
        if (response && response.status === 200) {
          const clone = response.clone();
          caches.open(CACHE_NAME).then((cache) => cache.put(event.request, clone));
        }
        return response;
      })
      .catch(() => caches.match(event.request))
  );
});

// ── Push notifications ───────────────────────────────────────────────────────
self.addEventListener("push", (event) => {
  const data = event.data?.json() || {};
  event.waitUntil(
    self.registration.showNotification(data.title || "GBH Nutrición", {
      body: data.body || "¡No olvides tus misiones de hoy!",
      icon: data.icon || "/icon-192.png",
      badge: data.badge || "/icon-192.png",
      data: data,
    })
  );
});

self.addEventListener("notificationclick", (event) => {
  event.notification.close();
  event.waitUntil(clients.openWindow("/"));
});
