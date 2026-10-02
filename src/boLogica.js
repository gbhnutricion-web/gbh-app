// ─── «Pregúntale a Bo», fase 1 (sin IA): la lógica, pura ─────────────────────────
// Sin React y sin red, para que el arnés (07. App GBH/arnes_pregunta_bo.py) la pruebe en
// Chrome sin Node. Aquí no se escribe ni una frase de nutrición: los textos salen de
// boRespuestas.js, GENERADO por exportar_bo.py desde 07. App GBH/bo_respuestas.csv, donde
// solo llega lo que la app ya publica o lo que Alejandro ha firmado.
// Diseño: BRIEF_pregunta_a_bo.md §3 y §12 (2-oct-2026).
import { _BO_RESP, _BO_SENSIBLE } from "./boRespuestas";

export const BO_PLANES = ["free", "standard", "premium"];
export const planBo = (profile) => (BO_PLANES.includes(profile?.plan) ? profile.plan : "free");
// Interruptor por paciente (profiles.bo_activo, solo lo enciende Alejandro). Sin columna = apagado.
export const boActivo = (profile) => profile?.bo_activo === true;

const elegir = (t, lang) => (t ? ((lang === "en" && t.en) ? t.en : (t.es || "")) : "");

// ¿Se cumple la condición de la fila? Una condición que no se conoce NO se ofrece.
export function condicionVale(c, ctx) {
  if (!c) return true;
  if (c === "raciones>1") return (parseInt(ctx?.raciones, 10) || 1) > 1;
  if (c === "con_cambio") return !!ctx?.puedeCambiar;
  if (c === "no_descartada") return !ctx?.descartada;
  return false;
}
const valePlan = (f, ctx) => Array.isArray(f.planes) && f.planes.includes(ctx?.plan);

// Los temas (botones) de un sitio: filas madre de ese contexto, de su plan y con su condición.
export function temasPara(ctx, filas = _BO_RESP) {
  return (filas || []).filter((f) => !f.anexo_de && Array.isArray(f.contexto) && f.contexto.includes(ctx?.contexto)
    && valePlan(f, ctx) && condicionVale(f.condicion, ctx));
}
export const botonTema = (f, lang) => elegir(f?.boton, lang);

// «{coste}» es aritmética de la app, no criterio: lo mismo que pone el botón 🔄.
export function costeTxt(ctx, lang) {
  if (ctx?.enTrial) return lang === "en" ? "Free while your trial lasts." : "Gratis mientras dure tu prueba.";
  return lang === "en" ? "It costs 10 💎." : "Cuesta 10 💎.";
}
// «{caja_racion}» es el texto que la ficha YA enseña en su caja de ración (textosCajaRacion de
// raciones.js, calculado con los datos de esa receta): lo pasa App.jsx en ctx.cajaRacion.
export function rellenar(s, ctx, lang) {
  return String(s || "")
    .replace(/\{raciones\}/g, String(parseInt(ctx?.raciones, 10) || 1))
    .replace(/\{coste\}/g, costeTxt(ctx, lang))
    .replace(/\{caja_racion\}/g, String(ctx?.cajaRacion || ""))
    .replace(/[ \t]{2,}/g, " ")
    .trim();
}
// El texto de un tema, con sus anexos (filas `anexo_de`) que valgan para este paciente.
export function textoTema(f, ctx, lang, filas = _BO_RESP) {
  const anexos = (filas || []).filter((a) => a.anexo_de === f.id && valePlan(a, ctx) && condicionVale(a.condicion, ctx));
  return rellenar([elegir(f.texto, lang), ...anexos.map((a) => elegir(a.texto, lang))].filter(Boolean).join(" "), ctx, lang);
}
// Firma visible solo en lo firmado por una persona («publicado» es texto de la app).
export const firmaDe = (f) => (f && f.firma && f.firma !== "publicado" ? f.firma : null);
// La firma de lo que se enseña: la de la fila o, si es texto publicado, la de un anexo firmado que salga.
export function firmaTema(f, ctx, filas = _BO_RESP) {
  if (firmaDe(f)) return firmaDe(f);
  const a = (filas || []).find((x) => x.anexo_de === f?.id && valePlan(x, ctx) && condicionVale(x.condicion, ctx) && firmaDe(x));
  return a ? firmaDe(a) : null;
}

