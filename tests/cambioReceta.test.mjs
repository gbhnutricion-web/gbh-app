// node --test tests/cambioReceta.test.mjs (sin Node en el PC de GBH: los mismos casos corren en
// Chrome sin cabeza con 07. App GBH/arnes_cambio_receta.py). Cada caso lanza un Error si falla.
import test from 'node:test';
import {
  elegirRecetaCambio, permitidasDePlanes, franjaCambio, normNombreCambio, POOL,
  claveMemoriaCambio, leerMemoriaCambio, guardarMemoriaCambio, podarMemoriaCambio,
  permitidasTodas, puedeComer, recetaDelDiaAlAzar, recetaDelDiaFija,
} from '../src/cambioReceta.js';

const ok = (c, m) => { if (!c) throw new Error(m || 'no se cumple'); };
const igual = (a, b, m) => { const x = JSON.stringify(a), y = JSON.stringify(b); if (x !== y) throw new Error(`${m || ''} ${x} ≠ ${y}`); };
const almacen = () => { const d = new Map(); return {
  getItem: (k) => (d.has(k) ? d.get(k) : null), setItem: (k, v) => d.set(k, String(v)), removeItem: (k) => d.delete(k),
  key: (i) => [...d.keys()][i] ?? null, get length() { return d.size; }, _d: d }; };
const secuencia = (xs) => { let i = 0; return () => xs[i++ % xs.length]; };

// Recetas de juguete: comida/cena de 500 kcal con el mismo reparto (P 30 · H 40 · G 30 % aprox.).
const R = (id, nombre, tipo, extra = {}) => ({ id_receta: id, nombre, tipo, categoria: 'Comida/Cena',
  calorias: 500, proteinas_g: 37, hidratos_g: 50, grasas_g: 17, ingredientes: nombre.toLowerCase(), ...extra });
const ATUN = { nombre: 'Atún con patatas', tipo: 'Pescado', calorias: 500, proteinas_g: 37, hidratos_g: 50, grasas_g: 17, kcal_objetivo: 500 };
const BASE = [
  R('REC1', 'Salmón al horno', 'Pescado'), R('REC2', 'Merluza en salsa', 'Pescado'),
  R('REC3', 'Bacalao con tomate', 'Pescado'), R('REC4', 'Pollo asado', 'Carne'),
  R('REC5', 'Lentejas estofadas', 'Vegetariana'), R('REC6', 'Tortitas de avena', 'Postre', { categoria: 'Desayuno/Almuerzo/Merienda' }),
  R('REC7', 'Atún con patatas', 'Pescado'),
];

