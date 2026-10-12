// ═══ CICLO Y BÁSCULA ══════════════════════════════════════════════════════════
// Tarjeta de la vista Peso (Progreso → Peso) para las pacientes (profiles.sex =
// 'F'): el peso esperado SIN y CON la retención de líquidos del ciclo, como en
// la plantilla femenina de la hoja «Análisis Corporal» (12-oct-2026, por orden
// de Alejandro). Ella elige en qué semana del ciclo está y cuánto retiene; la
// consulta lo vuelca desde la hoja con subir_ciclo_retencion.py.
//
// Datos: profiles.ciclo_retencion (jsonb, 07. App GBH/sql/ciclo_retencion.sql).
// El cálculo vive entero en motorCiclo.js (arnés: 07. App GBH/arnes_ciclo.py);
// aquí solo se dibuja. Como MedidasCorporales, todo lo de App.jsx llega por
// props (sbReq, T, Card, sfx) y App.jsx solo cambia en tres líneas.
import React, { useState, useEffect, useMemo, useRef } from "react";
import { ComposedChart, Line, XAxis, YAxis, Tooltip, ResponsiveContainer, ReferenceLine } from "recharts";
import { parametros, esperado, ventana, guardarEleccion, fechaMas, RETENCION_DEFECTO, RETENCION_MAX } from "./motorCiclo";

const masNuevo = (a, b) => (Date.parse(a?.actualizado || 0) || 0) > (Date.parse(b?.actualizado || 0) || 0);

const AGUA = "#64B5F6";   // el azul de la retención hídrica de «Tu metabolismo»

const TXT = {
  es: {
    titulo: "Tu ciclo y la báscula",
    sub: "Tu peso esperado con y sin la retención de líquidos de tu ciclo.",
    consulta: "De tu consulta",
    real: "Tu peso", sin: "Sin retención", con: "Con retención", hoy: "hoy",
    semana: "Semana del ciclo", esperadoSin: "Esperado sin retención", esperadoCon: "Con retención",
    hastaMas: (x) => `Esta semana la báscula puede marcar hasta ${x} kg más solo por agua: no es grasa.`,
    sinRet: (x) => `Esta semana no se espera retención: tu peso esperado es ${x} kg.`,
    porDebajo: (x) => `Esta semana se espera estar ${x} kg por debajo de la línea: empezaste con retención y ahora se ha ido.`,
    empieza: (f) => `Tu línea empieza el ${f}.`,
    ultimo: (f, x) => `Tu último pesaje (${f}): ${x} kg.`,
    pregunta: "¿En qué semana de tu ciclo estás?",
    ayudaSemanas: "1 = la semana en que empieza la regla · 4 = la semana de antes",
    elige: "Elige tu semana y verás cuánto puede moverse tu peso solo por la retención.",
    retencion: "Retención de líquidos",
    ayudaRet: `Lo que sube tu báscula la semana de antes de la regla. Si no lo sabes, deja ${String(RETENCION_DEFECTO).replace(".", ",")} kg.`,
    guardando: "Guardando…", guardado: "✓ Guardado",
    faltaObjetivo: "Para dibujar tu peso esperado falta tu peso objetivo: ponlo en Progreso → Objetivo.",
    pie: "Ciclo de 4 semanas, el mismo cálculo que usa tu nutricionista: la retención sube en la semana 3, llega al máximo en la 4 y se va con la regla. Es una estimación, no un diagnóstico.",
    pieConsulta: "Lo trae tu última consulta. Si tu ciclo va distinto, cámbialo aquí.",
    menos: "Menos retención", mas: "Más retención",
  },
  en: {
    titulo: "Your cycle and the scale",
    sub: "Your expected weight with and without your cycle's water retention.",
    consulta: "From your consultation",
    real: "Your weight", sin: "No retention", con: "With retention", hoy: "today",
    semana: "Cycle week", esperadoSin: "Expected, no retention", esperadoCon: "With retention",
    hastaMas: (x) => `This week the scale may read up to ${x} kg more from water alone: it isn't fat.`,
    sinRet: (x) => `No retention expected this week: your expected weight is ${x} kg.`,
    porDebajo: (x) => `This week you're expected ${x} kg below the line: you started with retention and it's gone now.`,
    empieza: (f) => `Your line starts on ${f}.`,
    ultimo: (f, x) => `Your last weigh-in (${f}): ${x} kg.`,
    pregunta: "Which week of your cycle are you in?",
    ayudaSemanas: "1 = the week your period starts · 4 = the week before",
    elige: "Pick your week to see how much your weight can move from retention alone.",
    retencion: "Water retention",
    ayudaRet: `How much your scale goes up the week before your period. If you don't know, leave ${RETENCION_DEFECTO} kg.`,
    guardando: "Saving…", guardado: "✓ Saved",
    faltaObjetivo: "To draw your expected weight we need your goal weight: set it in Progress → Goal.",
    pie: "4-week cycle, the same calculation your nutritionist uses: retention rises in week 3, peaks in week 4 and goes with your period. It's an estimate, not a diagnosis.",
    pieConsulta: "It comes from your last consultation. If your cycle runs differently, change it here.",
    menos: "Less retention", mas: "More retention",
  },
};

