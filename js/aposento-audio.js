/**
 * Éfata RevelatiO — aposento-audio.js
 * Fachada del Modo Aposento hacia el motor único (#rv-music / #rv-voice).
 * Ya no sintetiza pads: usa el instrumental de oración.
 */
function engine() {
  if (typeof window === "undefined") return null;
  return window.__RV_AUDIO_ENGINE__ || window.RV?.audio || window.revelatioAudio || null;
}

export class AposentoSoundEngine {
  get isPlaying() {
    return Boolean(engine()?.isMusicOn?.());
  }

  start(volume = 0.28) {
    const e = engine();
    if (!e) return;
    const vol = Number.isFinite(Number(volume)) ? Number(volume) : 0.28;
    e.setMusicVolume?.(vol);
    e.playMusic?.({ volume: vol });
  }

  setVolume(newVolume) {
    engine()?.setMusicVolume?.(newVolume);
  }

  stop() {
    engine()?.stopMusic?.() || engine()?.pauseMusic?.();
  }
}

export const aposentoSound = new AposentoSoundEngine();

if (typeof window !== "undefined") {
  window.AposentoSoundEngine = AposentoSoundEngine;
  window.aposentoSound = aposentoSound;
  window.RV = window.RV || {};
  window.RV.aposentoSound = aposentoSound;
}
