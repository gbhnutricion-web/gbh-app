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
export function rellenar(s, ctx, lang) {
  return String(s || "")
    .replace(/\{raciones\}/g, String(parseInt(ctx?.raciones, 10) || 1))
    .replace(/\{coste\}/g, costeTxt(ctx, lang))
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

// ── Registro (tabla bo_registro: el uso y lo escrito) ──────────────────────────────
export function filaRegistro({ pid, tipo, contexto, tema, resultado, texto, sensible }) {
  const r = { profile_id: pid, tipo, contexto: contexto || null, tema: tema || null, resultado: resultado || null };
  if (tipo === "pregunta") { r.texto = String(texto || "").slice(0, 1000); r.sensible = !!sensible; }
  return r;
}
