// ─────────────────────────────────────────────────────────────────────────────
//  GBH Nutrición · Service Worker (PWA)
//  CACHE_VERSION se actualiza en CADA entrega de cambios al JSX.
//  Formato: gbh-vYYYY-MM-DD
// ─────────────────────────────────────────────────────────────────────────────
//  PUSH: retiradas (decisión del operador, 6-ago-2026). Aquí vivía el
//  importScripts del worker de OneSignal; se elimina junto con la
//  inicialización del SDK en App.jsx. Este worker ya solo hace caché/PWA.
//  No reintroducir sin decisión expresa.

const CACHE_VERSION = "gbh-v2026-08-30a";  // dominio propio en TODO lo que sale de la app: las 7 URL quemadas gbh-app.vercel.app pasan a app.gbhnutricion.es (tarjeta de progreso x2, install, invitar a un amigo ES/EN, recetas compartidas x2) — la direccion que se reparte ya es la que no caduca. Antes 25b: el toque de la manana ya NO se pierde: tras el relevo de dia se reaplica SOLO la diferencia que traia ese toque sobre el dia nuevo a cero (nunca el tLog de ayer entero); toggleM resuelve la fecha ANTES del `was`, que antes lo hacia salir mudo. Antes 25a: guardia de cambio de dia en saveLog + pageshow en el vigia: el primer toque tras reanudar un PWA de iPhone ya no escribe las banderas de AYER bajo la fecha de HOY. Antes 24j: manifest con iconos versionados (?v=): Android actualiza el icono solo al cambiar la URL. Antes 24i: iconos remasterizados.  // iconos remasterizados (Gemini): retrato centrado + manzana. Antes 24h: coste por receta + gasto real.  // coste por receta (ficha y detalle) + gasto real por receta (receta_gasto). Antes 24c: cola offline: los daily_logs del mismo dia se FUSIONAN en vez de sustituirse (sin conexion, un {meals_log} y un {diet_followed} del mismo dia se pisaban y se perdia uno).
const APP_SHELL = ["/", "/index.html", "/manifest.json"];

// ── Install: precachea el app shell y activa la versión nueva de inmediato ─────
self.addEventListener("install", (event) => {
  event.waitUntil(
    caches.open(CACHE_VERSION).then((cache) =>
      cache.addAll(APP_SHELL).catch(() => {})
    )
  );
  self.skipWaiting();
});

// ── Mensaje desde la app: forzar activación de la versión en espera ────────────
self.addEventListener("message", (event) => {
  if (event.data && event.data.type === "SKIP_WAITING") {
    self.skipWaiting();
  }
});

// ── Activate: borra cachés viejas, toma control y AVISA a las pestañas ─────────
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
      .then(() =>
        // Avisar a todas las pestañas abiertas de que hay versión nueva activa,
        // para que recarguen una sola vez y carguen el JS nuevo.
        self.clients.matchAll({ type: "window" }).then((clients) => {
          clients.forEach((client) =>
            client.postMessage({ type: "SW_UPDATED", version: CACHE_VERSION })
          );
        })
      )
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

  // 3) Navegación / HTML → network-first: si hay red, sirve la versión más reciente.
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

  // 4) Bundles JS/CSS con hash en el nombre (Vite) → network-first.
  //    Esto garantiza que SIEMPRE se descargue el código más reciente cuando
  //    hay conexión, evitando que un bundle viejo cacheado se sirva para siempre.
  //    El hash en el nombre hace que sea seguro (cada versión tiene su propio
  //    archivo), pero network-first añade una capa extra de frescura.
  const esBundle = /\.(js|css)$/.test(url.pathname);
  if (esBundle) {
    event.respondWith(
      fetch(req)
        .then((res) => {
          if (res && res.ok && res.type === "basic") {
            const copy = res.clone();
            caches.open(CACHE_VERSION).then((c) => c.put(req, copy));
          }
          return res;
        })
        .catch(() => caches.match(req))
    );
    return;
  }

  // 5) Resto de estáticos del propio origen (imágenes, fuentes, iconos) →
  //    cache-first con relleno en segundo plano.
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
