// ═══ SELECTOR DE PROGRAMACIÓN · estilo «SELECT PLAYER» arcade ════════════════
// Pantalla que abre «Configura tu plan» (paciente estándar) para elegir el tipo
// de programación. Una ficha por programación, deslizables de izquierda a
// derecha (scroll-snap), con la oveja del paciente (su color y sus accesorios,
// pintada por el mismo `Sheep` de siempre) acompañada de un objeto en píxel art
// que representa la dieta: plato (normal), huevo (vegetariano), brócoli (vegano),
// bol de arroz (sin gluten), aguacate (cetogénica) y barra de pesas (descarga).
// Debajo de cada ficha, qué es esa programación y para quién, y el botón
// «¡Elijo esta!», que devuelve al organizador con la elección hecha (donde se
// puede volver a abrir y cambiar).
//
// Los valores `v` son EXACTAMENTE los que lee el generador
// (gbh_automatizacion._norm_dieta): 'Celíaco' = Simple + restricción sin gluten,
// 'Cetogénica' = pool cetogénico, 'Descarga' = pool de descarga precompetición.
//
// Todo lo que necesita de App.jsx llega por props (T, Sheep, sfx, profile):
// App.jsx cambia en unas pocas líneas y este fichero se lee entero de una vez.
// Pedido por Alejandro el 6-sep-2026 («como si fuese una ficha de selector de
// personajes arcade»).
import React, { useState, useEffect, useRef, useCallback } from "react";
import { createPortal } from "react-dom";

const FUENTE = "'Press Start 2P', 'Courier New', monospace";
const FUENTE_URL = "https://fonts.googleapis.com/css2?family=Press+Start+2P&display=swap";

// ── Fichas ────────────────────────────────────────────────────────────────────
export const FICHAS = [
  { v: "Simple", prop: "plato", acento: "#F5B800",
    nombre: { es: "NORMAL", en: "NORMAL" },
    estilo: { es: "De todo", en: "Everything" },
    para:   { es: "Sin restricciones", en: "No restrictions" },
    desc:   { es: "Carne, pescado, huevo, lácteos y vegetales: el recetario completo. Hidratos normales repartidos en tus cinco tomas.",
              en: "Meat, fish, eggs, dairy and vegetables: the full recipe book. Regular carbs spread across your five meals." } },
  { v: "Vegetariana", prop: "huevo", acento: "#FFD84D",
    nombre: { es: "VEGETARIANO", en: "VEGETARIAN" },
    estilo: { es: "Sin carne ni pescado", en: "No meat or fish" },
    para:   { es: "Ovolactovegetarianos", en: "Ovo-lacto vegetarians" },
    desc:   { es: "Huevo, lácteos, legumbres, cereales y vegetales. La misma variedad de tomas, sin carne.",
              en: "Eggs, dairy, legumes, grains and vegetables. Same variety of meals, without meat." } },
  { v: "Vegana", prop: "verdura", acento: "#7ED957",
    nombre: { es: "VEGANO", en: "VEGAN" },
    estilo: { es: "100 % vegetal", en: "100 % plant-based" },
    para:   { es: "Sin productos animales", en: "No animal products" },
    desc:   { es: "Sin carne, pescado, huevo ni lácteos. Legumbres, cereales, frutos secos y vegetales.",
              en: "No meat, fish, eggs or dairy. Legumes, grains, nuts and vegetables." } },
  { v: "Celíaco", prop: "arroz", acento: "#7EC8E3",
    nombre: { es: "SIN GLUTEN", en: "GLUTEN-FREE" },
    estilo: { es: "Apta para celíacos", en: "Coeliac-safe" },
    para:   { es: "Celíacos y sensibles al gluten", en: "Coeliacs and gluten-sensitive" },
    desc:   { es: "Las recetas de la programación normal sin trigo, cebada, centeno ni avena: sin pan, pasta, rebozados ni salsa de soja. 507 recetas.",
              en: "The normal programme without wheat, barley, rye or oats: no bread, pasta, batter or soy sauce. 507 recipes." } },
  { v: "Cetogénica", prop: "aguacate", acento: "#B57EDC",
    nombre: { es: "CETOGÉNICA", en: "KETO" },
    estilo: { es: "Proteína y grasa", en: "Protein and fat" },
    para:   { es: "Casi cero hidratos", en: "Near-zero carbs" },
    desc:   { es: "Sin pan, arroz, pasta, patata, legumbre ni fruta dulce. Huevo, carne, pescado, queso, aguacate, frutos secos y verdura. 107 recetas, plato único en comida y cena.",
              en: "No bread, rice, pasta, potato, legumes or sweet fruit. Eggs, meat, fish, cheese, avocado, nuts and vegetables. 107 recipes, single dish at lunch and dinner." } },
  { v: "Descarga", prop: "pesas", acento: "#FF7A59",
    nombre: { es: "DESCARGA", en: "WEIGH-IN" },
    estilo: { es: "Precompetición", en: "Pre-competition" },
    para:   { es: "Deportes de categoría de peso", en: "Weight-class sports" },
    desc:   { es: "Las dos semanas antes de competir: sin fibra apreciable, sin sodio añadido e hidratos contenidos. Plato único. La hidratación la pauta tu nutricionista.",
              en: "The two weeks before competing: no noticeable fibre, no added sodium, contained carbs. Single dish. Hydration is set by your nutritionist." } },
];

