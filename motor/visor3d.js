/* Menú 3D · Vista 3D con cámara (común a todos los locales)
   - open3D(id) abre la cámara trasera y muestra el plato en 3D sobre la imagen.
   - El modelo es el que armó el generador a partir de fotos reales (campo "modelo" del plato, ver relieve.js).
   Necesita cargar-three.js y relieve.js. Si el celular tiene AR propio, ofrece "Ver en tu mesa (AR)" (ar.js, se carga solo).
   Gestos: 1 dedo = girar / inclinar · 2 dedos = agrandar y mover · rueda = zoom. */
(function () {
  'use strict';
  var THREE = null, ov, vid, cv, msg, ttl, S = null, stream = null, curId = null, lastEv = null, oriOn = false;
  var yo = document.currentScript && document.currentScript.src, cargaAR = null;
  function cargarAR() {
    if (!cargaAR) cargaAR = window.Menu3DAR ? Promise.resolve() : new Promise(function (ok, mal) {
      var s = document.createElement('script'); s.src = yo.replace(/visor3d\.js(\?.*)?$/, 'ar.js'); s.onload = ok; s.onerror = mal; document.head.appendChild(s);
    });
    return cargaAR;
  }

  /* ---------- sensores de movimiento: el plato queda fijo en el espacio ---------- */
  function onOri(e) { lastEv = e; }
  function startOri() {
    lastEv = null;
    function listen() { if (!oriOn) { addEventListener('deviceorientation', onOri, true); oriOn = true; } }
    var DOE = window.DeviceOrientationEvent;
    listen(); /* se escucha siempre: si no dan permiso, simplemente no llegan eventos */
    if (DOE && typeof DOE.requestPermission === 'function') {
      try { return Promise.resolve(DOE.requestPermission()).catch(function () {}); } catch (e) { return Promise.resolve(); }
    }
    return Promise.resolve();
  }
  function stopOri() { if (oriOn) { removeEventListener('deviceorientation', onOri, true); oriOn = false; } lastEv = null; }
  function devQuat(e, out) {
    var d = Math.PI / 180, o = ((screen.orientation && screen.orientation.angle) || window.orientation || 0) * d;
    out.setFromEuler(new THREE.Euler(e.beta * d, e.alpha * d, -e.gamma * d, 'YXZ'));
    out.multiply(new THREE.Quaternion(-Math.sqrt(.5), 0, 0, Math.sqrt(.5)));
    out.multiply(new THREE.Quaternion().setFromAxisAngle(new THREE.Vector3(0, 0, 1), -o));
  }
  /* tamaño, sombra y luz siguen al plato donde esté */
  function applyScale() {
    var k = S.base * S.scale;
    S.holder.scale.setScalar(k);
    S.sun.position.copy(S.holder.position).add(new THREE.Vector3(2.5 * k, 5 * k, 3 * k));
    S.sun.target.position.copy(S.holder.position);
    var c = S.sun.shadow.camera; c.left = -2.2 * k; c.right = 2.2 * k; c.top = 2.2 * k; c.bottom = -2.2 * k; c.near = .5 * k; c.far = 14 * k;
    c.updateProjectionMatrix();
  }
  /* el cliente toca la mesa en la pantalla y el plato se apoya ahí */
  function placeAt(cx, cy) {
    var rc = new THREE.Raycaster();
    S.cam.updateMatrixWorld();
    rc.setFromCamera(new THREE.Vector2(cx / innerWidth * 2 - 1, -(cy / innerHeight) * 2 + 1), S.cam);
    var dir = rc.ray.direction.clone();
    if (dir.y > -.12) { dir.y = -.12; dir.normalize(); }
    var d = (S.dist * .5) / -dir.y;
    S.holder.position.copy(dir.multiplyScalar(d));
    S.base = clamp(d / S.dist, .4, 3); S.scale = 1;
    S.holder.visible = true; S.placed = true; applyScale();
    msg.hidden = true;
  }
  /* fija el "frente" según hacia dónde apunta el celular y espera que toquen la mesa */
  function calibrate() {
    var eu = new THREE.Euler().setFromQuaternion(S.qd, 'YXZ');
    S.Y0.setFromAxisAngle(new THREE.Vector3(0, 1, 0), -eu.y);
    S.placed = false; S.holder.visible = false;
    msg.textContent = v('apunta'); msg.hidden = false;
  }

  /* ---------- estilos ---------- */
  var st = document.createElement('style');
  st.textContent =
    '#ar3d{position:fixed;inset:0;z-index:70;background:#14100c;display:none;touch-action:none;overflow:hidden}' +
    '#ar3d.open{display:block}' +
    '#ar3d video{position:absolute;inset:0;width:100%;height:100%;object-fit:cover}' +
    '#ar3d canvas{position:absolute;inset:0;width:100%;height:100%;touch-action:none;cursor:grab}' +
    '#ar3d.nocam{background:radial-gradient(circle at 50% 40%,#4a3a2b,#14100c 75%)}' +
    '#ar3d .a-top{position:absolute;top:0;left:0;right:0;padding:calc(12px + env(safe-area-inset-top,0px)) 14px 28px;display:flex;gap:12px;align-items:center;background:linear-gradient(rgba(0,0,0,.6),transparent);color:#fff;pointer-events:none}' +
    '#ar3d .a-top button{pointer-events:auto}' +
    '#ar3d .a-x{width:40px;height:40px;border-radius:50%;background:rgba(0,0,0,.5);border:1px solid rgba(255,255,255,.35);color:#fff;font-size:1.1rem;flex:none}' +
    '#ar3d .a-top b{font-family:Fraunces,Georgia,serif;font-size:1.15rem;display:block;line-height:1.2}' +
    '#ar3d .a-top small{opacity:.85;font-size:.78rem;display:block}' +
    '#ar3d .a-top .a-priv{opacity:.7;margin-top:3px;font-size:.72rem}' +
    '#ar3d .a-msg{position:absolute;left:16px;right:16px;top:50%;transform:translateY(-50%);text-align:center;color:#fff;background:rgba(0,0,0,.6);padding:14px;border-radius:14px;font-size:.95rem;pointer-events:none}' +
    '#ar3d .a-msg[hidden]{display:none}' +
    '#ar3d .a-bot{position:absolute;left:0;right:0;bottom:0;padding:26px 14px calc(14px + env(safe-area-inset-bottom,0px));display:flex;gap:10px;justify-content:center;background:linear-gradient(transparent,rgba(0,0,0,.6))}' +
    '#ar3d .a-bot button{padding:12px 16px;border-radius:12px;font-weight:700;background:rgba(255,255,255,.18);color:#fff;border:1px solid rgba(255,255,255,.4);backdrop-filter:blur(6px)}' +
    '#ar3d .a-bot button.p{background:var(--acento);border-color:var(--acento);color:var(--sobre-acento);flex:1;max-width:240px}' +
    '#ar3d .a-bg{position:absolute;inset:0;width:100%;height:100%;object-fit:cover;display:none}' +
    '#ar3d.photo .a-bg{display:block}' +
    '#ar3d .a-bot button[hidden]{display:none}' +
    '#ar3d .a-bot button:disabled{opacity:.6}' +
    '#ar3d #a-photo{display:none}' +
    '#ar3d.nocam #a-photo{display:block}' +
    '@media (prefers-reduced-motion:reduce){#ar3d *{scroll-behavior:auto}}';
  document.head.appendChild(st);

  /* ---------- overlay ---------- */
  /* textos del visor en el idioma que eligió el cliente en el menú (window.idiomaMenu, de menu.js) */
  var TV = {
    es: {
      privacidad: 'La cámara se usa solo en tu celular: no graba ni envía nada.',
      vista: 'Vista 3D del plato', cerrar: 'Cerrar vista 3D', ayuda: 'Tocá tu mesa para apoyar el plato · Tocá otro lugar para moverlo · Arrastrá para girarlo · Pellizcá para agrandar',
      ar: 'Ver en tu mesa (AR)', preparandoAR: 'Preparando AR…', foto: '📷 Foto de tu mesa', centrar: 'Centrar',
      apuntaAR: 'Apuntá a la mesa y mové un poco el celular hasta que aparezca el plato.', apunta: 'Apuntá a tu mesa y tocá la pantalla para colocar el plato',
      sinCamara: 'No pudimos abrir la cámara en vivo. Tocá "Foto de tu mesa", sacá una foto y ponemos el plato encima.', preparando: 'Preparando el plato en 3D…',
      noInicia: 'No se pudo iniciar el visor 3D en este dispositivo.', sinModelo: 'Este plato todavía no tiene modelo 3D.', noCarga: 'No se pudo cargar el plato en 3D. Revisá tu conexión e intentá de nuevo.'
    },
    en: {
      privacidad: 'The camera is only used on your phone: nothing is recorded or sent.',
      vista: '3D view of the dish', cerrar: 'Close 3D view', ayuda: 'Tap your table to place the dish · Tap elsewhere to move it · Drag to turn it · Pinch to resize',
      ar: 'See it on your table (AR)', preparandoAR: 'Getting AR ready…', foto: '📷 Photo of your table', centrar: 'Center',
      apuntaAR: 'Point at the table and move your phone a little until the dish appears.', apunta: 'Point at your table and tap the screen to place the dish',
      sinCamara: 'We couldn\'t open the live camera. Tap "Photo of your table", take a picture and we\'ll put the dish on it.', preparando: 'Getting the dish ready in 3D…',
      noInicia: 'The 3D viewer couldn\'t start on this device.', sinModelo: 'This dish doesn\'t have a 3D model yet.', noCarga: 'We couldn\'t load the dish in 3D. Check your connection and try again.'
    }
  };
  function v(k) { return (TV[window.idiomaMenu] || TV.es)[k]; }
  ov = document.createElement('div');
  ov.id = 'ar3d';
  ov.setAttribute('role', 'dialog');
  ov.setAttribute('aria-modal', 'true');
  ov.innerHTML =
    '<video playsinline muted autoplay></video><img class="a-bg" alt=""><canvas></canvas>' +
    '<input type="file" id="a-file" accept="image/*" capture="environment" hidden>' +
    '<div class="a-top"><button class="a-x">✕</button><div><b id="a-t"></b><small id="a-ayuda"></small><small id="a-priv" class="a-priv"></small></div></div>' +
    '<div class="a-msg" hidden></div>' +
    '<div class="a-bot"><button id="a-ar" class="p" hidden></button><button id="a-photo"></button><button id="a-reset"></button></div>';
  document.body.appendChild(ov);
  function textosVisor() {
    ov.setAttribute('aria-label', v('vista')); ov.querySelector('.a-x').setAttribute('aria-label', v('cerrar'));
    ov.querySelector('#a-ayuda').textContent = v('ayuda'); ov.querySelector('#a-ar').textContent = v('ar');
    ov.querySelector('#a-priv').textContent = '🔒 ' + v('privacidad');
    ov.querySelector('#a-photo').textContent = v('foto'); ov.querySelector('#a-reset').textContent = v('centrar');
  }
  textosVisor();
  vid = ov.querySelector('video'); cv = ov.querySelector('canvas'); msg = ov.querySelector('.a-msg'); ttl = ov.querySelector('#a-t');
  ov.querySelector('.a-x').onclick = close3D;
  var bg = ov.querySelector('.a-bg'), fileIn = ov.querySelector('#a-file'), photoUrl = null;
  ov.querySelector('#a-photo').onclick = function () { fileIn.click(); };
  /* AR del celular: tiene que abrirse en el mismo toque, por eso el plato ya está preparado de antes */
  var btnAR = ov.querySelector('#a-ar');
  btnAR.onclick = function () {
    if (window.Menu3DAR && Menu3DAR.lanzar()) {
      if (window.contarVista) window.contarVista('ar', curId);
      msg.textContent = v('apuntaAR'); msg.hidden = false;
      setTimeout(function () { msg.hidden = true; }, 5000);
    }
  };
  function ofrecerAR(d) {
    btnAR.hidden = true;
    if (!yo) return;
    cargarAR().then(function () { return Menu3DAR.soportado(); }).then(function (si) {
      if (!si || String(curId) !== String(d.id) || !ov.classList.contains('open')) return;
      btnAR.hidden = false; btnAR.disabled = true; btnAR.textContent = v('preparandoAR');
      return Menu3DAR.preparar(d, (window.MENU && window.MENU.base) || '').then(function () {
        if (String(curId) === String(d.id)) { btnAR.disabled = false; btnAR.textContent = v('ar'); }
      });
    }).catch(function (e) { if (window.console) console.warn('AR no disponible:', e); btnAR.hidden = true; });
  }
  fileIn.onchange = function () {
    var f = fileIn.files && fileIn.files[0]; if (!f) return;
    if (photoUrl) URL.revokeObjectURL(photoUrl);
    photoUrl = URL.createObjectURL(f); bg.src = photoUrl;
    ov.classList.add('photo'); msg.hidden = true; fileIn.value = '';
  };
  /* Centrar: el plato vuelve al medio de la pantalla, apoyado en la mesa, derecho y con su tamaño original */
  ov.querySelector('#a-reset').onclick = function () {
    if (!S) return;
    S.yaw = 0; S.incl = 0;
    if (S.gyro) placeAt(innerWidth / 2, innerHeight / 2); else resetView();
  };
  document.addEventListener('keydown', function (e) { if (e.key === 'Escape' && ov.classList.contains('open')) close3D(); });

  /* ---------- escena ---------- */
  function clamp(v, a, b) { return Math.max(a, Math.min(b, v)); }
  function camDist() { var asp = innerWidth / innerHeight; return Math.max(3.6, 3.45 / asp); }

  /* giro del plato: vuelta completa sobre su eje vertical, pero inclinación limitada
     (se puede acercar hacia vos para ver mejor, no dar vuelta hasta ver la parte de abajo) */
  var INCL_MIN = -.2, INCL_MAX = .5; /* con ELEV: nunca se ve tan de costado como para que se note que sale de una foto */
  var ELEV = .98;
  function aplicarGiro() {
    var eje = S.eje.set(1, 0, 0).applyQuaternion(S.cam.quaternion); eje.y = 0;
    if (eje.lengthSq() < 1e-4) eje.set(1, 0, 0);
    eje.normalize();
    S.spin.quaternion.setFromAxisAngle(eje, S.incl).multiply(S.qy.setFromAxisAngle(S.arriba, S.yaw));
  }

  function resetView() {
    S.elev = ELEV; S.holder.position.set(0, 0, 0); S.scale = 1; S.base = 1; S.holder.visible = true;
    S.yaw = 0; S.incl = 0; S.auto = true; S.calib = true; applyScale();
  }
  function onResize() {
    if (!S) return;
    var w = innerWidth, h = innerHeight;
    S.renderer.setSize(w, h, false); S.cam.aspect = w / h; S.cam.updateProjectionMatrix(); S.dist = camDist();
  }

  /* cada vez se usa un canvas nuevo: un canvas cuyo contexto WebGL ya se cerró no se puede reutilizar */
  function freshCanvas() {
    var n = document.createElement('canvas');
    cv.replaceWith(n); cv = n;
  }

  function buildScene(model) {
    var r = new THREE.WebGLRenderer({ canvas: cv, alpha: true, antialias: true });
    r.setPixelRatio(Math.min(devicePixelRatio || 1, 2));
    r.setSize(innerWidth, innerHeight, false);
    r.shadowMap.enabled = true; r.shadowMap.type = THREE.PCFSoftShadowMap;
    r.toneMapping = THREE.ACESFilmicToneMapping; r.toneMappingExposure = 1.05;
    var scene = new THREE.Scene(), cam = new THREE.PerspectiveCamera(45, innerWidth / innerHeight, .1, 60);
    scene.add(new THREE.HemisphereLight(0xffffff, 0x8a7a68, 1.25));
    var sun = new THREE.DirectionalLight(0xfff2dc, 2.2); sun.position.set(2.5, 5, 3); sun.castShadow = true;
    sun.shadow.mapSize.set(1024, 1024);
    var sc = sun.shadow.camera; sc.left = -2; sc.right = 2; sc.top = 2; sc.bottom = -2; sc.near = 1; sc.far = 14; sun.shadow.bias = -.0005;
    scene.add(sun); scene.add(sun.target);
    var holder = new THREE.Group(), spin = new THREE.Group();
    model.traverse(function (o) { if (o.isMesh) { o.castShadow = !(o.material && o.material.transparent); o.receiveShadow = true; } });
    spin.add(model); holder.add(spin); scene.add(holder);
    var ground = new THREE.Mesh(new THREE.PlaneGeometry(14, 14), new THREE.ShadowMaterial({ opacity: .38 }));
    ground.rotation.x = -Math.PI / 2; ground.position.y = -.001; ground.receiveShadow = true; holder.add(ground);
    S = { renderer: r, scene: scene, cam: cam, holder: holder, spin: spin, elev: ELEV, dist: camDist(), scale: 1, auto: true, raf: 0, ptr: new Map(), sun: sun, qa: new THREE.Quaternion(), base: 1, placed: false, gyro: false, calib: true, qd: new THREE.Quaternion(), Y0: new THREE.Quaternion(), yaw: 0, incl: 0, qy: new THREE.Quaternion(), eje: new THREE.Vector3(), arriba: new THREE.Vector3(0, 1, 0) };
    resetView(); bindGestures();
    (function loop() {
      if (!S) return;
      S.raf = requestAnimationFrame(loop);
      if (lastEv && lastEv.beta != null) {
        devQuat(lastEv, S.qd);
        if (S.calib || !S.gyro) { S.gyro = true; S.calib = false; calibrate(); }
        S.cam.position.set(0, 0, 0);
        S.cam.quaternion.copy(S.Y0).multiply(S.qd);
      } else {
        if (S.gyro) { S.gyro = false; S.holder.visible = true; S.holder.position.set(0, 0, 0); S.base = 1; applyScale(); }
        S.cam.position.set(0, Math.sin(S.elev) * S.dist, Math.cos(S.elev) * S.dist);
        S.cam.lookAt(0, .25, 0);
      }
      aplicarGiro();
      S.renderer.render(S.scene, S.cam);
    })();
  }

  function bindGestures() {
    var P = S.ptr;
    cv.onpointerdown = function (e) {
      cv.setPointerCapture(e.pointerId);
      P.set(e.pointerId, { x: e.clientX, y: e.clientY, sx: e.clientX, sy: e.clientY, t: Date.now(), multi: false });
      if (P.size > 1) P.forEach(function (v) { v.multi = true; });
    };
    cv.onpointermove = function (e) {
      var p = P.get(e.pointerId); if (!p || !S) return;
      var dx = e.clientX - p.x, dy = e.clientY - p.y;
      if (P.size === 1) {
        /* izquierda/derecha: vuelta completa; arriba/abajo: inclinar, con tope para no ver la parte de abajo */
        S.yaw += dx * .01;
        S.incl = clamp(S.incl + dy * .01, INCL_MIN, INCL_MAX);
      } else if (P.size === 2) {
        var o = null; P.forEach(function (v, k) { if (k !== e.pointerId) o = v; });
        var d0 = Math.hypot(p.x - o.x, p.y - o.y), d1 = Math.hypot(e.clientX - o.x, e.clientY - o.y);
        if (d0 > 0) { S.scale = clamp(S.scale * d1 / d0, .4, 2.6); applyScale(); }
        if (!S.gyro) {
          var k2 = 2 * S.dist * Math.tan(Math.PI / 8) / innerHeight / 2;
          S.holder.position.x = clamp(S.holder.position.x + dx * k2, -4, 4);
          S.holder.position.z = clamp(S.holder.position.z + dy * k2, -4, 4);
          applyScale();
        }
      }
      p.x = e.clientX; p.y = e.clientY;
    };
    cv.onpointerup = function (e) {
      var p = P.get(e.pointerId); P.delete(e.pointerId);
      if (p && S && S.gyro && !p.multi && Math.hypot(e.clientX - p.sx, e.clientY - p.sy) < 10 && Date.now() - p.t < 500) placeAt(e.clientX, e.clientY);
    };
    cv.onpointercancel = function (e) { P.delete(e.pointerId); };
    cv.onwheel = function (e) { e.preventDefault(); if (!S) return; S.scale = clamp(S.scale * Math.exp(-e.deltaY * .001), .4, 2.6); applyScale(); };
  }

  /* ---------- cámara ---------- */
  function startCam() {
    var md = navigator.mediaDevices;
    if (!md || !md.getUserMedia) { noCam(); return Promise.resolve(); }
    return md.getUserMedia({ video: { facingMode: { ideal: 'environment' }, width: { ideal: 1280 }, height: { ideal: 720 } }, audio: false })
      .then(function (s) {
        if (!ov.classList.contains('open')) { s.getTracks().forEach(function (t) { t.stop(); }); return; }
        stream = s; vid.srcObject = s; var p = vid.play(); if (p && p.catch) p.catch(function () {});
      })
      .catch(noCam);
  }
  function noCam() {
    ov.classList.add('nocam');
    msg.textContent = v('sinCamara');
    msg.hidden = false; setTimeout(function () { msg.hidden = true; }, 6000);
  }

  /* ---------- abrir / cerrar ---------- */
  function loadThree() {
    return window.cargarThree().then(function (m) { THREE = m; return m; });
  }

  function open3D(id) {
    var platos = (window.MENU && window.MENU.platos) || [];
    var d = platos.filter(function (x) { return String(x.id) === String(id); })[0];
    curId = id; textosVisor();
    if (window.contarVista) window.contarVista('3d', id); ttl.textContent = d ? (window.textoPlato ? window.textoPlato(d).nombre : d.nombre) : v('vista');
    ov.classList.remove('nocam'); ov.classList.add('open'); document.body.style.overflow = 'hidden';
    msg.textContent = v('preparando'); msg.hidden = false;
    var cam = startOri().then(startCam);
    loadThree().then(function () {
      if (!ov.classList.contains('open')) return;
      if (!d || !d.modelo || d.modelo.tipo !== 'foto') throw 'sin-modelo';
      return window.Menu3DRelieve(THREE, d.modelo, (window.MENU && window.MENU.base) || '');
    }).then(function (model) {
      if (!model || !ov.classList.contains('open') || curId !== id) return;
      try {
        freshCanvas();
        buildScene(model);
      } catch (err) {
        if (window.console) console.error(err);
        msg.textContent = v('noInicia'); msg.hidden = false;
        return;
      }
      if (!ov.classList.contains('nocam')) msg.hidden = true;
      ofrecerAR(d);
      return cam;
    }).catch(function (e) {
      if (window.console && e !== 'sin-modelo') console.error(e);
      msg.textContent = e === 'sin-modelo' ? v('sinModelo') : v('noCarga');
      msg.hidden = false;
    });
  }

  function close3D() {
    ov.classList.remove('open', 'nocam', 'photo'); document.body.style.overflow = '';
    btnAR.hidden = true; if (window.Menu3DAR) Menu3DAR.descartar();
    if (photoUrl) { URL.revokeObjectURL(photoUrl); photoUrl = null; } bg.removeAttribute('src');
    if (stream) { stream.getTracks().forEach(function (t) { t.stop(); }); stream = null; }
    vid.srcObject = null; stopOri();
    if (S) {
      cancelAnimationFrame(S.raf);
      S.scene.traverse(function (o) {
        if (o.geometry) o.geometry.dispose();
        if (o.material) (Array.isArray(o.material) ? o.material : [o.material]).forEach(function (m) { m.dispose(); });
      });
      S.renderer.dispose();
      if (S.renderer.forceContextLoss) S.renderer.forceContextLoss();
      S = null;
    }
    msg.hidden = true;
  }

  addEventListener('resize', onResize);
  addEventListener('orientationchange', function () { setTimeout(onResize, 250); });
  window.open3D = open3D;
  window.precargar3D = function () { loadThree().catch(function () {}); };
})();
