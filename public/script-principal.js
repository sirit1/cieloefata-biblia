/**
 * Motor de lectura Éfata RevelatiO.
 * Sin Alpine, sin service worker y sin listeners de arranque.
 */
(function revelatioLecturaMotor() {
    if (window.__REVELATIO_LECTURA__) return;
    window.__REVELATIO_LECTURA__ = true;

    const VERSIONES = [
        { key: 'rv1960', etiqueta: 'RVR1960', licencia: 'sbu' },
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
        return armarComentario(referencia, autorKey, pack || {});
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

    function pasajeTieneVersos(data) {
        return Object.values(data?.versionesVersos || {}).some(a => Array.isArray(a) && a.length > 0);
    }

    async function fetchPasajeRemoto(referencia) {
        const token = await tokenAuth();
        const headers = { 'Content-Type': 'application/json' };
        if (token) headers.Authorization = `Bearer ${token}`;
        const ctrl = typeof AbortController !== 'undefined' ? new AbortController() : null;
        const timer = ctrl ? setTimeout(() => ctrl.abort(), 1800) : null;
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
        } finally {
            if (timer) clearTimeout(timer);
        }
    }

    async function fetchPasaje(referencia) {
        let local = null;
        try { local = await fetchCapituloLocal(referencia); } catch (_e) { local = null; }
        let remoto = null;
        if (!pasajeTieneVersos(local)) {
            try { remoto = await fetchPasajeRemoto(referencia); } catch (_e) { remoto = null; }
        }
        const data = fusionarPasajesLocalRemoto(local, remoto);
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

    window.revelatioLectura = { VERSIONES, AUTORES, fetchPasaje, fetchCapituloLocal, fetchComentario, comentarioInmediato, precargarComentarios, persistHighlight, tokenAuth, partirVersiculos, envolverVersiculos };
})();