// ── Objetos en píxel art (cada carácter = 1 px; «.» = transparente) ──────────
const PROPS = {
  plato: { pal: { P: "#C9C9C9", p: "#9C9C9C", W: "#FFFFFF", w: "#EDEDED", G: "#7ED957", g: "#2D9B5A" }, f: [
    "...PPPPPPPP...",
    "..PWWWWWWWWP..",
    ".PWWWwwwwWWWP.",
    "PWWwwGGGGwwWWP",
    "PWWwGgggGgwWWP",
    ".PWWwwgggwWWP.",
    "..PWWWWWWWWP..",
    "...pppppppp...",
  ] },
  huevo: { pal: { X: "#6B5A47", W: "#FFF8E7", H: "#FFFFFF", C: "#EAD9B5" }, f: [
    "...XXXX...",
    "..XWWWWX..",
    ".XWWHHWWX.",
    ".XWHHWWWX.",
    "XWWHWWWWWX",
    "XWWWWWWWWX",
    "XWWWWWWCCX",
    "XWWWWWCCCX",
    ".XWWWCCCX.",
    ".XWCCCCCX.",
    "..XXXXXX..",
  ] },
  verdura: { pal: { O: "#1E4D24", G: "#3FA34D", D: "#2A7A35", L: "#C8E6A0", l: "#A9CF7E" }, f: [
    "....OOOOO....",
    "..OOGGGGGOO..",
    ".OGGDGGGDGGO.",
    "OGGDGGGGGDGGO",
    "OGDGGGDGGGDGO",
    "OGGGDGGGGDGGO",
    ".OGGGGDGGGGO.",
    "..OOOGGGOOO..",
    ".....OLO.....",
    ".....OLO.....",
    "....OLLLO....",
    "....OllLO....",
    ".....OOO.....",
  ] },
  arroz: { pal: { W: "#FFFFFF", w: "#E8E8E8", B: "#3E7DBF", b: "#2C5C8F", R: "#E74C3C" }, f: [
    "....WWWWWW....",
    "...WWWwWWWW...",
    "..WWwWWWWwWW..",
    ".WWWWWWwWWWWW.",
    "bbbbbbbbbbbbbb",
    ".BBBBBRRBBBBB.",
    ".BBBBBBBBBBBB.",
    "..BBBBBBBBBB..",
    "...BBBBBBBB...",
    "....bbbbbb....",
  ] },
  aguacate: { pal: { K: "#2F5D2A", G: "#6BBF59", L: "#C8E86B", B: "#7A4E2D", b: "#5C3A20" }, f: [
    "....KKKK....",
    "...KGGGGK...",
    "..KGLLLLGK..",
    ".KGLLLLLLGK.",
    ".KGLLLLLLGK.",
    "KGLLLBBLLLGK",
    "KGLLBbbBLLGK",
    "KGLLBbbBLLGK",
    "KGLLLBBLLLGK",
    ".KGLLLLLLGK.",
    ".KGLLLLLLGK.",
    "..KGLLLLGK..",
    "...KGGGGK...",
    "....KKKK....",
  ] },
  pesas: { pal: { D: "#2E2E2E", d: "#111111", S: "#C6CBD1", s: "#8E949A" }, f: [
    ".DD..............DD.",
    ".DD..............DD.",
    "dDDd............dDDd",
    "dDDdSSSSSSSSSSSSdDDd",
    "dDDdssssssssssssdDDd",
    ".DD..............DD.",
    ".DD..............DD.",
  ] },
};

