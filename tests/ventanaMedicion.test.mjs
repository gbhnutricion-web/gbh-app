// node --test tests/ventanaMedicion.test.mjs (sin Node en el PC de GBH: los mismos casos se ejecutan en
// Chrome sin cabeza con el arnés de la carpeta de la App). Fechas fijas de septiembre de 2026:
// lun 14 · mar 15 · mié 16 · jue 17 · vie 18 · sáb 19 · dom 20.
import test from 'node:test';
import assert from 'node:assert/strict';
import { esDiaDeMedicion, ventanaKeys, proximoDiaMedicion, DIAS_MEDICION } from '../src/ventanaMedicion.js';

export const CASOS = [
  { dia: '2026-09-14', mide: false, ventana: [], prox: 'el miércoles' },                       // lunes
  { dia: '2026-09-15', mide: false, ventana: [], prox: 'el miércoles' },                       // martes
  { dia: '2026-09-16', mide: true,  ventana: ['2026-09-16'], prox: 'hoy' },                   // miércoles
  { dia: '2026-09-17', mide: false, ventana: [], prox: 'el sábado' },                         // jueves
  { dia: '2026-09-18', mide: false, ventana: [], prox: 'el sábado' },                         // viernes
  { dia: '2026-09-19', mide: true,  ventana: ['2026-09-19', '2026-09-20'], prox: 'hoy' },     // sábado
  { dia: '2026-09-20', mide: true,  ventana: ['2026-09-19', '2026-09-20'], prox: 'hoy' },     // domingo: la MISMA ventana que el sábado
  { dia: '2026-10-04', mide: true,  ventana: ['2026-10-03', '2026-10-04'], prox: 'hoy' },     // domingo de cambio de mes
];

test('DIAS_MEDICION = miércoles, sábado y domingo', () => { assert.deepEqual([...DIAS_MEDICION].sort(), [0, 3, 6]); });

for (const c of CASOS) {
  test(`ventana · ${c.dia}`, () => {
    const d = new Date(c.dia + 'T12:00:00');
    assert.equal(esDiaDeMedicion(d), c.mide);
    assert.deepEqual(ventanaKeys(d), c.ventana);
    assert.equal(proximoDiaMedicion(d, 'es'), c.prox);
  });
}
