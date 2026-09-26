// ─── Cafeína: tu dosis, tus niveles en sangre y cuánto te dura el efecto (24-sep-2026) ───
// Encargo de Alejandro (24-sep): «un modelo de cafeína en sangre, para predecir la dosis
// necesaria en un paciente en función de su peso y tolerancia, teniendo los niveles de efecto
// cognitivo y mejora del rendimiento … incorporarlo en la app de nutrición para que un paciente
// pueda saber su dosis, y predecir sus niveles en sangre y duración del efecto».
// Parte de su Excel «Cómo tomar la cafeína» (un compartimento, V 0,6 L/kg, ka según ayunas o
// comida, umbrales de alerta y de rendimiento por tolerancia) y lo completa:
//  · parámetros de bibliografía (FUENTES, y de dónde sale cada número en ORIGEN), variabilidad
//    entre personas y las covariables que más mueven la semivida (tabaco, anticonceptivos);
//  · CONCENTRACIÓN: la dosis se calcula al revés, la mínima que te mantiene por encima de tu
//    umbral durante el tiempo que la necesitas, con la mejor antelación y los topes de la EFSA;
//  · RENDIMIENTO: la dosis es la de las guías (mg/kg; ningún estudio liga un nivel en sangre al
//    tamaño de la mejora), y el modelo dice cuándo tomarla, cuánto dura y si te quita el sueño;
//  · lo que la app ya sabe NO se pregunta (orden de Alejandro, 24-sep): el peso sale del último
//    pesaje, y el sexo, la altura y la medicación, de sus datos (perfilDesdeApp).
// Sin dependencias. Unidades: horas (reloj: 9,25 = 9:15), mg, L y mg/L.
// Los textos para el paciente viven en la interfaz; aquí solo códigos. Tests: tests/cafeina.test.mjs.

export const MW_CAFEINA = 194.19;                       // g/mol: 1 mg/L = 5,15 µmol/L

// ── Farmacocinética: adulto sano de 70 kg, no fumador, sin anticonceptivos orales ──
export const PK = {
  F: 1,                                                  // biodisponibilidad oral
  Vkg: 0.6,                                              // L/kg de peso (el ajustado si IMC > 30)
  CL70: 5.6,                                             // L/h a 70 kg (t½ ≈ 5,2 h)
  expCL: 0.75,                                           // alometría del aclaramiento
  ka: { cafe: 3.0, capsula: 1.8, chicle: 3.6, energetica: 3.0 },  // 1/h, en ayunas
  kaComida: 0.4,                                         // con comida: ka × 0,4 (3,0 → 1,2 h⁻¹)
  Fforma: { cafe: 1, capsula: 1, chicle: 0.85, energetica: 1 },   // del chicle se libera ~85 %
  tlag: 0,                                               // h
  omega: { CL: 0.36, V: 0.20, ka: 0.50 },                // DE de log (≈ CV entre personas)
  cov: { fumador: 1.6, anticonceptivos: 0.60 },          // multiplican CL (V no cambia)
  imcObesidad: 30, fraccionAjuste: 0.4,                  // peso ajustado = ideal + 0,4·(real − ideal)
};
export const FORMAS = ['cafe', 'capsula', 'chicle', 'energetica'];

// ── Farmacodinamia: dosis de referencia de la bibliografía. Los umbrales en sangre salen del
// propio modelo (el nivel que da esa dosis a una persona típica de 70 kg): ver umbrales(). ──
export const PD = {
  refConcentracionMg: { sensible: 32, normal: 75 },      // mg por toma que ya mejoran la atención
  factorTolerante: 1.5,                                  // el ×1,5 del Excel de Alejandro: sube el umbral del tolerante
  rendimientoMgKg: { sensible: 2, normal: 3, tolerante: 3 },        // la dosis de la guía (mínimo que se da)
  rendimientoEficazMgKg: { sensible: 1.5, normal: 2 },  // la mínima eficaz: su nivel a 1 h es la línea de efecto; tolerante = normal × 1,5
  antelacionRendimiento: { cafe: [30, 75], energetica: [30, 75], capsula: [45, 90], chicle: [5, 20] },  // min antes, ventana de las guías
  nervios: { sensible: 3, normal: 7, tolerante: 10 },    // mg/L: por encima, inquietud y taquicardia
  suenoGardiner: [{ mg: 107, horas: 8.8 }, { mg: 217.5, horas: 13.2 }],
  suenoSensible: 0.5,                                    // supuesto
  picoMax: 10,                                           // mg/L: guarda de seguridad del pico típico
  toxico: 15,
};

// ── Topes (EFSA 2015; ISSN 2021 e IOC 2018 para el deporte) ──
export const TOPES = {
  concentracion: { mg: 200, mgkg: 3 },                   // dosis única
  rendimiento: { mg: 400, mgkg: 6 },
  diario: 400, diarioMgKg: 5.7, diarioEmbarazo: 200,    // al día: 400 mg o 5,7 mg/kg, lo que sea menor (EFSA 2015)
  efsaToma: 200,                                         // por encima: fuera de lo que la EFSA evaluó sin riesgo
  lineal: 300,                                           // por encima: la eliminación empieza a saturarse
  minimo: 20,                                            // por debajo no es una dosis práctica
  redondeo: 10,
};

export const TOLERANCIAS = ['sensible', 'normal', 'tolerante'];
export const OBJETIVOS = ['concentracion', 'rendimiento'];

const num = (v, lo, hi, def) => { const x = parseFloat(v); return Number.isFinite(x) ? Math.min(hi, Math.max(lo, x)) : def; };
const tol = (t) => (TOLERANCIAS.includes(t) ? t : 'normal');
const redondear = (mg) => Math.round(mg / TOPES.redondeo) * TOPES.redondeo;

// ═════ Lo que la app ya sabe del paciente: no se pregunta ═════

