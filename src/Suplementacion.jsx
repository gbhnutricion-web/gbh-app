// ═══ 💊 SUPLEMENTACIÓN: una pestaña con un botón por suplemento (26-sep-2026) ═══
// Orden de Alejandro (26-sep): la calculadora de cafeína no va como tarjeta en Inicio, sino en una
// pestaña propia, «Suplementación» con 💊, que tiene un botón por suplemento:
// - ☕ Cafeína abre la calculadora (src/Cafeina.jsx, sobre el motor src/motorCafeina.js);
// - 💪 Creatina «(próximamente)» se ve, pero todavía no se puede pulsar: su modelo aún no existe.
//
// Para sumar un suplemento nuevo:
// 1. Se añade su fila en SUPLEMENTOS con disponible:false, y sale como «(próximamente)».
// 2. Cuando su modelo esté hecho y medido, se pasa a disponible:true y App.jsx abre su pantalla
//    desde onAbrir(id), igual que la cafeína.
//
// Este módulo no sabe nada del paciente y no recibe sbReq: solo pinta los botones y dice cuál se
// ha pulsado. La calculadora se abre a pantalla completa desde App.jsx, fuera de la pestaña, porque
// .tab-in anima con transform y un position:fixed dentro de un transform no ocupa la pantalla.
// El icono de la creatina es 💪 porque es el que la app ya usa para «Suplemento» (SUPL_IC).
import React from "react";

// titulo, sub y aria son claves de TRANS (App.jsx). La tarjeta de la cafeína reutiliza cafSub y
// cafAbrir, las mismas que usaba su tarjeta de Inicio de la fase 1.
export const SUPLEMENTOS = [
  { id: "cafeina",  icono: "☕", titulo: "suplCafeina",  sub: "cafSub",          aria: "cafAbrir",         disponible: true },
  { id: "creatina", icono: "💪", titulo: "suplCreatina", sub: "suplCreatinaSub", aria: "suplNoDisponible", disponible: false },
];

export function Suplementacion({ t, T, sfx, onAbrir }) {
  return (
    <div style={{ paddingTop: 8, paddingBottom: 8 }}>
      <div style={{ fontSize: 22, fontWeight: 900, color: T.t1, lineHeight: 1.2, fontFamily: "'Nunito',sans-serif" }}>
        {t("suplTitulo")}
      </div>
      <div style={{ fontSize: 13, color: T.t2, lineHeight: 1.5, margin: "4px 0 16px", fontFamily: "'DM Sans',sans-serif" }}>
        {t("suplIntro")}
      </div>
      {SUPLEMENTOS.map((s) => (
        <button key={s.id} data-supl={s.id} disabled={!s.disponible} aria-disabled={!s.disponible} aria-label={t(s.aria)}
          onClick={s.disponible ? () => { sfx && sfx("tap"); onAbrir && onAbrir(s.id); } : undefined}
          style={{ width: "100%", boxSizing: "border-box", display: "flex", alignItems: "center", gap: 12,
                   background: T.bgWood, border: `2px solid ${T.bW}`, borderRadius: 18, padding: "14px 16px",
                   marginBottom: 12, textAlign: "left", cursor: s.disponible ? "pointer" : "default",
                   boxShadow: s.disponible ? "0 4px 0 rgba(0,0,0,0.4)" : "none", opacity: s.disponible ? 1 : 0.55 }}>
          <span style={{ fontSize: 26, lineHeight: 1, filter: s.disponible ? "none" : "grayscale(0.8)" }}>{s.icono}</span>
          <span style={{ flex: 1, minWidth: 0 }}>
            <span style={{ display: "block", fontSize: 15, fontWeight: 900, color: T.t1, fontFamily: "'Nunito',sans-serif" }}>
              {t(s.titulo)}
              {!s.disponible && <span style={{ fontWeight: 700, color: T.t2 }}> {t("suplProximamente")}</span>}
            </span>
            <span style={{ display: "block", fontSize: 12, color: T.t2, marginTop: 2, fontFamily: "'DM Sans',sans-serif" }}>
              {t(s.sub)}
            </span>
          </span>
          {s.disponible && <span style={{ color: T.au1, fontSize: 20, fontWeight: 900 }}>›</span>}
        </button>
      ))}
    </div>
  );
}
