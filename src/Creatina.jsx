// ═══ CREATINA: tu dosis, cuándo se llena tu músculo y cuánta tiras (fase 1, 5-oct-2026) ═══
// La pantalla de la maqueta aprobada (07. App GBH/MAQUETA_calculadora_creatina_2026-10-05.html) sobre el MISMO motor
// (src/motorCreatina.js, copia exacta de 07. App GBH/creatina.js: se comprueba con md5).
// ⚠️ El motor NO se llama creatina.js en src/: en un disco que no distingue mayúsculas (el Mac de Codemagic, Windows),
// `import ... from "./Creatina"` lo encontraría antes que Creatina.jsx (ver comprobar_mayusculas.py y Cafeina.jsx).
//
// Lo que la app ya sabe NO se pregunta (orden de Alejandro, 24-sep): el peso (weights = weight_logs, o el de alta), el
// sexo, la altura y la franja de edad (profiles), los pliegues (la última toma completa de body_measurements: App.jsx la
// lee al abrir y pasa la suma), la dieta (patient_config.tipo_dieta, en estándar) y si ya toma creatina (suplPlan).
// Lo que no sabe (la edad, si falta la franja; si es vegetariano, en premium) se pregunta una vez y se guarda SOLO en el
// teléfono (localStorage). Las respuestas de salud del cribado no se guardan en ningún sitio.
//
// A propósito, este módulo NO recibe sbReq: no puede hacer ninguna llamada a Supabase. Los textos viven en TRANS de
// App.jsx (claves cre*) y llegan por t(). Lo que enseña (decisión de Alejandro, 5-oct, MAESTRO-2026-846): el día de
// lleno del modelo con su franja entre estudios (metaanálisis de 10 estudios, validación cruzada 16/19) y, al dejarla,
// el plazo de las guías, porque el modelo no quedó validado para el lavado.
import React, { useState, useMemo } from "react";
import { FUENTES, TOPES, perfilDesdeApp, cribado, recomendar, probarDosis, equivalencias } from "./motorCreatina";

const CRIB = [["rinon", "creCribRinon"], ["embarazo", "creCribEmbarazo"], ["menor", "creCribMenor"], ["reaccion", "creCribReaccion"]];
const MOTIVO = { rinon: "creMotRinon", embarazo: "creMotEmbarazo", menor: "creMotMenor", reaccion: "creMotReaccion", medicacion: "creMotMedicacion" };
const MODOS_UI = [["rapido", "creRapido", "creRapidoX"], ["sinPrisa", "creSinPrisa", "creSinPrisaX"], ["yaLaToma", "creYaLaTomo", "creYaLaTomoX"]];
const YA_G = [3, 5, 10];
const YA_DIAS = [[7, "creYa1sem"], [14, "creYa2sem"], [30, "creYa1mes"], [60, "creYa2mes"]];
const AVISO = { bascula: "creAvBascula", analitica: "creAvAnalitica", descarga: "creAvDescarga" };
const VACIO = { edad: null, vegetariano: null };
const claveHabitos = (id) => `gbh:creatina:${id || "anon"}`;

function leerHabitos(id) {
  try { const v = JSON.parse(localStorage.getItem(claveHabitos(id)) || "null"); return v && typeof v === "object" ? { edad: v.edad ?? null, vegetariano: v.vegetariano ?? null } : { ...VACIO }; }
  catch { return { ...VACIO }; }
}
function guardarHabitos(id, h) {
  try { localStorage.setItem(claveHabitos(id), JSON.stringify({ edad: h.edad ?? null, vegetariano: h.vegetariano ?? null })); } catch {}
}
const sem = (d) => Math.max(1, Math.round(d / 7));
const franjaTxt = (f) => `${f.pronto}|${f.tarde}`;

