// ═══ PLAN ARCADE · piezas de «Editar tu plan» con la estética del selector ═══
// Dos componentes para la pantalla de configuración del paciente estándar,
// con la misma estética que SelectorPrograma.jsx (negro, verdes, tipografía de
// píxel «Press Start 2P»), pedidos por Alejandro el 6-sep-2026:
//
//   · DistribucionKcal — la tabla de porcentajes por toma (antes en App.jsx con
//     el estilo genérico). La lógica (estado, ajustarToma, total) sigue en
//     PlanConfig; aquí solo se pinta.
//   · AlimentosDescartados — «Alimentos que no quieres»: lista de alimentos que
//     el paciente no quiere o a los que es alérgico, con «+ AÑADIR» que abre una
//     ventana aparte (nombre + sugerencias + no me gusta/alergia).
//
// CÓMO LLEGA AL GENERADOR (sin columna nueva ni SQL): la lista se guarda en
// `patient_config.notas` como dos líneas que el generador YA interpreta
// (gbh_automatizacion.interpretar_notas, el mismo lector que las notas del
// Excel premium):
//     Alimentos rechazados: kiwi, salmón, frutos secos
//     Alergias: marisco
// Las dos alimentan el filtro DURO de rechazados; «Alergias» solo se distingue
// para que el nutricionista lo vea. Las categorías se expanden allí (pescado →
// todos los pescados, lácteos → queso/yogur/nata…). Cualquier otra línea que
// hubiera en `notas` se conserva tal cual (leerDescartes / escribirDescartes).
import React, { useState, useEffect, useRef } from "react";
import { createPortal } from "react-dom";

const FUENTE = "'Press Start 2P', 'Courier New', monospace";
const NEGRO = "#050A07";
const VERDE = "#7ED957";
const VERDE_OSC = "#2D9B5A";
const ORO = "#F5B800";

// ── Persistencia en `notas` ───────────────────────────────────────────────────
const RE_RECH = /^\s*alimentos rechazados\s*:\s*(.*)$/i;
const RE_ALER = /^\s*alergias?\s*:\s*(.*)$/i;

const _partir = (s) => s.split(/\s*,\s*/).map(x => x.replace(/\.\s*$/, "").trim()).filter(Boolean);

/** {lista:[{nombre,tipo:'gusto'|'alergia'}], resto:'las demás líneas'} */
export function leerDescartes(notas) {
  const lista = [], resto = [];
  String(notas || "").split(/\r?\n/).forEach(linea => {
    let m;
    if ((m = linea.match(RE_RECH))) _partir(m[1]).forEach(n => lista.push({ nombre: n, tipo: "gusto" }));
    else if ((m = linea.match(RE_ALER))) _partir(m[1]).forEach(n => lista.push({ nombre: n, tipo: "alergia" }));
    else if (linea.trim()) resto.push(linea);
  });
  return { lista, resto: resto.join("\n") };
}

/** Recompone `notas`: las líneas ajenas + las dos líneas gestionadas (sin puntos: el
 *  generador corta el segmento en el primer punto). */
export function escribirDescartes(notasPrevias, lista) {
  const { resto } = leerDescartes(notasPrevias);
  const limpio = (n) => String(n || "").replace(/[.\n]/g, " ").replace(/\s+/g, " ").trim();
  const gusto = lista.filter(x => x.tipo !== "alergia").map(x => limpio(x.nombre)).filter(Boolean);
  const alerg = lista.filter(x => x.tipo === "alergia").map(x => limpio(x.nombre)).filter(Boolean);
  const lineas = [];
  if (resto) lineas.push(resto);
  if (gusto.length) lineas.push("Alimentos rechazados: " + gusto.join(", "));
  if (alerg.length) lineas.push("Alergias: " + alerg.join(", "));
  return lineas.join("\n");
}