// ── Filas de sistema (frontera ética, acuse de lo escrito, sin alternativa) ──────
export function filaSistema(id, ctx, filas = _BO_RESP) {
  const f = (filas || []).find((x) => x.id === id);
  return f && valePlan(f, ctx) ? f : null;
}
const idEscrito = (ctx) => (ctx?.plan === "premium" ? "escrito_premium" : "escrito_estandar");
// «Escríbele a Alejandro» solo existe si están firmadas la frontera ética y el acuse de su plan.
export const puedeEscribir = (ctx, filas = _BO_RESP) => !!filaSistema("sensible", ctx, filas) && !!filaSistema(idEscrito(ctx), ctx, filas);
export const filaEscrito = (ctx, filas = _BO_RESP) => filaSistema(idEscrito(ctx), ctx, filas);
export function esSensible(texto, re = _BO_SENSIBLE) {
  if (!texto || !re) return false;
  re.lastIndex = 0;
  return re.test(String(texto));
}

// ── Momentos: Bo al marcar ⏭️ «Me la salté» o 🔄 «La cambié», una vez al día ──────
export const momentoDe = (estado) => (estado === "saltada" ? "momento:saltada" : estado === "fuera" ? "momento:fuera" : null);
export function filaMomento(estado, ctx, filas = _BO_RESP) {
  const c = momentoDe(estado);
  if (!c) return null;
  return (filas || []).find((f) => Array.isArray(f.contexto) && f.contexto.includes(c) && valePlan(f, ctx)) || null;
}
export const claveMomento = (pid, dia) => `gbh:bo:momento:${pid}:${dia}`;
export function momentoVisto(almacen, pid, dia) {
  try { return !!almacen && almacen.getItem(claveMomento(pid, dia)) === "1"; } catch (e) { return false; }
}
export function marcarMomentoVisto(almacen, pid, dia) {
  try { if (almacen) almacen.setItem(claveMomento(pid, dia), "1"); } catch (e) { /* sin almacén: se repetirá, no se rompe */ }
}
// Primera semana tras el alta: Bo se ofrece en Inicio (fricción tecnológica de los 45+, §12).
export function enPrimeraSemana(profile, ahora = Date.now()) {
  const c = Date.parse(profile?.created_at || "");
  return Number.isFinite(c) && ahora - c >= 0 && ahora - c < 7 * 86400000;
}

// ── «Me falta un ingrediente» ──────────────────────────────────────────────────────
export const normBo = (s) => String(s || "").normalize("NFD").replace(/[̀-ͯ]/g, "").toLowerCase()
  .replace(/[^a-z0-9\s]/g, " ").replace(/\s+/g, " ").trim();
// Raíz tosca para que plural y singular casen igual por los dos lados: -s y luego -e.
// («tomates»→«tomat», «tomate»→«tomat»; «limones»→«limon», «limón»→«limon»; «huevos»→«huevo»).
const raiz = (w) => { let x = w; if (x.length > 3 && x.endsWith("s")) x = x.slice(0, -1); if (x.length > 3 && x.endsWith("e")) x = x.slice(0, -1); return x; };
const raices = (s) => normBo(s).split(" ").filter(Boolean).map(raiz).join(" ");
const MEDIDAS = new Set(("g gr grs gramo gramos kg ml l cl litro litros cucharada cucharadas cucharadita cucharaditas cda cdas cdta cdtas " +
  "taza tazas vaso vasos vasito unidad unidades ud uds pizca pizcas diente dientes lata latas rodaja rodajas loncha lonchas " +
  "punado punados pieza piezas sobre sobres chorrito chorro hoja hojas rama ramas trozo trozos filete filetes racion raciones " +
  "bote botes tarro tarros cazo cucharon postre sopera rasa rasas colmada colmadas pequena pequeno grande grandes mediana mediano " +
  "x de del un una unos unas").split(" "));
