// node --test tests/cambioReceta.test.mjs (sin Node en el PC de GBH: los mismos casos corren en
// Chrome sin cabeza con 07. App GBH/arnes_cambio_receta.py). Cada caso lanza un Error si falla.
import test from 'node:test';
import {
  elegirRecetaCambio, permitidasDePlanes, franjaCambio, normNombreCambio, POOL,
  claveMemoriaCambio, leerMemoriaCambio, guardarMemoriaCambio, podarMemoriaCambio,
  permitidasTodas, puedeComer, recetaDelDiaAlAzar, recetaDelDiaFija,
  estacionDe, deTemporada, CATEGORIAS_GENERALES,
  rolPlatoMenu, listasPlatoMenu, elegirPlatoMenu, recomponerMenu,
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

// Menús de juguete (casos del final). Kcal y reparto como los de un menú de ~1.000 kcal.
const M = (id, nombre, tipo, calorias, p, h, g, extra = {}) => ({ id_receta: id, nombre, tipo, categoria: 'Comida/Cena',
  calorias, proteinas_g: p, hidratos_g: h, grasas_g: g, ingredientes: nombre.toLowerCase(), ...extra });
const MENU = [
  M('E1', 'Crema de calabacín', 'Sopa/Crema', 350, 10, 40, 16),
  M('E2', 'Ensalada de garbanzos y tomate', 'Ensalada', 350, 14, 45, 12),
  M('E3', 'Arroz con verduras', 'Vegetariana', 350, 8, 60, 8),
  M('S5', 'Pollo al curry con arroz', 'Carne', 350, 14, 45, 12),
  M('E5', 'Ensalada César con pollo', 'Ensalada', 650, 48, 50, 25),
  M('S1', 'Pollo asado con patatas', 'Carne', 650, 50, 55, 22),
  M('S2', 'Merluza en salsa verde', 'Pescado', 650, 48, 50, 25),
  M('S3', 'Lasaña de verduras', 'Vegetariana', 650, 20, 80, 25),
  M('S4', 'Salmón al horno con cuscús', 'Pescado', 650, 45, 60, 24),
  M('P1', 'Tarta de queso', 'Postre', 250, 10, 25, 12, { categoria: 'Desayuno/Almuerzo/Merienda' }),
  M('P2', 'Bizcocho de yogur', 'Postre', 250, 7, 35, 9, { categoria: 'Desayuno/Almuerzo/Merienda' }),
  M('L1', 'Tostada de pavo', 'Carne', 250, 20, 25, 8, { categoria: 'Desayuno/Almuerzo/Merienda' }),
];
const SOPA = { nombre: 'Sopa de quinoa', tipo: 'Sopa/Crema', calorias: 350, proteinas_g: 10, hidratos_g: 45, grasas_g: 12, kcal_objetivo: 350 };
const POLLO = { nombre: 'Pollo asado con patatas', tipo: 'Carne', calorias: 650, proteinas_g: 50, hidratos_g: 55, grasas_g: 22, kcal_objetivo: 650 };
const TARTA = { nombre: 'Tarta de queso', tipo: 'Postre', calorias: 250, proteinas_g: 10, hidratos_g: 25, grasas_g: 12, kcal_objetivo: 250 };
const CELDA = {
  Nombre_Receta: '1º Sopa de quinoa · 2º Salmón al horno con brócoli y patatas', Tipo: 'Pescado',
  Calorias_Totales: 1025, Proteinas_g: 46.1, Hidratos_g: 105.3, Grasas_g: 38.2,
  Ingredientes: 'quinoa 60 g, salmón 150 g, brócoli 200 g',
  Instrucciones: '— 1º: Sopa de quinoa —\nCocer.\n\n— 2º: Salmón al horno con brócoli y patatas —\nHornear.',
  raciones: 1, compuesta: true, etiquetas: ['1º', '2º'], otra: 'se conserva',
  platos: [
    { Nombre_Receta: 'Sopa de quinoa', Tipo: 'Sopa/Crema', Ingredientes: 'quinoa 60 g', Instrucciones: 'Cocer.',
      Calorias_Totales: 353, Proteinas_g: 11.1, Hidratos_g: 42.7, Grasas_g: 12.3, raciones: 1, racion_factor: 1.1 },
    { Nombre_Receta: 'Salmón al horno con brócoli y patatas', Tipo: 'Pescado', Ingredientes: 'salmón 150 g, brócoli 200 g',
      Instrucciones: 'Hornear.', Calorias_Totales: 672, Proteinas_g: 35, Hidratos_g: 62.6, Grasas_g: 25.9, raciones: 1 },
  ],
};

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
  // ── Menú desglosado: cada plato se cambia por separado (12-oct-2026) ──
  { que: 'menú: el rol de cada plato sale de su etiqueta (y sin etiquetas, el menú clásico)', prueba: () => {
    igual([0, 1].map((i) => rolPlatoMenu(['1º', '2º'], i)), ['entrante', 'segundo']);
    igual([0, 1].map((i) => rolPlatoMenu(['Plato', 'Postre'], i)), ['principal', 'postre']);
    igual([0, 1].map((i) => rolPlatoMenu(undefined, i)), ['entrante', 'segundo']);
  } },
  { que: 'menú: el 1º sale SOLO de la lista «entrante» del servidor; nunca un proteico ni el 2º', prueba: () => {
    const entrantes = new Set(['E1', 'E3']);
    const permitidas = new Set(MENU.map((r) => r.id_receta));
    const salen = new Set();
    for (let i = 0; i < 60; i++) {
      const r = elegirPlatoMenu({ rol: 'entrante', recetas: MENU, actual: SOPA, permitidas, entrantes,
        otro: 'Arroz con verduras', azar: () => i / 60 });
      ok(r.receta && r.receta.id_receta === 'E1', `salió ${r.receta && r.receta.id_receta}`);
      salen.add(r.receta.id_receta);
    }
    igual([...salen], ['E1'], 'E3 es el otro plato; E2 no está en la lista; S5 es proteico');
  } },
  { que: 'menú: sin lista «entrante» (planes de antes) el 1º es sopa/crema o ensalada', prueba: () => {
    const salen = new Set();
    for (let i = 0; i < 60; i++) {
      const r = elegirPlatoMenu({ rol: 'entrante', recetas: MENU, actual: SOPA, azar: () => i / 60 });
      salen.add(r.receta.id_receta);
    }
    igual([...salen].sort(), ['E1', 'E2'], 'ni el arroz vegetariano ni el pollo al curry');
  } },
  { que: 'menú: el 2º nunca es de tipo entrante y prefiere los proteicos', prueba: () => {
    const salen = new Set();
    for (let i = 0; i < 60; i++) {
      const r = elegirPlatoMenu({ rol: 'segundo', recetas: MENU, actual: POLLO, otro: 'Crema de calabacín', azar: () => i / 60 });
      salen.add(r.receta.id_receta);
    }
    igual([...salen].sort(), ['S2', 'S4'], 'ni la ensalada César (entrante) ni la lasaña (12 % de proteína)');
  } },
  { que: 'menú: sin proteicos posibles, el 2º cae a los demás segundos (y nunca al otro plato)', prueba: () => {
    const permitidas = new Set(['S2', 'S3', 'E5']);
    for (let i = 0; i < 30; i++) {
      const r = elegirPlatoMenu({ rol: 'segundo', recetas: MENU, actual: POLLO, permitidas, otro: 'Merluza en salsa verde', azar: () => i / 30 });
      igual(r.receta && r.receta.id_receta, 'S3');
    }
    igual(elegirPlatoMenu({ rol: 'segundo', recetas: MENU, actual: POLLO, permitidas: new Set(['E5']) }).motivo, 'sin_alternativa');
  } },
  { que: 'menú con postre: el postre sale de la franja ligera y es un postre; el plato, como una comida', prueba: () => {
    const ligera = new Set(['P1', 'P2', 'L1']);
    for (let i = 0; i < 30; i++) {
      igual(elegirPlatoMenu({ rol: 'postre', recetas: MENU, actual: TARTA, permitidas: ligera, azar: () => i / 30 }).receta.id_receta, 'P2');
      const p = elegirPlatoMenu({ rol: 'principal', recetas: MENU, actual: POLLO, otro: 'Tarta de queso', azar: () => i / 30 }).receta;
      ok(p.categoria === 'Comida/Cena' && p.id_receta !== 'S1', `salió ${p.id_receta}`);
    }
  } },
  { que: 'menú: cada rol toma su lista del plan más reciente que la trae', prueba: () => {
    const planes = [
      { fecha_gen: '2026-10-10T10:00:00Z', plan_json: { cambio_receta: { v: 1, desayuno: ['D'], ligera: ['P1', 'L1'], principal: ['E1', 'S1'], entrante: ['E1'] } } },
      { fecha_gen: '2026-10-03T10:00:00Z', plan_json: { cambio_receta: { v: 1, desayuno: ['D'], ligera: ['X'], principal: ['Y'] } } },
    ];
    const ent = listasPlatoMenu(planes, 'entrante');
    igual([[...ent.permitidas], [...ent.entrantes]], [['E1', 'S1'], ['E1']]);
    igual(listasPlatoMenu(planes, 'segundo').entrantes, null);
    igual([...listasPlatoMenu(planes, 'postre').permitidas], ['P1', 'L1']);
    igual(listasPlatoMenu([planes[1]], 'entrante').entrantes, null, 'plan de antes del 12-oct: sin lista de entrantes');
    igual(listasPlatoMenu([], 'entrante'), { permitidas: null, entrantes: null });
  } },
  { que: 'menú: la celda se recompone como _componer_menu y la de entrada no se toca', prueba: () => {
    const celda = JSON.parse(JSON.stringify(CELDA));
    const nuevo = { Nombre_Receta: 'Crema de calabacín', Tipo: 'Sopa/Crema', Calorias_Totales: 340, Proteinas_g: 9.7,
      Hidratos_g: 38.9, Grasas_g: 15.6, Ingredientes: 'calabacín 300 g', Instrucciones: 'Triturar.', raciones: 1, kcal_objetivo: 353 };
    const c = recomponerMenu(celda, 0, nuevo);
    igual(celda, CELDA, 'la celda de entrada no cambia');
    igual(c.Nombre_Receta, '1º Crema de calabacín · 2º Salmón al horno con brócoli y patatas');
    igual([c.Tipo, c.Calorias_Totales, c.Proteinas_g, c.Hidratos_g, c.Grasas_g], ['Pescado', 1012, 44.7, 101.5, 41.5]);
    igual(c.Ingredientes, 'calabacín 300 g, salmón 150 g, brócoli 200 g');
    igual(c.Instrucciones, '— 1º: Crema de calabacín —\nTriturar.\n\n— 2º: Salmón al horno con brócoli y patatas —\nHornear.');
    igual([c.compuesta, c.etiquetas, c.raciones, c.otra], [true, ['1º', '2º'], 1, 'se conserva']);
    ok(c.platos[0] === nuevo && c.platos[1] === celda.platos[1], 'solo cambia el plato elegido');
    const mismo = recomponerMenu(CELDA, 1, CELDA.platos[1]);
    igual([mismo.Nombre_Receta, mismo.Calorias_Totales, mismo.Proteinas_g, mismo.Ingredientes, mismo.Instrucciones],
      [CELDA.Nombre_Receta, CELDA.Calorias_Totales, CELDA.Proteinas_g, CELDA.Ingredientes, CELDA.Instrucciones], 'recomponer sin cambiar nada');
  } },
  { que: 'menú con postre: el tipo de la celda es el del plato; sin etiquetas, «1º» y «2º»', prueba: () => {
    const conPostre = { ...CELDA, etiquetas: ['Plato', 'Postre'] };
    const c = recomponerMenu(conPostre, 1, { Nombre_Receta: 'Tarta de queso', Tipo: 'Postre', Calorias_Totales: 250 });
    igual([c.Nombre_Receta.slice(0, 6), c.Tipo], ['Plato ', 'Sopa/Crema']);
    const sin = { ...CELDA };
    delete sin.etiquetas;
    ok(recomponerMenu(sin, 0, CELDA.platos[0]).Nombre_Receta.startsWith('1º Sopa de quinoa · 2º '));
  } },
  { que: 'temporada: estaciones en fechas fijas, como el servidor', prueba: () => {
    const e = (m, d) => estacionDe(new Date(2026, m - 1, d, 12));
    igual([e(3, 20), e(3, 21), e(6, 20), e(6, 21), e(9, 22), e(9, 23), e(12, 20), e(12, 21), e(1, 1)],
      ['Invierno', 'Primavera', 'Primavera', 'Verano', 'Verano', 'Otoño', 'Otoño', 'Invierno', 'Invierno']);
  } },
  { que: 'temporada: null es todo el año; una lista solo vale en sus estaciones; [] nunca', prueba: () => {
    igual([deTemporada({ temporadas: null }, 'Otoño'), deTemporada({}, 'Otoño'), deTemporada({ temporadas: ['Verano'] }, 'Otoño'),
      deTemporada({ temporadas: ['Otoño', 'Invierno'] }, 'Otoño'), deTemporada({ temporadas: [] }, 'Otoño'),
      deTemporada({ temporadas: ['Verano'] }, null), deTemporada({ temporadas: '{Primavera,Verano}' }, 'Verano')],
      [true, true, false, true, false, true, true]);
  } },
  { que: 'receta del día: puedeComer mira la estación y las categorías generales', prueba: () => {
    const verano = R('T1', 'Macedonia de sandía', 'Postre', { categoria: 'Desayuno/Almuerzo/Merienda', temporadas: ['Verano'] });
    const batido = R('T2', 'Batido de recuperación de soja', 'Vegana', { categoria: 'Post-entreno' });
    const cats = new Set(CATEGORIAS_GENERALES);
    igual([puedeComer(verano, { estacion: 'Otoño' }), puedeComer(verano, { estacion: 'Verano' }),
      puedeComer(batido, { categorias: cats }), puedeComer(BASE[0], { estacion: 'Otoño', categorias: cats }),
      puedeComer(verano)], [false, true, false, true, true]);
  } },
  { que: 'receta del día: la fija y la de gemas no sacan fruta de otra estación ni categorías propias', prueba: () => {
    const verano = R('T1', 'Macedonia de sandía', 'Postre', { categoria: 'Desayuno/Almuerzo/Merienda', temporadas: ['Verano'] });
    const batido = R('T2', 'Batido de recuperación de soja', 'Vegana', { categoria: 'Post-entreno' });
    const todas = [...BASE, verano, batido];
    const cats = new Set(CATEGORIAS_GENERALES);
    for (let k = 0; k < 40; k++) {
      const f = recetaDelDiaFija({ recetas: todas, clave: `2026-10-${k}`, estacion: 'Otoño', categorias: cats });
      ok(f && !['T1', 'T2'].includes(f.id_receta), `fija ${k}: ${f && f.id_receta}`);
      const a = recetaDelDiaAlAzar({ recetas: todas, estacion: 'Otoño', categorias: cats, azar: () => k / 40 });
      ok(a && !['T1', 'T2'].includes(a.id_receta), `azar ${k}: ${a && a.id_receta}`);
    }
    const vistos = new Set();   // control negativo: sin estación ni categorías, como antes, sí salen
    for (let k = 0; k < 90; k++) vistos.add(recetaDelDiaAlAzar({ recetas: todas, azar: () => k / 90 }).id_receta);
    ok(vistos.has('T1') && vistos.has('T2'), 'sin filtros salen las dos');
  } },
];

for (const c of CASOS) test(`cambio de receta · ${c.que}`, c.prueba);
