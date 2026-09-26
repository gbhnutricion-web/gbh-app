// node --test tests/partidaPendiente.test.mjs (sin Node en el PC de GBH: los mismos casos se ejecutan en
// Chrome sin cabeza con arnes_partidas.py, en la carpeta de la App). Horas en UTC; Madrid = UTC+2 en septiembre.
import test from 'node:test';
import assert from 'node:assert/strict';
import { clasificarRespuesta, yaEstaEnElServidor, opDePartidaCaducada, esPendienteDeHoy, diaMadrid, TOPE_PUNTOS }
  from '../src/partidaPendiente.js';

export const CASOS_RESPUESTA = [
  { r: { ok: true, status: 200, data: { ok: true, puntos_hoy: 1400 } }, estado: 'ok' },
  { r: { ok: true, status: 200, data: { ok: false, error: 'limite_diario_alcanzado' } }, estado: 'rechazo', error: 'limite_diario_alcanzado' },
  { r: { ok: true, status: 200, data: { ok: false, error: 'puntos_fuera_de_rango' } }, estado: 'rechazo', error: 'puntos_fuera_de_rango' },
  { r: { ok: false, status: 404, data: null }, estado: 'rechazo', error: 'http_404' },
  { r: { ok: false, status: 0, data: null }, estado: 'sin_respuesta' },          // corte de red (sbDirect)
  { r: { ok: false, status: 503, data: null }, estado: 'sin_respuesta' },        // 5xx: se reintenta
  { r: { ok: true, status: 200, data: null }, estado: 'sin_respuesta' },         // 200 ilegible (portal cautivo)
  { r: undefined, estado: 'sin_respuesta' },
];

// Pago de la 3.ª partida del 26-sep a las 10:19:01 UTC; el servidor la graba al terminar
const PAGO = Date.parse('2026-09-26T10:19:01Z');
export const CASOS_SERVIDOR = [
  { nombre: 'la fila de la partida, creada tras el pago', t: { pagada: PAGO, pts: 1400 },
    filas: [{ puntos: 608, created_at: '2026-09-26T10:13:13Z' }, { puntos: 1400, created_at: '2026-09-26T10:22:40Z' }], esta: true },
  { nombre: 'mismos puntos pero ANTES del pago: es otra partida', t: { pagada: PAGO, pts: 470 },
    filas: [{ puntos: 470, created_at: '2026-09-26T10:18:29Z' }], esta: false },
  { nombre: 'reloj del móvil 20 s adelantado: la fila sigue contando', t: { pagada: PAGO + 20000, pts: 90 },
    filas: [{ puntos: 90, created_at: '2026-09-26T10:19:05Z' }], esta: true },
  { nombre: 'otros puntos tras el pago: no es ella', t: { pagada: PAGO, pts: 1400 },
    filas: [{ puntos: 780, created_at: '2026-09-26T10:31:30Z' }], esta: false },
  { nombre: 'testigo sin hora de pago (versión anterior): se envía', t: { pts: 1400 },
    filas: [{ puntos: 1400, created_at: '2026-09-26T10:22:40Z' }], esta: false },
  { nombre: 'sin filas', t: { pagada: PAGO, pts: 0 }, filas: null, esta: false },
];

export const CASOS_COLA = [
  { nombre: 'partida en cola de AYER: caduca', op: { path: 'rpc/registrar_partida_juego', ts: Date.parse('2026-09-26T10:22:40Z') }, hoy: '2026-09-27', caduca: true },
  { nombre: 'partida en cola de HOY: se envía', op: { path: 'rpc/registrar_partida_juego', ts: Date.parse('2026-09-26T10:22:40Z') }, hoy: '2026-09-26', caduca: false },
  { nombre: 'las 23:30 de Madrid son 21:30 UTC del mismo día', op: { path: 'rpc/registrar_partida_juego', ts: Date.parse('2026-09-26T21:30:00Z') }, hoy: '2026-09-26', caduca: false },
  { nombre: 'las 00:30 de Madrid ya son el día siguiente', op: { path: 'rpc/registrar_partida_juego', ts: Date.parse('2026-09-26T22:30:00Z') }, hoy: '2026-09-26', caduca: true },
  { nombre: 'otra escritura antigua NO se toca', op: { path: 'daily_logs?on_conflict=profile_id,log_date', ts: Date.parse('2026-09-20T10:00:00Z') }, hoy: '2026-09-26', caduca: false },
];

export const CASOS_PENDIENTE = [
  { nombre: 'testigo de hoy sin partida en marcha: pendiente', t: { fecha: '2026-09-26' }, hoy: '2026-09-26', enCurso: false, pendiente: true },
  { nombre: 'partida en marcha: no es pendiente', t: { fecha: '2026-09-26' }, hoy: '2026-09-26', enCurso: true, pendiente: false },
  { nombre: 'testigo de ayer: no cuenta hoy', t: { fecha: '2026-09-25' }, hoy: '2026-09-26', enCurso: false, pendiente: false },
  { nombre: 'sin testigo', t: null, hoy: '2026-09-26', enCurso: false, pendiente: false },
];

test('el tope del cliente es el del servidor', () => { assert.equal(TOPE_PUNTOS, 10000); });
test('diaMadrid cambia de día a las 22:00 UTC en verano', () => {
  assert.equal(diaMadrid(Date.parse('2026-09-26T21:59:00Z')), '2026-09-26');
  assert.equal(diaMadrid(Date.parse('2026-09-26T22:00:00Z')), '2026-09-27');
});
for (const c of CASOS_RESPUESTA) test(`respuesta · ${JSON.stringify(c.r)}`, () => {
  const x = clasificarRespuesta(c.r);
  assert.equal(x.estado, c.estado);
  if (c.error) assert.equal(x.res.error, c.error);
});
for (const c of CASOS_SERVIDOR) test(`servidor · ${c.nombre}`, () => { assert.equal(yaEstaEnElServidor(c.filas, c.t), c.esta); });
for (const c of CASOS_COLA) test(`cola · ${c.nombre}`, () => { assert.equal(opDePartidaCaducada(c.op, c.hoy), c.caduca); });
for (const c of CASOS_PENDIENTE) test(`pendiente · ${c.nombre}`, () => { assert.equal(esPendienteDeHoy(c.t, c.hoy, c.enCurso), c.pendiente); });