const hoyLocal = () => { const d = new Date(), p = (n) => String(n).padStart(2, "0"); return `${d.getFullYear()}-${p(d.getMonth() + 1)}-${p(d.getDate())}`; };
const ms = (s) => { const [y, m, d] = s.split("-").map(Number); return Date.UTC(y, m - 1, d); };
const dm = (s) => `${s.slice(8, 10)}/${s.slice(5, 7)}`;
const lsLeer = (k) => { try { const v = localStorage.getItem(k); return v ? JSON.parse(v) : null; } catch { return null; } };
const lsPoner = (k, v) => { try { localStorage.setItem(k, JSON.stringify(v)); } catch { /* sin almacenamiento */ } };

export function CicloPeso({ profile, weights, lang, sbReq, T, Card, sfx }) {
  const en = lang === "en";
  const L = TXT[en ? "en" : "es"];
  const kg = (v) => Number(v).toLocaleString(en ? "en-US" : "es-ES", { minimumFractionDigits: 1, maximumFractionDigits: 2 });
  const clave = `gbh:ciclo:${profile?.id}`;
  const [cfg, setCfg] = useState(() => (profile?.id ? lsLeer(clave) : null));
  const [estado, setEstado] = useState("");          // "" | "guardando" | "guardado"
  const temporizador = useRef(null);
  const pendiente = useRef(null);                    // lo elegido que aún no ha salido hacia la base
  const montado = useRef(true);
  const ruta = `profiles?id=eq.${profile?.id}`;
  const hoy = hoyLocal();

  // Manda lo más reciente: la base (la consulta puede haberlo volcado con la app
  // cerrada) salvo que lo elegido aquí sea posterior y no hubiera llegado (sin red).
  useEffect(() => {
    if (!profile?.id) return;
    let vivo = true;
    sbReq("GET", `profiles?id=eq.${profile.id}&select=ciclo_retencion&limit=1`).then((r) => {
      if (!vivo || !Array.isArray(r) || !r[0]) return;
      const base = r[0].ciclo_retencion ?? null, local = lsLeer(clave);
      if (local && local.origen === "app" && masNuevo(local, base)) {
        setCfg(local); sbReq("PATCH", ruta, { ciclo_retencion: local });
      } else { setCfg(base); lsPoner(clave, base); }
    });
    return () => { vivo = false; };
  }, [profile?.id]);   // eslint-disable-line react-hooks/exhaustive-deps
  // Al salir de la vista, lo que quedara por escribir se escribe ya.
  useEffect(() => () => {
    montado.current = false;
    clearTimeout(temporizador.current);
    if (pendiente.current) sbReq("PATCH", ruta, { ciclo_retencion: pendiente.current });
  }, []);   // eslint-disable-line react-hooks/exhaustive-deps

  const p = useMemo(() => parametros(cfg, weights, profile), [cfg, weights, profile]);
  const v = useMemo(() => (p.faltan.length ? null : ventana(p, hoy)), [p, hoy]);

  const guardar = (cambio) => {
    sfx && sfx("tap");
    const nuevo = guardarEleccion(cfg, cambio, hoy, new Date().toISOString());
    setCfg(nuevo); lsPoner(clave, nuevo);
    pendiente.current = nuevo;
    setEstado("guardando");
    clearTimeout(temporizador.current);
    // Una sola escritura por ráfaga de toques; sin red, la cola de sbReq la reintenta.
    temporizador.current = setTimeout(async () => {
      const valor = pendiente.current;
      pendiente.current = null;
      await sbReq("PATCH", ruta, { ciclo_retencion: valor });
      if (montado.current) setEstado("guardado");
    }, 700);
  };

  if (!profile?.id || p.faltan.includes("inicio")) return null;

  const cabecera = (
    <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", gap: 8, marginBottom: 4 }}>
      <div style={{ fontSize: 11, color: T.au1, textTransform: "uppercase", letterSpacing: "0.1em", fontWeight: 900 }}>🌸 {L.titulo}</div>
      {p.origen === "consulta" && <div style={{ fontSize: 10, color: T.g2, fontWeight: 800, background: "rgba(77,201,122,0.12)", border: "1px solid rgba(77,201,122,0.35)", borderRadius: 10, padding: "3px 8px", whiteSpace: "nowrap" }}>🩺 {L.consulta}</div>}
    </div>
  );
  const textoSuave = { fontSize: 12, color: T.t2, fontFamily: "'DM Sans',sans-serif", lineHeight: 1.55 };

  if (p.faltan.includes("objetivo")) {
    return (
      <Card>
        {cabecera}
        <div style={{ ...textoSuave, marginTop: 6 }} data-ciclo="falta-objetivo">{L.faltaObjetivo}</div>
      </Card>
    );
  }

  // ── Lo que se dibuja: las semanas de la línea y los pesajes que caen dentro ──
  const hayCon = p.semanaInicio != null && p.retencion != null;
  const pesos = (weights || []).filter((w) => w && w.date >= v.desde && w.date <= v.hasta && Number(w.weight) > 0);
  const porT = new Map();
  for (const s of v.semanas) porT.set(ms(s.fecha), { t: ms(s.fecha), fecha: s.fecha, sin: +s.sin.toFixed(2), con: hayCon ? +s.con.toFixed(2) : null });
  for (const w of pesos) {
    const t = ms(w.date), o = porT.get(t) || { t, fecha: w.date };
    porT.set(t, { ...o, real: Number(w.weight) });
  }
  const datos = [...porT.values()].sort((a, b) => a.t - b.t);
  const valores = datos.flatMap((d) => [d.sin, d.con, d.real]).filter((x) => x != null);
  // Eje Y en pasos redondos (1, 2 o 5 kg según el recorrido), no los que elija Recharts.
  const yMin = Math.min(...valores) - 0.3, yMax = Math.max(...valores) + 0.3;
  const pasoY = yMax - yMin <= 5 ? 1 : yMax - yMin <= 10 ? 2 : 5;
  const lo = Math.floor(yMin / pasoY) * pasoY, hi = Math.ceil(yMax / pasoY) * pasoY;
  const ticksY = []; for (let y = lo; y <= hi; y += pasoY) ticksY.push(y);
  const t0 = ms(v.desde), t1 = ms(fechaMas(v.desde, 7 * (v.k1 - v.k0)));
  const ticks = v.semanas.filter((_, i) => i % 3 === 0).map((s) => ms(s.fecha));
  const tHoy = ms(hoy);

  // ── Esta semana (antes de que empiece la línea, con el peso de inicio) ──
  const e = esperado(p, v.kHoy);
  const dif = hayCon ? +(e.con - e.sin).toFixed(2) : 0;
  const ultimo = (weights || []).filter((w) => w && !w.isInitial && Number(w.weight) > 0).slice(-1)[0];

  const Tip = ({ active, payload }) => {
    if (!active || !payload?.length) return null;
    const d = payload[0]?.payload || {};
    return (
      <div style={{ background: T.bgWood, border: `1px solid ${T.bA}`, borderRadius: 12, padding: "8px 12px", fontFamily: "'DM Sans',sans-serif" }}>
        <div style={{ color: T.t2, fontSize: 11 }}>{dm(d.fecha || hoy)}</div>
        {d.real != null && <div style={{ color: T.au1, fontWeight: 800, fontSize: 14 }}>{kg(d.real)} kg</div>}
        {d.sin != null && <div style={{ color: T.g2, fontSize: 12 }}>{L.sin}: {kg(d.sin)} kg</div>}
        {d.con != null && <div style={{ color: AGUA, fontSize: 12 }}>{L.con}: {kg(d.con)} kg</div>}
      </div>
    );
  };
  const leyenda = (color, texto, discontinua) => (
    <div style={{ fontSize: 10, color: T.t2, fontFamily: "'DM Sans',sans-serif", display: "flex", alignItems: "center", gap: 4 }}>
      <div style={{ width: 12, height: 0, borderTop: `${discontinua ? "2px dashed" : "3px solid"} ${color}` }} /> {texto}
    </div>
  );
  const ficha = (etiqueta, valor, color) => (
    <div style={{ flex: 1, minWidth: 0, background: "rgba(255,255,255,0.05)", borderRadius: 12, padding: "9px 6px", textAlign: "center" }}>
      <div style={{ fontSize: 9.5, color: T.t2, fontFamily: "'DM Sans',sans-serif", marginBottom: 2, lineHeight: 1.2 }}>{etiqueta}</div>
      <div style={{ fontSize: 16, fontWeight: 900, color, fontFamily: "'Nunito',sans-serif" }}>{valor}</div>
    </div>
  );
  const chip = (n) => {
    const on = hayCon && e.h === n;
    return (
      <button key={n} data-ciclo-semana={n} data-on={on ? 1 : 0} onClick={() => guardar({ semana: n })} style={{
        flex: 1, padding: "10px 0", borderRadius: 14, cursor: "pointer", fontWeight: 900, fontSize: 15,
        fontFamily: "'Nunito',sans-serif", color: on ? "#0B1A11" : T.t1,
        background: on ? `linear-gradient(135deg,${T.g1},${T.g2})` : "rgba(255,255,255,0.06)",
        border: on ? `2px solid ${T.g2}` : "2px solid rgba(255,255,255,0.12)",
        boxShadow: on ? `0 3px 0 ${T.g3}` : "0 3px 0 rgba(0,0,0,0.3)",
      }}>{n === 1 ? "🩸 1" : n === 4 ? "💧 4" : n}</button>
    );
  };
  const ret = p.retencion ?? RETENCION_DEFECTO;
  const paso = (d) => guardar({ retencion: Math.round((ret + d) * 10) / 10 });
  const boton = (texto, d, desactivado, etiqueta) => (
    <button aria-label={etiqueta} disabled={desactivado} onClick={() => paso(d)} style={{
      width: 40, height: 40, borderRadius: 12, fontSize: 20, fontWeight: 900, cursor: desactivado ? "default" : "pointer",
      background: "rgba(255,255,255,0.08)", border: "2px solid rgba(255,255,255,0.14)", color: desactivado ? T.t3 : T.t1,
    }}>{texto}</button>
  );

  return (
    <Card style={{ position: "relative" }}>
      <div data-ciclo="tarjeta" data-ciclo-sin={e.sin.toFixed(2)} data-ciclo-con={hayCon ? e.con.toFixed(2) : ""} data-ciclo-h={e.h ?? ""} data-ciclo-k={v.kHoy}>
        {cabecera}
        <div style={{ ...textoSuave, marginBottom: 10 }}>{L.sub}</div>

        <div style={{ display: "flex", gap: 10, flexWrap: "wrap", marginBottom: 6 }}>
          {pesos.length > 0 && leyenda(T.au1, L.real)}
          {leyenda(T.g2, L.sin, true)}
          {hayCon && leyenda(AGUA, L.con)}
        </div>
        <ResponsiveContainer width="100%" height={180}>
          <ComposedChart data={datos} margin={{ top: 12, right: 6, left: -22, bottom: 0 }}>
            <XAxis dataKey="t" type="number" domain={[t0, t1]} ticks={ticks} tickFormatter={(t) => dm(new Date(t).toISOString().slice(0, 10))} tick={{ fontSize: 9, fill: T.t2 }} tickLine={false} axisLine={false} />
            <YAxis domain={[lo, hi]} ticks={ticksY} allowDecimals={false} tick={{ fontSize: 9, fill: T.t2 }} tickLine={false} axisLine={false} />
            <Tooltip content={<Tip />} />
            {tHoy >= t0 && tHoy <= t1 && <ReferenceLine x={tHoy} stroke="rgba(255,255,255,0.3)" strokeDasharray="2 3" label={{ value: L.hoy, position: "top", fill: T.t2, fontSize: 9 }} />}
            <Line dataKey="sin" type="linear" stroke={T.g2} strokeWidth={2} strokeDasharray="5 4" dot={false} connectNulls isAnimationActive={false} />
            {hayCon && <Line dataKey="con" type="linear" stroke={AGUA} strokeWidth={2.5} dot={{ r: 2.5, fill: AGUA, strokeWidth: 0 }} connectNulls isAnimationActive={false} />}
            {pesos.length > 0 && <Line dataKey="real" type="linear" stroke={T.au1} strokeWidth={1.5} dot={{ r: 4, fill: T.au1, strokeWidth: 0 }} activeDot={{ r: 6, fill: T.au2 }} connectNulls isAnimationActive={false} />}
          </ComposedChart>
        </ResponsiveContainer>

        <div style={{ display: "flex", gap: 8, marginTop: 10 }}>
          {ficha(L.semana, hayCon ? e.h : "—", T.t1)}
          {ficha(L.esperadoSin, `${kg(e.sin)} kg`, T.g2)}
          {ficha(L.esperadoCon, hayCon ? `${kg(e.con)} kg` : "—", AGUA)}
        </div>
        <div data-ciclo="lectura" style={{ ...textoSuave, marginTop: 10, background: "rgba(100,181,246,0.08)", border: "1px solid rgba(100,181,246,0.25)", borderRadius: 12, padding: "9px 12px" }}>
          {v.kHoy < 0 && <>{L.empieza(dm(p.inicio))} </>}
          {!hayCon ? L.elige : dif > 0 ? L.hastaMas(kg(dif)) : dif < 0 ? L.porDebajo(kg(-dif)) : L.sinRet(kg(e.sin))}
          {ultimo && <div style={{ marginTop: 4, color: T.t3, fontSize: 11 }}>{L.ultimo(dm(ultimo.date), kg(ultimo.weight))}</div>}
        </div>

        <div style={{ fontSize: 13, fontWeight: 900, color: T.t1, marginTop: 16, marginBottom: 8, fontFamily: "'Nunito',sans-serif" }}>{L.pregunta}</div>
        <div style={{ display: "flex", gap: 8 }}>{[1, 2, 3, 4].map(chip)}</div>
        <div style={{ ...textoSuave, fontSize: 10.5, color: T.t3, marginTop: 6 }}>{L.ayudaSemanas}</div>

        {hayCon && (
          <>
            <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginTop: 14, gap: 10 }}>
              <div style={{ minWidth: 0 }}>
                <div style={{ fontSize: 13, fontWeight: 900, color: T.t1, fontFamily: "'Nunito',sans-serif" }}>{L.retencion}</div>
                <div style={{ ...textoSuave, fontSize: 10.5, color: T.t3 }}>{L.ayudaRet}</div>
              </div>
              <div style={{ display: "flex", alignItems: "center", gap: 8, flexShrink: 0 }}>
                {boton("−", -0.1, ret <= 0, L.menos)}
                <div data-ciclo="retencion" style={{ minWidth: 58, textAlign: "center", fontSize: 17, fontWeight: 900, color: AGUA, fontFamily: "'Nunito',sans-serif" }}>{kg(ret)} kg</div>
                {boton("+", 0.1, ret >= RETENCION_MAX, L.mas)}
              </div>
            </div>
          </>
        )}
        <div style={{ height: 14, marginTop: 6, textAlign: "right", fontSize: 10.5, color: estado === "guardado" ? T.g2 : T.t3, fontFamily: "'DM Sans',sans-serif" }}>
          {estado === "guardando" ? L.guardando : estado === "guardado" ? L.guardado : ""}
        </div>
        <div style={{ fontSize: 10, color: T.t3, fontFamily: "'DM Sans',sans-serif", lineHeight: 1.5, marginTop: 4 }}>
          {p.origen === "consulta" ? `${L.pieConsulta} ` : ""}{L.pie}
        </div>
      </div>
    </Card>
  );
}
