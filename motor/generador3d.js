/* Menú 3D · generador de modelos 3D a partir de fotos reales del plato.
   Corre entero en el navegador, sin servidor y sin costo. Acepta de 1 a 5 fotos:
   - Foto de arriba (obligatoria): se encuadra el plato con una elipse (si está sacada en ángulo, la elipse la "endereza").
     Una IA de profundidad (Depth Anything V2, vía transformers.js) estima qué tan cerca está cada punto;
     se le resta el plano del plato y queda la forma de la comida: eso es el relieve.
   - Fotos de costado (opcionales): se marca el plato de borde a borde y la comida de la base a lo más alto.
     Con eso se mide la altura real de la comida respecto del ancho del plato (si no hay, se elige a mano).
   El resultado se guarda como { tipo: "foto", textura, relieve, altura } y lo dibuja relieve.js.
   Necesita cargar-three.js y relieve.js. */
(function () {
  'use strict';
  var TRANSFORMERS = 'https://cdn.jsdelivr.net/npm/@huggingface/transformers@3.0.2';
  var MODELO = 'onnx-community/depth-anything-v2-small';
  var LADO = 518, GRILLA = 128, MAX_FOTOS = 5, estimador = null;

  function preparar(aviso) {
    if (!estimador) estimador = import(TRANSFORMERS).then(function (T) {
      var bajado = {};
      return T.pipeline('depth-estimation', MODELO, {
        progress_callback: function (p) {
          if (p.status === 'progress' && p.total) {
            bajado[p.file] = [p.loaded, p.total];
            var l = 0, t = 0; Object.keys(bajado).forEach(function (k) { l += bajado[k][0]; t += bajado[k][1]; });
            aviso('Bajando el generador (solo la primera vez): ' + Math.round(l / t * 100) + '%');
          }
        }
      });
    }).catch(function (e) { estimador = null; throw e; });
    return estimador;
  }

  /* recorta la elipse elegida y la estira a un cuadrado: así un plato fotografiado en ángulo queda redondo */
  function recorte(img, e, lado, calidad) {
    var c = document.createElement('canvas'); c.width = c.height = lado;
    c.getContext('2d').drawImage(img, e.cx - e.rx, e.cy - e.ry, e.rx * 2, e.ry * 2, 0, 0, lado, lado);
    return calidad ? c.toDataURL('image/jpeg', calidad) : c;
  }

  function generar(img, e, aviso) {
    aviso = aviso || function () {};
    return preparar(aviso).then(function (est) {
      aviso('Analizando la foto…');
      return est(recorte(img, e, LADO).toDataURL('image/jpeg', .92));
    }).then(function (out) {
      var D = out.depth, N = GRILLA, d = new Float32Array(N * N), dentro = new Uint8Array(N * N);
      for (var y = 0; y < N; y++) for (var x = 0; x < N; x++) {
        var u = (x + .5) / N, v = (y + .5) / N, dx = u * 2 - 1, dy = v * 2 - 1;
        d[y * N + x] = D.data[(Math.floor(v * D.height) * D.width + Math.floor(u * D.width)) * D.channels] / 255;
        dentro[y * N + x] = dx * dx + dy * dy <= 1 ? 1 : 0;
      }
      /* plano del plato: se ajusta con los puntos del anillo exterior (mínimos cuadrados) y después se repite
         dejando afuera los puntos que no son plato (comida que llega al borde, mantel, sombras): así el borde
         no "se levanta" en las fotos sacadas en ángulo */
      function ajustar(usar) {
        var S = [0, 0, 0, 0, 0, 0, 0, 0, 0], B = [0, 0, 0];
        for (var i = 0; i < N * N; i++) {
          if (!usar(i)) continue;
          var f = [(i % N + .5) / N * 2 - 1, (Math.floor(i / N) + .5) / N * 2 - 1, 1];
          for (var a = 0; a < 3; a++) { B[a] += f[a] * d[i]; for (var b = 0; b < 3; b++) S[a * 3 + b] += f[a] * f[b]; }
        }
        return resolver(S, B);
      }
      function radio(i) { var x = (i % N + .5) / N * 2 - 1, y = (Math.floor(i / N) + .5) / N * 2 - 1; return Math.sqrt(x * x + y * y); }
      function plano(p, i) { return p[0] * ((i % N + .5) / N * 2 - 1) + p[1] * ((Math.floor(i / N) + .5) / N * 2 - 1) + p[2]; }
      var anillo = function (i) { var r = radio(i); return r >= .72 && r <= .95; };
      var p = ajustar(anillo);
      for (var vuelta = 0; vuelta < 2; vuelta++) {
        var res = [];
        for (var i2 = 0; i2 < N * N; i2++) if (anillo(i2)) res.push(Math.abs(d[i2] - plano(p, i2)));
        res.sort(function (m, n) { return m - n; });
        var corte = res[Math.floor(res.length * .6)] || 0, pPrev = p;
        p = ajustar(function (i) { return anillo(i) && Math.abs(d[i] - plano(pPrev, i)) <= corte; });
      }
      var h = new Float32Array(N * N), lista = [];
      for (var k = 0; k < N * N; k++) {
        var r = radio(k);
        /* cerca del borde la altura baja suave hasta cero: el borde de un plato siempre está apoyado */
        var borde = r < .82 ? 1 : r > .97 ? 0 : (.97 - r) / .15;
        h[k] = dentro[k] ? Math.max(0, d[k] - plano(p, k)) * borde * borde * (3 - 2 * borde) : 0;
        if (dentro[k]) lista.push(h[k]);
      }
      /* se suaviza un poco y se normaliza con el percentil 99 (para que un punto suelto no aplaste todo) */
      h = suavizar(suavizar(h, N), N);
      lista.sort(function (m, n) { return m - n; });
      var tope = Math.max(.02, lista[Math.floor(lista.length * .99)] || .02);
      var c = document.createElement('canvas'); c.width = c.height = N;
      var g = c.getContext('2d'), im = g.createImageData(N, N);
      for (var q = 0; q < N * N; q++) {
        var val = Math.round(Math.min(1, h[q] / tope) * 255);
        im.data[q * 4] = im.data[q * 4 + 1] = im.data[q * 4 + 2] = val; im.data[q * 4 + 3] = 255;
      }
      g.putImageData(im, 0, 0);
      return { tipo: 'foto', textura: recorte(img, e, Math.max(768, Math.min(1536, Math.round(Math.max(e.rx, e.ry) * 2))), .85), relieve: c.toDataURL('image/png'), altura: .3 };
    });
  }
  function resolver(S, B) { /* sistema 3x3 por Cramer */
    function det(m) { return m[0] * (m[4] * m[8] - m[5] * m[7]) - m[1] * (m[3] * m[8] - m[5] * m[6]) + m[2] * (m[3] * m[7] - m[4] * m[6]); }
    var D = det(S); if (Math.abs(D) < 1e-9) return [0, 0, 0];
    return [0, 1, 2].map(function (c) { var m = S.slice(); for (var r = 0; r < 3; r++) m[r * 3 + c] = B[r]; return det(m) / D; });
  }
  function suavizar(h, N) {
    var o = new Float32Array(N * N);
    for (var y = 0; y < N; y++) for (var x = 0; x < N; x++) {
      var s = 0, n = 0;
      for (var dy = -1; dy <= 1; dy++) for (var dx = -1; dx <= 1; dx++) {
        var xx = x + dx, yy = y + dy; if (xx < 0 || yy < 0 || xx >= N || yy >= N) continue; s += h[yy * N + xx]; n++;
      }
      o[y * N + x] = s / n;
    }
    return o;
  }

  /* altura de la comida según una foto de costado: alto del recuadro / radio del plato (el modelo mide 1 de radio) */
  function alturaDeCaja(c) { return Math.max(.05, Math.min(1.5, (c.b - c.t) / ((c.r - c.l) / 2))); }

  /* ---------- vista previa 3D (gira sola, se puede arrastrar) ---------- */
  function vistaPrevia(cont, modelo, base) {
    var vivo = true, cv = document.createElement('canvas');
    cv.style.cssText = 'width:100%;height:100%;display:block;touch-action:none;cursor:grab';
    cont.innerHTML = ''; cont.appendChild(cv);
    var fin = function () { vivo = false; };
    window.cargarThree().then(function (THREE) {
      return window.Menu3DRelieve(THREE, modelo, base).then(function (grupo) {
        if (!vivo) return;
        var w = cont.clientWidth, hh = cont.clientHeight;
        var r = new THREE.WebGLRenderer({ canvas: cv, antialias: true, alpha: true }); r.setPixelRatio(Math.min(devicePixelRatio || 1, 2)); r.setSize(w, hh, false);
        r.toneMapping = THREE.ACESFilmicToneMapping;
        var sc = new THREE.Scene(), cam = new THREE.PerspectiveCamera(40, w / hh, .1, 50);
        sc.add(new THREE.HemisphereLight(0xffffff, 0x8a7a68, 1.1));
        var sol = new THREE.DirectionalLight(0xfff2dc, 1.6); sol.position.set(2, 4, 3); sc.add(sol);
        var giro = new THREE.Group(); giro.add(grupo); sc.add(giro);
        var elev = .98, ang = 0, arr = null;
        cv.onpointerdown = function (e) { arr = [e.clientX, e.clientY]; cv.setPointerCapture(e.pointerId); };
        cv.onpointermove = function (e) { if (!arr) return; ang += (e.clientX - arr[0]) * .01; elev = Math.max(.78, Math.min(1.45, elev + (e.clientY - arr[1]) * .01)); arr = [e.clientX, e.clientY]; };
        cv.onpointerup = function () { arr = null; };
        (function loop() {
          if (!vivo) { r.dispose(); return; }
          requestAnimationFrame(loop);
          if (!arr) ang += .006;
          giro.rotation.y = ang;
          cam.position.set(0, Math.sin(elev) * 3.2, Math.cos(elev) * 3.2); cam.lookAt(0, .1, 0);
          r.render(sc, cam);
        })();
      });
    }).catch(function (e) { console.error(e); cont.textContent = 'No se pudo mostrar la vista previa.'; });
    return fin;
  }

  /* ---------- pantalla del generador ----------
     abrir(contenedor, fotos, listo): fotos = 1 a 5 imágenes (data URL o ruta). La primera se toma como "de arriba"
     y las demás como "de costado"; el usuario puede cambiarlo. listo(modelo) se llama con "Usar este 3D".
     Devuelve una función para cerrarla. */
  var MANUAL = [['.18', 'Baja (pizza, tarta, carne)'], ['.3', 'Media (pastas, guisos)'], ['.55', 'Alta (hamburguesas, tortas)'], ['.9', 'Muy alta (sándwiches, copas)']];
  function abrir(cont, fuentes, listo) {
    var fotos = fuentes.slice(0, MAX_FOTOS).map(function (src, i) { return { src: src, rol: i === 0 ? 'arriba' : 'costado', img: null, e: null, caja: null }; });
    var sel = 0, principal = 0, arr = null, modo = null, resultado = null, frenar = null;
    cont.innerHTML =
      '<div class="gen">' +
      '<p class="gen-ayuda">La primera vez el generador baja unos 25 MB: conviene usar Wi-Fi. Después tarda unos segundos por plato.</p>' +
      '<p class="gen-ayuda">Tocá cada foto e indicá qué es. En la <b>de arriba</b>, encerrá el plato con la elipse. En cada <b>de costado</b>, ajustá el recuadro: de borde a borde del plato y desde la base del plato hasta lo más alto de la comida.</p>' +
      '<div class="gen-fotos"></div>' +
      '<div class="gen-rol" role="group" aria-label="Tipo de foto"><span>Esta foto es:</span><button type="button" data-rol="arriba">De arriba</button><button type="button" data-rol="costado">De costado</button></div>' +
      '<div class="gen-lienzo"><canvas></canvas></div>' +
      '<p class="gen-tip"></p>' +
      '<div class="gen-ctrl" data-g="ctrl-elipse"><label>Tamaño<input type="range" min="10" max="100" value="45" data-g="t"></label>' +
      '<label>Inclinación de la foto<input type="range" min="30" max="100" value="100" data-g="i"></label></div>' +
      '<div class="gen-ctrl"><label>Altura de la comida<select data-g="v"></select></label></div>' +
      '<div class="gen-acc"><button type="button" class="b p" data-g="gen">Generar 3D</button><span class="gen-msg" aria-live="polite"></span></div>' +
      '<div class="gen-previa" hidden></div>' +
      '<div class="gen-acc" data-g="usar-fila" hidden><button type="button" class="b p" data-g="usar">Usar este 3D</button><span style="color:var(--suave);font-size:.85rem">Arrastrá para girarlo.</span></div>' +
      '</div>';
    var $ = function (s) { return cont.querySelector(s); }, cv = $('.gen-lienzo canvas'), msg = $('.gen-msg');

    function f() { return fotos[sel]; }
    function iniciar(x) {
      var w = x.img.width, h = x.img.height, m = Math.min(w, h);
      if (x.rol === 'arriba' && !x.e) { x.e = { cx: w / 2, cy: h / 2, rx: m * .45, ry: m * .45 }; x.t = 45; x.i = 100; }
      if (x.rol === 'costado' && !x.caja) x.caja = { l: w * .12, r: w * .88, t: h * .35, b: h * .72 };
    }
    function medida() {
      var l = fotos.filter(function (x) { return x.rol === 'costado' && x.caja; });
      if (!l.length) return null;
      return l.reduce(function (s, x) { return s + alturaDeCaja(x.caja); }, 0) / l.length;
    }
    function opciones() {
      var m = medida(), v = $('[data-g=v]'), antes = v.value;
      v.innerHTML = (m ? '<option value="m">Medida con las fotos de costado (' + Math.round(m * 50) + '% del ancho del plato)</option>' : '') +
        MANUAL.map(function (o) { return '<option value="' + o[0] + '">' + o[1] + '</option>'; }).join('');
      v.value = m ? 'm' : (antes && antes !== 'm' ? antes : '.3');
    }
    function altura() { var v = $('[data-g=v]').value; return v === 'm' ? medida() : +v; }
    function pintarFotos() {
      $('.gen-fotos').innerHTML = fotos.map(function (x, i) {
        var et = x.rol === 'arriba' ? (i === principal ? '★ Arriba' : 'Arriba') : 'Costado';
        return '<button type="button" data-foto="' + i + '" aria-pressed="' + (i === sel) + '"><img src="' + x.src + '" alt="Foto ' + (i + 1) + '"><span>' + et + '</span></button>';
      }).join('');
      [].forEach.call(cont.querySelectorAll('[data-rol]'), function (b) { b.setAttribute('aria-pressed', b.dataset.rol === f().rol); });
      $('[data-g=ctrl-elipse]').hidden = f().rol !== 'arriba';
      $('.gen-tip').innerHTML = f().rol === 'arriba'
        ? (sel === principal ? 'Arrastrá la elipse para que encierre <b>todo el plato</b>. Si la foto está inclinada, bajá "Inclinación" hasta que la elipse coincida con el borde del plato.' : 'Hay más de una foto de arriba: se usa la marcada con ★. Tocá esta para usarla en su lugar.')
        : 'Arrastrá los bordes del recuadro: los costados van en los <b>bordes del plato</b>, la línea de abajo en la <b>base del plato</b> y la de arriba en <b>lo más alto de la comida</b>.';
    }
    function elegir(i) {
      sel = i; var x = f();
      if (x.rol === 'arriba') principal = i;
      if (!x.img) return;
      iniciar(x);
      var k = Math.min(1, 900 / Math.max(x.img.width, x.img.height));
      cv.width = Math.round(x.img.width * k); cv.height = Math.round(x.img.height * k);
      if (x.rol === 'arriba') { $('[data-g=t]').value = x.t; $('[data-g=i]').value = x.i; }
      pintarFotos(); dibujar(); opciones();
    }
    function dibujar() {
      var x = f(), g = cv.getContext('2d'), k = cv.width / x.img.width;
      g.drawImage(x.img, 0, 0, cv.width, cv.height);
      g.save(); g.fillStyle = 'rgba(0,0,0,.45)'; g.strokeStyle = '#fff'; g.lineWidth = 3; g.setLineDash([10, 6]);
      if (x.rol === 'arriba') {
        var e = x.e;
        g.beginPath(); g.rect(0, 0, cv.width, cv.height); g.ellipse(e.cx * k, e.cy * k, e.rx * k, e.ry * k, 0, 0, Math.PI * 2); g.fill('evenodd');
        g.beginPath(); g.ellipse(e.cx * k, e.cy * k, e.rx * k, e.ry * k, 0, 0, Math.PI * 2); g.stroke();
      } else {
        var c = x.caja;
        g.beginPath(); g.rect(0, 0, cv.width, cv.height); g.rect(c.l * k, c.t * k, (c.r - c.l) * k, (c.b - c.t) * k); g.fill('evenodd');
        g.strokeRect(c.l * k, c.t * k, (c.r - c.l) * k, (c.b - c.t) * k);
        g.setLineDash([]); g.font = 'bold ' + Math.max(12, Math.round(cv.width / 40)) + 'px sans-serif'; g.fillStyle = '#fff';
        g.shadowColor = '#000'; g.shadowBlur = 4;
        g.fillText('Lo más alto de la comida', c.l * k + 6, c.t * k - 8);
        g.fillText('Base del plato', c.l * k + 6, c.b * k + 20);
      }
      g.restore();
    }
    $('[data-g=t]').oninput = $('[data-g=i]').oninput = function () {
      var x = f(); if (x.rol !== 'arriba') return;
      x.t = +$('[data-g=t]').value; x.i = +$('[data-g=i]').value;
      var m = Math.max(x.img.width, x.img.height); x.e.rx = m * x.t / 100 * .5; x.e.ry = x.e.rx * x.i / 100; dibujar();
    };
    function punto(ev) { var b = cv.getBoundingClientRect(), x = f(); return [(ev.clientX - b.left) / b.width * x.img.width, (ev.clientY - b.top) / b.height * x.img.height]; }
    cv.onpointerdown = function (ev) {
      var x = f(); if (!x.img) return;
      arr = punto(ev); cv.setPointerCapture(ev.pointerId); modo = 'mover';
      if (x.rol === 'costado') {
        /* se agarra el borde más cercano del recuadro; si se toca adentro, se mueve entero */
        var c = x.caja, p = arr, tol = 24 * x.img.width / cv.getBoundingClientRect().width, mejor = tol;
        var dentroY = p[1] > c.t - tol && p[1] < c.b + tol, dentroX = p[0] > c.l - tol && p[0] < c.r + tol;
        modo = p[0] > c.l && p[0] < c.r && p[1] > c.t && p[1] < c.b ? 'mover' : null;
        [['l', Math.abs(p[0] - c.l), dentroY], ['r', Math.abs(p[0] - c.r), dentroY], ['t', Math.abs(p[1] - c.t), dentroX], ['b', Math.abs(p[1] - c.b), dentroX]]
          .forEach(function (o) { if (o[2] && o[1] < mejor) { mejor = o[1]; modo = o[0]; } });
      }
    };
    cv.onpointermove = function (ev) {
      if (!arr || !modo) return;
      var x = f(), p = punto(ev), dx = p[0] - arr[0], dy = p[1] - arr[1]; arr = p;
      if (x.rol === 'arriba') { x.e.cx += dx; x.e.cy += dy; }
      else {
        var c = x.caja, min = x.img.width * .04;
        if (modo === 'mover') { c.l += dx; c.r += dx; c.t += dy; c.b += dy; }
        if (modo === 'l') c.l = Math.min(c.r - min, c.l + dx);
        if (modo === 'r') c.r = Math.max(c.l + min, c.r + dx);
        if (modo === 't') c.t = Math.min(c.b - min, c.t + dy);
        if (modo === 'b') c.b = Math.max(c.t + min, c.b + dy);
      }
      dibujar();
    };
    cv.onpointerup = cv.onpointercancel = function () { if (arr && f().rol === 'costado') opciones(); arr = null; modo = null; };
    $('.gen-fotos').onclick = function (ev) { var b = ev.target.closest('[data-foto]'); if (b) elegir(+b.dataset.foto); };
    $('.gen-rol').onclick = function (ev) {
      var b = ev.target.closest('[data-rol]'); if (!b) return;
      var x = f(); x.rol = b.dataset.rol;
      if (x.rol === 'arriba') principal = sel;
      else if (principal === sel) { principal = -1; fotos.forEach(function (y, i) { if (principal < 0 && y.rol === 'arriba') principal = i; }); }
      elegir(sel);
    };
    $('[data-g=gen]').onclick = function () {
      var bot = this, top = fotos[principal];
      if (!top || top.rol !== 'arriba') { msg.textContent = 'Marcá al menos una foto como "De arriba": es la que da la forma y el color del plato.'; return; }
      bot.disabled = true; msg.textContent = 'Preparando…';
      generar(top.img, top.e, function (t) { msg.textContent = t; }).then(function (m) {
        m.altura = altura(); resultado = m;
        msg.textContent = '¡Listo! Así queda tu plato en 3D:';
        $('.gen-previa').hidden = false; $('[data-g=usar-fila]').hidden = false;
        if (frenar) frenar(); frenar = vistaPrevia($('.gen-previa'), m);
      }).catch(function (err) {
        console.error(err); msg.textContent = 'No se pudo generar el 3D en este dispositivo. Probá desde una computadora o con otra foto.';
      }).then(function () { bot.disabled = false; });
    };
    $('[data-g=v]').onchange = function () { if (resultado) { resultado.altura = altura(); if (frenar) frenar(); frenar = vistaPrevia($('.gen-previa'), resultado); } };
    $('[data-g=usar]').onclick = function () { if (frenar) frenar(); listo(resultado); };

    /* se cargan todas las fotos; al terminar la primera se muestra */
    pintarFotos(); opciones();
    fotos.forEach(function (x, i) {
      var im = new Image(); im.crossOrigin = 'anonymous';
      im.onload = function () { x.img = im; iniciar(x); if (i === sel) elegir(sel); else opciones(); };
      im.src = x.src;
    });
    return function () { if (frenar) frenar(); };
  }

  window.Generador3D = { preparar: preparar, generar: generar, abrir: abrir, vistaPrevia: vistaPrevia, MAX_FOTOS: MAX_FOTOS };
})();
