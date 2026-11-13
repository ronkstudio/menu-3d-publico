/* Datos complementarios de Berlín (tarjeta #99): sellos del pasaporte, lista de viaje, zonas para armar viajes, calendario y textos extra.
   Lo que depende de los lugares (nivel de recomendación, premios, días que cierran, fotos, estaciones, colecciones) se carga en la etapa 2.
   Las claves son los ids de los lugares (nombre en minúsculas, sin acentos, con guiones). */
window.CITY_EXTRA = window.CITY_EXTRA || {};
window.CITY_EXTRA.berlin = {
  tz: "Europe/Berlin",

  /* Pasaporte berlinés: sellos que se ganan marcando "Ya fui" en los lugares. Mismo formato que data/caba-extra.js. */
  stamps: [
    { id: "primer-paso", icon: "👣", name: "Primer paso", desc: "Visitá tu primer lugar", n: 1 },
    { id: "imperdibles", icon: "🏛️", name: "Lo esencial", desc: "5 imperdibles destacados", n: 5, cat: "ver", q: 3 },
    { id: "museos", icon: "🎨", name: "Ojo de museo", desc: "3 museos", n: 3, sub: "Museo" },
    { id: "verde", icon: "🌳", name: "Aire libre", desc: "3 parques o reservas", n: 3, sub: "Naturaleza" },
    { id: "noche", icon: "🍸", name: "Trasnochador", desc: "2 salidas de noche", n: 2, cat: "noche" },
    { id: "mercados", icon: "🛍️", name: "De mercado en mercado", desc: "Un mercado", n: 1, sub: "Mercado" },
    { id: "escapada", icon: "🚆", name: "Escapada", desc: "Una excursión fuera de la ciudad", n: 1, cat: "escapadas" },
    { id: "curioso", icon: "💎", name: "Fuera del circuito", desc: "Una joya oculta o un lugar de barrio", n: 1, tag: ["joya oculta", "vida de barrio"] },
    { id: "barrios", icon: "🏘️", name: "Explorador de barrios", desc: "Lugares en 5 barrios distintos", n: 5, barrios: true },
    { id: "honorario", icon: "🐻", name: "Berlinés honorario", desc: "20 lugares visitados", n: 20 }
  ],

  quality: {},
  awards: {},
  only: {},
  closed: {},

  /* Lista de preparación del viaje (se tilda y queda guardada en el dispositivo). */
  checklist: [
    { title: "Antes de viajar", items: [
      "Pasaporte o documento vigente, y una copia en el celular",
      "Seguro de viaje con cobertura médica",
      "Adaptador de enchufe tipo F (230 V)",
      "Avisar al banco que vas a usar la tarjeta en el exterior",
      "Reservar con tiempo la visita a la cúpula del Reichstag y los museos más pedidos",
      "Descargar esta guía y los mapas de Google sin conexión"
    ] },
    { title: "Al llegar", items: [
      "Comprar el boleto de transporte de las zonas ABC en el aeropuerto y sellarlo",
      "Sacar algo de efectivo en un cajero de banco",
      "Comprar un chip prepago o activar la eSIM",
      "Anotar la dirección del alojamiento y dejar el pasaporte ahí"
    ] }
  ],

  /* Zonas para el armado automático de viajes, en orden de prioridad. */
  zones: [
    { name: "Mitte y la Isla de los Museos", barrios: ["Mitte"] },
    { name: "Tiergarten y Charlottenburg", barrios: ["Tiergarten", "Charlottenburg"] },
    { name: "Kreuzberg y Friedrichshain", barrios: ["Kreuzberg", "Friedrichshain"] },
    { name: "Prenzlauer Berg", barrios: ["Prenzlauer Berg"] },
    { name: "Neukölln y Schöneberg", barrios: ["Neukölln", "Schöneberg"] }
  ],
  zonasDosDias: [["Mitte y Tiergarten", [0, 1]], ["Kreuzberg, Friedrichshain y Prenzlauer Berg", [2, 3]]],
  zonaChicos: 1,

  /* Palabras que la gente escribe → cómo figura en la guía. */
  synonyms: {
    desayuno: "cafe", brunch: "cafe", merienda: "cafe", cafeteria: "cafe", vegano: "vegetariano",
    hotel: "hospedaje", hoteles: "hospedaje", dormir: "hospedaje", alojamiento: "hospedaje", hostal: "hostel",
    ninos: "chicos", nenes: "chicos", familia: "chicos", familias: "chicos", barato: "economico", baratos: "economico", gratuito: "gratis",
    tragos: "cocteles", cocktail: "cocteles", cocktails: "cocteles", boliche: "club", bailar: "club", techno: "club",
    excursion: "excursiones", escapada: "excursiones", paseo: "caminar", shopping: "compras", regalos: "souvenirs",
    lluvia: "lluvia", llueve: "lluvia", techo: "lluvia", vista: "mirador", vistas: "mirador", guia: "tours", guias: "tours", visita: "tours",
    wall: "muro", mauer: "muro", cerveza: "cerveceria", birra: "cerveceria", kebab: "doner"
  },

  /* Calendario: fechas habituales, a confirmar cada año. m = meses (1-12). */
  events: [
    { m: [2], when: "Febrero", icon: "🎬", name: "Berlinale", desc: "El festival internacional de cine de Berlín, con funciones abiertas al público en toda la ciudad." },
    { m: [4, 5], when: "Fines de abril o mayo", icon: "🖼️", name: "Gallery Weekend", desc: "Un fin de semana en que las galerías de arte abren sus muestras nuevas, con entrada libre." },
    { m: [5], when: "1 de mayo", icon: "✊", name: "Día del Trabajador", desc: "Feriado con fiestas en la calle y manifestaciones, sobre todo en Kreuzberg. Hay cortes de tránsito." },
    { m: [5, 6], when: "Mayo o junio", icon: "🎉", name: "Carnaval de las Culturas", desc: "Cuatro días de desfile, música y comida de todo el mundo en Kreuzberg, el fin de semana de Pentecostés." },
    { m: [6], when: "21 de junio", icon: "🎶", name: "Fiesta de la Música", desc: "Música gratis en plazas, parques y esquinas de toda la ciudad." },
    { m: [7], when: "Julio", icon: "🏳️‍🌈", name: "Marcha del Orgullo (CSD)", desc: "Una de las marchas del orgullo más grandes de Europa, con desfile por el centro." },
    { m: [8], when: "Fines de agosto", icon: "🌙", name: "Larga Noche de los Museos", desc: "Un sábado al año, decenas de museos abren hasta la madrugada con una sola entrada." },
    { m: [9], when: "Septiembre", icon: "🏃", name: "Maratón de Berlín", desc: "Una de las maratones más rápidas del mundo; hay cortes de tránsito ese domingo." },
    { m: [10], when: "3 de octubre", icon: "🇩🇪", name: "Día de la Unidad Alemana", desc: "Feriado nacional: comercios cerrados y festejos cerca de la Puerta de Brandeburgo." },
    { m: [10], when: "Octubre", icon: "💡", name: "Festival de las Luces", desc: "Los edificios más conocidos se iluminan con proyecciones durante varias noches." },
    { m: [11], when: "9 de noviembre", icon: "🧱", name: "Aniversario de la caída del Muro", desc: "Actos y recorridos en el Memorial del Muro y a lo largo del antiguo trazado." },
    { m: [11, 12], when: "Fines de noviembre y diciembre", icon: "🎄", name: "Mercados de Navidad", desc: "Decenas de mercados con vino caliente, comida y artesanías en plazas de toda la ciudad." },
    { m: [12], when: "31 de diciembre", icon: "🎆", name: "Fin de año", desc: "Fiesta al aire libre en la Puerta de Brandeburgo y fuegos artificiales. El transporte funciona toda la noche." }
  ],

  /* Bloques extra para Info práctica. */
  practicalMore: [
    { icon: "🗣️", title: "Palabras que vas a ver", items: [
      { t: "Eingang · Ausgang", d: "Entrada y salida." },
      { t: "Geöffnet · Geschlossen", d: "Abierto y cerrado." },
      { t: "Gleis · Bahnsteig", d: "Vía y andén, en las estaciones." },
      { t: "Fahrkarte · Entwerter", d: "Boleto, y la maquinita donde se sella." },
      { t: "Späti", d: "Kiosco de barrio que abre hasta tarde: bebidas, golosinas y algo de almacén." },
      { t: "Pfand", d: "El depósito que pagás por botellas y latas, y que te devuelven." },
      { t: "Nur Barzahlung", d: "Solo efectivo." }
    ] },
    { icon: "🏥", title: "Salud y farmacias", items: [
      { t: "Urgencias", d: "Llamá al 112. Los hospitales grandes tienen guardia las 24 horas." },
      { t: "Si no es urgente", d: "El 116 117 es el servicio médico de guardia: te orientan y te dicen a dónde ir." },
      { t: "Farmacias", d: "Se llaman Apotheke. De noche y los domingos hay farmacias de turno; la lista está en la puerta de cualquier farmacia." },
      { t: "Seguro de viaje", d: "Muy recomendable: la atención es muy buena, pero cara sin cobertura." }
    ] },
    { icon: "🔍", title: "Cómo elegimos los lugares", items: [
      { t: "Selección", d: "La guía incluye solo lugares con reputación sostenida: premios, distinciones oficiales y buen consenso en reseñas públicas." },
      { t: "Niveles", d: "'Destacado' son los mejores de su categoría, 'Muy recomendado' es una apuesta segura y 'Buena opción' cumple bien pero no es imprescindible." },
      { t: "Opiniones al día", d: "En cada ficha, el botón 'Opiniones y horarios' abre el lugar en Google Maps con su puntaje, reseñas y horarios actualizados." },
      { t: "Precios", d: "Usamos niveles ($ a $$$$) en vez de montos porque los precios cambian seguido." }
    ] }
  ],

  photos: {},
  stations: {}
};
