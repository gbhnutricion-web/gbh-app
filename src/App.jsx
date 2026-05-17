import React, { useState, useEffect, useCallback, useMemo, useRef } from "react";
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
const LEVELS=[{l:1,n:"Iniciado",min:0},{l:2,n:"Constante",min:150},{l:3,n:"Dedicado",min:400},{l:4,n:"Atleta",min:800},{l:5,n:"Élite",min:1500},{l:6,n:"Leyenda GBH",min:3000}];
const getLevel=(xp)=>LEVELS.slice().reverse().find(lv=>xp>=lv.min)||LEVELS[0];
const getNextLevel=(lv)=>LEVELS[lv.l]||lv;

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

function getBubbleMsg(name,streak,expr){
  const n=name.split(" ")[0];
  if(expr==="celebrating") return`🎉 ¡Día perfecto, ${n}! Misiones completadas`;
  if(expr==="legend")      return`👑 ¡${streak} días, ${n}! Leyenda absoluta`;
  if(expr==="excited")     return`🔥 ¡${streak} días seguidos! ¡Imparable, ${n}!`;
  if(expr==="happy")       return`✅ ¡Dieta registrada! Sigue así, ${n}`;
  if(expr==="sleeping")    return`😴 Buen descanso, ${n}. ¡Mañana a tope!`;
  if(expr==="sad"&&new Date().getHours()>=20) return`⚠️ ${n}, ¡aún puedes registrar la dieta! No pierdas la racha 🔥`;
  if(expr==="sad")         return`💚 Hola ${n}! Hoy es el día para empezar`;
  return`¡Hola ${n}! ¿Listo para marcar el día? 🌱`;
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
  const today=new Date(),dow=today.getDay();
  const days=Array.from({length:7},(_,i)=>{
    const d=new Date();d.setDate(today.getDate()-(dow===0?6:dow-1)+i);
    const key=toKey(d),isToday=key===toKey(),done=!!logs.find(l=>l.date===key&&l.diet);
    return{label:WLABELS[i],key,isToday,done,isPast:d<today&&!isToday};
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
        <div style={{fontSize:11,color:T.au1,textTransform:"uppercase",letterSpacing:"0.1em",fontWeight:900}}>📅 Progreso semanal</div>
        <div style={{fontSize:12,fontWeight:800,color:T.t2}}>{completedCount}/7 días</div>
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
          title={chestReady?"¡Cofre semanal listo! Ábrelo":weekUnlocked&&chestOpened?"Ya abriste el cofre esta semana":`Completa los 7 días para desbloquear`}
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
        {chestReady?"¡Cofre desbloqueado! Toca para abrirlo 🎉"
          :chestOpened&&weekUnlocked?"Cofre abierto esta semana ✅"
          :`${7-completedCount} día${7-completedCount!==1?"s":""} más para el cofre semanal`}
      </div>
    </div>
  );
}

// ─── Big action button (Duolingo green pill) ──────────────────────────────────
function BigBtn({icon,label,done,onClick}){
  return done?(
    <div style={{background:`linear-gradient(135deg,rgba(43,122,0,0.5),rgba(88,204,2,0.25))`,border:`3px solid ${T.g1}`,borderRadius:20,padding:"17px 20px",marginBottom:12,display:"flex",alignItems:"center",justifyContent:"center",gap:12,boxShadow:`0 6px 0 ${T.g3}`}}>
      <span style={{fontSize:28}}>✅</span>
      <span style={{fontWeight:900,fontSize:16,color:T.g2}}>¡Dieta del día registrada! +15 XP</span>
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
              <div style={{fontSize:11,color:T.au1,fontWeight:700}}>+{xpR} XP{done?" · ¡Completado!":""}</div>
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
              <div style={{fontSize:14,fontWeight:800,color:done?T.t1:"rgba(255,255,255,0.55)"}}>Dar 10.000 pasos</div>
              <div style={{fontSize:11,color:T.au1,fontWeight:700}}>+5 XP · {stepCount.toLocaleString()} / 10.000 pasos</div>
            </div>
          </div>
        </div>
      </div>
      {/* Progress bar */}
      <div style={{background:"rgba(255,255,255,0.08)",borderRadius:10,height:12,overflow:"hidden",marginBottom:10,boxShadow:"inset 0 2px 4px rgba(0,0,0,0.3)"}}>
        <div style={{height:"100%",width:`${pct}%`,background:`linear-gradient(90deg,${T.g1},${T.g2})`,borderRadius:10,transition:"width 0.5s ease",boxShadow:`0 0 8px ${T.g1}60`}}/>
      </div>
      {/* Add buttons */}
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
  if(!active||!payload?.length)return null;
  const d=payload[0]?.payload;
  return(<div style={{background:T.bgWood,border:`1px solid ${T.bA}`,borderRadius:12,padding:"8px 14px"}}><div style={{color:T.t2,fontSize:11}}>{d?.date}</div>{d?.weight&&<div style={{color:T.au1,fontWeight:800,fontSize:15}}>{d.weight} kg</div>}{d?.ma&&<div style={{color:T.xp,fontSize:12,marginTop:2}}>Tendencia: {d.ma.toFixed(1)} kg</div>}</div>);
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
function LevelUpOverlay({active,level}){
  if(!active)return null;
  return(
    <div style={{position:"fixed",inset:0,zIndex:10001,background:"#000",display:"flex",flexDirection:"column",alignItems:"center",justifyContent:"center",animation:"fadeInOut 3s ease forwards",pointerEvents:"none"}}>
      <div style={{fontSize:70,animation:"scaleIn 0.6s cubic-bezier(0.34,1.56,0.64,1)"}}>⭐</div>
      <div style={{fontSize:15,fontWeight:900,color:"rgba(255,255,255,0.6)",fontFamily:"'DM Sans',sans-serif",textTransform:"uppercase",letterSpacing:"0.15em",marginTop:14,animation:"scaleIn 0.5s 0.2s both"}}>NIVEL ALCANZADO</div>
      <div style={{fontSize:72,fontWeight:900,color:"#FFD700",fontFamily:"'Nunito',sans-serif",lineHeight:1,animation:"scaleIn 0.6s 0.35s cubic-bezier(0.34,1.56,0.64,1) both"}}>{level}</div>
      <div style={{fontSize:18,fontWeight:800,color:"#FFF",fontFamily:"'Nunito',sans-serif",marginTop:10,animation:"scaleIn 0.5s 0.55s both"}}>¡Sigue imparable! 💪</div>
    </div>
  );
}

// ─── "Vuelve mañana" card ─────────────────────────────────────────────────────
function TomorrowCard({name,streak}){
  const n=name.split(" ")[0];
  return(
    <div style={{background:"linear-gradient(135deg,rgba(43,122,0,0.35),rgba(88,204,2,0.15))",border:`2px solid ${T.g1}`,borderRadius:24,padding:"22px 20px",textAlign:"center",marginBottom:14,boxShadow:`0 6px 0 ${T.g3}`}}>
      <div style={{fontSize:40,marginBottom:8}}>🌙</div>
      <div style={{fontSize:20,fontWeight:900,color:T.g2,marginBottom:6}}>¡Día completado, {n}!</div>
      <div style={{fontSize:13,color:T.t2,fontFamily:"'DM Sans',sans-serif",lineHeight:1.6,marginBottom:14}}>
        Has completado todas las misiones.<br/>Tu racha es de <span style={{color:"#FF8040",fontWeight:900}}>{streak} 🔥</span> días.
      </div>
      <div style={{display:"flex",justifyContent:"center",gap:10}}>
        <div style={{background:"rgba(255,255,255,0.07)",borderRadius:16,padding:"10px 20px",fontSize:13,fontWeight:800,color:T.au1}}>🕐 Vuelve mañana</div>
      </div>
    </div>
  );
}

// ─── Hydration tracker (vasos de agua) ───────────────────────────────────────
function HydrationWidget({done,onToggle}){
  const [glasses,setGlasses]=useState(()=>{
    try{return parseInt(localStorage.getItem("gbh:glasses:"+new Date().toISOString().slice(0,10))||"0");}catch{return 0;}
  });
  const target=8; // 8 vasos ≈ 2L
  const addGlass=()=>{
    if(done)return;
    const ng=Math.min(glasses+1,target);
    setGlasses(ng);
    try{localStorage.setItem("gbh:glasses:"+new Date().toISOString().slice(0,10),ng);}catch{}
    if(ng>=target&&!done)onToggle();
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
              <div style={{fontSize:14,fontWeight:800,color:done?T.t1:"rgba(255,255,255,0.55)"}}>Beber 1.5 - 2 L de agua</div>
              <div style={{fontSize:11,color:T.au1,fontWeight:700}}>+5 XP · {glasses}/{target} vasos{done?" · ¡Completado!":""}</div>
            </div>
          </div>
        </div>
      </div>
      {/* Barra de progreso */}
      <div style={{background:"rgba(255,255,255,0.08)",borderRadius:10,height:10,overflow:"hidden",marginBottom:10,boxShadow:"inset 0 2px 4px rgba(0,0,0,0.3)"}}>
        <div style={{height:"100%",width:`${pct}%`,background:`linear-gradient(90deg,#29B6F6,#0288D1)`,borderRadius:10,transition:"width 0.4s ease",boxShadow:"0 0 8px #29B6F660"}}/>
      </div>
      {/* Vasos */}
      <div style={{display:"flex",gap:6,flexWrap:"wrap"}}>
        {Array.from({length:target},(_,i)=>(
          <button key={i} onClick={addGlass} disabled={done||i<glasses} style={{
            width:34,height:38,borderRadius:10,border:`2px solid ${i<glasses?"#0288D1":"rgba(255,255,255,0.12)"}`,
            background:i<glasses?"rgba(41,182,246,0.25)":"rgba(255,255,255,0.06)",
            cursor:done||i<glasses?"default":"pointer",
            fontSize:18,display:"flex",alignItems:"center",justifyContent:"center",
            transition:"all 0.2s",
            boxShadow:i<glasses?"0 2px 0 #0277BD":"0 2px 0 rgba(0,0,0,0.4)",
          }}>
            {i<glasses?"🥤":"🫙"}
          </button>
        ))}
      </div>
      {!done&&glasses<target&&<div style={{fontSize:10,color:T.t2,marginTop:8,fontFamily:"'DM Sans',sans-serif"}}>Pulsa cada vaso al beberlo — meta: {target} vasos (≈ 2L)</div>}
    </div>
  );
}

// ─── Weekly XP goal ───────────────────────────────────────────────────────────
function WeeklyXPGoal({logs,xp}){
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
        <div style={{fontSize:11,fontWeight:900,color:done?T.g2:T.au1,textTransform:"uppercase",letterSpacing:"0.08em"}}>⚡ Meta semanal de XP</div>
        <div style={{fontSize:13,fontWeight:900,color:done?T.g1:T.t1}}>{weekXP}<span style={{color:T.t2,fontWeight:700}}>/{GOAL} XP</span></div>
      </div>
      <div style={{background:"rgba(255,255,255,0.08)",borderRadius:10,height:14,overflow:"hidden",boxShadow:"inset 0 2px 4px rgba(0,0,0,0.3)"}}>
        <div style={{height:"100%",width:`${pct}%`,background:done?`linear-gradient(90deg,${T.g1},${T.g2})`:`linear-gradient(90deg,${T.xp},${T.g1})`,borderRadius:10,transition:"width 0.7s ease",boxShadow:done?`0 0 12px ${T.g1}80`:`0 0 8px ${T.xp}60`,position:"relative"}}>
          {pct>15&&<div style={{position:"absolute",right:8,top:"50%",transform:"translateY(-50%)",fontSize:9,fontWeight:900,color:"white"}}>{Math.round(pct)}%</div>}
        </div>
      </div>
      {done&&<div style={{fontSize:11,color:T.g2,marginTop:6,fontWeight:800,textAlign:"center"}}>🎉 ¡Meta semanal completada! Bonus: +20 XP</div>}
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
  if(!chartData.length)return null;
  const f=chartData[0].weight,l=chartData[chartData.length-1].weight,diff=l-f,down=diff<0;
  return(
    <Card>
      <div style={{display:"flex",alignItems:"center",justifyContent:"space-between",marginBottom:12}}>
        <div style={{fontSize:11,color:T.au1,textTransform:"uppercase",letterSpacing:"0.1em",fontWeight:900}}>📈 Evolución de peso</div>
        <div style={{display:"flex",gap:10,flexWrap:"wrap",justifyContent:"flex-end"}}>
          <div style={{fontSize:10,color:T.t2,fontFamily:"'DM Sans',sans-serif",display:"flex",alignItems:"center",gap:4}}><div style={{width:12,height:3,background:T.au1,borderRadius:2}}/> Real</div>
          <div style={{fontSize:10,color:T.t2,fontFamily:"'DM Sans',sans-serif",display:"flex",alignItems:"center",gap:4}}><div style={{width:12,height:2,background:T.xp,borderRadius:2}}/> Tendencia</div>
          {goalWeight&&<div style={{fontSize:10,color:"#FF6B9D",fontFamily:"'DM Sans',sans-serif",display:"flex",alignItems:"center",gap:4}}><div style={{width:12,height:2,background:"#FF6B9D",borderRadius:2,borderTop:"2px dashed #FF6B9D"}}/> Objetivo</div>}
        </div>
      </div>
      <ResponsiveContainer width="100%" height={200}>
        <ComposedChart data={chartData} margin={{top:5,right:5,left:-22,bottom:0}}>
          <XAxis dataKey="date" tickFormatter={d=>d.slice(5)} tick={{fontSize:9,fill:T.t2}} tickLine={false} axisLine={false}/>
          <YAxis domain={goalWeight?[d=>{const mn=Math.min(...chartData.map(x=>x.weight||99),goalWeight)-2;return Math.floor(mn);},"auto"]:(["auto","auto"])} tick={{fontSize:9,fill:T.t2}} tickLine={false} axisLine={false}/>
          <Tooltip content={<CTip/>}/>
          {goalWeight&&<Line type="monotone" dataKey={()=>goalWeight} stroke="#FF6B9D" strokeWidth={2} strokeDasharray="6 4" dot={false} name="Objetivo"/>}
          <Line type="monotone" dataKey="weight" stroke={T.au1} strokeWidth={2.5} dot={{r:4.5,fill:T.au1,strokeWidth:0}} activeDot={{r:7,fill:T.au2}}/>
          <Line type="monotone" dataKey="ma" stroke={T.xp} strokeWidth={2} strokeDasharray="5 3" dot={false}/>
        </ComposedChart>
      </ResponsiveContainer>
      {chartData.length>=2&&(()=>{
        // Buscar peso inicial (isInitial) o primer punto
        const initialEntry = chartData.find(d=>d.isInitial) || chartData[0];
        const lastEntry    = chartData[chartData.length-1];
        const totalDiff    = lastEntry.weight - initialEntry.weight;
        const lost         = totalDiff < 0;
        const gained       = totalDiff > 0;
        return(
          <>
            {/* Barra cambio total */}
            <div style={{marginTop:12,padding:"11px 16px",background:"rgba(255,255,255,0.05)",borderRadius:14,display:"flex",justifyContent:"space-between",alignItems:"center"}}>
              <span style={{fontSize:12,color:T.t2,fontFamily:"'DM Sans',sans-serif"}}>Cambio total · {chartData.length} pesajes</span>
              <span style={{fontWeight:900,fontSize:18,color:down?T.g1:T.red}}>{down?"↓":"↑"} {Math.abs(diff).toFixed(1)} kg</span>
            </div>
            {/* Comparativa inicial vs último — texto grande */}
            <div style={{marginTop:14,padding:"20px 18px",background:"rgba(255,255,255,0.05)",borderRadius:18,border:`2px solid rgba(255,255,255,0.1)`,textAlign:"center"}}>
              <div style={{fontSize:11,color:T.t2,fontFamily:"'DM Sans',sans-serif",textTransform:"uppercase",letterSpacing:"0.1em",marginBottom:8}}>
                Peso inicial ({initialEntry.isInitial?"al empezar":initialEntry.date.slice(5)}) → Hoy
              </div>
              <div style={{fontSize:42,fontWeight:900,lineHeight:1,color:T.t1}}>
                {lost?"🪶":"💪🏼"}
              </div>
              <div style={{fontSize:36,fontWeight:900,color:T.wh,marginTop:6,fontFamily:"'Nunito',sans-serif",lineHeight:1}}>
                {Math.abs(totalDiff).toFixed(1)} kg
              </div>
              <div style={{fontSize:16,fontWeight:800,color:T.t2,marginTop:6,fontFamily:"'DM Sans',sans-serif"}}>
                {lost?"perdidos":gained?"ganados":totalDiff===0?"sin cambios ⚖️":""}
              </div>
              <div style={{fontSize:11,color:T.t2,marginTop:10,fontFamily:"'DM Sans',sans-serif"}}>
                {initialEntry.weight} kg → {lastEntry.weight} kg
              </div>
            </div>
            {/* Progreso hacia el objetivo */}
            {goalWeight&&(()=>{
              const toGoal      = lastEntry.weight - goalWeight;
              const totalNeeded = initialEntry.weight - goalWeight;
              const pct = totalNeeded===0 ? 100 : Math.min(100,Math.max(0,Math.round((1-(toGoal/totalNeeded))*100)));
              const reached = Math.abs(toGoal)<=0.5;
              const losing  = totalNeeded>0; // baja peso
              return(
                <div style={{marginTop:12,padding:"16px 18px",
                  background:reached?"rgba(88,204,2,0.12)":"rgba(255,107,157,0.08)",
                  borderRadius:18,border:`2px solid ${reached?T.g1:"rgba(255,107,157,0.3)"}`,
                }}>
                  <div style={{display:"flex",justifyContent:"space-between",alignItems:"center",marginBottom:10}}>
                    <div style={{fontSize:12,fontWeight:900,color:reached?T.g1:"#FF6B9D"}}>
                      {reached?"🎯 ¡Objetivo alcanzado!":"🎯 Objetivo"}
                    </div>
                    <div style={{fontSize:12,color:T.t2,fontFamily:"'DM Sans',sans-serif"}}>
                      Meta: {goalWeight} kg
                    </div>
                  </div>
                  {/* Barra de progreso */}
                  <div style={{background:"rgba(255,255,255,0.08)",borderRadius:10,height:10,overflow:"hidden",marginBottom:10}}>
                    <div style={{height:"100%",width:`${pct}%`,borderRadius:10,
                      background:reached?`linear-gradient(90deg,${T.g1},${T.g2})`:"linear-gradient(90deg,#FF6B9D,#FF4081)",
                      transition:"width 0.8s ease",
                      boxShadow:reached?`0 0 8px ${T.g1}60`:"0 0 8px #FF6B9D60",
                    }}/>
                  </div>
                  <div style={{display:"flex",justifyContent:"space-between",alignItems:"center"}}>
                    <div style={{fontSize:11,color:T.t2,fontFamily:"'DM Sans',sans-serif"}}>
                      {reached
                        ? "¡Actualiza tu objetivo!"
                        : `Te ${losing?"faltan":"sobran"} ${Math.abs(toGoal).toFixed(1)} kg`}
                    </div>
                    <div style={{fontSize:14,fontWeight:900,color:reached?T.g1:"#FF6B9D"}}>
                      {pct}%
                    </div>
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
function UserAvatar({size=52, photoB64, initials, borderColor, onClick}){
  const r = size * 0.22;

  if(photoB64) return(
    <div onClick={onClick} style={{
      width:size, height:size, borderRadius:size*0.33,
      border:`2.5px solid ${borderColor||T.au1}`,
      boxShadow:`0 4px 0 ${T.au3}`,
      overflow:"hidden", cursor:"pointer", flexShrink:0,
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
      border:`2.5px solid ${borderColor||T.au1}`,
      boxShadow:`0 4px 0 ${T.au3}`,
      background:`linear-gradient(135deg,#2A5A2A,#1A3A10)`,
      cursor:"pointer", flexShrink:0, position:"relative", overflow:"hidden",
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
function ProfileCardModal({onClose, profile, userPhoto, onSavePhoto, onSaveProfile, weights, lv, xp, streak, badges, onSubscribeNotifications}){
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
            <span style={{fontSize:12,color:T.au1,fontWeight:800}}>{lv.n}</span>
            <span style={{fontSize:12,color:T.t2}}>·</span>
            <span style={{fontSize:12,color:T.t2,fontFamily:"'DM Sans',sans-serif"}}>Nivel {lv.l}</span>
          </div>
        </div>

        {/* ── Stats ── */}
        {(()=>{
          const wDiff = initW!=="—" && lastW!=="—" ? (parseFloat(lastW)-parseFloat(initW)) : null;
          const wLabel = wDiff===null ? "—" : `${wDiff>=0?"+":""}${wDiff.toFixed(1)} kg`;
          return(
            <div style={{display:"flex",justifyContent:"space-around",padding:"12px 20px",borderTop:"1px solid rgba(255,255,255,0.08)",borderBottom:"1px solid rgba(255,255,255,0.08)"}}>
              {[{icon:"🔥",value:streak,label:"Racha"},{icon:"⚡",value:xp,label:"XP"},{icon:"⚖️",value:wLabel,label:"Progreso"}].map(({icon,value,label})=>(
                <div key={label} style={{textAlign:"center"}}>
                  <div style={{fontSize:18}}>{icon}</div>
                  <div style={{fontSize:wLabel.length>4&&label==="Progreso"?14:20,fontWeight:900,color:T.wh,lineHeight:1.1}}>{value}</div>
                  <div style={{fontSize:9,color:T.t2,textTransform:"uppercase",letterSpacing:"0.07em",fontFamily:"'DM Sans',sans-serif"}}>{label}</div>
                </div>
              ))}
            </div>
          );
        })()}

        {/* ── Datos editables ── */}
        <div style={{padding:"0 22px 24px"}}>
          <div style={{fontSize:10,color:T.au1,textTransform:"uppercase",letterSpacing:"0.1em",fontWeight:900,padding:"14px 0 4px"}}>Mis datos</div>
          <DataRow label="Nombre completo" value={profile?.name||"—"} field="name"/>
          <DataRow label="Email"           value={profile?.email||"—"} field="email"/>
          <DataRow label="Peso inicial"    value={initW} field="weight"/>
          <DataRow label="Peso objetivo"   value={profile?.goal_weight||"—"} field="goal"/>
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
  const [screen,  setScreen]  = useState("auth");
  const [tab,     setTab]     = useState("home");
  const [profile, setProfile] = useState(null);
  const [tLog,    setTLog]    = useState({diet:false,steps:false,hydration:false,sleep:false});
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
  const [streakAnim,  setStreakAnim]   = useState(false);
  const [missionsAnim,setMissionsAnim] = useState(false);
  const [floatItems,  setFloatItems]   = useState([]);
  const [levelUpAnim, setLevelUpAnim]  = useState(false);
  const [levelUpNum,  setLevelUpNum]   = useState(1);
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

  const loadP=useCallback(async(p)=>{
    setProfile(p);
    const l=lsGet(`gbh:logs:${p.id}`,[]);setLogs(l);
    const t=l.find(x=>x.date===toKey());
    if(t){setTLog({diet:t.diet,steps:t.steps,hydration:t.hydration,sleep:t.sleep});setSteps(t.sc||0);}
    setWeights(lsGet(`gbh:weights:${p.id}`,[]).sort((a,b)=>a.date>b.date?1:-1));
    setBadges(lsGet(`gbh:badges:${p.id}`,[]) );
    setWeightBannerDismissed(false);
    setScreen("main");
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

  const doAuth=async()=>{
    if(!aName.trim()||!aEmail.trim())return;setLoading(true);
    const email=aEmail.trim().toLowerCase(),name=aName.trim();
    let r=await sbReq("GET",`profiles?email=eq.${email}&select=*`);
    if(r?.length){lsSet(`gbh:p:${r[0].id}`,r[0]);lsSet("gbh:lastEmail",email);await loadP(r[0]);setLoading(false);return;}
    const lid=lsGet(`gbh:em:${email}`,null);
    if(lid){const lp=lsGet(`gbh:p:${lid}`,null);if(lp){lsSet("gbh:lastEmail",email);await loadP(lp);setLoading(false);return;}}
    const np={id:crypto.randomUUID(),name,email,xp:0,gems:0,shields:0,initial_weight:parseFloat(aWeight)||null,goal_weight:parseFloat(aGoal)||null};
    const cr=await sbReq("POST","profiles",np);const fp=cr?.[0]||np;
    lsSet(`gbh:p:${fp.id}`,fp);lsSet(`gbh:em:${email}`,fp.id);lsSet("gbh:lastEmail",email);
    // Guardar peso inicial como primer punto de la gráfica
    const initW=parseFloat(aWeight);
    if(!isNaN(initW)&&initW>20&&initW<300){
      const initDate="2000-01-01"; // fecha ficticia antigua para que quede como "origen"
      const initEntry={date:initDate,weight:initW,isInitial:true};
      lsSet(`gbh:weights:${fp.id}`,[initEntry]);
      await sbReq("POST","weight_logs",{profile_id:fp.id,log_date:initDate,weight_kg:initW});
    }
    await loadP(fp);setLoading(false);
  };

  const saveLog=useCallback(async(nl,sc)=>{
    if(!profile)return;
    const today=toKey(),l=[...logs];
    const idx=l.findIndex(x=>x.date===today);
    const e={profile_id:profile.id,date:today,...nl,sc};
    if(idx>=0)l[idx]=e;else l.push(e);
    setLogs(l);lsSet(`gbh:logs:${profile.id}`,l);
    await sbReq("POST","daily_logs",{...e,log_date:today,diet_followed:nl.diet,steps_done:nl.steps,hydration_done:nl.hydration,sleep_done:nl.sleep});
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
    if(chips.length){setFloatItems(chips);setTimeout(()=>setFloatItems([]),1600);}
    // Level-up check
    const oldLv=getLevel(prevXP),newLv=getLevel(u.xp);
    if(newLv.l>oldLv.l){setLevelUpNum(newLv.l);setLevelUpAnim(true);setTimeout(()=>setLevelUpAnim(false),3100);}
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
        showT({icon:badge.icon,title:"¡Logro desbloqueado!",sub:badge.t,reward:badge.r});return nb;
      }
    }return b;
  },[profile,logs,addXG]);

  const toggleM=useCallback(async(key)=>{
    const was=tLog[key];
    if(was) return; // Misiones solo se pueden marcar, nunca desmarcar
    const nl={...tLog,[key]:true};setTLog(nl);await saveLog(nl,steps);
    await addXG(key==="diet"?15:5,key==="diet"?5:2);
    if(key==="diet"){setStreakAnim(true);setTimeout(()=>setStreakAnim(false),2600);}
    const wasAllDone=tLog.diet&&tLog.steps&&tLog.hydration&&tLog.sleep;
    if(nl.diet&&nl.steps&&nl.hydration&&nl.sleep&&!wasAllDone){
      await addXG(20,10);
      setTimeout(()=>{setMissionsAnim(true);setTimeout(()=>setMissionsAnim(false),2800);},key==="diet"?2700:0);
    }
    await chkBadges(streak,weights,badges);
  },[tLog,steps,streak,weights,badges,saveLog,addXG,chkBadges]);

  const updSteps=useCallback(async(val)=>{
    const sc=Math.max(0,Math.min(99999,val));setSteps(sc);
    const done=sc>=10000;
    if(done!==tLog.steps){const nl={...tLog,steps:done};setTLog(nl);await saveLog(nl,sc);if(done){await addXG(5,2);showT({icon:"👟",title:"¡10.000 pasos!",sub:"Meta de pasos alcanzada ✅"});}}
    else await saveLog(tLog,sc);
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
      await addXG(10,5);
      if(nw.length>=4){const l4=nw.slice(-4).map(w=>w.weight);const ma=l4.reduce((a,b)=>a+b,0)/4;if(val<ma){setConfetti(true);setTimeout(()=>setConfetti(false),2400);showT({icon:"📉",title:"¡Tendencia bajando!",sub:"La línea va en la dirección correcta 💚"});}}
      await chkBadges(streak,nw,badges);
    }
    // Tras guardar: ir directamente a la gráfica (modo vista)
    setWeightMode("chart");
  };

  const saveUserPhoto = (b64) => {
    setUserPhoto(b64);
    lsSet("gbh:userPhoto", b64);
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
        nw.unshift({date:"2000-01-01",weight:w,isInitial:true});
        setWeights(nw);
        lsSet(`gbh:weights:${profile.id}`, nw);
        await sbReq("POST","weight_logs",{profile_id:profile.id,log_date:"2000-01-01",weight_kg:w});
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
  const buyShield=async()=>{if(gems<200){showT({icon:"💎",title:"Gemas insuficientes",sub:"Necesitas 200 💎 para un Escudo"});return;}const u={...profile,gems:gems-200,shields:(profile.shields||0)+1};setProfile(u);lsSet(`gbh:p:${u.id}`,u);await sbReq("PATCH",`profiles?id=eq.${profile.id}`,{gems:u.gems,shields:u.shields});showT({icon:"🛡️",title:"¡Escudo activado!",sub:"Tu racha está protegida por 1 día"});};

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

  const tabSt=(a)=>({flex:1,padding:"10px 0 8px",background:"none",border:"none",color:a?T.au1:T.t2,fontSize:9,fontWeight:a?900:700,cursor:"pointer",display:"flex",flexDirection:"column",alignItems:"center",gap:3,textTransform:"uppercase",letterSpacing:"0.07em",transition:"all 0.18s",fontFamily:"'Nunito',sans-serif"});
  const inp={width:"100%",background:"rgba(255,255,255,0.07)",border:`2px solid ${T.bW}`,borderRadius:16,padding:"15px 18px",color:T.cr,fontSize:16,fontWeight:700,fontFamily:"'DM Sans',sans-serif"};

  // ── AUTH ─────────────────────────────────────────────────────────────────────
  if(screen==="auth")return(
    <div style={{fontFamily:"'Nunito',sans-serif",background:`radial-gradient(ellipse at top,#1A3A10,${T.bg})`,minHeight:"100vh",maxWidth:420,margin:"0 auto",display:"flex",flexDirection:"column",alignItems:"center",justifyContent:"center",padding:28,color:T.t1}}>
      <style>{CSS}</style>
      <div onClick={tapSheep} style={{cursor:"pointer",marginBottom:4}}>
        <Mascot expr="happy" size={185}/>
      </div>
      <h1 style={{fontSize:32,fontWeight:900,color:T.wh,marginBottom:4,textAlign:"center",marginTop:8,textShadow:"0 2px 12px rgba(0,0,0,0.5)"}}>GBH Nutrición</h1>
      <p style={{fontSize:14,color:T.t2,marginBottom:32,textAlign:"center",fontFamily:"'DM Sans',sans-serif"}}>Tu compañero de hábitos saludables 🌱</p>
      <Card style={{width:"100%",maxWidth:360,marginBottom:0}}>
        <div style={{fontSize:10,color:T.au1,textTransform:"uppercase",letterSpacing:"0.1em",fontWeight:900,marginBottom:8}}>Nombre completo</div>
        <input type="text" value={aName} onChange={e=>setAName(e.target.value)} placeholder="Nombre Apellido" style={{...inp,marginBottom:16}}/>
        <div style={{fontSize:10,color:T.au1,textTransform:"uppercase",letterSpacing:"0.1em",fontWeight:900,marginBottom:8}}>Email</div>
        <input type="email" value={aEmail} onChange={e=>setAEmail(e.target.value)} placeholder="nombre@ejemplo.com" style={{...inp,marginBottom:16}}/>
        <div style={{fontSize:10,color:T.au1,textTransform:"uppercase",letterSpacing:"0.1em",fontWeight:900,marginBottom:8}}>Peso actual</div>
        <div style={{display:"flex",alignItems:"center",gap:10,marginBottom:6}}>
          <input type="number" value={aWeight} onChange={e=>setAWeight(e.target.value)} onKeyDown={e=>e.key==="Enter"&&doAuth()} placeholder="75.5" step="0.1" min="20" max="300"
            style={{...inp,flex:1}}/>
          <span style={{color:T.t2,fontSize:15,fontWeight:700,flexShrink:0}}>kg</span>
        </div>
        <div style={{fontSize:11,color:T.t2,fontFamily:"'DM Sans',sans-serif",marginBottom:16}}>
          💡 Será tu punto de partida en la gráfica de evolución
        </div>
        <div style={{fontSize:10,color:T.au1,textTransform:"uppercase",letterSpacing:"0.1em",fontWeight:900,marginBottom:8}}>Peso objetivo</div>
        <div style={{display:"flex",alignItems:"center",gap:10,marginBottom:6}}>
          <input type="number" value={aGoal} onChange={e=>setAGoal(e.target.value)} onKeyDown={e=>e.key==="Enter"&&doAuth()} placeholder="70.0" step="0.1" min="20" max="300"
            style={{...inp,flex:1}}/>
          <span style={{color:T.t2,fontSize:15,fontWeight:700,flexShrink:0}}>kg</span>
        </div>
        <div style={{fontSize:11,color:T.t2,fontFamily:"'DM Sans',sans-serif",marginBottom:20}}>
          🎯 Opcional — te ayuda a ver cuánto te queda para llegar
        </div>
        {(()=>{const dis=loading||!aName.trim()||!aEmail.trim()||!aWeight||isNaN(parseFloat(aWeight));return(
          <button onClick={doAuth} disabled={dis} style={{width:"100%",padding:"17px 20px",borderRadius:18,border:`3px solid ${T.g3}`,cursor:dis?"not-allowed":"pointer",fontSize:17,fontWeight:900,background:dis?"rgba(255,255,255,0.12)":`linear-gradient(135deg,${T.g1},${T.g2})`,color:dis?T.t2:"white",boxShadow:dis?"none":`0 6px 0 ${T.g3}`,transition:"all 0.15s",fontFamily:"'Nunito',sans-serif"}}>
            {loading?"Cargando...":"¡Empezar mi aventura! 🚀"}
          </button>
        );})()}
      </Card>
    </div>
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
    <div style={{fontFamily:"'Nunito',sans-serif",background:`radial-gradient(ellipse at top,#1A3A10,${T.bg})`,minHeight:"100vh",maxWidth:420,margin:"0 auto",color:T.t1,paddingBottom:90}}>
      <style>{CSS}</style>
      <Confetti active={confetti}/>
      <StreakOverlay active={streakAnim} streak={streak+1}/>
      <MissionsOverlay active={missionsAnim}/>
      {floatItems.length>0&&<FloatReward items={floatItems}/>}
      <LevelUpOverlay active={levelUpAnim} level={levelUpNum}/>
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
                Racha en peligro · Pesaje semanal · Dieta diaria
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
      {/* Banner offline — slideDown/slideUp automático, sin interacción */}
      {showOfflineBanner&&(
        <div style={{background:"rgba(200,45,45,0.92)",padding:"6px 18px",display:"flex",alignItems:"center",justifyContent:"center",gap:8,fontSize:12,fontWeight:800,color:"white",fontFamily:"'Nunito',sans-serif",animation:"slideDown 0.4s ease"}}>
          <span>📵</span> Sin conexión — datos guardados localmente
        </div>
      )}
      {/* Banner sincronizando — slideDown/slideUp automático, sin interacción */}
      {showSyncBanner&&pendingSync>0&&(
        <div style={{background:"rgba(180,110,0,0.92)",padding:"6px 18px",display:"flex",alignItems:"center",justifyContent:"center",gap:8,fontSize:12,fontWeight:800,color:"white",fontFamily:"'Nunito',sans-serif",animation:"slideDown 0.4s ease"}}>
          <span style={{animation:"spin 1s linear infinite",display:"inline-block"}}>🔄</span> Sincronizando {pendingSync} acción{pendingSync>1?"es":""}…
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
              onClick={()=>setShowPhotoPicker(true)}
            />
            <div>
              <div style={{fontSize:13,fontWeight:900,color:T.wh,lineHeight:1.1}}>{fn} · {lv.n}</div>
              <div style={{background:"rgba(255,255,255,0.12)",borderRadius:8,height:7,width:94,marginTop:6,overflow:"hidden",boxShadow:"inset 0 2px 4px rgba(0,0,0,0.4)"}}>
                <div style={{height:"100%",width:`${xpPct}%`,background:`linear-gradient(90deg,${T.xp},${T.g1})`,borderRadius:8,transition:"width 0.8s"}}/>
              </div>
              <div style={{fontSize:9,color:T.t2,marginTop:3,fontFamily:"'DM Sans',sans-serif"}}>{xp} XP · Lv {lv.l}</div>
            </div>
          </div>
          {/* Counters */}
          <div style={{display:"flex",gap:8}}>
            <StreakBadge value={streak} label="racha" icon="🔥" color="#FF8040" bg="rgba(255,128,64,0.12)"/>
            <StreakBadge value={gems} label="gemas" icon="💎" color={T.au1} bg="rgba(255,200,0,0.1)"/>
          </div>
        </div>
      </div>

      <div style={{padding:"4px 18px 0"}}>

        {/* ── HOME ──────────────────────────────────────────────────────────── */}
        {tab==="home"&&<>
          {/* Mascot + bubble */}
          <div style={{display:"flex",flexDirection:"column",alignItems:"center",gap:14,paddingTop:4,paddingBottom:18}}>
            <Bubble msg={getBubbleMsg(profile?.name||"",streak,expr)}/>
            <div onClick={tapSheep} style={{cursor:"pointer"}}>
              <AvatarDisplay expr={expr} size={200}/>
            </div>
          </div>

          <WeeklyXPGoal logs={logs} xp={xp}/>
          <WeekPath logs={logs} onOpenChest={()=>setShowWeekChest(true)}/>
          {allDone&&<TomorrowCard name={profile?.name||""} streak={streak}/>}

          {/* Section label */}
          <div style={{textAlign:"center",marginBottom:12}}>
            <span style={{background:T.bgWood,border:`2px solid ${T.bW}`,borderRadius:16,padding:"7px 20px",fontSize:11,fontWeight:900,color:T.au1,textTransform:"uppercase",letterSpacing:"0.08em",boxShadow:"0 4px 0 rgba(0,0,0,0.4)"}}>🩺 Misiones Diarias</span>
          </div>

          <BigBtn icon="🍽️" label="Registrar Dieta Diaria" done={tLog.diet} onClick={()=>toggleM("diet")}/>

          <MRow num="2" icon="🌙" label="Dormir al menos 7 horas" done={tLog.sleep} onToggle={()=>toggleM("sleep")} xpR={5}/>
          <StepsWidget done={tLog.steps} stepCount={steps} onToggle={()=>toggleM("steps")} onUpdateSteps={updSteps}/>
          <HydrationWidget done={tLog.hydration} onToggle={()=>toggleM("hydration")}/>

          {/* ── Quiz + Ruleta ── media tarjeta cada una ── */}
          <div style={{display:"flex",gap:8,marginBottom:10}}>
            <div onClick={quizDone?undefined:()=>setShowQuiz(true)} style={{flex:1,background:quizDone?"rgba(88,204,2,0.14)":T.bgWood,border:`2px solid ${quizDone?T.g1:T.bW}`,borderRadius:18,padding:"12px 10px",display:"flex",flexDirection:"column",alignItems:"center",justifyContent:"center",gap:5,cursor:quizDone?"default":"pointer",boxShadow:quizDone?`0 4px 0 ${T.g3}`:"0 4px 0 rgba(0,0,0,0.4)",minHeight:76,textAlign:"center"}}>
              <div style={{fontSize:26,lineHeight:1}}>{quizDone?"✅":"❓"}</div>
              <div style={{fontSize:13,fontWeight:900,color:quizDone?T.g2:T.t1}}>{quizDone?"Quiz ✓":"Quiz"}</div>
              <div style={{fontSize:10,color:T.au1,fontWeight:700}}>{quizDone?"+20 XP +8 💎":"Gana XP y 💎"}</div>
            </div>
            <div onClick={ruletaDone?undefined:()=>setShowRuleta(true)} style={{flex:1,background:ruletaDone?"rgba(88,204,2,0.14)":T.bgWood,border:`2px solid ${ruletaDone?T.g1:T.bW}`,borderRadius:18,padding:"12px 10px",display:"flex",flexDirection:"column",alignItems:"center",justifyContent:"center",gap:5,cursor:ruletaDone?"default":"pointer",boxShadow:ruletaDone?`0 4px 0 ${T.g3}`:"0 4px 0 rgba(0,0,0,0.4)",minHeight:76,textAlign:"center"}}>
              <div style={{fontSize:26,lineHeight:1,animation:ruletaDone?"none":"pulse 2s ease-in-out infinite"}}>{ruletaDone?"✅":"🎰"}</div>
              <div style={{fontSize:13,fontWeight:900,color:ruletaDone?T.g2:T.t1}}>{ruletaDone?"Ruleta ✓":"Ruleta"}</div>
              <div style={{fontSize:10,color:T.au1,fontWeight:700}}>{ruletaDone?"Hasta mañana":"Gira gratis"}</div>
            </div>
          </div>

          {/* Shield shop */}
          <Card style={{marginTop:4}}>
            <div style={{display:"flex",alignItems:"center",justifyContent:"space-between"}}>
              <div>
                <div style={{fontSize:15,fontWeight:900}}>🛡️ Escudo de Racha</div>
                <div style={{fontSize:12,color:T.t2,marginTop:2,fontFamily:"'DM Sans',sans-serif"}}>Protege tu racha 1 día · {profile?.shields||0} disponibles</div>
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
                <div style={{fontSize:19,fontWeight:900,color:T.au1,marginBottom:10}}>La báscula está descansando</div>
                <div style={{fontSize:14,color:T.t2,lineHeight:1.75,fontFamily:"'DM Sans',sans-serif"}}>
                  Pesarse cada día genera ansiedad innecesaria.<br/>
                  <span style={{color:T.au1,fontWeight:700}}>Vuelve el fin de semana</span> para ver<br/>tu evolución real sin distorsión diaria.
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
                {todayW?"Editar pesaje de hoy":"¿Cuánto pesas hoy?"}
              </div>
              <div style={{fontSize:13,color:T.t2,marginBottom:28,textAlign:"center",fontFamily:"'DM Sans',sans-serif"}}>
                💡 En ayunas, antes de desayunar
              </div>
              {/* Input grande centrado */}
              <div style={{display:"flex",alignItems:"center",gap:12,marginBottom:10,width:"100%",maxWidth:280}}>
                <input
                  type="number" value={wInput}
                  onChange={e=>setWInput(e.target.value)}
                  onKeyDown={e=>e.key==="Enter"&&saveW(!!todayW)}
                  placeholder={todayW?String(todayW.weight):"75.5"}
                  step="0.1" autoFocus
                  style={{flex:1,background:"rgba(255,255,255,0.09)",border:`3px solid ${T.g1}`,borderRadius:20,padding:"18px 22px",color:T.cr,fontSize:32,fontWeight:900,fontFamily:"'DM Sans',sans-serif",textAlign:"center",boxShadow:`0 0 0 4px ${T.g1}22`}}
                />
                <span style={{fontSize:20,fontWeight:800,color:T.t2}}>kg</span>
              </div>
              {todayW&&<div style={{fontSize:11,color:T.t2,marginBottom:20,fontFamily:"'DM Sans',sans-serif"}}>✏️ Edición — no suma gemas ni XP</div>}
              {/* Botón guardar */}
              <button
                onClick={()=>saveW(!!todayW)}
                disabled={!wInput||isNaN(parseFloat(wInput))}
                style={{width:"100%",maxWidth:280,padding:"18px 0",borderRadius:20,border:`3px solid ${T.g3}`,cursor:"pointer",fontSize:18,fontWeight:900,background:!wInput||isNaN(parseFloat(wInput))?"rgba(255,255,255,0.1)":`linear-gradient(135deg,${T.g1},${T.g2})`,color:!wInput||isNaN(parseFloat(wInput))?T.t2:"white",boxShadow:!wInput||isNaN(parseFloat(wInput))?"none":`0 6px 0 ${T.g3}`,fontFamily:"'Nunito',sans-serif",marginBottom:14}}
              >
                {todayW?"💾 Guardar cambios":"✅ Guardar peso"}
              </button>
              {/* Cancelar si hay datos previos */}
              {(todayW||chartData.length>0)&&(
                <button onClick={()=>setWeightMode("chart")} style={{background:"none",border:"none",color:T.t2,fontSize:13,fontWeight:700,cursor:"pointer",padding:"8px 20px",fontFamily:"'Nunito',sans-serif"}}>
                  ← Ver gráfica
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
                  <span style={{fontSize:26}}>⚖️</span> Registrar peso de hoy
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
            {key:"streak", icon:"🔥", title:"Racha", subtitle:"Días consecutivos",  list:byStreak,  statFn:p=>`${p.streak||0}🔥`,  statLabel:"días"},
            {key:"xp",     icon:"⚡", title:"XP",    subtitle:"Experiencia total",   list:byXP,      statFn:p=>`${p.xp||0} XP`,     statLabel:"XP"},
            {key:"weight", icon:"⚖️", title:"Peso",  subtitle:"Progreso desde inicio",list:byWeight, statFn:p=>p.weightDiff!==null?`${p.weightDiff>=0?"+":""}${p.weightDiff}kg`:"—", statLabel:"kg"},
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
                <div style={{fontSize:20,fontWeight:900,color:T.wh}}>Ranking</div>
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
                  <div style={{fontFamily:"'DM Sans',sans-serif"}}>Cargando…</div>
                </div>
              ):ranking.length===0?(
                <div style={{textAlign:"center",padding:"32px 24px",background:T.bgWood,borderRadius:22,border:`2px solid ${T.bW}`}}>
                  <div style={{display:"flex",justifyContent:"center",marginBottom:12}}><AvatarDisplay expr="idle" size={90}/></div>
                  <div style={{fontSize:15,fontWeight:900,color:T.t1,marginBottom:6}}>Sin datos aún</div>
                  <div style={{fontSize:13,color:T.t2,fontFamily:"'DM Sans',sans-serif"}}>El ranking se llenará cuando más pacientes usen la app</div>
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
                        {/* Avatar */}
                        <div style={{width:38,height:38,borderRadius:12,background:isMe?`linear-gradient(135deg,${T.au1},${T.au2})`:"linear-gradient(135deg,#2A5A2A,#1A3A10)",display:"flex",alignItems:"center",justifyContent:"center",flexShrink:0,border:`2px solid ${isMe?T.au3:T.bW}`,boxShadow:"0 3px 0 rgba(0,0,0,0.4)"}}>
                          <span style={{fontSize:17,fontWeight:900,color:isMe?"#1A1000":"rgba(255,255,255,0.85)",fontFamily:"'Nunito',sans-serif"}}>{(p.name||"?")[0].toUpperCase()}</span>
                        </div>
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
                  🔄 Actualizar
                </button>
              </div>
            </div>
          );
        })()}

        {tab==="achievements"&&<>
          <Card style={{display:"flex",justifyContent:"space-around",alignItems:"center",padding:"16px"}}>
            <div style={{textAlign:"center"}}><div style={{fontSize:26,fontWeight:900,color:T.au1}}>{badges.length}/{BADGES.length}</div><div style={{color:T.t2,fontSize:11,fontFamily:"'DM Sans',sans-serif"}}>logros</div></div>
            <div style={{textAlign:"center"}}><div style={{fontSize:26,fontWeight:900,color:T.xp}}>{xp}</div><div style={{color:T.t2,fontSize:11,fontFamily:"'DM Sans',sans-serif"}}>XP total</div></div>
            <div style={{textAlign:"center"}}><div style={{fontSize:26,fontWeight:900,color:T.au1}}>{gems}</div><div style={{color:T.t2,fontSize:11,fontFamily:"'DM Sans',sans-serif"}}>💎 gemas</div></div>
          </Card>
          {badges.length===0&&(
            <div style={{textAlign:"center",padding:"20px 0 10px"}}>
              <div style={{display:"flex",justifyContent:"center",marginBottom:10}}><Mascot expr="idle" size={110}/></div>
              <div style={{fontSize:16,fontWeight:900,color:T.t1,marginBottom:6}}>¡Desbloquea tu primer logro!</div>
              <div style={{fontSize:13,color:T.t2,fontFamily:"'DM Sans',sans-serif",lineHeight:1.6}}>Registra la dieta hoy para<br/>conseguir tu primera medalla 🏅</div>
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
        {[{id:"home",icon:"🏠",l:"Inicio"},{id:"weight",icon:"⚖️",l:"Peso"},{id:"ranking",icon:"👑",l:"Ranking"},{id:"achievements",icon:"🏅",l:"Logros"}].map(({id,icon,l})=>(
          <button key={id} onClick={()=>setTab(id)} style={tabSt(tab===id)}>
            <span style={{fontSize:26,filter:tab===id?"none":"grayscale(0.6)",transition:"all 0.2s"}}>{icon}</span>
            <span>{l}</span>
            {tab===id&&<div style={{width:24,height:4,background:T.au1,borderRadius:4,boxShadow:`0 0 10px ${T.au1}`,marginTop:1}}/>}
          </button>
        ))}
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
    if(this.state.err) return(
      <div style={{minHeight:"100vh",background:"#0A1A0F",display:"flex",
        flexDirection:"column",alignItems:"center",justifyContent:"center",
        padding:24,color:"white",fontFamily:"monospace"}}>
        <div style={{fontSize:48,marginBottom:12}}>💥</div>
        <div style={{fontSize:16,fontWeight:700,color:"#FF4B4B",marginBottom:12}}>Error en la app</div>
        <div style={{fontSize:12,color:"rgba(255,255,255,0.75)",background:"rgba(255,0,0,0.12)",
          border:"1px solid rgba(255,0,0,0.3)",borderRadius:8,padding:16,maxWidth:360,
          wordBreak:"break-all",whiteSpace:"pre-wrap",textAlign:"left",lineHeight:1.6}}>
          {this.state.err?.message||String(this.state.err)}
        </div>
        <button onClick={()=>this.setState({err:null})}
          style={{marginTop:20,padding:"12px 28px",background:"#58CC02",border:"none",
            borderRadius:14,color:"white",fontWeight:900,cursor:"pointer",fontSize:15}}>
          Reintentar
        </button>
      </div>
    );
    return this.props.children;
  }
}
export default function App(){
  return <ErrorBoundary><GBHApp/></ErrorBoundary>;
}
