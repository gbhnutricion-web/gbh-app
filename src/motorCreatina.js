// ═══ Motor de la calculadora de creatina de GBH Nutrición (fase 0, oct-2026) ═══
// Un depósito de creatina en el músculo de cada paciente, en pasos de 1 h:
//  · entra lo que el músculo capta de cada toma, menos cuanto más cerca está del techo;
//  · sale la que pasa a creatinina (k_deg · C), y la síntesis propia + la dieta sostienen el basal;
//  · tomando creatina, la síntesis puede frenarse («freno», que solo vale ≠ 0 si la calibración lo pidió).
// Sin dependencias. Unidades: días; gramos de creatina en el depósito; gramos de MONOHIDRATO en las tomas
// (lo que pone la etiqueta). Los textos viven en la pantalla. De dónde sale cada número: FUENTES_creatina.md.
// En el repo de la app vive como src/motorCreatina.js: nunca src/creatina.js, que choca con Creatina.jsx en Mac.

export const MW = { creatina: 131.13, monohidrato: 149.15 };      // g/mol
export const CRM_A_CR = MW.creatina / MW.monohidrato;             // 1 g de monohidrato = 0,8792 g de creatina
export const MMOL_A_G = MW.creatina / 1000;                       // g de creatina por mmol

// Los tres bloques siguientes los escribe fijar_parametros_creatina.py: no editar a mano.
// <PARAM>
export const PARAM = {"kdeg": 0.017, "msMh": 0.242, "basalMmol": {"omnivoro": 120.2, "vegetariano": 108.2}, "fMagra": {"M": 0.487, "F": 0.452}, "fmax": 0.439529660120383, "n": 0.200000005403768, "thetaR": -1.61990101597924, "techoRel": 1.19791828886207, "omegaR": 0.225510408166673, "freno": 0, "kfreno": 0.15};
// </PARAM>
// <INTERACCIONES>
export const INTERACCIONES = [{"id": "aine", "patron": "ibuprofen|naprox|diclofen|aceclofen|ketoprofen|ketorolac|indomet(h)?ac|acemetac|sulindac|meloxicam|piroxicam|tenoxicam|lornoxicam|droxicam|celecoxib|etoricoxib|parecoxib|nabumeton|etodolac|mef[eé]n[aá]mic|nifl[uú]mic|morniflumat|flurbiprofen|clonixin|fenilbutazon|phenylbutazon|nimesulid|tiaprofen|fenbufen|fenoprofen|tolmetin|\\baines?\\b|antiinflamatori|anti-inflamatori|\\bacoxxel|\\bactromadol|\\badoldex|\\badolquir|\\bairtal|\\balgidrin|\\balgifast|\\baliviosin|\\bantalgin|\\bapirofeno|\\baracenac|\\barcoxia|\\bartilog|\\bartrinovo|\\bartrotec|\\bastefor|\\batriscal|\\baxatal|\\bcelebrex|\\bcelenib|\\bcoslan|\\bdagesil|\\bdalsy|\\bdalsydol|\\bdekendol|\\bdexdoless|\\bdexigen|\\bdifenadex|\\bdifenadol|\\bdiltix|\\bdolalgial|\\bdolkeflex|\\bdolo[- ]?voltaren|\\bdolorac|\\bdolotren|\\bdolovanz|\\bdynastat|\\benandol|\\benanplus|\\benantyum|\\bendolex|\\bespididol|\\bespidifen|\\bexxiv|\\bfastum|\\bfebrirol|\\bfeldene|\\bfenodex|\\bgeloprofen|\\bgerbin|\\biblasin|\\bibudol|\\bibufarmalid|\\bibufen|\\bibukern|\\bibuthek|\\binacid|\\bketesse|\\bliderfeme|\\blundiran|\\bmeticel|\\bmovalis|\\bnaprosyn|\\bneobrufen|\\bniflactol|\\bnorvectan|\\bnurofen|\\borudis|\\bpirexin|\\bpoindol|\\brelif|\\breutenox|\\bseractil|\\bsinusvicks|\\bsolibu|\\btoradol|\\btorixib|\\bvelyntra|\\bvimovo|\\bvoltaren"}, {"id": "litio", "patron": "\\blitio\\b|lithium|\\bplenur"}, {"id": "aminoglucosido", "patron": "gentamic|tobramic|amikac|amicac|estreptomic|streptomyc|kanamic|netilmic|plazomic|\\bbramitob|\\bgenta|\\btobi\\s*podhaler|\\bvantobra"}, {"id": "inhibidor_calcineurina", "patron": "ciclospor|cyclospor|tacrolim|voclospor|\\badoport|\\badvagraf|\\bciqorin|\\bconferoport|\\benvarsus|\\blupkynis|\\bmodigraf|\\bprograf|\\bsandimmun|\\btacforius"}, {"id": "diuretico", "patron": "furosem|torasem|bumetan|piretan|tiazid|thiazid|clortalid|chlort(h)?alid|indapam|xipam|espironolact|spironolact|eplerenon|amilorid|triamter|clopamid|altizid|metolazon|canreno|\\bdiur[eé]tic|\\bacediur|\\bacetensil\\s*plus|\\balbis\\s*plus|\\baldactacine|\\baldactone|\\baldoleo|\\bameride|\\batacand\\s*plus|\\batolme\\s*plus|\\bbalzak\\s*plus|\\bbaripril\\s*diu|\\bbipreterax|\\bblokium[- ]?diu|\\bblopress\\s*forte|\\bblopress\\s*plus|\\bcamlad|\\bcapenon\\s*hct|\\bco[- ]?diovan|\\bco[- ]?renitec|\\bco[- ]?vals|\\bcoaprovel|\\bcozaar\\s*plus|\\bdabonal\\s*plus|\\bdafiro\\s*hct|\\bdilutol|\\bdiurex|\\bdiuzine|\\bdoneka\\s*plus|\\belecor|\\bemcoretic|\\besidrex|\\bexforge\\s*hct|\\bfordiuran|\\bfortzaar|\\bfositens\\s*plus|\\bfuturan\\s*plus|\\bgaduar|\\bhidrosaluretil|\\bhigrotona|\\bifirmacombi|\\bimbarix|\\binhibace|\\binspra|\\bisodiur|\\bixia\\s*plus|\\bkalpress\\s*plus|\\bkarbicombi|\\bkarvezide|\\blavestra|\\blidaltrin\\s*diu|\\blobivon\\s*plus|\\bmicardisplus|\\bmiten\\s*plus|\\bnavixen\\s*plus|\\bolmetec\\s*plus|\\bopenvas\\s*plus|\\bparapres\\s*plus|\\bpreterax|\\bprinivil\\s*plus|\\bpritorplus|\\bregulaten\\s*plus|\\brenitecmax|\\bsalidur|\\bseguril|\\bsevikar\\s*hct|\\bsilostar\\s*plus|\\bsutril|\\btarlodix\\s*plus|\\btenoretic|\\btensikey|\\btertensif|\\btevetens\\s*plus|\\btolucombi|\\bvalotensix\\s*plus|\\bviacorlix|\\bzestoretic"}, {"id": "otro_nefrotoxico", "patron": "vancomic|anfoteric|amfoteric|amphoteric|cisplat|carboplat|nedaplat|metotrex|methotrex|pemetrex|tenofov|cidofov|adefov|entecav|indinav|atazanav|\\babelcet|\\balimta|\\bambisome|\\barmisarte|\\bbaraclude|\\bbertanel|\\bbiktarvy|\\bdescovy|\\beviplera|\\bevotaz|\\bgenvoya|\\bimeth|\\bjiax\\s*semanal|\\bmethofill|\\bmetoject|\\bnordimet|\\bodefsey|\\bquinux|\\bstribild|\\bsymtuza|\\btruvada|\\bvangozyr|\\bvemlidy|\\bviread"}];
// </INTERACCIONES>
// <FUENTES>
export const FUENTES = [{"id": "kdeg", "texto": "Stimpson SA, Leonard MS, Clifton LG et al. 2013, J Cachexia Sarcopenia Muscle 4:217-23 · secundaria: resume Fitch CD et al. 1968, Neurology 18:32-42 (ref. 11)", "pmid": "23797207"}, {"id": "f_magra_M", "texto": "Müller MJ, Bosy-Westphal A, Braun W, Wong MC, Shepherd JA, Heymsfield SB 2022, Nutrients 14 («What Is a 2021 Reference Body?»)", "pmid": "35406138"}, {"id": "f_magra_F", "texto": "Müller MJ, Bosy-Westphal A, Braun W, Wong MC, Shepherd JA, Heymsfield SB 2022, Nutrients 14 («What Is a 2021 Reference Body?»)", "pmid": "35406138"}, {"id": "ms_mh", "texto": "Sjøgaard G, Saltin B 1982, Am J Physiol 243:R271-80", "pmid": "7114288"}, {"id": "tcr_basal_omnivoro", "texto": "calculado: Burke 2003 (NV) · Balsom 1995 · Bellinger 2000 (Cr y placebo) · Finn 2001 (Cr y placebo) · Backx 2017 (placebo y Cr, corregidos por ATP) · Burke 2003b (grupo ALA)", "pmid": "14600563;7572228;11167307;11320642;28054322;14669930"}, {"id": "tcr_basal_vegetariano", "texto": "calculado: tcr_basal_omnivoro (120.2, fila de arriba) × Burke 2003 (117 / 130)", "pmid": "14600563"}, {"id": "tcr_techo", "texto": "calculado: Balsom 1995 · Bellinger 2000 · Finn 2001 · Backx 2017 (corregido por ATP) · Lukaszuk 2002 (omnívoros)", "pmid": "7572228;11167307;11320642;28054322;12432177"}, {"id": "agua_carga", "texto": "Glaister M, Rhodes L 2022, Int J Sport Nutr Exerc Metab 32:491-500 (revisión sistemática y metaanálisis)", "pmid": "36041731"}, {"id": "dosis", "texto": "ISSN 2017, Kreider et al., J Int Soc Sports Nutr 14:18 (PMID 28615996), e ISSN 2021, Antonio et al., J Int Soc Sports Nutr 18:13 (PMID 33557850)", "pmid": ""}, {"id": "aviso_bascula", "texto": "ISSN 2021 (PMID 33557850): 1-3 kg en la carga de 20 g/día durante 5-7 días, sobre todo agua; ISSN 2017 (PMID 28615996): 0,5-1,0 L", "pmid": ""}, {"id": "aviso_analitica", "texto": "ISSN 2021 (PMID 33557850); Gualano 2010 (PMID 20060630); Longobardi 2023 (PMID 36986197); de Souza Almeida 2026, Int Urol Nephrol (PMID 42507286): creatinina +0,14 mg/dL y filtrado estimado con creatinina -10,75 mL/min, sin cambio con Cr-EDTA", "pmid": ""}, {"id": "aviso_hidratos", "texto": "Green 1996, Am J Physiol 271:E821 (PMID 8944667); Steenge 2000, J Appl Physiol 89:1165 (PMID 10956365); límite: no sube el máximo, Antonio 2025 (PMID 39720835)", "pmid": ""}, {"id": "aviso_hora", "texto": "Ribeiro 2021, Nutrients 13:2844 (PMID 34445003); Candow 2022, Front Sports Act Living 4:893714 (PMID 35669557); Antonio 2025 (PMID 39720835)", "pmid": ""}, {"id": "aviso_no_responden", "texto": "Greenhaff 1994, Am J Physiol 266:E725 (PMID 8203511); Harris 1992, Clin Sci 83:367 (PMID 1327657); Syrotuik y Bell 2004, J Strength Cond Res 18:610 (PMID 15320650); Ribeiro 2021 (PMID 34445003)", "pmid": ""}];
// </FUENTES>

