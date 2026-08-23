/**
 * Éfata RevelatiO — study-panel.js
 * Cajón lateral: Comentarios | Ref. Cruzadas (TSK) | Léxico Strong | Lentes de Estudio.
 */
(function (global) {
  "use strict";

  const RV = (global.RV = global.RV || {});
  const LS_STUDY = "revelatio_study_cache";
  const LS_STRONG = "revelatio_strong_cache";
  const MIN_FULL_COMMENT = 120;

  const COMMENTATORS = [
    {
      id: "matthew-henry",
      label: "Matthew Henry",
      subtitle: "Comentario Exegético-Devocional Completo",
    },
    {
      id: "charles-spurgeon",
      label: "Charles Spurgeon",
      subtitle: "El Tesoro de David / Sermones Expositivos",
    },
    {
      id: "jamieson-fausset-brown",
      label: "Jamieson-Fausset-Brown",
      subtitle: "Comentario Crítico y Explicativo",
    },
  ];

  /** Lentes de transformación & decisión (disciplinas aplicadas al discernimiento). */
  const REVELATIO_LENSES = [
    {
      id: "cristocentro",
      icon: "✝️",
      title: "Lente Cristocéntrica & Gracia",
      discipline: "Cristología · Soteriología · Apologética",
      studyArea:
        "¿Qué estudia? La suficiencia y centralidad de Cristo frente a cualquier sistema de méritos humanos.",
      decisionValue:
        "Criterio de Decisión: Purifica las intenciones eliminando decisiones basadas en auto-justificación, culpa o soberbia.",
      promptSeed:
        "Analiza este versículo desde la Cristología y la Gracia consumada, evaluando qué motivaciones purifica para la toma de decisiones:",
    },
    {
      id: "metanoia",
      icon: "🧠",
      title: "Lente de Metanoia & Neuroplasticidad",
      discipline: "Psicología Cognitiva · Neurociencia Bíblica · Epistemología",
      studyArea:
        "¿Qué estudia? La sustitución de sesgos limitantes por patrones de verdad que reconfiguran el pensamiento (Ro. 12:2).",
      decisionValue:
        "Criterio de Decisión: Desactiva el pensamiento reactivo y clarifica el discernimiento objetivo antes de actuar.",
      promptSeed:
        "Examina qué sesgos cognitivos o patrones mentales desarma este pasaje y cómo reconfigura el entendimiento para decidir con sabiduría:",
    },
    {
      id: "paz_crisis",
      icon: "🕊️",
      title: "Lente de Paz & Alivio en Crisis",
      discipline: "Cuidado Pastoral · Manejo de Ansiedad · Teodicea",
      studyArea:
        "¿Qué estudia? El reposo en la soberanía de Dios para mitigar la sobrecarga emocional y el estrés fisiológico.",
      decisionValue:
        "Criterio de Decisión: Bloquea resoluciones precipitadas impulsadas por el temor o la desesperación circunstancial.",
      promptSeed:
        "Ofrece un análisis de regulación emocional y descanso en la soberanía divina para este pasaje, guiando a tomar decisiones en serenidad:",
    },
    {
      id: "habitos_vida",
      icon: "🌱",
      title: "Lente de Hábitos & Vida Práctica",
      discipline: "Ética Aplicada · Praxis Moral · Liderazgo Conductual",
      studyArea:
        "¿Qué estudia? La materialización de la doctrina en hábitos concretos de integridad, trabajo y relaciones.",
      decisionValue:
        "Criterio de Decisión: Traza un plan de acción no negociable con estándares éticos claros y ejecutables.",
      promptSeed:
        "Detalla las aplicaciones éticas directas y 3 pasos de acción concretos derivados de este texto para resolver situaciones prácticas:",
    },
    {
      id: "reino_canonica",
      icon: "📜",
      title: "Lente Canónica & Reino",
      discipline: "Hermenéutica Bíblica · Tipología · Teología del Pacto",
      studyArea:
        "¿Qué estudia? La arquitectura unificada del canon y el despliegue del Reino de Dios en la historia.",
      decisionValue:
        "Criterio de Decisión: Otorga perspectiva de largo plazo, alineando resoluciones inmediatas con un legado eterno.",
      promptSeed:
        "Desglosa la perspectiva canónica y de Reino de este versículo, mostrando su valor para definir estrategias de largo alcance:",
    },
  ];

  /** TSK agrupado por frase clave (Treasury of Scripture Knowledge). */
  const TSK_SEED = {
    "juan 14:8": [
      {
        phrase: "Dícele Felipe…",
        refs: ["Juan 1:43-46", "Juan 6:5-7", "Juan 12:21-22"],
      },
      {
        phrase: "Señor, muéstranos al Padre…",
        refs: ["Éxodo 33:18-23", "Salmo 17:15", "Juan 1:18"],
      },
      {
        phrase: "…y nos basta",
        refs: ["Salmo 16:11", "Salmo 63:1-5", "2 Corintios 12:9"],
      },
    ],
    "juan 14:6": [
      {
        phrase: "Yo soy el camino…",
        refs: ["Juan 10:9", "Hebreos 10:19-20", "Isaías 35:8"],
      },
      {
        phrase: "…la verdad…",
        refs: ["Juan 1:14", "Juan 8:32", "Juan 18:37"],
      },
      {
        phrase: "…y la vida",
        refs: ["Juan 1:4", "Juan 11:25", "Colosenses 3:4"],
      },
      {
        phrase: "Nadie viene al Padre sino por mí",
        refs: ["Hechos 4:12", "1 Timoteo 2:5", "Hebreos 7:25"],
      },
    ],
    "juan 3:16": [
      {
        phrase: "Porque de tal manera amó Dios…",
        refs: ["1 Juan 4:9-10", "Romanos 5:8", "Efesios 2:4-5"],
      },
      {
        phrase: "…que ha dado a su Hijo unigénito…",
        refs: ["Génesis 22:12", "Romanos 8:32", "Juan 1:14"],
      },
      {
        phrase: "…para que todo aquel que en él cree…",
        refs: ["Juan 3:36", "Hechos 16:31", "Romanos 10:9-11"],
      },
    ],
    "romanos 8:1": [
      {
        phrase: "Ahora, pues, ninguna condenación…",
        refs: ["Romanos 5:1", "Juan 5:24", "Romanos 8:33-34"],
      },
      {
        phrase: "…los que están en Cristo Jesús",
        refs: ["2 Corintios 5:17", "Gálatas 2:20", "Efesios 1:3-7"],
      },
    ],
    "romanos 12:1": [
      {
        phrase: "Os ruego… por las misericordias de Dios…",
        refs: ["Romanos 11:30-36", "2 Corintios 1:3", "Efesios 2:4-5"],
      },
      {
        phrase: "…que presentéis vuestros cuerpos en sacrificio vivo…",
        refs: ["1 Corintios 6:19-20", "Filipenses 1:20", "1 Pedro 2:5"],
      },
      {
        phrase: "…santo, agradable a Dios…",
        refs: ["Éxodo 29:18", "Romanos 6:13", "Hebreos 13:15-16"],
      },
      {
        phrase: "…vuestro culto racional",
        refs: ["Juan 4:23-24", "1 Pedro 2:9", "Romanos 1:9"],
      },
    ],
    "romanos 12:2": [
      {
        phrase: "No os conforméis a este siglo…",
        refs: ["Éxodo 23:2", "Juan 15:19", "1 Juan 2:15-17", "2 Corintios 6:14-18"],
      },
      {
        phrase: "…sino transformaos…",
        refs: ["2 Corintios 3:18", "2 Corintios 5:17", "Efesios 4:22-24", "Colosenses 3:10"],
      },
      {
        phrase: "…por medio de la renovación de vuestro entendimiento…",
        refs: ["Salmo 51:10", "Efesios 4:23", "Tito 3:5", "Colosenses 3:10"],
      },
      {
        phrase: "…para que comprobéis… la voluntad de Dios",
        refs: ["Efesios 5:10", "Efesios 5:17", "1 Tesalonicenses 5:21", "1 Juan 2:17"],
      },
    ],
  };

  /** Léxico seed para pasajes clave (sin depender del agente) */
  const STRONG_SEED = {
    "romanos 12:2": [
      {
        original: "συσχηματίζεσθε",
        translit: "syschēmatízesthe",
        strong: "G4964",
        morph: "V-PMM/P-2P",
        meaning: "Conformarse al esquema/molde externo; adoptar la forma del presente siglo.",
      },
      {
        original: "αἰῶνι",
        translit: "aiōni",
        strong: "G165",
        morph: "N-DSM",
        meaning: "Siglo, era, edad presente; el orden de este mundo.",
      },
      {
        original: "μεταμορφοῦσθε",
        translit: "metamorphoûsthe",
        strong: "G3339",
        morph: "V-PPM/P-2P",
        meaning: "Ser transformados (metamorfosis); cambio interior de forma esencial.",
      },
      {
        original: "ἀνακαινώσει",
        translit: "anakainṓsei",
        strong: "G342",
        morph: "N-DSF",
        meaning: "Renovación; hacer nuevo de nuevo (calidad nueva).",
      },
      {
        original: "νοός",
        translit: "noós",
        strong: "G3563",
        morph: "N-GSM",
        meaning: "Mente, entendimiento, facultad de percibir y juzgar.",
      },
      {
        original: "δοκιμάζειν",
        translit: "dokimázein",
        strong: "G1381",
        morph: "V-PAN",
        meaning: "Probar, examinar, comprobar como genuino.",
      },
      {
        original: "θέλημα",
        translit: "thélēma",
        strong: "G2307",
        morph: "N-ASN",
        meaning: "Voluntad, deseo, propósito de Dios.",
      },
    ],
    "romanos 12:1": [
      {
        original: "παραστῆσαι",
        translit: "parastēsai",
        strong: "G3936",
        morph: "V-AAN",
        meaning: "Presentar, poner al lado; ofrecer.",
      },
      {
        original: "σώματα",
        translit: "sṓmata",
        strong: "G4983",
        morph: "N-APN",
        meaning: "Cuerpos; la persona entera en su existencia corporal.",
      },
      {
        original: "θυσίαν",
        translit: "thysían",
        strong: "G2378",
        morph: "N-ASF",
        meaning: "Sacrificio, ofrenda.",
      },
      {
        original: "ζῶσαν",
        translit: "zōsan",
        strong: "G2198",
        morph: "V-PAP-ASF",
        meaning: "Viva; sacrificio viviente (no muerto).",
      },
      {
        original: "λογικὴν",
        translit: "logikḗn",
        strong: "G3050",
        morph: "A-ASF",
        meaning: "Racional, razonable; culto acorde a la razón renovada.",
      },
      {
        original: "λατρείαν",
        translit: "latreían",
        strong: "G2999",
        morph: "N-ASF",
        meaning: "Culto, servicio sagrado.",
      },
    ],
    "juan 14:12": [
      {
        original: "ἀμὴν",
        translit: "amēn",
        strong: "G281",
        morph: "Partícula",
        meaning: "Amén, verdaderamente, en verdad, así sea.",
      },
      {
        original: "λέγω",
        translit: "legō",
        strong: "G3004",
        morph: "V-PAI-1S",
        meaning: "Decir, hablar, proponer, relatar, ordenar.",
      },
      {
        original: "ὑμῖν",
        translit: "hymin",
        strong: "G5210",
        morph: "Pronombre",
        meaning: "A vosotros, para vosotros, por vosotros.",
      },
      {
        original: "ὁ",
        translit: "ho",
        strong: "G3588",
        morph: "Artículo",
        meaning: "El, la, lo (artículo determinado).",
      },
      {
        original: "καὶ",
        translit: "kai",
        strong: "G2532",
        morph: "Conjunción",
        meaning: "Y, también, aun, además.",
      },
    ],
  };

  /** Glosas Strong en español (núcleo + enriquecimiento desde /data/strong/lexico.json). */
  const STRONGS_GLOSSARY = {
    G281: { translit: "amēn", pron: "am-ane'", def: "Amén, verdaderamente, en verdad, así sea.", part: "Adverbio / Partícula" },
    G3004: { translit: "legō", pron: "leg'-o", def: "Decir, hablar, proponer, relatar, ordenar.", part: "Verbo" },
    G5210: { translit: "hymin", pron: "hoo-min'", def: "A vosotros, para vosotros, por vosotros.", part: "Pronombre personal" },
    G3588: { translit: "ho", pron: "ho", def: "El, la, lo (Artículo determinado determinativo).", part: "Artículo" },
    G2532: { translit: "kai", pron: "kahee", def: "Y, también, aun, además.", part: "Conjunción" },
    G4964: { translit: "syschēmatizō", pron: "soos-khay-mat-id'-zo", def: "Conformarse a un esquema o figura; amoldarse al molde externo.", part: "Verbo" },
    G165: { translit: "aiōn", pron: "ahee-ohn'", def: "Siglo, era, edad; el orden o curso de este mundo.", part: "Sustantivo" },
    G3339: { translit: "metamorphoō", pron: "met-am-or-fo'-o", def: "Transformar, transfigurar; cambio interior de forma esencial.", part: "Verbo" },
    G342: { translit: "anakainōsis", pron: "an-ak-ah'-ee-no-sis", def: "Renovación; hacer nuevo de nuevo (calidad nueva).", part: "Sustantivo" },
    G3563: { translit: "nous", pron: "nooce", def: "Mente, entendimiento, facultad de percibir y juzgar.", part: "Sustantivo" },
    G1381: { translit: "dokimazō", pron: "dok-im-ad'-zo", def: "Probar, examinar, comprobar como genuino.", part: "Verbo" },
    G2307: { translit: "thelēma", pron: "thel'-ay-mah", def: "Voluntad, deseo, propósito (de Dios).", part: "Sustantivo" },
    G3936: { translit: "paristēmi", pron: "par-is'-tay-mee", def: "Presentar, poner al lado; ofrecer.", part: "Verbo" },
    G4983: { translit: "sōma", pron: "so'-mah", def: "Cuerpo; la persona en su existencia corporal.", part: "Sustantivo" },
    G2378: { translit: "thysia", pron: "thoo-see'-ah", def: "Sacrificio, ofrenda.", part: "Sustantivo" },
    G2198: { translit: "zaō", pron: "dzah'-o", def: "Vivir; estar vivo; sacrificio viviente.", part: "Verbo" },
    G3050: { translit: "logikos", pron: "log-ik-os'", def: "Racional, razonable; culto acorde a la razón renovada.", part: "Adjetivo" },
    G2999: { translit: "latreia", pron: "lat-ri'-ah", def: "Culto, servicio sagrado.", part: "Sustantivo" },
  };

  let strongLexicoLoaded = false;

  function normalizeStrongCode(code) {
    const raw = String(code || "").trim().toUpperCase();
    const m = raw.match(/^([GH])0*(\d+)$/);
    return m ? `${m[1]}${m[2]}` : raw;
  }

  async function ensureStrongGlossary() {
    if (strongLexicoLoaded) return;
    strongLexicoLoaded = true;
    try {
      const res = await fetch("/data/strong/lexico.json", { cache: "force-cache" });
      if (!res.ok) return;
      const data = await res.json();
      Object.entries(data || {}).forEach(([code, raw]) => {
        const key = normalizeStrongCode(code);
        if (!key || !raw || typeof raw !== "object") return;
        const prev = STRONGS_GLOSSARY[key] || {};
        STRONGS_GLOSSARY[key] = {
          translit: prev.translit || raw.translit || raw.transliteracion || "",
          pron: prev.pron || raw.pron || raw.pronunciacion || "",
          def: prev.def || raw.definicion || raw.definition || raw.definicionCorta || "",
          part: prev.part || raw.part || raw.categoria || (key.startsWith("H") ? "Hebreo" : "Griego"),
          lemma: prev.lemma || raw.lemma || raw.lexema || "",
        };
      });
    } catch {
      /* glossario local basta */
    }
  }

  function resolveStrongGloss(token) {
    const code = normalizeStrongCode(token?.strong || token?.strongCode || "");
    const fromDict = STRONGS_GLOSSARY[code] || {};
    const fromSpanish = global.RV?.Strongs?.STRONGS_SPANISH?.[code];
    let def =
      fromSpanish?.def ||
      fromDict.def ||
      token?.definition ||
      token?.meaning ||
      token?.translation ||
      token?.glosa ||
      "";
    if (typeof global.translateGlossToSpanish === "function") {
      const looksEn = /\b(the|and|of|burden|oracle|vision|prophet|lord|god)\b/i.test(def);
      if (looksEn) def = global.translateGlossToSpanish(def);
    }
    const isGeneric =
      !def ||
      /traducci[oó]n estricta y ocurrencias|l[eé]xico pendiente|sin desglose|actúa el agente/i.test(def);

    return {
      strongCode: code || "—",
      greek:
        fromSpanish?.word ||
        token?.greek ||
        token?.original ||
        token?.originalWord ||
        fromDict.lemma ||
        "—",
      translit: fromSpanish?.translit || fromDict.translit || token?.translit || "",
      pron: fromSpanish?.pron || fromDict.pron || token?.pron || "",
      def: isGeneric
        ? fromSpanish?.def ||
          fromDict.def ||
          "Consulta el diccionario Strong: aún no hay glosa local para este código."
        : def,
      part:
        fromSpanish?.part ||
        fromDict.part ||
        token?.partOfSpeech ||
        token?.morph ||
        "Término exegético",
    };
  }

  function escapeHtml(s) {
    return String(s || "")
      .replace(/&/g, "&amp;")
      .replace(/</g, "&lt;")
      .replace(/>/g, "&gt;")
      .replace(/"/g, "&quot;");
  }

  function plainText(htmlOrText) {
    return String(htmlOrText || "")
      .replace(/<[^>]+>/g, " ")
      .replace(/\s+/g, " ")
      .trim();
  }

  function mdToHtml(md) {
    if (typeof RV.ai?.renderMarkdown === "function") {
      try {
        return RV.ai.renderMarkdown(md);
      } catch {
        /* fall through */
      }
    }
    let text = escapeHtml(String(md || "").trim());
    if (!text) return "";
    text = text.replace(/^### (.+)$/gm, "<h4>$1</h4>");
    text = text.replace(/^## (.+)$/gm, "<h3>$1</h3>");
    text = text.replace(/\*\*(.+?)\*\*/g, "<strong>$1</strong>");
    text = text.replace(/(^|[^*])\*([^*\n]+)\*(?!\*)/g, "$1<em>$2</em>");
    text = text.replace(/「([^」]+)」|«([^»]+)»|"([^"]+)"/g, (_m, a, b, c) => {
      const q = a || b || c;
      return `<cite class="rv-sp-bible-cite">«${q}»</cite>`;
    });
    text = text.replace(/\b((?:\d\s)?[A-Za-zÁÉÍÓÚáéíóúñÑ]+\.?\s+\d+(?::\d+(?:-\d+)?)?(?:\s*[-–]\s*\d+(?::\d+)?)?)/g, (m) => {
      if (m.length < 5) return m;
      return `<cite class="rv-sp-bible-cite">${m}</cite>`;
    });
    text = text.replace(/^\d+\.\s+(.+)$/gm, "<li>$1</li>");
    text = text.replace(/^[-*•]\s+(.+)$/gm, "<li>$1</li>");
    text = text.replace(/(?:<li>[\s\S]*?<\/li>\n?)+/g, (block) => `<ul>${block}</ul>`);
    text = text.replace(/\n{2,}/g, "</p><p>");
    text = text.replace(/\n/g, "<br>");
    return `<div class="rv-sp-comment-prose"><p>${text}</p></div>`;
  }

  function parsePassageParts(ref) {
    const m = String(ref || "")
      .trim()
      .match(/^(.+?)\s+(\d+)(?::(\d+))?/);
    if (!m) return { book: String(ref || "").trim() || "Pasaje", chapter: "", verse: "" };
    return { book: m[1].trim(), chapter: m[2] || "", verse: m[3] || "" };
  }

  /* —— Caché de estudio —— */
  function readStudyCache() {
    try {
      return JSON.parse(localStorage.getItem(LS_STUDY) || "{}") || {};
    } catch {
      return {};
    }
  }

  function writeStudyCache(map) {
    try {
      localStorage.setItem(LS_STUDY, JSON.stringify(map || {}));
    } catch (err) {
      console.warn("[study-panel] study cache:", err?.message || err);
    }
  }

  function cacheGet(kind, key) {
    const hit = readStudyCache()[`${kind}::${key}`];
    return hit?.data ?? null;
  }

  function cacheSet(kind, key, data) {
    const map = readStudyCache();
    map[`${kind}::${key}`] = { data, ts: Date.now() };
    writeStudyCache(map);
  }

  const MIN_SHOW_COMMENT = 40; // umbral mínimo para mostrar texto local/API sin agente

  function extractJsonArray(text) {
    const raw = String(text || "").trim();
    if (!raw) return null;
    const fence = raw.match(/```(?:json)?\s*([\s\S]*?)```/i);
    const candidate = fence ? fence[1].trim() : raw;
    const start = candidate.indexOf("[");
    const end = candidate.lastIndexOf("]");
    if (start < 0 || end <= start) return null;
    try {
      const parsed = JSON.parse(candidate.slice(start, end + 1));
      return Array.isArray(parsed) ? parsed : null;
    } catch {
      return null;
    }
  }

  async function callAgente(prompt, ref, mode) {
    const userPrompt = String(prompt || "").trim();
    if (!userPrompt) throw new Error("Prompt vacío");
    if (typeof RV.ai?.agenteTeologico === "function") {
      const result = await RV.ai.agenteTeologico({
        prompt: userPrompt,
        message: userPrompt,
        contextPassage: ref,
        mode: mode || "exegesis",
      });
      return String(result?.text || result?.data || "").trim();
    }
    const res = await fetch("/api/agente-teologico", {
      method: "POST",
      headers: { "Content-Type": "application/json", Accept: "application/json" },
      body: JSON.stringify({
        prompt: userPrompt,
        message: userPrompt,
        contextPassage: ref,
        mode: mode || "exegesis",
      }),
    });
    const json = await res.json().catch(() => null);
    if (!res.ok || json?.ok === false) {
      throw new Error(json?.error || json?.message || `El servidor respondió ${res.status}. Inténtalo de nuevo.`);
    }
    return String(json?.data || json?.text || "").trim();
  }

  function passageKey(ref) {
    return String(ref || "")
      .toLowerCase()
      .normalize("NFD")
      .replace(/[\u0300-\u036f]/g, "")
      .replace(/\s+/g, " ")
      .trim();
  }

  function seedStrong(ref) {
    return STRONG_SEED[passageKey(ref)] || [];
  }

  function tskGroupsHaveRefs(groups) {
    return Array.isArray(groups) && groups.some((g) => Array.isArray(g.refs) && g.refs.length > 0);
  }

  /* —— Comentarios —— */
  function commentatorLabel(id) {
    return COMMENTATORS.find((c) => c.id === id)?.label || global.RV_DATA?.AUTOR_LABEL?.[id] || id;
  }

  async function fetchApiComment(ref, autor) {
    try {
      const res = await fetch("/api/comentario", {
        method: "POST",
        headers: { "Content-Type": "application/json", Accept: "application/json" },
        body: JSON.stringify({ referencia: ref, autor, author: autor, ref }),
      });
      if (!res.ok) return null;
      const json = await res.json().catch(() => null);
      const data = json?.data || json;
      if (!data) return null;
      let cuerpo = String(data.cuerpo || data.texto || data.html || "").trim();
      if (!cuerpo && Array.isArray(data.entradas)) {
        cuerpo = data.entradas
          .map((e) => e.texto || e.cuerpo || "")
          .filter(Boolean)
          .join("\n\n");
      }
      if (!cuerpo) return null;
      return {
        titulo: data.titulo || commentatorLabel(autor),
        cuerpo,
        plain: plainText(cuerpo),
      };
    } catch {
      return null;
    }
  }

  async function loadLocalComment(ref, autor) {
    let cuerpo = "";
    let titulo = commentatorLabel(autor);
    try {
      if (global.revelatioLectura?.fetchComentario) {
        const data = await global.revelatioLectura.fetchComentario(ref, autor);
        cuerpo = data?.cuerpo || data?.texto || data?.html || "";
        if (data?.titulo) titulo = data.titulo;
        if (Array.isArray(data?.entradas) && data.entradas.length) {
          cuerpo =
            data.entradas
              .map((e) => e.texto || e.cuerpo || "")
              .filter(Boolean)
              .join("\n\n") || cuerpo;
        }
      }
      if (plainText(cuerpo).length < MIN_FULL_COMMENT && global.revelatioLectura?.comentarioInmediato) {
        const data = global.revelatioLectura.comentarioInmediato(ref, autor);
        const alt = data?.cuerpo || "";
        if (plainText(alt).length > plainText(cuerpo).length) {
          cuerpo = alt;
          if (data?.titulo) titulo = data.titulo;
        }
      }
    } catch {
      /* ignore */
    }
    return { titulo, cuerpo, plain: plainText(cuerpo) };
  }

  function commentToHtml(cuerpo) {
    if (/<[a-z][\s\S]*>/i.test(cuerpo)) {
      return String(cuerpo);
    }
    return mdToHtml(cuerpo);
  }

  /** Tipografía natural del panel de comentarios (dominio público). */
  function renderCommentaryShell(commentary) {
    const authorName = commentary?.authorName || commentary?.label || "Comentarista";
    let fullTextHtml = commentary?.fullTextHtml || commentary?.html || "";
    // Extraer prosa interna si viene envuelta en wrappers legacy
    fullTextHtml = String(fullTextHtml)
      .replace(/^<div class="rv-sp-comment-prose">/i, "")
      .replace(/<\/div>$/i, "");
    if (fullTextHtml && !/<(p|div|h[1-6]|ul|ol|blockquote)\b/i.test(fullTextHtml)) {
      fullTextHtml = fullTextHtml
        .split(/\n{2,}/)
        .map((p) => p.trim())
        .filter(Boolean)
        .map((p) => `<p class="leading-relaxed">${p}</p>`)
        .join("\n");
    }
    return `
<div class="space-y-4 font-serif text-[#0F172A] leading-relaxed text-sm sm:text-base selection:bg-[#C59B27]/20 text-justify">
  <div class="flex items-center justify-between pb-2 mb-3 border-b border-[#E8DFC8]">
    <span class="text-xs font-mono font-bold text-[#C59B27] uppercase tracking-wider">${escapeHtml(authorName)}</span>
    <span class="text-[10px] text-stone-400 font-mono">Dominio Público</span>
  </div>
  <div class="commentary-body text-stone-800 space-y-3">
    ${fullTextHtml}
  </div>
</div>`;
  }

  async function loadFullComment(ref, autor) {
    const cacheKey = `${autor}__${ref}`;
    const cached = cacheGet("comment", cacheKey);
    if (cached?.html && plainText(cached.html).length >= MIN_FULL_COMMENT) {
      return { label: cached.label || commentatorLabel(autor), html: cached.html, source: "cache" };
    }

    const local = await loadLocalComment(ref, autor);
    const api = await fetchApiComment(ref, autor);
    const best =
      (api?.plain?.length || 0) >= (local.plain?.length || 0) ? api || local : local;

    // Prioridad: contenido local/API aunque sea breve — no depender del agente
    if (best?.plain?.length >= MIN_SHOW_COMMENT) {
      const html = commentToHtml(best.cuerpo);
      cacheSet("comment", cacheKey, { label: best.titulo, html });
      // Enriquecer en background solo si es muy corto
      if (best.plain.length < 480) {
        callAgente(
          `Amplía el comentario exegético de ${commentatorLabel(autor)} sobre ${ref} en español, respetando su estilo histórico. No inventes citas falsas.`,
          ref,
          "exegesis"
        )
          .then((text) => {
            if (plainText(text).length > best.plain.length) {
              cacheSet("comment", cacheKey, {
                label: commentatorLabel(autor),
                html: mdToHtml(text),
              });
            }
          })
          .catch(() => {});
      }
      return { label: best.titulo, html, source: api ? "api" : "local" };
    }

    const label = commentatorLabel(autor);
    try {
      const prompt = `Entrega el comentario exegético completo y sin abreviar de ${label} sobre ${ref}, respetando su enfoque histórico original en párrafos profundos. No resumas: desarrolla el tratado con la densidad del autor. Si el comentario original está en inglés, tradúcelo fielmente al español.`;
      const text = await callAgente(prompt, ref, "exegesis");
      if (!text) throw new Error("Comentario vacío");
      const html = mdToHtml(text);
      cacheSet("comment", cacheKey, { label, html });
      return { label, html, source: "agent" };
    } catch (err) {
      if (best?.plain) {
        return {
          label: best.titulo || label,
          html: commentToHtml(best.cuerpo),
          source: "partial",
          note: err?.message,
        };
      }
      throw err;
    }
  }

  /* —— TSK —— */
  function normalizeTskGroups(raw, ref) {
    if (!raw) return [];
    if (Array.isArray(raw) && raw[0]?.phrase && Array.isArray(raw[0]?.refs)) return raw;
    if (Array.isArray(raw)) {
      // flat {ref, nota} → un grupo genérico
      return [
        {
          phrase: `Paralelos de ${ref}`,
          refs: raw.map((x) => x.ref || x.reference || x).filter(Boolean),
        },
      ];
    }
    return [];
  }

  function seedTsk(ref) {
    return TSK_SEED[passageKey(ref)] || [];
  }

  function enrichTskInBackground(ref) {
    const prompt = [
      `Entrega las referencias cruzadas estilo Treasury of Scripture Knowledge (TSK) para ${ref}.`,
      `JSON estricto: [ { "phrase": "frase clave del versículo…", "refs": ["Libro Cap:Ver", "..."] } ]`,
      "Agrupa por frases del versículo. Solo el array JSON.",
    ].join("\n");
    callAgente(prompt, ref, "exegesis")
      .then((text) => {
        const remote = normalizeTskGroups(extractJsonArray(text), ref);
        if (tskGroupsHaveRefs(remote)) cacheSet("tsk", ref, remote);
      })
      .catch(() => {});
  }

  async function loadTskGroups(ref) {
    const seeded = seedTsk(ref);
    if (tskGroupsHaveRefs(seeded)) {
      cacheSet("tsk", ref, seeded);
      enrichTskInBackground(ref);
      return { groups: seeded, source: "seed" };
    }

    const cached = cacheGet("tsk", ref);
    if (tskGroupsHaveRefs(cached)) return { groups: cached, source: "cache" };

    // API de referencias cruzadas (Bolls/IA) — sin exigir sesión
    try {
      const res = await fetch("/api/referencias", {
        method: "POST",
        headers: { "Content-Type": "application/json", Accept: "application/json" },
        body: JSON.stringify({ consulta: ref }),
      });
      if (res.ok) {
        const json = await res.json();
        const lista = json?.data?.referencias || json?.referencias || [];
        if (lista.length) {
          const groups = [
            {
              phrase: `Paralelos de ${ref}`,
              refs: lista.map((x) => x.ref || x.reference).filter(Boolean),
            },
          ];
          if (tskGroupsHaveRefs(groups)) {
            cacheSet("tsk", ref, groups);
            return { groups, source: "api" };
          }
        }
      }
    } catch {
      /* continue */
    }

    try {
      const prompt = [
        `Entrega las referencias cruzadas estilo Treasury of Scripture Knowledge (TSK) para ${ref}.`,
        `JSON estricto: [ { "phrase": "frase clave del versículo…", "refs": ["Libro Cap:Ver", "..."] } ]`,
        "Agrupa por frases del versículo. Solo el array JSON.",
      ].join("\n");
      const text = await callAgente(prompt, ref, "exegesis");
      const remote = normalizeTskGroups(extractJsonArray(text), ref);
      if (tskGroupsHaveRefs(remote)) {
        cacheSet("tsk", ref, remote);
        return { groups: remote, source: "agent" };
      }
    } catch {
      /* sin agente */
    }

    return { groups: [], source: "empty" };
  }

  function parseGoto(refStr) {
    const m = String(refStr || "")
      .trim()
      .match(/^((?:\d\s)?[A-Za-zÁÉÍÓÚáéíóúñÑüÜ.]+)\s+(\d+)(?::(\d+))?/);
    if (!m) return null;
    return { libro: m[1].replace(/\.$/, ""), cap: Number(m[2]), verso: m[3] ? Number(m[3]) : null };
  }

  function navigateToRef(refStr) {
    const dest = parseGoto(String(refStr).split("-")[0].trim());
    if (!dest) return;
    if (typeof RV.estudio?.goto === "function") {
      RV.estudio.goto(dest);
      return;
    }
    document.dispatchEvent(new CustomEvent("revelatio:goto", { detail: dest }));
  }

  function previewTextForRef(refStr) {
    const dest = parseGoto(String(refStr).split(/[-–]/)[0].trim());
    if (!dest) return "";
    const passage = global.__revelatioPassageData;
    const book = passage?.libro || passage?.book;
    if (book && String(book).toLowerCase() === String(dest.libro).toLowerCase()) {
      const n = dest.verso;
      const vv = passage?.versionesVersos?.rv1960 || passage?.versionesVersos?.rv1909 || [];
      const hit = (vv || []).find((v) => Number(v.n || v.verse) === n);
      if (hit?.texto) return String(hit.texto).slice(0, 220);
    }
    const el = document.querySelector(
      `#texto-biblico .rv-verse-surface[data-reference="${CSS.escape(`${dest.libro} ${dest.cap}:${dest.verso || ""}`)}"]`
    );
    if (el) return verseTextFor(el.dataset.reference).slice(0, 220);
    return "";
  }

  /* —— Strong —— */
  function strongCacheKey(ref) {
    return `strong_${String(ref || "")
      .trim()
      .replace(/\s+/g, "_")
      .replace(/:/g, "_")}`;
  }

  function readStrongCache() {
    try {
      return JSON.parse(localStorage.getItem(LS_STRONG) || "{}") || {};
    } catch {
      return {};
    }
  }

  function writeStrongCache(map) {
    try {
      localStorage.setItem(LS_STRONG, JSON.stringify(map || {}));
    } catch {
      /* ignore */
    }
  }

  function normalizeToken(raw) {
    if (!raw || typeof raw !== "object") return null;
    const strong = String(raw.strong || raw.codigo || "").trim().toUpperCase();
    const original = String(raw.original || raw.palabra || raw.lemma || "").trim();
    const translit = String(raw.translit || raw.transliteracion || "").trim();
    const morph = String(raw.morph || raw.morphology || raw.gramatica || "").trim();
    const meaning = String(raw.meaning || raw.glosa || raw.definicion || raw.traduccion || "").trim();
    if (!strong && !original) return null;
    return {
      original: original || "—",
      translit,
      strong: strong || "—",
      morph: morph || "Léxico bíblico",
      meaning: meaning || "Consultar léxico / contexto del pasaje",
    };
  }

  function dedupeTokens(list) {
    const seen = new Set();
    const out = [];
    (list || []).forEach((t) => {
      const n = normalizeToken(t);
      if (!n) return;
      const k = `${n.strong}|${n.original}`.toLowerCase();
      if (seen.has(k)) return;
      seen.add(k);
      out.push(n);
    });
    return out;
  }

  function loadStrongsLocal(ref) {
    const n = Number(String(ref || "").split(":").pop()) || 0;
    const codes = [];
    document
      .querySelectorAll(`#texto-biblico .rv-verse-surface[data-versiculo="${n}"] [data-strong]`)
      .forEach((el) => {
        codes.push({
          strong: el.getAttribute("data-strong"),
          original: el.getAttribute("data-lemma") || el.textContent?.trim() || "",
          meaning: el.getAttribute("data-glosa") || "",
          morph: el.getAttribute("data-morph") || "",
          translit: el.getAttribute("data-translit") || "",
        });
      });
    const original = global.__revelatioPassageData?.original;
    const verso = (original?.versos || []).find((v) => Number(v.verso || v.n || v.verse) === n);
    (verso?.tokens || []).forEach((t) => {
      if (!t.strong) return;
      codes.push({
        strong: t.strong,
        original: t.palabra || t.lemma || "",
        translit: t.translit || "",
        morph: t.gramatica || t.morph || "",
        meaning: t.glosa || t.traduccion || "",
      });
    });
    return dedupeTokens(codes);
  }

  async function resolveStrongLexicon(ref) {
    const seeded = seedStrong(ref);
    if (seeded.length) {
      const map = readStrongCache();
      map[strongCacheKey(ref)] = seeded;
      writeStrongCache(map);
      return seeded;
    }

    const local = loadStrongsLocal(ref);
    if (local.length) {
      const map = readStrongCache();
      map[strongCacheKey(ref)] = local;
      writeStrongCache(map);
      return local;
    }
    const cached = readStrongCache()[strongCacheKey(ref)];
    if (Array.isArray(cached) && cached.length) return cached;

    const verse = verseTextFor(ref);
    try {
      const prompt = [
        `Entrega el desglose léxico palabra por palabra para ${ref}${verse ? ` («${verse.slice(0, 160)}»)` : ""} en JSON estricto:`,
        `[ { "original": "...", "translit": "...", "strong": "G...", "morph": "...", "meaning": "..." } ]`,
        "Solo el array JSON.",
      ].join("\n");
      const text = await callAgente(prompt, ref, "exegesis");
      const tokens = dedupeTokens(extractJsonArray(text) || []);
      if (!tokens.length) throw new Error("Sin tokens léxicos");
      const map = readStrongCache();
      map[strongCacheKey(ref)] = tokens;
      writeStrongCache(map);
      return tokens;
    } catch (err) {
      // Fallback editorial mínimo para no dejar el panel vacío
      const fallback = [
        {
          original: "—",
          translit: "",
          strong: "—",
          morph: "Léxico pendiente",
          meaning: `No hay desglose Strong local para ${ref}. ${err?.message || ""} Activa el Agente Teológico o abre otro versículo con seed léxico.`,
        },
      ];
      throw Object.assign(err || new Error("Sin léxico"), { fallback });
    }
  }

  function renderStrongLexicon(container, wordsList) {
    if (!container) return "";
    const list = Array.isArray(wordsList) ? wordsList : [];
    const html = `
    <div class="space-y-4 font-serif text-[#0F172A]">
      <div class="pb-2 border-b border-[#E8DFC8]">
        <h3 class="text-sm font-bold text-[#0A192F] uppercase tracking-wider">Léxico Strong &amp; Análisis Interlineal</h3>
        <p class="text-xs text-[#C59B27] font-sans mt-0.5">Raíz griega/hebrea, transliteración y traducción estricta</p>
      </div>

      <div class="space-y-3">
        ${
          list.length
            ? list
                .map((w) => {
                  const gloss = resolveStrongGloss(w);
                  const greek = gloss.greek;
                  const code = gloss.strongCode;
                  return `
            <div class="rv-sp-morph-card bg-white border border-[#E8DFC8] rounded-xl p-4 shadow-sm hover:border-[#C59B27] transition-all">
              <div class="flex items-baseline justify-between border-b border-stone-100 pb-2 mb-2 gap-2">
                <span class="rv-sp-strong-orig text-2xl font-serif font-bold text-[#0A192F] tracking-wide">${escapeHtml(greek)}</span>
                <span class="rv-sp-strong-badge text-xs font-mono font-bold px-2 py-0.5 bg-[#C59B27]/15 text-[#9A7418] rounded-md border border-[#C59B27]/30">
                  [ ${escapeHtml(code)} ]
                </span>
              </div>

              <div class="flex flex-wrap items-center gap-2 text-xs font-mono text-stone-600 mb-2">
                <span class="italic text-[#C59B27] font-semibold">${escapeHtml(gloss.translit || "—")}</span>
                ${gloss.pron ? `<span>•</span><span>(${escapeHtml(gloss.pron)})</span>` : ""}
                <span>•</span>
                <span class="bg-stone-100 px-1.5 py-0.5 rounded text-stone-700">${escapeHtml(gloss.part)}</span>
              </div>

              <div class="bg-amber-50/40 border-l-2 border-[#C59B27] p-2.5 rounded-r-lg my-2">
                <p class="text-xs font-sans uppercase font-bold text-[#C59B27] tracking-wider mb-0.5">Traducción Estricta</p>
                <p class="rv-sp-morph-def text-sm font-serif font-semibold text-[#0F172A] leading-snug">${escapeHtml(gloss.def)}</p>
              </div>

              <button
                type="button"
                data-sp-strong-deep="${escapeHtml(code)}"
                data-sp-lemma="${escapeHtml(greek)}"
                class="rv-sp-morph-act w-full mt-2 py-2 px-3 bg-[#0A192F] hover:bg-[#13233D] text-[#DFB743] font-serif font-bold text-xs rounded-lg transition-colors flex items-center justify-center gap-2 shadow-sm"
              >
                <span>🔍 Profundizar con RevelatiO IA</span>
              </button>
            </div>`;
                })
                .join("")
            : `<p class="rv-sp-empty">Sin tokens Strong para este versículo.</p>`
        }
      </div>
    </div>`;
    container.innerHTML = html;
    return html;
  }

  /** Compat: devolvía HTML; ahora pinta con alto contraste + glosa española. */
  function renderStrongCards(tokens) {
    const host = document.createElement("div");
    renderStrongLexicon(host, tokens);
    return host.innerHTML;
  }

  function openIa(prompt, mode = "exegesis") {
    if (typeof global.openAiModal === "function") {
      global.openAiModal(mode === "vida" ? "vida" : "exegesis", prompt);
      return;
    }
    if (typeof RV.ai?.open === "function") {
      RV.ai.open(prompt, mode === "vida" ? "vida" : "exegesis");
      return;
    }
    document.dispatchEvent(new CustomEvent("revelatio:ask-ai", { detail: { prompt, mode } }));
    document.getElementById("btn-asistente-ia")?.click();
    setTimeout(() => {
      const ta = document.querySelector("#form-asistente-ia textarea[name='mensaje']");
      if (ta) {
        ta.value = prompt;
        ta.focus();
      }
    }, 120);
  }

  /** Abre RevelatiO IA precargada con la lente de vida seleccionada. */
  function openAiWithLens(promptSeed, passageRef, lensTitle) {
    const prompt = `${promptSeed || ""} ${passageRef || ""}`.trim();
    openIa(prompt, "vida");
    try {
      document.dispatchEvent(
        new CustomEvent("revelatio:lens", {
          detail: { title: lensTitle, prompt, ref: passageRef },
        })
      );
    } catch {
      /* ignore */
    }
  }
  global.openAiWithLens = openAiWithLens;

  const TABS_HTML = `
    <button type="button" class="is-on" data-sp-tab="comentarios" role="tab" aria-selected="true" title="Comentarios histórico-exegéticos de dominio público">📖 Comentarios</button>
    <button type="button" data-sp-tab="tsk" role="tab" aria-selected="false" title="Referencias Cruzadas Canónicas · Treasury of Scripture Knowledge (+500k conexiones bíblicas)">🔗 Ref. Cruzadas (TSK)</button>
    <button type="button" data-sp-tab="strong" role="tab" aria-selected="false" title="Léxico Strong · raíces hebreas y griegas">🏛️ Léxico Strong</button>
    <button type="button" data-sp-tab="dogmatica" role="tab" aria-selected="false" title="Lentes de transformación, metanoia y gracia">🔬 Lentes de Estudio</button>`;

  function ensurePanel() {
    let root = document.getElementById("study-drawer") || document.getElementById("rv-study-panel");
    if (!root) {
      root = document.createElement("aside");
      root.id = "study-drawer";
      root.className = "rv-study-panel study-drawer";
      root.hidden = true;
      root.setAttribute("aria-label", "Panel de estudio");
      root.innerHTML = `
        <div class="rv-sp-chrome">
          <header class="rv-sp-head">
            <div>
              <p class="rv-sp-kicker">Estudio · dominio público</p>
              <h2 id="rv-sp-title">Estudio del versículo</h2>
              <p id="rv-sp-ref" class="rv-sp-ref"></p>
            </div>
            <button type="button" data-sp-close aria-label="Cerrar panel">✕</button>
          </header>
          <div id="study-drawer-tabs" class="rv-sp-tabs" role="tablist">${TABS_HTML}</div>
        </div>
        <div class="rv-sp-body canon-scroll">
          <section id="rv-sp-comentarios" class="rv-sp-pane is-on" role="tabpanel"></section>
          <section id="rv-sp-tsk" class="rv-sp-pane" role="tabpanel" hidden></section>
          <section id="rv-sp-strong" class="rv-sp-pane" role="tabpanel" hidden></section>
          <section id="rv-sp-dogmatica" class="rv-sp-pane" role="tabpanel" hidden></section>
        </div>
        <div id="rv-sp-preview" class="rv-sp-preview" hidden></div>`;
      document.body.appendChild(root);
      return root;
    }

    root.id = "study-drawer";
    root.classList.add("rv-study-panel", "study-drawer");

    let tabs = root.querySelector("#study-drawer-tabs") || root.querySelector(".rv-sp-tabs");
    if (!tabs) {
      const chrome = root.querySelector(".rv-sp-chrome") || root;
      tabs = document.createElement("div");
      tabs.id = "study-drawer-tabs";
      tabs.className = "rv-sp-tabs";
      tabs.setAttribute("role", "tablist");
      chrome.appendChild(tabs);
    }
    tabs.id = "study-drawer-tabs";
    tabs.classList.add("rv-sp-tabs");
    // Siempre sincronizar etiquetas/tooltips (panel puede haber quedado cacheado en DOM)
    const needsRelabel =
      !tabs.querySelector('[data-sp-tab="tsk"]') ||
      !tabs.querySelector('[data-sp-tab="tsk"][title*="Treasury"]') ||
      !/Lentes de Transformación|Lentes de Estudio|Ref\. Cruzadas \(TSK\)/.test(tabs.textContent || "");
    if (needsRelabel) tabs.innerHTML = TABS_HTML;

    const body = root.querySelector(".rv-sp-body");
    if (body && !document.getElementById("rv-sp-tsk")) {
      const tsk = document.createElement("section");
      tsk.id = "rv-sp-tsk";
      tsk.className = "rv-sp-pane";
      tsk.hidden = true;
      tsk.setAttribute("role", "tabpanel");
      const strong = document.getElementById("rv-sp-strong");
      body.insertBefore(tsk, strong || null);
    }

    if (!root.querySelector(".rv-sp-chrome")) {
      const head = root.querySelector(".rv-sp-head");
      const tabsEl = root.querySelector(".rv-sp-tabs");
      if (head && tabsEl) {
        const chrome = document.createElement("div");
        chrome.className = "rv-sp-chrome";
        head.parentNode.insertBefore(chrome, head);
        chrome.appendChild(head);
        chrome.appendChild(tabsEl);
      }
    }

    if (!document.getElementById("rv-sp-preview")) {
      const prev = document.createElement("div");
      prev.id = "rv-sp-preview";
      prev.className = "rv-sp-preview";
      prev.hidden = true;
      root.appendChild(prev);
    }

    return root;
  }

  function createApi() {
    const root = ensurePanel();
    if (!root) {
      console.warn("[study-panel] No se encontró ni pudo crearse #study-drawer");
      return {
        open: async () => {},
        close: () => {},
        render: async () => {},
        setTab: () => {},
      };
    }
    let currentRef = "";
    let currentTab = "comentarios";
    let currentAutor = localStorage.getItem("revelatio_autor") || "matthew-henry";
    if (!COMMENTATORS.some((c) => c.id === currentAutor)) currentAutor = "matthew-henry";
    let loadToken = 0;

    const setTab = (tab) => {
      const map = {
        tsk: "tsk",
        comentarios: "comentarios",
        strong: "strong",
        dogmatica: "dogmatica",
        lentes: "dogmatica",
        xref: "tsk",
      };
      currentTab = map[tab] || tab || "comentarios";
      root.querySelectorAll("[data-sp-tab]").forEach((btn) => {
        const on = btn.dataset.spTab === currentTab;
        btn.classList.toggle("is-on", on);
        btn.setAttribute("aria-selected", on ? "true" : "false");
      });
      ["comentarios", "tsk", "strong", "dogmatica"].forEach((id) => {
        const pane = document.getElementById(`rv-sp-${id}`);
        if (!pane) return;
        const on = id === currentTab;
        pane.classList.toggle("is-on", on);
        pane.hidden = !on;
      });
      if (currentTab === "strong") renderStrongPane(currentRef);
      if (currentTab === "tsk") renderTskPane(currentRef);
      if (currentTab === "comentarios") renderCommentsPane(currentRef, currentAutor);
      if (currentTab === "dogmatica") renderLentesPane(currentRef);
    };

    function renderLentes(container, book, chapter, verse) {
      if (!container) return;
      const passageRef =
        book && chapter && verse
          ? `${book} ${chapter}:${verse}`
          : book && chapter
            ? `${book} ${chapter}`
            : String(book || currentRef || "este pasaje");

      container.innerHTML = `
    <div class="space-y-4 font-serif text-[#0F172A]">
      <div class="pb-2 border-b border-[#E8DFC8]">
        <h3 class="text-sm font-bold text-[#0A192F] uppercase tracking-wider">Lentes de Transformación &amp; Decisión</h3>
        <p class="text-xs text-[#C59B27] font-sans mt-0.5">Disciplinas especializadas aplicadas al discernimiento diario</p>
        ${passageRef ? `<p class="text-[11px] mt-1 font-semibold text-[#5C4508]">${escapeHtml(passageRef)}</p>` : ""}
      </div>

      <div class="space-y-3">
        ${REVELATIO_LENSES.map(
          (l) => `
          <button
            type="button"
            data-sp-lens
            data-sp-lens-id="${escapeHtml(l.id)}"
            data-sp-lens-prompt="${escapeHtml(l.promptSeed)}"
            data-sp-lens-title="${escapeHtml(l.title)}"
            data-sp-lens-ref="${escapeHtml(passageRef)}"
            class="group cursor-pointer bg-white hover:bg-amber-50/40 border border-[#E8DFC8] hover:border-[#C59B27] rounded-xl p-4 transition-all duration-200 shadow-sm hover:shadow-md text-left w-full"
          >
            <div class="flex items-start gap-3">
              <span class="text-xl p-2 rounded-lg bg-stone-100 group-hover:bg-[#C59B27]/15 transition-colors flex-shrink-0 select-none" aria-hidden="true">
                ${l.icon}
              </span>
              <div class="flex-1 min-w-0">
                <div class="flex items-center justify-between gap-2">
                  <h4 class="text-sm font-bold text-[#0A192F] group-hover:text-[#C59B27] transition-colors">
                    ${escapeHtml(l.title)}
                  </h4>
                  <span class="text-xs text-[#C59B27] opacity-0 group-hover:opacity-100 transition-opacity font-mono font-bold" aria-hidden="true">&rarr;</span>
                </div>

                <div class="mt-1">
                  <span class="inline-block text-[10px] font-mono font-bold px-2 py-0.5 bg-[#0A192F] text-[#DFB743] rounded border border-[#C59B27]/30 tracking-wide">
                    ${escapeHtml(l.discipline)}
                  </span>
                </div>

                <p class="text-xs text-stone-700 mt-2 font-serif leading-relaxed">
                  ${escapeHtml(l.studyArea)}
                </p>

                <div class="mt-2.5 pt-2 border-t border-stone-100 bg-amber-50/60 -mx-1 px-2.5 py-1.5 rounded-lg border-l-2 border-[#C59B27]">
                  <p class="text-[11px] font-sans text-[#855D10] font-semibold leading-tight">
                    🎯 ${escapeHtml(l.decisionValue)}
                  </p>
                </div>
              </div>
            </div>
          </button>`
        ).join("")}
      </div>
    </div>`;
    }

    function renderLentesPane(ref) {
      const el = document.getElementById("rv-sp-dogmatica");
      if (!el) return;
      const parts = parsePassageParts(ref);
      renderLentes(el, parts.book, parts.chapter, parts.verse || "");
    }

    async function renderCommentsPane(ref, autor) {
      const el = document.getElementById("rv-sp-comentarios");
      if (!el) return;
      const token = ++loadToken;
      el.innerHTML = `
        <div class="rv-sp-author-bar">
          <label class="rv-sp-author-label" for="rv-sp-autor">Comentarista</label>
          <select id="rv-sp-autor" class="rv-sp-autor" aria-label="Seleccionar comentarista">
            ${COMMENTATORS.map(
              (c) =>
                `<option value="${c.id}" ${c.id === autor ? "selected" : ""}>${escapeHtml(c.label)} — ${escapeHtml(c.subtitle)}</option>`
            ).join("")}
          </select>
        </div>
        <p class="rv-sp-loading">⏳ Cargando comentario exegético completo…</p>`;

      try {
        const com = await loadFullComment(ref, autor);
        if (token !== loadToken) return;
        el.innerHTML = `
          <div class="rv-sp-author-bar">
            <label class="rv-sp-author-label" for="rv-sp-autor">Comentarista</label>
            <select id="rv-sp-autor" class="rv-sp-autor" aria-label="Seleccionar comentarista">
              ${COMMENTATORS.map(
                (c) =>
                  `<option value="${c.id}" ${c.id === autor ? "selected" : ""}>${escapeHtml(c.label)} — ${escapeHtml(c.subtitle)}</option>`
              ).join("")}
            </select>
          </div>
          <article class="rv-sp-card rv-sp-card--comment border-0 shadow-none bg-transparent p-0">
            ${renderCommentaryShell({ authorName: com.label, fullTextHtml: com.html })}
          </article>`;
      } catch (err) {
        if (token !== loadToken) return;
        el.innerHTML = `
          <div class="rv-sp-author-bar">
            <select id="rv-sp-autor" class="rv-sp-autor">
              ${COMMENTATORS.map(
                (c) => `<option value="${c.id}" ${c.id === autor ? "selected" : ""}>${escapeHtml(c.label)}</option>`
              ).join("")}
            </select>
          </div>
          <p class="rv-sp-empty">No se pudo cargar el comentario completo. ${escapeHtml(err?.message || "")}</p>
          <button type="button" class="rv-sp-retry" data-sp-retry-comment>Reintentar</button>`;
      }
    }

    function tskPaneHeader(ref) {
      return `
        <div class="rv-sp-tsk-head mb-3 pb-2 border-b border-[#E8DFC8]">
          <div class="rv-sp-tsk-head-row flex items-center justify-between gap-2">
            <span class="rv-sp-tsk-head-title text-xs font-serif font-bold text-[#0A192F]">Referencias Cruzadas Canónicas</span>
            <span class="rv-sp-tsk-badge text-[10px] uppercase tracking-wider bg-amber-100 text-[#5C4508] px-1.5 py-0.5 rounded font-mono font-bold" title="Treasury of Scripture Knowledge">TSK</span>
          </div>
          <p class="rv-sp-tsk-head-copy text-[11px] text-[#475569] italic mt-0.5">La Escritura interpretando a la Escritura (Treasury of Scripture Knowledge).</p>
          ${ref ? `<p class="rv-sp-tsk-head-ref text-[11px] mt-1 font-semibold text-[#5C4508]">${escapeHtml(ref)}</p>` : ""}
        </div>`;
    }

    function tskGroupsMarkup(groups) {
      return `
        <div class="rv-sp-tsk-groups">
          ${(groups || [])
            .map(
              (g) => `
            <section class="rv-sp-tsk-group">
              <h3 class="rv-sp-tsk-phrase">«${escapeHtml(g.phrase)}»</h3>
              <div class="rv-sp-tsk-refs">
                ${(g.refs || [])
                  .map(
                    (r) =>
                      `<button type="button" class="rv-sp-tsk-ref" data-sp-tsk-ref="${escapeHtml(r)}" title="Vista previa / ir al pasaje">${escapeHtml(r)}</button>`
                  )
                  .join("")}
              </div>
            </section>`
            )
            .join("")}
        </div>`;
    }

    async function renderTskPane(ref) {
      const el = document.getElementById("rv-sp-tsk");
      if (!el) return;
      const token = ++loadToken;
      const seeded = seedTsk(ref);
      if (tskGroupsHaveRefs(seeded)) {
        el.innerHTML = `${tskPaneHeader(ref)}${tskGroupsMarkup(seeded)}`;
        enrichTskInBackground(ref);
        return;
      }
      el.innerHTML = `${tskPaneHeader(ref)}<p class="rv-sp-loading">⏳ Compilando referencias TSK…</p>`;
      try {
        const { groups } = await loadTskGroups(ref);
        if (token !== loadToken) return;
        if (!tskGroupsHaveRefs(groups)) {
          el.innerHTML = `${tskPaneHeader(ref)}<p class="rv-sp-empty">Sin referencias TSK catalogadas para <strong>${escapeHtml(ref || "este pasaje")}</strong>.</p>`;
          return;
        }
        el.innerHTML = `${tskPaneHeader(ref)}${tskGroupsMarkup(groups)}`;
      } catch (err) {
        if (token !== loadToken) return;
        el.innerHTML = `${tskPaneHeader(ref)}<p class="rv-sp-empty">Error al cargar TSK. ${escapeHtml(err?.message || "")}</p>`;
      }
    }

    async function renderStrongPane(ref) {
      const el = document.getElementById("rv-sp-strong");
      if (!el) return;
      const token = ++loadToken;
      await ensureStrongGlossary();
      if (token !== loadToken) return;

      const seeded = seedStrong(ref);
      if (seeded.length) {
        renderStrongLexicon(el, seeded);
        return;
      }
      const local = loadStrongsLocal(ref);
      if (local.length) {
        renderStrongLexicon(el, local);
        return;
      }
      el.innerHTML = `<p class="rv-sp-loading">⏳ Desglosando raíces en Griego/Hebreo…</p>`;
      try {
        const tokens = await resolveStrongLexicon(ref);
        if (token !== loadToken) return;
        if (tokens.length) renderStrongLexicon(el, tokens);
        else el.innerHTML = `<p class="rv-sp-empty">Sin tokens Strong para este versículo.</p>`;
      } catch (err) {
        if (token !== loadToken) return;
        if (Array.isArray(err?.fallback) && err.fallback.length) {
          renderStrongLexicon(el, err.fallback);
          return;
        }
        el.innerHTML = `<p class="rv-sp-empty">No se pudo desglosar el léxico. ${escapeHtml(err?.message || "")}</p>
          <button type="button" class="rv-sp-retry" data-sp-retry-strong>Reintentar</button>`;
      }
    }

    const render = async (ref, { keepLens = false } = {}) => {
      currentRef = ref || currentRef;
      const refEl = document.getElementById("rv-sp-ref");
      const titleEl = document.getElementById("rv-sp-title");
      if (refEl) refEl.textContent = currentRef || "—";
      if (titleEl) titleEl.textContent = currentRef ? `Estudio · ${currentRef}` : "Estudio del versículo";

      if (currentTab === "comentarios") await renderCommentsPane(currentRef, currentAutor);
      else if (currentTab === "tsk") await renderTskPane(currentRef);
      else if (currentTab === "strong") await renderStrongPane(currentRef);
      else if (currentTab === "dogmatica") renderLentesPane(currentRef);
      else {
        renderCommentsPane(currentRef, currentAutor);
      }
    };

    const showPreview = (refStr, anchor) => {
      const box = document.getElementById("rv-sp-preview");
      if (!box) return;
      const snippet = previewTextForRef(refStr);
      box.hidden = false;
      box.innerHTML = `
        <p class="rv-sp-preview-ref">${escapeHtml(refStr)}</p>
        <p class="rv-sp-preview-text">${escapeHtml(snippet || "Toca «Ir al pasaje» para abrir este texto en el visor.")}</p>
        <div class="rv-sp-preview-acts">
          <button type="button" data-sp-goto="${escapeHtml(refStr)}">Ir al pasaje</button>
          <button type="button" data-sp-preview-close>Cerrar</button>
        </div>`;
      if (anchor) {
        const r = anchor.getBoundingClientRect();
        const pr = root.getBoundingClientRect();
        box.style.top = `${Math.min(r.bottom - pr.top + 6, pr.height - 160)}px`;
        box.style.left = "0.75rem";
        box.style.right = "0.75rem";
      }
    };

    const open = async ({ tab = "comentarios", ref } = {}) => {
      root.hidden = false;
      root.removeAttribute("hidden");
      root.classList.add("is-open");
      document.body.classList.add("has-study-panel");
      if (ref) currentRef = ref;
      else {
        const on = document.querySelector(
          "#texto-biblico .rv-verse-surface.is-verse-on, #texto-biblico .is-va-active"
        );
        currentRef = on?.dataset?.reference || currentRef;
      }
      // Compat: antiguos callers enviaban tab:'tsk' esperando dogmática; ahora tsk es real
      setTab(tab === "xref" ? "tsk" : tab);
      await render(currentRef);
    };

    const close = () => {
      root.classList.remove("is-open");
      root.hidden = true;
      document.body.classList.remove("has-study-panel");
      const prev = document.getElementById("rv-sp-preview");
      if (prev) prev.hidden = true;
    };

    root.addEventListener?.("change", (event) => {
      const sel = event.target.closest?.("#rv-sp-autor");
      if (!sel) return;
      currentAutor = sel.value;
      localStorage.setItem("revelatio_autor", currentAutor);
      const main = document.getElementById("selector-autor");
      if (main) {
        main.value = currentAutor;
        main.dispatchEvent(new Event("change", { bubbles: true }));
      }
      renderCommentsPane(currentRef, currentAutor);
    });

    root.addEventListener?.("click", (event) => {
      event.stopPropagation();
      if (event.target.closest("[data-sp-close]")) {
        close();
        return;
      }
      if (event.target.closest("[data-sp-preview-close]")) {
        const prev = document.getElementById("rv-sp-preview");
        if (prev) prev.hidden = true;
        return;
      }
      const goto = event.target.closest("[data-sp-goto]")?.dataset?.spGoto;
      if (goto) {
        navigateToRef(goto);
        return;
      }
      const tab = event.target.closest("[data-sp-tab]")?.dataset?.spTab;
      if (tab) {
        setTab(tab);
        return;
      }
      if (event.target.closest("[data-sp-retry-comment]")) {
        renderCommentsPane(currentRef, currentAutor);
        return;
      }
      if (event.target.closest("[data-sp-retry-strong]")) {
        renderStrongPane(currentRef);
        return;
      }
      const tskRef = event.target.closest("[data-sp-tsk-ref]");
      if (tskRef) {
        showPreview(tskRef.dataset.spTskRef, tskRef);
        return;
      }
      const deep = event.target.closest("[data-sp-strong-deep]");
      if (deep) {
        const code = deep.dataset.spStrongDeep;
        const lemma = deep.dataset.spLemma || "";
        document.dispatchEvent(
          new CustomEvent("revelatio:open-strong", { detail: { codigo: code, lemma } })
        );
        openIa(
          `Profundiza el Strong ${code}${lemma ? ` (${lemma})` : ""} en el contexto de ${currentRef}: morfología, ocurrencias canónicas y sentido teológico.`
        );
        return;
      }
      const iaBtn = event.target.closest("[data-sp-dogma-ia]");
      if (iaBtn) {
        openIa(`Analiza ${currentRef || "este pasaje"} bajo una lente de transformación y vida.`);
        return;
      }
      const lensBtn = event.target.closest("[data-sp-lens]");
      if (lensBtn) {
        openAiWithLens(
          lensBtn.dataset.spLensPrompt || "",
          lensBtn.dataset.spLensRef || currentRef || "",
          lensBtn.dataset.spLensTitle || ""
        );
        return;
      }
      const dogmaBtn = event.target.closest("[data-sp-dogma]");
      if (dogmaBtn) {
        const lens = REVELATIO_LENSES.find((d) => d.id === dogmaBtn.dataset.spDogma);
        if (lens) openAiWithLens(lens.promptSeed, currentRef, lens.title);
      }
    });

    document.addEventListener("revelatio:open-study-panel", (event) => {
      open(event.detail || {});
    });
    document.addEventListener("revelatio:verse-selected", (event) => {
      if (root.classList.contains("is-open") && event.detail?.ref) {
        render(event.detail.ref, { keepLens: true });
      }
    });
    document.addEventListener("keydown", (e) => {
      if (e.key === "Escape" && root?.classList?.contains("is-open")) close();
    });
    const btnStudy = document.getElementById("btn-study-panel");
    if (btnStudy) {
      btnStudy.addEventListener("click", (e) => {
        e.preventDefault();
        open({ tab: "comentarios" });
      });
    } else {
      document.addEventListener("click", (e) => {
        if (e.target.closest?.("#btn-study-panel")) {
          e.preventDefault();
          open({ tab: "comentarios" });
        }
      });
    }

    // Exponer TSK seed para concordancia legacy
    global.TSK_LOCAL = global.TSK_LOCAL || {};
    Object.entries(TSK_SEED).forEach(([k, groups]) => {
      if (!global.TSK_LOCAL[k]) {
        global.TSK_LOCAL[k] = groups.flatMap((g) =>
          (g.refs || []).map((r) => ({ ref: r, nota: g.phrase }))
        );
      }
    });

    return { open, close, render, setTab, renderLentes };
  }

  let api = null;
  function mount() {
    if (api) return api;
    api = createApi();
    RV.studyPanel = api;
    RV.REVELATIO_LENSES = REVELATIO_LENSES;
    RV.STRONGS_GLOSSARY = STRONGS_GLOSSARY;
    RV.renderLentes = (container, book, chapter, verse) =>
      api.renderLentes(container, book, chapter, verse);
    RV.renderStrongLexicon = (container, wordsList) =>
      renderStrongLexicon(container, wordsList);
    return api;
  }

  RV.studyPanel = { mount, open: (o) => mount().open(o), close: () => mount().close() };
  if (document.readyState === "loading") document.addEventListener("DOMContentLoaded", mount);
  else mount();
})(typeof window !== "undefined" ? window : globalThis);