// Peso actual: el último pesaje (weight_logs: { log_date, weight_kg }); si no hay, el del alta.
export function pesoActual(registros = [], pesoInicial = null) {
  const r = (registros || []).map((x) => ({ fecha: String(x.log_date || x.fecha || ''), peso: parseFloat(x.weight_kg ?? x.peso ?? x.weight) }))
    .filter((x) => x.fecha && x.peso >= 30 && x.peso <= 250).sort((a, b) => (a.fecha < b.fecha ? -1 : a.fecha > b.fecha ? 1 : 0));
  if (r.length) return { peso: r[r.length - 1].peso, origen: 'pesaje', fecha: r[r.length - 1].fecha };
  const p0 = parseFloat(pesoInicial);
  return p0 >= 30 && p0 <= 250 ? { peso: p0, origen: 'alta', fecha: null } : { peso: null, origen: null, fecha: null };
}

// Con IMC > 30 se calcula con el peso ajustado (ideal de Devine + 0,4 del exceso): en la obesidad el
// volumen por kilo cae de 0,59 a 0,44 L/kg y el aclaramiento no sube con el peso (Caraco 1995;
// Abernethy 1985). Sin altura o sin sexo, el peso real.
export function pesoParaCalculo({ peso, altura, sexo } = {}) {
  const p = num(peso, 30, 250, 70), a = parseFloat(altura);
  if (!(a > 120 && a < 230) || !(sexo === 'M' || sexo === 'F')) return { peso: p, ajustado: false, imc: null };
  const imc = p / Math.pow(a / 100, 2);
  if (imc <= PK.imcObesidad) return { peso: p, ajustado: false, imc };
  const ideal = (sexo === 'M' ? 50 : 45.5) + 0.91 * (a - 152.4);
  return { peso: ideal + PK.fraccionAjuste * (p - ideal), ajustado: true, imc, ideal };
}

const nombreMed = (it) => (typeof it === 'string' ? it : [it && (it.nombre ?? it.Nombre ?? it.name), it && (it.dosis ?? it.Dosis), it && (it.notas ?? it.Notas)].filter(Boolean).join(' ')).toString();
const SOLO_GESTAGENO = /cerazet|slinda|minip[ií]ldora|solo\s*gest|desogestrel\s*75|mirena|kyleena|jaydess|implanon|nexplanon|diu\s*hormonal|depo-?provera|sayana/i;
const COMBINADO = /anticonceptiv|p[ií]ldora|etinilestradiol|estetrol|drospirenona|gestodeno|dienogest|nomegestrol|clormadinona|ciproterona|norgestimato|anillo\s*vaginal|nuvaring|circlet|parche\s*anticonc|evra|yasmin|\byaz\b|diane|microgynon|loette|ovoplex|sibilla|zoely|qlaira|bellina|balianca|drosure|daylette|drospil|liofora|eloine|harmonet|minesse|melodene|tevalet|triciclor|drelle/i;

// Anticonceptivos hormonales en la medicación registrada. Solo los combinados (con estrógeno)
// frenan su eliminación (Abernethy y Todd 1985: «low-dose oestrogen-containing»).
export function anticonceptivosDe(sexo, lista = []) {
  if (sexo !== 'F') return { estado: 'no_aplica', item: null };
  for (const it of lista || []) { const n = nombreMed(it); if (SOLO_GESTAGENO.test(n)) return { estado: 'solo_gestageno', item: n.trim() }; }
  for (const it of lista || []) { const n = nombreMed(it); if (COMBINADO.test(n)) return { estado: 'combinado', item: n.trim() }; }
  return { estado: 'no_consta', item: null };
}

const INTERACCIONES = [
  { id: 'fluvoxamina', re: /fluvoxamin|dumirox/i },
  { id: 'quinolona', re: /ciproflox|levoflox|ofloxac|norflox|moxiflox|enoxac|pefloxac|quinolon/i },
  { id: 'clozapina', re: /clozapin|leponex/i },
  { id: 'litio', re: /\blitio\b|plenur|lithium/i },
  { id: 'teofilina', re: /teofilin|aminofilin|elixifilin|theo-?dur/i },
  { id: 'disulfiram', re: /disulfiram|antabus/i },
  { id: 'imao', re: /fenelzin|tranilcipromin|parnate|moclobemid|selegilin|rasagilin|\bimao\b/i },
  { id: 'estimulante', re: /efedrin|fenilpropanolamin|metilfenidat|concerta|rubifen|medikinet|lisdexanfetamin|elvanse|anfetamin|modafinil/i },
  { id: 'betabloqueante', re: /\w+olol\b|emconcor|sumial|tenormin/i },
  { id: 'tension', re: /\w+pril\b|\w+sart[aá]n\b|amlodipin|nifedipin|lercanidipin|hidroclorotiazid|clortalidon|indapamid|antihipertensiv/i },
  { id: 'inhibidor_cyp1a2', re: /mexiletin|furafilin|idrocilamid|metoxsalen|psoralen/i },
];
// Medicación registrada que frena la cafeína o no casa con ella: bloquea y deriva.
export function interaccionesDe(lista = []) {
  const out = [];
  for (const it of lista || []) { const n = nombreMed(it); for (const x of INTERACCIONES) if (x.re.test(n)) out.push({ id: x.id, item: n.trim() }); }
  return out;
}

// Del registro de la app al perfil del motor. `habitos` es lo que la app NO sabe (tolerancia,
// tabaco, forma, con comida): se pregunta una vez y se guarda en el teléfono.
export function perfilDesdeApp({ sexo = null, alturaCm = null, registrosPeso = [], pesoInicial = null, medicacion = [] } = {}, habitos = {}) {
  const pa = pesoActual(registrosPeso, pesoInicial), ac = anticonceptivosDe(sexo, medicacion);
  return {
    perfil: { peso: pa.peso, altura: alturaCm, sexo, anticonceptivos: ac.estado === 'combinado', fumador: !!habitos.fumador,
              tolerancia: tol(habitos.tolerancia), comida: !!habitos.comida, forma: FORMAS.includes(habitos.forma) ? habitos.forma : 'cafe' },
    datos: { peso: pa, anticonceptivos: ac, interacciones: interaccionesDe(medicacion) },
  };
}

