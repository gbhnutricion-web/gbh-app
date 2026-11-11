// ─── Compra de Apple del Estándar · puente con StoreKit 2 (11-nov-2026) ────────────────────────
// PEND-2026-319 · MAESTRO-2026-1246, anexo 1 (por orden de Alejandro: «Compra de Apple del
// Estándar») · 07. App GBH/DECISION_ios_estandar_2026-09-28.md §6.
// Solo actúa en la app de iPhone/iPad: en la web y en Android cada función vuelve sin hacer nada.
//  · Complemento @capgo/native-purchases (StoreKit 2). En capacitor.config.json de `tiendas`
//    va en ios.includePlugins.
//  · Cada compra lleva appAccountToken = id del perfil (un uuid): así Apple firma de quién es.
//  · La transacción firmada (jwsRepresentation) va al servicio de pagos (gbh_apple.py), que
//    verifica la firma y pone el plan. La transacción se cierra (finishTransaction) SOLO cuando
//    el servidor la ha apuntado; si no, StoreKit la vuelve a dar en el próximo arranque.
//  · La pantalla de compra es src/CompraApple.jsx.
import { Capacitor } from '@capacitor/core';
import { NativePurchases, PURCHASE_TYPE } from '@capgo/native-purchases';

export const PRODUCTO_ESTANDAR_IOS = 'es.gbhnutricion.app.estandar.mensual';
const API_PAGOS = 'https://gbh-stripe-production.up.railway.app';

const esIOS = () => { try { return Capacitor.isNativePlatform() && Capacitor.getPlatform() === 'ios'; } catch { return false; } };
export const comprasAppleDisponibles = () => { try { return esIOS() && Capacitor.isPluginAvailable('NativePurchases'); } catch { return false; } };

let configurado = null;
const configurar = () => {
  if (!configurado) {
    configurado = NativePurchases.configure({ autoFinishTransactions: false }).catch(() => {});
  }
  return configurado;
};

// {ok:true, hecho, estado, plan, plan_until} | {ok:false, motivo:'otra_cuenta'|'servidor'|'red'}
async function enviarAlServidor(jws, token) {
  let r;
  try {
    r = await fetch(`${API_PAGOS}/apple/transaccion`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', 'X-GBH-Sesion': token },
      body: JSON.stringify({ jws }),
    });
  } catch { return { ok: false, motivo: 'red' }; }
  const d = await r.json().catch(() => null);
  if (r.ok && d && d.ok) return { ...d, ok: true };
  if (r.status === 409) return { ok: false, motivo: 'otra_cuenta' };
  return { ok: false, motivo: 'servidor', status: r.status };
}

const cerrar = async (t) => { try { await NativePurchases.finishTransaction({ transactionId: t.transactionId }); } catch { /* ya cerrada */ } };

const motivoDeError = (e) => {
  const m = String((e && (e.message || e.code)) || e || '');
  if (/cancel/i.test(m)) return 'cancelada';
  if (/pending|deferred|pendiente/i.test(m)) return 'pendiente';
  return 'error';
};

// El producto con su precio en la moneda de la tienda del usuario (priceString), o null.
export async function productoEstandarIOS() {
  if (!comprasAppleDisponibles()) return null;
  try {
    const { product } = await NativePurchases.getProduct({ productIdentifier: PRODUCTO_ESTANDAR_IOS, productType: PURCHASE_TYPE.SUBS });
    return product || null;
  } catch { return null; }
}

export async function comprarEstandarIOS({ profileId, token }) {
  if (!comprasAppleDisponibles()) return { ok: false, motivo: 'no_disponible' };
  if (!token || !profileId) return { ok: false, motivo: 'sin_sesion' };
  await configurar();
  let tx;
  try {
    tx = await NativePurchases.purchaseProduct({
      productIdentifier: PRODUCTO_ESTANDAR_IOS,
      productType: PURCHASE_TYPE.SUBS,
      appAccountToken: String(profileId).toLowerCase(),
      quantity: 1,
      autoAcknowledgePurchases: false,
    });
  } catch (e) { return { ok: false, motivo: motivoDeError(e) }; }
  if (!tx || !tx.jwsRepresentation) return { ok: false, motivo: 'sin_firma' };
  const r = await enviarAlServidor(tx.jwsRepresentation, token);
  if (r.ok || r.motivo === 'otra_cuenta') await cerrar(tx);
  return r;
}

// Manda al servidor lo que StoreKit tenga sin cerrar y los derechos vigentes (renovaciones que
// el aviso de Apple no hubiera traído). Sin pedir nada al usuario. {enviadas, alta, otra}
export async function sincronizarComprasApple(token) {
  const res = { enviadas: 0, alta: false, otra: false };
  if (!comprasAppleDisponibles() || !token) return res;
  await configurar();
  const lote = [];
  try { const r = await NativePurchases.getUnfinishedTransactions(); lote.push(...((r && r.transactions) || [])); } catch { /* nada */ }
  try { const r = await NativePurchases.getPurchases({ onlyCurrentEntitlements: true }); lote.push(...((r && r.purchases) || [])); } catch { /* nada */ }
  const vistas = new Set();
  for (const t of lote) {
    if (!t || t.productIdentifier !== PRODUCTO_ESTANDAR_IOS || !t.jwsRepresentation || vistas.has(t.transactionId)) continue;
    vistas.add(t.transactionId);
    const r = await enviarAlServidor(t.jwsRepresentation, token);
    res.enviadas++;
    if (r.ok) { if (r.plan === 'standard') res.alta = true; await cerrar(t); }
    else if (r.motivo === 'otra_cuenta') { res.otra = true; await cerrar(t); }
  }
  return res;
}

// «Restaurar compras»: AppStore.sync (puede pedir el Apple ID) y luego lo mismo que al arrancar.
export async function restaurarComprasIOS(token) {
  if (!comprasAppleDisponibles()) return { enviadas: 0, alta: false, otra: false };
  try { await NativePurchases.restorePurchases(); } catch { /* sigue: los derechos vigentes bastan */ }
  return sincronizarComprasApple(token);
}

// ¿Tiene este iPhone una suscripción de Apple al Estándar vigente?
export async function suscripcionAppleActiva() {
  if (!comprasAppleDisponibles()) return false;
  try {
    const r = await NativePurchases.getPurchases({ onlyCurrentEntitlements: true });
    return ((r && r.purchases) || []).some((p) => p.productIdentifier === PRODUCTO_ESTANDAR_IOS && p.isActive !== false
      && (!p.expirationDate || Date.parse(p.expirationDate) > Date.now()));
  } catch { return false; }
}

// Hoja de suscripciones de Apple (cancelar, cambiar), dentro de la app.
export async function gestionarSuscripcionApple() {
  if (!comprasAppleDisponibles()) return false;
  try { await NativePurchases.manageSubscriptions(); return true; } catch { return false; }
}

// Renovaciones y compras aprobadas («Pedir la compra») que llegan con la app abierta.
let escuchando = false;
export function escucharComprasApple({ getToken, onCambio }) {
  if (escuchando || !comprasAppleDisponibles()) return;
  escuchando = true;
  configurar();
  NativePurchases.addListener('transactionUpdated', async (t) => {
    const token = getToken && getToken();
    if (!token || !t || t.productIdentifier !== PRODUCTO_ESTANDAR_IOS || !t.jwsRepresentation) return;
    const r = await enviarAlServidor(t.jwsRepresentation, token);
    if (r.ok || r.motivo === 'otra_cuenta') await cerrar(t);
    if (r.ok && onCambio) onCambio(r);
  }).catch(() => { escuchando = false; });
}
