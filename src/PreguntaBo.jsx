import React from "react";
import { createPortal } from "react-dom";
import { temasPara, botonTema, textoTema, firmaTema, puedeEscribir, filaEscrito, filaSistema, esSensible,
         opcionesIngredientes, filaRegistro } from "./boLogica";

// ─── «Pregúntale a Bo», fase 1 (sin IA) ──────────────────────────────────────────
// Hoja inferior con forma de conversación y BOTONES en vez de teclado. Bo no redacta: enseña
// textos de boRespuestas.js (lo que la app ya publica o lo que firmó Alejandro) y hace cosas
// SOLO por las funciones que ya usa el paciente, que le llegan por `onAccion` / `onAbrir`.
// Texto libre únicamente en «Escríbele a Alejandro», que se guarda en bo_registro por
// `onRegistrar` (la escritura la hace App.jsx). Lo sensible (SENSIBLE_RE) no se contesta.
// Diseño: BRIEF_pregunta_a_bo.md §3 y §12. Recibe T y Sheep por props, como MedidasCorporales.
const FT = "'Nunito',sans-serif", FD = "'DM Sans',sans-serif";
const TX = {
  es: { hola: "¿En qué te ayudo?", escribir: "✍️ Escríbele a Alejandro", cerrar: "Cerrar", ahoraNo: "Ahora no",
        si: { cambiar: "Sí, cámbiala", cambiar_sin: "Sí, cámbiala", descartar: "Sí, apártala" },
        abrir: { daily: "Ir a Platos diarios", lista: "Abrir la lista de la compra", config: "Abrir mi configuración", consulta: "Ir a Consulta" },
        escribirAqui: "Escribe aquí tu pregunta para Alejandro…", enviar: "Enviar", enviando: "Enviando…",
        hecho: (n) => n ? `Hecho. Ahora toca: ${n}.` : "Hecho.", apartada: "Hecho: apartada.",
        sinGemas: "No te llegan las gemas para cambiarla (10 💎).", sinAlt: "No hay receta similar disponible",
        error: "No he podido enviarlo. Cópialo y vuelve a probar en un rato:", otra: "¿Algo más?" },
  en: { hola: "How can I help?", escribir: "✍️ Write to Alejandro", cerrar: "Close", ahoraNo: "Not now",
        si: { cambiar: "Yes, swap it", cambiar_sin: "Yes, swap it", descartar: "Yes, set it aside" },
        abrir: { daily: "Go to Daily meals", lista: "Open the shopping list", config: "Open my settings", consulta: "Go to Consultation" },
        escribirAqui: "Write your question for Alejandro here…", enviar: "Send", enviando: "Sending…",
        hecho: (n) => n ? `Done. Now you have: ${n}.` : "Done.", apartada: "Done: set aside.",
        sinGemas: "You don't have enough gems to swap it (10 💎).", sinAlt: "No similar recipe available",
        error: "I couldn't send it. Copy it and try again in a while:", otra: "Anything else?" },
};

function Burbuja({ T, Sheep, bo, m }) {
  if (m.de === "yo") return (
    <div style={{ display: "flex", justifyContent: "flex-end", marginBottom: 10 }}>
      <div style={{ background: "rgba(45,155,90,0.16)", border: `1.5px solid ${T.g1}`, borderRadius: "18px 18px 6px 18px", padding: "10px 13px", maxWidth: "80%", fontSize: 13.5, fontWeight: 800, color: T.g2, fontFamily: FD }}>{m.tx}</div>
    </div>);
  return (
    <div style={{ display: "flex", gap: 8, alignItems: "flex-end", marginBottom: 10 }}>
      <div style={{ flexShrink: 0 }}><Sheep estado="feliz" equipados={bo?.equipados || []} color={bo?.color || "blanca"} size={40} /></div>
      <div style={{ background: "linear-gradient(180deg,#1d3a14,#142a0e)", border: `1.5px solid ${T.bG}`, borderRadius: "18px 18px 18px 6px", padding: "10px 13px", maxWidth: "80%", fontSize: 13.5, color: T.t1, fontFamily: FD, lineHeight: 1.55, whiteSpace: "pre-wrap" }}>
        {m.tx}
        {m.firma && <div style={{ marginTop: 6, fontSize: 11, color: T.au1, fontWeight: 900, fontFamily: FT, textAlign: "right" }}>✍️ {m.firma}</div>}
      </div>
    </div>);
}