function Prop({ id, px = 4 }) {
  const p = PROPS[id];
  if (!p) return null;
  const h = p.f.length, w = Math.max(...p.f.map(r => r.length));
  const rects = [];
  p.f.forEach((fila, y) => [...fila].forEach((ch, x) => {
    if (ch !== "." && p.pal[ch]) rects.push(<rect key={`${x}-${y}`} x={x} y={y} width={1} height={1} fill={p.pal[ch]} />);
  }));
  return (
    <svg viewBox={`0 0 ${w} ${h}`} width={w * px} height={h * px}
      style={{ imageRendering: "pixelated", shapeRendering: "crispEdges", display: "block" }}>
      {rects}
    </svg>
  );
}

// Dónde va cada objeto respecto a la oveja: «al lado» (abajo a la derecha) o
// «levantado» (la barra por encima de la cabeza, como un levantador).
const SITIO = {
  plato:    { right: "4%",  bottom: "6%" },
  huevo:    { right: "6%",  bottom: "8%" },
  verdura:  { right: "4%",  bottom: "6%" },
  arroz:    { right: "3%",  bottom: "6%" },
  aguacate: { right: "4%",  bottom: "6%" },
  pesas:    { left: "50%",  top: "3%", transform: "translateX(-50%)" },
};

const TXT = {
  es: { titulo: "ELIGE TU PROGRAMACIÓN", sub: "Desliza las fichas y elige la tuya", estilo: "Estilo:", para: "Para:",
        elegir: "¡Elijo esta!", elegida: "✓ Elegida", volver: "Volver", tuya: "1P", ayuda: "Podrás cambiarla cuando quieras desde el organizador." },
  en: { titulo: "SELECT YOUR PROGRAM", sub: "Swipe the cards and pick yours", estilo: "Style:", para: "For:",
        elegir: "I choose this!", elegida: "✓ Chosen", volver: "Back", tuya: "1P", ayuda: "You can change it any time from the organiser." },
};

