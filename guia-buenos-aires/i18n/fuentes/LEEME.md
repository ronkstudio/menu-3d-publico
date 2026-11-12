# Listas de traducción

Con estos archivos se arman los diccionarios de `i18n/dict/`.

- `ui.txt`, `extra.txt`, `tags.txt`, `desc.txt`, `tip.txt`: los textos en español, uno por línea.
- `re.txt`: reglas para textos con números ("Día 3", "5 lugares").
- `<idioma>.ui.txt`, `<idioma>.extra.txt`, `<idioma>.desc.txt`, `<idioma>.tip.txt`: la traducción, con el número de línea adelante (`12|Near me`). Una línea vacía después de la barra deja ese texto en español.
- `<idioma>.tags.pipe`: las etiquetas, en el mismo orden que `tags.txt`, separadas por `|`.
- `<idioma>.re.txt`: la traducción de cada regla, en el mismo orden que `re.txt`. `$1` copia el número; `{1}` traduce una lista de días.

Para armar un diccionario (Windows):

    powershell -ExecutionPolicy Bypass -File armar-dict.ps1 -lang pt -trad . -out ..\dict\pt.js

El armado avisa si una lista traducida no tiene la misma cantidad de líneas que la lista en español.

Estado: inglés completo. Portugués: todo menos las descripciones y los consejos de los lugares (`pt.desc.txt` y `pt.tip.txt` todavía no existen). Francés, italiano, alemán, chino y japonés: solo el menú.
