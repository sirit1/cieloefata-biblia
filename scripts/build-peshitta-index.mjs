import fs from 'node:fs'
const sourcePath = new URL('../public/biblia-peshitta-approved.txt', import.meta.url)
const lines = fs.readFileSync(sourcePath, 'utf8').replace(/\r/g, '').split('\n')

const BOOKS = [
  ['GÉNESIS', ['GÉNESIS']], ['ÉXODO', ['ÉXODO']], ['LEVÍTICO', ['LEVÍTICO']], ['NÚMEROS', ['NÚMEROS']], ['DEUTERONOMIO', ['DEUTERONOMIO']], ['JOSUÉ', ['JOSUÉ']], ['JUECES', ['JUECES']], ['RUT', ['RUT']],
  ['1 SAMUEL', ['1° SAMUEL', '1ª SAMUEL', 'PRIMER LIBRO DE SAMUEL', 'PRIMER LIBRO DE']], ['2 SAMUEL', ['2° SAMUEL', '2ª SAMUEL', 'SEGUNDO LIBRO DE SAMUEL']], ['1 REYES', ['1° REYES', '1ª REYES', 'PRIMER LIBRO DE REYES']], ['2 REYES', ['2° REYES', '2ª REYES', 'SEGUNDO LIBRO DE REYES']],
  ['1 CRÓNICAS', ['1° CRÓNICAS', '1ª CRÓNICAS', 'PRIMER LIBRO DE CRÓNICAS']], ['2 CRÓNICAS', ['2° CRÓNICAS', '2ª CRÓNICAS', 'SEGUNDO LIBRO DE CRÓNICAS']], ['ESDRAS', ['ESDRAS']], ['NEHEMÍAS', ['NEHEMÍAS']], ['ESTER', ['ESTER']], ['JOB', ['JOB']], ['SALMOS', ['SALMOS']], ['PROVERBIOS', ['PROVERBIOS']], ['ECLESIASTÉS', ['ECLESIASTÉS']], ['CANTARES', ['CANTARES']], ['ISAÍAS', ['ISAÍAS']], ['JEREMÍAS', ['JEREMÍAS']], ['LAMENTACIONES', ['LAMENTACIONES']], ['EZEQUIEL', ['EZEQUIEL']], ['DANIEL', ['DANIEL']], ['OSEAS', ['OSEAS']], ['JOEL', ['JOEL']], ['AMÓS', ['AMÓS']], ['ABDÍAS', ['ABDÍAS']], ['JONÁS', ['JONÁS']], ['MIQUEAS', ['MIQUEAS']], ['NAHUM', ['NAHÚM', 'NAHUM']], ['HABACUC', ['HABACUC']], ['SOFONÍAS', ['SOFONÍAS']], ['HAGEO', ['HAGEO']], ['ZACARÍAS', ['ZACARÍAS']], ['MALAQUÍAS', ['MALAQUÍAS']],
  ['MATEO', ['MATEO']], ['MARCOS', ['MARCOS']], ['LUCAS', ['LUCAS']], ['JUAN', ['JUAN']], ['HECHOS', ['LOS', 'HECHOS', 'LOS HECHOS']], ['ROMANOS', ['ROMANOS']], ['1 CORINTIOS', ['1ª CORINTIOS', '1° CORINTIOS']], ['2 CORINTIOS', ['2ª CORINTIOS', '2° CORINTIOS']], ['GÁLATAS', ['GÁLATAS']], ['EFESIOS', ['EFESIOS']], ['FILIPENSES', ['FILIPENSES']], ['COLOSENSES', ['COLOSENSES']], ['1 TESALONICENSES', ['1ª TESALONICENSES', '1° TESALONICENSES']], ['2 TESALONICENSES', ['2ª TESALONICENSES', '2° TESALONICENSES']], ['1 TIMOTEO', ['1ª TIMOTEO', '1° TIMOTEO']], ['2 TIMOTEO', ['2ª TIMOTEO', '2° TIMOTEO']], ['TITO', ['TITO']], ['FILEMÓN', ['FILEMÓN']], ['HEBREOS', ['HEBREOS']], ['SANTIAGO', ['SANTIAGO']], ['1 PEDRO', ['1ª PEDRO', '1° PEDRO']], ['2 PEDRO', ['2ª PEDRO', '2° PEDRO']], ['1 JUAN', ['1ª JUAN', '1° JUAN']], ['2 JUAN', ['2ª JUAN', '2° JUAN']], ['3 JUAN', ['3ª JUAN', '3° JUAN']], ['JUDAS', ['JUDAS']], ['APOCALIPSIS', ['APOCALIPSIS']],
]