export function Creatina({ profile, weights, medicacion, tipoDieta = null, sumaPliegues = null, lang = "es", t, T, sfx, onClose }) {
  const en = lang === "en";
  const nf = (v, d = 0) => (v == null ? "—" : en ? Number(v).toFixed(d) : Number(v).toFixed(d).replace(".", ","));
  const [habitos, setHabitos] = useState(() => leerHabitos(profile?.id));
  const [salud, setSalud] = useState({ rinon: false, embarazo: false, menor: false, reaccion: false });
  const [saludAbierta, setSaludAbierta] = useState(false);
  const [verFuentes, setVerFuentes] = useState(false);
  const [modo, setModo] = useState(null);          // null = el que toca: «Ya la tomo» si su plan la lleva; si no, «Rápido»
  const [ya, setYa] = useState(null);              // { g, dias } de «Ya la tomo»
  const [prueba, setPrueba] = useState(null);      // g/día de − y +
  const [edadTxt, setEdadTxt] = useState("");
  const tap = () => { try { sfx && sfx("tap"); } catch {} };
  const cambiaHabito = (k, v) => { const h = { ...habitos, [k]: v }; setHabitos(h); guardarHabitos(profile?.id, h); setPrueba(null); };

  // ── Del registro de la app al perfil del motor ──
  const med = Array.isArray(medicacion) ? medicacion : [];
  const app = useMemo(() => perfilDesdeApp({
    sexo: profile?.sex === "M" || profile?.sex === "F" ? profile.sex : null,
    alturaCm: profile?.height_cm ?? null,
    ageRange: profile?.age_range ?? null,
    registrosPeso: (weights || []).map((w) => ({ log_date: w.date ?? w.log_date, weight_kg: w.weight ?? w.weight_kg })),
    pesoInicial: profile?.initial_weight ?? null,
    sumaPliegues, tipoDieta, suplementos: med,
  }, habitos), [profile?.sex, profile?.height_cm, profile?.age_range, profile?.initial_weight, weights, sumaPliegues, tipoDieta, medicacion, habitos]);
  const plan = app.datos.creatinaPlan;
  const modoEf = modo || (plan ? "yaLaToma" : "rapido");
  const yaG = ya ? ya.g : (plan && plan.g >= 1 ? plan.g : 5), yaDias = ya ? ya.dias : 30;

  const calc = useMemo(() => {
    const cr = cribado(salud, app.datos);
    if (cr.bloquea) return { tipo: "bloq", cr };
    const r = recomendar(app.perfil, { modo: modoEf, yaLaToma: { g: yaG, dias: yaDias } });
    if (r.error) return { tipo: "faltan" };
    return { tipo: "ok", r, pr: prueba == null ? null : probarDosis(app.perfil, prueba) };
  }, [app, salud, modoEf, yaG, yaDias, prueba]);
  const r = calc.tipo === "ok" ? calc.r : null, pr = calc.tipo === "ok" ? calc.pr : null;

  // ── Textos que dependen del cálculo ──
  const textoLleno = (lleno, f, mas = "") => {
    if (lleno === 0) return t("creLlenoYa");
    if (lleno == null) return t("creLlenoNo");
    const dias = lleno <= 14;
    const tip = dias ? (lleno === 1 ? t("creLleno1Dia", { mas }) : t("creLlenoDias", { n: lleno, mas })) : t("creLlenoSem", { n: sem(lleno), mas });
    const fr = f.tarde == null ? (dias ? t("creFranjaDiasMas", { a: f.pronto }) : t("creFranjaSemMas", { a: sem(f.pronto) }))
      : (dias ? t("creFranjaDias", { a: f.pronto, b: f.tarde }) : t("creFranjaSem", { a: sem(f.pronto), b: sem(f.tarde) }));
    return tip + " · " + fr;
  };
  const dosisTxt = (x) => (x.carga
    ? t("creDosisCarga", { g: x.carga.g, d: x.carga.dias, n: x.carga.tomas, x: nf(x.carga.g / x.carga.tomas, 1), m: x.mantenimiento.g })
    : t("creDosisMant", { m: x.mantenimiento.g }));
  const fecha = (iso) => { const p = (iso || "").split("-"), M = t("creMeses"); return p.length === 3 && Array.isArray(M) ? (+p[2]) + "-" + M[+p[1] - 1] : iso; };
  const cacitos = (g) => { const c = equivalencias(g).cacitos; return c === 1 ? t("creCacito1") : t("creCacitos", { c: nf(c, c % 1 ? 1 : 0) }); };

  // ── Estilos (la paleta de la app; los de la maqueta, con prefijo cre-) ──
  const css = `
  .cre{font-family:'Nunito',sans-serif;color:${T.t1}}
  .cre *{box-sizing:border-box}
  .cre-card{background:rgba(255,255,255,.04);border:1.5px solid rgba(255,255,255,.10);border-radius:16px;padding:12px;margin-bottom:10px}
  .cre-card.oro{border-color:rgba(201,162,39,.55);background:linear-gradient(180deg,rgba(201,162,39,.10),rgba(255,255,255,.03))}
  .cre-card.bloqueo{border-color:rgba(255,75,75,.6);background:rgba(255,75,75,.08)}
  .cre-tit{font-size:11px;color:${T.au1};font-weight:900;text-transform:uppercase;letter-spacing:.08em;margin-bottom:8px;display:flex;justify-content:space-between;align-items:center;gap:8px}
  .cre-tit small{text-transform:none;letter-spacing:0;color:${T.t3};font:500 10.5px 'DM Sans',sans-serif;text-align:right}
  .cre-fila{display:flex;align-items:center;justify-content:space-between;gap:10px;padding:6px 0;border-top:1px solid rgba(255,255,255,.10);font-size:12.5px;font-weight:800;flex-wrap:wrap}
  .cre-fila:first-of-type{border-top:none}
  .cre-fila small{display:block;font:500 10.5px 'DM Sans',sans-serif;color:${T.t3}}
  .cre-fila > span:last-child:not(:first-child){text-align:right;max-width:100%}
  .cre-sum{list-style:none;cursor:pointer;display:flex;justify-content:space-between;align-items:center;gap:8px}
  .cre-sum::-webkit-details-marker{display:none}
  .cre-est{font:800 11.5px 'Nunito',sans-serif;color:${T.g2};white-space:nowrap}
  .cre-est.alerta{color:#FF8A8A}
  .cre-sn{display:inline-flex;gap:3px;background:rgba(0,0,0,.25);padding:3px;border-radius:10px;flex-shrink:0}
  .cre-sn button{font:900 11.5px 'Nunito',sans-serif;padding:6px 11px;border:none;border-radius:8px;background:transparent;color:${T.t2};cursor:pointer}
  .cre-sn button.on{background:${T.g3};color:#fff}
  .cre-sn button.on.si{background:#8a2e2e}
  .cre-sn button:disabled{opacity:.4;cursor:default}
  .cre-resumen{font:900 15px 'Nunito',sans-serif;line-height:1.35}
  .cre-resumen small{display:block;font:500 11.5px 'DM Sans',sans-serif;color:${T.t2};margin-top:4px}
  .cre-chips{display:flex;gap:4px;flex-wrap:wrap}
  .cre-chips button{font:800 11.5px 'Nunito',sans-serif;padding:6px 9px;border-radius:9px;border:1.5px solid rgba(255,255,255,.14);background:transparent;color:${T.t2};cursor:pointer}
  .cre-chips button.on{border-color:${T.au1};color:${T.au2};background:rgba(201,162,39,.12)}
  .cre-modos{display:flex;flex-wrap:wrap;gap:3px;background:rgba(0,0,0,.25);padding:3px;border-radius:10px}
  .cre-modos button{flex:1 1 auto;font:900 11.5px 'Nunito',sans-serif;padding:7px 9px;border:none;border-radius:8px;background:transparent;color:${T.t2};cursor:pointer;text-align:center}
  .cre-modos button small{display:block;font:500 9.5px 'DM Sans',sans-serif;color:inherit;opacity:.8}
  .cre-modos button.on{background:${T.g3};color:#fff}
  .cre-modos button:disabled{opacity:.35;cursor:default}
  .cre-graf{width:100%;height:auto;display:block;border-radius:12px;background:rgba(0,0,0,.25);margin-top:6px}
  .cre-mm{display:flex;align-items:center;justify-content:center;gap:14px}
  .cre-mm button{width:40px;height:40px;border-radius:12px;border:1.5px solid rgba(255,255,255,.12);background:rgba(255,255,255,.06);color:${T.t1};font:900 20px 'Nunito',sans-serif;cursor:pointer}
  .cre-mm output{min-width:64px;text-align:center;font:900 17px 'Nunito',sans-serif}
  .cre-lnk{background:none;border:none;color:${T.au2};font:800 11.5px 'Nunito',sans-serif;cursor:pointer;padding:4px 0;white-space:nowrap}
  .cre-edad{display:flex;gap:6px;align-items:center}
  .cre-edad input{width:72px;font:900 15px 'Nunito',sans-serif;color:${T.t1};background:rgba(255,255,255,.06);border:2px solid rgba(255,255,255,.10);border-radius:11px;padding:5px 8px}
  .cre-edad button{font:900 11.5px 'Nunito',sans-serif;padding:7px 11px;border:none;border-radius:9px;background:${T.g3};color:#fff;cursor:pointer}
  .cre-nota{font:500 10.5px 'DM Sans',sans-serif;color:${T.t3};margin-top:6px}
  .cre-faltan{margin:6px 0 0;padding-left:18px;font:500 12px 'DM Sans',sans-serif;color:${T.t2};display:flex;flex-direction:column;gap:4px}
  .cre-fuentes{margin:6px 0 0;padding-left:16px;font:500 11px 'DM Sans',sans-serif;color:${T.t2};display:flex;flex-direction:column;gap:4px;overflow-wrap:anywhere}
  .cre button:focus-visible,.cre input:focus-visible{outline:2px solid ${T.au2};outline-offset:2px}
  .cre-legal{font:500 10.5px 'DM Sans',sans-serif;color:${T.t3};text-align:center;margin:2px 8px 0}
  `;

  // ── La gráfica: % del camino de su nivel a lleno, con la franja del día de lleno sobre la línea de «lleno» ──
  const grafica = () => {
    const pac = r.pac, W = 340, H = 150, x0 = 26, y0 = 12, w = W - x0 - 8, h = H - y0 - 22;
    const pct = (C) => Math.max(0, Math.min(100, (C - pac.B) / (pac.T - pac.B) * 100));
    const X = (d) => x0 + d / 84 * w, Y = (p) => y0 + h - p / 100 * h;
    const puntos = (s) => s.map((p) => `${X(p.dia).toFixed(1)},${Y(pct(p.C)).toFixed(1)}`).join(" ");
    const franja = (q, col) => (q.lleno && q.franja && q.franja.pronto != null ? (
      <g>
        <rect x={X(q.franja.pronto).toFixed(1)} y={(Y(90) - 3.5).toFixed(1)} height="7" rx="3.5" fill={col} opacity=".28"
          width={Math.max(0, X(q.franja.tarde == null ? 84 : q.franja.tarde) - X(q.franja.pronto)).toFixed(1)} />
        <circle cx={X(q.lleno).toFixed(1)} cy={Y(90).toFixed(1)} r="3.4" fill={col} />
      </g>) : null);
    return (
      <svg className="cre-graf" viewBox={`0 0 ${W} ${H}`} role="img" aria-label={t("creGrafAria")}>
        <line x1={x0} x2={x0 + w} y1={Y(90)} y2={Y(90)} stroke={T.au1} strokeDasharray="3 3" />
        <text x={x0 + w - 2} y={Y(90) + 11} fill={T.au1} fontSize="9" textAnchor="end">{t("creEjeLleno")}</text>
        <text x="2" y={Y(0) + 3} fill="rgba(255,255,255,.5)" fontSize="9">{t("creEjeNivel")}</text>
        {franja(r, T.g2)}{pr ? franja(pr, "#1CB0F6") : null}
        <polyline fill="none" stroke={T.g2} strokeWidth="2.4" points={puntos(r.serie)} />
        {pr ? <polyline fill="none" stroke="#1CB0F6" strokeWidth="2.4" strokeDasharray="4 3" points={puntos(pr.serie)} /> : null}
        {[0, 2, 4, 6, 8, 10, 12].map((s) => (
          <text key={s} x={X(s * 7)} y={H - 6} fill="rgba(255,255,255,.5)" fontSize="9" textAnchor={s === 12 ? "end" : "middle"}>{s === 12 ? "12 " + t("creEjeSem") : s}</text>))}
      </svg>
    );
  };

  // ── Bloques de la pantalla ──
  const resumen = () => {
    if (calc.tipo === "bloq") {
      const mot = calc.cr.motivos.map((m) => t(MOTIVO[m])).join(t("creY"));
      return (<section className="cre-card bloqueo" data-cre="bloq" aria-live="polite"><div className="cre-tit">{t("creBloqTit")}</div>
        <div className="cre-resumen">{t("creBloq", { motivos: mot })}<small>{t("creBloqX")}</small></div></section>);
    }
    if (calc.tipo === "faltan") {
      const f = app.datos.faltan;
      return (<section className="cre-card" data-cre="faltan" aria-live="polite"><div className="cre-tit">{t("creFaltaTit")}</div>
        <ul className="cre-faltan">
          {f.includes("peso") && <li>{t("creFaltaPeso")}</li>}
          {f.includes("sexo") && <li>{t("creFaltaSexo")}</li>}
          {f.includes("altura") && <li>{t("creFaltaAltura")}</li>}
          {f.includes("edad") && <li>{t("creFaltaEdad")}</li>}
        </ul></section>);
    }
    const lv = r.plazos.lavado.semanas;
    return (
      <section className="cre-card oro" aria-live="polite" data-cre="resumen" data-dosis={r.carga ? `${r.carga.g}x${r.carga.dias}+${r.mantenimiento.g}` : `${r.mantenimiento.g}`}
        data-lleno={`${r.lleno}|${franjaTxt(r.franja)}`}>
        <div className="cre-resumen">{dosisTxt(r)}
          <small>{textoLleno(r.lleno, r.franja, r.modo === "yaLaToma" ? t("creMas") : "")} · {t("creDejar", { a: lv[0], b: lv[1] })}</small></div>
      </section>
    );
  };

  const pintarSalud = () => {
    const bloquea = calc.tipo === "bloq", it = app.datos.interacciones;
    const preguntas = CRIB.filter(([k]) => k !== "menor" || app.datos.menor !== false);   // con la franja de edad, la app ya sabe que es adulto
    return (
      <details className="cre-card" open={saludAbierta || bloquea} onToggle={(e) => setSaludAbierta(e.currentTarget.open)}>
        <summary className="cre-sum" style={saludAbierta || bloquea ? { marginBottom: 6 } : null}>
          <span className="cre-tit" style={{ margin: 0 }}>{t("creSaludTit")}</span>
          <span className={"cre-est" + (bloquea ? " alerta" : "")}>{t(bloquea ? "creSaludMal" : "creSaludOk")} {saludAbierta || bloquea ? "▴" : "▾"}</span>
        </summary>
        {preguntas.map(([k, txt]) => (
          <div className="cre-fila" key={k} data-crib={k}>
            <span>{t(txt)}</span>
            <span className="cre-sn">
              <button className={salud[k] ? "" : "on"} onClick={() => { setSalud({ ...salud, [k]: false }); setPrueba(null); }}>{t("creNo")}</button>
              <button className={salud[k] ? "on si" : ""} onClick={() => { setSalud({ ...salud, [k]: true }); setPrueba(null); }}>{t("creSi")}</button>
            </span>
          </div>
        ))}
        <div className="cre-fila">
          <span>{t("creMedTit")}<small>{it.length ? t("creMedMal", { items: it.map((x) => x.item).join(", ") }) : med.length ? t("creMedOk") : t("creMedVacia")}</small></span>
          <span>{it.length ? "⚠️" : "✅"}</span>
        </div>
      </details>
    );
  };

  const pintarTu = () => {
    const pp = app.datos.peso, faltaEdad = app.datos.faltan.includes("edad");
    return (
      <section className="cre-card">
        <div className="cre-tit">{t("creTu")} <small>{t("creTuSub")}</small></div>
        <div className="cre-fila"><span>{t("crePeso")}<small>{pp.peso == null ? "" : pp.origen === "pesaje" ? t("crePesoPesaje", { f: fecha(pp.fecha) }) : t("crePesoAlta")}</small></span>
          <span>{pp.peso == null ? "—" : nf(pp.peso, 1).replace(/[.,]0$/, "") + " kg"}</span></div>
        <div className="cre-fila"><span>{t("creGrasa")}<small>{app.datos.origenGrasa === "pliegues" ? t("creGrasaPliegues") : app.datos.origenGrasa === "estimada" ? t("creGrasaEstimada") : ""}</small></span>
          <span>{app.perfil.grasaPct == null ? "—" : nf(app.perfil.grasaPct, 1) + " %"}</span></div>
        {tipoDieta
          ? <div className="cre-fila"><span>{t("creDieta")}</span><span>{t(app.perfil.dieta === "vegetariano" ? "creDietaVeg" : "creDietaTodo")}</span></div>
          : <div className="cre-fila" data-cre="veg"><span>{t("creVegPreg")}<small>{t("creVegPregX")}</small></span>
              <span className="cre-sn">
                <button className={habitos.vegetariano === false ? "on" : ""} onClick={() => { tap(); cambiaHabito("vegetariano", false); }}>{t("creNo")}</button>
                <button className={habitos.vegetariano === true ? "on" : ""} onClick={() => { tap(); cambiaHabito("vegetariano", true); }}>{t("creSi")}</button>
              </span></div>}
        {plan && <div className="cre-fila"><span>{t("creYaTomas")}</span><span>{plan.g ? t("creYaTomasG", { g: nf(plan.g, plan.g % 1 ? 1 : 0) }) : t("creYaTomasSinG")}</span></div>}
        {faltaEdad && (
          <div className="cre-fila" data-cre="edad"><span>{t("creEdadPreg")}</span>
            <span className="cre-edad">
              <input type="number" inputMode="numeric" min="18" max="99" value={edadTxt} aria-label={t("creEdadPreg")} onChange={(e) => setEdadTxt(e.target.value)} />
              <button onClick={() => { const n = Math.round(+edadTxt); if (n >= 18 && n <= 99) { tap(); cambiaHabito("edad", n); } }}>{t("creEdadGuardar")}</button>
            </span></div>)}
        {(habitos.edad != null || habitos.vegetariano != null) && <div className="cre-nota">{t("creGuardadoTel")}</div>}
      </section>
    );
  };

  const pintarModo = () => (
    <section className="cre-card">
      <div className="cre-tit">{t("creComo")}</div>
      <div className="cre-modos" role="radiogroup" aria-label={t("creComo")}>
        {MODOS_UI.map(([id, k, kx]) => (
          <button key={id} data-modo={id} role="radio" aria-checked={r.modo === id} className={r.modo === id ? "on" : ""}
            disabled={id === "rapido" && app.perfil.descarga} onClick={() => { tap(); setModo(id); setPrueba(null); }}>{t(k)}<small>{t(kx)}</small></button>
        ))}
      </div>
      {app.perfil.descarga && <div className="cre-nota">{t("creDescargaNo")}</div>}
      {r.modo === "yaLaToma" && (<>
        <div className="cre-fila"><span>{t("creCuanta")}</span>
          <span className="cre-chips">{YA_G.map((g) => <button key={g} className={yaG === g ? "on" : ""} onClick={() => { setYa({ g, dias: yaDias }); setPrueba(null); }}>{g} g</button>)}</span></div>
        <div className="cre-fila"><span>{t("creDesde")}</span>
          <span className="cre-chips">{YA_DIAS.map(([d, k]) => <button key={d} className={yaDias === d ? "on" : ""} onClick={() => { setYa({ g: yaG, dias: d }); setPrueba(null); }}>{t(k)}</button>)}</span></div>
      </>)}
    </section>
  );

  const pintarDeposito = () => (
    <section className="cre-card">
      <div className="cre-tit">{t("creDeposito")} <small>{t("creEstimacion")} · {cacitos(r.mantenimiento.g)}</small></div>
      {grafica()}
      <div className="cre-nota">{t("creFranjaNota")}</div>
    </section>
  );

  const pintarProbar = () => {
    const tope = Math.floor(TOPES.cargaGkg * app.perfil.peso);
    const paso = (d) => { tap(); setPrueba(Math.max(TOPES.pruebaMin, Math.min(tope, (prueba ?? r.mantenimiento.g) + d))); };
    return (
      <section className="cre-card" {...(pr ? { "data-cre": "probar", "data-g": pr.g, "data-lleno": `${pr.lleno}|${franjaTxt(pr.franja)}`, "data-tirado": pr.tiradoSemana.toFixed(1) } : {})}>
        <div className="cre-tit">{t("creProbar")}{pr && <button className="cre-lnk" onClick={() => setPrueba(null)}>{t("creVolver", { g: r.mantenimiento.g })}</button>}</div>
        <div className="cre-mm">
          <button aria-label={t("creMenos")} data-cre="menos" onClick={() => paso(-1)}>−</button>
          <output>{pr ? pr.g + " g" : "—"}</output>
          <button aria-label={t("creMas1")} data-cre="mas" onClick={() => paso(1)}>+</button>
        </div>
        {pr && (<>
          <div className="cre-fila"><span>{t("creLlega")}</span><span>{pr.lleno == null ? t("creNoLlega") : textoLleno(pr.lleno, pr.franja).replace(/^[^ ]+ /, "")}</span></div>
          <div className="cre-fila"><span>{t("creSeVa")}</span><span>{t("creSeVaX", { g: nf(pr.tiradoSemana, 1) })}</span></div>
        </>)}
      </section>
    );
  };

  const pintarTomar = () => (
    <section className="cre-card">
      <div className="cre-tit">{t("creTomarTit")}</div>
      {["creTomarHidratos", "creTomarDiario", "creTomarHora", "creTomarAlto"].map((k) => <div className="cre-fila" key={k}><span>{t(k)}</span></div>)}
      {r.avisos.map((a) => <div className="cre-fila" key={a}><span>{t(AVISO[a])}</span></div>)}
    </section>
  );

  return (
    <div className="cre" role="dialog" aria-modal="true" aria-label={t("creTitulo")}
      style={{ position: "fixed", inset: 0, zIndex: 9000, background: T.bg, display: "flex", flexDirection: "column" }}>
      <style>{css}</style>
      <div style={{ display: "flex", alignItems: "flex-start", justifyContent: "space-between", gap: 10, padding: "calc(12px + env(safe-area-inset-top, 0px)) 16px 6px" }}>
        <div style={{ minWidth: 0 }}>
          <div style={{ fontWeight: 900, fontSize: 21, color: T.t1 }}>{t("creTitulo")}</div>
          <div style={{ fontSize: 11.5, color: T.t2, fontFamily: "'DM Sans',sans-serif" }}>{t("creSub")}</div>
        </div>
        <div style={{ display: "flex", alignItems: "center", gap: 10, flexShrink: 0 }}>
          <button className="cre-lnk" aria-expanded={verFuentes} onClick={() => setVerFuentes(!verFuentes)}>{t("creFuentesBtn")}</button>
          <button onClick={() => { tap(); onClose && onClose(); }} aria-label={t("creCerrar")}
            style={{ width: 34, height: 34, borderRadius: "50%", border: "1.5px solid rgba(255,255,255,0.2)", background: "rgba(0,0,0,0.35)", color: T.t2, fontSize: 14, fontWeight: 900, cursor: "pointer", fontFamily: "'Nunito',sans-serif" }}>✕</button>
        </div>
      </div>
      <div className="cre-scroll" style={{ flex: 1, overflowY: "auto", overflowX: "hidden", WebkitOverflowScrolling: "touch", padding: "4px 14px calc(24px + env(safe-area-inset-bottom, 0px))" }}>
        {verFuentes && (
          <section className="cre-card" data-cre="fuentes">
            <div className="cre-tit">{t("creFuentesTit")}</div>
            <div style={{ font: "500 11.5px 'DM Sans',sans-serif", color: T.t2 }}>{t("creFuentesIntro")}</div>
            <ol className="cre-fuentes">{FUENTES.map((f) => <li key={f.id}>{f.texto}{f.pmid ? " · PMID " + f.pmid : ""}</li>)}</ol>
          </section>
        )}
        {resumen()}
        {pintarSalud()}
        {pintarTu()}
        {calc.tipo === "ok" && <>{pintarModo()}{pintarDeposito()}{pintarProbar()}{pintarTomar()}</>}
        <p className="cre-legal">{t("creLegal")}</p>
      </div>
    </div>
  );
}
