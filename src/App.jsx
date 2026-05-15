import { useState, useEffect, useCallback, useMemo, useRef } from "react";
import { ComposedChart, Line, XAxis, YAxis, Tooltip, ResponsiveContainer } from "recharts";

// ─── Supabase ────────────────────────────────────────────────────────────────
const SB  = "https://kszytoufvqogcitzbzqs.supabase.co";
const KEY = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Imtzenl0b3VmdnFvZ2NpdHpienFzIiwicm9sZSI6ImFub24iLCJpYXQiOjE3Nzg1OTQzOTgsImV4cCI6MjA5NDE3MDM5OH0.OcOUrgbyAL6aPBSW_hSNapmwSYMV5mNjLrJCmRghg-c";

// ─── Mascot image path (upload avatar.jpg to /public in GitHub) ───────────────
const AVATAR = "/avatar.jpg";

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

const sbReq=async(method,path,body=null)=>{
  try{
    const r=await fetch(`${SB}/rest/v1/${path}`,{method,headers:{"apikey":KEY,"Authorization":`Bearer ${KEY}`,"Content-Type":"application/json","Prefer":method==="POST"?"return=representation, resolution=merge-duplicates":""},body:body?JSON.stringify(body):null});
    if(!r.ok)return null;return method==="DELETE"?true:r.json();
  }catch{return null;}
};
const lsGet=(k,f)=>{try{const v=localStorage.getItem(k);return v?JSON.parse(v):f;}catch{return f;}};
const lsSet=(k,v)=>{try{localStorage.setItem(k,JSON.stringify(v));}catch{}};

