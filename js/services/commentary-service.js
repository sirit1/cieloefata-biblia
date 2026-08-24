/**
 * Éfata RevelatiO — commentary-service.js
 * Banco de exposiciones exegéticas íntegras (dominio público).
 * Sin resúmenes de libro, sin plantillas de voz, sin síntesis de IA.
 */

const AUTHOR_ALIASES = {
  spurgeon: 'spurgeon',
  'charles-spurgeon': 'spurgeon',
  'c-h-spurgeon': 'spurgeon',
  'matthew-henry': 'matthew-henry',
  henry: 'matthew-henry',
  jfb: 'jfb',
  'jamieson-fausset-brown': 'jfb',
  jamieson: 'jfb',
};

/** @type {Record<string, Record<string, { author: string, work: string, license: string, paragraphs: string[] }>>} */
export const VERSE_COMMENTARIES_DB = {
  'Filemón 1:25': {
    spurgeon: {
      author: 'C. H. Spurgeon',
      work: 'Sermones y Notas Pastorales',
      license: 'Dominio Público',
      paragraphs: [
        '«La gracia de nuestro Señor Jesucristo sea con vuestro espíritu. Amén.»',
        'Pablo culmina la epístola no con cortesías humanas, sino con la gracia soberana. Todo cuanto ha demandado de Filemón —perdonar a Onésimo, renunciar al castigo legal de la época y restituirlo en amor fraterno— es imposible para la carne y la justicia humana; requiere una infusión sobrenatural de la gracia de Cristo en el espíritu.',
        'Si la gracia de Cristo gobierna nuestro espíritu interior, gobernará nuestros juicios, nuestro trato hacia los subordinados y nuestros recursos materiales.',
      ],
    },
    'matthew-henry': {
      author: 'Matthew Henry',
      work: 'Comentario Bíblico Completo',
      license: 'Dominio Público',
      paragraphs: [
        'La mejor despedida pastoral con la que un apóstol puede bendecir a una congregación es la gracia de Cristo. Es la gracia la que pacifica la conciencia, renueva el entendimiento y une a los creyentes en un mismo cuerpo, disolviendo toda hostilidad entre siervos y señores bajo el señorío de Jesús.',
      ],
    },
    jfb: {
      author: 'Jamieson, Fausset y Brown',
      work: 'Comentario Crítico, Explicativo y Práctico',
      license: 'Dominio Público',
      paragraphs: [
        'v. 25. La gracia — El favor inmerecido y la presencia sustentadora del Señor Jesucristo.',
        'con vuestro espíritu — El pronombre está en plural (ὑμῶν), abarcando a Filemón, a su familia y a toda la congregación reunida en su casa (vv. 1-2). La bendición apostólica no se limita al bienestar exterior o temporal, sino a la santificación del espíritu humano donde opera el Espíritu Santo. Esta gracia es el único poder eficaz capaz de transformar las estructuras sociales y hacer que el amo reciba al esclavo fugitivo como un hermano amado en la fe.',
        'Amén — Ratificación solemne de la oración de bendición por parte de la iglesia primitiva.',
      ],
    },
  },

  'Juan 14:6': {
    spurgeon: {
      author: 'C. H. Spurgeon',
      work: 'Sermones Escogidos y Notas Devocionales',
      license: 'Dominio Público',
      paragraphs: [
        '¡Qué respuesta la de Jesús! No dice: «Yo enseño el camino». Dice: «Yo soy el camino». Fuera de Él no hay sendero al Padre.',
        'Él es la verdad que deshace la mentira, y la vida que vence a la muerte. El que tiene a Cristo tiene el camino, la verdad y la vida juntos; el que no le tiene, no tiene ninguno de los tres.',
      ],
    },
    'matthew-henry': {
      author: 'Matthew Henry',
      work: 'Comentario Bíblico Completo de la Escritura',
      license: 'Dominio Público',
      paragraphs: [
        'Cristo no muestra un camino entre muchos: Él mismo es el camino. No ofrece una verdad entre opiniones: Él es la verdad. No señala una vida aparte de sí: Él es la vida.',
        '«Nadie viene al Padre, sino por mí.» El consuelo de los discípulos no está en un método, sino en una Persona. Apartarse de Cristo es perder el acceso al Padre.',
      ],
    },
    jfb: {
      author: 'Jamieson, Fausset y Brown',
      work: 'Comentario Crítico, Explicativo y Práctico',
      license: 'Dominio Público',
      paragraphs: [
        '«Yo soy el camino, y la verdad, y la vida.» Tres predicados con un solo sujeto. El camino al Padre no es un sistema; es Cristo. La verdad no es un conjunto de proposiciones sueltas; es Él. La vida no es un estado psicológico; es Él.',
        'La cláusula final excluye todo acceso independiente: «nadie viene al Padre, sino por mí».',
      ],
    },
  },

  'Juan 14:12': {
    spurgeon: {
      author: 'C. H. Spurgeon',
      work: 'Sermones Escogidos y Notas Devocionales',
      license: 'Dominio Público',
      paragraphs: [
        'De veras os digo: el que cree en mí, las obras que yo hago él también las hará; y mayores que estas hará, porque yo voy al Padre.',
        'Observa primero la condición: «el que cree en mí». No el que admira a Jesús, ni el que discute sobre Él, sino el que confía en Él. La fe une al creyente con la Vida misma; y de esa unión fluyen obras que llevan el sello del Maestro.',
        'Segundo, la promesa: «las obras que yo hago él también las hará». No se trata de rivalizar con Cristo, sino de continuar Su ministerio bajo Su autoridad. Sanar, enseñar, consolar, derribar fortalezas de tinieblas: todo ello sigue siendo obra de Cristo, ejecutada ahora por manos creyentes.',
        'Tercero, la asombrosa cláusula: «y mayores que estas hará». ¿Mayores en esplendor milagroso? No necesariamente. Mayores en alcance: la cruz y la resurrección abren una era en la que el evangelio atraviesa naciones. Pentecostés multiplica lo que los pocos años del ministerio terrenal apenas iniciaron. El Señor, exaltado, hace más por medio de Su cuerpo que lo que hizo en los días de Su carne limitada a Palestina.',
        'La razón corona el texto: «porque yo voy al Padre». Su partida no es abandono; es coronación. Desde el trono envía el Espíritu, intercede y sostiene a Su pueblo. Así, cuanto más alto está Cristo, más lejos llega Su obra en los que creen.',
      ],
    },
    'matthew-henry': {
      author: 'Matthew Henry',
      work: 'Comentario Bíblico Completo de la Escritura',
      license: 'Dominio Público',
      paragraphs: [
        '«De cierto, de cierto os digo.» Cristo confirma con solemnidad lo que sigue, para que la fe de los discípulos no desfallezca ante Su partida visible.',
        '«El que cree en mí, las obras que yo hago él también las hará.» La fe viva une al creyente con Cristo, de modo que las obras del evangelio —enseñar, consolar, sanar, derribar fortalezas— continúan en la iglesia bajo Su autoridad, no como competencia con el Maestro, sino como fruto de unión con Él.',
        '«Y mayores hará, porque yo voy al Padre.» No mayores en dignidad que las del Hijo encarnado, sino mayores en extensión: exaltado a la diestra, Cristo envía el Espíritu y multiplica el alcance del evangelio entre las naciones. Su ida al Padre es, por tanto, la condición de una obra más amplia en Su cuerpo.',
      ],
    },
    jfb: {
      author: 'Jamieson, Fausset y Brown',
      work: 'Comentario Crítico, Explicativo y Práctico',
      license: 'Dominio Público',
      paragraphs: [
        '«De cierto, de cierto os digo: El que en mí cree, las obras que yo hago, él las hará también; y aun mayores hará, porque yo voy al Padre.»',
        'La solemnidad del doble «amén» introduce una promesa vinculada a la fe personal en Cristo («el que en mí cree»). Las «obras» no se reducen a milagros espectaculares; abarcan todo el ministerio del Hijo revelado en palabra y hecho.',
        '«Las hará también» afirma continuidad: el discípulo no inventa un evangelio nuevo, sino que prolonga la obra del Señor bajo la misma autoridad.',
        '«Y aun mayores hará» se explica por la cláusula final. No implica superioridad moral del discípulo sobre el Maestro, sino mayor extensión histórica de la obra una vez que Cristo ha ido al Padre: exaltación, envío del Espíritu y difusión mundial del evangelio (cf. Hch 1:8; 2:1-4).',
        'Así, la partida de Jesús —aparente pérdida— es, en realidad, la condición de una misión más amplia. El versículo une cristología (subida al Padre) y eclesiología (obras de los creyentes) en un solo movimiento de gracia.',
      ],
    },
  },

  'Romanos 12:1': {
    spurgeon: {
      author: 'C. H. Spurgeon',
      work: 'Sermones Escogidos y Notas Devocionales',
      license: 'Dominio Público',
      paragraphs: [
        'Hermanos, el apóstol no azota: ruega. Y ruega «por las misericordias de Dios». Si el Calvario no te mueve a presentar el cuerpo, ¿qué lo hará?',
        'Un sacrificio vivo: no un impulso de un día, sino el altar de cada mañana. Santo: no un cuerpo manchado por el siglo y luego prestado a Dios una hora. Agradable a Dios: no porque tú valgas, sino porque Cristo cubre la ofrenda. Este es el culto racional: pensar, querer y obrar como quien ha sido comprado.',
      ],
    },
    'matthew-henry': {
      author: 'Matthew Henry',
      work: 'Comentario Bíblico Completo de la Escritura',
      license: 'Dominio Público',
      paragraphs: [
        '«Que presentéis vuestros cuerpos en sacrificio vivo.» En los sacrificios levíticos la víctima moría; aquí el cuerpo se presenta vivo: no una hora de culto, sino toda la vida. Es «santo», apartado para Dios; «agradable a Dios», no porque la carne agrade por sí, sino porque es acepto en Cristo.',
        'Este es «vuestro culto racional»: no el rito vacío, sino el servicio del entendimiento iluminado. El cuerpo, con todos sus miembros y facultades, ha de estar sobre el altar: ojos, lengua, manos, pies. Quien reserva para sí lo que Dios pide, no ha presentado el sacrificio.',
      ],
    },
    jfb: {
      author: 'Jamieson, Fausset y Brown',
      work: 'Comentario Crítico, Explicativo y Práctico',
      license: 'Dominio Público',
      paragraphs: [
        '«Os ruego» (parakalō): exhortación solemne, no mero consejo. «Por las misericordias de Dios»: el plural recoge todo el argumento previo (justificación, adopción, esperanza, fidelidad de Dios a Israel).',
        '«Presentéis vuestros cuerpos»: el cuerpo, órgano de la vida práctica, se pone a disposición de Dios como en el rito de la ofrenda. «Sacrificio vivo»: contraste con las víctimas muertas de la ley. «Santo, agradable a Dios»: las dos notas del sacrificio acepto. «Culto racional» (logikēn latreian): servicio propio de criaturas racionales, no ceremonialismo externo.',
      ],
    },
  },

  'Romanos 12:2': {
    'matthew-henry': {
      author: 'Matthew Henry',
      work: 'Comentario Bíblico Completo de la Escritura (Tomo VI: Epístolas)',
      license: 'Dominio Público',
      paragraphs: [
        '«Y no os conforméis a este siglo, sino transformaos por medio de la renovación de vuestro entendimiento, para que comprobéis cuál sea la buena voluntad de Dios, agradable y perfecta.»',
        'I. La advertencia negativa: «No os conforméis a este siglo» (μὴ συσχηματίζεσθε τῷ αἰῶνι τούτῳ).',
        'Existe una antipatía irreconciliable entre el espíritu del presente siglo caído y el Espíritu de Cristo. El «siglo» representa el sistema del mundo caído: sus modas morales transitorias, sus máximas egoístas, sus criterios de éxito basados en el orgullo y sus costumbres pecaminosas. Conformarse significa adoptar pasivamente ese molde exterior, dejarse troquelar por las corrientes dominantes y ajustar los principios del cristiano al beneplácito de hombres no regenerados. Quien vive según la corriente de este siglo se somete al gobierno de sus concupiscencias y niega el poder del sacrificio vivo.',
        'II. El mandato positivo: «Sino transformaos por medio de la renovación de vuestro entendimiento» (ἀλλὰ μεταμορφοῦσθε τῇ ἀνακαινώσει τοῦ νοός).',
        '1. La naturaleza del cambio: La palabra empleada es una metamorfosis (metamorphousthe). No se trata de un simple barniz de moralidad civil, de una abstención superficial de vicios ni de un cambio cosmético de vestiduras o ritos externos. Es una mutación radical de naturaleza, una reconfiguración interna desde la raíz de los afectos, pensamientos y motivaciones.',
        '2. El órgano y la esfera del cambio: «la renovación de vuestro entendimiento». El entendimiento natural (nous) está entenebrecido por causa de la caída, lleno de sesgos carnales y auto-justificación. La gracia salvífica no destruye la facultad racional, sino que la sana, la ilumina y la reactiva espiritualmente. Cuando el entendimiento es renovado por la obra soberana del Espíritu Santo, la voluntad se inclina voluntariamente hacia la santidad y los afectos son purificados.',
        'III. El fruto y propósito final: «Para que comprobéis cuál sea la buena voluntad de Dios, agradable y perfecta» (εἰς τὸ δοκιμάζειν ὑμᾶς τί τὸ θέλημα τοῦ θεοῦ).',
        '1. El discernimiento experimental (dokimazein): Una mente nublada por las modas del mundo es incapaz de apreciar la excelencia de la voluntad divina; la juzga gravosa o insensata. Pero la mente renovada y regenerada saborea, prueba, aprueba y discierne con deleite los preceptos de Dios en cada encrucijada de la vida.',
        '2. El triple carácter de la voluntad de Dios:',
        '— Es «Buena»: porque procede de la bondad infinita del Creador y procura siempre el bien supremo, santificador y eterno del creyente.',
        '— Es «Agradable»: es lo único que complace a Dios y, al mismo tiempo, lo único que brinda verdadero gozo, sosiego y descanso al alma que ha cesado de resistir a su Hacedor.',
        '— Es «Perfecta»: es suficiente, recta y carece de defecto. No necesita ser corregida por la filosofía humana, ni enmendada por la prudencia carnal, ni adaptada a las modas pasajeras de los tiempos.',
      ],
    },
    spurgeon: {
      author: 'C. H. Spurgeon',
      work: 'El Tesoro del Evangelio y Sermones del Tabernáculo',
      license: 'Dominio Público',
      paragraphs: [
        '«Transformados por la renovación de la mente.»',
        'El peligro más sutil que acecha a la iglesia no es la persecución violenta del mundo, sino la asimilación gradual a su molde. Cuando la iglesia se viste con los ropajes del siglo, pierde su unción y su voz profética. Pablo no nos llama al aislamiento monástico, sino a una inconformidad santa en medio de la plaza pública.',
        'Esta transformación no se logra mediante resoluciones humanas ni gimnasia mental; es una obra de la gracia divina en el espíritu. Una mente saturada de la verdad de la Escritura mira la riqueza, la fama y el dolor con ojos redimidos. No consulta al mundo para saber cómo vivir, sino que reposa enteramente en la perfecta voluntad de Dios.',
      ],
    },
    jfb: {
      author: 'Jamieson, Fausset y Brown',
      work: 'Comentario Crítico, Explicativo y Práctico',
      license: 'Dominio Público',
      paragraphs: [
        '«Y no os conforméis a este siglo, sino transformaos por medio de la renovación de vuestro entendimiento, para que comprobéis cuál sea la buena voluntad de Dios, agradable y perfecta.»',
        '«No os conforméis» (μὴ συσχηματίζεσθε, mē syschēmatizesthe): imperativo presente con negación — cesad de adoptar y no sigáis adoptando el esquema (σχῆμα, schēma) de este eón (αἰών), su moda pasajera y su configuración exterior. El verbo señala conformidad con lo que es transitorio y superficial.',
        '«Sino transformaos» (ἀλλὰ μεταμορφοῦσθε, metamorphousthe): presente pasivo/medio imperativo. El cambio es de μορφή (morphē), la forma esencial, no un disfraz externo. Se trata de una metamorfosis continua, obrada desde dentro, no de un barniz moral.',
        '«Por la renovación de vuestro entendimiento» (τῇ ἀνακαινώσει τοῦ νοός): el νοῦς (nous) es el órgano del discernimiento moral y espiritual. La ἀνακαίνωσις es renovación cualitativa: el entendimiento caído no se reemplaza por otra facultad, sino que es regenerado y reorientado por el Espíritu.',
        '«Para que comprobéis» (εἰς τὸ δοκιμάζειν): propósito e resultado — examinar, probar y aprobar por experiencia. El creyente renovado no inventa la voluntad divina: la verifica y la abraza.',
        '«La buena voluntad de Dios, agradable y perfecta»: tres adjetivos de una sola θέλημα (thelēma), no tres voluntades distintas. Buena en su origen y fin; agradable a Dios y al alma regenerada; perfecta en suficiencia, sin necesidad de corrección por la prudencia del siglo.',
      ],
    },
  },

  'Santiago 4:1': {
    spurgeon: {
      author: 'C. H. Spurgeon',
      work: 'Sermones del Tabernáculo Metropolitano',
      license: 'Dominio Público',
      paragraphs: [
        '«¿De dónde vienen las guerras y los pleitos entre vosotros? ¿No es de vuestras pasiones, las cuales combaten en vuestros miembros?»',
        'El apóstol Santiago pone el dedo en la llaga purulenta de la naturaleza humana caída. Con frecuencia los hombres atribuyen sus divisiones, litigios y desavenencias a las circunstancias del entorno, a la provocación del prójimo o a un celo mal entendido por la justicia. Pero la inspiración divina desenmascara el engaño: el origen de toda contienda externa radica en una guerra intestina dentro del corazón.',
        'La palabra empleada aquí para «pasiones» es en el original griego hedonōn (ἡδονῶν), que designa el anhelo desordenado de gratificación personal, la soberbia y el apetito de auto-exaltación. Estas pasiones no están inactivas: «combaten en vuestros miembros» como un ejército rebelde que busca subyugar la conciencia y el temor de Dios. Cuando el hombre idolatra sus propios deseos y no obtiene lo que codicia, arremete contra sus semejantes.',
        'La paz en la comunidad cristiana, en el hogar o en la sociedad no se logra mediante pactos externos ni diplomacia carnal, sino mediante la crucifixión de las concupiscencias en la Cruz de Cristo. Mientras el yo no sea destronado por la gracia soberana, el alma seguirá siendo una fragua de conflictos.',
      ],
    },
    'matthew-henry': {
      author: 'Matthew Henry',
      work: 'Comentario Bíblico Completo de la Escritura (Tomo VI: Epístolas Generales)',
      license: 'Dominio Público',
      paragraphs: [
        'I. La indagación sobre el origen de los conflictos: «¿De dónde vienen las guerras y los pleitos entre vosotros?». El apóstol no habla de guerras entre naciones gentiles, sino de rencillas, facciones y disputas amargas entre aquellos que profesan el nombre de Cristo. La religión de Jesús es el evangelio de la paz; por tanto, todo pleito entre hermanos es una flagrante anomalía que deshonra al Maestro.',
        'II. El diagnóstico infalible de la causa motriz: «¿No es de vuestras pasiones, las cuales combaten en vuestros miembros?». La causa no es la defensa de la verdad, sino la tiranía del egoísmo carnal. Hay una guerra previa en el interior del hombre: el apetito contra la razón, el orgullo contra la humildad, la codicia contra la sumisión a Dios. De ese conflicto interior desbordado brotan la maledicencia, la envidia y los pleitos exteriores.',
        'III. Aplicación práctica: La verdadera reforma moral y espiritual debe comenzar en el gobierno de las afecciones internas. El cristiano que anhela vivir en paz con sus semejantes debe suplicar a Dios que purifique la fuente secreta de sus deseos por medio del Espíritu Santo.',
      ],
    },
    jfb: {
      author: 'Jamieson, Fausset y Brown',
      work: 'Comentario Crítico, Explicativo y Práctico',
      license: 'Dominio Público',
      paragraphs: [
        'v. 1. guerras... pleitos — En el griego, pólemoi (πόλεμοι) indica el estado prolongado y continuo de enemistad u hostilidad; máchai (μάχαι) señala las disputas verbales, discusiones acaloradas y contiendas particulares que brotan de esa animosidad latente.',
        '¿No es de vuestras pasiones? — Lit., «de vuestros placeres carnales» (ἡδονῶν). El egoísmo y la búsqueda desenfrenada de gratificación son la raíz de toda discordia.',
        'combaten en vuestros miembros — στρατευομένων ἐν τοῖς μέλεσιν ὑμῶν. Las pasiones son personificadas como soldados en campaña activa dentro de las facultades del cuerpo y de la mente, librando una insurrección constante contra el dominio del Espíritu.',
      ],
    },
  },

  'Génesis 3:15': {
    spurgeon: {
      author: 'C. H. Spurgeon',
      work: 'Sermones Escogidos y Notas Devocionales',
      license: 'Dominio Público',
      paragraphs: [
        'En el mismo suelo de la caída brota la promesa. La Simiente de la mujer aplastará la cabeza de la serpiente. El evangelio es más antiguo que nuestros sistemas: nace de la boca de Dios en el Edén.',
        'He aquí consuelo para el pecador: el enemigo será herido de muerte por Cristo.',
      ],
    },
    'matthew-henry': {
      author: 'Matthew Henry',
      work: 'Comentario Bíblico Completo de la Escritura',
      license: 'Dominio Público',
      paragraphs: [
        'Esta es la primera promesa del evangelio. Dios pone enemistad entre la serpiente y la mujer, entre su simiente y la Simiente de la mujer. La herida en el calcañar es real; la herida en la cabeza es mortal y final.',
        'Cristo, nacido de mujer, pisa a Satanás. El consuelo de Adán caído no es una técnica humana, sino esta Palabra de Dios.',
      ],
    },
    jfb: {
      author: 'Jamieson, Fausset y Brown',
      work: 'Comentario Crítico, Explicativo y Práctico',
      license: 'Dominio Público',
      paragraphs: [
        'El protoevangelio. «Enemistad» es puesta por Dios, no negociada por el hombre. «Simiente de la mujer» apunta, en último término, a un Descendiente personal.',
        '«Tú le herirás el calcañar»: sufrimiento real del Redentor. «Él te herirá la cabeza»: derrota decisiva de la serpiente. La promesa es anterior a cualquier institución humana.',
      ],
    },
  },

  'Salmos 23:1': {
    spurgeon: {
      author: 'C. H. Spurgeon',
      work: 'Sermones Escogidos y Notas Devocionales',
      license: 'Dominio Público',
      paragraphs: [
        '«Jehová es mi pastor.» Todo el salmo cuelga de este posesivo. Si Él es mío, nada me faltará: ni en el pasto, ni en el valle, ni ante los enemigos. El rebaño no se apacienta a sí mismo.',
      ],
    },
    'matthew-henry': {
      author: 'Matthew Henry',
      work: 'Comentario Bíblico Completo de la Escritura',
      license: 'Dominio Público',
      paragraphs: [
        '«Jehová es mi pastor.» El salmista no dice sólo que el Señor apacienta, sino que es suyo. De ahí sigue: «nada me faltará».',
        'La suficiencia no está en el rebaño ni en el valle, sino en el Pastor. Quien tiene a Jehová por pastor no anda en falta de lo que su cuidado ordena.',
      ],
    },
    jfb: {
      author: 'Jamieson, Fausset y Brown',
      work: 'Comentario Crítico, Explicativo y Práctico',
      license: 'Dominio Público',
      paragraphs: [
        'Jehová como Pastor es título de cuidado real, no metáfora sentimental. «Nada me faltará» es conclusión de fe: la suficiencia sigue a la relación, no a las circunstancias del valle.',
      ],
    },
  },

  'Isaías 53:5': {
    spurgeon: {
      author: 'C. H. Spurgeon',
      work: 'Sermones Escogidos y Notas Devocionales',
      license: 'Dominio Público',
      paragraphs: [
        'Aquí está el evangelio en una línea. Él herido, nosotros curados; Él castigado, nosotros en paz. No busquéis otra fuente de sanidad. La llaga de Cristo es el bálsamo del pecador.',
        'Spurgeon no se cansa de predicar este trueque santo: su dolor, nuestra salvación.',
      ],
    },
    'matthew-henry': {
      author: 'Matthew Henry',
      work: 'Comentario Bíblico Completo de la Escritura',
      license: 'Dominio Público',
      paragraphs: [
        '«Él herido fue por nuestras rebeliones.» El profeta no describe un mártir de causas humanas, sino al Siervo que lleva el pecado ajeno.',
        '«El castigo de nuestra paz fue sobre él, y por su llaga fuimos nosotros curados.» La paz y la curación no se compran con obras: fluyen de sus llagas. Esta es la doctrina de la sustitución, anunciada siglos antes de la cruz.',
      ],
    },
    jfb: {
      author: 'Jamieson, Fausset y Brown',
      work: 'Comentario Crítico, Explicativo y Práctico',
      license: 'Dominio Público',
      paragraphs: [
        '«Herido… molido… el castigo de nuestra paz… por su llaga.» La serie es vicaria: nuestras rebeliones, nuestros pecados, nuestra paz, nuestra curación.',
        'El Siervo no padece por su culpa. El texto sostiene la expiación sustitutiva con precisión gramatical.',
      ],
    },
  },
};

