import React from "react";
import { createPortal } from "react-dom";
import { kcalItem, sumaItems, fmtKcal, num } from "./kcalDia";

// ─── «¿Qué comiste?» (Kcal reales, fase 2) ──────────────────────────────────────
// Hoja inferior que cuantifica una toma marcada «la cambié» / «comí fuera» (modo
// 'sustituir') o añade extras sobre cualquier estado (modo 'extras'). Un solo buscador,
// resultados en grupos: 🍽️ Recetas GBH (la caché del recetario, kcal de la ración base) ·
// 🥕 Alimentos (diccionario _NUTRI_ING, kcal por 100 g y medida casera con gramos) ·
// 🍻 Comer fuera (solo si el diccionario trae entradas `f:1`, es decir, firmadas).
// Siempre se puede salir: «No lo sé» deja la toma en «?», «Ahora no» no toca nada.
// Los ítems guardan sus números dentro (BRIEF_kcal_reales.md §4.3 y §4.5). No escribe:
// devuelve la lista por onGuardar y PlanTab la persiste en daily_logs.meals_real.
const FT = "'Nunito',sans-serif", FD = "'DM Sans',sans-serif";
const norm = (s) => String(s || '').normalize('NFD').replace(/[̀-ͯ]/g, '').toLowerCase().replace(/\s+/g, ' ').trim();
const TOMA_LBL = { es: { Desayuno: 'el desayuno', Almuerzo: 'el almuerzo', Comida: 'la comida', Merienda: 'la merienda', Cena: 'la cena' },
                   en: { Desayuno: 'breakfast', Almuerzo: 'morning snack', Comida: 'lunch', Merienda: 'afternoon snack', Cena: 'dinner' } };

function buscar(q, recetas, nutri, estado) {
  const nq = norm(q);
  const rec = [];
  if (recetas) {
    for (const r of Object.values(recetas)) {
      const nom = r.nombre || r.nombre_receta || r.Nombre_Receta || '';
      if (!nom) continue;
      const nn = norm(nom);
      if (!nq || nn.includes(nq)) rec.push({ nom, nn, r, pref: nq && nn.startsWith(nq) ? 0 : 1 });
      if (rec.length > 400) break;
    }
    rec.sort((a, b) => a.pref - b.pref || a.nom.localeCompare(b.nom));
  }
  const ali = [], fuera = [];
  for (const [nom, e] of Object.entries(nutri || {})) {
    const hay = !nq || norm(nom).includes(nq) || (e.s || []).some((s) => norm(s).includes(nq)) || (e.d && norm(e.d).includes(nq));
    if (!hay) continue;
    const pref = nq && (norm(nom).startsWith(nq) || (e.s || []).some((s) => norm(s).startsWith(nq))) ? 0 : 1;
    (e.f ? fuera : ali).push({ nom, e, pref });
  }
  ali.sort((a, b) => a.pref - b.pref || a.nom.localeCompare(b.nom));
  fuera.sort((a, b) => a.pref - b.pref || a.nom.localeCompare(b.nom));
  const n = nq ? 8 : 4;
  const grupos = [
    { k: 'rec', ic: '🍽️', tit: 'Recetas GBH', titEn: 'GBH recipes', filas: rec.slice(0, n) },
    { k: 'ali', ic: '🥕', tit: 'Alimentos', titEn: 'Foods', filas: ali.slice(0, n) },
  ];
  if (fuera.length) grupos.push({ k: 'fuera', ic: '🍻', tit: 'Comer fuera', titEn: 'Eating out', filas: fuera.slice(0, n) });
  if (estado === 'fuera' && fuera.length) grupos.unshift(grupos.pop());
  return grupos;
}

