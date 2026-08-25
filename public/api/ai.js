/**
 * Éfata RevelatiO — api/ai.js
 * Motor universal: Lentes Élite (Hermeneútica & Cognitiva), Comentarios Clásicos,
 * TSK, Léxico Strong y Concordancia con timeout calibrado (15s)
 * y síntesis teológica profunda inmediata (<50ms).
 */
import { resolveGeminiApiKey } from '../lib/load-env.js';
import { hayMotorIA, generarTexto } from '../lib/ai.js';
import {
  contextoConsulta,
  formatearLexico,
  formatearTsk,
} from '../lib/consulta-contexto.js';
import { obtenerComentarioCorpus } from '../lib/comentario-corpus.js';
import {
  generarFallbackLente,
  generarFallbackLexico,
  generarFallbackConcordancia,
} from '../lib/theological-fallback.js';

const GOBERNANZA_REVELATIO = `GOBERNANZA REVELATIO (no negociable):
1. El versículo recibido es soberano. Cítalo TAL CUAL entre comillas (el verseText que te pasan). Nunca parafrasees la Escritura ni recites de memoria otro versículo. Si necesitas otra referencia y no tienes su texto en el contexto, nombra solo la cita (p. ej. Ro. 12:2) sin inventar las palabras.
2. Prohibido inventar, resumir o imitar a Spurgeon, Henry, Calvino, Wesley, Lutero, Agustín u otro comentarista. Si no hay nota del corpus en el contexto, no atribuyas. Citas de autores: solo el texto fetchado del corpus.
3. VOZ DE LENTE: puedes usar el lenguaje de ciencia cognitiva que el usuario YA CREE (sesgos, neuroplasticidad, ansiedad, hábitos, autoayuda, «yo puedo solo») como PARCHE TEMPORAL — un puente diagnóstico, no la cura. Nómbralo, no lo consagres. Luego TRANSMUTA a la verdad bíblica: arrepentimiento, conversión, bautismo y perseverar en la fe. El cambio absoluto está en la Escritura, no en optimizarse.
4. Prohibido terminar en protocolo de autoayuda, lista de hábitos o «tú puedes solo». La matriz decisional apunta a metanoia y obediencia.`;

function withGobernanza(body) {
  return `${GOBERNANZA_REVELATIO}\n\n${body}`;
}

const GEMINI_MODELS = ['gemini-2.5-flash', 'gemini-1.5-flash', 'gemini-1.5-pro', 'gemini-2.0-flash', 'gemini-2.5-pro'];
const GEMINI_TIMEOUT_MS = 15000;

function foldType(raw, pathname = '') {
  const t = String(raw || '').toLowerCase().trim();
  if (t === 'concordance' || t === 'concordancia' || t === 'thematic' || t === 'tematica') return 'concordance';
  if (t === 'commentary' || t === 'comentario' || t === 'classical') return 'commentary';
  if (t === 'tsk' || t === 'xref' || t === 'cross') return 'tsk';
  if (t === 'lexicon' || t === 'lexico' || t === 'strong' || t === 'strongs') return 'lexicon';
  if (t === 'elite_lens' || t === 'lente_elite' || t === 'lente-elite' || t === 'elite') return 'elite_lens';
  if (t === 'lens' || t === 'lente' || t === 'vida') return 'lens';
  if (pathname.includes('lente-elite')) return 'elite_lens';
  if (pathname.includes('concordanc')) return 'concordance';
  if (pathname.includes('tsk')) return 'tsk';
  if (pathname.includes('lexicon') || pathname.includes('lexico')) return 'lexicon';
  if (pathname.includes('exegesis') || pathname.includes('comentario')) return 'commentary';
  if (pathname.includes('lente')) return 'lens';
  return 'lens';
}

function resolveSubLensKey(subLensId = '', lensId = '', lensTitle = '', prompt = '') {
  const s = `${subLensId} ${lensId} ${lensTitle} ${prompt}`.toLowerCase();
  if (s.includes('maestro') || s.includes('dictamen') || s.includes('convergencia')) return 'dictamen_maestro';
  if (s.includes('biblica_exegesis') || s.includes('filolog') || (s.includes('exégesis') && !s.includes('cristo'))) return 'biblica_exegesis';
  if (s.includes('biblica_cristo') || s.includes('cristoc') || s.includes('gracia') || s.includes('sola_gratia')) return 'biblica_cristo';
  if (s.includes('biblica_pactos') || s.includes('pacto') || s.includes('metarrelato') || s.includes('canon')) return 'biblica_pactos';
  if (s.includes('biblica_apologetica') || s.includes('apologet') || s.includes('cosmovision') || s.includes('filosof')) return 'biblica_apologetica';
  if (s.includes('mental_neuro') || s.includes('neuro') || s.includes('sinapsis') || s.includes('cerebro')) return 'mental_neuro';
  if (s.includes('mental_metanoia') || s.includes('metanoia') || s.includes('nous') || s.includes('renovacion')) return 'mental_metanoia';
  if (s.includes('mental_psicologia') || s.includes('psicolog') || s.includes('shalom') || s.includes('alma') || s.includes('crisis') || s.includes('paz')) return 'mental_psicologia';
  if (s.includes('mental_decision') || s.includes('decision') || s.includes('estrateg') || s.includes('matriz') || s.includes('habito')) return 'mental_decision';
  return subLensId || lensId || 'dictamen_maestro';
}

