/* Menú 3D · motor común del menú.
   Cada página dice qué menú cargar con <body data-menu="carpeta/menu.json">.
   Las fotos y el logo se buscan en la misma carpeta que el menu.json.
   Con ?borrador en el link se muestra la vista previa guardada desde el panel del local.
   Idiomas: si el menu.json trae "en" (traducción al inglés), aparece el botón EN/ES; si el celular
   del cliente no está en español, arranca en inglés. Lo que no esté traducido se muestra en español. */
(function () {
  'use strict';
  var $ = function (s) { return document.querySelector(s); };
  var FILTROS = ['sin-tacc', 'vegano'];
  var M = null, base = '', cat = null, filtro = null, idioma = 'es', borrador = false;

  /* ---------- textos de la interfaz ---------- */
  var TXT = {
    es: {
      etiquetas: { 'sin-tacc': 'Sin TACC', 'vegano': 'Vegano', 'chef': 'Recom. del Chef' },
      subtitulo: 'Tocá "Ver en 3D" y mirá tu plato sobre la mesa', ver3d: 'Ver en 3D', ver3dDe: 'Ver {x} en 3D', sinStock: 'Sin stock hoy',
      sinPlatos: 'Todavía no hay platos cargados.', ningunoFiltro: 'No hay platos {x} en esta categoría.',
      previa: 'Vista previa: cambios todavía sin publicar', prototipo: 'Prototipo para {x}', categorias: 'Categorías', filtrar: 'Filtrar',
      info: 'Información del local: horarios, dirección y contacto', sobre: 'Sobre nosotros', donde: 'Dónde estamos', llegar: 'Cómo llegar',
      horarios: 'Horarios', hoy: 'hoy', hoyPie: 'Hoy', contacto: 'Contacto', telefono: 'Teléfono', mail: 'Mail', reservas: 'Reservas',
      pagos: 'Medios de pago', servicios: 'Servicios', cerrar: 'Cerrar', muestra: 'Restaurante y datos de muestra, inventados para la demostración.',
      promos: 'Promos', promociones: 'Promociones', promoUna: 'Hoy hay 1 promoción', promoVarias: 'Hoy hay {x} promociones', verPromos: 'Ver', sinPromos: 'En este momento no hay promociones.',
      verFicha: 'Horarios, contacto y más', creditos: 'Créditos de las fotos', horario: 'Horario', otroIdioma: 'EN', otroIdiomaNombre: 'English',
      error: 'No se pudo cargar el menú. Revisá tu conexión y volvé a abrir la página.'
    },
    en: {
      etiquetas: { 'sin-tacc': 'Gluten-free', 'vegano': 'Vegan', 'chef': "Chef's pick" },
      subtitulo: 'Tap "View in 3D" and see your dish on the table', ver3d: 'View in 3D', ver3dDe: 'View {x} in 3D', sinStock: 'Sold out today',
      sinPlatos: 'No dishes yet.', ningunoFiltro: 'No {x} dishes in this category.',
      previa: 'Preview: changes not published yet', prototipo: 'Prototype for {x}', categorias: 'Categories', filtrar: 'Filter',
      info: 'Restaurant info: hours, address and contact', sobre: 'About us', donde: 'Where we are', llegar: 'Directions',
      horarios: 'Opening hours', hoy: 'today', hoyPie: 'Today', contacto: 'Contact', telefono: 'Phone', mail: 'Email', reservas: 'Reservations',
      pagos: 'Payment methods', servicios: 'Amenities', cerrar: 'Close', muestra: 'Sample restaurant and data, made up for this demo.',
      promos: 'Offers', promociones: 'Special offers', promoUna: '1 special offer today', promoVarias: '{x} special offers today', verPromos: 'View', sinPromos: 'No special offers right now.',
      verFicha: 'Hours, contact and more', creditos: 'Photo credits', horario: 'Hours', otroIdioma: 'ES', otroIdiomaNombre: 'Español',
      error: "We couldn't load the menu. Check your connection and open the page again."
    }
  };
  function t(k, x) { var v = (TXT[idioma] || TXT.es)[k]; return x == null ? v : v.replace('{x}', x); }
  function en() { return idioma === 'en' && M.en ? M.en : null; }
  /* textos del local en el idioma elegido (si falta la traducción, queda el español) */
  function nombreCat(c) { var e = en(); return (e && e.categorias && e.categorias[c.id]) || c.nombre; }
  function textoPlato(d) {
    var e = en(), x = e && e.platos && e.platos[d.id];
    return { nombre: (x && x.nombre) || d.nombre, descripcion: (x && x.descripcion) || d.descripcion };
  }
  function infoT() {
    var i = M.info || {}, e = en(), x = (e && e.info) || {}, o = {};
    Object.keys(i).forEach(function (k) { o[k] = i[k]; });
    ['sobre', 'zona', 'reservas', 'pagos', 'servicios'].forEach(function (k) { if (x[k] && x[k].length) o[k] = x[k]; });
    if (x.horarios && i.horarios) o.horarios = i.horarios.map(function (h, n) { var tr = x.horarios[n] || {}; return { dias: tr.dias || h.dias, horas: tr.horas || h.horas, d: h.d }; });
    return o;
  }

  function esc(s) { return String(s == null ? '' : s).replace(/[&<>"']/g, function (c) { return { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]; }); }
  /* rutas de fotos y links: nunca "javascript:" ni nada raro, aunque alguien lo escriba en el menu.json */
  function url(r) {
    r = String(r || '');
    if (/^\s*(javascript|vbscript|data:text)/i.test(r)) return '#';
    return /^(https?:|data:image\/|\/)/.test(r) ? r : base + r;
  }
  function precio(n) { return (M.moneda || '$') + ' ' + Number(n).toLocaleString('es-AR'); }
  function visibles() { return M.platos.filter(function (d) { return !d.oculto; }); }

  /* colores del local: cualquier clave de "claro"/"oscuro" pasa a ser una variable CSS (--acento, --fondo, …) */
  /* ---------- que los colores del local se lean bien ----------
     Si el color de los textos destacados (acento2) casi no se distingue del fondo, se oscurece (o se aclara en modo oscuro)
     lo justo para que se lea. Lo mismo con el texto sobre los botones de color. El local sigue viendo "su" color. */
  function rgb(h) {
    h = String(h || '').replace('#', ''); if (h.length === 3) h = h.replace(/./g, '$&$&');
    return /^[0-9a-f]{6}$/i.test(h) ? [0, 2, 4].map(function (i) { return parseInt(h.substr(i, 2), 16); }) : null;
  }
  function luz(c) { return c.map(function (v) { v /= 255; return v <= 0.03928 ? v / 12.92 : Math.pow((v + 0.055) / 1.055, 2.4); }).reduce(function (a, v, i) { return a + v * [0.2126, 0.7152, 0.0722][i]; }, 0); }
  function contraste(a, b) { var x = luz(a), y = luz(b); return (Math.max(x, y) + 0.05) / (Math.min(x, y) + 0.05); }
  function hex(c) { return '#' + c.map(function (v) { return ('0' + Math.round(v).toString(16)).slice(-2); }).join(''); }
  /* acerca el color al negro (o al blanco) hasta que se lea sobre el fondo */
  function legible(color, fondo, hacia) {
    var c = rgb(color), f = rgb(fondo); if (!c || !f) return null;
    for (var i = 0; i < 20 && contraste(c, f) < 4.5; i++) c = c.map(function (v) { return v + (hacia - v) * 0.12; });
    return hex(c);
  }
  function legibles(o, fondoBase, hacia) {
    if (!o) return '';
    var fondo = o.fondo || fondoBase, r = [];
    var a2 = o.acento2 && rgb(o.acento2) && rgb(fondo) && contraste(rgb(o.acento2), rgb(fondo)) < 4.5 ? legible(o.acento2, fondo, hacia) : null;
    if (a2) r.push('--acento2:' + a2);
    if (o.acento && rgb(o.acento)) { /* texto de los botones de color: blanco o casi negro, el que mejor se lea */
      var bl = contraste(rgb(o.acento), [255, 255, 255]), ne = contraste(rgb(o.acento), [27, 20, 16]);
      r.push('--sobre-acento:' + (bl >= ne ? '#fff' : '#1b1410'));
    }
    return r.join(';');
  }
  function colores(c) {
    if (!c) return;
    function vars(o) { return Object.keys(o || {}).map(function (k) { return '--' + k + ':' + o[k]; }).join(';'); }
    var css = ':root{' + vars(c.claro) + ';' + legibles(c.claro, '#faf6ee', 0) + '}';
    var osc = c.oscuro && (vars(c.oscuro) + ';' + legibles(c.oscuro, '#17120e', 255));
    if (osc) css += '@media (prefers-color-scheme:dark){:root:not([data-theme="light"]){' + osc + '}}:root[data-theme="dark"]{' + osc + '}';
    var st = document.createElement('style'); st.textContent = css; document.head.appendChild(st);
    if (c.claro && c.claro.acento) {
      var tc = document.querySelector('meta[name="theme-color"]');
      if (!tc) { tc = document.createElement('meta'); tc.name = 'theme-color'; document.head.appendChild(tc); }
      tc.content = c.claro.acento;
    }
  }

  /* tipografía de los títulos según la identidad del local */
  var TIPOS = {
    clasica: ['Fraunces', null],
    moderna: ["'DM Sans'", null],
    elegante: ["'Cormorant Garamond'", 'Cormorant+Garamond:wght@600;700'],
    rustica: ["'Bitter'", 'Bitter:wght@600;700']
  };
  function tipografia(tp) {
    var x = TIPOS[tp]; if (!x) return;
    if (x[1]) { var l = document.createElement('link'); l.rel = 'stylesheet'; l.href = 'https://fonts.googleapis.com/css2?family=' + x[1] + '&display=swap'; document.head.appendChild(l); }
    document.documentElement.style.setProperty('--titulos', x[0] + ',Georgia,serif');
  }

  /* ---------- información del local ----------
     "info": { sobre, direccion, zona, horarios: [{ dias, horas, d: [0..6] }], telefono, whatsapp, email, instagram, reservas, pagos: [], servicios: [] }
     (el viejo "horario" de una sola línea sigue funcionando). Con "muestra": true los datos son inventados:
     se muestran, pero teléfonos, mails y redes no son links, para no contactar a nadie real por error. */
  function horarios(i) { return i.horarios && i.horarios.length ? i.horarios : (i.horario ? [{ dias: t('horario'), horas: i.horario }] : []); }
  function hoy(i) { var d = new Date().getDay(); return horarios(i).filter(function (h) { return h.d && h.d.indexOf(d) >= 0; })[0]; }
  function hayInfo() {
    var i = M.info || {};
    return !!(i.sobre || i.direccion || horarios(i).length || i.horarioNota || i.telefono || i.whatsapp || i.email || i.instagram || i.reservas || (i.pagos || []).length || (i.servicios || []).length);
  }
  function enlace(texto, href) { return M.muestra || !href ? esc(texto) : '<a href="' + esc(href) + '" target="_blank" rel="noopener">' + esc(texto) + '</a>'; }
  function ficha() {
    var i = infoT(), h = horarios(i), hy = hoy(i), s = [];
    function bloque(icono, titulo, cuerpo) { s.push('<section><h3><span aria-hidden="true">' + icono + '</span> ' + titulo + '</h3>' + cuerpo + '</section>'); }
    if (i.sobre) bloque('🔥', t('sobre'), '<p>' + esc(i.sobre) + '</p>');
    if (i.direccion) bloque('📍', t('donde'), '<p>' + esc(i.direccion) + (i.zona ? '<br><span class="suave">' + esc(i.zona) + '</span>' : '') + '</p>' +
      (M.muestra ? '' : '<p><a class="btn-sec" href="https://www.google.com/maps/search/?api=1&query=' + encodeURIComponent(i.direccion + ' ' + (i.zona || '')) + '" target="_blank" rel="noopener">' + t('llegar') + '</a></p>'));
    if (h.length || i.horarioNota) bloque('🕒', t('horarios'), (h.length ? '<dl class="horas">' + h.map(function (x) {
      var esHoy = hy && x.d === hy.d && x.dias === hy.dias;
      return '<div' + (esHoy ? ' class="hoy"' : '') + '><dt>' + esc(x.dias) + (esHoy ? ' <em>' + t('hoy') + '</em>' : '') + '</dt><dd>' + esc(x.horas) + '</dd></div>';
    }).join('') + '</dl>' : '') + (i.horarioNota ? '<p class="suave">' + esc(i.horarioNota) + '</p>' : '')); /* la aclaración (ej. la cafetería) va abajo */
    var c = [];
    if (i.telefono) c.push([t('telefono'), enlace(i.telefono, 'tel:' + String(i.telefono).replace(/[^\d+]/g, ''))]);
    if (i.whatsapp) c.push(['WhatsApp', enlace(i.whatsapp, 'https://wa.me/' + String(i.whatsapp).replace(/\D/g, ''))]);
    if (i.email) c.push([t('mail'), enlace(i.email, 'mailto:' + i.email)]);
    if (i.instagram) c.push(['Instagram', enlace(i.instagram, 'https://instagram.com/' + String(i.instagram).replace(/^@/, ''))]);
    if (c.length) bloque('📞', t('contacto'), '<dl class="horas">' + c.map(function (x) { return '<div><dt>' + x[0] + '</dt><dd>' + x[1] + '</dd></div>'; }).join('') + '</dl>');
    if (i.reservas) bloque('📅', t('reservas'), '<p>' + esc(i.reservas) + '</p>');
    if ((i.pagos || []).length) bloque('💳', t('pagos'), '<p class="chips">' + i.pagos.map(function (x) { return '<span>' + esc(x) + '</span>'; }).join('') + '</p>');
    if ((i.servicios || []).length) bloque('✨', t('servicios'), '<p class="chips">' + i.servicios.map(function (x) { return '<span>' + esc(x) + '</span>'; }).join('') + '</p>');
    return '<dialog class="ficha" id="ficha" aria-labelledby="ficha-t"><div class="ficha-cab"><h2 id="ficha-t">' + esc(M.nombre) + '</h2>' +
      '<button class="ficha-x" data-cerrar-ficha aria-label="' + t('cerrar') + '">✕</button></div><div class="ficha-cuerpo">' + s.join('') +
      (M.muestra ? '<p class="muestra">' + t('muestra') + '</p>' : '') + '</div></dialog>';
  }
  /* "Créditos de las fotos": solo mientras quede a la vista alguna foto (o 3D) que no es del local.
     "fotosConCredito" lista esas fotos; las que sube el local tienen otra ruta, así que al reemplazarlas el link desaparece solo. */
  function conCreditos() {
    if (!M.creditos) return false;
    var l = M.fotosConCredito; if (!l) return true;
    return visibles().some(function (d) { return l.indexOf(d.foto) >= 0 || (d.modelo && l.indexOf(d.modelo.textura) >= 0); });
  }
  function infoLocal() {
    var i = infoT(), l = [], hy = hoy(i), h = horarios(i);
    if (i.direccion) l.push('<span>📍 ' + esc(i.direccion) + '</span>');
    if (hy) l.push('<span>🕒 ' + t('hoyPie') + ': ' + esc(hy.horas) + '</span>'); else if (h.length === 1) l.push('<span>🕒 ' + esc(h[0].horas) + '</span>');
    if (hayInfo()) l.push('<button class="ver-ficha" data-abrir-ficha>' + t('verFicha') + '</button>');
    if (conCreditos()) l.push('<a href="' + esc(url(M.creditos)) + '">' + t('creditos') + '</a>');
    return (l.length ? '<footer class="info">' + l.join('') + '</footer>' : '') + (hayInfo() ? ficha() : '');
  }

  function esqueleto() {
    document.title = M.nombre + ' · Menú 3D';
    document.documentElement.lang = idioma;
    var e = en(), hay = FILTROS.filter(function (f) { return visibles().some(function (d) { return (d.etiquetas || []).indexOf(f) >= 0; }); });
    document.body.insertAdjacentHTML('afterbegin',
      '<header>' +
      (borrador ? '<div class="proto borr" role="note">' + t('previa') + '</div>' : '') +
      (M.prototipo ? '<div class="proto" role="note">' + t('prototipo', esc(M.nombre)) + '</div>' : '') +
      '<div class="top">' + (M.logo ? '<img src="' + esc(url(M.logo)) + '" alt="">' : '') +
      '<h1>' + esc(M.nombre) + '<small>' + esc((e && e.subtitulo) || (idioma === 'es' && M.subtitulo) || t('subtitulo')) + '</small></h1>' +
      (M.en ? '<button class="btn-idioma" data-idioma lang="' + (idioma === 'es' ? 'en' : 'es') + '" aria-label="' + t('otroIdiomaNombre') + '">' + t('otroIdioma') + '</button>' : '') +
      (hayInfo() ? '<button class="btn-info" data-abrir-ficha aria-label="' + t('info') + '">' +
        /* la "i" clásica de información: círculo con una i en cursiva (dibujada, no emoji, para que se vea igual en todos los celulares) */
        '<svg viewBox="0 0 20 20" width="20" height="20" aria-hidden="true"><circle cx="10" cy="10" r="9.25" class="i-fondo"/>' +
        '<circle cx="11.1" cy="5.6" r="1.35" class="i-letra"/><path d="M9.4 8.4h2.6l-1.55 6.1c-.12.48.08.7.45.7.35 0 .72-.2 1.05-.5l.3.45c-.68.82-1.55 1.3-2.45 1.3-1.08 0-1.5-.68-1.25-1.7l1.15-4.6h-.9z" class="i-letra"/></svg>Info</button>' : '') + '</div>' +
      '<nav class="tabs" id="tabs" role="tablist" aria-label="' + t('categorias') + '"></nav>' +
      (hay.length ? '<div class="filtros" id="filtros" aria-label="' + t('filtrar') + '">' + hay.map(function (f) {
        return '<button class="fil" aria-pressed="' + (filtro === f) + '" data-fil="' + f + '">' + t('etiquetas')[f] + '</button>';
      }).join('') + '</div>' : '') +
      '</header><main id="list"></main>' + infoLocal());
    $('#tabs').onclick = function (ev) { var b = ev.target.closest('[data-cat]'); if (b) setCat(b.dataset.cat); };
    if ($('#filtros')) $('#filtros').onclick = function (ev) {
      var b = ev.target.closest('[data-fil]'); if (!b) return;
      filtro = filtro === b.dataset.fil ? null : b.dataset.fil;
      [].forEach.call(document.querySelectorAll('.fil'), function (x) { x.setAttribute('aria-pressed', x.dataset.fil === filtro); });
      list();
    };
    $('#list').onclick = function (ev) {
      if (ev.target.closest('[data-ver-promos]')) { setCat(PROMOS); return; }
      if (ev.target.closest('[data-reservar]')) { abrirReserva(); return; }
      var ag = ev.target.closest('[data-agregar]'); if (ag) { cambiarPedido(ag.dataset.agregar, 1); return; }
      var b = ev.target.closest('[data-3d]'); if (b && window.open3D) window.open3D(b.dataset['3d']);
    };
  }
  /* dibuja (o vuelve a dibujar, al cambiar de idioma) todo el menú */
  function pintar() {
    ['header', '#list', 'footer.info', '#ficha'].forEach(function (s) { var x = $(s); if (x) x.remove(); });
    esqueleto(); tabs(); list(); pintarBarra();
  }

  function categorias() {
    return M.categorias.filter(function (c) { return visibles().some(function (d) { return d.categoria === c.id; }); });
  }
  function tabs() {
    $('#tabs').innerHTML = (promos().length ? '<button class="tab promo" role="tab" aria-selected="' + (cat === PROMOS) + '" data-cat="' + PROMOS + '">🏷 ' + t('promos') + '</button>' : '') + categorias().map(function (c) {
      return '<button class="tab" role="tab" aria-selected="' + (c.id === cat) + '" data-cat="' + esc(c.id) + '">' + esc(nombreCat(c)) + '</button>';
    }).join('');
  }

  /* ---------- promociones ----------
     "promociones": [{ id, titulo, descripcion, precio, precioAntes, etiqueta, dias: [0..6], horaDesde, horaHasta, desde, hasta, platos: [ids], foto, oculta, vigencia }].
     Se muestran solo el día que valen. Las que tienen horario aparecen desde temprano, con su horario a la vista, y se van cuando termina.
     Un horario que cruza la medianoche (20 a 1 h) sigue siendo del día en que empezó. */
  var PROMOS = '__promos';
  function minutos(h) { var p = /^(\d{1,2}):(\d{2})$/.exec(h || ''); return p ? +p[1] * 60 + +p[2] : null; }
  function isoDe(d) { return d.getFullYear() + '-' + ('0' + (d.getMonth() + 1)).slice(-2) + '-' + ('0' + d.getDate()).slice(-2); }
  function promoVale(p, ahora) {
    if (p.oculta) return false;
    var a = minutos(p.horaDesde), b = minutos(p.horaHasta), min = ahora.getHours() * 60 + ahora.getMinutes(), dia = ahora;
    var cruza = a != null && b != null && b <= a;
    if (cruza && min < b) dia = new Date(ahora.getFullYear(), ahora.getMonth(), ahora.getDate() - 1); /* madrugada: sigue el turno de ayer */
    else if (!cruza && b != null && min >= b) return false; /* ya terminó por hoy */
    var f = isoDe(dia), dias = p.dias || [];
    if ((p.desde && f < p.desde) || (p.hasta && f > p.hasta)) return false;
    return !dias.length || dias.indexOf(dia.getDay()) >= 0;
  }
  function promos() { var ahora = new Date(); return (M.promociones || []).filter(function (p) { return promoVale(p, ahora); }); }
  function textoPromo(p) {
    var e = en(), x = (e && e.promociones && e.promociones[p.id]) || {};
    return { titulo: x.titulo || p.titulo, descripcion: x.descripcion || p.descripcion, vigencia: x.vigencia || p.vigencia };
  }
  function platosDe(p) {
    return (p.platos || []).map(function (id) { return visibles().filter(function (d) { return d.id === id; })[0]; }).filter(Boolean);
  }
  function tarjetaPromo(p) {
    var x = textoPromo(p), ps = platosDe(p), sinStock = ps.some(function (d) { return d.agotado; });
    var conFoto = ps.filter(function (d) { return d.foto; })[0], foto = p.foto || (conFoto && conFoto.foto);
    var con3d = ps.filter(function (d) { return d.modelo; });
    return '<article class="card' + (sinStock ? ' agotado' : '') + '"><div class="ph">' +
      (foto ? '<img src="' + esc(url(foto)) + '" alt="' + esc(x.titulo) + '" loading="lazy">' : '<span aria-hidden="true">🏷</span>') +
      (p.etiqueta ? '<span class="promo-sello">' + esc(p.etiqueta) + '</span>' : '') +
      (sinStock ? '<span class="sin">' + t('sinStock') + '</span>' : '') +
      '</div><div class="bd"><h3>' + esc(x.titulo) + '</h3>' + (x.descripcion ? '<p>' + esc(x.descripcion) + '</p>' : '') +
      (x.vigencia ? '<p class="promo-vig">🕒 ' + esc(x.vigencia) + '</p>' : '') +
      (p.precio ? '<div class="ft"><span><b>' + precio(p.precio) + '</b>' + (p.precioAntes ? '<s class="antes">' + precio(p.precioAntes) + '</s>' : '') + '</span>' + (sinStock ? '' : botonAgregar('x' + p.id, x.titulo)) + '</div>' : '') +
      (con3d.length ? '<div class="promo-3d">' + con3d.map(function (d) {
        var n = textoPlato(d).nombre;
        return '<button class="btn-sec" data-3d="' + esc(d.id) + '">' + esc(t('ver3dDe', n)) + '</button>';
      }).join('') + '</div>' : '') + '</div></article>';
  }
  function listaPromos() {
    var l = promos();
    $('#list').innerHTML = botonReservar() + '<h2>' + t('promociones') + '</h2>' + (l.length ? l.map(tarjetaPromo).join('') : '<p class="aviso">' + t('sinPromos') + '</p>');
  }
  function botonReservar() { return puedeReservar() ? '<button class="reservar" data-reservar>📅 ' + ta('reservar') + '</button>' : ''; }
  function avisoPromos() {
    var n = promos().length, primera = categorias()[0];
    if (!n || !primera || primera.id !== cat) return '';
    return '<button class="promo-aviso" data-ver-promos><span>🏷 ' + esc(n === 1 ? t('promoUna') : t('promoVarias', n)) + '</span><span aria-hidden="true">' + t('verPromos') + ' →</span></button>';
  }
  function setCat(c) { cat = c; tabs(); list(); scrollTo({ top: 0, behavior: 'smooth' }); }

  function etiqueta(tg) {
    var nombre = t('etiquetas')[tg] || tg, clase = { 'sin-tacc': 's', 'vegano': 'v' }[tg] || '';
    return '<span class="tag ' + clase + '">' + esc(nombre) + '</span>';
  }
  function list() {
    var fl = $('#filtros'); if (fl) fl.style.display = cat === PROMOS ? 'none' : ''; /* los filtros son de los platos */
    if (cat === PROMOS) { listaPromos(); return; }
    var C = M.categorias.filter(function (c) { return c.id === cat; })[0];
    if (!C) { $('#list').innerHTML = '<p class="aviso">' + t('sinPlatos') + '</p>'; return; }
    var ps = visibles().filter(function (d) { return d.categoria === cat && (!filtro || (d.etiquetas || []).indexOf(filtro) >= 0); });
    $('#list').innerHTML = botonReservar() + avisoPromos() + '<h2>' + esc(nombreCat(C)) + '</h2>' + (ps.length ? '' : '<p class="aviso">' + esc(t('ningunoFiltro', t('etiquetas')[filtro])) + '</p>') + ps.map(function (d) {
      var x = textoPlato(d);
      return '<article class="card' + (d.agotado ? ' agotado' : '') + '" id="plato-' + esc(d.id) + '"><div class="ph"' + (C.fondo ? ' style="background:' + esc(C.fondo) + '"' : '') + '>' +
        (d.foto ? '<img src="' + esc(url(d.foto)) + '" alt="' + esc(x.nombre) + '" loading="lazy">' : '<span aria-hidden="true">' + esc(d.emoji || '🍽') + '</span>') +
        (d.agotado ? '<span class="sin">' + t('sinStock') + '</span>' : '') +
        '</div><div class="bd"><div class="tg">' + (d.etiquetas || []).map(etiqueta).join('') + '</div>' +
        '<h3>' + esc(x.nombre) + '</h3><p>' + esc(x.descripcion) + '</p><div class="ft"><b>' + precio(d.precio) + '</b>' +
        '<span class="ft-botones">' + (d.modelo ? '<button class="btn" data-3d="' + esc(d.id) + '" aria-label="' + esc(t('ver3dDe', x.nombre)) + '">' + t('ver3d') + '</button>' : '') + (d.agotado ? '' : botonAgregar('p' + d.id, x.nombre)) + '</span>' +
        '</div></div></article>';
    }).join('');
  }

  /* ---------- reservas y pedidos por WhatsApp ----------
     "atencion": { reservas, pedidos, retiro, delivery, whatsapp } (lo elige el local en su panel; si no hay whatsapp, se usa el de info).
     El link del QR de las mesas lleva ?mesa: ahí no se ofrece reservar y el pedido es una lista para mostrarle al mozo.
     No se guarda nada del cliente: el mensaje se escribe acá y sale desde su propio WhatsApp al del local.
     Con "muestra": true (locales inventados) no se abre WhatsApp: se muestra el mensaje que le llegaría al local. */
  var TXT_AT = {
    es: {
      reservar: 'Reservar mesa', agregar: 'Agregar {x} al pedido', verPedido: 'Ver pedido', tuPedido: 'Tu pedido', tuLista: 'Tu lista', total: 'Total', vacio: 'Tu pedido está vacío.', vaciar: 'Vaciar',
      mozo: 'Mostrale esta lista al mozo para hacer tu pedido.', como: 'Cómo lo querés', retiro: 'Retiro en el local', delivery: 'Delivery', nombre: 'Tu nombre', direccion: 'Dirección de entrega', aclaracion: 'Aclaración (opcional)',
      enviar: 'Enviar por WhatsApp', pagoAparte: 'El pago se arregla con el local.', quitar: 'Quitar uno', sumar: 'Sumar uno', falta: 'Completá los datos que faltan.',
      dia: 'Día', hora: 'Hora', personas: 'Personas', cerradoDia: 'Ese día el local no abre o ya no quedan horarios.', confirman: 'El local te confirma por WhatsApp. La reserva queda hecha cuando te responden.',
      demo: 'Este restaurante es un ejemplo, así que no se envía nada. Esto es lo que le llegaría al local por WhatsApp:', listo: 'Listo'
    },
    en: {
      reservar: 'Book a table', agregar: 'Add {x} to your order', verPedido: 'View order', tuPedido: 'Your order', tuLista: 'Your list', total: 'Total', vacio: 'Your order is empty.', vaciar: 'Clear',
      mozo: 'Show this list to your waiter to place your order.', como: 'How do you want it', retiro: 'Pick up', delivery: 'Delivery', nombre: 'Your name', direccion: 'Delivery address', aclaracion: 'Notes (optional)',
      enviar: 'Send by WhatsApp', pagoAparte: 'You pay the restaurant directly.', quitar: 'Remove one', sumar: 'Add one', falta: 'Please fill in the missing details.',
      dia: 'Date', hora: 'Time', personas: 'People', cerradoDia: 'The restaurant is closed that day or there are no times left.', confirman: 'The restaurant will confirm by WhatsApp. Your booking is set once they reply.',
      demo: 'This restaurant is a sample, so nothing is sent. This is what the restaurant would receive on WhatsApp:', listo: 'Done'
    }
  };
  function ta(k, x) { var v = (TXT_AT[idioma] || TXT_AT.es)[k]; return x == null ? v : v.replace('{x}', x); }
  var enMesa = /[?&]mesa\b/.test(location.search), pedido = {};
  function at() { return M.atencion || {}; }
  function numeroLocal() {
    var n = String(at().whatsapp || (M.info || {}).whatsapp || '').replace(/\D/g, '').replace(/^0/, '');
    return !n ? '' : /^54/.test(n) ? n : '549' + n;
  }
  function incluido() { return !(M.incluye && M.incluye.pedidos === false); }
  function hayContacto() { return !!(M.muestra || numeroLocal()); }
  function puedeReservar() { return incluido() && !!at().reservas && !enMesa && hayContacto(); }
  function puedePedir() { return incluido() && !!at().pedidos && (enMesa || (!!(at().retiro || at().delivery) && hayContacto())); }
  function clavePedido() { return 'menu3d-pedido:' + src; }
  function cargarPedido() { try { pedido = JSON.parse(sessionStorage.getItem(clavePedido())) || {}; } catch (e) { pedido = {}; } }
  function guardarPedido() { try { sessionStorage.setItem(clavePedido(), JSON.stringify(pedido)); } catch (e) {} }
  /* "p3" es el plato 3 y "x2" la promoción 2 */
  function itemDe(k) {
    var id = k.slice(1), promo = k.charAt(0) === 'x', l = promo ? M.promociones || [] : visibles();
    var d = l.filter(function (x) { return String(x.id) === id; })[0]; if (!d) return null;
    return { clave: k, base: promo ? d.titulo : d.nombre, nombre: promo ? textoPromo(d).titulo : textoPlato(d).nombre, precio: Number(d.precio) || 0 };
  }
  function itemsPedido() { return Object.keys(pedido).map(function (k) { var i = itemDe(k); if (i) i.n = pedido[k]; return i; }).filter(Boolean); }
  function totalPedido(l) { return l.reduce(function (a, i) { return a + i.precio * i.n; }, 0); }
  function botonAgregar(k, nombre) {
    if (!puedePedir()) return '';
    return '<button class="btn-mas' + (pedido[k] ? ' con' : '') + '" data-agregar="' + esc(k) + '" aria-label="' + esc(ta('agregar', nombre)) + '">' + (pedido[k] || '+') + '</button>';
  }
  function pintarBarra() {
    var b = $('#pedido-barra'), l = itemsPedido(), n = l.reduce(function (a, i) { return a + i.n; }, 0);
    if (b) b.remove();
    document.body.classList.toggle('con-pedido', !!n);
    [].forEach.call(document.querySelectorAll('[data-agregar]'), function (x) { var c = pedido[x.dataset.agregar]; x.textContent = c || '+'; x.classList.toggle('con', !!c); });
    if (!n) return;
    document.body.insertAdjacentHTML('beforeend', '<button class="pedido-barra" id="pedido-barra"><span>🧾 ' + ta('verPedido') + ' · ' + n + '</span><b>' + precio(totalPedido(l)) + '</b></button>');
    $('#pedido-barra').onclick = abrirPedido;
  }
  function cambiarPedido(k, d) {
    pedido[k] = (pedido[k] || 0) + d; if (pedido[k] <= 0) delete pedido[k];
    guardarPedido(); pintarBarra();
  }
  /* ventana de abajo, con el mismo aspecto que la ficha del local */
  function hoja(titulo, cuerpo) {
    var v = $('#hoja'); if (v) v.remove();
    document.body.insertAdjacentHTML('beforeend', '<dialog class="ficha" id="hoja" aria-labelledby="hoja-t"><div class="ficha-cab"><h2 id="hoja-t">' + esc(titulo) + '</h2>' +
      '<button class="ficha-x" data-cerrar-hoja aria-label="' + t('cerrar') + '">✕</button></div><div class="ficha-cuerpo hoja-cuerpo">' + cuerpo + '</div></dialog>');
    var d = $('#hoja');
    d.addEventListener('click', function (e) { if (e.target === d || e.target.closest('[data-cerrar-hoja]')) d.close(); });
    d.addEventListener('close', function () { d.remove(); });
    d.showModal(); return d;
  }
  function salir(d, tipo, texto, alEnviar) {
    if (M.muestra) { /* restaurante inventado: su número no es real */
      d.querySelector('.hoja-cuerpo').innerHTML = '<p>' + ta('demo') + '</p><pre class="hoja-mensaje"></pre><button type="button" class="btn" data-cerrar-hoja>' + ta('listo') + '</button>';
      d.querySelector('pre').textContent = texto; return;
    }
    window.open('https://wa.me/' + numeroLocal() + '?text=' + encodeURIComponent(texto), '_blank', 'noopener');
    contar(tipo); if (alEnviar) alEnviar(); d.close();
  }
  function abrirPedido() {
    var l = itemsPedido();
    var filas = l.map(function (i) {
      return '<div class="hoja-item"><span>' + esc(i.nombre) + (i.precio ? '<small>' + precio(i.precio * i.n) + '</small>' : '') + '</span><span class="hoja-cant">' +
        '<button type="button" data-cant="-1" data-k="' + esc(i.clave) + '" aria-label="' + ta('quitar') + '">−</button><b>' + i.n + '</b><button type="button" data-cant="1" data-k="' + esc(i.clave) + '" aria-label="' + ta('sumar') + '">+</button></span></div>';
    }).join('');
    var opciones = [at().retiro && 'retiro', at().delivery && 'delivery'].filter(Boolean);
    var form = enMesa ? '<p class="suave">' + ta('mozo') + '</p><button type="button" class="btn-sec" data-vaciar>' + ta('vaciar') + '</button>' :
      '<form class="hoja-form" novalidate>' +
      (opciones.length > 1 ? '<fieldset><legend>' + ta('como') + '</legend>' + opciones.map(function (o, n) { return '<label><input type="radio" name="como" value="' + o + '"' + (n ? '' : ' checked') + '> ' + ta(o) + '</label>'; }).join('') + '</fieldset>' : '<input type="hidden" name="como" value="' + opciones[0] + '"><p class="suave">' + ta(opciones[0]) + '</p>') +
      '<label>' + ta('nombre') + '<input type="text" name="nombre" maxlength="60" autocomplete="name"></label>' +
      '<label data-dir' + (opciones[0] === 'delivery' ? '' : ' hidden') + '>' + ta('direccion') + '<input type="text" name="direccion" maxlength="120" autocomplete="street-address"></label>' +
      '<label>' + ta('aclaracion') + '<input type="text" name="nota" maxlength="140"></label><p class="hoja-error" role="alert"></p>' +
      '<button class="btn">' + ta('enviar') + '</button><p class="suave">' + ta('pagoAparte') + '</p></form>';
    var d = hoja(enMesa ? ta('tuLista') : ta('tuPedido'), filas + '<div class="hoja-total"><span>' + ta('total') + '</span><b>' + precio(totalPedido(l)) + '</b></div>' + form);
    d.addEventListener('click', function (e) {
      var b = e.target.closest('[data-cant]');
      if (b) { cambiarPedido(b.dataset.k, +b.dataset.cant); d.close(); if (itemsPedido().length) abrirPedido(); return; }
      if (e.target.closest('[data-vaciar]')) { pedido = {}; guardarPedido(); pintarBarra(); d.close(); }
    });
    var f = d.querySelector('form'); if (!f) return;
    f.addEventListener('change', function () { d.querySelector('[data-dir]').hidden = f.como.value !== 'delivery'; });
    f.onsubmit = function (e) {
      e.preventDefault();
      var delivery = f.como.value === 'delivery', nom = f.nombre.value.trim(), dir = f.direccion.value.trim(), nota = f.nota.value.trim();
      if (!nom || (delivery && !dir)) { d.querySelector('.hoja-error').textContent = ta('falta'); return; }
      var txt = ['Hola, quiero hacer un pedido para ' + (delivery ? 'delivery' : 'retirar') + ' en ' + M.nombre + ':', ''].concat(itemsPedido().map(function (i) {
        return '• ' + i.n + ' x ' + i.base + (i.precio ? ' (' + precio(i.precio * i.n) + ')' : '');
      }), ['', 'Total: ' + precio(totalPedido(itemsPedido())), 'Nombre: ' + nom]);
      if (delivery) txt.push('Dirección: ' + dir);
      if (nota) txt.push('Aclaración: ' + nota);
      salir(d, 'pedido', txt.join('\n'), function () { pedido = {}; guardarPedido(); pintarBarra(); });
    };
  }
  /* horarios para reservar ese día: cada media hora, hasta una hora antes de cerrar. null = el local no cargó ese día */
  function horasDe(iso) {
    var s = (M.info || {}).semana, p = iso.split('-'), f = new Date(+p[0], +p[1] - 1, +p[2]), x = s && s.length === 7 && s[f.getDay()];
    if (!x || !x.m) return null;
    if (x.m === 'cerrado') return [];
    var ahora = new Date(), hoy = isoDe(ahora) === iso, min = ahora.getHours() * 60 + ahora.getMinutes() + 30, l = [];
    [[x.a1, x.c1]].concat(x.m === 'cortado' ? [[x.a2, x.c2]] : []).forEach(function (tu) {
      var a = minutos(tu[0]), c = minutos(tu[1]); if (a == null || c == null) return;
      if (c <= a) c += 1440;
      for (var h = a; h <= c - 60; h += 30) if (!hoy || h >= min) l.push(('0' + Math.floor(h / 60) % 24).slice(-2).replace(/^(\d)$/, '0$1') + ':' + ('0' + h % 60).slice(-2));
    });
    return l;
  }
  function abrirReserva() {
    var hoy = new Date(), hasta = new Date(hoy.getFullYear(), hoy.getMonth(), hoy.getDate() + 60), personas = '';
    for (var i = 1; i <= 12; i++) personas += '<option' + (i === 2 ? ' selected' : '') + '>' + i + '</option>';
    var d = hoja(ta('reservar'), '<form class="hoja-form" novalidate><div class="hoja-dos"><label>' + ta('dia') + '<input type="date" name="dia" min="' + isoDe(hoy) + '" max="' + isoDe(hasta) + '" value="' + isoDe(hoy) + '"></label>' +
      '<label>' + ta('personas') + '<select name="personas">' + personas + '</select></label></div><div data-horas></div>' +
      '<label>' + ta('nombre') + '<input type="text" name="nombre" maxlength="60" autocomplete="name"></label>' +
      '<label>' + ta('aclaracion') + '<input type="text" name="nota" maxlength="140"></label><p class="hoja-error" role="alert"></p>' +
      '<button class="btn">' + ta('enviar') + '</button><p class="suave">' + ta('confirman') + '</p></form>');
    var f = d.querySelector('form'), caja = d.querySelector('[data-horas]');
    function horas() {
      var l = f.dia.value ? horasDe(f.dia.value) : null;
      caja.innerHTML = l && !l.length ? '<p class="suave">' + ta('cerradoDia') + '</p>' : '<label>' + ta('hora') + (l ? '<select name="hora">' + l.map(function (h) { return '<option>' + h + '</option>'; }).join('') + '</select>' : '<input type="time" name="hora" step="900">') + '</label>';
    }
    horas(); f.dia.addEventListener('change', horas);
    f.onsubmit = function (e) {
      e.preventDefault();
      var nom = f.nombre.value.trim(), nota = f.nota.value.trim(), hora = f.hora && f.hora.value, dia = f.dia.value, n = Number(f.personas.value);
      if (!nom || !hora || !dia) { d.querySelector('.hoja-error').textContent = ta('falta'); return; }
      var p = dia.split('-'), fecha = new Date(+p[0], +p[1] - 1, +p[2]).toLocaleDateString('es-AR', { weekday: 'long', day: 'numeric', month: 'long' });
      var txt = ['Hola, quiero reservar una mesa en ' + M.nombre + ':', '', 'Día: ' + fecha, 'Hora: ' + hora + ' h', 'Personas: ' + n, 'A nombre de: ' + nom];
      if (nota) txt.push('Aclaración: ' + nota);
      salir(d, 'reserva', txt.join('\n'));
    };
  }

  function error(tx) {
    document.body.insertAdjacentHTML('afterbegin', '<main><p class="aviso">' + esc(tx) + '</p></main>');
  }

  function mostrar(m, esBorrador) {
    /* lo que el plan del local no incluye no se muestra (los datos quedan guardados por si cambia de plan) */
    if (m.incluye) { if (m.incluye.ingles === false) delete m.en; if (m.incluye.mascota === false) delete m.mascota; }
    M = window.MENU = m; m.base = base; borrador = esBorrador;
    /* idioma: el que eligió antes en este celular; si no, inglés cuando el celular no está en español */
    var guardado = null; try { guardado = localStorage.getItem('menu3d-idioma'); } catch (e) {}
    idioma = m.en ? (guardado || (/^es\b/i.test(navigator.language || 'es') ? 'es' : 'en')) : 'es';
    window.idiomaMenu = idioma;
    colores(m.colores); tipografia(m.tipografia);
    cargarPedido();
    cat = categorias()[0] ? categorias()[0].id : (promos().length ? PROMOS : undefined);
    pintar();
    document.addEventListener('click', function (ev) {
      var f = $('#ficha');
      if (ev.target.closest('[data-idioma]')) { cambiarIdioma(idioma === 'es' ? 'en' : 'es'); return; }
      if (!f) return;
      if (ev.target.closest('[data-abrir-ficha]')) f.showModal();
      else if (ev.target.closest('[data-cerrar-ficha]') || ev.target === f) f.close(); /* tocar afuera también la cierra */
    });
    /* con el menú ya visible, se baja el visor 3D de antemano para que "Ver en 3D" abra al instante */
    if (visibles().some(function (d) { return d.modelo; })) setTimeout(function () { if (window.precargar3D) window.precargar3D(); }, 2500);
    document.dispatchEvent(new CustomEvent('menu-listo')); /* avisa a los agregados (ej. la mascota) */
    contar('menu');
  }
  /* ---------- estadísticas ----------
     Anota en Supabase que se abrió el menú o se miró un plato en 3D / AR. Solo se guarda el local, el plato,
     el tipo y el idioma: nada de quién mira. No cuenta la vista previa, las pruebas en la compu ni los
     navegadores donde alguien inició sesión en un panel (para que el local no se cuente a sí mismo). */
  var SB = 'https://nudadncqyagovqzdkbuq.supabase.co', SB_CLAVE = 'sb_publishable_TE00ghT-FzqJTFkT5WwXKA_N_943Wz6';
  function contar(tipo, plato) {
    if (borrador || /^(localhost|127\.0\.0\.1|\[::1\])$/.test(location.hostname)) return;
    try { if (localStorage.getItem('menu3d-no-contar')) return; } catch (e) {}
    var partes = new URL(src, location.href).pathname.split('/'), carpeta = partes[partes.length - 2] || '';
    if (!/^[a-z0-9][a-z0-9-]{0,59}$/.test(carpeta) || carpeta === 'plantilla') return;
    if (tipo === 'menu') { /* una vez por visita (recargar la página no suma) */
      try { if (sessionStorage.getItem('menu3d-contado:' + carpeta)) return; sessionStorage.setItem('menu3d-contado:' + carpeta, '1'); } catch (e) {}
    }
    try {
      fetch(SB + '/rest/v1/vistas', {
        method: 'POST', keepalive: true,
        headers: { apikey: SB_CLAVE, 'Content-Type': 'application/json', Prefer: 'return=minimal' },
        body: JSON.stringify({ carpeta: carpeta, tipo: tipo, plato: plato == null ? null : String(plato).slice(0, 20), idioma: idioma })
      }).catch(function () {});
    } catch (e) {}
  }
  window.contarVista = contar;

  function cambiarIdioma(nuevo) {
    idioma = window.idiomaMenu = nuevo;
    try { localStorage.setItem('menu3d-idioma', nuevo); } catch (e) {}
    var y = scrollY; pintar(); scrollTo(0, y);
    document.dispatchEvent(new CustomEvent('menu-idioma'));
  }
  /* para el visor 3D y la mascota: nombre y descripción del plato en el idioma elegido */
  window.textoPlato = function (d) { return M ? textoPlato(d) : d; };

  /* lleva a un plato: abre su categoría, saca el filtro, lo muestra y lo resalta un momento */
  window.irAPlato = function (id) {
    var p = M.platos.filter(function (x) { return String(x.id) === String(id); })[0]; if (!p) return;
    cat = p.categoria; filtro = null;
    [].forEach.call(document.querySelectorAll('.fil'), function (x) { x.setAttribute('aria-pressed', 'false'); });
    tabs(); list();
    var tb = document.querySelector('.tab[aria-selected=true]'); if (tb) tb.scrollIntoView({ inline: 'center', block: 'nearest' });
    var c = document.getElementById('plato-' + p.id); if (!c) return;
    c.scrollIntoView({ behavior: 'smooth', block: 'center' });
    c.classList.add('destacado'); setTimeout(function () { c.classList.remove('destacado'); }, 2200);
  };

  var src = document.body.getAttribute('data-menu') || 'menu.json', yo = document.currentScript && document.currentScript.src;
  base = src.replace(/[^/]*$/, '');
  function publicado() {
    fetch(src, { cache: 'no-cache' })
      .then(function (r) { if (!r.ok) throw new Error(r.status); return r.json(); })
      .then(function (m) { mostrar(m, false); })
      .catch(function (e) {
        if (window.console) console.error(e);
        error(/^es\b/i.test(navigator.language || 'es') ? TXT.es.error : TXT.en.error);
      });
  }
  /* vista previa: el borrador lo guardó el panel con almacen.js, que se carga solo en este caso */
  if (/[?&]borrador\b/.test(location.search) && yo) {
    var s = document.createElement('script'); s.src = yo.replace(/menu\.js(\?.*)?$/, 'almacen.js');
    s.onload = function () {
      Almacen.leer('menu3d-borrador:' + new URL(src, location.href).href).then(function (b) {
        var d = b && JSON.parse(b); if (d && d.menu) d = d.menu;
        if (d) mostrar(d, true); else publicado();
      }).catch(publicado);
    };
    s.onerror = publicado;
    document.head.appendChild(s);
  } else publicado();
})();