export const LLENO = 0.9;         // «lleno»: al 90 % del camino entre el basal y el techo (fijado antes de calibrar)
export const VUELTA = 0.1;        // «vuelve a su nivel»: le queda menos del 10 % de lo ganado
export const BANDA_Z = 1.645;     // franja del 90 % ENTRE ESTUDIOS (η = ±1,645 ω del MBMA): lo que cambia la media de un estudio a otro, no una persona
export const CACITO_G = 5;        // g de monohidrato por cacito, salvo que la etiqueta diga otra cosa
export const HORAS_TOMAS = { 1: [8], 2: [8, 14], 3: [8, 14, 21], 4: [8, 14, 17, 21] };
export const TOPES = { cargaGkg: 0.3, cargaTomas: 4, cargaDiasMin: 5, cargaDiasMax: 7, mantMin: 3, mantMax: 5, mantMaxGrande: 10, pruebaMin: 1 };
export const MODOS = ['rapido', 'sinPrisa', 'yaLaToma'];
// Plazos MEDIDOS en la bibliografía (enmienda del 5-oct-2026). Desde el metaanálisis basado en modelo (MBMA), que pasó la
// validación cruzada, el día de lleno sale del modelo con su franja entre estudios; el LAVADO sigue saliendo de aquí, porque
// el modelo no quedó validado al dejarla (falsación 2: vuelve mucho más despacio de lo medido).
export const PLAZOS = {
  carga: { dias: [5, 7], fuente: 'ISSN 2017 (PMID 28615996); Hultman 1996 (PMID 8828669): meseta tras 5-6 días de carga' },
  sinCarga: { semanas: 4, fuente: 'Hultman 1996: 28 días con 3 g/día; ISSN 2021 (PMID 33557850): 3-5 g/día durante al menos 4 semanas' },
  lavado: { semanas: [4, 6], fuente: 'ISSN 2017 y 2021: 4-6 semanas para dejar de notarse; volver del todo tarda más (Hultman 1996; Preen 2003)' },
};
export const AGE_MID = { '18-25': 21, '26-35': 30, '36-45': 40, '46-55': 50, '56-65': 60, '65+': 70 };   // como MedidasCorporales.jsx
export const CRIBADO = ['rinon', 'embarazo', 'menor', 'reaccion'];
export const DEF_ESTUDIO = { M: { peso: 75, grasa: 15 }, F: { peso: 62, grasa: 25 }, mixto: { peso: 70, grasa: 20 } };   // PROTOCOLO.md