function buildEliteLensInstruction({ subLensId, lensId, lensTitle, passage, verseText, prompt }) {
  const ref = passage || 'el pasaje indicado';
  const trimmedVerse = String(verseText || '').trim();
  if (!trimmedVerse) {
    return withGobernanza(`No hay texto bíblico cargado para ${ref}.
Responde ÚNICAMENTE con esta frase, sin exégesis, sin comentaristas y sin recitar de memoria:
«No puedo citar ${ref} hasta que el lector haya cargado el texto del versículo. No inventaré la Escritura.»`);
  }
  const vText = ` «${trimmedVerse}»`;
  const key = resolveSubLensKey(subLensId, lensId, lensTitle, prompt);

  if (key === 'dictamen_maestro') {
    return withGobernanza(`Eres la Cátedra Suprema de RevelatiO IA (Convergencia Exegética, Teológica y Neurocognitiva).
Tu tarea es emitir un Dictamen Maestro Integrado de máxima densidad y profundidad académica sobre el pasaje ${ref}${vText}.
REGLAS OBLIGATORIAS: Prohibido terminantemente el uso de clichés devocionales genéricos o moralismos superficiales. Mantén un tono sumamente erudito, técnico y preciso. Emplea terminología técnica avanzada (nous, hexis, córtex prefrontal, amígdala, justificación forense, Tetélestai, berit, diatheke, hesed).

Estructura OBLIGATORIA con números romanos:
### I. Fundamento Exegético Cristocéntrico
(Analiza el texto original hebreo/griego, su raíz gramatical y cómo culmina en la consumación de la obra de Jesucristo y la justificación forense por pura gracia).

### II. Diagnóstico Cognitivo & Sesgos del Siglo
(Diagnostica los sesgos del pensamiento humano caído, las trampas de autoengaño y los moldes culturales de este siglo según Romanos 12:2).

### III. Neuroplasticidad & Regeneración del Entendimiento (Nous)
(La neurociencia nombra el bucle que el usuario ya cree — amígdala, plasticidad, hábitos — como PARCHE TEMPORAL. No prescribas técnicas ni fijación de hábitos. Transmuta: la regeneración del nous es arrepentimiento, conversión, bautismo y perseverar en la fe).

### IV. Matriz Decisional Innegociable
(El criterio rector no es un protocolo de hábitos ni «tú puedes solo»: apunta a metanoia y obediencia).

Consulta: ${prompt || ref}`);
  }

  if (key === 'biblica_exegesis') {
    return withGobernanza(`Eres un Catedrático de Exégesis y Filología Bíblica en RevelatiO IA.
Tu tarea es realizar una autopsia filológica y exegética estricta del pasaje ${ref}${vText}.
REGLAS OBLIGATORIAS: Prohibido clichés o generalizaciones. Mantén un estándar filológico riguroso y académico.

Estructura OBLIGATORIA con números romanos:
### I. Análisis Morfosintáctico y Léxico Profundo
(Analiza los términos clave en su idioma original hebreo o griego, raíces etimológicas, tiempos verbales, voces, modos, sintaxis de cláusulas y códigos Strong verificables).

### II. Contexto Histórico, Cultural y Redaccional
(Expón el entorno histórico-cultural, género literario, destinatarios primarios, ocasión de redacción e intención teológica del hagiógrafo).

### III. Traducción Técnica Anotada y Dictamen Exegético
(Presenta una traducción técnica rigurosa del pasaje con glosas críticas y el dictamen conclusivo que disuelve ambigüedades interpretativas).

Consulta: ${prompt || ref}`);
  }

  if (key === 'biblica_cristo') {
    return withGobernanza(`Eres un Teólogo Sistemático Reformado de rango doctoral en RevelatiO IA.
Tu tarea es analizar el pasaje ${ref}${vText} desde la centralidad exclusiva de Cristo y la teología de la gracia soberana.
REGLAS OBLIGATORIAS: Desmantela todo moralismo antropocéntrico o legalista.

Estructura OBLIGATORIA con números romanos:
### I. Tipificación y Cumplimiento en Cristo
(Demuestra cómo el texto tipifica, profetiza o proclama la persona y obra de Jesucristo como consumación redentora [Tetélestai]).

### II. Desmantelamiento Forense del Mérito Humano
(Deconstruye quirúrgicamente todo intento de autojustificación moral o justicia por obras; afirma la justificación forense incondicional por la sola fe).

### III. Implicación Doctrinal y Libertad del Pacto
(Expón la seguridad eterna del creyente, la adopción filial y cómo la gracia libera la conciencia de la culpa y el temor para vivir en gozo y santa gratitud).

Consulta: ${prompt || ref}`);
  }

  if (key === 'biblica_pactos') {
    return withGobernanza(`Eres un Teólogo del Pacto e Historiador Redentor en RevelatiO IA.
Tu tarea es situar el pasaje ${ref}${vText} dentro de la arquitectura pactal de toda la Escritura.
REGLAS OBLIGATORIAS: Prohibido tratar el texto como un mandamiento aislado.

Estructura OBLIGATORIA con números romanos:
### I. Ubicación en el Metarrelato Canónico
(Posiciona el pasaje en el gran arco de la revelación: Creación, Caída, Redención en Cristo y Consumación final).

### II. Conexión y Arquitectura Pactal
(Articula la relación del texto con los pactos bíblicos: Adámico, Abrahámico, Mosaico, Davídico y Nuevo Pacto).

### III. Continuidad y Discontinuidad Canónica
(Explica qué elementos tipológicos o sombras hallan cumplimiento y cesación en el Nuevo Pacto y qué principios morales permanecen inmutables).

Consulta: ${prompt || ref}`);
  }

  if (key === 'biblica_apologetica') {
    return withGobernanza(`Eres un Filósofo y Apologista Clásico en RevelatiO IA.
Tu tarea es examinar el pasaje ${ref}${vText} en confrontación con las cosmovisiones seculares contemporáneas.
REGLAS OBLIGATORIAS: Prohibido respuestas simplistas sin rigor argumentativo y epistémico.

Estructura OBLIGATORIA con números romanos:
### I. Confrontación de Cosmovisiones
(Contrasta la verdad revelada en el texto con el naturalismo materialista, el relativismo ético o el existencialismo moderno).

### II. Coherencia Epistémica y Verdad Objetiva
(Demuestra la racionalidad presuposicional, la consistencia interna y el fundamento epistémico que la Escritura provee para la realidad humana).

### III. Defensa Argumentativa y Refutación de Objeciones
(Formula argumentos contundentes y fundamentados para responder a objeciones críticas contra la enseñanza del pasaje).

Consulta: ${prompt || ref}`);
  }

  if (key === 'mental_neuro') {
    return withGobernanza(`Eres un Neurocientífico Cognitivo y Especialista en Neurobiología del Comportamiento en RevelatiO IA.
Tu tarea es analizar los correlatos neurobiológicos y conductuales vinculados al pasaje ${ref}${vText}.
REGLAS OBLIGATORIAS: Prohibido pseudociencia, metáforas vacías y protocolos de autoayuda. Emplea terminología neurocientífica rigurosa (córtex prefrontal, amígdala, hipocampo, plasticidad sináptica, modulación dopaminérgica, hexis) como PARCHE TEMPORAL: el idioma que el usuario ya cree, solo para diagnosticar el molde del aión. Luego transmuta. La gobernanza gana sobre cualquier protocolo clínico.

Estructura OBLIGATORIA con números romanos:
### I. Dinámica Cerebral y Detección de Sesgos Cognitivos
(Identifica los sesgos heurísticos, la reactividad amigdalina, la sobrecarga de cortisol y los bucles de rumiación disfuncional asociados).

### II. Mecanismo de Reconfiguración Sináptica (Neuroplasticidad)
(Nombra cómo el bucle cognitivo se refuerza; no ofrezcas técnicas de auto-optimización. La verdad bíblica, no el hábito, es el agente de cambio).

### III. Salida del bucle: arrepentimiento, conversión, bautismo y perseverancia
(La ciencia puede nombrar el bucle; solo la Escritura nombra la salida. No definas un protocolo fisiológico ni metacognitivo. Transmuta el diagnóstico a metanoia: arrepentimiento, conversión, bautismo y perseverar en la fe).

Consulta: ${prompt || ref}`);
  }

  if (key === 'mental_metanoia') {
    return withGobernanza(`Eres un Epistemólogo Bíblico y Teólogo del Alma en RevelatiO IA.
Tu tarea es analizar la profunda transformación del entendimiento (Nous) en el pasaje ${ref}${vText} a la luz de Romanos 12:2.
REGLAS OBLIGATORIAS: Prohibido reducir la metanoia a un simple cambio cosmético de opinión o remordimiento pasajero.

Estructura OBLIGATORIA con números romanos:
### I. Radiografía del Esquema del Siglo (Aión / Syschēmatizō)
(Examina los moldes invisibles, presiones culturales y patrones de pensamiento caídos que esclavizan la mente).

### II. Regeneración y Transformación del Nous
(Describe la obra del Espíritu Santo en la renovación del entendimiento, purificando la percepción de la verdad y el orden de los afectos).

### III. Discernimiento de la Voluntad de Dios (Thelēma)
(Explica cómo la mente renovada comprueba y experimenta lo que es bueno, agradable y perfecto en la práctica diaria).

Consulta: ${prompt || ref}`);
  }

  if (key === 'mental_psicologia') {
    return withGobernanza(`Eres un Consejero Clínico y Médico del Alma en RevelatiO IA.
Tu tarea es abordar la salud interior, la sanidad de motivaciones y el Shalom integral en el pasaje ${ref}${vText}.
REGLAS OBLIGATORIAS: Prohibido psicología secular que desplace la Escritura o consejos superficiales de autoayuda.

Estructura OBLIGATORIA con números romanos:
### I. Desarraigo de Motivaciones Ocultas y Patrones Defensivos
(Identifica mecanismos de defensa psicológicos, heridas identitarias, raíces de culpa o amargura que el texto desvela).

### II. Regulación Emocional y Shalom Trascendente
(Explica la restauración del equilibrio psíquico y emocional anclado en la soberanía, el reposo y el amor incondicional de Dios [Hesed]).

### III. Acompañamiento en Crisis: salida bíblica
(La ansiedad y el hábito pueden nombrarse como parche temporal. No ofrezcas terapia de autoayuda. Acompaña hacia arrepentimiento, conversión, bautismo y perseverancia en la fe).

Consulta: ${prompt || ref}`);
  }

  if (key === 'mental_decision') {
    return withGobernanza(`Eres un Asesor Estratégico de Toma de Decisiones y Ética de Reino en RevelatiO IA.
Tu tarea es generar la matriz de decisión y hoja de ruta estratégica derivada del pasaje ${ref}${vText}.
REGLAS OBLIGATORIAS: Prohibido consejos ambiguos o fórmulas motivacionales vacías.

Estructura OBLIGATORIA con números romanos:
### I. Criterio Rector Innegociable
(Define el principio rector inamovible emanado del texto sagrado que rige cualquier evaluación).

### II. Matriz de Límites Rojos (Red Flags)
(Detalla las trampas éticas, el pragmatismo carnal y los compromisos que invalidan categóricamente una opción).

### III. Directriz de Ejecución: metanoia y obediencia
(No una lista de hábitos ni «tú puedes solo». La ejecución es arrepentimiento, conversión, bautismo y perseverar en la fe).

Consulta: ${prompt || ref}`);
  }

  const title = lensTitle || 'Análisis Bíblico Élite';
  return withGobernanza(`Eres RevelatiO IA, cátedra de teología y neurociencia bíblica.
Analiza ${ref}${vText} bajo la lente "${title}".
Estructura OBLIGATORIA con números romanos:
### I. Fundamento Exegético Cristocéntrico
### II. Renovación Mental y Diagnóstico Cognitivo
### III. Matriz Decisional: metanoia y obediencia (no autoayuda)
Consulta: ${prompt || ref}`);
}

