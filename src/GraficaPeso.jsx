// Gráfica de peso de Progreso → Peso, en su propio trozo (MAESTRO-2026-1234): recharts solo se
// descarga cuando hace falta. El JSX es el que vivía en WeightChart de App.jsx, sin cambios salvo
// que T, t y el tooltip llegan por props.
import React from "react";
import { ComposedChart, Line, XAxis, YAxis, Tooltip, ResponsiveContainer } from "recharts";

export default function GraficaPeso({ chartData, goalWeight, T, t, tooltip }) {
  return (
    <ResponsiveContainer width="100%" height={200}>
      <ComposedChart data={chartData} margin={{top:5,right:5,left:-22,bottom:0}}>
        <XAxis dataKey="date" tickFormatter={d=>d.slice(5)} tick={{fontSize:9,fill:T.t2}} tickLine={false} axisLine={false}/>
        <YAxis domain={goalWeight?[d=>{const mn=Math.min(...chartData.map(x=>x.weight||99),goalWeight)-2;return Math.floor(mn);},"auto"]:(["auto","auto"])} tick={{fontSize:9,fill:T.t2}} tickLine={false} axisLine={false}/>
        <Tooltip content={tooltip}/>
        {goalWeight&&<Line type="monotone" dataKey={()=>goalWeight} stroke="#FF6B9D" strokeWidth={2} strokeDasharray="6 4" dot={false} name={t("chartGoalLabel")}/>}
        <Line type="monotone" dataKey="weight" stroke={T.au1} strokeWidth={2.5} dot={{r:4.5,fill:T.au1,strokeWidth:0}} activeDot={{r:7,fill:T.au2}}/>
        <Line type="monotone" dataKey="ma" stroke={T.xp} strokeWidth={2} strokeDasharray="5 3" dot={false}/>
      </ComposedChart>
    </ResponsiveContainer>
  );
}
