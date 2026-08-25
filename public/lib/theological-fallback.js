/**
 * Éfata RevelatiO — theological-fallback.js
 * Motor teológico de alta densidad académica y síntesis doctrinal inmediata (<50ms).
 * Diseñado bajo ortodoxia reformada, filología bíblica rigurosa y neurociencia cognitiva.
 */
import {
  formatearLexico,
  formatearTsk,
  paralelosReales
} from './consulta-contexto.js';

function normalizarTexto(texto) {
  return String(texto || '').replace(/\s+/g, ' ').trim();
}

/**
 * Generador de respuesta profunda para las Lentes Élite de RevelatiO IA.
 */
export function generarFallbackLenteElite({ passage, subLensId, lensId, lensTitle, prompt, verseText, ctx } = {}) {
  const ref = String(passage || ctx?.etiqueta || 'Pasaje Bíblico').trim();
  const rawId = String(subLensId || lensId || '').toLowerCase().trim();
  const rawTitle = String(lensTitle || '').toLowerCase().trim();
  const rawPrompt = String(prompt || '').toLowerCase().trim();
  const texto = normalizarTexto(verseText || ctx?.texto || '');
  const citaTexto = texto ? ` («${texto}»)` : '';

  // 1. DICTAMEN MAESTRO INTEGRADO (CONVERGENCIA TOTAL)
  if (
    rawId === 'dictamen_maestro' ||
    rawId.includes('maestro') ||
    rawId.includes('dictamen') ||
    rawTitle.includes('dictamen maestro') ||
    rawTitle.includes('convergencia') ||
    rawPrompt.includes('dictamen maestro')
  ) {
    return `### I. Fundamento Exegético Cristocéntrico
El examen morfosintáctico de **${ref}**${citaTexto} sitúa la revelación sagrada en la consumación de la obra redentora de Jesucristo (*Tetélestai*). El texto desarma frontalmente todo intento de autojustificación moralista o legalismo religioso, anclando la aceptación incondicional del creyente en el pacto de gracia (*Sola Gratia*) y en la imputación inmutable de la justicia perfecta de Cristo (*justificación forense*). La terminología canónica no propone un mero código ético, sino una proclamación viva de liberación espiritual.

### II. Diagnóstico Cognitivo & Sesgos del Siglo
Bajo el prisma de Romanos 12:2, la mente humana caída opera bajo los moldes inconscientes de este siglo (*Aión / Syschēmatizō*), atrapada en sesgos cognitivos de autoengaño, hipervigilancia amigdalina y reactividad defensiva. **${ref}** expone la falacia de fundamentar la identidad en el rendimiento personal, confrontando la rumiación ansiosa y desmantelando los esquemas mentales rígidos que perpetúan la culpa y el temor al rechazo.

### III. Neuroplasticidad & Regeneración del Entendimiento (*Nous*)
La renovación del entendimiento (*metanoia*) opera como una reconfiguración neurocognitiva profunda bajo la unción del Espíritu Santo (*Pneuma*). La fijación atencional continua en las promesas del Evangelio activa el córtex prefrontal dorsolateral, inhibiendo la sobreactivación límbica y reentrenando las redes sinápticas hacia un nuevo hábito del alma (*hexis*). La verdad divina reescribe los circuitos de recompensa dopaminérgica, sustituyendo la necesidad de validación terrenal por el reposo en el amor eterno del Padre (*Hesed*).

### IV. Matriz Decisional Innegociable
**1. Criterio Rector:** Toda determinación debe emanar de la plenitud y seguridad en Cristo, no de la ansiedad o la presión de las circunstancias.
**2. Límites Rojos (*Red Flags*):** Prohibido el pragmatismo que compromete la integridad ética, las decisiones impulsivas en estado de pánico y la búsqueda de autoafirmación vanagloriosa.
**3. Directriz de Ejecución:** Avanzar con sobriedad, paz interior (*Shalom*) y valentía pastoral, alineando los recursos, el tiempo y las relaciones con la gloria inmutable de Dios.`;
  }

  // 2. ÓPTICA BÍBLICA 1: EXÉGESIS FILOLÓGICA & TEXTUAL
  if (
    rawId === 'biblica_exegesis' ||
    rawId.includes('exegesis') ||
    rawId.includes('filolog') ||
    rawTitle.includes('exégesis') ||
    rawTitle.includes('filolog')
  ) {
    return `### I. Análisis Morfosintáctico y Léxico Profundo
El estudio del texto original para **${ref}**${citaTexto} revela una arquitectura gramatical de precisión insustituible. Las raíces léxicas en los idiomas originales (hebreo/griego) articulan términos clave con tiempos verbales que denotan acción completada o continuidad imperativa en el pacto. Los términos morfológicos despojan al texto de ambigüedades interpretativas y conectan cada cláusula subordinada con el eje proposicional soberano del autor bíblico.

### II. Contexto Histórico, Cultural y Redaccional
El pasaje se enmarca dentro de un trasfondo socio-religioso concreto donde los destinatarios primarios enfrentaban tensiones entre la cosmovisión circundante y la fidelidad al Dios vivo. El género literario empleado por el autor sagrado establece pautas exegéticas obligatorias: respetar la analogía de la fe (*analogia fidei*), evitar anacronismos dogmáticos y reconocer la intención original del hagiógrafo guiado por el Espíritu Santo.

### III. Traducción Técnica Anotada y Dictamen Exegético
**Traducción Estricta:** «${texto || 'El testimonio fidedigno de la Escritura en ' + ref}»
*Nota Filológica:* La traducción literal resalta la fuerza de las partículas conectivas y el énfasis de la voz verbal activa/pasiva. El dictamen exegético concluye que el pasaje no admite interpretaciones moralistas desvinculadas de la gracia soberana, exigiendo una recepción teocéntrica que honre la inerrancia y suficiencia canónica.`;
  }

  // 3. ÓPTICA BÍBLICA 2: CRISTOCENTRISMO & SOLA GRATIA
  if (
    rawId === 'biblica_cristo' ||
    rawId.includes('cristo') ||
    rawId.includes('sola_gratia') ||
    rawTitle.includes('cristoc') ||
    rawTitle.includes('gracia')
  ) {
    return `### I. Tipificación y Cumplimiento en Cristo
Al examinar **${ref}**${citaTexto}, la revelación sagrada converge indefectiblemente en la persona teantrópica y la obra vicaria de Jesucristo. Cada tipología del Antiguo Testamento y cada exhortación apostólica del Nuevo Testamento hallan su cumplimiento orgánico y sustantivo en el Salvador. La cruz del Calvario (*Tetélestai*) sella el veredicto definitivo de redención, convirtiendo este pasaje en un heraldo del Evangelio de la gracia.

### II. Desmantelamiento Forense del Mérito Humano
Este pasaje deconstruye de manera radical y quirúrgica cualquier pretensión de autojustificación moral o mérito religioso intrínseco. La doctrina de la justificación forense declara que la justicia imputada al creyente es enteramente ajena (*iustitia aliena*), conferida por pura misericordia (*Sola Gratia*) mediante el instrumento de la fe (*Sola Fide*). Queda anulada toda vanagloria humana y todo sistema de rendimiento condicional ante el trono de Dios.

### III. Implicación Doctrinal y Libertad del Pacto
La verdad consolidada en **${ref}** extirpa el terror servil al juicio divino y establece al creyente en la gloriosa libertad de los hijos de Dios. La adopción filial sustituye la mentalidad de esclavo por la seguridad inquebrantable de la comunión con el Padre. Desde este reposo espiritual inalterable, la obediencia cristiana florece no como un medio para ganar bendición, sino como la respuesta espontánea de amor y adoración genuina.`;
  }

  // 4. ÓPTICA BÍBLICA 3: TEOLOGÍA DEL PACTO & METARRELATO
  if (
    rawId === 'biblica_pactos' ||
    rawId.includes('pacto') ||
    rawId.includes('canon') ||
    rawId.includes('metarrelato') ||
    rawTitle.includes('pacto') ||
    rawTitle.includes('metarrelato')
  ) {
    return `### I. Ubicación en el Metarrelato Canónico
**${ref}**${citaTexto} se engarza de forma armónica en la gran narrativa unificada de las Sagradas Escrituras: Creación original perfecta, Caída cósmica y moral del ser humano, Redención consumada por el Mesías prometido y Consumación escatológica final. Ningún versículo bíblico opera como un aforismo aislado; su sentido pleno resplandece únicamente a la luz de este horizonte redentor progresivo.

### II. Conexión y Arquitectura Pactal
El texto se articula en el despliegue orgánico de los pactos de Dios con su pueblo (Adámico, Abrahámico, Mosaico, Davídico y Nuevo Pacto en Cristo). Dios se revela como el Señor del Pacto (*Yahweh Berit*), cuya fidelidad incondicional garantiza el cumplimiento de cada promesa. En este versículo resuena la fórmula pactal perenne: «Yo seré vuestro Dios, y vosotros seréis mi pueblo».

### III. Continuidad y Discontinuidad Canónica
Bajo la luz del Nuevo Pacto (*Diathēkē*), observamos cómo las sombras, sacrificios y ordenanzas temporales caducan para dar paso a la realidad espiritual encarnada en Jesucristo. La continuidad de la ley moral y del propósito salvífico de Dios permanece inalterable, mientras que la administración del pacto alcanza en la Iglesia su dimensión universal y transcultural.`;
  }

  // 5. ÓPTICA BÍBLICA 4: APOLOGÉTICA CLÁSICA & COSMOVISIÓN
  if (
    rawId === 'biblica_apologetica' ||
    rawId.includes('apologet') ||
    rawId.includes('filosof') ||
    rawId.includes('cosmovision') ||
    rawTitle.includes('apologética') ||
    rawTitle.includes('cosmovisión')
  ) {
    return `### I. Confrontación de Cosmovisiones
La proclama de **${ref}**${citaTexto} colisiona frontalmente contra las presuposiciones del naturalismo materialista, el relativismo moral posmoderno y el existencialismo nihilista. Mientras el pensamiento secular reduce la existencia a procesos ciegos y convenciones arbitrarias, la revelación bíblica afirma la realidad objetiva de un Creador trascendente, un orden moral inmutable y un propósito teleológico eterno.

### II. Coherencia Epistémica y Verdad Objetiva
La cosmovisión bíblica ofrece el único marco racional capaz de justificar las condiciones de inteligibilidad de la experiencia humana: las leyes invariables de la lógica, la validez del razonamiento ético y la dignidad inviolable del ser humano (*Imago Dei*). **${ref}** manifiesta una consistencia interna impecable que resiste el escrutinio filosófico más riguroso y expone las contradicciones autodestructivas del escepticismo moderno.

### III. Defensa Argumentativa y Refutación de Objeciones
Frente a las críticas contemporáneas que acusan al cristianismo de dogmatismo irracional o arcaísmo ético, este pasaje demuestra que la sabiduría revelada de Dios supera infinitamente la finitud del intelecto humano. Con mansedumbre y reverencia apologética (1 Pe. 3:15), el creyente está capacitado para demoler sofismas y todo argumento altivo que se levante contra el verdadero conocimiento de Dios.`;
  }

  // 6. ÓPTICA MENTAL 1: NEUROCIENCIA COGNITIVA & SINAPSIS
  if (
    rawId === 'mental_neuro' ||
    rawId.includes('neuro') ||
    rawId.includes('sinapsis') ||
    rawId.includes('cerebro') ||
    rawTitle.includes('neurociencia') ||
    rawTitle.includes('sinapsis')
  ) {
    return `### I. Dinámica Cerebral y Detección de Sesgos Cognitivos
Al analizar los patrones conductuales abordados en **${ref}**${citaTexto}, la neurociencia cognitiva identifica la activación disfuncional del complejo amigdalino y los circuitos de alerta ante la incertidumbre. El cerebro humano tiende a operar mediante heurísticas automáticas de supervivencia: sesgo de confirmación, catastrofización anticipatoria y rumiación en bucle. Estos atajos neurobiológicos distorsionan la percepción de la realidad cuando no son supervisados por la verdad revelada.

### II. Mecanismo de Reconfiguración Sináptica (Neuroplasticidad)
La meditación prolongada y deliberada en este principio bíblico induce neuroplasticidad dirigida (*hebbian learning*). La estimulación focalizada del córtex prefrontal ventromedial y dorsolateral fortalece las proyecciones inhibitorias sobre la amígdala, reduciendo la secreción de cortisol y modulando las vías de dopamina y serotonina. De este modo, la mente pasa de la reactividad impulsiva a un estado de homeostasis y estabilidad sináptica (*hexis*).

### III. Protocolo de Interrupción de Patrones Disfuncionales
**1. Conciencia Metacognitiva:** Detectar en tiempo real el disparo neurovegetativo (tensión somática, pensamientos invasivos) antes de verbalizar o actuar.
**2. Sustitución Sináptica Activa:** Reemplazar el pensamiento tóxico con la verdad textual de **${ref}**, verbalizando la promesa bíblica en voz audible para reclutar áreas del lenguaje en el hemisferio dominante.
**3. Consolidación por Repetición:** Replicar este ciclo conductual durante 21-30 días para consolidar una nueva huella engramática en el lóbulo frontal.`;
  }

  // 7. ÓPTICA MENTAL 2: METANOIA & RENOVACIÓN DEL NOUS
  if (
    rawId === 'mental_metanoia' ||
    rawId.includes('metanoia') ||
    rawId.includes('nous') ||
    rawTitle.includes('metanoia') ||
    rawTitle.includes('nous')
  ) {
    return `### I. Radiografía del Esquema del Siglo (*Aión / Syschēmatizō*)
En la exhortación de **${ref}**${citaTexto}, la Escritura realiza una biopsia espiritual a la mentalidad secularizada. El apóstol Pablo advierte contra la asimilación inconsciente a los moldes y valores de la era caída (*Aión*). Los esquemas de este siglo promueven la autosuficiencia arrogante, el consumismo identitario y la búsqueda desesperada de aprobación terrenal, encerrando al ser humano en una jaula de ansiedad existencial.

### II. Regeneración y Transformación del *Nous*
La *metanoia* no es una leve modificación cosmética de la conducta, sino una transfiguración ontológica del entendimiento (*Nous*) operada por el Espíritu Santo (Ro. 12:2; Ef. 4:23). El Espíritu regenera las facultades noéticas del alma, iluminando la mente para contemplar la realidad a través del prisma de la verdad de Dios. Esta renovación purifica la voluntad y alinea los afectos profundos del corazón con la hermosura de la santidad divina.

### III. Discernimiento de la Voluntad de Dios (*Thelēma*)
Como resultado directo de esta renovación espiritual, el creyente queda capacitado para experimentar y comprobar (*dokimazein*) la voluntad de Dios: buena, agradable y perfecta. El discernimiento espiritual trasciende el mero análisis racional humano, dotando a la conciencia de una brújula infalible para transitar decisiones complejas con convicción inamovible y paz celestial.`;
  }

  // 8. ÓPTICA MENTAL 3: PSICOLOGÍA DEL ALMA & SHALOM
  if (
    rawId === 'mental_psicologia' ||
    rawId.includes('psicologia') ||
    rawId.includes('alma') ||
    rawId.includes('shalom') ||
    rawId.includes('crisis') ||
    rawId.includes('paz') ||
    rawTitle.includes('psicología') ||
    rawTitle.includes('shalom')
  ) {
    return `### I. Desarraigo de Motivaciones Ocultas y Patrones Defensivos
Al exponer el corazón humano ante **${ref}**${citaTexto}, la consejería bíblica saca a la luz los mecanismos de defensa inconscientes: aislamiento afectivo, perfeccionismo neurótico derivado del temor al castigo, o rationalización del pecado. El alma desprovista del Evangelio construye fortalezas de amargura y resentimiento; la Palabra viva penetra como espada de doble filo para sanar la raíz de la herida identitaria.

### II. Regulación Emocional y Shalom Trascendente
La paz bíblica (*Shalom*) no es una apatía estoica ni una tregua temporal con el conflicto exterior, sino la reconciliación total del ser integral con su Hacedor. Al apropiarse de la soberanía providencial y de la misericordia entrañable de Dios (*Hesed*), los afectos del alma son pacificados. La hipervigilancia ansiógena se desvanece ante la certeza de que nada puede separarnos del amor de Cristo (Ro. 8:39).

### III. Acompañamiento en Crisis y Terapia del Alma
Para quien atraviesa valles de dolor, duelo o incertidumbre crítica, **${ref}** provee un anclaje pastoral inamovible. La directriz clínica y pastoral exige:
**1. Validación del Lamento:** Permitir la expresión honesta del dolor ante Dios sin caer en el reproche incrédulo.
**2. Reanclaje en la Promesa:** Fijar la mirada en el carácter fiel e inmutable del Señor.
**3. Comunidad Terapéutica:** Caminar en comunión con el cuerpo de Cristo para sostener los brazos caídos.`;
  }

  // 9. ÓPTICA MENTAL 4: MATRIZ DECISIONAL ESTRATÉGICA
  if (
    rawId === 'mental_decision' ||
    rawId.includes('decision') ||
    rawId.includes('estrateg') ||
    rawId.includes('matriz') ||
    rawId.includes('habito') ||
    rawTitle.includes('decisional') ||
    rawTitle.includes('estrateg')
  ) {
    return `### I. Criterio Rector Innegociable
Del mandamiento y principio divino expuesto en **${ref}**${citaTexto} emana un axioma directivo supremo: **La gloria de Dios y la coherencia con el Reino son el único baremo no negociable.** Toda decisión estratégica —en el ámbito personal, vocacional, financiero o ministerial— debe ser evaluada no por su beneficio temporal a corto plazo, sino por su alineamiento con la justicia eterna de las Escrituras.

### II. Matriz de Límites Rojos (*Red Flags*)
**1. Trampa del Pragmatismo Carnal:** Queda vetada cualquier opción que justifique medios turbios o deshonestos para alcanzar fines aparentemente legítimos.
**2. Coacción del Miedo:** Prohibido tomar decisiones precipitadas bajo pánico emocional o amenazas circunstanciales.
**3. Yugo Desigual:** Rechazo frontal a alianzas o compromisos que diluyan el testimonio o fuercen a claudicar en principios bíblicos fundamentales.

### III. Directriz de Ejecución y Hoja de Ruta
**Paso 1 (Filtrado de Integridad):** Someter la encrucijada al examen explícito de las Escrituras y el consejo de personas maduras en la fe.
**Paso 2 (Renuncia al Autoengaño):** Identificar cualquier ambición oculta de vanagloria o avaricia y entregarla en arrepentimiento.
**Paso 3 (Acción Determinada):** Ejecutar el plan con precisión, diligencia y reposo absoluto en la Providencia divina, asumiendo cualquier costo temporal con integridad intachable.`;
  }

  // Fallback genérico de alta densidad para cualquier otra consulta de lente
  return generarFallbackLente({ passage: ref, lensTitle, lensId: rawId, prompt, verseText, ctx });
}

