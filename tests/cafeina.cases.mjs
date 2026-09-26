// Casos del motor de la calculadora de cafeína (cafeina.js). Los ejecutan:
//  · node --test tests/cafeina.test.mjs          (en el repo de la app);
//  · py arnes_cafeina.py                           (sin Node: Chrome sin cabeza + rxode2).
// Cada caso devuelve { ok, detalle } para que los dos caminos compartan la misma comprobación.
import { PK, PD, TOPES, FORMAS, TOLERANCIAS, pkIndividual, concentracion, curva, pico, tramosPorEncima, umbrales, cribado, tope,
         horaLimiteSueno, recomendar, comparaNormal, bandas, equivalencias, pesoActual, pesoParaCalculo, anticonceptivosDe, interaccionesDe,
         perfilDesdeApp } from '../src/cafeina.js';

const cerca = (a, b, rel = 1e-9) => Math.abs(a - b) <= rel * Math.max(1, Math.abs(b));
const fmt = (x) => (typeof x === 'number' ? +x.toPrecision(4) : x);
const minEnVentana = (tomas, pk, a, b) => { let m = Infinity; for (let t = a; t <= b + 1e-9; t += 1 / 60) m = Math.min(m, concentracion(t, tomas, pk)); return m; };

export const CASOS = [
  // ── farmacocinética ──
  { que: 'perfil típico: 70 kg, café en ayunas', f: () => {
      const p = pkIndividual({ peso: 70 });
      return { ok: cerca(p.CL, PK.CL70) && cerca(p.V, PK.Vkg * 70) && p.ka === PK.ka.cafe && cerca(p.t12, Math.LN2 * p.V / p.CL) && Math.abs(p.t12 - 5.2) < 0.1, detalle: `CL ${fmt(p.CL)} · V ${fmt(p.V)} · t½ ${fmt(p.t12)} h` };
  } },
  { que: 'sin altura, el peso escala V lineal y CL alométrico', f: () => {
      const p = pkIndividual({ peso: 100 });
      return { ok: cerca(p.V, PK.Vkg * 100) && cerca(p.CL, PK.CL70 * Math.pow(100 / 70, PK.expCL)) && !p.ajustado, detalle: `V ${fmt(p.V)} · CL ${fmt(p.CL)}` };
  } },
  { que: 'obesidad (IMC > 30): peso ajustado, V por kilo como el medido (0,44 ± 0,06 L/kg)', f: () => {
      const p = pkIndividual({ peso: 120, altura: 170, sexo: 'M' }), n = pkIndividual({ peso: 70, altura: 170, sexo: 'M' });
      const vkg = p.V / 120;
      return { ok: p.ajustado && !n.ajustado && vkg > 0.38 && vkg < 0.5, detalle: `peso de cálculo ${fmt(p.peso)} kg · V ${fmt(p.V)} L = ${fmt(vkg)} L/kg de peso real` };
  } },
  { que: 'tabaco y anticonceptivos multiplican el aclaramiento y no el volumen', f: () => {
      const b = pkIndividual({ peso: 60 }), f = pkIndividual({ peso: 60, fumador: true }), a = pkIndividual({ peso: 60, anticonceptivos: true });
      return { ok: cerca(f.CL, b.CL * PK.cov.fumador) && cerca(a.CL, b.CL * PK.cov.anticonceptivos) && cerca(f.V, b.V) && cerca(a.V, b.V),
               detalle: `t½ ${fmt(b.t12)} h → fumador ${fmt(f.t12)} h · anticonceptivos ${fmt(a.t12)} h` };
  } },
  { que: 'con comida y en cápsula la absorción es más lenta; el chicle libera el 85 %', f: () => {
      const a = pkIndividual({ peso: 70 }), c = pkIndividual({ peso: 70, comida: true }), k = pkIndividual({ peso: 70, forma: 'capsula' }), g = pkIndividual({ peso: 70, forma: 'chicle' });
      const t = (p) => pico([{ t: 0, mg: 200 }], p).t;
      return { ok: cerca(c.ka, a.ka * PK.kaComida) && t(c) > t(a) && t(k) > t(a) && g.F === 0.85, detalle: `tmáx café ${fmt(t(a))} h · con comida ${fmt(t(c))} h · cápsula ${fmt(t(k))} h · chicle F ${g.F}` };
  } },
  { que: 'balance de masa: AUC = F·dosis/CL', f: () => {
      const p = pkIndividual({ peso: 80, comida: true, forma: 'chicle' }), c = curva([{ t: 0, mg: 250 }], p, { desde: 0, hasta: 150, paso: 1 / 60 });
      let auc = 0; for (let i = 1; i < c.length; i++) auc += (c[i].t - c[i - 1].t) * (c[i].c + c[i - 1].c) / 2;
      const teo = p.F * 250 / p.CL;
      return { ok: Math.abs(auc / teo - 1) < 1e-4, detalle: `AUC ${fmt(auc)} · teórica ${fmt(teo)}` };
  } },
  { que: 'dos tomas = suma de las dos por separado', f: () => {
      const p = pkIndividual({ peso: 65 }), t = 7.3;
      const ab = concentracion(t, [{ t: 1, mg: 120 }, { t: 5, mg: 80 }], p), s = concentracion(t, [{ t: 1, mg: 120 }], p) + concentracion(t, [{ t: 5, mg: 80 }], p);
      return { ok: cerca(ab, s, 1e-12), detalle: `${fmt(ab)} vs ${fmt(s)}` };
  } },
  { que: 'ka = ke no rompe la fórmula (límite continuo)', f: () => {
      const p = pkIndividual({ peso: 70 }), q = { ...p, ka: p.ke }, q2 = { ...p, ka: p.ke * (1 + 1e-6) };
      const a = concentracion(3, [{ t: 0, mg: 100 }], q), b = concentracion(3, [{ t: 0, mg: 100 }], q2);
      return { ok: Number.isFinite(a) && Math.abs(a / b - 1) < 1e-5, detalle: `${fmt(a)} vs ${fmt(b)}` };
  } },
  { que: 'el pico cae donde dice la fórmula', f: () => {
      const p = pkIndividual({ peso: 70 }), tmax = p.tlag + Math.log(p.ka / p.ke) / (p.ka - p.ke), m = pico([{ t: 0, mg: 100 }], p, { paso: 1 / 600 });
      return { ok: Math.abs(m.t - tmax) < 1 / 300, detalle: `pico ${fmt(m.t)} h · fórmula ${fmt(tmax)} h` };
  } },
  { que: 'los bordes del efecto están donde la curva cruza el umbral', f: () => {
      const p = pkIndividual({ peso: 70 }), tomas = [{ t: 8, mg: 150 }], u = 1.5, tr = tramosPorEncima(tomas, p, u, { desde: 8, hasta: 32 });
      const ok = tr.length === 1 && Math.abs(concentracion(tr[0].desde, tomas, p) - u) < 1e-6 && Math.abs(concentracion(tr[0].hasta, tomas, p) - u) < 1e-6;
      return { ok, detalle: JSON.stringify(tr.map((x) => [fmt(x.desde), fmt(x.hasta)])) };
  } },
  // ── umbrales derivados ──
  { que: 'umbrales: los de concentración y rendimiento son el nivel de su dosis de referencia', f: () => {
      const p = pkIndividual({ peso: 70 }), U = umbrales('normal'), S = umbrales('sensible'), T = umbrales('tolerante');
      const c75 = pico([{ t: 0, mg: 75 }], p, { desde: 0, hasta: 6, paso: 1 / 120 }).c, r2 = concentracion(1, [{ t: 0, mg: 140 }], p);
      return { ok: cerca(U.concentracion, c75, 1e-12) && cerca(U.rendimiento, r2, 1e-12) && S.concentracion < U.concentracion && U.concentracion < T.concentracion
               && S.rendimiento < U.rendimiento && cerca(T.rendimiento, U.rendimiento * PD.factorTolerante, 1e-12) && cerca(T.concentracion, U.concentracion * PD.factorTolerante, 1e-12)
               && U.sueno > 0.6 && U.sueno < 1.2 && S.sueno === PD.suenoSensible,
               detalle: `concentración ${fmt(S.concentracion)}/${fmt(U.concentracion)}/${fmt(T.concentracion)} · rendimiento ${fmt(S.rendimiento)}/${fmt(U.rendimiento)}/${fmt(T.rendimiento)} · sueño ${fmt(U.sueno)} mg/L` };
  } },
  { que: 'la línea de rendimiento del tolerante cae donde la sitúa Bell y McLellan 2002 (5 mg/kg: a las 3 h sí, a las 6 h no)', f: () => {
      const p = pkIndividual({ peso: 70, forma: 'capsula' }), T = umbrales('tolerante'), c3 = concentracion(3, [{ t: 0, mg: 350 }], p), c6 = concentracion(6, [{ t: 0, mg: 350 }], p);
      return { ok: T.rendimiento > c6 && T.rendimiento < c3 && umbrales('normal').rendimiento < c6, detalle: `a 6 h ${fmt(c6)} < tolerante ${fmt(T.rendimiento)} < a 3 h ${fmt(c3)} mg/L; normal ${fmt(umbrales('normal').rendimiento)} por debajo de 6 h` };
  } },
  // ── la recomendación ──
  ...TOLERANCIAS.map((tolerancia) => ({ que: `concentración: la dosis cubre las 3 h pedidas y es la mínima · ${tolerancia}`, f: () => {
      const r = recomendar({ peso: 72, tolerancia }, { objetivo: 'concentracion', inicio: 10, duracion: 3 });
      if (r.limitado) return { ok: r.avisos.includes('tope') && r.mg <= r.tope, detalle: `limitada al tope: ${r.mg} mg (harían falta ${fmt(r.necesarios)})` };
      const peor = minEnVentana(r.tomas, r.pk, 10, 13), menos = r.mg - TOPES.redondeo, peorMenos = minEnVentana([{ t: r.tToma, mg: menos }], r.pk, 10, 13);
      return { ok: peor >= r.umbral - 1e-9 && (r.mg === TOPES.minimo || peorMenos < r.umbral) && r.cubre > 0.999, detalle: `${r.mg} mg a las ${fmt(r.tToma)} · mínimo ${fmt(peor)} ≥ ${fmt(r.umbral)} · con ${menos} mg, ${fmt(peorMenos)}` };
  } })),
  ...TOLERANCIAS.map((tolerancia) => ({ que: `rendimiento: al menos la dosis de la guía, toma en su ventana y efecto durante todo el entreno · ${tolerancia}`, f: () => {
      const r = recomendar({ peso: 72, tolerancia }, { objetivo: 'rendimiento', inicio: 18, duracion: 1.5 });
      const guia = Math.round(PD.rendimientoMgKg[tolerancia] * 72 / TOPES.redondeo) * TOPES.redondeo, antes = (18 - r.tToma) * 60;
      const dosisOk = tolerancia === 'tolerante' ? r.mg >= guia && r.mgkg <= TOPES.rendimiento.mgkg : r.mg === guia;
      return { ok: dosisOk && antes >= 30 - 1e-6 && antes <= 75 + 1e-6 && r.cubre > 0.999, detalle: `${r.mg} mg (${fmt(r.mgkg)} mg/kg), ${fmt(antes)} min antes · efecto ${fmt(r.tramo.desde)}-${fmt(r.tramo.hasta)} h · cubre ${fmt(r.cubre * 100)} %` };
  } })),
  { que: 'la tolerancia se nota en la dosis: sensible < normal < tolerante, en concentración y en rendimiento', f: () => {
      const d = (tolerancia, objetivo) => recomendar({ peso: 72, tolerancia }, { objetivo, inicio: objetivo === 'rendimiento' ? 18 : 10, duracion: objetivo === 'rendimiento' ? 1.5 : 3 }).mg;
      const c = TOLERANCIAS.map((t) => d(t, 'concentracion')), r = TOLERANCIAS.map((t) => d(t, 'rendimiento'));
      return { ok: c[0] < c[1] && c[1] < c[2] && r[0] < r[1] && r[1] < r[2], detalle: `concentración ${c.join('/')} mg · rendimiento ${r.join('/')} mg` };
  } },
  { que: 'la tolerancia se nota en la duración: con la dosis de una persona normal, al tolerante le dura menos y al sensible más', f: () => {
      const out = {};
      for (const objetivo of ['concentracion', 'rendimiento']) {
        const pet = { objetivo, inicio: objetivo === 'rendimiento' ? 18 : 10, duracion: objetivo === 'rendimiento' ? 1.5 : 3 };
        const n = recomendar({ peso: 72 }, pet), dn = n.tramo.hasta - n.tramo.desde, t = comparaNormal({ peso: 72, tolerancia: 'tolerante' }, pet), s = comparaNormal({ peso: 72, tolerancia: 'sensible' }, pet);
        out[objetivo] = { normal: fmt(dn), tolerante: fmt(t.horas), sensible: fmt(s.horas), ok: t.horas < dn && s.horas > dn };
      }
      return { ok: out.concentracion.ok && out.rendimiento.ok, detalle: JSON.stringify(out) };
  } },
  { que: 'probar otra dosis: se respeta, se redondea a 10 mg y no pasa del tope', f: () => {
      const a = recomendar({ peso: 70 }, { objetivo: 'concentracion', inicio: 10, duracion: 3, mg: 84 }), b = recomendar({ peso: 70 }, { objetivo: 'concentracion', inicio: 10, duracion: 3, mg: 900 });
      return { ok: a.mg === 80 && a.probada && b.mg === 200 && b.limitado && b.avisos.includes('tope'), detalle: `84 → ${a.mg} mg · 900 → ${b.mg} mg` };
  } },
  { que: 'rendimiento: cápsula 45-90 min antes y chicle 5-20 min antes', f: () => {
      const k = recomendar({ peso: 72, forma: 'capsula' }, { objetivo: 'rendimiento', inicio: 18, duracion: 1.5 }), g = recomendar({ peso: 72, forma: 'chicle' }, { objetivo: 'rendimiento', inicio: 18, duracion: 1.5 });
      const ak = (18 - k.tToma) * 60, ag = (18 - g.tToma) * 60;
      return { ok: ak >= 45 - 1e-6 && ak <= 90 + 1e-6 && ag >= 5 - 1e-6 && ag <= 20 + 1e-6, detalle: `cápsula ${fmt(ak)} min · chicle ${fmt(ag)} min` };
  } },
  { que: 'ninguna recomendación da un pico típico por encima de 10 mg/L (45-150 kg, todas las formas)', f: () => {
      let peor = { c: 0 };
      for (const peso of [45, 60, 75, 90, 110, 150]) for (const tolerancia of TOLERANCIAS) for (const objetivo of ['concentracion', 'rendimiento']) for (const forma of FORMAS) for (const comida of [false, true]) {
        const r = recomendar({ peso, tolerancia, forma, comida }, { objetivo, inicio: 12, duracion: objetivo === 'rendimiento' ? 3 : 6 });
        if (r.mg && r.pico.c > peor.c) peor = { c: r.pico.c, peso, tolerancia, objetivo, forma, mg: r.mg };
      }
      return { ok: peor.c <= PD.picoMax, detalle: JSON.stringify({ ...peor, c: fmt(peor.c) }) };
  } },
  { que: 'ventana larga que el tope por toma no deja cubrir (concentración 6 h, tolerante, 60 kg): se reparte y cubre más', f: () => {
      const pet = { objetivo: 'concentracion', inicio: 9, duracion: 6 }, r = recomendar({ peso: 60, tolerancia: 'tolerante' }, pet);
      const unica = recomendar({ peso: 60, tolerancia: 'tolerante' }, { ...pet, mg: 900 });
      const cadaUna = r.tomas.every((d) => d.mg <= r.tope + 1e-9), separadas = r.tomas.every((d, i) => !i || d.t - r.tomas[i - 1].t >= 1 - 1e-9);
      return { ok: r.plan && r.tomas.length > 1 && cadaUna && separadas && r.mg <= TOPES.diario && r.cubre > unica.cubre, detalle: `${r.tomas.map((d) => `${d.mg} mg a las ${fmt(d.t)}`).join(' + ')} · cubre ${fmt(r.cubre)} (una sola toma de ${unica.mg} mg: ${fmt(unica.cubre)})` };
  } },
  { que: 'entreno de 3 h con riesgo de nervios (sensible y fumador): se reparte, ninguna toma lleva a nervios y cubre al menos lo mismo', f: () => {
      const r = recomendar({ peso: 72, tolerancia: 'sensible', fumador: true }, { objetivo: 'rendimiento', inicio: 10, duracion: 3 });
      const separadas = r.tomas.every((d, i) => !i || d.t - r.tomas[i - 1].t >= 1 - 1e-9);
      return { ok: r.plan && r.plan.motivo === 'nervios' && r.plan.unica.pico > r.umbrales.nervios * 0.95 && r.pico.c < r.umbrales.nervios && r.cubre >= r.plan.unica.cubre - 1e-9 && separadas,
               detalle: `una sola: ${r.plan && r.plan.unica.mg} mg, pico ${fmt(r.plan && r.plan.unica.pico)} · repartida: ${r.tomas.map((d) => `${d.mg} mg a las ${fmt(d.t)}`).join(' + ')}, pico ${fmt(r.pico.c)} < ${r.umbrales.nervios} · cubre ${fmt(r.cubre)}` };
  } },
  { que: 'si el modelo no lo justifica, una sola toma: normal y tolerante con 3 h de rendimiento, normal con 3 h de concentración', f: () => {
      const a = recomendar({ peso: 72 }, { objetivo: 'rendimiento', inicio: 9, duracion: 3 }), b = recomendar({ peso: 72, tolerancia: 'tolerante' }, { objetivo: 'rendimiento', inicio: 9, duracion: 3 });
      const c = recomendar({ peso: 72 }, { objetivo: 'concentracion', inicio: 9, duracion: 3 });
      return { ok: [a, b, c].every((r) => !r.plan && r.tomas.length === 1), detalle: `normal 3 h: ${a.mg} mg, pico ${fmt(a.pico.c)} · tolerante 3 h: ${b.mg} mg, pico ${fmt(b.pico.c)} · concentración 3 h: ${c.mg} mg` };
  } },
  { que: 'lo tomado hoy descuenta del tope diario de 400 mg', f: () => {
      const r = recomendar({ peso: 90, tolerancia: 'tolerante' }, { objetivo: 'rendimiento', inicio: 18, duracion: 2, otrasHoy: 390 });
      return { ok: r.mg === 0 && r.avisos.includes('sin_margen_diario'), detalle: JSON.stringify({ mg: r.mg, tope: fmt(r.tope) }) };
  } },
  { que: 'topes: 3 mg/kg y 200 mg para concentración; 6 mg/kg y 400 mg para rendimiento; al día, 400 mg o 5,7 mg/kg', f: () => {
      const a = tope('concentracion', 50), b = tope('concentracion', 90), c = tope('rendimiento', 55), d = tope('rendimiento', 90);
      return { ok: a === 150 && b === 200 && cerca(c, 5.7 * 55) && d === 400, detalle: [a, b, c, d].join(' · ') };
  } },
  { que: 'una persona ligera no pasa de 5,7 mg/kg en el día aunque se le repartan las tomas', f: () => {
      let peor = 0;
      for (const tolerancia of TOLERANCIAS) for (const forma of FORMAS) for (const [objetivo, duracion] of [['rendimiento', 1.5], ['rendimiento', 3], ['concentracion', 6]]) {
        const r = recomendar({ peso: 45, tolerancia, forma }, { objetivo, inicio: 9, duracion });
        peor = Math.max(peor, r.mg / 45);
      }
      return { ok: peor <= TOPES.diarioMgKg + 1e-9, detalle: `máximo del día ${fmt(peor)} mg/kg` };
  } },
  { que: 'rendimiento en una persona de 110 kg: por encima de 200 mg avisa de que sale de lo evaluado por la EFSA', f: () => {
      const r = recomendar({ peso: 110 }, { objetivo: 'rendimiento', inicio: 18, duracion: 1.5 });
      return { ok: r.mg > 200 && r.avisos.includes('sobre_efsa'), detalle: `${r.mg} mg · avisos ${r.avisos.join(',')}` };
  } },
  { que: 'la hora límite de sueño deja el nivel justo en el umbral al acostarse', f: () => {
      const p = pkIndividual({ peso: 70 }), U = umbrales('normal'), h = horaLimiteSueno(p, 200, 23.5, U.sueno);
      const c = concentracion(23.5, [{ t: h, mg: 200 }], p);
      return { ok: Math.abs(c - U.sueno) < 1e-6 && h < 23.5, detalle: `última toma ${fmt(h)} h · a las 23:30 ${fmt(c)} mg/L` };
  } },
  { que: 'la regla de sueño reproduce los cortes de Gardiner 2023 (un café ≥ 8,8 h antes)', f: () => {
      const p = pkIndividual({ peso: 70 }), U = umbrales('normal'), h = horaLimiteSueno(p, 107, 24, U.sueno);
      return { ok: Math.abs((24 - h) - 8.8) < 1.5, detalle: `107 mg: última toma ${fmt(24 - h)} h antes de dormir` };
  } },
  { que: 'una toma a última hora avisa de que quita el sueño', f: () => {
      const r = recomendar({ peso: 70 }, { objetivo: 'concentracion', inicio: 20, duracion: 2, dormir: 23.5 });
      return { ok: r.sueno && !r.sueno.ok && r.avisos.includes('sueno') && r.sueno.horaLimite < r.tToma, detalle: JSON.stringify({ c: fmt(r.sueno.c), limite: fmt(r.sueno.horaLimite) }) };
  } },
  // ── cribado y datos de la app ──
  { que: 'embarazo y lactancia bloquean y bajan el tope diario a 200 mg; la medicación de la app también bloquea', f: () => {
      const a = cribado({ embarazo: true }), b = cribado({}), c = cribado({}, { interacciones: [{ id: 'quinolona', item: 'Ciprofloxacino 500' }] });
      return { ok: a.bloquea && a.topeDiario === 200 && !b.bloquea && b.topeDiario === 400 && c.bloquea && c.motivos.includes('medicacion'), detalle: JSON.stringify([a.motivos, b.motivos, c.motivos]) };
  } },
  { que: 'peso actual: el último pesaje aunque lleguen desordenados; sin pesajes, el del alta', f: () => {
      const a = pesoActual([{ log_date: '2026-09-20', weight_kg: 71.2 }, { log_date: '2026-09-23', weight_kg: 70.4 }, { log_date: '2026-09-01', weight_kg: 73 }], 75);
      const b = pesoActual([], 68.5), c = pesoActual([{ log_date: '2026-09-23', weight_kg: 'x' }], null);
      return { ok: a.peso === 70.4 && a.fecha === '2026-09-23' && a.origen === 'pesaje' && b.peso === 68.5 && b.origen === 'alta' && c.peso === null, detalle: JSON.stringify([a, b, c]) };
  } },
  { que: 'anticonceptivos desde la medicación: combinado, solo gestágeno, no consta, hombre', f: () => {
      const a = anticonceptivosDe('F', [{ nombre: 'Vitamina D', tipo: 'Suplemento' }, { nombre: 'Yasmin', tipo: 'Medicación' }]);
      const b = anticonceptivosDe('F', [{ nombre: 'Cerazet', tipo: 'Medicación' }]), c = anticonceptivosDe('F', []), d = anticonceptivosDe('M', [{ nombre: 'Yasmin' }]);
      return { ok: a.estado === 'combinado' && b.estado === 'solo_gestageno' && c.estado === 'no_consta' && d.estado === 'no_aplica', detalle: [a.estado, b.estado, c.estado, d.estado].join(' · ') };
  } },
  { que: 'interacciones desde la medicación: ciprofloxacino y bisoprolol sí; ibuprofeno y omeprazol no', f: () => {
      const x = interaccionesDe([{ nombre: 'Ciprofloxacino 500 mg' }, { nombre: 'Bisoprolol' }, { nombre: 'Ibuprofeno' }, { nombre: 'Omeprazol' }]);
      return { ok: x.length === 2 && x[0].id === 'quinolona' && x[1].id === 'betabloqueante', detalle: JSON.stringify(x) };
  } },
  { que: 'perfilDesdeApp: peso y anticonceptivos salen de los datos, sin preguntar', f: () => {
      const r = perfilDesdeApp({ sexo: 'F', alturaCm: 165, registrosPeso: [{ log_date: '2026-09-22', weight_kg: 61.3 }], pesoInicial: 64, medicacion: [{ nombre: 'Anticonceptivo', tipo: 'Medicación', hora: '22:00' }] }, { tolerancia: 'sensible' });
      return { ok: r.perfil.peso === 61.3 && r.perfil.anticonceptivos === true && r.perfil.tolerancia === 'sensible' && r.datos.interacciones.length === 0, detalle: JSON.stringify(r.perfil) };
  } },
  { que: 'la franja entre personas ordena p10 ≤ p50 ≤ p90 y abraza la curva típica', f: () => {
      const perfil = { peso: 70 }, tomas = [{ t: 9, mg: 200 }], b = bandas(perfil, tomas, { desde: 9, hasta: 21, paso: 0.5, n: 400 }), p = pkIndividual(perfil);
      const orden = b.every((x) => x.p10 <= x.p50 + 1e-12 && x.p50 <= x.p90 + 1e-12);
      const dentro = b.filter((x) => x.t > 9.3).every((x) => { const c = concentracion(x.t, tomas, p); return c >= x.p10 && c <= x.p90; });
      return { ok: orden && dentro, detalle: `a las 12: p10 ${fmt(b[6].p10)} · p50 ${fmt(b[6].p50)} · p90 ${fmt(b[6].p90)}` };
  } },
  { que: 'equivalencias: café y bebida energética en mL; cápsulas y chicles en unidades', f: () => {
      const e = equivalencias(160, 'cafe'), g = equivalencias(160, 'energetica'), k = equivalencias(300, 'capsula');
      const filtro = e.find((x) => x.id === 'cafe_filtro'), espresso = e.find((x) => x.id === 'espresso'), lata = g.find((x) => x.id === 'energetica');
      const k120 = equivalencias(120, 'capsula');
      return { ok: e.length === 2 && filtro.ml === 360 && espresso.ml === 120 && lata.ml === 500 && k.find((x) => x.id === 'capsula_100').n === 3 && !k.find((x) => x.id === 'capsula_200')
               && !k.some((x) => x.ml) && k.every((x) => Number.isInteger(x.n)) && k120.length === 1 && k120[0].id === 'capsula_100' && k120[0].n === 1,
               detalle: JSON.stringify([e, g, k, k120]) };
  } },
];

