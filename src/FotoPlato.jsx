import React from "react";
import { createPortal } from "react-dom";
import { itemsDesdeFoto, mensajeFoto, olvidarEstadoFoto } from "./fotoIA";

// ─── «¿Qué comiste?» con foto (MAESTRO-2026-1629, por orden de Alejandro) ──────
// El paciente hace (o elige) la foto del plato; la app la reduce a ≤ 1024 px y la manda a
// /foto/estimar (Railway), que se la pasa a Claude y devuelve alimentos de NUESTRA tabla con
// gramos. Los ítems vuelven a «¿Qué comiste?» marcados «estimado», donde se corrigen o se quitan
// antes de guardar. La foto no se guarda en ningún sitio. La primera vez pide permiso: dice que
// la foto va a Anthropic (base legal: política de privacidad, encargado Anthropic desde la v4).
const FT = "'Nunito',sans-serif", FD = "'DM Sans',sans-serif";
const LADO = 1024;

function reducir(file) {
  return new Promise((ok, mal) => {
    const url = URL.createObjectURL(file);
    const im = new Image();
    im.onload = () => {
      try {
        const k = Math.min(1, LADO / Math.max(im.naturalWidth || 1, im.naturalHeight || 1));
        const c = document.createElement('canvas');
        c.width = Math.max(1, Math.round(im.naturalWidth * k)); c.height = Math.max(1, Math.round(im.naturalHeight * k));
        c.getContext('2d').drawImage(im, 0, 0, c.width, c.height);
        const d = c.toDataURL('image/jpeg', 0.8);
        URL.revokeObjectURL(url);
        ok(d.slice(d.indexOf(',') + 1));
      } catch (e) { URL.revokeObjectURL(url); mal(e); }
    };
    im.onerror = () => { URL.revokeObjectURL(url); mal(new Error('imagen')); };
    im.src = url;
  });
}

