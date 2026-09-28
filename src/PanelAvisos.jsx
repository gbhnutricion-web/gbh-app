// ═══ 🔔 AVISOS FUERA DE LA APP: las piezas de pantalla (28-sep-2026) ═══════════
// Fase 1 de 07. App GBH/BRIEF_notificaciones.md (MAESTRO-2026-682): avisos LOCALES que
// programa el propio móvil. Aquí solo se pinta; el cálculo es de src/motorAvisos.js y el
// diálogo con el sistema, de src/avisosNativos.js. App.jsx solo enseña estas piezas en la
// app de tienda y con el interruptor del operador encendido (profiles.avisos_activos).
//  · TarjetaPermisoAvisos: la tarjeta propia que va ANTES del diálogo del sistema (iOS solo
//    deja preguntar una vez) — §3.1 y §3.2.
//  · FilaRecordatorios: la fila del perfil que se quitó el 6-ago porque ofrecía algo que no
//    funcionaba; vuelve porque ahora funciona — §3.3.
//  · PanelRecordatorios: un interruptor por tipo y el horario de comidas con dos turnos y el
//    selector «esta semana» — §2-bis.
import React from "react";
import { TOMAS_ORDEN, PREFS_POR_DEFECTO, normHora } from "./motorAvisos";

const TXT = {
  es: {
    cardTit: "¿Te aviso fuera de la app?",
    cardSub: "Tus comidas, tus tomas, el registro del día y el día de pesarte, aunque tengas la app cerrada. Tú eliges cuáles.",
    si: "Sí, avísame", ahoraNo: "Ahora no",
    fila: "Recordatorios", filaOff: "Desactivados", filaSinPermiso: "Sin permiso en el móvil",
    panelTit: "Recordatorios",
    tipos: {
      comidas: ["🍽️", "Comidas", "A la hora de cada comida, con el plato del día"],
      tomas: ["💊", "Suplementos y medicación", "A la hora de cada toma"],
      registro: ["🐑", "Registro del día", "A las 20:00 si te queda algo por marcar, con tu racha si la tienes"],
      pesaje: ["⚖️", "Pesaje", "Miércoles y fin de semana, si aún no te has pesado"],
      semana: ["🗓️", "Semana nueva", "Los lunes, cuando ya puedes generar tu semana"],
    },
    registroDentro: "Con los avisos de comida, va dentro del de la última comida",
    horarioTit: "Tu horario de comidas", semana: "Esta semana voy de", manana: "☀️ Mañana", tarde: "🌙 Tarde",
    horarioAyuda: "Solo salen las comidas de tu plan. Deja en blanco las que no quieras que te avisen.",
    sinHora: "sin aviso",
    sinPlan: "Cuando tengas tu plan, aquí saldrán tus comidas para ponerles hora.",
    denegado: "Las notificaciones de GBH están desactivadas en tu móvil. Actívalas en Ajustes › GBH Nutrición › Notificaciones y vuelve aquí.",
    pedir: "Activar notificaciones",
    pie: "Los avisos se preparan en tu móvil para los 3 días siguientes cada vez que abres la app. Si pasas unos días sin abrirla, dejan de sonar solos.",
    listo: "Listo",
    nombres: { Desayuno: "Desayuno", Almuerzo: "Almuerzo", Comida: "Comida", Merienda: "Merienda", Cena: "Cena" },
  },
  en: {
    cardTit: "Want reminders outside the app?",
    cardSub: "Your meals, your supplements, your daily log and weigh-in day, even with the app closed. You choose which ones.",
    si: "Yes, remind me", ahoraNo: "Not now",
    fila: "Reminders", filaOff: "Off", filaSinPermiso: "No permission on this phone",
    panelTit: "Reminders",
    tipos: {
      comidas: ["🍽️", "Meals", "At each meal time, with the dish of the day"],
      tomas: ["💊", "Supplements and medication", "At the time of each dose"],
      registro: ["🐑", "Daily log", "At 20:00 if something is still to log, with your streak if you have one"],
      pesaje: ["⚖️", "Weigh-in", "Wednesday and weekend, if you haven't weighed in yet"],
      semana: ["🗓️", "New week", "On Mondays, when you can generate your week"],
    },
    registroDentro: "With meal reminders, it goes inside the last meal's one",
    horarioTit: "Your meal times", semana: "This week I'm on", manana: "☀️ Morning", tarde: "🌙 Afternoon",
    horarioAyuda: "Only the meals in your plan show up. Leave blank the ones you don't want a reminder for.",
    sinHora: "no reminder",
    sinPlan: "Once you have your plan, your meals will show up here so you can set their times.",
    denegado: "GBH notifications are off on this phone. Turn them on in Settings › GBH Nutrición › Notifications and come back.",
    pedir: "Turn on notifications",
    pie: "Reminders are prepared on your phone for the next 3 days every time you open the app. If you don't open it for a few days, they stop by themselves.",
    listo: "Done",
    nombres: { Desayuno: "Breakfast", Almuerzo: "Morning snack", Comida: "Lunch", Merienda: "Afternoon snack", Cena: "Dinner" },
  },
};
const tx = (lang) => TXT[lang === "en" ? "en" : "es"];
const TIPOS_UI = ["comidas", "tomas", "registro", "pesaje", "semana"];
// «Semana nueva» solo tiene sentido con el candado semanal del estándar.
const tiposDe = (esEstandar) => TIPOS_UI.filter((k) => k !== "semana" || esEstandar);

