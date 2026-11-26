// node --test tests/codigoBarras.test.mjs · lógica del escáner de código de barras (MAESTRO-2026-1627).
// Los códigos válidos son los ejemplos clásicos de cada formato; las respuestas imitan la forma
// real de Open Food Facts (api/v2/product), recortada a los campos que se piden.
import test from 'node:test';
import assert from 'node:assert/strict';
import { limpiarCodigo, codigoValido, urlProducto, leerProducto, itemDesdeProducto, escanerDisponible } from '../src/codigoBarras.js';
import { kcalItem } from '../src/kcalDia.js';

test('códigos: control correcto en EAN-13, EAN-8 y UPC-A', () => {
  assert.equal(codigoValido('4006381333931'), true);
  assert.equal(codigoValido('73513537'), true);
  assert.equal(codigoValido('036000291452'), true);
  assert.equal(codigoValido('4006381333932'), false);   // último dígito cambiado
  assert.equal(codigoValido('12345'), false);           // longitud que no existe
  assert.equal(codigoValido(''), false);
  assert.equal(limpiarCodigo(' 400 6381-333931 '), '4006381333931');
  assert.ok(urlProducto('4006381333931').startsWith('https://world.openfoodfacts.org/api/v2/product/4006381333931.json?fields='));
});

const ficha = (product) => ({ status: 1, code: '4006381333931', product });

test('producto completo: kcal, macros, porción y nombre en español', () => {
  const p = leerProducto(ficha({ product_name: 'Crunchy oats', product_name_es: 'Copos crujientes', brands: 'Marca A, Marca B',
    serving_quantity: '40', nutriments: { 'energy-kcal_100g': 412.4, proteins_100g: 9.1, carbohydrates_100g: 66.04, fat_100g: 11.2 } }));
  assert.deepEqual(p, { ok: true, codigo: '4006381333931', nombre: 'Copos crujientes', marca: 'Marca A', k: 412.4, p: 9.1, h: 66, g: 11.2, porcion: 40 });
  const it = itemDesdeProducto(p);
  assert.equal(it.n, 'Copos crujientes (Marca A)');
  assert.equal(it.ug, 40);
  assert.equal(it.id, 'off:4006381333931');
  assert.equal(Math.round(kcalItem(it).kcal), 165);       // 412,4 × 0,40
  assert.equal(Math.round(kcalItem({ ...it, q: 2 }).kcal), 330);
  assert.equal(itemDesdeProducto(p, 55).ug, 55);           // gramos tecleados mandan
});

test('energía solo en kJ → se pasa a kcal; sin porción → 100 g', () => {
  const p = leerProducto(ficha({ product_name: 'Galletas', nutriments: { energy_100g: 2000, proteins_100g: 6, carbohydrates_100g: 70, fat_100g: 20 } }));
  assert.equal(p.ok, true);
  assert.equal(p.k, 478);                                  // 2000 / 4,184
  assert.equal(p.porcion, null);
  assert.equal(itemDesdeProducto(p).ug, 100);
});

test('la marca no se repite si ya está en el nombre', () => {
  const p = leerProducto(ficha({ product_name: 'Hacendado yogur natural', brands: 'Hacendado', nutriments: { 'energy-kcal_100g': 60 } }));
  assert.equal(itemDesdeProducto(p).n, 'Hacendado yogur natural');
});

test('fallos: no encontrado, sin kcal y datos imposibles', () => {
  assert.equal(leerProducto({ status: 0, code: '123' }, '123').motivo, 'no_encontrado');
  assert.equal(leerProducto(null, '123').motivo, 'no_encontrado');
  assert.equal(leerProducto(ficha({ product_name: 'Agua', nutriments: {} })).motivo, 'sin_kcal');
  assert.equal(leerProducto(ficha({ product_name: 'X', nutriments: { 'energy-kcal_100g': 3500 } })).motivo, 'datos_raros');
  assert.equal(leerProducto(ficha({ product_name: 'X', nutriments: { 'energy-kcal_100g': 300, fat_100g: 140 } })).motivo, 'datos_raros');
  assert.equal(leerProducto(ficha({ product_name: 'X', serving_quantity: 0, nutriments: { 'energy-kcal_100g': 300 } })).porcion, null);
});

test('el escáner se ofrece en la web con cámara, nunca dentro de las apps de las tiendas', () => {
  const nav = { mediaDevices: { getUserMedia: () => {} } };
  assert.equal(escanerDisponible({ navigator: nav }), true);
  assert.equal(escanerDisponible({ navigator: {} }), false);
  assert.equal(escanerDisponible({ navigator: nav, Capacitor: { isNativePlatform: () => true } }), false);
  assert.equal(escanerDisponible({ navigator: nav, Capacitor: { isNativePlatform: () => false } }), true);
});
