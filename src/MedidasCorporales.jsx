// ═══ MEDIDAS CORPORALES ═══════════════════════════════════════════════════════
// Sección «Medidas corporales» de la pestaña Medidas (antes «Peso»).
// Silueta por sexo dividida en zonas, cada zona coloreada ENTERA según su
// medida contra la toma anterior (menor = verde, igual = amarillo, mayor =
// rojo: el criterio de la hoja «Análisis Corporal»). Dos pestañas: perímetros
// (cintura, cadera, brazo, pierna → ICA / ICC) y pliegues (los 7 de
// Jackson-Pollock → suma, % graso estimado, kg de grasa).
//
// Datos: tabla `body_measurements`, una fila por (perfil, fecha, origen).
//   origen = 'casa'     → la registra el paciente aquí (pliegues con DOBLE toma:
//                         cada pliegue dos veces; si difieren > 1 mm se repite).
//   origen = 'consulta' → la sube el nutricionista tras la consulta
//                         (hacer_evaluacion_consulta.py --subir).
//
// Todo lo que este módulo necesita de App.jsx llega por props (sbReq, T, Card,
// sfx): así App.jsx solo cambia en tres líneas y este fichero se puede leer
// entero de una vez. Maqueta aprobada por Alejandro el 5-sep-2026
// (07. App GBH/MAQUETA_medidas_corporales_2026-09-05.html).
import React, { useState, useEffect, useMemo } from "react";

const PER = ["cintura", "cadera", "brazo", "muslo"];
const PLI = ["pectoral", "midaxilar", "triceps", "subescapular", "abdominal", "suprailiaco", "muslo_pl"];
const TOL_MM = 1;   // dos tomas del mismo pliegue deben coincidir a ±1 mm

