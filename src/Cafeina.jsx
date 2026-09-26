// ═══ CAFEÍNA: tu dosis, a qué hora y cuánto te dura (fase 1, 25-sep-2026) ═══
// La pantalla de la maqueta aprobada para probar (07. App GBH/MAQUETA_calculadora_cafeina_2026-09-24.html)
// sobre el MISMO motor (src/motorCafeina.js, copia exacta de 07. App GBH/cafeina.js: se comprueba con md5).
// ⚠️ El motor NO se llama cafeina.js en src/ (26-sep): en un disco que no distingue mayúsculas (el Mac de
// Codemagic, Windows), `import ... from "./Cafeina"` encontraba antes cafeina.js que Cafeina.jsx y la
// compilación de las apps fallaba (#31 y #34), aunque en Vercel (Linux) compilaba. Ver comprobar_mayusculas.py.
//
// Lo que la app ya sabe NO se pregunta (orden de Alejandro, 24-sep): el peso sale del último pesaje
// (weights = weight_logs) o del de alta (profiles.initial_weight); el sexo y la altura, de profiles; los
// anticonceptivos y las interacciones, de la medicación del plan (suplPlan = normSupl de
// plan_json.suplementacion en premium o de patient_config.suplementacion en estándar).
// Lo que la app no sabe (tolerancia, tabaco, forma de tomarla, con comida) se pregunta una vez y se
// guarda SOLO en el teléfono (localStorage). Las respuestas de salud del cribado no se guardan en
// ningún sitio: viven lo que dura la pantalla.
//
// A propósito, este módulo NO recibe sbReq: no puede hacer ninguna llamada a Supabase (listón de la
// fase 1: 0 llamadas con las respuestas de salud). Los textos viven en TRANS de App.jsx (claves caf*),
// y llegan por la función t(). Pendiente de FASE 2 (PEND-2026-279, pregunta 2): la casilla
// «anticonceptivo hormonal» en el alta o el perfil; hasta entonces se leen de la medicación.
import React, { useState, useEffect, useMemo, useRef } from "react";
import { FORMAS, FUENTES, perfilDesdeApp, pesoParaCalculo, cribado, recomendar, comparaNormal, bandas,
         concentracion, curva, equivalencias } from "./motorCafeina";

const DUR = { concentracion: [1, 2, 3, 4, 6], rendimiento: [1, 1.5, 2, 3] };
const OTRAS = [0, 80, 160, 240];
const SALUD = ["embarazo", "menor", "corazon", "ansiedad", "higado", "reaccion"];
const SALUD_X = { corazon: "cafCorazonX", reaccion: "cafReaccionX" };
const SALUD_TXT = { embarazo: "cafEmbarazo", menor: "cafMenor", corazon: "cafCorazon", ansiedad: "cafAnsiedad", higado: "cafHigado", reaccion: "cafReaccion" };
const TOL = [["sensible", "cafTolSensible", "cafTolSensibleX"], ["normal", "cafTolNormal", "cafTolNormalX"], ["tolerante", "cafTolTolerante", "cafTolToleranteX"]];
const FORMA_TXT = { cafe: "cafFormaCafe", capsula: "cafFormaCapsula", chicle: "cafFormaChicle", energetica: "cafFormaEnergetica" };
const BEBIDA_TXT = { cafe_filtro: "cafEqCafeFiltro", espresso: "cafEqEspresso", energetica: "cafEqEnergetica" };
const UNIDAD_TXT = { capsula_200: "cafEqCapsula200", capsula_100: "cafEqCapsula100", chicle_100: "cafEqChicle100" };
const ZONAS = [{ id: "nada", k: "cafZonaNada", col: "rgba(255,255,255,.18)" }, { id: "efecto", k: "cafZonaEfecto", col: "#2D9B5A" },
               { id: "pleno", k: "cafZonaPleno", col: "#E0B94B" }, { id: "nervios", k: "cafZonaNervios", col: "#FF4B4B" }];
const HABITOS_DEF = { tolerancia: "normal", fumador: false, forma: "cafe", comida: false };
const claveHabitos = (id) => `gbh:cafeina:${id || "anon"}`;

function leerHabitos(id) {
  try { const v = JSON.parse(localStorage.getItem(claveHabitos(id)) || "null"); return v && typeof v === "object" ? { ...HABITOS_DEF, ...v, _guardado: true } : { ...HABITOS_DEF, _guardado: false }; }
  catch { return { ...HABITOS_DEF, _guardado: false }; }
}
function guardarHabitos(id, h) {
  try { localStorage.setItem(claveHabitos(id), JSON.stringify({ tolerancia: h.tolerancia, fumador: !!h.fumador, forma: h.forma, comida: !!h.comida })); } catch {}
}

const hm = (h) => { h = ((h % 24) + 24) % 24; let H = Math.floor(h + 1e-9), m = Math.round((h - H) * 60); if (m === 60) { H = (H + 1) % 24; m = 0; } return H + ":" + (m < 10 ? "0" : "") + m; };
const dur = (h) => { let H = Math.floor(h + 1e-9), m = Math.round((h - H) * 60); if (m === 60) { H++; m = 0; } return H ? H + " h" + (m ? " " + (m < 10 ? "0" : "") + m + " min" : "") : m + " min"; };
const durTxt = (h) => (h < 0.05 ? "0 min" : dur(h));
const aHoras = (s) => { const p = (s || "0:0").split(":"); return (+p[0] || 0) + (+p[1] || 0) / 60; };
const aInput = (h) => { const x = hm(h).split(":"); return (x[0].length < 2 ? "0" : "") + x[0] + ":" + x[1]; };
// «**negrita**» en los textos de TRANS → <b>
const rico = (s) => String(s).split("**").map((p, i) => (i % 2 ? <b key={i}>{p}</b> : <React.Fragment key={i}>{p}</React.Fragment>));

