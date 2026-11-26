// ─── Código de barras · lógica pura (sin React ni red) ──────────────────────────
// Un producto envasado se apunta en «¿Qué comiste?» escaneando su código o tecleándolo.
// Los datos salen de Open Food Facts (base abierta, licencia ODbL): kcal y macros por 100 g
// y, si la trae, la porción declarada. El ítem que se guarda es un alimento más
// ({ t: 'ing', … } con sus números dentro), así que kcalDia.js y gbh_consulta.py lo suman
// sin cambios. Brief: 07. App GBH/BRIEF_mapa_comer_fuera.md §6 (MAESTRO-2026-1627).
// Tests: tests/codigoBarras.test.mjs.

const num = (x) => {
  const v = typeof x === 'number' ? x : parseFloat(String(x ?? '').replace(',', '.'));
  return Number.isFinite(v) ? v : 0;
};
const r1 = (x) => Math.round(x * 10) / 10;

// Solo cifras; vale EAN-8, UPC-A (12), EAN-13 y GTIN-14, con su dígito de control.
export function limpiarCodigo(s) {
  return String(s ?? '').replace(/\D/g, '');
}

export function codigoValido(s) {
  const c = limpiarCodigo(s);
  if (![8, 12, 13, 14].includes(c.length)) return false;
  const d = c.split('').map(Number);
  const control = d.pop();
  let suma = 0;
  // De derecha a izquierda, empezando junto al dígito de control: pesos 3, 1, 3, 1…
  for (let i = d.length - 1, peso = 3; i >= 0; i -= 1, peso = peso === 3 ? 1 : 3) suma += d[i] * peso;
  return (10 - (suma % 10)) % 10 === control;
}

export function urlProducto(codigo) {
  const c = limpiarCodigo(codigo);
  return `https://world.openfoodfacts.org/api/v2/product/${c}.json`
    + '?fields=code,product_name,product_name_es,generic_name_es,brands,serving_quantity,nutriments';
}

// Respuesta de Open Food Facts → producto listo para apuntar, o el motivo por el que no.
//   ok:false, motivo: 'no_encontrado' · 'sin_kcal' (está, pero sin energía) · 'datos_raros'
export function leerProducto(json, codigo) {
  const c = limpiarCodigo(codigo || json?.code);
  if (!json || json.status !== 1 || !json.product) return { ok: false, motivo: 'no_encontrado', codigo: c };
  const p = json.product;
  const nu = p.nutriments || {};
  const nombre = String(p.product_name_es || p.product_name || p.generic_name_es || '').trim();
  const marca = String(p.brands || '').split(',')[0].trim();
  let k = num(nu['energy-kcal_100g']);
  if (!(k > 0) && num(nu.energy_100g) > 0) k = num(nu.energy_100g) / 4.184;   // energy_100g viene en kJ
  if (!(k > 0)) return { ok: false, motivo: 'sin_kcal', codigo: c, nombre, marca };
  const pr = num(nu.proteins_100g), hc = num(nu.carbohydrates_100g), gr = num(nu.fat_100g);
  // 900 kcal/100 g es el techo físico (grasa pura); macros fuera de 0-100 g/100 g = ficha mal escrita.
  if (k > 900 || [pr, hc, gr].some((x) => x < 0 || x > 100)) return { ok: false, motivo: 'datos_raros', codigo: c, nombre, marca };
  const porcion = num(p.serving_quantity);
  return {
    ok: true, codigo: c,
    nombre: nombre || 'Producto sin nombre', marca,
    k: r1(k), p: r1(pr), h: r1(hc), g: r1(gr),
    porcion: porcion >= 1 && porcion <= 1000 ? Math.round(porcion) : null,
  };
}

// Producto + gramos → ítem de «¿Qué comiste?». Sin gramos, la porción declarada; sin porción, 100 g.
export function itemDesdeProducto(prod, gramos) {
  const gr = num(gramos) > 0 ? Math.round(num(gramos)) : (prod.porcion || 100);
  return {
    t: 'ing',
    n: prod.marca && !prod.nombre.toLowerCase().includes(prod.marca.toLowerCase()) ? `${prod.nombre} (${prod.marca})` : prod.nombre,
    q: 1, u: 'ración', ug: gr,
    k: prod.k, p: prod.p, h: prod.h, g: prod.g,
    id: `off:${prod.codigo}`, e: 0,
  };
}

// El escáner solo se ofrece en la web: las apps de las tiendas necesitan antes el permiso
// de cámara en su propia versión (una sola revisión con lo demás pendiente).
export function escanerDisponible(win = typeof window !== 'undefined' ? window : undefined) {
  if (!win) return false;
  const cap = win.Capacitor;
  if (cap && typeof cap.isNativePlatform === 'function' && cap.isNativePlatform()) return false;
  return !!(win.navigator && win.navigator.mediaDevices && typeof win.navigator.mediaDevices.getUserMedia === 'function');
}