// ═════ Lo que la app ya sabe del paciente: no se pregunta ═════

// % graso por Jackson-Pollock de 7 pliegues + Siri: la MISMA fórmula que grasaJP7 de MedidasCorporales.jsx.
export function grasaJP7Siri(suma, edad, sexo) {
  if (!(suma > 0) || !(edad > 0) || (sexo !== 'M' && sexo !== 'F')) return null;
  const d = sexo === 'F'
    ? 1.097 - 0.00046971 * suma + 0.00000056 * suma * suma - 0.00012828 * edad
    : 1.112 - 0.00043499 * suma + 0.00000055 * suma * suma - 0.00028826 * edad;
  return 495 / d - 450;
}
// % graso estimado con el IMC, la edad y el sexo (Deurenberg 1991), cuando no hay pliegues.
export function grasaDeurenberg(imc, edad, sexo) {
  if (!(imc > 0) || !(edad > 0) || (sexo !== 'M' && sexo !== 'F')) return null;
  return 1.2 * imc + 0.23 * edad - 10.8 * (sexo === 'M' ? 1 : 0) - 5.4;
}
// Peso actual: el último pesaje (weight_logs: { log_date, weight_kg }); si no hay, el del alta (igual que cafeina.js).
export function pesoActual(registros = [], pesoInicial = null) {
  const r = (registros || []).map((x) => ({ fecha: String(x.log_date || x.fecha || ''), peso: parseFloat(x.weight_kg ?? x.peso ?? x.weight) }))
    .filter((x) => x.fecha && x.peso >= 30 && x.peso <= 250).sort((a, b) => (a.fecha < b.fecha ? -1 : a.fecha > b.fecha ? 1 : 0));
  if (r.length) return { peso: r[r.length - 1].peso, origen: 'pesaje', fecha: r[r.length - 1].fecha };
  const p0 = parseFloat(pesoInicial);
  return p0 >= 30 && p0 <= 250 ? { peso: p0, origen: 'alta', fecha: null } : { peso: null, origen: null, fecha: null };
}
const nombreMed = (it) => (typeof it === 'string' ? it : [it && (it.nombre ?? it.Nombre ?? it.name), it && (it.dosis ?? it.Dosis), it && (it.notas ?? it.Notas)].filter(Boolean).join(' ')).toString();
// ¿Toma ya creatina según su plan? Un suplemento con «creatin» en el nombre, y los gramos de su dosis.
export function creatinaDelPlan(lista = []) {
  for (const it of lista || []) {
    const n = nombreMed(it);
    if (!/creatin/i.test(n)) continue;
    const m = n.match(/(\d+(?:[.,]\d+)?)\s*(mg|miligramos?|gramos?|gr|g)\b/i);
    if (!m) return { g: null, item: n.trim() };
    const x = parseFloat(m[1].replace(',', '.')) / (/^m/i.test(m[2]) ? 1000 : 1);
    return { g: x > 0 && x <= 30 ? x : null, item: n.trim() };
  }
  return null;
}
const RE_INTER = () => INTERACCIONES.map((x) => ({ id: x.id, re: new RegExp(x.patron, 'i') }));
// Medicación del plan que carga el riñón (lista verificada en creatina_bibliografia/seguridad.json): bloquea y deriva.
export function interaccionesDe(lista = []) {
  const out = [], res = RE_INTER();
  for (const it of lista || []) { const n = nombreMed(it); for (const x of res) if (x.re.test(n)) out.push({ id: x.id, item: n.trim() }); }
  return out;
}
// Del registro de la app al perfil del motor. `habitos` es lo que la app NO sabe (edad si falta la franja,
// vegetariano en premium): se pregunta una vez y se guarda en el teléfono.
export function perfilDesdeApp({ sexo = null, alturaCm = null, ageRange = null, registrosPeso = [], pesoInicial = null, sumaPliegues = null, tipoDieta = null, suplementos = [] } = {}, habitos = {}) {
  const pa = pesoActual(registrosPeso, pesoInicial);
  const edad = AGE_MID[ageRange] ?? (habitos.edad > 0 ? habitos.edad : null);
  const alt = parseFloat(alturaCm), imc = pa.peso && alt > 120 && alt < 230 ? pa.peso / Math.pow(alt / 100, 2) : null;
  let grasa = grasaJP7Siri(parseFloat(sumaPliegues), edad, sexo), origenGrasa = grasa != null ? 'pliegues' : null;
  if (grasa == null) { grasa = grasaDeurenberg(imc, edad, sexo); origenGrasa = grasa != null ? 'estimada' : null; }
  const dieta = tipoDieta === 'Vegetariana' || tipoDieta === 'Vegana' ? 'vegetariano' : tipoDieta ? 'omnivoro'
    : habitos.vegetariano === true ? 'vegetariano' : habitos.vegetariano === false ? 'omnivoro' : null;
  const faltan = [];
  if (!pa.peso) faltan.push('peso');
  if (sexo !== 'M' && sexo !== 'F') faltan.push('sexo');
  if (grasa == null) { if (!edad) faltan.push('edad'); if (!imc) faltan.push('altura'); }
  if (!dieta) faltan.push('dieta');
  return {
    perfil: { peso: pa.peso, sexo, grasaPct: grasa, dieta: dieta || 'omnivoro', descarga: tipoDieta === 'Descarga' },
    datos: { peso: pa, edad, imc, origenGrasa, dieta, menor: ageRange ? false : null, creatinaPlan: creatinaDelPlan(suplementos), interacciones: interaccionesDe(suplementos), faltan },
  };
}

