import React from "react";
import { createPortal } from "react-dom";
import { temasPara, botonTema, textoTema, firmaTema, puedeEscribir, filaEscrito, filaSistema, esSensible,
         opcionesIngredientes, filaRegistro, pasoIA, cuerpoIA, errorIA, confirmarTxt, huecoTxt, prefTxt, kgTxt } from "./boLogica";

// ─── «Pregúntale a Bo» ───────────────────────────────────────────────────────────
// Hoja inferior con forma de conversación. Fase 1 (sin IA): BOTONES con textos de boRespuestas.js
// (lo que la app ya publica o lo que firmó Alejandro) y acciones SOLO por las funciones que ya usa
// el paciente (`onAccion` / `onAbrir`). «Escríbele a Alejandro» se guarda en bo_registro.
// Fase 2 (2-oct-2026, con `ia`): además, el paciente ESCRIBE lo que quiera; el servidor
// (/bo/entender) lo clasifica con IA en una estructura cerrada y pasoIA (boLogica.js) decide el
// siguiente paso. La IA no redacta nada de lo que se lee aquí. Antes de la primera frase, permiso
// explícito (Apple 5.1.2(i), RGPD) y, siempre, el aviso de que hay IA (Ley de IA, art. 50).
// Diseño: BRIEF_pregunta_a_bo.md §3, §12 y §16. Recibe T y Sheep por props, como MedidasCorporales.
const FT = "'Nunito',sans-serif", FD = "'DM Sans',sans-serif";
const TOMA_LBL = { es: { Desayuno: "Desayuno", Almuerzo: "Almuerzo", Comida: "Comida", Merienda: "Merienda", Cena: "Cena" },
                   en: { Desayuno: "Breakfast", Almuerzo: "Morning snack", Comida: "Lunch", Merienda: "Afternoon snack", Cena: "Dinner" } };
const TX = {
  es: { hola: "¿En qué te ayudo?", escribir: "✍️ Escríbele a Alejandro", cerrar: "Cerrar", ahoraNo: "Ahora no",
        si: { cambiar: "Sí, cámbiala", cambiar_sin: "Sí, cámbiala", descartar: "Sí, apártala", peso: "Sí, apúntalo", consulta: "Sí, pídela", config: "Sí, cámbialo" },
        abrir: { daily: "Ir a Platos diarios", lista: "Abrir la lista de la compra", config: "Abrir mi configuración", consulta: "Ir a Consulta",
                 peso: "Ir a Peso", calendly: "📅 Elegir la hora en su agenda", objetivo: "Ir a Objetivo" },
        configOk: "Hecho. Lo verás en tu próxima programación.", configFallo: "No he podido guardarlo. Pruébalo en «Configura tu plan».",
        pesoOk: (k) => `Apuntado: ${k}.`, pesoFallo: "No he podido apuntarlo. Pruébalo en la pestaña Peso.",
        consultaOk: (d) => `Hecho: Alejandro ya tiene tu solicitud para ${d}. Ahora elige la hora en su agenda.`,
        consultaFallo: "No he podido dejar la solicitud, pero puedes reservar igualmente en su agenda.",
        dias: { sabado: "Sábado", domingo: "Domingo", cualquiera: "Me da igual" },
        escribirAqui: "Escribe aquí tu pregunta para Alejandro…", enviar: "Enviar", enviando: "Enviando…",
        hecho: (n) => n ? `Hecho. Ahora toca: ${n}.` : "Hecho.", apartada: "Hecho: apartada.",
        sinGemas: "No te llegan las gemas para cambiarla (10 💎).", sinAlt: "No hay receta similar disponible",
        error: "No he podido enviarlo. Cópialo y vuelve a probar en un rato:", cualFalta: "¿Qué ingrediente te falta?",
        iaPh: "Escríbeme lo que necesites…", pensando: "Bo está pensando…",
        iaAviso: (p) => `✨ Bo usa IA (${p}) para entender lo que escribes. Lo que te contesta sale de tu plan o de Alejandro.`,
        consTit: "Antes de escribirme",
        consTx: (p) => `Para entender lo que escribes, Bo usa la inteligencia artificial de ${p}. Se le envía tu frase y los nombres de las recetas de tu semana; nunca tu nombre ni tu correo. Lo que escribas se guarda para que Alejandro pueda revisarlo y mejorar las respuestas. Puedes seguir usando los botones sin aceptar.`,
        acepto: "Acepto", consFallo: "No he podido guardar tu permiso. Prueba en un rato.", ir: (h) => `Ir a ${h}` },
  en: { hola: "How can I help?", escribir: "✍️ Write to Alejandro", cerrar: "Close", ahoraNo: "Not now",
        si: { cambiar: "Yes, swap it", cambiar_sin: "Yes, swap it", descartar: "Yes, set it aside", peso: "Yes, log it", consulta: "Yes, ask for it", config: "Yes, change it" },
        abrir: { daily: "Go to Daily meals", lista: "Open the shopping list", config: "Open my settings", consulta: "Go to Consultation",
                 peso: "Go to Weight", calendly: "📅 Choose the time in his calendar", objetivo: "Go to Goal" },
        configOk: "Done. You'll see it in your next programme.", configFallo: "I couldn't save it. Try it in «Set up your plan».",
        pesoOk: (k) => `Logged: ${k}.`, pesoFallo: "I couldn't log it. Try it in the Weight tab.",
        consultaOk: (d) => `Done: Alejandro has your request for ${d}. Now choose the time in his calendar.`,
        consultaFallo: "I couldn't leave the request, but you can still book in his calendar.",
        dias: { sabado: "Saturday", domingo: "Sunday", cualquiera: "Either" },
        escribirAqui: "Write your question for Alejandro here…", enviar: "Send", enviando: "Sending…",
        hecho: (n) => n ? `Done. Now you have: ${n}.` : "Done.", apartada: "Done: set aside.",
        sinGemas: "You don't have enough gems to swap it (10 💎).", sinAlt: "No similar recipe available",
        error: "I couldn't send it. Copy it and try again in a while:", cualFalta: "Which ingredient are you missing?",
        iaPh: "Tell me what you need…", pensando: "Bo is thinking…",
        iaAviso: (p) => `✨ Bo uses AI (${p}) to understand what you write. Its answers come from your plan or from Alejandro.`,
        consTit: "Before you write to me",
        consTx: (p) => `To understand what you write, Bo uses ${p}'s artificial intelligence. It receives your sentence and the names of this week's recipes; never your name or email. What you write is stored so Alejandro can review it and improve the answers. You can keep using the buttons without accepting.`,
        acepto: "I agree", consFallo: "I couldn't save your permission. Try again later.", ir: (h) => `Go to ${h}` },
};
const hoyN = () => new Date().getDay() || 7;          // 1 = lunes … 7 = domingo, como el plan