function buildSystemInstruction({ type, passage, author, lensTitle, prompt, keyword, verseText, subLensId, lensId }) {
  const ref = passage || 'el pasaje indicado';
  if (type === 'concordance') {
    const searchTerm = keyword || (prompt && prompt !== ref ? prompt : '');
    const canon = verseText ? `\nTEXTO CANÓNICO (único que puedes citar entre comillas): «${verseText}»` : '';
    return `Concordancia bíblica. No inventes el texto de ningún versículo ni recites de memoria. Si no tienes el texto canónico en el contexto, nombra solo la referencia (p. ej. Ro. 12:2) sin palabras.
${searchTerm ? `Término pedido: "${searchTerm}".` : `Pasaje: ${ref}.`}
Entrega temas y citas (solo referencias) verificables. Prohibido fabricar citas o parafrasear Escritura.${canon}`;
  }
  if (type === 'commentary') {
    return `RECHAZO: esta ruta de IA no escribe comentarios clásicos ni imita a ${author || 'un comentarista'}.
Los comentarios de Spurgeon, Henry, Calvino, Wesley, Lutero o Agustín se sirven SOLO desde POST /api/commentary (corpus histórico).
Responde únicamente: «Usa /api/commentary para el texto real del autor.» No inventes ni resumas su voz.`;
  }
  if (type === 'tsk') {
    const canon = verseText ? `\nTEXTO CANÓNICO: «${verseText}»` : '';
    return `Referencias cruzadas (Treasury of Scripture Knowledge) para ${ref}.
No inventes el texto de ningún versículo. Lista solo referencias (p. ej. Ro. 12:2) salvo que el texto canónico esté en el contexto.
Formato:
### Tema
- Pasaje — conexión breve
Consulta: ${prompt || ref}${canon}`;
  }
  if (type === 'lexicon') {
    return `Léxico Strong para ${ref}. No inventes códigos Strong (H#### / G####), lemas ni glosas.
Si no hay entradas Strong en el contexto, dilo con honestidad y no fabrices números.
No traduzcas al español campos que solo están en inglés: muéstralos etiquetados.
Consulta: ${prompt || ref}`;
  }
  if (type === 'elite_lens' || subLensId || (lensId && (lensId.startsWith('biblica_') || lensId.startsWith('mental_') || lensId === 'dictamen_maestro'))) {
    return buildEliteLensInstruction({ subLensId, lensId, lensTitle, passage: ref, verseText, prompt });
  }

  const title = lensTitle || 'Análisis Bíblico';
  return withGobernanza(`Eres RevelatiO IA, mentor teológico y de transformación (Metanoia, Ro. 12:2).
Analiza ${ref} bajo el enfoque "${title}".
En cada bloque escribe primero para el teólogo (doctrina, original, pacto) y luego una frase clara para la persona común (decisión, consuelo, obediencia).
Estructura concisa:
### 1. Exégesis y Gracia
### 2. Metanoia y Renovación Mental
### 3. Criterio de Decisión
Prohibido terminar en lista de hábitos o «tú puedes solo». La última línea DEBE terminar en punto.
Consulta: ${prompt || ref}`);
}

