#!/usr/bin/env node
/**
 * Genera la biblioteca local (JSON) para lectura instantánea.
 * Texto bíblico: Reina-Valera 1909 (dominio público, Wikisource).
 * No incluye RVR1960 / TLA / DHH de SBU.
 */
import { writeFileSync, mkdirSync, copyFileSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';

const root = join(dirname(fileURLToPath(import.meta.url)), '..');
const dataDir = join(root, 'data');
const publicDir = join(root, 'public', 'data');
mkdirSync(dataDir, { recursive: true });
mkdirSync(publicDir, { recursive: true });

const META = {
    fuente: 'Reina-Valera 1909',
    dominio_publico: true,
    nota: 'Biblioteca local de lectura instantánea. El texto de cada clave (rv1960, tla, dhh) es Reina-Valera 1909, dominio público, para que el capítulo nunca dependa de la red. Las ediciones RVR1960, TLA y DHH de Sociedades Bíblicas Unidas no se incluyen en el repositorio; si existen packs licenciados en data/versiones, el lector los superpone.'
};

function capitulo(libro, cap, versos) {
    const filas = versos.map((texto, i) => ({
        n: i + 1,
        rv1960: texto,
        tla: texto,
        dhh: texto
    }));
    return {
        libro,
        capitulo: cap,
        versiculos: filas.length,
        ...META,
        versos: filas
    };
}

const ROMANOS_12 = [
    'Así que, hermanos, os ruego por las misericordias de Dios, que presentéis vuestros cuerpos en sacrificio vivo, santo, agradable á Dios, que es vuestro racional culto.',
    'Y no os conforméis á este siglo; mas reformaos por la renovación de vuestro entendimiento, para que experimentéis cuál sea la buena voluntad de Dios, agradable y perfecta.',
    'Digo pues por la gracia que me es dada, á cada cual que está entre vosotros, que no tenga más alto concepto de sí que el que debe tener, sino que piense de sí con templanza, conforme á la medida de la fe que Dios repartió á cada uno.',
    'Porque de la manera que en un cuerpo tenemos muchos miembros, empero todos los miembros no tienen la misma operación;',
    'Así muchos somos un cuerpo en Cristo, mas todos miembros los unos de los otros.',
    'De manera que, teniendo diferentes dones según la gracia que nos es dada, si el de profecía, úsese conforme á la medida de la fe;',
    'ó si ministerio, en servir; ó el que enseña, en doctrina;',
    'El que exhorta, en exhortar; el que reparte, hágalo en simplicidad; el que preside, con solicitud; el que hace misericordia, con alegría.',
    'El amor sea sin fingimiento: aborreciendo lo malo, llegándoos á lo bueno;',
    'Amándoos los unos á los otros con caridad fraternal; previniéndoos con honra los unos á los otros;',
    'En el cuidado no perezosos; ardientes en espíritu; sirviendo al Señor;',
    'Gozosos en la esperanza; sufridos en la tribulación; constantes en la oración;',
    'Comunicando á las necesidades de los santos; siguiendo la hospitalidad.',
    'Bendecid á los que os persiguen: bendecid y no maldigáis.',
    'Gozaos con los que se gozan: llorad con los que lloran.',
    'Unánimes entre vosotros: no altivos, mas acomodándoos á los humildes. No seáis sabios en vuestra opinión.',
    'No paguéis á nadie mal por mal; procurad lo bueno delante de todos los hombres.',
    'Si se puede hacer, cuanto está en vosotros, tened paz con todos los hombres.',
    'No os venguéis vosotros mismos, amados míos; antes dad lugar á la ira; porque escrito está: Mía es la venganza: yo pagaré, dice el Señor.',
    'Así que, si tu enemigo tuviere hambre, dale de comer; si tuviere sed, dale de beber: que haciendo esto, ascuas de fuego amontonas sobre su cabeza.',
    'No seas vencido de lo malo; mas vence con el bien el mal.'
];

const JUAN_14 = [
    'No se turbe vuestro corazón; creéis en Dios, creed también en mí.',
    'En la casa de mi Padre muchas moradas hay: de otra manera os lo hubiera dicho: voy, pues, á preparar lugar para vosotros.',
    'Y si me fuere, y os aparejare lugar, vendré otra vez, y os tomaré á mí mismo: para que donde yo estoy, vosotros también estéis.',
    'Y sabéis á dónde yo voy; y sabéis el camino.',
    'Dícele Tomás: Señor, no sabemos á dónde vas: ¿cómo, pues, podemos saber el camino?',
    'Jesús le dice: Yo soy el camino, y la verdad, y la vida: nadie viene al Padre, sino por mí.',
    'Si me conocieseis, también á mi Padre conocierais: y desde ahora le conocéis, y le habéis visto.',
    'Dícele Felipe: Señor, muéstranos el Padre, y nos basta.',
    'Jesús le dice: ¿Tanto tiempo ha que estoy con vosotros, y no me has conocido, Felipe? El que me ha visto, ha visto al Padre; ¿cómo, pues, dices tú: Muéstranos el Padre?',
    '¿No crees que yo soy en el Padre, y el Padre en mí? Las palabras que yo os hablo, no las hablo de mí mismo: mas el Padre que está en mí, él hace las obras.',
    'Creedme que yo soy en el Padre, y el Padre en mí: de otra manera, creedme por las mismas obras.',
    'De cierto, de cierto os digo: El que en mí cree, las obras que yo hago también él las hará; y mayores que éstas hará; porque yo voy al Padre.',
    'Y todo lo que pidiereis al Padre en mi nombre, esto haré, para que el Padre sea glorificado en el Hijo.',
    'Si algo pidiereis en mi nombre, yo lo haré.',
    'Si me amáis, guardad mis mandamientos;',
    'Y yo rogaré al Padre, y os dará otro Consolador, para que esté con vosotros para siempre:',
    'Al Espíritu de verdad, al cual el mundo no puede recibir, porque no le ve, ni le conoce: mas vosotros le conocéis; porque está con vosotros, y será en vosotros.',
    'No os dejaré huérfanos: vendré á vosotros.',
    'Aun un poquito, y el mundo no me verá más; empero vosotros me veréis; porque yo vivo, y vosotros también viviréis.',
    'En aquel día vosotros conoceréis que yo estoy en mi Padre, y vosotros en mí, y yo en vosotros.',
    'El que tiene mis mandamientos, y los guarda, aquél es el que me ama; y el que me ama, será amado de mi Padre, y yo le amaré, y me manifestaré á él.',
    'Dícele Judas, no el Iscariote: Señor, ¿qué hay porque te hayas de manifestar á nosotros, y no al mundo?',
    'Respondió Jesús, y díjole: El que me ama, mi palabra guardará; y mi Padre le amará, y vendremos á él, y haremos con él morada.',
    'El que no me ama, no guarda mis palabras: y la palabra que habéis oído, no es mía, sino del Padre que me envió.',
    'Estas cosas os he hablado estando con vosotros.',
    'Mas el Consolador, el Espíritu Santo, al cual el Padre enviará en mi nombre, él os enseñará todas las cosas, y os recordará todas las cosas que os he dicho.',
    'La paz os dejo, mi paz os doy: no como el mundo la da, yo os la doy. No se turbe vuestro corazón, ni tenga miedo.',
    'Habéis oído cómo yo os he dicho: Voy, y vengo á vosotros. Si me amaseis, ciertamente os gozaríais, porque he dicho que voy al Padre: porque el Padre mayor es que yo.',
    'Y ahora os lo he dicho antes que se haga; para que cuando se hiciere, creáis.',
    'Ya no hablaré mucho con vosotros: porque viene el príncipe de este mundo; mas no tiene nada en mí.',
    'Empero para que conozca el mundo que amo al Padre, y como el Padre me dió el mandamiento, así hago. Levantaos, vamos de aquí.'
];

const SALMOS_23 = [
    'Jehová es mi pastor; nada me faltará.',
    'En lugares de delicados pastos me hará yacer: Junto á aguas de reposo me pastoreará.',
    'Confortará mi alma; Guiárame por sendas de justicia por amor de su nombre.',
    'Aunque ande en valle de sombra de muerte, No temeré mal alguno; porque tú estarás conmigo: Tu vara y tu cayado me infundirán aliento.',
    'Aderezarás mesa delante de mí, en presencia de mis angustiadores: Ungiste mi cabeza con aceite: mi copa está rebosando.',
    'Ciertamente el bien y la misericordia me seguirán todos los días de mi vida: Y en la casa de Jehová moraré por largos días.'
];

const comentarios = {
    meta: {
        dominio_publico: true,
        nota: 'Exposiciones históricas de Matthew Henry, Jamieson-Fausset-Brown, C. H. Spurgeon y Albert Barnes. Texto de dominio público. No es síntesis de IA.',
        autores: {
            matthew_henry: { etiqueta: 'Matthew Henry', obra: 'Exposition of the Old and New Testament', anio: 1710 },
            jfb: { etiqueta: 'Jamieson, Fausset y Brown', obra: 'Commentary Critical and Explanatory on the Whole Bible', anio: 1871 },
            spurgeon: { etiqueta: 'C. H. Spurgeon', obra: 'Sermones y exposiciones', anio: 1870 },
            barnes: { etiqueta: 'Albert Barnes', obra: 'Notes on the New Testament', anio: 1834 }
        }
    },
    pasajes: {
        romanos_12: {
            matthew_henry: {
                capitulo: 'El apóstol, habiendo cerrado la parte doctrinal en que prueba las grandes verdades del evangelio, pasa ahora a la parte práctica. La doctrina es para impulsar el deber. «Os ruego, pues, hermanos.» No usa aquí su autoridad apostólica como quien manda, sino que ruega con ternura, como quien ama. El motivo no es la ley como azote, sino «las misericordias de Dios»: las misericordias de la elección, de la justificación, de la vocación y de la perseverancia ya expuestas. Sobre esas misericordias pide una consagración total: el cuerpo sobre el altar, la mente renovada, los dones al servicio del cuerpo, y el amor que vence al mal con el bien.',
                1: '«Que presentéis vuestros cuerpos en sacrificio vivo.» En los sacrificios levíticos la víctima moría; aquí el cuerpo se presenta vivo: no una hora de culto, sino toda la vida. Es «santo», apartado para Dios; «agradable a Dios», no porque la carne agrade por sí, sino porque es acepto en Cristo. Este es «vuestro culto racional»: no el rito vacío, sino el servicio del entendimiento iluminado. El cuerpo, con todos sus miembros y facultades, ha de estar sobre el altar: ojos, lengua, manos, pies. Quien reserva para sí lo que Dios pide, no ha presentado el sacrificio. Henry insiste: el ruego apostólico se apoya en las misericordias ya demostradas; la consagración no compra el favor, lo responde.',
                2: '«No os conforméis a este siglo.» El siglo presente tiene un molde: costumbres, máximas y vanidades que quieren imprimirse en el pueblo de Dios. Conformarse es tomar esa figura. «Sino transformaos por medio de la renovación de vuestro entendimiento.» La palabra señala un cambio de forma, no un barniz. La mente renovada discierne «cuál sea la buena voluntad de Dios, agradable y perfecta». No se prueba la voluntad de Dios con el gusto del siglo, sino con una mente hecha nueva. Esta renovación es obra de la gracia; el creyente debe ceder a ella y no volver al molde del mundo.',
                3: 'Pablo habla «por la gracia que me es dada»: ni siquiera el apóstol se levanta sobre la medida que Dios le dio. El primer fruto de la mente renovada es la humildad. «No tenga más alto concepto de sí que el que debe tener.» El orgullo hincha; la fe mide. Cada uno ha de pensarse «con templanza», conforme a la medida de fe que Dios repartió. Nadie es dueño de su oficio; nadie desprecia el de otro. Henry observa que la soberbia eclesiástica es la primera enfermedad que el apóstol corta en la iglesia de Roma.',
                4: 'El cuerpo humano enseña a la iglesia. Hay muchos miembros y no todos tienen la misma operación. La diversidad no es defecto: es diseño. Querer que todos hagan lo mismo es pelear contra la sabiduría de Dios en la creación y en la gracia. Henry aplica: no envidies el miembro que brilla, ni desprecies el que sirve en lo oculto; ambos son necesarios al cuerpo.',
                5: '«Así muchos somos un cuerpo en Cristo.» La unidad no se fabrica por política, sino por unión a la Cabeza. En Cristo los muchos son uno; y siendo uno, son «miembros los unos de los otros». El bien del hermano es mi bien; su dolor es mi dolor. Quien se aísla del cuerpo se aísla de Cristo que lo gobierna. Esta es la eclesiología de Henry: comunión real, no mera asociación.',
                6: 'Los dones difieren «según la gracia que nos es dada». Nada se posee como mérito. Si el don es profecía, úsese «conforme a la medida de la fe»: no más allá de lo que Dios revela, ni menos de lo que debe anunciarse. Henry advierte contra dos excesos: el silencio cobarde y la invención presuntuosa. El profeta cristiano no es dueño de la Palabra; es siervo de ella.',
                7: 'El ministerio (diaconía) se ejercita sirviendo; el que enseña, en la doctrina. Cada don tiene su cauce. El servidor no ambiciona el púlpito, ni el maestro abandona el texto por anécdotas. Henry: quédate en tu llamado y llénalo. El cuerpo enferma cuando el pie quiere ser ojo, o cuando el ojo se niega a ver.',
                8: 'El que exhorta, en exhortar; el que reparte, en simplicidad (sin doblez ni ostentación); el que preside, con solicitud; el que hace misericordia, con alegría. Henry detiene la mirada en el último: la misericordia de mala gana no consuela. Dios ama al dador alegre. El gobierno en la iglesia no es trono, sino cuidado. La limosna no es teatro. Todo don, bien usado, es culto.',
                9: '«El amor sea sin fingimiento.» El apóstol pasa de los dones al carácter. El amor hipócrita es peor que la frialdad declarada. «Aborreciendo lo malo, llegándoos a lo bueno»: el amor santo no es indulgencia con el pecado. Henry: hay que odiar el mal en nosotros primero, y unirse al bien con afecto, no con etiqueta.',
                10: '«Amándoos los unos a los otros con caridad fraternal.» Es amor de hermanos, no de contratantes. «Previniéndoos con honra»: adelantarse a honrar al otro, no a exigirle honra. Henry ve aquí la cura de las rivalidades romanas: la carrera cristiana no es quién brilla, sino quién cede el primer lugar por amor.',
                11: '«En el cuidado no perezosos; ardientes en espíritu; sirviendo al Señor.» La diligencia no es fiebre carnal; el ardor no es fanatismo. El espíritu encendido se gasta en servir al Señor, no en servirse a sí. Henry: la pereza en los deberes santos es pecado; el celo sin servicio es humo.',
                12: 'Tres columnas del ánimo cristiano: gozo en la esperanza, paciencia en la tribulación, perseverancia en la oración. La esperanza hace cantar; la tribulación enseña a esperar; la oración sostiene ambas. Henry las une: quita la oración y el gozo se apaga; quita la esperanza y la tribulación te come.',
                13: '«Comunicando a las necesidades de los santos; siguiendo la hospitalidad.» La comunión de bienes en la necesidad es fruto del cuerpo. La hospitalidad se «sigue», se persigue: no se espera a que el huésped ruegue. Henry recuerda que muchos hospedaron ángeles sin saberlo, y que Cristo se recibe en los suyos.',
                14: '«Bendecid a los que os persiguen: bendecid y no maldigáis.» Aquí el evangelio contradice la carne. La ley del reino no es devolver injuria, sino bendecir. Henry: la maldición en la boca del perseguido niega el sermón del monte. Cristo en la cruz no maldijo; oró. Esa es la regla de su pueblo.',
                15: '«Gozaos con los que se gozan: llorad con los que lloran.» El amor toma el temple del hermano. Envidiar el gozo ajeno o pasar de largo el llanto es vivir fuera del cuerpo. Henry: es más difícil, a veces, alegrarse con el próspero que llorar con el afligido; ambas cosas pide la caridad.',
                16: '«Unánimes entre vosotros: no altivos, mas acomodándoos a los humildes. No seáis sabios en vuestra opinión.» La unidad muere en la altivez. El culto a la propia opinión es ídolo sutil. Henry exhorta a bajar hacia los humildes, como Cristo se humilló, y a no medir la iglesia por el ingenio de unos pocos.',
                17: '«No paguéis a nadie mal por mal; procurad lo bueno delante de todos los hombres.» La venganza privada usurpaba el juicio de Dios. El cristiano no sólo se abstiene del mal: busca lo honesto a la vista de todos, para que el evangelio no sea blasfemado. Henry: la honra de Cristo está atada a la honradez de los suyos.',
                18: '«Si se puede hacer, cuanto está en vosotros, tened paz con todos los hombres.» La paz se busca, no se compra con traición a la verdad. «Si se puede» admite que a veces la paz no depende de ti. Henry: haz tú lo que está de tu parte; el resto déjalo a Dios. No seas tú el ostón de la discordia.',
                19: '«No os venguéis vosotros mismos, amados míos; antes dad lugar a la ira.» Ceded el campo a la ira de Dios. «Mía es la venganza: yo pagaré, dice el Señor.» Henry: vengarte es decir que Dios tarda o que no es justo. La fe espera el tribunal; la carne lo adelanta. Los «amados» son llamados a confiar, no a desquitarse.',
                20: '«Si tu enemigo tuviere hambre, dale de comer.» La cita de Proverbios 25 enseña la victoria del bien. Las «ascuas de fuego» no son crueldad: son el rubor de una conciencia tocada por la bondad, o el juicio que Dios reserva. Henry prefiere la primera lectura para la práctica: vence al enemigo haciéndole bien, y deja el fuego al Señor.',
                21: '«No seas vencido de lo malo; mas vence con el bien el mal.» Este es el lema del capítulo. Ser vencido de lo malo es copiarlo: odiar como te odian, herir como te hieren. Vencer con el bien es la cruz aplicada. Henry cierra: el mal se reproduce por imitación; el bien, por gracia, lo apaga.'
            },
            jfb: {
                capitulo: 'Con el capítulo 12 comienza la sección hortatoria de la epístola. El «pues» enlaza el deber con la doctrina de los capítulos 1–11. La misericordia ya demostrada es el fundamento de la ética cristiana; no se invierte el orden. JFB divide el capítulo en consagración personal (1–2), humildad y dones en el cuerpo (3–8) y deberes del amor hacia dentro y hacia fuera (9–21).',
                1: '«Os ruego» (parakalō): exhortación solemne, no mero consejo. «Por las misericordias de Dios»: el plural recoge todo el argumento previo (justificación, adopción, esperanza, fidelidad de Dios a Israel). «Presentéis vuestros cuerpos»: el cuerpo, órgano de la vida práctica, se pone a disposición de Dios como en el rito de la ofrenda. «Sacrificio vivo»: contraste con las víctimas muertas de la ley. «Santo, agradable a Dios»: las dos notas del sacrificio acepto. «Culto racional» (logikēn latreian): servicio propio de criaturas racionales, no ceremonialismo externo.',
                2: '«No os conforméis» (mē syschēmatizesthe): no adoptéis el esquema (schēma) de este siglo, su moda pasajera. «Transformaos» (metamorphousthe): cambio de morphē, la forma esencial, no un disfraz. «Por la renovación de vuestro entendimiento»: el nous es el órgano del discernimiento moral. «Para que comprobéis» (eis to dokimazein): examinar y aprobar por experiencia. «La buena voluntad de Dios, agradable y perfecta»: tres adjetivos de una sola voluntad, no tres voluntades. El creyente no inventa la voluntad divina: la verifica al ser renovado.',
                3: '«Digo pues por la gracia que me es dada»: Pablo habla desde el carisma apostólico, no desde la presunción. «No tenga más alto concepto de sí» (mē hyperphronein par’ ho dei phronein): juego de phronein, pensar. La medida es «la fe que Dios repartió»: la fe aquí es la medida del don y del oficio, no un sentimiento privado. JFB: la soberbia espiritual es la primera amenaza a la unidad de Romanos 12.',
                4: 'La analogía del cuerpo (cf. 1 Corintios 12) se introduce para fundar la diversidad de funciones. «No tienen la misma operación» (praxis): distinta actividad, un solo organismo. JFB subraya que la comparación no es ornamento retórico: es la ontología de la iglesia.',
                5: '«Un cuerpo en Cristo»: la unidad es cristológica. «Miembros los unos de los otros»: recíproca pertenencia, no mera yuxtaposición. El individuo cristiano es inconcebible como átomo religioso. JFB ancla aquí la ética de los versículos siguientes: los dones son para el bien común.',
                6: '«Dones» (charismata) «según la gracia». La profecía se ejerce «conforme a la analogía de la fe» (analogian tēs pisteōs): el anuncio debe coincidir con la regla de la fe apostólica, no con visiones sueltas. JFB rechaza tanto el entusiasmo desordenado como la negación del don.',
                7: '«Ministerio» (diakonia): servicio práctico. «El que enseña, en doctrina»: el didáskalos permanece en la enseñanza. Cada participio señala permanencia en el don, no un oficio improvisado. JFB: la iglesia primitiva distinguía funciones sin fragmentar el cuerpo.',
                8: '«Simplicidad» (haplotēs) en el que reparte: liberalidad sin doblez. «Solicitud» (spoudē) en el que preside: diligencia, no dominio. «Alegría» en la misericordia: el tono del don forma parte del don. JFB nota la serie ascendente de lo público a lo íntimo del carácter.',
                9: '«Sin fingimiento» (anypókritos): no teatral. «Aborreciendo» (apostygoûntes) lo malo: verbo intenso. El amor cristiano tiene polo negativo (odio al mal) y positivo (adherirse al bien). JFB: no hay dilema entre amor y santidad.',
                10: '«Caridad fraternal» (philadelphia) y «honra» (timē). «Previniéndoos» (proēgoúmenoi): ir delante en honrar. JFB ve la cura de las facciones: la precedencia se cede, no se disputa.',
                11: '«No perezosos» (mē oknēroí) en el celo (spoudē). «Ardientes en espíritu» (tō pneúmati zéontes): el Espíritu enciende, no la carne. «Sirviendo al Señor»: el término del celo es el Kyrios, no el activismo. Algunos manuscritos leen kairō (el tiempo); JFB prefiere Kyriō, «al Señor».',
                12: 'Tres participios: gozosos, sufridos, constantes. La esperanza es el objeto del gozo; la tribulación, el campo de la hipomonē; la oración, el medio que no cesa. JFB: la ética paulina es escatológica y a la vez cotidiana.',
                13: '«Comunicando» (koinōnoûntes) a las necesidades: koinonía concreta. «Siguiendo» (diṓkontes) la hospitalidad: perseguirla, no concederla a regañadientes. JFB recuerda el contexto de itinerancia apostólica y pobreza de los santos.',
                14: 'Eco de Mateo 5:44. El imperativo «bendecid» se repite para excluir la maldición. JFB: la persecución se da por sentada; la respuesta no es opcional.',
                15: 'Infinitivos con fuerza de imperativo. La simpatía cristiana cubre prosperidad y duelo. JFB: el yo no es el centro del afecto; el hermano lo es.',
                16: '«Unánimes» (to auto phroneîn). «No altivos» (mē ta hypselà phronoûntes). «Acomodándoos a los humildes» (toîs tapeinoîs synapagómenoi): dejarse llevar hacia lo bajo. «No seáis sabios en vuestra opinión»: cf. Proverbios 3:7. JFB: la intelectualidad orgullosa rompe la phrónesis común.',
                17: '«No paguéis mal por mal»: lex talionis privada abolida. «Procurad lo bueno» (pronoúmenoi kalá) delante de todos: la conducta ha de ser irreprochable también ante el mundo. JFB cita 2 Corintios 8:21.',
                18: '«Si se puede… cuanto está en vosotros»: dos limitaciones. La paz no se impone contra la conciencia; tampoco se omite por capricho. JFB: el cristiano no es belicoso, pero no es un pacifista que silencia la verdad.',
                19: '«Dad lugar a la ira»: la orgē de Dios (Deuteronomio 32:35). La venganza personal es usurpación. JFB: «amados míos» suaviza el precepto más difícil para la carne.',
                20: 'Cita de Proverbios 25:21-22 (LXX). Las ascuas: o el arrepentimiento producido por la bondad, o el incremento de culpa si se endurece. JFB admite ambas lecturas y insiste en el deber: alimentar al enemigo.',
                21: 'Fórmula conclusiva. «No seas vencido» (mē nikô): el mal gana si te arrastra a su método. «Vence (níka) con el bien el mal»: la única victoria cristiana. JFB cierra el parágrafo ético con esta antítesis.'
            },
            barnes: {
                capitulo: 'Barnes observa que Pablo, tras el argumento teológico, aplica la verdad a la conducta. El capítulo no es un apéndice moralista: es la consecuencia necesaria de la doctrina de la gracia. La consagración (1–2), la modestia en los dones (3–8) y las reglas del amor (9–21) forman un solo movimiento: de la misericordia recibida a la vida ofrecida.',
                1: 'El verbo «ruego» indica el tono de la exhortación cristiana. Las «misericordias de Dios» son el argumento: lo que Dios ha hecho es razón suficiente para lo que el creyente debe hacer. «Presentar» es término sacrificial: poner la ofrenda ante el altar. «Cuerpos» incluye la persona entera en su vida corporal y visible. «Sacrificio vivo» se opone a los sacrificios muertos de la ley mosaica. «Santo» significa consagrado. «Agradable a Dios» afirma que tal consagración es el culto que Él aprueba. «Culto racional» designa un servicio inteligente, coherente con la naturaleza racional del hombre redimido.',
                2: '«Este siglo» es el orden presente de cosas, con sus máximas y prácticas. Conformarse es copiar ese patrón. La prohibición es presente y continua. «Transformaos» describe un cambio interior que se manifiesta al exterior, análogo a una metamorfosis. El instrumento es «la renovación de la mente»: nuevos juicios, nuevos afectos, nuevo criterio. El fin es «comprobar» la voluntad de Dios: no adivinarla, sino reconocerla como buena, agradable y perfecta cuando la mente ha sido renovada. Barnes insiste en que el mundo no es regla de la iglesia.',
                3: 'Pablo funda su consejo en la gracia apostólica. El peligro es la autoestima desmedida, frecuente donde hay dones. «Pensar con templanza» es el hábito de una mente sobria. La «medida de fe» es la porción que Dios asignó: nadie debe ir más allá de su don, ni sentirse inferior por tener otro. Barnes: la igualdad cristiana no borra las diferencias de oficio; las santifica.',
                4: 'La ilustración del cuerpo es tomada de la vida común y de 1 Corintios. Distintos miembros, distintas funciones, un solo fin. Barnes aplica: la envidia y el desprecio son pecados contra la anatomía de la iglesia.',
                5: 'La unión es «en Cristo», no en un pacto humano. Ser miembros unos de otros obliga a la simpatía y al servicio recíproco. Barnes: el cristiano no se pertenece; pertenece al cuerpo y, por él, al Señor.',
                6: 'Los charismata proceden de la gracia. La profecía —el hablar de parte de Dios para edificación— debe guardarse dentro de la analogía de la fe: la doctrina ya revelada es el límite y la guía. Barnes rechaza las pretensiones que contradicen el evangelio apostólico.',
                7: 'El ministerio es servicio; la enseñanza es exposición de la verdad. Cada uno ha de ocuparse en lo suyo con fidelidad. Barnes: el talento no justifica la invasión del oficio ajeno.',
                8: 'Exhortar es animar a la obediencia. Repartir, con liberalidad sincera. Presidir, con diligencia pastoral. Hacer misericordia, con alegría: porque la tristeza del benefactor amarga el don. Barnes detalla que el carácter del acto es parte de su obediencia.',
                9: 'El amor ha de ser genuino. Aborrecer el mal y adherirse al bien son los dos movimientos del mismo corazón santo. Barnes: un amor que no odia el pecado no es el amor de Romanos 12.',
                10: 'El afecto fraternal debe ir acompañado de honra recíproca. Adelantarse a honrar previene la contienda. Barnes ve aquí una regla de urbanidad cristiana más alta que la cortesía mundana.',
                11: 'No hay lugar para la indolencia en la religión. El espíritu ha de arder; el servicio es al Señor. Barnes: el celo perezoso es contradicción; el ardor que no sirve, también.',
                12: 'El gozo nace de la esperanza cristiana; la tribulación se lleva con paciencia; la oración se mantiene. Barnes une las tres como el temple del creyente en un mundo adverso.',
                13: 'La liberalidad hacia los santos pobres y la hospitalidad son deberes expresos de la iglesia apostólica. Barnes: la fe que no abre la casa ni la bolsa es fe muerta en la práctica.',
                14: 'Bendecir a los perseguidores es precepto positivo, repetido para que no se evada. Barnes cita el ejemplo de Cristo y de Esteban. Maldecir es el instinto; bendecir es la gracia.',
                15: 'La simpatía cristiana se alegra y llora con el prójimo. Barnes: el egoísmo se aísla en ambos casos; el amor entra en la alegría y en el duelo ajenos.',
                16: 'La unanimidad exige humildad. Condescender con los humildes imita a Cristo. La presunción de sabiduría propia es la raíz de cismas. Barnes: el orgullo intelectual es tan contrario al evangelio como el lujo.',
                17: 'No devolver mal por mal. Proveer cosas honestas a la vista de todos los hombres, para que el evangelio no sea acusado. Barnes apela a la conciencia pública como testigo, no como norma última.',
                18: 'La paz con todos, en cuanto dependa de nosotros. Barnes admite que la malicia ajena puede impedirla; no admite que seamos nosotros la causa.',
                19: 'La venganza pertenece a Dios. «Dar lugar a la ira» es no interceptar el juicio divino con nuestras manos. Barnes: Deuteronomio 32:35 sostiene al ofendido que espera.',
                20: 'Alimentar al enemigo es la aplicación concreta. Las ascuas sobre la cabeza: o el dolor saludable de la vergüenza que lleva al arrepentimiento, o el agravamiento de su culpa. Barnes, con Henry, inclina la práctica hacia la misericordia activa.',
                21: 'No permitas que el mal te conquiste haciéndote semejante a él. Véncelo con el bien: esta es la estrategia de la cruz. Barnes cierra el capítulo con esta máxima universal de la ética cristiana.'
            },
            spurgeon: {
                capitulo: 'Spurgeon predica este capítulo como el «por tanto» del evangelio: la doctrina ha de convertirse en consagración. Quien ha visto las misericordias de Dios no puede vivir para sí. El altar está listo; el cuerpo es la ofrenda; el siglo es el molde que hay que rechazar; el mal se vence con el bien, no con el mal.',
                1: 'Hermanos, el apóstol no azota: ruega. Y ruega «por las misericordias de Dios». Si el Calvario no te mueve a presentar el cuerpo, ¿qué lo hará? Un sacrificio vivo: no un impulso de un día, sino el altar de cada mañana. Santo: no un cuerpo manchado por el siglo y luego prestado a Dios una hora. Agradable a Dios: no porque tú valgas, sino porque Cristo cubre la ofrenda. Este es el culto racional: pensar, querer y obrar como quien ha sido comprado.',
                2: 'El mundo tiene un molde, y es fácil dejarse verter en él. «No os conforméis.» El cristiano no es una copia del siglo con barniz piadoso. «Transformaos.» La gracia no pinta la cara: cambia el ser. La renovación de la mente es el campo de batalla: pensamientos, juicios, amores. Allí se comprueba la voluntad de Dios. No preguntes primero qué dice la moda; pregunta qué dice el Señor. El siglo pasa; la voluntad de Dios permanece, buena, agradable y perfecta.',
                3: 'La gracia que hizo apóstol a Pablo le enseña a hablar bajito de sí mismo. Tú también, hermano, mide tu pluma con la fe que se te dio. El púlpito hinchado y el banco envidioso son la misma enfermedad. Piensa de ti con sobriedad: ni te pongas corona, ni te niegues al oficio que Dios te encargó.',
                4: 'Un cuerpo, muchos miembros, distintas obras. ¿Por qué el pie se queja de no ser mano? ¿Por qué el oído desprecia al ojo? En la iglesia de Cristo la envidia es ateísmo práctico: niega que el Espíritu distribuya como quiere.',
                5: 'Somos uno en Cristo, y por eso somos unos de otros. No puedes decir: «no te necesito». El miembro que se aísla se gangrena. Spurgeon: ama al cuerpo, o no amas a la Cabeza.',
                6: 'Los dones son gracia, no pedestales. Si profetizas, no desbordes la fe; no hagas de tu sueño una Escritura. Habla lo que Dios dio, y cállate donde Él calló.',
                7: 'Si tu don es servir, sirve. Si es enseñar, enseña el evangelio, no tus ocurrencias. El diaconado fiel pesa tanto en el cielo como el sermón elocuente. Quédate en tu surco y áralo hondo.',
                8: 'Exhorta de veras; da sin teatro; preside velando; apiádate con alegría. Una misericordia ceñuda es un sermón contra el evangelio. El Señor ama al que da con el rostro encendido de gozo, no al que echa la limosna como quien aparta un perro.',
                9: 'El amor de cera se derrite en la prueba. Que tu amor sea sangre, no barniz. Odia el mal como odias el veneno; pégate al bien como el imán al hierro. Un amor que sonríe al pecado es traición con beso.',
                10: 'Amaos como hermanos, no como rivales corteses. Adelántate a honrar. Es más dulce poner la corona en la cabeza del otro que quitársela. En el reino, el primero es el que se abaja.',
                11: 'No seas perezoso en el negocio santo. El espíritu ha de hervir, no tibiarse. Y todo ese fuego, ¿a quién sirve? Al Señor. El celo que se sirve a sí mismo es ídolo con himnos.',
                12: 'Canta en la esperanza; aguanta en el fuego; no sueltes la rodilla. La oración es el fuelle del gozo y el bálsamo de la tribulación. El que deja de orar pronto deja de alegrarse y de padecer como cristiano.',
                13: 'Abre la bolsa a los santos pobres y la puerta al forastero. La hospitalidad no es lujo de ricos: es ley de la familia de Dios. Cristo llama a la puerta en el hermano que no tiene lecho.',
                14: 'Bendice al que te persigue. Sí, bendice: la segunda vez lo dice para que no se te olvide cuando te hierva la sangre. El maldiciente no ha estado al pie de la cruz. Allí se bendice con los clavos puestos.',
                15: 'Ríe con el que ríe; llora con el que llora. No seas estatua en las bodas ni piedra en el funeral. El corazón de Cristo late en el gozo y en el duelo de los suyos.',
                16: 'Un mismo sentir, sin altanería. Siéntate con los humildes. El que se cree el oráculo del grupo ya ha partido la iglesia en su pecho. La sabiduría propia es un ídolo de biblioteca.',
                17: 'No devuelvas golpe por golpe. Procura lo honesto a la vista de todos, para que no den lástima el evangelio y tú juntos. La venganza es un lujo que el cristiano no puede permitirse.',
                18: 'En cuanto de ti dependa, paz. No serás tú el que encienda la casa. Si el otro no quiere paz, tú no habrás sido el fósforo. La paloma no anida en el puño cerrado.',
                19: 'No tomes la espada que es de Dios. «Mía es la venganza.» Si pagas tú, le quitas al Juez su oficio y te cargas su ira. Espera, amado: el tribunal no cierra.',
                20: 'Si el enemigo tiene hambre, ponle mesa. El carbón sobre su cabeza no es tu saña: es el fuego que la bondad enciende en su conciencia, o el juicio que tú no manejarás. Tú da pan; Dios dará cuenta.',
                21: 'No dejes que el mal te gane el corazón copiándose en ti. Vence con el bien. Esta es la batalla de los hijos de la luz: no más oscuros que las tinieblas, sino lámparas en medio de ellas.'
            }
        },
        juan_14: {
            matthew_henry: {
                capitulo: 'Cristo consuela a los suyos en la víspera de la cruz: no se turbe el corazón; Él es el camino al Padre; el Espíritu será enviado; la paz de Cristo no es la del mundo. Henry lee el capítulo como el testamento de amor del Redentor a una iglesia que pronto le verá partir.',
                1: '«No se turbe vuestro corazón.» El Señor conoce el miedo de los discípulos ante su partida. El remedio no es la estoica indiferencia, sino la fe: «creéis en Dios, creed también en mí». Henry: la misma fe que descansa en el Padre ha de descansar en el Hijo; negar al uno es vaciar al otro.',
                6: 'Cristo no muestra un camino entre muchos: Él mismo es el camino. No ofrece una verdad entre opiniones: Él es la verdad. No señala una vida aparte de sí: Él es la vida. «Nadie viene al Padre, sino por mí.» El consuelo de los discípulos no está en un método, sino en una Persona. Apartarse de Cristo es perder el acceso al Padre.',
                16: '«Otro Consolador»: no un sustituto menor, sino otro de la misma ayuda, el Espíritu Santo, para que esté con ellos para siempre. Henry: Cristo no deja huérfanos; su ausencia visible se llena con una presencia interior más íntima.',
                27: '«La paz os dejo, mi paz os doy.» No es la paz del mundo, que depende de circunstancias. Es la paz del testamento de Cristo, sellada con su sangre. «No se turbe vuestro corazón, ni tenga miedo.» Henry cierra el consuelo donde lo empezó: el corazón quieto en el Señor que se va y vuelve.'
            },
            jfb: {
                capitulo: 'JFB sitúa Juan 14 en el discurso de despedida. El tema es la partida de Jesús y la provisión que deja: moradas, camino, conocimiento del Padre, obras mayores, oración en su nombre, el Paráclito y la paz.',
                1: 'La turbación del corazón se corrige con la fe en Dios y en Cristo, puestas en paralelo. JFB: la deidad del Hijo se afirma al exigir la misma confianza que se da al Padre.',
                6: '«Yo soy el camino, y la verdad, y la vida.» Tres predicados con un solo sujeto. El camino al Padre no es un sistema; es Cristo. La verdad no es un conjunto de proposiciones sueltas; es Él. La vida no es un estado psicológico; es Él. La cláusula final excluye todo acceso independiente: «nadie viene al Padre, sino por mí».',
                16: 'állon paráklēton: otro Paráclito, no héteron (de distinta clase). Permanencia «para siempre». JFB: la Trinidad se manifiesta en la misión del Espíritu por el Padre a petición del Hijo.',
                27: 'La paz es legado (aphíēmi) y don (dídōmi). Contraste explícito con la paz del mundo. JFB: el «no se turbe» del v. 1 se repite coronado por este don.'
            },
            barnes: {
                capitulo: 'Barnes lee Juan 14 como consuelo pastoral: Jesús explica a dónde va, quién es el camino, cómo se conoce al Padre, y qué hará el Espíritu en su ausencia.',
                1: 'La fe en Cristo es el antídoto de la turbación. Barnes: si Dios es digno de confianza, también lo es Aquel que se declara uno con Él.',
                6: 'Cristo es el único mediador. No hay senda al Padre que no pase por el Hijo. Barnes insiste en la exclusividad del evangelio contra todo acceso meramente ritual o filosófico.',
                16: 'El Consolador es persona divina, no influencia impersonal. «Para siempre» asegura a la iglesia de todos los siglos. Barnes: la promesa no caduca con los apóstoles.',
                27: 'La paz de Cristo es objetiva (reconciliación) y subjetiva (sosiego). El mundo da paces frágiles. Barnes: no temáis; el legado está en vigor.'
            },
            spurgeon: {
                capitulo: 'Spurgeon predica Juan 14 a los turbados: creed en Cristo como creéis en Dios; Él prepara lugar; Él es el camino; el Espíritu os acompañará; su paz os basta en Getsemaní y en el sepulcro.',
                1: 'El corazón se turba cuando mira la cruz sin mirar al Crucificado que habla. «Creed también en mí.» Spurgeon: la fe en Jesús es almohada para la noche más oscura.',
                6: 'No hay atajo al Padre. Cristo no es un cartel en el camino: es el camino. Fuera de Él, la verdad se vuelve opinión y la vida, supervivencia. Nadie viene al Padre sino por este Hijo amado.',
                16: 'Otro Consolador, no un consuelo barato. El Espíritu se queda cuando los predicadores se van y cuando los sepulcros se cierran. Spurgeon: no estáis huérfanos; el cielo os ha enviado compañía eterna.',
                27: 'Mi paz, no la del mercado. El mundo la da y la quita; Cristo la deja como herencia. No se turbe vuestro corazón: el testamento está firmado con sangre.'
            }
        },
        salmos_23: {
            matthew_henry: {
                capitulo: 'Henry medita el salmo como el cántico del rebaño bajo el Pastor-Jehová: provisión, reposo, guía, compañía en el valle, mesa ante los enemigos y morada perpetua. Todo fluye de la primera cláusula: «Jehová es mi pastor».',
                1: '«Jehová es mi pastor.» El salmista no dice sólo que el Señor apacienta, sino que es suyo. De ahí sigue: «nada me faltará». La suficiencia no está en el rebaño ni en el valle, sino en el Pastor. Quien tiene a Jehová por pastor no anda en falta de lo que su cuidado ordena.',
                2: 'Pastos delicados y aguas de reposo: el Pastor no conduce al agotamiento, sino al alimento y a la quietud. Henry: el reposo del alma es don, no conquista del nervio.',
                3: 'Restaura el alma y guía por sendas de justicia, no por atajos de conveniencia, «por amor de su nombre». La gloria de Dios es el motivo de la guía. Henry: el Pastor no puede deshonrar su nombre abandonando al oveja.',
                4: 'El valle de sombra de muerte no anula la compañía. «Tú estarás conmigo»: el tuteo nace en la tiniebla. Vara y cayado: disciplina y apoyo. Henry: el miedo se va cuando el Pastor se hace presente, no cuando el valle se acaba.',
                5: 'Mesa, unción, copa rebosante: hospitalidad real en presencia de los enemigos. El Pastor es también Anfitrión. Henry: la abundancia del santo no espera a que desaparezcan los adversarios.',
                6: 'El bien y la misericordia persiguen al siervo todos los días; el fin es la casa de Jehová por largos días. Henry: la perseverancia no es estoicismo; es ser seguido por la bondad hasta el umbral de la gloria.'
            },
            jfb: {
                capitulo: 'Salmo de David. JFB lo lee como confianza pastoral: Jehová pastorea (1–4) y hospeda (5–6). El cambio de tercera a segunda persona en el valle marca la intimidad del peligro.',
                1: 'Jehová como pastor implica propiedad y cuidado. «Nada me faltará» es conclusión de fe, no inventario de bienes presentes.',
                2: 'Pastizales y aguas: provisión y descanso. JFB: el hiphil subraya la acción del Pastor, no el esfuerzo de la oveja.',
                3: 'Restauración del alma y sendas de justicia por causa del Nombre. La ética del rebaño es teocéntrica.',
                4: 'Valle de sombra de muerte: el peor trance. La vara (disciplina) y el cayado (guía) consuelan. JFB: la presencia («tú») es el argumento contra el temor.',
                5: 'Banquete ante adversarios: victoria ya gustada. Aceite y copa: abundancia de huésped real.',
                6: 'Tov y hesed siguen al salmista. La casa de Jehová es el término, no un paréntesis. JFB: la esperanza es cultual y escatológica a la vez.'
            },
            barnes: {
                capitulo: 'Barnes expone el salmo como cuadro completo del cuidado divino: alimento, reposo, restauración, compañía en el peligro, honor ante enemigos y morada final.',
                1: 'La relación de pastor y oveja era cotidiana en Israel. «Nada me faltará» se entiende de lo que el Pastor juzga necesario, no de todos los caprichos.',
                2: 'El reposo es tan providencia como el pasto. Barnes: Dios apacienta y hace yacer.',
                3: 'El alma desfallecida es devuelta. Las sendas justas glorifican el nombre de Dios. Barnes: la guía moral es parte del pastoreo.',
                4: 'La muerte y sus sombras no quitan al Pastor. Vara y cayado infunden aliento porque están en su mano, no en la nuestra.',
                5: 'La mesa en presencia de enemigos muestra seguridad. La unción y la copa hablan de festín, no de ración de sitio.',
                6: 'La misericordia no es visita: persigue. La casa de Jehová es el hogar definitivo del rebaño.'
            },
            spurgeon: {
                capitulo: 'Spurgeon llama a este salmo la «perla de los salmos»: corto, completo, cantable en el lecho y en el templo. El Pastor basta; el valle no es el fin; la casa espera.',
                1: 'Si Jehová es pastor, la falta es imposibilidad. El rebaño pobre con Pastor rico no es pobre. Spurgeon: di «mi» pastor, o el salmo no te alimenta.',
                2: 'Él me hace yacer. La gracia nos tumba en el pasto cuando nosotros seguiríamos corriendo. Las aguas de reposo no se merecen: se pastorean.',
                3: 'El alma se restaura porque el Nombre está en juego. Dios no puede permitirse perder una oveja sin deshonrarse. Esa es nuestra seguridad, no nuestra fidelidad.',
                4: 'En el valle se pasa del «él» al «tú». La tiniebla enseña a tutear. No temeré, no porque el valle sea bello, sino porque Tú estás. La vara que corrige también consuela.',
                5: 'Mesa puesta mientras el enemigo mira. Eso es gracia insolente, santa. La copa no está a medias: rebosa. Spurgeon: el santo tiene banquete en el campo de batalla.',
                6: 'Bondad y misericordia nos persiguen como sabuesos del cielo. Y el último tramo no es un hotel: es la casa de Jehová, para morar, no para visitar.'
            }
        }
    }
};

const indice = {
    fuente: META.fuente,
    capitulos: [
        { archivo: 'romanos-12.json', libro: 'Romanos', capitulo: 12, versiculos: ROMANOS_12.length },
        { archivo: 'juan-14.json', libro: 'Juan', capitulo: 14, versiculos: JUAN_14.length },
        { archivo: 'salmos-23.json', libro: 'Salmos', capitulo: 23, versiculos: SALMOS_23.length }
    ]
};

const files = {
    'romanos-12.json': capitulo('Romanos', 12, ROMANOS_12),
    'juan-14.json': capitulo('Juan', 14, JUAN_14),
    'salmos-23.json': capitulo('Salmos', 23, SALMOS_23),
    'comentarios.json': comentarios,
    'capitulos-indice.json': indice
};

for (const [name, body] of Object.entries(files)) {
    const json = JSON.stringify(body, null, 2);
    writeFileSync(join(dataDir, name), json);
    writeFileSync(join(publicDir, name), json);
}

console.log('OK', Object.keys(files).join(', '));
console.log('Romanos 12 versos:', ROMANOS_12.length);
console.log('Juan 14 versos:', JUAN_14.length);
console.log('Salmos 23 versos:', SALMOS_23.length);
