// Casos del motor de la calculadora de creatina (creatina.js). Los ejecutan:
//  · node --test tests/creatina.test.mjs   (en el repo de la app);
//  · py arnes_creatina.py                    (sin Node: Chrome sin cabeza; en 07. App GBH, contra creatina.js, igual en md5).
// Cada caso devuelve { ok, detalle }, así los dos caminos comparten la misma comprobación.
import { PARAM, CRM_A_CR, MMOL_A_G, TOPES, BANDA_Z, grasaJP7Siri, grasaDeurenberg, creatinaDelPlan, perfilDesdeApp, paciente, simular,
         parsePauta, umbralLleno, diaLleno, diaVuelta, estacionario, dosisMantenimiento, recomendar, probarDosis, cribado,
         equivalencias, interaccionesDe, INTERACCIONES, predecirEstudio } from '../src/motorCreatina.js';   // en el repo el motor se llama motorCreatina.js (5-oct)

const cerca = (a, b, rel = 1e-9) => Math.abs(a - b) <= rel * Math.max(1, Math.abs(b));
const fmt = (x) => (typeof x === 'number' ? +x.toPrecision(4) : x);
const EJ = { peso: 80, grasaPct: 15, sexo: 'M', dieta: 'omnivoro' };          // su ejemplo del Excel
const diaria = (g) => [{ desde: 0, hasta: Infinity, g, tomas: g >= 10 ? 4 : 1 }];

