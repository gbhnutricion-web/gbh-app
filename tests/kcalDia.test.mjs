// node --test tests/kcalDia.test.mjs   (sin Node en el PC de GBH: el mismo cálculo se
// ejecuta en Chrome sin cabeza con el arnés de la carpeta de la App, sobre ESTOS casos)
import test from 'node:test';
import assert from 'node:assert/strict';
import { resumenDia, previstoToma, fraseDia, contieneVetadas, fraccionValida, TOMAS_ORDEN } from '../src/kcalDia.js';
import { PLAN, PLAN_SIN_TOTALES, DIA, CASOS, FRASES_EN } from './kcalDia.cases.mjs';

const cerca = (a, b) => Math.abs(a - b) < 1e-6;

test('previsto: totales de la celda, cadenas numéricas y menú sin totales', () => {
  assert.equal(previstoToma(PLAN, 'Desayuno', DIA).kcal, 520);
  assert.equal(previstoToma(PLAN, 'Comida', DIA).kcal, 640);
  assert.equal(previstoToma(PLAN_SIN_TOTALES, 'Comida', DIA).kcal, 640);
  assert.equal(previstoToma(PLAN, 'Cena', 4), null);
  assert.equal(fraccionValida(0.75), 0.75);
  assert.equal(fraccionValida(0.6), null);
  assert.equal(fraccionValida(undefined), null);
});

for (const c of CASOS) {
  test(`resumen · ${c.nombre}`, () => {
    const r = resumenDia(PLAN, DIA, c.meals, c.real, TOMAS_ORDEN);
    const e = c.esperado;
    assert.equal(r.planificadas, 5);
    if (e.previstoKcal != null) assert.ok(cerca(r.previsto.kcal, e.previstoKcal), `previsto ${r.previsto.kcal}`);
    if (e.realKcal != null) assert.ok(cerca(r.real.kcal, e.realKcal), `real ${r.real.kcal} ≠ ${e.realKcal}`);
    if (e.realP != null) assert.ok(cerca(r.real.p, e.realP), `p ${r.real.p}`);
    if (e.realG != null) assert.ok(cerca(r.real.g, e.realG), `g ${r.real.g}`);
    if (e.registradas != null) assert.equal(r.registradas, e.registradas);
    if (e.conocidas != null) assert.equal(r.conocidas, e.conocidas);
    if (e.sinCuantificar != null) assert.equal(r.sinCuantificar, e.sinCuantificar);
    if (e.sinMacros != null) assert.equal(r.sinMacros, e.sinMacros);
    if (e.pendientesKcal != null) assert.ok(cerca(r.pendientesKcal, e.pendientesKcal), `pendientes ${r.pendientesKcal}`);
    if (e.completo != null) assert.equal(r.completo, e.completo);
    const frase = fraseDia(r, 'es');
    if (e.frase) assert.match(frase, e.frase);
    assert.deepEqual(contieneVetadas(frase), [], `frase con palabra vetada: ${frase}`);
  });
}

test('frases en inglés y palabras vetadas', () => {
  for (const c of FRASES_EN) {
    const r = resumenDia(PLAN, DIA, c.meals, c.real, TOMAS_ORDEN);
    const f = fraseDia(r, 'en');
    assert.match(f, c.frase);
    assert.deepEqual(contieneVetadas(f), []);
  }
  assert.deepEqual(contieneVetadas('hoy solo has comido'), ['solo']);
  assert.deepEqual(contieneVetadas('como lo previsto'), []);
});
