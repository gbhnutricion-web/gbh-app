// ─── Cambio de receta con gemas: qué receta se ofrece (28-sep-2026) ──────────
// Quejas de Alejandro sobre varios pacientes: «da siempre las mismas opciones» y,
// a una paciente alérgica al salmón, le cambió el atún por salmón. Medido antes:
//  · Los rechazos se leían de profile.notas, una columna que NO existe: el filtro
//    de alergias recibía siempre un texto vacío y no vetaba nada a nadie. Los del
//    estándar viven en patient_config.notas; los del premium, en su hoja, que la
//    App no ve.
//  · No miraba la dieta (descarga, cetogénica, sin gluten, vegetariana…), ni los
//    desayunos realistas, ni «solo sencillas».
//  · Se quedaba con el PRIMER nivel de parecido que tuviera algo, aunque fueran
//    1 o 2 recetas, y sorteaba siempre entre las mismas 8. Sin memoria, pulsar
//    otra vez podía devolver la receta de antes.
// Ahora:
//  · el servidor manda en plan_json.cambio_receta qué recetas puede recibir ESTE
//    paciente en cada franja (permitidas_cambio de gbh_automatizacion.py: los
//    filtros duros de la programación), y la App cruza esa lista con los suyos
//    (rechazados de patient_config.notas y descartadas 🗑️ de hoy);
//  · el sorteo es entre las POOL mejores de TODOS los niveles, por orden (mismo
//    tipo y macros muy parecidos primero), no solo del primero con algo;
//  · cada hueco (semana · toma · día) recuerda lo ya enseñado y no lo repite
//    hasta haberlo enseñado todo; el parecido se mide contra la receta que puso
//    la programación, no contra la última que salió del cambio.
// Tests: tests/cambioReceta.test.mjs (sin Node: 07. App GBH/arnes_cambio_receta.py).

export const F_MIN = 0.70, F_MAX = 1.40;        // = RACION_MIN/MAX del generador
export const MACRO_ESTRICTO = 0.35, MACRO_LAXO = 0.60;
export const POOL = 8;                           // candidatas en cada sorteo
export const PESO_FAVORITA = 4;                  // = FAVORITO_BOOST del generador

export const normNombreCambio = (s) =>
  String(s || '').normalize('NFD').replace(/[̀-ͯ]/g, '').toLowerCase().replace(/\s+/g, ' ').trim();

// Lista del servidor que corresponde a cada toma.
export const franjaCambio = (toma) =>
  toma === 'Desayuno' ? 'desayuno' : (toma === 'Comida' || toma === 'Cena') ? 'principal' : 'ligera';

// La lista del plan MÁS RECIENTE (por fecha_gen) que la traiga: las restricciones
// son del paciente, no de la semana. null si ningún plan la trae (planes de antes
// del 28-sep): entonces solo filtra la App.
export function permitidasDePlanes(planes, toma) {
  let mejor = null, tMejor = -Infinity;
  for (const p of planes || []) {
    const c = p && p.plan_json && p.plan_json.cambio_receta;
    if (!c || c.v !== 1) continue;
    const t = Date.parse(p.fecha_gen || '') || 0;
    if (!mejor || t > tMejor) { mejor = c; tMejor = t; }
  }
  const lista = mejor && mejor[franjaCambio(toma)];
  return Array.isArray(lista) ? new Set(lista.map(String)) : null;
}

const catBucket = (r) => {
  const c = String(r.categoria || r.Categoria || r['categoría'] || '').toLowerCase();
  if (/comida|cena/.test(c)) return 'cd';
  if (/desayuno|almuerzo|merienda/.test(c)) return 'dam';
  return null;
};
const kcalDe = (r) => parseFloat(r.calorias || r.calorias_totales) || 0;
const perfilDe = (p, h, g) => { const kc = p * 4 + h * 4 + g * 9; return kc > 0 ? [p * 4 / kc, h * 4 / kc, g * 9 / kc] : null; };
export const perfilReceta = (r) =>
  r ? perfilDe(parseFloat(r.proteinas_g) || 0, parseFloat(r.hidratos_g) || 0, parseFloat(r.grasas_g) || 0) : null;
