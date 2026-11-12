/* Guía de ciudad — lógica de la app.
   Contenido: /data/<ciudad>.js (lugares y textos), <ciudad>-coords.js (ubicaciones), <ciudad>-extra.js (calidad, fotos, subte, eventos).
   Para sumar otra ciudad: agregar esos tres archivos y cambiar CITY_ID (o sumar un selector). */
(() => {
  "use strict";

  const CITY_ID = "caba";
  const city = window.CITY_DATA[CITY_ID];
  const X = (window.CITY_EXTRA && window.CITY_EXTRA[CITY_ID]) || {};
  const coords = (window.CITY_COORDS && window.CITY_COORDS[CITY_ID]) || {};
  const Z = (window.CITY_ZONES && window.CITY_ZONES[CITY_ID]) || null;
  const $ = (s, r) => (r || document).querySelector(s);
  const $$ = (s, r) => Array.from((r || document).querySelectorAll(s));
  const view = $("#view"), sheetWrap = $("#sheet-wrap"), sheet = $("#sheet"), toastEl = $("#toast");
  const hasMap = !!window.L;
  const WM = "https://upload.wikimedia.org/wikipedia/commons/";
  const DOW = ["domingo", "lunes", "martes", "miércoles", "jueves", "viernes", "sábado"];
  const DOWS = ["domingos", "lunes", "martes", "miércoles", "jueves", "viernes", "sábados"];
  const MONTHS = ["enero", "febrero", "marzo", "abril", "mayo", "junio", "julio", "agosto", "septiembre", "octubre", "noviembre", "diciembre"];
  const QL = { 3: "Destacado", 2: "Muy recomendado", 1: "Buena opción" };
  const PRICE_WORD = ["Gratis", "Económico", "Precio medio", "Caro", "Alta gama"];

  /* ── Utilidades ── */
  const esc = s => String(s == null ? "" : s).replace(/[&<>"']/g, c => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c]));
  const norm = s => String(s || "").normalize("NFD").replace(/[̀-ͯ]/g, "").toLowerCase();
  const slug = s => norm(s).replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "");
  const attr = o => esc(JSON.stringify(o));
  const store = {
    get(k, d) { try { const v = JSON.parse(localStorage.getItem(k)); return v == null ? d : v; } catch (e) { return d; } },
    set(k, v) { try { localStorage.setItem(k, JSON.stringify(v)); } catch (e) { /* sin almacenamiento */ } }
  };
  const km = (a, b) => {
    const r = Math.PI / 180, dLat = (b[0] - a[0]) * r, dLon = (b[1] - a[1]) * r;
    const s = Math.sin(dLat / 2) ** 2 + Math.cos(a[0] * r) * Math.cos(b[0] * r) * Math.sin(dLon / 2) ** 2;
    return 12742 * Math.asin(Math.sqrt(s));
  };
  const fmtKm = d => d < 1 ? Math.max(50, Math.round(d * 20) * 50) + " m" : d.toFixed(1).replace(".", ",") + " km";
  const cityNow = () => { try { return new Date(new Date().toLocaleString("en-US", { timeZone: X.tz || "America/Argentina/Buenos_Aires" })); } catch (e) { return new Date(); } };
  const listDays = a => a.map(d => DOWS[d]).join(a.length === 2 ? " y " : ", ");
  const photo = (ph, w) => {
    if (!ph) return "";
    if (ph.charAt(0) === "!") return WM + encodeURI(ph.slice(1));
    return WM + "thumb/" + encodeURI(ph) + "/" + w + "px-" + encodeURI(ph.split("/").pop());
  };
  let toastTimer = null;
  const toast = msg => {
    toastEl.textContent = msg; toastEl.classList.add("on");
    clearTimeout(toastTimer); toastTimer = setTimeout(() => toastEl.classList.remove("on"), 2600);
  };

  /* ── Índices ── */
  const cats = {};
  city.categories.forEach(c => { cats[c.id] = c; });
  const byId = {};
  const qual = {};
  Object.keys(X.quality || {}).forEach(level => X.quality[level].forEach(id => { qual[id] = +level; }));
  city.places.forEach(p => {
    p.id = slug(p.name);
    p.ll = coords[p.id] || null;
    p.q = qual[p.id] || (p.top ? 3 : 2);
    p.awards = (X.awards && X.awards[p.id]) || [];
    p.photo = (X.photos && X.photos[p.id]) || "";
    p.inCity = p.barrio !== "Fuera de CABA";
    p.diet = (X.diet && X.diet[p.id]) || [];                       // dietas para las que sirve (tarjeta #32)
    p.dietFull = (X.dietFull || []).indexOf(p.id) > -1;             // true = todo el local es apto
    p._search = norm([p.name, p.sub, p.barrio, p.address, p.desc, p.tip, (p.tags || []).join(" "), cats[p.cat].name, p.awards.join(" "), p.diet.join(" "), p.price === 0 ? "gratis gratuito" : ""].join(" "));
    byId[p.id] = p;
  });
  const places = city.places;
  const stations = [];
  Object.keys(X.stations || {}).forEach(line => X.stations[line].forEach(s => stations.push({ line, name: s[0], ll: [s[1], s[2]] })));
  const lineColor = {};
  (city.subte || []).forEach(l => { lineColor[l.line] = l.color; });

  /* ── Hoy: qué abre ── */
  const dayStatus = (p, dow) => {
    const only = X.only && X.only[p.id], closed = X.closed && X.closed[p.id];
    if (only) return only.indexOf(dow) > -1 ? { ok: true, text: "Funciona solo los " + listDays(only) } : { ok: false, text: "Solo los " + listDays(only) };
    if (closed && closed.indexOf(dow) > -1) return { ok: false, text: "Suele cerrar los " + listDays(closed) };
    if (closed) return { ok: true, text: "Suele cerrar los " + listDays(closed) };
    return null;
  };
  const todayStatus = p => dayStatus(p, cityNow().getDay());
  const openToday = p => { const s = todayStatus(p); return !s || s.ok; };

  /* ── Mi viaje (se guarda en este dispositivo) ── */
  const K = { plan: "guia.plan." + CITY_ID, prefs: "guia.prefs." + CITY_ID, wx: "guia.wx." + CITY_ID, fx: "guia.fx" };
  let plan = store.get(K.plan, null);
  if (!plan) plan = store.get("guia.favs." + CITY_ID, []).map(id => ({ id, day: 0 }));
  plan = plan.filter(x => x && byId[x.id]);
  const prefs = Object.assign({ days: 1, names: {}, cur: "USD", start: "", checks: {}, updated: 0 }, store.get(K.prefs, {}));
  prefs.profile = Object.assign({ diets: [], budget: 0, kids: false }, prefs.profile || {});
  const savePrefs = () => { prefs.updated = Date.now(); store.set(K.prefs, prefs); queueSync(); };
  /* Fecha de cada día del viaje (si el usuario cargó cuándo llega). */
  const dayDate = d => { if (!prefs.start) return null; const dt = new Date(prefs.start + "T12:00:00"); if (isNaN(dt)) return null; dt.setDate(dt.getDate() + d - 1); return dt; };
  const dayDow = d => { const dt = dayDate(d); return dt ? dt.getDay() : null; };
  const planOf = id => plan.find(x => x.id === id);
  const nDays = () => Math.max(1, prefs.days || 1, ...plan.map(x => x.day));
  const paintBadge = () => {
    const badge = $("#fav-count");
    badge.hidden = plan.length === 0;
    badge.textContent = plan.length;
  };
  const savePlan = () => {
    store.set(K.plan, plan);
    prefs.updated = Date.now(); store.set(K.prefs, prefs);
    paintBadge();
    queueSync();
  };

  /* ── Pasaporte porteño (tarjeta #37): lugares visitados y sellos. Las reglas de cada sello están en caba-extra.js. ── */
  prefs.visited = prefs.visited || {};
  const visitedPlaces = () => places.filter(p => prefs.visited[p.id]);
  const stampCount = s => {
    const v = visitedPlaces();
    if (s.barrios) return new Set(v.filter(p => p.inCity && p.barrio !== "Varios").map(p => p.barrio)).size;
    return v.filter(p => (!s.cat || p.cat === s.cat) && (!s.sub || p.sub === s.sub) && (!s.q || p.q >= s.q) && (!s.tag || (p.tags || []).some(t => s.tag.indexOf(t) > -1))).length;
  };
  const earnedStamps = () => (X.stamps || []).filter(s => stampCount(s) >= s.n);
  const visitLabel = id => prefs.visited[id] ? "✓ Ya fui" : "☐ Marcar que fui";
  const toggleVisit = id => {
    const before = earnedStamps().map(s => s.id);
    if (prefs.visited[id]) delete prefs.visited[id]; else prefs.visited[id] = Date.now();
    savePrefs();
    const fresh = earnedStamps().filter(s => before.indexOf(s.id) === -1);
    toast(fresh.length ? "🎉 Nuevo sello: " + fresh[0].icon + " " + fresh[0].name : prefs.visited[id] ? "Sumado a tu pasaporte" : "Quitado de tu pasaporte");
    $$('[data-visit="' + id + '"]').forEach(b => { b.setAttribute("aria-pressed", String(!!prefs.visited[id])); b.textContent = visitLabel(id); });
    if (route().name === "pasaporte" || route().name === "viaje") rerender();
  };
  const viewPassport = () => {
    const v = visitedPlaces(), stamps = X.stamps || [], got = earnedStamps();
    const barrios = new Set(v.filter(p => p.inCity && p.barrio !== "Varios").map(p => p.barrio)).size;
    return '<p><a class="link" href="#/viaje">← Mi viaje</a></p><h1 class="page-title">🛂 Pasaporte porteño</h1>' +
      '<p class="page-sub">Marcá "Ya fui" en cada lugar que conozcas y ganá sellos. Queda guardado en este dispositivo.</p>' +
      '<div class="pass-top"><div><b>' + v.length + "</b><span>" + (v.length === 1 ? "lugar visitado" : "lugares visitados") + "</span></div><div><b>" + barrios + "</b><span>" + (barrios === 1 ? "barrio" : "barrios") + "</span></div><div><b>" + got.length + "/" + stamps.length + "</b><span>sellos</span></div></div>" +
      '<div class="stamps">' + stamps.map(s => {
        const c = Math.min(stampCount(s), s.n), done = c >= s.n;
        return '<div class="stamp' + (done ? " done" : "") + '"><em aria-hidden="true">' + s.icon + "</em><b>" + esc(s.name) + "</b><span>" + esc(s.desc) + '</span><i>' + (done ? "¡Conseguido!" : c + " de " + s.n) + "</i></div>";
      }).join("") + "</div>" +
      (v.length ? '<section class="section">' + head("Dónde estuviste") + listHtml(v.sort((a, b) => prefs.visited[b.id] - prefs.visited[a.id])) + "</section>"
        : '<div class="empty" style="margin-top:20px"><em>🛂</em><b>Tu pasaporte está en blanco</b><p>Abrí cualquier lugar y tocá "Marcar que fui" cuando lo visites.</p><p class="plan-actions"><button class="btn primary" data-go="' + attr({}) + '">Explorar lugares</button></p></div>');
  };

  /* ── Pronóstico por día del viaje (tarjeta #37). Open-Meteo da hasta 16 días. ── */
  let fc = store.get("guia.fc." + CITY_ID, null);
  const loadForecast = () => {
    if (fc && Date.now() - fc.t < 3 * 3600e3) return;
    const c = city.center || [-34.6037, -58.3816];
    fetch("https://api.open-meteo.com/v1/forecast?latitude=" + c[0] + "&longitude=" + c[1] + "&daily=weather_code,temperature_2m_max,temperature_2m_min,precipitation_probability_max&forecast_days=16&timezone=" + encodeURIComponent(X.tz || "America/Argentina/Buenos_Aires"))
      .then(r => r.json()).then(j => {
        const days = {};
        j.daily.time.forEach((d, i) => { days[d] = [j.daily.weather_code[i], Math.round(j.daily.temperature_2m_max[i]), Math.round(j.daily.temperature_2m_min[i]), j.daily.precipitation_probability_max[i] || 0]; });
        fc = { t: Date.now(), days };
        store.set("guia.fc." + CITY_ID, fc);
        if (route().name === "viaje" && sheetId === null) rerender();
      }).catch(() => { /* sin conexión: se usa la última copia */ });
  };
  const isoDay = dt => dt.getFullYear() + "-" + String(dt.getMonth() + 1).padStart(2, "0") + "-" + String(dt.getDate()).padStart(2, "0");
  const forecastFor = dt => (fc && dt && fc.days[isoDay(dt)]) || null;
  const outdoors = p => /Naturaleza|Paseo|Barrio|Feria|Correr y pedalear|Plaza de barrio/.test(p.sub);
  /* Qué día del viaje es hoy: número de día, o cuántos días faltan (negativo), o null si no hay fecha. */
  const tripToday = () => {
    if (!prefs.start) return null;
    const start = new Date(prefs.start + "T12:00:00"), now = cityNow();
    if (isNaN(start)) return null;
    const today = new Date(now.getFullYear(), now.getMonth(), now.getDate(), 12);
    return Math.round((today - start) / 864e5) + 1;
  };

  /* ── Calculadora de propina y cuenta dividida (tarjeta #37) ── */
  let tipPct = 10;
  const tipHtml = () => '<div class="conv" id="tip"><div class="conv-row"><label><span>Cuenta</span><input id="tp-total" inputmode="decimal" placeholder="Total en pesos" aria-label="Total de la cuenta en pesos"></label>' +
    '<label style="flex:0 0 36%"><span>Somos</span><input id="tp-n" inputmode="numeric" value="2" aria-label="Cantidad de personas"></label></div>' +
    '<div class="chips wrap" style="margin-top:10px">' + [0, 10, 15].map(n => '<button class="chip sm' + (tipPct === n ? " on" : "") + '" data-tip="' + n + '">' + (n ? "Propina " + n + " %" : "Sin propina") + "</button>").join("") + "</div>" +
    '<p class="conv-note" id="tp-out">Escribí el total y te decimos cuánto pone cada uno. En la Argentina se suele dejar un 10 %, en efectivo.</p></div>';
  const paintTip = () => {
    const out = $("#tp-out");
    if (!out) return;
    const total = parseNum($("#tp-total").value), n = Math.max(1, Math.round(parseNum($("#tp-n").value)) || 1);
    if (!total) { out.textContent = "Escribí el total y te decimos cuánto pone cada uno. En la Argentina se suele dejar un 10 %, en efectivo."; return; }
    const tip = total * tipPct / 100, each = (total + tip) / n, r = rate();
    const cur = CURS.find(c => c[0] === prefs.cur);
    out.innerHTML = "Propina: <b>$ " + money(tip, 0) + "</b> · Total: <b>$ " + money(total + tip, 0) + "</b><br>Cada uno pone <b>$ " + money(each, 0) + "</b>" + (r ? " (unos " + cur[1] + " " + money(each / r, 2) + ")" : "");
  };

  /* ── Perfil de viaje (tarjeta #35): la guía se acomoda a cómo viaja cada persona. Funciona sin cuenta. ── */
  const profile = prefs.profile;
  const fitsMe = p => p.cat !== "comer" || profile.diets.every(d => p.diet.indexOf(d) > -1);
  const mine = p => (profile.diets.length && p.cat === "comer" && fitsMe(p)) ? 1 : 0;

  /* ── Cuentas (tarjeta #35). Opcionales, con Supabase. Quedan APAGADAS mientras config.js esté vacío. ──
     Lo único que se guarda de la persona es su mail (lo maneja Supabase) y su viaje.
     Pasos para encenderlas: CUENTAS.md.
     OJO: esta parte NO se pudo probar contra un servidor real. Hay que probarla al encenderla. */
  const CFG = window.GUIA_CONFIG || {};
  const accountsOn = !!(CFG.supabaseUrl && CFG.supabaseAnonKey);
  let sb = null, user = null, syncTimer = null, authMsg = "";
  const paintAccountBtn = () => { const b = $("#account-btn"); if (b) { b.classList.toggle("in", !!user); b.setAttribute("aria-label", user ? "Mi cuenta (sesión iniciada)" : "Mi cuenta"); } };
  const applyCloud = d => {
    if (!d || !Array.isArray(d.plan)) return;
    plan = d.plan.filter(x => x && byId[x.id]);
    const remote = d.prefs || {};
    Object.keys(remote).forEach(k => { if (k !== "profile") prefs[k] = remote[k]; });
    if (remote.profile) Object.assign(profile, remote.profile);
    store.set(K.plan, plan); store.set(K.prefs, prefs);
    paintBadge();
  };
  const pushCloud = () => {
    if (!sb || !user) return;
    sb.from("viajes").upsert({ user_id: user.id, datos: { plan, prefs }, actualizado: new Date().toISOString() })
      .then(r => { if (r.error) console.warn("No se pudo guardar el viaje en la cuenta:", r.error.message); });
  };
  const queueSync = () => { if (!sb || !user) return; clearTimeout(syncTimer); syncTimer = setTimeout(pushCloud, 2000); };
  /* Al entrar: gana lo más nuevo entre lo guardado en la cuenta y lo de este dispositivo. */
  const pullCloud = () => sb.from("viajes").select("datos").eq("user_id", user.id).maybeSingle().then(r => {
    const d = r.data && r.data.datos;
    if (d && d.prefs && (d.prefs.updated || 0) > (prefs.updated || 0)) { applyCloud(d); toast("Recuperamos tu viaje guardado"); }
    else if (plan.length || prefs.updated) pushCloud();
    if (sheetId === null) rerender();
  });
  const startAccounts = () => {
    if (!accountsOn) return;
    const s = document.createElement("script");
    s.src = "https://cdn.jsdelivr.net/npm/@supabase/supabase-js@2.45.4/dist/umd/supabase.min.js";
    s.onload = () => {
      sb = window.supabase.createClient(CFG.supabaseUrl, CFG.supabaseAnonKey, { auth: { flowType: "pkce", detectSessionInUrl: true, persistSession: true } });
      sb.auth.onAuthStateChange((event, session) => {
        const was = user;
        user = session ? session.user : null;
        paintAccountBtn();
        if (user && !was) pullCloud();
        else if (route().name === "cuenta") rerender();
      });
    };
    s.onerror = () => { authMsg = "No pudimos conectar con el servicio de cuentas. Probá más tarde."; };
    document.head.appendChild(s);
  };
  const viewAccount = () => {
    const chip = (data, on, label) => '<button class="chip' + (on ? " on" : "") + '" ' + data + ' aria-pressed="' + on + '">' + label + "</button>";
    let cuenta;
    if (!accountsOn) {
      cuenta = '<div class="account-box"><b>Las cuentas todavía no están encendidas</b><p class="hint" style="margin:4px 0 0">Por ahora tu viaje y tu perfil se guardan solo en este dispositivo. Cuando se activen vas a poder entrar con tu mail y tener todo en cualquier celular o compu.</p></div>';
    } else if (user) {
      cuenta = '<div class="account-box"><p>Entraste como <b>' + esc(user.email || "tu cuenta") + '</b></p><p class="hint" style="margin:4px 0 0">Tu viaje se guarda en tu cuenta. Lo único que sabemos de vos es tu mail.</p>' +
        '<p class="plan-actions" style="margin:12px 0 0"><button class="btn" data-signout>Cerrar sesión</button><button class="btn danger" data-wipe>Borrar lo guardado en mi cuenta</button></p></div>';
    } else {
      cuenta = '<form class="account-box" id="login-form"><label for="login-mail"><b>Entrá con tu mail</b></label><p class="hint" style="margin:4px 0 0">Te mandamos un enlace para entrar, sin contraseñas. Lo único que guardamos es tu mail y tu viaje.</p>' +
        '<div class="search"><input id="login-mail" name="mail" type="email" required placeholder="tu@mail.com" autocomplete="email"><button>Enviar enlace</button></div>' +
        (authMsg ? '<p class="status ok" style="margin-top:10px">' + esc(authMsg) + "</p>" : "") + "</form>";
    }
    return '<h1 class="page-title">Mi cuenta</h1><p class="page-sub">Tu cuenta y tu perfil de viaje.</p>' + cuenta +
      '<section class="section">' + head("Mi perfil de viaje") + '<p class="hint">Contanos cómo viajás y la guía se acomoda: marca lo que es apto para vos y arma el viaje con eso.</p><div class="wiz">' +
      '<h2>¿Comés con alguna condición?</h2><div class="chips wrap">' + DIETS.map(d => chip('data-pdiet="' + d[0] + '"', profile.diets.indexOf(d[0]) > -1, d[1])).join("") + "</div>" +
      '<h2>¿Hasta cuánto querés gastar en cada comida?</h2><div class="chips wrap">' + [[0, "Me da igual"], [1, "$ Económico"], [2, "$$ Medio"], [3, "$$$ Caro"]].map(o => chip('data-pbudget="' + o[0] + '"', profile.budget === o[0], o[1])).join("") + "</div>" +
      '<h2>¿Viajás con chicos?</h2><div class="chips wrap">' + chip('data-pkids="1"', profile.kids, "Sí") + chip('data-pkids="0"', !profile.kids, "No") + "</div></div></section>" +
      '<p class="plan-actions" style="margin-top:22px"><a class="btn" href="#/viaje">🧳 Ir a Mi viaje</a></p>';
  };
  const favLabel = id => planOf(id) ? "♥ En mi viaje" : "♡ Guardar";
  const toggleSave = id => {
    const i = plan.findIndex(x => x.id === id);
    if (i > -1) { plan.splice(i, 1); toast("Quitado de Mi viaje"); }
    else { plan.push({ id, day: 0 }); toast("Guardado en Mi viaje"); }
    savePlan();
    $$('[data-fav="' + id + '"]').forEach(b => {
      b.setAttribute("aria-pressed", String(!!planOf(id)));
      if (b.classList.contains("btn")) b.textContent = favLabel(id);
      else if (b.classList.contains("fav")) b.textContent = planOf(id) ? "♥" : "♡";
    });
    if (sheetId === id) paintSheetPlan(id);
    if (route().name === "viaje") rerender();
  };

  /* ── Ubicación del usuario (solo en memoria, nunca se guarda ni se envía) ── */
  let userLL = null;
  const locate = (ok, fail) => {
    if (userLL) { ok(userLL); return; }
    if (!navigator.geolocation) { toast("Este dispositivo no permite obtener la ubicación"); if (fail) fail(); return; }
    toast("Buscando tu ubicación…");
    navigator.geolocation.getCurrentPosition(pos => {
      userLL = [pos.coords.latitude, pos.coords.longitude];
      ok(userLL);
    }, () => { toast("No pudimos obtener tu ubicación. Revisá el permiso."); if (fail) fail(); }, { enableHighAccuracy: true, timeout: 10000, maximumAge: 60000 });
  };
  const distTxt = p => (userLL && p.ll && p.inCity) ? fmtKm(km(userLL, p.ll)) : "";

  /* ── Clima (Open-Meteo) y cotización (open.er-api.com): datos en vivo con copia local ── */
  let wx = store.get(K.wx, null);
  let fx = store.get(K.fx, null);
  const WX = c => c === 0 ? ["☀️", "Despejado"] : c <= 2 ? ["⛅", "Algo nublado"] : c === 3 ? ["☁️", "Nublado"] : c <= 48 ? ["🌫️", "Niebla"] : c <= 67 ? ["🌧️", "Lluvia"] : c <= 77 ? ["❄️", "Nieve"] : c <= 82 ? ["🌦️", "Chaparrones"] : ["⛈️", "Tormenta"];
  const wxFresh = () => wx && Date.now() - wx.t < 3 * 3600e3;
  const isRain = () => wxFresh() && (wx.code >= 51 || wx.rain >= 70);
  const loadWeather = () => {
    if (wx && Date.now() - wx.t < 30 * 60e3) return;
    const c = city.center || [-34.6037, -58.3816];
    fetch("https://api.open-meteo.com/v1/forecast?latitude=" + c[0] + "&longitude=" + c[1] + "&current=temperature_2m,weather_code&daily=temperature_2m_max,temperature_2m_min,precipitation_probability_max&forecast_days=1&timezone=" + encodeURIComponent(X.tz || "America/Argentina/Buenos_Aires"))
      .then(r => r.json()).then(j => {
        const wasRain = isRain();
        wx = { t: Date.now(), temp: Math.round(j.current.temperature_2m), code: j.current.weather_code, max: Math.round(j.daily.temperature_2m_max[0]), min: Math.round(j.daily.temperature_2m_min[0]), rain: j.daily.precipitation_probability_max[0] || 0 };
        store.set(K.wx, wx);
        if (route().name === "inicio" && sheetId === null) { if (wasRain !== isRain() && window.scrollY < 300) rerender(); else paintWeather(); }
      }).catch(() => { /* sin conexión: se usa la última copia */ });
  };
  const weatherHtml = () => {
    if (!wxFresh()) return "";
    const w = WX(wx.code);
    const advice = isRain() ? '<a href="#/itinerario/lluvia">Hay lluvia: mirá el plan bajo techo →</a>'
      : wx.max >= 30 ? "Mucho calor: museos al mediodía, parques al atardecer."
      : wx.max <= 12 ? "Día fresco: llevá abrigo."
      : "Lindo día para caminar la ciudad.";
    return '<span class="wx-now"><span aria-hidden="true">' + w[0] + "</span> <b>" + wx.temp + "°</b> " + w[1] + " · máx " + wx.max + "° / mín " + wx.min + "°" + (wx.rain >= 40 && !isRain() ? " · lluvia " + wx.rain + " %" : "") + '</span><span class="wx-tip">' + advice + "</span>";
  };
  const paintWeather = () => { const el = $("#wx"); if (el) { el.innerHTML = weatherHtml(); el.hidden = !el.innerHTML; } };
  const loadFx = () => {
    if (fx && Date.now() - fx.t < 12 * 3600e3) return;
    fetch("https://open.er-api.com/v6/latest/USD").then(r => r.json()).then(j => {
      if (!j.rates || !j.rates.ARS) return;
      fx = { t: Date.now(), rates: j.rates };
      store.set(K.fx, fx);
      paintConv();
    }).catch(() => { /* sin conexión */ });
  };
  const CURS = [["USD", "US$", "Dólar"], ["EUR", "€", "Euro"], ["BRL", "R$", "Real"], ["UYU", "$U", "Peso uruguayo"], ["CLP", "CLP$", "Peso chileno"], ["MXN", "MX$", "Peso mexicano"], ["COP", "COL$", "Peso colombiano"], ["GBP", "£", "Libra"]];
  const local = city.currency || "ARS";
  const rate = () => fx && fx.rates[local] && fx.rates[prefs.cur] ? fx.rates[local] / fx.rates[prefs.cur] : 0;
  const money = (n, dec) => n.toLocaleString("es-AR", { maximumFractionDigits: dec, minimumFractionDigits: 0 });
  const convHtml = () => '<div class="conv" id="conv">' +
    '<div class="conv-row"><label><span>Tengo</span><input id="cv-a" inputmode="decimal" value="100" aria-label="Monto en tu moneda"></label>' +
    '<select id="cv-cur" aria-label="Tu moneda">' + CURS.map(c => '<option value="' + c[0] + '"' + (prefs.cur === c[0] ? " selected" : "") + ">" + c[0] + " · " + c[2] + "</option>").join("") + "</select></div>" +
    '<div class="conv-eq" aria-hidden="true">⇅</div>' +
    '<div class="conv-row"><label><span>Son</span><input id="cv-b" inputmode="decimal" aria-label="Monto en pesos argentinos"></label><span class="conv-cur">ARS · Peso argentino</span></div>' +
    '<p class="conv-note" id="cv-note"></p></div>';
  /* Acepta "1.500,50" (como en la Argentina) y también "10.50" (como escribe un turista): un solo punto
     seguido de 1, 2 o más de 3 cifras es decimal; si no, los puntos separan miles (tarjeta #52). */
  const parseNum = s => {
    let v = String(s).trim().replace(/\s/g, "");
    if (v.indexOf(",") > -1) v = v.replace(/\./g, "").replace(",", ".");
    else if (!/^\d+\.\d{3}$/.test(v) && (v.match(/\./g) || []).length === 1) { /* "10.50": queda como está */ }
    else v = v.replace(/\./g, "");
    return parseFloat(v) || 0;
  };
  const paintConv = from => {
    const a = $("#cv-a"), b = $("#cv-b"), note = $("#cv-note");
    if (!a) return;
    const r = rate();
    if (!r) { note.textContent = "Sin conexión: no pudimos traer la cotización."; return; }
    if (from === "b") a.value = money(parseNum(b.value) / r, 2); else b.value = money(parseNum(a.value) * r, 0);
    const cur = CURS.find(c => c[0] === prefs.cur);
    note.textContent = "1 " + cur[0] + " ≈ " + money(r, r < 10 ? 2 : 0) + " pesos · cotización oficial de referencia del " + new Date(fx.t).toLocaleDateString("es-AR") + ". Lo que te cobren puede variar según cómo pagues.";
  };

  /* ── Filtros de Explorar ── */
  let f, zoneId = "", showHelp = false, focusHelp = null;
  const DIETS = [["vegetariano", "🥬 Vegetariano"], ["vegano", "🌱 Vegano"], ["sin TACC", "🌾 Sin TACC"], ["kosher", "✡️ Kosher"]];
  const resetFilters = next => { f = Object.assign({ cat: "todos", sub: "", barrio: "", prices: [], diets: [], today: false, q: "", sort: "rec", planDay: null }, next || {}); };
  resetFilters();
  const SYN = X.synonyms || {};
  const matchQ = (p, tokens) => tokens.every(t => {
    if (p._search.indexOf(t) > -1) return true;
    if (SYN[t] && p._search.indexOf(SYN[t]) > -1) return true;
    return t.length > 4 && /s$/.test(t) && p._search.indexOf(t.replace(/e?s$/, "")) > -1;
  });
  const filtered = () => {
    if (f.planDay !== null) return plan.filter(x => x.day === f.planDay).map(x => byId[x.id]);
    if (f.cat === "ninguno") return [];
    const tokens = norm(f.q).split(/\s+/).filter(Boolean);
    const out = places.filter(p =>
      (f.cat === "todos" || p.cat === f.cat) &&
      (!f.sub || p.sub === f.sub) &&
      (!f.barrio || p.barrio === f.barrio) &&
      (!f.prices.length || f.prices.indexOf(p.price) > -1) &&
      (!f.today || openToday(p)) &&
      f.diets.every(d => p.diet.indexOf(d) > -1) &&
      matchQ(p, tokens));
    const byName = (a, b) => a.name.localeCompare(b.name, "es");
    const pr = p => p.price == null ? 99 : p.price;
    if (f.sort === "cerca" && userLL) out.sort((a, b) => (a.ll ? km(userLL, a.ll) : 1e9) - (b.ll ? km(userLL, b.ll) : 1e9));
    else if (f.sort === "barato") out.sort((a, b) => pr(a) - pr(b) || b.q - a.q);
    else if (f.sort === "caro") out.sort((a, b) => (b.price || -1) - (a.price || -1) || b.q - a.q);
    else if (f.sort === "az") out.sort(byName);
    else out.sort((a, b) => mine(b) - mine(a) || b.q - a.q || b.awards.length - a.awards.length || byName(a, b));
    return out;
  };
  const activeFilters = () => (f.cat !== "todos" && f.cat !== "ninguno") + !!f.sub + !!f.barrio + f.prices.length + f.diets.length + f.today + !!f.q + (f.planDay !== null);

  /* ── Piezas de interfaz ── */
  const priceHtml = p => p.price === 0 ? '<span class="free">Gratis</span>' : p.price ? '<span class="price" title="' + PRICE_WORD[p.price] + '">' + "$$$$".slice(0, p.price) + "</span>" : "";
  /* Ícono según el tipo de lugar, para que una pizzería sin foto no muestre el de la parrilla (tarjeta #52). */
  const SUB_ICON = { "Para bailar": "🪩", "Pizzería": "🍕", "Café notable": "☕", "Café de especialidad": "☕", "Heladería": "🍦", "Dulces": "🧁", "Vegetariano": "🥗", "Sin TACC": "🌾", "Kosher": "✡️",
    "Cocinas del mundo": "🍜", "Mercado gastronómico": "🧺", "Polo gastronómico": "🧺", "Al paso": "🥪", "Bar": "🍸", "Cervecería": "🍺", "Bar de vinos": "🍷", "Teatro": "🎭",
    "Cine": "🎬", "Museo": "🖼️", "Naturaleza": "🌳", "Shopping": "🏬", "Feria": "🧺", "Hostel": "🎒", "Fútbol": "⚽", "Polo": "🏇", "Turf": "🏇", "Tenis": "🎾", "Golf": "⛳", "Náutico": "⛵" };
  const iconOf = p => SUB_ICON[p.sub] || cats[p.cat].icon;
  const media = (p, w, cls) => {
    const c = cats[p.cat];
    return '<span class="media ' + cls + '" style="--c:' + c.color + '"><i aria-hidden="true">' + iconOf(p) + "</i>" +
      (p.photo ? '<img src="' + esc(photo(p.photo, w)) + '" alt="" loading="lazy" decoding="async">' : "") + "</span>";
  };
  const badges = (p, full) => {
    const s = todayStatus(p);
    return (p.q === 3 ? '<span class="bdg q">★ Destacado</span>' : "") +
      p.awards.slice(0, full ? 9 : 1).map(a => '<span class="bdg aw">🏅 ' + esc(a) + "</span>").join("") +
      (s && !s.ok ? '<span class="bdg no">' + (X.only && X.only[p.id] ? esc(s.text) : "Cerrado hoy") + "</span>" : "") +
      (s && s.ok && X.only && X.only[p.id] ? '<span class="bdg yes">Hoy funciona</span>' : "");
  };
  const card = p => {
    const c = cats[p.cat], d = distTxt(p), b = badges(p) + (mine(p) ? '<span class="bdg yes">✓ Apto para vos</span>' : "") + (prefs.visited[p.id] ? '<span class="bdg q2">✓ Ya fuiste</span>' : "");
    return '<article class="card" style="--c:' + c.color + '" data-open="' + p.id + '" tabindex="0" role="button" aria-label="Ver ' + esc(p.name) + '">' +
      media(p, 250, "thumb") +
      '<div class="card-body"><div class="card-top"><h3>' + esc(p.name) + "</h3>" +
      '<button class="fav" data-fav="' + p.id + '" aria-pressed="' + !!planOf(p.id) + '" aria-label="Guardar ' + esc(p.name) + ' en Mi viaje">' + (planOf(p.id) ? "♥" : "♡") + "</button></div>" +
      '<p class="meta">' + [esc(p.sub), esc(p.barrio), priceHtml(p), d ? '<span class="dist">a ' + d + "</span>" : ""].filter(Boolean).join(" · ") + "</p>" +
      (b ? '<p class="bdgs">' + b + "</p>" : "") +
      '<p class="desc">' + esc(p.desc) + "</p></div></article>";
  };
  const tile = p => {
    const c = cats[p.cat];
    return '<button class="tile" style="--c:' + c.color + '" data-open="' + p.id + '">' + media(p, 500, "tile-media") +
      '<span class="tile-body"><b>' + esc(p.name) + "</b><span>" + [esc(p.sub), esc(p.barrio), priceHtml(p), distTxt(p)].filter(Boolean).join(" · ") + "</span></span></button>";
  };
  const listHtml = items => '<div class="list">' + items.map(card).join("") + "</div>";
  const blockHtml = (b, open) => {
    const body = typeof b.items[0] === "string"
      ? "<ul>" + b.items.map(i => "<li>" + esc(i) + "</li>").join("") + "</ul>"
      : "<dl>" + b.items.map(i => "<div><dt>" + esc(i.t) + "</dt><dd>" + esc(i.d) + "</dd></div>").join("") + "</dl>";
    return '<details class="block ' + (b.tone || "") + '"' + (open ? " open" : "") + "><summary><em>" + b.icon + "</em>" + esc(b.title) + '</summary><div class="block-body">' + body + (b.extra || "") + "</div></details>";
  };
  const sosHtml = () => '<div class="sos">' + city.emergencies.map(e => '<a href="tel:' + e.n.replace(/[^0-9+]/g, "") + '"><b>' + esc(e.n) + "</b><span>" + esc(e.t) + "</span></a>").join("") + "</div>";
  const head = (title, right) => '<div class="section-head"><h2>' + title + "</h2>" + (right || "") + "</div>";
  const linkCard = (href, color, icon, title, sub) => '<a class="cat" style="--c:' + color + '" href="' + href + '"><span class="ico" aria-hidden="true">' + icon + "</span><span><b>" + title + "</b><span>" + sub + "</span></span></a>";

  /* ── Sugerencias según la hora, el día y el clima ── */
  const seeded = (id, seed) => { let h = seed; for (let i = 0; i < id.length; i++) h = (h * 31 + id.charCodeAt(i)) % 9973; return h; };
  const nowPicks = () => {
    const t = cityNow(), h = t.getHours(), rain = isRain();
    const meal = p => p.cat === "comer" && !/Café|Helad/.test(p.sub);
    let title, test;
    if (h >= 6 && h < 11) { title = "Para arrancar la mañana"; test = p => p.sub === "Café notable" || (p.cat === "ver" && p.q === 3); }
    else if (h >= 11 && h < 15) { title = "Para almorzar ahora"; test = meal; }
    else if (h >= 15 && h < 19) { title = "Para esta tarde"; test = p => p.cat === "ver" || /Café|Helad/.test(p.sub); }
    else if (h >= 19) { title = "Para esta noche"; test = p => (meal(p) && p.sub !== "Al paso") || p.cat === "noche"; }
    else { title = "Trasnoche porteña"; test = p => p.cat === "noche" || p.sub === "Pizzería"; }
    let items = places.filter(p => p.inCity && test(p) && openToday(p) && (!rain || p.cat !== "ver" || (p.tags || []).indexOf("lluvia") > -1) &&
      fitsMe(p) && (!profile.budget || p.cat !== "comer" || p.price == null || p.price <= profile.budget));
    const seed = t.getDate() + t.getMonth() * 31;
    if (userLL) items.sort((a, b) => (a.ll ? km(userLL, a.ll) : 1e9) - (b.ll ? km(userLL, b.ll) : 1e9));
    else items.sort((a, b) => b.q - a.q || seeded(a.id, seed) - seeded(b.id, seed));
    return { title: title + (userLL ? " cerca tuyo" : ""), sub: rain ? "Hay lluvia: priorizamos planes bajo techo." : "", items: items.slice(0, 10) };
  };

  /* ── Hoy en Buenos Aires (tarjetas #64 y #65): solo lo que pasa hoy. Lo que ya pasó desaparece solo y al otro día aparece lo nuevo. ── */
  let liveHoy = null;   // eventos de la agenda oficial de la Ciudad (data/hoy.json), si se pudieron cargar
  const ymd = d => d.getFullYear() + "-" + (d.getMonth() + 1) + "-" + d.getDate();
  const hoyItems = () => {
    const now = cityNow(), h = now.getHours();
    const base = new Date(now);
    if (h < 6) base.setDate(base.getDate() - 1);   // de madrugada sigue siendo "la noche de ayer"
    const dow = base.getDay(), showDia = h >= 6 && h < 20;
    const out = [], seen = {};
    const add = it => { if (it.franja === "dia" && !showDia) return; out.push(it); };
    (X.agenda || []).forEach(a => {
      const p = byId[a.lugar];
      if (!p || a.dias.indexOf(dow) < 0) return;
      seen[p.id] = 1;
      add({ franja: a.franja, p, que: a.que });
    });
    places.forEach(p => {
      const o = X.only && X.only[p.id];
      if (!o || seen[p.id] || o.indexOf(dow) < 0) return;
      add({ franja: p.cat === "noche" ? "noche" : "dia", p });
    });
    (liveHoy || []).forEach(e => {
      const ini = new Date(e.ini);
      if (isNaN(ini) || Date.now() > ini.getTime() + 2 * 3600e3) return;   // ya pasó
      let local;
      try { local = new Date(ini.toLocaleString("en-US", { timeZone: X.tz || "America/Argentina/Buenos_Aires" })); } catch (err) { local = ini; }
      const lb = new Date(local);
      if (local.getHours() < 6) lb.setDate(lb.getDate() - 1);
      if (ymd(lb) !== ymd(base)) return;
      const lh = local.getHours();
      add({ franja: lh >= 19 || lh < 6 ? "noche" : "dia", ev: e, hora: lh + ":" + String(local.getMinutes()).padStart(2, "0"), orden: local.getTime() });
    });
    return out;
  };
  const hoyRow = it => {
    if (it.p) {
      const p = it.p;
      return '<button class="event hoy-it" data-open="' + p.id + '"><em aria-hidden="true">' + iconOf(p) + "</em><span><b>" + esc(it.que || p.name) + "</b><span>" +
        (it.que ? '<i data-notr>' + esc(p.name) + "</i> · " + esc(p.barrio) : esc(p.sub) + " · " + esc(p.barrio)) + "</span></span></button>";
    }
    const e = it.ev;
    return '<a class="event hoy-it" href="' + esc(e.url) + '" target="_blank" rel="noopener"><em aria-hidden="true">📅</em><span><b data-notr>' + esc(e.t) + "</b><span>" +
      esc(it.hora) + (e.lugar ? ' · <i data-notr>' + esc(e.lugar) + "</i>" : "") + (e.barrio ? " · " + esc(e.barrio) : "") + (e.gratis ? " · Gratis" : "") + "</span></span></a>";
  };
  const hoyHtml = () => {
    const items = hoyItems();
    if (!items.length) return "";
    const grp = (title, arr) => {
      if (!arr.length) return "";
      arr.sort((a, b) => (a.ev ? 1 : 0) - (b.ev ? 1 : 0) || (a.orden || 0) - (b.orden || 0));
      const first = arr.slice(0, 3), rest = arr.slice(3);
      return '<h3 class="hoy-h">' + title + '</h3><div class="events">' + first.map(hoyRow).join("") + "</div>" +
        (rest.length ? '<details class="hoy-mas"><summary>Ver más <span>(' + rest.length + ')</span></summary><div class="events">' + rest.map(hoyRow).join("") + "</div></details>" : "");
    };
    return '<section class="section" id="hoy">' + head("Hoy en Buenos Aires") +
      grp("De día", items.filter(i => i.franja === "dia")) + grp("A la noche", items.filter(i => i.franja === "noche")) +
      (items.some(i => i.ev) ? '<p class="hint hoy-nota">Los eventos con 📅 son de la agenda oficial de la Ciudad. Confirmá en su página antes de ir.</p>' : "") +
      "</section>";
  };

  /* ── Vistas ── */
  const viewHome = () => {
    const t = cityNow(), dow = t.getDay(), month = t.getMonth() + 1;
    const now = nowPicks();
    const tops = places.filter(p => p.cat === "ver" && p.q === 3);
    const events = (X.events || []).filter(e => e.m.indexOf(month) > -1);
    return '<section class="hero"><small>' + esc(city.country) + " · " + DOW[dow] + " " + t.getDate() + " de " + MONTHS[t.getMonth()] + "</small><h1>" + esc(city.name) + "</h1>" +
        '<p class="wx" id="wx"' + (wxFresh() ? "" : " hidden") + ">" + weatherHtml() + "</p>" +
        '<form class="search" id="home-search" role="search"><input type="search" name="q" placeholder="¿Qué buscás? Parrilla, tango, museo, Palermo…" aria-label="Buscar en la guía" autocomplete="off"><button>Buscar</button></form>' +
        '<div class="quick">' +
          '<button data-near>📍 Cerca mío</button>' +
          '<button data-surprise>🎲 Sorprendeme</button>' +
          '<button data-go="' + attr({ today: true }) + '">Abre hoy</button>' +
          '<button data-go="' + attr({ prices: [0] }) + '">Gratis</button>' +
          '<button data-go="' + attr({ q: "lluvia" }) + '">Bajo techo</button>' +
          '<button data-go="' + attr({ q: "chicos" }) + '">Con chicos</button>' +
          '<button data-go="' + attr({ q: "tango" }) + '">Tango</button>' +
          '<button data-go="' + attr({ cat: "noche", sub: "Para bailar" }) + '">Boliches</button>' +
        "</div></section>" +

      (() => {   // hoy en tu viaje: lo agendado para hoy, o cuántos días faltan (tarjeta #37)
        const td = tripToday();
        if (td === null) return "";
        if (td < 1) return '<div class="today"><b>' + (1 - td === 1 ? "Falta 1 día" : "Faltan " + (1 - td) + " días") + ' para tu viaje.</b> <a class="link" href="#/info/practica">Repasá la lista para no olvidarte de nada</a></div>';
        const mineToday = plan.filter(x => x.day === td).map(x => byId[x.id]);
        if (!mineToday.length) return "";
        return '<section class="section" style="margin-top:18px">' + head("Hoy en tu viaje · Día " + td, '<a class="link" href="#/viaje">Ver todo</a>') + '<div class="rail">' + mineToday.map(tile).join("") + "</div></section>";
      })() +
      hoyHtml() +

      (now.items.length ? '<section class="section">' + head(now.title, '<button class="link" data-near>📍 Más cerca</button>') + (now.sub ? '<p class="hint">' + now.sub + "</p>" : "") + '<div class="rail">' + now.items.map(tile).join("") + "</div></section>" : "") +

      '<section class="section">' + head("¿Qué estás buscando?") + '<div class="cats">' +
        city.categories.map(c => '<button class="cat" style="--c:' + c.color + '" data-go="' + attr({ cat: c.id }) + '"><span class="ico" aria-hidden="true">' + c.icon + "</span><span><b>" + esc(c.name) + "</b><span>" + esc(c.desc) + "</span></span></button>").join("") +
        (hasMap ? '<button class="cat" style="--c:#0c8599" data-go="' + attr({ mode: "mapa" }) + '"><span class="ico" aria-hidden="true">🗺️</span><span><b>Mapa</b><span>Todo sobre el plano</span></span></button>' : "") +
        linkCard("#/barrios", "#5b6b7c", "🏘️", "Barrios", "Qué tiene cada zona") +
      "</div></section>" +

      '<section class="section"><a class="cta" href="#/armar"><span><b>✨ Armá tu viaje en 10 segundos</b><span>Decinos cuántos días venís y qué te gusta: te dejamos el recorrido listo, día por día.</span></span><i aria-hidden="true">→</i></a>' +
      '<a class="cta pass" href="#/pasaporte"><span><b>🛂 Pasaporte porteño</b><span>' + (earnedStamps().length ? "Tenés " + earnedStamps().length + " de " + (X.stamps || []).length + " sellos. ¡Seguí sumando!" : "Marcá los lugares que conocés y ganá sellos: parrillero, tanguero, explorador de barrios…") + '</span></span><i aria-hidden="true">→</i></a></section>' +

      '<section class="section">' + head("No te lo podés perder", '<button class="link" data-go="' + attr({ cat: "ver" }) + '">Ver todo</button>') + '<div class="rail">' + tops.map(tile).join("") + "</div></section>" +

      (X.collections ? '<section class="section">' + head("Colecciones para inspirarte") + '<div class="rail">' + X.collections.map(c => {
        const saved = f; resetFilters(c.filter); const n = filtered().length; f = saved;
        const cover = byId[c.cover];
        return !n ? "" : '<button class="tile coll" style="--c:#5b6b7c" data-go="' + attr(c.filter) + '"><span class="media tile-media"><i aria-hidden="true">' + c.icon + "</i>" +
          (cover && cover.photo ? '<img src="' + esc(photo(cover.photo, 500)) + '" alt="" loading="lazy" decoding="async">' : "") +
          '</span><span class="tile-body"><b>' + c.icon + " " + esc(c.name) + "</b><span>" + n + " lugares</span></span></button>";
      }).join("") + "</div></section>" : "") +

      '<section class="section">' + head("Itinerarios listos") + '<div class="rail">' +
        city.itineraries.map(i => '<a class="itin" href="#/itinerario/' + i.id + '"><em aria-hidden="true">' + i.icon + "</em><b>" + esc(i.name) + "</b><span>" + esc(i.desc) + "</span></a>").join("") +
      "</div></section>" +

      (events.length ? '<section class="section">' + head("Este mes en " + esc(city.name), '<a class="link" href="#/info/calendario">Todo el año</a>') + '<div class="events">' +
        events.map(e => '<div class="event"><em aria-hidden="true">' + e.icon + "</em><span><b>" + esc(e.name) + "</b><span>" + esc(e.desc) + "</span></span></div>").join("") + "</div></section>" : "") +

      '<section class="section">' + head("¿Cuánto es en mi moneda?") + convHtml() + "</section>" +

      '<section class="section">' + head("Antes de salir") + '<div class="cats">' +
        linkCard("#/info/llegada", "#2f5d4f", "🛬", "Recién llegado", "Tus primeras horas, paso a paso") +
        linkCard("#/info/ayuda", "#e03131", "🆘", "Dónde pedir ayuda", "Turismo, policía, hospitales") +
        linkCard("#/info/moverse", "#1c7ed6", "🚇", "Cómo moverte", "SUBE, subte, aeropuertos") +
        linkCard("#/info/seguridad", "#e8590c", "⚠️", "Qué evitar", "Estafas y cuidados") +
        linkCard("#/info/practica", "#0c8599", "💵", "Info práctica", "Dinero, horarios, checklist") +
        linkCard("#/info/vuelo", "#5f3dc4", "✈️", "Hacé tu check-in", "Elegí tu aerolínea y listo") +
        linkCard("#/viaje", "#d6336c", "♥", "Mi viaje", "Tus lugares, día por día") +
      "</div></section>" +

      '<section class="section">' + head("Teléfonos de emergencia") + sosHtml() + "</section>";
  };

  const catChips = onMapPage => (onMapPage ? '<span class="chips-label">Lugares</span><button class="chip sm' + (f.cat === "ninguno" ? " on" : "") + '" data-cat="ninguno">Ocultar</button>' : "") +
    '<button class="chip' + (onMapPage ? " sm" : "") + (f.cat === "todos" ? " on" : "") + '" data-cat="todos">Todo</button>' +
    city.categories.map(c => '<button class="chip' + (onMapPage ? " sm" : "") + (f.cat === c.id ? " on" : "") + '" data-cat="' + c.id + '">' + c.icon + " " + esc(c.name) + "</button>").join("");
  const subChips = () => {
    if (f.cat === "todos") return "";
    const subs = [];
    places.forEach(p => { if (p.cat === f.cat && subs.indexOf(p.sub) === -1) subs.push(p.sub); });
    return '<div class="chips">' + subs.map(s => '<button class="chip sm' + (f.sub === s ? " on" : "") + '" data-sub="' + esc(s) + '">' + esc(s) + "</button>").join("") + "</div>";
  };
  const toolChips = () => {
    /* Solo los barrios más visitados (data/caba-mas.js, tarjeta #56). Si no hay lista, van todos menos "Fuera de CABA". */
    const visitados = city.filterBarrios;
    const barrios = [];
    places.forEach(p => { if (p.inCity && p.barrio !== "Varios" && (!visitados || visitados.indexOf(p.barrio) > -1) && barrios.indexOf(p.barrio) === -1) barrios.push(p.barrio); });
    if (f.barrio && barrios.indexOf(f.barrio) === -1) barrios.push(f.barrio);   // si llegó filtrado desde otra pantalla, no se pierde
    barrios.sort((a, b) => a.localeCompare(b, "es"));
    const sorts = [["rec", "Recomendados primero"], ["cerca", "Más cerca mío"], ["barato", "Más económicos"], ["caro", "Más exclusivos"], ["az", "A–Z"]];
    return '<select class="chip sel" id="f-sort" aria-label="Ordenar">' + sorts.map(o => '<option value="' + o[0] + '"' + (f.sort === o[0] ? " selected" : "") + ">" + o[1] + "</option>").join("") + "</select>" +
      '<select class="chip sel' + (f.barrio ? " on" : "") + '" id="f-barrio" aria-label="Barrio"><option value="">Todos los barrios</option>' + barrios.map(b => "<option" + (f.barrio === b ? " selected" : "") + ">" + esc(b) + "</option>").join("") + "</select>" +
      [0, 1, 2, 3, 4].map(n => '<button class="chip sm' + (f.prices.indexOf(n) > -1 ? " on" : "") + '" data-price="' + n + '" aria-pressed="' + (f.prices.indexOf(n) > -1) + '" title="' + PRICE_WORD[n] + '">' + (n ? "$$$$".slice(0, n) : "Gratis") + "</button>").join("") +
      '<button class="chip sm' + (f.today ? " on" : "") + '" data-today aria-pressed="' + f.today + '">Abre hoy</button>' +
      (f.cat === "todos" || f.cat === "comer" ? DIETS.map(d => '<button class="chip sm' + (f.diets.indexOf(d[0]) > -1 ? " on" : "") + '" data-diet="' + d[0] + '" aria-pressed="' + (f.diets.indexOf(d[0]) > -1) + '">' + d[1] + "</button>").join("") : "");
  };
  /* Lista y Mapa comparten los mismos filtros: el selector solo cambia de vista. */
  const seg = on => '<div class="mode" role="group" aria-label="Vista"><a href="#/explorar" class="' + (on === "lista" ? "on" : "") + '">☰ Lista</a><a href="#/mapa" class="' + (on === "mapa" ? "on" : "") + '">🗺️ Mapa</a></div>';
  const zoneChips = () => !Z ? "" : '<span class="chips-label">Zonas</span>' +
    Z.layers.map(l => '<button class="chip sm' + (zoneId === l.id ? " on" : "") + '" data-zone="' + l.id + '" aria-pressed="' + (zoneId === l.id) + '">' + l.icon + " " + esc(l.name) + "</button>").join("") +
    '<button class="chip sm' + (showHelp ? " on" : "") + '" data-help aria-pressed="' + showHelp + '">🆘 Puntos de ayuda</button>';
  const legendHtml = () => {
    if (!Z) return "";
    const l = Z.layers.find(x => x.id === zoneId);
    if (!l) return "";
    const keys = Object.keys(l.legend);
    keys.reverse();
    return "<b>" + l.icon + " " + esc(l.name) + "</b>" + keys.map(k => '<span><i style="background:' + l.legend[k][0] + '"></i>' + esc(l.legend[k][1].split(":")[0]) + "</span>").join("");
  };
  const zoneNoteHtml = () => {
    if (!Z) return "";
    const l = Z.layers.find(x => x.id === zoneId);
    return (l ? '<p class="hint map-note">Tocá un barrio para ver el detalle.' + (l.note ? " " + esc(l.note) : "") + "</p>" : "") +
      (showHelp ? '<p class="hint map-note">Puntos de ayuda: ' + Object.keys(Z.helpTypes).map(k => Z.helpTypes[k].icon + " " + esc(Z.helpTypes[k].name.toLowerCase())).join(" · ") + ". Tocá uno para ver la dirección y cómo llegar.</p>" : "");
  };
  const viewMap = () => '<div class="filters"><div class="filters-top"><h1 class="page-title" style="margin:0;flex:1">Mapa</h1>' + seg("mapa") + "</div>" +
    '<div class="chips" id="m-zones">' + zoneChips() + "</div>" +
    '<div class="chips" id="f-cats">' + catChips(true) + "</div></div>" +
    '<div id="results"></div>';
  const viewExplore = () => {
    const toggle = hasMap ? seg("lista") : "";
    return '<div class="filters">' +
        '<div class="filters-top"><label class="field"><span aria-hidden="true">🔎</span><input type="search" id="q" value="' + esc(f.q) + '" placeholder="Buscar por nombre, barrio o tema" aria-label="Buscar" autocomplete="off"></label>' + toggle + "</div>" +
        '<div class="chips" id="f-cats">' + catChips() + "</div>" +
      "</div>" +
      '<div id="f-subs">' + subChips() + "</div>" +
      '<div class="chips tools" id="f-tools">' + toolChips() + "</div>" +
      '<p class="legend">$ económico · $$ precio medio · $$$ caro · $$$$ alta gama</p>' +
      '<div id="results"></div>';
  };
  const countLine = (n, extra) => '<p class="count" id="count" aria-live="polite"><span>' +
    (f.planDay !== null ? "Mi viaje · " + (f.planDay ? "Día " + f.planDay : "Sin día") + " · " : "") + n + (n === 1 ? " lugar" : " lugares") + (extra || "") + "</span>" +
    (activeFilters() ? ' <button class="link" data-clear>Borrar filtros</button>' : "") + "</p>";

  const viewBarrios = () => '<h1 class="page-title">Barrios</h1><p class="page-sub">Qué tiene cada zona y dónde conviene alojarse.</p><div class="barrios">' +
    city.barrios.map(b => {
      const n = places.filter(p => p.barrio === b.name).length;
      const ph = X.photos && X.photos["b:" + b.name];
      return '<div class="barrio">' + (ph ? '<span class="media barrio-media"><img src="' + esc(photo(ph, 500)) + '" alt="" loading="lazy" decoding="async"></span>' : "") +
        '<div class="barrio-body"><b>' + esc(b.name) + "</b><i>" + esc(b.vibe) + "</i><p>" + esc(b.desc) + '</p><p class="stay">🛏️ ' + esc(b.stay) + "</p>" +
        (n ? '<p class="barrio-links"><button class="link" data-go="' + attr({ barrio: b.name }) + '">Ver ' + n + " lugares →</button>" +
          (hasMap ? '<button class="link" data-go="' + attr({ barrio: b.name, mode: "mapa" }) + '">En el mapa</button>' : "") + "</p>" : "") + "</div></div>";
    }).join("") + "</div>";

  const checklistHtml = () => !X.checklist ? "" : '<div class="checklist">' + X.checklist.map((g, gi) => '<div class="check-group"><b>' + esc(g.title) + "</b>" +
    g.items.map((it, i) => { const k = gi + "-" + i; return '<label><input type="checkbox" data-check="' + k + '"' + (prefs.checks[k] ? " checked" : "") + "><span>" + esc(it) + "</span></label>"; }).join("") + "</div>").join("") + "</div>";
  const helpDir = h => "https://www.google.com/maps/dir/?api=1&destination=" + encodeURIComponent(h.name.split(" · ")[0] + ", " + h.address + (h.far ? "" : ", Buenos Aires")) + "&travelmode=transit";
  const helpHtml = () => {
    if (!Z) return "";
    const near = '<div class="nearby">' + Z.nearby.map(n => '<a href="https://www.google.com/maps/search/?api=1&query=' + encodeURIComponent(n[2]) + '" target="_blank" rel="noopener"><em aria-hidden="true">' + n[0] + "</em>" + esc(n[1]) + "</a>").join("") + "</div>";
    const channels = '<div class="events">' + Z.channels.map(c => '<a class="event" href="' + esc(c.href) + '" target="_blank" rel="noopener"><em aria-hidden="true">' + c.icon + "</em><span><b>" + esc(c.name) + " ↗</b><span>" + esc(c.desc) + "</span></span></a>").join("") + "</div>";
    const groups = Object.keys(Z.helpTypes).map(k => {
      const t = Z.helpTypes[k];
      return '<div class="near"><b>' + t.icon + " " + esc(t.name) + "</b>" + Z.help.filter(h => h.type === k).map(h =>
        '<button class="near-row" data-helpfocus="' + h.id + '"><span aria-hidden="true">' + t.icon + "</span><span><b>" + esc(h.name) + "</b><span>" + esc(h.address) + " · " + esc(h.note) + "</span></span><i>Ver ›</i></button>").join("") + "</div>";
    }).join("");
    return '<section class="section" style="margin-top:0">' + head("Teléfonos de emergencia") + sosHtml() + "</section>" +
      '<section class="section">' + head("Buscar cerca mío") + '<p class="hint">Abre Google Maps con lo más cercano a donde estás.</p>' + near + "</section>" +
      '<section class="section">' + head("Ayuda a distancia") + channels + "</section>" +
      '<section class="section">' + head("Dónde pedir ayuda en persona", hasMap ? '<button class="link" data-go="' + attr({ cat: "ninguno", help: true, mode: "mapa" }) + '">Ver en el mapa</button>' : "") + '<div class="help-groups">' + groups + "</div></section>";
  };
  /* Check-in del vuelo (tarjetas #73 y #75). La guía no puede hacer el check-in: cada aerolínea lo hace solo en su web o app.
     Un botón grande abre un buscador de aerolíneas; al elegir una, se abre directo la pantalla de check-in de esa aerolínea
     (donde se pone el código de reserva y el apellido). Cada dirección se abrió y se revisó el 12/11/2026.
     Si la aerolínea no está en la lista, se busca su check-in en Google. */
  const AEROLINEAS = [
    ["Aerolíneas Argentinas", "https://www.aerolineas.com.ar/?activeTab=checkIn"],
    ["Flybondi", "https://reserva.flybondi.com/booking/widget?carrier=fo&module=webcheckin"],
    ["JetSMART", "https://jetsmart.com/ar/es/minisitios/checkin"],
    ["LATAM", "https://www.latamairlines.com/ar/es/check-in"],
    ["GOL", "https://b2c.voegol.com.br/check-in/"],
    ["Sky Airline", "https://www.skyairline.com/argentina/check-in"],
    ["Copa Airlines", "https://checkin.copaair.com/"],
    ["Avianca", "https://www.avianca.com/es/mi-reserva/servicios/check-in-online"],
    ["American Airlines", "https://www.aa.com/check-in"],
    ["United", "https://www.united.com/es/ar/checkin"],
    ["Delta", "https://oci.delta.com/index.html"],
    ["Iberia", "https://www.iberia.com/ar/autocheckin-online/"],
    ["Air Europa", "https://www.aireuropa.com/ar/es/check-in"],
    ["Air France", "https://wwws.airfrance.com.ar/check-in"],
    ["KLM", "https://www.klm.com.ar/check-in"],
    ["Lufthansa", "https://www.lufthansa.com/ar/es/online-check-in"],
    ["ITA Airways", "https://www.ita-airways.com/ar/es/manage-my-bookings/manage/check-in"],
    ["British Airways", "https://www.britishairways.com/travel/olcilandingpageauthreq/public/es_ar"],
    ["Turkish Airlines", "https://www.turkishairlines.com/es-ar/flights/manage-booking/"],
    ["Emirates", "https://www.emirates.com/ar/spanish/manage-booking/online-check-in/"],
    ["Qatar Airways", "https://cki.qatarairways.com/cki-web/pages/autocheckin.xhtml"]
  ];
  const sinTilde = s => s.normalize("NFD").replace(/\p{M}/gu, "").toLowerCase();
  const ciLista = q => {
    const n = sinTilde(q.trim());
    const hay = AEROLINEAS.filter(a => !n || sinTilde(a[0]).indexOf(n) > -1);
    return hay.map(a => '<a class="ci-item" data-notr href="' + a[1] + '" target="_blank" rel="noopener"><span>✈️ ' + esc(a[0]) + "</span><b>Check-in →</b></a>").join("") +
      (n ? '<a class="ci-item ci-otra" href="https://www.google.com/search?q=' + encodeURIComponent(q.trim() + " web check-in") + '" target="_blank" rel="noopener"><span>🔎 Buscar en internet: </span><b data-notr>' + esc(q.trim()) + "</b></a>" : "");
  };
  const vueloHtml = () =>
    '<button class="ci-big" id="ci-abrir" type="button" aria-expanded="false" aria-controls="ci-panel">✈️ Hacé tu check-in</button>' +
    '<div class="ci-panel" id="ci-panel" hidden><label for="ci-q">Elegí o buscá tu aerolínea</label>' +
    '<input id="ci-q" type="search" placeholder="Ej.: Aerolíneas, LATAM, Iberia…" autocomplete="off">' +
    '<div class="ci-list" id="ci-list">' + ciLista("") + "</div>" +
    '<p class="hint">Se abre la pantalla de check-in de tu aerolínea. Tené a mano el código de reserva y tu apellido.</p></div>' +
    '<div class="blocks" style="margin-top:20px">' + blockHtml({ icon: "🧳", title: "Consejos para el vuelo", items: [
      { t: "Cuándo hacerlo", d: "Suele abrir uno o dos días antes del vuelo. Hacelo apenas abra: elegís mejor asiento." },
      { t: "Tarjeta de embarque", d: "Guardala en el celular o sacale una captura, por si no tenés internet en el aeropuerto." },
      { t: "Aeropuertos", d: "Ezeiza es para casi todos los vuelos internacionales; Aeroparque, para los de cabotaje y algunos a países vecinos. Fijate bien cuál es el tuyo." }
    ] }, true) + "</div>";

  /* Recién llegado (tarjetas #77 y #79): las primeras horas en la ciudad, paso a paso.
     Cada paso se abre y se cierra, se puede marcar como hecho (queda guardado en el celular) y trae botones que resuelven
     esa necesidad: cómo llegar desde el aeropuerto a tu alojamiento, comprar chip, cajeros cerca, dónde cargar la SUBE, llamar a emergencias.
     Las direcciones de las webs (SUBE, Personal, Claro, Movistar, Uber, Cabify, DiDi, Tienda León) se revisaron el 12/11/2026. */
  const LLEG_KEY = "guia.llegada";
  const llegEstado = () => store.get(LLEG_KEY, { hecho: [], aloja: "" });
  const gmDir = (from, to, mode) => "https://www.google.com/maps/dir/?api=1" + (from ? "&origin=" + encodeURIComponent(from) : "") + "&destination=" + encodeURIComponent(to) + "&travelmode=" + (mode || "driving");
  const gmBuscar = q => "https://www.google.com/maps/search/?api=1&query=" + encodeURIComponent(q);
  const act = (icon, label, href, sub) => {
    const ext = /^https?:/.test(href);
    return '<a class="act" href="' + esc(href) + '"' + (ext ? ' target="_blank" rel="noopener"' : "") + '><em aria-hidden="true">' + icon + "</em><span><b>" + label + "</b>" + (sub ? "<small>" + sub + "</small>" : "") + "</span></a>";
  };
  const tips = arr => '<ul class="lleg-tips">' + arr.map(t => "<li>" + t + "</li>").join("") + "</ul>";
  const llegPasos = st => {
    const destino = st.aloja ? st.aloja + ", Buenos Aires" : "Obelisco, Buenos Aires";
    const aDonde = st.aloja ? "Hasta tu alojamiento" : "Hasta el centro (Obelisco)";
    const uber = "https://m.uber.com/ul/?action=setPickup&pickup=my_location" + (st.aloja ? "&dropoff[formatted_address]=" + encodeURIComponent(destino) : "");
    const alojaForm = '<label class="lleg-aloja"><span>¿Dónde te alojás?</span><input id="lleg-aloja" type="text" autocomplete="street-address" placeholder="Dirección o nombre del hotel" value="' + esc(st.aloja) + '"></label>';
    return [
      { id: "aeropuerto", icon: "🛬", t: "Salí del aeropuerto", s: "Llegá a tu alojamiento sin vueltas",
        body: alojaForm +
          '<div class="acts">' +
          act("🗺️", "Desde Ezeiza", gmDir("Aeropuerto Internacional Ezeiza", destino), aDonde) +
          act("🗺️", "Desde Aeroparque", gmDir("Aeroparque Jorge Newbery", destino), aDonde) +
          act("🚗", "Pedir un Uber", uber, st.aloja ? "Con tu alojamiento ya cargado" : "") +
          act("🚕", "Cabify", "https://cabify.com/ar") +
          act("🚖", "DiDi", "https://web.didiglobal.com/ar/") +
          act("🚌", "Micro al centro", "https://www.tiendaleon.com/", "Tienda León, desde Ezeiza") +
          "</div>" +
          tips(["Taxis y remises: contratalos en los mostradores oficiales de adentro del aeropuerto.",
            "No aceptes ofertas de gente que se te acerque en el hall.",
            "Ezeiza queda lejos del centro: contá con un buen rato de viaje."]) },
      { id: "internet", icon: "📶", t: "Conseguí internet", s: "Chip prepago o eSIM",
        body: '<div class="acts">' +
          act("📱", "Personal", "https://www.personal.com.ar/prepago", "Chip prepago") +
          act("📱", "Claro", "https://www.claro.com.ar/personas/elegi-prepago", "Chip prepago") +
          act("✨", "Claro eSIM", "https://simple.claro.com.ar/esimple", "Sin chip físico") +
          act("📱", "Movistar", "https://www.movistar.com.ar/prepago", "Chip prepago") +
          act("📍", "Tiendas cerca", gmBuscar("tienda Personal Claro Movistar"), "En el mapa") +
          "</div>" +
          tips(["Para comprar un chip te pueden pedir el pasaporte.",
            "Si tu celular acepta eSIM, podés activarla antes de viajar.",
            "Muchos bares y cafés tienen Wi-Fi gratis: pedí la clave."]) },
      { id: "plata", icon: "💳", t: "Resolvé la plata", s: "Cambio, cajeros y cómo pagar",
        body: convHtml() +
          '<div class="acts">' +
          act("🏧", "Cajeros cerca", gmBuscar("cajero automático"), "En el mapa") +
          act("💱", "Casas de cambio", gmBuscar("casa de cambio"), "Oficiales, en el mapa") +
          act("💵", "Más sobre pagos", "#/info/practica", "Tarjetas, propina y cubierto") +
          "</div>" +
          tips(["Pagar con tarjeta extranjera suele convenir.",
            "Tené algo de efectivo en billetes chicos para propinas y kioscos.",
            "No cambies dinero con gente en la calle."]) },
      { id: "sube", icon: "🚇", t: "Prepará el transporte", s: "Tarjeta SUBE y cómo moverte",
        body: '<div class="acts">' +
          act("📍", "Dónde comprar y cargar", "https://tarjetasube.sube.gob.ar/SubeWeb/WebForms/admin/views/mapa-sube.aspx?id=1", "Mapa oficial de puntos SUBE") +
          act("📲", "App SUBE", "https://www.argentina.gob.ar/sube/nuestras-apps", "Mirá tu saldo") +
          act("🚇", "Líneas de subte", "#/info/moverse", "Recorridos y consejos") +
          "</div>" +
          '<form class="route" id="route-form"><label for="route-to">¿A dónde querés ir?</label><div class="search"><input id="route-to" name="to" required placeholder="Ej.: Teatro Colón, Caminito…" autocomplete="off"><button>Cómo llegar</button></div></form>' +
          tips(["La SUBE se compra en kioscos, estaciones de subte y puntos SUBE.",
            "En el subte y en muchos colectivos también podés pagar con tu tarjeta sin contacto."]) },
      { id: "ayuda", icon: "🆘", t: "Guardá los teléfonos útiles", s: "Tocá un número para llamar",
        body: sosHtml() +
          '<div class="acts">' +
          (st.aloja ? act("🏠", "Volver a mi alojamiento", gmDir("", destino, "transit"), st.aloja) : "") +
          act("🏥", "Farmacias cerca", gmBuscar("farmacia"), "En el mapa") +
          act("🛟", "Más ayuda", "#/info/ayuda", "Turismo, hospitales, consulados") +
          "</div>" +
          tips(["Sacale una captura a esta pantalla por si te quedás sin batería o sin internet."]) },
      { id: "dia", icon: "🧭", t: "Armá tu primer día", s: "Ideas para arrancar",
        body: '<div class="acts">' +
          act("✨", "Armar mi viaje", "#/armar", "Elegí qué te gusta") +
          act("⚡", "Buenos Aires en 1 día", "#/itinerario/1-dia", "Lo imperdible") +
          act("📅", "Qué hay hoy", "#/", "Eventos y ferias del día") +
          act("🗺️", "Ver el mapa", "#/mapa", "Lugares cerca tuyo") +
          "</div>" }
    ];
  };
  const llegadaHtml = () => {
    const st = llegEstado(), pasos = llegPasos(st);
    const n = pasos.filter(p => st.hecho.indexOf(p.id) > -1).length;
    const abierto = (pasos.find(p => st.hecho.indexOf(p.id) < 0) || {}).id;
    return '<div class="lleg-head"><div><b>Tus primeras horas en Buenos Aires</b><span>Abrí cada paso y marcalo cuando lo tengas listo.</span></div>' +
      '<div class="lleg-prog" role="progressbar" aria-valuemin="0" aria-valuemax="' + pasos.length + '" aria-valuenow="' + n + '"><i style="width:' + Math.round(n / pasos.length * 100) + '%"></i></div>' +
      '<small class="lleg-cuenta">' + (n === pasos.length ? "¡Todo listo! Disfrutá Buenos Aires." : "<span>Pasos listos</span> <b>" + n + "/" + pasos.length + "</b>") + "</small></div>" +
      '<div class="lleg">' + pasos.map((p, i) => {
        const ok = st.hecho.indexOf(p.id) > -1;
        return '<details class="lleg-paso' + (ok ? " ok" : "") + '" name="lleg"' + (p.id === abierto ? " open" : "") + ">" +
          '<summary><span class="lleg-ico" aria-hidden="true">' + (ok ? "✓" : p.icon) + "</span><span class=\"lleg-tit\"><b>" + p.t + "</b><small>" + p.s + "</small></span><i aria-hidden=\"true\">⌄</i></summary>" +
          '<div class="lleg-body">' + p.body +
          '<button type="button" class="lleg-done" data-lleg-done="' + p.id + '">' + (ok ? "↺ Marcar como pendiente" : "✓ Listo, siguiente paso") + "</button></div></details>";
      }).join("") + "</div>";
  };

  /* Frases para decir (tarjeta #77). La frase queda en castellano (data-notr) y abajo se explica para qué sirve, en el idioma elegido. */
  const FRASES = [
    ["Hola, ¿cómo andás?", "Saludo amistoso, para cualquier momento"],
    ["¿Me traés la cuenta, por favor?", "Para pedir la cuenta en un bar o restaurante"],
    ["¿Puedo pagar con tarjeta?", "Antes de pedir, por si solo aceptan efectivo"],
    ["¿Cuánto sale?", "Para preguntar el precio"],
    ["¿Cómo llego a…?", "Para pedir indicaciones en la calle"],
    ["¿Dónde está el baño?", "Para encontrar el baño"],
    ["Una mesa para dos, por favor.", "Al llegar a un restaurante"],
    ["¿Qué me recomendás?", "Para pedir una sugerencia al mozo"],
    ["Soy celíaco: ¿tienen algo sin TACC?", "Para pedir comida sin gluten"],
    ["Perdón, no hablo bien castellano.", "Para que te hablen más despacio"],
    ["Necesito un médico.", "En una urgencia"],
    ["¡Gracias, muy amable!", "Para agradecer"]
  ];
  const frasesHtml = () => '<div class="phrases">' + FRASES.map(f => '<div class="phrase"><b data-notr lang="es">' + esc(f[0]) + "</b><span>" + esc(f[1]) + "</span></div>").join("") + "</div>";

  const INFO_TABS = [["llegada", "🛬 Recién llegado"], ["moverse", "🚇 Moverse"], ["seguridad", "⚠️ Seguridad"], ["ayuda", "🆘 Ayuda"], ["practica", "💵 Práctica"], ["calendario", "📅 Calendario"], ["vuelo", "✈️ Tu vuelo"]];
  const viewInfo = tab => {
    if (!INFO_TABS.some(t => t[0] === tab)) tab = "moverse";
    const month = cityNow().getMonth() + 1;
    let body;
    if (tab === "moverse") {
      const lines = '<div class="lines">' + city.subte.map(l => '<div class="line"><span class="line-dot" style="--c:' + l.color + '">' + l.line + "</span><span><b>" + esc(l.route) + "</b><span>" + esc(l.useful) + "</span></span></div>").join("") + "</div>";
      body = '<form class="route" id="route-form"><label for="route-to">¿A dónde querés ir?</label><div class="search"><input id="route-to" name="to" required placeholder="Ej.: Teatro Colón, Caminito, Aeroparque…" autocomplete="off"><button>Cómo llegar</button></div><p class="hint">Abre Google Maps con el recorrido en transporte público desde donde estás.</p></form>' +
        '<div class="blocks">' + city.transport.map((b, i) => blockHtml({ icon: b.icon, title: b.title, items: b.items, extra: b.title === "Subte" ? lines : "" }, i < 2)).join("") + "</div>";
    } else if (tab === "llegada") {
      body = llegadaHtml();
    } else if (tab === "vuelo") {
      body = vueloHtml();
    } else if (tab === "ayuda") {
      body = helpHtml();
    } else if (tab === "practica") {
      body = '<section class="section" style="margin-top:0">' + head("¿Cuánto es en mi moneda?") + convHtml() + "</section>" +
        '<section class="section">' + head("Propina y cuenta dividida") + tipHtml() + "</section>" +
        '<section class="section">' + head("Frases para defenderte") + frasesHtml() + "</section>" +
        '<section class="section">' + head("Lista para no olvidarte de nada") + checklistHtml() + "</section>" +
        '<div class="blocks" style="margin-top:24px">' + city.practical.concat(X.practicalMore || []).map((b, i) => blockHtml(b, i === 0)).join("") + "</div>";
    } else if (tab === "calendario") {
      body = '<p class="hint">Fechas habituales: confirmá cada año antes de planificar.</p><div class="events">' + (X.events || []).map(e =>
        '<div class="event' + (e.m.indexOf(month) > -1 ? " now" : "") + '"><em aria-hidden="true">' + e.icon + "</em><span><small>" + esc(e.when) + (e.m.indexOf(month) > -1 ? " · este mes" : "") + "</small><b>" + esc(e.name) + "</b><span>" + esc(e.desc) + "</span></span></div>").join("") + "</div>";
    } else {
      body =
        '<div class="blocks" style="margin-top:14px">' + city.safety.map((b, i) => blockHtml(b, i < 2)).join("") + "</div>" +
        '<section class="section">' + head("Teléfonos de emergencia", '<a class="link" href="#/info/ayuda">Más ayuda</a>') + sosHtml() + "</section>";
    }
    return '<h1 class="page-title">Info útil</h1><p class="page-sub">Cómo moverte, qué evitar, dónde pedir ayuda y todo lo práctico.</p>' +
      '<div class="chips tabs">' + INFO_TABS.map(t => '<a class="chip' + (tab === t[0] ? " on" : "") + '" href="#/info/' + t[0] + '">' + t[1] + "</a>").join("") + "</div>" + body;
  };

  const viewItinerary = id => {
    const it = city.itineraries.find(i => i.id === id);
    if (!it) return viewHome();
    const ids = it.steps.map(s => slug(s.ref)).filter(x => byId[x]);
    return '<p><a class="link" href="#/">← Inicio</a></p><h1 class="page-title">' + it.icon + " " + esc(it.name) + '</h1><p class="page-sub">' + esc(it.desc) + " Tocá cada parada para ver el detalle.</p>" +
      '<p class="plan-actions"><button class="btn primary" data-additin="' + esc(it.id) + '">♥ Guardar todo en Mi viaje</button></p><ol class="steps">' +
      it.steps.map(s => {
        const p = byId[slug(s.ref)];
        const inner = "<small>" + esc(s.when) + "</small><b>" + esc(p ? p.name : s.ref) + "</b><span>" + esc(s.note || (p ? p.sub + " · " + p.barrio : "")) + "</span>";
        return '<li class="step"><span class="step-rail"></span>' + (p ? '<button class="step-card" data-open="' + p.id + '">' + inner + "</button>" : '<div class="step-card">' + inner + "</div>") + "</li>";
      }).join("") + "</ol>" + (ids.length ? "" : "");
  };

  /* ── Mi viaje ── */
  const routeUrl = items => {
    /* Se manda nombre y dirección, no coordenadas: con coordenadas Google pone el nombre del lugar más cercano que conoce
       y aparecían paradas que no eran (por ejemplo, una obra social en vez del lugar elegido). */
    const pt = p => encodeURIComponent(p.mapq || [p.name, p.address, p.inCity ? "Buenos Aires" : ""].filter(Boolean).join(", "));
    if (items.length === 1) return "https://www.google.com/maps/dir/?api=1&destination=" + pt(items[0]);
    const mid = items.slice(1, -1).slice(0, 9).map(pt).join("%7C");
    return "https://www.google.com/maps/dir/?api=1&origin=" + pt(items[0]) + "&destination=" + pt(items[items.length - 1]) + (mid ? "&waypoints=" + mid : "");
  };
  const planRow = (p, i, days, dow, n) => {
    const item = planOf(p.id), s = dow == null ? null : dayStatus(p, dow);
    return '<div class="row" data-open="' + p.id + '" tabindex="0" role="button" aria-label="Ver ' + esc(p.name) + '">' +
      '<span class="num' + (prefs.visited[p.id] ? " done" : "") + '" style="--c:' + cats[p.cat].color + '"' + (prefs.visited[p.id] ? ' title="Ya fuiste"' : "") + ">" + (prefs.visited[p.id] ? "✓" : i + 1) + "</span>" +
      '<span class="row-body"><b>' + esc(p.name) + "</b><span>" + [cats[p.cat].icon + " " + esc(p.sub), esc(p.barrio), priceHtml(p)].filter(Boolean).join(" · ") + (s && !s.ok ? ' · <span class="no-t">' + esc(s.text) + "</span>" : "") + "</span></span>" +
      '<span class="mv"><button data-move="' + p.id + ':-1" aria-label="Subir"' + (i === 0 ? " disabled" : "") + '>▲</button><button data-move="' + p.id + ':1" aria-label="Bajar"' + (i >= n - 1 ? " disabled" : "") + '>▼</button></span>' +
      '<select data-day="' + p.id + '" aria-label="Día para ' + esc(p.name) + '"><option value="0"' + (item.day === 0 ? " selected" : "") + ">Sin día</option>" +
      Array.from({ length: days }, (_, d) => '<option value="' + (d + 1) + '"' + (item.day === d + 1 ? " selected" : "") + ">Día " + (d + 1) + "</option>").join("") + "</select>" +
      '<button class="rm" data-fav="' + p.id + '" aria-label="Quitar ' + esc(p.name) + '">✕</button></div>';
  };
  const viewTrip = () => {
    let html = '<h1 class="page-title">Mi viaje</h1><p class="page-sub">Tus lugares guardados, organizados por día. Queda en este dispositivo.</p>';
    if (!plan.length) {
      return html + '<div class="empty"><em>🧳</em><b>Todavía no guardaste nada</b><p>Tocá el corazón de cualquier lugar para sumarlo, o dejá que armemos el recorrido por vos.</p>' +
        '<p class="plan-actions"><a class="btn primary" href="#/armar">✨ Armar mi viaje automático</a><button class="btn" data-go="' + attr({}) + '">Explorar lugares</button></p></div>';
    }
    const days = nDays();
    html += '<p class="trip-main"><a class="btn primary" href="#/armar">✨ Armar automático</a><button class="btn" data-shareplan>Compartir</button></p>' +
      '<p class="trip-more"><button class="link" data-addday>＋ Agregar un día</button><button class="link" data-print>Imprimir / PDF</button><a class="link" href="#/pasaporte">🛂 Pasaporte</a><button class="link danger" data-clearplan>Vaciar</button></p>' +
      '<label class="trip-date"><span>¿Qué día llegás?</span><input type="date" id="trip-start" value="' + esc(prefs.start) + '"></label>' +
      '<p class="hint" style="margin-top:6px">' + (prefs.start ? "Te avisamos en rojo si un lugar suele cerrar el día que lo agendaste." : "Con la fecha te avisamos si algún lugar cierra el día que lo agendaste.") + "</p>";
    for (let d = 1; d <= days; d++) {
      const items = plan.filter(x => x.day === d).map(x => byId[x.id]);
      const dt = dayDate(d), dow = dt ? dt.getDay() : null;
      const sub = [dt ? DOW[dow] + " " + dt.getDate() + "/" + (dt.getMonth() + 1) : "", prefs.names[d] || ""].filter(Boolean).join(" · ");
      html += '<section class="day"><div class="day-head"><h2>Día ' + d + (sub ? " <span>" + esc(sub) + "</span>" : "") + "</h2>" +
        (items.length ? '<p class="day-count"><b>' + items.length + '</b> <span>' + (items.length === 1 ? "parada" : "paradas") + '</span></p>' : "") +
        (items.length ? '<span class="day-tools">' +
          (items.length > 2 ? '<button class="link" data-optimize="' + d + '">Ordenar recorrido</button>' : "") +
          (hasMap ? '<button class="link" data-planmap="' + d + '">Ver en mapa</button>' : "") +
          '<a class="link" href="' + routeUrl(items) + '" target="_blank" rel="noopener">Ruta en Google Maps ↗</a></span>' : "") + "</div>" +
        (() => {   // pronóstico de ese día, si la fecha entra en los próximos 16 días
          const w = forecastFor(dt);
          if (!w) return "";
          const rainy = w[3] >= 60 && items.filter(outdoors).length >= 2;
          return '<p class="day-fc">' + WX(w[0])[0] + " " + WX(w[0])[1] + " · máx " + w[1] + "° / mín " + w[2] + "°" + (w[3] >= 30 ? " · lluvia " + w[3] + " %" : "") + "</p>" +
            (rainy ? '<p class="status no" style="margin-bottom:8px">Ese día puede llover y tenés varios planes al aire libre. <button class="link" data-go="' + attr({ q: "lluvia" }) + '">Ver planes bajo techo</button></p>' : "");
        })() +
        (items.length ? items.map((p, i) => planRow(p, i, days, dow, items.length)).join("") : '<p class="hint">Sin lugares todavía. Asignales este día desde la lista de abajo.</p>') + "</section>";
    }
    const loose = plan.filter(x => x.day === 0).map(x => byId[x.id]);
    if (loose.length) html += '<section class="day"><div class="day-head"><h2>Sin día asignado</h2></div>' + loose.map((p, i) => planRow(p, i, days, null, loose.length)).join("") + "</section>";
    return html;
  };
  const nearestOrder = items => {
    const rest = items.slice(), out = [];
    let cur = rest.shift();
    while (cur) {
      out.push(cur);
      if (!rest.length) break;
      let best = 0;
      if (cur.ll) rest.forEach((p, i) => { if (p.ll && (!rest[best].ll || km(cur.ll, p.ll) < km(cur.ll, rest[best].ll))) best = i; });
      cur = rest.splice(best, 1)[0];
    }
    return out;
  };
  const planText = () => {
    let t = "Mi viaje a " + city.name + "\n";
    for (let d = 0; d <= nDays(); d++) {
      const day = d === 0 ? 0 : d, items = plan.filter(x => x.day === (d === 0 ? 0 : day)).map(x => byId[x.id]);
      if (d === 0) continue;
      if (items.length) t += "\nDía " + d + (prefs.names[d] ? " · " + prefs.names[d] : "") + "\n" + items.map((p, i) => (i + 1) + ". " + p.name + " (" + p.barrio + ")").join("\n") + "\n";
    }
    const loose = plan.filter(x => x.day === 0).map(x => byId[x.id]);
    if (loose.length) t += "\nTambién quiero ir a\n" + loose.map(p => "• " + p.name + " (" + p.barrio + ")").join("\n") + "\n";
    return t;
  };

  /* ── Armado automático del viaje ── */
  const wiz = { days: 3, interests: ["historia", "gastro"], budget: profile.budget || 2, pace: 4 };
  if (profile.kids) wiz.interests.push("chicos");
  const INTERESTS = [["historia", "🏛️ Historia y arquitectura"], ["arte", "🎨 Arte y museos"], ["naturaleza", "🌳 Parques y aire libre"], ["gastro", "🥩 Gastronomía"], ["noche", "🍸 Tango y noche"], ["compras", "🛍️ Compras y ferias"], ["futbol", "⚽ Fútbol"], ["deporte", "🏇 Deportes"], ["chicos", "🧒 Viajo con chicos"]];
  const likes = {
    historia: p => /Histórico|Ícono|Paseo|Barrio|Mirador|Mercado/.test(p.sub) || /historia|arquitectura/.test((p.tags || []).join(" ")),
    arte: p => /Museo|Cultura/.test(p.sub) || (p.tags || []).indexOf("arte") > -1,
    naturaleza: p => p.sub === "Naturaleza",
    futbol: p => p.sub === "Fútbol",
    chicos: p => (p.tags || []).indexOf("chicos") > -1
  };
  /* Armá tu viaje, rediseñado: pasos numerados, botones grandes y un botón fijo abajo con el resumen. */
  const viewWizard = () => {
    const d = wiz.days, ni = wiz.interests.length;
    const tile = (key, val, icon, label, on, extra) => '<button class="wz-tile' + (on ? " on" : "") + '" data-wiz="' + key + ":" + val + '" aria-pressed="' + on + '"><span class="wz-ico" aria-hidden="true">' + icon + "</span><b>" + label + "</b>" + (extra ? "<small>" + extra + "</small>" : "") + "</button>";
    const step = (n, title, hint, body) => '<section class="wz-step"><h2><i aria-hidden="true">' + n + "</i><span>" + title + "</span></h2>" + (hint ? '<p class="wz-hint">' + hint + "</p>" : "") + body + "</section>";
    const BUD = [[1, "$", "Económico"], [2, "$$", "Medio"], [3, "$$$", "Sin mirar mucho"], [4, "$$$$", "Lo mejor"]];
    const PACE = [[3, "🚶", "Tranquilo", "3 visitas por día"], [4, "🙂", "Normal", "4 visitas por día"], [5, "⚡", "Quiero ver todo", "5 visitas por día"]];
    return '<p><a class="link" href="#/viaje">← Mi viaje</a></p><h1 class="page-title">✨ Armá tu viaje</h1><p class="page-sub">Respondé cinco preguntas y te dejamos un recorrido por zonas, con dónde comer en cada una. Después lo ajustás como quieras.</p>' +
      '<div class="wz">' +
      step(1, "¿Cuántos días te quedás?", "", '<div class="wz-stepper"><button class="wz-pm" data-wiz="days:' + Math.max(1, d - 1) + '" aria-label="Un día menos"' + (d <= 1 ? " disabled" : "") + '>−</button><div class="wz-count"><b>' + d + "</b><span>" + (d === 1 ? "día" : "días") + '</span></div><button class="wz-pm" data-wiz="days:' + Math.min(7, d + 1) + '" aria-label="Un día más"' + (d >= 7 ? " disabled" : "") + ">+</button></div>") +
      step(2, "¿Qué te interesa?", "Elegí todo lo que quieras.", '<div class="wz-grid">' + INTERESTS.map(i => { const sp = i[1].indexOf(" "); return tile("interests", i[0], i[1].slice(0, sp), i[1].slice(sp + 1), wiz.interests.indexOf(i[0]) > -1); }).join("") + "</div>") +
      step(3, "¿Cuánto querés gastar en comer?", "", '<div class="wz-grid four">' + BUD.map(o => tile("budget", o[0], o[1], o[2], wiz.budget === o[0])).join("") + "</div>") +
      step(4, "¿A qué ritmo?", "", '<div class="wz-grid three">' + PACE.map(o => tile("pace", o[0], o[1], o[2], wiz.pace === o[0], o[3])).join("") + "</div>") +
      step(5, "¿Qué día llegás?", "Opcional. Con la fecha no te agendamos museos el día que cierran.", '<label class="trip-date"><input type="date" id="trip-start" value="' + esc(prefs.start) + '" aria-label="Fecha de llegada"></label>') +
      "</div>" +
      (plan.length ? '<p class="wz-warn">Vas a reemplazar tu viaje actual.</p>' : "") +
      '<div class="wz-bar"><p class="wz-sum"><b>' + d + "</b> <span>" + (d === 1 ? "día" : "días") + "</span> · <b>" + ni + "</b> <span>" + (ni === 1 ? "interés" : "intereses") + "</span> · <b>" + "$$$$".slice(0, wiz.budget) + '</b></p><button class="btn primary big" data-build>✨ Armar mi viaje</button></div>';
  };
  const buildPlan = () => {
    const Z = X.zones || [];
    const merge = (name, idx) => ({ name, barrios: idx.reduce((a, i) => a.concat(Z[i].barrios), []) });
    let zones = wiz.days === 1 ? [merge("Lo esencial", [0, 1])] : wiz.days === 2 ? [merge("Centro, San Telmo y La Boca", [0, 3]), merge("Recoleta y Palermo", [1, 2])] : Z.slice();
    if (wiz.days >= 3 && wiz.interests.indexOf("chicos") > -1) zones = [Z[2]].concat(zones.filter(z => z !== Z[2]));
    const used = {}, out = [], names = {};
    const interest = p => wiz.interests.filter(k => likes[k] && likes[k](p)).length;
    const pick = (list, n) => { const r = list.filter(p => !used[p.id]).slice(0, n); r.forEach(p => { used[p.id] = true; }); return r; };
    for (let d = 1; d <= wiz.days; d++) {
      const z = zones[(d - 1) % zones.length];
      names[d] = z.name;
      const inZ = p => z.barrios.indexOf(p.barrio) > -1 && p.ll;
      const dow = dayDow(d);   // null si no se cargó fecha de llegada
      const openOn = p => { const c = X.closed && X.closed[p.id]; return !(dow !== null && c && c.indexOf(dow) > -1); };
      const sights = nearestOrder(pick(places.filter(p => p.cat === "ver" && inZ(p) && openOn(p)).sort((a, b) => (b.q * 10 + interest(b) * 7) - (a.q * 10 + interest(a) * 7)), wiz.pace));
      const anchor = sights[Math.floor(sights.length / 2)] || sights[0];
      const near = (a, b) => anchor && a.ll && b.ll ? km(anchor.ll, a.ll) - km(anchor.ll, b.ll) : 0;
      const food = places.filter(p => p.cat === "comer" && p.ll && p.inCity && fitsMe(p));   // respeta la dieta del perfil
      const meals = food.filter(p => !/Café|Helad/.test(p.sub));
      const fit = (list, max) => { const ok = list.filter(p => p.price <= max); return (ok.length ? ok : list.slice().sort((a, b) => a.price - b.price)); };
      // Lo que funciona solo ciertos días (ferias, shows) entra únicamente si coincide con la fecha.
      const anyDay = p => { const o = X.only && X.only[p.id]; return (!o || (dow !== null && o.indexOf(dow) > -1)) && openOn(p); };
      // Primero lo que está en la zona; si no hay nada, solo lo más cercano (para no cruzar la ciudad).
      // Las comidas siempre se completan (must); las paradas opcionales se saltean si quedan a más de 1,5 km.
      const zoneFirst = (list, must) => {
        const free = list.filter(p => !used[p.id]), zz = free.filter(inZ);
        if (zz.length) return zz;
        const close = free.sort(near).slice(0, 3);
        return must ? close : close.filter(p => anchor && km(anchor.ll, p.ll) <= 1.5);
      };
      const lunch = pick(zoneFirst(fit(meals, Math.min(wiz.budget, 2)), true).sort((a, b) => b.q - a.q || near(a, b)), 1);
      const dinner = pick(zoneFirst(fit(meals.filter(p => p.sub !== "Al paso"), wiz.budget), true).sort((a, b) => (b.q * 3 + b.price) - (a.q * 3 + a.price) || near(a, b)), 1);
      const treat = wiz.interests.indexOf("gastro") > -1 || wiz.pace >= 4 ? pick(zoneFirst(food.filter(p => /Café|Helad/.test(p.sub))).sort((a, b) => b.q - a.q || near(a, b)), 1) : [];
      const shop = wiz.interests.indexOf("compras") > -1 ? pick(places.filter(p => p.cat === "compras" && inZ(p) && anyDay(p)).sort((a, b) => b.q - a.q), 1) : [];
      const night = wiz.interests.indexOf("noche") > -1 ? pick(zoneFirst(places.filter(p => p.cat === "noche" && p.ll && anyDay(p) && p.sub !== "Teatro" && p.price <= wiz.budget + 1)).sort((a, b) => b.q - a.q || near(a, b)), 1) : [];
      const sport = wiz.interests.indexOf("deporte") > -1 ? pick(places.filter(p => p.cat === "deporte" && inZ(p) && anyDay(p)).sort((a, b) => b.q - a.q), 1) : [];
      const half = Math.ceil(sights.length / 2);
      sights.slice(0, half).concat(lunch, sights.slice(half), sport, shop, treat, dinner, night).forEach(p => out.push({ id: p.id, day: d }));
    }
    plan = out;
    prefs.days = wiz.days; prefs.names = names;
    savePrefs(); savePlan();
  };

  /* ── Mapa (Leaflet + OpenStreetMap) ── */
  let map = null, markerLayer = null, zoneLayer = null, helpLayer = null, meMarker = null, focusId = null, barrioLL = null;
  const NOANIM = { animate: false };   // los movimientos automáticos van sin animación: más rápido y sin estados a medio dibujar
  const CITY_BOUNDS = [[-34.705, -58.531], [-34.527, -58.335]];
  const destroyMap = () => { if (map) { map.remove(); map = null; markerLayer = null; zoneLayer = null; helpLayer = null; meMarker = null; } };
  const createMap = () => {
    map = L.map("map").setView(city.center || [-34.6037, -58.3816], 13);
    L.tileLayer("https://tile.openstreetmap.org/{z}/{x}/{y}.png", { maxZoom: 19, attribution: '&copy; <a href="https://www.openstreetmap.org/copyright" target="_blank" rel="noopener">OpenStreetMap</a>' }).addTo(map);
    zoneLayer = L.layerGroup().addTo(map);
    markerLayer = L.layerGroup().addTo(map);
    helpLayer = L.layerGroup().addTo(map);
    if (userLL) showMe();
  };
  /* Capa de zonas: pinta cada barrio según el nivel que tiene en la capa elegida. */
  const decode = s => s.split(" ").filter(g => g.length === 8).map(g => [-(34 + g.slice(0, 4) / 1e4), -(58 + g.slice(4) / 1e4)]);
  const drawZones = () => {
    if (!map || !Z) return;
    zoneLayer.clearLayers();
    const l = Z.layers.find(x => x.id === zoneId);
    if (!l) return;
    if (!barrioLL) { barrioLL = {}; Object.keys(Z.barrios).forEach(n => { barrioLL[n] = decode(Z.barrios[n]); }); }
    const lv = {};
    Object.keys(l.levels).forEach(k => l.levels[k].forEach(n => { lv[n] = +k; }));
    Object.keys(barrioLL).forEach(n => {
      const level = lv[n], leg = level && l.legend[level];
      const guide = (Z.guide && Z.guide[n]) || n;
      const count = places.filter(p => p.barrio === guide).length;
      const note = (l.notes && l.notes[n]) || (leg && l.defaults && l.defaults[level]) || "";
      L.polygon(barrioLL[n], leg ? { color: "#ffffff", weight: 1.5, fillColor: leg[0], fillOpacity: .45 } : { color: "#7b8794", weight: 1, fillOpacity: 0, dashArray: "3 5" })
        .bindPopup('<div class="pop"><b>' + esc(n) + "</b>" + (leg ? '<span class="pop-level"><i style="background:' + leg[0] + '"></i>' + esc(leg[1]) + "</span>" : "<span>Sin nada destacado en esta capa</span>") +
          (note ? "<p>" + esc(note) + "</p>" : "") + (count ? '<button data-go="' + attr({ barrio: guide }) + '">Ver ' + count + (count === 1 ? " lugar" : " lugares") + "</button>" : "") + "</div>")
        .addTo(zoneLayer);
    });
    (l.spots || []).forEach(s => {
      const leg = l.legend[s.level];
      L.circle(s.ll, { radius: s.r, color: leg[0], weight: 2.5, fillColor: leg[0], fillOpacity: .55 })
        .bindPopup('<div class="pop"><b>' + esc(s.name) + '</b><span class="pop-level"><i style="background:' + leg[0] + '"></i>' + esc(leg[1]) + "</span><p>" + esc(s.note) + "</p></div>").addTo(zoneLayer);
    });
  };
  const drawHelp = () => {
    if (!map || !Z) return;
    helpLayer.clearLayers();
    if (!showHelp) return;
    let focus = null;
    Z.help.forEach(h => {
      const t = Z.helpTypes[h.type];
      const m = L.marker(h.ll, { title: h.name, zIndexOffset: 500, icon: L.divIcon({ className: "", iconSize: [30, 30], iconAnchor: [15, 15], popupAnchor: [0, -14], html: '<div class="hpin" style="--c:' + t.color + '">' + t.icon + "</div>" }) })
        .bindPopup('<div class="pop"><b>' + esc(h.name) + "</b><span>" + esc(t.name) + " · " + esc(h.address) + "</span><p>" + esc(h.note) + '</p><div class="pop-actions"><a href="' + helpDir(h) + '" target="_blank" rel="noopener">Cómo llegar</a>' +
          (h.tel ? '<a href="tel:' + h.tel + '">Llamar</a>' : "") + (h.wa ? '<a href="https://wa.me/' + h.wa + '" target="_blank" rel="noopener">WhatsApp</a>' : "") + "</div></div>");
      m.addTo(helpLayer);
      if (h.id === focusHelp) focus = m;
    });
    if (focus) { map.setView(focus.getLatLng(), 16, NOANIM); focus.openPopup(); }
    focusHelp = null;
  };
  const paintOverlays = () => {
    if ($("#m-zones")) $("#m-zones").innerHTML = zoneChips();
    if ($("#zone-legend")) $("#zone-legend").innerHTML = legendHtml();
    if ($("#zone-note")) $("#zone-note").innerHTML = zoneNoteHtml();
    drawZones(); drawHelp();
  };
  const showMe = () => {
    if (!map || !userLL) return;
    if (meMarker) meMarker.remove();
    meMarker = L.marker(userLL, { icon: L.divIcon({ className: "", iconSize: [16, 16], iconAnchor: [8, 8], html: '<div class="me"></div>' }), title: "Estás acá", zIndexOffset: 1000 }).addTo(map);
  };
  const drawMarkers = items => {
    markerLayer.clearLayers();
    const withLl = items.filter(p => p.ll), fit = [];
    const far = f.cat === "escapadas" || withLl.every(p => !p.inCity);
    let focus = null;
    withLl.forEach((p, i) => {
      const c = cats[p.cat];
      const m = L.marker(p.ll, { title: p.name, icon: L.divIcon({ className: "", iconSize: [30, 30], iconAnchor: [15, 30], popupAnchor: [0, -28],
        html: '<div class="pin" style="--c:' + c.color + '"><span>' + (f.planDay !== null ? i + 1 : c.icon) + "</span></div>" }) })
        .bindPopup('<div class="pop"><b>' + esc(p.name) + "</b><span>" + esc(p.sub) + " · " + esc(p.barrio) + (p.price ? " · " + "$$$$".slice(0, p.price) : p.price === 0 ? " · Gratis" : "") + '</span><button data-open="' + p.id + '">Ver ficha</button></div>');
      m.addTo(markerLayer);
      if (far || p.inCity) fit.push(p.ll);
      if (p.id === focusId) focus = m;
    });
    if (f.planDay !== null && withLl.length > 1) L.polyline(withLl.map(p => p.ll), { color: "#1c7ed6", weight: 3, opacity: .7, dashArray: "6 8" }).addTo(markerLayer);
    if (focus) { map.setView(focus.getLatLng(), 16, NOANIM); focus.openPopup(); }
    else if (f.sort === "cerca" && userLL) map.setView(userLL, 15, NOANIM);
    else if (focusHelp) { /* drawHelp centra el mapa en el punto de ayuda */ }
    else if (fit.length === 1) map.setView(fit[0], 15, NOANIM);
    else if (fit.length) map.fitBounds(fit, { padding: [30, 30], maxZoom: 16, animate: false });
    else map.fitBounds(CITY_BOUNDS, NOANIM);
    focusId = null;
    const missing = items.length - withLl.length;
    $("#count").outerHTML = f.cat === "ninguno" && f.planDay === null
      ? '<p class="count" id="count"><span>Lugares ocultos. Elegí una categoría para verlos sobre las zonas.</span></p>'
      : countLine(withLl.length, " en el mapa" + (missing ? " · " + missing + " sin ubicación fija" : ""));
    paintOverlays();
  };
  const onMap = () => parse(rendered).name === "mapa";
  const paintResults = () => {
    const results = $("#results");
    if (!results) return;
    const items = filtered();
    if (onMap()) {
      if (!hasMap) { results.innerHTML = '<div class="empty"><em>🗺️</em><b>El mapa necesita conexión</b><p>Cuando tengas internet vas a poder verlo. Mientras tanto, la lista funciona sin conexión.</p></div>'; return; }
      if (!$("#map")) {
        destroyMap();
        results.innerHTML = '<p class="count" id="count"></p><div class="map-box"><div id="map" class="map"></div><div class="map-legend" id="zone-legend"></div><button class="locate" data-locate>◎ Mi ubicación</button></div><div id="zone-note"></div>';
        createMap();
      }
      drawMarkers(items);
    } else {
      destroyMap();
      results.innerHTML = countLine(items.length) + (items.length ? listHtml(items)
        : '<div class="empty"><em>🔎</em><b>No encontramos nada con esos filtros</b><p>Probá con otra palabra o quitá algún filtro.</p><p class="plan-actions"><button class="btn" data-clear>Borrar filtros</button></p></div>');
    }
  };
  const paintFilters = () => {
    if (!$("#f-cats")) return;
    $("#f-cats").innerHTML = catChips(onMap());
    if ($("#f-subs")) $("#f-subs").innerHTML = subChips();
    if ($("#f-tools")) $("#f-tools").innerHTML = toolChips();
    paintResults();
  };

  /* ── Ficha de lugar ── */
  let sheetId = null, sheetPushed = false, lastFocus = null;
  const nearestStation = p => {
    if (!p.ll || !p.inCity || !stations.length) return null;
    let best = null, bd = 1e9;
    stations.forEach(s => { const d = km(p.ll, s.ll); if (d < bd) { bd = d; best = s; } });
    return { s: best, d: bd };
  };
  const sheetPlanHtml = id => {
    const item = planOf(id);
    if (!item) return "";
    const days = nDays();
    return '<div class="sheet-plan"><b>En tu viaje:</b><div class="chips wrap">' +
      [0].concat(Array.from({ length: days }, (_, d) => d + 1)).map(d => '<button class="chip sm' + (item.day === d ? " on" : "") + '" data-setday="' + id + ":" + d + '">' + (d ? "Día " + d : "Sin día") + "</button>").join("") +
      '<button class="chip sm" data-setday="' + id + ":" + (days + 1) + '">＋ Día ' + (days + 1) + "</button></div></div>";
  };
  const paintSheetPlan = id => { const el = $("#sheet-plan"); if (el) el.innerHTML = sheetPlanHtml(id); };
  const showSheet = id => {
    const p = byId[id], c = cats[p.cat];
    const q = p.mapq || (p.name + ", " + p.address + ", Buenos Aires");
    const fixed = p.ll || !p.inCity;
    const dirUrl = "https://www.google.com/maps/dir/?api=1&destination=" + encodeURIComponent(q) + (p.inCity ? "&travelmode=transit" : "");
    const mapsUrl = "https://www.google.com/maps/search/?api=1&query=" + encodeURIComponent(fixed ? q : p.name + ", Buenos Aires");
    const st = todayStatus(p), ns = nearestStation(p), d = distTxt(p);
    const near = p.ll && p.inCity ? places.filter(o => o.id !== p.id && o.ll && o.inCity && (o.cat === "comer" || o.cat === "ver") && km(p.ll, o.ll) < 1.2)
      .sort((a, b) => km(p.ll, a.ll) - km(p.ll, b.ll)) : [];
    const nearPick = near.filter(o => o.cat === (p.cat === "comer" ? "ver" : "comer")).slice(0, 3).concat(near.filter(o => o.cat === (p.cat === "comer" ? "comer" : "ver")).slice(0, 2));
    const file = p.photo ? p.photo.replace(/^!/, "").split("/").pop() : "";
    sheet.style.setProperty("--c", c.color);
    sheet.innerHTML =
      '<div class="sheet-head' + (p.photo ? " has-photo" : "") + '">' +
        (p.photo ? '<img src="' + esc(photo(p.photo, 960)) + '" data-fb="' + esc(photo(p.photo, 500)) + '" alt="">' : "") +
        '<button class="x" data-close aria-label="Cerrar">✕</button>' +
        '<div class="sheet-title"><em aria-hidden="true">' + iconOf(p) + '</em><h2 id="sheet-title">' + esc(p.name) + "</h2><p>" + esc(c.name) + " · " + esc(p.sub) + " · " + esc(p.barrio) + "</p></div></div>" +
      '<div class="sheet-body">' +
        '<p class="bdgs"><span class="bdg ' + (p.q === 3 ? "q" : "q2") + '">' + (p.q === 3 ? "★ " : "") + QL[p.q] + "</span>" + p.awards.map(a => '<span class="bdg aw">🏅 ' + esc(a) + "</span>").join("") + "</p>" +
        "<p>" + esc(p.desc) + "</p>" +
        (p.diet.length ? '<div class="diet"><b>' + (p.dietFull ? "Local 100 % " : "Con opciones para: ") + esc(p.diet.join(", ")) + "</b>Confirmá siempre en el local antes de pedir, sobre todo si tenés celiaquía o alergias: las cocinas y las cartas cambian.</div>" : "") +
        (p.tip ? '<div class="tip"><b>Consejo</b>' + esc(p.tip) + "</div>" : "") +
        (st ? '<p class="status ' + (st.ok ? "ok" : "no") + '">' + (st.ok ? "🟢 " + esc(st.text) : "🔴 Hoy (" + DOW[cityNow().getDay()] + ") no: " + esc(st.text.toLowerCase())) + ".</p>" : "") +
        '<div class="actions">' +
          '<a class="btn primary" href="' + (fixed ? dirUrl : mapsUrl) + '" target="_blank" rel="noopener">📍 ' + (fixed ? "Cómo llegar" : "Buscar en Maps") + "</a>" +
          '<button class="btn" data-fav="' + p.id + '" aria-pressed="' + !!planOf(p.id) + '">' + favLabel(p.id) + "</button>" +
          '<button class="btn visit" data-visit="' + p.id + '" aria-pressed="' + !!prefs.visited[p.id] + '">' + visitLabel(p.id) + "</button>" +
          '<a class="btn" href="' + mapsUrl + '" target="_blank" rel="noopener">⭐ Opiniones y horarios</a>' +
          (p.ll && hasMap ? '<button class="btn" data-showmap="' + p.id + '">🗺️ Ver en el mapa</button>' : "") +
          (p.ll && p.inCity ? '<a class="btn" href="https://m.uber.com/ul/?action=setPickup&pickup=my_location&dropoff%5Blatitude%5D=' + p.ll[0] + "&dropoff%5Blongitude%5D=" + p.ll[1] + "&dropoff%5Bnickname%5D=" + encodeURIComponent(p.name) + '" target="_blank" rel="noopener">🚕 Ir en Uber</a>' : "") +
          (p.cat === "dormir" && p.sub !== "Departamento" ? '<a class="btn" href="https://www.booking.com/searchresults.html?ss=' + encodeURIComponent(p.name + " Buenos Aires") + '" target="_blank" rel="noopener">🛏️ Ver disponibilidad</a>' : "") +
          '<button class="btn" data-share="' + p.id + '">↗ Compartir</button>' +
        "</div>" +
        '<div id="sheet-plan">' + sheetPlanHtml(p.id) + "</div>" +
        '<dl class="facts">' +
          "<div><dt>" + (p.inCity ? "Dirección" : "Distancia") + "</dt><dd>" + esc(p.address) + "</dd></div>" +
          (p.price != null ? "<div><dt>Precio</dt><dd>" + (p.price ? "$$$$".slice(0, p.price) + " · " : "") + PRICE_WORD[p.price] + (p.cat === "dormir" ? " (por noche)" : "") + "</dd></div>" : "") +
          (ns ? "<div><dt>Subte</dt><dd>" + (ns.d <= 1.2 ? '<span class="line-dot sm" style="--c:' + (lineColor[ns.s.line] || "#888") + '">' + ns.s.line + "</span> " + esc(ns.s.name) + " · a " + fmtKm(ns.d) : "Sin estación cerca: mejor colectivo, taxi o app") + "</dd></div>" : "") +
          (d ? "<div><dt>Desde vos</dt><dd>a " + d + " en línea recta</dd></div>" : "") +
        "</dl>" +
        (p.tags && p.tags.length ? '<div class="tags">' + p.tags.map(t => '<button data-go="' + attr({ q: t }) + '">' + esc(t) + "</button>").join("") + "</div>" : "") +
        (nearPick.length ? '<div class="near"><b>Cerca de acá</b>' + nearPick.map(o => '<button class="near-row" data-open="' + o.id + '"><span aria-hidden="true">' + cats[o.cat].icon + "</span><span><b>" + esc(o.name) + "</b><span>" + esc(o.sub) + (o.price ? " · " + "$$$$".slice(0, o.price) : o.price === 0 ? " · Gratis" : "") + "</span></span><i>" + fmtKm(km(p.ll, o.ll)) + "</i></button>").join("") + "</div>" : "") +
        (file ? '<p class="credit">Foto: <a href="https://commons.wikimedia.org/wiki/File:' + encodeURI(file) + '" target="_blank" rel="noopener">Wikimedia Commons</a></p>' : "") +
      "</div>";
    if (sheetId === null) lastFocus = document.activeElement;
    sheetId = id;
    sheetWrap.hidden = false;
    document.body.classList.add("locked");
    sheet.scrollTop = 0;
    $(".x", sheet).focus({ preventScroll: true });
  };
  const hideSheet = () => {
    if (sheetId === null) return;
    sheetId = null; sheetPushed = false;
    sheetWrap.hidden = true;
    document.body.classList.remove("locked");
    if (lastFocus && document.contains(lastFocus)) lastFocus.focus({ preventScroll: true });
  };
  const openPlace = id => {
    if (!byId[id]) return;
    if (sheetId !== null) location.replace("#/lugar/" + id);
    else { sheetPushed = true; location.hash = "#/lugar/" + id; }
  };
  const closeSheet = () => {
    if (sheetId === null) return;
    if (sheetPushed) history.back(); else location.replace(rendered || "#/");
  };

  /* ── Router ── */
  let rendered = null, isNewNav = false;
  const scrolls = {};
  const parse = h => { const p = (h || "").replace(/^#\/?/, "").split("/").map(decodeURIComponent); return { name: p[0] || "inicio", arg: p[1] }; };
  const route = () => parse(rendered);
  const NAV = { barrios: "explorar", itinerario: "inicio", armar: "viaje", guardados: "viaje", pasaporte: "viaje", moverse: "info", consejos: "info" };
  const renderView = h => {
    const r = parse(h);
    destroyMap();
    view.innerHTML = r.name === "explorar" ? viewExplore() : r.name === "mapa" ? viewMap() : r.name === "barrios" ? viewBarrios()
      : r.name === "info" ? viewInfo(r.arg) : r.name === "moverse" ? viewInfo("moverse")
      : r.name === "consejos" ? viewInfo(r.arg === "practica" || r.arg === "calendario" ? r.arg : "seguridad")
      : r.name === "viaje" || r.name === "guardados" ? viewTrip() : r.name === "itinerario" ? viewItinerary(r.arg)
      : r.name === "armar" ? viewWizard() : r.name === "cuenta" ? viewAccount() : r.name === "pasaporte" ? viewPassport() : viewHome();
    paintResults();
    paintConv();
    const key = NAV[r.name] || r.name;
    $$("[data-nav]").forEach(a => {
      const on = a.getAttribute("data-nav") === key;
      a.classList.toggle("on", on);
      if (on) a.setAttribute("aria-current", "page"); else a.removeAttribute("aria-current");
    });
  };
  const rerender = () => { const y = window.scrollY; renderView(rendered); window.scrollTo(0, y); };
  const sync = () => {
    const h = location.hash || "#/", r = parse(h);
    if (r.name === "lugar" && byId[r.arg]) {
      if (rendered === null) { rendered = "#/"; renderView(rendered); }
      showSheet(r.arg);
      return;
    }
    hideSheet();
    if (h !== rendered) {
      if (rendered) scrolls[rendered] = window.scrollY;
      rendered = h;
      renderView(h);
      window.scrollTo(0, isNewNav ? 0 : (scrolls[h] || 0));
    }
    isNewNav = false;
  };
  const go = (hash, force) => {
    isNewNav = true;
    if (force && rendered === hash) rendered = "";
    if (sheetId !== null) { sheetPushed = false; location.replace(hash); }
    else if (location.hash === hash) sync();
    else location.hash = hash;
  };
  const goExplore = filters => {
    const next = Object.assign({}, filters || {});
    const toMap = next.mode === "mapa" && hasMap; delete next.mode;
    if ("zone" in next) { zoneId = next.zone; delete next.zone; }
    if ("help" in next) { showHelp = !!next.help; delete next.help; }
    resetFilters(next);
    go(toMap ? "#/mapa" : "#/explorar", true);
  };
  window.addEventListener("hashchange", sync);

  /* Eventos del día de la agenda oficial de la Ciudad (tarjeta #65). Un paso automático los baja una vez por día a data/hoy.json.
     Si el archivo no está, no carga o es viejo (más de 3 días), la sección "Hoy" sigue solo con la agenda fija. */
  const loadHoy = () => {
    if (location.protocol === "file:" || !window.fetch) return;
    fetch("data/hoy.json", { cache: "no-cache" }).then(r => (r.ok ? r.json() : null)).then(d => {
      if (!d || !Array.isArray(d.eventos)) return;
      const edad = Date.now() - new Date(d.actualizado).getTime();
      if (!(edad < 3 * 86400e3)) return;
      liveHoy = d.eventos.filter(e => e && e.t && e.ini && /^https:\/\//.test(e.url || ""));
      if (route().name === "inicio" && sheetId === null) rerender();
    }).catch(() => { /* sin conexión: queda la agenda fija */ });
  };
  loadHoy();

  /* Copiar al portapapeles con aviso. Si el navegador no deja (sin permiso, o abierto como archivo), lo dice (tarjeta #52). */
  const copyText = (text, okMsg) => {
    const fail = () => toast("No se pudo copiar: este navegador no lo permite");
    if (!navigator.clipboard || !navigator.clipboard.writeText) { fail(); return; }
    navigator.clipboard.writeText(text).then(() => toast(okMsg), fail);
  };

  /* ── Eventos ── */
  document.addEventListener("click", e => {
    const ld = e.target.closest("[data-lleg-done]");
    if (ld) {
      const st = llegEstado(), id = ld.getAttribute("data-lleg-done"), i = st.hecho.indexOf(id);
      if (i > -1) st.hecho.splice(i, 1); else st.hecho.push(id);
      store.set(LLEG_KEY, st);
      rerender();
      const abierto = document.querySelector(".lleg-paso[open]");
      if (abierto) abierto.scrollIntoView({ behavior: "smooth", block: "nearest" });
      return;
    }
    if (e.target.closest("#ci-abrir")) {
      const p = document.getElementById("ci-panel"), b = document.getElementById("ci-abrir");
      p.hidden = !p.hidden;
      b.setAttribute("aria-expanded", String(!p.hidden));
      if (!p.hidden) document.getElementById("ci-q").focus();
    }
    const t = e.target;
    let el;
    if (t.closest("select")) return;
    if ((el = t.closest('a[href^="#/"]'))) { isNewNav = true; return; }
    if (t.closest("[data-close]")) { closeSheet(); return; }
    if ((el = t.closest("[data-fav]"))) { toggleSave(el.getAttribute("data-fav")); return; }
    if ((el = t.closest("[data-setday]"))) {
      const v = el.getAttribute("data-setday").split(":"), item = planOf(v[0]);
      if (item) { item.day = +v[1]; prefs.days = Math.max(prefs.days, item.day); savePrefs(); savePlan(); paintSheetPlan(v[0]); toast(item.day ? "Agendado para el día " + item.day : "Sin día asignado"); }
      return;
    }
    if ((el = t.closest("[data-share]"))) {
      const p = byId[el.getAttribute("data-share")];
      const url = location.href.split("#")[0] + "#/lugar/" + p.id;
      if (navigator.share) navigator.share({ title: p.name, text: p.name + " — " + p.desc, url }).catch(() => {});
      else copyText(p.name + " — " + url, "Enlace copiado");
      return;
    }
    if (t.closest("[data-shareplan]")) {
      const text = planText();
      if (navigator.share) navigator.share({ title: "Mi viaje a " + city.name, text }).catch(() => {});
      else copyText(text, "Viaje copiado: pegalo donde quieras");
      return;
    }
    if ((el = t.closest("[data-move]"))) {   // sube o baja un lugar dentro de su día
      const mv = el.getAttribute("data-move").split(":"), it = planOf(mv[0]);
      const same = plan.filter(x => x.day === it.day), k = same.indexOf(it), other = same[k + (+mv[1])];
      if (other) { const a = plan.indexOf(it), b = plan.indexOf(other); plan[a] = other; plan[b] = it; savePlan(); rerender(); }
      return;
    }
    if (t.closest("[data-addday]")) { prefs.days = nDays() + 1; savePrefs(); rerender(); return; }
    if (t.closest("[data-clearplan]")) {
      if (window.confirm("¿Vaciar Mi viaje? Se quitan los " + plan.length + " lugares guardados.")) { plan = []; prefs.days = 1; prefs.names = {}; savePrefs(); savePlan(); rerender(); }
      return;
    }
    if ((el = t.closest("[data-optimize]"))) {
      const d = +el.getAttribute("data-optimize");
      const ordered = nearestOrder(plan.filter(x => x.day === d).map(x => byId[x.id])).map(p => ({ id: p.id, day: d }));
      plan = plan.filter(x => x.day !== d).concat(ordered);
      savePlan(); rerender(); toast("Recorrido ordenado por cercanía");
      return;
    }
    if ((el = t.closest("[data-planmap]"))) { goExplore({ planDay: +el.getAttribute("data-planmap"), mode: "mapa" }); return; }
    if ((el = t.closest("[data-additin]"))) {
      const it = city.itineraries.find(i => i.id === el.getAttribute("data-additin"));
      let n = 0;
      it.steps.forEach(s => { const id = slug(s.ref); if (byId[id] && !planOf(id)) { const m = /Día (\d)/.exec(s.when); plan.push({ id, day: m ? +m[1] : 1 }); n++; } });
      prefs.days = nDays(); savePrefs(); savePlan();
      toast(n ? n + " lugares guardados en Mi viaje" : "Ya los tenías guardados");
      return;
    }
    if ((el = t.closest("[data-wiz]"))) {
      const v = el.getAttribute("data-wiz").split(":");
      if (v[0] === "interests") { const i = wiz.interests.indexOf(v[1]); if (i > -1) wiz.interests.splice(i, 1); else wiz.interests.push(v[1]); }
      else wiz[v[0]] = +v[1];
      rerender();
      return;
    }
    if (t.closest("[data-build]")) {
      if (plan.length && !window.confirm("Esto reemplaza tu viaje actual. ¿Seguimos?")) return;
      buildPlan(); toast("Listo: " + plan.length + " lugares en " + wiz.days + (wiz.days === 1 ? " día" : " días")); go("#/viaje", true);
      return;
    }
    if (t.closest("[data-locate]")) { locate(() => { showMe(); if (map) map.setView(userLL, 15, NOANIM); }); return; }
    if (t.closest("[data-near]")) { locate(() => goExplore({ sort: "cerca" })); return; }
    if ((el = t.closest("[data-zone]"))) { const z = el.getAttribute("data-zone"); zoneId = zoneId === z ? "" : z; paintOverlays(); return; }
    if (t.closest("[data-help]")) { showHelp = !showHelp; paintOverlays(); return; }
    if ((el = t.closest("[data-helpfocus]"))) { focusHelp = el.getAttribute("data-helpfocus"); goExplore({ cat: "ninguno", help: true, mode: "mapa" }); return; }
    if (t.closest("[data-surprise]")) {
      const pool = places.filter(p => p.inCity && p.cat !== "dormir" && p.q >= 2 && openToday(p));
      openPlace(pool[Math.floor(Math.random() * pool.length)].id);
      return;
    }
    if (t.closest("[data-print]")) { window.print(); return; }
    if ((el = t.closest("[data-visit]"))) { toggleVisit(el.getAttribute("data-visit")); return; }
    if ((el = t.closest("[data-tip]"))) { tipPct = +el.getAttribute("data-tip"); $$("[data-tip]").forEach(b => b.classList.toggle("on", +b.getAttribute("data-tip") === tipPct)); paintTip(); return; }
    if ((el = t.closest("[data-pdiet]"))) { const d = el.getAttribute("data-pdiet"), i = profile.diets.indexOf(d); if (i > -1) profile.diets.splice(i, 1); else profile.diets.push(d); savePrefs(); rerender(); return; }
    if ((el = t.closest("[data-pbudget]"))) { profile.budget = +el.getAttribute("data-pbudget"); wiz.budget = profile.budget || 2; savePrefs(); rerender(); return; }
    if ((el = t.closest("[data-pkids]"))) {
      profile.kids = el.getAttribute("data-pkids") === "1";
      const i = wiz.interests.indexOf("chicos");
      if (profile.kids && i < 0) wiz.interests.push("chicos"); else if (!profile.kids && i > -1) wiz.interests.splice(i, 1);
      savePrefs(); rerender(); return;
    }
    if (t.closest("[data-signout]")) { if (sb) sb.auth.signOut(); return; }
    if (t.closest("[data-wipe]")) {
      if (sb && user && window.confirm("¿Borrar lo que está guardado en tu cuenta? En este dispositivo no se borra nada.")) {
        sb.from("viajes").delete().eq("user_id", user.id).then(r => toast(r.error ? "No se pudo borrar. Probá de nuevo." : "Listo: borramos lo guardado en tu cuenta"));
      }
      return;
    }
    if ((el = t.closest("[data-showmap]"))) { focusId = el.getAttribute("data-showmap"); goExplore({ mode: "mapa" }); return; }
    if (t.closest("[data-clear]")) { resetFilters({ sort: f.sort }); if ($("#q")) $("#q").value = ""; paintFilters(); return; }
    if ((el = t.closest("[data-go]"))) { goExplore(JSON.parse(el.getAttribute("data-go"))); return; }
    if ((el = t.closest("[data-cat]"))) { f.cat = el.getAttribute("data-cat"); f.sub = ""; f.planDay = null; paintFilters(); return; }
    if ((el = t.closest("[data-sub]"))) { const s = el.getAttribute("data-sub"); f.sub = f.sub === s ? "" : s; paintFilters(); return; }
    if ((el = t.closest("[data-price]"))) { const n = +el.getAttribute("data-price"), i = f.prices.indexOf(n); if (i > -1) f.prices.splice(i, 1); else f.prices.push(n); paintFilters(); return; }
    if (t.closest("[data-today]")) { f.today = !f.today; paintFilters(); return; }
    if ((el = t.closest("[data-diet]"))) { const d = el.getAttribute("data-diet"), i = f.diets.indexOf(d); if (i > -1) f.diets.splice(i, 1); else f.diets.push(d); paintFilters(); return; }
    if ((el = t.closest("[data-open]"))) { openPlace(el.getAttribute("data-open")); return; }
  });
  document.addEventListener("keydown", e => {
    if (e.key === "Escape") closeSheet();
    if ((e.key === "Enter" || e.key === " ") && e.target.matches && e.target.matches("article[data-open], div.row[data-open]")) { e.preventDefault(); openPlace(e.target.getAttribute("data-open")); }
  });
  document.addEventListener("submit", e => {
    if (e.target.id === "home-search") { e.preventDefault(); goExplore({ q: e.target.q.value.trim() }); }
    if (e.target.id === "login-form") {
      e.preventDefault();
      if (!sb) { authMsg = "Todavía estamos conectando con el servicio de cuentas. Probá en unos segundos."; rerender(); return; }
      sb.auth.signInWithOtp({ email: e.target.mail.value.trim(), options: { emailRedirectTo: location.href.split("#")[0] } }).then(r => {
        authMsg = r.error ? "No pudimos enviar el enlace: " + r.error.message : "Listo: revisá tu mail y tocá el enlace para entrar.";
        rerender();
      });
    }
    if (e.target.id === "route-form") {
      e.preventDefault();
      const to = e.target.to.value.trim();
      if (to) window.open("https://www.google.com/maps/dir/?api=1&destination=" + encodeURIComponent(to + ", Buenos Aires") + "&travelmode=transit", "_blank", "noopener");
    }
  });
  document.addEventListener("input", e => {
    if (e.target.id === "q") { f.q = e.target.value; f.planDay = null; paintResults(); }
    if (e.target.id === "ci-q") document.getElementById("ci-list").innerHTML = ciLista(e.target.value);
    if (e.target.id === "cv-a") paintConv("a");
    if (e.target.id === "cv-b") paintConv("b");
    if (e.target.id === "tp-total" || e.target.id === "tp-n") paintTip();
  });
  document.addEventListener("change", e => {
    if (e.target.id === "lleg-aloja") {
      const st = llegEstado();
      st.aloja = e.target.value.trim();
      store.set(LLEG_KEY, st);
      rerender();
      return;
    }
    const t = e.target;
    if (t.id === "f-barrio") { f.barrio = t.value; t.classList.toggle("on", !!t.value); paintResults(); }
    if (t.id === "f-sort") {
      if (t.value === "cerca" && !userLL) locate(() => { f.sort = "cerca"; paintResults(); }, () => { t.value = f.sort; });
      else { f.sort = t.value; paintResults(); }
    }
    if (t.id === "cv-cur") { prefs.cur = t.value; savePrefs(); paintConv("a"); }
    if (t.id === "trip-start") { prefs.start = t.value; savePrefs(); rerender(); }
    if (t.matches("[data-check]")) { prefs.checks[t.getAttribute("data-check")] = t.checked; savePrefs(); }
    if (t.matches("select[data-day]")) {
      const item = planOf(t.getAttribute("data-day"));
      if (item) { item.day = +t.value; savePlan(); rerender(); }
    }
  });
  /* Si una foto no carga, se prueba la versión más chica y, si tampoco, queda el ícono de la categoría. */
  document.addEventListener("error", e => {
    const t = e.target;
    if (!t || t.tagName !== "IMG") return;
    if (t.dataset.fb) { const fb = t.dataset.fb; delete t.dataset.fb; t.src = fb; }
    else { const head = t.closest(".sheet-head"); if (head) head.classList.remove("has-photo"); t.remove(); }
  }, true);

  /* ── Inicio ── */
  $("#brand-city").textContent = city.name;
  document.title = "Guía de " + city.name;
  paintBadge();
  sync();
  loadWeather();
  loadFx();
  loadForecast();
  startAccounts();
  /* La guía se actualiza sola: cada vez que se abre o se vuelve a ella, busca si hay una versión nueva;
     si la hay, recarga la página una vez para mostrarla. */
  if ("serviceWorker" in navigator && /^https?:$/.test(location.protocol)) {
    const habia = !!navigator.serviceWorker.controller;
    let recargo = false;
    navigator.serviceWorker.addEventListener("controllerchange", () => {
      if (!habia || recargo) return;
      recargo = true;
      location.reload();
    });
    navigator.serviceWorker.register("sw.js", { updateViaCache: "none" }).then(reg => {
      const buscar = () => reg.update().catch(() => {});
      document.addEventListener("visibilitychange", () => { if (document.visibilityState === "visible") buscar(); });
      setInterval(buscar, 30 * 60 * 1000);
    }).catch(() => {});
  }
})();