// Sugerencias: las categorías que el generador sabe expandir van primero.
const SUGERENCIAS = {
  es: ["pescado", "marisco", "huevo", "lácteos", "lactosa", "gluten", "frutos secos", "cacahuete", "soja", "legumbres",
       "cerdo", "ternera", "pollo", "pavo", "atún", "salmón", "setas", "champiñones", "berenjena", "calabacín", "coliflor",
       "brócoli", "espinacas", "col", "cebolla", "ajo", "pimiento", "tomate", "aguacate", "plátano", "kiwi", "piña",
       "queso", "yogur", "leche", "pan", "arroz", "pasta", "patata", "picante", "cilantro", "apio", "pepino", "sésamo", "mostaza"],
  en: ["fish", "shellfish", "egg", "dairy", "lactose", "gluten", "nuts", "peanut", "soy", "legumes",
       "pork", "beef", "chicken", "turkey", "tuna", "salmon", "mushrooms", "aubergine", "courgette", "cauliflower",
       "broccoli", "spinach", "cabbage", "onion", "garlic", "pepper", "tomato", "avocado", "banana", "kiwi", "pineapple",
       "cheese", "yogurt", "milk", "bread", "rice", "pasta", "potato", "spicy", "coriander", "celery", "cucumber", "sesame", "mustard"],
};

const TXT = {
  es: { tit: "Alimentos que no quieres", sub: "Lo que añadas aquí no aparecerá en tu programación: ni el alimento ni las recetas que lo llevan.",
        vacio: "Todavía no has descartado ningún alimento.", anadir: "+ AÑADIR", quitar: "quitar",
        modalTit: "DESCARTAR ALIMENTO", nombre: "Alimento", ph: "Ej.: kiwi, marisco, frutos secos…", gusto: "NO ME GUSTA", alergia: "ALERGIA",
        sugerencias: "Toca una sugerencia o escribe el tuyo", ok: "AÑADIR", volver: "Volver", repetido: "Ya está en la lista",
        etiqAlergia: "alergia", etiqGusto: "no me gusta",
        distReset: "Restablecer recomendado (20/10/30/10/30)", skip: "No haces esta toma" },
  en: { tit: "Foods you don't want", sub: "Anything you add here is kept out of your plan: the food and every recipe that uses it.",
        vacio: "You haven't excluded any food yet.", anadir: "+ ADD", quitar: "remove",
        modalTit: "EXCLUDE A FOOD", nombre: "Food", ph: "E.g.: kiwi, shellfish, nuts…", gusto: "DISLIKE", alergia: "ALLERGY",
        sugerencias: "Tap a suggestion or type your own", ok: "ADD", volver: "Back", repetido: "Already on the list",
        etiqAlergia: "allergy", etiqGusto: "dislike",
        distReset: "Reset to recommended (20/10/30/10/30)", skip: "Skipped" },
};

const panel = {
  background: NEGRO, border: `2px solid ${VERDE_OSC}`, borderRadius: 16, boxShadow: `0 0 14px ${VERDE_OSC}33`, overflow: "hidden",
};

// ── Tabla de porcentajes por toma ───────────────────────────────────────────
export function DistribucionKcal({ lang = "es", T, TOMAS, dist, ajustarToma, kcalBase, onReset }) {
  const t = TXT[lang] || TXT.es;
  const Btn = ({ delta, dis, k, children }) => (
    <button onClick={() => { if (!dis) ajustarToma(k, delta); }} disabled={dis}
      style={{ width: 42, height: 42, borderRadius: 10, cursor: dis ? "default" : "pointer", flexShrink: 0,
               background: dis ? "rgba(255,255,255,0.03)" : "#0B1A11",
               border: `2px solid ${dis ? "rgba(255,255,255,0.08)" : VERDE_OSC}`,
               color: dis ? "rgba(255,255,255,0.2)" : VERDE, fontFamily: FUENTE, fontSize: 14,
               boxShadow: dis ? "none" : `0 3px 0 #123D22` }}>
      {children}
    </button>
  );
  return (
    <div>
      <div style={panel}>
        {TOMAS.map((toma, i) => {
          const v = dist[toma.k] || 0;
          const kcal = (kcalBase > 0) ? `${Math.round(kcalBase * v / 100)} kcal` : "";
          return (
            <div key={toma.k} style={{ display: "flex", alignItems: "center", gap: 10, padding: "10px 12px",
                                        borderTop: i > 0 ? `1px solid ${VERDE_OSC}55` : "none",
                                        background: v === 0 ? "rgba(255,255,255,0.02)" : "transparent" }}>
              <div style={{ flex: 1, minWidth: 0 }}>
                <div style={{ fontSize: 13.5, color: v === 0 ? "rgba(255,255,255,0.3)" : "#FFFFFF", fontWeight: 800,
                              fontFamily: "'Nunito',sans-serif" }}>
                  {toma.ic} {toma.label}
                </div>
                <div style={{ fontFamily: FUENTE, fontSize: 7.5, color: v === 0 ? "rgba(255,255,255,0.3)" : `${VERDE}AA`, marginTop: 4, letterSpacing: "0.02em" }}>
                  {v === 0 ? t.skip : kcal}
                </div>
              </div>
              <Btn delta={-5} dis={v <= 0} k={toma.k}>−</Btn>
              <div style={{ width: 58, textAlign: "center", fontFamily: FUENTE, fontSize: 13,
                            color: v === 0 ? "rgba(255,255,255,0.3)" : VERDE, textShadow: v === 0 ? "none" : "2px 2px 0 #000" }}>
                {v}%
              </div>
              <Btn delta={5} dis={v >= 60} k={toma.k}>+</Btn>
            </div>
          );
        })}
      </div>
      <button onClick={onReset}
        style={{ marginTop: 12, background: "none", border: "none", color: `${VERDE}99`, fontSize: 12, fontWeight: 700,
                 cursor: "pointer", textDecoration: "underline", fontFamily: "'DM Sans',sans-serif" }}>
        {t.distReset}
      </button>
    </div>
  );
}

