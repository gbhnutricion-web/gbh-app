// ─── Avisos fuera de la app · fase 1: notificaciones LOCALES (28-sep-2026) ─────
// Motor PURO. Con lo que la app ya sabe (tomas del plan y su plato, lo marcado hoy,
// suplementos, pesajes y el horario de comidas del paciente) calcula los avisos de
// los próximos HORIZONTE_DIAS días. No toca el complemento nativo ni el
// almacenamiento: eso es src/avisosNativos.js. Plan y reglas en
// 07. App GBH/BRIEF_notificaciones.md (MAESTRO-2026-682). Casos:
// tests/motorAvisos.test.mjs (sin Node: 07. App GBH/arnes_avisos.py).
import { esDiaDeMedicion, ventanaKeys, claveDia } from './ventanaMedicion.js';

export const HORIZONTE_DIAS = 3;      // quien no abre la app en 3 días deja de recibir avisos (§3.4)
export const MAX_AVISOS = 60;         // iOS guarda como mucho 64 pendientes por app
export const TOMAS_ORDEN = ['Desayuno', 'Almuerzo', 'Comida', 'Merienda', 'Cena'];
export const HORA_REGISTRO = '20:00';
export const HORA_PESAJE = { 3: '09:30', 6: '09:30', 0: '10:30' };   // getDay(): miércoles, sábado, domingo
export const FRANJA_CASA = ['09:00', '21:30'];   // solo para los avisos de la casa; los del paciente suenan a su hora (§3.5)
export const PREFS_POR_DEFECTO = { comidas: false, tomas: true, registro: true, pesaje: true };
export const TURNOS = ['manana', 'tarde'];

// «7am», «7», «7:00», «07.00», «12:30», «1730», «7pm» → «HH:MM»; lo que no es una hora → null.
export function normHora(h) {
  if (h == null) return null;
  const s = String(h).trim().toLowerCase().replace(/\s+/g, '').replace(/h$/, '');
  const m = s.match(/^(\d{1,2})(?:[:.])?(\d{2})?(am|pm)?$/);
  if (!m) return null;
  let hh = parseInt(m[1], 10);
  const mm = m[2] ? parseInt(m[2], 10) : 0;
  if (m[3] === 'pm' && hh < 12) hh += 12;
  if (m[3] === 'am' && hh === 12) hh = 0;
  if (hh > 23 || mm > 59) return null;
  return `${String(hh).padStart(2, '0')}:${String(mm).padStart(2, '0')}`;
}

// Día del plan: 1 = lunes … 7 = domingo, como las celdas de plan_json.
export const diaPlan = (d) => { const w = d.getDay(); return String(w === 0 ? 7 : w); };

// ID estable (FNV-1a de 32 bits) → entero positivo de 31 bits: Android los exige enteros, y
// reprogramar lo mismo da el mismo número.
export function idAviso(clave) {
  let h = 0x811c9dc5;
  for (let i = 0; i < clave.length; i++) { h ^= clave.charCodeAt(i); h = Math.imul(h, 0x01000193) >>> 0; }
  return (h & 0x7fffffff) || 1;
}

// Horas del turno activo, ya validadas: {Toma: 'HH:MM'}.
export function horarioDeTurno(horario) {
  const h = horario || {};
  const turno = h.turno === 'tarde' ? 'tarde' : 'manana';
  const src = h[turno] || {};
  const r = {};
  for (const tm of TOMAS_ORDEN) { const v = normHora(src[tm]); if (v) r[tm] = v; }
  return r;
}

// Plato de cada toma y día del plan vigente: {Toma: {'1': 'Nombre', …}}. Los cambios de
// receta con gemas se guardan en el mismo plan_json, así que el nombre es el de verdad.
export function nombresDePlan(pj) {
  const m = {};
  for (const tm of TOMAS_ORDEN) {
    const celdas = pj && pj[tm];
    if (!celdas || typeof celdas !== 'object') continue;
    const dd = {};
    for (let d = 1; d <= 7; d++) {
      const n = celdas[String(d)] && celdas[String(d)].Nombre_Receta;
      if (n) dd[String(d)] = String(n).trim().slice(0, 80);
    }
    if (Object.keys(dd).length) m[tm] = dd;
  }
  return Object.keys(m).length ? m : null;
}

