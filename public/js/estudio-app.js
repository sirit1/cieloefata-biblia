/**
 * Éfata RevelatiO — estudio-app.js
 * Núcleo de lectura, canon, cuaderno y perspectivas.
 * Depende de: bible-data.js · router.js · navigation.js · ai-engine.js · ui-ux.js
 */
/**
 * RevelatiO — navegación jerárquica, lectura limpia y módulos.
 */
(function revelatioEstudioApp() {
    if (window.__RV_ESTUDIO_APP__) return;
    window.__RV_ESTUDIO_APP__ = true;
    document.body?.classList.add('rv-estudio');

    const RVDATA = window.RV_DATA || {};
    const AT = (window.LIBROS_AT && window.LIBROS_AT.length) ? window.LIBROS_AT : (RVDATA.AT || []);
    const NT = (window.LIBROS_NT && window.LIBROS_NT.length) ? window.LIBROS_NT : (RVDATA.NT || []);
    const VERSOS_CAP = RVDATA.VERSOS_CAP || {};
    const VERSION_LABEL = RVDATA.VERSION_LABEL || {};
    const FICHAS_ACADEMICAS = RVDATA.FICHAS_ACADEMICAS || {};
    const CONTEXTO_HISTORICO = RVDATA.CONTEXTO_HISTORICO || {};
    const AUTOR_LABEL = RVDATA.AUTOR_LABEL || {};
    const GLOSA = RVDATA.GLOSA || {};


    let savedRange = null;
    let selectedText = '';
    let selectedRef = '';
    let panelStamp = 0;
    let commentaryFetchAbort = null;
    let navLockUntil = 0;
    let gotoTimer = 0;
    let lastGotoKey = '';
    let cuadernoFiltro = 'todas';
    let cuadernoTagFiltro = '';
    let autosaveTimer = 0;
    let syncCola = Promise.resolve();
    let mostrarMenuVerso = () => {};
    const CUADERNO_KEY_BASE = 'revelatio_cuaderno_v1';
    const PERFIL_KEY = 'revelatio_perfil_v1';
    const SESION_EXPLICITA_KEY = 'revelatio_sesion_explicita_v1';
    const CUENTAS_KEY = 'revelatio_cuentas_v1';
    const CUOTA_MAX = (window.RV?.storage?.CUOTA_MAX) || (180 * 1024);
    const TTL_MS = (window.RV?.storage?.TTL_MS) || (30 * 24 * 60 * 60 * 1000);
    const RETENTION_DAYS = (window.RV?.storage?.RETENTION_DAYS) || 30;

    // Credenciales conservadas (modo desarrollo / bootstrap local).
    // Alejandro = Administrador con plenas facultades.
    const ADMIN_DEV = {
        email: 'alejandro.sirit@gmail.com',
        password: 'RevelatioAdmin2026',
        nombre: 'Alejandro',
        whatsapp: '+573107860864',
        pais: '+57',
        role: 'admin',
        facultades: ['aposento', 'estudio', 'cuaderno', 'ia', 'canon', 'voz', 'musica', 'aporte', 'circulo'],
    };

    function emailKey(email) {
        return String(email || '').trim().toLowerCase().replace(/[^a-z0-9@._+-]/g, '');
    }

    function esModoDev() {
        try {
            const h = String(location.hostname || '');
            if (h === 'localhost' || h === '127.0.0.1' || h === '[::1]' || h.endsWith('.local')) return true;
            if (/[?&](?:dev|admin)=1\b/i.test(location.search || '')) return true;
        } catch { /* ignore */ }
        return false;
    }

    function esAdmin(perfil = null) {
        const p = perfil || leerPerfil();
        if (!p?.email) return false;
        if (p.role === 'admin' || p.rol === 'admin') return true;
        return emailKey(p.email) === emailKey(ADMIN_DEV.email);
    }

    function perfilAdminCompleto(extra = {}) {
        return {
            email: emailKey(ADMIN_DEV.email),
            whatsapp: ADMIN_DEV.whatsapp,
            pais: ADMIN_DEV.pais,
            nombre: ADMIN_DEV.nombre,
            role: 'admin',
            facultades: ADMIN_DEV.facultades.slice(),
            createdAt: extra.createdAt || new Date().toISOString(),
            lastLogin: new Date().toISOString(),
            ...extra,
        };
    }

    function leerPerfil() {
        const p = parseJson(localStorage.getItem(PERFIL_KEY), null);
        if (p && p.email) return p;
        const legacy = localStorage.getItem('revelatio_ministerio_email');
        if (legacy) {
            const migrated = {
                email: String(legacy).trim().toLowerCase(),
                whatsapp: '',
                pais: '+58',
                nombre: '',
                createdAt: new Date().toISOString(),
                lastLogin: new Date().toISOString(),
            };
            try { localStorage.setItem(PERFIL_KEY, JSON.stringify(migrated)); } catch { /* cuota */ }
            return migrated;
        }
        return null;
    }

    function sesionActiva() {
        // Solo hay sesión si el usuario entró de forma explícita (registro/login).
        // Evita mostrar ficha personal por perfil residual en localStorage.
        if (!sesionExplicita()) return false;
        const p = leerPerfil();
        return Boolean(p && p.email);
    }

    function forzarFichaRegistroVacia() {
        // Una sola vez: recupera la ficha de registro completa sin auto-mostrar perfil previo.
        try {
            const FLAG = 'revelatio_ficha_registro_v3';
            if (localStorage.getItem(FLAG) === '1') return;
            localStorage.removeItem(PERFIL_KEY);
            localStorage.removeItem(SESION_EXPLICITA_KEY);
            localStorage.setItem(FLAG, '1');
        } catch { /* ignore */ }
    }

    let pendingDestino = null;

    function sincronizarGateUI() {
        const ok = sesionActiva();
        const admin = esAdmin();
        document.body.classList.toggle('is-registrado', ok);
        document.body.classList.toggle('is-admin', admin);
        const gate = document.getElementById('rv-auth-gate-msg');
        if (gate && ok) gate.hidden = true;
        const card = document.getElementById('rv-auth-card');
        if (card && ok) card.classList.remove('is-gate-focus');
        const session = document.getElementById('rv-auth-session');
        if (session) session.classList.toggle('is-admin', admin);
        const badge = document.getElementById('rv-auth-admin-badge');
        if (badge) badge.hidden = true;
        const roleEl = document.getElementById('rv-auth-session-role');
        if (roleEl) roleEl.textContent = ok ? 'Listo para entrar' : 'Perfil activo';
    }

    function exigirRegistro(motivo, destino) {
        // Acceso libre a las puertas: el registro es opcional (enriquece Cuaderno / perfil).
        // Solo retenemos destino pendiente si el caller quiere forzar ficha más adelante.
        if (destino) pendingDestino = { ...destino };
        void motivo;
        if (sesionActiva()) return true;
        // No bloqueamos: invitamos al Círculo de forma sutil, sin tarjeta tosca.
        const gate = document.getElementById('rv-auth-gate-msg');
        if (gate) {
            gate.hidden = false;
            gate.textContent = 'Puedes entrar ya. Si quieres vincular notas a tu perfil, únete al Círculo más abajo.';
        }
        sincronizarGateUI();
        return true;
    }

    function liberarDestinoPendiente() {
        // Nunca reabrir splash tras auth.
        try {
            sessionStorage.setItem('rv_splash_done_v4', '1');
            sessionStorage.setItem('rv_splash_done_v1', '1');
        } catch { /* ignore */ }
        try { window.revelatioForzarUmbral?.(); } catch { /* ignore */ }
        document.getElementById('rv-splash')?.classList.add('is-out', 'is-gone');
        if (!pendingDestino || !sesionActiva()) return;
        const dest = pendingDestino;
        pendingDestino = null;
        setTimeout(() => {
            if (dest.acompanamiento) entrarAcompanamiento(dest);
            else entrarSantuario({ ...dest, silencio: true });
        }, 180);
    }

    function guardarPerfil(perfil) {
        try { localStorage.setItem(PERFIL_KEY, JSON.stringify(perfil)); } catch { /* cuota */ }
        return perfil;
    }

    function marcarSesionExplicita() {
        try { localStorage.setItem(SESION_EXPLICITA_KEY, '1'); } catch { /* ignore */ }
    }

    function sesionExplicita() {
        try { return localStorage.getItem(SESION_EXPLICITA_KEY) === '1'; } catch { return false; }
    }

    function limpiarSesionSiNoExplicita() {
        // El formulario de entrada debe quedar vacío: no mostrar auto-login de desarrollo.
        if (sesionExplicita()) return false;
        try { localStorage.removeItem(PERFIL_KEY); } catch { /* ignore */ }
        return true;
    }

    function vaciarCamposRegistro() {
        ['reg-email', 'reg-whatsapp', 'reg-nombre', 'login-email', 'login-whatsapp', 'login-password'].forEach((id) => {
            const el = document.getElementById(id);
            if (el) el.value = '';
        });
        const paisReg = document.getElementById('reg-pais');
        if (paisReg) paisReg.value = '+57';
        const paisLogin = document.getElementById('login-pais');
        if (paisLogin) paisLogin.value = '+57';
    }

    function leerCuentas() {
        const data = parseJson(localStorage.getItem(CUENTAS_KEY), {});
        return data && typeof data === 'object' ? data : {};
    }

    function escribirCuentas(map) {
        try { localStorage.setItem(CUENTAS_KEY, JSON.stringify(map)); } catch { /* cuota */ }
    }

    function cuadernoKeyPara(email) {
        const key = emailKey(email);
        return key ? `${CUADERNO_KEY_BASE}__${key}` : CUADERNO_KEY_BASE;
    }

    function CUADERNO_KEY() {
        const perfil = leerPerfil();
        return cuadernoKeyPara(perfil?.email);
    }

    const ABREV = {
        gn: 'Génesis', gen: 'Génesis', genesis: 'Génesis',
        ex: 'Éxodo', exo: 'Éxodo', exodo: 'Éxodo',
        lv: 'Levítico', lev: 'Levítico',
        nm: 'Números', num: 'Números',
        dt: 'Deuteronomio', deu: 'Deuteronomio',
        jos: 'Josué', jue: 'Jueces', rt: 'Rut',
        '1s': '1 Samuel', '1sam': '1 Samuel', '2s': '2 Samuel', '2sam': '2 Samuel',
        '1r': '1 Reyes', '1re': '1 Reyes', '2r': '2 Reyes', '2re': '2 Reyes',
        '1cr': '1 Crónicas', '2cr': '2 Crónicas', esd: 'Esdras', ne: 'Nehemías', est: 'Ester',
        sl: 'Salmos', sal: 'Salmos', prv: 'Proverbios', pr: 'Proverbios',
        ec: 'Eclesiastés', ecl: 'Eclesiastés', cnt: 'Cantares', cant: 'Cantares',
        is: 'Isaías', isa: 'Isaías', isaias: 'Isaías',
        jr: 'Jeremías', jer: 'Jeremías', lm: 'Lamentaciones', lam: 'Lamentaciones',
        ez: 'Ezequiel', eze: 'Ezequiel', dn: 'Daniel', dan: 'Daniel',
        os: 'Oseas', jl: 'Joel', am: 'Amós', abd: 'Abdías', jon: 'Jonás',
        miq: 'Miqueas', nah: 'Nahúm', hab: 'Habacuc', sof: 'Sofonías', hag: 'Hageo',
        zac: 'Zacarías', mal: 'Malaquías',
        mt: 'Mateo', mat: 'Mateo', mc: 'Marcos', mr: 'Marcos', lc: 'Lucas', luc: 'Lucas',
        jn: 'Juan', hch: 'Hechos', act: 'Hechos',
        ro: 'Romanos', rm: 'Romanos', rom: 'Romanos', romanos: 'Romanos',
        '1co': '1 Corintios', '2co': '2 Corintios', ga: 'Gálatas', gal: 'Gálatas',
        ef: 'Efesios', flp: 'Filipenses', fil: 'Filipenses', col: 'Colosenses',
        '1ts': '1 Tesalonicenses', '2ts': '2 Tesalonicenses',
        '1tm': '1 Timoteo', '2tm': '2 Timoteo', tit: 'Tito', flm: 'Filemón',
        heb: 'Hebreos', stg: 'Santiago', snt: 'Santiago',
        '1p': '1 Pedro', '1pe': '1 Pedro', '2p': '2 Pedro',
        '1jn': '1 Juan', '2jn': '2 Juan', '3jn': '3 Juan',
        jud: 'Judas', ap: 'Apocalipsis', apoc: 'Apocalipsis'
    };
    const PLATAFORMA_URL = 'https://revelatio.efata.app';
    const cardState = { text: '', ref: '', version: '', fondo: 'celestial', tipo: 'lectura' };
    const texturas = {};
    let isotipoImg = null;
    let lockupImg = null;
    let palabraImg = null;
    let cieloBwImg = null;

    function norm(s) {
        return String(s || '').toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g, '');
    }

    function escapeHtml(s) {
        return String(s || '').replace(/[&<>]/g, ch => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;' }[ch]));
    }

    function resolveTestamentoLibro(nombre, hint) {
        const nav = window.RV?.bibleNav;
        if (nav?.resolveTestamento) return nav.resolveTestamento(nombre, hint);
        if (nav?.isOldTestament?.(nombre)) return 'at';
        if (nav?.isNewTestament?.(nombre)) return 'nt';
        if (hint === 'at' || hint === 'nt') return hint;
        return 'at';
    }

    function estado() {
        return window.__revelatioLibroActivo || { n: 'Romanos', c: 16, cap: 12, testamento: 'nt' };
    }

    function versionActiva() {
        return document.getElementById('selector-version')?.value || localStorage.getItem('revelatio_version') || 'rv1960';
    }

    function autorActivo() {
        const saved = document.getElementById('selector-autor')?.value || localStorage.getItem('revelatio_autor') || 'charles-spurgeon';
        if (AUTOR_LABEL[saved]) return saved;
        const known = (window.REVELATIO_AUTORES || []).some(a => a.key === saved);
        return known ? saved : 'charles-spurgeon';
    }

    function lentes(libro, autor) {
        const cap = `${libro.n} ${libro.cap || 1}`;
        const packs = {
            cieloefata: [
                { t: 'El texto', c: `${cap} se lee bajo la cruz: no como consejo de bienestar, sino como Palabra que llama al arrepentimiento y a la fe.` },
                { t: 'Cristo', c: 'Toda la Escritura testifica de Él. Este capítulo no se agota en la historia humana: anuncia o aplica la obra del Hijo.' },
                { t: 'Pastoreo', c: `Las técnicas consuelan un rato. ${CREDO}` }
            ],
            'jamieson-fausset-brown': [
                { t: 'Contexto', c: `${cap}: la línea de JFB lee el pasaje en su marco histórico-gramatical y lo ancla en la redención prometida.` },
                { t: 'Sentido', c: 'El comentario histórico insiste en el sentido del autor inspirado, no en usos posteriores del texto.' },
                { t: 'Cristo', c: 'La unidad de la Escritura conduce al Mesías: promesa, cumplimiento y aplicación a la iglesia.' }
            ],
            'matthew-henry': [
                { t: 'Devoción', c: `${cap} se medita para adorar: Henry busca que el lector tema a Dios y se consuele en Cristo.` },
                { t: 'Doctrina', c: 'La observación práctica nace de la doctrina: pecado, gracia, fe y obediencia no se separan.' },
                { t: 'Llamado', c: 'El texto pide una respuesta del corazón, no un comentario ornamental.' }
            ],
            'albert-barnes': [
                { t: 'Exposición', c: `${cap}: Barnes aclara términos, conexiones y el argumento del escritor sagrado.` },
                { t: 'Gramática', c: 'La exégesis sigue el orden del texto: qué dice, a quién, y con qué fin.' },
                { t: 'Fe', c: 'La explicación sirve a la fe; no sustituye la autoridad de la Escritura.' }
            ],
            patristica: [
                { t: 'Testimonio', c: `${cap} se lee con la iglesia antigua: Cristo como clave de la Ley, los Profetas y el Evangelio.` },
                { t: 'Regla', c: 'La analogía de la fe guarda el sentido: un solo Dios, un solo Señor, una sola salvación.' },
                { t: 'Límite', c: 'Los Padres iluminan; no rivalizan con la Palabra. La Escritura permanece suficiente.' }
            ]
        };
        return packs[autor] || packs.cieloefata;
    }

    function actualizarBreadcrumbs(libro) {
        const nav = document.getElementById('breadcrumbs');
        if (!nav) return;
        const tes = libro.testamento === 'nt' ? 'Nuevo Testamento' : 'Antiguo Testamento';
        nav.innerHTML = `
            <button type="button" data-crumb="biblia" class="rv-crumb-link">Biblia</button>
            <span class="rv-crumb-sep" aria-hidden="true">›</span>
            <button type="button" data-crumb="${libro.testamento}" class="rv-crumb-link">${tes}</button>
            <span class="rv-crumb-sep" aria-hidden="true">›</span>
            <span class="rv-crumb-here">${escapeHtml(libro.n)} ${libro.cap}${libro.verso ? `:${libro.verso}` : ''}</span>`;
    }

    async function tokenAuth() {
        if (window.revelatioLectura?.tokenAuth) return window.revelatioLectura.tokenAuth();
        try {
            return (await window.supabaseClient?.auth?.getSession?.())?.data?.session?.access_token || null;
        } catch { return null; }
    }

    async function cargarPackLocal(key) {
        const rutas = [`data/versiones/${key}.json`, `/data/versiones/${key}.json`];
        for (const ruta of rutas) {
            try {
                const res = await fetch(ruta, { cache: 'force-cache' });
                if (!res.ok) continue;
                return await res.json();
            } catch { /* siguiente ruta */ }
        }
        return null;
    }

    function versosDePackLocal(pack, libro) {
        const cap = pack?.libros?.[libro.n]?.[String(libro.cap)];
        if (!cap || typeof cap !== 'object') return [];
        return Object.keys(cap)
            .map(n => ({ n: Number(n), texto: String(cap[n] || '').trim() }))
            .filter(v => v.n > 0 && v.texto)
            .sort((a, b) => a.n - b.n);
    }

    async function fusionarPacksLocales(passage, libro) {
        const base = passage || { versiones: {}, versionesVersos: {}, versionesLista: [], original: null };
        base.versiones = { ...(base.versiones || {}) };
        base.versionesVersos = { ...(base.versionesVersos || {}) };
        base.versionesLista = Array.isArray(base.versionesLista) ? [...base.versionesLista] : [];
        for (const key of ['rv1960', 'tla', 'dhh', 'septuaginta']) {
            const pack = await cargarPackLocal(key);
            const versos = versosDePackLocal(pack, libro);
            if (!versos.length) continue;
            if ((base.versionesVersos[key]?.length || 0) >= versos.length) continue;
            base.versiones[key] = versos.map(v => `${v.n} ${v.texto}`).join(' ');
            base.versionesVersos[key] = versos;
            if (!base.versionesLista.some(v => v.key === key)) {
                base.versionesLista.push({ key, etiqueta: pack.etiqueta || VERSION_LABEL[key], licencia: pack.licencia });
            }
        }
        return base;
    }

    async function completarTraduccionLxx(libro, passage) {
        const actuales = normalizarVersos(passage?.versionesVersos?.septuaginta);
        const faltaEs = !actuales.length || actuales.some((v) => !v.textoEs);
        if (!faltaEs) return passage;
        try {
            const ctrl = typeof AbortController !== 'undefined' ? new AbortController() : null;
            const timer = ctrl ? setTimeout(() => ctrl.abort(), 90000) : null;
            const res = await fetch(
                `/api/bible?book=${encodeURIComponent(libro.n)}&chapter=${encodeURIComponent(libro.cap)}&version=LXX`,
                { headers: { Accept: 'application/json' }, signal: ctrl?.signal }
            );
            if (timer) clearTimeout(timer);
            const json = await res.json().catch(() => null);
            const crudos = json?.data?.versionesVersos?.septuaginta
                || (Array.isArray(json?.verses)
                    ? json.verses.map((v) => ({
                        n: v.verse || v.n,
                        texto: v.text || v.texto,
                        textoEs: v.textoEs || v.textEs || '',
                    }))
                    : []);
            const versos = normalizarVersos(crudos);
            if (!versos.length) return passage;
            const next = {
                ...(passage || {}),
                versionesVersos: { ...(passage?.versionesVersos || {}), septuaginta: versos },
                versiones: {
                    ...(passage?.versiones || {}),
                    septuaginta: versos.map((v) => `${v.n} ${v.texto}`).join(' '),
                },
                versionesLista: Array.isArray(passage?.versionesLista) ? [...passage.versionesLista] : [],
            };
            if (!next.versionesLista.some((v) => v.key === 'septuaginta')) {
                next.versionesLista.push({
                    key: 'septuaginta',
                    etiqueta: json?.version || 'Septuaginta (Rahlfs) · griego y español',
                    licencia: 'public',
                });
            }
            return next;
        } catch {
            return passage;
        }
    }

    async function cargarPasaje(referencia) {
        let data = null;
        const version = versionActiva();
        const loc = estado();
        try {
            if (window.revelatioLectura?.fetchPasaje) {
                data = await window.revelatioLectura.fetchPasaje(referencia, {
                    version,
                    book: loc?.n,
                    chapter: loc?.cap,
                });
            } else if (window.revelatioLectura?.fetchCapituloLocal) {
                data = await window.revelatioLectura.fetchCapituloLocal(referencia);
            }
        } catch { data = null; }

        const tieneVersos = Object.values(data?.versionesVersos || {}).some(
            (a) => Array.isArray(a) && normalizarVersos(a).length > 0
        );
        if (!tieneVersos) {
            try {
                const ctrl = typeof AbortController !== 'undefined' ? new AbortController() : null;
        const timer = ctrl ? setTimeout(() => ctrl.abort(), 25000) : null;
                const res = await fetch('/api/pasaje', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json', Accept: 'application/json' },
                    body: JSON.stringify({ referencia }),
                    signal: ctrl?.signal
                });
                if (timer) clearTimeout(timer);
                if (res.ok) {
                    const json = await res.json();
                    if (json?.success && json.data) data = json.data;
                    else if (json?.success && Array.isArray(json.verses) && json.verses.length) {
                        const key = claveMotor(version);
                        const versos = json.verses.map((v) => ({
                            n: Number(v.verse || v.n || v.number),
                            texto: String(v.text || v.texto || '').trim(),
                        })).filter((v) => v.n > 0 && v.texto);
                        data = {
                            referencia: `${json.book || loc?.n} ${json.chapter || loc?.cap}`,
                            versiones: { [key]: versos.map((v) => `${v.n} ${v.texto}`).join(' ') },
                            versionesVersos: { [key]: versos },
                            versionesLista: [{ key, etiqueta: json.version, licencia: 'remote' }],
                            original: null,
                        };
                    }
                }
            } catch { /* keep prior */ }
        }

        try {
            const fused = await fusionarPacksLocales(data, loc);
            // Si packs locales vacíos no aportan, conservar contingencia del fetch.
            window.__revelatioPassageData = fused;
            return fused;
        } catch {
            const out = data || { versiones: {}, versionesVersos: {}, versionesLista: [], original: null };
            window.__revelatioPassageData = out;
            return out;
        }
    }

    async function cargarComentario(referencia, autor) {
        const ref = String(referencia || '').trim();
        const nombre = AUTOR_LABEL[autor] || autor || 'Matthew Henry';
        if (!ref) {
            return { ia: false, vacio: true, titulo: nombre, entradas: [], cuerpo: '', paragraphs: [] };
        }
        try {
            if (commentaryFetchAbort) commentaryFetchAbort.abort();
            commentaryFetchAbort = new AbortController();
            const controller = commentaryFetchAbort;
            const timer = setTimeout(() => controller.abort(), 37000);
            const verseText =
                window.activeStudyText ||
                document.querySelector('.rv-verse-surface.is-verse-on .rv-verse-text, [data-verse].is-verse-on .rv-verse-text')?.textContent ||
                '';
            const res = await fetch('/api/commentary', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json', Accept: 'application/json' },
                signal: controller.signal,
                body: JSON.stringify({ passage: ref, author: nombre, verseText: String(verseText || '').trim() }),
            });
            clearTimeout(timer);
            const json = await res.json().catch(() => ({}));
            const text = String(json?.text || json?.answer || json?.data?.cuerpo || '').trim();
            if (json.success && text && !esRuidoEditorial(text)) {
                const paragraphs = text.split(/\n{2,}/).map((t) => t.trim()).filter(Boolean);
                return {
                    ia: true,
                    vacio: false,
                    titulo: nombre,
                    obra: '',
                    entradas: paragraphs.map((t, i) => ({ n: String(i + 1), texto: t })),
                    cuerpo: text,
                    paragraphs,
                };
            }
            throw new Error(json.error || 'Error al procesar la solicitud');
        } catch (err) {
            return {
                ia: false,
                vacio: true,
                titulo: nombre,
                entradas: [],
                cuerpo: '',
                paragraphs: [],
                error: err?.name === 'AbortError' ? 'El motor tardó demasiado. Reintenta.' : err.message,
            };
        }
    }

    function claveMotor(version) {
        if (version === 'lxx' || version === 'septuaginta') return 'septuaginta';
        if (version === 'rv1909' || version === 'btx3' || version === 'interlineal') return 'rv1960';
        return version;
    }

    function etiquetaVersion(version, passage) {
        const key = claveMotor(version);
        const api = (passage?.versionesLista || []).find(v => v.key === key || v.key === version);
        if (version === 'rv1909' && !passage?.versiones?.rv1960) return VERSION_LABEL.rv1960;
        const base = api?.etiqueta || VERSION_LABEL[version] || version;
        if (passage?.bibliotecaLocal && api?.licencia === 'local') {
            return `${base} · ${passage.fuente || 'biblioteca local'}`;
        }
        return base;
    }

    function tokensHtml(tokens, verso, libro) {
        return (tokens || []).map(t => {
            const palabra = t.palabra || t.texto || t.word || '';
            const strong = t.strong || '';
            const raiz = t.raiz || t.lemma || t.lexema || '';
            const gram = t.gram || t.morfologia || t.morph || '';
            const glosa = t.glosa || t.translation || GLOSA[strong] || '';
            const meta = [strong, raiz, gram, glosa].filter(Boolean).join(' · ');
            return `<span class="rv-token${strong ? ' is-strong' : ''}" ${strong ? `data-strong="${escapeHtml(strong)}" role="button" tabindex="0"` : ''} title="${escapeHtml(meta)}">
                <span class="rv-token-orig">${escapeHtml(palabra)}</span>
                ${strong ? `<sup class="rv-strong-num">${escapeHtml(strong)}</sup>` : ''}
                <span class="rv-token-meta">${escapeHtml(meta)}</span>
            </span>`;
        }).join('');
    }

    function partirVersos(texto) {
        if (window.revelatioLectura?.partirVersiculos) {
            const packed = window.revelatioLectura.partirVersiculos(texto);
            if (Array.isArray(packed) && packed.length) return packed;
        }
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

    function tokensStrongDe(n, extraTokens) {
        const original = window.__revelatioPassageData?.original;
        const verso = (original?.versos || []).find(v => Number(v.verso || v.n || v.verse) === Number(n));
        const fromOriginal = verso?.tokens || [];
        return (extraTokens && extraTokens.length ? extraTokens : fromOriginal).filter(t => t.strong);
    }

    function strongsHtml(n, extraTokens) {
        const PART = /^(ὁ|ἡ|τό|τὸ|τοῦ|τῆς|τῷ|τῇ|καί|καὶ|δέ|δὲ|τε|οὖν|γάρ|γὰρ|εἰς|ἐν|ἐκ|ἀπό|διά|μή|μὴ|οὐ|οὐκ|ו|ה|את|ל|ב|מ|כ)$/i;
        const seen = new Set();
        const keys = [];
        for (const t of tokensStrongDe(n, extraTokens)) {
            const s = String(t.strong || '');
            const p = String(t.palabra || t.texto || '').trim();
            if (!s || seen.has(s) || PART.test(p)) continue;
            seen.add(s);
            keys.push({ strong: s, palabra: p });
            if (keys.length >= 8) break;
        }
        if (!keys.length) return '';
        return `<span class="rv-strong-row">${keys.map(t =>
            `<button type="button" class="rv-strong" data-strong="${escapeHtml(t.strong)}" data-lemma="${escapeHtml(t.palabra)}" aria-label="Strong ${escapeHtml(t.strong)}">${escapeHtml(t.palabra)}<sup>${escapeHtml(t.strong)}</sup></button>`
        ).join('')}</span>`;
    }

    function textoVersoLimpio(texto, n) {
        let t = String(texto || '').replace(/\s+/g, ' ').trim();
        const num = Number(n);
        if (num > 0) t = t.replace(new RegExp(`^${num}(?:[.)]|\\s)+`), '');
        return t.trim();
    }

    function versosHtml(versos, libro) {
        return (versos || []).map(v => {
            const n = v.n || v.verse || v.verso || v.versiculo || 1;
            const body = textoVersoLimpio(v.texto || v.text || '', n);
            const ref = `${libro.n} ${libro.cap}:${n}`;
            const inner = Array.isArray(v.tokens) && v.tokens.length
                ? tokensHtml(v.tokens, n, libro)
                : escapeHtml(body);
            const es = String(v.textoEs || v.textEs || '').trim();
            const esBlock = es
                ? `<span class="rv-lxx-es">${escapeHtml(es)}</span>`
                : '';
            const strong = strongsHtml(n, v.tokens);
            return `<p class="rv-verse-surface" data-verse data-versiculo="${n}" data-reference="${escapeHtml(ref)}" tabindex="0" role="button" aria-label="Versículo ${n}">
                <span class="rv-verse-text"><sup class="rv-verse-num">${n}</sup>${inner}</span>
                ${esBlock}
                ${strong}
            </p>`;
        }).join('');
    }

    function versosEsperados(libro) {
        return Number(VERSOS_CAP[libro?.n]?.[Number(libro?.cap) - 1]) || 0;
    }

    function esTextoPlaceholder(texto) {
        if (window.revelatioLectura?.esTextoVacioOPlaceholder) {
            return window.revelatioLectura.esTextoVacioOPlaceholder(texto);
        }
        const t = String(texto || '').replace(/\s+/g, ' ').trim();
        return !t || /^(?:\.{1,6}|…+|·+|•+|[-–—]+)$/i.test(t);
    }

    function normalizarVersos(lista) {
        return (lista || [])
            .map((v, i) => ({
                n: Number(v.n || v.verse || v.verso || v.versiculo || v.number || i + 1),
                texto: String(
                    v.texto || v.text || v.content || v.body || v.verse_text
                    || (typeof v.verse === 'string' ? v.verse : '')
                    || ''
                ).trim(),
                textoEs: String(v.textoEs || v.textEs || v.es || '').trim() || undefined,
                tokens: Array.isArray(v.tokens) ? v.tokens : undefined
            }))
            .filter((v) => v.n > 0 && ((v.texto && !esTextoPlaceholder(v.texto)) || (v.tokens && v.tokens.length)))
            .sort((a, b) => a.n - b.n);
    }

    function originalComoVersos(passage) {
        return normalizarVersos((passage?.original?.versos || []).map((v) => ({
            n: v.verso || v.n || v.verse,
            tokens: v.tokens,
            texto: (v.tokens || []).map((t) => t.palabra || t.texto || '').join(' ')
        })));
    }

    function textoComoVersos(texto, libro) {
        const partidos = partirVersos(texto).filter((v) => !esTextoPlaceholder(v.texto));
        if (partidos.length > 1) return versosHtml(partidos, libro);
        const unico = partidos[0]?.texto || String(texto || '').trim();
        if (!unico || esTextoPlaceholder(unico)) return '';
        return versosHtml([{ n: 1, texto: unico }], libro);
    }

    function elegirVersosPasaje(libro, version, passage) {
        const key = claveMotor(version);
        const orden = [key, 'rv1960', 'rv1909', 'kjv', 'tla', 'dhh'];
        const seen = new Set();
        for (const k of orden) {
            if (!k || seen.has(k)) continue;
            seen.add(k);
            const versos = normalizarVersos(passage?.versionesVersos?.[k]);
            if (versos.length) {
                return {
                    versos,
                    usedKey: k,
                    isFallback: Boolean(k && key && k !== key),
                };
            }
            const bloque = passage?.versiones?.[k];
            if (bloque && !esTextoPlaceholder(bloque)) {
                const partidos = partirVersos(bloque).filter((v) => !esTextoPlaceholder(v.texto));
                if (partidos.length) {
                    return {
                        versos: partidos,
                        usedKey: k,
                        isFallback: Boolean(k && key && k !== key),
                    };
                }
            }
        }
        return { versos: [], usedKey: null, isFallback: false };
    }

    function badgeFallbackHtml() {
        // Avisos de contingencia RVR1909 eliminados: la API entrega la versión pedida o error.
        return '';
    }

    function cuerpoLectura(libro, version, passage) {
        const original = passage?.original;
        const bookName = libro?.n || '';
        const nav = window.RV?.bibleNav;
        const resolvedOT = Boolean(nav?.isOldTestament?.(bookName) || (!nav?.isNewTestament?.(bookName) && libro?.testamento === 'at'));
        const resolvedNT = Boolean(nav?.isNewTestament?.(bookName) || (!resolvedOT && libro?.testamento === 'nt'));

        let lxxNtNotice = '';
        if (version === 'lxx' || version === 'septuaginta') {
            const lxxVersos = normalizarVersos(passage?.versionesVersos?.septuaginta);
            const lxxTexto = passage?.versiones?.septuaginta || original?.septuaginta?.texto;
            if (lxxVersos.length) {
                const hayEs = lxxVersos.some((v) => v.textoEs);
                const notaEs = hayEs
                    ? `<p class="rv-lectura-note text-[13px] leading-relaxed text-[#0F172A]/85 mb-4 border-l-2 border-[#C59B27] pl-3">Septuaginta (Rahlfs): griego LXX completo y traducción al español de este griego, no de la Reina-Valera ni del texto masorético.</p>`
                    : `<p class="rv-lectura-note text-[13px] leading-relaxed text-[#0F172A]/85 mb-4 border-l-2 border-[#C59B27] pl-3">Septuaginta (Rahlfs): capítulo griego completo. La traducción al español se está completando…</p>`;
                return `${notaEs}<div class="rv-lectura-cuerpo text-[#0F172A]">${versosHtml(lxxVersos, libro)}</div>`;
            }
            if (lxxTexto && !esTextoPlaceholder(lxxTexto)) {
                return `<div class="rv-lectura-cuerpo text-[#0F172A]">${textoComoVersos(lxxTexto, libro)}</div>`;
            }
            if (resolvedOT) {
                // AT + LXX: válido; si no hay griego aún, caer a RVR/otras sin aviso de NT.
            } else if (resolvedNT) {
                lxxNtNotice = `<p class="rv-lectura-note text-[13px] leading-relaxed text-[#0F172A]/85 mb-4 border-l-2 border-[#C59B27] pl-3">La Septuaginta es el Antiguo Testamento griego (LXX / Rahlfs). Para este libro del Nuevo Testamento elige texto griego original (Nestle-Aland / Textus Receptus) o RVR1960.</p>`;
            }
        }

        const pick = elegirVersosPasaje(libro, version, passage);
        if (pick.versos.length) {
            return `${lxxNtNotice}<div class="rv-lectura-cuerpo text-[#0F172A]">${versosHtml(pick.versos, libro)}</div>`;
        }

        const orig = originalComoVersos(passage);
        if (orig.length) {
            return `${lxxNtNotice}<div class="rv-lectura-cuerpo text-[#0F172A]">${versosHtml(orig, libro)}</div>`;
        }

        if (lxxNtNotice) return lxxNtNotice;

        return `
            <p class="rv-lectura-muted text-[14px] leading-relaxed text-[#0F172A]">
                No se pudo obtener el texto de <strong>${escapeHtml(libro.n)} ${libro.cap}</strong>
                en ${escapeHtml(etiquetaVersion(version, passage))}.
            </p>
            <button type="button" class="rv-sp-retry mt-3" data-rv-retry-pasaje="${escapeHtml(libro.n)} ${libro.cap}">Actualizar texto</button>`;
    }

    function esRuidoEditorial(texto) {
        return /no hay transcripci[oó]n|nota general del comentarista|este panel no admite|s[íi]ntesis de IA|texto hist[oó]rico de dominio público|consigna gen[eé]rica de otro libro/i.test(String(texto || ''));
    }

    function referenciaComentario(libro) {
        const n = Number(libro?.verso || 0);
        if (!libro?.n) return '';
        return `${libro.n} ${libro.cap}:${n || 1}`;
    }

    function mapUiVersion(version) {
        const v = String(version || '').toLowerCase();
        if (!v || v === 'rv1960' || v === 'rvr1960') return 'RVR1960';
        if (v === 'rv1909' || v === 'rvr1909' || v.includes('1909')) return 'RVR1909';
        if (v === 'dhh') return 'DHH';
        if (v === 'tla') return 'TLA';
        if (v === 'nvi') return 'NVI';
        if (v === 'kjv') return 'KJV';
        if (v === 'lxx' || v === 'septuaginta' || v === 'textual' || v === 'rahlfs') return 'LXX';
        return String(version || 'RVR1960').toUpperCase();
    }

    function syncLecturaHash(libro) {
        const next = urlLectura({
            libro: libro.n,
            cap: libro.cap,
            verso: libro.verso,
            canon: true,
        });
        if (String(location.hash || '') === next) return;
        try {
            history.replaceState({ revelatio: 'lectura' }, '', next);
        } catch {
            /* ignore */
        }
    }

    async function refrescarComentario(libro) {
        const panel = document.getElementById('study-drawer') || document.getElementById('rv-study-panel');
        if (panel?.classList.contains('is-open')) return;
        const autor = autorActivo();
        const ref = referenciaComentario(libro);
        const neuro = document.getElementById('analisis-neuro');
        if (neuro) {
            neuro.innerHTML = `<div class="py-8 text-center font-serif text-amber-800 text-sm"><span class="animate-spin inline-block mr-1">⏳</span> Generando exposición para <strong>${escapeHtml(ref)}</strong>...</div>`;
        }
        try {
            const comentario = await cargarComentario(ref, autor);
            if (comentario?.cuerpo && !comentario?.vacio) {
                pintarComentario(libro, autor, comentario);
            } else {
                pintarComentario(libro, autor, { titulo: AUTOR_LABEL[autor] || autor, vacio: true });
            }
        } catch {
            pintarComentario(libro, autor, { titulo: AUTOR_LABEL[autor] || autor, vacio: true });
        }
    }

    function pintarComentario(libro, autor, extra) {
        const etiqueta = document.getElementById('etiqueta-autor');
        if (etiqueta) etiqueta.textContent = extra?.titulo || AUTOR_LABEL[autor] || autor || '';
        const neuro = document.getElementById('analisis-neuro');
        if (!neuro) return;
        const ref = referenciaComentario(libro) || extra?.referencia || '';

        const textos = (extra?.paragraphs || extra?.entradas || [])
            .map((item) => String(typeof item === 'string' ? item : item?.texto || '').trim())
            .filter((t) => t && !esRuidoEditorial(t));
        const cuerpo = String(extra?.cuerpo || '').trim();
        let bloques = textos.length ? textos : (cuerpo && !esRuidoEditorial(cuerpo) && !extra?.vacio ? [cuerpo] : []);
        // Prohibido: síntesis de libro / plantillas / frases genéricas
        bloques = bloques.filter(
            (t) =>
                !/predica\s+\S+\s+para llevar|Henry lee\s+|sitúan\s+\S+\s+en su marco|expone .+ a la luz de la Escritura, para que el lector crea/i.test(
                    t
                )
        );

        const refEl = document.getElementById('ref-comentario');
        if (refEl) refEl.textContent = ref;
        if (!bloques.length) {
            const detalle = extra?.error
                ? `Error al obtener la exposición: ${escapeHtml(extra.error)}. Verifica la conexión con el servidor.`
                : `No hay exposición disponible para <strong>${escapeHtml(ref || 'este pasaje')}</strong>. Verifica que el servidor esté activo y la clave Gemini en <code>.env.local</code>.`;
            neuro.innerHTML = `<div class="p-3 bg-stone-50 border border-[#E8DFC8] rounded-xl text-stone-600 font-serif text-sm">${detalle}</div>`;
            return;
        }
        neuro.innerHTML = bloques.map((t) => `<p class="rv-exegesis indent-2 leading-relaxed">${escapeHtml(t)}</p>`).join('');
    }


    function fichaAcademicaDe(nombreLibro) {
        const n = String(nombreLibro || '').trim();
        if (FICHAS_ACADEMICAS[n]) return FICHAS_ACADEMICAS[n];
        const key = Object.keys(FICHAS_ACADEMICAS).find(k => packName(k) === packName(n));
        return key ? FICHAS_ACADEMICAS[key] : null;
    }

    function contextoHistoricoDe(nombreLibro) {
        const n = String(nombreLibro || '').trim();
        if (CONTEXTO_HISTORICO[n]) return CONTEXTO_HISTORICO[n];
        const key = Object.keys(CONTEXTO_HISTORICO).find((k) => packName(k) === packName(n));
        return key ? CONTEXTO_HISTORICO[key] : null;
    }

    function pintarContextoHistorico(libro) {
        const box = document.getElementById('contexto-historico-header');
        if (!box) return;
        const ctx = contextoHistoricoDe(libro?.n);
        if (!ctx) {
            box.hidden = true;
            return;
        }
        const set = (id, val) => {
            const el = document.getElementById(id);
            if (el) el.textContent = val || '—';
        };
        set('ctx-autor', ctx.autor);
        set('ctx-fecha', ctx.fecha);
        set('ctx-destinatarios', ctx.destinatarios);
        set('ctx-resumen', ctx.resumen_historico);

        const esCap1 = Number(libro?.cap) === 1;
        const cambioLibro = window.__rvCtxLibro !== libro?.n;
        const enAposento = document.body.classList.contains('is-santuario');
        const mismoLibroVisible = window.__rvCtxVisibleLibro === libro?.n;

        // Render al cambiar de libro o al cargar cap. 1; permanece en el libro y en Aposento
        box.hidden = !(cambioLibro || esCap1 || enAposento || mismoLibroVisible);
        if (!box.hidden) window.__rvCtxVisibleLibro = libro?.n;
        window.__rvCtxLibro = libro?.n;
        box.dataset.libro = libro?.n || '';
        box.dataset.cap = String(libro?.cap || '');
    }

    function pintarFichaAcademica(libro) {
        const box = document.getElementById('rv-ficha-academica');
        if (!box) return;
        const ficha = fichaAcademicaDe(libro?.n);
        if (!ficha) {
            box.hidden = true;
            return;
        }
        // La ficha editorial de contexto sustituye el rol introductorio; académica queda como detalle opcional oculto
        box.hidden = true;
        const set = (id, val) => {
            const el = document.getElementById(id);
            if (el) el.textContent = val || '—';
        };
        set('rv-ficha-titulo', `${libro.n} · Capítulo ${libro.cap}`);
        set('rv-ficha-autor', ficha.autor);
        set('rv-ficha-fecha', ficha.fecha);
        set('rv-ficha-quien', ficha.quien);
        set('rv-ficha-como', ficha.como);
        set('rv-ficha-donde', ficha.donde);
        set('rv-ficha-cuando', ficha.cuando);
    }

    async function pintarPaneles(libro) {
        const resolvedTes = resolveTestamentoLibro(libro?.n, libro?.testamento);
        libro = { ...libro, testamento: resolvedTes };
        window.__revelatioLibroActivo = libro;
        const stamp = ++panelStamp;
        try { salirModoVersiculo(); } catch { /* ignore */ }
        const version = versionActiva();
        const autor = autorActivo();
        try { localStorage.setItem('revelatio_version', version); } catch { /* ignore */ }
        try { localStorage.setItem('revelatio_autor', autor); } catch { /* ignore */ }
        const esperado = versosEsperados(libro);
        const header = document.getElementById('chapter-header');
        const versesBox = document.getElementById('verses-container');
        const texto = document.getElementById('texto-biblico') || versesBox;
        const appState = window.RV?.AppState;
        const readerOwns = Boolean(window.RV?.readerView?.active && appState?.setPassage);
        try { actualizarBreadcrumbs(libro); } catch { /* ignore */ }
        try { syncLecturaHash(libro); } catch { /* ignore */ }
        if (appState?.setPassage) {
            try {
                await appState.setPassage(libro.n, libro.cap, mapUiVersion(version));
            } catch (err) {
                console.warn('[estudio] AppState.setPassage', err);
            }
        }
        const prevRef = String(window.__revelatioPassageData?.referencia || '');
        if (prevRef && !prevRef.startsWith(`${libro.n} ${libro.cap}`)) {
            window.__revelatioPassageData = null;
        }
        if (header && !document.getElementById('chapter-title')) {
            header.innerHTML = `
                <p id="chapter-title" class="rv-lectura-title mb-1 font-display text-3xl text-[#0F172A]">${escapeHtml(libro.n)} ${libro.cap}</p>
                <p id="chapter-version-label" class="rv-lectura-meta text-[11px] tracking-[0.14em] text-[#0F172A]/75">${readerOwns ? 'Cargando…' : `${escapeHtml(etiquetaVersion(version))}${esperado ? ` · ${esperado} versículos` : ''}`}</p>`;
        } else if (header) {
            const titleNode = document.getElementById('chapter-title');
            if (titleNode) titleNode.textContent = `${libro.n} ${libro.cap}`;
        }
        if (!readerOwns && texto) {
            texto.innerHTML = `<p class="rv-lectura-muted text-[#0F172A]">Abriendo el capítulo completo…</p>`;
        }
        try { pintarIndiceVersiculos(libro, esperado ? Array.from({ length: esperado }, (_, i) => i + 1) : []); } catch { /* ignore */ }
        try { pintarContextoHistorico(libro); } catch { /* ignore */ }
        try { pintarFichaAcademica(libro); } catch { /* ignore */ }
        try {
            pintarComentario(libro, autor, window.revelatioLectura?.comentarioInmediato?.(referenciaComentario(libro), autor) || { titulo: AUTOR_LABEL[autor] || autor });
        } catch { /* ignore */ }
        try { refrescarConcordancia(libro); } catch { /* ignore */ }

        let passage = window.__revelatioPassageData;
        try {
            const fetched = await cargarPasaje(`${libro.n} ${libro.cap}`);
            if (stamp !== panelStamp) return;
            const fetchedRef = String(fetched?.referencia || '');
            if (fetched && (!fetchedRef || fetchedRef.startsWith(`${libro.n} ${libro.cap}`))) {
                window.__revelatioPassageData = fetched;
                passage = fetched;
            }
        } catch (_e) { /* modo local */ }
        if (stamp !== panelStamp) return;
        const pick = elegirVersosPasaje(libro, version, passage);
        const badge = badgeFallbackHtml(passage, version, pick);
        if (header) {
            const titleNode = document.getElementById('chapter-title');
            const versionNode = document.getElementById('chapter-version-label');
            if (titleNode) {
                titleNode.textContent = `${libro.n} ${libro.cap}`;
            } else if (!readerOwns) {
                header.innerHTML = `
                <p id="chapter-title" class="rv-lectura-title mb-1 font-display text-3xl text-[#0F172A]">${escapeHtml(libro.n)} ${libro.cap}</p>
                <p id="chapter-version-label" class="rv-lectura-meta text-[11px] tracking-[0.14em] text-[#0F172A]/80">${escapeHtml(etiquetaVersion(version, passage))}${badge}</p>`;
            }
            if (!readerOwns) {
                const meta = versionNode || header.querySelector('.rv-lectura-meta');
                if (meta) {
                    meta.id = meta.id || 'chapter-version-label';
                    meta.innerHTML = `${escapeHtml(etiquetaVersion(version, passage))}${badge}`;
                } else if (titleNode) {
                    const p = document.createElement('p');
                    p.id = 'chapter-version-label';
                    p.className = 'rv-lectura-meta text-[11px] tracking-[0.14em] text-[#0F172A]/80';
                    p.innerHTML = `${escapeHtml(etiquetaVersion(version, passage))}${badge}`;
                    header.appendChild(p);
                }
            }
        }

        if (!readerOwns) {
            if (texto) texto.innerHTML = cuerpoLectura(libro, version, passage);
            else if (versesBox) versesBox.innerHTML = cuerpoLectura(libro, version, passage);
        }
        if ((version === 'lxx' || version === 'septuaginta') && stamp === panelStamp) {
            const withEs = await completarTraduccionLxx(libro, passage);
            if (stamp !== panelStamp) return;
            if (withEs) {
                window.__revelatioPassageData = withEs;
                passage = withEs;
                if (texto) texto.innerHTML = cuerpoLectura(libro, version, passage);
                else if (versesBox) versesBox.innerHTML = cuerpoLectura(libro, version, passage);
            }
        }
        try {
            const comentario = await cargarComentario(referenciaComentario(libro), autor);
            if (stamp !== panelStamp) return;
            pintarComentario(libro, autor, comentario || window.revelatioLectura?.comentarioInmediato?.(referenciaComentario(libro), autor) || { titulo: AUTOR_LABEL[autor] || autor });
        } catch (_e) { /* se conserva el comentario local */ }
        const plano = passage?.versiones?.[claveMotor(version)] || '';
        document.querySelectorAll('[data-paralelo-cuerpo]')?.forEach?.((el) => {
            el.textContent = plano ? `${libro.n} ${libro.cap} — ${plano}` : `${libro.n} ${libro.cap}`;
        });
        const refInput = document.querySelector('#form-marginnote [name="referencia"]');
        const pasajeInput = document.querySelector('#form-sermon [name="pasaje"]');
        if (refInput) refInput.value = `${libro.n} ${libro.cap}`;
        if (pasajeInput) pasajeInput.value = `${libro.n} ${libro.cap}`;
        try { actualizarBreadcrumbs(libro); } catch { /* ignore */ }
        document.querySelectorAll('.cap-btn')?.forEach?.((btn) => {
            const sameBook = btn.closest('[data-libro-item]')?.dataset.libroItem === libro.n;
            btn.classList.toggle('is-active', sameBook && Number(btn.dataset.cap) === Number(libro.cap));
        });
        document.querySelectorAll('.libro-item')?.forEach?.((item) => {
            const on = item.dataset.libroItem === libro.n;
            item.classList.toggle('is-active', on);
            item.querySelector('.libro-btn')?.classList.toggle('is-active', on);
        });
        try { pintarIndiceVersiculos(libro, numerosDelPasaje(passage, version)); } catch { /* ignore */ }
        try { restaurarMarcasCapitulo(libro); } catch { /* ignore */ }
        try { refrescarConcordancia(libro); } catch { /* ignore */ }
        try { refrescarPerspectivas(libro); } catch { /* ignore */ }
        if (libro.verso) requestAnimationFrame(() => { try { irAVersiculo(Number(libro.verso)); } catch { /* ignore */ } });
        try {
            document.dispatchEvent(new CustomEvent('revelatio:passage-ready', {
                detail: { libro: libro.n, cap: libro.cap, version, passage, book: libro.n, chapter: libro.cap, ref: referenciaComentario(libro) },
            }));
        } catch { /* ignore */ }
    }

    function capitulosHtml(libro) {
        return Array.from({ length: libro.c }, (_, i) => i + 1).map(n =>
            `<button type="button" data-cap="${n}" class="cap-btn bg-[#0F172A] text-[#CBD5E1] border border-[#334155] hover:border-[#DFB743] hover:text-[#DFB743] text-xs font-bold rounded-lg w-7 h-7 flex items-center justify-center" aria-label="Capítulo ${n}">${n}</button>`
        ).join('');
    }

    function renderGrupo(titulo, libros, testamento) {
        return `
            <section data-grupo="${testamento}" class="mb-5">
                <h3 class="rv-canon-section mb-2 px-2 text-[11px] font-mono font-bold uppercase tracking-widest text-[#DFB743] pb-2 border-b border-[#DFB743]/20">${titulo}</h3>
                ${libros.map(libro => `
                    <div class="libro-item" data-libro-item="${libro.n}" data-testamento="${testamento}" data-capitulos="${libro.c}">
                        <button type="button" class="libro-btn text-[#E2E8F0] hover:text-[#DFB743] font-serif text-sm font-medium transition-colors cursor-pointer" data-libro="${libro.n}">
                            <span class="libro-nombre">${libro.n}</span>
                            <span class="libro-caps text-[#94A3B8] font-mono text-xs">${libro.c}</span>
                        </button>
                        <div class="caps-grid">${capitulosHtml(libro)}</div>
                    </div>`).join('')}
            </section>`;
    }

    function abrirLibro(nombre, seleccionarCap, verso) {
        const root = document.getElementById('selector-libros');
        root?.querySelectorAll('.libro-item').forEach(item => {
            const on = item.dataset.libroItem === nombre;
            item.classList.toggle('is-open', on);
            item.querySelector('.libro-btn')?.classList.toggle('is-open', on);
        });
        const item = root?.querySelector(`[data-libro-item="${CSS.escape(nombre)}"]`)
            || [...(root?.querySelectorAll('[data-libro-item]') || [])].find(el => packName(el.dataset.libroItem) === packName(nombre));
        if (!item) return false;
        const cap = seleccionarCap || 1;
        pintarPaneles({
            n: item.dataset.libroItem || nombre,
            c: Number(item.dataset.capitulos),
            cap,
            verso: verso || null,
            testamento: resolveTestamentoLibro(item.dataset.libroItem || nombre, item.dataset.testamento)
        });
        try { item.scrollIntoView({ block: 'nearest' }); } catch { /* ignore */ }
        return true;
    }

    function packName(s) {
        return norm(s).replace(/[^a-z0-9]/g, '');
    }

    function parseGoto(query) {
        const raw = String(query || '').trim();
        if (!raw) return null;
        const verse = raw.match(/^(.+?)\s+(\d+)\s*[:.]\s*(\d+)\s*$/);
        if (verse) return { libroQ: verse[1].trim(), cap: Number(verse[2]), verso: Number(verse[3]) };
        const cap = raw.match(/^(.+?)\s+(\d+)\s*$/);
        if (cap) return { libroQ: cap[1].trim(), cap: Number(cap[2]), verso: null };
        return { libroQ: raw, cap: null, verso: null };
    }

    function resolverLibro(q) {
        const packed = packName(q);
        if (!packed) return null;
        if (ABREV[packed]) return ABREV[packed];
        const items = [...document.querySelectorAll('#selector-libros [data-libro-item]')];
        const exact = items.find(i => packName(i.dataset.libroItem) === packed);
        if (exact) return exact.dataset.libroItem;
        const hits = items.filter(i => {
            const p = packName(i.dataset.libroItem);
            return p.startsWith(packed) || p.includes(packed);
        });
        const start = hits.filter(i => packName(i.dataset.libroItem).startsWith(packed));
        if (start.length === 1) return start[0].dataset.libroItem;
        if (hits.length === 1) return hits[0].dataset.libroItem;
        return null;
    }

    function irGoto(nombre, cap, verso) {
        const loc = estado();
        const key = `${nombre}:${cap}:${verso || ''}`;
        if (key === lastGotoKey && loc.n === nombre && Number(loc.cap) === Number(cap)) {
            if (verso) irAVersiculo(verso);
            return;
        }
        lastGotoKey = key;
        if (loc.n === nombre && Number(loc.cap) === Number(cap)) {
            if (verso) irAVersiculo(verso);
            return;
        }
        abrirLibro(nombre, cap, verso);
    }

    function filtrarCanon(query, opts = {}) {
        const parsed = parseGoto(query);
        const bookQ = norm(parsed?.libroQ || query).trim();
        const packedQ = packName(parsed?.libroQ || query);
        const root = document.getElementById('selector-libros');
        if (!root) return;
        root.querySelectorAll('.libro-item').forEach(item => {
            const nombre = norm(item.dataset.libroItem);
            const packedItem = packName(item.dataset.libroItem);
            const match = !bookQ || nombre.includes(bookQ) || packedItem.includes(packedQ) || packedItem.startsWith(packedQ);
            item.hidden = !match;
        });
        root.querySelectorAll('[data-grupo]').forEach(sec => {
            sec.hidden = ![...sec.querySelectorAll('.libro-item')].some(i => !i.hidden);
        });
        const nombre = resolverLibro(parsed?.libroQ || '');
        if (!nombre || !parsed) {
            if (opts.inmediato && String(query || '').trim().length >= 3 && !parsed?.cap) {
                buscarPalabraOTema(query);
            }
            return;
        }
        const go = () => irGoto(nombre, parsed.cap, parsed.verso);
        clearTimeout(gotoTimer);
        if (parsed.verso && parsed.cap) go();
        else if (opts.inmediato && parsed.cap) go();
        else if (parsed.cap) gotoTimer = setTimeout(go, 360);
        else if (opts.inmediato) buscarPalabraOTema(query);
    }

    async function buscarPalabraOTema(query) {
        const term = String(query || '').trim();
        if (term.length < 3) return;
        try { abrirEstudioTab('concordancia'); } catch { /* ignore */ }
        const cruzadasEl = document.getElementById('lista-cruzadas');
        const refEl = document.getElementById('ref-concordancia');
        if (refEl) refEl.textContent = `Búsqueda: ${term}`;
        if (cruzadasEl) {
            cruzadasEl.innerHTML = `<p class="rv-estudio-vacio py-6 text-center text-amber-800 text-sm"><span class="animate-spin inline-block mr-1">⏳</span> Buscando «${escapeHtml(term)}» en toda la Escritura…</p>`;
        }
        try {
            const ver = claveMotor(versionActiva());
            const res = await fetch(`/api/concordancia?q=${encodeURIComponent(term)}&version=${encodeURIComponent(ver)}`);
            const json = await res.json().catch(() => null);
            const resultados = json?.data?.resultados || [];
            if (!cruzadasEl) return;
            if (!resultados.length) {
                cruzadasEl.innerHTML = `<p class="rv-estudio-vacio">No hay coincidencias de «${escapeHtml(term)}» en esta versión.</p>`;
                return;
            }
            cruzadasEl.innerHTML = resultados.map((item) => {
                const cita = item.ref || '';
                const nota = String(item.html || '').replace(/<[^>]+>/g, '');
                return `<button type="button" class="rv-xref-item" data-ir-ref="${escapeHtml(cita)}"><span class="rv-xref-ref">${escapeHtml(cita)}</span>${nota ? `<span class="rv-xref-nota">${escapeHtml(nota)}</span>` : ''}</button>`;
            }).join('');
        } catch {
            if (cruzadasEl) cruzadasEl.innerHTML = `<p class="rv-estudio-vacio">No se pudo buscar «${escapeHtml(term)}» ahora.</p>`;
        }
    }

    function montarCanon() {
        const root = document.getElementById('selector-libros');
        if (!root || root.dataset.mounted === '1') return;
        root.dataset.mounted = '1';
        root.innerHTML = renderGrupo('Antiguo Testamento', AT, 'at') + renderGrupo('Nuevo Testamento', NT, 'nt');

        root.addEventListener('click', event => {
            const cap = event.target.closest('[data-cap]');
            const libroBtn = event.target.closest('[data-libro]');
            if (cap) {
                const item = cap.closest('.libro-item');
                pintarPaneles({
                    n: item.dataset.libroItem,
                    c: Number(item.dataset.capitulos),
                    cap: Number(cap.dataset.cap),
                    testamento: item.dataset.testamento
                });
                return;
            }
            if (libroBtn) {
                const item = libroBtn.closest('.libro-item');
                const already = item.classList.contains('is-open');
                root.querySelectorAll('.libro-item').forEach(el => {
                    el.classList.remove('is-open');
                    el.querySelector('.libro-btn')?.classList.remove('is-open');
                });
                if (!already) {
                    item.classList.add('is-open');
                    libroBtn.classList.add('is-open');
                    pintarPaneles({
                        n: item.dataset.libroItem,
                        c: Number(item.dataset.capitulos),
                        cap: 1,
                        testamento: item.dataset.testamento
                    });
                }
            }
        });

        document.getElementById('buscador-canon')?.addEventListener('input', event => filtrarCanon(event.target.value));
        document.getElementById('buscador-canon')?.addEventListener('keydown', event => {
            if (event.key === 'Enter') {
                event.preventDefault();
                filtrarCanon(event.target.value, { inmediato: true });
            }
        });
        document.getElementById('breadcrumbs')?.addEventListener('click', event => {
            const crumb = event.target.closest('[data-crumb]');
            if (!crumb) return;
            const key = crumb.dataset.crumb;
            if (key === 'biblia') {
                document.getElementById('buscador-canon').value = '';
                filtrarCanon('');
                root.querySelectorAll('.libro-item').forEach(el => el.classList.remove('is-open'));
                return;
            }
            filtrarCanon('');
            root.querySelectorAll('[data-grupo]').forEach(sec => { sec.hidden = sec.dataset.grupo !== key; });
        });

        const dest = destinoDesdeQuery();
        abrirLibro(dest.libro || 'Romanos', dest.cap || 1, dest.verso);

        const btnCanon = document.getElementById('btn-canon');
        const panelCanon = document.getElementById('panel-canon');
        const setCanonOpen = (on) => {
            if (!panelCanon || !btnCanon) return;
            panelCanon.classList.toggle('is-open', on);
            btnCanon.classList.toggle('is-on', on);
            btnCanon.setAttribute('aria-expanded', String(on));
        };
        btnCanon?.addEventListener('click', event => {
            event.stopPropagation();
            setCanonOpen(!panelCanon?.classList.contains('is-open'));
        });
        root.addEventListener('click', event => {
            if (event.target.closest('[data-cap]') && window.innerWidth < 1024) setCanonOpen(false);
        });
        document.addEventListener('keydown', event => {
            if (event.key === 'Escape' && panelCanon?.classList.contains('is-open') && window.innerWidth < 1024) {
                setCanonOpen(false);
            }
        });
    }

    function wrapCanvas(ctx, text, maxWidth) {
        const words = String(text || '').replace(/\s+/g, ' ').trim().split(' ');
        const lines = [];
        let line = '';
        for (const word of words) {
            const test = line ? `${line} ${word}` : word;
            if (ctx.measureText(test).width > maxWidth && line) {
                lines.push(line);
                line = word;
            } else line = test;
        }
        if (line) lines.push(line);
        return lines.slice(0, 14);
    }

    function loadImg(src) {
        return new Promise(resolve => {
            const img = new Image();
            img.onload = () => resolve(img);
            img.onerror = () => resolve(null);
            img.src = src;
        });
    }

    async function asegurarAssetsCard() {
        if (!texturas.marmol) {
            const [marmol, papiro, jerusalem, mark, wordmark, cieloBw, brandFull] = await Promise.all([
                loadImg('brand/textures/marmol.png'),
                loadImg('brand/textures/papiro.png'),
                loadImg('brand/textures/jerusalem.png'),
                loadImg('brand/revelatio-mark.png'),
                loadImg('assets/branding/revelatio-wordmark-master.jpeg'),
                loadImg('assets/branding/cielo-efata-bw.jpg'),
                loadImg('assets/branding/revelatio-logo-master.jpeg')
            ]);
            texturas.marmol = marmol;
            texturas.papiro = papiro;
            texturas.jerusalem = jerusalem;
            isotipoImg = mark;
            palabraImg = wordmark || (await loadImg('assets/branding/revelatio-wordmark.jpg'))
                || (await loadImg('brand/revelatio-wordmark.jpg'));
            // Cabecera de tarjeta: wordmark oficial centrado
            lockupImg = palabraImg || brandFull || (await loadImg('assets/branding/revelatio-logo.jpg'));
            cieloBwImg = cieloBw || (await loadImg('assets/branding/cielo-efata.jpg'));
        }
        try { await document.fonts.ready; } catch { /* fuentes del sistema */ }
        // Espera explícita a caras tipográficas usadas en canvas (timeout 1.5s)
        try {
            if (document.fonts?.load) {
                await Promise.race([
                    Promise.all([
                        document.fonts.load('600 46px Cinzel'),
                        document.fonts.load('italic 54px "Cormorant Garamond"'),
                        document.fonts.load('400 44px "Source Serif 4"'),
                        document.fonts.load('500 22px "Cormorant Garamond"'),
                    ]),
                    new Promise((resolve) => setTimeout(resolve, 1500)),
                ]);
            }
        } catch { /* fallback a stack del sistema en fillText */ }
    }

    function paletaFondo(fondo) {
        /* Marca editorial: Luz Celestial / Azul Imperial / Oro Sacro */
        if (fondo === 'celestial' || fondo === 'brand' || !fondo) {
            return {
                verse: '#0A192F',
                ref: '#C59B27',
                url: '#64748B',
                veil: 'transparent',
                frame: 'rgba(197, 155, 39, 0.55)',
                celestial: true,
            };
        }
        if (fondo === 'papiro') return { verse: '#2A1C0E', ref: '#C59B27', url: '#5C4A32', veil: 'rgba(250, 241, 220, 0.18)', frame: 'rgba(122, 90, 30, 0.7)' };
        if (fondo === 'jerusalem') return { verse: '#F7F1E1', ref: '#C59B27', url: 'rgba(241, 226, 160, 0.8)', veil: 'rgba(9, 10, 15, 0.42)', frame: 'rgba(197, 160, 89, 0.7)' };
        return { verse: '#0A192F', ref: '#C59B27', url: '#64748B', veil: 'transparent', frame: 'rgba(197, 155, 39, 0.55)', celestial: true };
    }

    function tipoCard(tipo, paleta) {
        if (tipo === 'monumental') return { verse: '600 46px Cinzel, "Playfair Display", serif', ref: '600 22px Cinzel, serif', verseColor: paleta.verse, align: 'center', leading: 62 };
        if (tipo === 'lectura') return { verse: '400 44px "Source Serif 4", Georgia, serif', ref: '600 20px Cinzel, serif', verseColor: paleta.verse, align: 'left', leading: 60 };
        return { verse: '500 48px "Source Serif 4", "Playfair Display", Georgia, serif', ref: '600 22px Cinzel, serif', verseColor: paleta.verse, align: 'center', leading: 64 };
    }

    function pintarEfataCard() {
        const canvas = document.getElementById('canvas-efata-card');
        if (!canvas) return;

        const fondoKey = (cardState.fondo === 'papiro' || cardState.fondo === 'jerusalem' || cardState.fondo === 'marmol')
            ? cardState.fondo
            : 'celestial';
        const bgImg = (fondoKey !== 'celestial' && texturas[fondoKey])
            ? texturas[fondoKey]
            : (texturas.jerusalem || texturas.marmol || null);
        const logoImg = palabraImg || lockupImg || null;
        const draw = window.RV?.drawVerseCard || window.drawVerseCard;

        if (typeof draw === 'function') {
            draw(canvas, {
                text: cardState.text,
                ref: cardState.ref,
                version: cardState.version,
                tipo: cardState.tipo || 'lectura',
                logoImg,
                bgImg,
            });
            return;
        }

        // Fallback mínimo si verse-actions no cargó
        const ctx = canvas.getContext('2d');
        const w = canvas.width;
        const h = canvas.height;
        ctx.fillStyle = '#07101E';
        ctx.fillRect(0, 0, w, h);
        ctx.fillStyle = '#FFFFFF';
        ctx.font = '500 36px Georgia, serif';
        ctx.textAlign = 'center';
        ctx.fillText(cardState.ref || 'Éfata RevelatiO', w / 2, h / 2);
    }

    function roundRectPath(ctx, x, y, width, height, radius) {
        const r = Math.min(radius, width / 2, height / 2);
        ctx.beginPath();
        ctx.moveTo(x + r, y);
        ctx.arcTo(x + width, y, x + width, y + height, r);
        ctx.arcTo(x + width, y + height, x, y + height, r);
        ctx.arcTo(x, y + height, x, y, r);
        ctx.arcTo(x, y, x + width, y, r);
        ctx.closePath();
    }

    async function abrirEfataCard(detail = {}) {
        if (typeof window !== 'undefined' && typeof window.openCardGenerator === 'function') {
            return window.openCardGenerator(detail.passage || detail.ref, detail.text || detail.verseText, detail.version);
        }
        const { text, ref, version, brandLogo, brandWatermark } = detail;
        cardState.text = String(text || '').replace(/\s+/g, ' ').trim();
        cardState.ref = ref || '';
        cardState.version = version || '';
        // Wordmark centrado + marca de agua Cielo Éfata B/N
        if (brandLogo) {
            const branded = await loadImg(brandLogo);
            if (branded) {
                palabraImg = branded;
                lockupImg = branded;
            }
        } else if (!palabraImg) {
            palabraImg = await loadImg('assets/branding/revelatio-wordmark.jpg')
                || await loadImg('brand/revelatio-wordmark.jpg');
            if (palabraImg) lockupImg = palabraImg;
        }
        if (brandWatermark) {
            const wm = await loadImg(brandWatermark);
            if (wm) cieloBwImg = wm;
        } else if (!cieloBwImg) {
            cieloBwImg = await loadImg('assets/branding/cielo-efata-bw.jpg');
        }        const modal = document.getElementById('modal-efata-card');
        modal?.classList.add('is-open');
        try {
            await asegurarAssetsCard();
            pintarEfataCard();
        } catch (err) {
            console.warn('[efata-card] render diferido / fuente:', err?.message || err);
            try {
                pintarEfataCard();
            } catch {
                /* canvas no disponible */
            }
        }
    }

    function blobTarjeta() {
        return new Promise((resolve, reject) => {
            const canvas = document.getElementById('canvas-efata-card');
            if (!canvas) return reject(new Error('canvas'));
            canvas.toBlob(blob => blob ? resolve(blob) : reject(new Error('blob')), 'image/png');
        });
    }

    function montarEfataCards() {
        const modal = document.getElementById('modal-efata-card');
        if (!modal) return;
        modal.addEventListener('click', event => {
            if (event.target === modal) modal.classList.remove('is-open');
            const fondo = event.target.closest('[data-fondo]');
            const tipo = event.target.closest('[data-tipo]');
            if (fondo) {
                cardState.fondo = fondo.dataset.fondo;
                modal.querySelectorAll('[data-fondo]').forEach(el => el.classList.toggle('is-on', el === fondo));
                pintarEfataCard();
            }
            if (tipo) {
                cardState.tipo = tipo.dataset.tipo;
                modal.querySelectorAll('[data-tipo]').forEach(el => el.classList.toggle('is-on', el === tipo));
                pintarEfataCard();
            }
        });
        document.getElementById('cerrar-efata-card')?.addEventListener('click', () => modal.classList.remove('is-open'));
        document.addEventListener('keydown', event => {
            if (event.key === 'Escape') modal.classList.remove('is-open');
        });
        document.getElementById('descargar-efata-card')?.addEventListener('click', async () => {
            try {
                const blob = await blobTarjeta();
                const a = document.createElement('a');
                a.href = URL.createObjectURL(blob);
                a.download = `efata-revelatio-${(cardState.ref || 'versiculo').replace(/\s+/g, '-').toLowerCase()}.png`;
                a.click();
                URL.revokeObjectURL(a.href);
            } catch { /* canvas no exportable */ }
        });
        document.getElementById('copiar-efata-card')?.addEventListener('click', async () => {
            try {
                const blob = await blobTarjeta();
                if (navigator.clipboard?.write && global.ClipboardItem) {
                    await navigator.clipboard.write([new ClipboardItem({ 'image/png': blob })]);
                    return;
                }
            } catch { /* fallback download */ }
            try {
                const blob = await blobTarjeta();
                const a = document.createElement('a');
                a.href = URL.createObjectURL(blob);
                a.download = `efata-revelatio-${(cardState.ref || 'versiculo').replace(/\s+/g, '-').toLowerCase()}.png`;
                a.click();
                URL.revokeObjectURL(a.href);
            } catch { /* ignore */ }
        });
        document.getElementById('publicar-efata-card')?.addEventListener('click', async () => {
            const caption = `${cardState.ref}\n«${cardState.text}»\nÉfata RevelatiO · ${PLATAFORMA_URL}`;
            try {
                const blob = await blobTarjeta();
                const file = new File([blob], 'efata-revelatio.png', { type: 'image/png' });
                if (navigator.canShare?.({ files: [file] })) {
                    await navigator.share({ files: [file], title: cardState.ref, text: caption });
                    return;
                }
            } catch { /* cae al texto */ }
            if (navigator.share) navigator.share({ title: cardState.ref, text: caption }).catch(() => navigator.clipboard?.writeText(caption));
            else navigator.clipboard?.writeText(caption);
        });
    }

    function uid() {
        return (crypto.randomUUID && crypto.randomUUID()) || `rv-${Date.now()}-${Math.random().toString(16).slice(2)}`;
    }

    function parseJson(raw, fallback) {
        try { return JSON.parse(raw); } catch { return fallback; }
    }

    function leerCuaderno() {
        if (window.RV?.storage?.readNotebook) {
            const nb = window.RV.storage.readNotebook();
            if (nb.purged > 0) {
                setSyncStatus(`Limpieza: ${nb.purged} apunte${nb.purged === 1 ? '' : 's'} expirado${nb.purged === 1 ? '' : 's'}`);
            }
            return { items: nb.items || [] };
        }
        const key = CUADERNO_KEY();
        let data = parseJson(localStorage.getItem(key), null);
        if (data && Array.isArray(data.items)) return data;
        if (key !== CUADERNO_KEY_BASE) {
            const legacy = parseJson(localStorage.getItem(CUADERNO_KEY_BASE), null);
            if (legacy && Array.isArray(legacy.items) && legacy.items.length) {
                try { localStorage.setItem(key, JSON.stringify(legacy)); } catch { /* cuota */ }
                return legacy;
            }
        }
        return migrarCuaderno();
    }

    function escribirCuaderno(store) {
        if (window.RV?.storage?.writeNotebook) {
            window.RV.storage.writeNotebook(store.items || []);
            return store;
        }
        localStorage.setItem(CUADERNO_KEY(), JSON.stringify({ items: store.items || [] }));
        return store;
    }

    function migrarCuaderno() {
        const items = [];
        const notas = parseJson(localStorage.getItem('revelatio_margin_notes'), []);
        (Array.isArray(notas) ? notas : []).forEach(n => items.push({
            id: uid(), tipo: 'nota', referencia: n.referencia || '', texto: n.texto || n.nota || '',
            archivo: 'temporal', createdAt: n.createdAt || new Date().toISOString(),
            updatedAt: n.createdAt || new Date().toISOString(), supabaseId: null, sync: 'local'
        }));
        const marks = parseJson(localStorage.getItem('revelatio_highlights'), []);
        (Array.isArray(marks) ? marks : []).forEach(n => items.push({
            id: uid(), tipo: 'resaltado', referencia: n.reference || n.referencia || '', texto: n.text || n.texto || '',
            color: n.color || 'oro', archivo: 'temporal', createdAt: n.createdAt || new Date().toISOString(),
            updatedAt: n.createdAt || new Date().toISOString(), supabaseId: null, sync: 'local'
        }));
        const fichas = parseJson(localStorage.getItem('revelatio-cuaderno-fichas-v2') || localStorage.getItem('revelatio-ia-fichas'), []);
        (Array.isArray(fichas) ? fichas : []).forEach(f => items.push({
            id: f.id || uid(), tipo: 'estudio', titulo: f.titulo || 'Estudio', referencia: f.ref || f.referencia || '',
            texto: [f.nota, f.texto, f.pasaje].filter(Boolean).join('\n\n'), archivo: 'temporal',
            createdAt: f.fecha || new Date().toISOString(), updatedAt: f.actualizado || f.fecha || new Date().toISOString(),
            supabaseId: null, sync: 'local'
        }));
        const store = { items };
        escribirCuaderno(store);
        return store;
    }

    function venceEn(item) {
        if (window.RV?.storage?.expiresAt) return window.RV.storage.expiresAt(item);
        if (item.archivo === 'permanente') return null;
        const start = Date.parse(item.createdAt || item.updatedAt || 0);
        if (!start) return null;
        return start + TTL_MS;
    }

    function diasRestantes(item) {
        if (window.RV?.storage?.daysLeft) return window.RV.storage.daysLeft(item);
        const end = venceEn(item);
        if (!end) return null;
        return Math.ceil((end - Date.now()) / 86400000);
    }

    function formatoFechaCuaderno(iso) {
        if (window.RV?.storage?.formatDateTime) return window.RV.storage.formatDateTime(iso);
        try {
            return new Date(iso || Date.now()).toLocaleString('es-ES');
        } catch {
            return String(iso || '');
        }
    }

    function enviarAlCuaderno({ texto, referencia, tipo, titulo, source, tags, oia } = {}) {
        const clean = String(texto || '').trim();
        if (!clean) return null;
        const loc = estado();
        const ref = String(referencia || selectedRef || `${loc.n} ${loc.cap}${loc.verso ? `:${loc.verso}` : ''}`).trim();
        const payload = {
            tipo: tipo || 'nota',
            titulo: titulo || '',
            referencia: ref,
            texto: clean,
            archivo: 'temporal',
            source: source || 'manual',
            tags: Array.isArray(tags) ? tags : (window.RV?.ui?.getActiveDoctrinalTags?.() || []),
            oia: oia || null,
        };
        if (window.RV?.storage?.addEntry) {
            const item = window.RV.storage.addEntry(payload);
            // Mantener lista/cuota del núcleo sincronizada
            const store = leerCuaderno();
            pintarCuota(store);
            pintarListaCuaderno();
            setSyncStatus('Apunte guardado en el Cuaderno');
            return item;
        }
        return upsertItem(payload);
    }

    function cuotaBytes(store) {
        return new Blob([JSON.stringify(store.items || [])]).size;
    }

    function setSyncStatus(texto, busy) {
        ['estado-cuaderno', 'estado-nota'].forEach(id => {
            const el = document.getElementById(id);
            if (!el) return;
            el.textContent = texto;
            el.classList.toggle('is-busy', Boolean(busy));
        });
    }

    async function usuarioActual() {
        try { return (await window.supabaseClient?.auth?.getUser?.())?.data?.user || null; } catch { return null; }
    }

    function tipoAccion(tipo) {
        if (tipo === 'resaltado') return 'highlight';
        if (tipo === 'nota') return 'margin_note';
        if (tipo === 'estudio') return 'estudio';
        return tipo;
    }

    function tipoDesdeAccion(action) {
        if (action === 'highlight') return 'resaltado';
        if (action === 'margin_note') return 'nota';
        if (action === 'study') return 'estudio';
        return action || 'nota';
    }

    function encolarSync(fn) {
        syncCola = syncCola.then(fn, fn);
        return syncCola;
    }

    async function persistirRemoto(item) {
        const user = await usuarioActual();
        if (!user || !window.supabaseClient) {
            setSyncStatus('Guardado en este dispositivo');
            return item;
        }
        setSyncStatus('Sincronizando', true);
        const row = {
            user_id: user.id,
            action_type: tipoAccion(item.tipo),
            reference: item.referencia || '',
            version: versionActiva(),
            text_content: item.texto || '',
            metadata: {
                color: item.color || null,
                archivo: item.archivo || 'temporal',
                local_id: item.id,
                titulo: item.titulo || '',
                tipo: item.tipo,
                expires_at: venceEn(item)
            },
            updated_at: item.updatedAt || new Date().toISOString()
        };
        try {
            if (item.supabaseId) {
                const { error } = await window.supabaseClient.from('user_bible_actions').update(row).eq('id', item.supabaseId).eq('user_id', user.id);
                if (error) throw error;
            } else {
                const { data, error } = await window.supabaseClient.from('user_bible_actions').insert(row).select('id').maybeSingle();
                if (error) throw error;
                item.supabaseId = data?.id || item.supabaseId;
            }
            item.sync = 'ok';
            setSyncStatus('Guardado');
        } catch (_e) {
            item.sync = 'local';
            setSyncStatus('Guardado en este dispositivo');
        }
        return item;
    }

    function upsertItem(parcial) {
        setSyncStatus('Sincronizando', true);
        const store = leerCuaderno();
        const now = new Date().toISOString();
        let item = store.items.find(x => x.id === parcial.id);
        if (!item) {
            item = {
                id: parcial.id || uid(),
                tipo: parcial.tipo || 'nota',
                referencia: '',
                texto: '',
                archivo: 'temporal',
                createdAt: now,
                createdAtLabel: formatoFechaCuaderno(now),
                supabaseId: null,
                sync: 'pending'
            };
            store.items.unshift(item);
        }
        Object.assign(item, parcial, { updatedAt: now, sync: 'pending' });
        if (!item.createdAt) item.createdAt = now;
        escribirCuaderno(store);
        pintarCuota(store);
        pintarListaCuaderno();
        encolarSync(async () => {
            const fresh = leerCuaderno();
            const current = fresh.items.find(x => x.id === item.id);
            if (!current) return;
            await persistirRemoto(current);
            escribirCuaderno(fresh);
            pintarListaCuaderno();
        });
        return item;
    }

    function avisarCuota(store) {
        const used = cuotaBytes(store);
        const ratio = used / CUOTA_MAX;
        const box = document.getElementById('aviso-cuota');
        const copy = document.getElementById('aviso-cuota-texto');
        if (!box) return;
        if (ratio < 0.8) { box.classList.add('hidden'); return; }
        box.classList.remove('hidden');
        if (copy) {
            copy.textContent = ratio >= 1
                ? 'El cuaderno superó el espacio temporal. Descarga un Backup de Estudio (PDF o Markdown) y mueve lo esencial a Archivo permanente.'
                : 'El cuaderno está por llenarse. Descarga un Backup de Estudio para no perder anotaciones, sermones y estudios.';
        }
    }

    function pintarCuota(store) {
        const used = cuotaBytes(store || leerCuaderno());
        const ratio = Math.min(1, used / CUOTA_MAX);
        const fill = document.getElementById('cuota-fill');
        const label = document.getElementById('cuota-label');
        if (fill) {
            fill.style.width = `${Math.round(ratio * 100)}%`;
            fill.classList.toggle('is-warn', ratio >= 0.8 && ratio < 1);
            fill.classList.toggle('is-full', ratio >= 1);
        }
        if (label) label.textContent = `${(used / 1024).toFixed(1)} KB de ${(CUOTA_MAX / 1024).toFixed(0)} KB`;
        avisarCuota(store || leerCuaderno());
        const caducan = (store || leerCuaderno()).items.filter(i => {
            const d = diasRestantes(i);
            return d !== null && d <= 14;
        });
        const aviso = document.getElementById('aviso-caducidad');
        if (aviso) {
            if (!caducan.length) aviso.classList.add('hidden');
            else {
                aviso.classList.remove('hidden');
                const vencidos = caducan.filter(i => diasRestantes(i) <= 0).length;
                aviso.textContent = vencidos
                    ? `${vencidos} archivo${vencidos === 1 ? '' : 's'} temporal${vencidos === 1 ? '' : 'es'} cumplió ${RETENTION_DAYS} días. Muévelo a Archivo permanente o descárgalo.`
                    : `${caducan.length} nota${caducan.length === 1 ? '' : 's'} temporal${caducan.length === 1 ? '' : 'es'} vence${caducan.length === 1 ? '' : 'n'} en menos de 14 días.`;
            }
        }
        const banner = document.getElementById('rv-cuaderno-ttl-banner');
        if (banner) {
            banner.textContent = `Atención: Para optimizar el rendimiento de nuestra plataforma, las notas y el historial de consultas se conservan por un tiempo limitado (${RETENTION_DAYS} días). Te sugerimos imprimir o respaldar tus apuntes importantes.`;
        }
    }

    function etiquetaTipo(tipo) {
        return {
            nota: 'Nota',
            resaltado: 'Resaltado',
            sermon: 'Sermón',
            estudio: 'Estudio',
            estudio_oia: 'O-I-A',
            ia: 'RevelatiO IA',
        }[tipo] || tipo;
    }

    function etiquetaDoctrina(id) {
        const hit = (window.RV?.ui?.DOCTRINAL_TAGS || []).find((t) => t.id === id);
        return hit?.label || id;
    }

    function pintarListaCuaderno() {
        const root = document.getElementById('lista-cuaderno');
        if (!root) return;
        const items = leerCuaderno().items.filter(item => {
            if (cuadernoFiltro === 'todas') { /* ok */ }
            else if (cuadernoFiltro === 'permanente') {
                if (item.archivo !== 'permanente') return false;
            } else if (cuadernoFiltro === 'ia') {
                if (!(item.tipo === 'ia' || item.source === 'ia')) return false;
            } else if (cuadernoFiltro === 'estudio') {
                if (!(item.tipo === 'estudio' || item.tipo === 'estudio_oia')) return false;
            } else if (item.tipo !== cuadernoFiltro) {
                return false;
            }
            if (cuadernoTagFiltro) {
                const tags = Array.isArray(item.tags) ? item.tags : [];
                if (!tags.includes(cuadernoTagFiltro)) return false;
            }
            return true;
        });
        if (!items.length) {
            const tagHint = cuadernoTagFiltro
                ? ` No hay apuntes etiquetados como [${etiquetaDoctrina(cuadernoTagFiltro)}].`
                : '';
            root.innerHTML = `<p class="rv-note-body" style="opacity:.7">Aún no hay apuntes en esta bandeja.${tagHint} Selecciona un versículo, inicia O-I-A o envía una respuesta de RevelatiO IA al Cuaderno.</p>`;
            return;
        }
        root.innerHTML = items.map(item => {
            const dias = diasRestantes(item);
            const expire = item.archivo !== 'permanente' && dias !== null && dias <= 14;
            const when = formatoFechaCuaderno(item.createdAt || item.updatedAt);
            const caduca = expire
                ? (dias <= 0 ? 'Venció el archivo temporal' : `Caduca en ${dias} día${dias === 1 ? '' : 's'}`)
                : (item.archivo === 'permanente' ? 'Archivo permanente' : `Temporal · ${RETENTION_DAYS} días`);
            const tagsHtml = (Array.isArray(item.tags) ? item.tags : [])
                .map((id) => `<button type="button" class="rv-doctrine-chip" data-cuaderno-tag="${escapeHtml(id)}">[${escapeHtml(etiquetaDoctrina(id))}]</button>`)
                .join('');
            return `<article class="rv-note-card ${expire ? 'is-expire' : ''}" data-item="${item.id}">
                <p class="rv-note-when">${escapeHtml(when)}</p>
                <div class="mb-2 flex flex-wrap items-center gap-2">
                    <span class="rv-chip rv-chip-gold">${escapeHtml(etiquetaTipo(item.tipo))}</span>
                    <span class="rv-chip">${escapeHtml(caduca)}</span>
                    ${item.color ? `<span class="rv-swatch sw-${escapeHtml(item.color)}" title="${escapeHtml(item.color)}"></span>` : ''}
                </div>
                ${tagsHtml ? `<div class="rv-note-tags">${tagsHtml}</div>` : ''}
                <p class="rv-note-ref">${escapeHtml(item.referencia || item.titulo || 'Sin referencia')}</p>
                <p class="rv-note-title">${escapeHtml((item.titulo || item.texto || '').slice(0, 90))}</p>
                <p class="rv-note-body">${escapeHtml((item.texto || '').slice(0, 280))}${(item.texto || '').length > 280 ? '…' : ''}</p>
                <div class="mt-3 flex flex-wrap gap-2">
                    <button type="button" class="rv-btn-gold px-2.5 py-1 text-[10px] uppercase tracking-[0.14em]" data-cuaderno-act="abrir">Abrir</button>
                    ${item.archivo === 'permanente' ? '' : `<button type="button" class="rv-btn-gold px-2.5 py-1 text-[10px] uppercase tracking-[0.14em]" data-cuaderno-act="archivar">Archivo permanente</button>`}
                    <button type="button" class="rv-cuaderno-quitar px-2.5 py-1 text-[10px] uppercase tracking-[0.14em]" data-cuaderno-act="borrar">Quitar</button>
                </div>
            </article>`;
        }).join('');
    }

    function markdownCuaderno() {
        if (window.RV?.storage?.toMarkdown) return window.RV.storage.toMarkdown(leerCuaderno().items);
        const items = leerCuaderno().items;
        const head = `# Cuaderno del Peregrino — Éfata RevelatiO\n\nExportado el ${new Date().toLocaleString('es')}\n\n`;
        return head + items.map(item => `## ${etiquetaTipo(item.tipo)} · ${item.referencia || item.titulo || 'Sin referencia'}\n\n_${formatoFechaCuaderno(item.createdAt)}_\n\n${item.texto || '_Vacío_'}\n\n*${item.archivo === 'permanente' ? 'Archivo permanente' : `Temporal (${RETENTION_DAYS} días)`}*`).join('\n\n---\n\n');
    }

    function prepararImpresionCuaderno() {
        const host = document.getElementById('rv-cuaderno-print');
        if (!host) return;
        const items = leerCuaderno().items;
        host.hidden = false;
        host.innerHTML = `<h1>Cuaderno del Peregrino — Éfata RevelatiO</h1>
            <p class="print-meta">Exportado el ${escapeHtml(formatoFechaCuaderno(new Date().toISOString()))} · Retención: ${RETENTION_DAYS} días</p>
            ${items.map(item => `
                <h2>${escapeHtml(etiquetaTipo(item.tipo))} · ${escapeHtml(item.referencia || item.titulo || 'Sin referencia')}</h2>
                <p class="print-meta">${escapeHtml(formatoFechaCuaderno(item.createdAt || item.updatedAt))}</p>
                <p>${escapeHtml(item.texto || 'Vacío').replace(/\n/g, '<br>')}</p>
            `).join('')}`;
    }

    function imprimirCuaderno() {
        prepararImpresionCuaderno();
        window.print();
        setTimeout(() => {
            const host = document.getElementById('rv-cuaderno-print');
            if (host) { host.hidden = true; host.innerHTML = ''; }
        }, 400);
    }

    async function compartirCuaderno() {
        const text = window.RV?.storage?.toPlainText
            ? window.RV.storage.toPlainText(leerCuaderno().items)
            : markdownCuaderno();
        try {
            if (navigator.share) {
                await navigator.share({ title: 'Cuaderno del Peregrino — Éfata RevelatiO', text });
                setSyncStatus('Apuntes compartidos');
                return;
            }
        } catch { /* clipboard */ }
        try {
            await navigator.clipboard?.writeText(text);
            setSyncStatus('Apuntes copiados al portapapeles');
            return;
        } catch { /* file */ }
        const blob = new Blob([text], { type: 'text/plain;charset=utf-8' });
        const a = document.createElement('a');
        a.href = URL.createObjectURL(blob);
        a.download = 'cuaderno-peregrino-revelatio.txt';
        a.click();
        URL.revokeObjectURL(a.href);
        setSyncStatus('Archivo de texto descargado');
    }

function descargarBackup(kind) {
        if (kind === 'md') {
            const blob = new Blob([markdownCuaderno()], { type: 'text/markdown;charset=utf-8' });
            const a = document.createElement('a');
            a.href = URL.createObjectURL(blob);
            a.download = `backup-estudio-revelatio.md`;
            a.click();
            URL.revokeObjectURL(a.href);
            return;
        }
        const w = window.open('', '_blank');
        if (!w) return;
        w.document.write(`<!DOCTYPE html><html lang="es"><head><meta charset="utf-8"><title>Backup de Estudio</title>
            <style>body{font-family:Georgia,serif;background:#FDFCFA;color:#1A1A1A;padding:2.5rem;max-width:40rem;margin:auto;line-height:1.7}
            h1{font-size:1.8rem} h2{font-size:1.15rem;color:#8D7040;margin-top:2rem} hr{border:0;border-top:1px solid #e8e2d6}</style></head>
            <body>${markdownCuaderno().split('\n').map(line => {
            if (line.startsWith('# ')) return `<h1>${escapeHtml(line.slice(2))}</h1>`;
            if (line.startsWith('## ')) return `<h2>${escapeHtml(line.slice(3))}</h2>`;
            if (line.trim() === '---') return '<hr>';
            if (!line.trim()) return '';
            return `<p>${escapeHtml(line)}</p>`;
        }).join('')}<script>window.onload=()=>window.print()<\/script></body></html>`);
        w.document.close();
    }

    async function hidratarDesdeSupabase() {
        const user = await usuarioActual();
        if (!user || !window.supabaseClient) {
            setSyncStatus('Guardado en este dispositivo');
            return;
        }
        setSyncStatus('Sincronizando', true);
        try {
            const { data, error } = await window.supabaseClient.from('user_bible_actions')
                .select('id, action_type, reference, text_content, metadata, updated_at')
                .eq('user_id', user.id);
            if (error) throw error;
            const store = leerCuaderno();
            (data || []).forEach(row => {
                const localId = row.metadata?.local_id;
                let item = store.items.find(x => x.supabaseId === row.id || (localId && x.id === localId));
                const tipo = row.metadata?.tipo || tipoDesdeAccion(row.action_type);
                if (!item) {
                    item = { id: localId || uid(), tipo, createdAt: row.updated_at, supabaseId: row.id };
                    store.items.push(item);
                }
                Object.assign(item, {
                    tipo,
                    referencia: row.reference || item.referencia || '',
                    texto: row.text_content || item.texto || '',
                    color: row.metadata?.color || item.color,
                    titulo: row.metadata?.titulo || item.titulo,
                    archivo: row.metadata?.archivo || item.archivo || 'temporal',
                    updatedAt: row.updated_at || item.updatedAt,
                    supabaseId: row.id,
                    sync: 'ok'
                });
            });
            escribirCuaderno(store);
            setSyncStatus('Guardado');
        } catch (_e) {
            setSyncStatus('Guardado en este dispositivo');
        }
        pintarCuota();
        pintarListaCuaderno();
        restaurarMarcasCapitulo(estado());
    }

    function abrirNota(item, seed) {
        const form = document.getElementById('form-marginnote');
        const sheet = document.getElementById('modulo-marginnote');
        if (!form || !sheet) return;
        const loc = estado();
        form['nota-id'].value = item?.id || '';
        form.referencia.value = item?.referencia || seed?.referencia || `${loc.n} ${loc.cap}`;
        form.nota.value = item?.texto || seed?.texto || '';
        form.permanente.checked = item?.archivo === 'permanente';
        sheet.classList.add('is-open');
        setSyncStatus(item?.sync === 'ok' ? 'Guardado' : 'Guardado en este dispositivo');
    }

    function guardarNotaFormulario() {
        const form = document.getElementById('form-marginnote');
        if (!form) return null;
        const texto = String(form.nota.value || '').trim();
        const referencia = String(form.referencia.value || '').trim();
        if (texto.length < 2) return null;
        return upsertItem({
            id: form['nota-id'].value || uid(),
            tipo: 'nota',
            referencia,
            texto,
            archivo: form.permanente.checked ? 'permanente' : 'temporal'
        });
    }

    function aplicarResaltado(color) {
        const alias = {
            esmeralda: 'verde',
            zafiro: 'azul',
            amatista: 'purpura',
            rubi: 'rubi',
            oro: 'oro',
            verde: 'verde',
            azul: 'azul',
            purpura: 'purpura',
        };
        const tone = alias[color] || color || 'oro';
        const cls = `rv-hl rv-hl-${tone}`;
        const ref = selectedRef || `${estado().n} ${estado().cap}`;
        if (savedRange) {
            try {
                const mark = document.createElement('mark');
                mark.className = cls;
                mark.dataset.hl = tone;
                savedRange.surroundContents(mark);
            } catch {
                const verse = document.querySelector('.rv-verse-surface.is-verse-on, [data-verse].is-verse-on')
                    || document.querySelector(`.rv-verse-surface[data-reference="${CSS.escape(ref)}"]`);
                verse?.classList.add(`rv-hl-${tone}`);
            }
        } else {
            const verse = document.querySelector('.rv-verse-surface.is-verse-on')
                || document.querySelector(`.rv-verse-surface[data-reference="${CSS.escape(ref)}"]`);
            verse?.classList.add(`rv-hl-${tone}`);
        }
        upsertItem({ tipo: 'resaltado', referencia: ref, texto: selectedText, color: tone, archivo: 'temporal' });
        try {
            const map = JSON.parse(localStorage.getItem('revelatio_verse_highlights_v1') || '{}');
            map[ref] = color;
            localStorage.setItem('revelatio_verse_highlights_v1', JSON.stringify(map));
        } catch { /* ignore */ }
        document.querySelectorAll('#rv-popover [data-hl]').forEach(btn => btn.classList.toggle('is-on', btn.dataset.hl === color));
    }

    function restaurarMarcasCapitulo(libro) {
        const lectura = document.getElementById('texto-biblico');
        if (!lectura || !libro) return;
        const prefix = `${libro.n} ${libro.cap}`;
        leerCuaderno().items.filter(i => i.tipo === 'resaltado' && String(i.referencia || '').startsWith(prefix)).forEach(item => {
            lectura.querySelectorAll('[data-reference]').forEach(node => {
                if (node.dataset.reference === item.referencia) node.classList.add(`rv-hl-${item.color || 'oro'}`);
            });
        });
    }

    function numerosDelPasaje(passage, version) {
        const key = claveMotor(version || versionActiva());
        const lista = passage?.versionesVersos?.[key]
            || passage?.versionesVersos?.rv1960
            || passage?.versionesVersos?.tla
            || passage?.versionesVersos?.dhh
            || [];
        const nums = lista.map(v => Number(v.n || v.verse || v.verso || v.versiculo)).filter(n => n > 0);
        return [...new Set(nums)].sort((a, b) => a - b);
    }

    function pintarIndiceVersiculos(libro, numsForzados) {
        const rail = document.getElementById('indice-versiculos');
        const lectura = document.getElementById('texto-biblico');
        if (!rail) return;
        const fromDom = [...(lectura?.querySelectorAll('.rv-verse-surface[data-versiculo]') || [])]
            .map(el => Number(el.dataset.versiculo))
            .filter(Boolean);
        const fromJson = numerosDelPasaje(window.__revelatioPassageData, versionActiva());
        const esperado = versosEsperados(libro);
        const fromCanon = esperado ? Array.from({ length: esperado }, (_, i) => i + 1) : [];
        const nums = [...new Set(
            (Array.isArray(numsForzados) && numsForzados.length) ? numsForzados
                : (fromDom.length ? fromDom : (fromJson.length ? fromJson : fromCanon))
        )].sort((a, b) => a - b);
        if (!nums.length) { rail.innerHTML = ''; return; }
        const activo = Number(libro?.verso || 0);
        rail.innerHTML = `<span class="rv-verse-rail-label">Vv.</span><div class="rv-verse-rail-grid">${
            nums.map(n =>
                `<button type="button" data-ir-verso="${n}" class="${n === activo ? 'is-on' : ''}" aria-current="${n === activo ? 'true' : 'false'}" aria-label="Versículo ${n}">${n}</button>`
            ).join('')
        }</div>`;
    }

    function irAVersiculo(n, opts = {}) {
        n = Number(n);
        if (!n) return;
        const lectura = document.getElementById('texto-biblico');
        const loc = estado();
        window.__revelatioLibroActivo = { ...loc, verso: n };
        actualizarBreadcrumbs({ ...loc, verso: n });
        lectura?.querySelectorAll('.is-verse-on').forEach(el => el.classList.remove('is-verse-on'));
        document.querySelectorAll('#indice-versiculos [data-ir-verso]').forEach(btn => {
            const on = Number(btn.dataset.irVerso) === n;
            btn.classList.toggle('is-on', on);
            btn.setAttribute('aria-current', on ? 'true' : 'false');
        });
        const verse = lectura?.querySelector(`.rv-verse-surface[data-versiculo="${n}"]`);
        selectedRef = `${loc.n} ${loc.cap}:${n}`;
        if (verse) {
            verse.classList.add('is-verse-on');
            navLockUntil = Date.now() + 900;
            if (!opts.silentScroll) {
                verse.scrollIntoView({ behavior: 'smooth', block: 'center' });
            }
            if (!opts.sinMenu && !document.body.classList.contains('is-verse-study')) {
                mostrarMenuVerso(verse);
            }
        }
        const next = { ...loc, verso: n };
        refrescarComentario(next);
        refrescarConcordancia(next);
        refrescarPerspectivas(next);
        if (opts.entrarModo || document.body.classList.contains('is-verse-study')) {
            pintarModoVersiculo(n);
        }
    }

    function listaVersosCapitulo() {
        const lectura = document.getElementById('texto-biblico');
        const fromDom = [...(lectura?.querySelectorAll('.rv-verse-surface[data-versiculo]') || [])]
            .map(el => Number(el.dataset.versiculo))
            .filter(Boolean);
        if (fromDom.length) return [...new Set(fromDom)].sort((a, b) => a - b);
        const fromJson = numerosDelPasaje(window.__revelatioPassageData, versionActiva());
        if (fromJson.length) return fromJson;
        const esperado = versosEsperados(estado());
        return esperado ? Array.from({ length: esperado }, (_, i) => i + 1) : [];
    }

    function textoHeroVersiculo(n) {
        const el = document.querySelector(`#texto-biblico .rv-verse-surface[data-versiculo="${n}"] .rv-verse-text`);
        if (!el) return '';
        return el.innerHTML;
    }

    function pintarModoVersiculo(n) {
        const panel = document.getElementById('rv-verse-study');
        const refEl = document.getElementById('rv-verse-study-ref');
        const hero = document.getElementById('rv-verse-study-hero');
        const prev = document.getElementById('rv-verse-prev');
        const next = document.getElementById('rv-verse-next');
        if (!panel || !refEl || !hero) return;
        const loc = estado();
        const nums = listaVersosCapitulo();
        const idx = nums.indexOf(Number(n));
        refEl.textContent = `${loc.n} ${loc.cap}:${n}`;
        hero.innerHTML = textoHeroVersiculo(n) || `<span class="rv-verse-num">${n}</span>`;
        panel.hidden = false;
        document.body.classList.add('is-verse-study');
        if (prev) prev.disabled = idx <= 0;
        if (next) next.disabled = idx < 0 || idx >= nums.length - 1;
        try {
            document.dispatchEvent(new CustomEvent('revelatio:verse-study', { detail: { n, ref: `${loc.n} ${loc.cap}:${n}` } }));
        } catch { /* ignore */ }
        try {
            window.RV?.ui?.renderDoctrinalTags?.('#rv-doctrine-tags');
        } catch { /* ignore */ }
        try {
            panel.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
        } catch { /* ignore */ }
    }

    function entrarModoVersiculo(n) {
        const verso = Number(n) || Number(estado().verso) || 1;
        irAVersiculo(verso, { entrarModo: true, sinMenu: true });
        pintarModoVersiculo(verso);
    }

    function salirModoVersiculo() {
        document.body.classList.remove('is-verse-study');
        const panel = document.getElementById('rv-verse-study');
        if (panel) panel.hidden = true;
        const on = document.querySelector('#texto-biblico .rv-verse-surface.is-verse-on');
        if (on) on.scrollIntoView({ behavior: 'smooth', block: 'center' });
    }

    function navegarModoVersiculo(delta) {
        const nums = listaVersosCapitulo();
        if (!nums.length) return;
        const actual = Number(estado().verso) || nums[0];
        let idx = nums.indexOf(actual);
        if (idx < 0) idx = 0;
        const next = nums[Math.max(0, Math.min(nums.length - 1, idx + delta))];
        if (!next || next === actual) return;
        irAVersiculo(next, { entrarModo: true, sinMenu: true });
    }

    function montarModoVersiculo() {
        if (window.__RV_VERSE_STUDY_WIRED__) return;
        window.__RV_VERSE_STUDY_WIRED__ = true;
        document.getElementById('rv-verse-prev')?.addEventListener('click', () => navegarModoVersiculo(-1));
        document.getElementById('rv-verse-next')?.addEventListener('click', () => navegarModoVersiculo(1));
        document.getElementById('rv-verse-exit')?.addEventListener('click', () => salirModoVersiculo());
        document.querySelectorAll('[data-verse-jump]').forEach(btn => {
            btn.addEventListener('click', () => {
                const tab = btn.getAttribute('data-verse-jump');
                if (tab) abrirEstudioTab(tab);
            });
        });
        document.addEventListener('keydown', (event) => {
            if (!document.body.classList.contains('is-verse-study')) return;
            if (event.target?.closest?.('input, textarea, select')) return;
            if (event.key === 'Escape') {
                event.preventDefault();
                salirModoVersiculo();
                return;
            }
            if (event.key === 'ArrowLeft') {
                event.preventDefault();
                navegarModoVersiculo(-1);
            }
            if (event.key === 'ArrowRight') {
                event.preventDefault();
                navegarModoVersiculo(1);
            }
        });
        window.RV = window.RV || {};
        window.RV.verseStudy = {
            enter: entrarModoVersiculo,
            exit: salirModoVersiculo,
            next: () => navegarModoVersiculo(1),
            prev: () => navegarModoVersiculo(-1),
            go: irAVersiculo,
        };
    }

    function abrirEstudioTab(tab) {
        document.querySelectorAll('[data-estudio-tab]').forEach(btn => {
            const on = btn.dataset.estudioTab === tab;
            btn.classList.toggle('is-on', on);
            btn.setAttribute('aria-selected', String(on));
        });
        document.getElementById('panel-neuro')?.classList.toggle('is-hidden-tab', tab !== 'comentario');
        document.getElementById('panel-perspectivas')?.classList.toggle('is-hidden-tab', tab !== 'perspectivas');
        document.getElementById('panel-concordancia')?.classList.toggle('is-hidden-tab', tab !== 'concordancia');
        if (tab === 'perspectivas' || tab === 'concordancia') {
            document.getElementById('modulo-estudio')?.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
        }
        if (tab === 'perspectivas') refrescarPerspectivas(estado());
        if (tab === 'concordancia') refrescarConcordancia(estado());
    }

    function strongsDelVersoSeleccionado(n) {
        const seen = new Set();
        const keys = [];
        for (const t of tokensStrongDe(n)) {
            const s = String(t.strong || '').toUpperCase().replace(/^([GH])0+(\d+)$/, '$1$2');
            if (!s || seen.has(s)) continue;
            seen.add(s);
            keys.push({
                strong: s,
                palabra: String(t.palabra || t.texto || t.glosa || t.translation || '').trim(),
                original: String(t.original || t.orig || t.lemma || t.lexema || t.raiz || '').trim(),
                translit: String(t.translit || t.transliteracion || '').trim(),
                morph: String(t.gram || t.morfologia || t.morph || t.parsing || '').trim(),
                glosa: String(t.glosa || t.translation || GLOSA[s] || '').trim(),
            });
        }
        return keys;
    }

    let __rvLexicoCache = null;
    async function cargarLexicoStrong() {
        if (__rvLexicoCache) return __rvLexicoCache;
        const rutas = ['data/strong/lexico.json', '/data/strong/lexico.json', 'public/data/strong/lexico.json'];
        let pack = {};
        for (const ruta of rutas) {
            try {
                const res = await fetch(ruta, { cache: 'force-cache' });
                if (res.ok) pack = { ...pack, ...(await res.json()) };
            } catch { /* siguiente */ }
        }
        __rvLexicoCache = pack;
        return pack;
    }

    function celdaInterlineal(item) {
        const esHeb = /^H/i.test(item.strong);
        const lang = esHeb ? 'he' : 'el';
        const resolve = window.resolveSpanishStrong || window.RV?.Strongs?.resolveSpanishEntry;
        const entry = typeof resolve === 'function'
            ? resolve(item.strong, {
                word: item.original,
                translit: item.translit,
                def: item.glosa || item.meaning,
                morph: item.morph,
            })
            : null;
        const es = entry?.def?.split(/[.;]/)[0]
            || (window.translateGlossToSpanish
                ? window.translateGlossToSpanish(item.glosa || item.palabra || '')
                : (item.glosa || item.palabra || item.strong));
        const orig = entry?.word || item.original || '—';
        const translit = entry?.translit || item.translit || '—';
        const morph = entry?.part || item.morph || '—';
        const code = entry?.strongCode || item.strong;
        return `<button type="button" class="rv-il-cell rv-strong-pill bg-amber-100/70 hover:bg-amber-200 border border-[#C59B27]/40 text-[#0F172A] text-xs font-serif px-2 py-0.5 rounded-md cursor-pointer transition-all shadow-sm" role="listitem" data-strong="${escapeHtml(code)}" data-lemma="${escapeHtml(orig)}" aria-label="Strong ${escapeHtml(code)}: ${escapeHtml(es)}">
            <span class="rv-il-es font-semibold text-[#0F172A]">${escapeHtml(es)}</span>
            <span class="rv-il-orig ${esHeb ? 'is-he' : 'is-el'} font-bold text-[#0A192F]" lang="${lang}">${escapeHtml(orig)}</span>
            <span class="rv-il-trans text-stone-600">${escapeHtml(translit)}</span>
            <span class="rv-il-morph text-[#855D10]">${escapeHtml(morph)}</span>
            <span class="rv-il-code text-[9px] font-mono font-bold text-[#855D10]">${escapeHtml(code)}</span>
        </button>`;
    }

    async function enriquecerTokensStrong(keys) {
        if (!keys.length) return keys;
        const lexico = await cargarLexicoStrong();
        const resolve = window.resolveSpanishStrong || window.RV?.Strongs?.resolveSpanishEntry;
        return keys.map((t) => {
            const local = lexico[t.strong] || lexico[String(t.strong).toUpperCase()] || {};
            const rawGlosa = t.glosa || GLOSA[t.strong] || local.definicion || local.definition || t.palabra || '';
            const entry = typeof resolve === 'function'
                ? resolve(t.strong, {
                    word: t.original || local.lemma,
                    translit: t.translit || local.translit,
                    def: rawGlosa,
                    morph: t.morph || local.morph,
                })
                : null;
            return {
                ...t,
                original: entry?.word || t.original || local.lemma || local.lexema || local.raiz || '',
                translit: entry?.translit || t.translit || local.translit || local.transliteracion || '',
                glosa: entry?.def?.split(/[.;]/)[0]
                    || (window.translateGlossToSpanish ? window.translateGlossToSpanish(rawGlosa) : rawGlosa)
                    || t.palabra,
                morph: entry?.part || t.morph || local.morph || local.morfologia || local.parsing || '—',
            };
        });
    }

    function pintarConcordancia(libro, cruzadas, termino = '') {
        const refEl = document.getElementById('ref-concordancia');
        const cruzadasEl = document.getElementById('lista-cruzadas');
        const strongEl = document.getElementById('lista-strong-verso');
        const ref = referenciaComentario(libro);
        if (refEl) {
            refEl.textContent = termino
                ? `${ref || ''} · «${termino}»`.trim()
                : (ref || `${libro?.n || ''} ${libro?.cap || ''}`.trim());
        }
        const n = Number(libro?.verso || 0);
        const keys = n ? strongsDelVersoSeleccionado(n) : [];
        if (strongEl) {
            if (!n) {
                strongEl.innerHTML = `<p class="rv-estudio-vacio">Elige un versículo para abrir el interlineal inverso (español → hebreo/griego).</p>`;
            } else if (!keys.length) {
                strongEl.innerHTML = `<p class="rv-estudio-vacio">No hay raíces Strong para este versículo en el texto original cargado.</p>`;
            } else {
                strongEl.innerHTML = keys.map(celdaInterlineal).join('');
                enriquecerTokensStrong(keys).then((rich) => {
                    if (Number(estado()?.verso || 0) !== n) return;
                    const el = document.getElementById('lista-strong-verso');
                    if (el) el.innerHTML = rich.map(celdaInterlineal).join('');
                }).catch(() => {});
            }
        }
        if (cruzadasEl) {
            cruzadasEl.innerHTML = (cruzadas || []).length
                ? cruzadas.map(item => {
                    const cita = item.ref || item.reference || '';
                    const nota = item.nota || item.description || item.text || '';
                    return `<button type="button" class="rv-xref-item" data-ir-ref="${escapeHtml(cita)}"><span class="rv-xref-ref">${escapeHtml(cita)}</span>${nota ? `<span class="rv-xref-nota">${escapeHtml(nota)}</span>` : ''}</button>`;
                }).join('')
                : `<p class="rv-estudio-vacio">${termino ? `No hay coincidencias para «${escapeHtml(termino)}».` : (n ? 'No hay un término de 5+ letras en este versículo para concordancia. Usa la búsqueda del canon.' : 'Elige un versículo o busca una palabra de al menos 3 letras.')}</p>`;
        }
    }

    async function cargarCruzadas(ref) {
        const passage = String(ref || '').trim();
        if (!passage) return [];
        try {
            const engine = window.RV?.StudyEngine;
            if (engine?.askStudyEngine) {
                const payload = await engine.askStudyEngine({ passage, mode: 'tsk' });
                const parsed = engine.parseTskItems?.(payload.answer) || [];
                if (parsed.length) return parsed;
                if (payload.answer) return [{ ref: passage, nota: payload.answer }];
            }
        } catch { /* fallback */ }
        try {
            const token = await tokenAuth();
            const headers = { 'Content-Type': 'application/json', Accept: 'application/json' };
            if (token) headers.Authorization = `Bearer ${token}`;
            const res = await fetch('/api/tsk', {
                method: 'POST',
                headers,
                body: JSON.stringify({ consulta: passage, passage, version: versionActiva() })
            });
            if (!res.ok) return [];
            const json = await res.json();
            const lista = json.data?.referencias || json.referencias || [];
            if (!lista.length) return [];
            return lista.map(x => ({
                ref: x.ref || x.reference,
                nota: x.texto || x.text || x.nota || x.description || '',
            }));
        } catch {
            return [];
        }
    }

    function palabrasClaveConcordancia(texto) {
        const stop = new Set(
            `el la los las un una unos unas de del al a en y o u que se su sus le les lo
             por para con sin sobre entre hasta desde como cuando donde porque pues asi
             este esta estos estas ese esa eso aquel aquella hay ser son fue eran muy
             mas pero sino tambien ya no ni me te nos os yo tu el oh jehova
             nunca jamas siempre todos todas este esta`.split(/\s+/).filter(Boolean)
        );
        return String(texto || '')
            .toLowerCase()
            .normalize('NFD')
            .replace(/[\u0300-\u036f]/g, '')
            .replace(/[^a-z0-9ñ\s]/g, ' ')
            .split(/\s+/)
            .filter((w) => w.length >= 5 && !stop.has(w));
    }

    async function cargarConcordanciaHits(term) {
        const q = String(term || '').trim();
        if (q.length < 3) return [];
        const ver = claveMotor(versionActiva());
        const res = await fetch(`/api/concordancia?q=${encodeURIComponent(q)}&version=${encodeURIComponent(ver)}`);
        const json = await res.json().catch(() => null);
        if (!res.ok) return [];
        return json?.data?.resultados || json?.resultados || [];
    }

    async function refrescarConcordancia(libro) {
        const ref = referenciaComentario(libro);
        const texto = versoTextoActual(libro);
        const keys = palabrasClaveConcordancia(texto);
        const cruzadasEl = document.getElementById('lista-cruzadas');
        const contentEl = document.getElementById('concordance-content-area');
        const loading = `<p class="rv-estudio-vacio py-6 text-center text-amber-800 text-sm"><span class="animate-spin inline-block mr-1">⏳</span> Buscando concordancia para ${escapeHtml(ref)}...</p>`;
        if (cruzadasEl) cruzadasEl.innerHTML = loading;
        if (contentEl && contentEl !== cruzadasEl) contentEl.innerHTML = loading;

        let hits = [];
        let used = keys[0] || '';
        try {
            for (const term of keys) {
                const got = await cargarConcordanciaHits(term);
                used = term;
                if (got.length) {
                    hits = got;
                    break;
                }
            }
        } catch {
            hits = [];
        }

        if (referenciaComentario(estado()) !== ref && referenciaComentario(libro) !== ref) {
            /* stale */
        }
        const mapped = hits.map((item) => ({
            ref: item.ref || (item.libro ? `${item.libro} ${item.capitulo}:${item.verso}` : ''),
            nota: String(item.html || item.texto || item.text || '').replace(/<[^>]+>/g, ''),
            html: item.html || '',
        }));
        pintarConcordancia(libro, mapped, used);
    }


    const PERSPECTIVAS = (window.RV_DATA && window.RV_DATA.PERSPECTIVAS) || {};
    const PERSP_TO_LENS = {
        exegesis: { id: 'biblica_exegesis', title: 'Exégesis Filológica & Textual' },
        hermeneutica: { id: 'biblica_pactos', title: 'Teología del Pacto & Metarrelato' },
        apologetica: { id: 'biblica_apologetica', title: 'Apologética Clásica & Cosmovisión' },
        mente: { id: 'mental_metanoia', title: 'Metanoia & Renovación del Nous' },
        alma: { id: 'mental_psicologia', title: 'Psicología del Alma & Shalom' },
    };

    async function pedirLenteElite(subLensId, lensTitle, libro) {
        const loc = libro || estado();
        const ref = referenciaComentario(loc);
        const verseText = versoTextoActual(loc);
        const res = await fetch('/api/lente-elite', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json', Accept: 'application/json' },
            body: JSON.stringify({
                passage: ref,
                subLensId,
                lensId: subLensId,
                lensTitle,
                verseText,
                mode: 'elite_lens',
                type: 'elite_lens',
                prompt: `Analiza ${ref} bajo ${lensTitle}`,
            }),
        });
        const data = await res.json().catch(() => ({}));
        return String(data.answer || data.respuesta || data.text || data.error || '').trim();
    }

    function htmlDictamenLente(text) {
        return escapeHtml(String(text || '').trim())
            .replace(/^###\s+(.*?)$/gm, '<h5 class="font-bold text-[#855D10] my-2">$1</h5>')
            .replace(/\n\n+/g, '</p><p>')
            .replace(/\n/g, '<br/>');
    }

    let perspState = {
        activa: 'exegesis',
        compare: false,
        segunda: 'hermeneutica',
        cacheKey: '',
        packs: null,
        sintetizando: false,
    };

    function versoTextoActual(libro) {
        const n = Number(libro?.verso || 0);
        if (!n) return '';
        const el = document.querySelector(`#texto-biblico .rv-verse-surface[data-versiculo="${n}"] .rv-verse-text`);
        if (el) {
            const clone = el.cloneNode(true);
            clone.querySelectorAll('.rv-verse-num, .rv-strong-row, .rv-token-meta, sup')?.forEach?.(node => node.remove());
            return String(clone.textContent || '').replace(/\s+/g, ' ').trim();
        }
        const passage = window.__revelatioPassageData;
        const version = versionActiva();
        const lista = passage?.versionesVersos?.[claveMotor(version)] || [];
        const hit = lista.find(v => Number(v.n) === n);
        return String(hit?.texto || '').replace(/\s+/g, ' ').trim();
    }

    function comentarioBaseParaPerspectiva(libro) {
        const autor = autorActivo();
        const ref = referenciaComentario(libro);
        const data = window.revelatioLectura?.comentarioInmediato?.(ref, autor);
        const textos = (data?.entradas || []).map(e => String(e?.texto || '').trim()).filter(t => t && !esRuidoEditorial(t));
        if (textos.length) return textos.slice(0, 2).join(' ');
        const cuerpo = String(data?.cuerpo || '').trim();
        return cuerpo && !esRuidoEditorial(cuerpo) ? cuerpo.slice(0, 900) : '';
    }

    function strongResumen(libro) {
        const n = Number(libro?.verso || 0);
        if (!n) return '';
        const keys = strongsDelVersoSeleccionado(n).slice(0, 4);
        if (!keys.length) return '';
        return keys.map(k => `${k.palabra || 'término'} (${k.strong})`).join(', ');
    }

    function construirPackPerspectivas(libro) {
        const ref = referenciaComentario(libro) || `${libro?.n || ''} ${libro?.cap || ''}`.trim();
        const texto = versoTextoActual(libro);
        const cita = texto ? `«${texto}»` : `el pasaje de ${ref}`;
        const autor = AUTOR_LABEL[autorActivo()] || 'los comentaristas históricos';
        const base = comentarioBaseParaPerspectiva(libro);
        const strong = strongResumen(libro);
        const conStrong = strong
            ? ` Las raíces léxicas disponibles — ${strong} — orientan el sentido original sin sustituir el contexto canónico.`
            : ' El léxico Strong, cuando está disponible en el texto original cargado, afina el sentido sin desplazar el contexto.';

        return {
            exegesis: {
                ...PERSPECTIVAS.exegesis,
                cuerpo: [
                    `TRATADO EXEGÉTICO · ${ref}. El punto de partida no es la experiencia contemporánea sino el texto inspirado en su marco histórico-gramatical. ${cita} pertenece a un género literario, un argumento y una intención del autor humano bajo la soberanía del Espíritu (2 P 1:20-21).`,
                    base
                        ? `Testimonio clásico (${autor}): ${base}`
                        : `Los comentaristas clásicos (${autor}) se leen como siervos de la Escritura: iluminan el sentido del autor, jamás rivalizan con la autoridad canónica.`,
                    `Léxico y raíces.${conStrong} Cada término significativo se pesa en su campo semántico (hebreo/griego) y en su uso canónico, evitando etimologías curiosas que ignoren el contexto inmediato.`,
                    `Preguntas control: ¿Qué dijo el texto a sus primeros oidores? ¿Qué contraste corrige? ¿Qué mandato, promesa o indicativo sostiene la unidad del pasaje? La exégesis responde con evidencia textual, no con eslóganes.`,
                    `Devolución normativa: la misma verdad permanece vigente hoy porque Dios no miente. El sentido histórico no se diluye en “relevancia”; se aplica porque Cristo es el mismo ayer, y hoy, y por los siglos (Heb 13:8).`,
                    `Cierre teológico: toda exégesis fiel conduce al Padre que habla, al Hijo que cumple y al Espíritu que ilumina. Sin cruz, el análisis gramatical queda estéril; con cruz, el léxico sirve a la adoración.`,
                ],
            },
            hermeneutica: {
                ...PERSPECTIVAS.hermeneutica,
                cuerpo: [
                    `TRATADO HERMENÉUTICO · ${ref}. La Escritura interpreta la Escritura. ${cita} no se aísla: se lee en el analogía fidei —promesa, cumplimiento y teología de la gracia en Cristo (Lc 24:27, 44-47).`,
                    `Canon y coherencia: Ley, Profetas, Escritos y Nuevo Testamento dialogan. Ninguna doctrina florece fuera del conjunto; ninguna aplicación legitima contradice el evangelio de la gracia.`,
                    `Gracia y verdad: lo que el texto manda, la cruz capacita. La hermenéutica cristiana no produce mérito; revela necesidad y provee a Cristo como justicia imputada y vida nueva (Ro 3:21-26; 8:1-4).`,
                    `Regla pastoral: distingue indicativo y imperativo. Primero lo que Dios ha hecho en Cristo; luego lo que el Espíritu produce en el creyente. Invertir el orden es legalismo o desesperación.`,
                    `Cierre: el Padre glorificado, el Hijo exaltado, el Espíritu aplicando la Palabra. Hermenéutica sin Trinidad es técnica; con Trinidad es adoración inteligente.`,
                ],
            },
            apologetica: {
                ...PERSPECTIVAS.apologetica,
                cuerpo: [
                    `TRATADO APOLOGÉTICO · ${ref}. ${cita} no es opinión religiosa privada: es revelación pública que sostiene la fe una vez dada a los santos (Judas 3).`,
                    `Veracidad: coherencia interna del testimonio, continuidad canónica y poder transformador del texto. La apologética bíblica no inventa pruebas cosméticas; muestra que Dios ha hablado y que Cristo resucitó según las Escrituras (1 Co 15:3-4).`,
                    `Defensa ante la crítica: el escándalo de la cruz no se negocia. Ante el escepticismo, este pasaje ancla autoridad, pecado real, gracia real y juicio real —sin relativismo moral.`,
                    `Uso ministerial: responde con mansedumbre y temor (1 P 3:15), pero sin ceder el terreno. La verdad no se disuelve en empatía secular; la empatía se ordena bajo la verdad.`,
                    `Cierre: el Padre testifica del Hijo; el Espíritu convence de pecado, justicia y juicio (Jn 16:8-11). Apologética sin Espíritu es debate; con Espíritu es testimonio.`,
                ],
            },
            mente: {
                ...PERSPECTIVAS.mente,
                cuerpo: [
                    `TRATADO DE MENTE · ${ref}. La Escritura manda renovación del entendimiento (Ro 12:2). ${cita} confronta guiones mentales que la carne normaliza y que el humanismo celebra como “autenticidad”.`,
                    `Diseño creado: la neuroplasticidad describe —con prudencia— que atención, repetición y hábitos reconfiguran circuitos. Eso no prueba la doctrina; ilustra por qué meditar día y noche en la Ley (Sal 1) no es ornamento sino obediencia ilustrada.`,
                    `Prohibición: autoayuda, coaching secular y psicología que excluyan la cruz. La metanoia no es técnica de bienestar; es arrepentimiento y fe bajo la Palabra (Mr 1:15).`,
                    `Práctica densa: identifica un pensamiento automático que este verso corrige; escribe el mentiroso “si… entonces…”; sustituye por la verdad textual durante siete días en oración, con dominio propio y rendición de cuentas eclesial.`,
                    `Cierre: el Padre renueva por su Palabra; el Hijo es la verdad (Jn 14:6); el Espíritu guía a toda verdad (Jn 16:13). Mente renovada es mente crucificada al mundo y viva para Dios.`,
                ],
            },
            alma: {
                ...PERSPECTIVAS.alma,
                cuerpo: [
                    `TRATADO DEL ALMA · ${ref}. Las pasiones —miedo, ira, frustración, vergüenza— encuentran diagnóstico y remedio aquí. ${cita} no anestesia el corazón: lo quebranta para sanarlo (Sal 51:17).`,
                    `Corazón de piedra → corazón de carne (Ez 36:26-27). La inteligencia emocional bíblica no eleva el yo: entrega el afecto al Espíritu, que produce amor, gozo, paz y dominio propio (Gá 5:22-23).`,
                    `Pastoral densa: nombra la emoción sin justificar el pecado; confiesa delante de Cristo; pide una respuesta de gracia en una relación concreta hoy —palabra, límite o servicio— bajo la autoridad del texto.`,
                    `Comunión: el alma no se restaura en aislamiento terapéutico secular, sino en la iglesia, los medios de gracia y la cruz. El quebrantamiento verdadero llora el pecado y abraza al Redentor.`,
                    `Cierre: el Padre compasivo, el Hijo que carga nuestras iniquidades (Is 53), el Espíritu Consolador. Alma restaurada es alma adoradora.`,
                ],
            },
        };
    }

    function renderPerspCard(pack) {
        if (!pack) return '';
        const body = (pack.cuerpo || []).map(p => `<p>${escapeHtml(p)}</p>`).join('');
        return `
            <article class="rv-persp-card" data-persp-card="${escapeHtml(pack.id)}">
                <p class="rv-persp-card-kicker">${escapeHtml(pack.subtitulo || '')}</p>
                <h3 class="rv-persp-card-title">${escapeHtml(pack.mark || '')} ${escapeHtml(pack.titulo || '')}</h3>
                <div class="rv-persp-card-body">${body}</div>
                <p class="rv-persp-meta">Éfata RevelatiO · lente de estudio bajo autoridad bíblica</p>
            </article>`;
    }

    function pintarTipPerspectiva(id, modo) {
        const meta = PERSPECTIVAS[id] || PERSPECTIVAS.exegesis;
        const tip = document.getElementById('rv-persp-tip');
        const title = document.getElementById('rv-persp-tip-title');
        const body = document.getElementById('rv-persp-tip-body');
        if (!tip || !title || !body) return;
        title.textContent = `${meta.mark || ''} ${meta.titulo || ''}`.trim();
        body.textContent = meta.tip || '';
        tip.classList.add('is-on');
        tip.hidden = false;
        tip.dataset.modo = modo || 'activa';
    }

    function pintarPerspectivasUI() {
        const grid = document.getElementById('rv-persp-grid');
        if (!grid || !perspState.packs) return;
        const a = perspState.packs[perspState.activa] || perspState.packs.exegesis;
        if (!perspState.compare) {
            grid.classList.remove('is-compare');
            grid.innerHTML = renderPerspCard(a);
            return;
        }
        let bId = perspState.segunda;
        if (bId === perspState.activa) {
            bId = Object.keys(PERSPECTIVAS).find(k => k !== perspState.activa) || 'hermeneutica';
            perspState.segunda = bId;
            const sel = document.getElementById('rv-persp-b');
            if (sel) sel.value = bId;
        }
        const b = perspState.packs[bId];
        grid.classList.add('is-compare');
        grid.innerHTML = renderPerspCard(a) + renderPerspCard(b);
    }

    function refrescarPerspectivas(libro) {
        const loc = libro || estado();
        const refEl = document.getElementById('ref-perspectivas');
        const ref = referenciaComentario(loc) || `${loc?.n || ''} ${loc?.cap || ''}`.trim();
        if (refEl) refEl.textContent = ref || 'Selecciona un versículo';
        const key = `${ref}|${versoTextoActual(loc).slice(0, 80)}|${autorActivo()}`;
        if (key !== perspState.cacheKey || !perspState.packs) {
            perspState.cacheKey = key;
            perspState.packs = construirPackPerspectivas(loc);
            const report = document.getElementById('rv-persp-synth-report');
            if (report) {
                report.classList.remove('is-on');
                report.innerHTML = '';
            }
        }
        // Migrar IDs antiguos si quedaron en estado.
        if (!PERSPECTIVAS[perspState.activa]) perspState.activa = 'exegesis';
        if (!PERSPECTIVAS[perspState.segunda]) perspState.segunda = 'hermeneutica';
        document.querySelectorAll('#panel-perspectivas [data-persp]').forEach(btn => {
            const on = btn.dataset.persp === perspState.activa;
            btn.classList.toggle('is-on', on);
            btn.setAttribute('aria-selected', String(on));
        });
        pintarTipPerspectiva(perspState.activa, 'activa');
        pintarPerspectivasUI();
        cargarLentePerspectivaActiva(loc);
    }

    async function cargarLentePerspectivaActiva(libro) {
        const loc = libro || estado();
        const grid = document.getElementById('rv-persp-grid');
        const mapped = PERSP_TO_LENS[perspState.activa] || PERSP_TO_LENS.exegesis;
        if (grid) {
            grid.innerHTML = `<p class="rv-persp-loading">Consultando lente «${escapeHtml(mapped.title)}»…</p>`;
        }
        try {
            const answer = await pedirLenteElite(mapped.id, mapped.title, loc);
            if (!grid) return;
            if (!answer) {
                grid.innerHTML = `<p class="rv-estudio-vacio">No se pudo generar el dictamen de la lente. Reintenta.</p>`;
                return;
            }
            grid.innerHTML = `
                <article class="rv-persp-card">
                    <p class="rv-persp-card-kicker">${escapeHtml(mapped.id)}</p>
                    <h3 class="rv-persp-card-title">${escapeHtml(mapped.title)}</h3>
                    <div class="rv-persp-card-body"><p>${htmlDictamenLente(answer)}</p></div>
                    <p class="rv-persp-meta">RevelatiO IA · /api/lente-elite</p>
                </article>`;
        } catch {
            if (grid) {
                grid.innerHTML = `<p class="rv-estudio-vacio">No se pudo generar el dictamen de la lente. Reintenta. No se inventará un comentario clásico ni el texto del versículo.</p>`;
            }
        }
    }

    function construirSintesisMaestra(libro) {
        const ref = referenciaComentario(libro) || `${libro?.n || ''} ${libro?.cap || ''}`.trim();
        const texto = versoTextoActual(libro);
        const cita = texto ? `«${texto}»` : `el testimonio de ${ref}`;
        const packs = perspState.packs || construirPackPerspectivas(libro);
        return {
            verdad: `En ${ref}, la Escritura revela verdad normativa. ${cita} se interpreta por exégesis e historia (${packs.exegesis.titulo}), hermenéutica canónica (${packs.hermeneutica.titulo}) y apologética de veracidad (${packs.apologetica.titulo}). Toda verdad desemboca en el Padre, la cruz de Jesucristo y la obra del Espíritu Santo.`,
            impacto: `Unida a neuroplasticidad y pensamiento (${packs.mente.titulo}) y a la restauración del alma (${packs.alma.titulo}), esta revelación confronta hábitos mentales y pasiones del corazón. La metanoia no es humanismo: es renovación bajo la Palabra. El Espíritu quita el corazón de piedra y da corazón de carne.`,
            decreto: `Por tanto, delante de la Cruz: 1) Confiesa lo que ${ref} expone. 2) Cree de nuevo el evangelio que capacita lo que el texto manda. 3) Practica hoy un acto concreto —palabra, límite o servicio— alineado con este verso. 4) Medita el pasaje pidiendo al Espíritu que escriba la verdad en la mente y en el alma. Así se unen las cinco lentes en una sola obediencia gozosa.`,
        };
    }

    async function sintetizarPerspectivasConIA(libro) {
        const loc = libro || estado();
        const report = document.getElementById('rv-persp-synth-report');
        if (!report) return;
        if (perspState.sintetizando) return;
        perspState.sintetizando = true;
        report.classList.add('is-on');
        report.innerHTML = `
            <div class="rv-persp-synth-head">
                <img src="brand/revelatio-mark.png" alt="" class="rv-ia-isotipo">
                <div>
                    <strong>RevelatiO IA</strong>
                    <span>Dictamen maestro en curso…</span>
                </div>
            </div>
            <p class="rv-persp-loading">Consultando /api/lente-elite · dictamen_maestro…</p>`;

        try {
            const answer = await pedirLenteElite(
                'dictamen_maestro',
                'DICTAMEN MAESTRO INTEGRADO',
                loc,
            );
            report.innerHTML = `
            <div class="rv-persp-synth-head">
                <img src="brand/revelatio-mark.png" alt="" class="rv-ia-isotipo">
                <div>
                    <strong>Síntesis maestra · RevelatiO IA</strong>
                    <span>${escapeHtml(referenciaComentario(loc) || 'Pasaje')}</span>
                </div>
            </div>
            <div class="rv-persp-block">
                <p>${htmlDictamenLente(answer || 'No se pudo generar el dictamen de la lente. Reintenta.')}</p>
            </div>`;
        } catch {
            report.innerHTML = `
            <div class="rv-persp-synth-head">
                <div>
                    <strong>Síntesis maestra</strong>
                    <span>${escapeHtml(referenciaComentario(loc) || 'Pasaje')}</span>
                </div>
            </div>
            <p class="rv-estudio-vacio">No se pudo generar el dictamen de la lente. Reintenta. No se inventará un comentario clásico ni el texto del versículo.</p>`;
        }
        perspState.sintetizando = false;
        report.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
    }

    function montarPerspectivas() {
        const compareBtn = document.getElementById('rv-persp-compare');
        const comparePick = document.getElementById('rv-persp-compare-pick');
        const segunda = document.getElementById('rv-persp-b');
        const synth = document.getElementById('rv-persp-synth');
        const root = document.getElementById('panel-perspectivas');
        if (!root || window.__RV_PERSP_WIRED__) return;
        window.__RV_PERSP_WIRED__ = true;

        root.addEventListener('click', (event) => {
            const btn = event.target.closest('[data-persp]');
            if (!btn || !root.contains(btn)) return;
            event.preventDefault();
            perspState.activa = btn.dataset.persp || 'exegesis';
            pintarTipPerspectiva(perspState.activa, 'activa');
            refrescarPerspectivas(estado());
        });

        root.addEventListener('pointerover', (event) => {
            const btn = event.target.closest?.('[data-persp]');
            if (!btn || !root.contains(btn)) return;
            pintarTipPerspectiva(btn.dataset.persp || 'exegesis', 'hover');
        });

        root.addEventListener('focusin', (event) => {
            const btn = event.target.closest?.('[data-persp]');
            if (!btn || !root.contains(btn)) return;
            pintarTipPerspectiva(btn.dataset.persp || 'exegesis', 'focus');
        });

        root.addEventListener('pointerout', (event) => {
            if (event.relatedTarget && root.contains(event.relatedTarget)) return;
            pintarTipPerspectiva(perspState.activa, 'activa');
        });

        compareBtn?.addEventListener('click', () => {
            perspState.compare = !perspState.compare;
            compareBtn.classList.toggle('is-on', perspState.compare);
            compareBtn.setAttribute('aria-pressed', String(perspState.compare));
            if (comparePick) {
                comparePick.hidden = !perspState.compare;
                comparePick.classList.toggle('is-on', perspState.compare);
            }
            pintarPerspectivasUI();
        });

        segunda?.addEventListener('change', () => {
            perspState.segunda = segunda.value || 'hermeneutica';
            pintarPerspectivasUI();
        });

        synth?.addEventListener('click', () => {
            abrirEstudioTab('perspectivas');
            sintetizarPerspectivasConIA(estado());
        });

        window.revelatioPerspectivas = {
            refrescar: refrescarPerspectivas,
            sintetizar: sintetizarPerspectivasConIA,
            estado: () => ({ ...perspState }),
        };
        pintarTipPerspectiva(perspState.activa, 'activa');
    }


    function montarEstudio() {
        document.getElementById('tabs-estudio')?.addEventListener('click', event => {
            const tab = event.target.closest('[data-estudio-tab]')?.dataset.estudioTab;
            if (tab) abrirEstudioTab(tab);
        });
        document.getElementById('lista-cruzadas')?.addEventListener('click', event => {
            const btn = event.target.closest('[data-ir-ref]');
            if (!btn?.dataset.irRef) return;
            const parsed = parseGoto(btn.dataset.irRef);
            const nombre = resolverLibro(parsed?.libroQ || '');
            if (nombre && parsed?.cap) irGoto(nombre, parsed.cap, parsed.verso);
        });
        document.getElementById('texto-biblico')?.addEventListener('click', (event) => {
            const retry = event.target.closest('[data-rv-retry-pasaje]');
            if (!retry) return;
            event.preventDefault();
            const ref = retry.getAttribute('data-rv-retry-pasaje') || '';
            const m = ref.match(/^(.+?)\s+(\d+)$/);
            if (m) {
                pintarPaneles({
                    n: m[1],
                    cap: Number(m[2]),
                    verso: 0,
                    testamento: resolveTestamentoLibro(m[1]),
                });
            } else pintarPaneles(estado());
        });
        montarPerspectivas();
        abrirEstudioTab('comentario');
    }

    function esSuperficieVerso(node) {
        return Boolean(node?.closest?.('.rv-verse-surface, .rv-verse, [data-verse], [data-versiculo], .verse, .bible-verse'));
    }


    function versoNumDesdeRef(ref, fallback) {
        const m = String(ref || '').match(/:(\d+)\s*$/);
        if (m) return Number(m[1]);
        return Number(fallback || 0) || 0;
    }

    function enriquecerPopoverContextual(refHint) {
        const strongBox = document.getElementById('rv-pop-strongs');
        const xrefBox = document.getElementById('rv-pop-xrefs');
        const popVer = document.getElementById('pop-selector-version');
        const popAut = document.getElementById('pop-selector-autor');
        const loc = estado();
        const n = versoNumDesdeRef(refHint || selectedRef, loc.verso);
        const keys = n ? strongsDelVersoSeleccionado(n) : [];
        if (strongBox) {
            strongBox.innerHTML = keys.length
                ? keys.slice(0, 8).map(t => {
                    const glosa = GLOSA[t.strong] ? ` · ${GLOSA[t.strong]}` : '';
                    return `<button type="button" data-strong="${escapeHtml(t.strong)}" data-lemma="${escapeHtml(t.palabra)}" title="${escapeHtml(t.strong)}${escapeHtml(glosa)}">${escapeHtml(t.palabra || t.strong)}<sup>${escapeHtml(t.strong)}</sup></button>`;
                }).join('')
                : `<p class="rv-pop-empty">${n ? 'Sin raíces Strong cargadas para este versículo.' : 'Selecciona un versículo para ver Strong.'}</p>`;
        }
        const ref = referenciaComentario({ ...loc, verso: n || loc.verso }) || selectedRef || `${loc.n} ${loc.cap}`;
        const cruzadas = (window.TSK_LOCAL || {})[String(ref || '').toLowerCase()] || [];
        if (xrefBox) {
            xrefBox.innerHTML = cruzadas.length
                ? cruzadas.slice(0, 6).map(item => {
                    const cita = item.ref || item.reference || '';
                    return `<button type="button" data-ir-ref="${escapeHtml(cita)}" title="${escapeHtml(item.nota || '')}">${escapeHtml(cita)}</button>`;
                }).join('')
                : `<p class="rv-pop-empty">Sin cruces locales catalogadas. Usa Concordancia para ampliar.</p>`;
        }
        if (popVer) popVer.value = versionActiva();
        if (popAut) popAut.value = autorActivo();
    }

    function montarPopover() {
        const pop = document.getElementById('rv-popover');
        if (!pop) return;

        const hide = (force) => {
            if (!force && Date.now() < navLockUntil) return;
            pop.classList.remove('is-on');
        };
        let lastActAt = 0;
        const ejecutarAccion = (event) => {
            const color = event.target.closest('[data-hl]')?.dataset.hl;
            if (color) {
                event.preventDefault();
                event.stopPropagation();
                aplicarResaltado(color);
                return;
            }
            const act = event.target.closest('[data-act]')?.dataset.act;
            if (!act) return;
            const now = Date.now();
            if (now - lastActAt < 280) return;
            lastActAt = now;
            event.preventDefault();
            event.stopPropagation();
            const loc = estado();
            const ref = selectedRef || `${loc.n} ${loc.cap}`;
            if (act === 'copy' && selectedText) {
                const ver = VERSION_LABEL[versionActiva()] || 'RVR1909';
                const payload = `«${selectedText}» — ${ref} (${ver === 'RVR1960' ? 'RVR1909' : ver}) · Éfata RevelatiO`;
                navigator.clipboard?.writeText(payload).catch(() => {});
            }
            if (act === 'card' || act === 'share') {
                const ver = VERSION_LABEL[versionActiva()] || 'RVR1960';
                if (typeof window.openCardGenerator === 'function') {
                    window.openCardGenerator(ref, selectedText, ver);
                } else {
                    abrirEfataCard({
                        text: selectedText,
                        ref,
                        version: ver
                    });
                }
            }
            if (act === 'clear') {
                document.querySelectorAll('#texto-biblico .is-verse-on, #texto-biblico .is-va-active').forEach((n) => {
                    n.classList.remove('is-verse-on', 'is-va-active');
                });
                selectedText = '';
                selectedRef = '';
                hide(true);
            }
            if (act === 'ai') {
                const prompt = selectedText
                    ? `Redacta un tratado exegético denso y académico sobre ${ref}: «${selectedText}». Fundaméntate en léxico Strong cuando aplique, comentarios clásicos (Matthew Henry u otros) y el canon. Prohibido autoayuda o psicología secular. Conduce a la cruz de Cristo y al Espíritu Santo.`
                    : `Redacta un tratado exegético denso sobre ${ref}, con Strong, comentaristas clásicos y canon. Sin autoayuda. Conduce al Padre, a la cruz y al Espíritu.`;
                document.dispatchEvent(new CustomEvent('revelatio:ask-ai', { detail: { prompt, text: selectedText, reference: ref, mode: 'exegesis' } }));
            }
            if (act === 'listen' && selectedText) {
                window.revelatioAudio?.narrar(selectedText);
            }
            if (act === 'xref') {
                window.RV?.studyPanel?.open?.({ tab: 'tsk', ref });
            }
            if (act === 'strong') {
                const n = Number(String(selectedRef || '').split(':').pop()) || loc.verso;
                window.RV?.studyPanel?.open?.({ tab: 'strong', ref });
                const first = strongsDelVersoSeleccionado(n)[0];
                if (first?.strong) {
                    document.dispatchEvent(new CustomEvent('revelatio:open-strong', {
                        detail: { codigo: first.strong, lemma: first.palabra || '' },
                    }));
                }
            }
            if (act === 'note') {
                abrirNota(null, {
                    referencia: ref,
                    texto: selectedText ? `Sobre: «${selectedText.slice(0, 280)}»\n\n` : ''
                });
            }
            if (act === 'study') {
                const n = Number(String(selectedRef || '').split(':').pop()) || Number(loc.verso) || 1;
                entrarModoVersiculo(n);
            }
            if (act === 'oia') {
                const n = Number(String(selectedRef || '').split(':').pop()) || Number(loc.verso) || 0;
                const verseEl = n
                    ? document.querySelector(`#texto-biblico .rv-verse-surface[data-versiculo="${n}"] .rv-verse-text`)
                    : null;
                let texto = selectedText || '';
                if (!texto && verseEl) {
                    const clone = verseEl.cloneNode(true);
                    clone.querySelectorAll('.rv-verse-num, .rv-strong-row, .rv-token-meta, .rv-strong-num, sup')?.forEach?.(node => node.remove());
                    texto = String(clone.textContent || '').replace(/\s+/g, ' ').trim();
                }
                const ref = selectedRef || `${loc.n} ${loc.cap}${n ? `:${n}` : ''}`;
                window.RV?.ui?.startOIA?.({
                    ref,
                    verseText: texto,
                    tags: window.RV?.ui?.getActiveDoctrinalTags?.() || [],
                });
            }
            if (act === 'notebook') {
                const n = Number(String(selectedRef || '').split(':').pop()) || Number(loc.verso) || 0;
                const verseEl = n
                    ? document.querySelector(`#texto-biblico .rv-verse-surface[data-versiculo="${n}"] .rv-verse-text`)
                    : null;
                const texto = selectedText
                    || (verseEl ? String(verseEl.textContent || '').replace(/\s+/g, ' ').trim() : '');
                enviarAlCuaderno({
                    texto: texto || `Referencia marcada: ${ref}`,
                    referencia: ref,
                    tipo: 'nota',
                    source: 'lector',
                });
                document.getElementById('abrir-cuaderno')?.click();
            }
            if (act !== 'copy') hide(true);
        };
        const place = (rect) => {
            if (!rect || (!rect.width && !rect.height)) return;
            pop.classList.add('is-on');
            try { enriquecerPopoverContextual(selectedRef); } catch { /* ignore */ }
            const layout = () => {
                const pad = 8;
                const gap = 8;
                const toolbar = document.querySelector('.rv-toolbar');
                const header = document.querySelector('header.rv-chrome');
                const crumbs = document.getElementById('breadcrumbs');
                const dock = document.getElementById('rv-audio-dock');
                const safeTop = Math.max(
                    pad,
                    (header?.getBoundingClientRect().bottom || 0) + 6,
                    (crumbs?.getBoundingClientRect().bottom || 0) + 6,
                    (toolbar?.getBoundingClientRect().bottom || 0) + 8
                );
                const safeBottom = Math.min(
                    window.innerHeight - pad,
                    (dock?.getBoundingClientRect().top || window.innerHeight) - 8
                );
                const width = pop.offsetWidth || 260;
                const height = pop.offsetHeight || 40;
                const maxLeft = window.innerWidth - width - pad;
                let left = rect.left + rect.width / 2 - width / 2;
                left = Math.max(pad, Math.min(maxLeft, left));
                const above = rect.top - height - gap;
                const below = rect.bottom + gap;
                let top;
                // Preferir ARRIBA del verso para no tapar el texto seleccionado.
                if (above >= safeTop) {
                    top = above;
                } else if (below + height <= safeBottom) {
                    top = below;
                } else {
                    const right = rect.right + gap;
                    const leftSide = rect.left - width - gap;
                    if (right + width <= window.innerWidth - pad) {
                        left = right;
                        top = Math.max(safeTop, Math.min(safeBottom - height, rect.top));
                    } else if (leftSide >= pad) {
                        left = leftSide;
                        top = Math.max(safeTop, Math.min(safeBottom - height, rect.top));
                    } else {
                        top = Math.max(safeTop, Math.min(safeBottom - height, below));
                    }
                }
                pop.style.left = `${Math.round(left)}px`;
                pop.style.top = `${Math.round(top)}px`;
            };
            layout();
            requestAnimationFrame(layout);
        };
        const captureFromSelection = () => {
            const sel = window.getSelection();
            const text = sel?.toString?.().trim() || '';
            if (!sel || sel.isCollapsed || text.length < 2) return false;
            const node = sel.anchorNode?.nodeType === 1 ? sel.anchorNode : sel.anchorNode?.parentElement;
            if (!esSuperficieVerso(node) && !node?.closest?.('#texto-biblico')) return false;
            selectedText = text;
            savedRange = sel.getRangeAt(0).cloneRange();
            selectedRef = node?.closest?.('[data-reference], [data-verse], [data-versiculo]')?.dataset?.reference
                || `${estado().n} ${estado().cap}`;
            place(sel.getRangeAt(0).getBoundingClientRect());
            return true;
        };
        const captureFromVerse = (verse) => {
            if (!verse) return;
            const clone = verse.querySelector('.rv-verse-text')?.cloneNode(true);
            clone?.querySelectorAll('.rv-verse-num, .rv-strong-row, .rv-token-meta')?.forEach(node => node.remove());
            const body = clone?.textContent || verse.querySelector('.rv-verse-text')?.textContent || verse.textContent;
            selectedText = String(body || '').replace(/\s+/g, ' ').trim();
            selectedRef = verse.dataset.reference || `${estado().n} ${estado().cap}:${verse.dataset.versiculo || ''}`.replace(/:$/, '');
            savedRange = document.createRange();
            try {
                const textNode = verse.querySelector('.rv-verse-text') || verse;
                savedRange.selectNodeContents(textNode);
            } catch { savedRange = null; }
            document.querySelectorAll('.rv-verse-surface.is-verse-on, .rv-verse.is-verse-on').forEach(el => {
                if (el !== verse) el.classList.remove('is-verse-on');
            });
            verse.classList.add('is-verse-on');
            navLockUntil = Date.now() + 280;
            place(verse.getBoundingClientRect());
            window.syncStudyPanelToVerse?.(selectedRef, selectedText);
        };

        if (!window.__RV_POP_SELECTS__) {
            window.__RV_POP_SELECTS__ = true;
            const syncFromPop = (kind) => {
                if (kind === 'version') {
                    const v = document.getElementById('pop-selector-version')?.value;
                    const main = document.getElementById('selector-version');
                    if (v && main) {
                        main.value = v;
                        main.dispatchEvent(new Event('change', { bubbles: true }));
                    }
                }
                if (kind === 'autor') {
                    const a = document.getElementById('pop-selector-autor')?.value;
                    const main = document.getElementById('selector-autor');
                    if (a && main) {
                        main.value = a;
                        main.dispatchEvent(new Event('change', { bubbles: true }));
                    }
                }
            };
            document.getElementById('pop-selector-version')?.addEventListener('change', () => syncFromPop('version'));
            document.getElementById('pop-selector-autor')?.addEventListener('change', () => syncFromPop('autor'));
            document.getElementById('rv-pop-xrefs')?.addEventListener('click', (event) => {
                const btn = event.target.closest('[data-ir-ref]');
                if (!btn?.dataset.irRef) return;
                event.preventDefault();
                const parsed = parseGoto(btn.dataset.irRef);
                const nombre = resolverLibro(parsed?.libroQ || '');
                if (nombre && parsed?.cap) irGoto(nombre, parsed.cap, parsed.verso);
            });
        }

        mostrarMenuVerso = captureFromVerse;
        document.addEventListener('mouseup', () => setTimeout(() => { captureFromSelection(); }, 10));
        document.addEventListener('touchend', () => setTimeout(() => { captureFromSelection(); }, 40), { passive: true });
        const toggleVerse = (verse) => {
            if (!verse) return;
            const loc = estado();
            const n = Number(verse.dataset.versiculo || 0);
            if (verse.classList.contains('is-verse-on') && pop.classList.contains('is-on')) {
                verse.classList.remove('is-verse-on');
                hide(true);
                window.__revelatioLibroActivo = { ...loc, verso: 0 };
                refrescarComentario({ ...loc, verso: 0 });
                refrescarConcordancia({ ...loc, verso: 0 });
                return;
            }
            captureFromVerse(verse);
            if (n) {
                window.__revelatioLibroActivo = { ...loc, verso: n };
                refrescarComentario({ ...loc, verso: n });
                refrescarConcordancia({ ...loc, verso: n });
                refrescarPerspectivas({ ...loc, verso: n });
            }
        };
        document.addEventListener('click', event => {
            if (event.target.closest('#rv-popover, #indice-versiculos, [data-strong], button, a, select, label, input, textarea')) return;
            const verse = event.target.closest('.rv-verse-surface, .rv-verse, [data-verse], [data-versiculo], .verse, .bible-verse');
            if (!verse || verse.closest('#indice-versiculos, #rv-popover')) return;
            event.stopPropagation();
            const sel = window.getSelection();
            if (sel && !sel.isCollapsed && sel.toString().trim().length > 1) return;
            toggleVerse(verse);
        });
        document.addEventListener('keydown', event => {
            if (event.key !== 'Enter' && event.key !== ' ') return;
            const verse = event.target.closest?.('.rv-verse-surface, .rv-verse, [data-verse], [data-versiculo]');
            if (!verse || verse.closest('#indice-versiculos')) return;
            event.preventDefault();
            toggleVerse(verse);
        });
        document.getElementById('indice-versiculos')?.addEventListener('click', event => {
            const btn = event.target.closest('[data-ir-verso]');
            if (!btn) return;
            entrarModoVersiculo(Number(btn.dataset.irVerso));
        });
        document.addEventListener('dblclick', event => {
            const verse = event.target.closest?.('.rv-verse-surface[data-versiculo]');
            if (!verse || verse.closest('#indice-versiculos')) return;
            const n = Number(verse.dataset.versiculo);
            if (n) entrarModoVersiculo(n);
        });
        document.addEventListener('pointerdown', event => {
            if (pop.contains(event.target)) return;
            if (event.target.closest?.('#rv-audio-dock, #btn-asistente-ia, #panel-asistente-ia, #modulo-marginnote')) return;
            if (esSuperficieVerso(event.target)) return;
            hide(true);
        });
        document.addEventListener('keydown', event => { if (event.key === 'Escape') hide(true); });
        const onScroll = () => {
            if (Date.now() < navLockUntil) {
                const on = document.querySelector('.rv-verse-surface.is-verse-on, .rv-verse.is-verse-on');
                if (on && pop.classList.contains('is-on')) place(on.getBoundingClientRect());
                return;
            }
            hide(true);
        };
        document.querySelectorAll('.canon-scroll').forEach(el => el.addEventListener('scroll', onScroll, { passive: true }));
        window.addEventListener('scroll', onScroll, { passive: true });

        pop.addEventListener('pointerdown', event => {
            event.preventDefault();
            event.stopPropagation();
        });
        pop.addEventListener('pointerup', ejecutarAccion);
        pop.addEventListener('click', ejecutarAccion);
        document.getElementById('cerrar-nota')?.addEventListener('click', () => {
            document.getElementById('modulo-marginnote')?.classList.remove('is-open');
        });
    }

    function montarMarginNote() {
        const form = document.getElementById('form-marginnote');
        if (!form) return;
        const autosave = () => {
            const item = guardarNotaFormulario();
            if (!item) {
                setSyncStatus('Guardado en este dispositivo');
                return;
            }
            if (!form['nota-id'].value) form['nota-id'].value = item.id;
        };
        form.nota.addEventListener('input', () => {
            setSyncStatus('Sincronizando', true);
            clearTimeout(autosaveTimer);
            autosaveTimer = setTimeout(autosave, 700);
        });
        form.referencia.addEventListener('change', autosave);
        form.permanente.addEventListener('change', autosave);
        form.addEventListener('submit', event => {
            event.preventDefault();
            autosave();
            document.getElementById('modulo-marginnote')?.classList.remove('is-open');
        });
        document.addEventListener('add-margin-note', event => {
            if (event.detail?.text) upsertItem({ tipo: 'nota', referencia: `${estado().n} ${estado().cap}`, texto: event.detail.text });
        });
    }

    function montarCuaderno() {
        const modal = document.getElementById('modulo-cuaderno');
        const abrir = document.getElementById('abrir-cuaderno');
        if (!modal || !abrir) return;
        const setOpen = (on) => {
            modal.classList.toggle('is-open', on);
            modal.setAttribute('aria-hidden', String(!on));
            abrir.classList.toggle('is-on', on);
            if (on) {
                pintarCuota();
                pintarListaCuaderno();
                hidratarDesdeSupabase();
            }
        };
        abrir.addEventListener('click', () => setOpen(!modal.classList.contains('is-open')));
        document.getElementById('cerrar-cuaderno')?.addEventListener('click', () => setOpen(false));
        modal.querySelector('[data-cuaderno-close]')?.addEventListener('click', () => setOpen(false));
        document.getElementById('cuaderno-imprimir')?.addEventListener('click', () => imprimirCuaderno());
        document.getElementById('cuaderno-compartir')?.addEventListener('click', () => {
            compartirCuaderno().catch(() => setSyncStatus('No se pudo compartir'));
        });
        document.getElementById('filtros-cuaderno')?.addEventListener('click', event => {
            const tab = event.target.closest('[data-filtro]');
            if (!tab) return;
            cuadernoFiltro = tab.dataset.filtro;
            if (cuadernoFiltro === 'todas') cuadernoTagFiltro = '';
            document.querySelectorAll('#filtros-cuaderno [data-filtro]').forEach(el => el.classList.toggle('is-on', el === tab));
            pintarListaCuaderno();
        });
        document.addEventListener('revelatio:cuaderno-refresh', (event) => {
            const filtro = event.detail?.filtro;
            if (filtro) {
                cuadernoFiltro = filtro;
                document.querySelectorAll('#filtros-cuaderno [data-filtro]').forEach((el) => {
                    el.classList.toggle('is-on', el.dataset.filtro === filtro);
                });
            }
            try { leerCuaderno(); } catch { /* ignore */ }
            pintarListaCuaderno();
            pintarCuota(leerCuaderno());
        });
        document.addEventListener('revelatio:cuaderno-add', () => {
            try { leerCuaderno(); } catch { /* ignore */ }
            pintarListaCuaderno();
            pintarCuota(leerCuaderno());
        });
        document.getElementById('lista-cuaderno')?.addEventListener('click', event => {
            const tagBtn = event.target.closest('[data-cuaderno-tag]');
            if (tagBtn) {
                event.preventDefault();
                const tag = tagBtn.getAttribute('data-cuaderno-tag');
                cuadernoTagFiltro = cuadernoTagFiltro === tag ? '' : tag;
                pintarListaCuaderno();
                setSyncStatus(cuadernoTagFiltro
                    ? `Filtro doctrinal: ${etiquetaDoctrina(cuadernoTagFiltro)}`
                    : 'Filtro doctrinal quitado');
                return;
            }
            const card = event.target.closest('[data-item]');
            if (!card) return;
            const store = leerCuaderno();
            const item = store.items.find(x => x.id === card.dataset.item);
            if (!item) return;
            const act = event.target.closest('[data-cuaderno-act]')?.dataset.cuadernoAct;
            if (act === 'archivar') {
                upsertItem({ id: item.id, archivo: 'permanente' });
                return;
            }
            if (act === 'borrar') {
                store.items = store.items.filter(x => x.id !== item.id);
                escribirCuaderno(store);
                pintarCuota(store);
                pintarListaCuaderno();
                if (item.supabaseId) {
                    encolarSync(async () => {
                        const user = await usuarioActual();
                        if (user) await window.supabaseClient.from('user_bible_actions').delete().eq('id', item.supabaseId).eq('user_id', user.id);
                    });
                }
                return;
            }
            if (act === 'abrir' || !act) {
                if (item.tipo === 'nota' || item.tipo === 'estudio' || item.tipo === 'sermon') abrirNota(item);
            }
        });
        document.getElementById('backup-md')?.addEventListener('click', () => descargarBackup('md'));
        document.getElementById('backup-pdf')?.addEventListener('click', () => descargarBackup('pdf'));
        document.getElementById('backup-md-always')?.addEventListener('click', () => descargarBackup('md'));
        document.getElementById('backup-pdf-always')?.addEventListener('click', () => descargarBackup('pdf'));
        modal.addEventListener('click', event => { if (event.target === modal) setOpen(false); });
        pintarCuota();
        window.supabaseClient?.auth?.onAuthStateChange?.((event) => {
            if (event === 'SIGNED_IN' || event === 'INITIAL_SESSION') hidratarDesdeSupabase();
        });
        hidratarDesdeSupabase();
    }

    async function leerStream(res, onChunk) {
        if (!res.body) {
            const json = await res.json().catch(() => ({}));
            onChunk(json.error || json.text || '');
            return;
        }
        const reader = res.body.getReader();
        const dec = new TextDecoder();
        while (true) {
            const { done, value } = await reader.read();
            if (done) break;
            onChunk(dec.decode(value, { stream: true }));
        }
    }

    function montarSermon() {
        const form = document.getElementById('form-sermon');
        const out = document.getElementById('salida-sermon');
        if (!form || !out) return;
        form.addEventListener('submit', async event => {
            event.preventDefault();
            out.textContent = 'Consultando las Escrituras…';
            try {
                const res = await fetch('/api/sermon', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({ pasaje: form.pasaje.value, tipo: form.tipo.value, consulta: form.consulta.value })
                });
                out.textContent = '';
                if (!res.ok) { out.textContent = 'No se pudo generar.'; return; }
                await leerStream(res, chunk => { out.textContent += chunk; });
                const cuerpo = String(out.textContent || '').trim();
                if (cuerpo) {
                    upsertItem({
                        tipo: 'sermon',
                        referencia: form.pasaje.value || `${estado().n} ${estado().cap}`,
                        titulo: 'Sermón',
                        texto: cuerpo,
                        archivo: 'temporal'
                    });
                }
            } catch {
                out.textContent = 'Sin conexión al motor.';
            }
        });
    }

    function montarAsistente() {
        if (window.RV?.ai?.mountPermanentAssistant) {
            window.RV.ai.mountPermanentAssistant({
                onSendToNotebook: (entry) => {
                    enviarAlCuaderno(entry || {});
                    document.getElementById('abrir-cuaderno')?.click();
                },
            });
            return;
        }
        // Fallback mínimo si ai-engine no cargó
        const fab = document.getElementById('btn-asistente-ia');
        const panel = document.getElementById('panel-asistente-ia');
        if (!fab || !panel) return;
        fab.style.cssText = 'position:fixed !important;z-index:999999;right:1.15rem;bottom:1.15rem;display:inline-flex';
        fab.addEventListener('click', () => panel.classList.toggle('is-open'));
    }

    function montarFlujosInductivos() {
        const launchOia = () => {
            const loc = estado();
            const n = Number(loc.verso || String(selectedRef || '').split(':').pop()) || 0;
            const verseEl = n
                ? document.querySelector(`#texto-biblico .rv-verse-surface[data-versiculo="${n}"] .rv-verse-text`)
                : null;
            let texto = selectedText || '';
            if (!texto && verseEl) {
                const clone = verseEl.cloneNode(true);
                clone.querySelectorAll('.rv-verse-num, .rv-strong-row, .rv-token-meta, .rv-strong-num, sup')?.forEach?.(node => node.remove());
                texto = String(clone.textContent || '').replace(/\s+/g, ' ').trim();
            }
            if (!texto) {
                const hero = document.getElementById('rv-verse-study-hero');
                if (hero) {
                    const clone = hero.cloneNode(true);
                    clone.querySelectorAll('sup, .rv-verse-num')?.forEach?.(node => node.remove());
                    texto = String(clone.textContent || '').replace(/\s+/g, ' ').trim();
                }
            }
            const ref = selectedRef
                || document.getElementById('rv-verse-study-ref')?.textContent
                || `${loc.n} ${loc.cap}${n ? `:${n}` : ''}`;
            window.RV?.ui?.startOIA?.({
                ref: String(ref || '').trim(),
                verseText: texto,
                tags: window.RV?.ui?.getActiveDoctrinalTags?.() || [],
            });
        };

        document.getElementById('btn-oia-verse')?.addEventListener('click', (event) => {
            event.preventDefault();
            launchOia();
        });

        document.addEventListener('revelatio:oia-save', (event) => {
            const d = event.detail || {};
            const item = enviarAlCuaderno({
                texto: d.texto || '',
                referencia: d.ref || '',
                titulo: d.titulo || `O-I-A · ${d.ref || ''}`,
                tipo: 'estudio_oia',
                source: 'oia',
                tags: d.tags || [],
                oia: {
                    observacion: d.observacion || '',
                    interpretacion: d.interpretacion || '',
                    aplicacion: d.aplicacion || '',
                },
            });
            if (item) {
                window.RV?.ui?.closeOIA?.();
                setSyncStatus('Estudio O-I-A guardado en el Cuaderno');
                pintarListaCuaderno();
            }
        });

        document.addEventListener('revelatio:doctrine-filter', (event) => {
            const tag = event.detail?.tag || '';
            if (!tag) return;
            cuadernoTagFiltro = tag;
            cuadernoFiltro = 'todas';
            document.querySelectorAll('#filtros-cuaderno [data-filtro]').forEach((el) => {
                el.classList.toggle('is-on', el.dataset.filtro === 'todas');
            });
            window.RV?.ui?.abrirCuaderno?.();
            pintarListaCuaderno();
            setSyncStatus(`Filtro doctrinal: ${etiquetaDoctrina(tag)} (próximamente completo)`);
        });

        try {
            window.RV?.ui?.renderDoctrinalTags?.('#rv-doctrine-tags');
        } catch { /* ignore */ }
    }

    function montarAudio() {
        // Motor de doble pista vive en js/audio-engine.js
        try {
            if (window.RV?.audio?.mount) window.RV.audio.mount();
            else if (window.RV?.audio?.create) {
                const eng = window.RV.audio.create();
                eng.mount?.();
                window.revelatioAudio = eng;
            }
        } catch (err) {
            console.warn("[revelatio] audio-engine", err);
        }
        // Re-wire controles legacy del panel experiencia si existen
        document.getElementById("narrar-capitulo")?.addEventListener("click", () => {
            document.querySelector('[data-listen="chapter"]')?.click();
        });
        document.getElementById("pausa-narracion")?.addEventListener("click", () => {
            window.revelatioAudio?.pausarVoz?.() || window.RV?.audio?.pauseVoice?.();
        });
        document.getElementById("toggle-musica")?.addEventListener("change", (e) => {
            if (e.target.checked) window.revelatioAudio?.reproducirMusica?.();
            else window.revelatioAudio?.detenerMusica?.();
        });
        const volM = document.getElementById("vol-musica");
        const volV = document.getElementById("vol-voz");
        volM?.addEventListener("input", () => {
            const dock = document.getElementById("dock-vol-musica");
            if (dock) { dock.value = volM.value; dock.dispatchEvent(new Event("input")); }
        });
        volV?.addEventListener("input", () => {
            const dock = document.getElementById("dock-vol-voz");
            if (dock) { dock.value = volV.value; dock.dispatchEvent(new Event("input")); }
        });
    }
    function montarSelectores() {
        const version = document.getElementById('selector-version');
        const autor = document.getElementById('selector-autor');
        const VERSIONES_FIJAS = [
            { key: 'rv1960', etiqueta: 'RVR1960' },
            { key: 'kjv', etiqueta: 'KJV' },
            { key: 'tla', etiqueta: 'TLA' },
            { key: 'dhh', etiqueta: 'DHH' },
            { key: 'septuaginta', etiqueta: 'Septuaginta (Rahlfs)' }
        ];
        if (version) {
            version.innerHTML = VERSIONES_FIJAS.map(v =>
                `<option value="${v.key}">${v.etiqueta}</option>`
            ).join('');
            const raw = localStorage.getItem('revelatio_version') || 'rv1960';
            const savedV = VERSIONES_FIJAS.some(v => v.key === raw)
                ? raw
                : (raw === 'lxx' ? 'septuaginta' : 'rv1960');
            version.value = savedV;
        }
        if (autor) {
            const lista = (window.REVELATIO_AUTORES || []).filter(a => a?.key);
            const extras = [
                { key: 'charles-spurgeon', etiqueta: 'C. H. Spurgeon' },
                { key: 'matthew-henry', etiqueta: 'Matthew Henry' },
                { key: 'juan-calvino', etiqueta: 'Juan Calvino' },
                { key: 'jamieson-fausset-brown', etiqueta: 'Jamieson-Fausset-Brown' },
                { key: 'john-gill', etiqueta: 'John Gill' },
            ];
            const seen = new Set();
            const merged = [...lista, ...extras].filter((a) => {
                if (!a?.key || seen.has(a.key)) return false;
                seen.add(a.key);
                return a.key !== 'albert-barnes';
            });
            if (merged.length) {
                autor.innerHTML = merged.map(a =>
                    `<option value="${escapeHtml(a.key)}">${escapeHtml(a.etiqueta || a.key)}</option>`
                ).join('');
            }
            const savedA = localStorage.getItem('revelatio_autor') || 'charles-spurgeon';
            if ([...autor.options].some(o => o.value === savedA)) autor.value = savedA;
            else if (autor.options.length) autor.value = autor.options[0].value;
        }
        const recargar = () => pintarPaneles(estado());
        version?.addEventListener('change', recargar);
        autor?.addEventListener('change', recargar);
    }

    const RACHA_KEY = 'revelatio_racha_v1';
    let devoDestino = { libro: 'Romanos', cap: 12, verso: 1 };

    function diaISO() {
        return new Date().toISOString().slice(0, 10);
    }

    function leerRacha() {
        return parseJson(localStorage.getItem(RACHA_KEY), { count: 0, last: '', max: 0 });
    }

    function tocarRacha() {
        const today = diaISO();
        const data = leerRacha();
        if (data.last === today) return data;
        const yest = new Date(Date.now() - 86400000).toISOString().slice(0, 10);
        data.count = data.last === yest ? (Number(data.count) || 0) + 1 : 1;
        data.last = today;
        data.max = Math.max(Number(data.max) || 0, data.count);
        try { localStorage.setItem(RACHA_KEY, JSON.stringify(data)); } catch { /* cuota */ }
        return data;
    }

    function pintarRacha(data) {
        const d = data || leerRacha();
        const yest = new Date(Date.now() - 86400000).toISOString().slice(0, 10);
        let shown = 0;
        if (d.last === diaISO() || d.last === yest) shown = Number(d.count) || 0;
        const mark = document.getElementById('racha-marca');
        const copy = document.getElementById('racha-copy');
        if (mark) mark.textContent = String(shown);
        if (!copy) return;
        if (!shown) copy.textContent = 'Hoy puede ser el primer día. Entra al aposento y deja una marca.';
        else if (d.last === diaISO()) copy.textContent = `${shown} día${shown === 1 ? '' : 's'} consecutivos. La constancia no es mérito: es hábito santo.`;
        else copy.textContent = `${shown} día${shown === 1 ? '' : 's'} en curso. Entra hoy para no romper la racha.`;
    }

    function pintarHomeNotas() {
        const root = document.getElementById('home-notas');
        if (!root) return;
        const items = (leerCuaderno().items || [])
            .slice()
            .sort((a, b) => String(b.updatedAt || b.createdAt || '').localeCompare(String(a.updatedAt || a.createdAt || '')))
            .slice(0, 3);
        if (!items.length) {
            root.innerHTML = `<p>Aún no hay marcas. Entra al aposento, subraya un versículo o escribe una nota.</p>`;
            return;
        }
        root.innerHTML = items.map(item => `
            <button type="button" class="rv-note-mini" data-ir="nota" data-ref="${escapeHtml(item.referencia || '')}">
                <b>${escapeHtml(item.referencia || etiquetaTipo(item.tipo))}</b>
                <span>${escapeHtml(String(item.texto || item.titulo || 'Nota de estudio').slice(0, 110))}</span>
            </button>`).join('');
    }

    async function fetchJsonLocal(rutas) {
        for (const ruta of rutas) {
            try {
                const res = await fetch(ruta, { cache: 'force-cache' });
                if (res.ok) return await res.json();
            } catch { /* siguiente */ }
        }
        return null;
    }

    async function pintarDevocionalHome() {
        const refEl = document.getElementById('devo-ref');
        const verseEl = document.getElementById('devo-verso');
        const reflexEl = document.getElementById('devo-reflexion');
        const autorEl = document.getElementById('devo-autor');
        let n = (Math.floor(Date.now() / 86400000) % 21) + 1;
        let texto = '';
        let reflexion = '';
        try {
            const [cap, com] = await Promise.all([
                fetchJsonLocal(['data/romanos-12.json', '/data/romanos-12.json']),
                fetchJsonLocal(['data/comentarios.json', '/data/comentarios.json'])
            ]);
            const versos = Array.isArray(cap?.versos) ? cap.versos : [];
            if (versos.length) n = (Math.floor(Date.now() / 86400000) % versos.length) + 1;
            const v = versos.find(x => Number(x.n) === n) || versos[0];
            texto = String(v?.rv1960 || v?.texto || '').trim();
            const henry = com?.pasajes?.romanos_12?.matthew_henry || {};
            reflexion = String(henry[String(n)] || henry.capitulo || '').trim();
        } catch { /* fallback local */ }
        if (!texto) {
            texto = 'Así que, hermanos, os ruego por las misericordias de Dios, que presentéis vuestros cuerpos en sacrificio vivo, santo, agradable á Dios, que es vuestro racional culto.';
            n = 1;
        }
        if (!reflexion) {
            reflexion = 'El apóstol ruega por las misericordias de Dios: el cuerpo se presenta vivo, santo y agradable. Ese es el culto racional: la vida entera sobre el altar, no un rito de una hora.';
        }
        if (refEl) refEl.textContent = `Romanos 12:${n}`;
        if (verseEl) verseEl.textContent = texto;
        if (reflexEl) reflexEl.textContent = reflexion;
        if (autorEl) autorEl.textContent = 'Matthew Henry · exposición histórica';
        devoDestino = { libro: 'Romanos', cap: 12, verso: n };
    }

    function esRutaLectura() {
        const path = String(location.pathname || '').replace(/\/+$/, '') || '/';
        const hash = String(location.hash || '').replace(/^#/, '').toLowerCase();
        if (hash === 'santuario' || hash === 'lectura' || hash.startsWith('lectura/') || hash.startsWith('lectura?')) return true;
        return /\/lectura$/i.test(path);
    }

    function destinoDesdeQuery() {
        const params = new URLSearchParams(location.search || '');
        const hash = String(location.hash || '').replace(/^#/, '');
        const hashQ = hash.includes('?') ? hash.slice(hash.indexOf('?') + 1) : '';
        const hashParams = new URLSearchParams(hashQ);
        const get = (k) => hashParams.get(k) || params.get(k);
        const ir = get('ir');
        const libro = get('libro');
        const cap = Number(get('cap')) || 0;
        const verso = get('verso') ? Number(get('verso')) : null;
        // Ruta corta: #lectura/Génesis/1/1
        const parts = hash.split('?')[0].split('/').filter(Boolean);
        if (parts[0] === 'lectura' && parts[1]) {
            return {
                libro: decodeURIComponent(parts[1]),
                cap: Number(parts[2]) || 1,
                verso: parts[3] ? Number(parts[3]) : null,
                canon: ir === 'canon',
                cuaderno: ir === 'cuaderno',
            };
        }
        if (ir === 'canon') return { libro: libro || estado()?.n || 'Romanos', cap: cap || estado()?.cap || 1, canon: true };
        if (ir === 'cuaderno') return { libro: libro || estado()?.n || 'Romanos', cap: cap || estado()?.cap || 1, cuaderno: true };
        if (ir === 'estudio' || ir === 'estudio-mes' || ir === 'santuario') {
            return { libro: estado()?.n || 'Romanos', cap: estado()?.cap || 1 };
        }
        if (ir === 'devocional') return { ...devoDestino };
        if (libro) return { libro, cap: cap || 1, verso };
        return { libro: estado()?.n || 'Romanos', cap: estado()?.cap || 12 };
    }

    function urlLectura(opts = {}) {
        const ir = opts.canon ? 'canon' : opts.cuaderno ? 'cuaderno' : opts.ir || '';
        const libro = encodeURIComponent(opts.libro || estado()?.n || 'Romanos');
        const capNum = Number(opts.cap);
        const cap = Number.isFinite(capNum) && capNum > 0 ? capNum : 1;
        const verso = opts.verso ? `/${Number(opts.verso)}` : '';
        const q = ir ? `?ir=${encodeURIComponent(ir)}` : '';
        return `#lectura/${libro}/${cap}${verso}${q}`;
    }

    function abrirCanonPanel() {
        const panel = document.getElementById('panel-canon');
        const btn = document.getElementById('btn-canon');
        if (panel && btn && window.innerWidth < 1024 && !panel.classList.contains('is-open')) btn.click();
        else if (panel && window.innerWidth < 1024) panel.classList.add('is-open');
        document.getElementById('buscador-canon')?.focus();
    }

    function volverHome() {
        cerrarAcompanamiento();
        try { window.RV?.router?.show?.('dashboard'); } catch (e) { /* ignore */ }
        document.getElementById('rv-home')?.classList.remove('is-hidden');
        document.body.classList.remove('is-santuario', 'is-acompanamiento', 'visor-active');
        try { history.replaceState(null, '', '#inicio'); } catch { /* sin history */ }
        pintarRacha();
        pintarHomeNotas();
        montarPuertasMaestras();
        document.getElementById('rv-home')?.scrollTo({ top: 0, behavior: 'smooth' });
    }

    function cerrarSplashForzado() {
        const splash = document.getElementById('rv-splash');
        if (splash) {
            splash.classList.add('is-out', 'is-gone');
            splash.style.pointerEvents = 'none';
            splash.setAttribute('aria-hidden', 'true');
            splash.removeAttribute('tabindex');
        }
        document.body.classList.remove('rv-splash-blocking');
        try { window.revelatioForzarUmbral?.(); } catch { /* ignore */ }
    }


    function cerrarAcompanamiento() {
        document.body.classList.remove('is-acompanamiento');
        const panel = document.getElementById('rv-acompanamiento');
        if (panel) panel.hidden = true;
    }

    function entrarAcompanamiento(opts = {}) {
        cerrarSplashForzado();
        document.body.classList.remove('is-santuario', 'visor-active');
        try { window.RV?.router?.show?.('acompanamiento'); } catch (e) { /* ignore */ }
        try { window.RV?.navigation?.onAcompReady?.(); } catch (e) { /* ignore */ }
        document.getElementById('rv-home')?.classList.add('is-hidden');
        document.body.classList.add('is-acompanamiento');
        const panel = document.getElementById('rv-acompanamiento');
        if (panel) panel.hidden = false;
        try {
            history.pushState({ revelatio: 'acompanamiento' }, '', `${location.pathname}${location.search || ''}#acompanamiento`);
        } catch { /* ignore */ }
        setTimeout(() => document.getElementById('acomp-mensaje')?.focus?.(), 80);
        if (opts.iaPrompt) {
            const ta = document.getElementById('acomp-mensaje');
            if (ta) ta.value = opts.iaPrompt;
        }
    }

    async function enviarAcompanamiento(mensaje) {
        const out = document.getElementById('rv-acomp-respuesta');
        const clean = String(mensaje || '').trim();
        if (!clean || !out) return;
        out.textContent = 'RevelatiO IA medita tu consulta bajo la Escritura…';
        try {
            if (window.RV?.ai?.chatGlobal) {
                const raw = await window.RV.ai.chatGlobal({
                    message: clean,
                    context: {
                        module: 'AcompanamientoMinisterial',
                        reference: 'Consejería pastoral · restauración del alma',
                    },
                    history: [],
                });
                out.textContent = String(raw || '').trim() || 'No pude completar la orientación ahora. Vuelve a la Escritura en oración.';
                return;
            }
            const token = await tokenAuth();
            const headers = { 'Content-Type': 'application/json', Accept: 'text/plain, application/json' };
            if (token) headers.Authorization = `Bearer ${token}`;
            const res = await fetch('/api/chat-global', {
                method: 'POST',
                headers,
                body: JSON.stringify({
                    message: clean,
                    context: {
                        module: 'AcompanamientoMinisterial',
                        reference: 'Consejería pastoral · restauración del alma',
                    },
                    history: [],
                }),
            });
            let raw = '';
            if (res.ok && res.body && typeof res.body.getReader === 'function' && window.revelatioLectura?.leerStream) {
                raw = await window.revelatioLectura.leerStream(res);
            } else if (res.ok) {
                const ctype = (res.headers.get('content-type') || '').toLowerCase();
                if (ctype.includes('application/json')) {
                    const json = await res.json();
                    raw = json.text || json.error || '';
                } else {
                    raw = await res.text();
                }
            }
            if (!String(raw || '').trim()) {
                raw = [
                    '### 1. La Palabra y el Léxico Original',
                    '«Venid a mí todos los que estáis trabajados y cargados, y yo os haré descansar» (Mateo 11:28). El descanso que ofrece Cristo no es técnica emocional: es venida a Él.',
                    '',
                    '### 2. Raíz Histórico-Exegética',
                    'El llamado de Jesús confronta la religión de carga y la autosuficiencia. El remedio no es “creerte capaz”, sino rendirte al yugo suave del Señor.',
                    '',
                    '### 3. Corazón, Mente y Cruz',
                    'Tu consulta expone un corazón que necesita carne nueva (Ezequiel 36:26). La cruz quita condenación; el Espíritu regenera; la Escritura renueva la mente.',
                    '',
                    '### 4. Oración y Obediencia',
                    'Padre, quebranta mi corazón de piedra y dame un corazón de carne por la sangre de Jesús. Espíritu Santo, guíame a la Palabra y a la iglesia local. Amén.',
                    'Paso: abre hoy un salmo de lamento o confianza y confiesa a Cristo tu carga ante un hermano maduro o tu pastor.',
                ].join('\n');
            }
            out.textContent = String(raw).trim();
        } catch {
            out.textContent = 'No pude completar la orientación ahora. Vuelve a la Escritura en oración y, si puedes, reintenta en un momento. Cristo permanece fiel.';
        }
    }

    function montarHubNavegacion() {
        if (window.__RV_HUB_WIRED__) return;
        window.__RV_HUB_WIRED__ = true;
        document.addEventListener('click', (event) => {
            const btn = event.target?.closest?.('[data-hub]');
            if (!btn) return;
            const hub = btn.getAttribute('data-hub');
            if (!hub) return;
            event.preventDefault();
            event.stopPropagation();
            // Solo retorno al Dashboard desde el lateral de estudio (y atajos internos de canon).
            if (hub === 'dashboard') {
                volverHome();
                return;
            }
            if (hub === 'capitulos' || hub === 'canon') {
                if (!document.body.classList.contains('is-santuario')) {
                    entrarSantuario({ libro: 'Romanos', cap: 12, canon: true });
                } else {
                    abrirCanonPanel();
                }
                return;
            }
            if (hub === 'estudio') {
                entrarSantuario({ libro: 'Romanos', cap: 12, perspectivas: true, canon: true });
            }
        }, true);
    }

    function montarAcompanamiento() {
        if (window.__RV_ACOMP_WIRED__) return;
        window.__RV_ACOMP_WIRED__ = true;
        document.getElementById('btn-volver-acomp')?.addEventListener('click', () => {
            cerrarAcompanamiento();
            volverHome();
        });
        document.getElementById('form-acompanamiento')?.addEventListener('submit', (event) => {
            event.preventDefault();
            event.stopPropagation();
            const mensaje = String(event.target.mensaje?.value || '').trim();
            if (mensaje.length < 2) return;
            enviarAcompanamiento(mensaje);
        });
    }

    let navStamp = 0;
    function entrarSantuario(opts = {}) {
        // Ingreso inmediato: sesión opcional (guest + perfil si existe).
        if (opts.acompanamiento) {
            entrarAcompanamiento(opts);
            return;
        }
        const now = Date.now();
        if (now - navStamp < 220) return;
        navStamp = now;
        cerrarAcompanamiento();
        cerrarSplashForzado();
        try { window.RV?.router?.show?.('estudio'); } catch (e) { /* ignore */ }
        try { window.RV?.navigation?.onEstudioReady?.(); } catch (e) { /* ignore */ }
        document.getElementById('rv-home')?.classList.add('is-hidden');
        document.body.classList.add('is-santuario', 'visor-active');
        document.body.classList.remove('is-acompanamiento');
        const capOpt = Number(opts.cap);
        const destino = {
            libro: opts.libro || estado()?.n || 'Romanos',
            cap: Number.isFinite(capOpt) && capOpt > 0 ? capOpt : (opts.libro ? 1 : (Number(estado()?.cap) || 1)),
            verso: opts.verso ? Number(opts.verso) : null,
            canon: Boolean(opts.canon),
            cuaderno: Boolean(opts.cuaderno),
            ir: opts.canon ? 'canon' : opts.cuaderno ? 'cuaderno' : opts.ir || '',
        };
        try {
            const next = urlLectura(destino);
            if (location.hash !== next) history.pushState({ revelatio: 'lectura' }, '', next);
        } catch { /* sin history */ }
        if (sesionActiva()) {
            tocarRacha();
            pintarRacha();
        }
        const libro = destino.libro;
        const cap = destino.cap;
        const verso = destino.verso;
        const abierto = abrirLibro(libro, cap, verso);
        if (!abierto) {
            // Canon aún no montado o nombre raro: abrir lectura igual.
            pintarPaneles({
                n: libro,
                c: 50,
                cap,
                verso,
                testamento: resolveTestamentoLibro(libro),
            });
        }
        const quiereMusica = document.getElementById('entrar-con-musica')?.checked;
        if (!opts.silencio && quiereMusica) window.revelatioAudio?.reproducirMusica?.();
        if (destino.canon || opts.perspectivas) setTimeout(abrirCanonPanel, 60);
        if (destino.cuaderno) setTimeout(() => {
            const modal = document.getElementById('modulo-cuaderno');
            if (modal && !modal.classList.contains('is-open')) document.getElementById('abrir-cuaderno')?.click();
        }, 80);
        if (opts.iaPrompt) {
            setTimeout(() => {
                document.dispatchEvent(new CustomEvent('revelatio:ask-ai', {
                    detail: {
                        prompt: opts.iaPrompt,
                        mode: opts.iaMode === 'vida' ? 'vida' : 'exegesis',
                    },
                }));
            }, 120);
        }
        if (opts.perspectivas) {
            setTimeout(() => abrirEstudioTab('perspectivas'), 160);
        }
        // Hub de estudio: asegurar menú lateral visible en desktop y foco en herramientas.
        setTimeout(() => {
            const side = document.getElementById('panel-canon');
            if (side && window.innerWidth >= 1024) {
                side.classList.add('is-open');
                side.removeAttribute('hidden');
            }
        }, 30);
        setTimeout(() => {
            window.scrollTo(0, 0);
            document.getElementById('texto-biblico')?.scrollIntoView({ behavior: 'smooth', block: 'start' });
        }, 40);
    }

    function destinoDesdeBoton(btn) {
        const ir = btn?.dataset?.ir;
        if (ir === 'acompanamiento') return { acompanamiento: true };
        if (ir === 'renovacion-vida' || ir === 'renovacion') {
            return { renovacionVida: true, iaMode: 'vida', iaPrompt: btn?.dataset?.prompt || '' };
        }
        if (ir === 'estudio-profundo' || ir === 'estudio-mes' || ir === 'santuario') {
            return { libro: 'Romanos', cap: 12, perspectivas: ir === 'estudio-profundo', canon: true, iaMode: 'exegesis' };
        }
        if (ir === 'devocional') return { ...devoDestino };
        if (ir === 'libro') {
            return {
                libro: btn.dataset.libro || 'Romanos',
                cap: Number(btn.dataset.cap) || 1,
                verso: btn.dataset.verso ? Number(btn.dataset.verso) : null,
            };
        }
        if (ir === 'canon') return { libro: 'Romanos', cap: 12, canon: true };
        if (ir === 'cuaderno') {
            const st = estado();
            return { libro: st.n || 'Romanos', cap: st.cap || 12, cuaderno: true };
        }
        if (ir === 'nota') {
            const parsed = parseGoto(btn.dataset.ref || '');
            const nombre = resolverLibro(parsed?.libroQ || '') || 'Romanos';
            return { libro: nombre, cap: parsed?.cap || 12, verso: parsed?.verso || null };
        }
        return { libro: 'Romanos', cap: 12 };
    }

    function montarSplash() {
        const splash = document.getElementById('rv-splash');
        if (!splash) {
            document.body.classList.remove('rv-splash-blocking');
            return;
        }
        if (esRutaLectura()) {
            cerrarSplashForzado();
            return;
        }
        try {
            if (sessionStorage.getItem('rv_splash_done_v4') === '1' || sessionStorage.getItem('rv_splash_done_v1') === '1') {
                cerrarSplashForzado();
                return;
            }
        } catch { /* ignore */ }
        document.body.classList.add('rv-splash-blocking');
        // Intro sin botón: el cableado vive en index (toque en cualquier parte).
        if (splash.dataset.wired !== '1' && !window.__RV_EXPERIENCIA_WIRED__) {
            splash.dataset.wired = '1';
            const arrancar = (event) => {
                event.preventDefault();
                event.stopPropagation();
                if (window.revelatioBienvenida?.iniciar) window.revelatioBienvenida.iniciar(event);
                else window.revelatioAudio?.iniciarExperiencia?.(true);
            };
            splash.addEventListener('pointerdown', arrancar);
            splash.addEventListener('click', arrancar);
        }
    }

    function abrirPuertaMaestra(dest, event) {
        if (event) {
            event.preventDefault();
            event.stopPropagation();
            if (typeof event.stopImmediatePropagation === 'function') event.stopImmediatePropagation();
        }
        try {
            sessionStorage.setItem('rv_splash_done_v4', '1');
            sessionStorage.setItem('rv_splash_done_v1', '1');
        } catch { /* ignore */ }
        try { window.revelatioForzarUmbral?.(); } catch { /* ignore */ }
        cerrarSplashForzado();
        document.body.classList.remove('rv-splash-blocking');
        const destino = dest && typeof dest === 'object' ? dest : {};
        if (destino.acompanamiento) {
            entrarAcompanamiento(destino);
            return;
        }
        if (destino.renovacionVida) {
            document.body.classList.remove('rv-splash-blocking');
            try { window.RV?.router?.show?.('dashboard'); } catch { /* ignore */ }
            setTimeout(() => {
                document.dispatchEvent(new CustomEvent('revelatio:ask-ai', {
                    detail: {
                        mode: 'vida',
                        prompt: destino.iaPrompt || 'Necesito renovación de la mente ante una crisis o hábito. Guía un Protocolo Vital RevelatiO.',
                    },
                }));
            }, 120);
            return;
        }
        entrarSantuario({
            libro: destino.libro || 'Romanos',
            cap: Number(destino.cap) || 12,
            verso: destino.verso ? Number(destino.verso) : null,
            perspectivas: Boolean(destino.perspectivas),
            canon: destino.canon !== false,
            cuaderno: Boolean(destino.cuaderno),
            iaPrompt: destino.iaPrompt || '',
            iaMode: destino.iaMode || 'exegesis',
            ir: destino.ir || '',
        });
    }

    function montarPuertasMaestras() {
        const manejar = (event) => {
            const btn = event.target?.closest?.('.rv-door[data-ir], #rv-home a[data-ir], #rv-home button[data-ir]');
            if (!btn) return;
            if (btn.hasAttribute('data-ir-verso') || btn.hasAttribute('data-ir-ref')) return;
            if (event.type === 'keydown' && event.key !== 'Enter' && event.key !== ' ') return;
            if (event.type === 'keydown') event.preventDefault();
            abrirPuertaMaestra(destinoDesdeBoton(btn), event);
        };

        // Delegación global (capture): sobrevive a re-renders y no depende de #rv-home únicamente.
        if (!window.__RV_DOORS_WIRED__) {
            window.__RV_DOORS_WIRED__ = true;
            document.addEventListener('click', manejar, true);
            document.addEventListener('keydown', manejar, true);
        }

        // Bind directo por si la delegación falla en algún navegador.
        ['entrar-texto', 'entrar-acompanamiento', 'entrar-renovacion'].forEach((id) => {
            const el = document.getElementById(id);
            if (!el || el.dataset.rvDoorBound === '1') return;
            el.dataset.rvDoorBound = '1';
            el.addEventListener('click', (event) => {
                abrirPuertaMaestra(destinoDesdeBoton(el), event);
            });
        });

        document.querySelectorAll('#rv-home .rv-door[data-ir]').forEach((el) => {
            if (el.dataset.rvDoorBound === '1') return;
            el.dataset.rvDoorBound = '1';
            el.addEventListener('click', (event) => {
                abrirPuertaMaestra(destinoDesdeBoton(el), event);
            });
        });
    }

    function montarHome() {
        const home = document.getElementById('rv-home');
        if (!home) return;
        // Blindaje: el modal IA nunca debe quedar incrustado en el umbral
        try {
            window.closeAiModal?.();
            const panel = document.getElementById('panel-asistente-ia');
            if (panel) {
                panel.classList.remove('is-open');
                panel.setAttribute('hidden', '');
                panel.setAttribute('data-ia-closed', '1');
                panel.style.display = 'none';
                panel.setAttribute('aria-hidden', 'true');
            }
            const backdrop = document.getElementById('ai-modal');
            if (backdrop) {
                backdrop.classList.remove('is-open');
                backdrop.classList.add('hidden');
                backdrop.setAttribute('hidden', '');
                backdrop.style.display = 'none';
                backdrop.setAttribute('aria-hidden', 'true');
            }
            document.body.classList.remove('rv-ia-modal-open');
        } catch { /* ignore */ }
        montarAuthCirculo();
        pintarRacha();
        pintarHomeNotas();
        pintarDevocionalHome();
        montarPuertasMaestras();

        if (!window.__RV_ENTRAR_PLATAFORMA__) {
            window.__RV_ENTRAR_PLATAFORMA__ = true;
            window.entrarPlataforma = (mode = 'exegesis') => {
                const m = String(mode || '').toLowerCase();
                if (m === 'vida' || m === 'renovacion' || m === 'renovacion-vida') {
                    abrirPuertaMaestra({ renovacionVida: true, iaMode: 'vida' });
                    return;
                }
                abrirPuertaMaestra({
                    libro: 'Romanos',
                    cap: 12,
                    perspectivas: true,
                    canon: true,
                    iaMode: 'exegesis',
                });
            };
        }
        if (!window.__RV_NAV_WIRED__) {
            window.__RV_NAV_WIRED__ = true;
            window.addEventListener('popstate', () => {
                const hash = String(location.hash || '').replace(/^#/, '').toLowerCase();
                if (hash === 'acompanamiento') entrarAcompanamiento({ silencio: true });
                else if (esRutaLectura()) entrarSantuario({ ...destinoDesdeQuery(), silencio: true, canon: true });
                else volverHome();
            });
            window.addEventListener('hashchange', () => {
                const hash = String(location.hash || '').replace(/^#/, '').toLowerCase();
                if (hash === 'acompanamiento') entrarAcompanamiento({ silencio: true });
                else if (esRutaLectura()) entrarSantuario({ ...destinoDesdeQuery(), silencio: true, canon: true });
                else volverHome();
            });
        }

        document.getElementById('form-home-ia')?.addEventListener('submit', event => {
            event.preventDefault();
            event.stopPropagation();
            const mensaje = String(event.target.mensaje?.value || '').trim();
            if (mensaje.length < 2) return;
            if (!exigirRegistro(null, { libro: 'Romanos', cap: 12, iaPrompt: mensaje })) return;
            cerrarSplashForzado();
            entrarSantuario({ libro: 'Romanos', cap: 12, iaPrompt: mensaje, canon: true });
        });
        document.getElementById('btn-volver-home')?.addEventListener('click', (event) => {
            event.preventDefault();
            volverHome();
        });
        montarHubNavegacion();
        montarAcompanamiento();
        window.revelatioSantuario = {
            entrar: entrarSantuario,
            volver: volverHome,
            destino: destinoDesdeBoton,
            acompanamiento: entrarAcompanamiento,
            puerta: abrirPuertaMaestra,
        };
        window.revelatioPerfil = {
            leer: leerPerfil,
            guardar: guardarPerfil,
            sesion: sesionActiva,
            exigir: exigirRegistro,
            admin: esAdmin,
        };
        sincronizarGateUI();
    }

    function normalizarWhatsapp(pais, numero) {
        let digits = String(numero || '').replace(/\D+/g, '');
        const codeDigits = String(pais || '+57').replace(/\D+/g, '');
        // Si el usuario pegó el número con código de país, quitar el prefijo duplicado
        if (codeDigits && digits.startsWith(codeDigits) && digits.length > codeDigits.length + 6) {
            digits = digits.slice(codeDigits.length);
        }
        // Prefijos comunes pegados (57…, 58…)
        if (/^57\d{10}$/.test(digits)) digits = digits.slice(2);
        if (/^58\d{10}$/.test(digits)) digits = digits.slice(2);
        const code = String(pais || '+57').replace(/\s+/g, '') || '+57';
        if (!digits) return '';
        return `${code} ${digits}`;
    }

    async function hashClave(texto) {
        const raw = String(texto || '');
        if (!raw) return '';
        try {
            const buf = await crypto.subtle.digest('SHA-256', new TextEncoder().encode(`revelatio:${raw}`));
            return [...new Uint8Array(buf)].map(b => b.toString(16).padStart(2, '0')).join('');
        } catch {
            return `local:${raw.length}:${raw.slice(0, 3)}`;
        }
    }

    function pintarAuthUI(statusMsg) {
        const perfil = leerPerfil();
        const activa = sesionActiva();
        const session = document.getElementById('rv-auth-session');
        const forms = document.getElementById('rv-auth-forms');
        const copy = document.getElementById('rv-auth-session-copy');
        const status = document.getElementById('estado-suscripcion');
        const gate = document.getElementById('rv-auth-gate-msg');
        const card = document.getElementById('rv-auth-card');
        const logoutLink = document.getElementById('rv-auth-switch-user');
        const admin = activa && esAdmin(perfil);
        document.body.classList.toggle('is-session-ready', activa);
        if (activa && perfil?.email) {
            if (session) session.hidden = false;
            if (forms) forms.hidden = true;
            if (gate) gate.hidden = true;
            if (card) card.classList.add('is-session-compact');
            if (logoutLink) logoutLink.hidden = false;
            // Privacidad: nunca volcar nombre, correo ni WhatsApp en la UI pública.
            if (copy) {
                copy.textContent = admin
                    ? 'Sesión activa · puedes entrar directo a cualquiera de las dos puertas.'
                    : 'Sesión activa · elige una puerta para continuar.';
            }
            const roleEl = document.getElementById('rv-auth-session-role');
            if (roleEl) roleEl.textContent = 'Listo para entrar';
            const badge = document.getElementById('rv-auth-admin-badge');
            if (badge) badge.hidden = true;
        } else {
            if (session) session.hidden = true;
            if (forms) forms.hidden = false;
            if (card) card.classList.remove('is-session-compact');
            if (logoutLink) logoutLink.hidden = true;
            if (copy) copy.textContent = 'Sesión vinculada a tu Cuaderno, notas y exégesis.';
        }
        if (status && statusMsg != null) status.textContent = statusMsg;
        sincronizarGateUI();
        pintarHomeNotas();
    }

    function mostrarPanelAuth(modo) {
        const esLogin = modo === 'login';
        document.querySelectorAll('#form-registro').forEach((reg) => { reg.hidden = esLogin; });
        document.querySelectorAll('#form-login').forEach((login) => { login.hidden = !esLogin; });
    }

    async function asegurarCuentaAdmin() {
        const email = emailKey(ADMIN_DEV.email);
        const cuentas = leerCuentas();
        const prev = cuentas[email] || {};
        const passwordHash = await hashClave(ADMIN_DEV.password);
        cuentas[email] = {
            ...prev,
            email,
            whatsapp: ADMIN_DEV.whatsapp,
            pais: ADMIN_DEV.pais,
            nombre: ADMIN_DEV.nombre,
            role: 'admin',
            facultades: ADMIN_DEV.facultades.slice(),
            passwordHash,
            createdAt: prev.createdAt || new Date().toISOString(),
            updatedAt: new Date().toISOString(),
            bootstrap: 'admin-dev',
        };
        escribirCuentas(cuentas);
        // Solo sembramos la cuenta admin en el almacén local.
        // Nunca auto-iniciamos sesión ni rellenamos el formulario con datos personales.
        return cuentas[email];
    }

    function montarAuthCirculo() {
        const setStatus = (msg) => {
            const nodes = document.querySelectorAll('#estado-suscripcion');
            if (!nodes.length) return;
            nodes.forEach((el) => {
                el.textContent = msg || '';
                el.hidden = !msg;
            });
            if (msg) {
                try { nodes[nodes.length - 1].scrollIntoView({ behavior: 'smooth', block: 'nearest' }); } catch { /* ignore */ }
            }
        };

        const leerCampo = (id) => {
            const nodes = [...document.querySelectorAll(`#${CSS.escape(id)}`)];
            const visible = nodes.find((el) => {
                const form = el.closest('form');
                if (form?.hidden) return false;
                const rect = el.getBoundingClientRect?.();
                return rect && rect.width + rect.height > 0;
            }) || nodes[nodes.length - 1] || document.getElementById(id);
            if (!visible) return '';
            return String(visible.value ?? visible.getAttribute('value') ?? '').trim();
        };

        const completarRegistro = async () => {
            try { window.revelatioForzarUmbral?.(); } catch { /* ignore */ }
            const email = emailKey(leerCampo('reg-email'));
            const pais = leerCampo('reg-pais') || '+57';
            const whatsapp = normalizarWhatsapp(pais, leerCampo('reg-whatsapp'));
            const nombre = leerCampo('reg-nombre');
            if (!email || !email.includes('@') || !email.includes('.')) {
                setStatus('Escribe un correo válido (ej. tu@correo.org).');
                document.getElementById('reg-email')?.focus();
                return false;
            }
            const waDigits = whatsapp.replace(/\D+/g, '');
            if (waDigits.length < 10) {
                setStatus('Indica un WhatsApp válido (código de país + número local).');
                document.getElementById('reg-whatsapp')?.focus();
                return false;
            }
            const cuentas = leerCuentas();
            const prev = cuentas[email] || {};
            const adminMail = email === emailKey(ADMIN_DEV.email);
            let passwordHash = prev.passwordHash || '';
            if (adminMail && !passwordHash) {
                try { passwordHash = await hashClave(ADMIN_DEV.password); } catch { passwordHash = ''; }
            }
            const perfil = {
                email,
                whatsapp,
                pais,
                nombre: adminMail ? (nombre || ADMIN_DEV.nombre) : nombre,
                role: adminMail ? 'admin' : (prev.role || 'miembro'),
                facultades: adminMail ? ADMIN_DEV.facultades.slice() : undefined,
                createdAt: prev.createdAt || new Date().toISOString(),
                lastLogin: new Date().toISOString(),
            };
            cuentas[email] = {
                ...prev,
                email,
                whatsapp,
                pais,
                nombre: perfil.nombre,
                role: perfil.role,
                facultades: perfil.facultades,
                createdAt: perfil.createdAt,
                updatedAt: new Date().toISOString(),
                passwordHash,
            };
            escribirCuentas(cuentas);
            guardarPerfil(perfil);
            marcarSesionExplicita();
            try { leerCuaderno(); } catch (err) { console.warn('[auth] cuaderno', err); }
            sincronizarGateUI();
            pintarAuthUI('✓ Entraste al Círculo. Ya puedes abrir las dos puertas.');
            liberarDestinoPendiente();
            return true;
        };

        const completarLogin = async () => {
            try { window.revelatioForzarUmbral?.(); } catch { /* ignore */ }
            const email = emailKey(leerCampo('login-email'));
            const pais = leerCampo('login-pais') || '+57';
            const whatsapp = normalizarWhatsapp(pais, leerCampo('login-whatsapp'));
            if (!email || !email.includes('@')) {
                setStatus('Escribe el correo de tu cuenta.');
                document.getElementById('login-email')?.focus();
                return false;
            }
            const waDigits = whatsapp.replace(/\D+/g, '');
            if (waDigits.length < 10) {
                setStatus('Indica el WhatsApp con el que te registraste.');
                document.getElementById('login-whatsapp')?.focus();
                return false;
            }
            const cuentas = leerCuentas();
            let cuenta = cuentas[email];
            if (!cuenta && email === emailKey(ADMIN_DEV.email)) {
                try { await asegurarCuentaAdmin(); } catch { /* ignore */ }
                cuenta = leerCuentas()[email];
            }
            if (!cuenta) {
                setStatus('No hay cuenta con ese correo. Usa «Entrar al Círculo» para registrarte.');
                mostrarPanelAuth('registro');
                return false;
            }
            const cuentaWa = String(cuenta.whatsapp || '').replace(/\D+/g, '');
            if (cuentaWa && cuentaWa !== waDigits && !cuentaWa.endsWith(waDigits) && !waDigits.endsWith(cuentaWa.slice(-10))) {
                setStatus('El WhatsApp no coincide con el registro de ese correo.');
                document.getElementById('login-whatsapp')?.focus();
                return false;
            }
            const adminMail = email === emailKey(ADMIN_DEV.email) || cuenta.role === 'admin';
            const perfil = {
                email: cuenta.email,
                whatsapp: whatsapp || cuenta.whatsapp || '',
                pais: pais || cuenta.pais || '+57',
                nombre: cuenta.nombre || '',
                role: adminMail ? 'admin' : (cuenta.role || 'miembro'),
                facultades: adminMail ? ADMIN_DEV.facultades.slice() : cuenta.facultades,
                createdAt: cuenta.createdAt || new Date().toISOString(),
                lastLogin: new Date().toISOString(),
            };
            if (!cuenta.whatsapp) {
                cuenta.whatsapp = perfil.whatsapp;
                cuenta.pais = perfil.pais;
                cuenta.updatedAt = new Date().toISOString();
                cuentas[email] = cuenta;
                escribirCuentas(cuentas);
            }
            guardarPerfil(perfil);
            marcarSesionExplicita();
            try { leerCuaderno(); } catch (err) { console.warn('[auth] cuaderno', err); }
            sincronizarGateUI();
            pintarAuthUI('✓ Sesión restaurada. Ya puedes abrir las dos puertas.');
            liberarDestinoPendiente();
            return true;
        };

        window.revelatioAuth = {
            registrar: completarRegistro,
            login: completarLogin,
            mostrar: mostrarPanelAuth,
            pintar: pintarAuthUI,
            sesion: sesionActiva,
        };

        // Vaciar solo al montar (una vez), nunca tras async si el usuario ya escribió.
        forzarFichaRegistroVacia();
        if (!sesionActiva()) {
            limpiarSesionSiNoExplicita();
            if (!window.__RV_AUTH_FIELDS_SEEDED__) {
                window.__RV_AUTH_FIELDS_SEEDED__ = true;
                vaciarCamposRegistro();
            }
        }
        sincronizarGateUI();

        if (!window.__RV_AUTH_DELEGATE__) {
            window.__RV_AUTH_DELEGATE__ = true;

            document.addEventListener('click', (event) => {
                const t = event.target?.closest?.('#btn-entrar-circulo, #btn-iniciar-sesion, #rv-auth-show-login, #rv-auth-show-registro, #rv-auth-logout, #rv-auth-switch-user, [data-auth]');
                if (!t) return;
                // No interceptar puertas / hubs / FAB
                if (t.closest?.('.rv-door[data-ir], [data-ir], [data-hub], #btn-asistente-ia, #panel-asistente-ia')) return;

                if (t.id === 'rv-auth-show-login' || t.getAttribute('data-auth') === 'show-login') {
                    event.preventDefault();
                    event.stopPropagation();
                    mostrarPanelAuth('login');
                    setStatus('');
                    document.getElementById('login-email')?.focus?.();
                    return;
                }
                if (t.id === 'rv-auth-show-registro' || t.getAttribute('data-auth') === 'show-registro') {
                    event.preventDefault();
                    event.stopPropagation();
                    mostrarPanelAuth('registro');
                    setStatus('');
                    document.getElementById('reg-email')?.focus?.();
                    return;
                }
                if (t.id === 'rv-auth-logout' || t.id === 'rv-auth-switch-user') {
                    event.preventDefault();
                    event.stopPropagation();
                    try {
                        localStorage.removeItem(PERFIL_KEY);
                        localStorage.removeItem(SESION_EXPLICITA_KEY);
                    } catch { /* ignore */ }
                    pendingDestino = null;
                    window.__RV_AUTH_FIELDS_SEEDED__ = false;
                    vaciarCamposRegistro();
                    if (document.body.classList.contains('is-santuario')) volverHome();
                    pintarAuthUI('Sesión cerrada. Puedes entrar de nuevo o unirte al Círculo.');
                    mostrarPanelAuth('registro');
                    sincronizarGateUI();
                    return;
                }

                if (t.id === 'btn-entrar-circulo' || (t.getAttribute('data-auth') === 'registro' && t.type === 'submit')) {
                    event.preventDefault();
                    event.stopPropagation();
                    setStatus('Entrando al Círculo…');
                    Promise.resolve((window.revelatioAuth?.registrar || completarRegistro)())
                        .catch((err) => {
                            console.error('[auth] registro', err);
                            setStatus('No se pudo registrar. Inténtalo de nuevo.');
                        });
                    return;
                }
                if (t.id === 'btn-iniciar-sesion' || (t.getAttribute('data-auth') === 'login' && t.type === 'submit')) {
                    event.preventDefault();
                    event.stopPropagation();
                    setStatus('Iniciando sesión…');
                    Promise.resolve((window.revelatioAuth?.login || completarLogin)())
                        .catch((err) => {
                            console.error('[auth] login', err);
                            setStatus('No se pudo iniciar sesión. Inténtalo de nuevo.');
                        });
                }
            }, true);

            document.addEventListener('submit', (event) => {
                const form = event.target;
                if (!(form instanceof HTMLFormElement)) return;
                if (form.id === 'form-registro') {
                    event.preventDefault();
                    event.stopPropagation();
                    setStatus('Entrando al Círculo…');
                    const fn = window.revelatioAuth?.registrar || completarRegistro;
                    Promise.resolve(fn()).catch((err) => {
                        console.error('[auth] submit registro', err);
                        setStatus('No se pudo registrar. Inténtalo de nuevo.');
                    });
                } else if (form.id === 'form-login') {
                    event.preventDefault();
                    event.stopPropagation();
                    setStatus('Iniciando sesión…');
                    const fn = window.revelatioAuth?.login || completarLogin;
                    Promise.resolve(fn()).catch((err) => {
                        console.error('[auth] submit login', err);
                        setStatus('No se pudo iniciar sesión. Inténtalo de nuevo.');
                    });
                }
            }, true);
        }

        // Bind directo en botones visibles (sobrevive a re-inyección del dashboard)
        const bindAuthBtn = (el, handler) => {
            if (!el || el.dataset.rvAuthBound === '1') return;
            el.dataset.rvAuthBound = '1';
            el.addEventListener('click', handler);
        };
        document.querySelectorAll('#rv-auth-show-login, [data-auth="show-login"]').forEach((el) => {
            bindAuthBtn(el, (event) => {
                event.preventDefault();
                event.stopPropagation();
                mostrarPanelAuth('login');
                setStatus('');
                document.getElementById('login-email')?.focus?.();
            });
        });
        document.querySelectorAll('#rv-auth-show-registro, [data-auth="show-registro"]').forEach((el) => {
            bindAuthBtn(el, (event) => {
                event.preventDefault();
                event.stopPropagation();
                mostrarPanelAuth('registro');
                setStatus('');
                document.getElementById('reg-email')?.focus?.();
            });
        });
        document.querySelectorAll('#btn-entrar-circulo').forEach((el) => {
            bindAuthBtn(el, (event) => {
                event.preventDefault();
                event.stopPropagation();
                setStatus('Entrando al Círculo…');
                Promise.resolve((window.revelatioAuth?.registrar || completarRegistro)()).catch((err) => {
                    console.error('[auth] registro click', err);
                    setStatus('No se pudo registrar. Inténtalo de nuevo.');
                });
            });
        });
        document.querySelectorAll('#btn-iniciar-sesion').forEach((el) => {
            bindAuthBtn(el, (event) => {
                event.preventDefault();
                event.stopPropagation();
                setStatus('Iniciando sesión…');
                Promise.resolve((window.revelatioAuth?.login || completarLogin)()).catch((err) => {
                    console.error('[auth] login click', err);
                    setStatus('No se pudo iniciar sesión. Inténtalo de nuevo.');
                });
            });
        });

        window.__RV_AUTH_WIRED__ = true;
        window.revelatioAuth = {
            registrar: completarRegistro,
            login: completarLogin,
            mostrar: mostrarPanelAuth,
            pintar: pintarAuthUI,
            sesion: sesionActiva,
        };

        // Sembrar cuenta admin en background SIN vaciar el formulario
        asegurarCuentaAdmin()
            .then(() => {
                pintarAuthUI(sesionActiva() ? null : '');
                if (!sesionActiva()) mostrarPanelAuth('registro');
                sincronizarGateUI();
            })
            .catch(() => {
                pintarAuthUI('');
                if (!sesionActiva()) mostrarPanelAuth('registro');
                sincronizarGateUI();
            });
    }

    function aplicarModoInicial() {
        if (esRutaLectura()) {
            document.getElementById('rv-splash')?.classList.add('is-out', 'is-gone');
            document.getElementById('rv-home')?.classList.add('is-hidden');
            document.body.classList.add('is-santuario', 'visor-active');
            const dest = destinoDesdeQuery();
            setTimeout(() => entrarSantuario({ ...dest, silencio: true }), 0);
            return;
        }
        document.getElementById('rv-home')?.classList.remove('is-hidden');
        document.body.classList.remove('is-santuario', 'visor-active');
        sincronizarGateUI();
    }

    function montarStrong() {
        const panel = document.getElementById('panel-strong');
        const cuerpo = document.getElementById('cuerpo-strong');
        const codigoEl = document.getElementById('codigo-strong');
        if (!panel || !cuerpo) return;

        const cerrar = () => {
            panel.classList.remove('is-open');
            panel.setAttribute('aria-hidden', 'true');
        };
        const abrir = async (codigo, lemma) => {
            const key = String(codigo || '').toUpperCase().replace(/^([GH])0*(\d+)$/, '$1$2');
            if (!/^[GH]\d{1,5}$/.test(key)) return;

            // Preferir popup español de alto contraste
            if (typeof window.showStrongModal === 'function') {
                try {
                    const lexico = await cargarLexicoStrong();
                    const local = lexico[key] || {};
                    let remote = null;
                    if (!(local.definicion || local.definition)) {
                        try {
                            const res = await fetch(`/api/strong?codigo=${encodeURIComponent(key)}`);
                            const json = await res.json().catch(() => ({}));
                            if (json?.success) remote = json.data;
                        } catch { /* local basta */ }
                    }
                    window.showStrongModal(key, {
                        word: local.lemma || remote?.lemma || lemma || '',
                        translit: local.translit || remote?.translit || '',
                        pron: local.pron || '',
                        def: local.definicion || local.definition || remote?.definicion || remote?.definition || '',
                        part: local.part || remote?.idioma || '',
                        lemma: local.lemma || remote?.lemma || lemma || '',
                    });
                    return;
                } catch {
                    /* caer al panel legacy */
                }
            }

            panel.classList.add('is-open');
            panel.setAttribute('aria-hidden', 'false');
            if (codigoEl) codigoEl.textContent = key;
            cuerpo.innerHTML = `<p class="rv-strong-def">Abriendo el léxico…</p>`;
            try {
                const lexico = await cargarLexicoStrong();
                let data = null;
                const local = lexico[key];
                if (local) {
                    data = {
                        codigo: key,
                        idioma: key.startsWith('H') ? 'hebreo' : 'griego',
                        lemma: local.lemma || local.lexema || lemma || '',
                        raiz: local.raiz || local.lemma || '',
                        translit: local.translit || local.transliteracion || '',
                        definicion: local.definicion || local.definition || '',
                    };
                }
                if (!data?.definicion) {
                    const res = await fetch(`/api/strong?codigo=${encodeURIComponent(key)}`);
                    const json = await res.json().catch(() => ({}));
                    if (json?.success) data = json.data;
                }
                if (!data) {
                    cuerpo.innerHTML = `<p class="rv-strong-def">No hay entrada clásica para ${key}.</p>`;
                    return;
                }
                const defEs = window.translateGlossToSpanish
                    ? window.translateGlossToSpanish(data.definicion || '')
                    : (data.definicion || '');
                cuerpo.innerHTML = `
                    <p class="rv-strong-lemma text-[#0A192F] font-bold">${escapeHtml(data.lemma || lemma || '')}</p>
                    <p class="rv-strong-meta text-[#855D10]">${escapeHtml([data.idioma, data.translit, data.raiz && data.raiz !== data.lemma ? `raíz ${data.raiz}` : ''].filter(Boolean).join(' · '))}</p>
                    <p class="rv-strong-def text-[#0F172A] font-semibold">${escapeHtml(defEs)}</p>
                `;
            } catch {
                cuerpo.innerHTML = `<p class="rv-strong-def">El léxico no está disponible.</p>`;
            }
        };

        document.addEventListener('click', event => {
            const hit = event.target.closest?.('[data-strong]');
            if (!hit || !hit.dataset.strong) return;
            event.preventDefault();
            event.stopPropagation();
            abrir(hit.dataset.strong, hit.dataset.lemma || hit.textContent || '');
        }, true);
        document.addEventListener('revelatio:open-strong', (event) => {
            const codigo = event.detail?.codigo;
            if (!codigo) return;
            abrir(codigo, event.detail?.lemma || '');
        });
        document.getElementById('cerrar-strong')?.addEventListener('click', cerrar);
        document.addEventListener('keydown', event => { if (event.key === 'Escape') cerrar(); });
        document.addEventListener('mousedown', event => {
            if (!panel.classList.contains('is-open')) return;
            if (panel.contains(event.target) || event.target.closest?.('[data-strong]')) return;
            cerrar();
        });
    }

    /** Atlas exegético: mapa histórico del libro/pasaje activo */
    const ATLAS_REGIONES = {
        'Génesis': { lugar: 'Oriente Próximo · itinerario patriarcal', nota: 'Mesopotamia, Canaán y Egipto en la narrativa primordial.' },
        'Éxodo': { lugar: 'Egipto · Sinaí · desierto', nota: 'Ruta del éxodo y constitución del pueblo en el monte.' },
        'Josué': { lugar: 'Canaán · conquista', nota: 'Entrada a la Tierra Prometida y distribución tribal.' },
        'Salmos': { lugar: 'Jerusalén · culto del templo', nota: 'Geografía litúrgica de Sion y el reino de David.' },
        'Isaías': { lugar: 'Judá · Jerusalén · Imperio asirio', nota: 'Crisis asiria y horizonte de restauración.' },
        'Daniel': { lugar: 'Babilonia · imperios gentiles', nota: 'Corte imperial y visiones de los reinos.' },
        'Mateo': { lugar: 'Galilea · Judea · Jerusalén', nota: 'Ministerio del Mesías en la Tierra Santa del s. I.' },
        'Marcos': { lugar: 'Galilea · Jerusalén (audiencia romana)', nota: 'Camino urgente del Siervo hacia la cruz.' },
        'Lucas': { lugar: 'Galilea · Judea · camino a Jerusalén', nota: 'Itinerario ordenado hacia la ciudad santa.' },
        'Juan': { lugar: 'Judea · Galilea · Samaria', nota: 'Escenarios de los signos joaninos.' },
        'Hechos': { lugar: 'Jerusalén → Antioquía → Roma', nota: 'Expansión del evangelio por el Mediterráneo.' },
        'Romanos': { lugar: 'Roma (destino) · Corinto (origen probable)', nota: 'Capital del Imperio y comunidad judío-gentil.' },
        '1 Corintios': { lugar: 'Corinto · Acaya', nota: 'Ciudad portuaria griega bajo influencia romana.' },
        '2 Corintios': { lugar: 'Corinto · Macedonia', nota: 'Rutas paulinas entre Grecia y el norte.' },
        'Gálatas': { lugar: 'Galacia · Asia Menor', nota: 'Interior anatólico y crisis judaizante.' },
        'Efesios': { lugar: 'Éfeso · Asia proconsular', nota: 'Metrópoli del culto y la iglesia en Asia.' },
        'Filipenses': { lugar: 'Filipos · Macedonia', nota: 'Colonia romana en la Via Egnatia.' },
        'Colosenses': { lugar: 'Colosas · valle del Lico', nota: 'Ciudades del interior de Asia Menor.' },
        '1 Tesalonicenses': { lugar: 'Tesalónica · Macedonia', nota: 'Puerto estratégico en la Via Egnatia.' },
        '2 Tesalonicenses': { lugar: 'Tesalónica · Macedonia', nota: 'Misma iglesia ante la expectativa escatológica.' },
        '1 Timoteo': { lugar: 'Éfeso', nota: 'Pastoreo en la capital de Asia.' },
        '2 Timoteo': { lugar: 'Roma (prisión) · Éfeso (Timoteo)', nota: 'Último tramo del ministerio paulino.' },
        'Tito': { lugar: 'Creta', nota: 'Organización de iglesias en la isla.' },
        'Filemón': { lugar: 'Colosas (casa de Filemón)', nota: 'Red doméstica de la iglesia en el Lico.' },
        'Hebreos': { lugar: 'Comunidad judío-cristiana (destino debatido)', nota: 'Horizonte del culto y el templo.' },
        '1 Pedro': { lugar: 'Asia Menor · “Babilonia” (Roma)', nota: 'Diáspora de Asia bajo presión imperial.' },
        'Apocalipsis': { lugar: 'Patmos · siete iglesias de Asia', nota: 'Arco geográfico de la revelación joanina.' },
    };

    function atlasDeLibro(nombre) {
        const n = String(nombre || '').trim();
        if (ATLAS_REGIONES[n]) return ATLAS_REGIONES[n];
        const key = Object.keys(ATLAS_REGIONES).find((k) => packName(k) === packName(n));
        return key ? ATLAS_REGIONES[key] : {
            lugar: 'Tierra Bíblica · Mediterráneo oriental',
            nota: 'Escenario histórico-geográfico del libro activo.',
        };
    }

    function montarAtlas() {
        const modal = document.getElementById('rv-atlas-modal');
        if (!modal || modal.dataset.bound === '1') return;
        modal.dataset.bound = '1';
        const iframe = document.getElementById('rv-atlas-iframe');
        const img = document.getElementById('rv-atlas-img');
        const fallback = document.getElementById('rv-atlas-fallback');
        const lugarEl = document.getElementById('rv-atlas-lugar');
        const notaEl = document.getElementById('rv-atlas-nota');
        const copyEl = document.getElementById('rv-atlas-fallback-copy');

        const cerrar = () => {
            modal.hidden = true;
            modal.setAttribute('aria-hidden', 'true');
            document.body.classList.remove('rv-atlas-open');
            if (iframe) {
                iframe.hidden = true;
                iframe.removeAttribute('src');
            }
            if (img) {
                img.hidden = true;
                img.removeAttribute('src');
            }
            if (fallback) fallback.hidden = false;
        };

        const abrir = () => {
            const libro = estado();
            const pack = atlasDeLibro(libro?.n);
            const ref = referenciaComentario(libro) || `${libro?.n || ''} ${libro?.cap || ''}`.trim();
            if (lugarEl) lugarEl.textContent = `${ref} · ${pack.lugar}`;
            if (notaEl) notaEl.textContent = pack.nota;
            if (copyEl) copyEl.textContent = `Geografía de ${pack.lugar}. Lista para iframe o imagen HD de la época.`;

            // Hooks: data-atlas-iframe / data-atlas-img en el modal, o mapa por libro
            const iframeSrc = modal.getAttribute('data-atlas-iframe') || pack.iframe || '';
            const imgSrc = modal.getAttribute('data-atlas-img') || pack.img || `assets/maps/${packName(libro?.n || 'biblia')}.jpg`;

            let showed = false;
            if (iframe && iframeSrc) {
                iframe.src = iframeSrc;
                iframe.hidden = false;
                if (img) img.hidden = true;
                if (fallback) fallback.hidden = true;
                showed = true;
            } else if (img && imgSrc) {
                img.onload = () => {
                    img.hidden = false;
                    if (iframe) iframe.hidden = true;
                    if (fallback) fallback.hidden = true;
                };
                img.onerror = () => {
                    img.hidden = true;
                    if (fallback) fallback.hidden = false;
                };
                img.src = imgSrc;
                // Si no carga, queda el fallback
            }
            if (!showed && fallback) fallback.hidden = false;

            modal.hidden = false;
            modal.setAttribute('aria-hidden', 'false');
            document.body.classList.add('rv-atlas-open');
            modal.querySelector('.rv-atlas-close')?.focus?.();
        };

        document.addEventListener('click', (event) => {
            if (event.target.closest?.('#btn-atlas-exegesis, [data-atlas-open]')) {
                event.preventDefault();
                abrir();
                return;
            }
            if (event.target.closest?.('[data-atlas-close]')) {
                event.preventDefault();
                cerrar();
            }
        });
        document.addEventListener('keydown', (event) => {
            if (event.key === 'Escape' && !modal.hidden) cerrar();
        });

        window.RV = window.RV || {};
        window.RV.atlas = { open: abrir, close: cerrar };
    }

    function montarCapaEstudio() {
        const seguro = (fn) => { try { fn(); } catch (err) { console.warn('[revelatio]', err); } };
        seguro(montarSelectores);
        seguro(montarCanon);
        seguro(montarEstudio);
        seguro(montarPerspectivas);
        seguro(montarStrong);
        seguro(montarAtlas);
        seguro(montarMarginNote);
        seguro(montarCuaderno);
        seguro(montarFlujosInductivos);
        seguro(montarAudio);
        seguro(montarEfataCards);
        seguro(montarSermon);
        seguro(montarModoVersiculo);
        seguro(() => window.RV?.bibleNav?.mount?.());
        seguro(() => window.RV?.verseActions?.mount?.());
        seguro(() => window.RV?.studyPanel?.mount?.());
        seguro(() => window.RV?.aposento?.mount?.());
        seguro(() => {
            document.addEventListener('revelatio:open-card', (event) => {
                const d = event.detail || {};
                if (typeof window.openCardGenerator === 'function') {
                    window.openCardGenerator(d.passage || d.ref, d.text || d.verseText, d.version);
                } else {
                    abrirEfataCard({
                        text: d.text,
                        ref: d.ref,
                        version: d.version,
                        brandLogo: d.brandLogo,
                        brandWatermark: d.brandWatermark,
                    });
                }
            });
            document.addEventListener('revelatio:goto', (event) => {
                const d = event.detail || {};
                if (!d.libro) return;
                entrarSantuario({
                    libro: d.libro,
                    cap: Number(d.cap) || 1,
                    verso: d.verso ? Number(d.verso) : null,
                    canon: true,
                });
            });
            window.RV.estudio = Object.assign(window.RV.estudio || {}, {
                goto: (dest) => entrarSantuario({
                    libro: dest.libro,
                    cap: Number(dest.cap) || 1,
                    verso: dest.verso ? Number(dest.verso) : null,
                    canon: true,
                }),
            });
            window.abrirEfataCard = (detail = {}) => {
                if (typeof window.openCardGenerator === 'function') {
                    return window.openCardGenerator(detail.passage || detail.ref, detail.text || detail.verseText, detail.version);
                }
                return abrirEfataCard(detail);
            };
        });
    }

    function iniciar() {
        const seguro = (fn) => {
            try { fn(); } catch (err) { console.warn('[revelatio]', err); }
        };
        window.RV = window.RV || {};
        window.RV.navigation = window.RV.navigation || {};
        window.RV.navigation.onEstudioReady = () => {
            if (window.__RV_ESTUDIO_MOUNTED__) return;
            window.__RV_ESTUDIO_MOUNTED__ = true;
            montarCapaEstudio();
        };
        window.RV.navigation.onDashboardReady = () => {
            seguro(montarHome);
            seguro(montarPuertasMaestras);
        };
        window.RV.navigation.onAcompReady = () => {
            seguro(montarAcompanamiento);
        };
        // Capa global (shell + overlays)
        seguro(montarSplash);
        seguro(montarPopover);
        seguro(montarAsistente);
        seguro(montarHubNavegacion);
        // Dashboard + estudio ya inyectados por router en main.js
        seguro(montarHome);
        seguro(montarPuertasMaestras);
        if (document.getElementById('panel-canon')) {
            window.__RV_ESTUDIO_MOUNTED__ = true;
            montarCapaEstudio();
        }
        if (document.getElementById('form-acompanamiento')) {
            seguro(montarAcompanamiento);
        }
        seguro(aplicarModoInicial);
        window.revelatioLectura?.precargarComentarios?.().then(() => {
            const sel = document.getElementById('selector-autor');
            const lista = (window.REVELATIO_AUTORES || []).filter(a => a?.key);
            if (sel && lista.length) {
                const current = sel.value;
                sel.innerHTML = lista.map(a =>
                    `<option value="${escapeHtml(a.key)}">${escapeHtml(a.etiqueta || a.key)}</option>`
                ).join('');
                if ([...sel.options].some(o => o.value === current)) sel.value = current;
            }
            refrescarComentario(estado());
        });
    }

    window.RV = window.RV || {};
    window.RV.bootEstudioApp = iniciar;
    // Arranque diferido: js/main.js llama bootEstudioApp tras el router.
    if (!window.RV?.router) {
        if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', iniciar);
        else iniciar();
    }
})();
