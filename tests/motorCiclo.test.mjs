// node --test tests/motorCiclo.test.mjs (sin Node en el PC de GBH: los mismos casos corren en
// Chrome sin cabeza con 07. App GBH/arnes_ciclo.py, que además compara el motor celda a celda con
// las pestañas femeninas de la hoja «Análisis Corporal»). Cada caso lanza un Error si falla.
// Datos inventados: los pesos de las pacientes no entran en el repositorio.
import test from 'node:test';
import {
  semanaCiclo, sobre, semanaPrograma, parametros, esperado, ventana, guardarEleccion,
  fechaMas, diasEntre, RETENCION_DEFECTO, RETENCION_MAX,
} from '../src/motorCiclo.js';

const ok = (c, m) => { if (!c) throw new Error(m || 'no se cumple'); };
const igual = (a, b, m) => { const x = JSON.stringify(a), y = JSON.stringify(b); if (x !== y) throw new Error(`${m || ''} ${x} ≠ ${y}`); };
const cerca = (a, b, m) => { if (Math.abs(a - b) > 1e-9) throw new Error(`${m || ''} ${a} ≠ ${b}`); };

// La hoja, fórmula a fórmula (plantilla femenina, filas 50-62), para comparar con el motor.
const hojaH = (C58, n) => (C58 + n <= 4 ? C58 + n : ((C58 + n - 1) % 4) + 1);
const hojaJK = (J3, J4, C58, C61) => {
  const filas = [{ n: 0, h: hojaH(C58, 0), J: J3, K: J3 }];
  for (let n = 1; n <= 12; n++) {
    const a = filas[n - 1], h = hojaH(C58, n);
    const ajuste = (h === 3 || h === 4) ? C61 / 2 : (h === 1 ? -C61 : 0);
    filas.push({ n, h, J: a.J + (J4 - J3) / 12, K: a.K + (J4 - J3) / 12 + ajuste });
  }
  return filas;
};
const W = (pares) => pares.map(([date, weight], i) => ({ date, weight, isInitial: i === 0 }));

