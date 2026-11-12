/* Agenda fija de la sección "Hoy en Buenos Aires" (tarjeta #64). Pedido de Bautista, 12/11.

   Son actividades que se repiten siempre el mismo día de la semana y que la guía ya conoce.
   La sección "Hoy" junta tres cosas:
     1. Los lugares que funcionan solo algunos días ("only" en data/caba-extra.js y data/caba-boliches.js): ferias, La Bomba de Tiempo, boliches.
     2. Esta agenda: algo puntual que pasa un día fijo en un lugar de la guía.
     3. Los eventos del día de la agenda oficial de la Ciudad, si están cargados (data/hoy.json, tarjeta #65).

   Cada fila: { dias: [0 = domingo … 6 = sábado], franja: "dia" o "noche", lugar: id del lugar en la guía, que: qué pasa, fuente: dónde se confirmó }.
   Sin horarios exactos: la franja alcanza para saber si ya pasó. */
(() => {
  "use strict";
  const X = window.CITY_EXTRA && window.CITY_EXTRA.caba;
  if (!X) return;
  X.agenda = [
    { dias: [1], franja: "noche", lugar: "la-bomba-de-tiempo", que: "Show de percusión de los lunes", fuente: "data/caba-extra.js (only)" },
    { dias: [2], franja: "noche", lugar: "kika", que: "Fiesta internacional de los martes", fuente: "payperapp.io/guias-buenos-aires/mejores-boliches-buenos-aires (2026)" },
    { dias: [3], franja: "noche", lugar: "terrazas-del-este", que: "After office de los miércoles", fuente: "payperapp.io/venues/terrazas-del-este (2026)" },
    { dias: [4], franja: "noche", lugar: "tamarisco", que: "Peña folclórica de los jueves", fuente: "redes de Tamarisco (@tamariscobar)" },
    { dias: [4], franja: "noche", lugar: "niceto-club", que: "Noche de fiesta de los jueves", fuente: "payperapp.io/guias-buenos-aires/mejores-boliches-buenos-aires (2026)" }
  ];
})();