/**
 * Generador de respuesta profunda para las Lentes de Estudio RevelatiO IA (Compatibilidad).
 */
export function generarFallbackLente({ passage, lensTitle, lensId, prompt, verseText, ctx } = {}) {
  const ref = String(passage || ctx?.etiqueta || 'Pasaje Bíblico').trim();
  const rawTitle = String(lensTitle || lensId || 'Análisis Bíblico').trim();
  const lowerTitle = rawTitle.toLowerCase();
  const lowerId = String(lensId || '').toLowerCase();
  const lowerPrompt = String(prompt || '').toLowerCase();
  const texto = normalizarTexto(verseText || ctx?.texto || '');
  const citaTexto = texto ? ` («${texto}»)` : '';

  // 1. LENTE CRISTOCÉNTRICA & GRACIA
  if (
    lowerId.includes('cristo') ||
    lowerTitle.includes('cristo') ||
    lowerTitle.includes('gracia') ||
    lowerPrompt.includes('cristo') ||
    lowerPrompt.includes('gracia')
  ) {
    return `### 1. Exégesis y Centralidad en Cristo
Al examinar **${ref}**${citaTexto}, la revelación sagrada dirige nuestra mirada a la consumación de la obra redentora de Jesucristo (*Tetélestai*). La Escritura no es un compendio de exigencias legalistas para alcanzar favor divino por esfuerzo humano, sino el testimonio del amor del Padre manifestado en el Hijo. Este versículo deconstruye todo intento de auto-justificación religiosa, revelando que nuestra aceptación delante de Dios descansa exclusivamente en la justicia perfecta de Cristo conferida por pura gracia (*Sola Gratia*).

### 2. La Gracia Consumada y la Libertad del Mérito
En el orden del pacto eterno, la verdad proclamada en **${ref}** disuelve la culpa opresiva y el temor al castigo. Donde la mente humana tiende a levantar estructuras de mérito moralista o rendimiento espiritual, el Evangelio proclama la suficiencia del sacrificio del Cordero. Esta perspectiva purifica las motivaciones del corazón creyente, trasladándolo de la esclavitud del desempeño a la comunión viva de hijos adoptados en el Amado.

### 3. Criterio de Decisión y Reposo
Vivir bajo la luz de este pasaje implica tomar decisiones cotidianas desde la gratitud y la plenitud del reposo en Cristo, y no desde la ansiedad o la coacción. Al enfrentar encrucijadas éticas y desafíos personales, la conciencia descansada en la gracia de Dios actúa con audacia, amor abnegado y generosidad sincera, sabiendo que la victoria final ya ha sido asegurada por nuestro Salvador.`;
  }

  // 2. LENTE DE METANOIA & RENOVACIÓN MENTAL / NEUROPLASTICIDAD
  if (
    lowerId.includes('metanoia') ||
    lowerId.includes('mente') ||
    lowerTitle.includes('metanoia') ||
    lowerTitle.includes('mental') ||
    lowerTitle.includes('neuro') ||
    lowerPrompt.includes('metanoia') ||
    lowerPrompt.includes('mente') ||
    lowerPrompt.includes('pensamiento') ||
    lowerPrompt.includes('transformación') ||
    lowerPrompt.includes('neuroplasticidad')
  ) {
    return `### 1. Exégesis y Metanoia Bíblica
En **${ref}**${citaTexto}, la Palabra de Dios convoca al creyente a una profunda *metanoia*: la reorientación integral de la **mente** (*nous*) y del corazón hacia la verdad divina (Ro. 12:2). La inspiración divina mediante el **Espíritu Santo** no anula la conciencia humana, sino que ilumina el entendimiento, desarmando los sesgos cognitivos del viejo hombre y quebrantando los esquemas mentales de incredulidad y autosuficiencia.

### 2. Neuroplasticidad Espiritual y Patrones de Pensamiento
La renovación del **pensamiento** opera como una reconfiguración continua bajo la influencia del **Espíritu**. Al sustituir la rumiación ansiosa y los patrones de **pensamiento** tóxicos por la meditación asidua en la verdad revelada, la **mente** experimenta una transformación real y tangible. Esta plasticidad espiritual entrena las facultades interiores para someter todo argumento a la obediencia de Cristo, cultivando sobriedad y discernimiento espiritual en el alma.

### 3. Ortopraxis y Disciplina del Entendimiento
Para el día a día, este pasaje exige gobernar los pensamientos con discernimiento bíblico antes de reaccionar impulsivamente. La transformación de la **mente** por el **Espíritu** capacita al creyente para comprobar la buena voluntad de Dios —agradable y perfecta—, decidiendo con prudencia, paz interior y sabiduría celestial frente a cualquier dilema ético o circunstancial.`;
  }

  // 3. LENTE DE PAZ & ALIVIO EN CRISIS
  if (
    lowerId.includes('paz') ||
    lowerId.includes('crisis') ||
    lowerTitle.includes('paz') ||
    lowerTitle.includes('crisis') ||
    lowerTitle.includes('alivio') ||
    lowerTitle.includes('consuelo') ||
    lowerPrompt.includes('paz') ||
    lowerPrompt.includes('crisis') ||
    lowerPrompt.includes('sufrimiento')
  ) {
    return `### 1. Consuelo Pastoral y Soberanía en la Aflicción
En momentos de turbación o incertidumbre, **${ref}**${citaTexto} ofrece un anclaje inamovible para el alma. El texto sagrado atestigua que Dios gobierna providencialmente todas las circunstancias y que su amor inmutable (*Hesed*) sostiene a su pueblo en medio del valle de sombra. No estamos a merced del azar o de las fuerzas caóticas de este mundo, sino en las manos soberanas de un Padre compasivo.

### 2. El Shalom de Dios frente a la Ansiedad
La paz que brota de este pasaje (*Shalom*) no es una mera ausencia pasiva de conflicto, sino la presencia sustentadora de Dios que custodia el corazón y los pensamientos. Al depositar la angustia en la fidelidad del Señor mediante la oración y el reposo en su promesa, el creyente es liberado de la parálisis del miedo y de la desesperación reactiva.

### 3. Criterio de Decisión y Quietud Espiritual
El principio pastoral derivado de **${ref}** es categórico: prohibido tomar decisiones trascendentales en estado de pánico o agitación emocional. Confiando en que el Señor proveerá y guiará con mano diestra, el creyente aprende a esperar con paciencia santa, evaluando sus pasos con calma y cimentando cada determinación en la roca inconmovible de las promesas de Dios.`;
  }

  // 4. LENTE DE HÁBITOS & VIDA PRÁCTICA
  if (
    lowerId.includes('habito') ||
    lowerId.includes('vida') ||
    lowerTitle.includes('hábito') ||
    lowerTitle.includes('habito') ||
    lowerTitle.includes('práctica') ||
    lowerTitle.includes('practica') ||
    lowerTitle.includes('ética') ||
    lowerTitle.includes('etica') ||
    lowerPrompt.includes('hábito') ||
    lowerPrompt.includes('vida')
  ) {
    return `### 1. Mandato Bíblico y Ética del Reino
La revelación de **${ref}**${citaTexto} traslada la doctrina pura al terreno concreto de la vida cotidiana. La fe bíblica no se recluye en conceptos abstractos, sino que demanda una encarnación visible en el testimonio diario: en la administración del tiempo, la mayordomía financiera, la integridad profesional y la honestidad en el trato interpersonal.

### 2. Formación de Hábitos y Disciplinas Espirituales
El carácter piadoso se forja a través de la práctica constante y perseverante de las disciplinas cristianas. Este pasaje nos convoca a estructurar rutinas que reflejen el señorío de Cristo: devoción personal, veracidad en la palabra empeñada, diligencia en el trabajo y cuidado sacrificial del prójimo en el seno del hogar y la comunidad de fe.

### 3. Ortopraxis para la Vida Cotidiana
Aplicar la verdad de **${ref}** el lunes por la mañana exige decisiones claras y específicas: alinear las prioridades del día con la justicia del Reino de Dios, desechar la pereza y el compromiso mundano, y actuar con excelencia y humildad en cada tarea ordinaria, realizándolo todo para la gloria suprema de Dios.`;
  }

  // 5. LENTE CANÓNICA & REINO DE DIOS
  if (
    lowerId.includes('canon') ||
    lowerId.includes('reino') ||
    lowerId.includes('pacto') ||
    lowerTitle.includes('canónica') ||
    lowerTitle.includes('canonica') ||
    lowerTitle.includes('reino') ||
    lowerTitle.includes('pacto') ||
    lowerPrompt.includes('canon') ||
    lowerPrompt.includes('pacto')
  ) {
    return `### 1. Marco Histórico-Redentor y Teología del Pacto
Al situar **${ref}**${citaTexto} dentro de la totalidad del canon de las Sagradas Escrituras, contemplamos el despliegue armónico del pacto eterno de Dios. El pasaje se articula dentro de la gran narrativa bíblica de Creación, Caída, Redención en Cristo y Consumación final, evidenciando que cada texto canónico converge orgánicamente en el propósito salvífico divino.

### 2. El Reino de Dios y Cumplimiento Profético
Las figuras, promesas y advertencias contenidas en este pasaje encuentran su sustancia y cumplimiento culminante en la persona y reino de nuestro Señor Jesucristo. La continuidad de los pactos bíblicos confirma la fidelidad inquebrantable de Dios a su pueblo, demostrando que su designio soberano jamás ha sufrido retroceso a lo largo de las dispensaciones de la historia redentora.

### 3. Horizonte Escatológico y Esperanza Presente
Comprender este pasaje en su horizonte canónico impulsa a la Iglesia a vivir hoy como embajadora del Reino venidero. La esperanza escatológica de la renovación de todas las cosas inspira una fe activa y vigilante, sosteniendo la fidelidad del creyente en el presente mientras aguarda la gloriosa manifestación de nuestro Dios y Salvador.`;
  }

  // LENTE DINÁMICA UNIVERSAL
  return `### 1. Exégesis Bíblica y Centralidad Doctrinal
El análisis de **${ref}**${citaTexto} bajo la perspectiva de "${rawTitle}" expone con precisión la riqueza del texto sagrado. La verdad revelada ancla nuestra fe en la revelación de Dios y la obra redentora de Jesucristo, derribando los esquemas superficiales del pensamiento humano para edificar la vida en la roca inmutable de las Escrituras.

### 2. Metanoia y Renovación del Pensamiento
Bajo la iluminación del Espíritu Santo, este pasaje instruye al entendimiento en la renovación continua de la **mente** y del **pensamiento**. El creyente es desafiado a confrontar las inclinaciones del corazón con la verdad del Evangelio, aprendiendo a discernir con madurez espiritual la voluntad de Dios y descansando en su gracia soberana.

### 3. Criterio de Decisión y Aplicación Práctica
La aplicación directa de este principio bíblico orienta la toma de decisiones hacia una vida de santidad, servicio desinteresado y testimonio fiel. Caminar conforme a este pasaje implica alinear los afectos y acciones con el propósito divino, glorificando a Dios en cada aspecto de la existencia cotidiana.`;
}

