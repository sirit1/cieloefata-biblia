/**
 * Éfata RevelatiO — bible-data.js
 * Canon, contadores de capítulos, fichas académicas y lentes de perspectiva.
 */
(function (global) {
    "use strict";

    const capVv = (s) => s.split(".").map(Number);

    const AT = [
        { n: 'Génesis', c: 50 }, { n: 'Éxodo', c: 40 }, { n: 'Levítico', c: 27 }, { n: 'Números', c: 36 }, { n: 'Deuteronomio', c: 34 },
        { n: 'Josué', c: 24 }, { n: 'Jueces', c: 21 }, { n: 'Rut', c: 4 }, { n: '1 Samuel', c: 31 }, { n: '2 Samuel', c: 24 },
        { n: '1 Reyes', c: 22 }, { n: '2 Reyes', c: 25 }, { n: '1 Crónicas', c: 29 }, { n: '2 Crónicas', c: 36 }, { n: 'Esdras', c: 10 },
        { n: 'Nehemías', c: 13 }, { n: 'Ester', c: 10 }, { n: 'Job', c: 42 }, { n: 'Salmos', c: 150 }, { n: 'Proverbios', c: 31 },
        { n: 'Eclesiastés', c: 12 }, { n: 'Cantares', c: 8 }, { n: 'Isaías', c: 66 }, { n: 'Jeremías', c: 52 }, { n: 'Lamentaciones', c: 5 },
        { n: 'Ezequiel', c: 48 }, { n: 'Daniel', c: 12 }, { n: 'Oseas', c: 14 }, { n: 'Joel', c: 3 }, { n: 'Amós', c: 9 },
        { n: 'Abdías', c: 1 }, { n: 'Jonás', c: 4 }, { n: 'Miqueas', c: 7 }, { n: 'Nahúm', c: 3 }, { n: 'Habacuc', c: 3 },
        { n: 'Sofonías', c: 3 }, { n: 'Hageo', c: 2 }, { n: 'Zacarías', c: 14 }, { n: 'Malaquías', c: 4 }
    ];

    const NT = [
        { n: 'Mateo', c: 28 }, { n: 'Marcos', c: 16 }, { n: 'Lucas', c: 24 }, { n: 'Juan', c: 21 }, { n: 'Hechos', c: 28 },
        { n: 'Romanos', c: 16 }, { n: '1 Corintios', c: 16 }, { n: '2 Corintios', c: 13 }, { n: 'Gálatas', c: 6 }, { n: 'Efesios', c: 6 },
        { n: 'Filipenses', c: 4 }, { n: 'Colosenses', c: 4 }, { n: '1 Tesalonicenses', c: 5 }, { n: '2 Tesalonicenses', c: 3 }, { n: '1 Timoteo', c: 6 },
        { n: '2 Timoteo', c: 4 }, { n: 'Tito', c: 3 }, { n: 'Filemón', c: 1 }, { n: 'Hebreos', c: 13 }, { n: 'Santiago', c: 5 },
        { n: '1 Pedro', c: 5 }, { n: '2 Pedro', c: 3 }, { n: '1 Juan', c: 5 }, { n: '2 Juan', c: 1 }, { n: '3 Juan', c: 1 },
        { n: 'Judas', c: 1 }, { n: 'Apocalipsis', c: 22 }
    ];

    const VERSOS_CAP = {
        'Génesis': capVv('31.25.24.26.32.22.24.22.29.32.32.20.18.24.21.16.27.33.38.18.34.24.20.67.34.35.46.22.35.43.55.32.20.31.29.43.36.30.23.23.57.38.34.34.28.34.31.22.33.26'),
        'Éxodo': capVv('22.25.22.31.23.30.25.32.35.29.10.51.22.31.27.36.16.27.25.26.36.31.33.18.40.37.21.43.46.29.36.18'),
        'Levítico': capVv('17.16.17.35.19.30.38.36.24.20.47.8.59.57.33.34.16.30.37.27.24.33.44.23.55.46.34'),
        'Números': capVv('54.34.51.49.31.27.89.26.23.36.35.16.33.45.41.50.13.32.22.29.35.41.30.25.18.65.23.31.40.16.54.42.56.29.34.13'),
        'Deuteronomio': capVv('46.37.29.49.33.25.26.20.29.22.32.32.18.29.23.22.20.22.21.20.23.30.25.22.19.19.26.68.30.30.34.35.30.24.29.30'),
        'Josué': capVv('18.24.17.24.15.27.26.35.27.43.23.24.33.15.63.10.18.28.51.9.45.34.16.33'),
        'Jueces': capVv('36.23.31.24.31.40.25.35.57.18.40.15.25.20.20.31.13.31.30.48.25'),
        'Rut': capVv('22.23.18.22'),
        '1 Samuel': capVv('28.36.21.22.12.21.17.22.27.27.15.25.23.52.35.23.58.30.24.43.15.23.28.23.44.25.12.25.11.31.13'),
        '2 Samuel': capVv('27.32.39.12.25.23.29.18.13.19.27.31.39.33.37.23.29.33.43.26.22.51.39.25'),
        '1 Reyes': capVv('53.46.28.34.18.38.51.66.28.29.43.33.34.31.34.31.27.24.26.25.21.29.23.25.27'),
        '2 Reyes': capVv('18.26.22.16.20.12.29.17.18.20.10.13.21.12.21.19.13.15.25'),
        '1 Crónicas': capVv('54.55.24.43.26.81.40.40.44.14.47.40.14.17.29.43.27.17.19.8.30.19.32.31.31.32.34.21.30'),
        '2 Crónicas': capVv('17.18.17.22.14.42.22.18.31.19.23.16.22.15.19.14.19.34.11.37.20.12.21.27.28.23.9.27.36.27.21.33.25.33.27.23'),
        'Esdras': capVv('11.70.13.24.17.22.28.36.15.44'),
        'Nehemías': capVv('11.20.32.23.19.19.73.18.38.39.36.47.31'),
        'Ester': capVv('22.23.15.17.14.14.10.17.32.3'),
        'Job': capVv('22.13.26.21.27.30.21.22.35.22.20.25.28.22.35.22.16.21.29.29.34.30.17.25.6.14.23.28.25.31.40.22.33.37.16.33.24.41.30.24.34.17'),
        'Salmos': capVv('6.12.8.8.12.10.17.9.20.18.7.8.6.7.5.11.15.50.14.9.13.31.6.10.22.12.14.9.11.12.24.11.22.22.28.12.40.22.13.17.13.11.5.26.17.11.9.14.20.23.19.9.6.7.23.13.11.11.9.7.8.8.10.11.12.10.7.10.15.22.9.20.6.9.9.9.5.13.5.10.14.13.6.13.11.11.8'),
        'Proverbios': capVv('33.22.35.27.23.35.27.36.18.32.31.28.26.35.33.33.31.22.29.35.30.31.29.31.35.30.22.31.25.24.32'),
        'Eclesiastés': capVv('18.26.22.16.20.12.29.17.18.20.10.20'),
        'Cantares': capVv('17.17.11.16.16.13.13.14'),
        'Isaías': capVv('31.22.26.6.30.13.25.22.21.34.16.6.22.32.9.14.14.7.25.6.17.25.18.23.12.21.13.29.24.33.9.20.24.17.10.22.38.22.8.31.29.25.28.28.25.13.15.22.26.11.23.15.12.17.13.12.21.14.21.22.11.12.19.12.25.24'),
        'Jeremías': capVv('19.37.25.31.31.30.34.22.26.25.23.17.27.22.21.21.27.23.15.18.14.30.40.10.38.24.22.17.32.24.40.44.26.22.19.32.21.28.18.16.18.22.13.30.5.28.7.47.39.46.64.34'),
        'Lamentaciones': capVv('22.22.66.22.22'),
        'Ezequiel': capVv('28.10.27.17.17.14.27.18.11.22.25.28.23.23.8.63.24.32.14.49.32.31.49.27.17.21.36.26.21.26.18.32.33.31.15.38.28.23.29.49.26.20.27.31.25.24.23.35'),
        'Daniel': capVv('21.49.30.37.31.28.28.27.27.21.45.13'),
        'Oseas': capVv('11.23.5.19.15.11.16.14.17.15.12.14.16.9'),
        'Joel': capVv('20.32.21'),
        'Amós': capVv('15.16.15.13.27.14.17.14.15'),
        'Abdías': capVv('21'),
        'Jonás': capVv('17.10.10.11'),
        'Miqueas': capVv('16.13.12.13.15.16.20'),
        'Nahúm': capVv('15.13.19'),
        'Habacuc': capVv('17.20.19'),
        'Sofonías': capVv('18.15.20'),
        'Hageo': capVv('15.23'),
        'Zacarías': capVv('21.13.10.14.11.15.14.23.17.12.17.14.9.21'),
        'Malaquías': capVv('14.17.18.6'),
        'Mateo': capVv('25.23.17.25.48.34.29.34.38.42.30.50.58.36.39.28.27.35.30.34.46.46.39.51.46.28.36.52'),
        'Marcos': capVv('45.28.35.41.43.56.37.38.50.52.33.44.37.72.47.20'),
        'Lucas': capVv('80.52.38.44.39.49.50.56.62.42.54.59.35.35.32.31.37.43.48.47.38.71.56.53'),
        'Juan': capVv('51.25.36.54.47.71.53.59.41.42.57.50.38.31.27.33.26.40.42.31.25'),
        'Hechos': capVv('26.47.26.37.42.15.60.40.43.48.30.25.52.28.41.40.34.28.41.38.40.30.35.27.27.32.44.31'),
        'Romanos': capVv('32.29.31.25.21.23.25.39.33.21.36.21.14.23.33.27'),
        '1 Corintios': capVv('31.16.23.21.13.20.40.13.27.33.35.30.24.21.18.43'),
        '2 Corintios': capVv('24.17.18.18.21.18.16.24.15.18.33.21.14'),
        'Gálatas': capVv('24.17.18.18.21.11'),
        'Efesios': capVv('23.22.21.32.33.24'),
        'Filipenses': capVv('30.30.21.23'),
        'Colosenses': capVv('29.23.25.18'),
        '1 Tesalonicenses': capVv('10.20.13.18.28'),
        '2 Tesalonicenses': capVv('12.17.18'),
        '1 Timoteo': capVv('20.15.16.16.25.21'),
        '2 Timoteo': capVv('18.26.17.22'),
        'Tito': capVv('16.15.15'),
        'Filemón': capVv('25'),
        'Hebreos': capVv('14.18.19.16.14.20.28.13.28.39.40.29.25'),
        'Santiago': capVv('27.16.21.27.16'),
        '1 Pedro': capVv('25.25.22.19.14'),
        '2 Pedro': capVv('21.22.18'),
        '1 Juan': capVv('10.29.24.21.21'),
        '2 Juan': capVv('13'),
        '3 Juan': capVv('14'),
        'Judas': capVv('25'),
        'Apocalipsis': capVv('20.29.22.11.14.17.17.13.21.11.19.17.18.20.8.21.18.24.21.15.27.21')
    };

    const VERSION_LABEL = {
        rv1960: 'RVR1909',
        rv1909: 'RVR1909',
        kjv: 'KJV',
        tla: 'TLA',
        dhh: 'DHH',
        septuaginta: 'Biblia Textual',
        textual: 'Biblia Textual',
        lxx: 'Biblia Textual'
    };

    const FICHAS_ACADEMICAS = {
        'Génesis': { autor: 'Moisés (tradición pentateucal)', fecha: 'c. s. XV–XIII a.C. (marco mosaico)', quien: 'Israel ante el Creador y las promesas a los patriarcas', como: 'Narrativa primordial y patriarcal; prosa histórica teológica', donde: 'Oriente Próximo / itinerario patriarcal', cuando: 'Desde la creación hasta José en Egipto' },
        'Éxodo': { autor: 'Moisés', fecha: 'c. s. XV–XIII a.C.', quien: 'Israel liberado de Egipto bajo Yahvé', como: 'Narrativa de redención + legislación del pacto', donde: 'Egipto, Sinaí y el desierto', cuando: 'Éxodo y constitución del pueblo del pacto' },
        'Salmos': { autor: 'David y otros salmistas (colección canónica)', fecha: 'Composición multiépoca; canonización postexílica', quien: 'El pueblo que ora y adora ante Yahvé', como: 'Poesía litúrgica, lamento, himno y sabiduría', donde: 'Israel / culto del templo', cuando: 'Vida de fe a lo largo de la historia de Israel' },
        'Isaías': { autor: 'Isaías hijo de Amoz (y tradición isaínica)', fecha: 's. VIII a.C. (núcleo); horizonte hasta el consuelo', quien: 'Judá ante el Santo de Israel', como: 'Profecía oracular, juicio y esperanza mesiánica', donde: 'Jerusalén / Judá', cuando: 'Crisis asiria y horizonte de restauración' },
        'Mateo': { autor: 'Mateo (Leví), apóstol', fecha: 'c. 60–70 d.C.', quien: 'Comunidad judío-cristiana ante el Mesías', como: 'Evangelio narrativo-didáctico con cumplimiento', donde: 'Judea / Galilea; audiencia con trasfondo judío', cuando: 'Ministerio, muerte y resurrección de Jesús' },
        'Juan': { autor: 'Juan el apóstol', fecha: 'c. 80–90 d.C.', quien: 'Discípulos llamados a creer que Jesús es el Cristo', como: 'Evangelio teológico con signos y discursos', donde: 'Palestina; tradición joanina', cuando: 'Vida pública de Jesús y testimonio apostólico' },
        'Hechos': { autor: 'Lucas', fecha: 'c. 62–70 d.C.', quien: 'La iglesia apostólica bajo el Espíritu', como: 'Historia teológica del avance del evangelio', donde: 'Jerusalén → Antioquía → Imperio romano', cuando: 'Pentecostés hasta el ministerio de Pablo' },
        'Romanos': { autor: 'Pablo el apóstol', fecha: 'c. 56–58 d.C.', quien: 'Iglesia en Roma (judíos y gentiles en Cristo)', como: 'Epístola doctrinal: justificación y vida nueva', donde: 'Escrita probablemente desde Corinto hacia Roma', cuando: 'Antes del viaje de Pablo a Jerusalén/Roma' },
        '1 Corintios': { autor: 'Pablo', fecha: 'c. 54–55 d.C.', quien: 'Iglesia de Corinto en crisis moral y doctrinal', como: 'Epístola pastoral y correctiva', donde: 'Corinto / Acaya', cuando: 'Ministerio paulino en Éfeso hacia Corinto' },
        '2 Corintios': { autor: 'Pablo', fecha: 'c. 55–56 d.C.', quien: 'Iglesia de Corinto tras conflicto y reconciliación', como: 'Apología ministerial y teología de la cruz', donde: 'Macedonia → Corinto', cuando: 'Tras visitas y cartas intermedias' },
        'Gálatas': { autor: 'Pablo', fecha: 'c. 48–55 d.C.', quien: 'Iglesias de Galacia tentadas por otro evangelio', como: 'Epístola polémica: justificación por la fe', donde: 'Galacia (Asia Menor)', cuando: 'Crisis judaizante temprana' },
        'Efesios': { autor: 'Pablo', fecha: 'c. 60–62 d.C. (cautiverio)', quien: 'Santos en Éfeso / Asia; cuerpo de Cristo', como: 'Epístola de la iglesia y la unidad en Cristo', donde: 'Éfeso / región asiática; desde prisión', cuando: 'Cautiverio romano' },
        'Filipenses': { autor: 'Pablo', fecha: 'c. 60–62 d.C.', quien: 'Iglesia de Filipos, socios en el evangelio', como: 'Carta de gozo, humildad y perseverancia', donde: 'Filipos; escrita desde prisión', cuando: 'Cautiverio paulino' },
        'Colosenses': { autor: 'Pablo', fecha: 'c. 60–62 d.C.', quien: 'Iglesia de Colosas ante filosofías vacías', como: 'Cristología cósmica y vida nueva', donde: 'Colosas; desde prisión', cuando: 'Cautiverio romano' },
        '1 Tesalonicenses': { autor: 'Pablo', fecha: 'c. 50–51 d.C.', quien: 'Jóvenes creyentes de Tesalónica', como: 'Epístola escatológica y pastoral', donde: 'Tesalónica / Macedonia', cuando: 'Segundo viaje misionero' },
        '2 Tesalonicenses': { autor: 'Pablo', fecha: 'c. 51–52 d.C.', quien: 'Iglesia de Tesalónica ante confusión escatológica', como: 'Corrección sobre el Día del Señor', donde: 'Tesalónica', cuando: 'Poco después de 1 Tesalonicenses' },
        '1 Timoteo': { autor: 'Pablo', fecha: 'c. 62–64 d.C.', quien: 'Timoteo como pastor en Éfeso', como: 'Epístola pastoral: orden y doctrina', donde: 'Éfeso', cuando: 'Ministerio post-liberación / madurez paulina' },
        '2 Timoteo': { autor: 'Pablo', fecha: 'c. 64–67 d.C.', quien: 'Timoteo ante el fin del ministerio de Pablo', como: 'Testamento pastoral; Escritura inspirada', donde: 'Roma (prisión final)', cuando: 'Umbral del martirio paulino' },
        'Tito': { autor: 'Pablo', fecha: 'c. 62–64 d.C.', quien: 'Tito organizando iglesias en Creta', como: 'Epístola pastoral de orden y piedad', donde: 'Creta', cuando: 'Misión de consolidación' },
        'Hebreos': { autor: 'Anónimo apostólico (tradición: entorno paulino)', fecha: 'c. 60–70 d.C.', quien: 'Creyentes hebreos tentados a volver atrás', como: 'Homilía/epístola cristológica y sacerdotal', donde: 'Comunidad judío-cristiana (destino debatido)', cuando: 'Antes de la destrucción del templo (probable)' },
        'Santiago': { autor: 'Santiago, hermano del Señor', fecha: 'c. 45–49 d.C.', quien: 'Las doce tribus en la dispersión', como: 'Sabiduría práctica de fe obradora', donde: 'Jerusalén / diáspora', cuando: 'Iglesia primitiva judía' },
        '1 Pedro': { autor: 'Pedro el apóstol', fecha: 'c. 62–64 d.C.', quien: 'Extranjeros elegidos en Asia Menor', como: 'Epístola de esperanza en el sufrimiento', donde: 'Asia Menor; desde “Babilonia” (Roma)', cuando: 'Presión imperial temprana' },
        '2 Pedro': { autor: 'Pedro', fecha: 'c. 64–68 d.C.', quien: 'Creyentes ante falsos maestros', como: 'Advertencia escatológica y certeza profética', donde: 'Iglesias del entorno petrino', cuando: 'Cercano al martirio de Pedro' },
        '1 Juan': { autor: 'Juan el apóstol', fecha: 'c. 85–95 d.C.', quien: 'Comunidad joanina ante el engaño', como: 'Epístola teológica: luz, amor y verdad', donde: 'Éfeso / tradición joanina', cuando: 'Iglesia madura del siglo I' },
        'Apocalipsis': { autor: 'Juan', fecha: 'c. 95 d.C.', quien: 'Siete iglesias de Asia ante la tribulación', como: 'Profecía apocalíptica; Cordero victorioso', donde: 'Patmos → Asia Menor', cuando: 'Persecución domicianea (marco tradicional)' },
    };

    /**
     * Contexto histórico introductorio por libro (Fase 1 · Lector / Modo Aposento).
     * Campos: autor · fecha · destinatarios · resumen_historico (máx. ~2 líneas).
     */
    const CONTEXTO_HISTORICO = {
        'Génesis': {
            autor: 'Moisés (tradición pentateucal)',
            fecha: 'Aprox. s. XV–XIII a.C.',
            destinatarios: 'Israel ante el Creador y la promesa',
            resumen_historico: 'Narra los orígenes del mundo, del pecado y del pueblo elegido: de Adán a José, Dios inicia su plan de redención.',
        },
        'Éxodo': {
            autor: 'Moisés',
            fecha: 'Aprox. s. XV–XIII a.C.',
            destinatarios: 'Israel liberado de Egipto',
            resumen_historico: 'Yahvé rescata a su pueblo de la esclavitud, lo constituye en Sinaí y habita en medio de ellos.',
        },
        'Levítico': {
            autor: 'Moisés',
            fecha: 'Aprox. s. XV–XIII a.C.',
            destinatarios: 'Sacerdotes e Israel en el campamento',
            resumen_historico: 'Santidad, sacrificio y culto: cómo un pueblo pecador puede acercarse al Dios santo.',
        },
        'Números': {
            autor: 'Moisés',
            fecha: 'Aprox. s. XV–XIII a.C.',
            destinatarios: 'Israel en el desierto',
            resumen_historico: 'Cuarenta años entre murmuración y fidelidad: Dios disciplina y guía hacia la Tierra Prometida.',
        },
        'Deuteronomio': {
            autor: 'Moisés',
            fecha: 'Aprox. s. XV–XIII a.C.',
            destinatarios: 'Nueva generación a las puertas de Canaán',
            resumen_historico: 'Último llamado de Moisés: amar a Yahvé, recordar el pacto y elegir la vida.',
        },
        'Josué': {
            autor: 'Josué / tradición deuteronomista',
            fecha: 'Aprox. s. XIII–XII a.C.',
            destinatarios: 'Israel conquistando Canaán',
            resumen_historico: 'La promesa hecha a Abraham se concreta: Dios pelea por su pueblo y reparte la herencia.',
        },
        'Jueces': {
            autor: 'Tradición deuteronomista',
            fecha: 'Aprox. s. XII–XI a.C.',
            destinatarios: 'Israel en el ciclo de apostasía',
            resumen_historico: 'Sin rey, cada uno hace lo que bien le parece: Dios levanta jueces en medio del caos.',
        },
        'Rut': {
            autor: 'Anónimo (época de los jueces)',
            fecha: 'Aprox. s. XI a.C.',
            destinatarios: 'Israel (linaje davídico)',
            resumen_historico: 'Lealtad de una extranjera que entra en el linaje del Mesías: hesed en tiempos oscuros.',
        },
        '1 Samuel': {
            autor: 'Tradición profética',
            fecha: 'Aprox. s. XI–X a.C.',
            destinatarios: 'Israel en transición a la monarquía',
            resumen_historico: 'De Samuel a Saúl y David: Dios rechaza al rey a su imagen y unge al de su corazón.',
        },
        '2 Samuel': {
            autor: 'Tradición profética',
            fecha: 'Aprox. s. X a.C.',
            destinatarios: 'Israel bajo el reinado de David',
            resumen_historico: 'Gloria y caída de David: el pacto eterno y las consecuencias del pecado.',
        },
        '1 Reyes': {
            autor: 'Tradición deuteronomista',
            fecha: 'Aprox. s. VI a.C. (compilación)',
            destinatarios: 'Judá e Israel divididos',
            resumen_historico: 'De Salomón al cisma: el templo brilla y la idolatría parte el reino.',
        },
        '2 Reyes': {
            autor: 'Tradición deuteronomista',
            fecha: 'Aprox. s. VI a.C.',
            destinatarios: 'Pueblo ante el exilio',
            resumen_historico: 'Profetas, reyes y juicio: Samaria y Jerusalén caen, pero la esperanza no muere.',
        },
        '1 Crónicas': {
            autor: 'El Cronista',
            fecha: 'Aprox. s. V–IV a.C.',
            destinatarios: 'Comunidad postexílica',
            resumen_historico: 'Genealogías y culto: recontar la historia para restaurar identidad y esperanza.',
        },
        '2 Crónicas': {
            autor: 'El Cronista',
            fecha: 'Aprox. s. V–IV a.C.',
            destinatarios: 'Judá restaurada tras el exilio',
            resumen_historico: 'Templo, reforma y misericordia: buscar a Yahvé es hallar vida.',
        },
        'Esdras': {
            autor: 'Esdras / Cronista',
            fecha: 'Aprox. s. V a.C.',
            destinatarios: 'Remanente que vuelve de Babilonia',
            resumen_historico: 'Regreso, altar y Escritura: reconstruir el pueblo alrededor de la Ley.',
        },
        'Nehemías': {
            autor: 'Nehemías / Cronista',
            fecha: 'Aprox. 445–430 a.C.',
            destinatarios: 'Jerusalén en reconstrucción',
            resumen_historico: 'Muros y reforma: liderazgo orante que restaura ciudad y alianza.',
        },
        'Ester': {
            autor: 'Anónimo judío',
            fecha: 'Aprox. s. V–IV a.C.',
            destinatarios: 'Judíos de la diáspora persa',
            resumen_historico: 'Providencia oculta: Dios preserva a su pueblo cuando nadie nombra su Nombre.',
        },
        'Job': {
            autor: 'Anónimo sapiencial',
            fecha: 'Antiguo (fecha debatida)',
            destinatarios: 'Quienes sufren ante el misterio de Dios',
            resumen_historico: 'El justo afligido interroga al cielo: la fe madura no en respuestas fáciles, sino ante Yahvé.',
        },
        'Salmos': {
            autor: 'David y otros salmistas',
            fecha: 'Composición multiépoca',
            destinatarios: 'El pueblo que ora y adora',
            resumen_historico: 'Himnario del pacto: lamento, alabanza y esperanza mesiánica en cada estación del alma.',
        },
        'Proverbios': {
            autor: 'Salomón y sabios de Israel',
            fecha: 'Aprox. s. X–VI a.C.',
            destinatarios: 'Jóvenes y pueblo en busca de sabiduría',
            resumen_historico: 'Temor de Yahvé como principio: formar el carácter en la vida cotidiana.',
        },
        'Eclesiastés': {
            autor: 'Qohelet (tradición salomónica)',
            fecha: 'Aprox. s. III a.C. (compilación)',
            destinatarios: 'Buscadores de sentido bajo el sol',
            resumen_historico: 'Vanidad de lo efímero: solo temer a Dios y guardar sus mandamientos da peso eterno.',
        },
        'Cantares': {
            autor: 'Tradición salomónica',
            fecha: 'Aprox. s. X–IV a.C.',
            destinatarios: 'Amantes bajo el pacto (e iglesia/Cristo)',
            resumen_historico: 'Poema de amor fiel: belleza del deseo santificado y figura del amor divino.',
        },
        'Isaías': {
            autor: 'Isaías hijo de Amoz',
            fecha: 'Aprox. s. VIII a.C.',
            destinatarios: 'Judá ante el Santo de Israel',
            resumen_historico: 'Juicio y consuelo: el Siervo sufriente y el reino que no tendrá fin.',
        },
        'Jeremías': {
            autor: 'Jeremías',
            fecha: 'Aprox. 626–586 a.C.',
            destinatarios: 'Judá al borde del exilio',
            resumen_historico: 'Lágrimas proféticas: nuevo pacto escrito en el corazón tras la caída de Jerusalén.',
        },
        'Lamentaciones': {
            autor: 'Tradición jeremiana',
            fecha: 'Aprox. 586 a.C.',
            destinatarios: 'Sobrevivientes de Jerusalén',
            resumen_historico: 'Elegía de la ciudad destruida: “grandes son tus misericordias” en medio de las cenizas.',
        },
        'Ezequiel': {
            autor: 'Ezequiel',
            fecha: 'Aprox. 593–571 a.C.',
            destinatarios: 'Exiliados en Babilonia',
            resumen_historico: 'Gloria que parte y vuelve: corazón nuevo y Espíritu para un pueblo restaurado.',
        },
        'Daniel': {
            autor: 'Daniel',
            fecha: 'Aprox. s. VI a.C. (marco)',
            destinatarios: 'Fieles bajo imperios gentiles',
            resumen_historico: 'Fidelidad en la corte extranjera: el Altísimo reina y el Hijo del Hombre recibe el reino.',
        },
        'Oseas': {
            autor: 'Oseas',
            fecha: 'Aprox. s. VIII a.C.',
            destinatarios: 'Reino del Norte (Israel)',
            resumen_historico: 'Amor esponsal herido: Yahvé persigue a la esposa infiel para restaurarla.',
        },
        'Joel': {
            autor: 'Joel',
            fecha: 'Fecha debatida (postexílica probable)',
            destinatarios: 'Judá ante el Día de Yahvé',
            resumen_historico: 'Plaga y Espíritu: el Señor derrama su Espíritu sobre toda carne.',
        },
        'Amós': {
            autor: 'Amós',
            fecha: 'Aprox. s. VIII a.C.',
            destinatarios: 'Israel próspero e injusto',
            resumen_historico: 'Justicia como culto verdadero: Dios no tolera opresión disfrazada de religión.',
        },
        'Abdías': {
            autor: 'Abdías',
            fecha: 'Aprox. s. VI a.C.',
            destinatarios: 'Edom y el remanente de Judá',
            resumen_historico: 'Orgullo juzgado: el reino será de Yahvé.',
        },
        'Jonás': {
            autor: 'Jonás (narrativa profética)',
            fecha: 'Aprox. s. VIII a.C. (marco)',
            destinatarios: 'Israel ante la misericordia a los gentiles',
            resumen_historico: 'Profeta reacio: la compasión de Dios alcanza incluso a Nínive.',
        },
        'Miqueas': {
            autor: 'Miqueas',
            fecha: 'Aprox. s. VIII a.C.',
            destinatarios: 'Judá e Israel',
            resumen_historico: 'Juicio a la élite y esperanza en Belén: hacer justicia, amar misericordia, humillarse.',
        },
        'Nahúm': {
            autor: 'Nahúm',
            fecha: 'Aprox. s. VII a.C.',
            destinatarios: 'Judá ante la caída de Nínive',
            resumen_historico: 'Consolación por el fin del opresor: Yahvé es lento para la ira, pero no absuelve.',
        },
        'Habacuc': {
            autor: 'Habacuc',
            fecha: 'Aprox. finales s. VII a.C.',
            destinatarios: 'Justos perplejos ante la violencia',
            resumen_historico: 'Diálogo con Dios: el justo por su fe vivirá, aunque la higuera no florezca.',
        },
        'Sofonías': {
            autor: 'Sofonías',
            fecha: 'Aprox. s. VII a.C.',
            destinatarios: 'Judá bajo Josías',
            resumen_historico: 'Día terrible y remanente gozoso: Dios canta sobre su pueblo con alegría.',
        },
        'Hageo': {
            autor: 'Hageo',
            fecha: 'Aprox. 520 a.C.',
            destinatarios: 'Remanente que reconstruye el templo',
            resumen_historico: 'Despertar del desaliento: edificar la casa de Yahvé antes que las propias.',
        },
        'Zacarías': {
            autor: 'Zacarías',
            fecha: 'Aprox. 520–518 a.C.',
            destinatarios: 'Judá postexílica',
            resumen_historico: 'Visiones de esperanza: el Rey humilde llega montado en un asno.',
        },
        'Malaquías': {
            autor: 'Malaquías',
            fecha: 'Aprox. s. V a.C.',
            destinatarios: 'Comunidad del segundo templo',
            resumen_historico: 'Última voz del AT: preparar el camino; el Sol de justicia nacerá.',
        },
        'Mateo': {
            autor: 'Mateo (Leví), apóstol',
            fecha: 'Aprox. 60–70 d.C.',
            destinatarios: 'Comunidad judío-cristiana',
            resumen_historico: 'Jesús, Hijo de David y cumplimiento de las Escrituras: el reino de los cielos ha llegado.',
        },
        'Marcos': {
            autor: 'Juan Marcos',
            fecha: 'Aprox. 65–70 d.C.',
            destinatarios: 'Creyentes en Roma (tradición)',
            resumen_historico: 'Evangelio urgente del Siervo: poder en acción y cruz en el centro.',
        },
        'Lucas': {
            autor: 'Lucas, médico y compañero de Pablo',
            fecha: 'Aprox. 60–70 d.C.',
            destinatarios: 'Teófilo y oyentes gentiles',
            resumen_historico: 'Historia ordenada de la salvación: el Hijo del Hombre busca y salva lo perdido.',
        },
        'Juan': {
            autor: 'Juan el apóstol',
            fecha: 'Aprox. 80–90 d.C.',
            destinatarios: 'Discípulos llamados a creer',
            resumen_historico: 'Signos y “Yo soy”: para que creáis que Jesús es el Cristo, el Hijo de Dios.',
        },
        'Hechos': {
            autor: 'Lucas',
            fecha: 'Aprox. 62–70 d.C.',
            destinatarios: 'La iglesia apostólica (y Teófilo)',
            resumen_historico: 'El Espíritu impulsa el evangelio de Jerusalén a Roma: testigos hasta lo último de la tierra.',
        },
        'Romanos': {
            autor: 'Apóstol Pablo',
            fecha: 'Aprox. 57 d.C.',
            destinatarios: 'Creyentes en Roma',
            resumen_historico: 'Evangelio de la justicia de Dios: judíos y gentiles justificados por fe, llamados a una vida transformada.',
        },
        '1 Corintios': {
            autor: 'Apóstol Pablo',
            fecha: 'Aprox. 54–55 d.C.',
            destinatarios: 'Iglesia de Corinto',
            resumen_historico: 'Carta correctiva a una iglesia dividida: la cruz, el cuerpo y el amor como camino más excelente.',
        },
        '2 Corintios': {
            autor: 'Apóstol Pablo',
            fecha: 'Aprox. 55–56 d.C.',
            destinatarios: 'Iglesia de Corinto',
            resumen_historico: 'Apología del ministerio débil: el poder de Cristo se perfecciona en la flaqueza.',
        },
        'Gálatas': {
            autor: 'Apóstol Pablo',
            fecha: 'Aprox. 48–55 d.C.',
            destinatarios: 'Iglesias de Galacia',
            resumen_historico: 'Defensa del evangelio puro: justificados por fe, libres en el Espíritu, no esclavos de la Ley.',
        },
        'Efesios': {
            autor: 'Apóstol Pablo',
            fecha: 'Aprox. 60–62 d.C.',
            destinatarios: 'Santos en Éfeso / Asia',
            resumen_historico: 'Carta de la iglesia cósmica: elegidos en Cristo para unidad, santidad y guerra espiritual.',
        },
        'Filipenses': {
            autor: 'Apóstol Pablo',
            fecha: 'Aprox. 60–62 d.C.',
            destinatarios: 'Iglesia de Filipos',
            resumen_historico: 'Gozo desde la prisión: la mente de Cristo y la carrera hacia el premio.',
        },
        'Colosenses': {
            autor: 'Apóstol Pablo',
            fecha: 'Aprox. 60–62 d.C.',
            destinatarios: 'Iglesia de Colosas',
            resumen_historico: 'Cristo preeminente sobre toda filosofía: plenos en Él, muertos al mundo, vivos para Dios.',
        },
        '1 Tesalonicenses': {
            autor: 'Apóstol Pablo',
            fecha: 'Aprox. 50–51 d.C.',
            destinatarios: 'Iglesia de Tesalónica',
            resumen_historico: 'Fe joven ante la persecución: esperanza en la venida del Señor y vida santa.',
        },
        '2 Tesalonicenses': {
            autor: 'Apóstol Pablo',
            fecha: 'Aprox. 51–52 d.C.',
            destinatarios: 'Iglesia de Tesalónica',
            resumen_historico: 'Claridad escatológica: perseverar en el trabajo hasta que el Señor sea revelado.',
        },
        '1 Timoteo': {
            autor: 'Apóstol Pablo',
            fecha: 'Aprox. 62–64 d.C.',
            destinatarios: 'Timoteo en Éfeso',
            resumen_historico: 'Manual pastoral: doctrina sana, liderazgo íntegro y piedad con contentamiento.',
        },
        '2 Timoteo': {
            autor: 'Apóstol Pablo',
            fecha: 'Aprox. 64–67 d.C.',
            destinatarios: 'Timoteo',
            resumen_historico: 'Testamento desde la prisión final: predica la Palabra; la Escritura es inspirada y útil.',
        },
        'Tito': {
            autor: 'Apóstol Pablo',
            fecha: 'Aprox. 62–64 d.C.',
            destinatarios: 'Tito en Creta',
            resumen_historico: 'Ordenar lo que falta: ancianos íntegros y gracia que enseña a vivir sobriamente.',
        },
        'Filemón': {
            autor: 'Apóstol Pablo',
            fecha: 'Aprox. 60–62 d.C.',
            destinatarios: 'Filemón (y la iglesia en su casa)',
            resumen_historico: 'Carta de reconciliación: un esclavo vuelve como hermano amado en Cristo.',
        },
        'Hebreos': {
            autor: 'Anónimo apostólico',
            fecha: 'Aprox. 60–70 d.C.',
            destinatarios: 'Creyentes hebreos tentados a volver atrás',
            resumen_historico: 'Cristo, superior al sistema antiguo: perseverad; tenemos un sumo sacerdote eterno.',
        },
        'Santiago': {
            autor: 'Santiago, hermano del Señor',
            fecha: 'Aprox. 45–49 d.C.',
            destinatarios: 'Las doce tribus en la diáspora',
            resumen_historico: 'Sabiduría práctica: fe sin obras está muerta; la lengua y la justicia importan.',
        },
        '1 Pedro': {
            autor: 'Apóstol Pedro',
            fecha: 'Aprox. 62–64 d.C.',
            destinatarios: 'Extranjeros elegidos en Asia Menor',
            resumen_historico: 'Esperanza viva en el sufrimiento: pueblo santo que sigue las pisadas del Cordero.',
        },
        '2 Pedro': {
            autor: 'Apóstol Pedro',
            fecha: 'Aprox. 64–68 d.C.',
            destinatarios: 'Creyentes ante falsos maestros',
            resumen_historico: 'Certeza profética y advertencia final: creced en la gracia y el conocimiento de Cristo.',
        },
        '1 Juan': {
            autor: 'Juan el apóstol',
            fecha: 'Aprox. 85–95 d.C.',
            destinatarios: 'Comunidad joanina',
            resumen_historico: 'Luz, amor y verdad: quien permanece en Dios no camina en tinieblas.',
        },
        '2 Juan': {
            autor: 'Juan el apóstol',
            fecha: 'Aprox. 85–95 d.C.',
            destinatarios: 'La señora elegida y sus hijos',
            resumen_historico: 'Camina en verdad y amor: no recibáis a quien niega que Cristo vino en carne.',
        },
        '3 Juan': {
            autor: 'Juan el apóstol',
            fecha: 'Aprox. 85–95 d.C.',
            destinatarios: 'Gayo',
            resumen_historico: 'Hospitalidad misionera contra el orgullo eclesial: colaborar con la verdad.',
        },
        'Judas': {
            autor: 'Judas, hermano de Santiago',
            fecha: 'Aprox. 65–80 d.C.',
            destinatarios: 'Llamados, amados y guardados',
            resumen_historico: 'Contended earnestly por la fe: Dios guarda a los suyos en medio del engaño.',
        },
        'Apocalipsis': {
            autor: 'Juan',
            fecha: 'Aprox. 95 d.C.',
            destinatarios: 'Siete iglesias de Asia',
            resumen_historico: 'Visión del Cordero victorioso: fidelidad bajo presión hasta que Él haga nuevas todas las cosas.',
        },
    };

    const AUTOR_LABEL = {
        'jamieson-fausset-brown': 'Jamieson, Fausset y Brown',
        'matthew-henry': 'Matthew Henry',
        'albert-barnes': 'Albert Barnes',
        'charles-spurgeon': 'Charles Spurgeon'
    };

    const GLOSA = {
        G3361: 'no', G4964: 'conformarse', G5129: 'este', G165: 'siglo / eón',
        G235: 'sino', G3339: 'transformarse', G342: 'renovación', G3563: 'mente',
        G1519: 'para', G1381: 'comprobar', G2307: 'voluntad', G2316: 'Dios',
        G2101: 'agradable', G5046: 'perfecta', G2962: 'Señor', G5547: 'Cristo',
        H3068: 'Jehová / Yahvé', H7462: 'pastorear', H2637: 'faltar', H5315: 'alma',
        H4853: 'carga / oráculo', H834: 'que / quien', H2372: 'contemplar',
        H2265: 'Habacuc', H5030: 'profeta', H7768: 'clamar por auxilio',
        H430: 'Dios', H113: 'Señor', H2617: 'misericordia del pacto',
    };

    const PERSPECTIVAS = {
        exegesis: {
            id: 'exegesis',
            titulo: 'Exégesis e Historia',
            subtitulo: 'Strong & Contexto',
            mark: '🏛️',
            pilar: 'a',
            tip: 'Analiza la raíz gramatical original (griego/hebreo) y el trasfondo histórico-cultural original del autor. Recibirás sentido léxico, contexto y trasfondo del pasaje.',
        },
        hermeneutica: {
            id: 'hermeneutica',
            titulo: 'Hermenéutica y Teología',
            subtitulo: 'Escritura con Escritura',
            mark: '📜',
            pilar: 'a',
            tip: 'Cruza el pasaje bajo el principio de que la Biblia interpreta la Biblia, conectándolo con la teología de la gracia. Recibirás coherencia canónica centrada en Cristo.',
        },
        apologetica: {
            id: 'apologetica',
            titulo: 'Apologética y Veracidad',
            subtitulo: 'Defensa del texto sagrado',
            mark: '🛡️',
            pilar: 'a',
            tip: 'Da solidez doctrinal y argumentos inquebrantables sobre la autenticidad y defensa del texto sagrado. Recibirás anclas de veracidad y defensa fiel del pasaje.',
        },
        mente: {
            id: 'mente',
            titulo: 'Neuroplasticidad y Pensamiento',
            subtitulo: 'Metanoia bajo la Palabra',
            mark: '🧠',
            pilar: 'b',
            tip: 'Examina cómo el diseño biológico de la mente responde a la renovación del entendimiento (metanoia), rechazando el humanismo secular y anclándolo en la verdad de Dios.',
        },
        alma: {
            id: 'alma',
            titulo: 'Inteligencia Emocional y Alma',
            subtitulo: 'Restauración por gracia',
            mark: '🌱',
            pilar: 'b',
            tip: 'Aborda las pasiones humanas (miedo, ira, frustración) guiando el quebrantamiento del corazón de piedra hacia un corazón de carne por la gracia del Espíritu Santo.',
        },
    };

    const data = {
        AT,
        NT,
        VERSOS_CAP,
        VERSION_LABEL,
        FICHAS_ACADEMICAS,
        CONTEXTO_HISTORICO,
        AUTOR_LABEL,
        GLOSA,
        PERSPECTIVAS,
        LIBROS: AT.concat(NT),
    };

    global.LIBROS_AT = AT;
    global.LIBROS_NT = NT;
    global.RV_DATA = data;
    global.RV = global.RV || {};
    global.RV.data = data;
})(typeof window !== "undefined" ? window : globalThis);
