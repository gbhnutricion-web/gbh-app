const CACHE_VERSION = "gbh-v2026-05-23g";
const CACHE_NAME = CACHE_VERSION;
const PRECACHE_URLS = ["/","/index.html","/manifest.json"];
self.addEventListener("install",(e)=>{self.skipWaiting();e.waitUntil(caches.open(CACHE_NAME).then(c=>c.addAll(PRECACHE_URLS)));});
self.addEventListener("activate",(e)=>{e.waitUntil(caches.keys().then(k=>Promise.all(k.filter(n=>n!==CACHE_NAME).map(n=>caches.delete(n)))).then(()=>self.clients.claim()));});
self.addEventListener("fetch",(e)=>{if(e.request.method!=="GET")return;const u=new URL(e.request.url);if(u.origin!==self.location.origin)return;e.respondWith(fetch(e.request).then(r=>{if(r&&r.status===200){const c=r.clone();caches.open(CACHE_NAME).then(ca=>ca.put(e.request,c));}return r;}).catch(()=>caches.match(e.request)));});
self.addEventListener("push",(e)=>{const d=e.data?.json()||{};e.waitUntil(self.registration.showNotification(d.title||"GBH Nutrición",{body:d.body||"¡No olvides tus misiones de hoy!",icon:"/icon-192.png"}));});
self.addEventListener("notificationclick",(e)=>{e.notification.close();e.waitUntil(clients.openWindow("/"));});
