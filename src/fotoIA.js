// ─── «¿Qué comiste?» con foto: lógica pura (MAESTRO-2026-1629) ─────────────────
// El servidor (gbh_foto.py, Railway) devuelve {hay_comida, platos:[{alimento, nombre, gramos, k?,p?,h?,g?}]}:
// «alimento» es un nombre de _NUTRI_ING o «otro». Aquí se convierten en ítems de «¿Qué comiste?»:
// las kcal salen de NUESTRA tabla; solo «otro» trae sus cifras por 100 g. Todo lleva e:1 («estimado»)
// y src:'foto', para que el paciente lo revise y para contar cuánto se usa.

export function fotoDisponible(win) {
  if (!win) return false;
  const cap = win.Capacitor;
  if (cap && typeof cap.isNativePlatform === 'function' && cap.isNativePlatform()) return false;   // tiendas: con su versión
  return !!(win.document && typeof win.FileReader === 'function');
}

const n = (x) => { const v = Number(x); return Number.isFinite(v) ? v : 0; };

export function itemsDesdeFoto(res, nutri) {
  const out = [];
  for (const p of (res && Array.isArray(res.platos) ? res.platos : [])) {
    const gramos = Math.round(n(p && p.gramos));
    if (!(gramos > 0)) continue;
    const e = p.alimento && p.alimento !== 'otro' && nutri ? nutri[p.alimento] : null;
    if (e) {
      // Arroz, pasta y legumbres: la tabla va en crudo y el servidor ya pasó «gramos» a crudo; la medida dice lo cocido.
      const cocido = Math.round(n(p.cocido));
      out.push({ t: 'ing', n: p.alimento, q: 1, u: cocido > 0 ? `cocido ${cocido} g` : 'ración', ug: gramos, k: n(e.k), p: n(e.p), h: n(e.h), g: n(e.g), id: e.id || null, e: 1, src: 'foto' });
    } else if (p.alimento === 'otro' && p.nombre && n(p.k) >= 0 && p.k !== undefined) {
      out.push({ t: 'ing', n: String(p.nombre).slice(0, 60), q: 1, u: 'ración', ug: gramos, k: n(p.k), p: n(p.p), h: n(p.h), g: n(p.g), id: null, e: 1, src: 'foto' });
    }
  }
  return out;
}

// Mensaje para cada «detail» del servidor (o fallo de red). null = no hay que enseñar nada.
export function mensajeFoto(detalle, EN) {
  const m = {
    tope: EN ? "You have used today's photos. You can still search the food by name." : 'Ya has usado las fotos de hoy. Puedes buscar los alimentos por nombre.',
    tope_mes: EN ? "You have used this month's photos. You can still search the food by name." : 'Ya has usado las fotos de este mes. Puedes buscar los alimentos por nombre.',
    tope_global: EN ? 'Photos are busy right now. Try again in a while.' : 'Ahora mismo hay muchas fotos en cola. Prueba en un rato.',
    sin_comida: EN ? "I can't see food in that photo. Try again closer to the plate." : 'No veo comida en esa foto. Prueba otra vez, más cerca del plato.',
    imagen: EN ? "That image can't be read. Try another photo." : 'Esa imagen no se puede leer. Prueba con otra foto.',
    red: EN ? 'No connection. Try again or search the food by name.' : 'Sin conexión. Vuelve a probar o busca los alimentos por nombre.',
  };
  return m[detalle] || (EN ? "I couldn't look at the photo. Try again or search the food by name." : 'No he podido mirar la foto. Vuelve a probar o busca los alimentos por nombre.');
}

// Estado del servidor: una sola petición por sesión de la app (se recuerda por token).
let _memo = { token: null, prom: null };
export function estadoFoto(url, sesion, fetcher = (typeof fetch === 'function' ? fetch : null)) {
  const token = sesion && sesion.token;
  if (!token || !url || !fetcher) return Promise.resolve({ ia: false, motivo: 'sin_sesion' });
  if (_memo.token === token && _memo.prom) return _memo.prom;
  const prom = fetcher(`${url}/foto/estado`, { method: 'POST', headers: { 'X-GBH-Sesion': token } })
    .then((r) => (r.ok ? r.json() : { ia: false, motivo: 'http_' + r.status }))
    .catch(() => ({ ia: false, motivo: 'red' }))
    .then((d) => { if (!d || !d.ia) _memo = { token: null, prom: null }; return d || { ia: false }; });
  _memo = { token, prom };
  return prom;
}
export function olvidarEstadoFoto() { _memo = { token: null, prom: null }; }

// Aprender de las fotos (anexo 5 de MAESTRO-2026-1629): al guardar, la app dice al servidor qué quedó
// de la foto `id` (corregido o no). No bloquea nada: si falla, el registro del día ya está guardado.
export function avisarGuardado(url, sesion, id, toma, items, fetcher = (typeof fetch === 'function' ? fetch : null)) {
  const token = sesion && sesion.token;
  const its = Array.isArray(items) ? items.filter((x) => x && x.n) : [];
  if (!token || !url || !fetcher || !(Number(id) > 0) || !its.length) return Promise.resolve(false);
  return fetcher(`${url}/foto/guardado`, { method: 'POST', headers: { 'Content-Type': 'application/json', 'X-GBH-Sesion': token },
    body: JSON.stringify({ id: Number(id), toma: toma || '', items: its }) })
    .then((r) => !!(r && r.ok)).catch(() => false);
}

// «Mis platos»: lo que este paciente ya guardó desde una foto; se repite con un toque y sin otra foto.
export function leerMisPlatos(url, sesion, fetcher = (typeof fetch === 'function' ? fetch : null)) {
  const token = sesion && sesion.token;
  if (!token || !url || !fetcher) return Promise.resolve([]);
  return fetcher(`${url}/foto/mis_platos`, { method: 'POST', headers: { 'X-GBH-Sesion': token } })
    .then((r) => (r && r.ok ? r.json() : null))
    .then((d) => (d && Array.isArray(d.platos) ? d.platos.filter((x) => x && x.plato && Array.isArray(x.items) && x.items.length) : []))
    .catch(() => []);
}
