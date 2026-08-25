/**
 * Éfata RevelatiO — ai-engine.js
 * Asistente permanente RevelatiO IA: FAB, panel contextual, Markdown y acciones.
 * Módulo de estudio = asistente exegético (no sustituye Acompañamiento Ministerial).
 */
(function (global) {
    "use strict";

    const RV = (global.RV = global.RV || {});

    /** Filtro de inerrancia (espejo del system prompt servidor). */
    const FILTRO_INERRANCIA =
        "Eres un asistente teológico conservador. Tienes estrictamente prohibido usar metodologías de alta crítica destructiva, teología liberal o psicología secular de autoayuda. Asumes la inerrancia de las Escrituras.";

    const AUTOR_LABEL = {
        "matthew-henry": "Matthew Henry",
        "jamieson-fausset-brown": "Jamieson-Fausset-Brown",
        "albert-barnes": "Albert Barnes",
        "charles-spurgeon": "C. H. Spurgeon",
        "juan-calvino": "Juan Calvino",
        "john-gill": "John Gill",
    };

    async function authToken() {
        if (global.revelatioLectura?.tokenAuth) return global.revelatioLectura.tokenAuth();
        try {
            return (await global.supabaseClient?.auth?.getSession?.())?.data?.session?.access_token || null;
        } catch {
            return null;
        }
    }

    async function readStream(res) {
        if (global.revelatioLectura?.leerStream) return global.revelatioLectura.leerStream(res);
        if (!res.body || typeof res.body.getReader !== "function") return res.text();
        const reader = res.body.getReader();
        const decoder = new TextDecoder();
        let out = "";
        while (true) {
            const { done, value } = await reader.read();
            if (done) break;
            out += decoder.decode(value, { stream: true });
        }
        out += decoder.decode();
        return out;
    }

    async function chatGlobal({ message, context, history }) {
        const token = await authToken();
        const headers = { "Content-Type": "application/json", Accept: "application/json, text/plain" };
        if (token) headers.Authorization = `Bearer ${token}`;
        const res = await fetch("/api/chat-global", {
            method: "POST",
            headers,
            body: JSON.stringify({
                message: String(message || "").trim(),
                context: context || {},
                history: Array.isArray(history) ? history : [],
            }),
        });
        if (res.ok && res.body && typeof res.body.getReader === "function") {
            const raw = await readStream(res);
            if (String(raw || "").trim()) return String(raw).trim();
        }
        if (res.ok) {
            const ctype = (res.headers.get("content-type") || "").toLowerCase();
            if (ctype.includes("application/json")) {
                const json = await res.json();
                return String(json.text || json.error || "").trim();
            }
            return String(await res.text()).trim();
        }
        throw new Error(`chat-global ${res.status}`);
    }

    /**
     * Cerebro externo: Gemini vía /api/agente-teologico.
     * Contrato: POST { prompt, contextPassage, mode } → { ok, data }
     */
    async function agenteTeologico({ prompt, message, contextPassage, context, history, mode }) {
        const token = await authToken();
        const headers = { "Content-Type": "application/json", Accept: "application/json" };
        if (token) headers.Authorization = `Bearer ${token}`;
        const userPrompt = String(prompt || message || "").trim();
        const passage = String(contextPassage || context?.reference || "").trim();
        const resolvedMode = mode === "exegesis" || mode === "vida" ? mode : "vida";
        let res;
        try {
            res = await fetch("/api/agente-teologico", {
                method: "POST",
                headers,
                body: JSON.stringify({
                    prompt: userPrompt,
                    contextPassage: passage,
                    mode: resolvedMode,
                    message: userPrompt,
                    context: { ...(context || {}), mode: resolvedMode },
                    history: Array.isArray(history) ? history : [],
                }),
            });
        } catch (networkErr) {
            const err = new Error("No hay conexión con el Agente Teológico. Revisa tu red o el servidor.");
            err.cause = networkErr;
            err.code = "NETWORK";
            throw err;
        }

        let json = null;
        try {
            json = await res.json();
        } catch {
            json = null;
        }

        if (!res.ok || json?.ok === false) {
            const msg =
                (json && (json.error || json.message)) ||
                `El servidor respondió ${res.status}. Inténtalo de nuevo.`;
            const err = new Error(msg);
            err.status = res.status;
            err.code = "HTTP";
            throw err;
        }

        const text = String(json?.data || json?.text || "").trim();
        if (!text) {
            const err = new Error(json?.error || "Respuesta vacía del Agente Teológico.");
            err.code = "EMPTY";
            throw err;
        }

        return {
            text,
            data: text,
            ok: true,
            gated: Boolean(json?.gated),
            mode: json?.mode || resolvedMode,
            model: json?.model || "gemini-1.5-flash",
            governance: json?.governance || "revelatio_dual_v1",
            audit: json?.audit || context?.audit || null,
            error: null,
        };
    }

    async function synthesizePerspectives(payload) {
        const token = await authToken();
        const headers = { "Content-Type": "application/json", Accept: "application/json, text/plain" };
        if (token) headers.Authorization = `Bearer ${token}`;
        const res = await fetch("/api/ai-synthesis", {
            method: "POST",
            headers,
            body: JSON.stringify(payload || {}),
        });
        if (!res.ok) throw new Error(`ai-synthesis ${res.status}`);
        const ctype = (res.headers.get("content-type") || "").toLowerCase();
        if (ctype.includes("application/json")) {
            const json = await res.json();
            return String(json.text || json.synthesis || json.error || "").trim();
        }
        return String(await res.text()).trim();
    }

    function escapeHtml(s) {
        return String(s || "")
            .replace(/&/g, "&amp;")
            .replace(/</g, "&lt;")
            .replace(/>/g, "&gt;")
            .replace(/"/g, "&quot;");
    }

    /** Markdown limpio → HTML seguro (###, listas, negritas). */
    function renderMarkdownChunk(md) {
        let text = escapeHtml(String(md || "").trim());
        if (!text) return "";
        text = text.replace(/^#### (.+)$/gm, "<h5>$1</h5>");
        text = text.replace(/^### (.+)$/gm, "<h4>$1</h4>");
        text = text.replace(/^## (.+)$/gm, "<h3>$1</h3>");
        text = text.replace(/^# (.+)$/gm, "<h2>$1</h2>");
        text = text.replace(/\*\*(.+?)\*\*/g, "<strong>$1</strong>");
        text = text.replace(/__(.+?)__/g, "<strong>$1</strong>");
        text = text.replace(/(^|[^*])\*([^*\n]+)\*(?!\*)/g, "$1<em>$2</em>");
        text = text.replace(/`([^`]+)`/g, "<code>$1</code>");
        text = text.replace(/^\d+\.\s+(.+)$/gm, "<li>$1</li>");
        text = text.replace(/^[-*•]\s+(.+)$/gm, "<li>$1</li>");
        text = text.replace(/(?:<li>[\s\S]*?<\/li>\n?)+/g, (block) => `<ul>${block}</ul>`);
        text = text.replace(/\n{2,}/g, "</p><p>");
        text = text.replace(/\n/g, "<br>");
        return `<p>${text}</p>`;
    }

    function classifySectionTone(title, mode) {
        const t = String(title || "").toLowerCase();
        if (/diagn[oó]stico|neurocognitivo|dise[nñ]o humano|am[ií]gdala|cortisol|ciencia/.test(t)) {
            return "science";
        }
        if (/verdad revelada|ra[ií]z b[ií]blica|teol[oó]gic|exeg[eé]tic|pacto|doctrinal|can[oó]nico|l[eé]xico|strong|hebreo|griego|marco hist[oó]rico|articulaci[oó]n/.test(t)) {
            return "bible";
        }
        if (/protocolo|acci[oó]n|s[ií]ntesis|aplicaci[oó]n|plan/.test(t)) return "action";
        if (/inteligencia emocional|neuroplasticidad|metanoia|car[aá]cter|dominio/.test(t)) {
            return mode === "vida" ? "bridge" : "bible";
        }
        return mode === "exegesis" ? "bible" : "bridge";
    }

    /** Render con bloques contrastados (ciencia vs Palabra). */
    function renderMarkdown(md, mode = "vida") {
        const raw = String(md || "").trim();
        if (!raw) return "";
        const parts = raw.split(/(?=^#{1,3}\s+)/m).filter((p) => String(p || "").trim());
        if (parts.length <= 1) {
            return `<div class="rv-ia-md-inner">${renderMarkdownChunk(raw)}</div>`;
        }
        return `<div class="rv-ia-md-inner">${parts
            .map((part) => {
                const title = (part.match(/^#{1,3}\s+(.+)$/m) || [])[1] || "";
                const tone = classifySectionTone(title, mode);
                return `<section class="rv-ia-block rv-ia-block--${tone}">${renderMarkdownChunk(part)}</section>`;
            })
            .join("")}</div>`;
    }

    /** Heurística: consulta cotidiana / pastoral-vital (sin cita bíblica). */
    function isPastoralVitalQuery(text) {
        const raw = String(text || "").toLowerCase();
        if (!raw || detectPassageFromQuery(raw)) return false;
        return /\b(miedo|ansiedad|estr[eé]s|trabajo|empleo|matrimonio|pareja|esposa|esposo|hijos?|familia|h[aá]bito|adicci[oó]n|conflicto|ira|enojo|depresi[oó]n|soledad|finanzas|dinero|deuda|salud|duelo|perdon|perdón|autoestima|insomnio|burnout|relaci[oó]n|divorcio|celos|envidia|culpa|verg[uü]enza|l[ií]mite|l[ií]mites)\b/i.test(
            raw
        );
    }

    /**
     * Contexto invisible para el prompt: verso activo del Aposento / Estudio.
     * Incluye gobernanza de inerrancia y huella de auditoría (datos duros).
     */
    function getStudyContext() {
        const loc = global.__revelatioLibroActivo || { n: "Romanos", c: 16, cap: 12, verso: null };
        const n = Number(loc.verso || 0);
        let verseText = "";
        if (n) {
            const el = document.querySelector(
                `#texto-biblico .rv-verse-surface[data-versiculo="${n}"] .rv-verse-text`
            );
            if (el) {
                const clone = el.cloneNode(true);
                clone.querySelectorAll(".rv-verse-num, .rv-strong-row, sup")?.forEach?.((node) => node.remove());
                verseText = String(clone.textContent || "").replace(/\s+/g, " ").trim();
            }
        }
        const reference = n ? `${loc.n} ${loc.cap}:${n}` : `${loc.n} ${loc.cap}`;
        const inStudy = document.body.classList.contains("is-santuario");
        const verseMode = document.body.classList.contains("is-verse-study");
        const autorKey = localStorage.getItem("revelatio_autor") || "matthew-henry";
        const commentator =
            (global.RV_DATA && global.RV_DATA.AUTOR_LABEL && global.RV_DATA.AUTOR_LABEL[autorKey]) ||
            AUTOR_LABEL[autorKey] ||
            "Matthew Henry";
        const doctrineTags = global.RV?.ui?.getActiveDoctrinalTags?.() || [];
        const doctrineLabels = (global.RV?.ui?.DOCTRINAL_TAGS || [])
            .filter((t) => doctrineTags.includes(t.id))
            .map((t) => t.label);
        const strongCodes = collectStrongCodes(n);
        const audit = {
            commentator,
            commentatorKey: autorKey,
            doctrine: doctrineLabels.length
                ? doctrineLabels
                : ["Exégesis canónica · teología sistemática (según el pasaje)"],
            lexicon: strongCodes.length
                ? `Léxico Strong (${strongCodes.slice(0, 8).join(", ")})`
                : "Léxico Strong (hebreo/griego) · diccionario morfológico RevelatiO",
            strongCodes,
            reference,
            governance: "inerrancia_v1",
        };
        return {
            module: "EstudioProfundoExegesis",
            door: "estudio",
            reference,
            verse: n || null,
            verseText,
            verseMode,
            inStudy,
            version: localStorage.getItem("revelatio_version") || "rv1960",
            commentator,
            audit,
            auditHint: `Comentarista: ${commentator}. Doctrina: ${(audit.doctrine || []).join(", ")}. Léxico: ${audit.lexicon}.`,
            guardrail: `${FILTRO_INERRANCIA} Asistente exegético bajo autoridad de las Escrituras y comentarios clásicos. No es consejería pastoral.`,
            systemPromptAddendum: FILTRO_INERRANCIA,
        };
    }

    /** Normaliza para matching de libros (sin acentos, minúsculas, sin espacios extras). */
    function packBookName(s) {
        return String(s || "")
            .normalize("NFD")
            .replace(/[\u0300-\u036f]/g, "")
            .toLowerCase()
            .replace(/[^a-z0-9]+/g, "");
    }

    const BOOK_ALIASES = {
        gen: "Génesis",
        gn: "Génesis",
        genesis: "Génesis",
        exo: "Éxodo",
        ex: "Éxodo",
        exodo: "Éxodo",
        lev: "Levítico",
        lv: "Levítico",
        levitico: "Levítico",
        num: "Números",
        nm: "Números",
        numeros: "Números",
        deut: "Deuteronomio",
        dt: "Deuteronomio",
        deuteronomio: "Deuteronomio",
        jos: "Josué",
        josue: "Josué",
        jue: "Jueces",
        jc: "Jueces",
        jueces: "Jueces",
        rut: "Rut",
        "1sam": "1 Samuel",
        "1samuel": "1 Samuel",
        "2sam": "2 Samuel",
        "2samuel": "2 Samuel",
        "1re": "1 Reyes",
        "1reyes": "1 Reyes",
        "2re": "2 Reyes",
        "2reyes": "2 Reyes",
        "1cr": "1 Crónicas",
        "1cronicas": "1 Crónicas",
        "2cr": "2 Crónicas",
        "2cronicas": "2 Crónicas",
        esd: "Esdras",
        esdras: "Esdras",
        neh: "Nehemías",
        nehemias: "Nehemías",
        est: "Ester",
        ester: "Ester",
        job: "Job",
        sal: "Salmos",
        salmo: "Salmos",
        salmos: "Salmos",
        ps: "Salmos",
        prov: "Proverbios",
        pr: "Proverbios",
        proverbios: "Proverbios",
        ecl: "Eclesiastés",
        ec: "Eclesiastés",
        eclesiastes: "Eclesiastés",
        cant: "Cantares",
        ct: "Cantares",
        cantares: "Cantares",
        is: "Isaías",
        isa: "Isaías",
        isaias: "Isaías",
        jer: "Jeremías",
        jr: "Jeremías",
        jeremias: "Jeremías",
        lam: "Lamentaciones",
        lamentaciones: "Lamentaciones",
        ez: "Ezequiel",
        eze: "Ezequiel",
        ezequiel: "Ezequiel",
        dn: "Daniel",
        dan: "Daniel",
        daniel: "Daniel",
        os: "Oseas",
        oseas: "Oseas",
        jl: "Joel",
        joel: "Joel",
        am: "Amós",
        amos: "Amós",
        abd: "Abdías",
        abdias: "Abdías",
        jon: "Jonás",
        jonas: "Jonás",
        miq: "Miqueas",
        miqueas: "Miqueas",
        nah: "Nahúm",
        nahum: "Nahúm",
        hab: "Habacuc",
        habacuc: "Habacuc",
        sof: "Sofonías",
        sofonias: "Sofonías",
        hag: "Hageo",
        hageo: "Hageo",
        zac: "Zacarías",
        zacarias: "Zacarías",
        mal: "Malaquías",
        malaquias: "Malaquías",
        mt: "Mateo",
        mat: "Mateo",
        mateo: "Mateo",
        mc: "Marcos",
        mr: "Marcos",
        marcos: "Marcos",
        lc: "Lucas",
        luc: "Lucas",
        lucas: "Lucas",
        jn: "Juan",
        juan: "Juan",
        hch: "Hechos",
        hech: "Hechos",
        hechos: "Hechos",
        acts: "Hechos",
        ro: "Romanos",
        rom: "Romanos",
        romanos: "Romanos",
        "1cor": "1 Corintios",
        "1co": "1 Corintios",
        "1corintios": "1 Corintios",
        "2cor": "2 Corintios",
        "2co": "2 Corintios",
        "2corintios": "2 Corintios",
        gal: "Gálatas",
        galatas: "Gálatas",
        ef: "Efesios",
        efe: "Efesios",
        efesios: "Efesios",
        fil: "Filipenses",
        flp: "Filipenses",
        filipenses: "Filipenses",
        col: "Colosenses",
        colosenses: "Colosenses",
        "1tes": "1 Tesalonicenses",
        "1ts": "1 Tesalonicenses",
        "1tesalonicenses": "1 Tesalonicenses",
        "2tes": "2 Tesalonicenses",
        "2ts": "2 Tesalonicenses",
        "2tesalonicenses": "2 Tesalonicenses",
        "1tim": "1 Timoteo",
        "1ti": "1 Timoteo",
        "1timoteo": "1 Timoteo",
        "2tim": "2 Timoteo",
        "2ti": "2 Timoteo",
        "2timoteo": "2 Timoteo",
        tit: "Tito",
        tito: "Tito",
        flm: "Filemón",
        filemon: "Filemón",
        heb: "Hebreos",
        hebreos: "Hebreos",
        stg: "Santiago",
        sant: "Santiago",
        santiago: "Santiago",
        "1pe": "1 Pedro",
        "1pedro": "1 Pedro",
        "2pe": "2 Pedro",
        "2pedro": "2 Pedro",
        "1jn": "1 Juan",
        "1juan": "1 Juan",
        "2jn": "2 Juan",
        "2juan": "2 Juan",
        "3jn": "3 Juan",
        "3juan": "3 Juan",
        jud: "Judas",
        judas: "Judas",
        ap: "Apocalipsis",
        apoc: "Apocalipsis",
        apocalipsis: "Apocalipsis",
        rev: "Apocalipsis",
    };

    function canonBookList() {
        const fromData = global.RV_DATA?.LIBROS || [];
        if (fromData.length) return fromData.map((b) => b.n);
        return [...(global.LIBROS_AT || []), ...(global.LIBROS_NT || [])].map((b) => b.n);
    }

    /**
     * Extrae libro/capítulo/versículo de la consulta del usuario.
     * @returns {string|null} referencia canónica (p. ej. "Juan 3:16") o null
     */
    function detectPassageFromQuery(text) {
        const raw = String(text || "").trim();
        if (!raw) return null;

        const books = canonBookList();
        const catalog = new Map(); // packed → canonical name
        books.forEach((name) => catalog.set(packBookName(name), name));
        Object.entries(BOOK_ALIASES).forEach(([alias, name]) => {
            if (!catalog.has(alias)) catalog.set(alias, name);
        });

        // Candidatos: nombre canónico + alias legibles (con espacios / números).
        const labels = new Map(); // label lower → canonical
        catalog.forEach((name) => {
            labels.set(name.toLowerCase(), name);
            labels.set(packBookName(name), name);
        });
        Object.entries(BOOK_ALIASES).forEach(([alias, name]) => {
            labels.set(alias, name);
            // Variantes tipográficas frecuentes: "1 Juan", "1juan"
            if (/^[123]/.test(alias)) {
                const spaced = alias.replace(/^([123])/, "$1 ");
                labels.set(spaced, name);
            }
        });

        const sortedLabels = [...labels.keys()].sort((a, b) => b.length - a.length);
        for (const label of sortedLabels) {
            if (!label || label.length < 2) continue;
            const esc = label.replace(/[.*+?^${}()|[\]\\]/g, "\\$&").replace(/\s+/g, "\\s*");
            const re = new RegExp(
                `(?:^|[^\\p{L}\\p{N}])(${esc})\\s+(\\d{1,3})(?:\\s*[:.,]\\s*(\\d{1,3})(?:\\s*[-–]\\s*\\d{1,3})?)?(?=$|[^\\d])`,
                "iu"
            );
            const m = raw.match(re);
            if (!m) continue;
            const name = labels.get(label) || labels.get(packBookName(label));
            const cap = Number(m[2]);
            const verse = m[3] ? Number(m[3]) : null;
            if (!name || !cap || cap < 1) continue;
            return verse ? `${name} ${cap}:${verse}` : `${name} ${cap}`;
        }

        // Sin match espaciado: no forzar heurísticas compactas (evita falsos positivos).
        return null;
    }

    /**
     * Actualiza el encabezado según modo + cita.
     * exegesis → RevelatiO IA · Cátedra Exegética [Cita]
     * vida → RevelatiO IA · Renovación & Vida
     */
    function syncPanelPassageTitle(queryText, mode = "vida") {
        const titleEl = document.getElementById("rv-ia-panel-title");
        const kickerEl = document.getElementById("rv-ia-panel-kicker");
        const panel = document.getElementById("panel-asistente-ia");
        const hint = document.getElementById("rv-ia-context-hint");
        const q = String(queryText || "").trim();
        const detected = q ? detectPassageFromQuery(q) : null;
        const active = getStudyContext().reference || "";
        const resolvedMode = mode === "exegesis" ? "exegesis" : "vida";

        let label = "RevelatiO IA";
        let hintHtml = "";

        if (resolvedMode === "exegesis") {
            const cita = detected || active;
            label = cita
                ? `RevelatiO IA · Cátedra Exegética · ${cita}`
                : "RevelatiO IA · Cátedra Exegética";
            hintHtml = cita
                ? `Cátedra activa: <strong>${escapeHtml(cita)}</strong>`
                : "Cátedra Exegética · abre un pasaje o cita uno en la consulta.";
            if (kickerEl) kickerEl.textContent = "Estudio Profundo · histórico-gramatical";
        } else {
            label = "RevelatiO IA · Renovación & Vida";
            hintHtml = detected
                ? `Consulta vital · anclaje detectado: <strong>${escapeHtml(detected)}</strong>`
                : active
                  ? `Renovación & Vida · anclaje opcional: <strong>${escapeHtml(active)}</strong>`
                  : "Renovación & Vida · crisis diaria anclada en la Palabra";
            if (kickerEl) kickerEl.textContent = "Motor de transformación · metanoia";
        }

        if (titleEl) titleEl.textContent = label;
        if (panel) panel.setAttribute("aria-label", label);
        if (hint) {
            hint.hidden = false;
            hint.innerHTML = hintHtml;
        }

        return {
            mode: resolvedMode,
            label,
            reference: detected || active || "",
            detected,
            pastoral: resolvedMode === "vida",
        };
    }

    function paintContextHint() {
        const hint = document.getElementById("rv-ia-context-hint");
        if (!hint) return;
        const mode = RV.ai?.currentMode || "exegesis";
        syncPanelPassageTitle("", mode);
    }

    function finalizeAssistantReply(wrap, body, text, ctx) {
        const acc = String(text || "").trim();
        const mode = ctx?.mode === "exegesis" ? "exegesis" : "vida";
        body.className = "rv-ia-md";
        body.innerHTML = renderMarkdown(acc, mode);
        wrap.appendChild(buildTraceabilityPanel(ctx?.audit));
        wrap.appendChild(buildReplyActions(acc));
        return acc;
    }

    function setFormLoading(form, loading) {
        const btn = form?.querySelector('button[type="submit"]');
        const ta = form?.mensaje || form?.querySelector('[name="mensaje"]');
        if (btn) {
            btn.disabled = Boolean(loading);
            btn.classList.toggle("is-loading", Boolean(loading));
            btn.setAttribute("aria-busy", loading ? "true" : "false");
            if (loading) {
                if (!btn.dataset.labelIdle) btn.dataset.labelIdle = btn.innerHTML;
                btn.innerHTML = `<span class="rv-ia-spinner" aria-hidden="true"></span><span>Consultando RevelatiO…</span>`;
            } else if (btn.dataset.labelIdle) {
                btn.innerHTML = btn.dataset.labelIdle;
            }
        }
        if (ta) ta.disabled = Boolean(loading);
    }

    function showPanelError(body, message) {
        const msg = String(message || "No pude completar la consulta. Reintenta en un momento.").trim();
        body.className = "rv-ia-md rv-ia-error";
        body.innerHTML = `<div class="rv-ia-alert" role="alert">
            <strong>No se pudo completar la consulta</strong>
            <p>${escapeHtml(msg)}</p>
            <p class="rv-ia-alert-hint">La Palabra permanece. Revisa tu conexión o la clave de Gemini e inténtalo de nuevo.</p>
        </div>`;
    }

    function sendToNotebook(entry) {
        const payload = {
            texto: String(entry?.texto || "").trim(),
            referencia: String(entry?.referencia || "").trim(),
            tipo: entry?.tipo || "ia",
            titulo: entry?.titulo || "Respuesta RevelatiO IA",
            source: entry?.source || "ia",
        };
        if (!payload.texto) return false;
        if (typeof RV.ai?.onSendToNotebook === "function") {
            RV.ai.onSendToNotebook(payload);
            return true;
        }
        if (RV.storage?.addEntry) {
            RV.storage.addEntry(payload);
            RV.ui?.abrirCuaderno?.();
            return true;
        }
        if (typeof global.enviarAlCuaderno === "function") {
            global.enviarAlCuaderno(payload);
            return true;
        }
        return false;
    }

    function collectStrongCodes(versoNum) {
        const n = Number(versoNum || 0);
        const seen = new Set();
        const codes = [];
        const push = (s) => {
            const key = String(s || "")
                .toUpperCase()
                .replace(/^([GH])0+(\d+)$/, "$1$2");
            if (!/^[GH]\d{1,5}$/.test(key) || seen.has(key)) return;
            seen.add(key);
            codes.push(key);
        };
        if (n) {
            document
                .querySelectorAll(`#texto-biblico .rv-verse-surface[data-versiculo="${n}"] [data-strong]`)
                .forEach((el) => push(el.getAttribute("data-strong")));
            document.querySelectorAll(`#lista-strong-verso [data-strong]`).forEach((el) => push(el.getAttribute("data-strong")));
        }
        const original = global.__revelatioPassageData?.original;
        const verso = (original?.versos || []).find((v) => Number(v.verso || v.n || v.verse) === n);
        (verso?.tokens || []).forEach((t) => push(t.strong));
        return codes;
    }

    /**
     * Panel de auditoría obligatorio: Trazabilidad Exegética (acordeón).
     * Fuentes = datos duros del estudio activo, no invención libre del modelo.
     */
    function buildTraceabilityPanel(audit) {
        const a = audit || getStudyContext().audit || {};
        const doctrina = Array.isArray(a.doctrine) ? a.doctrine.join(" · ") : String(a.doctrine || "—");
        const details = document.createElement("details");
        details.className = "rv-ia-trace";
        details.open = false;
        details.innerHTML = `
            <summary class="rv-ia-trace-summary">
                <span class="rv-ia-trace-mark" aria-hidden="true">◈</span>
                Trazabilidad Exegética
                <span class="rv-ia-trace-badge">Fuentes consultadas</span>
            </summary>
            <div class="rv-ia-trace-body">
                <p class="rv-ia-trace-lead">Esta respuesta no es una alucinación libre: se ancla a datos duros del marco RevelatiO.</p>
                <dl class="rv-ia-trace-grid">
                    <div>
                        <dt>Autoridad / Comentarista base</dt>
                        <dd>${escapeHtml(a.commentator || "Matthew Henry")}</dd>
                    </div>
                    <div>
                        <dt>Doctrina aplicable</dt>
                        <dd>${escapeHtml(doctrina)}</dd>
                    </div>
                    <div>
                        <dt>Diccionario léxico consultado</dt>
                        <dd>${escapeHtml(a.lexicon || "Léxico Strong (hebreo/griego)")}</dd>
                    </div>
                    <div>
                        <dt>Pasaje / gobernanza</dt>
                        <dd>${escapeHtml(a.reference || "—")} · filtro de inerrancia activo</dd>
                    </div>
                </dl>
            </div>
        `;
        return details;
    }

    function ensureFabStyles(fab) {
        if (!fab) return;
        fab.classList.add("rv-fab", "rv-fab-omni", "rv-fab-brand");
        // Marca oficial: avatar circular + wordmark; posición fija inferior derecha
        fab.style.cssText = [
            "position:fixed !important",
            "right:1.5rem",
            "bottom:3rem",
            "z-index:40",
            "display:inline-flex",
            "align-items:center",
            "gap:0.5rem",
            "padding:0.375rem 1rem 0.375rem 0.375rem",
            "background:#0A192F",
            "border:2px solid #C59B27",
            "border-radius:9999px",
            "box-shadow:0 16px 40px rgba(0,0,0,0.45)",
            "opacity:1",
            "visibility:visible",
            "pointer-events:auto",
            "cursor:pointer",
        ].join(";");
        fab.hidden = false;
        fab.removeAttribute("hidden");
        const avatar = fab.querySelector("img, .rv-fab-avatar, .rv-ia-isotipo");
        if (avatar) {
            avatar.classList.add("rv-fab-avatar");
            avatar.style.cssText =
                "width:2.25rem;height:2.25rem;border-radius:9999px;object-fit:cover;flex-shrink:0;display:block;";
            if (!avatar.getAttribute("src") || /revelatio-mark\.png|symbol-new\.jpeg/.test(avatar.getAttribute("src") || "")) {
                avatar.setAttribute("src", "assets/branding/revelatio-symbol-master.jpeg");
            }
        }
        const name = fab.querySelector(".rv-ia-name");
        if (name) {
            name.style.cssText =
                "font-size:0.75rem;font-family:Cinzel,Georgia,serif;font-weight:700;color:#DFB743;letter-spacing:0.04em;white-space:nowrap;";
        }
    }

    function buildReplyActions(rawText) {
        const bar = document.createElement("div");
        bar.className = "rv-ia-reply-actions";
        bar.innerHTML = `
            <button type="button" data-ia-act="copy" title="Copiar">📋 Copiar</button>
            <button type="button" data-ia-act="share" title="Compartir">📤 Compartir</button>
            <button type="button" data-ia-act="notebook" title="Enviar al Cuaderno">📓 Enviar al Cuaderno</button>
            <button type="button" data-ia-act="listen" title="Escuchar">🔊 Escuchar</button>
        `;
        bar.addEventListener("click", async (event) => {
            const btn = event.target.closest("[data-ia-act]");
            if (!btn) return;
            const act = btn.getAttribute("data-ia-act");
            const text = String(rawText || "").trim();
            if (!text) return;
            if (act === "listen") {
                if (RV.audio?.speak) RV.audio.speak(text, { contextId: "ia", button: btn });
                else if (global.revelatioAudio?.narrar) global.revelatioAudio.narrar(text);
                return;
            }
            if (act === "copy") {
                try {
                    await navigator.clipboard.writeText(text);
                    btn.textContent = "✓ Copiado";
                    setTimeout(() => {
                        btn.textContent = "📋 Copiar";
                    }, 1200);
                } catch {
                    btn.textContent = "Error";
                }
                return;
            }
            if (act === "share") {
                const ctx = getStudyContext();
                const payload = `${ctx.reference}\n\n${text}\n\n— Éfata RevelatiO IA`;
                try {
                    if (navigator.share) {
                        await navigator.share({ title: `RevelatiO IA · ${ctx.reference}`, text: payload });
                        return;
                    }
                } catch { /* clipboard */ }
                try {
                    await navigator.clipboard.writeText(payload);
                    btn.textContent = "✓ Copiado";
                    setTimeout(() => {
                        btn.textContent = "📤 Compartir";
                    }, 1200);
                } catch {
                    const blob = new Blob([payload], { type: "text/plain;charset=utf-8" });
                    const a = document.createElement("a");
                    a.href = URL.createObjectURL(blob);
                    a.download = "revelatio-ia.txt";
                    a.click();
                    URL.revokeObjectURL(a.href);
                }
                return;
            }
            if (act === "notebook") {
                const ctx = getStudyContext();
                const titleEl = document.getElementById("rv-ia-panel-title");
                const fromTitle = String(titleEl?.textContent || "").replace(/^RevelatiO IA\s*·\s*/, "").trim();
                const ok = sendToNotebook({
                    texto: text,
                    referencia: fromTitle || ctx.reference,
                    tipo: "ia",
                    titulo: fromTitle
                        ? `RevelatiO IA · ${fromTitle}`
                        : `RevelatiO IA · ${ctx.reference || "Consulta"}`,
                    source: "ia",
                });
                btn.textContent = ok ? "✓ Enviado" : "Sin cuaderno";
                setTimeout(() => {
                    btn.textContent = "📓 Enviar al Cuaderno";
                }, 1400);
            }
        });
        return bar;
    }

    /**
     * Monta el asistente permanente (FAB + panel).
     * Separado de #rv-acompanamiento (Puerta II · Pastoral).
     */
    function mountPermanentAssistant(opts = {}) {
        if (global.__RV_AI_OMNI_WIRED__) return;
        const fab = document.getElementById("btn-asistente-ia");
        const panel = document.getElementById("panel-asistente-ia");
        const form = document.getElementById("form-asistente-ia");
        const log = document.getElementById("chat-ia-mensajes");
        if (!fab || !panel || !form || !log) return;
        global.__RV_AI_OMNI_WIRED__ = true;

        // Cerrado estricto al montar (evita panel incrustado en el home)
        panel.classList.remove("is-open");
        panel.setAttribute("hidden", "");
        panel.setAttribute("data-ia-closed", "1");
        panel.style.display = "none";
        panel.setAttribute("aria-hidden", "true");
        fab.setAttribute("aria-expanded", "false");
        document.getElementById("ai-modal")?.classList.remove("is-open");
        document.body.classList.remove("rv-ia-modal-open");

        if (typeof opts.onSendToNotebook === "function") {
            RV.ai.onSendToNotebook = opts.onSendToNotebook;
        }

        ensureFabStyles(fab);
        // No mostrar FAB en splash inicial; sí en dashboard/estudio/acompañamiento (estudio = exégesis).
        const syncFabVisibility = () => {
            ensureFabStyles(fab);
            const blocking = document.body.classList.contains("rv-splash-blocking");
            fab.style.display = blocking ? "none" : "inline-flex";
        };
        syncFabVisibility();
        document.addEventListener("rv:route", syncFabVisibility);
        setInterval(syncFabVisibility, 2000);

        const history = [];
        let lastAssistant = "";
        let currentMode = opts.initialMode === "vida" ? "vida" : "exegesis";
        RV.ai.currentMode = currentMode;

        const setMode = (mode, { syncTitle = true } = {}) => {
            currentMode = mode === "vida" ? "vida" : "exegesis";
            RV.ai.currentMode = currentMode;
            panel.dataset.mode = currentMode;
            document.querySelectorAll("[data-ia-mode]").forEach((tab) => {
                const on = tab.getAttribute("data-ia-mode") === currentMode;
                tab.classList.toggle("is-active", on);
                tab.setAttribute("aria-selected", on ? "true" : "false");
            });
            if (form.mensaje) {
                form.mensaje.placeholder =
                    currentMode === "exegesis"
                        ? "Consulta exegética al pasaje o cita…"
                        : "Crisis, hábito o decisión: plantea tu consulta vital…";
            }
            if (syncTitle) syncPanelPassageTitle(form.mensaje?.value || "", currentMode);
        };

        const syncBackdrop = (open) => {
            const backdrop = document.getElementById("ai-modal");
            document.body.classList.toggle("rv-ia-modal-open", open);
            if (!backdrop) return;
            backdrop.classList.toggle("is-open", open);
            backdrop.classList.toggle("hidden", !open);
            if (open) {
                backdrop.removeAttribute("hidden");
                backdrop.style.display = "block";
                backdrop.setAttribute("aria-hidden", "false");
            } else {
                backdrop.setAttribute("hidden", "");
                backdrop.style.display = "none";
                backdrop.setAttribute("aria-hidden", "true");
            }
        };

        const openPanel = (prefill, modeOverride) => {
            panel.classList.add("is-open");
            panel.removeAttribute("hidden");
            panel.removeAttribute("data-ia-closed");
            panel.style.display = "flex";
            panel.setAttribute("aria-hidden", "false");
            fab.setAttribute("aria-expanded", "true");
            syncBackdrop(true);
            if (modeOverride === "exegesis" || modeOverride === "vida") setMode(modeOverride);
            else setMode(currentMode);
            if (prefill && form.mensaje) {
                form.mensaje.value = prefill;
                form.mensaje.focus();
            } else {
                setTimeout(() => form.mensaje?.focus?.(), 40);
            }
            syncPanelPassageTitle(prefill || "", currentMode);
        };

        const closePanel = (event) => {
            if (event) {
                event.preventDefault?.();
                event.stopPropagation?.();
                if (typeof event.stopImmediatePropagation === "function") event.stopImmediatePropagation();
            }
            panel.classList.remove("is-open");
            panel.setAttribute("hidden", "");
            panel.setAttribute("data-ia-closed", "1");
            panel.style.display = "none";
            panel.setAttribute("aria-hidden", "true");
            fab.setAttribute("aria-expanded", "false");
            syncBackdrop(false);
        };

        // API global pedida por landing / chips
        global.openAiModal = (mode = "exegesis", presetPrompt = "") => {
            openPanel(presetPrompt || "", mode === "vida" ? "vida" : "exegesis");
        };
        global.closeAiModal = () => closePanel();

        fab.addEventListener("click", (event) => {
            event.preventDefault();
            event.stopPropagation();
            if (panel.classList.contains("is-open")) closePanel(event);
            else openPanel();
        });

        const bindClose = (btn) => {
            if (!btn || btn.dataset.rvIaCloseBound === "1") return;
            btn.dataset.rvIaCloseBound = "1";
            btn.addEventListener("click", closePanel);
        };
        bindClose(document.getElementById("btn-cerrar-ia"));
        bindClose(document.getElementById("btn-close-ai-modal"));

        // Delegación: sobrevive a re-inyección del overlay
        if (!global.__RV_AI_CLOSE_DELEGATE__) {
            global.__RV_AI_CLOSE_DELEGATE__ = true;
            document.addEventListener(
                "click",
                (event) => {
                    const btn = event.target?.closest?.("#btn-cerrar-ia, #btn-close-ai-modal, [data-ia-close]");
                    const backdropHit = event.target?.id === "ai-modal";
                    if (!btn && !backdropHit) return;
                    const openPanelEl = document.getElementById("panel-asistente-ia");
                    if (!openPanelEl?.classList.contains("is-open")) return;
                    event.preventDefault();
                    event.stopPropagation();
                    openPanelEl.classList.remove("is-open");
                    openPanelEl.setAttribute("hidden", "");
                    openPanelEl.setAttribute("data-ia-closed", "1");
                    openPanelEl.style.display = "none";
                    openPanelEl.setAttribute("aria-hidden", "true");
                    document.getElementById("btn-asistente-ia")?.setAttribute("aria-expanded", "false");
                    const backdrop = document.getElementById("ai-modal");
                    if (backdrop) {
                        backdrop.classList.remove("is-open");
                        backdrop.classList.add("hidden");
                        backdrop.setAttribute("hidden", "");
                        backdrop.style.display = "none";
                        backdrop.setAttribute("aria-hidden", "true");
                    }
                    document.body.classList.remove("rv-ia-modal-open");
                },
                true
            );
            document.addEventListener("keydown", (event) => {
                if (event.key !== "Escape") return;
                if (typeof global.closeAiModal === "function") global.closeAiModal();
            });
        }

        document.querySelectorAll("[data-ia-mode]").forEach((tab) => {
            tab.addEventListener("click", () => setMode(tab.getAttribute("data-ia-mode")));
        });

        document.addEventListener("revelatio:ask-ai", (event) => {
            const prompt = event.detail?.prompt || event.detail?.text || "";
            const mode = event.detail?.mode;
            openPanel(prompt, mode);
            if (event.detail?.autoSubmit && prompt) {
                setTimeout(() => form.requestSubmit?.(), 80);
            }
        });

        // Chips de acceso rápido (dashboard / sidebar)
        if (!global.__RV_AI_CHIPS_WIRED__) {
            global.__RV_AI_CHIPS_WIRED__ = true;
            document.addEventListener(
                "click",
                (event) => {
                    const chip = event.target?.closest?.("[data-rv-chip]");
                    if (!chip) return;
                    event.preventDefault();
                    const prompt = chip.getAttribute("data-prompt") || chip.textContent || "";
                    const mode = chip.getAttribute("data-mode") === "exegesis" ? "exegesis" : "vida";
                    document.dispatchEvent(
                        new CustomEvent("revelatio:ask-ai", {
                            detail: { prompt: String(prompt).trim(), mode },
                        })
                    );
                },
                true
            );
            document.getElementById("rv-home-quick-go")?.addEventListener("click", () => {
                const prompt = String(document.getElementById("rv-home-quick-prompt")?.value || "").trim();
                if (!prompt) return;
                const mode = isPastoralVitalQuery(prompt) || !detectPassageFromQuery(prompt) ? "vida" : "exegesis";
                document.dispatchEvent(
                    new CustomEvent("revelatio:ask-ai", { detail: { prompt, mode } })
                );
            });
        }

        document.addEventListener("revelatio:verse-study", () => paintContextHint());
        document.addEventListener("rv:route", () => {
            if (panel.classList.contains("is-open")) paintContextHint();
        });

        const addUserMsg = (content) => {
            const el = document.createElement("div");
            el.className = "rv-ia-msg rv-ia-msg-user";
            el.textContent = content;
            log.appendChild(el);
            log.scrollTop = log.scrollHeight;
            return el;
        };

        const addAssistantShell = () => {
            const wrap = document.createElement("div");
            wrap.className = "rv-ia-msg rv-ia-msg-bot";
            const body = document.createElement("div");
            body.className = "rv-ia-md";
            body.textContent = "…";
            wrap.appendChild(body);
            log.appendChild(wrap);
            log.scrollTop = log.scrollHeight;
            return { wrap, body };
        };

        setMode(currentMode, { syncTitle: false });

        form.addEventListener("submit", async (event) => {
            event.preventDefault();
            if (form.dataset.busy === "1") return;
            const message = String(form.mensaje?.value || "").trim();
            if (message.length < 2) return;

            // Auto-ajuste suave: cita bíblica en modo vida → sugerir exegesis si el usuario no forzó
            if (currentMode === "vida" && detectPassageFromQuery(message) && !isPastoralVitalQuery(message)) {
                /* keep vida unless clearly exegetical request */
                if (/\b(ex[eé]gesis|strong|l[eé]xico|hermen[eé]utica|gramatical)\b/i.test(message)) {
                    setMode("exegesis", { syncTitle: false });
                }
            }

            log.querySelector(".rv-ia-welcome")?.classList.add("is-hidden");
            form.mensaje.value = "";
            addUserMsg(message);
            history.push({ role: "user", content: message });
            const { wrap, body } = addAssistantShell();

            const titleState = syncPanelPassageTitle(message, currentMode);
            const ctx = getStudyContext();
            const detected = titleState.detected || detectPassageFromQuery(message);
            const effectiveRef = detected || ctx.reference || "";
            const ctxForApi = {
                ...ctx,
                mode: currentMode,
                reference: effectiveRef,
                audit: {
                    ...ctx.audit,
                    reference: effectiveRef || titleState.label,
                    mode: currentMode,
                },
                auditHint:
                    currentMode === "exegesis"
                        ? `Cátedra Exegética. Pasaje: ${effectiveRef || "—"}. Comentarista: ${ctx.commentator}.`
                        : `Renovación & Vida. Anclaje: ${effectiveRef || "—"}.`,
            };

            form.dataset.busy = "1";
            setFormLoading(form, true);
            body.className = "rv-ia-md rv-ia-loading";
            body.innerHTML = `<div class="rv-ia-loading-row" aria-live="polite">
                <span class="rv-ia-spinner" aria-hidden="true"></span>
                <span>${currentMode === "exegesis" ? "Cátedra Exegética en curso…" : "Renovación & Vida en curso…"}</span>
            </div>`;

            try {
                const apiContext = {
                    ...ctxForApi,
                    module: currentMode === "exegesis" ? "CatedraExegesis" : "RenovacionVida",
                    invisiblePromptSeed: FILTRO_INERRANCIA,
                    audit: ctxForApi.audit,
                    auditHint: ctxForApi.auditHint,
                };

                const result = await agenteTeologico({
                    prompt: message,
                    contextPassage: effectiveRef,
                    mode: currentMode,
                    context: apiContext,
                    history,
                });

                const acc = String(result.data || result.text || "").trim();
                if (!acc) {
                    showPanelError(body, "El Agente no devolvió contenido. Reintenta en un momento.");
                    return;
                }
                lastAssistant = finalizeAssistantReply(wrap, body, acc, {
                    ...ctxForApi,
                    mode: result.mode || currentMode,
                    audit: result.audit || ctxForApi.audit,
                });
                history.push({ role: "assistant", content: lastAssistant });
                log.scrollTop = log.scrollHeight;
            } catch (err) {
                showPanelError(
                    body,
                    String(err?.message || "").trim() ||
                        "No pude contactar al Agente Teológico. La Palabra permanece; reintenta en un momento."
                );
                console.warn("[revelatio] agente-teologico", err);
            } finally {
                form.dataset.busy = "0";
                setFormLoading(form, false);
            }
        });

        const notebookBtn = document.getElementById("ia-enviar-cuaderno");
        notebookBtn?.addEventListener("click", () => {
            const text = String(lastAssistant || "").trim();
            if (!text) {
                notebookBtn.textContent = "No hay respuesta aún";
                setTimeout(() => {
                    notebookBtn.textContent = "Enviar última respuesta al Cuaderno";
                }, 1600);
                return;
            }
            const ctx = getStudyContext();
            const titleEl = document.getElementById("rv-ia-panel-title");
            const fromTitle = String(titleEl?.textContent || "").replace(/^RevelatiO IA\s*·\s*/, "").trim();
            const ok = sendToNotebook({
                texto: text,
                referencia: fromTitle || ctx.reference,
                tipo: "ia",
                titulo: fromTitle
                    ? `RevelatiO IA · ${fromTitle}`
                    : `RevelatiO IA · ${currentMode === "exegesis" ? "Cátedra Exegética" : "Renovación & Vida"}`,
                source: "ia",
                mode: currentMode,
            });
            const idle = "Enviar última respuesta al Cuaderno";
            notebookBtn.textContent = ok ? "✓ Guardado en el Cuaderno" : "No se pudo guardar";
            setTimeout(() => {
                notebookBtn.textContent = idle;
            }, 1800);
            if (ok) RV.ui?.abrirCuaderno?.();
        });

        RV.ai.open = openPanel;
        RV.ai.close = closePanel;
        RV.ai.setMode = setMode;
        RV.ai.getStudyContext = getStudyContext;
        RV.ai.renderMarkdown = renderMarkdown;
        RV.ai.sendToNotebook = sendToNotebook;
        RV.ai.getMode = () => currentMode;
    }

    RV.ai = Object.assign(RV.ai || {}, {
        authToken,
        readStream,
        chatGlobal,
        agenteTeologico,
        synthesizePerspectives,
        getStudyContext,
        detectPassageFromQuery,
        syncPanelPassageTitle,
        isPastoralVitalQuery,
        sendToNotebook,
        renderMarkdown,
        buildTraceabilityPanel,
        finalizeAssistantReply,
        FILTRO_INERRANCIA,
        mountPermanentAssistant,
        escapeHtml,
    });
})(typeof window !== "undefined" ? window : globalThis);