const CORTE = new Set("para al a en con o y cortado cortada cortados cortadas picado picada picados picadas troceado troceada rallado rallada cocido cocida gusto".split(" "));
// «150 g de pechuga de pollo (en tiras)» → «pechuga de pollo»; «sal al gusto» → «sal».
export function nombreIngrediente(linea) {
  const pal = normBo(String(linea || "").replace(/\([^)]*\)/g, " ").replace(/[\d.,/½¼¾⅓⅔]+/g, " ")).split(" ").filter(Boolean);
  while (pal.length && MEDIDAS.has(pal[0])) pal.shift();
  const fin = pal.findIndex((w, i) => i > 0 && CORTE.has(w));
  const util = fin > 0 ? pal.slice(0, fin) : pal;
  while (util.length && (util[util.length - 1] === "de" || util[util.length - 1] === "del")) util.pop();
  return util.slice(0, 3).join(" ");
}
export function contieneIngrediente(textoIngredientes, clave) {
  const k = raices(clave);
  if (!k) return false;
  return (" " + raices(textoIngredientes) + " ").includes(" " + k + " ");
}
// Los ingredientes de la ficha, sin repetir, como botones (máximo 12).
export function opcionesIngredientes(ingList) {
  const vistos = new Set(), out = [];
  for (const l of ingList || []) {
    const n = nombreIngrediente(l), k = raices(n);
    if (n && k && !vistos.has(k)) { vistos.add(k); out.push(n); }
  }
  return out.slice(0, 12);
}

// ── Fase 2: escribir con IA (2-oct-2026, BRIEF §16) ────────────────────────────────
// El servidor (/bo/entender) devuelve una ESTRUCTURA cerrada; esto la convierte en el siguiente
// paso de la hoja. Ningún texto de la IA llega aquí: los mensajes son datos del plan que compone
// el servidor (tipo «dato»), textos firmados/publicados, o la copia de la app de abajo.
export const TOMAS_BO = ["Desayuno", "Almuerzo", "Comida", "Merienda", "Cena"];
const DIAS_ES = ["lunes", "martes", "miércoles", "jueves", "viernes", "sábado", "domingo"];
const DIAS_EN = ["Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday", "Sunday"];
const TOMA_ES = { Desayuno: "el desayuno", Almuerzo: "el almuerzo", Comida: "la comida", Merienda: "la merienda", Cena: "la cena" };
const TOMA_EN = { Desayuno: "breakfast", Almuerzo: "morning snack", Comida: "lunch", Merienda: "afternoon snack", Cena: "dinner" };
const TIPO_ES = { Carne: "de carne", Pescado: "de pescado", Vegetariana: "vegetariana", Vegana: "vegana", Ensalada: "de ensalada", "Sopa/Crema": "de sopa o crema", Postre: "de postre" };
const TIPO_EN = { Carne: "with meat", Pescado: "with fish", Vegetariana: "vegetarian", Vegana: "vegan", Ensalada: "salad", "Sopa/Crema": "soup or cream", Postre: "dessert" };