const TX = {
  es: {
    toma: { Desayuno: 'Desayuno', Almuerzo: 'Almuerzo', Comida: 'Comida', Merienda: 'Merienda', Cena: 'Cena' },
    art: { Desayuno: 'el desayuno', Almuerzo: 'el almuerzo', Comida: 'la comida', Merienda: 'la merienda', Cena: 'la cena' },
    y: ' y ',
    comidaCon: (n) => `Hoy: ${n}. Toca para ver la receta.`,
    comidaSin: 'Toca para ver tu receta de hoy.',
    yRegistro: ' Y de paso, marca lo de hoy.',
    registroTit: '🐑 ¿Qué tal ha ido hoy?',
    registroQueda: (l, n) => `Te ${n === 1 ? 'queda' : 'quedan'} ${l} por marcar.`,
    registroGen: 'Marca lo que has comido: son diez segundos.',
    racha: (n) => ` Tu racha de ${n} días te espera.`,
    medTit: (h) => `💊 Tu toma de las ${h}`,
    suplTit: (n, h) => `💪 ${n} · ${h}`,
    tomaCuerpo: 'Toca para marcarla como hecha.',
    pesoTit: '⚖️ Hoy toca pesarse',
    pesoCuerpo: 'Te llevo directamente a Medidas.',
  },
  en: {
    toma: { Desayuno: 'Breakfast', Almuerzo: 'Morning snack', Comida: 'Lunch', Merienda: 'Afternoon snack', Cena: 'Dinner' },
    art: { Desayuno: 'breakfast', Almuerzo: 'your morning snack', Comida: 'lunch', Merienda: 'your afternoon snack', Cena: 'dinner' },
    y: ' and ',
    comidaCon: (n) => `Today: ${n}. Tap to see the recipe.`,
    comidaSin: "Tap to see today's recipe.",
    yRegistro: " And while you're at it, log today.",
    registroTit: '🐑 How did today go?',
    registroQueda: (l) => `You still have ${l} to log.`,
    registroGen: 'Log what you ate: it takes ten seconds.',
    racha: (n) => ` Your ${n}-day streak is waiting.`,
    medTit: (h) => `💊 Your ${h} dose`,
    suplTit: (n, h) => `💪 ${n} · ${h}`,
    tomaCuerpo: 'Tap to mark it as done.',
    pesoTit: '⚖️ Weigh-in day',
    pesoCuerpo: "I'll take you straight to Measurements.",
  },
};

const unir = (xs, y) => (xs.length <= 1 ? (xs[0] || '') : `${xs.slice(0, -1).join(', ')}${y}${xs[xs.length - 1]}`);
const enFecha = (d, hhmm) => { const [h, m] = hhmm.split(':').map(Number); return new Date(d.getFullYear(), d.getMonth(), d.getDate(), h, m, 0, 0); };
const masDias = (d, n) => new Date(d.getFullYear(), d.getMonth(), d.getDate() + n, 12, 0, 0, 0);

