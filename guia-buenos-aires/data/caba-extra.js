/* Datos complementarios de Buenos Aires: nivel de recomendación, reconocimientos, días de apertura,
   fotos, estaciones de subte, zonas para armar viajes, calendario y textos extra.
   Las claves son los ids de los lugares (nombre en minúsculas, sin acentos, con guiones). */
window.CITY_EXTRA = window.CITY_EXTRA || {};
window.CITY_EXTRA.caba = {
  tz: "America/Argentina/Buenos_Aires",

  /* Pasaporte porteño (tarjeta #37): sellos que se ganan marcando "Ya fui" en los lugares.
     n = cuántos lugares hacen falta. Se puede filtrar por cat (categoría), sub (tipo), tag (alguna de esas etiquetas)
     o q (nivel mínimo de recomendación). "barrios: true" cuenta barrios distintos en vez de lugares. */
  stamps: [
    { id: "primer-paso", icon: "👣", name: "Primer paso", desc: "Visitá tu primer lugar", n: 1 },
    { id: "imperdibles", icon: "🏛️", name: "Lo esencial", desc: "5 imperdibles destacados", n: 5, cat: "ver", q: 3 },
    { id: "parrillero", icon: "🥩", name: "Parrillero", desc: "2 parrillas", n: 2, sub: "Parrilla" },
    { id: "pizza", icon: "🍕", name: "Muzza y fainá", desc: "2 pizzerías", n: 2, sub: "Pizzería" },
    { id: "cafetero", icon: "☕", name: "Habitué", desc: "3 cafés notables", n: 3, sub: "Café notable" },
    { id: "dulce", icon: "🍦", name: "Dulce de leche", desc: "Una heladería", n: 1, sub: "Heladería" },
    { id: "tanguero", icon: "💃", name: "Tanguero", desc: "Un lugar de tango", n: 1, tag: ["tango"] },
    { id: "museos", icon: "🎨", name: "Ojo de museo", desc: "3 museos", n: 3, sub: "Museo" },
    { id: "verde", icon: "🌳", name: "Aire libre", desc: "3 parques o reservas", n: 3, sub: "Naturaleza" },
    { id: "hincha", icon: "⚽", name: "Hincha", desc: "Una cancha de fútbol", n: 1, sub: "Fútbol" },
    { id: "noche", icon: "🍸", name: "Trasnochador", desc: "2 salidas de noche", n: 2, cat: "noche" },
    { id: "feriante", icon: "🛍️", name: "Feriante", desc: "Una feria", n: 1, sub: "Feria" },
    { id: "escapada", icon: "🚤", name: "Escapada", desc: "Una excursión fuera de la ciudad", n: 1, cat: "escapadas" },
    { id: "curioso", icon: "💎", name: "Fuera del circuito", desc: "Una joya oculta o un lugar de barrio", n: 1, tag: ["joya oculta", "vida de barrio"] },
    { id: "barrios", icon: "🏘️", name: "Explorador de barrios", desc: "Lugares en 5 barrios distintos", n: 5, barrios: true },
    { id: "porteno", icon: "🧉", name: "Porteño honorario", desc: "20 lugares visitados", n: 20 }
  ],

  /* Nivel de recomendación de la guía. Lo que no figura acá es 2 ("Muy recomendado").
     Criterio: reputación sostenida, premios y consenso de reseñas públicas. No es un puntaje en vivo. */
  quality: {
    3: ["plaza-de-mayo-y-casa-rosada", "obelisco-y-avenida-corrientes", "teatro-colon", "cementerio-de-la-recoleta", "el-ateneo-grand-splendid", "caminito",
      "san-telmo-y-la-feria-de-los-domingos", "bosques-de-palermo-y-rosedal", "malba", "museo-nacional-de-bellas-artes", "palacio-barolo", "puerto-madero-y-puente-de-la-mujer",
      "reserva-ecologica-costanera-sur", "jardin-japones", "mercado-de-san-telmo", "palacio-libertad-ex-cck",
      "don-julio", "parrilla-pena", "pizzeria-guerrin", "el-cuartito", "el-preferido-de-palermo", "cafe-tortoni", "las-violetas", "cadore", "aramburu", "mishiguene", "anchoita", "gran-dabbang", "la-mezzetta",
      "floreria-atlantico", "tres-monos", "la-catedral-club", "salon-canning", "la-bomba-de-tiempo", "funcion-en-el-teatro-colon",
      "free-walking-tours-a-la-gorra", "visita-guiada-al-teatro-colon", "visita-al-palacio-barolo",
      "tigre-y-delta-del-parana", "colonia-del-sacramento-uruguay", "san-antonio-de-areco",
      "alvear-palace-hotel", "palacio-duhau-park-hyatt", "four-seasons-buenos-aires", "faena-hotel", "home-hotel", "america-del-sur-hostel",
      "feria-de-mataderos", "palermo-soho",
      "campo-argentino-de-polo", "hipodromo-de-palermo", "kayak-y-remo-en-el-delta", "sintaxis", "trescha", "crizia", "mengano", "la-alacena-trattoria",
      "catedral-metropolitana", "palacio-de-aguas-corrientes", "teatro-ciego", "espacio-memoria-y-derechos-humanos-ex-esma", "abasto-shopping", "teatro-gran-rex"],
    1: ["lucciano-s", "desnivel", "banchero", "ibis-buenos-aires-obelisco", "calle-florida", "montevideo-uruguay", "lujan", "capilla-del-senor", "chascomus",
      "alquiler-temporario", "patio-bullrich", "avenida-santa-fe", "circus-hostel-hotel", "play-hostel", "bus-turistico", "guias-de-turismo-habilitados",
      "havanna", "autodromo-oscar-y-juan-galvez", "mcdonald-s-kosher-del-abasto", "plaza-liniers-shopping", "caballito-shopping", "devoto-shopping", "portal-palermo",
      "plaza-de-los-ninos", "plaza-villa-real", "plaza-monte-castro", "plaza-derechos-del-hombre", "plaza-velez-sarsfield", "plaza-villa-santa-rita", "plaza-martin-fierro",
      "lago-lugano", "museo-manoblanca", "barrio-de-once", "salas-de-escape"]
  },

  /* Comer con una condición. "diet": para qué dietas sirve cada lugar. "dietFull": lugares 100 % dedicados
     (todo el local es vegano, sin TACC o kosher). Los demás tienen buenas opciones, pero no son exclusivos.
     Sin TACC y kosher: solo lugares que una fuente describe como dedicados. La app avisa siempre que hay que confirmar en el local. */
  diet: {
    "sacro": ["vegano", "vegetariano"], "donnet": ["vegano", "vegetariano"], "la-reverde-parrillita-vegana": ["vegano", "vegetariano"],
    "buenos-aires-verde": ["vegano", "vegetariano", "sin TACC"],
    "sintaxis": ["sin TACC"], "la-union-gluten-free": ["sin TACC"],
    "mcdonald-s-kosher-del-abasto": ["kosher"], "al-galope": ["kosher"],
    "narda-comedor": ["vegetariano"], "gran-dabbang": ["vegetariano"], "sarkis": ["vegetariano"], "proper": ["vegetariano"], "la-alacena-trattoria": ["vegetariano"],
    "mercat-villa-crespo": ["vegetariano"], "mercado-de-belgrano": ["vegetariano"],
    "siamo-nel-forno": ["vegetariano"], "pizzeria-guerrin": ["vegetariano"], "el-cuartito": ["vegetariano"], "las-cuartetas": ["vegetariano"], "la-mezzetta": ["vegetariano"], "banchero": ["vegetariano"]
  },
  dietFull: ["sacro", "donnet", "la-reverde-parrillita-vegana", "sintaxis", "la-union-gluten-free", "mcdonald-s-kosher-del-abasto", "al-galope"],

  /* Reconocimientos verificables. Michelin y 50 Best Bars: ediciones 2026. */
  awards: {
    "trescha": ["Guía Michelin 2026 · 1 estrella"],
    "crizia": ["Guía Michelin 2026 · 1 estrella"],
    "mengano": ["Bib Gourmand Michelin 2026"],
    "anafe": ["Bib Gourmand Michelin 2026"],
    "caseros": ["Bib Gourmand Michelin 2026"],
    "la-alacena-trattoria": ["Bib Gourmand Michelin 2026"],
    "mn-santa-ines": ["Bib Gourmand Michelin 2026"],
    "ajo-negro": ["Bib Gourmand Michelin 2026"],
    "espacio-memoria-y-derechos-humanos-ex-esma": ["Patrimonio Mundial UNESCO"],
    "aramburu": ["Guía Michelin 2026 · 2 estrellas"],
    "don-julio": ["Guía Michelin 2026 · 1 estrella"],
    "tres-monos": ["N.º 21 en The World's 50 Best Bars 2026"],
    "floreria-atlantico": ["Top 5 de The World's 50 Best Bars (2019 y 2021)"],
    "cafe-tortoni": ["Bar Notable de la Ciudad"],
    "las-violetas": ["Bar Notable de la Ciudad"],
    "la-biela": ["Bar Notable de la Ciudad"],
    "los-galgos": ["Bar Notable de la Ciudad"],
    "bar-el-federal": ["Bar Notable de la Ciudad"],
    "el-gato-negro": ["Bar Notable de la Ciudad"],
    "confiteria-la-ideal": ["Bar Notable de la Ciudad"],
    "cafe-de-los-angelitos": ["Bar Notable de la Ciudad"],
    "miramar": ["Bar Notable de la Ciudad"],
    "cafe-de-garcia": ["Bar Notable de la Ciudad"],
    "cafe-margot": ["Bar Notable de la Ciudad"],
    "la-flor-de-barracas": ["Bar Notable de la Ciudad"],
    "colonia-del-sacramento-uruguay": ["Patrimonio Mundial UNESCO"],
    "la-plata": ["Casa Curutchet: Patrimonio Mundial UNESCO"],
    "teatro-colon": ["Monumento Histórico Nacional"],
    "palacio-barolo": ["Monumento Histórico Nacional"],
    "plaza-de-mayo-y-casa-rosada": ["Monumento Histórico Nacional"],
    "galerias-pacifico": ["Monumento Histórico Nacional"]
  },

  /* Días habituales (0 = domingo … 6 = sábado). "only": solo funciona esos días. "closed": suele cerrar esos días. */
  only: {
    "san-telmo-y-la-feria-de-los-domingos": [0],
    "feria-de-mataderos": [0],
    "feria-de-plaza-francia": [6, 0],
    "feria-de-plaza-serrano": [6, 0],
    "la-bomba-de-tiempo": [1],
    "museo-criollo-de-los-corrales": [0],
    "colon-fabrica": [5, 6, 0]
  },
  closed: {
    "coleccion-fortabat": [1, 2],
    "malba": [2],
    "museo-nacional-de-bellas-artes": [1],
    "reserva-ecologica-costanera-sur": [1],
    "jardin-botanico-carlos-thays": [1],
    "fundacion-proa": [1, 2],
    "museo-de-arte-moderno": [2],
    "museo-nacional-de-arte-decorativo": [1],
    "museo-evita": [1],
    "mercado-de-pulgas": [1]
  },

  /* Colecciones del inicio: cada una abre Explorar con un filtro. "cover" es el lugar del que se toma la foto. */
  collections: [
    { name: "Clásicos porteños", icon: "🎩", filter: { q: "clásico" }, cover: "cafe-tortoni" },
    { name: "Joyas menos conocidas", icon: "💎", filter: { q: "joya oculta" }, cover: "pasaje-lanin" },
    { name: "Buenos Aires gratis", icon: "💸", filter: { prices: [0] }, cover: "reserva-ecologica-costanera-sur" },
    { name: "Ruta del tango", icon: "💃", filter: { q: "tango" }, cover: "cafe-de-los-angelitos" },
    { name: "Miradores y terrazas", icon: "🌇", filter: { q: "mirador" }, cover: "palacio-barolo" },
    { name: "Arte y museos", icon: "🎨", filter: { q: "arte" }, cover: "malba" },
    { name: "Cafés notables", icon: "☕", filter: { cat: "comer", sub: "Café notable" }, cover: "las-violetas" },
    { name: "Pizza porteña", icon: "🍕", filter: { cat: "comer", sub: "Pizzería" }, cover: "obelisco-y-avenida-corrientes" },
    { name: "Para futboleros", icon: "⚽", filter: { q: "fútbol" }, cover: "la-bombonera-y-museo-de-la-pasion-boquense" },
    { name: "Con chicos", icon: "🧒", filter: { q: "chicos" }, cover: "planetario-galileo-galilei" },
    { name: "Vegetariano y vegano", icon: "🥬", filter: { diets: ["vegetariano"] }, cover: "" },
    { name: "Sin TACC", icon: "🌾", filter: { diets: ["sin TACC"] }, cover: "" },
    { name: "Deportes", icon: "⚽", filter: { cat: "deporte" }, cover: "" },
    { name: "Shoppings", icon: "🛍️", filter: { cat: "compras", sub: "Shopping" }, cover: "galerias-pacifico" },
    { name: "Cine y teatro", icon: "🎭", filter: { cat: "ocio" }, cover: "teatros-de-la-avenida-corrientes" },
    { name: "Barrios fuera del circuito", icon: "🏘️", filter: { q: "vida de barrio" }, cover: "" },
    { name: "Noche LGBT+", icon: "🏳️‍🌈", filter: { q: "lgbt+" }, cover: "" },
    { name: "Aire libre", icon: "🌳", filter: { q: "naturaleza" }, cover: "bosques-de-palermo-y-rosedal" },
    { name: "Días de lluvia", icon: "🌧️", filter: { q: "lluvia" }, cover: "el-ateneo-grand-splendid" },
    { name: "Alta cocina", icon: "🍷", filter: { cat: "comer", sub: "De autor" }, cover: "don-julio" }
  ],

  /* Lista de preparación del viaje (se tilda y queda guardada en el dispositivo). */
  checklist: [
    { title: "Antes de viajar", items: [
      "Pasaporte o documento vigente, y una copia en el celular",
      "Seguro de viaje con cobertura médica",
      "Adaptador de enchufe tipo I (220 V)",
      "Avisar al banco que vas a usar la tarjeta en el exterior",
      "Reservar con tiempo: Don Julio, Teatro Colón, shows de tango, ferry a Colonia",
      "Descargar esta guía y los mapas de Google sin conexión"
    ] },
    { title: "Al llegar", items: [
      "Tomar taxi o remís solo en mostradores oficiales o por app",
      "Conseguir la tarjeta SUBE y cargarla",
      "Cambiar algo de dinero en una casa de cambio oficial",
      "Comprar un chip prepago o activar la eSIM",
      "Anotar la dirección del alojamiento y dejar el pasaporte ahí"
    ] }
  ],

  /* Zonas para el armado automático de viajes, en orden de prioridad. */
  zones: [
    { name: "Centro histórico", barrios: ["Centro"] },
    { name: "Recoleta y Retiro", barrios: ["Recoleta", "Retiro"] },
    { name: "Palermo", barrios: ["Palermo", "Villa Crespo"] },
    { name: "San Telmo, La Boca y Puerto Madero", barrios: ["San Telmo", "La Boca", "Puerto Madero"] },
    { name: "Belgrano, Núñez y Chacarita", barrios: ["Belgrano", "Núñez", "Chacarita", "Colegiales", "Villa Ortúzar"] }
  ],

  /* Palabras que la gente escribe → cómo figura en la guía. */
  synonyms: {
    carne: "parrilla", asado: "parrilla", bife: "parrilla", steak: "parrilla", desayuno: "cafe", brunch: "cafe", merienda: "cafe", cafeteria: "cafe",
    vegano: "vegetariano", hotel: "hospedaje", hoteles: "hospedaje", dormir: "hospedaje", alojamiento: "hospedaje", hostal: "hostel",
    ninos: "chicos", nenes: "chicos", familia: "chicos", familias: "chicos", barato: "economico", baratos: "economico", gratuito: "gratis",
    tragos: "cocteles", cocktail: "cocteles", cocktails: "cocteles", boliche: "noche", bailar: "tango", show: "tango",
    excursion: "excursiones", escapada: "excursiones", paseo: "caminar", shopping: "compras", souvenirs: "artesanias", regalos: "artesanias",
    futbol: "futbol", boca: "bombonera", river: "monumental", evita: "evita", empanada: "empanadas", pizza: "pizzeria", helados: "helado",
    lluvia: "lluvia", llueve: "lluvia", techo: "lluvia", vista: "mirador", vistas: "mirador", guia: "tours", guias: "tours", visita: "tours"
  },

  /* Calendario: fechas habituales, a confirmar cada año. m = meses (1-12). */
  events: [
    { m: [2], when: "Febrero", icon: "🎭", name: "Carnaval porteño", desc: "Corsos y murgas en los barrios, los fines de semana de febrero." },
    { m: [3], when: "Marzo", icon: "🎸", name: "Lollapalooza Argentina", desc: "El festival de música más grande del país, en el Hipódromo de San Isidro." },
    { m: [4], when: "Abril", icon: "🎬", name: "BAFICI", desc: "Festival internacional de cine independiente, con sedes en toda la ciudad." },
    { m: [4, 5], when: "Abril y mayo", icon: "📚", name: "Feria Internacional del Libro", desc: "Tres semanas de libros, charlas y autores en La Rural." },
    { m: [5], when: "25 de mayo", icon: "🇦🇷", name: "Día de la Revolución de Mayo", desc: "Feriado patrio: locro y pastelitos, y actos en Plaza de Mayo." },
    { m: [7], when: "Julio", icon: "🐄", name: "Exposición Rural y vacaciones de invierno", desc: "La gran muestra del campo en Palermo; teatros y museos con agenda infantil." },
    { m: [8], when: "Agosto", icon: "💃", name: "Tango BA Festival y Mundial", desc: "Dos semanas de milongas, clases y shows gratuitos, con la final del Mundial de Tango." },
    { m: [9], when: "Septiembre", icon: "🏃", name: "Maratón de Buenos Aires", desc: "42 km por los lugares más emblemáticos; hay cortes de tránsito ese domingo." },
    { m: [10, 11], when: "Octubre o noviembre", icon: "🌙", name: "La Noche de los Museos", desc: "Un sábado al año, cientos de museos abren gratis hasta la madrugada." },
    { m: [11], when: "Noviembre", icon: "💜", name: "Jacarandás en flor", desc: "La ciudad se tiñe de violeta: mirá Plaza San Martín, Av. Figueroa Alcorta y los Bosques de Palermo." },
    { m: [11], when: "Noviembre", icon: "🐎", name: "Día de la Tradición en Areco", desc: "La fiesta gaucha más importante, en San Antonio de Areco." },
    { m: [11, 12], when: "Noviembre y diciembre", icon: "🏇", name: "Abierto Argentino de Polo", desc: "El torneo de polo más importante del mundo, en la cancha de Palermo." },
    { m: [12], when: "Diciembre", icon: "🎆", name: "Fiestas", desc: "El 24, 25 y 31 muchos restaurantes cierran o trabajan solo con reserva: planificá con tiempo." }
  ],

  /* Bloques extra para Info práctica. */
  practicalMore: [
    { icon: "🗣️", title: "Palabras que vas a escuchar", items: [
      { t: "Che / Vos", d: "'Che' es para llamar la atención de alguien; 'vos' reemplaza al 'tú'." },
      { t: "Bondi · Subte · Tacho", d: "Colectivo (autobús), metro y taxi." },
      { t: "Cuadra", d: "La distancia entre dos esquinas: unos 100 metros. 'Queda a cinco cuadras' = 500 m." },
      { t: "Guita · Mango · Luca", d: "Dinero, un peso y mil pesos." },
      { t: "Birra · Morfi · Pileta", d: "Cerveza, comida y piscina." },
      { t: "Boliche · Previa", d: "Discoteca, y la juntada antes de salir." },
      { t: "Dale · Ya fue · Re", d: "'De acuerdo', 'olvidalo' y 'muy' (re lindo = muy lindo)." },
      { t: "La cuenta, por favor", d: "Hay que pedirla: no la traen hasta que no la pedís." }
    ] },
    { icon: "🏥", title: "Salud y farmacias", items: [
      { t: "Urgencias", d: "Llamá al 107 (SAME). Las guardias de los hospitales públicos atienden urgencias las 24 horas." },
      { t: "Farmacias", d: "Hay farmacias de turno toda la noche; las grandes cadenas tienen locales abiertos las 24 horas en los barrios céntricos." },
      { t: "Seguro de viaje", d: "Muy recomendable: las clínicas privadas atienden rápido, pero son caras sin cobertura." },
      { t: "Mosquitos", d: "En verano llevá repelente, sobre todo para parques, la Reserva Ecológica y el Delta." }
    ] },
    { icon: "🧾", title: "Impuestos y compras", items: [
      { t: "IVA en alojamiento", d: "Los turistas extranjeros suelen estar exentos del IVA (21 %) en hoteles pagando con tarjeta emitida en el exterior. Consultalo al reservar." },
      { t: "Tax Free", d: "En comercios adheridos podés pedir la devolución del IVA de productos nacionales; pedí el formulario al comprar y presentalo al salir del país." },
      { t: "Cuotas y descuentos", d: "Muchos precios tienen descuento por pago en efectivo o transferencia. Preguntá antes de pagar." }
    ] },
    { icon: "🔍", title: "Cómo elegimos los lugares", items: [
      { t: "Selección", d: "La guía incluye solo lugares con reputación sostenida: premios, distinciones oficiales y buen consenso en reseñas públicas." },
      { t: "Niveles", d: "'Destacado' son los mejores de su categoría, 'Muy recomendado' es una apuesta segura y 'Buena opción' cumple bien pero no es imprescindible." },
      { t: "Opiniones al día", d: "En cada ficha, el botón 'Opiniones y horarios' abre el lugar en Google Maps con su puntaje, reseñas y horarios actualizados." },
      { t: "Precios", d: "Usamos niveles ($ a $$$$) en vez de montos porque los precios cambian seguido." }
    ] }
  ],

  /* Fotos: archivo de Wikimedia Commons (ruta dentro de /wikipedia/commons/). Con "!" adelante se usa el original sin redimensionar. */
  photos: {
    "plaza-de-mayo-y-casa-rosada": "9/95/Casa_Rosada_exterior_from_Plaza_de_Mayo.JPG",
    "obelisco-y-avenida-corrientes": "f/fc/Buenos_Aires_(20234294752).jpg",
    "teatro-colon": "8/82/Fachada_del_Teatro_Colón_en_Buenos_Aires,_Argentina.jpg",
    "cementerio-de-la-recoleta": "3/3f/Cementerio_de_la_Recoleta.jpg",
    "el-ateneo-grand-splendid": "a/ac/Yenny_Ateneo_Grand_Splendid.jpg",
    "caminito": "e/ed/LaBoca_ST_98.jpg",
    "san-telmo-y-la-feria-de-los-domingos": "9/9f/Buenos_Aires-Feria-Sifones.jpg",
    "puerto-madero-y-puente-de-la-mujer": "f/f7/Puente_de_la_Mujer_and_Edificio_Republica.jpg",
    "reserva-ecologica-costanera-sur": "b/b4/Reserva_Ecológica_Costanera_Sur,_01.jpg",
    "bosques-de-palermo-y-rosedal": "d/d5/RosedalBuenosAires.JPG",
    "jardin-japones": "a/af/Buenos_Aires_-_Jardín_Japonés_-_200806a.jpg",
    "malba": "a/a7/Malba_-_Milla_Museos.jpg",
    "museo-nacional-de-bellas-artes": "8/8e/MNBA_fachada.jpg",
    "palacio-barolo": "8/8d/Palacio_Barolo_visto_de_frente.jpg",
    "avenida-de-mayo": "8/81/Av._de_Mayo_vista_hacia_Congreso.jpg",
    "congreso-de-la-nacion": "0/02/Congreso_Nacional_Buenos_Aires.jpg",
    "palacio-libertad-ex-cck": "e/e2/Buenos_Aires_Centrum_Kirchner.jpg",
    "barrio-chino": "8/82/Danza_del_dragón_y_el_león.jpg",
    "la-bombonera-y-museo-de-la-pasion-boquense": "8/8b/Vista_aérea_del_Estadio_Alberto_J._Armando_\"La_Bombonera\"_01.jpg",
    "estadio-monumental-y-museo-river": "d/d0/Estadio_mas_monumental.jpg",
    "jardin-botanico-carlos-thays": "4/46/Buenos_Aires_Entrada_al_Jardin_Botanico_Carlos_Thays.jpg",
    "ecoparque": "7/77/Zoológico_de_Buenos_Aires_(3899274421).jpg",
    "planetario-galileo-galilei": "d/de/Vista_aérea_del_Planetario_Galileo_Galilei_06.jpg",
    "fundacion-proa": "8/8f/Fachada_del_edificio_de_Fundación_Proa,_La_Boca.jpg",
    "usina-del-arte": "a/ab/Inauguración_Usina_de_las_Artes.jpg",
    "museo-evita": "a/ad/Museo_lafinur_2298_004_ex.jpg",
    "museo-de-arte-moderno": "8/85/Museo_Moderno.jpg",
    "mercado-de-san-telmo": "3/3a/Mercado_San_Telmo.JPG",
    "cementerio-de-la-chacarita": "2/25/Cementerio_de_La_Chacarita_01.JPG",
    "cafe-tortoni": "5/51/Café_Tortoni.JPG",
    "las-violetas": "b/b8/Las_Violetas_Medrano.JPG",
    "la-biela": "4/4b/La_biela.JPG",
    "confiteria-la-ideal": "f/f6/Confitería_La_Ideal_06.jpg",
    "bar-el-federal": "6/65/Bar_El_Federal._Carlos_Calvo_y_Perú..jpg",
    "cafe-de-los-angelitos": "a/ae/Angelitos_1a.JPG",
    "don-julio": "7/70/Don_Julio_03.jpg",
    "el-preferido-de-palermo": "e/e1/El_Preferido-closeup-TM.jpg",
    "la-bomba-de-tiempo": "1/12/Ciudad_Cultural_Konex.jpg",
    "teatros-de-la-avenida-corrientes": "5/56/Teatro_Genera_San_Martin.JPG",
    "funcion-en-el-teatro-colon": "8/82/Fachada_del_Teatro_Colón_en_Buenos_Aires,_Argentina.jpg",
    "tigre-y-delta-del-parana": "7/73/Parana_de_las_Palmas.jpg",
    "colonia-del-sacramento-uruguay": "1/10/Calle_de_los_Suspiros,_Colonia_del_Sacramento,_Uruguay_-_panoramio.jpg",
    "san-antonio-de-areco": "4/4c/Plaza_Ruiz_de_Arellano,_San_Antonio_de_Areco,_Buenos_Aires.jpg",
    "la-plata": "0/0f/Frente_Iglesia_Catedral_desde_Plaza_Moreno.JPG",
    "lujan": "4/45/BasílicaLujan-jul2016_(cropped).png",
    "san-isidro": "0/07/Catedral_San_Isidro.jpg",
    "temaiken": "9/9f/Temaiken.jpg",
    "montevideo-uruguay": "8/89/Museo_Histórico_Cabildo_2021.jpg",
    "chascomus": "c/cd/Chascomus2024.jpg",
    "capilla-del-senor": "1/11/Plaza_San_Martín_Capilla_del_Señor,_fuente_de_los_sapos_02.jpg",
    "alvear-palace-hotel": "!8/8e/Alvear_palace_hotel.jpg",
    "palacio-duhau-park-hyatt": "2/27/Palacio_duhau_recoleta.jpg",
    "four-seasons-buenos-aires": "d/d7/AlzagaUnzue1.jpg",
    "hilton-buenos-aires": "b/b7/Lobby_do_Hotel_Hilton_em_Buenos_Aires.jpg",
    "feria-de-mataderos": "f/fd/Corrida_de_Sortija.jpg",
    "patio-bullrich": "1/1b/Patio_Bullrich_Mall.jpg",
    "calle-florida": "8/8e/Calle_Florida,_Buenos_Aires.jpg",
    "avenida-santa-fe": "0/0c/Buenos_Aires_-_Avenida_Santa_Fe_entre_Maipú_y_Esmeralda.jpg",
    "palermo-soho": "6/64/A_cobblestoned_street_in_Palermo_Soho.jpg",
    "feria-de-plaza-serrano": "3/36/Plaza_Cortazar_1.jpg",
    "visita-al-palacio-barolo": "8/8d/Palacio_Barolo_visto_de_frente.jpg",
    "visita-guiada-al-cementerio-de-la-recoleta": "3/3f/Cementerio_de_la_Recoleta.jpg",
    "visita-a-la-casa-rosada": "9/95/Casa_Rosada_exterior_from_Plaza_de_Mayo.JPG",
    "visita-guiada-al-teatro-colon": "8/82/Fachada_del_Teatro_Colón_en_Buenos_Aires,_Argentina.jpg",
    "b:Palermo": "f/f7/Palermo_montage.jpg",
    "b:Recoleta": "9/95/Recoleta_montage.jpg",
    "b:Centro": "!d/d0/Buenos_Aires_CBD.jpg",
    "b:San Telmo": "5/53/San_Telmo_montage.jpg",
    "b:Puerto Madero": "b/b1/Puente_de_la_Mujer_in_2026.jpg",
    "b:La Boca": "8/8e/Caminito_in_2026.jpg",
    "b:Belgrano": "5/5e/Belgrano_montage.jpg",
    "b:Chacarita": "c/cd/Estacion_federico_lacroze.jpg",
    "b:Retiro": "8/8b/Retiro_montage.jpg",
    "b:Almagro": "8/81/Almagro_montage.jpg"
  },

  /* Estaciones de subte por línea: [nombre, latitud, longitud]. Fuente: OpenStreetMap. */
  stations: {
    A: [["Plaza de Mayo", -34.60884, -58.37089], ["Perú", -34.60858, -58.3745], ["Piedras", -34.60884, -58.37852], ["Lima", -34.60913, -58.38272], ["Sáenz Peña", -34.60941, -58.38675], ["Congreso", -34.60922, -58.39256], ["Pasco", -34.60967, -58.39853], ["Alberti", -34.60986, -58.40086], ["Plaza Miserere", -34.60981, -58.40628], ["Loria", -34.61083, -58.41555], ["Castro Barros", -34.61171, -58.42152], ["Río de Janeiro", -34.61524, -58.42949], ["Acoyte", -34.6181, -58.43596], ["Primera Junta", -34.62059, -58.4414], ["Puán", -34.62356, -58.44864], ["Carabobo", -34.62645, -58.45611], ["San José de Flores", -34.62908, -58.46348], ["San Pedrito", -34.63101, -58.47079]],
    B: [["Leandro N. Alem", -34.60294, -58.36938], ["Florida", -34.60335, -58.37457], ["Carlos Pellegrini", -34.60371, -58.38127], ["Uruguay", -34.60404, -58.38708], ["Callao", -34.60445, -58.39275], ["Pasteur", -34.60465, -58.39942], ["Pueyrredón", -34.60456, -58.40545], ["Carlos Gardel", -34.60408, -58.41134], ["Medrano", -34.6032, -58.42079], ["Ángel Gallardo", -34.60215, -58.43113], ["Malabia", -34.59903, -58.43969], ["Dorrego", -34.59176, -58.44749], ["Federico Lacroze", -34.58718, -58.45515], ["Tronador", -34.58408, -58.46637], ["Los Incas", -34.5812, -58.47437], ["Echeverría", -34.57797, -58.48074], ["Juan Manuel de Rosas", -34.57397, -58.48682]],
    C: [["Retiro", -34.59136, -58.37424], ["General San Martín", -34.59503, -58.37789], ["Lavalle", -34.60174, -58.37808], ["Diagonal Norte", -34.60477, -58.3793], ["Avenida de Mayo", -34.60905, -58.38064], ["Moreno", -34.61244, -58.38053], ["Independencia", -34.61809, -58.38012], ["San Juan", -34.6225, -58.37991], ["Constitución", -34.62771, -58.38111]],
    D: [["Catedral", -34.60772, -58.37401], ["9 de Julio", -34.60443, -58.38029], ["Tribunales", -34.60146, -58.38487], ["Callao", -34.59964, -58.39267], ["Facultad de Medicina", -34.59975, -58.39774], ["Pueyrredón", -34.59492, -58.40314], ["Agüero", -34.59171, -58.40707], ["Bulnes", -34.58821, -58.4113], ["Scalabrini Ortiz", -34.58516, -58.41591], ["Plaza Italia", -34.58146, -58.4211], ["Palermo", -34.57849, -58.42564], ["Ministro Carranza", -34.57519, -58.43472], ["Olleros", -34.57026, -58.44436], ["José Hernández", -34.5663, -58.45202], ["Juramento", -34.56244, -58.45638], ["Congreso de Tucumán", -34.55581, -58.46222]],
    E: [["Retiro", -34.59198, -58.37651], ["Catalinas", -34.5965, -58.3721], ["Correo Central", -34.6037, -58.37021], ["Bolívar", -34.60972, -58.37411], ["Belgrano", -34.61304, -58.37771], ["Independencia", -34.61811, -58.38146], ["San José", -34.62235, -58.38521], ["Entre Ríos", -34.62274, -58.39145], ["Pichincha", -34.62321, -58.39757], ["Jujuy", -34.62384, -58.40276], ["General Urquiza", -34.62469, -58.40975], ["Boedo", -34.62547, -58.4161], ["Avenida La Plata", -34.62697, -58.42642], ["José María Moreno", -34.62803, -58.43389], ["Emilio Mitre", -34.63146, -58.44236], ["Medalla Milagrosa", -34.6363, -58.45019], ["Varela", -34.6398, -58.458], ["Plaza de los Virreyes", -34.64288, -58.46164]],
    H: [["Facultad de Derecho", -34.58308, -58.39105], ["Las Heras", -34.58754, -58.39718], ["Santa Fe", -34.59474, -58.40245], ["Córdoba", -34.5992, -58.40395], ["Corrientes", -34.60412, -58.40534], ["Once", -34.60916, -58.40602], ["Venezuela", -34.61521, -58.40473], ["Humberto I", -34.62307, -58.40234], ["Inclán", -34.62931, -58.401], ["Caseros", -34.63543, -58.39905], ["Parque Patricios", -34.6385, -58.40632], ["Hospitales", -34.64171, -58.41268]]
  }
};