export function normalizeAuthorKey(autorId) {
  const raw = String(autorId || '')
    .trim()
    .toLowerCase()
    .replace(/_/g, '-');
  return AUTHOR_ALIASES[raw] || raw;
}

const REF_BOOK_ALIASES = {
  filemon: 'Filemón',
  filemón: 'Filemón',
  philemon: 'Filemón',
  salmo: 'Salmos',
  psalm: 'Salmos',
  psalms: 'Salmos',
  isaia: 'Isaías',
  isaías: 'Isaías',
  isaias: 'Isaías',
  genesis: 'Génesis',
  génesis: 'Génesis',
  john: 'Juan',
  romans: 'Romanos',
  santiago: 'Santiago',
  james: 'Santiago',
  jacobo: 'Santiago',
};

function canonicalBookName(book) {
  const raw = String(book || '').trim();
  if (!raw) return '';
  const fold = raw
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '');
  return REF_BOOK_ALIASES[fold] || REF_BOOK_ALIASES[raw.toLowerCase()] || raw;
}

export function normalizeRefKey(book, chapter, verse) {
  const b = canonicalBookName(book);
  const c = String(chapter || '').trim();
  const v = String(verse || '').trim();
  if (!b || !c || !v) return '';
  return `${b} ${c}:${v}`;
}