const TXT = {
  es: {
    peso: "Peso corporal", cuerpo: "Medidas corporales",
    per: "Perímetros", pli: "Pliegues",
    cintura: "Cintura", cadera: "Cadera", brazo: "Brazo", muslo: "Pierna",
    pectoral: "Pectoral", midaxilar: "Midaxilar", triceps: "Tríceps", subescapular: "Subescapular",
    abdominal: "Abdominal", suprailiaco: "Suprailíaco", muslo_pl: "Muslo",
    baja: "Baja", igual: "Igual", sube: "Sube", vsAnt: "vs toma anterior",
    toca: "Toca una zona para ver su comparación", partida: "punto de partida",
    sinTomas: "Aún no tienes medidas registradas.", sinTomasDesc: "Mídete en casa o espera a la próxima consulta: la primera toma es tu línea de salida.",
    cargando: "Cargando medidas…",
    ica: "Cintura ÷ altura", icaX: "No depende del peso: sirve aunque la báscula esté quieta. Referencia: por debajo de 0,50.",
    icc: "Cintura ÷ cadera", iccX: "Dice dónde se reparte la grasa, no cuánta hay. Acompaña al ICA, nunca lo sustituye.",
    balance: "Balance de contornos", bajan: "cm que bajan", suben: "cm que suben",
    balanceX: "Los contornos no distinguen grasa de músculo: se leen junto al pliegue de la misma zona.",
    suma: "Suma de 7 pliegues", sumaX: "Es el dato sólido: sale directo del plicómetro. Bajar 1 mm en un pliegue es real; subir 1 mm en uno solo está en el margen de la medición.",
    grasa: "Grasa estimada", grasaX: "Estimación (Jackson-Pollock 7 pliegues + Siri). Error de ±3-4 puntos: vale para comparar dos tomas, no como cifra exacta.",
    reparto: "Reparto del peso", kgGrasa: "kg grasa", kgResto: "kg resto", repartoX: "El «resto» es músculo, hueso, órganos y agua. Es la parte sobre la que se trabaja.",
    antes: "antes", puntos: "puntos", faltaAltura: "Añade tu altura en el perfil para calcular el ICA.",
    faltaSexoEdad: "La estimación de grasa necesita tu sexo y tu edad: rellénalos en la calculadora de Objetivo.",
    tomas: "Tomas registradas", consulta: "En consulta", casa: "En casa",
    regPer: "📏 Registrar perímetros de hoy", regPli: "📏 Registrar pliegues (doble toma)",
    ayudaPer: "Cinta métrica, sin apretar. Se comparan con tu toma anterior.",
    ayudaPli: "Mide cada pliegue dos veces, soltando el plicómetro entre una y otra.",
    ayudaPliOk: "Las dos tomas coinciden en todos los pliegues: se guarda la media.",
    ayudaPliMal: "Algún pliegue no coincide. Repítelo; si no lo consigues, se queda sin registrar y lo mide el nutricionista en consulta.",
    dosTomas: "dos tomas", difieren: "difieren", repite: "repite",
    cancelar: "Cancelar", guardar: "✅ Guardar toma", guardado: "Toma guardada", errorGuardar: "No se pudo guardar. Comprueba la conexión.",
    consejo: "Si te mides en casa, hazlo siempre igual: misma hora, mismo lado, la misma persona midiendo.",
    hoy: "hoy",
  },
  en: {
    peso: "Body weight", cuerpo: "Body measurements",
    per: "Girths", pli: "Skinfolds",
    cintura: "Waist", cadera: "Hips", brazo: "Arm", muslo: "Leg",
    pectoral: "Chest", midaxilar: "Midaxillary", triceps: "Triceps", subescapular: "Subscapular",
    abdominal: "Abdominal", suprailiaco: "Suprailiac", muslo_pl: "Thigh",
    baja: "Down", igual: "Same", sube: "Up", vsAnt: "vs previous take",
    toca: "Tap a zone to see its comparison", partida: "starting point",
    sinTomas: "No measurements yet.", sinTomasDesc: "Measure at home or wait for your next visit: the first take is your starting line.",
    cargando: "Loading measurements…",
    ica: "Waist ÷ height", icaX: "Independent of weight: useful even when the scale is flat. Reference: below 0.50.",
    icc: "Waist ÷ hips", iccX: "Tells where fat sits, not how much. Goes with the WHtR, never replaces it.",
    balance: "Girth balance", bajan: "cm down", suben: "cm up",
    balanceX: "Girths don't separate fat from muscle: read them next to the skinfold of the same area.",
    suma: "Sum of 7 skinfolds", sumaX: "The solid number: straight from the caliper. 1 mm down in a fold is real; 1 mm up in a single fold is within measurement error.",
    grasa: "Estimated body fat", grasaX: "Estimate (Jackson-Pollock 7-site + Siri). ±3-4 points error: for comparing takes, not an exact figure.",
    reparto: "Weight split", kgGrasa: "kg fat", kgResto: "kg rest", repartoX: "The «rest» is muscle, bone, organs and water. That's the part we work on.",
    antes: "before", puntos: "pts", faltaAltura: "Add your height in your profile to get the WHtR.",
    faltaSexoEdad: "Body-fat estimate needs your sex and age: fill them in the Goal calculator.",
    tomas: "Recorded takes", consulta: "At the clinic", casa: "At home",
    regPer: "📏 Record today's girths", regPli: "📏 Record skinfolds (double take)",
    ayudaPer: "Tape measure, no squeezing. Compared with your previous take.",
    ayudaPli: "Measure each fold twice, releasing the caliper in between.",
    ayudaPliOk: "Both takes match on every fold: the average is saved.",
    ayudaPliMal: "A fold doesn't match. Repeat it; if it won't match, it stays unrecorded and your nutritionist measures it at the clinic.",
    dosTomas: "two takes", difieren: "differ by", repite: "repeat",
    cancelar: "Cancel", guardar: "✅ Save take", guardado: "Take saved", errorGuardar: "Couldn't save. Check your connection.",
    consejo: "If you measure at home, always do it the same way: same time, same side, same person measuring.",
    hoy: "today",
  },
};