// ── Alimentos que no quieres ────────────────────────────────────────────────
export function AlimentosDescartados({ lang = "es", T, lista, onChange, sfx }) {
  const t = TXT[lang] || TXT.es;
  const [abierto, setAbierto] = useState(false);

  const quitar = (i) => { sfx && sfx("tap"); onChange(lista.filter((_, j) => j !== i)); };
  const anadir = (item) => {
    const n = item.nombre.trim();
    if (!n) return false;
    if (lista.some(x => x.nombre.toLowerCase() === n.toLowerCase())) return false;
    sfx && sfx("coin");
    onChange([...lista, { nombre: n, tipo: item.tipo }]);
    return true;
  };

  return (
    <div>
      <div style={{ ...panel, padding: "12px 12px 10px" }}>
        {lista.length === 0 ? (
          <div style={{ fontSize: 12, color: "rgba(255,255,255,0.45)", fontFamily: "'DM Sans',sans-serif", padding: "4px 2px 8px" }}>
            {t.vacio}
          </div>
        ) : (
          <div style={{ display: "flex", flexWrap: "wrap", gap: 8, marginBottom: 10 }}>
            {lista.map((x, i) => {
              const al = x.tipo === "alergia";
              return (
                <div key={x.nombre + i}
                  style={{ display: "flex", alignItems: "center", gap: 8, background: "#0B1A11",
                           border: `2px solid ${al ? "#FF4B4B" : VERDE_OSC}`, borderRadius: 10, padding: "7px 8px 7px 10px" }}>
                  <span style={{ fontFamily: FUENTE, fontSize: 8, color: al ? "#FF8A80" : VERDE, lineHeight: 1.6, textTransform: "uppercase" }}>
                    {al ? "⚠ " : "🚫 "}{x.nombre}
                  </span>
                  <button onClick={() => quitar(i)} aria-label={t.quitar}
                    style={{ background: "transparent", border: "none", color: "#FF8A80", fontFamily: FUENTE, fontSize: 9,
                             cursor: "pointer", padding: "2px 2px" }}>✕</button>
                </div>
              );
            })}
          </div>
        )}
        <button onClick={() => { sfx && sfx("tap"); setAbierto(true); }}
          style={{ width: "100%", fontFamily: FUENTE, fontSize: 9, color: "#0B1A11", background: T?.au1 || "#C9A227",
                   border: "none", borderRadius: 10, padding: "12px 12px", cursor: "pointer", boxShadow: "0 3px 0 #6B5400" }}>
          {t.anadir}
        </button>
      </div>
      {abierto && <VentanaAnadir lang={lang} T={T} onAnadir={anadir} onClose={() => setAbierto(false)} sfx={sfx} />}
    </div>
  );
}

