// Escribir UNA celda del plan, de forma atómica en la base (15-oct-2026, PEND-2026-387 · MAESTRO-2026-923).
//
// Hasta hoy, cambiar una receta o un plato mandaba `PATCH weekly_plans {plan_json: <el plan entero en
// memoria>}`. Si el paciente había cambiado algo en otro dispositivo o pestaña desde que esta leyó el plan,
// lo borraba: el 15-oct la app de Aritz (plan leído a las 16:19:53Z) escribió a las 16:26Z y se llevó 4
// cambios hechos en Safari entre las 16:22 y las 16:24Z (MAESTRO-2026-922). Releer antes de escribir solo
// acorta la ventana (fila 502 del catálogo); escribir solo la celda la cierra.
//
// `persistirCelda` llama a la función de la base `cambiar_celda_plan` (07. App GBH/sql/celda_plan.sql:
// un jsonb_set en un solo UPDATE, con los mismos permisos que el PATCH) y devuelve:
//   {via:'rpc', plan}  la base escribió la celda; `plan` es el plan entero ya escrito (trae también lo que
//                      se cambió en el otro lado), o null si esa semana no existe;
//   {via:'cola'}       sin red: va a la cola como llamada a la función (una celda, nunca el plan entero);
//   {via:'patch'}      error HTTP (la función no existe, un argumento malo, permisos): el PATCH de siempre.
// Las dependencias llegan por argumento (sbDirect, sbReq y enqueue de App.jsx) para poder probarlo solo.
export const RPC_CELDA = 'rpc/cambiar_celda_plan';

export const argsCelda = (profileId, semana, toma, dia, celda) =>
  ({ p_profile_id: profileId, p_semana: semana, p_toma: toma, p_dia: String(dia), p_celda: celda });

export async function persistirCelda({ sbDirect, sbReq, enqueue, profileId, semana, toma, dia, celda, planEntero, ahora = Date.now, nuevoId }) {
  const args = argsCelda(profileId, semana, toma, dia, celda);
  const r = await sbDirect('POST', RPC_CELDA, args);
  if (r && r.ok) {
    const plan = r.data && typeof r.data === 'object' && !Array.isArray(r.data) ? r.data : null;
    return { via: 'rpc', plan };
  }
  if (!r || r.status === 0) {
    const id = nuevoId ? nuevoId() : crypto.randomUUID();
    enqueue({ id, method: 'POST', path: RPC_CELDA, body: args, ts: ahora() });
    return { via: 'cola' };
  }
  await sbReq('PATCH', `weekly_plans?profile_id=eq.${profileId}&semana=eq.${semana}`, { plan_json: planEntero });
  return { via: 'patch' };
}

// Al volver a primer plano, la app relee sus semanas y las FUNDE con las que tiene: cada semana que está en
// las dos se queda con lo releído (plan, fecha y PDF); no se añaden ni se quitan semanas (eso lo hace la
// carga normal), para no mover `idx` mientras el paciente mira una. Lo que no cambió conserva su objeto.
export function fusionarPlanes(actuales, releidos) {
  if (!Array.isArray(actuales) || !Array.isArray(releidos)) return actuales;
  const porSemana = new Map(releidos.filter((p) => p && p.semana != null).map((p) => [String(p.semana), p]));
  let cambio = false;
  const fundidos = actuales.map((p) => {
    const n = p && porSemana.get(String(p.semana));
    if (!n) return p;
    const igual = JSON.stringify(n.plan_json) === JSON.stringify(p.plan_json)
      && String(n.fecha_gen) === String(p.fecha_gen) && (n.pdf_url ?? null) === (p.pdf_url ?? null);
    if (igual) return p;
    cambio = true;
    return { ...p, plan_json: n.plan_json, fecha_gen: n.fecha_gen, pdf_url: n.pdf_url };
  });
  return cambio ? fundidos : actuales;
}