// ── Silueta: media figura (offsets desde el eje x=150), espejada y suavizada.
//    Un tercer valor 1 marca una ESQUINA (axila, entrepierna, pulgar). Canon de
//    8 cabezas: entrepierna a media altura (314 de 640). ──
const MEDIA = {
  M: [[0,8],[14,9],[23,20],[27,40],[26,62],[20,80],[12,90],[12,96],[13,110],[28,114],[48,120],[66,128],[80,140],[88,158],[90,182],[92,210],[92,250],[96,282],[92,318],[86,342],[90,360],[88,380],[80,394],[70,392],[68,372],[62,350,1],[70,340],[74,300],[76,255],[74,215],[60,166,1],[57,185],[52,215],[45,240],[48,265],[55,295],[57,320],[56,350],[52,400],[43,455],[44,470],[45,505],[36,545],[26,590],[28,606],[34,624],[44,636,1],[18,638,1],[14,612],[14,590],[13,540],[12,505],[12,455],[14,400],[10,340],[0,314,1]],
  F: [[0,10],[13,11],[21,22],[25,42],[24,64],[18,82],[10,92],[11,98],[12,110],[24,114],[42,120],[58,128],[70,140],[77,158],[78,182],[82,210],[84,250],[88,282],[86,318],[82,342],[86,360],[84,380],[76,394],[66,392],[64,372],[58,350,1],[66,340],[70,300],[70,255],[66,215],[54,172,1],[50,192],[45,214],[36,240],[40,265],[54,290],[58,315],[57,345],[52,400],[40,455],[41,470],[42,505],[33,545],[24,590],[26,606],[32,624],[42,636,1],[18,638,1],[14,612],[14,590],[12,540],[11,505],[12,455],[13,400],[9,340],[0,316,1]],
};
// Cortes por sexo: x de la axila (brazo/torso) y alturas de las bandas.
const CORTES = {
  M: { brazo: 210, hombro: 112, pecho: 150, abd: 205, cintura: 215, cadera: 262, pierna: 312 },
  F: { brazo: 204, hombro: 112, pecho: 150, abd: 210, cintura: 218, cadera: 262, pierna: 314 },
};
const contornoDe = (sx) => {
  const half = MEDIA[sx].map(q => [150 + q[0], q[1], q[2] || 0]);
  const pts = half.slice();
  for (let i = half.length - 2; i >= 1; i--) pts.push([300 - half[i][0], half[i][1], half[i][2]]);
  const n = pts.length;
  let d = "M" + pts[0][0] + " " + pts[0][1];
  for (let j = 0; j < n; j++) {
    const p0 = pts[(j - 1 + n) % n], p1 = pts[j], p2 = pts[(j + 1) % n], p3 = pts[(j + 2) % n];
    const c1x = p1[2] ? p1[0] : p1[0] + (p2[0] - p0[0]) / 6, c1y = p1[2] ? p1[1] : p1[1] + (p2[1] - p0[1]) / 6;
    const c2x = p2[2] ? p2[0] : p2[0] - (p3[0] - p1[0]) / 6, c2y = p2[2] ? p2[1] : p2[1] - (p3[1] - p1[1]) / 6;
    d += " C" + c1x.toFixed(1) + " " + c1y.toFixed(1) + " " + c2x.toFixed(1) + " " + c2y.toFixed(1) + " " + p2[0] + " " + p2[1];
  }
  return d + " Z";
};
const CONTORNO = { M: contornoDe("M"), F: contornoDe("F") };

// % graso: Jackson-Pollock de 7 pliegues (densidad) + Siri. ESTIMACIÓN ±3-4 puntos.
const grasaJP7 = (suma, edad, sexo) => {
  if (!suma || !edad || (sexo !== "M" && sexo !== "F")) return null;
  const d = sexo === "F"
    ? 1.097 - 0.00046971 * suma + 0.00000056 * suma * suma - 0.00012828 * edad
    : 1.112 - 0.00043499 * suma + 0.00000055 * suma * suma - 0.00028826 * edad;
  return 495 / d - 450;
};
const AGE_MID = { "18-25": 21, "26-35": 30, "36-45": 40, "46-55": 50, "56-65": 60, "65+": 70 };
const fmt = (n, dec = 0) => (n == null || isNaN(n)) ? "—" : Number(n).toFixed(dec).replace(".", ",");
const fechaCorta = (iso, lang) => {
  if (!iso) return "";
  const [y, m, d] = iso.split("-").map(Number);
  const ms = lang === "en" ? ["Jan","Feb","Mar","Apr","May","Jun","Jul","Aug","Sep","Oct","Nov","Dec"] : ["ene","feb","mar","abr","may","jun","jul","ago","sep","oct","nov","dic"];
  return d + " " + ms[(m || 1) - 1];
};
const hoyISO = () => { const d = new Date(); return d.getFullYear() + "-" + String(d.getMonth() + 1).padStart(2, "0") + "-" + String(d.getDate()).padStart(2, "0"); };

// ── Selector de vista (Peso corporal / Medidas corporales) ──
export function SelectorMedidas({ vista, setVista, lang, T }) {
  const L = TXT[lang === "en" ? "en" : "es"];
  const btn = (id, icon, label) => {
    const on = vista === id;
    return (
      <button key={id} onClick={() => setVista(id)} aria-pressed={on} style={{
        flex: 1, fontFamily: "'Nunito',sans-serif", fontWeight: 900, fontSize: 13, padding: "12px 8px", borderRadius: 16, cursor: "pointer",
        border: `2.5px solid ${on ? T.au1 : "rgba(255,255,255,0.10)"}`, background: on ? "rgba(201,162,39,0.12)" : "rgba(255,255,255,0.04)",
        color: on ? T.t1 : T.t2, display: "flex", flexDirection: "column", alignItems: "center", gap: 3,
        boxShadow: on ? "0 4px 0 rgba(201,162,39,0.35)" : "none", transition: "all .15s",
      }}>
        <span style={{ fontSize: 22, filter: on ? "none" : "grayscale(0.6)" }}>{icon}</span>{label}
      </button>
    );
  };
  return <div style={{ display: "flex", gap: 8, marginBottom: 14 }}>{btn("peso", "⚖️", L.peso)}{btn("cuerpo", "📏", L.cuerpo)}</div>;
}

