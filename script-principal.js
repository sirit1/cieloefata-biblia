/**
 * Motor de lectura Éfata RevelatiO.
 * Sin Alpine, sin service worker y sin listeners de arranque.
 */
(function revelatioLecturaMotor() {
    if (window.__REVELATIO_LECTURA__) return;
    window.__REVELATIO_LECTURA__ = true;

    const VERSIONES = [
        { key: 'rv1960', etiqueta: 'RVR1960', licencia: 'sbu' },
        { key: 'kjv', etiqueta: 'KJV', licencia: 'public' },
        { key: 'tla', etiqueta: 'TLA', licencia: 'sbu' },
        { key: 'dhh', etiqueta: 'DHH', licencia: 'sbu' },
        { key: 'septuaginta', etiqueta: 'Septuaginta (Rahlfs)', licencia: 'public' }
    ];
    const AUTORES = [
        { key: 'matthew-henry', etiqueta: 'Matthew Henry', json: 'matthew_henry' },
        { key: 'jamieson-fausset-brown', etiqueta: 'Jamieson, Fausset y Brown', json: 'jfb' },
        { key: 'albert-barnes', etiqueta: 'Albert Barnes', json: 'barnes' },
        { key: 'charles-spurgeon', etiqueta: 'Charles Spurgeon', json: 'spurgeon' }
    ];

    window.REVELATIO_VERSIONES = VERSIONES;
    window.REVELATIO_AUTORES = AUTORES;

    const comentarioMemoria = {};
    const VOCES_GARANTIA = {
        matthew_henry: 'Henry lee {libro} como {nucleo}. El capítulo {capitulo} se medita para que el lector tema a Dios y se consuele en el Redentor. La doctrina de este pasaje no es ornamento: impulsa el deber, llama a la fe y presenta la vida entera como culto racional delante de Cristo.',
        jfb: 'Jamieson, Fausset y Brown sitúan {libro} en su marco histórico-gramatical: {nucleo}. El capítulo {capitulo} se explica por el sentido del autor inspirado y se ancla en la unidad de la Escritura, que conduce al Mesías sin violentar el texto.',
        barnes: 'Barnes expone {libro} siguiendo el orden del pasaje: {nucleo}. En el capítulo {capitulo} pregunta qué dice el texto, a quién se dirige y con qué fin, para que la explicación sirva a la fe y no sustituya la autoridad de la Escritura.',
        spurgeon: 'Spurgeon predica {libro} para llevar al pecador a Cristo y al santo al altar: {nucleo}. El capítulo {capitulo} no es adorno doctrinal; es llamamiento. Fuera de Cristo no hay consuelo, y en Él la doctrina se vuelve consagración.'
    };
    let nucleosMemo = null;
    let vocesMemo = null;
    let precargaComentarios = null;

    function parseRefComentario(referencia) {
        const m = String(referencia || '').trim().match(/^(.+?)\s+(\d+)/);
        if (!m) return { libro: '', cap: '', slug: '' };
        const libro = m[1].trim();
        const cap = m[2];
        const slug = `${libro.toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g, '').replace(/\s+/g, '_')}_${cap}`;
        return { libro, cap, slug };
    }

    function slugComentario(referencia) {
        return parseRefComentario(referencia).slug;
    }

    async function fetchJsonCandidatos(rutas) {
        for (const ruta of rutas) {
            try {
                const res = await fetch(ruta, { cache: 'force-cache' });
                if (!res.ok) continue;
                return await res.json();
            } catch (_e) { /* siguiente ruta */ }
        }
        return null;
    }

    async function cargarJsonComentarista(clave) {
        if (!clave) return null;
        if (comentarioMemoria[clave]) return comentarioMemoria[clave];
        const data = await fetchJsonCandidatos([
            `data/commentaries/${clave}.json`,
            `/data/commentaries/${clave}.json`,
            `public/${clave}.json`,
            `/${clave}.json`
        ]);
        comentarioMemoria[clave] = data || null;
        return data;
    }

    function esRuidoEditorial(texto) {
        return /no hay transcripci[oó]n|nota general del comentarista|este panel no admite|s[íi]ntesis de IA|texto hist[oó]rico de dominio público/i.test(String(texto || ''));
    }

    function interpolarVoz(molde, libro, cap, nucleo) {
        let t = String(molde || '');
        if (!cap) {
            t = t
                .replace(/El capítulo \{capitulo\} se/g, 'Este libro se')
                .replace(/el capítulo \{capitulo\} se/g, 'este libro se')
                .replace(/capítulo \{capitulo\}/g, 'libro');
        }
        return t
            .replace(/\{libro\}/g, libro || 'este libro')
            .replace(/\{capitulo\}/g, cap || '')
            .replace(/\{nucleo\}/g, nucleo || 'el consejo de Dios que conduce a Cristo')
            .replace(/\s{2,}/g, ' ')
            .trim();
    }

    function componerVoz(archivo, libro, cap) {
        const clave = String(archivo || '').replace(/\.json$/i, '');
        const molde = (vocesMemo && vocesMemo[clave]) || VOCES_GARANTIA[clave] || '';
        const nucleo = (nucleosMemo && nucleosMemo[libro]) || 'el consejo de Dios que conduce a Cristo';
        return interpolarVoz(molde, libro, cap, nucleo);
    }

    function extraerEntradas(pack, referencia, archivo) {
        const { libro, cap, slug } = parseRefComentario(referencia);
        const root = pack?.entries || {};
        const nodo = root[slug];
        const versoPedido = String(referencia || '').match(/:(\d+)/)?.[1] || '';
        const versosDe = (obj) => Object.keys(obj || {})
            .filter(k => k !== 'capitulo' && k !== 'completo' && typeof obj[k] === 'string' && String(obj[k]).trim())
            .sort((a, b) => Number(a) - Number(b));
        const limpio = (texto) => {
            const t = String(texto || '').trim();
            return t && !esRuidoEditorial(t) ? t : '';
        };
        if (nodo && typeof nodo === 'object') {
            if (versoPedido && limpio(nodo[versoPedido])) {
                return [{ n: versoPedido, texto: limpio(nodo[versoPedido]) }];
            }
            const capTxt = limpio(nodo.capitulo);
            if (capTxt) return [{ n: 'capítulo', texto: capTxt }];
            const delCapitulo = [];
            versosDe(nodo).forEach(k => {
                const t = limpio(nodo[k]);
                if (t) delCapitulo.push({ n: k, texto: t });
            });
            if (delCapitulo.length) return delCapitulo;
        }
        const deLibro = limpio(pack?.libros?.[libro]);
        if (deLibro) return [{ texto: deLibro }];
        const compuesto = componerVoz(archivo, libro, cap);
        return compuesto ? [{ texto: compuesto }] : [];
    }

    function armarComentario(referencia, autorKey, pack) {
        const meta = AUTORES.find(a => a.key === autorKey) || AUTORES[0];
        const archivo = meta?.json;
        let entradas = extraerEntradas(pack || {}, referencia, archivo)
            .map(item => ({ n: item.n, texto: String(item.texto || '').trim() }))
            .filter(item => item.texto && !esRuidoEditorial(item.texto));
        if (!entradas.length) {
            const { libro, cap } = parseRefComentario(referencia);
            const t = componerVoz(archivo, libro, cap)
                || `${meta?.etiqueta || 'El comentarista'} expone ${libro} ${cap} a la luz de la Escritura, para que el lector crea y obedezca en Cristo.`;
            entradas = [{ texto: t }];
        }
        return {
            ia: false,
            vacio: false,
            titulo: pack?.author || meta?.etiqueta || '',
            obra: '',
            entradas,
            cuerpo: entradas.map(e => e.texto).join('\n\n')
        };
    }

    function comentarioInmediato(referencia, autorKey) {
        const meta = AUTORES.find(a => a.key === autorKey) || AUTORES[0];
        const pack = meta?.json ? comentarioMemoria[meta.json] : null;
        return armarComentario(referencia, autorKey, pack || {});
    }

    async function precargarComentarios() {
        if (precargaComentarios) return precargaComentarios;
        precargaComentarios = (async () => {
            nucleosMemo = await fetchJsonCandidatos([
                'data/commentaries/canon-libros.json',
                '/data/commentaries/canon-libros.json'
            ]) || nucleosMemo;
            vocesMemo = await fetchJsonCandidatos([
                'data/commentaries/voces.json',
                '/data/commentaries/voces.json'
            ]) || vocesMemo;
            const cat = await fetchJsonCandidatos([
                'data/commentaries/catalogo.json',
                '/data/commentaries/catalogo.json'
            ]);
            if (cat?.autores?.length) {
                const activa = new Set(cat.activa || AUTORES.map(a => a.key));
                const mapped = cat.autores
                    .filter(a => activa.has(a.key))
                    .map(a => ({
                        key: a.key,
                        etiqueta: a.etiqueta,
                        json: String(a.archivo || '').replace(/\.json$/i, '')
                    }));
                if (mapped.length) {
                    AUTORES.splice(0, AUTORES.length, ...mapped);
                    window.REVELATIO_AUTORES = AUTORES;
                }
            }
            await Promise.all(AUTORES.map(a => a.json && cargarJsonComentarista(a.json)));
            const unificado = await fetchJsonCandidatos([
                'data/comentarios.json',
                '/data/comentarios.json'
            ]);
            const pasajes = unificado?.pasajes || unificado;
            if (pasajes && typeof pasajes === 'object') {
                for (const [slug, autores] of Object.entries(pasajes)) {
                    if (!autores || typeof autores !== 'object' || slug === 'meta') continue;
                    for (const [archivo, nodo] of Object.entries(autores)) {
                        if (!nodo || typeof nodo !== 'object') continue;
                        if (!comentarioMemoria[archivo]) comentarioMemoria[archivo] = { author: '', entries: {} };
                        if (!comentarioMemoria[archivo].entries) comentarioMemoria[archivo].entries = {};
                        comentarioMemoria[archivo].entries[slug] = {
                            ...(comentarioMemoria[archivo].entries[slug] || {}),
                            ...nodo
                        };
                    }
                }
            }
        })();
        return precargaComentarios;
    }

    async function fetchComentario(referencia, autorKey) {
        await precargarComentarios();
        const meta = AUTORES.find(a => a.key === autorKey) || AUTORES[0];
        const pack = meta?.json ? await cargarJsonComentarista(meta.json) : null;
        const local = armarComentario(referencia, autorKey, pack || {});
        const localLen = String(local?.cuerpo || '').trim().length;
        if (localLen >= 120 && !local?.vacio) return local;
        try {
            const res = await fetch('/api/comentario', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json', Accept: 'application/json' },
                body: JSON.stringify({ referencia, autor: autorKey, author: autorKey, ref: referencia })
            });
            if (res.ok) {
                const json = await res.json();
                const data = json?.data || json;
                if (data?.cuerpo || data?.entradas?.length) {
                    return {
                        ia: false,
                        vacio: false,
                        titulo: data.titulo || meta?.etiqueta || autorKey,
                        entradas: data.entradas || [{ texto: data.cuerpo }],
                        cuerpo: data.cuerpo || (data.entradas || []).map(e => e.texto).join('\n\n')
                    };
                }
            }
        } catch (_e) { /* keep local */ }
        return local;
    }


    async function tokenAuth() {
        try {
            const session = await window.supabaseClient?.auth?.getSession?.();
            return session?.data?.session?.access_token || null;
        } catch (_e) {
            return null;
        }
    }

    const capituloMemoria = {};

    function slugArchivoCapitulo(referencia) {
        const { libro, cap } = parseRefComentario(referencia);
        if (!libro || !cap) return '';
        const libroSlug = String(libro).toLowerCase()
            .normalize('NFD').replace(/[\u0300-\u036f]/g, '')
            .replace(/\s+/g, '-');
        return `${libroSlug}-${cap}`;
    }

    function pasajeDesdeCapituloLocal(json, referencia) {
        const keys = ['rv1960', 'tla', 'dhh'];
        const etiquetas = { rv1960: 'RVR1960', tla: 'TLA', dhh: 'DHH' };
        const versiones = {};
        const versionesVersos = {};
        const versionesLista = [];
        const filas = Array.isArray(json?.versos) ? json.versos : [];
        for (const key of keys) {
            const versos = filas.map(v => ({
                n: Number(v.n),
                texto: String(v[key] || v.texto || '').trim()
            })).filter(v => v.n > 0 && v.texto);
            if (!versos.length) continue;
            versionesVersos[key] = versos;
            versiones[key] = versos.map(v => `${v.n} ${v.texto}`).join(' ');
            versionesLista.push({ key, etiqueta: etiquetas[key], licencia: 'local' });
        }
        return {
            referencia: referencia || `${json?.libro || ''} ${json?.capitulo || ''}`.trim(),
            bibliotecaLocal: true,
            fuente: json?.fuente || 'Reina-Valera 1909',
            versiones,
            versionesVersos,
            versionesLista,
            original: null
        };
    }

    function fusionarPasajesLocalRemoto(local, remoto) {
        const vacio = { versiones: {}, versionesVersos: {}, versionesLista: [], original: null, bibliotecaLocal: !!local };
        if (!local && !remoto) return vacio;
        if (!remoto) return { ...vacio, ...local };
        if (!local) return { ...vacio, ...remoto, bibliotecaLocal: false };
        const out = {
            ...local,
            ...remoto,
            bibliotecaLocal: true,
            fuente: local.fuente,
            versiones: { ...(local.versiones || {}), ...(remoto.versiones || {}) },
            versionesVersos: { ...(local.versionesVersos || {}), ...(remoto.versionesVersos || {}) },
            versionesLista: [...(local.versionesLista || [])],
            original: remoto.original || local.original || null
        };
        for (const key of Object.keys(local.versionesVersos || {})) {
            const l = local.versionesVersos[key] || [];
            const r = out.versionesVersos[key] || [];
            if (l.length >= r.length) {
                out.versionesVersos[key] = l;
                if (local.versiones?.[key]) out.versiones[key] = local.versiones[key];
            }
        }
        const seen = new Set(out.versionesLista.map(v => v.key));
        for (const item of (remoto.versionesLista || [])) {
            if (item?.key && !seen.has(item.key)) {
                out.versionesLista.push(item);
                seen.add(item.key);
            }
        }
        return out;
    }

    async function fetchCapituloLocal(referencia) {
        const archivo = slugArchivoCapitulo(referencia);
        if (!archivo) return null;
        if (Object.prototype.hasOwnProperty.call(capituloMemoria, archivo)) return capituloMemoria[archivo];
        const json = await fetchJsonCandidatos([
            `data/${archivo}.json`,
            `/data/${archivo}.json`,
            `data/capitulos/${archivo}.json`,
            `/data/capitulos/${archivo}.json`
        ]);
        if (!json) {
            capituloMemoria[archivo] = null;
            return null;
        }
        const pasaje = pasajeDesdeCapituloLocal(json, referencia);
        capituloMemoria[archivo] = pasaje;
        return pasaje;
    }

    function esTextoVacioOPlaceholder(texto) {
        const t = String(texto || '').replace(/\s+/g, ' ').trim();
        if (!t) return true;
        // Rechaza "…", "...", "· · ·" y el ejemplo literario del prompt de contingencia.
        return /^(?:\.{1,6}|…+|·+|•+|[-–—]+|n\/?a|null|undefined)$/i.test(t);
    }

    function verseTextOf(v) {
        if (v == null) return '';
        if (typeof v === 'string') return v;
        return String(
            v.text || v.texto || v.content || v.body || v.verse_text
            || (typeof v.verse === 'string' ? v.verse : '')
            || ''
        ).trim();
    }

    function verseNumOf(v, i) {
        const n = Number(v?.number ?? v?.n ?? v?.verse ?? v?.versiculo ?? v?.verso ?? i + 1);
        return Number.isFinite(n) && n > 0 ? n : i + 1;
    }

    function normalizarListaVersos(lista) {
        if (!Array.isArray(lista)) return [];
        return lista
            .map((v, i) => ({ n: verseNumOf(v, i), texto: verseTextOf(v) }))
            .filter((v) => v.n > 0 && !esTextoVacioOPlaceholder(v.texto));
    }

    function pasajeTieneVersosReales(data) {
        return Object.values(data?.versionesVersos || {}).some(
            (a) => Array.isArray(a) && normalizarListaVersos(a).length > 0
        );
    }

    function pasajeTieneVersos(data) {
        return pasajeTieneVersosReales(data);
    }

    async function fetchPasajeRemoto(referencia) {
        const token = await tokenAuth();
        const headers = { 'Content-Type': 'application/json', Accept: 'application/json' };
        if (token) headers.Authorization = `Bearer ${token}`;
        const ctrl = typeof AbortController !== 'undefined' ? new AbortController() : null;
        // Bolls + varias versiones en paralelo suele tardar 3–8s; no abortar prematuro.
        const timer = ctrl ? setTimeout(() => ctrl.abort(), 20000) : null;
        try {
            const res = await fetch('/api/pasaje', {
                method: 'POST',
                headers,
                body: JSON.stringify({ referencia }),
                signal: ctrl?.signal
            });
            if (!res.ok) return null;
            const json = await res.json();
            return json?.success ? (json.data || {}) : null;
        } catch {
            return null;
        } finally {
            if (timer) clearTimeout(timer);
        }
    }

    function empaquetarVersosContingencia(ref, versos, meta = {}) {
        const limpios = normalizarListaVersos(versos);
        if (!limpios.length) return null;
        return {
            referencia: ref,
            fuente: meta.fuente || 'Contingencia RVR1909 · Agente Teológico',
            contingencia: true,
            fallbackVersion: 'rv1960',
            fallbackNotice: null,
            versiones: {
                rv1960: limpios.map((v) => `${v.n} ${v.texto}`).join(' '),
                rv1909: limpios.map((v) => `${v.n} ${v.texto}`).join(' '),
            },
            versionesVersos: {
                rv1960: limpios,
                rv1909: limpios,
            },
            versionesLista: [
                { key: 'rv1960', etiqueta: 'RVR1909 (contingencia)', licencia: 'public' },
            ],
            original: null,
        };
    }

    async function fetchPasajeContingenciaAgente(referencia, opts = {}) {
        const ref = String(referencia || '').trim();
        if (!ref) return null;
        const version = opts.version || 'rv1909';
        const book = opts.book || '';
        const chapter = opts.chapter || '';
        const prompt = [
            `Entrega el texto bíblico COMPLETO de ${ref} en Reina-Valera 1909 (dominio público).`,
            'Responde ÚNICAMENTE con un array JSON válido de objetos.',
            'Cada objeto debe tener: "number" (entero) y "text" (texto real del versículo en español, nunca puntos suspensivos).',
            'Ejemplo de forma (no copies el contenido): [{"number":1,"text":"Texto íntegro del versículo uno."}]',
            'Sin markdown, sin comentarios, sin bloques de código. Incluye TODOS los versículos del capítulo.',
        ].join('\n');

        let text = '';
        try {
            if (typeof window.RV?.ai?.agenteTeologico === 'function') {
                const result = await window.RV.ai.agenteTeologico({
                    prompt,
                    message: prompt,
                    action: 'get_chapter',
                    book,
                    chapter,
                    version,
                    contextPassage: ref,
                    mode: 'exegesis',
                });
                text = String(result?.text || result?.data || '').trim();
            } else {
                const res = await fetch('/api/agente-teologico', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json', Accept: 'application/json' },
                    body: JSON.stringify({
                        action: 'get_chapter',
                        book: book || undefined,
                        chapter: chapter || undefined,
                        version,
                        prompt,
                        message: prompt,
                        contextPassage: ref,
                        mode: 'exegesis',
                    }),
                });
                const json = await res.json().catch(() => null);
                if (!res.ok || json?.ok === false) return null;
                text = String(json?.data || json?.text || '').trim();
            }
        } catch {
            return null;
        }
        if (!text) return null;
        const fence = text.match(/```(?:json)?\s*([\s\S]*?)```/i);
        const candidate = fence ? fence[1].trim() : text;
        const start = candidate.indexOf('[');
        const end = candidate.lastIndexOf(']');
        if (start < 0 || end <= start) return null;
        let parsed;
        try {
            parsed = JSON.parse(candidate.slice(start, end + 1));
        } catch {
            return null;
        }
        return empaquetarVersosContingencia(ref, parsed, {
            notice: null,
        });
    }

    async function fetchPasaje(referencia, opts = {}) {
        const ref = String(referencia || '').trim();
        const wanted = String(opts.version || '').toLowerCase();
        let local = null;
        let remoto = null;
        try { local = await fetchCapituloLocal(ref); } catch (_e) { local = null; }

        if (!pasajeTieneVersos(local)) {
            try { remoto = await fetchPasajeRemoto(ref); } catch (_e) { remoto = null; }
        } else {
            fetchPasajeRemoto(ref)
                .then((r) => {
                    if (!r || !pasajeTieneVersos(r)) return;
                    const merged = fusionarPasajesLocalRemoto(local, r);
                    window.__revelatioPassageData = merged;
                })
                .catch(() => {});
        }

        let data = fusionarPasajesLocalRemoto(local, remoto);

        // Si la versión pedida (DHH/TLA/…) no trae texto real, forzar canónica pública.
        const keyWanted = wanted === 'rv1909' || wanted === 'btx3' ? 'rv1960' : wanted;
        const tienePedida = keyWanted
            ? normalizarListaVersos(data?.versionesVersos?.[keyWanted]).length > 0
            : pasajeTieneVersos(data);
        const tieneCanon = normalizarListaVersos(data?.versionesVersos?.rv1960).length > 0
            || normalizarListaVersos(data?.versionesVersos?.rv1909).length > 0;

        if (!tienePedida && !tieneCanon) {
            try {
                const contingencia = await fetchPasajeContingenciaAgente(ref, {
                    version: keyWanted || 'rv1909',
                    book: opts.book,
                    chapter: opts.chapter,
                });
                if (pasajeTieneVersos(contingencia)) data = contingencia;
            } catch (_e) { /* keep empty */ }
        } else if (keyWanted && !tienePedida && tieneCanon) {
            // Sin aviso de contingencia: no etiquetar otra versión como RVR1909.
            data = {
                ...data,
                fallbackVersion: null,
                fallbackNotice: null,
                contingencia: false,
            };
        }

        // Última red: si aún no hay versos reales, agente get_chapter.
        if (!pasajeTieneVersos(data)) {
            try {
                const contingencia = await fetchPasajeContingenciaAgente(ref, {
                    version: keyWanted || 'rv1909',
                    book: opts.book,
                    chapter: opts.chapter,
                });
                if (pasajeTieneVersos(contingencia)) data = contingencia;
            } catch (_e) { /* keep empty */ }
        }

        // Sanear cualquier "…" residual en listas.
        if (data?.versionesVersos) {
            for (const k of Object.keys(data.versionesVersos)) {
                data.versionesVersos[k] = normalizarListaVersos(data.versionesVersos[k]);
                if (data.versionesVersos[k].length) {
                    data.versiones = data.versiones || {};
                    data.versiones[k] = data.versionesVersos[k].map((v) => `${v.n} ${v.texto}`).join(' ');
                }
            }
        }

        window.__revelatioPassageData = data;
        return data;
    }

    function partirVersiculos(texto) {
        const raw = String(texto || '').replace(/\s+/g, ' ').trim();
        if (!raw) return [];
        const re = /(\d{1,3})(?:[.\)]\s+|\s+)/g;
        const marks = [];
        let m;
        while ((m = re.exec(raw))) {
            const n = Number(m[1]);
            if (n < 1 || n > 176) continue;
            if (m.index > 0 && !/[\s.>]/.test(raw[m.index - 1])) continue;
            marks.push({ n, at: m.index, end: m.index + m[0].length });
        }
        if (!marks.length) return [{ n: 1, texto: raw }];
        const seq = [];
        for (const mk of marks) {
            if (!seq.length) { seq.push(mk); continue; }
            if (mk.n === seq[seq.length - 1].n + 1) seq.push(mk);
        }
        if (seq.length === 1 && seq[0].at > 20) return [{ n: 1, texto: raw }];
        const out = seq.map((mk, i) => ({
            n: mk.n,
            texto: raw.slice(mk.end, i + 1 < seq.length ? seq[i + 1].at : raw.length).trim()
        })).filter(v => v.texto);
        return out.length ? out : [{ n: 1, texto: raw }];
    }

    function envolverVersiculos(texto, libro, versoFallback) {
        const escapeHtml = s => String(s || '').replace(/[&<>"']/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
        const n0 = Number(versoFallback) || 1;
        const partidos = partirVersiculos(texto);
        const versos = partidos.length > 1 ? partidos : [{ n: n0, texto: partidos[0]?.texto || String(texto || '') }];
        const nombre = libro?.n || 'Pasaje';
        const cap = libro?.cap || '';
        return versos.map(v => {
            const ref = cap ? `${nombre} ${cap}:${v.n}` : `${nombre} ${v.n}`;
            const cuerpo = String(v.texto || '').replace(new RegExp(`^${v.n}(?:[.)]|\\s)+`), '').trim();
            return `<p class="rv-verse-surface" data-verse data-versiculo="${v.n}" data-reference="${escapeHtml(ref)}" tabindex="0" role="button" aria-label="Versículo ${v.n}">
                <span class="rv-verse-text"><sup class="rv-verse-num">${v.n}</sup>${escapeHtml(cuerpo)}</span>
            </p>`;
        }).join('');
    }

    async function persistHighlight(referencia, texto, color) {
        try {
            const user = (await window.supabaseClient?.auth?.getUser?.())?.data?.user;
            if (!user || !window.supabaseClient) return;
            await window.supabaseClient.from('user_bible_actions').insert({
                user_id: user.id,
                action_type: 'highlight',
                reference: referencia,
                version: document.getElementById('selector-version')?.value || 'rv1960',
                text_content: texto,
                metadata: { tono: color || 'oro', fuente: 'popover' },
                updated_at: new Date().toISOString()
            });
        } catch (_e) { /* la marca visual ya quedó en el DOM */ }
    }

    window.revelatioLectura = {
        VERSIONES,
        AUTORES,
        fetchPasaje,
        fetchCapituloLocal,
        fetchComentario,
        comentarioInmediato,
        precargarComentarios,
        persistHighlight,
        tokenAuth,
        partirVersiculos,
        envolverVersiculos,
        normalizarListaVersos,
        esTextoVacioOPlaceholder,
    };
})();
