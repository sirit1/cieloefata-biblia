/**
 * Éfata RevelatiO — ai-engine.js
 * Asistente permanente RevelatiO IA: FAB, panel contextual, Markdown y acciones.
 * Módulo de estudio = asistente exegético (no sustituye Acompañamiento Ministerial).
 */
(function (global) {
    "use strict";

    const RV = (global.RV = global.RV || {});

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
        const headers = { "Content-Type": "application/json", Accept: "text/plain, application/json" };
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

    /** Markdown ligero → HTML seguro (sin HTML crudo del modelo). */
    function renderMarkdown(md) {
        let text = escapeHtml(String(md || ""));
        text = text.replace(/^### (.+)$/gm, "<h4>$1</h4>");
        text = text.replace(/^## (.+)$/gm, "<h3>$1</h3>");
        text = text.replace(/^# (.+)$/gm, "<h2>$1</h2>");
        text = text.replace(/\*\*(.+?)\*\*/g, "<strong>$1</strong>");
        text = text.replace(/\*(.+?)\*/g, "<em>$1</em>");
        text = text.replace(/`([^`]+)`/g, "<code>$1</code>");
        text = text.replace(/^[-*] (.+)$/gm, "<li>$1</li>");
        text = text.replace(/(?:<li>.*<\/li>\n?)+/g, (block) => `<ul>${block}</ul>`);
        text = text.replace(/\n{2,}/g, "</p><p>");
        text = text.replace(/\n/g, "<br>");
        return `<p>${text}</p>`;
    }

    /**
     * Contexto invisible para el prompt: verso activo del Aposento / Estudio.
     * No incluye lógica pastoral de Acompañamiento Ministerial.
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
        return {
            module: "EstudioProfundoExegesis",
            door: "estudio",
            reference,
            verse: n || null,
            verseText,
            verseMode,
            inStudy,
            version: localStorage.getItem("revelatio_version") || "rv1960",
            guardrail:
                "Asistente exegético y teológico bajo autoridad de las Escrituras y comentarios clásicos. No es consejería pastoral; el Acompañamiento Ministerial tiene su propia puerta.",
        };
    }

    function paintContextHint() {
        const hint = document.getElementById("rv-ia-context-hint");
        if (!hint) return;
        const ctx = getStudyContext();
        if (ctx.inStudy && ctx.reference) {
            hint.hidden = false;
            hint.innerHTML = ctx.verseText
                ? `Contexto activo: <strong>${escapeHtml(ctx.reference)}</strong>`
                : `Pasaje activo: <strong>${escapeHtml(ctx.reference)}</strong>`;
        } else {
            hint.hidden = false;
            hint.textContent = "Asistente de estudio · abre un pasaje para enriquecer el contexto.";
        }
    }

    function ensureFabStyles(fab) {
        if (!fab) return;
        fab.classList.add("rv-fab", "rv-fab-omni");
        fab.style.cssText = [
            "position:fixed !important",
            "right:1.15rem",
            "bottom:1.15rem",
            "z-index:999999",
            "display:inline-flex",
            "opacity:1",
            "visibility:visible",
            "pointer-events:auto",
        ].join(";");
        fab.hidden = false;
        fab.removeAttribute("hidden");
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
                const entry = {
                    texto: text,
                    referencia: ctx.reference,
                    tipo: "ia",
                    titulo: "Respuesta RevelatiO IA",
                    source: "ia",
                };
                if (typeof RV.ai?.onSendToNotebook === "function") {
                    RV.ai.onSendToNotebook(entry);
                } else if (RV.storage?.addEntry) {
                    RV.storage.addEntry(entry);
                    RV.ui?.abrirCuaderno?.();
                }
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

        const openPanel = (prefill) => {
            // Protección: si está en acompañamiento, el panel sigue siendo exegético
            // (no redirige al chat pastoral; esa puerta es independiente).
            panel.classList.add("is-open");
            panel.style.display = "flex";
            fab.setAttribute("aria-expanded", "true");
            paintContextHint();
            if (prefill && form.mensaje) {
                form.mensaje.value = prefill;
                form.mensaje.focus();
            } else {
                setTimeout(() => form.mensaje?.focus?.(), 40);
            }
        };

        const closePanel = () => {
            panel.classList.remove("is-open");
            fab.setAttribute("aria-expanded", "false");
        };

        fab.addEventListener("click", (event) => {
            event.preventDefault();
            event.stopPropagation();
            if (panel.classList.contains("is-open")) closePanel();
            else openPanel();
        });

        document.getElementById("btn-cerrar-ia")?.addEventListener("click", closePanel);

        document.addEventListener("revelatio:ask-ai", (event) => {
            const prompt = event.detail?.prompt || event.detail?.text || "";
            openPanel(prompt);
        });

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

        form.addEventListener("submit", async (event) => {
            event.preventDefault();
            const message = String(form.mensaje?.value || "").trim();
            if (message.length < 2) return;
            log.querySelector(".rv-ia-welcome")?.classList.add("is-hidden");
            form.mensaje.value = "";
            addUserMsg(message);
            history.push({ role: "user", content: message });
            const { wrap, body } = addAssistantShell();
            paintContextHint();
            const ctx = getStudyContext();
            try {
                const token = await authToken();
                const headers = { "Content-Type": "application/json", Accept: "text/plain, application/json" };
                if (token) headers.Authorization = `Bearer ${token}`;
                const res = await fetch("/api/chat-global", {
                    method: "POST",
                    headers,
                    body: JSON.stringify({
                        message,
                        context: {
                            ...ctx,
                            module: "EstudioProfundoExegesis",
                            invisiblePromptSeed: ctx.verseText
                                ? `Pasaje bajo estudio: ${ctx.reference} — «${ctx.verseText}». Responde como tratado exegético; Strong y comentaristas clásicos; sin autoayuda; conduce a la cruz.`
                                : `Pasaje bajo estudio: ${ctx.reference}. Responde como tratado exegético bajo autoridad bíblica.`,
                        },
                        history,
                    }),
                });
                body.textContent = "";
                let acc = "";
                if (res.ok && res.body && typeof res.body.getReader === "function") {
                    const reader = res.body.getReader();
                    const decoder = new TextDecoder();
                    while (true) {
                        const { done, value } = await reader.read();
                        if (done) break;
                        acc += decoder.decode(value, { stream: true });
                        body.textContent = acc;
                        log.scrollTop = log.scrollHeight;
                    }
                    acc += decoder.decode();
                } else if (res.ok) {
                    acc = await chatGlobal({
                        message,
                        context: { ...ctx, module: "EstudioProfundoExegesis" },
                        history,
                    });
                } else {
                    body.textContent = "No pude completar la consulta. Vuelve al texto abierto.";
                    return;
                }
                acc = String(acc || "").trim();
                if (!acc) {
                    acc = await chatGlobal({
                        message,
                        context: { ...ctx, module: "EstudioProfundoExegesis" },
                        history,
                    });
                }
                lastAssistant = acc;
                body.innerHTML = renderMarkdown(acc);
                wrap.appendChild(buildReplyActions(acc));
                history.push({ role: "assistant", content: acc });
                log.scrollTop = log.scrollHeight;
            } catch {
                body.textContent = "La Palabra no depende de este panel. Reintenta en un momento.";
            }
        });

        // Botón legacy “enviar última” si existe
        document.getElementById("ia-enviar-cuaderno")?.addEventListener("click", () => {
            const text = String(lastAssistant || "").trim();
            if (!text) return;
            const ctx = getStudyContext();
            const entry = {
                texto: text,
                referencia: ctx.reference,
                tipo: "ia",
                titulo: "Respuesta RevelatiO IA",
                source: "ia",
            };
            if (typeof RV.ai?.onSendToNotebook === "function") RV.ai.onSendToNotebook(entry);
            else if (RV.storage?.addEntry) {
                RV.storage.addEntry(entry);
                RV.ui?.abrirCuaderno?.();
            }
        });

        RV.ai.open = openPanel;
        RV.ai.close = closePanel;
        RV.ai.getStudyContext = getStudyContext;
        RV.ai.renderMarkdown = renderMarkdown;
    }

    RV.ai = Object.assign(RV.ai || {}, {
        authToken,
        readStream,
        chatGlobal,
        synthesizePerspectives,
        getStudyContext,
        renderMarkdown,
        mountPermanentAssistant,
        escapeHtml,
    });
})(typeof window !== "undefined" ? window : globalThis);
