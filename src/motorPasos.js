// ─── Pasos del móvil · la lógica, sin tocar el móvil ni la base (30-sep-2026) ───
// 07. App GBH/BRIEF_pasos.md. La app de tienda cuenta los pasos SOLA y EN VIVO (orden de
// Alejandro, 29-sep: «que no dependiesen de un botón, sino que sea automático y en vivo»):
//  · iPhone: el podómetro del propio móvil (CoreMotion) da el total desde medianoche y, con la
//    app abierta, cada paso nuevo.
//  · Android: Health Connect da el total del día y el sensor de pasos, cada paso nuevo.
// src/pasosNativos.js habla con el móvil; aquí solo se decide QUÉ se enseña y CUÁNDO se guarda.
// Cuatro reglas que viven aquí:
//  · El recuento del día nunca baja. Si el paciente apuntó 10.000 a mano antes de encenderlo,
//    el móvil no se los quita (ni la meta ni sus XP); y si el total del sistema llega con
//    retraso respecto a lo ya contado en vivo, se sigue sumando desde lo contado.
//  · Nada de un día entra en otro: un total leído a las 23:59:59 y entregado a las 00:00:01
//    es de ayer y se tira.
//  · El sistema agrega, la app no suma muestras sueltas (móvil + reloj se contarían dos veces).
//  · En la base se escribe como mucho una vez por minuto mientras camina, y en el acto al
//    cruzar los 10.000 (la celebración no espera).

export const TOPE_PASOS = 99999;           // el mismo tope que updSteps
export const META_PASOS = 10000;
export const DIAS_LECTURA = 7;             // días que se miran para saber si el sistema da datos
export const GUARDAR_CADA_MS = 60000;
export const SIN_DATOS_TRAS_MS = 48 * 3600 * 1000;   // Health Connect empieza a contar al dar el permiso

export const claveDia = (d = new Date()) =>
  `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;

// Entero entre 0 y el tope. Lo que no es un número finito y no negativo es null.
export function normalizarPasos(v) {
  if (v === null || v === undefined || v === '' || typeof v === 'boolean') return null;
  const n = Number(v);
  if (!Number.isFinite(n) || n < 0) return null;
  return Math.min(TOPE_PASOS, Math.round(n));
}

// Medianoche local de hoy y el inicio de la ventana de `dias` días (hoy incluido).
export const medianocheLocal = (ahora = new Date()) =>
  new Date(ahora.getFullYear(), ahora.getMonth(), ahora.getDate(), 0, 0, 0, 0);
export const inicioVentana = (ahora = new Date(), dias = DIAS_LECTURA) =>
  new Date(ahora.getFullYear(), ahora.getMonth(), ahora.getDate() - (dias - 1), 0, 0, 0, 0);

// El contador EN VIVO de hoy: {dia, base, ancla, sensor, total}.
//  base   último total fiable (el del sistema, o lo ya contado si el sistema va por detrás)
//  sensor pasos que da el sensor desde que se encendió (se reinicia a 0 al volver a encenderlo)
//  ancla  valor del sensor cuando se fijó la base
//  total  lo que se enseña: base + (sensor − ancla), y nunca menos que antes
// Eventos: {tipo:'base', pasos, dia} · {tipo:'sensor', pasos} · {tipo:'reinicio'}
export function contadorVivo(prev, ev, hoy) {
  const s0 = prev && Number.isFinite(prev.sensor) ? prev.sensor : 0;
  const c = prev && prev.dia === hoy ? { ...prev } : { dia: hoy, base: 0, ancla: s0, sensor: s0, total: 0 };
  if (!ev || typeof ev !== 'object') return c;
  if (ev.tipo === 'reinicio') {
    c.base = c.total; c.ancla = 0; c.sensor = 0;
    return c;
  }
  const p = normalizarPasos(ev.pasos);
  if (p === null) return c;
  if (ev.tipo === 'base') {
    if (ev.dia && ev.dia !== hoy) return c;            // leído para otro día: fuera
    c.base = Math.max(p, c.total);
    c.ancla = c.sensor;
  } else if (ev.tipo === 'sensor') {
    if (p < c.sensor) { c.base = c.total; c.ancla = 0; } // el sensor volvió a empezar
    c.sensor = p;
  } else {
    return c;
  }
  c.total = Math.min(TOPE_PASOS, Math.max(c.total, c.base + Math.max(0, c.sensor - c.ancla)));
  return c;
}

// ¿Se escribe ya en la base? Solo si sube; en el acto si cruza la meta o si se fuerza (la app
// se va a segundo plano); si no, como mucho una vez cada GUARDAR_CADA_MS.
export function debeGuardar({ valor, guardado, guardadoAt, ahora, forzar = false } = {}) {
  const v = normalizarPasos(valor);
  const g = normalizarPasos(guardado) || 0;
  if (v === null || v <= g) return false;
  if (forzar) return true;
  if (g < META_PASOS && v >= META_PASOS) return true;
  const t = ahora instanceof Date ? ahora.getTime() : Number(ahora);
  const t0 = guardadoAt instanceof Date ? guardadoAt.getTime() : Number(guardadoAt);
  if (!Number.isFinite(t0) || !t0) return true;
  return t - t0 >= GUARDAR_CADA_MS;
}

// Qué se ve en la misión de pasos:
//  'oculto'    web, interruptor del operador apagado, o el móvil no cuenta pasos (iPad, Android viejo)
//  'pedir'     aún sin permiso: la app lo pide SOLA (no hay botón) al abrir Inicio
//  'instalar'  Android sin Health Connect al día (Android 9-13 lo baja de Play)
//  'denegado'  el paciente dijo que no: vuelven los botones de sumar a mano, con la pista
//  'sin-datos' con permiso, pero el sistema no da ni un paso en 7 días y ya pasaron 48 h
//  'vivo'      los pasos vienen del móvil: fuera los botones de sumar a mano
export function estadoPasos({ nativo, activo, disponibilidad, permiso, pasos7d, desde, ahora } = {}) {
  if (!nativo || !activo) return 'oculto';
  if (disponibilidad === 'no-disponible') return 'oculto';
  if (disponibilidad === 'instalar') return 'instalar';
  if (permiso === 'denegado') return 'denegado';
  if (permiso !== 'concedido') return 'pedir';
  const t = ahora instanceof Date ? ahora.getTime() : Number(ahora || Date.now());
  const d = desde ? new Date(desde).getTime() : NaN;
  if (pasos7d === 0 && Number.isFinite(d) && t - d > SIN_DATOS_TRAS_MS) return 'sin-datos';
  return 'vivo';
}

// Suma de los tramos que devuelve el sistema (Health Connect por días): lo ilegible no cuenta.
export function sumaTramos(tramos) {
  let s = 0;
  for (const t of Array.isArray(tramos) ? tramos : []) {
    const p = normalizarPasos(t && (t.value !== undefined ? t.value : t.pasos));
    if (p !== null) s += p;
  }
  return Math.min(TOPE_PASOS * DIAS_LECTURA, s);
}