// ─── Mascot avatar with expression overlays ───────────────────────────────────
// expr: idle | happy | excited | celebrating | sad | sleeping | legend
function Mascot({expr="idle",size=200}){
  const [imgOk,setImgOk]=useState(false);
  // Expression overlay emojis / effects
  const overlays={
    idle:       null,
    happy:      {top:"4%",left:"68%",fontSize:size*0.18,content:"😊"},
    excited:    {top:"2%",left:"66%",fontSize:size*0.22,content:"🔥"},
    celebrating:{top:"0%",left:"64%",fontSize:size*0.24,content:"🎉"},
    sad:        {top:"4%",left:"68%",fontSize:size*0.18,content:"😔"},
    sleeping:   {top:"4%",left:"66%",fontSize:size*0.2,content:"😴"},
    legend:     {top:"-2%",left:"60%",fontSize:size*0.26,content:"👑"},
  };
  const aura={
    idle:false, happy:false, excited:true, celebrating:true, sad:false, sleeping:false, legend:true,
  };
  const ov=overlays[expr];
  const glow=aura[expr];

  // SVG fallback (if no image)
  const SVGFallback=()=>(
    <svg viewBox="0 0 120 130" style={{width:"100%",height:"100%"}}>
      <circle cx="38" cy="68" r="17" fill={T.g1}/>
      <circle cx="82" cy="68" r="17" fill={T.g1}/>
      <circle cx="50" cy="54" r="19" fill={T.g2}/>
      <circle cx="70" cy="54" r="19" fill={T.g2}/>
      <circle cx="60" cy="48" r="20" fill={T.g2}/>
      <ellipse cx="60" cy="78" rx="24" ry="16" fill={T.g3}/>
      <ellipse cx="60" cy="72" rx="17" ry="15" fill="#1A3D28"/>
      <circle cx="53" cy="67" r="4.5" fill="#0D2218"/>
      <circle cx="67" cy="67" r="4.5" fill="#0D2218"/>
      <circle cx="54.5" cy="65.8" r="1.8" fill="white"/>
      <circle cx="68.5" cy="65.8" r="1.8" fill="white"/>
      <ellipse cx="60" cy="75" rx="5" ry="3.5" fill="#0D2218"/>
      <path d="M54 79 Q60 84 66 79" stroke={T.au1} strokeWidth="1.8" fill="none" strokeLinecap="round"/>
      <path d="M47 50 C43 40 40 32 44 26" stroke={T.au1} strokeWidth="3.5" fill="none" strokeLinecap="round"/>
      <path d="M73 50 C77 40 80 32 76 26" stroke={T.au1} strokeWidth="3.5" fill="none" strokeLinecap="round"/>
      <rect x="43" y="90" width="10" height="22" rx="5" fill="#1A3D28"/>
      <rect x="67" y="90" width="10" height="22" rx="5" fill="#1A3D28"/>
    </svg>
  );

  return(
    <div style={{position:"relative",width:size,height:size,flexShrink:0}}>
      {/* Glow ring */}
      {glow&&<div style={{position:"absolute",inset:-size*0.12,borderRadius:"50%",background:`radial-gradient(circle,${expr==="legend"?"rgba(255,200,0,0.35)":"rgba(88,204,2,0.28)"} 0%,transparent 68%)`,animation:"aura 2.5s ease-in-out infinite",pointerEvents:"none"}}/>}

      {/* Main image or SVG */}
      <div style={{width:"100%",height:"100%",borderRadius:"50%",overflow:"hidden",position:"relative",
        filter:glow?`drop-shadow(0 0 ${size*0.06}px ${expr==="legend"?T.au1:T.g1})`:"none",
        animation:["excited","celebrating","legend"].includes(expr)?"bounce 0.7s ease-in-out infinite":["idle","happy"].includes(expr)?"float 3.5s ease-in-out infinite":"none",
      }}>
        {imgOk?(
          <img src={AVATAR} alt="GBH Mascota" onError={()=>setImgOk(false)} style={{width:"100%",height:"100%",objectFit:"cover",objectPosition:"center top"}}/>
        ):<SVGFallback/>}

        {/* Expression tint overlays */}
        {expr==="sad"&&<div style={{position:"absolute",inset:0,background:"rgba(0,80,160,0.18)",borderRadius:"50%"}}/>}
        {expr==="sleeping"&&<div style={{position:"absolute",inset:0,background:"rgba(40,0,80,0.2)",borderRadius:"50%"}}/>}
        {expr==="celebrating"&&<div style={{position:"absolute",inset:0,background:"rgba(255,200,0,0.12)",borderRadius:"50%"}}/>}
      </div>

      {/* Expression emoji badge */}
      {ov&&(
        <div style={{position:"absolute",top:ov.top,right:"-8%",fontSize:ov.fontSize,filter:"drop-shadow(0 2px 4px rgba(0,0,0,0.5))",animation:["celebrating","excited","legend"].includes(expr)?"wobble 0.5s ease-in-out infinite":"none",pointerEvents:"none",lineHeight:1}}>
          {ov.content}
        </div>
      )}

      {/* ZZZ for sleeping */}
      {expr==="sleeping"&&(
        <>
          <div style={{position:"absolute",top:"5%",right:"0%",fontSize:size*0.14,color:T.au1,fontWeight:900,animation:"zFloat 1.5s ease-in-out infinite",fontFamily:"'Nunito',sans-serif"}}>z</div>
          <div style={{position:"absolute",top:"-5%",right:"-8%",fontSize:size*0.18,color:T.au1,fontWeight:900,animation:"zFloat 1.5s 0.4s ease-in-out infinite",fontFamily:"'Nunito',sans-serif"}}>Z</div>
          <div style={{position:"absolute",top:"-15%",right:"-4%",fontSize:size*0.22,color:T.au1,fontWeight:900,animation:"zFloat 1.5s 0.8s ease-in-out infinite",fontFamily:"'Nunito',sans-serif"}}>Z</div>
        </>
      )}

      {/* Sparkles for legend */}
      {expr==="legend"&&["✨","⭐","✨"].map((s,i)=>(
        <div key={i} style={{position:"absolute",fontSize:size*0.16,top:`${[-10,80,100][i]}%`,left:`${[80,-10,85][i]}%`,animation:`sparkle${i} 1.2s ${i*0.4}s ease-in-out infinite`,pointerEvents:"none"}}>{s}</div>
      ))}
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
function WeekPath({logs}){
  const today=new Date(),dow=today.getDay();
  const days=Array.from({length:7},(_,i)=>{
    const d=new Date();d.setDate(today.getDate()-(dow===0?6:dow-1)+i);
    const key=toKey(d),isToday=key===toKey(),done=!!logs.find(l=>l.date===key&&l.diet);
    return{label:WLABELS[i],key,isToday,done,isPast:d<today&&!isToday};
  });
  const completedCount=days.filter(d=>d.done).length;

  return(
    <div style={{background:T.bgWood,borderRadius:24,padding:"16px 18px",border:`2px solid ${T.bW}`,boxShadow:"0 6px 0 rgba(0,0,0,0.4)",marginBottom:14}}>
      <div style={{display:"flex",justifyContent:"space-between",alignItems:"center",marginBottom:14}}>
        <div style={{fontSize:11,color:T.au1,textTransform:"uppercase",letterSpacing:"0.1em",fontWeight:900}}>📅 Progreso semanal</div>
        <div style={{fontSize:12,fontWeight:800,color:T.t2}}>{completedCount}/7 días</div>
      </div>
      <div style={{display:"flex",alignItems:"center"}}>
        {days.map((day,i)=>(
          <div key={day.key} style={{display:"flex",alignItems:"center",flex:1}}>
            <div style={{display:"flex",flexDirection:"column",alignItems:"center",gap:6,flex:"0 0 auto",zIndex:2}}>
              <div style={{
                width:day.isToday?44:38,height:day.isToday?44:38,borderRadius:"50%",
                background:day.done?`linear-gradient(135deg,${T.g1},${T.g2})`:day.isToday?`linear-gradient(135deg,${T.au1},${T.au2})`:"rgba(255,255,255,0.07)",
                border:`3px solid ${day.done?T.g3:day.isToday?T.au3:"rgba(255,255,255,0.12)"}`,
                display:"flex",alignItems:"center",justifyContent:"center",
                boxShadow:day.done?`0 4px 0 ${T.g3}`:day.isToday?`0 4px 0 ${T.au3}`:"0 3px 0 rgba(0,0,0,0.4)",
                animation:day.isToday&&!day.done?"pulse 2s ease-in-out infinite":"none",
                transition:"all 0.3s",
              }}>
                {day.done?<span style={{fontSize:18,color:"white",fontWeight:900}}>✓</span>
                :<span style={{fontSize:11,fontWeight:900,color:day.isToday?"#1A1000":T.t3}}>{day.label}</span>}
              </div>
              {day.isToday&&<div style={{width:6,height:6,borderRadius:"50%",background:T.au1,boxShadow:`0 0 8px ${T.au1}`}}/>}
            </div>
            {i<days.length-1&&(
              <div style={{flex:1,height:6,margin:"0 3px",marginBottom:day.isToday?14:6,background:day.done&&days[i+1]?.done?`linear-gradient(90deg,${T.g1},${T.g2})`:"rgba(255,255,255,0.08)",borderRadius:4,boxShadow:day.done&&days[i+1]?.done?`0 2px 0 ${T.g3}`:"none"}}/>
            )}
          </div>
        ))}
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
        {[1000,2500,5000,10000].map(v=>(
          <button key={v} onClick={()=>onUpdateSteps(stepCount+v)} style={{flex:1,background:"rgba(255,255,255,0.08)",border:`1.5px solid rgba(255,255,255,0.12)`,borderRadius:12,padding:"10px 0",color:T.t1,fontWeight:800,fontSize:11,cursor:"pointer",boxShadow:"0 3px 0 rgba(0,0,0,0.4)",fontFamily:"'Nunito',sans-serif"}}>+{v>=1000?v/1000+"k":v}</button>
        ))}
        <button onClick={()=>onUpdateSteps(0)} style={{background:"rgba(255,75,75,0.1)",border:`1.5px solid rgba(255,75,75,0.25)`,borderRadius:12,padding:"10px 12px",color:T.red,fontWeight:800,fontSize:13,cursor:"pointer"}}>↺</button>
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

// ═══════════════════════════════════════════════════════════════════════════════
// MAIN APP
// ═══════════════════════════════════════════════════════════════════════════════
export default function GBHApp(){
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
  const [toast,   setToast]   = useState(null);
  const [confetti,setConfetti]= useState(false);
  const [loading, setLoading] = useState(false);
  const [taps,    setTaps]    = useState(0);
  const [aName,   setAName]   = useState("");
  const [aEmail,  setAEmail]  = useState("");
  const [streakAnim,  setStreakAnim]   = useState(false);
  const [missionsAnim,setMissionsAnim] = useState(false);
  const tapRef=useRef(null);

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
    setScreen("main");
  },[]);

  const doAuth=async()=>{
    if(!aName.trim()||!aEmail.trim())return;setLoading(true);
    const email=aEmail.trim().toLowerCase(),name=aName.trim();
    let r=await sbReq("GET",`profiles?email=eq.${email}&select=*`);
    if(r?.length){lsSet(`gbh:p:${r[0].id}`,r[0]);lsSet("gbh:lastEmail",email);await loadP(r[0]);setLoading(false);return;}
    const lid=lsGet(`gbh:em:${email}`,null);
    if(lid){const lp=lsGet(`gbh:p:${lid}`,null);if(lp){lsSet("gbh:lastEmail",email);await loadP(lp);setLoading(false);return;}}
    const np={id:crypto.randomUUID(),name,email,xp:0,gems:0,shields:0};
    const cr=await sbReq("POST","profiles",np);const fp=cr?.[0]||np;
    lsSet(`gbh:p:${fp.id}`,fp);lsSet(`gbh:em:${email}`,fp.id);lsSet("gbh:lastEmail",email);
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
  },[profile,logs]);

  const addXG=useCallback(async(ax,ag)=>{
    if(!profile)return;
    const u={...profile,xp:(profile.xp||0)+ax,gems:(profile.gems||0)+ag};
    setProfile(u);lsSet(`gbh:p:${u.id}`,u);
    await sbReq("PATCH",`profiles?id=eq.${profile.id}`,{xp:u.xp,gems:u.gems});
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

  const saveW=async()=>{
    const val=parseFloat(wInput);if(!isWeekend()||isNaN(val)||val<20||val>300)return;
    const today=toKey(),nw=weights.filter(w=>w.date!==today);
    nw.push({date:today,weight:val});nw.sort((a,b)=>a.date>b.date?1:-1);
    setWeights(nw);lsSet(`gbh:weights:${profile.id}`,nw);setWInput("");
    await sbReq("POST","weight_logs",{profile_id:profile.id,log_date:today,weight_kg:val});
    await addXG(10,5);
    if(nw.length>=4){const l4=nw.slice(-4).map(w=>w.weight);const ma=l4.reduce((a,b)=>a+b,0)/4;if(val<ma){setConfetti(true);setTimeout(()=>setConfetti(false),2400);showT({icon:"📉",title:"¡Tendencia bajando!",sub:"La línea va en la dirección correcta 💚"});}}
    await chkBadges(streak,nw,badges);
  };

  const tapSheep=()=>{const n=taps+1;setTaps(n);if(tapRef.current)clearTimeout(tapRef.current);tapRef.current=setTimeout(()=>setTaps(0),2500);if(n>=5){setScreen("admin");loadAdmin();setTaps(0);}};
  const loadAdmin=async()=>{const d=await sbReq("GET","admin_overview?select=*")||[];if(d.length){setAllP(d);return;}setAllP(Object.keys(localStorage).filter(k=>k.startsWith("gbh:p:")).map(k=>lsGet(k,{})).filter(p=>p.id));};
  const buyShield=async()=>{if(gems<200){showT({icon:"💎",title:"Gemas insuficientes",sub:"Necesitas 200 💎 para un Escudo"});return;}const u={...profile,gems:gems-200,shields:(profile.shields||0)+1};setProfile(u);lsSet(`gbh:p:${u.id}`,u);await sbReq("PATCH",`profiles?id=eq.${profile.id}`,{gems:u.gems,shields:u.shields});showT({icon:"🛡️",title:"¡Escudo activado!",sub:"Tu racha está protegida por 1 día"});};

  const CSS=`
    @import url('https://fonts.googleapis.com/css2?family=Nunito:wght@600;700;800;900&family=DM+Sans:wght@400;500;700&display=swap');
    *{box-sizing:border-box;margin:0;padding:0}body{background:${T.bg};font-family:'Nunito',sans-serif}
    @keyframes aura{0%,100%{opacity:0.5;transform:scale(1)}50%{opacity:1;transform:scale(1.08)}}
    @keyframes float{0%,100%{transform:translateY(0)}50%{transform:translateY(-9px)}}
    @keyframes bounce{0%,100%{transform:translateY(0)}40%{transform:translateY(-16px)}65%{transform:translateY(-6px)}}
    @keyframes popIn{0%{transform:scale(0.65);opacity:0}100%{transform:scale(1);opacity:1}}
    @keyframes slideUp{from{transform:translateY(80px);opacity:0}to{transform:translateY(0);opacity:1}}
    @keyframes pulse{0%,100%{box-shadow:0 0 0 0 rgba(255,200,0,0.55)}50%{box-shadow:0 0 0 10px rgba(255,200,0,0)}}
    @keyframes confettiFall{to{transform:translateY(110vh) rotate(800deg);opacity:0}}
    @keyframes glow{0%,100%{box-shadow:0 6px 0 ${T.g3},0 0 18px rgba(88,204,2,0.35)}50%{box-shadow:0 6px 0 ${T.g3},0 0 38px rgba(88,204,2,0.8)}}
    @keyframes wobble{0%,100%{transform:rotate(-8deg)}50%{transform:rotate(8deg)}}
    @keyframes fadeInOut{0%{opacity:0}10%{opacity:1}75%{opacity:1}100%{opacity:0}}
    @keyframes scaleIn{0%{transform:scale(0.5);opacity:0}100%{transform:scale(1);opacity:1}}
    @keyframes zFloat{0%{transform:translateY(0);opacity:1}100%{transform:translateY(-24px);opacity:0}}
    @keyframes sparkle0{0%,100%{opacity:1;transform:scale(1) rotate(0deg)}50%{opacity:0.5;transform:scale(1.3) rotate(20deg)}}
    @keyframes sparkle1{0%,100%{opacity:0.7;transform:scale(0.9)}50%{opacity:1;transform:scale(1.2)}}
    @keyframes sparkle2{0%,100%{opacity:1;transform:scale(1.1) rotate(-15deg)}50%{opacity:0.6;transform:scale(0.8) rotate(15deg)}}
    input::placeholder{color:rgba(255,255,255,0.22)}input:focus{outline:none!important;border-color:rgba(88,204,2,0.75)!important}
    ::-webkit-scrollbar{width:0}button:active{transform:scale(0.94)!important;transition:transform 0.08s!important}
  `;

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
        <input type="email" value={aEmail} onChange={e=>setAEmail(e.target.value)} placeholder="nombre@ejemplo.com" onKeyDown={e=>e.key==="Enter"&&doAuth()} style={{...inp,marginBottom:22}}/>
        <button onClick={doAuth} disabled={loading||!aName.trim()||!aEmail.trim()} style={{width:"100%",padding:"17px 20px",borderRadius:18,border:`3px solid ${T.g3}`,cursor:"pointer",fontSize:17,fontWeight:900,background:loading||!aName.trim()||!aEmail.trim()?"rgba(255,255,255,0.12)":`linear-gradient(135deg,${T.g1},${T.g2})`,color:loading||!aName.trim()||!aEmail.trim()?T.t2:"white",boxShadow:loading||!aName.trim()||!aEmail.trim()?"none":`0 6px 0 ${T.g3}`,transition:"all 0.15s",fontFamily:"'Nunito',sans-serif"}}>
          {loading?"Cargando...":"¡Empezar mi aventura! 🚀"}
        </button>
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
      <div style={{padding:"14px 18px 10px",background:"linear-gradient(180deg,rgba(26,58,16,0.9),transparent)"}}>
        <div style={{display:"flex",alignItems:"center",justifyContent:"space-between",gap:10}}>
          {/* Avatar + level */}
          <div style={{display:"flex",alignItems:"center",gap:10}}>
            <div onClick={tapSheep} style={{width:48,height:48,borderRadius:16,overflow:"hidden",cursor:"pointer",flexShrink:0,border:`2.5px solid ${T.au1}`,boxShadow:`0 4px 0 ${T.au3}`,background:T.bgCard}}>
              <Mascot expr={expr} size={48} />
            </div>
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
              <Mascot expr={expr} size={200}/>
            </div>
          </div>

          <WeekPath logs={logs}/>

          {/* Section label */}
          <div style={{textAlign:"center",marginBottom:12}}>
            <span style={{background:T.bgWood,border:`2px solid ${T.bW}`,borderRadius:16,padding:"7px 20px",fontSize:11,fontWeight:900,color:T.au1,textTransform:"uppercase",letterSpacing:"0.08em",boxShadow:"0 4px 0 rgba(0,0,0,0.4)"}}>🩺 Misiones Diarias</span>
          </div>

          <BigBtn icon="🍽️" label="Registrar Dieta Diaria" done={tLog.diet} onClick={()=>toggleM("diet")}/>

          <MRow num="2" icon="🌙" label="Dormir al menos 7 horas" done={tLog.sleep} onToggle={()=>toggleM("sleep")} xpR={5}/>
          <StepsWidget done={tLog.steps} stepCount={steps} onToggle={()=>toggleM("steps")} onUpdateSteps={updSteps}/>
          <MRow num="4" icon="💧" label="Hidratación completa" done={tLog.hydration} onToggle={()=>toggleM("hydration")} xpR={5}/>

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
        {tab==="weight"&&<>
          {!isWeekend()?(
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
          ):(
            <Card>
              <div style={{fontSize:10,color:T.au1,textTransform:"uppercase",letterSpacing:"0.1em",fontWeight:900,marginBottom:12}}>Registrar peso — ¡Fin de semana! ✅</div>
              <div style={{display:"flex",gap:10,alignItems:"center"}}>
                <input type="number" value={wInput} onChange={e=>setWInput(e.target.value)} onKeyDown={e=>e.key==="Enter"&&saveW()} placeholder="75.5" step="0.1"
                  style={{flex:1,background:"rgba(255,255,255,0.07)",border:`3px solid ${T.g1}`,borderRadius:16,padding:"15px 18px",color:T.cr,fontSize:20,fontWeight:800,fontFamily:"'DM Sans',sans-serif"}}/>
                <span style={{color:T.t2,fontSize:15,fontWeight:700}}>kg</span>
                <button onClick={saveW} style={{background:`linear-gradient(135deg,${T.g1},${T.g2})`,border:`3px solid ${T.g3}`,borderRadius:16,padding:"15px 22px",color:"white",fontWeight:900,cursor:"pointer",fontSize:15,boxShadow:`0 5px 0 ${T.g3}`,fontFamily:"'Nunito',sans-serif"}}>Guardar</button>
              </div>
              <div style={{fontSize:11,color:T.t2,marginTop:10,fontFamily:"'DM Sans',sans-serif"}}>💡 En ayunas, antes de desayunar — mayor precisión</div>
            </Card>
          )}

          {chartData.length>0&&(
            <Card>
              <div style={{fontSize:10,color:T.au1,textTransform:"uppercase",letterSpacing:"0.1em",fontWeight:900,marginBottom:10}}>Evolución de peso</div>
              <div style={{display:"flex",gap:18,marginBottom:14}}>
                <div style={{fontSize:11,color:T.t2,fontFamily:"'DM Sans',sans-serif",display:"flex",alignItems:"center",gap:6}}><div style={{width:14,height:3,background:T.au1,borderRadius:3}}/> Peso real</div>
                <div style={{fontSize:11,color:T.t2,fontFamily:"'DM Sans',sans-serif",display:"flex",alignItems:"center",gap:6}}><div style={{width:14,height:2,background:T.xp,borderRadius:3,borderTop:"2px dashed"}}/> Tendencia 4s</div>
              </div>
              <ResponsiveContainer width="100%" height={185}>
                <ComposedChart data={chartData} margin={{top:5,right:5,left:-22,bottom:0}}>
                  <XAxis dataKey="date" tickFormatter={d=>d.slice(5)} tick={{fontSize:9,fill:T.t2}} tickLine={false} axisLine={false}/>
                  <YAxis domain={["auto","auto"]} tick={{fontSize:9,fill:T.t2}} tickLine={false} axisLine={false}/>
                  <Tooltip content={<CTip/>}/>
                  <Line type="monotone" dataKey="weight" stroke={T.au1} strokeWidth={2.5} dot={{r:4.5,fill:T.au1,strokeWidth:0}} activeDot={{r:7,fill:T.au2}}/>
                  <Line type="monotone" dataKey="ma" stroke={T.xp} strokeWidth={2} strokeDasharray="5 3" dot={false}/>
                </ComposedChart>
              </ResponsiveContainer>
              {chartData.length>=2&&(()=>{const f=chartData[0].weight,l=chartData[chartData.length-1].weight,diff=l-f,down=diff<0;return(
                <div style={{marginTop:12,padding:"11px 16px",background:"rgba(255,255,255,0.05)",borderRadius:14,display:"flex",justifyContent:"space-between",alignItems:"center"}}>
                  <span style={{fontSize:12,color:T.t2,fontFamily:"'DM Sans',sans-serif"}}>Cambio total · {chartData.length} pesajes</span>
                  <span style={{fontWeight:900,fontSize:18,color:down?T.g1:T.red}}>{down?"↓":"↑"} {Math.abs(diff).toFixed(1)} kg</span>
                </div>
              );})()}
            </Card>
          )}
          {weights.length===0&&isWeekend()&&(
            <Card style={{textAlign:"center",padding:"24px"}}>
              <div style={{display:"flex",justifyContent:"center",marginBottom:10}}><Mascot expr="idle" size={110}/></div>
              <div style={{color:T.t2,fontSize:13,fontFamily:"'DM Sans',sans-serif"}}>Registra tu primer pesaje para ver la gráfica de evolución</div>
            </Card>
          )}
        </>}

        {/* ── ACHIEVEMENTS ──────────────────────────────────────────────────── */}
        {tab==="achievements"&&<>
          <Card style={{display:"flex",justifyContent:"space-around",alignItems:"center",padding:"16px"}}>
            <div style={{textAlign:"center"}}><div style={{fontSize:26,fontWeight:900,color:T.au1}}>{badges.length}/{BADGES.length}</div><div style={{color:T.t2,fontSize:11,fontFamily:"'DM Sans',sans-serif"}}>logros</div></div>
            <div style={{textAlign:"center"}}><div style={{fontSize:26,fontWeight:900,color:T.xp}}>{xp}</div><div style={{color:T.t2,fontSize:11,fontFamily:"'DM Sans',sans-serif"}}>XP total</div></div>
            <div style={{textAlign:"center"}}><div style={{fontSize:26,fontWeight:900,color:T.au1}}>{gems}</div><div style={{color:T.t2,fontSize:11,fontFamily:"'DM Sans',sans-serif"}}>💎 gemas</div></div>
          </Card>
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
        {[{id:"home",icon:"🏠",l:"Inicio"},{id:"weight",icon:"⚖️",l:"Peso"},{id:"achievements",icon:"🏅",l:"Logros"}].map(({id,icon,l})=>(
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