export function PreguntaBo({ T, Sheep, lang, bo, ctx, receta, intro, filas, onAccion, onAbrir, onRegistrar, onCerrar, pid }) {
  const EN = lang === "en", tx = TX[EN ? "en" : "es"];
  const temas = React.useMemo(() => temasPara(ctx, filas), [ctx, filas]);
  const escribe = puedeEscribir(ctx, filas);
  const [msgs, setMsgs] = React.useState(() => [{ de: "bo", tx: intro || tx.hola }]);
  // fase: 'temas' · 'confirmar' (acción pendiente) · 'ingrediente' · 'abrir' · 'escribir'
  const [fase, setFase] = React.useState("temas");
  const [pend, setPend] = React.useState(null);            // {tema, accion, ingrediente?, destino?}
  const [texto, setTexto] = React.useState("");
  const [ocupado, setOcupado] = React.useState(false);
  const finRef = React.useRef(null);
  React.useEffect(() => { try { finRef.current && finRef.current.scrollIntoView({ behavior: "smooth", block: "end" }); } catch (e) {} }, [msgs, fase]);

  const registrar = (tema, resultado) => { try { onRegistrar && onRegistrar(filaRegistro({ pid, tipo: "uso", contexto: ctx?.contexto, tema, resultado })); } catch (e) {} };
  React.useEffect(() => { registrar(null, "abierto"); }, []); // eslint-disable-line react-hooks/exhaustive-deps
  const di = (m) => setMsgs((xs) => [...xs, m]);
  const volver = () => { setPend(null); setFase("temas"); };

  const elegirTema = (f) => {
    di({ de: "yo", tx: botonTema(f, lang) });
    di({ de: "bo", tx: textoTema(f, ctx, lang, filas), firma: firmaTema(f, ctx, filas) });
    const a = f.accion || "ninguna";
    if (a === "ninguna") { registrar(f.id, "respondido"); return volver(); }
    if (a.startsWith("abrir:")) { setPend({ tema: f.id, destino: a.slice(6) }); return setFase("abrir"); }
    if (a === "cambiar_sin") { setPend({ tema: f.id, accion: a }); return setFase("ingrediente"); }
    if (a === "escribir") { registrar(f.id, "respondido"); return escribe ? setFase("escribir") : volver(); }
    setPend({ tema: f.id, accion: a }); setFase("confirmar");
  };

  const ejecutar = async () => {
    if (!pend || ocupado) return;
    setOcupado(true);
    let r = null;
    try { r = await onAccion(pend.accion, pend.ingrediente ? { sinIngrediente: pend.ingrediente } : {}); } catch (e) { r = { ok: false }; }
    setOcupado(false);
    if (r && r.ok) {
      di({ de: "bo", tx: pend.accion === "descartar" ? tx.apartada : tx.hecho(r.nombre) });
      registrar(pend.tema, "accion");
    } else if (r && r.motivo === "gemas") {
      di({ de: "bo", tx: tx.sinGemas }); registrar(pend.tema, "abandonado");
    } else {
      const f = filaSistema("sin_alternativa", ctx, filas);
      di(f ? { de: "bo", tx: textoTema(f, ctx, lang, filas), firma: firmaTema(f, ctx, filas) } : { de: "bo", tx: tx.sinAlt });
      registrar(pend.tema, "abandonado");
      if (f && escribe) { setPend(null); return setFase("escribir"); }
    }
    volver();
  };

  const enviar = async () => {
    const t = texto.trim();
    if (!t || ocupado) return;
    setOcupado(true);
    di({ de: "yo", tx: t });
    const sensible = esSensible(t);
    let r = null;
    try { r = await onRegistrar(filaRegistro({ pid, tipo: "pregunta", contexto: ctx?.contexto, tema: pend?.tema || null, resultado: "escrito", texto: t, sensible })); } catch (e) { r = { ok: false }; }
    setOcupado(false);
    if (!r || !r.ok) { di({ de: "bo", tx: `${tx.error}\n\n${t}` }); return; }   // el texto se queda en la caja: no se pierde
    setTexto("");
    const f = sensible ? filaSistema("sensible", ctx, filas) : filaEscrito(ctx, filas);
    if (f) di({ de: "bo", tx: textoTema(f, ctx, lang, filas), firma: firmaTema(f, ctx, filas) });
    const ac = (f && f.accion) || "";
    if (ac.startsWith("abrir:")) { setPend({ tema: sensible ? "sensible" : "escrito", destino: ac.slice(6) }); return setFase("abrir"); }
    volver();
  };

  const abrir = () => {
    const d = pend?.destino;
    // Desde estándar o free, ir a Consulta tras el acuse es el paso a premium: se cuenta aparte.
    registrar(pend?.tema, d === "consulta" && ctx?.plan !== "premium" && (pend?.tema === "escrito" || pend?.tema === "consulta") ? "premium" : "accion");
    onAbrir && onAbrir(d);
    onCerrar && onCerrar();
  };

  const chip = (sel) => ({ fontFamily: FT, fontWeight: 900, fontSize: 12.5, padding: "9px 12px", borderRadius: 14, cursor: "pointer", textAlign: "left",
    border: sel ? `2px solid ${T.au2}` : "1.5px solid rgba(255,255,255,0.16)", background: sel ? T.g3 : "rgba(255,255,255,0.05)", color: sel ? T.wh : T.t1 });
  const ingredientes = fase === "ingrediente" ? opcionesIngredientes(receta?.ingList) : [];

  return createPortal(
    <div onClick={onCerrar} style={{ position: "fixed", inset: 0, background: "rgba(0,0,0,0.72)", zIndex: 2000, display: "flex", alignItems: "flex-end", justifyContent: "center" }}>
      <div onClick={(e) => e.stopPropagation()} data-bo="hoja" style={{ width: "100%", maxWidth: 520, maxHeight: "86vh", display: "flex", flexDirection: "column", background: "#0E1F0B", border: "2px solid rgba(255,255,255,0.14)", borderBottom: "none", borderRadius: "22px 22px 0 0", padding: "14px 14px calc(16px + env(safe-area-inset-bottom))", boxSizing: "border-box", animation: "popIn 0.2s ease", color: T.t1 }}>
        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 8 }}>
          <div style={{ fontSize: 15, fontWeight: 900, fontFamily: FT }}>💬 {EN ? `Ask ${bo?.nombre || "Bo"}` : `Pregúntale a ${bo?.nombre || "Bo"}`}{receta?.nombre ? <span style={{ color: T.t3, fontWeight: 700 }}> · {receta.nombre}</span> : null}</div>
          <button onClick={onCerrar} aria-label={tx.cerrar} style={{ font: `900 14px ${FT}`, width: 32, height: 32, borderRadius: 10, border: "1.5px solid rgba(255,255,255,0.18)", background: "transparent", color: T.t2, cursor: "pointer", flexShrink: 0 }}>✕</button>
        </div>
        <div style={{ overflowY: "auto", flex: 1, minHeight: 120, scrollbarWidth: "none" }}>
          {msgs.map((m, i) => <Burbuja key={i} T={T} Sheep={Sheep} bo={bo} m={m} />)}
          <div ref={finRef} />
        </div>
        <div style={{ display: "flex", flexDirection: "column", gap: 7, paddingTop: 8, borderTop: "1px solid rgba(255,255,255,0.08)" }}>
          {fase === "temas" && (<>
            {temas.map((f) => <button key={f.id} data-bo-tema={f.id} onClick={() => elegirTema(f)} style={chip(false)}>{botonTema(f, lang)}</button>)}
            {escribe && <button data-bo-tema="escribir" onClick={() => { di({ de: "yo", tx: tx.escribir.replace("✍️ ", "") }); setPend(null); setFase("escribir"); }} style={chip(false)}>{tx.escribir}</button>}
          </>)}
          {fase === "confirmar" && (
            <div style={{ display: "flex", gap: 8 }}>
              <button data-bo-si onClick={ejecutar} disabled={ocupado} style={{ ...chip(true), flex: 1, textAlign: "center", opacity: ocupado ? 0.6 : 1 }}>{tx.si[pend?.accion] || "OK"}</button>
              <button onClick={() => { registrar(pend?.tema, "abandonado"); volver(); }} style={{ ...chip(false), flex: 1, textAlign: "center" }}>{tx.ahoraNo}</button>
            </div>)}
          {fase === "ingrediente" && (<>
            <div style={{ display: "flex", flexWrap: "wrap", gap: 6 }}>
              {ingredientes.map((n) => <button key={n} data-bo-ing={n} onClick={() => { di({ de: "yo", tx: n }); setPend((p) => ({ ...p, ingrediente: n })); setFase("confirmar"); }} style={{ ...chip(false), padding: "7px 10px", fontSize: 12 }}>{n}</button>)}
            </div>
            <button onClick={() => { registrar(pend?.tema, "abandonado"); volver(); }} style={{ ...chip(false), textAlign: "center" }}>{tx.ahoraNo}</button>
          </>)}
          {fase === "abrir" && (
            <div style={{ display: "flex", gap: 8 }}>
              <button data-bo-abrir={pend?.destino} onClick={abrir} style={{ ...chip(true), flex: 1, textAlign: "center" }}>{tx.abrir[pend?.destino] || "OK"}</button>
              <button onClick={() => { registrar(pend?.tema, "respondido"); volver(); }} style={{ ...chip(false), flex: 1, textAlign: "center" }}>{tx.ahoraNo}</button>
            </div>)}
          {fase === "escribir" && (<>
            <textarea value={texto} onChange={(e) => setTexto(e.target.value.slice(0, 1000))} placeholder={tx.escribirAqui} rows={3}
              style={{ font: `600 14px ${FD}`, color: T.t1, background: "rgba(255,255,255,0.06)", border: "2px solid rgba(255,255,255,0.12)", borderRadius: 12, padding: "10px 12px", width: "100%", boxSizing: "border-box", outline: "none", resize: "none" }} />
            <div style={{ display: "flex", gap: 8 }}>
              <button data-bo-enviar onClick={enviar} disabled={ocupado || !texto.trim()} style={{ ...chip(true), flex: 1, textAlign: "center", opacity: (ocupado || !texto.trim()) ? 0.55 : 1 }}>{ocupado ? tx.enviando : tx.enviar}</button>
              <button onClick={() => { registrar(null, "abandonado"); volver(); }} style={{ ...chip(false), flex: 1, textAlign: "center" }}>{tx.ahoraNo}</button>
            </div>
          </>)}
        </div>
      </div>
    </div>,
    document.body);
}