export function QueComiste({ T, lang, toma, modo = 'sustituir', estado, cargarRecetas, nutri, inicial = [], onGuardar, onCerrar }) {
  const EN = lang === 'en';
  const [q, setQ] = React.useState('');
  const [items, setItems] = React.useState(() => (Array.isArray(inicial) ? inicial.map((x) => ({ ...x })) : []));
  const [recetas, setRecetas] = React.useState(null);
  const [libre, setLibre] = React.useState(false);
  const [libreN, setLibreN] = React.useState(''); const [libreK, setLibreK] = React.useState('');
  const [cargando, setCargando] = React.useState(true);
  React.useEffect(() => {
    let vivo = true;
    Promise.resolve(typeof cargarRecetas === 'function' ? cargarRecetas() : null)
      .then((m) => { if (vivo) { setRecetas(m || {}); setCargando(false); } })
      .catch(() => { if (vivo) { setRecetas({}); setCargando(false); } });
    return () => { vivo = false; };
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  const grupos = React.useMemo(() => buscar(q, recetas, nutri, estado), [q, recetas, nutri, estado]);
  const total = sumaItems(items);
  const tomaTxt = (TOMA_LBL[EN ? 'en' : 'es'][toma]) || toma;
  const tit = modo === 'extras'
    ? (EN ? `What else did you have at ${tomaTxt}?` : `¿Qué más tomaste en ${tomaTxt}?`)
    : (EN ? `What did you eat at ${tomaTxt}?` : `¿Qué comiste en ${tomaTxt}?`);
  const sub = modo === 'extras'
    ? (EN ? 'An extra on top of what you logged. It adds to your day.' : 'Un extra sobre lo que ya marcaste. Se suma a tu día.')
    : (estado === 'fuera'
      ? (EN ? 'Pick what you had. If you do not know, that is fine.' : 'Elige lo que tomaste. Si no lo sabes, no pasa nada.')
      : (EN ? 'Search a GBH recipe or a food. You can leave it for later.' : 'Busca una receta GBH o un alimento. Puedes dejarlo para luego.'));

  const addRec = (r) => setItems((xs) => [...xs, { t: 'rec', id: r.id_receta || r.id || null, n: r.nombre || r.nombre_receta || r.Nombre_Receta || '', q: 1,
    kcal: num(r.calorias ?? r.Calorias_Totales), p: num(r.proteinas_g ?? r.Proteinas_g), h: num(r.hidratos_g ?? r.Hidratos_g), g: num(r.grasas_g ?? r.Grasas_g) }]);
  const addAli = (nom, e) => { const u = (e.u && e.u[0]) || ['ración', 100]; setItems((xs) => [...xs, { t: 'ing', n: nom, q: 1, u: u[0], ug: num(u[1]), k: num(e.k), p: num(e.p), h: num(e.h), g: num(e.g), id: e.id || null, e: e.e ? 1 : 0 }]); };
  const addLibre = () => { const k = parseFloat(String(libreK).replace(',', '.')); const n = libreN.trim(); if (!n || !(k >= 0)) return; setItems((xs) => [...xs, { t: 'libre', n, kcal: Math.round(k) }]); setLibreN(''); setLibreK(''); setLibre(false); };
  const mas = (i) => setItems((xs) => xs.map((x, j) => j !== i ? x : { ...x, q: x.t === 'rec' ? +(num(x.q) + 0.5).toFixed(2) : num(x.q) + 1 }));
  const menos = (i) => setItems((xs) => xs.map((x, j) => j !== i ? x : { ...x, q: x.t === 'rec' ? Math.max(0.5, +(num(x.q) - 0.5).toFixed(2)) : Math.max(1, num(x.q) - 1) }));
  const unidad = (i, val) => setItems((xs) => xs.map((x, j) => {
    if (j !== i) return x;
    if (val === '__g') return { ...x, u: 'g', ug: 1, q: Math.max(1, Math.round(num(x.ug) * num(x.q))) };
    const e = nutri && nutri[x.n]; const u = (e && e.u || []).find((uu) => uu[0] === val); return u ? { ...x, u: u[0], ug: num(u[1]), q: 1 } : x;
  }));
  const quitar = (i) => setItems((xs) => xs.filter((_, j) => j !== i));
  const cantTxt = (x) => x.t === 'rec' ? `${x.q === 0.5 ? '½' : x.q} ${EN ? (x.q > 1 ? 'servings' : 'serving') : (x.q > 1 ? 'raciones' : 'ración')}`
    : x.t === 'ing' ? (x.u === 'g' ? `${x.q} g` : `${x.q} × ${x.u} (${Math.round(num(x.ug) * num(x.q))} g)`) : (EN ? 'kcal by hand' : 'kcal a mano');

  const btn = { fontFamily: FT, fontWeight: 900, fontSize: 13, padding: '11px 12px', borderRadius: 13, cursor: 'pointer', border: '2px solid rgba(255,255,255,0.12)', background: 'transparent', color: T.t2, flex: 1 };
  const inputSty = { font: `700 14px ${FT}`, color: T.t1, background: 'rgba(255,255,255,0.06)', border: '2px solid rgba(255,255,255,0.12)', borderRadius: 12, padding: '10px 12px', width: '100%', boxSizing: 'border-box', outline: 'none' };

  return createPortal(
    <div onClick={onCerrar} style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.72)', zIndex: 2000, display: 'flex', alignItems: 'flex-end', justifyContent: 'center' }}>
      <div onClick={(e) => e.stopPropagation()} style={{ width: '100%', maxWidth: 520, maxHeight: '88vh', display: 'flex', flexDirection: 'column', background: 'linear-gradient(180deg,#1d3a14,#142a0e)', border: '2px solid rgba(255,255,255,0.14)', borderBottom: 'none', borderRadius: '22px 22px 0 0', padding: '16px 16px 22px', boxSizing: 'border-box', animation: 'popIn 0.2s ease', color: T.t1 }}>
        <div style={{ fontSize: 16, fontWeight: 900, fontFamily: FT }}>{tit}</div>
        <div style={{ fontSize: 11.5, color: T.t2, fontFamily: FD, marginTop: 2 }}>{sub}</div>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'baseline', margin: '10px 0 0', padding: '8px 12px', borderRadius: 12, background: 'rgba(45,155,90,0.14)', border: `1.5px solid rgba(45,155,90,0.45)` }}>
          <b style={{ fontSize: 18, fontWeight: 900, fontFamily: FT }}>≈ {fmtKcal(total.kcal, lang)} kcal</b>
          <span style={{ fontSize: 11, color: T.t2, fontFamily: FD }}>{total.conMacros ? `P ${Math.round(total.p)} · H ${Math.round(total.h)} · G ${Math.round(total.g)}` : (EN ? 'no macros (kcal by hand)' : 'sin macros (kcal a mano)')}</span>
        </div>
        <div style={{ marginTop: 8 }}>
          <input value={q} onChange={(e) => setQ(e.target.value)} placeholder={EN ? 'Search… (chicken, egg, pasta)' : 'Buscar… (pechuga, huevo, pasta)'} autoComplete="off" style={inputSty} />
        </div>
        <div style={{ overflowY: 'auto', flex: 1, minHeight: 120, marginTop: 6, display: 'flex', flexDirection: 'column', gap: 6, scrollbarWidth: 'none' }}>
          {items.length > 0 && (<>
            <div style={{ fontSize: 10, color: T.au1, fontWeight: 900, textTransform: 'uppercase', letterSpacing: '0.1em', marginTop: 4, fontFamily: FT }}>{EN ? 'Chosen' : 'Elegido'}</div>
            {items.map((x, i) => { const v = kcalItem(x); const e = x.t === 'ing' && nutri ? nutri[x.n] : null; return (
              <div key={i} style={{ display: 'flex', alignItems: 'center', gap: 6, padding: '7px 10px', borderRadius: 11, background: 'rgba(201,162,39,0.10)', border: '1.5px solid rgba(201,162,39,0.4)' }}>
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div style={{ fontSize: 12.5, fontWeight: 800, fontFamily: FT, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{x.n}{x.e ? <span style={{ color: T.t3, fontWeight: 500 }}> · {EN ? 'estimated' : 'estimado'}</span> : null}</div>
                  <div style={{ fontSize: 10.5, color: T.t2, fontFamily: FD }}>{cantTxt(x)}</div>
                  {x.t === 'ing' && e && Array.isArray(e.u) && (e.u.length > 1 || x.u !== 'g') && (
                    <select value={x.u === 'g' ? '__g' : x.u} onChange={(ev) => unidad(i, ev.target.value)} style={{ marginTop: 3, font: `700 11px ${FD}`, color: T.t1, background: 'rgba(0,0,0,0.3)', border: '1px solid rgba(255,255,255,0.15)', borderRadius: 8, padding: '3px 6px' }}>
                      {e.u.map((uu) => <option key={uu[0]} value={uu[0]}>{uu[0]} ({uu[1]} g)</option>)}
                      <option value="__g">{EN ? 'grams' : 'gramos'}</option>
                    </select>)}
                </div>
                {x.t !== 'libre' && (<>
                  <button onClick={() => menos(i)} aria-label="−" style={{ font: `900 14px ${FT}`, width: 28, height: 28, borderRadius: 8, border: '1.5px solid rgba(255,255,255,0.18)', background: 'transparent', color: T.t1, cursor: 'pointer' }}>−</button>
                  <button onClick={() => mas(i)} aria-label="+" style={{ font: `900 14px ${FT}`, width: 28, height: 28, borderRadius: 8, border: '1.5px solid rgba(255,255,255,0.18)', background: 'transparent', color: T.t1, cursor: 'pointer' }}>+</button>
                </>)}
                <span style={{ fontSize: 12, fontWeight: 900, minWidth: 62, textAlign: 'right', fontFamily: FT }}>{fmtKcal(v.kcal, lang)} kcal</span>
                <button onClick={() => quitar(i)} aria-label={EN ? 'Remove' : 'Quitar'} style={{ font: `900 13px ${FT}`, width: 28, height: 28, borderRadius: 8, border: '1.5px solid rgba(255,255,255,0.18)', background: 'transparent', color: T.t2, cursor: 'pointer' }}>✕</button>
              </div>); })}
          </>)}
          {grupos.map((gr) => (
            <React.Fragment key={gr.k}>
              <div style={{ fontSize: 10, color: T.au1, fontWeight: 900, textTransform: 'uppercase', letterSpacing: '0.1em', marginTop: 6, fontFamily: FT }}>{gr.ic} {EN ? gr.titEn : gr.tit}</div>
              {gr.k === 'rec' && cargando && <div style={{ fontSize: 12, color: T.t3, fontFamily: FD, padding: '6px 10px' }}>{EN ? 'loading recipes…' : 'cargando recetas…'}</div>}
              {!gr.filas.length && !(gr.k === 'rec' && cargando) && <div style={{ fontSize: 12, color: T.t3, fontFamily: FD, padding: '6px 10px' }}>{EN ? 'No results' : 'Sin resultados'}</div>}
              {gr.filas.map((f, i) => gr.k === 'rec' ? (
                <button key={i} onClick={() => addRec(f.r)} style={{ display: 'flex', alignItems: 'center', gap: 8, padding: '8px 10px', borderRadius: 11, background: 'rgba(255,255,255,0.04)', border: '1.5px solid transparent', cursor: 'pointer', textAlign: 'left', color: T.t1, width: '100%' }}>
                  <span style={{ flex: 1, minWidth: 0 }}>
                    <span style={{ display: 'block', fontSize: 12.5, fontWeight: 800, fontFamily: FT, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{f.nom}</span>
                    <span style={{ display: 'block', fontSize: 10.5, color: T.t3, fontFamily: FD }}>{EN ? '1 serving' : '1 ración'} · P {Math.round(num(f.r.proteinas_g))} · H {Math.round(num(f.r.hidratos_g))} · G {Math.round(num(f.r.grasas_g))}</span>
                  </span>
                  <span style={{ fontSize: 12, fontWeight: 900, color: T.g2, fontFamily: FT, whiteSpace: 'nowrap' }}>{fmtKcal(num(f.r.calorias), lang)} kcal</span>
                </button>
              ) : (
                <button key={i} onClick={() => addAli(f.nom, f.e)} style={{ display: 'flex', alignItems: 'center', gap: 8, padding: '8px 10px', borderRadius: 11, background: 'rgba(255,255,255,0.04)', border: '1.5px solid transparent', cursor: 'pointer', textAlign: 'left', color: T.t1, width: '100%' }}>
                  <span style={{ flex: 1, minWidth: 0 }}>
                    <span style={{ display: 'block', fontSize: 12.5, fontWeight: 800, fontFamily: FT, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{f.nom}{f.e.e ? <span style={{ color: T.t3, fontWeight: 500 }}> · {EN ? 'estimated' : 'estimado'}</span> : null}</span>
                    <span style={{ display: 'block', fontSize: 10.5, color: T.t3, fontFamily: FD }}>1 {(f.e.u && f.e.u[0] && f.e.u[0][0]) || 'ración'} ({(f.e.u && f.e.u[0] && f.e.u[0][1]) || 100} g) · {Math.round(num(f.e.k))} kcal/100 g{f.e.d && f.e.d !== f.nom ? ` · ${f.e.d}` : ''}</span>
                  </span>
                  <span style={{ fontSize: 12, fontWeight: 900, color: T.g2, fontFamily: FT, whiteSpace: 'nowrap' }}>{fmtKcal(num(f.e.k) * ((f.e.u && f.e.u[0] && num(f.e.u[0][1])) || 100) / 100, lang)} kcal</span>
                </button>
              ))}
            </React.Fragment>
          ))}
        </div>
        {libre && (
          <div style={{ display: 'flex', gap: 6, marginTop: 8 }}>
            <input value={libreN} onChange={(e) => setLibreN(e.target.value)} placeholder={EN ? 'Other: what was it' : 'Otro: qué fue'} style={{ ...inputSty, flex: 1, width: 'auto' }} />
            <input value={libreK} onChange={(e) => setLibreK(e.target.value)} type="number" inputMode="numeric" placeholder="kcal" style={{ ...inputSty, width: 84 }} />
            <button onClick={addLibre} style={{ ...btn, flex: '0 0 auto', padding: '10px 14px' }}>＋</button>
          </div>
        )}
        <div style={{ display: 'flex', gap: 6, marginTop: 10, flexWrap: 'wrap' }}>
          <button onClick={() => setLibre((v) => !v)} style={btn}>{EN ? 'Other (kcal by hand)' : 'Otro (kcal a mano)'}</button>
          {modo !== 'extras' && <button onClick={() => onGuardar([], false)} style={btn}>{EN ? "I don't know" : 'No lo sé'}</button>}
          <button onClick={onCerrar} style={btn}>{EN ? 'Not now' : 'Ahora no'}</button>
          <button onClick={() => onGuardar(items, true)} style={{ ...btn, flex: '1 1 100%', border: `3px solid ${T.g3}`, background: `linear-gradient(135deg,${T.g1},${T.g2})`, color: T.wh, boxShadow: `0 4px 0 ${T.g3}` }}>{EN ? 'Save' : 'Guardar'}</button>
        </div>
      </div>
    </div>,
    document.body);
}

