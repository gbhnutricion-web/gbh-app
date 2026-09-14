// Casos de tests/kcalDia.test.mjs (node:test) y del arnés en navegador: un solo sitio.
// Un plan de ejemplo del miércoles (día 3) con menú compuesto en la comida.
export const DIA = 3;
export const PLAN = {
  Desayuno: { '3': { Nombre_Receta: 'Porridge de avena con plátano', Calorias_Totales: '520', Proteinas_g: '18', Hidratos_g: '78', Grasas_g: '14' } },
  Almuerzo: { '3': { Nombre_Receta: 'Yogur griego con nueces', Calorias_Totales: 260, Proteinas_g: 12, Hidratos_g: 14, Grasas_g: 17 } },
  Comida:   { '3': { Nombre_Receta: 'Menú: crema + merluza', compuesta: true, etiquetas: ['1º', '2º'], Calorias_Totales: 640, Proteinas_g: 42, Hidratos_g: 76, Grasas_g: 16,
                     platos: [{ Nombre_Receta: 'Crema de calabacín', Calorias_Totales: 180, Proteinas_g: 6, Hidratos_g: 14, Grasas_g: 11 },
                              { Nombre_Receta: 'Merluza al horno', Calorias_Totales: 460, Proteinas_g: 36, Hidratos_g: 62, Grasas_g: 5 }] } },
  Merienda: { '3': { Nombre_Receta: 'Tostada de crema de cacahuete', Calorias_Totales: 310, Proteinas_g: 10, Hidratos_g: 36, Grasas_g: 14 } },
  Cena:     { '3': { Nombre_Receta: 'Merluza con patata', Calorias_Totales: 420, Proteinas_g: 36, Hidratos_g: 34, Grasas_g: 14 } },
  // Un día sin cena (patrón de 4 tomas), para el recuento de planificadas.
  Postre:   {},
};
// Menú compuesto SIN totales en la celda: se suman los platos.
export const PLAN_SIN_TOTALES = {
  Comida: { '3': { Nombre_Receta: 'Menú', compuesta: true, platos: [{ Calorias_Totales: 180, Proteinas_g: 6, Hidratos_g: 14, Grasas_g: 11 }, { Calorias_Totales: 460, Proteinas_g: 36, Hidratos_g: 62, Grasas_g: 5 }] } },
};

