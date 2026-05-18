// ─── GBH Nutrición — Service Worker ─────────────────────────────────────────
// Cambia CACHE_VERSION con cada deploy para forzar la actualización.
// Puedes automatizarlo en GitHub Actions inyectando la fecha/commit hash.

const CACHE_VERSION = "gbh-v__BUILD_DATE__";  // reemplaza __BUILD_DATE__ en CI, o cámbialo manualmente
const CACHE_NAME    = CACHE_VERSION;

// Archivos del shell de la app (ajusta rutas a tu repo)
const SHELL = [
  "/",
  "/index.html",
  "/GBH_App_Progreso.jsx",  // o el bundle generado por Vite/CRA
];

// ── Install: pre-cachear shell ────────────────────────────────────────────────
self.addEventListener("install", (e) => {
  e.waitUntil(
    caches.open(CACHE_NAME).then((c) => c.addAll(SHELL))
  );
  // Actívate inmediatamente sin esperar a que cierren las pestañas viejas
  self.skipWaiting();
});

// ── Activate: borrar cachés viejas ───────────────────────────────────────────
self.addEventListener("activate", (e) => {
  e.waitUntil(
    caches.keys().then((keys) =>
      Promise.all(
        keys
          .filter((k) => k !== CACHE_NAME)
          .map((k) => {
            console.log("[SW] Eliminando caché antigua:", k);
            return caches.delete(k);
          })
      )
    )
  );
  // Tomar control de todas las pestañas abiertas de inmediato
  self.clients.claim();
});

// ── Fetch: network-first para HTML/JS, cache-first para assets ───────────────
self.addEventListener("fetch", (e) => {
  const { request } = e;
  const url = new URL(request.url);

  // Solo interceptar peticiones del mismo origen
  if (url.origin !== self.location.origin) return;

  // HTML y JS principales → network-first (siempre fresco si hay red)
  const isShell =
    request.mode === "navigate" ||
    url.pathname.endsWith(".js") ||
    url.pathname.endsWith(".jsx") ||
    url.pathname === "/";

  if (isShell) {
    e.respondWith(
      fetch(request)
        .then((res) => {
          // Actualizar caché con la respuesta fresca
          const clone = res.clone();
          caches.open(CACHE_NAME).then((c) => c.put(request, clone));
          return res;
        })
        .catch(() => caches.match(request)) // fallback offline
    );
    return;
  }

  // Assets (imágenes, fonts, CSS) → cache-first
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

// ── Mensaje desde la app: "SKIP_WAITING" → activar nueva versión ─────────────
self.addEventListener("message", (e) => {
  if (e.data?.type === "SKIP_WAITING") {
    self.skipWaiting();
  }
});
