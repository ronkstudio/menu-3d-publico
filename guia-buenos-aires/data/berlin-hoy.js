/* Agenda fija de la sección "Hoy en Berlín" (tarjeta #99). Mismo formato que data/caba-hoy.js.

   La sección "Hoy" junta tres cosas:
     1. Los lugares que funcionan solo algunos días ("only" en data/berlin-extra.js). Se cargan en la etapa 2.
     2. Esta agenda: algo puntual que pasa un día fijo en un lugar de la guía. Se carga en la etapa 2, cuando estén los lugares.
     3. Los eventos del día de la agenda cultural abierta de Berlín (data/hoy-berlin.json, que arma herramientas/armar-hoy-berlin.ps1).

   Cada fila de agenda: { dias: [0 = domingo … 6 = sábado], franja: "dia" o "noche", lugar: id del lugar en la guía, que: qué pasa, fuente }.
   Cada destacado: { desde: "AAAA-MM-DD", hasta (opcional), franja, t: qué es, lugar, barrio, url, fuente }. Se muestran solos el día que corresponde. */
(() => {
  "use strict";
  const X = window.CITY_EXTRA && window.CITY_EXTRA.berlin;
  if (!X) return;
  X.agenda = [];
  X.destacados = [];
})();
