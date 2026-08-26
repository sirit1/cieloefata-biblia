/**
 * Éfata RevelatiO — audio-engine.js
 * Única capa de audio: instrumental (#rv-music) + narración ElevenLabs (#rv-voice).
 * Un solo dueño de reproducción: no se superponen dos voces ni dos camas.
 * Al cerrar modal/popup/tarjeta/overlay se silencia TODO (TTS, cama, speechSynthesis).
 * Abrir otro versículo corta la narración anterior. Aposento apaga la música al salir.
 */
(function (global) {
  "use strict";

  const RV = (global.RV = global.RV || {});

  const BEDS = [
    {
      id: "meditation-impromptu-02",
      src: "audio/beds/meditation-impromptu-02.mp3",
      title: "Meditation Impromptu 02",
      license: "CC BY 4.0",
    },
    {
      id: "meditation-impromptu-01",
      src: "audio/beds/meditation-impromptu-01.mp3",
      title: "Meditation Impromptu 01",
      license: "CC BY 4.0",
    },
    {
      id: "virtutes-instrumenti",
      src: "audio/beds/virtutes-instrumenti.mp3",
      title: "Virtutes Instrumenti",
      license: "CC BY 3.0",
    },
    {
      id: "comfortable-mystery",
      src: "audio/beds/comfortable-mystery.mp3",
      title: "Comfortable Mystery",
      license: "CC BY 3.0",
    },
    {
      id: "sovereign",
      src: "audio/beds/sovereign.mp3",
      title: "Sovereign",
      license: "CC BY 3.0",
    },
  ];
  const PREFS_KEY = "revelatio_audio_dual_v1";
  const TTS_MAX = 4500;
  const DEFAULTS = {
    volVoz: 1,
    volMusica: 0.28,
    loop: true,
    expanded: false,
    musicMuted: false,
    voiceMuted: false,
    bedIndex: 0,
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

  const MEDIA_IDS = ["rv-music", "rv-voice", "rv-welcome-voice"];
  const OVERLAY_IDS = [
    "panel-asistente-ia",
    "ai-modal",
    "modal-efata-card",
    "efata-cards-modal",
    "efata-social-modal",
    "study-drawer",
    "rv-study-panel",
    "modulo-cuaderno",
    "panel-strong",
    "rv-verse-actions",
    "modulo-marginnote",
    "rv-popover",
    "rv-strong-modal",
  ];
  const CLOSE_HIT =
    "[data-ia-close],[data-sp-close],[data-va-act='clear'],[data-cuaderno-close],[data-oia-close],[data-atlas-close],[data-efata-card-close],[data-strong-close],#btn-cerrar-ia,#btn-close-ai-modal,#cerrar-efata-card,#cerrar-strong,#cerrar-cuaderno,#cerrar-nota";

  function reuseAudio(id) {
    const nodes = document.querySelectorAll(`audio#${id}`);
    const el = nodes[0] || document.getElementById(id);
    if (nodes.length > 1) {
      nodes.forEach((node, i) => {
        if (i === 0) return;
        try {
          node.pause();
          node.removeAttribute("src");
          node.remove();
        } catch {
          /* ignore */
        }
      });
    }
    if (el) {
      el.playsInline = true;
      el.setAttribute("playsinline", "");
      return el;
    }
    return Object.assign(document.createElement("audio"), { id, playsInline: true });
  }

  function haltMedia(el, { keepSrc = false } = {}) {
    if (!el) return;
    try {
      el.pause();
    } catch {
      /* ignore */
    }
    try {
      el.currentTime = 0;
    } catch {
      /* ignore */
    }
    const src = String(el.getAttribute("src") || el.src || "");
    if (src.startsWith("blob:")) {
      try {
        URL.revokeObjectURL(src);
      } catch {
        /* ignore */
      }
    }
    if (keepSrc) return;
    try {
      el.removeAttribute("src");
      el.removeAttribute("srcObject");
      el.load?.();
    } catch {
      /* ignore */
    }
  }

  function cancelSpeechSynthesis() {
    try {
      if (global.speechSynthesis) {
        global.speechSynthesis.cancel();
        global.speechSynthesis.pause?.();
      }
    } catch {
      /* ignore */
    }
  }

  function isOverlayOpen(el) {
    if (!el || !el.isConnected) return false;
    const id = el.id;
    if (id === "efata-cards-modal" || id === "efata-social-modal" || id === "rv-strong-modal") {
      return true;
    }
    if (el.hidden || el.getAttribute("hidden") != null) return false;
    if (id === "ai-modal") return el.classList.contains("is-open");
    if (id === "rv-verse-actions" || id === "rv-popover") {
      return el.classList.contains("is-on") || el.classList.contains("is-open");
    }
    if (el.getAttribute("aria-hidden") === "true" && !el.classList.contains("is-open")) {
      return false;
    }
    return el.classList.contains("is-open") || el.classList.contains("is-on");
  }

  function anySilenceOverlayOpen() {
    return OVERLAY_IDS.some((id) => isOverlayOpen(document.getElementById(id)));
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
      voiceToken: 0,
      musicToken: 0,
    };

    const engine = { music, voiceEl, state };

    const currentBed = () => {
      const len = BEDS.length;
      let idx = Number(prefs.bedIndex);
      if (!Number.isFinite(idx) || idx < 0) idx = 0;
      idx = ((idx % len) + len) % len;
      prefs.bedIndex = idx;
      return BEDS[idx];
    };

    const bedLabel = () => currentBed().title;
    const bedCredit = () => {
      const bed = currentBed();
      return `"${bed.title}" Kevin MacLeod (incompetech.com) · ${bed.license}`;
    };

    const setStatus = (text) => {
      const el = document.getElementById("estado-audio");
      if (el) el.textContent = text;
      const pill = document.getElementById("rv-audio-status-pill");
      if (pill) pill.textContent = text;
    };

    const applyVolumes = () => {
      const silentBed = Boolean(prefs.musicMuted) || Number(prefs.volMusica) <= 0;
      const silentVoice = Boolean(prefs.voiceMuted);
      if (silentBed) {
        music.muted = true;
        music.volume = 0;
      } else {
        music.muted = false;
        const musicVol = state.ducking
          ? Math.min(prefs.volMusica, 0.12)
          : Math.max(0, Math.min(1, prefs.volMusica));
        music.volume = musicVol;
      }
      if (silentVoice) {
        voiceEl.muted = true;
        voiceEl.volume = 0;
      } else {
        voiceEl.muted = false;
        voiceEl.volume = Math.max(0, Math.min(1, prefs.volVoz));
      }
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
      if (title) title.textContent = bedLabel();
      const credit = document.getElementById("dock-music-credit");
      if (credit) credit.textContent = bedCredit();
      const muteM = document.getElementById("dock-mute-musica");
      if (muteM) {
        const on = Boolean(prefs.musicMuted) || Number(prefs.volMusica) <= 0;
        muteM.setAttribute("aria-pressed", String(on));
        muteM.classList.toggle("is-muted", on);
        muteM.innerHTML = on
          ? '<span aria-hidden="true">🔇</span> Silencio'
          : '<span aria-hidden="true">🔊</span> Música';
        muteM.title = on
          ? "Activar instrumental (no afecta la voz)"
          : "Silenciar instrumental (no afecta la voz)";
      }
      const muteV = document.getElementById("dock-mute-voz");
      if (muteV) {
        muteV.setAttribute("aria-pressed", String(Boolean(prefs.voiceMuted)));
        muteV.classList.toggle("is-muted", Boolean(prefs.voiceMuted));
        muteV.textContent = prefs.voiceMuted ? "🔇 Voz" : "🗣️ Voz";
        muteV.title = prefs.voiceMuted
          ? "Activar narración (no afecta la música)"
          : "Silenciar narración (no afecta la música)";
      }
      if (dock) dock.classList.toggle("is-expanded", Boolean(prefs.expanded));
      if (expand) expand.setAttribute("aria-expanded", String(Boolean(prefs.expanded)));
      if (toggle) toggle.checked = playing && !prefs.musicMuted;
      if (home) home.checked = playing && !prefs.musicMuted;
      if (expToggle) expToggle.checked = playing && !prefs.musicMuted;
      const sel = document.getElementById("dock-bgm-select");
      if (sel) {
        if (!sel.dataset.filled) {
          sel.innerHTML = BEDS.map(
            (bed, i) => `<option value="${i}">${bed.title}</option>`
          ).join("");
          sel.dataset.filled = "1";
        }
        if (document.activeElement !== sel) sel.value = String(prefs.bedIndex || 0);
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
      const bed = currentBed();
      music.dataset.bedIndex = String(prefs.bedIndex || 0);
      const src = assetUrl(bed.src);
      if (music.getAttribute("src") !== src) {
        music.src = src;
        music.setAttribute("src", src);
      }
      music.loop = Boolean(prefs.loop);
      applyVolumes();
    };

    music.addEventListener("error", () => {
      const idx = Number(prefs.bedIndex || 0);
      const next = idx + 1;
      if (next < BEDS.length) {
        prefs.bedIndex = next;
        savePrefs(prefs);
        loadInstrumental();
        if (state.musicOn) {
          music.play().catch(() => {
            state.musicOn = false;
            setStatus("Activa el audio con un toque");
            syncUi();
          });
        }
        return;
      }
      state.musicOn = false;
      setStatus("Instrumental no disponible");
      syncUi();
    });

    const playMusic = async (opts = {}) => {
      const token = claimMusic();
      if (Number.isFinite(opts.volume)) {
        prefs.volMusica = Math.max(0, Math.min(1, opts.volume));
        savePrefs(prefs);
      }
      loadInstrumental();
      applyVolumes();
      try {
        await music.play();
        if (token !== state.musicToken) {
          haltMedia(music, { keepSrc: true });
          return;
        }
        state.musicOn = true;
        setStatus(bedLabel());
      } catch {
        if (token !== state.musicToken) return;
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
      if (prefs.volMusica <= 0) prefs.musicMuted = true;
      else prefs.musicMuted = false;
      savePrefs(prefs);
      applyVolumes();
      syncUi();
    };

    const toggleMusicMute = () => {
      prefs.musicMuted = !prefs.musicMuted;
      if (!prefs.musicMuted && prefs.volMusica <= 0) prefs.volMusica = 0.28;
      savePrefs(prefs);
      applyVolumes();
      try {
        music.muted = Boolean(prefs.musicMuted);
        if (prefs.musicMuted) music.volume = 0;
      } catch {
        /* ignore */
      }
      syncUi();
    };

    const toggleVoiceMute = () => {
      prefs.voiceMuted = !prefs.voiceMuted;
      savePrefs(prefs);
      if (prefs.voiceMuted) stopVoice("Voz en silencio");
      applyVolumes();
      try {
        voiceEl.muted = Boolean(prefs.voiceMuted);
        if (prefs.voiceMuted) voiceEl.volume = 0;
      } catch {
        /* ignore */
      }
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

    const clearNarrationHighlight = () => {
      document.querySelectorAll(".rv-verse-surface.is-narrating, .is-narrating").forEach((n) => {
        n.classList.remove("is-narrating");
      });
    };

    const markNarratingVerse = (el) => {
      clearNarrationHighlight();
      if (!el) return;
      el.classList.add("is-narrating");
      try {
        el.scrollIntoView({ block: "center", behavior: "smooth" });
      } catch {
        /* ignore */
      }
    };

    const chapterVerseEls = () =>
      [
        ...document.querySelectorAll(
          "#texto-biblico .rv-verse-surface[data-versiculo], #verses-container .rv-verse-surface[data-versiculo]"
        ),
      ];

    const claimVoice = () => {
      state.voiceToken += 1;
      return state.voiceToken;
    };

    const claimMusic = () => {
      state.musicToken += 1;
      return state.musicToken;
    };

    const isVoiceOwner = (token) => token === state.voiceToken;

    const stopVoice = (reason) => {
      claimVoice();
      if (state.ttsAbort) {
        try {
          state.ttsAbort.abort();
        } catch {
          /* ignore */
        }
        state.ttsAbort = null;
      }
      state.speakQueue = [];
      haltMedia(voiceEl, { keepSrc: false });
      revokeVoiceUrl();
      cancelSpeechSynthesis();
      clearNarrationHighlight();
      state.speaking = false;
      state.pausedVoice = false;
      state.voiceContext = null;
      state.ducking = false;
      applyVolumes();
      markSpeakingButtons(false);
      if (!state.musicOn) setStatus(reason || "En silencio");
      else setStatus(bedLabel());
      syncUi();
    };

    const stopAll = (reason) => {
      claimVoice();
      claimMusic();
      if (state.ttsAbort) {
        try {
          state.ttsAbort.abort();
        } catch {
          /* ignore */
        }
        state.ttsAbort = null;
      }
      state.speakQueue = [];
      haltMedia(voiceEl, { keepSrc: false });
      haltMedia(music, { keepSrc: true });
      const welcome = document.getElementById("rv-welcome-voice");
      haltMedia(welcome, { keepSrc: false });
      document.querySelectorAll("audio").forEach((el) => {
        if (el === music) {
          haltMedia(el, { keepSrc: true });
          return;
        }
        haltMedia(el, { keepSrc: false });
      });
      revokeVoiceUrl();
      cancelSpeechSynthesis();
      clearNarrationHighlight();
      try {
        global.__rvWelcomePlaying = false;
      } catch {
        /* ignore */
      }
      state.speaking = false;
      state.pausedVoice = false;
      state.voiceContext = null;
      state.ducking = false;
      state.musicOn = false;
      applyVolumes();
      markSpeakingButtons(false);
      setStatus(reason || "En silencio");
      syncUi();
    };

    const playBlob = (blob, token) =>
      new Promise((resolve, reject) => {
        if (!isVoiceOwner(token)) {
          resolve();
          return;
        }
        revokeVoiceUrl();
        const url = URL.createObjectURL(blob);
        state.voiceObjectUrl = url;
        const signal = state.ttsAbort?.signal;
        const cleanup = () => {
          voiceEl.removeEventListener("ended", onEnd);
          voiceEl.removeEventListener("error", onErr);
          if (signal) signal.removeEventListener("abort", onAbort);
        };
        const onEnd = () => {
          cleanup();
          resolve();
        };
        const onErr = () => {
          cleanup();
          if (!isVoiceOwner(token) || signal?.aborted) resolve();
          else reject(new Error("No se pudo reproducir la narración"));
        };
        const onAbort = () => {
          cleanup();
          haltMedia(voiceEl, { keepSrc: false });
          resolve();
        };
        if (signal?.aborted || !isVoiceOwner(token)) {
          try {
            URL.revokeObjectURL(url);
          } catch {
            /* ignore */
          }
          if (state.voiceObjectUrl === url) state.voiceObjectUrl = null;
          resolve();
          return;
        }
        voiceEl.addEventListener("ended", onEnd);
        voiceEl.addEventListener("error", onErr);
        if (signal) signal.addEventListener("abort", onAbort, { once: true });
        voiceEl.src = url;
        try {
          voiceEl.currentTime = 0;
        } catch {
          /* ignore */
        }
        voiceEl.play().catch(onErr);
      });

    async function fetchTtsChunk(text, signal) {
      const payload = { verseText: text };
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
      const token = state.voiceToken;
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
          if (!isVoiceOwner(token) || ctrl?.signal?.aborted) return;
          const blob = await fetchTtsChunk(chunk, ctrl?.signal);
          if (!isVoiceOwner(token) || ctrl?.signal?.aborted) return;
          await playBlob(blob, token);
        }
      } catch (err) {
        if (err?.name === "AbortError") return;
        if (!isVoiceOwner(token)) return;
        setStatus(err?.message || "No se pudo narrar");
      } finally {
        if (isVoiceOwner(token) && state.ttsAbort === ctrl) {
          state.speaking = false;
          state.pausedVoice = false;
          state.voiceContext = null;
          state.ducking = false;
          state.ttsAbort = null;
          applyVolumes();
          markSpeakingButtons(false);
          if (state.musicOn) setStatus(bedLabel());
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

    const speakChapter = async (opts = {}) => {
      const verses = chapterVerseEls()
        .map((el) => ({ el, text: verseTextFromEl(el) }))
        .filter((v) => v.text.length >= 2);
      if (!verses.length) {
        setStatus("No hay capítulo en pantalla");
        return;
      }
      stopVoice();
      const token = state.voiceToken;
      const ctrl = typeof AbortController !== "undefined" ? new AbortController() : null;
      state.ttsAbort = ctrl;
      state.voiceContext = "chapter";
      state.speaking = true;
      state.pausedVoice = false;
      state.ducking = state.musicOn;
      applyVolumes();
      markSpeakingButtons(true, opts.button);
      setStatus("Narrando el capítulo…");
      syncUi();
      try {
        for (const verse of verses) {
          if (!isVoiceOwner(token) || ctrl?.signal?.aborted) return;
          markNarratingVerse(verse.el);
          const blob = await fetchTtsChunk(verse.text, ctrl?.signal);
          if (!isVoiceOwner(token) || ctrl?.signal?.aborted) return;
          await playBlob(blob, token);
        }
      } catch (err) {
        if (err?.name === "AbortError") return;
        if (!isVoiceOwner(token)) return;
        setStatus(err?.message || "No se pudo narrar el capítulo");
      } finally {
        if (isVoiceOwner(token) && state.ttsAbort === ctrl) {
          clearNarrationHighlight();
          state.speaking = false;
          state.pausedVoice = false;
          state.voiceContext = null;
          state.ducking = false;
          state.ttsAbort = null;
          applyVolumes();
          markSpeakingButtons(false);
          if (state.musicOn) setStatus(bedLabel());
          else setStatus("En silencio");
          syncUi();
        }
      }
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
        clearNarrationHighlight();
        setStatus("Voz en pausa");
      }
      syncUi();
    };

    const onRouteChange = () => {
      stopAll("Audio detenido al cambiar de vista");
    };

    const onVerseChange = () => {
      if (state.voiceContext === "chapter") return;
      if (state.voiceContext === "verse" || state.speaking || state.pausedVoice) {
        stopVoice();
      }
    };

    const selectBed = (index, { resume = true } = {}) => {
      const len = BEDS.length;
      prefs.bedIndex = ((Number(index) % len) + len) % len;
      savePrefs(prefs);
      const keepPlaying = resume && (!music.paused || state.musicOn);
      loadInstrumental();
      if (keepPlaying) playMusic();
      else syncUi();
    };

    const stepBed = (delta) => selectBed((Number(prefs.bedIndex) || 0) + delta);

    const bindOverlaySilence = () => {
      if (document.documentElement.dataset.rvAudioOverlayWatch === "1") return;
      document.documentElement.dataset.rvAudioOverlayWatch = "1";

      const openMap = new Map();
      OVERLAY_IDS.forEach((id) => openMap.set(id, isOverlayOpen(document.getElementById(id))));

      const checkOverlays = () => {
        OVERLAY_IDS.forEach((id) => {
          const open = isOverlayOpen(document.getElementById(id));
          const was = openMap.get(id);
          openMap.set(id, open);
          if (was === true && open === false) stopAll("Overlay cerrado");
        });
      };

      const observer = new MutationObserver(checkOverlays);
      observer.observe(document.documentElement, {
        subtree: true,
        childList: true,
        attributes: true,
        attributeFilter: ["class", "hidden", "aria-hidden", "style", "data-ia-closed"],
      });

      document.addEventListener(
        "click",
        (event) => {
          const t = event.target;
          if (!t?.closest) return;
          if (t.closest("#btn-asistente-ia")) {
            if (document.getElementById("panel-asistente-ia")?.classList.contains("is-open")) {
              stopAll("Overlay cerrado");
            }
            return;
          }
          const closer = t.closest(CLOSE_HIT);
          const backdrop =
            t.id === "ai-modal" ||
            t.id === "modal-efata-card" ||
            t.id === "efata-cards-modal" ||
            t.id === "efata-social-modal";
          if ((closer || backdrop) && (backdrop || anySilenceOverlayOpen())) {
            stopAll("Overlay cerrado");
          }
        },
        true
      );

      document.addEventListener(
        "keydown",
        (event) => {
          if (event.key !== "Escape") return;
          if (anySilenceOverlayOpen() || document.body.classList.contains("aposento-active")) {
            stopAll("Overlay cerrado");
          }
        },
        true
      );

      document.addEventListener("revelatio:silence-audio", () => stopAll("Overlay cerrado"));
      document.addEventListener("revelatio:overlay-closed", () => stopAll("Overlay cerrado"));
      global.addEventListener("pagehide", () => stopAll());
      global.addEventListener("beforeunload", () => stopAll());
    };

    const bindControlDelegation = () => {
      if (document.documentElement.dataset.rvAudioDelegate === "1") return;
      document.documentElement.dataset.rvAudioDelegate = "1";
      document.addEventListener("click", (event) => {
        const t = event.target;
        if (!t?.closest) return;
        if (t.closest("#dock-mute-musica")) {
          event.preventDefault();
          toggleMusicMute();
          return;
        }
        if (t.closest("#dock-mute-voz")) {
          event.preventDefault();
          toggleVoiceMute();
          return;
        }
        if (t.closest("#reader-audio-play, #dock-musica")) {
          event.preventDefault();
          toggleMusic();
          return;
        }
        if (t.closest("#dock-bed-prev")) {
          event.preventDefault();
          stepBed(-1);
          return;
        }
        if (t.closest("#dock-bed-next")) {
          event.preventDefault();
          stepBed(1);
          return;
        }
        if (t.closest("#narrar-capitulo") && !t.closest("[data-listen]")) {
          event.preventDefault();
          speakChapter({ button: t.closest("button") });
          return;
        }
        if (t.closest("#pausa-narracion, #dock-stop-voz")) {
          event.preventDefault();
          t.closest("#pausa-narracion") ? pauseVoice() : stopVoice();
        }
      });
      document.addEventListener("input", (event) => {
        const id = event.target?.id;
        if (
          id === "reader-audio-vol" ||
          id === "dock-vol-musica" ||
          id === "vol-musica" ||
          id === "aposento-volume-slider"
        ) {
          const raw = Number(event.target.value);
          setMusicVolume(raw > 1 ? raw / 100 : raw);
        }
        if (id === "dock-vol-voz" || id === "vol-voz") {
          const raw = Number(event.target.value);
          prefs.volVoz = raw > 1 ? raw / 100 : raw;
          if (prefs.volVoz > 0) prefs.voiceMuted = false;
          savePrefs(prefs);
          applyVolumes();
          syncUi();
        }
      });
      document.addEventListener("change", (event) => {
        const id = event.target?.id;
        if (id === "dock-bgm-select") selectBed(event.target.value);
        if (id === "ambient-audio-toggle" || id === "entrar-con-musica" || id === "toggle-musica") {
          if (event.target.checked) {
            prefs.musicMuted = false;
            savePrefs(prefs);
            playMusic();
          } else pauseMusic();
        }
      });
    };

    const bindOnce = (el, event, handler) => {
      if (!el || el.dataset.rvAudioBound === "1") return;
      el.dataset.rvAudioBound = "1";
      el.addEventListener(event, handler);
    };

    const mountDock = () => {
      bindOverlaySilence();
      bindControlDelegation();
      loadInstrumental();
      applyVolumes();
      syncUi();

      bindOnce(document.getElementById("dock-voz"), "click", (e) => {
        e.preventDefault();
        pauseVoice();
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
          if (btn.dataset.listen === "chapter") {
            speakChapter({ button: btn });
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
    engine.stopAll = stopAll;
    engine.silence = stopAll;
    engine.detenerTodo = stopAll;
    engine.pauseVoice = pauseVoice;
    engine.playMusic = playMusic;
    engine.pauseMusic = pauseMusic;
    engine.stopMusic = stopMusic;
    engine.toggleMusic = toggleMusic;
    engine.setMusicVolume = setMusicVolume;
    engine.toggleMusicMute = toggleMusicMute;
    engine.toggleVoiceMute = toggleVoiceMute;
    engine.setStatus = setStatus;
    engine.syncUi = syncUi;
    engine.onRouteChange = onRouteChange;
    engine.narrar = speak;
    engine.reproducirMusica = playMusic;
    engine.detenerMusica = pauseMusic;
    engine.pausarVoz = pauseVoice;
    engine.selectBed = selectBed;
    engine.stepBed = stepBed;
    engine.isMusicOn = () => !music.paused;
    engine.isMusicMuted = () => Boolean(prefs.musicMuted) || music.muted || music.volume === 0;
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
    trackLabel: BEDS[0].title,
  });

  const boot = () => {
    const engine = createEngine();
    engine.mount();
  };
  if (document.readyState === "loading") document.addEventListener("DOMContentLoaded", boot);
  else boot();
})(typeof window !== "undefined" ? window : globalThis);
