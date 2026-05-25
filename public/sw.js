const CACHE_VERSION = "gbh-v2026-05-25";
const CACHE_NAME = CACHE_VERSION;
const STATIC_ASSETS = ["/", "/index.html", "/manifest.json"];
self.addEventListener("install",(e)=>{e.waitUntil(caches.open(CACHE_NAME).then(c=>c.addAll(STATIC_ASSETS)).then(()=>self.skipWaiting()));});
self.addEventListener("activate",(e)=>{e.waitUntil(caches.keys().then(ks=>Promise.all(ks.filter(k=>k!==CACHE_NAME).map(k=>caches.delete(k)))).then(()=>self.clients.claim()));});
self.addEventListener("fetch",(e)=>{const{request:r}=e;if(r.method!=="GET")return;if(r.url.includes("supabase.co")||r.url.includes("onesignal"))return;e.respondWith(caches.match(r).then(cached=>{const net=fetch(r).then(res=>{if(res&&res.status===200){const cl=res.clone();caches.open(CACHE_NAME).then(c=>c.put(r,cl));}return res;}).catch(()=>cached);return cached||net;}));});
self.addEventListener("message",(e)=>{if(e.data==="skipWaiting")self.skipWaiting();});
