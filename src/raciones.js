// ─── Raciones: qué cocinar y cuánto comer, dicho a la primera (17-sep-2026) ──────
// Pregunta de una paciente (16-sep) con dos pantallazos del plan:
//  · «Tu ración: x0,90 de la receta» se leía como una resta que tenía que hacer ELLA
//    («¿tenía que coger menos cantidad?»), cuando la lista ya es su ración.
//  · «Tu ración: ración y cuarto» + «Rinde 3 raciones» + «¿Cuántas raciones quieres
//    cocinar? x1» eran tres respuestas distintas a la misma pregunta.
// La regla de los datos no cambia: en una receta de N raciones la lista de ingredientes
// es la olla ENTERA y las kcal y los macros son de UNA ración (recetario, PDF y generador).
// Lo que cambia es que cada texto dice QUÉ HACER con la lista. Un solo sitio para las
// cuentas; los textos del recetario y de la lista de la compra siguen en TRANS (App.jsx).
// Tests: tests/raciones.test.mjs.

// Raciones que salen de la lista que se PINTA: las de la receta por el «x2/x3» del
// selector «¿Cuántas raciones quieres cocinar?».
export const racionesDeLaLista = (raciones = 1, x = 1) =>
  Math.max(1, parseInt(raciones, 10) || 1) * Math.max(1, parseInt(x, 10) || 1);

// Ajuste del generador en porcentaje (0,90 → 90). null si no hay ajuste que contar.
export const porcentajeRacion = (factor) => {
  const f = parseFloat(factor);
  if (!(f > 0)) return null;
  const p = Math.round(f * 100);
  return p === 100 ? null : p;
};

// Coste de UNA ración: la lista de una receta de varias raciones es la olla entera
// (el recetario y el PDF ya dividían; la ficha del plan no lo hacía).
export const costePorRacion = (total, raciones = 1) => {
  const n = Math.max(1, parseInt(raciones, 10) || 1);
  return total > 0 ? Math.round((total / n) * 100) / 100 : 0;
};

// Caja dorada de la ficha del plato (Plan → toma). null = nada que avisar: receta de
// 1 ración servida tal cual.
export function textosCajaRacion({ raciones = 1, factor = 1, racionTexto = '', lang = 'es' } = {}) {
  const EN = lang === 'en';
  const n = Math.max(1, parseInt(raciones, 10) || 1);
  if (n > 1) return {
    icono: '🍲',
    titulo: EN ? `Recipe for ${n} servings: you eat 1` : `Receta para ${n} raciones: tú comes 1`,
    detalle: EN
      ? `Cook the whole list and split it into ${n} equal plates. The kcal and macros below are for 1 plate.`
      : `Cocina toda la lista y repártela en ${n} platos iguales. Las kcal y los macros de abajo son de 1 plato.`,
  };
  if (!racionTexto) return null;   // mismo disparador que antes: el plan trae ajuste (el generador solo
                                   // escala si se aleja ≥ 5 % de 1, así que nunca llega un 100 %)
  const p = porcentajeRacion(factor);
  // Sin factor legible (plan antiguo con texto y sin número) se enseña el texto del generador.
  const ajuste = p !== null ? (EN ? `${p} % of the original recipe` : `${p} % de la receta original`) : racionTexto;
  return {
    icono: '⚖️',
    titulo: EN ? 'Your portion is already worked out' : 'Tu ración ya está calculada',
    detalle: EN
      ? `Amounts and kcal adjusted to your plan (${ajuste}). Cook and eat what it says, as it is.`
      : `Cantidades y kcal ajustadas a tu plan (${ajuste}). Cocina y come lo que pone, tal cual.`,
  };
}