export function huecoTxt(dia, toma, lang) {
  const d = (lang === "en" ? DIAS_EN : DIAS_ES)[(parseInt(dia, 10) || 1) - 1] || "";
  if (lang === "en") return toma ? `${d}'s ${TOMA_EN[toma] || toma}` : d;
  return toma ? `${TOMA_ES[toma] || toma} del ${d}` : `el ${d}`;
}
// La pregunta de confirmación de una acción: aritmética y nombres, nunca consejo.
export function confirmarTxt(p, receta, ctx, lang) {
  const EN = lang === "en", r = receta ? `«${receta}»` : (EN ? "this recipe" : "esta receta");
  if (p.accion === "descartar") return EN ? `Shall I set ${r} aside? I won't offer it again when you swap recipes.` : `¿Aparto ${r}? No te la volveré a ofrecer al cambiar recetas.`;
  const extra = p.accion === "cambiar_sin" && p.ingrediente ? (EN ? ` without ${p.ingrediente}` : ` sin ${p.ingrediente}`)
    : p.tipo_receta ? " " + ((EN ? TIPO_EN : TIPO_ES)[p.tipo_receta] || p.tipo_receta) : "";
  return (EN ? `Shall I swap ${r} for another one from your plan${extra}? ` : `¿Te cambio ${r} por otra de tu plan${extra}? `) + costeTxt(ctx, lang);
}
// La respuesta del servidor → {mensajes:[{tx, firma}], fase, pend?, ir?, tema?, tomas?, base?, prellenar?}
export function pasoIA(r, ctx, lang, texto, filas = _BO_RESP) {
  const EN = lang === "en";
  const t = r && r.tipo;
  const msg = (tx, firma) => ({ tx, firma: firma || null });
  if (t === "dato") return { mensajes: [msg(r.texto || "")], fase: "temas" };
  if (t === "tema") {
    const f = (filas || []).find((x) => x.id === r.tema_id && valePlan(x, ctx));
    return f ? { tema: f } : pasoIA({ tipo: "alejandro" }, ctx, lang, texto, filas);
  }
  if (t === "accion") {
    const p = { tema: "ia", accion: r.accion, ingrediente: r.ingrediente || null, tipo_receta: r.tipo_receta || null };
    if (ctx?.contexto === "receta" && r.dia === ctx.dia && r.toma === ctx.toma) {
      if (p.accion === "cambiar_sin" && !p.ingrediente) return { mensajes: [], fase: "ingrediente", pend: p };
      return { mensajes: [msg(confirmarTxt(p, ctx.receta, ctx, lang))], fase: "confirmar", pend: p };
    }
    const h = huecoTxt(r.dia, r.toma, lang);
    const tx = r.receta ? (EN ? `That's ${h}: «${r.receta}».` : `Eso es ${h}: «${r.receta}».`) : (EN ? `Let's go to ${h}.` : `Vamos a ${h}.`);
    return { mensajes: [msg(tx)], fase: "ir", ir: { dia: r.dia, toma: r.toma, bo: { accion: p.accion, ingrediente: p.ingrediente, tipo_receta: p.tipo_receta } } };
  }
  if (t === "aclarar") return { mensajes: [msg(EN ? "Which meal?" : "¿De qué comida?")], fase: "aclarar", tomas: r.tomas || [], base: r };
  if (t === "no_en_plan") return { mensajes: [msg(EN ? `There is no ${huecoTxt(r.dia, r.toma, lang)} in this week's plan.` : `No tengo ${huecoTxt(r.dia, r.toma, lang)} en tu plan de esta semana.`)], fase: "temas" };
  if (t === "sensible") {
    const f = filaSistema("sensible", ctx, filas);
    const m = f ? msg(textoTema(f, ctx, lang, filas), firmaTema(f, ctx, filas))
      : msg(EN ? "A healthcare professional should see this in person. If it's urgent, call 112." : "Esto tiene que verlo un profesional sanitario en persona. Si es urgente, llama al 112.");
    return ctx?.plan === "premium" ? { mensajes: [m], fase: "abrir", pend: { tema: "sensible", destino: "consulta" } } : { mensajes: [m], fase: "temas" };
  }
  if (t === "fuera") return { mensajes: [msg(EN ? "I can only help with your plan and the app." : "Solo puedo ayudarte con tu plan y con la app.")], fase: "temas" };
  // «alejandro» (y cualquier cosa que no se reconozca): criterio del nutricionista
  if (puedeEscribir(ctx, filas))
    return { mensajes: [msg(EN ? "That's one for Alejandro: better that he answers it himself. Shall I send it to him?" : "Esto es criterio de Alejandro: mejor que te lo responda él. ¿Se lo mando?")], fase: "escribir", prellenar: texto || "" };
  return { mensajes: [msg(EN ? "That's a question for Alejandro." : "Esto es mejor preguntárselo a Alejandro.")], fase: "abrir", pend: { tema: "alejandro", destino: "consulta" } };
}
// Lo que viaja al servidor: la frase y los temas de esta pantalla (ids y texto del botón), nada más.
export function cuerpoIA(texto, ctx, temas, lang, hoy) {
  return { texto: String(texto || "").slice(0, 500), contexto: ctx?.contexto || "inicio", dia: ctx?.dia || null, toma: ctx?.toma || null,
           hoy: hoy || null, temas: (temas || []).map((f) => ({ id: f.id, boton: (f.boton && f.boton.es) || "" })), lang: lang === "en" ? "en" : "es" };
}
// Un error del servidor, en palabras de la app.
export function errorIA(status, detalle, lang) {
  const EN = lang === "en";
  if (status === 429) return EN ? "You've written a lot to Bo today. More tomorrow!" : "Por hoy ya me has escrito mucho. ¡Mañana más!";
  if (status === 403 && detalle === "sin_consentimiento") return null;      // la hoja vuelve a pedir el permiso
  return EN ? "I can't understand writing right now. Use the buttons or try again later." : "Ahora no puedo entender lo que escribes. Usa los botones o prueba en un rato.";
}

// ── Registro (tabla bo_registro: el uso y lo escrito) ──────────────────────────────
export function filaRegistro({ pid, tipo, contexto, tema, resultado, texto, sensible }) {
  const r = { profile_id: pid, tipo, contexto: contexto || null, tema: tema || null, resultado: resultado || null };
  if (tipo === "pregunta") { r.texto = String(texto || "").slice(0, 1000); r.sensible = !!sensible; }
  return r;
}
