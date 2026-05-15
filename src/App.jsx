import { useState, useEffect, useCallback, useMemo, useRef } from "react";
import { ComposedChart, Line, XAxis, YAxis, Tooltip, ResponsiveContainer } from "recharts";

const SB = "https://kszytoufvqogcitzbzqs.supabase.co";
const KEY = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Imtzenl0b3VmdnFvZ2NpdHpienFzIiwicm9sZSI6ImFub24iLCJpYXQiOjE3Nzg1OTQzOTgsImV4cCI6MjA5NDE3MDM5OH0.OcOUrgbyAL6aPBSW_hSNapmwSYMV5mNjLrJCmRghg-c";

const C = {
  bg:"#0A1410",card:"#111C16",card2:"#0E1812",
  green:"#3B7D3B",greenL:"#4CAF4C",greenD:"#2A5C2A",
  gold:"#C0A16B",goldL:"#D4B87E",
  text:"#F0EDE8",sub:"rgba(240,237,232,0.42)",
  border:"rgba(192,161,107,0.13)",borderG:"rgba(59,125,59,0.28)",
  danger:"#C0392B",success:"#27AE60",xp:"#4ECDC4",
};

const LEVELS=[
  {l:1,name:"Iniciado",min:0,max:150},
  {l:2,name:"Constante",min:150,max:400},
  {l:3,name:"Dedicado",min:400,max:800},
  {l:4,name:"Atleta",min:800,max:1500},
  {l:5,name:"Élite",min:1500,max:3000},
  {l:6,name:"Leyenda GBH",min:3000,max:99999},
];
const getLevel=(xp)=>LEVELS.find((_,i)=>xp<(LEVELS[i+1]?.min??99999))||LEVELS[5];

const BADGES=[
  {id:"first_day",icon:"🌱",title:"Primer Paso",desc:"Primer check-in completado",xp:20,gems:10,cond:(s,w,d)=>d>=1},
  {id:"streak_7",icon:"🔥",title:"Semana de Fuego",desc:"7 días consecutivos",xp:70,gems:50,cond:(s)=>s>=7},
  {id:"streak_30",icon:"💪",title:"Hábito Forjado",desc:"30 días consecutivos",xp:200,gems:150,reward:"📄 PDF extra de recetas",cond:(s)=>s>=30},
  {id:"streak_100",icon:"🏆",title:"Centenario",desc:"100 días consecutivos",xp:500,gems:300,reward:"🤝 Consulta presencial gratuita",cond:(s)=>s>=100},
  {id:"streak_365",icon:"👑",title:"Un Año de Constancia",desc:"365 días seguidos",xp:1500,gems:1000,reward:"📚 Recetario anual completo",cond:(s)=>s>=365},
  {id:"first_weight",icon:"⚖️",title:"Báscula Activada",desc:"Primera medición de peso",xp:15,gems:10,cond:(s,w)=>w>=1},
  {id:"weight_8w",icon:"📊",title:"8 Semanas al Día",desc:"8 pesajes registrados",xp:100,gems:80,cond:(s,w)=>w>=8},
  {id:"perfect_week",icon:"⭐",title:"Semana Perfecta",desc:"Todas las misiones en 7 días",xp:100,gems:60,cond:(s,w,d,pf)=>pf},
  {id:"weight_12w",icon:"📈",title:"Trimestre Constante",desc:"12 pesajes registrados",xp:200,gems:150,reward:"🎯 Análisis trimestral personalizado",cond:(s,w)=>w>=12},
];

const toKey=(d=new Date())=>d.toISOString().slice(0,10);
const isWeekend=()=>{const d=new Date().getDay();return d===0||d===6;};

const sb=async(method,path,body=null)=>{
  try{
    const r=await fetch(`${SB}/rest/v1/${path}`,{
      method,
      headers:{"apikey":KEY,"Authorization":`Bearer ${KEY}`,"Content-Type":"application/json","Prefer":method==="POST"?"return=representation, resolution=merge-duplicates":""},
      body:body?JSON.stringify(body):null,
    });
    if(!r.ok)return null;
    return method==="DELETE"?true:r.json();
  }catch{return null;}
};

const ls={
  get:(k,fb)=>{try{const v=localStorage.getItem(k);return v?JSON.parse(v):fb;}catch{return fb;}},
  set:(k,v)=>{try{localStorage.setItem(k,JSON.stringify(v));}catch{}},
};

