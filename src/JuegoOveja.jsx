// ─── El Salto del Rebaño · juego de la oveja ───────────────────────────────────
// Sacado de App.jsx el 10-nov-2026 (MAESTRO-2026-1234) TAL CUAL, para cargarlo aparte: App.jsx lo
// importa con React.lazy y lo precarga tras pintar. Lo que usaba del módulo de App llega por import.
import React, { useState, useEffect, useCallback, useMemo, useRef } from "react";
import { SPR, U, sprite, bloque, suelo as dibujarSuelo, matas } from "./juego32";
import { CORONA, CORONA_PAL, T, alpha, buildPixels, buildPixelsEstado, jfx, sbReq } from "./App.jsx";

export default function JuegoOveja({ color, equipados, nombre, onSalir, partidasProp, onPagarYJugar, arrancarRef,
  puntosHoy = 0, puntosSemana = 0, onFinPartida, perfilId = null,
  scoreRef = null, onScoreVivo = null, esperaSeg = 0, cargandoPartidas = false }) {
  const canvasRef = useRef(null);
  // Clave ESTABLE de los accesorios: el efecto del juego depende de ella y no del
  // array. Un array nuevo con el mismo contenido (perfil releído del servidor a
  // media partida) reiniciaba el bucle: la oveja volvía al principio y la
  // dificultad a cero, con el marcador de antes todavía en pantalla.
  const eqKey = Array.isArray(equipados) ? equipados.join(",") : "";
  const tapRef = useRef(null);      // handler del toque expuesto al JSX (sobrevive re-renders)
  const [modoElegido, setModoElegido] = useState("noche");   // juego seleccionado en la pantalla previa
  const [jugando, setJugando] = useState(false);
  const [fin, setFin] = useState(false);
  const [score, setScore] = useState(0);
  const [best, setBest] = useState(0);
  const [cuenta, setCuenta] = useState(0); // 5..1 countdown; 0 = jugando
  // ── Aviso al retado: duelos recibidos desde la última visita (§ tabla duelos) ──
  const [avisoDuelos, setAvisoDuelos] = useState(null);
  useEffect(() => {
    if (!perfilId) return;
    let vivoA = true;
    (async () => {
      try {
        const pf = await sbReq("GET", `profiles?id=eq.${perfilId}&select=duelos_vistos_at`);
        const desde = Array.isArray(pf) && pf[0] ? pf[0].duelos_vistos_at : null;
        const filtro = desde ? `&creado=gt.${encodeURIComponent(desde)}` : "";
        const filas = await sbReq("GET", `duelos?rival_id=eq.${perfilId}${filtro}&select=gana,puntos`);
        if (!vivoA || !Array.isArray(filas) || filas.length === 0) return;
        // gana = ganó el retador → para mí, derrota
        const derrotas = filas.filter(f => f.gana).length;
        const victorias = filas.length - derrotas;
        const saldo = filas.reduce((s, f) => s + (f.gana ? -(f.puntos || 0) : (f.puntos || 0)), 0);
        setAvisoDuelos({ total: filas.length, victorias, derrotas, saldo });
        sbReq("PATCH", `profiles?id=eq.${perfilId}`, { duelos_vistos_at: new Date().toISOString() }).catch(() => {});
      } catch {}
    })();
    return () => { vivoA = false; };
  }, [perfilId]);

  // Al terminar cada partida, sus puntos se suman al marcador diario y semanal
  useEffect(() => { if (fin) onFinPartida && onFinPartida(score); }, [fin]);

  // El padre necesita el marcador VIVO: si el paciente sale con la ✕ o cierra la
  // app a media partida, la partida se registra igualmente con lo conseguido
  // hasta ese instante (nunca con 0, y nunca sin registrar → sin exploits).
  useEffect(() => {
    const vivo = jugando && !fin ? score : null;
    if (scoreRef) scoreRef.current = vivo;
    if (onScoreVivo) onScoreVivo(vivo);
  }, [score, jugando, fin]);

  useEffect(() => {
    if (!jugando) return;
    const cv = canvasRef.current;
    const ctx = cv.getContext("2d");
    // Lienzo LÓGICO fijo 340×680; el buffer real se ajusta a pantalla × devicePixelRatio
    // → se acabaron los gráficos reescalados: cada frame se dibuja a resolución nativa
    const W = 340, H = 680, suelo = H - 52;
    const S = 2.5, SH = 32 * S, SX = 36;   // 32x32 a S=2.5 -> SH sigue siendo 80: la física no cambia
    const ajustarBuffer = () => {
      const r = cv.getBoundingClientRect();
      const dpr = Math.min(window.devicePixelRatio || 1, 3);
      cv.width  = Math.max(1, Math.round((r.width  || W) * dpr));
      cv.height = Math.max(1, Math.round((r.height || H) * dpr));
    };
    ajustarBuffer();
    const px = buildPixels(color, equipados);
    const pxFeliz = buildPixelsEstado(color, equipados, "feliz");
    const pxTriste = buildPixelsEstado(color, equipados, "triste");
    // pintarBo del brief: tramos [x, y, ancho, hex] a cualquier escala y posición
    const pintarTramos = (tr, x, y, esc) => tr.forEach(([tx2, ty2, tw, c]) =>
      { ctx.fillStyle = c; ctx.fillRect(x + tx2 * esc, y + ty2 * esc, tw * esc + 0.5, esc + 0.5); });

    // ── Temas de juego: el consumible transforma el modo completo ──
    const TEMAS = {
      noche: {
        familia: "runner",
        cielo: "#4A2C4E", cieloBottom: "#C25E3A", suelo: T.g3, hierba: "#3E7A2A",   // hex: matas()/tonos() no admite rgba()
        sol: "rgba(255,210,120,0.55)",
        obstaculo: "lobo",            // lobos que saltar
        volador: "cuervo",            // cuervos que rebotan
        nubeColor: "rgba(255,200,160,0.18)",
      },
      oro: {
        familia: "plataformas",
        cielo: "#3A2A5A", cieloBottom: "#8A5A9E", suelo: "#6B4A2A", hierba: "rgba(255,200,100,0.4)",
        nubeColor: "rgba(255,220,180,0.14)",
      },
      vuelo: {
        familia: "vuelo",
        cielo: "#6EC6E8", cieloBottom: "#E8F5D8",
        nubeColor: "rgba(255,255,255,0.6)",
      },
      jefe: {
        familia: "shooter",
        cielo: "#2A1E36", cieloBottom: "#3E2C4E", suelo: "#3A2F44", hierba: "rgba(180,150,220,0.25)",
        nubeColor: "rgba(0,0,0,0)",
      },
      duelo: {
        familia: "duelo",
        cielo: "#3E2C5E", cieloBottom: "#1E3A2A",
        nubeColor: "rgba(0,0,0,0)",
      },
    };
    // Icono del consumible según a qué modo lleva
    const ICONO_MODO = { noche: "🌙", oro: "💲", vuelo: "✈️", jefe: "🎯", duelo: "⚔️" };
    const otroModo = (actual) => {
      // Nunca repite el último destino: garantiza variedad real entre transiciones
      let otros = Object.keys(TEMAS).filter(m => m !== actual && m !== st.ultimoDestino);
      if (otros.length === 0) otros = Object.keys(TEMAS).filter(m => m !== actual);
      const destino = otros[Math.floor(Math.random() * otros.length)];
      st.ultimoDestino = destino;
      return destino;
    };
    // Se arranca en el juego ELEGIDO en la pantalla previa
    const modoInicial = TEMAS[modoElegido] ? modoElegido : "noche";

    const st = { y: suelo - SH, vy: 0, modo: modoInicial, transicion: 0,
      vallas: TEMAS[modoInicial].familia === "runner"
        ? [{ tipo: TEMAS[modoInicial].obstaculo, x: W + 60, w: 20, h: 52, ok: false }] : [],
      consumibles: [], desdeConsumible: 0, graciaTransicion: 50, mismos: 0,
      monedas: [], suelos: [{ x: -20, w: W + 60, top: suelo }], sx: SX, enSuelo: true,
      corales: [], balas: [], balasJefe: [], jefe: null, jefeNivel: 0, flotantes: [],
      carril: 1, objetos: [], olaCad: 0, faseCamino: 0, flechaFlash: null,
      vel: 4.2, score: 0, frames: 0, vivo: true, duelosGanados: 0, nubes: [
      { x: 50, y: 70 }, { x: 190, y: 130 }, { x: 280, y: 45 }],
    };
    // ── Economía del duelo ────────────────────────────────────────────────────
    // Hay DOS marcadores distintos y no deben mezclarse:
    //   1) El robo PvP (±100 semanales) lo resuelve el servidor en resolver_duelo.
    //      Es de suma cero: lo que gano yo lo pierde el rival. No pasa por st.score
    //      o se contaría dos veces al cerrar la partida (registrar_partida_juego).
    //   2) El botín de partida (esto): puntos de arcade que SÍ suben el marcador
    //      de arriba a la derecha y escalan con la racha de duelos de esta partida.
    //      1ª victoria 120 · 2ª 240 · 3ª 360 … así encadenar duelos renta de verdad.
    //      Era 40 hasta el 22-ago-2026: ver la tabla de pagos, unas líneas abajo.
    const PTS_DUELO_BASE = 120;
    const botinDuelo = (n) => PTS_DUELO_BASE * n;
    // ── Economía del vuelo (recalibrada 22-ago-2026) ─────────────────────────
    // El anillo pagaba 10. Medido por simulación del desove (200 partidas de
    // 5 min, jugador que toma todos los anillos): arcos de 2-3 anillos cada ~74
    // fotogramas ⇒ 1.205 pts/min, x2,6 el runner (467), x4,8 el oro (253) y el
    // jefe (235). Tres razones que se suman:
    //   · el premio por evento era 2,5 veces el del runner (10 vs 4) sin que el
    //     evento costase más;
    //   · la cadencia del vuelo es por FOTOGRAMA, no por distancia, así que el
    //     grifo no espera a que el juego acelere: paga a tope desde el segundo
    //     uno, mientras el runner arranca a velocidad 4,2 de 7,6.
    //   · y encima es el modo MÁS seguro: sin gravedad, la avioneta se queda
    //     donde la dejas y su aire está capado a 5,08 cuando el resto llega a 7,6.
    // Máxima recompensa con mínimo riesgo, que es el sesgo que vacía el ranking.
    // Con 4 queda a la par del runner (482 vs 467 pts/min medidos). Es el único
    // número que hay que tocar para recalibrar el modo: súbelo a 5 si se quiere
    // dejarlo un 30 % por encima, bájalo a 3 para ponerlo al nivel del oro.
    const PTS_ANILLO = 4;
    // ── Tabla de pagos de los cinco modos (rebalanceada 22-ago-2026) ─────────
    // Medida con `equilibrio_juegos.py` (junto a este fichero), que replica los
    // desovadores y calcula el grifo de cada modo con jugador perfecto.
    //   ANTES: vuelo 1.205 · runner 467 · oro 253 · jefe 235 · duelo 92 pts/min.
    //   AHORA: oro 504 · vuelo 482 · runner 467 (referencia, sin tocar) ·
    //          jefe 408 (al 65 % de acierto) · duelo 247 pts por PARTIDA.
    // El vuelo pagaba x2,6 el segundo y x5 el cuarto: quien elegía la esfera
    // azul subía en el ranking semanal por elegirla, no por jugar mejor.
    // Tres cosas que hay que tener presentes antes de volver a tocar estos números:
    //   · El runner es el ÚNICO modo que paga por SOBREVIVIR; los demás pagan
    //     por RECOGER, así que sus cifras son TECHOS y en la mano de un paciente
    //     caen. Por eso oro y vuelo se dejan justo por encima del runner.
    //   · El duelo no se iguala por ritmo sino por PARTIDA: no tiene
    //     supervivencia libre — la primera derrota lo cierra, a los ~54 s —, así
    //     que igualar su pts/min obligaría a un botín absurdo. 247 pts/partida es
    //     la media real observada en `juego_partidas` (238 sobre 399 partidas).
    //     Y su techo, 4 victorias encadenadas = 1.200, encaja con el máximo
    //     histórico jamás registrado por nadie: 1.473.
    //   · Estos números YA NO tocan la dificultad. Hasta hoy `dif` era
    //     `score/200`, así que subir un pago adelantaba la rampa de rebote (el
    //     oro se ponía difícil a los 24 s en vez de a los 48). Desde esta entrega
    //     `dif` cuenta FOTOGRAMAS — ver `DIF_FRAMES`, unas líneas más abajo —, de
    //     modo que se puede recalibrar la economía sin mover el juego.
    const PTS_VALLA = 4;      // runner: rebasar un lobo o un cuervo
    const PTS_MONEDA = 6;     // oro: recoger una moneda         (era 3)
    const PTS_IMPACTO = 3;    // jefe: bola de lana que acierta   (era 2)
    const PTS_REY = 50;       // jefe: rey abatido                (era 20)
    // ── Rampa de dificultad: por TIEMPO, no por puntos (22-ago-2026) ─────────
    // `dif` era `st.score / 200`, o sea que la dificultad estaba atada a la
    // tabla de pagos de aquí arriba: al rebalancear los modos, el que pasaba a
    // pagar más se volvía difícil antes SIN QUE NADIE LO HUBIERA DECIDIDO (el
    // oro llegaba a dif=1 en 24 s en vez de 48). Son dos perillas distintas y
    // ahora están separadas: cambiar puntos ya no cambia la dificultad.
    // Calibrado contra el RUNNER, que es el modo de referencia y el único que
    // no se ha tocado: con sus pagos de siempre llegaba a dif=1 a los 41 s
    // (2.460 fotogramas, medido sobre 400 partidas simuladas). El exponente 1,4
    // reproduce su CURVA ENTERA, no solo el punto final — desviación máxima
    // 0,028 sobre 1 frente a la rampa de puntos. Sin él, una rampa lineal se
    // adelantaría hasta 0,12 a mitad de partida y el runner sería otro juego.
    const DIF_FRAMES = 2460;   // ~41 s a 60 fps
    if (TEMAS[modoInicial].familia === "vuelo") { st.y = H * 0.4; st.objetivoY = st.y; }

    // ── Transición a otro juego (la usan el orbe Y la victoria del duelo) ──
    const transita = (to) => {
      st.modo = to; st.transicion = 1; st.score += 40; setScore(st.score);
      st.vallas = []; st.monedas = []; st.suelos = [{ x: -20, w: W + 60, top: suelo }]; st.sx = SX;
      st.corales = []; st.balas = []; st.balasJefe = []; st.jefe = null; st.jefeNivel = 0;
      st.cad = 0; st.jefeCad = 0; st.flotantes = [];
      st.jefeYPos = undefined; st.jefeCarga = 0;
      st.carril = 1; st.objetos = []; st.olaCad = 0; st.faseCamino = 0; st.flechaFlash = null;
      st.aves = []; st.anillos = []; st.objetivoY = undefined; st.arrastre = false; st.duelo = null;
      st.chispas = []; st.cadAve = 0; st.cadAnillo = 0; st.cadAveTope = 92; st.cadAniTope = 74;
      st.quiereConsumible = false;
      st.desdeConsumible = -400; st.graciaTransicion = 90;
      // Recolocar a la oveja según el juego destino
      st.y = TEMAS[to].familia === "vuelo" ? H * 0.4 : suelo - SH;
      if (TEMAS[to].familia === "vuelo") st.objetivoY = st.y;
      st.vy = 0; st.enSuelo = true;
    };
    // ── Equilibrio del duelo (medido por simulación, 200.000 combates) ────────
    // El rival NO es una persona: es un bot con la piel de otro paciente. Si su
    // carta fuese uniforme al azar, cualquier patrón fijo lo revienta (el escudo
    // ganaba el 100% y el ataque el 73%). Tres reglas lo cierran:
    //   · MAX_TURNOS: el combate no puede eternizarse; al llegar gana quien tenga
    //     más PS, y si están igualados es empate (nadie roba nada a nadie).
    //   · D vs D cuesta 25 a los dos: turtlear ya no es gratis.
    //   · P_LEE: el rival responde a tu carta más repetida con la que la vence
    //     (⚔️→🛡️→🍎→⚔️). A 0.35 ninguna estrategia fija supera al juego honesto.
    // Con P_LEE = 0 vuelve al rival aleatorio de antes.
    const MAX_TURNOS = 12;
    const P_LEE = 0.35;
    const CONTRA = { A: "D", D: "P", P: "A" };
    const cartaRival = (d) => {
      const v = d.vistas || {};
      const tot = (v.A || 0) + (v.D || 0) + (v.P || 0);
      if (tot > 0 && Math.random() < P_LEE) {
        const fav = ["A", "D", "P"].sort((x, y) => (v[y] || 0) - (v[x] || 0))[0];
        return CONTRA[fav];
      }
      return ["A", "D", "P"][Math.floor(Math.random() * 3)];
    };
    // ── Bo entrenador: rival de reserva cuando el rebaño aún no tiene puntos ──
    // Sin id → resolverDuelo corta antes de llamar a la RPC: no se le quitan
    // puntos a nadie. El botín de partida sí cuenta, así que se sigue jugando
    // por puntos y nadie se queda encerrado en el tapete tras gastar el diamante.
    const RIVAL_BOT = { id: null, bot: true, usuario: "Bo", oveja: "entrenador", pts: 0,
      px: buildPixels("verde", []), pxTriste: buildPixelsEstado("verde", [], "triste") };
    // ── Duelo: rivales reales del ranking semanal (top 1, top 2 y el rebaño) ──
    // Plazo para las lecturas del tapete: si la red se queda colgada (móvil con
    // cobertura a medias), el duelo no puede quedarse en «Buscando al rebaño…»
    // para siempre. A los 8 s se juega contra Bo entrenador.
    const conPlazo = (p, ms) => Promise.race([p, new Promise(r => setTimeout(() => r(null), ms))]);
    const cargarRivales = async () => {
      try {
        const jr = await conPlazo(sbReq("GET", "v_ranking_juego_semanal?select=profile_id,puntos_semana&order=puntos_semana.desc&limit=14"), 8000) || [];
        const filas = (Array.isArray(jr) ? jr : []).filter(r => r.profile_id !== perfilId);
        const ids = filas.map(r => r.profile_id).slice(0, 10);
        let perf = [];
        // Fase 2b: los perfiles AJENOS se leen de la vista perfiles_publicos (nombre + Bo), no de profiles
        if (ids.length) perf = await conPlazo(sbReq("GET", `perfiles_publicos?id=in.(${ids.join(",")})&select=id,name,bo_nombre,bo_color,bo_equipados`), 8000) || [];
        const pMap = {}; (Array.isArray(perf) ? perf : []).forEach(p => { pMap[p.id] = p; });
        const rivales = filas.map(r => {
          const p = pMap[r.profile_id]; if (!p) return null;
          return { id: p.id, usuario: (p.name || "Paciente").split(" ")[0], oveja: p.bo_nombre || "Bo",
            pts: r.puntos_semana || 0,
            px: buildPixels(p.bo_color, p.bo_equipados),
            pxTriste: buildPixelsEstado(p.bo_color, p.bo_equipados, "triste") };
        }).filter(Boolean);
        if (st.duelo) { st.duelo.rivales = rivales; st.duelo.cargando = false; }
      } catch { if (st.duelo) { st.duelo.rivales = []; st.duelo.cargando = false; } }
    };
    // Misma forma que apply_referral: una RPC SECURITY DEFINER mueve los dos marcadores
    const resolverDuelo = (rival, gana) => {
      if (!perfilId || !rival || !rival.id) return;
      sbReq("POST", "rpc/resolver_duelo", { p_reta: perfilId, p_rival: rival.id, p_gana: gana })
        .then(res => { if (st.duelo && res && res.puntos_semana !== undefined) st.duelo.misPts = res.puntos_semana; })
        .catch(() => {});
    };

    const saltar = (px, py) => {
      if (!st.vivo) return;
      const fam = TEMAS[st.modo].familia;
      if (fam === "plataformas") {
        if (st.enSuelo) { st.vy = -18; st.enSuelo = false; }
      } else if (fam === "vuelo") {
        // Sin gravedad: la avioneta va a tu dedo y SE QUEDA donde la dejes
        st.arrastre = true;
        if (py !== undefined) st.objetivoY = py - SH * 0.55;
      } else if (fam === "duelo") {
        const d = st.duelo; if (!d || py === undefined) return;
        if (d.fase === "tapete") {
          const rv = d.rivales || [];
          if (d.cargando) return;
          if (rv.length === 0) {
            // Carta única centrada: sin esto el tapete se quedaba muerto y había
            // que salir del juego habiendo pagado el diamante sin jugar nada
            if (py > 240 && py < 412 && px > 112 && px < 228) {
              d.rival = RIVAL_BOT; d.fase = "turno"; d.t = 0; d.psYo = 300; d.psRiv = 300; jfx("rival");
            }
            return;
          }
          if (py > 240 && py < 412) {
            const i = px < 115 ? 0 : px < 227 ? 1 : 2;
            let elegido = null;
            if (i === 0) elegido = rv[0];
            else if (i === 1) elegido = rv[1] || rv[0];
            else elegido = rv[Math.floor(Math.random() * rv.length)];
            if (elegido) { d.rival = elegido; d.fase = "turno"; d.t = 0; d.psYo = 300; d.psRiv = 300; jfx("rival"); }
          }
        } else if (d.fase === "turno") {
          if (py > 294 && py < 420) {
            const i = px < 115 ? 0 : px < 227 ? 1 : 2;
            d.miIdx = i; d.miCarta = ["A", "D", "P"][i];
            d.suCarta = cartaRival(d);
            if (!d.vistas) d.vistas = { A: 0, D: 0, P: 0 };
            d.vistas[d.miCarta]++;
            d.turno = (d.turno || 0) + 1;
            d.suIdx = Math.floor(Math.random() * 3);
            d.fase = "revela"; d.t = 0;
            jfx("carta");
          }
        } else if (d.fase === "fin") {
          if (d.resultado === "gana" || d.resultado === "empate") {
            if (py > 376 && py < 442) { transita(otroModo(st.modo)); return; }        // 🔮 al siguiente juego
            if (py > 452 && py < 500) {
              // Otro duelo: SIEMPRE contra un rival aleatorio (y distinto del recién
              // vencido si hay más), para que nadie pueda cebarse con el mismo paciente
              const rv2 = (d.rivales || []).filter(r => !d.rival || r.id !== d.rival.id);
              const pool = rv2.length ? rv2 : (d.rivales || []);
              // Sin rebaño con puntos, la revancha es contra Bo: encadenar duelos
              // nunca deja el tapete sin salida
              const nuevoRival = pool.length ? pool[Math.floor(Math.random() * pool.length)] : RIVAL_BOT;
              {
                st.duelo = { fase: "turno", t: 0, psYo: 300, psRiv: 300, rival: nuevoRival,
                  rivales: d.rivales, cargando: false, miCarta: null, suCarta: null,
                  miIdx: 1, suIdx: 1, golpeYo: 0, golpeRiv: 0, resultado: null, flot: [], misPts: d.misPts,
                  turno: 0, vistas: { A: 0, D: 0, P: 0 } };
                jfx("rival");
              }
            }
          } else if (d.t > 40) {
            // La derrota cierra la partida, como cualquier tropiezo
            st.vivo = false; setFin(true); setBest(b => Math.max(b, st.score));
          }
        }
      } else {
        if (st.y >= suelo - SH - 1) st.vy = -17;   // runner y shooter
      }
    };
    const onTap = (e) => {
      const r = cv.getBoundingClientRect();
      const cx = e.clientX !== undefined ? e.clientX
        : (e.touches && e.touches[0] ? e.touches[0].clientX : undefined);
      const cyT = e.clientY !== undefined ? e.clientY
        : (e.touches && e.touches[0] ? e.touches[0].clientY : undefined);
      if (cx === undefined || !r.width) saltar();
      else saltar((cx - r.left) * (W / r.width),
        cyT !== undefined && r.height ? (cyT - r.top) * (H / r.height) : undefined);
    };
    tapRef.current = onTap;
    // Arrastre continuo del vuelo: la avioneta persigue el dedo mientras está apoyado
    const onMove = (e) => {
      if (!st.arrastre || !st.vivo || TEMAS[st.modo].familia !== "vuelo") return;
      const r = cv.getBoundingClientRect();
      const cyM = e.clientY !== undefined ? e.clientY
        : (e.touches && e.touches[0] ? e.touches[0].clientY : undefined);
      if (cyM !== undefined && r.height) st.objetivoY = (cyM - r.top) * (H / r.height) - SH * 0.55;
    };
    const onUp = () => { st.arrastre = false; };
    window.addEventListener("pointermove", onMove);
    window.addEventListener("pointerup", onUp);
    const onKey = (e) => {
      if (e.code === "Space" || e.code === "ArrowUp") { e.preventDefault(); saltar(); }
      if (e.code === "ArrowLeft")  { e.preventDefault(); saltar(0); }
      if (e.code === "ArrowRight") { e.preventDefault(); saltar(W); }
    };
    window.addEventListener("keydown", onKey);

    let raf;
    // ── Un PASO de simulación = 1/60 s de juego ──────────────────────────────
    // Toda la física está escrita «por fotograma» y calibrada a 60 por segundo
    // (velocidades, gravedad, cadencias, DIF_FRAMES). Hasta hoy cada rAF era un
    // paso, así que el juego iba a la velocidad que quisiera la pantalla: iOS
    // baja requestAnimationFrame a 30 por segundo en ahorro de energía (el juego
    // iba a la MITAD, con la oveja flotando a cámara lenta) y una pantalla de
    // 90/120 Hz lo doblaría. Ahora el bucle pinta a la cadencia de la pantalla y
    // simula los pasos de 1/60 s que hayan pasado de verdad.
    const paso = () => {
        if (st.vel < 7.6) st.vel += 0.0011;  // acelera suave, con tope
        if (st.transicion > 0) st.transicion -= 0.04;
        const tema = TEMAS[st.modo];
        if (st.graciaTransicion > 0) st.graciaTransicion--;
        st.frames++;
        const dif = Math.min(Math.pow(st.frames / DIF_FRAMES, 1.4), 1);

        if (tema.familia === "runner") {
          // ═══ FAMILIA RUNNER (día / noche): saltar obstáculos de tierra; los voladores REBOTAN ═══
          if (st.sx === undefined) st.sx = SX;
          st.vy += 1.05; st.y = Math.min(st.y + st.vy, suelo - SH);
          if (st.y === suelo - SH) st.vy = 0;
          // La oveja tiende a volver a su carril (SX) tras un empujón lateral
          if (st.sx > SX) st.sx = Math.max(SX, st.sx - 1.4);
          else if (st.sx < SX) st.sx = Math.min(SX, st.sx + 1.0);   // recuperas terreno poco a poco: jugar bien te devuelve a tu sitio
          const ultima = st.vallas[st.vallas.length - 1];
          const sepMin = 240 - dif * 80;
          const sepJit = 40 + Math.random() * (260 - dif * 120);
          const sepActual = ultima ? (W + 14) - ultima.x : 9999;

          if (st.graciaTransicion <= 0 && sepActual > sepMin + sepJit) {
            if (st.quiereConsumible) {
              // El orbe corona el arco de salto del siguiente lobo: esquivarlo es recogerlo
              st.quiereConsumible = false;
              st.vallas.push({ tipo: tema.obstaculo, x: W + 14, w: 20, h: 52, ok: false });
              st.consumibles.push({ x: W + 14 + 34, y: suelo - SH - 108, to: otroModo(st.modo) });
              st.mismos = 0;
            } else {
            // >= PTS_VALLA, no >= 3: es "ya he rebasado un obstáculo", y así no
            // vuelve a depender de cuánto pague la valla.
            const pVolador = st.score >= PTS_VALLA ? 0.30 + dif * 0.25 : 0;
            const ultTipo = ultima ? (ultima.vuela ? "aire" : "tierra") : null;
            let quiereAire = Math.random() < pVolador;
            if (st.mismos >= 2) { quiereAire = ultTipo !== "aire"; st.mismos = 0; }
            if ((quiereAire ? "aire" : "tierra") === ultTipo) st.mismos = (st.mismos || 0) + 1;
            else st.mismos = 0;
            if (quiereAire) {
              const alto = suelo - SH - (44 + Math.floor(Math.random() * 3) * 12);
              st.vallas.push({ tipo: tema.volador, vuela: true, x: W + 14, w: 46, h: 30, y: alto, ok: false });
            } else {
              st.vallas.push({ tipo: tema.obstaculo, x: W + 14, w: 20, h: 38 + Math.floor(Math.random() * 4) * 13, ok: false });
            }
            if (dif > 0.4 && Math.random() < dif * 0.25) {
              const gapCombo = 130 + Math.random() * 40;
              const aire2 = Math.random() < pVolador;
              if (aire2) st.vallas.push({ tipo: tema.volador, vuela: true, x: W + 14 + gapCombo, w: 46, h: 30,
                y: suelo - SH - (44 + Math.floor(Math.random() * 3) * 12), ok: false });
              else st.vallas.push({ tipo: tema.obstaculo, x: W + 14 + gapCombo, w: 20,
                h: 38 + Math.floor(Math.random() * 4) * 13, ok: false });
            }
            }
          }
          st.vallas.forEach(v => { v.x -= st.vel * (v.vuela ? 1.18 : 1); });
          st.vallas = st.vallas.filter(v => v.x > -50);
          st.vallas.forEach(v => {
            if (!v.ok && v.x + v.w < st.sx) { v.ok = true; st.score += PTS_VALLA; setScore(st.score); }
            const margen = 12;
            const sL = st.sx + margen, sR = st.sx + SH - margen;
            const sT = st.y + 10, sB = st.y + SH - 6;
            if (v.vuela) {
              // ── VOLADOR: no mata, REBOTA ──
              const solapa = sR > v.x && sL < v.x + v.w && sB > v.y && sT < v.y + v.h;
              if (solapa && !v.rebotado) {
                v.rebotado = true;
                const pisaDesdeArriba = st.vy > 0 && st.y + SH - 20 < v.y;
                if (pisaDesdeArriba) {
                  // Caes encima → rebote hacia ARRIBA (y un empujón adelante)
                  st.vy = -15; st.sx = Math.min(st.sx + 26, W * 0.5);
                } else {
                  // Choque frontal → rebote hacia la IZQUIERDA (riesgo de borde)
                  st.sx -= 70; st.vy = -6;
                }
              }
            } else {
              // ── OBSTÁCULO DE TIERRA: mata ──
              if (sR > v.x && sL < v.x + v.w && sB > suelo - v.h) {
                st.vivo = false; setFin(true); setBest(b => Math.max(b, st.score));
              }
            }
          });
          // Muerte por borde izquierdo (empujada por los rebotes)
          if (st.sx + SH < 6) { st.vivo = false; setFin(true); setBest(b => Math.max(b, st.score)); }

        } else if (tema.familia === "plataformas") {
          // ═══ FAMILIA PLATAFORMAS (oro): niveles de suelo sólido con COLISIÓN real ═══
          // st.suelos = bloques macizos a distinta altura. Colisión por arriba y por los lados.
          // Muerte: caer por un hueco O quedar empujada fuera por el borde izquierdo.
          if (st.suelos === undefined) { st.suelos = []; st.monedas = []; }
          if (st.sx === undefined) st.sx = SX;   // posición X propia de la oveja (empujable)
          if (st.suelos.length === 0) st.suelos.push({ x: -20, w: W - 100, top: suelo });

          // 3 niveles de altura del "top" de cada bloque de suelo
          const NIVELES = [suelo, suelo - 60, suelo - 120];

          const fin = st.suelos.reduce((m, s) => Math.max(m, s.x + s.w), 0);
          if (fin < W + 300) {
            const hayHueco = st.graciaTransicion <= 0 && Math.random() < 0.38;
            const hueco = hayHueco ? 80 + Math.random() * (30 + dif * 45) : 0;
            const tramo = 140 + Math.random() * 150;
            const top = NIVELES[Math.floor(Math.random() * 3)];
            const x0 = fin + hueco;
            st.suelos.push({ x: x0, w: tramo, top });
            // monedas sobre el tramo (a ras del top, no requieren saltar salvo cambio de nivel)
            if (st.quiereConsumible) {
              // El orbe espera en mitad del tramo, a la altura de la carrera: tu camino pasa por él
              st.quiereConsumible = false;
              st.consumibles.push({ x: x0 + 70, y: top - 58, to: otroModo(st.modo) });
            } else if (Math.random() < 0.55) {
              const nMon = 1 + (Math.random() < 0.5 ? 1 : 0);
              for (let i = 0; i < nMon; i++) st.monedas.push({ x: x0 + 40 + i * 34, y: top - 40, cogida: false });
            }
          }
          st.suelos.forEach(s => { s.x -= st.vel; });
          st.suelos = st.suelos.filter(s => s.x + s.w > -60);
          st.monedas.forEach(m => { m.x -= st.vel; });
          st.monedas = st.monedas.filter(m => m.x > -30 && !m.cogida);

          // Física vertical
          st.vy += 1.15; st.y += st.vy;
          const sL = st.sx + 8, sR = st.sx + SH - 8;     // caja horizontal de la oveja
          const pieY = st.y + SH, cabezaY = st.y;
          st.enSuelo = false;

          st.suelos.forEach(s => {
            const solapaX = sR > s.x && sL < s.x + s.w;
            if (!solapaX) return;
            // Aterrizar sobre el top del bloque
            if (st.vy >= 0 && pieY >= s.top && pieY <= s.top + 30 && cabezaY < s.top - 10) {
              st.y = s.top - SH; st.vy = 0; st.enSuelo = true;
            }
          });
          // Colisión lateral: si la oveja está "dentro" de la altura de un bloque, el bloque la empuja
          st.suelos.forEach(s => {
            const dentroAltura = pieY > s.top + 6 && cabezaY < H;   // su cuerpo pisa el nivel del bloque
            if (!dentroAltura) return;
            // Choca contra la cara izquierda del bloque → la oveja es empujada hacia la izquierda (scroll)
            if (sR > s.x && sL < s.x && st.y + SH > s.top + 4) {
              st.sx = s.x - (SH - 8);   // pegada a la cara izquierda; el scroll la arrastra
            }
          });

          // Recuperar posición X poco a poco hacia el centro-izquierda cuando puede
          if (st.sx > SX) st.sx = Math.max(SX, st.sx - st.vel * 0.6);
          else if (st.sx < SX && st.enSuelo) st.sx = Math.min(SX, st.sx + 1.0);   // tras el empujón de un bloque, recuperas tu posición poco a poco

          // Recoger monedas
          st.monedas.forEach(m => {
            if (!m.cogida && st.sx + SH > m.x && st.sx < m.x + 24 && st.y + SH > m.y && st.y < m.y + 24) {
              m.cogida = true; st.score += PTS_MONEDA; setScore(st.score);
            }
          });
          // Muerte 1: caer por un hueco
          if (st.y > H + 40) { st.vivo = false; setFin(true); setBest(b => Math.max(b, st.score)); }
          // Muerte 2: comida por el borde izquierdo de la pantalla
          if (st.sx + SH < 6) { st.vivo = false; setFin(true); setBest(b => Math.max(b, st.score)); }

        } else if (tema.familia === "vuelo") {
          // ═══ FAMILIA VUELO: la avioneta sigue el dedo; sin gravedad, sin suelo ═══
          if (st.objetivoY === undefined) st.objetivoY = st.y;
          st.y += (st.objetivoY - st.y) * 0.22;
          st.y = Math.max(40, Math.min(suelo - 70, st.y));
          st.vy = 0;
          const ux = st.sx !== undefined ? st.sx : SX;
          // El aire tiene su propio ritmo, como lo tenía el agua
          const velAire = Math.min(st.vel, 6.2) * 0.82;
          // Centro HONESTO del conjunto avión+oveja. El fuselaje ocupa de y+21 a
          // y+36 y la oveja asoma por encima de la cabina: el centro real cae en
          // y+26, no en y+22. Con el centro desplazado 4 px hacia arriba, los
          // cuervos que pasaban por encima mataban sin llegar a tocar.
          const cxA = ux + 42, cyA = st.y + 26;
          // Caja de choque del cuervo, medida sobre el dibujo (20×15 a escala 2,4 =
          // 48×36): el cuerpo mata, las puntas de las alas no. Antes 38×28.
          const AVE_RX = 34, AVE_RY = 23;
          const ANI_RY = 32;                       // media altura del hueco dorado
          // ── Regla de oro del vuelo: un cuervo NUNCA ocupa el corredor de un anillo ──
          // Cuervos y anillos avanzan a la MISMA velocidad, así que la distancia
          // entre ellos no cambia en toda su vida: basta comprobarlo al nacer.
          // Sin esta regla aparecían anillos imposibles de tomar (el cuervo tapando
          // justo la entrada) y choques que parecían injustos porque el ave venía
          // escondida dentro del oro.
          const RESERVA_X = 108, RESERVA_Y = 60;
          const libre = (cx2, cy2, lista) => !lista.some(o =>
            Math.abs(o.x - cx2) < RESERVA_X && Math.abs(o.y - cy2) < RESERVA_Y);
          const centrosAnillos = () => (st.anillos || []).map(a => ({ x: a.x + 44, y: a.y + 57 }))
            .concat((st.consumibles || []).map(k => ({ x: k.x + 18, y: k.y + 18 })));
          const centrosAves = () => (st.aves || []).map(a => ({ x: a.x + 24, y: a.y + 18 }));
          // Cuervos en cinco bandas de altura, con más aire entre oleadas que en el buceo
          st.aves = st.aves || [];
          st.cadAve = (st.cadAve || 0) + 1;
          if (st.cadAveTope === undefined) st.cadAveTope = 92;
          if (st.graciaTransicion <= 0 && st.cadAve >= st.cadAveTope) {
            st.cadAve = 0;
            // Cadencia irregular: antes cuervos y anillos iban los dos a 74
            // fotogramas a partir de 200 puntos, se acompasaban y el resto de la
            // partida repetía siempre el mismo patrón (y siempre el mismo estorbo).
            st.cadAveTope = 66 - dif * 6 + Math.random() * 32;
            const bandas = [90, 190, 290, 390, 490].map(b => b + Math.random() * 36 - 18);
            for (let i = bandas.length - 1; i > 0; i--) {          // barajado honesto
              const j = Math.floor(Math.random() * (i + 1));
              const tmp = bandas[i]; bandas[i] = bandas[j]; bandas[j] = tmp;
            }
            const anil = centrosAnillos();
            const yLibre = bandas.find(yy => libre(W + 30 + 24, yy + 18, anil));
            // Si las cinco bandas están tomadas, esta tanda se queda sin cuervo:
            // mejor un hueco de aire que una muerte imposible de esquivar.
            if (yLibre !== undefined) st.aves.push({ x: W + 30, y: yLibre });
          }
          st.aves.forEach(a => { a.x -= velAire; });
          st.aves = st.aves.filter(a => a.x > -60);
          // Anillos en arcos de 2-3; el orbe ocupa el sitio del arco cuando toca transición
          st.anillos = st.anillos || [];
          st.cadAnillo = (st.cadAnillo || 0) + 1;
          if (st.cadAniTope === undefined) st.cadAniTope = 74;
          if (st.graciaTransicion <= 0 && st.cadAnillo >= st.cadAniTope) {
            st.cadAnillo = 0;
            st.cadAniTope = 62 + Math.random() * 24;
            const avs = centrosAves();
            const nA = 2 + Math.floor(Math.random() * 2);
            // Se prueban varias alturas y se coge la primera cuyo arco COMPLETO
            // queda despejado de cuervos; si ninguna sirve, no hay arco esta vez.
            let y0 = null;
            for (let intento = 0; intento < 8 && y0 === null; intento++) {
              const cand = 60 + Math.random() * (suelo - 250);
              const chocan = st.quiereConsumible
                ? !libre(W + 30 + 18, cand + 48, avs)
                : Array.from({ length: nA }, (_, i) =>
                    ({ x: W + 30 + i * 96 + 44, y: cand + Math.sin(i * 1.4) * 30 + 57 }))
                    .some(c => !libre(c.x, c.y, avs));
              if (!chocan) y0 = cand;
            }
            if (y0 !== null) {
              if (st.quiereConsumible) {
                st.quiereConsumible = false;
                st.consumibles.push({ x: W + 30, y: y0 + 30, velX: velAire, to: otroModo(st.modo) });
              } else {
                for (let i = 0; i < nA; i++)
                  st.anillos.push({ x: W + 30 + i * 96, y: y0 + Math.sin(i * 1.4) * 30, ok: false, xPrev: W + 30 + i * 96 });
              }
            }
          }
          st.anillos.forEach(a => { a.xPrev = a.x; a.x -= velAire; });
          st.anillos = st.anillos.filter(a => a.x > -100 && !a.ok);
          // Choque con cuervo
          st.aves.forEach(a => {
            if (Math.abs(a.x + 24 - cxA) < AVE_RX && Math.abs(a.y + 18 - cyA) < AVE_RY) {
              st.vivo = false; setFin(true); setBest(b => Math.max(b, st.score));
            }
          });
          // El anillo solo cuenta atravesándolo POR DENTRO; rozar el borde no castiga.
          // Detección por BARRIDO: antes se exigía |Δx| < 12 en un fotograma suelto y,
          // con el aire ya a tope, un tirón del móvil bastaba para saltarse la ventana
          // y que el anillo NO contase. Ahora cuenta si el centro cruza el morro entre
          // un fotograma y el siguiente, aunque el salto sea grande.
          st.anillos.forEach(a => {
            if (a.ok) return;
            const acx = a.x + 44, acxPrev = (a.xPrev !== undefined ? a.xPrev : a.x) + 44;
            const acy = a.y + 57;                  // centro del anillo a escala 4.4 (88×114)
            const cruza = (acxPrev >= cxA && acx <= cxA) || Math.abs(acx - cxA) < 12;
            if (cruza && Math.abs(acy - cyA) < ANI_RY) {
              a.ok = true; st.score += PTS_ANILLO; setScore(st.score);
              st.flotantes.push({ x: acx, y: a.y + 14, t: 0 });
              // Chispas del anillo: el dibujo ya existía pero nadie las creaba
              st.chispas = st.chispas || [];
              st.chispas.push({ x: acx, y: acy, t: 0, tipo: "onda" });
              for (let ci = 0; ci < 8; ci++)
                st.chispas.push({ x: acx, y: acy, t: 0,
                  vx: Math.cos(ci * 0.785) * 2.4, vy: Math.sin(ci * 0.785) * 2.4 });
            }
          });
          st.chispas = (st.chispas || []).filter(c => {
            c.t++;
            if (c.vx !== undefined) { c.x += c.vx - velAire * 0.5; c.y += c.vy; }
            else c.x -= velAire;
            return c.t < 26;
          });
          st.flotantes.forEach(f => { f.t++; f.y -= 0.9; });
          st.flotantes = st.flotantes.filter(f => f.t < 42);

        } else if (tema.familia === "shooter") {
          // ═══ FAMILIA SHOOTER (guarida): la oveja dispara sola; salta para esquivar ═══
          st.vy += 1.05; st.y = Math.min(st.y + st.vy, suelo - SH);
          if (st.y === suelo - SH) st.vy = 0;
          // En el duelo la oveja se coloca pegada al borde izquierdo (máxima distancia)
          if (st.sx === undefined) st.sx = SX;
          if (st.sx > 14) st.sx = Math.max(14, st.sx - 2.5);
          const ux = st.sx;
          if (!st.jefe) st.jefe = { t: 0, hp: 12 + st.jefeNivel * 3, max: 12 + st.jefeNivel * 3, herido: 0,
            alto: Math.random() < 0.5, mora: 200 };
          st.jefe.t++;
          // DOS alturas fijas, como pájaros y vallas:
          //  · ABAJO: su bola va a ras → SALTA para esquivar; tus disparos desde el suelo le dan
          //  · ARRIBA: su bola pasa por encima → NO saltes para esquivar; salta si quieres acertarle
          const J_BAJO = suelo - 84, J_ALTO = suelo - 232;
          st.jefe.mora--;
          if (st.jefe.mora <= 0) {
            st.jefe.alto = !st.jefe.alto;
            st.jefe.mora = 220 + Math.random() * 120 - dif * 60;
          }
          const objetivoJ = st.jefe.alto ? J_ALTO : J_BAJO;
          if (st.jefeYPos === undefined) st.jefeYPos = objetivoJ;
          const dj = objetivoJ - st.jefeYPos;
          st.jefeYPos += Math.abs(dj) < 4 ? dj : Math.sign(dj) * 4;
          const asentado = Math.abs(dj) < 12;
          const jefeY = st.jefeYPos + Math.sin(st.jefe.t * 0.05) * 5;   // leve flotación en el sitio
          st.jefeYDraw = jefeY;
          const jefeX = W - 104;
          // Disparo automático de bolas de lana
          st.cad = (st.cad || 0) + 1;
          if (st.cad >= 26) { st.cad = 0; st.balas.push({ x: ux + SH, y: st.y + SH * 0.42 }); }
          st.balas.forEach(b => { b.x += 9.5; });
          st.balas = st.balas.filter(b => b.x < W + 30);
          // Impactos al jefe
          st.balas = st.balas.filter(b => {
            const da = b.x > jefeX && b.x < jefeX + 84 && b.y > jefeY - 10 && b.y < jefeY + 86;
            if (da) {
              st.jefe.hp--; st.score += PTS_IMPACTO; setScore(st.score); st.jefe.herido = 6;
              if (st.jefe.hp <= 0) {
                st.jefeNivel++; st.jefe = null; st.score += PTS_REY; setScore(st.score);
                // Botín real: el rey suelta un orbe de transición hacia otro juego
                if (st.consumibles.length === 0) {
                  const oy = Math.min(Math.max(jefeY + 20, suelo - SH - 140), suelo - SH - 30);
                  st.consumibles.push({ x: jefeX, y: oy, to: otroModo(st.modo) });
                  st.desdeConsumible = 0;
                }
              }
              return false;
            }
            return true;
          });
          if (st.jefe && st.jefe.herido > 0) st.jefe.herido--;
          // Ataques del jefe: bajo (salta) o alto (no saltes)
          if (asentado) st.jefeCad = (st.jefeCad || 0) + 1;   // en tránsito no carga: cada altura avisa desde cero
          const umbralDisparo = 88 - dif * 24;
          // Carga visible: la boca brilla los 26 frames previos al disparo (aviso justo)
          st.jefeCarga = st.jefe && asentado && st.jefeCad > umbralDisparo - 26
            ? (st.jefeCad - (umbralDisparo - 26)) / 26 : 0;
          if (st.jefe && asentado && st.graciaTransicion <= 0 && st.jefeCad >= umbralDisparo) {
            st.jefeCad = 0;
            // La bola sale de la boca del rey: su altura depende de dónde esté flotando
            st.balasJefe.push({ x: jefeX, y: jefeY + 50 });
          }
          st.balasJefe.forEach(b => { b.x -= 4.2 + dif * 1.2; });
          st.balasJefe = st.balasJefe.filter(b => b.x > -30);
          st.balasJefe.forEach(b => {
            if (b.x + 20 > ux + 12 && b.x + 4 < ux + SH - 12 && b.y + 12 > st.y + 10 && b.y + 2 < st.y + SH - 4) {
              st.vivo = false; setFin(true); setBest(bb => Math.max(bb, st.score));
            }
          });

        } else if (tema.familia === "duelo") {
          // ═══ FAMILIA DUELO (cartas por turnos): las fases avanzan solas; el toque decide ═══
          if (!st.duelo) {
            st.duelo = { fase: "tapete", t: 0, psYo: 300, psRiv: 300, rival: null, rivales: null,
              cargando: true, miCarta: null, suCarta: null, miIdx: 1, suIdx: 1,
              turno: 0, vistas: { A: 0, D: 0, P: 0 },
              golpeYo: 0, golpeRiv: 0, resultado: null, flot: [], misPts: null };
            cargarRivales();
          }
          const d = st.duelo;
          d.t++;
          if (d.golpeYo > 0) d.golpeYo--;
          if (d.golpeRiv > 0) d.golpeRiv--;
          d.flot.forEach(f => { f.t++; f.y -= 0.8; });
          d.flot = d.flot.filter(f => f.t < 46);
          if (d.fase === "revela") {
            if (d.t === 34) {
              // La carta rival ya está boca arriba: matriz confirmada (ataque 100, escudo refleja 50, manzana +50)
              const m = d.miCarta, b = d.suCarta;
              let dYo = 0, dRiv = 0;
              if (m === "A" && b === "A") { dYo = -50; dRiv = -50; }
              else if (m === "A" && b === "D") { dYo = -50; }
              else if (m === "A" && b === "P") { dRiv = -100; }
              else if (m === "D" && b === "A") { dRiv = -50; }
              else if (m === "D" && b === "D") { dYo = -25; dRiv = -25; }   // turtlear ya no es gratis
              else if (m === "D" && b === "P") { dRiv = +50; }
              else if (m === "P" && b === "A") { dYo = -100; }
              else if (m === "P" && b === "D") { dYo = +50; }
              else if (m === "P" && b === "P") { dYo = +50; dRiv = +50; }
              d.psYo = Math.min(300, d.psYo + dYo);
              d.psRiv = Math.min(300, d.psRiv + dRiv);
              if (dYo) { d.flot.push({ lado: "yo", tx: (dYo > 0 ? "+" : "") + dYo, mal: dYo < 0, t: 0, y: 0 }); if (dYo < 0) d.golpeYo = 26; }
              if (dRiv) { d.flot.push({ lado: "riv", tx: (dRiv > 0 ? "+" : "") + dRiv, mal: dRiv < 0, t: 0, y: 0 }); if (dRiv < 0) d.golpeRiv = 26; }
              if (dYo < 0 || dRiv < 0) jfx("golpe");
              else if (dYo > 0 || dRiv > 0) jfx("cura");
            }
            if (d.t >= 96) {
              const ko = d.psYo <= 0 || d.psRiv <= 0;
              const limite = !ko && (d.turno || 0) >= MAX_TURNOS;
              if (ko || limite) {
                d.fase = "fin"; d.t = 0; d.porLimite = limite;
                d.resultado = ko ? (d.psYo > 0 ? "gana" : "pierde")
                  : (d.psYo > d.psRiv ? "gana" : d.psYo < d.psRiv ? "pierde" : "empate");
                jfx(d.resultado === "gana" ? "victoria" : d.resultado === "pierde" ? "derrota" : "carta");
                // El empate no mueve un solo punto: ni a ti ni al rival
                if (d.resultado !== "empate") {
                  // ±100 a los marcadores semanales de LOS DOS, con suelo en 0 (RPC resolver_duelo)
                  resolverDuelo(d.rival, d.resultado === "gana");
                }
                if (d.resultado === "gana") {
                  // Botín de partida creciente: la 2ª victoria vale el doble que la 1ª.
                  // Antes ganar tres duelos seguidos puntuaba igual que ganar uno.
                  st.duelosGanados++;
                  d.racha = st.duelosGanados;
                  d.botin = botinDuelo(st.duelosGanados);
                  st.score += d.botin; setScore(st.score);
                }
              } else { d.fase = "turno"; d.t = 0; d.miCarta = null; d.suCarta = null; }
            }
          }
        }

        // ═══ Consumible (común a todos los modos): lleva a OTRO modo al azar ═══
        st.desdeConsumible++;
        if (st.desdeConsumible > 900 && Math.random() < 0.004 && st.consumibles.length === 0
            && !st.quiereConsumible && tema.familia !== "shooter" && tema.familia !== "duelo") {
          st.desdeConsumible = 0;
          // El orbe NUNCA flota suelto: cada juego lo integra en su siguiente patrón
          // (salto del lobo, tramo del banco, hueco del coral, camino libre entre lobos, botín del rey)
          st.quiereConsumible = true;
        }
        st.consumibles.forEach(k => { if (k.laneMode) return; if (k.caida) k.y += 3.1; else k.x -= (k.velX || st.vel); });
        st.consumibles = st.consumibles.filter(k => k.laneMode ? k.y < H + 60 : (k.x > -40 && k.y < H + 40));
        st.consumibles = st.consumibles.filter(k => {
          const ox = st.sx !== undefined ? st.sx : SX;
          const cogido = ox + SH > k.x && ox < k.x + 40 && st.y + SH > k.y && st.y < k.y + 40;
          if (cogido) { transita(k.to); return false; }
          return true;
        });
        st.nubes.forEach(n => { n.x -= st.vel * 0.25; if (n.x < -30) n.x = W + 20; });
    };
    const PASO_MS = 1000 / 60;
    let tPrev = performance.now(), deuda = 0;
    const loop = (tRaf) => {
      // Coordenadas lógicas → resolución nativa (nítido en cualquier pantalla)
      ctx.setTransform(cv.width / W, 0, 0, cv.height / H, 0, 0);
      const tAhora = typeof tRaf === "number" ? tRaf : performance.now();
      // Tope de 250 ms: al volver del segundo plano no se «recupera» el tiempo
      // perdido de golpe (la oveja aparecería muerta sin haber visto el lobo).
      const dt = Math.min(Math.max(tAhora - tPrev, 0), 250);
      tPrev = tAhora;
      let pasos;
      if (Math.abs(dt - PASO_MS) < PASO_MS * 0.25) { pasos = 1; deuda = 0; }   // pantalla de 60 Hz: un paso exacto, sin tirones
      else {
        deuda += dt; pasos = Math.floor(deuda / PASO_MS); deuda -= pasos * PASO_MS;
        if (pasos > 4) { pasos = 4; deuda = 0; }                                // nunca una avalancha de pasos
      }
      for (let i = 0; i < pasos; i++) if (st.vivo && cuentaRef.current <= 0) paso();
      const tema = TEMAS[st.modo];
      // ── dibujo del fondo ──
      if (tema.familia === "plataformas") {
        // Interior de banco: pared de piedra + relieves de billetes 💶
        ctx.fillStyle = "#4A4E58"; ctx.fillRect(0, 0, W, H);
        // sillería de piedra (ladrillos grandes desfasados) con scroll lento
        const off = (performance.now() / 22) % 96;
        ctx.strokeStyle = "rgba(0,0,0,0.22)"; ctx.lineWidth = 2;
        for (let ry = 0; ry < suelo; ry += 44) {
          const fila = Math.floor(ry / 44);
          ctx.beginPath(); ctx.moveTo(0, ry); ctx.lineTo(W, ry); ctx.stroke();
          for (let rx = -off + (fila % 2 ? 48 : 0); rx < W; rx += 96) {
            ctx.beginPath(); ctx.moveTo(rx, ry); ctx.lineTo(rx, ry + 44); ctx.stroke();
          }
        }
        // sombreado suave de piedra
        ctx.fillStyle = "rgba(255,255,255,0.03)";
        for (let ry = 4; ry < suelo; ry += 44) ctx.fillRect(0, ry, W, 3);
        // Columnas de piedra en paralaje (sensación de avance)
        const colOff = (performance.now() / 9) % 200;
        for (let cxx = -colOff; cxx < W + 60; cxx += 200) {
          ctx.fillStyle = "rgba(0,0,0,0.20)"; ctx.fillRect(cxx, 0, 30, suelo);
          ctx.fillStyle = "rgba(255,255,255,0.05)"; ctx.fillRect(cxx + 3, 0, 5, suelo);
          ctx.fillStyle = "rgba(0,0,0,0.28)";
          ctx.fillRect(cxx - 5, 0, 40, 12);            // capitel
          ctx.fillRect(cxx - 5, suelo - 12, 40, 12);   // base
        }
      } else if (tema.familia === "vuelo") {
        // Cielo diurno con dos capas de nubes (las lejanas, más pálidas y lentas)
        const g = ctx.createLinearGradient(0, 0, 0, H);
        g.addColorStop(0, tema.cielo); g.addColorStop(0.62, "#BFE3F0"); g.addColorStop(1, tema.cieloBottom);
        ctx.fillStyle = g; ctx.fillRect(0, 0, W, H);
        ctx.fillStyle = "rgba(255,255,255,0.30)";
        st.nubes.forEach(n => { ctx.fillRect((n.x * 0.6 + 60) % (W + 40) - 20, n.y + 230, 40, 9); });
        ctx.fillStyle = tema.nubeColor;
        st.nubes.forEach(n => { ctx.fillRect(n.x, n.y, 58, 12); ctx.fillRect(n.x + 12, n.y - 8, 30, 10); });
      } else if (tema.familia === "shooter") {
        // Guarida del jefe: cueva oscura con antorchas parpadeantes
        const g = ctx.createLinearGradient(0, 0, 0, H);
        g.addColorStop(0, tema.cielo); g.addColorStop(1, tema.cieloBottom);
        ctx.fillStyle = g; ctx.fillRect(0, 0, W, H);
        ctx.fillStyle = "rgba(0,0,0,0.25)";
        for (let rx = 0; rx < W; rx += 60) {
          ctx.beginPath(); ctx.arc(rx + 30, 0, 34 + (rx % 3) * 8, 0, 7); ctx.fill();
        }
        [W * 0.22, W * 0.62].forEach((tx, ti) => {
          ctx.fillStyle = "#5A4630"; ctx.fillRect(tx - 4, 96, 8, 34);
          const fl = 10 + Math.abs(Math.sin(performance.now() / 130 + ti * 2)) * 7;
          const fg = ctx.createRadialGradient(tx, 90, 2, tx, 90, fl + 12);
          fg.addColorStop(0, "rgba(255,200,90,0.85)"); fg.addColorStop(1, "rgba(255,140,40,0)");
          ctx.fillStyle = fg; ctx.beginPath(); ctx.arc(tx, 90, fl + 12, 0, 7); ctx.fill();
          ctx.fillStyle = "#FFB030"; ctx.beginPath(); ctx.ellipse(tx, 90, 7, fl, 0, 0, 7); ctx.fill();
          ctx.fillStyle = "#FFE080"; ctx.beginPath(); ctx.ellipse(tx, 92, 3.5, fl * 0.55, 0, 0, 7); ctx.fill();
        });
        // Ascuas que flotan en la penumbra
        ctx.fillStyle = "rgba(255,150,60,0.5)";
        for (let e = 0; e < 6; e++) {
          const ey = H - ((performance.now() / 24 + e * 141) % (H + 30));
          const ex = (e * 67 + 30) % W + Math.sin(performance.now() / 300 + e) * 8;
          ctx.fillRect(ex, ey, 3, 3);
        }
      } else if (tema.familia === "duelo") {
        // Penumbra violeta arriba (rival) que cae al verde del tapete (tú)
        const gd = ctx.createLinearGradient(0, 0, 0, H);
        gd.addColorStop(0, tema.cielo); gd.addColorStop(0.5, "#2A2440"); gd.addColorStop(1, tema.cieloBottom);
        ctx.fillStyle = gd; ctx.fillRect(0, 0, W, H);
      } else {
        // Atardecer del runner
        const g = ctx.createLinearGradient(0, 0, 0, suelo);
        g.addColorStop(0, tema.cielo); g.addColorStop(1, tema.cieloBottom || tema.cielo);
        ctx.fillStyle = g; ctx.fillRect(0, 0, W, H);
        if (tema.sol) {
          ctx.fillStyle = tema.sol;
          ctx.beginPath(); ctx.arc(W * 0.5, suelo - 20, 46, 0, 7); ctx.fill();
        }
        // Colinas en silueta: profundidad contra el atardecer
        ctx.fillStyle = "rgba(30,15,38,0.45)";
        ctx.beginPath(); ctx.ellipse(W * 0.22, suelo + 26, 190, 66, 0, Math.PI, 0); ctx.fill();
        ctx.fillStyle = "rgba(24,12,30,0.55)";
        ctx.beginPath(); ctx.ellipse(W * 0.82, suelo + 30, 210, 78, 0, Math.PI, 0); ctx.fill();
        ctx.fillStyle = tema.nubeColor;
        st.nubes.forEach(n => { ctx.fillRect(n.x, n.y, 44, 12); ctx.fillRect(n.x + 9, n.y - 8, 26, 10); });
      }

      if (tema.familia === "plataformas") {
        // ── Bloques de suelo macizos (cemento) a distintos niveles, con caras laterales ──
        (st.suelos || []).forEach(s => {
          // bloque() ya hace a mano lo que hacían los cinco fillRect: contorno, luz y sombra
          bloque(ctx, s.x, s.top, s.w, H - s.top, "#8E9299");
          // junta de cemento en rejilla
          ctx.fillStyle = "rgba(0,0,0,0.14)";
          for (let bx = s.x + 34; bx < s.x + s.w - 4; bx += 34) ctx.fillRect(bx, s.top + 10, 2, H - s.top - 10);
          for (let byy = s.top + 30; byy < H; byy += 30) ctx.fillRect(s.x + 3, byy, s.w - 6, 2);
        });
        // ── Monedas: el € va dibujado en el sprite, ya no depende de la fuente del móvil ──
        (st.monedas || []).forEach(m => {
          if (m.cogida) return;
          sprite(ctx, SPR.moneda, m.x - 2, m.y - 2, 2.4);
        });
      } else if (tema.familia === "vuelo") {
        // Cielo abierto: el vuelo no tiene suelo que pintar
      } else if (tema.familia === "shooter") {
        // ── Suelo de la guarida ──
        ctx.fillStyle = "#241A2E"; ctx.fillRect(0, suelo + 3, W, H - suelo);
        ctx.fillStyle = tema.suelo; ctx.fillRect(0, suelo, W, 5);
        ctx.fillStyle = tema.hierba;
        for (let gx = (performance.now() / 7) % 44; gx < W; gx += 44) ctx.fillRect(gx, suelo + 10, 4, 4);
      } else if (tema.familia !== "duelo") {
        // ── Suelo pradera continuo (runner), con canto iluminado ──
        dibujarSuelo(ctx, suelo, W, H - suelo, tema.suelo);
        matas(ctx, suelo + U * 2, W, tema.hierba, performance.now() / 5);
      }
      const aleteo = Math.floor(performance.now() / 140) % 2 === 0;
      st.vallas.forEach(v => {
        if (v.tipo === "aguila" || v.tipo === "cuervo") {
          // Dos fotogramas de verdad: el aleteo lo marca `aleteo` (140 ms), igual que antes
          const s = SPR[(v.tipo === "cuervo" ? "cuervo" : "aguila") + (aleteo ? "Sube" : "Baja")];
          sprite(ctx, s, v.x - 1, v.y - 3, 2.4);
        } else if (v.tipo === "lobo") {
          // Mismo sprite que el Rey Lobo, anclado al suelo y escalado con la altura.
          // El hitbox mide 20 px: a proporción, la cabeza llegaba a ser 3,5 veces más
          // ancha y engañaba al saltar. Se estrecha (ESTRECHO) y se centra en el hitbox.
          const ch = v.h, ESTRECHO = 0.85, escL = ch / SPR.lobo.h;   // por debajo de 0,8 el pixel-art se deforma
          ctx.save();
          ctx.translate(v.x + v.w / 2, suelo - ch);
          ctx.scale(ESTRECHO, 1);
          sprite(ctx, SPR.lobo, -SPR.lobo.w * escL / 2, 0, escL);
          ctx.restore();
        } else {
          // Valla de madera con canto y sombra
          const yv = suelo - v.h;
          bloque(ctx, v.x, yv, U * 3, v.h, "#8B5A2B");
          bloque(ctx, v.x + v.w - U * 3, yv, U * 3, v.h, "#8B5A2B");
          bloque(ctx, v.x - U * 2, yv + U * 2, v.w + U * 4, U * 2.4, "#A9713B");
          bloque(ctx, v.x - U * 2, yv + v.h / 2, v.w + U * 4, U * 2.4, "#A9713B");
        }
      });
      // ── Entidades de los juegos nuevos ──
      if (tema.familia === "vuelo") {
        // La mitad TRASERA del anillo va detrás del avión; la delantera se pinta tras
        // la oveja. Los cuervos ya NO se pintan aquí: iban por debajo de la mitad
        // baja del anillo y el oro los tapaba justo al entrar (ver capa de delante).
        (st.anillos || []).filter(a => !a.ok).forEach(a => sprite(ctx, SPR.anilloAlto, a.x, a.y, 4.4));
      }
      if (tema.familia === "shooter") {
        if (st.jefe) {
          // jx = jefeX: el dibujo se alinea con el hitbox de las balas (antes iba 26 px a la izquierda)
          const jx = W - 104, jy = st.jefeYDraw || H * 0.30;
          // Rey Lobo: el MISMO sprite que los lobos pequeños, a lo grande, para que no desentonen.
          // Escala 4 exacta: el dibujo ocupa jx-2..jx+86 y jy-10..jy+86, o sea el hitbox
          // completo, y las orejas suben hasta la base de la corona.
          sprite(ctx, SPR.lobo, jx - 10, jy - 10, 4);
          if (st.jefe.herido > 0) { ctx.fillStyle = "rgba(200,60,60,0.35)"; ctx.fillRect(jx - 2, jy - 10, 88, 96); }
          // La corona, la barra de vida y el brillo de la boca son estado de juego, no textura
          // Corona: 13x7 en la rejilla del sprite, centrada entre las orejas (grid x7..x19)
          CORONA.forEach(([cx, cy, cw, cc]) => {
            ctx.fillStyle = CORONA_PAL[cc];
            ctx.fillRect(jx - 10 + (cx + 7) * 4, jy - 10 + (cy - 2) * 4, cw * 4, 4);
          });
          ctx.fillStyle = "rgba(0,0,0,0.5)"; ctx.fillRect(jx - 2, jy - 36, 88, 10);
          ctx.fillStyle = T.red; ctx.fillRect(jx, jy - 34, 84, 6);
          ctx.fillStyle = T.g1; ctx.fillRect(jx, jy - 34, 84 * (st.jefe.hp / st.jefe.max), 6);
          // Aviso de disparo: brillo naranja creciente en la boca
          if (st.jefeCarga > 0) {
            const cr2 = 5 + st.jefeCarga * 11;
            const cg = ctx.createRadialGradient(jx + 42, jy + 64, 2, jx + 42, jy + 64, cr2 + 8);
            cg.addColorStop(0, `rgba(255,170,60,${0.5 + st.jefeCarga * 0.5})`);
            cg.addColorStop(1, "rgba(255,120,40,0)");
            ctx.fillStyle = cg; ctx.beginPath(); ctx.arc(jx + 42, jy + 64, cr2 + 8, 0, 7); ctx.fill();
          }
        }
        (st.balas || []).forEach(b => {
          ctx.fillStyle = "#FDF6E3"; ctx.beginPath(); ctx.arc(b.x, b.y, 6, 0, 7); ctx.fill();
          ctx.fillStyle = "rgba(0,0,0,0.15)"; ctx.beginPath(); ctx.arc(b.x + 1.5, b.y + 1.5, 3, 0, 7); ctx.fill();
        });
        (st.balasJefe || []).forEach(b => {
          ctx.fillStyle = "rgba(255,120,40,0.4)"; ctx.beginPath(); ctx.arc(b.x + 16, b.y + 7, 11, 0, 7); ctx.fill();
          ctx.fillStyle = "#FF6A1E"; ctx.beginPath(); ctx.arc(b.x + 12, b.y + 7, 8, 0, 7); ctx.fill();
          ctx.fillStyle = "#FFC04D"; ctx.beginPath(); ctx.arc(b.x + 10, b.y + 6, 4, 0, 7); ctx.fill();
        });
      }
      if (tema.familia === "duelo") {
        const rr = (x, y, w, h, r) => { ctx.beginPath();
          ctx.moveTo(x + r, y); ctx.arcTo(x + w, y, x + w, y + h, r); ctx.arcTo(x + w, y + h, x, y + h, r);
          ctx.arcTo(x, y + h, x, y, r); ctx.arcTo(x, y, x + w, y, r); ctx.closePath(); };
        const d = st.duelo || { fase: "tapete", cargando: true, flot: [], psYo: 300, psRiv: 300, golpeYo: 0, golpeRiv: 0 };
        const XS = [26, 126, 226], CW = 88, CH = 116;
        const ICONO_CARTA = { A: "⚔️", D: "🛡️", P: "🍎" };
        const COLOR_CARTA = { A: "#C43A32", D: "#2E6FB0", P: "#2D9B5A" };
        const ovejitaOro = (cx2, cy2) => {   // dorso: la oveja en oro de marca #C9A227
          ctx.fillStyle = "#C9A227";
          ctx.fillRect(cx2 - 14, cy2 - 4, 24, 12); ctx.fillRect(cx2 - 10, cy2 - 10, 18, 7);
          ctx.fillRect(cx2 + 8, cy2 - 9, 9, 10); ctx.fillRect(cx2 - 10, cy2 + 8, 3, 6); ctx.fillRect(cx2 + 1, cy2 + 8, 3, 6);
          ctx.fillStyle = "#7A5E10"; ctx.fillRect(cx2 + 13, cy2 - 7, 2, 2);
        };
        // Las cartas van con bloque(): contorno, luz arriba-izquierda y sombra abajo-derecha
        const cartaDorso = (x, y, w, h) => { bloque(ctx, x, y, w, h, "#2D9B5A"); ovejitaOro(x + w / 2, y + h / 2); };
        const cartaFrente = (x, y, w, h, mov) => {
          bloque(ctx, x, y, w, h, COLOR_CARTA[mov]);
          ctx.font = "36px system-ui"; ctx.textAlign = "center"; ctx.textBaseline = "middle";
          ctx.fillText(ICONO_CARTA[mov], x + w / 2, y + h / 2 + 2);
          ctx.textBaseline = "alphabetic"; ctx.textAlign = "left";
        };
        const barraVida = (x, y, wB, ps) => {
          ctx.fillStyle = "rgba(0,0,0,0.5)"; rr(x - 2, y - 2, wB + 4, 14, 7); ctx.fill();
          ctx.fillStyle = "#26313D"; rr(x, y, wB, 10, 5); ctx.fill();
          const f = Math.max(0, ps / 300);
          ctx.fillStyle = ps <= 75 ? "#E04545" : ps <= 150 ? "#E07A2A" : T.g1;
          if (f > 0) { rr(x, y, wB * f, 10, 5); ctx.fill(); }
        };
        if (d.fase === "tapete") {
          // ── Tapete de casino: 👑 top 1 · 🥈 top 2 · ❔ aleatorio ──
          const gt = ctx.createRadialGradient(W / 2, H * 0.38, 30, W / 2, H * 0.38, 330);
          gt.addColorStop(0, "#2E7D46"); gt.addColorStop(1, "#0B3A1C");
          ctx.fillStyle = gt; ctx.fillRect(0, 0, W, H);
          ctx.strokeStyle = "rgba(255,255,255,0.045)"; ctx.lineWidth = 1;
          for (let li = -H; li < W; li += 26) {
            ctx.beginPath(); ctx.moveTo(li, 0); ctx.lineTo(li + H, H); ctx.stroke();
            ctx.beginPath(); ctx.moveTo(li + H, 0); ctx.lineTo(li, H); ctx.stroke();
          }
          ctx.strokeStyle = "rgba(255,216,77,0.35)"; ctx.lineWidth = 2;
          rr(10, 10, W - 20, H - 20, 18); ctx.stroke();
          ctx.fillStyle = "rgba(255,216,77,0.5)";
          [[22, 22], [W - 22, 22], [22, H - 22], [W - 22, H - 22]].forEach(([ex, ey]) => {
            ctx.beginPath(); ctx.moveTo(ex, ey - 5); ctx.lineTo(ex + 5, ey); ctx.lineTo(ex, ey + 5); ctx.lineTo(ex - 5, ey); ctx.closePath(); ctx.fill();
          });
          ctx.textAlign = "center";
          ctx.fillStyle = "#CFEBD8"; ctx.font = "bold 11px system-ui";
          ctx.fillText("DUELO DE OVEJAS", W / 2, 118);
          ctx.fillStyle = "#FFFFFF"; ctx.font = "bold 22px system-ui";
          ctx.fillText("Elige a tu rival", W / 2, 150);
          const rv = d.rivales || [];
          if (d.cargando) {
            ctx.fillStyle = "rgba(255,255,255,0.85)"; ctx.font = "bold 14px system-ui";
            ctx.fillText("Buscando al rebaño…", W / 2, 330);
          } else if (rv.length === 0) {
            ctx.fillStyle = "rgba(255,255,255,0.85)"; ctx.font = "bold 12px system-ui";
            ctx.fillText("Aún no hay rivales con puntos esta semana", W / 2, 192);
            ctx.fillStyle = "rgba(255,255,255,0.62)"; ctx.font = "bold 11px system-ui";
            ctx.fillText("Entrena contra Bo: nadie pierde puntos", W / 2, 212);
            const rxB = 124, RWB = 92, RYB = 250, RHB = 150;
            const latB = Math.sin(performance.now() / 260) * 3;
            ctx.font = "26px system-ui";
            ctx.fillText("🐑", rxB + RWB / 2, RYB - 12 + latB);
            bloque(ctx, rxB, RYB, RWB, RHB, "#EAE4CC");
            ctx.fillStyle = "#0f4a2a"; ctx.font = "bold 11px system-ui";
            ctx.fillText("Bo", rxB + RWB / 2, RYB + 22);
            pintarTramos(RIVAL_BOT.px, rxB + RWB / 2 - 26, RYB + 32, 1.6);
            ctx.fillStyle = "#8A6508"; ctx.font = "bold 10.5px system-ui";
            ctx.fillText("«entrenador»", rxB + RWB / 2, RYB + RHB - 12);
            ctx.fillStyle = T.au1; ctx.font = "bold 10px system-ui";
            ctx.fillText("Amistoso", rxB + RWB / 2, RYB + RHB + 22);
            ctx.fillStyle = "rgba(255,255,255,0.75)"; ctx.font = "bold 11px system-ui";
            ctx.fillText("Sin robo de puntos · el botín de partida sí cuenta", W / 2, 456);
          } else {
            const RXS = [18, 124, 230], RW2 = 92, RY = 250, RH2 = 150;
            const insignias = ["👑", "🥈", ""];
            [0, 1, 2].forEach(i => {
              const rx = RXS[i];
              const info = i === 0 ? rv[0] : i === 1 ? (rv[1] || null) : null;
              if (i === 1 && !info) return;                    // con un solo rival: 👑 y ❔
              if (insignias[i]) {
                const lat = Math.sin(performance.now() / 260 + i) * 3;
                ctx.font = "26px system-ui"; ctx.textAlign = "center";
                ctx.fillText(insignias[i], rx + RW2 / 2, RY - 12 + lat);
              }
              if (info) {
                // Carta del rival: usuario arriba · su oveja real en medio · nombre de la oveja debajo
                bloque(ctx, rx, RY, RW2, RH2, "#EAE4CC");
                ctx.fillStyle = "#0f4a2a"; ctx.font = "bold 11px system-ui"; ctx.textAlign = "center";
                ctx.fillText(String(info.usuario).slice(0, 11), rx + RW2 / 2, RY + 22);
                pintarTramos(info.px, rx + RW2 / 2 - 26, RY + 32, 1.6);
                ctx.fillStyle = "#8A6508"; ctx.font = "bold 10.5px system-ui";
                ctx.fillText("«" + String(info.oveja).slice(0, 10) + "»", rx + RW2 / 2, RY + RH2 - 12);
                ctx.fillStyle = T.au1; ctx.font = "bold 10px system-ui";
                ctx.fillText("🏆 " + info.pts + " pts", rx + RW2 / 2, RY + RH2 + 22);
              } else {
                cartaDorso(rx, RY, RW2, RH2);
                ctx.fillStyle = "#EAF7EE"; ctx.font = "bold 11px system-ui"; ctx.textAlign = "center";
                ctx.fillText("Aleatorio", rx + RW2 / 2, RY + 22);
                ctx.font = "38px system-ui";
                ctx.fillText("❔", rx + RW2 / 2, RY + 96);
                ctx.fillStyle = "rgba(234,247,238,0.8)"; ctx.font = "bold 11px system-ui";
                ctx.fillText("¿?", rx + RW2 / 2, RY + RH2 - 12);
              }
            });
            ctx.fillStyle = "rgba(255,255,255,0.75)"; ctx.font = "bold 11px system-ui";
            ctx.fillText("Ganador +100 · Perdedor −100", W / 2, 456);
          }
          ctx.textAlign = "left";
        } else {
          // ── Tablero vertical: rival y barra arriba · sus cartas · las tuyas · tu Bo y barra abajo ──
          const r0 = d.rival || { usuario: "Rival", oveja: "Bo", pts: 0 };
          ctx.fillStyle = "rgba(0,0,0,0.32)";
          rr(8, 6, W - 16, 40, 12); ctx.fill();
          rr(8, 512, W - 16, 42, 12); ctx.fill();
          ctx.fillStyle = T.cr; ctx.font = "bold 12px system-ui";
          ctx.fillText("🐑 " + String(r0.usuario).slice(0, 10) + " · «" + String(r0.oveja).slice(0, 10) + "»", 14, 22);
          ctx.fillStyle = T.au1; ctx.font = "bold 10px system-ui";
          ctx.fillText("🏆 " + r0.pts, 14, 38);
          barraVida(96, 30, W - 200, d.psRiv);
          ctx.fillStyle = "rgba(255,255,255,0.7)"; ctx.font = "bold 9px system-ui";
          ctx.fillText(Math.max(0, d.psRiv) + "/300", W - 96, 38);
          // El límite de turnos tiene que verse: decide el combate si nadie cae
          ctx.textAlign = "right";
          ctx.fillStyle = (d.turno || 0) >= MAX_TURNOS - 2 ? "#FFD84D" : "rgba(255,255,255,0.5)";
          ctx.font = "bold 9.5px system-ui";
          ctx.fillText("Turno " + Math.min(d.turno || 0, MAX_TURNOS) + "/" + MAX_TURNOS, W - 14, 22);
          ctx.textAlign = "left";
          const shR = d.golpeRiv > 0 ? Math.sin(d.golpeRiv * 0.9) * 4 : 0;
          ctx.fillStyle = "rgba(0,0,0,0.30)";
          ctx.beginPath(); ctx.ellipse(W / 2, 114, 34, 7, 0, 0, Math.PI * 2); ctx.fill();
          pintarTramos(d.golpeRiv > 0 && r0.pxTriste ? r0.pxTriste : (r0.px || px), W / 2 - 32 + shR, 48, 2);
          // Cartas del rival boca abajo; en la revelación solo queda la suya y SE VOLTEA
          const RY1 = 128;
          [0, 1, 2].forEach(i => {
            const cxC = XS[i];
            if (d.fase === "turno") { cartaDorso(cxC, RY1, CW, CH); return; }
            if (i !== d.suIdx) return;
            const ft = Math.min(1, d.t / 34);
            const wf = Math.max(6, Math.abs(Math.cos(Math.PI * ft)) * CW);
            const xf = cxC + (CW - wf) / 2;
            if (ft < 0.5) cartaDorso(xf, RY1 + 8, wf, CH);
            else cartaFrente(xf, RY1 + 8, wf, CH, d.suCarta);
          });
          // Tus tres cartas boca arriba: solo el icono, sin descripción
          const MY1 = 300;
          [0, 1, 2].forEach(i => {
            const mov = ["A", "D", "P"][i];
            if (d.fase !== "turno" && i !== d.miIdx) return;
            const lift = d.fase !== "turno" && i === d.miIdx ? -8 : 0;
            cartaFrente(XS[i], MY1 + lift, CW, CH, mov);
            if (d.fase === "turno") {
              const pj = 0.3 + 0.25 * Math.sin(performance.now() / 260 + i * 1.4);
              ctx.strokeStyle = `rgba(255,216,77,${pj})`; ctx.lineWidth = 2.5;
              rr(XS[i] + 2, MY1 + 2, CW - 4, CH - 4, 6); ctx.stroke();
            }
            if (lift) { ctx.strokeStyle = T.au1; ctx.lineWidth = 3; rr(XS[i], MY1 + lift, CW, CH, 6); ctx.stroke(); }
          });
          if (d.fase === "revela") {
            // Medallón VS entre las dos manos, como separador del tablero
            ctx.fillStyle = "#1A1000";
            ctx.beginPath(); ctx.arc(W / 2, 272, 17, 0, Math.PI * 2); ctx.fill();
            const gv = ctx.createLinearGradient(0, 256, 0, 288);
            gv.addColorStop(0, "#FFD84D"); gv.addColorStop(1, "#C9A227");
            ctx.fillStyle = gv;
            ctx.beginPath(); ctx.arc(W / 2, 270, 16, 0, Math.PI * 2); ctx.fill();
            ctx.fillStyle = "#3A2A00"; ctx.font = "bold 13px system-ui";
            ctx.textAlign = "center"; ctx.textBaseline = "middle";
            ctx.fillText("VS", W / 2, 271);
            ctx.textBaseline = "alphabetic"; ctx.textAlign = "left";
          }
          if (d.fase === "turno") {
            ctx.fillStyle = "rgba(0,0,0,0.45)";
            rr(W / 2 - 62, 261, 124, 22, 11); ctx.fill();
            ctx.fillStyle = "rgba(255,255,255,0.85)"; ctx.font = "bold 11px system-ui"; ctx.textAlign = "center";
            ctx.fillText("Elige una carta", W / 2, 276);
            ctx.textAlign = "left";
          }
          // Tu Bo con sus personalizaciones; feliz de normal, triste el instante del golpe
          const shY = d.golpeYo > 0 ? Math.sin(d.golpeYo * 0.9) * 4 : 0;
          ctx.fillStyle = "rgba(0,0,0,0.30)";
          ctx.beginPath(); ctx.ellipse(W / 2, 504, 34, 7, 0, 0, Math.PI * 2); ctx.fill();
          pintarTramos(d.golpeYo > 0 ? pxTriste : pxFeliz, W / 2 - 32 + shY, 438, 2);
          ctx.fillStyle = T.cr; ctx.font = "bold 12px system-ui";
          ctx.fillText("🐑 " + String(nombre || "Tu Bo").slice(0, 12), 14, 530);
          if (d.misPts !== null && d.misPts !== undefined) {
            ctx.fillStyle = T.au1; ctx.font = "bold 10px system-ui";
            ctx.fillText("🏆 " + d.misPts, 14, 546);
          }
          barraVida(96, 522, W - 200, d.psYo);
          ctx.fillStyle = "rgba(255,255,255,0.7)"; ctx.font = "bold 9px system-ui";
          ctx.fillText(Math.max(0, d.psYo) + "/300", W - 96, 530);
          // Sin narración: daños y curaciones flotantes junto a cada oveja, y nada más
          (d.flot || []).forEach(f => {
            const a2 = Math.max(0, 1 - f.t / 46);
            const fy = (f.lado === "yo" ? 470 : 100) - f.y;
            ctx.font = "bold 19px system-ui"; ctx.textAlign = "center";
            ctx.lineWidth = 4; ctx.strokeStyle = `rgba(0,0,0,${0.55 * a2})`;
            ctx.strokeText(f.tx, W / 2 + 58, fy);
            ctx.fillStyle = f.mal ? `rgba(255,138,138,${a2})` : `rgba(125,245,168,${a2})`;
            ctx.fillText(f.tx, W / 2 + 58, fy);
            ctx.textAlign = "left";
          });
          if (d.fase === "fin") {
            ctx.fillStyle = "rgba(10,15,22,0.86)"; ctx.fillRect(0, 0, W, H);
            ctx.textAlign = "center";
            const gano = d.resultado === "gana";
            const tablas = d.resultado === "empate";
            ctx.font = "44px system-ui"; ctx.fillText(tablas ? "🤝" : gano ? "🏆" : "😵", W / 2, 252);
            ctx.fillStyle = "#FFFFFF"; ctx.font = "bold 24px system-ui";
            ctx.fillText(tablas ? "Empate" : gano ? "¡Victoria!" : "Derrota…", W / 2, 298);
            const amistoso = !!(d.rival && d.rival.bot);
            if (tablas) {
              ctx.fillStyle = "rgba(255,255,255,0.82)"; ctx.font = "bold 15px system-ui";
              ctx.fillText("Sin cambios en el marcador", W / 2, 332);
            } else if (amistoso) {
              ctx.fillStyle = "rgba(255,255,255,0.82)"; ctx.font = "bold 15px system-ui";
              ctx.fillText("Amistoso · sin robo de puntos", W / 2, 332);
            } else {
              ctx.fillStyle = gano ? T.au1 : "#FF8A8A"; ctx.font = "bold 22px system-ui";
              ctx.fillText(gano ? "+100 puntos" : "−100 puntos", W / 2, 332);
            }
            if (d.porLimite) {
              ctx.fillStyle = "rgba(255,255,255,0.5)"; ctx.font = "bold 10.5px system-ui";
              ctx.fillText("Límite de " + MAX_TURNOS + " turnos · decide quien tenga más PS", W / 2, 224);
            }
            // Los dos marcadores, separados y legibles: el robo semanal arriba,
            // el botín de esta partida (que crece con la racha) justo debajo.
            if (gano && d.botin) {
              ctx.fillStyle = "#7DF5A8"; ctx.font = "bold 13px system-ui";
              ctx.fillText("+" + d.botin + " a la partida" +
                (d.racha > 1 ? "  ·  " + d.racha + "ª seguida" : ""), W / 2, 352);
            }
            if (d.misPts !== null && d.misPts !== undefined) {
              ctx.fillStyle = "rgba(255,255,255,0.75)"; ctx.font = "bold 12px system-ui";
              ctx.fillText("Esta semana llevas " + d.misPts + " pts", W / 2, gano && d.botin ? 369 : 358);
            }
            if (gano || tablas) {
              // El orbe aparece al ganar o al empatar: la derrota es la única que cierra
              const gb = ctx.createLinearGradient(0, 380, 0, 440);
              gb.addColorStop(0, "#B08AF0"); gb.addColorStop(1, "#5A2EA8");
              ctx.fillStyle = "#3E1E80"; rr(52, 386, W - 104, 58, 16); ctx.fill();
              ctx.fillStyle = gb; rr(52, 380, W - 104, 58, 16); ctx.fill();
              ctx.fillStyle = "#FFFFFF"; ctx.font = "bold 15px system-ui";
              ctx.fillText("🔮 Pasar al siguiente juego", W / 2, 415);
              ctx.fillStyle = "rgba(255,255,255,0.12)"; rr(82, 456, W - 164, 42, 12); ctx.fill();
              ctx.strokeStyle = "rgba(255,255,255,0.35)"; ctx.lineWidth = 1.5; rr(82, 456, W - 164, 42, 12); ctx.stroke();
              ctx.fillStyle = "rgba(255,255,255,0.85)"; ctx.font = "bold 12.5px system-ui";
              ctx.fillText("🎲 Otro duelo · rival aleatorio", W / 2, 482);
            } else if (d.t > 40) {
              ctx.fillStyle = "rgba(255,255,255,0.6)"; ctx.font = "bold 12px system-ui";
              ctx.fillText("Toca para terminar la partida", W / 2, 400);
            }
            ctx.textAlign = "left";
          }
        }
      }

      // Consumible: orbe brillante; disco + icono según el juego destino
      st.consumibles.forEach(k => {
        const fy = k.y + (k.caida ? 0 : Math.sin(performance.now() / 250) * 5);
        const cx = k.x + 18, cy = fy + 18, r = 23;
        const CFG = {
          noche:  { halo: "rgba(150,180,255,0.95)", g: ["#3A4A80", "#1E2A55", "#0E1638"], borde: "#8FA8E8" },
          oro:    { halo: "rgba(120,240,160,0.95)", g: ["#3BE07A", "#1E9E52", "#0E6B34"], borde: "#7DF5A8" },
          vuelo:  { halo: "rgba(174,220,248,0.95)", g: ["#7EC8F0", "#3A8AC8", "#14507E"], borde: "#AEDCF8" },
          jefe:   { halo: "rgba(255,130,130,0.95)", g: ["#F56A6A", "#C42A2A", "#7E0E0E"], borde: "#FF9A9A" },
          duelo:  { halo: "rgba(207,174,248,0.95)", g: ["#B08AF0", "#7A4CD0", "#3E1E80"], borde: "#CFAEF8" },
        }[k.to] || { halo: "rgba(255,224,120,0.95)", g: ["#FFF3B0", "#FFD84D", "#E0A000"], borde: "#B8860B" };
        const glow = ctx.createRadialGradient(cx, cy, 4, cx, cy, r + 14);
        glow.addColorStop(0, CFG.halo); glow.addColorStop(1, "rgba(255,255,255,0)");
        ctx.fillStyle = glow; ctx.beginPath(); ctx.arc(cx, cy, r + 14, 0, 7); ctx.fill();
        const grad = ctx.createRadialGradient(cx - 6, cy - 6, 2, cx, cy, r);
        grad.addColorStop(0, CFG.g[0]); grad.addColorStop(0.6, CFG.g[1]); grad.addColorStop(1, CFG.g[2]);
        ctx.fillStyle = grad; ctx.beginPath(); ctx.arc(cx, cy, r, 0, 7); ctx.fill();
        ctx.strokeStyle = CFG.borde; ctx.lineWidth = 3; ctx.stroke();
        // Icono de alto contraste
        if (k.to === "noche") {
          ctx.fillStyle = "#FFFFFF"; ctx.beginPath(); ctx.arc(cx - 1, cy, 12, 0, 7); ctx.fill();
          ctx.fillStyle = CFG.g[1]; ctx.beginPath(); ctx.arc(cx + 5, cy - 3, 11, 0, 7); ctx.fill();
          ctx.fillStyle = "#FFFFFF"; ctx.fillRect(cx + 8, cy + 6, 3, 3);
        } else if (k.to === "oro") {
          ctx.fillStyle = "#FFFFFF"; ctx.font = "bold 30px system-ui";
          ctx.textAlign = "center"; ctx.textBaseline = "middle";
          ctx.fillText("$", cx, cy + 1);
          ctx.textBaseline = "alphabetic"; ctx.textAlign = "left";
        } else if (k.to === "vuelo") {
          // Avioneta de trazo blanco
          ctx.strokeStyle = "#FFFFFF"; ctx.lineWidth = 3; ctx.lineCap = "round";
          ctx.beginPath(); ctx.moveTo(cx - 12, cy + 3); ctx.lineTo(cx + 12, cy + 3); ctx.stroke();
          ctx.beginPath(); ctx.moveTo(cx + 2, cy + 3); ctx.lineTo(cx - 6, cy - 9); ctx.stroke();
          ctx.beginPath(); ctx.moveTo(cx - 10, cy + 3); ctx.lineTo(cx - 14, cy - 4); ctx.stroke();
          ctx.lineCap = "butt";
        } else if (k.to === "jefe") {
          ctx.strokeStyle = "#FFFFFF"; ctx.lineWidth = 3;
          ctx.beginPath(); ctx.arc(cx, cy, 9, 0, 7); ctx.stroke();
          ctx.beginPath(); ctx.moveTo(cx - 14, cy); ctx.lineTo(cx + 14, cy); ctx.stroke();
          ctx.beginPath(); ctx.moveTo(cx, cy - 14); ctx.lineTo(cx, cy + 14); ctx.stroke();
          ctx.fillStyle = "#FFFFFF"; ctx.beginPath(); ctx.arc(cx, cy, 2.5, 0, 7); ctx.fill();
        } else if (k.to === "duelo") {
          // Espadas cruzadas
          ctx.strokeStyle = "#FFFFFF"; ctx.lineWidth = 3; ctx.lineCap = "round";
          ctx.beginPath(); ctx.moveTo(cx - 10, cy - 10); ctx.lineTo(cx + 10, cy + 10); ctx.stroke();
          ctx.beginPath(); ctx.moveTo(cx + 10, cy - 10); ctx.lineTo(cx - 10, cy + 10); ctx.stroke();
          ctx.beginPath(); ctx.moveTo(cx - 12, cy + 5); ctx.lineTo(cx - 5, cy + 12); ctx.stroke();
          ctx.beginPath(); ctx.moveTo(cx + 5, cy + 12); ctx.lineTo(cx + 12, cy + 5); ctx.stroke();
          ctx.lineCap = "butt";
        }
      });

      // Sombra de la oveja (runner y guarida): se encoge y aclara al saltar
      if (tema.familia === "runner" || tema.familia === "shooter") {
        const alt = (suelo - SH) - st.y;
        const k2 = Math.max(0, 1 - alt / 160);
        ctx.fillStyle = `rgba(0,0,0,${(0.28 * k2).toFixed(3)})`;
        ctx.beginPath();
        ctx.ellipse((st.sx !== undefined ? st.sx : SX) + SH / 2, suelo - 2,
          30 * (0.6 + 0.4 * k2), 7 * k2 + 2, 0, 0, 7);
        ctx.fill();
      }

      if (tema.familia === "vuelo") {
        // La oveja va DENTRO del avión: avión → oveja → fuselaje delantero → media anilla
        const ax = (st.sx !== undefined ? st.sx : SX) - 10, ay = st.y;
        const PA = 2.6, BA = 1.3;
        // Inclinación suave hacia donde vuela + hélice de dos fotogramas (solo dibujo)
        const inc = Math.max(-0.16, Math.min(0.16, ((st.objetivoY !== undefined ? st.objetivoY : st.y) - st.y) * 0.006));
        const pcx = ax + 19 * PA, pcy = ay + 11 * PA;
        ctx.save();
        ctx.translate(pcx, pcy); ctx.rotate(st.vivo ? inc : 0.32); ctx.translate(-pcx, -pcy);
        sprite(ctx, aleteo ? SPR.avion : SPR.avionGira, ax, ay, PA);
        const bxA = ax + 20 * PA - 16 * BA;   // centrada en la cabina
        const byA = ay + 8 * PA - 24 * BA;    // su y=24 cae en el borde del fuselaje (y=8)
        pintarTramos(st.vivo ? pxFeliz : pxTriste, bxA, byA, BA);
        sprite(ctx, SPR.avionFrente, ax, ay, PA);
        ctx.restore();
        // Estela de la hélice: rachitas de aire que salen del morro
        ctx.fillStyle = "rgba(255,255,255,0.35)";
        for (let ei = 0; ei < 3; ei++) {
          const ew = 10 + ((performance.now() / 40 + ei * 30) % 26);
          ctx.fillRect(ax - 6 - ew, pcy - 8 + ei * 8 + Math.sin(performance.now() / 90 + ei) * 2, ew * 0.55, 2);
        }
        (st.anillos || []).filter(a => !a.ok).forEach(a => sprite(ctx, SPR.anilloBajo, a.x, a.y, 4.4));
        // ── Cuervos: la capa de DELANTE, por encima del anillo y del avión ──
        // Es lo único que mata: tiene que verse siempre, y sobre todo cuando se
        // cruza con el oro. Un halo claro lo despega del anillo y del cielo.
        (st.aves || []).forEach(a => {
          const hx = a.x + 24, hy = a.y + 18;
          const halo = ctx.createRadialGradient(hx, hy, 6, hx, hy, 30);
          halo.addColorStop(0, "rgba(255,255,255,0.55)");
          halo.addColorStop(0.6, "rgba(255,255,255,0.22)");
          halo.addColorStop(1, "rgba(255,255,255,0)");
          ctx.fillStyle = halo;
          ctx.beginPath(); ctx.ellipse(hx, hy, 30, 24, 0, 0, 7); ctx.fill();
          sprite(ctx, SPR[aleteo ? "cuervoSube" : "cuervoBaja"], a.x, a.y, 2.4);
        });
        // Chispas doradas del anillo recién atravesado
        (st.chispas || []).forEach(c => {
          if (c.tipo === "onda") {
            const rw = 12 + c.t * 4.2;
            ctx.strokeStyle = `rgba(255,216,77,${Math.max(0, 0.75 - c.t * 0.042)})`;
            ctx.lineWidth = 3.5;
            ctx.beginPath(); ctx.arc(c.x, c.y, rw, 0, Math.PI * 2); ctx.stroke();
          } else {
            ctx.fillStyle = `rgba(255,${200 + (c.t % 3) * 18},77,${Math.max(0, 1 - c.t / 30)})`;
            ctx.fillRect(c.x - 2, c.y - 2, 4, 4);
          }
        });
        (st.flotantes || []).forEach(f => {
          const a2 = Math.max(0, 1 - f.t / 42);
          ctx.font = "bold 16px system-ui"; ctx.textAlign = "center";
          ctx.lineWidth = 4; ctx.strokeStyle = `rgba(255,255,255,${a2})`;
          ctx.strokeText("+" + PTS_ANILLO, f.x, f.y);
          ctx.fillStyle = `rgba(138,101,8,${a2})`; ctx.fillText("+" + PTS_ANILLO, f.x, f.y);
          ctx.textAlign = "left";
        });
      } else if (tema.familia !== "duelo") {
        const ovejaX = st.sx !== undefined ? st.sx : SX;
        px.forEach(([x, y, w, c]) => { ctx.fillStyle = c; ctx.fillRect(ovejaX + x * S, st.y + y * S, w * S + 0.5, S + 0.5); });
      }
      // Flash de transición al coger el consumible
      if (st.transicion > 0) {
        ctx.fillStyle = `rgba(255,255,255,${st.transicion * 0.6})`;
        ctx.fillRect(0, 0, W, H);
      }
      ctx.fillStyle = st.modo === "noche" ? "#DDE4F5" : T.cr;
      ctx.font = "bold 20px monospace";
      ctx.lineWidth = 3.5; ctx.strokeStyle = "rgba(0,0,0,0.55)";
      ctx.strokeText(String(st.score).padStart(4, "0"), W - 76, 32);
      ctx.fillText(String(st.score).padStart(4, "0"), W - 76, 32);
      if (cuentaRef.current > 0) {
        ctx.fillStyle = "rgba(10,26,15,0.5)"; ctx.fillRect(0, 0, W, H);
        ctx.textAlign = "center";
        ctx.fillStyle = "rgba(255,255,255,0.85)"; ctx.font = "bold 22px system-ui";
        ctx.fillText("¡Prepárate!", W / 2, H / 2 - 76);
        ctx.fillStyle = T.g2; ctx.font = "bold 120px system-ui";
        ctx.fillText(String(cuentaRef.current), W / 2, H / 2 + 38);

        ctx.textAlign = "left";
      }
      raf = requestAnimationFrame(loop);
    };
    raf = requestAnimationFrame(loop);
    return () => {
      cancelAnimationFrame(raf);
      tapRef.current = null;
      window.removeEventListener("keydown", onKey);
      window.removeEventListener("pointermove", onMove);
      window.removeEventListener("pointerup", onUp);
    };
  }, [jugando, color, eqKey]);

  // Cuenta atrás de preparación: 5,4,3,2,1 -> arranca
  useEffect(() => {
    if (!jugando || cuenta <= 0) return;
    const t = setTimeout(() => setCuenta(c => c - 1), 1000);
    return () => clearTimeout(t);
  }, [jugando, cuenta]);

  const cuentaRef = useRef(5);
  useEffect(() => { cuentaRef.current = cuenta; }, [cuenta]);

  // Ref del modo elegido: arrancar() vive en un closure fijado al montar
  // (arrancarRef se asigna una sola vez), así que lee el modo por ref para
  // no quedarse con el valor inicial. Y nada de TEMAS aquí: está dentro del
  // efecto del juego y no existe en este ámbito.
  const modoElegidoRef = useRef(modoElegido);
  useEffect(() => { modoElegidoRef.current = modoElegido; }, [modoElegido]);
  const arrancar = () => {
    // El duelo es por turnos: no necesita cuenta atrás, el tapete ya es su antesala
    const n0 = modoElegidoRef.current === "duelo" ? 0 : 5;
    setFin(false); setScore(0); cuentaRef.current = n0; setCuenta(n0); setJugando(true);
  };
  useEffect(() => { if (arrancarRef) arrancarRef.current = arrancar; }, []);
  const puedeJugar = partidasProp > 0 && esperaSeg <= 0 && !cargandoPartidas;

  return (
    <div style={{ position: "relative", display: "flex", flexDirection: "column", height: "100%",
      overflowY: jugando ? "hidden" : "auto" }}>
      {/* Pantalla previa: marco con info de partidas y botón Jugar */}
      {!jugando && !fin && (
        <div style={{ display: "flex", justifyContent: "center", padding: "12px 6px" }}>
          <div style={{ position: "relative", width: "100%", maxWidth: 340, margin: "auto",
            background: `linear-gradient(160deg, ${alpha(T.g1,0.10)}, ${alpha(T.bgCard,0.6)})`,
            border: `2.5px solid ${T.g1}`, borderRadius: 24, padding: "26px 22px 28px",
            textAlign: "center", boxShadow: "0 8px 30px rgba(0,0,0,0.4)" }}>
            {/* esquinas decorativas */}
            <div style={{ position: "absolute", top: 10, left: 10, fontSize: 16 }}>🐑</div>
            <div style={{ position: "absolute", top: 10, right: 10, fontSize: 16 }}>🎮</div>

            <div style={{ fontSize: 13, color: T.au1, fontWeight: 900, letterSpacing: 1.5,
              textTransform: "uppercase", marginBottom: 14 }}>Zona de juego</div>

            <div style={{ fontSize: 14, color: T.cr, fontWeight: 700, lineHeight: 1.55, marginBottom: 14 }}>
              Puedes jugar un total de<br/><b style={{ color: T.g2, fontSize: 17 }}>3 partidas al día</b>
            </div>

            <div style={{ fontSize: 15, color: T.t2, fontWeight: 700, marginBottom: 8 }}>
              Cada partida cuesta un diamante 💎
            </div>
            <div style={{ fontSize: 26, letterSpacing: 6, marginBottom: 6 }}>
              {"💎".repeat(partidasProp)}{"▫️".repeat(3 - partidasProp)}
            </div>
            <div style={{ fontSize: 12, color: T.t3, fontWeight: 700, marginBottom: 20 }}>
              {partidasProp > 0 ? `Te quedan ${partidasProp} hoy` : "Sin partidas por hoy — ¡vuelve mañana!"}
            </div>

            <div style={{ margin: "10px auto 14px", display: "inline-flex", gap: 16,
              background: "rgba(255,255,255,0.06)", border: "1.5px solid rgba(255,255,255,0.12)",
              borderRadius: 12, padding: "8px 16px", fontSize: 12, fontWeight: 800 }}>
              <span style={{ color: T.t2 }}>Hoy: <b style={{ color: T.cr }}>{puntosHoy} pts</b></span>
              <span style={{ color: T.t2 }}>Semana: <b style={{ color: T.au1 }}>{puntosSemana} pts</b></span>
            </div>
            {/* El botón cuenta la verdad del servidor: se apaga mientras se leen los
                contadores del día y durante los 30 s que la RPC exige entre partidas.
                Antes cobraba el diamante y el servidor rechazaba la partida después. */}
            <button onClick={() => onPagarYJugar(modoElegido)} disabled={!puedeJugar}
              style={{ background: puedeJugar ? `linear-gradient(180deg,${T.g2},${T.g1})` : "rgba(255,255,255,0.1)",
                border: "none", borderRadius: 18, color: puedeJugar ? T.bg : T.t3,
                fontWeight: 900, fontSize: puedeJugar ? 18 : 14.5, padding: "15px 28px",
                cursor: puedeJugar ? "pointer" : "not-allowed", fontFamily: "inherit",
                boxShadow: puedeJugar ? `0 5px 0 ${T.g3}` : "none",
                display: "inline-flex", alignItems: "center", gap: 10 }}>
              {cargandoPartidas ? "⏳ Leyendo tus partidas…"
                : esperaSeg > 0 ? `⏳ Siguiente partida en ${esperaSeg} s`
                : <>▶ Jugar <span style={{ fontSize: 19 }}>💎</span></>}
            </button>

            {/* Factual y sin reproche; la salida es la revancha, no la pérdida */}
            {avisoDuelos && (
              <div style={{ margin: "14px 0 0", background: "rgba(176,138,240,0.12)",
                border: "1.5px solid rgba(176,138,240,0.45)", borderRadius: 14,
                padding: "11px 14px", textAlign: "left" }}>
                <div style={{ fontSize: 13, fontWeight: 900 }}>
                  ⚔️ Te han retado {avisoDuelos.total === 1 ? "1 vez" : `${avisoDuelos.total} veces`}
                </div>
                <div style={{ fontSize: 11.5, color: T.t2, fontWeight: 800, marginTop: 2 }}>
                  {avisoDuelos.victorias} {avisoDuelos.victorias === 1 ? "victoria" : "victorias"} · {avisoDuelos.derrotas} {avisoDuelos.derrotas === 1 ? "derrota" : "derrotas"}
                </div>
                <div style={{ fontSize: 15, fontWeight: 900, marginTop: 3,
                  color: avisoDuelos.saldo >= 0 ? T.g2 : "#FF8A8A" }}>
                  {avisoDuelos.saldo >= 0 ? "+" : ""}{avisoDuelos.saldo} puntos
                </div>
                <button onClick={() => { setModoElegido("duelo"); setAvisoDuelos(null); }}
                  style={{ marginTop: 8, background: "linear-gradient(160deg,#B08AF0,#5A2EA8)", border: "none",
                    borderRadius: 12, color: "#fff", fontWeight: 900, fontSize: 12.5, padding: "8px 14px",
                    cursor: "pointer", fontFamily: "inherit", boxShadow: "0 3px 0 #3E1E80" }}>
                  ⚔️ Devolver el golpe
                </button>
              </div>
            )}
            {/* ── Selector de juego: las 5 esferas ── */}
            {(() => {
              const JUEGOS = [
                { id: "noche", nombre: "El Salto del Rebaño", icono: "🌙",
                  desc: "Toca para saltar lobos al atardecer. Los cuervos no matan: te empujan hacia atrás.",
                  css: "radial-gradient(circle at 35% 30%, #3A4A80, #1E2A55 60%, #0E1638)", borde: "#8FA8E8" },
                { id: "oro", nombre: "La Cámara del Banco", icono: "💲",
                  desc: "Salta entre bloques y recoge monedas €. Si caes al hueco o te come el borde, fin.",
                  css: "radial-gradient(circle at 35% 30%, #3BE07A, #1E9E52 60%, #0E6B34)", borde: "#7DF5A8" },
                { id: "vuelo", nombre: "El Vuelo de Bo", icono: "✈️",
                  desc: "Desliza ↑↓: la avioneta se queda donde la dejes. Esquiva cuervos y atraviesa los anillos dorados por dentro.",
                  css: "radial-gradient(circle at 35% 30%, #7EC8F0, #3A8AC8 60%, #14507E)", borde: "#AEDCF8" },
                { id: "jefe", nombre: "El Rey Lobo", icono: "🎯",
                  desc: "Disparas sola. Jefe abajo: salta su bola y acierta desde el suelo. Jefe arriba: no saltes… salvo para darle.",
                  css: "radial-gradient(circle at 35% 30%, #F56A6A, #C42A2A 60%, #7E0E0E)", borde: "#FF9A9A" },
                { id: "duelo", nombre: "Duelo de Ovejas", icono: "⚔️",
                  desc: "Elige rival y combate por cartas: ⚔️ 🛡️ 🍎. El rival aprende tu patrón, 🛡️ contra 🛡️ desgasta a los dos y a los 12 turnos gana quien tenga más PS. El ganador le quita 100 puntos al perdedor; encadenar duelos suma botín creciente a la partida (120, 240, 360…).",
                  css: "radial-gradient(circle at 35% 30%, #B08AF0, #7A4CD0 60%, #3E1E80)", borde: "#CFAEF8" },
              ];
              const sel = JUEGOS.find(jj => jj.id === modoElegido) || JUEGOS[0];
              return (
                <div style={{ marginTop: 16 }}>
                  <div style={{ fontSize: 10.5, fontWeight: 900, letterSpacing: 1.2, textTransform: "uppercase",
                    color: T.t2, marginBottom: 9 }}>Elige tu juego</div>
                  <div style={{ display: "flex", justifyContent: "center", gap: 9 }}>
                    {JUEGOS.map(jj => (
                      <button key={jj.id} onClick={() => setModoElegido(jj.id)}
                        style={{ width: 46, height: 46, borderRadius: "50%", padding: 0, cursor: "pointer",
                          background: jj.css, fontFamily: "inherit",
                          border: `2.5px solid ${modoElegido === jj.id ? T.au1 : jj.borde}`,
                          boxShadow: modoElegido === jj.id
                            ? `0 0 12px ${alpha(T.au1,0.65)}, 0 3px 0 ${T.au3}`
                            : "0 3px 6px rgba(0,0,0,0.4)",
                          transform: modoElegido === jj.id ? "scale(1.12)" : "scale(1)",
                          transition: "all 0.15s",
                          display: "flex", alignItems: "center", justifyContent: "center" }}>
                        <span style={{ fontSize: 21, lineHeight: 1,
                          filter: "drop-shadow(0 1px 1px rgba(0,0,0,0.5))" }}>{jj.icono}</span>
                      </button>
                    ))}
                  </div>
                  <div style={{ marginTop: 11, minHeight: 58, background: "rgba(255,255,255,0.05)",
                    border: "1.5px solid rgba(255,255,255,0.1)", borderRadius: 12, padding: "9px 12px" }}>
                    <div style={{ fontSize: 12.5, fontWeight: 900, color: T.g2, marginBottom: 3 }}>
                      {sel.icono} {sel.nombre}
                    </div>
                    <div style={{ fontSize: 11.5, color: T.t2, lineHeight: 1.45, fontWeight: 600 }}>
                      {sel.desc}
                    </div>
                  </div>
                </div>
              );
            })()}
          </div>
        </div>
      )}

      {/* Escena del juego (la cuenta atrás 5-4-3-2-1 se dibuja DENTRO del canvas) */}
      {jugando && (
        <div style={{ flex: 1, position: "relative", minHeight: 0 }}>
          <canvas ref={canvasRef} width={340} height={680}
            onPointerDown={(e) => { e.preventDefault(); tapRef.current && tapRef.current(e); }}
            style={{ position: "absolute", inset: 0, width: "100%", height: "100%",
              display: "block", touchAction: "none" }} />
        </div>
      )}

      {/* Fin de partida */}
      {jugando && fin && (
        <div style={{ position: "absolute", inset: 0, display: "flex", flexDirection: "column",
          alignItems: "center", justifyContent: "center", gap: 8, background: alpha(T.bg,0.85),
          borderRadius: 14, animation: "popIn .2s ease-out", padding: "0 16px" }}>
          <div style={{ fontWeight: 900, fontSize: 16 }}>💥 ¡{nombre} ha tropezado!</div>
          <div style={{ fontSize: 13, color: T.au1, fontWeight: 800 }}>Puntos: {score} · Récord: {best}</div>
          <div style={{ fontSize: 12, color: T.g2, fontWeight: 800 }}>
            +{score} pts a tu marcador → esta semana llevas {puntosSemana}
          </div>
          <button onClick={() => { setJugando(false); setFin(false); onSalir && onSalir(); }}
            style={{ background: `linear-gradient(180deg,${T.g2},${T.g1})`, border: "none",
              borderRadius: 14, color: T.bg, fontWeight: 900, fontSize: 13.5, padding: "10px 20px",
              cursor: "pointer", fontFamily: "inherit", boxShadow: `0 3px 0 ${T.g3}` }}>
            Volver
          </button>
          <div style={{ fontSize: 10.5, color: "rgba(255,255,255,0.4)", textAlign: "center" }}>
            Para jugar otra vez, paga una gema 💎 desde el botón de la oveja
          </div>
        </div>
      )}
    </div>
  );
}
