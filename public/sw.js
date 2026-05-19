// ─── GBH Nutrición — Service Worker ─────────────────────────────────────────
// Solo caché offline. Sin auto-reload. Las actualizaciones aplican en la
// próxima apertura de la app (comportamiento nativo del browser).
const CACHE_VERSION = "gbh-v2026-05-18";
const CACHE_NAME    = CACHE_VERSION;
const SHELL         = ["/", "/index.html"];

self.addEventListener("install", (e) => {
  e.waitUntil(caches.open(CACHE_NAME).then((c) => c.addAll(SHELL)));
  // NO skipWaiting — el nuevo SW espera hasta que el usuario cierre la app
});

self.addEventListener("activate", (e) => {
  // Borrar cachés antiguas
  e.waitUntil(
    caches.keys().then((keys) =>
      Promise.all(keys.filter((k) => k !== CACHE_NAME).map((k) => caches.delete(k)))
    )
  );
  // NO clients.claim() — evita forzar control inmediato y bucles de recarga
});

self.addEventListener("fetch", (e) => {
  const { request } = e;
  const url = new URL(request.url);
  if (url.origin !== self.location.origin) return;

  // HTML/JS: network-first (siempre fresco si hay red)
  const isShell =
    request.mode === "navigate" ||
    url.pathname.endsWith(".js") ||
    url.pathname === "/";

  if (isShell) {
    e.respondWith(
      fetch(request)
        .then((res) => {
          const clone = res.clone();
          caches.open(CACHE_NAME).then((c) => c.put(request, clone));
          return res;
        })
        .catch(() => caches.match(request)) // offline fallback
    );
    return;
  }

  // Assets estáticos: cache-first
  e.respondWith(
    caches.match(request).then((cached) => {
      if (cached) return cached;
      return fetch(request).then((res) => {
        const clone = res.clone();
        caches.open(CACHE_NAME).then((c) => c.put(request, clone));
        return res;
      });
    })
  );
});
