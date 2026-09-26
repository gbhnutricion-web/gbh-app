// ─── Partida pendiente de guardar (26-sep-2026, MAESTRO-2026-655) ──────────────
// Una partida terminada es del paciente hasta que el SERVIDOR la confirma. Antes el
// testigo se cerraba ANTES de llamar a la red y, si la llamada fallaba, la partida
// pasaba a la cola offline genérica, que (1) da por buena cualquier respuesta HTTP
// 200 —también un «ok:false»—, (2) la reenvía el día que sea y el servidor la apunta
// al día de LLEGADA, y (3) no cuenta en el contador de partidas: al releerlo, la app
// ofrecía otra y la nueva ocupaba el hueco de la que seguía en la cola. Medido el
// 26-sep en un iPhone: una partida de ~1.400 pagó su diamante, no llegó nunca al
// servidor, y la de 780 jugada después se grabó como la tercera del día.
// La lógica sin React vive aquí; la usa la zona de juego de App.jsx.
// Tests: tests/partidaPendiente.test.mjs.

export const TOPE_PUNTOS = 10000;       // el mismo de la RPC y de la restricción de juego_partidas
export const MARGEN_RELOJ_MS = 25000;   // reloj del móvil frente al del servidor; por debajo de los 30 s entre partidas

export const diaMadrid = (ts = Date.now()) => new Date(ts).toLocaleDateString('sv-SE', { timeZone: 'Europe/Madrid' });

// Respuesta de sbDirect → qué se hace con la partida:
//   ok            el servidor la ha grabado (res trae los contadores)
//   rechazo       el servidor dice que no (ok:false o un 4xx): no hay nada que reintentar
//   sin_respuesta corte de red, 5xx, cuerpo ilegible o plazo agotado: sigue pendiente
export function clasificarRespuesta(r) {
  if (r && r.ok && r.data && r.data.ok === true) return { estado: 'ok', res: r.data };
  if (r && r.ok && r.data && r.data.ok === false) return { estado: 'rechazo', res: r.data };
  if (r && r.status >= 400 && r.status < 500) return { estado: 'rechazo', res: { ok: false, error: `http_${r.status}` } };
  return { estado: 'sin_respuesta' };
}

// ¿Llegó la partida aunque se perdiera la respuesta? Tras pagar la partida N no puede
// grabarse otra que la N (el botón de jugar espera a que se salde), así que una fila
// de su día, creada después del pago y con sus mismos puntos, es ella. Sin la hora del
// pago (testigo de una versión anterior) no se puede saber: se envía.
export function yaEstaEnElServidor(filas, t) {
  if (!t || !t.pagada) return false;
  const desde = t.pagada - MARGEN_RELOJ_MS;
  return (Array.isArray(filas) ? filas : []).some(f =>
    (f.puntos || 0) === (t.pts || 0) && Date.parse(f.created_at) >= desde);
}

// Una partida que quedó en la cola offline (versiones anteriores a este cambio) solo
// se envía el MISMO día: otro día el servidor la apuntaría al día de llegada y le
// quitaría al paciente una partida de ese día.
export const opDePartidaCaducada = (op, hoy = diaMadrid()) =>
  !!op && op.path === 'rpc/registrar_partida_juego' && !!op.ts && diaMadrid(op.ts) !== hoy;

// Un testigo de hoy sin partida en marcha es una partida jugada que el servidor aún
// no tiene: cuenta como jugada y no deja pagar otra hasta que se salde.
export const esPendienteDeHoy = (t, hoy = diaMadrid(), enCurso = false) =>
  !!t && !enCurso && t.fecha === hoy;
