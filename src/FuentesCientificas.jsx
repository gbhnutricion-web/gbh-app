// ═══ FUENTES CIENTÍFICAS (7-nov-2026) ═══
// Apple, revisión del 4-nov (directriz 1.4.1): «la app da recomendaciones de salud sin citar sus fuentes».
// Esta pantalla reúne, por tema, de dónde sale cada recomendación de la app, con enlace a la fuente original.
// Se abre desde «Tú» y desde cada pantalla que recomienda algo (objetivo, misiones, pliegues, ciclo, cafeína,
// creatina): abrirFuentes("tema") lanza un evento y App la pinta encima. Por orden de Alejandro (7-nov),
// PEND-2026-319. Cada DOI se comprobó el 7-nov contra Crossref, y cada PMID contra E-utilities de NCBI.
// 11-nov-2026 (Apple 2.1(a), revisión de la 111: «the button was unresponsive»): la fila de «Tú» vive dentro de
// la ficha de perfil (capa 11000) y esta pantalla salía en la 9500, DEBAJO. Ahora va a document.body con un
// portal y en la capa 13000, por encima de cualquier capa de la app (la más alta es 12000).
import React, { useEffect, useRef } from "react";
import { createPortal } from "react-dom";

export const abrirFuentes = (tema) => {
  try { window.dispatchEvent(new CustomEvent("gbh:fuentes", { detail: { tema: tema || null } })); } catch { /* sin ventana */ }
};

