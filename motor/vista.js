/* Menú 3D · cómo se ve el panel en este dispositivo:
   - diseño: automático, computadora o celular/tablet
   - colores: automático (según el dispositivo), claro u oscuro
   Se recuerda en este navegador. Va en el <head> para que la página no "salte" al cargar.
   Si la página tiene <div id="vista-ctrl">, ahí se ponen los selectores. */
(function () {
  'use strict';
  var CLAVE = 'menu3d-vista', v = {}, html = document.documentElement;
  try { v = JSON.parse(localStorage.getItem(CLAVE)) || {}; } catch (e) {}

  function aplicar() {
    if (v.tema === 'claro') html.setAttribute('data-theme', 'light');
    else if (v.tema === 'oscuro') html.setAttribute('data-theme', 'dark');
    else html.removeAttribute('data-theme');
    html.classList.toggle('modo-compu', v.modo === 'compu');
    html.classList.toggle('modo-celu', v.modo === 'celu');
  }
  aplicar();

  function controles(cont) {
    cont.innerHTML =
      '<select data-v="modo" aria-label="Diseño del panel"><option value="">Diseño automático</option><option value="compu">🖥 Computadora</option><option value="celu">📱 Celular / tablet</option></select>' +
      '<select data-v="tema" aria-label="Colores del panel"><option value="">Colores automáticos</option><option value="claro">☀ Claro</option><option value="oscuro">🌙 Oscuro</option></select>';
    [].forEach.call(cont.querySelectorAll('[data-v]'), function (s) {
      s.value = v[s.dataset.v] || '';
      s.onchange = function () {
        v[s.dataset.v] = s.value;
        try { localStorage.setItem(CLAVE, JSON.stringify(v)); } catch (e) {}
        aplicar();
      };
    });
  }

  document.addEventListener('DOMContentLoaded', function () {
    var c = document.getElementById('vista-ctrl'); if (c) controles(c);
    /* si los selectores están en un menú desplegable, se cierra al tocar afuera */
    var d = c && c.closest('details'); if (d) document.addEventListener('click', function (e) { if (d.open && !d.contains(e.target)) d.open = false; });
  });
})();