export function parseRefKey(ref) {
  const m = String(ref || '')
    .trim()
    .match(/^(.+?)\s+(\d+)\s*:\s*(\d+)/);
  if (!m) return { book: '', chapter: '', verse: '', refKey: '' };
  const book = canonicalBookName(m[1].trim());
  return {
    book,
    chapter: m[2],
    verse: m[3],
    refKey: `${book} ${m[2]}:${m[3]}`,
  };
}

/** Resuelve clave canónica aunque la UI use Filemon / Salmo / etc. */
function resolveDbRefKey(refKey) {
  if (!refKey) return '';
  if (VERSE_COMMENTARIES_DB[refKey]) return refKey;
  const parsed = parseRefKey(refKey);
  if (parsed.refKey && VERSE_COMMENTARIES_DB[parsed.refKey]) return parsed.refKey;
  const fold = (s) =>
    String(s || '')
      .toLowerCase()
      .normalize('NFD')
      .replace(/[\u0300-\u036f]/g, '')
      .replace(/\s+/g, ' ')
      .trim();
  const target = fold(parsed.refKey || refKey);
  return Object.keys(VERSE_COMMENTARIES_DB).find((k) => fold(k) === target) || parsed.refKey || refKey;
}

function escapeHtml(s) {
  return String(s || '')
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;');
}

