/**
 * Engine law: DHH/TLA/NVI never relabel or fill with Reina-Valera.
 * Run: node tests/bible-no-swap.js
 */
import { isRvrFamily, emptyVersionPayload } from '../api/bible.js';

function assert(cond, msg) {
  if (!cond) throw new Error(msg);
}

assert(isRvrFamily('RV1960') === true, 'RV1960 is RVR family');
assert(isRvrFamily('RV1909') === true, 'RV1909 is RVR family');
assert(isRvrFamily('DHH') === false, 'DHH is not RVR family');
assert(isRvrFamily('TLA') === false, 'TLA is not RVR family');
assert(isRvrFamily('NVI') === false, 'NVI is not RVR family');
assert(isRvrFamily('LXX') === false, 'LXX is not RVR family');

const dhh = emptyVersionPayload(
  { name: 'Hebreos', esAT: false },
  9,
  { label: 'Dios Habla Hoy', packKey: 'dhh', requested: 'dhh' },
);
assert(dhh.success === false, 'empty DHH is not a silent success');
assert(dhh.version === 'Dios Habla Hoy', `DHH label leaked: ${dhh.version}`);
assert(!/reina-valera/i.test(dhh.version), 'must not relabel as RVR');
assert(Array.isArray(dhh.verses) && dhh.verses.length === 0, 'verses must be empty');
assert(/pack local y bolls vacíos/i.test(dhh.note), `honest note missing: ${dhh.note}`);
assert(dhh.data.versionesLista[0].key === 'dhh', 'pack key must stay dhh');

const tla = emptyVersionPayload(
  { name: 'Hebreos', esAT: false },
  9,
  { label: 'Traducción en Lenguaje Actual', packKey: 'tla', requested: 'tla' },
);
assert(tla.version === 'Traducción en Lenguaje Actual', `TLA label leaked: ${tla.version}`);
assert(tla.verses.length === 0, 'TLA verses must be empty');

console.log('✔ bible-no-swap: DHH/TLA empty payload keeps its label');
