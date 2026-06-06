// ─────────────────────────────────────────────────────────────────────────────
//  GBH Nutrición · Service Worker (PWA)
//  CACHE_VERSION se actualiza en CADA entrega de cambios al JSX.
//  Formato: gbh-v2026-06-06YYYY-MM-DD
// ─────────────────────────────────────────────────────────────────────────────
const CACHE_VERSION = "gbh-v2026-06-06";
const APP_SHELL = ["/", "/index.html", "/manifest.json"];

// ── Install: precachea el app shell (sin romper si falta algún asset) ──────────
self.addEventListener("install", (event) => {
  event.waitUntil(
    caches.open(CACHE_VERSION).then((cache) =>
      cache.addAll(APP_SHELL).catch(() => {})
    )
  );
  // Activa la versión nueva en cuanto esté lista. NO recarga la página por sí solo
  // (la app no tiene handler de controllerchange), así que respeta el "sin auto-reload".
  self.skipWaiting();
});

// ── Activate: borra cachés de versiones anteriores ─────────────────────────────
self.addEventListener("activate", (event) => {
  event.waitUntil(
    caches
      .keys()
      .then((keys) =>
        Promise.all(
          keys.filter((k) => k !== CACHE_VERSION).map((k) => caches.delete(k))
        )
      )
      .then(() => self.clients.claim())
  );
});

// ── Fetch ──────────────────────────────────────────────────────────────────────
self.addEventListener("fetch", (event) => {
  const req = event.request;

  // 1) Nunca tocar escrituras (POST/PATCH/DELETE → Supabase, cola offline).
  if (req.method !== "GET") return;

  const url = new URL(req.url);

  // 2) Dejar pasar TODO lo que no sea de nuestro propio origen
  //    (Supabase, fuentes de Google, etc.) sin cachear ni interceptar.
  if (url.origin !== self.location.origin) return;

  // 3) Navegación / HTML → network-first: si hay red, sirve la versión más reciente
  //    (clave para una app que se actualiza a diario). Si no, cae a caché.
  if (req.mode === "navigate") {
    event.respondWith(
      fetch(req)
        .then((res) => {
          const copy = res.clone();
          caches.open(CACHE_VERSION).then((c) => c.put(req, copy));
          return res;
        })
        .catch(() =>
          caches.match(req).then((r) => r || caches.match("/index.html"))
        )
    );
    return;
  }

  // 4) Estáticos del propio origen → cache-first con relleno en segundo plano.
  event.respondWith(
    caches.match(req).then((cached) => {
      if (cached) return cached;
      return fetch(req)
        .then((res) => {
          if (res && res.ok && res.type === "basic") {
            const copy = res.clone();
            caches.open(CACHE_VERSION).then((c) => c.put(req, copy));
          }
          return res;
        })
        .catch(() => cached);
    })
  );
});
