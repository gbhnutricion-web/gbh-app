// node --test tests/motorPasos.test.mjs (sin Node en el PC de GBH: los mismos casos corren en
// Chrome sin cabeza con 07. App GBH/arnes_pasos.py). Cada caso lanza un Error si falla.
// Fechas fijas en hora local: martes 29-sep-2026; el cambio de hora es el domingo 25-oct-2026.
import test from 'node:test';
import {
  normalizarPasos, claveDia, medianocheLocal, inicioVentana, contadorVivo, debeGuardar, estadoPasos,
  sumaTramos, TOPE_PASOS, META_PASOS, GUARDAR_CADA_MS, DIAS_LECTURA,
} from '../src/motorPasos.js';

const ok = (c, m) => { if (!c) throw new Error(m || 'no se cumple'); };
const igual = (a, b, m) => { const x = JSON.stringify(a), y = JSON.stringify(b); if (x !== y) throw new Error(`${m || ''} ${x} ≠ ${y}`); };
const F = (d, h = 12, m = 0, s = 0) => new Date(2026, 8, d, h, m, s, 0);      // septiembre
const HOY = '2026-09-29', MANANA = '2026-09-30';
// Aplica una lista de eventos y devuelve los totales tras cada uno.
const correr = (evs, hoy = HOY, prev = null) => {
  let c = prev; const tot = [];
  for (const e of evs) { c = contadorVivo(c, e, (e && e.hoy) || hoy); tot.push(c.total); }
  return { c, tot };
};
const B = (pasos, dia = HOY) => ({ tipo: 'base', pasos, dia });
const S = (pasos) => ({ tipo: 'sensor', pasos });
const VIVO = { nativo: true, activo: true, disponibilidad: 'disponible', permiso: 'concedido' };

