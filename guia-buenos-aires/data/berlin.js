/* Datos de la ciudad: Berlín (tarjeta #99, etapa 1 de la expansión).
   Por ahora tiene la estructura y toda la información de "Info". Los lugares se cargan en la etapa 2.
   price: 0 = gratis, 1 = $, 2 = $$, 3 = $$$, 4 = $$$$, null = no aplica.

   De dónde salen los datos de transporte, emergencias y dinero (revisados el 13/11/2026):
   bvg.de (boletos y apps), ber.berlin-airport.de (cómo llegar desde el aeropuerto), visitberlin.de (oficinas de turismo y teléfono).
   Sin precios ni horarios exactos: cambian seguido. */
window.CITY_DATA = window.CITY_DATA || {};
window.CITY_DATA.berlin = {
  id: "berlin",
  name: "Berlín",
  fullName: "Berlín",
  country: "Alemania",
  tz: "Europe/Berlin",
  currency: "EUR",
  tagline: "Todo lo que necesitás para recorrer la ciudad",
  updated: "Noviembre 2026",

  categories: [
    { id: "ver", name: "Imperdibles", icon: "🏛️", color: "#2f7fd1", desc: "Atracciones, museos y paseos" },
    { id: "comer", name: "Dónde comer", icon: "🍽️", color: "#d1552f", desc: "Currywurst, döner, cocina alemana y del mundo" },
    { id: "noche", name: "Noche", icon: "🍸", color: "#8a4fd1", desc: "Bares, clubes, música en vivo y teatro" },
    { id: "tours", name: "Tours y guías", icon: "🧭", color: "#1f9d8a", desc: "Visitas guiadas y experiencias" },
    { id: "escapadas", name: "Excursiones", icon: "🚆", color: "#3a9a3f", desc: "Escapadas de un día" },
    { id: "dormir", name: "Hospedaje", icon: "🛏️", color: "#c58a12", desc: "Hostels, hoteles y dónde alojarse" },
    { id: "compras", name: "Compras y mercados", icon: "🛍️", color: "#d13f7a", desc: "Mercados, tiendas y zonas comerciales" },
    { id: "deporte", name: "Deportes", icon: "⚽", color: "#0b7285", desc: "Estadios, parques y aire libre" },
    { id: "ocio", name: "Entretenimiento", icon: "🎡", color: "#e8590c", desc: "Cine, teatro, juegos y planes con chicos" }
  ],

  /* Los lugares se cargan en la etapa 2 (una fila por lugar, con el mismo formato que data/caba.js o data/caba-mas.js). */
  places: [],

  barrios: [
    { name: "Mitte", vibe: "Histórico y monumental", desc: "El centro: Puerta de Brandeburgo, Isla de los Museos, Unter den Linden y Alexanderplatz. Casi todo lo imperdible se camina desde acá.", stay: "La mejor base para una primera visita: todo queda cerca." },
    { name: "Prenzlauer Berg", vibe: "Tranquilo, lindo y familiar", desc: "Calles arboladas, cafés, tiendas chicas y el Mauerpark con su mercado de pulgas de los domingos.", stay: "Ideal para familias y para quienes buscan calma, a pocos minutos del centro." },
    { name: "Friedrichshain", vibe: "Joven y nocturno", desc: "La East Side Gallery, la avenida Karl-Marx-Allee, bares y algunos de los clubes más conocidos.", stay: "Bueno para salir de noche y con precios razonables; puede ser ruidoso." },
    { name: "Kreuzberg", vibe: "Alternativo y multicultural", desc: "Arte urbano, comida de todo el mundo, canales y mucha vida de bar. Acá también están Checkpoint Charlie y el Museo Judío.", stay: "Con mucho ambiente; elegí la zona de Bergmannstraße si querés algo más tranquilo." },
    { name: "Neukölln", vibe: "De moda y en cambio constante", desc: "Bares nuevos, cocina de Medio Oriente y el enorme parque del viejo aeropuerto de Tempelhof.", stay: "Para quienes ya conocen la ciudad y buscan algo menos turístico." },
    { name: "Charlottenburg", vibe: "Elegante y clásico", desc: "El Berlín del oeste: la avenida Kurfürstendamm, el Palacio de Charlottenburg y la iglesia del Recuerdo.", stay: "Cómodo, tranquilo y bien conectado; bueno para familias." },
    { name: "Schöneberg", vibe: "Residencial y diverso", desc: "Barrio de cafés y mercados, centro histórico de la comunidad LGBT+ alrededor de Nollendorfplatz.", stay: "Buena relación entre precio y ubicación." },
    { name: "Tiergarten", vibe: "Verde y de embajadas", desc: "El gran parque del centro, el Reichstag, la Columna de la Victoria y Potsdamer Platz.", stay: "Hoteles grandes cerca del parque y de la estación central." }
  ],

  /* Los itinerarios se arman en la etapa 2, cuando estén cargados los lugares. */
  itineraries: [],

  /* ───────────── TRANSPORTE ───────────── */
  subte: [
    { line: "U1", color: "#7dad4c", route: "Uhlandstraße ↔ Warschauer Straße", useful: "Kurfürstendamm, Kreuzberg y la East Side Gallery" },
    { line: "U2", color: "#da421e", route: "Pankow ↔ Ruhleben", useful: "Alexanderplatz, Potsdamer Platz, Zoologischer Garten" },
    { line: "U5", color: "#7e5330", route: "Hauptbahnhof ↔ Hönow", useful: "Estación central, Puerta de Brandeburgo, Isla de los Museos, Alexanderplatz" },
    { line: "U6", color: "#8c6dab", route: "Alt-Tegel ↔ Alt-Mariendorf", useful: "Friedrichstraße y Checkpoint Charlie (Kochstraße)" },
    { line: "U7", color: "#528dba", route: "Rathaus Spandau ↔ Rudow", useful: "Charlottenburg, Schöneberg, Kreuzberg y Neukölln" },
    { line: "U8", color: "#224f86", route: "Wittenau ↔ Hermannstraße", useful: "Alexanderplatz, Kottbusser Tor y Neukölln" },
    { line: "S", color: "#3d8b37", route: "S-Bahn: cruza el centro de este a oeste", useful: "Ostbahnhof, Alexanderplatz, Friedrichstraße, Hauptbahnhof y Zoologischer Garten" },
    { line: "S41", color: "#a0522d", route: "Ringbahn: el anillo que rodea el centro", useful: "S41 gira en un sentido y S42 en el otro" }
  ],
  transport: [
    /* Revisado el 13/11/2026 contra bvg.de y ber.berlin-airport.de. */
    { icon: "💳", title: "Cómo pagar: lo primero", items: [
      { t: "Un solo boleto para todo", d: "El mismo boleto sirve en U-Bahn, S-Bahn, tranvías, buses y trenes regionales dentro de las zonas que compraste." },
      { t: "Zonas", d: "Las zonas A y B cubren toda la ciudad. La zona C suma el aeropuerto BER y Potsdam: para esos viajes pedí un boleto ABC." },
      { t: "Dónde se compra", d: "En las máquinas de las estaciones y andenes, o desde el celular con las apps de BVG. En los buses se paga sin efectivo, con tarjeta." },
      { t: "Hay que validarlo", d: "Los boletos de papel se sellan en las maquinitas del andén o del bus antes de viajar. Los que comprás en la app ya vienen activados." },
      { t: "No hay molinetes", d: "Se entra directo al andén, pero pasan inspectores vestidos de civil. Sin boleto válido, la multa es alta." },
      { t: "Si te quedás varios días", d: "Convienen el boleto de 24 horas o la Berlin WelcomeCard, que suma descuentos en museos y atracciones." },
      { t: "Última revisión", d: "13 de noviembre de 2026, con los sitios de BVG y del aeropuerto BER. Si algo no coincide, valen los carteles del transporte." }
    ] },
    { icon: "🚇", title: "U-Bahn y S-Bahn", items: [
      { t: "Cómo funcionan", d: "La U-Bahn es el metro, casi todo bajo tierra. La S-Bahn es el tren urbano, en superficie. Se combinan sin pagar de nuevo." },
      { t: "Horarios", d: "De lunes a jueves cierran de madrugada por unas horas. Los viernes y sábados a la noche funcionan toda la noche." },
      { t: "Ringbahn", d: "Las líneas S41 y S42 dan la vuelta completa al centro: sirven para cambiar de barrio sin pasar por Mitte." },
      { t: "Consejos", d: "Mirá el cartel del andén: indica la estación final de la línea, que es la dirección del tren." }
    ] },
    { icon: "🚌", title: "Tranvías y buses", items: [
      { t: "Tranvías", d: "Cubren sobre todo el este de la ciudad. Las líneas que empiezan con M pasan más seguido y varias funcionan toda la noche." },
      { t: "Bus 100", d: "Una línea común que pasa por los lugares más conocidos, entre Zoologischer Garten y Alexanderplatz: un paseo turístico al precio de un boleto." },
      { t: "De noche", d: "Cuando cierra la U-Bahn, los buses nocturnos (con la letra N) hacen recorridos parecidos." },
      { t: "Cómo saber cuál tomar", d: "Usá Google Maps o la app BVG Fahrinfo: indican línea, parada y cuánto falta para que llegue." }
    ] },
    { icon: "🚆", title: "Trenes regionales", items: [
      { t: "Al aeropuerto", d: "El tren FEX y los regionales unen la estación central (Hauptbahnhof) con el aeropuerto BER. La línea S9 de la S-Bahn también llega." },
      { t: "A Potsdam", d: "Trenes regionales y la línea S7. Hace falta boleto ABC." },
      { t: "Estaciones grandes", d: "Hauptbahnhof (la central), Ostbahnhof, Südkreuz, Gesundbrunnen y Zoologischer Garten." }
    ] },
    { icon: "🚕", title: "Taxis y apps", items: [
      { t: "Taxis", d: "Son de color crema, con cartel amarillo en el techo y taxímetro. Se toman en las paradas, en la calle o por app." },
      { t: "Apps", d: "Uber, Bolt y FREENOW funcionan en toda la ciudad y muestran el precio antes de viajar." },
      { t: "Consejos", d: "En el aeropuerto, usá la fila de taxis oficial o la zona señalizada para autos de app. No aceptes ofertas dentro de la terminal." }
    ] },
    { icon: "🚲", title: "Bicicleta y a pie", items: [
      { t: "Bicis compartidas", d: "Hay bicis y monopatines de varias empresas en toda la ciudad; se desbloquean desde la app de cada una." },
      { t: "Cuidado con la bicisenda", d: "Muchas veredas tienen un carril para bicis, a veces marcado en rojo. No camines por ahí: las bicis van rápido." },
      { t: "A pie", d: "Mitte se recorre caminando. Los berlineses esperan la luz verde para cruzar, aunque no venga nadie." }
    ] },
    { icon: "📱", title: "Apps útiles", items: [
      { t: "Para moverse", d: "Google Maps, BVG Fahrinfo (recorridos) y BVG Tickets (boletos). Para trenes, DB Navigator." },
      { t: "Para viajar", d: "Uber, Bolt, FREENOW." },
      { t: "Para pedir comida", d: "Wolt y Lieferando." }
    ] }
  ],

  /* ───────────── SEGURIDAD ───────────── */
  emergencies: [
    { n: "112", t: "Bomberos y ambulancia" },
    { n: "110", t: "Policía" },
    { n: "116 117", t: "Médico de guardia (no urgente)" },
    { n: "116 016", t: "Violencia contra mujeres" },
    { n: "+49 30 25 00 25", t: "Información turística (visitBerlin)" }
  ],
  safety: [
    { icon: "🎒", title: "Lo más común: carteristas", tone: "warn", items: [
      "Pasa sobre todo en U-Bahn y S-Bahn llenas, en las estaciones grandes y en lugares con mucha gente como Alexanderplatz.",
      "Llevá la mochila adelante y los bolsillos cerrados, sobre todo al subir y bajar del tren.",
      "En bares y terrazas, no dejes el celular sobre la mesa ni la mochila colgada de la silla.",
      "Si alguien te distrae de golpe (te pide una firma, te pregunta algo con un mapa), cuidá tus cosas y seguí caminando."
    ] },
    { icon: "🗺️", title: "Zonas para ir con atención", tone: "warn", items: [
      "Berlín es una ciudad segura; estos son lugares donde conviene estar más atento, sobre todo de noche.",
      "Alexanderplatz y sus alrededores de madrugada.",
      "Görlitzer Park y la zona de Kottbusser Tor (Kreuzberg): hay venta de drogas. De día no suele pasar nada; de noche, mejor rodearlos.",
      "Warschauer Straße y los alrededores de los clubes de Friedrichshain a la salida, de madrugada.",
      "Las estaciones grandes de noche: no dejes el equipaje solo."
    ] },
    { icon: "🎭", title: "Estafas típicas", tone: "warn", items: [
      "El juego de los tres vasitos: en zonas turísticas arman apuestas en la calle. Está arreglado y los que ganan son cómplices.",
      "Las firmas: te piden firmar una planilla por una causa solidaria y después exigen plata, o aprovechan para robarte.",
      "Boletos usados: gente que ofrece boletos de transporte más baratos al lado de las máquinas. Suelen estar vencidos.",
      "Cajeros con comisiones altas: en zonas turísticas hay cajeros que no son de bancos y cobran mucho más.",
      "Entradas revendidas en la puerta de clubes y recitales: suelen ser falsas."
    ] },
    { icon: "✅", title: "Buenas prácticas", tone: "ok", items: [
      "Con las precauciones de cualquier gran capital, la gran mayoría de las visitas transcurre sin problemas.",
      "Llevá solo lo del día: una tarjeta, algo de efectivo y una copia del documento. El pasaporte, en el alojamiento.",
      "El transporte público funciona toda la noche los fines de semana y es una forma segura de volver.",
      "Si te roban, hacé la denuncia en una comisaría o por internet, en el sitio de la Policía de Berlín. La vas a necesitar para el seguro.",
      "Contratá un seguro de viaje: la atención médica es muy buena, pero cara sin cobertura."
    ] }
  ],

  /* ───────────── INFO PRÁCTICA ───────────── */
  practical: [
    { icon: "💵", title: "Dinero y pagos", items: [
      { t: "Moneda", d: "Euro (EUR)." },
      { t: "Efectivo", d: "En Berlín todavía se usa mucho. Hay bares, kioscos y puestos de mercado que no aceptan tarjeta: llevá siempre algo de efectivo." },
      { t: "Tarjetas", d: "Se aceptan en hoteles, supermercados, museos y casi todos los restaurantes, también con el celular." },
      { t: "Cajeros", d: "Usá los de bancos. Si te ofrecen cobrarte en tu moneda, elegí siempre pagar en euros: el cambio del cajero es peor." },
      { t: "Propina", d: "Se redondea o se deja entre el 5 y el 10 %. No se deja en la mesa: al pagar, decís cuánto querés pagar en total." },
      { t: "Envases", d: "Las botellas y latas tienen un depósito que se paga al comprar. Te lo devuelven al llevarlas a las máquinas de los supermercados." }
    ] },
    { icon: "🕘", title: "Horarios berlineses", items: [
      { t: "Comidas", d: "Almuerzo de 12 a 14 y cena de 18 a 21. Muchas cocinas cierran temprano: después de las 22 cuesta encontrar dónde cenar." },
      { t: "Domingos", d: "Los comercios y supermercados cierran. Quedan abiertos los de las estaciones grandes, los kioscos y los restaurantes." },
      { t: "Museos", d: "Muchos cierran los lunes. Verificá antes de ir." },
      { t: "Noche", d: "Los bares se llenan después de las 22. Los clubes arrancan pasada la medianoche y algunos siguen hasta el otro día." }
    ] },
    { icon: "🌤️", title: "Clima y cuándo venir", items: [
      { t: "Primavera (abr–may)", d: "Templado y con la ciudad en flor. Muy buena época." },
      { t: "Verano (jun–ago)", d: "Días largos, entre 20 y 30 °C. La ciudad vive en los parques, los lagos y las terrazas." },
      { t: "Otoño (sep–oct)", d: "Fresco y agradable, con menos turistas." },
      { t: "Invierno (nov–mar)", d: "Frío, cerca de 0 °C, y oscurece a media tarde. En diciembre están los mercados de Navidad." }
    ] },
    { icon: "🔌", title: "Datos útiles", items: [
      { t: "Electricidad", d: "230 V. Enchufe tipo F (dos patas redondas). Si venís de la Argentina, llevá adaptador." },
      { t: "Agua", d: "El agua de la canilla es potable." },
      { t: "Internet", d: "Hay Wi-Fi gratis en muchas estaciones, cafés y museos. Para tener datos, lo más simple es una eSIM." },
      { t: "Idioma", d: "Alemán. En las zonas turísticas casi todos hablan inglés." },
      { t: "Baños públicos", d: "Suelen ser pagos, también en estaciones y centros comerciales. Tené monedas a mano." },
      { t: "Salud", d: "Las farmacias tienen una cruz o una A roja. Fuera de horario hay farmacias de turno. Urgencias: 112." }
    ] },
    { icon: "🥨", title: "Costumbres", items: [
      { t: "Saludo", d: "Se da la mano. Con desconocidos se usa el trato formal, de usted." },
      { t: "Puntualidad", d: "Se llega a horario: a una reserva, a un tour o a una cita." },
      { t: "En los clubes", d: "Muchos no dejan sacar fotos y tapan la cámara del celular con un sticker. La entrada la decide el portero y no se discute." },
      { t: "Para probar", d: "Currywurst, döner kebab, las albóndigas llamadas Buletten, la factura rellena Berliner o Pfannkuchen, y la cerveza Berliner Weisse." }
    ] }
  ]
};