// Reparto calórico P/H/G: 0 = idéntico, 2 = opuesto; sin datos, 0,5 (ni premia ni descarta).
export const distanciaMacros = (a, b) =>
  (!a || !b) ? 0.5 : Math.abs(a[0] - b[0]) + Math.abs(a[1] - b[1]) + Math.abs(a[2] - b[2]);

/**
 * Elige la receta que da el cambio.
 *  recetas      filas de `recipes` (Supabase)
 *  actual       la receta que se ve: {nombre, tipo, calorias, proteinas_g, hidratos_g, grasas_g, kcal_objetivo}
 *  ancla        la que puso la programación en ese hueco (mismos campos); null → actual
 *  toma         'Desayuno' | 'Almuerzo' | 'Comida' | 'Merienda' | 'Cena'
 *  permitidas   Set de id_receta de la franja (lista del servidor) o null
 *  rechazada    (receta) => bool: el filtro de la App (notas del paciente)
 *  descartadas, favoritas, vistas, enPlan: Sets de nombres normalizados
 *  azar         () => [0, 1)
 * Franja, lista del servidor, rechazados, descartadas y escala (ración 0,70-1,40)
 * son DUROS; el tipo y los macros solo ordenan, y nunca pasa de MACRO_LAXO.
 * Devuelve {receta, factor, pool, nivel, reinicio} o {receta: null, motivo}.
 */
export function elegirRecetaCambio({ recetas, actual, ancla = null, toma, permitidas = null,
  rechazada = () => false, descartadas = new Set(), favoritas = new Set(), vistas = new Set(),
  enPlan = new Set(), azar = Math.random }) {
  const lista = recetas || [];
  const kcalObjetivo = parseFloat(actual && actual.kcal_objetivo) || parseFloat(actual && actual.calorias) || 0;
  const nomActual = normNombreCambio(actual && actual.nombre);
  const ref = ancla || actual || {};
  const tipoRef = String(ref.tipo || '');
  const perfilRef = perfilReceta(ref);
  const bucket = (toma === 'Comida' || toma === 'Cena') ? 'cd' : 'dam';
  const hayCategorias = lista.some((r) => catBucket(r) !== null);   // red por si faltara el dato
  const nom = (r) => normNombreCambio(r.nombre || r.nombre_receta || '');
  const escala = (r) => {
    const k = kcalDe(r);
    if (!kcalObjetivo || !k) return false;
    const f = kcalObjetivo / k;
    return f >= F_MIN && f <= F_MAX;
  };
  const validas = [];
  for (const r of lista) {
    const n = nom(r);
    if (!n || n === nomActual) continue;
    if (hayCategorias && catBucket(r) !== bucket) continue;
    if (permitidas && !permitidas.has(String(r.id_receta == null ? '' : r.id_receta))) continue;
    if (descartadas.has(n) || rechazada(r) || !escala(r)) continue;
    const d = distanciaMacros(perfilRef, perfilReceta(r));
    const mismo = String(r.tipo || '') === tipoRef;
    // Los cuatro niveles de siempre: 1) mismo tipo y macros muy parecidos,
    // 2) otro tipo y muy parecidos, 3) mismo tipo y razonables, 4) otro y razonables.
    const nivel = d <= MACRO_ESTRICTO ? (mismo ? 1 : 2) : d <= MACRO_LAXO ? (mismo ? 3 : 4) : 0;
    if (nivel) validas.push({ r, n, d, nivel, repe: enPlan.has(n) ? 1 : 0 });
  }
  if (!validas.length) return { receta: null, motivo: 'sin_alternativa' };
  // Lo ya enseñado en este hueco no vuelve hasta que se ha enseñado todo.
  let cands = validas.filter((x) => !vistas.has(x.n));
  const reinicio = !cands.length;
  if (reinicio) cands = validas;
  // Mejor nivel primero; dentro del nivel, lo que no está ya en la semana y lo más parecido.
  cands.sort((a, b) => a.nivel - b.nivel || a.repe - b.repe || a.d - b.d || (a.n < b.n ? -1 : a.n > b.n ? 1 : 0));
  const pool = cands.slice(0, POOL);
  const pesos = pool.map((x) => (favoritas.has(x.n) ? PESO_FAVORITA : 1));
  let u = azar() * pesos.reduce((s, x) => s + x, 0);
  let elegida = pool[pool.length - 1];
  for (let i = 0; i < pool.length; i++) { u -= pesos[i]; if (u < 0) { elegida = pool[i]; break; } }
  // Ración: el mismo escalado de antes, en pasos de 0,05 dentro de 0,70-1,40.
  const kBase = kcalDe(elegida.r);
  let factor = 1;
  if (kcalObjetivo > 0 && kBase > 0) {
    factor = Math.round(Math.max(F_MIN, Math.min(F_MAX, kcalObjetivo / kBase)) * 20) / 20;
    if (Math.abs(factor - 1) < 0.05) factor = 1;
  }
  return { receta: elegida.r, factor, pool: pool.map((x) => x.r), nivel: elegida.nivel, reinicio };
}