// ═════ El modelo ═════

// Techo relativo r = 1 + exp(θr + η) del MBMA: con η = 0, el típico (PARAM.techoRel, tal cual lo escribió R).
export const techoRelDe = (eta = 0) => (eta === 0 ? PARAM.techoRel : 1 + Math.exp(PARAM.thetaR + eta));
// El depósito de ESTA persona: músculo M (kg), basal B y techo T (g de creatina). `eta` mueve el techo dentro de la franja entre estudios.
export function paciente(perfil = {}, eta = 0) {
  const peso = +perfil.peso, g = +perfil.grasaPct, sexo = perfil.sexo;
  if (!(peso >= 30 && peso <= 250) || !(g >= 3 && g <= 60) || (sexo !== 'M' && sexo !== 'F')) return null;
  const M = peso * (1 - g / 100) * PARAM.fMagra[sexo], k = MMOL_A_G * PARAM.msMh * M;
  const basal = PARAM.basalMmol[perfil.dieta === 'vegetariano' ? 'vegetariano' : 'omnivoro'];
  // Techo relativo (enmienda del 5-oct-2026): r × el basal OMNÍVORO para todos; el vegetariano parte más bajo y llega al mismo techo.
  return { M, k, B: basal * k, T: techoRelDe(eta) * PARAM.basalMmol.omnivoro * k, kdeg: PARAM.kdeg, fmax: PARAM.fmax, n: PARAM.n, freno: PARAM.freno, kfreno: PARAM.kfreno };
}
// Cuánto capta el músculo de una toma, de 1 (en el basal o por debajo) a 0 (en el techo).
export function saturacion(C, pac) {
  return Math.pow(Math.min(1, Math.max(0, (pac.T - C) / (pac.T - pac.B))), pac.n);
}
// Una pauta es una lista de tramos { desde, hasta, g, tomas }: g de monohidrato al día, en `tomas` tomas.
export function tomasDelDia(pauta, d) {
  for (const t of pauta || []) if (d >= t.desde && d < (t.hasta ?? Infinity) && t.g > 0) return { g: t.g, tomas: t.tomas || 1 };
  return null;
}
// «20x6@4+2x30»: 20 g/día 6 días en 4 tomas, y luego 2 g/día 30 días. Sin «@», 4 tomas desde 10 g y 1 por debajo.
export function parsePauta(s) {
  let d0 = 0; const out = [];
  for (let x of String(s).split('+')) {
    let tomas = null;
    if (x.includes('@')) { tomas = parseInt(x.split('@')[1], 10); x = x.split('@')[0]; }
    const [g, dias] = x.split('x').map(Number);
    out.push({ desde: d0, hasta: d0 + dias, g, tomas: tomas ?? (g >= 10 ? 4 : 1) });
    d0 += dias;
  }
  return out;
}
// Día a día, en pasos de 1 h; las tomas, a las horas de HORAS_TOMAS. Entre una hora y la siguiente la solución
// es exacta: dC/dt = k_deg·(B·(1 − freno·z) − C), con z en el punto medio de la hora. Igual que calibrar_creatina.R.
export function simular(pac, pauta, { dias = 84, C0 = null, z0 = 0 } = {}) {
  let C = C0 == null ? pac.B : C0, z = z0;
  const eK = Math.exp(-pac.kdeg / 24), eZ = Math.exp(-pac.kfreno / 24);
  const serie = [{ dia: 0, C, captado: 0, tirado: 0, z }];
  for (let d = 0; d < dias; d++) {
    const hoy = tomasDelDia(pauta, d), horas = hoy ? HORAS_TOMAS[Math.min(4, Math.max(1, hoy.tomas))] : [];
    const porToma = hoy ? hoy.g / horas.length : 0, obj = hoy ? 1 : 0;
    let captado = 0, tirado = 0;
    for (let h = 0; h < 24; h++) {
      if (horas.includes(h)) {
        const cr = porToma * CRM_A_CR, u = Math.min(cr * pac.fmax * saturacion(C, pac), Math.max(0, pac.T - C));
        C += u; captado += u; tirado += cr - u;
      }
      const z1 = obj + (z - obj) * eZ, Ceq = pac.B * (1 - pac.freno * (z + z1) / 2);
      C = Ceq + (C - Ceq) * eK;
      z = z1;
    }
    serie.push({ dia: d + 1, C, captado, tirado, z });
  }
  return serie;
}
export const umbralLleno = (pac) => pac.B + LLENO * (pac.T - pac.B);
export function diaLleno(serie, pac) { const u = umbralLleno(pac), x = serie.find((p) => p.C >= u - 1e-9); return x ? x.dia : null; }
// Tras dejarla el día `desde`: el primer día en que le queda menos del VUELTA de lo ganado.
export function diaVuelta(serie, pac, desde = 0) {
  const p0 = serie.find((p) => p.dia === desde); if (!p0) return null;
  const ganado = p0.C - pac.B; if (ganado <= 0) return 0;
  const x = serie.find((p) => p.dia > desde && p.C - pac.B <= VUELTA * ganado);
  return x ? x.dia - desde : null;
}
// Dónde se queda tomando g al día mucho tiempo (365 días desde el techo).
export function estacionario(pac, g, tomas = g >= 10 ? 4 : 1) {
  const s = simular(pac, [{ desde: 0, hasta: Infinity, g, tomas }], { dias: 365, C0: pac.T, z0: 1 }), u = s[s.length - 1];
  return { C: u.C, z: u.z };
}
// Mantenimiento: el menor número entero de g (de 3 a 10) que le mantiene lleno.
export function dosisMantenimiento(pac) {
  const u = umbralLleno(pac);
  for (let g = TOPES.mantMin; g <= TOPES.mantMaxGrande; g++) if (estacionario(pac, g).C >= u) return { g, alcanza: true };
  return { g: TOPES.mantMaxGrande, alcanza: false };
}
// Carga: 0,3 g/kg al día (al gramo, hacia abajo) en 4 tomas; el mínimo de días entre 5 y 7 que llena.
export function pautaCarga(pac, peso) {
  const g = Math.floor(TOPES.cargaGkg * peso), u = umbralLleno(pac);
  for (let d = TOPES.cargaDiasMin; d <= TOPES.cargaDiasMax; d++) {
    const s = simular(pac, [{ desde: 0, hasta: d, g, tomas: TOPES.cargaTomas }], { dias: d });
    if (s[d].C >= u) return { g, tomas: TOPES.cargaTomas, dias: d, llena: true };
  }
  return { g, tomas: TOPES.cargaTomas, dias: TOPES.cargaDiasMax, llena: false };
}
// Los plazos de las guías (PLAZOS): con carga, 5-7 días; sin carga, unas 4 semanas; si ya la toma con ≥ 3 g, lo que le falte
// hasta las 4 semanas (o ya lleno); al dejarla, 4-6 semanas para que deje de notarse. La pantalla dice el del lavado; el del
// llenado queda de referencia al lado del día del modelo.
export function plazosDe(modo, yaLaToma = null) {
  const lavado = { semanas: PLAZOS.lavado.semanas };
  if (modo === 'rapido') return { lleno: { dias: PLAZOS.carga.dias }, lavado };
  if (modo === 'yaLaToma' && yaLaToma && yaLaToma.g >= TOPES.mantMin) {
    const falta = PLAZOS.sinCarga.semanas * 7 - Math.max(0, Math.round(yaLaToma.dias || 0));
    return { lleno: falta <= 0 ? { ya: true } : { semanas: Math.ceil(falta / 7) }, lavado };
  }
  return { lleno: { semanas: PLAZOS.sinCarga.semanas }, lavado };
}
const tiradoUltimaSemana = (serie) => serie.slice(-7).reduce((a, p) => a + p.tirado, 0) / CRM_A_CR;   // en g de monohidrato
// La franja del día de lleno: la misma pauta con el techo de un estudio bajo (η = −zω) y el de uno alto (+zω); si ya la toma,
// también su historia con ese techo. null: no llega en `dias`. Es lo que cambia ENTRE ESTUDIOS: una persona puede quedar fuera.
export function franjaLleno(perfil, pauta, previa = null, dias = 84) {
  const w = BANDA_Z * PARAM.omegaR;
  const dia = (eta) => {
    const p = paciente(perfil, eta); let C0 = p.B, z0 = 0;
    if (previa) { const s = simular(p, previa.pauta, { dias: previa.dias }); C0 = s[previa.dias].C; z0 = s[previa.dias].z; }
    return diaLleno(simular(p, pauta, { dias, C0, z0 }), p);
  };
  return { pronto: dia(-w), tarde: dia(w) };
}