export function comprobarTodo() {
  return CASOS.map((c) => { try { const r = c.f(); return { que: c.que, ok: !!r.ok, detalle: String(r.detalle) }; } catch (e) { return { que: c.que, ok: false, detalle: 'excepción: ' + e }; } });
}

// ── Validación externa: mediciones publicadas que NO se usaron para fijar los parámetros ──
// Criterio escrito antes de correrla: cada punto vale si el modelo cae entre 0,67 y 1,5 veces lo
// observado; el modelo pasa si lo cumple al menos el 80 % de los puntos. Donde el estudio no da el
// peso y la dosis va en mg/kg, se usan 70 kg (el peso casi se cancela); donde no lo da y la dosis
// va en mg, también 70 kg, y se dice.
export const EXTERNA = [
  { fuente: 'Blanchard y Sawers 1983', que: '5 mg/kg en solución, ayunas: pico', mgkg: 5, perfil: { peso: 70, forma: 'cafe' }, medida: 'pico', obs: 10.0 },
  { fuente: 'Teekachunhatean 2013', que: '96 mg de café, 58,9 kg: pico', mg: 96, perfil: { peso: 58.9, forma: 'cafe' }, medida: 'pico', obs: 2.47 },
  { fuente: 'Teekachunhatean 2013', que: '96 mg de café, 58,9 kg: AUC (mg·h/L)', mg: 96, perfil: { peso: 58.9, forma: 'cafe' }, medida: 'auc', obs: 16.32 },
  { fuente: 'Krieger 2016', que: '200 mg en líquido, 78,9 kg: pico', mg: 200, perfil: { peso: 78.9, forma: 'cafe' }, medida: 'pico', obs: 4.12 },
  { fuente: 'Krieger 2016', que: '200 mg en líquido, 78,9 kg: a las 4 h', mg: 200, perfil: { peso: 78.9, forma: 'cafe' }, medida: 4, obs: 2.36 },
  { fuente: 'McCarthy 2025', que: '60 mg de café tras el desayuno, 69,9 kg: pico', mg: 60, perfil: { peso: 69.9, forma: 'cafe', comida: true }, medida: 'pico', obs: 1.9 },
  { fuente: 'Graham y Spriet 1995', que: '3 mg/kg en cápsula: a 1 h (2,9-3,9)', mgkg: 3, perfil: { peso: 70, forma: 'capsula' }, medida: 1, obs: 3.4 },
  { fuente: 'Graham y Spriet 1995', que: '6 mg/kg en cápsula: a 1 h', mgkg: 6, perfil: { peso: 70, forma: 'capsula' }, medida: 1, obs: 7.8 },
  { fuente: 'Graham y Spriet 1995', que: '9 mg/kg en cápsula: a 1 h (11,7-13,6)', mgkg: 9, perfil: { peso: 70, forma: 'capsula' }, medida: 1, obs: 12.65 },
  { fuente: 'Skinner 2013', que: '6 mg/kg en cápsula, ayunas: a 1 h', mgkg: 6, perfil: { peso: 70, forma: 'capsula' }, medida: 1, obs: 8.54 },
  { fuente: 'Skinner 2013', que: '6 mg/kg en cápsula, con comida: a 2 h', mgkg: 6, perfil: { peso: 70, forma: 'capsula', comida: true }, medida: 2, obs: 7.38 },
  { fuente: 'Skinner 2013', que: '9 mg/kg en cápsula, ayunas: a 1 h', mgkg: 9, perfil: { peso: 70, forma: 'capsula' }, medida: 1, obs: 13.59 },
  { fuente: 'Skinner 2013', que: '9 mg/kg en cápsula, con comida: a 3 h', mgkg: 9, perfil: { peso: 70, forma: 'capsula', comida: true }, medida: 3, obs: 10.87 },
  { fuente: 'Graham-Paulson 2017', que: '3 mg/kg en cápsula: pico', mgkg: 3, perfil: { peso: 70, forma: 'capsula' }, medida: 'pico', obs: 2.37 },
  { fuente: 'Syed 2005 (70 kg supuestos)', que: '3 chicles de 200 mg cada 2 h: pico tras el 3.º', mg: 200, repetir: 3, cada: 2, perfil: { peso: 70, forma: 'chicle' }, medida: 'pico_ultima', obs: 6.33 },
  { fuente: 'Syed 2005 (70 kg supuestos)', que: '3 chicles de 50 mg cada 2 h: pico tras el 3.º', mg: 50, repetir: 3, cada: 2, perfil: { peso: 70, forma: 'chicle' }, medida: 'pico_ultima', obs: 2.69 },
];
export function validacionExterna() {
  const filas = EXTERNA.map((e) => {
    const pk = pkIndividual(e.perfil), mg = e.mg != null ? e.mg : e.mgkg * e.perfil.peso, n = e.repetir || 1;
    const tomas = Array.from({ length: n }, (_, i) => ({ t: i * (e.cada || 0), mg }));
    let pred;
    if (e.medida === 'pico') pred = pico(tomas, pk, { desde: 0, hasta: 8, paso: 1 / 120 }).c;
    else if (e.medida === 'pico_ultima') pred = pico(tomas, pk, { desde: tomas[n - 1].t, hasta: tomas[n - 1].t + 6, paso: 1 / 120 }).c;
    else if (e.medida === 'auc') pred = pk.F * mg / pk.CL;
    else pred = concentracion(e.medida, tomas, pk);
    const cociente = pred / e.obs;
    return { fuente: e.fuente, que: e.que, observado: String(e.obs).replace('.', ','), predicho: pred.toFixed(2).replace('.', ','), cociente: cociente.toFixed(2).replace('.', ','), ok: cociente >= 0.67 && cociente <= 1.5 };
  });
  const ok = filas.filter((f) => f.ok).length;
  return { criterio: 'cociente modelo/observado entre 0,67 y 1,5 en al menos el 80 % de los puntos', puntos: filas.length, dentro: ok, pasa: ok / filas.length >= 0.8, filas };
}

