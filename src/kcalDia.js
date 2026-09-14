// ─── Kcal reales · cálculo puro (sin React) ──────────────────────────────────
// Lo PREVISTO sale del plan del día (plan_json[toma][día], ya escalado a la ración
// del paciente). Lo REAL sale del estado registrado (daily_logs.meals_log[toma],
// las cinco cadenas de siempre) y, cuando el plan no lo sabe, del detalle guardado
// en daily_logs.meals_real[toma] (fase 1: la fracción de «menos»; fase 2: los
// ítems de «la cambié» / «comí fuera» y los extras).
// Reglas: 07. App GBH/BRIEF_kcal_reales.md §4.2 y §4.4. Nada de aquí escribe.
// Tests: tests/kcalDia.test.mjs (node:test) sobre los casos de tests/kcalDia.cases.mjs.

export const TOMAS_ORDEN = ['Desayuno', 'Almuerzo', 'Comida', 'Merienda', 'Cena'];
export const FRACCIONES_MENOS = [[0.25, '¼'], [0.5, '½'], [0.75, '¾']];
export const FRAC_MENOS_DEFECTO = 0.5;
// Las mismas palabras vetadas que ESPEJO_PROHIBIDO en App.jsx: ninguna frase de
// «Tu día» puede llevarlas (hay test).
export const PALABRAS_VETADAS = ['solo', 'deberías', 'deberias', 'te has saltado', 'otra vez'];

export const num = (x) => {
  const v = typeof x === 'number' ? x : parseFloat(x);
  return Number.isFinite(v) ? v : 0;
};

export function fraccionValida(f) {
  if (f == null) return null;
  const v = num(f);
  return FRACCIONES_MENOS.some(([x]) => Math.abs(x - v) < 1e-9) ? v : null;
}

// Un ítem de la hoja «¿Qué comiste?» (fase 2): receta GBH (kcal de la ración base × raciones),
// alimento del diccionario (kcal por 100 g × gramos = unidad × cantidad) o «libre» (kcal a
// mano, sin macros). Los números viajan DENTRO del ítem para que el registro se lea sin el
// diccionario ni el recetario a mano.
export function kcalItem(it) {
  if (!it) return { kcal: 0, p: 0, h: 0, g: 0, conMacros: true, gramos: 0 };
  if (it.t === 'rec') {
    const q = num(it.q) || 1;
    return { kcal: num(it.kcal) * q, p: num(it.p) * q, h: num(it.h) * q, g: num(it.g) * q, conMacros: true, gramos: 0 };
  }
  if (it.t === 'ing') {
    const gramos = num(it.ug) * (num(it.q) || 1); const f = gramos / 100;
    return { kcal: num(it.k) * f, p: num(it.p) * f, h: num(it.h) * f, g: num(it.g) * f, conMacros: true, gramos };
  }
  return { kcal: num(it.kcal), p: 0, h: 0, g: 0, conMacros: false, gramos: 0 };
}

export function sumaItems(items) {
  const s = { kcal: 0, p: 0, h: 0, g: 0, conMacros: true };
  (Array.isArray(items) ? items : []).forEach((it) => {
    const v = kcalItem(it); s.kcal += v.kcal; s.p += v.p; s.h += v.h; s.g += v.g; if (!v.conMacros) s.conMacros = false;
  });
  return s;
}

// Lo previsto de una toma: la receta del plan, con sus kcal y macros ya escalados.
// Un menú compuesto (1º + 2º) trae los TOTALES en la celda; si faltaran, se suman
// sus platos. Devuelve null si la toma no tiene receta ese día.
export function previstoToma(planJ, toma, dia) {
  const m = planJ?.[toma]?.[String(dia)];
  if (!m || !m.Nombre_Receta) return null;
  let kcal = num(m.Calorias_Totales), p = num(m.Proteinas_g), h = num(m.Hidratos_g), g = num(m.Grasas_g);
  if (m.compuesta && Array.isArray(m.platos) && m.platos.length && kcal <= 0) {
    kcal = 0; p = 0; h = 0; g = 0;
    for (const pl of m.platos) {
      kcal += num(pl.Calorias_Totales); p += num(pl.Proteinas_g); h += num(pl.Hidratos_g); g += num(pl.Grasas_g);
    }
  }
  return { kcal, p, h, g, nombre: m.Nombre_Receta };
}

// Lo real de una toma a partir de su estado, su detalle y lo previsto.
//   seguida  → lo previsto            · saltada → 0
//   menos    → previsto × fracción (¼ ½ ¾; sin elegir, ½)
//   cambiada / fuera → el detalle (kcal y macros de los ítems, fase 2) o «?» (conocido:false)
// conMacros:false = se sabe la energía pero no los macros (ítem «kcal a mano»).
// Los extras (fase 2) se suman a cualquier estado; sobre una toma «?» cuentan en las kcal
// del día (que se leen como «al menos») pero la toma sigue sin cuantificar.
export function realToma(estado, detalle, previsto) {
  if (!estado || !previsto) return null;
  const cero = { kcal: 0, p: 0, h: 0, g: 0 };
  let base;
  switch (estado) {
    case 'seguida':
      base = { kcal: previsto.kcal, p: previsto.p, h: previsto.h, g: previsto.g, conocido: true, conMacros: true }; break;
    case 'saltada':
      base = { ...cero, conocido: true, conMacros: true }; break;
    case 'menos': {
      const f = fraccionValida(detalle?.frac) ?? FRAC_MENOS_DEFECTO;
      base = { kcal: previsto.kcal * f, p: previsto.p * f, h: previsto.h * f, g: previsto.g * f, conocido: true, conMacros: true, frac: f }; break;
    }
    default: {
      const items = detalle && Array.isArray(detalle.items) ? detalle.items : [];
      if (detalle && detalle.conocido === true && items.length) {
        const s = sumaItems(items);
        base = { kcal: s.kcal, p: s.p, h: s.h, g: s.g, conocido: true, conMacros: s.conMacros };
      } else if (detalle && detalle.conocido === true && detalle.kcal != null && Number.isFinite(num(detalle.kcal))) {
        base = { kcal: num(detalle.kcal), p: num(detalle.p), h: num(detalle.h), g: num(detalle.g), conocido: true, conMacros: detalle.conMacros !== false };
      } else {
        base = { ...cero, conocido: false, conMacros: false };
      }
    }
  }
  const extras = detalle && Array.isArray(detalle.extras) ? detalle.extras : [];
  if (extras.length) {
    const x = sumaItems(extras);
    base.kcal += x.kcal;
    if (base.conocido) { base.p += x.p; base.h += x.h; base.g += x.g; if (!x.conMacros) base.conMacros = false; }
    base.extras = extras.length;
  }
  return base;
}

