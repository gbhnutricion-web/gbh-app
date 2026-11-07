// ═══ SEMÁFORO DE DENSIDAD CALÓRICA · Bo de policía ═══════════════════════════
// Pantalla que abre «Configura tu plan» (paciente estándar) para elegir la
// densidad calórica de las recetas de su programación. Bo, vestido de policía
// (accesorio `policia` de bo32.js, con el color del paciente), está junto a un
// semáforo en píxel art con tres luces que son botones. Al tocar una, Bo
// explica qué platos tendrá la programación; el botón de abajo la confirma y
// devuelve al organizador con la elección hecha.
//
// Luz → valor que lee el generador (gbh_automatizacion._densidad_de_texto, vía
// interpretar_notas sobre patient_config.notas):
//   🟢 verde    → «baja-media»: solo platos de densidad baja y media (más volumen)
//   🟡 amarillo → «todas»: sin línea en las notas; las tres densidades (por defecto)
//   🔴 rojo     → «media-alta»: solo platos de densidad media y alta (menos volumen)
// Mismos colores que el semáforo del PDF de la programación (baja verde, alta roja).
//
// La elección vive en UNA línea de notas, «Densidad calórica: media-alta», sin
// puntos (el generador corta segmentos en el primer punto). Las demás líneas se
// conservan, como hacen leerDescartes/escribirDescartes (PlanArcade.jsx).
//
// Pedido por Alejandro el 1-nov-2026 («tu avatar vestido de policía al lado de
// un semáforo interactivo con tres botones rojo amarillo y verde»).
import React, { useState, useEffect, useRef } from "react";
import { createPortal } from "react-dom";

const FUENTE = "'Press Start 2P', 'Courier New', monospace";
const FUENTE_URL = "https://fonts.googleapis.com/css2?family=Press+Start+2P&display=swap";

// ── La línea de notas ─────────────────────────────────────────────────────────
const RE_DENS = /^\s*densidad\s+cal[oó]rica\s*:\s*(media-alta|baja-media)\s*$/i;

/** 'media-alta' · 'baja-media' · 'todas' a partir de patient_config.notas. */
export function leerDensidad(notas) {
  for (const linea of String(notas || "").split(/\r?\n/)) {
    const m = linea.match(RE_DENS);
    if (m) return m[1].toLowerCase();
  }
  return "todas";
}

/** Recompone `notas`: las líneas ajenas + la línea de densidad (ninguna si es «todas»). */
export function escribirDensidad(notasPrevias, valor) {
  const resto = String(notasPrevias || "").split(/\r?\n/).filter(l => l.trim() && !RE_DENS.test(l));
  if (valor === "media-alta" || valor === "baja-media") resto.push("Densidad calórica: " + valor);
  return resto.join("\n");
}

// ── Las tres luces ────────────────────────────────────────────────────────────
export const LUCES = [
  { v: "media-alta", luz: "rojo", on: "#FF4B4B", off: "#4A1414", brillo: "#FFB3B3",
    nombre: { es: "MEDIA-ALTA", en: "MEDIUM-HIGH" },
    corto:  { es: "Más energía en menos volumen", en: "More energy in less volume" },
    grito:  { es: "¡ALTO AHÍ! 🚨", en: "STOP RIGHT THERE! 🚨" },
    texto:  { es: "Con la luz roja tu programación lleva solo platos de densidad media y alta: concentran la energía en menos volumen. Llegas a tus calorías sin acabar lleno. Es tu luz si te llenas enseguida, entrenas mucho o te cuesta terminarte el plan.",
              en: "With the red light your plan only has medium and high density dishes: they pack the energy into less volume. You reach your calories without feeling stuffed. It's your light if you fill up quickly, train a lot or struggle to finish your plan." } },
  { v: "todas", luz: "amarillo", on: "#FFD23F", off: "#4A3C0E", brillo: "#FFF1B0",
    nombre: { es: "EQUILIBRADA", en: "BALANCED" },
    corto:  { es: "Las tres densidades · máxima variedad", en: "All three densities · most variety" },
    grito:  { es: "¡PRECAUCIÓN… DE LA BUENA! ⚠️", en: "CAUTION… THE GOOD KIND! ⚠️" },
    texto:  { es: "Con la luz ámbar mezclas las tres densidades: unos días platos con mucho volumen y otros más concentrados. Es la que tiene más variedad de recetas y la recomendada si no pasas hambre ni te cuesta llegar a tus calorías.",
              en: "With the amber light you mix all three densities: some days high-volume dishes, other days more concentrated ones. It has the widest choice of recipes and it's the recommended one if you're not hungry and reach your calories easily." } },
  { v: "baja-media", luz: "verde", on: "#3DDC6B", off: "#123D20", brillo: "#B8F5C8",
    nombre: { es: "BAJA-MEDIA", en: "LOW-MEDIUM" },
    corto:  { es: "Mucho volumen, pocas calorías por bocado", en: "Lots of volume, few calories per bite" },
    grito:  { es: "¡LUZ VERDE A LLENAR EL PLATO! 🟢", en: "GREEN LIGHT TO FILL YOUR PLATE! 🟢" },
    texto:  { es: "Con la luz verde tu programación lleva solo platos de densidad baja y media: mucho volumen y pocas calorías por bocado, platos con más verdura y agua. Comes más cantidad y te sacias antes. Es tu luz si sueles quedarte con hambre.",
              en: "With the green light your plan only has low and medium density dishes: lots of volume and few calories per bite, dishes with more vegetables and water. You eat more food and feel full sooner. It's your light if you often end up hungry." } },
];