// ── La ventana aparte para añadir uno ───────────────────────────────────────
function VentanaAnadir({ lang, T, onAnadir, onClose, sfx }) {
  const t = TXT[lang] || TXT.es;
  const L = lang === "en" ? "en" : "es";
  const [nombre, setNombre] = useState("");
  const [tipo, setTipo] = useState("gusto");
  const [aviso, setAviso] = useState("");
  const inp = useRef(null);

  useEffect(() => {
    const onKey = e => { if (e.key === "Escape") onClose(); };
    window.addEventListener("keydown", onKey);
    const prev = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    setTimeout(() => inp.current && inp.current.focus(), 50);
    return () => { window.removeEventListener("keydown", onKey); document.body.style.overflow = prev; };
  }, [onClose]);

  const confirmar = () => {
    if (!nombre.trim()) { inp.current && inp.current.focus(); return; }
    const ok = onAnadir({ nombre, tipo });
    if (!ok) { setAviso(t.repetido); sfx && sfx("error"); return; }
    setNombre(""); setAviso("");
    // se queda abierta para poder añadir varios seguidos; «Volver» cierra
    inp.current && inp.current.focus();
  };

  const filtro = nombre.trim().toLowerCase();
  const sugeridas = SUGERENCIAS[L].filter(s => !filtro || s.includes(filtro)).slice(0, 14);

  const cuerpo = (
    <div onClick={onClose}
      style={{ position: "fixed", inset: 0, zIndex: 9999, background: "rgba(0,0,0,0.78)", display: "flex",
               alignItems: "flex-end", justifyContent: "center",
               backgroundImage: "repeating-linear-gradient(0deg, rgba(255,255,255,0.02) 0 1px, transparent 1px 3px)" }}>
      <div onClick={e => e.stopPropagation()}
        style={{ width: "100%", maxWidth: 480, background: NEGRO, border: `3px solid #EDE6D3`, outline: `3px solid ${VERDE_OSC}`,
                 outlineOffset: -8, borderRadius: "18px 18px 0 0", padding: "18px 16px max(16px, env(safe-area-inset-bottom))",
                 fontFamily: "'DM Sans',sans-serif", color: "#FFFFFF" }}>
        <div style={{ fontFamily: FUENTE, fontSize: 12, color: "#FF4B4B", textShadow: "2px 2px 0 #5A0C0C", textAlign: "center", lineHeight: 1.5 }}>
          {t.modalTit}
        </div>

        <div style={{ fontFamily: FUENTE, fontSize: 8, color: VERDE, marginTop: 16, marginBottom: 6 }}>{t.nombre}</div>
        <input ref={inp} value={nombre} maxLength={40} placeholder={t.ph}
          onChange={e => { setNombre(e.target.value); setAviso(""); }}
          onKeyDown={e => { if (e.key === "Enter") confirmar(); }}
          style={{ width: "100%", boxSizing: "border-box", background: "#0B1A11", border: `2px solid ${VERDE_OSC}`, borderRadius: 10,
                   padding: "12px 12px", color: "#FFFFFF", fontSize: 15, fontWeight: 700, fontFamily: "'Nunito',sans-serif", outline: "none" }} />
        {aviso && <div style={{ fontSize: 11.5, color: "#FFB74D", fontWeight: 700, marginTop: 6 }}>⚠️ {aviso}</div>}

        <div style={{ display: "flex", gap: 8, marginTop: 12 }}>
          {[["gusto", t.gusto, VERDE], ["alergia", t.alergia, "#FF8A80"]].map(([k, etiq, col]) => {
            const sel = tipo === k;
            return (
              <button key={k} onClick={() => { setTipo(k); sfx && sfx("step"); }}
                style={{ flex: 1, fontFamily: FUENTE, fontSize: 8, padding: "10px 6px", borderRadius: 10, cursor: "pointer",
                         background: sel ? "#0B1A11" : "transparent", color: sel ? col : "rgba(255,255,255,0.35)",
                         border: `2px solid ${sel ? col : "rgba(255,255,255,0.15)"}` }}>
                {k === "gusto" ? "🚫 " : "⚠ "}{etiq}
              </button>
            );
          })}
        </div>

        <div style={{ fontSize: 11, color: "rgba(255,255,255,0.45)", marginTop: 14, marginBottom: 6 }}>{t.sugerencias}</div>
        <div style={{ display: "flex", flexWrap: "wrap", gap: 6, maxHeight: 108, overflowY: "auto" }}>
          {sugeridas.map(s => (
            <button key={s} onClick={() => { setNombre(s); setAviso(""); sfx && sfx("step"); }}
              style={{ background: "#0B1A11", border: `1.5px solid ${VERDE_OSC}88`, color: "#FFFFFF", borderRadius: 8,
                       padding: "6px 9px", fontSize: 12, fontWeight: 700, cursor: "pointer", fontFamily: "'Nunito',sans-serif" }}>
              {s}
            </button>
          ))}
        </div>

        <div style={{ display: "flex", gap: 10, marginTop: 16 }}>
          <button onClick={() => { sfx && sfx("tap"); onClose(); }}
            style={{ flex: 1, fontFamily: FUENTE, fontSize: 9, color: "#FFFFFF", background: "transparent",
                     border: "2px solid rgba(255,255,255,0.25)", borderRadius: 10, padding: "12px 8px", cursor: "pointer" }}>
            ◀ {t.volver}
          </button>
          <button onClick={confirmar}
            style={{ flex: 2, fontFamily: FUENTE, fontSize: 9, color: "#0B1A11", background: T?.au1 || "#C9A227", border: "none",
                     borderRadius: 10, padding: "12px 8px", cursor: "pointer", boxShadow: "0 3px 0 #6B5400" }}>
            {t.ok}
          </button>
        </div>
      </div>
    </div>
  );
  return typeof document !== "undefined" ? createPortal(cuerpo, document.body) : cuerpo;
}

