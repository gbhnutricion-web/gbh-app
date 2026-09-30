// ─── Pasos del móvil · el ciclo dentro de la app (30-sep-2026) ─────────────────────
// 07. App GBH/BRIEF_pasos.md. Sin botones (orden de Alejandro, 29-sep: «automático y en vivo»):
//  1. Con el interruptor del operador encendido (profiles.pasos_movil_activo), en la app de
//     tienda, el permiso se pide SOLO la primera vez que Inicio está a la vista y sin nada
//     encima (tutorial, PIN, tarjeta de avisos). El diálogo es del sistema; se pide una vez.
//  2. Con permiso: el sensor cuenta cada paso y el total del sistema se relee al abrir, al volver
//     a primer plano y cada minuto. contadorVivo (motorPasos) los junta sin bajar nunca.
//  3. Se guarda con debeGuardar: como mucho una vez por minuto, en el acto al cruzar 10.000 y
//     al irse a segundo plano. guardarPasos es updSteps de App.jsx (misma meta, XP y racha).
//  4. Rastro para medir (profiles.pasos_movil): al pedir el permiso y una vez al día.
// La web no entra aquí: `nativo` es false y todo se queda en 'oculto'.
import { useState, useEffect, useRef, useCallback } from 'react';
import { disponibilidadPasos, permisoPasos, pedirPermisoPasos, leerHoyPasos, leerSemanaPasos,
  encenderSensorPasos, plataformaPasos, fuentePasos, abrirAjustesPasos, abrirInstalarHealthConnect } from './pasosNativos';
import { contadorVivo, debeGuardar, estadoPasos, claveDia } from './motorPasos';

export const REFRESCO_BASE_MS = 60000;   // el total del sistema se relee cada minuto con la app delante
export const ESPERA_PEDIR_MS = 1500;     // el permiso se pide con Inicio ya asentado, no de golpe