const TXT = {
  es: { titulo: "DENSIDAD CALÓRICA", sub: "Toca una luz del semáforo", volver: "Volver",
        hola: (n) => `¡Alto! Soy el agente ${n} 👮. Toca una luz del semáforo y te cuento qué platos tendrá tu programación.`,
        nota: "Tus calorías del día no cambian: solo el volumen del plato. Tus recetas favoritas siguen entrando y, si en una toma no hay platos de esa densidad, se completa con las demás.",
        confirmar: (x) => `CONFIRMAR ${x}`, tocaUna: "TOCA UNA LUZ", actual: "ACTUAL", saltar: "toca para leerlo entero" },
  en: { titulo: "CALORIE DENSITY", sub: "Tap a traffic light", volver: "Back",
        hola: (n) => `Stop! I'm officer ${n} 👮. Tap a light and I'll tell you what dishes your plan will have.`,
        nota: "Your daily calories don't change: only the volume on your plate. Your favourite recipes still come in and, if a meal has no dishes of that density, it's filled with the others.",
        confirmar: (x) => `CONFIRM ${x}`, tocaUna: "TAP A LIGHT", actual: "CURRENT", saltar: "tap to read it all" },
};

// ── Píxel art ─────────────────────────────────────────────────────────────────
// Una luz: círculo de píxeles (lado n) con un reflejo arriba a la izquierda.
function Lampara({ color, brillo, encendida, n = 11 }) {
  const c = (n - 1) / 2, r2 = (n / 2) * (n / 2) - 0.6;
  const rects = [];
  for (let y = 0; y < n; y++) for (let x = 0; x < n; x++) {
    const d = (x - c) ** 2 + (y - c) ** 2;
    if (d > r2) continue;
    const borde = d > ((n / 2) - 1.2) ** 2;
    const reflejo = encendida && x >= c - 3 && x <= c - 1 && y >= c - 3 && y <= c - 2;
    rects.push(<rect key={`${x}-${y}`} x={x} y={y} width={1} height={1}
      fill={borde ? "#0A0A0A" : reflejo ? brillo : color} />);
  }
  return (
    <svg viewBox={`0 0 ${n} ${n}`} width="100%" height="100%"
      style={{ imageRendering: "pixelated", shapeRendering: "crispEdges", display: "block" }}>
      {rects}
    </svg>
  );
}

// Semáforo mini (sin botones) para el botón-ficha del organizador.
function SemaforoMini({ valor }) {
  return (
    <div style={{ width: 22, padding: "4px 3px", background: "#1E1E1E", border: "2px solid #0A0A0A", borderRadius: 4,
                  display: "flex", flexDirection: "column", gap: 2, boxShadow: "inset 0 0 0 1px #3A3A3A" }}>
      {LUCES.map(l => (
        <div key={l.v} style={{ width: 12, height: 12, margin: "0 auto" }}>
          <Lampara color={l.v === valor ? l.on : l.off} brillo={l.brillo} encendida={l.v === valor} n={7} />
        </div>
      ))}
    </div>
  );
}

