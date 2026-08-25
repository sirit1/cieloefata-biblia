/**
 * Éfata RevelatiO — audio-player.js
 * Compatibilidad: NO crea un segundo <audio>. Delega al motor único (audio-engine.js).
 */
(function (global) {
  "use strict";

  function engine() {
    return global.__RV_AUDIO_ENGINE__ || global.RV?.audio || global.revelatioAudio || null;
  }

  function wrap() {
    const e = engine();
    if (!e || typeof e.playMusic !== "function") return null;
    const ctrl = {
      get isPlaying() {
        return Boolean(e.isMusicOn?.());
      },
      get audioElement() {
        return e.music;
      },
      play() {
        return e.playMusic?.();
      },
      pause() {
        return e.pauseMusic?.();
      },
      toggle() {
        return e.toggleMusic?.();
      },
      setVolume(vol) {
        return e.setMusicVolume?.(vol);
      },
      syncUi() {
        return e.syncUi?.();
      },
    };
    global.ambientAudio = ctrl;
    global.RV = global.RV || {};
    global.RV.ambientAudio = ctrl;
    return ctrl;
  }

  function boot() {
    if (wrap()) return;
    const retry = () => wrap();
    document.addEventListener("DOMContentLoaded", retry, { once: true });
    setTimeout(retry, 80);
    setTimeout(retry, 400);
  }

  if (document.readyState === "loading") document.addEventListener("DOMContentLoaded", boot);
  else boot();
})(typeof window !== "undefined" ? window : globalThis);