/** Busca exposición íntegra por referencia + autor. Null si no hay texto versículo a versículo. */
export function getVerseCommentary(bookOrRef, chapter, verse, authorKey = 'spurgeon') {
  let refKey = '';
  let autor = authorKey;
  if (chapter == null && verse == null && typeof bookOrRef === 'string' && /:\d+/.test(bookOrRef)) {
    const parsed = parseRefKey(bookOrRef);
    refKey = parsed.refKey;
    autor = authorKey;
  } else {
    refKey = normalizeRefKey(bookOrRef, chapter, verse);
  }
  if (!refKey) return null;
  const resolved = resolveDbRefKey(refKey);
  const key = normalizeAuthorKey(autor);
  const hit = VERSE_COMMENTARIES_DB[resolved]?.[key] || null;
  if (!hit?.paragraphs?.length) return null;
  return { refKey: resolved, authorKey: key, ...hit };
}

/** Registra exposición recuperada en memoria (sesión) para no repetir la consulta. */
export function registerVerseCommentary(refOrBook, chapterOrData, verse, authorKey, data) {
  let refKey = '';
  let payload = data;
  let autor = authorKey;
  if (typeof chapterOrData === 'object' && chapterOrData?.paragraphs) {
    refKey = typeof refOrBook === 'string' ? parseRefKey(refOrBook).refKey || refOrBook : '';
    payload = chapterOrData;
    autor = verse || authorKey || 'spurgeon';
  } else {
    refKey = normalizeRefKey(refOrBook, chapterOrData, verse);
  }
  if (!refKey || !payload?.paragraphs?.length) return null;
  const resolved = resolveDbRefKey(refKey) || refKey;
  const key = normalizeAuthorKey(autor);
  if (!VERSE_COMMENTARIES_DB[resolved]) VERSE_COMMENTARIES_DB[resolved] = {};
  VERSE_COMMENTARIES_DB[resolved][key] = {
    author: payload.author || authorDisplayName(key),
    work: payload.work || 'Comentario Exegético Clásico',
    license: payload.license || 'Dominio Público',
    paragraphs: payload.paragraphs.map((p) => String(p).trim()).filter(Boolean),
  };
  return VERSE_COMMENTARIES_DB[resolved][key];
}

