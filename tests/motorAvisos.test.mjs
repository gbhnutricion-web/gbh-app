// node --test tests/motorAvisos.test.mjs (sin Node en el PC de GBH: los mismos casos corren en
// Chrome sin cabeza con 07. App GBH/arnes_avisos.py). Cada caso lanza un Error si falla.
// Fechas fijas: lun 28-sep-2026 … dom 4-oct-2026, en hora local.
import test from 'node:test';
import {
  planificarAvisos, normHora, idAviso, nombresDePlan, horarioDeTurno, diaPlan,
  HORIZONTE_DIAS, MAX_AVISOS, FRANJA_CASA,
} from '../src/motorAvisos.js';

const ok = (c, m) => { if (!c) throw new Error(m || 'no se cumple'); };
const igual = (a, b, m) => { const x = JSON.stringify(a), y = JSON.stringify(b); if (x !== y) throw new Error(`${m || ''} ${x} ≠ ${y}`); };
const F = (d, h = 6, m = 0) => new Date(2026, 8, d, h, m, 0, 0);          // 28 = lunes 28-sep-2026
const FO = (d, h = 6, m = 0) => new Date(2026, 9, d, h, m, 0, 0);         // octubre
const hhmm = (a) => `${String(a.at.getHours()).padStart(2, '0')}:${String(a.at.getMinutes()).padStart(2, '0')}`;
const dia = (a) => a.fecha;
const TODOS = { '1': true, '2': true, '3': true, '4': true, '5': true, '6': true, '7': true };
const PLAN5 = { Desayuno: TODOS, Almuerzo: TODOS, Comida: TODOS, Merienda: TODOS, Cena: TODOS };
const NOMBRES = { Comida: { '1': 'Pollo al curry con arroz', '2': 'Merluza en salsa verde' } };
// El turno de tarde que dio la primera paciente que lo pidió (28-sep-2026).
const TARDE = { turno: 'tarde', manana: {}, tarde: { Desayuno: '07:00', Almuerzo: '10:00', Comida: '12:30', Merienda: '17:30', Cena: '21:00' } };
const SUPL = [{ nombre: 'Omega 3', tipo: 'Suplemento', hora: '15:00' }];
const ELIA = { lang: 'es', prefs: { comidas: true, tomas: true, registro: true, pesaje: false },
  horario: TARDE, planTomas: PLAN5, planNombres: NOMBRES, supl: SUPL };

