# Comentario en español (piloto Lucas)

Capa almacenada junto al inglés de dominio público. **No** se traduce en cada visita.
**No** se imita al autor. **No** es la edición de CLIE.

## Layout

```
data/commentaries/es/{libro-slug}/{authorId}.json
```

Piloto:

- `lucas/matthew-henry.json`
- `lucas/charles-spurgeon.json`
- `lucas/adam-clarke.json`
- `lucas/john-wesley.json`

Forma:

```json
{
  "book": "Lucas",
  "usfm": "LUK",
  "authorId": "matthew-henry",
  "disclaimer": "Traducción automática del original inglés (dominio público). No es la edición de CLIE.",
  "blobs": {
    "b1": { "en": "...", "es": "...", "enHash": "sha256", "source": "corpus:matthew-henry" }
  },
  "verses": { "15:18": "b1" }
}
```

`lib/comentario-es.js` solo sirve la capa si el inglés actual coincide (texto o `enHash`).
Si no hay fila, se muestra el inglés del corpus. Nunca se llama a la IA en la petición.

## Extender a otro libro

1. Cosechar el inglés con `obtenerComentarioCorpus` (la misma cadena `found:true`).
2. Traducir una vez con `scripts/traducir-comentario-lucas.js` (`BOOK=Juan USFM=JHN`).
3. Guardar bajo `data/commentaries/es/{slug}/`.
4. Copiar a `public/data/commentaries/es/` si el preview sirve `public/`.

Henry Concise no está en helloao; el piloto traduce la nota completa que ya sirve el corpus.
