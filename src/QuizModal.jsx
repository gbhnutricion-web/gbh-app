// ─── Quiz diario ─────────────────────────────────────────────────────────────
// Sacado de App.jsx el 10-nov-2026 TAL CUAL (MAESTRO-2026-1238): los dos bancos de preguntas
// (QUIZ_BANK y QUIZ_RECETARIO, ~45 KB) y el modal se cargan al abrir el quiz, no con la app.
// El orden del banco combinado no cambia: la pregunta de cada día es la misma.
import React, { useState, useEffect, useCallback, useMemo, useRef } from "react";
import { SFX, T, alpha, getQuizFact, getQuizOpts, getQuizQ } from "./App.jsx";

const QUIZ_BANK = [
  {q:"¿Cuántas calorías tiene aproximadamente 100g de pechuga de pollo a la plancha?",q_en:"How many calories does 100g of grilled chicken breast have?",opts:["85 kcal","165 kcal","240 kcal","310 kcal"],ans:1},
  {q:"¿Qué macronutriente proporciona más energía por gramo?",q_en:"Which macronutrient provides the most energy per gram?",opts:["Proteína (4 kcal/g)","Hidratos (4 kcal/g)","Grasa (9 kcal/g)","Fibra (2 kcal/g)"],opts_en:["Protein (4 kcal/g)","Carbs (4 kcal/g)","Fat (9 kcal/g)","Fibre (2 kcal/g)"],ans:2},
  {q:"¿Cuál de estos alimentos tiene más proteína por 100g?",q_en:"Which of these foods has the most protein per 100g?",opts:["Huevo entero","Atún en lata","Leche entera","Yogur natural"],opts_en:["Whole egg","Canned tuna","Whole milk","Natural yogurt"],ans:1},
  {q:"¿Qué vitamina produce el cuerpo con la exposición al sol?",q_en:"Which vitamin does the body produce with sun exposure?",opts:["Vitamina A","Vitamina B12","Vitamina C","Vitamina D"],opts_en:["Vitamin A","Vitamin B12","Vitamin C","Vitamin D"],ans:3},
  {q:"¿Cuántos vasos de agua equivalen aproximadamente a 2 litros?",q_en:"How many glasses of water equal approximately 2 litres?",opts:["4 vasos","6 vasos","8 vasos","10 vasos"],opts_en:["4 glasses","6 glasses","8 glasses","10 glasses"],ans:2},
  {q:"¿Cuál de estos alimentos tiene el índice glucémico más bajo?",q_en:"Which of these foods has the lowest glycaemic index?",opts:["Pan blanco","Arroz blanco","Legumbres","Sandía"],opts_en:["White bread","White rice","Legumes","Watermelon"],ans:2},
  {q:"¿Qué porcentaje del cuerpo humano es agua aproximadamente?",q_en:"What percentage of the human body is approximately water?",opts:["40%","55-60%","75-80%","90%"],ans:1},
  {q:"¿Cuántas kcal tiene 1 gramo de alcohol?",q_en:"How many kcal does 1 gram of alcohol have?",opts:["4 kcal","5 kcal","7 kcal","9 kcal"],ans:2},
  {q:"¿Cuál es la principal función de los hidratos de carbono?",q_en:"What is the main function of carbohydrates?",opts:["Construir músculo","Proporcionar energía rápida","Regular el sistema inmune","Transportar vitaminas"],opts_en:["Build muscle","Provide quick energy","Regulate the immune system","Transport vitamins"],ans:1},
  {q:"¿Qué alimento es rico en omega-3?",q_en:"Which food is rich in omega-3?",opts:["Aceite de girasol","Salmón","Carne de cerdo","Queso curado"],opts_en:["Sunflower oil","Salmon","Pork","Aged cheese"],ans:1},
  {q:"¿Cuántas calorías tiene aproximadamente 1 cucharada de aceite de oliva?",q_en:"How many calories does approximately 1 tablespoon of olive oil have?",opts:["50 kcal","90 kcal","120 kcal","150 kcal"],ans:1},
  {q:"¿Cuál de estos es un ejemplo de proteína completa?",q_en:"Which of these is an example of a complete protein?",opts:["Arroz","Lentejas","Huevo","Pan"],opts_en:["Rice","Lentils","Egg","Bread"],ans:2},
  {q:"¿Qué mineral es esencial para la salud ósea?",q_en:"Which mineral is essential for bone health?",opts:["Hierro","Zinc","Calcio","Magnesio"],opts_en:["Iron","Zinc","Calcium","Magnesium"],ans:2},
  {q:"¿Cuántas calorías tiene 100g de aguacate?",q_en:"How many calories does 100g of avocado have?",opts:["80 kcal","160 kcal","250 kcal","320 kcal"],ans:1},
  {q:"¿Qué es el metabolismo basal?",q_en:"What is basal metabolic rate?",opts:["Calorías quemadas haciendo ejercicio","Calorías mínimas para funciones vitales en reposo","Velocidad de digestión","Absorción de nutrientes"],opts_en:["Calories burned during exercise","Minimum calories for vital functions at rest","Speed of digestion","Nutrient absorption"],ans:1},
  {q:"¿Cuál de estos cereales tiene más fibra?",q_en:"Which of these cereals has the most fibre?",opts:["Arroz blanco","Maíz","Avena","Trigo refinado"],opts_en:["White rice","Corn","Oats","Refined wheat"],ans:2},
  {q:"¿En qué alimento hay más hierro por 100g?",q_en:"Which food has the most iron per 100g?",opts:["Lentejas","Espinacas","Hígado de ternera","Almejas"],opts_en:["Lentils","Spinach","Veal liver","Clams"],ans:3},
  {q:"¿Cuántas calorías tiene 100g de plátano?",q_en:"How many calories does 100g of banana have?",opts:["55 kcal","89 kcal","120 kcal","145 kcal"],ans:1},
  {q:"¿Qué vitamina es fundamental para la absorción del hierro?",q_en:"Which vitamin is key for iron absorption?",opts:["Vitamina A","Vitamina B6","Vitamina C","Vitamina K"],opts_en:["Vitamin A","Vitamin B6","Vitamin C","Vitamin K"],ans:2},
  {q:"¿Cuántas horas sin comer se considera ayuno intermitente básico?",q_en:"How many hours without eating is considered basic intermittent fasting?",opts:["8 horas","12 horas","16 horas","24 horas"],opts_en:["8 hours","12 hours","16 hours","24 hours"],ans:2},
  {q:"¿Cuál de estos NO es un aminoácido esencial?",q_en:"Which of these is NOT an essential amino acid?",opts:["Leucina","Valina","Alanina","Lisina"],opts_en:["Leucine","Valine","Alanine","Lysine"],ans:2},
  {q:"¿Cuántas calorías tiene 100g de almendras?",q_en:"How many calories does 100g of almonds have?",opts:["350 kcal","460 kcal","580 kcal","700 kcal"],ans:2},
  {q:"¿Qué hormona regula el azúcar en sangre?",q_en:"Which hormone regulates blood sugar?",opts:["Cortisol","Insulina","Adrenalina","Melatonina"],opts_en:["Cortisol","Insulin","Adrenaline","Melatonin"],ans:1},
  {q:"¿Cuál es la temperatura interna segura para cocinar pollo?",q_en:"What is the safe internal temperature for cooking chicken?",opts:["60°C","70°C","74°C","85°C"],ans:2},
  {q:"¿Cuántos gramos de proteína necesita aproximadamente una persona activa por kg de peso?",q_en:"How many grams of protein does an active person need per kg of body weight?",opts:["0.4-0.6g","0.8-1.2g","1.6-2.2g","3-4g"],ans:2},
  {q:"¿Cuál de estos alimentos tiene más potasio?",q_en:"Which of these foods has the most potassium?",opts:["Plátano","Naranja","Espinacas","Patata cocida"],opts_en:["Banana","Orange","Spinach","Boiled potato"],ans:3},
  {q:"¿Qué proceso ocurre durante el sueño en relación a los músculos?",q_en:"What process occurs during sleep in relation to muscles?",opts:["Se pierden","Se sintetiza proteína muscular","Se quema grasa muscular","No pasa nada"],opts_en:["They are lost","Muscle protein is synthesised","Muscle fat is burned","Nothing happens"],ans:1},
  {q:"¿Cuántas calorías tiene 100g de pasta cocida?",q_en:"How many calories does 100g of cooked pasta have?",opts:["80 kcal","131 kcal","200 kcal","260 kcal"],ans:1},
  {q:"¿Cuál de estos tiene menos azúcar?",q_en:"Which of these has the least sugar?",opts:["Zumo de naranja natural","Naranja entera","Refresco light","Yogur con frutas"],opts_en:["Fresh orange juice","Whole orange","Diet soft drink","Fruit yogurt"],ans:1},
  {q:"¿Qué significa IMC?",q_en:"What does BMI stand for?",opts:["Índice de Masa Corporal","Ingesta Máxima Calórica","Índice Metabólico Corporal","Ingesta Mínima de Carbohidratos"],opts_en:["Body Mass Index","Maximum Caloric Intake","Metabolic Body Index","Minimum Carbohydrate Intake"],ans:0},
];