export const CASOS = [
  { que: 'normalizarPasos: enteros entre 0 y el tope; lo demás es null', prueba: () => {
    igual([1234, '850', 12.6, 0, 250000].map(normalizarPasos), [1234, 850, 13, 0, TOPE_PASOS]);
    igual([-1, NaN, null, undefined, '', 'abc', true, Infinity].map(normalizarPasos), [null, null, null, null, null, null, null, null]);
  } },
  { que: `medianoche local y ventana de ${DIAS_LECTURA} días (también el día del cambio de hora)`, prueba: () => {
    igual(medianocheLocal(F(29, 18, 30)).getTime(), new Date(2026, 8, 29).getTime());
    igual(inicioVentana(F(29, 18, 30)).getTime(), new Date(2026, 8, 23).getTime());
    igual(claveDia(inicioVentana(new Date(2026, 9, 27, 10))), '2026-10-21', 'la ventana cruza el 25-oct');
    igual(claveDia(medianocheLocal(new Date(2026, 9, 25, 23, 59))), '2026-10-25');
  } },
  { que: 'en vivo: el total del sistema y, encima, cada paso del sensor', prueba: () => {
    igual(correr([B(3200), S(0), S(5), S(12)]).tot, [3200, 3200, 3205, 3212]);
  } },
  { que: 'un total nuevo del sistema reancla el sensor sin contar dos veces', prueba: () => {
    const { tot } = correr([B(3200), S(0), S(12), B(3215), S(20)]);
    igual(tot, [3200, 3200, 3212, 3215, 3223]);
  } },
  { que: 'si el sistema va por detrás, el número no baja y sigue subiendo con cada paso', prueba: () => {
    const { tot } = correr([B(3200), S(0), S(40), B(3100), S(45), S(60)]);
    igual(tot, [3200, 3200, 3240, 3240, 3245, 3260], 'se congelaba o bajaba');
  } },
  { que: 'el sensor vuelve a empezar (se apagó y encendió): se sigue desde lo contado', prueba: () => {
    igual(correr([B(5000), S(0), S(30), { tipo: 'reinicio' }, S(0), S(7)]).tot, [5000, 5000, 5030, 5030, 5030, 5037]);
    igual(correr([B(5000), S(0), S(30), S(4)]).tot, [5000, 5000, 5030, 5034], 'reinicio sin avisar');
  } },
  { que: 'medianoche con la app abierta: lo de ayer no pasa a hoy', prueba: () => {
    const ayer = correr([B(11200), S(0), S(300)]).c;                       // 29-sep, 23:59
    igual(ayer.total, 11500);
    const r = correr([S(320), B(15, MANANA)], MANANA, ayer);               // 30-sep, 00:00:30
    igual(r.tot, [20, 20], 'solo los pasos de después de medianoche');
    igual(r.c.dia, MANANA);
  } },
  { que: 'un total leído para ayer y entregado hoy se tira', prueba: () => {
    const hoyC = correr([B(40, MANANA)], MANANA).c;
    igual(correr([B(11200, HOY)], MANANA, hoyC).tot, [40]);
  } },
  { que: 'basura y tope: eventos ilegibles no cambian nada; el total no pasa de 99.999', prueba: () => {
    igual(correr([B(3000), { tipo: 'sensor', pasos: 'x' }, null, { tipo: 'otro', pasos: 5 }, B(-2)]).tot, [3000, 3000, 3000, 3000, 3000]);
    igual(correr([B(99990), S(0), S(50)]).tot, [99990, 99990, TOPE_PASOS]);
  } },
  { que: 'debeGuardar: solo si sube; al cruzar la meta, en el acto; si no, una vez por minuto', prueba: () => {
    const t = F(29, 10).getTime();
    ok(!debeGuardar({ valor: 3000, guardado: 3000, guardadoAt: 0, ahora: t }), 'no sube');
    ok(!debeGuardar({ valor: 2900, guardado: 3000, ahora: t, forzar: true }), 'baja: nunca');
    ok(debeGuardar({ valor: 3001, guardado: 3000, guardadoAt: null, ahora: t }), 'nunca guardado');
    ok(!debeGuardar({ valor: 3100, guardado: 3000, guardadoAt: t - 20000, ahora: t }), 'hace 20 s');
    ok(debeGuardar({ valor: 3100, guardado: 3000, guardadoAt: t - GUARDAR_CADA_MS, ahora: t }), 'hace 1 min');
    ok(debeGuardar({ valor: META_PASOS, guardado: 9990, guardadoAt: t - 1000, ahora: t }), 'cruza la meta');
    ok(!debeGuardar({ valor: 10500, guardado: 10200, guardadoAt: t - 1000, ahora: t }), 'ya pasada la meta: al minuto');
    ok(debeGuardar({ valor: 3100, guardado: 3000, guardadoAt: t - 1000, ahora: t, forzar: true }), 'a segundo plano');
  } },
  { que: 'estadoPasos: web, interruptor apagado o móvil sin podómetro ⇒ oculto', prueba: () => {
    igual(estadoPasos({ ...VIVO, nativo: false }), 'oculto');
    igual(estadoPasos({ ...VIVO, activo: false }), 'oculto');
    igual(estadoPasos({ ...VIVO, disponibilidad: 'no-disponible' }), 'oculto');
    igual(estadoPasos(), 'oculto');
  } },
  { que: 'estadoPasos: sin permiso se pide solo; instalar y denegado', prueba: () => {
    igual(estadoPasos({ ...VIVO, permiso: 'prompt' }), 'pedir');
    igual(estadoPasos({ ...VIVO, permiso: undefined }), 'pedir');
    igual(estadoPasos({ ...VIVO, disponibilidad: 'instalar' }), 'instalar');
    igual(estadoPasos({ ...VIVO, permiso: 'denegado' }), 'denegado');
  } },
  { que: 'estadoPasos: en vivo, y «sin datos» solo con 7 días a cero y 48 h desde el permiso', prueba: () => {
    const ahora = F(29, 12);
    igual(estadoPasos({ ...VIVO, pasos7d: 42000, desde: F(20).toISOString(), ahora }), 'vivo');
    igual(estadoPasos({ ...VIVO, pasos7d: 0, desde: F(29, 9).toISOString(), ahora }), 'vivo', 'recién dado el permiso');
    igual(estadoPasos({ ...VIVO, pasos7d: 0, desde: F(26).toISOString(), ahora }), 'sin-datos');
    igual(estadoPasos({ ...VIVO, pasos7d: null, desde: F(20).toISOString(), ahora }), 'vivo', 'aún sin leer');
  } },
  { que: 'sumaTramos: suma lo legible de Health Connect (value) o de la app (pasos)', prueba: () => {
    igual(sumaTramos([{ value: 4000 }, { value: '1200' }, { pasos: 800 }, { value: -3 }, null, { value: 'x' }]), 6000);
    igual(sumaTramos(null), 0);
  } },
];

for (const c of CASOS) test(`pasos · ${c.que}`, c.prueba);
