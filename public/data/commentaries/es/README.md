# Comentario en español (Nuevo Testamento)

Capa almacenada junto al inglés de dominio público. **No** se traduce en cada visita.
**No** se imita al autor. **No** es la edición de CLIE.

## Layout

```
data/commentaries/es/{libro-slug}/{authorId}.json
```

Forma:

```json
{
  "book": "Mateo",
  "usfm": "MAT",
  "authorId": "matthew-henry",
  "disclaimer": "Traducción automática del original inglés (dominio público). No es la edición de CLIE.",
  "blobs": {
    "b1": { "en": "...", "es": "...", "enHash": "sha256", "source": "corpus:matthew-henry" }
  },
  "verses": { "9:12": "b1" }
}
```

Una nota de rango se mapea a **cada** versículo cubierto (p. ej. Lucas 15:11–32 y Mateo 9:10–13). `lib/comentario-es.js` sirve la capa si el inglés actual coincide (texto o `enHash`, o el mismo blob por hash en el libro). Si no hay fila, se muestra el inglés del corpus. Nunca se llama a la IA en la petición.

## Autores

| Autor | NT completo en esta corrida | Notas |
| --- | --- | --- |
| Matthew Henry | sí | helloao complete commentary (no Concise). Mateo 19–28: helloao 404, miss honesto |
| C. H. Spurgeon | sí | SPE / prayerrequest. 2 Juan y 3 Juan: 0 hits. Filemón: 1 hit |
| Adam Clarke | sí | helloao cuando el libro existe; **Mateo no está en helloao** → ACC PD (truthaccordingtoscripture / StudyLight) |
| John Wesley | sí | CrossWire + Christianity.com + BibleHub |
| Juan Calvino | Mateo, Juan, Lucas, Filemón | helloao; NT entero omitido por volumen |
| Jamieson-Fausset-Brown | Mateo, Juan, Lucas, Filemón | idem |
| John Gill | Mateo, Juan, Lucas, Filemón | idem |

Cobertura concreta: `data/commentaries/es/COVERAGE.json` (se regenera al correr el script).

## Regenerar

```bash
node scripts/traducir-comentario-lucas.js
PRIORITY_ONLY=1 node scripts/traducir-comentario-lucas.js
BOOKS=Mateo,Juan AUTHORS=matthew-henry,adam-clarke node scripts/traducir-comentario-lucas.js
```

El script cosecha el **mismo** inglés que `/api/commentary` y traduce una vez. Copia a `public/data/commentaries/es/`.

## Treasury of David

No se ingirió un dump nuevo. CrossWire declara TDavid como Public Domain, pero no hay JSON/texto limpio (CCEL/sacred-texts) sin scrapear el visor HTML; Salmo 23:1 no devolvió nota usable por el parser actual. Se omite. No se toca CCEL HTML ni apps con copyright.

## Lo que no hay

- Guzik / Enduring Word
- Traducción en vivo en cada request
- Notas inventadas cuando el corpus inglés no tiene hit
- Palabra «certificada»