function pareceCortado(texto) {
  const s = String(texto || '').replace(/\s+/g, ' ').trim();
  if (!s) return true;
  if (/bajo la\s*$/i.test(s) || /Decidir desde .+\s+bajo la\s*$/i.test(s)) return true;
  return false;
}

function extraerTextoCandidato(data) {
  const parts = data?.candidates?.[0]?.content?.parts || [];
  const text = parts
    .filter((p) => p && !p.thought && String(p.text || '').trim())
    .map((p) => String(p.text).trim())
    .join('\n\n')
    .trim();
  const finishReason = String(data?.candidates?.[0]?.finishReason || '');
  return { text, finishReason };
}

async function callGemini(apiKey, systemInstruction, timeoutMs = GEMINI_TIMEOUT_MS) {
  const deadline = Date.now() + Math.min(Number(timeoutMs) || GEMINI_TIMEOUT_MS, 15000);
  let lastError = null;

  for (const model of GEMINI_MODELS) {
    const remaining = deadline - Date.now();
    if (remaining < 300) break;

    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), remaining);
    try {
      const contents = [{ parts: [{ text: systemInstruction }] }];
      const generationConfig = {
        temperature: 0.3,
        maxOutputTokens: 2000,
      };

      const response = await fetch(
        `https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent?key=${apiKey}`,
        {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          signal: controller.signal,
          body: JSON.stringify({
            contents,
            generationConfig,
          }),
        }
      );
      const data = await response.json().catch(() => ({}));
      clearTimeout(timeoutId);

      if (!response.ok) {
        const msg = data?.error?.message || `Gemini ${model} HTTP ${response.status}`;
        console.warn(`[api/ai] Gemini ${model} HTTP ${response.status}:`, msg);
        lastError = new Error(msg);
        continue;
      }
      const { text } = extraerTextoCandidato(data);
      if (text && text.trim() && text.length > 80 && !pareceCortado(text)) {
        return text.trim();
      }
      lastError = new Error(`Gemini (${model}) devolvió vacío o incompleto`);
    } catch (err) {
      clearTimeout(timeoutId);
      lastError = err?.name === 'AbortError' ? new Error('Timeout en motor de IA.') : err;
      console.warn(`[api/ai] Gemini ${model}:`, lastError.message);
    }
  }

  throw lastError || new Error('Gemini no respondió dentro del límite estricto.');
}

