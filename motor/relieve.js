/* Menú 3D · arma el plato en 3D a partir de lo que guarda el generador:
   "modelo": { "tipo": "foto", "textura": "modelos/1-textura.jpg", "relieve": "modelos/1-relieve.png", "altura": 0.3 }
   - textura: la foto recortada en círculo (el plato visto en la foto)
   - relieve: imagen en grises con la altura de cada punto (blanco = más alto)
   - altura: cuánto sobresale lo más alto, en radios de plato (0.3 = un 30% del radio)
   Devuelve una promesa con un THREE.Group de radio 1 apoyado en y = 0, como los demás modelos. */
window.Menu3DRelieve = function (THREE, m, base) {
  'use strict';
  function ruta(r) { return /^(https?:|data:|blob:|\/)/.test(r) ? r : (base || '') + r; }
  function imagen(src) {
    return new Promise(function (ok, mal) {
      var im = new Image(); im.crossOrigin = 'anonymous';
      im.onload = function () { ok(im); }; im.onerror = function () { mal(new Error('No se pudo cargar ' + src)); };
      im.src = src;
    });
  }
  return Promise.all([imagen(ruta(m.textura)), imagen(ruta(m.relieve))]).then(function (r) {
    var foto = r[0], rel = r[1];
    /* alturas: se leen los píxeles de la imagen de relieve */
    var W = rel.naturalWidth, H = rel.naturalHeight, c = document.createElement('canvas');
    c.width = W; c.height = H;
    var g = c.getContext('2d'); g.drawImage(rel, 0, 0);
    var px = g.getImageData(0, 0, W, H).data, alt = (m.altura || .3) * .7, BASE = .015;
    /* el relieve se suaviza para que los bordes de la comida no se estiren como una pared */
    var alto = new Float32Array(W * H), rad = Math.max(1, Math.round(W / 128));
    for (var ip = 0; ip < W * H; ip++) alto[ip] = px[ip * 4] / 255;
    function pasada(horizontal) {
      var copia = alto.slice(), largo = horizontal ? W : H, otro = horizontal ? H : W;
      for (var o = 0; o < otro; o++) for (var q = 0; q < largo; q++) {
        var s = 0, n = 0;
        for (var d = Math.max(0, q - rad); d <= Math.min(largo - 1, q + rad); d++) { s += copia[horizontal ? o * W + d : d * W + o]; n++; }
        alto[horizontal ? o * W + q : q * W + o] = s / n;
      }
    }
    for (var vuelta = 0; vuelta < 3; vuelta++) { pasada(true); pasada(false); }
    function h(x, z) { /* x, z entre -1 y 1 → altura con interpolación bilineal */
      var fx = (x + 1) / 2 * (W - 1), fz = (z + 1) / 2 * (H - 1);
      var x0 = Math.max(0, Math.min(W - 2, Math.floor(fx))), z0 = Math.max(0, Math.min(H - 2, Math.floor(fz)));
      var tx = fx - x0, tz = fz - z0;
      function v(a, b) { return alto[b * W + a]; }
      return (v(x0, z0) * (1 - tx) + v(x0 + 1, z0) * tx) * (1 - tz) + (v(x0, z0 + 1) * (1 - tx) + v(x0 + 1, z0 + 1) * tx) * tz;
    }
    /* malla en anillos (borde redondo, sin dientes) + un faldón que baja hasta la mesa */
    var R = 80, S = 192, pos = [], uv = [], idx = [];
    function vert(x, y, z) { pos.push(x, y, z); uv.push((x + 1) / 2, (1 - z) / 2); return pos.length / 3 - 1; }
    vert(0, BASE + h(0, 0) * alt, 0);
    for (var i = 1; i <= R; i++) {
      var rr = i / R;
      for (var j = 0; j < S; j++) {
        var a = j / S * Math.PI * 2, x = rr * Math.cos(a), z = rr * Math.sin(a);
        vert(x, BASE + h(x * .995, z * .995) * alt * (i === R ? 0 : 1), z);
      }
    }
    function anillo(i, j) { return 1 + (i - 1) * S + (j % S); }
    for (var j2 = 0; j2 < S; j2++) idx.push(0, anillo(1, j2 + 1), anillo(1, j2));
    for (var i2 = 1; i2 < R; i2++) for (var j3 = 0; j3 < S; j3++) {
      var a0 = anillo(i2, j3), a1 = anillo(i2, j3 + 1), b0 = anillo(i2 + 1, j3), b1 = anillo(i2 + 1, j3 + 1);
      idx.push(a0, a1, b1, a0, b1, b0);
    }
    var top = pos.length / 3;
    for (var j4 = 0; j4 < S; j4++) { var k = anillo(R, j4); vert(pos[k * 3], 0, pos[k * 3 + 2]); }
    for (var j5 = 0; j5 < S; j5++) {
      var t0 = anillo(R, j5), t1 = anillo(R, j5 + 1), d0 = top + j5, d1 = top + (j5 + 1) % S;
      idx.push(t0, t1, d1, t0, d1, d0);
    }
    var geo = new THREE.BufferGeometry();
    geo.setAttribute('position', new THREE.Float32BufferAttribute(pos, 3));
    geo.setAttribute('uv', new THREE.Float32BufferAttribute(uv, 2));
    geo.setIndex(idx); geo.computeVertexNormals();
    var tex = new THREE.Texture(foto); tex.colorSpace = THREE.SRGBColorSpace; tex.anisotropy = 4; tex.needsUpdate = true;
    /* la foto ya trae su propia luz: se usa un material que la respeta y suma un poco de sombra por el volumen */
    var mat = new THREE.MeshStandardMaterial({ map: tex, roughness: .9, metalness: 0, emissive: 0xffffff, emissiveMap: tex, emissiveIntensity: .55 });
    var grupo = new THREE.Group(); grupo.add(new THREE.Mesh(geo, mat));
    /* base cerrada abajo, del color del borde del plato: si se llega a ver desde un ángulo bajo, parece la base de un plato real */
    var base = new THREE.Mesh(new THREE.CircleGeometry(1, S), new THREE.MeshStandardMaterial({ color: colorBorde(foto), roughness: .85 }));
    base.rotation.x = Math.PI / 2; base.position.y = .001; grupo.add(base);
    return grupo;
  });
  /* color promedio del anillo exterior de la foto (el borde del plato) */
  function colorBorde(foto) {
    var c = document.createElement('canvas'), N = 48; c.width = c.height = N;
    var g = c.getContext('2d'); g.drawImage(foto, 0, 0, N, N);
    var d = g.getImageData(0, 0, N, N).data, r = 0, gr = 0, b = 0, n = 0;
    for (var y = 0; y < N; y++) for (var x = 0; x < N; x++) {
      var dx = (x + .5) / N * 2 - 1, dy = (y + .5) / N * 2 - 1, q = Math.sqrt(dx * dx + dy * dy);
      if (q < .86 || q > .97) continue;
      var k = (y * N + x) * 4; r += d[k]; gr += d[k + 1]; b += d[k + 2]; n++;
    }
    if (!n) return 0xeeeeee;
    return new THREE.Color(r / n / 255, gr / n / 255, b / n / 255).convertSRGBToLinear().multiplyScalar(.82);
  }
};