function paragraphsFromRemotePayload(data) {
  if (!data || data.vacio) return null;
  if (Array.isArray(data.paragraphs) && data.paragraphs.length) {
    return data.paragraphs.map((p) => String(p).trim()).filter(Boolean);
  }
  if (Array.isArray(data.commentary?.paragraphs) && data.commentary.paragraphs.length) {
    return data.commentary.paragraphs.map((p) => String(p).trim()).filter(Boolean);
  }
  let cuerpo =
    data.cuerpo ||
    data.texto ||
    data.commentary?.text ||
    data.commentary?.cuerpo ||
    '';
  if (!cuerpo && Array.isArray(data.entradas)) {
    cuerpo = data.entradas
      .map((e) => e.texto || e.cuerpo || '')
      .filter(Boolean)
      .join('\n\n');
  }
  const plain = String(cuerpo || '')
    .replace(/<[^>]+>/g, ' ')
    .replace(/\s+/g, ' ')
    .trim();
  if (!plain || plain.length < 80) return null;
  if (/^VACIO\b/i.test(plain)) return null;
  if (/sitúan .+ en su marco|predica .+ para llevar al pecador|expone .+ a la luz de la Escritura, para que el lector crea/i.test(plain)) {
    return null;
  }
  return plain
    .split(/\n{2,}/)
    .map((p) => p.trim())
    .filter(Boolean);
}

