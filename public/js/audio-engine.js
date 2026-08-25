/**
 * Éfata RevelatiO — audio-engine.js
 * Única capa de audio: instrumental (#rv-music) + narración ElevenLabs (#rv-voice).
 * No duplica nodos <audio>. La música persiste entre vistas; la voz se detiene
 * al cambiar de versículo o de ruta. Aposento apaga la música al salir.
 */
(function (global) {
  "use strict";

  const RV = (global.RV = global.RV || {});

  const LOCAL_INSTRUMENTAL = "audio/oracion-instrumental.m4a";
  const PIXABAY_FALLBACK =
    "https://cdn.pixabay.com/audio/2022/05/27/audio_1808fbf07a.mp3";
  const TRACK_LABEL = "Instrumental de oración";
  const PREFS_KEY = "revelatio_audio_dual_v1";
  const TTS_MAX = 4500;
  const DEFAULTS = {
    volVoz: 1,
    volMusica: 0.28,
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
    } catch {
      /* ignore */
    }
  }

  function verseTextFromEl(el) {
    if (!el) return "";
    if (el.dataset?.text) return String(el.dataset.text).replace(/\s+/g, " ").trim();
    const clone = el.querySelector?.(".rv-verse-text, .verse-text")?.cloneNode(true);
    if (clone) {
      clone
        .querySelectorAll?.(".rv-verse-num, .rv-strong-row, .rv-token-meta, .rv-strong-num, sup")
        ?.forEach?.((n) => n.remove());
      return String(clone.textContent || "").replace(/\s+/g, " ").trim();
    }
    return String(el.innerText || el.textContent || "").replace(/\s+/g, " ").trim();
  }

  function selectedVerseEl() {
    return (
      document.querySelector(".rv-verse-surface.is-verse-on, .rv-verse-surface.is-va-active") ||
      document.querySelector("#texto-biblico .rv-verse-surface, #verses-container .rv-verse-surface")
    );
  }

  function currentVerseText() {
    const selected =
      String(global.currentSelectedText || "").trim() ||
      String(global.activeStudyText || "").trim() ||
      String(RV.currentStudyState?.text || "").trim();
    if (selected) return selected.replace(/\s+/g, " ").trim();
    return verseTextFromEl(selectedVerseEl());
  }

  function currentPassage() {
    return String(
      global.currentSelectedPassage ||
        global.activeStudyPassage ||
        RV.currentStudyState?.ref ||
        ""
    ).trim();
  }

  function chapterTextFromDom() {
    const nodes = document.querySelectorAll(
      "#texto-biblico .rv-verse-surface, #verses-container .rv-verse-surface"
    );
    return [...nodes]
      .map((el) => verseTextFromEl(el))
      .filter(Boolean)
      .join(" ");
  }

  function chunkText(s) {
    const plain = String(s || "").replace(/\s+/g, " ").trim();
    if (!plain) return [];
    if (plain.length <= TTS_MAX) return [plain];
    const chunks = [];
    let rest = plain;
    while (rest.length) {
      if (rest.length <= TTS_MAX) {
        chunks.push(rest);
        break;
      }
      let cut = rest.lastIndexOf(". ", TTS_MAX);
      if (cut < TTS_MAX * 0.45) cut = rest.lastIndexOf(" ", TTS_MAX);
      if (cut < 1) cut = TTS_MAX;
      chunks.push(rest.slice(0, cut + 1).trim());
      rest = rest.slice(cut + 1).trim();
    }
    return chunks;
  }

  function reuseAudio(id) {
    return (
      document.getElementById(id) ||
      Object.assign(document.createElement("audio"), { id, playsInline: true })
    );
  }

  function createEngine() {
    if (global.__RV_AUDIO_ENGINE__) return global.__RV_AUDIO_ENGINE__;

    const prefs = loadPrefs();
    const music = reuseAudio("rv-music");
    const voiceEl = reuseAudio("rv-voice");
    if (document.body) {
      if (!music.isConnected) document.body.appendChild(music);
      if (!voiceEl.isConnected) document.body.appendChild(voiceEl);
    }
    music.preload = "none";
    music.loop = Boolean(prefs.loop);
    voiceEl.preload = "auto";
    music.setAttribute("playsinline", "");
    voiceEl.setAttribute("playsinline", "");

    const state = {
      prefs,
      speaking: false,
      pausedVoice: false,
      musicOn: false,
      voiceContext: null,
      voiceObjectUrl: null,
      ttsAbort: null,
      speakQueue: [],
      ducking: false,
    };

    const engine = { music, voiceEl, state };

    const setStatus = (text) => {
      const el = document.getElementById("estado-audio");
      if (el) el.textContent = text;
      const pill = document.getElementById("rv-audio-status-pill");
      if (pill) pill.textContent = text;
    };

    const applyVolumes = () => {
      const musicVol = state.ducking
        ? Math.min(prefs.volMusica, 0.12)
        : Math.max(0, Math.min(1, prefs.volMusica));
      music.volume = musicVol;
      voiceEl.volume = Math.max(0, Math.min(1, prefs.volVoz));
    };

    const syncUi = () => {
      const playing = state.musicOn && !music.paused;
      const play = document.getElementById("dock-musica");
      const readerPlay = document.getElementById("reader-audio-play");
      const loop = document.getElementById("dock-loop");
      const volM = document.getElementById("dock-vol-musica");
      const volV = document.getElementById("dock-vol-voz");
      const readerVol = document.getElementById("reader-audio-vol");
      const expand = document.getElementById("dock-expand");
      const dock = document.getElementById("rv-audio-dock");
      const title = document.getElementById("dock-track-title");
      const toggle = document.getElementById("ambient-audio-toggle");
      const home = document.getElementById("entrar-con-musica");
      const expToggle = document.getElementById("toggle-musica");

      if (play) {
        play.classList.toggle("is-on", playing);
        play.setAttribute("aria-pressed", String(playing));
        play.innerHTML = playing
          ? '<svg width="14" height="14" viewBox="0 0 24 24" fill="currentColor" aria-hidden="true"><path d="M6 5h4v14H6V5zm8 0h4v14h-4V5z"/></svg>'
          : '<svg width="14" height="14" viewBox="0 0 24 24" fill="currentColor" aria-hidden="true"><path d="M8 5v14l11-7z"/></svg>';
      }
      if (readerPlay) {
        readerPlay.textContent = playing ? "⏸" : "▶";
        readerPlay.setAttribute("aria-pressed", String(playing));
        readerPlay.classList.toggle("is-on", playing);
      }
      if (loop) loop.checked = Boolean(prefs.loop);
      if (volM && document.activeElement !== volM) {
        volM.value = String(Math.round((prefs.volMusica || 0) * 100));
      }
      if (volV && document.activeElement !== volV) {
        volV.value = String(Math.round((prefs.volVoz || 1) * 100));
      }
      if (readerVol && document.activeElement !== readerVol) {
        const max = Number(readerVol.max) || 1;
        readerVol.value = String(max > 1 ? Math.round(prefs.volMusica * 100) : prefs.volMusica);
      }
      if (title) title.textContent = TRACK_LABEL;
      if (dock) dock.classList.toggle("is-expanded", Boolean(prefs.expanded));
      if (expand) expand.setAttribute("aria-expanded", String(Boolean(prefs.expanded)));
      if (toggle) toggle.checked = playing;
      if (home) home.checked = playing;
      if (expToggle) expToggle.checked = playing;
      const sel = document.getElementById("dock-bgm-select");
      if (sel && !sel.dataset.filled) {
        sel.innerHTML = `<option value="oracion">${TRACK_LABEL}</option>`;
        sel.dataset.filled = "1";
      }
    };

    const revokeVoiceUrl = () => {
      if (state.voiceObjectUrl) {
        try {
          URL.revokeObjectURL(state.voiceObjectUrl);
        } catch {
          /* ignore */
        }
        state.voiceObjectUrl = null;
      }
    };

    const loadInstrumental = () => {
      const local = assetUrl(LOCAL_INSTRUMENTAL);
      if (music.dataset.fallbackTried === "1") {
        if (music.getAttribute("src") !== PIXABAY_FALLBACK) {
          music.src = PIXABAY_FALLBACK;
          music.setAttribute("src", PIXABAY_FALLBACK);
        }
        return;
      }
      if (!music.getAttribute("src") || !String(music.src || "").includes("oracion-instrumental")) {
        music.src = local;
        music.setAttribute("src", local);
      }
      music.loop = Boolean(prefs.loop);
    };

    music.addEventListener("error", () => {
      if (music.dataset.fallbackTried === "1") {
        state.musicOn = false;
        setStatus("Instrumental no disponible");
        syncUi();
        return;
      }
      music.dataset.fallbackTried = "1";
      music.src = PIXABAY_FALLBACK;
      music.setAttribute("src", PIXABAY_FALLBACK);
      if (state.musicOn) {
        music.play().catch(() => {
          state.musicOn = false;
          setStatus("Activa el audio con un toque");
          syncUi();
        });
      }
    });

    const playMusic = async (opts = {}) => {
      if (Number.isFinite(opts.volume)) {
        prefs.volMusica = Math.max(0, Math.min(1, opts.volume));
        savePrefs(prefs);
      }
      loadInstrumental();
      applyVolumes();
      try {
        await music.play();
        state.musicOn = true;
        setStatus(`${TRACK_LABEL}`);
      } catch {
        state.musicOn = false;
        setStatus("Activa el audio con un toque");
      }
      syncUi();
    };

    const pauseMusic = () => {
      try {
        music.pause();
      } catch {
        /* ignore */
      }
      state.musicOn = false;
      setStatus(state.speaking ? "Narrando…" : "En silencio");
      syncUi();
    };

    const stopMusic = () => {
      pauseMusic();
      try {
        music.currentTime = 0;
      } catch {
        /* ignore */
      }
    };

    const toggleMusic = () => {
      if (!music.paused && state.musicOn) pauseMusic();
      else playMusic();
    };

    const setMusicVolume = (vol) => {
      prefs.volMusica = Math.max(0, Math.min(1, Number(vol) || 0));
      savePrefs(prefs);
      applyVolumes();
      syncUi();
    };

    const markSpeakingButtons = (on, button) => {
      document.querySelectorAll("[data-listen].is-speaking, [data-va-act='listen'].is-speaking").forEach((btn) => {
        btn.classList.remove("is-speaking");
        btn.setAttribute("aria-pressed", "false");
      });
      if (on && button) {
        button.classList.add("is-speaking");
        button.setAttribute("aria-pressed", "true");
      }
    };

    const stopVoice = (reason) => {
      if (state.ttsAbort) {
        try {
          state.ttsAbort.abort();
        } catch {
          /* ignore */
        }
        state.ttsAbort = null;
      }
      state.speakQueue = [];
      try {
        voiceEl.pause();
      } catch {
        /* ignore */
      }
      try {
        voiceEl.removeAttribute("src");
        voiceEl.load?.();
      } catch {
        /* ignore */
      }
      revokeVoiceUrl();
      state.speaking = false;
      state.pausedVoice = false;
      state.voiceContext = null;
      state.ducking = false;
      applyVolumes();
      markSpeakingButtons(false);
      if (!state.musicOn) setStatus(reason || "En silencio");
      else setStatus(TRACK_LABEL);
      syncUi();
    };

    const playBlob = (blob) =>
      new Promise((resolve, reject) => {
        revokeVoiceUrl();
        const url = URL.createObjectURL(blob);
        state.voiceObjectUrl = url;
        const onEnd = () => {
          voiceEl.removeEventListener("ended", onEnd);
          voiceEl.removeEventListener("error", onErr);
          resolve();
        };
        const onErr = () => {
          voiceEl.removeEventListener("ended", onEnd);
          voiceEl.removeEventListener("error", onErr);
          reject(new Error("No se pudo reproducir la narración"));
        };
        voiceEl.addEventListener("ended", onEnd);
        voiceEl.addEventListener("error", onErr);
        voiceEl.src = url;
        voiceEl.play().catch(onErr);
      });

    async function fetchTtsChunk(text, passage, signal) {
      const payload = passage ? { passage, verseText: text } : { text };
      const res = await fetch("/api/tts", {
        method: "POST",
        headers: { "Content-Type": "application/json", Accept: "audio/mpeg" },
        body: JSON.stringify(payload),
        signal,
      });
      const type = String(res.headers.get("content-type") || "");
      if (!res.ok) {
        let errMsg = "No se pudo narrar";
        if (type.includes("application/json")) {
          const data = await res.json().catch(() => ({}));
          errMsg = data.error || errMsg;
        }
        const err = new Error(errMsg);
        err.status = res.status;
        throw err;
      }
      return res.blob();
    }

    const speak = async (texto, opts = {}) => {
      const plain = String(texto || "").replace(/\s+/g, " ").trim();
      if (plain.length < 2) {
        setStatus("No hay texto para narrar");
        return;
      }
      stopVoice();
      const ctrl = typeof AbortController !== "undefined" ? new AbortController() : null;
      state.ttsAbort = ctrl;
      state.voiceContext = opts.contextId || "verse";
      state.speaking = true;
      state.pausedVoice = false;
      state.ducking = state.musicOn;
      applyVolumes();
      markSpeakingButtons(true, opts.button);
      setStatus("Narrando…");
      syncUi();

      const chunks = chunkText(plain);
      try {
        for (const chunk of chunks) {
          if (ctrl?.signal?.aborted) return;
          const blob = await fetchTtsChunk(chunk, opts.passage || currentPassage(), ctrl?.signal);
          if (ctrl?.signal?.aborted) return;
          await playBlob(blob);
        }
      } catch (err) {
        if (err?.name === "AbortError") return;
        setStatus(err?.message || "No se pudo narrar");
      } finally {
        if (state.ttsAbort === ctrl) {
          state.speaking = false;
          state.pausedVoice = false;
          state.voiceContext = null;
          state.ducking = false;
          state.ttsAbort = null;
          applyVolumes();
          markSpeakingButtons(false);
          if (state.musicOn) setStatus(TRACK_LABEL);
          else if (!String(document.getElementById("estado-audio")?.textContent || "").startsWith("No se")) {
            setStatus("En silencio");
          }
          syncUi();
        }
      }
    };

    const speakCurrentVerse = (opts = {}) => {
      const text = currentVerseText();
      return speak(text, { ...opts, contextId: opts.contextId || "verse", passage: currentPassage() });
    };

    const speakChapter = (opts = {}) => {
      const text = chapterTextFromDom();
      return speak(text, { ...opts, contextId: "chapter", passage: currentPassage() });
    };

    const pauseVoice = () => {
      if (!state.speaking && !state.pausedVoice) return;
      if (state.pausedVoice) {
        voiceEl.play().catch(() => {});
        state.pausedVoice = false;
        state.speaking = true;
        setStatus("Narrando…");
      } else {
        voiceEl.pause();
        state.pausedVoice = true;
        setStatus("Voz en pausa");
      }
      syncUi();
    };

    const onRouteChange = () => {
      if (state.speaking || state.pausedVoice) stopVoice("Narración detenida al cambiar de vista");
      applyVolumes();
      syncUi();
    };

    const onVerseChange = () => {
      if (state.voiceContext === "chapter" || state.voiceContext === "verse") stopVoice();
    };

    const bindOnce = (el, event, handler) => {
      if (!el || el.dataset.rvAudioBound === "1") return;
      el.dataset.rvAudioBound = "1";
      el.addEventListener(event, handler);
    };

    const mountDock = () => {
      loadInstrumental();
      applyVolumes();
      syncUi();

      bindOnce(document.getElementById("dock-musica"), "click", (e) => {
        e.preventDefault();
        toggleMusic();
      });
      bindOnce(document.getElementById("reader-audio-play"), "click", (e) => {
        e.preventDefault();
        toggleMusic();
      });
      bindOnce(document.getElementById("dock-voz"), "click", (e) => {
        e.preventDefault();
        pauseVoice();
      });
      bindOnce(document.getElementById("dock-stop-voz"), "click", (e) => {
        e.preventDefault();
        stopVoice();
      });
      bindOnce(document.getElementById("dock-expand"), "click", () => {
        prefs.expanded = !prefs.expanded;
        savePrefs(prefs);
        syncUi();
      });
      bindOnce(document.getElementById("dock-loop"), "change", (e) => {
        prefs.loop = Boolean(e.target.checked);
        music.loop = prefs.loop;
        savePrefs(prefs);
      });
      bindOnce(document.getElementById("dock-vol-musica"), "input", (e) => {
        setMusicVolume(Number(e.target.value) / 100);
      });
      bindOnce(document.getElementById("reader-audio-vol"), "input", (e) => {
        const raw = Number(e.target.value);
        setMusicVolume(raw > 1 ? raw / 100 : raw);
      });
      bindOnce(document.getElementById("dock-vol-voz"), "input", (e) => {
        prefs.volVoz = Number(e.target.value) / 100;
        savePrefs(prefs);
        applyVolumes();
      });
      bindOnce(document.getElementById("ambient-audio-toggle"), "change", (e) => {
        if (e.target.checked) playMusic();
        else pauseMusic();
      });
      bindOnce(document.getElementById("entrar-con-musica"), "change", (e) => {
        if (e.target.checked) playMusic();
        else pauseMusic();
      });
      bindOnce(document.getElementById("toggle-musica"), "change", (e) => {
        if (e.target.checked) playMusic();
        else pauseMusic();
      });

      if (!document.documentElement.dataset.rvListenBound) {
        document.documentElement.dataset.rvListenBound = "1";
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
          if (!text && btn.dataset.listen === "verse") text = currentVerseText();
          if (!text && btn.dataset.listen === "chapter") text = chapterTextFromDom();
          speak(text, {
            button: btn,
            contextId: btn.dataset.listen || "ui",
            passage: currentPassage(),
          });
        });
        global.addEventListener("rv:route", onRouteChange);
        document.addEventListener("revelatio:verse-study", onVerseChange);
        document.addEventListener("revelatio:verse-selected", onVerseChange);
        document.addEventListener("revelatio:active-passage", onVerseChange);
      }
    };

    engine.mount = mountDock;
    engine.speak = speak;
    engine.speakCurrentVerse = speakCurrentVerse;
    engine.speakChapter = speakChapter;
    engine.currentVerseText = currentVerseText;
    engine.chapterTextFromDom = chapterTextFromDom;
    engine.stopVoice = stopVoice;
    engine.pauseVoice = pauseVoice;
    engine.playMusic = playMusic;
    engine.pauseMusic = pauseMusic;
    engine.stopMusic = stopMusic;
    engine.toggleMusic = toggleMusic;
    engine.setMusicVolume = setMusicVolume;
    engine.setStatus = setStatus;
    engine.syncUi = syncUi;
    engine.onRouteChange = onRouteChange;
    engine.narrar = speak;
    engine.reproducirMusica = playMusic;
    engine.detenerMusica = pauseMusic;
    engine.pausarVoz = pauseVoice;
    engine.isMusicOn = () => state.musicOn && !music.paused;
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

  RV.audio = RV.audio && RV.audio.mount ? RV.audio : Object.assign(RV.audio || {}, {
    mount: mountAudioEngine,
    create: createEngine,
    trackLabel: TRACK_LABEL,
  });

  const boot = () => {
    const engine = createEngine();
    engine.mount();
  };
  if (document.readyState === "loading") document.addEventListener("DOMContentLoaded", boot);
  else boot();
})(typeof window !== "undefined" ? window : globalThis);
