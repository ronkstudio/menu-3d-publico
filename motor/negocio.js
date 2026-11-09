/* Menú 3D · datos del negocio que aparecen en los términos del servicio y en la política de privacidad.
   Mientras un dato esté vacío, la página lo muestra resaltado como "a completar". */
window.NEGOCIO = {
  marca: 'Menú 3D',
  titular: 'Bautista Bianchimani', /* nombre y apellido del titular (o razón social) */
  cuit: '',               /* CUIT, ej. 20-12345678-9 */
  email: 'cocobbstudio@gmail.com', /* mail de contacto */
  whatsapp: '11 2312-1409',
  ciudad: 'la Ciudad Autónoma de Buenos Aires', /* para la jurisdicción, ej. 'la Ciudad Autónoma de Buenos Aires' */
  actualizado: '9 de noviembre de 2026'
};
/* completa los <span data-dato="..."> de la página */
document.addEventListener('DOMContentLoaded', function () {
  var nombres = { titular: 'tu nombre y apellido', cuit: 'tu CUIT', email: 'tu mail', ciudad: 'tu ciudad' };
  [].forEach.call(document.querySelectorAll('[data-dato]'), function (s) {
    var k = s.dataset.dato, v = window.NEGOCIO[k];
    if (v) s.textContent = v;
    else { s.textContent = '[a completar: ' + (nombres[k] || k) + ']'; s.className = 'falta'; }
  });
});
