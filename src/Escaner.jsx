import React from "react";
import { createPortal } from "react-dom";
import { limpiarCodigo, codigoValido, urlProducto, leerProducto, itemDesdeProducto } from "./codigoBarras";

// ─── Escáner de código de barras (MAESTRO-2026-1627) ───────────────────────────
// Se abre desde «¿Qué comiste?». Cámara trasera → código → Open Food Facts → gramos → ítem.
// El lector es el BarcodeDetector del navegador si sabe EAN (Chrome en Android); si no
// (Safari en iPhone), el mismo API hecho con ZXing en WebAssembly, que solo se descarga
// al abrir el escáner. Siempre se puede teclear el número. No guarda nada por su cuenta:
// devuelve el ítem por onAnadir y «¿Qué comiste?» lo suma como un alimento más.
const FT = "'Nunito',sans-serif", FD = "'DM Sans',sans-serif";
const FORMATOS = ['ean_13', 'ean_8', 'upc_a'];

async function crearDetector() {
  if (typeof window !== 'undefined' && 'BarcodeDetector' in window) {
    try {
      const sop = await window.BarcodeDetector.getSupportedFormats();
      if (sop.includes('ean_13')) return new window.BarcodeDetector({ formats: FORMATOS.filter((f) => sop.includes(f)) });
    } catch { /* se usa el de abajo */ }
  }
  const { BarcodeDetector } = await import("barcode-detector/ponyfill");
  return new BarcodeDetector({ formats: FORMATOS });
}

