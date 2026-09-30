// ═══ 📲 PASOS DEL MÓVIL: la línea de dentro de la misión de pasos (30-sep-2026) ═══════
// 07. App GBH/BRIEF_pasos.md. Aquí solo se pinta: el estado lo decide src/motorPasos.js
// (estadoPasos) a través de src/usePasosMovil.js. Sin botón de conectar (orden de Alejandro,
// 29-sep: «automático y en vivo»): el permiso lo pide la app sola y el diálogo es del sistema.
// Los botones sirven solo cuando algo falta (permiso negado, Health Connect sin instalar).
// En la web y con el interruptor del operador apagado no se pinta nada.
import React from "react";

const TXT = {
  es: {
    vivo: "📲 Contados por tu móvil · en vivo",
    vivoMinuto: "📲 Contados por tu móvil · cada minuto",
    conectando: "📲 Conectando con los pasos de tu móvil…",
    denegado: {
      ios: "Para que tus pasos se apunten solos: Ajustes › GBH Nutrición › activa «Movimiento y forma física».",
      android: "Para que tus pasos se apunten solos, da permiso a GBH para leer tus pasos en Health Connect.",
    },
    abrirHC: "Abrir Health Connect",
    instalar: "Para contar tus pasos solos en Android hace falta la app Health Connect (gratis, de Google).",
    instalarBtn: "Instalar Health Connect",
    sinDatos: {
      ios: "Tu iPhone no da pasos a GBH. Mira en Ajustes › Privacidad y seguridad › Movimiento y forma física que «Registro de actividad física» esté activado.",
      android: "Health Connect no tiene pasos. En la app que te los cuenta (Samsung Health, Google Fit, la de tu reloj), activa que los comparta con Health Connect.",
    },
    mirar: "Volver a mirar",
  },
  en: {
    vivo: "📲 Counted by your phone · live",
    vivoMinuto: "📲 Counted by your phone · every minute",
    conectando: "📲 Connecting to your phone's steps…",
    denegado: {
      ios: "To log your steps automatically: Settings › GBH Nutrición › turn on «Motion & Fitness».",
      android: "To log your steps automatically, allow GBH to read your steps in Health Connect.",
    },
    abrirHC: "Open Health Connect",
    instalar: "To count your steps automatically on Android you need the Health Connect app (free, by Google).",
    instalarBtn: "Install Health Connect",
    sinDatos: {
      ios: "Your iPhone gives GBH no steps. Check Settings › Privacy & Security › Motion & Fitness and turn on «Fitness Tracking».",
      android: "Health Connect has no steps. In the app that counts them (Samsung Health, Google Fit, your watch's app), turn on sharing with Health Connect.",
    },
    mirar: "Check again",
  },
};
const tx = (lang) => TXT[lang === "en" ? "en" : "es"];
const so = (plataforma) => (plataforma === "android" ? "android" : "ios");

const btn = (T, principal) => ({
  background: principal ? `linear-gradient(135deg,${T.g1},${T.g2})` : "rgba(255,255,255,0.06)",
  border: principal ? "none" : "1.5px solid rgba(255,255,255,0.16)", borderRadius: 12,
  padding: "9px 12px", color: principal ? "#fff" : T.t2, fontWeight: principal ? 900 : 800,
  fontSize: 12.5, cursor: "pointer", boxShadow: principal ? `0 3px 0 ${T.g3}` : "none",
  fontFamily: "'Nunito',sans-serif",
});
const nota = (T) => ({ fontSize: 11.5, color: T.t2, fontFamily: "'DM Sans',sans-serif", lineHeight: 1.45 });
const caja = { marginTop: 10, paddingTop: 10, borderTop: "1px solid rgba(255,255,255,0.08)" };

// El punto que late mientras el sensor cuenta en vivo.
const PUNTO_CSS = "@keyframes gbhPasosLatido{0%,100%{opacity:1;transform:scale(1)}50%{opacity:.35;transform:scale(.7)}}";

// estado: 'pedir' | 'vivo' | 'denegado' | 'instalar' | 'sin-datos' (los demás no pintan)
export function FilaPasosMovil({ estado, plataforma = "ios", lang = "es", T, ocupado = false, sensor = "concedido",
  onAbrirAjustes, onInstalar, onReintentar }) {
  const s = tx(lang);
  if (estado === "pedir") {
    if (!ocupado) return null;
    return <div data-pasos="pedir" style={{ ...caja, ...nota(T) }}>{s.conectando}</div>;
  }
  if (estado === "vivo") {
    const enVivo = plataforma !== "android" || sensor === "concedido";
    return (
      <div data-pasos="vivo" style={{ ...caja, display: "flex", alignItems: "center", gap: 8 }}>
        <style>{PUNTO_CSS}</style>
        {enVivo ? <span aria-hidden="true" style={{ width: 8, height: 8, borderRadius: 4, background: T.g2, flexShrink: 0,
          animation: "gbhPasosLatido 1.6s ease-in-out infinite" }}/> : null}
        <span style={{ fontSize: 12, fontWeight: 800, color: T.g2, fontFamily: "'Nunito',sans-serif" }}>
          {enVivo ? s.vivo : s.vivoMinuto}
        </span>
      </div>
    );
  }
  if (estado === "denegado") {
    return (
      <div data-pasos="denegado" style={caja}>
        <div style={nota(T)}>{s.denegado[so(plataforma)]}</div>
        {plataforma === "android" ? (
          <button onClick={onAbrirAjustes} style={{ ...btn(T, true), marginTop: 8, width: "100%" }}>{s.abrirHC}</button>
        ) : null}
      </div>
    );
  }
  if (estado === "instalar") {
    return (
      <div data-pasos="instalar" style={caja}>
        <div style={nota(T)}>{s.instalar}</div>
        <button onClick={onInstalar} style={{ ...btn(T, true), marginTop: 8, width: "100%" }}>{s.instalarBtn}</button>
      </div>
    );
  }
  if (estado === "sin-datos") {
    return (
      <div data-pasos="sin-datos" style={caja}>
        <div style={nota(T)}>{s.sinDatos[so(plataforma)]}</div>
        <button onClick={onReintentar} style={{ ...btn(T, false), marginTop: 8, width: "100%" }}>{s.mirar}</button>
      </div>
    );
  }
  return null;
}
