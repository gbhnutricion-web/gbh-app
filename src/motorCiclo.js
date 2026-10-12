// ═══ CICLO Y BÁSCULA — el motor ═══════════════════════════════════════════════
// Peso esperado CON y SIN la retención del ciclo menstrual (12-oct-2026, por
// orden de Alejandro: «en las mujeres se representa el peso esperado con y sin
// retención […] quiero meter esa funcionalidad también en la app»).
//
// Es una COPIA del modelo de la plantilla femenina de la hoja «Análisis
// Corporal» (columnas H, J y K del bloque «Fecha de consulta | Semana | Semana
// Ciclo | Peso real | Peso esperado sin retención | Peso esperado con
// retención»), no un modelo nuevo:
//   H (semana del ciclo) = IF(C58+n<=4; C58+n; MOD(C58+n-1;4)+1)
//   J (sin retención)    = J(n-1) + (J4-J3)/12             → recta de J3 a J4 en 12 semanas
//   K (con retención)    = K(n-1) + (J4-J3)/12 + IF(H=3 o H=4; C61/2; IF(H=1; -C61; 0))
// con C58 = semana del ciclo en la semana 0 y C61 = retención corporal (kg).
// Sumada, la K queda J + sobre(H(n)) − sobre(H(0)), donde sobre() es lo que el
// ciclo lleva acumulado en cada semana: 0, 0, R/2, R (semana 1 = la de la regla,
// semana 4 = la de antes). Por eso el peso de la semana 0 ya lleva puesta la
// retención de su semana. 07. App GBH/arnes_ciclo.py lo compara celda a celda
// con las pestañas de la hoja.
//
// Sin dependencias: lo usan CicloPeso.jsx y el arnés.

export const SEMANAS_CICLO = 4;
export const SEMANAS_PROGRAMA = 12;
export const RETENCION_DEFECTO = 1;   // kg: lo que trae la plantilla femenina en C61
export const RETENCION_MAX = 3;

const DIA = 86400000;
const aUTC = (s) => { const [y, m, d] = String(s).slice(0, 10).split("-").map(Number); return Date.UTC(y, m - 1, d); };
export const fechaMas = (s, dias) => new Date(aUTC(s) + dias * DIA).toISOString().slice(0, 10);
export const diasEntre = (a, b) => Math.round((aUTC(b) - aUTC(a)) / DIA);
const num = (v) => (v === null || v === undefined || v === "" || !isFinite(Number(v))) ? null : Number(v);
const fechaValida = (s) => typeof s === "string" && /^\d{4}-\d{2}-\d{2}/.test(s);

// Semana del ciclo (1-4) k semanas después de una semana en la que era `ref`.
export const semanaCiclo = (ref, k) => ((((ref - 1 + k) % SEMANAS_CICLO) + SEMANAS_CICLO) % SEMANAS_CICLO) + 1;

// Lo que la retención lleva sumado en cada semana del ciclo.
export const sobre = (h, R) => (h === 3 ? R / 2 : h === 4 ? R : 0);

// Semana del programa (0 = la semana del inicio) en la que cae una fecha.
export const semanaPrograma = (inicio, fecha) => Math.floor(diasEntre(inicio, fecha) / 7);

// Los parámetros de la línea. `cfg` es profiles.ciclo_retencion:
//   { semana_ref, fecha_ref, retencion_kg,             ← su ciclo (la paciente o la consulta)
//     inicio, peso_inicio, objetivo, semanas,          ← la línea de la consulta (solo origen consulta)
//     origen: "consulta" | "app", actualizado }
// Lo que no venga de la consulta sale de la app: el pesaje inicial y su fecha,
// y el objetivo del perfil (lo mismo que dibuja la gráfica de peso).
export function parametros(cfg, weights, profile) {
  const c = cfg && typeof cfg === "object" ? cfg : {};
  const ws = (weights || []).filter(w => w && fechaValida(w.date) && num(w.weight) != null)
    .slice().sort((a, b) => (a.date > b.date ? 1 : -1));
  const ini = ws.find(w => w.isInitial) || ws[0] || null;
  const inicio = fechaValida(c.inicio) ? c.inicio.slice(0, 10) : (ini ? ini.date : null);
  const pesoInicio = num(c.peso_inicio) ?? (ini ? num(ini.weight) : null) ?? num(profile && profile.initial_weight);
  const objetivo = num(c.objetivo) ?? num(profile && profile.goal_weight);
  const semanas = num(c.semanas) && num(c.semanas) > 0 ? num(c.semanas) : SEMANAS_PROGRAMA;
  const r = num(c.retencion_kg);
  const retencion = r == null ? null : Math.max(0, Math.min(RETENCION_MAX, r));
  const ref = num(c.semana_ref);
  let semanaInicio = null;
  if (inicio && ref >= 1 && ref <= 4 && Number.isInteger(ref)) {
    const kRef = fechaValida(c.fecha_ref) ? semanaPrograma(inicio, c.fecha_ref) : 0;
    semanaInicio = semanaCiclo(ref, -kRef);
  }
  const faltan = [];
  if (!inicio || pesoInicio == null) faltan.push("inicio");
  if (objetivo == null) faltan.push("objetivo");
  return { inicio, pesoInicio, objetivo, semanas, retencion, semanaInicio,
           origen: c.origen === "consulta" || c.origen === "app" ? c.origen : null, faltan };
}

// Peso esperado en la semana k del programa (antes del inicio vale el de inicio;
// pasadas las 12 semanas, el objetivo, que es donde se queda la línea).
export function esperado(p, k) {
  const frac = Math.min(1, Math.max(0, k / p.semanas));
  const sin = p.pesoInicio + (p.objetivo - p.pesoInicio) * frac;
  if (p.semanaInicio == null || p.retencion == null) return { k, sin, con: null, h: null };
  const h = semanaCiclo(p.semanaInicio, k);
  return { k, sin, con: sin + sobre(h, p.retencion) - sobre(p.semanaInicio, p.retencion), h };
}

// Las semanas que se dibujan: las del programa (0-12) mientras dure; pasado,
// las 8 últimas y las 4 que vienen. Devuelve también la semana de hoy.
export function ventana(p, hoy) {
  const kHoy = semanaPrograma(p.inicio, hoy);
  const [k0, k1] = kHoy > p.semanas ? [kHoy - 8, kHoy + 4] : [0, p.semanas];
  const semanas = [];
  for (let k = k0; k <= k1; k++) semanas.push({ ...esperado(p, k), fecha: fechaMas(p.inicio, 7 * k) });
  return { kHoy, k0, k1, semanas, desde: fechaMas(p.inicio, 7 * k0), hasta: fechaMas(p.inicio, 7 * k1 + 6) };
}

// Lo que la paciente guarda al elegir su semana del ciclo o su retención.
// Conserva la línea de la consulta (inicio, peso, objetivo) si la había.
export function guardarEleccion(cfg, { semana, retencion }, hoy, ahoraISO) {
  const c = cfg && typeof cfg === "object" ? cfg : {};
  const out = { ...c, origen: "app", actualizado: ahoraISO };
  if (semana != null) { out.semana_ref = semana; out.fecha_ref = hoy; }
  if (retencion != null) out.retencion_kg = Math.round(Math.max(0, Math.min(RETENCION_MAX, retencion)) * 10) / 10;
  if (out.retencion_kg == null) out.retencion_kg = RETENCION_DEFECTO;
  return out;
}