export const CASOS = [
  { que: 'la lista del servidor manda: lo que no está no sale nunca (el salmón de la alérgica)', prueba: () => {
    const permitidas = new Set(['REC2', 'REC3', 'REC4', 'REC5']);
    for (let i = 0; i < 40; i++) {
      const r = elegirRecetaCambio({ recetas: BASE, actual: ATUN, toma: 'Comida', permitidas, azar: () => i / 40 });
      ok(r.receta && permitidas.has(r.receta.id_receta), `salió ${r.receta && r.receta.id_receta}`);
    }
  } },
  { que: 'sin lista (planes de antes): el filtro de la App sigue vetando', prueba: () => {
    const rechazada = (r) => /salmon/.test(normNombreCambio(r.nombre));
    for (let i = 0; i < 40; i++) {
      const r = elegirRecetaCambio({ recetas: BASE, actual: ATUN, toma: 'Comida', rechazada, azar: () => i / 40 });
      ok(r.receta.id_receta !== 'REC1', 'salió el salmón');
    }
  } },
  { que: 'franja: una comida nunca se cambia por unas tortitas, ni la receta por sí misma', prueba: () => {
    for (let i = 0; i < 40; i++) {
      const r = elegirRecetaCambio({ recetas: BASE, actual: ATUN, toma: 'Cena', azar: () => i / 40 });
      ok(!['REC6', 'REC7'].includes(r.receta.id_receta), `salió ${r.receta.id_receta}`);
    }
  } },
  { que: 'descartadas 🗑️ fuera', prueba: () => {
    const descartadas = new Set([normNombreCambio('Merluza en salsa'), normNombreCambio('Salmón al horno')]);
    for (let i = 0; i < 40; i++) {
      const r = elegirRecetaCambio({ recetas: BASE, actual: ATUN, toma: 'Comida', descartadas, azar: () => i / 40 });
      ok(!['REC1', 'REC2'].includes(r.receta.id_receta));
    }
  } },
  { que: 'escala: una receta que no llega con ración 0,70-1,40 no entra', prueba: () => {
    const recetas = [R('REC8', 'Crema ligera', 'Pescado', { calorias: 150, proteinas_g: 11, hidratos_g: 15, grasas_g: 5 }), R('REC2', 'Merluza en salsa', 'Pescado')];
    const r = elegirRecetaCambio({ recetas, actual: ATUN, toma: 'Comida', azar: () => 0 });
    igual(r.receta.id_receta, 'REC2');
    igual(elegirRecetaCambio({ recetas: [recetas[0]], actual: ATUN, toma: 'Comida' }).motivo, 'sin_alternativa');
  } },
  { que: 'nada que ofrecer → sin alternativa (y la App no cobra)', prueba: () => {
    const r = elegirRecetaCambio({ recetas: BASE, actual: ATUN, toma: 'Comida', permitidas: new Set() });
    igual(r, { receta: null, motivo: 'sin_alternativa' });
  } },
  { que: 'un nivel 1 de UNA receta ya no deja el cambio clavado: el sorteo se completa con los siguientes', prueba: () => {
    const recetas = [R('REC2', 'Merluza en salsa', 'Pescado')];
    for (let i = 0; i < 12; i++) recetas.push(R('RECC' + i, 'Pollo número ' + i, 'Carne'));
    const r = elegirRecetaCambio({ recetas, actual: ATUN, toma: 'Comida', azar: () => 0.99 });
    igual(r.pool.length, POOL);
    igual(r.pool[0].id_receta, 'REC2', 'el mismo tipo va primero');
    const salen = new Set();
    for (let i = 0; i < 80; i++) salen.add(elegirRecetaCambio({ recetas, actual: ATUN, toma: 'Comida', azar: () => i / 80 }).receta.id_receta);
    igual(salen.size, POOL, 'antes salía siempre la merluza');
  } },
  { que: 'los niveles de siempre: macros muy distintos (más de 0,60) no entran nunca', prueba: () => {
    const grasa = R('REC9', 'Bizcocho keto', 'Pescado', { proteinas_g: 10, hidratos_g: 5, grasas_g: 50 });
    const r = elegirRecetaCambio({ recetas: [grasa], actual: ATUN, toma: 'Comida' });
    igual(r.motivo, 'sin_alternativa');
  } },
  { que: 'lo que ya está en la semana va detrás dentro de su nivel', prueba: () => {
    const enPlan = new Set([normNombreCambio('Merluza en salsa')]);
    const recetas = [R('REC2', 'Merluza en salsa', 'Pescado'), R('REC3', 'Bacalao con tomate', 'Pescado')];
    const r = elegirRecetaCambio({ recetas, actual: ATUN, toma: 'Comida', enPlan, azar: () => 0 });
    igual(r.pool.map((x) => x.id_receta), ['REC3', 'REC2']);
  } },
  { que: 'favoritas ×4 en el sorteo', prueba: () => {
    const recetas = [R('REC2', 'Merluza en salsa', 'Pescado'), R('REC3', 'Bacalao con tomate', 'Pescado')];
    igual(elegirRecetaCambio({ recetas, actual: ATUN, toma: 'Comida', azar: () => 0.3 }).receta.id_receta, 'REC3');   // orden: bacalao, merluza
    const favoritas = new Set([normNombreCambio('Merluza en salsa')]);
    igual(elegirRecetaCambio({ recetas, actual: ATUN, toma: 'Comida', favoritas, azar: () => 0.3 }).receta.id_receta, 'REC2');
  } },
  { que: 'memoria: 5 pulsaciones seguidas en el mismo hueco dan 5 recetas distintas', prueba: () => {
    const recetas = [...BASE];
    for (let i = 0; i < 6; i++) recetas.push(R('RECP' + i, 'Pescado número ' + i, 'Pescado'));
    const st = almacen(), clave = claveMemoriaCambio('p1', 5, 'Comida', 3);
    let actual = ATUN; const vistas = [];
    for (let k = 0; k < 5; k++) {
      const mem = leerMemoriaCambio(st, clave, actual);
      const r = elegirRecetaCambio({ recetas, actual, ancla: mem.ancla, toma: 'Comida', vistas: mem.vistas, azar: () => 0 });
      guardarMemoriaCambio(st, clave, { ...mem, actual, elegida: r.receta, reinicio: r.reinicio });
      vistas.push(r.receta.id_receta);
      actual = { ...r.receta, kcal_objetivo: 500 };
    }
    igual(new Set(vistas).size, 5, vistas.join(','));
    ok(!vistas.includes('REC7'), 'volvió la original');
  } },
  { que: 'memoria: enseñado todo, se empieza otra vuelta sin repetir la que se acaba de dejar', prueba: () => {
    const recetas = [R('REC2', 'Merluza en salsa', 'Pescado'), R('REC3', 'Bacalao con tomate', 'Pescado'), R('REC7', 'Atún con patatas', 'Pescado')];
    const st = almacen(), clave = claveMemoriaCambio('p1', 5, 'Comida', 3);
    let actual = ATUN; const salen = [];
    for (let k = 0; k < 4; k++) {
      const mem = leerMemoriaCambio(st, clave, actual);
      const r = elegirRecetaCambio({ recetas, actual, ancla: mem.ancla, toma: 'Comida', vistas: mem.vistas, azar: () => 0 });
      guardarMemoriaCambio(st, clave, { ...mem, actual, elegida: r.receta, reinicio: r.reinicio });
      salen.push(r.receta.id_receta + (r.reinicio ? '*' : ''));
      actual = { ...r.receta, kcal_objetivo: 500 };
    }
    igual(salen, ['REC3', 'REC2', 'REC7*', 'REC3']);
  } },
  { que: 'memoria: si el hueco cambió por otro lado (regenerado, otro móvil) se empieza de cero', prueba: () => {
    const st = almacen(), clave = claveMemoriaCambio('p1', 5, 'Comida', 3);
    guardarMemoriaCambio(st, clave, { ancla: { nombre: 'Atún con patatas' }, vistas: new Set(['atun con patatas']), actual: ATUN, elegida: { nombre: 'Merluza en salsa' } });
    igual([...leerMemoriaCambio(st, clave, { nombre: 'Merluza en salsa' }).vistas], ['atun con patatas', 'merluza en salsa']);
    const otra = leerMemoriaCambio(st, clave, { nombre: 'Pollo asado', tipo: 'Carne' });
    igual([...otra.vistas], ['pollo asado']);
    igual(otra.ancla.nombre, 'Pollo asado');
  } },
  { que: 'memoria: el ancla es la receta de la programación, no la última del cambio', prueba: () => {
    const st = almacen(), clave = claveMemoriaCambio('p1', 5, 'Comida', 3);
    guardarMemoriaCambio(st, clave, { ancla: { nombre: 'Atún con patatas', tipo: 'Pescado', proteinas_g: 37, hidratos_g: 50, grasas_g: 17 },
      vistas: new Set(['atun con patatas']), actual: ATUN, elegida: { nombre: 'Pollo asado', tipo: 'Carne' } });
    const mem = leerMemoriaCambio(st, clave, { nombre: 'Pollo asado', tipo: 'Carne' });
    igual(mem.ancla.tipo, 'Pescado');
    const r = elegirRecetaCambio({ recetas: BASE, actual: { ...BASE[3], kcal_objetivo: 500 }, ancla: mem.ancla, toma: 'Comida', vistas: mem.vistas, azar: () => 0 });
    igual(r.receta.tipo, 'Pescado', 'vuelve al tipo que puso la programación');
  } },
  { que: 'memoria sin almacenamiento (o que falla): el cambio funciona igual', prueba: () => {
    const roto = { getItem: () => { throw new Error('bloqueado'); }, setItem: () => { throw new Error('bloqueado'); } };
    const mem = leerMemoriaCambio(roto, 'x', ATUN);
    igual([...mem.vistas], ['atun con patatas']);
    guardarMemoriaCambio(roto, 'x', { ...mem, actual: ATUN, elegida: BASE[1] });
    guardarMemoriaCambio(null, 'x', { ...mem, actual: ATUN, elegida: BASE[1] });
  } },
  { que: 'memoria: se poda lo de más de 21 días', prueba: () => {
    const st = almacen(), ahora = Date.parse('2026-09-28T12:00:00Z');
    st.setItem('gbh:cambio:p1:1:Comida:1', JSON.stringify({ ts: ahora - 30 * 864e5 }));
    st.setItem('gbh:cambio:p1:5:Comida:1', JSON.stringify({ ts: ahora - 2 * 864e5 }));
    st.setItem('gbh:otra:cosa', 'x');
    podarMemoriaCambio(st, ahora);
    igual([...st._d.keys()].sort(), ['gbh:cambio:p1:5:Comida:1', 'gbh:otra:cosa']);
  } },
  { que: 'la lista del servidor sale del plan más reciente que la trae, por franja', prueba: () => {
    const planes = [
      { semana: 12, fecha_gen: '2026-08-29T10:00:00Z', plan_json: { cambio_receta: { v: 1, desayuno: ['A'], ligera: ['B'], principal: ['C'] } } },
      { semana: 5, fecha_gen: '2026-09-26T10:00:00Z', plan_json: { cambio_receta: { v: 1, desayuno: ['D'], ligera: ['E'], principal: ['F', 'G'] } } },
      { semana: 4, fecha_gen: '2026-09-19T10:00:00Z', plan_json: {} },
    ];
    igual([...permitidasDePlanes(planes, 'Cena')], ['F', 'G']);
    igual([...permitidasDePlanes(planes, 'Desayuno')], ['D']);
    igual([...permitidasDePlanes(planes, 'Merienda')], ['E']);
    igual(permitidasDePlanes([{ plan_json: {} }], 'Comida'), null);
    igual(permitidasDePlanes([{ plan_json: { cambio_receta: { v: 2, principal: ['X'] } } }], 'Comida'), null, 'versión desconocida');
    igual([franjaCambio('Almuerzo'), franjaCambio('Comida'), franjaCambio('Desayuno')], ['ligera', 'principal', 'desayuno']);
  } },
  { que: 'receta del día: la lista de todas las franjas del plan más reciente', prueba: () => {
    const planes = [{ fecha_gen: '2026-09-26T10:00:00Z', plan_json: { cambio_receta: { v: 1, desayuno: ['A'], ligera: ['A', 'B'], principal: ['C'] } } },
      { fecha_gen: '2026-09-19T10:00:00Z', plan_json: { cambio_receta: null } }];
    igual([...permitidasTodas(planes)].sort(), ['A', 'B', 'C']);
    igual(permitidasTodas([{ fecha_gen: 'x', plan_json: { cambio_receta: null } }]), null);
  } },
  { que: 'receta del día: puedeComer mira la lista, los rechazados y las descartadas', prueba: () => {
    const permitidas = new Set(['REC2', 'REC3']);
    const rechazada = (r) => /bacalao/.test(normNombreCambio(r.nombre));
    const descartadas = new Set([normNombreCambio('Merluza en salsa')]);
    igual([BASE[0], BASE[1], BASE[2]].map((r) => puedeComer(r, { permitidas })), [false, true, true]);
    igual(puedeComer(BASE[2], { permitidas, rechazada }), false);
    igual(puedeComer(BASE[1], { permitidas, descartadas }), false);
    igual(puedeComer(null), false);
  } },
  { que: 'receta del día con gemas: al azar, nunca lo vetado y sin repetir lo de hoy', prueba: () => {
    const permitidas = new Set(['REC2', 'REC3', 'REC4', 'REC5', 'REC6']);
    const rechazada = (r) => /pollo/.test(normNombreCambio(r.nombre));
    const salen = new Set();
    for (let i = 0; i < 60; i++) {
      const r = recetaDelDiaAlAzar({ recetas: BASE, permitidas, rechazada, azar: () => i / 60 });
      ok(r && permitidas.has(r.id_receta) && r.id_receta !== 'REC4', `salió ${r && r.id_receta}`);
      salen.add(r.id_receta);
    }
    igual([...salen].sort(), ['REC2', 'REC3', 'REC5', 'REC6'], 'el azar recorre todas las que puede comer');
    const excluir = new Set(['REC2', 'REC3', 'REC5']);
    for (let i = 0; i < 20; i++) igual(recetaDelDiaAlAzar({ recetas: BASE, permitidas, rechazada, excluir, azar: () => i / 20 }).id_receta, 'REC6');
    const todo = new Set(['REC2', 'REC3', 'REC5', 'REC6']);
    ok(todo.has(recetaDelDiaAlAzar({ recetas: BASE, permitidas, rechazada, excluir: todo, azar: () => 0.5 }).id_receta), 'enseñado todo: vuelve a empezar');
    igual(recetaDelDiaAlAzar({ recetas: BASE, permitidas: new Set() }), null);
  } },
  { que: 'receta del día gratis: fija para el día, entre las que puede comer y sin depender del orden', prueba: () => {
    const permitidas = new Set(['REC2', 'REC3', 'REC5']);
    const a = recetaDelDiaFija({ recetas: BASE, clave: '2026-09-28', permitidas });
    const b = recetaDelDiaFija({ recetas: [...BASE].reverse(), clave: '2026-09-28', permitidas });
    igual(a.id_receta, b.id_receta);
    ok(permitidas.has(a.id_receta));
    const dias = new Set();
    for (let d = 1; d <= 30; d++) dias.add(recetaDelDiaFija({ recetas: BASE, clave: `2026-09-${String(d).padStart(2, '0')}`, permitidas }).id_receta);
    igual([...dias].sort(), ['REC2', 'REC3', 'REC5'], 'cambia de un día a otro');
    igual(recetaDelDiaFija({ recetas: BASE, clave: 'x', permitidas: new Set() }), null);
  } },
  { que: 'la ración: pasos de 0,05 dentro de 0,70-1,40', prueba: () => {
    const recetas = [R('REC2', 'Merluza en salsa', 'Pescado', { calorias: 400, proteinas_g: 30, hidratos_g: 40, grasas_g: 13.6 })];
    igual(elegirRecetaCambio({ recetas, actual: ATUN, toma: 'Comida' }).factor, 1.25);
    const casi = [R('REC2', 'Merluza en salsa', 'Pescado', { calorias: 490 })];
    igual(elegirRecetaCambio({ recetas: casi, actual: ATUN, toma: 'Comida' }).factor, 1);
  } },
];

for (const c of CASOS) test(`cambio de receta · ${c.que}`, c.prueba);
