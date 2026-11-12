/* Zonas de Buenos Aires para el mapa: límites de barrios, capas temáticas y puntos de ayuda.

   LÍMITES: los 48 barrios oficiales (datos abiertos del Gobierno de la Ciudad, simplificados).
   Cada punto son 8 dígitos "AAAABBBB": latitud = -(34 + AAAA/10000), longitud = -(58 + BBBB/10000).

   CAPAS: clasifican los barrios por nivel (3 = más intenso). Los niveles son una valoración editorial
   pensada para turistas, no una estadística oficial. */
window.CITY_ZONES = window.CITY_ZONES || {};
window.CITY_ZONES.caba = {
  /* Barrio oficial → nombre que usa la guía para filtrar lugares (cuando difiere). */
  guide: { "San Nicolás": "Centro", "Monserrat": "Centro", "Balvanera": "Centro" },

  layers: [
    { id: "turismo", name: "Turísticas", icon: "⭐",
      title: "Qué tan turístico es cada barrio",
      legend: { 3: ["#1c5fb0", "Imprescindible"], 2: ["#5c9be0", "Vale la visita"], 1: ["#b3d1f3", "Para curiosos"] },
      levels: {
        3: ["San Nicolás", "Monserrat", "Recoleta", "Palermo", "San Telmo", "La Boca", "Puerto Madero", "Retiro"],
        2: ["Belgrano", "Balvanera", "Chacarita", "Villa Crespo", "Almagro", "Núñez", "Colegiales"],
        1: ["Caballito", "Barracas", "Mataderos", "Boedo", "Parque Patricios", "Villa Urquiza", "Villa Devoto"]
      },
      notes: {
        "San Nicolás": "Obelisco, Teatro Colón, Av. Corrientes, calle Florida y Galerías Pacífico.",
        "Monserrat": "Plaza de Mayo, Casa Rosada, Cabildo, Av. de Mayo, Café Tortoni y Palacio Barolo.",
        "Balvanera": "El Congreso, el Abasto de Gardel y el Once comercial.",
        "Núñez": "Estadio Monumental y Parque de la Memoria.",
        "Colegiales": "Mercado de Pulgas, cafés y calles arboladas.",
        "Caballito": "Parque Centenario y Museo de Ciencias Naturales.",
        "Barracas": "Pasaje Lanín y arte urbano.",
        "Mataderos": "La feria gaucha de los domingos.",
        "Boedo": "Tango y bares notables en la esquina de San Juan y Boedo.",
        "Parque Patricios": "Distrito tecnológico y un gran parque de barrio.",
        "Villa Urquiza": "Barrio residencial con buena gastronomía de barrio.",
        "Villa Devoto": "Casonas, plaza arbolada y restaurantes de barrio."
      },
      defaults: { 3: "", 2: "", 1: "" }
    },
    { id: "dormir", name: "Dónde alojarse", icon: "🛏️",
      title: "Dónde conviene alojarse",
      legend: { 3: ["#2b8a3e", "Ideal"], 2: ["#8fd19e", "Buena opción"], 1: ["#f08c8c", "Mejor no"] },
      levels: {
        3: ["Palermo", "Recoleta"],
        2: ["San Telmo", "Puerto Madero", "Belgrano", "Retiro", "San Nicolás", "Monserrat", "Villa Crespo", "Colegiales", "Chacarita", "Almagro"],
        1: ["La Boca", "Constitución", "Balvanera"]
      },
      notes: {
        "San Nicolás": "Práctico y económico. Elegí cerca de Av. Corrientes; de noche algunas calles quedan vacías.",
        "Monserrat": "Céntrico y con buenos precios. Mejor cerca de Av. de Mayo.",
        "Retiro": "La zona de Plaza San Martín es muy linda. Evitá los alrededores de la terminal.",
        "Colegiales": "Tranquilo y arbolado, a un paso de Palermo.",
        "Constitución": "Hay hoteles baratos, pero la zona no es cómoda para un turista.",
        "Balvanera": "Precios bajos en Once, pero de noche la zona no es agradable."
      },
      defaults: { 3: "", 2: "", 1: "No se recomienda para alojarse." }
    },
    { id: "noche", name: "Noche", icon: "🍸",
      title: "Dónde salir de noche",
      legend: { 3: ["#6f42c1", "Epicentro"], 2: ["#b79df0", "Buenas opciones"] },
      levels: {
        3: ["Palermo"],
        2: ["San Telmo", "Recoleta", "Villa Crespo", "Chacarita", "San Nicolás", "Almagro", "Puerto Madero", "Colegiales", "Retiro"]
      },
      notes: {
        "Palermo": "Soho para bares y restaurantes; Hollywood para boliches y recitales. La noche arranca tarde.",
        "San Telmo": "Bares con historia, cervecerías y tango.",
        "Recoleta": "Coctelerías elegantes y bares de hotel.",
        "San Nicolás": "Teatros, pizzerías y librerías abiertas hasta tarde en Av. Corrientes.",
        "Almagro": "Milongas, teatro independiente y peñas.",
        "Chacarita": "Vermuterías y bares de moda.",
        "Retiro": "Algunas de las mejores barras de la ciudad, sobre la calle Arroyo."
      },
      defaults: { 3: "", 2: "" }
    },
    { id: "comer", name: "Gastronomía", icon: "🍽️",
      title: "Polos gastronómicos",
      legend: { 3: ["#c2410c", "Imperdible para comer"], 2: ["#f4a27a", "Muy buena oferta"] },
      levels: {
        3: ["Palermo", "Chacarita"],
        2: ["Villa Crespo", "Recoleta", "San Telmo", "Puerto Madero", "Belgrano", "San Nicolás", "Colegiales", "Almagro", "La Boca"]
      },
      notes: {
        "Palermo": "La mayor concentración de parrillas, cocina de autor y cafés de especialidad.",
        "Chacarita": "El polo de moda: cocina de producto, vermuterías y cantinas.",
        "Villa Crespo": "Cocina de Medio Oriente, bodegones y un mercado gastronómico.",
        "Belgrano": "El Barrio Chino y su mercado.",
        "San Nicolás": "Las pizzerías clásicas de Av. Corrientes.",
        "San Telmo": "El mercado, parrillas y bares notables.",
        "La Boca": "Bodegones históricos y pizzerías genovesas (de día, o en taxi)."
      },
      defaults: { 3: "", 2: "" }
    },
    { id: "compras", name: "Compras", icon: "🛍️",
      title: "Dónde comprar",
      legend: { 3: ["#c2255c", "Zonas principales"], 2: ["#f3a6c2", "Para algo puntual"] },
      levels: {
        3: ["Palermo", "San Nicolás", "Recoleta"],
        2: ["Villa Crespo", "San Telmo", "Balvanera", "Flores", "Belgrano", "Colegiales", "Mataderos", "Retiro"]
      },
      notes: {
        "Palermo": "Diseño de autor en Palermo Soho.",
        "San Nicolás": "Calle Florida, Galerías Pacífico y las librerías de Corrientes.",
        "Recoleta": "Av. Santa Fe, El Ateneo y la feria de Plaza Francia.",
        "Villa Crespo": "Outlets de marcas argentinas y cuero en calle Murillo.",
        "San Telmo": "Antigüedades y la feria de los domingos.",
        "Balvanera": "Once: comercio mayorista y precios bajos. Cuidá tus cosas.",
        "Flores": "Av. Avellaneda: ropa al por mayor, muy concurrida de día.",
        "Colegiales": "Mercado de Pulgas: muebles y objetos antiguos.",
        "Mataderos": "Artesanías y productos regionales en la feria de los domingos.",
        "Retiro": "Patio Bullrich y marcas de lujo.",
        "Belgrano": "Av. Cabildo y el Barrio Chino."
      },
      defaults: { 3: "", 2: "" }
    },
    { id: "verde", name: "Parques", icon: "🌳",
      title: "Parques y aire libre",
      legend: { 3: ["#2b8a3e", "Grandes espacios verdes"], 2: ["#9bd3a5", "Buenos parques de barrio"] },
      levels: {
        3: ["Palermo", "Puerto Madero"],
        2: ["Belgrano", "Núñez", "Caballito", "Recoleta", "San Telmo", "Saavedra", "Agronomía", "Parque Chacabuco", "Parque Avellaneda", "Parque Patricios"]
      },
      notes: {
        "Palermo": "Bosques de Palermo, Rosedal, Jardín Japonés, Botánico y Ecoparque.",
        "Puerto Madero": "Reserva Ecológica Costanera Sur y los diques.",
        "Belgrano": "Barrancas de Belgrano y la costanera.",
        "Núñez": "Parque de la Memoria, frente al río.",
        "Caballito": "Parque Centenario y Parque Rivadavia.",
        "Recoleta": "Plaza Francia, Plaza Mitre y las barrancas.",
        "San Telmo": "Parque Lezama.",
        "Saavedra": "Parque Saavedra y Parque Sarmiento.",
        "Agronomía": "El enorme predio arbolado de la Facultad de Agronomía."
      },
      defaults: { 3: "", 2: "" }
    }
  ],

  /* Puntos de ayuda. Direcciones, horarios y teléfonos de turismo: sitio oficial de turismo de la Ciudad (consultado en noviembre de 2026).
     Ubicaciones: OpenStreetMap; "aprox" = ubicado a mano. */
  helpTypes: {
    info: { name: "Información turística", icon: "ℹ️", color: "#1a73c8" },
    policia: { name: "Policía y denuncias", icon: "👮", color: "#364fc7" },
    salud: { name: "Hospitales con guardia 24 h", icon: "🏥", color: "#e03131" },
    transporte: { name: "Terminales y aeropuertos", icon: "🚉", color: "#5f3dc4" }
  },
  help: [
    { id: "cat-recoleta", type: "info", name: "Centro de Atención al Turista · Hub de Turismo", address: "Junín 1940, Recoleta", ll: [-34.5868, -58.3927], aprox: true,
      note: "Información, mapas y asesoramiento en persona. Lunes a viernes de 10 a 17 h." },
    { id: "cat-retiro", type: "info", name: "Centro de Atención al Turista · Retiro", address: "Av. Dr. José María Ramos Mejía 1560, Retiro", ll: [-34.59276, -58.37531],
      note: "Lunes a viernes de 8 a 15 h; sábados, domingos y feriados de 8 a 17 h." },
    { id: "defensoria", type: "info", name: "Defensoría del Turista", address: "Av. Belgrano 673, Monserrat", ll: [-34.61259, -58.37576], wa: "5491150261318",
      note: "Reclamos por hoteles, alquileres, agencias o comercios, y ayuda ante pérdida de documentos. Gratuito, con personal bilingüe." },
    { id: "comisaria-turista", type: "policia", name: "Comisaría del Turista", address: "Av. Corrientes 436, Centro", ll: [-34.60335, -58.37298], tel: "+541150509260",
      note: "Atención en varios idiomas para denuncias, robos o pérdida de pasaporte. Guardia las 24 horas." },
    { id: "h-fernandez", type: "salud", name: "Hospital Fernández", address: "Cerviño 3356, Palermo", ll: [-34.58137, -58.40694], note: "Público. Guardia 24 h; las urgencias se atienden gratis." },
    { id: "h-rivadavia", type: "salud", name: "Hospital Rivadavia", address: "Av. Las Heras 2670, Recoleta", ll: [-34.58469, -58.40168], note: "Público. Guardia 24 h; las urgencias se atienden gratis." },
    { id: "h-clinicas", type: "salud", name: "Hospital de Clínicas", address: "Av. Córdoba 2351, Recoleta", ll: [-34.59896, -58.40004], note: "Universitario. Guardia 24 h." },
    { id: "h-argerich", type: "salud", name: "Hospital Argerich", address: "Pi y Margall 750, La Boca", ll: [-34.62886, -58.36579], note: "Público. Guardia 24 h; el más cercano a La Boca y San Telmo." },
    { id: "h-ramos-mejia", type: "salud", name: "Hospital Ramos Mejía", address: "Gral. Urquiza 609, Balvanera", ll: [-34.61804, -58.41018], note: "Público. Guardia 24 h." },
    { id: "h-pirovano", type: "salud", name: "Hospital Pirovano", address: "Av. Monroe 3555, Coghlan", ll: [-34.56414, -58.47186], note: "Público. Guardia 24 h; el más cercano a Belgrano." },
    { id: "h-gutierrez", type: "salud", name: "Hospital de Niños Ricardo Gutiérrez", address: "Gallo 1330, Recoleta", ll: [-34.59418, -58.41139], note: "Público, pediátrico. Guardia 24 h." },
    { id: "h-aleman", type: "salud", name: "Hospital Alemán", address: "Av. Pueyrredón 1640, Recoleta", ll: [-34.59182, -58.40197], note: "Privado. Guardia 24 h, con costo o seguro de viaje." },
    { id: "h-italiano", type: "salud", name: "Hospital Italiano", address: "Tte. Gral. Juan D. Perón 4190, Almagro", ll: [-34.60786, -58.42368], note: "Privado. Guardia 24 h, con costo o seguro de viaje." },
    { id: "h-britanico", type: "salud", name: "Hospital Británico", address: "Perdriel 74, Barracas", ll: [-34.63338, -58.38861], note: "Privado. Guardia 24 h, con costo o seguro de viaje." },
    { id: "t-omnibus", type: "transporte", name: "Terminal de Ómnibus de Retiro", address: "Av. Antártida Argentina 1200, Retiro", ll: [-34.58675, -58.3748], note: "Micros a todo el país. Cuidá el equipaje y llegá en taxi o app." },
    { id: "t-retiro", type: "transporte", name: "Estación Retiro (trenes)", address: "Av. Dr. José María Ramos Mejía 1430, Retiro", ll: [-34.5915, -58.3745], aprox: true, note: "Tren Mitre a Tigre y San Isidro. Subte C y E." },
    { id: "t-constitucion", type: "transporte", name: "Estación Constitución", address: "Av. Brasil 1128, Constitución", ll: [-34.62855, -58.37942], note: "Tren Roca a La Plata. Llegá en subte C; no camines los alrededores." },
    { id: "t-once", type: "transporte", name: "Estación Once", address: "Av. Pueyrredón 110, Balvanera", ll: [-34.6088, -58.4069], aprox: true, note: "Tren Sarmiento hacia el oeste. Subte A y H." },
    { id: "t-buquebus", type: "transporte", name: "Terminal Buquebus", address: "Av. Antártida Argentina 821, Puerto Madero", ll: [-34.5975, -58.3665], aprox: true, note: "Ferry a Colonia y Montevideo. Presentate una hora antes para migraciones." },
    { id: "t-colonia-express", type: "transporte", name: "Terminal Colonia Express", address: "Av. Pedro de Mendoza 330, La Boca", ll: [-34.62646, -58.35912], note: "Ferry a Colonia. Llegá en taxi o app." },
    { id: "t-aeroparque", type: "transporte", name: "Aeroparque Jorge Newbery (AEP)", address: "Av. Costanera Rafael Obligado, Palermo", ll: [-34.55944, -58.41463], note: "Vuelos de cabotaje y regionales. A 15–25 minutos del centro." },
    { id: "t-ezeiza", type: "transporte", name: "Aeropuerto de Ezeiza (EZE)", address: "Autopista Tte. Gral. Ricchieri km 33,5, Ezeiza", ll: [-34.815, -58.5348], aprox: true, far: true, note: "Vuelos internacionales. Entre 45 y 90 minutos del centro." }
  ],
  /* Canales a distancia y búsquedas rápidas "cerca mío" (abren Google Maps). */
  channels: [
    { icon: "💬", name: "Boti, el chat de la Ciudad", desc: "Información turística por WhatsApp.", href: "https://wa.me/5491150500147" },
    { icon: "📝", name: "Denuncia online para turistas", desc: "Sitio de la Policía de la Ciudad.", href: "https://turistas.seguridadciudad.gob.ar" },
    { icon: "🛂", name: "Encontrar mi consulado", desc: "Busca consulados y embajadas en el mapa.", href: "https://www.google.com/maps/search/?api=1&query=consulado+embajada+Buenos+Aires" }
  ],
  nearby: [["💊", "Farmacia", "farmacia"], ["🏧", "Cajero", "cajero automático"], ["💱", "Casa de cambio", "casa de cambio"], ["🛒", "Supermercado", "supermercado"], ["💳", "Cargar SUBE", "carga SUBE"], ["🧺", "Lavandería", "lavandería"], ["🧳", "Guardaequipaje", "guarda equipaje"], ["📶", "Café con wifi", "café con wifi"], ["👮", "Comisaría", "comisaría"], ["⛽", "Estación de servicio", "estación de servicio"]],

  barrios: {
    "Agronomía": "59174759 59194760 59904786 59974788 59934797 59784835 59684971 59684972 59644984 59445031 59405035 59395033 58494890 58484888 58544882 58914847 59164765",
    "Almagro": "59794160 59794157 59804120 59804119 59934121 60824147 61074145 61414129 61964126 62064125 62084138 62194266 62214278 62184278 61514293 61544300 60594307 60394323 60274333 60264331 59904292 59794268 59784238 59774234 59774228 59794160",
    "Balvanera": "59963929 60083928 60933920 60933920 61033919 61693917 61823917 61823920 61884035 62034108 62064125 61964126 61414129 61074145 60824147 59934121 59804119 59814103 59804045 59944020 59983987 59963931",
    "Barracas": "62953707 62973706 65013677 65023677 65133697 65363698 65503725 65683741 65783852 66023877 66223923 66203972 66004010 66004011 64984050 64764031 64714027 64694015 64213914 64083915 64023899 63443903 63413904 63393895 63223834 63083813 63313813 63303801 63053786 62933790 62793766 62733756 62683746 62663710 62923707 62953707",
    "Belgrano": "55014257 55184266 55204267 55204267 55204268 55204268 55204268 55204268 55114310 55314344 55404341 55734404 55884414 56044405 56174382 56214349 56214412 56794490 56794490 56744499 56614523 56904576 57464629 57504634 57404650 57254674 57294681 57204688 56674734 56644730 56644730 56224665 56174677 56134670 55924689 55894692 55844682 55054530 54904541 54274493 53864583 53784594 53724587 53734586 53504539 53174516 53514500 53654541 53744548 53884541 53964522 53564491 53634494 53744486 53604464 53614439 53764416 54034408 53924402 54014393 54044362 54194342 54204349 54264346 54484313 54734307 54734299 54774308 54914288 54824268 54894251",
    "La Boca": "61933513 61933513 61983496 61903479 61903446 61983452 61923463 62003472 62303459 62153455 62183441 62023443 61873434 61863386 62003375 62253372 62273430 62343424 62323401 62493370 62713352 62823362 62893393 62623425 62643443 62893414 62953425 62803446 62873454 62733471 62913488 63123479 63173461 63253491 63143511 62903524 62363618 62473613 62903549 63363528 63653541 63923580 63993614 64193581 64503576 64813624 64823643 65013676 65013677 62973706 62953707 62953707 62933705 62713679 62523680 62523665 62513635 62513635 62513634 61763560 61953551",
    "Boedo": "63044118 63044118 63154117 63524105 63734110 63814113 63824116 64004223 64024235 63924238 62814265 62704268 62674268 62364275 62214278 62194266 62084138 62064125 62194124 63024118",
    "Caballito": "62214278 62364275 62674268 62704268 62704271 63054505 63064516 62974520 61474590 61394594 61374595 60744627 60474588 60454585 60464581 60764462 60564392 60294339 60274333 60394323 60594307 61544300 61514293 62184278",
    "Chacarita": "57834602 57834602 57914554 58324445 58324444 58324444 58454448 58874385 58874385 58874385 59774561 59764562 59754565 59674593 59674656 59264644 59074666 59064668 58964658 58554604 57834605",
    "Coghlan": "55894692 55924689 56134670 56174677 56224665 56644730 56644730 56664735 56624751 56684762 56254812 55914836 55904834 55374739 55354736 55434730 55844697",
    "Colegiales": "56794490 56814486 57214407 57544440 57854399 58234438 58324444 58324444 58324445 57914554 57834602 57834602 57794605 57514632 57504634 57464629 56904576 56614523 56744499",
    "Constitución": "62733756 62793766 62933790 63053786 63303801 63313813 63083813 63223834 63393895 63413904 63273905 62823911 62733912 62703912 61913917 61823917 61813914 61753788 61753774 61763774 62363771 62713757",
    "Flores": "63064516 63114532 63154544 63754514 64284442 64184431 64744374 64634350 64624349 64664346 64994304 65254337 65314344 65364351 65584380 65124433 65084546 65234551 65684604 65684604 65684604 65684604 65154670 64624630 64144692 63684712 63674713 63564718 62324774 62244778 62184767 61974726 61924716 61904714 61414601 61394594 61474590 62974520",
    "Floresta": "62244778 62324774 63564718 63674713 63704724 63894761 63714784 63704785 63684788 62164979 62144982 62064972 61684928 61674926 61764916 62464827 62254780",
    "Liniers": "63485107 63515100 63675057 63745105 64015098 64545028 64585023 64635033 65695258 65685259 65435292 63485304 63485304 63385207 63285202 63325149 63455113",
    "Mataderos": "64484953 64494952 65684802 65784788 65794788 66244859 66334890 67124970 67455025 67445026 65695258 65695258 64635033 64585023 64535013 64344971 64484953",
    "Monserrat": "60693677 60693677 61463669 61563667 61573676 61633774 61753774 61753788 61813914 61823917 61693917 61033919 60933920 60933914 60793713 60663702 60703682",
    "Monte Castro": "61504948 61584938 61594937 61674926 61684928 62064972 62144982 62194992 62405035 62755072 62765073 62695082 62435116 62775155 62845164 62805170 62525206 62445216 62405212 62065174 62025169 61995166 61675130 60985013 60915002 61014994 61444956",
    "Nueva Pompeya": "64714027 64764031 64984050 66004010 66004010 66004011 65994011 65934031 66004072 65844133 66204239 66204240 65874267 65414331 65314344 65254337 64994304 64664346 64624349 64564335 64524321 64174323 64044249 64024235 64004223 63824116 63814113 63844114 64354134 64864121 64724036 64714027",
    "Núñez": "53724587 53784594 53864583 54274493 54904541 55054530 55844682 55894692 55844697 55434730 55354736 55244744 54894682 53864760 53864759 53334638 52714593 52654575 53044515 53534550 53714588",
    "Palermo": "57043939 57203930 57223952 57003992 56993992 56993992 56993992 56934001 57083997 57414026 57853966 58454005 58344019 58354062 59414144 59674155 59794160 59794160 59774228 59774234 59764235 59624270 58874385 58874385 58874385 58454448 58324444 58324444 58324444 58234438 57854399 57544440 57214407 56814486 56794490 56794490 56214412 56254354 56184350 56184380 56064403 55884414 55794411 55404341 55314344 55114310 55184266 55184266 55214257 54924242 55224257 55494157 55744111 55664096 55814102 56354039 56073988 56364039 56403985 56563968 56904002 56663972",
    "Parque Avellaneda": "65684604 65714607 65984641 66004644 66004644 66004645 65754677 65914696 65844706 66284725 65824784 65784788 65684802 64494952 64484953 64474951 64144880 64134878 64094870 63774800 63704785 63714784 63894761 63704724 63674713 63684712 64144692 64624630 65154670 65684604",
    "Parque Chacabuco": "64024235 64044249 64174323 64524321 64564335 64624349 64634350 64744374 64184431 64284442 63754514 63154544 63114532 63064516 63054505 62704271 62704268 62814265 63924238",
    "Parque Chas": "58744708 58744708 59174759 59174759 59164765 58914847 58544882 58484888 58444881 57934792 57914790 57954772 58004754 58184736 58744708",
    "Parque Patricios": "63413904 63443903 64023899 64083915 64213914 64694015 64714027 64714027 64724036 64864121 64354134 63844114 63814113 63734110 63524105 63154117 63044118 63044118 63034116 62733912 62733912 62823911 63273905",
    "Paternal": "59064668 59074666 59264644 59674656 59674593 59754565 59764562 59874566 60394583 60444589 60414600 60194689 60474730 60534740 60424749 60084775 60024764 59974785 59974788 59904786 59194760 59174759 59174759 58744708 58744708 58754708 59054670",
    "Puerto Madero": "61933513 61953551 61763560 62513634 62513635 62513635 62503635 62403658 61693666 61563667 61463669 60693677 60693677 60523679 59943691 59833695 59833689 59813632 59713635 59523593 59503565 59503564 60233468 60673459 60993414 61393400 61613399 61693407 61753452 61683491 61723503 61823508 61823498 61873500 61933513",
    "Recoleta": "57753760 57753767 57913740 58053751 58023798 57833832 57813866 57823899 58083916 58363870 58753837 59163880 59843869 59933869 59933880 59963916 59963929 59963931 59983987 59944020 59804045 59814103 59804119 59804120 59794157 59794160 59674155 59414144 58354062 58344019 58454005 57853966 57414026 57083997 56934001 56993992 56993992 57003992 57223952 57203930 57203930 57633853 57623834 57543829 57043913 56933903 56843831 56853811 57013804 56833801 57043800 57043786 57483711 57043790 57103805 57283783 57323836 57443818 57393754 57663707 57753760",
    "Retiro": "59503565 59523593 59713635 59813632 59833689 59833695 59843709 59933868 59933869 59843869 59163880 58753837 58363870 58083916 57823899 57813866 57833832 58023798 58053751 57913740 57753767 57753760 57753760 57873743 57823679 58023653 58083706 58173690 58113616 58303614 58363661 58453649 58413599 58593597 58633637 58753635 58723596 58833597 59003680 59433644 59143671 59303664 59203679 59333672 59423691 59753679 59743665 59823661 59743662 59723638 59533641 59673634 59503601 59523509 59503566",
    "Saavedra": "55354736 55374739 55904834 55914836 55924837 56274910 56134919 56955088 57005090 56995092 56935099 56915098 54955006 53864760 53864760 54894682 55244744",
    "San Cristóbal": "62733912 62733912 63034116 63044118 63024118 62194124 62064125 62034108 61884035 61823920 61823917 61913917 62703912",
    "San Nicolás": "60693677 60703682 60663702 60793713 60933914 60933920 60933920 60083928 59963929 59963916 59933880 59933869 59933868 59843709 59833695 59943691 60523679",
    "San Telmo": "62513635 62523665 62523680 62713679 62933705 62953707 62953707 62923707 62663710 62683746 62733756 62713757 62363771 61763774 61753774 61633774 61573676 61563667 61693666 62403658 62503635",
    "Vélez Sarsfield": "63704785 63774800 64094870 64134878 64104882 63654931 63185000 63225010 62775072 62765073 62755072 62405035 62194992 62144982 62164979 63684788",
    "Versalles": "62445216 62525206 62805170 62845164 62885159 63465084 63485102 63485107 63455113 63325149 63285202 63385207 63485304 63455304 62755308 62755308 62355228",
    "Villa Crespo": "59774234 59784238 59794268 59904292 60264331 60274333 60294339 60564392 60764462 60464581 60454585 60454585 60444589 60394583 59874566 59764562 59774561 58874385 58874385 58874385 59624270 59764235",
    "Villa del Parque": "59974788 59974785 60024764 60084775 60424749 60534740 60544742 60814802 60814804 60834813 61014887 61494946 61504948 61444956 61014994 60915002 60835010 60245062 59734980 59684972 59684971 59784835 59934797",
    "Villa Devoto": "59405035 59445031 59644984 59684972 59734980 60245062 60835010 60915002 60985013 61675130 61995166 62025169 61965177 61095295 60745278 58145156 58135155 59325041",
    "Villa General Mitre": "60444589 60454585 60454585 60474588 60744627 61374595 61394594 61414601 61904714 61924716 61814725 60864800 60814804 60814802 60544742 60534740 60474730 60194689 60414600",
    "Villa Lugano": "66004644 66024646 66374685 66364702 66444704 66944632 67354595 67984508 68054511 68054511 68084514 69184634 68214758 68904834 68894834 67455025 67455025 67124970 66334890 66244859 65794788 65784788 65824784 66284725 65844706 65914696 65754677 66004645",
    "Villa Luro": "62765073 62775072 63225010 63185000 63654931 64104882 64134878 64144880 64474951 64484953 64484953 64344971 64535013 64585023 64545028 64015098 63745105 63675057 63515100 63485107 63485102 63465084 62885159 62845164 62775155 62435116 62695082",
    "Villa Ortúzar": "57504634 57514632 57794605 57834602 57834605 58554604 58964658 59064668 59054670 58754708 58744708 58744708 58184736 58004754 57954772 57914790 57894787 57304683 57294681 57254674 57404650",
    "Villa Pueyrredón": "57005090 57075080 57355029 58424895 58484888 58494890 59395033 59405035 59325041 58135155 58105154 56935099 56935099 56995092",
    "Villa Real": "62025169 62065174 62405212 62445216 62355228 62755308 61555315 61455311 61095295 61965177",
    "Villa Riachuelo": "68494443 68494443 70534617 68904834 68904834 68214758 69184634 68084514 68054511 68064512 68054499",
    "Villa Santa Rita": "61924716 61974726 62184767 62244778 62254780 62464827 61764916 61674926 61594937 61584938 61504948 61494946 61014887 60834813 60814804 60864800 61814725",
    "Villa Soldati": "65314344 65414331 65874267 66204240 66214241 66494274 68494442 68494443 68054499 68064512 68054511 68054511 67984508 67354595 66944632 66444704 66364702 66374685 66024646 66004644 66004644 65984641 65714607 65684604 65684604 65684604 65234551 65084546 65124433 65584380 65364351",
    "Villa Urquiza": "56644730 56674734 57204688 57294681 57304683 57894787 57914790 57934792 58444881 58484888 58424895 57355029 57075080 57005090 56955088 56134919 56274910 55924837 55914836 56254812 56684762 56624751 56664735"
  }
};
