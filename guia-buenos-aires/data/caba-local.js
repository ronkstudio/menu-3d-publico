/* Lo que es propio de Buenos Aires y la guía usa en Recién llegado, Tu vuelo, Práctica y el aviso de bienvenida.
   Antes estaba escrito adentro de js/app.js; se pasó acá para que sumar otra ciudad sea copiar este archivo y cambiar los datos
   (pedido de Bautista, 12/11/2026). La guía usa estos datos y, si una ciudad no los tiene, esconde esa parte.

   Cómo armar el de otra ciudad: copiar este archivo como data/<ciudad>-local.js, cambiar "caba" por el id de la ciudad
   y revisar cada dirección web antes de publicarla. Los textos van en castellano: los traduce i18n/traductor.js. */
(() => {
  "use strict";
  const X = window.CITY_EXTRA && window.CITY_EXTRA.caba;
  if (!X) return;
  X.local = {
    mapa: "Buenos Aires",                       // se agrega a las búsquedas de Google Maps
    coordCentro: [-34.6037, -58.3816],          // centro del mapa y del clima
    limitesMapa: [[-34.705, -58.531], [-34.527, -58.335]],   // lo que se ve en el mapa al abrirlo
    zonasBase: [-34, -58],                      // grados enteros que usa data/caba-zones.js para achicar los puntos
    pasaporte: "Pasaporte porteño",
    trasnoche: "Trasnoche porteña",
    moneda: { codigo: "ARS", nombre: "Peso argentino", plural: "pesos", aria: "Monto en pesos argentinos", formato: "es-AR" },
    centro: { q: "Obelisco, Buenos Aires", label: "Hasta el centro (Obelisco)" },
    /* Recién llegado */
    aeropuertos: [
      { label: "Desde Ezeiza", q: "Aeropuerto Internacional Ezeiza" },
      { label: "Desde Aeroparque", q: "Aeroparque Jorge Newbery" }
    ],
    uber: true,
    traslados: [   // [ícono, nombre, web, aclaración] revisadas el 12/11/2026
      ["🚕", "Cabify", "https://cabify.com/ar"],
      ["🚖", "DiDi", "https://web.didiglobal.com/ar/"],
      ["🚌", "Micro al centro", "https://www.tiendaleon.com/", "Tienda León, desde Ezeiza"]
    ],
    aeropuertoTips: ["Taxis y remises: contratalos en los mostradores oficiales de adentro del aeropuerto.",
      "No aceptes ofertas de gente que se te acerque en el hall.",
      "Ezeiza queda lejos del centro: contá con un buen rato de viaje."],
    chips: [
      ["📱", "Personal", "https://www.personal.com.ar/prepago", "Chip prepago"],
      ["📱", "Claro", "https://www.claro.com.ar/personas/elegi-prepago", "Chip prepago"],
      ["✨", "Claro eSIM", "https://simple.claro.com.ar/esimple", "Sin chip físico"],
      ["📱", "Movistar", "https://www.movistar.com.ar/prepago", "Chip prepago"]
    ],
    chipsBuscar: "tienda Personal Claro Movistar",
    internetTips: ["Para comprar un chip te pueden pedir el pasaporte.",
      "Si tu celular acepta eSIM, podés activarla antes de viajar.",
      "Muchos bares y cafés tienen Wi-Fi gratis: pedí la clave."],
    plataTips: ["Pagar con tarjeta extranjera suele convenir.",
      "Tené algo de efectivo en billetes chicos para propinas y kioscos.",
      "No cambies dinero con gente en la calle."],
    transporte: {
      t: "Prepará el transporte", s: "Tarjeta SUBE y cómo moverte",
      acts: [
        ["📍", "Dónde comprar y cargar", "https://tarjetasube.sube.gob.ar/SubeWeb/WebForms/admin/views/mapa-sube.aspx?id=1", "Mapa oficial de puntos SUBE"],
        ["📲", "App SUBE", "https://www.argentina.gob.ar/sube/nuestras-apps", "Mirá tu saldo"],
        ["🚇", "Líneas de subte", "#/info/moverse", "Recorridos y consejos"]
      ],
      tips: ["La SUBE se compra en kioscos, estaciones de subte y puntos SUBE.",
        "En el subte y en muchos colectivos también podés pagar con tu tarjeta sin contacto."]
    },
    moverseSub: "SUBE, subte, aeropuertos",
    /* Hoy: el archivo de eventos que arma herramientas/armar-hoy.ps1 todos los días, y otras agendas para buscar más planes (revisadas el 12/11/2026) */
    hoy: "data/hoy.json",
    agendas: [
      ["🏛️", "Agenda de la Ciudad", "https://linda.buenosaires.gob.ar/agenda"],
      ["📰", "Time Out: qué hacer esta semana", "https://www.timeout.com/es/buenos-aires/agenda-semana"],
      ["🎭", "Alternativa Teatral: cartelera", "https://www.alternativateatral.com/cartelera.asp"],
      ["🎧", "Resident Advisor: fiestas electrónicas", "https://ra.co/events/ar/buenosaires"]
    ],
    /* Tu vuelo: pantallas de check-in revisadas una por una el 12/11/2026 */
    aerolineas: [
    ["Aerolíneas Argentinas", "https://www.aerolineas.com.ar/?activeTab=checkIn"],
    ["Flybondi", "https://reserva.flybondi.com/booking/widget?carrier=fo&module=webcheckin"],
    ["JetSMART", "https://jetsmart.com/ar/es/minisitios/checkin"],
    ["LATAM", "https://www.latamairlines.com/ar/es/check-in"],
    ["GOL", "https://b2c.voegol.com.br/check-in/"],
    ["Sky Airline", "https://www.skyairline.com/argentina/check-in"],
    ["Copa Airlines", "https://checkin.copaair.com/"],
    ["Avianca", "https://www.avianca.com/es/mi-reserva/servicios/check-in-online"],
    ["American Airlines", "https://www.aa.com/check-in"],
    ["United", "https://www.united.com/es/ar/checkin"],
    ["Delta", "https://oci.delta.com/index.html"],
    ["Iberia", "https://www.iberia.com/ar/autocheckin-online/"],
    ["Air Europa", "https://www.aireuropa.com/ar/es/check-in"],
    ["Air France", "https://wwws.airfrance.com.ar/check-in"],
    ["KLM", "https://www.klm.com.ar/check-in"],
    ["Lufthansa", "https://www.lufthansa.com/ar/es/online-check-in"],
    ["ITA Airways", "https://www.ita-airways.com/ar/es/manage-my-bookings/manage/check-in"],
    ["British Airways", "https://www.britishairways.com/travel/olcilandingpageauthreq/public/es_ar"],
    ["Turkish Airlines", "https://www.turkishairlines.com/es-ar/flights/manage-booking/"],
    ["Emirates", "https://www.emirates.com/ar/spanish/manage-booking/online-check-in/"],
    ["Qatar Airways", "https://cki.qatarairways.com/cki-web/pages/autocheckin.xhtml"]
    ],
    vueloAeropuertos: "Ezeiza es para casi todos los vuelos internacionales; Aeroparque, para los de cabotaje y algunos a países vecinos. Fijate bien cuál es el tuyo.",
    /* Frases para defenderte: la frase queda en el idioma local y abajo se explica para qué sirve */
    idioma: "es",
    frases: [
    ["Hola, ¿cómo andás?", "Saludo amistoso, para cualquier momento"],
    ["¿Me traés la cuenta, por favor?", "Para pedir la cuenta en un bar o restaurante"],
    ["¿Puedo pagar con tarjeta?", "Antes de pedir, por si solo aceptan efectivo"],
    ["¿Cuánto sale?", "Para preguntar el precio"],
    ["¿Cómo llego a…?", "Para pedir indicaciones en la calle"],
    ["¿Dónde está el baño?", "Para encontrar el baño"],
    ["Una mesa para dos, por favor.", "Al llegar a un restaurante"],
    ["¿Qué me recomendás?", "Para pedir una sugerencia al mozo"],
    ["Soy celíaco: ¿tienen algo sin TACC?", "Para pedir comida sin gluten"],
    ["Perdón, no hablo bien castellano.", "Para que te hablen más despacio"],
    ["Necesito un médico.", "En una urgencia"],
    ["¡Gracias, muy amable!", "Para agradecer"]
    ],
    /* Aviso de bienvenida: qué hay en Info */
    aviso: ["🛬 Cómo salir del aeropuerto y llegar a tu alojamiento", "💳 Cómo pagar y dónde cambiar plata", "🚇 La tarjeta SUBE y cómo moverte",
      "⚠️ Las estafas más comunes y cómo evitarlas", "🆘 Teléfonos de emergencia, para tocar y llamar"]
  };
})();