/**
 * Generador de comentario clásico profundo para autores representativos.
 */
export function generarFallbackComentario({ passage, author, verseText, ctx } = {}) {
  const ref = String(passage || ctx?.etiqueta || 'Pasaje Bíblico').trim();
  const voz = String(author || 'C. H. Spurgeon').trim();
  const lowerAuthor = voz.toLowerCase();
  const texto = normalizarTexto(verseText || ctx?.texto || '');
  const citaTexto = texto ? ` («${texto}»)` : '';

  // 1. JUAN CALVINO
  if (lowerAuthor.includes('calvino') || lowerAuthor.includes('calvin')) {
    return `### Comentario Exegético y Doctrinal — Juan Calvino

En la exposición de **${ref}**${citaTexto}, es indispensable atenerse con rigor a la intención del autor sagrado y al contexto histórico-gramatical del texto. El Espíritu Santo no emplea palabras superfluas; antes bien, cada expresión está ordenada para instruir nuestra fe y despojar al ser humano de toda presunción vana. La verdadera sabiduría consiste en someter nuestro juicio a la autoridad de la Escritura sin pretender imponer especulaciones humanas a los oráculos divinos.

La doctrina central que aquí resplandece es la soberanía incondicional de Dios frente a la hipocresía y debilidad del corazón humano. Toda justicia y mérito propios quedan reducidos a cenizas ante la majestad del Creador. Somos justificados gratuitamente por la fe en Jesucristo, y es de esta fuente viva de gracia de donde brota la genuina piedad y obediencia que Dios aprueba en su Iglesia.

El uso pedagógico de este pasaje exhorta a la comunidad de los fieles a preservar la pureza del Evangelio y la disciplina espiritual. Quienes han sido regenerados por la gracia divina son llamados a caminar con rectitud, evitando la vana complacencia del mundo y rindiendo gloria únicamente a Aquel que nos llamó de las tinieblas a su luz admirable.`;
  }

  // 2. MATTHEW HENRY
  if (lowerAuthor.includes('matthew') || lowerAuthor.includes('henry')) {
    return `### Exposición Devocional y Práctica — Matthew Henry

**I. Ocasión histórica y sentido de las palabras:**
Al considerar **${ref}**${citaTexto}, contemplamos con reverencia cómo la providencia de Dios dispone todas las circunstancias para instrucción provechosa de su pueblo. Las Sagradas Escrituras retratan con fidelidad la condición del alma humana y nos muestran la inagotable paciencia y sabiduría con que el Señor trata a los suyos en cada etapa de la historia.

**II. Doctrinas prácticas y gobierno providencial:**
Aprendemos de este texto que la verdadera bienaventuranza consiste en buscar la dirección del cielo y deleitarse en la voluntad divina. La gracia del Señor no solo perdona nuestras transgresiones pasadas, sino que renueva nuestras inclinaciones, enseñándonos a discernir los deberes del día y a descansar confiadamente bajo la sombra protectora del Altísimo.

**III. Aplicación y consuelo para la fe cotidiana:**
Que este testimonio sagrado anime a los creyentes a perseverar en la oración ferviente y en la fidelidad cotidiana. Aun cuando las tormentas de la vida amenacen nuestra tranquilidad, la promesa de Dios permanece firme: Él sostendrá con su diestra a cuantos confían sinceramente en su gracia y caminan con humildad delante de su presencia.`;
  }

  // 3. JOHN GILL
  if (lowerAuthor.includes('gill')) {
    return `### Exposición Crítica y Doctrinal — John Gill

Al examinar con precisión erudita **${ref}**${citaTexto}, los vocablos empleados en el texto original (hebreo o griego) arrojan una luz incomparable sobre la economía divina de la salvación. Las raíces gramaticales y la construcción sintáctica del versículo confirman la infalibilidad y coherencia perfecta del testimonio de las Sagradas Escrituras.

La soberanía de la gracia y la certeza del pacto eterno constituyen el fundamento inalterable de la doctrina aquí manifestada. La elección divina en Cristo y la eficacia de su redención no dependen del libre albedrío ni de las obras meritorias del hombre caído, sino del beneplácito eterno de la voluntad de Dios, quien realiza todas las cosas según el designio inmutable de su consejo.

Esta verdad armoniza de manera admirable con todo el cuerpo canónico de la Escritura. Los profetas del Antiguo Testamento y los apóstoles de la Nueva Alianza testifican unánimemente que la salvación pertenece al Señor, convocando a los elegidos a glorificar a la bendita Trinidad por su inmerecida y eterna misericordia.`;
  }

  // 4. JAMIESON-FAUSSET-BROWN
  if (lowerAuthor.includes('jamieson') || lowerAuthor.includes('fausset') || lowerAuthor.includes('jfb') || lowerAuthor.includes('brown')) {
    return `### Comentario Crítico, Experimental y Explicativo — Jamieson-Fausset-Brown

**1. Análisis Crítico-Gramatical:**
En **${ref}**${citaTexto}, el análisis minucioso de las raíces en el idioma original resalta la fuerza expresiva de la terminología bíblica. El vocabulario empleado por el escritor sagrado puntualiza el sentido literal con exactitud e ilustra el trasfondo cultural y teológico del pasaje.

**2. Contexto Histórico y Paralelos Textuales:**
El pasaje se engarza orgánicamente dentro de la secuencia del libro sagrado, manteniendo una estricta coherencia doctrinal con los demás textos paralelos del canon bíblico. La revelación progresiva confirma aquí la fidelidad del plan redentor de Dios a través de las edades.

**3. Síntesis Exegética y Lección Práctica:**
La enseñanza fundamental del texto apela tanto al intelecto como al corazón del creyente: exige un discernimiento espiritual genuino y rechaza el formalismo religioso, instando a fundamentar la fe viva en el conocimiento sólido de la verdad revelada.`;
  }

  // 5. C. H. SPURGEON (Default)
  return `### Exposición Pastoral en el Tabernáculo Metropolitano — C. H. Spurgeon

Al contemplar con asombro reverente las palabras de **${ref}**${citaTexto}, el corazón del predicador arde con el fuego del Evangelio. ¡Cuán claramente se manifiesta aquí el contraste entre la ceguera humana y la gloriosa revelación de la gracia divina! Los hombres son veloces para juzgar las apariencias temporales, pero ¡ay!, cuán lentos son sus corazones para discernir los tiempos de la bendita visitación de Dios.

Este texto sagrado nos toma de la mano y nos conduce con urgencia irresistible hacia la persona y obra de nuestro Señor Jesucristo. En Él, y solo en Él, se hallan todos los tesoros de la sabiduría y del perdón. Su sangre bendita limpia la mancha más oscura de pecado, y su amor sin límites acoge al pecador arrepentido que acude con las manos vacías para recibir el don inefable de la vida eterna.

¡Oh, alma cansada que lees estas líneas, no te conformes con una religión de ritos vacíos o palabras fingidas! Rinde hoy tu voluntad a los pies del Salvador de la gloria. Cree en su palabra todopoderosa, refúgiate en su gracia inagotable y comprobarás que el Señor es tu fortaleza, tu cántico y tu salvación eterna. Amén.`;
}

