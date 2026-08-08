// Motor de pintado de la oveja 32x32 — el MISMO para el componente Sheep y
// para el canvas del juego, para que no puedan divergir (hoy son dos copias de
// la misma lógica y ya se desincronizaron una vez).
//
// Devuelve TRAMOS [x, y, ancho, hex], no píxeles sueltos. Dos motivos:
//   · a 32x32 hay 4x más píxeles que antes y el ranking pinta 10 ovejas a la
//     vez; en tramos salen ~5x menos nodos que en píxeles.
//   · las capas se resuelven sobre una rejilla antes de emitir, así que un
//     píxel tapado por un accesorio ya no genera un <rect> invisible debajo.
// El consumidor decide si son <rect> o fillRect. No sabe de React ni de canvas.

import { N32, BASE32, FACES32, PATRON32, ARCOIRIS32, ACC32, ACC_MAPA,
         pal32, palAcc32, palFranja } from "./bo32";

const LANA = { W:1, H:1, m:1, S:1, O:1 };   // celdas que la bandera repinta

export function tramosBo32(col, equipados = [], estado = "feliz") {
  const pal = pal32(col.W, col.w);
  const acc = palAcc32(col.W);
  const g = new Array(N32 * N32).fill(null);
  const set = (x, y, hex) => {
    if (x >= 0 && x < N32 && y >= 0 && y < N32 && hex) g[y * N32 + x] = hex;
  };

  const pintarAcc = a => a.f.forEach((fila, j) => [...fila].forEach((ch, i) => {
    if (ch !== ".") set(a.x + i, a.y + j, acc[ACC_MAPA[ch]]);
  }));

  const puestos = equipados.map(id => ACC32[id]).filter(Boolean);
  puestos.filter(a => a.d).forEach(pintarAcc);        // capa/alas/colas: DETRÁS

  // Cuerpo. Con bandera o arcoíris la lana se sustituye por la franja que
  // toca, pero conservando el tono (luz/base/sombra/contorno).
  const franjas = col.bandas || (col.patron === "arcoiris" ? ARCOIRIS32 : null);
  const cache = {};
  BASE32.forEach((fila, y) => [...fila].forEach((ch, x) => {
    if (ch === ".") return;
    if (franjas && LANA[ch]) {
      const n = franjas.length;
      const b = Math.min(n - 1, Math.floor(y * n / N32));
      const p = cache[b] || (cache[b] = palFranja(franjas[b]));
      set(x, y, p[ch]);
    } else {
      set(x, y, pal[ch]);
    }
  }));

  // Patrón (manchas del dálmata, maquillaje de payasa, calavera)
  (PATRON32[col.patron] || []).forEach(([x, y, ch]) => set(x, y, pal[ch]));

  // Cara: las skins con cara propia (payasa, esqueleto) ya la traen en el patrón
  if (!col.caraPropia) {
    (FACES32[estado] || FACES32.feliz).forEach(([x, y, ch]) => set(x, y, pal[ch]));
  }

  puestos.filter(a => !a.d).forEach(pintarAcc);       // el resto, DELANTE

  const out = [];
  for (let y = 0; y < N32; y++) {
    let x = 0;
    while (x < N32) {
      const hex = g[y * N32 + x];
      if (!hex) { x++; continue; }
      let w = 1;
      while (x + w < N32 && g[y * N32 + x + w] === hex) w++;
      out.push([x, y, w, hex]);
      x += w;
    }
  }
  return out;
}
