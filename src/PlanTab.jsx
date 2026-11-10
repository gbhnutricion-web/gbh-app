// ─── Pestaña Plan ────────────────────────────────────────────────────────────
// Sacada de App.jsx el 10-nov-2026 TAL CUAL (MAESTRO-2026-1235): se carga aparte y se precarga
// tras pintar. Única diferencia: _perfilActualId se escribe con setPerfilActualId(), porque una
// importación es de solo lectura.
import React, { useState, useEffect, useCallback, useMemo, useRef } from "react";
import { BannerSemanaNueva } from "./PlanArcade";
import { BoMomento, PreguntaBo } from "./PreguntaBo";
import { FRACCIONES_MENOS, FRAC_MENOS_DEFECTO, fraccionValida, previstoToma, realToma, sumaItems } from "./kcalDia";
import { QueComiste } from "./QueComiste";
import { TuDia } from "./TuDia";
import { _NUTRI_ING } from "./nutriIng";
import { bloque } from "./juego32";
import { boActivo, contieneIngrediente, filaMomento, firmaTema, marcarMomentoVisto, momentoVisto, planBo, textoTema } from "./boLogica";
import { claveMemoriaCambio, elegirPlatoMenu, elegirRecetaCambio, guardarMemoriaCambio, leerMemoriaCambio, listasPlatoMenu, normNombreCambio, permitidasDePlanes, recomponerMenu, rolPlatoMenu } from "./cambioReceta";
import { costePorRacion, racionesDeLaLista, textosCajaRacion } from "./raciones";
import { fusionarPlanes, persistirCelda } from "./celdaPlan";
import { BotonCompartirReceta, ES_ANDROID_NATIVO, ES_IOS_NATIVO, ES_NATIVO, GBHApp, GBH_GEN_TOKEN, GBH_SERVER_URL, GBH_WHATSAPP, MiniListaCompra, OverlayGenerando, PLAN_CUMPL, PLAN_DIAS, PLAN_DIAS_F, PLAN_TIPO_BG, PLAN_TIPO_COLOR, PLAN_TOMAS, PLAN_TOMA_IC, PlanConfig, REDUCED_MOTION, SUPL_IC, SeguimientoView, Sheep, T, _fmtCompra, abrirCheckoutStripe, agregarListaCompra, alpha, boIA, boIAConsentir, boRegistrar, costeListaItems, costeRecetaJS, emojiPlato, enqueue, escalarIngredientesJS, escalon, eurES, fusionarIngredientesJS, getSesion, interpretarRechazados, leerRecetarioCompleto, lsGet, lsSet, menuEtiqueta, menuEtiquetaCorta, normSupl, racionEtiqueta, racionTextoJS, recetaRechazadaJS, sbDirect, sbReq, suplHechosKey, suplTrasToma, toKey, txtWebAndroid, setPerfilActualId } from "./App.jsx";