export function Cafeina({ profile, weights, medicacion, lang = "es", t, T, sfx, onClose }) {
  const en = lang === "en";
  const nf = (v, d) => (en ? v.toFixed(d) : v.toFixed(d).replace(".", ","));
  const [habitos, setHabitos] = useState(() => leerHabitos(profile?.id));
  const [salud, setSalud] = useState({ embarazo: false, menor: false, corazon: false, ansiedad: false, higado: false, reaccion: false });
  const [saludAbierta, setSaludAbierta] = useState(false);
  const [verFuentes, setVerFuentes] = useState(false);
  const [objetivo, setObjetivo] = useState("concentracion");
  const [inicio, setInicio] = useState(10);
  const [duracion, setDuracion] = useState(3);
  const [dormir, setDormir] = useState(23.5);
  const [otrasHoy, setOtrasHoy] = useState(0);
  const [mgProbada, setMgProbada] = useState(null);
  const [scrub, setScrub] = useState(null);          // null = en el pico
  const [ancho, setAncho] = useState(0);
  const graf = useRef(null), resRef = useRef(null);

  const cambiaHabito = (k, v) => {
    const h = { ...habitos, [k]: v, _guardado: true };
    setHabitos(h); guardarHabitos(profile?.id, h); setMgProbada(null);
  };
  const tap = () => { try { sfx && sfx("tap"); } catch {} };

  // ── Del registro de la app al perfil del motor ──
  const med = Array.isArray(medicacion) ? medicacion : [];
  const app = useMemo(() => perfilDesdeApp({
    sexo: profile?.sex === "M" || profile?.sex === "F" ? profile.sex : null,
    alturaCm: profile?.height_cm ?? null,
    registrosPeso: (weights || []).map((w) => ({ log_date: w.date ?? w.log_date, weight_kg: w.weight ?? w.weight_kg })),
    pesoInicial: profile?.initial_weight ?? null,
    medicacion: med,
  }, habitos), [profile?.sex, profile?.height_cm, profile?.initial_weight, weights, medicacion, habitos]);

  const calc = useMemo(() => {
    const cr = cribado(salud, app.datos);
    if (cr.bloquea) return { tipo: "bloq", cr };
    if (app.perfil.peso == null) return { tipo: "sinPeso" };
    const pet = { objetivo, inicio, duracion, dormir, otrasHoy };
    const rec = recomendar(app.perfil, pet), cmp = comparaNormal(app.perfil, pet);
    const res = mgProbada != null && rec.mg ? recomendar(app.perfil, { ...pet, mg: mgProbada }) : rec;
    if (!res.mg) return { tipo: "servido" };
    // La gráfica sigue 2 h después de acostarse (antes, 45 min): así la zona de noche se ve (26-sep).
    const desde = res.tToma - 0.5, hasta = Math.max(res.sueno ? res.sueno.dormir + 2 : 0, res.tToma + 12);
    const band = bandas(app.perfil, res.tomas, { desde, hasta, paso: (hasta - desde) / 120, n: 300 });
    return { tipo: "ok", rec, cmp, res, desde, hasta, band };
  }, [app, salud, objetivo, inicio, duracion, dormir, otrasHoy, mgProbada]);

  useEffect(() => { setScrub(null); }, [calc]);
  useEffect(() => { if (calc.tipo === "bloq") setSaludAbierta(true); }, [calc.tipo]);
  useEffect(() => {
    const f = () => { const r = graf.current && graf.current.getBoundingClientRect(); setAncho(r ? r.width : 0); };
    f(); window.addEventListener("resize", f); return () => window.removeEventListener("resize", f);
  }, [calc.tipo]);

  const res = calc.tipo === "ok" ? calc.res : null;
  const scrubT = res ? (scrub == null ? res.pico.t : calc.desde + (scrub / 1000) * (calc.hasta - calc.desde)) : 0;

  // ── Gráfica (canvas) ──
  useEffect(() => {
    const cv = graf.current; if (!cv || !res) return;
    const r = cv.getBoundingClientRect(), d = Math.min(window.devicePixelRatio || 1, 2), w = r.width, h = r.height; if (!w) return;
    cv.width = Math.round(w * d); cv.height = Math.round(h * d);
    const c = cv.getContext("2d"); c.setTransform(d, 0, 0, d, 0, 0); c.clearRect(0, 0, w, h);
    const { desde, hasta, band } = calc, U = res.umbrales;
    let ymax = 0; band.forEach((b) => { ymax = Math.max(ymax, b.p90); });
    // Las dos líneas de efecto se ven siempre (orden de Alejandro, 26-sep), así que la escala llega hasta la más alta.
    ymax = Math.max(ymax * 1.08, U.concentracion * 1.25, U.rendimiento * 1.2, 1);
    const m = { i: 30, d: 8, a: 10, b: 22 }, pw = w - m.i - m.d, ph = h - m.a - m.b;
    const X = (tt) => m.i + pw * (tt - desde) / (hasta - desde), Y = (v) => m.a + ph * (1 - v / ymax);
    const rend = res.objetivo === "rendimiento";
    // Día y noche (orden de Alejandro, 26-sep): hasta la hora de acostarse, fondo anaranjado; desde ella, azul
    // oscuro. Su ☀️ y su 🌙 van arriba a la izquierda de cada zona y se pintan al final, encima de la curva.
    const xNoche = res.sueno ? Math.min(Math.max(X(res.sueno.dormir), m.i), w - m.d) : w - m.d;
    c.fillStyle = "rgba(255,122,24,.20)"; c.fillRect(m.i, m.a, xNoche - m.i, ph);
    if (xNoche < w - m.d) { c.fillStyle = "rgba(14,30,92,.62)"; c.fillRect(xNoche, m.a, w - m.d - xNoche, ph); }
    c.fillStyle = rend ? "rgba(224,185,75,.10)" : "rgba(77,201,122,.10)";
    c.fillRect(X(res.inicio), m.a, X(res.inicio + res.duracion) - X(res.inicio), ph);
    c.fillStyle = "rgba(255,255,255,.45)"; c.font = "800 9.5px Nunito, sans-serif"; c.textAlign = "center";
    // El rótulo de la franja baja una línea cuando chocaría con el ☀️ de la esquina.
    const txtFranja = t(rend ? "cafObjEntreno" : "cafObjTiempo"), xFranja = (X(res.inicio) + X(res.inicio + res.duracion)) / 2;
    c.fillText(txtFranja, xFranja, xFranja - c.measureText(txtFranja).width / 2 < m.i + 24 ? m.a + 27 : m.a + 11);
    c.strokeStyle = "rgba(255,255,255,.07)"; c.lineWidth = 1; c.fillStyle = "rgba(255,255,255,.45)"; c.font = "500 9.5px 'DM Sans', sans-serif";
    const pasoY = ymax > 12 ? 4 : ymax > 6 ? 2 : 1;
    for (let v = 0; v <= ymax; v += pasoY) { c.beginPath(); c.moveTo(m.i, Y(v)); c.lineTo(w - m.d, Y(v)); c.stroke(); c.textAlign = "right"; c.fillText(v, m.i - 5, Y(v) + 3); }
    c.textAlign = "center"; const pasoX = (hasta - desde) > 14 ? 3 : 2;
    for (let tt = Math.ceil(desde / pasoX) * pasoX; tt <= hasta; tt += pasoX) c.fillText(hm(tt), X(tt), h - 6);
    c.fillStyle = "rgba(224,185,75,.16)"; c.beginPath();
    band.forEach((b, i) => { if (i) c.lineTo(X(b.t), Y(b.p90)); else c.moveTo(X(b.t), Y(b.p90)); });
    for (let i = band.length - 1; i >= 0; i--) c.lineTo(X(band[i].t), Y(band[i].p10)); c.closePath(); c.fill();
    // Umbral: línea discontinua con su rótulo. «tenue» = la del objetivo que no se ha elegido.
    const linea = (val, col, txt, tenue) => { if (val > ymax) return; c.save(); c.globalAlpha = tenue ? 0.5 : 1; c.strokeStyle = col; c.lineWidth = tenue ? 1 : 1.4; c.setLineDash([4, 4]); c.beginPath(); c.moveTo(m.i, Y(val)); c.lineTo(w - m.d, Y(val)); c.stroke();
      c.fillStyle = col; c.textAlign = "right"; c.font = "800 9px Nunito, sans-serif"; c.fillText(txt, w - m.d - 2, Y(val) - 3); c.restore(); };
    // Las dos líneas de efecto, sea cual sea el objetivo: la del elegido, marcada; la otra, tenue.
    linea(U.concentracion, "#4DC97A", t("cafLineaConc") + " " + nf(U.concentracion, 1), rend);
    linea(U.rendimiento, "#E0B94B", t("cafLineaRend") + " " + nf(U.rendimiento, 1), !rend);
    linea(U.nervios, "#FF6B6B", t("cafLineaNervios") + " " + nf(U.nervios, 0));
    const cur = curva(res.tomas, res.pk, { desde, hasta, paso: (hasta - desde) / 240 });
    c.save(); c.shadowColor = "#E0B94B"; c.shadowBlur = 10; c.strokeStyle = "#E0B94B"; c.lineWidth = 2.4; c.lineJoin = "round"; c.beginPath();
    cur.forEach((p, i) => { if (i) c.lineTo(X(p.t), Y(p.c)); else c.moveTo(X(p.t), Y(p.c)); }); c.stroke(); c.restore();
    // ☕ en cada toma, abajo. ☀️ y 🌙, arriba a la izquierda del día y de la noche, sin línea de ir a dormir
    // (órdenes de Alejandro, 26-sep). Lo que queda en sangre al acostarse lo dice el aviso de sueño, debajo.
    c.font = "13px sans-serif"; c.textAlign = "center"; res.tomas.forEach((dd) => { c.fillText("☕", X(dd.t), m.a + ph - 4); });
    c.textAlign = "left"; c.fillText("☀️", m.i + 4, m.a + 15);
    if (xNoche < w - m.d - 18) c.fillText("🌙", xNoche + 4, m.a + 15);
    const xk = X(scrubT), ck = concentracion(scrubT, res.tomas, res.pk);
    c.strokeStyle = "rgba(255,255,255,.55)"; c.setLineDash([2, 3]); c.beginPath(); c.moveTo(xk, m.a); c.lineTo(xk, m.a + ph); c.stroke(); c.setLineDash([]);
    c.fillStyle = "#fff"; c.beginPath(); c.arc(xk, Y(ck), 4, 0, Math.PI * 2); c.fill();
  }, [calc, scrubT, ancho, lang]);

  // ── Textos que dependen del cálculo ──
  const equivPartes = (mg) => equivalencias(mg, habitos.forma).filter((x) => x.ml || x.n >= 0.5).slice(0, 2).map((x) => {
    if (x.ml) return { cant: x.ml + " mL", txt: t(BEBIDA_TXT[x.id]) };
    const n = x.n === 0.5 ? "½" : x.n % 1 ? Math.floor(x.n) + "½" : String(x.n), nombres = t(UNIDAD_TXT[x.id]);
    return { cant: n, txt: Array.isArray(nombres) ? nombres[x.n <= 1 ? 0 : 1] : nombres };
  });
  const equivPlano = (mg) => { const e = equivPartes(mg); return e.length ? "≈ " + e.map((x) => x.cant + " " + x.txt).join(" · ") : ""; };
  const fecha = (iso) => { const p = (iso || "").split("-"), M = t("cafMeses"); return p.length === 3 && Array.isArray(M) ? (+p[2]) + "-" + M[+p[1] - 1] : iso; };
  const zona = (cc) => { const U = res.umbrales, u = U[res.objetivo]; return cc >= U.nervios ? ZONAS[3] : cc >= u * 1.5 ? ZONAS[2] : cc >= u ? ZONAS[1] : ZONAS[0]; };
  const corto = (f) => (en ? f.corto.replace(/ y cols\./, " et al.").replace(/ y /, " and ").replace("Consenso del COI", "IOC consensus") : f.corto);

  // ── Estilos (la paleta de la app; los de la maqueta, con prefijo caf-) ──
  const css = `
  .caf{font-family:'Nunito',sans-serif;color:${T.t1}}
  .caf *{box-sizing:border-box}
  .caf-card{background:rgba(255,255,255,.04);border:1.5px solid rgba(255,255,255,.10);border-radius:16px;padding:12px;margin-bottom:10px}
  .caf-card.oro{border-color:rgba(201,162,39,.55);background:linear-gradient(180deg,rgba(201,162,39,.10),rgba(255,255,255,.03))}
  .caf-tit{font-size:11px;color:${T.au1};font-weight:900;text-transform:uppercase;letter-spacing:.08em;margin-bottom:8px;display:flex;justify-content:space-between;align-items:center;gap:8px}
  .caf-tit small{text-transform:none;letter-spacing:0;color:${T.t3};font:500 10.5px 'DM Sans',sans-serif}
  .caf-fila{display:flex;align-items:center;justify-content:space-between;gap:10px;padding:6px 0;border-top:1px solid rgba(255,255,255,.10);font-size:12.5px;font-weight:800}
  .caf-fila small,.caf-dato small,.caf-chk small{display:block;font:500 10.5px 'DM Sans',sans-serif;color:${T.t3}}
  .caf-sum{list-style:none;cursor:pointer;display:flex;justify-content:space-between;align-items:center;gap:8px}
  .caf-sum::-webkit-details-marker{display:none}
  .caf-est{font:800 11.5px 'Nunito',sans-serif;color:${T.g2};white-space:nowrap}
  .caf-est.alerta{color:#FF8A8A}
  .caf-sn{display:inline-flex;gap:3px;background:rgba(0,0,0,.25);padding:3px;border-radius:10px;flex-shrink:0}
  .caf-sn button{font:900 11.5px 'Nunito',sans-serif;padding:6px 11px;border:none;border-radius:8px;background:transparent;color:${T.t2};cursor:pointer}
  .caf-sn button.on{background:${T.g3};color:#fff}
  .caf-sn button.on.si{background:#8a2e2e}
  .caf-dato{display:flex;align-items:center;gap:10px;padding:7px 0;border-top:1px solid rgba(255,255,255,.10)}
  .caf-dato.primero{border-top:none;padding-top:0}
  .caf-ic{width:34px;height:34px;border-radius:11px;display:grid;place-items:center;background:rgba(255,255,255,.06);font-size:17px;flex-shrink:0}
  .caf-tx{flex:1;min-width:0;font-size:12.5px;font-weight:800;overflow-wrap:anywhere}
  .caf-tx b{color:#FF8A8A}
  .caf-val{font-size:18px;font-weight:900;white-space:nowrap}
  .caf-val small{font-size:11px;color:${T.t2};font-weight:800}
  .caf-tol{display:grid;grid-template-columns:repeat(3,minmax(0,1fr));gap:6px;margin-top:8px}
  .caf-obj{display:grid;grid-template-columns:minmax(0,1fr) minmax(0,1fr);gap:6px;margin-bottom:6px}
  .caf-tol button,.caf-obj button{text-align:left;padding:9px;border-radius:13px;border:1.5px solid rgba(255,255,255,.10);background:rgba(255,255,255,.04);color:${T.t1};cursor:pointer;font-family:'Nunito',sans-serif;min-width:0}
  .caf-obj button{font-size:18px}
  .caf-tol button b,.caf-obj button b{display:block;font-size:12.5px;font-weight:900}
  .caf-tol button small,.caf-obj button small{display:block;font:500 10.5px 'DM Sans',sans-serif;color:${T.t2};line-height:1.3;margin-top:2px}
  .caf-tol button.on,.caf-obj button.on{border-color:${T.au1};background:rgba(201,162,39,.12);box-shadow:0 0 0 1px ${T.au1} inset}
  .caf-chk{display:flex;align-items:center;gap:10px;font-size:12.5px;font-weight:800;padding:6px 2px;cursor:pointer}
  .caf-chk input{width:20px;height:20px;accent-color:${T.g1}}
  .caf-nota{font:500 10.5px 'DM Sans',sans-serif;color:${T.t3};margin-top:4px}
  .caf-linea{display:flex;align-items:center;justify-content:space-between;gap:8px;padding:7px 0;border-top:1px solid rgba(255,255,255,.10);font-size:12.5px;font-weight:800;flex-wrap:wrap}
  .caf-linea input[type=time]{font:900 15px 'Nunito',sans-serif;color:${T.t1};background:rgba(255,255,255,.06);border:2px solid rgba(255,255,255,.10);border-radius:11px;padding:5px 8px;color-scheme:dark}
  .caf-chips{display:flex;gap:4px;flex-wrap:wrap}
  .caf-chips button{font:800 11.5px 'Nunito',sans-serif;padding:6px 9px;border-radius:9px;border:1.5px solid rgba(255,255,255,.14);background:transparent;color:${T.t2};cursor:pointer}
  .caf-chips button.on{border-color:${T.au1};color:${T.au2};background:rgba(201,162,39,.12)}
  .caf button:focus-visible,.caf input:focus-visible{outline:2px solid ${T.au2};outline-offset:2px}
  .caf-pildora{position:sticky;top:0;z-index:3;display:flex;align-items:center;gap:8px;width:100%;text-align:left;padding:9px 12px;border-radius:14px;border:1.5px solid rgba(201,162,39,.6);background:rgba(18,34,24,.96);color:${T.t1};font:800 12.5px 'Nunito',sans-serif;cursor:pointer;box-shadow:0 6px 18px rgba(0,0,0,.35);margin-bottom:10px}
  .caf-pildora b{font-size:15px;font-weight:900;color:${T.au2}}
  .caf-pildora small{margin-left:auto;font:500 10.5px 'DM Sans',sans-serif;color:${T.t3};white-space:nowrap}
  .caf-dosis{display:flex;align-items:baseline;gap:8px;flex-wrap:wrap}
  .caf-dosis b{font-size:46px;font-weight:900;line-height:1;color:#fff;text-shadow:0 0 18px rgba(224,185,75,.45);font-variant-numeric:tabular-nums}
  .caf-dosis span{font-size:16px;font-weight:900;color:${T.au2}}
  .caf-dosis em{font-style:normal;font:500 12px 'DM Sans',sans-serif;color:${T.t2};margin-left:auto}
  .caf-equiv{font:500 12px 'DM Sans',sans-serif;color:${T.t2};margin-top:4px}
  .caf-equiv b{color:${T.t1};font-weight:700}
  .caf-pasos{display:flex;flex-direction:column;gap:5px;margin:10px 0 8px;font-size:13px;font-weight:800}
  .caf-pasos>div{display:flex;gap:8px;align-items:baseline}
  .caf-pasos small{font:500 11px 'DM Sans',sans-serif;color:${T.t2}}
  .caf-graf{display:block;width:100%;height:210px;border-radius:12px;background:rgba(0,0,0,.25);margin-top:6px}
  .caf-scrub{width:100%;margin:10px 0 2px;accent-color:${T.au1}}
  .caf-lectura{display:flex;align-items:center;gap:8px;font-size:12.5px;font-weight:800;flex-wrap:wrap}
  .caf-zona{font:800 11px 'Nunito',sans-serif;padding:3px 8px;border-radius:999px}
  .caf-termo{position:relative;height:10px;border-radius:6px;margin-top:8px;overflow:hidden;display:flex}
  .caf-termo i{height:100%}
  .caf-aguja{position:absolute;top:-3px;bottom:-3px;width:3px;background:#fff;box-shadow:0 0 8px #fff;border-radius:2px}
  .caf-ley{display:flex;justify-content:space-between;font:500 9.5px 'DM Sans',sans-serif;color:${T.t3};margin-top:3px}
  .caf-sueno{margin-top:10px;padding:9px 10px;border-radius:12px;font-size:12px;font-weight:800;line-height:1.4}
  .caf-sueno.ok{background:rgba(45,155,90,.14);border:1.5px solid rgba(45,155,90,.45)}
  .caf-sueno.mal{background:rgba(28,176,246,.10);border:1.5px solid rgba(28,176,246,.45)}
  .caf-sueno small,.caf-compara small,.caf-bloq small{display:block;font:500 11px 'DM Sans',sans-serif;color:${T.t2};margin-top:2px}
  .caf-compara{margin:2px 0 8px;padding:8px 10px;border-radius:12px;background:rgba(206,130,255,.10);border:1.5px solid rgba(206,130,255,.40);font-size:12px;font-weight:800;line-height:1.4}
  .caf-probar{display:flex;align-items:center;gap:6px;flex-wrap:wrap;margin:8px 0 2px;padding:7px 8px;border-radius:12px;background:rgba(0,0,0,.22);font-size:12px;font-weight:800}
  .caf-probar>span{flex:1 1 100%;font:500 11px 'DM Sans',sans-serif;color:${T.t2}}
  .caf-pm{width:34px;height:34px;border-radius:11px;border:1.5px solid rgba(255,255,255,.16);background:rgba(255,255,255,.05);color:${T.t1};font:900 18px 'Nunito',sans-serif;cursor:pointer}
  .caf-probar output{min-width:74px;text-align:center;font:900 17px 'Nunito',sans-serif}
  .caf-lnk{background:none;border:none;color:${T.au2};font:800 11.5px 'Nunito',sans-serif;cursor:pointer;padding:4px 0;white-space:nowrap}
  .caf-probar .caf-lnk{margin-left:auto;white-space:normal;text-align:right}
  .caf-avisos{margin:10px 0 0;padding:0;list-style:none;display:flex;flex-direction:column;gap:5px}
  .caf-avisos li{font:500 11.5px 'DM Sans',sans-serif;color:${T.t2};padding-left:18px;position:relative}
  .caf-avisos li::before{content:"•";position:absolute;left:6px;color:${T.au2}}
  .caf-avisos li b{color:${T.t1}}
  .caf-bloq{font-size:13.5px;font-weight:800;line-height:1.45}
  .caf-bloq small{font-size:11.5px;margin-top:6px}
  .caf-fuentes{margin:6px 0 0;padding-left:16px;font:500 11px 'DM Sans',sans-serif;color:${T.t2};display:flex;flex-direction:column;gap:4px}
  .caf-fuentes b{color:${T.t1};font-weight:700}
  .caf-legal{font:500 10.5px 'DM Sans',sans-serif;color:${T.t3};text-align:center;margin:2px 8px 0}
  `;

  // ── Bloques de la pantalla ──
  const pintarSalud = () => {
    const bloquea = calc.tipo === "bloq", it = app.datos.interacciones;
    return (
      <details className="caf-card" open={saludAbierta} onToggle={(e) => setSaludAbierta(e.currentTarget.open)}>
        <summary className="caf-sum" style={saludAbierta ? { marginBottom: 6 } : null}>
          <span className="caf-tit" style={{ margin: 0 }}>{t("cafAntes")}</span>
          <span className={"caf-est" + (bloquea ? " alerta" : "")}>{t(bloquea ? "cafSaludMal" : "cafSaludOk")} {saludAbierta ? "▴" : "▾"}</span>
        </summary>
        {SALUD.map((k) => (
          <div className="caf-fila" key={k}>
            <span>{t(SALUD_TXT[k])}{SALUD_X[k] ? <small>{t(SALUD_X[k])}</small> : null}</span>
            <span className="caf-sn">
              <button className={salud[k] ? "" : "on"} onClick={() => { setSalud({ ...salud, [k]: false }); setMgProbada(null); }}>{t("cafNo")}</button>
              <button className={salud[k] ? "on si" : ""} onClick={() => { setSalud({ ...salud, [k]: true }); setMgProbada(null); }}>{t("cafSi")}</button>
            </span>
          </div>
        ))}
        <div className="caf-dato">
          {it.length
            ? <><span className="caf-ic">⚠️</span><span className="caf-tx">{t("cafMedTit")}<small><b>{it.map((x) => x.item).join(", ")}</b>: {t("cafMedMal", { que: t("cafInt_" + it[0].id) })}</small></span></>
            : <><span className="caf-ic">✅</span><span className="caf-tx">{t("cafMedTit")}<small>{med.length ? t("cafMedOkLista", { lista: med.map((x) => x.nombre).join(", ") }) : t("cafMedVacia")}</small></span></>}
        </div>
      </details>
    );
  };

  const pintarTu = () => {
    const pp = app.datos.peso, pc = pesoParaCalculo(app.perfil), ac = app.datos.anticonceptivos;
    return (
      <section className="caf-card">
        <div className="caf-tit">{t("cafTu")} <small>{t("cafTuSub")}</small></div>
        <div className="caf-dato primero">
          <span className="caf-ic">⚖️</span>
          <span className="caf-tx">{t("cafPeso")}<small>{pp.peso == null ? t("cafSinPeso")
            : (pp.origen === "pesaje" ? t("cafPesoPesaje", { f: fecha(pp.fecha) }) : t("cafPesoAlta")) + (pc.ajustado ? t("cafPesoAjustado", { p: nf(pc.peso, 0), imc: nf(pc.imc, 0) }) : "")}</small></span>
          <span className="caf-val">{pp.peso == null ? "—" : nf(pp.peso, 1).replace(/[.,]0$/, "")} <small>kg</small></span>
        </div>
        {ac.estado !== "no_aplica" && (
          <div className="caf-dato">
            <span className="caf-ic">💊</span>
            <span className="caf-tx">{ac.estado === "combinado" ? <>{t("cafAntiComb")}<small>{t("cafAntiCombX", { item: ac.item })}</small></>
              : ac.estado === "solo_gestageno" ? <>{t("cafAntiSolo")}<small>{t("cafAntiSoloX", { item: ac.item })}</small></>
              : <>{t("cafAntiNo")}<small>{t("cafAntiNoX")}</small></>}</span>
          </div>
        )}
        <div className="caf-tol" role="radiogroup" aria-label={t("cafTolAria")}>
          {TOL.map(([id, k, kx]) => (
            <button key={id} role="radio" aria-checked={habitos.tolerancia === id} className={habitos.tolerancia === id ? "on" : ""}
              onClick={() => { tap(); cambiaHabito("tolerancia", id); }}><b>{t(k)}</b><small>{t(kx)}</small></button>
          ))}
        </div>
        <label className="caf-chk" style={{ marginTop: 8 }}>
          <input type="checkbox" checked={!!habitos.fumador} onChange={(e) => cambiaHabito("fumador", e.target.checked)} />
          <span>{t("cafFumo")}<small>{t("cafFumoX")}</small></span>
        </label>
        <div className="caf-nota">{t(habitos._guardado ? "cafGuardadoTel" : "cafUnaVez")}</div>
      </section>
    );
  };

  const chips = (lista, actual, fijar, fmt, aria) => (
    <div className="caf-chips" role="radiogroup" aria-label={aria}>
      {lista.map((v) => (
        <button key={String(v)} role="radio" aria-checked={v === actual} className={v === actual ? "on" : ""} onClick={() => { fijar(v); setMgProbada(null); }}>{fmt(v)}</button>
      ))}
    </div>
  );

  const pintarParaQue = () => (
    <section className="caf-card">
      <div className="caf-tit">{t("cafParaQue")}</div>
      <div className="caf-obj" role="radiogroup" aria-label={t("cafParaQue")}>
        {[["concentracion", "🧠", "cafConc", "cafConcX"], ["rendimiento", "🏋️", "cafRend", "cafRendX"]].map(([id, ic, k, kx]) => (
          <button key={id} role="radio" aria-checked={objetivo === id} className={objetivo === id ? "on" : ""} onClick={() => {
            tap(); setObjetivo(id); setMgProbada(null);
            if (id === "rendimiento" && inicio === 10) setInicio(18);
            if (DUR[id].indexOf(duracion) < 0) setDuracion(id === "rendimiento" ? 1.5 : 3);
          }}>{ic}<b>{t(k)}</b><small>{t(kx)}</small></button>
        ))}
      </div>
      <div className="caf-linea"><span>{t("cafComo")}</span>{chips(FORMAS, habitos.forma, (v) => cambiaHabito("forma", v), (v) => t(FORMA_TXT[v]), t("cafComo"))}</div>
      <label className="caf-chk">
        <input type="checkbox" checked={!!habitos.comida} onChange={(e) => cambiaHabito("comida", e.target.checked)} />
        <span>{t("cafComida")}<small>{t("cafComidaX")}</small></span>
      </label>
      <div className="caf-linea"><label htmlFor="cafInicio">{t("cafDesde")}</label>
        <input type="time" id="cafInicio" step="900" value={aInput(inicio)} onChange={(e) => { if (e.target.value) { setInicio(aHoras(e.target.value)); setMgProbada(null); } }} /></div>
      <div className="caf-linea"><span>{t("cafDurante")}</span>{chips(DUR[objetivo], duracion, setDuracion, (v) => (v === 1.5 ? "1½ h" : v + " h"), t("cafDurante"))}</div>
      <div className="caf-linea"><label htmlFor="cafDormir">{t("cafDormir")}</label>
        <input type="time" id="cafDormir" step="900" value={aInput(dormir)} onChange={(e) => { if (e.target.value) { setDormir(aHoras(e.target.value)); setMgProbada(null); } }} /></div>
      <div className="caf-linea"><span>{t("cafLlevo")}</span>{chips(OTRAS, otrasHoy, setOtrasHoy, (v) => t("cafOtras" + OTRAS.indexOf(v)), t("cafLlevo"))}</div>
    </section>
  );

  const pintarResultado = () => {
    if (calc.tipo === "bloq") {
      const cr = calc.cr;
      const mot = cr.motivos.map((m) => (m === "medicacion" ? t("cafMot_medicacion", { items: cr.interacciones.map((x) => x.item).join(", ") }) : t("cafMot_" + m))).join(", ");
      return (<><div className="caf-tit">{t("cafTuDosis")}</div>
        <div className="caf-bloq">{t("cafBloq", { motivos: mot })}<small>{rico(t(cr.topeDiario < 400 ? "cafBloqEmb" : "cafBloqSano"))}</small></div></>);
    }
    if (calc.tipo === "sinPeso") return (<><div className="caf-tit">{t("cafTuDosis")}</div><div className="caf-bloq">⚖️ {t("cafSinPeso")}</div></>);
    if (calc.tipo === "servido") return (<><div className="caf-tit">{t("cafTuDosis")}</div>
      <div className="caf-bloq">{rico(t("cafServidoTxt", { mg: otrasHoy }))}<small>{t("cafServidoX")}</small></div></>);
    const { rec, cmp } = calc, tr = res.tramo, cubreTodo = res.cubre > 0.999, A = res.avisos, varias = res.tomas.length > 1;
    const objTxt = t(res.objetivo === "rendimiento" ? "cafObjEntreno" : "cafObjTiempo");
    const avisos = [];
    if (A.includes("tope") && !varias) avisos.push(t("cafAvTope", { n: Math.round(res.necesarios), obj: objTxt, mg: res.mg, extra: res.objetivo === "concentracion" ? t("cafAvTopeConc") : "." }));
    if (A.includes("sobre_efsa")) avisos.push(t("cafAvSobreEfsa"));
    if (A.includes("no_lineal")) avisos.push(t("cafAvNoLineal"));
    if (A.includes("nervios")) avisos.push(t("cafAvNervios"));
    if (A.includes("tolerante_rendimiento")) avisos.push(t("cafAvTolerante"));
    if (A.includes("sesion_larga")) avisos.push(t("cafAvSesionLarga"));
    if (A.includes("peso_ajustado")) avisos.push(t("cafAvPesoAjustado"));
    if (A.includes("fumador")) avisos.push(t("cafAvFumador"));
    if (A.includes("anticonceptivos")) avisos.push(t("cafAvAnti"));
    if (habitos.forma === "chicle") avisos.push(t("cafAvChicle"));
    const s = res.sueno;
    let sueno = null;
    if (s) {
      if (s.ok) sueno = <div className="caf-sueno ok">{t("cafSuenoOk", { h: hm(s.dormir), c: nf(s.c, 1) })}</div>;
      else if (varias) {
        const sinUltima = concentracion(s.dormir, res.tomas.slice(0, -1), res.pk);
        sueno = <div className="caf-sueno mal">{t("cafSuenoMal", { h: hm(s.dormir), c: nf(s.c, 1) })}
          <small>{rico(t("cafSuenoUltima", { h: hm(res.tomas[res.tomas.length - 1].t), c: nf(sinUltima, 1) }) + t(sinUltima <= s.umbral ? "cafSuenoQuitala" : "cafSuenoAunAsi"))}</small></div>;
      } else sueno = <div className="caf-sueno mal">{t("cafSuenoMal", { h: hm(s.dormir), c: nf(s.c, 1) })}
          <small>{rico((s.horaLimite >= 6 ? t("cafSuenoLimite", { h: hm(s.horaLimite) }) : t("cafSuenoLimite6")) + (s.mgMax >= 20 ? t("cafSuenoMax", { mg: s.mgMax }) : t("cafSuenoSin")))}</small></div>;
    }
    const e = equivPartes(res.mg);
    const U = res.umbrales, u = U[res.objetivo], cc = concentracion(scrubT, res.tomas, res.pk), z = zona(cc), top = U.nervios * 1.15;
    const cortes = [0, u, Math.min(u * 1.5, U.nervios), U.nervios, top];
    const paso = (dd) => { const v = Math.max(20, Math.min(res.tope, res.mg + dd)); setMgProbada(v === rec.mg ? null : v); };
    return (<>
      <div className="caf-tit">{res.probada ? t("cafProbando") : varias ? t("cafPauta", { n: res.tomas.length }) : t("cafTuDosis")} <small>{t(res.objetivo === "rendimiento" ? "cafParaRendir" : "cafParaConc")}</small></div>
      <div className="caf-dosis"><b>{res.mg}</b><span>mg{varias ? t("cafEnTotal") : ""}</span><em>{t("cafPorKilo", { v: nf(res.mgkg, 1) })}</em></div>
      {!varias && (
        <div className="caf-equiv">
          {e.length ? <>≈ {e.map((x, i) => <React.Fragment key={i}>{i ? " · " : ""}<b>{x.cant}</b> {x.txt}</React.Fragment>)}</> : null}
          {habitos.forma === "cafe" ? <small> {t("cafCafeVaria")}</small> : null}
          {res.probada ? rico(t("cafRecomendada", { mg: rec.mg })) : null}
        </div>
      )}
      {cmp && !res.probada && (habitos.tolerancia === "tolerante"
        ? <div className="caf-compara">{t("cafCmpTol", { mg: cmp.mgNormal, que: cmp.horas < 0.05 ? t("cafCmpNada") : t("cafCmpSolo", { d: durTxt(cmp.horas) }) })}<small>{t("cafCmpTolX", { d: durTxt(cmp.horasPropia) })}</small></div>
        : <div className="caf-compara">{t("cafCmpSens", { mg: cmp.mgNormal, d: durTxt(cmp.horas), nerv: cmp.pico > U.nervios ? t("cafCmpNervios") : "." })}<small>{t("cafCmpSensX", { d: durTxt(cmp.horasPropia) })}</small></div>)}
      {varias && (
        <div className="caf-compara">{res.plan.motivo === "nervios"
          ? t("cafPorqueNervios", { mg: res.plan.unica.mg, p: nf(res.plan.unica.pico, 1), q: nf(res.pico.c, 1) })
          : t("cafPorqueTope", { mg: res.plan.unica.mg, pct: Math.round(res.plan.unica.cubre * 100), obj: objTxt, fin: t(res.cubre > 0.999 ? "cafEntero" : "cafMejor") })}
          <small>{t("cafPorqueX")}</small></div>
      )}
      {!varias && (
        <div className="caf-probar">
          <span>{t("cafProbar")}</span>
          <button className="caf-pm" aria-label={t("cafMenos10")} onClick={() => paso(-10)}>−</button>
          <output>{res.mg} mg</output>
          <button className="caf-pm" aria-label={t("cafMas10")} onClick={() => paso(10)}>+</button>
          {res.probada && <button className="caf-lnk" onClick={() => setMgProbada(null)}>{t("cafVolver", { mg: rec.mg })}</button>}
        </div>
      )}
      <div className="caf-pasos">
        {varias
          ? res.tomas.map((dd, i) => (
            <div key={i}>⏰ <span><b>{hm(dd.t)} · {dd.mg} mg</b> <small>· {i === 0 ? t("cafMinAntes", { n: Math.round((res.inicio - dd.t) * 60) }) : dd.t < res.inicio ? t("cafAntesEmpezar") : t("cafDuranteToma")}
              {equivPlano(dd.mg) ? " · " + equivPlano(dd.mg) : ""}</small></span></div>))
          : <div>⏰ <span>{rico(t("cafTomala", { h: hm(res.tToma) }))} <small>· {t("cafMinAntes", { n: Math.round(res.antelacion * 60) })}</small></span></div>}
        {tr ? <div>✨ <span>{rico(t("cafEfecto", { a: hm(tr.desde), b: hm(tr.hasta) }))} <small>· {dur(tr.hasta - tr.desde)}</small></span></div>
            : <div>✨ <span>{t("cafSinEfecto")}</span></div>}
        <div>{cubreTodo ? "🎯" : "⚠️"} <span>{cubreTodo ? t("cafCubreTodo", { obj: objTxt, a: hm(res.inicio), b: hm(res.inicio + res.duracion) }) : t("cafCubrePct", { pct: Math.round(res.cubre * 100), obj: objTxt })}</span></div>
      </div>
      <canvas className="caf-graf" ref={graf} aria-label={t("cafGrafAria")} role="img" />
      <input className="caf-scrub" type="range" min="0" max="1000" aria-label={t("cafScrubAria")}
        value={Math.round((scrubT - calc.desde) / (calc.hasta - calc.desde) * 1000)} onChange={(ev) => setScrub(+ev.target.value)} />
      <div className="caf-lectura">{rico(t("cafLectura", { h: hm(scrubT), c: nf(cc, 1) }))}
        <span className="caf-zona" style={{ background: z.col, color: z.id === "nada" ? "#fff" : "#08140c" }}>{t(z.k)}</span></div>
      <div className="caf-termo">
        {ZONAS.map((zz, i) => <i key={zz.id} style={{ width: ((cortes[i + 1] - cortes[i]) / top * 100) + "%", background: zz.col }} />)}
        <span className="caf-aguja" style={{ left: "calc(" + Math.min(100, cc / top * 100) + "% - 1.5px)" }} />
      </div>
      <div className="caf-ley"><span>0</span><span>{nf(u, 1)}</span><span>{nf(U.nervios, 0)} mg/L</span></div>
      {sueno}
      {avisos.length > 0 && <ul className="caf-avisos">{avisos.map((a, i) => <li key={i}>{rico(a)}</li>)}</ul>}
    </>);
  };

  const pildora = () => {
    if (calc.tipo === "bloq") return <>{t("cafPildBloq")}</>;
    if (calc.tipo === "sinPeso") return <>⚖️ {t("cafSinPesoCorto")}</>;
    if (calc.tipo === "servido") return <>{t("cafPildServido")}</>;
    const varias = res.tomas.length > 1, tr = res.tramo;
    return <>☕ <b data-caf="mg">{(varias ? t("cafPildTomas", { n: res.tomas.length }) : "") + res.mg + " mg"}</b>
      <span>{(res.probada ? t("cafPildProbando") : "") + t(varias ? "cafPildLa1" : "cafPildA")}<span data-caf="hora">{hm(res.tToma)}</span>{tr ? t("cafPildHasta", { h: hm(tr.hasta) }) : ""}</span></>;
  };

  return (
    <div className="caf" role="dialog" aria-modal="true" aria-label={t("cafTitulo")}
      style={{ position: "fixed", inset: 0, zIndex: 9000, background: T.bg, display: "flex", flexDirection: "column" }}>
      <style>{css}</style>
      <div style={{ display: "flex", alignItems: "flex-start", justifyContent: "space-between", gap: 10, padding: "calc(12px + env(safe-area-inset-top, 0px)) 16px 6px" }}>
        <div style={{ minWidth: 0 }}>
          <div style={{ fontWeight: 900, fontSize: 21, color: T.t1 }}>{t("cafTitulo")}</div>
          <div style={{ fontSize: 11.5, color: T.t2, fontFamily: "'DM Sans',sans-serif" }}>{t("cafSub")}</div>
        </div>
        <div style={{ display: "flex", alignItems: "center", gap: 10, flexShrink: 0 }}>
          <button className="caf-lnk" aria-expanded={verFuentes} onClick={() => setVerFuentes(!verFuentes)}>{t("cafFuentesBtn")}</button>
          <button onClick={() => { tap(); onClose && onClose(); }} aria-label={t("cafCerrar")}
            style={{ width: 34, height: 34, borderRadius: "50%", border: "1.5px solid rgba(255,255,255,0.2)", background: "rgba(0,0,0,0.35)", color: T.t2, fontSize: 14, fontWeight: 900, cursor: "pointer", fontFamily: "'Nunito',sans-serif" }}>✕</button>
        </div>
      </div>
      <div style={{ flex: 1, overflowY: "auto", overflowX: "hidden", WebkitOverflowScrolling: "touch", padding: "4px 14px calc(24px + env(safe-area-inset-bottom, 0px))" }}>
        <button className="caf-pildora" data-caf="pildora" onClick={() => resRef.current && resRef.current.scrollIntoView({ behavior: "smooth", block: "start" })}>
          {pildora()}<small>{t("cafPildVer")}</small>
        </button>
        {verFuentes && (
          <section className="caf-card">
            <div className="caf-tit">{t("cafFuentesTit")}</div>
            <div style={{ font: "500 11.5px 'DM Sans',sans-serif", color: T.t2 }}>{t("cafFuentesIntro")}</div>
            <ol className="caf-fuentes">{FUENTES.filter((f) => f.app).map((f) => <li key={f.id}><b>{corto(f)}</b>: {t("cafFu_" + f.id)}</li>)}</ol>
          </section>
        )}
        {pintarSalud()}
        {pintarTu()}
        {pintarParaQue()}
        <section className="caf-card oro" ref={resRef} aria-live="polite" data-caf="resultado">{pintarResultado()}</section>
        <p className="caf-legal">{t("cafLegal")}</p>
      </div>
    </div>
  );
}