// El día entero: previsto, real (solo tomas conocidas; macros solo de las que los
// tienen), por toma, y los recuentos que pinta la tarjeta.
export function resumenDia(planJ, dia, meals, real, tomas = TOMAS_ORDEN) {
  const previsto = { kcal: 0, p: 0, h: 0, g: 0 };
  const realT = { kcal: 0, p: 0, h: 0, g: 0 };
  const porToma = [];
  let planificadas = 0, registradas = 0, conocidas = 0, sinCuantificar = 0, sinMacros = 0, pendientesKcal = 0;
  for (const toma of tomas) {
    const prev = previstoToma(planJ, toma, dia);
    if (!prev) continue;
    planificadas++;
    previsto.kcal += prev.kcal; previsto.p += prev.p; previsto.h += prev.h; previsto.g += prev.g;
    const estado = (meals && meals[toma]) || null;
    const r = realToma(estado, real ? real[toma] : null, prev);
    if (r) {
      registradas++;
      if (r.conocido) {
        conocidas++; realT.kcal += r.kcal;
        if (r.conMacros) { realT.p += r.p; realT.h += r.h; realT.g += r.g; } else sinMacros++;
      } else { sinCuantificar++; realT.kcal += r.kcal; }   // «?» con extras: las kcal de los extras sí cuentan
    } else pendientesKcal += prev.kcal;
    porToma.push({ toma, estado, previsto: prev, real: r });
  }
  return {
    previsto, real: realT, porToma, planificadas, registradas, conocidas, sinCuantificar, sinMacros, pendientesKcal,
    completo: planificadas > 0 && registradas === planificadas,
  };
}

// Reparto de macros con Atwater 4/4/9 — la MISMA definición que tenía macrosDia.
export function fraccionesMacros({ p, h, g }) {
  const kp = num(p) * 4, kh = num(h) * 4, kg = num(g) * 9, tot = kp + kh + kg;
  return tot > 0 ? { fP: kp / tot, fH: kh / tot, fG: kg / tot, tot } : { fP: 0, fH: 0, fG: 0, tot: 0 };
}

// Separador de miles propio (1.630 / 1,630): no depende de los datos de localización del
// dispositivo, así que la cifra es la misma en el móvil, en Node y en Chrome sin cabeza.
export const fmtKcal = (n, lang) => {
  const v = Math.round(num(n)); const s = String(Math.abs(v)).replace(/\B(?=(\d{3})+(?!\d))/g, lang === 'en' ? ',' : '.');
  return (v < 0 ? '-' : '') + s;
};

// La frase bajo la cifra. Números literales, ninguna palabra vetada, nada de rojo.
export function fraseDia(res, lang) {
  const EN = lang === 'en';
  const k = (n) => fmtKcal(n, lang);
  if (!res || !res.planificadas) return EN ? 'No meals planned for this day.' : 'Este día no tiene comidas programadas.';
  if (res.registradas === 0) return EN ? 'Log your meals and the bar will fill up.' : 'Marca tus comidas y la barra se irá llenando.';
  const dif = res.real.kcal - res.previsto.kcal;
  if (res.sinCuantificar > 0) {
    const n = res.sinCuantificar;
    return EN ? `at least ${k(res.real.kcal)} kcal · ${n} meal${n > 1 ? 's' : ''} not quantified`
              : `al menos ${k(res.real.kcal)} kcal · ${n} comida${n > 1 ? 's' : ''} sin cuantificar`;
  }
  if (!res.completo) {
    const base = EN ? `~${k(res.pendientesKcal)} kcal still planned` : `te quedan ~${k(res.pendientesKcal)} kcal previstas`;
    return dif > 0 ? base + (EN ? ` · +${k(dif)} over plan` : ` · +${k(dif)} sobre lo previsto`) : base;
  }
  if (dif > 0) return EN ? `today: ${k(res.real.kcal)} kcal · +${k(dif)} over plan` : `hoy: ${k(res.real.kcal)} kcal · +${k(dif)} sobre lo previsto`;
  if (dif < 0) return EN ? `today: ${k(res.real.kcal)} kcal, ${k(-dif)} under plan` : `hoy: ${k(res.real.kcal)} kcal, ${k(-dif)} menos de lo previsto`;
  return EN ? `today: ${k(res.real.kcal)} kcal, as planned` : `hoy: ${k(res.real.kcal)} kcal, como lo previsto`;
}

// Palabras vetadas presentes en un texto (palabra entera, sin distinguir mayúsculas).
export function contieneVetadas(texto) {
  const t = String(texto || '').toLowerCase();
  return PALABRAS_VETADAS.filter((w) => new RegExp(`(^|[^a-záéíóúñ])${w}([^a-záéíóúñ]|$)`).test(t));
}