export function TarjetaPermisoAvisos({ lang = "es", T, onSi, onAhoraNo }) {
  const s = tx(lang);
  return (
    <div data-avisos="tarjeta" style={{ margin: "10px 16px", background: "rgba(77,201,122,0.10)", border: `2px solid ${T.g2}66`,
                  borderRadius: 18, padding: "14px 14px 12px" }}>
      <div style={{ display: "flex", gap: 12, alignItems: "flex-start" }}>
        <div style={{ fontSize: 28, lineHeight: 1 }}>🔔</div>
        <div style={{ flex: 1, minWidth: 0 }}>
          <div style={{ fontWeight: 900, fontSize: 15, color: T.t1, fontFamily: "'Nunito',sans-serif" }}>{s.cardTit}</div>
          <div style={{ fontSize: 12.5, color: T.t2, fontFamily: "'DM Sans',sans-serif", marginTop: 4, lineHeight: 1.45 }}>{s.cardSub}</div>
        </div>
      </div>
      <div style={{ display: "flex", gap: 8, marginTop: 12 }}>
        <button onClick={onSi} style={{ flex: 1, background: `linear-gradient(135deg,${T.g1},${T.g2})`, border: "none", borderRadius: 12,
          padding: "11px 12px", color: "#fff", fontWeight: 900, fontSize: 14, cursor: "pointer", boxShadow: `0 3px 0 ${T.g3}`,
          fontFamily: "'Nunito',sans-serif" }}>{s.si}</button>
        <button onClick={onAhoraNo} style={{ background: "rgba(255,255,255,0.06)", border: "1.5px solid rgba(255,255,255,0.16)",
          borderRadius: 12, padding: "11px 14px", color: T.t2, fontWeight: 800, fontSize: 13, cursor: "pointer",
          fontFamily: "'Nunito',sans-serif" }}>{s.ahoraNo}</button>
      </div>
    </div>
  );
}

export function FilaRecordatorios({ lang = "es", T, prefs, permiso, onAbrir, esEstandar = false }) {
  const s = tx(lang);
  const p = { ...PREFS_POR_DEFECTO, ...(prefs || {}) };
  const activos = tiposDe(esEstandar).filter((k) => p[k]).map((k) => s.tipos[k][1].toLowerCase());
  const sub = permiso === "denied" ? s.filaSinPermiso : (permiso !== "granted" || !activos.length) ? s.filaOff : activos.join(" · ");
  return (
    <button data-avisos="fila" onClick={onAbrir} style={{ width: "100%", display: "flex", alignItems: "center", gap: 10,
      background: "transparent", border: "none", borderTop: "1px solid rgba(255,255,255,0.08)", padding: "12px 0",
      cursor: "pointer", textAlign: "left" }}>
      <span style={{ fontSize: 20 }}>🔔</span>
      <span style={{ flex: 1, minWidth: 0 }}>
        <span style={{ display: "block", fontSize: 14, fontWeight: 800, color: T.t1, fontFamily: "'DM Sans',sans-serif" }}>{s.fila}</span>
        <span style={{ display: "block", fontSize: 11, color: T.t2, fontFamily: "'DM Sans',sans-serif", marginTop: 2 }}>{sub}</span>
      </span>
      <span style={{ color: T.t2, fontSize: 18, fontWeight: 900 }}>›</span>
    </button>
  );
}

