// ─── Pantalla de compra del Estándar con Apple (iPhone/iPad) · 11-nov-2026 ─────────────────────
// PEND-2026-319 · MAESTRO-2026-1246, anexo 1 (por orden de Alejandro: «Compra de Apple del
// Estándar»). Lo que pide Apple a una suscripción (3.1.2): nombre, duración, precio de la App Store
// (no uno escrito a mano), que se renueva sola y cómo se cancela, «Restaurar compras» y enlaces que
// funcionen a los términos de uso (EULA de Apple) y a la política de privacidad.
// Cualquier pantalla la abre con abrirCompraApple(); App.jsx la pinta con <HojaCompraApple/>.
// En la web y en Android no se usa: el Estándar va por Stripe (web) o no se vende (Android, PEND-316).
import React, { useEffect, useState } from "react";
import { createPortal } from "react-dom";
import { productoEstandarIOS, comprarEstandarIOS, restaurarComprasIOS, suscripcionAppleActiva, gestionarSuscripcionApple } from "./comprasApple";

export const URL_EULA_APPLE = "https://www.apple.com/legal/internet-services/itunes/dev/stdeula/";
export const URL_PRIVACIDAD = "https://app.gbhnutricion.es/legal/";
// Por encima de la ficha de perfil (11000) y de la capa más alta de la app (12000); al nivel de las fuentes.
export const CAPA_COMPRA = 13000;

export const abrirCompraApple = () => {
  try { window.dispatchEvent(new CustomEvent("gbh:compra-apple")); } catch { /* sin ventana */ }
};

const TXT = {
  es: {
    titulo: "⭐ Plan Estándar",
    intro: "Para organizar tu alimentación con GBH a tu ritmo:",
    p1: "📅 Tu programación semanal a tu medida, con recetas y lista de la compra",
    p2: "📚 El recetario completo, por categorías y ordenado por calorías",
    nombre: "GBH Estándar · mensual",
    alMes: "al mes",
    renueva: "Suscripción de 1 mes que se renueva automáticamente",
    comprar: (p) => `Suscribirme por ${p} al mes`,
    cargando: "Cargando el precio de la App Store…",
    sinProducto: "No se ha podido cargar el precio de la App Store. Comprueba la conexión e inténtalo de nuevo en un momento.",
    letra: "El pago se carga a tu cuenta de Apple al confirmar la compra. La suscripción se renueva sola cada mes al mismo precio, salvo que la canceles al menos 24 horas antes de que acabe el periodo en curso. Puedes cancelarla cuando quieras en los ajustes de tu cuenta de Apple (Ajustes ▸ tu nombre ▸ Suscripciones).",
    eula: "Términos de uso (EULA)",
    privacidad: "Política de privacidad",
    restaurar: "Restaurar compras",
    comprando: "Abriendo la App Store…",
    restaurando: "Buscando tus compras…",
    hecho: "¡Listo! Ya tienes el plan Estándar ⭐",
    hechoSub: "Tu programación semanal y el recetario completo ya están abiertos.",
    cerrar: "Cerrar",
    seguir: "Empezar",
    pendiente: "La compra está pendiente de aprobación (por ejemplo, «Pedir la compra» en una cuenta familiar). En cuanto se apruebe, se activará sola.",
    otra: "Esta suscripción de Apple ya está unida a otra cuenta de GBH. Entra con esa cuenta para usarla.",
    nada: "No hemos encontrado ninguna suscripción al Estándar en este Apple ID.",
    error: "No se ha podido completar la compra. Si Apple te la ha cobrado, pulsa «Restaurar compras» y se activará.",
  },
  en: {
    titulo: "⭐ Standard plan",
    intro: "To organise your eating with GBH at your own pace:",
    p1: "📅 Your weekly meal plan, tailored to you, with recipes and shopping list",
    p2: "📚 The full recipe book, by category and sorted by calories",
    nombre: "GBH Standard · monthly",
    alMes: "per month",
    renueva: "1-month subscription that renews automatically",
    comprar: (p) => `Subscribe for ${p} per month`,
    cargando: "Loading the App Store price…",
    sinProducto: "The App Store price couldn't be loaded. Check your connection and try again in a moment.",
    letra: "Payment is charged to your Apple Account when you confirm the purchase. The subscription renews automatically every month at the same price unless you cancel it at least 24 hours before the end of the current period. You can cancel it at any time in your Apple Account settings (Settings ▸ your name ▸ Subscriptions).",
    eula: "Terms of Use (EULA)",
    privacidad: "Privacy Policy",
    restaurar: "Restore purchases",
    comprando: "Opening the App Store…",
    restaurando: "Looking for your purchases…",
    hecho: "Done! You now have the Standard plan ⭐",
    hechoSub: "Your weekly meal plan and the full recipe book are now unlocked.",
    cerrar: "Close",
    seguir: "Let's go",
    pendiente: "The purchase is waiting for approval (for example, Ask to Buy in a family account). It will activate as soon as it's approved.",
    otra: "This Apple subscription is already linked to another GBH account. Sign in with that account to use it.",
    nada: "We couldn't find a Standard subscription on this Apple Account.",
    error: "The purchase couldn't be completed. If Apple charged you, tap Restore purchases and it will activate.",
  },
};