export const CASOS = [
  { que: 'turno de tarde, lunes a las 06:00: cinco comidas y el suplemento cada día, 3 días', prueba: () => {
    const r = planificarAvisos({ ...ELIA, ahora: F(28) });
    igual(r.length, 18, 'avisos');
    igual(r.filter((a) => dia(a) === '2026-09-28').map(hhmm), ['07:00', '10:00', '12:30', '15:00', '17:30', '21:00'], 'horas de hoy');
    ok(!r.some((a) => a.tipo === 'registro'), 'con avisos de comida no hay registro aparte');
    const comida = r.find((a) => dia(a) === '2026-09-28' && a.toma === 'Comida');
    igual(comida.titulo, '🍽️ Comida · 12:30');
    ok(comida.cuerpo.includes('Pollo al curry con arroz'), comida.cuerpo);
    const cena = r.find((a) => dia(a) === '2026-09-28' && a.toma === 'Cena');
    ok(cena.cuerpo.endsWith('Y de paso, marca lo de hoy.'), 'el registro va dentro de la cena: ' + cena.cuerpo);
    igual(r.find((a) => dia(a) === '2026-09-29' && a.toma === 'Comida').cuerpo, 'Hoy: Merluza en salsa verde. Toca para ver la receta.');
    igual(r.find((a) => dia(a) === '2026-09-30' && a.toma === 'Comida').cuerpo, 'Toca para ver tu receta de hoy.', 'sin plato conocido');
  } },
  { que: 'a las 13:00, con desayuno, almuerzo y comida marcados: hoy quedan suplemento, merienda y cena', prueba: () => {
    const r = planificarAvisos({ ...ELIA, ahora: F(28, 13), marcadasHoy: { Desayuno: 'seguida', Almuerzo: 'seguida', Comida: 'menos' } });
    igual(r.filter((a) => dia(a) === '2026-09-28').map((a) => `${hhmm(a)} ${a.tipo}`), ['15:00 tomas', '17:30 comidas', '21:00 comidas']);
  } },
  { que: 'una comida marcada antes de su hora ya no suena; mañana sí', prueba: () => {
    const r = planificarAvisos({ ...ELIA, ahora: F(28, 6), marcadasHoy: { Merienda: 'seguida' } });
    ok(!r.some((a) => dia(a) === '2026-09-28' && a.toma === 'Merienda'), 'la merienda de hoy');
    ok(r.some((a) => dia(a) === '2026-09-29' && a.toma === 'Merienda'), 'la de mañana');
  } },
  { que: 'suplemento hecho hoy: no suena hoy y sí mañana', prueba: () => {
    const r = planificarAvisos({ ...ELIA, ahora: F(28, 6), suplHechosHoy: { 'Omega 3': true } });
    ok(!r.some((a) => a.tipo === 'tomas' && dia(a) === '2026-09-28'));
    ok(r.some((a) => a.tipo === 'tomas' && dia(a) === '2026-09-29'));
  } },
  { que: 'día cerrado: hoy no suena ninguna comida ni el registro', prueba: () => {
    const r = planificarAvisos({ ...ELIA, ahora: F(28, 16), dietaHoy: true });
    ok(!r.some((a) => dia(a) === '2026-09-28' && (a.tipo === 'comidas' || a.tipo === 'registro')));
    ok(r.some((a) => dia(a) === '2026-09-29' && a.tipo === 'comidas'));
  } },
  { que: 'sin avisos de comida: el de las 20:00 dice lo que falta, y la racha va en su propio aviso de la noche', prueba: () => {
    const plan = { Desayuno: TODOS, Comida: TODOS, Cena: TODOS };
    const r = planificarAvisos({ ahora: F(28, 18), planTomas: plan, marcadasHoy: { Comida: 'seguida' }, racha: 5, prefs: { pesaje: false, tomas: false } });
    igual(r.map((a) => `${dia(a)} ${hhmm(a)} ${a.tipo}`),
      ['2026-09-28 20:00 registro', '2026-09-28 21:30 racha', '2026-09-29 20:00 registro', '2026-09-30 20:00 registro']);
    igual(r[0].titulo, '🐑 ¿Qué tal ha ido hoy?');
    igual(r[0].cuerpo, 'Te quedan el desayuno y la cena por marcar.', 'la racha no se repite a las 20:00');
    igual(r[2].cuerpo, 'Marca lo que has comido: son diez segundos.', 'mañana no se sabe qué faltará');
    ok(!/fallad|no has|perder/i.test(r.map((a) => `${a.titulo} ${a.cuerpo}`).join(' ')), 'Bo no culpabiliza');
  } },
  { que: 'con el aviso de racha apagado, el de las 20:00 vuelve a nombrarla', prueba: () => {
    const r = planificarAvisos({ ahora: F(28, 18), planTomas: { Desayuno: TODOS, Cena: TODOS }, racha: 5, prefs: { pesaje: false, racha: false } });
    igual(r[0].cuerpo, 'Te quedan el desayuno y la cena por marcar. Tu racha de 5 días te espera.');
    ok(!r.some((a) => a.tipo === 'racha'));
  } },
  { que: 'racha de noche: hoy abierto → hoy a las 21:30, en positivo; mañana no se sabe y no se programa', prueba: () => {
    const r = planificarAvisos({ ahora: F(28, 9), racha: 12, prefs: { registro: false, pesaje: false, tomas: false } });
    igual(r.map((a) => `${dia(a)} ${hhmm(a)} ${a.tipo}`), ['2026-09-28 21:30 racha']);
    igual(r[0].titulo, '🔥 Tu racha de 12 días sigue viva');
    igual(r[0].cuerpo, 'Marca lo de hoy antes de medianoche y mañana serán 13.');
    igual(r[0].destino, 'plan');
  } },
  { que: 'racha de noche: hoy ya cerrado → nada hoy y la de mañana con la racha que ya incluye hoy', prueba: () => {
    const r = planificarAvisos({ ahora: F(28, 20), dietaHoy: true, racha: 13, prefs: { registro: false, pesaje: false, tomas: false } });
    igual(r.map((a) => `${dia(a)} ${hhmm(a)} ${a.tipo}`), ['2026-09-29 21:30 racha']);
    igual(r[0].titulo, '🔥 Tu racha de 13 días sigue viva');
  } },
  { que: 'racha de noche: con escudo, en pausa o con menos de 3 días, no hay aviso', prueba: () => {
    const base = { ahora: F(28, 9), prefs: { registro: false, pesaje: false, tomas: false } };
    igual(planificarAvisos({ ...base, racha: 12, escudos: 1 }).length, 0, 'escudo');
    igual(planificarAvisos({ ...base, racha: 12, pausas: [{ d: '2026-09-27', h: '2026-10-02' }] }).length, 0, 'pausa');
    igual(planificarAvisos({ ...base, racha: 2 }).length, 0, 'racha corta');
    igual(planificarAvisos({ ...base, racha: 12, pausas: [{ d: '2026-10-01', h: '2026-10-05' }] }).length, 1, 'una pausa que empieza después no la tapa');
  } },
  { que: 'racha de noche: si el paciente cena tarde, el aviso va 45 min después de la cena, con tope a las 23:00', prueba: () => {
    const r = planificarAvisos({ ...ELIA, ahora: F(28, 6), racha: 8 });
    igual(hhmm(r.find((a) => a.tipo === 'racha')), '21:45', 'Elia cena a las 21:00');
    const tarde = { turno: 'tarde', manana: {}, tarde: { Cena: '22:45' } };
    igual(hhmm(planificarAvisos({ ...ELIA, horario: tarde, ahora: F(28, 6), racha: 8 }).find((a) => a.tipo === 'racha')), '23:00', 'tope');
  } },
  { que: 'semana nueva del estándar: el lunes a las 09:30 si su plan es de una semana anterior; nada si es de esa semana', prueba: () => {
    const s = (fechaGen, activa = true) => planificarAvisos({ ahora: FO(3, 8), prefs: { registro: false, pesaje: false, tomas: false, racha: false }, semana: { activa, fechaGen } });
    igual(s('2026-09-27T10:12:00+02:00').map((a) => `${dia(a)} ${hhmm(a)} ${a.tipo}`), ['2026-10-05 09:30 semana']);
    igual(s(null).map((a) => a.tipo), ['semana'], 'sin plan todavía');
    igual(s('2026-09-27T10:12:00+02:00', false).length, 0, 'premium o en prueba: sin candado');
    const r = planificarAvisos({ ahora: FO(5, 8), prefs: { registro: false, pesaje: false, tomas: false, racha: false }, semana: { activa: true, fechaGen: '2026-10-05T07:30:00+02:00' } });
    igual(r.length, 0, 'generado ese mismo lunes');
  } },
  { que: 'con una sola toma pendiente, en singular; con racha corta, sin racha', prueba: () => {
    const r = planificarAvisos({ ahora: F(28, 18), planTomas: { Comida: TODOS, Cena: TODOS }, marcadasHoy: { Comida: 'seguida' }, racha: 2, prefs: { pesaje: false } });
    igual(r[0].cuerpo, 'Te queda la cena por marcar.');
  } },
  { que: 'comidas activadas pero el turno activo sin horas: vuelve el registro de las 20:00', prueba: () => {
    const r = planificarAvisos({ ...ELIA, ahora: F(28, 6), horario: { ...TARDE, turno: 'manana' } });
    ok(!r.some((a) => a.tipo === 'comidas'));
    igual(r.filter((a) => a.tipo === 'registro').map(hhmm), ['20:00', '20:00', '20:00']);
  } },
  { que: 'medicación: en la pantalla de bloqueo no sale el nombre; el suplemento sí', prueba: () => {
    const r = planificarAvisos({ ahora: F(28, 6), prefs: { registro: false, pesaje: false },
      supl: [{ nombre: 'Metformina', tipo: 'Medicación', hora: '08:00' }, { nombre: 'Creatina', tipo: 'Suplemento', hora: '9:15' }] });
    igual(r.filter((a) => dia(a) === '2026-09-28').map((a) => a.titulo), ['💊 Tu toma de las 08:00', '💪 Creatina · 09:15']);
    ok(!r.some((a) => `${a.titulo} ${a.cuerpo}`.includes('Metformina')), 'el nombre de la medicación no viaja');
  } },
  { que: 'pesaje: el martes deja solo el del miércoles a las 09:30', prueba: () => {
    const r = planificarAvisos({ ahora: F(29, 8), prefs: { tomas: false, registro: false, pesaje: true } });
    igual(r.map((a) => `${dia(a)} ${hhmm(a)}`), ['2026-09-30 09:30']);
    igual(r[0].destino, 'medidas');
  } },
  { que: 'pesaje: el sábado ya pesado no deja ni el del sábado ni el del domingo', prueba: () => {
    const r = planificarAvisos({ ahora: FO(3, 8), pesadoVentanaActual: true, prefs: { tomas: false, registro: false, pesaje: true } });
    igual(r.length, 0);
  } },
  { que: 'pesaje: el sábado sin peso deja sábado 09:30 y domingo 10:30', prueba: () => {
    const r = planificarAvisos({ ahora: FO(3, 8), prefs: { tomas: false, registro: false, pesaje: true } });
    igual(r.map((a) => `${dia(a)} ${hhmm(a)}`), ['2026-10-03 09:30', '2026-10-04 10:30']);
  } },
  { que: 'pesaje: el viernes, un peso del miércoles no tapa el fin de semana', prueba: () => {
    const r = planificarAvisos({ ahora: FO(2, 8), pesadoVentanaActual: false, prefs: { tomas: false, registro: false, pesaje: true } });
    igual(r.map((a) => dia(a)), ['2026-10-03', '2026-10-04']);
  } },
  { que: 'los avisos de la casa (registro y pesaje) caen dentro de 09:00-21:30', prueba: () => {
    for (let d = 28; d <= 30; d++) {
      const r = planificarAvisos({ ahora: F(d, 0, 5), planTomas: PLAN5, prefs: { pesaje: true } });
      for (const a of r.filter((x) => x.tipo === 'registro' || x.tipo === 'pesaje')) {
        ok(hhmm(a) >= FRANJA_CASA[0] && hhmm(a) <= FRANJA_CASA[1], `${a.tipo} a las ${hhmm(a)}`);
      }
    }
  } },
  { que: 'nada en el pasado y nada más allá del horizonte de 3 días', prueba: () => {
    const ahora = F(28, 22);
    const r = planificarAvisos({ ...ELIA, ahora });
    ok(r.every((a) => a.at > ahora), 'algo en el pasado');
    ok(!r.some((a) => dia(a) === '2026-09-28'), 'hoy ya no queda nada');
    igual([...new Set(r.map(dia))], ['2026-09-29', '2026-09-30'], `horizonte de ${HORIZONTE_DIAS} días`);
  } },
  { que: 'IDs: enteros positivos de 31 bits, únicos y estables entre dos llamadas', prueba: () => {
    const a = planificarAvisos({ ...ELIA, ahora: F(28, 6) }), b = planificarAvisos({ ...ELIA, ahora: F(28, 6, 30) });
    ok(a.every((x) => Number.isInteger(x.id) && x.id > 0 && x.id <= 2147483647), 'rango');
    igual(new Set(a.map((x) => x.id)).size, a.length, 'repetidos');
    igual(a.map((x) => x.id), b.map((x) => x.id), 'reprogramar da los mismos IDs');
    ok(idAviso('comidas|2026-09-28|Cena') !== idAviso('comidas|2026-09-29|Cena'), 'otro día, otro ID');
  } },
  { que: 'sin plan: ni comidas ni registro; los suplementos sí', prueba: () => {
    const r = planificarAvisos({ ...ELIA, ahora: F(28, 6), planTomas: null });
    igual([...new Set(r.map((a) => a.tipo))], ['tomas']);
  } },
  { que: 'un día sin esa toma en el plan no avisa de ella', prueba: () => {
    const r = planificarAvisos({ ...ELIA, ahora: FO(2, 6), planTomas: { ...PLAN5, Merienda: { '1': true, '2': true, '3': true, '4': true, '5': true } } });
    ok(r.some((a) => dia(a) === '2026-10-02' && a.toma === 'Merienda'), 'el viernes sí');
    ok(!r.some((a) => dia(a) === '2026-10-03' && a.toma === 'Merienda'), 'el sábado no');
  } },
  { que: 'en inglés', prueba: () => {
    const r = planificarAvisos({ ...ELIA, lang: 'en', ahora: F(28, 6), racha: 8 });
    igual(r.find((a) => a.toma === 'Comida').titulo, '🍽️ Lunch · 12:30');
    ok(r.find((a) => a.toma === 'Cena').cuerpo.endsWith("And while you're at it, log today."));
    igual(r.find((a) => a.tipo === 'racha').titulo, '🔥 Your 8-day streak is still alive');
    const s = planificarAvisos({ lang: 'en', ahora: FO(3, 8), prefs: { registro: false, pesaje: false, tomas: false, racha: false }, semana: { activa: true, fechaGen: null } });
    igual(s[0].titulo, '🗓️ Your new week is ready to generate');
  } },
  { que: 'normHora entiende las horas como las escribe un paciente', prueba: () => {
    igual(['7am', '7', '07:00', '12:30', '9.15', '1730', '7pm', '12am', '21h', ' 10 am '].map(normHora),
      ['07:00', '07:00', '07:00', '12:30', '09:15', '17:30', '19:00', '00:00', '21:00', '10:00']);
    igual(['', null, '25:00', '12:61', 'mediodía', '7:5'].map(normHora), [null, null, null, null, null, null]);
  } },
  { que: 'horarioDeTurno: solo horas válidas y solo del turno activo', prueba: () => {
    igual(horarioDeTurno({ turno: 'tarde', manana: { Comida: '14:00' }, tarde: { Comida: '12:30', Cena: 'luego' } }), { Comida: '12:30' });
    igual(horarioDeTurno(null), {});
  } },
  { que: 'nombresDePlan lee Nombre_Receta por toma y día y descarta lo vacío', prueba: () => {
    const pj = { Comida: { '1': { Nombre_Receta: ' Lentejas estofadas ' }, '2': { Nombre_Receta: '' } }, Cena: {}, cambio_receta: [] };
    igual(nombresDePlan(pj), { Comida: { '1': 'Lentejas estofadas' } });
    igual(nombresDePlan(null), null);
  } },
  { que: 'el cambio de hora del 25-oct no mueve el aviso de las 20:00', prueba: () => {
    const r = planificarAvisos({ ahora: new Date(2026, 9, 24, 10, 0), planTomas: PLAN5, prefs: { tomas: false, pesaje: false } });
    const d25 = r.find((a) => dia(a) === '2026-10-25');
    igual(hhmm(d25), '20:00');
    igual(diaPlan(new Date(2026, 9, 25, 12)), '7', 'domingo = 7');
  } },
  { que: `tope de ${MAX_AVISOS} avisos, por hora`, prueba: () => {
    const muchos = Array.from({ length: 30 }, (_, i) => ({ nombre: `S${i}`, tipo: 'Suplemento', hora: `${String(6 + (i % 16)).padStart(2, '0')}:${String(i).padStart(2, '0')}` }));
    const r = planificarAvisos({ ahora: F(28, 5), supl: muchos, prefs: { registro: false, pesaje: false } });
    igual(r.length, MAX_AVISOS);
    ok(r.every((a, i) => i === 0 || r[i - 1].at <= a.at), 'ordenados');
  } },
];

for (const c of CASOS) test(`avisos · ${c.que}`, c.prueba);
