// node --test tests/fotoIA.test.mjs · «¿Qué comiste?» con foto (MAESTRO-2026-1629).
// La respuesta imita la de gbh_foto.validar() en el servidor.
import test from 'node:test';
import assert from 'node:assert/strict';
import { fotoDisponible, itemsDesdeFoto, mensajeFoto, estadoFoto, olvidarEstadoFoto } from '../src/fotoIA.js';
import { kcalItem, sumaItems } from '../src/kcalDia.js';

const NUTRI = { 'Arroz blanco cocido': { k: 130, p: 2.7, h: 28, g: 0.3, u: [['plato', 200]], id: 77 }, 'Aceite de oliva': { k: 883.4, p: 0, h: 0, g: 99.9, u: [['cucharada', 10]], id: 2543 } };

test('alimentos de la tabla: kcal de NUESTRA tabla, marcados estimado y foto', () => {
  const it = itemsDesdeFoto({ hay_comida: true, platos: [{ alimento: 'Arroz blanco cocido', nombre: 'arroz', gramos: 150 }, { alimento: 'Aceite de oliva', nombre: 'aceite', gramos: 10 }] }, NUTRI);
  assert.equal(it.length, 2);
  assert.deepEqual(it[0], { t: 'ing', n: 'Arroz blanco cocido', q: 1, u: 'ración', ug: 150, k: 130, p: 2.7, h: 28, g: 0.3, id: 77, e: 1, src: 'foto' });
  assert.equal(Math.round(kcalItem(it[0]).kcal), 195);
  assert.equal(Math.round(sumaItems(it).kcal), 195 + 88);
});

test('arroz cocido: la medida dice lo cocido y los gramos van en crudo', () => {
  const [it] = itemsDesdeFoto({ platos: [{ alimento: 'Arroz blanco cocido', nombre: 'arroz', gramos: 69, cocido: 180 }] }, NUTRI);
  assert.equal(it.u, 'cocido 180 g');
  assert.equal(it.ug, 69);
});

test('«otro» usa las cifras del servidor; sin nombre o sin cifras no entra', () => {
  const it = itemsDesdeFoto({ platos: [
    { alimento: 'otro', nombre: 'salsa de yogur', gramos: 40, k: 120, p: 4, h: 6, g: 9 },
    { alimento: 'otro', nombre: '', gramos: 40, k: 120 },
    { alimento: 'otro', nombre: 'algo', gramos: 40 },
    { alimento: 'No existe', nombre: 'x', gramos: 40 },
    { alimento: 'Arroz blanco cocido', nombre: 'arroz', gramos: 0 },
  ] }, NUTRI);
  assert.equal(it.length, 1);
  assert.equal(it[0].n, 'salsa de yogur');
  assert.equal(Math.round(kcalItem(it[0]).kcal), 48);
  assert.equal(it[0].id, null);
});

test('respuestas vacías o rotas no rompen', () => {
  assert.deepEqual(itemsDesdeFoto(null, NUTRI), []);
  assert.deepEqual(itemsDesdeFoto({ hay_comida: false, platos: [] }, NUTRI), []);
  assert.deepEqual(itemsDesdeFoto({ platos: 'x' }, NUTRI), []);
});

test('solo en la web: en las apps de las tiendas queda oculto', () => {
  const doc = {}; const FR = function () {};
  assert.equal(fotoDisponible({ document: doc, FileReader: FR }), true);
  assert.equal(fotoDisponible({ document: doc, FileReader: FR, Capacitor: { isNativePlatform: () => true } }), false);
  assert.equal(fotoDisponible(null), false);
});

test('mensajes: cada motivo el suyo y uno genérico', () => {
  assert.match(mensajeFoto('tope', false), /fotos de hoy/);
  assert.match(mensajeFoto('tope', true), /today/);
  assert.match(mensajeFoto('ia_fallo', false), /No he podido/);
});

test('estado: una sola petición por sesión; sin sesión no pregunta', async () => {
  olvidarEstadoFoto();
  let n = 0;
  const f = async (url, o) => { n++; assert.equal(url, 'https://srv/foto/estado'); assert.equal(o.headers['X-GBH-Sesion'], 'tok'); return { ok: true, json: async () => ({ ia: true, consentido: false }) }; };
  const a = await estadoFoto('https://srv', { token: 'tok' }, f);
  const b = await estadoFoto('https://srv', { token: 'tok' }, f);
  assert.equal(a.ia, true); assert.equal(b.ia, true); assert.equal(n, 1);
  assert.equal((await estadoFoto('https://srv', null, f)).ia, false); assert.equal(n, 1);
  olvidarEstadoFoto();
  const c = await estadoFoto('https://srv', { token: 'tok' }, async () => { throw new Error('sin red'); });
  assert.deepEqual(c, { ia: false, motivo: 'red' });
});