// profile: el perfil REAL; getToken: () => token de sesión; onHecho: async () => refresca el perfil.
export function HojaCompraApple({ lang = "es", T, profile, getToken, onHecho, onClose }) {
  const L = TXT[lang] || TXT.es;
  const c = T || {};
  const [producto, setProducto] = useState(undefined);   // undefined = cargando · null = no hay
  const [estado, setEstado] = useState("listo");         // listo | comprando | restaurando | hecho
  const [aviso, setAviso] = useState("");

  useEffect(() => {
    let vivo = true;
    productoEstandarIOS().then((p) => { if (vivo) setProducto(p || null); });
    return () => { vivo = false; };
  }, []);

  const ocupado = estado === "comprando" || estado === "restaurando";
  const terminar = async () => { try { await onHecho?.(); } catch { /* el perfil se refresca al volver */ } setEstado("hecho"); };

  const comprar = async () => {
    if (ocupado || !producto) return;
    setAviso(""); setEstado("comprando");
    const r = await comprarEstandarIOS({ profileId: profile?.id, token: getToken?.() });
    if (r.ok) return terminar();
    setEstado("listo");
    if (r.motivo === "cancelada") return;
    setAviso(r.motivo === "pendiente" ? L.pendiente : r.motivo === "otra_cuenta" ? L.otra : L.error);
  };

  const restaurar = async () => {
    if (ocupado) return;
    setAviso(""); setEstado("restaurando");
    const r = await restaurarComprasIOS(getToken?.());
    if (r.alta) return terminar();
    setEstado("listo");
    setAviso(r.otra ? L.otra : L.nada);
  };

  const boton = (extra) => ({ width: "100%", border: "none", borderRadius: 16, padding: "15px 16px", fontWeight: 900, fontSize: 15,
    fontFamily: "'Nunito',sans-serif", cursor: ocupado ? "wait" : "pointer", ...extra });
  const enlace = { fontSize: 12, color: c.t2 || "#cfd8cf", fontFamily: "'DM Sans',sans-serif", textDecoration: "underline" };

  const cuerpo = (
    <div role="dialog" aria-modal="true" aria-label={L.titulo}
      style={{ position: "fixed", inset: 0, zIndex: CAPA_COMPRA, background: "rgba(0,0,0,0.86)", display: "flex", justifyContent: "center", alignItems: "center",
        padding: "calc(12px + env(safe-area-inset-top, 0px)) 14px calc(12px + env(safe-area-inset-bottom, 0px))" }}>
      <div style={{ width: "100%", maxWidth: 420, maxHeight: "100%", display: "flex", flexDirection: "column", background: "linear-gradient(180deg,#16301a,#0e2112)",
        border: `2px solid ${c.bW || "rgba(255,255,255,0.15)"}`, borderRadius: 22, overflow: "hidden" }}>
        <div style={{ display: "flex", alignItems: "center", gap: 10, padding: "14px 16px", borderBottom: "1px solid rgba(255,255,255,0.08)" }}>
          <div style={{ flex: 1, fontSize: 17, fontWeight: 900, color: c.t1 || "#fff", fontFamily: "'Nunito',sans-serif" }}>{L.titulo}</div>
          <button onClick={onClose} aria-label={L.cerrar} disabled={ocupado}
            style={{ width: 34, height: 34, borderRadius: "50%", border: "1.5px solid rgba(255,255,255,0.2)", background: "rgba(0,0,0,0.3)",
              color: c.t2 || "#cfd8cf", fontSize: 15, fontWeight: 900, cursor: "pointer", flexShrink: 0, opacity: ocupado ? 0.5 : 1 }}>✕</button>
        </div>
        <div style={{ overflowY: "auto", WebkitOverflowScrolling: "touch", padding: "14px 16px 18px", display: "flex", flexDirection: "column", gap: 12 }}>
          {estado === "hecho" ? (<>
            <div style={{ fontSize: 46, textAlign: "center" }}>🎉</div>
            <div style={{ fontSize: 17, fontWeight: 900, color: c.t1 || "#fff", textAlign: "center", fontFamily: "'Nunito',sans-serif" }}>{L.hecho}</div>
            <div style={{ fontSize: 13, color: c.t2 || "#cfd8cf", textAlign: "center", lineHeight: 1.55, fontFamily: "'DM Sans',sans-serif" }}>{L.hechoSub}</div>
            <button onClick={onClose} style={boton({ background: `linear-gradient(135deg,${c.g1 || "#2e9b55"},${c.g2 || "#4dc97a"})`, color: c.t1 || "#fff", boxShadow: `0 4px 0 ${c.g3 || "#1d6b39"}` })}>{L.seguir}</button>
          </>) : (<>
            <div style={{ fontSize: 13, color: c.t2 || "#cfd8cf", lineHeight: 1.55, fontFamily: "'DM Sans',sans-serif" }}>{L.intro}</div>
            {[L.p1, L.p2].map((t) => (
              <div key={t} style={{ fontSize: 13, color: c.t1 || "#fff", lineHeight: 1.5, fontFamily: "'DM Sans',sans-serif",
                background: "rgba(255,255,255,0.04)", border: "1px solid rgba(255,255,255,0.10)", borderRadius: 12, padding: "9px 11px" }}>{t}</div>
            ))}
            <div style={{ textAlign: "center", background: "rgba(77,201,122,0.08)", border: `2px solid ${c.bG || "rgba(77,201,122,0.45)"}`, borderRadius: 16, padding: "12px 12px 10px" }}>
              <div style={{ fontSize: 12, fontWeight: 800, color: c.t2 || "#cfd8cf", fontFamily: "'DM Sans',sans-serif" }}>{L.nombre}</div>
              {producto === undefined ? (
                <div style={{ fontSize: 13, color: c.t2 || "#cfd8cf", margin: "8px 0", fontFamily: "'DM Sans',sans-serif" }}>{L.cargando}</div>
              ) : producto === null ? (
                <div style={{ fontSize: 12.5, color: "#FFB4B4", margin: "8px 0", lineHeight: 1.5, fontFamily: "'DM Sans',sans-serif" }}>{L.sinProducto}</div>
              ) : (
                <div style={{ margin: "4px 0 2px" }}>
                  <span style={{ fontSize: 28, fontWeight: 900, color: c.g2 || "#4dc97a", fontFamily: "'Nunito',sans-serif" }}>{producto.priceString}</span>
                  <span style={{ fontSize: 13, color: c.t2 || "#cfd8cf", marginLeft: 6, fontFamily: "'DM Sans',sans-serif" }}>{L.alMes}</span>
                </div>
              )}
              <div style={{ fontSize: 11.5, color: c.t2 || "#cfd8cf", fontFamily: "'DM Sans',sans-serif" }}>{L.renueva}</div>
            </div>
            {aviso && (
              <div style={{ fontSize: 12.5, color: c.t1 || "#fff", lineHeight: 1.5, fontFamily: "'DM Sans',sans-serif",
                background: "rgba(255,200,80,0.08)", border: "1px solid rgba(255,200,80,0.3)", borderRadius: 12, padding: "10px 12px" }}>{aviso}</div>
            )}
            <button onClick={comprar} disabled={ocupado || !producto}
              style={boton({ background: `linear-gradient(135deg,${c.g1 || "#2e9b55"},${c.g2 || "#4dc97a"})`, color: c.t1 || "#fff",
                boxShadow: `0 4px 0 ${c.g3 || "#1d6b39"}`, opacity: (ocupado || !producto) ? 0.6 : 1 })}>
              {estado === "comprando" ? L.comprando : producto ? L.comprar(producto.priceString) : L.comprar("…")}
            </button>
            <button onClick={restaurar} disabled={ocupado}
              style={boton({ background: "rgba(255,255,255,0.06)", border: "1.5px solid rgba(255,255,255,0.18)", color: c.t1 || "#fff", fontSize: 13.5, padding: "11px 14px" })}>
              {estado === "restaurando" ? L.restaurando : L.restaurar}
            </button>
            <div style={{ fontSize: 10.5, color: c.t3 || "#9aa79a", lineHeight: 1.55, fontFamily: "'DM Sans',sans-serif" }}>{L.letra}</div>
            <div style={{ display: "flex", justifyContent: "center", gap: 16, flexWrap: "wrap" }}>
              <a href={URL_EULA_APPLE} target="_blank" rel="noopener noreferrer" style={enlace}>{L.eula}</a>
              <a href={URL_PRIVACIDAD} target="_blank" rel="noopener noreferrer" style={enlace}>{L.privacidad}</a>
            </div>
          </>)}
        </div>
      </div>
    </div>
  );
  return typeof document !== "undefined" && document.body ? createPortal(cuerpo, document.body) : cuerpo;
}