function SheepAvatar({streak=0,level=1,size=130}){
  const aura=streak>=7,legend=streak>=100,crown=level>=5;
  return(
    <div style={{position:"relative",width:size,height:size,flexShrink:0}}>
      {aura&&<div style={{position:"absolute",inset:-16,borderRadius:"50%",background:`radial-gradient(circle,${legend?"rgba(192,161,107,0.5)":"rgba(59,125,59,0.38)"} 0%,transparent 68%)`,animation:"aura 2.5s ease-in-out infinite"}}/>}
      <svg viewBox="0 0 120 130" style={{width:"100%",height:"100%",filter:aura?"drop-shadow(0 0 8px rgba(59,125,59,0.55))":"none"}}>
        <circle cx="38" cy="68" r="17" fill={C.green}/>
        <circle cx="82" cy="68" r="17" fill={C.green}/>
        <circle cx="50" cy="54" r="19" fill={C.green}/>
        <circle cx="70" cy="54" r="19" fill={C.green}/>
        <circle cx="60" cy="48" r="20" fill={C.green}/>
        <ellipse cx="60" cy="78" rx="24" ry="16" fill={C.greenD}/>
        <ellipse cx="60" cy="72" rx="17" ry="15" fill="#1A3D28"/>
        <circle cx="53" cy="67" r="4.5" fill="#0D2218"/>
        <circle cx="67" cy="67" r="4.5" fill="#0D2218"/>
        <circle cx="54.5" cy="65.8" r="1.8" fill="white"/>
        <circle cx="68.5" cy="65.8" r="1.8" fill="white"/>
        {streak>=30&&<><circle cx="54.5" cy="65.8" r="2" fill={C.goldL}/><circle cx="68.5" cy="65.8" r="2" fill={C.goldL}/></>}
        <ellipse cx="60" cy="75" rx="5" ry="3.5" fill="#0D2218"/>
        <path d="M54 79 Q60 84 66 79" stroke={C.gold} strokeWidth="1.8" fill="none" strokeLinecap="round"/>
        <path d="M47 50 C43 40 40 32 44 26" stroke={C.gold} strokeWidth="3.5" fill="none" strokeLinecap="round"/>
        <path d="M73 50 C77 40 80 32 76 26" stroke={C.gold} strokeWidth="3.5" fill="none" strokeLinecap="round"/>
        <rect x="43" y="90" width="10" height="22" rx="5" fill="#1A3D28"/>
        <rect x="67" y="90" width="10" height="22" rx="5" fill="#1A3D28"/>
        {crown&&<path d="M46 26 L50 17 L57 23 L63 15 L70 23 L77 17 L80 26 Z" fill={C.gold} opacity="0.9"/>}
      </svg>
    </div>
  );
}

function SpeechBubble({msg}){
  return(
    <div style={{background:C.card,border:`1px solid ${C.border}`,borderRadius:16,padding:"10px 14px",maxWidth:220,position:"relative",fontSize:12.5,color:C.text,lineHeight:1.5,textAlign:"center",animation:"fadeIn 0.4s ease"}}>
      {msg}
      <div style={{position:"absolute",bottom:-9,left:"50%",transform:"translateX(-50%)",width:0,height:0,borderLeft:"8px solid transparent",borderRight:"8px solid transparent",borderTop:`8px solid ${C.border}`}}/>
      <div style={{position:"absolute",bottom:-6,left:"50%",transform:"translateX(-50%)",width:0,height:0,borderLeft:"7px solid transparent",borderRight:"7px solid transparent",borderTop:`7px solid ${C.card}`}}/>
    </div>
  );
}

const getMsg=(name,streak,done)=>{
  const n=name.split(" ")[0];
  if(done)return `¡Hoy ya está! Descansa tranquilo/a, ${n} 🌙`;
  if(streak===0)return `Hoy es el día, ${n}. Cada gran racha empieza con el primer paso 💚`;
  if(streak<4)return `¡${streak} día${streak>1?"s":""} de racha! Los hábitos se construyen así, ${n} 💪`;
  if(streak<7)return `¡${streak} días seguidos! A punto de completar tu primera semana, ${n} 🔥`;
  if(streak<14)return `Semana completa y más. ${streak} días, ${n}. Tu cuerpo ya lo agradece`;
  if(streak<30)return `¡${streak} días! Eres más constante que la lluvia en San Sebastián, ${n}`;
  if(streak<100)return `¡¡${streak} DÍAS!! Leyenda en construcción, ${n}. Los datos no mienten 🏆`;
  return `¡CENTENARIO! ${streak} días. Leyenda absoluta de GBH, ${n} 👑`;
};

function MissionCard({icon,label,done,onToggle,xpR=5}){
  return(
    <button onClick={onToggle} style={{display:"flex",alignItems:"center",gap:12,background:done?`linear-gradient(135deg,${C.greenD},#1E3D20)`:C.card2,border:`1px solid ${done?C.borderG:C.border}`,borderRadius:14,padding:"12px 16px",cursor:"pointer",transition:"all 0.2s",width:"100%",textAlign:"left",transform:done?"scale(1.01)":"scale(1)"}}>
      <span style={{fontSize:22,flexShrink:0}}>{icon}</span>
      <div style={{flex:1}}>
        <div style={{fontSize:14,fontWeight:600,color:done?C.text:"rgba(240,237,232,0.55)"}}>{label}</div>
        <div style={{fontSize:11,color:C.sub,marginTop:1}}>+{xpR} XP</div>
      </div>
      <div style={{width:24,height:24,borderRadius:7,border:`2px solid ${done?C.green:C.border}`,background:done?C.green:"transparent",display:"flex",alignItems:"center",justifyContent:"center",flexShrink:0,transition:"all 0.18s"}}>
        {done&&<span style={{fontSize:13,color:"white",lineHeight:1}}>✓</span>}
      </div>
    </button>
  );
}

const CTip=({active,payload})=>{
  if(!active||!payload?.length)return null;
  const d=payload[0]?.payload;
  return(
    <div style={{background:C.card,border:`1px solid ${C.border}`,borderRadius:10,padding:"8px 12px"}}>
      <div style={{color:C.sub,fontSize:11}}>{d?.date}</div>
      {d?.weight&&<div style={{color:C.gold,fontWeight:700,fontSize:14}}>{d.weight} kg</div>}
      {d?.ma&&<div style={{color:C.xp,fontSize:12}}>Tendencia: {d.ma.toFixed(1)} kg</div>}
    </div>
  );
};