export default function PlanTab({profile,lang,hoyKey,setProfile,savedRecipes,setSavedRecipes,descartadas,setDescartadas,showT,sfx,t,setTab,onMealRegistered,vistaInicial,onVistaConsumida,onTutoEvent,onSupl}){
  const isPremium=profile?.plan==='premium';
  const isStandard=profile?.plan==='standard';
  const tieneAcceso=isPremium||isStandard;
  const gems=profile?.gems??0;
  // ── Semana de prueba: regenerar y cambiar recetas es GRATIS (tutorial §B3:
  //    «invita la casa»). Al acabar el trial vuelven el candado semanal y las
  //    gemas de siempre. ──
  const enTrial = isStandard && profile?.trial_ends_at && Date.parse(profile.trial_ends_at)>Date.now();
  const [planes,setPlanes]=React.useState([]);
  const [idx,setIdx]=React.useState(0);
  const [loading,setLoading]=React.useState(true);
  const [view,setView]=React.useState(null);
  // "Ver mi seguimiento →" del espejo llega desde Inicio con una vista inicial:
  // se consume una vez y se limpia en el padre, para que la siguiente entrada
  // manual a Programación arranque en el menú de siempre.
  React.useEffect(()=>{
    // 'config' (desde «Pregúntale a Bo»): la pantalla «Configura tu plan», solo del estándar.
    // {vista:'daily', dia, toma, bo} (Bo con IA desde Inicio): esa comida, con el cambio ya preparado.
    if(vistaInicial){
      if(typeof vistaInicial==='object'){ setView('daily'); setBoNav({dia:vistaInicial.dia, toma:vistaInicial.toma, bo:vistaInicial.bo||null}); }
      else if(vistaInicial==='config'){ if(isStandard) setConfigView(true); }
      else setView(vistaInicial);
      onVistaConsumida&&onVistaConsumida(); }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  },[vistaInicial]);
  // ── Tour guiado: la lista de la compra vista de verdad avanza su paso ──────
  React.useEffect(()=>{ if(view==='lista') onTutoEvent&&onTutoEvent('lista_vista');
  // eslint-disable-next-line react-hooks/exhaustive-deps
  },[view]);
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
  // Durante el trial NO hay candado: se puede regenerar cuantas veces se quiera
  const planBloqueado = !enTrial && isStandard && tienePlan && lunesDelPlan!==null && lunesDelPlan >= lunesActual;
  // Días que faltan hasta el próximo lunes (para el mensaje)
  const proximoLunes = lunesActual + 7*24*60*60*1000;
  const diasDesbloqueo = planBloqueado ? Math.max(1, Math.ceil((proximoLunes - Date.now())/(24*60*60*1000))) : 0;
  const _hoyD=()=>hoyKey?new Date(hoyKey+"T12:00:00"):new Date();
  const todayJS=_hoyD().getDay();
  const todayPlan=todayJS===0?7:todayJS;
  const [selDay,setSelDay]=React.useState(todayPlan);
  // Al cruzar la medianoche con la pestaña abierta, el día seleccionado salta
  // al nuevo "hoy". Antes se quedaba clavado en el de ayer que, si la noche era
  // la del domingo, ya pertenecía a la semana anterior.
  const _diaRef=React.useRef(hoyKey);
  React.useEffect(()=>{
    if(_diaRef.current===hoyKey) return;
    _diaRef.current=hoyKey;
    setSelDay(todayPlan);
  },[hoyKey,todayPlan]);
  const [openToma,setOpenToma]=React.useState(null);
  const [tomaReceta,setTomaReceta]=React.useState(null);
  const [loadingToma,setLoadingToma]=React.useState(false);
  // ── Pareja vinculada (Fase 1) ──────────────────────────────────────────────
  // Solo se carga el plan de la pareja si el vínculo está ACEPTADO por los dos.
  const [pareja,setPareja]=React.useState(null);          // {id,nombre} o null
  const [parejaPlanJ,setParejaPlanJ]=React.useState(null);
  const [cocinarDos,setCocinarDos]=React.useState(false);
  const [cocinarDeMas,setCocinarDeMas]=React.useState(1); // 1 | 2 | 3 (§5.3)
  // ── MENÚ DESGLOSADO (tomas de objetivo alto: 1º y 2º) ──
  // {etiquetas:[..], platos:[..], kcalTotal} o null si la toma es de un plato.
  const [tomaMenu,setTomaMenu]=React.useState(null);
  const [platoSel,setPlatoSel]=React.useState(0);
  React.useEffect(()=>{
    let vivo=true;
    if(!profile?.id){ setPareja(null); setParejaPlanJ(null); return; }
    (async()=>{
      const filas=await sbReq('GET',`couple_links?select=de_id,a_id&estado=eq.aceptado`
        +`&or=(de_id.eq.${profile.id},a_id.eq.${profile.id})&limit=1`);
      const l=Array.isArray(filas)?filas[0]:null;
      if(!vivo) return;
      if(!l){ setPareja(null); setParejaPlanJ(null); return; }
      const otroId = l.de_id===profile.id ? l.a_id : l.de_id;
      const perf=await sbReq('GET',`perfiles_publicos?id=eq.${otroId}&select=id,name&limit=1`);  // Fase 2b: perfil ajeno → vista pública
      if(!vivo) return;
      setPareja({id:otroId, nombre:(Array.isArray(perf)&&perf[0]?.name)||''});
    })();
    return ()=>{vivo=false;};
  },[profile?.id]);
  const [generando,setGenerando]=React.useState(false);
  // ── Recetas DESCARTADAS (repositorio OCULTO) ───────────────────────────────
  // El estado ÚNICO vive en GBHApp (props descartadas/setDescartadas), igual
  // que savedRecipes: así el descarte hecho desde el recetario completo y el
  // hecho desde la ficha de una toma comparten fuente de verdad y caché
  // (gbh:discarded:{id}). La carga inicial también la hace GBHApp en el login.

  // ── Registro de cumplimiento por comida (aditivo) ───────────────────────────
  // El paciente marca, por toma del día, qué hizo (seguida / menos / cambiada /
  // comí fuera / saltada) y deja una nota libre del día. Se persiste en
  // daily_logs (columnas meals_log jsonb, day_note text) por la MISMA vía de
  // upsert que ya usa el resto de la app. No toca diet/steps/sleep ni la lógica
  // de rachas, XP o calorías: es una capa de información para el nutricionista.
  // ⚠️ Deps [hoyKey], no []. Congelado al montar, con la app viva pasada la
  // medianoche del domingo la tira de días y `selDateKey` seguían apuntando a
  // la semana ANTERIOR: lo que el paciente marcaba hoy se escribía 7 días atrás.
  const lunesSemana = React.useMemo(()=>{
    const d=_hoyD(); const dow=d.getDay(); const off=dow===0?6:dow-1;
    return new Date(d.getFullYear(),d.getMonth(),d.getDate()-off);
  // eslint-disable-next-line react-hooks/exhaustive-deps
  },[hoyKey]);
  const fechaDeDia = (n)=>{ const d=new Date(lunesSemana); d.setDate(d.getDate()+(n-1)); return d; };
  const selDateKey = toKey(fechaDeDia(selDay));
  const finDeHoy   = (()=>{ const d=new Date(); d.setHours(23,59,59,999); return d; })();
  const esFuturo   = fechaDeDia(selDay) > finDeHoy;             // no se registran días futuros
  // ── Semana vigente ──────────────────────────────────────────────────────────
  // La semana en curso es la MÁS RECIENTE EN FECHA DE PUBLICACIÓN (fecha_gen).
  // Es lo que el nutricionista espera: al publicar una semana nueva, esa pasa a
  // ser la actual del paciente. Así el arranque queda coherente con lo que ya
  // hace la generación (que salta a planes[0], la recién publicada).
  // Respaldos, por si faltara fecha_gen: (1) patient_config.semana_actual, y
  // (2) la primera de la lista (planes viene ordenado semana.desc → idx 0 = nº
  // más alto). Antes se priorizaba semana_actual, y si el generador no la
  // refrescaba (se quedaba en 6), el paciente veía una semana vieja aunque
  // hubiera un plan más nuevo publicado.
  // (Declarado ANTES de puedeRegistrar porque este depende de él.)
  const idxActual = React.useMemo(()=>{
    if(!Array.isArray(planes) || !planes.length) return 0;
    // 1) Prioridad: la de fecha de publicación más reciente.
    let best=-1, bestT=-Infinity;
    planes.forEach((p,i)=>{ const t=p.fecha_gen?Date.parse(p.fecha_gen):NaN; if(!isNaN(t)&&t>bestT){bestT=t;best=i;} });
    if(best>=0) return best;
    // 2) Respaldo: la que el config marca como actual.
    const sa = config?.semana_actual;
    if(sa!=null){
      const i = planes.findIndex(p=>String(p.semana)===String(sa));
      if(i>=0) return i;
    }
    // 3) Último recurso: la de número más alto (planes va en semana.desc).
    return 0;
  },[planes, config?.semana_actual]);
  // El registro de platos se ancla a la SEMANA VIGENTE (idxActual), no a la de
  // número más alto (idx===0). Con idx===0, un reinicio de ciclo (S12 → S1) o
  // una fila huérfana con nº alto dejaban el registro apuntando a un plan viejo:
  // el paciente monitorizaba los platos de una semana que no era.
  const puedeRegistrar = (idx===idxActual) && !esFuturo;        // solo la semana en curso
  const [regDia,setRegDia]   = React.useState({});              // { 'YYYY-MM-DD': {meals:{}, note:''} }
  const [notaTmp,setNotaTmp] = React.useState('');              // texto en edición de la nota del día
  const [notaOK,setNotaOK]   = React.useState(false);           // indicador "guardada ✓"
  const realDia = regDia[selDateKey]?.real || {};                // Kcal reales: detalle por toma (fase 1: fracción de «menos»)

  // Carga inicial: semilla desde caché local + refresco remoto de la semana actual.
  React.useEffect(()=>{
    if(!profile?.id) return;
    const cache = lsGet(`gbh:logs:${profile.id}`, []);
    const seed={};
    (Array.isArray(cache)?cache:[]).forEach(l=>{
      if(l?.date && (l.meals || l.note || l.real)) seed[l.date]={meals:l.meals||{}, note:l.note||'', real:l.real||{}};
    });
    setRegDia(seed);
    const lunesKey=toKey(lunesSemana);
    sbReq('GET',`daily_logs?profile_id=eq.${profile.id}&log_date=gte.${lunesKey}&select=log_date,meals_log,day_note,meals_real`)
      .then(rows=>{
        if(!Array.isArray(rows)) return;
        setRegDia(prev=>{
          const next={...prev};
          rows.forEach(r=>{ const k=r.log_date; if(!k) return;
            next[k]={meals:r.meals_log||next[k]?.meals||{}, note:(r.day_note??next[k]?.note)||'', real:r.meals_real||next[k]?.real||{}}; });
          return next;
        });
      });
  },[profile?.id,hoyKey]); // eslint-disable-line react-hooks/exhaustive-deps
                           // `hoyKey`: al cruzar la medianoche se relee la semana
                           // (que puede ser otra) en vez de arrastrar la vieja.

  // Al cambiar de día (o llegar datos remotos), refleja la nota de ese día en el textarea.
  React.useEffect(()=>{ setNotaTmp(regDia[selDateKey]?.note||''); setNotaOK(false); },[selDateKey, regDia[selDateKey]?.note]); // eslint-disable-line react-hooks/exhaustive-deps

  // Persiste un cambio del día: actualiza estado, caché local y upsert parcial a Supabase.
  // El merge se basa en la caché local (que escribimos de forma SÍNCRONA) para que
  // toques rápidos sobre varias comidas se acumulen sin pisarse.
  const persistDia = (dateKey,{toma,estado,note,real}) => {
    const key=`gbh:logs:${profile.id}`;
    const arr=lsGet(key,[]); const i=arr.findIndex(l=>l.date===dateKey);
    const cur = i>=0 ? arr[i] : {date:dateKey,diet:false,steps:false,hydration:false,sleep:false,sc:0,meals:{},note:''};
    let meals = {...(cur.meals||{})};
    if(toma){
      if(meals[toma]===estado) delete meals[toma];   // volver a tocar el mismo estado lo desmarca
      else meals[toma]=estado;
    }
    const nota = note!==undefined ? note : (cur.note||'');
    // Kcal reales (fase 1): `real[toma]` guarda lo que el plan NO sabe (hoy, la fracción
    // de «menos»; en la fase 2, los ítems de «la cambié»/«comí fuera»). Cambiar o desmarcar
    // el estado de una toma borra su detalle; `real:{toma,detalle}` lo escribe (detalle null lo borra).
    // Viaja en daily_logs.meals_real, columna aparte: meals_log sigue siendo la cadena de siempre.
    let realMap={...(cur.real||{})}; let realTocado=false;
    if(toma){ delete realMap[toma]; realTocado=true; }
    if(real&&real.toma){ if(real.detalle) realMap[real.toma]=real.detalle; else delete realMap[real.toma]; realTocado=true; }
    const entry={...cur,meals,note:nota,real:realMap};
    if(i>=0) arr[i]=entry; else arr.push(entry);
    try{ lsSet(key,arr); }catch{}
    setRegDia(prev=>({...prev,[dateKey]:{meals,note:nota,real:realMap}}));
    // upsert parcial: solo envía las columnas que cambian (no toca diet/steps/sleep/…)
    const body={profile_id:profile.id,log_date:dateKey};
    if(toma) body.meals_log=meals;
    if(note!==undefined) body.day_note=nota;
    if(realTocado) body.meals_real=realMap;
    sbReq('POST','daily_logs?on_conflict=profile_id,log_date',body);
    // Avisar a Inicio: actualiza los mini-botones por toma y, si con este registro
    // quedan todas las tomas del día registradas, completa la misión de dieta (racha).
    if(toma && typeof onMealRegistered==='function') onMealRegistered(dateKey, meals);
  };
  const setEstadoComida = (toma,estado)=>{ if(!puedeRegistrar) return; const seSetea = regDia[selDateKey]?.meals?.[toma]!==estado; persistDia(selDateKey,{toma,estado}); sfx&&sfx('step'); onTutoEvent&&onTutoEvent('comida_marcada');
    if(seSetea&&estado==='fuera') setHoja({toma,modo:'sustituir'}); else if(seSetea&&estado==='anadida') setHoja({toma,modo:'anadir'});   // al marcar: 🔄 pregunta qué comiste en vez de la receta; ➕ qué añadiste (las dos se cierran con «Ahora no»)
    if(seSetea&&boActivo(profile)) avisoBoMomento(estado); };
  // «Pregúntale a Bo»: al marcar ⏭️ o 🔄, el texto FIRMADO de ese momento, una vez al día (hoyKey,
  // no el día que se marca), en un bocadillo que no bloquea. Sin fila firmada, no sale nada.
  const [boMomento,setBoMomento] = React.useState(null);       // {texto, firma, tema} | null
  const [boHoja,setBoHoja] = React.useState(false);            // «Pregúntale a Bo» desde la ficha de receta
  const avisoBoMomento = (estado)=>{
    const ctxB = {plan:planBo(profile)};
    const f = filaMomento(estado, ctxB); if(!f) return;
    let alm=null; try{ alm=window.localStorage; }catch(e){ alm=null; }
    if(momentoVisto(alm, profile?.id, hoyKey)) return;
    marcarMomentoVisto(alm, profile?.id, hoyKey);
    setBoMomento({texto:textoTema(f, ctxB, lang), firma:firmaTema(f, ctxB), tema:f.id});
    boRegistrar({profile_id:profile?.id,tipo:'uso',contexto:f.contexto[0],tema:f.id,resultado:'abierto'});
  };
  // Kcal reales (fase 2): la hoja «¿Qué comiste?» — 'sustituir' (la cambié / comí fuera) o 'extras' (sobre cualquier estado).
  // Los ítems viajan con sus números dentro; el total se recalcula aquí con sumaItems y se guarda en meals_real[toma].
  const [hoja,setHoja] = React.useState(null);                 // {toma, modo} | null
  const abrirHoja = (toma,modo)=>{ if(!puedeRegistrar) return; setHoja({toma,modo}); sfx&&sfx('tap'); };
  const guardarHoja = (items,conocido)=>{
    if(!hoja) return;
    const prev = realDia[hoja.toma] || {};
    let detalle;
    if(hoja.modo==='extras'){ detalle = {...prev, extras: items}; }
    else { const s = sumaItems(items); const ok = conocido!==false && items.length>0;
      detalle = {...prev, items, conocido: ok, kcal: ok? Math.round(s.kcal) : null, p: ok? +s.p.toFixed(1) : 0, h: ok? +s.h.toFixed(1) : 0, g: ok? +s.g.toFixed(1) : 0, conMacros: ok ? s.conMacros : false}; }
    persistDia(selDateKey,{real:{toma:hoja.toma, detalle}});
    setHoja(null); sfx&&sfx('step');
  };
  // «Menos»: ¿cuánto? (¼ · ½ · ¾). Solo escribe si la toma está en «menos»; no toca el estado ni la racha.
  const setFraccionMenos = (toma,f)=>{ if(!puedeRegistrar || regDia[selDateKey]?.meals?.[toma]!=='menos') return; persistDia(selDateKey,{real:{toma,detalle:{frac:f}}}); sfx&&sfx('tap'); };
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
      onTutoEvent&&onTutoEvent('plan_fallo');   // tour: sin servidor, el paso se salta
      return;
    }
    // ── Sin objetivo nutricional no se genera (el plan se ajusta a esas kcal) ──
    if(isStandard && !tieneObjetivo){
      showT&&showT({icon:"🎯",title:lang==='en'?'Set your goal first':'Define tu objetivo primero',
        sub:lang==='en'?'Go to the Goal tab to calculate your daily calories.':'Ve a la pestaña Objetivo para calcular tus calorías diarias.'});
      setTab&&setTab('objetivo');   // Objetivo es una vista de Progreso (6-oct-2026); setTab aquí es irA()
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
          // La identidad es la sesión (MAESTRO-2026-738): el servidor genera para el perfil de
          // X-GBH-Sesion e ignora el profile_id del cuerpo, que queda solo para servidores antiguos.
          headers:{'Content-Type':'application/json','X-GBH-Token':GBH_GEN_TOKEN,
                   ...(getSesion()?.token ? {'X-GBH-Sesion':getSesion().token} : {})},
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
        onTutoEvent&&onTutoEvent('plan_generado');   // tour: programación creada de verdad
        sfx&&sfx("recipe");
        showT&&showT({icon:"🎉",title:lang==='en'?'Plan ready!':'¡Programación lista!',sub:lang==='en'?'Your weekly plan is here':'Tu plan semanal ya está disponible'});
      }else{
        throw new Error(lang==='en'?'The server did not respond in time':'El servidor no respondió a tiempo');
      }
    }catch(e){
      // (sin coletilla de gemas: la regeneración ya no cobra gemas — el texto
      //  «gemas devueltas» era un resto de la era anterior y confundía)
      showT&&showT({icon:"⚠️",title:lang==='en'?'Could not generate':'No se pudo generar',
        sub:String(e.message||e).slice(0,90)});
      onTutoEvent&&onTutoEvent('plan_fallo');   // tour: el paso se salta, no se rompe
    }finally{
      setGenerando(false);
    }
  }
  React.useEffect(()=>{setView(null);setOpenToma(null);setTomaReceta(null);setTomaMenu(null);},[idx]);
  React.useEffect(()=>{setOpenToma(null);setTomaReceta(null);setTomaMenu(null);},[selDay]);
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
  // ── El plan se escribe por CELDAS (15-oct-2026, PEND-2026-387 · MAESTRO-2026-923) ──────────────
  // Cambiar una receta o un plato mandaba el plan_json ENTERO que la app tenía en memoria: si el
  // paciente había cambiado algo en otro dispositivo o pestaña, lo borraba (Aritz, 15-oct: su app
  // borró 4 cambios hechos en Safari). Ahora se escribe SOLO la celda (src/celdaPlan.js → función
  // cambiar_celda_plan de la base, atómica) y la app se queda con el plan que devuelve la base, que
  // trae también lo cambiado en el otro lado. Con un error HTTP, el PATCH de siempre; sin red, la
  // celda va a la cola. `escrituraPlan` impide que una respuesta o una relectura más vieja pise en
  // pantalla un cambio más nuevo. 07. App GBH/arnes_celda_plan.py lo prueba con este mismo texto.
  const escrituraPlan = React.useRef({ n: 0, enVuelo: 0 });
  const escribirCelda = (semana, toma, dia, celda, planEntero) => {
    const e = escrituraPlan.current; const n = ++e.n; e.enVuelo++;
    persistirCelda({ sbDirect, sbReq, enqueue, profileId: profile.id, semana, toma, dia, celda, planEntero })
      .then(res => {
        if(res.via === 'rpc' && res.plan && e.n === n)
          setPlanes(ps => ps.map(p => p.semana === semana ? { ...p, plan_json: res.plan } : p));
      })
      .catch(err => console.warn("[celda-plan] no se pudo persistir:", err))
      .finally(() => { e.enVuelo--; });
  };
  // Al volver a primer plano se relee el plan: lo cambiado en el otro dispositivo aparece sin cerrar
  // la app, y un PATCH de reserva sale de un plan fresco. Sin red (sbReq da null) o con una escritura
  // en marcha, se queda lo que hay: nunca se vacía la lista ni se mueve la semana que se mira.
  const releerPlan = () => {
    if(!profile?.id) return;
    const e = escrituraPlan.current;
    if(e.enVuelo > 0) return;
    const n = e.n;
    sbReq('GET', `weekly_plans?profile_id=eq.${profile.id}&select=semana,plan_json,fecha_gen,pdf_url&order=semana.desc&limit=12`)
      .then(wp => { if(Array.isArray(wp) && e.n === n && e.enVuelo === 0) setPlanes(ps => fusionarPlanes(ps, wp)); });
  };
  // fin de los ayudantes del plan por celdas
  React.useEffect(()=>{
    if(!profile?.id || !tieneAcceso) return;
    const alVolver = ()=>{ if(document.visibilityState === 'visible') releerPlan(); };
    document.addEventListener('visibilitychange', alVolver);
    return ()=>document.removeEventListener('visibilitychange', alVolver);
  // eslint-disable-next-line react-hooks/exhaustive-deps
  },[profile?.id, tieneAcceso]);
  const plan=planes[idx];const planJ=plan?.plan_json;
  // «Pregúntale a Bo» con IA: ir a una comida concreta (día y toma) y abrir Bo en su ficha con el
  // cambio ya preparado. Va aquí, detrás de planJ: el efecto lo lee en su lista de dependencias.
  const [boNav,setBoNav] = React.useState(null);               // {dia, toma, bo} | null
  const [boPendiente,setBoPendiente] = React.useState(null);   // {accion, ingrediente, tipo_receta} | null
  React.useEffect(()=>{
    if(!boNav || !planJ) return;
    if(view!=='daily'){ setView('daily'); return; }
    if(selDay!==boNav.dia){ setSelDay(boNav.dia); return; }
    const nav = boNav; setBoNav(null);
    (async()=>{ await abrirToma(nav.toma); setBoPendiente(nav.bo||null); setBoHoja(true); })();
  // eslint-disable-next-line react-hooks/exhaustive-deps
  },[boNav, planJ, view, selDay]);
  // ── Plan de la pareja, de LA MISMA SEMANA que se está mirando ──────────────
  // Tiene que ir aquí abajo (después de `plan`): arriba, junto al vínculo, la
  // semana todavía no se conoce. Antes se traía "el último plan" de la pareja
  // sin mirar la semana: si ella regeneraba y él no, o él navegaba a otra
  // semana con el WeekNav, se sumaban DOS SEMANAS DISTINTAS en silencio.
  // Si la pareja no tiene plan de esa semana, no hay fila y no se ofrece nada.
  React.useEffect(()=>{
    let vivo=true;
    if(!pareja?.id || plan?.semana==null){ setParejaPlanJ(null); return; }
    (async()=>{
      const pl=await sbReq('GET',`weekly_plans?profile_id=eq.${pareja.id}`
        +`&semana=eq.${encodeURIComponent(plan.semana)}&select=plan_json&limit=1`);
      if(!vivo) return;
      const pj=(Array.isArray(pl)&&pl[0]?.plan_json)||null;
      // Solo las tomas: dentro de plan_json también viajan `seguimiento`
      // (pesajes) y `suplementacion`, que no hacen falta para cocinar ni para
      // la compra. No se guardan en memoria ni en localStorage.
      if(!pj){ setParejaPlanJ(null); return; }
      const soloTomas={};
      for(const tm of PLAN_TOMAS) if(pj[tm]) soloTomas[tm]=pj[tm];
      setParejaPlanJ(Object.keys(soloTomas).length?soloTomas:null);
    })();
    return ()=>{vivo=false;};
  },[pareja?.id, plan?.semana]);
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
  // ── Modo "lista para los dos" (§6) ─────────────────────────────────────────
  // ⚠️ La instantánea Y los tachados van SCOPEADOS POR MODO. Si compartieran
  // clave, al alternar entre "solo la mía" y "para los dos" se pisarían los
  // tachados y aparecerían como comprados ingredientes que no lo están.
  const [listaDeDos,setListaDeDos]=React.useState(false);
  const puedeListaDeDos = !!(pareja && parejaPlanJ);
  const modoDos = listaDeDos && puedeListaDeDos;
  const sufijoModo = modoDos ? ":pareja" : "";
  const listaSnapKey=`gbh:listasnap5:${profile?.id}:${plan?.semana??"x"}${sufijoModo}`;
  const [listaSnap,setListaSnap]=React.useState(null);
  React.useEffect(()=>{
    if(!planJ){ setListaSnap(null); return; }
    const s=lsGet(listaSnapKey,null);
    if(Array.isArray(s)&&s.length){ setListaSnap(s); return; }
    const items=agregarListaCompra(planJ, modoDos?parejaPlanJ:null);
    if(items.length) lsSet(listaSnapKey,items);
    setListaSnap(items);
  // eslint-disable-next-line react-hooks/exhaustive-deps
  },[listaSnapKey, planJ?1:0, modoDos, parejaPlanJ?1:0]);
  const listaItems = listaSnap||[];
  // ── 💶 Gasto estimado de la compra (fijo con la instantánea) + gasto real ──
  // El gasto real que apunta el paciente es el feedback que calibra la base de
  // precios (tabla lista_compra_gasto; el nutricionista la cruza con el Excel).
  setPerfilActualId(profile?.id || null);   // para MiniListaCompra (gasto real)
  const gastoEst = React.useMemo(()=>costeListaItems(listaItems),[listaItems]);
  const gastoRealKey=`gbh:gastoreal:${profile?.id}:${plan?.semana??"x"}${sufijoModo}`;
  const [gastoReal,setGastoReal]=React.useState("");
  const [gastoOk,setGastoOk]=React.useState(false);
  React.useEffect(()=>{ setGastoReal(lsGet(gastoRealKey,"")); setGastoOk(false); },[gastoRealKey]);
  const guardarGastoReal=()=>{
    const v=parseFloat(String(gastoReal).replace(",","."));
    if(!(v>0)||!profile?.id) return;
    lsSet(gastoRealKey,String(gastoReal));
    sbReq('POST','lista_compra_gasto?on_conflict=profile_id,semana,modo',
      {profile_id:profile.id, semana:parseInt(plan?.semana)||0, modo:modoDos?'pareja':'solo',
       estimado_eur:gastoEst.total||null, real_eur:v, actualizado_en:new Date().toISOString()});
    setGastoOk(true); sfx&&sfx("missionDone");
    showT&&showT({icon:"💶",title:lang==='en'?'Saved!':'¡Guardado!',
      sub:lang==='en'?'Thanks — it helps us fine-tune the estimate':'Gracias — nos ayuda a afinar la estimación'});
  };
  // (El gasto real por RECETA vive en MiniListaCompra —la pestaña 🛒 Comprar—
  //  por orden de Alejandro: es donde el paciente tiene el ticket en la mano.)
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
  const listaLsKey=`gbh:listacompra3:${profile?.id}:${plan?.semana??"x"}${sufijoModo}`;
  const [listaChecks,setListaChecks]=React.useState({});
  const [listaConfirm,setListaConfirm]=React.useState(false);   // doble tap en Regenerar
  const [miniCompra,setMiniCompra]=React.useState(null);        // popup 🛒 por receta (vista diaria)
  React.useEffect(()=>{ setListaChecks(lsGet(listaLsKey,{})); setListaConfirm(false); },[listaLsKey]);
  // Clave COMPARTIDA de la lista de dos: el lunes de esta semana lo calculan
  // igual los dos dispositivos, así que los dos apuntan a la misma fila.
  const claveDos = (pareja&&profile?.id)
    ? [profile.id,pareja.id].sort().join("_")+":"+toKey(lunesSemana) : null;
  // Los tachados de la lista combinada viven en Supabase: si no, uno compra lo
  // que el otro ya ha comprado, que es justo la fricción que estamos quitando.
  // Sin realtime: se refresca al abrir la lista y al volver a la app.
  const traerChecksDos=React.useCallback(async()=>{
    if(!claveDos) return;
    const filas=await sbReq('GET',`couple_shopping?select=tachados&clave=eq.${encodeURIComponent(claveDos)}&limit=1`);
    const t=Array.isArray(filas)&&filas[0]?.tachados;
    if(t&&typeof t==='object'){ setListaChecks(t); lsSet(listaLsKey,t); }
  },[claveDos,listaLsKey]);
  React.useEffect(()=>{
    if(!modoDos||view!=='lista') return;
    traerChecksDos();
    const alVolver=()=>{ if(document.visibilityState==='visible') traerChecksDos(); };
    document.addEventListener('visibilitychange',alVolver);
    return ()=>document.removeEventListener('visibilitychange',alVolver);
  },[modoDos,view,traerChecksDos]);
  const guardarChecks=(n)=>{
    lsSet(listaLsKey,n);
    if(modoDos&&claveDos)
      sbReq('POST','couple_shopping?on_conflict=clave',
        {clave:claveDos, tachados:n, actualizado_en:new Date().toISOString()});
  };
  const toggleListaCheck=(k)=>{
    sfx&&sfx("tap");
    setListaChecks(c=>{ const n={...c}; if(n[k])delete n[k]; else n[k]=true; guardarChecks(n); return n; });
  };
  const regenerarLista=()=>{
    if(!listaConfirm){ setListaConfirm(true); return; }
    sfx&&sfx("missionDone");
    setListaChecks({}); guardarChecks({}); setListaConfirm(false);
    showT&&showT({icon:"🛒",title:lang==='en'?'List reset!':'¡Lista regenerada!',sub:lang==='en'?'Ready for a new shopping trip':'Lista limpia para volver a hacer la compra'});
  };
  // ── Distribución de macros del día: desde la fase 1 de «Kcal reales» la calcula
  //    src/kcalDia.js (misma definición Atwater 4/4/9) y la pinta <TuDia/> al final
  //    de Platos diarios, junto a las kcal reales frente a las previstas. ─
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
    const todas = await leerRecetarioCompleto();   // en bloques: con limit=1000, desde la receta 1.001 el cambio no la vería
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

  // Normaliza un plato del menú desglosado al formato de tomaReceta.
  // Los platos vienen del plan YA escalados a la ración del paciente (kcal,
  // macros e ingredientes), igual que las celdas normales de planes nuevos.
  const platoMenuAReceta = (pl)=>({
    nombre:       pl.Nombre_Receta||'',
    tipo:         pl.Tipo||'',
    calorias:     Math.round(parseFloat(pl.Calorias_Totales)||0),
    proteinas_g:  Math.round(parseFloat(pl.Proteinas_g)||0),
    hidratos_g:   Math.round(parseFloat(pl.Hidratos_g)||0),
    grasas_g:     Math.round(parseFloat(pl.Grasas_g)||0),
    ingredientes: pl.Ingredientes||'',
    instrucciones:pl.Instrucciones||(lang==='en'?'No preparation steps available.':'Sin pasos de preparación disponibles.'),
    racion_texto: pl.racion_texto||'',
    racion_factor:parseFloat(pl.racion_factor)||1,
    raciones:     parseInt(pl.raciones||1)||1,
    // Las kcal que le puso la programación: un plato ya cambiado las guarda en
    // kcal_objetivo, para que varios cambios seguidos no se vayan desviando.
    kcal_objetivo:Math.round(parseFloat(pl.kcal_objetivo)||parseFloat(pl.Calorias_Totales)||0),
    slug:null, publica:false,   // los platos del menú no tienen escaparate propio
  });

  async function abrirToma(toma){
    onTutoEvent&&onTutoEvent('receta_abierta');   // tour: receta del día abierta
    const meal=planJ?.[toma]?.[String(selDay)];
    if(!meal?.Nombre_Receta) return;
    setOpenToma(toma);setTomaReceta(null);setLoadingToma(true);
    setCocinarDos(false);setCocinarDeMas(1);   // cada plato se decide aparte

    // ── MENÚ DESGLOSADO: la celda trae los TOTALES (un único registro para
    // toda la toma) y `platos` con cada plato completo. Se muestran como
    // pestañas — cada plato con SUS ingredientes y SU preparación — y el
    // cumplimiento sigue siendo UNO para todo el menú (nada que cambiar en
    // el registro: meals[toma]=estado ya engloba la toma entera).
    if(meal.compuesta && Array.isArray(meal.platos) && meal.platos.length>=2){
      setTomaMenu({
        etiquetas:(Array.isArray(meal.etiquetas)&&meal.etiquetas.length>=2)?meal.etiquetas:['1º','2º'],
        platos:   meal.platos,
        kcalTotal:Math.round(parseFloat(meal.Calorias_Totales)||0),
      });
      setPlatoSel(0);
      setTomaReceta(platoMenuAReceta(meal.platos[0]));
      setLoadingToma(false);
      return;
    }
    setTomaMenu(null);

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
        racion_factor: fRac,
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
        racion_factor: fRac,
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
  // `opc.sinIngrediente` (desde «Pregúntale a Bo», «Me falta un ingrediente»): veta además las recetas
  // que lo lleven. Desde el botón 🔄 llega el evento del clic, que no lo trae. Devuelve
  // {ok, nombre} o {ok:false, motivo} para que Bo diga qué pasó; el botón lo ignora.
  async function cambiarRecetaToma(opc){
    const sinIng = (opc && typeof opc==='object' && typeof opc.sinIngrediente==='string' && opc.sinIngrediente.trim()) ? opc.sinIngrediente.trim() : null;
    const tipoR  = (opc && typeof opc==='object' && typeof opc.tipo==='string' && opc.tipo.trim()) ? opc.tipo.trim() : null;   // «algo de pescado» (Bo con IA)
    if(!tomaReceta||!profile) return {ok:false};
    const costeCambio = enTrial ? 0 : 10;   // gratis mientras dura la prueba
    if(costeCambio>0 && gems < costeCambio){
      sfx&&sfx("error");
      showT&&showT({icon:"💎",title:lang==='en'?'Not enough gems':'Sin gemas suficientes',sub:lang==='en'?'You need 10 💎 to change the recipe':'Necesitas 10 💎 para cambiar la receta'});
      return {ok:false, motivo:'gemas'};
    }
    // Menú de dos platos: se cambia SOLO el plato que se ve (12-oct-2026).
    if(tomaMenu) return await cambiarPlatoMenu({sinIng, tipoR, costeCambio});
    const mapa = await cargarRecetasCache();
    const recetas = Object.values(mapa);
    // ── Qué receta sale: src/cambioReceta.js (28-sep-2026) ────────────────────
    // DURO: la franja, la lista del servidor (plan_json.cambio_receta: dieta,
    // sin gluten, sin carne, desayuno realista, rechazados y alergias de su
    // pauta y «solo sencillas»), los rechazados de patient_config.notas (lo
    // que el paciente apunta en «Alimentos que no quieres»), las descartadas 🗑️
    // y que la ración quepa en 0,70-1,40. El tipo y los macros solo ordenan.
    // Antes las notas se leían de profile.notas, una columna que no existe: el
    // filtro de alergias no vetaba nada. Cada hueco recuerda lo ya enseñado.
    const tipoActual = tomaReceta.tipo;
    const kcalObjetivo = tomaReceta.kcal_objetivo || tomaReceta.calorias || 0;
    let almacen = null;
    try{ almacen = window.localStorage; }catch(e){ almacen = null; }
    const memClave = claveMemoriaCambio(profile.id, plan?.semana ?? '', openToma, selDay);
    const mem = leerMemoriaCambio(almacen, memClave, tomaReceta);
    const enPlan = new Set();   // lo que ya sale en la semana (fuera de este hueco): se deja para después
    for(const tm of PLAN_TOMAS){
      for(const [d,c] of Object.entries(planJ?.[tm]||{})){
        if(tm===openToma && String(d)===String(selDay)) continue;
        if(c?.Nombre_Receta) enPlan.add(normNombreCambio(c.Nombre_Receta));
        (Array.isArray(c?.platos)?c.platos:[]).forEach(pl=>{ if(pl?.Nombre_Receta) enPlan.add(normNombreCambio(pl.Nombre_Receta)); });
      }
    }
    const rechPref = interpretarRechazados(config?.notas);
    const res = elegirRecetaCambio({
      recetas, actual:tomaReceta, ancla:mem.ancla, toma:openToma,
      permitidas: permitidasDePlanes(planes, openToma),
      rechazada:  (r)=>recetaRechazadaJS(r, rechPref) || (!!sinIng && contieneIngrediente(r?.ingredientes||'', sinIng))
                       || (!!tipoR && String(r?.tipo||'')!==tipoR),
      descartadas:new Set((descartadas||[]).map(r=>normNombreCambio(r.nombre||''))),
      favoritas:  new Set((savedRecipes||[]).map(r=>normNombreCambio(r.nombre||r.nombre_receta||''))),
      vistas:mem.vistas, enPlan,
    });
    // Si no hay nada que ofrecer se avisa «Sin alternativa» y NO se cobran
    // gemas: mejor no cambiar que servir un despropósito o un alimento vetado.
    if(!res.receta){
      showT&&showT({icon:"🚫",title:lang==='en'?'No alternative':'Sin alternativa',sub:lang==='en'?'No similar recipe available':'No hay receta similar disponible'});
      return {ok:false, motivo:'sin_alternativa'};
    }
    const elegida = res.receta;
    guardarMemoriaCambio(almacen, memClave, {...mem, actual:tomaReceta, elegida, reinicio:res.reinicio});
    // Descontar gemas (0 durante la prueba: invita la casa)
    if(costeCambio>0){
      const newGems = gems - costeCambio;
      const updP = {...profile, gems:newGems};
      setProfile(updP); lsSet(`gbh:p:${profile.id}`, updP);
      sbReq("PATCH",`profiles?id=eq.${profile.id}`,{gems:newGems});
    }
    sfx&&sfx("recipe");
    // ── La ración: el factor de elegirRecetaCambio (0,70-1,40 en pasos de
    //    0,05, el rango RACION_MIN/MAX del generador). ──
    const kcalObj = kcalObjetivo;
    const kcalBase = parseFloat(elegida.calorias||elegida.calorias_totales)||0;
    const f = res.factor;
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
    //    se pierde al cerrar la app (solo vivía en el estado de React). Se
    //    escribe SOLO esta celda (escribirCelda, 15-oct-2026) ──
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
        escribirCelda(plan.semana, openToma, selDay, nuevoJson[openToma][String(selDay)], nuevoJson);
      }catch(e){ console.warn("[cambiar-receta] no se pudo persistir:", e); }
    }
    return {ok:true, nombre: elegida.nombre||elegida.nombre_receta||''};
  }

  // ── Menú de 1º y 2º (o plato y postre): cambiar UN plato, el que se ve ─────
  // Hasta el 12-oct el botón no salía en los menús, porque cambiar un plato
  // descuadraba los totales guardados de la celda (Aritz, su primera semana con
  // dos platos). Ahora cada plato se cambia por separado, con el rol con que lo
  // eligió la programación (elegirPlatoMenu: el 1º, entre lo que vale de entrante;
  // el 2º, nunca un entrante y mejor proteico), con su memoria de lo ya enseñado,
  // y la celda se recompone (recomponerMenu) para que kcal y macros de la toma,
  // «Tu día» y el registro sigan cuadrando. Mismo cobro y misma escritura que
  // el cambio de una receta.
  async function cambiarPlatoMenu({sinIng, tipoR, costeCambio}){
    const i = platoSel;
    const celda = planJ?.[openToma]?.[String(selDay)];
    const platos = Array.isArray(celda?.platos) ? celda.platos : [];
    if(!plan || !celda?.compuesta || platos.length<2 || !platos[i]) return {ok:false};
    const mapa = await cargarRecetasCache();
    const recetas = Object.values(mapa);
    const etiqueta = (Array.isArray(celda.etiquetas)&&celda.etiquetas[i]) || (i===0?'1º':'2º');
    const rol = rolPlatoMenu(celda.etiquetas, i);
    const actual = platoMenuAReceta(platos[i]);     // kcal_objetivo: las del plato en la programación
    let almacen = null;
    try{ almacen = window.localStorage; }catch(e){ almacen = null; }
    const memClave = claveMemoriaCambio(profile.id, plan?.semana ?? '', `${openToma}:${i+1}`, selDay);
    const mem = leerMemoriaCambio(almacen, memClave, actual);
    const enPlan = new Set();   // lo que ya sale en la semana (fuera de este menú): se deja para después
    for(const tm of PLAN_TOMAS){
      for(const [d,c] of Object.entries(planJ?.[tm]||{})){
        if(tm===openToma && String(d)===String(selDay)) continue;
        if(c?.Nombre_Receta) enPlan.add(normNombreCambio(c.Nombre_Receta));
        (Array.isArray(c?.platos)?c.platos:[]).forEach(pl=>{ if(pl?.Nombre_Receta) enPlan.add(normNombreCambio(pl.Nombre_Receta)); });
      }
    }
    const rechPref = interpretarRechazados(config?.notas);
    const listas = listasPlatoMenu(planes, rol);
    const res = elegirPlatoMenu({
      rol, recetas, actual, ancla:mem.ancla,
      permitidas: listas.permitidas, entrantes: listas.entrantes,
      otro:       platos[1-i]?.Nombre_Receta || '',
      rechazada:  (r)=>recetaRechazadaJS(r, rechPref) || (!!sinIng && contieneIngrediente(r?.ingredientes||'', sinIng))
                       || (!!tipoR && String(r?.tipo||'')!==tipoR),
      descartadas:new Set((descartadas||[]).map(r=>normNombreCambio(r.nombre||''))),
      favoritas:  new Set((savedRecipes||[]).map(r=>normNombreCambio(r.nombre||r.nombre_receta||''))),
      vistas:mem.vistas, enPlan,
    });
    // Sin nada que ofrecer: se avisa y NO se cobran gemas (como en una receta).
    if(!res.receta){
      showT&&showT({icon:"🚫",title:lang==='en'?'No alternative':'Sin alternativa',sub:lang==='en'?'No similar dish available':'No hay plato similar disponible'});
      return {ok:false, motivo:'sin_alternativa'};
    }
    const elegida = res.receta;
    guardarMemoriaCambio(almacen, memClave, {...mem, actual, elegida, reinicio:res.reinicio});
    if(costeCambio>0){
      const newGems = gems - costeCambio;
      const updP = {...profile, gems:newGems};
      setProfile(updP); lsSet(`gbh:p:${profile.id}`, updP);
      sbReq("PATCH",`profiles?id=eq.${profile.id}`,{gems:newGems});
    }
    sfx&&sfx("recipe");
    // El plato nuevo, con la forma de los platos del servidor (_celda_json) y su
    // ración (0,70-1,40 en pasos de 0,05) contra las kcal del plato de la programación.
    const f = res.factor;
    const kcalBase = parseFloat(elegida.calorias||elegida.calorias_totales)||0;
    const decima = (x)=>Math.round(x*10)/10;
    const nuevo = {
      Nombre_Receta:    elegida.nombre||elegida.nombre_receta||'',
      Tipo:             elegida.tipo||platos[i].Tipo||'',
      Ingredientes:     escalarIngredientesJS(elegida.ingredientes||'', f),
      Instrucciones:    elegida.instrucciones||'',
      Calorias_Totales: Math.round(kcalBase*f),
      Proteinas_g:      decima((parseFloat(elegida.proteinas_g)||0)*f),
      Hidratos_g:       decima((parseFloat(elegida.hidratos_g)||0)*f),
      Grasas_g:         decima((parseFloat(elegida.grasas_g)||0)*f),
      raciones:         parseInt(elegida.raciones||1)||1,
      ...(f!==1?{racion_factor:f, racion_texto:racionTextoJS(f,lang), calorias_base:Math.round(kcalBase)}:{}),
      kcal_objetivo:    actual.kcal_objetivo,
    };
    const celdaNueva = recomponerMenu(celda, i, nuevo);
    setTomaMenu(m=>m?{...m, platos:celdaNueva.platos, kcalTotal:Math.round(parseFloat(celdaNueva.Calorias_Totales)||0)}:m);
    setTomaReceta(platoMenuAReceta(nuevo));
    setCocinarDos(false); setCocinarDeMas(1);
    showT&&showT({icon:"🍽️",title:lang==='en'?'New dish!':'¡Nuevo plato!',
      sub:`${menuEtiqueta(etiqueta,lang)} · ${costeCambio>0?'-10 💎':(lang==='en'?'free':'gratis')}`});
    // Persistir en weekly_plans, como el cambio de una receta: sin esto se
    // pierde al cerrar la app. Solo esta celda (escribirCelda).
    try{
      const nuevoJson = JSON.parse(JSON.stringify(planJ||{}));
      if(!nuevoJson[openToma]) nuevoJson[openToma]={};
      nuevoJson[openToma][String(selDay)] = celdaNueva;
      setPlanes(ps=>ps.map((p,k)=>k===idx?{...p,plan_json:nuevoJson}:p));
      escribirCelda(plan.semana, openToma, selDay, celdaNueva, nuevoJson);
    }catch(e){ console.warn("[cambiar-plato] no se pudo persistir:", e); }
    return {ok:true, nombre: nuevo.Nombre_Receta};
  }

  // ── Guardar la receta en el recetario personal (20 💎) ─────────────────────
  const recetaYaGuardada = tomaReceta && (savedRecipes||[]).some(r=>normNombre(r.nombre)===normNombre(tomaReceta?.nombre));
  // ── Descartar la receta (🗑️, GRATIS): repositorio oculto ──────────────────
  // Marca "no me gusta". Toggle: si ya está descartada, volver a pulsar la
  // restaura (por si fue un toque accidental — el repositorio es invisible y
  // no hay otra forma de deshacerlo). Regla de conflicto con favoritas: una
  // receta GUARDADA (pagada con 20 💎) no se puede descartar directamente;
  // primero hay que quitarla de guardadas — así nunca se borra en silencio
  // algo que costó gemas.
  const recetaDescartada = tomaReceta && (descartadas||[]).some(r=>normNombre(r.nombre)===normNombre(tomaReceta?.nombre));
  async function descartarRecetaToma(){
    if(!tomaReceta||!profile) return;
    const nom = tomaReceta.nombre||'';
    if(recetaDescartada){
      // Restaurar: quitar del repositorio oculto
      const resto = (descartadas||[]).filter(r=>normNombre(r.nombre)!==normNombre(nom));
      setDescartadas(resto); lsSet(`gbh:discarded:${profile.id}`,resto);
      const quitados = (descartadas||[]).filter(r=>normNombre(r.nombre)===normNombre(nom));
      quitados.forEach(q=>sbReq("DELETE",`discarded_recipes?profile_id=eq.${profile.id}&recipe_id=eq.${encodeURIComponent(q.recipe_id)}`));
      sfx&&sfx("step");
      showT&&showT({icon:"↩️",title:lang==='en'?'Restored':'Restaurada',sub:lang==='en'?'It can appear in your plans again':'Podrá volver a aparecer en tus planes'});
      return;
    }
    if(recetaYaGuardada){
      sfx&&sfx("error");
      showT&&showT({icon:"📖",title:lang==='en'?'Saved recipe':'Está en tus guardadas',sub:lang==='en'?'Remove it from your recipe book first':'Quítala antes de tu recetario guardado'});
      return;
    }
    const entry = {
      profile_id: profile.id,
      recipe_id:  tomaReceta.id_receta || ('plan_'+normNombre(nom).replace(/\s+/g,'_')),
      nombre:     nom,
      discarded_at: new Date().toISOString(),
    };
    const nuevos = [entry, ...(descartadas||[])];
    setDescartadas(nuevos); lsSet(`gbh:discarded:${profile.id}`,nuevos);
    sbReq("POST","discarded_recipes",entry);
    sfx&&sfx("step");
    showT&&showT({icon:"🗑️",title:lang==='en'?'Noted!':'¡Anotada!',sub:lang==='en'?'It won\'t appear in your future plans':'No volverá a aparecer en tus próximos planes'});
  }
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
        {ES_IOS_NATIVO
          ? (lang==='en'
            ?'Your weekly meal plan is prepared by your nutritionist as part of GBH Nutrición’s one-to-one nutrition service.'
            :'Tu programación semanal la prepara tu nutricionista dentro del servicio de nutrición 1:1 de GBH Nutrición.')
          : (lang==='en'
          ?'The weekly plan is exclusive to Standard and Premium accounts. Upgrade and get your personalized meal plan, recipes and shopping list.'
          :'La planificación es exclusiva de las cuentas Estándar y Premium. Mejora tu plan y tendrás tu programación personalizada con recetas y lista de la compra.')}
      </div>

      {/* Tarifas: Estándar → pago directo Stripe · Premium → WhatsApp.
          En las apps nativas se ocultan ambas (App Store 3.1.1; Pagos de Google Play,
          PEND-2026-316) y se muestra un texto neutro de estado de cuenta; en Android,
          además, dónde se contrata, sin enlace. */}
      {!ES_NATIVO?<>
      <div style={{display:'flex',flexDirection:'column',gap:10,width:'100%',maxWidth:330,marginTop:4}}>
        <button onClick={()=>{sfx&&sfx("tap");abrirCheckoutStripe(profile?.id);}}
          style={{background:alpha(T.g1,0.08),border:'2px solid '+T.bG,borderRadius:18,padding:'14px 16px',textAlign:'left',display:'flex',alignItems:'center',gap:12,cursor:'pointer',width:'100%',boxShadow:'0 3px 0 rgba(0,0,0,0.25)'}}>
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
          style={{background:alpha(T.au1,0.07),border:`2px solid ${alpha(T.au1,0.35)}`,borderRadius:18,padding:'14px 16px',textAlign:'left',display:'flex',alignItems:'center',gap:12,cursor:'pointer',textDecoration:'none',boxShadow:'0 3px 0 rgba(0,0,0,0.25)'}}>
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
      </>:(
      ES_ANDROID_NATIVO ? (
      <div style={{fontSize:12.5,color:T.t2,lineHeight:1.6,maxWidth:300,fontFamily:"'DM Sans',sans-serif",marginTop:6}}>
        {lang==='en'
          ?'The weekly plan is not available on your current account.'
          :'La programación semanal no está disponible en tu cuenta actual.'}
        <br/>{txtWebAndroid(lang,"estandar")}
      </div>
      ) : null)}
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
        <button onClick={()=>setTab&&setTab('objetivo')}
          style={{background:'linear-gradient(135deg,'+T.g1+','+T.g2+')',color:T.t1,fontWeight:900,fontSize:16,
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
        {/* 💊 Suplementación (6-oct-2026, PEND-2026-353): la puerta pasa de pestaña propia a tarjeta de Plan; la pantalla es la misma */}
        <button onClick={()=>{ sfx&&sfx("tap"); onSupl&&onSupl(); }} style={{background:'rgba(255,75,110,0.10)',border:'2px solid rgba(255,75,110,0.30)',borderRadius:20,padding:'20px 20px',textAlign:'left',cursor:'pointer',display:'flex',alignItems:'center',gap:16,boxShadow:'0 4px 0 rgba(0,0,0,0.3)',fontFamily:'inherit'}}>
          <div style={{fontSize:40,flexShrink:0}}>💊</div>
          <div style={{flex:1}}><div style={{fontWeight:900,fontSize:16,color:T.t1,marginBottom:4,fontFamily:"'Nunito',sans-serif"}}>{t("suplTitulo")}</div><div style={{fontSize:12,color:T.t2,fontFamily:"'DM Sans',sans-serif",lineHeight:1.5}}>{t("suplIntro")}</div></div>
          <div style={{color:'#FF4B6E',fontSize:20,flexShrink:0}}>›</div>
        </button>
        {/* Botón GENERAR (solo estándar que ya configuró su plan).
            ABRE «Configura tu plan», no genera directamente: el selector de
            modalidades (Simple, Vegetariana, Vegana, Sin gluten, Cetogénica,
            Descarga) tiene que verse ANTES de cada generación, porque el
            momento de hacerse la semana es justo cuando se decide si se cambia
            de programación (Alejandro, 7-sep-2026). El plan se lanza desde el
            «Guardar y generar plan» de esa pantalla.
            Es la MISMA regla que ya seguía el banner semanal desde el 6-sep
            (BannerSemanaNueva, `onGenerar={()=>setConfigView(true)}`): este
            botón era el único camino que se la saltaba, y se notaba justo
            cuando el paciente se queda sin plan —cuenta nueva o programación
            reseteada—, que es cuando más falta hace poder elegir. */}
        {isStandard&&configCompleta&&(
          <button onClick={()=>setConfigView(true)} disabled={generando}
            style={{background:generando?'rgba(255,255,255,0.08)':'linear-gradient(135deg,'+T.g1+','+T.g2+')',
                    color:generando?T.t3:T.t1,fontWeight:900,fontSize:16,borderRadius:20,
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
          ? <span style={{fontSize:9.5,fontWeight:900,color:T.g1,background:alpha(T.g1,0.15),border:'1px solid '+T.bG,borderRadius:20,padding:'2px 9px',textTransform:'uppercase',letterSpacing:'0.03em',whiteSpace:'nowrap'}}>● {lang==='en'?'Current week':'Semana actual'}</span>
          : <button onClick={()=>setIdx(idxActual)} style={{fontSize:9.5,fontWeight:800,color:T.au1,background:alpha(T.au1,0.12),border:`1px solid ${alpha(T.au1,0.3)}`,borderRadius:20,padding:'2px 9px',cursor:'pointer',whiteSpace:'nowrap',fontFamily:"'Nunito',sans-serif"}}>{lang==='en'?'Go to current →':'Ir a la actual →'}</button>}
      </div>
      {mediaKcalSem!==null&&(
        <div style={{display:'inline-flex',alignItems:'center',gap:6,marginTop:6,background:alpha(T.g1,0.12),border:'1px solid '+T.bG,borderRadius:20,padding:'3px 11px'}}>
          <span style={{fontSize:12,lineHeight:1}}>🔥</span>
          <span style={{fontSize:12,color:T.t2,fontFamily:"'DM Sans',sans-serif"}}>{lang==='en'?'Daily average':'Media diaria'}: <b style={{color:T.g1}}>{mediaKcalSem}</b> kcal</span>
        </div>
      )}
      {fechaStr&&<div style={{fontSize:11,color:T.t2,fontFamily:"'DM Sans',sans-serif",marginTop:3}}>{lang==='en'?'Generated':'Generado'} {fechaStr}</div>}
    </div>
    <button onClick={()=>setIdx(i=>Math.max(i-1,0))} disabled={idx<=0} style={{background:'none',border:idx<=0?'1.5px solid rgba(255,255,255,0.1)':'1.5px solid '+T.bG,borderRadius:10,color:idx<=0?T.t3:T.g1,fontSize:18,width:36,height:36,cursor:idx<=0?'default':'pointer',flexShrink:0}}>›</button>
  </div></>);
  const BtnVolver=({onClick})=>(<button onClick={onClick} style={{background:'none',border:'none',color:T.g1,fontSize:13,fontWeight:700,cursor:'pointer',padding:'0 16px 10px',fontFamily:"'Nunito',sans-serif",display:'flex',alignItems:'center',gap:4}}>← {lang==='en'?'Back':'Volver'}</button>);
  const DotsNav=()=>planes.length>1?(<div style={{display:'flex',justifyContent:'center',gap:6,padding:'8px 0 4px'}}>{planes.map((_,i)=>(<div role="button" tabIndex={0} key={i} onClick={()=>setIdx(i)} style={{width:i===idx?20:7,height:7,borderRadius:4,background:i===idx?T.g1:'rgba(255,255,255,0.15)',cursor:'pointer',transition:'all 0.3s'}}/>))}</div>):null;
  // Chip de semana de prueba (solo cuentas estándar con trial activo)
  const trialMs = profile?.trial_ends_at ? Date.parse(profile.trial_ends_at) - Date.now() : null;
  const trialDias = (isStandard && trialMs!==null && trialMs>0) ? Math.max(1, Math.ceil(trialMs/(24*60*60*1000))) : null;
  const TrialChip=()=>trialDias?(
    <div style={{margin:'10px 16px 0',display:'flex',alignItems:'center',gap:10,
      background:alpha(T.au1,0.10),border:`1.5px solid ${alpha(T.au1,0.45)}`,
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
      {/* Aviso arriba del todo (PlanArcade.jsx): estándar con el candado semanal abierto.
          Antes el botón de generar estaba al final de la pestaña y había que bajar
          hasta él para saber que ya tocaba semana nueva (Alejandro, 6-sep-2026). */}
      {isStandard&&!planBloqueado&&(
        <BannerSemanaNueva lang={lang} T={T} tienePlan={tienePlan} sfx={sfx} onGenerar={()=>setConfigView(true)} />
      )}
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
          <div style={{margin:'4px 16px 0',background:alpha(T.au1,0.10),border:`2px solid ${alpha(T.au1,0.30)}`,borderRadius:18,padding:'14px 16px',boxShadow:'0 4px 0 rgba(0,0,0,0.3)'}}>
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
        <button onClick={()=>{if(plan.pdf_url){window.open(plan.pdf_url,'_blank','noopener');}else{setView('pdf');}}} style={{background:alpha(T.au1,0.10),border:`2px solid ${alpha(T.au1,0.3)}`,borderRadius:20,padding:'20px 20px',textAlign:'left',cursor:'pointer',display:'flex',alignItems:'center',gap:16,boxShadow:'0 4px 0 rgba(0,0,0,0.3)'}}>
          <div style={{fontSize:40,flexShrink:0}}>📅</div>
          <div style={{flex:1}}><div style={{fontWeight:900,fontSize:16,color:T.t1,marginBottom:4,fontFamily:"'Nunito',sans-serif"}}>{lang==='en'?'Plan & Recipes':'Plan y recetas'}</div><div style={{fontSize:12,color:T.t2,fontFamily:"'DM Sans',sans-serif",lineHeight:1.5}}>{lang==='en'?'Your week at a glance, recipes and progress (PDF)':'Tu semana de un vistazo, recetas y tu progreso (PDF)'}</div></div>
          <div style={{color:T.au1,fontSize:20,flexShrink:0}}>›</div>
        </button>
        <button onClick={()=>setView('daily')} style={{background:'rgba(100,181,246,0.12)',border:'2px solid rgba(100,181,246,0.3)',borderRadius:20,padding:'20px 20px',textAlign:'left',cursor:'pointer',display:'flex',alignItems:'center',gap:16,boxShadow:'0 4px 0 rgba(0,0,0,0.3)'}}>
          <div style={{fontSize:40,flexShrink:0}}>🍽️</div>
          <div style={{flex:1}}><div style={{fontWeight:900,fontSize:16,color:T.t1,marginBottom:4,fontFamily:"'Nunito',sans-serif"}}>{lang==='en'?'Daily Meals':'Platos diarios'}</div><div style={{fontSize:12,color:T.t2,fontFamily:"'DM Sans',sans-serif",lineHeight:1.5}}>{lang==='en'?'Your meals for today with full recipe details':'Tus platos de hoy con receta e ingredientes'}</div></div>
          <div style={{color:T.platos,fontSize:20,flexShrink:0}}>›</div>
        </button>
        <button onClick={()=>setView('lista')} style={{background:'rgba(255,140,60,0.10)',border:'2px solid rgba(255,140,60,0.32)',borderRadius:20,padding:'20px 20px',textAlign:'left',cursor:'pointer',display:'flex',alignItems:'center',gap:16,boxShadow:'0 4px 0 rgba(0,0,0,0.3)'}}>
          <div style={{fontSize:40,flexShrink:0}}>🛒</div>
          <div style={{flex:1}}><div style={{fontWeight:900,fontSize:16,color:T.t1,marginBottom:4,fontFamily:"'Nunito',sans-serif"}}>{lang==='en'?'Shopping List':'Lista de la compra'}</div><div style={{fontSize:12,color:T.t2,fontFamily:"'DM Sans',sans-serif",lineHeight:1.5}}>{lang==='en'?'Tick off ingredients as you shop':'Marca los ingredientes mientras compras'}</div></div>
          <div style={{color:T.compra,fontSize:20,flexShrink:0}}>›</div>
        </button>
        <button onClick={()=>setView('seguimiento')} style={{background:alpha(T.pur,0.12),border:`2px solid ${alpha(T.pur,0.3)}`,borderRadius:20,padding:'20px 20px',textAlign:'left',cursor:'pointer',display:'flex',alignItems:'center',gap:16,boxShadow:'0 4px 0 rgba(0,0,0,0.3)'}}>
          <div style={{fontSize:40,flexShrink:0}}>📊</div>
          <div style={{flex:1}}><div style={{fontWeight:900,fontSize:16,color:T.t1,marginBottom:4,fontFamily:"'Nunito',sans-serif"}}>{lang==='en'?'Tracking':'Seguimiento'}</div><div style={{fontSize:12,color:T.t2,fontFamily:"'DM Sans',sans-serif",lineHeight:1.5}}>{lang==='en'?'Calendar and charts of your meal compliance':'Calendario y gráficas de tu cumplimiento'}</div></div>
          <div style={{color:T.pur,fontSize:20,flexShrink:0}}>›</div>
        </button>
        {/* 💊 Suplementación (6-oct-2026, PEND-2026-353): la puerta pasa de pestaña propia a tarjeta de Plan; la pantalla es la misma */}
        <button onClick={()=>{ sfx&&sfx("tap"); onSupl&&onSupl(); }} style={{background:'rgba(255,75,110,0.10)',border:'2px solid rgba(255,75,110,0.30)',borderRadius:20,padding:'20px 20px',textAlign:'left',cursor:'pointer',display:'flex',alignItems:'center',gap:16,boxShadow:'0 4px 0 rgba(0,0,0,0.3)',fontFamily:'inherit'}}>
          <div style={{fontSize:40,flexShrink:0}}>💊</div>
          <div style={{flex:1}}><div style={{fontWeight:900,fontSize:16,color:T.t1,marginBottom:4,fontFamily:"'Nunito',sans-serif"}}>{t("suplTitulo")}</div><div style={{fontSize:12,color:T.t2,fontFamily:"'DM Sans',sans-serif",lineHeight:1.5}}>{t("suplIntro")}</div></div>
          <div style={{color:'#FF4B6E',fontSize:20,flexShrink:0}}>›</div>
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
        {/* El botón «Generar nueva semana» de aquí subió a la cabecera de la pestaña (BannerSemanaNueva). */}
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
          {/* §6 · Lista para los dos. Solo si hay pareja vinculada Y su plan. */}
          {puedeListaDeDos&&(
            <div style={{display:'flex',gap:6,marginBottom:10,background:'rgba(255,255,255,0.05)',
              border:'1.5px solid rgba(255,255,255,0.12)',borderRadius:13,padding:4}}>
              {[false,true].map(m=>(
                <button key={String(m)} onClick={()=>{sfx&&sfx('tap');setListaDeDos(m);setListaConfirm(false);}}
                  style={{flex:1,padding:'8px 6px',borderRadius:10,cursor:'pointer',
                    background:listaDeDos===m?alpha(T.g1,0.18):'transparent',
                    border:`1.5px solid ${listaDeDos===m?'${alpha(T.g1,0.5)}':'transparent'}`,
                    color:listaDeDos===m?T.g2:T.t2,fontSize:12.5,fontWeight:900,
                    fontFamily:"'Nunito',sans-serif"}}>
                  {m?t("listaDeDos",{n:pareja?.nombre||''}):t("listaSoloMia")}
                </button>
              ))}
            </div>
          )}
          <div style={{fontSize:12,color:T.t2,fontFamily:"'DM Sans',sans-serif",marginBottom:10}}>
            <b style={{color:marcados===listaItems.length?T.g2:T.t1}}>{marcados}/{listaItems.length}</b> {lang==='en'?'items in the cart':'ingredientes en el carro'} · {lang==='en'?'week':'semana'} {plan?.semana}
          </div>
          {modoDos&&(
            <div style={{fontSize:11,color:T.t2,fontFamily:"'DM Sans',sans-serif",lineHeight:1.5,
              marginBottom:12,background:alpha(T.g1,0.08),border:`1px solid ${alpha(T.g1,0.25)}`,
              borderRadius:11,padding:'8px 11px'}}>
              🛒 {t("listaDeDosNota",{n:pareja?.nombre||''})}
            </div>
          )}
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
                  background:on?alpha(T.g1,0.08):'rgba(255,255,255,0.05)',
                  border:`1.5px solid ${on?'${alpha(T.g1,0.35)}':'rgba(255,255,255,0.12)'}`,
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
          {/* 💶 Gasto estimado + gasto real: el feedback del paciente calibra la estimación */}
          {gastoEst.total>0&&(
            <div style={{marginTop:14,background:alpha(T.g1,0.08),border:`1.5px solid ${alpha(T.g1,0.3)}`,borderRadius:16,padding:'12px 14px'}}>
              <div style={{display:'flex',alignItems:'center',justifyContent:'space-between',gap:10}}>
                <div style={{fontSize:13,fontWeight:900,color:T.t1,fontFamily:"'Nunito',sans-serif"}}>
                  💶 {lang==='en'?'Estimated cost of this list':'Gasto estimado de esta compra'}
                </div>
                <div style={{fontSize:17,fontWeight:900,color:T.g2,fontFamily:"'Nunito',sans-serif",flexShrink:0}}>{eurES(gastoEst.total)} €</div>
              </div>
              <div style={{display:'flex',alignItems:'center',gap:8,marginTop:10}}>
                <div style={{flex:1,fontSize:12,color:T.t2,fontFamily:"'DM Sans',sans-serif",lineHeight:1.4}}>
                  ✏️ {lang==='en'?'What did you actually spend?':'¿Cuánto has gastado de verdad?'}
                </div>
                <input value={gastoReal} onChange={e=>{setGastoReal(e.target.value);setGastoOk(false);}}
                  inputMode="decimal" placeholder="0,00"
                  style={{width:70,padding:'8px 10px',borderRadius:10,border:'1.5px solid rgba(255,255,255,0.2)',
                    background:'rgba(255,255,255,0.06)',color:T.t1,fontSize:14,fontWeight:900,textAlign:'right',
                    fontFamily:"'Nunito',sans-serif",outline:'none'}}/>
                <span style={{fontSize:13,color:T.t2}}>€</span>
                <button onClick={guardarGastoReal} disabled={gastoOk} style={{padding:'8px 12px',borderRadius:10,cursor:'pointer',
                  background:gastoOk?alpha(T.g1,0.15):T.g1,border:'none',color:gastoOk?T.g2:'#0d2b12',
                  fontWeight:900,fontSize:12.5,fontFamily:"'Nunito',sans-serif"}}>
                  {gastoOk?'✓':(lang==='en'?'Save':'Guardar')}
                </button>
              </div>
              <div style={{fontSize:10.5,color:T.t3,fontFamily:"'DM Sans',sans-serif",marginTop:8,lineHeight:1.5}}>
                {lang==='en'
                  ?'Average Spanish supermarket prices, plus a small margin for whole-package formats. Logging your real spend helps us fine-tune it each week.'
                  :'Precios medios de supermercado en España, con un pequeño margen por los formatos de compra (paquetes enteros). Apuntar tu gasto real nos ayuda a afinar la estimación cada semana.'}
              </div>
            </div>
          )}
          {/* Regenerar: desmarca todo para repetir la semana (doble toque de confirmación) */}
          <button onClick={regenerarLista} style={{
            width:'100%',marginTop:16,padding:'14px 20px',borderRadius:16,cursor:'pointer',
            background:listaConfirm?'rgba(255,140,60,0.18)':'rgba(255,255,255,0.06)',
            border:`2px solid ${listaConfirm?'${T.compra}':'rgba(255,255,255,0.15)'}`,
            color:listaConfirm?T.compra:T.t2,fontWeight:900,fontSize:14,fontFamily:"'Nunito',sans-serif",
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
    // ── Cocinar para los dos (§5.2) ──────────────────────────────────────────
    // El interruptor SOLO aparece si la pareja tiene LA MISMA receta en LA MISMA
    // toma del MISMO día. Si no, no se enseña: no se inventa una suma.
    const parejaMeal = (pareja&&parejaPlanJ&&openToma)
      ? parejaPlanJ[openToma]?.[String(selDay)] : null;
    const mismaReceta = !!(parejaMeal?.Nombre_Receta && tomaReceta?.nombre &&
      normNombre(parejaMeal.Nombre_Receta)===normNombre(tomaReceta.nombre) &&
      parejaMeal.Ingredientes);
    const fTuyo   = parseFloat(tomaReceta?.racion_factor)||1;
    const fPareja = parseFloat(parejaMeal?.racion_factor)||1;
    const repartoTuyo = Math.round(fTuyo/(fTuyo+fPareja)*100);
    // Sin useMemo a propósito: estamos dentro de `if(view==='daily')`, así que un
    // hook aquí sería condicional y React rompería al cambiar de vista. Fusionar
    // una receta es una operación de microsegundos.
    const fusion = (mismaReceta&&cocinarDos)
      ? fusionarIngredientesJS(tomaReceta?.ingredientes||'', parejaMeal?.Ingredientes||'')
      : null;
    // Texto que se PINTA: la olla (dos raciones), la ración x2/x3, o la tuya.
    const ingTexto = fusion ? fusion.texto
      : (cocinarDeMas>1 ? escalarIngredientesJS(tomaReceta?.ingredientes||'', cocinarDeMas)
                        : (tomaReceta?.ingredientes||''));
    const ingList=ingTexto?.split(/[,;](?![^(]*\))/).map(s=>s.trim()).filter(Boolean)||[];
    // Para cuántas raciones es la lista que se PINTA y qué hacer con ella: una sola
    // cuenta para el rótulo, la chapa «Rinde», los botones y la hoja de Comprar.
    const racReceta   = Math.max(1, parseInt(tomaReceta?.raciones)||1);
    const racLista    = racionesDeLaLista(racReceta, cocinarDeMas);
    const etiquetaLista = fusion
      ? (racReceta>1 ? t("cocinarDosCantidadesRinde",{k:racReceta,n:pareja?.nombre||''})
                     : t("cocinarDosCantidades",{n:pareja?.nombre||''}))
      : racionEtiqueta(t,{raciones:racReceta,x:cocinarDeMas});
    return(<div style={{paddingBottom:16}}>
      {miniCompra&&<MiniListaCompra nombre={miniCompra.nombre} ingredientes={miniCompra.ingredientes}
        idReceta={miniCompra.id} t={t} lang={lang} onClose={()=>setMiniCompra(null)}
        etiquetaRacion={miniCompra.etiquetaRacion}/>}
      <WeekNav/>
      <BtnVolver onClick={()=>{if(openToma){setOpenToma(null);setTomaReceta(null);setTomaMenu(null);}else setView(null);}}/>
      {!openToma&&(<>
        <div style={{overflowX:'auto',WebkitOverflowScrolling:'touch',padding:'0 16px 16px'}}>
          <div style={{display:'flex',gap:8,minWidth:'min-content'}}>
            {PLAN_DIAS.map((d,i)=>{
              const dayNum=i+1;const isToday=dayNum===todayPlan;const isSel=dayNum===selDay;
              return(<button key={d} onClick={()=>setSelDay(dayNum)} style={{flexShrink:0,padding:'10px 14px',borderRadius:14,border:'none',cursor:'pointer',background:isSel?'linear-gradient(135deg,'+T.g1+','+T.g2+')':isToday?alpha(T.g1,0.15):'rgba(255,255,255,0.06)',color:isSel?T.t1:isToday?T.g1:T.t2,fontWeight:isSel||isToday?900:600,fontSize:12,fontFamily:"'Nunito',sans-serif",boxShadow:isSel?'0 3px 0 '+T.g3:isToday?'0 0 0 1.5px '+T.bG:'none',transition:'all 0.2s',display:'flex',flexDirection:'column',alignItems:'center',gap:2}}>
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
                  {(hasMeal&&meal?.compuesta&&Array.isArray(meal?.platos)&&meal.platos.length>=2)?(
                    <div style={{display:'flex',flexDirection:'column',gap:2}}>
                      {meal.platos.map((pl,i)=>(
                        <div key={i} style={{fontSize:12.5,fontWeight:800,color:T.t1,fontFamily:"'Nunito',sans-serif",whiteSpace:'nowrap',overflow:'hidden',textOverflow:'ellipsis'}}>
                          <span style={{color:T.au1,fontWeight:900,marginRight:4}}>{menuEtiqueta((Array.isArray(meal.etiquetas)&&meal.etiquetas[i])||(i===0?'1º':'2º'),lang)}</span>
                          <span style={{marginRight:4}}>{emojiPlato(pl.Nombre_Receta,pl.Tipo)}</span>{pl.Nombre_Receta}
                        </div>
                      ))}
                    </div>
                  ):(
                  <div style={{fontSize:14,fontWeight:hasMeal?800:400,color:hasMeal?T.t1:T.t3,fontFamily:"'Nunito',sans-serif",whiteSpace:'nowrap',overflow:'hidden',textOverflow:'ellipsis'}}>
                    {hasMeal&&<span style={{marginRight:4}}>{emojiPlato(meal.Nombre_Receta, meal.Tipo)}</span>}{hasMeal?meal.Nombre_Receta:'—'}
                  </div>
                  )}
                </div>
                {hasMeal&&<div style={{color:T.t3,fontSize:18,flexShrink:0}}>›</div>}
              </button>
              {mostrarChips&&(
                <div style={{background:'rgba(255,255,255,0.03)',border:'1.5px solid rgba(255,255,255,0.10)',borderTop:'none',borderRadius:'0 0 16px 16px',padding:'8px 10px 10px'}}>
                <div style={{display:'flex',gap:6}}>
                  {PLAN_CUMPL.filter(c=>!c.oculto).map(c=>{const on=estado===c.k;return(
                    <button key={c.k} onClick={()=>setEstadoComida(toma,c.k)} title={lang==='en'?c.en:c.es} aria-label={lang==='en'?c.en:c.es} style={{flex:1,display:'flex',alignItems:'center',justifyContent:'center',padding:'11px 0',borderRadius:12,cursor:'pointer',background:on?c.c+'30':'rgba(255,255,255,0.05)',border:on?('2px solid '+c.c):'1.5px solid rgba(255,255,255,0.06)',fontSize:22,lineHeight:1,transition:'all 0.15s',
                      // Micro-pop al quedar seleccionado (Tarea B). La animación solo se
                      // relanza cuando `on` pasa de false→true (la propiedad cambia);
                      // con reduced-motion, el borde y el fondo ya cuentan la selección.
                      animation:(on&&!REDUCED_MOTION())?'popIn 0.22s cubic-bezier(0.34,1.56,0.64,1)':'none'}}>
                      {c.ic}
                    </button>);})}
                </div>
                {/* Kcal reales (fase 1): «menos» pregunta cuánto; sin elegir, la mitad. */}
                {estado==='menos'&&(
                  <div style={{display:'flex',alignItems:'center',gap:6,marginTop:8,fontSize:11,color:T.t2,fontFamily:"'DM Sans',sans-serif"}}>
                    <span style={{flex:1}}>{lang==='en'?'How much did you eat?':'¿Cuánto comiste?'}</span>
                    {FRACCIONES_MENOS.map(([f,s])=>{const on=(fraccionValida(realDia[toma]?.frac)??FRAC_MENOS_DEFECTO)===f;return(
                      <button key={f} onClick={()=>setFraccionMenos(toma,f)} aria-label={s} style={{fontFamily:"'Nunito',sans-serif",fontWeight:800,fontSize:12,padding:'5px 11px',borderRadius:9,cursor:'pointer',background:on?alpha(T.au1,0.12):'transparent',border:on?'1.5px solid '+T.au1:'1.5px solid rgba(255,255,255,0.14)',color:on?T.au2:T.t2}}>{s}</button>);})}
                  </div>
                )}
                {/* Kcal reales (fase 2): lo real de la toma, los extras y la hoja «¿Qué comiste?» */}
                {estado&&(()=>{ const rT=realToma(estado, realDia[toma], previstoToma(planJ,toma,selDay)); const sust=(estado==='fuera'||estado==='cambiada'); const anad=(estado==='anadida');
                  const lnk={background:'none',border:'none',padding:0,cursor:'pointer',color:T.au2,fontFamily:"'Nunito',sans-serif",fontWeight:800,fontSize:11};
                  return(
                  <div style={{display:'flex',alignItems:'center',justifyContent:'space-between',gap:8,marginTop:8,fontSize:11,fontFamily:"'DM Sans',sans-serif"}}>
                    <span style={{color:T.t2}}>{rT&&rT.conocido?`${Math.round(rT.kcal)} kcal${rT.extras?(lang==='en'?` · ${rT.extras} extra`:` · ${rT.extras} extra`):''}`:(sust?(lang==='en'?'? kcal · not quantified':'? kcal · sin cuantificar'):'')}</span>
                    <span style={{display:'flex',gap:12}}>
                      {!anad&&<button onClick={()=>abrirHoja(toma,'extras')} style={lnk}>{lang==='en'?'＋ Add something':'＋ Añadir algo más'}</button>}
                      {anad&&<button onClick={()=>abrirHoja(toma,'anadir')} style={lnk}>{(realDia[toma]?.items||[]).length?(lang==='en'?'Edit what you added':'Editar lo que añadiste'):(lang==='en'?'What did you add?':'¿Qué añadiste?')}</button>}
                      {sust&&<button onClick={()=>abrirHoja(toma,'sustituir')} style={lnk}>{rT&&rT.conocido?(lang==='en'?'Edit what you ate':'Editar lo que comiste'):(lang==='en'?'Quantify':'Cuantificar')}</button>}
                    </span>
                  </div>);})()}
                </div>
              )}
            </div>{suplEn(toma)}</React.Fragment>);
          })}
            </>);
          })()}
          {/* ── «Tu día»: kcal reales frente a previstas y macros real/previsto (src/TuDia.jsx) ── */}
          <TuDia T={T} lang={lang} planJ={planJ} dia={selDay} meals={regDia[selDateKey]?.meals} real={realDia}
                 tomas={PLAN_TOMAS} activo={puedeRegistrar} kcalVisible={profile?.kcal_visible!==false}
                 diaNombre={PLAN_DIAS_F[selDay-1]} semana={plan?.semana} onCuantificar={(toma)=>abrirHoja(toma,'sustituir')}/>
          {hoja&&<QueComiste T={T} lang={lang} toma={hoja.toma} modo={hoja.modo} estado={regDia[selDateKey]?.meals?.[hoja.toma]}
                 cargarRecetas={cargarRecetasCache} nutri={_NUTRI_ING}
                 inicial={hoja.modo==='extras'?(realDia[hoja.toma]?.extras||[]):(realDia[hoja.toma]?.items||[])}
                 onGuardar={guardarHoja} onCerrar={()=>setHoja(null)}/>}
          {boMomento&&!hoja&&<BoMomento T={T} Sheep={Sheep} lang={lang} texto={boMomento.texto} firma={boMomento.firma}
                 bo={{color:profile?.bo_color||'blanca',equipados:Array.isArray(profile?.bo_equipados)?profile.bo_equipados:[]}}
                 onCerrar={()=>setBoMomento(null)}/>}
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
                {PLAN_CUMPL.filter(c=>!c.oculto).map(c=>(
                  <div key={c.k} style={{display:'flex',alignItems:'center',gap:6,fontSize:12,color:T.t2,fontFamily:"'DM Sans',sans-serif"}}><span style={{fontSize:16,lineHeight:1}}>{c.ic}</span>{lang==='en'?c.en:c.es}</div>
                ))}
                <div style={{display:'flex',alignItems:'center',gap:6,fontSize:12,color:T.t2,fontFamily:"'DM Sans',sans-serif"}}><span style={{fontSize:16,lineHeight:1}}>＋</span>{lang==='en'?'Add something: an extra on any meal':'Añadir algo más: un extra sobre cualquier comida'}</div>
                <div style={{display:'flex',alignItems:'center',gap:6,fontSize:12,color:T.t2,fontFamily:"'DM Sans',sans-serif"}}><span style={{fontSize:16,lineHeight:1}}>➕</span>{lang==='en'?'Added: the recipe and, on top, other dishes or foods (they add to your plan)':'Añadí: la receta y, además, otros platos o ingredientes (se suman a lo previsto)'}</div>
                <div style={{display:'flex',alignItems:'center',gap:6,fontSize:12,color:T.t2,fontFamily:"'DM Sans',sans-serif"}}><span style={{fontSize:16,lineHeight:1}}>🔄</span>{lang==='en'?'Swapped: something else instead of the recipe, out or at home; say what you ate to see your kcal, or it stays as «?»':'La cambié: otra cosa en vez de la receta, fuera o en casa; di qué comiste para ver tus kcal, o queda en «?»'}</div>
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
          {/* ── MENÚ DESGLOSADO: pestañas de platos ─────────────────────────
              Cada pestaña carga su plato en tomaReceta y TODO lo de abajo
              (macros, ración, ingredientes, preparación, cambiar, guardar y
              descartar) se reutiliza tal cual; «Cambiar» cambia solo ese
              plato. El check de cumplimiento es de la TOMA: un solo registro
              engloba los dos platos. */}
          {tomaMenu&&(<>
            <div style={{display:'flex',gap:8,marginBottom:10}}>
              {tomaMenu.platos.map((pl,i)=>{const on=i===platoSel;return(
                <button key={i} onClick={()=>{if(i===platoSel)return;sfx&&sfx('tap');setPlatoSel(i);setTomaReceta(platoMenuAReceta(pl));setCocinarDos(false);setCocinarDeMas(1);}} style={{
                  flex:1,minWidth:0,padding:'10px 10px',borderRadius:14,cursor:'pointer',textAlign:'left',
                  background:on?'linear-gradient(135deg,'+T.g1+','+T.g2+')':'rgba(255,255,255,0.05)',
                  border:on?'2px solid '+T.au2:'1.5px solid rgba(255,255,255,0.12)',
                  boxShadow:on?'0 3px 0 '+T.g3:'none',transition:'all 0.15s'}}>
                  <div style={{fontSize:10,fontWeight:900,color:on?T.wh:T.au1,textTransform:'uppercase',letterSpacing:'0.08em',fontFamily:"'DM Sans',sans-serif",marginBottom:2}}>
                    {menuEtiqueta(tomaMenu.etiquetas[i],lang)} · {Math.round(parseFloat(pl.Calorias_Totales)||0)} kcal
                  </div>
                  <div style={{fontSize:12.5,fontWeight:900,color:on?T.wh:T.t1,fontFamily:"'Nunito',sans-serif",whiteSpace:'nowrap',overflow:'hidden',textOverflow:'ellipsis'}}>
                    {emojiPlato(pl.Nombre_Receta,pl.Tipo)} {pl.Nombre_Receta}
                  </div>
                </button>);})}
            </div>
            <div style={{display:'flex',alignItems:'center',gap:8,background:'rgba(255,255,255,0.04)',
              border:'1.5px solid rgba(255,255,255,0.10)',borderRadius:14,padding:'8px 12px',marginBottom:12}}>
              <span style={{fontSize:15,lineHeight:1}}>🍽️</span>
              <span style={{fontSize:11,color:T.t2,fontFamily:"'DM Sans',sans-serif",lineHeight:1.4}}>
                {lang==='en'
                  ?`Full menu: ${tomaMenu.kcalTotal} kcal · both courses are ONE meal — a single check logs them together`
                  :`Menú completo: ${tomaMenu.kcalTotal} kcal · los dos platos son UNA toma — un solo check registra todo`}
              </span>
            </div>
          </>)}
          <div style={{background:T.bgCard,borderRadius:20,padding:'20px 18px',marginBottom:12,border:'1px solid rgba(255,255,255,0.07)'}}>
            <div style={{display:'flex',alignItems:'flex-start',gap:14,marginBottom:16}}>
              <div style={{fontSize:48,lineHeight:1,flexShrink:0}}>{emojiPlato(tomaReceta.nombre, tomaReceta.tipo)}</div>
              <div style={{flex:1}}>
                <div style={{display:'inline-block',background:(PLAN_TIPO_COLOR[tomaReceta.tipo]||T.g1)+'22',border:'1.5px solid '+(PLAN_TIPO_COLOR[tomaReceta.tipo]||T.g1)+'55',borderRadius:20,padding:'3px 12px',fontSize:10,fontWeight:900,color:PLAN_TIPO_COLOR[tomaReceta.tipo]||T.g1,textTransform:'uppercase',letterSpacing:'0.1em',marginBottom:8}}>{tomaReceta.tipo||'—'}</div>
                <div style={{fontSize:19,fontWeight:900,color:T.wh,lineHeight:1.25}}>{tomaReceta.nombre}</div>
              </div>
            </div>
            {/* Caja dorada: qué cocinar y cuánto comer. Sale si la receta rinde
                varias raciones (tú comes 1) o si el plan ajustó la ración. */}
            {(()=>{
              const caja=textosCajaRacion({raciones:tomaReceta.raciones,factor:tomaReceta.racion_factor,
                racionTexto:tomaReceta.racion_texto,lang});
              return caja&&(
              <div style={{display:'flex',alignItems:'center',gap:8,background:alpha(T.au1,0.10),
                border:`1.5px solid ${alpha(T.au1,0.45)}`,borderRadius:14,padding:'9px 12px',marginBottom:12}}>
                <span style={{fontSize:18,lineHeight:1}}>{caja.icono}</span>
                <div>
                  <div style={{fontSize:12,fontWeight:900,color:T.au1}}>
                    {caja.titulo}
                  </div>
                  <div style={{fontSize:10.5,color:T.t2,fontFamily:"'DM Sans',sans-serif",lineHeight:1.4}}>
                    {caja.detalle}
                  </div>
                </div>
              </div>);
            })()}
            <div style={{display:'grid',gridTemplateColumns:'1fr 1fr 1fr 1fr',gap:8}}>
              {[{l:lang==='en'?'Calories':'Calorías',v:String(tomaReceta.calorias),u:'kcal',c:T.au1},{l:lang==='en'?'Protein':'Proteína',v:String(tomaReceta.proteinas_g),u:'g',c:T.platos},{l:lang==='en'?'Carbs':'Carbos',v:String(tomaReceta.hidratos_g),u:'g',c:T.g1},{l:lang==='en'?'Fat':'Grasas',v:String(tomaReceta.grasas_g),u:'g',c:'#FFB74D'}].map(({l,v,u,c})=>(
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
                {!fusion&&racLista>1&&(<div style={{fontSize:11,color:PLAN_TIPO_COLOR[tomaReceta.tipo]||T.g1,fontWeight:800,background:(PLAN_TIPO_COLOR[tomaReceta.tipo]||T.g1)+'22',borderRadius:20,padding:'3px 11px',whiteSpace:'nowrap'}}>🍽️ {lang==='en'?`Makes ${racLista} servings`:`Rinde ${racLista} raciones`}</div>)}
                <button onClick={()=>setMiniCompra({nombre:tomaReceta.nombre,ingredientes:ingTexto,id:tomaReceta.id_receta,
                  etiquetaRacion:etiquetaLista})} style={{
                  background:'rgba(255,140,60,0.12)',border:'1.5px solid rgba(255,140,60,0.4)',borderRadius:20,
                  padding:'4px 13px',fontSize:11.5,fontWeight:900,color:T.compra,cursor:'pointer',
                  fontFamily:"'Nunito',sans-serif",whiteSpace:'nowrap'}}>{t("buyBtn")}</button>
              </div>
            </div>
            {/* Fase 0 · para cuántos son estas cantidades (el plan ya viene
                escalado a la ración del paciente, pero él no lo sabe) */}
            <div style={{display:'flex',alignItems:'center',gap:6,marginTop:-4,marginBottom:11,
              fontSize:11.5,color:T.t2,fontFamily:"'DM Sans',sans-serif",lineHeight:1.35}}>
              <span style={{fontSize:13,lineHeight:1,flexShrink:0}}>⚖️</span>
              <span>{etiquetaLista}</span>
            </div>
            {/* ── §5.2 · Cocinar para los dos ─────────────────────────────────
                Solo si la pareja tiene la MISMA receta en la MISMA toma del
                MISMO día. Si no, ni aparece. */}
            {mismaReceta&&(
              <div style={{background:cocinarDos?alpha(T.g1,0.08):'rgba(255,255,255,0.04)',
                border:`1.5px solid ${cocinarDos?alpha(T.au1,0.5):alpha(T.au1,0.28)}`,
                borderRadius:14,padding:'12px 13px',marginBottom:12,transition:'all 0.15s'}}>
                <div style={{fontSize:12.5,fontWeight:900,color:T.au1,fontFamily:"'Nunito',sans-serif",marginBottom:9}}>
                  🍽️ {t("cocinarMasPregunta")}
                </div>
                <div style={{display:'flex',gap:8}}>
                  {[{v:false,l:t("cocinarDosOpSolo")},{v:true,l:t("cocinarDosOpPareja")}].map(({v,l})=>(
                    <button key={String(v)} onClick={()=>{sfx&&sfx('tap');setCocinarDos(v);setCocinarDeMas(1);}} style={{
                      flex:1,padding:'9px 6px',borderRadius:12,cursor:'pointer',transition:'all 0.15s',
                      background:cocinarDos===v?T.g3:'rgba(255,255,255,0.05)',
                      border:cocinarDos===v?`2px solid ${T.au2}`:'1.5px solid rgba(255,255,255,0.14)',
                      color:cocinarDos===v?T.wh:T.t2,fontSize:13,fontWeight:900,
                      boxShadow:cocinarDos===v?'0 3px 0 rgba(0,0,0,0.35)':'none',
                      fontFamily:"'Nunito',sans-serif"}}>
                      {l}
                    </button>
                  ))}
                </div>
                {cocinarDos&&(<div style={{marginTop:10,paddingTop:9,borderTop:'1px solid rgba(255,255,255,0.10)'}}>
                  <div style={{fontSize:12,fontWeight:800,color:T.au1,marginBottom:4,fontFamily:"'DM Sans',sans-serif"}}>
                    🍽️ {t("cocinarDosReparto",{a:repartoTuyo,b:100-repartoTuyo,n:pareja?.nombre||''})}
                  </div>
                  <div style={{fontSize:11,color:T.t2,fontFamily:"'DM Sans',sans-serif",lineHeight:1.45}}>
                    {racReceta>1 ? t("cocinarDosNotaRinde",{k:racReceta}) : t("cocinarDosNota")}
                  </div>
                  {!!fusion?.avisos?.length&&(
                    <div style={{marginTop:7,fontSize:11,color:'#FFB74D',fontFamily:"'DM Sans',sans-serif",lineHeight:1.45}}>
                      ⚠️ {t("cocinarDosAviso",{ing:fusion.avisos.join(', ')})}
                    </div>
                  )}
                </div>)}
              </div>
            )}
            {/* ── §5.3 · Raciones a cocinar: aquí SÍ es literalmente el doble
                de la misma ración (batch cooking o pareja sin cuenta) ──────── */}
            {!mismaReceta&&!!tomaReceta.ingredientes&&(
              <div style={{background:'rgba(255,255,255,0.04)',border:`1.5px solid ${alpha(T.au1,0.28)}`,
                borderRadius:14,padding:'12px 13px',marginBottom:12}}>
                <div style={{fontSize:12.5,fontWeight:900,color:T.au1,fontFamily:"'Nunito',sans-serif",marginBottom:9}}>
                  🍲 {t("cocinarMasPregunta")}
                </div>
                <div style={{display:'flex',gap:8}}>
                  {[1,2,3].map(x=>(
                    <button key={x} onClick={()=>{sfx&&sfx('tap');setCocinarDeMas(x);}} style={{
                      flex:1,padding:'9px 0',borderRadius:12,cursor:'pointer',transition:'all 0.15s',
                      background:cocinarDeMas===x?T.g3:'rgba(255,255,255,0.05)',
                      border:cocinarDeMas===x?`2px solid ${T.au2}`:'1.5px solid rgba(255,255,255,0.14)',
                      color:cocinarDeMas===x?T.wh:T.t2,fontSize:13,fontWeight:900,
                      boxShadow:cocinarDeMas===x?'0 3px 0 rgba(0,0,0,0.35)':'none',
                      fontFamily:"'Nunito',sans-serif"}}>
                      {/* El botón dice cuántas raciones salen, no «x1»: en una receta
                          de 3 raciones «x1» junto a «Rinde 3 raciones» parecía 1. */}
                      {(()=>{const r=racionesDeLaLista(racReceta,x);
                        return `${r} ${lang==='en'?(r===1?'serving':'servings'):(r===1?'ración':'raciones')}`;})()}
                    </button>
                  ))}
                </div>
                {cocinarDeMas>1&&(
                  <div style={{marginTop:9,fontSize:11,color:T.t2,fontFamily:"'DM Sans',sans-serif",lineHeight:1.45}}>
                    {t("cocinarMasNota")}
                  </div>
                )}
              </div>
            )}
            <div style={{display:'flex',flexDirection:'column',gap:7}}>
              {ingList.map((ing,i)=>(<div key={i} className="stagger-in" style={{animationDelay:escalon(i),display:'flex',alignItems:'flex-start',gap:10}}><div style={{width:6,height:6,borderRadius:'50%',background:PLAN_TIPO_COLOR[tomaReceta.tipo]||T.g1,flexShrink:0,marginTop:6}}/><div style={{fontSize:13,color:T.t1,fontFamily:"'DM Sans',sans-serif",lineHeight:1.4}}>{ing}</div></div>))}
            </div>
          </div>)}
          {/* 💶 Coste estimado de TU ración (informativo; el gasto real se
              apunta en la pestaña 🛒 Comprar). IIFE sin hooks: rama 'daily'.
              En una receta de varias raciones la lista es la olla entera: tu
              ración es la olla entre las raciones (como el recetario y el PDF). */}
          {(()=>{
            const _ce=costeRecetaJS(tomaReceta?.ingredientes||'');
            if(!(_ce.total>0)) return null;
            const _rac=Math.max(1,parseInt(tomaReceta?.raciones)||1);
            return(
            <div style={{background:T.bgCard,borderRadius:20,padding:'14px 18px',border:'1px solid rgba(255,255,255,0.07)',marginBottom:12}}>
              <div style={{display:'flex',alignItems:'center',justifyContent:'space-between',gap:10}}>
                <div style={{fontSize:12.5,fontWeight:900,color:T.t1,fontFamily:"'Nunito',sans-serif"}}>
                  💶 {lang==='en'?'Estimated cost of your serving':'Coste estimado de tu ración'}
                </div>
                <div style={{fontSize:16,fontWeight:900,color:T.g1,fontFamily:"'Nunito',sans-serif",flexShrink:0}}>~{eurES(costePorRacion(_ce.total,_rac))} €</div>
              </div>
              {_rac>1&&(
                <div style={{fontSize:11,color:T.t2,fontFamily:"'DM Sans',sans-serif",marginTop:4,lineHeight:1.4}}>
                  {lang==='en'?`The whole list (${_rac} servings): ~${eurES(_ce.total)} €`:`La lista entera (${_rac} raciones): ~${eurES(_ce.total)} €`}
                </div>
              )}
              <div style={{fontSize:10.5,color:T.t3,fontFamily:"'DM Sans',sans-serif",marginTop:6,lineHeight:1.4}}>
                {lang==='en'?'Log what it really cost you from the 🛒 Buy button.':'Apunta lo que te cueste de verdad desde el botón 🛒 Comprar.'}
              </div>
            </div>);
          })()}
          <div style={{background:T.bgCard,borderRadius:20,padding:'18px 18px',border:'1px solid rgba(255,255,255,0.07)'}}>
            <div style={{fontSize:11,color:T.au1,fontWeight:900,textTransform:'uppercase',letterSpacing:'0.1em',marginBottom:12}}>{lang==='en'?'Preparation':'Preparación'}</div>
            <div style={{fontSize:13,color:T.t1,fontFamily:"'DM Sans',sans-serif",lineHeight:1.7,whiteSpace:'pre-wrap'}}>{tomaReceta.instrucciones}</div>
          </div>
          <BotonCompartirReceta rec={tomaReceta} lang={lang} sfx={sfx}/>

          {/* Botones: cambiar receta (10💎), guardar (20💎) y descartar (gratis) */}
          <div style={{display:'flex',gap:10,marginTop:12}}>
            {/* Cambiar receta. En un MENÚ DESGLOSADO cambia solo el plato que
                se ve («Cambiar 1º», «Cambiar 2º») y la celda se recompone con
                los totales nuevos (cambiarPlatoMenu, 12-oct-2026); hasta ese
                día el botón no salía en los menús. Guardar/descartar operan
                también sobre el plato visible (son recetas del recetario). */}
            <button onClick={cambiarRecetaToma}
              style={{flex:1,background:(!enTrial&&gems<10)?'rgba(255,255,255,0.05)':'rgba(100,181,246,0.15)',
                      border:(!enTrial&&gems<10)?'1.5px solid rgba(255,255,255,0.08)':'1.5px solid rgba(100,181,246,0.4)',
                      borderRadius:16,padding:'14px 10px',cursor:(!enTrial&&gems<10)?'default':'pointer',
                      display:'flex',flexDirection:'column',alignItems:'center',gap:4}}>
              <span style={{fontSize:20}}>🔄</span>
              <span style={{fontSize:12,fontWeight:900,color:(!enTrial&&gems<10)?T.t3:T.platos,fontFamily:"'Nunito',sans-serif"}}>
                {lang==='en'?'Change':'Cambiar'}{tomaMenu?' '+menuEtiquetaCorta(tomaMenu.etiquetas[platoSel],lang):''}
              </span>
              <span style={{fontSize:10,color:enTrial?T.g1:T.t3,fontWeight:enTrial?900:400}}>{enTrial?(lang==='en'?'Free · trial':'Gratis · prueba'):'10 💎'}</span>
            </button>
            <button onClick={recetaYaGuardada?undefined:guardarRecetaToma}
              style={{flex:1,background:recetaYaGuardada?alpha(T.g1,0.15):(gems<20?'rgba(255,255,255,0.05)':alpha(T.au1,0.12)),
                      border:recetaYaGuardada?'1.5px solid '+T.bG:(gems<20?'1.5px solid rgba(255,255,255,0.08)':`1.5px solid ${alpha(T.au1,0.35)}`),
                      borderRadius:16,padding:'14px 10px',cursor:recetaYaGuardada?'default':(gems<20?'default':'pointer'),
                      display:'flex',flexDirection:'column',alignItems:'center',gap:4}}>
              <span style={{fontSize:20}}>{recetaYaGuardada?'✅':'📖'}</span>
              <span style={{fontSize:12,fontWeight:900,color:recetaYaGuardada?T.g1:(gems<20?T.t3:T.au1),fontFamily:"'Nunito',sans-serif"}}>
                {recetaYaGuardada?(lang==='en'?'Saved':'Guardada'):(lang==='en'?'Save':'Guardar')}
              </span>
              <span style={{fontSize:10,color:T.t3}}>{recetaYaGuardada?'✓':'20 💎'}</span>
            </button>
            <button onClick={descartarRecetaToma}
              style={{flex:1,background:recetaDescartada?'rgba(255,90,90,0.18)':'rgba(255,90,90,0.08)',
                      border:recetaDescartada?'1.5px solid rgba(255,90,90,0.55)':'1.5px solid rgba(255,90,90,0.25)',
                      borderRadius:16,padding:'14px 10px',cursor:'pointer',
                      display:'flex',flexDirection:'column',alignItems:'center',gap:4}}>
              <span style={{fontSize:20}}>{recetaDescartada?'🚫':'🗑️'}</span>
              <span style={{fontSize:12,fontWeight:900,color:'#FF6B6B',fontFamily:"'Nunito',sans-serif"}}>
                {recetaDescartada?(lang==='en'?'Discarded':'Descartada'):(lang==='en'?'Dislike':'No me gusta')}
              </span>
              <span style={{fontSize:10,color:T.t3}}>{recetaDescartada?(lang==='en'?'Tap to undo':'Toca para deshacer'):(lang==='en'?'Free':'Gratis')}</span>
            </button>
          </div>
          {/* «Pregúntale a Bo» sobre esta receta: las acciones son las tres de arriba, por sus
              mismas funciones (cambiarRecetaToma admite {sinIngrediente}). */}
          {boActivo(profile)&&(
            <button data-bo-abrir-receta onClick={()=>{sfx&&sfx('tap');setBoHoja(true);}}
              style={{width:'100%',marginTop:10,background:'rgba(255,255,255,0.05)',border:`1.5px solid ${alpha(T.au1,0.35)}`,borderRadius:16,
                      padding:'12px 10px',cursor:'pointer',display:'flex',alignItems:'center',justifyContent:'center',gap:8}}>
              <span style={{fontSize:18}}>💬</span>
              <span style={{fontSize:12.5,fontWeight:900,color:T.au1,fontFamily:"'Nunito',sans-serif"}}>{lang==='en'?'Ask Bo about this recipe':'Pregúntale a Bo por esta receta'}</span>
            </button>)}
          {boHoja&&boActivo(profile)&&<PreguntaBo T={T} Sheep={Sheep} lang={lang} pid={profile?.id}
            bo={{nombre:profile?.bo_nombre||'Bo',color:profile?.bo_color||'blanca',equipados:Array.isArray(profile?.bo_equipados)?profile.bo_equipados:[]}}
            ctx={{contexto:'receta',plan:planBo(profile),enTrial:!!enTrial,raciones:tomaReceta.raciones,puedeCambiar:true,descartada:!!recetaDescartada,
                  dia:selDay,toma:openToma,receta:tomaReceta.nombre,
                  cajaRacion:(()=>{ const c=textosCajaRacion({raciones:tomaReceta.raciones,factor:tomaReceta.racion_factor,racionTexto:tomaReceta.racion_texto,lang}); return c?`${c.titulo}. ${c.detalle}`:''; })()}}
            receta={{nombre:tomaReceta.nombre,ingList}}
            onAccion={async(a,extra)=>{
              if(a==='cambiar'||a==='cambiar_sin') return await cambiarRecetaToma(extra||{});
              if(a==='descartar'){ if(recetaDescartada) return {ok:true}; await descartarRecetaToma(); return {ok:true}; }
              return {ok:false}; }}
            onAbrir={(d)=>{ if(d==='consulta'&&setTab) setTab('consulta'); if(d==='peso'&&setTab) setTab('peso');
              if(d==='objetivo'&&setTab) setTab('objetivo'); if(d==='config'&&isStandard){ setOpenToma(null); setConfigView(true); } }}
            ia={{...boIA, consentir:()=>boIAConsentir(profile?.id)}}
            pendiente={boPendiente}
            onIr={(d)=>{ setBoHoja(false); setBoPendiente(null); setBoNav(d); }}
            onRegistrar={boRegistrar}
            onCerrar={()=>{ setBoHoja(false); setBoPendiente(null); }}/>}
        </>)}
      </div>)}
    </div>);
  }
  return null;
}
