// ─── Pasos del móvil · puente con los complementos nativos (30-sep-2026) ───────────
// 07. App GBH/BRIEF_pasos.md. Solo actúa en la app de tienda: en la web cada función vuelve
// sin hacer nada. Qué hacer con los números es de src/motorPasos.js; cuándo, de
// src/usePasosMovil.js. Aquí solo se habla con el sistema.
//  · iPhone: @capgo/capacitor-pedometer (CoreMotion). Total desde medianoche y cada paso en
//    vivo, con el permiso «Movimiento y forma física». Sin HealthKit: cuenta los pasos del
//    iPhone, no los del Apple Watch.
//  · Android: @capgo/capacitor-health (Health Connect, solo READ_STEPS; los demás permisos del
//    complemento se quitan en scripts/prep-native.mjs) da el total del día, y el sensor de pasos
//    de @capgo/capacitor-pedometer (ACTIVITY_RECOGNITION) cada paso nuevo.
//  · Health Connect NO entra en la app de iPhone: capacitor.config.json → ios.includePlugins.
import { Capacitor } from '@capacitor/core';
import { CapacitorPedometer } from '@capgo/capacitor-pedometer';
import { Health } from '@capgo/capacitor-health';
import { normalizarPasos, sumaTramos, medianocheLocal, inicioVentana, claveDia } from './motorPasos';

const nativo = () => { try { return Capacitor.isNativePlatform(); } catch { return false; } };
const hay = (nombre) => { try { return nativo() && Capacitor.isPluginAvailable(nombre); } catch { return false; } };
export const plataformaPasos = () => { try { return nativo() ? Capacitor.getPlatform() : 'web'; } catch { return 'web'; } };
export const fuentePasos = () => ({ ios: 'coremotion', android: 'health-connect' }[plataformaPasos()] || null);
const aEstado = (s) => (s === 'granted' ? 'concedido' : s === 'denied' ? 'denegado' : 'pendiente');
const tieneSteps = (a) => !!(a && Array.isArray(a.readAuthorized) && a.readAuthorized.includes('steps'));

// 'disponible' | 'instalar' (Android sin Health Connect al día) | 'no-disponible'
export async function disponibilidadPasos() {
  const p = plataformaPasos();
  try {
    if (p === 'ios') {
      if (!hay('CapacitorPedometer')) return 'no-disponible';
      const r = await CapacitorPedometer.isAvailable();
      return r && r.stepCounting ? 'disponible' : 'no-disponible';
    }
    if (p === 'android') {
      if (!hay('Health')) return 'no-disponible';
      const r = await Health.isAvailable();
      if (r && r.available) return 'disponible';
      // SDK_UNAVAILABLE_PROVIDER_UPDATE_REQUIRED: sin instalar (Android 9-13) o viejo
      return /update/i.test(String((r && r.reason) || '')) ? 'instalar' : 'no-disponible';
    }
  } catch { /* nunca tumbar la app por esto */ }
  return 'no-disponible';
}

// {total, sensor}: el permiso del total del día y el del sensor en vivo, cada uno
// 'concedido' | 'denegado' | 'pendiente'. En iPhone son el mismo permiso. En Android, Health
// Connect no distingue «nunca preguntado» de «denegado»: sin conceder vuelve 'pendiente', y
// quien llama lo lee con su marca de «ya se pidió en este móvil» (usePasosMovil).
export async function permisoPasos() {
  const p = plataformaPasos();
  try {
    if (p === 'ios') {
      const s = aEstado((await CapacitorPedometer.checkPermissions()).activityRecognition);
      return { total: s, sensor: s };
    }
    if (p === 'android') {
      const total = tieneSteps(await Health.checkAuthorization({ read: ['steps'] })) ? 'concedido' : 'pendiente';
      let sensor = 'pendiente';
      try { sensor = aEstado((await CapacitorPedometer.checkPermissions()).activityRecognition); } catch { /* sin sensor */ }
      return { total, sensor };
    }
  } catch { /* se queda en pendiente */ }
  return { total: 'pendiente', sensor: 'pendiente' };
}

