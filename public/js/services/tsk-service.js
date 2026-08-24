/**
 * Éfata RevelatiO — tsk-service.js
 * Treasury of Scripture Knowledge: cadenas canónicas por versículo.
 */

const REF_ALIASES = {
  james: 'Santiago',
  jacobo: 'Santiago',
  santiago: 'Santiago',
};

function fold(s) {
  return String(s || '')
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/\s+/g, ' ')
    .trim();
}

function canonicalBook(book) {
  const raw = String(book || '').trim();
  const f = fold(raw);
  return REF_ALIASES[f] || raw;
}

export function normalizeTskRefKey(book, chapter, verse) {
  const b = canonicalBook(book);
  const c = String(chapter || '').trim();
  const v = String(verse || '').trim();
  if (!b || !c || !v) return '';
  return `${b} ${c}:${v}`;
}

export function parseTskRefKey(ref) {
  const m = String(ref || '')
    .trim()
    .match(/^(.+?)\s+(\d+)\s*:\s*(\d+)/);
  if (!m) return { book: '', chapter: '', verse: '', refKey: '' };
  const book = canonicalBook(m[1].trim());
  return { book, chapter: m[2], verse: m[3], refKey: `${book} ${m[2]}:${m[3]}` };
}

/** @type {Record<string, Array<{ phrase: string, theme?: string, refs: Array<string|{ passage: string, text?: string }> }>>} */
export const TSK_CROSS_REFERENCES_DB = {
  'Santiago 4:1': [
    {
      phrase: '¿De dónde vienen las guerras y los pleitos entre vosotros?',
      theme: 'Origen de las contiendas y división carnal',
      refs: [
        {
          passage: 'Santiago 3:14-18',
          text: 'Pero si tenéis celos amargos y contención en vuestro corazón, no os jactéis… la sabiduría que es de lo alto es primeramente pura, después pacífica.',
        },
        {
          passage: '1 Corintios 3:3',
          text: 'Porque aún sois carnales; pues habiendo entre vosotros celos, contiendas y disensiones, ¿no sois carnales, y andáis como hombres?',
        },
        {
          passage: 'Gálatas 5:19-21',
          text: 'Y manifiestas son las obras de la carne, que son: … enemistades, pleitos, celos, iras, contiendas, disensiones, herejías.',
        },
        {
          passage: 'Génesis 13:7-8',
          text: 'Y hubo contienda entre los pastores del ganado de Abram y los pastores del ganado de Lot.',
        },
      ],
    },
    {
      phrase: '¿No es de vuestras pasiones (hedonōn)?',
      theme: 'La tiranía del egoísmo y placeres desordenados',
      refs: [
        {
          passage: '1 Pedro 2:11',
          text: 'Amados, yo os ruego como a extranjeros y peregrinos, que os abstengáis de los deseos carnales que batallan contra el alma.',
        },
        {
          passage: 'Tito 3:3',
          text: 'Porque nosotros también éramos en otro tiempo insensatos, rebeldes, extraviados, esclavos de concupiscencias y deleites diversos…',
        },
        {
          passage: 'Lucas 22:24',
          text: 'Hubo también entre ellos una disputa sobre quién de ellos sería el mayor.',
        },
      ],
    },
    {
      phrase: 'Las cuales combaten en vuestros miembros',
      theme: 'Conflicto interior: la carne contra el Espíritu',
      refs: [
        {
          passage: 'Romanos 7:23',
          text: 'Pero veo otra ley en mis miembros, que se rebela contra la ley de mi mente, y que me lleva cautivo a la ley del pecado que está en mis miembros.',
        },
        {
          passage: 'Gálatas 5:17',
          text: 'Porque el deseo de la carne es contra el Espíritu, y el del Espíritu es contra la carne; y éstos se oponen entre sí.',
        },
        {
          passage: 'Colosenses 3:5',
          text: 'Haced morir, pues, lo terrenal en vuestros miembros: fornicación, impureza, pasiones desordenadas, malos deseos y avaricia, que es idolatría.',
        },
      ],
    },
  ],
};

function resolveDbKey(ref) {
  const parsed = parseTskRefKey(ref);
  if (TSK_CROSS_REFERENCES_DB[parsed.refKey]) return parsed.refKey;
  const target = fold(parsed.refKey || ref);
  return (
    Object.keys(TSK_CROSS_REFERENCES_DB).find((k) => fold(k) === target) ||
    parsed.refKey ||
    String(ref || '').trim()
  );
}

