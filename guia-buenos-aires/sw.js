/* Service worker: deja la guía disponible sin conexión.
   Estrategia: primero la red (para tener siempre la última versión) y, si no hay conexión, la copia guardada.
   Las fotos y los mapas se guardan a medida que se ven. */
var CACHE = "guia-v25";
var SHELL = ["index.html", "css/styles.css", "js/app.js", "i18n/i18n.js", "i18n/traductor.js", "i18n/es.js", "i18n/en.js", "i18n/pt.js", "i18n/fr.js", "i18n/it.js", "i18n/de.js", "i18n/zh.js", "i18n/ja.js", "data/caba.js", "data/caba-coords.js", "data/caba-extra.js", "data/caba-zones.js", "data/caba-mas.js", "data/caba-boliches.js", "data/caba-hoy.js", "data/caba-local.js", "config.js", "icon.svg", "manifest.webmanifest"];

/* Se guarda archivo por archivo: si uno falla, los demás igual quedan guardados.
   (Antes se pedía también la carpeta "./", que en algunos servidores daba error 404 y frenaba todo.) */
self.addEventListener("install", function (e) {
  e.waitUntil(caches.open(CACHE).then(function (c) {
    return Promise.all(SHELL.map(function (f) { return c.add(f).catch(function () { /* se guardará cuando se abra */ }); }));
  }).then(function () { return self.skipWaiting(); }));
});
self.addEventListener("activate", function (e) {
  e.waitUntil(caches.keys().then(function (keys) {
    return Promise.all(keys.filter(function (k) { return k !== CACHE; }).map(function (k) { return caches.delete(k); }));
  }).then(function () { return self.clients.claim(); }));
});
self.addEventListener("fetch", function (e) {
  var req = e.request;
  if (req.method !== "GET") return;
  var url = new URL(req.url);
  var cacheable = url.origin === location.origin || /wikimedia\.org|cdnjs\.cloudflare\.com|tile\.openstreetmap\.org|fonts\.googleapis\.com|fonts\.gstatic\.com/.test(url.hostname);
  if (!cacheable) return; // clima y cotización: la app guarda su propia copia
  e.respondWith(
    /* "no-cache": siempre le pregunta al servidor si hay algo nuevo, así un cambio publicado se ve enseguida. */
    (url.origin === location.origin ? fetch(req.mode === "navigate" ? url.href : req, { cache: "no-cache" }) : fetch(req)).then(function (res) {
      if (res && (res.ok || res.type === "opaque")) {
        var copy = res.clone();
        caches.open(CACHE).then(function (c) { c.put(req, copy); });
      }
      return res;
    }).catch(function () {
      return caches.match(req, { ignoreSearch: url.origin === location.origin }).then(function (hit) {
        return hit || (req.mode === "navigate" ? caches.match("index.html") : Response.error());
      });
    })
  );
});