function Interruptor({ on, onClick, T, label }) {
  return (
    <button role="switch" aria-checked={!!on} aria-label={label} onClick={onClick}
      style={{ width: 46, height: 26, borderRadius: 13, border: "none", padding: 0, cursor: "pointer", flexShrink: 0,
               position: "relative", background: on ? T.g2 : "rgba(255,255,255,0.18)", transition: "background .2s" }}>
      <span style={{ position: "absolute", top: 3, left: on ? 23 : 3, width: 20, height: 20, borderRadius: 10,
                     background: "#fff", transition: "left .2s", boxShadow: "0 1px 3px rgba(0,0,0,0.4)" }} />
    </button>
  );
}

// prefs y horario llegan de App.jsx (profiles.avisos); onCambiar({prefs}) u onCambiar({horario})
// devuelve el trozo nuevo y App.jsx lo guarda y reprograma.
export function PanelRecordatorios({ lang = "es", T, prefs, horario, permiso, tomasPlan, onCambiar, onPedirPermiso, onCerrar, sfx, esEstandar = false }) {
  const s = tx(lang);
  const p = { ...PREFS_POR_DEFECTO, ...(prefs || {}) };
  const h = { turno: "manana", manana: {}, tarde: {}, ...(horario || {}) };
  const turno = h.turno === "tarde" ? "tarde" : "manana";
  // Solo las comidas que el plan del paciente tiene (2, 3, 4 o 5; medido el 28-sep: 11 pacientes con 5,
  // 7 con 4, 2 con 3 y 1 con 2). Sin plan no hay comidas que avisar, así que no se piden horas.
  const tomas = (tomasPlan || []).filter((tm) => TOMAS_ORDEN.includes(tm));
  const cambiarPref = (k) => { sfx && sfx("tap"); onCambiar && onCambiar({ prefs: { ...p, [k]: !p[k] } }); };
  const cambiarTurno = (tn) => { if (tn === turno) return; sfx && sfx("tap"); onCambiar && onCambiar({ horario: { ...h, turno: tn } }); };
  const cambiarHora = (tm, v) => {
    const nuevo = { ...(h[turno] || {}) };
    const n = normHora(v);
    if (n) nuevo[tm] = n; else delete nuevo[tm];
    onCambiar && onCambiar({ horario: { ...h, [turno]: nuevo } });
  };
  const caja = { background: "rgba(255,255,255,0.05)", border: "1.5px solid rgba(255,255,255,0.10)", borderRadius: 16, padding: "4px 14px" };
  return (
    <div data-avisos="panel" onClick={onCerrar} style={{ position: "fixed", inset: 0, zIndex: 460, background: "rgba(0,0,0,0.72)",
      display: "flex", alignItems: "flex-end", justifyContent: "center" }}>
      <div onClick={(ev) => ev.stopPropagation()} style={{ width: "100%", maxWidth: 480, maxHeight: "88vh", overflowY: "auto",
        background: T.bg, borderRadius: "22px 22px 0 0", border: "2px solid rgba(255,255,255,0.10)", borderBottom: "none",
        padding: "18px 16px calc(18px + env(safe-area-inset-bottom))", boxSizing: "border-box" }}>
        <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 12 }}>
          <span style={{ fontSize: 24 }}>🔔</span>
          <span style={{ flex: 1, fontWeight: 900, fontSize: 19, color: T.t1, fontFamily: "'Nunito',sans-serif" }}>{s.panelTit}</span>
          <button onClick={onCerrar} aria-label={s.listo} style={{ background: "none", border: "none", color: T.t2, fontSize: 22, cursor: "pointer" }}>✕</button>
        </div>

        {permiso !== "granted" && (
          <div style={{ ...caja, padding: "12px 14px", marginBottom: 12, borderColor: `${T.au1}66` }}>
            {permiso === "denied"
              ? <div style={{ fontSize: 13, color: T.t1, fontFamily: "'DM Sans',sans-serif", lineHeight: 1.5 }}>{s.denegado}</div>
              : <button onClick={onPedirPermiso} style={{ width: "100%", background: `linear-gradient(135deg,${T.g1},${T.g2})`, border: "none",
                  borderRadius: 12, padding: "11px 12px", color: "#fff", fontWeight: 900, fontSize: 14, cursor: "pointer",
                  fontFamily: "'Nunito',sans-serif" }}>{s.pedir}</button>}
          </div>
        )}

        <div style={caja}>
          {tiposDe(esEstandar).map((k, i) => {
            const [ic, tit, sub] = s.tipos[k];
            const nota = k === "registro" && p.comidas ? s.registroDentro : sub;
            return (
              <div key={k} data-tipo={k} style={{ display: "flex", alignItems: "center", gap: 12, padding: "12px 0",
                borderTop: i ? "1px solid rgba(255,255,255,0.07)" : "none" }}>
                <span style={{ fontSize: 22, width: 26, textAlign: "center" }}>{ic}</span>
                <span style={{ flex: 1, minWidth: 0 }}>
                  <span style={{ display: "block", fontSize: 14, fontWeight: 800, color: T.t1, fontFamily: "'DM Sans',sans-serif" }}>{tit}</span>
                  <span style={{ display: "block", fontSize: 11.5, color: T.t2, fontFamily: "'DM Sans',sans-serif", marginTop: 2, lineHeight: 1.35 }}>{nota}</span>
                </span>
                <Interruptor on={p[k]} T={T} label={tit} onClick={() => cambiarPref(k)} />
              </div>
            );
          })}
        </div>

        {p.comidas && (
          <div data-avisos="horario" style={{ ...caja, marginTop: 12, padding: "12px 14px" }}>
            <div style={{ fontWeight: 900, fontSize: 15, color: T.t1, fontFamily: "'Nunito',sans-serif" }}>{s.horarioTit}</div>
            <div style={{ fontSize: 12, color: T.t2, fontFamily: "'DM Sans',sans-serif", margin: "8px 0 6px" }}>{s.semana}</div>
            <div style={{ display: "flex", gap: 8, marginBottom: 10 }}>
              {["manana", "tarde"].map((tn) => (
                <button key={tn} data-turno={tn} onClick={() => cambiarTurno(tn)} style={{ flex: 1, borderRadius: 12, padding: "9px 8px",
                  cursor: "pointer", fontWeight: 900, fontSize: 13, fontFamily: "'Nunito',sans-serif",
                  background: turno === tn ? `${T.g2}33` : "rgba(255,255,255,0.05)",
                  border: `2px solid ${turno === tn ? T.g2 : "rgba(255,255,255,0.12)"}`, color: turno === tn ? T.t1 : T.t2 }}>
                  {tn === "manana" ? s.manana : s.tarde}
                </button>
              ))}
            </div>
            {!tomas.length && (
              <div data-avisos="sin-plan" style={{ fontSize: 13, color: T.t2, fontFamily: "'DM Sans',sans-serif", lineHeight: 1.5, padding: "4px 0" }}>{s.sinPlan}</div>
            )}
            {tomas.map((tm) => {
              const hora = (h[turno] && h[turno][tm]) || "";
              return (
                <label key={tm} style={{ display: "flex", alignItems: "center", gap: 10, padding: "6px 0" }}>
                  <span style={{ flex: 1, fontSize: 14, color: T.t1, fontFamily: "'DM Sans',sans-serif" }}>
                    {s.nombres[tm]}
                    {!hora && <span style={{ fontSize: 11, color: T.t3, marginLeft: 6 }}>· {s.sinHora}</span>}
                  </span>
                  <input type="time" data-toma={tm} value={hora} onChange={(ev) => cambiarHora(tm, ev.target.value)}
                    style={{ background: "rgba(255,255,255,0.08)", border: "1.5px solid rgba(255,255,255,0.18)", borderRadius: 10,
                             color: T.t1, padding: "7px 10px", fontSize: 15, fontFamily: "'DM Sans',sans-serif", colorScheme: "dark" }} />
                </label>
              );
            })}
            {!!tomas.length && <div style={{ fontSize: 11.5, color: T.t2, fontFamily: "'DM Sans',sans-serif", marginTop: 6, lineHeight: 1.4 }}>{s.horarioAyuda}</div>}
          </div>
        )}

        <div style={{ fontSize: 11.5, color: T.t2, fontFamily: "'DM Sans',sans-serif", margin: "12px 2px 14px", lineHeight: 1.45 }}>{s.pie}</div>
        <button onClick={onCerrar} style={{ width: "100%", background: "rgba(255,255,255,0.08)", border: "1.5px solid rgba(255,255,255,0.18)",
          borderRadius: 14, padding: "12px", color: T.t1, fontWeight: 900, fontSize: 15, cursor: "pointer",
          fontFamily: "'Nunito',sans-serif" }}>{s.listo}</button>
      </div>
    </div>
  );
}