export const CASOS = [
  { que: 'semana del ciclo: la misma que la columna H de la hoja (C58 de 1 a 4, semanas 0-12)', prueba: () => {
    for (let c = 1; c <= 4; c++) for (let n = 0; n <= 12; n++) igual(semanaCiclo(c, n), hojaH(c, n), `C58=${c} n=${n}`);
    igual([semanaCiclo(1, -1), semanaCiclo(1, -4), semanaCiclo(3, -6)], [4, 1, 1], 'hacia atrás');
  } },
  { que: 'lo que suma la retención por semana del ciclo: 0, 0, R/2, R', prueba: () => {
    igual([1, 2, 3, 4].map(h => sobre(h, 2)), [0, 0, 1, 2]);
  } },
  { que: 'curvas sin y con retención = columnas J y K de la hoja (bajar y subir de peso, 4 semanas de arranque, 4 retenciones)', prueba: () => {
    for (const [J3, J4] of [[80, 74], [60, 62.5], [70, 70]])
      for (let c = 1; c <= 4; c++)
        for (const R of [0, 0.5, 1, 2]) {
          const p = { inicio: '2026-01-03', pesoInicio: J3, objetivo: J4, semanas: 12, retencion: R, semanaInicio: c };
          for (const f of hojaJK(J3, J4, c, R)) {
            const e = esperado(p, f.n);
            const m = `J3=${J3} J4=${J4} C58=${c} C61=${R} S${f.n}`;
            igual(e.h, f.h, m + ' H'); cerca(e.sin, f.J, m + ' J'); cerca(e.con, f.K, m + ' K');
          }
        }
  } },
  { que: 'pasadas las 12 semanas la línea se queda en el objetivo y la retención sigue oscilando', prueba: () => {
    const p = { inicio: '2026-01-03', pesoInicio: 80, objetivo: 74, semanas: 12, retencion: 1, semanaInicio: 1 };
    igual([13, 14, 15, 16].map(k => esperado(p, k).sin), [74, 74, 74, 74]);
    igual([13, 14, 15, 16].map(k => esperado(p, k).con), [74, 74.5, 75, 74]);
  } },
  { que: 'sin semana del ciclo o sin retención: solo la curva sin retención', prueba: () => {
    const p = { inicio: '2026-01-03', pesoInicio: 80, objetivo: 74, semanas: 12, retencion: null, semanaInicio: 2 };
    igual(esperado(p, 6).con, null); igual(esperado({ ...p, retencion: 1, semanaInicio: null }, 6).con, null);
  } },
  { que: 'parámetros sin datos de consulta: el pesaje inicial, su fecha y el objetivo del perfil', prueba: () => {
    const p = parametros(null, W([['2026-08-01', 70], ['2026-08-08', 69.4]]), { goal_weight: 64, initial_weight: 71 });
    igual([p.inicio, p.pesoInicio, p.objetivo, p.semanas, p.retencion, p.semanaInicio, p.origen, p.faltan],
          ['2026-08-01', 70, 64, 12, null, null, null, []]);
    igual(parametros(null, [], { goal_weight: 64 }).faltan, ['inicio']);
    igual(parametros(null, W([['2026-08-01', 70]]), {}).faltan, ['objetivo']);
  } },
  { que: 'parámetros de la consulta: mandan sobre los de la app (su recta, no la del perfil)', prueba: () => {
    const cfg = { origen: 'consulta', semana_ref: 3, fecha_ref: '2026-09-05', retencion_kg: 1.5,
                  inicio: '2026-09-05', peso_inicio: 63.5, objetivo: 61, semanas: 12 };
    const p = parametros(cfg, W([['2026-06-01', 66]]), { goal_weight: 58 });
    igual([p.inicio, p.pesoInicio, p.objetivo, p.retencion, p.semanaInicio, p.origen], ['2026-09-05', 63.5, 61, 1.5, 3, 'consulta']);
  } },
  { que: 'elegir la semana HOY la fija en la semana del programa de hoy, sea el día que sea de esa semana', prueba: () => {
    const ws = W([['2026-08-01', 70]]);                                 // semana 0 = sáb 1-ago
    for (const hoy of ['2026-09-05', '2026-09-08', '2026-09-11']) {     // semana 5 del programa (sáb, mar, vie)
      for (let x = 1; x <= 4; x++) {
        const cfg = guardarEleccion(null, { semana: x }, hoy, '2026-09-05T10:00:00+02:00');
        const p = parametros(cfg, ws, { goal_weight: 64 });
        igual(semanaPrograma(p.inicio, hoy), 5, hoy);
        igual(esperado(p, 5).h, x, `${hoy} semana ${x}`);
        igual(esperado(p, 6).h, (x % 4) + 1, `${hoy} la siguiente`);
      }
    }
  } },
  { que: 'lo que guarda la paciente: conserva la recta de la consulta, origen app, 1 kg si no dice nada, 0-3 kg con un decimal', prueba: () => {
    const consulta = { origen: 'consulta', semana_ref: 2, fecha_ref: '2026-09-05', retencion_kg: 2,
                       inicio: '2026-09-05', peso_inicio: 63.5, objetivo: 61, semanas: 12 };
    const a = guardarEleccion(consulta, { semana: 4 }, '2026-10-12', 'T');
    igual([a.origen, a.semana_ref, a.fecha_ref, a.retencion_kg, a.inicio, a.peso_inicio, a.objetivo, a.actualizado],
          ['app', 4, '2026-10-12', 2, '2026-09-05', 63.5, 61, 'T']);
    igual(guardarEleccion(null, { semana: 1 }, '2026-10-12', 'T').retencion_kg, RETENCION_DEFECTO);
    igual(guardarEleccion(a, { retencion: 7 }, '2026-10-12', 'T').retencion_kg, RETENCION_MAX);
    igual(guardarEleccion(a, { retencion: -1 }, '2026-10-12', 'T').retencion_kg, 0);
    igual(guardarEleccion(a, { retencion: 1.26 }, '2026-10-12', 'T').retencion_kg, 1.3);
    igual(guardarEleccion(a, { retencion: 1.5 }, '2026-10-12', 'T').semana_ref, 4, 'cambiar la retención no toca la semana');
    igual(parametros({ retencion_kg: 9 }, [], {}).retencion, RETENCION_MAX);
  } },
  { que: 'ventana: las 13 semanas del programa; pasado, 8 atrás y 4 delante; antes de empezar, el programa', prueba: () => {
    const p = { inicio: '2026-08-01', pesoInicio: 70, objetivo: 64, semanas: 12, retencion: 1, semanaInicio: 1 };
    const a = ventana(p, '2026-09-08');
    igual([a.kHoy, a.k0, a.k1, a.semanas.length, a.semanas[0].fecha, a.semanas[12].fecha], [5, 0, 12, 13, '2026-08-01', '2026-10-24']);
    const b = ventana(p, '2026-12-19');
    igual([b.kHoy, b.k0, b.k1, b.semanas.length], [20, 12, 24, 13]);
    const c = ventana({ ...p, inicio: '2026-10-17' }, '2026-10-12');
    igual([c.kHoy, c.k0, c.k1], [-1, 0, 12]);
  } },
  { que: 'fechas: sumar días y restar fechas sin husos ni cambio de hora', prueba: () => {
    igual([fechaMas('2026-10-24', 7), fechaMas('2026-03-28', 1), diasEntre('2026-10-24', '2026-10-26'), diasEntre('2026-03-28', '2026-03-30')],
          ['2026-10-31', '2026-03-29', 2, 2]);
  } },
];

for (const c of CASOS) test(c.que, c.prueba);