const TEMAS = [
  {
    id: "energia", icono: "🔥",
    titulo: { es: "Calorías y objetivo de peso", en: "Calories and weight goal" },
    que: {
      es: "El metabolismo basal se calcula con la ecuación de Mifflin-St Jeor y se multiplica por tu nivel de actividad. El ajuste para llegar a tu peso objetivo es aproximado, y la app no baja nunca de 1.200 kcal al día en mujeres ni de 1.500 en hombres.",
      en: "Basal metabolism uses the Mifflin-St Jeor equation, multiplied by your activity level. The adjustment to reach your goal weight is approximate, and the app never goes below 1,200 kcal a day for women or 1,500 for men.",
    },
    refs: [
      { t: "Mifflin MD, St Jeor ST, Hill LA, et al. A new predictive equation for resting energy expenditure in healthy individuals. Am J Clin Nutr. 1990;51(2):241-247.", u: "https://doi.org/10.1093/ajcn/51.2.241" },
      { t: "FAO/WHO/UNU. Human energy requirements. Report of a Joint FAO/WHO/UNU Expert Consultation. FAO Food and Nutrition Technical Report Series 1. Rome; 2004.", u: "https://www.fao.org/4/y5686e/y5686e00.htm" },
      { t: "Hall KD, Sacks G, Chandramohan D, et al. Quantification of the effect of energy imbalance on bodyweight. Lancet. 2011;378(9793):826-837.", u: "https://doi.org/10.1016/S0140-6736(11)60812-X" },
      { t: "National Institutes of Health. Clinical guidelines on the identification, evaluation, and treatment of overweight and obesity in adults: the evidence report. Obes Res. 1998;6(Suppl 2):51S-209S.", u: "https://pubmed.ncbi.nlm.nih.gov/9813653/" },
    ],
  },
  {
    id: "habitos", icono: "🩺",
    titulo: { es: "Misiones del día: agua, sueño y pasos", en: "Daily missions: water, sleep and steps" },
    que: {
      es: "La EFSA fija como ingesta adecuada 2,0 L de agua al día en mujeres y 2,5 L en hombres, contando la que llega con la comida: de ahí la meta de 1,5-2 L de bebida. Dormir al menos 7 horas es la recomendación de las sociedades de medicina del sueño. Y con los pasos, en menores de 60 años el beneficio sobre la mortalidad sigue creciendo hasta los 8.000-10.000 al día.",
      en: "EFSA sets an adequate intake of 2.0 L of water a day for women and 2.5 L for men, including what comes with food: hence the 1.5-2 L drinking goal. Sleeping at least 7 hours is the recommendation of the sleep medicine societies. And for steps, in adults under 60 the benefit on mortality keeps growing up to 8,000-10,000 a day.",
    },
    refs: [
      { t: "EFSA Panel on Dietetic Products, Nutrition and Allergies (NDA). Scientific Opinion on Dietary Reference Values for water. EFSA Journal. 2010;8(3):1459.", u: "https://doi.org/10.2903/j.efsa.2010.1459" },
      { t: "Watson NF, Badr MS, Belenky G, et al. Recommended amount of sleep for a healthy adult: a joint consensus statement of the American Academy of Sleep Medicine and Sleep Research Society. Sleep. 2015;38(6):843-844.", u: "https://doi.org/10.5665/sleep.4716" },
      { t: "Paluch AE, Bajpai S, Bassett DR, et al. Daily steps and all-cause mortality: a meta-analysis of 15 international cohorts. Lancet Public Health. 2022;7(3):e219-e228.", u: "https://doi.org/10.1016/S2468-2667(21)00302-9" },
      { t: "Bull FC, Al-Ansari SS, Biddle S, et al. World Health Organization 2020 guidelines on physical activity and sedentary behaviour. Br J Sports Med. 2020;54(24):1451-1462.", u: "https://doi.org/10.1136/bjsports-2020-102955" },
    ],
  },
  {
    id: "grasa", icono: "📏",
    titulo: { es: "Pliegues y % de grasa", en: "Skinfolds and body fat %" },
    que: {
      es: "El % de grasa se estima con la ecuación de 7 pliegues de Jackson y Pollock, que da la densidad corporal, y la fórmula de Siri. Es una estimación con un error de unos ±3-4 puntos: sirve para comparar dos tomas, no como cifra exacta.",
      en: "Body fat % is estimated with the Jackson and Pollock 7-site skinfold equation, which gives body density, and the Siri formula. It is an estimate with an error of about ±3-4 points: useful for comparing two takes, not as an exact figure.",
    },
    refs: [
      { t: "Jackson AS, Pollock ML. Generalized equations for predicting body density of men. Br J Nutr. 1978;40(3):497-504.", u: "https://doi.org/10.1079/BJN19780152" },
      { t: "Jackson AS, Pollock ML, Ward A. Generalized equations for predicting body density of women. Med Sci Sports Exerc. 1980;12(3):175-181.", u: "https://doi.org/10.1249/00005768-198023000-00009" },
      { t: "Siri WE. Body composition from fluid spaces and density: analysis of methods (1961). Reprinted in Nutrition. 1993;9(5):480-491.", u: "https://pubmed.ncbi.nlm.nih.gov/8286893/" },
    ],
  },
  {
    id: "ciclo", icono: "🌸",
    titulo: { es: "Ciclo y báscula", en: "Cycle and scale" },
    que: {
      es: "El peso esperado «con retención» suma agua en las dos semanas antes de la regla: los líquidos se retienen más en la segunda mitad del ciclo y llegan a su máximo al empezar la regla.",
      en: "The expected weight «with retention» adds water in the two weeks before your period: fluid retention rises in the second half of the cycle and peaks when the period starts.",
    },
    refs: [
      { t: "White CP, Hitchcock CL, Vigna YM, Prior JC. Fluid retention over the menstrual cycle: 1-year data from the Prospective Ovulation Cohort. Obstet Gynecol Int. 2011;2011:138451.", u: "https://doi.org/10.1155/2011/138451" },
    ],
  },
  {
    id: "densidad", icono: "🚦",
    titulo: { es: "Densidad calórica", en: "Energy density" },
    que: {
      es: "El semáforo clasifica cada plato por sus kcal por gramo: a igual cantidad de comida, los platos de baja densidad aportan menos calorías.",
      en: "The traffic light ranks each dish by its kcal per gram: for the same amount of food, low-density dishes provide fewer calories.",
    },
    refs: [
      { t: "Rolls BJ. The relationship between dietary energy density and energy intake. Physiol Behav. 2009;97(5):609-615.", u: "https://doi.org/10.1016/j.physbeh.2009.03.011" },
    ],
  },
  {
    id: "cafeina", icono: "☕",
    titulo: { es: "Cafeína", en: "Caffeine" },
    que: {
      es: "Las dosis, el momento y los topes de seguridad de la calculadora de cafeína. Cada número lleva su fuente en el apartado «De dónde sale» de la calculadora, y el modelo completo está publicado.",
      en: "The doses, timing and safety limits of the caffeine calculator. Each number has its source in the calculator's «Where does it come from» section, and the full model is published.",
    },
    refs: [
      { t: "EFSA Panel on Dietetic Products, Nutrition and Allergies (NDA). Scientific Opinion on the safety of caffeine. EFSA Journal. 2015;13(5):4102.", u: "https://doi.org/10.2903/j.efsa.2015.4102" },
      { t: "EFSA Panel on Dietetic Products, Nutrition and Allergies (NDA). Scientific Opinion on the substantiation of health claims related to caffeine and increased alertness and attention. EFSA Journal. 2011;9(4):2054.", u: "https://doi.org/10.2903/j.efsa.2011.2054" },
      { t: "Guest NS, VanDusseldorp TA, Nelson MT, et al. International society of sports nutrition position stand: caffeine and exercise performance. J Int Soc Sports Nutr. 2021;18(1):1.", u: "https://doi.org/10.1186/s12970-020-00383-4" },
      { t: "Gardiner C, Weakley J, Burke LM, et al. The effect of caffeine on subsequent sleep: a systematic review and meta-analysis. Sleep Med Rev. 2023;69:101764.", u: "https://doi.org/10.1016/j.smrv.2023.101764" },
      { t: "GBH Nutrición. Modelo de cafeína de la App (septiembre 2026).", u: "https://drive.google.com/file/d/1HKGHkNCe0TPLPmbRVf4MpLGDOWIl4Lk2/view" },
    ],
  },
  {
    id: "creatina", icono: "💪",
    titulo: { es: "Creatina", en: "Creatine" },
    que: {
      es: "La dosis sale de la posición de la Sociedad Internacional de Nutrición Deportiva (ISSN). El día en que se llena tu músculo, de un metaanálisis de 10 estudios que miden la creatina del músculo, publicado por GBH.",
      en: "The dose comes from the International Society of Sports Nutrition (ISSN) position stand. The day your muscle fills up comes from a meta-analysis of 10 studies that measure muscle creatine, published by GBH.",
    },
    refs: [
      { t: "Kreider RB, Kalman DS, Antonio J, et al. International Society of Sports Nutrition position stand: safety and efficacy of creatine supplementation in exercise, sport, and medicine. J Int Soc Sports Nutr. 2017;14:18.", u: "https://doi.org/10.1186/s12970-017-0173-z" },
      { t: "GBH Nutrición. Modelo de creatina de la App (octubre 2026).", u: "https://drive.google.com/file/d/1xmxgmpeWBA_EYMgbDO9l1LpgeeD4CJpP/view" },
    ],
  },
];

