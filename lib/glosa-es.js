/**
 * Glosas Strong y lemas cortos de Bolls/Thayer → español.
 * Las short_definition de Bolls suelen ser una palabra inglesa.
 */

const POR_CODIGO = {
  G40: 'Santo, consagrado, separado para Dios.',
  G212: 'Jactancia, arrogancia, presunción vanagloriosa.',
  G235: 'Sino, mas; adversativa que introduce un contraste.',
  G444: 'Hombre, ser humano.',
  G846: 'Él, ella, ello; mismo, mismo él.',
  G1063: 'Porque, pues; introduce la razón o explicación.',
  G1161: 'Y, pero, por otra parte (partícula de transición).',
  G1223: 'Por, a través de, por medio de.',
  G1519: 'Hacia, para, a (dirección o propósito).',
  G1537: 'De, desde, fuera de.',
  G1722: 'En, dentro de, entre; en el ámbito de.',
  G2307: 'Voluntad; lo que uno desea o determina.',
  G2316: 'Dios; el Dios verdadero.',
  G2443: 'Para que, a fin de que.',
  G2532: 'Y, también, aun.',
  G2744: 'Jactarse, gloriarse, alardear.',
  G2746: 'Jactancia, gloria; el acto de gloriarse.',
  G2980: 'Hablar, decir, declarar.',
  G3568: 'Ahora, en este momento; de ahora en adelante.',
  G3588: 'El, la, lo (artículo determinado).',
  G3754: 'Que, porque (conjunción).',
  G3756: 'No, jamás; negación absoluta (οὐ).',
  G5108: 'Tal, semejante, de esa clase.',
  G4151: 'Espíritu; aliento, viento; el Espíritu de Dios.',
  G4218: 'Alguna vez, jamás, en tiempo alguno.',
  G4314: 'Hacia, con, ante.',
  G4394: 'Profecía; mensaje inspirado, proclamación profética.',
  G5210: 'A vosotros, para vosotros, por vosotros.',
  G5259: 'Por, bajo, de parte de (agente).',
  G5342: 'Llevar, traer, portar.',
};

const PALABRAS = {
  not: 'no',
  no: 'no',
  never: 'nunca / jamás',
  nor: 'ni',
  and: 'y',
  for: 'porque / pues',
  because: 'porque',
  but: 'sino / mas',
  yet: 'sin embargo',
  or: 'o',
  if: 'si',
  when: 'cuando',
  where: 'donde',
  who: 'quien',
  which: 'el cual',
  that: 'que',
  this: 'este',
  these: 'estos',
  the: '',
  a: '',
  an: '',
  of: 'de',
  to: 'a',
  in: 'en',
  on: 'sobre',
  by: 'por',
  from: 'desde',
  with: 'con',
  without: 'sin',
  under: 'bajo',
  among: 'entre / por medio de',
  into: 'hacia',
  upon: 'sobre',
  be: 'ser / estar',
  is: 'es',
  was: 'fue',
  were: 'fueron',
  been: 'sido',
  being: 'siendo',
  will: 'voluntad',
  would: 'habría',
  shall: 'ha de',
  can: 'puede',
  may: 'puede',
  man: 'hombre',
  men: 'hombres',
  human: 'humano',
  person: 'persona',
  people: 'pueblo',
  god: 'Dios',
  lord: 'Señor',
  spirit: 'espíritu',
  holy: 'santo',
  prophecy: 'profecía',
  prophet: 'profeta',
  word: 'palabra',
  speak: 'hablar',
  say: 'decir',
  said: 'dijo',
  bring: 'traer',
  bear: 'llevar / soportar',
  carry: 'llevar',
  come: 'venir',
  go: 'ir',
  give: 'dar',
  take: 'tomar',
  make: 'hacer',
  do: 'hacer',
  see: 'ver',
  hear: 'oír',
  know: 'conocer',
  love: 'amor',
  faith: 'fe',
  grace: 'gracia',
  hope: 'esperanza',
  truth: 'verdad',
  life: 'vida',
  death: 'muerte',
  light: 'luz',
  sin: 'pecado',
  glory: 'gloria',
  peace: 'paz',
  heaven: 'cielo',
  earth: 'tierra',
  heart: 'corazón',
  soul: 'alma',
  flesh: 'carne',
  blood: 'sangre',
  long: 'no / jamás',
  certain: 'cierto / un',
  sometime: 'alguna vez',
  sometimes: 'a veces',
  once: 'una vez',
  ever: 'jamás / alguna vez',
  always: 'siempre',
  also: 'también',
  even: 'aun',
  indeed: 'en verdad',
  therefore: 'por tanto',
  thus: 'así',
  so: 'así',
  then: 'entonces',
  now: 'ahora',
  henceforth: 'de ahora en adelante',
  hereafter: 'en adelante',
  boast: 'jactarse',
  boasting: 'jactancia',
  glory: 'gloria / gloriarse',
  proud: 'orgulloso',
  pride: 'orgullo',
  vain: 'vano',
  arrogance: 'arrogancia',
  about: 'en / acerca de',
  all: 'todo / todos',
  every: 'cada',
  any: 'cualquier',
  whole: 'entero',
  evil: 'malo / mal',
  bad: 'malo',
  good: 'bueno',
  like: 'semejante',
  such: 'tal',
  your: 'vuestro',
  our: 'nuestro',
  their: 'su',
  him: 'él',
  her: 'ella',
  them: 'ellos',
  you: 'vosotros',
  we: 'nosotros',
  i: 'yo',
  at: 'en / junto a',
  appear: 'aparecer',
  open: 'abrir',
  gate: 'puerta',
  gates: 'puertas',
  fire: 'fuego',
  desire: 'deseo',
  determine: 'determinar',
  wish: 'deseo',
  inspired: 'inspirado',
  moved: 'movido',
  wind: 'viento',
  breath: 'aliento',
};

const EN_HINT =
  /\b(the|and|of|to|be|not|for|from|with|that|this|will|man|men|long|among|sometime|sometimes|prophecy|certain|never|under|holy|spirit|god|lord|word|come|go|give|take|make|say|said|bear|bring|carry|once|ever)\b/i;

export function pareceIngles(texto) {
  const t = String(texto || '').trim();
  if (!t) return false;
  if (/[áéíóúñüÁÉÍÓÚÑÜ]/.test(t)) return false;
  if (/\b(voluntad|hombre|espíritu|profecía|sino|porque|jamás|santo|hablar|traer|llevar|bajo|nunca)\b/i.test(t)) {
    return false;
  }
  return EN_HINT.test(t) || /^[+/\-()\s]*[a-z]+([,\s;/]+[a-z]+)*$/i.test(t);
}

export function glosaEspanol(raw, codigo = '') {
  const key = String(codigo || '')
    .trim()
    .toUpperCase()
    .replace(/^([GH])0*(\d+)$/, '$1$2');
  if (POR_CODIGO[key]) return POR_CODIGO[key];

  const t = String(raw || '')
    .replace(/<[^>]+>/g, ' ')
    .replace(/^[+\-–—\s]+/, '')
    .replace(/\s+/g, ' ')
    .trim();
  if (!t) return POR_CODIGO[key] || '';
  if (!pareceIngles(t)) return t;
  return '';
}

export function limpiarTextoVerso(html) {
  return String(html || '')
    .replace(/<[^>]+>/g, ' ')
    .replace(/&nbsp;/g, ' ')
    .replace(/&amp;/g, '&')
    .replace(/&quot;/g, '"')
    .replace(/\s+/g, ' ')
    .trim();
}
