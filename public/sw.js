// GBH Nutrición — Service Worker
// CACHE_VERSION: gbh-v2026-05-19

const CACHE_VERSION = "gbh-v2026-05-19";
const STATIC_CACHE  = `${CACHE_VERSION}-static`;
const DATA_CACHE    = `${CACHE_VERSION}-data`;

const STATIC_ASSETS = [
  "/",
  "/index.html",
  "/manifest.json",
];

// ── Instalar: cachear assets estáticos ───────────────────────────────────────
self.addEventListener("install", (e) => {
  self.skipWaiting();
  e.waitUntil(
    caches.open(STATIC_CACHE).then((cache) => cache.addAll(STATIC_ASSETS))
  );
});

// ── Activar: limpiar caches viejas ───────────────────────────────────────────
self.addEventListener("activate", (e) => {
  e.waitUntil(
    caches.keys().then((keys) =>
      Promise.all(
        keys
          .filter((k) => k !== STATIC_CACHE && k !== DATA_CACHE)
          .map((k) => caches.delete(k))
      )
    ).then(() => self.clients.claim())
  );
});

// ── Fetch: network-first para API, cache-first para estáticos ────────────────
self.addEventListener("fetch", (e) => {
  const { request } = e;
  const url = new URL(request.url);

  // Supabase y APIs externas → siempre red, sin cachear
  if (
    url.hostname.includes("supabase.co") ||
    url.hostname.includes("onesignal.com") ||
    url.hostname.includes("mymemory.translated.net")
  ) {
    return; // deja pasar sin interceptar
  }

  // Navegación → servir index.html cacheado (SPA)
  if (request.mode === "navigate") {
    e.respondWith(
      fetch(request).catch(() =>
        caches.match("/index.html")
      )
    );
    return;
  }

  // Assets estáticos → cache-first, fallback a red
  e.respondWith(
    caches.match(request).then((cached) => {
      if (cached) return cached;
      return fetch(request).then((response) => {
        if (!response || response.status !== 200 || response.type === "opaque") {
          return response;
        }
        const cloned = response.clone();
        caches.open(STATIC_CACHE).then((cache) => cache.put(request, cloned));
        return response;
      });
    })
  );
});

// ── Sin auto-reload para evitar bucles en Vercel ──────────────────────────────
// No escuchamos el evento "message" de skipWaiting automático.
// La actualización ocurre en la próxima visita natural del usuario.