// Lado derecho de la fila «Suscripción» de la ficha de perfil, en iOS.
//  · Estándar pagado: si es de Apple, «Gestionar» (hoja de Apple); si se contrató fuera, solo lo dice.
//  · Gratis o semana de prueba: «Suscribirme», que abre la pantalla de compra.
export function ControlSuscripcionIOS({ lang = "es", T, pagado }) {
  const c = T || {};
  const [deApple, setDeApple] = useState(null);
  useEffect(() => {
    if (!pagado) return;
    let vivo = true;
    suscripcionAppleActiva().then((s) => { if (vivo) setDeApple(s); });
    return () => { vivo = false; };
  }, [pagado]);
  const estilo = { borderRadius: 10, padding: "8px 12px", fontWeight: 800, fontSize: 12, cursor: "pointer", fontFamily: "'Nunito',sans-serif", flexShrink: 0 };
  if (!pagado) return (
    <button onClick={abrirCompraApple}
      style={{ ...estilo, fontWeight: 900, background: `linear-gradient(135deg,${c.g1 || "#2e9b55"},${c.g2 || "#4dc97a"})`, border: "none", color: c.t1 || "#fff", boxShadow: `0 2px 0 ${c.g3 || "#1d6b39"}` }}>
      {lang === "en" ? "Subscribe" : "Suscribirme"}
    </button>
  );
  if (deApple === null) return null;
  if (deApple) return (
    <button onClick={() => gestionarSuscripcionApple()}
      style={{ ...estilo, background: "rgba(255,255,255,0.08)", border: "1.5px solid rgba(255,255,255,0.18)", color: c.t1 || "#fff" }}>
      {lang === "en" ? "Manage" : "Gestionar"}
    </button>
  );
  return (
    <div style={{ fontSize: 10, color: c.t3 || "#9aa79a", fontFamily: "'DM Sans',sans-serif", maxWidth: 150, textAlign: "right", lineHeight: 1.4 }}>
      {lang === "en" ? "Subscribed outside the App Store" : "Contratada fuera de la App Store"}
    </div>
  );
}