export const CASOS = [
  { que: 'la fórmula de % graso es la de la pestaña Medidas (JP7 + Siri)', f: () => {
      const d = 1.112 - 0.00043499 * 120 + 0.00000055 * 120 * 120 - 0.00028826 * 30, df = 1.097 - 0.00046971 * 150 + 0.00000056 * 150 * 150 - 0.00012828 * 40;
      return { ok: cerca(grasaJP7Siri(120, 30, 'M'), 495 / d - 450) && cerca(grasaJP7Siri(150, 40, 'F'), 495 / df - 450) && grasaJP7Siri(120, null, 'M') === null,
               detalle: `M ${fmt(grasaJP7Siri(120, 30, 'M'))} % · F ${fmt(grasaJP7Siri(150, 40, 'F'))} %` };
  } },
  { que: 'sin pliegues, % graso de Deurenberg (IMC, edad, sexo)', f: () => {
      const g = grasaDeurenberg(24.2, 30, 'M');
      return { ok: cerca(g, 1.2 * 24.2 + 0.23 * 30 - 10.8 - 5.4) && cerca(grasaDeurenberg(22, 30, 'F'), 1.2 * 22 + 0.23 * 30 - 5.4), detalle: `${fmt(g)} %` };
  } },
  { que: 'su ejemplo del Excel (80 kg, 15 %): masa muscular, basal y techo', f: () => {
      const p = paciente(EJ), M = 80 * 0.85 * PARAM.fMagra.M, k = MMOL_A_G * PARAM.msMh * M;
      return { ok: cerca(p.M, M) && cerca(p.B, PARAM.basalMmol.omnivoro * k) && cerca(p.T, PARAM.techoRel * PARAM.basalMmol.omnivoro * k) && p.T > p.B,
               detalle: `músculo ${fmt(p.M)} kg · basal ${fmt(p.B)} g (${fmt(p.B / p.M)} g/kg) · techo ${fmt(p.T)} g` };
  } },
  { que: 'sin tomar nada, el depósito se queda en su basal', f: () => {
      const p = paciente(EJ), s = simular(p, [], { dias: 120 }), peor = Math.max(...s.map((x) => Math.abs(x.C - p.B)));
      return { ok: peor <= 1e-9 * p.B, detalle: `desvío máximo ${fmt(peor)} g` };
  } },
  { que: 'nunca pasa del techo, ni con la carga más larga y 10 g después', f: () => {
      const p = paciente(EJ), g = Math.floor(TOPES.cargaGkg * 80);
      const s = simular(p, [{ desde: 0, hasta: 7, g, tomas: 4 }, { desde: 7, hasta: Infinity, g: 10, tomas: 4 }], { dias: 90 });
      const max = Math.max(...s.map((x) => x.C));
      return { ok: max <= p.T * (1 + 1e-12), detalle: `máximo ${fmt(max)} g · techo ${fmt(p.T)} g` };
  } },
  { que: 'balance de masa: lo captado + lo que no capta = lo tomado (en creatina)', f: () => {
      const p = paciente(EJ), pauta = parsePauta('20x6@4+3x30'), s = simular(p, pauta, { dias: 36 });
      const cap = s.reduce((a, x) => a + x.captado, 0), tir = s.reduce((a, x) => a + x.tirado, 0), tomado = (20 * 6 + 3 * 30) * CRM_A_CR;
      return { ok: cerca(cap + tir, tomado, 1e-12), detalle: `captado ${fmt(cap)} + no captado ${fmt(tir)} = ${fmt(cap + tir)} g · tomado ${fmt(tomado)} g` };
  } },
  { que: 'más dosis, más depósito, cada día', f: () => {
      const p = paciente(EJ), a = simular(p, diaria(3), { dias: 84 }), b = simular(p, diaria(5), { dias: 84 });
      return { ok: a.every((x, i) => b[i].C >= x.C - 1e-12), detalle: `día 28: 3 g ${fmt(a[28].C)} · 5 g ${fmt(b[28].C)} g` };
  } },
  { que: 'la carga sube antes que la dosis diaria sola', f: () => {
      const p = paciente(EJ), mant = dosisMantenimiento(p).g;
      const c = simular(p, [{ desde: 0, hasta: 7, g: Math.floor(0.3 * 80), tomas: 4 }, { desde: 7, hasta: Infinity, g: mant, tomas: 1 }], { dias: 84 });
      const d = simular(p, diaria(mant), { dias: 84 }), lc = diaLleno(c, p), ld = diaLleno(d, p);
      return { ok: c[7].C > d[7].C && !(lc === null && ld !== null) && (lc === null || ld === null || lc <= ld),
               detalle: `día 7: con carga ${fmt(c[7].C)} · sin carga ${fmt(d[7].C)} g · lleno: con carga ${lc}, sin carga ${ld}` };
  } },
  { que: 'al dejarla, vuelve a su nivel dentro de 24 semanas', f: () => {
      const p = paciente(EJ), e = estacionario(p, 5), s = simular(p, [], { dias: 168, C0: e.C, z0: e.z }), v = diaVuelta(s, p, 0);
      return { ok: v !== null && s[7].C < s[0].C, detalle: `vuelve en ${v} días` };
  } },
  { que: 'rápido: carga de 0,3 g/kg en 4 tomas, de 5 a 7 días, y mantenimiento entero de 3 a 10 g', f: () => {
      const r = recomendar(EJ, { modo: 'rapido' });
      return { ok: r.carga.g === Math.floor(0.3 * 80) && r.carga.tomas === 4 && r.carga.dias >= 5 && r.carga.dias <= 7 && Number.isInteger(r.mantenimiento.g)
               && r.mantenimiento.g >= 3 && r.mantenimiento.g <= 10 && r.avisos.includes('bascula') && r.avisos.includes('analitica'),
               detalle: `${r.carga.g} g × ${r.carga.dias} días, luego ${r.mantenimiento.g} g · lleno el día ${r.lleno}` };
  } },
  { que: 'el mantenimiento es el menor que mantiene lleno', f: () => {
      const p = paciente(EJ), m = dosisMantenimiento(p), u = umbralLleno(p);
      const ok = m.alcanza ? estacionario(p, m.g).C >= u && (m.g === 3 || estacionario(p, m.g - 1).C < u) : estacionario(p, 10).C < u;
      return { ok, detalle: `${m.g} g · estable en ${fmt(estacionario(p, m.g).C)} g · umbral ${fmt(u)} g` };
  } },
  { que: 'en Descarga no se propone carga y se avisa', f: () => {
      const r = recomendar({ ...EJ, descarga: true }, { modo: 'rapido' });
      return { ok: r.modo === 'sinPrisa' && r.carga === null && r.avisos.includes('descarga'), detalle: `modo ${r.modo}` };
  } },
  { que: 'ya la toma: la curva sale de donde la dejaron sus días de toma', f: () => {
      const p = paciente(EJ), s = simular(p, diaria(5), { dias: 60 }), r = recomendar(EJ, { modo: 'yaLaToma', yaLaToma: { g: 5, dias: 60 } });
      return { ok: cerca(r.serie[0].C, s[60].C), detalle: `parte de ${fmt(r.serie[0].C)} g · lleno el día ${r.lleno}` };
  } },
  { que: 'probar una dosis que no llega a lleno lo dice (lleno = null)', f: () => {
      const p = paciente(EJ), r = probarDosis(EJ, 1), llega = estacionario(p, 1).C >= umbralLleno(p);
      return { ok: llega || r.lleno === null, detalle: `1 g: lleno ${r.lleno} · estable ${fmt(estacionario(p, 1).C)} g · ${llega ? 'llegaría' : 'no llega'}` };
  } },
  { que: 'lo que se tira crece con la dosis', f: () => {
      const a = probarDosis(EJ, 3).tiradoSemana, b = probarDosis(EJ, 5).tiradoSemana, c = probarDosis(EJ, 10).tiradoSemana;
      return { ok: a < b && b < c, detalle: `g/semana: 3 g ${fmt(a)} · 5 g ${fmt(b)} · 10 g ${fmt(c)}` };
  } },
  { que: 'probar no pasa de la dosis de carga ni baja de 1 g', f: () => {
      return { ok: probarDosis(EJ, 99).g === Math.floor(0.3 * 80) && probarDosis(EJ, 0).g === 1, detalle: `${probarDosis(EJ, 99).g} y ${probarDosis(EJ, 0).g} g` };
  } },
  { que: 'cribado: cada motivo bloquea, y nada no bloquea', f: () => {
      const ks = ['rinon', 'embarazo', 'menor', 'reaccion'], todos = ks.every((k) => cribado({ [k]: true }).bloquea), nada = !cribado({}).bloquea;
      const med = cribado({}, { interacciones: [{ id: 'aine', item: 'Ibuprofeno 600' }] });
      return { ok: todos && nada && med.bloquea && med.motivos.includes('medicacion'), detalle: `con medicación: ${med.motivos.join(', ')}` };
  } },
  { que: 'lee la creatina del plan: 5 g, 3g, 500 mg y sin cantidad', f: () => {
      const a = creatinaDelPlan([{ nombre: 'Creatina monohidrato', dosis: '5 g' }]), b = creatinaDelPlan([{ nombre: 'Creatina', dosis: '3g' }]);
      const c = creatinaDelPlan([{ nombre: 'Creatina', dosis: '500 mg' }]), d = creatinaDelPlan([{ nombre: 'Creatina', dosis: 'una cucharadita' }]);
      const e = creatinaDelPlan([{ nombre: 'Omega 3', dosis: '1 g' }]);
      return { ok: a.g === 5 && b.g === 3 && c.g === 0.5 && d.g === null && e === null, detalle: `${a.g} · ${b.g} · ${c.g} · ${d.g} · ${e}` };
  } },
  { que: 'perfil desde la app: pliegues antes que la estimación; vegano; Descarga; lo que falta', f: () => {
      const base = { sexo: 'M', alturaCm: 178, ageRange: '26-35', registrosPeso: [{ log_date: '2026-10-01', weight_kg: 80 }] };
      const a = perfilDesdeApp({ ...base, sumaPliegues: 90, tipoDieta: 'Vegana' }), b = perfilDesdeApp({ ...base, tipoDieta: 'Descarga' });
      const c = perfilDesdeApp({ sexo: 'F', registrosPeso: [{ log_date: '2026-10-01', weight_kg: 60 }] });
      return { ok: a.datos.origenGrasa === 'pliegues' && a.perfil.dieta === 'vegetariano' && b.datos.origenGrasa === 'estimada' && b.perfil.descarga
               && c.perfil.grasaPct === null && c.datos.faltan.includes('altura') && c.datos.faltan.includes('dieta'),
               detalle: `A ${fmt(a.perfil.grasaPct)} % (${a.datos.origenGrasa}) · B ${fmt(b.perfil.grasaPct)} % · C faltan ${c.datos.faltan.join(', ')}` };
  } },
  { que: 'gramática de la pauta', f: () => {
      const p = parsePauta('20x6@4+2x30'), q = parsePauta('12x5');
      return { ok: p.length === 2 && p[0].desde === 0 && p[0].hasta === 6 && p[0].g === 20 && p[0].tomas === 4 && p[1].desde === 6 && p[1].hasta === 36
               && p[1].tomas === 1 && q[0].tomas === 4, detalle: JSON.stringify(p) };
  } },
  { que: 'cacitos de 5 g, con un decimal (a medio cacito, 3 g salían 2,5 g: menos que la dosis)', f: () => {
      return { ok: equivalencias(5).cacitos === 1 && equivalencias(7.5).cacitos === 1.5 && equivalencias(3).cacitos === 0.6 && equivalencias(24).cacitos === 4.8,
               detalle: `3 g → ${equivalencias(3).cacitos} · 5 g → ${equivalencias(5).cacitos} · 24 g → ${equivalencias(24).cacitos}` };
  } },
  { que: 'la medicación del plan que carga el riñón se detecta', f: () => {
      // con el primer patrón de la lista verificada (seguridad.json), sea cual sea: no depende de lo que salga de la búsqueda
      const alt = INTERACCIONES.length ? INTERACCIONES[0].patron.split('|')[0].replace(/[\^$()[\]?*+.]/g, '') : '';
      const r = interaccionesDe([{ nombre: alt, dosis: '1 comprimido' }, { nombre: 'Vitamina D' }]);
      return { ok: INTERACCIONES.length > 0 && r.length === 1, detalle: `${INTERACCIONES.length} grupos · «${alt}» → ${JSON.stringify(r)}` };
  } },
  { que: 'plazos de las guías: con carga 5-7 días, sin carga unas 4 semanas, al dejarla 4-6 semanas', f: () => {
      const r = recomendar(EJ, { modo: 'rapido' }), s = recomendar(EJ, { modo: 'sinPrisa' }), j = (x) => JSON.stringify(x);
      return { ok: j(r.plazos.lleno) === j({ dias: [5, 7] }) && j(s.plazos.lleno) === j({ semanas: 4 }) && j(r.plazos.lavado) === j({ semanas: [4, 6] }),
               detalle: j({ rapido: r.plazos, sinPrisa: s.plazos }) };
  } },
  { que: 'ya la toma: 4 semanas o más a 3 g o más, lleno; con 2 semanas le quedan 2; con 1 g no cuenta', f: () => {
      const a = recomendar(EJ, { modo: 'yaLaToma', yaLaToma: { g: 3, dias: 30 } }), b = recomendar(EJ, { modo: 'yaLaToma', yaLaToma: { g: 5, dias: 14 } });
      const c = recomendar(EJ, { modo: 'yaLaToma', yaLaToma: { g: 1, dias: 60 } });
      return { ok: a.plazos.lleno.ya === true && b.plazos.lleno.semanas === 2 && c.plazos.lleno.ya !== true,
               detalle: JSON.stringify([a.plazos.lleno, b.plazos.lleno, c.plazos.lleno]) };
  } },
  { que: 'η = 0 da el techo típico del MBMA; −η lo baja y +η lo sube, sin tocar el basal', f: () => {
      const w = BANDA_Z * PARAM.omegaR, a = paciente(EJ, -w), b = paciente(EJ), c = paciente(EJ, w), sobre = (p) => fmt((p.T / p.B - 1) * 100);
      return { ok: b.T === PARAM.techoRel * PARAM.basalMmol.omnivoro * b.k && a.T < b.T && b.T < c.T && a.B === b.B && c.B === b.B
               && cerca(c.T / (PARAM.basalMmol.omnivoro * c.k), 1 + Math.exp(PARAM.thetaR + w)),
               detalle: `techo sobre su basal: ${sobre(a)} % · ${sobre(b)} % · ${sobre(c)} %` };
  } },
  { que: 'la franja del día de lleno rodea al típico: con carga, sin prisa, ya la toma y probando 5 g', f: () => {
      const rs = [recomendar(EJ, { modo: 'rapido' }), recomendar(EJ, { modo: 'sinPrisa' }), recomendar(EJ, { modo: 'yaLaToma', yaLaToma: { g: 3, dias: 7 } }), probarDosis(EJ, 5)];
      const ok = rs.every((r) => r.lleno !== null && r.franja.pronto !== null && r.franja.pronto <= r.lleno && (r.franja.tarde === null || r.lleno <= r.franja.tarde));
      return { ok, detalle: rs.map((r) => `${r.franja.pronto} ≤ ${r.lleno} ≤ ${r.franja.tarde}`).join(' · ') };
  } },
];