/**
 * Generador de árbol de referencias cruzadas canónicas (TSK).
 */
export async function generarFallbackTsk({ passage, verseText, ctx } = {}) {
  const ref = String(passage || ctx?.etiqueta || 'Pasaje Bíblico').trim();
  const texto = normalizarTexto(verseText || ctx?.texto || '');

  try {
    if (texto) {
      const paralelos = await paralelosReales(texto, { excludeRef: ref }).catch(() => []);
      if (paralelos.length) {
        return formatearTsk(ctx || { etiqueta: ref, texto }, paralelos);
      }
    }
  } catch { /* continuar a síntesis canónica */ }

  return `### Referencias Cruzadas Canónicas (TSK) para ${ref}
${texto ? `*Texto canónico:* «${texto}»\n` : ''}
- **Romanos 12:2**
  «No os conforméis a este siglo, sino transformaos por medio de la renovación de vuestro entendimiento, para que comprobéis cuál sea la buena voluntad de Dios, agradable y perfecta.»
  — Conexión: Renovación de la mente, discernimiento de la soberanía divina y ortopraxis.

- **Efesios 4:23-24**
  «Y renovaos en el espíritu de vuestra mente, y vestíos del nuevo hombre, creado según Dios en la justicia y santidad de la verdad.»
  — Conexión: Regeneración por el Espíritu y santificación del entendimiento en Cristo.

- **Filipenses 4:7-8**
  «Y la paz de Dios, que sobrepasa todo entendimiento, guardará vuestros corazones y vuestros pensamientos en Cristo Jesús.»
  — Conexión: El reposo del corazón y el gobierno de los pensamientos bajo la gracia.

- **2 Timoteo 3:16-17**
  «Toda la Escritura es inspirada por Dios, y útil para enseñar, para redargüir, para corregir, para instruir en justicia...»
  — Conexión: Autoridad canónica inerrante y suficiencia de la revelación de Dios.

- **Hebreos 4:12**
  «Porque la palabra de Dios es viva y eficaz, y más cortante que toda espada de dos filos; y penetra hasta partir el alma y el espíritu...»
  — Conexión: El poder transformador de la Palabra sobre los pensamientos y afectos.`;
}

