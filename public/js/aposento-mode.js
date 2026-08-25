/**
 * Éfata RevelatiO — aposento-mode.js
 * Controlador UI del Modo Aposento (ESM).
 * El botón vive en views/estudio.html (inyectado por el router).
 * Audio: motor único (instrumental + ElevenLabs). Al salir se apaga la música.
 */
import { aposentoSound } from "./aposento-audio.js";

function audio() {
  return window.__RV_AUDIO_ENGINE__ || window.RV?.audio || window.revelatioAudio || null;
}

class AposentoController {
  constructor() {
    this.isActive = false;
    this.btn = null;
    this.volumeSlider = null;
    this.audioToggle = null;
    this.controls = null;
    this._bound = false;
    this.bindControls();
    this.initEvents();
  }

  bindControls() {
    this.btn = document.getElementById("btn-aposento");
    this.volumeSlider = document.getElementById("aposento-volume-slider");
    this.audioToggle = document.getElementById("aposento-audio-toggle");
    this.controls = document.getElementById("aposento-controls");
  }

  initEvents() {
    document.addEventListener("click", (e) => {
      if (e.target.closest?.("#btn-aposento")) {
        e.preventDefault();
        this.bindControls();
        this.toggleMode();
        return;
      }
      if (e.target.closest?.("#aposento-audio-toggle")) {
        e.preventDefault();
        this.bindControls();
        this.toggleAmbient();
      }
    });

    document.addEventListener("input", (e) => {
      if (e.target?.id !== "aposento-volume-slider") return;
      const val = Math.min(0.8, parseFloat(e.target.value) || 0);
      aposentoSound.setVolume(val);
    });

    document.addEventListener("keydown", (e) => {
      if (e.key === "Escape" && this.isActive) {
        this.exitAposento();
      }
    });

    document.addEventListener("fullscreenchange", () => {
      if (!document.fullscreenElement && this.isActive) {
        this.exitAposento({ skipFullscreen: true });
      }
    });

    document.addEventListener("rv:route", (event) => {
      const name = event.detail?.name || event.detail?.route;
      if (this.isActive && name && name !== "estudio") {
        this.exitAposento({ skipFullscreen: true });
      }
      setTimeout(() => this.bindControls(), 60);
    });
  }

  toggleAmbient() {
    this.bindControls();
    if (aposentoSound.isPlaying) {
      aposentoSound.stop();
    } else {
      const vol = this.volumeSlider ? parseFloat(this.volumeSlider.value) : 0.28;
      aposentoSound.start(vol);
    }
    this.syncUi();
  }

  toggleMode() {
    if (!this.isActive) this.enterAposento();
    else this.exitAposento();
  }

  syncUi() {
    this.bindControls();
    if (this.controls) {
      if (this.isActive) {
        this.controls.classList.remove("hidden");
        this.controls.classList.add("flex");
      } else {
        this.controls.classList.add("hidden");
        this.controls.classList.remove("flex");
      }
    }
    if (this.btn) {
      const on = this.isActive;
      this.btn.classList.toggle("bg-amber-500/20", on);
      this.btn.classList.toggle("border-amber-400", on);
      this.btn.classList.toggle("text-amber-300", on);
      this.btn.classList.toggle("is-on", on);
      this.btn.setAttribute("aria-pressed", on ? "true" : "false");
    }
    if (this.audioToggle) {
      const playing = aposentoSound.isPlaying;
      this.audioToggle.classList.toggle("text-amber-400", playing);
      this.audioToggle.classList.toggle("text-stone-400", !playing);
      this.audioToggle.textContent = playing ? "🔊" : "🔇";
      this.audioToggle.setAttribute("aria-pressed", playing ? "true" : "false");
    }
  }

  enterAposento() {
    this.bindControls();
    this.isActive = true;
    document.body.classList.add("aposento-active", "is-aposento");

    if (document.documentElement.requestFullscreen && !document.fullscreenElement) {
      document.documentElement.requestFullscreen().catch(() => {});
    }

    if (this.volumeSlider) this.volumeSlider.value = "0.28";
    aposentoSound.start(0.28);

    this.syncUi();
  }

  exitAposento(opts = {}) {
    this.isActive = false;
    document.body.classList.remove("aposento-active", "is-aposento");

    if (!opts.skipFullscreen && document.fullscreenElement && document.exitFullscreen) {
      document.exitFullscreen().catch(() => {});
    }

    audio()?.stopVoice?.();
    aposentoSound.stop();
    this.syncUi();
  }
}

function boot() {
  if (window.aposento instanceof AposentoController) return window.aposento;
  const ctrl = new AposentoController();
  window.aposento = ctrl;
  window.AposentoController = AposentoController;
  window.RV = window.RV || {};
  window.RV.aposento = {
    controller: ctrl,
    activate: (on) => (on ? ctrl.enterAposento() : ctrl.exitAposento()),
    enter: () => ctrl.enterAposento(),
    exit: () => ctrl.exitAposento(),
    toggle: () => ctrl.toggleMode(),
  };
  return ctrl;
}

if (document.readyState === "loading") {
  document.addEventListener("DOMContentLoaded", boot);
} else {
  boot();
}