// ── El selector ───────────────────────────────────────────────────────────────
export function SelectorPrograma({ lang = "es", T, Sheep, profile, valor, onElegir, onClose, sfx }) {
  const t = TXT[lang] || TXT.es;
  const L = lang === "en" ? "en" : "es";
  const tira = useRef(null);
  const inicial = Math.max(0, FICHAS.findIndex(f => f.v === valor));
  const [idx, setIdx] = useState(inicial);

  // Tipografía de píxel (una vez por página). Con `display=swap` el texto sale
  // en monoespaciada mientras llega y no bloquea nada.
  useEffect(() => {
    if (!document.querySelector('link[data-gbh-font="press-start"]')) {
      const l = document.createElement("link");
      l.rel = "stylesheet"; l.href = FUENTE_URL; l.setAttribute("data-gbh-font", "press-start");
      document.head.appendChild(l);
    }
  }, []);

  // Al abrir, la ficha de la programación actual queda centrada.
  useEffect(() => {
    const el = tira.current;
    if (!el || !el.children[inicial]) return;
    const hijo = el.children[inicial];
    el.scrollLeft = hijo.offsetLeft - (el.clientWidth - hijo.clientWidth) / 2;
  }, []);   // eslint-disable-line react-hooks/exhaustive-deps

  // Escape cierra; el scroll de la página de detrás se congela mientras está abierto.
  useEffect(() => {
    const onKey = e => { if (e.key === "Escape") onClose && onClose(); };
    window.addEventListener("keydown", onKey);
    const prev = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => { window.removeEventListener("keydown", onKey); document.body.style.overflow = prev; };
  }, [onClose]);

  const alScroll = useCallback(() => {
    const el = tira.current;
    if (!el || !el.children.length) return;
    const centro = el.scrollLeft + el.clientWidth / 2;
    let mejor = 0, dist = Infinity;
    [...el.children].forEach((h, i) => {
      const c = h.offsetLeft + h.clientWidth / 2;
      const d = Math.abs(c - centro);
      if (d < dist) { dist = d; mejor = i; }
    });
    if (mejor !== idx) { setIdx(mejor); sfx && sfx("step"); }
  }, [idx, sfx]);

  const ir = (i) => {
    const el = tira.current;
    const j = Math.max(0, Math.min(FICHAS.length - 1, i));
    const hijo = el && el.children[j];
    if (!hijo) return;
    el.scrollTo({ left: hijo.offsetLeft - (el.clientWidth - hijo.clientWidth) / 2, behavior: "smooth" });
  };

  const elegir = (v) => {
    sfx && sfx("coin");
    onElegir && onElegir(v);
  };

  const colorBo = profile?.bo_color || "blanca";
  const equipados = Array.isArray(profile?.bo_equipados) ? profile.bo_equipados : [];

  const cuerpo = (
    <div style={{ position: "fixed", inset: 0, zIndex: 9999, display: "flex", flexDirection: "column",
                  background: "#050A07",
                  backgroundImage: "repeating-linear-gradient(0deg, rgba(255,255,255,0.025) 0 1px, transparent 1px 3px)",
                  color: "#FFFFFF", fontFamily: "'DM Sans', sans-serif" }}>
      {/* Cabecera «SELECT PLAYER» */}
      <div style={{ padding: "max(14px, env(safe-area-inset-top)) 14px 6px", textAlign: "center", position: "relative" }}>
        <button onClick={() => { sfx && sfx("tap"); onClose && onClose(); }}
          style={{ position: "absolute", left: 12, top: "max(12px, env(safe-area-inset-top))", background: "transparent",
                   border: "2px solid rgba(255,255,255,0.25)", color: "#FFFFFF", borderRadius: 10, padding: "8px 10px",
                   fontFamily: FUENTE, fontSize: 9, cursor: "pointer", letterSpacing: "0.04em" }}>
          ◀ {t.volver}
        </button>
        <div style={{ fontFamily: FUENTE, fontSize: "min(15px, 3.6vw)", color: "#FF4B4B", lineHeight: 1.5, marginTop: 34,
                      textShadow: "3px 3px 0 #5A0C0C", letterSpacing: "0.04em", padding: "0 8px" }}>
          {t.titulo}
        </div>
        <div style={{ fontSize: 12, color: "rgba(255,255,255,0.6)", marginTop: 6 }}>{t.sub}</div>
      </div>

      {/* Tira de fichas */}
      <div style={{ position: "relative", flex: 1, minHeight: 0, display: "flex", alignItems: "center" }}>
        <button onClick={() => ir(idx - 1)} aria-label="anterior" disabled={idx === 0}
          style={{ position: "absolute", left: 4, top: "42%", zIndex: 2, background: "rgba(0,0,0,0.55)", color: idx === 0 ? "rgba(255,255,255,0.25)" : "#F5B800",
                   border: "none", fontFamily: FUENTE, fontSize: 16, padding: "10px 6px", cursor: "pointer", borderRadius: 8 }}>◀</button>
        <button onClick={() => ir(idx + 1)} aria-label="siguiente" disabled={idx === FICHAS.length - 1}
          style={{ position: "absolute", right: 4, top: "42%", zIndex: 2, background: "rgba(0,0,0,0.55)", color: idx === FICHAS.length - 1 ? "rgba(255,255,255,0.25)" : "#F5B800",
                   border: "none", fontFamily: FUENTE, fontSize: 16, padding: "10px 6px", cursor: "pointer", borderRadius: 8 }}>▶</button>

        {/* Anchuras en % del contenedor (no en vw): así la ficha se centra igual en
            un móvil estrecho, en una ventana de escritorio y en el arnés de pruebas. */}
        <div ref={tira} onScroll={alScroll} className="gbh-sel-tira"
          style={{ display: "flex", gap: 14, overflowX: "auto", overflowY: "hidden", scrollSnapType: "x mandatory",
                   padding: "6px max(9%, calc(50% - 180px)) 12px", width: "100%", height: "100%", alignItems: "center",
                   boxSizing: "border-box", WebkitOverflowScrolling: "touch", scrollbarWidth: "none" }}>
          {FICHAS.map((f, i) => {
            const activa = i === idx;
            const esLaTuya = f.v === valor;
            return (
              <div key={f.v} style={{ flex: "0 0 min(82%, 360px)", scrollSnapAlign: "center", display: "flex",
                                      flexDirection: "column", alignItems: "center",
                                      transform: activa ? "scale(1)" : "scale(0.94)", opacity: activa ? 1 : 0.6,
                                      transition: "transform .25s, opacity .25s" }}>
                {/* Marco del retrato */}
                <div style={{ position: "relative", width: "100%", aspectRatio: "1 / 1", maxHeight: "44vh",
                              background: "radial-gradient(circle at 50% 35%, #1C2A22 0%, #0B1A11 70%)",
                              border: `4px solid ${activa ? "#EDE6D3" : "#5C5C5C"}`, outline: `3px solid ${activa ? f.acento : "#2E2E2E"}`,
                              outlineOffset: -10, boxShadow: activa ? `0 0 24px ${f.acento}55` : "none", overflow: "hidden" }}>
                  <div style={{ position: "absolute", inset: "10% 14% 10% 10%", display: "flex", alignItems: "flex-end", justifyContent: "center" }}>
                    {Sheep
                      ? <Sheep estado="normal" equipados={equipados} color={colorBo} size={192} mini={!activa} />
                      : <div style={{ width: 192, height: 192, background: "#FDF6E3", borderRadius: "40% 40% 45% 45%" }} />}
                  </div>
                  <div style={{ position: "absolute", ...SITIO[f.prop] }}>
                    <Prop id={f.prop} px={f.prop === "pesas" ? 4 : 5} />
                  </div>
                  {esLaTuya && (
                    <div style={{ position: "absolute", left: 12, top: 10, fontFamily: FUENTE, fontSize: 14, color: "#FF4B4B",
                                  textShadow: "2px 2px 0 #000" }}>{t.tuya}</div>
                  )}
                </div>

                {/* Nombre y «habilidades» */}
                <div style={{ fontFamily: FUENTE, fontSize: 15, color: "#F5B800", marginTop: 14, textShadow: "2px 2px 0 #000", textAlign: "center" }}>
                  {f.nombre[L]}
                </div>
                <div style={{ fontFamily: FUENTE, fontSize: 8.5, color: "#7ED957", lineHeight: 1.9, marginTop: 8, textAlign: "center", width: "100%" }}>
                  <div>{t.estilo} <span style={{ color: "#B8F0A0" }}>{f.estilo[L]}</span></div>
                  <div>{t.para} <span style={{ color: "#B8F0A0" }}>{f.para[L]}</span></div>
                </div>

                {/* Descripción + botón */}
                <div style={{ fontSize: 12.5, color: "rgba(255,255,255,0.78)", lineHeight: 1.5, marginTop: 10, textAlign: "center", minHeight: 56 }}>
                  {f.desc[L]}
                </div>
                <button onClick={() => elegir(f.v)}
                  style={{ marginTop: 12, fontFamily: FUENTE, fontSize: 10, color: esLaTuya ? "#0B1A11" : "#0B1A11",
                           background: esLaTuya ? "#7ED957" : (T?.au1 || "#C9A227"), border: "none", borderRadius: 12,
                           padding: "14px 18px", cursor: "pointer", boxShadow: "0 4px 0 #6B5400", letterSpacing: "0.02em", width: "88%" }}>
                  {esLaTuya ? t.elegida : t.elegir}
                </button>
              </div>
            );
          })}
        </div>
      </div>

      {/* Puntos + ayuda */}
      <div style={{ padding: "6px 12px max(12px, env(safe-area-inset-bottom))", textAlign: "center" }}>
        <div style={{ display: "flex", justifyContent: "center", gap: 8, marginBottom: 6 }}>
          {FICHAS.map((f, i) => (
            <button key={f.v} onClick={() => ir(i)} aria-label={f.nombre[L]}
              style={{ width: i === idx ? 18 : 8, height: 8, borderRadius: 4, border: "none", padding: 0, cursor: "pointer",
                       background: i === idx ? f.acento : "rgba(255,255,255,0.25)", transition: "width .2s" }} />
          ))}
        </div>
        <div style={{ fontSize: 11, color: "rgba(255,255,255,0.4)" }}>{t.ayuda}</div>
      </div>
      <style>{`.gbh-sel-tira::-webkit-scrollbar{display:none}`}</style>
    </div>
  );

  return typeof document !== "undefined" ? createPortal(cuerpo, document.body) : cuerpo;
}