export function Escaner({ T, lang, onAnadir, onCerrar }) {
  const EN = lang === 'en';
  const videoRef = React.useRef(null);
  const streamRef = React.useRef(null);
  const vivoRef = React.useRef(true);
  const [fase, setFase] = React.useState('camara');      // camara · buscando · producto · error
  const [aviso, setAviso] = React.useState('');
  const [teclea, setTeclea] = React.useState('');
  const [prod, setProd] = React.useState(null);
  const [gramos, setGramos] = React.useState('');
  const [intento, setIntento] = React.useState(0);       // sube al pulsar «escanear otro»

  const pararCamara = () => {
    const s = streamRef.current; streamRef.current = null;
    if (s) s.getTracks().forEach((t) => { try { t.stop(); } catch { /* nada */ } });
  };

  const buscar = React.useCallback(async (cod) => {
    const c = limpiarCodigo(cod);
    if (!codigoValido(c)) { setAviso(EN ? 'That number is not a valid barcode.' : 'Ese número no es un código de barras válido.'); return; }
    pararCamara(); setFase('buscando'); setAviso('');
    const ctl = new AbortController(); const tope = setTimeout(() => ctl.abort(), 10000);
    try {
      const r = await fetch(urlProducto(c), { signal: ctl.signal });
      if (!r.ok && r.status !== 404) throw new Error(String(r.status));
      const p = leerProducto(await r.json().catch(() => null), c);
      if (!vivoRef.current) return;
      if (p.ok) { setProd(p); setGramos(String(p.porcion || 100)); setFase('producto'); return; }
      setFase('error');
      setAviso(p.motivo === 'no_encontrado'
        ? (EN ? 'This product is not in Open Food Facts yet. Search it by name or use «Other (kcal by hand)».' : 'Este producto aún no está en Open Food Facts. Búscalo por nombre o usa «Otro (kcal a mano)».')
        : p.motivo === 'sin_kcal'
          ? (EN ? `${p.nombre || 'This product'} has no calories in Open Food Facts. Use «Other (kcal by hand)» with the label.` : `${p.nombre || 'Este producto'} no tiene las calorías en Open Food Facts. Usa «Otro (kcal a mano)» con la etiqueta.`)
          : (EN ? 'The data for this product look wrong. Use «Other (kcal by hand)» with the label.' : 'Los datos de este producto no cuadran. Usa «Otro (kcal a mano)» con la etiqueta.'));
    } catch {
      if (!vivoRef.current) return;
      setFase('error');
      setAviso(EN ? 'Could not reach Open Food Facts. Check your connection and try again.' : 'No se pudo consultar Open Food Facts. Mira la conexión y vuelve a probar.');
    } finally { clearTimeout(tope); }
  }, [EN]);

  // Cámara + lectura cada 250 ms mientras la fase es «camara».
  React.useEffect(() => {
    if (fase !== 'camara') return undefined;
    let parar = false; let temp = null;
    (async () => {
      try {
        const st = await navigator.mediaDevices.getUserMedia({ video: { facingMode: { ideal: 'environment' }, width: { ideal: 1280 }, height: { ideal: 720 } }, audio: false });
        if (parar) { st.getTracks().forEach((t) => t.stop()); return; }
        streamRef.current = st;
        const v = videoRef.current; if (!v) return;
        v.srcObject = st; v.setAttribute('playsinline', ''); v.muted = true;
        await v.play().catch(() => {});
        const det = await crearDetector();
        const leer = async () => {
          if (parar) return;
          try {
            if (v.readyState >= 2) {
              const res = await det.detect(v);
              const val = res && res.find((x) => codigoValido(x.rawValue));
              if (val && !parar) { buscar(val.rawValue); return; }
            }
          } catch { /* un fotograma malo no para el escáner */ }
          temp = setTimeout(leer, 250);
        };
        leer();
      } catch (e) {
        if (parar) return;
        pararCamara();
        setAviso(e && e.name === 'NotAllowedError'
          ? (EN ? 'No camera permission. Type the number under the barcode.' : 'Sin permiso para la cámara. Teclea el número que hay debajo de las barras.')
          : (EN ? 'The camera could not start. Type the number under the barcode.' : 'No se pudo abrir la cámara. Teclea el número que hay debajo de las barras.'));
      }
    })();
    return () => { parar = true; if (temp) clearTimeout(temp); pararCamara(); };
  }, [fase, intento, buscar, EN]);

  React.useEffect(() => () => { vivoRef.current = false; pararCamara(); }, []);

  const otro = () => { setProd(null); setAviso(''); setTeclea(''); setFase('camara'); setIntento((n) => n + 1); };
  const g = parseFloat(String(gramos).replace(',', '.'));
  const gOk = g > 0 && g <= 3000;
  const kcalPorcion = prod && gOk ? Math.round(prod.k * g / 100) : null;

  const btn = { fontFamily: FT, fontWeight: 900, fontSize: 13, padding: '11px 12px', borderRadius: 13, cursor: 'pointer', border: '2px solid rgba(255,255,255,0.12)', background: 'transparent', color: T.t2, flex: 1 };
  const btnOk = { ...btn, border: `3px solid ${T.g3}`, background: `linear-gradient(135deg,${T.g1},${T.g2})`, color: T.wh, boxShadow: `0 4px 0 ${T.g3}` };
  const inputSty = { font: `700 14px ${FT}`, color: T.t1, background: 'rgba(255,255,255,0.06)', border: '2px solid rgba(255,255,255,0.12)', borderRadius: 12, padding: '10px 12px', boxSizing: 'border-box', outline: 'none' };
  const chip = (on) => ({ font: `800 12px ${FT}`, padding: '6px 10px', borderRadius: 10, cursor: 'pointer', border: `1.5px solid ${on ? T.g2 : 'rgba(255,255,255,0.18)'}`, background: on ? 'rgba(45,155,90,0.18)' : 'transparent', color: T.t1 });

  return createPortal(
    <div onClick={onCerrar} style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.8)', zIndex: 2100, display: 'flex', alignItems: 'flex-end', justifyContent: 'center' }}>
      <div onClick={(e) => e.stopPropagation()} style={{ width: '100%', maxWidth: 520, maxHeight: '92vh', overflowY: 'auto', background: 'linear-gradient(180deg,#1d3a14,#142a0e)', border: '2px solid rgba(255,255,255,0.14)', borderBottom: 'none', borderRadius: '22px 22px 0 0', padding: '16px 16px 22px', boxSizing: 'border-box', color: T.t1 }}>
        <div style={{ fontSize: 16, fontWeight: 900, fontFamily: FT }}>📷 {EN ? 'Scan a barcode' : 'Escanea el código de barras'}</div>
        <div style={{ fontSize: 11.5, color: T.t2, fontFamily: FD, marginTop: 2 }}>{EN ? 'For packaged products. Point at the bars and hold still.' : 'Para productos envasados. Apunta a las barras y quédate quieto un momento.'}</div>

        {fase === 'camara' && (
          <div style={{ position: 'relative', marginTop: 10, borderRadius: 14, overflow: 'hidden', background: '#000', aspectRatio: '4 / 3' }}>
            <video ref={videoRef} playsInline muted autoPlay style={{ width: '100%', height: '100%', objectFit: 'cover', display: 'block' }} />
            <div style={{ position: 'absolute', left: '10%', right: '10%', top: '38%', bottom: '38%', border: `3px solid ${T.g2}`, borderRadius: 10, boxShadow: '0 0 0 2000px rgba(0,0,0,0.28)' }} />
          </div>
        )}
        {fase === 'buscando' && <div style={{ marginTop: 14, fontSize: 13, color: T.t2, fontFamily: FD }}>{EN ? 'Looking it up…' : 'Buscando el producto…'}</div>}

        {fase === 'producto' && prod && (
          <div style={{ marginTop: 10, padding: '10px 12px', borderRadius: 13, background: 'rgba(201,162,39,0.10)', border: '1.5px solid rgba(201,162,39,0.4)' }}>
            <div style={{ fontSize: 14, fontWeight: 900, fontFamily: FT }}>{prod.nombre}</div>
            {prod.marca && <div style={{ fontSize: 11.5, color: T.t2, fontFamily: FD }}>{prod.marca}</div>}
            <div style={{ fontSize: 11.5, color: T.t2, fontFamily: FD, marginTop: 4 }}>{EN ? 'Per 100 g' : 'Por 100 g'}: <b style={{ color: T.t1 }}>{Math.round(prod.k)} kcal</b> · P {prod.p} · H {prod.h} · G {prod.g}</div>
            <div style={{ display: 'flex', gap: 6, alignItems: 'center', marginTop: 10, flexWrap: 'wrap' }}>
              <input value={gramos} onChange={(e) => setGramos(e.target.value)} type="number" inputMode="decimal" style={{ ...inputSty, width: 96 }} aria-label={EN ? 'grams' : 'gramos'} />
              <span style={{ fontSize: 12.5, fontWeight: 800, fontFamily: FT }}>g</span>
              {prod.porcion && <button onClick={() => setGramos(String(prod.porcion))} style={chip(g === prod.porcion)}>{EN ? 'serving' : 'porción'} {prod.porcion} g</button>}
              <button onClick={() => setGramos('100')} style={chip(g === 100)}>100 g</button>
            </div>
            <div style={{ fontSize: 18, fontWeight: 900, fontFamily: FT, marginTop: 8 }}>{kcalPorcion != null ? `≈ ${kcalPorcion} kcal` : (EN ? 'Type the grams' : 'Pon los gramos')}</div>
          </div>
        )}

        {aviso && <div style={{ marginTop: 10, fontSize: 12.5, color: T.t1, fontFamily: FD, padding: '8px 10px', borderRadius: 11, background: 'rgba(255,255,255,0.06)' }}>{aviso}</div>}

        {fase !== 'producto' && (
          <div style={{ display: 'flex', gap: 6, marginTop: 10 }}>
            <input value={teclea} onChange={(e) => setTeclea(e.target.value)} onKeyDown={(e) => { if (e.key === 'Enter') buscar(teclea); }} inputMode="numeric" placeholder={EN ? 'Or type the number (8 or 13 digits)' : 'O teclea el número (8 o 13 cifras)'} style={{ ...inputSty, flex: 1, minWidth: 0 }} />
            <button onClick={() => buscar(teclea)} style={{ ...btn, flex: '0 0 auto', padding: '10px 14px' }}>{EN ? 'Search' : 'Buscar'}</button>
          </div>
        )}

        <div style={{ display: 'flex', gap: 6, marginTop: 12, flexWrap: 'wrap' }}>
          {(fase === 'producto' || fase === 'error') && <button onClick={otro} style={btn}>{EN ? 'Scan another' : 'Escanear otro'}</button>}
          <button onClick={onCerrar} style={btn}>{EN ? 'Close' : 'Cerrar'}</button>
          {fase === 'producto' && prod && <button disabled={!gOk} onClick={() => onAnadir(itemDesdeProducto(prod, g))} style={{ ...btnOk, flex: '1 1 100%', opacity: gOk ? 1 : 0.5 }}>{EN ? 'Add' : 'Añadir'}{kcalPorcion != null ? ` · ${kcalPorcion} kcal` : ''}</button>}
        </div>
        <div style={{ fontSize: 10, color: T.t3, fontFamily: FD, marginTop: 10, textAlign: 'center' }}>{EN ? 'Data: Open Food Facts (ODbL), filled in by its users.' : 'Datos: Open Food Facts (ODbL), los rellenan sus usuarios.'}</div>
      </div>
    </div>,
    document.body);
}