export function getTskSections(bookOrRef, chapter, verse) {
  let refKey = '';
  if (chapter == null && verse == null) {
    refKey = resolveDbKey(bookOrRef);
  } else {
    refKey = resolveDbKey(normalizeTskRefKey(bookOrRef, chapter, verse));
  }
  const sections = TSK_CROSS_REFERENCES_DB[refKey];
  return Array.isArray(sections) ? sections : [];
}

export function tskSectionsHaveRefs(sections) {
  return (
    Array.isArray(sections) &&
    sections.some((g) =>
      Array.isArray(g.refs) &&
      g.refs.some((r) => (typeof r === 'string' ? r : r?.passage))
    )
  );
}

function escapeHtml(s) {
  return String(s || '')
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;');
}

export function renderTskCrossReferences(container, book, chapter, verse) {
  if (!container) return false;
  const passageRef =
    chapter == null && verse == null
      ? String(book || '').trim()
      : normalizeTskRefKey(book, chapter, verse);
  const sections = getTskSections(passageRef);

  if (!tskSectionsHaveRefs(sections)) {
    container.innerHTML = `
      <div class="py-8 text-center text-stone-500 font-serif">
        <p class="text-sm">Buscando referencias cruzadas en el canon para ${escapeHtml(passageRef)}…</p>
      </div>`;
    return false;
  }

  container.innerHTML = `
    <div class="space-y-5 font-serif text-[#0F172A]">
      <div class="flex items-center justify-between pb-2 border-b border-[#E8DFC8] gap-2">
        <div class="min-w-0">
          <h3 class="text-xs font-mono font-bold text-[#855D10] uppercase tracking-wider">Treasury of Scripture Knowledge</h3>
          <p class="text-[11px] text-stone-500 italic truncate">La Escritura interpretando a la Escritura · ${escapeHtml(passageRef)}</p>
        </div>
        <span class="text-[10px] font-mono font-bold px-2 py-0.5 bg-[#C59B27]/15 text-[#855D10] rounded border border-[#C59B27]/30 shrink-0">TSK</span>
      </div>

      <div class="space-y-4">
        ${sections
          .map(
            (group) => `
          <div class="bg-white border border-[#E8DFC8] rounded-xl p-4 shadow-sm">
            <div class="mb-3 pb-2 border-b border-stone-100">
              <span class="text-xs font-serif font-bold text-[#0A192F] block">«${escapeHtml(group.phrase)}»</span>
              ${
                group.theme
                  ? `<span class="text-[10px] font-mono font-semibold text-[#C59B27] uppercase tracking-wide block mt-0.5">${escapeHtml(group.theme)}</span>`
                  : ''
              }
            </div>
            <div class="space-y-2.5">
              ${(group.refs || [])
                .map((r) => {
                  const passage = typeof r === 'string' ? r : r.passage;
                  const text = typeof r === 'string' ? '' : r.text || '';
                  return `
                <div class="p-2.5 rounded-lg bg-amber-50/40 hover:bg-amber-50 border border-transparent hover:border-[#C59B27]/30 transition-all text-left">
                  <div class="flex items-center justify-between gap-2 mb-1">
                    <button type="button" class="text-xs font-mono font-bold text-[#855D10] hover:underline text-left" data-sp-tsk-ref="${escapeHtml(passage)}" title="Vista previa / ir al pasaje">${escapeHtml(passage)}</button>
                    <button type="button" data-sp-tsk-ref="${escapeHtml(passage)}" class="text-[10px] font-sans text-stone-500 hover:text-[#0A192F] underline shrink-0">Ver contexto</button>
                  </div>
                  ${text ? `<p class="text-xs font-serif text-stone-700 leading-relaxed">${escapeHtml(text)}</p>` : ''}
                </div>`;
                })
                .join('')}
            </div>
          </div>`
          )
          .join('')}
      </div>
    </div>
  `;
  return true;
}

export default {
  TSK_CROSS_REFERENCES_DB,
  getTskSections,
  tskSectionsHaveRefs,
  renderTskCrossReferences,
  normalizeTskRefKey,
  parseTskRefKey,
};
