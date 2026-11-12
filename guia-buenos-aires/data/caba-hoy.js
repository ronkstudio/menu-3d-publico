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

  /* Destacados elegidos a mano (pedido de Bautista, 12/11/2026): planes que no están en la agenda oficial de la Ciudad,
     sacados de agendas y redes donde se difunden (Time Out, Resident Advisor, cuentas de Instagram de los lugares).
     Instagram no se puede leer de forma automática: lo que se vea ahí se carga acá a mano, con su enlace.
     Cada fila: { desde: "AAAA-MM-DD", hasta: "AAAA-MM-DD" (opcional), franja: "dia" o "noche", t: qué es, lugar, barrio, url, fuente }.
     Se muestran solos el día que corresponde y desaparecen después: no hace falta borrarlos. */
  X.destacados = [
    { desde: "2026-11-13", franja: "noche", t: "Sven Väth: previa de Creamfields", lugar: "Deseo", barrio: "Agronomía", url: "https://ra.co/events/2561828", fuente: "Resident Advisor, revisado 12/11/2026" },
    { desde: "2026-11-14", franja: "noche", t: "NEXO vol. 17 con Hobin Rude", lugar: "The Lift 1967", barrio: "Palermo", url: "https://ra.co/events/2566852", fuente: "Resident Advisor, revisado 12/11/2026" },
    { desde: "2026-11-15", franja: "dia", t: "House Music Sessions al atardecer", lugar: "Hipódromo de Palermo", barrio: "Palermo", url: "https://ra.co/events/2576149", fuente: "Resident Advisor, revisado 12/11/2026" },
    { desde: "2026-11-15", franja: "noche", t: "De clú en clú: comedia con 25 vecinos y música en vivo", lugar: "Centro Cultural 25 de Mayo", barrio: "Villa Urquiza", url: "https://www.timeout.com/es/buenos-aires/agenda-semana", fuente: "Time Out, revisado 12/11/2026" }
  ];
})();
