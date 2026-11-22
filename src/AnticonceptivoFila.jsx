// ═══ 💊 Fila «Anticonceptivo hormonal» de la ficha de perfil (22-nov-2026, PEND-2026-279 pregunta 2) ═══
// Solo se pinta para mujeres (lo decide quien la monta: profile.sex === "F").
// La app no pregunta lo que ya sabe: si la medicación registrada ya dice que lo toma (`med`),
// la fila lo enseña y no ofrece las opciones. Si no, tres opciones; un toque guarda.
//   valor:    "combinado" | "sin_estrogeno" | "no" | null (sin indicar)
//   med:      { estado, item } de la medicación, o null si la medicación no dice nada;
//             undefined mientras se está mirando (no se pinta nada para no parpadear).
//   onElegir: (valor) => void
// Solo pinta: no lee ni escribe en ningún sitio. Los textos son claves de TRANS (App.jsx).
import React from "react";

export const ANTI_OPCIONES = [
  ["combinado", "antiComb", "antiCombX"],
  ["sin_estrogeno", "antiSolo", "antiSoloX"],
  ["no", "antiNo", "antiNoX"],
];

export function AnticonceptivoFila({ valor = null, med, onElegir, t, T }) {
  if (med === undefined) return null;
  return (
    <div data-anti-fila={med ? "medicacion" : (valor || "sin_indicar")} style={{ borderBottom: "1px solid rgba(255,255,255,0.07)", padding: "12px 0" }}>
      <div style={{ fontSize: 10, color: T.t2, textTransform: "uppercase", letterSpacing: "0.08em", fontFamily: "'DM Sans',sans-serif" }}>
        💊 {t("antiTit")}
      </div>
      {med ? (
        <div data-anti-med="1" style={{ fontSize: 13, color: T.wh, marginTop: 6, lineHeight: 1.4, fontFamily: "'DM Sans',sans-serif" }}>
          {t(med.estado === "solo_gestageno" ? "antiMedSolo" : "antiMed", { item: med.item })}
        </div>
      ) : (
        <>
          <div style={{ fontSize: 11, color: T.t2, margin: "4px 0 8px", lineHeight: 1.4, fontFamily: "'DM Sans',sans-serif" }}>
            {t("antiSub")}
          </div>
          <div role="radiogroup" aria-label={t("antiTit")} style={{ display: "flex", flexDirection: "column", gap: 6 }}>
            {ANTI_OPCIONES.map(([v, k, kx]) => {
              const on = valor === v;
              return (
                <button key={v} type="button" role="radio" aria-checked={on} data-anti-op={v}
                  onClick={() => onElegir && onElegir(v)}
                  style={{ display: "flex", alignItems: "center", gap: 10, width: "100%", boxSizing: "border-box", textAlign: "left",
                           background: on ? "rgba(45,155,90,0.22)" : "rgba(255,255,255,0.06)",
                           border: `1.5px solid ${on ? T.g2 : "rgba(255,255,255,0.14)"}`, borderRadius: 12,
                           padding: "9px 12px", cursor: "pointer", minHeight: 44 }}>
                  <span aria-hidden="true" style={{ flex: "0 0 auto", width: 16, height: 16, borderRadius: "50%", boxSizing: "border-box",
                                 border: `2px solid ${on ? T.g2 : T.t2}`, background: on ? T.g2 : "transparent" }} />
                  <span style={{ flex: 1, minWidth: 0 }}>
                    <span style={{ display: "block", fontSize: 13, fontWeight: 900, color: T.wh, fontFamily: "'Nunito',sans-serif" }}>{t(k)}</span>
                    <span style={{ display: "block", fontSize: 11, color: T.t2, fontFamily: "'DM Sans',sans-serif" }}>{t(kx)}</span>
                  </span>
                </button>
              );
            })}
          </div>
        </>
      )}
    </div>
  );
}
