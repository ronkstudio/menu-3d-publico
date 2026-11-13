/* Selector de ciudad (tarjeta #98).

   Cómo funciona:
   - La lista de ciudades está en data/ciudades.js.
   - La ciudad elegida se guarda en el dispositivo (igual que el idioma). Si no hay ninguna guardada, se abre la primera de la lista.
   - También se puede abrir una ciudad con un enlace: index.html?ciudad=berlin (queda guardada).
   - Este archivo se carga antes que js/app.js y trae solo los archivos de datos de la ciudad elegida.
   - Al cambiar de ciudad se recarga la página. El viaje, el perfil y el pasaporte se guardan aparte para cada ciudad.

   Desde el código: GUIA_CIUDAD.id (ciudad elegida), GUIA_CIUDAD.abrir() (muestra la lista), GUIA_CIUDAD.elegir(id). */
(() => {
  "use strict";
  const LISTA = window.GUIA_CIUDADES || [];
  const KEY = "guia.ciudad";
  const existe = id => LISTA.some(c => c.id === id);
  const guardada = () => { try { return localStorage.getItem(KEY); } catch (e) { return null; } };
  const guardar = id => { try { localStorage.setItem(KEY, id); } catch (e) { /* sin almacenamiento: vale solo hasta recargar */ } };

  let delEnlace = null;
  try { delEnlace = new URLSearchParams(location.search).get("ciudad"); } catch (e) { /* navegador viejo */ }
  if (existe(delEnlace)) guardar(delEnlace); else delEnlace = null;
  const id = delEnlace || (existe(guardada()) ? guardada() : (LISTA[0] || {}).id);
  const actual = LISTA.find(c => c.id === id) || { id: id, files: [] };

  /* Trae los datos de la ciudad elegida antes de que arranque la app. */
  document.write(actual.files.map(f => '<script src="data/' + f + '.js"><\/script>').join(""));

  const elegir = nueva => {
    if (!existe(nueva) || nueva === id) return;
    guardar(nueva);
    /* Se vuelve al inicio, sin el "?ciudad=" del enlace, para que no pise lo elegido. */
    if (location.search) { location.href = location.pathname + "#/"; return; }
    location.hash = "#/";
    location.reload();
  };

  /* ── La lista: se abre tocando el nombre de la ciudad en la barra de arriba ── */
  let dialogo = null;
  const abrir = () => {
    if (!dialogo) {
      dialogo = document.createElement("dialog");
      dialogo.className = "city-dialog";
      dialogo.setAttribute("aria-labelledby", "city-title");
      dialogo.innerHTML =
        '<div class="lang-head"><h2 id="city-title">Elegí tu ciudad</h2><button type="button" class="lang-close" data-city-close aria-label="Cerrar">✕</button></div>' +
        '<div class="city-list">' + LISTA.map(c =>
          '<button type="button" class="lang-opt city-opt' + (c.id === id ? " on" : "") + '" data-city="' + c.id + '" aria-pressed="' + (c.id === id) + '">' +
          '<em aria-hidden="true">' + c.flag + "</em><span><b>" + c.name + "</b><small>" + c.country + "</small></span><i aria-hidden=\"true\">" + (c.id === id ? "✓" : "") + "</i></button>").join("") + "</div>" +
        '<p class="lang-note">Tu viaje y tus lugares guardados quedan aparte para cada ciudad.</p>';
      dialogo.addEventListener("click", e => {
        const opt = e.target.closest("[data-city]");
        if (opt) { if (opt.getAttribute("data-city") === id) dialogo.close(); else elegir(opt.getAttribute("data-city")); return; }
        if (e.target === dialogo || e.target.closest("[data-city-close]")) dialogo.close();
      });
      document.body.appendChild(dialogo);
    }
    if (typeof dialogo.showModal === "function") dialogo.showModal(); else dialogo.setAttribute("open", "");
  };
  document.addEventListener("click", e => { if (e.target.closest && e.target.closest("#city-btn")) abrir(); });

  window.GUIA_CIUDAD = { id: id, actual: actual, lista: LISTA, elegir: elegir, abrir: abrir };
})();