export function comprobarTodo() {
  return CASOS.map((c) => { try { const r = c.f(); return { que: c.que, ok: !!r.ok, detalle: r.detalle }; }
                            catch (e) { return { que: c.que, ok: false, detalle: String(e && e.stack || e) }; } });
}

// Validación externa con las reglas de PROTOCOLO.md (fijadas antes de calibrar).
export function validacionExterna(estudios = []) {
  const filas = estudios.map((f) => {
    const obs = +f.tcr_post - +f.tcr_pre, sub = predecirEstudio(f) - +f.tcr_pre, regla = obs >= 5 ? 'cociente' : 'absoluta';
    const cociente = regla === 'cociente' ? sub / obs : null;
    const ok = regla === 'cociente' ? cociente >= 0.67 && cociente <= 1.5 : Math.abs(sub - obs) <= 5;
    return { id: f.id, cita: f.cita, pauta: f.pauta, dia: +f.dia_medida, observado: +obs.toFixed(2), predicho: +sub.toFixed(2),
             cociente: cociente == null ? null : +cociente.toFixed(3), regla, ok };
  });
  const dentro = filas.filter((x) => x.ok).length;
  return { filas, puntos: filas.length, dentro, pasa: filas.length > 0 && dentro / filas.length >= 0.8,
           criterio: '≥ 80 % de filas: cociente 0,67-1,5 si la subida observada es ≥ 5 mmol/kg ms; si no, |diferencia| ≤ 5 mmol/kg ms' };
}
// Casos que validar_creatina_rxode2.R resuelve como EDO (Infinity no cabe en JSON: hasta 1e9).
export function volcadoRxode2() {
  const EJ = { peso: 80, grasaPct: 15, sexo: 'M', dieta: 'omnivoro' }, VEG = { peso: 60, grasaPct: 26, sexo: 'F', dieta: 'vegetariano' };
  const caso = (nombre, perfil, pauta, dias, desdeLleno = false) => {
    const pac = paciente(perfil), e = desdeLleno ? estacionario(pac, 5) : { C: pac.B, z: 0 };
    const s = simular(pac, pauta, { dias, C0: e.C, z0: e.z });
    return { nombre, pac, pauta: pauta.map((t) => ({ ...t, hasta: Number.isFinite(t.hasta) ? t.hasta : 1e9 })), dias, C0: e.C, z0: e.z, C: s.map((x) => x.C) };
  };
  return [caso('rapido_80kg', EJ, recomendar(EJ, { modo: 'rapido' }).pauta, 84), caso('3g_80kg', EJ, parsePauta('3x84'), 84),
          caso('lavado_80kg', EJ, [], 84, true), caso('5g_vegetariana_60kg', VEG, parsePauta('5x84'), 84)];
}
// Las series de referencia de calibrar_creatina.R, recalculadas con el motor.
export function seriesJS(referencia) {
  const pac = paciente(referencia.perfil);
  return referencia.protocolos.map((p) => ({ nombre: p.nombre, C: simular(pac, parsePauta(p.pauta), { dias: p.dias }).map((x) => x.C) }));
}