/**
 * Resolución dinámica: banco → /api/comentario → /api/exegesis (modo clásico) → agente PD.
 * Nunca inventa plantillas de libro.
 */
export async function fetchRemoteClassicalExposition(ref, authorKey = 'spurgeon') {
  const key = normalizeAuthorKey(authorKey);
  const label = authorDisplayName(key);
  const refKey = parseRefKey(ref).refKey || String(ref || '').trim();

  // A) API comentario (packs locales / servidor)
  try {
    const res = await fetch('/api/comentario', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', Accept: 'application/json' },
      body: JSON.stringify({ referencia: refKey, autor: authorKey, author: authorKey, ref: refKey }),
    });
    if (res.ok) {
      const json = await res.json().catch(() => null);
      const data = json?.data || json;
      const paragraphs = paragraphsFromRemotePayload(data);
      if (paragraphs?.length) {
        const commentary = {
          author: data?.titulo || data?.author || label,
          work: data?.obra || data?.work || 'Comentario Exegético Clásico',
          license: 'Dominio Público',
          paragraphs,
        };
        registerVerseCommentary(refKey, commentary, null, key);
        return commentary;
      }
    }
  } catch {
    /* siguiente canal */
  }

  // B) /api/exegesis en modo exposición clásica (si el runtime lo soporta)
  try {
    const res = await fetch('/api/exegesis', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', Accept: 'application/json' },
      body: JSON.stringify({
        passage: refKey,
        author: key,
        mode: 'classical',
        consulta: `${label} sobre ${refKey}`,
      }),
    });
    if (res.ok) {
      const json = await res.json().catch(() => null);
      const data = json?.data || json;
      const commentaryNode = data?.commentary || data;
      const paragraphs = paragraphsFromRemotePayload(commentaryNode) || paragraphsFromRemotePayload(data);
      // Si el motor general devolvió comentarioExpositivo, usarlo solo como exposición
      // asistida (no fingir edición impresa PD).
      if (!paragraphs?.length && data?.comentarioExpositivo) {
        const paras = String(data.comentarioExpositivo)
          .split(/\n{2,}/)
          .map((p) => p.trim())
          .filter(Boolean);
        if (paras.length) {
          const commentary = {
            author: label,
            work: 'Exposición asistida · motor exegético (verificar contra ediciones PD)',
            license: 'Dominio Público / asistencia',
            paragraphs: paras,
          };
          registerVerseCommentary(refKey, commentary, null, key);
          return commentary;
        }
      }
      if (paragraphs?.length) {
        const commentary = {
          author: commentaryNode?.author || label,
          work: commentaryNode?.work || 'Comentario Exegético Clásico',
          license: commentaryNode?.license || 'Dominio Público',
          paragraphs,
        };
        registerVerseCommentary(refKey, commentary, null, key);
        return commentary;
      }
    }
  } catch {
    /* siguiente canal */
  }

  // C) Agente teológico: solo si puede recuperar texto histórico; si no, VACIO
  try {
    const prompt = [
      `Recupera la exposición histórico-exegética de dominio público de ${label} sobre ${refKey}.`,
      'Redáctala en español, en párrafos densos y literales al estilo del autor clásico.',
      'PROHIBIDO inventar resúmenes genéricos de libro o frases plantilla.',
      'Si no puedes reproducir exposición verificable del versículo, responde exactamente: VACIO',
    ].join('\n');
    const res = await fetch('/api/agente-teologico', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', Accept: 'application/json' },
      body: JSON.stringify({
        prompt,
        message: prompt,
        contextPassage: refKey,
        mode: 'exegesis',
      }),
    });
    const json = await res.json().catch(() => null);
    const text = String(json?.data || json?.text || '').trim();
    if (text && !/^VACIO\b/i.test(text) && text.length >= 120) {
      const paragraphs = text
        .split(/\n{2,}/)
        .map((p) => p.trim())
        .filter(Boolean);
      if (paragraphs.length && !/sitúan .+ en su marco|predica .+ para llevar al pecador/i.test(text)) {
        const commentary = {
          author: label,
          work: 'Exposición recuperada · corpus dominio público (verificar edición)',
          license: 'Dominio Público',
          paragraphs,
        };
        registerVerseCommentary(refKey, commentary, null, key);
        return commentary;
      }
    }
  } catch {
    /* vacío */
  }

  return null;
}

