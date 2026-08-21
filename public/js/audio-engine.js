/**
 * Éfata RevelatiO — audio-engine.js
 * Motor de audio de doble pista: Voz (Web Speech / TTS) + BGM instrumental.
 * La música persiste entre vistas; la narración se detiene al cambiar de contexto.
 */
(function (global) {
    "use strict";

    const RV = (global.RV = global.RV || {});

    /** Pack local de ambiente instrumental cristiano (BGM). */
    const bgmPack = [
        { id: 1, name: "Oración instrumental", src: "audio/oracion-instrumental.m4a" },
        { id: 2, name: "Piano Aposento", src: "audio/oracion-instrumental.m4a" },
        { id: 3, name: "Cuerdas de Adoración", src: "audio/oracion-instrumental.m4a" },
        { id: 4, name: "Sosiego sagrado", src: "audio/oracion-instrumental.m4a" },
    ];

    const PREFS_KEY = "revelatio_audio_dual_v1";
    const DEFAULTS = {
        volVoz: 1,
        volMusica: 0.28,
        trackId: 1,
        loop: true,
        expanded: false,
    };

    function assetUrl(rel) {
        try {
            return new URL(String(rel || ""), location.href).href;
        } catch {
            return rel;
        }
    }

    function loadPrefs() {
        try {
            return { ...DEFAULTS, ...JSON.parse(localStorage.getItem(PREFS_KEY) || "{}") };
        } catch {
            return { ...DEFAULTS };
        }
    }

    function savePrefs(prefs) {
        try {
            localStorage.setItem(PREFS_KEY, JSON.stringify(prefs));
        } catch { /* ignore */ }
    }

    function pickVoice(voices, preferFemale) {
        const list = voices || [];
        const es = list.filter((v) => /es[-_]?/i.test(v.lang || ""));
        const pool = es.length ? es : list;
        if (!pool.length) return null;
        const genderHint = preferFemale
            ? /female|mujer|monica|paulina|lucia|helena|sabina/i
            : /male|hombre|jorge|diego|carlos|pablo|enrique/i;
        return pool.find((v) => genderHint.test(v.name || "")) || pool[0];
    }

    function createEngine() {
        if (global.__RV_AUDIO_ENGINE__) return global.__RV_AUDIO_ENGINE__;

        const prefs = loadPrefs();
        const music = document.getElementById("rv-music") || Object.assign(document.createElement("audio"), { id: "rv-music", playsInline: true });
        const voiceEl = document.getElementById("rv-voice") || Object.assign(document.createElement("audio"), { id: "rv-voice", playsInline: true });
        if (!music.isConnected) document.body.appendChild(music);
        if (!voiceEl.isConnected) document.body.appendChild(voiceEl);
        music.preload = "none";
        music.loop = Boolean(prefs.loop);

        const state = {
            prefs,
            speaking: false,
            pausedVoice: false,
            musicOn: false,
            utterance: null,
            voiceContext: null, // id del texto narrado (para detener al salir de vista)
            voices: [],
        };

        const engine = {
            bgmPack,
            music,
            voiceEl,
            state,
        };

        const setStatus = (text) => {
            const el = document.getElementById("estado-audio");
            if (el) el.textContent = text;
            const pill = document.getElementById("rv-audio-status-pill");
            if (pill) pill.textContent = text;
        };

        const syncUi = () => {
            const dock = document.getElementById("rv-audio-dock");
            const play = document.getElementById("dock-musica");
            const loop = document.getElementById("dock-loop");
            const sel = document.getElementById("dock-bgm-select");
            const volM = document.getElementById("dock-vol-musica");
            const volV = document.getElementById("dock-vol-voz");
            const expand = document.getElementById("dock-expand");
            if (play) {
                play.classList.toggle("is-on", state.musicOn && !music.paused);
                play.setAttribute("aria-pressed", String(state.musicOn && !music.paused));
                play.innerHTML = state.musicOn && !music.paused
                    ? '<svg width="14" height="14" viewBox="0 0 24 24" fill="currentColor" aria-hidden="true"><path d="M6 5h4v14H6V5zm8 0h4v14h-4V5z"/></svg>'
                    : '<svg width="14" height="14" viewBox="0 0 24 24" fill="currentColor" aria-hidden="true"><path d="M8 5v14l11-7z"/></svg>';
            }
            if (loop) loop.checked = Boolean(prefs.loop);
            if (volM) volM.value = String(Math.round((prefs.volMusica || 0) * 100));
            if (volV) volV.value = String(Math.round((prefs.volVoz || 1) * 100));
            if (sel && !sel.dataset.filled) {
                sel.innerHTML = bgmPack
                    .map((t) => `<option value="${t.id}">${t.name}</option>`)
                    .join("");
                sel.dataset.filled = "1";
            }
            if (sel) sel.value = String(prefs.trackId || 1);
            if (dock) dock.classList.toggle("is-expanded", Boolean(prefs.expanded));
            if (expand) expand.setAttribute("aria-expanded", String(Boolean(prefs.expanded)));
            const track = bgmPack.find((t) => t.id === Number(prefs.trackId)) || bgmPack[0];
            const title = document.getElementById("dock-track-title");
            if (title) title.textContent = track?.name || "Ambiente";
        };

        const applyVolumes = () => {
            music.volume = Math.max(0, Math.min(1, prefs.volMusica));
            voiceEl.volume = Math.max(0, Math.min(1, prefs.volVoz));
        };

        const currentTrack = () => bgmPack.find((t) => t.id === Number(prefs.trackId)) || bgmPack[0];

        const loadTrack = (id) => {
            prefs.trackId = Number(id) || prefs.trackId;
            savePrefs(prefs);
            const track = currentTrack();
            const src = assetUrl(track.src);
            if (music.getAttribute("src") !== src) {
                music.src = src;
                music.setAttribute("src", src);
            }
            music.loop = Boolean(prefs.loop);
            syncUi();
            return track;
        };

        const playMusic = async () => {
            loadTrack(prefs.trackId);
            applyVolumes();
            try {
                await music.play();
                state.musicOn = true;
                setStatus(`BGM · ${currentTrack().name}`);
            } catch {
                state.musicOn = false;
                setStatus("Activa el audio con un toque");
            }
            syncUi();
        };

        const pauseMusic = () => {
            music.pause();
            state.musicOn = false;
            setStatus(state.speaking ? "Narrando…" : "En silencio");
            syncUi();
        };

        const toggleMusic = () => {
            if (!music.paused && state.musicOn) pauseMusic();
            else playMusic();
        };

        const stopVoice = (reason) => {
            try {
                global.speechSynthesis?.cancel?.();
            } catch { /* ignore */ }
            try {
                voiceEl.pause();
            } catch { /* ignore */ }
            state.speaking = false;
            state.pausedVoice = false;
            state.utterance = null;
            state.voiceContext = null;
            if (!state.musicOn) setStatus(reason || "En silencio");
            else setStatus(`BGM · ${currentTrack().name}`);
            syncUi();
            document.querySelectorAll("[data-listen].is-speaking").forEach((btn) => {
                btn.classList.remove("is-speaking");
                btn.setAttribute("aria-pressed", "false");
            });
        };

        const speak = (texto, opts = {}) => {
            const plain = String(texto || "")
                .replace(/\s+/g, " ")
                .trim();
            if (plain.length < 2) {
                setStatus("No hay texto para narrar");
                return;
            }
            stopVoice();
            state.voiceContext = opts.contextId || null;
            state.speaking = true;
            state.pausedVoice = false;

            // Preferencia: Web Speech API (estructura lista para TTS externo vía opts.ttsUrl)
            if (opts.ttsUrl) {
                voiceEl.src = opts.ttsUrl;
                voiceEl.play().catch(() => setStatus("No se pudo reproducir TTS"));
                setStatus("Narrando (TTS)");
                syncUi();
                return;
            }

            if (!global.speechSynthesis || typeof SpeechSynthesisUtterance === "undefined") {
                setStatus("Tu navegador no soporta narración de voz");
                state.speaking = false;
                return;
            }

            const utter = new SpeechSynthesisUtterance(plain);
            utter.lang = "es-ES";
            utter.rate = 0.95;
            utter.pitch = 1;
            utter.volume = Math.max(0, Math.min(1, prefs.volVoz));
            const preferFemale = (document.getElementById("selector-voz")?.value || "varon") === "hembra";
            const voice = pickVoice(state.voices.length ? state.voices : global.speechSynthesis.getVoices(), preferFemale);
            if (voice) utter.voice = voice;
            utter.onend = () => {
                state.speaking = false;
                state.utterance = null;
                state.voiceContext = null;
                if (opts.button) {
                    opts.button.classList.remove("is-speaking");
                    opts.button.setAttribute("aria-pressed", "false");
                }
                if (state.musicOn) setStatus(`BGM · ${currentTrack().name}`);
                else setStatus("En silencio");
                syncUi();
            };
            utter.onerror = () => stopVoice("Narración interrumpida");
            state.utterance = utter;
            if (opts.button) {
                opts.button.classList.add("is-speaking");
                opts.button.setAttribute("aria-pressed", "true");
            }
            // Bajar un poco la música mientras habla
            if (state.musicOn) music.volume = Math.min(prefs.volMusica, 0.12);
            global.speechSynthesis.speak(utter);
            setStatus("Narrando…");
            syncUi();
        };

        const pauseVoice = () => {
            if (!state.speaking && !state.pausedVoice) return;
            if (state.pausedVoice) {
                global.speechSynthesis?.resume?.();
                state.pausedVoice = false;
                state.speaking = true;
                setStatus("Narrando…");
            } else {
                global.speechSynthesis?.pause?.();
                state.pausedVoice = true;
                setStatus("Voz en pausa");
            }
            syncUi();
        };

        const refreshVoices = () => {
            try {
                state.voices = global.speechSynthesis?.getVoices?.() || [];
            } catch {
                state.voices = [];
            }
        };
        refreshVoices();
        if (global.speechSynthesis) {
            global.speechSynthesis.onvoiceschanged = refreshVoices;
        }

        /** Al cambiar de vista: detiene voz, mantiene BGM. */
        const onRouteChange = () => {
            if (state.speaking || state.pausedVoice) stopVoice("Narración detenida al cambiar de vista");
            applyVolumes();
            syncUi();
        };

        const mountDock = () => {
            const dock = document.getElementById("rv-audio-dock");
            if (!dock || dock.dataset.rvAudioBound === "1") {
                syncUi();
                return;
            }
            dock.dataset.rvAudioBound = "1";
            loadTrack(prefs.trackId);
            applyVolumes();
            syncUi();

            document.getElementById("dock-musica")?.addEventListener("click", (e) => {
                e.preventDefault();
                toggleMusic();
            });
            document.getElementById("dock-voz")?.addEventListener("click", (e) => {
                e.preventDefault();
                pauseVoice();
            });
            document.getElementById("dock-stop-voz")?.addEventListener("click", (e) => {
                e.preventDefault();
                stopVoice();
            });
            document.getElementById("dock-expand")?.addEventListener("click", () => {
                prefs.expanded = !prefs.expanded;
                savePrefs(prefs);
                syncUi();
            });
            document.getElementById("dock-loop")?.addEventListener("change", (e) => {
                prefs.loop = Boolean(e.target.checked);
                music.loop = prefs.loop;
                savePrefs(prefs);
            });
            document.getElementById("dock-bgm-select")?.addEventListener("change", (e) => {
                const wasPlaying = !music.paused;
                loadTrack(e.target.value);
                if (wasPlaying) playMusic();
            });
            document.getElementById("dock-vol-musica")?.addEventListener("input", (e) => {
                prefs.volMusica = Number(e.target.value) / 100;
                savePrefs(prefs);
                applyVolumes();
            });
            document.getElementById("dock-vol-voz")?.addEventListener("input", (e) => {
                prefs.volVoz = Number(e.target.value) / 100;
                savePrefs(prefs);
                if (state.utterance) state.utterance.volume = prefs.volVoz;
                applyVolumes();
            });

            // Delegación global: botones [data-listen]
            document.addEventListener("click", (event) => {
                const btn = event.target.closest?.("[data-listen]");
                if (!btn) return;
                event.preventDefault();
                event.stopPropagation();
                if (btn.classList.contains("is-speaking")) {
                    stopVoice();
                    return;
                }
                let text = btn.getAttribute("data-listen-text") || "";
                const sel = btn.getAttribute("data-listen-target");
                if (!text && sel) {
                    const node = document.querySelector(sel);
                    text = node ? String(node.innerText || node.textContent || "") : "";
                }
                if (!text && btn.dataset.listen === "verse") {
                    const verse = btn.closest(".rv-verse-surface") || document.querySelector(".rv-verse-surface.is-verse-on");
                    const clone = verse?.querySelector(".rv-verse-text")?.cloneNode(true);
                    clone?.querySelectorAll(".rv-verse-num, .rv-strong-row")?.forEach((n) => n.remove());
                    text = String(clone?.textContent || "").trim();
                }
                if (!text && btn.dataset.listen === "chapter") {
                    text = [...document.querySelectorAll("#texto-biblico .rv-verse-surface")]
                        .map((el) => {
                            const clone = el.querySelector(".rv-verse-text")?.cloneNode(true);
                            clone?.querySelectorAll(".rv-verse-num, .rv-strong-row")?.forEach((n) => n.remove());
                            return String(clone?.textContent || "").trim();
                        })
                        .filter(Boolean)
                        .join(". ");
                }
                if (!text && btn.dataset.listen === "comentario") {
                    text = String(document.getElementById("analisis-neuro")?.innerText || "").trim();
                }
                speak(text, { button: btn, contextId: btn.dataset.listen || "ui" });
            });

            global.addEventListener("rv:route", onRouteChange);
            document.addEventListener("revelatio:verse-study", () => {
                // Cambio de verso: detener narración previa del capítulo
                if (state.voiceContext === "chapter" || state.voiceContext === "verse") stopVoice();
            });
        };

        engine.mount = mountDock;
        engine.speak = speak;
        engine.stopVoice = stopVoice;
        engine.pauseVoice = pauseVoice;
        engine.playMusic = playMusic;
        engine.pauseMusic = pauseMusic;
        engine.toggleMusic = toggleMusic;
        engine.setStatus = setStatus;
        engine.syncUi = syncUi;
        engine.onRouteChange = onRouteChange;
        engine.narrar = speak; // alias compat
        engine.reproducirMusica = playMusic;
        engine.detenerMusica = pauseMusic;
        engine.pausarVoz = pauseVoice;
        engine.iniciarExperiencia = (fromSplash) => {
            if (fromSplash) {
                const homeCb = document.getElementById("entrar-con-musica");
                if (homeCb && !homeCb.checked) {
                    pauseMusic();
                    return;
                }
            }
            playMusic();
        };

        global.__RV_AUDIO_ENGINE__ = engine;
        global.revelatioAudio = engine;
        RV.audio = engine;
        return engine;
    }

    function mountAudioEngine() {
        const engine = createEngine();
        engine.mount();
        return engine;
    }

    RV.audio = RV.audio || {};
    RV.audio.bgmPack = bgmPack;
    RV.audio.mount = mountAudioEngine;
    RV.audio.create = createEngine;

    // Auto-mount when DOM ready if dock exists
    const boot = () => {
        if (document.getElementById("rv-audio-dock")) mountAudioEngine();
    };
    if (document.readyState === "loading") document.addEventListener("DOMContentLoaded", boot);
    else boot();
})(typeof window !== "undefined" ? window : globalThis);