// ── La pantalla ───────────────────────────────────────────────────────────────
export function SemaforoDensidad({ lang = "es", T, Sheep, profile, valor, onElegir, onClose, sfx }) {
  const t = TXT[lang] || TXT.es;
  const L = lang === "en" ? "en" : "es";
  const [sel, setSel] = useState(null);           // luz tocada (null = Bo se presenta)
  const [letras, setLetras] = useState(0);        // efecto máquina de escribir del bocadillo
  const reloj = useRef(null);

  useEffect(() => {
    if (!document.querySelector('link[data-gbh-font="press-start"]')) {
      const l = document.createElement("link");
      l.rel = "stylesheet"; l.href = FUENTE_URL; l.setAttribute("data-gbh-font", "press-start");
      document.head.appendChild(l);
    }
  }, []);

  // Escape cierra; el scroll de la página de detrás se congela mientras está abierto.
  useEffect(() => {
    const onKey = e => { if (e.key === "Escape") onClose && onClose(); };
    window.addEventListener("keydown", onKey);
    const prev = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => { window.removeEventListener("keydown", onKey); document.body.style.overflow = prev; };
  }, [onClose]);

  const nombreBo = (profile?.bo_nombre || "Bo").toString().slice(0, 16);
  const luz = LUCES.find(l => l.v === sel);
  const texto = luz ? luz.texto[L] : t.hola(nombreBo);

  // Cada texto nuevo se escribe letra a letra (≈ 1,5 s); tocar el bocadillo lo completa.
  useEffect(() => {
    clearInterval(reloj.current);
    setLetras(0);
    reloj.current = setInterval(() => {
      setLetras(n => {
        if (n >= texto.length) { clearInterval(reloj.current); return n; }
        return n + 3;
      });
    }, 16);
    return () => clearInterval(reloj.current);
  }, [texto]);

  const tocar = (v) => { sfx && sfx("tap"); setSel(v); };
  const confirmar = () => { if (!luz) return; sfx && sfx("coin"); onElegir && onElegir(luz.v); };

  const colorBo = profile?.bo_color || "blanca";

  const cuerpo = (
    <div style={{ position: "fixed", inset: 0, zIndex: 9999, display: "flex", flexDirection: "column",
                  background: "#050A07",
                  backgroundImage: "repeating-linear-gradient(0deg, rgba(255,255,255,0.025) 0 1px, transparent 1px 3px)",
                  color: "#FFFFFF", fontFamily: "'DM Sans', sans-serif" }}>
      {/* Cabecera */}
      <div style={{ padding: "max(14px, env(safe-area-inset-top)) 14px 4px", textAlign: "center", position: "relative" }}>
        <button onClick={() => { sfx && sfx("tap"); onClose && onClose(); }}
          style={{ position: "absolute", left: 12, top: "max(12px, env(safe-area-inset-top))", background: "transparent",
                   border: "2px solid rgba(255,255,255,0.25)", color: "#FFFFFF", borderRadius: 10, padding: "8px 10px",
                   fontFamily: FUENTE, fontSize: 9, cursor: "pointer", letterSpacing: "0.04em" }}>
          ◀ {t.volver}
        </button>
        <div style={{ fontFamily: FUENTE, fontSize: "min(15px, 3.8vw)", color: "#FF4B4B", lineHeight: 1.5, marginTop: 34,
                      textShadow: "3px 3px 0 #5A0C0C", letterSpacing: "0.04em" }}>
          {t.titulo} 🚦
        </div>
        <div style={{ fontSize: 12, color: "rgba(255,255,255,0.6)", marginTop: 4 }}>{t.sub}</div>
      </div>

      <div style={{ flex: 1, minHeight: 0, overflowY: "auto", padding: "8px 14px 0", display: "flex", flexDirection: "column",
                    alignItems: "center" }}>
        {/* Escena: Bo de policía + semáforo sobre la acera */}
        <div style={{ position: "relative", width: "100%", maxWidth: 380, height: 236, flex: "0 0 auto", boxSizing: "border-box",
                      background: "radial-gradient(circle at 40% 35%, #1C2A22 0%, #0B1A11 72%)",
                      border: "4px solid #EDE6D3", outline: `3px solid ${luz ? luz.on : "#F5B800"}`, outlineOffset: -10,
                      boxShadow: `0 0 24px ${(luz ? luz.on : "#F5B800")}44`, overflow: "hidden", transition: "outline-color .2s, box-shadow .2s" }}>
          {/* Acera */}
          <div style={{ position: "absolute", left: 0, right: 0, bottom: 0, height: 30, background: "#3A3A3A",
                        borderTop: "4px solid #6B6B6B",
                        backgroundImage: "repeating-linear-gradient(90deg, transparent 0 46px, #2C2C2C 46px 50px)" }} />
          {/* Bo */}
          <div style={{ position: "absolute", left: "4%", bottom: 18, width: "58%", display: "flex", justifyContent: "center" }}>
            {Sheep
              ? <Sheep estado="normal" equipados={["policia"]} color={colorBo} size={176} />
              : <div style={{ width: 176, height: 176, background: "#FDF6E3", borderRadius: "40% 40% 45% 45%" }} />}
          </div>
          {/* Semáforo: tres luces que son botones */}
          <div style={{ position: "absolute", right: "9%", bottom: 22, display: "flex", flexDirection: "column", alignItems: "center" }}>
            <div style={{ background: "#1E1E1E", border: "4px solid #0A0A0A", borderRadius: 10, padding: "8px 8px",
                          display: "flex", flexDirection: "column", gap: 8, boxShadow: "inset 0 0 0 2px #3A3A3A, 4px 4px 0 #000" }}>
              {LUCES.map(l => {
                const encendida = sel === l.v;
                return (
                  <button key={l.v} onClick={() => tocar(l.v)} aria-label={l.nombre[L]} aria-pressed={encendida}
                    style={{ position: "relative", width: 46, height: 46, padding: 0, border: "none", cursor: "pointer",
                             background: "transparent", borderRadius: "50%",
                             filter: encendida ? `drop-shadow(0 0 10px ${l.on}) drop-shadow(0 0 4px ${l.on})` : "none",
                             transform: encendida ? "scale(1.06)" : "scale(1)", transition: "transform .15s, filter .15s" }}>
                    {/* Visera */}
                    <div style={{ position: "absolute", left: -4, right: -4, top: -5, height: 8, background: "#0A0A0A",
                                  borderRadius: "6px 6px 0 0" }} />
                    <Lampara color={encendida ? l.on : l.off} brillo={l.brillo} encendida={encendida} />
                    {valor === l.v && (
                      <div style={{ position: "absolute", left: -46, top: 16, fontFamily: FUENTE, fontSize: 6, color: l.on,
                                    background: "#000", padding: "3px 3px", borderRadius: 3, textShadow: "none" }}>
                        {t.actual}
                      </div>
                    )}
                  </button>
                );
              })}
            </div>
            {/* Poste */}
            <div style={{ width: 12, height: 26, background: "#2E2E2E", borderLeft: "3px solid #4A4A4A", borderRight: "3px solid #111" }} />
          </div>
        </div>

        {/* Bocadillo de Bo */}
        <div onClick={() => setLetras(texto.length)}
          style={{ position: "relative", width: "100%", maxWidth: 380, marginTop: 16, background: "#FFFDF5", color: "#14110C", boxSizing: "border-box",
                   border: "3px solid #000", boxShadow: "4px 4px 0 #000", borderRadius: 6, padding: "12px 14px 10px",
                   cursor: letras < texto.length ? "pointer" : "default", flex: "0 0 auto" }}>
          {/* Pico hacia Bo */}
          <div style={{ position: "absolute", left: 54, top: -13, width: 0, height: 0, borderLeft: "11px solid transparent",
                        borderRight: "11px solid transparent", borderBottom: "13px solid #000" }} />
          <div style={{ position: "absolute", left: 57, top: -8, width: 0, height: 0, borderLeft: "8px solid transparent",
                        borderRight: "8px solid transparent", borderBottom: "10px solid #FFFDF5" }} />
          <div style={{ fontFamily: FUENTE, fontSize: 8, color: luz ? "#14110C" : "#8A6A00", marginBottom: 8, lineHeight: 1.6,
                        display: "flex", justifyContent: "space-between", gap: 8 }}>
            <span>👮 {nombreBo.toUpperCase()}</span>
            {luz && <span style={{ color: luz.v === "todas" ? "#9A7A00" : luz.on }}>{luz.nombre[L]}</span>}
          </div>
          {luz && (
            <div style={{ fontFamily: FUENTE, fontSize: 9, lineHeight: 1.6, marginBottom: 6,
                          color: luz.v === "todas" ? "#9A7A00" : luz.v === "media-alta" ? "#C62828" : "#1E8E3E" }}>
              {luz.grito[L]}
            </div>
          )}
          <div style={{ fontSize: 13.5, lineHeight: 1.5, minHeight: 82 }}>
            {texto.slice(0, letras)}
            {letras < texto.length && <span style={{ opacity: 0.35 }}>▌</span>}
          </div>
          {luz && letras >= texto.length && (
            <div style={{ fontSize: 11.5, lineHeight: 1.45, color: "#5A5346", marginTop: 8, borderTop: "2px dashed #D9D2BF", paddingTop: 8 }}>
              {t.nota}
            </div>
          )}
        </div>
      </div>

      {/* Confirmar */}
      <div style={{ padding: "12px 16px max(14px, env(safe-area-inset-bottom))", display: "flex", justifyContent: "center" }}>
        <button onClick={confirmar} disabled={!luz}
          style={{ width: "100%", maxWidth: 380, fontFamily: FUENTE, fontSize: 10, color: "#0B1A11", letterSpacing: "0.02em",
                   background: luz ? (T?.au1 || "#C9A227") : "#3A3A3A", border: "none", borderRadius: 12, padding: "15px 14px",
                   cursor: luz ? "pointer" : "default", boxShadow: luz ? "0 4px 0 #6B5400" : "0 4px 0 #1E1E1E", lineHeight: 1.5 }}>
          {luz ? t.confirmar(luz.nombre[L]) : t.tocaUna}
        </button>
      </div>
    </div>
  );

  return typeof document !== "undefined" ? createPortal(cuerpo, document.body) : cuerpo;
}