// ═════ El modelo ═════

// Parámetros de ESTA persona a partir de su perfil.
export function pkIndividual(perfil = {}, eta = null) {
  const pc = pesoParaCalculo(perfil);
  let CL = PK.CL70 * Math.pow(pc.peso / 70, PK.expCL);
  if (perfil.fumador) CL *= PK.cov.fumador;
  if (perfil.anticonceptivos) CL *= PK.cov.anticonceptivos;
  let V = PK.Vkg * pc.peso;
  const forma = FORMAS.includes(perfil.forma) ? perfil.forma : 'cafe';
  let ka = PK.ka[forma] * (perfil.comida ? PK.kaComida : 1);
  if (eta) { CL *= Math.exp(eta.CL || 0); V *= Math.exp(eta.V || 0); ka *= Math.exp(eta.ka || 0); }
  const ke = CL / V;
  return { peso: pc.peso, pesoReal: num(perfil.peso, 30, 250, 70), ajustado: pc.ajustado, imc: pc.imc, forma, CL, V, ka, ke, tlag: PK.tlag, F: PK.F * PK.Fforma[forma], t12: Math.LN2 / ke };
}

// Concentración en plasma (mg/L) a la hora t de un conjunto de tomas [{ t, mg }]: superposición
// de la solución exacta de un compartimento con absorción de primer orden y latencia.
export function concentracion(t, tomas, pk) {
  let c = 0;
  for (const d of tomas || []) {
    const s = t - d.t - pk.tlag;
    if (!(s > 0) || !(d.mg > 0)) continue;
    const { ka, ke, V, F } = pk;
    c += Math.abs(ka - ke) < 1e-9
      ? F * d.mg / V * ke * s * Math.exp(-ke * s)
      : F * d.mg * ka / (V * (ka - ke)) * (Math.exp(-ke * s) - Math.exp(-ka * s));
  }
  return c;
}

export function curva(tomas, pk, { desde = 0, hasta = 24, paso = 5 / 60 } = {}) {
  const n = Math.round((hasta - desde) / paso), out = [];
  for (let i = 0; i <= n; i++) { const t = desde + i * paso; out.push({ t, c: concentracion(t, tomas, pk) }); }
  return out;
}

export function pico(tomas, pk, { desde = 0, hasta = 24, paso = 1 / 60 } = {}) {
  let mejor = { t: desde, c: 0 };
  for (const p of curva(tomas, pk, { desde, hasta, paso })) if (p.c > mejor.c) mejor = p;
  return mejor;
}

// Tramos continuos con la concentración por encima del umbral, con los bordes afinados a segundos.
export function tramosPorEncima(tomas, pk, umbral, { desde = 0, hasta = 24, paso = 1 / 60 } = {}) {
  const f = (t) => concentracion(t, tomas, pk) - umbral;
  const borde = (a, b) => { let fa = f(a); for (let i = 0; i < 40; i++) { const m = (a + b) / 2, fm = f(m); if ((fm >= 0) === (fa >= 0)) { a = m; fa = fm; } else b = m; } return (a + b) / 2; };
  const out = [];
  let dentro = f(desde) >= 0, ini = dentro ? desde : null, tPrev = desde;
  const n = Math.round((hasta - desde) / paso);
  for (let i = 1; i <= n; i++) {
    const t = desde + i * paso, d = f(t) >= 0;
    if (d && !dentro) ini = borde(tPrev, t);
    if (!d && dentro) out.push({ desde: ini, hasta: borde(tPrev, t) });
    dentro = d; tPrev = t;
  }
  if (dentro) out.push({ desde: ini, hasta });
  return out;
}

// Umbrales en sangre (mg/L) de cada tolerancia: el nivel que da la dosis de referencia a una persona
// típica de 70 kg que la toma en café y en ayunas. Así umbral y farmacocinética no se contradicen.
// Concentración: el pico de la dosis mínima que ya mejora la atención. Rendimiento: el nivel a 1 h de
// la dosis mínima eficaz (la recomendada es mayor, así que la línea marca cuánto dura por encima).
// Tolerante: el umbral del normal × 1,5 en los dos objetivos. En rendimiento cuadra con Bell y McLellan
// 2002: en consumidores habituales 5 mg/kg aún mejoraba a las 3 h (≈ 6,0 mg/L) y ya no a las 6 h (≈ 4,0).
const _umbrales = {};
export function umbrales(tolerancia = 'normal') {
  const k = tol(tolerancia);
  if (_umbrales[k]) return _umbrales[k];
  const p = pkIndividual({ peso: 70 });
  const cPico = (mg) => pico([{ t: 0, mg }], p, { desde: 0, hasta: 6, paso: 1 / 120 }).c;
  const concentracionU = k === 'tolerante' ? cPico(PD.refConcentracionMg.normal) * PD.factorTolerante : cPico(PD.refConcentracionMg[k]);
  const nivel1h = (mgkg) => concentracion(1, [{ t: 0, mg: mgkg * 70 }], p);
  const rendimientoU = k === 'tolerante' ? nivel1h(PD.rendimientoEficazMgKg.normal) * PD.factorTolerante : nivel1h(PD.rendimientoEficazMgKg[k]);
  const gard = PD.suenoGardiner.map((g) => concentracion(g.horas, [{ t: 0, mg: g.mg }], p));
  return (_umbrales[k] = {
    concentracion: concentracionU,
    rendimiento: rendimientoU,
    nervios: PD.nervios[k],
    sueno: k === 'sensible' ? PD.suenoSensible : gard.reduce((a, b) => a + b, 0) / gard.length,
  });
}