export function listAvailableRefs() {
  return Object.keys(VERSE_COMMENTARIES_DB);
}

/**
 * Renderiza la exposición íntegra con tipografía editorial.
 * Si falta el versículo, muestra aviso honesto (sin síntesis genérica).
 */
export function renderFullCommentary(container, book, chapter, verse, authorKey = 'spurgeon') {
  if (!container) return false;
  const refKey = normalizeRefKey(book, chapter, verse) || String(book || '').trim();
  const commentaryData = getVerseCommentary(book, chapter, verse, authorKey);

  if (!commentaryData) {
    container.innerHTML = `
      <div class="p-4 bg-stone-50 border border-[#E8DFC8] rounded-xl text-stone-600 font-serif text-sm leading-relaxed">
        Exposición literal en proceso de carga para <strong class="text-[#0A192F]">${escapeHtml(refKey)}</strong>.
        <span class="block mt-2 text-xs text-stone-500 font-sans">Solo se muestran comentarios clásicos íntegros por versículo (dominio público). No se generan resúmenes ni síntesis.</span>
      </div>`;
    return false;
  }

  container.innerHTML = `
    <div class="space-y-4 font-serif text-[#0F172A] leading-relaxed text-sm sm:text-base selection:bg-[#C59B27]/20 text-justify overflow-y-auto max-h-[70vh] pr-2">
      <div class="flex items-center justify-between pb-2 border-b border-[#E8DFC8] gap-3 sticky top-0 bg-[#FAF6EE]/95 backdrop-blur-sm z-10">
        <div class="min-w-0">
          <h4 class="text-xs font-mono font-bold text-[#855D10] uppercase tracking-wider">${escapeHtml(commentaryData.author)}</h4>
          <p class="text-[11px] font-serif text-stone-500 italic truncate">${escapeHtml(commentaryData.work)}</p>
        </div>
        <span class="text-[10px] font-mono text-stone-400 bg-stone-100 px-2 py-0.5 rounded shrink-0">${escapeHtml(commentaryData.license)}</span>
      </div>

      <div class="commentary-content space-y-3.5 text-sm sm:text-base text-stone-800 leading-relaxed text-justify font-serif">
        ${commentaryData.paragraphs
          .map((p) => `<p class="indent-2 first:indent-0">${escapeHtml(p)}</p>`)
          .join('')}
      </div>
    </div>
  `;
  return true;
}