// ─── El bocadillo de los momentos (⏭️ «Me la salté» · 🔄 «La cambié») ──────────────────
// No bloquea, se cierra con un toque y sale como mucho una vez al día (lo decide PlanTab con
// momentoVisto/marcarMomentoVisto). Sin culpa: el texto es el firmado, tal cual.
export function BoMomento({ T, Sheep, bo, texto, firma, lang, onCerrar }) {
  return createPortal(
    <div data-bo="momento" style={{ position: "fixed", left: "50%", transform: "translateX(-50%)", bottom: "calc(86px + env(safe-area-inset-bottom))", width: "calc(100% - 24px)", maxWidth: 480, zIndex: 1500, display: "flex", gap: 8, alignItems: "flex-end", animation: "popIn 0.25s ease" }}>
      <div style={{ flexShrink: 0 }}><Sheep estado="feliz" equipados={bo?.equipados || []} color={bo?.color || "blanca"} size={44} /></div>
      <div style={{ flex: 1, background: "linear-gradient(180deg,#1d3a14,#142a0e)", border: `1.5px solid ${T.bG}`, borderRadius: "18px 18px 18px 6px", padding: "10px 12px", fontSize: 13, color: T.t1, fontFamily: FD, lineHeight: 1.5, boxShadow: "0 8px 24px rgba(0,0,0,0.5)", position: "relative" }}>
        <button onClick={onCerrar} aria-label={lang === "en" ? "Close" : "Cerrar"} style={{ position: "absolute", top: 4, right: 6, font: `900 13px ${FT}`, border: "none", background: "transparent", color: T.t3, cursor: "pointer" }}>✕</button>
        <div style={{ paddingRight: 16 }}>{texto}</div>
        {firma && <div style={{ marginTop: 5, fontSize: 11, color: T.au1, fontWeight: 900, fontFamily: FT, textAlign: "right" }}>✍️ {firma}</div>}
      </div>
    </div>,
    document.body);
}