const TXT = {
  es: {
    titulo: "📚 Fuentes científicas",
    intro: "De dónde sale cada recomendación de la app. Toca una referencia para abrir la fuente original.",
    aviso: "La información de la app es orientativa y no sustituye el consejo de tu médico ni de tu dietista-nutricionista. Consulta con tu médico antes de cambiar tu alimentación o empezar un suplemento, y siempre si tienes una enfermedad, estás embarazada o das el pecho.",
    cerrar: "Cerrar",
    abrir: "Abrir la fuente",
  },
  en: {
    titulo: "📚 Scientific sources",
    intro: "Where each recommendation in the app comes from. Tap a reference to open the original source.",
    aviso: "The information in the app is for guidance and does not replace advice from your doctor or your dietitian. Check with your doctor before changing your diet or starting a supplement, and always if you have a medical condition, are pregnant or breastfeeding.",
    cerrar: "Close",
    abrir: "Open the source",
  },
};

export function FuentesCientificas({ tema, lang = "es", T, onClose }) {
  const L = TXT[lang] || TXT.es;
  const ref = useRef(null);
  useEffect(() => {
    if (!tema || !ref.current) return;
    const el = ref.current.querySelector(`[data-tema="${tema}"]`);
    if (el) el.scrollIntoView({ block: "start" });
  }, [tema]);
  const c = T || {};
  const cuerpo = (
    <div role="dialog" aria-modal="true" aria-label={L.titulo}
      style={{ position: "fixed", inset: 0, zIndex: CAPA_FUENTES, background: "rgba(0,0,0,0.86)", display: "flex", justifyContent: "center",
        padding: "calc(12px + env(safe-area-inset-top, 0px)) 14px calc(12px + env(safe-area-inset-bottom, 0px))" }}>
      <div style={{ width: "100%", maxWidth: 420, display: "flex", flexDirection: "column", background: "linear-gradient(180deg,#16301a,#0e2112)",
        border: `2px solid ${c.bW || "rgba(255,255,255,0.15)"}`, borderRadius: 22, overflow: "hidden" }}>
        <div style={{ display: "flex", alignItems: "center", gap: 10, padding: "14px 16px", borderBottom: "1px solid rgba(255,255,255,0.08)" }}>
          <div style={{ flex: 1, fontSize: 17, fontWeight: 900, color: c.t1 || "#fff", fontFamily: "'Nunito',sans-serif" }}>{L.titulo}</div>
          <button onClick={onClose} aria-label={L.cerrar}
            style={{ width: 34, height: 34, borderRadius: "50%", border: "1.5px solid rgba(255,255,255,0.2)", background: "rgba(0,0,0,0.3)",
              color: c.t2 || "#cfd8cf", fontSize: 15, fontWeight: 900, cursor: "pointer", flexShrink: 0 }}>✕</button>
        </div>
        <div ref={ref} style={{ overflowY: "auto", WebkitOverflowScrolling: "touch", padding: "12px 16px 18px" }}>
          <div style={{ fontSize: 13, color: c.t2 || "#cfd8cf", lineHeight: 1.55, fontFamily: "'DM Sans',sans-serif", marginBottom: 10 }}>{L.intro}</div>
          <div style={{ fontSize: 12, color: c.t1 || "#fff", lineHeight: 1.55, fontFamily: "'DM Sans',sans-serif", marginBottom: 16,
            background: "rgba(255,200,80,0.08)", border: "1px solid rgba(255,200,80,0.3)", borderRadius: 12, padding: "10px 12px" }}>⚕️ {L.aviso}</div>
          {TEMAS.map((s) => (
            <div key={s.id} data-tema={s.id} style={{ marginBottom: 18, scrollMarginTop: 8 }}>
              <div style={{ fontSize: 15, fontWeight: 900, color: c.au1 || "#f5c542", fontFamily: "'Nunito',sans-serif", marginBottom: 6 }}>{s.icono} {s.titulo[lang] || s.titulo.es}</div>
              <div style={{ fontSize: 12.5, color: c.t2 || "#cfd8cf", lineHeight: 1.55, fontFamily: "'DM Sans',sans-serif", marginBottom: 8 }}>{s.que[lang] || s.que.es}</div>
              {s.refs.map((r, i) => (
                <a key={i} href={r.u} target="_blank" rel="noopener noreferrer" aria-label={`${L.abrir}: ${r.t}`}
                  style={{ display: "block", textDecoration: "none", background: "rgba(255,255,255,0.04)", border: "1px solid rgba(255,255,255,0.10)",
                    borderRadius: 12, padding: "9px 11px", marginBottom: 6 }}>
                  <span style={{ display: "block", fontSize: 11.5, color: c.t1 || "#fff", lineHeight: 1.5, fontFamily: "'DM Sans',sans-serif" }}>{r.t}</span>
                  <span style={{ display: "block", fontSize: 11, color: c.g2 || "#4dc97a", marginTop: 3, fontFamily: "'DM Sans',sans-serif", wordBreak: "break-all" }}>🔗 {r.u.replace(/^https:\/\//, "")}</span>
                </a>
              ))}
            </div>
          ))}
        </div>
      </div>
    </div>
  );
  return typeof document !== "undefined" && document.body ? createPortal(cuerpo, document.body) : cuerpo;
}

// Capa de la pantalla: por encima de todas las de la app (la ficha de perfil es 11000; la más alta, 12000).
export const CAPA_FUENTES = 13000;

// Enlace pequeño «📚 Fuentes» para poner debajo de cualquier recomendación.
export function EnlaceFuentes({ tema, lang = "es", T, style }) {
  const c = T || {};
  return (
    <button onClick={() => abrirFuentes(tema)}
      style={{ background: "none", border: "none", padding: "4px 2px", cursor: "pointer", color: c.g2 || "#4dc97a",
        fontSize: 11.5, fontWeight: 800, fontFamily: "'DM Sans',sans-serif", textDecoration: "underline", ...(style || {}) }}>
      📚 {lang === "en" ? "Sources" : "Fuentes"}
    </button>
  );
}
