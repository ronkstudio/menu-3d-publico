/* Idiomas de la guía (tarjeta #39).

   Cómo funciona:
   - Cada idioma tiene su archivo en esta carpeta (es.js, en.js…), con los mismos nombres de texto.
   - En index.html, un elemento con data-i18n="nombre" recibe ese texto. Con data-i18n-aria, lo recibe su aria-label.
   - Desde el código: I18N.t("nombre").
   - Si a un idioma le falta un texto, se muestra el de español.
   - El idioma elegido se guarda en el dispositivo. La primera vez se usa el del celular, si lo tenemos.

   Para sumar un idioma: copiar es.js con el código nuevo, traducirlo, cargarlo en index.html y en sw.js, y agregarlo a LANGS. */
(() => {
  "use strict";

  const TEXTOS = window.I18N_TEXTOS || {};
  /* Código, nombre en su propio idioma, y si ya lo revisó una persona que lo habla. */
  const LANGS = [
    { code: "es", name: "Español", revisado: true },
    { code: "en", name: "English", revisado: false },
    { code: "pt", name: "Português", revisado: false },
    { code: "fr", name: "Français", revisado: false },
    { code: "it", name: "Italiano", revisado: false },
    { code: "de", name: "Deutsch", revisado: false },
    { code: "zh", name: "中文", revisado: false },
    { code: "ja", name: "日本語", revisado: false }
  ].filter(l => TEXTOS[l.code]);
  const KEY = "guia.idioma";

  const disponible = c => LANGS.some(l => l.code === c);
  const guardado = () => { try { return localStorage.getItem(KEY); } catch (e) { return null; } };
  const delCelular = () => {
    const lista = navigator.languages && navigator.languages.length ? navigator.languages : [navigator.language || "es"];
    for (const l of lista) {
      const c = String(l).slice(0, 2).toLowerCase();
      if (disponible(c)) return c;
    }
    return "es";
  };
  const lang = disponible(guardado()) ? guardado() : delCelular();

  const t = k => {
    const propio = TEXTOS[lang] && TEXTOS[lang][k];
    if (propio != null && propio !== "") return propio;
    const base = TEXTOS.es && TEXTOS.es[k];
    return base != null ? base : k;
  };

  const aplicar = raiz => {
    const r = raiz || document;
    r.querySelectorAll("[data-i18n]").forEach(el => { el.textContent = t(el.getAttribute("data-i18n")); });
    r.querySelectorAll("[data-i18n-aria]").forEach(el => { el.setAttribute("aria-label", t(el.getAttribute("data-i18n-aria"))); });
  };

  const elegir = c => {
    if (!disponible(c) || c === lang) return;
    try { localStorage.setItem(KEY, c); } catch (e) { /* sin almacenamiento: vale solo hasta recargar */ }
    location.reload();
  };

  /* ── Selector: un botón en la barra de arriba que abre la lista ── */
  let dialogo = null;
  const abrir = () => {
    if (!dialogo) {
      dialogo = document.createElement("dialog");
      dialogo.className = "lang-dialog";
      dialogo.setAttribute("aria-labelledby", "lang-title");
      const nota = TEXTOS[lang] && TEXTOS[lang]["idioma.nota"];
      dialogo.innerHTML =
        '<div class="lang-head"><h2 id="lang-title"></h2><button type="button" class="lang-close" data-lang-close>✕</button></div>' +
        '<div class="lang-list">' + LANGS.map(l =>
          '<button type="button" class="lang-opt' + (l.code === lang ? " on" : "") + '" lang="' + l.code + '" data-lang="' + l.code + '" aria-pressed="' + (l.code === lang) + '">' +
          "<span>" + l.name + "</span><i aria-hidden=\"true\">" + (l.code === lang ? "✓" : "") + "</i></button>").join("") + "</div>" +
        (nota ? '<p class="lang-note"></p>' : "");
      dialogo.querySelector("#lang-title").textContent = t("idioma.titulo");
      dialogo.querySelector("[data-lang-close]").setAttribute("aria-label", t("idioma.cerrar"));
      if (nota) dialogo.querySelector(".lang-note").textContent = nota;
      dialogo.addEventListener("click", e => {
        const opt = e.target.closest("[data-lang]");
        if (opt) return elegir(opt.getAttribute("data-lang"));
        if (e.target === dialogo || e.target.closest("[data-lang-close]")) dialogo.close();
      });
      document.body.appendChild(dialogo);
    }
    if (typeof dialogo.showModal === "function") dialogo.showModal(); else dialogo.setAttribute("open", "");
  };

  const ponerBoton = () => {
    const cuenta = document.getElementById("account-btn");
    if (!cuenta || document.getElementById("lang-btn")) return;
    const b = document.createElement("button");
    b.type = "button";
    b.id = "lang-btn";
    b.className = "lang-btn";
    b.setAttribute("aria-label", t("idioma.abrir"));
    b.setAttribute("aria-haspopup", "dialog");
    b.innerHTML = '<span aria-hidden="true">🌐</span><b>' + lang.toUpperCase() + "</b>";
    b.addEventListener("click", abrir);
    cuenta.parentNode.insertBefore(b, cuenta);
  };

  document.documentElement.lang = lang;
  document.title = t("titulo");
  /* app.js vuelve a escribir el título en español al arrancar: lo corregimos cuando termina de cargar. */
  if (lang !== "es") window.addEventListener("load", () => { document.title = t("titulo"); });
  aplicar();
  ponerBoton();

  window.I18N = { lang, langs: LANGS, t, aplicar, elegir, abrir };
})();
