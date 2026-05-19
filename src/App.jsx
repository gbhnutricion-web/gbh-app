import React, { useState, useEffect, useCallback, useMemo, useRef } from "react";

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
    accountExists:"Tu cuenta existe — recuperaremos todos tus datos.",
    verifying:"Verificando...",
    recoverAccount:"Recuperar mi cuenta 🔄",
    startAdventure:"¡Empezar mi aventura! 🚀",
    noConnRecover:"Sin conexión. Conéctate a internet para recuperar tu cuenta.",
    // Nav
    tabHome:"Inicio", tabRecipe:"Receta", tabWeight:"Peso",
    tabRanking:"Ranking", tabAchievements:"Logros",
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
    // Recipe tab
    recipeOfDay:"🍰 Receta del día",
    calories:"Calorías", protein:"Proteína", carbs:"Hidratos", fat:"Grasas",
    ingredients:"🛒 Ingredientes", preparation:"👨‍🍳 Preparación",
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
    closeBtn:"✕ Cerrar",
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
    accountExists:"Your account exists — we'll recover all your data.",
    verifying:"Verifying...",
    recoverAccount:"Recover my account 🔄",
    startAdventure:"Start my adventure! 🚀",
    noConnRecover:"No connection. Connect to the internet to recover your account.",
    // Nav
    tabHome:"Home", tabRecipe:"Recipe", tabWeight:"Weight",
    tabRanking:"Ranking", tabAchievements:"Medals",
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
    // Recipe tab
    recipeOfDay:"🍰 Recipe of the day",
    calories:"Calories", protein:"Protein", carbs:"Carbs", fat:"Fat",
    ingredients:"🛒 Ingredients", preparation:"👨‍🍳 Preparation",
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
    closeBtn:"✕ Close",
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
    [1047,1319,1568,1760,2093].forEach((f,i)=>
      this._tone(f,"sine",0.1,0.18,i*0.06));
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
// ─────────────────────────────────────────────────────────────────────────────
import { ComposedChart, Line, XAxis, YAxis, Tooltip, ResponsiveContainer } from "recharts";

// ─── Supabase ────────────────────────────────────────────────────────────────
const SB  = "https://kszytoufvqogcitzbzqs.supabase.co";
const KEY = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Imtzenl0b3VmdnFvZ2NpdHpienFzIiwicm9sZSI6ImFub24iLCJpYXQiOjE3Nzg1OTQzOTgsImV4cCI6MjA5NDE3MDM5OH0.OcOUrgbyAL6aPBSW_hSNapmwSYMV5mNjLrJCmRghg-c";

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
  {id:"d1",   icon:"🌱",t:"Primer Paso",       d:"Primer check-in",            xp:20, g:10},
  {id:"s7",   icon:"🔥",t:"Semana de Fuego",    d:"7 días consecutivos",        xp:70, g:50},
  {id:"s30",  icon:"💪",t:"Hábito Forjado",     d:"30 días consecutivos",       xp:200,g:150,r:"📄 PDF extra de recetas"},
  {id:"s100", icon:"🏆",t:"Centenario",         d:"100 días consecutivos",      xp:500,g:300,r:"🤝 Consulta presencial gratuita"},
  {id:"s365", icon:"👑",t:"Leyenda GBH",        d:"365 días seguidos",          xp:1500,g:1000,r:"📚 Recetario anual completo"},
  {id:"w1",   icon:"⚖️",t:"Báscula Activada",   d:"Primera medición de peso",   xp:15, g:10},
  {id:"w8",   icon:"📊",t:"8 Semanas al Día",   d:"8 pesajes registrados",      xp:100,g:80},
  {id:"w12",  icon:"📈",t:"Trimestre Fiel",     d:"12 pesajes registrados",     xp:200,g:150,r:"🎯 Análisis trimestral personalizado"},
  {id:"pW",   icon:"⭐",t:"Semana Perfecta",    d:"4 misiones 7 días seguidos", xp:100,g:60},
];

// ─── Helpers ─────────────────────────────────────────────────────────────────
const toKey=(d=new Date())=>d.toISOString().slice(0,10);
const isWeekend=()=>{const d=new Date().getDay();return d===0||d===6;};
const WLABELS=["L","M","X","J","V","S","D"];


// ─── localStorage helpers ────────────────────────────────────────────────────
const lsGet=(k,f)=>{try{const v=localStorage.getItem(k);return v?JSON.parse(v):f;}catch{return f;}};
const lsSet=(k,v)=>{try{localStorage.setItem(k,JSON.stringify(v));}catch{}};

// ─── Cola de sincronización offline ──────────────────────────────────────────
// Cada operación que no llega a Supabase se encola en localStorage.
// Cuando vuelve la conexión, se vacía automáticamente.
const QUEUE_KEY = "gbh:sync_queue";

function enqueue(op){
  // op = { id, method, path, body, ts }
  const q = lsGet(QUEUE_KEY, []);
  // Si ya existe la misma path+method, reemplazar (evita duplicados de PATCH)
  const idx = q.findIndex(x => x.path === op.path && x.method === op.method);
  if(idx >= 0) q[idx] = op; else q.push(op);
  lsSet(QUEUE_KEY, q);
}

async function flushQueue(){
  const q = lsGet(QUEUE_KEY, []);
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
      if(!r.ok) failed.push(op);
    } catch {
      failed.push(op); // sin red, volver a encolar
    }
  }
  lsSet(QUEUE_KEY, failed); // sólo quedan los que fallaron
  return failed.length === 0;
}

// ─── sbReq: offline-first ────────────────────────────────────────────────────
// GET → siempre intenta red, sin encolar si falla
// POST/PATCH → intenta red; si falla, encola para después
const sbReq = async(method, path, body=null) => {
  const headers = {
    "apikey": KEY,
    "Authorization": `Bearer ${KEY}`,
    "Content-Type": "application/json",
    "Prefer": method==="POST" ? "return=representation, resolution=merge-duplicates" : "",
  };
  try {
    const r = await fetch(`${SB}/rest/v1/${path}`, {
      method, headers, body: body ? JSON.stringify(body) : null,
    });
    if(!r.ok) throw new Error("not ok");
    return method==="DELETE" ? true : r.json();
  } catch {
    // Sin red o error — encolar si es escritura
    if(method !== "GET" && body){
      enqueue({ id: crypto.randomUUID(), method, path, body, ts: Date.now() });
    }
    return null;
  }
};



