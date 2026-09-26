// node --test tests/cafeina.test.mjs  (sin Node en el PC de GBH: los mismos casos corren en Chrome sin
// cabeza con arnes_cafeina.py, que además valida la solución exacta contra rxode2).
import test from 'node:test';
import assert from 'node:assert/strict';
import { CASOS } from './cafeina.cases.mjs';

for (const c of CASOS) {
  test(`cafeína · ${c.que}`, () => {
    const r = c.f();
    assert.ok(r.ok, r.detalle);
  });
}