// Preguntas que BLOQUEAN una dosis personalizada, más la medicación que la app ya conoce.
// Devuelve códigos; los textos, en la interfaz.
export function cribado(r = {}, datos = null) {
  const motivos = [];
  for (const k of ['embarazo', 'lactancia', 'menor', 'corazon', 'ansiedad', 'higado', 'reaccion']) if (r[k]) motivos.push(k);
  const inter = (datos && datos.interacciones) || [];
  if (inter.length) motivos.push('medicacion');
  return { bloquea: motivos.length > 0, motivos, interacciones: inter, topeDiario: (r.embarazo || r.lactancia) ? TOPES.diarioEmbarazo : TOPES.diario };
}

// Lo que queda del día: 400 mg o 5,7 mg/kg (lo menor), menos lo ya tomado.
export function margenDiario(peso, otrasHoy = 0) {
  return Math.max(0, Math.min(TOPES.diario, TOPES.diarioMgKg * num(peso, 30, 250, 70)) - num(otrasHoy, 0, 2000, 0));
}

export function tope(objetivo, peso, otrasHoy = 0) {
  const t = TOPES[objetivo] || TOPES.concentracion;
  return Math.max(0, Math.min(t.mg, t.mgkg * num(peso, 30, 250, 70), margenDiario(peso, otrasHoy)));
}

const aDia = (h, ref) => { let x = h; while (x < ref) x += 24; return x; };
const ANTELACIONES = Array.from({ length: 24 }, (_, i) => (i + 1) * 5 / 60);   // de 5 min a 2 h

// Última hora a la que se pueden tomar `mg` para llegar a `dormir` por debajo del umbral de sueño.
export function horaLimiteSueno(pk, mg, dormir, umbralSueno) {
  const c1 = (s) => concentracion(s, [{ t: 0, mg: 1 }], pk);
  if (!(mg > 0)) return null;
  const pk1 = pico([{ t: 0, mg }], pk, { desde: 0, hasta: 8, paso: 1 / 60 });
  if (pk1.c <= umbralSueno) return dormir;
  let a = pk1.t, b = 96;
  for (let i = 0; i < 60; i++) { const m = (a + b) / 2; if (mg * c1(m) > umbralSueno) a = m; else b = m; }
  return dormir - (a + b) / 2;
}

// La recomendación.
export function recomendar(perfil = {}, pet = {}) {
  const objetivo = OBJETIVOS.includes(pet.objetivo) ? pet.objetivo : 'concentracion';
  const k = tol(perfil.tolerancia), pk = pkIndividual(perfil), U = umbrales(k), umbral = U[objetivo];
  const inicio = num(pet.inicio, 0, 48, 10), duracion = num(pet.duracion, 0.25, 12, objetivo === 'rendimiento' ? 1.5 : 3);
  const vent = PD.antelacionRendimiento[pk.forma];            // en rendimiento, dentro de la ventana de las guías
  const leads = pet.antelacion != null ? [num(pet.antelacion, 0, 3, 0.5)]
    : objetivo === 'rendimiento' ? ANTELACIONES.filter((L) => L * 60 >= vent[0] - 1e-9 && L * 60 <= vent[1] + 1e-9) : ANTELACIONES;
  let mejor = null;                                          // la antelación que da más nivel mínimo en la ventana
  for (const L of leads) {
    const t0 = inicio - L, uno = [{ t: t0, mg: 1 }];
    const cmin = Math.min(concentracion(inicio, uno, pk), concentracion(inicio + duracion, uno, pk));
    if (!mejor || cmin > mejor.cmin + 1e-12) mejor = { L, t0, cmin };
  }
  const avisos = [], techo = tope(objetivo, pk.peso, pet.otrasHoy), arriba = (x) => Math.ceil(x / TOPES.redondeo) * TOPES.redondeo;
  let necesarios, mg;
  if (objetivo === 'rendimiento') {                          // la de la guía; más si hace falta para cubrir el entreno (tolerante)
    const guia = PD.rendimientoMgKg[k] * pk.peso, cubrir = umbral / mejor.cmin;
    necesarios = Math.max(guia, cubrir); mg = cubrir > guia + 1e-9 ? arriba(cubrir) : redondear(guia);
  } else { necesarios = umbral / mejor.cmin; mg = Math.max(arriba(necesarios), TOPES.minimo); }
  const probada = pet.mg != null && Number.isFinite(parseFloat(pet.mg));   // «¿y si tomo otra cantidad?»
  if (probada) mg = Math.max(TOPES.minimo, redondear(parseFloat(pet.mg)));
  let limitado = false;
  if (mg > techo) { mg = Math.floor(techo / TOPES.redondeo) * TOPES.redondeo; limitado = true; avisos.push('tope'); }
  const c1pico = pico([{ t: 0, mg: 1 }], pk, { desde: 0, hasta: 8, paso: 1 / 60 }).c;
  if (mg * c1pico > PD.picoMax) { mg = Math.floor(PD.picoMax / c1pico / TOPES.redondeo) * TOPES.redondeo; limitado = true; avisos.push('pico'); }
  if (mg < TOPES.minimo) return { mg: 0, objetivo, umbral, necesarios, tope: techo, avisos: ['sin_margen_diario'], pk, umbrales: U };
  const fin = inicio + duracion;
  const evaluar = (ts) => {                                  // efecto, cobertura y pico de un conjunto de tomas
    const tramos = tramosPorEncima(ts, pk, umbral, { desde: ts[0].t, hasta: ts[0].t + 36, paso: 1 / 60 });
    let cubierto = 0; for (const x of tramos) cubierto += Math.max(0, Math.min(x.hasta, fin) - Math.max(x.desde, inicio));
    const utiles = tramos.filter((x) => x.hasta > inicio);
    const tramo = utiles.length ? { desde: utiles[0].desde, hasta: utiles[utiles.length - 1].hasta } : (tramos[0] || null);
    return { tramo, cubre: Math.min(1, cubierto / duracion), pico: pico(ts, pk, { desde: ts[0].t, hasta: ts[ts.length - 1].t + 8 }) };
  };
  let tomas = [{ t: mejor.t0, mg }], ev = evaluar(tomas), plan = null;
  // Ventana larga: si una sola toma lleva el pico a la zona de nervios, o no la cubre sin pasar el tope,
  // se reparte en varias tomas (orden de Alejandro, 24-sep). Solo se usa si no pierde cobertura.
  const techoC = Math.min(U.nervios, PD.picoMax) * 0.95;
  if (!probada && duracion >= 2 && (ev.pico.c > techoC || (limitado && ev.cubre < 0.999))) {
    const guia = objetivo === 'rendimiento' ? redondear(PD.rendimientoMgKg[k] * pk.peso) : 0;
    const alt = planRepartido(pk, objetivo, umbral, techoC, inicio, fin, vent, guia, techo, margenDiario(pk.peso, pet.otrasHoy));
    if (alt && alt.length > 1) {
      const ev2 = evaluar(alt);
      if (ev2.pico.c <= techoC + 1e-9 && ev2.cubre >= ev.cubre - 1e-9) {
        plan = { motivo: ev.pico.c > techoC ? 'nervios' : 'tope', unica: { mg, pico: ev.pico.c, cubre: ev.cubre } };
        tomas = alt; ev = ev2;
        const i = avisos.indexOf('tope'); if (i >= 0 && ev.cubre > 0.999) avisos.splice(i, 1);
      }
    }
  }
  const total = tomas.reduce((s, d) => s + d.mg, 0), mayor = Math.max(...tomas.map((d) => d.mg));
  if (ev.pico.c > U.nervios) avisos.push('nervios');
  if (objetivo === 'rendimiento' && mayor > TOPES.efsaToma) avisos.push('sobre_efsa');
  if (mayor > TOPES.lineal) avisos.push('no_lineal');
  if (objetivo === 'rendimiento' && k === 'tolerante') avisos.push('tolerante_rendimiento');
  if (plan) avisos.push('repartida');
  else if (objetivo === 'rendimiento' && ev.cubre < 0.999 && duracion > 1.5) avisos.push('sesion_larga');
  let sueno = null;
  if (pet.dormir != null) {
    const dormir = aDia(num(pet.dormir, 0, 48, 23.5), fin), cDormir = concentracion(dormir, tomas, pk);
    sueno = { dormir, c: cDormir, umbral: U.sueno, ok: cDormir <= U.sueno, horaLimite: null, mgMax: null, ultima: tomas[tomas.length - 1].t };
    if (tomas.length === 1) {
      const c1 = concentracion(dormir, [{ t: mejor.t0, mg: 1 }], pk);
      sueno.horaLimite = horaLimiteSueno(pk, mg, dormir, U.sueno);
      sueno.mgMax = c1 > 0 ? Math.floor(U.sueno / c1 / TOPES.redondeo) * TOPES.redondeo : null;
    }
    if (!sueno.ok) avisos.push('sueno');
  }
  if (perfil.fumador) avisos.push('fumador');
  if (perfil.anticonceptivos) avisos.push('anticonceptivos');
  if (pk.ajustado) avisos.push('peso_ajustado');
  return { mg: total, mgkg: total / pk.peso, probada, necesarios, tope: techo, limitado, objetivo, tolerancia: k, umbral, umbrales: U, inicio, duracion,
           tToma: tomas[0].t, antelacion: inicio - tomas[0].t, tomas, plan, tramo: ev.tramo, cubre: ev.cubre, pico: ev.pico, sueno, avisos, pk };
}

