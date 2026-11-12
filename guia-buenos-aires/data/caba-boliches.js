/* Boliches: lugares para ir a bailar (tarjeta #63). Pedido de Bautista, 12/11.
   Se suman a la lista de data/caba.js con el tipo "Para bailar". Va en un archivo aparte para no cruzarse con otros cambios.

   Cada fila: [categoría, tipo, nombre, barrio, dirección, precio, descripción, consejo, etiquetas]
   precio: 1 = $, 2 = $$, 3 = $$$, 4 = $$$$.

   Cómo se verificó (12/11): que cada lugar figure en OpenStreetMap o en páginas de venta de entradas de 2026
   (payperapp.io, la lista de DJ Mag) o en sus redes. Los boliches abren y cierran seguido: conviene revisar esta lista cada tanto.
   Pedidos que no se cargaron: "Cruza" y "Singapur" (no aparecen en ningún lado), "Non Stop" (una fuente lo pone en Costanera Norte y otra en
   Puerto Madero, y ninguna da la dirección), "Brash" (es Bresh, una fiesta que se hace en Mandarine Park, no un boliche). */
(() => {
  "use strict";
  const city = window.CITY_DATA && window.CITY_DATA.caba;
  if (!city) return;

  const filas = [
    ["noche", "Para bailar", "Crobar", "Palermo", "Paseo de la Infanta, Av. del Libertador y Av. Pte. Figueroa Alcorta", 3, "El club de música electrónica más conocido de la ciudad, abierto desde 2005 y habitual en las listas de los mejores clubes del mundo.", "La noche arranca muy tarde: antes de las 2 hay poca gente. Andá y volvé en taxi o app.", ["boliche", "fiesta", "música"]],
    ["noche", "Para bailar", "Kika", "Palermo", "Honduras 5339", 2, "Boliche chico y muy porteño en Palermo Hollywood, con música variada según la noche.", "Los martes hay una fiesta internacional con mucho viajero; los jueves son un clásico.", ["boliche", "fiesta"]],
    ["noche", "Para bailar", "Amerika", "Almagro", "Gascón 1040", 2, "El boliche LGBT+ más famoso de la ciudad: tres pisos y pistas con distinta música.", "Abre también algunos domingos. Andá y volvé en taxi o app.", ["boliche", "fiesta", "lgbt"]],
    ["noche", "Para bailar", "Jet", "Palermo", "Av. Costanera Rafael Obligado 4801 (Costanera Norte)", 3, "Boliche frente al río en Costanera Norte, con electrónica, reggaetón y noches de música de los 80, 90 y 2000.", "Mayores de 18; algunos sábados piden más edad. Llevá documento.", ["boliche", "fiesta", "vista"]],
    ["noche", "Para bailar", "Mandarine Park", "Palermo", "Av. Costanera y Av. Sarmiento (Costanera Norte)", 3, "El espacio más grande de la Costanera: fiestas electrónicas enormes y noches de reggaetón. Ahí se hace la fiesta Bresh.", "Las fiestas cambian cada semana: mirá en sus redes cuál toca antes de ir.", ["boliche", "fiesta", "música"]],
    ["noche", "Para bailar", "Terrazas del Este", "Palermo", "Av. Costanera y Av. Sarmiento (Costanera Norte)", 2, "Terrazas al aire libre junto al río, con after office a mitad de semana y fiestas de fin de semana.", "El after office de los miércoles es la forma más tranquila de conocerlo.", ["boliche", "fiesta", "aire libre"]],
    ["noche", "Para bailar", "BNN (ex Banana)", "Palermo", "Av. Costanera Rafael Obligado 6201 (Costanera Norte)", 2, "Uno de los boliches más concurridos de la Costanera, con pista grande, reggaetón y cachengue.", "Mayores de 18; algunos sábados piden más edad. Los viernes suele haber mejores promociones de entrada.", ["boliche", "fiesta"]],
    ["noche", "Para bailar", "Caix", "Palermo", "Av. Costanera Rafael Obligado 1221 (Costa Salguero)", 3, "Boliche de música electrónica en el complejo Costa Salguero, junto al río.", "Mayores de 18. Andá y volvé en taxi o app: la Costanera no es para caminar de noche.", ["boliche", "fiesta", "música"]],
    ["noche", "Para bailar", "Museum", "San Telmo", "Perú 535", 2, "Un boliche clásico en un edificio de ladrillo y hierro de San Telmo, famoso por su after office.", "De noche, llegá y salí en taxi o app.", ["boliche", "fiesta", "historia"]],
    ["noche", "Para bailar", "Tamarisco", "Recoleta", "J. E. Uriburu 1073", 2, "Boliche de Recoleta con espíritu de peña: folclore, cumbia y música para bailar en grupo.", "Los jueves hay peña folclórica.", ["boliche", "fiesta", "folclore"]],
    ["noche", "Para bailar", "Mata", "Fuera de CABA", "Av. Rivadavia 13636, Ramos Mejía", 2, "Boliche grande del oeste del Gran Buenos Aires, sobre la avenida Rivadavia.", "Queda lejos del centro: andá y volvé en taxi o app. Confirmá en sus redes qué noches abre.", ["boliche", "fiesta"]]
  ];

  filas.forEach(f => {
    city.places.push({ cat: f[0], sub: f[1], name: f[2], barrio: f[3], address: f[4], price: f[5], desc: f[6], tip: f[7], tags: f[8] });
  });

  /* Ubicaciones [latitud, longitud]. Salen de OpenStreetMap; las "aprox." se pusieron a mano a partir de la dirección. */
  const coords = {
    "crobar": [-34.5693, -58.4203],
    "kika": [-34.5862, -58.4331],
    "amerika": [-34.5982, -58.4235],
    "jet": [-34.552, -58.4259],
    "mandarine-park": [-34.5652, -58.3988],
    "terrazas-del-este": [-34.5648, -58.3993],
    "bnn-ex-banana": [-34.55, -58.4297], // aprox.
    "caix": [-34.5689, -58.3954],
    "museum": [-34.6152, -58.3742], // aprox.
    "tamarisco": [-34.5945, -58.399], // aprox.
    "mata": [-34.6403, -58.5591]
  };
  const todas = (window.CITY_COORDS = window.CITY_COORDS || {});
  todas.caba = Object.assign(todas.caba || {}, coords);

  /* Días en que suelen abrir (0 = domingo … 6 = sábado), según sus páginas de venta de entradas o redes. */
  const X = window.CITY_EXTRA && window.CITY_EXTRA.caba;
  if (X) X.only = Object.assign(X.only || {}, {
    "jet": [4, 5, 6],
    "mandarine-park": [5, 6],
    "terrazas-del-este": [3, 5, 6],
    "bnn-ex-banana": [5, 6],
    "caix": [5, 6],
    "tamarisco": [4, 5, 6]
  });
})();
