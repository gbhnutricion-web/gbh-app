// ─── Avisos fuera de la app · puente con el complemento nativo (28-sep-2026) ───
// Solo actúa en la app de tienda (Capacitor) y con @capacitor/local-notifications
// instalado; en la web cada función vuelve sin hacer nada. El cálculo de QUÉ avisar
// es de src/motorAvisos.js; aquí solo se habla con el sistema.
// Dos reglas del BRIEF_notificaciones.md que viven aquí:
//  · NUNCA se llama a schedule() sin permiso concedido: desde la 8.3.0 el complemento
//    pide él mismo el permiso de Android si falta, y el diálogo saldría a destiempo (§3.1).
//  · isExactNotification: false en cada aviso. Por defecto es true y, sin el permiso de
//    alarma exacta, schedule() abre en Android 12+ la pantalla «Alarmas y recordatorios».
//    El permiso se quita del manifiesto en scripts/prep-native.mjs (§4.3).
import { Capacitor } from '@capacitor/core';
import { LocalNotifications } from '@capacitor/local-notifications';

export const ICONO_ANDROID = 'ic_stat_gbh';   // res/drawable del proyecto nativo (prep-native.mjs)
export const COLOR_ANDROID = '#4DC97A';       // T.g2
// Canal propio de Android con importancia ALTA (4): así el aviso sale como banner y no se
// queda escondido en la barra. Si crearlo falla, los avisos van al canal por defecto: un
// channelId que no existe haría que NO sonaran (definitions.d.ts del complemento).
export const CANAL_ANDROID = { id: 'gbh-avisos', name: 'Avisos de GBH', description: 'Comidas, tomas, pesaje y racha', importance: 4, vibration: true };
let canalListo = null;   // null = sin intentar · true · false
async function asegurarCanal() {
  if (canalListo !== null) return canalListo;
  try {
    if (Capacitor.getPlatform() !== 'android') { canalListo = false; return false; }
    await LocalNotifications.createChannel(CANAL_ANDROID);
    canalListo = true;
  } catch { canalListo = false; }
  return canalListo;
}

export const esAppNativa = () => { try { return Capacitor.isNativePlatform(); } catch { return false; } };
export const plataforma = () => { try { return Capacitor.getPlatform(); } catch { return 'web'; } };
const disponible = () => {
  try { return Capacitor.isNativePlatform() && Capacitor.isPluginAvailable('LocalNotifications'); } catch { return false; }
};

// 'granted' | 'denied' | 'prompt' | 'prompt-with-rationale' | 'no-disponible' | 'error'
export async function estadoPermiso() {
  if (!disponible()) return 'no-disponible';
  try { return (await LocalNotifications.checkPermissions()).display; } catch { return 'error'; }
}

export async function pedirPermiso() {
  if (!disponible()) return 'no-disponible';
  try { return (await LocalNotifications.requestPermissions()).display; } catch { return 'error'; }
}

// Deja programada EXACTAMENTE la lista: cancela lo pendiente y programa lo nuevo. Es
// idempotente (los IDs son estables) y la app no programa nada más que esto.
export async function sincronizarAvisos(lista) {
  if (!disponible()) return { ok: false, motivo: 'no-disponible' };
  try {
    if ((await LocalNotifications.checkPermissions()).display !== 'granted') return { ok: false, motivo: 'sin-permiso' };
    const pend = ((await LocalNotifications.getPending()) || {}).notifications || [];
    if (pend.length) await LocalNotifications.cancel({ notifications: pend.map((n) => ({ id: n.id })) });
    if (!lista || !lista.length) return { ok: true, programados: 0, cancelados: pend.length };
    const canal = await asegurarCanal();
    await LocalNotifications.schedule({
      notifications: lista.map((a) => ({
        id: a.id,
        title: a.titulo,
        body: a.cuerpo,
        schedule: { at: a.at, allowWhileIdle: true },
        isExactNotification: false,
        smallIcon: ICONO_ANDROID,
        iconColor: COLOR_ANDROID,
        ...(canal ? { channelId: CANAL_ANDROID.id } : {}),
        foreground: true,          // con la app abierta también se ve: su pop-up de dentro ya no sale
        autoCancel: true,
        group: 'gbh',              // Android agrupa los avisos de GBH
        threadIdentifier: 'gbh',   // iOS igual
        extra: { destino: a.destino, tipo: a.tipo, fecha: a.fecha, toma: a.toma || null },
      })),
    });
    return { ok: true, programados: lista.length, cancelados: pend.length };
  } catch (err) {
    return { ok: false, motivo: String((err && err.message) || err) };
  }
}

// El interruptor del operador apagado, o el paciente que lo desactiva todo.
export async function cancelarAvisos() {
  if (!disponible()) return { ok: false, motivo: 'no-disponible' };
  try {
    const pend = ((await LocalNotifications.getPending()) || {}).notifications || [];
    if (pend.length) await LocalNotifications.cancel({ notifications: pend.map((n) => ({ id: n.id })) });
    return { ok: true, cancelados: pend.length };
  } catch (err) {
    return { ok: false, motivo: String((err && err.message) || err) };
  }
}

// Tocar un aviso abre la app: se le pasa el `extra` ({destino, tipo, fecha, toma}).
// Devuelve la función que quita el oyente.
export function alTocarAviso(fn) {
  if (!disponible()) return () => {};
  let handle = null, vivo = true;
  LocalNotifications.addListener('localNotificationActionPerformed', (ev) => {
    try { fn((ev && ev.notification && ev.notification.extra) || {}); } catch { /* nunca tumbar la app por un toque */ }
  }).then((h) => { if (vivo) handle = h; else h.remove(); }).catch(() => {});
  return () => { vivo = false; if (handle) handle.remove(); };
}