// Varias tomas para una ventana larga. La primera, antes de empezar, con la antelación que más nivel da
// al comenzar (en rendimiento, al menos la dosis de la guía). Las demás, durante: cada una un poco antes
// de que el nivel caiga bajo la línea, al menos 1 h después de la anterior, de 200 mg como mucho (lo que
// la EFSA evaluó por toma), la menor que llega hasta el final, y ninguna lleva el pico a la zona de
// nervios. Se prueban varias primeras tomas y gana la pauta que más cubre, con menos tomas y menos mg.
function planRepartido(pk, objetivo, umbral, techoC, inicio, fin, vent, guia, techoToma, techoDia) {
  const leads = objetivo === 'rendimiento' ? ANTELACIONES.filter((L) => L * 60 >= vent[0] - 1e-9 && L * 60 <= vent[1] + 1e-9) : ANTELACIONES;
  let mejor = null;
  for (const L of leads) { const c = concentracion(inicio, [{ t: inicio - L, mg: 1 }], pk); if (!mejor || c > mejor.c + 1e-12) mejor = { L, c }; }
  const t0 = inicio - mejor.L, c1pico = pico([{ t: 0, mg: 1 }], pk, { desde: 0, hasta: 8, paso: 1 / 60 }).c;
  const d1min = Math.max(Math.ceil(umbral / mejor.c / TOPES.redondeo) * TOPES.redondeo, guia, TOPES.minimo);
  const d1max = Math.min(techoToma, techoDia, Math.floor(techoC / c1pico / TOPES.redondeo) * TOPES.redondeo);
  const subir = objetivo === 'rendimiento' ? vent[0] / 60 : 0.5;   // lo que tarda una toma en subir el nivel
  const cae = (ts, a, b) => { for (let t = a; t <= b + 1e-9; t += 1 / 60) if (concentracion(t, ts, pk) < umbral - 1e-9) return t; return null; };
  const cubre = (ts) => { let n = 0, s = 0; for (let t = inicio; t <= fin + 1e-9; t += 1 / 60) { n++; if (concentracion(t, ts, pk) >= umbral - 1e-9) s++; } return s / n; };
  const construir = (d1) => {
    const plan = [{ t: t0, mg: d1 }];
    let total = d1;
    for (let i = 0; i < 5 && total + TOPES.minimo <= techoDia + 1e-9; i++) {
      const tc = cae(plan, inicio, fin);
      if (tc == null) break;
      const ts = Math.ceil(Math.max(tc - subir, plan[plan.length - 1].t + 1) * 12 - 1e-9) / 12;   // a los 5 min
      if (ts >= fin) break;
      let elegido = null;
      for (let m = TOPES.minimo; m <= Math.min(TOPES.efsaToma, techoDia - total) + 1e-9; m += TOPES.redondeo) {
        const p2 = plan.concat([{ t: ts, mg: m }]);
        if (pico(p2, pk, { desde: ts, hasta: ts + 4, paso: 1 / 60 }).c > techoC) break;
        elegido = m;
        if (cae(p2, tc, fin) == null) break;                                   // la menor que llega hasta el final
      }
      if (!elegido) break;
      plan.push({ t: ts, mg: elegido }); total += elegido;
    }
    return { plan, total, cubre: cubre(plan) };
  };
  let elegida = null;
  for (let d1 = Math.min(d1min, d1max); d1 <= d1max + 1e-9; d1 += 2 * TOPES.redondeo) {
    if (d1 < TOPES.minimo) continue;
    const c = construir(d1);
    if (!elegida || c.cubre > elegida.cubre + 1e-6 || (Math.abs(c.cubre - elegida.cubre) <= 1e-6 &&
        (c.plan.length < elegida.plan.length || (c.plan.length === elegida.plan.length && c.total < elegida.total)))) elegida = c;
  }
  return elegida ? elegida.plan : null;
}

