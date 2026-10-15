// node --test tests/celdaPlan.test.mjs (sin Node en el PC de GBH: los mismos casos corren en Chrome sin
// cabeza con 07. App GBH/arnes_celda_plan.py, que además siembra mutantes y reproduce la pisada del 15-oct
// con el código de App.jsx de antes y de después). Cada caso lanza un Error si falla. MAESTRO-2026-923.
import test from 'node:test';
import { persistirCelda, fusionarPlanes, argsCelda, RPC_CELDA } from '../src/celdaPlan.js';

const ok = (c, m) => { if (!c) throw new Error(m || 'no se cumple'); };
const igual = (a, b, m) => { const x = JSON.stringify(a), y = JSON.stringify(b); if (x !== y) throw new Error(`${m || ''} ${x} ≠ ${y}`); };

// Dependencias de juguete: sbDirect contesta lo que se le diga y apunta; sbReq y enqueue apuntan.
const deps = (respuesta) => {
  const llamadas = [];
  return {
    llamadas,
    sbDirect: async (method, path, body) => { llamadas.push(['sbDirect', method, path, body]); return respuesta; },
    sbReq: async (method, path, body) => { llamadas.push(['sbReq', method, path, body]); return null; },
    enqueue: (op) => { llamadas.push(['enqueue', op]); },
  };
};
const BASE = { profileId: 'P1', semana: 4, toma: 'Comida', dia: 4, celda: { Nombre_Receta: 'Nueva' },
               planEntero: { Comida: { 4: { Nombre_Receta: 'Nueva' } } }, ahora: () => 123, nuevoId: () => 'id-1' };
const ARGS = { p_profile_id: 'P1', p_semana: 4, p_toma: 'Comida', p_dia: '4', p_celda: { Nombre_Receta: 'Nueva' } };

export const CASOS = [
  { que: 'la función contesta: UNA llamada, a la función, con la celda sola y el día como texto', prueba: async () => {
    const plan = { Comida: { 4: { Nombre_Receta: 'Nueva' } }, Cena: { 4: { Nombre_Receta: 'De la web' } } };
    const d = deps({ ok: true, status: 200, data: plan });
    const r = await persistirCelda({ ...d, ...BASE });
    igual(r, { via: 'rpc', plan });
    igual(d.llamadas, [['sbDirect', 'POST', RPC_CELDA, ARGS]]);
  } },
  { que: 'la función contesta null (no hay esa semana): no se escribe nada más y no hay plan que poner', prueba: async () => {
    const d = deps({ ok: true, status: 200, data: null });
    igual(await persistirCelda({ ...d, ...BASE }), { via: 'rpc', plan: null });
    igual(d.llamadas.length, 1);
  } },
  { que: 'la función no existe (404): el PATCH de siempre, con el plan entero, por sbReq', prueba: async () => {
    const d = deps({ ok: false, status: 404, data: { code: 'PGRST202' } });
    igual(await persistirCelda({ ...d, ...BASE }), { via: 'patch' });
    igual(d.llamadas[1], ['sbReq', 'PATCH', 'weekly_plans?profile_id=eq.P1&semana=eq.4', { plan_json: BASE.planEntero }]);
    igual(d.llamadas.length, 2);
  } },
  { que: 'argumento malo (400) o permisos (401): también el PATCH de siempre', prueba: async () => {
    for (const status of [400, 401, 500]) {
      const d = deps({ ok: false, status, data: null });
      igual(await persistirCelda({ ...d, ...BASE }), { via: 'patch' }, `status ${status}`);
      igual(d.llamadas.map((l) => l[0]), ['sbDirect', 'sbReq'], `status ${status}`);
    }
  } },
  { que: 'sin red (status 0): a la cola como llamada a la función, nunca el plan entero', prueba: async () => {
    const d = deps({ ok: false, status: 0, data: null });
    igual(await persistirCelda({ ...d, ...BASE }), { via: 'cola' });
    igual(d.llamadas[1], ['enqueue', { id: 'id-1', method: 'POST', path: RPC_CELDA, body: ARGS, ts: 123 }]);
    igual(d.llamadas.length, 2);
    ok(!JSON.stringify(d.llamadas).includes('plan_json'), 'el plan entero no viaja');
  } },
  { que: 'una respuesta que no es un objeto (lista) no se toma por plan', prueba: async () => {
    const d = deps({ ok: true, status: 200, data: [{ plan_json: {} }] });
    igual(await persistirCelda({ ...d, ...BASE }), { via: 'rpc', plan: null });
  } },
  { que: 'argsCelda: nombres de la función de la base y día como texto', prueba: async () => {
    igual(argsCelda('P', 7, 'Cena', 3, { a: 1 }), { p_profile_id: 'P', p_semana: 7, p_toma: 'Cena', p_dia: '3', p_celda: { a: 1 } });
  } },
  { que: 'fusionar: la semana releída gana (plan, fecha y PDF); el orden y la longitud no cambian', prueba: async () => {
    const act = [{ semana: 5, plan_json: { a: 1 }, fecha_gen: 'f5', pdf_url: null }, { semana: 4, plan_json: { b: 1 }, fecha_gen: 'f4', pdf_url: 'x' }];
    const rel = [{ semana: 5, plan_json: { a: 2 }, fecha_gen: 'f5b', pdf_url: 'y' }, { semana: 4, plan_json: { b: 1 }, fecha_gen: 'f4', pdf_url: 'x' }];
    const f = fusionarPlanes(act, rel);
    igual(f.map((p) => p.semana), [5, 4]);
    igual(f[0], { semana: 5, plan_json: { a: 2 }, fecha_gen: 'f5b', pdf_url: 'y' });
    ok(f[1] === act[1], 'la semana que no cambió conserva su objeto');
  } },
  { que: 'fusionar: una semana NUEVA en la base no entra y una que falta no se quita (no mueve idx)', prueba: async () => {
    const act = [{ semana: 5, plan_json: { a: 1 } }, { semana: 4, plan_json: { b: 1 } }];
    const rel = [{ semana: 6, plan_json: { c: 1 } }, { semana: 5, plan_json: { a: 9 } }];
    const f = fusionarPlanes(act, rel);
    igual(f.map((p) => p.semana), [5, 4]);
    igual(f[0].plan_json, { a: 9 });
    ok(f[1] === act[1]);
  } },
  { que: 'fusionar: nada cambió → devuelve la MISMA lista (React no repinta)', prueba: async () => {
    const act = [{ semana: 5, plan_json: { a: 1 }, fecha_gen: 'f', pdf_url: null }];
    ok(fusionarPlanes(act, [{ semana: 5, plan_json: { a: 1 }, fecha_gen: 'f', pdf_url: null }]) === act);
  } },
  { que: 'fusionar: lo releído que no es lista (sin red: sbReq da null) deja lo que había', prueba: async () => {
    const act = [{ semana: 5, plan_json: { a: 1 } }];
    ok(fusionarPlanes(act, null) === act);
  } },
];

for (const c of CASOS) test(c.que, c.prueba);