const QUIZ_RECETARIO = [
  {q:'¿Cuál de estos platos del recetario GBH tiene más proteínas?',opts:['Espaguetis a la marinera','Hamburguesa vegana de soja texturizada','Ensalada verde con vinagreta de mostaza y miel','Guiso de patata y bacalao'],ans:3,fact:'Guiso de patata y bacalao · 42g prot'},
  {q:'¿Cuál de estos platos del recetario GBH tiene más proteínas?',opts:['Arroz con mejillones','Ensalada de pollo y aguacate','Salteado de pollo con verduras al wok','Pastel de patata'],ans:1,fact:'Ensalada de pollo y aguacate · 60g prot'},
  {q:'¿Cuál de estos platos del recetario GBH tiene más grasas?',opts:['Pollo con almendras','Ensalada de salmón con frutas','Caldereta de cordero','Crema de zanahorias'],ans:2,fact:'Caldereta de cordero · 28g grasa'},
  {q:'¿Cuál de estos platos del recetario GBH tiene más calorías?',opts:['Bocadillo de tortilla francesa vegano','Tortilla de patata y calabacín','Sopa de fresas','Merluza con pimientos del piquillo'],ans:0,fact:'Bocadillo de tortilla francesa vegano · 845kcal'},
  {q:'¿Cuál de estos platos del recetario GBH tiene más proteínas?',opts:['Ensalada de pavo y naranja','Tortilla de berenjenas queso y pimiento','Espuma de frutos congelados','Sorbete de frutas (melocoton)'],ans:0,fact:'Ensalada de pavo y naranja · 24g prot'},
  {q:'¿Cuál de estos platos del recetario GBH tiene más grasas?',opts:['Tarta de queso calórica','Quesadilla vegana','Guiso marinero','Sopa de quinoa'],ans:0,fact:'Tarta de queso calórica · 50g grasa'},
  {q:'¿Cuál de estos platos del recetario GBH tiene más grasas?',opts:['Crema cuajada de leche y queso','Tostada con Huevo y Queso Gratinado','Ensaladilla de pollo y aguacate','Guiso de merluza y gambas'],ans:0,fact:'Crema cuajada de leche y queso · 47g grasa'},
  {q:'¿Cuál de estos platos del recetario GBH tiene más hidratos de carbono?',opts:['Ensalada de pollo con arroz y mango','Ensalada de pollo con aguacate','Tortilla de atún','Bowl ensalada vegana taco'],ans:3,fact:'Bowl ensalada vegana taco · 77g HC'},
  {q:'¿Cuál de estos platos del recetario GBH tiene más calorías?',opts:['Bol de kiwi, rúcula y avena','Pavo salteado con calabacín','Tostada con Revuelto de Tofu y Aguacate','Ensalada de cogollos y espárragos'],ans:0,fact:'Bol de kiwi, rúcula y avena · 815kcal'},
  {q:'¿Cuál de estos platos del recetario GBH tiene más grasas?',opts:['Triángulos de maíz con carne','Huevos revueltos con champiñones','Carbonara vegetariana','Guiso marinero'],ans:0,fact:'Triángulos de maíz con carne · 25g grasa'},
  {q:'¿Cuál de estos platos del recetario GBH tiene más grasas?',opts:['Pimientos rellenos de bacalao con sticks de zanahoria','Milhoja de merengue','Falsa lasaña de merluza y verduras','Tosta de aguacate con anchoa y tomate'],ans:3,fact:'Tosta de aguacate con anchoa y tomate · 30g grasa'},
  {q:'¿Cuál de estos platos del recetario GBH tiene más hidratos de carbono?',opts:['Olla gitana','Pan de manzana','Mousse de mango y coco vegano','Tostada de Pera y Queso Roquefort'],ans:1,fact:'Pan de manzana · 77.7g HC'},
  {q:'¿Cuál de estos platos del recetario GBH tiene más hidratos de carbono?',opts:['Guiso de alubias blancas y verduras','Ensalada crujiente de garbanzos y boniato','Gachas de avena con manzana','Berenjena con relleno vegano de soja o tofu'],ans:1,fact:'Ensalada crujiente de garbanzos y boniato · 91g HC'},
  {q:'¿Cuál de estos platos del recetario GBH tiene más calorías?',opts:['Budin de limon y coco','Tostadas con jamón y queso','Merluza al horno con patata','Pastel de patata'],ans:1,fact:'Tostadas con jamón y queso · 690kcal'},
  {q:'¿Cuál de estos platos del recetario GBH tiene más proteínas?',opts:['Gelatina de naranja','Yogur proteico con plátano y almendras','Ensalada parrillada','Tostada Proteica con Crema de Almendra'],ans:3,fact:'Tostada Proteica con Crema de Almendra · 28g prot'},
  {q:'¿Cuál de estos platos del recetario GBH tiene más calorías?',opts:['Pizza de yuca','Falsa lasaña de merluza y verduras','Wrap de vegetales','Garbanzos con almejas'],ans:0,fact:'Pizza de yuca · 501kcal'},
  {q:'¿Cuál de estos platos del recetario GBH tiene más proteínas?',opts:['Alcachofas con jamón y huevo','Brochetas de rape con tomate y pimiento','Manzana asada','Seitán con salsa de champiñones'],ans:3,fact:'Seitán con salsa de champiñones · 31g prot'},
  {q:'¿Cuál de estos platos del recetario GBH tiene más grasas?',opts:['Sopa de quinoa y verduras vegana','Ensalada de aguacate y quinoa','Bacalao con salsa de pimiento y tomate','Tostada con Plátano y Canela'],ans:1,fact:'Ensalada de aguacate y quinoa · 23g grasa'},
  {q:'¿Cuál de estos platos del recetario GBH tiene más grasas?',opts:['Escalopes de ternera','Merluza a la plancha con ensalada','Ensalada de coliflor','Ensalada de naranjas'],ans:0,fact:'Escalopes de ternera · 30g grasa'},
  {q:'¿Cuál de estos platos del recetario GBH tiene más grasas?',opts:['Tostada de Pera y Queso Roquefort','Mousse de melon','Garbanzos con marisco','Ensalada de lentejas y aguacate'],ans:3,fact:'Ensalada de lentejas y aguacate · 42g grasa'},
  {q:'¿Cuál de estos platos del recetario GBH tiene más calorías?',opts:['Sepia con alubias y almejas','Pasta con pollo y verduras','Rollitos de chocolate y almendra','Arroz con pollo'],ans:2,fact:'Rollitos de chocolate y almendra · 700kcal'},
  {q:'¿Cuál de estos platos del recetario GBH tiene más proteínas?',opts:['Garbanzos con tomate y espinacas','Pudin de pan','Pavo con champiñones y arroz','Panache de verduras'],ans:2,fact:'Pavo con champiñones y arroz · 37g prot'},
  {q:'¿Cuál de estos platos del recetario GBH tiene más proteínas?',opts:['Copa de yogur con helado y galleta','Batido de mango y proteína','Estofado vegano de soja texturizada','Crêpes con salsa de arándanos'],ans:1,fact:'Batido de mango y proteína · 27g prot'},
  {q:'¿Cuál de estos platos del recetario GBH tiene más proteínas?',opts:['Guiso de patatas con champiñones','Sorbete de merengue','Lentejas estofadas rápidas','Fabada vegana'],ans:3,fact:'Fabada vegana · 36g prot'},
  {q:'¿Cuál de estos platos del recetario GBH tiene más grasas?',opts:['Crema de alubia blanca y sésamo','Gelatina de naranja','Tostadas con jamón y queso','Ensalada mixta'],ans:2,fact:'Tostadas con jamón y queso · 50g grasa'},
  {q:'¿Cuál de estos platos del recetario GBH tiene más proteínas?',opts:['Patatas guisadas con cerdo','Wok de pollo y verduras','Pasta vegana','Pasta amatriciana'],ans:1,fact:'Wok de pollo y verduras · 60.9g prot'},
  {q:'¿Cuál de estos platos del recetario GBH tiene más hidratos de carbono?',opts:['Tostada de Paté de Hígado','Salteado de gambas y verduras','Patatas guisadas con cerdo','Merluza a la plancha con ensalada'],ans:2,fact:'Patatas guisadas con cerdo · 35g HC'},
  {q:'¿Cuál de estos platos del recetario GBH tiene más proteínas?',opts:['Ensalada de judías verdes con jamón','Mero con cebollitas y zanahoria al microondas','Berenjena con relleno vegano de soja o tofu','Ensalada de pavo y naranja'],ans:1,fact:'Mero con cebollitas y zanahoria al microondas · 38g prot'},
  {q:'¿Cuál de estos platos del recetario GBH tiene más calorías?',opts:['Pasta con setas','Pasta integral con pollo y brócoli','Crema de verduras y legumbres','Lentejas estofadas rápidas'],ans:1,fact:'Pasta integral con pollo y brócoli · 718kcal'},
  {q:'¿Cuál de estos platos del recetario GBH tiene más hidratos de carbono?',opts:['Platano y pina gratinados','Bol de papaya y requesón','Ensalada de champiñones','Tortitas de claras y avena'],ans:3,fact:'Tortitas de claras y avena · 36g HC'},
  {q:'¿Cuál de estos platos del recetario GBH tiene más calorías?',opts:['Crema de calabacines','Tostada de Dátiles con Miel','Brochetas veganas','Tostada con Ricotta y Pera Caramelizada'],ans:1,fact:'Tostada de Dátiles con Miel · 471kcal'},
  {q:'¿Cuál de estos platos del recetario GBH tiene más hidratos de carbono?',opts:['Pimientos rellenos al horno','Arroz con mejillones','Pizza de yuca','Mousse de melocoton'],ans:1,fact:'Arroz con mejillones · 65g HC'},
  {q:'¿Cuál de estos platos del recetario GBH tiene más grasas?',opts:['Ensalada de kale','Sándwich de garbanzos y aguacate','Merluza al horno con gambas','Pad thai vegano'],ans:0,fact:'Ensalada de kale · 33g grasa'},
  {q:'¿Cuál de estos platos del recetario GBH tiene más proteínas?',opts:['Ensalada california','Tostada de Jamón Serrano con Tortilla de Huevo','Gachas de avena con manzana','Pisto con huevo'],ans:2,fact:'Gachas de avena con manzana · 20g prot'},
  {q:'¿Cuál de estos platos del recetario GBH tiene más grasas?',opts:['Calamares rellenos de gambas y berenjena','Ensalada de patata','Ensalada de lentejas y mango','Tortitas de plátano y avena'],ans:2,fact:'Ensalada de lentejas y mango · 28g grasa'},
  {q:'¿Cuál de estos platos del recetario GBH tiene más hidratos de carbono?',opts:['Gelatina de naranja','Ensalada de brócoli y manzana','Revuelto de gulas y champiñones','Mousse de mango y coco vegano'],ans:0,fact:'Gelatina de naranja · 94.3g HC'},
  {q:'¿Cuál de estos platos del recetario GBH tiene más grasas?',opts:['Ensalada de espinacas con salsa miel y mostaza','Wrap de vegetales','Flan de coco','Pasta vegana'],ans:2,fact:'Flan de coco · 34g grasa'},
  {q:'¿Cuál de estos platos del recetario GBH tiene más calorías?',opts:['Risotto con champiñones y bacon','Ensalada de cogollos y espárragos','Fabada vegana','Ensalada de arroz chino'],ans:0,fact:'Risotto con champiñones y bacon · 896kcal'},
  {q:'¿Cuál de estos platos del recetario GBH tiene más grasas?',opts:['Tortilla dulce de frutos rojos','Sopa de quinoa y verduras vegana','Pudin de pan','Gachas de avena con manzana'],ans:3,fact:'Gachas de avena con manzana · 19g grasa'},
  {q:'¿Cuál de estos platos del recetario GBH tiene más proteínas?',opts:['Tortilla dulce de frutos rojos','Albóndigas de pollo con arroz al curry','Sándwich vegetal con jamón y queso','Tostada de Paté de Hígado'],ans:1,fact:'Albóndigas de pollo con arroz al curry · 54.1g prot'},
  {q:'¿Cuál de estos platos del recetario GBH tiene más proteínas?',opts:['Ensalada de gourmet','Rollitos de pollo con pimiento del piquillo y queso','Sopa crema de calabaza','Crema de yogur'],ans:1,fact:'Rollitos de pollo con pimiento del piquillo y queso · 36g prot'},
  {q:'¿Cuál de estos platos del recetario GBH tiene más grasas?',opts:['Ensalada caprese con melocotón','Helado de fresas','Arroz con leche','Hamburguesa vegana de soja texturizada'],ans:0,fact:'Ensalada caprese con melocotón · 16g grasa'},
  {q:'¿Cuál de estos platos del recetario GBH tiene más calorías?',opts:['Carbonara vegetariana','Espuma de frutos congelados','Minestrone','Merluza al horno con patata'],ans:2,fact:'Minestrone · 627kcal'},
  {q:'¿Cuál de estos platos del recetario GBH tiene más hidratos de carbono?',opts:['Tostada de aguacate y huevo','Helado de frambuesa','Tortitas de avena veganas','Alubias con pulpo'],ans:2,fact:'Tortitas de avena veganas · 70g HC'},
  {q:'¿Cuál de estos platos del recetario GBH tiene más proteínas?',opts:['Olla gitana','Pimientos rellenos al horno','Pollo con pesto rosso de tomates secos','Guisantes con tomate seco veganos'],ans:2,fact:'Pollo con pesto rosso de tomates secos · 38g prot'},
  {q:'¿Cuál de estos platos del recetario GBH tiene más hidratos de carbono?',opts:['Power bowl vegano con soja texturizada, boniato y guacamole','Flan de verduras','Guiso de pescado y marisco','Tortilla de coliflor'],ans:0,fact:'Power bowl vegano con soja texturizada, boniato y guacamole · 65g HC'},
  {q:'¿Cuál de estos platos del recetario GBH tiene más grasas?',opts:['Gazpacho andaluz','Calamares a la riojana','Ensalada verde','Tostada con Revuelto de Tofu y Aguacate'],ans:2,fact:'Ensalada verde · 20g grasa'},
  {q:'¿Cuál de estos platos del recetario GBH tiene más grasas?',opts:['Ensalada de pollo con mango y aguacate','Lasaña de pollo y acelgas','Mousse de pera y kiwi','Crêpes con jamón y queso'],ans:3,fact:'Crêpes con jamón y queso · 30g grasa'},
  {q:'¿Cuál de estos platos del recetario GBH tiene más grasas?',opts:['Ensalada de quinoa y atún','Platano y pina gratinados','Solomillo de cerdo con espárragos','Pollo con salsa de frutos rojos y yuca'],ans:0,fact:'Ensalada de quinoa y atún · 26g grasa'},
  {q:'¿Cuál de estos platos del recetario GBH tiene más proteínas?',opts:['Salmón al horno con espárragos','Natillas de mandarina','Ensalada de mango y arroz','Samosas de morcilla y manzana'],ans:0,fact:'Salmón al horno con espárragos · 32g prot'},
  {q:'¿Cuál de estos platos del recetario GBH tiene más hidratos de carbono?',opts:['Ensalada de kale','Burritos con boloñesa vegana','Tartar de atún','Berenjena con relleno vegano de soja o tofu'],ans:1,fact:'Burritos con boloñesa vegana · 56g HC'},
  {q:'¿Cuál de estos platos del recetario GBH tiene más calorías?',opts:['Porridge de avena con manzana','Calabacines rellenos de gambas y rape','Yogur griego con tartar de aguacate','Pimientos rellenos al horno'],ans:2,fact:'Yogur griego con tartar de aguacate · 541kcal'},
  {q:'¿Cuál de estos platos del recetario GBH tiene más hidratos de carbono?',opts:['Tortilla de acelgas','Pavo en salsa','Tortilla de calabacín al queso','Hamburguesa completa'],ans:3,fact:'Hamburguesa completa · 45g HC'},
  {q:'¿Cuál de estos platos del recetario GBH tiene más calorías?',opts:['Pollo al curry rápido con arroz','Ensalada de coliflor','Wraps de alubias negras y salsa de aguacate','Pan de manzana'],ans:0,fact:'Pollo al curry rápido con arroz · 464kcal'},
  {q:'¿Cuál de estos platos del recetario GBH tiene más proteínas?',opts:['Rollitos de berenjena tomate y queso','Pechuga de pollo con salsa vegana de champiñones','Pimientos rellenos de bacalao con sticks de zanahoria','Lentejas hindúes'],ans:1,fact:'Pechuga de pollo con salsa vegana de champiñones · 54g prot'},
  {q:'¿Cuál de estos platos del recetario GBH tiene más hidratos de carbono?',opts:['Ajoblanco con sardina ahumada','Rollitos de chocolate y almendra','Buddha bowl de quinoa vegano','Pan con aceite y tomate'],ans:0,fact:'Ajoblanco con sardina ahumada · 88g HC'},
  {q:'¿Cuál de estos platos del recetario GBH tiene más proteínas?',opts:['Ensalada griega vegana','Pisto con huevo','Merluza con cebolla al microondas','Copa de yogur con helado y galleta'],ans:2,fact:'Merluza con cebolla al microondas · 24g prot'},
  {q:'¿Cuál de estos platos del recetario GBH tiene más grasas?',opts:['Calamares encebollados','Guiso de patatas con sepia','Ensalada de pollo con arroz y mango','Guiso de sepia y mejillones'],ans:2,fact:'Ensalada de pollo con arroz y mango · 21g grasa'},
  {q:'¿Cuál de estos platos del recetario GBH tiene más proteínas?',opts:['Mero con salsa de yogur','Rape con calabaza al microondas','Crêpes con jamón y queso','Flan de verduras'],ans:0,fact:'Mero con salsa de yogur · 37g prot'},
  {q:'¿Cuál de estos platos del recetario GBH tiene más proteínas?',opts:['Ensalada de sandía','Ensalada de lentejas y aguacate','Pasta integral con pollo y brócoli','Guiso de garbanzos y albaricoques'],ans:2,fact:'Pasta integral con pollo y brócoli · 56.4g prot'},
  {q:'¿Cuál de estos platos del recetario GBH tiene más calorías?',opts:['Sopa crema de zanahoria y cúrcuma','Ensalada de pavo y naranja','Salmón con verduras al microondas','Bol de plátano y mango'],ans:3,fact:'Bol de plátano y mango · 693kcal'},
  {q:'¿Cuál de estos platos del recetario GBH tiene más proteínas?',opts:['Albóndigas de ternera en salsa de tomate','Ensalada de col y manzana','Pechuga de pavo rellena','Pollo al curry rápido con arroz'],ans:2,fact:'Pechuga de pavo rellena · 65g prot'},
  {q:'¿Cuál de estos platos del recetario GBH tiene más hidratos de carbono?',opts:['Ensalada de pavo con piña y manzana','Lubina con espinacas y piñones','Calamares en salsa','Tortilla de cebolla'],ans:2,fact:'Calamares en salsa · 35g HC'},
  {q:'¿Cuál de estos platos del recetario GBH tiene más calorías?',opts:['Tostada de crema de cacahuete y plátano','Manzana asada','Tostada de Aguacate con Tomate y Huevo','Sopa Thai vegana'],ans:3,fact:'Sopa Thai vegana · 596kcal'},
  {q:'¿Cuál de estos platos del recetario GBH tiene más grasas?',opts:['Ensalada de pollo con aguacate','Batido vegetal','Calabacines rellenos de gambas y rape','Guiso de patatas y calamares'],ans:0,fact:'Ensalada de pollo con aguacate · 24g grasa'},
  {q:'¿Cuál de estos platos del recetario GBH tiene más calorías?',opts:['Ensalada waldorf','Fabada vegana','Bowl de yogur, plátano y nueces','Tortilla francesa con queso'],ans:1,fact:'Fabada vegana · 457kcal'},
  {q:'¿Cuál de estos platos del recetario GBH tiene más hidratos de carbono?',opts:['Milhojas de nata','Natillas de mandarina','Berenjena con relleno vegano de soja o tofu','Patatas rellenas veganas'],ans:3,fact:'Patatas rellenas veganas · 64g HC'},
  {q:'¿Cuál de estos platos del recetario GBH tiene más proteínas?',opts:['Tartar de atún vegano con vinagreta de mostaza y lima','Guiso de patatas con sepia','Estofado de habichuelas','Lentejas con verduras'],ans:3,fact:'Lentejas con verduras · 22g prot'},
  {q:'¿Cuál de estos platos del recetario GBH tiene más proteínas?',opts:['Ensalada de pollo con mango y aguacate','Helado de mango','Salmón a la plancha con brócoli','Calamares encebollados'],ans:2,fact:'Salmón a la plancha con brócoli · 34g prot'},
  {q:'¿Cuál de estos platos del recetario GBH tiene más proteínas?',opts:['Potaje de vigilia','Milhoja de merengue','Tostada de Peanut Butter','Ensalada de garbanzos y lechuga'],ans:0,fact:'Potaje de vigilia · 39.4g prot'},
  {q:'¿Cuál de estos platos del recetario GBH tiene más calorías?',opts:['Tostada de Cottage y Arándanos','Quinoa citrica con leche de coco','Espuma de frutos congelados','Tartaleta de arroz y pollo'],ans:3,fact:'Tartaleta de arroz y pollo · 764kcal'},
  {q:'¿Cuál de estos platos del recetario GBH tiene más calorías?',opts:['Pollo a la plancha con verduras','Tosta de atún con gambas y tomate','Yogur proteico con avena y fresas','Bizcocho de limon'],ans:3,fact:'Bizcocho de limon · 481kcal'},
  {q:'¿Cuál de estos platos del recetario GBH tiene más grasas?',opts:['Pastel de patata','Atún a la plancha con pimientos','Tortilla francesa de queso muzarella','Brochetas de rape con tomate y pimiento'],ans:2,fact:'Tortilla francesa de queso muzarella · 28g grasa'},
  {q:'¿Cuál de estos platos del recetario GBH tiene más grasas?',opts:['Salteado de tofu con verduras','Potaje de vigilia','Pollo a la plancha con verduras','Helado de vainilla'],ans:0,fact:'Salteado de tofu con verduras · 20g grasa'},
  {q:'¿Cuál de estos platos del recetario GBH tiene más proteínas?',opts:['Huevos a la plancha con tomate y pan','Salmón al horno con brócoli y patatas','Crepes de avena con espinacas y champiñones','Guiso de patatas con champiñones'],ans:1,fact:'Salmón al horno con brócoli y patatas · 50g prot'},
  {q:'¿Cuál de estos platos del recetario GBH tiene más calorías?',opts:['Tostada con Plátano y Canela','Sopa postre de chocolate y almendras','Tostada con Revuelto de Tofu y Aguacate','Sopa de pollo'],ans:1,fact:'Sopa postre de chocolate y almendras · 521kcal'},
  {q:'¿Cuál de estos platos del recetario GBH tiene más calorías?',opts:['Mousse de chocolate y yogur','Helado de vainilla','Hamburguesa vegana de soja texturizada','Ensalada de pasta'],ans:3,fact:'Ensalada de pasta · 455kcal'},
  {q:'¿Cuál de estos platos del recetario GBH tiene más proteínas?',opts:['Ensalada de cangrejo','Bowl de yogur con manzana y canela','Alcachofas con jamón y huevo','Ensalada waldorf'],ans:2,fact:'Alcachofas con jamón y huevo · 22g prot'},
  {q:'¿Cuál de estos platos del recetario GBH tiene más calorías?',opts:['Carbonara vegetariana','Natillas','Ensalada de cogollos y espárragos','Escalopes de ternera'],ans:3,fact:'Escalopes de ternera · 610kcal'},
  {q:'¿Cuál de estos platos del recetario GBH tiene más proteínas?',opts:['Guiso de patatas y calamares','Tartar de atún vegano con vinagreta de mostaza y lima','Helado de yogur griego','Merluza al horno con gambas'],ans:3,fact:'Merluza al horno con gambas · 30g prot'},
  {q:'¿Cuál de estos platos del recetario GBH tiene más grasas?',opts:['Brownie en microondas','Manzana asada con canela','Yogur proteico con plátano y almendras','Leche frita'],ans:0,fact:'Brownie en microondas · 33g grasa'},
  {q:'¿Cuál de estos platos del recetario GBH tiene más hidratos de carbono?',opts:['Ensalada verde','Hamburguesa de pimiento y soya','Rape con verduras','Quinoa con verduras y huevo'],ans:3,fact:'Quinoa con verduras y huevo · 38.9g HC'},
  {q:'¿Cuál de estos platos del recetario GBH tiene más proteínas?',opts:['Ensalada tibia de vegetales asados','Panache de verduras','Hamburguesa de pimiento y soya','Guiso de pavo'],ans:3,fact:'Guiso de pavo · 32g prot'},
  {q:'¿Cuál de estos platos del recetario GBH tiene más hidratos de carbono?',opts:['Manzana asada','Ensalada de champiñones','Sopa de pollo','Muffin de chocolate'],ans:3,fact:'Muffin de chocolate · 75g HC'},
  {q:'¿Cuál de estos platos del recetario GBH tiene más hidratos de carbono?',opts:['Power bowl vegano con soja texturizada, boniato y guacamole','Guiso de ternera con champiñones','Batido de plátano y avena','Guiso de alubias con hongos'],ans:2,fact:'Batido de plátano y avena · 112.6g HC'},
  {q:'¿Cuál de estos platos del recetario GBH tiene más calorías?',opts:['Patatas guisadas con cerdo','Crema de brócoli y queso','Helado de yogur griego','Pavo con champiñones y arroz'],ans:0,fact:'Patatas guisadas con cerdo · 755kcal'},
  {q:'¿Cuál de estos platos del recetario GBH tiene más calorías?',opts:['Mousse de pera y kiwi','Ensalada de lentejas y mango','Ensalada de arroz casera','Yogur proteico con plátano y almendras'],ans:1,fact:'Ensalada de lentejas y mango · 561kcal'},
  {q:'¿Cuál de estos platos del recetario GBH tiene más hidratos de carbono?',opts:['Sepia con alubias y almejas','Arroz con leche de chocolate','Arroz de alubias y pimientos','Lubina al microondas con calabacín'],ans:2,fact:'Arroz de alubias y pimientos · 66g HC'},
  {q:'¿Cuál de estos platos del recetario GBH tiene más proteínas?',opts:['Tostada de Guacamole','Ensalada de manzana y fresas con pipas','Pancakes veganos','Ramen vegano'],ans:3,fact:'Ramen vegano · 39g prot'},
  {q:'¿Cuál de estos platos del recetario GBH tiene más calorías?',opts:['Manzana asada con canela','Pasta vegana','Lomo de cerdo a la manzana','Merluza con pimientos del piquillo'],ans:2,fact:'Lomo de cerdo a la manzana · 466kcal'},
  {q:'¿Cuál de estos platos del recetario GBH tiene más calorías?',opts:['Alcachofas con jamón y huevo','Tortitas de claras y avena','Sopa crema de calabaza vegana','Batido vegano de plátano y dátiles'],ans:3,fact:'Batido vegano de plátano y dátiles · 363kcal'},
  {q:'¿Cuál de estos platos del recetario GBH tiene más hidratos de carbono?',opts:['Fabada vegana','Crema de patatas y apio','Garbanzos con almejas','Brocheta de frutas'],ans:0,fact:'Fabada vegana · 55g HC'},
  {q:'¿Cuál de estos platos del recetario GBH tiene más hidratos de carbono?',opts:['Vegan poke bowl de tofu','Tostadas con aguacate y huevo','Fideuá al horno','Habas con huevo'],ans:0,fact:'Vegan poke bowl de tofu · 109g HC'},
  {q:'¿Cuál de estos platos del recetario GBH tiene más calorías?',opts:['Bizcocho rapido','Ceviche vegano','Tortilla de patata y calabacín','Ensalada campera'],ans:0,fact:'Bizcocho rapido · 680kcal'},
  {q:'¿Cuál de estos platos del recetario GBH tiene más calorías?',opts:['Brownie en microondas','Sándwich de bacalao ahumado y aguacate','Brocheta de fruta gratinada','Mero con fideos'],ans:0,fact:'Brownie en microondas · 555kcal'},
  {q:'¿Cuál de estos platos del recetario GBH tiene más proteínas?',opts:['Ensalada parrillada','Tostas de tomate, queso y mortadela','Natillas','Pizza de pollo'],ans:3,fact:'Pizza de pollo · 45g prot'},
  {q:'¿Cuál de estos platos del recetario GBH tiene más proteínas?',opts:['Ensalada de alcachofas y atún','Brochetas de rape con tomate y pimiento','Hamburguesa de lentejas','Huevos revueltos con jamón'],ans:3,fact:'Huevos revueltos con jamón · 35g prot'},
  {q:'¿Cuál de estos platos del recetario GBH tiene más proteínas?',opts:['Copa de yogur con helado y galleta','Rape con calabaza al microondas','Guiso pavo con verduras','Ensalada thai'],ans:2,fact:'Guiso pavo con verduras · 34g prot'},
  {q:'¿Cuál de estos platos del recetario GBH tiene más grasas?',opts:['Copa de yogur con helado y galleta','Pad thai vegano','Tostada Proteica con Crema de Almendra','Crema de brócoli y queso'],ans:0,fact:'Copa de yogur con helado y galleta · 70g grasa'},
  {q:'¿Cuál de estos platos del recetario GBH tiene más calorías?',opts:['Tostada de Aguacate con Tomate y Huevo','Rape con verduras','Salteado de gambas y verduras','Trenza de chocolate'],ans:3,fact:'Trenza de chocolate · 440kcal'},
  {q:'¿Cuál de estos platos del recetario GBH tiene más hidratos de carbono?',opts:['Rollitos de salmón ahumado','Ensalada de cuscús','Ensalada de cangrejo','Ensalada de arroz con vinagreta de miel'],ans:3,fact:'Ensalada de arroz con vinagreta de miel · 56g HC'},
  {q:'¿Cuál de estos platos del recetario GBH tiene más grasas?',opts:['Tostadas con aguacate y huevo','Ensalada de langostinos rúcula y papaya','Tortilla de espinacas y queso','Pan con aceite y tomate'],ans:0,fact:'Tostadas con aguacate y huevo · 60g grasa'},
  {q:'¿Cuál de estos platos del recetario GBH tiene más hidratos de carbono?',opts:['Tostada de Guacamole','Ensalada de cogollos con mejillones','Tortitas de plátano y avena','Huevos revueltos con espárragos'],ans:2,fact:'Tortitas de plátano y avena · 117.5g HC'},
  {q:'¿Cuál de estos platos del recetario GBH tiene más calorías?',opts:['Ensalada de coliflor','Ensalada de berenjena y queso','Ensalada de aguacate y mango','Sándwich de salmón, queso y aguacate'],ans:1,fact:'Ensalada de berenjena y queso · 510kcal'},
  {q:'¿Cuál de estos platos del recetario GBH tiene más proteínas?',opts:['Guiso de garbanzos y albaricoques','Tortitas de claras y avena','Pasta vegana','Muffin de chocolate'],ans:2,fact:'Pasta vegana · 39g prot'},
  {q:'¿Cuál de estos platos del recetario GBH tiene más calorías?',opts:['Tostada con Ricotta y Pera Caramelizada','Ensalada de langostinos rúcula y papaya','Pisto con huevo','Tostada de Peanut Butter'],ans:3,fact:'Tostada de Peanut Butter · 367kcal'},
  {q:'¿Cuál de estos platos del recetario GBH tiene más grasas?',opts:['Wraps de alubias negras y salsa de aguacate','Batido vegano','Tostas de tomate, queso y mortadela','Crema con rape y gambas'],ans:2,fact:'Tostas de tomate, queso y mortadela · 35g grasa'},
  {q:'¿Cuál de estos platos del recetario GBH tiene más grasas?',opts:['Guiso de merluza y gambas','Tortilla de berenjenas queso y pimiento','Estofado vegano de soja texturizada','Manzana asada con canela'],ans:1,fact:'Tortilla de berenjenas queso y pimiento · 22g grasa'},
  {q:'¿Cuál de estos platos del recetario GBH tiene más hidratos de carbono?',opts:['Quesadilla vegana','Rollitos de lenguado con salsa de espinacas','Risotto vegano de champiñones','Merluza al horno con patata'],ans:2,fact:'Risotto vegano de champiñones · 88g HC'},
  {q:'¿Cuál de estos platos del recetario GBH tiene más hidratos de carbono?',opts:['Pasta con brócoli y queso','Tortilla de espinacas (variante 2)','Tosta de aguacate con anchoa y tomate','Rollitos de pollo con pimiento del piquillo y queso'],ans:0,fact:'Pasta con brócoli y queso · 45g HC'},
  {q:'¿Cuál de estos platos del recetario GBH tiene más hidratos de carbono?',opts:['Ensalada de atún marinado con salsa de soja','Espuma de frutos congelados','Mousse de mango y coco vegano','Ensalada de arroz yamaní'],ans:3,fact:'Ensalada de arroz yamaní · 34g HC'},
  {q:'¿Cuál de estos platos del recetario GBH tiene más hidratos de carbono?',opts:['Escalopes de ternera','Espaguetis con bechamel vegana','Ensalada de pasta fácil','Hamburguesas de arroz con queso'],ans:1,fact:'Espaguetis con bechamel vegana · 83g HC'},
  {q:'¿Cuál de estos platos del recetario GBH tiene más calorías?',opts:['Hamburguesa completa','Salteado de tofu brócoli y zanahoria','Ensalada de alcachofas y atún','Guiso de patatas y calamares'],ans:0,fact:'Hamburguesa completa · 800kcal'},
  {q:'¿Cuál de estos platos del recetario GBH tiene más hidratos de carbono?',opts:['Pasta amatriciana','Tostada Estilo Cheesecake de Arándanos','Ensalada de col y manzana','Porridge vegano de avena'],ans:3,fact:'Porridge vegano de avena · 61g HC'},
  {q:'¿Cuál de estos platos del recetario GBH tiene más calorías?',opts:['Mousse de pera y kiwi','Tostada de Pera y Queso Roquefort','Natillas de mandarina','Gachas de avena con manzana'],ans:3,fact:'Gachas de avena con manzana · 505kcal'},
  {q:'¿Cuál de estos platos del recetario GBH tiene más grasas?',opts:['Ensalada de pasta','Chocolatinas de frutos secos','Tostada de Cottage y Arándanos','Crepes de avena con espinacas y champiñones'],ans:1,fact:'Chocolatinas de frutos secos · 30g grasa'},
  {q:'¿Cuál de estos platos del recetario GBH tiene más grasas?',opts:['Filete de ternera con champiñones','Tortilla de patata sencilla','Ensalada de cuscús','Tostada Francesa con Toppings'],ans:1,fact:'Tortilla de patata sencilla · 27g grasa'},
  {q:'¿Cuál de estos platos del recetario GBH tiene más hidratos de carbono?',opts:['Pasta con tomate y atún','Calamares encebollados','Crema de verduras y legumbres','Pizza de berenjena'],ans:0,fact:'Pasta con tomate y atún · 55g HC'},
  {q:'¿Cuál de estos platos del recetario GBH tiene más proteínas?',opts:['Crema de verduras y legumbres','Salteado de pollo con verduras al wok','Porridge de avena con manzana','Ensalada mixta'],ans:1,fact:'Salteado de pollo con verduras al wok · 39g prot'},
  {q:'¿Cuál de estos platos del recetario GBH tiene más hidratos de carbono?',opts:['Espaguetis boloñesa','Salmón al horno con brócoli y patatas','Bol de açai','Ensalada de quinoa y atún'],ans:2,fact:'Bol de açai · 112.7g HC'},
  {q:'¿Cuál de estos platos del recetario GBH tiene más grasas?',opts:['Tostada de Peanut Butter','Tortilla de patata y calabacín','Brochetas de tomate, queso y anchoas','Ensalada de langostinos rúcula y papaya'],ans:1,fact:'Tortilla de patata y calabacín · 26g grasa'},
  {q:'¿Cuál de estos platos del recetario GBH tiene más proteínas?',opts:['Muffin de chocolate','Pollo guisado con verduras','Quinoa con verduras y huevo','Tosta de salmón y huevo duro'],ans:1,fact:'Pollo guisado con verduras · 32g prot'},
  {q:'¿Cuál de estos platos del recetario GBH tiene más calorías?',opts:['Helado de yogur griego','Ensalada de coliflor','Ensalada de cogollos con mejillones','Salmón al horno'],ans:3,fact:'Salmón al horno · 473kcal'},
  {q:'¿Cuál de estos platos del recetario GBH tiene más grasas?',opts:['Bacalao con salsa de pimiento y tomate','Hamburguesa vegana de alubias','Mousse de pera y kiwi','Ensalada de arroz casera'],ans:1,fact:'Hamburguesa vegana de alubias · 19g grasa'},
  {q:'¿Cuál de estos platos del recetario GBH tiene más calorías?',opts:['Gnocchi con mozzarella y pollo','Bacalao al papillote','Crema cuajada de leche y queso','Trenza de chocolate'],ans:0,fact:'Gnocchi con mozzarella y pollo · 995kcal'},
  {q:'¿Cuál de estos platos del recetario GBH tiene más calorías?',opts:['Milhojas de nata','Salmorejo falso','Tortilla de espinacas y queso','Platano y pina gratinados'],ans:0,fact:'Milhojas de nata · 455kcal'},
  {q:'¿Cuál de estos platos del recetario GBH tiene más hidratos de carbono?',opts:['Tartar de atún','Ensalada thai','Calamares en salsa','Potaje de setas y alubias'],ans:3,fact:'Potaje de setas y alubias · 63g HC'},
  {q:'¿Cuál de estos platos del recetario GBH tiene más grasas?',opts:['Mousse de melon','Yogur proteico con avena y fresas','Sopa crema de zanahoria y cúrcuma','Tostada con Plátano y Canela'],ans:2,fact:'Sopa crema de zanahoria y cúrcuma · 12g grasa'},
  {q:'¿Cuál de estos platos del recetario GBH tiene más proteínas?',opts:['Veganesa','Garbanzos con marisco','Lomo con pimientos','Tortitas de avena veganas'],ans:2,fact:'Lomo con pimientos · 33g prot'},
  {q:'¿Cuál de estos platos del recetario GBH tiene más hidratos de carbono?',opts:['Merluza a la plancha con ensalada','Lomo con pimientos','Gachas dulces','Sopa crema de calabaza'],ans:2,fact:'Gachas dulces · 178.2g HC'},
  {q:'¿Cuál de estos platos del recetario GBH tiene más calorías?',opts:['Wok de pollo y verduras','Tostada Proteica con Crema de Almendra','Gambas al ajillo con arroz','Lentejas estofadas'],ans:0,fact:'Wok de pollo y verduras · 900kcal'},
  {q:'¿Cuál de estos platos del recetario GBH tiene más grasas?',opts:['Crema de verduras y legumbres','Wraps de alubias negras y salsa de aguacate','Ensalada griega vegana','Hojaldre con natillas'],ans:3,fact:'Hojaldre con natillas · 19g grasa'},
  {q:'¿Cuál de estos platos del recetario GBH tiene más grasas?',opts:['Ensalada de coliflor','Tortitas proteicas de avena','Tostada Caprese','Guiso de patatas con sepia'],ans:0,fact:'Ensalada de coliflor · 18g grasa'},
  {q:'¿Cuál de estos platos del recetario GBH tiene más hidratos de carbono?',opts:['Boloñesa de lentejas','Estofado de pollo','Revuelto de gulas y champiñones','Pescado a la parrilla con espárragos'],ans:0,fact:'Boloñesa de lentejas · 34g HC'},
  {q:'¿Cuál de estos platos del recetario GBH tiene más hidratos de carbono?',opts:['Ensalada de patata','Calamares encebollados','Tostada de Hummus con Salmón Ahumado','Sopa crema de calabaza'],ans:2,fact:'Tostada de Hummus con Salmón Ahumado · 38g HC'},
  {q:'¿Cuál de estos platos del recetario GBH tiene más proteínas?',opts:['Garbanzos con almejas','Pimientos rellenos de carne','Natillas de mandarina','Patatas rellenas veganas'],ans:1,fact:'Pimientos rellenos de carne · 32g prot'},
  {q:'¿Cuál de estos platos del recetario GBH tiene más hidratos de carbono?',opts:['Tosta de salmón y huevo duro','Rollitos de lenguado con salsa de espinacas','Ensaladilla de pollo y aguacate','Merluza al horno con gambas'],ans:2,fact:'Ensaladilla de pollo y aguacate · 31g HC'},
  {q:'¿Cuál de estos platos del recetario GBH tiene más hidratos de carbono?',opts:['Tostada de Jamón Serrano con Tortilla de Huevo','Calamares encebollados','Fideuá al horno','Sopa de pollo'],ans:2,fact:'Fideuá al horno · 50.8g HC'},
  {q:'¿Cuál de estos platos del recetario GBH tiene más grasas?',opts:['Tortilla de verduras','Salteado de pollo con verduras al wok','Tostada con Queso, Miel y Nueces','Tostada de Guacamole'],ans:0,fact:'Tortilla de verduras · 23g grasa'},
  {q:'¿Cuál de estos platos del recetario GBH tiene más grasas?',opts:['Ensalada de queso cabra y berenjenas a la plancha','Ensalada tibia de vegetales asados','Pavo salteado con calabacín','Arroz con verduras vegan'],ans:0,fact:'Ensalada de queso cabra y berenjenas a la plancha · 26g grasa'},
  {q:'¿Cuál de estos platos del recetario GBH tiene más grasas?',opts:['Sopa de puerros','Sopa Thai vegana','Sopa de quinoa y verduras vegana','Pavo con champiñones y arroz'],ans:1,fact:'Sopa Thai vegana · 32g grasa'},
  {q:'¿Cuál de estos platos del recetario GBH tiene más grasas?',opts:['Pancakes veganos','Ensaladilla de pollo y aguacate','Helado de platano','Ensalada de espinacas'],ans:1,fact:'Ensaladilla de pollo y aguacate · 21g grasa'},
  {q:'¿Cuál de estos platos del recetario GBH tiene más calorías?',opts:['Milhoja de merengue','Tiramisu','Pizza de pollo','Arroz con mejillones'],ans:1,fact:'Tiramisu · 627kcal'},
  {q:'¿Cuál de estos platos del recetario GBH tiene más grasas?',opts:['Chipirones en su tinta','Guisantes con jamón y huevo duro','Risotto con champiñones y bacon','Ensalada de pollo con aguacate'],ans:2,fact:'Risotto con champiñones y bacon · 60.4g grasa'},
  {q:'¿Cuál de estos platos del recetario GBH tiene más hidratos de carbono?',opts:['Veganesa','Tortilla francesa de queso muzarella','Brownie en microondas','Yogur proteico con avena y fresas'],ans:2,fact:'Brownie en microondas · 55g HC'},
  {q:'¿Cuál de estos platos del recetario GBH tiene más calorías?',opts:['Gazpacho andaluz','Tostada con Yogur Griego, Fresas y Almendras','Crema de calabacín con tejas de queso','Tortitas de plátano y avena'],ans:3,fact:'Tortitas de plátano y avena · 769kcal'},
  {q:'¿Cuál de estos platos del recetario GBH tiene más hidratos de carbono?',opts:['Merluza a la plancha con ensalada','Caldereta de cordero','Crema cuajada de leche y queso','Ensalada de cogollos con mejillones'],ans:2,fact:'Crema cuajada de leche y queso · 42g HC'},
  {q:'¿Cuál de estos platos del recetario GBH tiene más calorías?',opts:['Vegetales mixtos salteados','Sándwich de salmón, queso y aguacate','Tostada al Pesto con Queso','Risoto de quinoa vegano'],ans:3,fact:'Risoto de quinoa vegano · 471kcal'},
  {q:'¿Cuál de estos platos del recetario GBH tiene más hidratos de carbono?',opts:['Platano banado en choco','Bol de salmón y col rizada / versión calórica','Gachas de avena con manzana','Tortilla de espinacas y queso'],ans:2,fact:'Gachas de avena con manzana · 62g HC'},
  {q:'¿Cuál de estos platos del recetario GBH tiene más proteínas?',opts:['Merluza al horno con patata','Tostada con Queso y Miel','Guiso de pescado y marisco','Brocheta de fruta gratinada'],ans:0,fact:'Merluza al horno con patata · 30g prot'},
  {q:'¿Cuál de estos platos del recetario GBH tiene más proteínas?',opts:['Guiso de patatas y calamares','Ensalada de pasta con pollo','Arroz integral con verduras y pollo','Salteado de verduras con huevo'],ans:2,fact:'Arroz integral con verduras y pollo · 56g prot'},
  {q:'¿Cuál de estos platos del recetario GBH tiene más calorías?',opts:['Tostada Proteica con Crema de Almendra','Crema de calabacines','Calabacines rellenos de gambas y rape','Mero con fideos'],ans:0,fact:'Tostada Proteica con Crema de Almendra · 535kcal'}
];