// Cuánto le duraría a ESTA persona, con SU umbral, la dosis que se le daría a alguien de tolerancia
// normal: así se ve qué cambia la tolerancia (el tolerante necesita más y, con la misma, le dura menos).
export function comparaNormal(perfil = {}, pet = {}) {
  if (tol(perfil.tolerancia) === 'normal') return null;
  const propia = recomendar(perfil, pet), normal = recomendar({ ...perfil, tolerancia: 'normal' }, pet);
  if (!propia.mg || !normal.mg || propia.plan || normal.plan) return null;   // con tomas repartidas no hay una dosis que comparar
  const tomas = [{ t: propia.tToma, mg: normal.mg }];
  const tr = tramosPorEncima(tomas, propia.pk, propia.umbral, { desde: propia.tToma, hasta: propia.tToma + 36, paso: 1 / 60 });
  const horas = tr.reduce((s, x) => s + (x.hasta - x.desde), 0);
  return { mgNormal: normal.mg, horas, pico: pico(tomas, propia.pk, { desde: propia.tToma, hasta: propia.tToma + 8 }).c, horasPropia: propia.tramo ? propia.tramo.hasta - propia.tramo.desde : 0 };
}

// Franja entre personas como tú (percentiles 10-50-90), por Monte Carlo con semilla fija.
export function bandas(perfil, tomas, { desde = 0, hasta = 24, paso = 10 / 60, n = 400, semilla = 20260924 } = {}) {
  let s = semilla >>> 0;
  const azar = () => { s = (s + 0x6D2B79F5) >>> 0; let t = s; t = Math.imul(t ^ (t >>> 15), t | 1); t ^= t + Math.imul(t ^ (t >>> 7), t | 61); return ((t ^ (t >>> 14)) >>> 0) / 4294967296; };
  const normal = () => { let u = 0; while (u === 0) u = azar(); return Math.sqrt(-2 * Math.log(u)) * Math.cos(2 * Math.PI * azar()); };
  const k = Math.round((hasta - desde) / paso), mat = Array.from({ length: k + 1 }, () => new Float64Array(n));
  for (let j = 0; j < n; j++) {
    const pk = pkIndividual(perfil, { CL: PK.omega.CL * normal(), V: PK.omega.V * normal(), ka: PK.omega.ka * normal() });
    for (let i = 0; i <= k; i++) mat[i][j] = concentracion(desde + i * paso, tomas, pk);
  }
  const q = (arr, pr) => { const a = Array.from(arr).sort((x, y) => x - y), h = (a.length - 1) * pr, lo = Math.floor(h); return a[lo] + (a[Math.min(lo + 1, a.length - 1)] - a[lo]) * (h - lo); };
  return mat.map((fila, i) => ({ t: desde + i * paso, p10: q(fila, 0.1), p50: q(fila, 0.5), p90: q(fila, 0.9) }));
}

// Para traducir mg a lo que se toma. Bebidas: en mL (orden de Alejandro, 24-sep), con el contenido de
// la EFSA. Cápsulas y chicles: en unidades, porque ya dicen los mg (chicle de los ensayos: Ryan 2012).
export const BEBIDAS = {
  cafe_filtro: { mgPorMl: 90 / 200, redondeo: 10, formas: ['cafe'] },     // EFSA: 90 mg en 200 mL
  espresso: { mgPorMl: 80 / 60, redondeo: 5, formas: ['cafe'] },          // EFSA: 80 mg en 60 mL
  energetica: { mgPorMl: 32 / 100, redondeo: 10, formas: ['energetica'] }, // EFSA: 32 mg/100 mL
};
export const RACIONES = [
  { id: 'capsula_200', mg: 200, formas: ['capsula'], partes: 1 },   // una cápsula no se parte
  { id: 'capsula_100', mg: 100, formas: ['capsula'], partes: 1 },
  { id: 'chicle_100', mg: 100, formas: ['chicle'], partes: 2 },     // medio chicle, sí
];
export function equivalencias(mg, forma = null) {
  const bebidas = Object.keys(BEBIDAS).filter((id) => !forma || BEBIDAS[id].formas.includes(forma))
    .map((id) => { const b = BEBIDAS[id]; return { id, ml: Math.max(b.redondeo, Math.round(mg / b.mgPorMl / b.redondeo) * b.redondeo) }; });
  const unidades = RACIONES.filter((r) => !forma || r.formas.includes(forma))
    .map((r) => ({ id: r.id, mg: r.mg, n: Math.max(1 / r.partes, Math.round((mg / r.mg) * r.partes) / r.partes) }))
    .filter((u) => Math.abs(u.n * u.mg - mg) <= 0.25 * mg);                // solo si se queda a menos del 25 % de la dosis
  return bebidas.concat(unidades);
}

