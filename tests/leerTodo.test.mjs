// node --test tests/leerTodo.test.mjs (sin Node en el PC de GBH: los mismos casos corren en Chrome sin
// cabeza con 07. App GBH/arnes_leer_todo.py, que además siembra mutantes y comprueba que los casos los
// cazan). Cada caso lanza un Error si falla. MAESTRO-2026-906.
import test from 'node:test';
import { leerTodo, BLOQUE_FILAS, TOPE_VUELTAS } from '../src/leerTodo.js';

const ok = (c, m) => { if (!c) throw new Error(m || 'no se cumple'); };
const igual = (a, b, m) => { const x = JSON.stringify(a), y = JSON.stringify(b); if (x !== y) throw new Error(`${m || ''} ${x} ≠ ${y}`); };

// Un PostgREST de juguete: corta en maxRows aunque se pida más, respeta limit/offset, da el total como
// Content-Range (o no) y falla a la carta. Apunta cada ruta pedida.
const servidor = (n, { maxRows = 1000, conTotal = true, fallaEn = -1, malformadaEn = -1, ignoraOffset = false, crece = 0 } = {}) => {
  const tabla = Array.from({ length: n }, (_, i) => ({ id_receta: `R${String(i + 1).padStart(5, '0')}` }));
  const pedidas = [];
  const pedir = async (ruta) => {
    pedidas.push(ruta);
    const k = pedidas.length - 1;
    if (k === fallaEn) return null;
    if (k === malformadaEn) return { filas: { message: 'no es una lista' }, total: tabla.length };
    const q = new URLSearchParams(ruta.slice(ruta.indexOf('?') + 1));
    const limit = Math.min(parseInt(q.get('limit') ?? '1000000', 10), maxRows);
    const offset = ignoraOffset ? 0 : parseInt(q.get('offset') ?? '0', 10);
    const filas = tabla.slice(offset, offset + limit);
    const total = tabla.length;
    if (k === 0) for (let i = 0; i < crece; i++) tabla.push({ id_receta: `N${i + 1}` });  // entra mientras se lee
    return { filas, total: conTotal ? total : null };
  };
  return { tabla, pedir, pedidas };
};
const offsets = (pedidas) => pedidas.map((r) => Number(new URLSearchParams(r.slice(r.indexOf('?') + 1)).get('offset')));
const ids = (filas) => filas.map((f) => f.id_receta);
const R = 'recipes?select=*&order=id_receta.asc';

export const CASOS = [
  { que: 'por debajo del tope (927, como hoy): todas en UNA petición, la misma que antes más limit/offset', prueba: async () => {
    const s = servidor(927);
    const f = await leerTodo(s.pedir, R);
    igual(f.length, 927);
    igual(s.pedidas, [`${R}&limit=${BLOQUE_FILAS}&offset=0`]);
  } },
  { que: 'por encima (2.500 con max_rows 1.000): todas, en orden y sin repetidas, en 3 peticiones contiguas', prueba: async () => {
    const s = servidor(2500);
    const f = await leerTodo(s.pedir, R);
    igual(ids(f), ids(s.tabla));
    igual(new Set(ids(f)).size, 2500);
    igual(offsets(s.pedidas), [0, 1000, 2000]);
  } },
  { que: 'justo 1.000: una sola petición (el total dice que ya están todas)', prueba: async () => {
    const s = servidor(1000);
    igual((await leerTodo(s.pedir, R)).length, 1000);
    igual(s.pedidas.length, 1);
  } },
  { que: '1.001: la que la lectura de un golpe perdía llega en la segunda petición', prueba: async () => {
    const s = servidor(1001);
    const f = await leerTodo(s.pedir, R);
    igual(f.length, 1001);
    igual(f[1000].id_receta, 'R01001');
    igual(offsets(s.pedidas), [0, 1000]);
  } },
  { que: 'tabla vacía: [] (no null) con una petición', prueba: async () => {
    const s = servidor(0);
    igual(await leerTodo(s.pedir, R), []);
    igual(s.pedidas.length, 1);
  } },
  { que: 'el servidor corta por debajo del bloque (max_rows 500): una página corta NO es la última', prueba: async () => {
    const s = servidor(2500, { maxRows: 500 });
    const f = await leerTodo(s.pedir, R);
    igual(ids(f), ids(s.tabla));
    igual(offsets(s.pedidas), [0, 500, 1000, 1500, 2000]);
  } },
  { que: 'sin Content-Range (total desconocido): sigue hasta la página vacía y no pierde ninguna', prueba: async () => {
    const s = servidor(2500, { conTotal: false });
    igual(ids(await leerTodo(s.pedir, R)), ids(s.tabla));
    igual(offsets(s.pedidas), [0, 1000, 2000, 2500]);
    const t = servidor(927, { conTotal: false, maxRows: 300 });
    igual((await leerTodo(t.pedir, R)).length, 927);
    igual(offsets(t.pedidas), [0, 300, 600, 900, 927]);
  } },
  { que: 'un bloque que falla (el 2º) tumba la lectura: null, nada a medias', prueba: async () => {
    const s = servidor(2500, { fallaEn: 1 });
    igual(await leerTodo(s.pedir, R), null);
    igual(s.pedidas.length, 2);
  } },
  { que: 'el primero falla: null (lo mismo que hacía sbReq sin red)', prueba: async () => {
    igual(await leerTodo(servidor(927, { fallaEn: 0 }).pedir, R), null);
  } },
  { que: 'una página que no es una lista (error de PostgREST en JSON): null', prueba: async () => {
    igual(await leerTodo(servidor(2500, { malformadaEn: 1 }).pedir, R), null);
  } },
  { que: 'ruta sin «?»: el bloque se pide con «?limit=…»; con «?», con «&limit=…»', prueba: async () => {
    const s = servidor(3);
    await leerTodo(s.pedir, 'recipes');
    igual(s.pedidas, ['recipes?limit=1000&offset=0']);
    const t = servidor(3);
    await leerTodo(t.pedir, 'recipes?tipo=eq.Carne&select=*&order=calorias.asc,id_receta.asc');
    igual(t.pedidas, ['recipes?tipo=eq.Carne&select=*&order=calorias.asc,id_receta.asc&limit=1000&offset=0']);
  } },
  { que: 'un servidor que no avanza (ignora offset) y no da total: para en el tope de vueltas con null', prueba: async () => {
    const s = servidor(2500, { conTotal: false, ignoraOffset: true });
    igual(await leerTodo(s.pedir, R), null);
    igual(s.pedidas.length, TOPE_VUELTAS);
  } },
  { que: 'entra una receta mientras se lee: manda el último total y no se queda fuera', prueba: async () => {
    const s = servidor(2000, { crece: 1 });   // con el total de la 1ª página (2.000) se pararía antes de la nueva
    const f = await leerTodo(s.pedir, R);
    igual(f.length, 2001);
    igual(f[2000].id_receta, 'N1');
    igual(offsets(s.pedidas), [0, 1000, 2000]);
  } },
  { que: 'el bloque se elige (la prueba contra la base real lee de 100 en 100)', prueba: async () => {
    const s = servidor(250);
    igual((await leerTodo(s.pedir, R, 100)).length, 250);
    igual(offsets(s.pedidas), [0, 100, 200]);
    ok(s.pedidas.every((r) => r.includes('limit=100&')));
  } },
];

for (const c of CASOS) test(`leerTodo · ${c.que}`, c.prueba);