// Banco combinado: 30 generales + 152 recetario = 182 dias sin repetir.
// Regenerado 2026-07-21 desde el CSV corregido (GBH_Correccion_Recetario.sql):
// cada pregunta usa solo recetas cuyo macro consultado esta verificado contra
// sus propios ingredientes, con margen minimo para que la respuesta sea inequivoca.
const QUIZ_ALL = [...QUIZ_BANK, ...QUIZ_RECETARIO];

// ─── QuizModal ────────────────────────────────────────────────────────────────
export default function QuizModal({onClose, onComplete, todayKey, lang, onGoHome}){
  const dayIdx = (()=>{const d=new Date();return(d.getFullYear()*366+Math.floor((d-new Date(d.getFullYear(),0,0))/(1000*60*60*24)))%QUIZ_ALL.length;})();
  const q = QUIZ_ALL[dayIdx];
  const [selected, setSelected] = useState(null);
  const [revealed, setRevealed] = useState(false);
  const [phase,    setPhase]    = useState("question"); // question | result

  const choose = (i) => {
    if(revealed) return;
    setSelected(i);
    setRevealed(true);
    const isOk = i === q.ans;
    if(isOk) SFX.quizOk(); else SFX.quizFail();
    setTimeout(()=>setPhase("result"), 900);
  };

  const correct = selected===q.ans;
  const xpGain  = correct ? 20 : 5;
  const gemGain = correct ? 8  : 1;

  return(
    <div style={{position:"fixed",inset:0,zIndex:11000,background:"rgba(0,0,0,0.92)",backdropFilter:"blur(8px)",display:"flex",alignItems:"center",justifyContent:"center",padding:20}} onClick={phase==="result"?onClose:undefined}>
      <div style={{background:`linear-gradient(180deg,#1A3A10,${T.bgWood})`,borderRadius:28,width:"100%",maxWidth:360,border:`2px solid ${T.bW}`,boxShadow:"0 24px 60px rgba(0,0,0,0.8)",animation:"popIn 0.35s cubic-bezier(0.34,1.56,0.64,1)",overflow:"hidden"}} onClick={e=>e.stopPropagation()}>

        {phase==="question"&&(
          <>
            {/* Header */}
            <div style={{background:`linear-gradient(135deg,${T.g1},${T.g2})`,padding:"16px 20px",display:"flex",alignItems:"center",gap:12}}>
              <div style={{fontSize:28}}>🧠</div>
              <div style={{flex:1}}>
                <div style={{fontSize:11,fontWeight:900,color:"rgba(255,255,255,0.7)",textTransform:"uppercase",letterSpacing:"0.1em"}}>
                  {lang==="en"?"Daily quiz":"Quiz del día"}
                </div>
                <div style={{fontSize:14,fontWeight:900,color:T.t1}}>
                  {lang==="en"?"Nutrition":"Nutrición"} · {correct?"":(lang==="en"?"Earn up to":"Gana hasta")} +20 XP +8 💎
                </div>
              </div>
              {/* Botón cerrar */}
              <button onClick={onClose} style={{
                background:"rgba(0,0,0,0.2)",border:"2px solid rgba(255,255,255,0.3)",
                borderRadius:"50%",width:32,height:32,color:T.t1,
                fontSize:16,cursor:"pointer",display:"flex",alignItems:"center",
                justifyContent:"center",flexShrink:0,lineHeight:1,
              }}>✕</button>
            </div>
            {/* Pregunta */}
            <div style={{padding:"22px 20px 16px"}}>
              <div style={{fontSize:16,fontWeight:800,color:T.wh,lineHeight:1.5,marginBottom:20,fontFamily:"'DM Sans',sans-serif"}}>
                {getQuizQ(q, lang)}
              </div>
              {/* Opciones */}
              <div style={{display:"flex",flexDirection:"column",gap:10}}>
                {getQuizOpts(q, lang).map((opt,i)=>{
                  let bg="rgba(255,255,255,0.07)";
                  let border=T.bW;
                  let col=T.t1;
                  if(revealed){
                    if(i===q.ans){bg=alpha(T.g1,0.25);border=T.g1;col=T.g2;}
                    else if(i===selected&&selected!==q.ans){bg="rgba(255,80,80,0.2)";border="rgba(255,80,80,0.6)";col="#FF8080";}
                  } else if(selected===i){
                    bg=alpha(T.au1,0.15);border=T.au1;col=T.au1;
                  }
                  return(
                    <button key={i} onClick={()=>choose(i)} style={{
                      background:bg,border:`2px solid ${border}`,borderRadius:16,
                      padding:"14px 18px",color:col,fontWeight:800,fontSize:14,
                      cursor:revealed?"default":"pointer",textAlign:"left",
                      fontFamily:"'DM Sans',sans-serif",lineHeight:1.3,
                      transition:"all 0.3s",boxShadow:"0 3px 0 rgba(0,0,0,0.4)",
                    }}>
                      <span style={{marginRight:10,opacity:0.5}}>{"ABCD"[i]}.</span>{opt}
                    </button>
                  );
                })}
              </div>
            </div>
          </>
        )}

        {phase==="result"&&(
          <div role="button" tabIndex={0} style={{padding:"32px 24px",textAlign:"center"}} onClick={()=>{onComplete(xpGain,gemGain);onClose();}}>
            <div style={{fontSize:64,marginBottom:12,animation:"scaleIn 0.5s cubic-bezier(0.34,1.56,0.64,1)"}}>{correct?"🎉":"💡"}</div>
            <div style={{fontSize:22,fontWeight:900,color:correct?T.g1:"#FF8080",marginBottom:8}}>
              {correct?(lang==="en"?"Correct!":"¡Correcto!"):(lang==="en"?"Almost...":"Casi...")}
            </div>
            <div style={{fontSize:14,color:T.t2,fontFamily:"'DM Sans',sans-serif",marginBottom:20,lineHeight:1.5}}>
              {correct
                ? (lang==="en"?"You knew the answer! Your nutritionist would be proud 🐑":"¡Sabías la respuesta! Tu nutricionista estaría orgulloso 🐑")
                : lang==="en"
                  ? `The correct answer was: "${getQuizOpts(q,lang)[q.ans]}"${getQuizFact(q,lang)?" · "+getQuizFact(q,lang):""}`
                  : `La respuesta correcta era: "${q.opts[q.ans]}"${q.fact?" · "+q.fact:""}`}
            </div>
            {/* Recompensa */}
            <div style={{display:"flex",justifyContent:"center",gap:16,marginBottom:24}}>
              {[{icon:"⚡",val:`+${xpGain} XP`,col:T.xp},{icon:"💎",val:`+${gemGain}`,col:T.au1}].map(({icon,val,col})=>(
                <div key={val} style={{background:"rgba(255,255,255,0.08)",borderRadius:18,padding:"12px 20px",border:`2px solid rgba(255,255,255,0.12)`}}>
                  <div style={{fontSize:22}}>{icon}</div>
                  <div style={{fontSize:16,fontWeight:900,color:col}}>{val}</div>
                </div>
              ))}
            </div>
            <div style={{fontSize:12,color:T.t2,fontFamily:"'DM Sans',sans-serif",marginBottom:16}}>
              {lang==="en"?"Tap anywhere to continue":"Toca en cualquier lugar para continuar"}
            </div>
            {/* Volver a inicio */}
            <div role="button" tabIndex={0} onClick={e=>{e.stopPropagation();onComplete(xpGain,gemGain);onGoHome();}} style={{display:"inline-block",padding:"10px 28px",borderRadius:14,border:"1.5px solid rgba(255,255,255,0.15)",color:"rgba(255,255,255,0.45)",fontSize:13,fontWeight:700,cursor:"pointer",fontFamily:"'Nunito',sans-serif"}}>
              {lang==="en"?"← Home":"← Inicio"}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