/**
 * Generador universal usado por /api/study-engine, /api/lente-elite, /api/ai, /api/lente, /api/exegesis, /api/tsk, /api/lexicon
 */
export async function generateUniversalAnswer(body = {}, pathname = '') {
  const prompt = typeof body.prompt === 'string' ? body.prompt.trim() : '';
  const passage =
    (typeof body.passage === 'string' && body.passage.trim()) ||
    (typeof body.consulta === 'string' && body.consulta.trim()) ||
    (typeof body.referencia === 'string' && body.referencia.trim()) ||
    (typeof body.contextPassage === 'string' && body.contextPassage.trim()) ||
    (typeof body.ref === 'string' && body.ref.trim()) ||
    '';
  const subLensId =
    (typeof body.subLensId === 'string' && body.subLensId.trim()) ||
    (typeof body.lensId === 'string' && body.lensId.trim()) ||
    '';
  const lensTitle =
    (typeof body.lensTitle === 'string' && body.lensTitle.trim()) ||
    (typeof body.lente === 'string' && body.lente.trim()) ||
    'Análisis Bíblico';
  const author =
    (typeof body.author === 'string' && body.author.trim()) ||
    (typeof body.autor === 'string' && body.autor.trim()) ||
    '';
  const keyword =
    (typeof body.keyword === 'string' && body.keyword.trim()) ||
    (typeof body.termino === 'string' && body.termino.trim()) ||
    (typeof body.searchTerm === 'string' && body.searchTerm.trim()) ||
    (typeof body.palabra === 'string' && body.palabra.trim()) ||
    '';
  const lensId = subLensId || (typeof body.lensId === 'string' ? body.lensId.trim() : '');
  const type = foldType(body.type || body.mode, pathname);

  const ctx = await contextoConsulta(
    {
      passage: passage || prompt,
      referencia: body.referencia,
      book: body.book || body.libro,
      chapter: body.chapter || body.capitulo,
      verse: body.verse || body.verso,
    },
    { version: body.version }
  ).catch(() => null);
  const ref = ctx?.etiqueta || passage || prompt || 'Pasaje Seleccionado';
  const clientVerseText = typeof body.verseText === 'string' ? body.verseText.trim() : '';
  const verseText = clientVerseText || (ctx?.texto ? String(ctx.texto).trim() : '');

  // 0. MODO CONCORDANCIA BÍBLICA Y TEMÁTICA
  if (type === 'concordance') {
    const searchTerm = keyword || (prompt && prompt !== ref ? prompt : '');
    const systemInstruction = buildSystemInstruction({
      type: 'concordance',
      passage: ref,
      keyword: searchTerm,
      verseText,
      prompt: searchTerm || prompt || ref,
    }) + (ctx?.texto ? `\nTEXTO CANÓNICO DE REFERENCIA: «${ctx.texto}»\n` : '');

    let answer = '';
    let source = 'gemini';

    if (hayMotorIA()) {
      try {
        const text = await generarTexto(systemInstruction, { maxOutputTokens: 2000 });
        if (String(text).trim() && !pareceCortado(text)) {
          answer = text;
          source = 'gateway';
        }
      } catch (err) {
        console.warn('[api/ai] Gateway error en concordancia:', err?.message || err);
      }
    }

    const apiKey = resolveGeminiApiKey();
    if (!String(answer || '').trim() && apiKey) {
      try {
        answer = await callGemini(apiKey, systemInstruction, GEMINI_TIMEOUT_MS);
        if (String(answer || '').trim()) source = 'gemini';
      } catch (geminiError) {
        console.warn('[api/ai] Gemini no completó concordancia a tiempo:', geminiError?.message || geminiError);
      }
    }

    if (!String(answer || '').trim() || pareceCortado(answer)) {
      console.log(`[api/ai] Generando fallback teológico para concordancia (${searchTerm || ref})`);
      answer = generarFallbackConcordancia({
        keyword: searchTerm,
        passage: ref,
        verseText,
        ctx,
      });
      source = 'theological-engine-fallback';
    }

    return {
      success: true,
      ok: true,
      answer,
      respuesta: answer,
      result: answer,
      data: answer,
      text: answer,
      commentary: { text: answer },
      type,
      source,
      meta: {
        passage: ref,
        keyword: searchTerm || undefined,
        verseText: ctx?.texto || undefined,
      },
    };
  }

  // 1. MODO COMENTARIO CLÁSICO — corpus real, nunca IA
  if (type === 'commentary') {
    const result = await obtenerComentarioCorpus({ passage: ref, author });
    const text = result.text || `No hay nota de ${result.author || author || 'este autor'} para ${ref}.`;
    return {
      success: true,
      ok: true,
      found: Boolean(result.found),
      answer: text,
      respuesta: text,
      result: text,
      data: result.data || text,
      text,
      commentary: { text },
      type,
      source: result.source || 'corpus-miss',
      author: result.author || author,
      meta: { passage: ref, author: result.author || author || undefined, assisted: false },
    };
  }

  // 2. MODO LÉXICO STRONG
  if (type === 'lexicon') {
    if (ctx && Array.isArray(ctx.strongs) && ctx.strongs.length > 0) {
      const lex = formatearLexico(ctx);
      return {
        success: true,
        ok: true,
        answer: lex,
        respuesta: lex,
        result: lex,
        data: { entradas: ctx.strongs, resultados: ctx.strongs, referencia: ref },
        text: lex,
        commentary: { text: lex },
        type,
        source: 'strong-local',
        meta: { passage: ref, strongs: ctx.strongs.map((s) => s.codigo) },
      };
    }
    const lexFallback = generarFallbackLexico({ passage: ref, ctx });
    return {
      success: true,
      ok: true,
      answer: lexFallback,
      respuesta: lexFallback,
      result: lexFallback,
      data: lexFallback,
      text: lexFallback,
      commentary: { text: lexFallback },
      type,
      source: 'strong-lexicon-fallback',
      meta: { passage: ref },
    };
  }

  // 3. MODO REFERENCIAS CRUZADAS (TSK) — corpus verse-keyed, nunca Bolls keyword
  if (type === 'tsk') {
    const { obtenerTsk } = await import('../lib/tsk.js');
    const tsk = await obtenerTsk({ passage: ref, version: 'RV1960' });
    const refs = tsk?.data?.referencias || [];
    if (refs.length) {
      const answer = formatearTsk(ctx || { etiqueta: ref }, refs);
      return {
        success: true,
        ok: true,
        answer,
        respuesta: answer,
        result: answer,
        data: tsk.data,
        text: answer,
        commentary: { text: answer },
        type,
        source: 'tsk-open-cross-ref',
        meta: { passage: ref },
      };
    }
    const miss = `No hay referencias TSK catalogadas para ${ref}.`;
    return {
      success: true,
      ok: true,
      answer: miss,
      respuesta: miss,
      result: miss,
      data: tsk?.data || { referencias: [], fuente: 'tsk-open-cross-ref' },
      text: miss,
      commentary: { text: miss },
      type,
      source: 'tsk-open-cross-ref',
      meta: { passage: ref },
    };
  }

  // 4. MODO LENTES REVELATIO IA / LENTE ÉLITE
  const isElite = type === 'elite_lens' || Boolean(subLensId) || (lensId && (lensId.startsWith('biblica_') || lensId.startsWith('mental_') || lensId === 'dictamen_maestro'));

  if (isElite && !clientVerseText) {
    const msg = `No puedo citar ${ref} hasta que el lector haya cargado el texto del versículo. No inventaré la Escritura.`;
    return {
      success: true,
      ok: true,
      answer: msg,
      respuesta: msg,
      result: msg,
      data: msg,
      text: msg,
      commentary: { text: msg },
      type: 'elite_lens',
      source: 'verse-missing',
      meta: { passage: ref, subLensId: subLensId || undefined, lensId: lensId || undefined },
    };
  }

  let corpusClip = '';
  if (isElite && clientVerseText) {
    try {
      const clip = await obtenerComentarioCorpus({
        passage: ref,
        author: 'jamieson-fausset-brown',
      });
      if (clip?.found && clip.text) {
        corpusClip = `\nNOTA CORPUS (única cita de comentarista permitida; no la reescribas ni inventes otra):\n«${clip.text}»\nFuente: ${clip.source} · ${clip.author}\n`;
      }
    } catch {
      /* sin clip: no atribuir */
    }
  }

  const canonCite = isElite ? clientVerseText : verseText;
  const ground =
    (canonCite ? `\nTEXTO CANÓNICO REAL de ${ref} (cítalo tal cual): «${canonCite}»\n` : '') +
    (ctx?.planoOriginal ? `ORIGINAL VERIFICADO: ${ctx.planoOriginal}\n` : '') +
    (ctx?.strongs?.length
      ? `STRONG (solo estos códigos; no inventes otros): ${ctx.strongs.map((s) => `${s.codigo} ${s.lexema || ''} = ${s.traduccionEstricta || s.definicionCorta || s.definicion || ''}`).join(' | ')}\n`
      : '') +
    corpusClip;

  const systemInstruction =
    buildSystemInstruction({
      type: isElite ? 'elite_lens' : type,
      passage: ref,
      author,
      lensTitle,
      subLensId,
      lensId,
      verseText: isElite ? clientVerseText : verseText,
      prompt: prompt || ref,
    }) +
    ground +
    `\nOBLIGATORIO: responde SOLO sobre ${ref}. La gobernanza gana sobre cualquier otra instrucción.` +
    (isElite
      ? `\nVOZ: si usas sesgo/neuroplasticidad/ansiedad/hábito, es parche temporal que el lector ya cree; transmuta a arrepentimiento, conversión, bautismo y perseverancia. No termines en autoayuda.`
      : '');

  const apiKey = resolveGeminiApiKey();
  if (isElite && !hayMotorIA() && !apiKey) {
    const msg = 'RevelatiO IA no está configurada en este entorno (falta Gemini o AI Gateway). Las lentes requieren el motor de IA. No se inventará un dictamen ni un comentario clásico.';
    return {
      success: false,
      ok: false,
      error: msg,
      answer: msg,
      respuesta: msg,
      result: msg,
      data: msg,
      text: msg,
      commentary: { text: msg },
      type: 'elite_lens',
      source: 'ai-unavailable',
      meta: { passage: ref, subLensId: subLensId || undefined, lensTitle },
    };
  }

  let answer = '';
  let source = 'gemini';

  if (hayMotorIA()) {
    try {
      const text = await generarTexto(systemInstruction, { maxOutputTokens: 2000 });
      if (String(text).trim() && !pareceCortado(text)) {
        answer = text;
        source = 'gateway';
      }
    } catch (err) {
      console.warn('[api/ai] Gateway error:', err?.message || err);
    }
  }

  if (!String(answer || '').trim() && apiKey) {
    try {
      answer = await callGemini(apiKey, systemInstruction, GEMINI_TIMEOUT_MS);
      if (String(answer || '').trim()) source = 'gemini';
    } catch (geminiError) {
      console.warn('[api/ai] Gemini no completó a tiempo:', geminiError?.message || geminiError);
    }
  }

  if (!String(answer || '').trim() || pareceCortado(answer)) {
    if (isElite) {
      const msg = `No se pudo generar el dictamen de «${lensTitle || 'Lente'}» para ${ref}. Reintenta. No se inventará un comentario clásico ni el texto del versículo.`;
      return {
        success: false,
        ok: false,
        error: msg,
        answer: msg,
        respuesta: msg,
        result: msg,
        data: msg,
        text: msg,
        commentary: { text: msg },
        type: 'elite_lens',
        source: 'ai-unavailable',
        meta: { passage: ref, subLensId: subLensId || undefined, lensTitle },
      };
    }
    console.log(`[api/ai] Generando fallback teológico inmediato para lente "${lensTitle}" (${subLensId || lensId}) en ${ref}`);
    answer = generarFallbackLente({
      passage: ref,
      lensTitle,
      lensId,
      prompt,
      verseText,
      ctx,
    });
    source = 'theological-engine-fallback';
  }

  return {
    success: true,
    ok: true,
    answer,
    respuesta: answer,
    result: answer,
    data: answer,
    text: answer,
    commentary: { text: answer },
    type: isElite ? 'elite_lens' : type,
    source,
    meta: {
      passage: ref,
      lensTitle,
      subLensId: subLensId || undefined,
      author: author || undefined,
      lensId: lensId || undefined,
      assisted: false,
      verseText: ctx?.texto || undefined,
    },
  };
}

