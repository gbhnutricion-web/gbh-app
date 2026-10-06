// ═══ BARRA DE PESTAÑAS de abajo (26-sep-2026) ═══
// Orden de Alejandro (26-sep): «cambia lo que consideres para que los botones/nombres de la barra deslizable
// queden mejor». Con la 8.ª pestaña (💊) la barra no cabe en ningún móvil y se desliza. Qué cambia frente a
// la barra que vivía dentro de App.jsx:
// - Las 8 pestañas miden lo mismo (60 px). Antes, «SUPLEMENTACIÓN» en mayúsculas espaciadas medía 93,5 px y
//   su botón era casi el doble que los demás.
// - Etiquetas en minúscula a 10 px en vez de MAYÚSCULAS a 9 px con espaciado: se leen mejor y ocupan menos.
//   Medido con Nunito, «Suplementos» mide 62-64 px; todas las demás, 46 px o menos. La pestaña 💊 se llama
//   «Suplementos» en la barra; el título de su pantalla sigue siendo «Suplementación».
// - Un difuminado en el borde por el que quedan pestañas avisa de que la barra sigue. Solo sale en ese lado.
// - La pestaña activa siempre se ve entera: si queda tapada por un borde, la barra se desliza lo justo. Vale
//   también cuando la cambia la app sola, por ejemplo el tutorial.
// Los ids, el orden y los iconos son los de siempre; «supl» va detrás de Plan, que es donde viven los
// recordatorios de suplementos.
import React, { useEffect, useRef, useState } from "react";

export const ANCHO_PESTANA = 60;   // px, todas iguales
const FUNDIDO = 28;                // px del difuminado; también el margen con el que se deja a la vista la activa

// l: clave de TRANS; o bien txt fijo por idioma, como estaban «Plan» y «Consulta».
// 6-oct-2026 (PEND-2026-353 / MAESTRO-2026-857): de 8 pestañas deslizables a 5 FIJAS, sin deslizar en ningún móvil
// (la regla de Apple y la de las apps más usadas). Objetivo, Medidas y Ranking son vistas de «progreso»; Consulta y los
// ajustes viven en «tu»; Suplementación es una tarjeta de Plan. El deslizamiento y el difuminado quedan por si algún
// día vuelve a haber más pestañas de las que caben, pero con 5 no se activan.
export const PESTANAS = [
  { id: "home",     icon: "🏠", l: "tabHome" },
  { id: "plan",     icon: "📆", txt: { es: "Plan", en: "Plan" } },
  { id: "receta",   icon: "🍰", l: "tabRecipe" },
  { id: "progreso", icon: "📈", l: "tabProgreso" },
  { id: "tu",       icon: "👤", l: "tabTu" },
];

const suave = () => { try { return !window.matchMedia("(prefers-reduced-motion: reduce)").matches; } catch { return true; } };

export function BarraPestanas({ tab, setTab, t, lang = "es", T, sfx }) {
  const ref = useRef(null);
  const [bordes, setBordes] = useState({ izq: false, der: false });   // ¿quedan pestañas a ese lado?
  const medir = () => {
    const el = ref.current; if (!el) return;
    const izq = el.scrollLeft > 1, der = el.scrollLeft < el.scrollWidth - el.clientWidth - 1;
    setBordes((b) => (b.izq === izq && b.der === der ? b : { izq, der }));
  };
  useEffect(() => {
    medir();
    window.addEventListener("resize", medir);
    return () => window.removeEventListener("resize", medir);
  }, []);
  // La activa, entera y fuera del difuminado; si ya lo está, la barra no se mueve.
  useEffect(() => {
    const el = ref.current, b = el && el.querySelector(`[data-pestana="${tab}"]`);
    if (!b) return;
    const max = el.scrollWidth - el.clientWidth;
    let destino = el.scrollLeft;
    if (b.offsetLeft - FUNDIDO < el.scrollLeft) destino = b.offsetLeft - FUNDIDO;
    else if (b.offsetLeft + b.offsetWidth + FUNDIDO > el.scrollLeft + el.clientWidth) destino = b.offsetLeft + b.offsetWidth + FUNDIDO - el.clientWidth;
    destino = Math.max(0, Math.min(max, destino));
    if (Math.abs(destino - el.scrollLeft) > 1) el.scrollTo({ left: destino, behavior: suave() ? "smooth" : "auto" });
    medir();
  }, [tab]);

  // Difuminado + flecha dorada, la misma «›» de «abrir» de las tarjetas. A 375 px la pestaña siguiente solo
  // asoma 9 px, y el difuminado solo no se veía. La flecha no captura el toque: cae en la pestaña de debajo,
  // que se desliza a la vista. Va a la altura de los iconos (10 + 8 + 12 px desde arriba, menos media flecha).
  const fundido = (lado, visible) => (
    <div aria-hidden="true" style={{ position: "absolute", top: 0, bottom: 0, [lado]: 0, width: FUNDIDO, pointerEvents: "none",
      opacity: visible ? 1 : 0, transition: "opacity 0.2s", display: "flex", alignItems: "flex-start",
      justifyContent: lado === "left" ? "flex-start" : "flex-end", padding: "21px 3px 0", boxSizing: "border-box",
      background: `linear-gradient(to ${lado === "left" ? "right" : "left"}, rgba(8,18,8,0.97) 35%, rgba(8,18,8,0))` }}>
      <span style={{ color: T.au1, fontSize: 18, fontWeight: 900, lineHeight: 1, fontFamily: "'Nunito',sans-serif" }}>{lado === "left" ? "‹" : "›"}</span>
    </div>
  );
  return (
    <div style={{ position: "fixed", bottom: 0, left: "50%", transform: "translateX(-50%)", width: "100%", maxWidth: 420,
      background: "rgba(8,18,8,0.97)", backdropFilter: "blur(30px)", borderTop: `3px solid ${T.bW}`, zIndex: 100 }}>
      <div ref={ref} className="nav-scroll" onScroll={medir}
        style={{ position: "relative", overflowX: "auto", WebkitOverflowScrolling: "touch" }}>
        <div style={{ display: "flex", padding: "10px 4px 10px", minWidth: "min-content", width: "100%", boxSizing: "border-box" }}>
          {PESTANAS.map(({ id, icon, l, txt }) => {
            const a = tab === id;
            return (
              <button key={id} data-pestana={id} aria-current={a ? "page" : undefined}
                onClick={() => { sfx && sfx("tap"); setTab(id); }}
                style={{ flex: `1 1 ${ANCHO_PESTANA}px`, minWidth: ANCHO_PESTANA, padding: "8px 0", background: "none", border: "none",
                  color: a ? T.au1 : T.t2, fontWeight: a ? 900 : 700, cursor: "pointer", display: "flex", flexDirection: "column",
                  alignItems: "center", gap: 3, transition: "all 0.18s", fontFamily: "'Nunito',sans-serif" }}>
                <span style={{ fontSize: 24, filter: a ? "none" : "grayscale(0.6)", transition: "all 0.2s" }}>{icon}</span>
                <span style={{ fontSize: 10, lineHeight: 1.2, whiteSpace: "nowrap" }}>{txt ? txt[lang] || txt.es : t(l)}</span>
                {a && <div style={{ width: 22, height: 4, background: T.au1, borderRadius: 4, boxShadow: `0 0 10px ${T.au1}`, marginTop: 1 }}/>}
              </button>
            );
          })}
        </div>
      </div>
      {fundido("left", bordes.izq)}
      {fundido("right", bordes.der)}
    </div>
  );
}
