/* Lo que es propio de Berlín y la guía usa en Recién llegado, Tu vuelo, Práctica, Hoy y el aviso de bienvenida (tarjeta #99).
   Mismo formato que data/caba-local.js. Los textos van en castellano: los traduce i18n/traductor.js (lista i18n/fuentes/berlin.txt).
   Todas las direcciones web se abrieron y revisaron el 13/11/2026. */
(() => {
  "use strict";
  const X = window.CITY_EXTRA && window.CITY_EXTRA.berlin;
  if (!X) return;
  X.local = {
    mapa: "Berlin",                              // se agrega a las búsquedas de Google Maps
    coordCentro: [52.5200, 13.4050],             // centro del mapa y del clima (Alexanderplatz)
    limitesMapa: [[52.455, 13.255], [52.565, 13.495]],   // lo que se ve en el mapa al abrirlo
    zonasBase: [52, 13],                         // grados enteros para data/berlin-zones.js (Berlín no cruza ningún grado entero)
    fuera: "Fuera de Berlín",
    pasaporte: "Pasaporte berlinés",
    pasaporteSub: "Marcá los lugares que conocés y ganá sellos: museos, mercados, explorador de barrios…",
    trasnoche: "Trasnoche berlinesa",
    interesNoche: "🍸 Bares y noche",
    metro: "U-Bahn y S-Bahn",                    // igual al título del bloque de transporte donde van las líneas
    sinEstacion: "Sin estación cerca: mejor bus, tranvía o app",
    buscarEj: "¿Qué buscás? Museo, currywurst, club, Kreuzberg…",
    rutaEj: "Ej.: Puerta de Brandeburgo, East Side Gallery…",
    aerolineasEj: "Ej.: Lufthansa, Ryanair, Iberia…",
    atajos: [["Muro de Berlín", { q: "muro" }], ["Clubes", { cat: "noche", sub: "Para bailar" }]],
    moneda: { codigo: "EUR", nombre: "Euro", plural: "euros", aria: "Monto en euros", formato: "es-ES" },
    centro: { q: "Alexanderplatz, Berlin", label: "Hasta el centro (Alexanderplatz)" },
    /* Recién llegado */
    aeropuertos: [
      { label: "Desde el aeropuerto BER", q: "Flughafen Berlin Brandenburg BER" }
    ],
    uber: true,
    traslados: [   // [ícono, nombre, web, aclaración]
      ["🚆", "Tren al centro", "https://ber.berlin-airport.de/en/orientation/getting-here/public-transport.html", "FEX, regionales y S9, con boleto ABC"],
      ["🚕", "Bolt", "https://bolt.eu/en/cities/berlin/"],
      ["🚖", "FREENOW", "https://www.free-now.com/"]
    ],
    aeropuertoTips: ["El tren es lo más rápido y barato: el FEX y los regionales van a la estación central, y la línea S9 cruza el centro.",
      "Comprá un boleto ABC en las máquinas de la estación y sellalo antes de subir.",
      "Los taxis oficiales esperan en la fila frente a la terminal. No aceptes ofertas de gente que se te acerque en el hall."],
    chips: [
      ["📱", "Telekom", "https://www.telekom.de/shop/tarife/magenta-mobil-prepaid", "Chip prepago"],
      ["📱", "Vodafone", "https://www.vodafone.de/freikarten/callya/", "Chip prepago"],
      ["📱", "O2", "https://www.o2online.de/mobilfunk/prepaid/", "Chip prepago"]
    ],
    chipsBuscar: "Telekom Vodafone O2 Shop",
    internetTips: ["En Alemania, para activar un chip hay que verificar tu identidad con el pasaporte: puede llevar un rato.",
      "Si tu celular acepta eSIM, podés activarla antes de viajar.",
      "Muchos bares y cafés tienen Wi-Fi gratis: pedí la clave."],
    plataTips: ["Llevá siempre algo de efectivo: todavía hay bares, kioscos y puestos que no aceptan tarjeta.",
      "Sacá plata en cajeros de bancos: los cajeros sueltos de las zonas turísticas cobran más.",
      "Si el cajero o el lector de tarjetas te ofrece cobrarte en tu moneda, elegí pagar en euros."],
    transporte: {
      t: "Prepará el transporte", s: "Boletos, zonas y cómo moverte",
      acts: [
        ["🎫", "Boletos para turistas", "https://www.bvg.de/en/tourists/tickets", "Sitio oficial de BVG"],
        ["📲", "Apps de BVG", "https://www.bvg.de/en/subscriptions-and-tickets/all-apps", "Comprá el boleto en el celular"],
        ["🚇", "Líneas de U-Bahn y S-Bahn", "#/info/moverse", "Recorridos y consejos"]
      ],
      tips: ["Si comprás un boleto de papel, sellalo en la maquinita antes de viajar.",
        "Para ir o volver del aeropuerto necesitás un boleto de las zonas ABC."]
    },
    moverseSub: "Boletos, U-Bahn, aeropuerto",
    /* Hoy: el archivo de eventos que arma herramientas/armar-hoy-berlin.ps1 con la agenda cultural abierta de Berlín (kulturdaten.berlin),
       y otras agendas para buscar más planes. */
    hoy: "data/hoy-berlin.json",
    hoyNota: "⭐ Destacados de la semana. 📅 Agenda cultural abierta de Berlín. Los títulos están en alemán. Confirmá en su página antes de ir.",
    agendas: [
      ["🏛️", "visitBerlin: eventos", "https://www.visitberlin.de/en/events-berlin"],
      ["📰", "Berlin.de: agenda de la ciudad", "https://www.berlin.de/en/events/"],
      ["🖼️", "Museumsportal: muestras", "https://www.museumsportal-berlin.de/en/"],
      ["🎧", "Resident Advisor: clubes y fiestas", "https://ra.co/events/de/berlin"]
    ],
    /* Tu vuelo: pantallas de check-in. Cada una se abrió y se revisó el 13/11/2026. */
    aerolineas: [
    ["Lufthansa", "https://www.lufthansa.com/de/en/online-check-in"],
    ["Eurowings", "https://www.eurowings.com/en/my-trip/checkin.html"],
    ["Ryanair", "https://www.ryanair.com/gb/en/lp/check-in"],
    ["Wizz Air", "https://www.wizzair.com/en-gb/help-centre/check-in-and-boarding"],
    ["Iberia", "https://www.iberia.com/es/autocheckin-online/"],
    ["Vueling", "https://tickets.vueling.com/manage?event=checkin&culture=en-GB"],
    ["Air Europa", "https://www.aireuropa.com/es/es/mytrips/checkin"],
    ["Air France", "https://wwws.airfrance.fr/check-in"],
    ["KLM", "https://www.klm.com/check-in"],
    ["ITA Airways", "https://www.ita-airways.com/it/en/book-and-prepare/travel-information/check-in-information"],
    ["Austrian", "https://www.austrian.com/de/en/online-check-in"],
    ["British Airways", "https://www.britishairways.com/travel/olcilandingpageauthreq/public/en_gb"],
    ["TAP Air Portugal", "https://www.flytap.com/en-us/check-in-information"],
    ["Turkish Airlines", "https://www.turkishairlines.com/en-int/flights/manage-booking/"],
    ["Transavia", "https://www.transavia.com/en-EU/my-transavia/check-in/login/"],
    ["airBaltic", "https://www.airbaltic.com/en/check-in"],
    ["Aerolíneas Argentinas", "https://www.aerolineas.com.ar/?activeTab=checkIn"],
    ["LATAM", "https://www.latamairlines.com/es/es/check-in"],
    ["Emirates", "https://www.emirates.com/english/manage-booking/online-check-in/"],
    ["Qatar Airways", "https://cki.qatarairways.com/cki/dashboard"],
    ["United", "https://www.united.com/en/us/checkin"],
    ["Delta", "https://oci.delta.com/index.html"],
    ["American Airlines", "https://www.aa.com/check-in"]
    ],
    vueloAeropuertos: "Berlín tiene un solo aeropuerto, el BER (Berlin Brandenburg). Las terminales 1 y 2 están una al lado de la otra: fijate cuál es la tuya.",
    /* Frases para defenderte: la frase queda en alemán y abajo se explica para qué sirve */
    idioma: "de",
    frases: [
    ["Hallo, wie geht's?", "Saludo amistoso, para cualquier momento"],
    ["Die Rechnung, bitte.", "Para pedir la cuenta en un bar o restaurante"],
    ["Kann ich mit Karte zahlen?", "Antes de pedir, por si solo aceptan efectivo"],
    ["Was kostet das?", "Para preguntar el precio"],
    ["Wie komme ich zu…?", "Para pedir indicaciones en la calle"],
    ["Wo ist die Toilette?", "Para encontrar el baño"],
    ["Einen Tisch für zwei, bitte.", "Al llegar a un restaurante"],
    ["Was empfehlen Sie?", "Para pedir una sugerencia al mozo"],
    ["Ich habe Zöliakie. Haben Sie etwas Glutenfreies?", "Para pedir comida sin gluten"],
    ["Entschuldigung, ich spreche kaum Deutsch.", "Para que te hablen más despacio"],
    ["Ich brauche einen Arzt.", "En una urgencia"],
    ["Vielen Dank!", "Para agradecer"]
    ],
    /* Aviso de bienvenida: qué hay en Info */
    aviso: ["🛬 Cómo salir del aeropuerto y llegar a tu alojamiento", "💳 Cómo pagar y dónde cambiar plata", "🎫 Los boletos de transporte y cómo validarlos",
      "⚠️ Las estafas más comunes y cómo evitarlas", "🆘 Teléfonos de emergencia, para tocar y llamar"]
  };
})();