/**
 * Generador de Léxico Strong en español.
 */
export function generarFallbackLexico({ passage, ctx } = {}) {
  const ref = String(passage || ctx?.etiqueta || 'el pasaje').trim();
  if (ctx && Array.isArray(ctx.strongs) && ctx.strongs.length > 0) {
    return formatearLexico(ctx);
  }

  return `**Léxico Strong de ${ref}** (Traducido al español)

1. **G3341** · μετάνοια (*metánoia*)
   **Glosa ES:** Cambio de mente, reorientación del entendimiento, conversión espiritual profunda.
   **Definición:** Transformación interior del pensamiento y de la voluntad bajo la iluminación divina.
   **Fuente:** Strong · Dominio público

2. **G3563** · νοῦς (*nous*)
   **Glosa ES:** Mente, intelecto, entendimiento, facultad de discernimiento moral y espiritual.
   **Definición:** Capacidad reflexiva y consciente gobernada por la verdad o entenebrecida por el pecado.
   **Fuente:** Strong · Dominio público

3. **G5485** · χάρις (*cháris*)
   **Glosa ES:** Gracia, favor inmerecido, benevolencia divina, don gratuito de salvación.
   **Definición:** La bondad soberana de Dios derramada sobre los pecadores a través de Jesucristo.
   **Fuente:** Strong · Dominio público

4. **G4151** · πνεῦμα (*pneûma*)
   **Glosa ES:** Espíritu, viento, aliento de vida, el Espíritu Santo de Dios.
   **Definición:** El poder regenerador y santificador de la tercera persona de la Trinidad.
   **Fuente:** Strong · Dominio público`;
}

/**
 * Generador de Concordancia Bíblica y Temática Exhaustiva (Término / Pasaje).
 */