export function usePasosMovil({ nativo, activo, perfilId, hoyKey, puedePedir, pasosGuardados,
  guardarPasos, guardarRastro, leerLocal, escribirLocal }) {
  const kCfg = perfilId ? `gbh:pasosMovil:${perfilId}` : null;
  const [cfg, setCfg] = useState(() => (kCfg && leerLocal(kCfg, null)) || {});   // {pedido, desde} en ESTE móvil
  const [disp, setDisp] = useState('desconocida');
  const [perm, setPerm] = useState({ total: 'pendiente', sensor: 'pendiente' });
  const [pasos7d, setPasos7d] = useState(null);
  const [total, setTotal] = useState(0);
  const [ocupado, setOcupado] = useState(false);
  const cont = useRef(null);
  const guardadoAt = useRef(0);
  const refs = useRef({});
  refs.current = { pasosGuardados, guardarPasos, guardarRastro, leerLocal, escribirLocal, pasos7d, perm, cfg, perfilId };

  useEffect(() => { setCfg((kCfg && leerLocal(kCfg, null)) || {}); }, [kCfg]);   // el perfil llega después del primer render

  const plataforma = nativo ? plataformaPasos() : 'web';
  // Health Connect no distingue «nunca preguntado» de «denegado»: si ya se pidió en este móvil
  // y no está concedido, es que dijo que no.
  const permiso = perm.total === 'concedido' ? 'concedido'
    : perm.total === 'denegado' ? 'denegado'
    : (plataforma === 'android' && cfg.pedido) ? 'denegado' : 'pendiente';
  const estado = !nativo || !activo || disp === 'desconocida' ? 'oculto'
    : estadoPasos({ nativo, activo, disponibilidad: disp, permiso, pasos7d, desde: cfg.desde, ahora: new Date() });
  const leyendo = nativo && activo && disp === 'disponible' && permiso === 'concedido';

  const guardarCfg = useCallback((parcial) => {
    setCfg((prev) => {
      const nuevo = { ...prev, ...parcial };
      if (kCfg) refs.current.escribirLocal(kCfg, nuevo);
      return nuevo;
    });
  }, [kCfg]);

  const rastro = useCallback((parcial) => {
    try { refs.current.guardarRastro({ plataforma: plataformaPasos(), fuente: fuentePasos(), ...parcial }); } catch { /* el rastro no manda */ }
  }, []);

  // 0 · Disponibilidad y permiso: al entrar y al volver a primer plano (pudo darlo en Ajustes).
  const mirar = useCallback(async () => {
    const d = await disponibilidadPasos();
    setDisp(d);
    if (d === 'disponible') setPerm(await permisoPasos());
  }, []);
  useEffect(() => {
    if (!nativo || !activo || !perfilId) return;
    const onVis = () => { if (!document.hidden) mirar().catch(() => {}); };
    onVis();
    document.addEventListener('visibilitychange', onVis);
    return () => document.removeEventListener('visibilitychange', onVis);
  }, [nativo, activo, perfilId, mirar]);

  // Permiso visto concedido sin fecha (se dio en Ajustes, o se borró el almacén): desde ahora.
  useEffect(() => {
    if (permiso === 'concedido' && !cfg.desde && perfilId) guardarCfg({ desde: new Date().toISOString() });
  }, [permiso, cfg.desde, perfilId, guardarCfg]);

  // 1 · Pedir el permiso SOLO, una vez por móvil, con Inicio a la vista y sin nada encima.
  useEffect(() => {
    if (estado !== 'pedir' || disp !== 'disponible' || !puedePedir || ocupado || cfg.pedido || !perfilId) return;
    const t = setTimeout(async () => {
      if (document.hidden) return;
      setOcupado(true);
      try {
        let r = await pedirPermisoPasos();
        if (r.total === 'error') r = await permisoPasos();
        // iPhone: CoreMotion puede contestar antes que el paciente, y el diálogo del sistema no
        // cambia la visibilidad de la página. Se vuelve a MIRAR (nunca a pedir) cada 1,5 s durante
        // 30 s, para que el vivo arranque en cuanto diga que sí, sin tener que reabrir la app.
        for (let i = 0; i < 20 && r.total === 'pendiente' && plataformaPasos() === 'ios'; i++) {
          await new Promise((ok) => setTimeout(ok, 1500));
          r = await permisoPasos();
        }
        const ahora = new Date().toISOString();
        guardarCfg({ pedido: ahora, ...(r.total === 'concedido' ? { desde: ahora } : {}) });
        setPerm(r);
        rastro({ estado: r.total, sensor: r.sensor, pedido: ahora });
      } finally { setOcupado(false); }
    }, ESPERA_PEDIR_MS);
    return () => clearTimeout(t);
  }, [estado, disp, puedePedir, ocupado, cfg.pedido, perfilId, guardarCfg, rastro]);

  // 2 y 3 · Contar en vivo y guardar. Se rearma al cambiar de día (hoyKey).
  useEffect(() => {
    if (!leyendo) return;
    let cancelado = false, apagar = null, arrancando = false;
    const hoy = () => claveDia(new Date());
    const guardar = (forzar) => {
      const c = cont.current;
      if (!c || c.dia !== hoy()) return;                      // jamás el total de otro día
      if (!debeGuardar({ valor: c.total, guardado: refs.current.pasosGuardados, guardadoAt: guardadoAt.current, ahora: Date.now(), forzar })) return;
      guardadoAt.current = Date.now();
      try { refs.current.guardarPasos(c.total); } catch { /* reintenta en el siguiente paso */ }
    };
    const aplicar = (ev) => {
      cont.current = contadorVivo(cont.current, ev, hoy());
      setTotal(cont.current.total);
      guardar(false);
    };
    const leerBase = async () => {
      const r = await leerHoyPasos(new Date());
      if (cancelado || !r) return;
      aplicar({ tipo: 'base', pasos: r.pasos, dia: r.dia });
      const kR = `gbh:pasosRastro:${refs.current.perfilId}:${r.dia}`;
      if (!refs.current.leerLocal(kR, false)) {
        refs.current.escribirLocal(kR, true);
        rastro({ estado: 'leyendo', sensor: refs.current.perm.sensor, ultimaLectura: new Date().toISOString(),
          hoy: cont.current ? cont.current.total : r.pasos, pasos7d: refs.current.pasos7d });
      }
    };
    const encender = async () => {
      if (cancelado || apagar || arrancando) return;
      arrancando = true;
      try {
        aplicar({ tipo: 'reinicio' });
        const off = await encenderSensorPasos((n) => { if (!cancelado) aplicar({ tipo: 'sensor', pasos: n }); });
        if (cancelado) { off(); return; }
        apagar = off;
        await leerBase();
        const s = await leerSemanaPasos(new Date());
        if (!cancelado && s !== null) setPasos7d(s);
      } finally { arrancando = false; }
    };
    // El sensor sigue encendido en segundo plano mientras viva la app (Android lo pausa y lo
    // reanuda sin perder la cuenta; iPhone la entrega al volver). Al irse, se guarda lo contado.
    const onVis = () => { if (document.hidden) guardar(true); else leerBase().catch(() => {}); };
    encender().catch(() => {});
    const tmr = setInterval(() => { if (!document.hidden) leerBase().catch(() => {}); }, REFRESCO_BASE_MS);
    document.addEventListener('visibilitychange', onVis);
    return () => {
      cancelado = true;
      clearInterval(tmr);
      document.removeEventListener('visibilitychange', onVis);
      guardar(true);
      if (apagar) { const off = apagar; apagar = null; off(); }
    };
  }, [leyendo, hoyKey, rastro]);

  return {
    estado, plataforma, total, ocupado, sensor: perm.sensor,
    reintentar: () => { mirar().catch(() => {}); },
    abrirAjustes: () => { abrirAjustesPasos(); },
    instalar: () => { abrirInstalarHealthConnect(); },
  };
}