const fold = (value) => String(value).normalize('NFD').replace(/[\u0300-\u036f]/g, '').toUpperCase().replace(/[ªº°]/g, '').replace(/[^A-Z0-9 ]/g, ' ').replace(/\s+/g, ' ').trim()
const isPageNumber = (line) => /^\s*\d{3,5}\s*$/.test(line)
const verseStart = (line) => line.match(/^\s*(?:>\s*)?(\d{1,3})\s+(.+?)\s*$/)
const prefixedVerse = (line) => line.match(/^\s*(?:>\s*)?(\d{1,3})(?:\s+|$)(.*)$/)
const markedNumber = (line) => line.match(/^\s*>\s*(\d{1,3})\s*$/)
const chapterHeading = (index) => {
  const match = /^\s*(?:>\s*)?(\d{1,3})\s*$/.exec(lines[index])
  if (!match) return null
  const next = lines[index + 1]?.trim() || ''
  return next && !verseStart(lines[index + 1] || '') && !isPageNumber(next) ? match : null
}

function findBookStart(book, from) {
  const needles = book[1].map(fold)
  for (let i = from; i < lines.length; i += 1) {
    const line = fold(lines[i])
    if (!line || isPageNumber(lines[i])) continue
    const nextLine = fold(lines[i + 1] || '')
    const combined = `${line} ${nextLine}`.trim()
    const exact = needles.some((needle) => line === needle || combined === needle || combined.includes(needle)) && !/TABLA|CONTENIDO|CRONOLOGICO|APROX/.test(combined)
    if (i > 100 && exact && (line.length < 42 || /LIBRO|EPÍSTOLA|APÓSTOL|HECHOS|LOS/.test(line)) && !/CONTENIDO|CRONOLOGICO|APROX/.test(combined)) return i
    if (book[0] === 'HECHOS' && i > 100 && line === 'LOS' && nextLine === 'HECHOS') return i
    if (book[0] === 'HECHOS' && i > 100 && line === 'HECHOS' && nextLine === 'DE LOS APOSTOLES') return i
    if (book[0] === 'HECHOS' && i > 86000 && line === 'LOS' && nextLine === 'HECHOS') return i
  }
  return -1
}

function cleanText(parts) {
  return parts.join(' ').replace(/\s+/g, ' ').replace(/\s+([,.;:!?])/g, '$1').replace(/\s+([”’])/g, '$1').trim()
}

const starts = []
let cursor = 0
for (const book of BOOKS) {
  const start = findBookStart(book, cursor)
  if (start < 0) throw new Error(`No se encontró marcador para ${book[0]}`)
  starts.push({ book: book[0], start })
  cursor = start + 1
}

const rows = []
console.log('[v0] HECHOS start/end:', starts.find((item) => item.book === 'HECHOS'), starts.find((item) => item.book === 'ROMANOS'))
for (let b = 0; b < starts.length; b += 1) {
  const { book, start } = starts[b]
  const end = starts[b + 1]?.start ?? lines.length
  let chapter = 0
  let current = null
  for (let i = start; i < end; i += 1) {
    const chapterMatch = chapterHeading(i)
    if (chapterMatch && Number(chapterMatch[1]) > chapter) {
      chapter = Number(chapterMatch[1])
      current = null
      continue
    }
    const marked = markedNumber(lines[i])
    const prefixed = prefixedVerse(lines[i])
    const match = verseStart(lines[i]) || (marked && prefixedVerse(lines[i + 1]) ? [lines[i], marked[1], prefixedVerse(lines[i + 1])[2]] : null) || (prefixed && prefixed[2] ? prefixed : null)
    if (match && chapter >= 1 && !isPageNumber(lines[i])) {
      const verse = Number(match[1])
      if (verse >= 1 && verse <= 200) {
        const inlineText = match[2] || ''
        current = { libro: book, capitulo: chapter, versiculo: verse, parts: inlineText ? [inlineText] : [] }
        rows.push(current)
        continue
      }
    }
    if (current && lines[i].trim() && !/^[a-z]$/.test(lines[i].trim()) && !/^\d{3,5}$/.test(lines[i].trim())) current.parts.push(lines[i].trim())
  }
}

const normalized = rows.map(({ parts, ...row }) => ({ ...row, texto: cleanText(parts) })).filter((row) => row.texto.length > 2)
const unique = new Map()
for (const row of normalized) {
  const key = `${row.libro}|${row.capitulo}|${row.versiculo}`
  if (!unique.has(key)) unique.set(key, row)
  else if (row.texto.length > unique.get(key).texto.length) unique.set(key, row)
}
const output = [...unique.values()]
console.log('[v0] extracted books/chapters:', [...new Set(output.filter((row) => row.libro === 'HECHOS').map((row) => row.capitulo))])
const hechos24 = output.find((row) => row.libro === 'HECHOS' && row.capitulo === 2 && row.versiculo === 4)
if (!hechos24 || !/llenos del Espíritu Santo/i.test(hechos24.texto)) throw new Error(`Validación fallida Hechos 2:4: ${JSON.stringify(hechos24)}`)
if (output.length < 25000) throw new Error(`Cobertura sospechosamente baja: ${output.length}`)
fs.writeFileSync(new URL('../public/peshitta-index-approved.json', import.meta.url), `${JSON.stringify(output)}\n`)
console.log(JSON.stringify({ books: starts.length, rows: output.length, hechos24, markers: starts }, null, 2))