export function recomendar(perfil = {}, pet = {}) {
  const pac = paciente(perfil); if (!pac) return { error: 'faltan_datos' };
  let modo = MODOS.includes(pet.modo) ? pet.modo : 'rapido';
  const avisos = ['bascula', 'analitica'];
  if (perfil.descarga) { avisos.push('descarga'); if (modo === 'rapido') modo = 'sinPrisa'; }
  const mant = dosisMantenimiento(pac);
  let C0 = pac.B, z0 = 0, carga = null, pauta = [{ desde: 0, hasta: Infinity, g: mant.g, tomas: 1 }], previa = null;
  if (modo === 'yaLaToma') {
    const y = pet.yaLaToma || {}, g = y.g > 0 ? y.g : mant.g, dias = Math.max(0, Math.round(y.dias || 0));
    previa = { pauta: [{ desde: 0, hasta: dias, g, tomas: g >= 10 ? 4 : 1 }], dias };
    const previo = simular(pac, previa.pauta, { dias });
    C0 = previo[dias].C; z0 = previo[dias].z;
  } else if (modo === 'rapido') {
    carga = pautaCarga(pac, perfil.peso);
    pauta = [{ desde: 0, hasta: carga.dias, g: carga.g, tomas: carga.tomas }, { desde: carga.dias, hasta: Infinity, g: mant.g, tomas: 1 }];
  }
  const serie = simular(pac, pauta, { dias: 84, C0, z0 });
  const e = estacionario(pac, mant.g), caida = simular(pac, [], { dias: 168, C0: e.C, z0: e.z });
  return { modo, pac, carga, mantenimiento: mant, pauta, serie, lleno: diaLleno(serie, pac), franja: franjaLleno(perfil, pauta, previa),
           siLaDejas: { dias: diaVuelta(caida, pac, 0), serie: caida }, tiradoSemana: tiradoUltimaSemana(serie), avisos,
           plazos: plazosDe(modo, modo === 'yaLaToma' ? (pet.yaLaToma || {}) : null) };
}
// Con − y +: cualquier dosis diaria desde 1 g hasta la de carga, desde su basal.
export function probarDosis(perfil = {}, g, { dias = 84 } = {}) {
  const pac = paciente(perfil); if (!pac) return { error: 'faltan_datos' };
  const gg = Math.min(Math.floor(TOPES.cargaGkg * perfil.peso), Math.max(TOPES.pruebaMin, Math.round(+g || 0)));
  const pauta = [{ desde: 0, hasta: Infinity, g: gg, tomas: gg >= 10 ? 4 : 1 }], serie = simular(pac, pauta, { dias });
  return { g: gg, lleno: diaLleno(serie, pac), franja: franjaLleno(perfil, pauta, null, dias), tiradoSemana: tiradoUltimaSemana(serie), serie };
}
// Bloquea y deriva: riñón, embarazo o lactancia, menor, mala reacción previa, o medicación que carga el riñón.
export function cribado(r = {}, datos = null) {
  const motivos = CRIBADO.filter((k) => r[k] === true);
  if (datos && datos.interacciones && datos.interacciones.length) motivos.push('medicacion');
  return { bloquea: motivos.length > 0, motivos };
}
// Un decimal: a medio cacito, 3 g salían 0,5 cacitos (2,5 g), menos que la dosis mínima (5-oct-2026).
export function equivalencias(g, cacito = CACITO_G) { return { g, cacitos: Math.round((g / cacito) * 10) / 10 }; }

