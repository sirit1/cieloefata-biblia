/**
 * Éfata RevelatiO — ui-ux.js
 * Splash, experiencia de umbral y utilidades de interfaz.
 */
(function () {
if (window.__RV_EXPERIENCIA_WIRED__) return;
window.__RV_EXPERIENCIA_WIRED__ = true;

var TEXTO = 'Eres bienaventurado hoy, bienvenido a RevelatiO by Éfata';
var FADE_MS = 1200;
var HOLD_MS = 7000;
var assetUrl = function (rel) {
    try { return new URL(rel, location.href).href; } catch (e) { return rel; }
};
var PISTA = 'https://cdn.pixabay.com/download/audio/2022/05/27/audio_1808fbf07a.mp3?filename=meditation-piano-ambient-112191.mp3';
var BIENVENIDA_LOCAL = assetUrl('audio/bienvenida-varon.wav?v=jorge12');
var SPLASH_DONE_KEY = 'rv_splash_done_v4';

var splash = document.getElementById('rv-splash');
var voice = document.getElementById('rv-welcome-voice');
var music = document.getElementById('rv-music');
var hint = splash ? splash.querySelector('.rv-splash-hint') : null;
var cerrado = false;
var arrancado = false;
var desplegarTimer = 0;
var blobUrl = null;

var rutaLectura = function () {
    var path = String(location.pathname || '').replace(/\/+$/, '') || '/';
    var hash = String(location.hash || '').replace(/^#/, '').toLowerCase();
    if (hash === 'santuario' || hash === 'lectura' || hash.indexOf('lectura/') === 0 || hash.indexOf('lectura?') === 0) return true;
    return /\/lectura$/i.test(path);
};
var markDone = function () {
    try {
        sessionStorage.setItem(SPLASH_DONE_KEY, '1');
        sessionStorage.setItem('rv_splash_done_v1', '1');
        sessionStorage.setItem('rv_splash_done_v2', '1');
        sessionStorage.setItem('rv_splash_done_v3', '1');
    } catch (e) { }
};
var yaHecho = function () {
    try {
        return sessionStorage.getItem(SPLASH_DONE_KEY) === '1'
            || sessionStorage.getItem('rv_splash_done_v3') === '1'
            || sessionStorage.getItem('rv_splash_done_v2') === '1'
            || sessionStorage.getItem('rv_splash_done_v1') === '1';
    } catch (e) { return false; }
};
var silenciarBienvenida = function () {
    window.__rvWelcomePlaying = false;
    if (voice) {
        try {
            voice.pause();
            voice.removeAttribute('src');
            voice.load();
        } catch (e0) { /* ignore */ }
    }
    if (blobUrl) {
        try { URL.revokeObjectURL(blobUrl); } catch (e1) { /* ignore */ }
        blobUrl = null;
    }
};
var quiereMusicaHome = function () {
    var cb = document.getElementById('entrar-con-musica');
    return !cb || cb.checked;
};
var detenerMusicaIntro = function () {
    if (!music) return;
    try {
        music.pause();
        music.muted = true;
        music.volume = 0;
    } catch (e2) { /* ignore */ }
    try { window.revelatioAudio?.detenerMusica?.(); } catch (e3) { /* ignore */ }
};
var forzarCierreSplash = function () {
    if (!splash) return;
    cerrado = true;
    arrancado = true;
    silenciarBienvenida();
    if (!quiereMusicaHome()) detenerMusicaIntro();
    splash.classList.add('is-out', 'is-gone');
    splash.style.pointerEvents = 'none';
    splash.setAttribute('aria-hidden', 'true');
    splash.removeAttribute('tabindex');
    markDone();
};

if (hint) hint.textContent = 'Toca para continuar';

// Precarga blob en paralelo; NUNCA bloquea la UI.
fetch(BIENVENIDA_LOCAL, { cache: 'force-cache' })
    .then(function (r) { return r.ok ? r.arrayBuffer() : null; })
    .then(function (ab) {
        if (!ab) return;
        blobUrl = URL.createObjectURL(new Blob([ab], { type: 'audio/wav' }));
        if (voice) {
            voice.preload = 'auto';
            voice.src = blobUrl;
        }
    })
    .catch(function () {
        if (voice) voice.src = BIENVENIDA_LOCAL;
    });

if (voice && !voice.src) {
    try { voice.src = BIENVENIDA_LOCAL; } catch (e0) { }
}

var fadeIntro = function () {
    if (!splash) return;
    if (cerrado) {
        splash.classList.add('is-gone');
        return;
    }
    cerrado = true;
    silenciarBienvenida();
    if (!quiereMusicaHome()) detenerMusicaIntro();
    markDone();
    splash.classList.add('is-out');
    splash.style.pointerEvents = 'none';
    splash.setAttribute('aria-hidden', 'true');
    splash.removeAttribute('tabindex');
    setTimeout(function () { splash.classList.add('is-gone'); }, FADE_MS + 40);
};

var programarDespliegue = function () {
    clearTimeout(desplegarTimer);
    desplegarTimer = setTimeout(fadeIntro, HOLD_MS);
    if (voice) {
        var onEnd = function () {
            voice.removeEventListener('ended', onEnd);
            window.__rvWelcomePlaying = false;
            try { if (music) { music.muted = false; music.volume = 0.26; } } catch (e1) { }
            clearTimeout(desplegarTimer);
            desplegarTimer = setTimeout(fadeIntro, 350);
        };
        voice.addEventListener('ended', onEnd);
    }
    // Red de seguridad: aunque el audio falle, el splash NUNCA atrapa la app.
    setTimeout(forzarCierreSplash, HOLD_MS + 2500);
};

var playVoz = function () {
    if (!voice) return;
    try {
        window.__rvWelcomePlaying = true;
        voice.muted = false;
        voice.volume = 1;
        if (blobUrl && voice.src.indexOf('blob:') !== 0) voice.src = blobUrl;
        else if (!voice.src) voice.src = BIENVENIDA_LOCAL;
        // Sin pause/seek: evita corte de «Eres» en Chrome/Safari.
        var p = voice.play();
        if (p && p.catch) p.catch(function () { window.__rvWelcomePlaying = false; });
    } catch (e2) {
        window.__rvWelcomePlaying = false;
    }
};

var playMusicaSuave = function () {
    if (!music || !quiereMusicaHome()) return;
    try {
        music.loop = false;
        music.muted = false;
        music.volume = 0.05;
        if (!music.src || music.src.indexOf('oracion-instrumental') === -1) music.src = PISTA;
        var p = music.play();
        if (p && p.catch) p.catch(function () { });
    } catch (e3) { }
};

var iniciarExperiencia = function (event) {
    if (event) {
        event.preventDefault();
        event.stopPropagation();
    }
    if (cerrado) return;
    if (arrancado) {
        // Segundo toque: si quedó colgado, fuerza entrada al umbral.
        fadeIntro();
        return;
    }
    arrancado = true;
    if (splash) splash.classList.add('is-playing');
    playVoz();
    playMusicaSuave();
    programarDespliegue();
    markDone();
    // No relanzar motor de audio aquí: evita ruido por pistas 404 / voz duplicada.
};

if (splash) {
    splash.addEventListener('click', iniciarExperiencia);
    splash.addEventListener('keydown', function (event) {
        if (event.key === 'Enter' || event.key === ' ') iniciarExperiencia(event);
    });
}
window.revelatioBienvenida = { entrar: iniciarExperiencia, iniciar: iniciarExperiencia, texto: TEXTO };
// Escape hatch global por si el splash quedó encima.
window.revelatioForzarUmbral = forzarCierreSplash;
window.revelatioSilenciarAmbiente = function () {
    silenciarBienvenida();
    detenerMusicaIntro();
};
if (!window.__RV_SPLASH_MUSIC_CB__) {
    window.__RV_SPLASH_MUSIC_CB__ = true;
    document.addEventListener('change', function (ev) {
        if (!ev.target || ev.target.id !== 'entrar-con-musica') return;
        if (ev.target.checked) {
            try { playMusicaSuave(); } catch (e) { }
            try { window.revelatioAudio && window.revelatioAudio.reproducirMusica && window.revelatioAudio.reproducirMusica(true); } catch (e2) { }
        } else {
            silenciarBienvenida();
            detenerMusicaIntro();
            try { localStorage.setItem('revelatio_musica_on', '0'); } catch (e3) { }
        }
    });
}

// Si el splash ya se hizo: cerrar overlay y matar ruido colgado.
if (yaHecho() || rutaLectura()) {
    forzarCierreSplash();
    silenciarBienvenida();
    return;
}
})();

(function (global) {
    "use strict";
    const RV = (global.RV = global.RV || {});
    RV.ui = RV.ui || {};
    RV.ui.cerrarSplash = function () {
        try { global.revelatioForzarUmbral?.(); } catch { /* ignore */ }
        const splash = document.getElementById("rv-splash");
        if (!splash) return;
        splash.classList.add("is-out", "is-gone");
        splash.style.pointerEvents = "none";
        splash.setAttribute("aria-hidden", "true");
        document.body.classList.remove("rv-splash-blocking");
    };

    RV.ui.abrirCuaderno = function () {
        const modal = document.getElementById("modulo-cuaderno");
        const abrir = document.getElementById("abrir-cuaderno");
        if (!modal) return;
        modal.classList.add("is-open");
        modal.setAttribute("aria-hidden", "false");
        abrir?.classList.add("is-on");
        try {
            global.dispatchEvent(new CustomEvent("revelatio:cuaderno-open"));
        } catch { /* ignore */ }
    };

    RV.ui.cerrarCuaderno = function () {
        const modal = document.getElementById("modulo-cuaderno");
        const abrir = document.getElementById("abrir-cuaderno");
        if (!modal) return;
        modal.classList.remove("is-open");
        modal.setAttribute("aria-hidden", "true");
        abrir?.classList.remove("is-on");
    };

    RV.ui.toggleCuaderno = function () {
        const modal = document.getElementById("modulo-cuaderno");
        if (!modal) return;
        if (modal.classList.contains("is-open")) RV.ui.cerrarCuaderno();
        else RV.ui.abrirCuaderno();
    };

    /** Etiquetas de Teología Sistemática (filtrado futuro del Cuaderno). */
    RV.ui.DOCTRINAL_TAGS = [
        { id: "soteriologia", label: "Soteriología" },
        { id: "cristologia", label: "Cristología" },
        { id: "escatologia", label: "Escatología" },
        { id: "pneumatologia", label: "Pneumatología" },
        { id: "teologia-propia", label: "Teología propia" },
        { id: "antropologia", label: "Antropología" },
        { id: "eclesiologia", label: "Eclesiología" },
        { id: "hamartiologia", label: "Hamartiología" },
        { id: "bibliologia", label: "Bibliología" },
    ];

    const TAGS_KEY = "revelatio_doctrine_tags_v1";

    function readActiveTags() {
        try {
            const raw = JSON.parse(sessionStorage.getItem(TAGS_KEY) || "[]");
            return Array.isArray(raw) ? raw.filter(Boolean) : [];
        } catch {
            return [];
        }
    }

    function writeActiveTags(ids) {
        const clean = [...new Set((ids || []).map(String))];
        try {
            sessionStorage.setItem(TAGS_KEY, JSON.stringify(clean));
        } catch { /* ignore */ }
        return clean;
    }

    RV.ui.getActiveDoctrinalTags = readActiveTags;

    RV.ui.setActiveDoctrinalTags = writeActiveTags;

    RV.ui.toggleDoctrinalTag = function (id) {
        const cur = readActiveTags();
        const next = cur.includes(id) ? cur.filter((x) => x !== id) : cur.concat(id);
        writeActiveTags(next);
        try {
            global.dispatchEvent(new CustomEvent("revelatio:doctrine-tags", { detail: { tags: next, toggled: id } }));
        } catch { /* ignore */ }
        return next;
    };

    RV.ui.renderDoctrinalTags = function (host, opts = {}) {
        const root = typeof host === "string" ? document.querySelector(host) : host;
        if (!root) return;
        const active = new Set(opts.active || readActiveTags());
        const filterMode = Boolean(opts.filterMode);
        root.innerHTML = RV.ui.DOCTRINAL_TAGS.map((t) => {
            const on = active.has(t.id);
            return `<button type="button" class="rv-doctrine-tag${on ? " is-on" : ""}" data-doctrine-tag="${t.id}" aria-pressed="${on}" title="Teología sistemática · ${t.label}">[${t.label}]</button>`;
        }).join("");
        if (root.dataset.bound === "1") return;
        root.dataset.bound = "1";
        root.addEventListener("click", (event) => {
            const btn = event.target.closest?.("[data-doctrine-tag]");
            if (!btn) return;
            event.preventDefault();
            const id = btn.getAttribute("data-doctrine-tag");
            const next = RV.ui.toggleDoctrinalTag(id);
            root.querySelectorAll("[data-doctrine-tag]").forEach((el) => {
                const on = next.includes(el.getAttribute("data-doctrine-tag"));
                el.classList.toggle("is-on", on);
                el.setAttribute("aria-pressed", String(on));
            });
            if (filterMode || opts.openFilter) {
                try {
                    global.dispatchEvent(
                        new CustomEvent("revelatio:doctrine-filter", { detail: { tag: id, tags: next } })
                    );
                } catch { /* ignore */ }
            }
        });
    };

    function esc(s) {
        return String(s || "")
            .replace(/&/g, "&amp;")
            .replace(/</g, "&lt;")
            .replace(/>/g, "&gt;")
            .replace(/"/g, "&quot;");
    }

    function buildOiaTexto({ observacion, interpretacion, aplicacion, verseText, ref }) {
        const obs = String(observacion || "").trim() || (verseText ? `«${verseText}»` : "");
        return [
            `## OBSERVACIÓN — ¿Qué dice el texto?`,
            ref ? `*${ref}*` : "",
            obs,
            "",
            `## INTERPRETACIÓN — ¿Qué significaba para la audiencia original?`,
            String(interpretacion || "").trim() || "_(Completar)_",
            "",
            `## APLICACIÓN — ¿Cómo transforma mi vida hoy?`,
            String(aplicacion || "").trim() || "_(Completar)_",
        ]
            .filter((line, i, arr) => !(line === "" && arr[i - 1] === ""))
            .join("\n");
    }

    /**
     * Abre el Cuaderno y monta la plantilla inductiva O-I-A.
     * @param {{ ref?: string, verseText?: string, tags?: string[] }} opts
     */
    RV.ui.startOIA = function (opts = {}) {
        const composer = document.getElementById("rv-oia-composer");
        const refEl = document.getElementById("rv-oia-ref");
        const obs = document.getElementById("rv-oia-obs");
        const interp = document.getElementById("rv-oia-interp");
        const apl = document.getElementById("rv-oia-apl");
        const tagsHost = document.getElementById("rv-oia-tags");
        const ref = String(opts.ref || "").trim();
        const verseText = String(opts.verseText || "").trim();
        const tags = Array.isArray(opts.tags) && opts.tags.length ? opts.tags : readActiveTags();

        RV.ui.abrirCuaderno();
        if (!composer) {
            try {
                global.dispatchEvent(new CustomEvent("revelatio:oia-start", { detail: { ref, verseText, tags } }));
            } catch { /* ignore */ }
            return;
        }

        composer.hidden = false;
        composer.classList.add("is-on");
        if (refEl) refEl.textContent = ref || "Pasaje sin referencia";
        if (obs) {
            obs.value = verseText
                ? `«${verseText}»\n\n(Observa palabras clave, repeticiones, conectores y el flujo del argumento.)`
                : "";
            obs.focus();
        }
        if (interp) interp.value = "";
        if (apl) apl.value = "";
        composer.dataset.ref = ref;
        composer.dataset.verse = verseText;
        if (tagsHost) {
            tagsHost.innerHTML = (tags.length ? tags : [])
                .map((id) => {
                    const meta = RV.ui.DOCTRINAL_TAGS.find((t) => t.id === id);
                    return meta ? `<span class="rv-doctrine-chip" data-tag="${esc(id)}">[${esc(meta.label)}]</span>` : "";
                })
                .join("");
            if (!tags.length) {
                tagsHost.innerHTML = `<span class="rv-oia-tags-hint">Marca ramas doctrinales en el modo versículo para etiquetar este estudio.</span>`;
            }
        }
        writeActiveTags(tags);
        try {
            global.dispatchEvent(new CustomEvent("revelatio:oia-start", { detail: { ref, verseText, tags } }));
        } catch { /* ignore */ }
        composer.scrollIntoView({ behavior: "smooth", block: "nearest" });
    };

    RV.ui.closeOIA = function () {
        const composer = document.getElementById("rv-oia-composer");
        if (!composer) return;
        composer.hidden = true;
        composer.classList.remove("is-on");
    };

    RV.ui.collectOIA = function () {
        const composer = document.getElementById("rv-oia-composer");
        const ref = composer?.dataset.ref || document.getElementById("rv-oia-ref")?.textContent || "";
        const verseText = composer?.dataset.verse || "";
        const observacion = document.getElementById("rv-oia-obs")?.value || "";
        const interpretacion = document.getElementById("rv-oia-interp")?.value || "";
        const aplicacion = document.getElementById("rv-oia-apl")?.value || "";
        const tags = [...(document.getElementById("rv-oia-tags")?.querySelectorAll("[data-tag]") || [])].map(
            (el) => el.getAttribute("data-tag")
        );
        const texto = buildOiaTexto({ observacion, interpretacion, aplicacion, verseText, ref });
        return {
            ref,
            verseText,
            observacion,
            interpretacion,
            aplicacion,
            tags: tags.length ? tags : readActiveTags(),
            texto,
            titulo: `O-I-A · ${ref || "Estudio inductivo"}`,
        };
    };

    RV.ui.buildOiaTexto = buildOiaTexto;

    // Delegación: guardar / cancelar plantilla O-I-A
    document.addEventListener("click", (event) => {
        if (event.target.closest?.("#rv-oia-cancelar, [data-oia-close]")) {
            event.preventDefault();
            RV.ui.closeOIA();
            return;
        }
        if (event.target.closest?.("#rv-oia-guardar, [data-oia-save]")) {
            event.preventDefault();
            const payload = RV.ui.collectOIA();
            try {
                global.dispatchEvent(new CustomEvent("revelatio:oia-save", { detail: payload }));
            } catch { /* ignore */ }
        }
    });
})(typeof window !== "undefined" ? window : globalThis);