// ─── Avatar base GBH (oveja 3D) — fondo transparente ────────────────────────
// Las 3 resoluciones evitan re-escalar en cada uso

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
  // Formato: {id, icon, title, desc, type, goal, xp, gems}
  // type: "diet_days"|"perfect_days"|"steps_day"|"hydration_days"|"sleep_days"|"quiz_days"|"streak_keep"|"weight_reg"|"xp_week"
  {id:"c01",icon:"🥗",title:"Semana de dieta",       desc:"Registra la dieta 5 días esta semana",        type:"diet_days",       goal:5,  xp:40, gems:10},
  {id:"c02",icon:"💪",title:"Semana perfecta",        desc:"Completa 3 días perfectos (4 misiones)",      type:"perfect_days",    goal:3,  xp:60, gems:15},
  {id:"c03",icon:"👟",title:"10k tres veces",         desc:"Llega a 10.000 pasos al menos 3 días",        type:"steps_day",       goal:3,  xp:45, gems:10},
  {id:"c04",icon:"💧",title:"Hidratación constante",  desc:"Completa la hidratación 4 días esta semana",  type:"hydration_days",  goal:4,  xp:35, gems:8 },
  {id:"c05",icon:"😴",title:"Duerme bien",            desc:"Duerme 7h al menos 4 días esta semana",       type:"sleep_days",      goal:4,  xp:35, gems:8 },
  {id:"c06",icon:"🧠",title:"Semana quiz",            desc:"Haz el quiz 4 días esta semana",              type:"quiz_days",       goal:4,  xp:50, gems:12},
  {id:"c07",icon:"🔥",title:"Mantén la racha",        desc:"No pierdas la racha durante 5 días seguidos", type:"streak_keep",     goal:5,  xp:55, gems:12},
  {id:"c08",icon:"⚖️",title:"Pesaje semanal",         desc:"Registra tu peso este fin de semana",         type:"weight_reg",      goal:1,  xp:30, gems:8 },
  {id:"c09",icon:"⚡",title:"Acumula XP",             desc:"Consigue 80 XP esta semana",                  type:"xp_week",         goal:80, xp:50, gems:15},
  {id:"c10",icon:"🍽️",title:"Dieta impecable",        desc:"Registra la dieta los 7 días de la semana",   type:"diet_days",       goal:7,  xp:80, gems:20},
  {id:"c11",icon:"🌟",title:"Semana de lujo",         desc:"Completa 5 días perfectos (4 misiones)",      type:"perfect_days",    goal:5,  xp:90, gems:25},
  {id:"c12",icon:"🏃",title:"Maratonista",            desc:"Llega a 10.000 pasos 5 días esta semana",     type:"steps_day",       goal:5,  xp:60, gems:15},
  {id:"c13",icon:"🚿",title:"Hidratación total",      desc:"Completa la hidratación los 7 días",          type:"hydration_days",  goal:7,  xp:55, gems:14},
  {id:"c14",icon:"🛌",title:"Sueño de campeón",       desc:"Duerme 7h los 7 días de la semana",           type:"sleep_days",      goal:7,  xp:55, gems:14},
  {id:"c15",icon:"📚",title:"Quiz adicto",            desc:"Haz el quiz los 7 días de la semana",         type:"quiz_days",       goal:7,  xp:70, gems:18},
  {id:"c16",icon:"🐑",title:"Racha imparable",        desc:"Mantén la racha los 7 días de la semana",     type:"streak_keep",     goal:7,  xp:75, gems:18},
  {id:"c17",icon:"📈",title:"Máquina de XP",          desc:"Consigue 150 XP esta semana",                 type:"xp_week",         goal:150,xp:75, gems:20},
  {id:"c18",icon:"🎯",title:"Constancia total",       desc:"Registra la dieta y duerme bien 5 días",      type:"perfect_days",    goal:4,  xp:65, gems:16},
  {id:"c19",icon:"💦",title:"Semana saludable",       desc:"Hidratación y sueño completos 5 días",        type:"hydration_days",  goal:5,  xp:50, gems:12},
  {id:"c20",icon:"🏆",title:"Campeón total",          desc:"Completa las 4 misiones 6 días esta semana",  type:"perfect_days",    goal:6,  xp:100,gems:30},
  {id:"c21",icon:"⚡",title:"Sprint de XP",           desc:"Consigue 100 XP en 5 días",                  type:"xp_week",         goal:100,xp:60, gems:18},
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
      return weekDates.filter(d=>lsGet("gbh:quiz:"+d,false)).length;
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
                  background:day.done?`linear-gradient(135deg,${T.g1},${T.g2})`:day.isToday?`linear-gradient(135deg,${T.au1},${T.au2})`:"rgba(255,255,255,0.07)",
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
            background:chestReady?`linear-gradient(135deg,${T.au1},${T.au2})`
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
function StreakOverlay({active,streak}){
  if(!active)return null;
  return(
    <div style={{position:"fixed",inset:0,zIndex:10000,background:"#000",display:"flex",flexDirection:"column",alignItems:"center",justifyContent:"center",animation:"fadeInOut 2.6s ease forwards",pointerEvents:"none"}}>
      <div style={{fontSize:90,animation:"scaleIn 0.5s cubic-bezier(0.34,1.56,0.64,1)"}}>🔥</div>
      <div style={{fontSize:62,fontWeight:900,color:"#FF8040",fontFamily:"'Nunito',sans-serif",lineHeight:1,animation:"scaleIn 0.5s 0.15s cubic-bezier(0.34,1.56,0.64,1) both"}}>{streak}</div>
      <div style={{fontSize:22,fontWeight:900,color:"#FFF",fontFamily:"'Nunito',sans-serif",marginTop:10,animation:"scaleIn 0.5s 0.3s cubic-bezier(0.34,1.56,0.64,1) both",textAlign:"center",letterSpacing:"0.04em"}}>día{streak!==1?"s":""} de racha</div>
      <div style={{marginTop:24,fontSize:15,color:"rgba(255,255,255,0.5)",fontFamily:"'DM Sans',sans-serif",animation:"scaleIn 0.5s 0.5s ease both"}}>¡Sigue así! 💪</div>
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
function LevelUpOverlay({active,level,reward,patientName,onClose}){
  if(!active)return null;
  const isMilestone = level%50===0||level===500;
  const isFreeMeal  = reward?.freeMeal;
  const bg = level===500?"linear-gradient(135deg,#7B2FBE,#FFD700)"
           : isMilestone?"linear-gradient(135deg,#1A3A10,#2B7A00)"
           : "rgba(0,0,0,0.96)";
  return(
    <div style={{position:"fixed",inset:0,zIndex:10001,background:bg,display:"flex",
      flexDirection:"column",alignItems:"center",justifyContent:"center",
      animation:reward?.report?"popIn 0.4s ease":"fadeInOut 3.5s ease forwards",
      pointerEvents:reward?.report?"auto":"none",padding:24}}>
      <div style={{fontSize:isMilestone?80:70,animation:"scaleIn 0.6s cubic-bezier(0.34,1.56,0.64,1)"}}>
        {level===500?"🏆":isMilestone?"👑":isFreeMeal?"🍽️":"⭐"}
      </div>
      <div style={{fontSize:13,fontWeight:900,color:"rgba(255,255,255,0.55)",
        fontFamily:"'DM Sans',sans-serif",textTransform:"uppercase",
        letterSpacing:"0.18em",marginTop:14,animation:"scaleIn 0.5s 0.2s both"}}>
        NIVEL ALCANZADO
      </div>
      <div style={{fontSize:76,fontWeight:900,color:"#FFD700",fontFamily:"'Nunito',sans-serif",
        lineHeight:1,animation:"scaleIn 0.6s 0.35s cubic-bezier(0.34,1.56,0.64,1) both"}}>
        {level}
      </div>
      {reward&&(
        <div style={{display:"flex",flexDirection:"column",alignItems:"center",gap:8,marginTop:14,
          animation:"scaleIn 0.5s 0.55s both"}}>
          {reward.frame>0&&FRAMES[reward.frame]&&(
            <div style={{background:"rgba(255,255,255,0.08)",border:`2px solid ${FRAMES[reward.frame].color}`,
              borderRadius:18,padding:"10px 24px",fontSize:15,fontWeight:900,
              color:FRAMES[reward.frame].color,textAlign:"center"}}>
              🖼️ {FRAMES[reward.frame].label} desbloqueado
              <div style={{fontSize:11,fontWeight:600,opacity:0.8,marginTop:3}}>
                Visible en tu perfil y en el ranking
              </div>
            </div>
          )}
          {reward.report&&(()=>{
            const name = encodeURIComponent(patientName||"");
            const lvl  = level;
            const waMsg = encodeURIComponent(
              `Hola, soy ${patientName||"tu paciente"} y acabo de alcanzar el nivel ${lvl} en la app GBH. He desbloqueado mi informe de progreso gratuito. ¿Puedes enviármelo? 📊`
            );
            const mailSubject = encodeURIComponent(`Informe de progreso — Nivel ${lvl} — ${patientName||""}`);
            const mailBody    = encodeURIComponent(
              `Hola,

Acabo de alcanzar el Nivel ${lvl} en la app de GBH Nutrición y he desbloqueado mi informe de progreso.

¿Puedes enviármelo?

Gracias!`
            );
            return(
              <div style={{background:"rgba(100,181,246,0.12)",border:"2px solid #64B5F6",
                borderRadius:20,padding:"16px 20px",textAlign:"center",maxWidth:300}}>
                <div style={{fontSize:15,fontWeight:900,color:"#64B5F6",marginBottom:4}}>
                  📊 Informe desbloqueado
                </div>
                <div style={{fontSize:12,color:"rgba(255,255,255,0.65)",
                  fontFamily:"'DM Sans',sans-serif",marginBottom:14}}>
                  Toca para solicitarlo ahora
                </div>
                <div style={{display:"flex",gap:10,justifyContent:"center"}}>
                  {/* WhatsApp */}
                  <a href={`https://wa.me/${GBH_WHATSAPP}?text=${waMsg}`}
                    target="_blank" rel="noreferrer"
                    style={{display:"flex",alignItems:"center",gap:7,
                      padding:"11px 18px",borderRadius:16,
                      background:"#25D366",border:"none",
                      color:"white",fontWeight:900,fontSize:14,
                      textDecoration:"none",fontFamily:"'Nunito',sans-serif",
                      boxShadow:"0 4px 0 #1aad4e"}}>
                    <span style={{fontSize:18}}>📱</span> WhatsApp
                  </a>
                  {/* Email */}
                  <a href={`mailto:${GBH_EMAIL}?subject=${mailSubject}&body=${mailBody}`}
                    style={{display:"flex",alignItems:"center",gap:7,
                      padding:"11px 18px",borderRadius:16,
                      background:"rgba(255,255,255,0.12)",
                      border:"1.5px solid rgba(255,255,255,0.25)",
                      color:"white",fontWeight:900,fontSize:14,
                      textDecoration:"none",fontFamily:"'Nunito',sans-serif",
                      boxShadow:"0 4px 0 rgba(0,0,0,0.3)"}}>
                    <span style={{fontSize:18}}>✉️</span> Email
                  </a>
                </div>
                <button onClick={onClose}
                  style={{marginTop:14,background:"none",border:"none",
                    color:"rgba(255,255,255,0.45)",fontSize:12,cursor:"pointer",
                    fontFamily:"'DM Sans',sans-serif"}}>
                  Cerrar
                </button>
              </div>
            );
          })()}
          {reward.freeMeal&&(
            <div style={{background:"rgba(255,200,0,0.18)",border:"2px solid #FFD700",borderRadius:18,
              padding:"10px 24px",fontSize:15,fontWeight:900,color:"#FFD700"}}>
              🍽️ ¡Comida libre desbloqueada!
            </div>
          )}
          {reward.shield&&!reward.frame&&(
            <div style={{background:"rgba(100,181,246,0.18)",border:"2px solid #64B5F6",
              borderRadius:18,padding:"8px 20px",fontSize:14,fontWeight:900,color:"#64B5F6"}}>
              🛡️ Escudo ganado
            </div>
          )}
          <div style={{fontSize:14,fontWeight:700,color:"#C8FF40"}}>+{reward.gems} 💎</div>
        </div>
      )}
      <div style={{fontSize:16,fontWeight:800,color:"rgba(255,255,255,0.8)",
        fontFamily:"'Nunito',sans-serif",marginTop:16,animation:"scaleIn 0.5s 0.7s both"}}>
        {level===500?"¡LEYENDA ABSOLUTA! 🔥":isMilestone?"¡Hito épico alcanzado!":"¡Sigue imparable! 💪"}
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
  const todayStr = new Date().toISOString().slice(0,10);
  const [glasses,setGlasses]=useState(()=>{
    try{
      // Solo recuperar vasos del día actual
      const saved = localStorage.getItem("gbh:glasses:"+todayStr);
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
      try{ localStorage.setItem("gbh:glasses:"+todayStr, target); }catch{}
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  },[done]);

  const addGlass=()=>{
    if(done || glasses>=target) return;
    const ng = glasses + 1;
    setGlasses(ng);
    SFX.water(); // sonido directo (no pasa sfx como prop)
    try{ localStorage.setItem("gbh:glasses:"+todayStr, ng); }catch{}
  };
  const pct=Math.min((glasses/target)*100,100);
  return(
    <div style={{background:done?`linear-gradient(135deg,rgba(43,122,0,0.45),rgba(88,204,2,0.2))`:T.bgCard,border:`2px solid ${done?T.g1:T.bW}`,borderRadius:20,padding:"14px 16px",marginBottom:10,boxShadow:done?`0 5px 0 ${T.g3}`:"0 4px 0 rgba(0,0,0,0.4)"}}>
      <div style={{display:"flex",alignItems:"center",gap:14,marginBottom:10}}>
        <div style={{width:38,height:38,borderRadius:14,background:done?T.g1:T.bW,display:"flex",alignItems:"center",justifyContent:"center",flexShrink:0,fontWeight:900,fontSize:16,color:"white",boxShadow:done?`0 3px 0 ${T.g3}`:"0 3px 0 rgba(0,0,0,0.5)",border:`2px solid ${done?T.g3:"rgba(255,255,255,0.1)"}`}}>
          {done?"✓":"4"}
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

// ─── Weekly XP goal ───────────────────────────────────────────────────────────
function WeeklyXPGoal({logs,xp}){
  const t=useLang();
  const GOAL=100;
  const monday=(()=>{const d=new Date();const day=d.getDay()||7;d.setDate(d.getDate()-day+1);d.setHours(0,0,0,0);return d;})();
  // Approximate weekly XP from logs this week (15 per diet + 5 per other done)
  const weekXP=logs.filter(l=>new Date(l.date)>=monday).reduce((acc,l)=>{
    return acc+(l.diet?15:0)+(l.steps?5:0)+(l.hydration?5:0)+(l.sleep?5:0);
  },0);
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
  {q:"¿Cuántas calorías tiene aproximadamente 100g de pechuga de pollo a la plancha?",opts:["85 kcal","165 kcal","240 kcal","310 kcal"],ans:1},
  {q:"¿Qué macronutriente proporciona más energía por gramo?",opts:["Proteína (4 kcal/g)","Hidratos (4 kcal/g)","Grasa (9 kcal/g)","Fibra (2 kcal/g)"],ans:2},
  {q:"¿Cuál de estos alimentos tiene más proteína por 100g?",opts:["Huevo entero","Atún en lata","Leche entera","Yogur natural"],ans:1},
  {q:"¿Qué vitamina produce el cuerpo con la exposición al sol?",opts:["Vitamina A","Vitamina B12","Vitamina C","Vitamina D"],ans:3},
  {q:"¿Cuántos vasos de agua equivalen aproximadamente a 2 litros?",opts:["4 vasos","6 vasos","8 vasos","10 vasos"],ans:2},
  {q:"¿Cuál de estos alimentos tiene el índice glucémico más bajo?",opts:["Pan blanco","Arroz blanco","Legumbres","Sandía"],ans:2},
  {q:"¿Qué porcentaje del cuerpo humano es agua aproximadamente?",opts:["40%","55-60%","75-80%","90%"],ans:1},
  {q:"¿Cuántas kcal tiene 1 gramo de alcohol?",opts:["4 kcal","5 kcal","7 kcal","9 kcal"],ans:2},
  {q:"¿Cuál es la principal función de los hidratos de carbono?",opts:["Construir músculo","Proporcionar energía rápida","Regular el sistema inmune","Transportar vitaminas"],ans:1},
  {q:"¿Qué alimento es rico en omega-3?",opts:["Aceite de girasol","Salmón","Carne de cerdo","Queso curado"],ans:1},
  {q:"¿Cuántas calorías tiene aproximadamente 1 cucharada de aceite de oliva?",opts:["50 kcal","90 kcal","120 kcal","150 kcal"],ans:1},
  {q:"¿Cuál de estos es un ejemplo de proteína completa?",opts:["Arroz","Lentejas","Huevo","Pan"],ans:2},
  {q:"¿Qué mineral es esencial para la salud ósea?",opts:["Hierro","Zinc","Calcio","Magnesio"],ans:2},
  {q:"¿Cuántas calorías tiene 100g de aguacate?",opts:["80 kcal","160 kcal","250 kcal","320 kcal"],ans:1},
  {q:"¿Qué es el metabolismo basal?",opts:["Calorías quemadas haciendo ejercicio","Calorías mínimas para funciones vitales en reposo","Velocidad de digestión","Absorción de nutrientes"],ans:1},
  {q:"¿Cuál de estos cereales tiene más fibra?",opts:["Arroz blanco","Maíz","Avena","Trigo refinado"],ans:2},
  {q:"¿En qué alimento hay más hierro por 100g?",opts:["Lentejas","Espinacas","Hígado de ternera","Almejas"],ans:3},
  {q:"¿Cuántas calorías tiene 100g de plátano?",opts:["55 kcal","89 kcal","120 kcal","145 kcal"],ans:1},
  {q:"¿Qué vitamina es fundamental para la absorción del hierro?",opts:["Vitamina A","Vitamina B6","Vitamina C","Vitamina K"],ans:2},
  {q:"¿Cuántas horas sin comer se considera ayuno intermitente básico?",opts:["8 horas","12 horas","16 horas","24 horas"],ans:2},
  {q:"¿Cuál de estos NO es un aminoácido esencial?",opts:["Leucina","Valina","Alanina","Lisina"],ans:2},
  {q:"¿Cuántas calorías tiene 100g de almendras?",opts:["350 kcal","460 kcal","580 kcal","700 kcal"],ans:2},
  {q:"¿Qué hormona regula el azúcar en sangre?",opts:["Cortisol","Insulina","Adrenalina","Melatonina"],ans:1},
  {q:"¿Cuál es la temperatura interna segura para cocinar pollo?",opts:["60°C","70°C","74°C","85°C"],ans:2},
  {q:"¿Cuántos gramos de proteína necesita aproximadamente una persona activa por kg de peso?",opts:["0.4-0.6g","0.8-1.2g","1.6-2.2g","3-4g"],ans:2},
  {q:"¿Cuál de estos alimentos tiene más potasio?",opts:["Plátano","Naranja","Espinacas","Patata cocida"],ans:3},
  {q:"¿Qué proceso ocurre durante el sueño en relación a los músculos?",opts:["Se pierden","Se sintetiza proteína muscular","Se quema grasa muscular","No pasa nada"],ans:1},
  {q:"¿Cuántas calorías tiene 100g de pasta cocida?",opts:["80 kcal","131 kcal","200 kcal","260 kcal"],ans:1},
  {q:"¿Cuál de estos tiene menos azúcar?",opts:["Zumo de naranja natural","Naranja entera","Refresco light","Yogur con frutas"],ans:1},
  {q:"¿Qué significa IMC?",opts:["Índice de Masa Corporal","Ingesta Máxima Calórica","Índice Metabólico Corporal","Ingesta Mínima de Carbohidratos"],ans:0},
];

const QUIZ_RECETARIO = [
  {q:'¿Cuál de estos platos del recetario GBH tiene más grasas?',opts:['Pastel de pescado','Ensalada de patata','Bircher Muesli','Guiso de alubias con hongos'],ans:2,fact:'Bircher Muesli · 60g grasa'},
  {q:'¿Cuál de estos platos del recetario GBH tiene más hidratos de carbono?',opts:['Arroz asiático con huevo','Gnocchi con mozzarella y pollo','Calabacines rellenos de gambas y rape','Guiso de verduras'],ans:3,fact:'Guiso de verduras · 35g HC'},
  {q:'¿Cuál de estos platos del recetario GBH tiene más calorías?',opts:['Sopa crema de patatas y cebollas','Avena al horno con manzana pera y nueces','Ensalada de escarola con tomate granada y naranja','Ensalada de berenjena y queso'],ans:3,fact:'Ensalada de berenjena y queso · 510kcal'},
  {q:'¿Cuál de estos platos del recetario GBH tiene más proteínas?',opts:['Bizcocho keto de limón','Estofado de habichuelas','Guiso de merluza y gambas','Huevos revueltos con espárragos'],ans:2,fact:'Guiso de merluza y gambas · 40g prot'},
  {q:'¿Cuál de estos platos del recetario GBH tiene más grasas?',opts:['Hamburguesa de berenjenas','Pizzeta de calabaza','Ensalada de espinacas','Guiso de garbanzos y calamares'],ans:1,fact:'Pizzeta de calabaza · 20g grasa'},
  {q:'¿Cuál de estos platos del recetario GBH tiene más proteínas?',opts:['Ensalada de lentejas y aguacate','Batido de plátano y avena','Lentejas con verduras','Ensalada de brócoli y manzana'],ans:2,fact:'Lentejas con verduras · 22g prot'},
  {q:'¿Cuál de estos platos del recetario GBH tiene más proteínas?',opts:['Tosta de atún con gambas y tomate','Macedonia de sandia y melon','Guiso de alubias blancas y verduras','Ensalada mixta'],ans:0,fact:'Tosta de atún con gambas y tomate · 20g prot'},
  {q:'¿Cuál de estos platos del recetario GBH tiene más hidratos de carbono?',opts:['Ensalada de col y manzana','Berenjenas asadas con cuscús de garbanzos','Tarta de dulce de leche','Guiso de alubias con hongos'],ans:1,fact:'Berenjenas asadas con cuscús de garbanzos · 50g HC'},
  {q:'¿Cuál de estos platos del recetario GBH tiene más grasas?',opts:['Sopa postre de avellanas y chocolate blanco','Tortilla de champiñón','Alubias con pulpo','Brazo de tiramisú'],ans:3,fact:'Brazo de tiramisú · 21g grasa'},
  {q:'¿Cuál de estos platos del recetario GBH tiene más calorías?',opts:['Flan de avena','Tortitas de plátano y avena','Ensalada de naranjas','Sorbete de café'],ans:0,fact:'Flan de avena · 430kcal'},
  {q:'¿Cuál de estos platos del recetario GBH tiene más proteínas?',opts:['Pisto de verduras con carne','Hamburguesa de garbanzo y curry','Pizza de yuca','Ensalada de gourmet'],ans:0,fact:'Pisto de verduras con carne · 27g prot'},
  {q:'¿Cuál de estos platos del recetario GBH tiene más calorías?',opts:['Pollo con salsa de frutos rojos y yuca','Lasaña de calabacín','Pasta con brócoli y queso','Albóndigas de pollo con arroz al curry'],ans:3,fact:'Albóndigas de pollo con arroz al curry · 550kcal'},
  {q:'¿Cuál de estos platos del recetario GBH tiene más grasas?',opts:['Guiso de pavo','Boloñesa de lentejas','Rape con verduras','Arroz con leche al chocolate'],ans:3,fact:'Arroz con leche al chocolate · 36g grasa'},
  {q:'¿Cuál de estos platos del recetario GBH tiene más proteínas?',opts:['Lentejas sin sofrito','Crema con rape y gambas','Tosta de atún con gambas y tomate','Rollitos de salmón ahumado'],ans:3,fact:'Rollitos de salmón ahumado · 41g prot'},
  {q:'¿Cuál de estos platos del recetario GBH tiene más calorías?',opts:['Triángulos de maíz con carne','Pastelitos de patata y brócoli','Estofado de cordero','Sándwich de salmón, queso y aguacate'],ans:2,fact:'Estofado de cordero · 500kcal'},
  {q:'¿Cuál de estos platos del recetario GBH tiene más proteínas?',opts:['Pastel de champiñones y soya','Huevos revueltos con jamón','Guiso marinero','Guiso pavo con verduras'],ans:1,fact:'Huevos revueltos con jamón · 35g prot'},
  {q:'¿Cuál de estos platos del recetario GBH tiene más grasas?',opts:['Ensalada california','Salmón con salsa de yogur','Berenjenas a la parmesana','Guiso de patatas con champiñones'],ans:0,fact:'Ensalada california · 15g grasa'},
  {q:'¿Cuál de estos platos del recetario GBH tiene más grasas?',opts:['Coulant de pistacho','Quesadillas','Parrillada de verduras','Ensalada de pollo y aguacate'],ans:1,fact:'Quesadillas · 32g grasa'},
  {q:'¿Cuál de estos platos del recetario GBH tiene más proteínas?',opts:['Mousse de melón con frutos rojos','Ensalada de naranjas','Lubina al microondas con calabacín','Crema cuajada de leche y queso'],ans:2,fact:'Lubina al microondas con calabacín · 28g prot'},
  {q:'¿Cuál de estos platos del recetario GBH tiene más calorías?',opts:['Gachas de avena remojadas con cacahuetes y chocolate','Pollo con pesto rosso de tomates secos','Sopa postre de chocolate y almendras','Trufas de palomitas'],ans:2,fact:'Sopa postre de chocolate y almendras · 521kcal'},
  {q:'¿Cuál de estos platos del recetario GBH tiene más proteínas?',opts:['Guiso de garbanzos y calamares','Salmón con arroz y gambas','Berenjenas rellenas de verduras','Ensalada california'],ans:1,fact:'Salmón con arroz y gambas · 31g prot'},
  {q:'¿Cuál de estos platos del recetario GBH tiene más calorías?',opts:['Lentejas estofadas','Alcachofas con jamón y huevo','Hummus','Focaccia de pesto burata y mortadela'],ans:3,fact:'Focaccia de pesto burata y mortadela · 700kcal'},
  {q:'¿Cuál de estos platos del recetario GBH tiene más proteínas?',opts:['Merluza con cebolla al microondas','Tortitas de plátano y avena','Sorbete de café','Ensalada de naranjas'],ans:0,fact:'Merluza con cebolla al microondas · 24g prot'},
  {q:'¿Cuál de estos platos del recetario GBH tiene más grasas?',opts:['Tortilla de zanahorias','Batido de mango y proteína','Huevos revueltos con champiñones','Sorbete de frutas'],ans:3,fact:'Sorbete de frutas · 40g grasa'},
  {q:'¿Cuál de estos platos del recetario GBH tiene más grasas?',opts:['Ensalada de alcachofas y atún','Pastel de patata con marisco','Hamburguesa de pollo y espinaca al plato','Ensalada waldorf'],ans:1,fact:'Pastel de patata con marisco · 42g grasa'},
  {q:'¿Cuál de estos platos del recetario GBH tiene más hidratos de carbono?',opts:['Mero con fideos','Bizcocho keto de limón','Ensalada de coliflor','Ensalada de pollo con mango y aguacate'],ans:0,fact:'Mero con fideos · 25g HC'},
  {q:'¿Cuál de estos platos del recetario GBH tiene más proteínas?',opts:['Espaguetis boloñesa','Ensalada de champiñones','Mousse de pera y kiwi','Sopa crema de patatas y cebollas'],ans:0,fact:'Espaguetis boloñesa · 50g prot'},
  {q:'¿Cuál de estos platos del recetario GBH tiene más proteínas?',opts:['Sándwich de bacalao ahumado y aguacate','Tostadas Hawai','Hamburguesas de arroz con queso','Salmón al horno con brócoli y patatas'],ans:3,fact:'Salmón al horno con brócoli y patatas · 50g prot'},
  {q:'¿Cuál de estos platos del recetario GBH tiene más hidratos de carbono?',opts:['Focaccia de pesto burata y mortadela','Tortilla de patata asada baja en grasas','Bombones saludables de avena','Fideos con costillas'],ans:0,fact:'Focaccia de pesto burata y mortadela · 40g HC'},
  {q:'¿Cuál de estos platos del recetario GBH tiene más calorías?',opts:['Pudin de ajetes y bacon','Alfajor de platano y creme de avellanas','Guiso de garbanzos y albaricoques','Ajoblanco con sardina ahumada'],ans:3,fact:'Ajoblanco con sardina ahumada · 970kcal'},
  {q:'¿Cuál de estos platos del recetario GBH tiene más hidratos de carbono?',opts:['Tortilla de coliflor','Corona de pistacho y almendra','Ensalada tibia de vegetales asados','Brazo de tiramisú'],ans:1,fact:'Corona de pistacho y almendra · 57g HC'},
  {q:'¿Cuál de estos platos del recetario GBH tiene más proteínas?',opts:['Pisto de bacalao y calabacín','Pan vegano de plátano avena y nueces','Alitas de pollo con sticks de calabacín','Ensalada de manzana y fresas con pipas'],ans:0,fact:'Pisto de bacalao y calabacín · 47g prot'},
  {q:'¿Cuál de estos platos del recetario GBH tiene más grasas?',opts:['Berenjenas con soja y miel','Guiso de merluza y gambas','Ensaladilla de pollo y aguacate','Estofado de habichuelas'],ans:2,fact:'Ensaladilla de pollo y aguacate · 21g grasa'},
  {q:'¿Cuál de estos platos del recetario GBH tiene más calorías?',opts:['Berenjenas empanadas','Pasta a la puttanesca','Sopa crema de patatas y cebollas','Ensalada de lentejas camote crujiente y pimentón'],ans:1,fact:'Pasta a la puttanesca · 700kcal'},
  {q:'¿Cuál de estos platos del recetario GBH tiene más calorías?',opts:['Lentejas asadas y berenjenas','Hamburguesa completa','Guiso de acelgas','Salteado de tofu brócoli y zanahoria'],ans:1,fact:'Hamburguesa completa · 800kcal'},
  {q:'¿Cuál de estos platos del recetario GBH tiene más hidratos de carbono?',opts:['Guiso marinero','Pastelitos de pasta filo y pasas','Ensalada de garbanzos','Judías verdes con huevo'],ans:1,fact:'Pastelitos de pasta filo y pasas · 38g HC'},
  {q:'¿Cuál de estos platos del recetario GBH tiene más proteínas?',opts:['Sopa de lentejas y boniato','Tiramisú de pistacho','Pimientos rellenos de bacalao con sticks de zanahoria','Sopa crema de calabaza'],ans:2,fact:'Pimientos rellenos de bacalao con sticks de zanahoria · 30g prot'},
  {q:'¿Cuál de estos platos del recetario GBH tiene más grasas?',opts:['Pastelitos de patata y brócoli','Cuajada con galletas de sésamo','Ensalada de mango y arroz','Empanadillas orientales'],ans:3,fact:'Empanadillas orientales · 73g grasa'},
  {q:'¿Cuál de estos platos del recetario GBH tiene más proteínas?',opts:['Ensalada de arroz chino','Pollo con salsa de frutos rojos y yuca','Helado de mango','Panache de verduras'],ans:1,fact:'Pollo con salsa de frutos rojos y yuca · 55g prot'},
  {q:'¿Cuál de estos platos del recetario GBH tiene más grasas?',opts:['Tortilla de espinacas y queso','Crema de patatas y apio','Ensalada de aguacate y quinoa','Pastel de pescado'],ans:2,fact:'Ensalada de aguacate y quinoa · 23g grasa'},
  {q:'¿Cuál de estos platos del recetario GBH tiene más calorías?',opts:['Minestrone','Hojaldre con natillas','Arroz con leche al chocolate','Pinchos de pimiento bacon y queso'],ans:3,fact:'Pinchos de pimiento bacon y queso · 630kcal'},
  {q:'¿Cuál de estos platos del recetario GBH tiene más proteínas?',opts:['Pastel de champiñones y soya','Sorbete de café','Tortilla de zanahorias','Panache de verduras'],ans:0,fact:'Pastel de champiñones y soya · 16g prot'},
  {q:'¿Cuál de estos platos del recetario GBH tiene más grasas?',opts:['Guisado de carne o pescado','Ensalada de naranjas','Crepes de harina integral veganas','Hojaldre con natillas'],ans:3,fact:'Hojaldre con natillas · 19g grasa'},
  {q:'¿Cuál de estos platos del recetario GBH tiene más proteínas?',opts:['Salmón con verduras al microondas','Pastelitos de manzana','Barritas de avena y almendras','Pinchos de pimiento bacon y queso'],ans:0,fact:'Salmón con verduras al microondas · 29g prot'},
  {q:'¿Cuál de estos platos del recetario GBH tiene más proteínas?',opts:['Fresas con nata','Ensalada mixta','Triángulos de maíz con carne','Milhojas de nata'],ans:2,fact:'Triángulos de maíz con carne · 35g prot'},
  {q:'¿Cuál de estos platos del recetario GBH tiene más hidratos de carbono?',opts:['Ensalada de langostinos rúcula y papaya','Guiso de patatas con champiñones','Ternera con pimientos de piquillo','Tartar de atún'],ans:1,fact:'Guiso de patatas con champiñones · 30g HC'},
  {q:'¿Cuál de estos platos del recetario GBH tiene más calorías?',opts:['Mejillones al vapor','Arroz de alubias y pimientos','Ensalada de judías verdes con jamón','Ensalada de col y manzana'],ans:1,fact:'Arroz de alubias y pimientos · 367kcal'},
  {q:'¿Cuál de estos platos del recetario GBH tiene más grasas?',opts:['Ensalada de pollo con mango y aguacate','Muffin de chocolate','Curry de tofu y vegetales','Tartar de atún'],ans:2,fact:'Curry de tofu y vegetales · 37g grasa'},
  {q:'¿Cuál de estos platos del recetario GBH tiene más calorías?',opts:['Pasta con setas','Pan de manzana','Salteado de tofu brócoli y zanahoria','Hojaldre de manzana y crema'],ans:0,fact:'Pasta con setas · 750kcal'},
  {q:'¿Cuál de estos platos del recetario GBH tiene más calorías?',opts:['Calamares guisados','Salmón al horno','Pudin de ajetes y bacon','Brownie en microondas'],ans:2,fact:'Pudin de ajetes y bacon · 730kcal'},
  {q:'¿Cuál de estos platos del recetario GBH tiene más proteínas?',opts:['Tarta de queso al microondas','Guiso de cacahuetes y boniato','Tortitas saladas de puerro y calabacín','Pimientos rellenos al horno'],ans:3,fact:'Pimientos rellenos al horno · 24g prot'},
  {q:'¿Cuál de estos platos del recetario GBH tiene más proteínas?',opts:['Hojaldre de manzana y crema','Rape con verduras','Albóndigas de pavo','Hamburguesas de arroz con queso'],ans:2,fact:'Albóndigas de pavo · 36g prot'},
  {q:'¿Cuál de estos platos del recetario GBH tiene más calorías?',opts:['Ensalada de patata','Hamburguesas de arroz con queso','Tartaleta de arroz y pollo','Potaje de vigilia'],ans:2,fact:'Tartaleta de arroz y pollo · 580kcal'},
  {q:'¿Cuál de estos platos del recetario GBH tiene más proteínas?',opts:['Pollo teriyaki con calabacín / versión ligera','Ensalada de quinoa y atún','Tartaleta de arroz y pollo','Bol de plátano y mango'],ans:0,fact:'Pollo teriyaki con calabacín / versión ligera · 55g prot'},
  {q:'¿Cuál de estos platos del recetario GBH tiene más hidratos de carbono?',opts:['Pastel de berenjenas y calabacines','Huevos revueltos con espárragos','Pasta carbonara con salsa de pistacho','Sopa de tofu'],ans:2,fact:'Pasta carbonara con salsa de pistacho · 40g HC'},
  {q:'¿Cuál de estos platos del recetario GBH tiene más grasas?',opts:['Ensalada de arroz chino','Brochetas de rape con tomate y pimiento','Pastelitos de patata y brócoli','Ensalada california'],ans:2,fact:'Pastelitos de patata y brócoli · 16g grasa'},
  {q:'¿Cuál de estos platos del recetario GBH tiene más calorías?',opts:['Samosas de morcilla y manzana','Platano banado en choco','Crema cuajada de leche y queso','Rape con verduras'],ans:2,fact:'Crema cuajada de leche y queso · 627kcal'},
  {q:'¿Cuál de estos platos del recetario GBH tiene más hidratos de carbono?',opts:['Chocolatinas de frutos secos','Arroz de coliflor con curry','Batido de mango y proteína','Hojaldre con natillas'],ans:3,fact:'Hojaldre con natillas · 42g HC'},
  {q:'¿Cuál de estos platos del recetario GBH tiene más calorías?',opts:['Calamares guisados','Rape con verduras','Hamburguesa de pollo y espinaca al plato','Natillas'],ans:2,fact:'Hamburguesa de pollo y espinaca al plato · 430kcal'},
  {q:'¿Cuál de estos platos del recetario GBH tiene más hidratos de carbono?',opts:['Brochetas de tomate, queso y anchoas','Tortitas proteicas de avena','Huevos revueltos con jamón','Ensalada caprese'],ans:3,fact:'Ensalada caprese · 40g HC'},
  {q:'¿Cuál de estos platos del recetario GBH tiene más calorías?',opts:['Datiles banados en chocolate y nuez','Olla gitana','Guiso de pollo con alcachofas','Sopa de verduras con quinoa'],ans:1,fact:'Olla gitana · 363kcal'},
  {q:'¿Cuál de estos platos del recetario GBH tiene más calorías?',opts:['Atún a la sevillana al microondas','Hamburguesa de pimiento y soya','Fideos con costillas','Tostas de tomate, queso y mortadela'],ans:2,fact:'Fideos con costillas · 750kcal'},
  {q:'¿Cuál de estos platos del recetario GBH tiene más grasas?',opts:['Guiso de acelgas','Pollo al horno con verduras','Ternera a la jardinera','Ensalada de espárragos blancos y salmón ahumado'],ans:2,fact:'Ternera a la jardinera · 22g grasa'},
  {q:'¿Cuál de estos platos del recetario GBH tiene más calorías?',opts:['Bacalao con salsa de pimiento y tomate','Alubias con pulpo','Ensaladilla de pollo y aguacate','Brownie en microondas'],ans:3,fact:'Brownie en microondas · 555kcal'},
  {q:'¿Cuál de estos platos del recetario GBH tiene más calorías?',opts:['Ensalada de espárragos blancos y salmón ahumado','Tostadas Hawai','Rollos fritos','Ensalada de judías verdes con jamón'],ans:2,fact:'Rollos fritos · 731kcal'}
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

function RuletaModal({onClose, onCollect}){
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
function QuizModal({onClose, onComplete, todayKey}){
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
              <div>
                <div style={{fontSize:11,fontWeight:900,color:"rgba(255,255,255,0.7)",textTransform:"uppercase",letterSpacing:"0.1em"}}>Quiz del día</div>
                <div style={{fontSize:14,fontWeight:900,color:"white"}}>Nutrición · {correct?"":"Gana hasta"} +20 XP +8 💎</div>
              </div>
            </div>
            {/* Pregunta */}
            <div style={{padding:"22px 20px 16px"}}>
              <div style={{fontSize:16,fontWeight:800,color:T.wh,lineHeight:1.5,marginBottom:20,fontFamily:"'DM Sans',sans-serif"}}>
                {q.q}
              </div>
              {/* Opciones */}
              <div style={{display:"flex",flexDirection:"column",gap:10}}>
                {q.opts.map((opt,i)=>{
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
              {correct?"¡Correcto!":"Casi..."}
            </div>
            <div style={{fontSize:14,color:T.t2,fontFamily:"'DM Sans',sans-serif",marginBottom:20,lineHeight:1.5}}>
              {correct
                ? "¡Sabías la respuesta! Tu nutricionista estaría orgulloso 🐑"
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
            <div style={{fontSize:12,color:T.t2,fontFamily:"'DM Sans',sans-serif"}}>Toca en cualquier lugar para continuar</div>
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
        <button onClick={onOpen} style={{marginTop:12,width:"100%",padding:"13px",borderRadius:16,border:`2px solid ${chestColor}`,cursor:"pointer",fontSize:15,fontWeight:900,background:`linear-gradient(135deg,${chestColor},${T.au2})`,color:"#1A1000",boxShadow:`0 5px 0 ${T.au3}`,fontFamily:"'Nunito',sans-serif",animation:"pulse 1.5s ease-in-out infinite"}}>
          🎁 ¡Abrir {chestLabel}!
        </button>
      )}
    </div>
  );
}

// ─── ChestOpenModal — animación de apertura del cofre ────────────────────────
function ChestOpenModal({streak, onClose, onCollect}){
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
          <button onClick={()=>{onCollect(rewards.xp,rewards.gems);onClose();}} style={{background:`linear-gradient(135deg,${T.g1},${T.g2})`,border:`3px solid ${T.g3}`,borderRadius:20,padding:"18px 48px",color:"white",fontWeight:900,fontSize:18,cursor:"pointer",boxShadow:`0 6px 0 ${T.g3}`,fontFamily:"'Nunito',sans-serif"}}>
            ¡Recoger!
          </button>
        </div>
      )}
    </div>
  );
}

// ─── Weight chart component ───────────────────────────────────────────────────
function WeightChart({chartData,setWeightMode,goalWeight}){
  const t=useLang();
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
function ProfileCardModal({onClose, profile, userPhoto, onSavePhoto, onSaveProfile, weights, lv, xp, streak, badges, onSubscribeNotifications, lang, setLang}){
  const t=useLang();
  const [photo,     setPhoto]    = useState(userPhoto||null);
  const [editField, setEditField]= useState(null);
  const [editVal,   setEditVal]  = useState("");
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

  const DataRow = ({label, value, field}) => (
    <div style={{display:"flex",alignItems:"center",justifyContent:"space-between",padding:"12px 0",borderBottom:"1px solid rgba(255,255,255,0.07)"}}>
      <div style={{flex:1,minWidth:0}}>
        <div style={{fontSize:10,color:T.t2,textTransform:"uppercase",letterSpacing:"0.08em",fontFamily:"'DM Sans',sans-serif",marginBottom:3}}>{label}</div>
        {editField===field?(
          <input autoFocus value={editVal} onChange={e=>setEditVal(e.target.value)}
            onKeyDown={e=>{if(e.key==="Enter")saveEdit();if(e.key==="Escape")setEditField(null);}}
            type={field==="weight"?"number":"text"} step={field==="weight"?"0.1":undefined}
            style={{background:"rgba(255,255,255,0.1)",border:`1.5px solid ${T.g1}`,borderRadius:10,padding:"6px 10px",color:T.wh,fontSize:15,fontWeight:700,fontFamily:"'DM Sans',sans-serif",width:"90%",outline:"none"}}
          />
        ):(
          <div style={{fontSize:16,fontWeight:800,color:T.wh,fontFamily:"'DM Sans',sans-serif",overflow:"hidden",textOverflow:"ellipsis",whiteSpace:"nowrap"}}>
            {value}{field==="weight"&&value!=="—"?" kg":""}
          </div>
        )}
      </div>
      <div style={{marginLeft:12,flexShrink:0}}>
        {editField===field?(
          <button onClick={saveEdit} style={{background:T.g1,border:"none",borderRadius:10,padding:"7px 14px",color:"white",fontWeight:900,fontSize:13,cursor:"pointer",fontFamily:"'Nunito',sans-serif"}}>✓</button>
        ):(
          <button onClick={()=>startEdit(field, value)} style={{background:"rgba(255,255,255,0.08)",border:"1.5px solid rgba(255,255,255,0.14)",borderRadius:10,padding:"7px 10px",color:T.t2,fontSize:16,cursor:"pointer",lineHeight:1}}>✏️</button>
        )}
      </div>
    </div>
  );

  return(
    <div style={{position:"fixed",inset:0,zIndex:11000,background:"rgba(0,0,0,0.88)",backdropFilter:"blur(8px)",display:"flex",alignItems:"center",justifyContent:"center",padding:20,overflowY:"auto"}} onClick={onClose}>
      <div style={{background:`linear-gradient(180deg,#1E4A20,${T.bgWood} 55%)`,borderRadius:32,width:"100%",maxWidth:340,border:`2px solid ${T.bW}`,boxShadow:"0 24px 70px rgba(0,0,0,0.85)",animation:"popIn 0.35s cubic-bezier(0.34,1.56,0.64,1)",overflow:"hidden"}} onClick={e=>e.stopPropagation()}>

        {/* ── Cabecera ── */}
        <div style={{padding:"28px 24px 18px",textAlign:"center",position:"relative"}}>
          <button onClick={onClose} style={{position:"absolute",top:14,right:14,width:32,height:32,borderRadius:"50%",background:"rgba(0,0,0,0.3)",border:"none",color:"rgba(255,255,255,0.6)",fontSize:16,cursor:"pointer",display:"flex",alignItems:"center",justifyContent:"center"}}>✕</button>

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
          <DataRow label={t("profileInitialWeight")} value={initW} field="weight"/>
          <DataRow label={t("profileGoalWeight")}    value={profile?.goal_weight||"—"} field="goal"/>
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
          {/* Notificaciones */}
          <div style={{display:"flex",alignItems:"center",justifyContent:"space-between",padding:"12px 0",borderBottom:"1px solid rgba(255,255,255,0.07)"}}>
            <div>
              <div style={{fontSize:10,color:T.t2,textTransform:"uppercase",letterSpacing:"0.08em",fontFamily:"'DM Sans',sans-serif",marginBottom:3}}>Recordatorios</div>
              <div style={{fontSize:14,fontWeight:800,color:T.wh,fontFamily:"'DM Sans',sans-serif"}}>
                {typeof Notification!=="undefined"&&Notification.permission==="granted"?"🔔 Activados":"🔕 Desactivados"}
              </div>
            </div>
            {typeof Notification!=="undefined"&&Notification.permission!=="granted"&&(
              <button onClick={onSubscribeNotifications||subscribeNotifications} style={{
                background:"rgba(100,130,255,0.15)",border:"1.5px solid rgba(100,130,255,0.4)",
                borderRadius:10,padding:"7px 12px",color:"rgba(150,170,255,0.9)",
                fontWeight:800,fontSize:12,cursor:"pointer",fontFamily:"'Nunito',sans-serif"}}>
                Activar
              </button>
            )}
          </div>

          {lastW!=="—"&&String(lastW)!==String(initW)&&(
            <div style={{display:"flex",justifyContent:"space-between",alignItems:"center",padding:"12px 0"}}>
              <div>
                <div style={{fontSize:10,color:T.t2,textTransform:"uppercase",letterSpacing:"0.08em",fontFamily:"'DM Sans',sans-serif",marginBottom:3}}>Último peso registrado</div>
                <div style={{fontSize:16,fontWeight:800,color:T.wh,fontFamily:"'DM Sans',sans-serif"}}>{lastW} kg</div>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

// ═══════════════════════════════════════════════════════════════════════════════
// MAIN APP
// ═══════════════════════════════════════════════════════════════════════════════
function GBHApp(){
  // Inicialización síncrona: si hay sesión guardada → "loading" (nunca "auth" en frío)
  const [screen,  setScreen]  = useState(()=>{
    try{
      const em = lsGet("gbh:lastEmail",null);
      if(!em) return "auth";
      const lid = lsGet(`gbh:em:${em}`,null);
      if(!lid) return "auth";
      const lp = lsGet(`gbh:p:${lid}`,null);
      return lp?.id ? "loading" : "auth";
    }catch{ return "auth"; }
  });
  const [tab,     setTab]     = useState("home");
  const [lang,    setLang]    = useState(()=>lsGet("gbh:lang","es"));
  const [muted,   setMuted]   = useState(()=>lsGet("gbh:mute",false));
  const sfx = (name,...args) => { if(!muted) SFX[name]?.(...args); };
  const [profile, setProfile] = useState(null);
  const [tLog,    setTLog]    = useState(()=>{
    // Leer tLog del día directamente desde localStorage — nunca depende de Supabase
    const today = toKey();
    return lsGet(`gbh:tlog:${today}`, {diet:false,steps:false,hydration:false,sleep:false});
  });
  const [steps,   setSteps]   = useState(0);
  const [weights, setWeights] = useState([]);
  const [badges,  setBadges]  = useState([]);
  const [logs,    setLogs]    = useState([]);
  const [allP,    setAllP]    = useState([]);
  const [wInput,  setWInput]  = useState("");
  const [weightMode, setWeightMode] = useState("default");
  const [userPhoto,  setUserPhoto]  = useState(()=>lsGet("gbh:userPhoto",null));
  const [showPhotoPicker,  setShowPhotoPicker]  = useState(false);
  const [ranking, setRanking] = useState([]);
  const [rankLoading, setRankLoading] = useState(false);
  const [rankTab,      setRankTab]      = useState(0);
  const [showQuiz,     setShowQuiz]     = useState(false);
  const [quizDone,     setQuizDone]     = useState(()=>lsGet("gbh:quiz:"+new Date().toISOString().slice(0,10),false));
  const [quizBannerDismissed, setQuizBannerDismissed] = useState(()=>lsGet("gbh:quizBanner:"+new Date().toISOString().slice(0,10),false));
  const [showChest,    setShowChest]    = useState(false);
  const [showWeekChest, setShowWeekChest] = useState(false);
  const [showRuleta,    setShowRuleta]    = useState(false);
  const [showChallenges,   setShowChallenges]   = useState(false);
  const [notifPermission, setNotifPermission] = useState(()=>lsGet("gbh:notifAsked",false));
  const [showNotifBanner, setShowNotifBanner] = useState(false);
  const [claimedChallenges, setClaimedChallenges] = useState(()=>{
    const {w,y}=getISOWeek(); return lsGet(`gbh:challenges:${y}:${w}`,[]);
  });
  const [ruletaDone,    setRuletaDone]    = useState(()=>lsGet("gbh:ruleta:"+new Date().toISOString().slice(0,10),false));
  const [ruletaAutoShown,setRuletaAutoShown]=useState(()=>lsGet("gbh:ruletaSeen:"+new Date().toISOString().slice(0,10),false));
  const [chestOpened,  setChestOpened]  = useState(()=>{
    // El cofre se abre una vez por cada múltiplo de 7 — guardamos el último streak abierto
    return lsGet("gbh:chestLastOpened",0);
  }); // 0=racha 1=xp 2=peso
  const [weightBannerDismissed, setWeightBannerDismissed] = useState(false);
  const [pwaPrompt,    setPwaPrompt]    = useState(null);
  const [pwaDismissed, setPwaDismissed] = useState(()=>lsGet("gbh:pwaDismissed",false));
  const [pwaInstalled, setPwaInstalled] = useState(()=>{try{return window.matchMedia("(display-mode: standalone)").matches||window.navigator.standalone===true;}catch{return false;}});
  const [showOfflineBanner,  setShowOfflineBanner]  = useState(false);
  const [showSyncBanner,     setShowSyncBanner]     = useState(false);
  const offlineTimerRef = useRef(null);
  const syncTimerRef    = useRef(null); // "default" | "input" | "chart"
  const [toast,   setToast]   = useState(null);
  const [confetti,setConfetti]= useState(false);
  const [loading, setLoading] = useState(false);
  const [taps,    setTaps]    = useState(0);
  const [aName,   setAName]   = useState("");
  const [aEmail,  setAEmail]  = useState("");
  const [aWeight, setAWeight] = useState("");
  const [aGoal,   setAGoal]   = useState("");
  const [authMode,setAuthMode]= useState("new"); // "new" | "returning" | "checking"
  const [authErr, setAuthErr] = useState("");
  const [dailyRecipe,setDailyRecipe] = useState(null);
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
  const [pendingSync, setPendingSync] = useState(()=>lsGet(QUEUE_KEY,[]).length);

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
      });
    });
  },[]);

  // ── Service Worker — solo para caché offline, sin auto-reload ──────────────
  useEffect(()=>{
    if(!("serviceWorker" in navigator)) return;
    navigator.serviceWorker.register("/sw.js")
      .catch(err=>console.warn("[SW] registro fallido:",err));
  },[]);

  // ── PWA install prompt ──────────────────────────────────────────────────────
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
      const q = lsGet(QUEUE_KEY, []);
      if(q.length){
        const ok = await flushQueue();
        setPendingSync(lsGet(QUEUE_KEY,[]).length);
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
    if(navigator.onLine) flushQueue().then(()=>setPendingSync(lsGet(QUEUE_KEY,[]).length));
    return ()=>{ window.removeEventListener("online",onOnline); window.removeEventListener("offline",onOffline); };
  // eslint-disable-next-line react-hooks/exhaustive-deps
  },[]);

  // Auto-login: si ya existe sesión guardada, cargar directamente
  useEffect(()=>{
    const lastEmail=lsGet("gbh:lastEmail",null);
    if(!lastEmail)return;
    const lid=lsGet(`gbh:em:${lastEmail}`,null);
    if(!lid)return;
    const lp=lsGet(`gbh:p:${lid}`,null);
    if(lp?.id)loadP(lp);
  // eslint-disable-next-line react-hooks/exhaustive-deps
  },[]);

  // t() lee directamente del estado lang (no del contexto, que está dentro del return)
  const t = (key, vars={}) => {
    let str = (TRANS[lang]?.[key] ?? TRANS.es[key] ?? key);
    if(Array.isArray(str)) return str;
    for(const [k,v] of Object.entries(vars)) str = str.split(`{${k}}`).join(String(v));
    return str;
  };
  const streak=useMemo(()=>{let s=0;const d=new Date();while(true){if(logs.find(l=>l.date===toKey(d)&&l.diet)){s++;d.setDate(d.getDate()-1);}else break;}return s;},[logs,tLog]);
  const xp=profile?.xp??0,gems=profile?.gems??0;
  const lv=getLevel(xp),nextLv=getNextLevel(lv);
  const xpPct=Math.min(((xp-lv.min)/((nextLv?.min||lv.min+1)-lv.min))*100,100);
  const allDone=tLog.diet&&tLog.steps&&tLog.hydration&&tLog.sleep;
  const expr=getExpr(streak,tLog.diet,allDone,tLog.sleep);
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
    id_receta:   r.id_receta    || r.ID_Receta        || r.id || "",
  });

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
        }));
        lsSet(`gbh:logs:${profileId}`, mapped);
      }
      // 2. Restaurar historial de peso
      const remoteWeights = await sbReq("GET", `weight_logs?profile_id=eq.${profileId}&select=*&order=log_date.asc`);
      if (remoteWeights?.length) {
        const mappedW = remoteWeights.map((r,i) => ({
          date: r.log_date || r.date,
          weight: r.weight_kg ?? r.weight,
          isInitial: i === 0, // el primer punto cronológico es siempre el inicial
        }));
        lsSet(`gbh:weights:${profileId}`, mappedW);
      }
      // 3. Restaurar logros desde achievements
      const remoteAch = await sbReq("GET", `achievements?profile_id=eq.${profileId}&select=badge_id`);
      if (remoteAch?.length) {
        const badgeIds = remoteAch.map(r => r.badge_id);
        lsSet(`gbh:badges:${profileId}`, badgeIds);
      }
    } catch(e) {
      console.warn("restoreFromServer error:", e);
    }
  };

  const loadP=useCallback(async(p)=>{
    setProfile(p);
    const localLogs = lsGet(`gbh:logs:${p.id}`,[]);
    const localWeights = lsGet(`gbh:weights:${p.id}`,[]);
    // Restaurar desde Supabase solo si NO hay logs locales (primera instalación real)
    if(navigator.onLine && localLogs.length===0){
      await restoreFromServer(p.id);
    }
    const l=lsGet(`gbh:logs:${p.id}`,[]);setLogs(l);
    // tLog: prioridad a la clave del día en localStorage (nunca se pierde)
    const today=toKey();
    const savedTLog=lsGet(`gbh:tlog:${today}`,null);
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
        lsSet(`gbh:tlog:${today}`,tl); // migrar al nuevo sistema
        setSteps(t.sc||0);
      }
    }
    setWeights(lsGet(`gbh:weights:${p.id}`,[]).sort((a,b)=>a.date>b.date?1:-1));
    setBadges(lsGet(`gbh:badges:${p.id}`,[]) );
    setWeightBannerDismissed(false);
    setScreen("main");
    fetchDailyRecipe(); // cargar receta del día
    // Mostrar banner de notificaciones si llevan ≥1 días y no han respondido
    if(!lsGet("gbh:notifAsked",false)){
      const firstOpen = lsGet("gbh:firstOpen", new Date().toISOString().slice(0,10));
      if(!lsGet("gbh:firstOpen",null)) lsSet("gbh:firstOpen", new Date().toISOString().slice(0,10));
      const days = Math.floor((Date.now()-new Date(firstOpen))/(1000*60*60*24));
      if(days>=1) setTimeout(()=>setShowNotifBanner(true), 3000);
    }
    // Auto-popup ruleta: mostrar si no se ha visto hoy
    const todayKey = new Date().toISOString().slice(0,10);
    const alreadySeen  = lsGet("gbh:ruletaSeen:"+todayKey, false);
    const alreadyDone  = lsGet("gbh:ruleta:"+todayKey, false);
    if(!alreadySeen && !alreadyDone){
      // Pequeño delay para que la app cargue visualmente primero
      setTimeout(()=>setShowRuleta(true), 600);
    }
    // Vaciar cola pendiente al cargar el perfil
    if(navigator.onLine) flushQueue().then(()=>setPendingSync(lsGet(QUEUE_KEY,[]).length));
  },[]);

  // Detecta si el email ya existe en Supabase al salir del campo
  const checkEmail = async (email) => {
    if(!email.includes("@")) return;
    setAuthMode("checking");
    setAuthErr("");
    const r = await sbReq("GET", `profiles?email=eq.${email.trim().toLowerCase()}&select=id,name`);
    if(r?.length){
      setAuthMode("returning");
      setAName(r[0].name || aName); // Pre-rellena el nombre si existe
    } else {
      setAuthMode("new");
    }
  };

  const doAuth=async()=>{
    if(!aName.trim()||!aEmail.trim())return;
    setLoading(true); setAuthErr("");
    const email=aEmail.trim().toLowerCase(), name=aName.trim();

    // 1️⃣ Buscar en Supabase (fuente de verdad)
    const r = await sbReq("GET", `profiles?email=eq.${email}&select=*`);
    if(r?.length){
      // ── Usuario existente encontrado ──
      const ep = r[0];
      // Restaurar badges desde achievements al hacer login
      const ach = await sbReq("GET", `achievements?profile_id=eq.${ep.id}&select=badge_id`);
      if(ach?.length) lsSet(`gbh:badges:${ep.id}`, ach.map(a=>a.badge_id));
      lsSet(`gbh:p:${ep.id}`, ep);
      lsSet(`gbh:em:${email}`, ep.id);
      lsSet("gbh:lastEmail", email);
      await loadP(ep);
      setLoading(false);
      return;
    }

    // 2️⃣ Sin conexión y el usuario ya existe localmente → no crear cuenta nueva
    if(!navigator.onLine || r === null) {
      const lid = lsGet(`gbh:em:${email}`, null);
      if(lid){ const lp=lsGet(`gbh:p:${lid}`,null); if(lp){ lsSet("gbh:lastEmail",email); await loadP(lp); setLoading(false); return; }}
      setAuthErr("Sin conexión. Conéctate a internet para recuperar tu cuenta.");
      setLoading(false);
      return;
    }

    // 3️⃣ Usuario genuinamente nuevo → crear cuenta
    if(!aWeight || isNaN(parseFloat(aWeight))){
      setAuthErr("Introduce tu peso actual para comenzar.");
      setLoading(false); return;
    }
    const np={id:crypto.randomUUID(),name,email,xp:0,gems:0,shields:0};
    const cr=await sbReq("POST","profiles",np); const fp=cr?.[0]||np;
    lsSet(`gbh:p:${fp.id}`,fp); lsSet(`gbh:em:${email}`,fp.id); lsSet("gbh:lastEmail",email);
    const initW=parseFloat(aWeight);
    if(!isNaN(initW)&&initW>20&&initW<300){
      const initDate=toKey(); // fecha real de registro
      const initEntry={date:initDate,weight:initW,isInitial:true};
      lsSet(`gbh:weights:${fp.id}`,[initEntry]);
      await sbReq("POST","weight_logs",{profile_id:fp.id,log_date:initDate,weight_kg:initW});
    }
    await loadP(fp); setLoading(false);
  };

  const saveLog=useCallback(async(nl,sc)=>{
    if(!profile)return;
    const today=toKey();
    // Persistir tLog del día en su propia clave — nunca se pierde
    lsSet(`gbh:tlog:${today}`, nl);
    const l=[...logs];
    const idx=l.findIndex(x=>x.date===today);
    const e={profile_id:profile.id,date:today,...nl,sc};
    if(idx>=0)l[idx]=e;else l.push(e);
    setLogs(l);lsSet(`gbh:logs:${profile.id}`,l);
    await sbReq("POST","daily_logs",{profile_id:profile.id,log_date:today,diet_followed:nl.diet,steps_done:nl.steps,hydration_done:nl.hydration,sleep_done:nl.sleep,sc:sc||0});
    setPendingSync(lsGet(QUEUE_KEY,[]).length);
  },[profile,logs]);

  const addXG=useCallback(async(ax,ag)=>{
    if(!profile)return;
    const prevXP=profile.xp||0;
    const u={...profile,xp:prevXP+ax,gems:(profile.gems||0)+ag};
    setProfile(u);lsSet(`gbh:p:${u.id}`,u);
    await sbReq("PATCH",`profiles?id=eq.${profile.id}`,{xp:u.xp,gems:u.gems});
    setPendingSync(lsGet(QUEUE_KEY,[]).length);
    // Acumular XP semanal para el desafío "xp_week"
    const {w:wXP,y:yXP}=getISOWeek();
    const wkKey=`gbh:weekXP:${yXP}:${wXP}`;
    lsSet(wkKey,(lsGet(wkKey,0))+(xpG||0));
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
    for(const badge of BADGES){
      const cond={d1:tD>=1,s7:s>=7,s30:s>=30,s100:s>=100,s365:s>=365,w1:wC>=1,w8:wC>=8,w12:wC>=12,pW:pf}[badge.id];
      if(!b.includes(badge.id)&&cond){
        const nb=[...b,badge.id];setBadges(nb);lsSet(`gbh:badges:${profile?.id}`,nb);
        await sbReq("POST","achievements",{profile_id:profile?.id,badge_id:badge.id});
        await addXG(badge.xp,badge.g);
        sfx("badge");
        showT({icon:badge.icon,title:"¡Logro desbloqueado!",sub:badge.t,reward:badge.r});return nb;
      }
    }return b;
  },[profile,logs,addXG]);

  const toggleM=useCallback(async(key)=>{
    const was=tLog[key];
    if(was) return;
    const nl={...tLog,[key]:true};setTLog(nl);await saveLog(nl,steps);
    if(key==="diet") sfx("complete"); else sfx("missionDone");
    await addXG(key==="diet"?15:5,key==="diet"?5:2);
    if(key==="diet"){setStreakAnim(true);setTimeout(()=>setStreakAnim(false),2600);}
    const wasAllDone=tLog.diet&&tLog.steps&&tLog.hydration&&tLog.sleep;
    if(nl.diet&&nl.steps&&nl.hydration&&nl.sleep&&!wasAllDone){
      await addXG(20,10);
      sfx("confetti");
      setTimeout(()=>{setMissionsAnim(true);setTimeout(()=>setMissionsAnim(false),2800);},key==="diet"?2700:0);
    }
    await chkBadges(streak,weights,badges);
  },[tLog,steps,streak,weights,badges,saveLog,addXG,chkBadges]);

  const updSteps=useCallback(async(val)=>{
    const sc=Math.max(0,Math.min(99999,val));setSteps(sc);
    const done=sc>=10000;
    if(done!==tLog.steps){const nl={...tLog,steps:done};setTLog(nl);await saveLog(nl,sc);if(done){sfx("missionDone");await addXG(5,2);showT({icon:"👟",title:"¡10.000 pasos!",sub:"Meta de pasos alcanzada ✅"});}}
    else{ sfx("step"); await saveLog(tLog,sc); }
  },[tLog,saveLog,addXG]);

  const saveW=async(isEdit=false)=>{
    const val=parseFloat(wInput);if(!isWeekend()||isNaN(val)||val<20||val>300)return;
    const today=toKey();
    // Detectar si ya existía registro HOY (edición) o es nuevo
    const alreadyLogged=!!weights.find(w=>w.date===today);
    const nw=weights.filter(w=>w.date!==today);
    nw.push({date:today,weight:val});nw.sort((a,b)=>a.date>b.date?1:-1);
    setWeights(nw);lsSet(`gbh:weights:${profile.id}`,nw);setWInput("");
    await sbReq("POST","weight_logs",{profile_id:profile.id,log_date:today,weight_kg:val});
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
        await sbReq("POST","weight_logs",{profile_id:profile.id,log_date:existingInitDate,weight_kg:w});
      }
    }
    setProfile(updated);
    lsSet(`gbh:p:${updated.id}`, updated);
    await sbReq("PATCH",`profiles?id=eq.${profile.id}`,{name:updated.name,email:updated.email,initial_weight:updated.initial_weight,goal_weight:updated.goal_weight||null});
  };

  const loadRanking = async () => {
    setRankLoading(true);
    // Intentar Supabase primero
    const data = await sbReq("GET","profiles?select=id,name,xp,gems&order=xp.desc&limit=50");
    if(data?.length){
      // Calcular racha local de cada perfil (desde localStorage si existe)
      const enriched = data.map(p=>{
        const logs = lsGet(`gbh:logs:${p.id}`,[]);
        let streak = 0;
        const d = new Date();
        while(true){
          if(logs.find(l=>l.date===toKey(d)&&l.diet)){streak++;d.setDate(d.getDate()-1);}
          else break;
        }
        // Peso inicial y último peso registrado
        const wLogs = lsGet(`gbh:weights:${p.id}`,[]);
        const initEntry = wLogs.find(w=>w.isInitial);
        const lastEntry = wLogs.filter(w=>!w.isInitial).slice(-1)[0];
        const initW2 = initEntry?.weight ?? p.initial_weight ?? null;
        const lastW2 = lastEntry?.weight ?? null;
        const weightDiff = (initW2!==null&&lastW2!==null) ? parseFloat((lastW2-initW2).toFixed(1)) : null;
        const weightAbs  = weightDiff!==null ? Math.abs(weightDiff) : 0; // para ranking
        return {...p, streak, weightDiff, weightAbs};
      });
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
    const today = new Date().toISOString().slice(0,10);
    lsSet("gbh:quiz:"+today, true);
    setQuizDone(true);
    await addXG(xpG, gemG);
  };

  const onChestCollect = async (xpG, gemG) => {
    lsSet("gbh:chestLastOpened", streak);
    setChestOpened(streak);
    await addXG(xpG, gemG);
  };

  const subscribeNotifications = async () => {
    lsSet("gbh:notifAsked", true);
    setNotifPermission(true);
    setShowNotifBanner(false);
    if(typeof window.OneSignalDeferred !== "undefined"){
      window.OneSignalDeferred.push(async (OneSignal)=>{
        await OneSignal.Notifications.requestPermission();
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
    const claimed=[...claimedChallenges,ch.id];
    setClaimedChallenges(claimed);
    lsSet(key,claimed);
    await addXG(ch.xp, ch.gems);
  };

  const onRuletaCollect = async (xpG, gemG) => {
    sfx("ruletteWin");
    const today = new Date().toISOString().slice(0,10);
    lsSet("gbh:ruleta:"+today, true);
    setRuletaDone(true);
    await addXG(xpG, gemG);
  };

  const onWeekChestCollect = async (xpG, gemG) => {
    const {w,y} = getISOWeek();
    lsSet(`gbh:weekChest:${y}:${w}`, true);
    await addXG(xpG, gemG);
  };

  const tapSheep=()=>{const n=taps+1;setTaps(n);if(tapRef.current)clearTimeout(tapRef.current);tapRef.current=setTimeout(()=>setTaps(0),2500);if(n>=5){setScreen("admin");loadAdmin();setTaps(0);}};
  const loadAdmin=async()=>{const d=await sbReq("GET","admin_overview?select=*")||[];if(d.length){setAllP(d);return;}setAllP(Object.keys(localStorage).filter(k=>k.startsWith("gbh:p:")).map(k=>lsGet(k,{})).filter(p=>p.id));};
  const buyShield=async()=>{if(gems<200){sfx("error");showT({icon:"💎",title:t("insufficientGems"),sub:t("needGemsShield")});return;}const u={...profile,gems:gems-200,shields:(profile.shields||0)+1};setProfile(u);lsSet(`gbh:p:${u.id}`,u);await sbReq("PATCH",`profiles?id=eq.${profile.id}`,{gems:u.gems,shields:u.shields});sfx("shield");showT({icon:"🛡️",title:t("shieldActivated"),sub:t("shieldProtected")});};

  const CSS=`
    @import url('https://fonts.googleapis.com/css2?family=Nunito:wght@600;700;800;900&family=DM+Sans:wght@400;500;700&display=swap');
    *{box-sizing:border-box;margin:0;padding:0}body{background:${T.bg};font-family:'Nunito',sans-serif}
    @keyframes aura{0%,100%{opacity:0.5;transform:scale(1)}50%{opacity:1;transform:scale(1.08)}}
    @keyframes float{0%,100%{transform:translateY(0)}50%{transform:translateY(-9px)}}
    @keyframes bounce{0%,100%{transform:translateY(0) rotate(-3deg)}40%{transform:translateY(-16px) rotate(3deg)}65%{transform:translateY(-6px) rotate(-1deg)}} @keyframes headTilt{0%,100%{transform:rotate(-4deg)}50%{transform:rotate(4deg)}}
    @keyframes popIn{0%{transform:scale(0.65);opacity:0}100%{transform:scale(1);opacity:1}}
    @keyframes slideUp{from{transform:translateY(80px);opacity:0}to{transform:translateY(0);opacity:1}}
    @keyframes pulse{0%,100%{box-shadow:0 0 0 0 rgba(255,200,0,0.55)}50%{box-shadow:0 0 0 10px rgba(255,200,0,0)}}
    @keyframes confettiFall{to{transform:translateY(110vh) rotate(800deg);opacity:0}}
    @keyframes glow{0%,100%{box-shadow:0 6px 0 ${T.g3},0 0 18px rgba(88,204,2,0.35)}50%{box-shadow:0 6px 0 ${T.g3},0 0 38px rgba(88,204,2,0.8)}}
    @keyframes wobble{0%,100%{transform:rotate(-8deg)}50%{transform:rotate(8deg)}}
    @keyframes fadeInOut{0%{opacity:0}10%{opacity:1}75%{opacity:1}100%{opacity:0}}
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
  `;

  // Cargar ranking cuando se activa la pestaña
  useEffect(()=>{ if(tab==="ranking") loadRanking(); },[tab]);
  useEffect(()=>{ if(tab==="receta"&&!dailyRecipe&&!recipeLoading) fetchDailyRecipe(); },[tab]);
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
          onChange={e=>{setAEmail(e.target.value);setAuthMode("new");setAuthErr("");}}
          onBlur={e=>checkEmail(e.target.value)}
          placeholder={t("emailPH")} style={{...inp,marginBottom:authMode==="returning"?0:16}}/>

        {authMode==="returning"&&(
          <div style={{background:"rgba(88,204,2,0.12)",border:`1.5px solid ${T.g3}`,borderRadius:14,
            padding:"12px 16px",margin:"12px 0",display:"flex",alignItems:"center",gap:10}}>
            <span style={{fontSize:22}}>👋</span>
            <div>
              <div style={{fontSize:13,fontWeight:900,color:T.g2}}>{t("welcomeBack",{n:aName.split(" ")[0]})}</div>
              <div style={{fontSize:11,color:T.t2,fontFamily:"'DM Sans',sans-serif",marginTop:2}}>
                {t("accountExists")}
              </div>
            </div>
          </div>
        )}

        {authMode==="checking"&&(
          <div style={{textAlign:"center",padding:"10px 0",fontSize:12,color:T.t2,fontFamily:"'DM Sans',sans-serif"}}>
            {t("checkingAccount")}
          </div>
        )}

        {authMode!=="returning"&&(<>
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
        </>)}

        {authErr&&(
          <div style={{background:"rgba(255,75,75,0.12)",border:"1.5px solid rgba(255,75,75,0.4)",
            borderRadius:12,padding:"10px 14px",marginBottom:14,fontSize:12,color:"#FF8080",
            fontFamily:"'DM Sans',sans-serif",textAlign:"center"}}>
            ⚠️ {authErr}
          </div>
        )}

        {(()=>{
          const isReturning = authMode==="returning";
          const dis = loading || authMode==="checking" ||
                      !aEmail.trim() ||
                      (!isReturning && (!aName.trim()||!aWeight||isNaN(parseFloat(aWeight))));
          return(
            <button onClick={doAuth} disabled={dis}
              style={{width:"100%",padding:"17px 20px",borderRadius:18,border:`3px solid ${T.g3}`,
                cursor:dis?"not-allowed":"pointer",fontSize:17,fontWeight:900,
                background:dis?"rgba(255,255,255,0.12)":`linear-gradient(135deg,${T.g1},${T.g2})`,
                color:dis?T.t2:"white",boxShadow:dis?"none":`0 6px 0 ${T.g3}`,
                transition:"all 0.15s",fontFamily:"'Nunito',sans-serif"}}>
              {loading?t("verifying"):isReturning?t("recoverAccount"):t("startAdventure")}
            </button>
          );
        })()}
      </Card>
    </div>
    </LangCtx.Provider>
  );

  // ── ADMIN ────────────────────────────────────────────────────────────────────
  if(screen==="admin"){
    const adh=(id)=>{const l=lsGet(`gbh:logs:${id}`,[]);const d7=Array.from({length:7},(_,i)=>{const d=new Date();d.setDate(d.getDate()-i);return toKey(d);});return Math.round((d7.filter(k=>l.find(x=>x.date===k&&x.diet)).length/7)*100);};
    const pSt=(id)=>{const l=lsGet(`gbh:logs:${id}`,[]);let s=0;const d=new Date();while(true){if(l.find(x=>x.date===toKey(d)&&x.diet)){s++;d.setDate(d.getDate()-1);}else break;}return s;};
    const lW=(id)=>{const w=lsGet(`gbh:weights:${id}`,[]);return w.length?w[w.length-1].weight:null;};
    const st=(a)=>a>=80?{t:"✅ En Objetivo",c:T.g1}:a>=50?{t:"⚠️ Riesgo",c:T.au1}:{t:"🔴 Inactivo",c:T.red};
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
            {allP.length===0?<div style={{color:T.t2,textAlign:"center",padding:"20px 0",fontSize:13,fontFamily:"'DM Sans',sans-serif"}}>Sin datos aún.</div>
            :allP.map(p=>{const a=p.adherence_7d??adh(p.id),s=p.total_streak_days??pSt(p.id),w=p.last_weight??lW(p.id);const{t:si,c:sc}=st(a);return(
              <div key={p.id} style={{borderBottom:"1px solid rgba(255,255,255,0.07)",padding:"12px 0"}}>
                <div style={{display:"flex",justifyContent:"space-between",alignItems:"center",marginBottom:6}}><div style={{fontWeight:900,fontSize:14}}>{p.name}</div><div style={{fontSize:12,fontWeight:800,color:sc}}>{si}</div></div>
                <div style={{display:"flex",gap:14,marginBottom:6}}><span style={{fontSize:12,color:T.t2}}>🔥 <b style={{color:T.t1}}>{s}d</b></span><span style={{fontSize:12,color:T.t2}}>⚖️ <b style={{color:T.t1}}>{w?`${w}kg`:"—"}</b></span><span style={{fontSize:12,color:T.t2}}>7d: <b style={{color:a>=80?T.g1:a>=50?T.au1:T.red}}>{a}%</b></span><span style={{fontSize:12,color:T.t2}}>XP: <b style={{color:T.xp}}>{p.xp||0}</b></span></div>
                <div style={{background:"rgba(255,255,255,0.06)",borderRadius:6,height:6}}><div style={{height:"100%",width:`${a}%`,background:a>=80?T.g1:a>=50?T.au1:T.red,borderRadius:6,transition:"width 0.8s"}}/></div>
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
    <div style={{fontFamily:"'Nunito',sans-serif",background:`radial-gradient(ellipse at top,#1A3A10,${T.bg})`,minHeight:"100vh",maxWidth:420,margin:"0 auto",color:T.t1,paddingBottom:90}}>
      <style>{CSS}</style>
      <Confetti active={confetti}/>
      <StreakOverlay active={streakAnim} streak={streak+1}/>
      <MissionsOverlay active={missionsAnim}/>
      {floatItems.length>0&&<FloatReward items={floatItems}/>}
      <LevelUpOverlay active={levelUpAnim} level={levelUpNum} reward={levelUpRew} patientName={profile?.name||""} onClose={()=>setLevelUpAnim(false)}/>
      {rewardsOpen&&<RewardsModal onClose={()=>setRewardsOpen(false)} currentLevel={lv.l}/>}
      {/* ── Burbuja flotante desafíos ────────────────────────────────────── */}
      {(tab==="home"||tab==="weight"||tab==="ranking")&&(()=>{
        const weekChs   = getWeekChallenges();
        const allClaimed= claimedChallenges.length>=weekChs.length;
        const anyDone   = weekChs.some(ch=>{
          const prog=getChallengeProgress(ch,logs,weights,xp,streak);
          return prog>=ch.goal && !claimedChallenges.includes(ch.id);
        });
        return(
          <button
            onClick={()=>setShowChallenges(true)}
            style={{
              position:"fixed",
              right:18,
              bottom:88, // encima del nav bar
              width:52,height:52,
              borderRadius:"50%",
              background:anyDone
                ?`linear-gradient(135deg,${T.au1},${T.au2})`
                :allClaimed
                  ?"rgba(88,204,2,0.85)"
                  :"rgba(28,18,8,0.92)",
              border:anyDone?`3px solid ${T.au3}`:`2px solid ${allClaimed?T.g3:T.bW}`,
              boxShadow:anyDone
                ?`0 4px 0 ${T.au3},0 0 16px ${T.au1}80`
                :allClaimed
                  ?`0 4px 0 ${T.g3}`
                  :"0 4px 12px rgba(0,0,0,0.5)",
              cursor:"pointer",
              display:"flex",flexDirection:"column",
              alignItems:"center",justifyContent:"center",
              zIndex:9000,
              animation:anyDone?"pulse 1.5s ease-in-out infinite":"none",
              transition:"all 0.3s",
            }}>
            <span style={{fontSize:anyDone?20:18,lineHeight:1}}>
              {allClaimed?"✓":anyDone?"❕":"🎯"}
            </span>
            {/* Contador de reclamables */}
            {anyDone&&(()=>{
              const n=weekChs.filter(ch=>{
                const prog=getChallengeProgress(ch,logs,weights,xp,streak);
                return prog>=ch.goal&&!claimedChallenges.includes(ch.id);
              }).length;
              return n>0?(
                <div style={{
                  position:"absolute",top:-4,right:-4,
                  width:18,height:18,borderRadius:"50%",
                  background:"#FF3B30",border:"2px solid #1C1208",
                  fontSize:10,fontWeight:900,color:"white",
                  display:"flex",alignItems:"center",justifyContent:"center",
                  fontFamily:"'Nunito',sans-serif",
                }}>{n}</div>
              ):null;
            })()}
          </button>
        );
      })()}


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
                  <div style={{fontSize:18,fontWeight:900,color:T.wh}}>🎯 Desafíos semanales</div>
                  <div style={{fontSize:12,color:T.t2,fontFamily:"'DM Sans',sans-serif",marginTop:2}}>
                    {claimedChallenges.length}/{weekChs.length} completados · Se renuevan el lunes
                  </div>
                </div>
                <button onClick={()=>setShowChallenges(false)} style={{
                  background:"rgba(255,255,255,0.08)",border:`1.5px solid ${T.bW}`,
                  borderRadius:"50%",width:32,height:32,color:T.t2,
                  fontSize:16,cursor:"pointer",display:"flex",alignItems:"center",justifyContent:"center"}}>✕</button>
              </div>

              {/* Lista desafíos */}
              <div style={{padding:"0 16px 20px",display:"flex",flexDirection:"column",gap:10}}>
                {weekChs.map(ch=>{
                  const prog    = getChallengeProgress(ch,logs,weights,xp,streak);
                  const pct     = Math.min(100,Math.round((prog/ch.goal)*100));
                  const done    = pct>=100;
                  const claimed = claimedChallenges.includes(ch.id);
                  return(
                    <div key={ch.id} style={{
                      background:claimed?"rgba(88,204,2,0.1)":done?"rgba(88,204,2,0.06)":"rgba(255,255,255,0.04)",
                      border:`1.5px solid ${claimed?T.g1:done?"rgba(88,204,2,0.4)":T.bW}`,
                      borderRadius:18,padding:"12px 14px",transition:"all 0.3s",
                    }}>
                      <div style={{display:"flex",alignItems:"center",gap:12}}>
                        <div style={{fontSize:26,flexShrink:0}}>{claimed?"✅":ch.icon}</div>
                        <div style={{flex:1,minWidth:0}}>
                          <div style={{fontSize:14,fontWeight:900,color:claimed?T.g2:T.wh}}>{ch.title}</div>
                          <div style={{fontSize:11,color:T.t2,fontFamily:"'DM Sans',sans-serif",marginTop:2}}>{ch.desc}</div>
                        </div>
                        <div style={{flexShrink:0,textAlign:"right"}}>
                          {claimed?(
                            <div style={{fontSize:12,color:T.g1,fontWeight:800}}>¡Listo! 🎉</div>
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

      {showQuiz&&<QuizModal onClose={()=>setShowQuiz(false)} onComplete={onQuizComplete} todayKey={new Date().toISOString().slice(0,10)}/>}
      {showChest&&<ChestOpenModal streak={streak} onClose={()=>setShowChest(false)} onCollect={onChestCollect}/>}
      {showWeekChest&&<ChestOpenModal streak={7} onClose={()=>setShowWeekChest(false)} onCollect={onWeekChestCollect}/>}
      {showRuleta&&<RuletaModal
        onClose={()=>{
          const todayKey=new Date().toISOString().slice(0,10);
          lsSet("gbh:ruletaSeen:"+todayKey,true);
          setRuletaAutoShown(true);
          setShowRuleta(false);
        }}
        onCollect={onRuletaCollect}
      />}
      {showPhotoPicker&&(
        <ProfileCardModal
          onClose={()=>setShowPhotoPicker(false)}
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
                Activa los recordatorios
              </div>
              <div style={{fontSize:10,color:"rgba(180,200,255,0.8)",fontFamily:"'DM Sans',sans-serif",marginTop:1}}>
                Racha en peligro · {lang==="en"?"Weekly weigh-in · Daily diet":"Pesaje semanal · Dieta diaria"}
              </div>
            </div>
          </div>
          <div style={{display:"flex",gap:8,flexShrink:0,alignItems:"center"}}>
            <button onClick={subscribeNotifications} style={{
              background:"rgba(100,130,255,0.9)",border:"2px solid rgba(120,150,255,0.6)",
              borderRadius:12,padding:"7px 14px",color:"white",fontWeight:900,
              fontSize:12,cursor:"pointer",fontFamily:"'Nunito',sans-serif",
              boxShadow:"0 3px 0 rgba(60,80,200,0.5)",whiteSpace:"nowrap"}}>
              Activar
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
              <button onClick={()=>{setPwaDismissed(true);lsSet("gbh:pwaDismissed",true);}} style={{background:"rgba(255,255,255,0.08)",border:"1px solid rgba(255,255,255,0.15)",borderRadius:"50%",width:28,height:28,color:"rgba(255,255,255,0.5)",fontSize:14,cursor:"pointer",display:"flex",alignItems:"center",justifyContent:"center",flexShrink:0}}>✕</button>
            </div>
          </div>
        );
      })()}

      {/* Banner peso fin de semana — con X para cerrar */}
      {isWeekend()&&!weights.find(w=>w.date===toKey())&&!weightBannerDismissed&&(
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
                ¡Registra tu peso esta semana!
              </div>
              <div style={{fontSize:11,color:"rgba(255,255,255,0.82)",fontFamily:"'DM Sans',sans-serif",marginTop:2}}>
                Pulsa para ir al pesaje →
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
          {/* Counters + mute */}
          <div style={{display:"flex",gap:8,alignItems:"center"}}>
            <StreakBadge value={streak} label={t("streakLabel")} icon="🔥" color="#FF8040" bg="rgba(255,128,64,0.12)"/>
            <StreakBadge value={gems}  label={t("gemsLabel")}  icon="💎" color={T.au1}   bg="rgba(255,200,0,0.1)"/>
            <button onClick={()=>{ const nm=!muted; setMuted(nm); lsSet("gbh:mute",nm); if(!nm) SFX.tap(); }}
              style={{background:"rgba(255,255,255,0.07)",border:`1.5px solid rgba(255,255,255,0.12)`,
                borderRadius:14,width:36,height:36,cursor:"pointer",fontSize:18,
                display:"flex",alignItems:"center",justifyContent:"center"}}>
              {muted?"🔇":"🔊"}
            </button>
          </div>
        </div>
      </div>

      <div style={{padding:"4px 18px 0"}}>

        {/* ── HOME ──────────────────────────────────────────────────────────── */}
        {tab==="home"&&<>
          {/* Mascot + bubble */}
          <div style={{display:"flex",flexDirection:"column",alignItems:"center",gap:14,paddingTop:4,paddingBottom:18}}>
            <Bubble msg={getBubbleMsg(profile?.name||"",streak,expr,lang)}/>
            <div onClick={tapSheep} style={{cursor:"pointer"}}>
              <AvatarDisplay expr={expr} size={200}/>
            </div>
          </div>

          <WeeklyXPGoal logs={logs} xp={xp}/>
          <WeekPath logs={logs} onOpenChest={()=>{ sfx("chest"); setShowWeekChest(true); }}/>
          {allDone&&<TomorrowCard name={profile?.name||""} streak={streak}/>}

          {/* Section label */}
          <div style={{textAlign:"center",marginBottom:12}}>
            <span style={{background:T.bgWood,border:`2px solid ${T.bW}`,borderRadius:16,padding:"7px 20px",fontSize:11,fontWeight:900,color:T.au1,textTransform:"uppercase",letterSpacing:"0.08em",boxShadow:"0 4px 0 rgba(0,0,0,0.4)"}}>{t("dailyMissions")}</span>
          </div>

          <BigBtn icon="🍽️" label={t("dietBtn")} done={tLog.diet} onClick={()=>toggleM("diet")}/>

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
              <button onClick={buyShield} style={{background:gems>=200?`linear-gradient(135deg,${T.au1},${T.au2})`:"rgba(255,255,255,0.08)",border:"none",borderRadius:16,padding:"12px 20px",color:gems>=200?"#1A1000":T.t2,fontWeight:900,cursor:"pointer",fontSize:14,boxShadow:gems>=200?`0 5px 0 ${T.au3}`:"none",fontFamily:"'Nunito',sans-serif"}}>
                💎 200
              </button>
            </div>
          </Card>
        </>}

        {/* ── WEIGHT ────────────────────────────────────────────────────────── */}
        {tab==="weight"&&(()=>{
          const todayW=weights.find(w=>w.date===toKey());
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
              {chartData.length>0&&<WeightChart chartData={chartData} setWeightMode={setWeightMode} goalWeight={profile?.goal_weight||null}/>}
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
            </div>
          );

          // ── Modo CHART (vista de gráfica) ────────────────────────────────
          return(
            <>
              {/* Card resumen del pesaje de hoy */}
              {todayW&&(
                <div style={{background:`linear-gradient(135deg,rgba(43,122,0,0.4),rgba(88,204,2,0.18))`,border:`2px solid ${T.g1}`,borderRadius:22,padding:"16px 20px",marginBottom:14,boxShadow:`0 6px 0 ${T.g3}`,display:"flex",alignItems:"center",justifyContent:"space-between"}}>
                  <div>
                    <div style={{fontSize:11,color:T.g2,fontWeight:900,textTransform:"uppercase",letterSpacing:"0.08em",marginBottom:4}}>✅ Pesaje registrado hoy</div>
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
              {chartData.length>0&&<WeightChart chartData={chartData} setWeightMode={setWeightMode} goalWeight={profile?.goal_weight||null}/>}
              {/* Empty state */}
              {chartData.length===0&&(
                <Card style={{textAlign:"center",padding:"28px"}}>
                  <div style={{display:"flex",justifyContent:"center",marginBottom:12}}><Mascot expr="idle" size={110}/></div>
                  <div style={{fontSize:16,fontWeight:900,color:T.t1,marginBottom:6}}>Tu gráfica aparecerá aquí</div>
                  <div style={{color:T.t2,fontSize:13,fontFamily:"'DM Sans',sans-serif",lineHeight:1.6}}>Registra tu primer pesaje<br/>para ver tu evolución</div>
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
          const byXP     = [...ranking].sort((a,b)=>(b.xp||0)-(a.xp||0));
          const byWeight = [...ranking].sort((a,b)=>(b.weightAbs||0)-(a.weightAbs||0));

          const tables=[
            {key:"streak", icon:"🔥", title:t("rankStreak"), subtitle:t("rankStreakSub"),  list:byStreak,  statFn:p=>`${p.streak||0}🔥`,  statLabel:t("rankDays")},
            {key:"xp",     icon:"⚡", title:t("rankXP"),     subtitle:t("rankXPSub"),       list:byXP,      statFn:p=>`${p.xp||0} XP`,     statLabel:"XP"},
            {key:"weight", icon:"⚖️", title:t("rankWeight"), subtitle:t("rankWeightSub"),   list:byWeight,  statFn:p=>p.weightDiff!==null?`${p.weightDiff>=0?"+":""}${p.weightDiff}kg`:"—", statLabel:"kg"},
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
                        {/* Avatar con marco de nivel */}
                        {(()=>{
                          const pFrame = Math.floor(Math.min(lv2.l,500)/100)||0;
                          const fr2 = FRAMES[pFrame];
                          return(
                            <div style={{width:38,height:38,borderRadius:12,
                              background:isMe?`linear-gradient(135deg,${T.au1},${T.au2})`:"linear-gradient(135deg,#2A5A2A,#1A3A10)",
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
                          <div style={{fontSize:16,fontWeight:900,color:rankTab===0?"#FF8040":rankTab===1?T.xp:T.t1}}>{curTable.statFn(p)}</div>
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
                        <div style={{width:38,height:38,borderRadius:12,background:`linear-gradient(135deg,${T.au1},${T.au2})`,display:"flex",alignItems:"center",justifyContent:"center",flexShrink:0,border:`2px solid ${T.au3}`,boxShadow:"0 3px 0 rgba(0,0,0,0.4)"}}>
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
            // EN equivalents
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
          const ti = r ? (tipoIcon[r.tipo]||"🍽️") : "🍽️";

          // Parse ingredients as bullet list
          const ingList = r?.ingredientes?.split(/,(?![^(]*\))/).map(s=>s.trim()).filter(Boolean) || [];

          return(
            <div style={{padding:"0 16px 24px"}}>
              {/* Header */}
              <div style={{display:"flex",alignItems:"center",justifyContent:"space-between",
                marginBottom:16,paddingTop:4}}>
                <div>
                  <div style={{fontSize:11,color:T.au1,fontWeight:900,textTransform:"uppercase",
                    letterSpacing:"0.1em",marginBottom:2}}>{t("recipeOfDay")}</div>
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
                <div style={{textAlign:"center",padding:40,color:T.t2,fontSize:14}}>
                  {t("loadingRecipe")}
                </div>
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
                      <div style={{fontSize:20,fontWeight:900,color:T.wh,lineHeight:1.25}}>
                        {r.nombre}
                      </div>
                    </div>
                  </div>

                  {/* Macros */}
                  <div style={{display:"grid",gridTemplateColumns:"1fr 1fr 1fr 1fr",gap:8}}>
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
                </Card>

                {/* Ingredientes */}
                <Card style={{marginBottom:12,padding:"18px 18px"}}>
                  <div style={{fontSize:11,color:T.au1,fontWeight:900,textTransform:"uppercase",
                    letterSpacing:"0.1em",marginBottom:12}}>{t("ingredients")}</div>
                  <div style={{display:"flex",flexDirection:"column",gap:7}}>
                    {ingList.map((ing,i)=>(
                      <div key={i} style={{display:"flex",alignItems:"flex-start",gap:10}}>
                        <div style={{width:6,height:6,borderRadius:"50%",background:tc,
                          flexShrink:0,marginTop:6}}/>
                        <div style={{fontSize:13,color:T.t1,fontFamily:"'DM Sans',sans-serif",
                          lineHeight:1.4}}>
                          {ing}
                        </div>
                      </div>
                    ))}
                  </div>
                </Card>

                {/* Preparación */}
                <Card style={{padding:"18px 18px"}}>
                  <div style={{fontSize:11,color:T.au1,fontWeight:900,textTransform:"uppercase",
                    letterSpacing:"0.1em",marginBottom:12}}>{t("preparation")}</div>
                  <div style={{fontSize:13,color:T.t1,fontFamily:"'DM Sans',sans-serif",
                    lineHeight:1.7,whiteSpace:"pre-wrap"}}>
                    {r.instrucciones}
                  </div>
                </Card>
              </>)}

              {!recipeLoading&&!r&&(
                <div style={{textAlign:"center",padding:40}}>
                  <div style={{fontSize:48,marginBottom:12}}>🍽️</div>
                  <div style={{fontSize:15,color:T.t2,fontFamily:"'DM Sans',sans-serif",whiteSpace:"pre-line"}}>
                    {t("recipeLoadError")}
                  </div>
                  <button onClick={fetchDailyRecipe}
                    style={{marginTop:16,padding:"12px 24px",background:T.g1,border:"none",
                      borderRadius:14,color:"white",fontWeight:900,cursor:"pointer",
                      fontFamily:"'Nunito',sans-serif"}}>
                    {t("retry")}
                  </button>
                </div>
              )}
            </div>
          );
        })()}

                {tab==="achievements"&&<>
          <Card style={{display:"flex",justifyContent:"space-around",alignItems:"center",padding:"16px"}}>
            <div style={{textAlign:"center"}}><div style={{fontSize:26,fontWeight:900,color:T.au1}}>{badges.length}/{BADGES.length}</div><div style={{color:T.t2,fontSize:11,fontFamily:"'DM Sans',sans-serif"}}>{t("achievementsLabel")}</div></div>
            <div style={{textAlign:"center"}}><div style={{fontSize:26,fontWeight:900,color:T.xp}}>{xp}</div><div style={{color:T.t2,fontSize:11,fontFamily:"'DM Sans',sans-serif"}}>{t("xpTotalLabel")}</div></div>
            <div style={{textAlign:"center"}}><div style={{fontSize:26,fontWeight:900,color:T.au1}}>{gems}</div><div style={{color:T.t2,fontSize:11,fontFamily:"'DM Sans',sans-serif"}}>{t("gemsStatLabel")}</div></div>
          </Card>
          {badges.length===0&&(
            <div style={{textAlign:"center",padding:"20px 0 10px"}}>
              <div style={{display:"flex",justifyContent:"center",marginBottom:10}}><Mascot expr="idle" size={110}/></div>
              <div style={{fontSize:16,fontWeight:900,color:T.t1,marginBottom:6}}>{lang==="en"?"Unlock your first achievement!":"¡Desbloquea tu primer logro!"}</div>
              <div style={{fontSize:13,color:T.t2,fontFamily:"'DM Sans',sans-serif",lineHeight:1.6}}>{lang==="en"?"Log your diet today to\nearn your first medal 🏅":"Registra la dieta hoy para\nconseguir tu primera medalla 🏅"}</div>
            </div>
          )}
          {badges.length>=3&&(
            <div style={{display:"flex",justifyContent:"center",marginBottom:10}}>
              <Mascot expr={badges.length>=6?"legend":"excited"} size={130}/>
            </div>
          )}
          {BADGES.map(b=>{
            const done=badges.includes(b.id);
            return(
              <div key={b.id} style={{background:done?`linear-gradient(135deg,rgba(43,122,0,0.55),rgba(88,204,2,0.22))`:T.bgWood,borderRadius:22,padding:18,border:`2.5px solid ${done?T.bG:T.bW}`,boxShadow:done?`0 5px 0 ${T.g3}`:"0 5px 0 rgba(0,0,0,0.5)",marginBottom:10,opacity:done?1:0.4,display:"flex",alignItems:"center",gap:14,transition:"all 0.25s"}}>
                <div style={{fontSize:30,width:54,height:54,display:"flex",alignItems:"center",justifyContent:"center",borderRadius:18,flexShrink:0,background:done?"rgba(88,204,2,0.15)":"rgba(255,255,255,0.05)",filter:done?"none":"grayscale(1)",boxShadow:done?`0 4px 0 ${T.g3}`:"0 3px 0 rgba(0,0,0,0.5)",border:`2px solid ${done?T.bG:"rgba(255,255,255,0.08)"}`}}>{b.icon}</div>
                <div style={{flex:1}}>
                  <div style={{fontWeight:900,fontSize:15}}>{b.t}</div>
                  <div style={{fontSize:12,color:T.t2,marginTop:2,fontFamily:"'DM Sans',sans-serif"}}>{b.d}</div>
                  <div style={{fontSize:11,color:T.xp,marginTop:3,fontWeight:700}}>+{b.xp} XP · +{b.g} 💎</div>
                  {b.r&&<div style={{fontSize:11,color:done?T.au1:"rgba(255,200,0,0.28)",marginTop:5,fontWeight:800}}>🎁 {b.r}</div>}
                </div>
                {done&&<div style={{color:T.g1,fontSize:24,flexShrink:0,fontWeight:900,textShadow:`0 2px 8px ${T.g1}`}}>✓</div>}
              </div>
            );
          })}
        </>}
      </div>

      {/* ── BOTTOM NAV ────────────────────────────────────────────────────── */}
      <div style={{position:"fixed",bottom:0,left:"50%",transform:"translateX(-50%)",width:"100%",maxWidth:420,background:"rgba(8,18,8,0.97)",backdropFilter:"blur(30px)",borderTop:`3px solid ${T.bW}`,display:"flex",padding:"10px 0 10px",zIndex:100}}>
        {[{id:"home",icon:"🏠",l:t("tabHome")},{id:"receta",icon:"🍰",l:t("tabRecipe")},{id:"weight",icon:"⚖️",l:t("tabWeight")},{id:"ranking",icon:"👑",l:t("tabRanking")},{id:"achievements",icon:"🏅",l:t("tabAchievements")}].map(({id,icon,l})=>(
          <button key={id} onClick={()=>{ sfx("tap"); setTab(id); }} style={tabSt(tab===id)}>
            <span style={{fontSize:26,filter:tab===id?"none":"grayscale(0.6)",transition:"all 0.2s"}}>{icon}</span>
            <span>{l}</span>
            {tab===id&&<div style={{width:24,height:4,background:T.au1,borderRadius:4,boxShadow:`0 0 10px ${T.au1}`,marginTop:1}}/>}
          </button>
        ))}
      </div>
    </div>
    </LangCtx.Provider>
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
export default function App(){
  return <ErrorBoundary><GBHApp/></ErrorBoundary>;
}