// Entrada (todo opcional salvo ahora):
//   ahora, lang, prefs {comidas,tomas,registro,pesaje}, horario {turno, manana:{Toma:hora}, tarde:{…}},
//   planTomas {Toma:{'1':true…}}, planNombres {Toma:{'1':'Nombre'…}}, marcadasHoy {Toma:x},
//   dietaHoy (día cerrado), racha, supl [{nombre,tipo,hora}], suplHechosHoy {nombre:true},
//   pesadoVentanaActual (ya hay peso en la ventana en curso), horizonteDias.
// Salida: [{id, at, titulo, cuerpo, tipo, destino, fecha, toma?}] por hora, sin nada pasado.
export function planificarAvisos(e = {}) {
  const ahora = e.ahora instanceof Date ? e.ahora : new Date();
  const t = TX[e.lang === 'en' ? 'en' : 'es'];
  const prefs = { ...PREFS_POR_DEFECTO, ...(e.prefs || {}) };
  const horas = horarioDeTurno(e.horario);
  const H = Math.max(1, Math.min(7, e.horizonteDias || HORIZONTE_DIAS));
  const out = [];
  const poner = (a) => { if (a.at > ahora) out.push({ ...a, id: idAviso(`${a.tipo}|${a.fecha}|${a.clave || ''}`) }); };

  for (let i = 0; i < H; i++) {
    const dia = masDias(ahora, i);
    const fecha = claveDia(dia);
    const hoy = i === 0;
    const dp = diaPlan(dia);
    const tomas = TOMAS_ORDEN.filter((tm) => e.planTomas && e.planTomas[tm] && e.planTomas[tm][dp]);
    const marcadas = hoy ? (e.marcadasHoy || {}) : {};
    const cerrado = hoy && !!e.dietaHoy;

    // 1 · Comidas: a la hora de cada toma del plan de ese día, con su plato.
    const conHora = prefs.comidas ? tomas.filter((tm) => horas[tm]) : [];
    const ultima = conHora.slice().sort((a, b) => horas[a].localeCompare(horas[b])).pop();
    if (!cerrado) for (const tm of conHora) {
      if (marcadas[tm]) continue;
      const plato = ((e.planNombres && e.planNombres[tm] && e.planNombres[tm][dp]) || '').trim();
      let cuerpo = plato ? t.comidaCon(plato) : t.comidaSin;
      if (prefs.registro && tm === ultima) cuerpo += t.yRegistro;      // el de las 20:00 va dentro
      poner({ tipo: 'comidas', fecha, clave: tm, toma: tm, at: enFecha(dia, horas[tm]),
              titulo: `🍽️ ${t.toma[tm]} · ${horas[tm]}`, cuerpo, destino: 'plan' });
    }

    // 2 · Registro de las 20:00, solo si ese día no hay avisos de comida.
    if (prefs.registro && !conHora.length && tomas.length && !cerrado) {
      const pend = tomas.filter((tm) => !marcadas[tm]);
      if (pend.length) {
        let cuerpo = hoy ? t.registroQueda(unir(pend.map((tm) => t.art[tm]), t.y), pend.length) : t.registroGen;
        if (hoy && (e.racha || 0) >= 3) cuerpo += t.racha(e.racha);
        poner({ tipo: 'registro', fecha, at: enFecha(dia, HORA_REGISTRO), titulo: t.registroTit, cuerpo, destino: 'plan' });
      }
    }

    // 3 · Tomas de suplementos y medicación, a la hora que puso el paciente o su plan.
    if (prefs.tomas) for (const it of (e.supl || [])) {
      const h = normHora(it && it.hora);
      const nombre = String((it && it.nombre) || '').trim();
      if (!h || !nombre) continue;
      if (hoy && e.suplHechosHoy && e.suplHechosHoy[nombre]) continue;
      const med = /^medicaci[oó]n$/i.test(String((it && it.tipo) || '').trim());   // en la pantalla de bloqueo, sin nombre (§3.7)
      poner({ tipo: 'tomas', fecha, clave: nombre, at: enFecha(dia, h),
              titulo: med ? t.medTit(h) : t.suplTit(nombre, h), cuerpo: t.tomaCuerpo, destino: 'home' });
    }

    // 4 · Pesaje: miércoles y fin de semana, salvo que la ventana en curso ya tenga peso.
    if (prefs.pesaje && esDiaDeMedicion(dia)) {
      const deLaVentanaActual = ventanaKeys(ahora).includes(fecha);
      if (!(deLaVentanaActual && e.pesadoVentanaActual)) {
        poner({ tipo: 'pesaje', fecha, at: enFecha(dia, HORA_PESAJE[dia.getDay()]),
                titulo: t.pesoTit, cuerpo: t.pesoCuerpo, destino: 'medidas' });
      }
    }
  }
  out.sort((a, b) => a.at - b.at);
  return out.slice(0, MAX_AVISOS);
}