export function generarFallbackConcordancia({ keyword, passage, verseText, ctx } = {}) {
  const rawKeyword = String(keyword || '').trim();
  const lowerKeyword = rawKeyword.toLowerCase();
  const ref = String(passage || ctx?.etiqueta || 'Pasaje Bíblico').trim();
  const texto = normalizarTexto(verseText || ctx?.texto || '');

  // A. CONCORDANCIA POR TÉRMINO CLAVE
  if (rawKeyword && lowerKeyword !== ref.toLowerCase()) {
    // 1. GRACIA
    if (lowerKeyword.includes('gracia') || lowerKeyword.includes('charis') || lowerKeyword.includes('jen')) {
      return `### Concordancia Bíblica Exhaustiva: «Gracia»

### 1. Significado y Raíz Teológica
- **Hebreo:** חֵן (*jēn*, Strong H2580) — Favor inmerecido, misericordia entrañable, inclinación benevolente del superior hacia el inferior.
- **Griego:** χάρις (*cháris*, Strong G5485) — Don gratuito y soberano de salvación concedido sin mérito alguno por Dios al pecador mediante la obra perfecta de Jesucristo (*Sola Gratia*).
- **Sentido Doctrinal:** La gracia divina no es una mera ayuda para complementar las fuerzas humanas, sino la causa eficiente y única de la regeneración, justificación y preservación del creyente en el pacto eterno.

### 2. Frecuencia y Distribución Canónica
- **Ocurrencias totales:** Aproximadamente 170 apariciones directas en el texto bíblico.
- **Antiguo Testamento:** ~39 ocasiones (predominante en Génesis, Éxodo y Salmos bajo la manifestación del pacto y el favor divino).
- **Nuevo Testamento:** ~131 ocasiones (máxima concentración en el corpus paulino: Romanos [24 veces], Efesios [12 veces], Gálatas y las Epístolas Pastorales).

### 3. Pasajes Canónicos Clave
1. **Efesios 2:8-9** — «Porque por gracia sois salvos por medio de la fe; y esto no de vosotros, pues es don de Dios; no por obras, para que nadie se gloríe.»
2. **Romanos 3:24** — «Siendo justificados gratuitamente por su gracia, mediante la redención que es en Cristo Jesús.»
3. **Juan 1:16-17** — «Porque de su plenitud tomamos todos, y gracia sobre gracia. Pues la ley por medio de Moisés fue dada, pero la gracia y la verdad vinieron por medio de Jesucristo.»
4. **Tito 2:11** — «Porque la gracia de Dios se ha manifestado para salvación a todos los hombres.»
5. **2 Corintios 12:9** — «Y me ha dicho: Bástate mi gracia; porque mi poder se perfecciona en la debilidad. Por tanto, de buena gana me gloriaré más bien en mis debilidades, para que repose sobre mí el poder de Cristo.»
6. **Éxodo 34:6** — «¡Jehová! ¡Jehová! fuerte, misericordioso y piadoso; tardo para la ira, y grande en misericordia y verdad.»
7. **Romanos 5:20-21** — «Mas cuando el pecado abundó, sobreabundó la gracia; para que así como el pecado reinó para muerte, así también la gracia reine por la justicia para vida eterna mediante Jesucristo Señor nuestro.»`;
    }

    // 2. FE / JUSTIFICACIÓN
    if (lowerKeyword.includes('fe') || lowerKeyword.includes('pistis') || lowerKeyword.includes('creer') || lowerKeyword.includes('justific')) {
      return `### Concordancia Bíblica Exhaustiva: «Fe y Justificación»

### 1. Significado y Raíz Teológica
- **Hebreo:** אֱמוּנָה (*emunáh*, Strong H530) — Firmeza, estabilidad moral, fidelidad incondicional a las promesas de Dios.
- **Griego:** πίστις (*pístis*, Strong G4102) / δικαιόω (*dikaioō*, Strong G1344) — Certeza inconmovible y adhesión salvífica a la verdad revelada; declaración forense mediante la cual Dios imputa la justicia de Cristo al creyente.
- **Sentido Doctrinal:** La fe no es la causa meritoria de la salvación, sino el instrumento receptor (*organon leptikon*) a través del cual el pecador es vestido de la justicia ajena y perfecta de Jesucristo.

### 2. Frecuencia y Distribución Canónica
- **Ocurrencias totales:** Más de 270 apariciones en el Nuevo Testamento y decenas de formulaciones fundamentales en la Torá y los Profetas.
- **Antiguo Testamento:** Eje central en la narrativa patriarcal (Génesis 15:6) y la teología profética (Habacuc 2:4).
- **Nuevo Testamento:** Densidad culminante en Romanos (más de 40 veces), Gálatas, Hebreos 11 y las cartas pastorales.

### 3. Pasajes Canónicos Clave
1. **Hebreos 11:1** — «Es, pues, la fe la certeza de lo que se espera, la convicción de lo que no se ve.»
2. **Romanos 5:1** — «Justificados, pues, por la fe, tenemos paz para con Dios por medio de nuestro Señor Jesucristo.»
3. **Romanos 1:17** — «Porque en el evangelio la justicia de Dios se revela por fe y para fe, como está escrito: Mas el justo por la fe vivirá.»
4. **Génesis 15:6** — «Y creyó a Jehová, y le fue contado por justicia.»
5. **Gálatas 2:16** — «Sabiendo que el hombre no es justificado por las obras de la ley, sino por la fe de Jesucristo, nosotros también hemos creído en Jesucristo, para ser justificados por la fe de Cristo y no por las obras de la ley.»
6. **Romanos 10:17** — «Así que la fe es por el oír, y el oír, por la palabra de Dios.»
7. **2 Corintios 5:21** — «Al que no conoció pecado, por nosotros lo hizo pecado, para que nosotros fuésemos hechos justicia de Dios en él.»`;
    }

    // 3. METANOIA / ARREPENTIMIENTO / MENTE
    if (lowerKeyword.includes('metanoia') || lowerKeyword.includes('arrepent') || lowerKeyword.includes('mente') || lowerKeyword.includes('renova')) {
      return `### Concordancia Bíblica Exhaustiva: «Metanoia (Renovación Mental)»

### 1. Significado y Raíz Teológica
- **Griego:** μετάνοια (*metánoia*, Strong G3341) — Cambio profundo de mente, entendimiento y dirección de vida producido por la obra regeneradora del Espíritu Santo.
- **Hebreo:** שׁוּב (*shuv*, Strong H7725) — Volverse, retornar con todo el corazón a la comunión y pacto con Dios.
- **Sentido Doctrinal:** No consiste en un mero remordimiento emocional pasajero (*metamelomai*), sino en una reestructuración de la cosmovisión, afectos y voluntad bajo la luz soberana de la Palabra de Dios.

### 2. Frecuencia y Distribución Canónica
- **Ocurrencias totales:** ~58 apariciones directas de *metanoia/metanoeo* en el NT y más de 1050 usos de *shuv* en el AT.
- **Antiguo Testamento:** Frecuente en los llamados proféticos (Jeremías, Ezequiel, Isaías, Oseas).
- **Nuevo Testamento:** Mensaje inaugural de Juan el Bautista, de Jesucristo (Evangelios sinópticos), sermones de Hechos y epístolas apostólicas.

### 3. Pasajes Canónicos Clave
1. **Romanos 12:2** — «No os conforméis a este siglo, sino transformaos por medio de la renovación de vuestro entendimiento, para que comprobéis cuál sea la buena voluntad de Dios, agradable y perfecta.»
2. **Marcos 1:15** — «Diciendo: El tiempo se ha cumplido, y el reino de Dios se ha acercado; arrepentíos, y creed en el evangelio.»
3. **Hechos 2:38** — «Pedro les dijo: Arrepentíos, y bautícese cada uno de vosotros en el nombre de Jesucristo para perdón de los pecados; y recibiréis el don del Espíritu Santo.»
4. **2 Corintios 7:10** — «Porque la tristeza que es según Dios produce arrepentimiento para salvación, de que no hay que arrepentirse; pero la tristeza del mundo produce muerte.»
5. **Efesios 4:22-24** — «En cuanto a la pasada manera de vivir, despojaos del viejo hombre... y renovaos en el espíritu de vuestra mente, y vestíos del nuevo hombre, creado según Dios en la justicia y santidad de la verdad.»
6. **Ezequiel 18:30-32** — «Convertíos, y apartaos de todas vuestras transgresiones... y haceos un corazón nuevo y un espíritu nuevo.»
7. **Hechos 17:30** — «Pero Dios, habiendo pasado por alto los tiempos de esta ignorancia, ahora manda a todos los hombres en todo lugar, que se arrepientan.»`;
    }

    // 4. AMOR / HESED / ÁGAPE
    if (lowerKeyword.includes('amor') || lowerKeyword.includes('agape') || lowerKeyword.includes('hesed') || lowerKeyword.includes('misericordia')) {
      return `### Concordancia Bíblica Exhaustiva: «Amor y Misericordia de Pacto»

### 1. Significado y Raíz Teológica
- **Hebreo:** חֶסֶד (*jésed*, Strong H2617) — Amor leal, fidelidad inquebrantable de pacto, misericordia constante y soberana.
- **Griego:** ἀγάπη (*agápē*, Strong G26) — Amor divino incondicional, sacrificial, perfecto y eterno manifestado en la entrega del Hijo de Dios.
- **Sentido Doctrinal:** El amor de Dios no depende de la dignidad o mérito del objeto amado, sino de la naturaleza bondadosa y eterna del Creador que guarda su pacto por mil generaciones.

### 2. Frecuencia y Distribución Canónica
- **Ocurrencias totales:** Más de 500 apariciones de términos de amor y misericordia en todo el canon.
- **Antiguo Testamento:** ~250 menciones de *jésed* (destacando en Salmos, Lamentaciones e Isaías).
- **Nuevo Testamento:** ~260 menciones de *agápē/agapaō* (con cumbre teológica en el Evangelio y Cartas de Juan, 1 Corintios 13 y Romanos 8).

### 3. Pasajes Canónicos Clave
1. **1 Juan 4:8-10** — «El que no ama, no ha conocido a Dios; porque Dios es amor... En esto consiste el amor: no en que nosotros hayamos amado a Dios, sino en que él nos amó a nosotros, y envió a su Hijo en propiciación por nuestros pecados.»
2. **Juan 3:16** — «Porque de tal manera amó Dios al mundo, que ha dado a su Hijo unigénito, para que todo aquel que en él cree, no se pierda, mas tenga vida eterna.»
3. **Romanos 5:8** — «Mas Dios muestra su amor para con nosotros, en que siendo aún pecadores, Cristo murió por nosotros.»
4. **1 Corintios 13:4-7** — «El amor es sufrido, es benigno; el amor no tiene envidia, el amor no es jactancioso, no se envanece; no hace nada indebido, no busca lo suyo, no se irrita, no guarda rencor...»
5. **Jeremías 31:3** — «Jehová se manifestó a mí hace ya mucho tiempo, diciendo: Con amor eterno te he amado; por tanto, te prolongué mi misericordia.»
6. **Romanos 8:38-39** — «Por lo cual estoy seguro de que ni la muerte, ni la vida... ni ninguna otra cosa creada nos podrá separar del amor de Dios, que es en Cristo Jesús Señor nuestro.»
7. **Salmos 103:8-11** — «Misericordioso y clemente es Jehová; Lento para la ira, y grande en misericordia... Porque como la altura de los cielos sobre la tierra, engrandeció su misericordia sobre los que le temen.»`;
    }

    // 5. PAZ / SHALOM / REPOSO
    if (lowerKeyword.includes('paz') || lowerKeyword.includes('shalom') || lowerKeyword.includes('reposo') || lowerKeyword.includes('consuelo')) {
      return `### Concordancia Bíblica Exhaustiva: «Paz (Shalom)»

### 1. Significado y Raíz Teológica
- **Hebreo:** שָׁלוֹם (*shalom*, Strong H7965) — Plenitud, integridad, bienestar total, salud del alma y armonía reconciliada con Dios.
- **Griego:** εἰρήνη (*eirēnē*, Strong G1515) — Estado de reconciliación y tranquilidad espiritual derivado de la justificación en Cristo.
- **Sentido Doctrinal:** La paz bíblica no es mera ausencia temporal de conflicto exterior, sino el reposo firme de la conciencia limpiada por la sangre del Cordero y anclada en la Providencia divina.

### 2. Frecuencia y Distribución Canónica
- **Ocurrencias totales:** ~250 menciones en el AT y ~90 en el NT.
- **Antiguo Testamento:** Promesas mesiánicas del Príncipe de Paz (Isaías 9:6, Números 6:26, Salmos 29:11).
- **Nuevo Testamento:** Saludos apostólicos de gracia y paz, promesas del Señor Jesús (Juan 14:27) y exhortaciones pastorales.

### 3. Pasajes Canónicos Clave
1. **Filipenses 4:6-7** — «Por nada estéis afanosos, sino sean conocidas vuestras peticiones delante de Dios en toda oración y ruego, con acción de gracias. Y la paz de Dios, que sobrepasa todo entendimiento, guardará vuestros corazones y vuestros pensamientos en Cristo Jesús.»
2. **Romanos 5:1** — «Justificados, pues, por la fe, tenemos paz para con Dios por medio de nuestro Señor Jesucristo.»
3. **Juan 14:27** — «La paz os dejo, mi paz os doy; yo no os la doy como el mundo la da. No se turbe vuestro corazón, ni tenga miedo.»
4. **Isaías 26:3** — «Tú guardarás en completa paz a aquel cuyo pensamiento en ti persevera; porque en ti ha confiado.»
5. **Colosenses 3:15** — «Y la paz de Dios gobierne en vuestros corazones, a la que asimismo fuisteis llamados en un solo cuerpo; y sed agradecidos.»
6. **Efesios 2:14** — «Porque él es nuestra paz, que de ambos pueblos hizo uno, derribando la pared intermedia de separación.»
7. **Salmos 85:10** — «La misericordia y la verdad se encontraron; la justicia y la paz se besaron.»`;
    }

    // TÉRMINO DINÁMICO UNIVERSAL
    const terminoCap = rawKeyword.charAt(0).toUpperCase() + rawKeyword.slice(1);
    return `### Concordancia Bíblica Exhaustiva: «${terminoCap}»

### 1. Significado y Raíz Teológica
- **Traducción y Etimología:** Estudio del vocablo «${terminoCap}» en su raíz canónica bíblica (idiomas originales hebreo, arameo y griego).
- **Connotación Exegética:** El término articula un aspecto sustantivo de la revelación de Dios, vinculando la instrucción de la Ley, la proclamación de los Profetas y el cumplimiento cristológico en el Nuevo Pacto.
- **Doctrina:** La Escritura emplea este concepto para manifestar el carácter santo de Dios, la redención en Jesucristo y la transformación del pueblo del pacto.

### 2. Frecuencia y Distribución Canónica
- **Distribución en el Canon:** Presente a lo largo de los libros históricos, poéticos, proféticos, evangelios y cartas apostólicas.
- **Antiguo Testamento:** Establece el fundamento teológico mediante las promesas y figuras del pacto.
- **Nuevo Testamento:** Encuentra su plenitud exegética en el testimonio de Jesucristo y la edificación de la Iglesia.

### 3. Pasajes Canónicos Clave
1. **Salmos 119:105** — «Lámpara es a mis pies tu palabra, y lumbrera a mi camino.»
2. **Romanos 12:2** — «No os conforméis a este siglo, sino transformaos por medio de la renovación de vuestro entendimiento, para que comprobéis cuál sea la buena voluntad de Dios, agradable y perfecta.»
3. **Juan 14:6** — «Jesús le dijo: Yo soy el camino, y la verdad, y la vida; nadie viene al Padre, sino por mí.»
4. **2 Timoteo 3:16-17** — «Toda la Escritura es inspirada por Dios, y útil para enseñar, para redargüir, para corregir, para instruir en justicia, a fin de que el hombre de Dios sea perfecto, enteramente preparado para toda buena obra.»
5. **Efesios 2:8-10** — «Porque por gracia sois salvos por medio de la fe; y esto no de vosotros, pues es don de Dios; no por obras, para que nadie se gloríe. Porque somos hechura suya, creados en Cristo Jesús para buenas obras...»
6. **Hebreos 4:12** — «Porque la palabra de Dios es viva y eficaz, y más cortante que toda espada de dos filos; y penetra hasta partir el alma y el espíritu, las coyunturas y los tuétanos, y discierne los pensamientos y las intenciones del corazón.»
7. **1 Pedro 1:24-25** — «Porque: Toda carne es como hierba, y toda la gloria del hombre como flor de la hierba. La hierba se seca, y la flor se cae; mas la palabra del Señor permanece para siempre.»`;
  }

  // B. CONCORDANCIA POR PASAJE (4 Conceptos Doctrinales Clave)
  const lowerRef = ref.toLowerCase();

  // Caso específico: Romanos 12:2
  if (lowerRef.includes('romanos 12') || lowerRef.includes('ro 12') || lowerRef.includes('ro. 12')) {
    return `### Concordancia Doctrinal y Temática de ${ref}
${texto ? `*Texto canónico:* «${texto}»\n` : ''}
### 1. Metanoia y Renovación del Entendimiento (*Nous / Metamorphoō*)
- **Significado:** Transformación interior radical del entendimiento humano gobernado por el Espíritu Santo.
- **Frecuencia bíblica:** ~58 apariciones de términos de arrepentimiento/mente (*nous*) en el Nuevo Testamento.
- **Tres versículos paralelos fundamentales:**
  1. **Efesios 4:23-24** — «Y renovaos en el espíritu de vuestra mente, y vestíos del nuevo hombre, creado según Dios en la justicia y santidad de la verdad.»
  2. **Colosenses 3:10** — «Y revestido del nuevo, el cual conforme a la imagen del que lo creó se va renovando hasta el conocimiento pleno.»
  3. **Tito 3:5** — «Nos salvó, no por obras de justicia que nosotros hubiéramos hecho, sino por su misericordia, por el lavamiento de la regeneración y por la renovación en el Espíritu Santo.»

### 2. No Conformidad con el Presente Siglo Malo (*Aión / Syschēmatizō*)
- **Significado:** Rechazo frontal a los moldes, sesgos cognitivos y filosofías autosuficientes del mundo caído.
- **Frecuencia bíblica:** Más de 100 menciones sobre el contraste entre este siglo y el Reino venidero.
- **Tres versículos paralelos fundamentales:**
  1. **1 Juan 2:15-17** — «No améis al mundo, ni las cosas que están en el mundo. Si alguno ama al mundo, el amor del Padre no está en él.»
  2. **Gálatas 1:4** — «El cual se dio a sí mismo por nuestros pecados para librarnos del presente siglo malo, conforme a la voluntad de nuestro Dios y Padre.»
  3. **Santiago 4:4** — «¿No sabéis que la amistad del mundo es enemistad contra Dios? Cualquiera, pues, que quiera ser amigo del mundo, se constituye enemigo de Dios.»

### 3. La Buena, Agradable y Perfecta Voluntad de Dios (*Thelēma*)
- **Significado:** El propósito soberano y redentor del Señor, revelado en su Palabra para guiar la conciencia.
- **Frecuencia bíblica:** ~62 veces en las epístolas del Nuevo Testamento.
- **Tres versículos paralelos fundamentales:**
  1. **1 Tesalonicenses 4:3** — «Pues la voluntad de Dios es vuestra santificación: que os apartéis de fornicación.»
  2. **Efesios 5:17** — «Por tanto, no seáis insensatos, sino entendidos de cuál sea la voluntad del Señor.»
  3. **Salmos 143:10** — «Enséñame a hacer tu voluntad, porque tú eres mi Dios; tu buen espíritu me guíe a tierra de rectitud.»

### 4. La Gracia y el Culto Racional (*Logikē Latreia*)
- **Significado:** Consagración de la vida entera como sacrificio vivo en respuesta agradecida a las misericordias de Dios.
- **Frecuencia bíblica:** Presente en todo el sistema sacrificial del AT y consumado en la cristología del NT.
- **Tres versículos paralelos fundamentales:**
  1. **1 Pedro 2:5** — «Vosotros también, como piedras vivas, sed edificados como casa espiritual y sacerdocio santo, para ofrecer sacrificios espirituales aceptables a Dios por medio de Jesucristo.»
  2. **Hebreos 13:15-16** — «Así que, ofrezcamos siempre a Dios, por medio de él, sacrificio de alabanza, es decir, fruto de labios que confiesan su nombre.»
  3. **Filipenses 3:3** — «Porque nosotros somos la circuncisión, los que en espíritu servimos a Dios y nos gloriamos en Cristo Jesús, no teniendo confianza en la carne.»`;
  }

  // Caso específico: Mateo 16
  if (lowerRef.includes('mateo 16') || lowerRef.includes('mt 16') || lowerRef.includes('mt. 16')) {
    return `### Concordancia Doctrinal y Temática de ${ref}
${texto ? `*Texto canónico:* «${texto}»\n` : ''}
### 1. Discernimiento Espiritual frente al Formalismo (*Diakrinō*)
- **Significado:** Capacidad otorgada por Dios para evaluar los tiempos históricos y las realidades del Reino con ojos de fe.
- **Frecuencia bíblica:** ~30 menciones directas en los Evangelios y Epístolas paulinas.
- **Tres versículos paralelos fundamentales:**
  1. **1 Corintios 2:14-15** — «Pero el hombre natural no percibe las cosas que son del Espíritu de Dios... mas el espiritual juzga todas las cosas.»
  2. **Lucas 12:56** — «¡Hipócritas! Sabéis distinguir el aspecto del cielo y de la tierra; ¿y cómo no distinguís este tiempo?»
  3. **Hebreos 5:14** — «Pero el alimento sólido es para los que han alcanzado madurez, para los que por el uso tienen los sentidos ejercitados en el discernimiento del bien y del mal.»

### 2. Confesión Cristológica y Centralidad del Mesías (*Messias / Huios*)
- **Significado:** Proclamación de Jesucristo como el Hijo del Dios viviente y Salvador soberano de su Iglesia.
- **Frecuencia bíblica:** Núcleo de todo el Nuevo Testamento (más de 500 menciones cristológicas fundamentales).
- **Tres versículos paralelos fundamentales:**
  1. **Juan 6:68-69** — «Le respondió Simón Pedro: Señor, ¿a quién iremos? Tú tienes palabras de vida eterna. Y nosotros hemos creído y conocemos que tú eres el Cristo, el Hijo del Dios viviente.»
  2. **1 Juan 5:20** — «Pero sabemos que el Hijo de Dios ha venido, y nos ha dado entendimiento para conocer al que es verdadero; y estamos en el verdadero, en su Hijo Jesucristo.»
  3. **Hechos 4:12** — «Y en ningún otro hay salvación; porque no hay otro nombre bajo el cielo, dado a los hombres, en que podamos ser salvos.»

### 3. La Iglesia Edificada sobre la Roca (*Ekklesia / Petra*)
- **Significado:** La asamblea del pacto fundada y sustentada inexpugnablemente por la verdad de Cristo frente a las potestades de las tinieblas.
- **Frecuencia bíblica:** ~114 menciones de *ekklesia* en el Nuevo Testamento.
- **Tres versículos paralelos fundamentales:**
  1. **1 Corintios 3:11** — «Porque nadie puede poner otro fundamento que el que está puesto, el cual es Jesucristo.»
  2. **Efesios 2:20** — «Edificados sobre el fundamento de los apóstoles y profetas, siendo la principal piedra del ángulo Jesucristo mismo.»
  3. **1 Pedro 2:6** — «Por lo cual también contiene la Escritura: He aquí, pongo en Sion la principal piedra del ángulo, escogida, preciosa; y el que creyere en él, no será avergonzado.»

### 4. La Soberanía Revelacional del Padre (*Apokalypsis*)
- **Significado:** La verdad salvífica no es producto de carne ni de sangre (sabiduría humana), sino de la revelación soberana del Padre celestial.
- **Frecuencia bíblica:** Decenas de formulaciones sobre la iluminación divina incondicional.
- **Tres versículos paralelos fundamentales:**
  1. **Mateo 11:27** — «Todas las cosas me fueron entregadas por mi Padre; y nadie conoce al Hijo, sino el Padre, ni al Padre conoce alguno, sino el Hijo, y aquel a quien el Hijo lo quiera revelar.»
  2. **Gálatas 1:15-16** — «Pero cuando agradó a Dios... revelar a su Hijo en mí, para que yo le predicase entre los gentiles, no consulté en seguida con carne y sangre.»
  3. **1 Corintios 1:26-29** — «Pues mirad, hermanos, vuestra vocación, que no sois muchos sabios según la carne... sino que lo necio del mundo escogió Dios, para avergonzar a los sabios.»`;
  }

  // Generador dinámico universal de 4 conceptos para cualquier pasaje
  return `### Concordancia Doctrinal y Temática de ${ref}
${texto ? `*Texto canónico:* «${texto}»\n` : ''}
### 1. La Revelación y Fidelidad del Pacto Eterno (*Berit / Diathēkē*)
- **Significado:** El compromiso soberano e inquebrantable de Dios para cumplir todas sus promesas en favor de su pueblo.
- **Frecuencia bíblica:** Más de 300 menciones de pacto en todo el canon bíblico.
- **Tres versículos paralelos fundamentales:**
  1. **Génesis 17:7** — «Y estableceré mi pacto entre mí y ti, y tu descendencia después de ti en sus generaciones, por pacto perpetuo, para ser tu Dios, y el de tu descendencia después de ti.»
  2. **Hebreos 8:6** — «Pero ahora tanto mejor ministerio es el suyo, cuanto es mediador de un mejor pacto, establecido sobre mejores promesas.»
  3. **Jeremías 31:33** — «Pero este es el pacto que haré con la casa de Israel después de aquellos días, dice Jehová: Daré mi ley en su mente, y la escribiré en su corazón; y yo seré a ellos por Dios, y ellos me serán por pueblo.»

### 2. La Gracia Soberana y Redención en Cristo (*Apolytrosis*)
- **Significado:** El rescate definitivo del pecador operado por el sacrificio expiatorio del Señor Jesucristo.
- **Frecuencia bíblica:** ~140 apariciones en el Nuevo Testamento vinculadas a la redención y expiación.
- **Tres versículos paralelos fundamentales:**
  1. **Efesios 1:7** — «En quien tenemos redención por su sangre, el perdón de pecados según las riquezas de su gracia.»
  2. **Romanos 3:24** — «Siendo justificados gratuitamente por su gracia, mediante la redención que es en Cristo Jesús.»
  3. **Colosenses 1:14** — «En quien tenemos redención por su sangre, el perdón de pecados.»

### 3. La Renovación Espiritual y Santificación (*Hagiasmos*)
- **Significado:** La obra continua del Espíritu Santo que purifica los afectos, pensamientos y conducta del creyente.
- **Frecuencia bíblica:** Más de 200 llamadas a la santidad y pureza interior en el canon.
- **Tres versículos paralelos fundamentales:**
  1. **1 Tesalonicenses 5:23** — «Y el mismo Dios de paz os santifique por completo; y todo vuestro ser, espíritu, alma y cuerpo, sea guardado irreprensible para la venida de nuestro del Señor Jesucristo.»
  2. **2 Corintios 3:18** — «Por tanto, nosotros todos, mirando a cara descubierta como en un espejo la gloria del Señor, somos transformados de gloria en gloria en la misma imagen, como por el Espíritu del Señor.»
  3. **1 Pedro 1:15-16** — «Sino, como aquel que os llamó es santo, sed también vosotros santos en toda vuestra manera de vivir; porque escrito está: Sed santos, porque yo soy santo.»

### 4. Ortopraxis, Obediencia y Esperanza Viva (*Elpis / Hypakoē*)
- **Significado:** La fe viva traducida en obediencia agradecida y descanso en la victoria escatológica de Cristo.
- **Frecuencia bíblica:** Eje constante en la teología apostólica y los salmos davídicos.
- **Tres versículos paralelos fundamentales:**
  1. **Santiago 1:22** — «Pero sed hacedores de la palabra, y no tan solamente oidores, engañándoos a vosotros mismos.»
  2. **1 Pedro 1:3** — «Bendito el Dios y Padre de nuestro Señor Jesucristo, que según su grande misericordia nos hizo renacer para una esperanza viva, por la resurrección de Jesucristo de los muertos.»
  3. **Miqueas 6:8** — «Oh hombre, él te ha declarado lo que es bueno, y qué pide Jehová de ti: solamente hacer justicia, y amar misericordia, y humillarte ante tu Dios.»`;
}
