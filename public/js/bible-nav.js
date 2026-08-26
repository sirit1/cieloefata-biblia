/**
 * Éfata RevelatiO — bible-nav.js
 * Navegador dinámico Libro → Capítulo → Versículo (+ versión).
 * La carga del texto usa revelatioLectura.fetchPasaje (Bolls + contingencia Agente RVR1909).
 */
(function (global) {
    "use strict";

    const RV = (global.RV = global.RV || {});
    const LS_VERSION = "revelatio_version";
    const COLORS_STEP = { books: 1, chapters: 2, verses: 3 };

    const VERSION_OPTS = [
        { id: "RVR1960", label: "Reina-Valera 1960" },
        { id: "NVI", label: "Nueva Versión Internacional" },
        { id: "DHH", label: "Dios Habla Hoy" },
        { id: "TLA", label: "Traducción en Lenguaje Actual" },
    ];

    function books() {
        return {
            at: global.LIBROS_AT || [],
            nt: global.LIBROS_NT || [],
        };
    }

    /** Normalización canónica: inmune a mayúsculas y tildes (Sofonías → sofonias). */
    function normalizeBookName(name) {
        if (!name) return "";
        return String(name)
            .toLowerCase()
            .normalize("NFD")
            .replace(/[\u0300-\u036f]/g, "")
            .replace(/\s+/g, " ")
            .trim();
    }

    const OT_BOOKS_NORMALIZED = [
        "genesis", "exodo", "levitico", "numeros", "deuteronomio", "josue", "jueces", "rut",
        "1 samuel", "2 samuel", "1 reyes", "2 reyes", "1 cronicas", "2 cronicas", "esdras",
        "nehemias", "ester", "job", "salmos", "proverbios", "eclesiastes", "cantares", "cantar de los cantares",
        "isaias", "jeremias", "lamentaciones", "ezequiel", "daniel", "oseas", "joel", "amos",
        "abdias", "jonas", "miqueas", "nahum", "habacuc", "sofonias", "hageo", "zacarias", "malaquias",
    ];

    const NT_BOOKS_NORMALIZED = [
        "mateo", "marcos", "lucas", "juan", "hechos", "romanos", "1 corintios", "2 corintios",
        "galatas", "efesios", "filipenses", "colosenses", "1 tesalonicenses", "2 tesalonicenses",
        "1 timoteo", "2 timoteo", "tito", "filemon", "hebreos", "santiago", "1 pedro", "2 pedro",
        "1 juan", "2 juan", "3 juan", "judas", "apocalipsis",
    ];

    const OT_ALIASES = {
        gen: "genesis",
        exo: "exodo",
        lev: "levitico",
        num: "numeros",
        deut: "deuteronomio",
        dt: "deuteronomio",
        jos: "josue",
        jdg: "jueces",
        "1sam": "1 samuel",
        "2sam": "2 samuel",
        "1re": "1 reyes",
        "2re": "2 reyes",
        "1cr": "1 cronicas",
        "2cr": "2 cronicas",
        neh: "nehemias",
        ps: "salmos",
        psalm: "salmos",
        psalms: "salmos",
        prov: "proverbios",
        ecc: "eclesiastes",
        ecclesiastes: "eclesiastes",
        song: "cantares",
        "song of solomon": "cantar de los cantares",
        isa: "isaias",
        jer: "jeremias",
        lam: "lamentaciones",
        eze: "ezequiel",
        ezekiel: "ezequiel",
        dan: "daniel",
        hos: "oseas",
        oba: "abdias",
        jon: "jonas",
        mic: "miqueas",
        nah: "nahum",
        hab: "habacuc",
        zep: "sofonias",
        zephaniah: "sofonias",
        hag: "hageo",
        zec: "zacarias",
        mal: "malaquias",
    };

    function canonBookKey(bookName) {
        const norm = normalizeBookName(bookName);
        if (!norm) return "";
        const packed = norm.replace(/[^a-z0-9]/g, "");
        if (OT_ALIASES[norm]) return OT_ALIASES[norm];
        if (OT_ALIASES[packed]) return OT_ALIASES[packed];
        return norm;
    }

    function isOldTestament(bookName) {
        const key = canonBookKey(bookName);
        if (!key) return false;
        if (OT_BOOKS_NORMALIZED.includes(key)) return true;
        const packed = key.replace(/[^a-z0-9]/g, "");
        return OT_BOOKS_NORMALIZED.some((b) => b.replace(/[^a-z0-9]/g, "") === packed);
    }

    function isNewTestament(bookName) {
        const key = normalizeBookName(bookName);
        if (!key) return false;
        if (isOldTestament(bookName)) return false;
        if (NT_BOOKS_NORMALIZED.includes(key)) return true;
        const packed = key.replace(/[^a-z0-9]/g, "");
        return NT_BOOKS_NORMALIZED.some((b) => b.replace(/[^a-z0-9]/g, "") === packed);
    }

    function resolveTestamento(bookName, hint) {
        if (isOldTestament(bookName)) return "at";
        if (isNewTestament(bookName)) return "nt";
        if (hint === "at" || hint === "nt") return hint;
        return "at";
    }

    const FULL_BIBLE_VERSIONS = new Set([
        "rv1960", "dhh", "tla", "nvi",
    ]);

    function isFullBibleVersion(version) {
        const v = String(version || "").toLowerCase();
        return FULL_BIBLE_VERSIONS.has(v) || (!isSeptuagintaVersion(v) && v.length > 0);
    }

    function isSeptuagintaVersion(version) {
        const v = String(version || "").toLowerCase();
        return v === "septuaginta" || v === "lxx" || v === "textual" || v === "rahlfs";
    }

    function norm(s) {
        return normalizeBookName(s);
    }

    function verseCount(bookName, cap) {
        const map = global.RV_DATA?.VERSOS_CAP || {};
        const arr = map[bookName];
        if (!arr) return 50;
        return Number(arr[Number(cap) - 1]) || 30;
    }

    function ensureModal() {
        if (typeof document === "undefined" || typeof document.createElement !== "function") return null;
        let root = document.getElementById("rv-bible-nav");
        if (root) return root;
        root = document.createElement("div");
        root.id = "rv-bible-nav";
        root.className = "rv-bible-nav";
        root.hidden = true;
        root.setAttribute("role", "dialog");
        root.setAttribute("aria-modal", "true");
        root.setAttribute("aria-label", "Ir a pasaje");
        root.innerHTML = `
            <div class="rv-bible-nav-panel">
                <header class="rv-bible-nav-head">
                    <div>
                        <p class="rv-bible-nav-kicker">Navegación bíblica</p>
                        <h2 id="rv-bible-nav-title">Elegir libro</h2>
                    </div>
                    <button type="button" class="rv-bible-nav-close" data-bnav-close aria-label="Cerrar">✕</button>
                </header>
                <div class="rv-bible-nav-toolbar">
                    <button type="button" data-bnav-back class="rv-bible-nav-back" hidden>← Atrás</button>
                    <input type="search" id="rv-bible-nav-filter" placeholder="Filtrar libros…" autocomplete="off">
                    <label class="rv-bible-nav-ver">
                        <span>Versión</span>
                        <select id="rv-bible-nav-version" aria-label="Versión bíblica">
                            ${VERSION_OPTS.map((v) => `<option value="${v.id}">${v.label}</option>`).join("")}
                        </select>
                    </label>
                </div>
                <div id="rv-bible-nav-body" class="rv-bible-nav-body canon-scroll"></div>
            </div>`;
        document.body.appendChild(root);
        return root;
    }

    async function loadChapter(book, chapter, version) {
        const libro = String(book || "").trim();
        const cap = Number(chapter) || 1;
        const verRaw = String(
            version ||
                document.getElementById("selector-version")?.value ||
                localStorage.getItem(LS_VERSION) ||
                "rv1960"
        ).toLowerCase();
        const mapped =
            verRaw === "textual" || verRaw === "lxx" || verRaw === "rahlfs"
                ? "septuaginta"
                : verRaw === "rv1909"
                  ? "rv1960"
                  : verRaw || "rv1960";

        // Arquitectura desacoplada: State → View (sin pintar DOM aquí)
        if (global.RV?.AppState?.setPassage) {
            const uiVer =
                mapped === "septuaginta"
                    ? "septuaginta"
                    : mapped === "rv1960"
                      ? "RVR1960"
                      : mapped;
            await global.RV.AppState.setPassage(libro, cap, uiVer);
            return {
                libro,
                cap,
                version: mapped,
                ok: true,
                delegated: true,
                testamento: resolveTestamento(libro),
            };
        }

        const container = document.getElementById("verses-container");
        if (!container) {
            console.error("No se encontró #verses-container en el DOM");
            return { ok: false, reason: "missing-container" };
        }
        const header = document.getElementById("chapter-header");
        // Compat: inyectar en #texto-biblico si vive dentro del contenedor
        const injectTarget =
            container.querySelector?.("#texto-biblico") ||
            document.getElementById("texto-biblico") ||
            container;

        const referencia = `${libro} ${cap}`;
        const bookIsOT = isOldTestament(libro);
        const bookIsNT = isNewTestament(libro);
        const lxxSelected = isSeptuagintaVersion(mapped) || isSeptuagintaVersion(verRaw);
        // LXX es válida para AT; en NT solo aviso (sin bloquear versiones completas).
        const lxxNtNotice =
            lxxSelected && bookIsNT && !bookIsOT
                ? `<p class="rv-lectura-note text-[13px] leading-relaxed text-[#0F172A]/85 mb-4 border-l-2 border-[#C59B27] pl-3">La Septuaginta (LXX / Rahlfs) cubre el Antiguo Testamento griego. Para <strong>${escapeHtml(libro)}</strong> (NT) cambia a texto griego original (Nestle-Aland / Textus Receptus) o a RVR1960.</p>`
                : "";

        if (header) {
            header.innerHTML = `
                <p id="chapter-title" class="rv-lectura-title mb-1 font-display text-3xl text-[#0F172A]">${escapeHtml(libro)} ${cap}</p>
                <p class="rv-lectura-meta text-[11px] tracking-[0.14em] text-[#0F172A]/75">Cargando ${escapeHtml(mapped.toUpperCase())}…</p>`;
        }
        if (injectTarget) {
            injectTarget.innerHTML = `<p class="rv-lectura-muted text-[#0F172A]">Abriendo el capítulo completo…</p>`;
        }

        let data = null;
        // Versiones completas (RVR, KJV, DHH, TLA, NBLA…): siempre intentar carga AT/NT.
        // Septuaginta + AT: carga válida. Septuaginta + NT: no bloquear; aviso + fallback.
        try {
            if (global.revelatioLectura?.fetchPasaje) {
                data = await global.revelatioLectura.fetchPasaje(referencia, {
                    version: mapped,
                    book: libro,
                    chapter: cap,
                    testamento: resolveTestamento(libro),
                });
            }
        } catch (err) {
            console.warn("[bible-nav] loadChapter", err);
        }

        if (data?.versionesVersos && global.revelatioLectura?.normalizarListaVersos) {
            for (const k of Object.keys(data.versionesVersos)) {
                data.versionesVersos[k] = global.revelatioLectura.normalizarListaVersos(data.versionesVersos[k]);
            }
        }
        global.__revelatioPassageData = data;
        global.__revelatioLibroActivo = {
            ...(global.__revelatioLibroActivo || {}),
            n: libro,
            cap,
            testamento: resolveTestamento(libro, global.__revelatioLibroActivo?.testamento),
        };

        const versos = pickVersesForRender(data, mapped, { preferLxx: lxxSelected && bookIsOT });

        if (header) {
            header.className = "mb-6 pb-2 border-b border-[#E8DFC8]";
            header.innerHTML = `
                <h1 class="text-3xl font-serif font-bold text-[#0A192F]">${escapeHtml(libro)} ${cap}</h1>
                <span class="text-xs font-serif font-semibold text-[#C59B27] tracking-wider uppercase">${escapeHtml((mapped || "RVR1960").toUpperCase())}</span>`;
        }

        const versesHtml = renderVersesHtml(versos, libro, cap, {
            lxx: lxxSelected && bookIsOT,
            pendingEs: lxxSelected && bookIsOT && versos.some((v) => !String(v.textoEs || "").trim()),
        });

        injectTarget.innerHTML = `${lxxNtNotice}${versesHtml}`;

        if (lxxSelected && bookIsOT) {
            completarLxxEspanol(libro, cap, data)
                .then((next) => {
                    if (!next) return;
                    global.__revelatioPassageData = next;
                    const withEs = pickVersesForRender(next, mapped, { preferLxx: true });
                    if (!withEs.length) return;
                    injectTarget.innerHTML = `${lxxNtNotice}${renderVersesHtml(withEs, libro, cap, { lxx: true, pendingEs: false })}`;
                })
                .catch(() => {});
        }

        // Selectores opcionales: no tumbar la carga
        document.getElementById("selector-autor")?.dispatchEvent?.(new Event("change", { bubbles: true }));
        document.getElementById("btn-study-panel")?.setAttribute?.("aria-busy", "false");
        document.querySelector?.("#selector-comentarista")?.dispatchEvent?.(new Event("change", { bubbles: true }));

        return {
            libro,
            cap,
            version: mapped,
            passage: data,
            testamento: resolveTestamento(libro),
            fullBible: isFullBibleVersion(mapped),
            ok: versos.length > 0,
        };
    }

    function escapeHtml(s) {
        return String(s || "").replace(/[&<>"']/g, (c) =>
            ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c])
        );
    }
    function escapeAttr(s) {
        return escapeHtml(s).replace(/`/g, "");
    }

    function renderVersesHtml(versos, libro, cap, opts = {}) {
        if (!versos?.length) {
            return opts.lxxNtEmpty
                ? ""
                : `<p class="rv-lectura-muted text-[#0F172A]">No se pudo obtener el texto de esta versión.</p>`;
        }
        const nota = opts.lxx
            ? (opts.pendingEs
                ? `<p class="rv-lectura-note text-[13px] leading-relaxed text-[#0F172A]/85 mb-4 border-l-2 border-[#C59B27] pl-3">Septuaginta (Rahlfs): capítulo griego completo (${versos.length} versículos). Traducción al español en curso…</p>`
                : `<p class="rv-lectura-note text-[13px] leading-relaxed text-[#0F172A]/85 mb-4 border-l-2 border-[#C59B27] pl-3">Septuaginta (Rahlfs): griego LXX completo y traducción al español de este griego, no de la Reina-Valera ni del texto masorético.</p>`)
            : "";
        const body = versos
            .map((v) => {
                const n = Number(v.n || v.number || 0);
                const text = String(v.texto || v.text || "").trim();
                const es = String(v.textoEs || v.textEs || "").trim();
                const ref = `${libro} ${cap}:${n}`;
                const esBlock = es ? `<span class="rv-lxx-es">${escapeHtml(es)}</span>` : "";
                return `<p class="rv-verse-surface" data-verse data-versiculo="${n}" data-reference="${escapeAttr(ref)}" tabindex="0" role="button" aria-label="Versículo ${n}">
                <span class="rv-verse-text"><sup class="rv-verse-num" style="color:#C59B27">${n}</sup><span style="color:#0F172A">${escapeHtml(text)}</span></span>
                ${esBlock}
            </p>`;
            })
            .join("");
        return `${nota}${body}`;
    }

    async function completarLxxEspanol(libro, cap, passage) {
        const actuales = passage?.versionesVersos?.septuaginta || [];
        const faltaEs = !actuales.length || actuales.some((v) => !String(v.textoEs || v.textEs || "").trim());
        if (!faltaEs) return passage;
        const ctrl = typeof AbortController !== "undefined" ? new AbortController() : null;
        const timer = ctrl ? setTimeout(() => ctrl.abort(), 90000) : null;
        try {
            const res = await fetch(
                `/api/bible?book=${encodeURIComponent(libro)}&chapter=${encodeURIComponent(cap)}&version=LXX`,
                { headers: { Accept: "application/json" }, signal: ctrl?.signal }
            );
            const json = await res.json().catch(() => null);
            const versos = json?.data?.versionesVersos?.septuaginta
                || (Array.isArray(json?.verses)
                    ? json.verses.map((v) => ({
                        n: v.verse || v.n,
                        texto: v.text || v.texto,
                        textoEs: v.textoEs || v.textEs || "",
                    }))
                    : []);
            if (!versos.length) return null;
            return {
                ...(passage || {}),
                versionesVersos: { ...(passage?.versionesVersos || {}), septuaginta: versos },
                versiones: {
                    ...(passage?.versiones || {}),
                    septuaginta: versos.map((v) => `${v.n} ${v.texto || v.text || ""}`).join(" "),
                },
            };
        } catch {
            return null;
        } finally {
            if (timer) clearTimeout(timer);
        }
    }

    function pickVersesForRender(data, version, opts = {}) {
        let key = version === "rv1909" ? "rv1960" : version;
        if (key === "textual" || key === "lxx" || key === "rahlfs") key = "septuaginta";
        const order = opts.preferLxx
            ? ["septuaginta", key, "rv1960", "nvi", "tla", "dhh"]
            : [key, "rv1960", "nvi", "tla", "dhh"];
        const seen = new Set();
        const normalizeList = global.revelatioLectura?.normalizarListaVersos;
        for (const k of order) {
            if (!k || seen.has(k)) continue;
            seen.add(k);
            let list = data?.versionesVersos?.[k];
            if (normalizeList) list = normalizeList(list || []);
            else {
                list = (list || [])
                    .map((v, i) => ({
                        n: Number(v.n || v.number || v.verse || i + 1),
                        texto: String(v.texto || v.text || v.content || v.body || "").trim(),
                        textoEs: String(v.textoEs || v.textEs || "").trim() || undefined,
                    }))
                    .filter((v) => v.n > 0 && v.texto && !/^(?:\.{1,6}|…+)$/.test(v.texto));
            }
            if (list?.length) return list;
            const bloque = data?.versiones?.[k];
            if (bloque && typeof bloque === "string" && bloque.trim() && !/^(?:\.{1,6}|…+)$/.test(bloque.trim())) {
                if (global.revelatioLectura?.partirVersiculos) {
                    const partidos = global.revelatioLectura.partirVersiculos(bloque);
                    if (partidos?.length) return partidos;
                }
            }
        }
        return [];
    }

    function navigateTo({ libro, cap, verso, version }) {
        if (version) {
            localStorage.setItem(LS_VERSION, version === "textual" ? "septuaginta" : version);
            const sel = document.getElementById("selector-version");
            if (sel) {
                const map = version === "textual" ? "septuaginta" : version === "rv1909" ? "rv1960" : version;
                if ([...sel.options].some((o) => o.value === map)) sel.value = map;
                sel.dispatchEvent(new Event("change", { bubbles: true }));
            }
        }
        const hash = verso
            ? `#lectura/${encodeURIComponent(libro)}/${cap}/${verso}`
            : `#lectura/${encodeURIComponent(libro)}/${cap}`;
        try {
            history.pushState({ revelatio: "lectura" }, "", `${location.pathname}${location.search || ""}${hash}`);
        } catch {
            /* ignore */
        }

        // Precarga con contingencia antes de pintar el visor
        const ver = version || localStorage.getItem(LS_VERSION) || "rv1960";
        loadChapter(libro, cap, ver).finally(() => {
            document.dispatchEvent(
                new CustomEvent("revelatio:goto", {
                    detail: { libro, cap: Number(cap), verso: verso ? Number(verso) : null, version: ver },
                })
            );
            try {
                const dest = { libro, cap: Number(cap), verso: verso ? Number(verso) : null };
                if (typeof global.RV?.estudio?.goto === "function") global.RV.estudio.goto(dest);
                else if (typeof global.entrarSantuario === "function") global.entrarSantuario(dest);
                else {
                    document.body.classList.add("is-santuario", "visor-active");
                    global.RV?.router?.show?.("estudio");
                    setTimeout(() => {
                        document.dispatchEvent(new CustomEvent("revelatio:ask-nav", { detail: dest }));
                    }, 200);
                }
            } catch (err) {
                console.warn("[bible-nav]", err);
            }
        });
    }

    function createController() {
        const root = ensureModal();
        if (!root) {
            return {
                open: () => {},
                close: () => {},
                navigateTo,
            };
        }
        const body = () => document.getElementById("rv-bible-nav-body");
        const title = () => document.getElementById("rv-bible-nav-title");
        const filter = () => document.getElementById("rv-bible-nav-filter");
        const backBtn = () => root.querySelector("[data-bnav-back]");
        const verSel = () => document.getElementById("rv-bible-nav-version");

        let step = COLORS_STEP.books;
        let book = null;
        let cap = null;

        const close = () => {
            root.hidden = true;
            root.classList.remove("is-open");
        };

        const open = (opts = {}) => {
            root.hidden = false;
            root.classList.add("is-open");
            const saved = localStorage.getItem(LS_VERSION) || "rv1960";
            if (verSel()) verSel().value = saved === "septuaginta" ? "textual" : saved;
            step = COLORS_STEP.books;
            book = opts.libro || null;
            cap = opts.cap || null;
            if (book && opts.cap) {
                step = COLORS_STEP.verses;
                cap = Number(opts.cap);
            } else if (book) {
                step = COLORS_STEP.chapters;
            }
            render();
            setTimeout(() => filter()?.focus(), 40);
        };

        function renderBooks() {
            const q = norm(filter()?.value || "");
            const { at, nt } = books();
            const paint = (list, label) => {
                const items = list.filter((b) => !q || norm(b.n).includes(q));
                if (!items.length) return "";
                return `<section class="rv-bnav-section"><h3>${label}</h3><div class="rv-bnav-grid rv-bnav-books">${items
                    .map(
                        (b) =>
                            `<button type="button" class="rv-bnav-item" data-bnav-book="${b.n}" data-caps="${b.c}">${b.n}</button>`
                    )
                    .join("")}</div></section>`;
            };
            body().innerHTML = paint(at, "Antiguo Testamento") + paint(nt, "Nuevo Testamento");
            title().textContent = "Elegir libro";
            backBtn().hidden = true;
            filter().hidden = false;
        }

        function renderChapters() {
            const n = Number(book?.c || book?.caps || 1);
            filter().hidden = true;
            backBtn().hidden = false;
            title().textContent = `${book.n} · Capítulo`;
            body().innerHTML = `<div class="rv-bnav-grid rv-bnav-nums">${Array.from({ length: n }, (_, i) => i + 1)
                .map((c) => `<button type="button" class="rv-bnav-item" data-bnav-cap="${c}">${c}</button>`)
                .join("")}</div>
                <button type="button" class="rv-bnav-full" data-bnav-cap-full>Abrir capítulo completo</button>`;
        }

        function renderVerses() {
            const total = verseCount(book.n, cap);
            filter().hidden = true;
            backBtn().hidden = false;
            title().textContent = `${book.n} ${cap} · Versículo`;
            body().innerHTML = `<div class="rv-bnav-grid rv-bnav-nums">${Array.from({ length: total }, (_, i) => i + 1)
                .map((v) => `<button type="button" class="rv-bnav-item" data-bnav-verse="${v}">${v}</button>`)
                .join("")}</div>
                <button type="button" class="rv-bnav-full" data-bnav-cap-full>Capítulo completo (sin verso)</button>`;
        }

        function render() {
            if (step === COLORS_STEP.books) renderBooks();
            else if (step === COLORS_STEP.chapters) renderChapters();
            else renderVerses();
        }

        root.addEventListener("click", (event) => {
            if (event.target === root || event.target.closest("[data-bnav-close]")) {
                close();
                return;
            }
            if (event.target.closest("[data-bnav-back]")) {
                if (step === COLORS_STEP.verses) {
                    step = COLORS_STEP.chapters;
                    cap = null;
                } else {
                    step = COLORS_STEP.books;
                    book = null;
                }
                render();
                return;
            }
            const bookBtn = event.target.closest("[data-bnav-book]");
            if (bookBtn) {
                book = { n: bookBtn.dataset.bnavBook, c: Number(bookBtn.dataset.caps) || 1 };
                step = COLORS_STEP.chapters;
                render();
                return;
            }
            const capBtn = event.target.closest("[data-bnav-cap]");
            if (capBtn) {
                cap = Number(capBtn.dataset.bnavCap);
                step = COLORS_STEP.verses;
                render();
                return;
            }
            if (event.target.closest("[data-bnav-cap-full]")) {
                const version = verSel()?.value || "rv1960";
                navigateTo({ libro: book.n, cap: cap || 1, version });
                close();
                return;
            }
            const verseBtn = event.target.closest("[data-bnav-verse]");
            if (verseBtn) {
                const version = verSel()?.value || "rv1960";
                navigateTo({
                    libro: book.n,
                    cap,
                    verso: Number(verseBtn.dataset.bnavVerse),
                    version,
                });
                close();
            }
        });

        filter()?.addEventListener("input", () => {
            if (step === COLORS_STEP.books) renderBooks();
        });

        document.addEventListener("keydown", (event) => {
            if (event.key === "Escape" && root.classList.contains("is-open")) close();
        });

        return { open, close, navigateTo };
    }

    let api = null;

    function mount() {
        if (api) return api;
        api = createController();
        document.addEventListener("click", (event) => {
            const btn = event.target.closest("#btn-bible-nav, [data-bible-nav]");
            if (!btn) return;
            event.preventDefault();
            const loc = global.__revelatioLibroActivo || {};
            api.open({ libro: loc.n, cap: loc.cap });
        });
        RV.bibleNav = Object.assign(api, {
            loadChapter,
            normalizeBookName,
            isOldTestament,
            isNewTestament,
            resolveTestamento,
        });
        return api;
    }

    RV.bibleNav = {
        mount,
        open: (...a) => mount().open(...a),
        close: () => mount().close(),
        loadChapter,
        normalizeBookName,
        isOldTestament,
        isNewTestament,
        resolveTestamento,
    };

    if (document.readyState === "loading") {
        document.addEventListener("DOMContentLoaded", () => mount());
    } else {
        mount();
    }
})(typeof window !== "undefined" ? window : globalThis);
