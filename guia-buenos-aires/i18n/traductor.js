/* Traductor de toda la app.

   Cómo funciona:
   - La app se escribe en español. Cada idioma tiene un diccionario en i18n/dict/<código>.js: { "texto en español": "traducción" }.
   - Este archivo mira todo lo que aparece en pantalla y cambia cada texto por su traducción. También placeholders, etiquetas y avisos.
   - Lo que no está en el diccionario queda en español (nombres de lugares, direcciones y barrios no se traducen a propósito).
   - Los textos con números ("Día 3", "5 lugares guardados") se resuelven con las reglas de "__re" del diccionario.
   - Solo se carga el diccionario del idioma elegido.

   Para sumar o corregir una traducción: editar el diccionario de ese idioma. La clave es el texto en español, tal cual se ve. */
(() => {
  "use strict";
  const lang = (window.I18N && window.I18N.lang) || "es";
  if (lang === "es") return;

  /* Carga el diccionario antes de que arranque la app (este archivo se carga antes que js/app.js). */
  document.write('<script src="i18n/dict/' + lang + '.js"><\/script>');

  const MESES = ["enero", "febrero", "marzo", "abril", "mayo", "junio", "julio", "agosto", "septiembre", "octubre", "noviembre", "diciembre"];
  const FECHA = /^(lunes|martes|mi[eé]rcoles|jueves|viernes|s[aá]bado|domingo),? (\d{1,2}) de ([a-z]+)$/i;
  const FECHA2 = /^(lunes|martes|mi[eé]rcoles|jueves|viernes|s[aá]bado|domingo) (\d{1,2})\/(\d{1,2})$/i;
  const falta = new Set();
  let D = null, RE = null;

  const prep = () => {
    if (D) return true;
    if (!window.I18N_FULL) return false;
    D = window.I18N_FULL;
    RE = (D.__re || []).map(r => [new RegExp(r[0]), r[1]]);
    return true;
  };

  /* Una fecha escrita como "jueves 12 de noviembre" se arma con el formato propio de cada idioma. */
  const fecha = s => {
    const m = FECHA.exec(s);
    if (!m) return null;
    const mes = MESES.indexOf(m[3].toLowerCase());
    if (mes < 0) return null;
    const hoy = new Date();
    let d = new Date(hoy.getFullYear(), mes, +m[2]);
    if (d < new Date(hoy.getFullYear(), hoy.getMonth() - 6, 1)) d = new Date(hoy.getFullYear() + 1, mes, +m[2]);
    try {
      const t = new Intl.DateTimeFormat(lang, { weekday: "long", day: "numeric", month: "long" }).format(d);
      return s === s.toUpperCase() ? t.toUpperCase() : t;
    } catch (e) { return null; }
  };

  /* Lista de días o cosas separadas por comas e "y": se traduce cada parte. */
  /* Si la lista termina con punto ("jueves, viernes, sábados."), el punto se separa para poder traducir el último día. */
  const lista = s => {
    const fin = /\.$/.test(s) ? "." : "";
    return s.replace(/\.$/, "").split(/, | y /).map(x => (Object.prototype.hasOwnProperty.call(D, x) ? D[x] : x)).join(", ") + fin;
  };
  const uno = s => {
    if (Object.prototype.hasOwnProperty.call(D, s)) return D[s];
    for (let i = 0; i < RE.length; i++) {
      const m = RE[i][0].exec(s);
      /* En la traducción, $1 copia lo capturado y {1} lo traduce (sirve para listas de días). */
      if (m) return RE[i][1].replace(/\$(\d)/g, (_, n) => m[+n] || "").replace(/\{(\d)\}/g, (_, n) => lista(m[+n] || ""));
    }
    const f2 = FECHA2.exec(s);
    if (f2) {
      const hoy = new Date(); let d = new Date(hoy.getFullYear(), +f2[3] - 1, +f2[2]);
      if (d < new Date(hoy.getFullYear(), hoy.getMonth() - 6, 1)) d = new Date(hoy.getFullYear() + 1, +f2[3] - 1, +f2[2]);
      try { return new Intl.DateTimeFormat(lang, { weekday: "long" }).format(d) + " " + f2[2] + "/" + f2[3]; } catch (e) { return null; }
    }
    return fecha(s);
  };

  /* Traduce un texto. Prueba entero; si no, sin los íconos de adelante y atrás; si no, por partes separadas con " · ". */
  const tr = s => {
    const m = /^(\s*)([\s\S]*?)(\s*)$/.exec(s), core = m[2].replace(/\s+/g, " ");
    if (!core || !/[A-Za-zÁÉÍÓÚÑáéíóúñ]/.test(core)) return s;
    let t = uno(core);
    if (t == null) {
      const p = /^([^\p{L}\p{N}¿¡$]*)([\s\S]*?)([^\p{L}\p{N}?!.)%°$]*)$/u.exec(core);
      if (p && p[2] && p[2] !== core) { const x = uno(p[2]); if (x != null) t = p[1] + x + p[3]; }
    }
    if (t == null && core.indexOf(" · ") > -1) {
      let alguno = false;
      const partes = core.split(" · ").map(x => { const y = tr(x); if (y !== x) alguno = true; return y; });
      if (alguno) t = partes.join(" · ");
    }
    if (t == null) { if (core.length < 400) falta.add(core); return s; }
    return m[1] + t + m[3];
  };

  const ATR = ["placeholder", "aria-label", "title", "alt"];
  const SALTAR = { SCRIPT: 1, STYLE: 1, TEXTAREA: 1 };
  const nodo = n => {
    if (n.nodeType === 3) {
      const v = n.nodeValue;
      if (n.__t === v) return;
      const t = tr(v);
      n.__t = t;
      if (t !== v) n.nodeValue = t;
      return;
    }
    if (n.nodeType !== 1 || SALTAR[n.tagName] || n.closest(".leaflet-tile-pane, .lang-dialog, [data-notr]")) return;
    ATR.forEach(a => {
      const v = n.getAttribute && n.getAttribute(a);
      if (!v || n["__a" + a] === v) return;
      const t = tr(v);
      n["__a" + a] = t;
      if (t !== v) n.setAttribute(a, t);
    });
    for (let c = n.firstChild; c; c = c.nextSibling) nodo(c);
  };

  const todo = () => { if (prep()) { nodo(document.body); const t = tr(document.title); if (t !== document.title) document.title = t; } };

  const arrancar = () => {
    todo();
    new MutationObserver(ms => {
      if (!prep()) return;
      ms.forEach(m => {
        if (m.type === "characterData") nodo(m.target);
        else if (m.type === "attributes") nodo(m.target);
        else m.addedNodes.forEach(nodo);
      });
      const t = tr(document.title); if (t !== document.title) document.title = t;
    }).observe(document.body, { childList: true, subtree: true, characterData: true, attributes: true, attributeFilter: ATR });
  };
  if (document.readyState === "loading") document.addEventListener("DOMContentLoaded", arrancar); else arrancar();

  /* Los carteles de confirmación del navegador también se traducen. */
  ["confirm", "alert"].forEach(k => { const f = window[k]; window[k] = msg => f.call(window, prep() ? tr(String(msg)) : msg); });

  if (window.I18N) { window.I18N.tr = s => (prep() ? tr(s) : s); window.I18N.falta = falta; }
})();
