// ═══ Anticonceptivo hormonal declarado en el perfil (22-nov-2026, PEND-2026-279 pregunta 2) ═══
// Orden de Alejandro (22-nov): «Sí a la casilla de anticonceptivos». La paciente lo dice UNA vez
// en su ficha de perfil y la calculadora de cafeína lo lee; no lo pregunta.
//
// Dónde vive: profiles.anticonceptivo (text; nulo = no consta), 07. App GBH/sql/anticonceptivo_perfil.sql.
// Mientras la columna no exista (el SQL espera el visto bueno de Alejandro) o no haya red, la
// respuesta vive en el teléfono (localStorage) marcada como pendiente, y se sube en la primera
// apertura en que la base conteste. Las lecturas y escrituras van por sbDirect, SIN la cola
// offline de sbReq: un PATCH a una columna que no existe se reintentaría sin fin.
//
// Este fichero no importa nada: el arnés (07. App GBH/arnes_casilla_anticonceptivo.py) lo pega
// en línea en una página, como hace arnes_cafeina.py con el motor.

// Los mismos tres valores que ANTICONCEPTIVO_DECLARADO de motorCafeina.js y que el CHECK de la base.
export const ANTI_VALORES = ["combinado", "sin_estrogeno", "no"];
export const antiValido = (v) => ANTI_VALORES.includes(v);
export const antiClave = (id) => `gbh:anticonceptivo:${id}`;

// Qué vale, qué hay que escribir en la base y qué queda en el teléfono.
//   base:  lo que dice la base → uno de ANTI_VALORES, null (no consta) o undefined (no se pudo leer).
//   local: lo guardado en el teléfono → { v, at, pendiente } o null.
// Reglas:
//   · sin respuesta de la base, manda el teléfono y no se escribe nada;
//   · lo elegido aquí y aún no subido (pendiente) gana a la base, y se sube;
//   · lo del teléfono que la base no tiene (la columna llegó después) se sube;
//   · si no hay nada pendiente, manda la base (pudo cambiarse en otro dispositivo).
export function antiDecidir(base, local) {
  const lv = local && antiValido(local.v) ? local.v : null;
  if (base === undefined) return { valor: lv, escribir: null, local: lv ? local : null };
  const bv = antiValido(base) ? base : null;
  if (lv && (local.pendiente || bv === null)) {
    return lv === bv
      ? { valor: lv, escribir: null, local: { ...local, pendiente: false } }
      : { valor: lv, escribir: lv, local: { ...local, pendiente: true } };
  }
  if (bv) return { valor: bv, escribir: null, local: { v: bv, at: (local && local.v === bv && local.at) || null, pendiente: false } };
  return { valor: null, escribir: null, local: null };
}