// Casos para validar la solución exacta contra rxode2 (validar_cafeina_rxode2.R).
export function volcadoRxode2() {
  const rejilla = Array.from({ length: 36 * 4 + 1 }, (_, i) => i / 4);
  const casos = [
    { que: '70 kg · café en ayunas · 200 mg', perfil: { peso: 70 }, tomas: [{ t: 0, mg: 200 }] },
    { que: '55 kg · con comida · 100 mg + 100 mg a las 4 h', perfil: { peso: 55, comida: true }, tomas: [{ t: 0, mg: 100 }, { t: 4, mg: 100 }] },
    { que: '92 kg · fumador · cápsula de 300 mg', perfil: { peso: 92, fumador: true, forma: 'capsula' }, tomas: [{ t: 1, mg: 300 }] },
    { que: '60 kg · anticonceptivos · 150 mg + 100 mg a las 6 h', perfil: { peso: 60, anticonceptivos: true }, tomas: [{ t: 0.5, mg: 150 }, { t: 6.5, mg: 100 }] },
    { que: '48 kg · chicle con comida · tres tomas de 60 mg', perfil: { peso: 48, comida: true, forma: 'chicle' }, tomas: [{ t: 0, mg: 60 }, { t: 3, mg: 60 }, { t: 6, mg: 60 }] },
    { que: '125 kg · 172 cm · peso ajustado · 250 mg', perfil: { peso: 125, altura: 172, sexo: 'M' }, tomas: [{ t: 0, mg: 250 }] },
    { que: '80 kg · persona atípica (η)', perfil: { peso: 80 }, eta: { CL: -0.6, V: 0.25, ka: -0.9 }, tomas: [{ t: 0, mg: 240 }] },
  ];
  return { casos: casos.map((c) => { const pk = pkIndividual(c.perfil, c.eta || null); return { que: c.que, pk, tomas: c.tomas, t: rejilla, c: rejilla.map((t) => concentracion(t, c.tomas, pk)) }; }) };
}