// Cada caso: meals (estados), real (detalle), y lo que se espera del resumen.
export const CASOS = [
  { nombre: 'sin registros', meals: {}, real: {},
    esperado: { previstoKcal: 2150, realKcal: 0, registradas: 0, sinCuantificar: 0, pendientesKcal: 2150, completo: false, frase: /Marca tus comidas/ } },
  { nombre: 'seguida = previsto', meals: { Desayuno: 'seguida' }, real: {},
    esperado: { realKcal: 520, realP: 18, registradas: 1, pendientesKcal: 1630, frase: /te quedan ~1\.630 kcal previstas/ } },
  { nombre: 'menos sin fracción = mitad', meals: { Almuerzo: 'menos' }, real: {},
    esperado: { realKcal: 130, realP: 6, registradas: 1 } },
  { nombre: 'menos con ¼', meals: { Almuerzo: 'menos' }, real: { Almuerzo: { frac: 0.25 } },
    esperado: { realKcal: 65, realG: 4.25 } },
  { nombre: 'menos con fracción inválida = mitad', meals: { Almuerzo: 'menos' }, real: { Almuerzo: { frac: 0.6 } },
    esperado: { realKcal: 130 } },
  { nombre: 'saltada = 0 y cuenta como registrada', meals: { Cena: 'saltada' }, real: {},
    esperado: { realKcal: 0, registradas: 1, conocidas: 1, sinCuantificar: 0 } },
  { nombre: 'cambiada sin detalle = ?', meals: { Comida: 'cambiada' }, real: {},
    esperado: { realKcal: 0, registradas: 1, sinCuantificar: 1, frase: /al menos 0 kcal · 1 comida sin cuantificar/ } },
  { nombre: 'fuera con detalle (fase 2)', meals: { Comida: 'fuera' }, real: { Comida: { conocido: true, kcal: 750, p: 39.5, h: 65, g: 24.1 } },
    esperado: { realKcal: 750, realP: 39.5, sinCuantificar: 0, sinMacros: 0 } },
  { nombre: 'ítem libre sin macros', meals: { Comida: 'cambiada' }, real: { Comida: { conocido: true, kcal: 600, conMacros: false } },
    esperado: { realKcal: 600, realP: 0, sinMacros: 1 } },
  { nombre: 'día completo por encima', meals: { Desayuno: 'seguida', Almuerzo: 'seguida', Comida: 'fuera', Merienda: 'seguida', Cena: 'seguida' }, real: { Comida: { conocido: true, kcal: 900, p: 40, h: 80, g: 40 } },
    esperado: { realKcal: 2410, completo: true, frase: /hoy: 2\.410 kcal · \+260 sobre lo previsto/ } },
  { nombre: 'día completo por debajo', meals: { Desayuno: 'seguida', Almuerzo: 'saltada', Comida: 'seguida', Merienda: 'menos', Cena: 'seguida' }, real: {},
    esperado: { realKcal: 1735, completo: true, frase: /hoy: 1\.735 kcal, 415 menos de lo previsto/ } },
  { nombre: 'a medias y ya por encima', meals: { Desayuno: 'fuera' }, real: { Desayuno: { conocido: true, kcal: 2300, p: 1, h: 1, g: 1 } },
    esperado: { realKcal: 2300, frase: /te quedan ~1\.630 kcal previstas · \+150 sobre lo previsto/ } },
  // ── fase 2: ítems y extras ──
  { nombre: 'cambiada con ítems: ½ receta + 2 huevos', meals: { Comida: 'cambiada' },
    real: { Comida: { conocido: true, items: [{ t: 'rec', n: 'Pasta con pollo', kcal: 610, p: 38, h: 55, g: 24, q: 0.5 }, { t: 'ing', n: 'Huevos', k: 144.9, p: 12.5, h: 0.3, g: 10.5, u: 'huevo', ug: 55, q: 2 }] } },
    esperado: { realKcal: 464.39, realP: 32.75, sinCuantificar: 0, sinMacros: 0 } },
  { nombre: 'ítems mandan sobre el total guardado', meals: { Comida: 'fuera' },
    real: { Comida: { conocido: true, kcal: 999, items: [{ t: 'libre', n: 'menú del día', kcal: 700 }] } },
    esperado: { realKcal: 700, sinMacros: 1 } },
  { nombre: 'extras sobre seguida: 3 cañas', meals: { Desayuno: 'seguida' },
    real: { Desayuno: { extras: [{ t: 'ing', n: 'Cerveza', k: 42.2, p: 0.5, h: 3.1, g: 0, u: 'caña', ug: 200, q: 3 }] } },
    esperado: { realKcal: 773.2, realP: 21, registradas: 1 } },
  { nombre: 'extras sobre «?»: cuentan en el día, la toma sigue sin cuantificar', meals: { Cena: 'fuera' },
    real: { Cena: { conocido: false, extras: [{ t: 'libre', n: 'postre', kcal: 100 }] } },
    esperado: { realKcal: 100, sinCuantificar: 1, frase: /al menos 100 kcal · 1 comida sin cuantificar/ } },
  { nombre: 'alimento en gramos libres (ug=1)', meals: { Merienda: 'cambiada' },
    real: { Merienda: { conocido: true, items: [{ t: 'ing', n: 'Plátano', k: 89, p: 1.1, h: 23, g: 0.3, u: 'g', ug: 1, q: 150 }] } },
    esperado: { realKcal: 133.5 } },
  // ── 14-sep-2026: ➕ «Añadí» suma sobre lo previsto; 🔄 «La cambié» (clave 'fuera') sustituye ──
  { nombre: 'añadí: la receta + un postre a mano', meals: { Cena: 'anadida' }, real: { Cena: { conocido: true, items: [{ t: 'libre', n: 'postre', kcal: 150 }] } },
    esperado: { realKcal: 570, registradas: 1, sinCuantificar: 0, sinMacros: 1 } },
  { nombre: 'añadí sin ítems todavía = la receta tal cual', meals: { Cena: 'anadida' }, real: {},
    esperado: { realKcal: 420, realP: 36, conocidas: 1, sinCuantificar: 0 } },
  { nombre: 'añadí con 2 huevos: macros se suman', meals: { Desayuno: 'anadida' }, real: { Desayuno: { items: [{ t: 'ing', n: 'Huevos', k: 144.9, p: 12.5, h: 0.3, g: 10.5, u: 'huevo', ug: 55, q: 2 }] } },
    esperado: { realKcal: 679.39, realP: 31.75, sinMacros: 0 } },
];

export const FRASES_EN = [
  { meals: {}, real: {}, frase: /Log your meals/ },
  { meals: { Comida: 'cambiada' }, real: {}, frase: /at least 0 kcal · 1 meal not quantified/ },
];