function Burbuja({ T, Sheep, bo, m }) {
  if (m.de === "yo") return (
    <div style={{ display: "flex", justifyContent: "flex-end", marginBottom: 10 }}>
      <div style={{ background: "rgba(45,155,90,0.16)", border: `1.5px solid ${T.g1}`, borderRadius: "18px 18px 6px 18px", padding: "10px 13px", maxWidth: "80%", fontSize: 13.5, fontWeight: 800, color: T.g2, fontFamily: FD }}>{m.tx}</div>
    </div>);
  return (
    <div style={{ display: "flex", gap: 8, alignItems: "flex-end", marginBottom: 10 }}>
      <div style={{ flexShrink: 0 }}><Sheep estado="feliz" equipados={bo?.equipados || []} color={bo?.color || "blanca"} size={40} /></div>
      <div style={{ background: "linear-gradient(180deg,#1d3a14,#142a0e)", border: `1.5px solid ${T.bG}`, borderRadius: "18px 18px 18px 6px", padding: "10px 13px", maxWidth: "80%", fontSize: 13.5, color: T.t1, fontFamily: FD, lineHeight: 1.55, whiteSpace: "pre-wrap", opacity: m.pensando ? 0.7 : 1 }}>
        {m.tx}
        {m.firma && <div style={{ marginTop: 6, fontSize: 11, color: T.au1, fontWeight: 900, fontFamily: FT, textAlign: "right" }}>✍️ {m.firma}</div>}
      </div>
    </div>);
}