function Confetti({active}){
  if(!active)return null;
  const pieces=Array.from({length:18},(_,i)=>({l:`${Math.random()*100}%`,delay:`${Math.random()*0.7}s`,color:[C.green,C.gold,C.xp,"#FF6B6B","#FFE66D"][i%5],size:Math.random()*8+4}));
  return(
    <div style={{position:"fixed",top:0,left:0,right:0,bottom:0,pointerEvents:"none",zIndex:999,overflow:"hidden"}}>
      {pieces.map((p,i)=><div key={i} style={{position:"absolute",top:"-10px",left:p.l,width:p.size,height:p.size,background:p.color,borderRadius:"50%",animation:`confetti 1.5s ${p.delay} ease-in forwards`}}/>)}
    </div>
  );
}

export default function GBHApp(){
  const [screen,setScreen]=useState("auth");
  const [tab,setTab]=useState("home");
  const [profile,setProfile]=useState(null);
  const [todayLog,setTodayLog]=useState({diet:false,steps:false,hydration:false,sleep:false});
  const [weights,setWeights]=useState([]);
  const [badges,setBadges]=useState([]);
  const [allP,setAllP]=useState([]);
  const [wInput,setWInput]=useState("");
  const [toast,setToast]=useState(null);
  const [confetti,setConfetti]=useState(false);
  const [loading,setLoading]=useState(false);
  const [taps,setTaps]=useState(0);
  const [authName,setAuthName]=useState("");
  const [authEmail,setAuthEmail]=useState("");
  const tapRef=useRef(null);

  const streak=useMemo(()=>{
    if(!profile)return 0;
    const logs=ls.get(`gbh:logs:${profile.id}`,[]);
    let s=0;const d=new Date();
    while(true){if(logs.find(l=>l.date===toKey(d)&&l.diet)){s++;d.setDate(d.getDate()-1);}else break;}
    return s;
  },[profile,todayLog]);

  const xp=profile?.xp??0,gems=profile?.gems??0;
  const lv=getLevel(xp),nextLv=LEVELS[lv.l]||lv;
  const xpPct=Math.min(((xp-lv.min)/(nextLv.min-lv.min))*100,100);
  const todayDone=todayLog.diet;

  const chartData=useMemo(()=>{
    if(weights.length<2)return weights.map(w=>({...w,ma:w.weight}));
    return weights.map((w,i)=>{
      const win=weights.slice(Math.max(0,i-3),i+1);
      const ma=win.reduce((a,b)=>a+b.weight,0)/win.length;
      return{...w,ma:parseFloat(ma.toFixed(2))};
    });
  },[weights]);

  const loadProfile=useCallback(async(p)=>{
    setProfile(p);
    const logs=ls.get(`gbh:logs:${p.id}`,[]);
    const t=logs.find(l=>l.date===toKey());
    if(t)setTodayLog({diet:t.diet,steps:t.steps,hydration:t.hydration,sleep:t.sleep});
    setWeights(ls.get(`gbh:weights:${p.id}`,[]).sort((a,b)=>a.date>b.date?1:-1));
    setBadges(ls.get(`gbh:badges:${p.id}`,[]) );
    setScreen("main");
  },[]);

  const handleAuth=async()=>{
    if(!authName.trim()||!authEmail.trim())return;
    setLoading(true);
    const email=authEmail.trim().toLowerCase(),name=authName.trim();
    let res=await sb("GET",`profiles?email=eq.${email}&select=*`);
    if(res?.length){ls.set(`gbh:profile:${res[0].id}`,res[0]);await loadProfile(res[0]);setLoading(false);return;}
    const lid=ls.get(`gbh:em:${email}`,null);
    if(lid){const lp=ls.get(`gbh:profile:${lid}`,null);if(lp){await loadProfile(lp);setLoading(false);return;}}
    const np={id:crypto.randomUUID(),name,email,xp:0,gems:0,shields:0};
    const cr=await sb("POST","profiles",np);
    const fp=cr?.[0]||np;
    ls.set(`gbh:profile:${fp.id}`,fp);ls.set(`gbh:em:${email}`,fp.id);
    await loadProfile(fp);setLoading(false);
  };

  const saveLog=useCallback(async(nl)=>{
    if(!profile)return;
    const today=toKey(),logs=ls.get(`gbh:logs:${profile.id}`,[]);
    const idx=logs.findIndex(l=>l.date===today);
    const entry={profile_id:profile.id,date:today,...nl};
    if(idx>=0)logs[idx]=entry;else logs.push(entry);
    ls.set(`gbh:logs:${profile.id}`,logs);
    await sb("POST","daily_logs",{...entry,log_date:today,diet_followed:nl.diet,steps_done:nl.steps,hydration_done:nl.hydration,sleep_done:nl.sleep});
  },[profile]);

  const addXG=useCallback(async(ax,ag)=>{
    if(!profile)return;
    const u={...profile,xp:(profile.xp||0)+ax,gems:(profile.gems||0)+ag};
    setProfile(u);ls.set(`gbh:profile:${u.id}`,u);
    await sb("PATCH",`profiles?id=eq.${profile.id}`,{xp:u.xp,gems:u.gems});
  },[profile]);

  const showToast=(t)=>{setToast(t);setTimeout(()=>setToast(null),4000);};

  const checkBadges=useCallback(async(ci,ws,b)=>{
    const wCount=ws.length;
    const logs=ls.get(`gbh:logs:${profile?.id}`,[]);
    const pf=(()=>{let c=0;const d=new Date();for(let i=0;i<7;i++){if(logs.find(l=>l.date===toKey(d)&&l.diet))c++;d.setDate(d.getDate()-1);}return c>=7;})();
    const totalD=logs.filter(l=>l.diet).length;
    for(const badge of BADGES){
      if(!b.includes(badge.id)&&badge.cond(ci,wCount,totalD,pf)){
        const nb=[...b,badge.id];setBadges(nb);ls.set(`gbh:badges:${profile?.id}`,nb);
        await sb("POST","achievements",{profile_id:profile?.id,badge_id:badge.id});
        await addXG(badge.xp,badge.gems);
        showToast({icon:badge.icon,title:"¡Logro desbloqueado!",sub:badge.title,reward:badge.reward});
        return nb;
      }
    }
    return b;
  },[profile,addXG]);

  const toggleMission=useCallback(async(key)=>{
    const was=todayLog[key],nl={...todayLog,[key]:!was};
    setTodayLog(nl);await saveLog(nl);
    if(!was)await addXG(key==="diet"?15:5,key==="diet"?5:2);
    if(nl.diet&&nl.steps&&nl.hydration&&nl.sleep){await addXG(20,10);showToast({icon:"⭐",title:"¡Día Perfecto!",sub:"Todas las misiones completadas",reward:"+20 XP +10 💎"});}
    await checkBadges(streak,weights,badges);
  },[todayLog,streak,weights,badges,saveLog,addXG,checkBadges]);

  const saveWeight=async()=>{
    const val=parseFloat(wInput);
    if(!isWeekend()||isNaN(val)||val<20||val>300)return;
    const today=toKey(),nw=weights.filter(w=>w.date!==today);
    nw.push({date:today,weight:val});nw.sort((a,b)=>a.date>b.date?1:-1);
    setWeights(nw);ls.set(`gbh:weights:${profile.id}`,nw);setWInput("");
    await sb("POST","weight_logs",{profile_id:profile.id,log_date:today,weight_kg:val});
    await addXG(10,5);
    if(nw.length>=4){const last4=nw.slice(-4).map(w=>w.weight);const ma=last4.reduce((a,b)=>a+b,0)/4;if(val<ma){setConfetti(true);setTimeout(()=>setConfetti(false),2200);showToast({icon:"📉",title:"¡Tendencia bajando!",sub:"La línea va en la dirección correcta 💚"});}}
    await checkBadges(streak,nw,badges);
  };

  const loadAdmin=async()=>{
    const data=await sb("GET","admin_overview?select=*")||[];
    if(data.length){setAllP(data);return;}
    const keys=Object.keys(localStorage).filter(k=>k.startsWith("gbh:profile:"));
    setAllP(keys.map(k=>ls.get(k,{})).filter(p=>p.id));
  };

  const handleSheepTap=()=>{
    const n=taps+1;setTaps(n);
    if(tapRef.current)clearTimeout(tapRef.current);
    tapRef.current=setTimeout(()=>setTaps(0),2500);
    if(n>=5){setScreen("admin");loadAdmin();setTaps(0);}
  };

  const buyShield=async()=>{
    if(gems<200){showToast({icon:"💎",title:"Gemas insuficientes",sub:"Necesitas 200 💎 para un Escudo"});return;}
    const u={...profile,gems:gems-200,shields:(profile.shields||0)+1};
    setProfile(u);ls.set(`gbh:profile:${u.id}`,u);
    await sb("PATCH",`profiles?id=eq.${profile.id}`,{gems:u.gems,shields:u.shields});
    showToast({icon:"🛡️",title:"¡Escudo activado!",sub:"Tu racha está protegida por 1 día"});
  };

  const fn=profile?.name?.split(" ")[0]||"";

  const CSS=`
    @import url('https://fonts.googleapis.com/css2?family=DM+Sans:wght@400;500;600;700;800&display=swap');
    *{box-sizing:border-box;margin:0;padding:0}
    body{background:#0A1410}
    @keyframes aura{0%,100%{opacity:0.6;transform:scale(1)}50%{opacity:1;transform:scale(1.06)}}
    @keyframes fadeIn{from{opacity:0;transform:translateY(-8px)}to{opacity:1;transform:translateY(0)}}
    @keyframes confetti{to{transform:translateY(100vh) rotate(720deg);opacity:0}}
    @keyframes slideUp{from{transform:translateY(60px);opacity:0}to{transform:translateY(0);opacity:1}}
    @keyframes glow{0%,100%{box-shadow:0 0 16px rgba(59,125,59,0.45)}50%{box-shadow:0 0 32px rgba(59,125,59,0.85)}}
    @keyframes pulseDot{0%,100%{opacity:1}50%{opacity:0.4}}
    input::placeholder{color:rgba(240,237,232,0.22)}
    input:focus{outline:none;border-color:rgba(59,125,59,0.65)!important}
    ::-webkit-scrollbar{width:0}
    button:active{transform:scale(0.97)}
  `;

  const card=(x={})=>({background:C.card,borderRadius:20,padding:20,border:`1px solid ${C.border}`,boxShadow:"0 4px 24px rgba(0,0,0,0.3)",marginBottom:14,...x});
  const btn=(primary=true,sm=false)=>({padding:sm?"10px 18px":"16px",borderRadius:14,border:"none",cursor:"pointer",fontSize:sm?13:15,fontWeight:700,transition:"all 0.18s",width:sm?"auto":"100%",background:primary?`linear-gradient(135deg,${C.green},${C.greenL})`:"rgba(255,255,255,0.07)",color:primary?"white":C.sub,boxShadow:primary?`0 4px 16px rgba(59,125,59,0.35)`:"none"});
  const lbl={fontSize:11,color:C.sub,textTransform:"uppercase",letterSpacing:"0.08em",fontWeight:600,marginBottom:8};
  const tabS=(a)=>({flex:1,padding:"8px 0",background:"none",border:"none",color:a?C.gold:C.sub,fontSize:9,fontWeight:a?700:500,cursor:"pointer",display:"flex",flexDirection:"column",alignItems:"center",gap:3,textTransform:"uppercase",letterSpacing:"0.05em",transition:"all 0.18s"});

  if(screen==="auth")return(
    <div style={{fontFamily:"'DM Sans',sans-serif",background:C.bg,minHeight:"100vh",maxWidth:420,margin:"0 auto",display:"flex",flexDirection:"column",alignItems:"center",justifyContent:"center",padding:24,color:C.text}}>
      <style>{CSS}</style>
      <div style={{marginBottom:20,cursor:"pointer"}} onClick={handleSheepTap}><SheepAvatar size={110}/></div>
      <div style={{fontSize:26,fontWeight:800,marginBottom:4,textAlign:"center"}}>GBH Nutrición</div>
      <div style={{fontSize:14,color:C.sub,marginBottom:36,textAlign:"center"}}>Tu plataforma de seguimiento nutricional</div>
      <div style={{...card(),width:"100%",maxWidth:360}}>
        <div style={lbl}>Nombre completo</div>
        <input type="text" value={authName} onChange={e=>setAuthName(e.target.value)} placeholder="Alex Serrano"
          style={{width:"100%",background:"rgba(255,255,255,0.05)",border:`1px solid ${C.border}`,borderRadius:12,padding:"13px 16px",color:C.text,fontSize:15,marginBottom:14}}/>
        <div style={lbl}>Email</div>
        <input type="email" value={authEmail} onChange={e=>setAuthEmail(e.target.value)} placeholder="alex@email.com"
          onKeyDown={e=>e.key==="Enter"&&handleAuth()}
          style={{width:"100%",background:"rgba(255,255,255,0.05)",border:`1px solid ${C.border}`,borderRadius:12,padding:"13px 16px",color:C.text,fontSize:15,marginBottom:20}}/>
        <button onClick={handleAuth} disabled={loading||!authName.trim()||!authEmail.trim()} style={btn()}>
          {loading?"Cargando...":"Entrar al programa →"}
        </button>
      </div>
      {taps>0&&taps<5&&<div style={{fontSize:10,color:C.sub,marginTop:12}}>{5-taps} toques para admin</div>}
    </div>
  );

  if(screen==="admin"){
    const adh=(id)=>{const logs=ls.get(`gbh:logs:${id}`,[]);const last7=Array.from({length:7},(_,i)=>{const d=new Date();d.setDate(d.getDate()-i);return toKey(d);});return Math.round((last7.filter(k=>logs.find(l=>l.date===k&&l.diet)).length/7)*100);};
    const pStreak=(id)=>{const logs=ls.get(`gbh:logs:${id}`,[]);let s=0;const d=new Date();while(true){if(logs.find(l=>l.date===toKey(d)&&l.diet)){s++;d.setDate(d.getDate()-1);}else break;}return s;};
    const lw=(id)=>{const w=ls.get(`gbh:weights:${id}`,[]);return w.length?w[w.length-1].weight:null;};
    const status=(a)=>a>=80?{t:"✅ En Objetivo",c:C.success}:a>=50?{t:"⚠️ Riesgo",c:C.gold}:{t:"🔴 Inactivo",c:C.danger};
    return(
      <div style={{fontFamily:"'DM Sans',sans-serif",background:C.bg,minHeight:"100vh",maxWidth:420,margin:"0 auto",color:C.text,paddingBottom:20}}>
        <style>{CSS}</style>
        <div style={{padding:"20px 16px 12px",background:`linear-gradient(180deg,#0D1F14,${C.bg})`}}>
          <div style={{display:"flex",justifyContent:"space-between",alignItems:"center"}}>
            <div>
              <div style={{fontSize:11,color:C.sub,textTransform:"uppercase",letterSpacing:"0.08em"}}>Panel Administrador</div>
              <div style={{fontSize:22,fontWeight:800,marginTop:2}}>Cuarto de Guerra 🎯</div>
            </div>
            <button onClick={()=>setScreen("main")} style={{...btn(false,true),width:"auto"}}>← Salir</button>
          </div>
        </div>
        <div style={{padding:"0 16px"}}>
          <div style={{display:"flex",gap:10,marginBottom:14}}>
            {[{l:"Total",v:allP.length,i:"👥"},{l:"Activos hoy",v:allP.filter(p=>{const logs=ls.get(`gbh:logs:${p.id}`,[]);return logs.find(l=>l.date===toKey()&&l.diet);}).length,i:"✅"},{l:"En riesgo",v:allP.filter(p=>adh(p.id)<50).length,i:"⚠️"}].map(({l,v,i})=>(
              <div key={l} style={{...card({flex:1,margin:0,padding:"14px 10px",textAlign:"center"})}}>
                <div style={{fontSize:20}}>{i}</div>
                <div style={{fontSize:24,fontWeight:800,color:C.gold}}>{v}</div>
                <div style={{fontSize:9,color:C.sub,textTransform:"uppercase",letterSpacing:"0.04em",marginTop:2}}>{l}</div>
              </div>
            ))}
          </div>
          <div style={card()}>
            <div style={lbl}>Listado de pacientes</div>
            {allP.length===0?(
              <div style={{color:C.sub,textAlign:"center",padding:"20px 0",fontSize:13}}>Sin datos. Los pacientes aparecerán al registrarse.</div>
            ):allP.map((p)=>{
              const a=p.adherence_7d??adh(p.id),s=p.total_streak_days??pStreak(p.id),w=p.last_weight??lw(p.id);
              const{t:st,c:sc}=status(a);
              return(
                <div key={p.id} style={{borderBottom:`1px solid ${C.border}`,padding:"12px 0"}}>
                  <div style={{display:"flex",justifyContent:"space-between",alignItems:"center",marginBottom:6}}>
                    <div style={{fontWeight:700,fontSize:14}}>{p.name}</div>
                    <div style={{fontSize:12,fontWeight:600,color:sc}}>{st}</div>
                  </div>
                  <div style={{display:"flex",gap:14,marginBottom:6}}>
                    <span style={{fontSize:12,color:C.sub}}>🔥 <b style={{color:C.text}}>{s}d</b></span>
                    <span style={{fontSize:12,color:C.sub}}>⚖️ <b style={{color:C.text}}>{w?`${w}kg`:"—"}</b></span>
                    <span style={{fontSize:12,color:C.sub}}>7d: <b style={{color:a>=80?C.success:a>=50?C.gold:C.danger}}>{a}%</b></span>
                    <span style={{fontSize:12,color:C.sub}}>XP: <b style={{color:C.xp}}>{p.xp||0}</b></span>
                  </div>
                  <div style={{background:"rgba(255,255,255,0.06)",borderRadius:4,height:4}}>
                    <div style={{height:"100%",width:`${a}%`,background:a>=80?C.success:a>=50?C.gold:C.danger,borderRadius:4,transition:"width 0.8s"}}/>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </div>
    );
  }

  return(
    <div style={{fontFamily:"'DM Sans',sans-serif",background:C.bg,minHeight:"100vh",maxWidth:420,margin:"0 auto",color:C.text,paddingBottom:82}}>
      <style>{CSS}</style>
      <Confetti active={confetti}/>

      {toast&&(
        <div style={{position:"fixed",top:16,left:"50%",transform:"translateX(-50%)",zIndex:9999,animation:"slideUp 0.3s ease",width:"90%",maxWidth:340}}>
          <div style={{background:`linear-gradient(135deg,${C.green},${C.greenD})`,borderRadius:18,padding:"14px 20px",boxShadow:`0 8px 32px rgba(59,125,59,0.5)`,textAlign:"center",border:"1px solid rgba(255,255,255,0.1)"}}>
            <div style={{fontSize:30}}>{toast.icon}</div>
            <div style={{fontWeight:800,fontSize:15,marginTop:4}}>{toast.title}</div>
            <div style={{fontSize:13,opacity:0.85,marginTop:2}}>{toast.sub}</div>
            {toast.reward&&<div style={{fontSize:11,marginTop:6,background:"rgba(0,0,0,0.2)",borderRadius:8,padding:"4px 10px",display:"inline-block"}}>{toast.reward}</div>}
          </div>
        </div>
      )}

      {/* Header */}
      <div style={{padding:"16px 20px 8px",background:`linear-gradient(180deg,#0D1F14,${C.bg})`}}>
        <div style={{display:"flex",alignItems:"center",justifyContent:"space-between"}}>
          <div>
            <div style={{fontSize:11,color:C.sub,textTransform:"uppercase",letterSpacing:"0.08em"}}>GBH Nutrición</div>
            <div style={{fontSize:18,fontWeight:800,marginTop:1}}>{fn}</div>
          </div>
          <div style={{display:"flex",alignItems:"center",gap:10}}>
            <div style={{textAlign:"right"}}>
              <div style={{fontSize:10,color:C.xp,fontWeight:700,textTransform:"uppercase",letterSpacing:"0.07em"}}>{lv.name} · Lv {lv.l}</div>
              <div style={{background:"rgba(255,255,255,0.06)",borderRadius:6,height:5,width:70,marginTop:3,overflow:"hidden"}}>
                <div style={{height:"100%",width:`${xpPct}%`,background:`linear-gradient(90deg,${C.xp},${C.green})`,borderRadius:6,transition:"width 0.8s"}}/>
              </div>
              <div style={{fontSize:10,color:C.sub,marginTop:2}}>{xp} XP</div>
            </div>
            <div style={{display:"flex",flexDirection:"column",gap:4}}>
              <div style={{background:"rgba(192,161,107,0.12)",borderRadius:10,padding:"3px 9px",fontSize:12,fontWeight:700,color:C.gold}}>💎 {gems}</div>
              <div style={{background:"rgba(255,107,53,0.12)",borderRadius:10,padding:"3px 9px",fontSize:12,fontWeight:700,color:"#FF8C42"}}>🔥 {streak}</div>
            </div>
          </div>
        </div>
      </div>

      <div style={{padding:"8px 16px 0"}}>

        {tab==="home"&&<>
          {/* Avatar + speech */}
          <div style={{display:"flex",flexDirection:"column",alignItems:"center",gap:12,padding:"12px 0 18px"}}>
            <SpeechBubble msg={getMsg(profile?.name||"",streak,todayDone)}/>
            <div onClick={handleSheepTap} style={{cursor:"pointer"}}>
              <SheepAvatar streak={streak} level={lv.l} size={128}/>
            </div>
            {taps>0&&taps<5&&<div style={{fontSize:10,color:C.sub}}>{5-taps} toques para admin</div>}
          </div>

          {/* Big check-in */}
          <div style={{textAlign:"center",marginBottom:18}}>
            {!todayDone?(
              <button onClick={()=>toggleMission("diet")} style={{width:132,height:132,borderRadius:"50%",border:"none",cursor:"pointer",background:`radial-gradient(circle,${C.greenL} 0%,${C.green} 55%,${C.greenD} 100%)`,color:"white",animation:"glow 2s ease-in-out infinite",display:"flex",flexDirection:"column",alignItems:"center",justifyContent:"center",gap:4,margin:"0 auto"}}>
                <span style={{fontSize:34}}>🍽️</span>
                <span style={{fontSize:12,fontWeight:800}}>Marcar dieta</span>
              </button>
            ):(
              <div style={{width:132,height:132,borderRadius:"50%",background:`radial-gradient(circle,rgba(39,174,96,0.25),rgba(59,125,59,0.08))`,border:`2px solid ${C.success}`,display:"flex",flexDirection:"column",alignItems:"center",justifyContent:"center",gap:4,margin:"0 auto",boxShadow:`0 0 20px rgba(39,174,96,0.28)`}}>
                <span style={{fontSize:38}}>✅</span>
                <span style={{fontSize:11,color:C.success,fontWeight:700}}>¡Completado!</span>
              </div>
            )}
          </div>

          {/* Missions */}
          <div style={{...card(),padding:16}}>
            <div style={{...lbl,marginBottom:12}}>Misiones diarias</div>
            <div style={{display:"flex",flexDirection:"column",gap:8}}>
              <MissionCard icon="👟" label="10.000 pasos" done={todayLog.steps} onToggle={()=>toggleMission("steps")} xpR={5}/>
              <MissionCard icon="💧" label="Hidratación completa" done={todayLog.hydration} onToggle={()=>toggleMission("hydration")} xpR={5}/>
              <MissionCard icon="🌙" label="Descanso +7 horas" done={todayLog.sleep} onToggle={()=>toggleMission("sleep")} xpR={5}/>
            </div>
          </div>

          {/* Stats */}
          <div style={{display:"flex",gap:10,marginBottom:14}}>
            {[{l:"Días seguidos",v:weights.length?Object.values(ls.get(`gbh:logs:${profile.id}`,[])).filter(l=>l.diet).length:0,i:"📅"},{l:"Pesajes",v:weights.length,i:"⚖️"},{l:"Logros",v:badges.length,i:"🏅"}].map(({l,v,i})=>(
              <div key={l} style={{...card({flex:1,margin:0,padding:"14px 10px",textAlign:"center"})}}>
                <div style={{fontSize:20}}>{i}</div>
                <div style={{fontSize:24,fontWeight:800,color:C.gold}}>{v}</div>
                <div style={{fontSize:9,color:C.sub,textTransform:"uppercase",letterSpacing:"0.04em",marginTop:2}}>{l}</div>
              </div>
            ))}
          </div>

          {/* Shop */}
          <div style={{...card({padding:16})}}>
            <div style={{...lbl,marginBottom:10}}>Tienda de protección</div>
            <div style={{display:"flex",alignItems:"center",justifyContent:"space-between"}}>
              <div>
                <div style={{fontSize:14,fontWeight:700}}>🛡️ Escudo de Racha</div>
                <div style={{fontSize:12,color:C.sub,marginTop:2}}>Protege tu racha 1 día</div>
                <div style={{fontSize:12,color:C.gold,marginTop:4,fontWeight:600}}>Tienes {profile?.shields||0} escudos</div>
              </div>
              <button onClick={buyShield} style={{...btn(gems>=200,true),width:"auto"}}>💎 200</button>
            </div>
          </div>
        </>}

        {tab==="weight"&&<>
          {!isWeekend()?(
            <div style={{...card({textAlign:"center",padding:"32px 20px"})}}>
              <div style={{fontSize:48,marginBottom:14}}>⚖️</div>
              <div style={{fontSize:16,fontWeight:800,color:C.gold,marginBottom:10}}>La báscula está descansando</div>
              <div style={{fontSize:14,color:C.sub,lineHeight:1.7}}>Pesarse cada día genera ansiedad innecesaria.<br/><span style={{color:C.gold,fontWeight:600}}>Vuelve el fin de semana</span> para ver<br/>tu evolución real sin distorsión diaria.</div>
              <div style={{marginTop:16,display:"flex",justifyContent:"center",gap:8}}>
                {["L","M","X","J","V","S","D"].map((d,i)=>(
                  <div key={d} style={{width:28,height:28,borderRadius:8,display:"flex",alignItems:"center",justifyContent:"center",fontSize:10,fontWeight:700,background:i>=5?`${C.green}30`:"rgba(255,255,255,0.05)",color:i>=5?C.green:C.sub,border:i===new Date().getDay()-1||(i===6&&new Date().getDay()===0)?`1px solid ${C.gold}`:"none"}}>{d}</div>
                ))}
              </div>
            </div>
          ):(
            <div style={card()}>
              <div style={{...lbl,marginBottom:8}}>Registrar peso — finde ✅</div>
              <div style={{display:"flex",gap:10,alignItems:"center"}}>
                <input type="number" value={wInput} onChange={e=>setWInput(e.target.value)} onKeyDown={e=>e.key==="Enter"&&saveWeight()} placeholder="75.5" step="0.1"
                  style={{flex:1,background:"rgba(255,255,255,0.06)",border:`1px solid rgba(59,125,59,0.5)`,borderRadius:12,padding:"14px 16px",color:C.text,fontSize:18,fontWeight:700}}/>
                <span style={{color:C.sub,fontSize:14}}>kg</span>
                <button onClick={saveWeight} style={{...btn(true,true),width:"auto"}}>Guardar</button>
              </div>
              <div style={{fontSize:11,color:C.sub,marginTop:8}}>💡 En ayunas, antes de desayunar</div>
            </div>
          )}

          {chartData.length>0&&(
            <div style={card()}>
              <div style={{...lbl,marginBottom:4}}>Evolución de peso</div>
              <div style={{display:"flex",gap:16,marginBottom:12}}>
                <div style={{fontSize:11,color:C.sub}}><span style={{display:"inline-block",width:10,height:3,background:C.gold,borderRadius:2,marginRight:5,verticalAlign:"middle"}}/>Peso real</div>
                <div style={{fontSize:11,color:C.sub}}><span style={{display:"inline-block",width:10,height:2,background:C.xp,borderRadius:2,marginRight:5,verticalAlign:"middle"}}/>Tendencia 4s</div>
              </div>
              <ResponsiveContainer width="100%" height={175}>
                <ComposedChart data={chartData} margin={{top:5,right:5,left:-22,bottom:0}}>
                  <XAxis dataKey="date" tickFormatter={d=>d.slice(5)} tick={{fontSize:9,fill:C.sub}} tickLine={false} axisLine={false}/>
                  <YAxis domain={["auto","auto"]} tick={{fontSize:9,fill:C.sub}} tickLine={false} axisLine={false}/>
                  <Tooltip content={<CTip/>}/>
                  <Line type="monotone" dataKey="weight" stroke={C.gold} strokeWidth={2.5} dot={{r:4,fill:C.gold,strokeWidth:0}} activeDot={{r:6}}/>
                  <Line type="monotone" dataKey="ma" stroke={C.xp} strokeWidth={2} strokeDasharray="4 3" dot={false}/>
                </ComposedChart>
              </ResponsiveContainer>
              {chartData.length>=2&&(()=>{const f=chartData[0].weight,l=chartData[chartData.length-1].weight,diff=l-f,down=diff<0;return(
                <div style={{marginTop:12,padding:"10px 14px",background:"rgba(255,255,255,0.04)",borderRadius:10,display:"flex",justifyContent:"space-between",alignItems:"center"}}>
                  <span style={{fontSize:12,color:C.sub}}>Cambio total ({chartData.length} pesajes)</span>
                  <span style={{fontWeight:800,fontSize:16,color:down?C.success:"#f87171"}}>{down?"↓":"↑"} {Math.abs(diff).toFixed(1)} kg</span>
                </div>
              );})()}
            </div>
          )}
          {weights.length===0&&isWeekend()&&(
            <div style={{...card({textAlign:"center",padding:"24px"})}}>
              <div style={{fontSize:32,marginBottom:8}}>📊</div>
              <div style={{color:C.sub,fontSize:13}}>Registra tu primer pesaje para ver la gráfica</div>
            </div>
          )}
        </>}

        {tab==="achievements"&&<>
          <div style={{...card({padding:"14px 20px",display:"flex",justifyContent:"space-around",alignItems:"center"})}}>
            <div style={{textAlign:"center"}}><div style={{fontSize:22,fontWeight:800,color:C.gold}}>{badges.length}/{BADGES.length}</div><div style={{color:C.sub,fontSize:11}}>logros</div></div>
            <div style={{textAlign:"center"}}><div style={{fontSize:22,fontWeight:800,color:C.xp}}>{xp}</div><div style={{color:C.sub,fontSize:11}}>XP total</div></div>
            <div style={{textAlign:"center"}}><div style={{fontSize:22,fontWeight:800,color:C.gold}}>{gems}</div><div style={{color:C.sub,fontSize:11}}>💎 gemas</div></div>
          </div>
          {BADGES.map(b=>{
            const done=badges.includes(b.id);
            return(
              <div key={b.id} style={{...card({opacity:done?1:0.38,border:done?`1px solid ${C.borderG}`:C.border,display:"flex",alignItems:"center",gap:14,background:done?`linear-gradient(135deg,#162B1A,#1A3D22)`:C.card})}}>
                <div style={{fontSize:28,width:48,height:48,display:"flex",alignItems:"center",justifyContent:"center",borderRadius:14,flexShrink:0,background:done?"rgba(59,125,59,0.15)":"rgba(255,255,255,0.04)",filter:done?"none":"grayscale(1)"}}>{b.icon}</div>
                <div style={{flex:1}}>
                  <div style={{fontWeight:700,fontSize:14}}>{b.title}</div>
                  <div style={{fontSize:11,color:C.sub,marginTop:2}}>{b.desc}</div>
                  <div style={{fontSize:11,color:C.xp,marginTop:3}}>+{b.xp} XP · +{b.gems} 💎</div>
                  {b.reward&&<div style={{fontSize:11,color:done?C.gold:"rgba(192,161,107,0.3)",marginTop:4,fontWeight:600}}>🎁 {b.reward}</div>}
                </div>
                {done&&<div style={{color:C.success,fontSize:20,flexShrink:0}}>✓</div>}
              </div>
            );
          })}
        </>}
      </div>

      {/* Bottom nav */}
      <div style={{position:"fixed",bottom:0,left:"50%",transform:"translateX(-50%)",width:"100%",maxWidth:420,background:"rgba(6,14,9,0.97)",backdropFilter:"blur(24px)",borderTop:`1px solid ${C.border}`,display:"flex",padding:"8px 0 8px",zIndex:100}}>
        {[{id:"home",icon:"🏠",l:"Inicio"},{id:"weight",icon:"⚖️",l:"Peso"},{id:"achievements",icon:"🏅",l:"Logros"}].map(({id,icon,l})=>(
          <button key={id} onClick={()=>setTab(id)} style={tabS(tab===id)}>
            <span style={{fontSize:22,filter:tab===id?"none":"grayscale(0.4)"}}>{icon}</span>
            {l}
          </button>
        ))}
      </div>
    </div>
  );
}