// ── Aviso de semana nueva, arriba del todo de la pestaña Plan ────────────────
// Solo para el estándar y solo cuando el candado semanal está abierto: que el
// paciente vea al entrar que ya puede hacerse la semana nueva, sin bajar hasta
// el final (Alejandro, 6-sep-2026). `onGenerar` abre «Editar tu plan», cuyo
// botón «Guardar y generar plan» lanza la programación.
export function BannerSemanaNueva({ lang = "es", T, tienePlan, onGenerar, sfx }) {
  const L = lang === "en" ? "en" : "es";
  const tit = tienePlan
    ? (L === "en" ? "NEW WEEK UNLOCKED!" : "¡NUEVA SEMANA DESBLOQUEADA!")
    : (L === "en" ? "YOUR PLAN IS WAITING" : "TU PROGRAMACIÓN TE ESPERA");
  const sub = tienePlan
    ? (L === "en" ? "Choose your programme and generate this week's plan." : "Elige tu programación y genera el plan de esta semana.")
    : (L === "en" ? "Set your preferences and generate your first plan." : "Define tus preferencias y genera tu primer plan.");
  return (
    <div style={{ margin: "8px 16px 4px", background: NEGRO, border: `2px solid ${ORO}`, borderRadius: 16,
                  boxShadow: `0 0 16px ${ORO}44`, padding: "12px 12px 12px 14px", display: "flex", alignItems: "center", gap: 12,
                  backgroundImage: "repeating-linear-gradient(0deg, rgba(255,255,255,0.025) 0 1px, transparent 1px 3px)" }}>
      <div style={{ fontSize: 26, flexShrink: 0, lineHeight: 1 }}>✨</div>
      <div style={{ flex: 1, minWidth: 0 }}>
        <div style={{ fontFamily: FUENTE, fontSize: 9, color: ORO, textShadow: "2px 2px 0 #000", lineHeight: 1.6 }}>{tit}</div>
        <div style={{ fontSize: 11.5, color: "rgba(255,255,255,0.65)", fontFamily: "'DM Sans',sans-serif", marginTop: 3, lineHeight: 1.35 }}>{sub}</div>
      </div>
      <button onClick={() => { sfx && sfx("coin"); onGenerar && onGenerar(); }}
        style={{ fontFamily: FUENTE, fontSize: 8, color: "#0B1A11", background: T?.au1 || "#C9A227", border: "none", borderRadius: 10,
                 padding: "11px 10px", cursor: "pointer", whiteSpace: "nowrap", boxShadow: "0 3px 0 #6B5400", flexShrink: 0 }}>
        {L === "en" ? "GENERATE ▶" : "GENERAR ▶"}
      </button>
    </div>
  );
}
