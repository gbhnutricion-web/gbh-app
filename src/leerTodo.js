// Lee una consulta de PostgREST ENTERA, en bloques, hasta vaciarla (12-oct-2026, MAESTRO-2026-906).
//
// PostgREST devuelve como mucho `max_rows` filas por petición —1.000 en este proyecto: medido el
// 12-oct-2026 en la API de gestión y con una tabla de 1.585 filas— aunque se pida más con `limit` o con
// `Range`, y lo hace SIN error (un 200/206 con las 1.000 primeras). El recetario iba por 927 y crece a
// rachas: leído de un golpe, la App dejaría de ver recetas en silencio.
//
// `pedir(ruta)` hace UN GET y devuelve {filas, total} —total: lo que dice Content-Range tras la barra,
// o null si no llega— o null si falla. Se para cuando ya están todas (total) o cuando una página llega
// vacía (si no hay total), nunca porque una página venga corta: el servidor puede cortar por debajo
// del bloque. La ruta tiene que llevar un `order` que acabe en una columna ÚNICA
// (`order=calorias.asc,id_receta.asc`): sin orden total, dos páginas pueden repetir o saltarse filas.
// Devuelve todas las filas o null: un bloque que falla tumba la lectura entera, para que nadie guarde
// ni enseñe como completo un recetario a medias.
export const BLOQUE_FILAS = 1000;
export const TOPE_VUELTAS = 100;   // 100 bloques: si se llega, el servidor no avanza y se da por fallida

export async function leerTodo(pedir, ruta, bloque = BLOQUE_FILAS) {
  const sep = ruta.includes('?') ? '&' : '?';
  const filas = [];
  let total = null;
  for (let vuelta = 0; vuelta < TOPE_VUELTAS; vuelta++) {
    const r = await pedir(`${ruta}${sep}limit=${bloque}&offset=${filas.length}`);
    if (!r || !Array.isArray(r.filas)) return null;
    if (Number.isFinite(r.total)) total = r.total;            // el último manda: si entra una fila a mitad, se ve
    for (const f of r.filas) filas.push(f);
    if (!r.filas.length) return filas;                         // vaciada
    if (total !== null && filas.length >= total) return filas; // ya están todas: ni una petición de más
  }
  return null;
}