// ── Botón-ficha que abre el semáforo desde «Configura tu plan» ───────────────
export function BotonDensidad({ lang = "es", T, valor, onAbrir }) {
  const L = lang === "en" ? "en" : "es";
  const l = LUCES.find(x => x.v === valor) || LUCES[1];
  return (
    <button onClick={onAbrir}
      style={{ width: "100%", display: "flex", alignItems: "center", gap: 12, textAlign: "left", cursor: "pointer",
               background: "#050A07", border: `2px solid ${l.on}`, borderRadius: 16, padding: "10px 12px",
               boxShadow: `0 0 14px ${l.on}33` }}>
      <div style={{ width: 54, height: 54, flex: "0 0 54px", display: "flex", alignItems: "center", justifyContent: "center",
                    background: "#0B1A11", border: "2px solid #EDE6D3", borderRadius: 6 }}>
        <SemaforoMini valor={l.v} />
      </div>
      <div style={{ flex: 1, minWidth: 0 }}>
        <div style={{ fontFamily: FUENTE, fontSize: 9, color: "#F5B800", textShadow: "1px 1px 0 #000", lineHeight: 1.6 }}>
          {L === "en" ? "Calorie density 🚦" : "Densidad calórica 🚦"}
        </div>
        <div style={{ fontFamily: "'DM Sans', sans-serif", marginTop: 2, lineHeight: 1.3 }}>
          <div style={{ fontSize: 12, color: l.on, fontWeight: 700 }}>{l.nombre[L]}</div>
          <div style={{ fontSize: 10.5, color: "rgba(255,255,255,0.6)" }}>{l.corto[L]}</div>
        </div>
      </div>
      <div style={{ fontFamily: FUENTE, fontSize: 8, color: "#0B1A11", background: T?.au1 || "#C9A227", borderRadius: 8,
                    padding: "8px 8px", whiteSpace: "nowrap", boxShadow: "0 3px 0 #6B5400" }}>
        {L === "en" ? "CHANGE ▶" : "CAMBIAR ▶"}
      </div>
    </button>
  );
}