export function FotoPlato({ T, lang, servidor, sesion, estado, nutri, onAnadir, onCerrar }) {
  const EN = lang === 'en';
  const [consentido, setConsentido] = React.useState(!!(estado && estado.consentido));
  const [fase, setFase] = React.useState(consentido ? 'elegir' : 'permiso');   // permiso · elegir · enviando · error
  const [aviso, setAviso] = React.useState('');
  const inputRef = React.useRef(null);
  const vivo = React.useRef(true);
  React.useEffect(() => () => { vivo.current = false; }, []);
  const cab = { 'Content-Type': 'application/json', 'X-GBH-Sesion': (sesion && sesion.token) || '' };

  const aceptar = async () => {
    setFase('enviando'); setAviso('');
    try {
      const r = await fetch(`${servidor}/foto/consentir`, { method: 'POST', headers: cab });
      if (!r.ok) throw new Error(String(r.status));
      olvidarEstadoFoto();                         // la próxima vez el estado ya dirá «consentido»
      if (vivo.current) { setConsentido(true); setFase('elegir'); }
    } catch { if (vivo.current) { setFase('error'); setAviso(mensajeFoto('red', EN)); } }
  };

  const enviar = async (file) => {
    if (!file) return;
    setFase('enviando'); setAviso('');
    let img;
    try { img = await reducir(file); } catch { setFase('error'); setAviso(mensajeFoto('imagen', EN)); return; }
    const ctl = new AbortController(); const tope = setTimeout(() => ctl.abort(), 60000);
    try {
      const r = await fetch(`${servidor}/foto/estimar`, { method: 'POST', headers: cab, body: JSON.stringify({ imagen: img, tipo: 'image/jpeg' }), signal: ctl.signal });
      const d = await r.json().catch(() => null);
      if (!vivo.current) return;
      if (!r.ok) { setFase('error'); setAviso(mensajeFoto(d && d.detail, EN)); return; }
      const its = itemsDesdeFoto(d, nutri);
      if (!its.length) { setFase('error'); setAviso(mensajeFoto('sin_comida', EN)); return; }
      olvidarEstadoFoto();                         // «quedan_hoy» ha cambiado
      onAnadir(its);
    } catch { if (vivo.current) { setFase('error'); setAviso(mensajeFoto('red', EN)); } }
    finally { clearTimeout(tope); }
  };

  const btn = { fontFamily: FT, fontWeight: 900, fontSize: 14, padding: '12px 14px', borderRadius: 13, cursor: 'pointer', border: '2px solid rgba(255,255,255,0.14)', background: 'transparent', color: T.t2, width: '100%' };
  const prim = { ...btn, border: `3px solid ${T.g3}`, background: `linear-gradient(135deg,${T.g1},${T.g2})`, color: T.wh, boxShadow: `0 4px 0 ${T.g3}` };
  const quedan = estado && Number.isFinite(estado.quedan_hoy) ? estado.quedan_hoy : null;

  return createPortal(
    <div onClick={onCerrar} style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.78)', zIndex: 2100, display: 'flex', alignItems: 'flex-end', justifyContent: 'center' }}>
      <div onClick={(e) => e.stopPropagation()} style={{ width: '100%', maxWidth: 520, background: 'linear-gradient(180deg,#1d3a14,#142a0e)', border: '2px solid rgba(255,255,255,0.14)', borderBottom: 'none', borderRadius: '22px 22px 0 0', padding: '18px 16px 24px', boxSizing: 'border-box', color: T.t1, display: 'flex', flexDirection: 'column', gap: 10 }}>
        <div style={{ fontSize: 16, fontWeight: 900, fontFamily: FT }}>📸 {EN ? 'Photo of your plate' : 'Foto de tu plato'}</div>
        {fase === 'permiso' && (<>
          <div style={{ fontSize: 13, color: T.t2, fontFamily: FD, lineHeight: 1.45 }}>
            {EN
              ? <>To work out what is on the plate and how much it weighs, the photo is sent to <b>Anthropic (Claude)</b>, an AI. Neither Anthropic nor GBH keep it. What comes back is an <b>estimate</b>: check the grams before you save.</>
              : <>Para saber qué hay en el plato y cuánto pesa, la foto se envía a <b>Anthropic (Claude)</b>, una IA. Ni Anthropic ni GBH la guardan. Lo que sale es una <b>estimación</b>: revisa los gramos antes de guardar.</>}
          </div>
          <a href="/legal/" target="_blank" rel="noopener noreferrer" style={{ fontSize: 12, color: T.au1, fontFamily: FD }}>{EN ? 'Privacy policy' : 'Política de privacidad'}</a>
          <button onClick={aceptar} style={prim}>{EN ? 'OK, use the photo' : 'De acuerdo, usar la foto'}</button>
          <button onClick={onCerrar} style={btn}>{EN ? 'Not now' : 'Ahora no'}</button>
        </>)}
        {fase === 'elegir' && (<>
          <div style={{ fontSize: 13, color: T.t2, fontFamily: FD, lineHeight: 1.45 }}>
            {EN ? 'Take it from above, with the whole plate in view. You will be able to fix every food before saving.' : 'Hazla desde arriba, con el plato entero a la vista. Podrás corregir cada alimento antes de guardar.'}
            {quedan !== null && <span style={{ display: 'block', marginTop: 4, color: T.t3, fontSize: 11.5 }}>{EN ? `Photos left today: ${quedan}` : `Fotos que te quedan hoy: ${quedan}`}</span>}
          </div>
          <input ref={inputRef} type="file" accept="image/*" capture="environment" style={{ display: 'none' }} onChange={(e) => { const f = e.target.files && e.target.files[0]; e.target.value = ''; enviar(f); }} />
          <button onClick={() => inputRef.current && inputRef.current.click()} style={prim}>{EN ? 'Take or choose a photo' : 'Hacer o elegir foto'}</button>
          <button onClick={onCerrar} style={btn}>{EN ? 'Cancel' : 'Cancelar'}</button>
        </>)}
        {fase === 'enviando' && (
          <div style={{ padding: '22px 0', textAlign: 'center', fontSize: 14, fontWeight: 800, fontFamily: FT, color: T.t2 }}>{EN ? 'Looking at your plate…' : 'Mirando tu plato…'}</div>
        )}
        {fase === 'error' && (<>
          <div style={{ fontSize: 13, color: T.t1, fontFamily: FD, lineHeight: 1.45, padding: '8px 10px', borderRadius: 11, background: 'rgba(201,162,39,0.10)', border: '1.5px solid rgba(201,162,39,0.4)' }}>{aviso}</div>
          <button onClick={() => { setFase(consentido ? 'elegir' : 'permiso'); setAviso(''); }} style={prim}>{EN ? 'Try again' : 'Volver a probar'}</button>
          <button onClick={onCerrar} style={btn}>{EN ? 'Close' : 'Cerrar'}</button>
        </>)}
      </div>
    </div>,
    document.body);
}