// ── Memoria de cada hueco (localStorage del teléfono) ─────────────────────────
// Qué receta puso la programación (el ancla del parecido) y qué se ha enseñado.
// Solo vale mientras la receta que se ve sea la última que dio el cambio o la
// original: si el hueco cambió por otro lado (se regeneró la semana, otro
// teléfono), se empieza de cero. Sin almacenamiento, se degrada a lo de antes.
const PREFIJO_MEM = 'gbh:cambio:';
const DIAS_MEM = 21;
export const claveMemoriaCambio = (perfil, semana, toma, dia) => `${PREFIJO_MEM}${perfil}:${semana}:${toma}:${dia}`;

const anclaDe = (r) => (r ? { nombre: r.nombre || r.nombre_receta || '', tipo: r.tipo || '',
  proteinas_g: parseFloat(r.proteinas_g) || 0, hidratos_g: parseFloat(r.hidratos_g) || 0,
  grasas_g: parseFloat(r.grasas_g) || 0 } : null);

export function leerMemoriaCambio(storage, clave, actual) {
  const nomAct = normNombreCambio(actual && actual.nombre);
  let m = null;
  try { m = JSON.parse((storage && storage.getItem(clave)) || 'null'); } catch (e) { m = null; }
  if (m && m.ancla && Array.isArray(m.vistas)
      && (m.ultima === nomAct || normNombreCambio(m.ancla.nombre) === nomAct)) {
    return { ancla: m.ancla, vistas: new Set(m.vistas) };
  }
  return { ancla: anclaDe(actual), vistas: new Set(nomAct ? [nomAct] : []) };
}

export function guardarMemoriaCambio(storage, clave, { ancla, vistas, actual, elegida, reinicio }, ahora = Date.now()) {
  const nomEl = normNombreCambio(elegida && (elegida.nombre || elegida.nombre_receta));
  // Al empezar otra vuelta se olvida lo enseñado, salvo la original y la que se
  // acaba de dejar, para que no vuelva a la pulsación siguiente.
  const v = new Set(reinicio ? [] : vistas || []);
  if (reinicio) [ancla && ancla.nombre, actual && actual.nombre].forEach((x) => { if (x) v.add(normNombreCambio(x)); });
  if (nomEl) v.add(nomEl);
  try {
    if (!storage) return;
    storage.setItem(clave, JSON.stringify({ ancla, vistas: [...v].slice(-300), ultima: nomEl, ts: ahora }));
    podarMemoriaCambio(storage, ahora);
  } catch (e) { /* sin almacenamiento: el cambio funciona igual, sin memoria */ }
}

export function podarMemoriaCambio(storage, ahora = Date.now()) {
  try {
    const viejas = [];
    for (let i = 0; i < storage.length; i++) {
      const k = storage.key(i);
      if (!k || !k.startsWith(PREFIJO_MEM)) continue;
      let ts = 0;
      try { ts = (JSON.parse(storage.getItem(k)) || {}).ts || 0; } catch (e) { ts = 0; }
      if (!(ahora - ts < DIAS_MEM * 864e5)) viejas.push(k);
    }
    viejas.forEach((k) => storage.removeItem(k));
  } catch (e) { /* nada que podar */ }
}
