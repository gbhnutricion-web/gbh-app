import React from "react";
import { resumenDia, fraccionesMacros, fraseDia, fmtKcal, TOMAS_ORDEN } from "./kcalDia";

// ─── «Tu día»: kcal reales frente a previstas + macros real/previsto ───────────
// Sustituye a «Distribución de macros del día» al final de Platos diarios
// (07. App GBH/BRIEF_kcal_reales.md §4.1). Recibe todo por props y no escribe nada.
// Tono: sin rojo, sin reproche — pasarse se pinta en dorado neutro y se dice con un
// número. Con kcalVisible=false (interruptor del nutricionista) o fuera de la semana
// vigente (activo=false) enseña SOLO lo previsto, exactamente como la tarjeta de antes.
const FT = "'Nunito',sans-serif", FD = "'DM Sans',sans-serif";
const ICONO = { Desayuno: '☀️', Almuerzo: '🍎', Comida: '🍽️', Merienda: '🥤', Cena: '🌙' };
const reducirMovimiento = () => { try { return window.matchMedia('(prefers-reduced-motion: reduce)').matches; } catch { return false; } };

export function TuDia({ T, lang, planJ, dia, meals, real, tomas = TOMAS_ORDEN, activo = true, kcalVisible = true, diaNombre = '', semana = null }) {
  const EN = lang === 'en';
  const conReal = !!(activo && kcalVisible);
  const res = React.useMemo(
    () => resumenDia(planJ, dia, conReal ? meals : null, conReal ? real : null, tomas),
    [planJ, dia, meals, real, conReal, tomas]);
  const [modoSel, setModoSel] = React.useState(null);            // null = automático
  if (!res.planificadas) return null;

  const colorToma = { Desayuno: T.au2, Almuerzo: T.g2, Comida: T.platos, Merienda: T.pur, Cena: T.xp };
  const hayReal = conReal && res.porToma.some((x) => x.real && x.real.conocido && x.real.conMacros);
  const modo = conReal ? (modoSel || (hayReal ? 'real' : 'prev')) : 'prev';
  const src = modo === 'real' ? res.real : res.previsto;
  const fr = fraccionesMacros(src);
  const R = 42, SW = 18, C = 2 * Math.PI * R;
  const segsDonut = [{ f: fr.fH, c: T.g1 }, { f: fr.fG, c: '#FFB74D' }, { f: fr.fP, c: T.platos }];
  let acc = 0;

  // Barra: la longitud es lo previsto; cada toma registrada aporta su tramo real; una
  // toma con estado pero sin cuantificar pinta un tramo rayado con «?» del tamaño
  // previsto; si lo real supera lo previsto, la marca queda dentro y el exceso va en dorado.
  const rayadoKcal = res.porToma.filter((x) => x.real && !x.real.conocido).reduce((a, x) => a + x.previsto.kcal, 0);
  const max = Math.max(res.previsto.kcal, res.real.kcal + rayadoKcal, 1);
  const tramos = res.porToma.filter((x) => x.real).map((x) => (
    x.real.conocido
      ? { toma: x.toma, w: x.real.kcal / max * 100, color: colorToma[x.toma] || T.g1, q: false }
      : { toma: x.toma, w: x.previsto.kcal / max * 100, color: null, q: true }));
  const marca = res.previsto.kcal / max * 100;
  const sobra = res.real.kcal > res.previsto.kcal;
  const anim = reducirMovimiento() ? 'none' : 'width 0.5s cubic-bezier(0.34,1.2,0.64,1)';

  const leyenda = [
    [T.platos, EN ? 'Protein' : 'Proteínas', fr.fP, src.p, res.previsto.p],
    [T.g1, EN ? 'Carbs' : 'Hidratos', fr.fH, src.h, res.previsto.h],
    ['#FFB74D', EN ? 'Fat' : 'Grasas', fr.fG, src.g, res.previsto.g],
  ];
  const sub = [diaNombre, semana != null ? `${EN ? 'Week' : 'Semana'} ${semana}` : ''].filter(Boolean).join(' · ');

  return (
    <div style={{ background: 'rgba(255,255,255,0.03)', border: '1.5px solid rgba(255,255,255,0.10)', borderRadius: 16, padding: '16px 16px' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: conReal ? 12 : 14 }}>
        <div style={{ fontSize: 11, color: T.au1, fontWeight: 900, textTransform: 'uppercase', letterSpacing: '0.08em', display: 'flex', alignItems: 'center', gap: 6 }}>
          <span>📊</span>{conReal ? (EN ? 'Your day' : 'Tu día') : (EN ? 'Daily macro split' : 'Distribución de macros del día')}
        </div>
        {conReal && !!sub && <div style={{ fontSize: 10.5, color: T.t3, fontFamily: FD }}>{sub}</div>}
      </div>

      {conReal && (<>
        <div style={{ position: 'relative', height: 22, borderRadius: 11, background: 'rgba(255,255,255,0.07)', overflow: 'hidden', display: 'flex' }}>
          {tramos.map((s) => (
            <div key={s.toma} title={s.toma} style={{ width: `${s.w.toFixed(2)}%`, height: '100%', display: 'grid', placeItems: 'center', fontSize: 11, overflow: 'hidden', whiteSpace: 'nowrap', minWidth: 0, transition: anim,
              background: s.q ? 'repeating-linear-gradient(135deg, rgba(255,255,255,0.18) 0 6px, rgba(255,255,255,0.06) 6px 12px)' : s.color,
              color: T.t1, fontWeight: 900 }}>
              {s.q ? '?' : (s.w > 7 ? ICONO[s.toma] || '' : '')}
            </div>
          ))}
          {sobra && <div style={{ position: 'absolute', top: 0, bottom: 0, left: `${marca.toFixed(2)}%`, right: 0, background: 'rgba(201,162,39,0.35)', pointerEvents: 'none' }} />}
          <div style={{ position: 'absolute', top: -3, bottom: -3, left: `${marca.toFixed(2)}%`, width: 2, background: T.t1, boxShadow: '0 0 6px rgba(255,255,255,0.7)', pointerEvents: 'none' }} />
        </div>
        <div style={{ display: 'flex', alignItems: 'baseline', gap: 8, marginTop: 9 }}>
          <b style={{ fontSize: 24, fontWeight: 900, color: T.t1, fontFamily: FT, fontVariantNumeric: 'tabular-nums' }}>{fmtKcal(res.real.kcal, lang)}</b>
          <span style={{ fontSize: 12, color: T.t2, fontFamily: FD }}>{EN ? `of ${fmtKcal(res.previsto.kcal, lang)} kcal planned` : `de ${fmtKcal(res.previsto.kcal, lang)} kcal previstas`}</span>
        </div>
        <div style={{ fontSize: 12, color: T.t2, fontFamily: FD, marginTop: 2, lineHeight: 1.45 }}>{fraseDia(res, lang)}</div>
        <div style={{ display: 'inline-flex', gap: 3, background: 'rgba(0,0,0,0.25)', padding: 3, borderRadius: 10, marginTop: 12 }}>
          {[['real', EN ? 'Actual' : 'Real'], ['prev', EN ? 'Planned' : 'Previsto']].map(([m, txt]) => (
            <button key={m} onClick={() => setModoSel(m)} style={{ fontFamily: FT, fontWeight: 900, fontSize: 11, padding: '6px 10px', border: 'none', borderRadius: 8, cursor: 'pointer', background: modo === m ? T.g3 : 'transparent', color: modo === m ? T.wh : T.t2 }}>{txt}</button>
          ))}
        </div>
      </>)}

      <div style={{ display: 'flex', alignItems: 'center', gap: 18, marginTop: conReal ? 8 : 0 }}>
        <svg width="110" height="110" viewBox="0 0 112 112" style={{ flexShrink: 0 }}>
          <g transform="rotate(-90 56 56)">
            <circle cx="56" cy="56" r={R} fill="none" stroke="rgba(255,255,255,0.06)" strokeWidth={SW} />
            {fr.tot > 0 && segsDonut.map((s, i) => { const dash = C * s.f; const el = (<circle key={i} cx="56" cy="56" r={R} fill="none" stroke={s.c} strokeWidth={SW} strokeDasharray={`${dash} ${C - dash}`} strokeDashoffset={-C * acc} strokeLinecap="butt" />); acc += s.f; return el; })}
          </g>
        </svg>
        <div style={{ flex: 1, display: 'flex', flexDirection: 'column', gap: 9 }}>
          {leyenda.map(([c, lbl, f, gr, gPrev], i) => (
            <div key={i} style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
              <div style={{ width: 10, height: 10, borderRadius: 3, background: c, flexShrink: 0 }} />
              <div style={{ flex: 1, fontSize: 13, color: T.t1, fontFamily: FD }}>{lbl}</div>
              <div style={{ fontSize: 13, fontWeight: 900, color: c, fontFamily: FT }}>{Math.round(f * 100)}%</div>
              <div style={{ fontSize: 11, color: T.t3, minWidth: 34, textAlign: 'right', fontFamily: FD, whiteSpace: 'nowrap' }}>
                {Math.round(gr)} g{modo === 'real' && <span style={{ opacity: 0.8 }}> ({EN ? 'plan' : 'prev.'} {Math.round(gPrev)})</span>}
              </div>
            </div>
          ))}
          {modo === 'real' && res.sinMacros > 0 && <div style={{ fontSize: 10.5, color: T.t3, fontFamily: FD }}>{EN ? `${res.sinMacros} meal without macros (kcal typed by hand)` : `${res.sinMacros} comida sin macros (kcal a mano)`}</div>}
          {modo === 'real' && !hayReal && <div style={{ fontSize: 10.5, color: T.t3, fontFamily: FD }}>{EN ? 'no quantified meals yet' : 'aún no hay comidas cuantificadas'}</div>}
        </div>
      </div>

      {conReal && (
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: 10, paddingTop: 9, borderTop: '1px solid rgba(255,255,255,0.10)', fontSize: 11, color: T.t2, fontFamily: FD }}>
          <span>
            {EN ? `${res.registradas} of ${res.planificadas} meals logged` : `${res.registradas} de ${res.planificadas} comidas registradas`}
            {res.sinCuantificar > 0 && (EN ? ` · ${res.sinCuantificar} not quantified` : ` · ${res.sinCuantificar} sin cuantificar`)}
          </span>
        </div>
      )}
    </div>
  );
}