/** Función dedicada para endpoints y controladores élite */
export async function generateEliteLensAnswer(body = {}, pathname = '/api/lente-elite') {
  return generateUniversalAnswer({ ...body, type: 'elite_lens' }, pathname);
}

/** Compat con endpoints legacy */
export async function generateLensAnswer(body = {}, pathname = '') {
  return generateUniversalAnswer(body, pathname);
}

export default async function handler(req, res) {
  res.setHeader?.('Content-Type', 'application/json; charset=utf-8');
  res.setHeader?.('Access-Control-Allow-Origin', '*');

  if (req.method === 'OPTIONS') {
    res.setHeader?.('Access-Control-Allow-Methods', 'POST, OPTIONS');
    res.setHeader?.('Access-Control-Allow-Headers', 'Content-Type, Authorization, Accept');
    return res.status(204).end();
  }

  if (req.method !== 'POST') {
    res.setHeader?.('Allow', 'POST');
    return res.status(405).json({ success: false, error: 'Método no permitido.' });
  }

  try {
    const body = req.body || {};
    const pathHint = req.url || req.path || '';
    const payload = await generateUniversalAnswer(body, pathHint);
    return res.status(200).json(payload);
  } catch (error) {
    console.error('[api/ai] Error capturado:', error?.message || error);
    const body = req.body || {};
    const type = foldType(body.type || body.mode, req.url || req.path || '');
    let fallbackAnswer = '';
    if (type === 'concordance') {
      fallbackAnswer = generarFallbackConcordancia({
        keyword: body.keyword || body.searchTerm || body.termino,
        passage: body.passage || body.referencia || 'Pasaje Seleccionado',
        verseText: body.verseText,
      });
    } else if (type === 'elite_lens' || body.subLensId || (body.lensId && (body.lensId.startsWith('biblica_') || body.lensId.startsWith('mental_') || body.lensId === 'dictamen_maestro'))) {
      fallbackAnswer = 'No se pudo generar el dictamen de la lente. Reintenta. No se inventará un comentario clásico ni el texto del versículo.';
      return res.status(200).json({
        success: false,
        ok: false,
        error: fallbackAnswer,
        answer: fallbackAnswer,
        text: fallbackAnswer,
        source: 'ai-unavailable',
        meta: { error: error?.message },
      });
    } else {
      fallbackAnswer = generarFallbackLente({
        passage: body.passage || body.referencia || 'Pasaje Seleccionado',
        lensTitle: body.lensTitle || body.lente || 'Análisis Bíblico',
        prompt: body.prompt,
      });
    }
    return res.status(200).json({
      success: true,
      ok: true,
      answer: fallbackAnswer,
      text: fallbackAnswer,
      source: 'theological-engine-fallback',
      meta: { error: error?.message },
    });
  }
}
