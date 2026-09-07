// ─────────────────────────────────────────────────────────────────────────────
//  GBH Nutrición · Service Worker (PWA)
//  CACHE_VERSION se actualiza en CADA entrega de cambios al JSX.
//  Formato: gbh-vYYYY-MM-DD
// ─────────────────────────────────────────────────────────────────────────────
//  PUSH: retiradas (decisión del operador, 6-ago-2026). Aquí vivía el
//  importScripts del worker de OneSignal; se elimina junto con la
//  inicialización del SDK en App.jsx. Este worker ya solo hace caché/PWA.
//  No reintroducir sin decisión expresa.

const CACHE_VERSION = "gbh-v2026-09-07b";  // Tutorial del primer dia, coherente con la pantalla de plan del 6-sep: el paso unico del plan se parte en tres — B3_dieta (elige entre las 6 programaciones tocando la ficha), B3_alergias (alimentos que no quieres / alergias, que no apareceran nunca) y B3_generar, que ya nombra el boton real GUARDAR Y GENERAR en vez del «✨ Generar» retirado. Antes 07a: Guardar el plan: cuando Supabase rechaza la dieta (CHECK chk_tipo_dieta) el aviso dice la causa —«La programacion X aun no esta habilitada en tu cuenta»— en vez de «intentalo de nuevo», y la consola registra el HTTP y el cuerpo del error; el icono de Descarga del boton-ficha pasa a una barra de pesas compacta (se veia como un guion). El arreglo de fondo es SQL: sql/09_tipo_dieta_nuevas.sql. Antes 06f: Editar tu plan homogeneo: cabecera, titulos de seccion, pildora del 100 %, patron de cocina, recordatorios y botones de guardar con la misma gama negro/verde/dorado y tipografia de pixel que el selector (CabeceraPlan, PillTotal, PatronCocina, Recordatorios, BotonesGuardar en src/PlanArcade.jsx). Antes 06e: Pestana Plan: el aviso «¡Nueva semana desbloqueada!» con el boton GENERAR aparece arriba del todo (bajo el chip de prueba, antes del navegador de semanas) para el estandar con el candado semanal abierto; el boton equivalente del final de la pestana se retira (BannerSemanaNueva en src/PlanArcade.jsx). Antes 06d: Editar tu plan: la tabla de porcentajes por toma con la estetica arcade (negro, verdes, pixel) y seccion nueva «4 · Alimentos que no quieres» (no me gusta / alergia, ventana aparte con sugerencias) guardada en patient_config.notas como «Alimentos rechazados: …» / «Alergias: …», las lineas que el generador ya filtra; recordatorios pasan a ser la 5 (src/PlanArcade.jsx). Antes 06c: Configura tu plan: el tipo de programacion se elige en un selector estilo SELECT PLAYER arcade (src/SelectorPrograma.jsx): fichas deslizables con la oveja del paciente y un objeto en pixel art por dieta (plato, huevo, brocoli, bol de arroz, aguacate, barra de pesas), descripcion debajo y boton «¡Elijo esta!» que devuelve al organizador; boton-ficha en lugar de la rejilla 3x2. Antes 06b: Configura tu plan: tres opciones nuevas de alimentacion para el estandar — Sin gluten (tipo_dieta 'Celiaco' = Simple + restriccion), Cetogenica y Descarga precompeticion — en rejilla de 3x2; el generador ya las lee (MAESTRO-2026-438/439). Antes 06a: Inicio: las tomas del dia y el aviso de programacion nueva se leen del plan de fecha_gen MAS RECIENTE (order=fecha_gen.desc.nullslast), igual que la pestana Plan; antes order=semana.desc cogia la S12 del ciclo anterior en los premium que repiten numeros de semana (MAESTRO-2026-433). Antes 05d: Zona de juego (aviso de errores de los pacientes en TestFlight): simulacion a 60 pasos/s independiente del rAF (iOS baja a 30 fps en ahorro de energia y el juego iba a la mitad); la regla de 30 s del servidor se ve en el boton y no se cobra hasta cumplirla; los rechazos del servidor tienen mensaje propio y devuelven el diamante; plazo de 8 s al cargar rivales del duelo y de 20 s al registrar; contadores del dia con estado de carga y sin resetear a 3 sin respuesta; boton Jugar sin diamantes avisa; el efecto del juego ya no se reinicia si cambia la identidad del array de accesorios. Antes 05c: Medidas: el boton de pliegues dice solo «Registrar pliegues de hoy» (la doble toma se explica dentro del formulario, no en el boton). Antes 05b: Medidas: la pestana Peso pasa a llamarse Medidas y gana la vista Medidas corporales (silueta por zonas con semaforo contra la toma anterior, perimetros con ICA/ICC y pliegues con doble toma y % graso estimado; tabla body_measurements, modulo src/MedidasCorporales.jsx). Antes 05a: Fase 2b del RLS, sustituciones del cliente listas para el cierre: buscar cuenta / ranking / alta por RPC, perfiles ajenos por la vista perfiles_publicos, interruptor SESION_OBLIGATORIA (apagado). Antes 04b: Fase 2b del RLS, parte cliente: sesion por PIN (cabecera X-GBH-Sesion en todas las llamadas, login por gbh_login_pin con vuelta a gbh_check_pin, freno de intentos). Antes 04a: Fase 2a del RLS (orden de Alejandro): el modal del PIN es BLOQUEANTE para las cuentas sin PIN — se pide en cada apertura y solo se puede posponer sin conexion o si la RPC falla. Antes 31a: fuera OneSignal (SDK muerto en index.html + worker borrado: un tercero recibia la IP de cada usuario por codigo muerto) y politica de privacidad v2 publicada en /legal/ — GBH_PRIVACY_URL apunta ahi. Antes 30a: dominio propio en TODO lo que sale de la app: las 7 URL quemadas gbh-app.vercel.app pasan a app.gbhnutricion.es (tarjeta de progreso x2, install, invitar a un amigo ES/EN, recetas compartidas x2) — la direccion que se reparte ya es la que no caduca. Antes 25b: el toque de la manana ya NO se pierde: tras el relevo de dia se reaplica SOLO la diferencia que traia ese toque sobre el dia nuevo a cero (nunca el tLog de ayer entero); toggleM resuelve la fecha ANTES del `was`, que antes lo hacia salir mudo. Antes 25a: guardia de cambio de dia en saveLog + pageshow en el vigia: el primer toque tras reanudar un PWA de iPhone ya no escribe las banderas de AYER bajo la fecha de HOY. Antes 24j: manifest con iconos versionados (?v=): Android actualiza el icono solo al cambiar la URL. Antes 24i: iconos remasterizados.  // iconos remasterizados (Gemini): retrato centrado + manzana. Antes 24h: coste por receta + gasto real.  // coste por receta (ficha y detalle) + gasto real por receta (receta_gasto). Antes 24c: cola offline: los daily_logs del mismo dia se FUSIONAN en vez de sustituirse (sin conexion, un {meals_log} y un {diet_followed} del mismo dia se pisaban y se perdia uno).
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