// ═════ Validación: el paciente medio de un estudio (PROTOCOLO.md), igual que calibrar_creatina.R ═════
export function pacienteEstudio(f) {
  const s = DEF_ESTUDIO[f.sexo] ? f.sexo : 'mixto', peso = +f.peso > 0 ? +f.peso : DEF_ESTUDIO[s].peso;
  const fm = s === 'mixto' ? (PARAM.fMagra.M + PARAM.fMagra.F) / 2 : PARAM.fMagra[s];
  const M = peso * (1 - DEF_ESTUDIO[s].grasa / 100) * fm, k = MMOL_A_G * PARAM.msMh * M;
  // Techo relativo al basal omnívoro equivalente del grupo: el techo se escala con el laboratorio (enmienda del 5-oct-2026).
  const ref = +f.tcr_pre * (f.dieta === 'vegetariano' ? PARAM.basalMmol.omnivoro / PARAM.basalMmol.vegetariano : 1);
  return { M, k, B: +f.tcr_pre * k, T: PARAM.techoRel * ref * k, kdeg: PARAM.kdeg, fmax: PARAM.fmax, n: PARAM.n, freno: PARAM.freno, kfreno: PARAM.kfreno };
}
export function predecirEstudio(f) {
  const pac = pacienteEstudio(f), d = +f.dia_medida, s = simular(pac, parsePauta(f.pauta), { dias: d });
  return s[d].C / pac.k;
}