// ═════ De dónde sale cada número ═════
export const FUENTES = [
  { id: 'blanchard1983', corto: 'Blanchard y Sawers, 1983', cita: 'Blanchard J, Sawers SJ. The absolute bioavailability of caffeine in man. Eur J Clin Pharmacol 1983;24:93-8. PMID 6832208', usa: 'se absorbe prácticamente entera por vía oral', app: true },
  { id: 'tantcheva1999', corto: 'Tantcheva-Poór y cols., 1999', cita: 'Tantcheva-Poór I et al. Estimation of CYP1A2 activity in 863 healthy Caucasians using a saliva-based caffeine test. Pharmacogenetics 1999;9:131-44. PMID 10376760', usa: 'cuánto tarda en eliminarse, y cuánto lo cambian el tabaco y los anticonceptivos (786 personas)', app: true },
  { id: 'lammers2017', corto: 'Lammers y cols., 2017', cita: 'Lammers LA et al. Clin Pharmacokinet 2017;56:1231-44. PMID 28229374', usa: 'aclaramiento, volumen y biodisponibilidad en un modelo poblacional', app: false },
  { id: 'csajka2005', corto: 'Csajka y cols., 2005', cita: 'Csajka C et al. Br J Clin Pharmacol 2005;59:335-45. PMID 15752380', usa: 'modelo poblacional: absorción, variabilidad entre personas, anticonceptivos', app: false },
  { id: 'seng2009', corto: 'Seng y cols., 2009', cita: 'Seng KY et al. Population pharmacokinetics of caffeine in healthy male adults using mixed-effects models. J Clin Pharm Ther 2009;34:103-14. PMID 19125908', usa: 'variabilidad entre personas y efecto del tabaco', app: false },
  { id: 'lelo1986', corto: 'Lelo y cols., 1986', cita: 'Lelo A et al. Br J Clin Pharmacol 1986;22:177-82. PMID 3756065', usa: 'volumen de distribución', app: false },
  { id: 'white2016', corto: 'White y cols., 2016', cita: 'White JR et al. Clin Toxicol 2016;54:308-12. PMID 27100333', usa: 'café y bebida energética: volumen y aclaramiento', app: false },
  { id: 'sadek2017', corto: 'Sadek y cols., 2017', cita: 'Sadek P et al. J Caffeine Res 2017;7:125-32. PMID 29230348', usa: 'absorción del café y del chicle', app: false },
  { id: 'kamimori2002', corto: 'Kamimori y cols., 2002', cita: 'Kamimori GH et al. Int J Pharm 2002;234:159-67. PMID 11839447', usa: 'la cápsula tarda más en subir que el chicle', app: true },
  { id: 'brachtel1988', corto: 'Brachtel y Richter, 1988', cita: 'Brachtel D, Richter E. Z Gastroenterol 1988;26:245-51. PMID 3407246', usa: 'con comida la absorción es más lenta', app: false },
  { id: 'caraco1995', corto: 'Caraco y cols., 1995', cita: 'Caraco Y et al. Int J Obes 1995;19:234-9. PMID 7627246', usa: 'en la obesidad el volumen por kilo baja: se dosifica con el peso ajustado', app: false },
  { id: 'parsons1978', corto: 'Parsons y Neims, 1978', cita: 'Parsons WD, Neims AH. Effect of smoking on caffeine clearance. Clin Pharmacol Ther 1978;24:40-5. PMID 657717', usa: 'el tabaco acelera su eliminación', app: false },
  { id: 'abernethy1985', corto: 'Abernethy y Todd, 1985', cita: 'Abernethy DR, Todd EL. Eur J Clin Pharmacol 1985;28:425-8. PMID 4029248', usa: 'los anticonceptivos con estrógeno la frenan', app: true },
  { id: 'lieberman1987', corto: 'Lieberman y cols., 1987', cita: 'Lieberman HR et al. Psychopharmacology 1987;92:308-12. PMID 3114783', usa: '32 mg ya mejoran la vigilancia y el tiempo de reacción', app: true },
  { id: 'efsa2011', corto: 'EFSA, 2011', cita: 'EFSA NDA Panel. EFSA Journal 2011;9(4):2053 y 2054', usa: '≥ 75 mg por toma para la alerta; 3 mg/kg una hora antes para la resistencia', app: true },
  { id: 'guest2021', corto: 'ISSN (Guest y cols., 2021)', cita: 'Guest NS et al. ISSN position stand: caffeine and exercise performance. J Int Soc Sports Nutr 2021;18:1. PMID 33388079', usa: '3-6 mg/kg unos 60 min antes; desde ~2 mg/kg; el consumo habitual no cambia la dosis', app: true },
  { id: 'maughan2018', corto: 'Consenso del COI, 2018', cita: 'Maughan RJ et al. Br J Sports Med 2018;52:439-55. PMID 29540367', usa: '≥ 9 mg/kg no mejora más y trae efectos adversos', app: false },
  { id: 'jenkins2008', corto: 'Jenkins y cols., 2008', cita: 'Jenkins NT et al. IJSNEM 2008;18:328-42. PMID 18562777', usa: '2 mg/kg ya mejoran el rendimiento (+4 %); 1 mg/kg no', app: false },
  { id: 'talanian2016', corto: 'Talanian y Spriet, 2016', cita: 'Talanian JL, Spriet LL. Appl Physiol Nutr Metab 2016;41:850-5. PMID 27426699', usa: '100 mg (≈ 1,5 mg/kg) ya mejoran la contrarreloj', app: false },
  { id: 'goncalves2017', corto: 'Gonçalves y cols., 2017', cita: 'Gonçalves LS et al. J Appl Physiol 2017;123:213-20. PMID 28495846', usa: 'el consumo habitual no cambia la mejora con 6 mg/kg', app: false },
  { id: 'carvalho2022', corto: 'Carvalho y cols., 2022', cita: 'Carvalho A et al. Sports Med 2022;52:2209-20. PMID 35536449', usa: 'metaanálisis: sin efecto del consumo habitual; > 6 mg/kg no suma', app: false },
  { id: 'bell2002', corto: 'Bell y McLellan, 2002', cita: 'Bell DG, McLellan TM. J Appl Physiol 2002;93:1227-34. PMID 12235019', usa: 'en quien la toma a diario el efecto es menor y dura menos: con 5 mg/kg, a las 3 h sí y a las 6 h ya no', app: true },
  { id: 'rogers2013', corto: 'Rogers y cols., 2010 y 2013', cita: 'Rogers PJ et al. Neuropsychopharmacology 2010;35:1973-83; Psychopharmacology 2013;226:229-40', usa: 'en quien no la toma, 2-3,6 mg/L ya dan inquietud', app: false },
  { id: 'gardiner2023', corto: 'Gardiner y cols., 2023', cita: 'Gardiner C et al. The effect of caffeine on subsequent sleep: a systematic review and meta-analysis. Sleep Med Rev 2023;69:101764. PMID 36870101', usa: 'un café, ≥ 8,8 h antes de acostarse; ~217 mg, ≥ 13,2 h', app: true },
  { id: 'drake2013', corto: 'Drake y cols., 2013', cita: 'Drake C et al. J Clin Sleep Med 2013;9:1195-200. PMID 24235903', usa: '400 mg incluso 6 h antes de dormir quitan más de una hora de sueño', app: false },
  { id: 'efsa2015', corto: 'EFSA, 2015', cita: 'EFSA NDA Panel. Scientific Opinion on the safety of caffeine. EFSA Journal 2015;13(5):4102', usa: '200 mg por toma y 400 mg al día; 200 mg al día en embarazo y lactancia', app: true },
  { id: 'cappelletti2018', corto: 'Cappelletti y cols., 2018', cita: 'Cappelletti S et al. Caffeine-related deaths. Nutrients 2018;10:611. PMID 29757951', usa: 'toxicidad desde 15 mg/L', app: false },
  { id: 'excel', corto: 'Excel de Alejandro', cita: '«Cómo tomar la cafeína» (GBH Nutrición)', usa: 'estructura de partida y el ×1,5 de la tolerancia', app: false },
];

