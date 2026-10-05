// node --test tests/creatina.test.mjs  (sin Node en el PC de GBH: los mismos casos corren en Chrome sin
// cabeza con arnes_creatina.py, que además los compara con R y con rxode2).
import test from 'node:test';
import assert from 'node:assert/strict';
import { CASOS } from './creatina.cases.mjs';

for (const c of CASOS) {
  test(`creatina · ${c.que}`, () => {
    const r = c.f();
    assert.ok(r.ok, r.detalle);
  });
}