// ── La sección ──
export function MedidasCorporales({ profile, weights, lang, sfx, sbReq, T, Card }) {
  const L = TXT[lang === "en" ? "en" : "es"];
  const [tomas, setTomas] = useState(null);      // null = cargando
  const [tab, setTab] = useState("per");
  const [sel, setSel] = useState(null);
  const [reg, setReg] = useState(false);
  const [form, setForm] = useState({});
  const [aviso, setAviso] = useState("");
  const [guardando, setGuardando] = useState(false);

  const sexo = profile?.sex === "F" ? "F" : "M";
  const sexoConocido = profile?.sex === "M" || profile?.sex === "F";
  const edad = AGE_MID[profile?.age_range] || null;
  const altura = Number(profile?.height_cm) || null;
  const peso = useMemo(() => {
    const ws = (weights || []).filter(w => w && w.date && w.weight).slice().sort((a, b) => a.date > b.date ? 1 : -1);
    return ws.length ? Number(ws[ws.length - 1].weight) : (Number(profile?.initial_weight) || null);
  }, [weights, profile]);

  const cargar = async () => {
    if (!profile?.id) return;
    const r = await sbReq("GET", `body_measurements?profile_id=eq.${profile.id}&select=*&order=fecha.asc,created_at.asc`);
    setTomas(Array.isArray(r) ? r : []);
  };
  useEffect(() => { setTomas(null); cargar(); }, [profile?.id]);   // eslint-disable-line react-hooks/exhaustive-deps

  // Tomas con datos del grupo activo: la última es «actual», la previa «anterior».
  const campos = tab === "per" ? PER : PLI;
  const serie = useMemo(() => (tomas || []).filter(t => campos.some(k => t[k] != null)), [tomas, campos]);
  const act = serie.length ? serie[serie.length - 1] : null;
  const ant = serie.length > 1 ? serie[serie.length - 2] : null;
  const unica = !!act && !ant;

  const OK = T.g1, EQ = T.au2, BAD = T.red, NEU = "rgba(255,255,255,0.10)";
  const estado = (k) => {
    if (!act || act[k] == null || !ant || ant[k] == null) return null;
    const a = Number(ant[k]), b = Number(act[k]);
    return b < a ? OK : (b > a ? BAD : EQ);
  };
  const colorZona = (k) => (act && act[k] != null) ? (estado(k) || T.g3) : NEU;

  // ── Silueta ──
  const C = CORTES[sexo];
  const clipId = `mcClip-${sexo}`;
  const rect = (x1, y1, x2, y2) => `${x1},${y1} ${x2},${y1} ${x2},${y2} ${x1},${y2}`;
  const R = C.brazo, xl = 300 - C.brazo;
  const zonas = [];
  const zona = (k, poly) => zonas.push({ k, poly });
  zona(null, rect(0, 0, 300, C.hombro));
  if (tab === "per") {
    zona("brazo", rect(R, C.hombro - 8, 300, 500)); zona("brazo", rect(0, C.hombro - 8, xl, 500));
    zona(null, rect(xl, C.hombro, R, C.cintura));
    zona("cintura", rect(xl, C.cintura, R, C.cadera));
    zona("cadera", rect(xl, C.cadera, R, C.pierna));
    zona("muslo", rect(0, C.pierna, 300, 640));
  } else {
    zona("triceps", rect(R, C.hombro - 8, 300, 500)); zona("triceps", rect(0, C.hombro - 8, xl, 500));
    zona("subescapular", rect(xl, C.hombro, R, C.pecho));
    zona("pectoral", rect(116, C.pecho, 184, C.abd));
    zona("midaxilar", rect(xl, C.pecho, 116, C.cadera)); zona("midaxilar", rect(184, C.pecho, R, C.cadera));
    zona("abdominal", rect(116, C.abd, 184, C.cadera));
    zona("suprailiaco", rect(xl, C.cadera, R, C.pierna));
    zona("muslo_pl", rect(0, C.pierna, 300, 640));
  }
  const pick = (k) => { if (!k) return; sfx && sfx("tap"); setSel(sel === k ? null : k); };

  // ── KPIs ──
  const unidad = tab === "per" ? "cm" : "mm";
  const kpi = (lab, val, uni, nota, ok) => (
    <div key={lab} style={{ background: ok ? "rgba(45,155,90,0.10)" : "rgba(255,255,255,0.05)", border: `2px solid ${ok ? "rgba(45,155,90,0.55)" : "rgba(255,255,255,0.10)"}`, borderRadius: 18, padding: "14px 12px 12px", textAlign: "center" }}>
      <div style={{ fontSize: 10.5, color: T.t2, textTransform: "uppercase", letterSpacing: ".1em", fontFamily: "'DM Sans',sans-serif" }}>{lab}</div>
      <div style={{ fontSize: 34, fontWeight: 900, lineHeight: 1.05, marginTop: 4, color: T.t1, fontVariantNumeric: "tabular-nums" }}>{val}</div>
      <div style={{ fontSize: 11, color: T.t2, fontFamily: "'DM Sans',sans-serif", marginTop: 3 }}>{uni}</div>
      <div style={{ fontSize: 11, color: T.t2, fontFamily: "'DM Sans',sans-serif", marginTop: 8, lineHeight: 1.4, textAlign: "left", borderTop: "1px solid rgba(255,255,255,0.10)", paddingTop: 8 }}>{nota}</div>
    </div>
  );
  const kpis = [];
  if (act && tab === "per") {
    const ci = Number(act.cintura) || null, ca = Number(act.cadera) || null;
    if (ci && altura) {
      const ica = ci / altura, icaAnt = (ant && ant.cintura) ? Number(ant.cintura) / altura : null;
      kpis.push(kpi(L.ica, fmt(ica, 2), `${fmt(ci, 0)} cm ÷ ${altura} cm${icaAnt ? ` · ${L.antes} ${fmt(icaAnt, 2)}` : ""}`, L.icaX, ica < 0.5));
    } else if (ci) kpis.push(kpi(L.ica, "—", "", L.faltaAltura, false));
    if (ci && ca) kpis.push(kpi(L.icc, fmt(ci / ca, 2), `${fmt(ci, 0)} cm ÷ ${fmt(ca, 0)} cm`, L.iccX, false));
    if (ant) {
      let baja = 0, sube = 0;
      PER.forEach(k => { if (act[k] != null && ant[k] != null) { const d = Number(act[k]) - Number(ant[k]); if (d < 0) baja -= d; if (d > 0) sube += d; } });
      kpis.push(kpi(L.balance, `−${fmt(baja, 0)} · +${fmt(sube, 0)}`, `${L.bajan} · ${L.suben}`, L.balanceX, baja >= sube && baja > 0));
    }
  }
  if (act && tab === "pli") {
    const completo = (t) => PLI.every(k => t && t[k] != null);
    const sb = completo(act) ? PLI.reduce((s, k) => s + Number(act[k]), 0) : null;
    const sa = ant && completo(ant) ? PLI.reduce((s, k) => s + Number(ant[k]), 0) : null;
    kpis.push(kpi(L.suma, sb != null ? fmt(sb, 0) : "—", sb != null ? `mm${sa != null ? ` · ${L.antes} ${fmt(sa, 0)} mm · ${sb - sa > 0 ? "+" : ""}${fmt(sb - sa, 0)}` : ` · ${L.partida}`}` : "", L.sumaX, sa != null && sb < sa));
    const gb = grasaJP7(sb, edad, sexoConocido ? sexo : null), ga = grasaJP7(sa, edad, sexoConocido ? sexo : null);
    if (gb != null) {
      kpis.push(kpi(L.grasa, `${fmt(gb, 1)} %`, ga != null ? `${L.antes} ${fmt(ga, 1)} % · ${gb - ga > 0 ? "+" : "−"}${fmt(Math.abs(gb - ga), 1)} ${L.puntos}` : L.partida, L.grasaX, ga != null && gb < ga));
      if (peso) kpis.push(kpi(L.reparto, `${fmt(peso * gb / 100, 1)} / ${fmt(peso - peso * gb / 100, 1)}`, `${L.kgGrasa} · ${L.kgResto}`, L.repartoX, false));
    } else if (sb != null) kpis.push(kpi(L.grasa, "—", "", L.faltaSexoEdad, false));
  }

  // ── Registro ──
  const abrirRegistro = () => {
    sfx && sfx("tap");
    const f = {};
    if (tab === "per") PER.forEach(k => { f[k] = ""; });
    else PLI.forEach(k => { f[k + "_1"] = ""; f[k + "_2"] = ""; });
    setForm(f); setAviso(""); setReg(true);
  };
  const validarPli = () => {
    let ok = true, alguna = false; const out = {};
    PLI.forEach(k => {
      const a = parseFloat(form[k + "_1"]), b = parseFloat(form[k + "_2"]);
      if (isNaN(a) && isNaN(b)) return;
      alguna = true;
      if (isNaN(a) || isNaN(b) || Math.abs(a - b) > TOL_MM) ok = false;
      else out[k] = Math.round((a + b) / 2);
    });
    return { ok: ok && alguna, out, alguna };
  };
  const filaPli = (k) => {
    const a = parseFloat(form[k + "_1"]), b = parseFloat(form[k + "_2"]);
    let msg = L.dosTomas, col = T.t3;
    if (!isNaN(a) && !isNaN(b)) { if (Math.abs(a - b) <= TOL_MM) { msg = "✓ " + fmt((a + b) / 2, 1) + " mm"; col = OK; } else { msg = `✗ ${L.difieren} ${fmt(Math.abs(a - b), 0)} mm · ${L.repite}`; col = BAD; } }
    const inp = (suf, ph) => (
      <input type="number" inputMode="numeric" step="1" placeholder={ph} value={form[k + suf] ?? ""} aria-label={`${L[k]} ${ph}`}
        onChange={e => setForm({ ...form, [k + suf]: e.target.value })}
        style={{ width: "100%", font: "700 14px 'Nunito',sans-serif", color: T.t1, background: "rgba(255,255,255,0.06)", border: "2px solid rgba(255,255,255,0.10)", borderRadius: 10, padding: "7px 6px", textAlign: "center" }} />
    );
    return (
      <div key={k} style={{ display: "grid", gridTemplateColumns: "1fr 54px 54px 92px", gap: 6, alignItems: "center", fontFamily: "'DM Sans',sans-serif", fontSize: 12 }}>
        <span style={{ color: T.t2 }}>{L[k]}</span>{inp("_1", "1ª")}{inp("_2", "2ª")}
        <span style={{ fontSize: 11, textAlign: "right", whiteSpace: "nowrap", color: col }}>{msg}</span>
      </div>
    );
  };
  const puedeGuardar = tab === "per" ? PER.some(k => !isNaN(parseFloat(form[k]))) : validarPli().ok;
  const guardar = async () => {
    if (!profile?.id || guardando) return;
    const fila = { profile_id: profile.id, fecha: hoyISO(), origen: "casa" };
    if (tab === "per") PER.forEach(k => { const v = parseFloat(String(form[k]).replace(",", ".")); if (!isNaN(v) && v > 0) fila[k] = Math.round(v * 10) / 10; });
    else { const { out } = validarPli(); Object.assign(fila, out); }
    setGuardando(true);
    const r = await sbReq("POST", "body_measurements?on_conflict=profile_id,fecha,origen", fila);
    setGuardando(false);
    if (r) { sfx && sfx("success"); setAviso(L.guardado); setReg(false); setSel(null); await cargar(); }
    else setAviso(L.errorGuardar);
  };

  // ── Render ──
  const tabBtn = (id, label) => (
    <button key={id} onClick={() => { sfx && sfx("tap"); setTab(id); setSel(null); setReg(false); }} aria-selected={tab === id} role="tab" style={{
      flex: 1, fontFamily: "'Nunito',sans-serif", fontWeight: 900, fontSize: 13, padding: 9, border: "none", borderRadius: 11, cursor: "pointer",
      background: tab === id ? T.g3 : "transparent", color: tab === id ? "#fff" : T.t2, boxShadow: tab === id ? "0 3px 0 rgba(0,0,0,0.35)" : "none",
    }}>{label}</button>
  );
  const leyendaItem = (col, txt) => <span key={txt} style={{ display: "flex", alignItems: "center", gap: 5 }}><i style={{ width: 10, height: 10, borderRadius: 3, background: col, display: "inline-block" }} />{txt}</span>;

  return (
    <>
      <Card>
        <div role="tablist" style={{ display: "flex", gap: 6, background: "rgba(0,0,0,0.25)", padding: 4, borderRadius: 14 }}>{tabBtn("per", L.per)}{tabBtn("pli", L.pli)}</div>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginTop: 10, fontSize: 11, color: T.t2, fontFamily: "'DM Sans',sans-serif" }}>
          <div>{act ? <><b style={{ color: T.t1 }}>{fechaCorta(act.fecha, lang)}</b>{ant ? ` vs ${fechaCorta(ant.fecha, lang)}` : ` · ${L.partida}`}</> : (tomas === null ? L.cargando : L.sinTomas)}</div>
          {!sexoConocido && <span style={{ color: T.t3 }}>♂/♀ {L.faltaSexoEdad.split(":")[0]}</span>}
        </div>
        <div style={{ display: "grid", gridTemplateColumns: "minmax(0,1fr) 132px", gap: 10, alignItems: "center", marginTop: 6 }}>
          <svg viewBox="0 0 300 640" role="img" aria-label={L.cuerpo} style={{ width: "100%", maxWidth: 200, height: "auto", display: "block", margin: "0 auto" }}>
            <defs><clipPath id={clipId}><path d={CONTORNO[sexo]} /></clipPath></defs>
            {zonas.map((z, i) => {
              const on = z.k && sel === z.k;
              return <polygon key={i} points={z.poly} clipPath={`url(#${clipId})`} fill={z.k ? colorZona(z.k) : NEU}
                opacity={z.k ? ((sel && sel !== z.k) ? 0.38 : 0.92) : 1} stroke={on ? "#fff" : "rgba(6,14,9,0.55)"} strokeWidth={on ? 3 : 1.6}
                style={{ cursor: z.k ? "pointer" : "default" }} onClick={() => pick(z.k)} />;
            })}
            <path d={CONTORNO[sexo]} fill="none" stroke="rgba(255,255,255,0.5)" strokeWidth="1.3" style={{ pointerEvents: "none" }} />
          </svg>
          <div style={{ display: "flex", flexDirection: "column", gap: 6, fontFamily: "'DM Sans',sans-serif" }}>
            {campos.map(k => {
              const c = colorZona(k), on = sel === k;
              const v = act && act[k] != null ? Number(act[k]) : null;
              const d = (v != null && ant && ant[k] != null) ? v - Number(ant[k]) : null;
              const flecha = d == null ? "" : (d < 0 ? "▼" : (d > 0 ? "▲" : "="));
              return (
                <div key={k} role="button" tabIndex={0} aria-pressed={on} onClick={() => pick(k)} onKeyDown={e => { if (e.key === "Enter" || e.key === " ") { e.preventDefault(); pick(k); } }}
                  style={{ display: "grid", gridTemplateColumns: "8px 1fr auto", gap: 7, alignItems: "center", padding: "6px 8px", borderRadius: 10, cursor: "pointer", fontSize: 11.5,
                    border: `1.5px solid ${on ? c : "transparent"}`, background: on ? c + "22" : "rgba(255,255,255,0.04)", boxShadow: on ? `0 0 0 2px ${c}55, 0 0 14px ${c}66` : "none", transition: "box-shadow .15s, background .15s" }}>
                  <i style={{ width: 8, height: 8, borderRadius: "50%", background: c, display: "block" }} />
                  <span style={{ color: on ? "#fff" : T.t2, fontWeight: on ? 700 : 400 }}>{L[k]}</span>
                  <span style={{ fontWeight: 700, color: T.t1, whiteSpace: "nowrap", fontVariantNumeric: "tabular-nums" }}>{v != null ? fmt(v, tab === "per" ? 0 : 0) : "—"} <small style={{ color: T.t3, fontWeight: 500 }}>{unidad} {flecha}{d ? fmt(Math.abs(d), 0) : ""}</small></span>
                </div>
              );
            })}
          </div>
        </div>
        <div style={{ display: "flex", gap: 12, justifyContent: "center", fontSize: 10.5, color: T.t2, fontFamily: "'DM Sans',sans-serif", marginTop: 8 }}>
          {leyendaItem(OK, L.baja)}{leyendaItem(EQ, L.igual)}{leyendaItem(BAD, L.sube)}<span style={{ color: T.t3 }}>· {L.vsAnt}</span>
        </div>
        <div style={{ marginTop: 8, padding: "10px 12px", borderRadius: 12, background: "rgba(255,255,255,0.05)", fontFamily: "'DM Sans',sans-serif", fontSize: 12, color: T.t2, display: "flex", justifyContent: "space-between", alignItems: "center", gap: 8 }}>
          {sel && act && act[sel] != null ? (
            <><span>{L[sel]} · {ant && ant[sel] != null ? `${fechaCorta(ant.fecha, lang)} → ` : ""}{fechaCorta(act.fecha, lang)}</span>
              <b style={{ color: estado(sel) || T.t1, fontSize: 16, fontVariantNumeric: "tabular-nums" }}>{ant && ant[sel] != null ? `${fmt(ant[sel], 0)} → ` : ""}{fmt(act[sel], 0)} {unidad}</b></>
          ) : <><span>{act ? L.toca : L.sinTomasDesc}</span><b style={{ color: "rgba(255,255,255,0.4)" }}>—</b></>}
        </div>
      </Card>

      {kpis.length > 0 && <div style={{ display: "grid", gridTemplateColumns: kpis.length === 1 ? "1fr" : "1fr 1fr", gap: 10, marginBottom: 14 }}>{kpis}</div>}

      <Card>
        <div style={{ fontSize: 11, color: T.au1, textTransform: "uppercase", letterSpacing: ".1em", fontWeight: 900 }}>{L.tomas}</div>
        <div style={{ display: "flex", gap: 6, flexWrap: "wrap", fontFamily: "'DM Sans',sans-serif", fontSize: 11, margin: "10px 0" }}>
          {(tomas || []).slice(-6).reverse().map(t => (
            <span key={t.id} style={{ padding: "5px 9px", borderRadius: 999, border: `1.5px solid ${t.origen === "consulta" ? "rgba(201,162,39,0.5)" : "rgba(28,176,246,0.5)"}`, color: t.origen === "consulta" ? T.au2 : "#7CD0FF" }}>
              {t.origen === "consulta" ? "🩺 " + L.consulta : "🏠 " + L.casa} · {fechaCorta(t.fecha, lang)}
            </span>
          ))}
          {tomas && tomas.length === 0 && <span style={{ color: T.t3 }}>{L.sinTomas}</span>}
        </div>
        {!reg && (
          <button onClick={abrirRegistro} style={{ width: "100%", fontFamily: "'Nunito',sans-serif", fontWeight: 900, fontSize: 15, padding: 14, borderRadius: 16, border: `3px solid ${T.g3}`, background: `linear-gradient(135deg,${T.g1},${T.g2})`, color: "#fff", cursor: "pointer", boxShadow: `0 5px 0 ${T.g3}` }}>
            {tab === "per" ? L.regPer : L.regPli}
          </button>
        )}
        {reg && (
          <div style={{ background: "rgba(0,0,0,0.22)", borderRadius: 16, padding: "12px 12px 14px" }}>
            <div style={{ fontSize: 12, color: T.t2, fontFamily: "'DM Sans',sans-serif", marginBottom: 10 }}>
              {tab === "per" ? L.ayudaPer : (validarPli().ok ? L.ayudaPliOk : (validarPli().alguna ? L.ayudaPliMal : L.ayudaPli))}
            </div>
            {tab === "per" ? (
              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 8, marginBottom: 10 }}>
                {PER.map(k => (
                  <label key={k} style={{ display: "flex", flexDirection: "column", gap: 3, fontFamily: "'DM Sans',sans-serif", fontSize: 11, color: T.t2 }}>
                    {L[k]} (cm)
                    <input type="number" inputMode="decimal" step="0.5" value={form[k] ?? ""} placeholder={act && act[k] != null ? String(act[k]) : ""}
                      onChange={e => setForm({ ...form, [k]: e.target.value })}
                      style={{ font: "700 16px 'Nunito',sans-serif", color: T.t1, background: "rgba(255,255,255,0.06)", border: "2px solid rgba(255,255,255,0.10)", borderRadius: 12, padding: "9px 10px", width: "100%" }} />
                  </label>
                ))}
              </div>
            ) : (
              <div style={{ display: "flex", flexDirection: "column", gap: 5, marginBottom: 10 }}>{PLI.map(filaPli)}</div>
            )}
            <div style={{ display: "flex", gap: 8 }}>
              <button onClick={() => { sfx && sfx("tap"); setReg(false); }} style={{ flex: 1, fontFamily: "'Nunito',sans-serif", fontWeight: 900, fontSize: 14, padding: 12, borderRadius: 14, cursor: "pointer", border: "2px solid rgba(255,255,255,0.10)", background: "transparent", color: T.t2 }}>{L.cancelar}</button>
              <button onClick={guardar} disabled={!puedeGuardar || guardando} style={{ flex: 1.4, fontFamily: "'Nunito',sans-serif", fontWeight: 900, fontSize: 14, padding: 12, borderRadius: 14, cursor: puedeGuardar ? "pointer" : "not-allowed", opacity: puedeGuardar ? 1 : 0.5, border: `3px solid ${T.g3}`, background: `linear-gradient(135deg,${T.g1},${T.g2})`, color: "#fff", boxShadow: `0 4px 0 ${T.g3}` }}>{L.guardar}</button>
            </div>
          </div>
        )}
        {aviso && <div style={{ marginTop: 8, fontSize: 12, color: aviso === L.guardado ? T.g2 : T.red, fontFamily: "'DM Sans',sans-serif", fontWeight: 700 }}>{aviso}</div>}
        <div style={{ fontSize: 11, color: T.t2, fontFamily: "'DM Sans',sans-serif", lineHeight: 1.45, marginTop: 10 }}>{L.consejo}</div>
      </Card>
    </>
  );
}
