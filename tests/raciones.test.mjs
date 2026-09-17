// node --test tests/raciones.test.mjs (sin Node en el PC de GBH: los mismos casos se ejecutan en
// Chrome sin cabeza con el arnés de la carpeta de la App). Casos REALES de los pantallazos del 16-sep:
// REC850 «Macarrones con atún y tomate gratinados» (1 ración, 900 kcal → 810 = factor 0,90) y
// REC291 «Potaje de vigilia» (Raciones = 3, 427,9 kcal/ración → 556 = factor 1,30; olla ~7,49 €).
import test from 'node:test';
import assert from 'node:assert/strict';
import { racionesDeLaLista, porcentajeRacion, costePorRacion, textosCajaRacion } from '../src/raciones.js';

export const CASOS = [
  { que: 'macarrones x0,90',            raciones: 1, factor: 0.9,  texto: 'x0,90 de la receta', x: 1, lista: 1, pct: 90,   caja: 'Tu ración ya está calculada', detalle: '90 % de la receta original' },
  { que: 'potaje 3 raciones x1,30',     raciones: 3, factor: 1.3,  texto: 'ración y cuarto',     x: 1, lista: 3, pct: 130,  caja: 'Receta para 3 raciones: tú comes 1', detalle: 'repártela en 3 platos iguales' },
  { que: 'potaje, botón de 6 raciones', raciones: 3, factor: 1.3,  texto: 'ración y cuarto',     x: 2, lista: 6, pct: 130,  caja: 'Receta para 3 raciones: tú comes 1', detalle: 'repártela en 3 platos iguales' },
  { que: 'receta tal cual (sin ajuste)', raciones: 1, factor: 1,   texto: '',                    x: 1, lista: 1, pct: null, caja: null, detalle: null },
  { que: '1 ración, botón de 3',        raciones: 1, factor: 1.25, texto: 'ración y cuarto',     x: 3, lista: 3, pct: 125,  caja: 'Tu ración ya está calculada', detalle: '125 % de la receta original' },
  { que: 'plan antiguo: texto sin factor', raciones: 1, factor: undefined, texto: 'media ración', x: 1, lista: 1, pct: null, caja: 'Tu ración ya está calculada', detalle: '(media ración)' },
  { que: 'raciones basura',             raciones: 'abc', factor: 1.3, texto: 'ración y cuarto',  x: 0, lista: 1, pct: 130,  caja: 'Tu ración ya está calculada', detalle: '130 % de la receta original' },
];

for (const c of CASOS) {
  test(`raciones · ${c.que}`, () => {
    assert.equal(racionesDeLaLista(c.raciones, c.x), c.lista);
    assert.equal(porcentajeRacion(c.factor), c.pct);
    const caja = textosCajaRacion({ raciones: c.raciones, factor: c.factor, racionTexto: c.texto, lang: 'es' });
    if (c.caja === null) { assert.equal(caja, null); return; }
    assert.equal(caja.titulo, c.caja);
    assert.ok(caja.detalle.includes(c.detalle), caja.detalle);
    const en = textosCajaRacion({ raciones: c.raciones, factor: c.factor, racionTexto: c.texto, lang: 'en' });
    assert.ok(en && en.titulo && !/ración|raciones/.test(en.titulo + en.detalle.replace(c.texto, '')));
  });
}

test('coste: la olla entre las raciones', () => {
  assert.equal(costePorRacion(7.49, 3), 2.5);
  assert.equal(costePorRacion(1.94, 1), 1.94);
  assert.equal(costePorRacion(1.94, undefined), 1.94);
  assert.equal(costePorRacion(0, 3), 0);
});