export function PreguntaBo({ T, Sheep, lang, bo, ctx, receta, intro, filas, ia: iaApi, pendiente, onAccion, onAbrir, onIr, onRegistrar, onCerrar, pid }) {
  const EN = lang === "en", tx = TX[EN ? "en" : "es"];
  const temas = React.useMemo(() => temasPara(ctx, filas), [ctx, filas]);
  const escribe = puedeEscribir(ctx, filas);
  const faseIni = pendiente ? (pendiente.accion === "cambiar_sin" && !pendiente.ingrediente ? "ingrediente" : "confirmar") : "temas";
  const [msgs, setMsgs] = React.useState(() => pendiente
    ? [{ de: "bo", tx: faseIni === "ingrediente" ? tx.cualFalta : confirmarTxt(pendiente, receta?.nombre, ctx, lang) }]
    : [{ de: "bo", tx: intro || tx.hola }]);
  // fase: 'temas' · 'confirmar' · 'ingrediente' · 'abrir' · 'escribir' · 'consentir' · 'aclarar' · 'ir' · 'consulta_dia'
  const [fase, setFase] = React.useState(faseIni);
  const [pend, setPend] = React.useState(() => (pendiente ? { tema: "ia", ...pendiente } : null));
  const [texto, setTexto] = React.useState("");
  const [ocupado, setOcupado] = React.useState(false);
  const [ia, setIa] = React.useState(null);                // {ia, proveedor, consentido} desde /bo/estado
  const [frase, setFrase] = React.useState("");
  const [pensando, setPensando] = React.useState(false);
  const [aclarar, setAclarar] = React.useState(null);      // {tomas, base}
  const [ir, setIr] = React.useState(null);                // {dia, toma, bo}
  const [fraseCons, setFraseCons] = React.useState(null);
  const ultima = React.useRef("");
  const finRef = React.useRef(null);
  React.useEffect(() => { try { finRef.current && finRef.current.scrollIntoView({ behavior: "smooth", block: "end" }); } catch (e) {} }, [msgs, fase, pensando]);

  const registrar = (tema, resultado) => { try { onRegistrar && onRegistrar(filaRegistro({ pid, tipo: "uso", contexto: ctx?.contexto, tema, resultado })); } catch (e) {} };
  React.useEffect(() => {
    registrar(pendiente ? "ia" : null, "abierto");
    let vivo = true;
    if (iaApi && typeof iaApi.estado === "function")
      Promise.resolve(iaApi.estado()).then((r) => { if (vivo && r && r.ia) setIa(r); }).catch(() => {});
    return () => { vivo = false; };
  }, []); // eslint-disable-line react-hooks/exhaustive-deps
  const di = (m) => setMsgs((xs) => [...xs, m]);
  const volver = () => { setPend(null); setFase("temas"); };

  const elegirTema = (f, conYo = true) => {
    if (conYo) di({ de: "yo", tx: botonTema(f, lang) });
    di({ de: "bo", tx: textoTema(f, ctx, lang, filas), firma: firmaTema(f, ctx, filas) });
    const a = f.accion || "ninguna";
    if (a === "ninguna") { registrar(f.id, "respondido"); return volver(); }
    if (a.startsWith("abrir:")) { setPend({ tema: f.id, destino: a.slice(6) }); return setFase("abrir"); }
    if (a === "cambiar_sin") { setPend({ tema: f.id, accion: a }); return setFase("ingrediente"); }
    if (a === "escribir") { registrar(f.id, "respondido"); return escribe ? setFase("escribir") : volver(); }
    setPend({ tema: f.id, accion: a }); setFase("confirmar");
  };

  // p0: la acción a ejecutar si no es la pendiente (el día de la consulta se elige y se ejecuta de un toque)
  const ejecutar = async (p0) => {
    const p = p0 || pend;
    if (!p || ocupado) return;
    setOcupado(true);
    let r = null;
    const opc = p.accion === "config" ? { ...(p.cambio || {}) }
      : { ...(p.ingrediente ? { sinIngrediente: p.ingrediente } : {}), ...(p.tipo_receta ? { tipo: p.tipo_receta } : {}),
          ...(p.valor != null ? { valor: p.valor } : {}), ...(p.preferencia ? { preferencia: p.preferencia } : {}) };
    try { r = await (onAccion ? onAccion(p.accion, opc) : null); } catch (e) { r = { ok: false }; }
    setOcupado(false);
    // Peso y consulta (3-oct-2026, BRIEF §18): sus propios acuses; la consulta sigue en el Calendly
    if (p.accion === "peso") {
      if (r && r.ok) { di({ de: "bo", tx: tx.pesoOk(kgTxt(p.valor, lang)) }); registrar(p.tema, "accion"); }
      else { di({ de: "bo", tx: tx.pesoFallo }); registrar(p.tema, "abandonado"); }
      return volver();
    }
    if (p.accion === "config") {           // su configuración (estándar, BRIEF §19): si no se guarda, a la pantalla
      if (r && r.ok) { di({ de: "bo", tx: tx.configOk }); registrar(p.tema, "accion"); return volver(); }
      di({ de: "bo", tx: tx.configFallo }); registrar(p.tema, "abandonado");
      setPend({ tema: p.tema, destino: "config" });
      return setFase("abrir");
    }
    if (p.accion === "consulta") {
      if (r && r.ok) { di({ de: "bo", tx: tx.consultaOk(prefTxt(p.preferencia, lang)) }); registrar(p.tema, "accion"); }
      else di({ de: "bo", tx: tx.consultaFallo });
      setPend({ tema: p.tema, destino: "calendly" });
      return setFase("abrir");
    }
    if (r && r.ok) {
      di({ de: "bo", tx: p.accion === "descartar" ? tx.apartada : tx.hecho(r.nombre) });
      registrar(p.tema, "accion");
    } else if (r && r.motivo === "gemas") {
      di({ de: "bo", tx: tx.sinGemas }); registrar(p.tema, "abandonado");
    } else {
      const f = filaSistema("sin_alternativa", ctx, filas);
      di(f ? { de: "bo", tx: textoTema(f, ctx, lang, filas), firma: firmaTema(f, ctx, filas) } : { de: "bo", tx: tx.sinAlt });
      registrar(p.tema, "abandonado");
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
    registrar(pend?.tema, d === "consulta" && ctx?.plan !== "premium" && ["escrito", "consulta", "alejandro"].includes(pend?.tema) ? "premium" : "accion");
    onAbrir && onAbrir(d);
    onCerrar && onCerrar();
  };

  // ── Fase 2: lo que el paciente escribe ─────────────────────────────────────
  const aplicar = (p) => {
    if (p.tema) return elegirTema(p.tema, false);
    (p.mensajes || []).forEach((m) => di({ de: "bo", tx: m.tx, firma: m.firma }));
    if (p.fase === "confirmar" || p.fase === "ingrediente") {
      setPend(p.pend);
      if (p.fase === "ingrediente") di({ de: "bo", tx: tx.cualFalta });
      return setFase(p.fase);
    }
    if (p.fase === "ir") { setIr(p.ir); return setFase("ir"); }
    if (p.fase === "aclarar") { setAclarar({ tomas: p.tomas, base: p.base }); return setFase("aclarar"); }
    if (p.fase === "escribir") { setTexto(p.prellenar || ""); setPend({ tema: "alejandro" }); return setFase("escribir"); }
    if (p.fase === "abrir") { setPend(p.pend); return setFase("abrir"); }
    if (p.fase === "consulta_dia") { setPend(p.pend); return setFase("consulta_dia"); }
    volver();
  };
  const preguntar = async (t, c) => {
    setPensando(true);
    let r = null;
    try { r = await iaApi.entender(cuerpoIA(t, c, temas, lang, hoyN())); } catch (e) { r = { ok: false, status: 0 }; }
    setPensando(false);
    if (!r || !r.ok) {
      const det = r && r.data && r.data.detail;
      if (r && r.status === 403 && det === "sin_consentimiento") { setIa((x) => ({ ...(x || {}), consentido: false })); setFraseCons(t); return setFase("consentir"); }
      di({ de: "bo", tx: errorIA(r && r.status, det, lang) });
      return volver();
    }
    registrar("ia", "respondido");
    aplicar(pasoIA(r.data, ctx, lang, t, filas));
  };
  const enviarIA = async (t0, consentido) => {
    const t = String(t0 || "").trim();
    if (!t || pensando || !iaApi) return;
    if (!(consentido || (ia && ia.consentido))) { setFraseCons(t); return setFase("consentir"); }
    di({ de: "yo", tx: t }); setFrase(""); ultima.current = t;
    await preguntar(t, ctx);
  };
  const aceptar = async () => {
    if (ocupado) return;
    setOcupado(true);
    let ok = false;
    try { ok = await iaApi.consentir(); } catch (e) { ok = false; }
    setOcupado(false);
    if (!ok) { di({ de: "bo", tx: tx.consFallo }); return volver(); }
    setIa((x) => ({ ...(x || {}), consentido: true }));
    const t = fraseCons; setFraseCons(null); setFase("temas");
    if (t) await enviarIA(t, true);
  };
  const elegirToma = async (toma) => {
    const a = aclarar; setAclarar(null);
    di({ de: "yo", tx: TOMA_LBL[EN ? "en" : "es"][toma] || toma });
    if (a && a.base && a.base.pendiente === "accion") return aplicar(pasoIA({ ...a.base, tipo: "accion", toma }, ctx, lang, ultima.current, filas));
    await preguntar(ultima.current, { ...ctx, contexto: "receta", dia: a && a.base ? a.base.dia : null, toma });   // un dato: el servidor lo vuelve a mirar con esa comida
  };
  const irA = () => { registrar("ia", "accion"); onIr && onIr(ir); onCerrar && onCerrar(); };

  const chip = (sel) => ({ fontFamily: FT, fontWeight: 900, fontSize: 12.5, padding: "9px 12px", borderRadius: 14, cursor: "pointer", textAlign: "left",
    border: sel ? `2px solid ${T.au2}` : "1.5px solid rgba(255,255,255,0.16)", background: sel ? T.g3 : "rgba(255,255,255,0.05)", color: sel ? T.wh : T.t1 });
  const ingredientes = fase === "ingrediente" ? opcionesIngredientes(receta?.ingList) : [];
  const inputSty = { font: `600 14px ${FD}`, color: T.t1, background: "rgba(255,255,255,0.06)", border: "2px solid rgba(255,255,255,0.12)", borderRadius: 12, padding: "10px 12px", width: "100%", boxSizing: "border-box", outline: "none" };

  return createPortal(
    <div onClick={onCerrar} style={{ position: "fixed", inset: 0, background: "rgba(0,0,0,0.72)", zIndex: 2000, display: "flex", alignItems: "flex-end", justifyContent: "center" }}>
      <div onClick={(e) => e.stopPropagation()} data-bo="hoja" style={{ width: "100%", maxWidth: 520, maxHeight: "86vh", display: "flex", flexDirection: "column", background: "#0E1F0B", border: "2px solid rgba(255,255,255,0.14)", borderBottom: "none", borderRadius: "22px 22px 0 0", padding: "14px 14px calc(16px + env(safe-area-inset-bottom))", boxSizing: "border-box", animation: "popIn 0.2s ease", color: T.t1 }}>
        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 8 }}>
          <div style={{ fontSize: 15, fontWeight: 900, fontFamily: FT }}>💬 {EN ? `Ask ${bo?.nombre || "Bo"}` : `Pregúntale a ${bo?.nombre || "Bo"}`}{receta?.nombre ? <span style={{ color: T.t3, fontWeight: 700 }}> · {receta.nombre}</span> : null}</div>
          <button onClick={onCerrar} aria-label={tx.cerrar} style={{ font: `900 14px ${FT}`, width: 32, height: 32, borderRadius: 10, border: "1.5px solid rgba(255,255,255,0.18)", background: "transparent", color: T.t2, cursor: "pointer", flexShrink: 0 }}>✕</button>
        </div>
        <div style={{ overflowY: "auto", flex: 1, minHeight: 120, scrollbarWidth: "none" }}>
          {msgs.map((m, i) => <Burbuja key={i} T={T} Sheep={Sheep} bo={bo} m={m} />)}
          {pensando && <Burbuja T={T} Sheep={Sheep} bo={bo} m={{ de: "bo", tx: tx.pensando, pensando: true }} />}
          <div ref={finRef} />
        </div>
        <div style={{ display: "flex", flexDirection: "column", gap: 7, paddingTop: 8, borderTop: "1px solid rgba(255,255,255,0.08)", maxHeight: "46vh", overflowY: "auto", scrollbarWidth: "none" }}>
          {fase === "temas" && (<>
            {ia && ia.ia && (<div data-bo-ia>
              <div style={{ display: "flex", gap: 6 }}>
                <input data-bo-frase value={frase} onChange={(e) => setFrase(e.target.value.slice(0, 500))} placeholder={tx.iaPh} autoComplete="off" disabled={pensando}
                  onKeyDown={(e) => { if (e.key === "Enter") { e.preventDefault(); enviarIA(frase); } }} style={inputSty} />
                <button data-bo-enviar-ia onClick={() => enviarIA(frase)} disabled={pensando || !frase.trim()} aria-label={tx.enviar}
                  style={{ ...chip(true), padding: "0 14px", textAlign: "center", opacity: (pensando || !frase.trim()) ? 0.5 : 1 }}>➤</button>
              </div>
              <div style={{ fontSize: 10.5, color: T.t3, fontFamily: FD, marginTop: 4, lineHeight: 1.35 }}>{tx.iaAviso(ia.proveedor || "IA")}</div>
            </div>)}
            {temas.map((f) => <button key={f.id} data-bo-tema={f.id} onClick={() => elegirTema(f)} style={chip(false)}>{botonTema(f, lang)}</button>)}
            {escribe && <button data-bo-tema="escribir" onClick={() => { di({ de: "yo", tx: tx.escribir.replace("✍️ ", "") }); setPend(null); setFase("escribir"); }} style={chip(false)}>{tx.escribir}</button>}
          </>)}
          {fase === "consentir" && (
            <div data-bo-consentir style={{ background: "rgba(255,255,255,0.05)", border: "1.5px solid rgba(255,255,255,0.14)", borderRadius: 14, padding: "12px 12px" }}>
              <div style={{ fontSize: 13.5, fontWeight: 900, fontFamily: FT, marginBottom: 6 }}>🔐 {tx.consTit}</div>
              <div style={{ fontSize: 12.5, color: T.t2, fontFamily: FD, lineHeight: 1.5, marginBottom: 10 }}>{tx.consTx((ia && ia.proveedor) || "IA")}</div>
              <div style={{ display: "flex", gap: 8 }}>
                <button data-bo-acepto onClick={aceptar} disabled={ocupado} style={{ ...chip(true), flex: 1, textAlign: "center", opacity: ocupado ? 0.6 : 1 }}>{tx.acepto}</button>
                <button onClick={() => { setFraseCons(null); volver(); }} style={{ ...chip(false), flex: 1, textAlign: "center" }}>{tx.ahoraNo}</button>
              </div>
            </div>)}
          {fase === "aclarar" && aclarar && (<>
            <div style={{ display: "flex", flexWrap: "wrap", gap: 6 }}>
              {(aclarar.tomas || []).map((t) => <button key={t} data-bo-toma={t} onClick={() => elegirToma(t)} style={{ ...chip(false), padding: "7px 10px", fontSize: 12 }}>{TOMA_LBL[EN ? "en" : "es"][t] || t}</button>)}
            </div>
            <button onClick={() => { setAclarar(null); volver(); }} style={{ ...chip(false), textAlign: "center" }}>{tx.ahoraNo}</button>
          </>)}
          {fase === "ir" && ir && (
            <div style={{ display: "flex", gap: 8 }}>
              <button data-bo-ir onClick={irA} style={{ ...chip(true), flex: 1, textAlign: "center" }}>{tx.ir(huecoTxt(ir.dia, ir.toma, lang))}</button>
              <button onClick={() => { setIr(null); volver(); }} style={{ ...chip(false), flex: 1, textAlign: "center" }}>{tx.ahoraNo}</button>
            </div>)}
          {fase === "confirmar" && (
            <div style={{ display: "flex", gap: 8 }}>
              <button data-bo-si onClick={() => ejecutar()} disabled={ocupado} style={{ ...chip(true), flex: 1, textAlign: "center", opacity: ocupado ? 0.6 : 1 }}>{tx.si[pend?.accion] || "OK"}</button>
              <button onClick={() => { registrar(pend?.tema, "abandonado"); volver(); }} style={{ ...chip(false), flex: 1, textAlign: "center" }}>{tx.ahoraNo}</button>
            </div>)}
          {fase === "consulta_dia" && (<>
            <div style={{ display: "flex", flexWrap: "wrap", gap: 6 }}>
              {["sabado", "domingo", "cualquiera"].map((d) => <button key={d} data-bo-pref={d} disabled={ocupado}
                onClick={() => { di({ de: "yo", tx: tx.dias[d] }); ejecutar({ ...pend, preferencia: d }); }}
                style={{ ...chip(false), padding: "7px 10px", fontSize: 12 }}>{tx.dias[d]}</button>)}
            </div>
            <button onClick={() => { registrar(pend?.tema, "abandonado"); volver(); }} style={{ ...chip(false), textAlign: "center" }}>{tx.ahoraNo}</button>
          </>)}
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
              style={{ ...inputSty, resize: "none" }} />
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
