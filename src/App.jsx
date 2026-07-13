import React, { useState, useEffect, useCallback, useMemo, useRef } from "react";

// ─── Servidor de generación de programaciones (Railway) ─────────────────────
// Rellena estos dos valores tras desplegar el servidor (ver GUIA_DESPLIEGUE_RAILWAY.md)
const GBH_SERVER_URL = "https://web-production-98efe.up.railway.app";
const GBH_GEN_TOKEN  = "gbh_nutricion_2026";

// ─── Internacionalización (ES / EN) ─────────────────────────────────────────
const LangCtx = React.createContext("es");

const TRANS = {
  es:{
    tagline:"Tu compañero de hábitos saludables 🌱",
    loading:"Cargando GBH…",
    email:"Email", emailPH:"nombre@ejemplo.com",
    fullName:"Nombre completo", namePH:"Nombre Apellido",
    currentWeight:"Peso actual", goalWeight:"Peso objetivo",
    weightHint:"💡 Será tu punto de partida en la gráfica de evolución",
    goalHint:"🎯 Opcional — te ayuda a ver cuánto te queda para llegar",
    checkingAccount:"Verificando cuenta...",
    welcomeBack:"¡Bienvenido de nuevo, {n}!",
    accountExists:"Tu cuenta existe — introduce tu contraseña para entrar.",
    verifying:"Verificando...",
    recoverAccount:"Entrar 🔓",
    startAdventure:"¡Empezar mi aventura! 🚀",
    noConnRecover:"Sin conexión. Conéctate a internet para recuperar tu cuenta.",
    // Contraseña
    password:"Contraseña", passwordPH:"Mínimo 6 caracteres",
    passwordConfirm:"Confirmar contraseña", passwordConfirmPH:"Repite tu contraseña",
    passwordShow:"Mostrar", passwordHide:"Ocultar",
    passwordMismatch:"Las contraseñas no coinciden.",
    passwordTooShort:"La contraseña debe tener al menos 6 caracteres.",
    passwordWrong:"Contraseña incorrecta. Inténtalo de nuevo.",
    forgotPassword:"¿Olvidaste tu contraseña?",
    forgotPasswordSent:"📧 Te hemos enviado un email para restablecer tu contraseña.",
    forgotPasswordErr:"No se pudo enviar el email. Inténtalo de nuevo.",
    // Migración usuarios existentes sin contraseña
    migrateTitle:"¡Protege tu cuenta! 🔐",
    migrateDesc:"Para mayor seguridad, crea una contraseña para tu cuenta. Tus datos, racha y progreso no se tocarán.",
    migrateBtn:"Crear mi contraseña 🔐",
    authErrGeneric:"Error al iniciar sesión. Inténtalo de nuevo.",
    // Nav
    tabHome:"Inicio", tabRecipe:"Receta", tabWeight:"Peso",
    tabRanking:"Ranking", tabAchievements:"Logros", tabCalc:"Objetivo",
    // Tiers / levels
    tiers:["Novato","Aprendiz","Constante","Comprometido","Disciplinado","Atleta","Experto","Élite","Maestro","Leyenda"],
    champion:"Campeón GBH",
    // Days (Mon→Sun)
    dayLabels:["L","M","X","J","V","S","D"],
    // Home
    dailyMissions:"🩺 Misiones Diarias",
    dietBtn:"Registrar Dieta Diaria",
    sleepLabel:"Dormir al menos 7 horas",
    dietDone:"¡Dieta del día registrada! +15 XP",
    completedBadge:"¡Completado!",
    quiz:"Quiz", quizDone:"Quiz ✓", earnXP:"Gana XP y 💎",
    roulette:"Ruleta", rouletteDone:"Ruleta ✓",
    spinFree:"Gira gratis", untilTomorrow:"Hasta mañana",
    streakShield:"🛡️ Escudo de Racha",
    shieldDesc:"Protege tu racha 1 día · {n} disponibles",
    streakLabel:"Racha", gemsLabel:"Gemas", progressLabel:"Progreso",
    // WeekPath
    weeklyProgress:"📅 Progreso semanal",
    daysUnit:"días", dayUnit:"día",
    chestUnlocked:"¡Cofre desbloqueado! Toca para abrirlo 🎉",
    chestOpenedWeek:"Cofre abierto esta semana ✅",
    chestDaysLeft:"{n} {d} más para el cofre semanal",
    // XP goal
    weeklyXPGoal:"⚡ Meta semanal de XP",
    weeklyXPDone:"🎉 ¡Meta semanal completada! Bonus: +20 XP",
    // Calculadora calórica
    calcTitle:"🔢 Calculadora Calórica",
    calcSubtitle:"Calorías diarias para llegar a tu objetivo en 3 meses",
    calcSex:"Sexo", calcMan:"♂ Hombre", calcWoman:"♀ Mujer",
    calcHeight:"Estatura (cm)", calcHeightPH:"Ej: 170",
    calcAge:"Rango de edad", calcActivity:"Nivel de actividad",
    calcBtn:"Calcular mis calorías 🔢",
    calcResultTitle:"Tu objetivo diario",
    calcKcal:"kcal / día", calcBMR:"Metabolismo basal (BMR)",
    calcTDEE:"Gasto total (TDEE)", calcAdj:"Ajuste por objetivo",
    calcDeficit:"déficit", calcSurplus:"superávit",
    calcNote:"📌 Consulta siempre a tu nutricionista antes de hacer cambios en tu dieta.",
    calcNoGoal:"⚠️ Añade un peso objetivo en tu perfil para ver el ajuste de calorías.",
    calcNoWeight:"⚠️ Registra tu peso actual primero.",
    calcSaved:"📊 Tu cálculo guardado",
    calcEditBtn:"✏️ Editar cálculo",
    calcResetBtn:"🔄 Recalcular",
    backToHome:"← Volver a inicio",
    calcAgeRanges:["18 – 25 años","26 – 35 años","36 – 45 años","46 – 55 años","56 – 65 años","Más de 65 años"],
    calcActivityLevels:["Sedentario (sin ejercicio)","Ligero (1-3 días/semana)","Moderado (3-5 días/semana)","Activo (6-7 días/semana)","Muy activo (trabajo físico + ejercicio)"],
    // Bubbles
    b_celebrating:"🎉 ¡Día perfecto, {n}! Misiones completadas",
    b_legend:"👑 ¡{s} días, {n}! Leyenda absoluta",
    b_excited:"🔥 ¡{s} días seguidos! ¡Imparable, {n}!",
    b_happy:"✅ ¡Dieta registrada! Sigue así, {n}",
    b_sleeping:"😴 Buen descanso, {n}. ¡Mañana a tope!",
    b_sad_late:"⚠️ {n}, ¡aún puedes registrar la dieta! No pierdas la racha 🔥",
    b_sad:"💚 Hola {n}! Hoy es el día para empezar",
    b_default:"¡Hola {n}! ¿Listo para marcar el día? 🌱",
    // Weight tab
    scaleResting:"La báscula está descansando",
    scaleRestingDesc:"Pesarse cada día genera ansiedad innecesaria.",
    scaleRestingBack:"Vuelve el fin de semana",
    scaleRestingDesc2:"para ver tu evolución real sin distorsión diaria.",
    editWeightTitle:"Editar pesaje de hoy",
    howMuchToday:"¿Cuánto pesas hoy?",
    fastingHint:"💡 En ayunas, antes de desayunar",
    editNote:"✏️ Edición — no suma gemas ni XP",
    saveChanges:"💾 Guardar cambios",
    saveWeight:"✅ Guardar peso",
    seeChart:"← Ver gráfica",
    registerWeightToday:"⚖️ Registrar peso de hoy",
    weightBannerTitle:"¡Registra tu peso esta semana!",
    weightBannerCta:"Pulsa para ir al pesaje →",
    weekendWeighLabel:"✅ Pesaje del fin de semana",
    firstWeighLine1:"Registra tu primer pesaje",
    firstWeighLine2:"para ver tu evolución",
    // Recipe tab
    recipeOfDay:"🍰 Receta del día",
    calories:"Calorías", protein:"Proteína", carbs:"Hidratos", fat:"Grasas",
    ingredients:"🛒 Ingredientes", preparation:"👨‍🍳 Preparación",
    buyBtn:"🛒 Comprar", buyListSub:"Marca lo que vayas metiendo en el carro",
    listReset:"🔄 Regenerar lista", listConfirm:"Toca otra vez para confirmar ↺",
    loadingRecipe:"Cargando receta...",
    recipeLoadError:"No se pudo cargar la receta.\nComprueba tu conexión.",
    retry:"Reintentar",
    recipeLocked:"🔒 Bloqueado", recipeNoGems:"💎 Sin gemas",
    recipeChange:"🔄 Cambiar · 10💎",
    availableTomorrow:"Disponible mañana",
    changesLeft:"{n} cambio{s} restante{s}",
    // Ranking
    rankingTitle:"Ranking",
    rankStreak:"Racha", rankXP:"XP", rankWeight:"Peso",
    rankStreakSub:"Días consecutivos", rankXPSub:"Experiencia total",
    rankWeightSub:"Progreso desde inicio",
    rankDays:"días", rankLoading:"Cargando…",
    rankEmpty:"Sin datos aún",
    rankEmptyDesc:"El ranking se llenará cuando más pacientes usen la app",
    rankUpdateBtn:"🔄 Actualizar",
    // Achievements
    achievementsLabel:"logros", xpTotalLabel:"XP total",
    gemsStatLabel:"💎 gemas",
    noAchievements:"Completa misiones para desbloquear logros",
    // Profile
    profileFullName:"Nombre completo", profileEmail:"Email",
    profileInitialWeight:"Peso inicial", profileGoalWeight:"Peso objetivo",
    profileHeight:"Estatura",
    closeBtn:"✕ Cerrar",
    // Height
    heightTitle:"¿Cuánto mides?",
    heightHint:"📏 Tu altura nos ayuda a calcular tu IMC y personalizar tu plan",
    // Update banner
    updateAvailable:"Nueva versión disponible",
    updateDesc:"Toca para actualizar la app ahora",
    updateBtn:"Actualizar",
    // Offline
    offlineBanner:"📵 Sin conexión — datos guardados localmente",
    // Toasts
    insufficientGems:"Gemas insuficientes",
    needGemsRecipe:"Necesitas 10 💎 para cambiar la receta",
    needGemsShield:"Necesitas 200 💎 para un Escudo",
    shieldActivated:"¡Escudo activado!",
    shieldProtected:"Tu racha está protegida por 1 día",
    // Error
    errorTitle:"Error en la app", retryBtn:"Reintentar",
    // Language
    langLabel:"Idioma",
    // Steps widget
    stepsLabel:"Dar 10.000 pasos",
    stepsXP:"+5 XP · {n} / 10.000 pasos",
    // Hydration
    hydrationLabel:"Beber 1.5 - 2 L de agua",
    hydrationXP:"+5 XP · {g}/{target} vasos",
    hydrationDone:"¡Completado!",
    hydrationHint:"Pulsa cada vaso al beberlo — meta: {target} vasos (≈ 2L)",
    // Tomorrow card
    tomorrowTitle:"¡Día completado, {n}!",
    tomorrowDesc:"Has completado todas las misiones.",
    tomorrowStreak:"Tu racha es de {s} 🔥 días.",
    tomorrowBack:"🕐 Vuelve mañana",
    // Weight chart
    chartTitle:"📈 Evolución de peso",
    chartReal:"Real", chartTrend:"Tendencia", chartGoalLabel:"Objetivo",
    chartTotalChange:"Cambio total · {n} pesajes",
    chartLost:"perdidos", chartGained:"ganados", chartNoChange:"sin cambios ⚖️",
    chartInitialWeight:"Peso inicial ({d})",
    chartGoalReached:"🎯 ¡Objetivo alcanzado!", chartGoalSection:"🎯 Objetivo",
    chartGoalTarget:"Meta: {n} kg",
    chartGoalUpdate:"¡Actualiza tu objetivo!",
    chartGoalRemaining:"Te faltan {n} kg", chartGoalExcess:"Te sobran {n} kg",
    chartTooltipTrend:"Tendencia:",
    // Rewards modal
    rewardsTitle:"Recompensas", rewardsByLevel:"Por nivel", rewardsClose:"✕ Cerrar",
    rewardsAll:"Todos", rewardsFreeMeal:"🍽️ Comida libre",
    rewardsReports:"📊 Informes", rewardsFrames:"🖼️ Marcos",
    rewardsFreeMealTag:"🍽️ Comida libre", rewardsChampion:"🏆 CAMPEÓN",
    rewardsShowingLevels:"Mostrando primeros 200 niveles · {n} niveles restantes para el máximo",
    // Challenges banner
    challengeBanner:"Racha en peligro · Pesaje semanal · Dieta diaria",
    // Register weight button
    registerWeightBtn:"⚖️ Registrar peso de hoy",
    // Recetario personal
    myRecipeBook:"📖 Mi recetario",
    recipeBookEmpty:"Aún no tienes recetas guardadas",
    recipeBookEmptyDesc:"Guarda la receta del día para construir tu colección personal.",
    saveRecipe:"💾 Guardar · 20 💎",
    recipeAlreadySaved:"✓ Guardada en tu recetario",
    recipeSavedToast:"¡Receta guardada! -20 💎",
    recipeDeleteFromBook:"Eliminar del recetario",
    recipeTabDaily:"Receta del día",
    recipeTabBook:"Mi recetario",
    // Landing page
    landingHeadline:"Tu dieta, convertida en juego",
    landingTagline:"Registra hábitos, sube de nivel y alcanza tu objetivo de peso.",
    landingF1:"Registra dieta, agua, pasos y sueño",
    landingF2:"Sube de nivel y gana recompensas",
    landingF3:"Compite en el ranking con otros",
    landingF4:"Sigue tu evolución de peso real",
    landingCTA:"Empezar gratis 🚀",
    landingLogin:"Ya tengo cuenta → Entrar",
    landingFree:"Gratis · Sin publicidad · Sin suscripción",
  },
  en:{
    tagline:"Your healthy habits companion 🌱",
    loading:"Loading GBH…",
    email:"Email", emailPH:"name@example.com",
    fullName:"Full name", namePH:"First Last",
    currentWeight:"Current weight", goalWeight:"Goal weight",
    weightHint:"💡 This will be your starting point in the progress chart",
    goalHint:"🎯 Optional — helps you see how far you have to go",
    checkingAccount:"Checking account...",
    welcomeBack:"Welcome back, {n}!",
    accountExists:"Your account exists — enter your password to sign in.",
    verifying:"Verifying...",
    recoverAccount:"Sign in 🔓",
    startAdventure:"Start my adventure! 🚀",
    noConnRecover:"No connection. Connect to the internet to recover your account.",
    // Password
    password:"Password", passwordPH:"At least 6 characters",
    passwordConfirm:"Confirm password", passwordConfirmPH:"Repeat your password",
    passwordShow:"Show", passwordHide:"Hide",
    passwordMismatch:"Passwords don't match.",
    passwordTooShort:"Password must be at least 6 characters.",
    passwordWrong:"Wrong password. Please try again.",
    forgotPassword:"Forgot your password?",
    forgotPasswordSent:"📧 We've sent you a password reset email.",
    forgotPasswordErr:"Couldn't send the email. Please try again.",
    // Migration for existing users without password
    migrateTitle:"Protect your account! 🔐",
    migrateDesc:"For added security, create a password for your account. Your data, streak and progress won't be touched.",
    migrateBtn:"Create my password 🔐",
    authErrGeneric:"Sign in error. Please try again.",
    // Nav
    tabHome:"Home", tabRecipe:"Recipe", tabWeight:"Weight",
    tabRanking:"Ranking", tabAchievements:"Medals", tabCalc:"Goal",
    // Tiers / levels
    tiers:["Beginner","Apprentice","Consistent","Committed","Disciplined","Athlete","Expert","Elite","Master","Legend"],
    champion:"GBH Champion",
    // Days (Mon→Sun)
    dayLabels:["M","T","W","T","F","S","S"],
    // Home
    dailyMissions:"🩺 Daily Missions",
    dietBtn:"Log Daily Diet",
    sleepLabel:"Sleep at least 7 hours",
    dietDone:"Today's diet logged! +15 XP",
    completedBadge:"Completed!",
    quiz:"Quiz", quizDone:"Quiz ✓", earnXP:"Earn XP & 💎",
    roulette:"Wheel", rouletteDone:"Wheel ✓",
    spinFree:"Free spin", untilTomorrow:"Until tomorrow",
    streakShield:"🛡️ Streak Shield",
    shieldDesc:"Protects your streak 1 day · {n} available",
    streakLabel:"Streak", gemsLabel:"Gems", progressLabel:"Progress",
    // WeekPath
    weeklyProgress:"📅 Weekly progress",
    daysUnit:"days", dayUnit:"day",
    chestUnlocked:"Chest unlocked! Tap to open it 🎉",
    chestOpenedWeek:"Chest opened this week ✅",
    chestDaysLeft:"{n} more {d} for the weekly chest",
    // XP goal
    weeklyXPGoal:"⚡ Weekly XP goal",
    weeklyXPDone:"🎉 Weekly goal reached! Bonus: +20 XP",
    // Calorie Calculator
    calcTitle:"🔢 Calorie Calculator",
    calcSubtitle:"Daily calories to reach your goal in 3 months",
    calcSex:"Sex", calcMan:"♂ Male", calcWoman:"♀ Female",
    calcHeight:"Height (cm)", calcHeightPH:"e.g. 170",
    calcAge:"Age range", calcActivity:"Activity level",
    calcBtn:"Calculate my calories 🔢",
    calcResultTitle:"Your daily target",
    calcKcal:"kcal / day", calcBMR:"Basal metabolism (BMR)",
    calcTDEE:"Total expenditure (TDEE)", calcAdj:"Goal adjustment",
    calcDeficit:"deficit", calcSurplus:"surplus",
    calcNote:"📌 Always consult your nutritionist before changing your diet.",
    calcNoGoal:"⚠️ Add a goal weight in your profile to see the calorie adjustment.",
    calcNoWeight:"⚠️ Log your current weight first.",
    calcSaved:"📊 Your saved calculation",
    calcEditBtn:"✏️ Edit calculation",
    calcResetBtn:"🔄 Recalculate",
    backToHome:"← Back to home",
    calcAgeRanges:["18 – 25 years","26 – 35 years","36 – 45 years","46 – 55 years","56 – 65 years","Over 65 years"],
    calcActivityLevels:["Sedentary (no exercise)","Light (1-3 days/week)","Moderate (3-5 days/week)","Active (6-7 days/week)","Very active (physical job + exercise)"],
    // Bubbles
    b_celebrating:"🎉 Perfect day, {n}! All missions done",
    b_legend:"👑 {s} days, {n}! Absolute legend",
    b_excited:"🔥 {s} days in a row! Unstoppable, {n}!",
    b_happy:"✅ Diet logged! Keep it up, {n}",
    b_sleeping:"😴 Good rest, {n}. Back at it tomorrow!",
    b_sad_late:"⚠️ {n}, you can still log your diet! Don't break the streak 🔥",
    b_sad:"💚 Hey {n}! Today is the day to start",
    b_default:"Hey {n}! Ready to mark the day? 🌱",
    // Weight tab
    scaleResting:"The scale is resting",
    scaleRestingDesc:"Weighing every day creates unnecessary anxiety.",
    scaleRestingBack:"Come back on the weekend",
    scaleRestingDesc2:"to see your real progress without daily distortion.",
    editWeightTitle:"Edit today's weight",
    howMuchToday:"How much do you weigh today?",
    fastingHint:"💡 Fasted, before breakfast",
    editNote:"✏️ Edit — no gems or XP added",
    saveChanges:"💾 Save changes",
    saveWeight:"✅ Save weight",
    seeChart:"← See chart",
    registerWeightToday:"⚖️ Log today's weight",
    weightBannerTitle:"Log your weight this week!",
    weightBannerCta:"Tap to go to weigh-in →",
    weekendWeighLabel:"✅ Weekend weigh-in",
    firstWeighLine1:"Log your first weigh-in",
    firstWeighLine2:"to see your progress",
    // Recipe tab
    recipeOfDay:"🍰 Recipe of the day",
    calories:"Calories", protein:"Protein", carbs:"Carbs", fat:"Fat",
    ingredients:"🛒 Ingredients", preparation:"👨‍🍳 Preparation",
    buyBtn:"🛒 Buy", buyListSub:"Tick items as you add them to your cart",
    listReset:"🔄 Reset list", listConfirm:"Tap again to confirm ↺",
    loadingRecipe:"Loading recipe...",
    recipeLoadError:"Could not load the recipe.\nCheck your connection.",
    retry:"Retry",
    recipeLocked:"🔒 Locked", recipeNoGems:"💎 No gems",
    recipeChange:"🔄 Change · 10💎",
    availableTomorrow:"Available tomorrow",
    changesLeft:"{n} change{s} left",
    // Ranking
    rankingTitle:"Ranking",
    rankStreak:"Streak", rankXP:"XP", rankWeight:"Weight",
    rankStreakSub:"Consecutive days", rankXPSub:"Total experience",
    rankWeightSub:"Progress since start",
    rankDays:"days", rankLoading:"Loading…",
    rankEmpty:"No data yet",
    rankEmptyDesc:"The ranking will fill up as more patients use the app",
    rankUpdateBtn:"🔄 Refresh",
    // Achievements
    achievementsLabel:"achievements", xpTotalLabel:"total XP",
    gemsStatLabel:"💎 gems",
    noAchievements:"Complete missions to unlock achievements",
    // Profile
    profileFullName:"Full name", profileEmail:"Email",
    profileInitialWeight:"Initial weight", profileGoalWeight:"Goal weight",
    profileHeight:"Height",
    closeBtn:"✕ Close",
    // Height
    heightTitle:"How tall are you?",
    heightHint:"📏 Your height helps us calculate your BMI and personalise your plan",
    // Update banner
    updateAvailable:"New version available",
    updateDesc:"Tap to update the app now",
    updateBtn:"Update",
    // Offline
    offlineBanner:"📵 Offline — data saved locally",
    // Toasts
    insufficientGems:"Insufficient gems",
    needGemsRecipe:"You need 10 💎 to change the recipe",
    needGemsShield:"You need 200 💎 for a Shield",
    shieldActivated:"Shield activated!",
    shieldProtected:"Your streak is protected for 1 day",
    // Error
    errorTitle:"App error", retryBtn:"Retry",
    // Language
    langLabel:"Language",
    // Steps widget
    stepsLabel:"Walk 10,000 steps",
    stepsXP:"+5 XP · {n} / 10,000 steps",
    // Hydration
    hydrationLabel:"Drink 1.5 - 2 L of water",
    hydrationXP:"+5 XP · {g}/{target} glasses",
    hydrationDone:"Completed!",
    hydrationHint:"Tap each glass as you drink it — goal: {target} glasses (≈ 2L)",
    // Tomorrow card
    tomorrowTitle:"Day complete, {n}!",
    tomorrowDesc:"You've completed all missions.",
    tomorrowStreak:"Your streak is {s} 🔥 days.",
    tomorrowBack:"🕐 Come back tomorrow",
    // Weight chart
    chartTitle:"📈 Weight progress",
    chartReal:"Actual", chartTrend:"Trend", chartGoalLabel:"Goal",
    chartTotalChange:"Total change · {n} weigh-ins",
    chartLost:"lost", chartGained:"gained", chartNoChange:"no change ⚖️",
    chartInitialWeight:"Initial weight ({d})",
    chartGoalReached:"🎯 Goal reached!", chartGoalSection:"🎯 Goal",
    chartGoalTarget:"Target: {n} kg",
    chartGoalUpdate:"Update your goal!",
    chartGoalRemaining:"{n} kg to go", chartGoalExcess:"{n} kg over goal",
    chartTooltipTrend:"Trend:",
    // Rewards modal
    rewardsTitle:"Rewards", rewardsByLevel:"By level", rewardsClose:"✕ Close",
    rewardsAll:"All", rewardsFreeMeal:"🍽️ Free meal",
    rewardsReports:"📊 Reports", rewardsFrames:"🖼️ Frames",
    rewardsFreeMealTag:"🍽️ Free meal", rewardsChampion:"🏆 CHAMPION",
    rewardsShowingLevels:"Showing first 200 levels · {n} levels to maximum",
    // Challenges banner
    challengeBanner:"Streak at risk · Weekly weigh-in · Daily diet",
    // Register weight button
    registerWeightBtn:"⚖️ Log today's weight",
    // Recetario personal
    myRecipeBook:"📖 My recipe book",
    recipeBookEmpty:"No saved recipes yet",
    recipeBookEmptyDesc:"Save the daily recipe to build your personal collection.",
    saveRecipe:"💾 Save · 20 💎",
    recipeAlreadySaved:"✓ Saved in your book",
    recipeSavedToast:"Recipe saved! -20 💎",
    recipeDeleteFromBook:"Remove from book",
    recipeTabDaily:"Recipe of the day",
    recipeTabBook:"My book",
    // Landing page
    landingHeadline:"Your diet, turned into a game",
    landingTagline:"Track habits, level up and reach your weight goal.",
    landingF1:"Log diet, water, steps and sleep",
    landingF2:"Level up and earn rewards",
    landingF3:"Compete in the ranking with others",
    landingF4:"Track your real weight progress",
    landingCTA:"Start for free 🚀",
    landingLogin:"I already have an account → Log in",
    landingFree:"Free · No ads · No subscription",
  }
};

// Hook de traducción — usar en cualquier componente funcional
function useLang(){
  const lang = React.useContext(LangCtx);
  return (key, vars={}) => {
    let str = (TRANS[lang]?.[key] ?? TRANS.es[key] ?? key);
    if(Array.isArray(str)) return str; // devuelve array directamente (ej: dayLabels, tiers)
    for(const [k,v] of Object.entries(vars)) str = str.split(`{${k}}`).join(String(v));
    return str;
  };
}

// Traduce el nombre de nivel en tiempo de render
function translateLvName(name, lang){
  if(lang==="es" || !name) return name;
  if(name==="Campeón GBH") return "GBH Champion";
  const es=["Novato","Aprendiz","Constante","Comprometido","Disciplinado","Atleta","Experto","Élite","Maestro","Leyenda"];
  const en=["Beginner","Apprentice","Consistent","Committed","Disciplined","Athlete","Expert","Elite","Master","Legend"];
  for(let i=0;i<es.length;i++) if(name.startsWith(es[i])) return name.replace(es[i],en[i]);
  return name;
}

// ─── Datos de contacto GBH — editar aquí ─────────────────────────────────────
const GBH_WHATSAPP = "34697848500";
const GBH_CALENDLY = "https://calendly.com/gbh-nutricion/20min";

// ─── Sistema de sonido GBH — Web Audio API (sin archivos externos) ────────────
const AudioCtx = (() => {
  let ctx = null;
  return () => {
    if(!ctx) ctx = new (window.AudioContext || window.webkitAudioContext)();
    if(ctx.state === "suspended") ctx.resume();
    return ctx;
  };
})();

const SFX = {
  // Tono suave con envelope
  _tone(freq, type="sine", dur=0.18, vol=0.35, delay=0){
    try{
      const c=AudioCtx(), g=c.createGain(), o=c.createOscillator();
      o.type=type; o.frequency.setValueAtTime(freq,c.currentTime+delay);
      g.gain.setValueAtTime(0,c.currentTime+delay);
      g.gain.linearRampToValueAtTime(vol,c.currentTime+delay+0.01);
      g.gain.exponentialRampToValueAtTime(0.001,c.currentTime+delay+dur);
      o.connect(g); g.connect(c.destination);
      o.start(c.currentTime+delay); o.stop(c.currentTime+delay+dur+0.05);
    }catch{}
  },
  // Ruido filtrado (para efectos de agua, pasos)
  _noise(dur=0.12, freq=800, vol=0.15, delay=0){
    try{
      const c=AudioCtx(), buf=c.createBuffer(1,c.sampleRate*dur,c.sampleRate);
      const d=buf.getChannelData(0); for(let i=0;i<d.length;i++) d[i]=Math.random()*2-1;
      const src=c.createBufferSource(), flt=c.createBiquadFilter(), g=c.createGain();
      src.buffer=buf; flt.type="bandpass"; flt.frequency.value=freq; flt.Q.value=2;
      g.gain.setValueAtTime(vol,c.currentTime+delay);
      g.gain.exponentialRampToValueAtTime(0.001,c.currentTime+delay+dur);
      src.connect(flt); flt.connect(g); g.connect(c.destination);
      src.start(c.currentTime+delay); src.stop(c.currentTime+delay+dur+0.05);
    }catch{}
  },

  // ── Sonidos específicos ───────────────────────────────────────────────────

  // Completar misión diaria (dieta) — acorde triunfal
  complete(){
    this._tone(523,  "sine", 0.15, 0.3,  0);
    this._tone(659,  "sine", 0.15, 0.3,  0.08);
    this._tone(784,  "sine", 0.22, 0.35, 0.16);
  },
  // Misión menor completada (sueño, pasos) — ding doble
  missionDone(){
    this._tone(880, "sine", 0.12, 0.25, 0);
    this._tone(1109,"sine", 0.14, 0.25, 0.1);
  },
  // Ganar XP/gemas — coin clásico
  coin(){
    this._tone(988, "sine",   0.08, 0.3,  0);
    this._tone(1319,"triangle",0.15, 0.28, 0.06);
  },
  // Level up — fanfare épica
  levelUp(){
    [[523,0],[659,0.1],[784,0.2],[1047,0.32]].forEach(([f,d])=>
      this._tone(f,"square",0.18,0.22,d));
    this._tone(1319,"sine",0.4,0.3,0.52);
  },
  // Logro desbloqueado — brillo mágico
  badge(){
    [1047,1319,1568,2093].forEach((f,i)=>this._tone(f,"sine",0.12,0.2,i*0.07));
  },
  // Quiz correcto — éxito
  quizOk(){
    this._tone(659,"sine",  0.1,  0.3, 0);
    this._tone(880,"sine",  0.16, 0.3, 0.09);
  },
  // Quiz incorrecto — error suave
  quizFail(){
    this._tone(330,"triangle",0.12,0.3, 0);
    this._tone(277,"triangle",0.18,0.25,0.1);
  },
  // Ruleta girando — tick repetido
  roulette(ticks=8){
    for(let i=0;i<ticks;i++)
      this._tone(400+Math.random()*200,"square",0.04,0.1,i*0.08);
  },
  // Premio ruleta — fanfare corta
  ruletteWin(){
    this._tone(784,"sine",0.12,0.3,0);
    this._tone(988,"sine",0.12,0.3,0.1);
    this._tone(1175,"sine",0.2,0.35,0.2);
  },
  // Cofre semanal — apertura épica
  chest(){
    this._noise(0.15, 600, 0.2, 0);
    this._tone(392,"sine",0.12,0.25,0.1);
    this._tone(523,"sine",0.12,0.25,0.22);
    this._tone(659,"sine",0.12,0.3, 0.34);
    this._tone(784,"sine",0.3, 0.4, 0.46);
  },
  // Vaso de agua — gota
  water(){
    this._tone(1400,"sine",0.06,0.2,0);
    this._tone(1800,"sine",0.08,0.15,0.04);
    this._tone(2200,"sine",0.05,0.1,0.08);
  },
  // Pasos — tap ligero
  step(){
    this._noise(0.07,1200,0.12,0);
    this._tone(200,"triangle",0.07,0.12,0.02);
  },
  // Error / sin gemas — buzz suave
  error(){
    this._tone(220,"sawtooth",0.08,0.25,0);
    this._tone(196,"sawtooth",0.12,0.2,0.07);
  },
  // Escudo activado — protección mágica
  shield(){
    this._tone(523,"sine",0.1,0.2,0);
    this._tone(784,"sine",0.1,0.2,0.12);
    this._tone(1047,"sine",0.2,0.3,0.24);
  },
  // Nueva receta — plato servido
  recipe(){
    this._tone(659,"sine",0.1,0.2,0);
    this._tone(784,"sine",0.15,0.25,0.1);
  },
  // Tab click — tap suave
  tap(){
    this._tone(600,"sine",0.06,0.12,0);
  },
  // Confetti / celebración — cascada
  confetti(){
    this._tone(880,"sine",0.12,0.18,0);
    this._tone(1047,"sine",0.10,0.15,0.08);
    this._tone(1319,"sine",0.14,0.20,0.16);
    this._tone(1568,"sine",0.10,0.18,0.26);
    this._noise(0.06,1600,0.15,0.10);
  },
  // Celebración de racha — fanfare ascendente con acorde final
  streakCelebration(){
    // Intro: tres notas rápidas ascendentes
    this._tone(523,"sine",  0.12, 0.15, 0);
    this._tone(659,"sine",  0.14, 0.15, 0.12);
    this._tone(784,"sine",  0.16, 0.18, 0.24);
    // Redoble de emoción
    this._noise(0.05, 800, 0.18, 0.38);
    // Acorde triunfal final
    this._tone(1047,"sine",  0.18, 0.35, 0.42);
    this._tone(1319,"triangle",0.14,0.3,  0.50);
    this._tone(1568,"sine",  0.20, 0.5,  0.58);
    // Brillo final
    this._tone(2093,"sine",  0.10, 0.4,  0.85);
  },
};

// Hook para usar sonido con mute toggle persistido
function useSFX(){
  const muted = lsGet("gbh:mute",false);
  return (name,...args)=>{
    if(muted) return;
    SFX[name]?.(...args);
  };
}
const GBH_EMAIL    = "gbh.nutricion@gmail.com";
const GBH_NOMBRE   = "GBH Nutrición";
const GBH_PRIVACY_URL = "https://drive.google.com/file/d/1RXWjKRHGYCe1F20l2w9VOuqA0qshwSvm/view?usp=sharing";
// ─────────────────────────────────────────────────────────────────────────────
import { ComposedChart, Line, XAxis, YAxis, Tooltip, ResponsiveContainer } from "recharts";

// ─── Supabase ────────────────────────────────────────────────────────────────
const SB  = "https://kszytoufvqogcitzbzqs.supabase.co";
const KEY = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Imtzenl0b3VmdnFvZ2NpdHpienFzIiwicm9sZSI6ImFub24iLCJpYXQiOjE3Nzg1OTQzOTgsImV4cCI6MjA5NDE3MDM5OH0.OcOUrgbyAL6aPBSW_hSNapmwSYMV5mNjLrJCmRghg-c";

// ─── Stripe (suscripción Estándar 7 €/mes) ───────────────────────────────────
const STRIPE_PAYMENT_LINK = "https://buy.stripe.com/aFa00k9SL8B32ud4nDbQY00";
const STRIPE_API          = "https://gbh-stripe-production.up.railway.app";

// Abre el checkout de Stripe con el paciente enganchado (client_reference_id):
// el webhook usa ese id para poner plan=standard al completarse el pago.
const abrirCheckoutStripe = (profileId) => {
  if(!profileId) return;
  window.open(`${STRIPE_PAYMENT_LINK}?client_reference_id=${profileId}`, "_blank", "noopener");
};

// Portal de clientes de Stripe (cancelar suscripción / cambiar método de pago).
// Pide la URL de sesión al servicio de Railway y navega a ella.
const abrirPortalStripe = async (profileId) => {
  try{
    const r = await fetch(`${STRIPE_API}/stripe/portal`, {
      method:"POST", headers:{ "Content-Type":"application/json" },
      body: JSON.stringify({ profile_id: profileId }),
    });
    const d = await r.json().catch(()=>null);
    if(r.ok && d?.url){ window.location.href = d.url; return true; }
  }catch(e){ /* sin conexión o servicio caído */ }
  return false;
};

// ─── Supabase Auth helpers (email + password) ─────────────────────────────────
const sbAuth = {
  signUp: async (email, password) => {
    const r = await fetch(`${SB}/auth/v1/signup`, {
      method: "POST",
      headers: { "apikey": KEY, "Content-Type": "application/json" },
      body: JSON.stringify({ email, password }),
    });
    const d = await r.json();
    if (!r.ok) return { error: d.error_description || d.msg || d.message || "Error en registro" };
    // d.user = el usuario creado, d.session = sesión (null si confirm email está ON)
    return { user: d.user, session: d.session };
  },

  signIn: async (email, password) => {
    const r = await fetch(`${SB}/auth/v1/token?grant_type=password`, {
      method: "POST",
      headers: { "apikey": KEY, "Content-Type": "application/json" },
      body: JSON.stringify({ email, password }),
    });
    const d = await r.json();
    if (!r.ok) return { error: d.error_description || d.msg || d.message || "Contraseña incorrecta" };
    // El endpoint /token devuelve access_token, refresh_token, user directamente en d
    // (no en d.session ni d.data)
    const user = d.user || null;
    const access_token = d.access_token || null;
    if(!user || !access_token) return { error: "Respuesta inesperada de Supabase: " + JSON.stringify(d).substring(0,100) };
    return { user, session: d, access_token };
  },

  resetPassword: async (email) => {
    const r = await fetch(`${SB}/auth/v1/recover`, {
      method: "POST",
      headers: { "apikey": KEY, "Content-Type": "application/json" },
      body: JSON.stringify({ email }),
    });
    return r.ok;
  },

  saveSession: (session) => {
    try {
      if(session?.access_token)
        localStorage.setItem(`sb-kszytoufvqogcitzbzqs-auth-token`, JSON.stringify(session));
    } catch {}
  },

  clearSession: () => {
    try { localStorage.removeItem(`sb-kszytoufvqogcitzbzqs-auth-token`); } catch {}
  },
};

// ─── Sesión: validez y refresco automático del token ─────────────────────────
// El access_token de Supabase caduca (~1 h). Si se usa caducado, TODAS las
// peticiones devuelven 401 y la app se queda "muda" (sin plan, sin ranking,
// sin sincronizar peso). Estos helpers comprueban la caducidad y renuevan la
// sesión con el refresh_token sin molestar al usuario.
const getStoredSession = () => {
  try {
    const k = Object.keys(localStorage).find(x => x.includes("auth-token") || x.includes("supabase.auth.token"));
    if(!k) return null;
    return JSON.parse(localStorage.getItem(k) || "null");
  } catch { return null; }
};
const sesionValida = (s) => {
  const tk = s?.access_token || s?.currentSession?.access_token;
  if(!tk) return false;
  let exp = s?.expires_at || s?.currentSession?.expires_at; // epoch en segundos
  if(!exp){
    try { exp = JSON.parse(atob(tk.split(".")[1])).exp; } catch { return true; }
  }
  return (exp * 1000 - Date.now()) > 60000; // margen de 1 min
};
let __refreshPromise = null;
const refreshSession = () => {
  if(__refreshPromise) return __refreshPromise;
  __refreshPromise = (async () => {
    try {
      const s = getStoredSession();
      const rt = s?.refresh_token || s?.currentSession?.refresh_token;
      if(!rt) return null;
      const r = await fetch(`${SB}/auth/v1/token?grant_type=refresh_token`, {
        method: "POST",
        headers: { "apikey": KEY, "Content-Type": "application/json" },
        body: JSON.stringify({ refresh_token: rt }),
      });
      const d = await r.json().catch(() => null);
      if(r.ok && d?.access_token){ sbAuth.saveSession(d); return d; }
      // refresh_token inválido/caducado: limpiar para que sbReq use la anon key
      if(r.status === 400 || r.status === 401) sbAuth.clearSession();
      return null;
    } catch { return null; }
    finally { setTimeout(() => { __refreshPromise = null; }, 0); }
  })();
  return __refreshPromise;
};

// ─── Raciones: escalado de recetas en cliente ─────────────────────────────────
// El generador ya entrega cada receta escalada (kcal, macros e ingredientes son
// los de LA RACIÓN del paciente). Estos helpers replican ese escalado para la
// función "Cambiar receta", que coge recetas base del recetario.
const RACION_FRACCIONES = [[0.25,"¼"],[0.33,"⅓"],[0.5,"½"],[0.67,"⅔"],[0.75,"¾"]];
const racionFmtCantidad = (v, esPeso) => {
  if(esPeso){ return String(Math.max(5, Math.round(v/5)*5)); }
  v = Math.round(v*4)/4; // unidades sueltas: a cuartos (2.1 → 2, 1.3 → 1 ¼)
  const ent = Math.floor(v); const resto = v - ent;
  for(const [f,s] of RACION_FRACCIONES){ if(Math.abs(resto-f)<=0.06) return ent? `${ent} ${s}` : s; }
  if(resto<=0.06) return String(v>=0.5?Math.max(ent,1):"¼");
  if(resto>=0.94) return String(ent+1);
  return String(Math.round(v*10)/10);
};
const escalarIngredientesJS = (texto, factor) => {
  if(!texto || Math.abs(factor-1)<0.02) return texto;
  const NO_ESCALAR = ["pizca","al gusto","opcional","para decorar"];
  return String(texto).split(",").map(tr=>{
    const trNorm = tr.normalize("NFD").replace(/[\u0300-\u036f]/g,"").toLowerCase();
    if(NO_ESCALAR.some(k=>trNorm.includes(k))) return tr;
    // entero+fracción unicode → decimal correcto ("1½"→1.5, no "10.5"): captura
    // el entero pegado a la fracción. El replace ingenuo inflaba las cantidades.
    const _FR={"½":0.5,"¼":0.25,"¾":0.75,"⅓":1/3,"⅔":2/3,"⅛":0.125};
    let t = tr.replace(/(\d+)?\s*([½¼¾⅓⅔⅛])/g,(m,e,f)=>String(Math.round(((e?+e:0)+_FR[f])*1000)/1000));
    t = t.replace(/\b(\d+)\s*\/\s*(\d+)\b/g,(m,a,b)=>String(Math.round(a/b*100)/100));
    t = t.replace(/(\d+(?:[.,]\d+)?)(\s*)(g|gr|ml|kg|l)?\b/g,(m,num,sep,un)=>{
      const v = parseFloat(num.replace(",","."))*factor;
      if(un==="kg"||un==="l") return (Math.round(v*100)/100)+sep+un;
      const esPeso = un==="g"||un==="gr"||un==="ml";
      let cant = racionFmtCantidad(v, esPeso);
      if(!un && !sep && !/\d$/.test(cant)) sep=" ";
      return cant + sep + (un||"");
    });
    return t;
  }).join(",");
};
const racionTextoJS = (factor, lang) => {
  const es = [[0.5,"media ración"],[0.67,"2/3 de la receta"],[0.75,"3/4 de la receta"],
              [1.25,"ración y cuarto"],[1.5,"ración y media"],[1.75,"casi ración doble"],[2,"ración doble"]];
  const en = [[0.5,"half portion"],[0.67,"2/3 of the recipe"],[0.75,"3/4 of the recipe"],
              [1.25,"1¼ portion"],[1.5,"1½ portion"],[1.75,"almost double portion"],[2,"double portion"]];
  for(const [v,txt] of (lang==="en"?en:es)){ if(Math.abs(factor-v)<=0.06) return txt; }
  return (lang==="en"?"x":"x")+factor.toFixed(2).replace(".",",")+(lang==="en"?" of the recipe":" de la receta");
};

// ─── Mascot image path (upload avatar.jpg to /public in GitHub) ───────────────

// ─── Design tokens ───────────────────────────────────────────────────────────
const T = {
  // Backgrounds
  bg:     "#0A1A0F",
  bgCard: "#152210",
  bgWood: "#1C1208",
  // Greens
  g1: "#58CC02", g2: "#89E219", g3: "#2B7A00",
  // Gold
  au1: "#FFC800", au2: "#FFB000", au3: "#A07800",
  // Neutrals
  wh: "#FFFFFF", cr: "#F7F0E0",
  t1: "#FFFFFF", t2: "rgba(255,255,255,0.6)", t3: "rgba(255,255,255,0.3)",
  // Accents
  red: "#FF4B4B", blue: "#1CB0F6", pur: "#CE82FF", xp: "#30D5C8",
  // Borders
  bG: "rgba(88,204,2,0.3)", bA: "rgba(255,200,0,0.25)", bW: "rgba(139,100,60,0.5)",
};

// ─── Levels ──────────────────────────────────────────────────────────────────
// ─── Sistema de 500 niveles ──────────────────────────────────────────────────
const TIER_NAMES = [
  "Novato","Aprendiz","Constante","Comprometido","Disciplinado",
  "Atleta","Experto","Élite","Maestro","Leyenda"
];
// XP por tramo: niveles 1-100→30xp, 101-200→60xp, 201-300→90xp, 301-400→120xp, 401-500→150xp
function _xpForLevel(l){ return l<=100?30:l<=200?60:l<=300?90:l<=400?120:150; }
const LEVELS=(()=>{
  const arr=[]; let total=0;
  for(let i=1;i<=500;i++){
    const tier=Math.floor((i-1)/50); // 0-9
    const sub=((i-1)%50)+1;          // 1-50
    const name=i===500?"Campeón GBH":`${TIER_NAMES[Math.min(tier,9)]} ${sub}`;
    arr.push({l:i,n:name,min:total});
    total+=_xpForLevel(i);
  }
  return arr;
})();
// Recompensas por nivel
const LEVEL_REWARDS=(()=>{
  const r={};
  for(let i=1;i<=500;i++){
    const gems = i%50===0?50 : i%25===0?25 : i%10===0?15 : i%5===0?10 : 5;
    const shield  = i%25===0;
    const freeMeal = i%5===0;
    // Informe PDF: nivel 25, luego cada 50 (75, 125, 175...)
    const report = i===25 || (i>25 && (i-25)%50===0);
    // Marco de avatar: nivel 100, 200, 300, 400, 500
    const frame = i%100===0 ? i/100 : 0; // 1-5
    const special = i===500?"🏆 Campeón GBH — Leyenda del programa"
                  : i%100===0?"👑 Hito centenario — 50💎 + Marco Legendario"
                  : i%50===0?"🌟 Hito cincuentena — 50💎 + Escudo"
                  : i%25===0?"💫 Hito — 25💎 + Escudo"
                  : report?"📊 Informe de progreso desbloqueado"
                  : freeMeal?"🍽️ Comida libre ganada"
                  : null;
    r[i]={gems,shield,freeMeal,report,frame,special};
  }
  return r;
})();

// ─── Marcos de avatar por hito ────────────────────────────────────────────────
// frame 0 = sin marco, 1-5 = cada 100 niveles
const FRAMES = {
  0: null,
  1: { // Lv 100 — Plata
    label:"Marco Plata", color:"#C0C0C0",
    border:"3px solid #C0C0C0",
    boxShadow:"0 0 0 2px #888, 0 0 12px rgba(192,192,192,0.6)",
    css:"silver",
  },
  2: { // Lv 200 — Oro
    label:"Marco Oro", color:"#FFD700",
    border:"3px solid #FFD700",
    boxShadow:"0 0 0 2px #B8860B, 0 0 16px rgba(255,215,0,0.7)",
    css:"gold",
  },
  3: { // Lv 300 — Esmeralda
    label:"Marco Esmeralda", color:"#50C878",
    border:"3px solid #50C878",
    boxShadow:"0 0 0 2px #2E8B57, 0 0 18px rgba(80,200,120,0.7)",
    css:"emerald",
  },
  4: { // Lv 400 — Diamante
    label:"Marco Diamante", color:"#89CFF0",
    border:"3px solid #89CFF0",
    boxShadow:"0 0 0 2px #4169E1, 0 0 20px rgba(137,207,240,0.8)",
    css:"diamond",
  },
  5: { // Lv 500 — Leyenda
    label:"Marco Leyenda", color:"#FFD700",
    border:"3px solid transparent",
    boxShadow:"0 0 0 3px #7B2FBE, 0 0 24px rgba(255,100,0,0.9)",
    css:"legend",
  },
};

// Devuelve el marco más alto desbloqueado para un nivel dado
function getFrame(level){ return FRAMES[Math.floor(Math.min(level,500)/100)]||FRAMES[0]; }
const getLevel=(xp)=>LEVELS.slice().reverse().find(lv=>xp>=lv.min)||LEVELS[0];
const getNextLevel=(lv)=>LEVELS[lv.l]||lv; // lv.l is 1-based, LEVELS[lv.l] = next

// ─── Badges ──────────────────────────────────────────────────────────────────
const BADGES=[
  {id:"d1",   icon:"🌱",t:"Primer Paso",       t_en:"First Step",          d:"Primer check-in",            d_en:"First check-in",               xp:20, g:10},
  {id:"s7",   icon:"🔥",t:"Semana de Fuego",    t_en:"Week on Fire",        d:"7 días consecutivos",        d_en:"7 days in a row",              xp:70, g:50},
  {id:"s30",  icon:"💪",t:"Hábito Forjado",     t_en:"Habit Forged",        d:"30 días consecutivos",       d_en:"30 days in a row",             xp:200,g:150,r:"📄 PDF extra de recetas",    r_en:"📄 Extra recipe PDF"},
  {id:"s100", icon:"🏆",t:"Centenario",         t_en:"Centurion",           d:"100 días consecutivos",      d_en:"100 days in a row",            xp:500,g:300,r:"🤝 Consulta presencial gratuita",r_en:"🤝 Free in-person consultation"},
  {id:"s365", icon:"👑",t:"Leyenda GBH",        t_en:"GBH Legend",          d:"365 días seguidos",          d_en:"365 days in a row",            xp:1500,g:1000,r:"📚 Recetario anual completo",r_en:"📚 Full annual recipe book"},
  {id:"w1",   icon:"⚖️",t:"Báscula Activada",   t_en:"Scale Activated",     d:"Primera medición de peso",   d_en:"First weight measurement",     xp:15, g:10},
  {id:"w8",   icon:"📊",t:"8 Semanas al Día",   t_en:"8 Weeks Strong",      d:"8 pesajes registrados",      d_en:"8 weigh-ins logged",           xp:100,g:80},
  {id:"w12",  icon:"📈",t:"Trimestre Fiel",     t_en:"Faithful Quarter",    d:"12 pesajes registrados",     d_en:"12 weigh-ins logged",          xp:200,g:150,r:"🎯 Análisis trimestral personalizado",r_en:"🎯 Personalised quarterly analysis"},
  {id:"pW",   icon:"⭐",t:"Semana Perfecta",    t_en:"Perfect Week",        d:"4 misiones 7 días seguidos", d_en:"4 missions 7 days in a row",   xp:100,g:60},
];

// ─── Helper: obtener pregunta/opciones en el idioma activo ──────────────────
// Las preguntas del QUIZ_RECETARIO sin q_en siguen siempre el mismo patrón.
// En lugar de añadir 50+ campos, usamos sustitución automática.
const MACRO_MAP = {
  "calorías":"calories","grasas":"fat","proteínas":"protein",
  "hidratos de carbono":"carbohydrates"
};
const FACT_MAP  = {
  " grasa":" fat"," prot":" protein"," HC":" carbs"
};
function getQuizQ(q, lang){
  if(lang!=="en") return q.q;
  if(q.q_en) return q.q_en;
  // Auto-traducir: "¿Cuál de estos platos del recetario GBH tiene más X?"
  let out = q.q
    .replace("¿Cuál de estos platos del recetario GBH tiene más ","Which GBH recipe has the most ")
    .replace("?","?");
  Object.entries(MACRO_MAP).forEach(([es,en])=>{ out = out.replace(es,en); });
  return out;
}
function getQuizOpts(q, lang){
  if(lang!=="en") return q.opts;
  return q.opts_en || q.opts; // dish names stay as-is if no opts_en
}
function getQuizFact(q, lang){
  if(lang!=="en"||!q.fact) return q.fact||"";
  if(q.fact_en) return q.fact_en;
  let out = q.fact;
  Object.entries(FACT_MAP).forEach(([es,en])=>{ out = out.replace(es,en); });
  return out;
}
const isWeekend=()=>{const d=new Date().getDay();return d===0||d===6;};
// Clave de día en hora LOCAL (no UTC) → evita que a partir de medianoche en España
// el día se adelante. Formato YYYY-MM-DD, idéntico al anterior.
const toKey=(d=new Date())=>`${d.getFullYear()}-${String(d.getMonth()+1).padStart(2,"0")}-${String(d.getDate()).padStart(2,"0")}`;
// Claves (YYYY-MM-DD) del sábado y domingo de la semana ACTUAL (ancladas al lunes,
// igual que weekDates en getChallengeProgress) → el pesaje es semanal, no diario.
const weekendKeys=()=>{
  const today=new Date(), dow=today.getDay();      // 0=Dom … 6=Sáb
  const monOffset=dow===0?6:dow-1;                 // días transcurridos desde el lunes
  const monday=new Date(); monday.setDate(today.getDate()-monOffset);
  const sat=new Date(monday); sat.setDate(monday.getDate()+5);
  const sun=new Date(monday); sun.setDate(monday.getDate()+6);
  return [toKey(sat), toKey(sun)];
};
// Pesaje ya registrado este fin de semana (sábado o domingo), excluyendo el punto inicial.
const weekendWeighIn=(ws)=>{const ks=weekendKeys();return (ws||[]).find(w=>!w.isInitial&&ks.includes(w.date))||null;};
const WLABELS=["L","M","X","J","V","S","D"];


// ─── localStorage helpers ────────────────────────────────────────────────────
const lsGet=(k,f)=>{try{const v=localStorage.getItem(k);return v?JSON.parse(v):f;}catch{return f;}};
const lsSet=(k,v)=>{try{localStorage.setItem(k,JSON.stringify(v));}catch{}};

// Cookie helpers — sobreviven al borrado de caché del navegador
const cookieSet=(k,v,days=365)=>{try{const d=new Date();d.setTime(d.getTime()+days*864e5);document.cookie=`${k}=${encodeURIComponent(JSON.stringify(v))};expires=${d.toUTCString()};path=/;SameSite=Lax`;}catch{}};
const cookieGet=(k,f=null)=>{try{const m=document.cookie.match(new RegExp('(?:^|; )'+k+'=([^;]*)'));return m?JSON.parse(decodeURIComponent(m[1])):f;}catch{return f;}};

// Guardar lastEmail siempre en cookie además de localStorage
const saveLastEmail=(email)=>{lsSet("gbh:lastEmail",email);cookieSet("gbh_lastEmail",email);};
// Leer lastEmail: primero localStorage, luego cookie
const getLastEmail=()=>lsGet("gbh:lastEmail",null)||cookieGet("gbh_lastEmail",null);

// ─── Cola de sincronización offline ──────────────────────────────────────────
// Cada operación que no llega a Supabase se encola en localStorage.
// Cuando vuelve la conexión, se vacía automáticamente.
const QUEUE_KEY_BASE = "gbh:sync_queue";
// La cola se escopa por profile_id para evitar que operaciones pendientes de
// un usuario se ejecuten en la sesión de otro (varios usuarios en 1 móvil).
let _activeProfileId = null;
const getQueueKey  = () => _activeProfileId ? `${QUEUE_KEY_BASE}:${_activeProfileId}` : QUEUE_KEY_BASE;
const migrateQueue = (pid) => {
  try{
    const old = lsGet(QUEUE_KEY_BASE, []);
    if(old.length){ lsSet(`${QUEUE_KEY_BASE}:${pid}`, [...lsGet(`${QUEUE_KEY_BASE}:${pid}`,[]), ...old]); lsSet(QUEUE_KEY_BASE, []); }
  }catch{}
};

function enqueue(op){
  // op = { id, method, path, body, ts }
  const q = lsGet(getQueueKey(), []);
  // Si ya existe la misma path+method, reemplazar (evita duplicados de PATCH)
  const idx = q.findIndex(x => x.path === op.path && x.method === op.method);
  if(idx >= 0) q[idx] = op; else q.push(op);
  lsSet(getQueueKey(), q);
}

async function flushQueue(){
  const q = lsGet(getQueueKey(), []);
  if(!q.length) return;
  const failed = [];
  for(const op of q){
    try{
      const r = await fetch(`${SB}/rest/v1/${op.path}`, {
        method: op.method,
        headers: {
          "apikey": KEY,
          "Authorization": `Bearer ${KEY}`,
          "Content-Type": "application/json",
          "Prefer": op.method==="POST" ? "return=representation, resolution=merge-duplicates" : "",
        },
        body: op.body ? JSON.stringify(op.body) : null,
      });
      if(!r.ok){
        op.tries = (op.tries || 0) + 1;
        // 4xx persistente (columna/índice inexistente…): descartar tras 10 intentos
        if(op.tries < 10 || r.status >= 500) failed.push(op);
        else console.warn("[cola] operación descartada tras 10 fallos:", op.method, op.path, r.status);
      }
    } catch {
      failed.push(op); // sin red, volver a encolar
    }
  }
  lsSet(getQueueKey(), failed); // sólo quedan los que fallaron
  return failed.length === 0;
}

// ─── Estado semanal persistente (profiles.weekly_state) ──────────────────────
// Desafíos reclamados, cofres y XP semanal vivían SOLO en localStorage: al
// borrar caché se podían volver a reclamar (gemas infinitas). Ahora todo se
// guarda también en Supabase y se restaura al iniciar sesión.
const WSTATE_KEY = (id) => `gbh:wstate:${id}`;
const mergeWeeklyState = (profileId, patch) => {
  const cur = lsGet(WSTATE_KEY(profileId), {}) || {};
  const merged = { ...cur };
  for(const [k, v] of Object.entries(patch || {})){
    if(v && typeof v === "object" && !Array.isArray(v)) merged[k] = { ...(cur[k] || {}), ...v };
    else merged[k] = v;
  }
  // Poda: conservar solo las 6 semanas más recientes por clave
  for(const k of ["challenges", "weekChest", "weekXP"]){
    const o = merged[k]; if(!o) continue;
    const keys = Object.keys(o).sort();
    if(keys.length > 6) keys.slice(0, keys.length - 6).forEach(kk => delete o[kk]);
  }
  lsSet(WSTATE_KEY(profileId), merged);
  return merged;
};

// ─── sbDirect: petición directa SIN cola offline ──────────────────────────────
// Para (a) escrituras opcionales que no deben envenenar la cola si la columna
// aún no existe en Supabase, y (b) reintentos con payload reducido.
const sbDirect = async (method, path, body) => {
  try{
    const r = await fetch(`${SB}/rest/v1/${path}`, {
      method,
      headers: {
        "apikey": KEY, "Authorization": `Bearer ${KEY}`,
        "Content-Type": "application/json",
        ...(method === "POST" ? { "Prefer": "return=representation, resolution=merge-duplicates" } : {}),
      },
      body: body ? JSON.stringify(body) : undefined,
    });
    let data = null;
    try { data = await r.json(); } catch {}
    return { ok: r.ok, status: r.status, data };
  } catch { return { ok: false, status: 0, data: null }; }
};

// Escritura best-effort de weekly_state: si la columna aún no existe (SQL
// pendiente), falla en silencio sin romper nada ni encolar reintentos.
const patchWeeklyState = (profileId, merged) => {
  sbDirect("PATCH", `profiles?id=eq.${profileId}`, { weekly_state: merged });
};

// ─── sbReq: offline-first ────────────────────────────────────────────────────
// GET → siempre intenta red, sin encolar si falla
// POST/PATCH → intenta red; si falla, encola para después
const sbReq = async(method, path, body=null) => {
  // SIEMPRE la anon key para las llamadas de datos.
  // Lección aprendida: enviar el token del usuario rompía las lecturas de
  // recipes/saved_recipes (las políticas RLS están definidas para el rol
  // anon; el rol authenticated no las hereda si se crearon con TO anon).
  // Las políticas de la app no usan auth.uid() en ningún sitio, así que el
  // token de usuario no aporta nada aquí: queda SOLO para el login (sbAuth).
  const bearerToken = KEY;
  try {
    const sesion = getStoredSession();
    if(sesion && !sesionValida(sesion)) refreshSession(); // mantener viva la sesión del login
  } catch {}
  const headers = {
    "apikey": KEY,
    "Authorization": `Bearer ${bearerToken}`,
    "Content-Type": "application/json",
    "Prefer": method==="POST" ? "return=representation, resolution=merge-duplicates" : "",
  };
  try {
    const r = await fetch(`${SB}/rest/v1/${path}`, {
      method, headers, body: body ? JSON.stringify(body) : null,
    });
    if(!r.ok) throw new Error(`${r.status}`);
    return method==="DELETE" ? true : r.json();
  } catch(e) {
    // Sin red o error — encolar si es escritura
    if(method !== "GET" && body){
      enqueue({ id: crypto.randomUUID(), method, path, body, ts: Date.now() });
    }
    return null;
  }
};



// ─── Avatar base GBH (oveja 3D) — fondo transparente ────────────────────────
// Las 3 resoluciones evitan re-escalar en cada uso

// ─── Paleta del sprite ───────────────────────────────────────────────────────
const PAL = {
  W: "#FDF6E3", w: "#E3D5B3", F: "#4A3728", f: "#6B5140",
  L: "#3A2A1E", E: "#FFFFFF", B: "#1A120C", P: "#E8837A",
  T: "#7EC8E3", R: "#C0392B", r: "#E74C3C", G: "#F5B800",
  g: "#2D9B5A", K: "#111111", k: "#3A3A3A", M: "#CE82FF",
  C: "#A07848", c: "#8B6040", N: "#1B2A5E", n: "#2E4590",
  D: "#9C9C9C", d: "#7A7A7A", O: "#E8802A", o: "#C4661B",
};

// ─── Colores de lana (desbloqueo por nivel) ──────────────────────────────────
const COLORES = [
  { id:"blanca",  nombre:"Blanca",    W:"#FDF6E3", w:"#E3D5B3", nivel:1  },
  { id:"marron",  nombre:"Marrón",    W:"#9C6B3F", w:"#7D5330", nivel:12 },
  { id:"gris",    nombre:"Gris",      W:"#C9C9C9", w:"#A5A5A5", nivel:15 },
  { id:"azul",    nombre:"Azul",      W:"#6EB9E8", w:"#4E97C6", nivel:33 },
  { id:"negra",   nombre:"Negra",     W:"#4A4A4A", w:"#333333", nivel:50 },
  { id:"roja",    nombre:"Roja",      W:"#E85D5D", w:"#C64444", nivel:62 },
  { id:"naranja", nombre:"Naranja",   W:"#F09A4A", w:"#D57E2E", nivel:82 },
  { id:"rosa",    nombre:"Rosa",      W:"#F7C6D9", w:"#E39BB8", nivel:100 },
  { id:"morada",  nombre:"Morada",    W:"#B78BE0", w:"#9B6CC8", nivel:118 },
  { id:"dalmata", nombre:"Dálmata",   W:"#FDFDFD", w:"#E8E8E8", nivel:130, patron:"dalmata", emoji:"🐶" },
  { id:"payasa",  nombre:"Payasa",    W:"#FDFDFD", w:"#EDEDED", nivel:170, patron:"payaso", emoji:"🤡", caraPropia:true },
  { id:"verde",   nombre:"Verde GBH", W:"#89E219", w:"#58CC02", nivel:200 },
  { id:"esqueleto", nombre:"Esqueleto", W:"#3E3E3E", w:"#2A2A2A", nivel:230, patron:"esqueleto", emoji:"💀", caraPropia:true },
  { id:"arcoiris", nombre:"Arcoíris", W:"#FDF6E3", w:"#E3D5B3", nivel:310, patron:"arcoiris", emoji:"🌈" },
  { id:"dorada",  nombre:"Dorada",    W:"#FFD84D", w:"#E0B000", nivel:400 },
];

// Overlays y transformaciones de los patrones especiales
const ARCOIRIS_FILAS = ["#FF5555","#FF9944","#FFD84D","#7ED957","#4FA8F5","#B57EDC"];
const PATRON_PX = {
  // Patrón de color: mantiene la cara de oveja
  dalmata: [ [4,1,"#333333"],[9,2,"#333333"],[13,3,"#333333"],[2,10,"#333333"],[6,12,"#333333"],[11,11,"#333333"],[3,3,"#333333"] ],
  // Skins de TRANSFORMACIÓN: cara propia fija; la skin manda sobre la oveja
  payaso: [
    // ojos
    [5,7,"#111111"],[10,7,"#111111"],
    // rombos azules de maquillaje sobre y bajo los ojos
    [5,6,"#4FA8F5"],[10,6,"#4FA8F5"],[5,8,"#4FA8F5"],[10,8,"#4FA8F5"],
    // nariz roja de bola
    [7,8,"#E74C3C"],[8,8,"#E74C3C"],[7,9,"#C0392B"],[8,9,"#C0392B"],
    // sonrisa gigante pintada, de comisura a comisura
    [4,9,"#E74C3C"],[11,9,"#E74C3C"],
    [5,10,"#E74C3C"],[6,10,"#E74C3C"],[7,10,"#E74C3C"],[8,10,"#E74C3C"],[9,10,"#E74C3C"],[10,10,"#E74C3C"],
  ],
  esqueleto: [
    // cuencas negras grandes (2x2)
    [5,6,"#111111"],[6,6,"#111111"],[5,7,"#111111"],[6,7,"#111111"],
    [9,6,"#111111"],[10,6,"#111111"],[9,7,"#111111"],[10,7,"#111111"],
    // hueco nasal
    [7,8,"#111111"],[8,8,"#111111"],
    // boca: barra negra con dentadura blanca separada debajo
    [5,9,"#111111"],[6,9,"#111111"],[7,9,"#111111"],[8,9,"#111111"],[9,9,"#111111"],[10,9,"#111111"],
    [6,10,"#111111"],[8,10,"#111111"],[10,10,"#111111"],
  ],
};

const BASE = [
  "................",
  "....WWWWWWWW....",
  "..WWWWWWWWWWWW..",
  ".WWWWWWWWWWWWWW.",
  "FFWWWWWWWWWWWWFF",
  "FFWWFFFFFFFFWWFF",
  ".WWFFFFFFFFFFWW.",
  ".WWFFFFFFFFFFWW.",
  ".WWFFFFFFFFFFWW.",
  ".WWFFFFFFFFFFWW.",
  ".WWWFFFFFFFFWWW.",
  "..WWWWWWWWWWWW..",
  "..wWWWWWWWWWWw..",
  "....LL....LL....",
  "....LL....LL....",
  "................",
];

// Overlays de cara por estado: [x, y, colorKey]
const FACES = {
  feliz: [
    [5,7,"E"],[6,7,"E"],[9,7,"E"],[10,7,"E"],[5,6,"E"],[10,6,"E"],
    [4,8,"P"],[11,8,"P"],
    [6,9,"f"],[7,10,"f"],[8,10,"f"],[9,9,"f"],
  ],
  normal: [
    [5,7,"E"],[6,7,"B"],[9,7,"B"],[10,7,"E"],
    [7,9,"f"],[8,9,"f"],
  ],
  hambrienta: [
    [5,7,"E"],[6,7,"B"],[9,7,"B"],[10,7,"E"],
    [6,9,"f"],[7,9,"B"],[8,9,"B"],[9,9,"f"],[7,10,"B"],[8,10,"B"],
  ],
  triste: [
    [5,7,"B"],[6,7,"E"],[9,7,"E"],[10,7,"B"],
    [5,8,"T"],[5,9,"T"],
    [6,10,"f"],[7,9,"f"],[8,9,"f"],[9,10,"f"],
  ],
  dormida: [
    [5,7,"f"],[6,7,"f"],[9,7,"f"],[10,7,"f"],
    [7,9,"f"],
  ],
};

// ─── Accesorios (desbloqueo por nivel) ───────────────────────────────────────
const ACCESORIOS = [
  // ── Piezas sueltas ──
  { id:"flor", zona:"cabeza", nombre:"Flor", emoji:"🌸", nivel:3, px:[
    [3,1,"P"],[5,1,"P"],[4,2,"P"],[4,1,"G"] ]},
  { id:"gorro", zona:"cabeza", nombre:"Gorro de lana", emoji:"🧢", nivel:10, px:[
    [7,0,"G"],[8,0,"G"],
    [4,1,"R"],[5,1,"R"],[6,1,"R"],[7,1,"r"],[8,1,"r"],[9,1,"R"],[10,1,"R"],[11,1,"R"],
    [3,2,"r"],[4,2,"R"],[5,2,"r"],[6,2,"R"],[7,2,"R"],[8,2,"R"],[9,2,"r"],[10,2,"R"],[11,2,"r"],[12,2,"R"] ]},
  { id:"corbata", zona:"cuello", nombre:"Corbata", emoji:"👔", nivel:20, px:[
    [7,11,"R"],[8,11,"R"],[7,12,"r"],[8,12,"r"] ]},
  { id:"gafas", zona:"cara", nombre:"Gafas de sol", emoji:"🕶️", nivel:35, px:[
    [3,7,"K"],[4,7,"K"],[5,7,"k"],[6,7,"k"],[7,7,"K"],[8,7,"K"],[9,7,"k"],[10,7,"k"],[11,7,"K"],[12,7,"K"],
    [5,8,"K"],[6,8,"K"],[9,8,"K"],[10,8,"K"] ]},
  // ── Set Chef 👨‍🍳 ──
  { id:"gorrochef", zona:"cabeza", set:"chef", nombre:"Gorro de chef", emoji:"👨‍🍳", nivel:40, px:[
    [5,0,"E"],[6,0,"E"],[7,0,"E"],[8,0,"E"],[9,0,"E"],[10,0,"E"],
    [4,1,"E"],[5,1,"E"],[6,1,"E"],[7,1,"E"],[8,1,"E"],[9,1,"E"],[10,1,"E"],[11,1,"E"],
    [5,2,"E"],[6,2,"w"],[7,2,"E"],[8,2,"E"],[9,2,"w"],[10,2,"E"] ]},
  { id:"panuelochef", zona:"cuello", set:"chef", nombre:"Pañuelo de cocina", emoji:"🍳", nivel:48, px:[
    [5,11,"R"],[6,11,"R"],[7,11,"R"],[8,11,"R"],[9,11,"R"],[10,11,"R"],[10,12,"r"] ]},
  { id:"gorrodormir", zona:"cabeza", nombre:"Gorro de dormir", emoji:"🌙", nivel:55, px:[
    [4,2,"T"],[5,2,"T"],[6,2,"T"],[7,2,"T"],[8,2,"T"],[9,2,"T"],[10,2,"T"],[11,2,"T"],
    [5,1,"T"],[6,1,"T"],[7,1,"T"],[8,1,"T"],[9,1,"T"],[9,0,"T"],[10,0,"T"],[11,0,"E"] ]},
  { id:"bufanda", zona:"cuello", nombre:"Bufanda GBH", emoji:"🧣", nivel:65, px:[
    [3,11,"g"],[4,11,"G"],[5,11,"g"],[6,11,"G"],[7,11,"g"],[8,11,"G"],[9,11,"g"],[10,11,"G"],[11,11,"g"],[12,11,"G"],
    [11,12,"g"],[11,13,"G"] ]},
  // ── Set Vaquero 🤠 ──
  { id:"sombrerovaquero", zona:"cabeza", set:"vaquero", nombre:"Sombrero vaquero", emoji:"🤠", nivel:70, px:[
    [6,0,"C"],[7,0,"C"],[8,0,"C"],[9,0,"C"],
    [5,1,"c"],[6,1,"C"],[7,1,"C"],[8,1,"C"],[9,1,"C"],[10,1,"c"],
    [2,2,"C"],[3,2,"C"],[4,2,"C"],[5,2,"C"],[6,2,"c"],[7,2,"c"],[8,2,"c"],[9,2,"c"],[10,2,"C"],[11,2,"C"],[12,2,"C"],[13,2,"C"] ]},
  { id:"bandana", zona:"cuello", set:"vaquero", nombre:"Bandana", emoji:"🪢", nivel:78, px:[
    [5,11,"C"],[6,11,"C"],[7,11,"C"],[8,11,"C"],[9,11,"C"],[10,11,"C"],[7,12,"c"],[8,12,"c"] ]},
  { id:"cuernos", zona:"cuernos", nombre:"Cuernos de demonio", emoji:"😈", nivel:85, px:[
    [2,0,"R"],[3,0,"r"],[3,1,"R"],[13,0,"R"],[12,0,"r"],[12,1,"R"] ]},
  { id:"cinta", zona:"cabeza", nombre:"Cinta deportiva", emoji:"🏃", nivel:95, px:[
    [3,4,"R"],[4,4,"R"],[5,4,"r"],[6,4,"R"],[7,4,"E"],[8,4,"E"],[9,4,"R"],[10,4,"r"],[11,4,"R"],[12,4,"R"] ]},
  // ── Set Payaso 🤡 ──
  { id:"narizpayaso", zona:"cara", set:"payaso", nombre:"Nariz de payaso", emoji:"🔴", nivel:105, px:[
    [7,8,"R"],[8,8,"R"],[7,9,"r"],[8,9,"r"] ]},
  { id:"peluca", zona:"cabeza", set:"payaso", nombre:"Peluca de colores", emoji:"🤡", nivel:112, px:[
    [3,1,"R"],[4,1,"G"],[5,1,"T"],[10,1,"M"],[11,1,"G"],[12,1,"R"],
    [2,2,"M"],[3,2,"T"],[12,2,"G"],[13,2,"T"],[4,0,"T"],[5,0,"M"],[10,0,"G"],[11,0,"M"] ]},
  { id:"pajarita", zona:"cuello", nombre:"Pajarita", emoji:"🎀", nivel:115, px:[
    [6,11,"M"],[7,11,"M"],[8,11,"G"],[9,11,"M"],[10,11,"M"],[6,12,"M"],[10,12,"M"] ]},
  { id:"lazolunares", zona:"cuello", set:"payaso", nombre:"Lazo de lunares", emoji:"🎪", nivel:122, px:[
    [4,11,"M"],[5,11,"G"],[6,11,"M"],[7,11,"M"],[8,11,"M"],[9,11,"M"],[10,11,"G"],[11,11,"M"],
    [5,12,"M"],[6,12,"G"],[9,12,"G"],[10,12,"M"] ]},
  // ── Set Policía 👮 ──
  { id:"aviador", zona:"cara", set:"policia", nombre:"Gafas de aviador", emoji:"🕶️", nivel:125, px:[
    [4,7,"G"],[5,7,"K"],[6,7,"K"],[7,7,"G"],[8,7,"G"],[9,7,"K"],[10,7,"K"],[11,7,"G"],
    [5,8,"K"],[6,8,"K"],[9,8,"K"],[10,8,"K"] ]},
  { id:"policia", zona:"cabeza", set:"policia", nombre:"Gorra de policía", emoji:"👮", nivel:135, px:[
    [5,0,"N"],[6,0,"N"],[7,0,"N"],[8,0,"N"],[9,0,"N"],[10,0,"N"],
    [4,1,"N"],[5,1,"n"],[6,1,"N"],[7,1,"G"],[8,1,"G"],[9,1,"N"],[10,1,"n"],[11,1,"N"],
    [5,2,"K"],[6,2,"K"],[7,2,"K"],[8,2,"K"],[9,2,"K"],[10,2,"K"] ]},
  // ── Set Enfermería 👩‍⚕️ ──
  { id:"cofia", zona:"cabeza", set:"enfermeria", nombre:"Cofia sanitaria", emoji:"⚕️", nivel:145, px:[
    [5,1,"E"],[6,1,"E"],[7,1,"R"],[8,1,"R"],[9,1,"E"],[10,1,"E"],
    [4,2,"E"],[5,2,"E"],[6,2,"E"],[7,2,"R"],[8,2,"R"],[9,2,"E"],[10,2,"E"],[11,2,"E"] ]},
  { id:"mascarilla", zona:"cara", set:"enfermeria", nombre:"Mascarilla", emoji:"😷", nivel:150, px:[
    [5,9,"T"],[6,9,"T"],[7,9,"T"],[8,9,"T"],[9,9,"T"],[10,9,"T"],
    [6,10,"T"],[7,10,"T"],[8,10,"T"],[9,10,"T"] ]},
  { id:"aureola", zona:"cabeza", nombre:"Aureola de ángel", emoji:"😇", nivel:155, px:[
    [5,0,"G"],[6,0,"G"],[7,0,"G"],[8,0,"G"],[9,0,"G"],[10,0,"G"] ]},
  { id:"fonendo", zona:"cuello", set:"enfermeria", nombre:"Fonendoscopio", emoji:"🩺", nivel:160, px:[
    [5,11,"k"],[6,11,"k"],[7,11,"k"],[8,11,"k"],[9,11,"k"],[10,11,"k"],[8,12,"E"],[8,13,"G"] ]},
  { id:"capa", zona:"espalda", nombre:"Capa de héroe", emoji:"🦸", nivel:180, px:[
    [1,9,"R"],[1,10,"R"],[1,11,"r"],[1,12,"R"],[2,10,"r"],[2,11,"R"],[2,12,"r"],[2,13,"R"],[1,13,"r"] ]},
  // ── Set Pirata 🏴‍☠️ ──
  { id:"parche", zona:"cara", set:"pirata", nombre:"Parche pirata", emoji:"🏴‍☠️", nivel:190, px:[
    [4,6,"k"],[5,6,"k"],[6,6,"k"],[7,6,"k"],[8,6,"k"],[11,6,"k"],
    [9,6,"k"],[10,6,"k"],[9,7,"K"],[10,7,"K"],[9,8,"K"],[10,8,"K"] ]},
  { id:"tricornio", zona:"cabeza", set:"pirata", nombre:"Tricornio", emoji:"🦜", nivel:200, px:[
    [5,1,"K"],[6,1,"K"],[7,1,"E"],[8,1,"E"],[9,1,"K"],[10,1,"K"],
    [3,2,"K"],[4,2,"K"],[5,2,"K"],[6,2,"K"],[7,2,"K"],[8,2,"K"],[9,2,"K"],[10,2,"K"],[11,2,"K"],[12,2,"K"] ]},
  { id:"loro", zona:"espalda", set:"pirata", nombre:"Loro al hombro", emoji:"🦜", nivel:210, px:[
    [14,8,"g"],[15,8,"G"],[13,9,"g"],[14,9,"g"],[13,10,"R"],[14,10,"g"],[14,11,"g"] ]},
  { id:"soldado", zona:"cabeza", nombre:"Casco de soldado", emoji:"🪖", nivel:220, px:[
    [6,0,"g"],[7,0,"g"],[8,0,"g"],[9,0,"g"],
    [4,1,"g"],[5,1,"g"],[6,1,"g"],[7,1,"g"],[8,1,"g"],[9,1,"g"],[10,1,"g"],[11,1,"g"],
    [3,2,"g"],[4,2,"g"],[5,2,"g"],[6,2,"g"],[7,2,"g"],[8,2,"g"],[9,2,"g"],[10,2,"g"],[11,2,"g"],[12,2,"g"] ]},
  { id:"carnero", zona:"cuernos", nombre:"Cuernos de carnero", emoji:"🐏", nivel:240, px:[
    [2,2,"C"],[1,3,"C"],[1,4,"C"],[2,5,"C"],[3,5,"c"],[2,3,"c"],[2,4,"C"],
    [13,2,"C"],[14,3,"C"],[14,4,"C"],[13,5,"C"],[12,5,"c"],[13,3,"c"],[13,4,"C"] ]},
  // ── Set Mago 🧙 ──
  { id:"sombreromago", zona:"cabeza", set:"mago", nombre:"Sombrero de mago", emoji:"🧙", nivel:250, px:[
    [7,0,"M"],[8,0,"M"],[6,1,"M"],[7,1,"G"],[8,1,"M"],[9,1,"M"],
    [4,2,"M"],[5,2,"G"],[6,2,"M"],[7,2,"M"],[8,2,"M"],[9,2,"M"],[10,2,"G"],[11,2,"M"] ]},
  { id:"capaestrellas", zona:"espalda", set:"mago", nombre:"Capa estrellada", emoji:"✨", nivel:260, px:[
    [1,9,"M"],[1,10,"M"],[1,11,"G"],[1,12,"M"],[2,10,"M"],[2,11,"M"],[2,12,"G"],[2,13,"M"],[1,13,"M"] ]},
  { id:"alitas", zona:"espalda", nombre:"Alitas de ángel", emoji:"👼", nivel:280, px:[
    [0,8,"E"],[0,9,"E"],[1,9,"E"],[0,10,"E"],[1,10,"E"],[1,11,"E"],[0,11,"E"],
    [15,8,"E"],[15,9,"E"],[14,9,"E"],[15,10,"E"],[14,10,"E"],[14,11,"E"],[15,11,"E"] ]},
  // ── Set Ricachón 🎩 ──
  { id:"chistera", zona:"cabeza", set:"ricachon", nombre:"Chistera", emoji:"🎩", nivel:290, px:[
    [5,0,"K"],[6,0,"K"],[7,0,"K"],[8,0,"K"],[9,0,"K"],[10,0,"K"],
    [5,1,"K"],[6,1,"G"],[7,1,"G"],[8,1,"G"],[9,1,"G"],[10,1,"K"],
    [3,2,"K"],[4,2,"K"],[5,2,"K"],[6,2,"K"],[7,2,"K"],[8,2,"K"],[9,2,"K"],[10,2,"K"],[11,2,"K"],[12,2,"K"] ]},
  { id:"monoculo", zona:"cara", set:"ricachon", nombre:"Monóculo", emoji:"🧐", nivel:300, px:[
    [9,7,"G"],[10,7,"E"],[9,8,"E"],[10,8,"G"],[11,9,"G"],[11,10,"G"] ]},
  // ── Set Campeón 🥇 ──
  { id:"cinturon", zona:"cuello", set:"campeon", nombre:"Cinturón de campeón", emoji:"🥇", nivel:320, px:[
    [4,12,"G"],[5,12,"G"],[6,12,"G"],[7,12,"E"],[8,12,"E"],[9,12,"G"],[10,12,"G"],[11,12,"G"] ]},
  { id:"corona", zona:"cabeza", set:"campeon", nombre:"Corona Campeón", emoji:"👑", nivel:350, px:[
    [5,0,"G"],[7,0,"G"],[8,0,"G"],[10,0,"G"],
    [5,1,"G"],[6,1,"G"],[7,1,"G"],[8,1,"G"],[9,1,"G"],[10,1,"G"] ]},
  // ── Sets de animales ──
  { id:"orejasburro", zona:"orejas", set:"burro", nombre:"Orejas de burro", emoji:"🫏", nivel:25, px:[
    [1,0,"D"],[2,0,"D"],[1,1,"D"],[2,1,"P"],[1,2,"D"],[2,2,"D"],[2,3,"d"],
    [13,0,"D"],[14,0,"D"],[14,1,"D"],[13,1,"P"],[13,2,"D"],[14,2,"D"],[13,3,"d"] ]},
  { id:"colaburro", zona:"cola", set:"burro", nombre:"Cola de burro", emoji:"🪢", nivel:60, px:[
    [0,10,"D"],[0,11,"D"],[0,12,"D"],[0,13,"k"],[1,13,"k"] ]},
  { id:"orejasconejo", zona:"orejas", set:"conejo", nombre:"Orejas de conejo", emoji:"🐰", nivel:90, px:[
    [1,0,"E"],[2,0,"E"],[1,1,"E"],[2,1,"P"],[1,2,"E"],[2,2,"E"],
    [13,0,"E"],[14,0,"E"],[13,1,"P"],[14,1,"E"],[13,2,"E"],[14,2,"E"] ]},
  { id:"colaconejo", zona:"cola", set:"conejo", nombre:"Cola de pompón", emoji:"⚪", nivel:165, px:[
    [0,11,"E"],[1,11,"E"],[0,12,"E"],[1,12,"E"] ]},
  { id:"picobuho", zona:"cara", set:"buho", nombre:"Pico de búho", emoji:"🦉", nivel:235, px:[
    [7,8,"O"],[8,8,"O"],[7,9,"o"],[8,9,"o"] ]},
  { id:"penachos", zona:"orejas", set:"buho", nombre:"Penachos de búho", emoji:"🪶", nivel:270, px:[
    [2,0,"w"],[3,0,"w"],[2,1,"w"],[12,0,"w"],[13,0,"w"],[13,1,"w"] ]},
  { id:"orejaszorro", zona:"orejas", set:"zorro", nombre:"Orejas de zorro", emoji:"🦊", nivel:330, px:[
    [2,0,"o"],[1,1,"O"],[2,1,"O"],[3,1,"O"],[2,2,"O"],
    [13,0,"o"],[12,1,"O"],[13,1,"O"],[14,1,"O"],[13,2,"O"] ]},
  { id:"colazorro", zona:"cola", set:"zorro", nombre:"Cola de zorro", emoji:"🦊", nivel:360, px:[
    [0,10,"O"],[1,10,"O"],[0,11,"O"],[1,11,"O"],[0,12,"E"],[1,12,"E"] ]},
  { id:"cuernounicornio", zona:"cuernos", set:"unicornio", nombre:"Cuerno de unicornio", emoji:"🦄", nivel:380, px:[
    [7,0,"G"],[8,0,"P"],[7,1,"P"],[8,1,"G"] ]},
  { id:"colaunicornio", zona:"cola", set:"unicornio", nombre:"Cola de unicornio", emoji:"🌈", nivel:420, px:[
    [0,10,"R"],[1,10,"M"],[0,11,"G"],[1,11,"P"],[0,12,"T"],[1,12,"M"] ]},
];

// ─── Conjuntos temáticos: visten varias zonas de golpe ───────────────────────
const CONJUNTOS = [
  { id:"chef", nombre:"Chef", emoji:"👨‍🍳", piezas:["gorrochef","panuelochef"] },
  { id:"vaquero", nombre:"Vaquero", emoji:"🤠", piezas:["sombrerovaquero","bandana"] },
  { id:"payaso", nombre:"Payaso", emoji:"🤡", piezas:["peluca","narizpayaso","lazolunares"] },
  { id:"policia", nombre:"Policía", emoji:"👮", piezas:["policia","aviador","corbata"] },
  { id:"enfermeria", nombre:"Enfermería", emoji:"⚕️", piezas:["cofia","mascarilla","fonendo"] },
  { id:"angel", nombre:"Ángel", emoji:"😇", piezas:["aureola","alitas"] },
  { id:"pirata", nombre:"Pirata", emoji:"🏴‍☠️", piezas:["tricornio","parche","loro"] },
  { id:"mago", nombre:"Mago", emoji:"🧙", piezas:["sombreromago","capaestrellas"] },
  { id:"ricachon", nombre:"Ricachón", emoji:"🎩", piezas:["chistera","monoculo","pajarita"] },
  { id:"clasica", nombre:"Oveja clásica GBH", emoji:"🐏", piezas:["carnero"], color:"verde" },
  { id:"campeon", nombre:"Campeón GBH", emoji:"🥇", piezas:["corona","cinturon","capa"] },
  { id:"burro", nombre:"Burro", emoji:"🫏", piezas:["orejasburro","colaburro"], color:"gris" },
  { id:"conejo", nombre:"Conejo", emoji:"🐰", piezas:["orejasconejo","colaconejo"], color:"blanca" },
  { id:"buho", nombre:"Búho verde", emoji:"🦉", piezas:["penachos","picobuho"], color:"verde" },
  { id:"zorro", nombre:"Zorro", emoji:"🦊", piezas:["orejaszorro","colazorro"], color:"naranja" },
  { id:"unicornio", nombre:"Unicornio", emoji:"🦄", piezas:["cuernounicornio","colaunicornio"], color:"arcoiris" },
];

// ─── Repositorio de mensajes ─────────────────────────────────────────────────
// 50 píldoras de nutrición + mensajes de estado de la mascota.
// En producción: 60% probabilidad de consejo, 40% mensaje de estado.
const TIPS_NUTRICION = [
  "La proteína es el macro más saciante: inclúyela en cada comida 💪",
  "La fibra de verduras y legumbres alimenta a tus bacterias buenas 🦠",
  "Beber agua antes de comer ayuda a regular el apetito 💧",
  "Dormir menos de 7h aumenta el hambre al día siguiente 😴",
  "El peso diario oscila; lo que importa es la tendencia semanal 📈",
  "Los huevos son de las proteínas más completas que existen 🥚",
  "Caminar 10 min después de comer mejora tu glucosa 🚶",
  "La fruta entera sacia mucho más que su zumo 🍎",
  "Congelar pan y tostarlo baja su índice glucémico 🍞",
  "El pescado azul aporta omega-3: 2-3 veces por semana 🐟",
  "Cocinar en casa te da control total de lo que comes 👨‍🍳",
  "Las legumbres combinan proteína y fibra: dobles puntos ✌️",
  "Masticar despacio da tiempo a que llegue la señal de saciedad 🐢",
  "Un déficit pequeño y sostenido gana a una dieta extrema 🎯",
  "El café solo no rompe el ayuno y puede ayudar a entrenar ☕",
  "Los frutos secos sacian, pero mide el puñado: son densos 🥜",
  "La vitamina D se activa con el sol: sal a pasear ☀️",
  "El yogur natural sin azúcar es un básico proteico 🥛",
  "Planificar el menú semanal evita decisiones impulsivas 📋",
  "Más color en el plato = más variedad de micronutrientes 🌈",
  "La avena aporta beta-glucanos, aliados de tu colesterol 🌾",
  "El alcohol suma calorías vacías y frena la recuperación 🚫",
  "Entrenar fuerza protege tu músculo mientras pierdes grasa 🏋️",
  "Las especias dan sabor sin sumar calorías: úsalas sin miedo 🌶️",
  "Pésate siempre en las mismas condiciones: ayunas, sin ropa ⚖️",
  "El aceite de oliva virgen extra es grasa de calidad, con medida 🫒",
  "Verdura en comida y cena: la mitad del plato es buena regla 🥦",
  "Retener líquidos tras entrenar o con estrés es normal 💦",
  "El chocolate >85% puede caber en tu plan con moderación 🍫",
  "Saltarte una comida no arruina nada: retoma en la siguiente 🔄",
  "Los carbohidratos no engordan por sí solos: cuenta el total 🍚",
  "Batido de proteína: útil si no llegas con comida real 🥤",
  "Los ultraprocesados están diseñados para que no pares de comer ⚠️",
  "El desayuno no es obligatorio: hazlo si te sienta bien 🌅",
  "La sal en exceso retiene agua: ojo con salsas y snacks 🧂",
  "Comer proteína en la cena ayuda a la recuperación nocturna 🌙",
  "Las claras son proteína pura, pero la yema tiene los nutrientes 🍳",
  "10.000 pasos diarios queman más de lo que crees 👟",
  "El hambre emocional pasa; el hambre real crece poco a poco 🧠",
  "Los lácteos enteros sacian más que los desnatados 🧀",
  "Cocina de más y guarda raciones: tu yo del martes lo agradece 🍱",
  "El té verde hidrata y aporta antioxidantes 🍵",
  "Un gramo de grasa tiene 9 kcal; proteína y carbos, 4 ⚡",
  "La creatina es de los suplementos con más evidencia 🔬",
  "Comer despacio y sin pantallas reduce lo que ingieres 📵",
  "El pan integral de verdad lleva harina integral como 1er ingrediente 🔍",
  "Tus músculos son tu seguro de vida metabólico: cuídalos 🛡️",
  "Las palomitas caseras son el snack de cine más ligero 🍿",
  "Un capricho planificado no es un fracaso: es adherencia 🎉",
  "La constancia imperfecta gana a la perfección intermitente 🏆",
];

const MSGS_ESTADO = {
  feliz: [
    "¡Hoy lo has bordado! Estoy orgullosa de ti 🥰",
    "¡Beee! Cuando tú cumples, yo salto de alegría 🎉",
    "Racha viva y misiones hechas... ¡así se cuida a una oveja!",
  ],
  normal: [
    "Buen día para sumar: ¿registramos la dieta de hoy?",
    "Aquí ando, pastando tranquila... esperando tus misiones 🌱",
    "Un pasito hoy, otro mañana. Yo te acompaño 🐾",
  ],
  hambrienta: [
    "¡Beee! Tengo hambre... registra tu dieta y comemos juntas 🥗",
    "Mi lana pierde brillo cuando no registras... ¡aliméntame!",
    "¿Hoy no hay registro? Se me hace larga la tarde... 😋",
  ],
  triste: [
    "Te echo de menos... llevamos días sin registrar juntos 💔",
    "Nuestra racha peligra... ¡pero aún estamos a tiempo! 🔥",
    "Una ovejita triste se anima rápido: solo un registro 🥺",
  ],
  dormida: [
    "Zzz... mañana más y mejor... zzz 💤",
    "Día completado... me voy a soñar con praderas verdes 🌙",
    "Descansar también es parte del plan... zzz 😴",
  ],
};

// ─── Caracteres de la mascota (desbloqueo por nivel) ─────────────────────────
// El mensaje base es el mismo; el carácter añade una coletilla al final.
// Regla de oro: las pullitas van sobre la relación con la oveja,
// NUNCA sobre el cuerpo o la comida del paciente.
// ─── Mensajes por contexto (heredados del avatar del inicio) ─────────────────
// En producción son event-driven (getExpr: racha, dieta, hora) y tienen
// PRIORIDAD sobre el resto al abrir la pantalla. Personalizados con nombre y racha.
const MSGS_CONTEXTO = [
  "🎉 ¡Día perfecto, Alejandro! Misiones completadas",
  "👑 ¡112 días, Alejandro! Leyenda absoluta",
  "🔥 ¡12 días seguidos! ¡Imparable, Alejandro!",
  "✅ ¡Dieta registrada! Sigue así, Alejandro",
  "😴 Buen descanso, Alejandro. ¡Mañana a tope!",
  "⚠️ Alejandro, ¡aún puedes registrar la dieta! No pierdas la racha 🔥",
  "💚 ¡Hola Alejandro! Hoy es el día para empezar",
  "¡Hola Alejandro! ¿Listo para marcar el día? 🌱",
];

const PERSONALIDADES = [
  { id:"normal", nombre:"Normal", emoji:"🐑", nivel:1, coletillas:[] },
  { id:"optimista", nombre:"Optimista", emoji:"🌞", nivel:30, coletillas:[
    "¡Y recuerda: tú puedes con esto y con más! 💪",
    "¡Hoy va a ser un día ESTUPENDO, lo presiento!",
    "¡Cada día que pasa estás más cerca! ✨",
    "¡Beee-nial, sigamos así!",
    "¡El rebaño entero cree en ti! 🐑🐑🐑",
    "¡Si yo puedo con esta lana en agosto, tú puedes con todo!",
  ], frases:[
    "¡Tú fíjate en las ovejas americanas! Ellas no dicen 'beee', dicen '¡Yeah, I can do it!'. ¡Pues nosotros igual! ✨",
    "¡No lo llamemos dieta, llamémoslo 'El gran sueño metabólico del rebaño'! ¡Vamos equipo!",
    "¡Si Mahoma no va a la montaña, la oveja sube haciendo zancadas búlgaras! ¡Tú puedes! 💪",
    "¡Hoy eres un 10! Y si te caes, te levantas con más fuerza, ¡como un cordero recién nacido pero con más bíceps!",
    "¡Sonríe, que la vida es un prado sin vallas y tú eres el tractor que lo arrasa todo! 🚜💛",
  ]},
  { id:"gruñona", nombre:"Gruñona", emoji:"😤", nivel:70, coletillas:[
    "...no es que a ti te importe mucho, claro. 🙄",
    "Beee. Sí, lo dice una oveja. ¿Algún problema?",
    "...te lo repito porque ayer ni me escuchaste.",
    "Y no me hagas repetirlo, que se me gasta la lana.",
    "...aunque tú harás lo que te dé la gana, como siempre. 😒",
    "De nada, ¿eh? Un 'gracias' no estaría de más.",
  ], frases:[
    "Que digo yo... tanta proteína, tanto macro y tanta gaita. ¡En mi época pastábamos hierba seca y levantábamos tractores! 🙄",
    "Me traéis loca con la racha. ¡Una racha es lo que me daba mi pastor en el lomo cuando me perdía!",
    "Saben aquel que diu que va una oveja al nutricionista y... bah, déjalo, no tiene gracia. Como tener que repetirte las cosas.",
    "Mucho ayuno intermitente, pero a mí me tienes aquí esperando desde las ocho. 😒",
    "He visto esquilados a trasquilones con más orden que tu forma de registrar las comidas.",
  ]},
  { id:"melancolica", nombre:"Melancólica", emoji:"🌧️", nivel:140, coletillas:[
    "...en fin, todo pasa. Como el otoño en la pradera. ☁️",
    "*suspiro lanudo*... qué bonito era todo antes.",
    "...como decía mi abuela oveja: beee. Cuánta razón tenía.",
    "La vida es un prado... y a veces llueve. 🌧️",
    "...me he acordado de mi esquilada de 2019. No preguntes.",
    "Qué le vamos a hacer... *mira al horizonte*",
  ], frases:[
    "A veces me pregunto... ¿adónde va la pelusa de mi lana cuando me rasco en la valla? Al vacío... como todo. ☁️",
    "La vida es como un tupper mal cerrado en la mochila del gimnasio. Tarde o temprano, la tragedia ocurre. 🌧️",
    "Hoy he visto una nube con forma de brócoli. Luego se ha deshecho. Todo es una metáfora. *suspiro*",
    "¿Para qué contar ovejas para dormir, si al final todas despertamos en el mismo prado de la rutina? 🥺",
    "Ayer me comí un trébol de cuatro hojas. Sigo igual de triste, pero con más fibra. 🍀",
  ]},
  { id:"teatrera", nombre:"Teatrera", emoji:"🎭", nivel:260, coletillas:[
    "¡¡Y ESCRÍBELO EN TU CORAZÓN!! *cae sobre la hierba*",
    "...*pausa dramática*... eso es TODO. Telón. 🎭",
    "¡Oh, destino! ¡Qué sabia soy y qué poco me aplauden!",
    "*se desmaya de la emoción* ...estoy bien, estoy bien.",
    "¡Que conste en acta, ante todo el rebaño! 📜",
    "¡BEEE! Perdón, me he emocionado. *reverencia*",
  ], frases:[
    "¡Por la gloria de mi madre esquilada! ¡Has clavado el día, pedazo de fistro nutricional! 💃",
    "¡Te das cuén! ¡Esa racha tiene más fuego que las calderas del infierno lanudo! 🔥",
    "¡Alerta, alerta! ¡Poned las calles de alfombra verde que entra Su Majestad del Registro de Comidas! 👑",
    "¡Siete caballos vienen de Bonanza, y todos quieren saber tu secreto para esa constancia! 🐎",
    "*hace un moonwalk con las pezuñas* ¡Beee-llísimo! ¡Arte puro en movimiento!",
  ]},
];


// Zonas del cuerpo: un solo accesorio equipado por zona (intercambiables)
const ZONAS = [
  { id:"cabeza", nombre:"Cabeza", emoji:"🎩" },
  { id:"cuernos", nombre:"Cuernos", emoji:"🐏" },
  { id:"cara", nombre:"Cara", emoji:"🕶️" },
  { id:"cuello", nombre:"Cuello", emoji:"🧣" },
  { id:"espalda", nombre:"Espalda", emoji:"🦸" },
  { id:"orejas", nombre:"Orejas", emoji:"🐰" },
  { id:"cola", nombre:"Cola", emoji:"🦄" },
];

const ESTADOS = [
  { id:"feliz", label:"Feliz", emoji:"😊", desc:"Misiones de hoy completadas", felicidad:100, anim:"bounce" },
  { id:"normal", label:"Normal", emoji:"🙂", desc:"Día en curso, aún hay misiones", felicidad:70, anim:"idle" },
  { id:"hambrienta", label:"Hambrienta", emoji:"😋", desc:"Dieta de hoy sin registrar", felicidad:50, anim:"wiggle" },
  { id:"triste", label:"Triste", emoji:"😢", desc:"2+ días sin registrar — racha en peligro", felicidad:25, anim:"droop" },
  { id:"dormida", label:"Dormida", emoji:"😴", desc:"Es de noche o día ya completado", felicidad:80, anim:"breathe" },
];

function Sheep({ estado, equipados, color, size = 200, mini = false }) {
  const col = COLORES.find(c => c.id === color) || COLORES[0];
  const pal = { ...PAL, W: col.W, w: col.w };
  // Skins de transformación: la zona de la cara se vuelve el "lienzo" de la skin
  // (hueso para la calavera, cara pintada de blanco para la payasa)
  if (col.caraPropia) { pal.F = "#F4F1E6"; pal.f = "#E4DFCE"; }
  if (col.patron === "payaso") { pal.F = "#FAFAFA"; pal.f = "#ECECEC"; }
  const pixels = [];
  BASE.forEach((row, y) => {
    [...row].forEach((c, x) => {
      if (c === ".") return;
      // Arcoíris: la lana se pinta por bandas horizontales
      if (col.patron === "arcoiris" && (c === "W" || c === "w")) {
        pixels.push([x, y, null, ARCOIRIS_FILAS[y % ARCOIRIS_FILAS.length]]);
      } else {
        pixels.push([x, y, c]);
      }
    });
  });
  // Overlay del patrón (manchas dálmata, maquillaje payaso, huesos esqueleto)
  const patronExtra = (PATRON_PX[col.patron] || []).map(([x, y, hex]) => [x, y, null, hex]);
  const gafasOn = equipados.includes("gafas");
  // Con skin de transformación, la cara de oveja NO se dibuja: la cara ES la de la skin
  const face = col.caraPropia ? []
    : (FACES[estado] || []).filter(([,y]) => !(gafasOn && (y === 7 || (y === 8 && estado !== "feliz"))));
  const acc = ACCESORIOS.filter(a => equipados.includes(a.id)).flatMap(a => a.px);
  const anim = ESTADOS.find(e => e.id === estado)?.anim || "idle";

  return (
    <div style={{ position:"relative", width:size, height:size, margin:"0 auto" }}>
      <svg viewBox="0 0 16 16" width={size} height={size}
        style={{ imageRendering:"pixelated", animation: mini ? "none" : `${anim} 2.2s ease-in-out infinite`, display:"block" }}>
        {pixels.map(([x,y,c,hex],i) => <rect key={"b"+i} x={x} y={y} width={1} height={1} fill={hex || pal[c]} />)}
        {patronExtra.map(([x,y,c,hex],i) => <rect key={"p"+i} x={x} y={y} width={1} height={1} fill={hex} />)}
        {face.map(([x,y,c],i) => <rect key={"f"+i} x={x} y={y} width={1} height={1} fill={pal[c]} />)}
        {acc.map(([x,y,c],i) => <rect key={"a"+i} x={x} y={y} width={1} height={1} fill={pal[c]} />)}
      </svg>
      {!mini && estado === "feliz" && <span className="float-fx" style={{ left:"8%", top:"6%" }}>💚</span>}
      {!mini && estado === "feliz" && <span className="float-fx" style={{ right:"6%", top:"14%", animationDelay:".7s" }}>✨</span>}
      {!mini && estado === "dormida" && <span className="float-fx" style={{ right:"4%", top:"2%" }}>💤</span>}
      {!mini && estado === "hambrienta" && <span className="float-fx" style={{ right:"2%", top:"10%" }}>🥗</span>}
      {!mini && estado === "triste" && <span className="float-fx" style={{ left:"10%", top:"4%" }}>🌧️</span>}
    </div>
  );
}

// ─── Píxeles compuestos de la oveja (para el canvas del juego) ───────────────
function buildPixels(colorId, equipados) {
  // MISMA lógica de apariencia que el componente Sheep (patrones y skins incluidos),
  // para que la oveja del juego sea idéntica a la de la pestaña/chat/ranking.
  const col = COLORES.find(c => c.id === colorId) || COLORES[0];
  const pal = { ...PAL, W: col.W, w: col.w };
  if (col.caraPropia) { pal.F = "#F4F1E6"; pal.f = "#E4DFCE"; }
  if (col.patron === "payaso") { pal.F = "#FAFAFA"; pal.f = "#ECECEC"; }
  const px = [];
  BASE.forEach((row, y) => [...row].forEach((c, x) => {
    if (c === ".") return;
    if (col.patron === "arcoiris" && (c === "W" || c === "w")) {
      px.push([x, y, ARCOIRIS_FILAS[y % ARCOIRIS_FILAS.length]]);
    } else {
      px.push([x, y, pal[c]]);
    }
  }));
  // Overlay del patrón (manchas, maquillaje, calavera)
  (PATRON_PX[col.patron] || []).forEach(([x, y, hex]) => px.push([x, y, hex]));
  // Cara de oveja solo si la skin no tiene cara propia
  if (!col.caraPropia) FACES.normal.forEach(([x, y, c]) => px.push([x, y, pal[c]]));
  ACCESORIOS.filter(a => equipados.includes(a.id)).forEach(a => a.px.forEach(([x, y, c]) => px.push([x, y, pal[c]])));
  return px;
}

// ─── 🎮 El Salto del Rebaño (runner offline, estilo dino) ────────────────────
function JuegoOveja({ color, equipados, nombre, onSalir, partidasProp, onPagarYJugar, arrancarRef,
  puntosHoy = 0, puntosSemana = 0, onFinPartida }) {
  const canvasRef = useRef(null);
  const tapRef = useRef(null);      // handler del toque expuesto al JSX (sobrevive re-renders)
  const [modoElegido, setModoElegido] = useState("noche");   // juego seleccionado en la pantalla previa
  const [jugando, setJugando] = useState(false);
  const [fin, setFin] = useState(false);
  const [score, setScore] = useState(0);
  const [best, setBest] = useState(0);
  const [cuenta, setCuenta] = useState(0); // 5..1 countdown; 0 = jugando

  // Al terminar cada partida, sus puntos se suman al marcador diario y semanal
  useEffect(() => { if (fin) onFinPartida && onFinPartida(score); }, [fin]);

  useEffect(() => {
    if (!jugando) return;
    const cv = canvasRef.current;
    const ctx = cv.getContext("2d");
    // Lienzo LÓGICO fijo 340×680; el buffer real se ajusta a pantalla × devicePixelRatio
    // → se acabaron los gráficos reescalados: cada frame se dibuja a resolución nativa
    const W = 340, H = 680, suelo = H - 52;
    const S = 5, SH = 16 * S, SX = 36;
    const ajustarBuffer = () => {
      const r = cv.getBoundingClientRect();
      const dpr = Math.min(window.devicePixelRatio || 1, 3);
      cv.width  = Math.max(1, Math.round((r.width  || W) * dpr));
      cv.height = Math.max(1, Math.round((r.height || H) * dpr));
    };
    ajustarBuffer();
    const px = buildPixels(color, equipados);

    // ── Temas de juego: el consumible transforma el modo completo ──
    const TEMAS = {
      noche: {
        familia: "runner",
        cielo: "#4A2C4E", cieloBottom: "#C25E3A", suelo: "#2B7A00", hierba: "rgba(137,226,25,0.4)",
        sol: "rgba(255,210,120,0.55)",
        obstaculo: "lobo",            // lobos que saltar
        volador: "cuervo",            // cuervos que rebotan
        nubeColor: "rgba(255,200,160,0.18)",
      },
      oro: {
        familia: "plataformas",
        cielo: "#3A2A5A", cieloBottom: "#8A5A9E", suelo: "#6B4A2A", hierba: "rgba(255,200,100,0.4)",
        nubeColor: "rgba(255,220,180,0.14)",
      },
      mar: {
        familia: "flappy",
        cielo: "#2E86C8", cieloBottom: "#0A3D6E",
        nubeColor: "rgba(0,0,0,0)",
      },
      jefe: {
        familia: "shooter",
        cielo: "#2A1E36", cieloBottom: "#3E2C4E", suelo: "#3A2F44", hierba: "rgba(180,150,220,0.25)",
        nubeColor: "rgba(0,0,0,0)",
      },
      prado: {
        familia: "carriles",
        cielo: "#8FD3E8", cieloBottom: "#DCEFC0",
        madera: "#8A6432", maderaBorde: "#5A3E1C", maderaLinea: "rgba(0,0,0,0.22)",
        prado1: "#3E8A2E", prado2: "#2B6A1E",
        sol: "#FFD84D",
        nubeColor: "rgba(255,255,255,0.55)",
      },
    };
    // Icono del consumible según a qué modo lleva
    const ICONO_MODO = { noche: "🌙", oro: "💲", mar: "🫧", jefe: "🎯", prado: "🐺" };
    const otroModo = (actual) => {
      // Nunca repite el último destino: garantiza variedad real entre transiciones
      let otros = Object.keys(TEMAS).filter(m => m !== actual && m !== st.ultimoDestino);
      if (otros.length === 0) otros = Object.keys(TEMAS).filter(m => m !== actual);
      const destino = otros[Math.floor(Math.random() * otros.length)];
      st.ultimoDestino = destino;
      return destino;
    };
    // Se arranca en el juego ELEGIDO en la pantalla previa
    const modoInicial = TEMAS[modoElegido] ? modoElegido : "noche";

    const st = { y: suelo - SH, vy: 0, modo: modoInicial, transicion: 0,
      vallas: TEMAS[modoInicial].familia === "runner"
        ? [{ tipo: TEMAS[modoInicial].obstaculo, x: W + 60, w: 20, h: 52, ok: false }] : [],
      consumibles: [], desdeConsumible: 0, graciaTransicion: 50, mismos: 0,
      monedas: [], suelos: [{ x: -20, w: W + 60, top: suelo }], sx: SX, enSuelo: true,
      corales: [], balas: [], balasJefe: [], jefe: null, jefeNivel: 0, flotantes: [],
      carril: 1, objetos: [], olaCad: 0, faseCamino: 0, flechaFlash: null,
      vel: 4.2, score: 0, vivo: true, nubes: [
      { x: 50, y: 70 }, { x: 190, y: 130 }, { x: 280, y: 45 }],
    };
    if (TEMAS[modoInicial].familia === "flappy") st.y = H * 0.4;
    if (TEMAS[modoInicial].familia === "carriles") st.carril = 1;   // arrancas por el camino central

    const saltar = (px) => {
      if (!st.vivo) return;
      const fam = TEMAS[st.modo].familia;
      if (fam === "plataformas") {
        if (st.enSuelo) { st.vy = -18; st.enSuelo = false; }
      } else if (fam === "flappy") {
        st.vy = -9.0;                      // impulso de nado hacia arriba
      } else if (fam === "carriles") {
        // ◀ ▶: cada toque salta UN camino a ese lado
        if (px !== undefined) {
          const d = px < W / 2 ? -1 : 1;
          st.carril = Math.max(0, Math.min(2, (st.carril === undefined ? 1 : st.carril) + d));
          st.flechaFlash = { d, t: 9 };   // la flecha pulsada se ilumina un instante
        }
      } else {
        if (st.y >= suelo - SH - 1) st.vy = -17;   // runner y shooter
      }
    };
    const onTap = (e) => {
      const r = cv.getBoundingClientRect();
      const cx = e.clientX !== undefined ? e.clientX
        : (e.touches && e.touches[0] ? e.touches[0].clientX : undefined);
      if (cx === undefined || !r.width) saltar();
      else saltar((cx - r.left) * (W / r.width));     // coordenada en espacio del canvas
    };
    tapRef.current = onTap;
    const onKey = (e) => {
      if (e.code === "Space" || e.code === "ArrowUp") { e.preventDefault(); saltar(); }
      if (e.code === "ArrowLeft")  { e.preventDefault(); saltar(0); }
      if (e.code === "ArrowRight") { e.preventDefault(); saltar(W); }
    };
    window.addEventListener("keydown", onKey);

    let raf;
    const loop = () => {
      // Coordenadas lógicas → resolución nativa (nítido en cualquier pantalla)
      ctx.setTransform(cv.width / W, 0, 0, cv.height / H, 0, 0);
      if (st.vivo && cuentaRef.current <= 0) {
        if (st.vel < 7.6) st.vel += 0.0011;  // acelera suave, con tope
        if (st.transicion > 0) st.transicion -= 0.04;
        const tema = TEMAS[st.modo];
        if (st.graciaTransicion > 0) st.graciaTransicion--;
        const dif = Math.min(st.score / 200, 1);

        if (tema.familia === "runner") {
          // ═══ FAMILIA RUNNER (día / noche): saltar obstáculos de tierra; los voladores REBOTAN ═══
          if (st.sx === undefined) st.sx = SX;
          st.vy += 1.05; st.y = Math.min(st.y + st.vy, suelo - SH);
          if (st.y === suelo - SH) st.vy = 0;
          // La oveja tiende a volver a su carril (SX) tras un empujón lateral
          if (st.sx > SX) st.sx = Math.max(SX, st.sx - 1.4);
          else if (st.sx < SX) st.sx = Math.min(SX, st.sx + 1.0);   // recuperas terreno poco a poco: jugar bien te devuelve a tu sitio
          const ultima = st.vallas[st.vallas.length - 1];
          const sepMin = 240 - dif * 80;
          const sepJit = 40 + Math.random() * (260 - dif * 120);
          const sepActual = ultima ? (W + 14) - ultima.x : 9999;

          if (st.graciaTransicion <= 0 && sepActual > sepMin + sepJit) {
            if (st.quiereConsumible) {
              // El orbe corona el arco de salto del siguiente lobo: esquivarlo es recogerlo
              st.quiereConsumible = false;
              st.vallas.push({ tipo: tema.obstaculo, x: W + 14, w: 20, h: 52, ok: false });
              st.consumibles.push({ x: W + 14 + 34, y: suelo - SH - 108, to: otroModo(st.modo) });
              st.mismos = 0;
            } else {
            const pVolador = st.score >= 3 ? 0.30 + dif * 0.25 : 0;
            const ultTipo = ultima ? (ultima.vuela ? "aire" : "tierra") : null;
            let quiereAire = Math.random() < pVolador;
            if (st.mismos >= 2) { quiereAire = ultTipo !== "aire"; st.mismos = 0; }
            if ((quiereAire ? "aire" : "tierra") === ultTipo) st.mismos = (st.mismos || 0) + 1;
            else st.mismos = 0;
            if (quiereAire) {
              const alto = suelo - SH - (44 + Math.floor(Math.random() * 3) * 12);
              st.vallas.push({ tipo: tema.volador, vuela: true, x: W + 14, w: 46, h: 30, y: alto, ok: false });
            } else {
              st.vallas.push({ tipo: tema.obstaculo, x: W + 14, w: 20, h: 38 + Math.floor(Math.random() * 4) * 13, ok: false });
            }
            if (dif > 0.4 && Math.random() < dif * 0.25) {
              const gapCombo = 130 + Math.random() * 40;
              const aire2 = Math.random() < pVolador;
              if (aire2) st.vallas.push({ tipo: tema.volador, vuela: true, x: W + 14 + gapCombo, w: 46, h: 30,
                y: suelo - SH - (44 + Math.floor(Math.random() * 3) * 12), ok: false });
              else st.vallas.push({ tipo: tema.obstaculo, x: W + 14 + gapCombo, w: 20,
                h: 38 + Math.floor(Math.random() * 4) * 13, ok: false });
            }
            }
          }
          st.vallas.forEach(v => { v.x -= st.vel * (v.vuela ? 1.18 : 1); });
          st.vallas = st.vallas.filter(v => v.x > -50);
          st.vallas.forEach(v => {
            if (!v.ok && v.x + v.w < st.sx) { v.ok = true; st.score += 4; setScore(st.score); }
            const margen = 12;
            const sL = st.sx + margen, sR = st.sx + SH - margen;
            const sT = st.y + 10, sB = st.y + SH - 6;
            if (v.vuela) {
              // ── VOLADOR: no mata, REBOTA ──
              const solapa = sR > v.x && sL < v.x + v.w && sB > v.y && sT < v.y + v.h;
              if (solapa && !v.rebotado) {
                v.rebotado = true;
                const pisaDesdeArriba = st.vy > 0 && st.y + SH - 20 < v.y;
                if (pisaDesdeArriba) {
                  // Caes encima → rebote hacia ARRIBA (y un empujón adelante)
                  st.vy = -15; st.sx = Math.min(st.sx + 26, W * 0.5);
                } else {
                  // Choque frontal → rebote hacia la IZQUIERDA (riesgo de borde)
                  st.sx -= 70; st.vy = -6;
                }
              }
            } else {
              // ── OBSTÁCULO DE TIERRA: mata ──
              if (sR > v.x && sL < v.x + v.w && sB > suelo - v.h) {
                st.vivo = false; setFin(true); setBest(b => Math.max(b, st.score));
              }
            }
          });
          // Muerte por borde izquierdo (empujada por los rebotes)
          if (st.sx + SH < 6) { st.vivo = false; setFin(true); setBest(b => Math.max(b, st.score)); }

        } else if (tema.familia === "plataformas") {
          // ═══ FAMILIA PLATAFORMAS (oro): niveles de suelo sólido con COLISIÓN real ═══
          // st.suelos = bloques macizos a distinta altura. Colisión por arriba y por los lados.
          // Muerte: caer por un hueco O quedar empujada fuera por el borde izquierdo.
          if (st.suelos === undefined) { st.suelos = []; st.monedas = []; }
          if (st.sx === undefined) st.sx = SX;   // posición X propia de la oveja (empujable)
          if (st.suelos.length === 0) st.suelos.push({ x: -20, w: W - 100, top: suelo });

          // 3 niveles de altura del "top" de cada bloque de suelo
          const NIVELES = [suelo, suelo - 60, suelo - 120];

          const fin = st.suelos.reduce((m, s) => Math.max(m, s.x + s.w), 0);
          if (fin < W + 300) {
            const hayHueco = st.graciaTransicion <= 0 && Math.random() < 0.38;
            const hueco = hayHueco ? 80 + Math.random() * (30 + dif * 45) : 0;
            const tramo = 140 + Math.random() * 150;
            const top = NIVELES[Math.floor(Math.random() * 3)];
            const x0 = fin + hueco;
            st.suelos.push({ x: x0, w: tramo, top });
            // monedas sobre el tramo (a ras del top, no requieren saltar salvo cambio de nivel)
            if (st.quiereConsumible) {
              // El orbe espera en mitad del tramo, a la altura de la carrera: tu camino pasa por él
              st.quiereConsumible = false;
              st.consumibles.push({ x: x0 + 70, y: top - 58, to: otroModo(st.modo) });
            } else if (Math.random() < 0.55) {
              const nMon = 1 + (Math.random() < 0.5 ? 1 : 0);
              for (let i = 0; i < nMon; i++) st.monedas.push({ x: x0 + 40 + i * 34, y: top - 40, cogida: false });
            }
          }
          st.suelos.forEach(s => { s.x -= st.vel; });
          st.suelos = st.suelos.filter(s => s.x + s.w > -60);
          st.monedas.forEach(m => { m.x -= st.vel; });
          st.monedas = st.monedas.filter(m => m.x > -30 && !m.cogida);

          // Física vertical
          st.vy += 1.15; st.y += st.vy;
          const sL = st.sx + 8, sR = st.sx + SH - 8;     // caja horizontal de la oveja
          const pieY = st.y + SH, cabezaY = st.y;
          st.enSuelo = false;

          st.suelos.forEach(s => {
            const solapaX = sR > s.x && sL < s.x + s.w;
            if (!solapaX) return;
            // Aterrizar sobre el top del bloque
            if (st.vy >= 0 && pieY >= s.top && pieY <= s.top + 30 && cabezaY < s.top - 10) {
              st.y = s.top - SH; st.vy = 0; st.enSuelo = true;
            }
          });
          // Colisión lateral: si la oveja está "dentro" de la altura de un bloque, el bloque la empuja
          st.suelos.forEach(s => {
            const dentroAltura = pieY > s.top + 6 && cabezaY < H;   // su cuerpo pisa el nivel del bloque
            if (!dentroAltura) return;
            // Choca contra la cara izquierda del bloque → la oveja es empujada hacia la izquierda (scroll)
            if (sR > s.x && sL < s.x && st.y + SH > s.top + 4) {
              st.sx = s.x - (SH - 8);   // pegada a la cara izquierda; el scroll la arrastra
            }
          });

          // Recuperar posición X poco a poco hacia el centro-izquierda cuando puede
          if (st.sx > SX) st.sx = Math.max(SX, st.sx - st.vel * 0.6);
          else if (st.sx < SX && st.enSuelo) st.sx = Math.min(SX, st.sx + 1.0);   // tras el empujón de un bloque, recuperas tu posición poco a poco

          // Recoger monedas
          st.monedas.forEach(m => {
            if (!m.cogida && st.sx + SH > m.x && st.sx < m.x + 24 && st.y + SH > m.y && st.y < m.y + 24) {
              m.cogida = true; st.score += 3; setScore(st.score);
            }
          });
          // Muerte 1: caer por un hueco
          if (st.y > H + 40) { st.vivo = false; setFin(true); setBest(b => Math.max(b, st.score)); }
          // Muerte 2: comida por el borde izquierdo de la pantalla
          if (st.sx + SH < 6) { st.vivo = false; setFin(true); setBest(b => Math.max(b, st.score)); }

        } else if (tema.familia === "flappy") {
          // ═══ FAMILIA FLAPPY (mar): toca para nadar hacia arriba; cruza los corales ═══
          if (st.corales === undefined) st.corales = [];
          // Física suave: gravedad ligera + velocidad terminal (caída controlable)
          st.vy += 0.45; if (st.vy > 7) st.vy = 7;
          st.y += st.vy;
          if (st.y < 8) { st.y = 8; st.vy = 0; }
          const ux = st.sx !== undefined ? st.sx : SX;
          // El agua tiene su propio ritmo: apenas escala con la dificultad global
          const velMar = Math.min(st.vel, 6.0) * 0.78;
          const ult = st.corales[st.corales.length - 1];
          if (st.graciaTransicion <= 0 && (!ult || ult.x < W - (240 - dif * 15 + Math.random() * 55))) {
            const gapH = 186 - dif * 22;
            // Anti-injusticia: el nuevo hueco queda a distancia alcanzable del anterior
            // (subir cuesta más que bajar: máx. 120 hacia arriba, 200 hacia abajo)
            const prevY = ult ? ult.gapY : H * 0.45;
            const gapY = Math.max(110, Math.min(suelo - 110, prevY - 120 + Math.random() * 320));
            st.corales.push({ x: W + 20, gapY, gapH, ok: false });
            if (st.quiereConsumible) {
              // El orbe ocupa el centro del hueco: el propio juego te lleva a él
              st.quiereConsumible = false;
              st.consumibles.push({ x: W + 24, y: gapY - 18, velX: velMar, to: otroModo(st.modo) });
            } else if (Math.random() < 0.30) {
              st.monedas.push({ x: W + 96, y: gapY - 12, cogida: false });
            }
          }
          st.corales.forEach(c => { c.x -= velMar; });
          st.corales = st.corales.filter(c => c.x > -70);
          st.monedas.forEach(m => { m.x -= velMar; });
          st.monedas = st.monedas.filter(m => m.x > -30 && !m.cogida);
          st.corales.forEach(c => {
            if (!c.ok && c.x + 44 < ux) { c.ok = true; st.score += 2; setScore(st.score); }
            const sL = ux + 16, sR = ux + SH - 16, sT = st.y + 14, sB = st.y + SH - 10;
            const solapaX = sR > c.x && sL < c.x + 44;
            if (solapaX && (sT < c.gapY - c.gapH / 2 || sB > c.gapY + c.gapH / 2)) {
              st.vivo = false; setFin(true); setBest(b => Math.max(b, st.score));
            }
          });
          st.monedas.forEach(m => {
            if (!m.cogida && ux + SH > m.x && ux < m.x + 24 && st.y + SH > m.y && st.y < m.y + 24) {
              m.cogida = true; st.score += 5; setScore(st.score);
            }
          });
          // El fondo marino es suelo firme: la oveja corre por él (los corales inferiores siguen matando)
          if (st.y + SH > suelo) { st.y = suelo - SH; st.vy = 0; }

        } else if (tema.familia === "shooter") {
          // ═══ FAMILIA SHOOTER (guarida): la oveja dispara sola; salta para esquivar ═══
          st.vy += 1.05; st.y = Math.min(st.y + st.vy, suelo - SH);
          if (st.y === suelo - SH) st.vy = 0;
          // En el duelo la oveja se coloca pegada al borde izquierdo (máxima distancia)
          if (st.sx === undefined) st.sx = SX;
          if (st.sx > 14) st.sx = Math.max(14, st.sx - 2.5);
          const ux = st.sx;
          if (!st.jefe) st.jefe = { t: 0, hp: 12 + st.jefeNivel * 3, max: 12 + st.jefeNivel * 3, herido: 0,
            alto: Math.random() < 0.5, mora: 200 };
          st.jefe.t++;
          // DOS alturas fijas, como pájaros y vallas:
          //  · ABAJO: su bola va a ras → SALTA para esquivar; tus disparos desde el suelo le dan
          //  · ARRIBA: su bola pasa por encima → NO saltes para esquivar; salta si quieres acertarle
          const J_BAJO = suelo - 84, J_ALTO = suelo - 232;
          st.jefe.mora--;
          if (st.jefe.mora <= 0) {
            st.jefe.alto = !st.jefe.alto;
            st.jefe.mora = 220 + Math.random() * 120 - dif * 60;
          }
          const objetivoJ = st.jefe.alto ? J_ALTO : J_BAJO;
          if (st.jefeYPos === undefined) st.jefeYPos = objetivoJ;
          const dj = objetivoJ - st.jefeYPos;
          st.jefeYPos += Math.abs(dj) < 4 ? dj : Math.sign(dj) * 4;
          const asentado = Math.abs(dj) < 12;
          const jefeY = st.jefeYPos + Math.sin(st.jefe.t * 0.05) * 5;   // leve flotación en el sitio
          st.jefeYDraw = jefeY;
          const jefeX = W - 104;
          // Disparo automático de bolas de lana
          st.cad = (st.cad || 0) + 1;
          if (st.cad >= 26) { st.cad = 0; st.balas.push({ x: ux + SH, y: st.y + SH * 0.42 }); }
          st.balas.forEach(b => { b.x += 9.5; });
          st.balas = st.balas.filter(b => b.x < W + 30);
          // Impactos al jefe
          st.balas = st.balas.filter(b => {
            const da = b.x > jefeX && b.x < jefeX + 84 && b.y > jefeY - 10 && b.y < jefeY + 86;
            if (da) {
              st.jefe.hp--; st.score += 2; setScore(st.score); st.jefe.herido = 6;
              if (st.jefe.hp <= 0) {
                st.jefeNivel++; st.jefe = null; st.score += 20; setScore(st.score);
                // Botín real: el rey suelta un orbe de transición hacia otro juego
                if (st.consumibles.length === 0) {
                  const oy = Math.min(Math.max(jefeY + 20, suelo - SH - 140), suelo - SH - 30);
                  st.consumibles.push({ x: jefeX, y: oy, to: otroModo(st.modo) });
                  st.desdeConsumible = 0;
                }
              }
              return false;
            }
            return true;
          });
          if (st.jefe && st.jefe.herido > 0) st.jefe.herido--;
          // Ataques del jefe: bajo (salta) o alto (no saltes)
          if (asentado) st.jefeCad = (st.jefeCad || 0) + 1;   // en tránsito no carga: cada altura avisa desde cero
          const umbralDisparo = 88 - dif * 24;
          // Carga visible: la boca brilla los 26 frames previos al disparo (aviso justo)
          st.jefeCarga = st.jefe && asentado && st.jefeCad > umbralDisparo - 26
            ? (st.jefeCad - (umbralDisparo - 26)) / 26 : 0;
          if (st.jefe && asentado && st.graciaTransicion <= 0 && st.jefeCad >= umbralDisparo) {
            st.jefeCad = 0;
            // La bola sale de la boca del rey: su altura depende de dónde esté flotando
            st.balasJefe.push({ x: jefeX, y: jefeY + 50 });
          }
          st.balasJefe.forEach(b => { b.x -= 4.2 + dif * 1.2; });
          st.balasJefe = st.balasJefe.filter(b => b.x > -30);
          st.balasJefe.forEach(b => {
            if (b.x + 20 > ux + 12 && b.x + 4 < ux + SH - 12 && b.y + 12 > st.y + 10 && b.y + 2 < st.y + SH - 4) {
              st.vivo = false; setFin(true); setBest(bb => Math.max(bb, st.score));
            }
          });

        } else if (tema.familia === "carriles") {
          // ═══ FAMILIA CARRILES (prado 2D vertical): 3 caminos rectos; ◀ ▶ cambia; monedas sí, lobos no ═══
          if (st.objetos === undefined) { st.objetos = []; st.carril = 1; st.olaCad = 0; st.faseCamino = 0; }
          if (st.flotantes === undefined) st.flotantes = [];
          const CARRIL_X = [62, 170, 278];        // centros de los 3 caminos
          const OVEJA_Y = H - 190;                 // altura fija de la carrera
          const velObj = st.vel * 1.15;            // caída recta de lobos y monedas
          st.faseCamino = (st.faseCamino + velObj / H) % 1;
          // La oveja se desliza hacia el centro de su camino
          const objetivoX = CARRIL_X[st.carril === undefined ? 1 : st.carril] - SH / 2;
          if (st.sx === undefined) st.sx = objetivoX;
          const dx = objetivoX - st.sx;
          st.sx += Math.abs(dx) < 15 ? dx : Math.sign(dx) * 15;
          st.y = OVEJA_Y; st.vy = 0;
          if (st.flechaFlash && st.flechaFlash.t > 0) st.flechaFlash.t--;
          // Oleadas
          st.olaCad++;
          if (st.graciaTransicion <= 0 && st.olaCad >= 58 - dif * 16) {
            st.olaCad = 0;
            if (st.quiereConsumible) {
              // Oleada portal: el orbe baja por UN camino y los lobos cierran los otros dos
              st.quiereConsumible = false;
              const libre = Math.floor(Math.random() * 3);
              st.consumibles.push({ carril: libre, x: CARRIL_X[libre] - 18, y: -46, to: otroModo(st.modo), laneMode: true });
              [0, 1, 2].forEach(c => {
                if (c !== libre) st.objetos.push({ carril: c, tipo: "lobo", y: -46, fase: Math.random() * 6.28 });
              });
            } else {
              const ola = [0, 1, 2].map(() => {
                const r = Math.random();
                return r < 0.30 + dif * 0.14 ? "lobo" : r < 0.62 ? "moneda" : null;
              });
              if (ola.every(o => o === "lobo")) ola[Math.floor(Math.random() * 3)] = "moneda";
              if (ola.every(o => o === null)) ola[Math.floor(Math.random() * 3)] = "moneda";
              let iLobo = 0;
              ola.forEach((tipo, c) => {
                if (!tipo) return;
                if (tipo === "moneda" && Math.random() < 0.35) {
                  // hilera de 3 monedas por el mismo camino
                  [0, -46, -92].forEach(off => st.objetos.push({ carril: c, tipo, y: -46 + off, fase: Math.random() * 6.28 }));
                } else if (tipo === "lobo") {
                  // Zig-zag garantizado: el segundo lobo llega con ≥ ~0.9 s de margen
                  const off = iLobo === 0 ? -Math.random() * 40 : -(260 + Math.random() * 120);
                  iLobo++;
                  st.objetos.push({ carril: c, tipo, y: -46 + off, fase: Math.random() * 6.28 });
                } else {
                  st.objetos.push({ carril: c, tipo, y: -46 - Math.random() * 50, fase: Math.random() * 6.28 });
                }
              });
            }
          }
          // Caída recta + resolución de choques (lobo estricto y visual; moneda generosa)
          st.objetos.forEach(o => { o.y += velObj; });
          st.objetos = st.objetos.filter(o => {
            const centroOveja = st.sx + SH / 2;
            const distX = Math.abs(centroOveja - CARRIL_X[o.carril]);
            if (o.tipo === "lobo") {
              const choca = o.y > OVEJA_Y - 34 && o.y < OVEJA_Y + 56 && distX < 38;
              if (choca) { st.vivo = false; setFin(true); setBest(b => Math.max(b, st.score)); return false; }
            } else {
              const coge = o.y > OVEJA_Y - 48 && o.y < OVEJA_Y + 72 && distX < 52;
              if (coge) {
                st.score += 4; setScore(st.score);
                st.flotantes.push({ x: CARRIL_X[o.carril] - 7, y: o.y - 14, t: 0 });
                return false;
              }
            }
            return o.y < H + 60;
          });
          // Orbe portal: cae recto por su camino
          st.consumibles.forEach(k => {
            if (k.laneMode) { k.y += velObj; k.x = CARRIL_X[k.carril] - 18; }
          });
          st.flotantes.forEach(f => { f.t++; f.y -= 0.9; });
          st.flotantes = st.flotantes.filter(f => f.t < 42);
                }

        // ═══ Consumible (común a todos los modos): lleva a OTRO modo al azar ═══
        st.desdeConsumible++;
        if (st.desdeConsumible > 900 && Math.random() < 0.004 && st.consumibles.length === 0
            && !st.quiereConsumible && tema.familia !== "shooter") {
          st.desdeConsumible = 0;
          // El orbe NUNCA flota suelto: cada juego lo integra en su siguiente patrón
          // (salto del lobo, tramo del banco, hueco del coral, camino libre entre lobos, botín del rey)
          st.quiereConsumible = true;
        }
        st.consumibles.forEach(k => { if (k.laneMode) return; if (k.caida) k.y += 3.1; else k.x -= (k.velX || st.vel); });
        st.consumibles = st.consumibles.filter(k => k.laneMode ? k.y < H + 60 : (k.x > -40 && k.y < H + 40));
        st.consumibles = st.consumibles.filter(k => {
          const ox = st.sx !== undefined ? st.sx : SX;
          const cogido = ox + SH > k.x && ox < k.x + 40 && st.y + SH > k.y && st.y < k.y + 40;
          if (cogido) {
            st.modo = k.to; st.transicion = 1; st.score += 40; setScore(st.score);
            st.vallas = []; st.monedas = []; st.suelos = [{ x: -20, w: W + 60, top: suelo }]; st.sx = SX;
            st.corales = []; st.balas = []; st.balasJefe = []; st.jefe = null; st.jefeNivel = 0;
            st.cad = 0; st.jefeCad = 0; st.flotantes = [];
            st.jefeYPos = undefined; st.jefeCarga = 0;
            st.carril = 1; st.objetos = []; st.olaCad = 0; st.faseCamino = 0; st.flechaFlash = null;
            st.quiereConsumible = false;
            st.desdeConsumible = -400; st.graciaTransicion = 90;
            // Recolocar a la oveja según el juego destino
            st.y = TEMAS[k.to].familia === "flappy" ? H * 0.4 : suelo - SH;
            st.vy = 0; st.enSuelo = true;
            return false;
          }
          return true;
        });
        st.nubes.forEach(n => { n.x -= st.vel * 0.25; if (n.x < -30) n.x = W + 20; });
      }
      const tema = TEMAS[st.modo];
      // ── dibujo del fondo ──
      if (tema.familia === "plataformas") {
        // Interior de banco: pared de piedra + relieves de billetes 💶
        ctx.fillStyle = "#4A4E58"; ctx.fillRect(0, 0, W, H);
        // sillería de piedra (ladrillos grandes desfasados) con scroll lento
        const off = (performance.now() / 22) % 96;
        ctx.strokeStyle = "rgba(0,0,0,0.22)"; ctx.lineWidth = 2;
        for (let ry = 0; ry < suelo; ry += 44) {
          const fila = Math.floor(ry / 44);
          ctx.beginPath(); ctx.moveTo(0, ry); ctx.lineTo(W, ry); ctx.stroke();
          for (let rx = -off + (fila % 2 ? 48 : 0); rx < W; rx += 96) {
            ctx.beginPath(); ctx.moveTo(rx, ry); ctx.lineTo(rx, ry + 44); ctx.stroke();
          }
        }
        // sombreado suave de piedra
        ctx.fillStyle = "rgba(255,255,255,0.03)";
        for (let ry = 4; ry < suelo; ry += 44) ctx.fillRect(0, ry, W, 3);
        // Columnas de piedra en paralaje (sensación de avance)
        const colOff = (performance.now() / 9) % 200;
        for (let cxx = -colOff; cxx < W + 60; cxx += 200) {
          ctx.fillStyle = "rgba(0,0,0,0.20)"; ctx.fillRect(cxx, 0, 30, suelo);
          ctx.fillStyle = "rgba(255,255,255,0.05)"; ctx.fillRect(cxx + 3, 0, 5, suelo);
          ctx.fillStyle = "rgba(0,0,0,0.28)";
          ctx.fillRect(cxx - 5, 0, 40, 12);            // capitel
          ctx.fillRect(cxx - 5, suelo - 12, 40, 12);   // base
        }
      } else if (tema.familia === "flappy") {
        // Fondo marino: agua en degradado + rayos de luz + burbujas ambientales
        const g = ctx.createLinearGradient(0, 0, 0, H);
        g.addColorStop(0, tema.cielo); g.addColorStop(1, tema.cieloBottom);
        ctx.fillStyle = g; ctx.fillRect(0, 0, W, H);
        // Lámina de luz en la superficie del agua
        const lg = ctx.createLinearGradient(0, 0, 0, 34);
        lg.addColorStop(0, "rgba(255,255,255,0.18)"); lg.addColorStop(1, "rgba(255,255,255,0)");
        ctx.fillStyle = lg; ctx.fillRect(0, 0, W, 34);
        ctx.fillStyle = "rgba(255,255,255,0.05)";
        ctx.beginPath(); ctx.moveTo(W*0.20, 0); ctx.lineTo(W*0.32, 0); ctx.lineTo(W*0.14, H); ctx.lineTo(W*0.04, H); ctx.closePath(); ctx.fill();
        ctx.beginPath(); ctx.moveTo(W*0.62, 0); ctx.lineTo(W*0.72, 0); ctx.lineTo(W*0.56, H); ctx.lineTo(W*0.48, H); ctx.closePath(); ctx.fill();
        ctx.fillStyle = "rgba(255,255,255,0.18)";
        for (let i = 0; i < 8; i++) {
          const by = H - ((performance.now() / 18 + i * 133) % (H + 40));
          const bx = (i * 83 + 40) % W;
          ctx.beginPath(); ctx.arc(bx, by, 3 + (i % 3) * 2, 0, 7); ctx.fill();
        }
      } else if (tema.familia === "shooter") {
        // Guarida del jefe: cueva oscura con antorchas parpadeantes
        const g = ctx.createLinearGradient(0, 0, 0, H);
        g.addColorStop(0, tema.cielo); g.addColorStop(1, tema.cieloBottom);
        ctx.fillStyle = g; ctx.fillRect(0, 0, W, H);
        ctx.fillStyle = "rgba(0,0,0,0.25)";
        for (let rx = 0; rx < W; rx += 60) {
          ctx.beginPath(); ctx.arc(rx + 30, 0, 34 + (rx % 3) * 8, 0, 7); ctx.fill();
        }
        [W * 0.22, W * 0.62].forEach((tx, ti) => {
          ctx.fillStyle = "#5A4630"; ctx.fillRect(tx - 4, 96, 8, 34);
          const fl = 10 + Math.abs(Math.sin(performance.now() / 130 + ti * 2)) * 7;
          const fg = ctx.createRadialGradient(tx, 90, 2, tx, 90, fl + 12);
          fg.addColorStop(0, "rgba(255,200,90,0.85)"); fg.addColorStop(1, "rgba(255,140,40,0)");
          ctx.fillStyle = fg; ctx.beginPath(); ctx.arc(tx, 90, fl + 12, 0, 7); ctx.fill();
          ctx.fillStyle = "#FFB030"; ctx.beginPath(); ctx.ellipse(tx, 90, 7, fl, 0, 0, 7); ctx.fill();
          ctx.fillStyle = "#FFE080"; ctx.beginPath(); ctx.ellipse(tx, 92, 3.5, fl * 0.55, 0, 0, 7); ctx.fill();
        });
        // Ascuas que flotan en la penumbra
        ctx.fillStyle = "rgba(255,150,60,0.5)";
        for (let e = 0; e < 6; e++) {
          const ey = H - ((performance.now() / 24 + e * 141) % (H + 30));
          const ex = (e * 67 + 30) % W + Math.sin(performance.now() / 300 + e) * 8;
          ctx.fillRect(ex, ey, 3, 3);
        }
      } else if (tema.familia === "carriles") {
        // Pradera 2D a pantalla completa; los tres caminos van encima
        const gp = ctx.createLinearGradient(0, 0, 0, H);
        gp.addColorStop(0, tema.prado1); gp.addColorStop(1, tema.prado2);
        ctx.fillStyle = gp; ctx.fillRect(0, 0, W, H);
        // Hierba que baja por márgenes y separaciones (vende la carrera)
        ctx.fillStyle = "rgba(137,226,25,0.4)";
        const fase2 = st.faseCamino || 0;
        [7, 112, 220, 328, 13, 118, 226, 333].forEach((gx, gi) => {
          for (let fi = 0; fi < 5; fi++) {
            const yy = ((fi / 5 + fase2 + gi * 0.13) % 1) * (H + 30) - 15;
            ctx.fillRect(gx, yy, 3, 8);
          }
        });
      } else {
        // Atardecer del runner
        const g = ctx.createLinearGradient(0, 0, 0, suelo);
        g.addColorStop(0, tema.cielo); g.addColorStop(1, tema.cieloBottom || tema.cielo);
        ctx.fillStyle = g; ctx.fillRect(0, 0, W, H);
        if (tema.sol) {
          ctx.fillStyle = tema.sol;
          ctx.beginPath(); ctx.arc(W * 0.5, suelo - 20, 46, 0, 7); ctx.fill();
        }
        // Colinas en silueta: profundidad contra el atardecer
        ctx.fillStyle = "rgba(30,15,38,0.45)";
        ctx.beginPath(); ctx.ellipse(W * 0.22, suelo + 26, 190, 66, 0, Math.PI, 0); ctx.fill();
        ctx.fillStyle = "rgba(24,12,30,0.55)";
        ctx.beginPath(); ctx.ellipse(W * 0.82, suelo + 30, 210, 78, 0, Math.PI, 0); ctx.fill();
        ctx.fillStyle = tema.nubeColor;
        st.nubes.forEach(n => { ctx.fillRect(n.x, n.y, 44, 12); ctx.fillRect(n.x + 9, n.y - 8, 26, 10); });
      }

      if (tema.familia === "plataformas") {
        // ── Bloques de suelo macizos (cemento) a distintos niveles, con caras laterales ──
        (st.suelos || []).forEach(s => {
          // cuerpo de cemento
          ctx.fillStyle = "#8E9299"; ctx.fillRect(s.x, s.top, s.w, H - s.top);
          // cara superior más clara
          ctx.fillStyle = "#B4B8BF"; ctx.fillRect(s.x, s.top, s.w, 7);
          ctx.fillStyle = "#6E727A"; ctx.fillRect(s.x, s.top + 7, s.w, 2);
          // caras laterales (para que se lean como bloques sólidos)
          ctx.fillStyle = "#767A82"; ctx.fillRect(s.x, s.top, 3, H - s.top);
          ctx.fillStyle = "#5E626A"; ctx.fillRect(s.x + s.w - 3, s.top, 3, H - s.top);
          // junta de cemento en rejilla
          ctx.fillStyle = "rgba(0,0,0,0.14)";
          for (let bx = s.x + 34; bx < s.x + s.w - 4; bx += 34) ctx.fillRect(bx, s.top + 10, 2, H - s.top - 10);
          for (let byy = s.top + 30; byy < H; byy += 30) ctx.fillRect(s.x + 3, byy, s.w - 6, 2);
        });
        // ── Monedas 🪙 doradas con símbolo € ──
        (st.monedas || []).forEach(m => {
          if (m.cogida) return;
          const cx = m.x + 12, cy = m.y + 12;
          const ancho = 5 + Math.abs(Math.sin(performance.now() / 220 + m.x)) * 9;  // giro
          // canto
          ctx.fillStyle = "#9A6E12"; ctx.beginPath(); ctx.ellipse(cx, cy, ancho + 2.5, 14, 0, 0, 7); ctx.fill();
          // cara
          const cg = ctx.createLinearGradient(cx - ancho, cy, cx + ancho, cy);
          cg.addColorStop(0, "#E0A800"); cg.addColorStop(0.5, "#FFE066"); cg.addColorStop(1, "#D89A00");
          ctx.fillStyle = cg; ctx.beginPath(); ctx.ellipse(cx, cy, ancho, 12, 0, 0, 7); ctx.fill();
          // borde interior
          ctx.strokeStyle = "#B8860B"; ctx.lineWidth = 1.5;
          ctx.beginPath(); ctx.ellipse(cx, cy, ancho * 0.72, 8.5, 0, 0, 7); ctx.stroke();
          // símbolo € si la moneda está de frente
          if (ancho > 9) {
            ctx.fillStyle = "#8A6508"; ctx.font = "bold 13px system-ui";
            ctx.textAlign = "center"; ctx.textBaseline = "middle";
            ctx.fillText("€", cx, cy + 1);
            ctx.textAlign = "left"; ctx.textBaseline = "alphabetic";
          }
          // brillo
          ctx.fillStyle = "rgba(255,255,255,0.6)";
          ctx.beginPath(); ctx.ellipse(cx - ancho * 0.4, cy - 4, ancho * 0.18, 3, 0, 0, 7); ctx.fill();
        });
      } else if (tema.familia === "flappy") {
        // ── Lecho marino: arena, algas ondulantes y burbujas de puntos ──
        ctx.fillStyle = "#C9B37A"; ctx.fillRect(0, suelo, W, H - suelo);
        ctx.fillStyle = "rgba(0,0,0,0.12)";
        for (let gx = 12; gx < W; gx += 34) ctx.fillRect(gx, suelo + 12 + (gx % 3) * 4, 5, 3);
        for (let ax = 40; ax < W; ax += 150) {
          const sway = Math.sin(performance.now() / 400 + ax) * 6;
          ctx.strokeStyle = "rgba(60,160,90,0.7)"; ctx.lineWidth = 5;
          ctx.beginPath(); ctx.moveTo(ax, suelo + 4);
          ctx.quadraticCurveTo(ax + sway, suelo - 22, ax + sway * 1.6, suelo - 44);
          ctx.stroke();
        }
        (st.monedas || []).forEach(m => {
          if (m.cogida) return;
          const bs = 10 + Math.sin(performance.now() / 300 + m.x) * 1.5;
          ctx.fillStyle = "rgba(255,255,255,0.25)";
          ctx.beginPath(); ctx.arc(m.x + 12, m.y + 12, bs, 0, 7); ctx.fill();
          ctx.strokeStyle = "rgba(255,255,255,0.8)"; ctx.lineWidth = 2;
          ctx.beginPath(); ctx.arc(m.x + 12, m.y + 12, bs, 0, 7); ctx.stroke();
          ctx.fillStyle = "rgba(255,255,255,0.9)";
          ctx.beginPath(); ctx.arc(m.x + 8, m.y + 8, 2.5, 0, 7); ctx.fill();
        });
      } else if (tema.familia === "shooter") {
        // ── Suelo de la guarida ──
        ctx.fillStyle = "#241A2E"; ctx.fillRect(0, suelo + 3, W, H - suelo);
        ctx.fillStyle = tema.suelo; ctx.fillRect(0, suelo, W, 5);
        ctx.fillStyle = tema.hierba;
        for (let gx = (performance.now() / 7) % 44; gx < W; gx += 44) ctx.fillRect(gx, suelo + 10, 4, 4);
      } else if (tema.familia !== "carriles") {
        // ── Suelo pradera continuo (runner) ──
        ctx.fillStyle = "#1A3D12"; ctx.fillRect(0, suelo + 3, W, H - suelo);
        ctx.fillStyle = tema.suelo; ctx.fillRect(0, suelo, W, 5);
        ctx.fillStyle = tema.hierba;
        for (let gx = (performance.now() / 5) % 40; gx < W; gx += 40) ctx.fillRect(gx, suelo + 10, 5, 5);
      }
      const aleteo = Math.floor(performance.now() / 140) % 2 === 0;
      st.vallas.forEach(v => {
        if (v.tipo === "aguila" || v.tipo === "cuervo") {
          const esCuervo = v.tipo === "cuervo";
          const cuerpo = esCuervo ? "#101014" : "#8A5A2E";   // águila marrón
          const ala = esCuervo ? "#26262E" : "#6B4423";
          const cabeza = esCuervo ? "#101014" : "#E8DCC0";   // águila cabeza clara
          if (esCuervo) {  // contorno claro para despegarlo del cielo
            ctx.fillStyle = "rgba(255,255,255,0.25)";
            ctx.fillRect(v.x - 2, v.y + 11, 37, 15);
          }
          ctx.fillStyle = cuerpo;
          ctx.fillRect(v.x, v.y + 13, 30, 11);                     // cuerpo
          ctx.fillRect(v.x - 7, v.y + 15, 8, 6);                   // cola
          ctx.fillStyle = cabeza;
          ctx.fillRect(v.x + 26, v.y + 12, 9, 9);                  // cabeza
          ctx.fillStyle = esCuervo ? "#3A2A0A" : "#F5B800";
          ctx.fillRect(v.x + 34, v.y + 15, 9, 5);                  // pico
          ctx.fillStyle = esCuervo ? "#E04545" : "#111111";
          ctx.fillRect(v.x + 29, v.y + 15, 4, 4);                  // ojo
          ctx.fillStyle = ala;
          if (aleteo) ctx.fillRect(v.x + 6, v.y, 18, 13);
          else ctx.fillRect(v.x + 6, v.y + 21, 18, 10);
        } else if (v.tipo === "lobo") {
          // Lobo estilo emoji 🐺: cabeza frontal grande sobre una base de cuerpo
          const ch = v.h;
          const cw = v.w + 34;
          const bx = v.x - 14, by = suelo - ch;
          const mx = bx + cw / 2;            // centro X de la cara
          const P = (x, y, w, h, col) => { ctx.fillStyle = col; ctx.fillRect(x, y, w, h); };
          const GRIS = "#5B6470", GRISC = "#7B8493", OSC = "#3E4550", BLANCO = "#EDEFF2", ROSA = "#D98C9A";
          // base del cuerpo (a ras de suelo)
          P(bx + 8, suelo - 18, cw - 16, 18, GRIS);
          // orejas
          ctx.fillStyle = GRIS;
          ctx.beginPath(); ctx.moveTo(bx + 4, by + 14); ctx.lineTo(bx + 14, by - 14); ctx.lineTo(bx + 30, by + 6); ctx.closePath(); ctx.fill();
          ctx.beginPath(); ctx.moveTo(bx + cw - 4, by + 14); ctx.lineTo(bx + cw - 14, by - 14); ctx.lineTo(bx + cw - 30, by + 6); ctx.closePath(); ctx.fill();
          ctx.fillStyle = ROSA;
          ctx.beginPath(); ctx.moveTo(bx + 12, by + 8); ctx.lineTo(bx + 16, by - 6); ctx.lineTo(bx + 24, by + 6); ctx.closePath(); ctx.fill();
          ctx.beginPath(); ctx.moveTo(bx + cw - 12, by + 8); ctx.lineTo(bx + cw - 16, by - 6); ctx.lineTo(bx + cw - 24, by + 6); ctx.closePath(); ctx.fill();
          // cabeza (redondeada)
          ctx.fillStyle = GRIS;
          ctx.beginPath(); ctx.ellipse(mx, by + ch * 0.5, cw * 0.42, ch * 0.5, 0, 0, 7); ctx.fill();
          // frente/entrecejo más claro
          ctx.fillStyle = GRISC;
          ctx.beginPath(); ctx.ellipse(mx, by + ch * 0.36, cw * 0.18, ch * 0.24, 0, 0, 7); ctx.fill();
          // mejillas de pelaje blanco (a los lados del hocico)
          ctx.fillStyle = BLANCO;
          ctx.beginPath(); ctx.ellipse(mx, by + ch * 0.72, cw * 0.30, ch * 0.28, 0, 0, 7); ctx.fill();
          // ojos
          P(mx - 16, by + ch * 0.34, 11, 8, "#FFFFFF");
          P(mx + 5, by + ch * 0.34, 11, 8, "#FFFFFF");
          P(mx - 12, by + ch * 0.35, 5, 6, "#1A1A1A");
          P(mx + 9, by + ch * 0.35, 5, 6, "#1A1A1A");
          // nariz + boca
          P(mx - 5, by + ch * 0.60, 10, 7, "#161616");
          P(mx - 1, by + ch * 0.67, 2, 9, "#161616");
          // colmillos
          P(mx - 7, by + ch - 8, 3, 6, "#FFFFFF");
          P(mx + 4, by + ch - 8, 3, 6, "#FFFFFF");
        } else {
          // Valla de madera
          ctx.fillStyle = "#8B5A2B";
          ctx.fillRect(v.x, suelo - v.h, 6, v.h);
          ctx.fillRect(v.x + v.w - 6, suelo - v.h, 6, v.h);
          ctx.fillStyle = "#A9713B";
          ctx.fillRect(v.x - 5, suelo - v.h + 5, v.w + 10, 6);
          ctx.fillRect(v.x - 5, suelo - Math.floor(v.h / 2), v.w + 10, 6);
        }
      });
      // ── Entidades de los juegos nuevos ──
      if (tema.familia === "flappy") {
        (st.corales || []).forEach((c, ci) => {
          const col1 = ci % 2 === 0 ? "#E8707A" : "#5FB878";
          const col2 = ci % 2 === 0 ? "#B84A56" : "#3E8A54";
          const topH = c.gapY - c.gapH / 2;
          const botY = c.gapY + c.gapH / 2;
          ctx.fillStyle = col1; ctx.fillRect(c.x, 0, 44, topH);
          ctx.fillStyle = col2; ctx.fillRect(c.x, 0, 7, topH); ctx.fillRect(c.x + 37, 0, 7, topH);
          ctx.fillStyle = col1;
          [10, 24, 36].forEach(o => { ctx.beginPath(); ctx.arc(c.x + o, topH, 9, 0, 7); ctx.fill(); });
          ctx.fillStyle = col1; ctx.fillRect(c.x, botY, 44, suelo - botY);
          ctx.fillStyle = col2; ctx.fillRect(c.x, botY, 7, suelo - botY); ctx.fillRect(c.x + 37, botY, 7, suelo - botY);
          ctx.fillStyle = col1;
          [10, 24, 36].forEach(o => { ctx.beginPath(); ctx.arc(c.x + o, botY, 9, 0, 7); ctx.fill(); });
          // Contorno oscuro: separa el coral del agua con nitidez
          ctx.strokeStyle = "rgba(0,0,0,0.25)"; ctx.lineWidth = 2;
          ctx.strokeRect(c.x + 1, -2, 42, topH + 2);
          ctx.strokeRect(c.x + 1, botY, 42, suelo - botY + 2);
        });
      }
      if (tema.familia === "shooter") {
        if (st.jefe) {
          const jx = W - 130, jy = st.jefeYDraw || H * 0.30;
          const P2 = (x, y, w, h, col) => { ctx.fillStyle = col; ctx.fillRect(x, y, w, h); };
          // Rey Lobo: orejas, cabeza, hocico, corona y barra de vida
          ctx.fillStyle = "#5B6470";
          ctx.beginPath(); ctx.moveTo(jx + 6, jy + 16); ctx.lineTo(jx + 18, jy - 14); ctx.lineTo(jx + 36, jy + 8); ctx.closePath(); ctx.fill();
          ctx.beginPath(); ctx.moveTo(jx + 78, jy + 16); ctx.lineTo(jx + 66, jy - 14); ctx.lineTo(jx + 48, jy + 8); ctx.closePath(); ctx.fill();
          ctx.fillStyle = st.jefe.herido > 0 ? "#A86A6A" : "#6B7480";
          ctx.beginPath(); ctx.ellipse(jx + 42, jy + 42, 40, 42, 0, 0, 7); ctx.fill();
          ctx.fillStyle = "#E8EAED";
          ctx.beginPath(); ctx.ellipse(jx + 42, jy + 60, 22, 20, 0, 0, 7); ctx.fill();
          P2(jx + 22, jy + 28, 12, 9, "#FFC800"); P2(jx + 50, jy + 28, 12, 9, "#FFC800");
          P2(jx + 26, jy + 30, 5, 6, "#111"); P2(jx + 54, jy + 30, 5, 6, "#111");
          P2(jx + 37, jy + 52, 10, 7, "#161616");
          P2(jx + 30, jy + 72, 4, 7, "#FFFFFF"); P2(jx + 50, jy + 72, 4, 7, "#FFFFFF");
          ctx.fillStyle = "#FFC800";
          ctx.beginPath(); ctx.moveTo(jx + 20, jy + 2); ctx.lineTo(jx + 26, jy - 16); ctx.lineTo(jx + 34, jy);
          ctx.lineTo(jx + 42, jy - 18); ctx.lineTo(jx + 50, jy); ctx.lineTo(jx + 58, jy - 16);
          ctx.lineTo(jx + 64, jy + 2); ctx.closePath(); ctx.fill();
          ctx.fillStyle = "rgba(0,0,0,0.5)"; ctx.fillRect(jx - 2, jy - 36, 88, 10);
          ctx.fillStyle = "#FF4B4B"; ctx.fillRect(jx, jy - 34, 84, 6);
          ctx.fillStyle = "#58CC02"; ctx.fillRect(jx, jy - 34, 84 * (st.jefe.hp / st.jefe.max), 6);
          // Aviso de disparo: brillo naranja creciente en la boca
          if (st.jefeCarga > 0) {
            const cr2 = 5 + st.jefeCarga * 11;
            const cg = ctx.createRadialGradient(jx + 42, jy + 64, 2, jx + 42, jy + 64, cr2 + 8);
            cg.addColorStop(0, `rgba(255,170,60,${0.5 + st.jefeCarga * 0.5})`);
            cg.addColorStop(1, "rgba(255,120,40,0)");
            ctx.fillStyle = cg; ctx.beginPath(); ctx.arc(jx + 42, jy + 64, cr2 + 8, 0, 7); ctx.fill();
          }
        }
        (st.balas || []).forEach(b => {
          ctx.fillStyle = "#FDF6E3"; ctx.beginPath(); ctx.arc(b.x, b.y, 6, 0, 7); ctx.fill();
          ctx.fillStyle = "rgba(0,0,0,0.15)"; ctx.beginPath(); ctx.arc(b.x + 1.5, b.y + 1.5, 3, 0, 7); ctx.fill();
        });
        (st.balasJefe || []).forEach(b => {
          ctx.fillStyle = "rgba(255,120,40,0.4)"; ctx.beginPath(); ctx.arc(b.x + 16, b.y + 7, 11, 0, 7); ctx.fill();
          ctx.fillStyle = "#FF6A1E"; ctx.beginPath(); ctx.arc(b.x + 12, b.y + 7, 8, 0, 7); ctx.fill();
          ctx.fillStyle = "#FFC04D"; ctx.beginPath(); ctx.arc(b.x + 10, b.y + 6, 4, 0, 7); ctx.fill();
        });
      }
      if (tema.familia === "carriles") {
        const rr = (x, y, w, h, r) => { ctx.beginPath();
          ctx.moveTo(x + r, y); ctx.arcTo(x + w, y, x + w, y + h, r); ctx.arcTo(x + w, y + h, x, y + h, r);
          ctx.arcTo(x, y + h, x, y, r); ctx.arcTo(x, y, x + w, y, r); ctx.closePath(); };
        const CARRIL_X = [62, 170, 278], laneW = 88, OVEJA_Y = H - 190;
        if (!st.iniCarriles2D) {
          // Primera pasada (cuenta atrás congelada): colocar a la oveja en su camino
          st.iniCarriles2D = true;
          if (st.carril === undefined) st.carril = 1;
          st.sx = CARRIL_X[st.carril] - SH / 2;
          st.y = OVEJA_Y;
        }
        // ── Tres caminos rectos de madera ──
        CARRIL_X.forEach(cx3 => {
          const lx = cx3 - laneW / 2;
          // sombra proyectada sobre la hierba
          ctx.fillStyle = "rgba(0,0,0,0.16)"; ctx.fillRect(lx + 6, 0, laneW, H);
          // madera con luz desde la derecha
          const gw = ctx.createLinearGradient(lx, 0, lx + laneW, 0);
          gw.addColorStop(0, "#6E4E24"); gw.addColorStop(0.5, tema.madera); gw.addColorStop(1, "#B08A50");
          ctx.fillStyle = gw; ctx.fillRect(lx, 0, laneW, H);
          // Vetas de la madera (textura sutil)
          ctx.strokeStyle = "rgba(60,38,14,0.18)"; ctx.lineWidth = 2;
          [0.3, 0.55, 0.78].forEach(f => {
            const vx = lx + laneW * f;
            ctx.beginPath(); ctx.moveTo(vx, 0); ctx.lineTo(vx, H); ctx.stroke();
          });
          // raíles: oscuro a la izquierda, iluminado a la derecha
          ctx.fillStyle = tema.maderaBorde; ctx.fillRect(lx, 0, 4, H);
          ctx.fillStyle = "#C89858"; ctx.fillRect(lx + laneW - 3, 0, 3, H);
          // tablones que bajan, con bisel
          for (let li = 0; li < 10; li++) {
            const yy = (((li / 10) + st.faseCamino) % 1) * (H + 40) - 20;
            ctx.strokeStyle = tema.maderaLinea; ctx.lineWidth = 2.6;
            ctx.beginPath(); ctx.moveTo(lx + 4, yy); ctx.lineTo(lx + laneW - 4, yy); ctx.stroke();
            ctx.strokeStyle = "rgba(255,230,180,0.14)"; ctx.lineWidth = 1.6;
            ctx.beginPath(); ctx.moveTo(lx + 4, yy + 3); ctx.lineTo(lx + laneW - 4, yy + 3); ctx.stroke();
          }
        });
        // ── Objetos a tamaño fijo (funden al entrar por arriba) ──
        st.objetos.forEach(o => {
          const ox2 = CARRIL_X[o.carril];
          if (o.y < -40) return;
          ctx.globalAlpha = Math.max(0.15, Math.min(1, (o.y + 46) / 90));
          const vaiven = Math.sin(performance.now() / (o.tipo === "moneda" ? 260 : 120) + (o.fase || 0))
            * (o.tipo === "moneda" ? 3 : 1.8);
          const oy2 = o.y + vaiven;
          if (o.tipo === "moneda") {
            ctx.fillStyle = "rgba(0,0,0,0.22)";
            ctx.beginPath(); ctx.ellipse(ox2, oy2 + 24, 14, 5, 0, 0, 7); ctx.fill();
            ctx.fillStyle = "#B8860B"; ctx.beginPath(); ctx.arc(ox2, oy2 + 8, 16, 0, 7); ctx.fill();
            ctx.fillStyle = "#FFD84D"; ctx.beginPath(); ctx.arc(ox2, oy2 + 6, 14, 0, 7); ctx.fill();
            ctx.fillStyle = "#8A6508"; ctx.font = "bold 17px system-ui";
            ctx.textAlign = "center"; ctx.textBaseline = "middle";
            ctx.fillText("€", ox2, oy2 + 7);
            ctx.textBaseline = "alphabetic"; ctx.textAlign = "left";
          } else {
            // Lobo frontal a tamaño completo
            const wsc = 52, lx2 = ox2 - wsc / 2, ly2 = oy2;
            ctx.fillStyle = "rgba(0,0,0,0.25)";
            ctx.beginPath(); ctx.ellipse(ox2, ly2 + wsc + 4, 30, 6, 0, 0, 7); ctx.fill();
            ctx.fillStyle = "#5B6470";
            ctx.beginPath(); ctx.moveTo(lx2 + 5, ly2 + 14); ctx.lineTo(lx2 + 13, ly2 - 5); ctx.lineTo(lx2 + 23, ly2 + 9); ctx.closePath(); ctx.fill();
            ctx.beginPath(); ctx.moveTo(lx2 + wsc - 5, ly2 + 14); ctx.lineTo(lx2 + wsc - 13, ly2 - 5); ctx.lineTo(lx2 + wsc - 23, ly2 + 9); ctx.closePath(); ctx.fill();
            ctx.fillStyle = "#6B7480";
            ctx.beginPath(); ctx.ellipse(ox2, ly2 + 29, 26, 27, 0, 0, 7); ctx.fill();
            ctx.fillStyle = "#E8EAED";
            ctx.beginPath(); ctx.ellipse(ox2, ly2 + 41, 14, 12, 0, 0, 7); ctx.fill();
            const P3 = (x, y, w, h, col) => { ctx.fillStyle = col; ctx.fillRect(x, y, w, h); };
            P3(ox2 - 12, ly2 + 20, 9, 7, "#FFC800");
            P3(ox2 + 3,  ly2 + 20, 9, 7, "#FFC800");
            P3(ox2 - 9, ly2 + 22, 4, 5, "#111");
            P3(ox2 + 6, ly2 + 22, 4, 5, "#111");
            P3(ox2 - 4, ly2 + 35, 8, 6, "#161616");
            P3(ox2 - 8, ly2 + 48, 3, 6, "#FFF");
            P3(ox2 + 5, ly2 + 48, 3, 6, "#FFF");
          }
        });
        ctx.globalAlpha = 1;
        // Sombra de la oveja sobre su camino
        ctx.fillStyle = "rgba(0,0,0,0.28)";
        ctx.beginPath();
        ctx.ellipse((st.sx || 0) + SH / 2, (st.y || 0) + SH - 1, 34, 8, 0, 0, 7);
        ctx.fill();
        // "+2" flotantes
        (st.flotantes || []).forEach(f => {
          const a = Math.max(0, 1 - f.t / 42);
          ctx.font = "bold 17px system-ui"; ctx.textAlign = "center";
          ctx.lineWidth = 4; ctx.strokeStyle = `rgba(247,240,224,${a})`;
          ctx.strokeText("+4", f.x + 7, f.y);
          ctx.fillStyle = `rgba(43,122,0,${a})`;
          ctx.fillText("+4", f.x + 7, f.y);
          ctx.textAlign = "left";
        });
        // ── Flechas ◀ ▶ abajo, donde descansan los pulgares ──
        [[-1, 12], [1, W - 64]].forEach(([d, bx]) => {
          const activo = st.flechaFlash && st.flechaFlash.d === d && st.flechaFlash.t > 0;
          const by = H - 112 + (activo ? 3 : 0);
          ctx.fillStyle = "#A07800";
          rr(bx, by + 4, 52, 84, 14); ctx.fill();
          const gb = ctx.createLinearGradient(0, by, 0, by + 84);
          if (activo) { gb.addColorStop(0, "#89E219"); gb.addColorStop(1, "#58CC02"); }
          else { gb.addColorStop(0, "#2E7A0A"); gb.addColorStop(1, "#1C4D05"); }
          ctx.fillStyle = gb; rr(bx, by, 52, 84, 14); ctx.fill();
          ctx.strokeStyle = "#FFC800"; ctx.lineWidth = activo ? 3 : 2.5;
          rr(bx, by, 52, 84, 14); ctx.stroke();
          ctx.fillStyle = activo ? "#0A1A0F" : "#FFC800";
          ctx.beginPath();
          if (d < 0) { ctx.moveTo(bx + 35, by + 20); ctx.lineTo(bx + 15, by + 42); ctx.lineTo(bx + 35, by + 64); }
          else       { ctx.moveTo(bx + 17, by + 20); ctx.lineTo(bx + 37, by + 42); ctx.lineTo(bx + 17, by + 64); }
          ctx.closePath(); ctx.fill();
        });
      }

      // Consumible: orbe brillante; disco + icono según el juego destino
      st.consumibles.forEach(k => {
        const fy = k.y + (k.caida ? 0 : Math.sin(performance.now() / 250) * 5);
        const cx = k.x + 18, cy = fy + 18, r = 23;
        const CFG = {
          noche:  { halo: "rgba(150,180,255,0.95)", g: ["#3A4A80", "#1E2A55", "#0E1638"], borde: "#8FA8E8" },
          oro:    { halo: "rgba(120,240,160,0.95)", g: ["#3BE07A", "#1E9E52", "#0E6B34"], borde: "#7DF5A8" },
          mar:    { halo: "rgba(120,230,255,0.95)", g: ["#4FD8E8", "#1E9AB8", "#0A5E78"], borde: "#9AEFF8" },
          jefe:   { halo: "rgba(255,130,130,0.95)", g: ["#F56A6A", "#C42A2A", "#7E0E0E"], borde: "#FF9A9A" },
          prado:  { halo: "rgba(232,192,136,0.95)", g: ["#C89858", "#8A6432", "#5A3E1C"], borde: "#E8C088" },
        }[k.to] || { halo: "rgba(255,224,120,0.95)", g: ["#FFF3B0", "#FFD84D", "#E0A000"], borde: "#B8860B" };
        const glow = ctx.createRadialGradient(cx, cy, 4, cx, cy, r + 14);
        glow.addColorStop(0, CFG.halo); glow.addColorStop(1, "rgba(255,255,255,0)");
        ctx.fillStyle = glow; ctx.beginPath(); ctx.arc(cx, cy, r + 14, 0, 7); ctx.fill();
        const grad = ctx.createRadialGradient(cx - 6, cy - 6, 2, cx, cy, r);
        grad.addColorStop(0, CFG.g[0]); grad.addColorStop(0.6, CFG.g[1]); grad.addColorStop(1, CFG.g[2]);
        ctx.fillStyle = grad; ctx.beginPath(); ctx.arc(cx, cy, r, 0, 7); ctx.fill();
        ctx.strokeStyle = CFG.borde; ctx.lineWidth = 3; ctx.stroke();
        // Icono de alto contraste
        if (k.to === "noche") {
          ctx.fillStyle = "#FFFFFF"; ctx.beginPath(); ctx.arc(cx - 1, cy, 12, 0, 7); ctx.fill();
          ctx.fillStyle = CFG.g[1]; ctx.beginPath(); ctx.arc(cx + 5, cy - 3, 11, 0, 7); ctx.fill();
          ctx.fillStyle = "#FFFFFF"; ctx.fillRect(cx + 8, cy + 6, 3, 3);
        } else if (k.to === "oro") {
          ctx.fillStyle = "#FFFFFF"; ctx.font = "bold 30px system-ui";
          ctx.textAlign = "center"; ctx.textBaseline = "middle";
          ctx.fillText("$", cx, cy + 1);
          ctx.textBaseline = "alphabetic"; ctx.textAlign = "left";
        } else if (k.to === "mar") {
          ctx.strokeStyle = "#FFFFFF"; ctx.lineWidth = 2.5;
          ctx.beginPath(); ctx.arc(cx - 4, cy + 3, 7, 0, 7); ctx.stroke();
          ctx.beginPath(); ctx.arc(cx + 7, cy - 6, 4.5, 0, 7); ctx.stroke();
          ctx.fillStyle = "#FFFFFF"; ctx.beginPath(); ctx.arc(cx + 4, cy + 9, 2.5, 0, 7); ctx.fill();
        } else if (k.to === "jefe") {
          ctx.strokeStyle = "#FFFFFF"; ctx.lineWidth = 3;
          ctx.beginPath(); ctx.arc(cx, cy, 9, 0, 7); ctx.stroke();
          ctx.beginPath(); ctx.moveTo(cx - 14, cy); ctx.lineTo(cx + 14, cy); ctx.stroke();
          ctx.beginPath(); ctx.moveTo(cx, cy - 14); ctx.lineTo(cx, cy + 14); ctx.stroke();
          ctx.fillStyle = "#FFFFFF"; ctx.beginPath(); ctx.arc(cx, cy, 2.5, 0, 7); ctx.fill();
        } else if (k.to === "prado") {
          // Tres caminos que convergen en el horizonte
          ctx.strokeStyle = "#FFFFFF"; ctx.lineWidth = 3; ctx.lineCap = "round";
          [[-9, -2], [0, 0], [9, 2]].forEach(([bx2, tx2]) => {
            ctx.beginPath(); ctx.moveTo(cx + bx2, cy + 12); ctx.lineTo(cx + tx2, cy - 11); ctx.stroke();
          });
          ctx.lineCap = "butt";
        }
      });

      // Sombra de la oveja (runner y guarida): se encoge y aclara al saltar
      if (tema.familia === "runner" || tema.familia === "shooter") {
        const alt = (suelo - SH) - st.y;
        const k2 = Math.max(0, 1 - alt / 160);
        ctx.fillStyle = `rgba(0,0,0,${(0.28 * k2).toFixed(3)})`;
        ctx.beginPath();
        ctx.ellipse((st.sx !== undefined ? st.sx : SX) + SH / 2, suelo - 2,
          30 * (0.6 + 0.4 * k2), 7 * k2 + 2, 0, 0, 7);
        ctx.fill();
      }

      const ovejaX = st.sx !== undefined ? st.sx : SX;
      px.forEach(([x, y, c]) => { ctx.fillStyle = c; ctx.fillRect(ovejaX + x * S, st.y + y * S, S, S); });
      // Flash de transición al coger el consumible
      if (st.transicion > 0) {
        ctx.fillStyle = `rgba(255,255,255,${st.transicion * 0.6})`;
        ctx.fillRect(0, 0, W, H);
      }
      ctx.fillStyle = st.modo === "noche" ? "#DDE4F5" : "#F7F0E0";
      ctx.font = "bold 20px monospace";
      ctx.lineWidth = 3.5; ctx.strokeStyle = "rgba(0,0,0,0.55)";
      ctx.strokeText(String(st.score).padStart(4, "0"), W - 76, 32);
      ctx.fillText(String(st.score).padStart(4, "0"), W - 76, 32);
      if (cuentaRef.current > 0) {
        ctx.fillStyle = "rgba(10,26,15,0.5)"; ctx.fillRect(0, 0, W, H);
        ctx.textAlign = "center";
        ctx.fillStyle = "rgba(255,255,255,0.85)"; ctx.font = "bold 22px system-ui";
        ctx.fillText("¡Prepárate!", W / 2, H / 2 - 76);
        ctx.fillStyle = "#89E219"; ctx.font = "bold 120px system-ui";
        ctx.fillText(String(cuentaRef.current), W / 2, H / 2 + 38);

        ctx.textAlign = "left";
      }
      raf = requestAnimationFrame(loop);
    };
    raf = requestAnimationFrame(loop);
    return () => {
      cancelAnimationFrame(raf);
      tapRef.current = null;
      window.removeEventListener("keydown", onKey);
    };
  }, [jugando, color, equipados]);

  // Cuenta atrás de preparación: 5,4,3,2,1 -> arranca
  useEffect(() => {
    if (!jugando || cuenta <= 0) return;
    const t = setTimeout(() => setCuenta(c => c - 1), 1000);
    return () => clearTimeout(t);
  }, [jugando, cuenta]);

  const cuentaRef = useRef(5);
  useEffect(() => { cuentaRef.current = cuenta; }, [cuenta]);

  const arrancar = () => { setFin(false); setScore(0); cuentaRef.current = 5; setCuenta(5); setJugando(true); };
  useEffect(() => { if (arrancarRef) arrancarRef.current = arrancar; }, []);

  return (
    <div style={{ position: "relative", display: "flex", flexDirection: "column", height: "100%",
      overflowY: jugando ? "hidden" : "auto" }}>
      {/* Pantalla previa: marco con info de partidas y botón Jugar */}
      {!jugando && !fin && (
        <div style={{ display: "flex", justifyContent: "center", padding: "12px 6px" }}>
          <div style={{ position: "relative", width: "100%", maxWidth: 340, margin: "auto",
            background: "linear-gradient(160deg, rgba(88,204,2,0.10), rgba(21,34,16,0.6))",
            border: `2.5px solid ${T.g1}`, borderRadius: 24, padding: "26px 22px 28px",
            textAlign: "center", boxShadow: "0 8px 30px rgba(0,0,0,0.4)" }}>
            {/* esquinas decorativas */}
            <div style={{ position: "absolute", top: 10, left: 10, fontSize: 16 }}>🐑</div>
            <div style={{ position: "absolute", top: 10, right: 10, fontSize: 16 }}>🎮</div>

            <div style={{ fontSize: 13, color: T.au1, fontWeight: 900, letterSpacing: 1.5,
              textTransform: "uppercase", marginBottom: 14 }}>Zona de juego</div>

            <div style={{ fontSize: 14, color: T.cr, fontWeight: 700, lineHeight: 1.55, marginBottom: 14 }}>
              Puedes jugar un total de<br/><b style={{ color: T.g2, fontSize: 17 }}>3 partidas al día</b>
            </div>

            <div style={{ fontSize: 15, color: T.t2, fontWeight: 700, marginBottom: 8 }}>
              Cada partida cuesta un diamante 💎
            </div>
            <div style={{ fontSize: 26, letterSpacing: 6, marginBottom: 6 }}>
              {"💎".repeat(partidasProp)}{"▫️".repeat(3 - partidasProp)}
            </div>
            <div style={{ fontSize: 12, color: T.t3, fontWeight: 700, marginBottom: 20 }}>
              {partidasProp > 0 ? `Te quedan ${partidasProp} hoy` : "Sin partidas por hoy — ¡vuelve mañana!"}
            </div>

            <div style={{ margin: "10px auto 14px", display: "inline-flex", gap: 16,
              background: "rgba(255,255,255,0.06)", border: "1.5px solid rgba(255,255,255,0.12)",
              borderRadius: 12, padding: "8px 16px", fontSize: 12, fontWeight: 800 }}>
              <span style={{ color: T.t2 }}>Hoy: <b style={{ color: T.cr }}>{puntosHoy} pts</b></span>
              <span style={{ color: T.t2 }}>Semana: <b style={{ color: T.au1 }}>{puntosSemana} pts</b></span>
            </div>
            <button onClick={onPagarYJugar} disabled={partidasProp === 0}
              style={{ background: partidasProp > 0 ? "linear-gradient(180deg,#89E219,#58CC02)" : "rgba(255,255,255,0.1)",
                border: "none", borderRadius: 18, color: partidasProp > 0 ? "#0A1A0F" : T.t3,
                fontWeight: 900, fontSize: 18, padding: "15px 40px",
                cursor: partidasProp > 0 ? "pointer" : "not-allowed", fontFamily: "inherit",
                boxShadow: partidasProp > 0 ? "0 5px 0 #2B7A00" : "none",
                display: "inline-flex", alignItems: "center", gap: 10 }}>
              ▶ Jugar <span style={{ fontSize: 19 }}>💎</span>
            </button>

            {/* ── Selector de juego: las 5 esferas ── */}
            {(() => {
              const JUEGOS = [
                { id: "noche", nombre: "El Salto del Rebaño", icono: "🌙",
                  desc: "Toca para saltar lobos al atardecer. Los cuervos no matan: te empujan hacia atrás.",
                  css: "radial-gradient(circle at 35% 30%, #3A4A80, #1E2A55 60%, #0E1638)", borde: "#8FA8E8" },
                { id: "oro", nombre: "La Cámara del Banco", icono: "💲",
                  desc: "Salta entre bloques y recoge monedas €. Si caes al hueco o te come el borde, fin.",
                  css: "radial-gradient(circle at 35% 30%, #3BE07A, #1E9E52 60%, #0E6B34)", borde: "#7DF5A8" },
                { id: "mar", nombre: "Buceo entre Corales", icono: "🫧",
                  desc: "Toca para flotar hacia arriba; sin tocar, bajas y corres por el fondo. Cruza los huecos.",
                  css: "radial-gradient(circle at 35% 30%, #4FD8E8, #1E9AB8 60%, #0A5E78)", borde: "#9AEFF8" },
                { id: "jefe", nombre: "El Rey Lobo", icono: "🎯",
                  desc: "Disparas sola. Jefe abajo: salta su bola y acierta desde el suelo. Jefe arriba: no saltes… salvo para darle.",
                  css: "radial-gradient(circle at 35% 30%, #F56A6A, #C42A2A 60%, #7E0E0E)", borde: "#FF9A9A" },
                { id: "prado", nombre: "Los Tres Caminos", icono: "🐺",
                  desc: "◀ ▶ cambia de camino. Caza todas las monedas que puedas y esquiva a los lobos.",
                  css: "radial-gradient(circle at 35% 30%, #C89858, #8A6432 60%, #5A3E1C)", borde: "#E8C088" },
              ];
              const sel = JUEGOS.find(jj => jj.id === modoElegido) || JUEGOS[0];
              return (
                <div style={{ marginTop: 16 }}>
                  <div style={{ fontSize: 10.5, fontWeight: 900, letterSpacing: 1.2, textTransform: "uppercase",
                    color: T.t2, marginBottom: 9 }}>Elige tu juego</div>
                  <div style={{ display: "flex", justifyContent: "center", gap: 9 }}>
                    {JUEGOS.map(jj => (
                      <button key={jj.id} onClick={() => setModoElegido(jj.id)}
                        style={{ width: 46, height: 46, borderRadius: "50%", padding: 0, cursor: "pointer",
                          background: jj.css, fontFamily: "inherit",
                          border: `2.5px solid ${modoElegido === jj.id ? "#FFC800" : jj.borde}`,
                          boxShadow: modoElegido === jj.id
                            ? "0 0 12px rgba(255,200,0,0.65), 0 3px 0 #A07800"
                            : "0 3px 6px rgba(0,0,0,0.4)",
                          transform: modoElegido === jj.id ? "scale(1.12)" : "scale(1)",
                          transition: "all 0.15s",
                          display: "flex", alignItems: "center", justifyContent: "center" }}>
                        <span style={{ fontSize: 21, lineHeight: 1,
                          filter: "drop-shadow(0 1px 1px rgba(0,0,0,0.5))" }}>{jj.icono}</span>
                      </button>
                    ))}
                  </div>
                  <div style={{ marginTop: 11, minHeight: 58, background: "rgba(255,255,255,0.05)",
                    border: "1.5px solid rgba(255,255,255,0.1)", borderRadius: 12, padding: "9px 12px" }}>
                    <div style={{ fontSize: 12.5, fontWeight: 900, color: T.g2, marginBottom: 3 }}>
                      {sel.icono} {sel.nombre}
                    </div>
                    <div style={{ fontSize: 11.5, color: T.t2, lineHeight: 1.45, fontWeight: 600 }}>
                      {sel.desc}
                    </div>
                  </div>
                </div>
              );
            })()}
          </div>
        </div>
      )}

      {/* Escena del juego (la cuenta atrás 5-4-3-2-1 se dibuja DENTRO del canvas) */}
      {jugando && (
        <div style={{ flex: 1, position: "relative", minHeight: 0 }}>
          <canvas ref={canvasRef} width={340} height={680}
            onPointerDown={(e) => { e.preventDefault(); tapRef.current && tapRef.current(e); }}
            style={{ position: "absolute", inset: 0, width: "100%", height: "100%",
              display: "block", touchAction: "none" }} />
        </div>
      )}

      {/* Fin de partida */}
      {jugando && fin && (
        <div style={{ position: "absolute", inset: 0, display: "flex", flexDirection: "column",
          alignItems: "center", justifyContent: "center", gap: 8, background: "rgba(10,26,15,0.85)",
          borderRadius: 14, animation: "popIn .2s ease-out", padding: "0 16px" }}>
          <div style={{ fontWeight: 900, fontSize: 16 }}>💥 ¡{nombre} ha tropezado!</div>
          <div style={{ fontSize: 13, color: "#FFC800", fontWeight: 800 }}>Puntos: {score} · Récord: {best}</div>
          <div style={{ fontSize: 12, color: "#89E219", fontWeight: 800 }}>
            +{score} pts a tu marcador → esta semana llevas {puntosSemana}
          </div>
          <button onClick={() => { setJugando(false); setFin(false); onSalir && onSalir(); }}
            style={{ background: "linear-gradient(180deg,#89E219,#58CC02)", border: "none",
              borderRadius: 14, color: "#0A1A0F", fontWeight: 900, fontSize: 13.5, padding: "10px 20px",
              cursor: "pointer", fontFamily: "inherit", boxShadow: "0 3px 0 #2B7A00" }}>
            Volver
          </button>
          <div style={{ fontSize: 10.5, color: "rgba(255,255,255,0.4)", textAlign: "center" }}>
            Para jugar otra vez, paga una gema 💎 desde el botón de la oveja
          </div>
        </div>
      )}
    </div>
  );
}


// ─── 🎨 Personalización de Bo (modal a pantalla completa) ────────────────────
function PersonalizacionBo({ nombre, setNombre, color, setColor, equipados, setEquipados, nivel, personalidad, setPersonalidad, onCerrar }) {
  const [borrador, setBorrador] = useState(nombre);
  const [verConjuntos, setVerConjuntos] = useState(false);
  const [abiertos, setAbiertos] = useState({});
  const seccion = { fontSize:11.5, fontWeight:900, color:T.t3, letterSpacing:1, textTransform:"uppercase", margin:"14px 0 8px" };

  const cambiarPersonalidad = (p) => {
    if (nivel < p.nivel) return;
    setPersonalidad(p.id);
  };

  const resetear = () => {
    setEquipados([]);
    setColor("blanca");
    setPersonalidad("normal");
  };

  const btn = (active) => ({
    padding:"8px 12px", borderRadius:14, border:`2px solid ${active ? T.g1 : "rgba(255,255,255,0.12)"}`,
    background: active ? "rgba(88,204,2,0.18)" : "rgba(255,255,255,0.04)",
    color: active ? T.g2 : T.t2, fontWeight:700, fontSize:13, cursor:"pointer",
    fontFamily:"inherit", transition:"all .15s",
  });

  const Desple = ({ id, titulo, resumen, children }) => (
    <div style={{ marginTop:8 }}>
      <button onClick={() => setAbiertos(a => ({ ...a, [id]: !a[id] }))}
        style={{ width:"100%", background: abiertos[id] ? "rgba(88,204,2,0.10)" : "rgba(255,255,255,0.04)",
          border:`2px solid ${abiertos[id] ? T.bG : "rgba(255,255,255,0.10)"}`, borderRadius:13,
          color:T.cr, fontWeight:900, fontSize:12.5, padding:"10px 12px", cursor:"pointer",
          fontFamily:"inherit", display:"flex", justifyContent:"space-between", alignItems:"center" }}>
        <span>{titulo}</span>
        <span style={{ fontSize:10.5, color:T.t3, fontWeight:800, display:"flex", gap:7, alignItems:"center" }}>
          <span>{resumen}</span><span>{abiertos[id] ? "▲" : "▼"}</span>
        </span>
      </button>
      {abiertos[id] && <div style={{ animation:"popIn .18s ease-out", marginTop:8, marginBottom:4 }}>{children}</div>}
    </div>
  );

  const equiparConjunto = (c) => {
    const piezas = c.piezas
      .map(id => ACCESORIOS.find(a => a.id === id))
      .filter(a => a && nivel >= a.nivel);
    if (!piezas.length) return;
    const yaPuesto = piezas.every(p => equipados.includes(p.id));
    if (yaPuesto) {
      // Segundo clic: desequipar el conjunto completo
      setEquipados(eq => eq.filter(id => !piezas.some(p => p.id === id)));
      return;
    }
    setEquipados(eq => {
      const zonasNuevas = piezas.map(p => p.zona);
      const resto = eq.filter(id => {
        const a = ACCESORIOS.find(x => x.id === id);
        if (!a) return false;
        if (a.set) return false;               // fuera TODAS las piezas de conjuntos anteriores
        return !zonasNuevas.includes(a.zona);  // piezas sueltas: swap normal por zona
      });
      return [...resto, ...piezas.map(p => p.id)];
    });
    if (c.color && nivel >= (COLORES.find(x => x.id === c.color)?.nivel || 999)) setColor(c.color);
  };

  const toggleAcc = (a) => {
    if (nivel < a.nivel) return;
    setEquipados(eq => eq.includes(a.id)
      ? eq.filter(x => x !== a.id)                                    // desequipar
      : [...eq.filter(id => ACCESORIOS.find(x => x.id === id)?.zona !== a.zona), a.id]); // swap en su zona
  };
  return (

            <div style={{ position:"fixed", inset:0, background:"rgba(0,0,0,0.6)", zIndex:60,
              display:"flex", justifyContent:"center", alignItems:"stretch", padding:"0" }}>
              <div style={{ background:T.bg, width:"100%", maxWidth:420, height:"100%",
                display:"flex", flexDirection:"column", animation:"popIn .2s ease-out" }}>
                {/* Cabecera (fija arriba) */}
                <div style={{ flexShrink:0, background:T.bg,
                  display:"flex", justifyContent:"space-between", alignItems:"center",
                  padding:"16px 18px", borderBottom:`1px solid rgba(255,255,255,0.08)` }}>
                  <div style={{ fontWeight:900, fontSize:17, color:T.g2 }}>🎨 Personalizar a {nombre}</div>
                  <button onClick={() => onCerrar()}
                    style={{ background:"rgba(255,255,255,0.08)", border:"none", color:T.wh,
                      fontSize:18, cursor:"pointer", fontFamily:"inherit", fontWeight:900,
                      borderRadius:12, width:38, height:38 }}>✕</button>
                </div>

                {/* ZONA CON SCROLL: vista previa + todos los controles.
                    flex:1 + minHeight:0 + overflowY:auto garantizan scroll fiable en
                    móvil, de modo que el footer (guardar) quede SIEMPRE alcanzable. */}
                <div style={{ flex:1, minHeight:0, overflowY:"auto", WebkitOverflowScrolling:"touch" }}>
                {/* Vista previa de la oveja en el modal */}
                <div style={{ display:"flex", justifyContent:"center", padding:"14px 0 4px" }}>
                  <Sheep estado="feliz" equipados={equipados} color={color} size={150} />
                </div>

                <div style={{ padding:"0 18px 16px" }}>
              {/* Nombre (siempre visible) */}
              <div style={seccion}>Nombre</div>
              <div style={{ display:"flex", gap:8, marginBottom:12 }}>
                <input value={nombre} maxLength={12}
                  onChange={e => setNombre(e.target.value)}
                  style={{ flex:1, background:"rgba(255,255,255,0.08)", border:`2px solid ${T.bG}`,
                    borderRadius:12, color:T.wh, fontWeight:900, fontSize:15, padding:"9px 12px",
                    fontFamily:"inherit", outline:"none", minWidth:0 }} />
                <div style={{ display:"flex", alignItems:"center", fontSize:11.5, color:T.t3, fontWeight:700 }}>
                  máx. 12
                </div>
              </div>

              {/* Carácter (desplegable) */}
              <Desple id="caracter" titulo="🎭 Carácter"
                resumen={(PERSONALIDADES.find(p => p.id === personalidad) || {}).nombre}>
                <div style={{ display:"flex", flexWrap:"wrap", gap:7 }}>
                  {PERSONALIDADES.map(p => {
                    const locked = nivel < p.nivel;
                    const on = personalidad === p.id;
                    return (
                      <button key={p.id} onClick={() => cambiarPersonalidad(p)}
                        style={{ ...btn(on), opacity: locked ? 0.45 : 1,
                          cursor: locked ? "not-allowed" : "pointer", padding:"8px 10px" }}>
                        {p.emoji} {p.nombre}
                        <span style={{ fontSize:10, marginLeft:5, fontWeight:900,
                          color: locked ? T.red : on ? T.g2 : T.au1 }}>
                          {locked ? `🔒 ${p.nivel}` : p.nivel > 1 ? `Nv ${p.nivel}` : ""}
                        </span>
                      </button>
                    );
                  })}
                </div>
                {personalidad !== "normal" && (
                  <div style={{ fontSize:11, color:T.t3, marginTop:6, fontStyle:"italic" }}>
                    El carácter añade coletillas a los mensajes de {nombre} — toca el bocadillo para probarlo.
                  </div>
                )}
              </Desple>

              {/* Color y skins (desplegable) */}
              <Desple id="color" titulo="🎨 Color y skins"
                resumen={(COLORES.find(c => c.id === color) || {}).nombre}>
                <div style={{ display:"flex", flexWrap:"wrap", gap:8 }}>
                  {COLORES.map(c => {
                    const locked = nivel < c.nivel;
                    const on = color === c.id;
                    return (
                      <button key={c.id} onClick={() => !locked && setColor(c.id)}
                        title={c.nombre}
                        style={{ width:52, borderRadius:14, border:`2.5px solid ${on ? T.au1 : "rgba(255,255,255,0.15)"}`,
                          background:"rgba(255,255,255,0.04)", padding:"6px 0 4px", cursor: locked ? "not-allowed" : "pointer",
                          opacity: locked ? 0.4 : 1, fontFamily:"inherit" }}>
                        <div style={{ width:24, height:24, borderRadius:8, margin:"0 auto",
                          background: c.patron === "arcoiris"
                            ? "linear-gradient(180deg,#FF5555,#FFD84D,#7ED957,#4FA8F5,#B57EDC)"
                            : c.W,
                          border:`2px solid ${c.w}`, display:"flex", alignItems:"center",
                          justifyContent:"center", fontSize:13 }}>{c.emoji || ""}</div>
                        <div style={{ fontSize:9.5, fontWeight:800, color: locked ? T.red : on ? T.au1 : T.t2, marginTop:3 }}>
                          {locked ? `🔒 ${c.nivel}` : c.nombre.split(" ")[0]}
                        </div>
                      </button>
                    );
                  })}
                </div>
              </Desple>

              {/* Accesorios: una zona = un desplegable */}
              {ZONAS.map(z => {
                const items = ACCESORIOS.filter(a => a.zona === z.id);
                if (!items.length) return null;
                const equipado = items.find(a => equipados.includes(a.id));
                return (
                  <Desple key={z.id} id={"z-" + z.id} titulo={`${z.emoji} ${z.nombre}`}
                    resumen={equipado ? `${equipado.emoji} ${equipado.nombre}` : "— libre —"}>
                    <div style={{ display:"grid", gridTemplateColumns:"1fr 1fr", gap:8 }}>
                      {items.map(a => {
                        const locked = nivel < a.nivel;
                        const on = equipados.includes(a.id);
                        return (
                          <button key={a.id} onClick={() => toggleAcc(a)} style={{
                            ...btn(on), opacity: locked ? 0.45 : 1, textAlign:"left",
                            display:"flex", justifyContent:"space-between", alignItems:"center",
                            cursor: locked ? "not-allowed" : "pointer", padding:"9px 10px",
                          }}>
                            <span style={{ fontSize:12.5 }}>{a.emoji} {a.nombre}</span>
                            <span style={{ fontSize:10.5, color: locked ? T.red : T.au1, fontWeight:900 }}>
                              {locked ? `🔒 ${a.nivel}` : on ? "✓" : `Nv ${a.nivel}`}
                            </span>
                          </button>
                        );
                      })}
                    </div>
                  </Desple>
                );
              })}

              {/* Conjuntos temáticos (desplegable, al final) */}
              <button onClick={() => setVerConjuntos(v => !v)}
                style={{ width:"100%", marginTop:16, background: verConjuntos ? "rgba(206,130,255,0.12)" : "rgba(255,255,255,0.05)",
                  border:`2px solid ${verConjuntos ? "rgba(206,130,255,0.4)" : "rgba(255,255,255,0.12)"}`,
                  borderRadius:14, color: verConjuntos ? "#CE82FF" : T.cr, fontWeight:900, fontSize:13.5,
                  padding:"10px 0", cursor:"pointer", fontFamily:"inherit" }}>
                🎭 Conjuntos completos {verConjuntos ? "▲" : "▼"}
              </button>
              {verConjuntos && (<div style={{ animation:"popIn .2s ease-out", marginTop:2 }}>
              <div style={{ display:"grid", gridTemplateColumns:"1fr 1fr", gap:8 }}>
                {CONJUNTOS.map(c => {
                  const piezas = c.piezas.map(id => ACCESORIOS.find(a => a.id === id)).filter(Boolean);
                  const desbloq = piezas.filter(p => nivel >= p.nivel).length;
                  const completo = desbloq === piezas.length;
                  const puesto = completo && piezas.every(p => equipados.includes(p.id));
                  return (
                    <button key={c.id} onClick={() => equiparConjunto(c)}
                      style={{ ...btn(puesto), opacity: desbloq === 0 ? 0.4 : 1, textAlign:"left",
                        display:"flex", justifyContent:"space-between", alignItems:"center",
                        cursor: desbloq === 0 ? "not-allowed" : "pointer", padding:"9px 10px" }}>
                      <span style={{ fontSize:12.5 }}>{c.emoji} {c.nombre}</span>
                      <span style={{ fontSize:10.5, fontWeight:900,
                        color: completo ? T.au1 : T.t3 }}>
                        {desbloq}/{piezas.length}
                      </span>
                    </button>
                  );
                })}
              </div>
              <div style={{ fontSize:11, color:T.t3, marginTop:6, marginBottom:4, fontStyle:"italic" }}>
                Tocar un conjunto equipa sus piezas desbloqueadas. Todas son combinables entre sets.
              </div>
              </div>)}

              {/* Reseteo a la oveja original */}
              <button onClick={resetear}
                style={{ width:"100%", marginTop:10, background:"rgba(255,75,75,0.08)",
                  border:"2px solid rgba(255,75,75,0.3)", borderRadius:13, color:"#FF8A8A",
                  fontWeight:900, fontSize:12.5, padding:"10px 0", cursor:"pointer",
                  fontFamily:"inherit" }}>
                ↺ Restablecer oveja original
              </button>
                </div>
                </div>

                {/* Footer FIJO: el botón de guardar siempre visible, sin depender
                    del scroll. onCerrar() ya persiste los cambios (guardarBo).
                    El padding inferior respeta la barra del móvil (safe-area). */}
                <div style={{ flexShrink:0, borderTop:"1px solid rgba(255,255,255,0.08)",
                  background:T.bg, padding:"10px 18px calc(12px + env(safe-area-inset-bottom))" }}>
                  <button onClick={() => onCerrar()}
                    style={{ width:"100%", background:`linear-gradient(180deg,#89E219,#58CC02)`,
                      border:"none", borderRadius:16, color:"#0A1A0F", fontWeight:900, fontSize:16,
                      padding:"14px 0", cursor:"pointer", fontFamily:"inherit", boxShadow:"0 4px 0 #2B7A00" }}>
                    ✓ Aplicar cambios
                  </button>
                </div>
              </div>
            </div>
          
  );
}

// ─── 🎉 Bienvenida de Bo (1ª vez): presentación y adopción con nombre propio ───
function BienvenidaBo({ onAdoptar }) {
  const [borrador, setBorrador] = useState("");
  return (
    <div style={{ position:"fixed", inset:0, background:"rgba(0,0,0,0.72)", display:"flex",
      alignItems:"center", justifyContent:"center", zIndex:9600, padding:16 }}>
      <div style={{ background:T.bgCard, border:`2px solid ${T.au1}`, borderRadius:24,
        padding:"24px 20px", maxWidth:340, width:"100%", textAlign:"center" }}>
        <div style={{ fontSize:13, fontWeight:900, color:T.au1, letterSpacing:1.5, textTransform:"uppercase" }}>
          🎉 Nueva compañera
        </div>
        <div style={{ fontWeight:900, fontSize:20, margin:"8px 0 2px", color:T.t1 }}>
          ¡Te presentamos a la nueva mascota del rebaño!
        </div>
        <Sheep estado="feliz" equipados={[]} color="blanca" size={150} />
        <div style={{ fontSize:14, color:T.t2, lineHeight:1.5, margin:"4px 0 14px" }}>
          Ha llegado desde GBH Nutrición para acompañarte en tu progreso.
          Se llama <b style={{color:T.cr}}>Bo</b>… pero puedes ponerle el nombre que tú prefieras:
        </div>
        <input value={borrador} maxLength={12}
          onChange={e => setBorrador(e.target.value)}
          placeholder="Nombre de tu oveja"
          style={{ width:"100%", boxSizing:"border-box", background:"rgba(255,255,255,0.08)",
            border:`2px solid ${T.g1}`, borderRadius:14, color:T.wh, fontWeight:900,
            fontSize:16, padding:"11px 14px", fontFamily:"inherit", outline:"none",
            textAlign:"center", marginBottom:12 }} />
        <button onClick={() => onAdoptar((borrador.trim() || "Bo").slice(0, 12))}
          style={{ width:"100%", background:`linear-gradient(180deg, ${T.g2}, ${T.g1})`,
            border:"none", borderRadius:16, color:T.bg, fontWeight:900, fontSize:16,
            padding:"13px 0", cursor:"pointer", fontFamily:"inherit",
            boxShadow:"0 4px 0 #2B7A00" }}>
          🐑 ¡Adoptar a {borrador.trim() || "Bo"}!
        </button>
      </div>
    </div>
  );
}

// ─── AvatarDisplay usa directamente el Mascot SVG ──────────────────────────
function AvatarDisplay({expr="idle", size=200}){
  return <Mascot expr={expr} size={size}/>;
}


// ─── Pixel-art mascota GBH — cuernos curvados, lana rizada, 7 expresiones ────
function Mascot({expr="idle",size=200}){
  const aura={idle:false,happy:false,excited:true,celebrating:true,sad:false,sleeping:false,legend:true};
  const glow=aura[expr];
  const W1="#3A8A40",W2="#4CAF50",W3="#6BBF6E",W4="#2A6B30";
  const H1="#8B6040",H2="#A07848",H3="#5A3020";
  const F1="#6DBF72",F2="#88CC8A";
  const EY="#1A1414",SH="#FFFFFF";
  const BL="#FF9999",TE="#64B5F6",MO="#4A2A18";
  const GD="#FFD700",GD2="#FFA000";
  const HT="#8090A0";

  const Body=()=>(
    <g>
      {/* ── HORNS (curvados, estilo carnero) ── */}
      <path d="M10 27 C3 23 1 12 5 7 C9 2 18 4 19 11 C20 18 15 24 11 27Z" fill={H1}/>
      <path d="M10 27 C4 23 3 14 7 9 C10 4 17 6 17 11 C12 11 8 15 9 21Z" fill={H2} opacity="0.55"/>
      <path d="M7 9 C10 4 17 6 18 11" stroke={H3} strokeWidth="1.2" fill="none" strokeLinecap="round"/>
      <path d="M38 27 C45 23 47 12 43 7 C39 2 30 4 29 11 C28 18 33 24 37 27Z" fill={H1}/>
      <path d="M38 27 C44 23 45 14 41 9 C38 4 31 6 31 11 C36 11 40 15 39 21Z" fill={H2} opacity="0.55"/>
      <path d="M41 9 C38 4 31 6 30 11" stroke={H3} strokeWidth="1.2" fill="none" strokeLinecap="round"/>
      {/* ── OREJAS ── */}
      <ellipse cx="7"  cy="31" rx="5" ry="8" fill={W1} transform="rotate(-12 7 31)"/>
      <ellipse cx="41" cy="31" rx="5" ry="8" fill={W1} transform="rotate(12 41 31)"/>
      <ellipse cx="7"  cy="31" rx="3" ry="5" fill={BL} opacity="0.5" transform="rotate(-12 7 31)"/>
      <ellipse cx="41" cy="31" rx="3" ry="5" fill={BL} opacity="0.5" transform="rotate(12 41 31)"/>
      {/* ── CUERPO LANA ── */}
      <circle cx="24" cy="32" r="20" fill={W1}/>
      {/* Bultos rizados */}
      <circle cx="12" cy="19" r="9"  fill={W3}/>
      <circle cx="24" cy="15" r="10" fill={W3}/>
      <circle cx="36" cy="19" r="9"  fill={W3}/>
      <circle cx="7"  cy="31" r="7"  fill={W2}/>
      <circle cx="41" cy="31" r="7"  fill={W2}/>
      <circle cx="14" cy="43" r="7"  fill={W2}/>
      <circle cx="24" cy="46" r="8"  fill={W2}/>
      <circle cx="34" cy="43" r="7"  fill={W2}/>
      {/* Espirales de lana */}
      <path d="M12 17 C12 13 17 11 19 14" stroke={W4} strokeWidth="2"   fill="none" strokeLinecap="round"/>
      <path d="M24 13 C24 9 29 7 31 10"  stroke={W4} strokeWidth="2"   fill="none" strokeLinecap="round"/>
      <path d="M36 17 C36 13 41 12 39 15" stroke={W4} strokeWidth="2"  fill="none" strokeLinecap="round"/>
      <path d="M9  31 C7  27 10 23 13 24" stroke={W4} strokeWidth="1.5" fill="none" strokeLinecap="round"/>
      <path d="M39 31 C41 27 38 23 35 24" stroke={W4} strokeWidth="1.5" fill="none" strokeLinecap="round"/>
      {/* ── CARA ── */}
      <ellipse cx="24" cy="32" rx="14" ry="14" fill={F1}/>
      <ellipse cx="21" cy="28" rx="8"  ry="6"  fill={F2} opacity="0.3"/>
      {/* ── NARIZ ── */}
      <rect x="19" y="36" width="10" height="5" rx="2.5" fill={H1}/>
      <circle cx="21.5" cy="38" r="1.5" fill={H3} opacity="0.6"/>
      <circle cx="26.5" cy="38" r="1.5" fill={H3} opacity="0.6"/>
    </g>
  );

  const Expr={
    idle:(
      <g>
        <circle cx="19" cy="28" r="4" fill={EY}/>
        <circle cx="29" cy="28" r="4" fill={EY}/>
        <circle cx="18" cy="27" r="1.8" fill={SH}/>
        <circle cx="28" cy="27" r="1.8" fill={SH}/>
        <path d="M18 35 Q24 38 30 35" stroke={MO} strokeWidth="2" fill="none" strokeLinecap="round"/>
      </g>
    ),
    happy:(
      <g>
        <path d="M14 29 Q19 24 24 29" stroke={EY} strokeWidth="3.5" fill="none" strokeLinecap="round"/>
        <path d="M24 29 Q29 24 34 29" stroke={EY} strokeWidth="3.5" fill="none" strokeLinecap="round"/>
        <path d="M15 34 Q24 42 33 34" stroke={MO} strokeWidth="2.5" fill="none" strokeLinecap="round"/>
        <ellipse cx="13" cy="32" rx="5" ry="3.5" fill={BL} opacity="0.65"/>
        <ellipse cx="35" cy="32" rx="5" ry="3.5" fill={BL} opacity="0.65"/>
      </g>
    ),
    excited:(
      <g>
        <circle cx="19" cy="27" r="5.5" fill={EY}/>
        <circle cx="29" cy="27" r="5.5" fill={EY}/>
        <circle cx="17" cy="25" r="2.5" fill={SH}/>
        <circle cx="27" cy="25" r="2.5" fill={SH}/>
        <path d="M13 20 Q19 16 25 20" stroke={EY} strokeWidth="2.2" fill="none" strokeLinecap="round"/>
        <path d="M23 20 Q29 16 35 20" stroke={EY} strokeWidth="2.2" fill="none" strokeLinecap="round"/>
        <ellipse cx="24" cy="37" rx="5.5" ry="4.5" fill={EY}/>
        <ellipse cx="24" cy="37" rx="4"   ry="3"   fill="#EF5350"/>
      </g>
    ),
    celebrating:(
      <g>
        <path d="M14 28 Q19 23 24 28" stroke={EY} strokeWidth="3.5" fill="none" strokeLinecap="round"/>
        <path d="M24 28 Q29 23 34 28" stroke={EY} strokeWidth="3.5" fill="none" strokeLinecap="round"/>
        <path d="M14 34 Q24 43 34 34" stroke={MO} strokeWidth="2.5" fill="none" strokeLinecap="round"/>
        <text x="1"  y="18" fontSize="10" fill={GD}>★</text>
        <text x="39" y="18" fontSize="10" fill={GD}>★</text>
        <text x="-1" y="32" fontSize="8"  fill={GD}>✦</text>
        <text x="42" y="32" fontSize="8"  fill={GD}>✦</text>
        <ellipse cx="13" cy="32" rx="5" ry="3.5" fill={BL} opacity="0.7"/>
        <ellipse cx="35" cy="32" rx="5" ry="3.5" fill={BL} opacity="0.7"/>
      </g>
    ),
    sad:(
      <g>
        <circle cx="19" cy="29" r="4" fill={EY}/>
        <circle cx="29" cy="29" r="4" fill={EY}/>
        <circle cx="18" cy="28" r="1.8" fill={SH}/>
        <circle cx="28" cy="28" r="1.8" fill={SH}/>
        <path d="M14 22 Q19 26 24 22" stroke={EY} strokeWidth="2.2" fill="none" strokeLinecap="round"/>
        <path d="M24 22 Q29 26 34 22" stroke={EY} strokeWidth="2.2" fill="none" strokeLinecap="round"/>
        <path d="M18 37 Q24 33 30 37" stroke={MO} strokeWidth="2" fill="none" strokeLinecap="round"/>
        <path d="M17 32 Q15 38 16 42" stroke={TE} strokeWidth="3" fill="none" strokeLinecap="round"/>
        <path d="M31 32 Q33 38 32 42" stroke={TE} strokeWidth="3" fill="none" strokeLinecap="round"/>
        <circle cx="15.5" cy="43" r="3" fill={TE} opacity="0.8"/>
        <circle cx="32.5" cy="43" r="3" fill={TE} opacity="0.8"/>
      </g>
    ),
    sleeping:(
      <g>
        {/* Gorro */}
        <path d="M14 22 Q24 11 34 22 L31 15 Q24 5 17 15Z" fill={HT}/>
        <rect x="12" y="21" width="24" height="5" rx="2.5" fill="#607080"/>
        <circle cx="34" cy="12" r="4" fill={SH}/>
        {/* Ojos cerrados */}
        <path d="M13 28 Q19 24 25 28" stroke={EY} strokeWidth="3" fill="none" strokeLinecap="round"/>
        <path d="M23 28 Q29 24 35 28" stroke={EY} strokeWidth="3" fill="none" strokeLinecap="round"/>
        <line x1="14" y1="28" x2="12" y2="25" stroke={EY} strokeWidth="1.8" strokeLinecap="round"/>
        <line x1="19" y1="27" x2="19" y2="24" stroke={EY} strokeWidth="1.8" strokeLinecap="round"/>
        <line x1="24" y1="28" x2="25" y2="25" stroke={EY} strokeWidth="1.8" strokeLinecap="round"/>
        <line x1="24" y1="28" x2="23" y2="25" stroke={EY} strokeWidth="1.8" strokeLinecap="round"/>
        <line x1="29" y1="27" x2="29" y2="24" stroke={EY} strokeWidth="1.8" strokeLinecap="round"/>
        <line x1="34" y1="28" x2="36" y2="25" stroke={EY} strokeWidth="1.8" strokeLinecap="round"/>
        <path d="M20 35 Q24 38 28 35" stroke={MO} strokeWidth="2" fill="none" strokeLinecap="round"/>
        {/* ZZZ */}
        <text x="38" y="24" fontSize="7"  fill="#607080" fontWeight="bold" fontFamily="monospace">z</text>
        <text x="40" y="17" fontSize="8"  fill="#607080" fontWeight="bold" fontFamily="monospace">Z</text>
        <text x="42" y="10" fontSize="9"  fill="#607080" fontWeight="bold" fontFamily="monospace">Z</text>
      </g>
    ),
    legend:(
      <g>
        {/* Corona detallada con joyas */}
        <rect x="14" y="12" width="20" height="7" rx="2" fill={GD}/>
        <polygon points="14,13 17,4 20,13" fill={GD}/>
        <polygon points="21,13 24,2 27,13" fill={GD}/>
        <polygon points="28,13 31,4 34,13" fill={GD}/>
        <rect x="14" y="16" width="20" height="3" rx="1" fill={GD2}/>
        {/* Joyas */}
        <circle cx="17.5" cy="6"    r="2.2" fill="#1A1A1A"/>
        <circle cx="24"   cy="4.5"  r="2.5" fill="#4CAF50"/>
        <circle cx="30.5" cy="6"    r="2.2" fill="#E91E63"/>
        <circle cx="17"   cy="14"   r="1.8" fill="#2196F3"/>
        <circle cx="24"   cy="13.5" r="1.8" fill="#FF5722"/>
        <circle cx="31"   cy="14"   r="1.8" fill="#9C27B0"/>
        {/* Guiño izquierdo */}
        <path d="M13 28 Q19 24 25 28" stroke={EY} strokeWidth="3" fill="none" strokeLinecap="round"/>
        {/* Ojo derecho abierto */}
        <circle cx="30" cy="27" r="4.5" fill={EY}/>
        <circle cx="28.5" cy="25.5" r="2" fill={SH}/>
        {/* Smirk */}
        <path d="M17 35 Q26 41 33 35" stroke={MO} strokeWidth="2.5" fill="none" strokeLinecap="round"/>
        {/* Destellos */}
        <text x="1"  y="27" fontSize="10" fill={GD}>✦</text>
        <text x="39" y="24" fontSize="9"  fill={GD}>★</text>
      </g>
    ),
  };

  return(
    <div style={{position:"relative",width:size,height:size,flexShrink:0}}>
      {glow&&<div style={{position:"absolute",inset:-Math.round(size*0.12),borderRadius:"50%",background:`radial-gradient(circle,${expr==="legend"?"rgba(255,200,0,0.45)":"rgba(88,204,2,0.35)"} 0%,transparent 65%)`,animation:"aura 2.5s ease-in-out infinite",pointerEvents:"none"}}/>}
      <svg viewBox="0 0 48 48" width={size} height={size} style={{display:"block",overflow:"visible"}}>
        <Body/>
        {Expr[expr]||Expr.idle}
      </svg>
    </div>
  );
}

function getExpr(streak,dietDone,allDone,sleepDone){
  if(allDone)return"celebrating";
  if(dietDone&&streak>=100)return"legend";
  if(dietDone&&streak>=7)return"excited";
  if(dietDone)return"happy";
  if(sleepDone&&!dietDone)return"sleeping";
  if(streak===0)return"sad";
  // Si son las 20h+ y no ha registrado la dieta → preocupado
  if(!dietDone&&new Date().getHours()>=20)return"sad";
  return"idle";
}

// ─── Speech bubble ─────────────────────────────────────────────────────────
function Bubble({msg}){
  return(
    <div style={{background:T.cr,borderRadius:22,padding:"11px 18px",maxWidth:230,position:"relative",boxShadow:"0 6px 20px rgba(0,0,0,0.45)",border:`3px solid ${T.au1}`,animation:"popIn 0.4s cubic-bezier(0.34,1.56,0.64,1)"}}>
      <p style={{fontSize:13,fontWeight:800,color:"#2A1800",lineHeight:1.45,textAlign:"center",margin:0,fontFamily:"'Nunito',sans-serif"}}>{msg}</p>
      <div style={{position:"absolute",bottom:-17,left:"50%",transform:"translateX(-50%)",width:0,height:0,borderLeft:"13px solid transparent",borderRight:"13px solid transparent",borderTop:`17px solid ${T.au1}`}}/>
      <div style={{position:"absolute",bottom:-12,left:"50%",transform:"translateX(-50%)",width:0,height:0,borderLeft:"10px solid transparent",borderRight:"10px solid transparent",borderTop:`12px solid ${T.cr}`}}/>
    </div>
  );
}

function getBubbleMsg(name,streak,expr,lang="es"){
  const n=name.split(" ")[0];
  const tr=TRANS[lang]||TRANS.es;
  const r=(k,v={})=>{let s=tr[k]||"";for(const[kk,vv] of Object.entries(v))s=s.split(`{${kk}}`).join(String(vv));return s;};
  if(expr==="celebrating") return r("b_celebrating",{n});
  if(expr==="legend")      return r("b_legend",{s:streak,n});
  if(expr==="excited")     return r("b_excited",{s:streak,n});
  if(expr==="happy")       return r("b_happy",{n});
  if(expr==="sleeping")    return r("b_sleeping",{n});
  if(expr==="sad"&&new Date().getHours()>=20) return r("b_sad_late",{n});
  if(expr==="sad")         return r("b_sad",{n});
  return r("b_default",{n});
}

// ─── Streak counter (big Duolingo-style) ─────────────────────────────────────
function StreakBadge({value,label,icon,color,bg}){
  return(
    <div style={{background:bg||"rgba(255,255,255,0.07)",borderRadius:18,padding:"8px 14px",display:"flex",alignItems:"center",gap:8,border:`1.5px solid ${color}30`}}>
      <span style={{fontSize:22,lineHeight:1}}>{icon}</span>
      <div>
        <div style={{fontSize:18,fontWeight:900,color,lineHeight:1}}>{value}</div>
        <div style={{fontSize:8,color:T.t2,textTransform:"uppercase",letterSpacing:"0.07em",marginTop:1}}>{label}</div>
      </div>
    </div>
  );
}

// ─── Weekly path (Duolingo-style nodes) ──────────────────────────────────────

// ─── Sistema de Desafíos Semanales ───────────────────────────────────────────
const CHALLENGE_POOL = [
  // Formato: {id, icon, title, title_en, desc, desc_en, type, goal, xp, gems}
  // type: "diet_days"|"perfect_days"|"steps_day"|"hydration_days"|"sleep_days"|"quiz_days"|"streak_keep"|"weight_reg"|"xp_week"
  {id:"c01",icon:"🥗",title:"Semana de dieta",       title_en:"Diet week",          desc:"Registra la dieta 5 días esta semana",        desc_en:"Log your diet 5 days this week",         type:"diet_days",       goal:5,  xp:40, gems:10},
  {id:"c02",icon:"💪",title:"Semana perfecta",        title_en:"Perfect week",       desc:"Completa 3 días perfectos (4 misiones)",      desc_en:"Complete 3 perfect days (4 missions)",   type:"perfect_days",    goal:3,  xp:60, gems:15},
  {id:"c03",icon:"👟",title:"10k tres veces",         title_en:"10k three times",    desc:"Llega a 10.000 pasos al menos 3 días",        desc_en:"Reach 10,000 steps at least 3 days",     type:"steps_day",       goal:3,  xp:45, gems:10},
  {id:"c04",icon:"💧",title:"Hidratación constante",  title_en:"Stay hydrated",      desc:"Completa la hidratación 4 días esta semana",  desc_en:"Complete hydration 4 days this week",    type:"hydration_days",  goal:4,  xp:35, gems:8 },
  {id:"c05",icon:"😴",title:"Duerme bien",            title_en:"Sleep well",         desc:"Duerme 7h al menos 4 días esta semana",       desc_en:"Sleep 7h at least 4 days this week",     type:"sleep_days",      goal:4,  xp:35, gems:8 },
  {id:"c06",icon:"🧠",title:"Semana quiz",            title_en:"Quiz week",          desc:"Haz el quiz 4 días esta semana",              desc_en:"Complete the quiz 4 days this week",     type:"quiz_days",       goal:4,  xp:50, gems:12},
  {id:"c07",icon:"🔥",title:"Mantén la racha",        title_en:"Keep the streak",    desc:"No pierdas la racha durante 5 días seguidos", desc_en:"Don't break your streak for 5 days",     type:"streak_keep",     goal:5,  xp:55, gems:12},
  {id:"c08",icon:"⚖️",title:"Pesaje semanal",         title_en:"Weekly weigh-in",    desc:"Registra tu peso este fin de semana",         desc_en:"Log your weight this weekend",           type:"weight_reg",      goal:1,  xp:30, gems:8 },
  {id:"c09",icon:"⚡",title:"Constante esta semana",    title_en:"Week consistency",   desc:"Registra la dieta al menos 4 días",           desc_en:"Log your diet at least 4 days",          type:"diet_days",       goal:4,  xp:50, gems:15},
  {id:"c10",icon:"🍽️",title:"Dieta impecable",        title_en:"Flawless diet",      desc:"Registra la dieta los 7 días de la semana",   desc_en:"Log your diet all 7 days this week",     type:"diet_days",       goal:7,  xp:80, gems:20},
  {id:"c11",icon:"🌟",title:"Semana de lujo",         title_en:"Luxury week",        desc:"Completa 5 días perfectos (4 misiones)",      desc_en:"Complete 5 perfect days (4 missions)",   type:"perfect_days",    goal:5,  xp:90, gems:25},
  {id:"c12",icon:"🏃",title:"Maratonista",            title_en:"Marathoner",         desc:"Llega a 10.000 pasos 5 días esta semana",     desc_en:"Reach 10,000 steps 5 days this week",    type:"steps_day",       goal:5,  xp:60, gems:15},
  {id:"c13",icon:"🚿",title:"Hidratación total",      title_en:"Full hydration",     desc:"Completa la hidratación los 7 días",          desc_en:"Complete hydration all 7 days",          type:"hydration_days",  goal:7,  xp:55, gems:14},
  {id:"c14",icon:"🛌",title:"Sueño de campeón",       title_en:"Champion sleep",     desc:"Duerme 7h los 7 días de la semana",           desc_en:"Sleep 7h all 7 days this week",          type:"sleep_days",      goal:7,  xp:55, gems:14},
  {id:"c15",icon:"📚",title:"Quiz adicto",            title_en:"Quiz addict",        desc:"Haz el quiz los 7 días de la semana",         desc_en:"Complete the quiz all 7 days",           type:"quiz_days",       goal:7,  xp:70, gems:18},
  {id:"c16",icon:"🐑",title:"Racha imparable",        title_en:"Unstoppable streak", desc:"Mantén la racha los 7 días de la semana",     desc_en:"Keep your streak all 7 days",            type:"streak_keep",     goal:7,  xp:75, gems:18},
  {id:"c17",icon:"📈",title:"Dieta consistente",      title_en:"Diet consistency",   desc:"Registra la dieta 5 días esta semana",        desc_en:"Log your diet 5 days this week",         type:"diet_days",       goal:5,  xp:75, gems:20},
  {id:"c18",icon:"🎯",title:"Constancia total",       title_en:"Total consistency",  desc:"Registra la dieta y duerme bien 5 días",      desc_en:"Log diet and sleep well 5 days",         type:"perfect_days",    goal:4,  xp:65, gems:16},
  {id:"c19",icon:"💦",title:"Semana saludable",       title_en:"Healthy week",       desc:"Hidratación y sueño completos 5 días",        desc_en:"Full hydration and sleep 5 days",        type:"hydration_days",  goal:5,  xp:50, gems:12},
  {id:"c20",icon:"🏆",title:"Campeón total",          title_en:"Total champion",     desc:"Completa las 4 misiones 6 días esta semana",  desc_en:"Complete all 4 missions 6 days this week",type:"perfect_days",   goal:6,  xp:100,gems:30},
  {id:"c21",icon:"💪",title:"Seis de seis",           title_en:"Six of six",         desc:"Registra la dieta 6 días esta semana",        desc_en:"Log your diet 6 days this week",         type:"diet_days",       goal:6,  xp:60, gems:18},
];

// Obtener los 3 desafíos de la semana actual (rotan cada lunes)
function getWeekChallenges(){
  const {w,y} = getISOWeek();
  const seed = y*100+w;
  const idx  = (seed % 7) * 3; // 0,3,6,9,12,15,18 (siempre 3 seguidos)
  return [
    CHALLENGE_POOL[idx % CHALLENGE_POOL.length],
    CHALLENGE_POOL[(idx+1) % CHALLENGE_POOL.length],
    CHALLENGE_POOL[(idx+2) % CHALLENGE_POOL.length],
  ];
}

// Calcular progreso de un desafío según los logs de la semana actual
function getChallengeProgress(ch, logs, weights, xp, streak){
  const today = new Date();
  const dow   = today.getDay();
  // Fechas de esta semana (lunes a hoy)
  const weekDates = Array.from({length:7},(_,i)=>{
    const d=new Date();d.setDate(today.getDate()-(dow===0?6:dow-1)+i);
    return toKey(d);
  }).filter(d=>d<=toKey());

  switch(ch.type){
    case "diet_days":
      return weekDates.filter(d=>logs.find(l=>l.date===d&&l.diet)).length;
    case "perfect_days":
      return weekDates.filter(d=>logs.find(l=>l.date===d&&l.diet&&l.steps&&l.hydration&&l.sleep)).length;
    case "steps_day":
      return weekDates.filter(d=>logs.find(l=>l.date===d&&l.steps)).length;
    case "hydration_days":
      return weekDates.filter(d=>logs.find(l=>l.date===d&&l.hydration)).length;
    case "sleep_days":
      return weekDates.filter(d=>logs.find(l=>l.date===d&&l.sleep)).length;
    case "quiz_days":
      return weekDates.filter(d=>lsGet("gbh:quiz:"+(window.__gbhUID||"")+":"+d,false)).length;
    case "streak_keep":
      return Math.min(streak, ch.goal);
    case "weight_reg":
      return weights.filter(w=>weekDates.includes(w.date)&&!w.isInitial).length>0?1:0;
    case "xp_week":{
      // XP ganado esta semana (guardado por semana)
      const {w:wn,y:yn}=getISOWeek();
      return lsGet(`gbh:weekXP:${yn}:${wn}`,0);
    }
    default: return 0;
  }
}

// helper: número de semana ISO del año
function getISOWeek(d=new Date()){
  const tmp=new Date(Date.UTC(d.getFullYear(),d.getMonth(),d.getDate()));
  tmp.setUTCDate(tmp.getUTCDate()+4-(tmp.getUTCDay()||7));
  const yearStart=new Date(Date.UTC(tmp.getUTCFullYear(),0,1));
  return{w:Math.ceil((((tmp-yearStart)/86400000)+1)/7),y:tmp.getUTCFullYear()};
}

function WeekPath({logs,onOpenChest}){
  const t=useLang();
  const today=new Date(),dow=today.getDay();
  const dayLbls=t("dayLabels");
  const days=Array.from({length:7},(_,i)=>{
    const d=new Date();d.setDate(today.getDate()-(dow===0?6:dow-1)+i);
    const key=toKey(d),isToday=key===toKey(),done=!!logs.find(l=>l.date===key&&l.diet);
    return{label:dayLbls[i],key,isToday,done,isPast:d<today&&!isToday};
  });
  const completedCount=days.filter(d=>d.done).length;
  const weekUnlocked=completedCount===7;
  // Clave del cofre: año+semana → se resetea cada lunes
  const {w,y}=getISOWeek();
  const chestKey=`gbh:weekChest:${y}:${w}`;
  const chestOpened=lsGet(chestKey,false);
  const chestReady=weekUnlocked&&!chestOpened;

  return(
    <div style={{background:T.bgWood,borderRadius:24,padding:"16px 18px",border:`2px solid ${chestReady?T.au1:T.bW}`,boxShadow:chestReady?`0 6px 0 ${T.au3},0 0 20px ${T.au1}40`:"0 6px 0 rgba(0,0,0,0.4)",marginBottom:14,transition:"all 0.4s"}}>
      <div style={{display:"flex",justifyContent:"space-between",alignItems:"center",marginBottom:14}}>
        <div style={{fontSize:11,color:T.au1,textTransform:"uppercase",letterSpacing:"0.1em",fontWeight:900}}>{t("weeklyProgress")}</div>
        <div style={{fontSize:12,fontWeight:800,color:T.t2}}>{completedCount}/7 {t("daysUnit")}</div>
      </div>
      <div style={{display:"flex",alignItems:"center",gap:8}}>
        {/* Burbujas de días */}
        <div style={{display:"flex",alignItems:"center",flex:1}}>
          {days.map((day,i)=>(
            <div key={day.key} style={{display:"flex",alignItems:"center",flex:1}}>
              <div style={{display:"flex",flexDirection:"column",alignItems:"center",gap:6,flex:"0 0 auto",zIndex:2}}>
                <div style={{
                  width:day.isToday?40:34,height:day.isToday?40:34,borderRadius:"50%",
                  background:day.done?`linear-gradient(135deg,${T.g1},${T.g2})`:day.isToday?'linear-gradient(135deg,'+T.au1+','+T.au2+')':"rgba(255,255,255,0.07)",
                  border:`3px solid ${day.done?T.g3:day.isToday?T.au3:"rgba(255,255,255,0.12)"}`,
                  display:"flex",alignItems:"center",justifyContent:"center",
                  boxShadow:day.done?`0 4px 0 ${T.g3}`:day.isToday?`0 4px 0 ${T.au3}`:"0 3px 0 rgba(0,0,0,0.4)",
                  animation:day.isToday&&!day.done?"pulse 2s ease-in-out infinite":"none",
                  transition:"all 0.3s",
                }}>
                  {day.done?<span style={{fontSize:16,color:"white",fontWeight:900}}>✓</span>
                  :<span style={{fontSize:10,fontWeight:900,color:day.isToday?"#1A1000":T.t3}}>{day.label}</span>}
                </div>
                {day.isToday&&<div style={{width:5,height:5,borderRadius:"50%",background:T.au1,boxShadow:`0 0 8px ${T.au1}`}}/>}
              </div>
              {i<days.length-1&&(
                <div style={{flex:1,height:5,margin:"0 2px",marginBottom:day.isToday?12:5,background:day.done&&days[i+1]?.done?`linear-gradient(90deg,${T.g1},${T.g2})`:"rgba(255,255,255,0.08)",borderRadius:4}}/>
              )}
            </div>
          ))}
        </div>

        {/* Cofre semanal a la derecha */}
        <div
          onClick={chestReady?onOpenChest:undefined}
          title={chestReady?t("chestUnlocked"):weekUnlocked&&chestOpened?t("chestOpenedWeek"):t("chestDaysLeft",{n:7-completedCount,d:7-completedCount!==1?t("daysUnit"):t("dayUnit")})}
          style={{
            width:52,height:52,borderRadius:16,flexShrink:0,
            background:chestReady?'linear-gradient(135deg,'+T.au1+','+T.au2+')'
              :weekUnlocked&&chestOpened?`linear-gradient(135deg,rgba(88,204,2,0.3),rgba(43,122,0,0.2))`
              :"rgba(255,255,255,0.06)",
            border:`3px solid ${chestReady?T.au1:weekUnlocked&&chestOpened?T.g1:"rgba(255,255,255,0.1)"}`,
            display:"flex",alignItems:"center",justifyContent:"center",
            fontSize:26,cursor:chestReady?"pointer":"default",
            boxShadow:chestReady?`0 5px 0 ${T.au3},0 0 16px ${T.au1}60`:"0 3px 0 rgba(0,0,0,0.4)",
            animation:chestReady?"pulse 1.5s ease-in-out infinite":"none",
            transition:"all 0.4s",
            filter:chestReady?"none":"grayscale(0.7) brightness(0.6)",
          }}>
          {chestOpened&&weekUnlocked?"✅":chestReady?"🎁":"🎁"}
        </div>
      </div>
      {/* Texto de progreso hacia el cofre */}
      <div style={{fontSize:10,color:chestReady?T.au1:T.t2,marginTop:10,fontFamily:"'DM Sans',sans-serif",textAlign:"right",fontWeight:chestReady?900:400}}>
        {chestReady?t("chestUnlocked")
          :chestOpened&&weekUnlocked?t("chestOpenedWeek")
          :t("chestDaysLeft",{n:7-completedCount,d:7-completedCount!==1?t("daysUnit"):t("dayUnit")})}
      </div>
    </div>
  );
}

// ─── Big action button (Duolingo green pill) ──────────────────────────────────
function BigBtn({icon,label,done,onClick}){
  const t=useLang();
  return done?(
    <div style={{background:`linear-gradient(135deg,rgba(43,122,0,0.5),rgba(88,204,2,0.25))`,border:`3px solid ${T.g1}`,borderRadius:20,padding:"17px 20px",marginBottom:12,display:"flex",alignItems:"center",justifyContent:"center",gap:12,boxShadow:`0 6px 0 ${T.g3}`}}>
      <span style={{fontSize:28}}>✅</span>
      <span style={{fontWeight:900,fontSize:16,color:T.g2}}>{t("dietDone")}</span>
    </div>
  ):(
    <button onClick={onClick} style={{width:"100%",padding:"18px 20px",borderRadius:20,border:`3px solid ${T.g3}`,cursor:"pointer",fontSize:17,fontWeight:900,background:`linear-gradient(135deg,${T.g1},${T.g2})`,color:"white",boxShadow:`0 6px 0 ${T.g3}`,transition:"all 0.15s",letterSpacing:"0.02em",display:"flex",alignItems:"center",justifyContent:"center",gap:14,animation:"glow 2.5s ease-in-out infinite",marginBottom:12,fontFamily:"'Nunito',sans-serif"}}>
      <span style={{fontSize:28}}>🍽️</span>{label}
    </button>
  );
}

// ─── Desglose de dieta: mini-botones por toma (☀️🍎🍽️🥤🌙) ────────────────────
// Sustituye al botón único de dieta cuando el paciente tiene plan publicado.
// Cada botón refleja el estado registrado con el color de PLAN_CUMPL; sin
// registrar se ve apagado. La tarjeta se pone verde al registrar TODAS las tomas.
function MealBtns({tomas, meals, done, lang, onTap}){
  const reg = tomas.filter(tm=>meals[tm]).length;
  // ── Oveja-guía 🐑: señala la toma de la franja horaria actual (hora local del
  // móvil). Se recoloca sola cada minuto por si la app queda abierta. Con tomas
  // ausentes (p. ej. sin merienda), apunta a la última toma cuya franja empezó.
  const [,setTick]=React.useState(0);
  React.useEffect(()=>{ const id=setInterval(()=>setTick(x=>x+1),60000); return ()=>clearInterval(id); },[]);
  const _ahora=new Date(); const _h=_ahora.getHours()+_ahora.getMinutes()/60;
  let idxOveja=0; tomas.forEach((tm,i)=>{ if(_h>=(PLAN_TOMA_HORA[tm]??0)) idxOveja=i; });
  const LBL = lang==="en"
    ? {Desayuno:"BRKFST",Almuerzo:"SNACK 1",Comida:"LUNCH",Merienda:"SNACK 2",Cena:"DINNER"}
    : {Desayuno:"DESAY.",Almuerzo:"ALMUER.",Comida:"COMIDA",Merienda:"MERIEN.",Cena:"CENA"};
  return(
    <div style={{background:done?"linear-gradient(135deg,rgba(43,122,0,0.5),rgba(88,204,2,0.25))":T.bgWood,
      border:`3px solid ${done?T.g1:T.g3}`,borderRadius:20,padding:"13px 12px 11px",marginBottom:12,
      boxShadow:`0 6px 0 ${done?T.g3:"rgba(0,0,0,0.4)"}`,transition:"all 0.25s"}}>
      <div style={{display:"flex",alignItems:"center",justifyContent:"center",gap:8,marginBottom:10}}>
        <span style={{fontSize:20}}>{done?"✅":"🍽️"}</span>
        <span style={{fontWeight:900,fontSize:14,color:done?T.g2:T.t1,fontFamily:"'Nunito',sans-serif"}}>
          {done
            ? (lang==="en"?"Today's diet logged! +15 XP":"¡Dieta del día registrada! +15 XP")
            : (lang==="en"?`Log your meals · ${reg}/${tomas.length}`:`Registra tus comidas · ${reg}/${tomas.length}`)}
        </span>
      </div>
      {/* Fila espejo de la botonera: la oveja cae exactamente sobre su toma */}
      {!done&&(
        <div style={{display:"flex",gap:6,justifyContent:"center",marginBottom:2}}>
          {tomas.map((tm,i)=>(
            <div key={tm} style={{flex:1,maxWidth:72,minWidth:0,display:"flex",flexDirection:"column",alignItems:"center",lineHeight:1,minHeight:26}}>
              {i===idxOveja&&(<>
                <span style={{fontSize:15,display:"inline-block",animation:"tomaBob 1.6s ease-in-out infinite"}}>🐑</span>
                <span style={{fontSize:8,color:T.t3,marginTop:1}}>▼</span>
              </>)}
            </div>
          ))}
        </div>
      )}
      <div style={{display:"flex",gap:6,justifyContent:"center"}}>
        {tomas.map(tm=>{
          const est=meals[tm];
          const info=est?PLAN_CUMPL.find(x=>x.k===est):null;
          const c=info?.c||T.g1;
          return(
            <button key={tm} onClick={()=>onTap(tm)} title={tm} style={{
              flex:1,maxWidth:72,minWidth:0,display:"flex",flexDirection:"column",alignItems:"center",gap:3,
              background:est?c+"2e":"rgba(255,255,255,0.06)",
              border:`2px solid ${est?c:"rgba(255,255,255,0.16)"}`,
              borderRadius:14,padding:"9px 2px 7px",cursor:"pointer",
              boxShadow:est?`0 3px 0 ${c}55`:"0 3px 0 rgba(0,0,0,0.35)",
              transition:"all 0.15s",fontFamily:"'Nunito',sans-serif"}}>
              <span style={{fontSize:19,lineHeight:1,filter:est?"none":"grayscale(0.55)"}}>{PLAN_TOMA_IC[tm]}</span>
              <span style={{fontSize:7.5,fontWeight:900,color:est?c:T.t3,letterSpacing:"0.02em",whiteSpace:"nowrap"}}>{LBL[tm]}</span>
              <span style={{fontSize:11,lineHeight:1}}>{est?(info?.ic||"✅"):<span style={{color:T.t3}}>○</span>}</span>
            </button>
          );
        })}
      </div>
      <div style={{textAlign:"center",marginTop:8,fontSize:9.5,color:T.t3,fontFamily:"'DM Sans',sans-serif",lineHeight:1.4}}>
        {lang==="en"
          ? "Tap = followed ✅ · tap a logged meal to edit it in your daily plan"
          : "Toca = seguida ✅ · toca una comida registrada para editarla en tu plan del día"}
      </div>
    </div>
  );
}

// ─── Mission row ──────────────────────────────────────────────────────────────
function MRow({num,icon,label,done,onToggle,xpR=5,children}){
  return(
    <div style={{background:done?`linear-gradient(135deg,rgba(43,122,0,0.45),rgba(88,204,2,0.2))`:T.bgCard,border:`2px solid ${done?T.g1:T.bW}`,borderRadius:20,padding:"14px 16px",marginBottom:10,boxShadow:done?`0 5px 0 ${T.g3}`:"0 4px 0 rgba(0,0,0,0.4)",transition:"all 0.2s",transform:done?"scale(1.01)":"scale(1)"}}>
      <div style={{display:"flex",alignItems:"center",gap:14}}>
        <div style={{width:38,height:38,borderRadius:14,background:done?T.g1:T.bW,display:"flex",alignItems:"center",justifyContent:"center",flexShrink:0,fontWeight:900,fontSize:16,color:"white",boxShadow:done?`0 3px 0 ${T.g3}`:"0 3px 0 rgba(0,0,0,0.5)",border:`2px solid ${done?T.g3:"rgba(255,255,255,0.1)"}`}}>
          {done?"✓":num}
        </div>
        <div style={{flex:1}}>
          <div style={{display:"flex",alignItems:"center",gap:8}}>
            <span style={{fontSize:22}}>{icon}</span>
            <div>
              <div style={{fontSize:14,fontWeight:800,color:done?T.t1:"rgba(255,255,255,0.55)"}}>{label}</div>
              <div style={{fontSize:11,color:T.au1,fontWeight:700}}>+{xpR} XP{done?` · ${React.useContext(LangCtx)==="en"?"Completed!":"¡Completado!"}`:""}</div>
            </div>
          </div>
        </div>
        <button onClick={onToggle} style={{width:30,height:30,borderRadius:10,border:`2.5px solid ${done?T.g1:"rgba(255,255,255,0.15)"}`,background:done?T.g1:"transparent",display:"flex",alignItems:"center",justifyContent:"center",cursor:"pointer",flexShrink:0,transition:"all 0.2s"}}>
          {done&&<span style={{fontSize:14,color:"white",fontWeight:900}}>✓</span>}
        </button>
      </div>
      {children&&<div style={{marginTop:10}}>{children}</div>}
    </div>
  );
}

// ─── Steps progress bar ───────────────────────────────────────────────────────
function StepsWidget({done,stepCount,onToggle,onUpdateSteps}){
  const t=useLang();
  const pct=Math.min((stepCount/10000)*100,100);
  return(
    <div style={{background:done?`linear-gradient(135deg,rgba(43,122,0,0.45),rgba(88,204,2,0.2))`:T.bgCard,border:`2px solid ${done?T.g1:T.bW}`,borderRadius:20,padding:"14px 16px",marginBottom:10,boxShadow:done?`0 5px 0 ${T.g3}`:"0 4px 0 rgba(0,0,0,0.4)"}}>
      <div style={{display:"flex",alignItems:"center",gap:14,marginBottom:12}}>
        <div style={{width:38,height:38,borderRadius:14,background:done?T.g1:T.bW,display:"flex",alignItems:"center",justifyContent:"center",flexShrink:0,fontWeight:900,fontSize:16,color:"white",boxShadow:done?`0 3px 0 ${T.g3}`:"0 3px 0 rgba(0,0,0,0.5)",border:`2px solid ${done?T.g3:"rgba(255,255,255,0.1)"}`}}>
          {done?"✓":"3"}
        </div>
        <div style={{flex:1}}>
          <div style={{display:"flex",alignItems:"center",gap:8}}>
            <span style={{fontSize:22}}>👟</span>
            <div>
              <div style={{fontSize:14,fontWeight:800,color:done?T.t1:"rgba(255,255,255,0.55)"}}>{t("stepsLabel")}</div>
              <div style={{fontSize:11,color:T.au1,fontWeight:700}}>{t("stepsXP",{n:stepCount.toLocaleString()})}</div>
            </div>
          </div>
        </div>
      </div>
      <div style={{background:"rgba(255,255,255,0.08)",borderRadius:10,height:12,overflow:"hidden",marginBottom:10,boxShadow:"inset 0 2px 4px rgba(0,0,0,0.3)"}}>
        <div style={{height:"100%",width:`${pct}%`,background:`linear-gradient(90deg,${T.g1},${T.g2})`,borderRadius:10,transition:"width 0.5s ease",boxShadow:`0 0 8px ${T.g1}60`}}/>
      </div>
      <div style={{display:"flex",gap:8}}>
        {!done&&[1000,2500,5000,10000].map(v=>(
          <button key={v} onClick={()=>onUpdateSteps(Math.min(stepCount+v,99999))} style={{flex:1,background:"rgba(255,255,255,0.08)",border:`1.5px solid rgba(255,255,255,0.12)`,borderRadius:12,padding:"10px 0",color:T.t1,fontWeight:800,fontSize:11,cursor:"pointer",boxShadow:"0 3px 0 rgba(0,0,0,0.4)",fontFamily:"'Nunito',sans-serif"}}>+{v>=1000?v/1000+"k":v}</button>
        ))}
      </div>
    </div>
  );
}

// ─── Chart tooltip ────────────────────────────────────────────────────────────
const CTip=({active,payload})=>{
  const t=useLang();
  if(!active||!payload?.length)return null;
  const d=payload[0]?.payload;
  return(<div style={{background:T.bgWood,border:`1px solid ${T.bA}`,borderRadius:12,padding:"8px 14px"}}><div style={{color:T.t2,fontSize:11}}>{d?.date}</div>{d?.weight&&<div style={{color:T.au1,fontWeight:800,fontSize:15}}>{d.weight} kg</div>}{d?.ma&&<div style={{color:T.xp,fontSize:12,marginTop:2}}>{t("chartTooltipTrend")} {d.ma.toFixed(1)} kg</div>}</div>);
};

// ─── Streak overlay (Duolingo-style, negro) ───────────────────────────────────
// ─── StreakCelebrationOverlay — oveja pixelart + llama que sube de nivel ──────
function StreakOverlay({active, streak}){
  if(!active) return null;
  const t = useLang();
  const lang = lsGet("gbh:lang","es");

  // Pixel-art sheep SVG inline (la mascota GBH en verde)
  const SheepPixel = ({style={}})=>(
    <svg width="80" height="80" viewBox="0 0 16 16" style={{imageRendering:"pixelated",...style}}>
      {/* cuerpo — verde oscuro */}
      <rect x="3" y="7" width="10" height="7" fill="#2E7D32"/>
      {/* barriga más clara */}
      <rect x="5" y="9" width="6" height="4" fill="#43A047"/>
      {/* cabeza */}
      <rect x="4" y="3" width="8" height="6" fill="#2E7D32"/>
      {/* orejas */}
      <rect x="2" y="4" width="2" height="3" fill="#388E3C"/>
      <rect x="12" y="4" width="2" height="3" fill="#388E3C"/>
      {/* ojos — blancos con pupila */}
      <rect x="6" y="5" width="2" height="2" fill="white"/>
      <rect x="9" y="5" width="2" height="2" fill="white"/>
      <rect x="7" y="5" width="1" height="1" fill="#1B5E20"/>
      <rect x="10" y="5" width="1" height="1" fill="#1B5E20"/>
      {/* hocico */}
      <rect x="6" y="7" width="4" height="2" fill="#A5D6A7"/>
      {/* patas */}
      <rect x="4" y="14" width="2" height="2" fill="#1B5E20"/>
      <rect x="10" y="14" width="2" height="2" fill="#1B5E20"/>
      {/* cuernos */}
      <rect x="5" y="1" width="1" height="3" fill="#6D4C41"/>
      <rect x="10" y="1" width="1" height="3" fill="#6D4C41"/>
      <rect x="4" y="1" width="2" height="1" fill="#6D4C41"/>
      <rect x="10" y="1" width="2" height="1" fill="#6D4C41"/>
    </svg>
  );

  // Llama SVG animada
  const Flame = ({size=80, glow=false})=>(
    <svg width={size} height={size*1.3} viewBox="0 0 40 52" style={{
      filter:glow?"drop-shadow(0 0 12px #FF8C00) drop-shadow(0 0 24px #FF4500)":"drop-shadow(0 0 6px #FF8C00)",
    }}>
      <path d="M20 50 C8 50 4 40 4 32 C4 20 12 16 12 8 C12 8 14 14 16 16 C16 8 20 2 20 2 C20 2 24 12 26 14 C28 10 28 6 28 6 C28 6 36 16 36 28 C36 40 32 50 20 50 Z"
        fill="url(#flameGrad)" style={{animation:"flameDance 0.4s ease-in-out infinite alternate"}}/>
      {/* núcleo brillante */}
      <path d="M20 46 C14 46 12 40 12 34 C12 28 16 24 18 20 C18 26 22 28 24 30 C26 26 25 22 25 22 C28 26 30 32 30 36 C30 42 26 46 20 46 Z"
        fill="url(#innerGrad)" opacity="0.9"/>
      <defs>
        <radialGradient id="flameGrad" cx="50%" cy="80%">
          <stop offset="0%"  stopColor="#FFE066"/>
          <stop offset="40%" stopColor="#FF8C00"/>
          <stop offset="100%"stopColor="#FF3300"/>
        </radialGradient>
        <radialGradient id="innerGrad" cx="50%" cy="70%">
          <stop offset="0%"  stopColor="#FFFFFF" stopOpacity="0.9"/>
          <stop offset="60%" stopColor="#FFE066" stopOpacity="0.7"/>
          <stop offset="100%"stopColor="#FF8C00" stopOpacity="0"/>
        </radialGradient>
      </defs>
    </svg>
  );

  return(
    <div style={{
      position:"fixed",inset:0,zIndex:10000,
      background:"radial-gradient(ellipse at 50% 60%, #1A0A00 0%, #000 100%)",
      display:"flex",flexDirection:"column",alignItems:"center",justifyContent:"center",
      animation:"fadeInOut 5s ease forwards",pointerEvents:"none",
      overflow:"hidden",
    }}>
      <style>{`
        @keyframes sheepEntrance{
          0%{transform:translateX(-140px) scaleX(-1);opacity:0}
          30%{transform:translateX(0px) scaleX(-1);opacity:1}
          60%{transform:translateX(0px) scaleX(-1)}
          80%{transform:translateX(-8px) scaleX(-1)}
          100%{transform:translateX(0px) scaleX(-1)}
        }
        @keyframes sheepBounce{
          0%,100%{transform:translateY(0) scaleX(-1)}
          50%{transform:translateY(-10px) scaleX(-1)}
        }
        @keyframes flameGrow{
          0%{transform:scale(0.6);opacity:0.6}
          40%{transform:scale(1.1);opacity:1}
          70%{transform:scale(1.3);opacity:1}
          100%{transform:scale(1.2);opacity:1}
        }
        @keyframes flameDance{
          0%{d:path("M20 50 C8 50 4 40 4 32 C4 20 12 16 12 8 C12 8 14 14 16 16 C16 8 20 2 20 2 C20 2 24 12 26 14 C28 10 28 6 28 6 C28 6 36 16 36 28 C36 40 32 50 20 50 Z")}
          100%{d:path("M20 50 C9 50 5 39 5 31 C5 21 13 15 11 7 C11 7 15 13 17 15 C15 9 21 1 21 1 C21 1 25 11 27 15 C29 9 27 7 27 7 C27 7 37 17 37 29 C37 41 31 50 20 50 Z")}
        }
        @keyframes streakNumPop{
          0%{transform:scale(0);opacity:0}
          60%{transform:scale(1.3);opacity:1}
          80%{transform:scale(0.95)}
          100%{transform:scale(1);opacity:1}
        }
        @keyframes sparklePop{
          0%{transform:scale(0) rotate(0deg);opacity:0}
          50%{transform:scale(1.2) rotate(180deg);opacity:1}
          100%{transform:scale(0.8) rotate(360deg);opacity:0.7}
        }
      `}</style>

      {/* Destellos de fondo */}
      {[...Array(12)].map((_,i)=>(
        <div key={i} style={{
          position:"absolute",
          left:`${10+i*7}%`,top:`${20+Math.sin(i)*30}%`,
          fontSize:[14,18,12,20,16][i%5],
          animation:`sparklePop ${0.6+i*0.15}s ${0.3+i*0.1}s ease both`,
          pointerEvents:"none",
        }}>
          {["✨","⭐","🌟","💫","✨"][i%5]}
        </div>
      ))}

      {/* Escena principal */}
      <div style={{display:"flex",alignItems:"flex-end",justifyContent:"center",gap:16,marginBottom:20}}>

        {/* Oveja animada */}
        <div style={{
          animation:"sheepEntrance 1.2s ease-out forwards, sheepBounce 0.6s 2.5s ease-in-out infinite",
          transformOrigin:"bottom center",
        }}>
          <SheepPixel style={{width:72,height:72}}/>
        </div>

        {/* Llama que crece */}
        <div style={{
          animation:"flameGrow 1.4s 0.6s cubic-bezier(0.34,1.56,0.64,1) both",
          transformOrigin:"bottom center",
        }}>
          <Flame size={84} glow/>
        </div>

      </div>

      {/* Número de racha */}
      <div style={{
        display:"flex",alignItems:"center",gap:12,
        animation:"streakNumPop 0.6s 1.8s cubic-bezier(0.34,1.56,0.64,1) both",
      }}>
        <span style={{fontSize:90,lineHeight:1,filter:"drop-shadow(0 0 20px #FF6600)"}}>🔥</span>
        <div style={{fontFamily:"'Nunito',sans-serif"}}>
          <div style={{fontSize:88,fontWeight:900,color:"#FF6600",lineHeight:1,
            textShadow:"0 0 30px rgba(255,100,0,0.8), 0 4px 0 rgba(0,0,0,0.6)"}}>
            {streak}
          </div>
        </div>
      </div>

      {/* Texto */}
      <div style={{
        marginTop:12,textAlign:"center",
        animation:"scaleIn 0.5s 2.2s both",
      }}>
        <div style={{fontSize:22,fontWeight:900,color:"white",fontFamily:"'Nunito',sans-serif",
          letterSpacing:"0.04em",marginBottom:4}}>
          {lang==="en"
            ? `${streak} day${streak!==1?"s":""} on fire!`
            : `¡${streak} día${streak!==1?"s":""} de racha!`}
        </div>
        <div style={{fontSize:14,color:"rgba(255,180,100,0.8)",fontFamily:"'DM Sans',sans-serif"}}>
          {lang==="en"?"Your sheep is proud of you 🐑":"Tu oveja está orgullosa de ti 🐑"}
        </div>
      </div>

    </div>
  );
}

// ─── All-missions overlay ─────────────────────────────────────────────────────
function MissionsOverlay({active}){
  if(!active)return null;
  return(
    <div style={{position:"fixed",inset:0,zIndex:10000,background:"#000",display:"flex",flexDirection:"column",alignItems:"center",justifyContent:"center",animation:"fadeInOut 2.8s ease forwards",pointerEvents:"none"}}>
      <div style={{fontSize:88,animation:"scaleIn 0.5s cubic-bezier(0.34,1.56,0.64,1)"}}>⭐</div>
      <div style={{fontSize:32,fontWeight:900,color:"#FFC800",fontFamily:"'Nunito',sans-serif",marginTop:14,animation:"scaleIn 0.5s 0.15s cubic-bezier(0.34,1.56,0.64,1) both",textAlign:"center"}}>¡Día Perfecto!</div>
      <div style={{fontSize:42,fontWeight:900,color:"#FFD700",fontFamily:"'Nunito',sans-serif",marginTop:8,animation:"scaleIn 0.6s 0.35s cubic-bezier(0.34,1.56,0.64,1) both",display:"flex",alignItems:"center",gap:10}}>
        <span>+10 💎</span>
      </div>
      <div style={{marginTop:16,fontSize:15,color:"rgba(255,255,255,0.55)",fontFamily:"'DM Sans',sans-serif",animation:"scaleIn 0.5s 0.55s ease both"}}>Todas las misiones completadas</div>
    </div>
  );
}

// ─── Confetti ─────────────────────────────────────────────────────────────────
function Confetti({active}){
  if(!active)return null;
  const pieces=Array.from({length:22},(_,i)=>({l:`${Math.random()*100}%`,d:`${Math.random()*0.8}s`,c:[T.g1,T.au1,T.xp,T.pur,"#FF6B6B"][i%5],s:Math.random()*10+5}));
  return(<div style={{position:"fixed",inset:0,pointerEvents:"none",zIndex:9998,overflow:"hidden"}}>{pieces.map((p,i)=><div key={i} style={{position:"absolute",top:"-12px",left:p.l,width:p.s,height:p.s,background:p.c,borderRadius:"50%",animation:`confettiFall 1.8s ${p.d} ease-in forwards`}}/>)}</div>);
}

// ─── Wood card wrapper ────────────────────────────────────────────────────────
const Card=({children,style={}})=>(
  <div style={{background:T.bgWood,borderRadius:22,padding:"16px 18px",border:`2px solid ${T.bW}`,boxShadow:"0 6px 0 rgba(0,0,0,0.4)",marginBottom:14,...style}}>{children}</div>
);


// ─── Floating reward chip (+XP / +💎) ────────────────────────────────────────
function FloatReward({items}){
  // items: [{id, label, color}]
  return(
    <div style={{position:"fixed",top:"38%",left:"50%",transform:"translateX(-50%)",zIndex:9997,display:"flex",flexDirection:"column",alignItems:"center",gap:8,pointerEvents:"none"}}>
      {items.map((it,i)=>(
        <div key={it.id} style={{
          background:"rgba(0,0,0,0.82)",
          border:`2px solid ${it.color}`,
          borderRadius:30,padding:"8px 22px",
          fontSize:20,fontWeight:900,color:it.color,
          fontFamily:"'Nunito',sans-serif",
          animation:`floatUp 1.4s ${i*0.18}s ease forwards`,
          whiteSpace:"nowrap",
          boxShadow:`0 4px 20px ${it.color}60`,
        }}>{it.label}</div>
      ))}
    </div>
  );
}

// ─── Level-up overlay ─────────────────────────────────────────────────────────
// ─── Helper: próxima recompensa desde un nivel dado ──────────────────────────
function getNextReward(currentLevel){
  for(let i=currentLevel+1; i<=500; i++){
    const r=LEVEL_REWARDS[i];
    if(r?.special) return {level:i, diff:i-currentLevel, reward:r};
  }
  return null;
}

// ─── LevelUpOverlay — pop-up animado al subir de nivel ───────────────────────
function LevelUpOverlay({active,level,reward,patientName,streak,lang,onClose}){
  if(!active)return null;

  const t       = useLang();
  const isMilestone = level%50===0||level===500;
  const isFreeMeal  = reward?.freeMeal;
  const next    = getNextReward(level);

  // Colores de fondo según importancia
  const bg = level===500
    ?"linear-gradient(135deg,#7B2FBE,#FFD700)"
    : isMilestone
      ?"linear-gradient(135deg,#0D2A0A,#1A5C10)"
      :"rgba(6,14,6,0.97)";

  // Icono principal
  const icon = level===500?"🏆":isMilestone?"👑":reward?.report?"📊":isFreeMeal?"🍽️":reward?.shield?"🛡️":"⭐";

  // Texto motivacional final
  const motivText = level===500
    ? (lang==="en"?"ABSOLUTE LEGEND! 🔥":"¡LEYENDA ABSOLUTA! 🔥")
    : isMilestone
      ? (lang==="en"?"Epic milestone reached!":"¡Hito épico alcanzado!")
      : (lang==="en"?"Keep going, unstoppable!":"¡Sigue imparable! 💪");

  return(
    <div
      onClick={reward?.report ? undefined : onClose}
      style={{
        position:"fixed",inset:0,zIndex:10001,background:bg,
        display:"flex",flexDirection:"column",alignItems:"center",
        justifyContent:"center",
        animation:reward?.report?"popIn 0.4s ease":"fadeInOut 4.5s ease forwards",
        pointerEvents:reward?.report?"auto":"auto",
        padding:"24px 20px",overflowY:"auto",
      }}>

      {/* ── Confetti background for milestones ── */}
      {isMilestone&&(
        <div style={{position:"absolute",inset:0,overflow:"hidden",pointerEvents:"none",zIndex:0}}>
          {[...Array(20)].map((_,i)=>(
            <div key={i} style={{
              position:"absolute",
              left:`${Math.random()*100}%`,
              top:`${Math.random()*100}%`,
              width:8,height:8,
              borderRadius:"50%",
              background:["#FFD700","#C8FF40","#64B5F6","#FF8080","#A78BFA"][i%5],
              animation:`confettiFall ${1.5+Math.random()*2}s ${Math.random()*1}s ease-in forwards`,
              opacity:0.8,
            }}/>
          ))}
        </div>
      )}

      <div style={{position:"relative",zIndex:1,display:"flex",flexDirection:"column",alignItems:"center",width:"100%",maxWidth:340}}>

        {/* ── Icono principal ── */}
        <div style={{
          fontSize:isMilestone?96:80,
          animation:"scaleIn 0.6s cubic-bezier(0.34,1.56,0.64,1)",
          filter:isMilestone?"drop-shadow(0 0 24px rgba(255,215,0,0.6))":"none",
          marginBottom:8,
        }}>
          {icon}
        </div>

        {/* ── "NIVEL ALCANZADO" ── */}
        <div style={{
          fontSize:11,fontWeight:900,
          color:"rgba(255,255,255,0.5)",
          fontFamily:"'DM Sans',sans-serif",
          textTransform:"uppercase",letterSpacing:"0.2em",
          animation:"scaleIn 0.5s 0.15s both",
          marginBottom:4,
        }}>
          {lang==="en"?"LEVEL REACHED":"NIVEL ALCANZADO"}
        </div>

        {/* ── Número de nivel ── */}
        <div style={{
          fontSize:90,fontWeight:900,color:"#FFD700",
          fontFamily:"'Nunito',sans-serif",lineHeight:1,
          animation:"scaleIn 0.7s 0.3s cubic-bezier(0.34,1.56,0.64,1) both",
          textShadow:"0 4px 30px rgba(255,215,0,0.5)",
          marginBottom:16,
        }}>
          {level}
        </div>

        {/* ── Racha ── */}
        {streak>0&&(
          <div style={{
            display:"flex",alignItems:"center",gap:8,
            background:"rgba(255,128,64,0.18)",
            border:"2px solid rgba(255,128,64,0.5)",
            borderRadius:20,padding:"8px 20px",
            marginBottom:14,
            animation:"scaleIn 0.5s 0.45s both",
          }}>
            <span style={{fontSize:22}}>🔥</span>
            <div style={{fontFamily:"'Nunito',sans-serif"}}>
              <div style={{fontSize:20,fontWeight:900,color:"#FF8040",lineHeight:1}}>
                {streak}
              </div>
              <div style={{fontSize:10,color:"rgba(255,180,140,0.8)",fontWeight:700,
                textTransform:"uppercase",letterSpacing:"0.1em"}}>
                {lang==="en"?"day streak":"días de racha"}
              </div>
            </div>
          </div>
        )}

        {/* ── Recompensa actual (si la hay) ── */}
        {reward&&(
          <div style={{
            display:"flex",flexDirection:"column",alignItems:"center",gap:8,
            width:"100%",marginBottom:14,
            animation:"scaleIn 0.5s 0.55s both",
          }}>
            {reward.frame>0&&FRAMES[reward.frame]&&(
              <div style={{
                background:"rgba(255,255,255,0.08)",
                border:`2px solid ${FRAMES[reward.frame].color}`,
                borderRadius:18,padding:"10px 24px",fontSize:15,
                fontWeight:900,color:FRAMES[reward.frame].color,textAlign:"center",
                width:"100%",
              }}>
                🖼️ {lang==="en"
                  ? FRAMES[reward.frame].label.replace("Marco","Frame")+" unlocked"
                  : FRAMES[reward.frame].label+" desbloqueado"}
                <div style={{fontSize:11,fontWeight:600,opacity:0.8,marginTop:3}}>
                  {lang==="en"?"Visible in your profile and ranking":"Visible en tu perfil y en el ranking"}
                </div>
              </div>
            )}
            {reward.report&&(()=>{
              const waMsg = encodeURIComponent(
                lang==="en"
                  ? `Hi, I'm ${patientName||"your patient"} and I just reached level ${level} on the GBH app. I've unlocked my free progress report. Can you send it to me? 📊`
                  : `Hola, soy ${patientName||"tu paciente"} y acabo de alcanzar el nivel ${level} en la app GBH. He desbloqueado mi informe de progreso gratuito. ¿Puedes enviármelo? 📊`
              );
              const mailSubject = encodeURIComponent(`${lang==="en"?"Progress report":"Informe de progreso"} — ${lang==="en"?"Level":"Nivel"} ${level} — ${patientName||""}`);
              const mailBody = encodeURIComponent(lang==="en"
                ? `Hi,\n\nI just reached Level ${level} on the GBH Nutrition app and unlocked my progress report.\n\nCould you send it to me?\n\nThanks!`
                : `Hola,\n\nAcabo de alcanzar el Nivel ${level} en la app de GBH Nutrición y he desbloqueado mi informe de progreso.\n\n¿Puedes enviármelo?\n\n¡Gracias!`
              );
              return(
                <div style={{background:"rgba(100,181,246,0.12)",border:"2px solid #64B5F6",
                  borderRadius:20,padding:"16px 20px",textAlign:"center",width:"100%"}}>
                  <div style={{fontSize:15,fontWeight:900,color:"#64B5F6",marginBottom:4}}>
                    📊 {lang==="en"?"Progress report unlocked":"Informe desbloqueado"}
                  </div>
                  <div style={{fontSize:12,color:"rgba(255,255,255,0.65)",
                    fontFamily:"'DM Sans',sans-serif",marginBottom:14}}>
                    {lang==="en"?"Tap to request it now":"Toca para solicitarlo ahora"}
                  </div>
                  <div style={{display:"flex",gap:10,justifyContent:"center"}}>
                    <a href={`https://wa.me/${GBH_WHATSAPP}?text=${waMsg}`}
                      target="_blank" rel="noreferrer"
                      style={{display:"flex",alignItems:"center",gap:7,padding:"11px 18px",
                        borderRadius:16,background:"#25D366",color:"white",fontWeight:900,
                        fontSize:14,textDecoration:"none",fontFamily:"'Nunito',sans-serif",
                        boxShadow:"0 4px 0 #1aad4e"}}>
                      <span style={{fontSize:18}}>📱</span> WhatsApp
                    </a>
                    <a href={`mailto:${GBH_EMAIL}?subject=${mailSubject}&body=${mailBody}`}
                      style={{display:"flex",alignItems:"center",gap:7,padding:"11px 18px",
                        borderRadius:16,background:"rgba(255,255,255,0.12)",
                        border:"1.5px solid rgba(255,255,255,0.25)",color:"white",fontWeight:900,
                        fontSize:14,textDecoration:"none",fontFamily:"'Nunito',sans-serif",
                        boxShadow:"0 4px 0 rgba(0,0,0,0.3)"}}>
                      <span style={{fontSize:18}}>✉️</span> Email
                    </a>
                  </div>
                  <button onClick={onClose}
                    style={{marginTop:14,background:"none",border:"none",
                      color:"rgba(255,255,255,0.45)",fontSize:12,cursor:"pointer",
                      fontFamily:"'DM Sans',sans-serif"}}>
                    {lang==="en"?"Close":"Cerrar"}
                  </button>
                </div>
              );
            })()}
            {reward.freeMeal&&!reward.report&&(
              <div style={{background:"rgba(255,200,0,0.18)",border:"2px solid #FFD700",
                borderRadius:18,padding:"10px 24px",fontSize:15,fontWeight:900,
                color:"#FFD700",width:"100%",textAlign:"center"}}>
                🍽️ {lang==="en"?"Free meal unlocked!":"¡Comida libre desbloqueada!"}
              </div>
            )}
            {reward.shield&&!reward.frame&&(
              <div style={{background:"rgba(100,181,246,0.18)",border:"2px solid #64B5F6",
                borderRadius:18,padding:"8px 20px",fontSize:14,fontWeight:900,
                color:"#64B5F6",textAlign:"center"}}>
                🛡️ {lang==="en"?"Shield earned!":"¡Escudo ganado!"}
              </div>
            )}
            <div style={{fontSize:16,fontWeight:900,color:"#C8FF40"}}>+{reward.gems} 💎</div>
          </div>
        )}

        {/* ── Próxima recompensa ── */}
        {next&&level<500&&(
          <div style={{
            background:"rgba(255,255,255,0.06)",
            border:"1.5px solid rgba(255,255,255,0.14)",
            borderRadius:16,padding:"10px 18px",
            textAlign:"center",width:"100%",
            animation:"scaleIn 0.5s 0.7s both",
            marginBottom:12,
          }}>
            <div style={{fontSize:11,color:"rgba(255,255,255,0.45)",fontFamily:"'DM Sans',sans-serif",
              textTransform:"uppercase",letterSpacing:"0.1em",marginBottom:4}}>
              {lang==="en"?"Next reward":"Próxima recompensa"}
            </div>
            <div style={{display:"flex",alignItems:"center",justifyContent:"center",gap:8}}>
              <div style={{
                background:"rgba(88,204,2,0.15)",border:"1.5px solid rgba(88,204,2,0.3)",
                borderRadius:20,padding:"4px 14px",
                fontSize:13,fontWeight:900,color:"#C8FF40",
                fontFamily:"'Nunito',sans-serif",
              }}>
                {lang==="en"
                  ? `${next.diff} level${next.diff!==1?"s":""} away · Lv ${next.level}`
                  : `${next.diff} nivel${next.diff!==1?"es":""} más · Nv ${next.level}`}
              </div>
              <span style={{fontSize:18}}>
                {next.reward.frame>0?"🖼️":next.reward.report?"📊":next.reward.freeMeal?"🍽️":next.reward.shield?"🛡️":"⭐"}
              </span>
            </div>
          </div>
        )}

        {/* ── Mensaje final ── */}
        <div style={{
          fontSize:15,fontWeight:800,color:"rgba(255,255,255,0.75)",
          fontFamily:"'Nunito',sans-serif",
          animation:"scaleIn 0.5s 0.85s both",
          textAlign:"center",marginBottom:16,
        }}>
          {motivText}
        </div>

        {/* ── Toca para continuar (si no hay report) ── */}
        {!reward?.report&&(
          <div style={{
            fontSize:11,color:"rgba(255,255,255,0.3)",
            fontFamily:"'DM Sans',sans-serif",
            animation:"scaleIn 0.4s 1s both",
          }}>
            {lang==="en"?"Tap anywhere to continue":"Toca en cualquier lugar para continuar"}
          </div>
        )}
      </div>
    </div>
  );
}

// ─── "Vuelve mañana" card ─────────────────────────────────────────────────────
function TomorrowCard({name,streak}){
  const t=useLang();
  const n=name.split(" ")[0];
  return(
    <div style={{background:"linear-gradient(135deg,rgba(43,122,0,0.35),rgba(88,204,2,0.15))",border:`2px solid ${T.g1}`,borderRadius:24,padding:"22px 20px",textAlign:"center",marginBottom:14,boxShadow:`0 6px 0 ${T.g3}`}}>
      <div style={{fontSize:40,marginBottom:8}}>🌙</div>
      <div style={{fontSize:20,fontWeight:900,color:T.g2,marginBottom:6}}>{t("tomorrowTitle",{n})}</div>
      <div style={{fontSize:13,color:T.t2,fontFamily:"'DM Sans',sans-serif",lineHeight:1.6,marginBottom:14}}>
        {t("tomorrowDesc")}<br/>{t("tomorrowStreak",{s:streak})}
      </div>
      <div style={{display:"flex",justifyContent:"center",gap:10}}>
        <div style={{background:"rgba(255,255,255,0.07)",borderRadius:16,padding:"10px 20px",fontSize:13,fontWeight:800,color:T.au1}}>{t("tomorrowBack")}</div>
      </div>
    </div>
  );
}

// ─── Hydration tracker (vasos de agua) ───────────────────────────────────────
function HydrationWidget({done,onToggle}){
  const t=useLang();
  const todayStr = toKey();
  const [glasses,setGlasses]=useState(()=>{
    try{
      // Solo recuperar vasos del día actual
      const saved = localStorage.getItem("gbh:glasses:"+(window.__gbhUID||"")+":"+todayStr);
      return saved ? Math.min(parseInt(saved)||0, 8) : 0;
    }catch{return 0;}
  });
  const target=8;

  const isMounted = useRef(false);

  // Solo llamar onToggle cuando glasses cambia (no en el mount inicial)
  useEffect(()=>{
    if(!isMounted.current){ isMounted.current=true; return; }
    if(glasses>=target && !done) onToggle();
  // eslint-disable-next-line react-hooks/exhaustive-deps
  },[glasses]);

  // Si ya está done desde el servidor pero glasses<target, sincronizar vasos visualmente (sin llamar onToggle)
  useEffect(()=>{
    if(done && glasses<target){
      setGlasses(target);
      try{ localStorage.setItem("gbh:glasses:"+(window.__gbhUID||"")+":"+todayStr, target); }catch{}
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  },[done]);

  const addGlass=()=>{
    if(done || glasses>=target) return;
    const ng = glasses + 1;
    setGlasses(ng);
    SFX.water(); // sonido directo (no pasa sfx como prop)
    try{ localStorage.setItem("gbh:glasses:"+(window.__gbhUID||"")+":"+todayStr, ng); }catch{}
  };
  const pct=Math.min((glasses/target)*100,100);
  return(
    <div style={{background:done?`linear-gradient(135deg,rgba(43,122,0,0.45),rgba(88,204,2,0.2))`:T.bgCard,border:`2px solid ${done?T.g1:T.bW}`,borderRadius:20,padding:"14px 16px",marginBottom:10,boxShadow:done?`0 5px 0 ${T.g3}`:"0 4px 0 rgba(0,0,0,0.4)"}}>
      <div style={{display:"flex",alignItems:"center",gap:14,marginBottom:10}}>
        <div style={{width:38,height:38,borderRadius:14,background:done?T.g1:"rgba(41,182,246,0.2)",display:"flex",alignItems:"center",justifyContent:"center",flexShrink:0,fontWeight:900,fontSize:done?18:15,color:done?"white":"#29B6F6",boxShadow:done?`0 3px 0 ${T.g3}`:"0 3px 0 rgba(0,0,0,0.5)",border:`2px solid ${done?T.g3:"#0288D1"}`}}>
          {done?"✓":`${glasses}/${target}`}
        </div>
        <div style={{flex:1}}>
          <div style={{display:"flex",alignItems:"center",gap:8}}>
            <span style={{fontSize:22}}>💧</span>
            <div>
              <div style={{fontSize:14,fontWeight:800,color:done?T.t1:"rgba(255,255,255,0.55)"}}>{t("hydrationLabel")}</div>
              <div style={{fontSize:11,color:T.au1,fontWeight:700}}>{t("hydrationXP",{g:glasses,target})}{done?` · ${t("hydrationDone")}`:""}</div>
            </div>
          </div>
        </div>
      </div>
      <div style={{background:"rgba(255,255,255,0.08)",borderRadius:10,height:10,overflow:"hidden",marginBottom:10,boxShadow:"inset 0 2px 4px rgba(0,0,0,0.3)"}}>
        <div style={{height:"100%",width:`${pct}%`,background:`linear-gradient(90deg,#29B6F6,#0288D1)`,borderRadius:10,transition:"width 0.4s ease",boxShadow:"0 0 8px #29B6F660"}}/>
      </div>
      <div style={{display:"flex",gap:6,flexWrap:"wrap"}}>
        {Array.from({length:target},(_,i)=>(
          <button key={i} onClick={addGlass} disabled={done||i<glasses} style={{
            width:34,height:38,borderRadius:10,border:`2px solid ${i<glasses?"#0288D1":"rgba(255,255,255,0.12)"}`,
            background:i<glasses?"rgba(41,182,246,0.25)":"rgba(255,255,255,0.06)",
            cursor:done||i<glasses?"default":"pointer",
            fontSize:18,display:"flex",alignItems:"center",justifyContent:"center",
            transition:"all 0.2s",boxShadow:i<glasses?"0 2px 0 #0277BD":"0 2px 0 rgba(0,0,0,0.4)",
          }}>
            {i<glasses?"🥤":"🫙"}
          </button>
        ))}
      </div>
      {!done&&glasses<target&&<div style={{fontSize:10,color:T.t2,marginTop:8,fontFamily:"'DM Sans',sans-serif"}}>{t("hydrationHint",{target})}</div>}
    </div>
  );
}

// ─── CalcTab — Calculadora calórica con resultado persistido ─────────────────
function CalcTab({weights,profile,setProfile,lang}){
  const t=useLang();
  const calcKey = `gbh:calc:saved:${profile?.id||"anon"}`;   // ← clave por usuario
  const currentW=weights.filter(w=>!w.isInitial).slice(-1)[0]?.weight??weights.find(w=>w.isInitial)?.weight??null;
  const goalW=profile?.goal_weight??null;

  // Cargar resultado guardado desde localStorage al montar
  const [saved,   setSaved]   = useState(()=>lsGet(calcKey, null));
  const [editing, setEditing] = useState(!lsGet(calcKey, null));

  // Pre-rellenar desde el perfil si no hay cálculo guardado
  const [cSex,    setCsex]   = useState(saved?.inputs?.sex    || profile?.sex    || "M");
  const [cHeight, setCheight]= useState(saved?.inputs?.height || (profile?.height_cm ? String(profile.height_cm) : ""));
  const [cAge,    setCage]   = useState(saved?.inputs?.age    || "0");
  const [cAct,    setCact]   = useState(saved?.inputs?.act    || "0");
  const [cGoal,   setCgoal]  = useState(saved?.inputs?.goal   || (profile?.goal_weight ? String(profile.goal_weight) : ""));

  const ageMids =[22,30,40,50,60,70];
  const actMults=[1.2,1.375,1.55,1.725,1.9];
  const ageOpts =t("calcAgeRanges");
  const actOpts =t("calcActivityLevels");

  const AGE_LABELS=["18-25","26-35","36-45","46-55","56-65","65+"];
  const ACT_LABELS=["sedentary","light","moderate","active","very_active"];
  const compute=async()=>{
    const h=parseFloat(cHeight);
    if(!currentW||isNaN(h)||h<100||h>250)return;
    const w=currentW,age=ageMids[parseInt(cAge,10)]||30,mul=actMults[parseInt(cAct,10)]||1.2;
    const bmr=cSex==="M"?10*w+6.25*h-5*age+5:10*w+6.25*h-5*age-161;
    const tdee=Math.round(bmr*mul);
    // Peso objetivo editable AQUÍ (antes solo en Ajustes): factor del ajuste
    // calórico junto a actividad y edad. Vacío/no válido → sin ajuste.
    const gVal=parseFloat(String(cGoal).replace(",","."));
    const goalEff=(!isNaN(gVal)&&gVal>20&&gVal<300)?gVal:null;
    const diff=goalEff?(w-goalEff)*7700/90:0;
    const adjRaw=Math.min(Math.max(diff,-1000),1000);
    const target=Math.round(tdee-adjRaw);
    const safe=cSex==="M"?Math.max(target,1500):Math.max(target,1200);
    const ageLabel=AGE_LABELS[parseInt(cAge,10)]||"";
    const actLabel=ACT_LABELS[parseInt(cAct,10)]||"";
    const loseGain=goalEff?(w>goalEff?"deficit":"surplus"):null;
    const now=new Date().toISOString();
    const res={
      bmr:Math.round(bmr),tdee,adj:Math.round(adjRaw),target:safe,loseGain,
      inputs:{sex:cSex,height:cHeight,age:cAge,act:cAct,goal:cGoal},
      goalW:goalEff,currentW,date:new Date().toLocaleDateString(lang==="en"?"en-GB":"es-ES",{day:"2-digit",month:"short",year:"numeric"})
    };
    // 1 localStorage — acceso inmediato offline
    lsSet(calcKey,res);
    setSaved(res);
    setEditing(false);
    // 1b Supabase: el resultado completo viaja en weekly_state.calc para que
    //    sobreviva a borrados de caché (si no, había que recalcular el objetivo)
    patchWeeklyState(profile.id, mergeWeeklyState(profile.id, { calc: res }));
    // 2 Supabase: historial completo en calorie_targets
    sbReq("POST","calorie_targets",{
      profile_id:profile.id,sex:cSex,height_cm:Math.round(h),
      age_range:ageLabel,activity:actLabel,current_weight:w,
      goal_weight:goalEff||null,bmr:Math.round(bmr),tdee,
      adjustment:Math.round(adjRaw),target_kcal:safe,
      lose_gain:loseGain,calculated_at:now,
    });
    // 3 Supabase: actualizar perfil con datos antropométricos
    sbReq("PATCH",`profiles?id=eq.${profile.id}`,{
      sex:cSex,height_cm:Math.round(h),age_range:ageLabel,
      activity:actLabel,target_kcal:safe,calc_updated_at:now,
      goal_weight:goalEff,
    });
    // 3b Reflejar el objetivo en el perfil EN MEMORIA (y en localStorage) al
    //    instante. Sin esto, al ir a la pestaña Plan en la misma sesión saltaba
    //    el gate "Define tu objetivo" porque profile.target_kcal seguía obsoleto
    //    (el PATCH de arriba solo toca Supabase, no el estado de React).
    if(setProfile){
      const updP = {...profile, sex:cSex, height_cm:Math.round(h),
        age_range:ageLabel, activity:actLabel, target_kcal:safe, calc_updated_at:now,
        goal_weight:goalEff};
      setProfile(updP);
      lsSet(`gbh:p:${profile.id}`, updP);
    }
    // 4 Supabase: actualizar patient_config SOLO con los campos de la calculadora.
    //   OJO: el upsert con merge-duplicates SOBREESCRIBE lo que envíes, así que
    //   aquí NO van tipo_dieta / patron_dias / dist_* — esos los elige el
    //   paciente en la pantalla "Configura tu plan" y recalcular el objetivo
    //   no debe machacárselos.
    sbReq("POST","patient_config?on_conflict=profile_id",{
      profile_id:   profile.id,
      kcal_objetivo: safe,
      auto_generado: true,
      altura_cm:    Math.round(h),
      sexo:         cSex,
      actividad:    actLabel,
    });
  };
  const canCompute=!!currentW&&parseFloat(cHeight)>=100&&parseFloat(cHeight)<=250;
  const startEdit=()=>{
    if(saved?.inputs){
      setCsex(saved.inputs.sex||"M");
      setCheight(saved.inputs.height||"");
      setCage(saved.inputs.age||"0");
      setCact(saved.inputs.act||"0");
      setCgoal(saved.inputs.goal ?? (profile?.goal_weight?String(profile.goal_weight):""));
    }
    setEditing(true);
  };

  // ── Vista resultado guardado ─────────────────────────────────────────────
  if(saved && !editing) return(
    <div style={{paddingBottom:8}}>
      <div style={{textAlign:"center",padding:"8px 0 14px"}}>
        <div style={{fontSize:22,fontWeight:900,color:T.wh}}>{t("calcTitle")}</div>
        <div style={{fontSize:11,color:T.t3,fontFamily:"'DM Sans',sans-serif",marginTop:2}}>{t("calcSaved")} · {saved.date}</div>
      </div>

      {/* Número grande */}
      <div style={{background:"linear-gradient(135deg,#1A3A10,#0F2408)",border:`2.5px solid ${T.g3}`,borderRadius:24,padding:"24px 20px",marginBottom:12,textAlign:"center",boxShadow:`0 8px 0 ${T.g3}`}}>
        <div style={{fontSize:11,color:T.g2,textTransform:"uppercase",letterSpacing:"0.12em",fontWeight:900,marginBottom:4}}>{t("calcResultTitle")}</div>
        {saved.goalW&&<div style={{fontSize:11,color:T.t2,fontFamily:"'DM Sans',sans-serif",marginBottom:12}}>{lang==="en"?`to reach ${saved.goalW} kg in 3 months`:`para llegar a ${saved.goalW} kg en 3 meses`}</div>}
        <div style={{display:"flex",alignItems:"baseline",justifyContent:"center",gap:6}}>
          <span style={{fontSize:64,fontWeight:900,color:T.g2,lineHeight:1,textShadow:`0 0 30px ${T.g1}80`}}>{saved.target.toLocaleString()}</span>
          <span style={{fontSize:18,color:T.t2,fontWeight:700}}>{t("calcKcal")}</span>
        </div>
        {saved.goalW&&saved.loseGain&&(
          <div style={{marginTop:12,display:"inline-flex",alignItems:"center",gap:6,background:saved.loseGain==="deficit"?"rgba(255,75,75,0.12)":"rgba(88,204,2,0.12)",border:`1.5px solid ${saved.loseGain==="deficit"?"rgba(255,75,75,0.35)":T.g3}`,borderRadius:10,padding:"6px 14px"}}>
            <span style={{fontSize:13,fontWeight:900,color:saved.loseGain==="deficit"?"#FF8080":T.g2}}>
              {saved.loseGain==="deficit"?"▼":"▲"} {Math.abs(saved.adj)} kcal {t(`calc${saved.loseGain.charAt(0).toUpperCase()+saved.loseGain.slice(1)}`)}
            </span>
          </div>
        )}
      </div>

      {/* Desglose */}
      <Card style={{marginBottom:12}}>
        {[{l:t("calcBMR"),v:saved.bmr,c:T.t2},{l:t("calcTDEE"),v:saved.tdee,c:T.xp},saved.goalW?{l:t("calcAdj"),v:`${saved.adj>0?"−":"+"}${Math.abs(saved.adj)}`,c:T.au1}:null].filter(Boolean).map(({l,v,c})=>(
          <div key={l} style={{display:"flex",justifyContent:"space-between",alignItems:"center",padding:"10px 0",borderBottom:"1px solid rgba(255,255,255,0.07)"}}>
            <span style={{fontSize:13,color:T.t2,fontFamily:"'DM Sans',sans-serif"}}>{l}</span>
            <span style={{fontSize:15,fontWeight:900,color:c}}>{typeof v==="number"?v.toLocaleString():v} kcal</span>
          </div>
        ))}
        {/* Resumen de datos de entrada */}
        <div style={{paddingTop:10,display:"flex",flexWrap:"wrap",gap:6}}>
          {[
            {icon:"📏", val:`${saved.inputs?.height} cm`},
            {icon:saved.inputs?.sex==="M"?"♂":"♀", val:saved.inputs?.sex==="M"?(lang==="en"?"Male":"Hombre"):(lang==="en"?"Female":"Mujer")},
            {icon:"🎂", val:ageOpts[parseInt(saved.inputs?.age||0,10)]},
            {icon:"🏃", val:actOpts[parseInt(saved.inputs?.act||0,10)]?.split(" ")[0]},
          ].map(({icon,val})=>(
            <div key={icon} style={{background:"rgba(255,255,255,0.06)",border:"1px solid rgba(255,255,255,0.1)",borderRadius:8,padding:"4px 10px",fontSize:11,color:T.t2,fontFamily:"'DM Sans',sans-serif"}}>
              {icon} {val}
            </div>
          ))}
        </div>
      </Card>

      {/* Nota */}
      <div style={{background:"rgba(255,200,0,0.07)",border:`1.5px solid ${T.au3}`,borderRadius:14,padding:"12px 16px",fontSize:12,color:T.t2,fontFamily:"'DM Sans',sans-serif",lineHeight:1.6,marginBottom:16}}>
        {t("calcNote")}
      </div>

      {/* Botón editar */}
      <button onClick={startEdit} style={{width:"100%",padding:"16px 0",borderRadius:18,border:`2px solid ${T.au2}`,background:"rgba(255,200,0,0.08)",color:T.au1,fontSize:15,fontWeight:900,cursor:"pointer",fontFamily:"'Nunito',sans-serif",letterSpacing:"0.02em"}}>
        {t("calcEditBtn")}
      </button>
    </div>
  );

  // ── Vista formulario (edición / primera vez) ─────────────────────────────
  return(
    <div style={{paddingBottom:8}}>
      <div style={{textAlign:"center",padding:"8px 0 18px"}}>
        <div style={{fontSize:22,fontWeight:900,color:T.wh}}>{t("calcTitle")}</div>
        <div style={{fontSize:12,color:T.t2,fontFamily:"'DM Sans',sans-serif",marginTop:4}}>{t("calcSubtitle")}</div>
      </div>
      {!currentW&&<div style={{background:"rgba(255,200,0,0.10)",border:`1.5px solid ${T.au2}`,borderRadius:14,padding:"12px 16px",marginBottom:14,fontSize:13,color:T.au1,fontFamily:"'DM Sans',sans-serif"}}>{t("calcNoWeight")}</div>}
      {currentW&&!goalW&&<div style={{background:"rgba(255,200,0,0.10)",border:`1.5px solid ${T.au2}`,borderRadius:14,padding:"12px 16px",marginBottom:14,fontSize:13,color:T.au1,fontFamily:"'DM Sans',sans-serif"}}>{t("calcNoGoal")}</div>}
      <Card style={{marginBottom:12}}>
        <div style={{fontSize:10,color:T.au1,textTransform:"uppercase",letterSpacing:"0.1em",fontWeight:900,marginBottom:12}}>{t("calcSex")}</div>
        <div style={{display:"flex",gap:10}}>
          {[{v:"M",l:t("calcMan"),c:"#64B5F6"},{v:"F",l:t("calcWoman"),c:"#F48FB1"}].map(({v,l,c})=>(
            <button key={v} onClick={()=>setCsex(v)} style={{flex:1,padding:"16px 0",borderRadius:16,border:`2.5px solid ${cSex===v?c:"rgba(255,255,255,0.12)"}`,background:cSex===v?`${c}22`:"rgba(255,255,255,0.05)",color:cSex===v?c:T.t2,fontSize:15,fontWeight:900,cursor:"pointer",fontFamily:"'Nunito',sans-serif",transition:"all 0.18s",boxShadow:cSex===v?`0 4px 0 ${c}55`:"0 3px 0 rgba(0,0,0,0.4)"}}>
              {l}
            </button>
          ))}
        </div>
      </Card>
      <Card style={{marginBottom:12}}>
        <div style={{fontSize:10,color:T.au1,textTransform:"uppercase",letterSpacing:"0.1em",fontWeight:900,marginBottom:12}}>{t("calcHeight")}</div>
        <div style={{display:"flex",alignItems:"center",gap:10}}>
          <input type="number" value={cHeight} onChange={e=>setCheight(e.target.value)} placeholder={t("calcHeightPH")} min={100} max={250} style={{flex:1,background:"rgba(255,255,255,0.07)",border:`2px solid ${T.bW}`,borderRadius:14,padding:"15px 16px",color:T.cr,fontSize:24,fontWeight:900,fontFamily:"'DM Sans',sans-serif",textAlign:"center",outline:"none"}}/>
          <span style={{fontSize:17,color:T.t2,fontWeight:700,flexShrink:0}}>cm</span>
        </div>
      </Card>
      <Card style={{marginBottom:12}}>
        <div style={{fontSize:10,color:T.au1,textTransform:"uppercase",letterSpacing:"0.1em",fontWeight:900,marginBottom:12}}>{t("goalWeight")}</div>
        <div style={{display:"flex",alignItems:"center",gap:10}}>
          <input type="number" value={cGoal} onChange={e=>setCgoal(e.target.value)} placeholder="70.0" step="0.1" min={20} max={300} style={{flex:1,background:"rgba(255,255,255,0.07)",border:`2px solid ${T.bW}`,borderRadius:14,padding:"15px 16px",color:T.cr,fontSize:24,fontWeight:900,fontFamily:"'DM Sans',sans-serif",textAlign:"center",outline:"none"}}/>
          <span style={{fontSize:17,color:T.t2,fontWeight:700,flexShrink:0}}>kg</span>
        </div>
        <div style={{fontSize:11,color:T.t2,fontFamily:"'DM Sans',sans-serif",marginTop:8,lineHeight:1.5}}>
          {lang==='en'
            ?'Sets the direction of your calorie adjustment (deficit or surplus). Leave empty for maintenance.'
            :'Marca la dirección del ajuste calórico (déficit o superávit). Déjalo vacío para mantenimiento.'}
        </div>
      </Card>
      <Card style={{marginBottom:12}}>
        <div style={{fontSize:10,color:T.au1,textTransform:"uppercase",letterSpacing:"0.1em",fontWeight:900,marginBottom:12}}>{t("calcAge")}</div>
        <select className="gbh-select" value={cAge} onChange={e=>setCage(e.target.value)}>
          {ageOpts.map((o,i)=><option key={i} value={String(i)}>{o}</option>)}
        </select>
      </Card>
      <Card style={{marginBottom:20}}>
        <div style={{fontSize:10,color:T.au1,textTransform:"uppercase",letterSpacing:"0.1em",fontWeight:900,marginBottom:12}}>{t("calcActivity")}</div>
        <select className="gbh-select" value={cAct} onChange={e=>setCact(e.target.value)}>
          {actOpts.map((o,i)=><option key={i} value={String(i)}>{o}</option>)}
        </select>
      </Card>
      <button onClick={compute} disabled={!canCompute} style={{width:"100%",padding:"18px 0",borderRadius:20,border:`3px solid ${canCompute?T.g3:"rgba(255,255,255,0.08)"}`,background:canCompute?`linear-gradient(135deg,${T.g1},${T.g2})`:"rgba(255,255,255,0.08)",color:canCompute?"white":T.t3,fontSize:17,fontWeight:900,cursor:canCompute?"pointer":"not-allowed",fontFamily:"'Nunito',sans-serif",boxShadow:canCompute?`0 6px 0 ${T.g3}`:"none",transition:"all 0.18s",marginBottom:saved?12:0}}>
        {t("calcBtn")}
      </button>
      {saved&&(
        <button onClick={()=>setEditing(false)} style={{width:"100%",padding:"14px 0",borderRadius:16,border:`1px solid rgba(255,255,255,0.12)`,background:"rgba(255,255,255,0.05)",color:T.t2,fontSize:14,fontWeight:700,cursor:"pointer",fontFamily:"'Nunito',sans-serif",marginTop:10}}>
          ← {lang==="en"?"Back to saved result":"Volver al resultado guardado"}
        </button>
      )}
    </div>
  );
}

// ─── Weekly XP goal ───────────────────────────────────────────────────────────
function WeeklyXPGoal({logs,xp}){
  const t=useLang();
  const GOAL=150;
  // Fuente única: mismo bucket que el desafío xp_week en la diana
  const {w:wn,y:yn}=getISOWeek();
  const weekXP=lsGet(`gbh:weekXP:${yn}:${wn}`,0);
  const pct=Math.min((weekXP/GOAL)*100,100);
  const done=weekXP>=GOAL;
  return(
    <div style={{background:T.bgWood,borderRadius:20,padding:"12px 16px",border:`2px solid ${done?T.g1:T.bW}`,boxShadow:"0 4px 0 rgba(0,0,0,0.4)",marginBottom:14}}>
      <div style={{display:"flex",justifyContent:"space-between",alignItems:"center",marginBottom:8}}>
        <div style={{fontSize:11,fontWeight:900,color:done?T.g2:T.au1,textTransform:"uppercase",letterSpacing:"0.08em"}}>{t("weeklyXPGoal")}</div>
        <div style={{fontSize:13,fontWeight:900,color:done?T.g1:T.t1}}>{weekXP}<span style={{color:T.t2,fontWeight:700}}>/{GOAL} XP</span></div>
      </div>
      <div style={{background:"rgba(255,255,255,0.08)",borderRadius:10,height:14,overflow:"hidden",boxShadow:"inset 0 2px 4px rgba(0,0,0,0.3)"}}>
        <div style={{height:"100%",width:`${pct}%`,background:done?`linear-gradient(90deg,${T.g1},${T.g2})`:`linear-gradient(90deg,${T.xp},${T.g1})`,borderRadius:10,transition:"width 0.7s ease",boxShadow:done?`0 0 12px ${T.g1}80`:`0 0 8px ${T.xp}60`,position:"relative"}}>
          {pct>15&&<div style={{position:"absolute",right:8,top:"50%",transform:"translateY(-50%)",fontSize:9,fontWeight:900,color:"white"}}>{Math.round(pct)}%</div>}
        </div>
      </div>
      {done&&<div style={{fontSize:11,color:T.g2,marginTop:6,fontWeight:800,textAlign:"center"}}>{t("weeklyXPDone")}</div>}
    </div>
  );
}




// ─── Banco de preguntas de nutrición (30 preguntas) ──────────────────────────
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
  {q:'¿Cuál de estos platos del recetario GBH tiene más grasas?',q_en:'Which GBH recipe has the most fat?',opts:['Pastel de pescado','Ensalada de patata','Bircher Muesli','Guiso de alubias con hongos'],opts_en:['Fish cake','Potato salad','Bircher Muesli','Bean and mushroom stew'],ans:2,fact:'Bircher Muesli · 60g grasa',fact_en:'Bircher Muesli · 60g fat'},
  {q:'¿Cuál de estos platos del recetario GBH tiene más hidratos de carbono?',q_en:'Which GBH recipe has the most carbohydrates?',opts:['Arroz asiático con huevo','Gnocchi con mozzarella y pollo','Calabacines rellenos de gambas y rape','Guiso de verduras'],opts_en:['Asian rice with egg','Gnocchi with mozzarella and chicken','Courgettes stuffed with prawns and monkfish','Vegetable stew'],ans:3,fact:'Guiso de verduras · 35g HC',fact_en:'Vegetable stew · 35g carbs'},
  {q:'¿Cuál de estos platos del recetario GBH tiene más calorías?',q_en:'Which GBH recipe has the most calories?',opts:['Sopa crema de patatas y cebollas','Avena al horno con manzana pera y nueces','Ensalada de escarola con tomate granada y naranja','Ensalada de berenjena y queso'],opts_en:['Creamy potato and onion soup','Baked oats with apple pear and nuts','Endive salad with pomegranate and orange','Aubergine and cheese salad'],ans:3,fact:'Ensalada de berenjena y queso · 510kcal',fact_en:'Aubergine and cheese salad · 510kcal'},
  {q:'¿Cuál de estos platos del recetario GBH tiene más proteínas?',q_en:'Which GBH recipe has the most protein?',opts:['Bizcocho keto de limón','Estofado de habichuelas','Guiso de merluza y gambas','Huevos revueltos con espárragos'],opts_en:['Keto lemon cake','Bean stew','Hake and prawn stew','Scrambled eggs with asparagus'],ans:2,fact:'Guiso de merluza y gambas · 40g prot',fact_en:'Hake and prawn stew · 40g protein'},
  {q:'¿Cuál de estos platos del recetario GBH tiene más grasas?',q_en:'Which GBH recipe has the most fat?',opts:['Hamburguesa de berenjenas','Pizzeta de calabaza','Ensalada de espinacas','Guiso de garbanzos y calamares'],opts_en:['Aubergine burger','Pumpkin pizza','Spinach salad','Chickpea and squid stew'],ans:1,fact:'Pizzeta de calabaza · 20g grasa',fact_en:'Pumpkin pizza · 20g fat'},
  {q:'¿Cuál de estos platos del recetario GBH tiene más proteínas?',q_en:'Which GBH recipe has the most protein?',opts:['Ensalada de lentejas y aguacate','Batido de plátano y avena','Lentejas con verduras','Ensalada de brócoli y manzana'],opts_en:['Lentil and avocado salad','Banana and oat smoothie','Lentils with vegetables','Broccoli and apple salad'],ans:2,fact:'Lentejas con verduras · 22g prot',fact_en:'Lentils with vegetables · 22g protein'},
  {q:'¿Cuál de estos platos del recetario GBH tiene más proteínas?',q_en:'Which GBH recipe has the most protein?',opts:['Tosta de atún con gambas y tomate','Macedonia de sandia y melon','Guiso de alubias blancas y verduras','Ensalada mixta'],opts_en:['Tuna toast with prawns and tomato','Watermelon and melon salad','White bean and vegetable stew','Mixed salad'],ans:0,fact:'Tosta de atún con gambas y tomate · 20g prot',fact_en:'Tuna toast with prawns and tomato · 20g protein'},
  {q:'¿Cuál de estos platos del recetario GBH tiene más hidratos de carbono?',q_en:'Which GBH recipe has the most carbohydrates?',opts:['Ensalada de col y manzana','Berenjenas asadas con cuscús de garbanzos','Tarta de dulce de leche','Guiso de alubias con hongos'],opts_en:['Cabbage and apple salad','Roasted aubergine with chickpea couscous','Dulce de leche tart','Bean and mushroom stew'],ans:1,fact:'Berenjenas asadas con cuscús de garbanzos · 50g HC',fact_en:'Roasted aubergine with chickpea couscous · 50g carbs'},
  {q:'¿Cuál de estos platos del recetario GBH tiene más grasas?',q_en:'Which GBH recipe has the most fat?',opts:['Sopa postre de avellanas y chocolate blanco','Tortilla de champiñón','Alubias con pulpo','Brazo de tiramisú'],opts_en:['Hazelnut and white chocolate dessert soup','Mushroom omelette','Beans with octopus','Tiramisu roll'],ans:3,fact:'Brazo de tiramisú · 21g grasa',fact_en:'Tiramisu roll · 21g fat'},
  {q:'¿Cuál de estos platos del recetario GBH tiene más calorías?',q_en:'Which GBH recipe has the most calories?',opts:['Flan de avena','Tortitas de plátano y avena','Ensalada de naranjas','Sorbete de café'],opts_en:['Oat flan','Banana and oat pancakes','Orange salad','Coffee sorbet'],ans:0,fact:'Flan de avena · 430kcal',fact_en:'Oat flan · 430kcal'},
  {q:'¿Cuál de estos platos del recetario GBH tiene más proteínas?',q_en:'Which GBH recipe has the most protein?',opts:['Pisto de verduras con carne','Hamburguesa de garbanzo y curry','Pizza de yuca','Ensalada de gourmet'],opts_en:['Vegetable ratatouille with meat','Chickpea and curry burger','Cassava pizza','Gourmet salad'],ans:0,fact:'Pisto de verduras con carne · 27g prot',fact_en:'Vegetable ratatouille with meat · 27g protein'},
  {q:'¿Cuál de estos platos del recetario GBH tiene más calorías?',q_en:'Which GBH recipe has the most calories?',opts:['Pollo con salsa de frutos rojos y yuca','Lasaña de calabacín','Pasta con brócoli y queso','Albóndigas de pollo con arroz al curry'],opts_en:['Chicken with berry sauce and cassava','Courgette lasagne','Pasta with broccoli and cheese','Chicken meatballs with curry rice'],ans:3,fact:'Albóndigas de pollo con arroz al curry · 550kcal',fact_en:'Chicken meatballs with curry rice · 550kcal'},
  {q:'¿Cuál de estos platos del recetario GBH tiene más grasas?',q_en:'Which GBH recipe has the most fat?',opts:['Guiso de pavo','Boloñesa de lentejas','Rape con verduras','Arroz con leche al chocolate'],opts_en:['Turkey stew','Lentil bolognese','Monkfish with vegetables','Chocolate rice pudding'],ans:3,fact:'Arroz con leche al chocolate · 36g grasa',fact_en:'Chocolate rice pudding · 36g fat'},
  {q:'¿Cuál de estos platos del recetario GBH tiene más proteínas?',q_en:'Which GBH recipe has the most protein?',opts:['Lentejas sin sofrito','Crema con rape y gambas','Tosta de atún con gambas y tomate','Rollitos de salmón ahumado'],opts_en:['Plain lentils','Monkfish and prawn cream','Tuna toast with prawns and tomato','Smoked salmon rolls'],ans:3,fact:'Rollitos de salmón ahumado · 41g prot',fact_en:'Smoked salmon rolls · 41g protein'},
  {q:'¿Cuál de estos platos del recetario GBH tiene más calorías?',q_en:'Which GBH recipe has the most calories?',opts:['Triángulos de maíz con carne','Pastelitos de patata y brócoli','Estofado de cordero','Sándwich de salmón, queso y aguacate'],opts_en:['Corn triangles with meat','Potato and broccoli cakes','Lamb stew','Salmon, cheese and avocado sandwich'],ans:2,fact:'Estofado de cordero · 500kcal',fact_en:'Lamb stew · 500kcal'},
  {q:'¿Cuál de estos platos del recetario GBH tiene más proteínas?',opts:['Pastel de champiñones y soya','Huevos revueltos con jamón','Guiso marinero','Guiso pavo con verduras'],ans:1,fact:'Huevos revueltos con jamón · 35g prot',opts_en:['Mushroom and soy cake','Scrambled eggs with ham','Seafood stew','Turkey and vegetable stew'],fact_en:'Scrambled eggs with ham · 35g protein'},
  {q:'¿Cuál de estos platos del recetario GBH tiene más grasas?',opts:['Ensalada california','Salmón con salsa de yogur','Berenjenas a la parmesana','Guiso de patatas con champiñones'],ans:0,fact:'Ensalada california · 15g grasa',opts_en:['California salad','Salmon with yogurt sauce','Aubergine parmigiana','Potato and mushroom stew'],fact_en:'California salad · 15g fat'},
  {q:'¿Cuál de estos platos del recetario GBH tiene más grasas?',opts:['Coulant de pistacho','Quesadillas','Parrillada de verduras','Ensalada de pollo y aguacate'],ans:1,fact:'Quesadillas · 32g grasa',opts_en:['Pistachio coulant','Quesadillas','Grilled vegetables','Chicken and avocado salad'],fact_en:'Quesadillas · 32g fat'},
  {q:'¿Cuál de estos platos del recetario GBH tiene más proteínas?',opts:['Mousse de melón con frutos rojos','Ensalada de naranjas','Lubina al microondas con calabacín','Crema cuajada de leche y queso'],ans:2,fact:'Lubina al microondas con calabacín · 28g prot',opts_en:['Melon mousse with berries','Orange salad','Microwave sea bass with courgette','Milk and cheese cream'],fact_en:'Microwave sea bass with courgette · 28g protein'},
  {q:'¿Cuál de estos platos del recetario GBH tiene más calorías?',opts:['Gachas de avena remojadas con cacahuetes y chocolate','Pollo con pesto rosso de tomates secos','Sopa postre de chocolate y almendras','Trufas de palomitas'],ans:2,fact:'Sopa postre de chocolate y almendras · 521kcal',opts_en:['Overnight oats with peanuts and chocolate','Chicken with sun-dried tomato pesto','Chocolate and almond dessert soup','Popcorn truffles'],fact_en:'Chocolate and almond dessert soup · 521kcal'},
  {q:'¿Cuál de estos platos del recetario GBH tiene más proteínas?',opts:['Guiso de garbanzos y calamares','Salmón con arroz y gambas','Berenjenas rellenas de verduras','Ensalada california'],ans:1,fact:'Salmón con arroz y gambas · 31g prot',opts_en:['Chickpea and squid stew','Salmon with rice and prawns','Stuffed aubergines','California salad'],fact_en:'Salmon with rice and prawns · 31g protein'},
  {q:'¿Cuál de estos platos del recetario GBH tiene más calorías?',opts:['Lentejas estofadas','Alcachofas con jamón y huevo','Hummus','Focaccia de pesto burata y mortadela'],ans:3,fact:'Focaccia de pesto burata y mortadela · 700kcal',opts_en:['Braised lentils','Artichokes with ham and egg','Hummus','Pesto burrata mortadella focaccia'],fact_en:'Pesto burrata mortadella focaccia · 700kcal'},
  {q:'¿Cuál de estos platos del recetario GBH tiene más proteínas?',opts:['Merluza con cebolla al microondas','Tortitas de plátano y avena','Sorbete de café','Ensalada de naranjas'],ans:0,fact:'Merluza con cebolla al microondas · 24g prot',opts_en:['Microwave hake with onion','Banana and oat pancakes','Coffee sorbet','Orange salad'],fact_en:'Microwave hake with onion · 24g protein'},
  {q:'¿Cuál de estos platos del recetario GBH tiene más grasas?',opts:['Tortilla de zanahorias','Batido de mango y proteína','Huevos revueltos con champiñones','Sorbete de frutas'],ans:3,fact:'Sorbete de frutas · 40g grasa',opts_en:['Carrot omelette','Mango protein smoothie','Scrambled eggs with mushrooms','Fruit sorbet'],fact_en:'Fruit sorbet · 40g fat'},
  {q:'¿Cuál de estos platos del recetario GBH tiene más grasas?',opts:['Ensalada de alcachofas y atún','Pastel de patata con marisco','Hamburguesa de pollo y espinaca al plato','Ensalada waldorf'],ans:1,fact:'Pastel de patata con marisco · 42g grasa',opts_en:['Artichoke and tuna salad','Potato and seafood cake','Chicken and spinach burger','Waldorf salad'],fact_en:'Potato and seafood cake · 42g fat'},
  {q:'¿Cuál de estos platos del recetario GBH tiene más hidratos de carbono?',opts:['Mero con fideos','Bizcocho keto de limón','Ensalada de coliflor','Ensalada de pollo con mango y aguacate'],ans:0,fact:'Mero con fideos · 25g HC',opts_en:['Grouper with noodles','Keto lemon cake','Cauliflower salad','Chicken salad with mango and avocado'],fact_en:'Grouper with noodles · 25g carbs'},
  {q:'¿Cuál de estos platos del recetario GBH tiene más proteínas?',opts:['Espaguetis boloñesa','Ensalada de champiñones','Mousse de pera y kiwi','Sopa crema de patatas y cebollas'],ans:0,fact:'Espaguetis boloñesa · 50g prot',opts_en:['Spaghetti bolognese','Mushroom salad','Pear and kiwi mousse','Creamy potato and onion soup'],fact_en:'Spaghetti bolognese · 50g protein'},
  {q:'¿Cuál de estos platos del recetario GBH tiene más proteínas?',opts:['Sándwich de bacalao ahumado y aguacate','Tostadas Hawai','Hamburguesas de arroz con queso','Salmón al horno con brócoli y patatas'],ans:3,fact:'Salmón al horno con brócoli y patatas · 50g prot',opts_en:['Smoked cod and avocado sandwich','Hawaiian toast','Rice and cheese burgers','Baked salmon with broccoli and potatoes'],fact_en:'Baked salmon with broccoli and potatoes · 50g protein'},
  {q:'¿Cuál de estos platos del recetario GBH tiene más hidratos de carbono?',opts:['Focaccia de pesto burata y mortadela','Tortilla de patata asada baja en grasas','Bombones saludables de avena','Fideos con costillas'],ans:0,fact:'Focaccia de pesto burata y mortadela · 40g HC',opts_en:['Pesto burrata mortadella focaccia','Low-fat baked potato omelette','Healthy oat chocolates','Noodles with ribs'],fact_en:'Pesto burrata mortadella focaccia · 40g carbs'},
  {q:'¿Cuál de estos platos del recetario GBH tiene más calorías?',opts:['Pudin de ajetes y bacon','Alfajor de platano y creme de avellanas','Guiso de garbanzos y albaricoques','Ajoblanco con sardina ahumada'],ans:3,fact:'Ajoblanco con sardina ahumada · 970kcal',opts_en:['Garlic shoots and bacon pudding','Banana and hazelnut alfajor','Chickpea and apricot stew','Ajoblanco with smoked sardine'],fact_en:'Ajoblanco with smoked sardine · 970kcal'},
  {q:'¿Cuál de estos platos del recetario GBH tiene más hidratos de carbono?',opts:['Tortilla de coliflor','Corona de pistacho y almendra','Ensalada tibia de vegetales asados','Brazo de tiramisú'],ans:1,fact:'Corona de pistacho y almendra · 57g HC',opts_en:['Cauliflower omelette','Pistachio and almond ring cake','Warm roasted vegetable salad','Tiramisu roll'],fact_en:'Pistachio and almond ring cake · 57g carbs'},
  {q:'¿Cuál de estos platos del recetario GBH tiene más proteínas?',opts:['Pisto de bacalao y calabacín','Pan vegano de plátano avena y nueces','Alitas de pollo con sticks de calabacín','Ensalada de manzana y fresas con pipas'],ans:0,fact:'Pisto de bacalao y calabacín · 47g prot',opts_en:['Cod and courgette ratatouille','Vegan banana oat and walnut bread','Chicken wings with courgette sticks','Apple and strawberry salad with seeds'],fact_en:'Cod and courgette ratatouille · 47g protein'},
  {q:'¿Cuál de estos platos del recetario GBH tiene más grasas?',opts:['Berenjenas con soja y miel','Guiso de merluza y gambas','Ensaladilla de pollo y aguacate','Estofado de habichuelas'],ans:2,fact:'Ensaladilla de pollo y aguacate · 21g grasa',opts_en:['Aubergines with soy and honey','Hake and prawn stew','Chicken and avocado salad','Bean stew'],fact_en:'Chicken and avocado salad · 21g fat'},
  {q:'¿Cuál de estos platos del recetario GBH tiene más calorías?',opts:['Berenjenas empanadas','Pasta a la puttanesca','Sopa crema de patatas y cebollas','Ensalada de lentejas camote crujiente y pimentón'],ans:1,fact:'Pasta a la puttanesca · 700kcal',opts_en:['Breaded aubergines','Pasta puttanesca','Creamy potato and onion soup','Lentil salad with crispy sweet potato'],fact_en:'Pasta puttanesca · 700kcal'},
  {q:'¿Cuál de estos platos del recetario GBH tiene más calorías?',opts:['Lentejas asadas y berenjenas','Hamburguesa completa','Guiso de acelgas','Salteado de tofu brócoli y zanahoria'],ans:1,fact:'Hamburguesa completa · 800kcal',opts_en:['Roasted lentils and aubergines','Full burger','Chard stew','Tofu broccoli and carrot stir-fry'],fact_en:'Full burger · 800kcal'},
  {q:'¿Cuál de estos platos del recetario GBH tiene más hidratos de carbono?',opts:['Guiso marinero','Pastelitos de pasta filo y pasas','Ensalada de garbanzos','Judías verdes con huevo'],ans:1,fact:'Pastelitos de pasta filo y pasas · 38g HC',opts_en:['Seafood stew','Filo pastry cakes with raisins','Chickpea salad','Green beans with egg'],fact_en:'Filo pastry cakes with raisins · 38g carbs'},
  {q:'¿Cuál de estos platos del recetario GBH tiene más proteínas?',opts:['Sopa de lentejas y boniato','Tiramisú de pistacho','Pimientos rellenos de bacalao con sticks de zanahoria','Sopa crema de calabaza'],ans:2,fact:'Pimientos rellenos de bacalao con sticks de zanahoria · 30g prot',opts_en:['Lentil and sweet potato soup','Pistachio tiramisu','Cod stuffed peppers with carrot sticks','Cream of pumpkin soup'],fact_en:'Cod stuffed peppers with carrot sticks · 30g protein'},
  {q:'¿Cuál de estos platos del recetario GBH tiene más grasas?',opts:['Pastelitos de patata y brócoli','Cuajada con galletas de sésamo','Ensalada de mango y arroz','Empanadillas orientales'],ans:3,fact:'Empanadillas orientales · 73g grasa',opts_en:['Potato and broccoli cakes','Custard with sesame biscuits','Mango and rice salad','Oriental pasties'],fact_en:'Oriental pasties · 73g fat'},
  {q:'¿Cuál de estos platos del recetario GBH tiene más proteínas?',opts:['Ensalada de arroz chino','Pollo con salsa de frutos rojos y yuca','Helado de mango','Panache de verduras'],ans:1,fact:'Pollo con salsa de frutos rojos y yuca · 55g prot',opts_en:['Chinese rice salad','Chicken with berry sauce and cassava','Mango ice cream','Vegetable medley'],fact_en:'Chicken with berry sauce and cassava · 55g protein'},
  {q:'¿Cuál de estos platos del recetario GBH tiene más grasas?',opts:['Tortilla de espinacas y queso','Crema de patatas y apio','Ensalada de aguacate y quinoa','Pastel de pescado'],ans:2,fact:'Ensalada de aguacate y quinoa · 23g grasa',opts_en:['Spinach and cheese omelette','Potato and celery cream','Avocado and quinoa salad','Fish cake'],fact_en:'Avocado and quinoa salad · 23g fat'},
  {q:'¿Cuál de estos platos del recetario GBH tiene más calorías?',opts:['Minestrone','Hojaldre con natillas','Arroz con leche al chocolate','Pinchos de pimiento bacon y queso'],ans:3,fact:'Pinchos de pimiento bacon y queso · 630kcal',opts_en:['Minestrone','Custard pastry','Chocolate rice pudding','Pepper bacon and cheese skewers'],fact_en:'Pepper bacon and cheese skewers · 630kcal'},
  {q:'¿Cuál de estos platos del recetario GBH tiene más proteínas?',opts:['Pastel de champiñones y soya','Sorbete de café','Tortilla de zanahorias','Panache de verduras'],ans:0,fact:'Pastel de champiñones y soya · 16g prot',opts_en:['Mushroom and soy cake','Coffee sorbet','Carrot omelette','Vegetable medley'],fact_en:'Mushroom and soy cake · 16g protein'},
  {q:'¿Cuál de estos platos del recetario GBH tiene más grasas?',opts:['Guisado de carne o pescado','Ensalada de naranjas','Crepes de harina integral veganas','Hojaldre con natillas'],ans:3,fact:'Hojaldre con natillas · 19g grasa',opts_en:['Meat or fish stew','Orange salad','Vegan wholemeal crepes','Custard pastry'],fact_en:'Custard pastry · 19g fat'},
  {q:'¿Cuál de estos platos del recetario GBH tiene más proteínas?',opts:['Salmón con verduras al microondas','Pastelitos de manzana','Barritas de avena y almendras','Pinchos de pimiento bacon y queso'],ans:0,fact:'Salmón con verduras al microondas · 29g prot',opts_en:['Microwave salmon with vegetables','Apple cakes','Oat and almond bars','Pepper bacon and cheese skewers'],fact_en:'Microwave salmon with vegetables · 29g protein'},
  {q:'¿Cuál de estos platos del recetario GBH tiene más proteínas?',opts:['Fresas con nata','Ensalada mixta','Triángulos de maíz con carne','Milhojas de nata'],ans:2,fact:'Triángulos de maíz con carne · 35g prot',opts_en:['Strawberries and cream','Mixed salad','Corn triangles with meat','Cream millefeuille'],fact_en:'Corn triangles with meat · 35g protein'},
  {q:'¿Cuál de estos platos del recetario GBH tiene más hidratos de carbono?',opts:['Ensalada de langostinos rúcula y papaya','Guiso de patatas con champiñones','Ternera con pimientos de piquillo','Tartar de atún'],ans:1,fact:'Guiso de patatas con champiñones · 30g HC',opts_en:['Prawn rocket and papaya salad','Potato and mushroom stew','Veal with piquillo peppers','Tuna tartare'],fact_en:'Potato and mushroom stew · 30g carbs'},
  {q:'¿Cuál de estos platos del recetario GBH tiene más calorías?',opts:['Mejillones al vapor','Arroz de alubias y pimientos','Ensalada de judías verdes con jamón','Ensalada de col y manzana'],ans:1,fact:'Arroz de alubias y pimientos · 367kcal',opts_en:['Steamed mussels','Bean and pepper rice','Green bean and ham salad','Cabbage and apple salad'],fact_en:'Bean and pepper rice · 367kcal'},
  {q:'¿Cuál de estos platos del recetario GBH tiene más grasas?',opts:['Ensalada de pollo con mango y aguacate','Muffin de chocolate','Curry de tofu y vegetales','Tartar de atún'],ans:2,fact:'Curry de tofu y vegetales · 37g grasa',opts_en:['Chicken salad with mango and avocado','Chocolate muffin','Tofu and vegetable curry','Tuna tartare'],fact_en:'Tofu and vegetable curry · 37g fat'},
  {q:'¿Cuál de estos platos del recetario GBH tiene más calorías?',opts:['Pasta con setas','Pan de manzana','Salteado de tofu brócoli y zanahoria','Hojaldre de manzana y crema'],ans:0,fact:'Pasta con setas · 750kcal',opts_en:['Pasta with mushrooms','Apple bread','Tofu broccoli and carrot stir-fry','Apple and cream pastry'],fact_en:'Pasta with mushrooms · 750kcal'},
  {q:'¿Cuál de estos platos del recetario GBH tiene más calorías?',opts:['Calamares guisados','Salmón al horno','Pudin de ajetes y bacon','Brownie en microondas'],ans:2,fact:'Pudin de ajetes y bacon · 730kcal',opts_en:['Stewed squid','Baked salmon','Garlic shoots and bacon pudding','Microwave brownie'],fact_en:'Garlic shoots and bacon pudding · 730kcal'},
  {q:'¿Cuál de estos platos del recetario GBH tiene más proteínas?',opts:['Tarta de queso al microondas','Guiso de cacahuetes y boniato','Tortitas saladas de puerro y calabacín','Pimientos rellenos al horno'],ans:3,fact:'Pimientos rellenos al horno · 24g prot',opts_en:['Microwave cheesecake','Peanut and sweet potato stew','Savoury leek and courgette pancakes','Oven-stuffed peppers'],fact_en:'Oven-stuffed peppers · 24g protein'},
  {q:'¿Cuál de estos platos del recetario GBH tiene más proteínas?',opts:['Hojaldre de manzana y crema','Rape con verduras','Albóndigas de pavo','Hamburguesas de arroz con queso'],ans:2,fact:'Albóndigas de pavo · 36g prot',opts_en:['Apple and cream pastry','Monkfish with vegetables','Turkey meatballs','Rice and cheese burgers'],fact_en:'Turkey meatballs · 36g protein'},
  {q:'¿Cuál de estos platos del recetario GBH tiene más calorías?',opts:['Ensalada de patata','Hamburguesas de arroz con queso','Tartaleta de arroz y pollo','Potaje de vigilia'],ans:2,fact:'Tartaleta de arroz y pollo · 580kcal',opts_en:['Potato salad','Rice and cheese burgers','Rice and chicken tartlet','Lenten stew'],fact_en:'Rice and chicken tartlet · 580kcal'},
  {q:'¿Cuál de estos platos del recetario GBH tiene más proteínas?',opts:['Pollo teriyaki con calabacín / versión ligera','Ensalada de quinoa y atún','Tartaleta de arroz y pollo','Bol de plátano y mango'],ans:0,fact:'Pollo teriyaki con calabacín / versión ligera · 55g prot',opts_en:['Teriyaki chicken with courgette (light)','Quinoa and tuna salad','Rice and chicken tartlet','Banana and mango bowl'],fact_en:'Teriyaki chicken with courgette (light) · 55g protein'},
  {q:'¿Cuál de estos platos del recetario GBH tiene más hidratos de carbono?',opts:['Pastel de berenjenas y calabacines','Huevos revueltos con espárragos','Pasta carbonara con salsa de pistacho','Sopa de tofu'],ans:2,fact:'Pasta carbonara con salsa de pistacho · 40g HC',opts_en:['Aubergine and courgette cake','Scrambled eggs with asparagus','Pasta carbonara with pistachio sauce','Tofu soup'],fact_en:'Pasta carbonara with pistachio sauce · 40g carbs'},
  {q:'¿Cuál de estos platos del recetario GBH tiene más grasas?',opts:['Ensalada de arroz chino','Brochetas de rape con tomate y pimiento','Pastelitos de patata y brócoli','Ensalada california'],ans:2,fact:'Pastelitos de patata y brócoli · 16g grasa',opts_en:['Chinese rice salad','Monkfish skewers with tomato and pepper','Potato and broccoli cakes','California salad'],fact_en:'Potato and broccoli cakes · 16g fat'},
  {q:'¿Cuál de estos platos del recetario GBH tiene más calorías?',opts:['Samosas de morcilla y manzana','Platano banado en choco','Crema cuajada de leche y queso','Rape con verduras'],ans:2,fact:'Crema cuajada de leche y queso · 627kcal',opts_en:['Black pudding and apple samosas','Chocolate-dipped banana','Milk and cheese cream','Monkfish with vegetables'],fact_en:'Milk and cheese cream · 627kcal'},
  {q:'¿Cuál de estos platos del recetario GBH tiene más hidratos de carbono?',opts:['Chocolatinas de frutos secos','Arroz de coliflor con curry','Batido de mango y proteína','Hojaldre con natillas'],ans:3,fact:'Hojaldre con natillas · 42g HC',opts_en:['Nut chocolates','Cauliflower rice with curry','Mango protein smoothie','Custard pastry'],fact_en:'Custard pastry · 42g carbs'},
  {q:'¿Cuál de estos platos del recetario GBH tiene más calorías?',opts:['Calamares guisados','Rape con verduras','Hamburguesa de pollo y espinaca al plato','Natillas'],ans:2,fact:'Hamburguesa de pollo y espinaca al plato · 430kcal',opts_en:['Stewed squid','Monkfish with vegetables','Chicken and spinach burger','Custard'],fact_en:'Chicken and spinach burger · 430kcal'},
  {q:'¿Cuál de estos platos del recetario GBH tiene más hidratos de carbono?',opts:['Brochetas de tomate, queso y anchoas','Tortitas proteicas de avena','Huevos revueltos con jamón','Ensalada caprese'],ans:3,fact:'Ensalada caprese · 40g HC',opts_en:['Tomato cheese and anchovy skewers','Protein oat pancakes','Scrambled eggs with ham','Caprese salad'],fact_en:'Caprese salad · 40g carbs'},
  {q:'¿Cuál de estos platos del recetario GBH tiene más calorías?',opts:['Datiles banados en chocolate y nuez','Olla gitana','Guiso de pollo con alcachofas','Sopa de verduras con quinoa'],ans:1,fact:'Olla gitana · 363kcal',opts_en:['Dates dipped in chocolate and walnut','Gypsy stew','Chicken stew with artichokes','Vegetable soup with quinoa'],fact_en:'Gypsy stew · 363kcal'},
  {q:'¿Cuál de estos platos del recetario GBH tiene más calorías?',opts:['Atún a la sevillana al microondas','Hamburguesa de pimiento y soya','Fideos con costillas','Tostas de tomate, queso y mortadela'],ans:2,fact:'Fideos con costillas · 750kcal',opts_en:['Seville-style microwave tuna','Pepper and soy burger','Noodles with ribs','Toast with tomato cheese and mortadella'],fact_en:'Noodles with ribs · 750kcal'},
  {q:'¿Cuál de estos platos del recetario GBH tiene más grasas?',opts:['Guiso de acelgas','Pollo al horno con verduras','Ternera a la jardinera','Ensalada de espárragos blancos y salmón ahumado'],ans:2,fact:'Ternera a la jardinera · 22g grasa',opts_en:['Chard stew','Baked chicken with vegetables','Veal jardinière','White asparagus and smoked salmon salad'],fact_en:'Veal jardinière · 22g fat'},
  {q:'¿Cuál de estos platos del recetario GBH tiene más calorías?',opts:['Bacalao con salsa de pimiento y tomate','Alubias con pulpo','Ensaladilla de pollo y aguacate','Brownie en microondas'],ans:3,fact:'Brownie en microondas · 555kcal',opts_en:['Cod with pepper and tomato sauce','Beans with octopus','Chicken and avocado salad','Microwave brownie'],fact_en:'Microwave brownie · 555kcal'},
  {q:'¿Cuál de estos platos del recetario GBH tiene más calorías?',opts:['Ensalada de espárragos blancos y salmón ahumado','Tostadas Hawai','Rollos fritos','Ensalada de judías verdes con jamón'],ans:2,fact:'Rollos fritos · 731kcal',opts_en:['White asparagus and smoked salmon salad','Hawaiian toast','Fried rolls','Green bean and ham salad'],fact_en:'Fried rolls · 731kcal'}
];

// Banco combinado: preguntas generales + recetario
const QUIZ_ALL = [...QUIZ_BANK, ...QUIZ_RECETARIO];


// ─── Ruleta diaria ────────────────────────────────────────────────────────────
const RULETA_PREMIOS = [
  {icon:"🍏", label:"+10 XP",       xp:10,  gems:0,  color:"#C8FF40", weight:30},
  {icon:"🥗", label:"+3 💎",        xp:0,   gems:3,  color:"#FFD700", weight:25},
  {icon:"🍌", label:"+25 XP",       xp:25,  gems:0,  color:"#C8FF40", weight:18},
  {icon:"🍝", label:"+8 💎",        xp:0,   gems:8,  color:"#FFD700", weight:12},
  {icon:"🌮", label:"+15 XP +5💎",  xp:15,  gems:5,  color:"#FF8040", weight:8},
  {icon:"🍕", label:"+50 XP",       xp:50,  gems:0,  color:"#C8FF40", weight:5},
  {icon:"🍔", label:"+30 XP +15💎", xp:30,  gems:15, color:"#FF40FF", weight:2},
];

// Función para seleccionar premio con pesos
function pickPrize(seed){
  const total=RULETA_PREMIOS.reduce((s,p)=>s+p.weight,0);
  let r=(seed%1000)/1000*total;
  for(let i=0;i<RULETA_PREMIOS.length;i++){r-=RULETA_PREMIOS[i].weight;if(r<=0)return i;}
  return 0;
}

function RuletaModal({onClose, onCollect, onGoHome}){
  const [phase, setPhase]   = useState("ready");
  const [angle, setAngle]   = useState(0);
  const [prizeIdx, setPrizeIdx] = useState(null);

  const SEG = 360 / RULETA_PREMIOS.length;

  // Colores tapete y madera (consistentes con el resto de la app)
  const FELT   = "#0F3320";   // verde tapete oscuro
  const FELT2  = "#144228";   // tapete claro alternado
  const WOOD   = "#5C3210";   // madera borde
  const WOOD2  = "#7A4520";   // madera clara
  const WOODLT = "#9C6030";   // madera highlight
  const NAIL   = "#C8A050";   // clavo dorado del centro

  const spin = () => {
    if(phase!=="ready") return;
    setPhase("spinning");
    const seed = Date.now();
    const idx  = pickPrize(seed);
    setPrizeIdx(idx);
    const segCenter = idx * SEG + SEG/2;
    const target    = (360 - segCenter % 360 + 360) % 360;
    const fullSpins = (5 + Math.floor(Math.random()*3)) * 360;
    const finalAngle = angle + fullSpins + ((target - angle % 360) + 360) % 360;
    setAngle(finalAngle);
    setTimeout(() => setPhase("result"), 4200);
  };

  const prize = prizeIdx!==null ? RULETA_PREMIOS[prizeIdx] : null;

  return(
    <div style={{position:"fixed",inset:0,zIndex:11000,
      background:"rgba(0,0,0,0.88)",backdropFilter:"blur(6px)",
      display:"flex",flexDirection:"column",alignItems:"center",
      justifyContent:"center",padding:20}}>

      {/* ── Contenedor principal estilo mesa de casino ── */}
      <div style={{
        width:"100%",maxWidth:360,
        background:`linear-gradient(180deg,${WOOD} 0%,${WOOD2} 4%,${FELT} 4%,${FELT} 96%,${WOOD2} 96%,${WOOD} 100%)`,
        borderRadius:28,
        border:`6px solid ${WOOD}`,
        boxShadow:`0 0 0 3px ${WOODLT},0 12px 0 ${WOOD},0 18px 0 rgba(0,0,0,0.5),inset 0 2px 4px rgba(255,200,100,0.08)`,
        overflow:"hidden",
        animation:"popIn 0.4s cubic-bezier(0.34,1.56,0.64,1)",
      }}>

        {/* ── Borde superior de madera — cabecera ── */}
        <div style={{
          background:`linear-gradient(90deg,${WOOD},${WOODLT},${WOOD2},${WOODLT},${WOOD})`,
          padding:"10px 20px 8px",
          display:"flex",alignItems:"center",justifyContent:"space-between",
          borderBottom:`3px solid ${WOOD}`,
        }}>
          <div style={{fontSize:11,fontWeight:900,color:"#C8A050",textTransform:"uppercase",
            letterSpacing:"0.18em",fontFamily:"'Nunito',sans-serif",
            textShadow:"0 1px 2px rgba(0,0,0,0.6)"}}>
            🎰 Ruleta diaria
          </div>
          <button onClick={onClose} style={{background:"rgba(0,0,0,0.3)",border:`1px solid ${WOODLT}`,
            borderRadius:"50%",width:26,height:26,color:"#C8A050",fontSize:13,
            cursor:"pointer",display:"flex",alignItems:"center",justifyContent:"center"}}>✕</button>
        </div>

        {/* ── Tapete + rueda ── */}
        <div style={{padding:"20px 20px 10px",display:"flex",flexDirection:"column",alignItems:"center"}}>

          {phase!=="result"&&(<>
            {/* Marcador tipo alfiler dorado */}
            <div style={{position:"relative",zIndex:10,marginBottom:-14}}>
              <div style={{width:0,height:0,
                borderLeft:"13px solid transparent",borderRight:"13px solid transparent",
                borderTop:"20px solid #FFD700",
                filter:"drop-shadow(0 2px 4px rgba(0,0,0,0.7))",
              }}/>
            </div>

            {/* Rueda con borde de madera */}
            <div style={{
              width:270,height:270,borderRadius:"50%",position:"relative",flexShrink:0,
              // Marco exterior madera
              boxShadow:`0 0 0 8px ${WOOD2},0 0 0 14px ${WOODLT},0 0 0 17px ${WOOD},0 8px 24px rgba(0,0,0,0.6)`,
              transform:`rotate(${angle}deg)`,
              transition:phase==="spinning"?"transform 4s cubic-bezier(0.17,0.67,0.12,1)":"none",
              overflow:"hidden",
            }}>
              {/* Segmentos tapete */}
              {RULETA_PREMIOS.map((p,i)=>{
                const startAngle = i*SEG;
                const endAngle   = startAngle+SEG;
                const mid = startAngle+SEG/2;
                const r=135;
                const tx = r+(r*0.62)*Math.sin((mid*Math.PI)/180);
                const ty = r-(r*0.62)*Math.cos((mid*Math.PI)/180);
                const x1=r+r*Math.sin(startAngle*Math.PI/180);
                const y1=r-r*Math.cos(startAngle*Math.PI/180);
                const x2=r+r*Math.sin(endAngle*Math.PI/180);
                const y2=r-r*Math.cos(endAngle*Math.PI/180);
                return(
                  <div key={i} style={{position:"absolute",inset:0}}>
                    <svg viewBox="0 0 270 270" style={{position:"absolute",inset:0,width:"100%",height:"100%"}}>
                      {/* Segmento tapete alternado */}
                      <path
                        d={`M${r},${r} L${x1},${y1} A${r},${r} 0 0,1 ${x2},${y2} Z`}
                        fill={i%2===0?FELT:FELT2}
                        stroke={WOOD} strokeWidth="1.5"
                      />
                      {/* Línea dorada separadora */}
                      <line x1={r} y1={r} x2={x1} y2={y1}
                        stroke="rgba(180,130,40,0.4)" strokeWidth="1"/>
                    </svg>
                    {/* Icono + premio */}
                    <div style={{position:"absolute",left:tx-28,top:ty-18,width:56,
                      textAlign:"center",transform:`rotate(${mid}deg)`}}>
                      <div style={{fontSize:20,lineHeight:1,filter:"drop-shadow(0 1px 2px rgba(0,0,0,0.8))"}}>{p.icon}</div>
                      <div style={{fontSize:8,fontWeight:900,color:"#FFD700",
                        fontFamily:"'Nunito',sans-serif",whiteSpace:"nowrap",
                        textShadow:"0 1px 3px rgba(0,0,0,0.9)",marginTop:2}}>{p.label}</div>
                    </div>
                  </div>
                );
              })}
              {/* Centro — botón/clavo */}
              <div style={{position:"absolute",top:"50%",left:"50%",
                transform:"translate(-50%,-50%)",
                width:36,height:36,borderRadius:"50%",
                background:`radial-gradient(circle at 35% 35%,${WOODLT},${WOOD})`,
                border:`3px solid ${NAIL}`,
                boxShadow:`0 0 0 2px ${WOOD},0 3px 8px rgba(0,0,0,0.8),inset 0 1px 2px rgba(255,200,100,0.3)`,
                zIndex:5}}/>
            </div>

            {/* Botón girar — estilo app */}
            <button onClick={spin} disabled={phase!=="ready"} style={{
              marginTop:22,width:"100%",padding:"16px",borderRadius:18,
              border:`3px solid ${T.g3}`,cursor:phase==="ready"?"pointer":"default",
              fontSize:18,fontWeight:900,
              background:phase==="ready"
                ?`linear-gradient(135deg,${T.g1},${T.g2})`
                :"rgba(255,255,255,0.08)",
              color:phase==="ready"?"white":"rgba(255,255,255,0.3)",
              boxShadow:phase==="ready"?`0 6px 0 ${T.g3}`:"none",
              fontFamily:"'Nunito',sans-serif",
              animation:phase==="ready"?"pulse 1.5s ease-in-out infinite":"none",
              transition:"all 0.3s",
            }}>
              {phase==="ready"?"🎰 ¡Girar ya!":"⏳ Girando…"}
            </button>
          </>)}

          {/* ── Resultado ── */}
          {phase==="result"&&prize&&(
            <div style={{textAlign:"center",animation:"scaleIn 0.6s cubic-bezier(0.34,1.56,0.64,1)",
              paddingTop:10,paddingBottom:10}}>
              <div style={{fontSize:72,marginBottom:6}}>{prize.icon}</div>
              <div style={{fontSize:12,color:"#C8A050",textTransform:"uppercase",
                letterSpacing:"0.15em",fontFamily:"'DM Sans',sans-serif",marginBottom:8}}>
                ¡Has ganado!
              </div>
              <div style={{fontSize:36,fontWeight:900,color:prize.color,
                fontFamily:"'Nunito',sans-serif",lineHeight:1,marginBottom:4,
                textShadow:`0 0 20px ${prize.color}80`}}>
                {prize.label}
              </div>
              {prize.xp>0&&prize.gems>0&&(
                <div style={{display:"flex",justifyContent:"center",gap:20,margin:"14px 0"}}>
                  <div style={{textAlign:"center"}}>
                    <div style={{fontSize:30,fontWeight:900,color:T.xp}}>+{prize.xp}</div>
                    <div style={{fontSize:11,color:"rgba(255,255,255,0.4)"}}>XP ⚡</div>
                  </div>
                  <div style={{width:1,background:"rgba(255,255,255,0.1)"}}/>
                  <div style={{textAlign:"center"}}>
                    <div style={{fontSize:30,fontWeight:900,color:T.au1}}>+{prize.gems}</div>
                    <div style={{fontSize:11,color:"rgba(255,255,255,0.4)"}}>💎</div>
                  </div>
                </div>
              )}
              <button onClick={()=>{onCollect(prize.xp,prize.gems);onClose();}} style={{
                width:"100%",padding:"16px",borderRadius:18,
                border:`3px solid ${T.g3}`,cursor:"pointer",fontSize:18,fontWeight:900,
                background:`linear-gradient(135deg,${T.g1},${T.g2})`,
                color:"white",boxShadow:`0 6px 0 ${T.g3}`,
                fontFamily:"'Nunito',sans-serif",marginTop:8}}>
                ¡Recoger!
              </button>
              <button onClick={()=>{onCollect(prize.xp,prize.gems);onGoHome();}} style={{
                width:"100%",padding:"12px",borderRadius:14,
                border:"1.5px solid rgba(255,255,255,0.12)",cursor:"pointer",fontSize:13,fontWeight:700,
                background:"rgba(255,255,255,0.04)",color:"rgba(255,255,255,0.4)",
                fontFamily:"'Nunito',sans-serif",marginTop:8}}>
                ← Inicio
              </button>
            </div>
          )}
        </div>

        {/* ── Borde inferior de madera ── */}
        <div style={{
          background:`linear-gradient(90deg,${WOOD},${WOODLT},${WOOD2},${WOODLT},${WOOD})`,
          padding:"8px 20px",
          borderTop:`3px solid ${WOOD}`,
          textAlign:"center",
        }}>
          <div style={{fontSize:10,color:"rgba(180,130,40,0.5)",fontFamily:"'DM Sans',sans-serif",
            letterSpacing:"0.1em"}}>GBH NUTRICIÓN · RULETA DIARIA</div>
        </div>
      </div>
    </div>
  );
}

// ─── QuizModal ────────────────────────────────────────────────────────────────
function QuizModal({onClose, onComplete, todayKey, lang, onGoHome}){
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
                <div style={{fontSize:14,fontWeight:900,color:"white"}}>
                  {lang==="en"?"Nutrition":"Nutrición"} · {correct?"":(lang==="en"?"Earn up to":"Gana hasta")} +20 XP +8 💎
                </div>
              </div>
              {/* Botón cerrar */}
              <button onClick={onClose} style={{
                background:"rgba(0,0,0,0.2)",border:"2px solid rgba(255,255,255,0.3)",
                borderRadius:"50%",width:32,height:32,color:"white",
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
                    if(i===q.ans){bg="rgba(88,204,2,0.25)";border=T.g1;col=T.g2;}
                    else if(i===selected&&selected!==q.ans){bg="rgba(255,80,80,0.2)";border="rgba(255,80,80,0.6)";col="#FF8080";}
                  } else if(selected===i){
                    bg="rgba(255,200,0,0.15)";border=T.au1;col=T.au1;
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
          <div style={{padding:"32px 24px",textAlign:"center"}} onClick={()=>{onComplete(xpGain,gemGain);onClose();}}>
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
            <div onClick={e=>{e.stopPropagation();onComplete(xpGain,gemGain);onGoHome();}} style={{display:"inline-block",padding:"10px 28px",borderRadius:14,border:"1.5px solid rgba(255,255,255,0.15)",color:"rgba(255,255,255,0.45)",fontSize:13,fontWeight:700,cursor:"pointer",fontFamily:"'Nunito',sans-serif"}}>
              {lang==="en"?"← Home":"← Inicio"}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

// ─── StreakChest — cofre de racha ─────────────────────────────────────────────
function StreakChest({streak, onOpen, alreadyOpened}){
  const daysToNext = 7 - (streak % 7);
  const isReady    = streak > 0 && streak % 7 === 0 && !alreadyOpened;
  const progress   = streak % 7;
  const pct        = isReady ? 100 : (progress/7)*100;

  const chestType = streak >= 30 ? "gold" : streak >= 14 ? "silver" : "bronze";
  const chestEmoji = {gold:"🏆",silver:"🥈",bronze:"🪙"}[chestType];
  const chestLabel = {gold:"Cofre de Oro",silver:"Cofre de Plata",bronze:"Cofre de Bronce"}[chestType];
  const chestColor = {gold:T.au1, silver:"#C0C0C0", bronze:"#CD7F32"}[chestType];

  return(
    <div style={{background:T.bgWood,borderRadius:22,padding:"14px 18px",border:`2px solid ${isReady?chestColor:T.bW}`,boxShadow:isReady?`0 6px 0 ${T.au3},0 0 20px ${chestColor}50`:"0 4px 0 rgba(0,0,0,0.4)",marginBottom:14,transition:"all 0.3s"}}>
      <div style={{display:"flex",alignItems:"center",gap:14}}>
        {/* Cofre animado */}
        <div
          onClick={isReady?onOpen:undefined}
          style={{
            width:58,height:58,borderRadius:18,
            background:isReady?`linear-gradient(135deg,${chestColor},${T.au2})`:"rgba(255,255,255,0.08)",
            border:`3px solid ${isReady?chestColor:T.bW}`,
            display:"flex",alignItems:"center",justifyContent:"center",
            fontSize:28,cursor:isReady?"pointer":"default",flexShrink:0,
            animation:isReady?"pulse 1.5s ease-in-out infinite":"none",
            boxShadow:isReady?`0 4px 0 ${T.au3}`:"0 3px 0 rgba(0,0,0,0.5)",
          }}>
          {isReady?"🎁":chestEmoji}
        </div>
        <div style={{flex:1}}>
          <div style={{display:"flex",justifyContent:"space-between",alignItems:"center",marginBottom:6}}>
            <div style={{fontSize:13,fontWeight:900,color:isReady?chestColor:T.t1}}>
              {isReady?`¡${chestLabel} listo!`:chestLabel}
            </div>
            <div style={{fontSize:11,color:T.t2,fontFamily:"'DM Sans',sans-serif"}}>
              {isReady?"¡Ábrelo! 🎉":`${daysToNext} día${daysToNext!==1?"s":""} para abrirlo`}
            </div>
          </div>
          {/* Barra progreso */}
          <div style={{background:"rgba(255,255,255,0.08)",borderRadius:10,height:10,overflow:"hidden",boxShadow:"inset 0 2px 4px rgba(0,0,0,0.3)"}}>
            <div style={{height:"100%",width:`${pct}%`,background:isReady?`linear-gradient(90deg,${chestColor},${T.au1})`:`linear-gradient(90deg,${T.g1},${T.g2})`,borderRadius:10,transition:"width 0.8s ease",boxShadow:isReady?`0 0 10px ${chestColor}80`:`0 0 6px ${T.g1}60`}}/>
          </div>
          <div style={{fontSize:10,color:T.t2,marginTop:5,fontFamily:"'DM Sans',sans-serif"}}>
            Racha {isReady?streak:progress}/{isReady?streak:streak - progress + 7} días
          </div>
        </div>
      </div>
      {isReady&&(
        <button onClick={onOpen} style={{marginTop:12,width:"100%",padding:"13px",borderRadius:16,border:`2px solid ${chestColor}`,cursor:"pointer",fontSize:15,fontWeight:900,background:`linear-gradient(135deg,${chestColor},${T.au2})`,color:"#1A1000",boxShadow:'0 5px 0 '+T.au3,fontFamily:"'Nunito',sans-serif",animation:"pulse 1.5s ease-in-out infinite"}}>
          🎁 ¡Abrir {chestLabel}!
        </button>
      )}
    </div>
  );
}

// ─── ChestOpenModal — animación de apertura del cofre ────────────────────────
function ChestOpenModal({streak, onClose, onCollect, onGoHome}){
  const [phase, setPhase] = useState("shake"); // shake | open | reward
  // Recompensa aleatoria basada en racha
  const rewards = (()=>{
    const base = streak>=30?{xp:60,gems:25}:streak>=14?{xp:40,gems:15}:{xp:25,gems:10};
    const bonus = Math.random();
    if(bonus>0.85) return {...base,xp:base.xp*2,special:"⚡ ¡Doble XP!",gems:base.gems+5};
    if(bonus>0.7)  return {...base,gems:base.gems*2,special:"💎 ¡Doble gemas!"};
    return base;
  })();

  useEffect(()=>{
    const t1=setTimeout(()=>setPhase("open"),1000);
    const t2=setTimeout(()=>setPhase("reward"),2000);
    return()=>{clearTimeout(t1);clearTimeout(t2);};
  },[]);

  const chestColor = streak>=30?T.au1:streak>=14?"#C0C0C0":"#CD7F32";

  return(
    <div style={{position:"fixed",inset:0,zIndex:11000,background:"#000",display:"flex",flexDirection:"column",alignItems:"center",justifyContent:"center",padding:24}}>
      {phase==="shake"&&(
        <>
          <div style={{fontSize:13,color:"rgba(255,255,255,0.5)",textTransform:"uppercase",letterSpacing:"0.15em",marginBottom:24,fontFamily:"'DM Sans',sans-serif"}}>Cofre de {streak>=30?"Oro":streak>=14?"Plata":"Bronce"}</div>
          <div style={{fontSize:100,animation:"chestShake 0.4s ease-in-out infinite"}}>📦</div>
          <div style={{fontSize:14,color:"rgba(255,255,255,0.4)",marginTop:24,fontFamily:"'DM Sans',sans-serif"}}>Abriendo...</div>
        </>
      )}
      {phase==="open"&&(
        <div style={{fontSize:120,animation:"scaleIn 0.5s cubic-bezier(0.34,1.56,0.64,1)"}}>🎁</div>
      )}
      {phase==="reward"&&(
        <div style={{textAlign:"center",animation:"scaleIn 0.6s cubic-bezier(0.34,1.56,0.64,1)"}}>
          <div style={{fontSize:22,fontWeight:900,color:"rgba(255,255,255,0.5)",textTransform:"uppercase",letterSpacing:"0.12em",marginBottom:16,fontFamily:"'DM Sans',sans-serif"}}>Recompensa de racha</div>
          {rewards.special&&(
            <div style={{fontSize:18,fontWeight:900,color:T.au1,marginBottom:16,animation:"pulse 1s ease-in-out infinite"}}>{rewards.special}</div>
          )}
          <div style={{display:"flex",justifyContent:"center",gap:20,marginBottom:32}}>
            <div style={{textAlign:"center"}}>
              <div style={{fontSize:56,fontWeight:900,color:T.xp,lineHeight:1}}>+{rewards.xp}</div>
              <div style={{fontSize:14,color:"rgba(255,255,255,0.5)",fontFamily:"'DM Sans',sans-serif"}}>XP ⚡</div>
            </div>
            <div style={{width:2,background:"rgba(255,255,255,0.1)",borderRadius:2}}/>
            <div style={{textAlign:"center"}}>
              <div style={{fontSize:56,fontWeight:900,color:T.au1,lineHeight:1}}>+{rewards.gems}</div>
              <div style={{fontSize:14,color:"rgba(255,255,255,0.5)",fontFamily:"'DM Sans',sans-serif"}}>Gemas 💎</div>
            </div>
          </div>
          <button onClick={()=>{onCollect(rewards.xp,rewards.gems);onClose();}} style={{background:`linear-gradient(135deg,${T.g1},${T.g2})`,border:`3px solid ${T.g3}`,borderRadius:20,padding:"18px 48px",color:"white",fontWeight:900,fontSize:18,cursor:"pointer",boxShadow:`0 6px 0 ${T.g3}`,fontFamily:"'Nunito',sans-serif",display:"block",width:"100%",marginBottom:12}}>
            ¡Recoger!
          </button>
          <button onClick={()=>{onCollect(rewards.xp,rewards.gems);onGoHome();}} style={{background:"rgba(255,255,255,0.06)",border:"1.5px solid rgba(255,255,255,0.12)",borderRadius:16,padding:"13px 48px",color:"rgba(255,255,255,0.4)",fontWeight:700,fontSize:13,cursor:"pointer",fontFamily:"'Nunito',sans-serif",width:"100%"}}>
            ← Inicio
          </button>
        </div>
      )}
    </div>
  );
}

// ─── Weight chart component ───────────────────────────────────────────────────
// ─── Tarjeta de progreso compartible (estilo Strava) ─────────────────────────
// Dibuja en un canvas 1080×1350 (4:5, ideal Instagram) un calco de la pestaña
// de peso: nombre, gráfica, kg perdidos/ganados, barra de objetivo y marca GBH.
// Devuelve {dataUrl, blob} para previsualizar, descargar o compartir.
async function generarTarjetaProgreso({nombre, chartData, goalWeight, lang}){
  const W=1080, H=1350;
  const cv=document.createElement("canvas"); cv.width=W; cv.height=H;
  const x=cv.getContext("2d");
  const es=lang!=="en";
  const rr=(px,py,pw,ph,r)=>{x.beginPath();x.moveTo(px+r,py);x.arcTo(px+pw,py,px+pw,py+ph,r);x.arcTo(px+pw,py+ph,px,py+ph,r);x.arcTo(px,py+ph,px,py,r);x.arcTo(px,py,px+pw,py,r);x.closePath();};
  const F=(w,s)=>`${w} ${s}px 'Nunito','Segoe UI Emoji',sans-serif`;
  const num=v=>String(Math.round(v*10)/10).replace(".",",");

  const ini=chartData.find(d=>d.isInitial)||chartData[0];
  const fin=chartData[chartData.length-1];
  const diff=fin.weight-ini.weight, lost=diff<0;
  const toGoal=goalWeight!=null?fin.weight-goalWeight:null;
  const totalNeeded=goalWeight!=null?ini.weight-goalWeight:null;
  const pct=goalWeight==null?null:(totalNeeded===0?100:Math.min(100,Math.max(0,Math.round((1-(toGoal/totalNeeded))*100))));
  const reached=goalWeight!=null&&Math.abs(toGoal)<=0.5;
  const dias=Math.max(1,Math.round((new Date(fin.date)-new Date(ini.date))/864e5));
  const semanas=Math.max(1,Math.round(dias/7));

  // ── Fondo: degradado verde GBH + halos suaves ──
  const bg=x.createLinearGradient(0,0,0,H);
  bg.addColorStop(0,"#0d2b12"); bg.addColorStop(0.55,"#14301b"); bg.addColorStop(1,"#0a2313");
  x.fillStyle=bg; x.fillRect(0,0,W,H);
  x.globalAlpha=0.07;
  x.fillStyle=reached?"#FFC800":"#58CC02";
  x.beginPath();x.arc(W-80,140,260,0,7);x.fill();
  x.beginPath();x.arc(60,H-160,300,0,7);x.fill();
  x.globalAlpha=1;

  // ── Cabecera de marca ──
  x.textAlign="center";
  x.fillStyle="#c9a84c"; x.font=F(900,30);
  x.fillText("🌱 G B H   N U T R I C I Ó N", W/2, 92);
  x.fillStyle="#fafdf6"; x.font=F(900,66);
  x.fillText(es?"MI PROGRESO":"MY PROGRESS", W/2, 178);
  x.fillStyle="rgba(250,253,246,0.75)"; x.font=F(700,32);
  const quien=(nombre||"").trim();
  x.fillText(`${quien?quien+" · ":""}${semanas} ${es?(semanas===1?"semana":"semanas"):(semanas===1?"week":"weeks")}`, W/2, 232);

  // ── Gráfica de peso ──
  const gx=100, gy=300, gw=W-200, gh=330;
  x.fillStyle="rgba(255,255,255,0.045)"; rr(gx-30,gy-30,gw+60,gh+80,28); x.fill();
  const ws=chartData.map(d=>d.weight);
  let mn=Math.min(...ws), mx=Math.max(...ws);
  if(goalWeight!=null){ mn=Math.min(mn,goalWeight); mx=Math.max(mx,goalWeight); }
  const pad=(mx-mn)*0.15||1; mn-=pad; mx+=pad;
  const X=i=>chartData.length===1?gx+gw/2:gx+(i/(chartData.length-1))*gw;
  const Y=v=>gy+gh-((v-mn)/(mx-mn))*gh;
  // línea de objetivo (rosa discontinua)
  if(goalWeight!=null){
    x.strokeStyle="#FF6B9D"; x.lineWidth=4; x.setLineDash([16,12]);
    x.beginPath(); x.moveTo(gx,Y(goalWeight)); x.lineTo(gx+gw,Y(goalWeight)); x.stroke();
    x.setLineDash([]);
    x.fillStyle="#FF6B9D"; x.font=F(800,24); x.textAlign="left";
    x.fillText(`${es?"Objetivo":"Goal"} ${num(goalWeight)} kg`, gx, Y(goalWeight)-12);
  }
  // área bajo la curva
  x.beginPath(); x.moveTo(X(0),Y(ws[0]));
  ws.forEach((v,i)=>x.lineTo(X(i),Y(v)));
  x.lineTo(X(ws.length-1),gy+gh); x.lineTo(X(0),gy+gh); x.closePath();
  const ar=x.createLinearGradient(0,gy,0,gy+gh);
  ar.addColorStop(0,"rgba(255,200,0,0.22)"); ar.addColorStop(1,"rgba(255,200,0,0)");
  x.fillStyle=ar; x.fill();
  // línea real (dorada) con puntos
  x.strokeStyle="#FFC800"; x.lineWidth=7; x.lineJoin="round";
  x.beginPath(); ws.forEach((v,i)=>i?x.lineTo(X(i),Y(v)):x.moveTo(X(i),Y(v))); x.stroke();
  const step=Math.max(1,Math.ceil(ws.length/14));
  ws.forEach((v,i)=>{ if(i%step&&i!==ws.length-1) return;
    x.fillStyle="#FFC800"; x.beginPath(); x.arc(X(i),Y(v),9,0,7); x.fill();
    x.fillStyle="#0d2b12"; x.beginPath(); x.arc(X(i),Y(v),4,0,7); x.fill(); });
  // etiquetas primer/último peso y fechas
  x.font=F(900,30);
  x.textAlign="left";  x.fillStyle="rgba(250,253,246,0.9)"; x.fillText(`${num(ini.weight)} kg`, gx, Y(ini.weight)+(Y(ini.weight)<gy+60?52:-20));
  x.textAlign="right"; x.fillStyle="#FFC800"; x.fillText(`${num(fin.weight)} kg`, gx+gw, Y(fin.weight)+(Y(fin.weight)<gy+60?52:-20));
  x.font=F(700,22); x.fillStyle="rgba(250,253,246,0.5)";
  x.textAlign="left";  x.fillText(ini.date.slice(5).replace("-","/"), gx, gy+gh+38);
  x.textAlign="right"; x.fillText(fin.date.slice(5).replace("-","/"), gx+gw, gy+gh+38);

  // ── Bloque grande: kg perdidos/ganados ──
  const by=740;
  x.textAlign="center";
  x.font=F(900,64); x.fillText(lost?"🪶":"💪🏼", W/2, by);
  x.fillStyle="#fafdf6"; x.font=F(900,110);
  x.fillText(`${num(Math.abs(diff))} kg`, W/2, by+118);
  x.fillStyle="rgba(250,253,246,0.75)"; x.font=F(800,38);
  x.fillText(lost?(es?"perdidos":"lost"):diff>0?(es?"ganados":"gained"):(es?"mantenidos":"maintained"), W/2, by+172);
  x.fillStyle="rgba(250,253,246,0.5)"; x.font=F(700,30);
  x.fillText(`${num(ini.weight)} kg  →  ${num(fin.weight)} kg`, W/2, by+222);

  // ── Barra de objetivo ──
  if(goalWeight!=null){
    const py=1030, ph2=170, px2=90, pw2=W-180;
    x.fillStyle=reached?"rgba(255,200,0,0.10)":"rgba(255,107,157,0.08)";
    rr(px2,py,pw2,ph2,26); x.fill();
    x.strokeStyle=reached?"#FFC800":"rgba(255,107,157,0.5)"; x.lineWidth=4; rr(px2,py,pw2,ph2,26); x.stroke();
    x.textAlign="left"; x.font=F(900,30);
    x.fillStyle=reached?"#FFC800":"#FF6B9D";
    x.fillText(reached?(es?"🎉 ¡OBJETIVO ALCANZADO!":"🎉 GOAL REACHED!"):(es?"🎯 Camino al objetivo":"🎯 On my way"), px2+34, py+52);
    x.textAlign="right"; x.fillStyle="#fafdf6"; x.font=F(900,42);
    x.fillText(`${pct}%`, px2+pw2-34, py+56);
    // barra
    const bx=px2+34, bw2=pw2-68, bh2=26, byy=py+80;
    x.fillStyle="rgba(255,255,255,0.10)"; rr(bx,byy,bw2,bh2,13); x.fill();
    const fillW=Math.max(bh2,bw2*pct/100);
    const bg2=x.createLinearGradient(bx,0,bx+fillW,0);
    if(reached){ bg2.addColorStop(0,"#FFC800"); bg2.addColorStop(1,"#58CC02"); }
    else { bg2.addColorStop(0,"#FF6B9D"); bg2.addColorStop(1,"#FF4081"); }
    x.fillStyle=bg2; rr(bx,byy,fillW,bh2,13); x.fill();
    x.textAlign="left"; x.fillStyle="rgba(250,253,246,0.65)"; x.font=F(700,26);
    x.fillText(reached
      ?(es?"Lo conseguí 💚":"I made it 💚")
      :(es?`Me quedan ${num(Math.abs(toGoal))} kg · objetivo ${num(goalWeight)} kg`:`${num(Math.abs(toGoal))} kg to go · goal ${num(goalWeight)} kg`),
      px2+34, py+ph2-26);
  }

  // ── Pie de marca ──
  x.textAlign="center"; x.fillStyle="rgba(201,168,76,0.85)"; x.font=F(800,28);
  x.fillText("gbh-app.vercel.app", W/2, H-56);

  const dataUrl=cv.toDataURL("image/png");
  const blob=await new Promise(res=>cv.toBlob(res,"image/png"));
  return {dataUrl, blob};
}

// ─── Tarjeta de HITO compartible (formato Story 9:16) ────────────────────────
// A diferencia de la tarjeta de progreso (4:5, feed), esta se dispara sola al
// alcanzar un hito (racha, kg, objetivo) y está pensada para Stories de
// Instagram: icono gigante, número enorme y marca GBH. El paciente la comparte
// con un toque → su audiencia ve la marca (mismo mecanismo que los posts
// etiquetados, pero automatizado).
async function generarTarjetaHito({icono, cifra, etiqueta, sub, nombre, dorada, lang}){
  const W=1080, H=1920;
  const cv=document.createElement("canvas"); cv.width=W; cv.height=H;
  const x=cv.getContext("2d");
  const F=(w,s)=>`${w} ${s}px 'Nunito','Segoe UI Emoji',sans-serif`;

  // Fondo verde GBH + halos
  const bg=x.createLinearGradient(0,0,0,H);
  bg.addColorStop(0,"#0d2b12"); bg.addColorStop(0.55,"#14301b"); bg.addColorStop(1,"#0a2313");
  x.fillStyle=bg; x.fillRect(0,0,W,H);
  x.globalAlpha=0.08; x.fillStyle=dorada?"#FFC800":"#58CC02";
  x.beginPath();x.arc(W-60,220,320,0,7);x.fill();
  x.beginPath();x.arc(40,H-260,380,0,7);x.fill();
  x.globalAlpha=1;

  // Marca
  x.textAlign="center";
  x.fillStyle="#c9a84c"; x.font=F(900,38);
  x.fillText("🌱 G B H   N U T R I C I Ó N", W/2, 170);
  if(nombre){
    x.fillStyle="rgba(250,253,246,0.75)"; x.font=F(800,40);
    x.fillText(nombre, W/2, 246);
  }

  // Anillo decorativo tras el bloque central
  x.strokeStyle=dorada?"rgba(255,200,0,0.25)":"rgba(88,204,2,0.22)";
  x.lineWidth=10; x.beginPath(); x.arc(W/2, 780, 330, 0, 7); x.stroke();
  x.strokeStyle=dorada?"rgba(255,200,0,0.10)":"rgba(88,204,2,0.09)";
  x.lineWidth=34; x.beginPath(); x.arc(W/2, 780, 385, 0, 7); x.stroke();

  // Icono + cifra + etiqueta
  x.font=F(900,190); x.fillText(icono, W/2, 660);
  x.fillStyle=dorada?"#FFC800":"#fafdf6"; x.font=F(900,210);
  x.fillText(cifra, W/2, 900);
  x.fillStyle="#fafdf6"; x.font=F(900,64);
  x.fillText(etiqueta, W/2, 1010);

  // Subtítulo
  if(sub){
    x.fillStyle="rgba(250,253,246,0.7)"; x.font=F(700,42);
    const palabras=sub.split(" "); let linea="", ly=1300;
    for(const p of palabras){
      const test=linea?linea+" "+p:p;
      if(x.measureText(test).width>W-220){ x.fillText(linea,W/2,ly); linea=p; ly+=60; }
      else linea=test;
    }
    if(linea) x.fillText(linea,W/2,ly);
  }

  // Pie de marca
  x.fillStyle="rgba(201,168,76,0.9)"; x.font=F(800,36);
  x.fillText(lang==='en'?"Track yours at":"Consigue el tuyo en", W/2, H-210);
  x.fillStyle="#fafdf6"; x.font=F(900,44);
  x.fillText("gbh-app.vercel.app", W/2, H-146);

  const dataUrl=cv.toDataURL("image/png");
  const blob=await new Promise(res=>cv.toBlob(res,"image/png"));
  return {dataUrl, blob};
}

// ─── Tarjeta "Tu metabolismo esta semana" (TDEE · solo premium) ──────────────
// Datos: plan_json.seguimiento, calculados por el nutricionista en su Excel de
// seguimiento (TDEE adaptativo real, no una fórmula genérica). Convierte ese
// trabajo semanal invisible en valor visible — nadie a este precio lo ofrece
// con un humano detrás.
function TarjetaMetabolismo({seg,lang}){
  if(!seg?.tdee) return null;
  const es=lang!=='en';
  const nf=v=>Math.round(v).toLocaleString(es?'es-ES':'en-US');
  const d=seg.deficit;
  const esDef=d!=null&&d<0;
  const ret=seg.retencion_kg;
  return(
    <div style={{background:'rgba(255,255,255,0.04)',border:'2px solid rgba(255,200,0,0.35)',
      borderRadius:20,padding:'20px',marginTop:14,boxShadow:'0 4px 0 rgba(0,0,0,0.3)'}}>
      <div style={{fontSize:10,color:T.au1,textTransform:'uppercase',letterSpacing:'0.1em',
        fontWeight:900,marginBottom:12,fontFamily:"'DM Sans',sans-serif"}}>
        📊 {es?'Tu metabolismo':'Your metabolism'}{seg.semana?` · ${es?'semana':'week'} ${seg.semana}`:''}
      </div>
      <div style={{textAlign:'center',marginBottom:14}}>
        <div style={{fontSize:34,fontWeight:900,color:T.t1,fontFamily:"'Nunito',sans-serif",lineHeight:1}}>
          ≈ {nf(seg.tdee)} <span style={{fontSize:16,color:T.t2}}>kcal/{es?'día':'day'}</span>
        </div>
        <div style={{fontSize:11.5,color:T.t2,fontFamily:"'DM Sans',sans-serif",marginTop:4}}>
          {es?'tu gasto energético real estimado (TDEE)':'your estimated real energy expenditure (TDEE)'}
        </div>
      </div>
      <div style={{display:'flex',gap:10,marginBottom:ret!=null&&Math.abs(ret)>=0.3?12:4}}>
        <div style={{flex:1,background:'rgba(255,255,255,0.05)',borderRadius:12,padding:'10px 12px',textAlign:'center'}}>
          <div style={{fontSize:10,color:T.t2,fontFamily:"'DM Sans',sans-serif",marginBottom:2}}>{es?'Tu pauta':'Your target'}</div>
          <div style={{fontSize:16,fontWeight:900,color:T.t1,fontFamily:"'Nunito',sans-serif"}}>{seg.kcal_pautadas?nf(seg.kcal_pautadas):'—'} kcal</div>
        </div>
        <div style={{flex:1,background:esDef?'rgba(88,204,2,0.10)':'rgba(100,181,246,0.10)',borderRadius:12,padding:'10px 12px',textAlign:'center'}}>
          <div style={{fontSize:10,color:T.t2,fontFamily:"'DM Sans',sans-serif",marginBottom:2}}>{d!=null?(esDef?(es?'Déficit diario':'Daily deficit'):(es?'Superávit diario':'Daily surplus')):(es?'Ajuste':'Adjustment')}</div>
          <div style={{fontSize:16,fontWeight:900,color:esDef?T.g2:'#64B5F6',fontFamily:"'Nunito',sans-serif"}}>{d!=null?`${d>0?'+':'−'}${nf(Math.abs(d))} kcal`:'—'}</div>
        </div>
      </div>
      {ret!=null&&Math.abs(ret)>=0.3&&(
        <div style={{fontSize:11.5,color:T.t2,fontFamily:"'DM Sans',sans-serif",lineHeight:1.55,
          background:'rgba(100,181,246,0.08)',border:'1px solid rgba(100,181,246,0.25)',
          borderRadius:12,padding:'10px 12px',marginBottom:4}}>
          💧 {es
            ?`≈ ${String(ret).replace('.',',')} kg de retención hídrica estimada esta semana — tu avance real puede ir por delante de lo que marca la báscula.`
            :`≈ ${ret} kg of estimated water retention this week — your real progress may be ahead of what the scale shows.`}
        </div>
      )}
      <div style={{fontSize:9.5,color:T.t3,fontFamily:"'DM Sans',sans-serif",marginTop:8,textAlign:'center'}}>
        {es?'Calculado por tu nutricionista con tus mediciones de seguimiento':'Calculated by your nutritionist from your tracking measurements'}
      </div>
    </div>
  );
}

function WeightChart({chartData,setWeightMode,goalWeight,shareName,lang}){
  const t=useLang();
  // ── Tarjeta compartible: modal con la imagen generada {dataUrl, blob} ──
  const [shareCard,setShareCard]=React.useState(null);
  const [genBusy,setGenBusy]=React.useState(false);
  const abrirTarjeta=async()=>{
    if(genBusy) return;
    setGenBusy(true);
    try{ setShareCard(await generarTarjetaProgreso({nombre:shareName,chartData,goalWeight,lang})); }
    catch(e){ console.warn("[tarjeta]",e); }
    finally{ setGenBusy(false); }
  };
  const compartirTarjeta=async()=>{
    if(!shareCard) return;
    try{
      const file=new File([shareCard.blob],"gbh-progreso.png",{type:"image/png"});
      if(navigator.canShare&&navigator.canShare({files:[file]})){
        await navigator.share({files:[file]});
        return;
      }
    }catch(e){ /* cancelado o no soportado → descarga */ }
    descargarTarjeta();
  };
  const descargarTarjeta=()=>{
    if(!shareCard) return;
    const a=document.createElement("a");
    a.href=shareCard.dataUrl; a.download="gbh-progreso.png";
    document.body.appendChild(a); a.click(); a.remove();
  };
  // Estado "objetivo alcanzado" para dorar el botón (mismo criterio que la barra)
  const _fin=chartData[chartData.length-1];
  const _reached=goalWeight!=null&&_fin&&Math.abs(_fin.weight-goalWeight)<=0.5;
  if(!chartData.length)return null;
  const f=chartData[0].weight,l=chartData[chartData.length-1].weight,diff=l-f,down=diff<0;
  return(
    <Card>
      <div style={{display:"flex",alignItems:"center",justifyContent:"space-between",marginBottom:12}}>
        <div style={{fontSize:11,color:T.au1,textTransform:"uppercase",letterSpacing:"0.1em",fontWeight:900}}>{t("chartTitle")}</div>
        <div style={{display:"flex",gap:10,flexWrap:"wrap",justifyContent:"flex-end"}}>
          <div style={{fontSize:10,color:T.t2,fontFamily:"'DM Sans',sans-serif",display:"flex",alignItems:"center",gap:4}}><div style={{width:12,height:3,background:T.au1,borderRadius:2}}/> {t("chartReal")}</div>
          <div style={{fontSize:10,color:T.t2,fontFamily:"'DM Sans',sans-serif",display:"flex",alignItems:"center",gap:4}}><div style={{width:12,height:2,background:T.xp,borderRadius:2}}/> {t("chartTrend")}</div>
          {goalWeight&&<div style={{fontSize:10,color:"#FF6B9D",fontFamily:"'DM Sans',sans-serif",display:"flex",alignItems:"center",gap:4}}><div style={{width:12,height:2,background:"#FF6B9D",borderRadius:2,borderTop:"2px dashed #FF6B9D"}}/> {t("chartGoalLabel")}</div>}
        </div>
      </div>
      <ResponsiveContainer width="100%" height={200}>
        <ComposedChart data={chartData} margin={{top:5,right:5,left:-22,bottom:0}}>
          <XAxis dataKey="date" tickFormatter={d=>d.slice(5)} tick={{fontSize:9,fill:T.t2}} tickLine={false} axisLine={false}/>
          <YAxis domain={goalWeight?[d=>{const mn=Math.min(...chartData.map(x=>x.weight||99),goalWeight)-2;return Math.floor(mn);},"auto"]:(["auto","auto"])} tick={{fontSize:9,fill:T.t2}} tickLine={false} axisLine={false}/>
          <Tooltip content={<CTip/>}/>
          {goalWeight&&<Line type="monotone" dataKey={()=>goalWeight} stroke="#FF6B9D" strokeWidth={2} strokeDasharray="6 4" dot={false} name={t("chartGoalLabel")}/>}
          <Line type="monotone" dataKey="weight" stroke={T.au1} strokeWidth={2.5} dot={{r:4.5,fill:T.au1,strokeWidth:0}} activeDot={{r:7,fill:T.au2}}/>
          <Line type="monotone" dataKey="ma" stroke={T.xp} strokeWidth={2} strokeDasharray="5 3" dot={false}/>
        </ComposedChart>
      </ResponsiveContainer>
      {chartData.length>=2&&(()=>{
        const initialEntry=chartData.find(d=>d.isInitial)||chartData[0];
        const lastEntry=chartData[chartData.length-1];
        const totalDiff=lastEntry.weight-initialEntry.weight;
        const lost=totalDiff<0,gained=totalDiff>0;
        return(
          <>
            <div style={{marginTop:12,padding:"11px 16px",background:"rgba(255,255,255,0.05)",borderRadius:14,display:"flex",justifyContent:"space-between",alignItems:"center"}}>
              <span style={{fontSize:12,color:T.t2,fontFamily:"'DM Sans',sans-serif"}}>{t("chartTotalChange",{n:chartData.length})}</span>
              <span style={{fontWeight:900,fontSize:18,color:down?T.g1:T.red}}>{down?"↓":"↑"} {Math.abs(diff).toFixed(1)} kg</span>
            </div>
            <div style={{marginTop:14,padding:"20px 18px",background:"rgba(255,255,255,0.05)",borderRadius:18,border:`2px solid rgba(255,255,255,0.1)`,textAlign:"center"}}>
              <div style={{fontSize:11,color:T.t2,fontFamily:"'DM Sans',sans-serif",textTransform:"uppercase",letterSpacing:"0.1em",marginBottom:8}}>
                {t("chartInitialWeight",{d:initialEntry.date.slice(5).replace("-","/")})}
              </div>
              <div style={{fontSize:42,fontWeight:900,lineHeight:1,color:T.t1}}>{lost?"🪶":"💪🏼"}</div>
              <div style={{fontSize:36,fontWeight:900,color:T.wh,marginTop:6,fontFamily:"'Nunito',sans-serif",lineHeight:1}}>
                {Math.abs(totalDiff).toFixed(1)} kg
              </div>
              <div style={{fontSize:16,fontWeight:800,color:T.t2,marginTop:6,fontFamily:"'DM Sans',sans-serif"}}>
                {lost?t("chartLost"):gained?t("chartGained"):t("chartNoChange")}
              </div>
              <div style={{fontSize:11,color:T.t2,marginTop:10,fontFamily:"'DM Sans',sans-serif"}}>
                {initialEntry.weight} kg → {lastEntry.weight} kg
              </div>
            </div>
            {goalWeight&&(()=>{
              const toGoal=lastEntry.weight-goalWeight;
              const totalNeeded=initialEntry.weight-goalWeight;
              const pct=totalNeeded===0?100:Math.min(100,Math.max(0,Math.round((1-(toGoal/totalNeeded))*100)));
              const reached=Math.abs(toGoal)<=0.5;
              const losing=totalNeeded>0;
              return(
                <div style={{marginTop:12,padding:"16px 18px",background:reached?"rgba(88,204,2,0.12)":"rgba(255,107,157,0.08)",borderRadius:18,border:`2px solid ${reached?T.g1:"rgba(255,107,157,0.3)"}`}}>
                  <div style={{display:"flex",justifyContent:"space-between",alignItems:"center",marginBottom:10}}>
                    <div style={{fontSize:12,fontWeight:900,color:reached?T.g1:"#FF6B9D"}}>
                      {reached?t("chartGoalReached"):t("chartGoalSection")}
                    </div>
                    <div style={{fontSize:12,color:T.t2,fontFamily:"'DM Sans',sans-serif"}}>
                      {t("chartGoalTarget",{n:goalWeight})}
                    </div>
                  </div>
                  <div style={{background:"rgba(255,255,255,0.08)",borderRadius:10,height:10,overflow:"hidden",marginBottom:10}}>
                    <div style={{height:"100%",width:`${pct}%`,borderRadius:10,background:reached?`linear-gradient(90deg,${T.g1},${T.g2})`:"linear-gradient(90deg,#FF6B9D,#FF4081)",transition:"width 0.8s ease",boxShadow:reached?`0 0 8px ${T.g1}60`:"0 0 8px #FF6B9D60"}}/>
                  </div>
                  <div style={{display:"flex",justifyContent:"space-between",alignItems:"center"}}>
                    <div style={{fontSize:11,color:T.t2,fontFamily:"'DM Sans',sans-serif"}}>
                      {reached?t("chartGoalUpdate"):losing?t("chartGoalRemaining",{n:Math.abs(toGoal).toFixed(1)}):t("chartGoalExcess",{n:Math.abs(toGoal).toFixed(1)})}
                    </div>
                    <div style={{fontSize:14,fontWeight:900,color:reached?T.g1:"#FF6B9D"}}>{pct}%</div>
                  </div>
                </div>
              );
            })()}
            {/* ── Compartir progreso: botón único, discreto; dorado y brillante
                   cuando el objetivo está alcanzado (hito que merece compartirse) ── */}
            <button onClick={abrirTarjeta} style={{
              width:"100%",marginTop:12,padding:"14px 18px",borderRadius:18,cursor:"pointer",
              display:"flex",alignItems:"center",justifyContent:"center",gap:10,
              background:_reached?`linear-gradient(135deg,${T.au1},${T.au2})`:"rgba(255,255,255,0.05)",
              border:_reached?`2px solid ${T.au1}`:"2px solid rgba(255,255,255,0.14)",
              color:_reached?"#1A1000":T.t1,fontWeight:900,fontSize:14,
              fontFamily:"'Nunito',sans-serif",
              boxShadow:_reached?`0 5px 0 ${T.au3}`:"0 4px 0 rgba(0,0,0,0.3)",
              animation:_reached?"glow 2.5s ease-in-out infinite":"none"}}>
              <span style={{fontSize:20}}>🖼️</span>
              {genBusy
                ?(lang==='en'?'Creating card…':'Creando tarjeta…')
                :_reached
                  ?(lang==='en'?'Goal reached — share it!':'¡Objetivo alcanzado — compártelo!')
                  :(lang==='en'?'Share my progress':'Compartir mi progreso')}
            </button>
            {/* Modal de previsualización de la tarjeta */}
            {shareCard&&(
              <div onClick={()=>setShareCard(null)} style={{position:"fixed",inset:0,background:"rgba(0,0,0,0.8)",zIndex:2000,display:"flex",flexDirection:"column",alignItems:"center",justifyContent:"center",padding:"20px 16px"}}>
                <div onClick={e=>e.stopPropagation()} style={{width:"100%",maxWidth:380,display:"flex",flexDirection:"column",gap:12}}>
                  <img src={shareCard.dataUrl} alt="" style={{width:"100%",borderRadius:20,border:"2px solid rgba(255,255,255,0.2)",boxShadow:"0 12px 40px rgba(0,0,0,0.6)",animation:"popIn 0.2s ease"}}/>
                  <div style={{display:"flex",gap:10}}>
                    <button onClick={compartirTarjeta} style={{flex:1,padding:"14px",borderRadius:16,border:"none",cursor:"pointer",background:`linear-gradient(135deg,${T.g1},${T.g2})`,color:"#fff",fontWeight:900,fontSize:14,fontFamily:"'Nunito',sans-serif",boxShadow:`0 4px 0 ${T.g3}`}}>
                      📤 {lang==='en'?'Share':'Compartir'}
                    </button>
                    <button onClick={descargarTarjeta} style={{flex:1,padding:"14px",borderRadius:16,cursor:"pointer",background:"rgba(255,255,255,0.10)",border:"2px solid rgba(255,255,255,0.2)",color:T.t1,fontWeight:900,fontSize:14,fontFamily:"'Nunito',sans-serif"}}>
                      📥 {lang==='en'?'Download':'Descargar'}
                    </button>
                  </div>
                  <button onClick={()=>setShareCard(null)} style={{padding:"10px",borderRadius:14,background:"none",border:"none",color:"rgba(255,255,255,0.6)",fontWeight:800,fontSize:13,cursor:"pointer",fontFamily:"'Nunito',sans-serif"}}>✕ {lang==='en'?'Close':'Cerrar'}</button>
                </div>
              </div>
            )}
          </>
        );
      })()}
    </Card>
  );
}


// ─── UserAvatar — icono genérico o foto personalizada ────────────────────────
function UserAvatar({size=52, photoB64, initials, borderColor, onClick, frame=null}){
  const r = size * 0.22;
  const fr = frame && FRAMES[frame];
  const wrapStyle = fr ? {
    border: fr.border,
    boxShadow: fr.boxShadow,
    // Legend gets an animated gradient border effect via outline
    outline: fr.css==="legend" ? "2px solid #FF6600" : "none",
    outlineOffset:"2px",
  } : {
    border:`2.5px solid ${borderColor||T.au1}`,
    boxShadow:`0 4px 0 ${T.au3}`,
  };

  if(photoB64) return(
    <div onClick={onClick} style={{
      width:size, height:size, borderRadius:size*0.33,
      ...wrapStyle,
      overflow:"hidden", cursor:"pointer", flexShrink:0,
      transition:"box-shadow 0.3s",
    }}>
      <img src={photoB64} alt="avatar"
        style={{width:"100%",height:"100%",objectFit:"cover",objectPosition:"center top"}}/>
    </div>
  );

  // Icono genérico SVG con iniciales
  const letter = (initials||"?")[0].toUpperCase();
  return(
    <div onClick={onClick} style={{
      width:size, height:size, borderRadius:size*0.33,
      ...wrapStyle,
      background:`linear-gradient(135deg,#2A5A2A,#1A3A10)`,
      cursor:"pointer", flexShrink:0, position:"relative", overflow:"hidden",
      transition:"box-shadow 0.3s",
    }}>
      <svg viewBox="0 0 52 52" width={size} height={size} style={{display:"block"}}>
        {/* Silueta cuerpo */}
        <circle cx="26" cy="20" r="10" fill="rgba(255,255,255,0.18)"/>
        <ellipse cx="26" cy="44" rx="16" ry="12" fill="rgba(255,255,255,0.12)"/>
        {/* Inicial */}
        <text x="26" y="25" textAnchor="middle" dominantBaseline="middle"
          fontSize={size*0.38} fontWeight="900" fill="rgba(255,255,255,0.9)"
          fontFamily="'Nunito',sans-serif">{letter}</text>
      </svg>
      {/* Cámara hint — pequeño icono en esquina */}
      <div style={{
        position:"absolute", bottom:2, right:2,
        width:size*0.3, height:size*0.3,
        borderRadius:"50%",
        background:"rgba(88,204,2,0.9)",
        display:"flex", alignItems:"center", justifyContent:"center",
        fontSize:size*0.15,
      }}>📷</div>
    </div>
  );
}

// ─── ProfileCardModal — tarjeta de perfil del paciente ──────────────────────
function ProfileCardModal({onClose, onGoHome, profile, userPhoto, onSavePhoto, onSaveProfile, weights, lv, xp, streak, badges, onSubscribeNotifications, lang, setLang, onDeleteAccount}){
  const t=useLang();
  const [photo,       setPhoto]      = useState(userPhoto||null);
  const [editField,   setEditField]  = useState(null);
  const [editVal,     setEditVal]    = useState("");
  const [showDelConf, setShowDelConf]= useState(false);
  const [delInput,    setDelInput]   = useState("");
  const [editingHeight, setEditingHeight] = useState(false);
  const [heightEdit,    setHeightEdit]    = useState(profile?.height_cm||170);
  const [portalLoading, setPortalLoading] = useState(false);
  const fileRef = useRef(null);

  const onFile = (e) => {
    const file = e.target.files?.[0];
    if(!file) return;
    if(file.size > 5*1024*1024){ alert("Máximo 5MB"); return; }
    const reader = new FileReader();
    reader.onload = (ev) => { setPhoto(ev.target.result); onSavePhoto(ev.target.result); };
    reader.readAsDataURL(file);
  };

  const startEdit = (field, current) => { setEditField(field); setEditVal(String(current||"")); };
  const saveEdit  = () => { if(editField) onSaveProfile(editField, editVal); setEditField(null); };

  const initW = weights.find(w=>w.isInitial)?.weight ?? profile?.initial_weight ?? "—";
  const lastW = weights.filter(w=>!w.isInitial).slice(-1)[0]?.weight ?? "—";

  const DataRow = ({label, value, field}) => {
    // El email no es editable si la cuenta ya está vinculada a Supabase Auth
    const isLocked = field==="email" && !!profile?.auth_id;
    return(
    <div style={{display:"flex",alignItems:"center",justifyContent:"space-between",padding:"12px 0",borderBottom:"1px solid rgba(255,255,255,0.07)"}}>
      <div style={{flex:1,minWidth:0}}>
        <div style={{fontSize:10,color:T.t2,textTransform:"uppercase",letterSpacing:"0.08em",fontFamily:"'DM Sans',sans-serif",marginBottom:3}}>{label}</div>
        {editField===field?(
          <input autoFocus value={editVal} onChange={e=>setEditVal(e.target.value)}
            onKeyDown={e=>{if(e.key==="Enter")saveEdit();if(e.key==="Escape")setEditField(null);}}
            type={field==="weight"||field==="goal"?"number":"text"}
            step={field==="weight"||field==="goal"?"0.1":undefined}
            style={{background:"rgba(255,255,255,0.1)",border:`1.5px solid ${T.g1}`,borderRadius:10,padding:"6px 10px",color:T.wh,fontSize:15,fontWeight:700,fontFamily:"'DM Sans',sans-serif",width:"90%",outline:"none"}}
          />
        ):(
          <div style={{fontSize:16,fontWeight:800,color:isLocked?T.t2:T.wh,fontFamily:"'DM Sans',sans-serif",overflow:"hidden",textOverflow:"ellipsis",whiteSpace:"nowrap"}}>
            {value}{(field==="weight"||field==="goal")&&value!=="—"?" kg":""}
          </div>
        )}
      </div>
      <div style={{marginLeft:12,flexShrink:0}}>
        {isLocked?(
          <span style={{fontSize:16,opacity:0.35}} title={lang==="en"?"Email linked to your account":"Email vinculado a tu cuenta"}>🔒</span>
        ):editField===field?(
          <button onClick={saveEdit} style={{background:T.g1,border:"none",borderRadius:10,padding:"7px 14px",color:"white",fontWeight:900,fontSize:13,cursor:"pointer",fontFamily:"'Nunito',sans-serif"}}>✓</button>
        ):(
          <button onClick={()=>startEdit(field, value)} style={{background:"rgba(255,255,255,0.08)",border:"1.5px solid rgba(255,255,255,0.14)",borderRadius:10,padding:"7px 10px",color:T.t2,fontSize:16,cursor:"pointer",lineHeight:1}}>✏️</button>
        )}
      </div>
    </div>
    );
  };

  return(
    <div style={{position:"fixed",inset:0,zIndex:11000,background:"rgba(0,0,0,0.88)",backdropFilter:"blur(8px)",display:"flex",alignItems:"center",justifyContent:"center",padding:20,overflowY:"auto"}} onClick={onClose}>
      <div style={{background:`linear-gradient(180deg,#1E4A20,${T.bgWood} 55%)`,borderRadius:32,width:"100%",maxWidth:340,border:`2px solid ${T.bW}`,boxShadow:"0 24px 70px rgba(0,0,0,0.85)",animation:"popIn 0.35s cubic-bezier(0.34,1.56,0.64,1)",overflow:"hidden"}} onClick={e=>e.stopPropagation()}>

        {/* ── Cabecera ── */}
        <div style={{padding:"28px 24px 18px",textAlign:"center",position:"relative"}}>
          <button onClick={onClose} style={{position:"absolute",top:14,right:14,width:32,height:32,borderRadius:"50%",background:"rgba(0,0,0,0.3)",border:"none",color:"rgba(255,255,255,0.6)",fontSize:16,cursor:"pointer",display:"flex",alignItems:"center",justifyContent:"center"}}>✕</button>
          <button onClick={onGoHome} style={{position:"absolute",top:14,left:14,height:32,borderRadius:12,background:"rgba(0,0,0,0.25)",border:"1px solid rgba(255,255,255,0.12)",color:"rgba(255,255,255,0.5)",fontSize:12,fontWeight:700,cursor:"pointer",padding:"0 10px",fontFamily:"'Nunito',sans-serif"}}>← {lang==="en"?"Home":"Inicio"}</button>

          {/* Foto + botón 📷 */}
          <div style={{position:"relative",display:"inline-block",marginBottom:14}}>
            <div style={{width:100,height:100,borderRadius:28,overflow:"hidden",border:`3px solid ${T.au1}`,boxShadow:`0 6px 0 ${T.au3}`,cursor:"pointer"}} onClick={()=>fileRef.current?.click()}>
              {photo?(
                <img src={photo} alt="avatar" style={{width:"100%",height:"100%",objectFit:"cover",objectPosition:"center top"}}/>
              ):(
                <div style={{width:"100%",height:"100%",background:"linear-gradient(135deg,#2A5A2A,#1A3A10)",display:"flex",alignItems:"center",justifyContent:"center"}}>
                  <span style={{fontSize:42,fontWeight:900,color:"rgba(255,255,255,0.85)",fontFamily:"'Nunito',sans-serif"}}>{(profile?.name||"?")[0].toUpperCase()}</span>
                </div>
              )}
            </div>
            <button onClick={()=>fileRef.current?.click()} style={{position:"absolute",bottom:-4,right:-4,width:32,height:32,borderRadius:"50%",background:T.g1,border:`2px solid #081208`,cursor:"pointer",fontSize:15,display:"flex",alignItems:"center",justifyContent:"center",boxShadow:`0 3px 0 ${T.g3}`}}>📷</button>
            <input ref={fileRef} type="file" accept="image/*" onChange={onFile} style={{display:"none"}}/>
          </div>

          <div style={{fontSize:22,fontWeight:900,color:T.wh,marginBottom:2}}>{profile?.name?.split(" ")[0]||"—"}</div>
          <div style={{display:"flex",alignItems:"center",justifyContent:"center",gap:8}}>
            <span style={{fontSize:12,color:T.au1,fontWeight:800}}>{translateLvName(lv.n,lang)}</span>
            <span style={{fontSize:12,color:T.t2}}>·</span>
            <span style={{fontSize:12,color:T.t2,fontFamily:"'DM Sans',sans-serif"}}>{lang==="en"?"Level":"Nivel"} {lv.l}</span>
          </div>
        </div>

        {/* ── Stats ── */}
        {(()=>{
          const wDiff = initW!=="—" && lastW!=="—" ? (parseFloat(lastW)-parseFloat(initW)) : null;
          const wLabel = wDiff===null ? "—" : `${wDiff>=0?"+":""}${wDiff.toFixed(1)} kg`;
          return(
            <div style={{display:"flex",justifyContent:"space-around",padding:"12px 20px",borderTop:"1px solid rgba(255,255,255,0.08)",borderBottom:"1px solid rgba(255,255,255,0.08)"}}>
              {[{icon:"🔥",value:streak,label:t("streakLabel")},{icon:"⚡",value:xp,label:"XP"},{icon:"⚖️",value:wLabel,label:t("progressLabel")}].map(({icon,value,label})=>(
                <div key={label} style={{textAlign:"center"}}>
                  <div style={{fontSize:18}}>{icon}</div>
                  <div style={{fontSize:wLabel.length>4&&label===t("progressLabel")?14:20,fontWeight:900,color:T.wh,lineHeight:1.1}}>{value}</div>
                  <div style={{fontSize:9,color:T.t2,textTransform:"uppercase",letterSpacing:"0.07em",fontFamily:"'DM Sans',sans-serif"}}>{label}</div>
                </div>
              ))}
            </div>
          );
        })()}

        {/* ── Datos editables ── */}
        <div style={{padding:"0 22px 24px"}}>
          <div style={{fontSize:10,color:T.au1,textTransform:"uppercase",letterSpacing:"0.1em",fontWeight:900,padding:"14px 0 4px"}}>
            {lang==="en"?"My data":"Mis datos"}
          </div>
          <DataRow label={t("profileFullName")} value={profile?.name||"—"} field="name"/>
          <DataRow label={t("profileEmail")}    value={profile?.email||"—"} field="email"/>
          {/* ── Estatura / Height ── */}
          <div style={{borderBottom:"1px solid rgba(255,255,255,0.07)",padding:"12px 0"}}>
            <div style={{display:"flex",alignItems:"center",justifyContent:"space-between",marginBottom:editingHeight?8:0}}>
              <div style={{fontSize:10,color:T.t2,textTransform:"uppercase",letterSpacing:"0.08em",fontFamily:"'DM Sans',sans-serif"}}>
                📏 {t("profileHeight")}
              </div>
              {!editingHeight&&(
                <div style={{display:"flex",alignItems:"center",gap:10}}>
                  <span style={{fontSize:18,fontWeight:900,color:T.wh,fontFamily:"'DM Sans',sans-serif"}}>
                    {profile?.height_cm?`${profile.height_cm} cm`:"— cm"}
                  </span>
                  <button onClick={()=>{setHeightEdit(profile?.height_cm||170);setEditingHeight(true);}} style={{background:"rgba(255,255,255,0.08)",border:"1.5px solid rgba(255,255,255,0.14)",borderRadius:10,padding:"7px 10px",color:T.t2,fontSize:16,cursor:"pointer",lineHeight:1}}>✏️</button>
                </div>
              )}
            </div>
            {editingHeight&&(
              <div>
                <div style={{display:"flex",justifyContent:"space-between",alignItems:"baseline",marginBottom:2}}>
                  <span style={{fontSize:11,color:T.t2,fontFamily:"'DM Sans',sans-serif"}}>{lang==="en"?"Slide to adjust":"Desliza para ajustar"}</span>
                  <div style={{display:"flex",alignItems:"baseline",gap:3}}>
                    <span style={{fontSize:30,fontWeight:900,color:T.g2,lineHeight:1}}>{heightEdit}</span>
                    <span style={{fontSize:13,color:T.t2,fontWeight:700}}>cm</span>
                  </div>
                </div>
                <input
                  type="range"
                  className="gbh-slider-sm"
                  min={140} max={220} step={1}
                  value={heightEdit}
                  onChange={e=>setHeightEdit(Number(e.target.value))}
                />
                <div style={{display:"flex",justifyContent:"space-between",marginBottom:8}}>
                  <span style={{fontSize:9,color:T.t3,fontFamily:"'DM Sans',sans-serif"}}>140cm</span>
                  <span style={{fontSize:9,color:T.t3,fontFamily:"'DM Sans',sans-serif"}}>220cm</span>
                </div>
                <div style={{display:"flex",gap:8}}>
                  <button onClick={()=>{onSaveProfile("height",heightEdit);setEditingHeight(false);}} style={{flex:1,background:T.g1,border:"none",borderRadius:10,padding:"8px 0",color:"white",fontWeight:900,fontSize:13,cursor:"pointer",fontFamily:"'Nunito',sans-serif"}}>✓ {lang==="en"?"Save":"Guardar"}</button>
                  <button onClick={()=>setEditingHeight(false)} style={{background:"rgba(255,255,255,0.08)",border:"1.5px solid rgba(255,255,255,0.14)",borderRadius:10,padding:"8px 14px",color:T.t2,fontSize:13,cursor:"pointer",fontFamily:"'Nunito',sans-serif"}}>✕</button>
                </div>
              </div>
            )}
          </div>
          <DataRow label={t("profileInitialWeight")} value={initW} field="weight"/>
          {/* Selector de idioma */}
          <div style={{display:"flex",alignItems:"center",justifyContent:"space-between",padding:"12px 0",borderBottom:"1px solid rgba(255,255,255,0.07)"}}>
            <div style={{fontSize:10,color:T.t2,textTransform:"uppercase",letterSpacing:"0.08em",fontFamily:"'DM Sans',sans-serif"}}>{t("langLabel")}</div>
            <div style={{display:"flex",gap:6}}>
              {[{code:"es",flag:"🇪🇸"},{code:"en",flag:"🇬🇧"}].map(({code,flag})=>(
                <button key={code} onClick={()=>setLang(code)}
                  style={{fontSize:22,background:lang===code?`rgba(88,204,2,0.2)`:"rgba(255,255,255,0.06)",
                    border:`2px solid ${lang===code?T.g1:"rgba(255,255,255,0.1)"}`,
                    borderRadius:10,padding:"4px 8px",cursor:"pointer",
                    boxShadow:lang===code?`0 2px 0 ${T.g3}`:"none",transition:"all 0.15s"}}>
                  {flag}
                </button>
              ))}
            </div>
          </div>
          {/* ── Suscripción (Stripe) ── */}
          <div style={{padding:"12px 0",borderBottom:"1px solid rgba(255,255,255,0.07)"}}>
            <div style={{display:"flex",alignItems:"center",justifyContent:"space-between",gap:10}}>
              <div style={{minWidth:0}}>
                <div style={{fontSize:10,color:T.t2,textTransform:"uppercase",letterSpacing:"0.08em",fontFamily:"'DM Sans',sans-serif",marginBottom:3}}>
                  {lang==="en"?"Subscription":"Suscripción"}
                </div>
                <div style={{fontSize:14,fontWeight:800,color:T.wh,fontFamily:"'DM Sans',sans-serif"}}>
                  {profile?.plan==="premium" ? "💎 Premium"
                    : profile?.plan==="standard"
                      ? (profile?.trial_ends_at ? (lang==="en"?"🌱 Free week":"🌱 Semana de prueba") : (lang==="en"?"⭐ Standard":"⭐ Estándar"))
                      : (lang==="en"?"🌱 Free":"🌱 Gratis")}
                </div>
                {profile?.plan==="premium"&&(
                  <div style={{fontSize:10,color:T.t3,fontFamily:"'DM Sans',sans-serif",marginTop:2}}>
                    {lang==="en"?"Managed by your nutritionist":"Gestionado por tu nutricionista"}
                  </div>
                )}
              </div>
              {profile?.plan==="premium" ? null
                : (profile?.plan==="standard" && !profile?.trial_ends_at && profile?.plan_until) ? (
                <button disabled={portalLoading}
                  onClick={async()=>{
                    setPortalLoading(true);
                    const ok = await abrirPortalStripe(profile?.id);
                    setPortalLoading(false);
                    if(!ok) alert(lang==="en"?"Couldn't open the subscription portal. Please try again.":"No se pudo abrir el portal de suscripción. Inténtalo de nuevo.");
                  }}
                  style={{background:"rgba(255,255,255,0.08)",border:"1.5px solid rgba(255,255,255,0.18)",
                    borderRadius:10,padding:"8px 12px",color:T.t1,fontWeight:800,fontSize:12,
                    cursor:portalLoading?"wait":"pointer",fontFamily:"'Nunito',sans-serif",flexShrink:0,
                    opacity:portalLoading?0.6:1}}>
                  {portalLoading ? "⏳" : (lang==="en"?"Manage":"Gestionar")}
                </button>
              ) : (
                <button onClick={()=>abrirCheckoutStripe(profile?.id)}
                  style={{background:`linear-gradient(135deg,${T.g1},${T.g2})`,border:"none",
                    borderRadius:10,padding:"8px 12px",color:"#fff",fontWeight:900,fontSize:12,
                    cursor:"pointer",boxShadow:`0 2px 0 ${T.g3}`,fontFamily:"'Nunito',sans-serif",flexShrink:0}}>
                  {lang==="en"?"Subscribe · €7/mo":"Suscribirme · 7 €/mes"}
                </button>
              )}
            </div>
          </div>
          {/* Notificaciones */}
          <div style={{display:"flex",alignItems:"center",justifyContent:"space-between",padding:"12px 0",borderBottom:"1px solid rgba(255,255,255,0.07)"}}>
            <div>
              <div style={{fontSize:10,color:T.t2,textTransform:"uppercase",letterSpacing:"0.08em",fontFamily:"'DM Sans',sans-serif",marginBottom:3}}>
                {lang==="en"?"Reminders":"Recordatorios"}
              </div>
              <div style={{fontSize:14,fontWeight:800,color:T.wh,fontFamily:"'DM Sans',sans-serif"}}>
                {typeof Notification!=="undefined"&&Notification.permission==="granted"
                  ? (lang==="en"?"🔔 Enabled":"🔔 Activados")
                  : (lang==="en"?"🔕 Disabled":"🔕 Desactivados")}
              </div>
            </div>
            {typeof Notification!=="undefined"&&Notification.permission!=="granted"&&(
              <button onClick={onSubscribeNotifications||subscribeNotifications} style={{
                background:"rgba(100,130,255,0.15)",border:"1.5px solid rgba(100,130,255,0.4)",
                borderRadius:10,padding:"7px 12px",color:"rgba(150,170,255,0.9)",
                fontWeight:800,fontSize:12,cursor:"pointer",fontFamily:"'Nunito',sans-serif"}}>
                {lang==="en"?"Enable":"Activar"}
              </button>
            )}
          </div>

          {lastW!=="—"&&String(lastW)!==String(initW)&&(
            <div style={{display:"flex",justifyContent:"space-between",alignItems:"center",padding:"12px 0"}}>
              <div>
                <div style={{fontSize:10,color:T.t2,textTransform:"uppercase",letterSpacing:"0.08em",fontFamily:"'DM Sans',sans-serif",marginBottom:3}}>
                  {lang==="en"?"Last recorded weight":"Ultimo peso registrado"}
                </div>
                <div style={{fontSize:16,fontWeight:800,color:T.wh,fontFamily:"'DM Sans',sans-serif"}}>{lastW} kg</div>
              </div>
            </div>
          )}

          {/* ── Eliminar cuenta ── */}
          <div style={{marginTop:20,paddingTop:16,borderTop:"1px solid rgba(255,75,75,0.2)"}}>
            {!showDelConf?(
              <button
                onClick={()=>{setShowDelConf(true);setDelInput("");}}
                style={{
                  width:"100%",padding:"12px",borderRadius:14,
                  background:"rgba(255,75,75,0.07)",
                  border:"1.5px solid rgba(255,75,75,0.25)",
                  color:"rgba(255,120,120,0.85)",fontSize:13,fontWeight:800,
                  cursor:"pointer",fontFamily:"'Nunito',sans-serif",
                  transition:"all 0.2s",
                }}>
                🗑️ {lang==="en"?"Delete my account":"Eliminar mi cuenta"}
              </button>
            ):(
              <div style={{
                background:"rgba(255,75,75,0.1)",
                border:"1.5px solid rgba(255,75,75,0.35)",
                borderRadius:16,padding:"16px 14px",
              }}>
                <div style={{fontSize:13,fontWeight:900,color:"#FF8080",marginBottom:6,textAlign:"center"}}>
                  ⚠️ {lang==="en"?"Permanently delete account":"Eliminar cuenta permanentemente"}
                </div>
                <div style={{fontSize:11,color:"rgba(255,180,180,0.8)",fontFamily:"'DM Sans',sans-serif",
                  marginBottom:14,textAlign:"center",lineHeight:1.5}}>
                  {lang==="en"
                    ?<>All your data will be deleted: diet, weight, achievements and gems.<br/><b style={{color:"#FF8080"}}>This action cannot be undone.</b></>
                    :<>Se borrarán todos tus datos: dieta, peso, logros y gemas.<br/><b style={{color:"#FF8080"}}>Esta acción no se puede deshacer.</b></>}
                </div>
                <div style={{fontSize:11,color:T.t2,fontFamily:"'DM Sans',sans-serif",marginBottom:8}}>
                  {lang==="en"?<>Type <b style={{color:"#FF8080",letterSpacing:"0.05em"}}>DELETE DATA</b> to confirm:</>:<>Escribe <b style={{color:"#FF8080",letterSpacing:"0.05em"}}>BORRAR DATOS</b> para confirmar:</>}
                </div>
                <input
                  autoFocus
                  value={delInput}
                  onChange={e=>setDelInput(e.target.value)}
                  placeholder={lang==="en"?"DELETE DATA":"BORRAR DATOS"}
                  style={{
                    width:"100%",background:"rgba(255,255,255,0.07)",
                    border:`1.5px solid ${(lang==="en"?delInput==="DELETE DATA":delInput==="BORRAR DATOS")?"rgba(255,75,75,0.7)":"rgba(255,255,255,0.15)"}`,
                    borderRadius:10,padding:"10px 12px",color:"#FF8080",
                    fontSize:14,fontWeight:700,fontFamily:"'DM Sans',sans-serif",
                    marginBottom:12,outline:"none",letterSpacing:"0.05em",
                  }}
                />
                <div style={{display:"flex",gap:8}}>
                  <button
                    onClick={()=>{setShowDelConf(false);setDelInput("");}}
                    style={{flex:1,padding:"11px",borderRadius:12,
                      background:"rgba(255,255,255,0.08)",border:"1.5px solid rgba(255,255,255,0.14)",
                      color:T.t2,fontWeight:800,fontSize:13,cursor:"pointer",
                      fontFamily:"'Nunito',sans-serif"}}>
                    {lang==="en"?"Cancel":"Cancelar"}
                  </button>
                  <button
                    onClick={()=>{ const ok=lang==="en"?delInput==="DELETE DATA":delInput==="BORRAR DATOS"; if(ok) onDeleteAccount(); }}
                    disabled={lang==="en"?delInput!=="DELETE DATA":delInput!=="BORRAR DATOS"}
                    style={{flex:1,padding:"11px",borderRadius:12,
                      background:(lang==="en"?delInput==="DELETE DATA":delInput==="BORRAR DATOS")?"rgba(255,75,75,0.9)":"rgba(255,75,75,0.15)",
                      border:`1.5px solid ${(lang==="en"?delInput==="DELETE DATA":delInput==="BORRAR DATOS")?"rgba(255,100,100,0.8)":"rgba(255,75,75,0.2)"}`,
                      color:(lang==="en"?delInput==="DELETE DATA":delInput==="BORRAR DATOS")?"white":"rgba(255,120,120,0.4)",
                      fontWeight:900,fontSize:13,
                      cursor:(lang==="en"?delInput==="DELETE DATA":delInput==="BORRAR DATOS")?"pointer":"not-allowed",
                      fontFamily:"'Nunito',sans-serif",
                      transition:"all 0.2s",
                    }}>
                    🗑️ {lang==="en"?"Delete":"Borrar"}
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

// ═══════════════════════════════════════════════════════════════════════════════
// MAIN APP
// ═══════════════════════════════════════════════════════════════════════════════
// ─── SavedRecipeCard — tarjeta expandible del recetario personal ─────────────
// ─── Mini lista de la compra por receta (botón 🛒 Comprar) ────────────────────
// Popup con los ingredientes de UNA receta como checklist interactiva. Los
// marcados se guardan SOLO en el dispositivo (localStorage, clave por receta),
// deliberadamente sin Supabase: es un dato personal de compra y ahorra carga.
// Al reabrir la receta recuerda lo tachado; "Regenerar" limpia para recomprar.
function MiniListaCompra({nombre, ingredientes, idReceta, t, onClose}){
  const items=React.useMemo(()=>(ingredientes||"").split(/[,;](?![^(]*\))/).map(s=>s.trim()).filter(Boolean),[ingredientes]);
  const key=`gbh:minilista:${idReceta||nombre}`;
  const [checks,setChecks]=React.useState(()=>lsGet(key,{}));
  const [conf,setConf]=React.useState(false);
  const marc=items.filter((_,i)=>checks[i]).length;
  const toggle=(i)=>setChecks(c=>{const n={...c};if(n[i])delete n[i];else n[i]=true;lsSet(key,n);return n;});
  const regen=()=>{ if(!conf){setConf(true);return;} setChecks({});lsSet(key,{});setConf(false); };
  return(
    <div onClick={onClose} style={{position:"fixed",inset:0,background:"rgba(0,0,0,0.72)",zIndex:2000,display:"flex",alignItems:"flex-end",justifyContent:"center"}}>
      <div onClick={e=>e.stopPropagation()} style={{width:"100%",maxWidth:520,maxHeight:"80vh",overflowY:"auto",
        background:"linear-gradient(180deg,#1d3a14,#142a0e)",border:"2px solid rgba(255,255,255,0.14)",borderBottom:"none",
        borderRadius:"22px 22px 0 0",padding:"18px 18px 26px",animation:"popIn 0.2s ease"}}>
        <div style={{display:"flex",alignItems:"flex-start",gap:10,marginBottom:4}}>
          <span style={{fontSize:24,flexShrink:0}}>🛒</span>
          <div style={{flex:1,minWidth:0}}>
            <div style={{fontWeight:900,fontSize:15,color:T.wh,lineHeight:1.25,fontFamily:"'Nunito',sans-serif"}}>{nombre}</div>
            <div style={{fontSize:11,color:T.t3,fontFamily:"'DM Sans',sans-serif",marginTop:3}}>{t("buyListSub")}</div>
          </div>
          <button onClick={onClose} style={{background:"rgba(255,255,255,0.10)",border:"none",borderRadius:14,width:32,height:32,color:T.t2,fontSize:14,cursor:"pointer",fontWeight:900,flexShrink:0}}>✕</button>
        </div>
        <div style={{height:7,background:"rgba(255,255,255,0.08)",borderRadius:6,margin:"10px 0 14px",overflow:"hidden"}}>
          <div style={{height:"100%",width:`${items.length?Math.round(marc/items.length*100):0}%`,background:`linear-gradient(90deg,${T.g3},${T.g1})`,borderRadius:6,transition:"width 0.25s"}}/>
        </div>
        <div style={{display:"flex",flexDirection:"column",gap:6}}>
          {items.map((it,i)=>{
            const on=!!checks[i];
            return(
              <button key={i} onClick={()=>toggle(i)} style={{
                display:"flex",alignItems:"center",gap:11,textAlign:"left",cursor:"pointer",
                background:on?"rgba(88,204,2,0.08)":"rgba(255,255,255,0.05)",
                border:`1.5px solid ${on?"rgba(88,204,2,0.35)":"rgba(255,255,255,0.12)"}`,
                borderRadius:13,padding:"10px 13px",transition:"all 0.15s"}}>
                <span style={{width:21,height:21,flexShrink:0,borderRadius:7,display:"flex",alignItems:"center",justifyContent:"center",
                  background:on?T.g1:"transparent",border:`2px solid ${on?T.g1:"rgba(255,255,255,0.3)"}`,
                  color:"#0d2b12",fontSize:13,fontWeight:900,transition:"all 0.15s"}}>{on?"✓":""}</span>
                <span style={{flex:1,fontSize:13,fontFamily:"'DM Sans',sans-serif",lineHeight:1.4,
                  color:on?T.t3:T.t1,textDecoration:on?"line-through":"none",textDecorationThickness:"2px",
                  opacity:on?0.65:1,transition:"all 0.15s"}}>{it}</span>
              </button>
            );
          })}
        </div>
        <button onClick={regen} style={{
          width:"100%",marginTop:14,padding:"12px 18px",borderRadius:14,cursor:"pointer",
          background:conf?"rgba(255,140,60,0.18)":"rgba(255,255,255,0.06)",
          border:`2px solid ${conf?"#FF8C3C":"rgba(255,255,255,0.15)"}`,
          color:conf?"#FF8C3C":T.t2,fontWeight:900,fontSize:13,fontFamily:"'Nunito',sans-serif",transition:"all 0.15s"}}>
          {conf?t("listConfirm"):t("listReset")}
        </button>
      </div>
    </div>
  );
}

function SavedRecipeCard({rec, t, T, removeFromBook}){
  const [expanded, setExpanded] = React.useState(false);
  const [showCompra, setShowCompra] = React.useState(false);  // popup 🛒 de esta receta
  const tipoColor = {
    Carne:"#E57373",Pescado:"#64B5F6",Vegetariana:"#81C784",
    Vegana:"#A5D6A7",Postre:"#F06292",Ensalada:"#AED581","Sopa/Crema":"#FFB74D",
    Meat:"#E57373",Fish:"#64B5F6",Vegetarian:"#81C784",
    Vegan:"#A5D6A7",Dessert:"#F06292",Salad:"#AED581","Soup/Cream":"#FFB74D",
  };
  const tipoIcon = {
    Carne:"🥩",Pescado:"🐟",Vegetariana:"🥦",Vegana:"🌱",
    Postre:"🍰",Ensalada:"🥗","Sopa/Crema":"🍲",
    Meat:"🥩",Fish:"🐟",Vegetarian:"🥦",Vegan:"🌱",
    Dessert:"🍰",Salad:"🥗","Soup/Cream":"🍲",
  };
  const tc  = tipoColor[rec.tipo] || T.g1;
  const ti  = emojiPlato(rec.nombre, rec.tipo);
  const ing = rec.ingredientes?.split(/[,;](?![^(]*\))/).map(s=>s.trim()).filter(Boolean) || [];

  return(
    <Card style={{padding:"16px 16px"}}>
      {/* Cabecera compacta */}
      <div style={{display:"flex",alignItems:"center",gap:12,cursor:"pointer"}}
        onClick={()=>setExpanded(e=>!e)}>
        <div style={{fontSize:32,flexShrink:0}}>{ti}</div>
        <div style={{flex:1,minWidth:0}}>
          <div style={{fontSize:14,fontWeight:900,color:T.wh,lineHeight:1.2,marginBottom:4}}>{rec.nombre}</div>
          <div style={{display:"flex",gap:6,flexWrap:"wrap",alignItems:"center"}}>
            <div style={{background:`${tc}22`,border:`1px solid ${tc}55`,borderRadius:20,padding:"2px 10px",fontSize:10,fontWeight:900,color:tc,textTransform:"uppercase",letterSpacing:"0.08em"}}>{rec.tipo}</div>
            <div style={{fontSize:11,color:T.au1,fontWeight:700}}>{rec.calorias} kcal</div>
            <div style={{fontSize:11,color:T.t3,fontFamily:"'DM Sans',sans-serif"}}>P:{rec.proteinas_g}g · H:{rec.hidratos_g}g · G:{rec.grasas_g}g</div>
          </div>
        </div>
        <div style={{fontSize:18,color:T.t2,flexShrink:0,transform:expanded?"rotate(180deg)":"none",transition:"transform 0.2s"}}>▾</div>
      </div>

      {/* Detalle expandido */}
      {expanded&&(
        <div style={{marginTop:14,borderTop:"1px solid rgba(255,255,255,0.08)",paddingTop:14}}>
          <div style={{fontSize:11,color:T.au1,fontWeight:900,textTransform:"uppercase",letterSpacing:"0.1em",marginBottom:8}}>{t("ingredients")}</div>
          <div style={{display:"flex",flexDirection:"column",gap:5,marginBottom:14}}>
            {ing.map((item,i)=>(
              <div key={i} style={{display:"flex",alignItems:"flex-start",gap:8}}>
                <div style={{width:5,height:5,borderRadius:"50%",background:tc,flexShrink:0,marginTop:6}}/>
                <div style={{fontSize:12,color:T.t1,fontFamily:"'DM Sans',sans-serif",lineHeight:1.4}}>{item}</div>
              </div>
            ))}
          </div>
          <div style={{fontSize:11,color:T.au1,fontWeight:900,textTransform:"uppercase",letterSpacing:"0.1em",marginBottom:8}}>{t("preparation")}</div>
          <div style={{fontSize:12,color:T.t1,fontFamily:"'DM Sans',sans-serif",lineHeight:1.6,marginBottom:14,whiteSpace:"pre-wrap"}}>{rec.instrucciones}</div>
          {ing.length>0&&(<button onClick={()=>setShowCompra(true)} style={{
            width:"100%",padding:"10px",borderRadius:12,marginBottom:8,
            background:"rgba(255,140,60,0.10)",border:"1.5px solid rgba(255,140,60,0.35)",
            color:"#FF8C3C",fontSize:12.5,fontWeight:900,
            cursor:"pointer",fontFamily:"'Nunito',sans-serif",
          }}>{t("buyBtn")}</button>)}
          {removeFromBook && (<button onClick={()=>removeFromBook(rec.recipe_id)} style={{
            width:"100%",padding:"9px",borderRadius:12,
            background:"rgba(255,75,75,0.07)",border:"1.5px solid rgba(255,75,75,0.2)",
            color:"rgba(255,120,120,0.8)",fontSize:12,fontWeight:800,
            cursor:"pointer",fontFamily:"'Nunito',sans-serif",
          }}>🗑️ {t("recipeDeleteFromBook")}</button>)}
        </div>
      )}
      {showCompra&&<MiniListaCompra nombre={rec.nombre} ingredientes={rec.ingredientes}
        idReceta={rec.id_receta||rec.recipe_id} t={t} onClose={()=>setShowCompra(false)}/>}
    </Card>
  );
}

function GBHApp(){
  // Inicialización síncrona: si hay sesión guardada → "loading" (nunca "auth" en frío)
  const [screen,  setScreen]  = useState(()=>{
    try{
      const em = getLastEmail();
      if(!em) return "landing";
      const lid = lsGet(`gbh:em:${em}`,null);
      if(!lid) return "landing";
      const lp = lsGet(`gbh:p:${lid}`,null);
      return lp?.id ? "loading" : "landing";
    }catch{ return "landing"; }
  });
  const [tab,     setTab]     = useState("home");
  const [lang,    setLang]    = useState(()=>lsGet("gbh:lang","es"));
  const [muted,   setMuted]   = useState(()=>lsGet("gbh:mute",false));
  const sfx = (name,...args) => { if(!muted) SFX[name]?.(...args); };
  const [profile, setProfile] = useState(null);
  const [tLog,    setTLog]    = useState({diet:false,steps:false,hydration:false,sleep:false});
  const [steps,   setSteps]   = useState(0);
  const [weights, setWeights] = useState([]);
  const [badges,  setBadges]  = useState([]);
  const [logs,    setLogs]    = useState([]);
  const [allP,    setAllP]    = useState([]);
  const [logsAdmin, setLogsAdmin] = useState({});  // {profileId:{hoyMeals, nota, notaFecha}} para el panel
  // ── Desglose de la dieta por tomas: mapa {Toma:{dia:true}} del plan vigente ──
  // Se usa en Inicio para pintar los mini-botones por comida. null → sin plan
  // publicado (o cuenta free) → se mantiene el botón clásico de dieta.
  const [planTomas, setPlanTomas] = useState(null);
  const [wInput,  setWInput]  = useState("");
  const [weightMode, setWeightMode] = useState("default");
  const [userPhoto,  setUserPhoto]  = useState(()=>lsGet("gbh:userPhoto",null));
  const [showPhotoPicker,  setShowPhotoPicker]  = useState(false);
  const [ranking, setRanking] = useState([]);
  const [rankLoading, setRankLoading] = useState(false);
  const [rankTab,      setRankTab]      = useState(0);
  const [showQuiz,     setShowQuiz]     = useState(false);
  const [quizDone,     setQuizDone]     = useState(()=>{
    try{
      const em=getLastEmail(); if(!em) return false;
      const id=lsGet(`gbh:em:${em}`,null); if(!id) return false;
      return lsGet(`gbh:quiz:${id}:${toKey()}`,false);
    }catch{return false;}
  });
  const [quizBannerDismissed, setQuizBannerDismissed] = useState(()=>{
    try{
      const em=getLastEmail(); if(!em) return false;
      const id=lsGet(`gbh:em:${em}`,null); if(!id) return false;
      return lsGet(`gbh:quizBanner:${id}:${toKey()}`,false);
    }catch{return false;}
  });
  const [showChest,    setShowChest]    = useState(false);
  const [showWeekChest, setShowWeekChest] = useState(false);
  const [showRuleta,    setShowRuleta]    = useState(false);
  const [showChallenges,   setShowChallenges]   = useState(false);
  const [notifPermission, setNotifPermission] = useState(()=>lsGet("gbh:notifAsked",false));
  const [showNotifBanner, setShowNotifBanner] = useState(false);
  const [claimedChallenges, setClaimedChallenges] = useState(()=>{
    const {w,y}=getISOWeek(); return lsGet(`gbh:challenges:${y}:${w}`,[]);
  });
  const [ruletaDone,    setRuletaDone]    = useState(()=>{
    try{
      const em=getLastEmail(); if(!em) return false;
      const id=lsGet(`gbh:em:${em}`,null); if(!id) return false;
      return lsGet(`gbh:ruleta:${id}:${toKey()}`,false);
    }catch{return false;}
  });
  const [ruletaAutoShown,setRuletaAutoShown]=useState(()=>{
    try{
      const em=getLastEmail(); if(!em) return false;
      const id=lsGet(`gbh:em:${em}`,null); if(!id) return false;
      return lsGet(`gbh:ruletaSeen:${id}:${toKey()}`,false);
    }catch{return false;}
  });
  const [chestOpened,  setChestOpened]  = useState(()=>{
    // El cofre se abre una vez por cada múltiplo de 7 — guardamos el último streak abierto
    return lsGet("gbh:chestLastOpened",0);
  }); // 0=racha 1=xp 2=peso
  const [weightBannerDismissed, setWeightBannerDismissed] = useState(false);
  const [pwaPrompt,    setPwaPrompt]    = useState(null);
  const [pwaDismissed, setPwaDismissed] = useState(()=>{
    // Pausa de 14 días en vez de descarte permanente: quien cierra el banner en su
    // primera semana es justo quien instala en la tercera. (true legado = caducado)
    const v = lsGet("gbh:pwaDismissed", false);
    if(typeof v === "number") return (Date.now() - v) < 14*24*60*60*1000;
    return false;
  });
  const [pwaInstalled, setPwaInstalled] = useState(()=>{try{return window.matchMedia("(display-mode: standalone)").matches||window.navigator.standalone===true;}catch{return false;}});
  // Flag: viene de Instagram via redirect → mostrar modal PWA prominente al cargar
  const [showInstallModal, setShowInstallModal] = useState(()=>{
    try{
      const params = new URLSearchParams(window.location.search);
      if(params.get("install")==="1"){
        // Limpiar el parámetro de la URL sin recargar
        const clean = window.location.pathname + window.location.hash;
        window.history.replaceState(null,"",clean);
        // Solo si no está ya instalada
        if(window.matchMedia("(display-mode: standalone)").matches||window.navigator.standalone===true) return false;
        return true;
      }
    }catch{}
    return false;
  });
  const [showOfflineBanner,  setShowOfflineBanner]  = useState(false);
  const [showSyncBanner,     setShowSyncBanner]     = useState(false);
  const offlineTimerRef = useRef(null);
  const syncTimerRef    = useRef(null); // "default" | "input" | "chart"
  const [toast,   setToast]   = useState(null);
  const [confetti,setConfetti]= useState(false);
  const [loading, setLoading] = useState(false);
  const [taps,    setTaps]    = useState(0);
  // ── Acceso al panel de administración: 5 toques + PIN ─────────────────────
  const [pinGate, setPinGate] = useState(false);   // pantalla del PIN abierta
  const [pinVal,  setPinVal]  = useState("");      // dígitos introducidos
  const [pinErr,  setPinErr]  = useState(false);   // último intento fallido
  const [filtroAdmin, setFiltroAdmin] = useState('todos');   // todos|premium|normal
  const [planAdmin, setPlanAdmin] = useState({});  // {profile_id: plan} para las insignias 💎/⭐
  const [aName,    setAName]    = useState("");
  const [aEmail,   setAEmail]   = useState("");
  const [aWeight,  setAWeight]  = useState("");
  const [aGoal,    setAGoal]    = useState("");
  const [aRef,     setARef]     = useState("");   // código de invitación (opcional)
  const [aHeight,  setAHeight]  = useState(170);
  const [aSex,     setASex]     = useState("M");
  const [aPrivacy, setAPrivacy] = useState(false);
  const [authMode,setAuthMode]= useState("new"); // "new" | "returning" | "migrate" | "checking"
  const [authErr, setAuthErr] = useState("");
  const [authDbg, setAuthDbg] = useState([]); // debug visible en pantalla
  const [aPassword,   setAPassword]   = useState("");
  const [aPasswordC,  setAPasswordC]  = useState(""); // confirm (solo registro nuevo)
  const [showPass,    setShowPass]    = useState(false);
  const [forgotSent,  setForgotSent]  = useState(false);
  const [dailyRecipe,setDailyRecipe] = useState(null);
  const [savedRecipes,setSavedRecipes] = useState([]);
  const [recipeView, setRecipeView]  = useState("menu"); // "menu" | "daily" | "book" | "completo"
  const [completoCat,     setCompletoCat]     = useState(null);   // categoría elegida en recetario completo
  const [completoRecipes, setCompletoRecipes] = useState([]);
  const [completoLoading, setCompletoLoading] = useState(false);
  const completoCacheRef = React.useRef({});
  const [recCounts, setRecCounts] = useState(null);   // {total, byId:{catId:n}} — nº de recetas por categoría
  const recCountsRef = React.useRef(false);
  // ── Buscador por ingrediente (recetario completo) ──
  const [busqTexto,   setBusqTexto]   = useState("");   // texto escrito en el buscador
  const [busqResults, setBusqResults] = useState(null); // null = sin búsqueda activa
  const [busqLoading, setBusqLoading] = useState(false);
  const todasRecetasRef = React.useRef(null);           // caché en memoria de todo el recetario
  const todasRecetasPromiseRef = React.useRef(null);    // descarga en curso: evita fetch duplicados en paralelo
  const busqSeqRef      = React.useRef(0);              // token de búsqueda: descarta resultados obsoletos
  const busqTimerRef    = React.useRef(null);           // debounce del tecleo
  const [recipeLoading,setRecipeLoading] = useState(false);
  const refreshingRef = useRef(false); // bloqueo síncrono para evitar doble tap
  const [recipeRefreshes,setRecipeRefreshes] = useState(()=>lsGet(`gbh:recipe:refreshes:${toKey()}`,0));
  const [streakAnim,  setStreakAnim]   = useState(false);
  const [missionsAnim,setMissionsAnim] = useState(false);
  const [floatItems,  setFloatItems]   = useState([]);
  const [levelUpAnim, setLevelUpAnim]  = useState(false);
  const [levelUpNum,  setLevelUpNum]   = useState(1);
  const [levelUpRew,  setLevelUpRew]   = useState(null);
  const [rewardsOpen, setRewardsOpen]  = useState(false);
  const prevLvRef = useRef(null);
  const tapRef=useRef(null);
  const [isOnline, setIsOnline] = useState(navigator.onLine);
  const [pendingSync, setPendingSync] = useState(()=>lsGet(getQueueKey(),[]).length);

  // ── OneSignal Push Notifications ────────────────────────────────────────────
  useEffect(()=>{
    // Inicializar OneSignal cuando el SDK esté disponible
    if(typeof window.OneSignalDeferred === "undefined") return;
    window.OneSignalDeferred.push(async (OneSignal)=>{
      await OneSignal.init({
        appId: "fc697ca2-52eb-4c9e-9301-531d417fe37a",
        safari_web_id: "web.onesignal.auto.6514249a-4cb8-451b-a889-88f5913c9a7f",
        notifyButton: { enable: false }, // No mostrar el botón flotante de OneSignal
        allowLocalhostAsSecureOrigin: true,
        // Usa el service worker propio de la app (que ahora importa el worker de
        // OneSignal) en vez de registrar OneSignalSDKWorker.js aparte. Sin esto,
        // dos workers compiten por el scope "/" y el push no se entrega.
        serviceWorkerPath: "sw.js",
        serviceWorkerParam: { scope: "/" },
      });
    });
  },[]);

  // ── Semana de prueba: degradar a 'free' cuando caduca ──────────────────────
  // Solo afecta a cuentas con trial_ends_at (las de pago lo tienen a NULL).
  const trialDowngradeRef = useRef(false);
  useEffect(()=>{
    if(!profile?.id) return;
    // Si hay plan_until, es cliente de pago: el trial huérfano NO puede degradarla
    if(profile.plan!=="standard" || !profile.trial_ends_at || profile.plan_until) return;
    const fin = Date.parse(profile.trial_ends_at);
    if(isNaN(fin) || fin > Date.now()) return;
    if(trialDowngradeRef.current) return;
    trialDowngradeRef.current = true;
    // Verificación contra el servidor: NUNCA degradar por datos cacheados obsoletos
    (async()=>{ try{
      const rows = await sbReq("GET",`profiles?id=eq.${profile.id}&select=plan,trial_ends_at,plan_until&limit=1`);
      const srv = rows && rows[0];
      if(!srv) return;
      if(srv.plan!=="standard" || !srv.trial_ends_at || srv.plan_until){
        // El servidor manda (p.ej. ya es de pago): sincronizar campos frescos y no tocar nada
        setProfile(p=>{ if(!p) return p; const u={...p, plan:srv.plan, trial_ends_at:srv.trial_ends_at||null, plan_until:srv.plan_until||null}; try{lsSet(`gbh:p:${u.id}`,u);}catch{} return u; });
        return;
      }
      const finSrv = Date.parse(srv.trial_ends_at);
      if(isNaN(finSrv) || finSrv > Date.now()) return;
      const u = {...profile, plan:"free"};
      setProfile(u); lsSet(`gbh:p:${u.id}`, u);
      sbReq("PATCH", `profiles?id=eq.${profile.id}`, { plan:"free" });
      showT&&showT({icon:"🌱",
        title: lang==="en" ? "Your free week has ended" : "Tu semana de prueba ha terminado",
        sub:   lang==="en" ? "Subscribe to keep your weekly plan 💚" : "Suscríbete (7€/mes) para seguir con tu programación 💚"});
    }catch{} })();
  // eslint-disable-next-line react-hooks/exhaustive-deps
  },[profile?.id, profile?.plan, profile?.trial_ends_at]);

  // ── Referidos: completar referral_code en perfiles cacheados ───────────────
  // Los perfiles guardados antes de la migración no traen la columna; se pide
  // una vez y se funde en el perfil local para que aparezca la tarjeta de
  // "Invita a un amigo" sin re-login.
  useEffect(()=>{
    if(!profile?.id || profile.referral_code) return;
    sbReq("GET",`profiles?id=eq.${profile.id}&select=referral_code&limit=1`)
      .then(rows=>{
        const c=rows?.[0]?.referral_code;
        if(c) setProfile(p=>{ const u={...p,referral_code:c}; try{lsSet(`gbh:p:${u.id}`,u);}catch{} return u; });
      })
      .catch(()=>{});
  // eslint-disable-next-line react-hooks/exhaustive-deps
  },[profile?.id, profile?.referral_code]);

  // ── Countdown de trial + aviso proactivo (últimos 2 días) ──────────────────
  // El chip del PlanTab ya informa, pero el aviso de pérdida llegaba tarde
  // (toast al caducar). Esto añade: banner permanente en Inicio durante el
  // trial y un pop-up (1/día) cuando quedan ≤2 días, con lo que el paciente
  // pierde al pasar a free. CTA directo al checkout de Stripe.
  const trialFin = (profile?.plan==="standard" && profile?.trial_ends_at) ? Date.parse(profile.trial_ends_at) : null;
  const trialDiasRest = (trialFin && !isNaN(trialFin) && trialFin>Date.now())
    ? Math.max(1, Math.ceil((trialFin-Date.now())/86400000)) : null;
  const [avisoTrial,setAvisoTrial]=useState(null);   // {dias} | null
  useEffect(()=>{
    if(!profile?.id || !trialDiasRest || trialDiasRest>2) return;
    const k=`gbh:trialaviso:${profile.id}:${toKey()}`;
    if(lsGet(k,false)) return;
    const t=setTimeout(()=>{
      try{
        if(avisoNuevoPlan||avisoRegistro) return;     // reintenta en la próxima apertura
        lsSet(k,true);                                // máx. 1 aviso/día
        setAvisoTrial({dias:trialDiasRest});
      }catch{}
    },1500);
    return ()=>clearTimeout(t);
  // eslint-disable-next-line react-hooks/exhaustive-deps
  },[profile?.id, trialDiasRest]);

  // ── Red de seguridad plan_until: suscripción de pago caducada ──────────────
  // La baja real la hace el webhook (customer.subscription.deleted). Esto solo
  // cubre el caso de que un webhook se pierda: si el periodo pagado lleva >5
  // días vencido (margen para los reintentos de cobro de Stripe), degradar.
  const planUntilDowngradeRef = useRef(false);
  useEffect(()=>{
    if(!profile?.id) return;
    if(profile.plan!=="standard" || profile.trial_ends_at || !profile.plan_until) return;
    const fin = Date.parse(profile.plan_until);
    if(isNaN(fin) || fin + 5*24*60*60*1000 > Date.now()) return;
    if(planUntilDowngradeRef.current) return;
    planUntilDowngradeRef.current = true;
    // Verificación contra el servidor: el webhook puede haber renovado plan_until aunque
    // este dispositivo tenga cacheada una fecha vieja (era la causa del bucle de degradación)
    (async()=>{ try{
      const rows = await sbReq("GET",`profiles?id=eq.${profile.id}&select=plan,trial_ends_at,plan_until&limit=1`);
      const srv = rows && rows[0];
      if(!srv) return;
      const finSrv = srv.plan_until ? Date.parse(srv.plan_until) : NaN;
      const srvVencido = srv.plan==="standard" && !srv.trial_ends_at && srv.plan_until
        && !isNaN(finSrv) && (finSrv + 5*24*60*60*1000) <= Date.now();
      if(!srvVencido){
        // El servidor está al día: sincronizar los campos frescos y no tocar nada
        setProfile(p=>{ if(!p) return p; const u={...p, plan:srv.plan, trial_ends_at:srv.trial_ends_at||null, plan_until:srv.plan_until||null}; try{lsSet(`gbh:p:${u.id}`,u);}catch{} return u; });
        return;
      }
      const u = {...profile, plan:"free", plan_until:srv.plan_until};
      setProfile(u); lsSet(`gbh:p:${u.id}`, u);
      sbReq("PATCH", `profiles?id=eq.${profile.id}`, { plan:"free" });
      showT&&showT({icon:"💳",
        title: lang==="en" ? "Your subscription has expired" : "Tu suscripción ha caducado",
        sub:   lang==="en" ? "Renew (€7/mo) to keep your weekly plan 💚" : "Renueva (7€/mes) para seguir con tu programación 💚"});
    }catch{} })();
  // eslint-disable-next-line react-hooks/exhaustive-deps
  },[profile?.id, profile?.plan, profile?.plan_until]);

  // ── Mantener viva la sesión (el token caduca a la hora) ────────────────────
  useEffect(()=>{
    const comprobar = () => {
      const s = getStoredSession();
      if(s && !sesionValida(s)) refreshSession();
    };
    comprobar(); // al montar
    const onVis = () => { if(!document.hidden) comprobar(); };
    document.addEventListener("visibilitychange", onVis);
    const intervalo = setInterval(comprobar, 20*60*1000);
    return ()=>{ document.removeEventListener("visibilitychange", onVis); clearInterval(intervalo); };
  },[]);

  // ── Service Worker — caché offline + auto-actualización (sin bucles) ───────
  useEffect(()=>{
    if(!("serviceWorker" in navigator)) return;
    // Marca de versión ya cargada en ESTA pestaña (clave: persiste tras el reload)
    const VKEY="gbh:swActiveVersion";
    navigator.serviceWorker.register("/sw.js")
      .then(reg=>{
        // Comprobar actualización al recuperar foco (no al cargar, para no recargar nada más entrar)
        document.addEventListener("visibilitychange",()=>{
          if(!document.hidden) reg.update().catch(()=>{});
        });
        // Cuando hay un SW nuevo instalado y esperando, activarlo
        reg.addEventListener("updatefound",()=>{
          const nw=reg.installing;
          if(!nw) return;
          nw.addEventListener("statechange",()=>{
            if(nw.state==="installed" && navigator.serviceWorker.controller){
              nw.postMessage&&nw.postMessage({type:"SKIP_WAITING"});
            }
          });
        });
      })
      .catch(err=>console.warn("[SW] registro fallido:",err));

    // ÚNICA vía de recarga: cuando el SW anuncia su versión activa.
    // Solo recarga si la versión cambió respecto a la que ya teníamos cargada.
    navigator.serviceWorker.addEventListener("message",(e)=>{
      if(!e.data||e.data.type!=="SW_UPDATED") return;
      const nueva=e.data.version;
      const previa=sessionStorage.getItem(VKEY);
      if(!previa){
        // Primera vez en esta sesión: guardar versión sin recargar
        sessionStorage.setItem(VKEY,nueva);
        return;
      }
      if(previa!==nueva){
        // Versión realmente distinta → recargar UNA vez y guardar la nueva
        sessionStorage.setItem(VKEY,nueva);
        window.location.reload();
      }
    });
  },[]);

  // ── Aviso de nueva programación (premium) ──────────────────────────────────
  // Cuando el nutricionista publica/regenera el plan (upsert en weekly_plans con
  // fecha_gen nueva), el paciente ve un pop-up la primera vez que abre la app.
  // Identidad del plan: semana|fecha_gen. La primera vez que se conoce un plan
  // se guarda en silencio (evita avisar a toda la base en el despliegue inicial).
  const [avisoNuevoPlan,setAvisoNuevoPlan]=useState(null);   // {semana} | null
  // ── Medicación/suplementación del plan vigente (para el recordatorio) ──────
  const [suplPlan,setSuplPlan]=useState(()=>profile?.id?lsGet(`gbh:suplplan:${profile.id}`,null):null);
  // ── Seguimiento (TDEE) del plan vigente → tarjeta premium en Peso ──────────
  const [segPlan,setSegPlan]=useState(()=>profile?.id?lsGet(`gbh:segplan:${profile.id}`,null):null);
  const guardarSeguimiento=(pj)=>{
    try{
      if(!profile?.id) return;
      const s=pj?.seguimiento??null;
      const seg=(s&&typeof s==='object'&&s.tdee)?s:null;
      setSegPlan(seg);
      lsSet(`gbh:segplan:${profile.id}`,seg);
    }catch{}
  };
  const guardarSuplPlan=(pj)=>{
    try{
      if(!profile?.id) return;
      const sup=normSupl(pj);
      if(!sup && profile.plan==='standard'){
        // Standard: los recordatorios los define el propio paciente en su
        // configuración de plan (patient_config.suplementacion, máx. 3).
        // Se leen aquí para alimentar el pop-up de aviso por hora.
        sbReq('GET',`patient_config?profile_id=eq.${profile.id}&select=suplementacion&limit=1`)
          .then(rows=>{
            const row=Array.isArray(rows)?rows[0]:null;
            const arr=row&&Array.isArray(row.suplementacion)?row.suplementacion.slice(0,3):null;
            const own=normSupl({suplementacion:arr});
            setSuplPlan(own);
            lsSet(`gbh:suplplan:${profile.id}`,own);
          }).catch(()=>{});
        return;
      }
      setSuplPlan(sup);
      lsSet(`gbh:suplplan:${profile.id}`,sup);
    }catch{}
  };
  const chkNuevoPlan=(row)=>{
    try{
      if(!row || profile?.plan!=="premium") return;
      const idPlan=`${row.semana??"?"}|${row.fecha_gen??"?"}`;
      const k=`gbh:planvisto:${profile.id}`;
      const visto=lsGet(k,null);
      if(visto===null){ lsSet(k,idPlan); return; }
      if(visto!==idPlan){ lsSet(k,idPlan); setAvisoNuevoPlan({semana:row.semana}); }
    }catch{}
  };
  // ── Cargar las tomas del plan vigente (para el desglose de dieta en Inicio) ──
  // Guarda solo un mapa reducido {Toma:{dia:true}} — ligero para localStorage y
  // suficiente para saber qué comidas tiene el paciente cada día de la semana.
  useEffect(()=>{
    if(!profile?.id) return;
    const esPago = profile.plan==="premium" || profile.plan==="standard";
    if(!esPago){ setPlanTomas(null); return; }
    const cacheKey=`gbh:plantomas:${profile.id}`;
    const cached=lsGet(cacheKey,null);
    if(cached) setPlanTomas(cached);
    const reducir=(pj)=>{
      const m={};
      for(const tm of PLAN_TOMAS){
        const celdas=pj?.[tm]; if(!celdas) continue;
        const dd={};
        for(let d=1;d<=7;d++){ if(celdas[String(d)]?.Nombre_Receta) dd[String(d)]=true; }
        if(Object.keys(dd).length) m[tm]=dd;
      }
      return Object.keys(m).length?m:null;
    };
    sbReq("GET",`weekly_plans?profile_id=eq.${profile.id}&select=plan_json,semana,fecha_gen&order=semana.desc&limit=1`)
      .then(rows=>{
        const row=Array.isArray(rows)&&rows[0];
        chkNuevoPlan(row);
        const pj=row?.plan_json;
        guardarSuplPlan(pj);
        guardarSeguimiento(pj);
        if(!pj) return;
        const red=reducir(pj);
        setPlanTomas(red);
        if(red) lsSet(cacheKey,red); else lsSet(cacheKey,null);
      })
      .catch(()=>{});
  },[profile?.id, profile?.plan]);
  // Al volver a Inicio, refrescar el mapa de tomas como mucho cada 10 min —
  // recoge planes recién generados desde la pestaña Plan sin recargar la app.
  const planTomasTsRef = useRef(0);
  useEffect(()=>{
    if(tab!=="home" || !profile?.id) return;
    if(profile.plan!=="premium" && profile.plan!=="standard") return;
    if(Date.now()-planTomasTsRef.current < 10*60*1000) return;
    planTomasTsRef.current = Date.now();
    sbReq("GET",`weekly_plans?profile_id=eq.${profile.id}&select=plan_json,semana,fecha_gen&order=semana.desc&limit=1`)
      .then(rows=>{
        const row=Array.isArray(rows)&&rows[0];
        chkNuevoPlan(row);
        const pj=row?.plan_json;
        guardarSuplPlan(pj);
        guardarSeguimiento(pj);
        if(!pj) return;
        const m={};
        for(const tm of PLAN_TOMAS){
          const celdas=pj?.[tm]; if(!celdas) continue;
          const dd={};
          for(let d=1;d<=7;d++){ if(celdas[String(d)]?.Nombre_Receta) dd[String(d)]=true; }
          if(Object.keys(dd).length) m[tm]=dd;
        }
        const red=Object.keys(m).length?m:null;
        setPlanTomas(red);
        lsSet(`gbh:plantomas:${profile.id}`,red);
      })
      .catch(()=>{});
  // eslint-disable-next-line react-hooks/exhaustive-deps
  },[tab, profile?.id]);

  // ── Refrescar plan/gems/xp al volver a primer plano ────────────────────────
  //    Si el nutricionista cambia el plan de un paciente mientras tiene la app
  //    abierta, al volver a la app (o cada pocos minutos) se actualiza solo.
  useEffect(()=>{
    if(!profile?.id) return;
    let cancelado=false;
    const refrescar=async()=>{
      if(!navigator.onLine||document.hidden) return;
      try{
        let fresh=await sbReq("GET",`profiles?id=eq.${profile.id}&select=plan,gems,xp,shields,target_kcal,trial_ends_at,plan_until&limit=1`);
        if(fresh===null){ // columna trial_ends_at aún sin migrar → select clásica
          fresh=await sbReq("GET",`profiles?id=eq.${profile.id}&select=plan,gems,xp,shields,target_kcal&limit=1`);
        }
        if(cancelado||!fresh||!fresh.length) return;
        const f=fresh[0];
        setProfile(prev=>{
          if(!prev) return prev;
          // Las columnas de suscripción se aplican de forma AUTORITATIVA: un NULL
          // que llegue de Supabase (p. ej. al promocionar o al pagar) DEBE borrar
          // la fecha cacheada. Con `??` un null nunca sobreescribía la caché, así
          // que un trial_ends_at vencido quedaba pegado y volvía a degradar el
          // plan. La select de respaldo (sin migrar) no trae estas columnas: en
          // ese caso conservamos lo previo.
          const tieneSub = ('trial_ends_at' in f) || ('plan_until' in f);
          const trialNew = tieneSub ? (f.trial_ends_at ?? null) : prev.trial_ends_at;
          const untilNew = tieneSub ? (f.plan_until    ?? null) : prev.plan_until;
          // Solo actualizar si algo cambió, para no re-renderizar de más
          // (incluidas las fechas, para que el NULL remoto se propague en caliente)
          if(prev.plan===f.plan && prev.gems===f.gems && prev.xp===f.xp
             && prev.trial_ends_at===trialNew && prev.plan_until===untilNew) return prev;
          const merged={...prev,
            plan:f.plan??prev.plan, gems:f.gems??prev.gems,
            xp:f.xp??prev.xp, shields:f.shields??prev.shields,
            target_kcal:f.target_kcal??prev.target_kcal,
            trial_ends_at:trialNew,
            plan_until:untilNew};
          lsSet(`gbh:p:${prev.id}`, merged);
          return merged;
        });
      }catch(e){ /* sin conexión */ }
    };
    const onVis=()=>{ if(!document.hidden) refrescar(); };
    document.addEventListener("visibilitychange",onVis);
    // También cada 3 minutos mientras está abierta
    const intervalo=setInterval(refrescar,180000);
    return ()=>{ cancelado=true; document.removeEventListener("visibilitychange",onVis); clearInterval(intervalo); };
  },[profile?.id]);

  // Restaurar datos desde Supabase cuando el perfil carga pero localStorage está vacío
  // (ocurre tras borrar caché o en nuevo dispositivo)
  useEffect(()=>{
    if(!profile?.id) return;
    const localLogs    = lsGet(`gbh:logs:${profile.id}`, []);
    const localWeights = lsGet(`gbh:weights:${profile.id}`, []);
    // Si no hay datos locales, restaurar desde Supabase inmediatamente
    if(localLogs.length === 0 || localWeights.length === 0){
      restoreFromServer(profile.id);
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  },[profile?.id]);
  useEffect(()=>{
    const handler = (e) => { e.preventDefault(); setPwaPrompt(e); };
    window.addEventListener("beforeinstallprompt", handler);
    window.addEventListener("appinstalled", () => { setPwaInstalled(true); setPwaPrompt(null); });
    return () => window.removeEventListener("beforeinstallprompt", handler);
  },[]);

  // ── Detectar conexión y vaciar cola offline ─────────────────────────────────
  useEffect(()=>{
    const onOnline = async () => {
      setIsOnline(true);
      // Ocultar banner offline
      setShowOfflineBanner(false);
      if(offlineTimerRef.current) clearTimeout(offlineTimerRef.current);
      const q = lsGet(getQueueKey(), []);
      if(q.length){
        const ok = await flushQueue();
        setPendingSync(lsGet(getQueueKey(),[]).length);
        setShowSyncBanner(true);
        if(syncTimerRef.current) clearTimeout(syncTimerRef.current);
        syncTimerRef.current = setTimeout(() => setShowSyncBanner(false), 6000);
        if(ok) showT({icon:"📶",title:"Datos sincronizados",sub:`${q.length} acción${q.length>1?"es":""} enviada${q.length>1?"s":""} a la nube ✅`});
      }
    };
    const onOffline = () => {
      setIsOnline(false);
      setShowOfflineBanner(true);
      if(offlineTimerRef.current) clearTimeout(offlineTimerRef.current);
      offlineTimerRef.current = setTimeout(() => setShowOfflineBanner(false), 7000);
    };
    window.addEventListener("online",  onOnline);
    window.addEventListener("offline", onOffline);
    // Flush inmediato al montar si hay cola pendiente
    if(navigator.onLine) flushQueue().then(()=>setPendingSync(lsGet(getQueueKey(),[]).length));
    return ()=>{ window.removeEventListener("online",onOnline); window.removeEventListener("offline",onOffline); };
  // eslint-disable-next-line react-hooks/exhaustive-deps
  },[]);

  // Auto-login: si ya existe sesión guardada, cargar directamente.
  // BLINDADO: si cualquier paso falla (datos locales corruptos, etc.) se va a
  // la landing en lugar de dejar la app colgada en la pantalla de carga.
  useEffect(()=>{
    try{
    const lastEmail = getLastEmail();
    if(!lastEmail){ setScreen(s=>s==="loading"?"landing":s); return; }
    const lid = lsGet(`gbh:em:${lastEmail}`, null);
    if(!lid){ setScreen(s=>s==="loading"?"landing":s); return; }
    const lp = lsGet(`gbh:p:${lid}`, null);
    if(!lp?.id){ setScreen(s=>s==="loading"?"landing":s); return; }

    // Sistema sin contraseñas: si hay perfil local, entrar directo.
    const today = toKey();
    const localLogs    = lsGet(`gbh:logs:${lp.id}`, []);
    const localWeights = lsGet(`gbh:weights:${lp.id}`, []);
    const localBadges  = lsGet(`gbh:badges:${lp.id}`, []);
    setProfile(lp);
    setLogs(localLogs);
    setWeights(localWeights.sort((a,b)=>a.date>b.date?1:-1));
    setBadges(localBadges);
    window.__gbhUID = lp.id;
    const savedTLog = lsGet(`gbh:tlog:${lp.id}:${today}`, null);
    if(savedTLog){ setTLog(savedTLog); setSteps(localLogs.find(x=>x.date===today)?.sc||0); }
    else {
      const t = localLogs.find(x=>x.date===today);
      if(t){ setTLog({diet:!!t.diet,steps:!!t.steps,hydration:!!t.hydration,sleep:!!t.sleep}); setSteps(t.sc||0); }
    }
    setWeightBannerDismissed(false);
    // Restaurar estado quiz y ruleta del día
    setQuizDone(lsGet(`gbh:quiz:${lp.id}:${today}`, false));
    setQuizBannerDismissed(lsGet(`gbh:quizBanner:${lp.id}:${today}`, false));
    setRuletaDone(lsGet(`gbh:ruleta:${lp.id}:${today}`, false));
    setRuletaAutoShown(lsGet(`gbh:ruletaSeen:${lp.id}:${today}`, false));
    setScreen("main");
    // Sincronizar en segundo plano
    setTimeout(()=>{ restoreFromServer(lp.id).catch(()=>{}); }, 2000);
    }catch(err){
      console.warn("[boot] auto-login falló, volviendo a landing:", err);
      setScreen("landing");
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  },[]);

  // Cinturón de seguridad: si por lo que sea seguimos en "loading" tras 6 s
  // (caché vieja del SW, error silencioso…), salir a la landing para que el
  // usuario siempre pueda entrar.
  useEffect(()=>{
    if(screen!=="loading") return;
    const t = setTimeout(()=>{ setScreen(s=>s==="loading"?"landing":s); }, 6000);
    return ()=>clearTimeout(t);
  },[screen]);

  // t() lee directamente del estado lang (no del contexto, que está dentro del return)
  const t = (key, vars={}) => {
    let str = (TRANS[lang]?.[key] ?? TRANS.es[key] ?? key);
    if(Array.isArray(str)) return str;
    for(const [k,v] of Object.entries(vars)) str = str.split(`{${k}}`).join(String(v));
    return str;
  };
  const streak=useMemo(()=>{
    // Intento 1: desde hoy (misión ya completada)
    let s=0;const d=new Date();
    while(logs.find(l=>l.date===toKey(d)&&l.diet)){s++;d.setDate(d.getDate()-1);}
    if(s>0) return s;
    // Intento 2: si hoy no está hecho, empezar desde ayer
    // (la racha no se rompe hasta que pase la medianoche sin completar)
    const d2=new Date();d2.setDate(d2.getDate()-1);
    while(logs.find(l=>l.date===toKey(d2)&&l.diet)){s++;d2.setDate(d2.getDate()-1);}
    return s;
  },[logs,tLog]);
  const xp=profile?.xp??0,gems=profile?.gems??0;
  const lv=getLevel(xp),nextLv=getNextLevel(lv);
  const xpPct=Math.min(((xp-lv.min)/((nextLv?.min||lv.min+1)-lv.min))*100,100);

  // ── Hitos compartibles: detección automática + tarjeta Story ───────────────
  // Al alcanzar un hito de racha (7/14/30/50/100/200/365), de kilos (cada
  // 2,5 kg hacia el objetivo) o el objetivo de peso, se genera la tarjeta y
  // salta el pop-up de celebración con botón de compartir. Cada hito se
  // celebra UNA sola vez (clave por hito). Prioridad: objetivo > kilos > racha.
  const [hitoCard,setHitoCard]=useState(null);   // {dataUrl,blob,titulo} | null
  useEffect(()=>{
    if(!profile?.id) return;
    try{
      if(avisoNuevoPlan||avisoRegistro||avisoSupl||avisoTrial||hitoCard) return;
      const goalW=profile?.goal_weight??null;
      const iniW=weights.find(w=>w.isInitial)?.weight??null;
      const curW=weights.filter(w=>!w.isInitial).slice(-1)[0]?.weight??null;
      // ── Siembra inicial: los hitos ya conseguidos ANTES de esta versión se
      // marcan como vistos SIN pop-up (nada de celebraciones en retrospectiva).
      // Solo se siembra cuando hay datos cargados, para no sembrar en vacío en
      // un dispositivo recién instalado y disparar retro-avisos al llegar los
      // datos remotos. Hasta sembrar, no se detecta nada.
      const initK=`gbh:hitoinit:${profile.id}`;
      if(!lsGet(initK,false)){
        if(!(logs.length>0||weights.length>0)) return;   // espera datos
        [7,14,30,50,100,200,365].forEach(n=>{ if(streak>=n) lsSet(`gbh:hitovisto:${profile.id}:racha:${n}`,true); });
        if(iniW!=null&&curW!=null){
          const perdiendo0=goalW!=null?goalW<iniW:curW<iniW;
          const avance0=perdiendo0?iniW-curW:curW-iniW;
          for(let b=2.5;b<=Math.floor(avance0/2.5)*2.5;b+=2.5)
            lsSet(`gbh:hitovisto:${profile.id}:peso:${b}`,true);
        }
        if(goalW!=null&&curW!=null&&iniW!=null&&Math.abs(curW-goalW)<=0.5&&Math.abs(iniW-goalW)>0.5)
          lsSet(`gbh:hitovisto:${profile.id}:objetivo`,true);
        lsSet(initK,true);
        return;
      }
      const nombre=(profile?.name||"").trim().split(" ")[0]||"";
      const es=lang!=='en';
      const num=v=>String(Math.round(v*10)/10).replace(".",es?",":".");
      let hito=null;
      // 1) Objetivo alcanzado
      if(goalW!=null && curW!=null && iniW!=null && Math.abs(curW-goalW)<=0.5 && Math.abs(iniW-goalW)>0.5){
        const k=`gbh:hitovisto:${profile.id}:objetivo`;
        if(!lsGet(k,false)) hito={k,icono:"🎉",cifra:"100%",dorada:true,
          etiqueta:es?"¡Objetivo alcanzado!":"Goal reached!",
          sub:es?`De ${num(iniW)} kg a ${num(curW)} kg. Lo conseguí 💚`:`From ${num(iniW)} kg to ${num(curW)} kg. I made it 💚`,
          titulo:es?"¡Has alcanzado tu objetivo!":"You reached your goal!"};
      }
      // 2) Kilos hacia el objetivo (bloques de 2,5 kg)
      if(!hito && iniW!=null && curW!=null){
        const perdiendo=goalW!=null?goalW<iniW:curW<iniW;
        const avance=perdiendo?iniW-curW:curW-iniW;
        const bloque=Math.floor(avance/2.5)*2.5;
        if(bloque>=2.5){
          const k=`gbh:hitovisto:${profile.id}:peso:${bloque}`;
          if(!lsGet(k,false)) hito={k,icono:perdiendo?"🪶":"💪🏼",cifra:`−${num(bloque)} kg`.replace("−",perdiendo?"−":"+"),dorada:false,
            etiqueta:es?(perdiendo?"perdidos":"ganados"):(perdiendo?"lost":"gained"),
            sub:es?"Paso a paso, semana a semana, con mi plan de GBH Nutrición":"Step by step, week by week, with my GBH Nutrición plan",
            titulo:es?`¡${num(bloque)} kg ${perdiendo?"menos":"más"}!`:`${num(bloque)} kg ${perdiendo?"down":"up"}!`};
        }
      }
      // 3) Racha — cada hito trae su cofre de gemas (se entrega al celebrar)
      if(!hito && streak>0){
        const HITOS=[365,200,100,50,30,14,7];
        const COFRE={7:10,14:15,30:25,50:40,100:75,200:120,365:250};
        const h=HITOS.find(n=>streak>=n);
        if(h){
          const k=`gbh:hitovisto:${profile.id}:racha:${h}`;
          if(!lsGet(k,false)) hito={k,icono:"🔥",cifra:String(h),dorada:h>=100,gemas:COFRE[h],
            etiqueta:es?"días de racha":"day streak",
            sub:es?"Ni un solo día sin registrar mi plan. Constancia con GBH Nutrición":"Not a single day unlogged. Consistency with GBH Nutrición",
            titulo:es?`¡Racha de ${h} días!`:`${h}-day streak!`};
        }
      }
      if(!hito) return;
      lsSet(hito.k,true);
      generarTarjetaHito({icono:hito.icono,cifra:hito.cifra,etiqueta:hito.etiqueta,
        sub:hito.sub,nombre,dorada:hito.dorada,lang})
        .then(card=>{
          sfx("streakCelebration");
          if(hito.gemas) addXG(0,hito.gemas);          // cofre del hito de racha
          setHitoCard({...card,titulo:hito.titulo,gemas:hito.gemas||null});
        })
        .catch(e=>console.warn("[hito]",e));
    }catch(e){ console.warn("[hito]",e); }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  },[profile?.id, streak, weights]);

  const compartirHito=async()=>{
    if(!hitoCard) return;
    try{
      const file=new File([hitoCard.blob],"gbh-hito.png",{type:"image/png"});
      if(navigator.canShare&&navigator.canShare({files:[file]})){
        await navigator.share({files:[file]}); return;
      }
    }catch(e){ if(e?.name==="AbortError") return; }
    const a=document.createElement("a");
    a.href=hitoCard.dataUrl; a.download="gbh-hito.png"; a.click();
  };
  const allDone=tLog.diet&&tLog.steps&&tLog.hydration&&tLog.sleep;

  // ── Paywall en momento de victoria: primer "día perfecto" del trial ────────
  // La conversión funciona mejor tras una victoria que tras una fricción: la
  // primera vez que un paciente EN TRIAL completa las 4 misiones del día, tras
  // dejar que suene su celebración, se le invita a quedarse. UNA sola vez.
  const [avisoVictoria,setAvisoVictoria]=useState(false);
  useEffect(()=>{
    if(!profile?.id || !allDone || !trialDiasRest) return;
    const k=`gbh:victoria:${profile.id}`;
    if(lsGet(k,false)) return;
    const t=setTimeout(()=>{
      try{
        if(avisoNuevoPlan||avisoRegistro||avisoSupl||avisoTrial||hitoCard) return;
        lsSet(k,true);
        setAvisoVictoria(true);
      }catch{}
    },2600);
    return ()=>clearTimeout(t);
  // eslint-disable-next-line react-hooks/exhaustive-deps
  },[profile?.id, allDone, trialDiasRest]);

  // ── Escudos con consumo REAL + reparación de racha ─────────────────────────
  // El escudo existía (compra 200 💎, cofres) pero nunca se consumía: la racha
  // solo miraba l.diet y la "protección" era decorativa. Ahora, si AYER quedó
  // sin registrar y había racha activa:
  //   1) con escudos → se consume UNO automáticamente, el día queda cubierto
  //      (diet_followed=true) y la racha sigue viva;
  //   2) sin escudos y racha en peligro ≥3 días → pop-up para repararla por
  //      25 💎. Ventana de 48h real: solo se ofrece si el hueco es exactamente
  //      ayer (dos días sin registrar = racha perdida de verdad).
  const RACHA_COSTE_REPARAR=25;
  const [avisoRacha,setAvisoRacha]=useState(null);   // {perdida,fecha} | null
  const repararDia=useCallback((fecha)=>{
    if(!profile?.id) return;
    const key=`gbh:logs:${profile.id}`;
    const arr=lsGet(key,[]);
    const i=arr.findIndex(l=>l.date===fecha);
    const cur=i>=0?arr[i]:{profile_id:profile.id,date:fecha,diet:false,steps:false,hydration:false,sleep:false,sc:0,meals:{},note:""};
    const entry={...cur,diet:true};
    if(i>=0)arr[i]=entry;else arr.push(entry);
    try{lsSet(key,arr);}catch{}
    setLogs(ls=>{const n=[...ls];const j=n.findIndex(l=>l.date===fecha);
      if(j>=0)n[j]={...n[j],diet:true};else n.push(entry);return n;});
    sbReq("POST","daily_logs?on_conflict=profile_id,log_date",{profile_id:profile.id,log_date:fecha,diet_followed:true});
  // eslint-disable-next-line react-hooks/exhaustive-deps
  },[profile?.id]);
  useEffect(()=>{
    if(!profile?.id||!logs.length) return;
    try{
      const d1=new Date();d1.setDate(d1.getDate()-1);
      const d2=new Date();d2.setDate(d2.getDate()-2);
      const ayer=toKey(d1),anteayer=toKey(d2);
      if(logs.find(l=>l.date===ayer&&l.diet)) return;         // ayer cubierto
      if(!logs.find(l=>l.date===anteayer&&l.diet)) return;    // no había racha
      const k=`gbh:rachafix:${profile.id}:${ayer}`;
      if(lsGet(k,false)) return;
      // Longitud de la racha que peligra (hacia atrás desde anteayer)
      let per=0;const dd=new Date(d2);
      while(logs.find(l=>l.date===toKey(dd)&&l.diet)){per++;dd.setDate(dd.getDate()-1);}
      if((profile.shields||0)>0){
        lsSet(k,true);
        const u={...profile,shields:profile.shields-1};
        setProfile(u);lsSet(`gbh:p:${u.id}`,u);
        sbReq("PATCH",`profiles?id=eq.${profile.id}`,{shields:u.shields});
        repararDia(ayer);
        sfx("shield");
        showT({icon:"🛡️",title:lang==='en'?'Shield used!':'¡Escudo usado!',
          sub:lang==='en'?`Your ${per}-day streak is safe`:`Tu racha de ${per} días sigue viva`});
        return;
      }
      if(per<3){ lsSet(k,true); return; }   // rachas cortas: no merece rescate
      if(avisoNuevoPlan||avisoRegistro||avisoSupl||avisoTrial||hitoCard||avisoVictoria) return; // reintenta
      lsSet(k,true);
      setAvisoRacha({perdida:per,fecha:ayer});
    }catch{}
  // eslint-disable-next-line react-hooks/exhaustive-deps
  // ⚠️ NO añadir aquí avisoRegistro/avisoSupl: se declaran más abajo y en el
  // array de deps se evalúan DURANTE el render (TDZ → crash al abrir la app).
  // El guard dentro del callback basta; si un pop-up bloquea, se reintenta al
  // siguiente cambio de logs o en la próxima apertura.
  },[profile?.id, logs]);
  const repararRacha=async()=>{
    if(!avisoRacha) return;
    if((profile?.gems||0)<RACHA_COSTE_REPARAR){
      sfx("error");
      showT({icon:"💎",title:lang==='en'?'Not enough gems':'Gemas insuficientes',
        sub:lang==='en'?`You need ${RACHA_COSTE_REPARAR} 💎`:`Necesitas ${RACHA_COSTE_REPARAR} 💎`});
      return;
    }
    const u={...profile,gems:profile.gems-RACHA_COSTE_REPARAR};
    setProfile(u);lsSet(`gbh:p:${u.id}`,u);
    sbReq("PATCH",`profiles?id=eq.${profile.id}`,{gems:u.gems});
    repararDia(avisoRacha.fecha);
    sfx("streakCelebration");
    showT({icon:"💚",title:lang==='en'?'Streak repaired!':'¡Racha reparada!',
      sub:lang==='en'?`Your ${avisoRacha.perdida}-day streak lives on`:`Tu racha de ${avisoRacha.perdida} días sigue viva`});
    setAvisoRacha(null);
  };
  const expr=getExpr(streak,tLog.diet,allDone,tLog.sleep);
  const boEstado = (expr==="celebrating"||expr==="legend"||expr==="excited"||expr==="happy") ? "feliz"
    : expr==="sleeping" ? "dormida" : expr==="sad" ? "triste" : "normal";
  // ─── 🐑 Bo: estado persistido en profiles + Zona de juego ───
  const [boNombre,setBoNombre]=useState("Bo");
  const [boColor,setBoColor]=useState("blanca");
  const [boEquipados,setBoEquipados]=useState([]);
  const [boPersonalidad,setBoPersonalidad]=useState("normal");
  const [zonaJuego,setZonaJuego]=useState(false);
  const [panelBo,setPanelBo]=useState(false);
  const [partidasRestantes,setPartidasRestantes]=useState(3);
  const [ptsHoy,setPtsHoy]=useState(0);
  const [ptsSemana,setPtsSemana]=useState(0);
  const arrancarJuegoRef=useRef(null);
  const [boBienvenida,setBoBienvenida]=useState(false);
  useEffect(()=>{ if(profile?.id && !localStorage.getItem("gbh_bo_bienvenida")) setBoBienvenida(true); },[profile?.id]);
  const adoptarBo=(n)=>{
    localStorage.setItem("gbh_bo_bienvenida","1");
    setBoBienvenida(false);
    setBoNombre(n);
    setProfile(p=>p?{...p,bo_nombre:n}:p);
    sbReq("PATCH",`profiles?id=eq.${profile.id}`,{bo_nombre:n});
  };
  const boNivel=(getLevel(xp||0)||{}).l||1;
  useEffect(()=>{ if(!profile) return;
    if(profile.bo_nombre) setBoNombre(profile.bo_nombre);
    if(profile.bo_color) setBoColor(profile.bo_color);
    if(profile.bo_equipados) setBoEquipados(Array.isArray(profile.bo_equipados)?profile.bo_equipados:[]);
    if(profile.bo_personalidad) setBoPersonalidad(profile.bo_personalidad);
  },[profile?.bo_nombre,profile?.bo_color,profile?.bo_equipados,profile?.bo_personalidad]);
  const guardarBo=()=>{ if(!profile?.id) return;
    setProfile(p=>p?{...p,bo_nombre:boNombre,bo_color:boColor,bo_equipados:boEquipados,bo_personalidad:boPersonalidad}:p);
    sbReq("PATCH",`profiles?id=eq.${profile.id}`,{bo_nombre:boNombre,bo_color:boColor,bo_equipados:boEquipados,bo_personalidad:boPersonalidad});
  };
  const hoyMadrid=()=>new Date().toLocaleDateString("sv-SE",{timeZone:"Europe/Madrid"});
  const cargarPartidasHoy=async()=>{ if(!profile?.id) return;
    try{
      const rows=await sbReq("GET",`juego_partidas?profile_id=eq.${profile.id}&fecha=eq.${hoyMadrid()}&select=puntos`)||[];
      const arr=Array.isArray(rows)?rows:[];
      setPartidasRestantes(Math.max(0,3-arr.length));
      const hoyPts=arr.reduce((s,r)=>s+(r.puntos||0),0);
      setPtsHoy(hoyPts);
      const sem=await sbReq("GET",`v_ranking_juego_semanal?profile_id=eq.${profile.id}&select=puntos_semana`);
      setPtsSemana(Array.isArray(sem)&&sem[0]?(sem[0].puntos_semana||0):hoyPts);
    }catch{}
  };
  const pagarYJugar=()=>{
    if(partidasRestantes<=0) return;
    const g=profile?.gems||0;
    if(g<1) return;
    setProfile(p=>p?{...p,gems:(p.gems||0)-1}:p);
    sbReq("PATCH",`profiles?id=eq.${profile.id}`,{gems:g-1});
    setPartidasRestantes(r=>Math.max(0,r-1));
    arrancarJuegoRef.current&&arrancarJuegoRef.current();
  };
  const finPartida=async(pts)=>{ if(!profile?.id) return;
    try{
      const res=await sbReq("POST","rpc/registrar_partida_juego",{p_profile_id:profile.id,p_puntos:pts});
      if(res&&res.ok){
        setPtsHoy(res.puntos_hoy||0);
        setPtsSemana(res.puntos_semana||0);
        setPartidasRestantes(res.partidas_restantes!=null?res.partidas_restantes:0);
      }
    }catch{}
  };
  const fn=profile?.name?.split(" ")[0]||"";

  const chartData=useMemo(()=>{
    if(weights.length<2)return weights.map(w=>({...w,ma:w.weight}));
    return weights.map((w,i)=>{const win=weights.slice(Math.max(0,i-3),i+1);return{...w,ma:parseFloat((win.reduce((a,b)=>a+b.weight,0)/win.length).toFixed(2))};});
  },[weights]);


  // ─── Receta diaria — selección determinista por fecha ───────────────────────
  // Carga inicial del día — gratis
  const fetchDailyRecipe = async () => {
    const todayKey = toKey();
    // Prioridad 1: receta cambiada hoy (refresh)
    const current = lsGet(`gbh:recipe:current:${todayKey}`, null);
    if(current){ setDailyRecipe(normalizeRecipe(current)); return; }
    // Prioridad 2: receta del día en caché
    const cached = lsGet(`gbh:recipe:${todayKey}`, null);
    if(cached){
      // Si lang=EN y la receta en caché no está traducida → borrar caché y re-fetch
      if(lang==="en" && !cached._translated){
        lsSet(`gbh:recipe:${todayKey}`, null); // invalidar
      } else {
        setDailyRecipe(normalizeRecipe(cached)); return;
      }
    }
    setRecipeLoading(true);
    try {
      const d = new Date();
      const dayOfYear = Math.floor((d - new Date(d.getFullYear(),0,0)) / 86400000);
      const offset = (dayOfYear * 7 + d.getFullYear()) % 472;
      const r = await sbReq("GET", `recipes?select=*&order=id_receta.asc&limit=1&offset=${offset}`);
      if(r?.length){
        const recipe = await getRecipeForDisplay(r[0]);
        lsSet(`gbh:recipe:${todayKey}`, recipe);
        setDailyRecipe(recipe);
      }
    } catch(e){ console.warn("fetchDailyRecipe:", e); }
    setRecipeLoading(false);
  };

  // Normaliza los campos de la receta (Supabase puede devolver nombre_receta o nombre)
  const normalizeRecipe = (r) => ({
    ...r,
    nombre:      r.nombre       || r.nombre_receta  || r.Nombre_Receta  || "",
    tipo:        r.tipo         || r.Tipo            || "",
    ingredientes:r.ingredientes || r.Ingredientes    || "",
    instrucciones:r.instrucciones||r.Instrucciones   || "",
    calorias:    r.calorias     || r.Calorias_Totales|| r.calorias_totales || 0,
    proteinas_g: r.proteinas_g  || r.Proteinas_g     || 0,
    hidratos_g:  r.hidratos_g   || r.Hidratos_g      || 0,
    grasas_g:    r.grasas_g     || r.Grasas_g        || 0,
    raciones:    parseInt(r.raciones || r.Raciones || 1) || 1,
    id_receta:   r.id_receta    || r.ID_Receta        || r.id || "",
  });

  // ── Recetario completo: categorías (7 tipos de plato + desayunos) ──
  const CATS_COMPLETO = [
    {id:"desayuno",   es:"Desayunos",     en:"Breakfasts",  icon:"🥣", color:"#FFD54F", filtro:"categoria=eq."+encodeURIComponent("Desayuno/Almuerzo/Merienda"), match:r=>r.categoria==="Desayuno/Almuerzo/Merienda"},
    {id:"carne",      es:"Carnes",        en:"Meat",        icon:"🥩", color:"#E57373", filtro:"tipo=eq.Carne", match:r=>r.tipo==="Carne"},
    {id:"pescado",    es:"Pescados",      en:"Fish",        icon:"🐟", color:"#64B5F6", filtro:"tipo=eq.Pescado", match:r=>r.tipo==="Pescado"},
    {id:"vegetariana",es:"Vegetariano",   en:"Vegetarian",  icon:"🥦", color:"#81C784", filtro:"tipo=eq.Vegetariana", match:r=>r.tipo==="Vegetariana"},
    {id:"vegana",     es:"Vegano",        en:"Vegan",       icon:"🌱", color:"#A5D6A7", filtro:"tipo=eq.Vegana", match:r=>r.tipo==="Vegana"},
    {id:"postre",     es:"Postres",       en:"Desserts",    icon:"🍰", color:"#F06292", filtro:"tipo=eq.Postre", match:r=>r.tipo==="Postre"},
    {id:"sopa",       es:"Sopas y cremas",en:"Soups",       icon:"🍲", color:"#FFB74D", filtro:"tipo=eq."+encodeURIComponent("Sopa/Crema"), match:r=>r.tipo==="Sopa/Crema"},
    {id:"ensalada",   es:"Ensaladas",     en:"Salads",      icon:"🥗", color:"#AED581", filtro:"tipo=eq.Ensalada", match:r=>r.tipo==="Ensalada"},
  ];
  const abrirCategoriaCompleta = async (cat) => {
    setCompletoCat(cat);
    if(completoCacheRef.current[cat.id]){ setCompletoRecipes(completoCacheRef.current[cat.id]); return; }
    setCompletoLoading(true); setCompletoRecipes([]);
    try{
      const data = await sbReq("GET", `recipes?${cat.filtro}&select=*&order=calorias.asc&limit=300`);
      const norm = (data||[]).map(normalizeRecipe);
      completoCacheRef.current[cat.id] = norm;
      setCompletoRecipes(norm);
    }catch(e){ setCompletoRecipes([]); }
    finally{ setCompletoLoading(false); }
  };

  // ── Buscador por ingrediente ─────────────────────────────────────────────
  // Normaliza tildes y mayúsculas: "platano" encuentra "plátano", "Pollo"→"pollo".
  const normTxt = (s)=>(s||"").normalize("NFD").replace(/[\u0300-\u036f]/g,"").toLowerCase();
  // Carga TODO el recetario una sola vez y lo cachea en memoria; las búsquedas
  // posteriores filtran en local (instantáneo, sin más peticiones a Supabase).
  const cargarTodasRecetas = async ()=>{
    if(todasRecetasRef.current) return todasRecetasRef.current;
    // Si ya hay una descarga en curso, reutilizarla: sin esto, cada tecla
    // durante la primera búsqueda lanzaba un fetch paralelo y el que resolvía
    // el último machacaba los resultados de la consulta más reciente
    // (bug "440 recetas con Canela": eran los resultados de "Ca").
    if(todasRecetasPromiseRef.current) return todasRecetasPromiseRef.current;
    todasRecetasPromiseRef.current = (async ()=>{
      try{
        const data = await sbReq("GET","recipes?select=*&order=calorias.asc&limit=1000");
        const norm = (Array.isArray(data)?data:[]).map(normalizeRecipe);
        todasRecetasRef.current = norm;
        return norm;
      } finally {
        todasRecetasPromiseRef.current = null;
      }
    })();
    return todasRecetasPromiseRef.current;
  };
  // Filtra por ingrediente (y nombre del plato). Maneja plurales españoles:
  // "lentejas" también encuentra "lenteja", "pollos"→"pollo".
  const filtrarPorIngrediente = (recetas, texto)=>{
    const q = normTxt(texto.trim());
    if(q.length<2) return null;
    const terminos=[q];
    if(q.endsWith("es")&&q.length>4) terminos.push(q.slice(0,-2));
    if(q.endsWith("s") &&q.length>3) terminos.push(q.slice(0,-1));
    return recetas.filter(r=>{
      const campo = normTxt((r.ingredientes||"")+" "+(r.nombre||""));
      return terminos.some(t=>campo.includes(t));
    });
  };
  const buscarIngrediente = (texto)=>{
    setBusqTexto(texto);
    if(busqTimerRef.current) clearTimeout(busqTimerRef.current);
    if(normTxt(texto.trim()).length<2){ busqSeqRef.current++; setBusqResults(null); setBusqLoading(false); return; }
    // Token de esta búsqueda: si mientras esperábamos la descarga el usuario
    // siguió tecleando, este cierre queda obsoleto y NO pinta sus resultados.
    const seq = ++busqSeqRef.current;
    // La primera búsqueda descarga el recetario (con indicador); las demás son locales.
    busqTimerRef.current = setTimeout(async ()=>{
      try{
        if(!todasRecetasRef.current) setBusqLoading(true);
        const todas = await cargarTodasRecetas();
        if(seq !== busqSeqRef.current) return; // llegó tarde: descartar
        setBusqResults(filtrarPorIngrediente(todas, texto));
      }catch(e){ if(seq === busqSeqRef.current) setBusqResults([]); }
      finally{ if(seq === busqSeqRef.current) setBusqLoading(false); }
    }, todasRecetasRef.current?150:0);
  };

  // Traduce un texto ES→EN usando MyMemory (gratuito, sin API key, funciona desde el browser)
  const translateText = async (text) => {
    if(!text) return text;
    try {
      const url = `https://api.mymemory.translated.net/get?q=${encodeURIComponent(text)}&langpair=es|en&de=gbhnutricion@app.com`;
      const res = await fetch(url);
      const data = await res.json();
      const t = data?.responseData?.translatedText;
      // MyMemory devuelve el original si falla — detectarlo
      if(!t || t === text || data?.responseStatus !== 200) return text;
      return t;
    } catch(e) { return text; }
  };

  // Traduce una receta completa campo a campo
  const translateRecipe = async (recipe) => {
    const norm = normalizeRecipe(recipe);
    try {
      // Tipo: mapeo fijo para no gastar cuota de API
      const tipoMap = {
        "Carne":"Meat","Pescado":"Fish","Vegetariana":"Vegetarian",
        "Vegana":"Vegan","Postre":"Dessert","Ensalada":"Salad","Sopa/Crema":"Soup"
      };
      const [nombre, ingredientes, instrucciones] = await Promise.all([
        translateText(norm.nombre),
        translateText(norm.ingredientes),
        translateText(norm.instrucciones),
      ]);
      return {
        ...norm,
        nombre,
        tipo: tipoMap[norm.tipo] || norm.tipo,
        ingredientes,
        instrucciones,
        _translated: true,
      };
    } catch(e) { console.warn("translateRecipe:",e); return norm; }
  };

  // Aplica traducción si lang===en, con caché persistida en localStorage
  const getRecipeForDisplay = async (recipe) => {
    const norm = normalizeRecipe(recipe);
    if(lang!=="en") return norm;
    const key=`gbh:recipe:en:${norm.id_receta||norm.nombre}`;
    const cached=lsGet(key,null);
    if(cached && cached._translated) return cached;
    const translated = await translateRecipe(norm);
    lsSet(key, translated);
    return translated;
  };

  // Refresca la receta — cuesta 10💎, máximo 3 veces al día
  const refreshRecipe = async () => {
    // Bloqueo síncrono inmediato — evita doble tap
    if(refreshingRef.current) return;
    refreshingRef.current = true;

    const todayKey = toKey();
    const used = lsGet(`gbh:recipe:refreshes:${todayKey}`, 0);
    if(used >= 3){
      showT({icon:"🚫",
        title:lang==="en"?"No more changes":"Sin refrescos",
        sub:lang==="en"?"Max 3 changes/day. Come back tomorrow!":"Máximo 3 cambios por día. ¡Vuelve mañana!"});
      refreshingRef.current = false; return;
    }
    if(gems < 10){
      showT({icon:"💎",title:t("insufficientGems"),sub:t("needGemsRecipe")});
      refreshingRef.current = false; return;
    }

    // Descontar gemas y mostrar loading inmediatamente
    const newGems = gems - 10;
    const updP = {...profile, gems: newGems};
    setProfile(updP); lsSet(`gbh:p:${profile.id}`, updP);
    setDailyRecipe(null);
    setRecipeLoading(true);

    // Guardar conteo y persistir gemas en background
    const newUsed = used + 1;
    lsSet(`gbh:recipe:refreshes:${todayKey}`, newUsed);
    sbReq("POST","daily_logs?on_conflict=profile_id,log_date",{profile_id:profile.id,log_date:todayKey,recipe_refreshes:newUsed});
    setRecipeRefreshes(newUsed);
    sbReq("PATCH", `profiles?id=eq.${profile.id}`, {gems: newGems}); // fire & forget

    try {
      const d = new Date();
      const dayOfYear = Math.floor((d - new Date(d.getFullYear(),0,0)) / 86400000);
      const base = (dayOfYear * 7 + d.getFullYear()) % 472;
      const offset = (base + newUsed * 137) % 472;
      const r = await sbReq("GET", `recipes?select=*&order=id_receta.asc&limit=1&offset=${offset}`);
      if(r?.length){
        sfx("recipe");
        const recipe = await getRecipeForDisplay(r[0]);
        lsSet(`gbh:recipe:current:${todayKey}`, recipe);
        setDailyRecipe(recipe);
        const left = 3 - newUsed;
        showT({icon:"🍰",
          title:lang==="en"?"New recipe!":"¡Nueva receta!",
          sub:lang==="en"
            ?`-10 💎 · ${left>0?left+" change"+(left>1?"s":"")+" left today":"No more changes today"}`
            :`-10 💎 · ${left>0?left+" cambio"+(left>1?"s":"")+" más hoy":"Sin más cambios hoy"}`
        });
      }
    } catch(e){ console.warn("refreshRecipe:",e); }
    setRecipeLoading(false);
    refreshingRef.current = false;
  };

    // ─── Restaurar datos desde Supabase cuando localStorage está vacío ─────────
  // Se llama cuando el perfil existe en Supabase pero los datos locales faltan.
  // Esto protege contra: borrar caché, cambio de dispositivo, navegador nuevo.
  const restoreFromServer = async (profileId) => {
    try {
      // 1. Restaurar logs diarios
      const remoteLogs = await sbReq("GET", `daily_logs?profile_id=eq.${profileId}&select=*&order=log_date.asc&limit=365`);
      if (remoteLogs?.length) {
        const mapped = remoteLogs.map(r => ({
          profile_id: r.profile_id,
          date: r.log_date || r.date,
          diet: r.diet_followed ?? r.diet ?? false,
          steps: r.steps_done ?? r.steps ?? false,
          hydration: r.hydration_done ?? r.hydration ?? false,
          sleep: r.sleep_done ?? r.sleep ?? false,
          sc: r.sc || 0,
          quiz_done: r.quiz_done ?? false,
          ruleta_done: r.ruleta_done ?? false,
          recipe_refreshes: r.recipe_refreshes ?? null,
          meals: r.meals_log ?? {},
          note: r.day_note ?? "",
        }));
        lsSet(`gbh:logs:${profileId}`, mapped);
        setLogs([...mapped]); // spread para forzar nueva referencia
        // Restaurar tlog del día
        const hoy = toKey();
        const logHoy = mapped.find(l => l.date === hoy);
        if(logHoy){
          setTLog({diet:!!logHoy.diet, steps:!!logHoy.steps, hydration:!!logHoy.hydration, sleep:!!logHoy.sleep});
          setSteps(logHoy.sc||0);
          // Quiz y ruleta del día
          if(logHoy.quiz_done){
            lsSet(`gbh:quiz:${profileId}:${hoy}`, true);
            setQuizDone(true);
          }
          if(logHoy.ruleta_done){
            lsSet(`gbh:ruleta:${profileId}:${hoy}`, true);
            setRuletaDone(true);
          }
          if(logHoy.recipe_refreshes!=null){
            lsSet(`gbh:recipe:refreshes:${hoy}`, logHoy.recipe_refreshes);
            setRecipeRefreshes(logHoy.recipe_refreshes);
          }
        }
      }
      // 2. Restaurar historial de peso
      const remoteWeights = await sbReq("GET", `weight_logs?profile_id=eq.${profileId}&select=*&order=log_date.asc`);
      if (remoteWeights?.length) {
        const mappedW = remoteWeights.map((r,i) => ({
          date: r.log_date || r.date,
          weight: r.weight_kg ?? r.weight,
          isInitial: i === 0,
        }));
        lsSet(`gbh:weights:${profileId}`, mappedW);
        setWeights([...mappedW]);
      }
      // 3. Restaurar logros
      const remoteAch = await sbReq("GET", `achievements?profile_id=eq.${profileId}&select=badge_id`);
      if (remoteAch?.length) {
        const badgeIds = remoteAch.map(r => r.badge_id);
        lsSet(`gbh:badges:${profileId}`, badgeIds);
        setBadges([...badgeIds]);
      }
      // 4. Restaurar perfil completo (foto, xp, gems, plan, streak...)
      const remoteProfile = await sbReq("GET", `profiles?id=eq.${profileId}&select=*&limit=1`);
      // ── RECONCILIACIÓN: el perfil existe en el móvil pero NO en Supabase ──
      // (usuarios que se registraron mientras faltaban columnas por migrar y
      //  cuya alta encolada se descartó). Se re-crea desde la copia local y se
      //  re-suben el peso y el día de hoy para no perder al paciente.
      if(Array.isArray(remoteProfile) && remoteProfile.length===0){
        const localP = lsGet(`gbh:p:${profileId}`, null);
        if(localP?.id && localP?.email){
          console.warn("[reconciliación] perfil ausente en Supabase — re-creando:", localP.email);
          const {plan:_pl, trial_ends_at:_tr, plan_until:_pu, ...sinTrial} = localP;
          const nucleo = {id:localP.id, name:localP.name, email:localP.email,
                          auth_id:localP.auth_id||null, xp:localP.xp||0,
                          gems:localP.gems||0, shields:localP.shields||0};
          for(const intento of [localP, sinTrial, nucleo]){
            const r = await sbDirect("POST", "profiles", intento);
            if(r.ok){
              // re-subir lo esencial que tenga el dispositivo
              const pesos = lsGet(`gbh:weights:${profileId}`, []);
              const ultimo = pesos[pesos.length-1];
              if(ultimo?.weight_kg && ultimo?.log_date){
                sbDirect("POST","weight_logs?on_conflict=profile_id,log_date",
                  {profile_id:profileId, weight_kg:ultimo.weight_kg, log_date:ultimo.log_date});
              }
              const logsLoc = lsGet(`gbh:logs:${profileId}`, []);
              const hoyR = toKey();
              const logHoyR = logsLoc.find(l=>l.date===hoyR);
              if(logHoyR){
                sbDirect("POST","daily_logs?on_conflict=profile_id,log_date",
                  {profile_id:profileId, log_date:hoyR,
                   diet_followed:!!logHoyR.diet, steps_done:!!logHoyR.steps,
                   hydration_done:!!logHoyR.hydration, sleep_done:!!logHoyR.sleep,
                   sc:logHoyR.sc||0});
              }
              const ws = lsGet(WSTATE_KEY(profileId), null);
              if(ws) sbDirect("PATCH", `profiles?id=eq.${profileId}`, {weekly_state:ws});
              break;
            }
            if(r.status===0) break; // sin red: lo reintentará el próximo arranque
          }
        }
      }
      if(remoteProfile?.length){
        const rp = remoteProfile[0];
        const localP = lsGet(`gbh:p:${profileId}`, {});
        // Recalcular racha desde los logs restaurados si Supabase tiene streak=0 o null
        let streakVal = rp.streak || 0;
        if(streakVal === 0 && remoteLogs?.length){
          const mappedForStreak = remoteLogs.map(r=>({date:r.log_date||r.date, diet:r.diet_followed??r.diet??false}));
          const d=new Date(); let s=0;
          while(true){
            const key=toKey(d);
            if(mappedForStreak.find(x=>x.date===key&&x.diet)){s++;d.setDate(d.getDate()-1);}
            else break;
          }
          streakVal = s;
          // Actualizar en Supabase si calculamos uno mayor
          if(s>0) sbReq("PATCH",`profiles?id=eq.${profileId}`,{streak:s});
        }
        const merged = { ...localP, ...rp, streak: streakVal };
        lsSet(`gbh:p:${profileId}`, merged);
        setProfile({...merged});
        _activeProfileId = profileId;  // cola de sincronización scoped a este usuario
        migrateQueue(profileId);       // migrar la cola global antigua (una vez)
        // ── Restaurar estado semanal (desafíos, cofres, XP semanal, calculadora) ──
        // Es lo que evita el farmeo de gemas tras borrar caché.
        try{
          const ws = rp.weekly_state || {};
          lsSet(WSTATE_KEY(profileId), ws);
          const {w:wNow, y:yNow} = getISOWeek();
          const wk = `${yNow}:${wNow}`;
          if(Array.isArray(ws.challenges?.[wk])){
            lsSet(`gbh:challenges:${yNow}:${wNow}`, ws.challenges[wk]);
            setClaimedChallenges([...ws.challenges[wk]]);
          }
          if(ws.weekChest?.[wk]) lsSet(`gbh:weekChest:${yNow}:${wNow}`, true);
          if(ws.weekXP?.[wk]!=null){
            const localXP = lsGet(`gbh:weekXP:${yNow}:${wNow}`, 0);
            lsSet(`gbh:weekXP:${yNow}:${wNow}`, Math.max(localXP, ws.weekXP[wk]));
          }
          if(ws.chestStreakLast!=null){
            const localChest = lsGet("gbh:chestLastOpened", 0);
            lsSet("gbh:chestLastOpened", Math.max(localChest||0, ws.chestStreakLast));
            setChestOpened(Math.max(localChest||0, ws.chestStreakLast));
          }
          if(ws.calc) lsSet(`gbh:calc:saved:${profileId}`, ws.calc);
        }catch(e){ console.warn("weekly_state restore:", e); }
        // ── Recetario personal: restaurarlo TAMBIÉN en el auto-login ──
        // (antes solo se sincronizaba en el login manual, así que tras borrar
        //  caché el recetario aparecía vacío aunque las recetas estuvieran
        //  guardadas en Supabase)
        sbReq("GET",`saved_recipes?profile_id=eq.${profileId}&select=*&order=saved_at.desc`).then(remote=>{
          if(remote?.length){
            lsSet(`gbh:saved_recipes:${profileId}`, remote);
            setSavedRecipes(remote);
          }
        });
        if(rp.avatar_b64){
          setUserPhoto(rp.avatar_b64);
          lsSet("gbh:userPhoto", rp.avatar_b64);
        }
      }
    } catch(e) {
      console.warn("restoreFromServer error:", e);
    }
  };

  const loadP=useCallback(async(p)=>{
    setProfile(p);
    // ── Refrescar SIEMPRE desde Supabase los campos que controla el nutricionista
    if(navigator.onLine){
      try{
        const fresh=await sbReq("GET",`profiles?id=eq.${p.id}&select=plan,gems,xp,shields,name,target_kcal,avatar_b64,bo_nombre,bo_color,bo_equipados,bo_personalidad,trial_ends_at,plan_until&limit=1`);
        if(fresh&&fresh.length){
          const f=fresh[0];
          const merged={
            ...p,
            plan:       f.plan ?? p.plan,
            gems:       (f.gems ?? p.gems),
            xp:         (f.xp ?? p.xp),
            shields:    (f.shields ?? p.shields),
            name:       f.name || p.name,
            target_kcal:f.target_kcal ?? p.target_kcal,
          };
          setProfile(merged);
          lsSet(`gbh:p:${p.id}`, merged);
          p=merged;
        }
      }catch(e){ /* sin conexión: seguimos con el perfil local */ }
    }
    // Restaurar foto de perfil desde Supabase si existe y no hay una local
    if(p.avatar_b64 && !lsGet("gbh:userPhoto",null)){
      setUserPhoto(p.avatar_b64);
      lsSet("gbh:userPhoto", p.avatar_b64);
    }
    const localLogs = lsGet(`gbh:logs:${p.id}`,[]);
    const localWeights = lsGet(`gbh:weights:${p.id}`,[]);
    // Restaurar desde Supabase solo si NO hay logs locales (primera instalación real)
    if(navigator.onLine && localLogs.length===0){
      await restoreFromServer(p.id);
    }
    const l=lsGet(`gbh:logs:${p.id}`,[]);setLogs(l);
    // tLog: prioridad a la clave del día en localStorage (nunca se pierde)
    const today=toKey();
    const savedTLog=lsGet(`gbh:tlog:${p.id}:${today}`,null);
    if(savedTLog){
      setTLog(savedTLog);
      // Restaurar también el conteo de pasos del log del día
      const t=l.find(x=>x.date===today);
      setSteps(t?.sc||0);
    } else {
      // Fallback: leer del array de logs (compatibilidad hacia atrás)
      const t=l.find(x=>x.date===today);
      if(t){
        const tl={diet:!!t.diet,steps:!!t.steps,hydration:!!t.hydration,sleep:!!t.sleep};
        setTLog(tl);
        lsSet(`gbh:tlog:${p.id}:${today}`,tl); // migrar al nuevo sistema
        setSteps(t.sc||0);
      }
    }
    setWeights(lsGet(`gbh:weights:${p.id}`,[]).sort((a,b)=>a.date>b.date?1:-1));
    setBadges(lsGet(`gbh:badges:${p.id}`,[]) );
    // Exponer UID globalmente para widgets sin acceso a profile (HydrationWidget)
    window.__gbhUID = p.id;
    // Sobreescribir estados de día con claves scoped al usuario
    const todayKey2 = toKey();
    setQuizDone(lsGet("gbh:quiz:"+p.id+":"+todayKey2, false));
    setQuizBannerDismissed(lsGet("gbh:quizBanner:"+p.id+":"+todayKey2, false));
    setRuletaDone(lsGet("gbh:ruleta:"+p.id+":"+todayKey2, false));
    setRuletaAutoShown(lsGet("gbh:ruletaSeen:"+p.id+":"+todayKey2, false));
    // Cargar recetas guardadas desde localStorage (con sync Supabase al fondo)
    const localSaved = lsGet(`gbh:saved_recipes:${p.id}`,[]);
    setSavedRecipes(localSaved);
    sbReq("GET",`saved_recipes?profile_id=eq.${p.id}&select=*&order=saved_at.desc`).then(remote=>{
      if(remote?.length){
        lsSet(`gbh:saved_recipes:${p.id}`,remote);
        setSavedRecipes(remote);
      }
    });
    setWeightBannerDismissed(false);
    setScreen("main");
    fetchDailyRecipe(); // cargar receta del día
    // Mostrar banner de notificaciones si llevan ≥1 días y no han respondido
    if(!lsGet("gbh:notifAsked",false)){
      const firstOpen = lsGet("gbh:firstOpen", toKey());
      if(!lsGet("gbh:firstOpen",null)) lsSet("gbh:firstOpen", toKey());
      const days = Math.floor((Date.now()-new Date(firstOpen))/(1000*60*60*24));
      if(days>=1) setTimeout(()=>setShowNotifBanner(true), 3000);
    }
    // Auto-popup ruleta: mostrar si no se ha visto hoy (scoped a usuario)
    const todayKey = toKey();
    const alreadySeen  = lsGet("gbh:ruletaSeen:"+p.id+":"+todayKey, false);
    const alreadyDone  = lsGet("gbh:ruleta:"+p.id+":"+todayKey, false);
    if(!alreadySeen && !alreadyDone){
      setTimeout(()=>setShowRuleta(true), 600);
    }
    // Vaciar cola pendiente al cargar el perfil
    if(navigator.onLine) flushQueue().then(()=>setPendingSync(lsGet(getQueueKey(),[]).length));
  },[]);

  // Detecta si el email ya existe al salir del campo
  // Primero busca en localStorage (sin RLS), luego en Supabase
  const checkEmail = async (email) => {
    if(!email.includes("@")) return;
    const em = email.trim().toLowerCase();
    setAuthErr("");
    // Sistema SIN contraseñas: solo miramos si el email ya tiene cuenta para
    // recuperarla (modo "returning" = entra directo) o es nuevo (pide datos).
    const localId = lsGet(`gbh:em:${em}`, null);
    const localP  = localId ? lsGet(`gbh:p:${localId}`, null) : null;
    if(localP?.id){
      setAName(localP.name || "");
      setAuthMode("returning");
      return;
    }
    setAuthMode("checking");
    const r = await sbReq("GET", `profiles?email=eq.${em}&select=id,name`);
    if(r?.length){
      setAName(r[0].name || "");
      lsSet(`gbh:em:${em}`, r[0].id);
      const prev = lsGet(`gbh:p:${r[0].id}`, null);
      lsSet(`gbh:p:${r[0].id}`, prev ? {...prev, ...r[0]} : r[0]);
      setAuthMode("returning");
    } else {
      setAuthMode("new");
    }
  };

  const doAuth=async()=>{
    if(!aEmail.trim()) return;
    const email = aEmail.trim().toLowerCase();
    const name  = aName.trim();
    setLoading(true); setAuthErr("");
    try{

    // Helper: entrar en la app con un perfil dado
    const enterApp = async (ep) => {
      lsSet(`gbh:p:${ep.id}`, ep);
      lsSet(`gbh:em:${email}`, ep.id);
      saveLastEmail(email);
      const localLogs = lsGet(`gbh:logs:${ep.id}`, []);
      const localWeights = lsGet(`gbh:weights:${ep.id}`, []);
      const localBadges = lsGet(`gbh:badges:${ep.id}`, []);
      setProfile(ep);
      setLogs(localLogs);
      setWeights(localWeights.sort((a,b)=>a.date>b.date?1:-1));
      setBadges(localBadges);
      window.__gbhUID = ep.id;
      const today = toKey();
      const savedTLog = lsGet(`gbh:tlog:${ep.id}:${today}`, null);
      if(savedTLog){ setTLog(savedTLog); setSteps(localLogs.find(x=>x.date===today)?.sc||0); }
      else {
        const t2 = localLogs.find(x=>x.date===today);
        if(t2){ setTLog({diet:!!t2.diet,steps:!!t2.steps,hydration:!!t2.hydration,sleep:!!t2.sleep}); setSteps(t2.sc||0); }
      }
      setWeightBannerDismissed(false);
      setQuizDone(lsGet(`gbh:quiz:${ep.id}:${today}`, false));
      setQuizBannerDismissed(lsGet(`gbh:quizBanner:${ep.id}:${today}`, false));
      setRuletaDone(lsGet(`gbh:ruleta:${ep.id}:${today}`, false));
      setRuletaAutoShown(lsGet(`gbh:ruletaSeen:${ep.id}:${today}`, false));
      setScreen("main");
      setTimeout(()=>{ restoreFromServer(ep.id).catch(()=>{}); }, 1500);
    };

    // ── USUARIO EXISTENTE → entra directo (sin contraseña) ──
    if(authMode==="returning"){
      const localId = lsGet(`gbh:em:${email}`, null);
      let perfil = localId ? lsGet(`gbh:p:${localId}`, null) : null;
      if(!perfil?.id){
        const conTimeout = (p,ms)=>Promise.race([p,new Promise((_,rej)=>setTimeout(()=>rej(new Error("timeout")),ms))]);
        const byEmail = await conTimeout(sbReq("GET", `profiles?email=eq.${email}&select=*`), 6000).catch(()=>null);
        perfil = byEmail?.[0] || null;
      }
      if(!perfil?.id){
        perfil = { id: crypto.randomUUID(), name: aName||email.split("@")[0], email, xp:0, gems:0, shields:0 };
      }
      await enterApp(perfil);
      return;
    }

    // ── USUARIO NUEVO → registro con email (sin contraseña) ──
    if(!aName.trim()){ setAuthErr(lang==="en"?"Enter your name":"Introduce tu nombre"); setLoading(false); return; }
    if(!aWeight || isNaN(parseFloat(aWeight))){
      setAuthErr(lang==="en"?"Enter your current weight to start.":"Introduce tu peso actual para comenzar.");
      setLoading(false); return;
    }

    const np = {
      id: crypto.randomUUID(), name, email,
      xp:0, gems:0, shields:0,
      height_cm: Math.round(aHeight)||null,
      sex: aSex||null,
      initial_weight: parseFloat(aWeight)||null,
      goal_weight: (aGoal && !isNaN(parseFloat(aGoal)) && parseFloat(aGoal)>20) ? parseFloat(aGoal) : null,
      // Semana de prueba estándar: 7 días, luego degrada a 'free'
      plan: 'standard',
      trial_ends_at: new Date(Date.now() + 7*24*60*60*1000).toISOString(),
    };
    // Alta resiliente: completo → sin campos nuevos → núcleo mínimo
    const { plan:_pl, trial_ends_at:_tr, ...npSinTrial } = np;
    const npNucleo = { id:np.id, name:np.name, email:np.email, xp:0, gems:0, shields:0 };
    let fp = null;
    for(const intento of [np, npSinTrial, npNucleo]){
      const r = await sbDirect("POST", "profiles", intento);
      if(r.ok){ fp = (Array.isArray(r.data) && r.data[0]) || intento; break; }
      if(r.status === 0){ await sbReq("POST", "profiles", np); fp = np; break; }
      console.warn("[alta] payload rechazado (", r.status, ") — reintento reducido");
    }
    if(!fp) fp = np;
    // ── Referidos: canjear código de invitación (RPC server-side) ──
    // Valida + enlaza + da la bienvenida (+25 💎) en una sola llamada segura.
    // Nunca bloquea el alta: si falla, el registro sigue adelante igual.
    if(aRef.trim()){
      try{
        const rr = await sbReq("POST","rpc/apply_referral",{p_profile:fp.id,p_code:aRef.trim()});
        if(rr?.ok && rr.welcome_gems){
          fp = {...fp, gems:(fp.gems||0)+rr.welcome_gems};
          setTimeout(()=>{ try{ showT&&showT({icon:"🎁",
            title: lang==="en"?`Welcome gift: +${rr.welcome_gems} 💎`:`Regalo de bienvenida: +${rr.welcome_gems} 💎`,
            sub:   lang==="en"?"Invitation code applied":"Código de invitación aplicado"}); }catch{} },1500);
        }
      }catch(e){ console.warn("[referido] canje falló:",e); }
    }
    const initW = parseFloat(aWeight);
    if(!isNaN(initW)&&initW>20&&initW<300){
      const initDate = toKey();
      lsSet(`gbh:weights:${fp.id}`,[{date:initDate,weight:initW,isInitial:true}]);
      await sbReq("POST","weight_logs?on_conflict=profile_id,log_date",{profile_id:fp.id,log_date:initDate,weight_kg:initW});
    }
    await enterApp(fp);
    }catch(err){
      console.warn("[doAuth] error inesperado:", err);
      setAuthErr(lang==="en"?"Something went wrong. Try again.":"Algo salió mal. Inténtalo de nuevo.");
    }finally{
      setLoading(false); // el botón SIEMPRE se libera
    }
  };

  // Recuperación de contraseña por email
  const doForgotPassword = async () => {
    if(!aEmail.includes("@")) return;
    setLoading(true);
    const ok = await sbAuth.resetPassword(aEmail.trim().toLowerCase());
    setLoading(false);
    if(ok){ setForgotSent(true); setAuthErr(""); }
    else { setAuthErr(t("forgotPasswordErr")); }
  };

  const saveLog=useCallback(async(nl,sc)=>{
    if(!profile)return;
    const today=toKey();
    // Persistir tLog del día en su propia clave — nunca se pierde
    lsSet(`gbh:tlog:${profile.id}:${today}`, nl);
    const l=[...logs];
    const idx=l.findIndex(x=>x.date===today);
    // Preservar campos que no gestiona saveLog (meals del registro por tomas, note…)
    const prev = idx>=0 ? l[idx] : {};
    const e={...prev,profile_id:profile.id,date:today,...nl,sc};
    if(idx>=0)l[idx]=e;else l.push(e);
    setLogs(l);lsSet(`gbh:logs:${profile.id}`,l);
    await sbReq("POST","daily_logs?on_conflict=profile_id,log_date",{profile_id:profile.id,log_date:today,diet_followed:nl.diet,steps_done:nl.steps,hydration_done:nl.hydration,sleep_done:nl.sleep,sc:sc||0});
    // ── Sincronizar racha actual a Supabase para que el ranking sea global ──
    let _s=0;const _d=new Date();
    while(true){if(l.find(x=>x.date===toKey(_d)&&x.diet)){_s++;_d.setDate(_d.getDate()-1);}else break;}
    sbReq("PATCH",`profiles?id=eq.${profile.id}`,{streak:_s}); // fire & forget
    setPendingSync(lsGet(getQueueKey(),[]).length);
  },[profile,logs]);

  const addXG=useCallback(async(ax,ag)=>{
    if(!profile)return;
    const prevXP=profile.xp||0;
    const u={...profile,xp:prevXP+ax,gems:(profile.gems||0)+ag};
    setProfile(u);lsSet(`gbh:p:${u.id}`,u);
    // Acumular XP semanal para el desafío "xp_week" (local + Supabase en un solo PATCH)
    const {w:wXP,y:yXP}=getISOWeek();
    const wkKey=`gbh:weekXP:${yXP}:${wXP}`;
    const nuevoWeekXP=(lsGet(wkKey,0))+ax;
    lsSet(wkKey,nuevoWeekXP);
    // xp/gems en su PROPIO PATCH (crítico, con cola offline). weekly_state va
    // aparte y best-effort: si su columna aún no está migrada, no rompe nada.
    await sbReq("PATCH",`profiles?id=eq.${profile.id}`,{xp:u.xp,gems:u.gems});
    patchWeeklyState(profile.id, mergeWeeklyState(profile.id,{weekXP:{[`${yXP}:${wXP}`]:nuevoWeekXP}}));
    setPendingSync(lsGet(getQueueKey(),[]).length);
    // Float reward chips
    const chips=[];
    if(ax>0)chips.push({id:Date.now()+"xp",label:`+${ax} XP ⚡`,color:"#C8FF40"});
    if(ag>0)chips.push({id:Date.now()+"g", label:`+${ag} 💎`,color:"#FFD700"});
    if(chips.length){setFloatItems(chips);setTimeout(()=>setFloatItems([]),1600);sfx("coin");}
    // Level-up check + distribute rewards
    const oldLv=getLevel(prevXP),newLv=getLevel(u.xp);
    if(newLv.l>oldLv.l){
      sfx("levelUp");
      const rew=LEVEL_REWARDS[newLv.l];
      setLevelUpNum(newLv.l); setLevelUpRew(rew); setLevelUpAnim(true);
      setTimeout(()=>setLevelUpAnim(false),3600);
      // Entregar gemas de la recompensa
      if(rew?.gems){
        const rewP={...u,gems:(u.gems||0)+rew.gems};
        setProfile(rewP);lsSet(`gbh:p:${rewP.id}`,rewP);
        await sbReq("PATCH",`profiles?id=eq.${rewP.id}`,{gems:rewP.gems});
      }
      // Entregar escudo
      if(rew?.shield){
        const shP={...u,shields:(u.shields||0)+1};
        setProfile(shP);lsSet(`gbh:p:${shP.id}`,shP);
        await sbReq("PATCH",`profiles?id=eq.${shP.id}`,{shields:shP.shields});
      }

    }
  },[profile]);

  const showT=(t)=>{setToast(t);setTimeout(()=>setToast(null),4200);};

  const chkBadges=useCallback(async(s,ws,b)=>{
    const wC=ws.length,tD=logs.filter(l=>l.diet).length;
    const pf=(()=>{let c=0;const d=new Date();for(let i=0;i<7;i++){if(logs.find(l=>l.date===toKey(d)&&l.diet))c++;d.setDate(d.getDate()-1);}return c>=7;})();
    let current=[...b];let firstNew=null;
    for(const badge of BADGES){
      const cond={d1:tD>=1,s7:s>=7,s30:s>=30,s100:s>=100,s365:s>=365,w1:wC>=1,w8:wC>=8,w12:wC>=12,pW:pf}[badge.id];
      if(!current.includes(badge.id)&&cond){
        current=[...current,badge.id];
        await sbReq("POST","achievements",{profile_id:profile?.id,badge_id:badge.id});
        await addXG(badge.xp,badge.g);
        if(!firstNew) firstNew=badge;
      }
    }
    if(current.length>b.length){
      setBadges(current);lsSet(`gbh:badges:${profile?.id}`,current);
      if(firstNew){
        sfx("badge");
        const extras=current.length-b.length-1;
        const sub=extras>0?(lang==="en"?`${firstNew.t_en||firstNew.t} (+${extras} more)`:`${firstNew.t} (+${extras} más)`):(lang==="en"?(firstNew.t_en||firstNew.t):firstNew.t);
        showT({icon:firstNew.icon,title:lang==="en"?"Achievement unlocked!":"¡Logro desbloqueado!",sub,reward:lang==="en"?(firstNew.r_en||firstNew.r):firstNew.r});
      }
    }
    return current;
  },[profile,logs,addXG]);
  const _retroCheckedFor=React.useRef(null);
  React.useEffect(()=>{
    if(!profile||logs.length===0) return;
    const retroKey=`gbh:retroCheck:${profile.id}`;
    if(lsGet(retroKey,false)) return;
    if(_retroCheckedFor.current===profile.id) return;
    _retroCheckedFor.current=profile.id;
    lsSet(retroKey,true);
    setTimeout(()=>{
      const storedBadges=lsGet(`gbh:badges:${profile.id}`,[]);
      let effStreak=0;let dd=new Date();
      while(logs.find(l=>l.date===toKey(dd)&&l.diet)){effStreak++;dd.setDate(dd.getDate()-1);}
      if(effStreak===0){dd=new Date();dd.setDate(dd.getDate()-1);while(logs.find(l=>l.date===toKey(dd)&&l.diet)){effStreak++;dd.setDate(dd.getDate()-1);}}
      chkBadges(effStreak,weights,storedBadges);
    },1200);
  },[profile?.id,logs.length]); // eslint-disable-line react-hooks/exhaustive-deps



  const toggleM=useCallback(async(key)=>{
    const was=tLog[key];
    if(was) return;
    const nl={...tLog,[key]:true};setTLog(nl);await saveLog(nl,steps);
    if(key==="diet") sfx("complete"); else sfx("missionDone");
    await addXG(key==="diet"?15:5,key==="diet"?5:2);
    if(key==="diet"){sfx("streakCelebration");setStreakAnim(true);setTimeout(()=>setStreakAnim(false),5000);}
    const wasAllDone=tLog.diet&&tLog.steps&&tLog.hydration&&tLog.sleep;
    if(nl.diet&&nl.steps&&nl.hydration&&nl.sleep&&!wasAllDone){
      await addXG(20,10);
      sfx("confetti");
      setTimeout(()=>{setMissionsAnim(true);setTimeout(()=>setMissionsAnim(false),2800);},key==="diet"?2700:0);
    }
    await chkBadges(streak,weights,badges);
  },[tLog,steps,streak,weights,badges,saveLog,addXG,chkBadges]);

  // ── Desglose de dieta por tomas ──────────────────────────────────────────────
  // Tomas que el paciente tiene HOY según su pauta (una toma al 0% no genera
  // recetas en el plan y por tanto no aparece). null → botón clásico de dieta.
  const tomasHoy = React.useMemo(()=>{
    if(!planTomas) return null;
    const dowJS=new Date().getDay(); const d=String(dowJS===0?7:dowJS);
    const ts=PLAN_TOMAS.filter(tm=>planTomas?.[tm]?.[d]);
    return ts.length?ts:null;
  // eslint-disable-next-line react-hooks/exhaustive-deps
  },[planTomas, tab]);  // 'tab' fuerza recomputar al volver a Inicio (cambio de día)

  // Registro de comidas de hoy (fuente: logs, sincronizado con daily_logs.meals_log)
  const mealsHoy = React.useMemo(()=>logs.find(l=>l.date===toKey())?.meals||{},[logs]);

  // ── Recordatorio diario 20:00 — registro pendiente ─────────────────────────
  // Mismo mecanismo que el aviso de nueva programación: a partir de las 20:00,
  // si el paciente aún tiene tomas de HOY sin registrar, salta un pop-up (una
  // sola vez al día) que le lleva directo al plan diario. Se comprueba cada
  // minuto y al volver la app a primer plano, por si estaba abierta antes de
  // las 20:00. No se muestra si el pop-up de nueva programación está activo
  // (en ese caso reintenta al minuto siguiente sin consumir el aviso del día).
  const [avisoRegistro,setAvisoRegistro]=useState(null);   // {pendientes:[...]} | null
  useEffect(()=>{
    if(!profile?.id || tLog.diet || !tomasHoy) return;
    const chk=()=>{
      try{
        if(new Date().getHours()<20) return;
        if(tLog.diet || !tomasHoy || avisoNuevoPlan) return;
        const k=`gbh:recordatorio20:${profile.id}:${toKey()}`;
        if(lsGet(k,false)) return;
        const pendientes=tomasHoy.filter(tm=>!mealsHoy?.[tm]);
        if(!pendientes.length) return;
        lsSet(k,true);                 // marcado al mostrarse → máx. 1 vez/día
        setAvisoRegistro({pendientes});
      }catch{}
    };
    chk();
    const id=setInterval(chk,60*1000);
    const onVis=()=>{ if(!document.hidden) chk(); };
    document.addEventListener("visibilitychange",onVis);
    return ()=>{ clearInterval(id); document.removeEventListener("visibilitychange",onVis); };
  // eslint-disable-next-line react-hooks/exhaustive-deps
  },[profile?.id, tLog.diet, tomasHoy, mealsHoy, avisoNuevoPlan]);

  // ── Recordatorio de medicación/suplementación ───────────────────────────────
  // Mismo mecanismo que los otros pop-ups: cada minuto (y al volver a primer
  // plano) se comprueba si hay algún ítem cuya hora ya pasó y sigue sin
  // completar hoy. Se avisa UNA vez al día por ítem. No cuenta para la racha.
  const [avisoSupl,setAvisoSupl]=useState(null);   // item | null
  useEffect(()=>{
    if(!profile?.id || !suplPlan?.length) return;
    const chk=()=>{
      try{
        if(avisoNuevoPlan || avisoRegistro || avisoSupl) return;
        const ahora=new Date();
        const hhmm=`${String(ahora.getHours()).padStart(2,'0')}:${String(ahora.getMinutes()).padStart(2,'0')}`;
        const hoy=toKey();
        const hechos=lsGet(suplHechosKey(profile.id,hoy),{});
        for(const it of suplPlan){
          if(it.hora>hhmm || hechos[it.nombre]) continue;
          const k=`gbh:suplaviso:${profile.id}:${hoy}:${it.nombre}`;
          if(lsGet(k,false)) continue;
          lsSet(k,true);                 // máx. 1 aviso/día por ítem
          setAvisoSupl(it);
          return;
        }
      }catch{}
    };
    chk();
    const id=setInterval(chk,60*1000);
    const onVis=()=>{ if(!document.hidden) chk(); };
    document.addEventListener("visibilitychange",onVis);
    return ()=>{ clearInterval(id); document.removeEventListener("visibilitychange",onVis); };
  // eslint-disable-next-line react-hooks/exhaustive-deps
  },[profile?.id, suplPlan, avisoNuevoPlan, avisoRegistro, avisoSupl]);

  // Completar un suplemento/medicación desde el pop-up: marca el día, suma
  // +5 gemas y lo registra en daily_logs (clave 'supl|Nombre', solo seguimiento
  // — NUNCA afecta a la racha ni a las misiones diarias).
  const marcarSuplHome = useCallback((item)=>{
    if(!profile?.id || !item) return;
    const hoy=toKey();
    const hk=suplHechosKey(profile.id,hoy);
    const hechos=lsGet(hk,{});
    if(hechos[item.nombre]) return;
    lsSet(hk,{...hechos,[item.nombre]:true});
    const key=`gbh:logs:${profile.id}`;
    const arr=lsGet(key,[]);
    const i=arr.findIndex(l=>l.date===hoy);
    const cur=i>=0?arr[i]:{profile_id:profile.id,date:hoy,diet:false,steps:false,hydration:false,sleep:false,sc:0,meals:{},note:""};
    const meals={...(cur.meals||{}),[`supl|${item.nombre}`]:"hecho"};
    const entry={...cur,meals};
    if(i>=0)arr[i]=entry;else arr.push(entry);
    try{ lsSet(key,arr); }catch{}
    setLogs(ls=>{ const n=[...ls]; const j=n.findIndex(l=>l.date===hoy);
      if(j>=0)n[j]={...n[j],meals}; else n.push(entry); return n; });
    sbReq("POST","daily_logs?on_conflict=profile_id,log_date",{profile_id:profile.id,log_date:hoy,meals_log:meals});
    addXG(0,5);
    sfx("missionDone");
    showT({icon:SUPL_IC[item.tipo]||'💊',title:lang==='en'?'Done! +5 💎':'¡Completado! +5 💎',
           sub:item.nombre});
  // eslint-disable-next-line react-hooks/exhaustive-deps
  },[profile?.id, addXG]);

  // La racha/misión de dieta se completa cuando TODAS las tomas de la pauta están
  // registradas — sea cual sea el estado (seguida, menos, cambiada, fuera, saltada).
  // Registrar con honestidad cuenta: lo que rompe la racha es NO registrar.
  const chkTomasCompletas = useCallback((meals)=>{
    if(!tomasHoy || tLog.diet) return;
    if(tomasHoy.every(tm=>meals && meals[tm])) toggleM("diet");
  },[tomasHoy, tLog.diet, toggleM]);

  // Tap en un mini-botón de toma desde Inicio:
  //  · toma sin registrar → se marca "seguida" (verde) al instante
  //  · toma ya registrada → abre el plan diario para ver/editar el registro
  const marcarTomaHome = useCallback((toma)=>{
    if(!profile?.id) return;
    const today=toKey();
    const key=`gbh:logs:${profile.id}`;
    const arr=lsGet(key,[]);
    const i=arr.findIndex(l=>l.date===today);
    const cur=i>=0?arr[i]:{profile_id:profile.id,date:today,diet:false,steps:false,hydration:false,sleep:false,sc:0,meals:{},note:""};
    if(cur.meals?.[toma]){ sfx("tap"); setTab("plan"); return; }
    const meals={...(cur.meals||{}),[toma]:"seguida"};
    const entry={...cur,meals};
    if(i>=0)arr[i]=entry;else arr.push(entry);
    try{ lsSet(key,arr); }catch{}
    setLogs(ls=>{ const n=[...ls]; const j=n.findIndex(l=>l.date===today);
      if(j>=0)n[j]={...n[j],meals}; else n.push(entry); return n; });
    sfx("missionDone");
    sbReq("POST","daily_logs?on_conflict=profile_id,log_date",{profile_id:profile.id,log_date:today,meals_log:meals});
    chkTomasCompletas(meals);
  },[profile?.id, chkTomasCompletas]);

  // Callback para PlanTab: cuando el paciente registra una comida de HOY desde el
  // plan diario, Inicio se actualiza al momento y se comprueba si cierra la racha.
  const onMealRegistered = useCallback((dateKey, meals)=>{
    if(dateKey!==toKey()) return;
    setLogs(ls=>{ const n=[...ls]; const j=n.findIndex(l=>l.date===dateKey);
      if(j>=0)n[j]={...n[j],meals};
      else n.push({profile_id:profile?.id,date:dateKey,diet:false,steps:false,hydration:false,sleep:false,sc:0,meals,note:""});
      return n; });
    chkTomasCompletas(meals);
  },[chkTomasCompletas, profile?.id]);

  const updSteps=useCallback(async(val)=>{
    const sc=Math.max(0,Math.min(99999,val));setSteps(sc);
    const done=sc>=10000;
    if(done!==tLog.steps){const nl={...tLog,steps:done};setTLog(nl);await saveLog(nl,sc);if(done){sfx("missionDone");await addXG(5,2);showT({icon:"👟",title:"¡10.000 pasos!",sub:"Meta de pasos alcanzada ✅"});}}
    else{ sfx("step"); await saveLog(tLog,sc); }
  },[tLog,saveLog,addXG]);

  const saveW=async(isEdit=false)=>{
    const val=parseFloat(wInput);if(!isWeekend()||isNaN(val)||val<20||val>300)return;
    // El pesaje es SEMANAL: si ya hay uno este finde (p.ej. el sábado), editamos
    // esa misma fila —no creamos una nueva el domingo— y reescribimos su fecha real.
    const existing=weekendWeighIn(weights);
    const targetDate=existing?existing.date:toKey();
    const alreadyLogged=!!existing;
    const nw=weights.filter(w=>w.date!==targetDate);
    nw.push({date:targetDate,weight:val});nw.sort((a,b)=>a.date>b.date?1:-1);
    setWeights(nw);lsSet(`gbh:weights:${profile.id}`,nw);setWInput("");
    // on_conflict → editar sobrescribe la fila (profile_id+log_date) en vez de duplicarla.
    await sbReq("POST","weight_logs?on_conflict=profile_id,log_date",{profile_id:profile.id,log_date:targetDate,weight_kg:val});
    // Solo dar XP/gemas la primera vez, no en ediciones
    if(!alreadyLogged&&!isEdit){
      sfx("coin");
      await addXG(10,5);
      if(nw.length>=4){const l4=nw.slice(-4).map(w=>w.weight);const ma=l4.reduce((a,b)=>a+b,0)/4;if(val<ma){setConfetti(true);setTimeout(()=>setConfetti(false),2400);showT({icon:"📉",title:"¡Tendencia bajando!",sub:"La línea va en la dirección correcta 💚"});}}
      await chkBadges(streak,nw,badges);
    }
    // Tras guardar: ir directamente a la gráfica (modo vista)
    setWeightMode("chart");
  };

  const saveUserPhoto = (b64) => {
    // Comprimir a máx 256×256 antes de guardar (evita exceder cuota localStorage)
    const img = new Image();
    img.onload = () => {
      const MAX = 256;
      const scale = Math.min(MAX/img.width, MAX/img.height, 1);
      const w = Math.round(img.width  * scale);
      const h = Math.round(img.height * scale);
      const canvas = document.createElement("canvas");
      canvas.width = w; canvas.height = h;
      canvas.getContext("2d").drawImage(img, 0, 0, w, h);
      const compressed = canvas.toDataURL("image/jpeg", 0.72);
      setUserPhoto(compressed);
      lsSet("gbh:userPhoto", compressed);
      // Guardar también en Supabase para que sobreviva a borrados de caché
      if(profile?.id) sbReq("PATCH",`profiles?id=eq.${profile.id}`,{avatar_b64:compressed});
    };
    img.src = b64;
  };

  const saveProfileField = async (field, val) => {
    if(!profile) return;
    let updated = {...profile};
    if(field==="name")  updated.name  = val.trim();
    if(field==="email") updated.email = val.trim().toLowerCase();
    if(field==="goal"){
      const g = parseFloat(val);
      if(!isNaN(g)&&g>20&&g<300) updated.goal_weight=g;
    }
    if(field==="height"){
      const h = parseInt(val,10);
      if(!isNaN(h)&&h>=100&&h<=250) updated.height_cm=h;
    }
    if(field==="weight"){
      const w = parseFloat(val);
      if(!isNaN(w)&&w>20&&w<300){
        updated.initial_weight = w;
        const nw = weights.filter(x=>!x.isInitial);
        // Mantener la fecha original del punto inicial si ya existe
        const existingInitDate = weights.find(x=>x.isInitial)?.date || toKey();
        nw.unshift({date:existingInitDate,weight:w,isInitial:true});
        setWeights(nw);
        lsSet(`gbh:weights:${profile.id}`, nw);
        await sbReq("POST","weight_logs?on_conflict=profile_id,log_date",{profile_id:profile.id,log_date:existingInitDate,weight_kg:w});
      }
    }
    setProfile(updated);
    lsSet(`gbh:p:${updated.id}`, updated);
    await sbReq("PATCH",`profiles?id=eq.${profile.id}`,{name:updated.name,email:updated.email,initial_weight:updated.initial_weight,goal_weight:updated.goal_weight||null,height_cm:updated.height_cm||null});
  };

  const loadRanking = async () => {
    setRankLoading(true);
    // Ranking usa anon key directamente — política profiles_select_for_ranking USING(true)
    const rankFetch = async (path) => {
      try {
        const r = await fetch(`${SB}/rest/v1/${path}`, {
          method: "GET",
          headers: { "apikey": KEY, "Authorization": `Bearer ${KEY}`, "Content-Type": "application/json" }
        });
        if(!r.ok) return null;
        return r.json();
      } catch { return null; }
    };
    let data = await rankFetch("profiles?select=id,name,xp,gems,streak,initial_weight,bo_nombre,bo_color,bo_equipados&order=xp.desc&limit=50");
    // Fallbacks: sin columnas de Bo (SQL aún no ejecutado) → sin streak
    if(data===null){
      data = await rankFetch("profiles?select=id,name,xp,gems,streak,initial_weight&order=xp.desc&limit=50");
    }
    if(data===null){
      data = await rankFetch("profiles?select=id,name,xp,gems,initial_weight&order=xp.desc&limit=50");
    }
    if(data!==null && !data.length){
      console.warn("[ranking] profiles devolvió 0 filas — revisa la política RLS de SELECT (profiles_select_for_ranking USING(true))");
    }
    if(data?.length){
      // Pesos desde Supabase: weight_logs de todos los perfiles del ranking
      const ids=data.map(p=>p.id).join(",");
      const wLogs=await rankFetch(`weight_logs?profile_id=in.(${ids})&select=profile_id,weight_kg,log_date&order=log_date.asc`)||[];
      const enriched = data.map(p=>{
        // Racha: viene del campo streak de Supabase
        const streak = p.streak || 0;
        // Peso: initial_weight del perfil + último registro en weight_logs
        const pW=wLogs.filter(w=>w.profile_id===p.id);
        const initW=p.initial_weight??null;
        // Colapsar por fecha (1 valor por día) y tomar el peso del día MÁS RECIENTE.
        // Robusto si quedaran filas duplicadas del mismo día por ediciones antiguas.
        const byDate={}; pW.forEach(w=>{ byDate[w.log_date]=w.weight_kg; });
        const dKeys=Object.keys(byDate).sort();
        const lastW=dKeys.length?byDate[dKeys[dKeys.length-1]]:null;
        const weightDiff=(initW!==null&&lastW!==null)?parseFloat((lastW-initW).toFixed(1)):null;
        const weightAbs=weightDiff!==null?Math.abs(weightDiff):0;
        return {...p, streak, weightDiff, weightAbs};
      });
      // 🎮 Puntos de juego de la semana en curso
      const jr = await rankFetch("v_ranking_juego_semanal?select=profile_id,puntos_semana")||[];
      const jMap = {}; (Array.isArray(jr)?jr:[]).forEach(r=>{ jMap[r.profile_id]=r.puntos_semana||0; });
      enriched.forEach(p=>{ p.juegoPts = jMap[p.id]||0; });
      enriched.sort((a,b)=>b.weightAbs-a.weightAbs||(b.xp||0)-(a.xp||0));
      setRanking(enriched);
    } else {
      // Fallback: solo perfiles en localStorage
      const local = Object.keys(localStorage)
        .filter(k=>k.startsWith("gbh:p:"))
        .map(k=>lsGet(k,{}))
        .filter(p=>p.id&&p.name);
      const enriched = local.map(p=>{
        const logs = lsGet(`gbh:logs:${p.id}`,[]);
        let streak=0;const d=new Date();
        while(true){if(logs.find(l=>l.date===toKey(d)&&l.diet)){streak++;d.setDate(d.getDate()-1);}else break;}
        const wLogs2 = lsGet(`gbh:weights:${p.id}`,[]);
        const initE = wLogs2.find(w=>w.isInitial);
        const lastE = wLogs2.filter(w=>!w.isInitial).slice(-1)[0];
        const iW = initE?.weight ?? p.initial_weight ?? null;
        const lW2 = lastE?.weight ?? null;
        const wDiff2 = (iW!==null&&lW2!==null) ? parseFloat((lW2-iW).toFixed(1)) : null;
        return {...p, streak, weightDiff:wDiff2, weightAbs:wDiff2!==null?Math.abs(wDiff2):0};
      }).sort((a,b)=>(b.xp||0)-(a.xp||0));
      enriched.sort((a,b)=>b.weightAbs-a.weightAbs||(b.xp||0)-(a.xp||0));
      setRanking(enriched);
    }
    setRankLoading(false);
  };

  const onQuizComplete = async (xpG, gemG) => {
    const today = toKey();
    lsSet("gbh:quiz:"+profile.id+":"+today, true);
    setQuizDone(true);
    // Persistir en Supabase para que sobreviva a borrados de caché
    sbReq("POST","daily_logs?on_conflict=profile_id,log_date",{profile_id:profile.id,log_date:today,quiz_done:true});
    await addXG(xpG, gemG);
  };

  const onChestCollect = async (xpG, gemG) => {
    lsSet("gbh:chestLastOpened", streak);
    setChestOpened(streak);
    patchWeeklyState(profile.id, mergeWeeklyState(profile.id, { chestStreakLast: streak }));
    await addXG(xpG, gemG);
  };

  const subscribeNotifications = async () => {
    lsSet("gbh:notifAsked", true);
    setNotifPermission(true);
    setShowNotifBanner(false);
    if(typeof window.OneSignalDeferred !== "undefined"){
      window.OneSignalDeferred.push(async (OneSignal)=>{
        await OneSignal.Notifications.requestPermission();
        // Asegura la suscripción (opt-in) una vez concedido el permiso. Sin esto,
        // según el navegador el permiso puede quedar concedido pero el usuario
        // sin suscribir, y OneSignal no tendría a quién enviar.
        try { await OneSignal.User.PushSubscription.optIn(); } catch(e){}
        // Enviar tags del usuario para segmentar notificaciones
        if(profile){
          await OneSignal.User.addTags({
            name:   profile.name||"",
            streak: String(streak||0),
            level:  String(lv?.l||1),
          });
        }
      });
    }
  };

  const dismissNotifBanner = () => {
    lsSet("gbh:notifAsked", true);
    setNotifPermission(true);
    setShowNotifBanner(false);
  };

  const claimChallenge = async (ch) => {
    const {w,y}=getISOWeek();
    const key=`gbh:challenges:${y}:${w}`;
    if(claimedChallenges.includes(ch.id)) return; // anti doble-tap
    const claimed=[...claimedChallenges,ch.id];
    setClaimedChallenges(claimed);
    lsSet(key,claimed);
    // Persistir en Supabase: sobrevive a borrados de caché (anti-farmeo)
    patchWeeklyState(profile.id, mergeWeeklyState(profile.id, { challenges: { [`${y}:${w}`]: claimed } }));
    await addXG(ch.xp, ch.gems);
  };

  const onRuletaCollect = async (xpG, gemG) => {
    sfx("ruletteWin");
    const today = toKey();
    lsSet("gbh:ruleta:"+profile.id+":"+today, true);
    setRuletaDone(true);
    // Persistir en Supabase para que sobreviva a borrados de caché
    sbReq("POST","daily_logs?on_conflict=profile_id,log_date",{profile_id:profile.id,log_date:today,ruleta_done:true});
    await addXG(xpG, gemG);
  };

  const onWeekChestCollect = async (xpG, gemG) => {
    const {w,y} = getISOWeek();
    lsSet(`gbh:weekChest:${y}:${w}`, true);
    patchWeeklyState(profile.id, mergeWeeklyState(profile.id, { weekChest: { [`${y}:${w}`]: true } }));
    await addXG(xpG, gemG);
  };

  const tapSheep=()=>{const n=taps+1;setTaps(n);if(tapRef.current)clearTimeout(tapRef.current);tapRef.current=setTimeout(()=>setTaps(0),2500);if(n>=5){setPinVal("");setPinErr(false);setPinGate(true);setTaps(0);}};
  const GBH_ADMIN_PIN="5895";
  const pinTecla=(d)=>{
    if(pinErr)setPinErr(false);
    const v=(pinVal+d).slice(0,4);
    setPinVal(v);
    if(v.length===4){
      if(v===GBH_ADMIN_PIN){setPinGate(false);setPinVal("");setScreen("admin");loadAdmin();}
      else{setPinErr(true);setTimeout(()=>{setPinVal("");},350);}
    }
  };
  const loadAdmin=async()=>{
    const d=await sbReq("GET","admin_overview?select=*")||[];
    // Plan de servicio por paciente (premium/standard) para el filtro del panel
    try{
      const pl=await sbReq("GET","profiles?select=id,plan");
      if(Array.isArray(pl)) setPlanAdmin(Object.fromEntries(pl.map(x=>[x.id,x.plan||'standard'])));
    }catch(e){/* sin plan: todos salen como Normal */}
    if(d.length){ setAllP(d); }
    else { setAllP(Object.keys(localStorage).filter(k=>k.startsWith("gbh:p:")).map(k=>lsGet(k,{})).filter(p=>p.id)); }
    // Cumplimiento por comida de hoy + última nota (de los últimos 8 días) por paciente
    try{
      const desde=(()=>{const x=new Date();x.setDate(x.getDate()-8);return toKey(x);})();
      const rows=await sbReq("GET",`daily_logs?log_date=gte.${desde}&select=profile_id,log_date,meals_log,day_note&order=log_date.desc`);
      if(Array.isArray(rows)){
        const hoy=toKey(); const m={};
        rows.forEach(r=>{ const id=r.profile_id; if(!id) return; if(!m[id]) m[id]={hoyMeals:null,nota:null,notaFecha:null};
          if(r.log_date===hoy && r.meals_log && m[id].hoyMeals===null) m[id].hoyMeals=r.meals_log;
          if(r.day_note && String(r.day_note).trim() && !m[id].nota){ m[id].nota=String(r.day_note).trim(); m[id].notaFecha=r.log_date; }
        });
        setLogsAdmin(m);
      }
    }catch{}
  };
  const buyShield=async()=>{if(gems<200){sfx("error");showT({icon:"💎",title:t("insufficientGems"),sub:t("needGemsShield")});return;}const u={...profile,gems:gems-200,shields:(profile.shields||0)+1};setProfile(u);lsSet(`gbh:p:${u.id}`,u);await sbReq("PATCH",`profiles?id=eq.${profile.id}`,{gems:u.gems,shields:u.shields});sfx("shield");showT({icon:"🛡️",title:t("shieldActivated"),sub:t("shieldProtected")});};

  const saveRecipeToBook = async () => {
    if(!dailyRecipe||!profile) return;
    if(gems < 20){ sfx("error"); showT({icon:"💎",title:t("insufficientGems"),sub:lang==="en"?"You need 20 💎 to save a recipe":"Necesitas 20 💎 para guardar una receta"}); return; }
    const alreadySaved = savedRecipes.some(r => r.recipe_id === dailyRecipe.id_receta);
    if(alreadySaved) return;
    // Descontar gemas
    const newGems = gems - 20;
    const updP = {...profile, gems: newGems};
    setProfile(updP); lsSet(`gbh:p:${profile.id}`, updP);
    sbReq("PATCH", `profiles?id=eq.${profile.id}`, {gems: newGems});
    // Guardar receta
    const entry = {
      profile_id: profile.id,
      recipe_id: dailyRecipe.id_receta,
      nombre: dailyRecipe.nombre,
      tipo: dailyRecipe.tipo,
      calorias: dailyRecipe.calorias,
      proteinas_g: dailyRecipe.proteinas_g,
      hidratos_g: dailyRecipe.hidratos_g,
      grasas_g: dailyRecipe.grasas_g,
      ingredientes: dailyRecipe.ingredientes,
      instrucciones: dailyRecipe.instrucciones,
      raciones: dailyRecipe.raciones||1,
      saved_at: new Date().toISOString(),
    };
    const newSaved = [entry, ...savedRecipes];
    setSavedRecipes(newSaved);
    lsSet(`gbh:saved_recipes:${profile.id}`, newSaved);
    await sbReq("POST", "saved_recipes", entry);
    sfx("recipe");
    showT({icon:"📖", title:t("recipeSavedToast"), sub:dailyRecipe.nombre});
  };

  const removeFromBook = async (recipeId) => {
    const newSaved = savedRecipes.filter(r => r.recipe_id !== recipeId);
    setSavedRecipes(newSaved);
    lsSet(`gbh:saved_recipes:${profile.id}`, newSaved);
    await sbReq("DELETE", `saved_recipes?profile_id=eq.${profile.id}&recipe_id=eq.${recipeId}`);
  };

  const deleteAccount = async () => {
    if(!profile) return;
    const id = profile.id;
    const email = profile.email;
    // 1. Borrar en Supabase (orden: logs → logros → pesos → perfil)
    await sbReq("DELETE", `daily_logs?profile_id=eq.${id}`);
    await sbReq("DELETE", `achievements?profile_id=eq.${id}`);
    await sbReq("DELETE", `weight_logs?profile_id=eq.${id}`);
    await sbReq("DELETE", `profiles?id=eq.${id}`);
    // 2. Borrar todas las claves del usuario en localStorage
    const keysToDelete = Object.keys(localStorage).filter(k =>
      k.startsWith(`gbh:logs:${id}`) ||
      k.startsWith(`gbh:weights:${id}`) ||
      k.startsWith(`gbh:badges:${id}`) ||
      k.startsWith(`gbh:p:${id}`) ||
      k === `gbh:em:${email}` ||
      k === "gbh:lastEmail" ||
      k === "gbh:userPhoto" ||
      k === "gbh:mute" ||
      k === "gbh:lang" ||
      k.startsWith("gbh:tlog:") ||
      k.startsWith("gbh:recipe:") ||
      k.startsWith("gbh:quiz:") ||
      k.startsWith("gbh:ruleta") ||
      k.startsWith("gbh:weekXP:") ||
      k.startsWith("gbh:weekChest:") ||
      k.startsWith("gbh:challenges:") ||
      k === getQueueKey() || k === QUEUE_KEY_BASE
    );
    keysToDelete.forEach(k => { try { localStorage.removeItem(k); } catch {} });
    // 3. Resetear estado y volver al registro
    setProfile(null);
    setLogs([]);
    setWeights([]);
    setBadges([]);
    setTLog({diet:false,steps:false,hydration:false,sleep:false});
    window.__gbhUID="";
    setShowPhotoPicker(false);
    _activeProfileId = null; // desactivar la cola del usuario que sale
    setScreen("landing");
  };

  const CSS=`
    @import url('https://fonts.googleapis.com/css2?family=Nunito:wght@600;700;800;900&family=DM+Sans:wght@400;500;700&display=swap');
    *{box-sizing:border-box;margin:0;padding:0}body{background:${T.bg};font-family:'Nunito',sans-serif;overflow-x:hidden;}
    @keyframes aura{0%,100%{opacity:0.5;transform:scale(1)}50%{opacity:1;transform:scale(1.08)}}
    @keyframes float{0%,100%{transform:translateY(0)}50%{transform:translateY(-9px)}}
    @keyframes bounce{0%,100%{transform:translateY(0) rotate(-3deg)}40%{transform:translateY(-16px) rotate(3deg)}65%{transform:translateY(-6px) rotate(-1deg)}} @keyframes headTilt{0%,100%{transform:rotate(-4deg)}50%{transform:rotate(4deg)}}
    @keyframes popIn{0%{transform:scale(0.65);opacity:0}100%{transform:scale(1);opacity:1}}
    @keyframes tomaBob{0%,100%{transform:translateY(0)}50%{transform:translateY(-3px)}}
    @keyframes slideUp{from{transform:translateY(80px);opacity:0}to{transform:translateY(0);opacity:1}}
    @keyframes bounceIn{0%{transform:scale(0.5);opacity:0}60%{transform:scale(1.15)}80%{transform:scale(0.95)}100%{transform:scale(1);opacity:1}}
    @keyframes slideInLeft{from{transform:translateX(-24px);opacity:0}to{transform:translateX(0);opacity:1}}
    @keyframes confettiFall{0%{transform:translateY(-20px) rotate(0deg);opacity:1}100%{transform:translateY(100vh) rotate(720deg);opacity:0}}
    @keyframes pulse{0%,100%{box-shadow:0 0 0 0 rgba(255,200,0,0.55)}50%{box-shadow:0 0 0 10px rgba(255,200,0,0)}}
    @keyframes confettiFall{to{transform:translateY(110vh) rotate(800deg);opacity:0}}
    @keyframes glow{0%,100%{box-shadow:0 6px 0 ${T.g3},0 0 18px rgba(88,204,2,0.35)}50%{box-shadow:0 6px 0 ${T.g3},0 0 38px rgba(88,204,2,0.8)}}
    @keyframes wobble{0%,100%{transform:rotate(-8deg)}50%{transform:rotate(8deg)}}
    @keyframes fadeInOut{0%{opacity:0}10%{opacity:1}75%{opacity:1}100%{opacity:0}}
    @keyframes fadeIn{from{opacity:0}to{opacity:1}}
    @keyframes scaleIn{0%{transform:scale(0.5);opacity:0}100%{transform:scale(1);opacity:1}}
    @keyframes zFloat{0%{transform:translateY(0);opacity:1}100%{transform:translateY(-24px);opacity:0}}
    @keyframes spin{from{transform:rotate(0deg)}to{transform:rotate(360deg)}} @keyframes breathe{0%,100%{transform:scale(1)}50%{transform:scale(1.025)}} @keyframes breatheSlow{0%,100%{transform:scale(1) rotate(-1deg)}50%{transform:scale(0.98) rotate(1deg)}} @keyframes float{0%,100%{transform:translateY(0)}50%{transform:translateY(-8px)}}
    @keyframes slideDown{from{transform:translateY(-100%);opacity:0}to{transform:translateY(0);opacity:1}} @keyframes slideUp{from{transform:translateY(100%);opacity:0}to{transform:translateY(0);opacity:1}} @keyframes slideUp{from{transform:translateY(0);opacity:1}to{transform:translateY(-100%);opacity:0}}
    @keyframes rouletteSpin{from{transform:rotate(0deg)}to{transform:rotate(360deg)}}
    @keyframes chestShake{0%,100%{transform:rotate(-8deg) scale(1.05)}50%{transform:rotate(8deg) scale(1.1)}}
    @keyframes floatUp{0%{transform:translateY(0);opacity:1}80%{opacity:1}100%{transform:translateY(-90px);opacity:0}}
    @keyframes sparkle0{0%,100%{opacity:1;transform:scale(1) rotate(0deg)}50%{opacity:0.5;transform:scale(1.3) rotate(20deg)}}
    @keyframes sparkle1{0%,100%{opacity:0.7;transform:scale(0.9)}50%{opacity:1;transform:scale(1.2)}}
    @keyframes sparkle2{0%,100%{opacity:1;transform:scale(1.1) rotate(-15deg)}50%{opacity:0.6;transform:scale(0.8) rotate(15deg)}}
    input::placeholder{color:rgba(255,255,255,0.22)}input:focus{outline:none!important;border-color:rgba(88,204,2,0.75)!important}
    ::-webkit-scrollbar{width:0}button:active{transform:scale(0.94)!important;transition:transform 0.08s!important}
    .nav-scroll::-webkit-scrollbar{display:none}.nav-scroll{scrollbar-width:none;-ms-overflow-style:none;}
    .gbh-select{width:100%;background:rgba(255,255,255,0.07);border:2px solid rgba(139,100,60,0.5);border-radius:14px;padding:14px 16px;color:#F7F0E0;font-size:15px;font-weight:700;font-family:'DM Sans',sans-serif;-webkit-appearance:none;appearance:none;cursor:pointer;outline:none;background-image:url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='12' height='8' viewBox='0 0 12 8'%3E%3Cpath d='M1 1l5 5 5-5' stroke='%23FFC800' stroke-width='2' fill='none' stroke-linecap='round'/%3E%3C/svg%3E");background-repeat:no-repeat;background-position:right 16px center;}
    .gbh-select:focus{border-color:rgba(88,204,2,0.75);}
    .gbh-select option{background:#152210;color:#F7F0E0;}
    input[type=range].gbh-slider{-webkit-appearance:none;appearance:none;width:100%;height:8px;border-radius:8px;background:rgba(255,255,255,0.15);outline:none;cursor:pointer;margin:14px 0;}
    input[type=range].gbh-slider::-webkit-slider-thumb{-webkit-appearance:none;appearance:none;width:28px;height:28px;border-radius:50%;background:linear-gradient(135deg,#58CC02,#89E219);box-shadow:0 3px 8px rgba(0,0,0,0.5),0 0 0 3px #2B7A00;cursor:pointer;}
    input[type=range].gbh-slider::-moz-range-thumb{width:28px;height:28px;border-radius:50%;background:linear-gradient(135deg,#58CC02,#89E219);box-shadow:0 3px 8px rgba(0,0,0,0.5),0 0 0 3px #2B7A00;cursor:pointer;border:none;}
    input[type=range].gbh-slider::-webkit-slider-runnable-track{height:8px;border-radius:8px;background:rgba(255,255,255,0.15);}
    input[type=range].gbh-slider::-moz-range-track{height:8px;border-radius:8px;background:rgba(255,255,255,0.15);}
    input[type=range].gbh-slider-sm{-webkit-appearance:none;appearance:none;width:100%;height:6px;border-radius:6px;background:rgba(255,255,255,0.15);outline:none;cursor:pointer;margin:10px 0;}
    input[type=range].gbh-slider-sm::-webkit-slider-thumb{-webkit-appearance:none;appearance:none;width:22px;height:22px;border-radius:50%;background:linear-gradient(135deg,#58CC02,#89E219);box-shadow:0 2px 6px rgba(0,0,0,0.5),0 0 0 2px #2B7A00;cursor:pointer;}
    input[type=range].gbh-slider-sm::-moz-range-thumb{width:22px;height:22px;border-radius:50%;background:linear-gradient(135deg,#58CC02,#89E219);box-shadow:0 2px 6px rgba(0,0,0,0.5),0 0 0 2px #2B7A00;cursor:pointer;border:none;}
  `;

  // Cargar ranking cuando se activa la pestaña
  useEffect(()=>{ if(tab==="ranking") loadRanking(); },[tab]);
  useEffect(()=>{ if(tab==="receta"&&!dailyRecipe&&!recipeLoading) fetchDailyRecipe(); },[tab]);
  useEffect(()=>{ if(tab==="receta"){ setRecipeView("menu"); setCompletoCat(null); setBusqTexto(""); setBusqResults(null); setBusqLoading(false); } },[tab]);
  // Cuenta de recetas por categoría (consulta ligera: solo tipo+categoria, una vez).
  // Se muestra en los botones del recetario y como total, y se actualiza sola al
  // crecer el recetario porque cuenta lo que hay en Supabase.
  useEffect(()=>{
    if(tab!=="receta" || recCountsRef.current) return;
    recCountsRef.current = true;
    (async()=>{
      try{
        const data = await sbReq("GET","recipes?select=tipo,categoria&limit=1000");
        const rows = Array.isArray(data)?data:[];
        const byId = {};
        for(const cat of CATS_COMPLETO) byId[cat.id] = rows.filter(cat.match).length;
        setRecCounts({total:rows.length, byId});
      }catch(e){ recCountsRef.current=false; }  // reintentará al reentrar
    })();
  },[tab]);  // eslint-disable-line react-hooks/exhaustive-deps
  const [langSwitching, setLangSwitching] = useState(false);

  // Cambia idioma con pantalla de carga intermedia
  const switchLang = async (newLang) => {
    if(newLang === lang) return;
    setLangSwitching(true);
    // Guardar nuevo idioma
    lsSet("gbh:lang", newLang);
    setLang(newLang);
    // Limpiar caché de receta para forzar re-fetch en nuevo idioma
    const todayKey = toKey();
    lsSet(`gbh:recipe:${todayKey}`, null);
    lsSet(`gbh:recipe:current:${todayKey}`, null);
    // Limpiar receta en estado para que se recargue
    setDailyRecipe(null);
    // Pequeña pausa para que la pantalla de carga sea visible
    await new Promise(r => setTimeout(r, 800));
    setLangSwitching(false);
    // Si estamos en la pestaña de receta, recargar
    if(tab === "receta") fetchDailyRecipe();
  };

  const tabSt=(a)=>({flex:1,padding:"10px 0 8px",background:"none",border:"none",color:a?T.au1:T.t2,fontSize:9,fontWeight:a?900:700,cursor:"pointer",display:"flex",flexDirection:"column",alignItems:"center",gap:3,textTransform:"uppercase",letterSpacing:"0.07em",transition:"all 0.18s",fontFamily:"'Nunito',sans-serif"});
  const inp={width:"100%",background:"rgba(255,255,255,0.07)",border:`2px solid ${T.bW}`,borderRadius:16,padding:"15px 18px",color:T.cr,fontSize:16,fontWeight:700,fontFamily:"'DM Sans',sans-serif"};

  // ── INSTAGRAM IN-APP BROWSER DETECTION ───────────────────────────────────────
  // Instagram (y Facebook) abren los enlaces en su propio webview, que tiene un
  // localStorage aislado del navegador real. Esto causa que los datos del usuario
  // no estén disponibles y la sesión parezca vacía.
  // Solución: detectar el IAB y mostrar una pantalla que invite a abrir en Safari/Chrome.
  const isInstagramIAB = useMemo(() => {
    const ua = navigator.userAgent || "";
    return /Instagram|FBAN|FBAV|FB_IAB|FB4A|FBIOS/.test(ua);
  }, []);

  if (isInstagramIAB) {
    const currentUrl = window.location.href;
    const isIOS = /iPhone|iPad|iPod/.test(navigator.userAgent);
    const isAndroid = /Android/.test(navigator.userAgent);

    // En iOS: el esquema x-safari-https:// fuerza abrir en Safari
    // En Android: el intent:// es más fiable pero no universal; usamos el link directo
    // Añadimos ?install=1 para que al llegar al navegador real se muestre el modal PWA
    const openInBrowser = () => {
      const installUrl = (() => {
        try {
          const u = new URL(currentUrl);
          u.searchParams.set("install", "1");
          return u.toString();
        } catch { return currentUrl + (currentUrl.includes("?") ? "&" : "?") + "install=1"; }
      })();
      if (isIOS) {
        window.location.href = installUrl.replace(/^https?:\/\//, "x-safari-https://");
        setTimeout(() => {
          try { navigator.clipboard.writeText(installUrl); } catch {}
        }, 800);
      } else if (isAndroid) {
        window.location.href =
          "intent://" +
          installUrl.replace(/^https?:\/\//, "") +
          "#Intent;scheme=https;package=com.android.chrome;end";
      } else {
        try { navigator.clipboard.writeText(installUrl); } catch {}
      }
    };

    // Frases de broma para salir del IAB, rotando según el segundo actual
    const jokes = lang === "en" ? [
      { title: "Instagram, not today 🐑", sub: "My sheep refuses to live inside a social network." },
      { title: "Wrong door! 🚪", sub: "Your data is waiting for you in a real browser. Let's go." },
      { title: "Houston, we have a browser 🚀", sub: "Instagram is cool but your progress lives elsewhere." },
      { title: "Escape from Instagram! 🏃", sub: "One tap and your sheep is free." },
    ] : [
      { title: "Instagram, hoy no 🐑", sub: "Mi oveja se niega a vivir dentro de una red social." },
      { title: "Tu objetivo está a un solo clic ✨", sub: "Toca el botón y tu navegador abrirá la app completa: tu programación, tus recetas y tu progreso." },
      { title: "¡Ya casi estás dentro! 🌱", sub: "Un último paso: entra desde tu navegador y tendrás tu plan de nutrición al completo." },
      { title: "Bo ya te está esperando 🐑", sub: "Tu plan semanal, tus recetas y tu propia mascota viven en la app. Toca y entra." },
    ];
    const joke = jokes[new Date().getSeconds() % jokes.length];

    return (
      <LangCtx.Provider value={lang}>
        <div style={{
          fontFamily: "'Nunito',sans-serif",
          background: `radial-gradient(ellipse at top, #1A3A10, ${T.bg})`,
          minHeight: "100vh", maxWidth: 420, margin: "0 auto",
          display: "flex", flexDirection: "column",
          alignItems: "center", justifyContent: "center",
          padding: "32px 24px", color: T.t1, textAlign: "center",
        }}>
          <style>{CSS}</style>

          <Sheep estado="feliz" equipados={[]} color="blanca" size={140} />

          <div style={{ marginTop: 24, marginBottom: 10, fontSize: 26, fontWeight: 900, color: T.wh, lineHeight: 1.3 }}>
            {joke.title}
          </div>

          <div style={{
            fontSize: 14, color: T.t2,
            fontFamily: "'DM Sans',sans-serif",
            lineHeight: 1.6, marginBottom: 36, maxWidth: 280,
          }}>
            {joke.sub}
          </div>

          <button
            onClick={openInBrowser}
            style={{
              width: "100%", maxWidth: 320,
              padding: "18px 24px", borderRadius: 20,
              border: `3px solid ${T.g3}`,
              background: `linear-gradient(135deg,${T.g1},${T.g2})`,
              color: "white", fontSize: 17, fontWeight: 900,
              cursor: "pointer",
              boxShadow: `0 8px 0 ${T.g3}`,
              fontFamily: "'Nunito',sans-serif",
              display: "flex", alignItems: "center", justifyContent: "center", gap: 10,
              animation: "glow 2.5s ease-in-out infinite",
            }}
          >
            <span style={{ fontSize: 22 }}>{isIOS ? "🧭" : "🌐"}</span>
            {lang === "en"
              ? (isIOS ? "Open in Safari" : "Open in Chrome")
              : "🚀 Entrar en GBH Nutrición"}
          </button>
        </div>
      </LangCtx.Provider>
    );
  }

  // ── LANG SWITCHING overlay ────────────────────────────────────────────────────
  if(langSwitching)return(
    <LangCtx.Provider value={lang}>
    <div style={{fontFamily:"'Nunito',sans-serif",background:T.bg,minHeight:"100vh",maxWidth:420,
      margin:"0 auto",display:"flex",flexDirection:"column",alignItems:"center",
      justifyContent:"center",gap:20,color:T.t1}}>
      <style>{CSS}</style>
      <div style={{fontSize:40,animation:"spin 0.8s linear infinite",display:"inline-block"}}>
        {lang==="en"?"🇬🇧":"🇪🇸"}
      </div>
      <div style={{fontSize:16,fontWeight:900,color:T.g1}}>
        {lang==="en"?"Switching to English…":"Cambiando a Español…"}
      </div>
      <div style={{width:48,height:48,border:`4px solid rgba(88,204,2,0.2)`,
        borderTopColor:T.g1,borderRadius:"50%",animation:"spin 0.8s linear infinite"}}/>
    </div>
    </LangCtx.Provider>
  );

  // ── LOADING (sesión guardada, cargando perfil) ────────────────────────────────
  if(screen==="loading")return(
    <LangCtx.Provider value={lang}>
    <div style={{fontFamily:"'Nunito',sans-serif",background:T.bg,minHeight:"100vh",maxWidth:420,
      margin:"0 auto",display:"flex",flexDirection:"column",alignItems:"center",
      justifyContent:"center",gap:20,color:T.t1}}>
      <style>{CSS}</style>
      <Mascot expr="happy" size={120}/>
      <div style={{fontSize:16,fontWeight:900,color:T.g1,letterSpacing:"0.05em"}}>{t("loading")}</div>
      <div style={{width:48,height:48,border:`4px solid rgba(88,204,2,0.2)`,
        borderTopColor:T.g1,borderRadius:"50%",animation:"spin 0.8s linear infinite"}}/>
    </div>
    </LangCtx.Provider>
  );

  // ── LANDING ───────────────────────────────────────────────────────────────────
  if(screen==="landing")return(
    <LangCtx.Provider value={lang}>
    <div style={{
      fontFamily:"'Nunito',sans-serif",
      background:`radial-gradient(ellipse at top, #1A3A10, ${T.bg})`,
      minHeight:"100vh",maxWidth:420,margin:"0 auto",
      display:"flex",flexDirection:"column",
      alignItems:"center",justifyContent:"center",
      padding:"32px 24px 40px",color:T.t1,
      overflowX:"hidden",
    }}>
      <style>{CSS}</style>

      {/* Selector de idioma — arriba derecha */}
      <div style={{position:"fixed",top:16,right:16,display:"flex",gap:6,zIndex:100}}>
        {[{code:"es",flag:"🇪🇸"},{code:"en",flag:"🇬🇧"}].map(({code,flag})=>(
          <button key={code} onClick={()=>{ lsSet("gbh:lang",code); setLang(code); }}
            style={{fontSize:20,background:lang===code?"rgba(88,204,2,0.2)":"rgba(255,255,255,0.08)",
              border:`2px solid ${lang===code?T.g1:"rgba(255,255,255,0.15)"}`,
              borderRadius:10,padding:"4px 8px",cursor:"pointer",
              boxShadow:lang===code?`0 2px 0 ${T.g3}`:"none",transition:"all 0.15s"}}>
            {flag}
          </button>
        ))}
      </div>

      {/* Mascota */}
      <div onClick={tapSheep} style={{cursor:"pointer",marginBottom:8,animation:"bounceIn 0.6s cubic-bezier(0.34,1.56,0.64,1)"}}>
        <Mascot expr="happy" size={160}/>
      </div>

      {/* Headline */}
      <h1 style={{
        fontSize:30,fontWeight:900,color:T.wh,
        textAlign:"center",margin:"0 0 10px",
        textShadow:"0 2px 16px rgba(0,0,0,0.5)",
        lineHeight:1.2,
      }}>
        {t("landingHeadline")}
      </h1>
      <p style={{
        fontSize:14,color:T.t2,textAlign:"center",
        marginBottom:28,fontFamily:"'DM Sans',sans-serif",
        lineHeight:1.5,maxWidth:300,
      }}>
        {t("landingTagline")}
      </p>

      {/* Features */}
      <div style={{width:"100%",maxWidth:360,display:"flex",flexDirection:"column",gap:10,marginBottom:28}}>
        {[
          {icon:"🥗", key:"landingF1"},
          {icon:"⚡", key:"landingF2"},
          {icon:"👑", key:"landingF3"},
          {icon:"📈", key:"landingF4"},
        ].map(({icon,key},i)=>(
          <div key={i} style={{
            display:"flex",alignItems:"center",gap:14,
            background:"rgba(255,255,255,0.05)",
            border:`1.5px solid rgba(88,204,2,0.2)`,
            borderRadius:16,padding:"13px 16px",
            animation:`slideInLeft 0.4s ${0.1+i*0.08}s both cubic-bezier(0.34,1.12,0.64,1)`,
          }}>
            <span style={{fontSize:24,flexShrink:0}}>{icon}</span>
            <span style={{fontSize:14,fontWeight:700,color:T.wh,fontFamily:"'DM Sans',sans-serif"}}>
              {t(key)}
            </span>
          </div>
        ))}
      </div>

      {/* CTA principal */}
      <button
        onClick={()=>setScreen("auth")}
        style={{
          width:"100%",maxWidth:360,
          padding:"18px 24px",
          borderRadius:20,
          border:`3px solid ${T.g3}`,
          background:`linear-gradient(135deg,${T.g1},${T.g2})`,
          color:"white",fontSize:18,fontWeight:900,
          cursor:"pointer",
          boxShadow:`0 8px 0 ${T.g3}, 0 12px 30px rgba(88,204,2,0.25)`,
          fontFamily:"'Nunito',sans-serif",
          transition:"all 0.15s",
          marginBottom:14,
        }}
        onMouseDown={e=>e.currentTarget.style.transform="scale(0.97)"}
        onMouseUp={e=>e.currentTarget.style.transform="scale(1)"}
        onTouchStart={e=>e.currentTarget.style.transform="scale(0.97)"}
        onTouchEnd={e=>e.currentTarget.style.transform="scale(1)"}
      >
        {t("landingCTA")}
      </button>

      {/* Login usuarios existentes */}
      <button
        onClick={()=>setScreen("auth")}
        style={{
          background:"none",border:"none",
          color:T.t2,fontSize:13,cursor:"pointer",
          fontFamily:"'DM Sans',sans-serif",
          padding:"8px 0",marginBottom:20,
          textDecoration:"underline",
          textDecorationColor:"rgba(255,255,255,0.2)",
        }}>
        {t("landingLogin")}
      </button>

      {/* Free badge */}
      <div style={{
        fontSize:11,color:"rgba(88,204,2,0.7)",
        fontFamily:"'DM Sans',sans-serif",
        letterSpacing:"0.05em",textAlign:"center",
        padding:"6px 16px",
        border:"1px solid rgba(88,204,2,0.2)",
        borderRadius:20,
      }}>
        {t("landingFree")}
      </div>
    </div>
    </LangCtx.Provider>
  );

  // ── AUTH ─────────────────────────────────────────────────────────────────────
  if(screen==="auth")return(
    <LangCtx.Provider value={lang}>
    <div style={{fontFamily:"'Nunito',sans-serif",background:`radial-gradient(ellipse at top,#1A3A10,${T.bg})`,minHeight:"100vh",maxWidth:420,margin:"0 auto",display:"flex",flexDirection:"column",alignItems:"center",justifyContent:"center",padding:28,color:T.t1}}>
      <style>{CSS}</style>
      {/* Selector de idioma — esquina superior derecha */}
      <div style={{position:"fixed",top:16,right:16,display:"flex",gap:6,zIndex:100}}>
        {[{code:"es",flag:"🇪🇸"},{code:"en",flag:"🇬🇧"}].map(({code,flag})=>(
          <button key={code} onClick={()=>{ lsSet("gbh:lang",code); setLang(code); }}
            style={{fontSize:20,background:lang===code?"rgba(88,204,2,0.2)":"rgba(255,255,255,0.08)",
              border:`2px solid ${lang===code?T.g1:"rgba(255,255,255,0.15)"}`,
              borderRadius:10,padding:"4px 8px",cursor:"pointer",
              boxShadow:lang===code?`0 2px 0 ${T.g3}`:"none",transition:"all 0.15s"}}>
            {flag}
          </button>
        ))}
      </div>
      <div onClick={tapSheep} style={{cursor:"pointer",marginBottom:4}}>
        <Mascot expr="happy" size={185}/>
      </div>
      <h1 style={{fontSize:32,fontWeight:900,color:T.wh,marginBottom:4,textAlign:"center",marginTop:8,textShadow:"0 2px 12px rgba(0,0,0,0.5)"}}>GBH Nutrición</h1>
      <p style={{fontSize:14,color:T.t2,marginBottom:32,textAlign:"center",fontFamily:"'DM Sans',sans-serif"}}>{t("tagline")}</p>
      <Card style={{width:"100%",maxWidth:360,marginBottom:0}}>

        <div style={{fontSize:10,color:T.au1,textTransform:"uppercase",letterSpacing:"0.1em",fontWeight:900,marginBottom:8}}>{t("email")}</div>
        <input type="email" value={aEmail}
          onChange={e=>{
            setAEmail(e.target.value);
            if(document.activeElement?.type==="email"){
              setAuthMode("new");setAuthErr("");
            }
          }}
          onBlur={e=>checkEmail(e.target.value)}
          placeholder={t("emailPH")} style={{...inp,marginBottom:authMode==="returning"?0:16}}/>

        {/* ── Usuario existente: bienvenida, entra directo (sin contraseña) ── */}
        {authMode==="returning"&&(
          <div style={{background:"rgba(88,204,2,0.12)",border:`1.5px solid ${T.g3}`,borderRadius:14,
            padding:"12px 16px",margin:"12px 0",display:"flex",alignItems:"center",gap:10}}>
            <span style={{fontSize:22}}>👋</span>
            <div>
              <div style={{fontSize:13,fontWeight:900,color:T.g2}}>{t("welcomeBack",{n:aName.split(" ")[0]})}</div>
              <div style={{fontSize:11,color:T.t2,fontFamily:"'DM Sans',sans-serif",marginTop:2}}>
                {lang==="en"?"Tap below to enter":"Pulsa abajo para entrar"}
              </div>
            </div>
          </div>
        )}

        {authMode==="checking"&&(
          <div style={{textAlign:"center",padding:"10px 0",fontSize:12,color:T.t2,fontFamily:"'DM Sans',sans-serif"}}>
            {t("checkingAccount")}
          </div>
        )}

        {authMode!=="returning"&&authMode!=="migrate"&&(<>
          <div style={{fontSize:10,color:T.au1,textTransform:"uppercase",letterSpacing:"0.1em",fontWeight:900,marginBottom:8,marginTop:4}}>{t("fullName")}</div>
          <input type="text" value={aName} onChange={e=>setAName(e.target.value)}
            placeholder={t("namePH")} style={{...inp,marginBottom:16}}/>
          <div style={{fontSize:10,color:T.au1,textTransform:"uppercase",letterSpacing:"0.1em",fontWeight:900,marginBottom:8}}>{t("currentWeight")}</div>
          <div style={{display:"flex",alignItems:"center",gap:10,marginBottom:6}}>
            <input type="number" value={aWeight} onChange={e=>setAWeight(e.target.value)}
              onKeyDown={e=>e.key==="Enter"&&doAuth()} placeholder="75.5" step="0.1" min="20" max="300"
              style={{...inp,flex:1}}/>
            <span style={{color:T.t2,fontSize:15,fontWeight:700,flexShrink:0}}>kg</span>
          </div>
          <div style={{fontSize:11,color:T.t2,fontFamily:"'DM Sans',sans-serif",marginBottom:16}}>
            {t("weightHint")}
          </div>
          <div style={{fontSize:10,color:T.au1,textTransform:"uppercase",letterSpacing:"0.1em",fontWeight:900,marginBottom:8}}>{t("goalWeight")}</div>
          <div style={{display:"flex",alignItems:"center",gap:10,marginBottom:6}}>
            <input type="number" value={aGoal} onChange={e=>setAGoal(e.target.value)}
              onKeyDown={e=>e.key==="Enter"&&doAuth()} placeholder="70.0" step="0.1" min="20" max="300"
              style={{...inp,flex:1}}/>
            <span style={{color:T.t2,fontSize:15,fontWeight:700,flexShrink:0}}>kg</span>
          </div>
          <div style={{fontSize:11,color:T.t2,fontFamily:"'DM Sans',sans-serif",marginBottom:20}}>
            {t("goalHint")}
          </div>
          {/* ── Código de invitación (referidos, opcional) ── */}
          <div style={{fontSize:10,color:T.au1,textTransform:"uppercase",letterSpacing:"0.1em",fontWeight:900,marginBottom:8}}>
            {lang==='en'?'Invitation code (optional)':'Código de invitación (opcional)'}
          </div>
          <input type="text" value={aRef} onChange={e=>setARef(e.target.value.toUpperCase())}
            onKeyDown={e=>e.key==="Enter"&&doAuth()} placeholder="GBH-XXXXX" maxLength={12}
            autoCapitalize="characters" style={{...inp,marginBottom:6}}/>
          <div style={{fontSize:11,color:T.t2,fontFamily:"'DM Sans',sans-serif",marginBottom:20}}>
            {lang==='en'?'Did a friend invite you? Enter their code and get 25 💎':'¿Te ha invitado un amigo? Pon su código y llévate 25 💎'}
          </div>
          {/* ── Sexo ── */}
          <div style={{fontSize:10,color:T.au1,textTransform:"uppercase",letterSpacing:"0.1em",fontWeight:900,marginBottom:10}}>
            {t("calcSex")}
          </div>
          <div style={{display:"flex",gap:10,marginBottom:20}}>
            {[{v:"M",l:t("calcMan"),c:"#64B5F6"},{v:"F",l:t("calcWoman"),c:"#F48FB1"}].map(({v,l,c})=>(
              <button key={v} onClick={()=>setASex(v)} type="button"
                style={{flex:1,padding:"14px 0",borderRadius:16,border:`2.5px solid ${aSex===v?c:"rgba(255,255,255,0.12)"}`,background:aSex===v?`${c}22`:"rgba(255,255,255,0.05)",color:aSex===v?c:T.t2,fontSize:15,fontWeight:900,cursor:"pointer",fontFamily:"'Nunito',sans-serif",transition:"all 0.18s",boxShadow:aSex===v?`0 4px 0 ${c}55`:"0 3px 0 rgba(0,0,0,0.4)"}}>
                {l}
              </button>
            ))}
          </div>
          {/* ── Estatura ── */}
          <div style={{fontSize:10,color:T.au1,textTransform:"uppercase",letterSpacing:"0.1em",fontWeight:900,marginBottom:10}}>
            📏 {t("heightTitle")}
          </div>
          <div style={{background:"rgba(255,255,255,0.06)",border:`2px solid ${T.bW}`,borderRadius:18,padding:"16px 18px",marginBottom:6}}>
            <div style={{display:"flex",justifyContent:"space-between",alignItems:"baseline",marginBottom:4}}>
              <span style={{fontSize:13,color:T.t2,fontFamily:"'DM Sans',sans-serif"}}>Estatura</span>
              <div style={{display:"flex",alignItems:"baseline",gap:4}}>
                <span style={{fontSize:38,fontWeight:900,color:T.g2,lineHeight:1,textShadow:`0 0 20px ${T.g1}80`}}>{aHeight}</span>
                <span style={{fontSize:16,color:T.t2,fontWeight:700}}>cm</span>
              </div>
            </div>
            <input
              type="range"
              className="gbh-slider"
              min={140} max={220} step={1}
              value={aHeight}
              onChange={e=>setAHeight(Number(e.target.value))}
            />
            <div style={{display:"flex",justifyContent:"space-between",marginTop:2}}>
              <span style={{fontSize:10,color:T.t3,fontFamily:"'DM Sans',sans-serif"}}>140 cm</span>
              <span style={{fontSize:10,color:T.t3,fontFamily:"'DM Sans',sans-serif"}}>220 cm</span>
            </div>
          </div>
          <div style={{fontSize:11,color:T.t2,fontFamily:"'DM Sans',sans-serif",marginBottom:20}}>
            {t("heightHint")}
          </div>
        </>)}

        {authErr&&(
          <div style={{background:"rgba(255,75,75,0.12)",border:"1.5px solid rgba(255,75,75,0.4)",
            borderRadius:12,padding:"10px 14px",marginBottom:14,fontSize:12,color:"#FF8080",
            fontFamily:"'DM Sans',sans-serif",textAlign:"center"}}>
            ⚠️ {authErr}
          </div>
        )}

        {/* ── Checkbox política de privacidad (solo para nuevos usuarios) ── */}
        {authMode!=="returning"&&authMode!=="migrate"&&(
          <div
            onClick={()=>setAPrivacy(p=>!p)}
            style={{
              display:"flex",alignItems:"flex-start",gap:12,
              marginBottom:18,cursor:"pointer",
              padding:"12px 14px",
              background:aPrivacy?"rgba(88,204,2,0.08)":"rgba(255,255,255,0.04)",
              border:`1.5px solid ${aPrivacy?"rgba(88,204,2,0.4)":"rgba(255,255,255,0.12)"}`,
              borderRadius:14,transition:"all 0.2s",
            }}>
            {/* Caja checkbox visual */}
            <div style={{
              width:22,height:22,borderRadius:7,flexShrink:0,marginTop:1,
              background:aPrivacy?`linear-gradient(135deg,${T.g1},${T.g2})`:"rgba(255,255,255,0.08)",
              border:`2px solid ${aPrivacy?T.g1:"rgba(255,255,255,0.25)"}`,
              display:"flex",alignItems:"center",justifyContent:"center",
              boxShadow:aPrivacy?`0 2px 0 ${T.g3}`:"none",
              transition:"all 0.18s",
            }}>
              {aPrivacy&&<span style={{fontSize:13,color:"white",fontWeight:900,lineHeight:1}}>✓</span>}
            </div>
            <div style={{fontSize:12,color:T.t2,fontFamily:"'DM Sans',sans-serif",lineHeight:1.5}}>
              {lang==="en"?(
                <>I have read and accept the{" "}
                  <span onClick={e=>{e.stopPropagation();window.open(GBH_PRIVACY_URL,"_blank","noopener");}}
                    style={{color:T.g2,fontWeight:700,textDecoration:"underline",cursor:"pointer"}}>
                    privacy policy
                  </span>
                  {" "}of GBH Nutricion. I understand how my data is managed.
                </>
              ):(
                <>He leido y acepto la{" "}
                  <span onClick={e=>{e.stopPropagation();window.open(GBH_PRIVACY_URL,"_blank","noopener");}}
                    style={{color:T.g2,fontWeight:700,textDecoration:"underline",cursor:"pointer"}}>
                    politica de privacidad
                  </span>
                  {" "}de GBH Nutricion. Entiendo como se gestionan mis datos.
                </>
              )}
            </div>
          </div>
        )}

        {/* ── DEBUG PANEL eliminado ── */}

        {(()=>{
          const isReturning = authMode==="returning";
          const dis = loading || authMode==="checking" ||
                      !aEmail.trim() ||
                      (!isReturning && (!aName.trim()||!aWeight||isNaN(parseFloat(aWeight))||!aPrivacy));
          const label = loading ? t("verifying")
                      : isReturning ? t("recoverAccount")
                      : t("startAdventure");
          return(
            <button onClick={doAuth} disabled={dis}
              style={{width:"100%",padding:"17px 20px",borderRadius:18,border:`3px solid ${T.g3}`,
                cursor:dis?"not-allowed":"pointer",fontSize:17,fontWeight:900,
                background:dis?"rgba(255,255,255,0.12)":`linear-gradient(135deg,${T.g1},${T.g2})`,
                color:dis?T.t2:"white",boxShadow:dis?"none":`0 6px 0 ${T.g3}`,
                transition:"all 0.15s",fontFamily:"'Nunito',sans-serif"}}>
              {label}
            </button>
          );
        })()}
      </Card>
    </div>
    </LangCtx.Provider>
  );

  // ── ADMIN ────────────────────────────────────────────────────────────────────
  if(pinGate){
    return(
      <div style={{fontFamily:"'Nunito',sans-serif",background:`radial-gradient(ellipse at top,#1A3A10,${T.bg})`,minHeight:"100vh",maxWidth:420,margin:"0 auto",color:T.t1,display:"flex",flexDirection:"column",alignItems:"center",justifyContent:"center",padding:"0 24px"}}>
        <style>{CSS}</style>
        <div style={{fontSize:38,marginBottom:8}}>🔐</div>
        <div style={{fontSize:17,fontWeight:900,marginBottom:4}}>Acceso de administrador</div>
        <div style={{fontSize:12,color:T.t2,fontFamily:"'DM Sans',sans-serif",marginBottom:22}}>Introduce el PIN de 4 dígitos</div>
        {/* Puntos del PIN */}
        <div style={{display:"flex",gap:14,marginBottom:26,animation:pinErr?"gbhShake 0.35s":"none"}}>
          {[0,1,2,3].map(i=>(
            <div key={i} style={{width:16,height:16,borderRadius:"50%",transition:"all 0.12s",
              background:pinErr?T.red:(i<pinVal.length?T.g1:"rgba(255,255,255,0.12)"),
              border:"2px solid "+(pinErr?T.red:(i<pinVal.length?T.g1:"rgba(255,255,255,0.25)")),
              boxShadow:i<pinVal.length&&!pinErr?`0 0 10px ${T.g1}66`:"none"}}/>
          ))}
        </div>
        {pinErr&&<div style={{fontSize:12,color:T.red,fontWeight:800,marginTop:-16,marginBottom:14}}>PIN incorrecto</div>}
        {/* Teclado */}
        <div style={{display:"grid",gridTemplateColumns:"repeat(3,72px)",gap:12}}>
          {["1","2","3","4","5","6","7","8","9","←","0","✕"].map(k=>(
            <button key={k}
              onClick={()=>{if(k==="✕"){setPinGate(false);setPinVal("");}else if(k==="←"){setPinVal(v=>v.slice(0,-1));setPinErr(false);}else pinTecla(k);}}
              style={{height:64,borderRadius:18,fontSize:k==="←"||k==="✕"?18:22,fontWeight:900,cursor:"pointer",
                fontFamily:"'Nunito',sans-serif",color:k==="✕"?T.red:T.t1,
                background:k==="✕"?"rgba(255,75,75,0.10)":"rgba(255,255,255,0.06)",
                border:"2px solid "+(k==="✕"?"rgba(255,75,75,0.3)":"rgba(255,255,255,0.12)"),
                boxShadow:"0 4px 0 rgba(0,0,0,0.4)"}}>
              {k}
            </button>
          ))}
        </div>
        <style>{`@keyframes gbhShake{0%,100%{transform:translateX(0)}20%,60%{transform:translateX(-8px)}40%,80%{transform:translateX(8px)}}`}</style>
      </div>
    );
  }
  if(screen==="admin"){
    const adh=(id)=>{const l=lsGet(`gbh:logs:${id}`,[]);const d7=Array.from({length:7},(_,i)=>{const d=new Date();d.setDate(d.getDate()-i);return toKey(d);});return Math.round((d7.filter(k=>l.find(x=>x.date===k&&x.diet)).length/7)*100);};
    const pSt=(id)=>{const l=lsGet(`gbh:logs:${id}`,[]);let s=0;const d=new Date();while(true){if(l.find(x=>x.date===toKey(d)&&x.diet)){s++;d.setDate(d.getDate()-1);}else break;}return s;};
    const lW=(id)=>{const w=lsGet(`gbh:weights:${id}`,[]);return w.length?w[w.length-1].weight:null;};
    const st=(a)=>a>=80?{t:"✅ En Objetivo",c:T.g1}:a>=50?{t:"⚠️ Riesgo",c:T.au1}:{t:"🔴 Inactivo",c:T.red};
    // ── Tier por paciente (profiles.plan): 💎 premium / ⭐ normal ──
    const tierDe=(p)=>((planAdmin[p.id]||p.plan)==='premium'?'premium':'standard');
    const listaP=allP.filter(p=>filtroAdmin==='todos'?true:(filtroAdmin==='premium'?tierDe(p)==='premium':tierDe(p)!=='premium'));
    const nPremT=allP.filter(p=>tierDe(p)==='premium').length;
    const nNormT=allP.length-nPremT;
    return(
      <div style={{fontFamily:"'Nunito',sans-serif",background:`radial-gradient(ellipse at top,#1A3A10,${T.bg})`,minHeight:"100vh",maxWidth:420,margin:"0 auto",color:T.t1,paddingBottom:20}}>
        <style>{CSS}</style>
        <div style={{padding:"20px 18px 12px"}}>
          <div style={{display:"flex",justifyContent:"space-between",alignItems:"center"}}>
            <div><div style={{fontSize:10,color:T.au1,textTransform:"uppercase",letterSpacing:"0.1em",fontWeight:900,marginBottom:2}}>Panel Administrador</div><div style={{fontSize:22,fontWeight:900}}>Cuarto de Guerra 🎯</div></div>
            <button onClick={()=>setScreen("main")} style={{background:T.bgWood,border:`2px solid ${T.bW}`,borderRadius:14,padding:"10px 18px",color:T.t1,fontWeight:900,cursor:"pointer",fontSize:13,boxShadow:"0 4px 0 rgba(0,0,0,0.5)",fontFamily:"'Nunito',sans-serif"}}>← Salir</button>
          </div>
        </div>
        <div style={{padding:"0 18px"}}>
          <div style={{display:"flex",gap:10,marginBottom:14}}>
            {[{l:"Total",v:allP.length,i:"👥"},{l:"Activos hoy",v:allP.filter(p=>{const l=lsGet(`gbh:logs:${p.id}`,[]);return l.find(x=>x.date===toKey()&&x.diet);}).length,i:"✅"},{l:"En riesgo",v:allP.filter(p=>adh(p.id)<50).length,i:"⚠️"}].map(({l,v,i})=>(
              <Card key={l} style={{flex:1,margin:0,padding:"14px 10px",textAlign:"center",marginBottom:0}}>
                <div style={{fontSize:22}}>{i}</div><div style={{fontSize:24,fontWeight:900,color:T.au1}}>{v}</div>
                <div style={{fontSize:9,color:T.t2,textTransform:"uppercase",letterSpacing:"0.05em",marginTop:2}}>{l}</div>
              </Card>
            ))}
          </div>
          <Card>
            <div style={{fontSize:10,color:T.au1,textTransform:"uppercase",letterSpacing:"0.1em",fontWeight:900,marginBottom:12}}>Listado de pacientes</div>
            {/* ── Filtro por servicio: Todos | Premium | Normal ── */}
            <div style={{display:"flex",gap:6,marginBottom:12}}>
              {[{id:'todos',l:`Todos · ${allP.length}`},{id:'premium',l:`💎 Premium · ${nPremT}`},{id:'normal',l:`⭐ Normal · ${nNormT}`}].map(f=>(
                <button key={f.id} onClick={()=>setFiltroAdmin(f.id)}
                  style={{flex:1,padding:"9px 2px",borderRadius:12,cursor:"pointer",whiteSpace:"nowrap",
                    fontWeight:900,fontSize:11.5,fontFamily:"'Nunito',sans-serif",
                    background:filtroAdmin===f.id?"rgba(88,204,2,0.18)":"rgba(255,255,255,0.05)",
                    border:filtroAdmin===f.id?`2px solid ${T.g1}`:"2px solid rgba(255,255,255,0.10)",
                    color:filtroAdmin===f.id?T.g1:T.t2,
                    boxShadow:filtroAdmin===f.id?"0 3px 0 rgba(0,0,0,0.35)":"none"}}>
                  {f.l}
                </button>
              ))}
            </div>
            {allP.length===0?<div style={{color:T.t2,textAlign:"center",padding:"20px 0",fontSize:13,fontFamily:"'DM Sans',sans-serif"}}>Sin datos aún.</div>
            :listaP.map(p=>{const a=p.adherence_7d??adh(p.id),s=p.total_streak_days??pSt(p.id),w=p.last_weight??lW(p.id);const{t:si,c:sc}=st(a);const li=logsAdmin[p.id];return(
              <div key={p.id} style={{borderBottom:"1px solid rgba(255,255,255,0.07)",padding:"12px 0"}}>
                <div style={{display:"flex",justifyContent:"space-between",alignItems:"center",marginBottom:6,gap:8}}>
                  <div style={{fontWeight:900,fontSize:14,flex:1,minWidth:0,whiteSpace:"nowrap",overflow:"hidden",textOverflow:"ellipsis"}}>
                    <span title={tierDe(p)==='premium'?"Premium":"Normal"} style={{marginRight:5}}>{tierDe(p)==='premium'?"💎":"⭐"}</span>{p.name}
                  </div>
                  <div style={{fontSize:12,fontWeight:800,color:sc,flexShrink:0}}>{si}</div>
                  <button onClick={()=>exportarSeguimientoCSV(p.id,p.name)} title="Descargar seguimiento (CSV)" style={{background:"rgba(206,130,255,0.14)",border:"1px solid rgba(206,130,255,0.35)",borderRadius:8,padding:"3px 9px",fontSize:11,fontWeight:800,color:T.pur,cursor:"pointer",flexShrink:0,fontFamily:"'Nunito',sans-serif"}}>⬇ CSV</button>
                </div>
                <div style={{display:"flex",gap:14,marginBottom:6}}><span style={{fontSize:12,color:T.t2}}>🔥 <b style={{color:T.t1}}>{s}d</b></span><span style={{fontSize:12,color:T.t2}}>⚖️ <b style={{color:T.t1}}>{w?`${w}kg`:"—"}</b></span><span style={{fontSize:12,color:T.t2}}>7d: <b style={{color:a>=80?T.g1:a>=50?T.au1:T.red}}>{a}%</b></span><span style={{fontSize:12,color:T.t2}}>XP: <b style={{color:T.xp}}>{p.xp||0}</b></span></div>
                <div style={{background:"rgba(255,255,255,0.06)",borderRadius:6,height:6}}><div style={{height:"100%",width:`${a}%`,background:a>=80?T.g1:a>=50?T.au1:T.red,borderRadius:6,transition:"width 0.8s"}}/></div>
                {li&&(li.hoyMeals||li.nota)&&(
                  <div style={{marginTop:8}}>
                    {li.hoyMeals&&(
                      <div style={{display:"flex",gap:5,flexWrap:"wrap",marginBottom:li.nota?6:0}}>
                        {PLAN_TOMAS.map(tm=>{const e=li.hoyMeals[tm];if(!e)return null;const c=PLAN_CUMPL.find(x=>x.k===e);return(
                          <span key={tm} title={tm} style={{display:"inline-flex",alignItems:"center",gap:3,background:(c?.c||"#888")+"22",border:"1px solid "+(c?.c||"#888")+"55",borderRadius:8,padding:"2px 7px",fontSize:10.5,fontWeight:800,color:c?.c||"#aaa"}}>{c?.ic} {tm.slice(0,3)}</span>
                        );})}
                      </div>
                    )}
                    {li.nota&&(
                      <div style={{fontSize:12,color:T.t2,fontFamily:"'DM Sans',sans-serif",lineHeight:1.45,background:"rgba(255,200,0,0.06)",border:"1px solid rgba(255,200,0,0.18)",borderRadius:10,padding:"7px 10px"}}><span style={{color:T.au1}}>💬</span> "{li.nota}"{li.notaFecha?` · ${li.notaFecha.slice(8,10)}/${li.notaFecha.slice(5,7)}`:""}</div>
                    )}
                  </div>
                )}
              </div>
            );})}
          </Card>
        </div>
      </div>
    );
  }

  // ── MAIN ─────────────────────────────────────────────────────────────────────
  return(
    <LangCtx.Provider value={lang}>
    <div style={{fontFamily:"'Nunito',sans-serif",background:`radial-gradient(ellipse at top,#1A3A10,${T.bg})`,minHeight:"100vh",maxWidth:420,margin:"0 auto",color:T.t1,paddingBottom:90,overflowX:"hidden"}}>
      <style>{CSS}</style>
      <Confetti active={confetti}/>
      <StreakOverlay active={streakAnim} streak={streak+1}/>
      <MissionsOverlay active={missionsAnim}/>
      {floatItems.length>0&&<FloatReward items={floatItems}/>}
      <LevelUpOverlay active={levelUpAnim} level={levelUpNum} reward={levelUpRew} patientName={profile?.name||""} streak={streak} lang={lang} onClose={()=>setLevelUpAnim(false)}/>
      {rewardsOpen&&<RewardsModal onClose={()=>setRewardsOpen(false)} currentLevel={lv.l}/>}
      {/* ── Burbuja flotante desafíos ────────────────────────────────────── */}
      {/* ── Modal Desafíos Semanales ─────────────────────────────────────── */}
      {showChallenges&&(()=>{
        const weekChs = getWeekChallenges();
        return(
          <div style={{position:"fixed",inset:0,zIndex:11000,
            background:"rgba(0,0,0,0.82)",backdropFilter:"blur(6px)",
            display:"flex",alignItems:"flex-end",justifyContent:"center",
            padding:"0 0 80px"}}
            onClick={()=>setShowChallenges(false)}>
            <div style={{
              width:"100%",maxWidth:420,
              background:`linear-gradient(180deg,#1E4A20,${T.bgWood} 60%)`,
              borderRadius:"28px 28px 0 0",
              border:`2px solid ${T.bW}`,borderBottom:"none",
              boxShadow:"0 -8px 40px rgba(0,0,0,0.6)",
              animation:"slideUp 0.35s cubic-bezier(0.34,1.12,0.64,1)",
              maxHeight:"80vh",overflow:"auto",
            }} onClick={e=>e.stopPropagation()}>

              {/* Drag handle */}
              <div style={{display:"flex",justifyContent:"center",paddingTop:12,paddingBottom:4}}>
                <div style={{width:36,height:4,borderRadius:2,background:"rgba(255,255,255,0.2)"}}/>
              </div>

              {/* Cabecera */}
              <div style={{padding:"8px 20px 14px",display:"flex",alignItems:"center",justifyContent:"space-between"}}>
                <div>
                  <div style={{fontSize:18,fontWeight:900,color:T.wh}}>
                    🎯 {lang==="en"?"Weekly challenges":"Desafíos semanales"}
                  </div>
                  <div style={{fontSize:12,color:T.t2,fontFamily:"'DM Sans',sans-serif",marginTop:2}}>
                    {lang==="en"
                      ? `${claimedChallenges.length}/${weekChs.length} completed · Resets every Monday`
                      : `${claimedChallenges.length}/${weekChs.length} completados · Se renuevan el lunes`}
                  </div>
                </div>
                <button onClick={()=>setShowChallenges(false)} style={{
                  background:"rgba(255,255,255,0.08)",border:`1.5px solid ${T.bW}`,
                  borderRadius:"50%",width:32,height:32,color:T.t2,
                  fontSize:16,cursor:"pointer",display:"flex",alignItems:"center",justifyContent:"center"}}>✕</button>
              </div>
              {/* Botón volver a inicio */}
              <div style={{padding:"0 16px 4px",textAlign:"right"}}>
                <button onClick={()=>{setShowChallenges(false);setTab("home");}} style={{background:"none",border:"none",color:T.t3,fontSize:12,fontWeight:700,cursor:"pointer",fontFamily:"'Nunito',sans-serif",padding:"4px 8px"}}>
                  ← {lang==="en"?"Home":"Inicio"}
                </button>
              </div>

              {/* Lista desafíos */}
              <div style={{padding:"0 16px 20px",display:"flex",flexDirection:"column",gap:10}}>
                {weekChs.map(ch=>{
                  const prog    = getChallengeProgress(ch,logs,weights,xp,streak);
                  const pct     = Math.min(100,Math.round((prog/ch.goal)*100));
                  const done    = pct>=100;
                  const claimed = claimedChallenges.includes(ch.id);
                  const chTitle = lang==="en" ? (ch.title_en||ch.title) : ch.title;
                  const chDesc  = lang==="en" ? (ch.desc_en||ch.desc)   : ch.desc;
                  return(
                    <div key={ch.id} style={{
                      background:claimed?"rgba(88,204,2,0.1)":done?"rgba(88,204,2,0.06)":"rgba(255,255,255,0.04)",
                      border:`1.5px solid ${claimed?T.g1:done?"rgba(88,204,2,0.4)":T.bW}`,
                      borderRadius:18,padding:"12px 14px",transition:"all 0.3s",
                    }}>
                      <div style={{display:"flex",alignItems:"center",gap:12}}>
                        <div style={{fontSize:26,flexShrink:0}}>{claimed?"✅":ch.icon}</div>
                        <div style={{flex:1,minWidth:0}}>
                          <div style={{fontSize:14,fontWeight:900,color:claimed?T.g2:T.wh}}>{chTitle}</div>
                          <div style={{fontSize:11,color:T.t2,fontFamily:"'DM Sans',sans-serif",marginTop:2}}>{chDesc}</div>
                        </div>
                        <div style={{flexShrink:0,textAlign:"right"}}>
                          {claimed?(
                            <div style={{fontSize:12,color:T.g1,fontWeight:800}}>
                              {lang==="en"?"Done! 🎉":"¡Listo! 🎉"}
                            </div>
                          ):done?(
                            <button onClick={()=>claimChallenge(ch)} style={{
                              background:`linear-gradient(135deg,${T.g1},${T.g2})`,
                              border:`2px solid ${T.g3}`,borderRadius:12,
                              padding:"7px 12px",color:"white",fontWeight:900,
                              fontSize:12,cursor:"pointer",boxShadow:`0 3px 0 ${T.g3}`,
                              fontFamily:"'Nunito',sans-serif",
                              animation:"pulse 1.5s ease-in-out infinite",
                            }}>+{ch.xp}⚡+{ch.gems}💎</button>
                          ):(
                            <div style={{fontSize:13,fontWeight:800,color:T.t2}}>{prog}/{ch.goal}</div>
                          )}
                        </div>
                      </div>
                      {!claimed&&(
                        <div style={{marginTop:10,background:"rgba(255,255,255,0.08)",borderRadius:8,height:7,overflow:"hidden"}}>
                          <div style={{height:"100%",width:`${pct}%`,borderRadius:8,
                            background:done?`linear-gradient(90deg,${T.g1},${T.g2})`:`linear-gradient(90deg,${T.au1},${T.au2})`,
                            transition:"width 0.6s ease",
                            boxShadow:done?`0 0 8px ${T.g1}60`:`0 0 6px ${T.au1}60`,
                          }}/>
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            </div>
          </div>
        );
      })()}

      {showQuiz&&<QuizModal onClose={()=>setShowQuiz(false)} onComplete={onQuizComplete} todayKey={toKey()} lang={lang} onGoHome={()=>{setShowQuiz(false);setTab("home");}}/>}
      {showChest&&<ChestOpenModal streak={streak} onClose={()=>setShowChest(false)} onCollect={onChestCollect} onGoHome={()=>{setShowChest(false);setTab("home");}}/>}
      {/* ── 🐑 Zona de juego + Personalización de Bo ── */}
      {boBienvenida&&(<BienvenidaBo onAdoptar={adoptarBo}/>)}
      {zonaJuego&&(
        <div style={{position:"fixed",inset:0,zIndex:9000,background:T.bg,display:"flex",flexDirection:"column"}}>
          <div style={{display:"flex",alignItems:"center",justifyContent:"space-between",padding:"14px 16px 8px"}}>
            <div style={{fontWeight:900,fontSize:16,color:T.g2}}>🐑 Zona de juego</div>
            <button onClick={()=>setZonaJuego(false)} style={{width:38,height:38,borderRadius:12,background:"rgba(255,255,255,0.07)",border:"1.5px solid rgba(255,255,255,0.12)",color:T.cr,fontSize:16,cursor:"pointer"}}>✕</button>
          </div>
          <div style={{flex:1,display:"flex",flexDirection:"column",minHeight:0}}>
            <div style={{flex:1,display:"flex",flexDirection:"column",minHeight:0,width:"100%"}}>
              <JuegoOveja color={boColor} equipados={boEquipados} nombre={boNombre}
                partidasProp={partidasRestantes} puntosHoy={ptsHoy} puntosSemana={ptsSemana}
                onFinPartida={finPartida} onPagarYJugar={pagarYJugar}
                onSalir={()=>setZonaJuego(false)} arrancarRef={arrancarJuegoRef}/>
            </div>
          </div>
        </div>
      )}
      {panelBo&&(
        <PersonalizacionBo nombre={boNombre} setNombre={setBoNombre}
          color={boColor} setColor={setBoColor}
          equipados={boEquipados} setEquipados={setBoEquipados}
          personalidad={boPersonalidad} setPersonalidad={setBoPersonalidad}
          nivel={boNivel}
          onCerrar={()=>{ setPanelBo(false); guardarBo(); }}/>
      )}
      {showWeekChest&&<ChestOpenModal streak={7} onClose={()=>setShowWeekChest(false)} onCollect={onWeekChestCollect} onGoHome={()=>{setShowWeekChest(false);setTab("home");}}/>}
      {showRuleta&&<RuletaModal
        onClose={()=>{
          const todayKey=toKey();
          lsSet("gbh:ruletaSeen:"+(profile?.id||"")+":"+todayKey,true);
          setRuletaAutoShown(true);
          setShowRuleta(false);
        }}
        onCollect={onRuletaCollect}
        onGoHome={()=>{const todayKey=toKey();lsSet("gbh:ruletaSeen:"+(profile?.id||"")+":"+todayKey,true);setRuletaAutoShown(true);setShowRuleta(false);setTab("home");}}
      />}
      {showPhotoPicker&&(
        <ProfileCardModal
          onClose={()=>setShowPhotoPicker(false)}
          onGoHome={()=>{setShowPhotoPicker(false);setTab("home");}}
          profile={profile}
          userPhoto={userPhoto}
          onSavePhoto={saveUserPhoto}
          onSaveProfile={saveProfileField}
          weights={weights}
          lv={lv}
          xp={xp}
          streak={streak}
          badges={badges.length}
          onSubscribeNotifications={subscribeNotifications}
          lang={lang}
          setLang={switchLang}
          onDeleteAccount={deleteAccount}
        />
      )}

      {/* Toast */}
      {toast&&(
        <div style={{position:"fixed",top:16,left:"50%",transform:"translateX(-50%)",zIndex:9999,animation:"slideUp 0.35s cubic-bezier(0.34,1.56,0.64,1)",width:"92%",maxWidth:350}}>
          <div style={{background:`linear-gradient(135deg,${T.g1},${T.g3})`,borderRadius:22,padding:"16px 22px",boxShadow:`0 8px 0 ${T.g3},0 14px 30px rgba(0,0,0,0.6)`,textAlign:"center",border:`2.5px solid ${T.g2}`}}>
            <div style={{fontSize:34}}>{toast.icon}</div>
            <div style={{fontWeight:900,fontSize:17,marginTop:4}}>{toast.title}</div>
            <div style={{fontSize:13,opacity:0.88,marginTop:3,fontFamily:"'DM Sans',sans-serif"}}>{toast.sub}</div>
            {toast.reward&&<div style={{fontSize:12,marginTop:7,background:"rgba(0,0,0,0.22)",borderRadius:12,padding:"5px 14px",display:"inline-block",fontFamily:"'DM Sans',sans-serif"}}>{toast.reward}</div>}
          </div>
        </div>
      )}

      {/* ── MODAL INSTALACIÓN PWA — aparece al llegar desde Instagram ──────────── */}
      {showInstallModal&&!pwaInstalled&&(()=>{
        const isIOS = /iphone|ipad|ipod/i.test(navigator.userAgent);
        const isSafari = /^((?!chrome|android).)*safari/i.test(navigator.userAgent);
        // En iOS solo funciona desde Safari; si no es Safari, no mostramos el modal
        if(isIOS && !isSafari) { setTimeout(()=>setShowInstallModal(false), 0); return null; }
        return(
          <div style={{
            position:"fixed",inset:0,zIndex:12000,
            background:"rgba(0,0,0,0.88)",backdropFilter:"blur(8px)",
            display:"flex",alignItems:"flex-end",justifyContent:"center",
            animation:"fadeIn 0.3s ease",
          }} onClick={()=>setShowInstallModal(false)}>
            <div style={{
              width:"100%",maxWidth:420,
              background:`linear-gradient(180deg,#1E4A20,${T.bgWood} 55%)`,
              borderRadius:"28px 28px 0 0",
              border:`2px solid ${T.g1}`,borderBottom:"none",
              boxShadow:`0 -8px 40px rgba(88,204,2,0.25)`,
              padding:"28px 24px 44px",
              animation:"slideUp 0.4s cubic-bezier(0.34,1.12,0.64,1)",
            }} onClick={e=>e.stopPropagation()}>

              {/* Drag handle */}
              <div style={{display:"flex",justifyContent:"center",marginBottom:20}}>
                <div style={{width:36,height:4,borderRadius:2,background:"rgba(255,255,255,0.2)"}}/>
              </div>

              {/* Cabecera con mascota */}
              <div style={{display:"flex",alignItems:"center",gap:16,marginBottom:20}}>
                <Mascot expr="excited" size={72}/>
                <div>
                  <div style={{fontSize:20,fontWeight:900,color:T.wh,lineHeight:1.2,marginBottom:4}}>
                    {lang==="en" ? "Install GBH on your phone! 🚀" : "¡Instala GBH en tu móvil! 🚀"}
                  </div>
                  <div style={{fontSize:13,color:T.t2,fontFamily:"'DM Sans',sans-serif",lineHeight:1.4}}>
                    {lang==="en"
                      ? "Add it to your home screen and open it like a real app — no browser needed."
                      : "Añádela a tu pantalla de inicio y ábrela como una app de verdad, sin navegador."}
                  </div>
                </div>
              </div>

              {/* Ventajas */}
              <div style={{display:"flex",flexDirection:"column",gap:8,marginBottom:24}}>
                {(lang==="en"
                  ? ["⚡ Opens instantly, like a native app","🔔 Reminders so you never miss a day","📵 Works offline too","🏠 Always on your home screen"]
                  : ["⚡ Se abre al instante, como una app nativa","🔔 Recordatorios para no perderte un día","📵 Funciona sin conexión también","🏠 Siempre en tu pantalla de inicio"]
                ).map((item,i)=>(
                  <div key={i} style={{display:"flex",alignItems:"center",gap:10,
                    background:"rgba(88,204,2,0.08)",border:`1px solid rgba(88,204,2,0.2)`,
                    borderRadius:12,padding:"9px 14px"}}>
                    <span style={{fontSize:16,flexShrink:0}}>{item.split(" ")[0]}</span>
                    <span style={{fontSize:13,color:T.wh,fontFamily:"'DM Sans',sans-serif",fontWeight:600}}>
                      {item.split(" ").slice(1).join(" ")}
                    </span>
                  </div>
                ))}
              </div>

              {/* Botón instalar (Android con pwaPrompt) o instrucción iOS */}
              {!isIOS && pwaPrompt ? (
                <button onClick={async()=>{
                  pwaPrompt.prompt();
                  const {outcome}=await pwaPrompt.userChoice;
                  if(outcome==="accepted") setPwaInstalled(true);
                  setPwaPrompt(null);
                  setShowInstallModal(false);
                }} style={{
                  width:"100%",padding:"18px 0",borderRadius:20,
                  border:`3px solid ${T.g3}`,
                  background:`linear-gradient(135deg,${T.g1},${T.g2})`,
                  color:"white",fontSize:18,fontWeight:900,
                  cursor:"pointer",
                  boxShadow:`0 8px 0 ${T.g3}`,
                  fontFamily:"'Nunito',sans-serif",
                  marginBottom:12,
                  animation:"glow 2s ease-in-out infinite",
                }}>
                  📲 {lang==="en" ? "Install GBH" : "Instalar GBH"}
                </button>
              ) : (
                <div style={{
                  background:"rgba(255,200,0,0.10)",
                  border:`1.5px solid ${T.au2}`,
                  borderRadius:16,padding:"14px 18px",marginBottom:12,
                }}>
                  <div style={{fontSize:12,fontWeight:900,color:T.au1,marginBottom:8}}>
                    {isIOS
                      ? (lang==="en" ? "📲 How to install on iPhone:" : "📲 Cómo instalar en iPhone:")
                      : (lang==="en" ? "📲 How to install:" : "📲 Cómo instalar:")}
                  </div>
                  <div style={{fontSize:13,color:T.wh,fontFamily:"'DM Sans',sans-serif",lineHeight:1.8}}>
                    {isIOS ? (
                      lang==="en"
                        ? <><b>1.</b> Tap the <b>Share</b> button <b>□↑</b> at the bottom<br/><b>2.</b> Select <b>"Add to Home Screen"</b><br/><b>3.</b> Tap <b>"Add"</b> — done! 🎉</>
                        : <><b>1.</b> Pulsa el botón <b>Compartir</b> <b>□↑</b> abajo<br/><b>2.</b> Selecciona <b>"Añadir a inicio"</b><br/><b>3.</b> Pulsa <b>"Añadir"</b> — ¡listo! 🎉</>
                    ) : (
                      lang==="en"
                        ? <><b>1.</b> Tap menu <b>⋮</b> (top right)<br/><b>2.</b> Select <b>"Add to Home Screen"</b><br/><b>3.</b> Tap <b>"Add"</b> — done! 🎉</>
                        : <><b>1.</b> Pulsa el menú <b>⋮</b> (arriba a la derecha)<br/><b>2.</b> Selecciona <b>"Añadir a pantalla de inicio"</b><br/><b>3.</b> Pulsa <b>"Añadir"</b> — ¡listo! 🎉</>
                    )}
                  </div>
                </div>
              )}

              <button onClick={()=>setShowInstallModal(false)} style={{
                width:"100%",padding:"13px 0",borderRadius:16,
                background:"rgba(255,255,255,0.06)",
                border:"1.5px solid rgba(255,255,255,0.12)",
                color:"rgba(255,255,255,0.45)",fontSize:14,fontWeight:700,
                cursor:"pointer",fontFamily:"'Nunito',sans-serif",
              }}>
                {lang==="en" ? "Maybe later" : "Ahora no"}
              </button>
            </div>
          </div>
        );
      })()}

      {/* ── HEADER ─────────────────────────────────────────────────────────── */}
      {/* Banner notificaciones — aparece una sola vez tras 1 día de uso */}
      {showNotifBanner&&(
        <div style={{background:`linear-gradient(135deg,#1A2A5A,#0D1A3A)`,
          padding:"10px 14px",display:"flex",alignItems:"center",
          justifyContent:"space-between",gap:10,
          borderBottom:`1px solid rgba(100,130,255,0.3)`,
          animation:"slideDown 0.4s ease"}}>
          <div style={{display:"flex",alignItems:"center",gap:10,flex:1}}>
            <div style={{width:36,height:36,borderRadius:10,flexShrink:0,fontSize:20,
              background:"rgba(100,130,255,0.2)",display:"flex",alignItems:"center",justifyContent:"center"}}>🔔</div>
            <div>
              <div style={{fontSize:12,fontWeight:900,color:"white",fontFamily:"'Nunito',sans-serif",lineHeight:1.2}}>
                {lang==="en"?"Enable reminders":"Activa los recordatorios"}
              </div>
              <div style={{fontSize:10,color:"rgba(180,200,255,0.8)",fontFamily:"'DM Sans',sans-serif",marginTop:1}}>
                {lang==="en"?"Streak at risk · Weekly weigh-in · Daily diet":"Racha en peligro · Pesaje semanal · Dieta diaria"}
              </div>
            </div>
          </div>
          <div style={{display:"flex",gap:8,flexShrink:0,alignItems:"center"}}>
            <button onClick={subscribeNotifications} style={{
              background:"rgba(100,130,255,0.9)",border:"2px solid rgba(120,150,255,0.6)",
              borderRadius:12,padding:"7px 14px",color:"white",fontWeight:900,
              fontSize:12,cursor:"pointer",fontFamily:"'Nunito',sans-serif",
              boxShadow:"0 3px 0 rgba(60,80,200,0.5)",whiteSpace:"nowrap"}}>
              {lang==="en"?"Enable":"Activar"}
            </button>
            <button onClick={dismissNotifBanner} style={{
              background:"rgba(255,255,255,0.08)",border:"1px solid rgba(255,255,255,0.15)",
              borderRadius:"50%",width:28,height:28,color:"rgba(255,255,255,0.5)",
              fontSize:14,cursor:"pointer",display:"flex",alignItems:"center",justifyContent:"center"}}>✕</button>
          </div>
        </div>
      )}
      {/* Banner quiz diario — si no se ha hecho hoy */}
      {!quizDone&&!quizBannerDismissed&&(
        <div style={{background:"linear-gradient(135deg,rgba(123,47,190,0.97),rgba(74,14,143,0.97))",padding:"10px 14px",display:"flex",alignItems:"center",justifyContent:"space-between",gap:10,animation:"slideDown 0.35s ease"}}>
          <div onClick={()=>{setShowQuiz(true);setQuizBannerDismissed(true);}} style={{display:"flex",alignItems:"center",gap:10,flex:1,cursor:"pointer"}}>
            <div style={{width:38,height:38,borderRadius:11,background:"rgba(255,255,255,0.15)",display:"flex",alignItems:"center",justifyContent:"center",flexShrink:0,fontSize:20}}>🧠</div>
            <div>
              <div style={{fontSize:12,fontWeight:900,color:"white",fontFamily:"'Nunito',sans-serif",lineHeight:1.2}}>¡Quiz de nutrición disponible!</div>
              <div style={{fontSize:10,color:"rgba(255,255,255,0.75)",fontFamily:"'DM Sans',sans-serif",marginTop:1}}>Responde y gana hasta +20 XP +8 💎 →</div>
            </div>
          </div>
          <button onClick={()=>setQuizBannerDismissed(true)} style={{background:"rgba(255,255,255,0.12)",border:"1px solid rgba(255,255,255,0.2)",borderRadius:"50%",width:28,height:28,color:"rgba(255,255,255,0.6)",fontSize:14,cursor:"pointer",display:"flex",alignItems:"center",justifyContent:"center",flexShrink:0}}>✕</button>
        </div>
      )}
      {/* Banner offline */}
      {showOfflineBanner&&(
        <div style={{background:"rgba(200,45,45,0.92)",padding:"6px 18px",display:"flex",alignItems:"center",justifyContent:"center",gap:8,fontSize:12,fontWeight:800,color:"white",fontFamily:"'Nunito',sans-serif",animation:"slideDown 0.4s ease"}}>
          {t("offlineBanner")}
        </div>
      )}
      {/* Banner sincronizando */}
      {showSyncBanner&&pendingSync>0&&(
        <div style={{background:"rgba(180,110,0,0.92)",padding:"6px 18px",display:"flex",alignItems:"center",justifyContent:"center",gap:8,fontSize:12,fontWeight:800,color:"white",fontFamily:"'Nunito',sans-serif",animation:"slideDown 0.4s ease"}}>
          <span style={{animation:"spin 1s linear infinite",display:"inline-block"}}>🔄</span> {lang==="en"?`Syncing ${pendingSync} action${pendingSync>1?"s":""}…`:`Sincronizando ${pendingSync} acción${pendingSync>1?"es":""}…`}
        </div>
      )}
      {/* Banner instalación PWA — siempre visible hasta instalar o descartar */}
      {!pwaInstalled&&!pwaDismissed&&(()=>{
        const isIOS = /iphone|ipad|ipod/i.test(navigator.userAgent);
        const isAndroid = /android/i.test(navigator.userAgent);
        const isSafari = /^((?!chrome|android).)*safari/i.test(navigator.userAgent);
        // En iOS solo funciona desde Safari
        if(isIOS&&!isSafari) return null;
        return(
          <div style={{background:"linear-gradient(135deg,#0D2E0D,#1A4A1A)",padding:"10px 14px",display:"flex",alignItems:"center",justifyContent:"space-between",gap:10,borderBottom:`2px solid ${T.g3}`,animation:"slideDown 0.35s ease"}}>
            <div style={{display:"flex",alignItems:"center",gap:10,flex:1}}>
              <div style={{width:38,height:38,borderRadius:11,background:`linear-gradient(135deg,${T.g1},${T.g2})`,display:"flex",alignItems:"center",justifyContent:"center",flexShrink:0,fontSize:20,boxShadow:`0 3px 0 ${T.g3}`}}>🐑</div>
              <div>
                <div style={{fontSize:12,fontWeight:900,color:T.wh,fontFamily:"'Nunito',sans-serif",lineHeight:1.3}}>
                  Instalar GBH en tu móvil
                </div>
                <div style={{fontSize:10,color:T.t2,fontFamily:"'DM Sans',sans-serif",marginTop:1,lineHeight:1.4}}>
                  {isIOS
                    ? "Toca Share □↑ → 'Añadir a inicio'"
                    : pwaPrompt
                      ? "Pulsa Instalar para añadirlo sin navegador"
                      : "Menú ⋮ → 'Añadir a pantalla de inicio'"}
                </div>
              </div>
            </div>
            <div style={{display:"flex",gap:8,flexShrink:0,alignItems:"center"}}>
              {pwaPrompt&&(
                <button onClick={async()=>{
                  pwaPrompt.prompt();
                  const {outcome}=await pwaPrompt.userChoice;
                  if(outcome==="accepted")setPwaInstalled(true);
                  setPwaPrompt(null);
                }} style={{background:T.g1,border:`2px solid ${T.g3}`,borderRadius:12,padding:"7px 14px",color:"white",fontWeight:900,fontSize:12,cursor:"pointer",fontFamily:"'Nunito',sans-serif",boxShadow:`0 3px 0 ${T.g3}`,whiteSpace:"nowrap"}}>
                  Instalar
                </button>
              )}
              <button onClick={()=>{setPwaDismissed(true);lsSet("gbh:pwaDismissed",Date.now());}} style={{background:"rgba(255,255,255,0.08)",border:"1px solid rgba(255,255,255,0.15)",borderRadius:"50%",width:28,height:28,color:"rgba(255,255,255,0.5)",fontSize:14,cursor:"pointer",display:"flex",alignItems:"center",justifyContent:"center",flexShrink:0}}>✕</button>
            </div>
          </div>
        );
      })()}

      {/* Banner peso fin de semana — con X para cerrar */}
      {isWeekend()&&!weekendWeighIn(weights)&&!weightBannerDismissed&&(
        <div style={{
          background:"linear-gradient(135deg,rgba(255,150,0,0.97),rgba(220,100,0,0.97))",
          padding:"11px 14px 11px 18px",
          display:"flex", alignItems:"center", justifyContent:"space-between",
          animation:"slideDown 0.35s ease",
          position:"relative",
        }}>
          {/* Zona clickable */}
          <div onClick={()=>{setTab("weight");setWeightMode("input");}}
            style={{display:"flex",alignItems:"center",gap:10,flex:1,cursor:"pointer"}}>
            <span style={{fontSize:24}}>⚖️</span>
            <div>
              <div style={{fontSize:13,fontWeight:900,color:"white",fontFamily:"'Nunito',sans-serif",lineHeight:1.2}}>
                {t("weightBannerTitle")}
              </div>
              <div style={{fontSize:11,color:"rgba(255,255,255,0.82)",fontFamily:"'DM Sans',sans-serif",marginTop:2}}>
                {t("weightBannerCta")}
              </div>
            </div>
          </div>
          {/* X para cerrar */}
          <button
            onClick={e=>{e.stopPropagation();setWeightBannerDismissed(true);}}
            style={{
              width:28,height:28,borderRadius:"50%",
              background:"rgba(0,0,0,0.22)",border:"none",
              color:"white",fontSize:14,fontWeight:900,
              cursor:"pointer",display:"flex",alignItems:"center",
              justifyContent:"center",flexShrink:0,marginLeft:8,
              lineHeight:1,
            }}>✕</button>
        </div>
      )}
      <div style={{padding:"14px 18px 10px",background:"linear-gradient(180deg,rgba(26,58,16,0.9),transparent)"}}>
        <div style={{display:"flex",alignItems:"center",justifyContent:"space-between",gap:10}}>
          {/* Avatar + level */}
          <div style={{display:"flex",alignItems:"center",gap:10}}>
            <UserAvatar
              size={52}
              photoB64={userPhoto}
              initials={profile?.name||"?"}
              borderColor={allDone?T.g1:T.au1}
              frame={Math.floor(Math.min(lv.l,500)/100)||0}
              onClick={()=>setShowPhotoPicker(true)}
            />
            <div>
              <div style={{fontSize:13,fontWeight:900,color:T.wh,lineHeight:1.1}}>{fn} · {translateLvName(lv.n,lang)}</div>
              <div style={{background:"rgba(255,255,255,0.12)",borderRadius:8,height:7,width:94,marginTop:6,overflow:"hidden",boxShadow:"inset 0 2px 4px rgba(0,0,0,0.4)"}}>
                <div style={{height:"100%",width:`${xpPct}%`,background:`linear-gradient(90deg,${T.xp},${T.g1})`,borderRadius:8,transition:"width 0.8s"}}/>
              </div>
              <div onClick={()=>setRewardsOpen(true)} style={{fontSize:9,color:T.t2,marginTop:3,fontFamily:"'DM Sans',sans-serif",cursor:"pointer",display:"inline-flex",alignItems:"center",gap:4}}>{xp} XP · Lv {lv.l} <span style={{color:T.au1}}>🎁</span></div>
            </div>
          </div>
          {/* Counters */}
          <div style={{display:"flex",gap:8,alignItems:"center"}}>
            <StreakBadge value={streak} label={t("streakLabel")} icon="🔥" color="#FF8040" bg="rgba(255,128,64,0.12)"/>
            <StreakBadge value={gems}  label={t("gemsLabel")}  icon="💎" color={T.au1}   bg="rgba(255,200,0,0.1)"/>
          </div>
        </div>
      </div>

      <div style={{padding:"4px 18px 0"}}>

        {/* ── HOME ──────────────────────────────────────────────────────────── */}
        {tab==="home"&&<>
          {/* ── Countdown de semana de prueba (tap → checkout) ── */}
          {trialDiasRest&&(
            <button onClick={()=>{sfx("tap");abrirCheckoutStripe(profile?.id);}} style={{
              width:"100%",boxSizing:"border-box",display:"flex",alignItems:"center",gap:10,
              background:trialDiasRest<=2?"rgba(229,115,115,0.12)":"rgba(255,200,0,0.10)",
              border:`1.5px solid ${trialDiasRest<=2?"rgba(229,115,115,0.5)":"rgba(255,200,0,0.45)"}`,
              borderRadius:14,padding:"10px 14px",marginBottom:14,cursor:"pointer",textAlign:"left"}}>
              <span style={{fontSize:20,lineHeight:1}}>{trialDiasRest<=2?"⏳":"🎁"}</span>
              <div style={{flex:1,minWidth:0}}>
                <div style={{fontSize:12.5,fontWeight:900,color:trialDiasRest<=2?"#e57373":T.au1,fontFamily:"'Nunito',sans-serif"}}>
                  {lang==='en'
                    ? (trialDiasRest===1?'Last day of your free trial!':`Free trial · ${trialDiasRest} days left`)
                    : (trialDiasRest===1?'¡Último día de tu semana gratis!':`Semana de prueba · quedan ${trialDiasRest} días`)}
                </div>
                <div style={{fontSize:10.5,color:T.t2,fontFamily:"'DM Sans',sans-serif"}}>
                  {lang==='en'?'Keep your plan from €7/month →':'Conserva tu programación por 7 €/mes →'}
                </div>
              </div>
            </button>
          )}
          {/* Mascot + bubble con diana y mute a los lados */}
          <div style={{display:"flex",flexDirection:"column",alignItems:"center",gap:14,paddingTop:4,paddingBottom:18}}>

            {/* Fila: 🎯 | Bocadillo | 🔇 */}
            <div style={{display:"flex",alignItems:"center",width:"100%",gap:8,paddingLeft:4,paddingRight:4}}>

              {/* ── Diana desafíos (izquierda) ── */}
              {(()=>{
                const weekChs    = getWeekChallenges();
                const allClaimed = claimedChallenges.length>=weekChs.length;
                const anyDone    = weekChs.some(ch=>{
                  const prog=getChallengeProgress(ch,logs,weights,xp,streak);
                  return prog>=ch.goal && !claimedChallenges.includes(ch.id);
                });
                const claimCount = weekChs.filter(ch=>{
                  const prog=getChallengeProgress(ch,logs,weights,xp,streak);
                  return prog>=ch.goal && !claimedChallenges.includes(ch.id);
                }).length;
                return(
                  <div style={{position:"relative",flexShrink:0}}>
                    <button
                      onClick={()=>setShowChallenges(true)}
                      style={{
                        width:44,height:44,borderRadius:16,
                        background:anyDone
                          ?'linear-gradient(135deg,'+T.au1+','+T.au2+')'
                          :allClaimed
                            ?"rgba(88,204,2,0.18)"
                            :"linear-gradient(180deg, rgba(255,208,60,0.38), rgba(150,105,0,0.34))",
                        border:anyDone?`2px solid ${T.au3}`:allClaimed?`1.5px solid ${T.g3}`:`1.5px solid rgba(255,200,0,0.55)`,
                        boxShadow:anyDone?`0 4px 0 ${T.au3},0 0 14px ${T.au1}60`:allClaimed?`0 3px 0 ${T.g3}`:"0 3px 0 rgba(110,78,0,0.9)",
                        cursor:"pointer",
                        display:"flex",flexDirection:"column",alignItems:"center",justifyContent:"center",gap:1,
                        animation:anyDone?"pulse 1.5s ease-in-out infinite":"none",
                        transition:"all 0.3s",
                      }}>
                      <span style={{fontSize:20,lineHeight:1}}>{allClaimed?"✓":anyDone?"❕":"🎯"}</span>
                    </button>
                    {anyDone&&claimCount>0&&(
                      <div style={{
                        position:"absolute",top:-5,right:-5,
                        width:18,height:18,borderRadius:"50%",
                        background:"#FF3B30",border:"2px solid #0A1A0F",
                        fontSize:10,fontWeight:900,color:"white",
                        display:"flex",alignItems:"center",justifyContent:"center",
                        fontFamily:"'Nunito',sans-serif",
                      }}>{claimCount}</div>
                    )}
                  </div>
                );
              })()}

              {/* Bocadillo centrado */}
              <div style={{flex:1,display:"flex",justifyContent:"center"}}>
                <Bubble msg={(()=>{
                  const base = getBubbleMsg(profile?.name||"",streak,expr,lang);
                  const pj = PERSONALIDADES.find(q=>q.id===boPersonalidad);
                  const cs = (pj && pj.coletillas) || [];
                  // Coletilla del carácter de Bo, estable durante el día (sin parpadeos)
                  return cs.length ? base + "  " + cs[new Date().getDate() % cs.length] : base;
                })()}/>
              </div>

              {/* ── Mute (derecha) ── */}
              <button
                onClick={()=>{ const nm=!muted; setMuted(nm); lsSet("gbh:mute",nm); if(!nm) SFX.tap(); }}
                style={{
                  flexShrink:0,
                  width:44,height:44,borderRadius:16,
                  background:"linear-gradient(180deg, rgba(255,208,60,0.38), rgba(150,105,0,0.34))",
                  border:`1.5px solid rgba(255,200,0,0.55)`,
                  cursor:"pointer",fontSize:20,
                  display:"flex",alignItems:"center",justifyContent:"center",
                  boxShadow:"0 3px 0 rgba(110,78,0,0.9)",
                  transition:"all 0.2s",
                }}>
                {muted?"🔇":"🔊"}
              </button>

            </div>

            {/* 🐑 Bo — la mascota personalizable sustituye al avatar genérico */}
            <style>{`
        @keyframes bounce { 0%,100%{transform:translateY(0)} 50%{transform:translateY(-7px)} }
        @keyframes idle { 0%,100%{transform:translateY(0)} 50%{transform:translateY(-2px)} }
        @keyframes wiggle { 0%,100%{transform:rotate(-2deg)} 50%{transform:rotate(2deg)} }
        @keyframes droop { 0%,100%{transform:translateY(2px) rotate(-1.5deg)} 50%{transform:translateY(3px) rotate(-1.5deg)} }
        @keyframes breathe { 0%,100%{transform:scale(1)} 50%{transform:scale(1.03)} }
        @keyframes floaty { 0%{transform:translateY(0);opacity:.9} 100%{transform:translateY(-14px);opacity:0} }
        @keyframes popIn { from{transform:scale(.92);opacity:0} to{transform:scale(1);opacity:1} }
        .float-fx { position:absolute; font-size:20px; animation:floaty 1.8s ease-out infinite; }
        @media (prefers-reduced-motion: reduce){ svg,.float-fx{animation:none!important} }
      `}</style>
            <div style={{position:"relative",width:"100%"}}>
              {/* 🎮 bajo el botón de la diana (misma columna izquierda) */}
              <button onClick={()=>{ cargarPartidasHoy(); setZonaJuego(true); }} title="Zona de juego"
                style={{position:"absolute",left:0,top:2,zIndex:2,width:44,height:44,borderRadius:16,
                  background:"linear-gradient(180deg, rgba(255,208,60,0.38), rgba(150,105,0,0.34))",
                  border:"1.5px solid rgba(255,200,0,0.55)",
                  boxShadow:"0 3px 0 rgba(110,78,0,0.9)",cursor:"pointer",fontFamily:"inherit",padding:0,
                  display:"flex",alignItems:"center",justifyContent:"center"}}>
                <span style={{fontSize:20,lineHeight:1}}>🎮</span>
              </button>
              <div onClick={tapSheep} style={{cursor:"pointer",display:"flex",justifyContent:"center"}}>
                <Sheep estado={boEstado} equipados={boEquipados} color={boColor} size={200}/>
              </div>
              {/* Nombre de Bo + 🎨 pequeñito al lado */}
              <div style={{display:"flex",alignItems:"center",justifyContent:"center",gap:7,marginTop:2}}>
                <span style={{fontSize:12.5,fontWeight:900,color:T.t2}}>🐑 {boNombre}</span>
                <button onClick={()=>setPanelBo(true)} title="Personalizar a tu oveja"
                  style={{width:26,height:26,borderRadius:9,
                    background:"linear-gradient(180deg, rgba(255,208,60,0.38), rgba(150,105,0,0.34))",
                    border:"1.5px solid rgba(255,200,0,0.55)",boxShadow:"0 2px 0 rgba(110,78,0,0.9)",
                    cursor:"pointer",padding:0,display:"flex",alignItems:"center",justifyContent:"center"}}>
                  <span style={{fontSize:13,lineHeight:1}}>🎨</span>
                </button>
              </div>
            </div>
          </div>

          <WeeklyXPGoal logs={logs} xp={xp}/>
          <WeekPath logs={logs} onOpenChest={()=>{ sfx("chest"); setShowWeekChest(true); }}/>
          {allDone&&<TomorrowCard name={profile?.name||""} streak={streak}/>}

          {/* Section label */}
          <div style={{textAlign:"center",marginBottom:12}}>
            <span style={{background:T.bgWood,border:`2px solid ${T.bW}`,borderRadius:16,padding:"7px 20px",fontSize:11,fontWeight:900,color:T.au1,textTransform:"uppercase",letterSpacing:"0.08em",boxShadow:"0 4px 0 rgba(0,0,0,0.4)"}}>{t("dailyMissions")}</span>
          </div>

          {tomasHoy
            ? <MealBtns tomas={tomasHoy} meals={mealsHoy} done={tLog.diet} lang={lang} onTap={marcarTomaHome}/>
            : <BigBtn icon="🍽️" label={t("dietBtn")} done={tLog.diet} onClick={()=>toggleM("diet")}/>}

          <MRow num="2" icon="🌙" label={t("sleepLabel")} done={tLog.sleep} onToggle={()=>toggleM("sleep")} xpR={5}/>
          <StepsWidget done={tLog.steps} stepCount={steps} onToggle={()=>toggleM("steps")} onUpdateSteps={updSteps}/>
          <HydrationWidget done={tLog.hydration} onToggle={()=>toggleM("hydration")}/>

          {/* ── Quiz + Ruleta ── */}
          <div style={{display:"flex",gap:8,marginBottom:10}}>
            <div onClick={quizDone?undefined:()=>setShowQuiz(true)} style={{flex:1,background:quizDone?"rgba(88,204,2,0.14)":T.bgWood,border:`2px solid ${quizDone?T.g1:T.bW}`,borderRadius:18,padding:"12px 10px",display:"flex",flexDirection:"column",alignItems:"center",justifyContent:"center",gap:5,cursor:quizDone?"default":"pointer",boxShadow:quizDone?`0 4px 0 ${T.g3}`:"0 4px 0 rgba(0,0,0,0.4)",minHeight:76,textAlign:"center"}}>
              <div style={{fontSize:26,lineHeight:1}}>{quizDone?"✅":"❓"}</div>
              <div style={{fontSize:13,fontWeight:900,color:quizDone?T.g2:T.t1}}>{quizDone?t("quizDone"):t("quiz")}</div>
              <div style={{fontSize:10,color:T.au1,fontWeight:700}}>{quizDone?"+20 XP +8 💎":t("earnXP")}</div>
            </div>
            <div onClick={ruletaDone?undefined:()=>setShowRuleta(true)} style={{flex:1,background:ruletaDone?"rgba(88,204,2,0.14)":T.bgWood,border:`2px solid ${ruletaDone?T.g1:T.bW}`,borderRadius:18,padding:"12px 10px",display:"flex",flexDirection:"column",alignItems:"center",justifyContent:"center",gap:5,cursor:ruletaDone?"default":"pointer",boxShadow:ruletaDone?`0 4px 0 ${T.g3}`:"0 4px 0 rgba(0,0,0,0.4)",minHeight:76,textAlign:"center"}}>
              <div style={{fontSize:26,lineHeight:1,animation:ruletaDone?"none":"pulse 2s ease-in-out infinite"}}>{ruletaDone?"✅":"🎰"}</div>
              <div style={{fontSize:13,fontWeight:900,color:ruletaDone?T.g2:T.t1}}>{ruletaDone?t("rouletteDone"):t("roulette")}</div>
              <div style={{fontSize:10,color:T.au1,fontWeight:700}}>{ruletaDone?t("untilTomorrow"):t("spinFree")}</div>
            </div>
          </div>

          {/* Shield shop */}
          <Card style={{marginTop:4}}>
            <div style={{display:"flex",alignItems:"center",justifyContent:"space-between"}}>
              <div>
                <div style={{fontSize:15,fontWeight:900}}>{t("streakShield")}</div>
                <div style={{fontSize:12,color:T.t2,marginTop:2,fontFamily:"'DM Sans',sans-serif"}}>{t("shieldDesc",{n:profile?.shields||0})}</div>
              </div>
              <button onClick={buyShield} style={{background:gems>=200?'linear-gradient(135deg,'+T.au1+','+T.au2+')':"rgba(255,255,255,0.08)",border:"none",borderRadius:16,padding:"12px 20px",color:gems>=200?"#1A1000":T.t2,fontWeight:900,cursor:"pointer",fontSize:14,boxShadow:gems>=200?'0 5px 0 '+T.au3:"none",fontFamily:"'Nunito',sans-serif"}}>
                💎 200
              </button>
            </div>
          </Card>
        </>}

        {/* ── WEIGHT ────────────────────────────────────────────────────────── */}
        {tab==="weight"&&(()=>{
          const todayW=weekendWeighIn(weights);
          const isWE=isWeekend();

          // ── No es fin de semana ──────────────────────────────────────────
          if(!isWE) return(
            <>
              <Card style={{textAlign:"center",padding:"28px 24px"}}>
                <div style={{display:"flex",justifyContent:"center",marginBottom:16}}>
                  <Mascot expr="sleeping" size={150}/>
                </div>
                <div style={{fontSize:19,fontWeight:900,color:T.au1,marginBottom:10}}>{t("scaleResting")}</div>
                <div style={{fontSize:14,color:T.t2,lineHeight:1.75,fontFamily:"'DM Sans',sans-serif"}}>
                  {t("scaleRestingDesc")}<br/>
                  <span style={{color:T.au1,fontWeight:700}}>{t("scaleRestingBack")}</span> {t("scaleRestingDesc2")}
                </div>
                <div style={{display:"flex",justifyContent:"center",gap:8,marginTop:18}}>
                  {WLABELS.map((d,i)=>(
                    <div key={d} style={{width:34,height:34,borderRadius:11,display:"flex",alignItems:"center",justifyContent:"center",fontSize:11,fontWeight:900,background:i>=5?`${T.g1}40`:"rgba(255,255,255,0.06)",color:i>=5?T.g2:T.t2,border:i===Math.max(0,new Date().getDay()-1)?`2.5px solid ${T.au1}`:"2px solid transparent",boxShadow:i>=5?`0 3px 0 ${T.g3}`:"none"}}>{d}</div>
                  ))}
                </div>
              </Card>
              {chartData.length>0&&<WeightChart chartData={chartData} setWeightMode={setWeightMode} goalWeight={profile?.goal_weight||null} shareName={profile?.name} lang={lang}/>}
              {profile?.plan==='premium'&&<TarjetaMetabolismo seg={segPlan} lang={lang}/>}
            </>
          );

          // ── Modo INPUT (pantalla completa de registro) ───────────────────
          const showInput = weightMode==="input" || (!todayW && weightMode!=="chart");
          if(showInput) return(
            <div style={{display:"flex",flexDirection:"column",alignItems:"center",padding:"12px 0 24px",minHeight:"60vh",justifyContent:"center"}}>
              {/* Mascota */}
              <div style={{marginBottom:16}}>
                <Mascot expr="happy" size={140}/>
              </div>
              {/* Título */}
              <div style={{fontSize:22,fontWeight:900,color:T.wh,marginBottom:4,textAlign:"center"}}>
                {todayW?t("editWeightTitle"):t("howMuchToday")}
              </div>
              <div style={{fontSize:13,color:T.t2,marginBottom:28,textAlign:"center",fontFamily:"'DM Sans',sans-serif"}}>
                {t("fastingHint")}
              </div>
              {/* Input grande centrado */}
              <div style={{display:"flex",alignItems:"center",gap:8,marginBottom:10,width:"100%",maxWidth:280,overflow:"hidden"}}>
                <input
                  type="number" value={wInput}
                  onChange={e=>setWInput(e.target.value)}
                  onKeyDown={e=>e.key==="Enter"&&saveW(!!todayW)}
                  placeholder={todayW?String(todayW.weight):"75.5"}
                  step="0.1" autoFocus
                  style={{flex:1,background:"rgba(255,255,255,0.09)",border:`3px solid ${T.g1}`,borderRadius:20,padding:"16px 12px",color:T.cr,fontSize:28,fontWeight:900,fontFamily:"'DM Sans',sans-serif",textAlign:"center",boxShadow:`0 0 0 4px ${T.g1}22`,minWidth:0,maxWidth:"100%"}}
                />
                <span style={{fontSize:20,fontWeight:800,color:T.t2}}>kg</span>
              </div>
              {todayW&&<div style={{fontSize:11,color:T.t2,marginBottom:20,fontFamily:"'DM Sans',sans-serif"}}>{t("editNote")}</div>}
              {/* Botón guardar */}
              <button
                onClick={()=>saveW(!!todayW)}
                disabled={!wInput||isNaN(parseFloat(wInput))}
                style={{width:"100%",maxWidth:280,padding:"18px 0",borderRadius:20,border:`3px solid ${T.g3}`,cursor:"pointer",fontSize:18,fontWeight:900,background:!wInput||isNaN(parseFloat(wInput))?"rgba(255,255,255,0.1)":`linear-gradient(135deg,${T.g1},${T.g2})`,color:!wInput||isNaN(parseFloat(wInput))?T.t2:"white",boxShadow:!wInput||isNaN(parseFloat(wInput))?"none":`0 6px 0 ${T.g3}`,fontFamily:"'Nunito',sans-serif",marginBottom:14}}
              >
                {todayW?t("saveChanges"):t("saveWeight")}
              </button>
              {(todayW||chartData.length>0)&&(
                <button onClick={()=>setWeightMode("chart")} style={{background:"none",border:"none",color:T.t2,fontSize:13,fontWeight:700,cursor:"pointer",padding:"8px 20px",fontFamily:"'Nunito',sans-serif"}}>
                  {t("seeChart")}
                </button>
              )}
              {/* Volver a inicio */}
              <button onClick={()=>setTab("home")} style={{marginTop:6,background:"none",border:`1.5px solid rgba(255,255,255,0.12)`,borderRadius:14,color:T.t3,fontSize:13,fontWeight:700,cursor:"pointer",padding:"10px 28px",fontFamily:"'Nunito',sans-serif",letterSpacing:"0.01em"}}>
                {t("backToHome")}
              </button>
            </div>
          );

          // ── Modo CHART (vista de gráfica) ────────────────────────────────
          return(
            <>
              {/* Card resumen del pesaje de hoy */}
              {todayW&&(
                <div style={{background:`linear-gradient(135deg,rgba(43,122,0,0.4),rgba(88,204,2,0.18))`,border:`2px solid ${T.g1}`,borderRadius:22,padding:"16px 20px",marginBottom:14,boxShadow:`0 6px 0 ${T.g3}`,display:"flex",alignItems:"center",justifyContent:"space-between"}}>
                  <div>
                    <div style={{fontSize:11,color:T.g2,fontWeight:900,textTransform:"uppercase",letterSpacing:"0.08em",marginBottom:4}}>{t("weekendWeighLabel")}</div>
                    <div style={{fontSize:38,fontWeight:900,color:T.wh,lineHeight:1}}>{todayW.weight} <span style={{fontSize:18,color:T.t2}}>kg</span></div>
                    <div style={{fontSize:11,color:T.t2,marginTop:4,fontFamily:"'DM Sans',sans-serif"}}>{todayW.date}</div>
                  </div>
                  {/* Botón editar (lápiz) */}
                  <button onClick={()=>{setWInput(String(todayW.weight));setWeightMode("input");}} style={{width:48,height:48,borderRadius:16,background:"rgba(255,255,255,0.1)",border:`2px solid rgba(255,255,255,0.18)`,cursor:"pointer",fontSize:22,display:"flex",alignItems:"center",justifyContent:"center",boxShadow:"0 3px 0 rgba(0,0,0,0.4)"}}>
                    ✏️
                  </button>
                </div>
              )}
              {/* Sin pesaje hoy */}
              {!todayW&&(
                <button onClick={()=>{setWInput("");setWeightMode("input");}} style={{width:"100%",padding:"17px 20px",borderRadius:20,border:`3px solid ${T.g3}`,cursor:"pointer",fontSize:17,fontWeight:900,background:`linear-gradient(135deg,${T.g1},${T.g2})`,color:"white",boxShadow:`0 6px 0 ${T.g3}`,animation:"glow 2.5s ease-in-out infinite",marginBottom:14,fontFamily:"'Nunito',sans-serif",display:"flex",alignItems:"center",justifyContent:"center",gap:12}}>
                  <span style={{fontSize:26}}>⚖️</span> {t("registerWeightBtn").replace("⚖️ ","")}
                </button>
              )}
              {/* Gráfica */}
              {chartData.length>0&&<WeightChart chartData={chartData} setWeightMode={setWeightMode} goalWeight={profile?.goal_weight||null} shareName={profile?.name} lang={lang}/>}
              {profile?.plan==='premium'&&<TarjetaMetabolismo seg={segPlan} lang={lang}/>}
              {/* Empty state */}
              {chartData.length===0&&(
                <Card style={{textAlign:"center",padding:"28px"}}>
                  <div style={{display:"flex",justifyContent:"center",marginBottom:12}}><Mascot expr="idle" size={110}/></div>
                  <div style={{fontSize:16,fontWeight:900,color:T.t1,marginBottom:6}}>Tu gráfica aparecerá aquí</div>
                  <div style={{color:T.t2,fontSize:13,fontFamily:"'DM Sans',sans-serif",lineHeight:1.6}}>{t("firstWeighLine1")}<br/>{t("firstWeighLine2")}</div>
                </Card>
              )}
            </>
          );
        })()}

        {/* ── ACHIEVEMENTS ──────────────────────────────────────────────────── */}
        {/* ── RANKING ──────────────────────────────────────────────────────── */}
        {tab==="ranking"&&(()=>{
          const medal=["👑","🥈","🥉"];
          const medalColor=["#FFD700","#C0C0C0","#CD7F32"];

          // ── Construir los 3 rankings ordenados ───────────────────────────
          const byStreak = [...ranking].sort((a,b)=>(b.streak||0)-(a.streak||0));
          const byWeight = [...ranking].sort((a,b)=>(b.weightAbs||0)-(a.weightAbs||0));
          // 🎮 Juego sustituye a ⚡ XP en el ranking (la XP sigue viva para los niveles)
          const byJuego  = [...ranking].sort((a,b)=>(b.juegoPts||0)-(a.juegoPts||0));

          const tables=[
            {key:"streak", icon:"🔥", title:t("rankStreak"), subtitle:t("rankStreakSub"),  list:byStreak,  statFn:p=>`${p.streak||0}🔥`,  statLabel:t("rankDays")},
            {key:"weight", icon:"⚖️", title:t("rankWeight"), subtitle:t("rankWeightSub"),   list:byWeight,  statFn:p=>p.weightDiff!==null?`${p.weightDiff>=0?"+":""}${p.weightDiff}kg`:"—", statLabel:"kg"},
            {key:"juego",  icon:"🎮", title:"Juego", subtitle:"Puntos de juego · se reinicia cada lunes", list:byJuego, statFn:p=>`${p.juegoPts||0} pts`, statLabel:"pts"},
          ];

          const curTable = tables[rankTab];
          const list10   = curTable.list.slice(0,10);
          const myGlobalPos = curTable.list.findIndex(p=>p.id===profile?.id);
          const myInTop10   = myGlobalPos>=0 && myGlobalPos<10;
          const myEntry     = curTable.list[myGlobalPos];

          return(
            <div>
              {/* ── Cabecera ── */}
              <div style={{textAlign:"center",paddingTop:4,paddingBottom:14}}>
                <div style={{fontSize:28,marginBottom:2}}>👑</div>
                <div style={{fontSize:20,fontWeight:900,color:T.wh}}>{t("rankingTitle")}</div>
              </div>

              {/* ── Selector de tabla (3 tabs deslizables) ── */}
              <div style={{display:"flex",gap:0,marginBottom:16,background:"rgba(255,255,255,0.06)",borderRadius:18,padding:4,border:`1.5px solid ${T.bW}`}}>
                {tables.map((t,i)=>(
                  <button key={t.key} onClick={()=>setRankTab(i)} style={{
                    flex:1,padding:"10px 6px",borderRadius:14,border:"none",cursor:"pointer",
                    background:rankTab===i?`linear-gradient(135deg,${T.g1},${T.g2})`:"transparent",
                    color:rankTab===i?"white":T.t2,
                    fontWeight:rankTab===i?900:700,
                    fontSize:13,fontFamily:"'Nunito',sans-serif",
                    boxShadow:rankTab===i?`0 3px 0 ${T.g3}`:"none",
                    transition:"all 0.2s",
                  }}>
                    {t.icon} {t.title}
                  </button>
                ))}
              </div>

              {/* ── Subtítulo ── */}
              <div style={{fontSize:11,color:T.t2,textAlign:"center",fontFamily:"'DM Sans',sans-serif",marginBottom:14,letterSpacing:"0.05em",textTransform:"uppercase"}}>
                {curTable.subtitle}
              </div>

              {/* ── Lista ── */}
              {rankLoading?(
                <div style={{textAlign:"center",padding:"40px 0",color:T.t2,fontSize:14}}>
                  <div style={{fontSize:32,marginBottom:12,animation:"spin 1s linear infinite",display:"inline-block"}}>🔄</div>
                  <div style={{fontFamily:"'DM Sans',sans-serif"}}>{t("rankLoading")}</div>
                </div>
              ):ranking.length===0?(
                <div style={{textAlign:"center",padding:"32px 24px",background:T.bgWood,borderRadius:22,border:`2px solid ${T.bW}`}}>
                  <div style={{display:"flex",justifyContent:"center",marginBottom:12}}><AvatarDisplay expr="idle" size={90}/></div>
                  <div style={{fontSize:15,fontWeight:900,color:T.t1,marginBottom:6}}>{t("rankEmpty")}</div>
                  <div style={{fontSize:13,color:T.t2,fontFamily:"'DM Sans',sans-serif"}}>{t("rankEmptyDesc")}</div>
                </div>
              ):(
                <div style={{display:"flex",flexDirection:"column",gap:7}}>
                  {list10.map((p,i)=>{
                    const isMe = p.id===profile?.id;
                    const lv2  = getLevel(p.xp||0);
                    return(
                      <div key={p.id} style={{
                        background: isMe
                          ? "linear-gradient(135deg,rgba(255,200,0,0.22),rgba(88,204,2,0.1))"
                          : i===0 ? "linear-gradient(135deg,rgba(255,200,0,0.1),rgba(255,160,0,0.05))"
                          : T.bgWood,
                        border:`2px solid ${isMe?T.au1:i===0?"rgba(255,200,0,0.35)":T.bW}`,
                        borderRadius:18,padding:"11px 14px",
                        display:"flex",alignItems:"center",gap:10,
                        boxShadow:isMe?`0 4px 0 ${T.au3}`:i===0?"0 4px 0 rgba(180,130,0,0.4)":"0 3px 0 rgba(0,0,0,0.35)",
                      }}>
                        {/* Posición / medalla */}
                        <div style={{width:34,textAlign:"center",flexShrink:0}}>
                          {i<3?(
                            <span style={{fontSize:24}}>{medal[i]}</span>
                          ):(
                            <span style={{fontSize:15,fontWeight:900,color:T.t2}}>{i+1}</span>
                          )}
                        </div>
                        {/* Avatar con marco de nivel (en 🎮 Juego: la mini-Bo de cada paciente) */}
                        {curTable.key==="juego"&&p.bo_color?(
                          <div style={{width:38,height:38,display:"flex",alignItems:"center",justifyContent:"center",flexShrink:0}}>
                            <Sheep estado="feliz" mini size={38} color={p.bo_color}
                              equipados={Array.isArray(p.bo_equipados)?p.bo_equipados:[]}/>
                          </div>
                        ):(()=>{
                          const pFrame = Math.floor(Math.min(lv2.l,500)/100)||0;
                          const fr2 = FRAMES[pFrame];
                          return(
                            <div style={{width:38,height:38,borderRadius:12,
                              background:isMe?'linear-gradient(135deg,'+T.au1+','+T.au2+')':"linear-gradient(135deg,#2A5A2A,#1A3A10)",
                              display:"flex",alignItems:"center",justifyContent:"center",flexShrink:0,
                              border: fr2 ? fr2.border : `2px solid ${isMe?T.au3:T.bW}`,
                              boxShadow: fr2 ? fr2.boxShadow : "0 3px 0 rgba(0,0,0,0.4)",
                            }}>
                              <span style={{fontSize:17,fontWeight:900,
                                color:isMe?"#1A1000":"rgba(255,255,255,0.85)",
                                fontFamily:"'Nunito',sans-serif"}}>
                                {(p.name||"?")[0].toUpperCase()}
                              </span>
                            </div>
                          );
                        })()}
                        {/* Nombre */}
                        <div style={{flex:1,minWidth:0}}>
                          <div style={{fontSize:14,fontWeight:900,color:isMe?T.au1:T.wh,whiteSpace:"nowrap",overflow:"hidden",textOverflow:"ellipsis"}}>
                            {p.name?.split(" ")[0]||"—"}{isMe?" 👈":""}
                          </div>
                          <div style={{fontSize:10,color:T.t2,fontFamily:"'DM Sans',sans-serif"}}>{lv2.n} · Lv {lv2.l}</div>
                        </div>
                        {/* Stat principal */}
                        <div style={{textAlign:"right",flexShrink:0}}>
                          <div style={{fontSize:16,fontWeight:900,color:rankTab===0?"#FF8040":rankTab===2?T.au1:T.t1}}>{curTable.statFn(p)}</div>
                          <div style={{fontSize:9,color:T.t2,textTransform:"uppercase",letterSpacing:"0.06em"}}>{curTable.statLabel}</div>
                        </div>
                      </div>
                    );
                  })}

                  {/* ── Posición del usuario si está fuera del top 10 ── */}
                  {!myInTop10&&myGlobalPos>=0&&myEntry&&(
                    <>
                      {/* Separador con puntos */}
                      <div style={{textAlign:"center",padding:"6px 0",color:T.t2,fontSize:18,letterSpacing:6}}>···</div>
                      {/* Fila del usuario */}
                      <div style={{
                        background:"linear-gradient(135deg,rgba(255,200,0,0.22),rgba(88,204,2,0.1))",
                        border:`2px solid ${T.au1}`,borderRadius:18,padding:"11px 14px",
                        display:"flex",alignItems:"center",gap:10,
                        boxShadow:`0 4px 0 ${T.au3}`,
                      }}>
                        <div style={{width:34,textAlign:"center",flexShrink:0}}>
                          <span style={{fontSize:15,fontWeight:900,color:T.au1}}>#{myGlobalPos+1}</span>
                        </div>
                        <div style={{width:38,height:38,borderRadius:12,background:'linear-gradient(135deg,'+T.au1+','+T.au2+')',display:"flex",alignItems:"center",justifyContent:"center",flexShrink:0,border:`2px solid ${T.au3}`,boxShadow:"0 3px 0 rgba(0,0,0,0.4)"}}>
                          <span style={{fontSize:17,fontWeight:900,color:"#1A1000",fontFamily:"'Nunito',sans-serif"}}>{(myEntry.name||"?")[0].toUpperCase()}</span>
                        </div>
                        <div style={{flex:1,minWidth:0}}>
                          <div style={{fontSize:14,fontWeight:900,color:T.au1,whiteSpace:"nowrap",overflow:"hidden",textOverflow:"ellipsis"}}>
                            {myEntry.name?.split(" ")[0]||"—"} 👈
                          </div>
                          <div style={{fontSize:10,color:T.t2,fontFamily:"'DM Sans',sans-serif"}}>{getLevel(myEntry.xp||0).n} · Lv {getLevel(myEntry.xp||0).l}</div>
                        </div>
                        <div style={{textAlign:"right",flexShrink:0}}>
                          <div style={{fontSize:16,fontWeight:900,color:rankTab===0?"#FF8040":rankTab===1?T.xp:T.t1}}>{curTable.statFn(myEntry)}</div>
                          <div style={{fontSize:9,color:T.t2,textTransform:"uppercase",letterSpacing:"0.06em"}}>{curTable.statLabel}</div>
                        </div>
                      </div>
                    </>
                  )}
                </div>
              )}

              {/* Refresh */}
              <div style={{textAlign:"center",marginTop:16,marginBottom:4}}>
                <button onClick={loadRanking} style={{background:"rgba(255,255,255,0.07)",border:`1.5px solid ${T.bW}`,borderRadius:14,padding:"10px 24px",color:T.t2,fontWeight:800,fontSize:12,cursor:"pointer",fontFamily:"'Nunito',sans-serif"}}>
                  {t("rankUpdateBtn")}
                </button>
              </div>
            </div>
          );
        })()}

        {tab==="receta"&&(()=>{
          const r = dailyRecipe;
          const tipoColor = {
            Carne:"#E57373",Pescado:"#64B5F6",Vegetariana:"#81C784",
            Vegana:"#A5D6A7",Postre:"#F06292",Ensalada:"#AED581","Sopa/Crema":"#FFB74D",
            Meat:"#E57373",Fish:"#64B5F6",Vegetarian:"#81C784",
            Vegan:"#A5D6A7",Dessert:"#F06292",Salad:"#AED581","Soup/Cream":"#FFB74D"
          };
          const tipoIcon = {
            Carne:"🥩",Pescado:"🐟",Vegetariana:"🥦",
            Vegana:"🌱",Postre:"🍰",Ensalada:"🥗","Sopa/Crema":"🍲",
            Meat:"🥩",Fish:"🐟",Vegetarian:"🥦",
            Vegan:"🌱",Dessert:"🍰",Salad:"🥗","Soup/Cream":"🍲"
          };
          const tc = r ? (tipoColor[r.tipo]||T.g1) : T.g1;
          const ti = r ? emojiPlato(r.nombre, r.tipo) : "🍽️";
          const ingList = r?.ingredientes?.split(/[,;](?![^(]*\))/).map(s=>s.trim()).filter(Boolean) || [];
          const alreadySaved = r && savedRecipes.some(s => s.recipe_id === r.id_receta);
          const tieneAccesoCompleto = profile?.plan==='premium' || profile?.plan==='standard';

          return(
            <div style={{padding:"0 16px 24px"}}>

              {/* ══════════════ MENÚ: 3 botones (estilo plan) ══════════════ */}
              {recipeView==="menu"&&(
                <div style={{display:"flex",flexDirection:"column",gap:12,paddingTop:8}}>
                  {/* Receta del día */}
                  <button onClick={()=>setRecipeView("daily")} style={{background:'rgba(88,204,2,0.12)',border:'2px solid rgba(88,204,2,0.3)',borderRadius:20,padding:'20px',textAlign:'left',cursor:'pointer',display:'flex',alignItems:'center',gap:16,boxShadow:'0 4px 0 rgba(0,0,0,0.3)'}}>
                    <div style={{fontSize:40,flexShrink:0}}>🍰</div>
                    <div style={{flex:1,minWidth:0}}>
                      <div style={{fontWeight:900,fontSize:16,color:T.t1,marginBottom:4,fontFamily:"'Nunito',sans-serif"}}>{t("recipeTabDaily")}</div>
                      <div style={{fontSize:12,color:T.t2,fontFamily:"'DM Sans',sans-serif",lineHeight:1.5}}>{lang==='en'?"Today's pick with full recipe":'La receta de hoy con ingredientes y preparación'}</div>
                    </div>
                    <div style={{color:T.g1,fontSize:20,flexShrink:0}}>›</div>
                  </button>
                  {/* Mi recetario */}
                  <button onClick={()=>setRecipeView("book")} style={{background:'rgba(100,181,246,0.12)',border:'2px solid rgba(100,181,246,0.3)',borderRadius:20,padding:'20px',textAlign:'left',cursor:'pointer',display:'flex',alignItems:'center',gap:16,boxShadow:'0 4px 0 rgba(0,0,0,0.3)'}}>
                    <div style={{fontSize:40,flexShrink:0}}>📖</div>
                    <div style={{flex:1,minWidth:0}}>
                      <div style={{fontWeight:900,fontSize:16,color:T.t1,marginBottom:4,fontFamily:"'Nunito',sans-serif"}}>{t("recipeTabBook")}{savedRecipes.length>0?` (${savedRecipes.length})`:""}</div>
                      <div style={{fontSize:12,color:T.t2,fontFamily:"'DM Sans',sans-serif",lineHeight:1.5}}>{lang==='en'?'The recipes you saved':'Las recetas que has guardado'}</div>
                    </div>
                    <div style={{color:'#64B5F6',fontSize:20,flexShrink:0}}>›</div>
                  </button>
                  {/* Recetario completo (bloqueado para free) */}
                  <button onClick={()=>setRecipeView("completo")} style={{background:'rgba(255,200,0,0.10)',border:'2px solid rgba(255,200,0,0.3)',borderRadius:20,padding:'20px',textAlign:'left',cursor:'pointer',display:'flex',alignItems:'center',gap:16,boxShadow:'0 4px 0 rgba(0,0,0,0.3)',opacity:tieneAccesoCompleto?1:0.9}}>
                    <div style={{fontSize:40,flexShrink:0}}>{tieneAccesoCompleto?"📚":"🔒"}</div>
                    <div style={{flex:1,minWidth:0}}>
                      <div style={{fontWeight:900,fontSize:16,color:T.t1,marginBottom:4,fontFamily:"'Nunito',sans-serif"}}>{lang==='en'?'Full recipe book':'Recetario completo'}</div>
                      <div style={{fontSize:12,color:T.t2,fontFamily:"'DM Sans',sans-serif",lineHeight:1.5}}>{tieneAccesoCompleto?(lang==='en'?'All recipes by category, sorted by calories':'Todas las recetas por categoría, ordenadas por calorías'):(lang==='en'?'For subscribers (Standard or Premium)':'Para suscriptores (Estándar o Premium)')}</div>
                    </div>
                    <div style={{color:T.au1,fontSize:20,flexShrink:0}}>{tieneAccesoCompleto?"›":"🔒"}</div>
                  </button>
                </div>
              )}

              {/* ── Barra de volver (sub-vistas) ── */}
              {recipeView!=="menu"&&(
                <button onClick={()=>{ if(recipeView==="completo"&&(busqResults!==null||busqTexto)){ buscarIngrediente(""); } else if(recipeView==="completo"&&completoCat){ setCompletoCat(null); } else { setRecipeView("menu"); setCompletoCat(null); } }}
                  style={{background:"none",border:"none",cursor:"pointer",color:T.t2,fontSize:14,fontWeight:800,fontFamily:"'Nunito',sans-serif",padding:"4px 0 12px",display:"flex",alignItems:"center",gap:4}}>
                  ‹ {recipeView==="completo"&&completoCat ? (lang==='en'?'Categories':'Categorías') : (lang==='en'?'Recipes':'Recetas')}
                </button>
              )}

              {/* ══════════════ VISTA: RECETA DEL DÍA ══════════════ */}
              {recipeView==="daily"&&(<>
                {/* Header */}
                <div style={{display:"flex",alignItems:"center",justifyContent:"space-between",marginBottom:16,paddingTop:4}}>
                  <div>
                    <div style={{fontSize:11,color:T.au1,fontWeight:900,textTransform:"uppercase",letterSpacing:"0.1em",marginBottom:2}}>{t("recipeOfDay")}</div>
                    <div style={{fontSize:12,color:T.t2,fontFamily:"'DM Sans',sans-serif"}}>
                      {new Date().toLocaleDateString(lang==="en"?"en-GB":"es-ES",{weekday:"long",day:"numeric",month:"long"})}
                    </div>
                  </div>
                  {(()=>{
                    const refreshesLeft = 3 - recipeRefreshes;
                    const blocked = recipeRefreshes >= 3;
                    const noGems  = gems < 10;
                    const dis = blocked || noGems || recipeLoading;
                    return(
                      <div style={{display:"flex",flexDirection:"column",alignItems:"flex-end",gap:4}}>
                        <button onClick={refreshRecipe} disabled={dis} style={{
                          background:dis?"rgba(255,255,255,0.05)":"rgba(255,200,0,0.12)",
                          border:`1.5px solid ${dis?"rgba(255,255,255,0.1)":T.au2}`,
                          borderRadius:12,padding:"8px 14px",
                          color:dis?T.t3:T.au1,fontSize:12,fontWeight:700,
                          cursor:dis?"not-allowed":"pointer",
                          fontFamily:"'DM Sans',sans-serif",transition:"all 0.2s"}}>
                          {blocked?t("recipeLocked"):noGems?t("recipeNoGems"):t("recipeChange")}
                        </button>
                        <div style={{fontSize:10,color:T.t3,fontFamily:"'DM Sans',sans-serif",textAlign:"right"}}>
                          {blocked ? t("availableTomorrow") : t("changesLeft",{n:refreshesLeft,s:refreshesLeft!==1?"s":""})}
                        </div>
                      </div>
                    );
                  })()}
                </div>

                {recipeLoading&&(
                  <div style={{textAlign:"center",padding:40,color:T.t2,fontSize:14}}>{t("loadingRecipe")}</div>
                )}

                {!recipeLoading&&r&&(<>
                  {/* Nombre y tipo */}
                  <Card style={{marginBottom:12,padding:"20px 18px"}}>
                    <div style={{display:"flex",alignItems:"flex-start",gap:14,marginBottom:16}}>
                      <div style={{fontSize:52,lineHeight:1,flexShrink:0}}>{ti}</div>
                      <div style={{flex:1}}>
                        <div style={{display:"inline-block",background:`${tc}22`,border:`1.5px solid ${tc}55`,
                          borderRadius:20,padding:"3px 12px",fontSize:10,fontWeight:900,
                          color:tc,textTransform:"uppercase",letterSpacing:"0.1em",marginBottom:8}}>
                          {r.tipo}
                        </div>
                        <div style={{fontSize:20,fontWeight:900,color:T.wh,lineHeight:1.25}}>{r.nombre}</div>
                      </div>
                    </div>
                    {/* Macros */}
                    <div style={{display:"grid",gridTemplateColumns:"1fr 1fr 1fr 1fr",gap:8,marginBottom:16}}>
                      {[
                        {l:t("calories"),v:`${r.calorias}`,u:"kcal",c:T.au1},
                        {l:t("protein"),v:`${r.proteinas_g}`,u:"g",c:"#64B5F6"},
                        {l:t("carbs"),v:`${r.hidratos_g}`,u:"g",c:T.g1},
                        {l:t("fat"),v:`${r.grasas_g}`,u:"g",c:"#FFB74D"},
                      ].map(({l,v,u,c})=>(
                        <div key={l} style={{background:"rgba(255,255,255,0.05)",borderRadius:12,
                          padding:"10px 6px",textAlign:"center",border:`1px solid rgba(255,255,255,0.08)`}}>
                          <div style={{fontSize:16,fontWeight:900,color:c}}>{v}</div>
                          <div style={{fontSize:9,color:c,fontWeight:700,opacity:0.8}}>{u}</div>
                          <div style={{fontSize:9,color:T.t3,marginTop:2,fontFamily:"'DM Sans',sans-serif"}}>{l}</div>
                        </div>
                      ))}
                    </div>
                    {/* Botón guardar en recetario */}
                    <button
                      onClick={alreadySaved ? undefined : saveRecipeToBook}
                      disabled={alreadySaved || gems < 20}
                      style={{
                        width:"100%",padding:"12px",borderRadius:14,
                        background:alreadySaved
                          ?"rgba(88,204,2,0.1)"
                          :gems<20
                            ?"rgba(255,255,255,0.05)"
                            :`linear-gradient(135deg,rgba(88,204,2,0.15),rgba(88,204,2,0.08))`,
                        border:`1.5px solid ${alreadySaved?T.g1:gems<20?"rgba(255,255,255,0.1)":"rgba(88,204,2,0.35)"}`,
                        color:alreadySaved?T.g2:gems<20?T.t3:T.g1,
                        fontSize:13,fontWeight:800,
                        cursor:alreadySaved||gems<20?"default":"pointer",
                        fontFamily:"'Nunito',sans-serif",
                        transition:"all 0.2s",
                      }}>
                      {alreadySaved ? t("recipeAlreadySaved") : gems<20 ? `💎 ${lang==="en"?"Need 20 gems":"Necesitas 20 💎"}` : t("saveRecipe")}
                    </button>
                  </Card>

                  {/* Ingredientes */}
                  <Card style={{marginBottom:12,padding:"18px 18px"}}>
                    <div style={{display:"flex",alignItems:"center",justifyContent:"space-between",gap:8,flexWrap:"wrap",marginBottom:12}}>
                      <div style={{fontSize:11,color:T.au1,fontWeight:900,textTransform:"uppercase",letterSpacing:"0.1em"}}>{t("ingredients")}</div>
                      {r.raciones>1&&(<div style={{fontSize:11,color:tc,fontWeight:800,background:tc+"22",borderRadius:20,padding:"3px 11px",whiteSpace:"nowrap"}}>🍽️ {lang==="en"?`Makes ${r.raciones} servings`:`Rinde ${r.raciones} raciones`}</div>)}
                    </div>
                    <div style={{display:"flex",flexDirection:"column",gap:7}}>
                      {ingList.map((ing,i)=>(
                        <div key={i} style={{display:"flex",alignItems:"flex-start",gap:10}}>
                          <div style={{width:6,height:6,borderRadius:"50%",background:tc,flexShrink:0,marginTop:6}}/>
                          <div style={{fontSize:13,color:T.t1,fontFamily:"'DM Sans',sans-serif",lineHeight:1.4}}>{ing}</div>
                        </div>
                      ))}
                    </div>
                  </Card>

                  {/* Preparación */}
                  <Card style={{padding:"18px 18px"}}>
                    <div style={{fontSize:11,color:T.au1,fontWeight:900,textTransform:"uppercase",letterSpacing:"0.1em",marginBottom:12}}>{t("preparation")}</div>
                    <div style={{fontSize:13,color:T.t1,fontFamily:"'DM Sans',sans-serif",lineHeight:1.7,whiteSpace:"pre-wrap"}}>{r.instrucciones}</div>
                  </Card>
                  <BotonCompartirReceta rec={r} lang={lang} sfx={sfx}/>
                </>)}

                {!recipeLoading&&!r&&(
                  <div style={{textAlign:"center",padding:40}}>
                    <div style={{fontSize:48,marginBottom:12}}>🍽️</div>
                    <div style={{fontSize:15,color:T.t2,fontFamily:"'DM Sans',sans-serif",whiteSpace:"pre-line"}}>{t("recipeLoadError")}</div>
                    <button onClick={fetchDailyRecipe} style={{marginTop:16,padding:"12px 24px",background:T.g1,border:"none",borderRadius:14,color:"white",fontWeight:900,cursor:"pointer",fontFamily:"'Nunito',sans-serif"}}>{t("retry")}</button>
                  </div>
                )}
              </>)}

              {/* ══════════════ VISTA: MI RECETARIO ══════════════ */}
              {recipeView==="book"&&(<>
                {savedRecipes.length===0?(
                  <div style={{textAlign:"center",padding:"40px 20px"}}>
                    <div style={{fontSize:64,marginBottom:16}}>📖</div>
                    <div style={{fontSize:16,fontWeight:900,color:T.wh,marginBottom:8}}>{t("recipeBookEmpty")}</div>
                    <div style={{fontSize:13,color:T.t2,fontFamily:"'DM Sans',sans-serif",lineHeight:1.5}}>{t("recipeBookEmptyDesc")}</div>
                    <button onClick={()=>setRecipeView("daily")} style={{
                      marginTop:20,padding:"12px 24px",
                      background:`linear-gradient(135deg,${T.g1},${T.g2})`,
                      border:`2px solid ${T.g3}`,borderRadius:14,
                      color:"white",fontWeight:900,fontSize:14,cursor:"pointer",
                      fontFamily:"'Nunito',sans-serif",boxShadow:`0 4px 0 ${T.g3}`,
                    }}>
                      {lang==="en"?"← Go to today's recipe":"← Ver receta de hoy"}
                    </button>
                  </div>
                ):(
                  <div style={{display:"flex",flexDirection:"column",gap:10}}>
                    {savedRecipes.map((rec,idx)=>(
                      <SavedRecipeCard
                        key={rec.recipe_id||idx}
                        rec={rec}
                        t={t}
                        T={T}
                        removeFromBook={removeFromBook}
                      />
                    ))}
                  </div>
                )}
              </>)}

              {/* ══════════════ VISTA: RECETARIO COMPLETO ══════════════ */}
              {recipeView==="completo"&&(<>
                {!tieneAccesoCompleto ? (
                  /* ── Bloqueo free: invitación a suscribirse ── */
                  <div style={{padding:'24px 8px 8px',textAlign:'center',display:'flex',flexDirection:'column',alignItems:'center',gap:16}}>
                    <div style={{fontSize:52}}>🔒</div>
                    <div style={{fontSize:18,fontWeight:900,color:T.t1,fontFamily:"'Nunito',sans-serif"}}>{lang==='en'?'Full recipe book':'Recetario completo'}</div>
                    <div style={{fontSize:14,color:T.t2,lineHeight:1.7,maxWidth:300,fontFamily:"'DM Sans',sans-serif"}}>
                      {lang==='en'?'All 571 recipes, sorted by calories and grouped by category, are available to Standard and Premium subscribers.':'Las 571 recetas, ordenadas por calorías y agrupadas por categoría, están disponibles para suscriptores Estándar y Premium.'}
                    </div>
                    <button onClick={()=>{sfx&&sfx("tap");abrirCheckoutStripe(profile?.id);}}
                      style={{marginTop:4,width:'100%',maxWidth:300,background:`linear-gradient(135deg,${T.g1},${T.g2})`,border:'none',color:'#fff',fontWeight:900,fontSize:15,borderRadius:18,padding:'16px 20px',cursor:'pointer',boxShadow:`0 4px 0 ${T.g3}`,fontFamily:"'Nunito',sans-serif",display:'flex',alignItems:'center',justifyContent:'center',gap:10}}>
                      <span style={{fontSize:20}}>⭐</span>{lang==='en'?'Subscribe · €7/month':'Suscribirme · 7 €/mes'}
                    </button>
                    <div style={{fontSize:11,color:T.t3,fontFamily:"'DM Sans',sans-serif"}}>
                      {lang==='en'?'Instant access · cancel anytime':'Acceso al momento · cancela cuando quieras'}
                    </div>
                    <a href={`https://wa.me/${GBH_WHATSAPP}?text=${encodeURIComponent(lang==='en'?`Hi! I'm ${profile?.name||''} and I have a question about the GBH subscription 📚`:`¡Hola! Soy ${profile?.name||''} y tengo una duda sobre la suscripción de GBH 📚`)}`}
                      target="_blank" rel="noopener noreferrer" onClick={()=>sfx&&sfx("tap")}
                      style={{fontSize:12,color:T.t2,fontFamily:"'DM Sans',sans-serif",textDecoration:'underline'}}>
                      {lang==='en'?'Questions? Message me 💬':'¿Dudas? Escríbeme 💬'}
                    </a>
                  </div>
                ) : (<>
                  {/* ── Buscador por ingrediente: siempre visible arriba ── */}
                  <div style={{display:"flex",alignItems:"center",gap:8,background:"rgba(255,255,255,0.06)",
                    border:`1.5px solid ${T.bW}`,borderRadius:18,padding:"4px 6px 4px 14px",marginBottom:14,
                    boxShadow:"0 3px 0 rgba(0,0,0,0.25)"}}>
                    <span style={{fontSize:16,opacity:0.85}}>🔍</span>
                    <input type="text" value={busqTexto} onChange={e=>buscarIngrediente(e.target.value)}
                      placeholder={lang==='en'?'Type an ingredient… e.g. chicken':'Escribe un ingrediente… p. ej. pollo'}
                      style={{flex:1,minWidth:0,background:"transparent",border:"none",outline:"none",
                        color:T.t1,fontSize:14,fontFamily:"'DM Sans',sans-serif",padding:"11px 0"}}/>
                    {busqTexto!==""&&(
                      <button onClick={()=>{sfx&&sfx("tap");buscarIngrediente("");}}
                        style={{background:"rgba(255,255,255,0.10)",border:"none",borderRadius:14,
                          width:34,height:34,color:T.t2,fontSize:15,cursor:"pointer",fontWeight:900,flexShrink:0}}>✕</button>
                    )}
                  </div>

                  {(busqLoading||busqResults!==null) ? (
                    /* ── Resultados de la búsqueda por ingrediente ── */
                    busqLoading ? (
                      <div style={{textAlign:"center",padding:40}}>
                        <div style={{fontSize:32,marginBottom:10}}>⏳</div>
                        <div style={{fontSize:13,color:T.t2,fontFamily:"'DM Sans',sans-serif"}}>{lang==='en'?'Searching the recipe book…':'Buscando en el recetario…'}</div>
                      </div>
                    ) : busqResults.length===0 ? (
                      <div style={{textAlign:"center",padding:40}}>
                        <div style={{fontSize:40,marginBottom:10}}>🥕</div>
                        <div style={{fontSize:13,color:T.t2,fontFamily:"'DM Sans',sans-serif",lineHeight:1.6}}>
                          {lang==='en'?`No recipes with "${busqTexto.trim()}"`:`No hay recetas con "${busqTexto.trim()}"`}
                        </div>
                      </div>
                    ) : (<>
                      <div style={{fontSize:12,color:T.t2,fontFamily:"'DM Sans',sans-serif",marginBottom:12}}>
                        🔍 <b style={{color:T.wh}}>{busqResults.length}</b> {lang==='en'?`recipes with "${busqTexto.trim()}" · by calories`:`recetas con "${busqTexto.trim()}" · por calorías`}
                      </div>
                      <div style={{display:"flex",flexDirection:"column",gap:10}}>
                        {busqResults.slice(0,60).map(rec=>(<SavedRecipeCard key={rec.id_receta} rec={rec} t={t} T={T} />))}
                      </div>
                      {busqResults.length>60&&(
                        <div style={{textAlign:"center",padding:"14px 0",fontSize:12,color:T.t3,fontFamily:"'DM Sans',sans-serif"}}>
                          {lang==='en'?`Showing 60 of ${busqResults.length} — refine your search`:`Mostrando 60 de ${busqResults.length} — afina la búsqueda`}
                        </div>
                      )}
                    </>)
                  ) : !completoCat ? (
                  /* ── Pantalla 1: categorías (nada cargado todavía) ── */
                  <>
                    <div style={{fontSize:11,color:T.au1,fontWeight:900,textTransform:"uppercase",letterSpacing:"0.1em",marginBottom:4}}>{lang==='en'?'Choose a category':'Elige una categoría'}</div>
                    <div style={{fontSize:12,color:T.t2,fontFamily:"'DM Sans',sans-serif",marginBottom:14}}>{recCounts?(<>📖 <b style={{color:T.wh}}>{recCounts.total}</b> {lang==='en'?'recipes in total · load when you open a category':'recetas en total · se cargan al abrir cada categoría'}</>):(lang==='en'?'Recipes load when you open a category':'Las recetas se cargan al abrir cada categoría')}</div>
                    <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:10}}>
                      {CATS_COMPLETO.map(cat=>(
                        <button key={cat.id} onClick={()=>abrirCategoriaCompleta(cat)} style={{
                          background:`${cat.color}1a`,border:`1.5px solid ${cat.color}55`,borderRadius:16,
                          padding:"18px 10px",cursor:"pointer",display:"flex",flexDirection:"column",alignItems:"center",gap:8,
                          boxShadow:`0 3px 0 ${cat.color}33`,fontFamily:"'Nunito',sans-serif"}}>
                          <div style={{fontSize:34}}>{cat.icon}</div>
                          <div style={{fontSize:13,fontWeight:900,color:T.wh,textAlign:"center",lineHeight:1.2}}>{lang==='en'?cat.en:cat.es}</div>
                          {recCounts&&<div style={{fontSize:10.5,fontWeight:700,color:cat.color,fontFamily:"'DM Sans',sans-serif"}}>{recCounts.byId[cat.id]??0} {lang==='en'?'recipes':'recetas'}</div>}
                        </button>
                      ))}
                    </div>
                  </>
                ) : (
                  /* ── Pantalla 2: recetas de la categoría, ordenadas por calorías ── */
                  <>
                    <div style={{display:"flex",alignItems:"center",gap:10,marginBottom:14}}>
                      <div style={{fontSize:30}}>{completoCat.icon}</div>
                      <div>
                        <div style={{fontSize:17,fontWeight:900,color:T.wh,fontFamily:"'Nunito',sans-serif"}}>{lang==='en'?completoCat.en:completoCat.es}</div>
                        {!completoLoading&&<div style={{fontSize:11,color:T.t3,fontFamily:"'DM Sans',sans-serif"}}>{completoRecipes.length} {lang==='en'?'recipes · by calories':'recetas · por calorías'}</div>}
                      </div>
                    </div>
                    {completoLoading ? (
                      <div style={{textAlign:"center",padding:40}}>
                        <div style={{fontSize:32,marginBottom:10}}>⏳</div>
                        <div style={{fontSize:13,color:T.t2,fontFamily:"'DM Sans',sans-serif"}}>{lang==='en'?'Loading recipes…':'Cargando recetas…'}</div>
                      </div>
                    ) : completoRecipes.length===0 ? (
                      <div style={{textAlign:"center",padding:40}}>
                        <div style={{fontSize:40,marginBottom:10}}>🍽️</div>
                        <div style={{fontSize:13,color:T.t2,fontFamily:"'DM Sans',sans-serif"}}>{lang==='en'?'No recipes in this category':'No hay recetas en esta categoría'}</div>
                      </div>
                    ) : (
                      <div style={{display:"flex",flexDirection:"column",gap:10}}>
                        {completoRecipes.map(rec=>(<SavedRecipeCard key={rec.id_receta} rec={rec} t={t} T={T} />))}
                      </div>
                    )}
                  </>
                )}
                </>)}
              </>)}

            </div>
          );
        })()}


        {tab==="progreso"&&<CalcTab weights={weights} profile={profile} setProfile={setProfile} lang={lang}/>}
        {avisoNuevoPlan&&(
          <div style={{position:"fixed",inset:0,background:"rgba(0,0,0,0.78)",zIndex:2500,display:"flex",alignItems:"center",justifyContent:"center",padding:"24px"}}>
            <div style={{width:"100%",maxWidth:360,background:"linear-gradient(180deg,#1d3a14,#142a0e)",
              border:`2.5px solid ${T.au1}`,borderRadius:24,padding:"26px 22px 20px",textAlign:"center",
              boxShadow:"0 12px 44px rgba(0,0,0,0.6)",animation:"popIn 0.25s ease"}}>
              <div style={{fontSize:52,marginBottom:10,animation:"tomaBob 1.8s ease-in-out infinite",display:"inline-block"}}>📬</div>
              <div style={{fontWeight:900,fontSize:19,color:T.au1,fontFamily:"'Nunito',sans-serif",marginBottom:8}}>
                {lang==='en'?'New plan available!':'¡Nueva programación!'}
              </div>
              <div style={{fontSize:13.5,color:T.t1,fontFamily:"'DM Sans',sans-serif",lineHeight:1.6,marginBottom:18}}>
                {lang==='en'
                  ?`Your nutritionist has published your plan${avisoNuevoPlan.semana!=null?` for week ${avisoNuevoPlan.semana}`:''}. Take a look!`
                  :`Tu nutricionista ha publicado tu plan${avisoNuevoPlan.semana!=null?` de la semana ${avisoNuevoPlan.semana}`:''}. ¡Échale un vistazo!`}
              </div>
              <button onClick={()=>{sfx("missionDone");setAvisoNuevoPlan(null);setTab("plan");}} style={{
                width:"100%",padding:"15px",borderRadius:16,border:"none",cursor:"pointer",
                background:`linear-gradient(135deg,${T.g1},${T.g2})`,color:"#fff",fontWeight:900,fontSize:15,
                fontFamily:"'Nunito',sans-serif",boxShadow:`0 5px 0 ${T.g3}`,marginBottom:10}}>
                🍽️ {lang==='en'?'See my plan':'Ver mi programación'}
              </button>
              <button onClick={()=>{sfx("tap");setAvisoNuevoPlan(null);}} style={{
                background:"none",border:"none",color:T.t3,fontWeight:800,fontSize:13,cursor:"pointer",
                fontFamily:"'Nunito',sans-serif",padding:"6px"}}>
                {lang==='en'?'Later':'Más tarde'}
              </button>
            </div>
          </div>
        )}
        {avisoRegistro&&!avisoNuevoPlan&&(
          <div style={{position:"fixed",inset:0,background:"rgba(0,0,0,0.78)",zIndex:2500,display:"flex",alignItems:"center",justifyContent:"center",padding:"24px"}}>
            <div style={{width:"100%",maxWidth:360,background:"linear-gradient(180deg,#1d3a14,#142a0e)",
              border:`2.5px solid ${T.au1}`,borderRadius:24,padding:"26px 22px 20px",textAlign:"center",
              boxShadow:"0 12px 44px rgba(0,0,0,0.6)",animation:"popIn 0.25s ease"}}>
              <div style={{fontSize:52,marginBottom:10,animation:"tomaBob 1.8s ease-in-out infinite",display:"inline-block"}}>🔥</div>
              <div style={{fontWeight:900,fontSize:19,color:T.au1,fontFamily:"'Nunito',sans-serif",marginBottom:8}}>
                {lang==='en'?"Don't lose your streak!":'¡No pierdas tu racha!'}
              </div>
              <div style={{fontSize:13.5,color:T.t1,fontFamily:"'DM Sans',sans-serif",lineHeight:1.6,marginBottom:6}}>
                {lang==='en'
                  ?'You still haven\u2019t logged your daily record. You have these meals pending:'
                  :'Todavía no has registrado tu racha diaria. Tienes pendientes estas comidas:'}
              </div>
              <div style={{fontSize:13.5,fontWeight:800,color:T.au1,fontFamily:"'Nunito',sans-serif",lineHeight:1.7,marginBottom:18}}>
                {avisoRegistro.pendientes.map(tm=>{
                  const en={Desayuno:'Breakfast',Almuerzo:'Mid-morning',Comida:'Lunch',Merienda:'Snack',Cena:'Dinner'};
                  return lang==='en'?(en[tm]||tm):tm;
                }).join(' · ')}
              </div>
              <button onClick={()=>{sfx("missionDone");setAvisoRegistro(null);setTab("plan");}} style={{
                width:"100%",padding:"15px",borderRadius:16,border:"none",cursor:"pointer",
                background:`linear-gradient(135deg,${T.g1},${T.g2})`,color:"#fff",fontWeight:900,fontSize:15,
                fontFamily:"'Nunito',sans-serif",boxShadow:`0 5px 0 ${T.g3}`,marginBottom:10}}>
                📆 {lang==='en'?'Go to daily plan':'Ir al plan diario'}
              </button>
              <button onClick={()=>{sfx("tap");setAvisoRegistro(null);}} style={{
                background:"none",border:"none",color:T.t3,fontWeight:800,fontSize:13,cursor:"pointer",
                fontFamily:"'Nunito',sans-serif",padding:"6px"}}>
                {lang==='en'?'Later':'Más tarde'}
              </button>
            </div>
          </div>
        )}
        {avisoSupl&&!avisoNuevoPlan&&!avisoRegistro&&(
          <div style={{position:"fixed",inset:0,background:"rgba(0,0,0,0.78)",zIndex:2500,display:"flex",alignItems:"center",justifyContent:"center",padding:"24px"}}>
            <div style={{width:"100%",maxWidth:360,background:"linear-gradient(180deg,#1d3a14,#142a0e)",
              border:`2.5px solid ${T.au1}`,borderRadius:24,padding:"26px 22px 20px",textAlign:"center",
              boxShadow:"0 12px 44px rgba(0,0,0,0.6)",animation:"popIn 0.25s ease"}}>
              <div style={{fontSize:52,marginBottom:10,animation:"tomaBob 1.8s ease-in-out infinite",display:"inline-block"}}>{SUPL_IC[avisoSupl.tipo]||'💊'}</div>
              <div style={{fontWeight:900,fontSize:19,color:T.au1,fontFamily:"'Nunito',sans-serif",marginBottom:8}}>
                {lang==='en'
                  ?(avisoSupl.tipo==='Medicación'?'Medication reminder':'Supplement reminder')
                  :(avisoSupl.tipo==='Medicación'?'Recordatorio de medicación':'Recordatorio de suplementación')}
              </div>
              <div style={{fontSize:13.5,color:T.t1,fontFamily:"'DM Sans',sans-serif",lineHeight:1.6,marginBottom:6}}>
                {lang==='en'
                  ?`It's past ${avisoSupl.hora} and you haven't logged:`
                  :`Ya son más de las ${avisoSupl.hora} y todavía no has completado:`}
              </div>
              <div style={{fontSize:15,fontWeight:900,color:T.au1,fontFamily:"'Nunito',sans-serif",lineHeight:1.5,marginBottom:18}}>
                {avisoSupl.nombre}{avisoSupl.dosis?` · ${avisoSupl.dosis}`:''}
              </div>
              <button onClick={()=>{marcarSuplHome(avisoSupl);setAvisoSupl(null);}} style={{
                width:"100%",padding:"15px",borderRadius:16,border:"none",cursor:"pointer",
                background:`linear-gradient(135deg,${T.g1},${T.g2})`,color:"#fff",fontWeight:900,fontSize:15,
                fontFamily:"'Nunito',sans-serif",boxShadow:`0 5px 0 ${T.g3}`,marginBottom:10}}>
                ✅ {lang==='en'?'Done! (+5 💎)':'¡Ya lo he tomado! (+5 💎)'}
              </button>
              <button onClick={()=>{sfx("tap");setAvisoSupl(null);}} style={{
                background:"none",border:"none",color:T.t3,fontWeight:800,fontSize:13,cursor:"pointer",
                fontFamily:"'Nunito',sans-serif",padding:"6px"}}>
                {lang==='en'?'Dismiss':'Descartar'}
              </button>
            </div>
          </div>
        )}
        {avisoTrial&&!avisoNuevoPlan&&!avisoRegistro&&!avisoSupl&&(
          <div style={{position:"fixed",inset:0,background:"rgba(0,0,0,0.78)",zIndex:2500,display:"flex",alignItems:"center",justifyContent:"center",padding:"24px"}}>
            <div style={{width:"100%",maxWidth:360,background:"linear-gradient(180deg,#1d3a14,#142a0e)",
              border:`2.5px solid ${T.au1}`,borderRadius:24,padding:"26px 22px 20px",textAlign:"center",
              boxShadow:"0 12px 44px rgba(0,0,0,0.6)",animation:"popIn 0.25s ease"}}>
              <div style={{fontSize:52,marginBottom:10,animation:"tomaBob 1.8s ease-in-out infinite",display:"inline-block"}}>⏳</div>
              <div style={{fontWeight:900,fontSize:19,color:T.au1,fontFamily:"'Nunito',sans-serif",marginBottom:8}}>
                {lang==='en'
                  ? (avisoTrial.dias===1?'Last day of your free week!':`Your free week ends in ${avisoTrial.dias} days`)
                  : (avisoTrial.dias===1?'¡Último día de tu semana gratis!':`Tu semana gratis termina en ${avisoTrial.dias} días`)}
              </div>
              <div style={{fontSize:13.5,color:T.t1,fontFamily:"'DM Sans',sans-serif",lineHeight:1.6,marginBottom:10}}>
                {lang==='en'
                  ?'Afterwards you\u2019ll move to the free plan and lose access to your weekly meal plan, recipes and shopping list.'
                  :'Después pasarás al plan gratuito y perderás el acceso a tu programación semanal, las recetas y la lista de la compra.'}
              </div>
              {(streak>0||((profile?.gems||0)>0))&&(
                <div style={{fontSize:13,fontWeight:800,color:T.au1,fontFamily:"'Nunito',sans-serif",lineHeight:1.6,marginBottom:18}}>
                  {lang==='en'
                    ?<>Your {streak>0?`${streak}-day streak 🔥`:''}{streak>0&&(profile?.gems||0)>0?' and ':''}{(profile?.gems||0)>0?`${profile.gems} gems 💎`:''} will be waiting for you.</>
                    :<>{streak>0?`Tu racha de ${streak} días 🔥`:''}{streak>0&&(profile?.gems||0)>0?' y ':''}{(profile?.gems||0)>0?`tus ${profile.gems} gemas 💎`:''} te esperan al otro lado.</>}
                </div>
              )}
              <button onClick={()=>{sfx("tap");setAvisoTrial(null);abrirCheckoutStripe(profile?.id);}} style={{
                width:"100%",padding:"15px",borderRadius:16,border:"none",cursor:"pointer",
                background:`linear-gradient(135deg,${T.g1},${T.g2})`,color:"#fff",fontWeight:900,fontSize:15,
                fontFamily:"'Nunito',sans-serif",boxShadow:`0 5px 0 ${T.g3}`,marginBottom:10}}>
                ⭐ {lang==='en'?'Subscribe · €7/month':'Suscribirme · 7 €/mes'}
              </button>
              <button onClick={()=>{sfx("tap");setAvisoTrial(null);}} style={{
                background:"none",border:"none",color:T.t3,fontWeight:800,fontSize:13,cursor:"pointer",
                fontFamily:"'Nunito',sans-serif",padding:"6px"}}>
                {lang==='en'?'Later':'Más tarde'}
              </button>
            </div>
          </div>
        )}
        {hitoCard&&(
          <div style={{position:"fixed",inset:0,background:"rgba(0,0,0,0.82)",zIndex:2500,display:"flex",flexDirection:"column",alignItems:"center",justifyContent:"center",padding:"24px 20px"}}>
            <div style={{width:"100%",maxWidth:340,textAlign:"center",animation:"popIn 0.25s ease"}}>
              <div style={{fontWeight:900,fontSize:21,color:T.au1,fontFamily:"'Nunito',sans-serif",marginBottom:hitoCard.gemas?4:12}}>
                🏆 {hitoCard.titulo}
              </div>
              {hitoCard.gemas&&(
                <div style={{fontWeight:900,fontSize:14,color:T.t1,fontFamily:"'Nunito',sans-serif",marginBottom:12}}>
                  🎁 {lang==='en'?'Chest':'Cofre'}: +{hitoCard.gemas} 💎
                </div>
              )}
              <img src={hitoCard.dataUrl} alt="" style={{width:"62%",borderRadius:18,
                border:`2px solid ${T.au1}`,boxShadow:"0 12px 40px rgba(0,0,0,0.6)",marginBottom:16}}/>
              <button onClick={compartirHito} style={{
                width:"100%",padding:"15px",borderRadius:16,border:"none",cursor:"pointer",
                background:`linear-gradient(135deg,${T.g1},${T.g2})`,color:"#fff",fontWeight:900,fontSize:15,
                fontFamily:"'Nunito',sans-serif",boxShadow:`0 5px 0 ${T.g3}`,marginBottom:10}}>
                📤 {lang==='en'?'Share my milestone':'Compartir mi hito'}
              </button>
              {(profile?.plan==='free'||trialDiasRest)&&(
                <button onClick={()=>{sfx("tap");setHitoCard(null);abrirCheckoutStripe(profile?.id);}} style={{
                  width:"100%",padding:"13px",borderRadius:16,cursor:"pointer",
                  background:"rgba(255,200,0,0.10)",border:`1.5px solid ${T.au1}`,color:T.au1,
                  fontWeight:900,fontSize:14,fontFamily:"'Nunito',sans-serif",marginBottom:10}}>
                  ⭐ {lang==='en'
                    ?(trialDiasRest?'Keep my plan · €7/month':'Get my plan back · €7/month')
                    :(trialDiasRest?'Conservar mi plan · 7 €/mes':'Volver a mi plan · 7 €/mes')}
                </button>
              )}
              <button onClick={()=>{sfx("tap");setHitoCard(null);}} style={{
                background:"none",border:"none",color:T.t3,fontWeight:800,fontSize:13,cursor:"pointer",
                fontFamily:"'Nunito',sans-serif",padding:"6px"}}>
                {lang==='en'?'Not now':'Ahora no'}
              </button>
            </div>
          </div>
        )}
        {avisoVictoria&&!hitoCard&&!avisoNuevoPlan&&!avisoRegistro&&!avisoSupl&&!avisoTrial&&(
          <div style={{position:"fixed",inset:0,background:"rgba(0,0,0,0.78)",zIndex:2500,display:"flex",alignItems:"center",justifyContent:"center",padding:"24px"}}>
            <div style={{width:"100%",maxWidth:360,background:"linear-gradient(180deg,#1d3a14,#142a0e)",
              border:`2.5px solid ${T.au1}`,borderRadius:24,padding:"26px 22px 20px",textAlign:"center",
              boxShadow:"0 12px 44px rgba(0,0,0,0.6)",animation:"popIn 0.25s ease"}}>
              <div style={{fontSize:52,marginBottom:10,animation:"tomaBob 1.8s ease-in-out infinite",display:"inline-block"}}>🌟</div>
              <div style={{fontWeight:900,fontSize:19,color:T.au1,fontFamily:"'Nunito',sans-serif",marginBottom:8}}>
                {lang==='en'?'A perfect day!':'¡Día perfecto!'}
              </div>
              <div style={{fontSize:13.5,color:T.t1,fontFamily:"'DM Sans',sans-serif",lineHeight:1.6,marginBottom:18}}>
                {lang==='en'
                  ?'All 4 missions completed. This is what following a plan made just for you feels like — don\u2019t let it end with your trial.'
                  :'Las 4 misiones del día completadas. Así se siente seguir un plan hecho solo para ti — que no se acabe con la semana de prueba.'}
              </div>
              <button onClick={()=>{sfx("tap");setAvisoVictoria(false);abrirCheckoutStripe(profile?.id);}} style={{
                width:"100%",padding:"15px",borderRadius:16,border:"none",cursor:"pointer",
                background:`linear-gradient(135deg,${T.g1},${T.g2})`,color:"#fff",fontWeight:900,fontSize:15,
                fontFamily:"'Nunito',sans-serif",boxShadow:`0 5px 0 ${T.g3}`,marginBottom:10}}>
                ⭐ {lang==='en'?'Keep my plan · €7/month':'Conservar mi plan · 7 €/mes'}
              </button>
              <button onClick={()=>{sfx("tap");setAvisoVictoria(false);}} style={{
                background:"none",border:"none",color:T.t3,fontWeight:800,fontSize:13,cursor:"pointer",
                fontFamily:"'Nunito',sans-serif",padding:"6px"}}>
                {lang==='en'?'Continue my day':'Seguir con mi día'}
              </button>
            </div>
          </div>
        )}
        {avisoRacha&&!avisoNuevoPlan&&!avisoRegistro&&!avisoSupl&&!avisoTrial&&!hitoCard&&!avisoVictoria&&(
          <div style={{position:"fixed",inset:0,background:"rgba(0,0,0,0.78)",zIndex:2500,display:"flex",alignItems:"center",justifyContent:"center",padding:"24px"}}>
            <div style={{width:"100%",maxWidth:360,background:"linear-gradient(180deg,#1d3a14,#142a0e)",
              border:`2.5px solid ${T.au1}`,borderRadius:24,padding:"26px 22px 20px",textAlign:"center",
              boxShadow:"0 12px 44px rgba(0,0,0,0.6)",animation:"popIn 0.25s ease"}}>
              <div style={{fontSize:52,marginBottom:10,animation:"tomaBob 1.8s ease-in-out infinite",display:"inline-block"}}>💔</div>
              <div style={{fontWeight:900,fontSize:19,color:T.au1,fontFamily:"'Nunito',sans-serif",marginBottom:8}}>
                {lang==='en'?`Your ${avisoRacha.perdida}-day streak is in danger!`:`¡Tu racha de ${avisoRacha.perdida} días peligra!`}
              </div>
              <div style={{fontSize:13.5,color:T.t1,fontFamily:"'DM Sans',sans-serif",lineHeight:1.6,marginBottom:18}}>
                {lang==='en'
                  ?'Yesterday went unlogged. You can repair it now and keep your streak alive — this offer only lasts today.'
                  :'Ayer se quedó sin registrar. Puedes repararla ahora y mantener tu racha viva — esta oferta solo dura hoy.'}
              </div>
              <button onClick={repararRacha} style={{
                width:"100%",padding:"15px",borderRadius:16,border:"none",cursor:"pointer",
                background:(profile?.gems||0)>=RACHA_COSTE_REPARAR?`linear-gradient(135deg,${T.g1},${T.g2})`:"rgba(255,255,255,0.10)",
                color:"#fff",fontWeight:900,fontSize:15,opacity:(profile?.gems||0)>=RACHA_COSTE_REPARAR?1:0.6,
                fontFamily:"'Nunito',sans-serif",boxShadow:(profile?.gems||0)>=RACHA_COSTE_REPARAR?`0 5px 0 ${T.g3}`:"none",marginBottom:10}}>
                🔧 {lang==='en'?`Repair my streak · ${RACHA_COSTE_REPARAR} 💎`:`Reparar mi racha · ${RACHA_COSTE_REPARAR} 💎`}
              </button>
              <button onClick={()=>{sfx("tap");setAvisoRacha(null);}} style={{
                background:"none",border:"none",color:T.t3,fontWeight:800,fontSize:13,cursor:"pointer",
                fontFamily:"'Nunito',sans-serif",padding:"6px"}}>
                {lang==='en'?'Let it go':'Dejarla ir'}
              </button>
            </div>
          </div>
        )}
        {tab==="plan"&&<PlanTab profile={profile} lang={lang} setProfile={setProfile} savedRecipes={savedRecipes} setSavedRecipes={setSavedRecipes} showT={showT} sfx={sfx} t={t} setTab={setTab} onMealRegistered={onMealRegistered}/>}
        {tab==="consulta"&&<ConsultaTab profile={profile} lang={lang} sfx={sfx}/>}
      </div>

      {/* ── BOTTOM NAV ────────────────────────────────────────────────────── */}
      <div className="nav-scroll" style={{position:"fixed",bottom:0,left:"50%",transform:"translateX(-50%)",width:"100%",maxWidth:420,background:"rgba(8,18,8,0.97)",backdropFilter:"blur(30px)",borderTop:`3px solid ${T.bW}`,zIndex:100,overflowX:"auto",WebkitOverflowScrolling:"touch"}}>
        <div style={{display:"flex",padding:"10px 4px 10px",minWidth:"min-content",width:"100%"}}>
          {[{id:"home",icon:"🏠",l:t("tabHome")},{id:"progreso",icon:"🚀",l:t("tabCalc")},{id:"plan",icon:"📆",l:"Plan"},{id:"weight",icon:"⚖️",l:t("tabWeight")},{id:"receta",icon:"🍰",l:t("tabRecipe")},{id:"consulta",icon:"📩",l:lang==="en"?"Consult":"Consulta"},{id:"ranking",icon:"👑",l:t("tabRanking")}].map(({id,icon,l})=>(
            <button key={id} onClick={()=>{ sfx("tap"); setTab(id); }} style={{...tabSt(tab===id),flex:"1 0 60px",minWidth:60,padding:"8px 6px"}}>
              <span style={{fontSize:24,filter:tab===id?"none":"grayscale(0.6)",transition:"all 0.2s"}}>{icon}</span>
              <span style={{fontSize:9,whiteSpace:"nowrap"}}>{l}</span>
              {tab===id&&<div style={{width:22,height:4,background:T.au1,borderRadius:4,boxShadow:`0 0 10px ${T.au1}`,marginTop:1}}/>}
            </button>
          ))}
        </div>
      </div>
    </div>
    </LangCtx.Provider>
  );
}

// ─── Tarjeta "Invita a un amigo" (referidos) ─────────────────────────────────
// Reutilizable: se muestra en Consultas para estándar/free (junto a "pasar a
// Premium") y para premium (junto a WhatsApp y Programar consulta). Incluye el
// código personalizado, botón de compartir nativo e instrucciones. El feedback
// de copiado es local (la pestaña no recibe showT).
function TarjetaInvitarAmigo({profile,lang,sfx}){
  const [copiado,setCopiado]=React.useState(false);
  if(!profile?.referral_code) return null;
  const compartir=async()=>{
    sfx&&sfx("tap");
    const msg = lang==='en'
      ? `I'm following my nutrition plan with GBH Nutrición 🌱 Sign up with my code ${profile.referral_code} and you get 25 💎 to start: https://gbh-app.vercel.app`
      : `Estoy siguiendo mi plan de nutrición con GBH Nutrición 🌱 Regístrate con mi código ${profile.referral_code} y te llevas 25 💎 para empezar: https://gbh-app.vercel.app`;
    try{ if(navigator.share){ await navigator.share({text:msg}); return; } }
    catch(e){ if(e?.name==="AbortError") return; }
    try{
      await navigator.clipboard.writeText(msg);
      setCopiado(true); setTimeout(()=>setCopiado(false),2200);
    }catch{}
  };
  return(
    <div style={{width:'100%',boxSizing:'border-box',background:'rgba(255,200,0,0.07)',
      border:'2px solid rgba(255,200,0,0.4)',borderRadius:20,padding:'20px',
      boxShadow:'0 4px 0 rgba(0,0,0,0.3)',textAlign:'left'}}>
      <div style={{display:'flex',alignItems:'center',gap:14,marginBottom:14}}>
        <div style={{fontSize:36,flexShrink:0}}>🎁</div>
        <div style={{flex:1,minWidth:0}}>
          <div style={{fontWeight:900,fontSize:16,color:T.t1,marginBottom:2,fontFamily:"'Nunito',sans-serif"}}>
            {lang==='en'?'Invite a friend':'Invita a un amigo'}
          </div>
          <div style={{fontSize:12,color:T.au1,fontWeight:800,fontFamily:"'DM Sans',sans-serif"}}>
            {lang==='en'?'Earn 50 💎 per friend':'Gana 50 💎 por cada amigo'}
          </div>
        </div>
      </div>
      <div style={{background:'rgba(255,200,0,0.10)',border:`1.5px dashed ${T.au1}`,
        borderRadius:12,padding:'11px 14px',textAlign:'center',fontWeight:900,fontSize:17,
        color:T.au1,letterSpacing:'0.14em',fontFamily:"'Nunito',sans-serif",marginBottom:10}}>
        {profile.referral_code}
      </div>
      <button onClick={compartir} style={{width:'100%',padding:'13px',borderRadius:14,border:'none',
        cursor:'pointer',background:copiado?'rgba(255,255,255,0.12)':`linear-gradient(135deg,${T.g1},${T.g2})`,
        color:'#fff',fontWeight:900,fontSize:14,fontFamily:"'Nunito',sans-serif",
        boxShadow:copiado?'none':`0 3px 0 ${T.g3}`,marginBottom:12}}>
        {copiado?(lang==='en'?'✅ Copied!':'✅ ¡Copiado!'):`📤 ${lang==='en'?'Share my code':'Compartir mi código'}`}
      </button>
      <div style={{fontSize:11,color:T.t2,fontFamily:"'DM Sans',sans-serif",lineHeight:1.6}}>
        {lang==='en'
          ?'How it works: your friend signs up with your code and gets 25 💎 to start. When they log their first day of meals, you earn 50 💎.'
          :'Cómo funciona: tu amigo se registra con tu código y recibe 25 💎 de bienvenida. Cuando complete su primer día de registro de comidas, tú ganas 50 💎.'}
      </div>
    </div>
  );
}

// ─── ConsultaTab — contacto con el nutricionista (exclusivo premium) ────────
function ConsultaTab({profile,lang,sfx}){
  const isPremium=profile?.plan==='premium';
  // Mensaje pre-rellenado para que un usuario free/estándar SOLICITE pasar a
  // Premium directamente por WhatsApp (mismo patrón que el CTA del plan).
  const waMsgPremium = encodeURIComponent(lang==='en'
    ? `Hi! I'm ${profile?.name||''} and I'd like to upgrade to the GBH Premium plan for personalized follow-up and direct consultation 👑`
    : `¡Hola! Soy ${profile?.name||''} y me gustaría pasar al plan Premium de GBH para tener seguimiento personalizado y consulta directa con el nutricionista 👑`);

  if(!isPremium) return(
    <div style={{padding:'48px 24px',textAlign:'center',display:'flex',flexDirection:'column',alignItems:'center',gap:18}}>
      <div style={{fontSize:56}}>📩</div>
      <div style={{fontSize:18,fontWeight:900,color:T.t1,lineHeight:1.3,fontFamily:"'Nunito',sans-serif"}}>
        {lang==='en'?'Premium service':'Servicio premium'}
      </div>
      <div style={{fontSize:14,color:T.t2,lineHeight:1.7,maxWidth:300,fontFamily:"'DM Sans',sans-serif"}}>
        {lang==='en'
          ? 'Direct consultation with your nutritionist is exclusive to Premium members. Upgrade your plan to chat directly and book appointments.'
          : 'La consulta directa con tu nutricionista es exclusiva para clientes Premium. Eleva tu suscripción para escribir directamente y agendar citas.'}
      </div>
      <div style={{marginTop:8,background:'linear-gradient(135deg,rgba(255,200,0,0.12),rgba(255,160,0,0.08))',border:'1.5px solid '+T.au1,borderRadius:18,padding:'18px 22px',maxWidth:300}}>
        <div style={{fontSize:30,marginBottom:6}}>👑</div>
        <div style={{fontSize:14,fontWeight:900,color:T.au1,fontFamily:"'Nunito',sans-serif",marginBottom:4}}>
          {lang==='en'?'Go Premium':'Hazte Premium'}
        </div>
        <div style={{fontSize:12,color:T.t2,fontFamily:"'DM Sans',sans-serif",lineHeight:1.5}}>
          {lang==='en'?'Personalized follow-up and direct support':'Seguimiento personalizado y soporte directo'}
        </div>
      </div>
      {/* CTA: solicitar pasar a Premium por WhatsApp (mismo estilo que el del plan) */}
      <a href={`https://wa.me/${GBH_WHATSAPP}?text=${waMsgPremium}`} target="_blank" rel="noopener noreferrer"
        onClick={()=>sfx&&sfx("tap")}
        style={{marginTop:2,width:'100%',maxWidth:300,background:'linear-gradient(135deg,#25D366,#1DA851)',
          color:'#fff',fontWeight:900,fontSize:15,borderRadius:18,padding:'16px 20px',
          textDecoration:'none',boxShadow:'0 4px 0 #128C4B',fontFamily:"'Nunito',sans-serif",
          display:'flex',alignItems:'center',justifyContent:'center',gap:10}}>
        <span style={{fontSize:20}}>💬</span>
        {lang==='en'?'Request Premium upgrade':'Solicitar pasar a Premium'}
      </a>
      <div style={{fontSize:10.5,color:T.t3,fontFamily:"'DM Sans',sans-serif"}}>
        {lang==='en'?'We reply the same day · @gbhnutricion':'Te respondemos en el día · @gbhnutricion'}
      </div>
      <div style={{width:'100%',maxWidth:300,marginTop:6}}>
        <TarjetaInvitarAmigo profile={profile} lang={lang} sfx={sfx}/>
      </div>
    </div>
  );

  const abrirWhatsApp=()=>{
    sfx&&sfx("tap");
    const msg=encodeURIComponent(lang==='en'?'Hi! I have a question about my plan:':'¡Hola! Tengo una consulta sobre mi plan:');
    window.open(`https://wa.me/${GBH_WHATSAPP}?text=${msg}`,'_blank','noopener');
  };
  const abrirCalendly=()=>{
    sfx&&sfx("tap");
    window.open(GBH_CALENDLY,'_blank','noopener');
  };

  return(
    <div style={{paddingBottom:24}}>
      <div style={{padding:'22px 16px 10px',textAlign:'center'}}>
        <div style={{fontSize:40,marginBottom:8}}>📩</div>
        <div style={{fontSize:19,fontWeight:900,color:T.t1,fontFamily:"'Nunito',sans-serif"}}>
          {lang==='en'?'Consultation':'Consulta'}
        </div>
        <div style={{fontSize:13,color:T.t2,fontFamily:"'DM Sans',sans-serif",marginTop:4,lineHeight:1.5,maxWidth:300,margin:'4px auto 0'}}>
          {lang==='en'?'Get in touch with your nutritionist whenever you need':'Ponte en contacto con tu nutricionista cuando lo necesites'}
        </div>
      </div>

      <div style={{padding:'12px 16px',display:'flex',flexDirection:'column',gap:14}}>
        {/* WhatsApp */}
        <button onClick={abrirWhatsApp}
          style={{background:'rgba(37,211,102,0.12)',border:'2px solid rgba(37,211,102,0.4)',borderRadius:20,
                  padding:'22px 20px',cursor:'pointer',display:'flex',alignItems:'center',gap:16,
                  boxShadow:'0 4px 0 rgba(0,0,0,0.3)',textAlign:'left'}}>
          <div style={{fontSize:40,flexShrink:0}}>💬</div>
          <div style={{flex:1}}>
            <div style={{fontWeight:900,fontSize:16,color:T.t1,marginBottom:4,fontFamily:"'Nunito',sans-serif"}}>
              {lang==='en'?'Direct message':'Mensaje directo'}
            </div>
            <div style={{fontSize:12,color:T.t2,fontFamily:"'DM Sans',sans-serif",lineHeight:1.5}}>
              {lang==='en'?'Chat with me on WhatsApp':'Escríbeme directamente por WhatsApp'}
            </div>
          </div>
          <div style={{color:'#25D366',fontSize:22,flexShrink:0}}>›</div>
        </button>

        {/* Calendly */}
        <button onClick={abrirCalendly}
          style={{background:'rgba(100,181,246,0.12)',border:'2px solid rgba(100,181,246,0.4)',borderRadius:20,
                  padding:'22px 20px',cursor:'pointer',display:'flex',alignItems:'center',gap:16,
                  boxShadow:'0 4px 0 rgba(0,0,0,0.3)',textAlign:'left'}}>
          <div style={{fontSize:40,flexShrink:0}}>📅</div>
          <div style={{flex:1}}>
            <div style={{fontWeight:900,fontSize:16,color:T.t1,marginBottom:4,fontFamily:"'Nunito',sans-serif"}}>
              {lang==='en'?'Book a consultation':'Programar consulta'}
            </div>
            <div style={{fontSize:12,color:T.t2,fontFamily:"'DM Sans',sans-serif",lineHeight:1.5}}>
              {lang==='en'?'Schedule a weekend appointment':'Agenda una cita para el fin de semana'}
            </div>
          </div>
          <div style={{color:'#64B5F6',fontSize:22,flexShrink:0}}>›</div>
        </button>

        {/* Invita a un amigo (referidos) */}
        <TarjetaInvitarAmigo profile={profile} lang={lang} sfx={sfx}/>
      </div>
    </div>
  );
}

// ─── PlanTab — programación semanal del paciente ────────────────────────────
const PLAN_DIAS    = ['Lun','Mar','Mié','Jue','Vie','Sáb','Dom'];
const PLAN_DIAS_F  = ['Lunes','Martes','Miércoles','Jueves','Viernes','Sábado','Domingo'];
const PLAN_TOMAS   = ['Desayuno','Almuerzo','Comida','Merienda','Cena'];
const PLAN_TOMA_IC = {Desayuno:'☀️',Almuerzo:'🍎',Comida:'🍽️',Merienda:'🥤',Cena:'🌙'};

// ── Medicación y suplementación (plan_json.suplementacion) ──────────────────
// El bloque viene del Excel de pautas vía la automatización. El parser es
// tolerante con la clave y la capitalización de los campos para no depender
// de la versión exacta del generador. hora en formato 'HH:MM'.
const SUPL_HORAS_TOMA = {Desayuno:'08:00',Almuerzo:'11:00',Comida:'14:00',Merienda:'17:30',Cena:'21:00'};
const SUPL_IC = {'Medicación':'💊','Medicacion':'💊','Suplemento':'💪'};
const normSupl = (pj)=>{
  const raw = pj?.suplementacion ?? pj?.Suplementacion ?? pj?.medicacion ?? pj?.suplementos ?? null;
  if(!Array.isArray(raw)) return null;
  const out = raw.map(it=>({
    nombre:(it.nombre??it.Nombre??it.name??'').toString().trim(),
    tipo:  (it.tipo??it.Tipo??'Suplemento').toString().trim(),
    hora:  (it.hora??it.Hora??'').toString().trim().slice(0,5),
    dosis: (it.dosis??it.Dosis??it['dosis_pauta']??'').toString().trim(),
    notas: (it.notas??it.Notas??'').toString().trim(),
  })).filter(it=>it.nombre && /^\d{2}:\d{2}$/.test(it.hora));
  return out.length?out:null;
};
// Toma tras la que se coloca el botón según la hora ('' = antes del desayuno)
const suplTrasToma = (hora)=>{
  let tras='';
  for(const tm of PLAN_TOMAS){ if((SUPL_HORAS_TOMA[tm]||'99:99') <= hora) tras=tm; }
  return tras;
};
const suplHechosKey = (id,date)=>`gbh:suplhecho:${id}:${date}`;   // {nombre:true}
// Hora local del móvil a la que "empieza" la franja de cada toma. Guía a la
// oveja 🐑 de los mini-botones de Inicio: señala hasta qué comida debería haber
// registrado ya el paciente. Editable si cambian los horarios habituales.
const PLAN_TOMA_HORA = {Desayuno:0, Almuerzo:10.5, Comida:13, Merienda:16.5, Cena:20};
// ── Agregación de la lista de la compra semanal ──────────────────────────────
// Endurecida para el recetario vegano importado: fracciones unicode/ASCII
// ("52 ½", "1/4"), unidades escritas ("gramos de"), descriptores tras coma que
// NO son ingrediente nuevo ("coliflor, cruda (132,5 gr.)"), cantidad entre
// paréntesis prioritaria ("½ taza (45 g) avena") y DESPENSA: las medidas de uso
// (cucharadas de aceite, pizca de sal…) se convierten en la compra realista
// ("1 botella de aceite"), porque nadie compra cucharadas soperas.
const _FR={"½":0.5,"¼":0.25,"¾":0.75,"⅓":1/3,"⅔":2/3,"⅛":0.125};
function _normFrac(t){
  t=t.replace(/(\d+)\s*([½¼¾⅓⅔⅛])/g,(m,a,f)=>String(parseFloat(a)+_FR[f]));
  for(const f in _FR) t=t.split(f).join(String(_FR[f]));
  t=t.replace(/(\d+)\s+(\d+)\/(\d+)/g,(m,a,b,c)=>String(+a + (+b)/(+c)));
  t=t.replace(/(^|[^\d/.,])(\d+)\/(\d+)(?!\d)/g,(m,p,a,b)=>p+String((+a)/(+b)));
  return t;
}
// Fragmentos que continúan el ingrediente anterior (mismo criterio que el script)
const _DESC_SEG=/^(crud[oa]s?|cocid[oa]s?|en\s+polvo|virgen(\s+extra)?|extra\b|negr[oa]s?|blanc[oa]s?|fresc[oa]s?|natural(es)?|light|(semi)?desnatad[oa]s?|enter[oa]s?|integral(es)?|picad[oa]s?|rallad[oa]s?|tostad[oa]s?|molid[oa]s?|pelad[oa]s?|trocead[oa]s?|sin\s+sal|sin\s+az[uú]car(es)?|sin\s+gluten|sin\s+lactosa|sin\s+c[aá]scara|sec[oa]s?|madur[oa]s?|grandes?|peque[nñ][oa]s?|al\s+gusto|heura|en\s+conserva|enlatad[oa]s?|en\s+lata|al\s+natural|escurrid[oa]s?|hervid[oa]s?|cocinad[oa]s?|asad[oa]s?|frit[oa]s?|congelad[oa]s?|descongelad[oa]s?|remojad[oa]s?|desalad[oa]s?|deshuesad[oa]s?|rellen[oa]s?\b|bulbo\b|zumo(\s+fresc[oa])?\b|laminad[oa]s?|desmenuzad[oa]s?|triturad[oa]s?|machacad[oa]s?|batid[oa]s?|exprimid[oa]s?|ahumad[oa]s?|salad[oa]s?|cortad[oa]s?(\s+en\s+\w+)?|en\s+dados|en\s+rodajas|en\s+tiras|en\s+juliana|en\s+copos?|en\s+alm[ií]bar|en\s+su\s+jugo|en\s+aceite|en\s+trozos|sin\s+piel|sin\s+hueso|sin\s+espinas?|para\s+(el\s+desayuno|decorar|servir|acompa[nñ]ar|untar|el\s+caf[eé]))\b/i;
// Despensa: [detector, nombre canónico, compra realista]
const _DESPENSA=[
  [/aceite/i,               "Aceite de oliva",        "1 botella"],
  [/vinagre/i,              "Vinagre",                "1 botella"],
  [/salsa de soja/i,        "Salsa de soja",          "1 botella"],
  [/^sal\b|\bsal (marina|de mar|fina|gruesa)\b/i, "Sal", "1 paquete"],
  [/pimienta|especias?|or[eé]gano|piment[oó]n|canela|comino|cayena|curry|c[uú]rcuma|hierbas|laurel|tomillo|romero|nuez moscada|jengibre en polvo|ajo en polvo|cebolla en polvo|vainilla/i, "Especias", "1 bote"],
  [/edulcorante|estevia|stevia/i, "Edulcorante",      "1 paquete"],
  [/levadura|bicarbonato/i, "Levadura / bicarbonato", "1 sobre"],
  [/\bmiel\b/i,             "Miel",                   "1 bote"],
  [/pesto/i,                "Pesto",                  "1 bote"],
  [/mostaza/i,              "Mostaza",                "1 bote"],
];
const _UNIDADES=[
  [/^(kg|kilos?)\b\.?/i,"kg","peso"],[/^(gramos?|gr|g)\b\.?/i,"g","peso"],
  [/^(mililitros?|ml)\b\.?/i,"ml","peso"],[/^(cl)\b\.?/i,"cl","peso"],[/^(litros?|l)\b\.?/i,"l","peso"],
  [/^cucharadas?(\s+soperas?|\s+(de\s+)?postre|\s+(de\s+)?caf[eé])?(\s+rasas?|\s+colmadas?)?\b/i,"cda","med"],[/^(cucharaditas?|cdtas?)(\s+rasas?|\s+colmadas?)?\b\.?/i,"cdta","med"],[/^cdas?\b\.?/i,"cda","med"],
  [/^tarrinas?\b/i,"tarrina","cont"],[/^botes?\b/i,"bote","cont"],[/^latas?\b/i,"lata","cont"],
  [/^paquetes?\b/i,"paquete","cont"],[/^sobres?\b/i,"sobre","cont"],[/^botellas?\b/i,"botella","cont"],
  [/^bolsas?\b/i,"bolsa","cont"],[/^vasos?\b/i,"vaso","cont"],[/^tazas?\b/i,"taza","cont"],[/^briks?\b/i,"brik","cont"],
  [/^tabletas?(\s+individual(es)?)?\b/i,"tableta","cont"],
  [/^racion(?:es)?(\s+individual(es)?)?\b/i,"","ud"],[/^raci[oó]n(?:es)?(\s+individual(es)?)?\b/i,"","ud"],
  [/^porci[oó]n(?:es)?(\s+individual(es)?)?\b/i,"","ud"],
  [/^(unidad(?:es)?|uds?)\b\.?/i,"","ud"],
  [/^(lonchas?|rodajas?|dientes?|hojas?|manojos?|piezas?|filetes?|rebanadas?|pu[nñ]ados?|onzas?|ramas?|gajos?|manos?\s+cerradas?(\s+sin\s+c[aá]scara)?)\b/i,"","sub"],
];

// ─── Diccionario canónico + formatos de compra (GENERADO desde gbh_automatizacion.py) ───
// NO editar a mano: regenerar con el exportador si cambian los canónicos del script.
const _CANON=[[["leche"],"Leche","🥛","Huevos y lácteos","liquido_l",null,null],[["yogur","yogures"],"Yogur","🥛","Huevos y lácteos","pack_yogur",null,null],[["huevo","huevos","clara","claras","yema","yemas"],"Huevos","🥚","Huevos y lácteos","docena",null,null],[["queso","mozzarella","burata","parmesano","feta","requeson"],"Queso","🧀","Huevos y lácteos","peso_queso",null,null],[["mantequilla"],"Mantequilla","🧈","Huevos y lácteos","tarrina",null,null],[["nata","crema de leche"],"Nata","🥛","Huevos y lácteos","brick_nata",null,null],[["pollo","pechuga"],"Pollo","🍗","Carnicería","peso_carne",null,null],[["pavo"],"Pavo","🦃","Carnicería","peso_carne",null,null],[["ternera","vacuno"],"Ternera","🥩","Carnicería","peso_carne",null,null],[["cerdo","lomo de cerdo"],"Cerdo","🥩","Carnicería","peso_carne",null,null],[["cordero"],"Cordero","🥩","Carnicería","peso_carne",null,null],[["jamon"],"Jamón","🥓","Carnicería","lonchas",null,null],[["bacon","panceta","guanciale"],"Bacon","🥓","Carnicería","lonchas",null,null],[["salchicha"],"Salchichas","🌭","Carnicería","paquete_ud",null,6],[["morcilla"],"Morcilla","🥩","Carnicería","pieza_emb",null,null],[["chorizo"],"Chorizo","🥩","Carnicería","pieza_emb",null,null],[["carne picada","carne molida"],"Carne picada","🥩","Carnicería","peso_carne",null,null],[["salmon"],"Salmón","🐟","Pescadería","peso_pescado",null,null],[["merluza"],"Merluza","🐟","Pescadería","peso_pescado",null,null],[["bacalao"],"Bacalao","🐟","Pescadería","peso_pescado",null,null],[["atun"],"Atún","🐟","Pescadería","peso_pescado",null,null],[["sardina"],"Sardinas","🐟","Pescadería","peso_pescado",null,null],[["anchoa","boqueron"],"Anchoas","🐟","Pescadería","lata",null,null],[["lubina"],"Lubina","🐟","Pescadería","peso_pescado",null,null],[["dorada"],"Dorada","🐟","Pescadería","peso_pescado",null,null],[["mero"],"Mero","🐟","Pescadería","peso_pescado",null,null],[["trucha"],"Trucha","🐟","Pescadería","peso_pescado",null,null],[["gamba","langostino"],"Gambas","🦐","Pescadería","peso_pescado",null,null],[["almeja"],"Almejas","🦪","Pescadería","peso_pescado",null,null],[["mejillon"],"Mejillones","🦪","Pescadería","malla_marisco",null,null],[["calamar","sepia","chipiron"],"Calamar","🦑","Pescadería","peso_pescado",null,null],[["pulpo"],"Pulpo","🐙","Pescadería","peso_pescado",null,null],[["tomate","cherry","jitomate"],"Tomate","🍅","Frutas y verduras","verdura_ud",120,null],[["puerro"],"Puerro","🥬","Frutas y verduras",null,null,null],[["yuca","mandioca"],"Yuca","🥔","Frutas y verduras",null,null,null],[["haba"],"Habas","🫛","Frutas y verduras",null,null,null],[["aceituna","olivas"],"Aceitunas","🫒","Despensa",null,null,null],[["crema de cacahuete","mantequilla de cacahuete","cacahuete"],"Crema de cacahuete","🥜","Despensa",null,null,null],[["maicena","almidon de maiz","fecula"],"Maicena","🌽","Despensa",null,null,null],[["curcuma","comino","pimenton","oregano","albahaca","curry","canela","nuez moscada","eneldo","tomillo","romero"],"Especias","🧂","Despensa","especia",null,null],[["albaricoque seco","orejon","ciruela seca","higo seco","datil"],"Fruta desecada","🍑","Despensa",null,null,null],[["vainilla","esencia de vainilla","extracto de vainilla"],"Vainilla","🍶","Despensa",null,null,null],[["melocoton","durazno","nectarina","paraguayo"],"Melocotón","🍑","Frutas y verduras",null,null,null],[["barrita","barritas de cereales"],"Barritas de cereales","🍫","Despensa",null,null,null],[["cebolla","cebolleta","cebollino"],"Cebolla","🧅","Frutas y verduras","verdura_ud",150,null],[["ajo"],"Ajo","🧄","Frutas y verduras","cabeza_ajo",null,null],[["pimiento"],"Pimiento","🫑","Frutas y verduras","verdura_ud",150,null],[["lechuga","escarola","canonigo","rucula"],"Lechuga/hojas verdes","🥬","Frutas y verduras","bolsa_ensalada",null,null],[["espinaca"],"Espinacas","🥬","Frutas y verduras","bolsa_verdura",null,null],[["calabacin"],"Calabacín","🥒","Frutas y verduras","verdura_ud",250,null],[["berenjena"],"Berenjena","🍆","Frutas y verduras","verdura_ud",250,null],[["zanahoria"],"Zanahoria","🥕","Frutas y verduras","malla_kg",null,null],[["patata"],"Patata","🥔","Frutas y verduras","malla_kg",null,null],[["boniato","camote","batata"],"Boniato","🍠","Frutas y verduras","verdura_ud",250,null],[["aguacate","palta"],"Aguacate","🥑","Frutas y verduras","verdura_ud",200,null],[["champinon","seta","hongo"],"Champiñones/setas","🍄","Frutas y verduras","bandeja_verdura",null,null],[["brocoli"],"Brócoli","🥦","Frutas y verduras","verdura_ud",300,null],[["coliflor"],"Coliflor","🥦","Frutas y verduras","verdura_ud",500,null],[["calabaza"],"Calabaza","🎃","Frutas y verduras","peso_verdura",null,null],[["pepino"],"Pepino","🥒","Frutas y verduras","verdura_ud",200,null],[["limon"],"Limón","🍋","Frutas y verduras","malla_citrico",null,null],[["lima"],"Lima","🍋","Frutas y verduras","verdura_ud",70,null],[["naranja","mandarina"],"Naranja/mandarina","🍊","Frutas y verduras","malla_citrico",null,null],[["manzana"],"Manzana","🍎","Frutas y verduras","fruta_ud",180,null],[["platano","banana"],"Plátano","🍌","Frutas y verduras","fruta_ud",120,null],[["mango"],"Mango","🥭","Frutas y verduras","fruta_ud",300,null],[["fresa","freson"],"Fresas","🍓","Frutas y verduras","tarrina_fruta",null,null],[["frambuesa","arandano","mora","frutos rojos","grosella"],"Frutos rojos","🫐","Frutas y verduras","tarrina_fruta",null,null],[["kiwi"],"Kiwi","🥝","Frutas y verduras","fruta_ud",100,null],[["pera"],"Pera","🍐","Frutas y verduras","fruta_ud",180,null],[["melon"],"Melón","🍈","Frutas y verduras","pieza_grande",null,null],[["pina"],"Piña","🍍","Frutas y verduras","pieza_grande",null,null],[["jengibre"],"Jengibre","🫚","Frutas y verduras","trozo_raiz",null,null],[["guisante"],"Guisantes","🟢","Frutas y verduras","bolsa_legumbre",null,null],[["judia verde","judias verdes"],"Judías verdes","🫛","Frutas y verduras","manojo_verdura",null,null],[["esparrago"],"Espárragos","🌱","Frutas y verduras","manojo_verdura",null,null],[["perejil","cilantro","albahaca","romero","tomillo","laurel","oregano","eneldo","menta","hierbabuena"],"Hierbas aromáticas","🌿","Frutas y verduras","manojo_hierba",null,null],[["lenteja"],"Lentejas","🫘","Legumbres y cereales","bote_legumbre",null,null],[["garbanzo"],"Garbanzos","🫘","Legumbres y cereales","bote_legumbre",null,null],[["alubia","judia blanca","frijol","judion"],"Alubias","🫘","Legumbres y cereales","bote_legumbre",null,null],[["arroz"],"Arroz","🍚","Legumbres y cereales","paquete_seco",null,null],[["quinoa"],"Quinoa","🌾","Legumbres y cereales","paquete_seco",null,null],[["avena"],"Avena","🌾","Legumbres y cereales","paquete_seco",null,null],[["tahini","tahin","pasta de sesamo","pasta de ajonjoli","crema de sesamo"],"Pasta de sésamo (tahini)","🥜","Despensa",null,null,null],[["pasta","espagueti","macarron","fideo","tallarin","penne","fusilli","lasana","canelone","noqui","gnocchi"],"Pasta","🍝","Legumbres y cereales","paquete_seco",null,null],[["pan","tostada","hojaldre"],"Pan/tostadas","🍞","Legumbres y cereales","barra_pan",null,null],[["harina"],"Harina","🌾","Legumbres y cereales","paquete_seco",null,null],[["cuscus"],"Cuscús","🌾","Legumbres y cereales","paquete_seco",null,null],[["tofu"],"Tofu","🌱","Legumbres y cereales","bloque",null,null],[["heura"],"Heura","🌱","Legumbres y cereales",null,null,null],[["seitan"],"Seitán","🌱","Legumbres y cereales",null,null,null],[["surimi","palitos de surimi","gula"],"Surimi","🐟","Pescadería",null,null,null],[["soja","soya"],"Soja","🌱","Legumbres y cereales","brick_bebida",null,null],[["hummus"],"Hummus","🫘","Legumbres y cereales","tarrina",null,null],[["aceite","aove"],"Aceite de oliva","🫒","Despensa","botella",null,null],[["maiz","choclo","elote"],"Maíz","🌽","Despensa",null,null,null],[["papaya"],"Papaya","🥭","Frutas y verduras",null,null,null],[["sal"],"Sal","🧂","Despensa","paquete_basico",null,null],[["pimienta"],"Pimienta","🧂","Despensa","especia",null,null],[["vinagre"],"Vinagre","🍶","Despensa","botella",null,null],[["azucar"],"Azúcar","🍬","Despensa","paquete_basico",null,null],[["edulcorante","estevia","sacarina"],"Edulcorante","🍬","Despensa","paquete_basico",null,null],[["miel"],"Miel","🍯","Despensa","bote_basico",null,null],[["chocolate","cacao","nocilla"],"Chocolate/cacao","🍫","Despensa","tableta",null,null],[["nuez","nueces","almendra","pistacho","anacardo","avellana","frutos secos","pasa","uva pasa","ciruela pasa","semillas","pinon","pinones"],"Frutos secos","🥜","Despensa","bolsa_secos",null,null],[["semilla","chia","lino","sesamo"],"Semillas","🌰","Despensa","paquete_basico",null,null],[["caldo"],"Caldo","🥣","Despensa","brick_caldo",null,null],[["vino"],"Vino","🍷","Despensa","botella",null,null],[["mermelada"],"Mermelada","🍓","Despensa","bote_basico",null,null],[["mostaza"],"Mostaza","🟡","Despensa","bote_basico",null,null],[["curry","pimenton","comino","azafran","canela","cayena","especias","clavo"],"Especias","🌶️","Despensa","especia",null,null],[["coco"],"Coco","🥥","Despensa","paquete_basico",null,null],[["gelatina"],"Gelatina","🍮","Despensa","paquete_basico",null,null],[["levadura","bicarbonato","polvo de hornear","polvo hornear","polvo para hornear"],"Levadura/bicarbonato","🧁","Despensa","paquete_basico",null,null],[["rape"],"Rape","🐟","Pescadería",null,null,null],[["lenguado"],"Lenguado","🐟","Pescadería",null,null,null],[["marisco"],"Marisco variado","🦐","Pescadería",null,null,null],[["pescado"],"Pescado","🐟","Pescadería",null,null,null],[["conejo"],"Conejo","🍖","Carnicería",null,null,null],[["mortadela"],"Mortadela","🥓","Carnicería",null,null,null],[["apio"],"Apio","🥬","Frutas y verduras",null,null,null],[["acelga"],"Acelgas","🥬","Frutas y verduras",null,null,null],[["alcachofa"],"Alcachofas","🌿","Frutas y verduras",null,null,null],[["berro"],"Berros","🥬","Frutas y verduras",null,null,null],[["endibia","endivia"],"Endibias","🥬","Frutas y verduras",null,null,null],[["hinojo"],"Hinojo","🌿","Frutas y verduras",null,null,null],[["germinado"],"Germinados","🌱","Frutas y verduras",null,null,null],[["guindilla"],"Guindilla","🌶️","Frutas y verduras",null,null,null],[["jalapeno","chile"],"Chile/jalapeño","🌶️","Frutas y verduras",null,null,null],[["col rizada","repollo","berza","lombarda","kale","col"],"Col/repollo","🥬","Frutas y verduras",null,null,null],[["granada"],"Granada","🔴","Frutas y verduras",null,null,null],[["higo"],"Higos","🟣","Frutas y verduras",null,null,null],[["sandia"],"Sandía","🍉","Frutas y verduras",null,null,null],[["menestra"],"Menestra de verduras","🥗","Frutas y verduras",null,null,null],[["chalota"],"Chalotas","🧅","Frutas y verduras",null,null,null],[["ajete"],"Ajetes","🧄","Frutas y verduras",null,null,null],[["ricotta","ricota","mascarpone","cottage"],"Queso fresco (ricotta/cottage)","🧀","Huevos y lácteos",null,null,null],[["cuajada"],"Cuajada","🥛","Huevos y lácteos",null,null,null],[["natillas","natilla"],"Natillas","🍮","Huevos y lácteos",null,null,null],[["bebida vegetal","bebida de avena","leche vegetal"],"Bebida vegetal","🥛","Huevos y lácteos",null,null,null],[["galleta"],"Galletas","🍪","Despensa",null,null,null],[["tortilla de trigo","tortillas de trigo","tortilla de maiz"],"Tortillas/wraps","🌯","Legumbres y cereales",null,null,null],[["oblea"],"Obleas","🥟","Legumbres y cereales",null,null,null],[["focaccia"],"Focaccia","🍞","Legumbres y cereales",null,null,null],[["judias pintas","judia pinta","alubia pinta","frijol pinto"],"Alubias pintas","🫘","Legumbres y cereales",null,null,null],[["proteina en polvo","proteina de suero","proteina aislada","whey","caseina"],"Proteína en polvo","🥤","Despensa",null,null,null],[["bechamel"],"Bechamel","🥫","Despensa",null,null,null],[["mayonesa"],"Mayonesa","🥫","Despensa",null,null,null],[["pesto"],"Pesto","🥫","Despensa",null,null,null],[["vinagreta"],"Vinagreta","🥫","Despensa",null,null,null],[["alcaparra"],"Alcaparras","🫒","Despensa",null,null,null],[["palmito"],"Palmitos","🥫","Despensa",null,null,null]];

// Matching idéntico al script: gana la coincidencia más a la IZQUIERDA del texto
// y, a igual posición, la clave más LARGA. Tolera plurales (almendra→almendras).
const _canonMatch=(txt)=>{
  const t=txt.normalize("NFD").replace(/[\u0300-\u036f]/g,"").toLowerCase();
  let mejor=null,mPos=1e9,mLen=-1;
  for(const e of _CANON){
    for(const c of e[0]){
      const m=t.match(new RegExp("\\b"+c.replace(/[.*+?^${}()|[\]\\]/g,"\\$&")+"(?:es|s)?\\b"));
      if(!m) continue;
      const pos=m.index, ln=m[0].length;
      if(pos<mPos||(pos===mPos&&ln>mLen)){ mejor=e; mPos=pos; mLen=ln; }
    }
  }
  return mejor;
};
// Porte fiel de formato_compra_realista (badges cortos: el nombre ya va a la izquierda)
function _fmtCompra(e, c){
  const tipo=e[4], pud=e[5], paq=e[6]||6;
  const g=(c.g||0)+((pud&&c.ud)?c.ud*pud:0), ml=c.ml||0, ud=c.ud||0, cda=c.cda||0, cdta=c.cdta||0;
  const rk=(gr,paso)=>{const kg=Math.max(paso,Math.ceil(gr/paso)*paso);return kg>=1000?`${Math.round(kg/100)/10} kg`.replace(".",","):`${kg} g`;};
  if(["peso_carne","peso_pescado","peso_verdura","peso_queso"].includes(tipo)){
    const gr=g>0?g:(ud?ud*150:250);
    const env={peso_carne:"bandeja ",peso_pescado:"",peso_verdura:"",peso_queso:"cuña "}[tipo];
    return `${env}~${rk(gr,tipo.includes("carne")||tipo.includes("pescado")?500:250)}`;
  }
  if(tipo==="lonchas") return "1 paquete";
  if(tipo==="pieza_emb") return "1 pieza";
  if(tipo==="paquete_ud"){ const n=Math.max(1,Math.ceil(ud||1)); return n<=paq?"1 paquete":`${Math.ceil(n/paq)} paquetes`; }
  if(tipo==="lata"){ const n=Math.max(1,Math.ceil(ud||1)); return n>1?`${n} latas`:"1 lata"; }
  if(tipo==="malla_marisco") return "1 malla";
  if(tipo==="verdura_ud"||tipo==="fruta_ud"){
    const n=Math.max(1, Math.ceil((ud||0)+((c.g||0)/(pud||150))));
    return `${n} ud`;
  }
  if(tipo==="cabeza_ajo") return "1 cabeza";
  if(tipo==="bolsa_ensalada"||tipo==="bolsa_verdura"||tipo==="bolsa_legumbre"||tipo==="bolsa_secos") return "1 bolsa";
  if(tipo==="bandeja_verdura") return "1 bandeja";
  if(tipo==="malla_kg") return `1 malla (~${rk(g>0?g:500,500)})`;
  if(tipo==="malla_citrico"){ const n=ud?Math.ceil(ud):Math.max(2,Math.round(g/180)); return `1 malla (~${Math.max(n,4)} ud)`; }
  if(tipo==="tarrina_fruta"||tipo==="tarrina") return "1 tarrina";
  if(tipo==="pieza_grande") return "1 ud";
  if(tipo==="trozo_raiz") return "1 trozo";
  if(tipo==="manojo_verdura") return "1 manojo";
  if(tipo==="manojo_hierba") return "1 manojo o bote seco";
  if(tipo==="docena"){
    const n=ud?Math.ceil(ud):Math.max(2,Math.round(g/55));
    if(n<=6) return "½ docena"; if(n<=12) return "1 docena"; return `${Math.ceil(n/12)} docenas`;
  }
  if(tipo==="liquido_l"){
    let tot=ml+(g||0)+cda*15+cdta*5; if(tot<=0)tot=500;   // muchas recetas dan leche en g≈ml
    const L=Math.max(1,Math.ceil(tot/1000));
    return L>1?`${L} L`:"1 brick (1 L)";
  }
  if(tipo==="pack_yogur"){ const n=ud?Math.ceil(ud):4; return `1 pack (${Math.max(n,4)} ud)`; }
  if(tipo==="brick_nata"||tipo==="brick_bebida"||tipo==="brick_caldo") return "1 brick";
  if(tipo==="botella") return "1 botella";
  if(tipo==="bote_legumbre"){ const n=ud?Math.max(1,Math.ceil(ud)):(g?Math.max(1,Math.ceil(g/400)):1); return n>1?`${n} botes`:"1 bote"; }
  if(tipo==="paquete_basico"||tipo==="paquete_seco") return "1 paquete";
  if(tipo==="bote_basico"||tipo==="especia") return "1 bote";
  if(tipo==="tableta") return "1 tableta";
  if(tipo==="bloque") return "1 bloque";
  if(tipo==="barra_pan") return "1 barra";
  // Sin formato configurado: aproximación redondeada
  if(g>0) return `~${rk(g,100)}`;
  if(ud>0) return `×${Math.ceil(ud)}`;
  if(cda||cdta) return `${cda||cdta} ${cda?"cda":"cdta"}`;
  return "al gusto";
}
// ─── Alimentos rechazados (GENERADO desde _RECHAZO_EXPANSION del script) ─────
// El cambio de receta con gemas debe respetar los rechazos/alergias igual que
// la generación: sin esto, un paciente que rechaza pescado podía traerse un
// salmón con un cambio (fuga detectada jul-2026, casos Joselyn/Virginia).
const _RECH_EXP={"pescado":["abadejo","anchoa","anguila","atun","bacalao","besugo","bonito","boqueron","caballa","dorada","emperador","gulas","huevas","jurel","lenguado","lubina","merluza","mero","mojama","palitos de cangrejo","palitos de mar","palometa","panga","perca","pescadilla","pescado","pez espada","rape","rodaballo","salmon","salmonete","sardina","surimi","tilapia","trucha","ventresca"],"pescados":["abadejo","anchoa","anguila","atun","bacalao","besugo","bonito","boqueron","caballa","dorada","emperador","gulas","huevas","jurel","lenguado","lubina","merluza","mero","mojama","palitos de cangrejo","palitos de mar","palometa","panga","perca","pescadilla","pescado","pez espada","rape","rodaballo","salmon","salmonete","sardina","surimi","tilapia","trucha","ventresca"],"marisco":["almeja","berberecho","bogavante","calamar","cangrejo","carabinero","centollo","chipiron","chirla","cigala","coquina","gamba","langosta","langostino","marisco","mejillon","navaja","necora","ostra","percebe","pulpo","quisquilla","sepia","vieira","zamburina"],"mariscos":["almeja","berberecho","bogavante","calamar","cangrejo","carabinero","centollo","chipiron","chirla","cigala","coquina","gamba","langosta","langostino","marisco","mejillon","navaja","necora","ostra","percebe","pulpo","quisquilla","sepia","vieira","zamburina"],"carne":["albondiga","bacon","beicon","buey","butifarra","carne","carrillada","cerdo","chorizo","chuleta","codillo","conejo","contramuslo","cordero","costilla","embutido","entrecot","fiambre","hamburguesa","jamon","lomo","longaniza","morcilla","mortadela","muslo","panceta","pato","pavo","pechuga","pollo","presa","rabo","salami","salchicha","salchichon","solomillo","ternera","tocino","vaca","vacuno"],"carnes":["albondiga","bacon","beicon","buey","butifarra","carne","carrillada","cerdo","chorizo","chuleta","codillo","conejo","contramuslo","cordero","costilla","embutido","entrecot","fiambre","hamburguesa","jamon","lomo","longaniza","morcilla","mortadela","muslo","panceta","pato","pavo","pechuga","pollo","presa","rabo","salami","salchicha","salchichon","solomillo","ternera","tocino","vaca","vacuno"],"huevo":["clara","flan","frittata","huevo","mayonesa","merengue","quiche","revuelto","tortilla espanola","tortilla francesa","yema"],"huevos":["clara","flan","frittata","huevo","mayonesa","merengue","quiche","revuelto","tortilla espanola","tortilla francesa","yema"],"lacteo":["bechamel","burgos","cheddar","cottage","cuajada","emmental","feta","gouda","helado","kefir","lacteo","leche","mantequilla","mascarpone","mozzarella","nata","natillas","parmesano","queso","queso crema","queso fresco","requeson","ricotta","yogur","yogurt"],"lacteos":["bechamel","burgos","cheddar","cottage","cuajada","emmental","feta","gouda","helado","kefir","lacteo","leche","mantequilla","mascarpone","mozzarella","nata","natillas","parmesano","queso","queso crema","queso fresco","requeson","ricotta","yogur","yogurt"],"lactosa":["bechamel","burgos","cheddar","cottage","cuajada","emmental","feta","gouda","helado","kefir","lacteo","leche","mantequilla","mascarpone","mozzarella","nata","natillas","parmesano","queso","queso crema","queso fresco","requeson","ricotta","yogur","yogurt"],"gluten":["baguette","biscote","bizcocho","bocadillo","canelon","cebada","centeno","colines","cous cous","crepe","croqueta","cuscus","empanada","empanadilla","espagueti","fideo","focaccia","galleta","gluten","gnocchi","gofre","harina","hojaldre","lasana","macarron","magdalena","masa","noodles","noquis","pan","pan rallado","pasta","picos","pizza","raviolis","rebozado","seitan","tallarin","tostada","trigo","wrap"],"trigo":["baguette","biscote","bizcocho","bocadillo","canelon","cebada","centeno","colines","cous cous","crepe","croqueta","cuscus","empanada","empanadilla","espagueti","fideo","focaccia","galleta","gluten","gnocchi","gofre","harina","hojaldre","lasana","macarron","magdalena","masa","noodles","noquis","pan","pan rallado","pasta","picos","pizza","raviolis","rebozado","seitan","tallarin","tostada","trigo","wrap"],"fruto seco":["almendra","anacardo","avellana","cacahuete","castana","fruto seco","frutos secos","macadamia","mani","nueces","nuez","pecana","pinon","pistacho"],"frutos secos":["almendra","anacardo","avellana","cacahuete","castana","fruto seco","frutos secos","macadamia","mani","nueces","nuez","pecana","pinon","pistacho"],"frutoseco":["almendra","anacardo","avellana","cacahuete","castana","fruto seco","frutos secos","macadamia","mani","nueces","nuez","pecana","pinon","pistacho"],"soja":["edamame","miso","soja","soja texturizada","tempeh","tofu"],"legumbre":["alubia","frijol","garbanzo","haba","judia blanca","judion","legumbre","lenteja"],"legumbres":["alubia","frijol","garbanzo","haba","judia blanca","judion","legumbre","lenteja"],"casqueria":["callos","casqueria","higado","molleja","rinon","sesos"],"conserva":["conserva","lata"],"conservas":["conserva","lata"],"baina":["judia verde","vaina"],"bainas":["judia verde","vaina"],"vinagrillo":["encurtido","pepinillo","vinagre"],"vinagrillos":["encurtido","pepinillo","vinagre"],"col":["berza","col","coliflor","kale","lombarda","repollo"],"coles":["berza","col","coliflor","kale","lombarda","repollo"]};
const _RECH_STOP=new Set(["los","las","que","con","por","del","una","uno","este","esta","como","muy","para","the","and","alimentos","alimento","comida","comidas","ningun","ninguna","nada","tipo","tipos"]);
function interpretarRechazados(notas){
  const pref={terms:new Set(), tipos:new Set()};
  const t=String(notas||"").normalize("NFD").replace(/[\u0300-\u036f]/g,"").toLowerCase();
  if(!t) return pref;
  const pats=[/rechazad[oa]s?\s*:?\s*([^\n.]*)/g,/alergi[ao]s?\s*:?\s*([^\n.]*)/g,
              /no me gustan?\s*:?\s*([^\n.]*)/g,/no le gustan?\s*:?\s*([^\n.]*)/g,
              /no tolero\s*:?\s*([^\n.]*)/g,/no come\s*:?\s*([^\n.]*)/g];
  for(const pat of pats){
    let m;
    while((m=pat.exec(t))!==null){
      const seg=m[1]||"";
      if(/\bpescados?\b/.test(seg)) pref.tipos.add("Pescado");
      if(/\bcarnes?\b/.test(seg))   pref.tipos.add("Carne");
      for(const k in _RECH_EXP){
        if(new RegExp("\\b"+k+"\\b").test(seg)) for(const v of _RECH_EXP[k]) pref.terms.add(v);
      }
      for(const tr of seg.split(/[,;]|\sy\s|\se\s/)){
        const pals=tr.trim().split(/\s+/).filter(p=>p&&p.length>=3&&!_RECH_STOP.has(p));
        if(!pals.length) continue;
        const cand=pals[0].replace(/[.:]+$/,"");
        if(cand.length>=3&&!_RECH_STOP.has(cand)){
          if(_RECH_EXP[cand]) for(const v of _RECH_EXP[cand]) pref.terms.add(v);
          else pref.terms.add(cand);
        }
      }
    }
  }
  return pref;
}
function recetaRechazadaJS(rec, pref){
  if(!pref||(!pref.terms.size&&!pref.tipos.size)) return false;
  if(pref.tipos.has(String(rec.tipo||rec.Tipo||""))) return true;
  const txt=String((rec.nombre||rec.nombre_receta||"")+" "+(rec.ingredientes||""))
    .normalize("NFD").replace(/[\u0300-\u036f]/g,"").toLowerCase();
  for(const r of pref.terms){
    let raiz=r;
    if(raiz.endsWith("es")&&raiz.length>4) raiz=raiz.slice(0,-2);
    else if(raiz.endsWith("s")&&raiz.length>3) raiz=raiz.slice(0,-1);
    if(new RegExp("\\b"+raiz.replace(/[.*+?^${}()|[\]\\]/g,"\\$&")+"(s|es)?\\b").test(txt)) return true;
  }
  return false;
}
const _RX_AGUA=/^\s*[\d.,\u00bd\u00bc\u00be\u2153\u2154\u215b ]*\s*(vasos?|tazas?|ml|l|litros?)?\s*(de\s+)?(agua|hielo|cubitos\s+de\s+hielo)(\s+(fr[i\u00ed]a|caliente|tibia|mineral|con\s+gas|hirviendo|filtrada))?\s*(\([^)]*\))?\s*$/i;
const _KEY_STRIP=/\b(crud[oa]s?|fresc[oa]s?|tostad[oa]s?|pelad[oa]s?|picad[oa]s?|trocead[oa]s?|laminad[oa]s?|cortad[oa]s?(\s+en\s+\w+)?|en\s+dados|en\s+rodajas|en\s+tiras|en\s+juliana|en\s+trozos|sin\s+sal|sin\s+piel|sin\s+hueso|sin\s+espinas?|deshuesad[oa]s?|escurrid[oa]s?)\b/gi;
function agregarListaCompra(planJ){
  if(!planJ) return [];
  const nrm=s=>s.normalize("NFD").replace(/[\u0300-\u036f]/g,"").toLowerCase().trim();
  // items: clave = SOLO el nombre normalizado → el mismo ingrediente expresado en
  // unidades distintas entre recetas ("120 g requesón" + "¼ tarrina requesón") se
  // FUSIONA en una fila; dentro, sus cantidades se sub-agregan en `partes` por
  // unidad y el badge las muestra combinadas: "120 g + 1 tarrina".
  const mapa=new Map();
  // Clave canónica ligera: sin tildes, sin descriptores de ESTADO que no cambian
  // el producto de compra (tostado, crudo, pelado, cortes…) y en singular.
  // Así "25 g almendras" y "30 g almendra tostada" son UNA fila. Descriptores que
  // SÍ cambian el producto (frito, ahumado, en conserva, en polvo…) se conservan.
  const claveNombre=(nombre)=>{
    let k=nrm(nombre).replace(_KEY_STRIP," ").replace(/\b(y|o|e|u)\b/g," ")
                     .replace(/\s+/g," ").trim();
    return k.split(" ").map(w=>w.length>3&&w.endsWith("s")?w.slice(0,-1):w).join(" ");
  };
  const meter=(nombre, parte)=>{
    const key = parte.tipo==="desp" ? "desp|"+nombre : (claveNombre(nombre)||nrm(nombre));
    let item=mapa.get(key);
    if(!item){ item={key,nombre,tipo:parte.tipo,partes:[]}; mapa.set(key,item); }
    else if(nombre.length<item.nombre.length){ item.nombre=nombre; }  // nombre más corto = más genérico
    const pk = parte.tipo+"|"+(parte.uni||"");
    const prev=item.partes.find(p=>p._pk===pk);
    if(prev){ prev.cant=(prev.cant||0)+(parte.cant||0); prev.veces=(prev.veces||0)+(parte.veces||0); }
    else item.partes.push({_pk:pk,...parte});
  };
  for(const tm of PLAN_TOMAS){
    const celdas=planJ[tm]; if(!celdas) continue;
    for(let d=1; d<=7; d++){
      const ing=celdas[String(d)]?.Ingredientes; if(!ing) continue;
      // split por comas respetando paréntesis + fusión de descriptores (con espacio)
      const segs=[];
      for(const raw of String(ing).split(/[,;](?![^(]*\))/)){
        const s=raw.trim(); if(!s) continue;
        if(segs.length&&_DESC_SEG.test(s)) segs[segs.length-1]+=" "+s; else segs.push(s);
      }
      for(const seg of segs){
        const s=_normFrac(seg);
        if(_RX_AGUA.test(s)) continue;   // el agua no se compra ("0.2 vaso de agua (40 g)")
        // cantidad entre paréntesis: manda ("0.5 taza (45 g) avena" → 45 g)
        const mp=s.match(/\((\d+(?:[.,]\d+)?)\s*(g|gr|gramos|ml|cl|kg|l)\b[^)]*\)/i);
        let resto=s.replace(/\([^)]*\)/g," ").replace(/\s+/g," ").trim();
        let cant=null, uni="", tipo="";
        const mnum=resto.match(/^(\d+(?:[.,]\d+)?)\s*/);
        if(mnum){ cant=parseFloat(mnum[1].replace(",",".")); resto=resto.slice(mnum[0].length); }
        for(const [rx,u,tp] of _UNIDADES){
          const mu=resto.match(rx);
          if(mu){ uni=u; tipo=tp; resto=resto.slice(mu[0].length).trim(); break; }
        }
        resto=resto.replace(/^de\s+/i,"").replace(/^del\s+/i,"").trim()
                   .replace(/\s*,\s*/g," ").replace(/[.,;\s]+$/,"");
        if(mp){ cant=parseFloat(mp[1].replace(",",".")); uni=mp[2].toLowerCase(); if(uni==="gr"||uni==="gramos")uni="g"; tipo="peso"; }
        if(tipo==="peso"){
          if(uni==="kg"){cant*=1000;uni="g";} if(uni==="l"){cant*=1000;uni="ml";} if(uni==="cl"){cant*=10;uni="ml";}
        }
        const nombre=(resto||seg.trim()).replace(/[()]/g," ").replace(/\s+/g," ").trim();
        if(!nombre) continue;
        // ── Camino canónico: mismo diccionario y formatos comerciales que el PDF ──
        // "Vale más comprar una unidad comercial, aunque sobre, que ajustar por
        // gramos" — se acumulan g/ml/ud/cda y el badge sale de _fmtCompra.
        const can=_canonMatch(seg);
        if(can){
          const key="can|"+can[1];
          let item=mapa.get(key);
          if(!item){ item={key,nombre:can[2]+" "+can[1],sortName:can[1],cat:can[3],entry:can,c:{}}; mapa.set(key,item); }
          const c=item.c;
          if(mp||tipo==="peso"){ const ku=(uni==="ml")?"ml":"g"; c[ku]=(c[ku]||0)+(cant||0); }
          else if(tipo==="med"){ c[uni]=(c[uni]||0)+(cant||0); }
          else if(tipo==="cont"||tipo==="ud"||(cant!=null&&!tipo)){ c.ud=(c.ud||0)+(cant||0); }  // "2 tomate" sin unidad = contable
          else if(tipo==="sub"){ c.sub=(c.sub||0)+(cant||0); }   // rodajas/lonchas: no son unidades enteras
          continue;
        }
        const desp=_DESPENSA.find(([rx])=>rx.test(nombre));
        if(desp){ meter(desp[1],{tipo:"desp",compra:desp[2],veces:1}); continue; }
        if(cant==null){ meter(nombre,{tipo:"veces",veces:1}); continue; }
        if(tipo==="peso"||tipo==="med"){ meter(nombre,{tipo,uni,cant}); continue; }
        if(tipo==="cont"){ meter(nombre,{tipo,uni,cant}); continue; }
        if(tipo==="sub"){ meter(nombre,{tipo:"ud",cant:1}); continue; }   // sin canónico: 1 ud cubre
        meter(nombre,{tipo:"ud",cant});   // contable ("1 cebolla")
      }
    }
  }
  // Orden de partes dentro de cada fila: peso primero, luego envases, medidas, ud
  const rango={peso:0,cont:1,med:2,ud:3,veces:4,desp:5};
  const items=[...mapa.values()];
  for(const it of items) if(it.partes) it.partes.sort((a,b)=>(rango[a.tipo]??9)-(rango[b.tipo]??9));
  const esDesp=(x)=>x.tipo==="desp"||x.cat==="Despensa";
  const alfa=(a,b)=>(a.sortName||a.nombre).localeCompare(b.sortName||b.nombre,"es");
  return items.filter(x=>!esDesp(x)).sort(alfa).concat(items.filter(esDesp).sort(alfa));
}
// ── Estados de cumplimiento por comida (registro del paciente) ──────────────
// El registro por toma alimenta los mini-botones de Inicio y CIERRA la misión de
// dieta (racha) cuando TODAS las tomas de la pauta del día quedan registradas,
// sea cual sea el estado: registrar con honestidad cuenta; no registrar, no.
// No toca la lógica de calorías. Las palabras mapean lo que pide el paciente:
// "como menos", "cambio el plato", "como fuera", "me salto la comida".
const PLAN_CUMPL = [
  {k:'seguida',  es:'Seguida',     en:'Followed', ic:'✅', c:T.g1},
  {k:'menos',    es:'Menos',       en:'Less',     ic:'➖', c:T.au1},
  {k:'cambiada', es:'La cambié',   en:'Swapped',  ic:'🔄', c:T.blue},
  {k:'fuera',    es:'Comí fuera',  en:'Ate out',  ic:'🍽️', c:T.pur},
  {k:'saltada',  es:'Me la salté', en:'Skipped',  ic:'⏭️', c:T.red},
];
const PLAN_TIPO_IC = {Carne:'🥩',Pescado:'🐟',Vegetariana:'🥗',Vegana:'🌱',Ensalada:'🥬','Sopa/Crema':'🍲',Postre:'🍰',Directo:'🍃',
  Meat:'🥩',Fish:'🐟',Vegetarian:'🥗',Vegan:'🌱',Dessert:'🍰',Salad:'🥬','Soup/Cream':'🍲'};
// ── Emoji por FORMATO del plato (espejo de emoji_plato del script Python) ──
// El formato MANDA sobre el tipo: pasta con atún → 🍝 (no 🐟); postre → 🍰 siempre.
const REGLAS_EMOJI_PLATO = [
  [/pasta|espagueti|spaghetti|macarron|tallarin|noodle|lasan|fideu|fideo|carbonara|bolones|raviol|noqui|gnocchi|canelon/, '🍝'],
  [/pizza/, '🍕'],
  [/arroz|paella|risotto|quinoa|cuscus|couscous/, '🍚'],
  [/sopa|crema de|pure|gazpacho|salmorejo|caldo/, '🍲'],
  [/ensalada|tabule/, '🥗'],
  [/lenteja|garbanzo|alubia|frijol|potaje|cocido|guiso/, '🥘'],
  [/hamburguesa/, '🍔'],
  [/bocadillo|sandwich|wrap|burrito|quesadilla|taco|fajita/, '🥪'],
  [/tortilla|revuelto|huevo/, '🍳'],
  [/tortita|pancake|crep|gofre|waffle/, '🥞'],
  [/gachas|porridge|avena|bol de|smoothie bowl/, '🥣'],
  [/batido|smoothie|zumo/, '🥤'],
  [/pollo|pavo|pechuga/, '🍗'],
  [/salmon|atun|merluza|bacalao|dorada|lubina|pescado|sepia|calamar|gamba|marisco|pulpo|boqueron|sardina|rape|emperador|trucha|mejillon|almeja/, '🐟'],
  [/ternera|cerdo|lomo|solomillo|filete|albondiga|estofado|carrillera|costilla|entrecot|chuleta|carne/, '🥩'],
  [/tofu|tempeh|seitan|soja|heura/, '🌱'],
  [/yogur|requeson|queso fresco|kefir/, '🥛'],
  [/tostada|pan /, '🍞'],
  [/fruta|manzana|pera|platano|fresa|macedonia|melon|sandia|naranja|mandarina|kiwi|uva|melocoton|cereza|arandano|mango|pina/, '🍎'],
  [/frutos secos|almendra|nuez|nueces|anacardo|pistacho|avellana|cacahuete/, '🥜'],
  [/queso/, '🧀'],
  [/leche|cacao|cafe/, '🥛'],
  [/aguacate/, '🥑'],
];
const emojiPlato = (nombre, tipo) => {
  if(tipo==='Postre'||tipo==='Dessert') return '🍰';
  const n = String(nombre||'').toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g,'');
  for(const [re,em] of REGLAS_EMOJI_PLATO) if(re.test(n)) return em;
  return PLAN_TIPO_IC[tipo] || '🍴';
};
const PLAN_TIPO_BG = {Carne:'rgba(192,57,43,0.22)',Pescado:'rgba(41,128,185,0.22)',Vegetariana:'rgba(39,174,96,0.18)',Vegana:'rgba(22,160,133,0.18)',Ensalada:'rgba(139,195,74,0.18)','Sopa/Crema':'rgba(230,126,34,0.22)',Postre:'rgba(214,70,158,0.22)',Directo:'rgba(212,175,55,0.22)'};
const PLAN_TIPO_COLOR={Carne:'#E57373',Pescado:'#64B5F6',Vegetariana:'#81C784',Vegana:'#A5D6A7',Postre:'#F06292',Ensalada:'#AED581','Sopa/Crema':'#FFB74D'};

// ── Exportación CSV del seguimiento de un paciente (para el nutricionista) ────
async function exportarSeguimientoCSV(profileId, nombre){
  try{
    const rows = await sbReq('GET',`daily_logs?profile_id=eq.${profileId}&select=log_date,meals_log,day_note&order=log_date.asc`);
    const cell = (v)=>{ const s=String(v==null?'':v).replace(/"/g,'""'); return /[",\n;]/.test(s)?`"${s}"`:s; };
    const lines = [['Fecha','Desayuno','Almuerzo','Comida','Merienda','Cena','Nota'].join(',')];
    (rows||[]).forEach(r=>{ const m=r.meals_log||{};
      lines.push([r.log_date, m.Desayuno||'', m.Almuerzo||'', m.Comida||'', m.Merienda||'', m.Cena||'', r.day_note||''].map(cell).join(',')); });
    const csv = '\ufeff'+lines.join('\n');   // BOM para que Excel respete los acentos
    const blob = new Blob([csv],{type:'text/csv;charset=utf-8;'});
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href=url; a.download=`seguimiento_${String(nombre||'paciente').replace(/\s+/g,'_')}_${toKey()}.csv`;
    document.body.appendChild(a); a.click(); document.body.removeChild(a);
    setTimeout(()=>URL.revokeObjectURL(url),1000);
  }catch(e){ console.warn('[export-csv] error', e); }
}

// ── Vista de SEGUIMIENTO: calendario de cumplimiento por comida + gráficas ────
// Se alimenta de los registros que el paciente marca en la Programación diaria
// (daily_logs.meals_log). El paciente ve su cumplimiento; el nutricionista lo
// ve en su panel y puede exportarlo a CSV.
function SeguimientoView({profile, lang}){
  const EN = lang==='en';
  const MESES = EN
    ? ['January','February','March','April','May','June','July','August','September','October','November','December']
    : ['Enero','Febrero','Marzo','Abril','Mayo','Junio','Julio','Agosto','Septiembre','Octubre','Noviembre','Diciembre'];
  const DOW = EN ? ['M','T','W','T','F','S','S'] : ['L','M','X','J','V','S','D'];
  const TOMA_LBL = EN
    ? {Desayuno:'Breakfast',Almuerzo:'Morning snack',Comida:'Lunch',Merienda:'Afternoon snack',Cena:'Dinner'}
    : {Desayuno:'Desayuno',Almuerzo:'Almuerzo',Comida:'Comida',Merienda:'Merienda',Cena:'Cena'};

  const hoy = new Date();
  const [anio,setAnio] = React.useState(hoy.getFullYear());
  const [mes,setMes]   = React.useState(hoy.getMonth());
  const [tomaSel,setTomaSel] = React.useState(PLAN_TOMAS[0]);
  const [logs,setLogs] = React.useState({});
  const [card,setCard] = React.useState(0);
  const scRef = React.useRef(null);

  React.useEffect(()=>{
    if(!profile?.id) return;
    try{
      const cache = lsGet(`gbh:logs:${profile.id}`, []);
      const seed={};
      (Array.isArray(cache)?cache:[]).forEach(l=>{ if(l?.date && (l.meals||l.note)) seed[l.date]={meals:l.meals||{}, note:l.note||''}; });
      setLogs(seed);
    }catch{}
    sbReq('GET',`daily_logs?profile_id=eq.${profile.id}&select=log_date,meals_log,day_note&order=log_date.desc&limit=370`)
      .then(rows=>{ if(!Array.isArray(rows)) return;
        const m={}; rows.forEach(r=>{ const k=r.log_date; if(k) m[k]={meals:r.meals_log||{}, note:r.day_note||''}; });
        setLogs(prev=>({...prev,...m})); });
  },[profile?.id]); // eslint-disable-line react-hooks/exhaustive-deps

  const estadoDe = (k)=>PLAN_CUMPL.find(x=>x.k===k);
  const keyDe = (d)=>`${anio}-${String(mes+1).padStart(2,'0')}-${String(d).padStart(2,'0')}`;
  const primerDia = new Date(anio,mes,1);
  const offset = (primerDia.getDay()+6)%7;                 // 0 = lunes
  const diasEnMes = new Date(anio,mes+1,0).getDate();
  const celdas = []; for(let i=0;i<offset;i++) celdas.push(null); for(let d=1;d<=diasEnMes;d++) celdas.push(d);
  const enMesActual = anio===hoy.getFullYear() && mes===hoy.getMonth();
  const esFutura = (d)=>{ const dt=new Date(anio,mes,d); dt.setHours(0,0,0,0); const h=new Date(); h.setHours(0,0,0,0); return dt>h; };
  const esHoy = (d)=> enMesActual && d===hoy.getDate();

  const stats = React.useMemo(()=>{
    const porEstado={seguida:0,menos:0,cambiada:0,fuera:0,saltada:0};
    const porToma={}; PLAN_TOMAS.forEach(t=>porToma[t]={seguida:0,total:0});
    const semanas={}; let totalReg=0;
    for(let d=1; d<=diasEnMes; d++){
      const meals = logs[keyDe(d)]?.meals||{};
      const w = Math.floor((offset+d-1)/7);
      PLAN_TOMAS.forEach(t=>{ const e=meals[t]; if(!e) return;
        totalReg++;
        if(porEstado[e]!==undefined) porEstado[e]++;
        porToma[t].total++; if(e==='seguida') porToma[t].seguida++;
        if(!semanas[w]) semanas[w]={seguida:0,total:0};
        semanas[w].total++; if(e==='seguida') semanas[w].seguida++;
      });
    }
    const cumpl = totalReg? Math.round(porEstado.seguida/totalReg*100):0;
    return {porEstado,porToma,semanas,totalReg,cumpl};
  },[logs,anio,mes,offset,diasEnMes]); // eslint-disable-line react-hooks/exhaustive-deps

  const mesAnt = ()=>{ if(mes===0){setMes(11);setAnio(a=>a-1);} else setMes(m=>m-1); };
  const mesSig = ()=>{ if(enMesActual) return; if(mes===11){setMes(0);setAnio(a=>a+1);} else setMes(m=>m+1); };
  const onScroll = ()=>{ const el=scRef.current; if(!el) return; const i=Math.round(el.scrollLeft/el.clientWidth); if(i!==card) setCard(i); };

  const TT = {fontFamily:"'Nunito',sans-serif"};
  const cardSty = {flex:'0 0 100%',scrollSnapAlign:'center',boxSizing:'border-box',background:'rgba(255,255,255,0.04)',border:'1.5px solid rgba(255,255,255,0.10)',borderRadius:18,padding:'16px 16px'};
  const semanasArr = Object.keys(stats.semanas).map(Number).sort((a,b)=>a-b);
  const hayDatos = stats.totalReg>0;
  const donutR=46, donutC=2*Math.PI*donutR;

  return(
    <div style={{paddingBottom:8}}>
      <div style={{padding:'4px 16px 0'}}>
        <div style={{fontWeight:900,fontSize:20,color:T.t1,...TT}}>{EN?'Tracking':'Seguimiento'}</div>
        <div style={{fontSize:12,color:T.t2,fontFamily:"'DM Sans',sans-serif",marginTop:2,lineHeight:1.45}}>{EN?'Your meal compliance, day by day':'Tu cumplimiento comida a comida, día a día'}</div>
      </div>

      {/* Navegación de mes */}
      <div style={{display:'flex',alignItems:'center',justifyContent:'space-between',padding:'12px 16px 8px'}}>
        <button onClick={mesAnt} style={{background:'rgba(255,255,255,0.06)',border:'none',borderRadius:10,width:36,height:36,color:T.t1,fontSize:18,cursor:'pointer'}}>‹</button>
        <div style={{fontWeight:900,fontSize:15,color:T.t1,...TT}}>{MESES[mes]} {anio}</div>
        <button onClick={mesSig} disabled={enMesActual} style={{background:enMesActual?'rgba(255,255,255,0.02)':'rgba(255,255,255,0.06)',border:'none',borderRadius:10,width:36,height:36,color:enMesActual?T.t3:T.t1,fontSize:18,cursor:enMesActual?'default':'pointer',opacity:enMesActual?0.4:1}}>›</button>
      </div>

      {/* Selector de comida */}
      <div style={{display:'flex',gap:6,overflowX:'auto',padding:'0 16px 10px',scrollbarWidth:'none'}}>
        {PLAN_TOMAS.map(t=>{ const on=t===tomaSel; return(
          <button key={t} onClick={()=>setTomaSel(t)} style={{flex:'0 0 auto',display:'flex',alignItems:'center',gap:5,padding:'8px 12px',borderRadius:12,cursor:'pointer',background:on?'rgba(206,130,255,0.18)':'rgba(255,255,255,0.05)',border:on?'1.5px solid '+T.pur:'1.5px solid transparent',color:on?T.pur:T.t2,fontSize:12,fontWeight:on?900:700,...TT}}>
            <span>{PLAN_TOMA_IC[t]}</span><span>{TOMA_LBL[t]}</span>
          </button>);})}
      </div>

      {/* Calendario de la comida seleccionada */}
      <div style={{padding:'0 16px'}}>
        <div style={{background:'rgba(255,255,255,0.03)',border:'1.5px solid rgba(255,255,255,0.10)',borderRadius:18,padding:'12px 12px 14px'}}>
          <div style={{display:'grid',gridTemplateColumns:'repeat(7,1fr)',gap:5,marginBottom:6}}>
            {DOW.map((d,i)=>(<div key={i} style={{textAlign:'center',fontSize:10,color:T.t3,fontWeight:800,...TT}}>{d}</div>))}
          </div>
          <div style={{display:'grid',gridTemplateColumns:'repeat(7,1fr)',gap:5}}>
            {celdas.map((d,i)=>{
              if(d===null) return <div key={'e'+i}/>;
              const e = logs[keyDe(d)]?.meals?.[tomaSel];
              const st = e?estadoDe(e):null;
              const fut = esFutura(d);
              return(
                <div key={d} style={{aspectRatio:'1',borderRadius:9,background:st?st.c+'24':'rgba(255,255,255,0.03)',border:esHoy(d)?'2px solid '+T.au1:(st?'1px solid '+st.c+'66':'1px solid rgba(255,255,255,0.06)'),display:'flex',flexDirection:'column',alignItems:'center',justifyContent:'center',gap:0,opacity:fut?0.3:1}}>
                  <div style={{fontSize:9,color:st?st.c:T.t3,fontWeight:800,lineHeight:1.1,...TT}}>{d}</div>
                  <div style={{fontSize:13,lineHeight:1.1}}>{st?st.ic:''}</div>
                </div>);
            })}
          </div>
        </div>
        {/* Leyenda */}
        <div style={{display:'flex',flexWrap:'wrap',gap:'6px 12px',padding:'10px 2px 2px'}}>
          {PLAN_CUMPL.map(c=>(<div key={c.k} style={{display:'flex',alignItems:'center',gap:4,fontSize:10.5,color:T.t2,fontFamily:"'DM Sans',sans-serif"}}><span>{c.ic}</span>{EN?c.en:c.es}</div>))}
          <div style={{display:'flex',alignItems:'center',gap:4,fontSize:10.5,color:T.t3,fontFamily:"'DM Sans',sans-serif"}}><span style={{width:12,height:12,borderRadius:3,border:'1px solid rgba(255,255,255,0.15)',display:'inline-block'}}/>{EN?'Not logged':'Sin registrar'}</div>
        </div>
      </div>

      {/* Gráficas en carrusel */}
      <div style={{padding:'14px 0 0'}}>
        <div style={{padding:'0 16px',fontSize:11,color:T.au1,fontWeight:900,textTransform:'uppercase',letterSpacing:'0.08em',marginBottom:8,...TT}}>{EN?`Charts · ${MESES[mes]}`:`Gráficas · ${MESES[mes]}`}</div>
        {!hayDatos ? (
          <div style={{margin:'0 16px',background:'rgba(255,255,255,0.04)',border:'1.5px dashed rgba(255,255,255,0.14)',borderRadius:18,padding:'24px 18px',textAlign:'center'}}>
            <div style={{fontSize:30,marginBottom:8}}>📊</div>
            <div style={{fontSize:13,color:T.t2,fontFamily:"'DM Sans',sans-serif",lineHeight:1.5}}>{EN?'No entries this month yet. Mark your meals in the Daily Schedule and your stats will appear here.':'Aún no hay registros este mes. Marca tus comidas en la Programación diaria y aquí verás tus estadísticas.'}</div>
          </div>
        ) : (<>
          <div ref={scRef} onScroll={onScroll} style={{display:'flex',overflowX:'auto',scrollSnapType:'x mandatory',gap:0,padding:'0 16px',scrollbarWidth:'none',WebkitOverflowScrolling:'touch'}}>
            {/* 1 · Cumplimiento global */}
            <div style={{...cardSty,marginRight:12}}>
              <div style={{fontWeight:900,fontSize:13.5,color:T.t1,marginBottom:12,...TT}}>{EN?'Overall compliance':'Cumplimiento global'}</div>
              <div style={{display:'flex',alignItems:'center',gap:16}}>
                <svg width="116" height="116" viewBox="0 0 120 120" style={{flexShrink:0}}>
                  <circle cx="60" cy="60" r={donutR} fill="none" stroke="rgba(255,255,255,0.08)" strokeWidth="12"/>
                  <circle cx="60" cy="60" r={donutR} fill="none" stroke={T.g1} strokeWidth="12" strokeLinecap="round" strokeDasharray={donutC} strokeDashoffset={donutC*(1-stats.cumpl/100)} transform="rotate(-90 60 60)"/>
                  <text x="60" y="56" textAnchor="middle" fontSize="27" fontWeight="900" fill={T.t1} fontFamily="Nunito">{stats.cumpl}%</text>
                  <text x="60" y="76" textAnchor="middle" fontSize="10" fill={T.t3} fontFamily="Nunito">{EN?'followed':'seguidas'}</text>
                </svg>
                <div style={{flex:1}}>
                  <div style={{fontSize:12,color:T.t2,fontFamily:"'DM Sans',sans-serif",lineHeight:1.6}}>
                    <div><b style={{color:T.g1}}>{stats.porEstado.seguida}</b> {EN?'meals followed':'comidas seguidas'}</div>
                    <div><b style={{color:T.t1}}>{stats.totalReg}</b> {EN?'meals logged':'comidas registradas'}</div>
                    <div><b style={{color:T.pur}}>{stats.porEstado.fuera}</b> {EN?'eaten out':'comiste fuera'}</div>
                  </div>
                </div>
              </div>
            </div>
            {/* 2 · Por comida */}
            <div style={{...cardSty,marginRight:12}}>
              <div style={{fontWeight:900,fontSize:13.5,color:T.t1,marginBottom:12,...TT}}>{EN?'Compliance by meal':'Cumplimiento por comida'}</div>
              {PLAN_TOMAS.map(t=>{ const o=stats.porToma[t]; const pct=o.total?Math.round(o.seguida/o.total*100):0; return(
                <div key={t} style={{marginBottom:9}}>
                  <div style={{display:'flex',justifyContent:'space-between',fontSize:11.5,marginBottom:3,fontFamily:"'DM Sans',sans-serif"}}><span style={{color:T.t2}}>{PLAN_TOMA_IC[t]} {TOMA_LBL[t]}</span><span style={{color:T.t1,fontWeight:800}}>{o.total?pct+'%':'—'}</span></div>
                  <div style={{height:8,borderRadius:5,background:'rgba(255,255,255,0.06)'}}><div style={{height:'100%',width:pct+'%',borderRadius:5,background:T.g1,transition:'width 0.6s'}}/></div>
                </div>);})}
            </div>
            {/* 3 · Reparto de estados */}
            <div style={{...cardSty,marginRight:12}}>
              <div style={{fontWeight:900,fontSize:13.5,color:T.t1,marginBottom:12,...TT}}>{EN?'Breakdown':'Reparto de estados'}</div>
              {PLAN_CUMPL.map(c=>{ const n=stats.porEstado[c.k]||0; const pct=stats.totalReg?Math.round(n/stats.totalReg*100):0; return(
                <div key={c.k} style={{marginBottom:9}}>
                  <div style={{display:'flex',justifyContent:'space-between',fontSize:11.5,marginBottom:3,fontFamily:"'DM Sans',sans-serif"}}><span style={{color:T.t2}}>{c.ic} {EN?c.en:c.es}</span><span style={{color:c.c,fontWeight:800}}>{n} · {pct}%</span></div>
                  <div style={{height:8,borderRadius:5,background:'rgba(255,255,255,0.06)'}}><div style={{height:'100%',width:pct+'%',borderRadius:5,background:c.c,transition:'width 0.6s'}}/></div>
                </div>);})}
            </div>
            {/* 4 · Tendencia semanal */}
            <div style={{...cardSty}}>
              <div style={{fontWeight:900,fontSize:13.5,color:T.t1,marginBottom:14,...TT}}>{EN?'Weekly trend':'Tendencia semanal'}</div>
              <div style={{display:'flex',alignItems:'flex-end',gap:10,height:130}}>
                {semanasArr.map(w=>{ const o=stats.semanas[w]; const pct=o.total?Math.round(o.seguida/o.total*100):0; return(
                  <div key={w} style={{flex:1,display:'flex',flexDirection:'column',alignItems:'center',gap:5}}>
                    <div style={{fontSize:10.5,color:T.t1,fontWeight:800,...TT}}>{pct}%</div>
                    <div style={{width:'100%',maxWidth:34,height:84,background:'rgba(255,255,255,0.05)',borderRadius:6,display:'flex',alignItems:'flex-end',overflow:'hidden'}}><div style={{width:'100%',height:Math.max(pct,2)+'%',background:pct>=80?T.g1:pct>=50?T.au1:T.red,borderRadius:6,transition:'height 0.6s'}}/></div>
                    <div style={{fontSize:9,color:T.t3,fontFamily:"'DM Sans',sans-serif"}}>{EN?'W':'S'}{w+1}</div>
                  </div>);})}
              </div>
            </div>
          </div>
          {/* Puntos del carrusel */}
          <div style={{display:'flex',justifyContent:'center',gap:6,padding:'10px 0 0'}}>
            {[0,1,2,3].map(i=>(<div key={i} style={{width:i===card?18:7,height:7,borderRadius:4,background:i===card?T.pur:'rgba(255,255,255,0.15)',transition:'all 0.3s'}}/>))}
          </div>
        </>)}
      </div>
    </div>
  );
}

// ─── Overlay de generación (estándar): bloquea la app mientras Railway cocina ──
// Pantalla completa con mensajes rotatorios para que el paciente NO navegue ni
// cierre hasta que su programación esté volcada (evita estados a medias).
const GEN_MSGS_ES=["🧮 Calculando tus calorías objetivo…","🥗 Eligiendo tus recetas…","📅 Cuadrando la semana…","🛒 Preparando tu lista de la compra…","✨ Últimos retoques…"];
const GEN_MSGS_EN=["🧮 Calculating your target calories…","🥗 Picking your recipes…","📅 Balancing your week…","🛒 Building your shopping list…","✨ Final touches…"];
function OverlayGenerando({lang}){
  const msgs=lang==='en'?GEN_MSGS_EN:GEN_MSGS_ES;
  const [i,setI]=React.useState(0);
  React.useEffect(()=>{ const id=setInterval(()=>setI(x=>(x+1)%msgs.length),2600); return ()=>clearInterval(id); },[msgs.length]);
  return(
    <div style={{position:"fixed",inset:0,background:"rgba(6,20,9,0.93)",zIndex:3000,
      display:"flex",flexDirection:"column",alignItems:"center",justifyContent:"center",padding:"32px"}}>
      <div style={{fontSize:64,animation:"tomaBob 1.4s ease-in-out infinite",marginBottom:18}}>👨‍🍳</div>
      <div style={{fontWeight:900,fontSize:19,color:T.wh,fontFamily:"'Nunito',sans-serif",marginBottom:10,textAlign:"center"}}>
        {lang==='en'?'Generating your plan…':'Generando tu programación…'}
      </div>
      <div style={{fontSize:14,color:T.g2,fontWeight:800,fontFamily:"'Nunito',sans-serif",minHeight:22,textAlign:"center",transition:"all 0.3s"}}>
        {msgs[i]}
      </div>
      <div style={{display:"flex",gap:7,margin:"18px 0 22px"}}>
        {msgs.map((_,j)=>(<span key={j} style={{width:8,height:8,borderRadius:4,background:j===i?T.g1:"rgba(255,255,255,0.18)",transition:"all 0.3s"}}/>))}
      </div>
      <div style={{fontSize:12,color:T.t3,fontFamily:"'DM Sans',sans-serif",textAlign:"center",lineHeight:1.6,maxWidth:280}}>
        {lang==='en'
          ?"Don't close the app — it usually takes under a minute ⏱️"
          :"No cierres la app: suele tardar menos de un minuto ⏱️"}
      </div>
    </div>
  );
}

function PlanTab({profile,lang,setProfile,savedRecipes,setSavedRecipes,showT,sfx,t,setTab,onMealRegistered}){
  const isPremium=profile?.plan==='premium';
  const isStandard=profile?.plan==='standard';
  const tieneAcceso=isPremium||isStandard;
  const gems=profile?.gems??0;
  const [planes,setPlanes]=React.useState([]);
  const [idx,setIdx]=React.useState(0);
  const [loading,setLoading]=React.useState(true);
  const [view,setView]=React.useState(null);
  const [config,setConfig]=React.useState(null);       // fila patient_config
  const [configView,setConfigView]=React.useState(false); // pantalla de edición de plan
  // ── Candado del plan estándar ──────────────────────────────────────────────
  // 1 programación por SEMANA DE CALENDARIO. El paciente estándar (7€/mes)
  // genera su plan y puede REGENERARLO GRATIS a partir del lunes siguiente.
  // No hay regeneración con gemas: si quiere variar un plato, cambia esa
  // receta concreta con gemas desde la comida del día.
  const tienePlan = Array.isArray(planes) && planes.length > 0;   // ¿ya tiene un plan generado?
  // ¿Ha definido su objetivo nutricional? El plan se ajusta a estas kcal, así
  // que es OBLIGATORIO calcularlo en la pestaña Objetivo antes de generar.
  // El objetivo puede estar en el perfil (profile.target_kcal) o, si el perfil
  // en memoria aún no se ha refrescado, en patient_config.kcal_objetivo (que la
  // calculadora también guarda). Comprobamos AMBOS para no volver a pedir el
  // objetivo a quien ya lo tiene fijado.
  const objKcal = Number(profile?.target_kcal);
  const cfgKcal = Number(config?.kcal_objetivo);
  const tieneObjetivo = (Number.isFinite(objKcal) && objKcal > 0) || (Number.isFinite(cfgKcal) && cfgKcal > 0);
  // Lunes (00:00, hora local) de la semana en que se generó el plan actual.
  const lunesDe = (ts) => {
    const d = new Date(ts);
    const dow = d.getDay();                 // 0=domingo … 6=sábado
    const offset = dow===0 ? 6 : dow-1;     // días desde el lunes
    const lunes = new Date(d.getFullYear(), d.getMonth(), d.getDate()-offset);
    return lunes.getTime();
  };
  const ultimaGenMs = (tienePlan && planes[0]?.fecha_gen) ? Date.parse(planes[0].fecha_gen) : null;
  // El plan está bloqueado mientras siga siendo la MISMA semana natural en que
  // se generó. Al llegar el lunes siguiente, se desbloquea gratis.
  const lunesActual = lunesDe(Date.now());
  const lunesDelPlan = (ultimaGenMs!==null && !isNaN(ultimaGenMs)) ? lunesDe(ultimaGenMs) : null;
  const planBloqueado = isStandard && tienePlan && lunesDelPlan!==null && lunesDelPlan >= lunesActual;
  // Días que faltan hasta el próximo lunes (para el mensaje)
  const proximoLunes = lunesActual + 7*24*60*60*1000;
  const diasDesbloqueo = planBloqueado ? Math.max(1, Math.ceil((proximoLunes - Date.now())/(24*60*60*1000))) : 0;
  const todayJS=new Date().getDay();
  const todayPlan=todayJS===0?7:todayJS;
  const [selDay,setSelDay]=React.useState(todayPlan);
  const [openToma,setOpenToma]=React.useState(null);
  const [tomaReceta,setTomaReceta]=React.useState(null);
  const [loadingToma,setLoadingToma]=React.useState(false);
  const [generando,setGenerando]=React.useState(false);

  // ── Registro de cumplimiento por comida (aditivo) ───────────────────────────
  // El paciente marca, por toma del día, qué hizo (seguida / menos / cambiada /
  // comí fuera / saltada) y deja una nota libre del día. Se persiste en
  // daily_logs (columnas meals_log jsonb, day_note text) por la MISMA vía de
  // upsert que ya usa el resto de la app. No toca diet/steps/sleep ni la lógica
  // de rachas, XP o calorías: es una capa de información para el nutricionista.
  const lunesSemana = React.useMemo(()=>{
    const d=new Date(); const dow=d.getDay(); const off=dow===0?6:dow-1;
    return new Date(d.getFullYear(),d.getMonth(),d.getDate()-off);
  },[]);
  const fechaDeDia = (n)=>{ const d=new Date(lunesSemana); d.setDate(d.getDate()+(n-1)); return d; };
  const selDateKey = toKey(fechaDeDia(selDay));
  const finDeHoy   = (()=>{ const d=new Date(); d.setHours(23,59,59,999); return d; })();
  const esFuturo   = fechaDeDia(selDay) > finDeHoy;             // no se registran días futuros
  // ── Semana vigente ──────────────────────────────────────────────────────────
  // Se identifica por la semana que el generador marca como actual
  // (patient_config.semana_actual, que se reescribe en CADA publicación), con la
  // fecha de publicación (fecha_gen) como respaldo y, en último término, la
  // primera de la lista. Tomarla por el nº de semana más alto fallaba si el
  // paciente reinicia el ciclo a la semana 1 tras la 12; y la fecha por sí sola
  // tampoco basta, porque al reusar un nº de semana el upsert ACTUALIZA la fila
  // y no refresca fecha_gen. Por eso la señal principal es semana_actual.
  // (Declarado ANTES de puedeRegistrar porque este depende de él.)
  const idxActual = React.useMemo(()=>{
    if(!Array.isArray(planes) || !planes.length) return 0;
    // Índice del plan MÁS RECIENTE por fecha_gen. Además de respaldo, es el
    // DETECTOR DE DESFASE: si el generador publicó una semana nueva pero no
    // reescribió semana_actual, este apunta a la semana buena.
    let iNew=-1, bestT=-Infinity;
    planes.forEach((p,i)=>{ const t=p.fecha_gen?Date.parse(p.fecha_gen):NaN; if(!isNaN(t)&&t>bestT){bestT=t;iNew=i;} });
    const sa = config?.semana_actual;
    if(sa!=null){
      const iCfg = planes.findIndex(p=>String(p.semana)===String(sa));
      if(iCfg>=0){
        // semana_actual es la señal principal… salvo que esté OBSOLETA: si existe
        // otro plan con fecha_gen ESTRICTAMENTE posterior, el generador ya publicó
        // una semana más nueva sin refrescar el config. Antes eso dejaba la semana
        // vieja como "vigente" y bloqueaba el registro de comidas (idx!==idxActual).
        // Nos quedamos con la realmente vigente (fecha_gen más reciente). No rompe
        // el reinicio de ciclo S12→S1: allí la semana nueva ES la de fecha_gen más
        // reciente, así que iNew===iCfg y no se toca nada.
        if(iNew>=0 && iNew!==iCfg){
          const tCfg = planes[iCfg].fecha_gen ? Date.parse(planes[iCfg].fecha_gen) : NaN;
          if(!isNaN(bestT) && (isNaN(tCfg) || bestT>tCfg)) return iNew;
        }
        return iCfg;
      }
    }
    return iNew>=0 ? iNew : 0;
  },[planes, config?.semana_actual]);
  // El registro de platos se ancla a la SEMANA VIGENTE (idxActual), no a la de
  // número más alto (idx===0). Con idx===0, un reinicio de ciclo (S12 → S1) o
  // una fila huérfana con nº alto dejaban el registro apuntando a un plan viejo:
  // el paciente monitorizaba los platos de una semana que no era.
  const puedeRegistrar = (idx===idxActual) && !esFuturo;        // solo la semana en curso
  const [regDia,setRegDia]   = React.useState({});              // { 'YYYY-MM-DD': {meals:{}, note:''} }
  const [notaTmp,setNotaTmp] = React.useState('');              // texto en edición de la nota del día
  const [notaOK,setNotaOK]   = React.useState(false);           // indicador "guardada ✓"

  // Carga inicial: semilla desde caché local + refresco remoto de la semana actual.
  React.useEffect(()=>{
    if(!profile?.id) return;
    const cache = lsGet(`gbh:logs:${profile.id}`, []);
    const seed={};
    (Array.isArray(cache)?cache:[]).forEach(l=>{
      if(l?.date && (l.meals || l.note)) seed[l.date]={meals:l.meals||{}, note:l.note||''};
    });
    setRegDia(seed);
    const lunesKey=toKey(lunesSemana);
    sbReq('GET',`daily_logs?profile_id=eq.${profile.id}&log_date=gte.${lunesKey}&select=log_date,meals_log,day_note`)
      .then(rows=>{
        if(!Array.isArray(rows)) return;
        setRegDia(prev=>{
          const next={...prev};
          rows.forEach(r=>{ const k=r.log_date; if(!k) return;
            next[k]={meals:r.meals_log||next[k]?.meals||{}, note:(r.day_note??next[k]?.note)||''}; });
          return next;
        });
      });
  },[profile?.id]); // eslint-disable-line react-hooks/exhaustive-deps

  // Al cambiar de día (o llegar datos remotos), refleja la nota de ese día en el textarea.
  React.useEffect(()=>{ setNotaTmp(regDia[selDateKey]?.note||''); setNotaOK(false); },[selDateKey, regDia[selDateKey]?.note]); // eslint-disable-line react-hooks/exhaustive-deps

  // Persiste un cambio del día: actualiza estado, caché local y upsert parcial a Supabase.
  // El merge se basa en la caché local (que escribimos de forma SÍNCRONA) para que
  // toques rápidos sobre varias comidas se acumulen sin pisarse.
  const persistDia = (dateKey,{toma,estado,note}) => {
    const key=`gbh:logs:${profile.id}`;
    const arr=lsGet(key,[]); const i=arr.findIndex(l=>l.date===dateKey);
    const cur = i>=0 ? arr[i] : {date:dateKey,diet:false,steps:false,hydration:false,sleep:false,sc:0,meals:{},note:''};
    let meals = {...(cur.meals||{})};
    if(toma){
      if(meals[toma]===estado) delete meals[toma];   // volver a tocar el mismo estado lo desmarca
      else meals[toma]=estado;
    }
    const nota = note!==undefined ? note : (cur.note||'');
    const entry={...cur,meals,note:nota};
    if(i>=0) arr[i]=entry; else arr.push(entry);
    try{ lsSet(key,arr); }catch{}
    setRegDia(prev=>({...prev,[dateKey]:{meals,note:nota}}));
    // upsert parcial: solo envía las columnas que cambian (no toca diet/steps/sleep/…)
    const body={profile_id:profile.id,log_date:dateKey};
    if(toma) body.meals_log=meals;
    if(note!==undefined) body.day_note=nota;
    sbReq('POST','daily_logs?on_conflict=profile_id,log_date',body);
    // Avisar a Inicio: actualiza los mini-botones por toma y, si con este registro
    // quedan todas las tomas del día registradas, completa la misión de dieta (racha).
    if(toma && typeof onMealRegistered==='function') onMealRegistered(dateKey, meals);
  };
  const setEstadoComida = (toma,estado)=>{ if(!puedeRegistrar) return; persistDia(selDateKey,{toma,estado}); sfx&&sfx('step'); };
  const guardarNotaDia  = ()=>{ if(!puedeRegistrar) return; if(notaTmp===(regDia[selDateKey]?.note||'')) return;
    persistDia(selDateKey,{note:notaTmp.trim()}); setNotaOK(true); setTimeout(()=>setNotaOK(false),1800); };

  // Recarga los planes desde Supabase (tras generar)
  const recargarPlanes=React.useCallback(()=>{
    if(!profile) return Promise.resolve();
    return sbReq('GET',`weekly_plans?profile_id=eq.${profile.id}&select=semana,plan_json,fecha_gen,pdf_url&order=semana.desc&limit=12`)
      .then(wp=>{setPlanes(wp||[]);return wp;});
  },[profile?.id]);
  // Llama al servidor Railway para generar la programación al instante
  async function generarProgramacion(opts={}){
    if(generando) return;
    if(!GBH_SERVER_URL){
      showT&&showT({icon:"⚙️",title:lang==='en'?'Not configured yet':'Aún no configurado',sub:lang==='en'?'The generation server is not set up.':'El servidor de generación no está configurado todavía.'});
      return;
    }
    // ── Sin objetivo nutricional no se genera (el plan se ajusta a esas kcal) ──
    if(isStandard && !tieneObjetivo){
      showT&&showT({icon:"🎯",title:lang==='en'?'Set your goal first':'Define tu objetivo primero',
        sub:lang==='en'?'Go to the Goal tab to calculate your daily calories.':'Ve a la pestaña Objetivo para calcular tus calorías diarias.'});
      setTab&&setTab('progreso');   // la pestaña Objetivo tiene id 'progreso'
      return;
    }

    // ── Candado semanal: 1 plan por semana natural. SIN gemas ──
    // Si está bloqueado (misma semana en que se generó), no se regenera:
    // el paciente espera al lunes (gratis) o cambia recetas sueltas con gemas.
    if(planBloqueado && tienePlan){
      showT&&showT({icon:"🔒",title:lang==='en'?'One plan per week':'Un plan por semana',
        sub:lang==='en'
          ? `Your new plan unlocks Monday (${diasDesbloqueo} day${diasDesbloqueo!==1?'s':''}). To vary a meal, swap that recipe with gems.`
          : `Tu nueva programación se desbloquea el lunes (${diasDesbloqueo} día${diasDesbloqueo!==1?'s':''}). Para variar una comida, cambia esa receta con gemas.`});
      return;
    }
    setGenerando(true);   // el OverlayGenerando bloqueante informa del progreso
    // Semana de la que partimos: si tras el intento hay una MÁS NUEVA en
    // Supabase, la generación funcionó aunque el fetch fallara/expirara.
    // Para detectar éxito tras regenerar: guardamos la fecha_gen previa de la
    // semana actual. Al regenerar, el servidor REEMPLAZA la misma semana con
    // una fecha_gen nueva (no crea una semana superior), así que comparar por
    // número de semana fallaba y reembolsaba un plan que SÍ se había generado.
    const fechaGenPrevia = (Array.isArray(planes)&&planes[0]?.fecha_gen) ? String(planes[0].fecha_gen) : null;
    const semanaPrevia   = (Array.isArray(planes)&&planes[0]?.semana!=null) ? planes[0].semana : -1;
    const planJsonPrevio = (Array.isArray(planes)&&planes[0]?.plan_json) ? JSON.stringify(planes[0].plan_json) : null;
    let exito=false;
    try{
      // Timeout duro: Railway (plan gratuito) puede tardar en "despertar".
      // Sin esto, si el servidor se cuelga la promesa no resuelve nunca y el
      // botón se queda en "Generando…" para siempre con las gemas ya cobradas.
      const ctrl=new AbortController();
      const tId=setTimeout(()=>ctrl.abort(), 75000); // 75 s
      let resp=null;
      try{
        resp=await fetch(GBH_SERVER_URL.replace(/\/$/,'')+'/generar',{
          method:'POST',
          headers:{'Content-Type':'application/json','X-GBH-Token':GBH_GEN_TOKEN},
          body:JSON.stringify({profile_id:profile.id}),
          signal:ctrl.signal,
        });
      }catch(fetchErr){
        // Abort o red caída: no lanzamos aún, comprobamos Supabase abajo.
        console.warn("[generar] fetch falló o expiró:", fetchErr?.name||fetchErr);
      }finally{ clearTimeout(tId); }

      if(resp && !resp.ok){
        const err=await resp.json().catch(()=>({}));
        throw new Error(err.detail||('HTTP '+resp.status));
      }

      // Dar margen a que Supabase refleje el plan y recargar.
      await new Promise(r=>setTimeout(r,1500));
      const recargados = await recargarPlanes();
      // VERIFICACIÓN REAL: ¿hay una semana nueva? Esto manda sobre el fetch:
      // si el servidor respondió pero la app perdió la respuesta, igualmente
      // detectamos el plan y NO cobramos de más ni dejamos colgado el botón.
      // Éxito si: (a) el servidor respondió OK, o (b) detectamos un plan nuevo
      // en Supabase — ya sea una semana superior (primera generación) o la
      // misma semana con una fecha_gen distinta (REGENERACIÓN).
      const top = Array.isArray(recargados) ? recargados[0] : null;
      const semanaSuperior = top?.semana!=null && top.semana>semanaPrevia;
      const fechaDistinta  = top?.fecha_gen!=null && String(top.fecha_gen)!==fechaGenPrevia;
      const planJsonDistinto = top?.plan_json!=null && JSON.stringify(top.plan_json)!==planJsonPrevio;
      // Cualquiera de las tres señales = se generó un plan nuevo (regeneración
      // incluida). El plan_json siempre cambia al regenerar (recetas nuevas).
      const planNuevo = semanaSuperior || fechaDistinta || planJsonDistinto;
      if((resp && resp.ok) || planNuevo){
        exito=true;
        setIdx(0);
        sfx&&sfx("recipe");
        showT&&showT({icon:"🎉",title:lang==='en'?'Plan ready!':'¡Programación lista!',sub:lang==='en'?'Your weekly plan is here':'Tu plan semanal ya está disponible'});
      }else{
        throw new Error(lang==='en'?'The server did not respond in time':'El servidor no respondió a tiempo');
      }
    }catch(e){
      showT&&showT({icon:"⚠️",title:lang==='en'?'Could not generate':'No se pudo generar',
        sub:(String(e.message||e).slice(0,70))+(lang==='en'?' · gems refunded':' · gemas devueltas')});
    }finally{
      setGenerando(false);
    }
  }
  React.useEffect(()=>{setView(null);setOpenToma(null);setTomaReceta(null);},[idx]);
  React.useEffect(()=>{setOpenToma(null);setTomaReceta(null);},[selDay]);
  React.useEffect(()=>{
    if(!profile) return;
    if(!tieneAcceso){setLoading(false);return;}
    Promise.all([
      sbReq('GET',`weekly_plans?profile_id=eq.${profile.id}&select=semana,plan_json,fecha_gen,pdf_url&order=semana.desc&limit=12`),
      sbReq('GET',`patient_config?profile_id=eq.${profile.id}&select=*&limit=1`),
    ]).then(([wp,pc])=>{
      setPlanes(wp||[]);
      setConfig(pc&&pc.length?pc[0]:null);
      setLoading(false);
    });
  },[profile?.id]);
  const plan=planes[idx];const planJ=plan?.plan_json;
  // ── Medicación/suplementación de HOY ─────────────────────────────────────────
  // Premium: viene del Excel vía plan_json.suplementacion (automatización).
  // Standard: la define el PROPIO paciente en su configuración de plan
  // (patient_config.suplementacion, máx. 3 recordatorios → máx. +15 💎/día).
  // Botones horizontales entre las tomas (colocados por hora). Al completarlos:
  // +5 gemas y desaparecen el resto del día. Solo seguimiento: no tocan la racha.
  // ⚠️ Este bloque DEBE ir después de la declaración de planJ y config (TDZ).
  const suplHoy = React.useMemo(()=>{
    const delPlan = normSupl(planJ);
    if(delPlan) return delPlan;
    if(isStandard){
      const arr = Array.isArray(config?.suplementacion) ? config.suplementacion.slice(0,3) : null;
      return normSupl({suplementacion:arr});
    }
    return null;
  },[planJ,config,isStandard]);
  const [suplHechos,setSuplHechos]=React.useState({});
  React.useEffect(()=>{
    if(!profile?.id) return;
    setSuplHechos(lsGet(suplHechosKey(profile.id,selDateKey),{}));
  },[profile?.id,selDateKey]);
  const marcarSupl=(item)=>{
    if(!profile?.id || suplHechos[item.nombre]) return;
    const nuevos={...suplHechos,[item.nombre]:true};
    setSuplHechos(nuevos);
    lsSet(suplHechosKey(profile.id,selDateKey),nuevos);
    persistDia(selDateKey,{toma:`supl|${item.nombre}`,estado:'hecho'});   // seguimiento en daily_logs
    const newGems=(profile.gems||0)+5;
    const updP={...profile,gems:newGems};
    setProfile(updP); lsSet(`gbh:p:${profile.id}`,updP);
    sbReq("PATCH",`profiles?id=eq.${profile.id}`,{gems:newGems});
    sfx&&sfx("missionDone");
    showT&&showT({icon:SUPL_IC[item.tipo]||'💊',
      title:lang==='en'?'Done! +5 💎':'¡Completado! +5 💎',sub:item.nombre});
  };
  // ── Media calórica de la semana (mismo método que la automatización: media
  //    de los totales diarios de kcal, cada día = suma de las kcal ya escaladas
  //    de sus tomas). Da al paciente la seguridad de que, aunque cada comida
  //    varíe, el promedio de la semana es preciso. ──────────────────────────
  const mediaKcalSem = React.useMemo(()=>{
    if(!planJ) return null;
    const totales=[];
    for(let d=1; d<=7; d++){
      let tot=0, hay=false;
      for(const tm of PLAN_TOMAS){
        const m=planJ?.[tm]?.[String(d)];
        const k=m?(parseFloat(m.Calorias_Totales)||0):0;
        if(k>0){ tot+=k; hay=true; }
      }
      if(hay) totales.push(tot);
    }
    if(!totales.length) return null;
    return Math.round(totales.reduce((a,b)=>a+b,0)/totales.length);
  },[planJ]);
  // ── Lista de la compra interactiva (FIJA) ───────────────────────────────────
  // Es una INSTANTÁNEA de la programación original de la semana, tomada la
  // primera vez que el plan llega al dispositivo y guardada en localStorage.
  // Deliberadamente NO se actualiza cuando el paciente cambia recetas con gemas:
  // probar varias opciones hasta dar con la buena acumularía ingredientes de
  // recetas descartadas. Para comprar una receta concreta (cambiada o del
  // recetario) está el botón 🛒 Comprar de cada receta (MiniListaCompra).
  const listaSnapKey=`gbh:listasnap5:${profile?.id}:${plan?.semana??"x"}`;
  const [listaSnap,setListaSnap]=React.useState(null);
  React.useEffect(()=>{
    if(!planJ){ setListaSnap(null); return; }
    const s=lsGet(listaSnapKey,null);
    if(Array.isArray(s)&&s.length){ setListaSnap(s); return; }
    const items=agregarListaCompra(planJ);
    if(items.length) lsSet(listaSnapKey,items);
    setListaSnap(items);
  // eslint-disable-next-line react-hooks/exhaustive-deps
  },[listaSnapKey, planJ?1:0]);
  const listaItems = listaSnap||[];
  // Formato del badge: cada fila puede combinar varias expresiones del mismo
  // ingrediente entre recetas → "120 g + 1 tarrina". Despensa → compra realista.
  const fmtParte=(p)=>{
    if(p.tipo==="desp") return p.compra||"";
    if(p.tipo==="veces") return p.veces>1?`×${p.veces}`:"";
    if(p.tipo==="cont"){ const n=Math.max(1,Math.ceil(p.cant)); return `${n} ${p.uni}${n>1?"s":""}`; }
    if(p.tipo==="ud"){ const n=Math.max(1,Math.ceil(p.cant)); return `×${n}`; }
    if(p.tipo==="med"){ const n=Math.round(p.cant*10)/10; return `${String(n).replace(".",",")} ${p.uni}`; }
    let c=p.cant, u=p.uni;
    if(u==="g"&&c>=1000){ c=c/1000; u="kg"; }
    if(u==="ml"&&c>=1000){ c=c/1000; u="l"; }
    const num=(Math.round(c*100)/100).toString().replace(".",",");
    return `${num} ${u}`;
  };
  const fmtCant=(it)=>it.entry?_fmtCompra(it.entry,it.c||{}):(it.partes||[]).map(fmtParte).filter(Boolean).join(" + ");
  const listaLsKey=`gbh:listacompra3:${profile?.id}:${plan?.semana??"x"}`;
  const [listaChecks,setListaChecks]=React.useState({});
  const [listaConfirm,setListaConfirm]=React.useState(false);   // doble tap en Regenerar
  const [miniCompra,setMiniCompra]=React.useState(null);        // popup 🛒 por receta (vista diaria)
  React.useEffect(()=>{ setListaChecks(lsGet(listaLsKey,{})); setListaConfirm(false); },[listaLsKey]);
  const toggleListaCheck=(k)=>{
    sfx&&sfx("tap");
    setListaChecks(c=>{ const n={...c}; if(n[k])delete n[k]; else n[k]=true; lsSet(listaLsKey,n); return n; });
  };
  const regenerarLista=()=>{
    if(!listaConfirm){ setListaConfirm(true); return; }
    sfx&&sfx("missionDone");
    setListaChecks({}); lsSet(listaLsKey,{}); setListaConfirm(false);
    showT&&showT({icon:"🛒",title:lang==='en'?'List reset!':'¡Lista regenerada!',sub:lang==='en'?'Ready for a new shopping trip':'Lista limpia para volver a hacer la compra'});
  };
  // ── Distribución de macros del día seleccionado (Atwater 4/4/9 sobre la suma
  //    de P/H/G de todas las tomas del día). Alimenta el gráfico de sectores. ─
  const macrosDia = React.useMemo(()=>{
    if(!planJ) return null;
    let p=0,h=0,g=0;
    for(const tm of PLAN_TOMAS){
      const m=planJ?.[tm]?.[String(selDay)];
      if(!m) continue;
      p+=parseFloat(m.Proteinas_g)||0;
      h+=parseFloat(m.Hidratos_g)||0;
      g+=parseFloat(m.Grasas_g)||0;
    }
    const kp=p*4, kh=h*4, kg=g*9, tot=kp+kh+kg;
    if(tot<=0) return null;
    return { p:Math.round(p), h:Math.round(h), g:Math.round(g),
             fP:kp/tot, fH:kh/tot, fG:kg/tot,
             pctP:Math.round(kp/tot*100), pctH:Math.round(kh/tot*100), pctG:Math.round(kg/tot*100) };
  },[planJ,selDay]);
  // ── Semana vigente: idxActual está declarado más arriba (antes de
  // puedeRegistrar, que depende de él). Aquí solo queda el posicionamiento. ──
  // Al abrir el Plan (o tras (re)generar) posiciona en la semana vigente, no en
  // la última que estuviera mirando el paciente. No interfiere con la navegación
  // manual dentro de la sesión: idxActual solo cambia si cambian los planes o la
  // semana_actual, no al pulsar las flechas.
  React.useEffect(()=>{ setIdx(idxActual); },[idxActual]);
  // ¿El paciente estándar ya configuró su plan?
  const configCompleta = config?.config_completa === true;
  // Caché de todas las recetas (se carga una vez) para buscar por nombre sin
  // depender de acentos/codificación en la URL de PostgREST.
  const recetasCacheRef = React.useRef(null);
  const normNombre = (s)=>(s||'').normalize('NFD').replace(/[\u0300-\u036f]/g,'').toLowerCase().replace(/\s+/g,' ').trim();

  const RECIPES_CACHE_KEY = 'gbh:recipes_cache_v2';
  const RECIPES_CACHE_TTL = 24*60*60*1000; // 24 h
  async function cargarRecetasCache(){
    if(recetasCacheRef.current) return recetasCacheRef.current;
    try{
      const cached = JSON.parse(localStorage.getItem(RECIPES_CACHE_KEY)||'null');
      if(cached?.ts && Date.now()-cached.ts < RECIPES_CACHE_TTL && cached.mapa && Object.keys(cached.mapa).length){
        recetasCacheRef.current = cached.mapa;
        return cached.mapa;
      }
    }catch{}
    const todas = await sbReq('GET','recipes?select=*&limit=1000');
    const mapa = {};
    (todas||[]).forEach(r=>{
      const nom = r.nombre||r.nombre_receta||r.Nombre_Receta||'';
      if(nom) mapa[normNombre(nom)] = r;
    });
    if(Object.keys(mapa).length){
      recetasCacheRef.current = mapa;
      try{ localStorage.setItem(RECIPES_CACHE_KEY, JSON.stringify({ts:Date.now(), mapa})); }catch{}
    }
    return mapa;
  }

  async function abrirToma(toma){
    const meal=planJ?.[toma]?.[String(selDay)];
    if(!meal?.Nombre_Receta) return;
    setOpenToma(toma);setTomaReceta(null);setLoadingToma(true);

    // El plan generado YA trae la receta escalada a la ración del paciente:
    // kcal, macros e ingredientes con las cantidades que le corresponden.
    // El recetario de Supabase solo se usa como apoyo (instrucciones) o como
    // fallback para planes antiguos sin datos embebidos.
    const fRac = parseFloat(meal.racion_factor)||1;
    const racTxt = meal.racion_texto || (Math.abs(fRac-1)>=0.05 ? racionTextoJS(fRac, lang) : '');

    let r = null;
    const necesitaRecetario = !meal.Ingredientes || !meal.Instrucciones;
    if(necesitaRecetario){
      const mapa = await cargarRecetasCache();
      const clave = normNombre(meal.Nombre_Receta);
      r = mapa[clave];
      if(!r){
        const frag = normNombre(meal.Nombre_Receta).split(' ').slice(0,3).join(' ');
        const k = Object.keys(mapa).find(key=>key.includes(frag) || frag.includes(key));
        if(k) r = mapa[k];
      }
    }

    if(meal.Ingredientes){
      // ── Plan nuevo: todo embebido y ya escalado ──
      setTomaReceta({
        nombre:       meal.Nombre_Receta,
        tipo:         meal.Tipo||'',
        calorias:     Math.round(parseFloat(meal.Calorias_Totales)||0),
        proteinas_g:  Math.round(parseFloat(meal.Proteinas_g)||0),
        hidratos_g:   Math.round(parseFloat(meal.Hidratos_g)||0),
        grasas_g:     Math.round(parseFloat(meal.Grasas_g)||0),
        ingredientes: meal.Ingredientes,
        instrucciones:meal.Instrucciones||r?.instrucciones||(lang==='en'?'No preparation steps available.':'Sin pasos de preparación disponibles.'),
        racion_texto: racTxt,
        raciones:     parseInt(meal.raciones||1)||1,
        kcal_objetivo:Math.round(parseFloat(meal.Calorias_Totales)||0),
        slug:         r?.slug||null,  publica: !!(r?.publica),   // escaparate público
      });
    } else if(r){
      // ── Plan antiguo: receta base del recetario, escalada en cliente ──
      setTomaReceta({
        nombre:       r.nombre||r.nombre_receta||meal.Nombre_Receta,
        tipo:         r.tipo||meal.Tipo||'',
        calorias:     Math.round((parseFloat(r.calorias||r.calorias_totales||meal.Calorias_Totales)||0)*fRac),
        proteinas_g:  Math.round((parseFloat(r.proteinas_g||meal.Proteinas_g)||0)*fRac),
        hidratos_g:   Math.round((parseFloat(r.hidratos_g||meal.Hidratos_g)||0)*fRac),
        grasas_g:     Math.round((parseFloat(r.grasas_g||meal.Grasas_g)||0)*fRac),
        ingredientes: escalarIngredientesJS(r.ingredientes||'', fRac),
        instrucciones:r.instrucciones||(lang==='en'?'No preparation steps available.':'Sin pasos de preparación disponibles.'),
        racion_texto: racTxt,
        raciones:     parseInt(r.raciones||1)||1,
        kcal_objetivo:Math.round((parseFloat(r.calorias||r.calorias_totales||meal.Calorias_Totales)||0)*fRac),
        slug:         r.slug||null,   publica: !!r.publica,      // escaparate público
      });
    } else {
      // No se encontró en el recetario: mostrar al menos los macros del plan
      setTomaReceta({
        nombre:meal.Nombre_Receta,tipo:meal.Tipo||'',
        calorias:Math.round(parseFloat(meal.Calorias_Totales)||0),
        proteinas_g:Math.round(parseFloat(meal.Proteinas_g)||0),
        hidratos_g:Math.round(parseFloat(meal.Hidratos_g)||0),
        grasas_g:Math.round(parseFloat(meal.Grasas_g)||0),
        ingredientes:'',
        instrucciones:lang==='en'?'No recipe details found.':'Detalle de receta no disponible.',
        racion_texto: racTxt,
        kcal_objetivo:Math.round(parseFloat(meal.Calorias_Totales)||0),
      });
    }
    setLoadingToma(false);
  }

  // ── Cambiar la receta por otra de composición similar (10 💎) ──────────────
  async function cambiarRecetaToma(){
    if(!tomaReceta||!profile) return;
    if(gems < 10){
      sfx&&sfx("error");
      showT&&showT({icon:"💎",title:lang==='en'?'Not enough gems':'Sin gemas suficientes',sub:lang==='en'?'You need 10 💎 to change the recipe':'Necesitas 10 💎 para cambiar la receta'});
      return;
    }
    const mapa = await cargarRecetasCache();
    const recetas = Object.values(mapa);
    const tipoActual = tomaReceta.tipo;
    const kcalActual = tomaReceta.calorias||0;
    const nombreActual = normNombre(tomaReceta.nombre);
    // ── Franja de comida (Categoria) que DEBE respetarse ──────────────────────
    // La toma que se está cambiando determina la franja: desayuno/almuerzo/
    // merienda NO puede sustituirse por un plato de comida/cena (p. ej. unas
    // tortitas no deben convertirse en una ensalada de arroz). El recetario solo
    // tiene dos categorías: 'Desayuno/Almuerzo/Merienda' y 'Comida/Cena'.
    const catBucket = (r)=>{
      const c = String(r.categoria||r.Categoria||r['categoría']||'').toLowerCase();
      if(/comida|cena/.test(c)) return 'cd';
      if(/desayuno|almuerzo|merienda/.test(c)) return 'dam';
      return null;
    };
    const hayCategorias = recetas.some(r=>catBucket(r)!==null);   // red de seguridad si faltara el dato
    const bucketObj = (openToma==='Comida'||openToma==='Cena') ? 'cd' : 'dam';
    const nomDe    = (r)=>normNombre(r.nombre||r.nombre_receta||'');
    const kcalDe   = (r)=>parseFloat(r.calorias||r.calorias_totales)||0;
    const okTipo   = (r)=>(r.tipo||'')===tipoActual;
    const okFranja = (r)=> !hayCategorias || catBucket(r)===bucketObj; // franja: restricción DURA (nunca se relaja)
    const okOtra   = (r)=>nomDe(r)!==nombreActual;
    const okKcal   = (r)=>{const k=kcalDe(r);return kcalActual===0||(k>=kcalActual*0.8&&k<=kcalActual*1.2);};
    // SEGURIDAD: alimentos rechazados/alergias del paciente (notas del perfil).
    // Filtro DURO en TODOS los niveles de relajación — nunca se sirve un rechazado.
    const rechPref = interpretarRechazados(profile?.notas);
    const okRech   = (r)=>!recetaRechazadaJS(r, rechPref);
    // Prioridad de selección. La FRANJA se mantiene en los cuatro niveles; el
    // tipo (carne/pescado/…) se prioriza y solo se relaja —siempre dentro de la
    // misma franja— si no hay ninguna alternativa del mismo tipo.
    //   1) mismo tipo + misma franja + kcal parecidas (±20%)
    //   2) mismo tipo + misma franja
    //   3) misma franja + kcal parecidas
    //   4) misma franja
    const pools = [
      recetas.filter(r=>okRech(r)&&okTipo(r)&&okFranja(r)&&okOtra(r)&&okKcal(r)),
      recetas.filter(r=>okRech(r)&&okTipo(r)&&okFranja(r)&&okOtra(r)),
      recetas.filter(r=>okRech(r)&&okFranja(r)&&okOtra(r)&&okKcal(r)),
      recetas.filter(r=>okRech(r)&&okFranja(r)&&okOtra(r)),
    ];
    const pool = pools.find(p=>p.length) || [];
    if(!pool.length){
      showT&&showT({icon:"🚫",title:lang==='en'?'No alternative':'Sin alternativa',sub:lang==='en'?'No similar recipe available':'No hay receta similar disponible'});
      return;
    }
    const elegida = pool[Math.floor(Math.random()*pool.length)];
    // Descontar gemas
    const newGems = gems - 10;
    const updP = {...profile, gems:newGems};
    setProfile(updP); lsSet(`gbh:p:${profile.id}`, updP);
    sbReq("PATCH",`profiles?id=eq.${profile.id}`,{gems:newGems});
    sfx&&sfx("recipe");
    // ── Escalar la nueva receta a las kcal de la toma (objetivo = kcal de la
    //    receta actual, que ya venía ajustada por el generador) ──
    const kcalObj = tomaReceta.kcal_objetivo || kcalActual || 0;
    const kcalBase = parseFloat(elegida.calorias||elegida.calorias_totales)||0;
    let f = 1;
    if(kcalObj>0 && kcalBase>0){
      f = Math.max(0.5, Math.min(2, kcalObj/kcalBase));
      f = Math.round(f*20)/20; // pasos de 0,05
      if(Math.abs(f-1)<0.05) f = 1;
    }
    setTomaReceta({
      nombre:       elegida.nombre||elegida.nombre_receta||'',
      tipo:         elegida.tipo||tipoActual,
      calorias:     Math.round(kcalBase*f),
      proteinas_g:  Math.round((parseFloat(elegida.proteinas_g)||0)*f),
      hidratos_g:   Math.round((parseFloat(elegida.hidratos_g)||0)*f),
      grasas_g:     Math.round((parseFloat(elegida.grasas_g)||0)*f),
      ingredientes: escalarIngredientesJS(elegida.ingredientes||'', f),
      instrucciones:elegida.instrucciones||(lang==='en'?'No preparation steps available.':'Sin pasos de preparación disponibles.'),
      racion_texto: f!==1 ? racionTextoJS(f, lang) : '',
      raciones:     parseInt(elegida.raciones||1)||1,
      kcal_objetivo:kcalObj,
    });
    showT&&showT({icon:"🍽️",title:lang==='en'?'New recipe!':'¡Nueva receta!',sub:'-10 💎'});

    // ── Persistir el cambio en weekly_plans: sin esto, el cambio de 10 💎
    //    se pierde al cerrar la app (solo vivía en el estado de React) ──
    if(plan && openToma && selDay){
      try{
        const nuevoJson = JSON.parse(JSON.stringify(planJ||{}));
        if(!nuevoJson[openToma]) nuevoJson[openToma]={};
        nuevoJson[openToma][String(selDay)] = {
          Nombre_Receta: elegida.nombre||elegida.nombre_receta||'',
          Tipo:          elegida.tipo||tipoActual,
          Calorias_Totales: Math.round(kcalBase*f),
          Proteinas_g:   Math.round((parseFloat(elegida.proteinas_g)||0)*f),
          Hidratos_g:    Math.round((parseFloat(elegida.hidratos_g)||0)*f),
          Grasas_g:      Math.round((parseFloat(elegida.grasas_g)||0)*f),
          Ingredientes:  escalarIngredientesJS(elegida.ingredientes||'', f),
          Instrucciones: elegida.instrucciones||'',
          raciones:      parseInt(elegida.raciones||1)||1,
          ...(f!==1?{racion_factor:f, racion_texto:racionTextoJS(f,lang)}:{}),
        };
        setPlanes(ps=>ps.map((p,i)=>i===idx?{...p,plan_json:nuevoJson}:p));
        sbReq("PATCH",
          `weekly_plans?profile_id=eq.${profile.id}&semana=eq.${plan.semana}`,
          {plan_json:nuevoJson});
      }catch(e){ console.warn("[cambiar-receta] no se pudo persistir:", e); }
    }
  }

  // ── Guardar la receta en el recetario personal (20 💎) ─────────────────────
  const recetaYaGuardada = tomaReceta && (savedRecipes||[]).some(r=>normNombre(r.nombre)===normNombre(tomaReceta?.nombre));
  async function guardarRecetaToma(){
    if(!tomaReceta||!profile) return;
    if(recetaYaGuardada) return;
    if(gems < 20){
      sfx&&sfx("error");
      showT&&showT({icon:"💎",title:lang==='en'?'Not enough gems':'Sin gemas suficientes',sub:lang==='en'?'You need 20 💎 to save a recipe':'Necesitas 20 💎 para guardar una receta'});
      return;
    }
    const newGems = gems - 20;
    const updP = {...profile, gems:newGems};
    setProfile(updP); lsSet(`gbh:p:${profile.id}`, updP);
    sbReq("PATCH",`profiles?id=eq.${profile.id}`,{gems:newGems});
    const entry = {
      profile_id: profile.id,
      recipe_id:  'plan_'+normNombre(tomaReceta.nombre).replace(/\s+/g,'_'),
      nombre:        tomaReceta.nombre,
      tipo:          tomaReceta.tipo,
      calorias:      tomaReceta.calorias,
      proteinas_g:   tomaReceta.proteinas_g,
      hidratos_g:    tomaReceta.hidratos_g,
      grasas_g:      tomaReceta.grasas_g,
      ingredientes:  tomaReceta.ingredientes,
      instrucciones: tomaReceta.instrucciones,
      raciones:      tomaReceta.raciones||1,
      saved_at: new Date().toISOString(),
    };
    const newSaved = [entry, ...(savedRecipes||[])];
    setSavedRecipes&&setSavedRecipes(newSaved);
    lsSet(`gbh:saved_recipes:${profile.id}`, newSaved);
    sbReq("POST","saved_recipes",entry);
    sfx&&sfx("recipe");
    showT&&showT({icon:"📖",title:lang==='en'?'Saved to your book!':'¡Guardada en tu recetario!',sub:tomaReceta.nombre});
  }

  if(!tieneAcceso){
    const waMsgPlan = encodeURIComponent(lang==='en'
      ? `Hi! I'm ${profile?.name||''} and I'd like to upgrade my GBH plan to get my weekly meal plan 🥗`
      : `¡Hola! Soy ${profile?.name||''} y me gustaría mejorar mi plan GBH para tener mi programación semanal 🥗`);
    return(
    <div style={{padding:'36px 20px 32px',textAlign:'center',display:'flex',flexDirection:'column',alignItems:'center',gap:14}}>
      <div style={{fontSize:52}}>🥗</div>
      <div style={{fontSize:19,fontWeight:900,color:T.t1,lineHeight:1.3,fontFamily:"'Nunito',sans-serif"}}>
        {lang==='en'?'Your weekly meal plan':'Tu programación semanal'}
      </div>
      <div style={{fontSize:13.5,color:T.t2,lineHeight:1.65,maxWidth:300,fontFamily:"'DM Sans',sans-serif"}}>
        {lang==='en'
          ?'The weekly plan is exclusive to Standard and Premium accounts. Upgrade and get your personalized meal plan, recipes and shopping list.'
          :'La planificación es exclusiva de las cuentas Estándar y Premium. Mejora tu plan y tendrás tu programación personalizada con recetas y lista de la compra.'}
      </div>

      {/* Tarifas: Estándar → pago directo Stripe · Premium → WhatsApp */}
      <div style={{display:'flex',flexDirection:'column',gap:10,width:'100%',maxWidth:330,marginTop:4}}>
        <button onClick={()=>{sfx&&sfx("tap");abrirCheckoutStripe(profile?.id);}}
          style={{background:'rgba(88,204,2,0.08)',border:'2px solid '+T.bG,borderRadius:18,padding:'14px 16px',textAlign:'left',display:'flex',alignItems:'center',gap:12,cursor:'pointer',width:'100%',boxShadow:'0 3px 0 rgba(0,0,0,0.25)'}}>
          <div style={{fontSize:28,flexShrink:0}}>📅</div>
          <div style={{flex:1,minWidth:0}}>
            <div style={{fontSize:14,fontWeight:900,color:T.g1,fontFamily:"'Nunito',sans-serif"}}>
              {lang==='en'?'Standard · 7€/month':'Estándar · 7€/mes'}
            </div>
            <div style={{fontSize:11,color:T.t2,fontFamily:"'DM Sans',sans-serif",lineHeight:1.45,marginTop:2}}>
              {lang==='en'
                ?'Weekly plan you configure yourself, full recipe book and app'
                :'Programación semanal a tu medida, recetario completo y app'}
            </div>
            <div style={{fontSize:10.5,fontWeight:800,color:T.g1,fontFamily:"'DM Sans',sans-serif",marginTop:4}}>
              {lang==='en'?'Subscribe now · instant access →':'Suscríbete ahora · acceso al momento →'}
            </div>
          </div>
          <div style={{color:T.g1,fontSize:20,flexShrink:0}}>›</div>
        </button>
        <a href={`https://wa.me/${GBH_WHATSAPP}?text=${waMsgPlan}`} target="_blank" rel="noopener noreferrer" onClick={()=>sfx&&sfx("tap")}
          style={{background:'rgba(255,200,0,0.07)',border:'2px solid rgba(255,200,0,0.35)',borderRadius:18,padding:'14px 16px',textAlign:'left',display:'flex',alignItems:'center',gap:12,cursor:'pointer',textDecoration:'none',boxShadow:'0 3px 0 rgba(0,0,0,0.25)'}}>
          <div style={{fontSize:28,flexShrink:0}}>👑</div>
          <div style={{flex:1,minWidth:0}}>
            <div style={{fontSize:14,fontWeight:900,color:T.au1,fontFamily:"'Nunito',sans-serif"}}>
              Premium
            </div>
            <div style={{fontSize:11,color:T.t2,fontFamily:"'DM Sans',sans-serif",lineHeight:1.45,marginTop:2}}>
              {lang==='en'
                ?'Personal follow-up with your nutritionist, plan made for you and direct contact'
                :'Seguimiento personal con tu nutricionista, plan hecho para ti y contacto directo'}
            </div>
            <div style={{fontSize:10.5,fontWeight:800,color:T.au1,fontFamily:"'DM Sans',sans-serif",marginTop:4}}>
              {lang==='en'?'Chat with me on WhatsApp 💬':'Habla conmigo por WhatsApp 💬'}
            </div>
          </div>
          <div style={{color:T.au1,fontSize:20,flexShrink:0}}>›</div>
        </a>
      </div>

      <div style={{fontSize:10.5,color:T.t3,fontFamily:"'DM Sans',sans-serif",marginTop:2}}>
        {lang==='en'?'We reply the same day · @gbhnutricion':'Te respondemos en el día · @gbhnutricion'}
      </div>
    </div>
  );}
  if(loading) return <div style={{padding:32,textAlign:'center',fontSize:13,color:T.t2}}>{lang==='en'?'Loading…':'Cargando…'}</div>;

  // ── GATE: sin objetivo nutricional no se puede diseñar el plan ──────────────
  // El plan se ajusta al objetivo calórico (peso inicial, peso meta, actividad,
  // altura, edad → kcal/día). Si el paciente estándar aún no lo ha calculado en
  // la pestaña Objetivo, le pedimos hacerlo primero, con un botón que le lleva.
  if(isStandard && !tieneObjetivo && !tienePlan) {
    return (
      <div style={{padding:'52px 24px',textAlign:'center',display:'flex',flexDirection:'column',alignItems:'center'}}>
        <div style={{fontSize:60,marginBottom:18}}>🎯</div>
        <div style={{fontSize:20,fontWeight:900,color:T.t1,fontFamily:"'Nunito',sans-serif",marginBottom:10,lineHeight:1.3}}>
          {lang==='en'?'Hey, hold on! 🐏':'¡Eh, espera! 🐏'}
        </div>
        <div style={{fontSize:14.5,color:T.t2,fontFamily:"'DM Sans',sans-serif",lineHeight:1.6,maxWidth:300,marginBottom:28}}>
          {lang==='en'
            ? 'Set your goal first and I\'ll cook up your plan 👨‍🍳'
            : 'Primero ponte un objetivo y te preparo el plan 👨‍🍳'}
        </div>
        <button onClick={()=>setTab&&setTab('progreso')}
          style={{background:'linear-gradient(135deg,'+T.g1+','+T.g2+')',color:'#fff',fontWeight:900,fontSize:16,
            borderRadius:18,padding:'16px 34px',border:'none',cursor:'pointer',boxShadow:'0 5px 0 '+T.g3,
            fontFamily:"'Nunito',sans-serif",display:'flex',alignItems:'center',justifyContent:'center',gap:10}}>
          <span style={{fontSize:20}}>🎯</span>
          {lang==='en'?'Set my goal':'Ir a mi objetivo'}
        </button>
      </div>
    );
  }

  // ── Pantalla de configuración del plan (paciente estándar) ──────────────────
  if(configView || (isStandard && !configCompleta)) {
    return (<>
      {generando&&<OverlayGenerando lang={lang}/>}
      <PlanConfig profile={profile} lang={lang} config={config} setConfig={setConfig}
             sfx={sfx} showT={showT}
             onClose={()=>setConfigView(false)}
             onGenerar={()=>generarProgramacion()}
             primeraVez={isStandard && !configCompleta}/>
    </>);
  }

  if(!planes.length) return(
    <div style={{paddingBottom:16}}>
      {generando&&<OverlayGenerando lang={lang}/>}
      <div style={{padding:'24px 16px 8px',textAlign:'center'}}>
        <div style={{fontSize:40,marginBottom:10}}>📆</div>
        <div style={{fontSize:16,fontWeight:900,color:T.t1,marginBottom:8}}>
          {lang==='en'?'Your plan isn\'t ready yet':'Tu programación todavía no está lista'}
        </div>
        <div style={{fontSize:13,color:T.t2,lineHeight:1.7,fontFamily:"'DM Sans',sans-serif",marginBottom:24}}>
          {lang==='en'?'Check back soon for updates!':'¡Espera para nuevas actualizaciones!'}
        </div>
      </div>
      {/* Botones visibles pero bloqueados */}
      <div style={{padding:'0 16px',display:'flex',flexDirection:'column',gap:12}}>
        {[
          {icon:'📅',label:lang==='en'?'Plan & Recipes':'Plan y recetas',sub:lang==='en'?'Your week at a glance, recipes and progress (PDF)':'Tu semana de un vistazo, recetas y tu progreso (PDF)'},
          {icon:'🍽️',label:lang==='en'?'Daily Meals':'Platos diarios',sub:lang==='en'?'Today\'s meals with recipe details':'Tus platos de hoy con receta e ingredientes'},
          {icon:'🛒',label:lang==='en'?'Shopping List':'Lista de la compra',sub:lang==='en'?'Tick off ingredients as you shop':'Marca los ingredientes mientras compras'},
        ].map(({icon,label,sub})=>(
          <div key={label} style={{background:'rgba(255,255,255,0.04)',border:'2px solid rgba(255,255,255,0.08)',
                  borderRadius:20,padding:'20px 20px',display:'flex',alignItems:'center',gap:16,opacity:0.45}}>
            <div style={{fontSize:40,flexShrink:0}}>{icon}</div>
            <div style={{flex:1}}>
              <div style={{fontWeight:900,fontSize:16,color:T.t1,marginBottom:4,fontFamily:"'Nunito',sans-serif"}}>{label}</div>
              <div style={{fontSize:12,color:T.t2,fontFamily:"'DM Sans',sans-serif",lineHeight:1.5}}>{sub}</div>
            </div>
            <div style={{color:'rgba(255,255,255,0.2)',fontSize:20,flexShrink:0}}>🔒</div>
          </div>
        ))}
        {/* Botón GENERAR (solo estándar que ya configuró su plan) */}
        {isStandard&&configCompleta&&(
          <button onClick={generarProgramacion} disabled={generando}
            style={{background:generando?'rgba(255,255,255,0.08)':'linear-gradient(135deg,'+T.g1+','+T.g2+')',
                    color:generando?T.t3:'#fff',fontWeight:900,fontSize:16,borderRadius:20,
                    padding:'18px 24px',border:'none',cursor:generando?'default':'pointer',
                    boxShadow:generando?'none':'0 5px 0 '+T.g3,fontFamily:"'Nunito',sans-serif",
                    display:'flex',alignItems:'center',justifyContent:'center',gap:10,marginTop:4}}>
            <span style={{fontSize:22}}>{generando?'⏳':'✨'}</span>
            {generando?(lang==='en'?'Generating…':'Generando…'):(lang==='en'?'Generate my plan':'Generar mi programación')}
          </button>
        )}
        {isStandard&&(
          <button onClick={()=>setConfigView(true)} style={{background:'rgba(255,255,255,0.04)',border:'1.5px solid rgba(255,255,255,0.1)',borderRadius:16,padding:'14px 16px',textAlign:'left',cursor:'pointer',display:'flex',alignItems:'center',gap:14,marginTop:4}}>
            <div style={{fontSize:26,flexShrink:0}}>⚙️</div>
            <div style={{flex:1}}><div style={{fontWeight:800,fontSize:14,color:T.t2,fontFamily:"'Nunito',sans-serif"}}>{lang==='en'?'Edit my plan':'Editar mi plan'}</div><div style={{fontSize:11,color:T.t3,fontFamily:"'DM Sans',sans-serif"}}>{lang==='en'?'Diet type and calorie distribution':'Tipo de alimentación y distribución calórica'}</div></div>
            <div style={{color:T.t3,fontSize:16,flexShrink:0}}>›</div>
          </button>
        )}
      </div>
    </div>
  );
  const fechaStr=plan.fecha_gen?new Date(plan.fecha_gen).toLocaleDateString(lang==='en'?'en-GB':'es-ES',{day:'numeric',month:'short'}):'';
  const WeekNav=()=>(<>{generando&&<OverlayGenerando lang={lang}/>}<div style={{display:'flex',alignItems:'center',justifyContent:'space-between',padding:'14px 16px 10px',gap:8}}>
    <button onClick={()=>setIdx(i=>Math.min(i+1,planes.length-1))} disabled={idx>=planes.length-1} style={{background:'none',border:idx>=planes.length-1?'1.5px solid rgba(255,255,255,0.1)':'1.5px solid '+T.bG,borderRadius:10,color:idx>=planes.length-1?T.t3:T.g1,fontSize:18,width:36,height:36,cursor:idx>=planes.length-1?'default':'pointer',flexShrink:0}}>‹</button>
    <div style={{textAlign:'center',flex:1}}>
      <div style={{display:'flex',alignItems:'center',justifyContent:'center',gap:7,flexWrap:'wrap'}}>
        <span style={{fontWeight:900,fontSize:15,color:T.t1}}>{lang==='en'?'Week':'Semana'} {plan.semana}</span>
        {idx===idxActual
          ? <span style={{fontSize:9.5,fontWeight:900,color:T.g1,background:'rgba(88,204,2,0.15)',border:'1px solid '+T.bG,borderRadius:20,padding:'2px 9px',textTransform:'uppercase',letterSpacing:'0.03em',whiteSpace:'nowrap'}}>● {lang==='en'?'Current week':'Semana actual'}</span>
          : <button onClick={()=>setIdx(idxActual)} style={{fontSize:9.5,fontWeight:800,color:T.au1,background:'rgba(255,200,0,0.12)',border:'1px solid rgba(255,200,0,0.3)',borderRadius:20,padding:'2px 9px',cursor:'pointer',whiteSpace:'nowrap',fontFamily:"'Nunito',sans-serif"}}>{lang==='en'?'Go to current →':'Ir a la actual →'}</button>}
      </div>
      {mediaKcalSem!==null&&(
        <div style={{display:'inline-flex',alignItems:'center',gap:6,marginTop:6,background:'rgba(88,204,2,0.12)',border:'1px solid '+T.bG,borderRadius:20,padding:'3px 11px'}}>
          <span style={{fontSize:12,lineHeight:1}}>🔥</span>
          <span style={{fontSize:12,color:T.t2,fontFamily:"'DM Sans',sans-serif"}}>{lang==='en'?'Daily average':'Media diaria'}: <b style={{color:T.g1}}>{mediaKcalSem}</b> kcal</span>
        </div>
      )}
      {fechaStr&&<div style={{fontSize:11,color:T.t2,fontFamily:"'DM Sans',sans-serif",marginTop:3}}>{lang==='en'?'Generated':'Generado'} {fechaStr}</div>}
    </div>
    <button onClick={()=>setIdx(i=>Math.max(i-1,0))} disabled={idx<=0} style={{background:'none',border:idx<=0?'1.5px solid rgba(255,255,255,0.1)':'1.5px solid '+T.bG,borderRadius:10,color:idx<=0?T.t3:T.g1,fontSize:18,width:36,height:36,cursor:idx<=0?'default':'pointer',flexShrink:0}}>›</button>
  </div></>);
  const BtnVolver=({onClick})=>(<button onClick={onClick} style={{background:'none',border:'none',color:T.g1,fontSize:13,fontWeight:700,cursor:'pointer',padding:'0 16px 10px',fontFamily:"'Nunito',sans-serif",display:'flex',alignItems:'center',gap:4}}>← {lang==='en'?'Back':'Volver'}</button>);
  const DotsNav=()=>planes.length>1?(<div style={{display:'flex',justifyContent:'center',gap:6,padding:'8px 0 4px'}}>{planes.map((_,i)=>(<div key={i} onClick={()=>setIdx(i)} style={{width:i===idx?20:7,height:7,borderRadius:4,background:i===idx?T.g1:'rgba(255,255,255,0.15)',cursor:'pointer',transition:'all 0.3s'}}/>))}</div>):null;
  // Chip de semana de prueba (solo cuentas estándar con trial activo)
  const trialMs = profile?.trial_ends_at ? Date.parse(profile.trial_ends_at) - Date.now() : null;
  const trialDias = (isStandard && trialMs!==null && trialMs>0) ? Math.max(1, Math.ceil(trialMs/(24*60*60*1000))) : null;
  const TrialChip=()=>trialDias?(
    <div style={{margin:'10px 16px 0',display:'flex',alignItems:'center',gap:10,
      background:'rgba(255,200,0,0.10)',border:'1.5px solid rgba(255,200,0,0.45)',
      borderRadius:14,padding:'10px 14px'}}>
      <span style={{fontSize:20,lineHeight:1}}>🎁</span>
      <div style={{flex:1}}>
        <div style={{fontSize:12.5,fontWeight:900,color:T.au1}}>
          {lang==='en'
            ? `Free trial week · ${trialDias} day${trialDias!==1?'s':''} left`
            : `Semana de prueba gratis · ${trialDias===1?'queda 1 día':`quedan ${trialDias} días`}`}
        </div>
        <div style={{fontSize:10.5,color:T.t2,fontFamily:"'DM Sans',sans-serif",lineHeight:1.4}}>
          {lang==='en'?'Enjoy your full weekly plan. Then 7€/month.':'Disfruta tu programación completa. Después, 7€/mes.'}
        </div>
      </div>
    </div>
  ):null;

  if(view===null) return(
    <div style={{paddingBottom:16}}>
      <TrialChip/>
      <WeekNav/>
      {/* ── Etiqueta de optimización por favoritas (plan_json.fav_resumen) ──
          Va ENTRE la tabla de calorías generales (media diaria del WeekNav) y
          el plan de recetas. Muestra cuántas favoritas entraron y el % de la
          "semana perfecta" (respecto al techo físico alcanzable), con CTA de
          gemas. Solo si hay favoritas en el plan. */}
      {planJ?.fav_resumen && (planJ.fav_resumen.mostradas||0)>0 && (()=>{
        const fr=planJ.fav_resumen;
        const pct=Math.max(0,Math.min(100,Math.round(fr.pct||0)));
        const alto=pct>=80;
        return(
          <div style={{margin:'4px 16px 0',background:'rgba(255,200,0,0.10)',border:'2px solid rgba(255,200,0,0.30)',borderRadius:18,padding:'14px 16px',boxShadow:'0 4px 0 rgba(0,0,0,0.3)'}}>
            <div style={{display:'flex',alignItems:'center',gap:10,marginBottom:10}}>
              <span style={{fontSize:22,lineHeight:1,flexShrink:0}}>⭐</span>
              <div style={{flex:1,fontWeight:900,fontSize:13,color:T.au1,fontFamily:"'Nunito',sans-serif",lineHeight:1.3}}>
                {lang==='en'
                  ? `${fr.mostradas} of your favourite recipes are in this week's plan`
                  : `${fr.mostradas} de tus recetas favoritas están en tu plan de esta semana`}
              </div>
              <span style={{fontWeight:900,fontSize:16,color:T.au1,fontFamily:"'Nunito',sans-serif",flexShrink:0}}>{pct}%</span>
            </div>
            <div style={{height:9,borderRadius:6,background:'rgba(255,255,255,0.10)',overflow:'hidden'}}>
              <div style={{height:'100%',width:pct+'%',borderRadius:6,background:'linear-gradient(90deg,'+T.au2+','+T.au1+')',transition:'width 0.5s'}}/>
            </div>
            <div style={{fontSize:11,color:T.t2,fontFamily:"'DM Sans',sans-serif",lineHeight:1.5,marginTop:8}}>
              {lang==='en'
                ? (alto
                    ? "You're almost at your perfect week! Unlock new recipes with your gems and save them to keep growing it."
                    : "Every recipe you save as a favourite fine-tunes your plan. Unlock new ones with your gems and save them to make it even more yours.")
                : (alto
                    ? '¡Ya casi tienes tu semana perfecta! Desbloquea recetas nuevas con tus 💎 y guárdalas para seguir ampliándola.'
                    : 'Cada receta que guardas como favorita afina más tu plan. Desbloquea nuevas con tus 💎 y guárdalas para hacerlo aún más tuyo.')}
            </div>
          </div>
        );
      })()}
      <div style={{padding:'12px 16px',display:'flex',flexDirection:'column',gap:12}}>
        {/* Tarjeta unificada (jul-2026): sustituye a 'Planificación semanal' +
            'Recetas semanales'. El PDF ya incluye la tabla semanal completa,
            así que la vista duplicada sobra. Entrada DIRECTA al PDF (sin
            pantalla intermedia con botón de descarga); si el PDF aún no
            existe, cae a la vista 'pdf' que muestra el aviso de no disponible. */}
        <button onClick={()=>{if(plan.pdf_url){window.open(plan.pdf_url,'_blank','noopener');}else{setView('pdf');}}} style={{background:'rgba(255,200,0,0.10)',border:'2px solid rgba(255,200,0,0.3)',borderRadius:20,padding:'20px 20px',textAlign:'left',cursor:'pointer',display:'flex',alignItems:'center',gap:16,boxShadow:'0 4px 0 rgba(0,0,0,0.3)'}}>
          <div style={{fontSize:40,flexShrink:0}}>📅</div>
          <div style={{flex:1}}><div style={{fontWeight:900,fontSize:16,color:T.t1,marginBottom:4,fontFamily:"'Nunito',sans-serif"}}>{lang==='en'?'Plan & Recipes':'Plan y recetas'}</div><div style={{fontSize:12,color:T.t2,fontFamily:"'DM Sans',sans-serif",lineHeight:1.5}}>{lang==='en'?'Your week at a glance, recipes and progress (PDF)':'Tu semana de un vistazo, recetas y tu progreso (PDF)'}</div></div>
          <div style={{color:T.au1,fontSize:20,flexShrink:0}}>›</div>
        </button>
        <button onClick={()=>setView('daily')} style={{background:'rgba(100,181,246,0.12)',border:'2px solid rgba(100,181,246,0.3)',borderRadius:20,padding:'20px 20px',textAlign:'left',cursor:'pointer',display:'flex',alignItems:'center',gap:16,boxShadow:'0 4px 0 rgba(0,0,0,0.3)'}}>
          <div style={{fontSize:40,flexShrink:0}}>🍽️</div>
          <div style={{flex:1}}><div style={{fontWeight:900,fontSize:16,color:T.t1,marginBottom:4,fontFamily:"'Nunito',sans-serif"}}>{lang==='en'?'Daily Meals':'Platos diarios'}</div><div style={{fontSize:12,color:T.t2,fontFamily:"'DM Sans',sans-serif",lineHeight:1.5}}>{lang==='en'?'Your meals for today with full recipe details':'Tus platos de hoy con receta e ingredientes'}</div></div>
          <div style={{color:'#64B5F6',fontSize:20,flexShrink:0}}>›</div>
        </button>
        <button onClick={()=>setView('lista')} style={{background:'rgba(255,140,60,0.10)',border:'2px solid rgba(255,140,60,0.32)',borderRadius:20,padding:'20px 20px',textAlign:'left',cursor:'pointer',display:'flex',alignItems:'center',gap:16,boxShadow:'0 4px 0 rgba(0,0,0,0.3)'}}>
          <div style={{fontSize:40,flexShrink:0}}>🛒</div>
          <div style={{flex:1}}><div style={{fontWeight:900,fontSize:16,color:T.t1,marginBottom:4,fontFamily:"'Nunito',sans-serif"}}>{lang==='en'?'Shopping List':'Lista de la compra'}</div><div style={{fontSize:12,color:T.t2,fontFamily:"'DM Sans',sans-serif",lineHeight:1.5}}>{lang==='en'?'Tick off ingredients as you shop':'Marca los ingredientes mientras compras'}</div></div>
          <div style={{color:'#FF8C3C',fontSize:20,flexShrink:0}}>›</div>
        </button>
        <button onClick={()=>setView('seguimiento')} style={{background:'rgba(206,130,255,0.12)',border:'2px solid rgba(206,130,255,0.3)',borderRadius:20,padding:'20px 20px',textAlign:'left',cursor:'pointer',display:'flex',alignItems:'center',gap:16,boxShadow:'0 4px 0 rgba(0,0,0,0.3)'}}>
          <div style={{fontSize:40,flexShrink:0}}>📊</div>
          <div style={{flex:1}}><div style={{fontWeight:900,fontSize:16,color:T.t1,marginBottom:4,fontFamily:"'Nunito',sans-serif"}}>{lang==='en'?'Tracking':'Seguimiento'}</div><div style={{fontSize:12,color:T.t2,fontFamily:"'DM Sans',sans-serif",lineHeight:1.5}}>{lang==='en'?'Calendar and charts of your meal compliance':'Calendario y gráficas de tu cumplimiento'}</div></div>
          <div style={{color:T.pur,fontSize:20,flexShrink:0}}>›</div>
        </button>
        {/* Plan estándar: candado semanal (sin gemas, se desbloquea el lunes) */}
        {isStandard&&planBloqueado&&(
          <div style={{background:'rgba(255,255,255,0.04)',border:'1.5px solid rgba(255,255,255,0.10)',borderRadius:16,padding:'14px 16px',marginTop:4}}>
            <div style={{display:'flex',alignItems:'center',gap:12}}>
              <div style={{fontSize:24,flexShrink:0}}>🔒</div>
              <div style={{flex:1}}>
                <div style={{fontWeight:800,fontSize:13.5,color:T.t1,fontFamily:"'Nunito',sans-serif"}}>
                  {lang==='en'?'One plan per week':'Un plan por semana'}
                </div>
                <div style={{fontSize:11,color:T.t3,fontFamily:"'DM Sans',sans-serif",lineHeight:1.4,marginTop:2}}>
                  {lang==='en'
                    ?`Your new plan unlocks Monday (${diasDesbloqueo} day${diasDesbloqueo!==1?'s':''}). To vary a meal, swap that recipe with gems.`
                    :`Tu nueva programación se desbloquea el lunes ${diasDesbloqueo===1?'(en 1 día)':`(en ${diasDesbloqueo} días)`}. Para variar una comida, cambia esa receta con 💎.`}
                </div>
              </div>
            </div>
          </div>
        )}
        {isStandard&&!planBloqueado&&(
          <button onClick={()=>setConfigView(true)} style={{background:'rgba(88,204,2,0.08)',border:'1.5px solid '+T.bG,borderRadius:16,padding:'14px 16px',textAlign:'left',cursor:'pointer',display:'flex',alignItems:'center',gap:14,marginTop:4}}>
            <div style={{fontSize:26,flexShrink:0}}>✨</div>
            <div style={{flex:1}}><div style={{fontWeight:800,fontSize:14,color:T.g1,fontFamily:"'Nunito',sans-serif"}}>{lang==='en'?'Generate new week':'Generar nueva semana'}</div><div style={{fontSize:11,color:T.t3,fontFamily:"'DM Sans',sans-serif"}}>{lang==='en'?'Review your settings and create a fresh plan':'Revisa tu configuración y crea un plan nuevo'}</div></div>
            <div style={{color:T.g1,fontSize:16,flexShrink:0}}>›</div>
          </button>
        )}
      </div>
      <DotsNav/>
    </div>
  );
  if(view==='seguimiento') return(
    <div style={{paddingBottom:20}}>
      <BtnVolver onClick={()=>setView(null)}/>
      <SeguimientoView profile={profile} lang={lang}/>
    </div>
  );
  // (jul-2026) Vista 'plan' retirada: la tarjeta unificada abre el PDF, que ya
  // incluye la tabla 'Tu Semana de un Vistazo' generada por la automatización.
  if(view==='pdf') return(
    <div style={{padding:'0 0 16px'}}>
      <WeekNav/><BtnVolver onClick={()=>setView(null)}/>
      <div style={{padding:'8px 16px'}}>
        {plan.pdf_url
          ?<a href={plan.pdf_url} target='_blank' rel='noreferrer' download={`GBH_Recetas_S${plan.semana}.pdf`} style={{display:'flex',alignItems:'center',justifyContent:'center',gap:10,background:'linear-gradient(135deg,'+T.au1+','+T.au2+')',color:'#000',fontWeight:900,fontSize:15,borderRadius:18,padding:'16px 24px',textDecoration:'none',boxShadow:'0 5px 0 '+T.au3,marginTop:16}}>
            <span style={{fontSize:20}}>📥</span>{lang==='en'?'Download PDF':'Descargar PDF'}
          </a>
          :<div style={{textAlign:'center',padding:'24px 0'}}>
            <div style={{fontSize:44,marginBottom:12}}>📭</div>
            <div style={{fontWeight:900,fontSize:15,color:T.t1,marginBottom:8}}>{lang==='en'?'PDF not available yet':'PDF no disponible aún'}</div>
            <div style={{fontSize:13,color:T.t2,fontFamily:"'DM Sans',sans-serif",lineHeight:1.7}}>{lang==='en'?'Your nutritionist will share it soon.':'Tu nutricionista te lo enviará pronto.'}</div>
          </div>
        }
      </div>
    </div>
  );
  if(view==='lista'){
    const marcados=listaItems.filter(it=>listaChecks[it.key]).length;
    return(
    <div style={{padding:'0 0 24px'}}>
      <WeekNav/><BtnVolver onClick={()=>{setView(null);setListaConfirm(false);}}/>
      <div style={{padding:'4px 16px'}}>
        <div style={{display:'flex',alignItems:'center',gap:10,marginBottom:6}}>
          <span style={{fontSize:26}}>🛒</span>
          <div style={{fontWeight:900,fontSize:17,color:T.t1,fontFamily:"'Nunito',sans-serif"}}>{lang==='en'?'Shopping list':'Lista de la compra'}</div>
        </div>
        {listaItems.length===0 ? (
          <div style={{textAlign:'center',padding:'30px 10px'}}>
            <div style={{fontSize:44,marginBottom:12}}>📭</div>
            <div style={{fontSize:13,color:T.t2,fontFamily:"'DM Sans',sans-serif",lineHeight:1.7}}>
              {lang==='en'
                ?'This plan doesn\'t include ingredient details. Use the recipes PDF for now.'
                :'Este plan no incluye el detalle de ingredientes. De momento, usa el PDF de recetas y lista del súper.'}
            </div>
          </div>
        ) : (<>
          {/* Progreso de la compra */}
          <div style={{fontSize:12,color:T.t2,fontFamily:"'DM Sans',sans-serif",marginBottom:10}}>
            <b style={{color:marcados===listaItems.length?T.g2:T.t1}}>{marcados}/{listaItems.length}</b> {lang==='en'?'items in the cart':'ingredientes en el carro'} · {lang==='en'?'week':'semana'} {plan?.semana}
          </div>
          <div style={{height:8,background:'rgba(255,255,255,0.08)',borderRadius:6,marginBottom:14,overflow:'hidden'}}>
            <div style={{height:'100%',width:`${listaItems.length?Math.round(marcados/listaItems.length*100):0}%`,background:`linear-gradient(90deg,${T.g3},${T.g1})`,borderRadius:6,transition:'width 0.25s'}}/>
          </div>
          {/* Listado con casillas */}
          <div style={{display:'flex',flexDirection:'column',gap:6}}>
            {listaItems.map(it=>{
              const on=!!listaChecks[it.key];
              return(
                <button key={it.key} onClick={()=>toggleListaCheck(it.key)} style={{
                  display:'flex',alignItems:'center',gap:12,textAlign:'left',cursor:'pointer',
                  background:on?'rgba(88,204,2,0.08)':'rgba(255,255,255,0.05)',
                  border:`1.5px solid ${on?'rgba(88,204,2,0.35)':'rgba(255,255,255,0.12)'}`,
                  borderRadius:14,padding:'11px 14px',transition:'all 0.15s'}}>
                  <span style={{width:22,height:22,flexShrink:0,borderRadius:7,display:'flex',alignItems:'center',justifyContent:'center',
                    background:on?T.g1:'transparent',border:`2px solid ${on?T.g1:'rgba(255,255,255,0.3)'}`,
                    color:'#0d2b12',fontSize:14,fontWeight:900,transition:'all 0.15s'}}>{on?'✓':''}</span>
                  <span style={{flex:1,fontSize:13.5,fontFamily:"'DM Sans',sans-serif",lineHeight:1.4,
                    color:on?T.t3:T.t1,textDecoration:on?'line-through':'none',textDecorationThickness:'2px',
                    opacity:on?0.65:1,transition:'all 0.15s'}}>{it.nombre}</span>
                  {fmtCant(it)&&<span style={{fontSize:12,fontWeight:900,color:on?T.t3:T.au1,fontFamily:"'Nunito',sans-serif",flexShrink:0,opacity:on?0.6:1}}>{fmtCant(it)}</span>}
                </button>
              );
            })}
          </div>
          {/* Regenerar: desmarca todo para repetir la semana (doble toque de confirmación) */}
          <button onClick={regenerarLista} style={{
            width:'100%',marginTop:16,padding:'14px 20px',borderRadius:16,cursor:'pointer',
            background:listaConfirm?'rgba(255,140,60,0.18)':'rgba(255,255,255,0.06)',
            border:`2px solid ${listaConfirm?'#FF8C3C':'rgba(255,255,255,0.15)'}`,
            color:listaConfirm?'#FF8C3C':T.t2,fontWeight:900,fontSize:14,fontFamily:"'Nunito',sans-serif",
            boxShadow:'0 4px 0 rgba(0,0,0,0.3)',transition:'all 0.15s'}}>
            {listaConfirm
              ?(lang==='en'?'Tap again to confirm ↺':'Toca otra vez para confirmar ↺')
              :(lang==='en'?'🔄 Reset list':'🔄 Regenerar lista')}
          </button>
          <div style={{textAlign:'center',marginTop:8,fontSize:10.5,color:T.t3,fontFamily:"'DM Sans',sans-serif",lineHeight:1.5}}>
            {lang==='en'
              ?'Unchecks everything — handy if you repeat this week\'s plan. This list is fixed to your original plan; to buy a swapped recipe, use its 🛒 Buy button.'
              :'Desmarca todo — útil si repites la semana. Esta lista es fija a tu programación original; para comprar una receta cambiada, usa su botón 🛒 Comprar.'}
          </div>
        </>)}
      </div>
    </div>
    );
  }
  if(view==='daily'){
    const ingList=tomaReceta?.ingredientes?.split(/[,;](?![^(]*\))/).map(s=>s.trim()).filter(Boolean)||[];
    return(<div style={{paddingBottom:16}}>
      {miniCompra&&<MiniListaCompra nombre={miniCompra.nombre} ingredientes={miniCompra.ingredientes}
        idReceta={miniCompra.id} t={t} onClose={()=>setMiniCompra(null)}/>}
      <WeekNav/>
      <BtnVolver onClick={()=>{if(openToma){setOpenToma(null);setTomaReceta(null);}else setView(null);}}/>
      {!openToma&&(<>
        <div style={{overflowX:'auto',WebkitOverflowScrolling:'touch',padding:'0 16px 16px'}}>
          <div style={{display:'flex',gap:8,minWidth:'min-content'}}>
            {PLAN_DIAS.map((d,i)=>{
              const dayNum=i+1;const isToday=dayNum===todayPlan;const isSel=dayNum===selDay;
              return(<button key={d} onClick={()=>setSelDay(dayNum)} style={{flexShrink:0,padding:'10px 14px',borderRadius:14,border:'none',cursor:'pointer',background:isSel?'linear-gradient(135deg,'+T.g1+','+T.g2+')':isToday?'rgba(88,204,2,0.15)':'rgba(255,255,255,0.06)',color:isSel?'#fff':isToday?T.g1:T.t2,fontWeight:isSel||isToday?900:600,fontSize:12,fontFamily:"'Nunito',sans-serif",boxShadow:isSel?'0 3px 0 '+T.g3:isToday?'0 0 0 1.5px '+T.bG:'none',transition:'all 0.2s',display:'flex',flexDirection:'column',alignItems:'center',gap:2}}>
                <span>{d}</span>
                {isToday&&!isSel&&<div style={{width:5,height:5,borderRadius:'50%',background:T.g1}}/>}
              </button>);
            })}
          </div>
        </div>
        <div style={{padding:'0 16px 12px'}}>
          <div style={{fontSize:13,fontWeight:900,color:T.t2,fontFamily:"'Nunito',sans-serif"}}>{PLAN_DIAS_F[selDay-1]}{selDay===todayPlan?` · ${lang==='en'?'Today':'Hoy'}`:''} · {lang==='en'?'Week':'Semana'} {plan.semana}</div>
        </div>
        <div style={{padding:'0 16px',display:'flex',flexDirection:'column',gap:10}}>
          {(()=>{
            // Botón de suplemento/medicación: horizontal largo, dorado, con hora.
            // Solo HOY (semana en curso) y desaparece al completarse ese día.
            const mostrarSupl = suplHoy && selDay===todayPlan && puedeRegistrar;
            const SuplBtn = ({it})=>(
              <button key={`supl-${it.nombre}`} onClick={()=>marcarSupl(it)} style={{
                width:'100%',boxSizing:'border-box',display:'flex',alignItems:'center',gap:12,
                background:'linear-gradient(135deg,rgba(201,168,76,0.16),rgba(201,168,76,0.06))',
                border:`1.5px dashed ${T.au1}`,borderRadius:16,padding:'12px 16px',
                textAlign:'left',cursor:'pointer',transition:'all 0.2s'}}>
                <div style={{fontSize:22,width:38,height:38,display:'flex',alignItems:'center',justifyContent:'center',borderRadius:12,background:'rgba(201,168,76,0.15)',flexShrink:0}}>{SUPL_IC[it.tipo]||'💊'}</div>
                <div style={{flex:1,minWidth:0}}>
                  <div style={{fontSize:10,color:T.au1,fontWeight:800,textTransform:'uppercase',letterSpacing:'0.08em',marginBottom:2,fontFamily:"'DM Sans',sans-serif"}}>
                    ⏰ {it.hora} · {lang==='en'?(it.tipo==='Medicación'?'Medication':'Supplement'):it.tipo}
                  </div>
                  <div style={{fontSize:13.5,fontWeight:800,color:T.t1,fontFamily:"'Nunito',sans-serif",whiteSpace:'nowrap',overflow:'hidden',textOverflow:'ellipsis'}}>
                    {it.nombre}{it.dosis?` · ${it.dosis}`:''}
                  </div>
                </div>
                <div style={{fontSize:12,fontWeight:900,color:T.au1,flexShrink:0,fontFamily:"'Nunito',sans-serif"}}>+5 💎</div>
              </button>
            );
            const suplEn=(tras)=>!mostrarSupl?null:
              suplHoy.filter(it=>suplTrasToma(it.hora)===tras && !suplHechos[it.nombre])
                     .map(it=><SuplBtn key={it.nombre} it={it}/>);
            return(<>
          {suplEn('')}
          {PLAN_TOMAS.map(toma=>{
            const meal=planJ?.[toma]?.[String(selDay)];
            const hasMeal=!!meal?.Nombre_Receta;
            const mostrarChips=hasMeal&&puedeRegistrar;
            const estado=regDia[selDateKey]?.meals?.[toma];
            return(<React.Fragment key={toma}><div key={toma}>
              <button onClick={()=>hasMeal&&abrirToma(toma)} disabled={!hasMeal} style={{width:'100%',boxSizing:'border-box',background:hasMeal?(PLAN_TIPO_BG[meal?.Tipo]||'rgba(255,255,255,0.06)'):'rgba(255,255,255,0.04)',border:hasMeal?'1.5px solid rgba(255,255,255,0.12)':'1.5px solid rgba(255,255,255,0.05)',borderRadius:mostrarChips?'16px 16px 0 0':16,padding:'14px 16px',textAlign:'left',cursor:hasMeal?'pointer':'default',display:'flex',alignItems:'center',gap:12,transition:'all 0.2s'}}>
                <div style={{fontSize:26,width:44,height:44,display:'flex',alignItems:'center',justifyContent:'center',borderRadius:14,background:'rgba(255,255,255,0.06)',flexShrink:0}}>{PLAN_TOMA_IC[toma]||'🍴'}</div>
                <div style={{flex:1,minWidth:0}}>
                  <div style={{fontSize:10,color:T.t3,fontWeight:700,textTransform:'uppercase',letterSpacing:'0.08em',marginBottom:3,fontFamily:"'DM Sans',sans-serif"}}>{toma}</div>
                  <div style={{fontSize:14,fontWeight:hasMeal?800:400,color:hasMeal?T.t1:T.t3,fontFamily:"'Nunito',sans-serif",whiteSpace:'nowrap',overflow:'hidden',textOverflow:'ellipsis'}}>
                    {hasMeal&&<span style={{marginRight:4}}>{emojiPlato(meal.Nombre_Receta, meal.Tipo)}</span>}{hasMeal?meal.Nombre_Receta:'—'}
                  </div>
                </div>
                {hasMeal&&<div style={{color:T.t3,fontSize:18,flexShrink:0}}>›</div>}
              </button>
              {mostrarChips&&(
                <div style={{display:'flex',gap:6,background:'rgba(255,255,255,0.03)',border:'1.5px solid rgba(255,255,255,0.10)',borderTop:'none',borderRadius:'0 0 16px 16px',padding:'8px 10px 10px'}}>
                  {PLAN_CUMPL.map(c=>{const on=estado===c.k;return(
                    <button key={c.k} onClick={()=>setEstadoComida(toma,c.k)} title={lang==='en'?c.en:c.es} aria-label={lang==='en'?c.en:c.es} style={{flex:1,display:'flex',alignItems:'center',justifyContent:'center',padding:'11px 0',borderRadius:12,cursor:'pointer',background:on?c.c+'30':'rgba(255,255,255,0.05)',border:on?('2px solid '+c.c):'1.5px solid rgba(255,255,255,0.06)',fontSize:22,lineHeight:1,transition:'all 0.15s'}}>
                      {c.ic}
                    </button>);})}
                </div>
              )}
            </div>{suplEn(toma)}</React.Fragment>);
          })}
            </>);
          })()}
          {macrosDia&&(
            <div style={{background:'rgba(255,255,255,0.03)',border:'1.5px solid rgba(255,255,255,0.10)',borderRadius:16,padding:'16px 16px'}}>
              <div style={{fontSize:11,color:T.au1,fontWeight:900,textTransform:'uppercase',letterSpacing:'0.08em',display:'flex',alignItems:'center',gap:6,marginBottom:14}}>
                <span>📊</span>{lang==='en'?'Daily macro split':'Distribución de macros del día'}
              </div>
              <div style={{display:'flex',alignItems:'center',gap:18}}>
                {(()=>{
                  const R=42, SW=18, C=2*Math.PI*R;
                  const segs=[{f:macrosDia.fH,c:T.g1},{f:macrosDia.fG,c:'#FFB74D'},{f:macrosDia.fP,c:'#64B5F6'}];
                  let acc=0;
                  return(
                    <svg width="110" height="110" viewBox="0 0 112 112" style={{flexShrink:0}}>
                      <g transform="rotate(-90 56 56)">
                        <circle cx="56" cy="56" r={R} fill="none" stroke="rgba(255,255,255,0.06)" strokeWidth={SW}/>
                        {segs.map((s,i)=>{const dash=C*s.f;const el=(<circle key={i} cx="56" cy="56" r={R} fill="none" stroke={s.c} strokeWidth={SW} strokeDasharray={`${dash} ${C-dash}`} strokeDashoffset={-C*acc} strokeLinecap="butt"/>);acc+=s.f;return el;})}
                      </g>
                    </svg>
                  );
                })()}
                <div style={{flex:1,display:'flex',flexDirection:'column',gap:9}}>
                  {[{c:'#64B5F6',lbl:lang==='en'?'Protein':'Proteínas',pct:macrosDia.pctP,g:macrosDia.p},
                    {c:T.g1,lbl:lang==='en'?'Carbs':'Hidratos',pct:macrosDia.pctH,g:macrosDia.h},
                    {c:'#FFB74D',lbl:lang==='en'?'Fat':'Grasas',pct:macrosDia.pctG,g:macrosDia.g}].map((mm,i)=>(
                    <div key={i} style={{display:'flex',alignItems:'center',gap:8}}>
                      <div style={{width:10,height:10,borderRadius:3,background:mm.c,flexShrink:0}}/>
                      <div style={{flex:1,fontSize:13,color:T.t1,fontFamily:"'DM Sans',sans-serif"}}>{mm.lbl}</div>
                      <div style={{fontSize:13,fontWeight:900,color:mm.c,fontFamily:"'Nunito',sans-serif"}}>{mm.pct}%</div>
                      <div style={{fontSize:11,color:T.t3,minWidth:34,textAlign:'right',fontFamily:"'DM Sans',sans-serif"}}>{mm.g} g</div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          )}
          {puedeRegistrar&&(<>
            <div style={{background:'rgba(255,255,255,0.03)',border:'1.5px solid rgba(255,255,255,0.10)',borderRadius:16,padding:'12px 14px'}}>
              <div style={{display:'flex',alignItems:'center',justifyContent:'space-between',marginBottom:8}}>
                <div style={{fontSize:11,color:T.au1,fontWeight:900,textTransform:'uppercase',letterSpacing:'0.08em',display:'flex',alignItems:'center',gap:6}}><span>💬</span>{lang==='en'?'Note for your nutritionist':'Nota para tu nutricionista'}</div>
                {notaOK&&<span style={{fontSize:11,color:T.g1,fontWeight:800}}>✓ {lang==='en'?'Saved':'Guardada'}</span>}
              </div>
              <textarea value={notaTmp} onChange={e=>{setNotaTmp(e.target.value);setNotaOK(false);}} onBlur={guardarNotaDia} rows={2} placeholder={lang==='en'?'e.g. I ate out on Saturday, pizza with friends…':'p. ej. el sábado comí fuera, pizza con amigos…'} style={{width:'100%',boxSizing:'border-box',resize:'vertical',background:'rgba(0,0,0,0.20)',border:'1.5px solid rgba(255,255,255,0.10)',borderRadius:12,padding:'10px 12px',color:T.t1,fontSize:13,fontFamily:"'DM Sans',sans-serif",lineHeight:1.5,outline:'none'}}/>
              <div style={{fontSize:10.5,color:T.t3,marginTop:6,fontFamily:"'DM Sans',sans-serif"}}>{lang==='en'?'Optional · only your nutritionist sees this':'Opcional · solo lo ve tu nutricionista'}</div>
            </div>
            <div style={{padding:'4px 4px 0'}}>
              <div style={{fontSize:10,color:T.t3,fontWeight:800,textTransform:'uppercase',letterSpacing:'0.06em',marginBottom:8}}>{lang==='en'?'What each button means':'Qué significa cada botón'}</div>
              <div style={{display:'flex',flexWrap:'wrap',gap:'8px 16px'}}>
                {PLAN_CUMPL.map(c=>(
                  <div key={c.k} style={{display:'flex',alignItems:'center',gap:6,fontSize:12,color:T.t2,fontFamily:"'DM Sans',sans-serif"}}><span style={{fontSize:16,lineHeight:1}}>{c.ic}</span>{lang==='en'?c.en:c.es}</div>
                ))}
              </div>
            </div>
          </>)}
        </div>
      </>)}
      {openToma&&(<div style={{padding:'0 16px 16px'}}>
        {loadingToma&&<div style={{textAlign:'center',padding:40,fontSize:13,color:T.t2}}>{lang==='en'?'Loading recipe…':'Cargando receta…'}</div>}
        {!loadingToma&&tomaReceta&&(<>
          <div style={{display:'flex',alignItems:'center',gap:10,marginBottom:14}}>
            <span style={{fontSize:22}}>{PLAN_TOMA_IC[openToma]||'🍴'}</span>
            <div style={{fontSize:11,color:T.t3,fontWeight:700,textTransform:'uppercase',letterSpacing:'0.08em',fontFamily:"'DM Sans',sans-serif"}}>{openToma}</div>
          </div>
          <div style={{background:T.bgCard,borderRadius:20,padding:'20px 18px',marginBottom:12,border:'1px solid rgba(255,255,255,0.07)'}}>
            <div style={{display:'flex',alignItems:'flex-start',gap:14,marginBottom:16}}>
              <div style={{fontSize:48,lineHeight:1,flexShrink:0}}>{emojiPlato(tomaReceta.nombre, tomaReceta.tipo)}</div>
              <div style={{flex:1}}>
                <div style={{display:'inline-block',background:(PLAN_TIPO_COLOR[tomaReceta.tipo]||T.g1)+'22',border:'1.5px solid '+(PLAN_TIPO_COLOR[tomaReceta.tipo]||T.g1)+'55',borderRadius:20,padding:'3px 12px',fontSize:10,fontWeight:900,color:PLAN_TIPO_COLOR[tomaReceta.tipo]||T.g1,textTransform:'uppercase',letterSpacing:'0.1em',marginBottom:8}}>{tomaReceta.tipo||'—'}</div>
                <div style={{fontSize:19,fontWeight:900,color:T.wh,lineHeight:1.25}}>{tomaReceta.nombre}</div>
              </div>
            </div>
            {!!tomaReceta.racion_texto&&(
              <div style={{display:'flex',alignItems:'center',gap:8,background:'rgba(255,200,0,0.10)',
                border:'1.5px solid rgba(255,200,0,0.45)',borderRadius:14,padding:'9px 12px',marginBottom:12}}>
                <span style={{fontSize:18,lineHeight:1}}>⚖️</span>
                <div>
                  <div style={{fontSize:12,fontWeight:900,color:T.au1}}>
                    {(lang==='en'?'Your portion: ':'Tu ración: ')+tomaReceta.racion_texto}
                  </div>
                  <div style={{fontSize:10.5,color:T.t2,fontFamily:"'DM Sans',sans-serif",lineHeight:1.4}}>
                    {lang==='en'
                      ?'Quantities and calories already adjusted to your plan'
                      :'Las cantidades y calorías ya están ajustadas a tu plan'}
                  </div>
                </div>
              </div>
            )}
            <div style={{display:'grid',gridTemplateColumns:'1fr 1fr 1fr 1fr',gap:8}}>
              {[{l:lang==='en'?'Calories':'Calorías',v:String(tomaReceta.calorias),u:'kcal',c:T.au1},{l:lang==='en'?'Protein':'Proteína',v:String(tomaReceta.proteinas_g),u:'g',c:'#64B5F6'},{l:lang==='en'?'Carbs':'Carbos',v:String(tomaReceta.hidratos_g),u:'g',c:T.g1},{l:lang==='en'?'Fat':'Grasas',v:String(tomaReceta.grasas_g),u:'g',c:'#FFB74D'}].map(({l,v,u,c})=>(
                <div key={l} style={{background:'rgba(255,255,255,0.05)',borderRadius:12,padding:'10px 6px',textAlign:'center',border:'1px solid rgba(255,255,255,0.08)'}}>
                  <div style={{fontSize:16,fontWeight:900,color:c}}>{v}</div>
                  <div style={{fontSize:9,color:c,fontWeight:700,opacity:0.8}}>{u}</div>
                  <div style={{fontSize:9,color:T.t3,marginTop:2,fontFamily:"'DM Sans',sans-serif"}}>{l}</div>
                </div>
              ))}
            </div>
          </div>
          {ingList.length>0&&(<div style={{background:T.bgCard,borderRadius:20,padding:'18px 18px',marginBottom:12,border:'1px solid rgba(255,255,255,0.07)'}}>
            <div style={{display:'flex',alignItems:'center',justifyContent:'space-between',gap:8,flexWrap:'wrap',marginBottom:12}}>
              <div style={{fontSize:11,color:T.au1,fontWeight:900,textTransform:'uppercase',letterSpacing:'0.1em'}}>{lang==='en'?'Ingredients':'Ingredientes'}</div>
              <div style={{display:'flex',alignItems:'center',gap:6,flexWrap:'wrap'}}>
                {tomaReceta.raciones>1&&(<div style={{fontSize:11,color:PLAN_TIPO_COLOR[tomaReceta.tipo]||T.g1,fontWeight:800,background:(PLAN_TIPO_COLOR[tomaReceta.tipo]||T.g1)+'22',borderRadius:20,padding:'3px 11px',whiteSpace:'nowrap'}}>🍽️ {lang==='en'?`Makes ${tomaReceta.raciones} servings`:`Rinde ${tomaReceta.raciones} raciones`}</div>)}
                <button onClick={()=>setMiniCompra({nombre:tomaReceta.nombre,ingredientes:tomaReceta.ingredientes,id:tomaReceta.id_receta})} style={{
                  background:'rgba(255,140,60,0.12)',border:'1.5px solid rgba(255,140,60,0.4)',borderRadius:20,
                  padding:'4px 13px',fontSize:11.5,fontWeight:900,color:'#FF8C3C',cursor:'pointer',
                  fontFamily:"'Nunito',sans-serif",whiteSpace:'nowrap'}}>{t("buyBtn")}</button>
              </div>
            </div>
            <div style={{display:'flex',flexDirection:'column',gap:7}}>
              {ingList.map((ing,i)=>(<div key={i} style={{display:'flex',alignItems:'flex-start',gap:10}}><div style={{width:6,height:6,borderRadius:'50%',background:PLAN_TIPO_COLOR[tomaReceta.tipo]||T.g1,flexShrink:0,marginTop:6}}/><div style={{fontSize:13,color:T.t1,fontFamily:"'DM Sans',sans-serif",lineHeight:1.4}}>{ing}</div></div>))}
            </div>
          </div>)}
          <div style={{background:T.bgCard,borderRadius:20,padding:'18px 18px',border:'1px solid rgba(255,255,255,0.07)'}}>
            <div style={{fontSize:11,color:T.au1,fontWeight:900,textTransform:'uppercase',letterSpacing:'0.1em',marginBottom:12}}>{lang==='en'?'Preparation':'Preparación'}</div>
            <div style={{fontSize:13,color:T.t1,fontFamily:"'DM Sans',sans-serif",lineHeight:1.7,whiteSpace:'pre-wrap'}}>{tomaReceta.instrucciones}</div>
          </div>
          <BotonCompartirReceta rec={tomaReceta} lang={lang} sfx={sfx}/>

          {/* Botones: cambiar receta (10💎) y guardar (20💎) */}
          <div style={{display:'flex',gap:10,marginTop:12}}>
            <button onClick={cambiarRecetaToma}
              style={{flex:1,background:gems<10?'rgba(255,255,255,0.05)':'rgba(100,181,246,0.15)',
                      border:gems<10?'1.5px solid rgba(255,255,255,0.08)':'1.5px solid rgba(100,181,246,0.4)',
                      borderRadius:16,padding:'14px 10px',cursor:gems<10?'default':'pointer',
                      display:'flex',flexDirection:'column',alignItems:'center',gap:4}}>
              <span style={{fontSize:20}}>🔄</span>
              <span style={{fontSize:12,fontWeight:900,color:gems<10?T.t3:'#64B5F6',fontFamily:"'Nunito',sans-serif"}}>
                {lang==='en'?'Change':'Cambiar'}
              </span>
              <span style={{fontSize:10,color:T.t3}}>10 💎</span>
            </button>
            <button onClick={recetaYaGuardada?undefined:guardarRecetaToma}
              style={{flex:1,background:recetaYaGuardada?'rgba(88,204,2,0.15)':(gems<20?'rgba(255,255,255,0.05)':'rgba(255,200,0,0.12)'),
                      border:recetaYaGuardada?'1.5px solid '+T.bG:(gems<20?'1.5px solid rgba(255,255,255,0.08)':'1.5px solid rgba(255,200,0,0.35)'),
                      borderRadius:16,padding:'14px 10px',cursor:recetaYaGuardada?'default':(gems<20?'default':'pointer'),
                      display:'flex',flexDirection:'column',alignItems:'center',gap:4}}>
              <span style={{fontSize:20}}>{recetaYaGuardada?'✅':'📖'}</span>
              <span style={{fontSize:12,fontWeight:900,color:recetaYaGuardada?T.g1:(gems<20?T.t3:T.au1),fontFamily:"'Nunito',sans-serif"}}>
                {recetaYaGuardada?(lang==='en'?'Saved':'Guardada'):(lang==='en'?'Save':'Guardar')}
              </span>
              <span style={{fontSize:10,color:T.t3}}>{recetaYaGuardada?'✓':'20 💎'}</span>
            </button>
          </div>
        </>)}
      </div>)}
    </div>);
  }
  return null;
}


// ─── PlanConfig — el paciente estándar configura su plan (dieta + distribución) ──
function PlanConfig({profile,lang,config,setConfig,sfx,showT,onClose,onGenerar,primeraVez}){
  const TOMAS=[
    {k:'dist_desayuno',label:lang==='en'?'Breakfast':'Desayuno',ic:'☀️'},
    {k:'dist_almuerzo',label:lang==='en'?'Snack AM':'Almuerzo',ic:'🍎'},
    {k:'dist_comida',  label:lang==='en'?'Lunch':'Comida',ic:'🍽️'},
    {k:'dist_merienda',label:lang==='en'?'Snack PM':'Merienda',ic:'🥤'},
    {k:'dist_cena',    label:lang==='en'?'Dinner':'Cena',ic:'🌙'},
  ];
  const DIETAS=[
    {v:'Simple',     ic:'🍽️',label:lang==='en'?'Normal':'Normal',     sub:lang==='en'?'Everything':'De todo'},
    {v:'Vegetariana',ic:'🥗',label:lang==='en'?'Vegetarian':'Vegetariano',sub:lang==='en'?'No meat/fish':'Sin carne ni pescado'},
    {v:'Vegana',     ic:'🌱',label:lang==='en'?'Vegan':'Vegano',     sub:lang==='en'?'Plant-based':'100% vegetal'},
  ];
  // Patrones de repetición de menús — claves EXACTAS del generador (PATRONES)
  const PATRONES_OPC=[
    {v:'Todo igual (LMXJVSD)',      ic:'🍲', n:1, label:lang==='en'?'1 menu':'1 menú',
     sub:lang==='en'?'Cook once, eat all week':'Cocinas 1 vez · misma comida toda la semana'},
    {v:'3+2+2 (LXV/MJ/SD)',         ic:'🍱', n:3, label:lang==='en'?'3 menus':'3 menús',
     sub:lang==='en'?'L-W-F / T-Th / Sa-Su':'LXV · MJ · SD (cocinas 3 veces)'},
    {v:'Estándar (LJ/MS/XV/D)',     ic:'⭐', n:4, label:lang==='en'?'4 menus':'4 menús',
     sub:(lang==='en'?'Recommended · ':'Recomendado · ')+'LJ · MS · XV · D'},
    {v:'Alta repetición (LM/XJ/VS/D)',ic:'📦', n:4, label:lang==='en'?'4 in a row':'4 seguidos',
     sub:lang==='en'?'Mon-Tue / Wed-Thu / Fri-Sat / Sun':'LM · XJ · VS · D (2 días seguidos)'},
  ];
  const [dieta,setDieta]=React.useState(config?.tipo_dieta&&['Simple','Vegetariana','Vegana'].includes(config.tipo_dieta)?config.tipo_dieta:'Simple');
  const [patron,setPatron]=React.useState(
    PATRONES_OPC.some(p=>p.v===config?.patron_dias) ? config.patron_dias : 'Estándar (LJ/MS/XV/D)');
  const [dist,setDist]=React.useState({
    dist_desayuno: config?.dist_desayuno ?? 20,
    dist_almuerzo: config?.dist_almuerzo ?? 10,
    dist_comida:   config?.dist_comida   ?? 30,
    dist_merienda: config?.dist_merienda ?? 10,
    dist_cena:     config?.dist_cena     ?? 30,
  });
  const [guardando,setGuardando]=React.useState(false);
  // ── Recordatorios de suplementación/medicación (opcional, MÁX. 3) ──────────
  // El paciente standard se los define él mismo (nombre + hora). Límite de 3
  // para acotar las gemas: 3 × 5 💎 = máx. +15 💎/día por esta vía. Se guardan
  // en patient_config.suplementacion con el MISMO formato que el plan_json de
  // premium, así reutilizan botones dorados, pop-up de aviso y daily_logs.
  const MAX_RECS=3;
  const [recs,setRecs]=React.useState(()=>{
    const arr=Array.isArray(config?.suplementacion)?config.suplementacion:[];
    return arr.slice(0,MAX_RECS).map(it=>({
      nombre:(it?.nombre??'').toString(),
      tipo:(it?.tipo==='Medicación'||it?.tipo==='Medicacion')?'Medicación':'Suplemento',
      hora:(it?.hora??'').toString().slice(0,5),
    }));
  });
  const horaOk=(h)=>/^\d{2}:\d{2}$/.test(h);
  // Fila "a medias" (nombre sin hora o hora sin nombre) → bloquea el guardado.
  // Filas totalmente vacías se descartan en silencio.
  const recsAMedias=recs.some(r=>(r.nombre.trim()!=='')!==horaOk(r.hora));
  const recsLimpios=recs.filter(r=>r.nombre.trim()!==''&&horaOk(r.hora))
    .slice(0,MAX_RECS)
    .map(r=>({nombre:r.nombre.trim().slice(0,40),tipo:r.tipo,hora:r.hora}));

  const total=Object.values(dist).reduce((a,b)=>a+b,0);

  // Flechitas ▲▼: pasos de 5, SIN auto-reparto (nada se mueve solo).
  // El total se valida aparte: el botón solo se activa cuando suma 100.
  function ajustarToma(key,delta){
    setDist(d=>({...d,[key]:Math.max(0,Math.min(60,(d[key]||0)+delta))}));
  }

  async function guardar(){
    if(guardando) return;
    setGuardando(true);
    const payload={
      profile_id: profile.id,
      tipo_dieta: dieta,
      patron_dias: patron,
      ...dist,
      suplementacion: recsLimpios,   // [] borra los recordatorios si los quitó todos
      config_completa: true,
      auto_generado: true,
    };
    // Guardado VERIFICADO: si la config no llega a Supabase, el generador
    // leería valores viejos (causa del bug "misma receta todos los días").
    // Reintentos DEGRADADOS por si alguna columna opcional no está migrada:
    // completo → sin suplementacion → sin suplementacion ni patron_dias.
    let guardado = false, sinPatron = false, sinSupl = false;
    let r = await sbDirect("POST","patient_config?on_conflict=profile_id",payload);
    if(r.ok){ guardado = true; }
    else {
      const { suplementacion:_s, ...payloadSinSupl } = payload;
      r = await sbDirect("POST","patient_config?on_conflict=profile_id",payloadSinSupl);
      if(r.ok){ guardado = true; sinSupl = true; }
      else {
        const { patron_dias:_p, ...payloadSinAmbas } = payloadSinSupl;
        r = await sbDirect("POST","patient_config?on_conflict=profile_id",payloadSinAmbas);
        if(r.ok){ guardado = true; sinPatron = true; sinSupl = true; }
        else if(r.status === 0){
          // Sin red: encolar para cuando vuelva la conexión
          await sbReq("POST","patient_config?on_conflict=profile_id",payload);
        }
      }
    }
    if(!guardado && r.status !== 0){
      setGuardando(false);
      sfx&&sfx("error");
      showT&&showT({icon:"⚠️",
        title:lang==='en'?'Settings not saved':'No se pudo guardar tu configuración',
        sub:lang==='en'?'Try again in a moment':'Inténtalo de nuevo en un momento'});
      console.warn("[plan-config] upsert patient_config falló — revisa índice único profile_id y columna patron_dias");
      return;
    }
    if(sinPatron) console.warn("[plan-config] patron_dias no guardado (columna pendiente de migrar)");
    if(sinSupl)   console.warn("[plan-config] suplementacion no guardada (columna pendiente de migrar en patient_config)");
    setConfig&&setConfig(prev=>({...(prev||{}),...payload}));
    // Refrescar en el acto el pop-up de aviso por hora (sin esperar recarga):
    // misma clave localStorage que usa el recordatorio de Inicio.
    try{
      if(profile?.plan==='standard'){
        lsSet(`gbh:suplplan:${profile.id}`, normSupl({suplementacion:recsLimpios}));
      }
    }catch{}
    sfx&&sfx("recipe");
    // Generar la programación al instante (si el servidor está configurado)
    if(onGenerar){
      // La config ya está verificada en Supabase; el servidor puede leerla
      await onGenerar();
    } else {
      showT&&showT({icon:"✅",title:lang==='en'?'Plan saved!':'¡Plan guardado!',sub:lang==='en'?'Generate it from the Plan screen':'Genérala desde la pantalla de Plan'});
    }
    setGuardando(false);
    onClose&&onClose();
  }

  return(
    <div style={{paddingBottom:24}}>
      <div style={{padding:'18px 16px 8px',textAlign:'center'}}>
        <div style={{fontSize:34,marginBottom:6}}>🥗</div>
        <div style={{fontSize:18,fontWeight:900,color:T.t1,fontFamily:"'Nunito',sans-serif"}}>
          {primeraVez?(lang==='en'?'Set up your plan':'Define tu plan'):(lang==='en'?'Edit your plan':'Editar tu plan')}
        </div>
        <div style={{fontSize:12,color:T.t2,fontFamily:"'DM Sans',sans-serif",marginTop:4,lineHeight:1.5}}>
          {lang==='en'?'Tell us your preferences so we can build your weekly plan':'Cuéntanos tus preferencias para crear tu programación semanal'}
        </div>
      </div>

      {/* ── Tipo de alimentación ── */}
      <div style={{padding:'12px 16px'}}>
        <div style={{fontSize:11,color:T.au1,fontWeight:900,textTransform:'uppercase',letterSpacing:'0.1em',marginBottom:10}}>
          {lang==='en'?'1 · Diet type':'1 · Tipo de alimentación'}
        </div>
        <div style={{display:'flex',gap:8}}>
          {DIETAS.map(d=>{
            const sel=dieta===d.v;
            return(
              <button key={d.v} onClick={()=>setDieta(d.v)}
                style={{flex:1,background:sel?'rgba(88,204,2,0.15)':'rgba(255,255,255,0.04)',
                        border:sel?'2px solid '+T.bG:'1.5px solid rgba(255,255,255,0.1)',
                        borderRadius:16,padding:'14px 6px',cursor:'pointer',textAlign:'center',
                        transition:'all 0.2s'}}>
                <div style={{fontSize:26,marginBottom:4}}>{d.ic}</div>
                <div style={{fontSize:12,fontWeight:900,color:sel?T.g1:T.t1,fontFamily:"'Nunito',sans-serif"}}>{d.label}</div>
                <div style={{fontSize:9,color:T.t3,marginTop:2,fontFamily:"'DM Sans',sans-serif",lineHeight:1.2}}>{d.sub}</div>
              </button>
            );
          })}
        </div>
      </div>

      {/* ── Distribución calórica — tabla con flechas (sin deslizadores que se
            muevan solos al hacer scroll) ── */}
      <div style={{padding:'12px 16px'}}>
        <div style={{display:'flex',justifyContent:'space-between',alignItems:'center',marginBottom:10}}>
          <div style={{fontSize:11,color:T.au1,fontWeight:900,textTransform:'uppercase',letterSpacing:'0.1em'}}>
            {lang==='en'?'2 · Calorie split':'2 · Distribución de calorías'}
          </div>
          <div style={{fontSize:12,fontWeight:900,
            color:total===100?T.g1:'#FFB74D',
            background:total===100?'rgba(88,204,2,0.12)':'rgba(255,183,77,0.12)',
            border:`1.5px solid ${total===100?'rgba(88,204,2,0.4)':'rgba(255,183,77,0.4)'}`,
            borderRadius:10,padding:'4px 10px'}}>
            {total===100
              ? `✓ 100%`
              : (lang==='en'
                  ? `${total}% · ${total>100?`remove ${total-100}`:`add ${100-total}`}`
                  : `${total}% · ${total>100?`sobran ${total-100}`:`faltan ${100-total}`}`)}
          </div>
        </div>
        <div style={{background:'rgba(255,255,255,0.04)',border:'1.5px solid rgba(255,255,255,0.10)',borderRadius:16,overflow:'hidden'}}>
          {TOMAS.map((toma,i)=>{
            const v=dist[toma.k]||0;
            const kcalTxt=(profile?.target_kcal>0)?` · ${Math.round(profile.target_kcal*v/100)} kcal`:'';
            const Btn=({delta,dis,children})=>(
              <button onClick={()=>{!dis&&ajustarToma(toma.k,delta);}} disabled={dis}
                style={{width:40,height:40,borderRadius:12,border:`1.5px solid ${dis?'rgba(255,255,255,0.08)':T.bG}`,
                  background:dis?'rgba(255,255,255,0.03)':'rgba(88,204,2,0.12)',
                  color:dis?T.t3:T.g1,fontSize:18,fontWeight:900,cursor:dis?'default':'pointer',
                  display:'flex',alignItems:'center',justifyContent:'center',flexShrink:0,
                  fontFamily:"'Nunito',sans-serif",touchAction:'manipulation'}}>
                {children}
              </button>
            );
            return(
              <div key={toma.k} style={{display:'flex',alignItems:'center',gap:10,padding:'10px 12px',
                borderTop:i>0?'1px solid rgba(255,255,255,0.07)':'none',
                background:v===0?'rgba(255,255,255,0.02)':'transparent'}}>
                <div style={{flex:1,minWidth:0}}>
                  <div style={{fontSize:13.5,color:v===0?T.t3:T.t1,fontWeight:800,fontFamily:"'Nunito',sans-serif"}}>
                    {toma.ic} {toma.label}
                  </div>
                  <div style={{fontSize:10.5,color:T.t3,fontFamily:"'DM Sans',sans-serif",marginTop:1}}>
                    {v===0?(lang==='en'?'Skipped':'No haces esta toma'):kcalTxt.replace(' · ','')}
                  </div>
                </div>
                <Btn delta={-5} dis={v<=0}>−</Btn>
                <div style={{width:52,textAlign:'center',fontSize:16,fontWeight:900,
                  color:v===0?T.t3:T.g1,fontFamily:"'Nunito',sans-serif"}}>{v}%</div>
                <Btn delta={5} dis={v>=60}>+</Btn>
              </div>
            );
          })}
        </div>
        <button onClick={()=>setDist({dist_desayuno:20,dist_almuerzo:10,dist_comida:30,dist_merienda:10,dist_cena:30})}
          style={{marginTop:12,background:'none',border:'none',color:T.t3,fontSize:12,fontWeight:700,cursor:'pointer',textDecoration:'underline',fontFamily:"'DM Sans',sans-serif"}}>
          {lang==='en'?'Reset to recommended (20/10/30/10/30)':'Restablecer recomendado (20/10/30/10/30)'}
        </button>
      </div>

      {/* ── Patrón de repetición — ¿cuántos menús distintos a la semana? ── */}
      <div style={{padding:'12px 16px'}}>
        <div style={{fontSize:11,color:T.au1,fontWeight:900,textTransform:'uppercase',letterSpacing:'0.1em',marginBottom:4}}>
          {lang==='en'?'3 · How often do you cook?':'3 · ¿Cuántas veces cocinas a la semana?'}
        </div>
        <div style={{fontSize:11,color:T.t3,fontFamily:"'DM Sans',sans-serif",marginBottom:10,lineHeight:1.4}}>
          {lang==='en'
            ?'Repeating meals on several days = less cooking and a cheaper shopping list.'
            :'Repetir comidas varios días = cocinar menos y lista de la compra más barata.'}
        </div>
        <div style={{display:'grid',gridTemplateColumns:'1fr 1fr',gap:8}}>
          {PATRONES_OPC.map(p=>{
            const sel=patron===p.v;
            return(
              <button key={p.v} onClick={()=>setPatron(p.v)}
                style={{background:sel?'rgba(88,204,2,0.12)':'rgba(255,255,255,0.04)',
                  border:`2px solid ${sel?T.g1:'rgba(255,255,255,0.10)'}`,
                  borderRadius:16,padding:'12px 10px',cursor:'pointer',textAlign:'center'}}>
                <div style={{fontSize:24,marginBottom:4}}>{p.ic}</div>
                <div style={{fontSize:12.5,fontWeight:900,color:sel?T.g1:T.t1,fontFamily:"'Nunito',sans-serif"}}>{p.label}</div>
                <div style={{fontSize:9.5,color:T.t3,marginTop:3,fontFamily:"'DM Sans',sans-serif",lineHeight:1.3}}>{p.sub}</div>
              </button>
            );
          })}
        </div>
      </div>

      {/* ── Recordatorios de suplementación/medicación (opcional, máx. 3) ── */}
      <div style={{padding:'12px 16px'}}>
        <div style={{fontSize:11,color:T.au1,fontWeight:900,textTransform:'uppercase',letterSpacing:'0.1em',marginBottom:4}}>
          {lang==='en'?'4 · Supplement/medication reminders':'4 · Recordatorios de suplementación/medicación'}
        </div>
        <div style={{fontSize:11,color:T.t3,fontFamily:"'DM Sans',sans-serif",marginBottom:10,lineHeight:1.4}}>
          {lang==='en'
            ?`Optional. Up to ${MAX_RECS}: name it and set the time. Each one completed = +5 💎.`
            :`Opcional. Hasta ${MAX_RECS}: ponles nombre y hora. Cada uno completado = +5 💎.`}
        </div>
        <div style={{display:'flex',flexDirection:'column',gap:8}}>
          {recs.map((r,i)=>(
            <div key={i} style={{background:'rgba(201,168,76,0.06)',border:`1.5px dashed ${T.au1}`,borderRadius:16,padding:'10px 12px'}}>
              <div style={{display:'flex',gap:8,marginBottom:8}}>
                <input value={r.nombre} maxLength={40}
                  placeholder={lang==='en'?'Name (e.g. Creatine 5g)':'Nombre (ej: Creatina 5g)'}
                  onChange={e=>setRecs(rs=>rs.map((x,j)=>j===i?{...x,nombre:e.target.value}:x))}
                  style={{flex:1,minWidth:0,background:'rgba(255,255,255,0.05)',border:'1.5px solid rgba(255,255,255,0.12)',
                    borderRadius:12,padding:'10px 12px',color:T.t1,fontSize:13.5,fontWeight:700,
                    fontFamily:"'Nunito',sans-serif",outline:'none'}}/>
                <button onClick={()=>setRecs(rs=>rs.filter((_,j)=>j!==i))}
                  style={{width:40,flexShrink:0,background:'rgba(255,82,82,0.10)',border:'1.5px solid rgba(255,82,82,0.35)',
                    borderRadius:12,color:'#FF8A80',fontSize:16,fontWeight:900,cursor:'pointer'}}>✕</button>
              </div>
              <div style={{display:'flex',gap:8,alignItems:'stretch'}}>
                {['Suplemento','Medicación'].map(tp=>{
                  const sel=r.tipo===tp;
                  return(
                    <button key={tp} onClick={()=>setRecs(rs=>rs.map((x,j)=>j===i?{...x,tipo:tp}:x))}
                      style={{flex:1,background:sel?'rgba(201,168,76,0.16)':'rgba(255,255,255,0.04)',
                        border:`1.5px solid ${sel?T.au1:'rgba(255,255,255,0.10)'}`,borderRadius:12,
                        padding:'8px 4px',cursor:'pointer',fontSize:11.5,fontWeight:900,
                        color:sel?T.au1:T.t3,fontFamily:"'Nunito',sans-serif"}}>
                      {SUPL_IC[tp]} {lang==='en'?(tp==='Medicación'?'Medication':'Supplement'):tp}
                    </button>
                  );
                })}
                <input type="time" value={r.hora}
                  onChange={e=>setRecs(rs=>rs.map((x,j)=>j===i?{...x,hora:e.target.value}:x))}
                  style={{width:104,flexShrink:0,background:'rgba(255,255,255,0.05)',
                    border:`1.5px solid ${horaOk(r.hora)?'rgba(255,255,255,0.12)':'rgba(255,183,77,0.5)'}`,
                    borderRadius:12,padding:'8px 10px',color:T.t1,fontSize:13.5,fontWeight:800,
                    fontFamily:"'Nunito',sans-serif",outline:'none',colorScheme:'dark'}}/>
              </div>
            </div>
          ))}
          {recs.length<MAX_RECS&&(
            <button onClick={()=>setRecs(rs=>[...rs,{nombre:'',tipo:'Suplemento',hora:''}])}
              style={{background:'rgba(255,255,255,0.04)',border:'1.5px dashed rgba(255,255,255,0.2)',
                borderRadius:16,padding:'12px 16px',cursor:'pointer',fontSize:13,fontWeight:800,
                color:T.t2,fontFamily:"'Nunito',sans-serif"}}>
              ＋ {lang==='en'?'Add reminder':'Añadir recordatorio'} ({recs.length}/{MAX_RECS})
            </button>
          )}
        </div>
        {recsAMedias&&(
          <div style={{marginTop:8,fontSize:11.5,color:'#FFB74D',fontWeight:700,fontFamily:"'DM Sans',sans-serif"}}>
            ⚠️ {lang==='en'?'Complete name AND time on every reminder (or remove it).':'Completa nombre Y hora en cada recordatorio (o elimínalo).'}
          </div>
        )}
      </div>

      {/* ── Guardar ── */}
      <div style={{padding:'16px 16px 0',display:'flex',flexDirection:'column',gap:10}}>
        <button onClick={guardar} disabled={guardando||total!==100||recsAMedias}
          style={{background:(total===100&&!recsAMedias)?'linear-gradient(135deg,'+T.g1+','+T.g2+')':'rgba(255,255,255,0.08)',
                  color:(total===100&&!recsAMedias)?'#fff':T.t3,fontWeight:900,fontSize:15,borderRadius:18,
                  padding:'16px 24px',border:'none',cursor:(total===100&&!recsAMedias)?'pointer':'default',
                  boxShadow:(total===100&&!recsAMedias)?'0 4px 0 '+T.g3:'none',fontFamily:"'Nunito',sans-serif"}}>
          {guardando?(lang==='en'?'Generating…':'Generando…'):total!==100?(lang==='en'?'Must total 100%':'Debe sumar 100%'):recsAMedias?(lang==='en'?'Finish reminders':'Completa los recordatorios'):(onGenerar?(lang==='en'?'Save & generate plan':'Guardar y generar plan'):(lang==='en'?'Save my plan':'Guardar mi plan'))}
        </button>
        {!primeraVez&&(
          <button onClick={onClose} style={{background:'none',border:'none',color:T.t3,fontSize:13,fontWeight:700,cursor:'pointer',fontFamily:"'Nunito',sans-serif"}}>
            {lang==='en'?'Cancel':'Cancelar'}
          </button>
        )}
      </div>
    </div>
  );
}

// ─── RewardsModal — tabla de recompensas por nivel ───────────────────────────
function RewardsModal({onClose, currentLevel}){
  const t=useLang();
  const [filter, setFilter] = React.useState("all");
  const rows = [];
  for(let i=1;i<=500;i++){
    const r=LEVEL_REWARDS[i];
    if(filter==="freemeal" && !r.freeMeal) continue;
    if(filter==="report"   && !r.report)  continue;
    if(filter==="frame"    && !r.frame)   continue;
    rows.push({l:i,...r});
  }
  const lv=currentLevel||1;
  return(
    <div style={{position:"fixed",inset:0,zIndex:12000,background:"rgba(0,0,0,0.88)",
      backdropFilter:"blur(6px)",display:"flex",flexDirection:"column",
      alignItems:"center",justifyContent:"flex-start",overflowY:"auto",padding:"20px 0 40px"}}>
      <div style={{width:"100%",maxWidth:420,padding:"0 16px"}}>
        <div style={{display:"flex",justifyContent:"space-between",alignItems:"center",marginBottom:16}}>
          <div>
            <div style={{fontSize:11,color:T.au1,fontWeight:900,textTransform:"uppercase",
              letterSpacing:"0.1em",marginBottom:2}}>🎁 {t("rewardsTitle")}</div>
            <div style={{fontSize:22,fontWeight:900,color:T.wh}}>{t("rewardsByLevel")}</div>
          </div>
          <button onClick={onClose} style={{background:T.bgCard,border:`1.5px solid ${T.bW}`,
            borderRadius:12,padding:"8px 16px",color:T.t1,fontWeight:700,cursor:"pointer",
            fontSize:13,fontFamily:"'Nunito',sans-serif"}}>{t("rewardsClose")}</button>
        </div>
        <div style={{display:"flex",gap:8,marginBottom:14}}>
          {[["all",t("rewardsAll")],["freemeal",t("rewardsFreeMeal")],["report",t("rewardsReports")],["frame",t("rewardsFrames")]].map(([k,l])=>(
            <button key={k} onClick={()=>setFilter(k)} style={{
              flex:1,padding:"8px 4px",borderRadius:12,border:"none",fontSize:11,fontWeight:900,
              cursor:"pointer",fontFamily:"'Nunito',sans-serif",
              background:filter===k?T.au1:"rgba(255,255,255,0.07)",
              color:filter===k?"#000":T.t2}}>
              {l}
            </button>
          ))}
        </div>
        <div style={{display:"flex",flexDirection:"column",gap:6}}>
          {rows.slice(0,200).map(({l,gems,shield,freeMeal,special})=>{
            const done=l<=lv,current=l===lv;
            const bg=current?"rgba(255,200,0,0.15)":done?"rgba(88,204,2,0.08)":"rgba(255,255,255,0.04)";
            const border=current?`1.5px solid ${T.au2}`:done?`1px solid rgba(88,204,2,0.2)`:`1px solid rgba(255,255,255,0.06)`;
            return(
              <div key={l} style={{background:bg,border,borderRadius:14,padding:"10px 14px",display:"flex",alignItems:"center",gap:10}}>
                <div style={{width:44,height:44,borderRadius:12,flexShrink:0,
                  background:done?"rgba(88,204,2,0.15)":current?"rgba(255,200,0,0.15)":"rgba(255,255,255,0.06)",
                  display:"flex",flexDirection:"column",alignItems:"center",justifyContent:"center",
                  border:done?`1.5px solid rgba(88,204,2,0.4)`:current?`1.5px solid ${T.au2}`:`1px solid rgba(255,255,255,0.1)`}}>
                  <div style={{fontSize:9,color:done?T.g1:current?T.au1:T.t3,fontWeight:900}}>
                    {done&&!current?"✅":"Lv"}
                  </div>
                  <div style={{fontSize:13,fontWeight:900,color:done?T.g2:current?T.au1:T.t2}}>{l}</div>
                </div>
                <div style={{flex:1,display:"flex",flexWrap:"wrap",gap:6,alignItems:"center"}}>
                  <span style={{fontSize:12,fontWeight:700,color:T.au1}}>+{gems}💎</span>
                  {freeMeal&&<span style={{fontSize:12,fontWeight:900,color:"#FFD700",background:"rgba(255,200,0,0.12)",borderRadius:8,padding:"2px 8px"}}>{t("rewardsFreeMealTag")}</span>}
                  {shield&&<span style={{fontSize:11,color:"#64B5F6",fontWeight:700}}>🛡️ {t("streakShield").replace("🛡️ ","")}</span>}
                  {special&&l===500&&<span style={{fontSize:11,color:"#CE82FF",fontWeight:700}}>{t("rewardsChampion")}</span>}
                </div>
              </div>
            );
          })}
          {filter==="all"&&<div style={{textAlign:"center",padding:"12px 0",fontSize:11,
            color:T.t3,fontFamily:"'DM Sans',sans-serif"}}>
            {t("rewardsShowingLevels",{n:500-lv})}
          </div>}
        </div>
      </div>
    </div>
  );
}


// ─── Error Boundary ──────────────────────────────────────────────────────────
class ErrorBoundary extends React.Component {
  constructor(props){ super(props); this.state={err:null}; }
  static getDerivedStateFromError(e){ return {err:e}; }
  componentDidCatch(e){ console.error("GBH:",e.message); }
  render(){
    if(this.state.err){
      const lang=lsGet("gbh:lang","es");
      return(
      <div style={{minHeight:"100vh",background:"#0A1A0F",display:"flex",
        flexDirection:"column",alignItems:"center",justifyContent:"center",
        padding:24,color:"white",fontFamily:"monospace"}}>
        <div style={{fontSize:48,marginBottom:12}}>💥</div>
        <div style={{fontSize:16,fontWeight:700,color:"#FF4B4B",marginBottom:12}}>
          {lang==="en"?"App error":"Error en la app"}
        </div>
        <div style={{fontSize:12,color:"rgba(255,255,255,0.75)",background:"rgba(255,0,0,0.12)",
          border:"1px solid rgba(255,0,0,0.3)",borderRadius:8,padding:16,maxWidth:360,
          wordBreak:"break-all",whiteSpace:"pre-wrap",textAlign:"left",lineHeight:1.6}}>
          {this.state.err?.message||String(this.state.err)}
        </div>
        <button onClick={()=>this.setState({err:null})}
          style={{marginTop:20,padding:"12px 28px",background:"#58CC02",border:"none",
            borderRadius:14,color:"white",fontWeight:900,cursor:"pointer",fontSize:15}}>
          {lang==="en"?"Retry":"Reintentar"}
        </button>
      </div>
      );
    }
    return this.props.children;
  }
}
// ─── Botón "Compartir receta" (solo recetas del escaparate público) ──────────
// Aparece en la ficha del recetario y en el visor de la toma del plan cuando la
// receta tiene slug público. Comparte la URL /recetas/<slug>: cada paciente que
// comparte su cena es un anuncio del escaparate con la marca GBH.
function BotonCompartirReceta({rec,lang,sfx,style}){
  const [copiado,setCopiado]=useState(false);
  if(!rec?.slug||!rec?.publica) return null;
  const compartir=async()=>{
    sfx&&sfx("tap");
    const url=`https://gbh-app.vercel.app/recetas/${rec.slug}`;
    const msg=lang==='en'
      ?`${emojiPlato(rec.nombre,rec.tipo)} ${rec.nombre} — ${Math.round(rec.calorias)} kcal, ${Math.round(rec.proteinas_g)} g protein. Full recipe from my GBH Nutrición plan: ${url}`
      :`${emojiPlato(rec.nombre,rec.tipo)} ${rec.nombre} — ${Math.round(rec.calorias)} kcal y ${Math.round(rec.proteinas_g)} g de proteína. Receta completa de mi plan de GBH Nutrición: ${url}`;
    try{ if(navigator.share){ await navigator.share({text:msg}); return; } }
    catch(e){ if(e?.name==="AbortError") return; }
    try{ await navigator.clipboard.writeText(msg); setCopiado(true); setTimeout(()=>setCopiado(false),2200); }catch{}
  };
  return(
    <button onClick={compartir} style={{width:'100%',marginTop:12,padding:'13px',borderRadius:14,
      border:`1.5px solid ${T.au1}`,background:copiado?'rgba(255,255,255,0.10)':'rgba(255,200,0,0.08)',
      color:T.au1,fontWeight:900,fontSize:13.5,cursor:'pointer',fontFamily:"'Nunito',sans-serif",...style}}>
      {copiado?(lang==='en'?'✅ Link copied!':'✅ ¡Enlace copiado!')
              :`📤 ${lang==='en'?'Share this recipe':'Compartir esta receta'}`}
    </button>
  );
}

// ═══ RECETARIO PÚBLICO (escaparate de captación, sin login) ══════════════════
// /recetas → parrilla de las recetas con publica=true · /recetas/<slug> → ficha.
// Es la puerta de entrada ANTES de la cuenta: quien llega desde un Reel o desde
// el link compartido por un paciente ve la receta completa con sus macros, y el
// CTA lleva al registro (trial 7 días). La ruta se decide UNA vez al cargar
// (constante de sesión) para no violar las reglas de hooks; volver al registro
// es navegación completa (location.href), no pushState.
const RUTA_PUBLICA = typeof window!=='undefined' && /^\/recetas(\/|$)/.test(window.location.pathname);

function RecetasPublicas(){
  const [recetas,setRecetas]=useState(null);          // null=cargando · []=error/vacío
  const [slug,setSlug]=useState(()=>{
    const m=window.location.pathname.match(/^\/recetas\/([a-z0-9-]+)/);
    return m?m[1]:null;
  });
  useEffect(()=>{
    sbReq("GET","recipes?publica=eq.true&select=id_receta,nombre,tipo,categoria,calorias,proteinas_g,hidratos_g,grasas_g,ingredientes,instrucciones,raciones,slug&order=nombre.asc")
      .then(rows=>setRecetas(Array.isArray(rows)?rows:[]))
      .catch(()=>setRecetas([]));
    const onPop=()=>{
      const m=window.location.pathname.match(/^\/recetas\/([a-z0-9-]+)/);
      setSlug(m?m[1]:null);
    };
    window.addEventListener("popstate",onPop);
    return ()=>window.removeEventListener("popstate",onPop);
  },[]);
  const abrir=(s)=>{ window.history.pushState({},"",`/recetas/${s}`); setSlug(s); window.scrollTo(0,0); };
  const volver=()=>{ window.history.pushState({},"","/recetas"); setSlug(null); window.scrollTo(0,0); };
  const irRegistro=()=>{ window.location.href="/"; };
  const r = slug && recetas ? recetas.find(x=>x.slug===slug) : null;

  const Chip=({v,l,c})=>(
    <div style={{flex:1,background:"rgba(255,255,255,0.05)",borderRadius:12,padding:"10px 6px",textAlign:"center"}}>
      <div style={{fontSize:16,fontWeight:900,color:c||T.t1,fontFamily:"'Nunito',sans-serif"}}>{v}</div>
      <div style={{fontSize:9.5,color:T.t2,fontFamily:"'DM Sans',sans-serif"}}>{l}</div>
    </div>
  );
  const CTA=()=>(
    <div style={{background:"linear-gradient(180deg,#1d3a14,#142a0e)",border:`2px solid ${T.au1}`,
      borderRadius:20,padding:"22px 18px",textAlign:"center",marginTop:22}}>
      <div style={{fontSize:30,marginBottom:8}}>🌱</div>
      <div style={{fontWeight:900,fontSize:16.5,color:T.au1,fontFamily:"'Nunito',sans-serif",marginBottom:8,lineHeight:1.35}}>
        ¿Y si tu semana entera estuviera organizada así, a tus calorías?
      </div>
      <div style={{fontSize:12.5,color:T.t1,fontFamily:"'DM Sans',sans-serif",lineHeight:1.6,marginBottom:16}}>
        Programación semanal personalizada, recetas con macros exactos y lista de la compra automática.
        Con un nutricionista real detrás.
      </div>
      <button onClick={irRegistro} style={{width:"100%",padding:"15px",borderRadius:16,border:"none",cursor:"pointer",
        background:`linear-gradient(135deg,${T.g1},${T.g2})`,color:"#fff",fontWeight:900,fontSize:15,
        fontFamily:"'Nunito',sans-serif",boxShadow:`0 5px 0 ${T.g3}`}}>
        Pruébalo gratis 7 días
      </button>
      <div style={{fontSize:10,color:T.t3,marginTop:10,fontFamily:"'DM Sans',sans-serif"}}>
        Sin tarjeta · Cancela cuando quieras
      </div>
    </div>
  );
  const compartir=async(rec)=>{
    const url=`https://gbh-app.vercel.app/recetas/${rec.slug}`;
    const msg=`${emojiPlato(rec.nombre,rec.tipo)} ${rec.nombre} — ${Math.round(rec.calorias)} kcal y ${Math.round(rec.proteinas_g)} g de proteína, receta completa de GBH Nutrición: ${url}`;
    try{ if(navigator.share){ await navigator.share({text:msg}); return; } }
    catch(e){ if(e?.name==="AbortError") return; }
    try{ await navigator.clipboard.writeText(msg); alert("Enlace copiado 📋"); }catch{}
  };

  return(
    <div style={{minHeight:"100vh",background:T.bg,color:T.t1,fontFamily:"'DM Sans',sans-serif"}}>
      <div style={{maxWidth:520,margin:"0 auto",padding:"18px 16px 40px"}}>
        {/* Cabecera de marca */}
        <div style={{display:"flex",alignItems:"center",justifyContent:"space-between",marginBottom:18}}>
          <div style={{fontWeight:900,fontSize:15,color:T.au1,fontFamily:"'Nunito',sans-serif",letterSpacing:"0.06em"}}>
            🌱 GBH NUTRICIÓN
          </div>
          <button onClick={irRegistro} style={{background:"rgba(255,200,0,0.10)",border:`1.5px solid ${T.au1}`,
            borderRadius:12,padding:"8px 14px",color:T.au1,fontWeight:900,fontSize:12,cursor:"pointer",
            fontFamily:"'Nunito',sans-serif"}}>
            Probar gratis
          </button>
        </div>

        {recetas===null&&(
          <div style={{textAlign:"center",padding:"60px 0",color:T.t2}}>Cargando recetas…</div>
        )}

        {recetas&&!r&&(
          <>
            <div style={{fontWeight:900,fontSize:24,fontFamily:"'Nunito',sans-serif",marginBottom:6}}>
              Recetas con macros exactos
            </div>
            <div style={{fontSize:13,color:T.t2,lineHeight:1.6,marginBottom:18}}>
              Una muestra del recetario que siguen nuestros pacientes: calorías y macros calculados
              al gramo, listas para cocinar hoy.
            </div>
            {recetas.length===0&&(
              <div style={{textAlign:"center",padding:"40px 0",color:T.t2}}>
                No se pudieron cargar las recetas. Inténtalo de nuevo en un momento.
              </div>
            )}
            <div style={{display:"flex",flexDirection:"column",gap:10}}>
              {recetas.map(rec=>(
                <button key={rec.slug} onClick={()=>abrir(rec.slug)} style={{display:"flex",alignItems:"center",gap:14,
                  background:"rgba(255,255,255,0.04)",border:"1.5px solid rgba(255,255,255,0.08)",borderRadius:16,
                  padding:"14px 16px",cursor:"pointer",textAlign:"left",width:"100%",boxSizing:"border-box"}}>
                  <div style={{fontSize:30,flexShrink:0}}>{emojiPlato(rec.nombre,rec.tipo)}</div>
                  <div style={{flex:1,minWidth:0}}>
                    <div style={{fontWeight:800,fontSize:14.5,color:T.t1,fontFamily:"'Nunito',sans-serif",marginBottom:3}}>
                      {rec.nombre}
                    </div>
                    <div style={{fontSize:11.5,color:T.t2}}>
                      {Math.round(rec.calorias)} kcal · {Math.round(rec.proteinas_g)} g proteína
                    </div>
                  </div>
                  <div style={{color:T.t3,fontSize:20,flexShrink:0}}>›</div>
                </button>
              ))}
            </div>
            <CTA/>
          </>
        )}

        {recetas&&slug&&!r&&(
          <div style={{textAlign:"center",padding:"60px 0",color:T.t2}}>
            Esta receta no existe o dejó de ser pública.
            <div style={{marginTop:14}}>
              <button onClick={volver} style={{background:"none",border:`1.5px solid ${T.au1}`,borderRadius:12,
                padding:"10px 18px",color:T.au1,fontWeight:900,cursor:"pointer",fontFamily:"'Nunito',sans-serif"}}>
                Ver todas las recetas
              </button>
            </div>
          </div>
        )}

        {r&&(
          <>
            <button onClick={volver} style={{background:"none",border:"none",color:T.t2,fontWeight:800,
              fontSize:13,cursor:"pointer",fontFamily:"'Nunito',sans-serif",padding:"0 0 14px",display:"block"}}>
              ‹ Todas las recetas
            </button>
            <div style={{display:"flex",alignItems:"center",gap:14,marginBottom:14}}>
              <div style={{fontSize:44,flexShrink:0}}>{emojiPlato(r.nombre,r.tipo)}</div>
              <div>
                <div style={{fontWeight:900,fontSize:20,fontFamily:"'Nunito',sans-serif",lineHeight:1.25}}>{r.nombre}</div>
                <div style={{fontSize:11.5,color:T.au1,fontWeight:800,marginTop:3}}>{r.tipo}{r.categoria?` · ${r.categoria}`:''}</div>
              </div>
            </div>
            <div style={{display:"flex",gap:8,marginBottom:16}}>
              <Chip v={`${Math.round(r.calorias)}`} l="kcal" c={T.au1}/>
              <Chip v={`${Math.round(r.proteinas_g)}g`} l="proteínas"/>
              <Chip v={`${Math.round(r.hidratos_g)}g`} l="hidratos"/>
              <Chip v={`${Math.round(r.grasas_g)}g`} l="grasas"/>
            </div>
            <div style={{background:"rgba(255,255,255,0.04)",borderRadius:16,padding:"16px",marginBottom:12}}>
              <div style={{fontSize:10,color:T.au1,textTransform:"uppercase",letterSpacing:"0.1em",fontWeight:900,marginBottom:10}}>
                🛒 Ingredientes{r.raciones>1?` (${r.raciones} raciones)`:''}
              </div>
              {String(r.ingredientes||'').split(/[;\n]|, (?=\d)/).map((ing,i)=>ing.trim()&&(
                <div key={i} style={{fontSize:13.5,lineHeight:1.7,color:T.t1}}>• {ing.trim()}</div>
              ))}
            </div>
            <div style={{background:"rgba(255,255,255,0.04)",borderRadius:16,padding:"16px"}}>
              <div style={{fontSize:10,color:T.au1,textTransform:"uppercase",letterSpacing:"0.1em",fontWeight:900,marginBottom:10}}>
                👨‍🍳 Preparación
              </div>
              <div style={{fontSize:13.5,lineHeight:1.8,color:T.t1,whiteSpace:"pre-wrap"}}>{r.instrucciones}</div>
            </div>
            <button onClick={()=>compartir(r)} style={{width:"100%",marginTop:12,padding:"13px",borderRadius:14,
              border:`1.5px solid ${T.au1}`,background:"rgba(255,200,0,0.08)",color:T.au1,fontWeight:900,
              fontSize:14,cursor:"pointer",fontFamily:"'Nunito',sans-serif"}}>
              📤 Compartir esta receta
            </button>
            <CTA/>
          </>
        )}
      </div>
    </div>
  );
}

export default function App(){
  if(RUTA_PUBLICA) return <ErrorBoundary><RecetasPublicas/></ErrorBoundary>;
  return <ErrorBoundary><GBHApp/></ErrorBoundary>;
}
