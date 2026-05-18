// ─── GBH Nutrición — Service Worker ─────────────────────────────────────────
const CACHE_VERSION = "gbh-v2026-05-18";
const CACHE_NAME    = CACHE_VERSION;

const SHELL = ["/", "/index.html"];

// Install: pre-cachear shell.
// ⚠️ NO llamamos skipWaiting() aquí — lo haría recargar en bucle en primera visita.
//    skipWaiting solo se activa cuando el usuario pulsa "Actualizar" (mensaje SKIP_WAITING).
self.addEventListener("install", (e) => {
  e.waitUntil(caches.open(CACHE_NAME).then((c) => c.addAll(SHELL)));
  // NO self.skipWaiting() aquí
});

// Activate: borrar cachés antiguas y tomar control de pestañas ya abiertas.
self.addEventListener("activate", (e) => {
  e.waitUntil(
    caches.keys().then((keys) =>
      Promise.all(keys.filter((k) => k !== CACHE_NAME).map((k) => caches.delete(k)))
    )
  );
  // clients.claim() para que este SW controle las pestañas abiertas sin recargar
  self.clients.claim();
});

// Fetch: network-first para HTML/JS, cache-first para assets estáticos.
self.addEventListener("fetch", (e) => {
  const { request } = e;
  const url = new URL(request.url);
  if (url.origin !== self.location.origin) return;

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
        .catch(() => caches.match(request))
    );
    return;
  }

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

// Mensaje desde la app: "SKIP_WAITING" → activar nueva versión ahora
// Solo se envía cuando el usuario toca el botón "Actualizar"
self.addEventListener("message", (e) => {
  if (e.data?.type === "SKIP_WAITING") self.skipWaiting();
});