// Pide los permisos (los diálogos son del sistema: la app no pinta botón). En Android, primero
// Health Connect y, solo si lo concede, el del sensor.
export async function pedirPermisoPasos() {
  const p = plataformaPasos();
  try {
    if (p === 'ios') {
      const s = aEstado((await CapacitorPedometer.requestPermissions()).activityRecognition);
      return { total: s, sensor: s };
    }
    if (p === 'android') {
      const ok = tieneSteps(await Health.requestAuthorization({ read: ['steps'] }));
      let sensor = 'pendiente';
      if (ok) { try { sensor = aEstado((await CapacitorPedometer.requestPermissions()).activityRecognition); } catch { /* sin sensor */ } }
      return { total: ok ? 'concedido' : 'denegado', sensor };
    }
  } catch { /* abajo */ }
  return { total: 'error', sensor: 'pendiente' };
}

async function leerRango(inicio, fin) {
  const p = plataformaPasos();
  if (p === 'ios') {
    const r = await CapacitorPedometer.getMeasurement({ start: inicio.getTime(), end: fin.getTime() });
    return normalizarPasos(r && r.numberOfSteps);
  }
  if (p === 'android') {
    // El sistema agrega (COUNT_TOTAL): móvil + reloj no se cuentan dos veces.
    const r = await Health.queryAggregated({ dataType: 'steps', startDate: inicio.toISOString(),
      endDate: fin.toISOString(), bucket: 'day', aggregation: 'sum' });
    return sumaTramos(r && r.samples);
  }
  return null;
}

// Pasos de hoy desde la medianoche local: {dia, pasos} o null si no se pudo leer.
export async function leerHoyPasos(ahora = new Date()) {
  try {
    const n = await leerRango(medianocheLocal(ahora), ahora);
    return n === null ? null : { dia: claveDia(ahora), pasos: n };
  } catch { return null; }
}

// Pasos de los últimos 7 días (hoy incluido), para saber si el sistema da datos. null si falla.
export async function leerSemanaPasos(ahora = new Date()) {
  try { return await leerRango(inicioVentana(ahora), ahora); } catch { return null; }
}

// Enciende el sensor: onPasos(n) recibe los pasos contados desde que se encendió. Devuelve la
// función que lo apaga. Sin permiso o sin sensor, devuelve una que no hace nada.
export async function encenderSensorPasos(onPasos) {
  if (!hay('CapacitorPedometer')) return async () => {};
  let handle = null, vivo = true;
  try {
    handle = await CapacitorPedometer.addListener('measurement', (ev) => {
      if (!vivo) return;
      const n = normalizarPasos(ev && ev.numberOfSteps);
      if (n !== null) { try { onPasos(n); } catch { /* nunca tumbar la app por un paso */ } }
    });
    await CapacitorPedometer.startMeasurementUpdates();
  } catch {
    vivo = false;
    try { if (handle) await handle.remove(); } catch { /* ya estaba quitado */ }
    return async () => {};
  }
  return async () => {
    vivo = false;
    try { if (handle) await handle.remove(); } catch { /* ya estaba quitado */ }
    try { await CapacitorPedometer.stopMeasurementUpdates(); } catch { /* ya estaba apagado */ }
  };
}

// Android: los ajustes de Health Connect (para dar el permiso que se negó) o su ficha de Play.
export async function abrirAjustesPasos() {
  if (plataformaPasos() !== 'android' || !hay('Health')) return false;
  try { await Health.openHealthConnectSettings(); return true; } catch { return false; }
}
export function abrirInstalarHealthConnect() {
  try { window.open('https://play.google.com/store/apps/details?id=com.google.android.apps.healthdata', '_blank', 'noopener'); } catch { /* nada */ }
}