// tipo: «dato» (lo dice la fuente) · «derivado» (dosis publicada pasada por este modelo) · «supuesto» (decisión a firmar)
export const ORIGEN = {
  F: { tipo: 'dato', fuentes: ['blanchard1983', 'lammers2017'], nota: '108 ± 4 % (IV como referencia); 0,97 en modelo poblacional' },
  Vkg: { tipo: 'dato', fuentes: ['lelo1986', 'white2016', 'lammers2017', 'csajka2005'], nota: 'rango 0,55-0,72 L/kg' },
  CL70: { tipo: 'dato', fuentes: ['tantcheva1999', 'lammers2017', 'white2016', 'csajka2005'], nota: '0,08 L/h/kg en 786 personas' },
  'ka.ayunas': { tipo: 'dato', fuentes: ['sadek2017', 'kamimori2002', 'csajka2005'], nota: 'café 2,7; cápsula 1,3-2,4; chicle 3,2-4,0 h⁻¹' },
  'ka.comida': { tipo: 'dato', fuentes: ['brachtel1988'], nota: 'la comida lleva el pico de ~0,5 h a 1-3 h' },
  omega: { tipo: 'dato', fuentes: ['csajka2005', 'seng2009', 'lammers2017'], nota: 'CL 33-42 % · V 15-22 % · ka ~50 %' },
  'cov.fumador': { tipo: 'dato', fuentes: ['tantcheva1999', 'parsons1978', 'seng2009'], nota: '×1,2 a ×2,0 según cigarrillos' },
  'cov.anticonceptivos': { tipo: 'dato', fuentes: ['abernethy1985', 'csajka2005', 'tantcheva1999'], nota: '×0,54 a ×0,72; solo los combinados' },
  obesidad: { tipo: 'derivado', fuentes: ['caraco1995'], nota: 'peso ajustado 0,4 ≈ el 0,44 L/kg medido' },
  'PD.concentracion': { tipo: 'derivado', fuentes: ['lieberman1987', 'efsa2011', 'excel'], nota: 'pico que dan 32 mg (sensible) y 75 mg (normal); tolerante ×1,5' },
  'PD.rendimiento': { tipo: 'derivado', fuentes: ['guest2021', 'efsa2011', 'jenkins2008', 'talanian2016', 'bell2002'], nota: 'dosis de la guía (2/3/3 mg/kg; el tolerante, más si hace falta para cubrir el entreno, hasta 6); línea de efecto, el nivel a 1 h de la mínima eficaz (1,5 y 2 mg/kg); tolerante ×1,5, que cuadra con Bell y McLellan' },
  'antelacion.rendimiento': { tipo: 'dato', fuentes: ['guest2021', 'kamimori2002'], nota: '~60 min antes; el chicle, 5-15 min' },
  'PD.nervios': { tipo: 'supuesto', fuentes: ['rogers2013', 'maughan2018'], nota: 'sensible 2-3,6 mg/L medido; el resto, extrapolado' },
  'PD.sueno': { tipo: 'derivado', fuentes: ['gardiner2023', 'drake2013'], nota: 'nivel al acostarse con los cortes de Gardiner' },
  topes: { tipo: 'dato', fuentes: ['efsa2015', 'guest2021', 'maughan2018'], nota: '200 mg/toma, 400 mg/día; deporte ≤ 6 mg/kg' },
};
