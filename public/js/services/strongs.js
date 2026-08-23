/**
 * Éfata RevelatiO — strongs.js
 * Glosas Strong en español + popup de alto contraste.
 */
(function (global) {
  "use strict";

  const RV = (global.RV = global.RV || {});

  const STRONGS_SPANISH = {
    H4853: {
      word: "מַשָּׂא",
      translit: "massâ'",
      pron: "mas-saw'",
      def: "Carga, peso, tributo; profecía, oráculo divino solemne o mensaje de juicio.",
      part: "Sustantivo masculino",
    },
    H834: {
      word: "אֲשֶׁר",
      translit: "'ăsher",
      pron: "ash-er'",
      def: "Que, quien, el cual, donde, conforme a.",
      part: "Pronombre relativo",
    },
    H2372: {
      word: "חָזָה",
      translit: "châzâh",
      pron: "khaw-zaw'",
      def: "Ver, contemplar, percibir por visión profética, discernir.",
      part: "Verbo",
    },
    H2265: {
      word: "חֲבַקּוּק",
      translit: "Chăbaqqûwq",
      pron: "khab-ak-kook'",
      def: "Habacuc («Abrazo» o «El que lucha/abraza»).",
      part: "Nombre propio masculino",
    },
    H5030: {
      word: "נָבִיא",
      translit: "nâbîy'",
      pron: "naw-bee'",
      def: "Profeta, portavoz inspirado de Dios, mensajero divino.",
      part: "Sustantivo masculino",
    },
    H3068: {
      word: "יְהוָה",
      translit: "YHVH",
      pron: "yeh-ho-vaw'",
      def: "Jehová / Yahvé: El Dios autoexistente y del pacto eterno.",
      part: "Nombre propio divino",
    },
    H7768: {
      word: "שָׁוַע",
      translit: "shâva'",
      pron: "shaw-vah'",
      def: "Clamar por auxilio, gritar pidiendo socorro.",
      part: "Verbo",
    },
    H430: {
      word: "אֱלֹהִים",
      translit: "ĕlôhîym",
      pron: "el-o-heem'",
      def: "Dios, dioses; el Dios soberano (plural majestático).",
      part: "Sustantivo masculino",
    },
    H113: {
      word: "אָדוֹן",
      translit: "ʼâdôwn",
      pron: "aw-done'",
      def: "Señor, dueño, amo; el Señor.",
      part: "Sustantivo masculino",
    },
    H2617: {
      word: "חֶסֶד",
      translit: "chêsêd",
      pron: "kheh'-sed",
      def: "Misericordia, lealtad del pacto, bondad fiel.",
      part: "Sustantivo masculino",
    },
    G281: {
      word: "ἀμήν",
      translit: "amēn",
      pron: "am-ane'",
      def: "Amén, verdaderamente, en verdad, así sea.",
      part: "Adverbio / Partícula",
    },
    G3004: {
      word: "λέγω",
      translit: "legō",
      pron: "leg'-o",
      def: "Decir, hablar, proponer, relatar, ordenar.",
      part: "Verbo",
    },
    G5210: {
      word: "ὑμῖν",
      translit: "hymin",
      pron: "hoo-min'",
      def: "A vosotros, para vosotros, por vosotros.",
      part: "Pronombre personal",
    },
    G3588: {
      word: "ὁ",
      translit: "ho",
      pron: "ho",
      def: "El, la, lo (artículo determinado).",
      part: "Artículo",
    },
    G2532: {
      word: "καί",
      translit: "kai",
      pron: "kahee",
      def: "Y, también, aun, además.",
      part: "Conjunción",
    },
    G4964: {
      word: "συσχηματίζω",
      translit: "syschēmatizō",
      pron: "soos-khay-mat-id'-zo",
      def: "Conformarse a un esquema o figura; amoldarse al molde externo.",
      part: "Verbo",
    },
    G3339: {
      word: "μεταμορφόω",
      translit: "metamorphoō",
      pron: "met-am-or-fo'-o",
      def: "Transformar, transfigurar; cambio interior de forma esencial.",
      part: "Verbo",
    },
    G3563: {
      word: "νοῦς",
      translit: "nous",
      pron: "nooce",
      def: "Mente, entendimiento, facultad de percibir y juzgar.",
      part: "Sustantivo",
    },
  };

  const EN_GLOSS = {
    burden: "Carga, profecía, oráculo divino",
    oracle: "Oráculo, declaración profética",
    vision: "Visión, revelación sobrenatural",
    prophet: "Profeta, proclamador de la verdad",
    cry: "Clamar, gritar por auxilio",
    see: "Ver, contemplar proféticamente",
    pray: "Orar, interceder",
    law: "Ley, instrucción, Torá",
    lord: "Señor",
    god: "Dios",
    love: "Amor",
    faith: "Fe, confianza",
    grace: "Gracia",
    spirit: "Espíritu",
    word: "Palabra, discurso",
    life: "Vida",
    light: "Luz",
    truth: "Verdad",
    peace: "Paz",
    hope: "Esperanza",
    sin: "Pecado",
    holy: "Santo, separado",
    glory: "Gloria",
    king: "Rey",
    priest: "Sacerdote",
    servant: "Siervo",
    son: "Hijo",
    father: "Padre",
    mother: "Madre",
    people: "Pueblo",
    land: "Tierra, país",
    heaven: "Cielo",
    earth: "Tierra",
    day: "Día",
    night: "Noche",
    hand: "Mano",
    heart: "Corazón",
    soul: "Alma, vida",
    flesh: "Carne",
    blood: "Sangre",
    death: "Muerte",
    resurrect: "Resucitar",
    believe: "Creer",
    know: "Conocer",
    hear: "Oír",
    speak: "Hablar",
    come: "Venir",
    go: "Ir",
    give: "Dar",
    take: "Tomar",
    make: "Hacer",
    do: "Hacer",
    say: "Decir",
    call: "Llamar",
    send: "Enviar",
    save: "Salvar",
    judge: "Juzgar",
    teach: "Enseñar",
    preach: "Predicar",
    praise: "Alabar",
    worship: "Adorar",
    fear: "Temor",
    joy: "Gozo",
    mercy: "Misericordia",
    righteousness: "Justicia",
    kingdom: "Reino",
    covenant: "Pacto",
    temple: "Templo",
    altar: "Altar",
    sacrifice: "Sacrificio",
    offering: "Ofrenda",
    prayer: "Oración",
    blessing: "Bendición",
    curse: "Maldición",
    enemy: "Enemigo",
    friend: "Amigo",
    house: "Casa",
    city: "Ciudad",
    mountain: "Monte",
    water: "Agua",
    fire: "Fuego",
    wind: "Viento",
    bread: "Pan",
    wine: "Vino",
    oil: "Aceite",
    gold: "Oro",
    silver: "Plata",
    stone: "Piedra",
    tree: "Árbol",
    fruit: "Fruto",
    seed: "Semilla",
    path: "Camino",
    way: "Camino",
    door: "Puerta",
    gate: "Puerta / portón",
    wall: "Muro",
    name: "Nombre",
    face: "Rostro",
    eye: "Ojo",
    ear: "Oído",
    mouth: "Boca",
    tongue: "Lengua",
    foot: "Pie",
    head: "Cabeza",
    arm: "Brazo",
    strength: "Fuerza",
    power: "Poder",
    wisdom: "Sabiduría",
    knowledge: "Conocimiento",
    understanding: "Entendimiento",
    mind: "Mente",
    will: "Voluntad",
    desire: "Deseo",
    anger: "Ira",
    wrath: "Ira",
    love: "Amor",
    hate: "Aborrecer",
    forgive: "Perdonar",
    redeem: "Redimir",
    deliver: "Librar",
    heal: "Sanar",
    cleanse: "Limpiar",
    sanctify: "Santificar",
    justify: "Justificar",
    glorify: "Glorificar",
    exalt: "Exaltar",
    humble: "Humillar",
    repent: "Arrepentirse",
    convert: "Convertir",
    transform: "Transformar",
    renew: "Renovar",
    create: "Crear",
    form: "Formar",
    build: "Edificar",
    destroy: "Destruir",
    gather: "Reunir",
    scatter: "Esparcir",
    choose: "Elegir",
    elect: "Elegido",
    anoint: "Ungir",
    appoint: "Designar",
    command: "Mandar",
    obey: "Obedecer",
    keep: "Guardar",
    break: "Quebrar",
    remember: "Recordar",
    forget: "Olvidar",
    seek: "Buscar",
    find: "Hallar",
    ask: "Pedir",
    answer: "Responder",
    wait: "Esperar",
    rest: "Descansar",
    sleep: "Dormir",
    wake: "Despertar",
    rise: "Levantarse",
    sit: "Sentarse",
    stand: "Estar de pie",
    walk: "Andar",
    run: "Correr",
    flee: "Huir",
    fight: "Pelear",
    war: "Guerra",
    peace: "Paz",
    sword: "Espada",
    shield: "Escudo",
    crown: "Corona",
    throne: "Trono",
    sceptre: "Cetro",
    scepter: "Cetro",
    rod: "Vara",
    staff: "Báculo",
    shepherd: "Pastor",
    flock: "Rebaño",
    sheep: "Oveja",
    lamb: "Cordero",
    lion: "León",
    serpent: "Serpiente",
    dove: "Paloma",
    star: "Estrella",
    sun: "Sol",
    moon: "Luna",
    cloud: "Nube",
    rain: "Lluvia",
    storm: "Tormenta",
    sea: "Mar",
    river: "Río",
    wilderness: "Desierto",
    desert: "Desierto",
    field: "Campo",
    vineyard: "Viña",
    harvest: "Cosecha",
    labor: "Labor",
    work: "Obra / trabajo",
    reward: "Recompensa",
    wage: "Salario",
    gift: "Don",
    promise: "Promesa",
    oath: "Juramento",
    testimony: "Testimonio",
    witness: "Testigo",
    judgment: "Juicio",
    justice: "Justicia",
    iniquity: "Iniquidad",
    transgression: "Transgresión",
    trespass: "Delito",
    guilt: "Culpa",
    clean: "Limpio",
    unclean: "Inmundo",
    pure: "Puro",
    impure: "Impuro",
    perfect: "Perfecto",
    whole: "Entero / sano",
    broken: "Quebrantado",
    poor: "Pobre",
    rich: "Rico",
    widow: "Viuda",
    orphan: "Huérfano",
    stranger: "Extranjero",
    neighbor: "Prójimo",
    brother: "Hermano",
    sister: "Hermana",
    child: "Niño",
    children: "Hijos",
    generation: "Generación",
    nation: "Nación",
    gentile: "Gentil",
    jew: "Judío",
    israel: "Israel",
    jerusalem: "Jerusalén",
    zion: "Sion",
    egypt: "Egipto",
    babylon: "Babilonia",
    assyria: "Asiria",
    philistine: "Filisteo",
    canaan: "Canaán",
    messiah: "Mesías",
    christ: "Cristo",
    jesus: "Jesús",
    apostle: "Apóstol",
    disciple: "Discípulo",
    church: "Iglesia",
    assembly: "Asamblea",
    synagogue: "Sinagoga",
    gospel: "Evangelio",
    scripture: "Escritura",
    commandment: "Mandamiento",
    statute: "Estatuto",
    ordinance: "Ordenanza",
    precept: "Precepto",
    doctrine: "Doctrina",
    teaching: "Enseñanza",
    parable: "Parábola",
    proverb: "Proverbio",
    psalm: "Salmo",
    hymn: "Himno",
    song: "Cántico",
    angel: "Ángel",
    demon: "Demonio",
    devil: "Diablo",
    satan: "Satanás",
    hell: "Infierno",
    hades: "Hades",
    gehenna: "Gehena",
    paradise: "Paraíso",
    eternal: "Eterno",
    forever: "Para siempre",
    amen: "Amén",
    hallelujah: "Aleluya",
    hosanna: "Hosanna",
    abba: "Abba (Padre)",
    rabbi: "Rabí",
    teacher: "Maestro",
    master: "Maestro / Señor",
  };

  function normalizeStrongCode(code) {
    const raw = String(code || "").trim().toUpperCase();
    const m = raw.match(/^([GH])0*(\d+)$/);
    return m ? `${m[1]}${m[2]}` : raw;
  }

  function looksEnglish(text) {
    const t = String(text || "").trim();
    if (!t) return false;
    if (/[áéíóúñü¿¡]/i.test(t)) return false;
    return /\b(the|and|of|to|in|for|with|from|that|this|burden|oracle|vision|prophet|lord|god|shall|unto)\b/i.test(
      t
    );
  }

  function translateGlossToSpanish(englishText) {
    if (!englishText) return "Definición léxica contextual del original bíblico.";
    let translated = String(englishText);
    Object.keys(EN_GLOSS)
      .sort((a, b) => b.length - a.length)
      .forEach((k) => {
        translated = translated.replace(new RegExp(`\\b${k}\\b`, "gi"), EN_GLOSS[k]);
      });
    translated = translated.replace(/\s+/g, " ").trim();
    if (!translated) return "Definición léxica contextual del original bíblico.";
    return translated.charAt(0).toUpperCase() + translated.slice(1);
  }

  function resolveSpanishEntry(strongCode, rawData = {}) {
    const code = normalizeStrongCode(strongCode);
    const canned = STRONGS_SPANISH[code];
    if (canned) {
      return {
        strongCode: code,
        word: canned.word,
        translit: canned.translit,
        pron: canned.pron,
        def: canned.def,
        part: canned.part,
      };
    }

    const rawDef =
      rawData.def ||
      rawData.definition ||
      rawData.definicion ||
      rawData.meaning ||
      rawData.glosa ||
      rawData.translation ||
      "";
    const def = looksEnglish(rawDef) ? translateGlossToSpanish(rawDef) : rawDef || translateGlossToSpanish("");

    return {
      strongCode: code,
      word: rawData.word || rawData.original || rawData.lemma || rawData.lexema || "—",
      translit: rawData.translit || rawData.transliteracion || "",
      pron: rawData.pron || rawData.pronunciacion || "",
      def,
      part:
        rawData.part ||
        rawData.partOfSpeech ||
        rawData.morph ||
        (code.startsWith("H") ? "Término Hebreo" : "Término Griego"),
    };
  }

  function escapeHtml(s) {
    return String(s || "")
      .replace(/&/g, "&amp;")
      .replace(/</g, "&lt;")
      .replace(/>/g, "&gt;")
      .replace(/"/g, "&quot;");
  }

  function createStrongPopover() {
    let modal = document.getElementById("strong-popover");
    if (modal) return modal;
    modal = document.createElement("div");
    modal.id = "strong-popover";
    modal.className = "strong-popover hidden";
    modal.setAttribute("role", "dialog");
    modal.setAttribute("aria-label", "Léxico Strong");
    document.body.appendChild(modal);
    return modal;
  }

  function closeStrongModal() {
    const modal = document.getElementById("strong-popover");
    if (!modal) return;
    modal.classList.add("hidden");
    modal.innerHTML = "";
  }

  function showStrongModal(strongCode, rawData = {}) {
    const modal = document.getElementById("strong-popover") || createStrongPopover();
    const data = resolveSpanishEntry(strongCode, rawData);
    const isHeb = String(data.strongCode || "").startsWith("H");

    modal.innerHTML = `
    <div class="bg-white border-2 border-[#C59B27] rounded-2xl p-5 shadow-2xl max-w-sm w-full font-serif text-[#0F172A] relative">
      <button type="button" data-strong-close class="absolute top-3 right-3 text-stone-400 hover:text-stone-700 text-lg font-bold p-1" aria-label="Cerrar">&times;</button>
      
      <div class="flex items-center gap-2 mb-2">
        <span class="text-xs font-mono font-bold px-2.5 py-0.5 bg-[#C59B27]/20 text-[#855D10] rounded-md border border-[#C59B27]/40">
          ${escapeHtml(data.strongCode)}
        </span>
        <span class="text-[11px] font-sans font-semibold text-stone-500 uppercase tracking-wide">${escapeHtml(data.part)}</span>
      </div>

      <div class="text-3xl font-serif font-bold text-[#0A192F] my-2 ${isHeb ? "text-right" : "text-left"}" ${isHeb ? 'dir="rtl" lang="he"' : 'lang="el"'}>
        ${escapeHtml(data.word)}
      </div>

      <div class="text-xs font-mono text-stone-600 mb-3 pb-2 border-b border-[#E8DFC8]">
        <span class="font-bold text-[#C59B27]">${escapeHtml(data.translit || "—")}</span>
        ${data.pron ? `<span class="text-stone-500"> • /${escapeHtml(data.pron)}/</span>` : ""}
      </div>

      <div class="bg-amber-50 border-l-4 border-[#C59B27] p-3 rounded-r-lg">
        <span class="text-[10px] font-sans font-bold text-[#855D10] uppercase tracking-wider block mb-1">
          Traducción Estricta al Español
        </span>
        <p class="text-sm font-serif font-semibold text-[#0F172A] leading-relaxed">
          ${escapeHtml(data.def)}
        </p>
      </div>
    </div>`;

    modal.classList.remove("hidden");
    modal.querySelector("[data-strong-close]")?.addEventListener("click", closeStrongModal);
  }

  /** Píldora interlineal de alto contraste */
  function renderStrongPill(code, label, lemma) {
    const entry = resolveSpanishEntry(code, { word: lemma, glosa: label });
    const gloss = entry.def.split(/[.;]/)[0] || label || entry.word;
    return `<button type="button" class="rv-strong-pill bg-amber-100/70 hover:bg-amber-200 border border-[#C59B27]/40 text-[#0F172A] text-xs font-serif px-2 py-0.5 rounded-md inline-flex items-center gap-1 cursor-pointer transition-all shadow-sm" data-strong="${escapeHtml(entry.strongCode)}" data-lemma="${escapeHtml(entry.word)}" aria-label="Strong ${escapeHtml(entry.strongCode)}: ${escapeHtml(gloss)}">
      <span class="font-semibold">${escapeHtml(gloss)}</span>
      <span class="text-[9px] font-mono font-bold text-[#855D10]">${escapeHtml(entry.strongCode)}</span>
    </button>`;
  }

  // Merge into RV_DATA.GLOSA shortcuts
  Object.entries(STRONGS_SPANISH).forEach(([code, v]) => {
    const short = (v.def || "").split(/[.;]/)[0];
    if (short) {
      RV.data = RV.data || {};
      RV.data.GLOSA = RV.data.GLOSA || {};
      RV.data.GLOSA[code] = short;
      if (global.RV_DATA) {
        global.RV_DATA.GLOSA = global.RV_DATA.GLOSA || {};
        global.RV_DATA.GLOSA[code] = short;
      }
    }
  });

  global.translateGlossToSpanish = translateGlossToSpanish;
  global.showStrongModal = showStrongModal;
  global.closeStrongModal = closeStrongModal;
  global.resolveSpanishStrong = resolveSpanishEntry;
  global.renderStrongPill = renderStrongPill;

  RV.Strongs = {
    STRONGS_SPANISH,
    normalizeStrongCode,
    translateGlossToSpanish,
    resolveSpanishEntry,
    showStrongModal,
    closeStrongModal,
    renderStrongPill,
  };

  document.addEventListener("keydown", (e) => {
    if (e.key === "Escape") closeStrongModal();
  });
  document.addEventListener("mousedown", (e) => {
    const modal = document.getElementById("strong-popover");
    if (!modal || modal.classList.contains("hidden")) return;
    if (modal.contains(e.target) || e.target.closest?.("[data-strong]")) return;
    closeStrongModal();
  });
})(typeof window !== "undefined" ? window : globalThis);
