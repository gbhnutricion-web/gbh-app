// ─── Ventana de medición (orden de Alejandro, 15-sep-2026) ─────────────────────
// El peso y las medidas corporales (perímetros y pliegues) se registran los MIÉRCOLES y
// el FIN DE SEMANA (sábado y domingo). Antes: el peso solo el fin de semana y las medidas
// cualquier día. Así hay dos puntos por semana, a mitad y al final, y el pesaje diario
// (ansiedad sin información) sigue fuera. Un solo sitio para la regla: la leen App.jsx
// (pestaña Peso, banner, guardado) y MedidasCorporales.jsx (botón y guardado).
// Tests: tests/ventanaMedicion.test.mjs.
export const DIAS_MEDICION = [3, 6, 0];        // getDay(): 0 = domingo · 3 = miércoles · 6 = sábado

export const esDiaDeMedicion = (hoy = new Date()) => DIAS_MEDICION.includes(hoy.getDay());

// Clave de día en hora LOCAL (YYYY-MM-DD), idéntica a toKey de App.jsx.
export const claveDia = (d) => `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;

// Claves de la ventana EN CURSO: el miércoles es una ventana de un día; sábado y domingo
// son UNA ventana (anclada al lunes de la semana actual, como antes: el pesaje del finde
// se edita el domingo, no se duplica). Fuera de ventana, lista vacía.
export function ventanaKeys(hoy = new Date()) {
  const dow = hoy.getDay();
  if (dow === 3) return [claveDia(hoy)];
  if (dow === 6 || dow === 0) {
    const monOffset = dow === 0 ? 6 : dow - 1;
    const lunes = new Date(hoy); lunes.setDate(hoy.getDate() - monOffset);
    const sab = new Date(lunes); sab.setDate(lunes.getDate() + 5);
    const dom = new Date(lunes); dom.setDate(lunes.getDate() + 6);
    return [claveDia(sab), claveDia(dom)];
  }
  return [];
}

// Nombre del próximo día de medición, para los textos («Vuelve el miércoles»).
export function proximoDiaMedicion(hoy = new Date(), lang = 'es') {
  const dow = hoy.getDay();
  const es = lang === 'es';
  if (dow === 1 || dow === 2) return es ? 'el miércoles' : 'on Wednesday';
  if (dow === 4 || dow === 5) return es ? 'el sábado' : 'on Saturday';
  return es ? 'hoy' : 'today';
}
