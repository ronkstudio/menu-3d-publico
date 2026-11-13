/* Lista de ciudades de la guía (tarjeta #98).

   Cada fila: id (el mismo de sus archivos en data/), nombre, país, bandera y los archivos de datos que hay que cargar, en orden.
   La primera de la lista es la que se abre si la persona todavía no eligió ninguna.
   Solo se cargan los archivos de la ciudad elegida (lo hace js/ciudad.js).

   Para sumar una ciudad: armar sus archivos (ver NUEVA-CIUDAD.md) y agregar acá su fila. */
window.GUIA_CIUDADES = [
  { id: "caba", name: "Buenos Aires", country: "Argentina", flag: "🇦🇷",
    files: ["caba", "caba-coords", "caba-extra", "caba-zones", "caba-mas", "caba-boliches", "caba-hoy", "caba-local"] },
  { id: "berlin", name: "Berlín", country: "Alemania", flag: "🇩🇪",
    files: ["berlin", "berlin-coords", "berlin-extra", "berlin-zones", "berlin-hoy", "berlin-local"] }
];
