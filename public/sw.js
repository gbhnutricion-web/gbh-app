const CACHE_VERSION = "gbh-v2026-05-19";
const CACHE_NAME    = CACHE_VERSION;
const SHELL = ["/", "/index.html"];
self.addEventListener("install", (e) => {
  e.waitUntil(caches.open(CACHE_NAME).then((c) => c.addAll(SHELL)));
});
self.addEventListener("activate", (e) => {
  e.waitUntil(caches.keys().then((keys) =>
    Promise.all(keys.filter((k) => k !== CACHE_NAME).map((k) => caches.delete(k)))
  ));
});
self.addEventListener("fetch", (e) => {
  const { request } = e;
  const url = new URL(request.url);
  if (url.origin !== self.location.origin) return;
  const isShell = request.mode === "navigate" || url.pathname.endsWith(".js") || url.pathname === "/";
  if (isShell) {
    e.respondWith(fetch(request).then((res) => {
      const clone = res.clone();
      caches.open(CACHE_NAME).then((c) => c.put(request, clone));
      return res;
    }).catch(() => caches.match(request)));
    return;
  }
  e.respondWith(caches.match(request).then((cached) => {
    if (cached) return cached;
    return fetch(request).then((res) => {
      const clone = res.clone();
      caches.open(CACHE_NAME).then((c) => c.put(request, clone));
      return res;
    });
  }));
});