// ── Botón-ficha que abre el selector desde «Configura tu plan» ───────────────
export function BotonPrograma({ lang = "es", T, valor, onAbrir }) {
  const L = lang === "en" ? "en" : "es";
  const f = FICHAS.find(x => x.v === valor) || FICHAS[0];
  return (
    <button onClick={onAbrir}
      style={{ width: "100%", display: "flex", alignItems: "center", gap: 12, textAlign: "left", cursor: "pointer",
               background: "#050A07", border: `2px solid ${f.acento}`, borderRadius: 16, padding: "10px 12px",
               boxShadow: `0 0 14px ${f.acento}33` }}>
      <div style={{ width: 54, height: 54, flex: "0 0 54px", display: "flex", alignItems: "center", justifyContent: "center",
                    background: "#0B1A11", border: "2px solid #EDE6D3", borderRadius: 6 }}>
        <Prop id={f.prop} px={f.prop === "pesas" ? 2 : 3} />
      </div>
      <div style={{ flex: 1, minWidth: 0 }}>
        <div style={{ fontFamily: FUENTE, fontSize: 10, color: "#F5B800", textShadow: "1px 1px 0 #000", lineHeight: 1.6 }}>{f.nombre[L]}</div>
        <div style={{ fontSize: 11, color: "rgba(255,255,255,0.6)", fontFamily: "'DM Sans', sans-serif", marginTop: 2,
                      whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>{f.estilo[L]} · {f.para[L]}</div>
      </div>
      <div style={{ fontFamily: FUENTE, fontSize: 8, color: "#0B1A11", background: T?.au1 || "#C9A227", borderRadius: 8,
                    padding: "8px 8px", whiteSpace: "nowrap", boxShadow: "0 3px 0 #6B5400" }}>
        {L === "en" ? "CHANGE ▶" : "CAMBIAR ▶"}
      </div>
    </button>
  );
}