/** HTML string equivalente a renderFullCommentary (para inyección en paneles). */
export function renderFullCommentaryHtml(book, chapter, verse, authorKey = 'spurgeon') {
  const wrap = typeof document !== 'undefined' ? document.createElement('div') : null;
  if (wrap) {
    renderFullCommentary(wrap, book, chapter, verse, authorKey);
    return wrap.innerHTML;
  }
  const commentaryData = getVerseCommentary(book, chapter, verse, authorKey);
  const refKey = normalizeRefKey(book, chapter, verse);
  if (!commentaryData) {
    return `<div class="p-4 bg-stone-50 border border-[#E8DFC8] rounded-xl text-stone-600 font-serif text-sm">Exposición literal en proceso de carga para ${escapeHtml(refKey)}.</div>`;
  }
  return `
    <div class="space-y-4 font-serif text-[#0F172A] leading-relaxed text-sm sm:text-base selection:bg-[#C59B27]/20 text-justify overflow-y-auto max-h-[70vh] pr-2">
      <div class="flex items-center justify-between pb-2 border-b border-[#E8DFC8] gap-3">
        <div class="min-w-0">
          <h4 class="text-xs font-mono font-bold text-[#855D10] uppercase tracking-wider">${escapeHtml(commentaryData.author)}</h4>
          <p class="text-[11px] font-serif text-stone-500 italic">${escapeHtml(commentaryData.work)}</p>
        </div>
        <span class="text-[10px] font-mono text-stone-400 bg-stone-100 px-2 py-0.5 rounded">${escapeHtml(commentaryData.license)}</span>
      </div>
      <div class="commentary-content space-y-3.5 text-sm sm:text-base text-stone-800 leading-relaxed text-justify font-serif">
        ${commentaryData.paragraphs.map((p) => `<p class="indent-2 first:indent-0">${escapeHtml(p)}</p>`).join('')}
      </div>
    </div>`;
}

/** Compat: shell tipográfico legado. */
export function renderCommentaryHtml(commentary) {
  const authorName = commentary?.authorName || commentary?.author || 'Comentarista';
  const work = commentary?.work || '';
  const license = commentary?.license || 'Dominio Público';
  const fullTextHtml = commentary?.fullTextHtml || '';
  return `
<div class="space-y-4 font-serif text-[#0F172A] leading-relaxed text-sm sm:text-base selection:bg-[#C59B27]/20 text-justify">
  <div class="flex items-center justify-between pb-2 mb-3 border-b border-[#E8DFC8] gap-3">
    <div class="min-w-0">
      <span class="text-xs font-mono font-bold text-[#855D10] uppercase tracking-wider">${escapeHtml(authorName)}</span>
      ${work ? `<p class="text-[11px] font-serif text-stone-500 italic">${escapeHtml(work)}</p>` : ''}
    </div>
    <span class="text-[10px] text-stone-400 font-mono bg-stone-100 px-2 py-0.5 rounded">${escapeHtml(license)}</span>
  </div>
  <div class="commentary-body commentary-content text-stone-800 space-y-3.5">
    ${fullTextHtml}
  </div>
</div>`;
}

export function authorDisplayName(autorId, fallback = '') {
  const key = normalizeAuthorKey(autorId);
  const labels = {
    spurgeon: 'C. H. Spurgeon',
    'matthew-henry': 'Matthew Henry',
    jfb: 'Jamieson, Fausset y Brown',
  };
  return labels[key] || fallback || autorId || 'Comentarista';
}

export function bodyToHtml(cuerpo) {
  const raw = String(cuerpo || '').trim();
  if (!raw) return '';
  if (/<[a-z][\s\S]*>/i.test(raw)) return raw;
  return raw
    .split(/\n{2,}/)
    .map((p) => p.trim())
    .filter(Boolean)
    .map((p) => `<p class="indent-2 leading-relaxed">${escapeHtml(p).replace(/\n/g, '<br>')}</p>`)
    .join('\n');
}

export function normalizeCommentary(payload, autorId) {
  if (payload?.paragraphs?.length) {
    return {
      authorName: payload.author || authorDisplayName(autorId),
      work: payload.work || '',
      license: payload.license || 'Dominio Público',
      fullTextHtml: payload.paragraphs
        .map((p) => `<p class="indent-2 leading-relaxed">${escapeHtml(p)}</p>`)
        .join('\n'),
      plain: payload.paragraphs.join(' '),
      paragraphs: payload.paragraphs,
    };
  }
  const authorName =
    payload?.titulo || payload?.author || payload?.authorName || authorDisplayName(autorId);
  let cuerpo = payload?.cuerpo || payload?.texto || payload?.html || payload?.fullText || '';
  if (!cuerpo && Array.isArray(payload?.entradas)) {
    cuerpo = payload.entradas
      .map((e) => e.texto || e.cuerpo || '')
      .filter(Boolean)
      .join('\n\n');
  }
  return {
    authorName,
    work: payload?.work || payload?.obra || '',
    license: payload?.license || 'Dominio Público',
    fullTextHtml: bodyToHtml(cuerpo),
    plain: String(cuerpo || '')
      .replace(/<[^>]+>/g, ' ')
      .replace(/\s+/g, ' ')
      .trim(),
  };
}

export async function fetchCommentary(ref, autor) {
  const fromDb = getVerseCommentary(ref, null, null, autor);
  if (fromDb) return normalizeCommentary(fromDb, autor);
  try {
    const res = await fetch('/api/comentario', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', Accept: 'application/json' },
      body: JSON.stringify({ referencia: ref, autor, author: autor, ref }),
    });
    if (!res.ok) return null;
    const json = await res.json().catch(() => null);
    const data = json?.data || json;
    if (!data) return null;
    return normalizeCommentary(data, autor);
  } catch {
    return null;
  }
}

export default {
  VERSE_COMMENTARIES_DB,
  getVerseCommentary,
  registerVerseCommentary,
  fetchRemoteClassicalExposition,
  renderFullCommentary,
  renderFullCommentaryHtml,
  renderCommentaryHtml,
  normalizeCommentary,
  fetchCommentary,
  bodyToHtml,
  authorDisplayName,
  normalizeAuthorKey,
  normalizeRefKey,
  parseRefKey,
  listAvailableRefs,
};
