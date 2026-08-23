/**
 * Éfata RevelatiO — aposento-audio.js
 * Sintetizador armónico en tiempo real (pads Dsus2 / balance 432Hz).
 * ESM: import { aposentoSound } from './aposento-audio.js'
 */
export class AposentoSoundEngine {
  constructor() {
    this.ctx = null;
    this.masterGain = null;
    this.filter = null;
    this.lfo = null;
    this.lfoGain = null;
    this.oscillators = [];
    this.isPlaying = false;
    // Frecuencias base en acorde Dsus2 (armónicos cálidos a 432Hz)
    this.padFrequencies = [73.42, 110.0, 146.83, 164.81, 220.0];
  }

  initContext() {
    if (!this.ctx) {
      const AudioContext = window.AudioContext || window.webkitAudioContext;
      if (!AudioContext) {
        console.warn("[aposento-audio] Web Audio API no disponible");
        return false;
      }
      this.ctx = new AudioContext();
    }
    if (this.ctx.state === "suspended") {
      this.ctx.resume();
    }
    return true;
  }

  start(volume = 0.3) {
    if (!this.initContext()) return;
    if (this.isPlaying) {
      this.setVolume(volume);
      return;
    }

    const now = this.ctx.currentTime;
    const targetVol = Math.max(Number(volume) || 0.3, 0.001);

    // Ganancia maestra con Fade-In de 3 segundos
    this.masterGain = this.ctx.createGain();
    this.masterGain.gain.setValueAtTime(0.0001, now);
    this.masterGain.gain.exponentialRampToValueAtTime(targetVol, now + 3.0);
    this.masterGain.connect(this.ctx.destination);

    // Filtro Pasa-Bajas cálido (corte en 420Hz)
    this.filter = this.ctx.createBiquadFilter();
    this.filter.type = "lowpass";
    this.filter.frequency.setValueAtTime(420, now);
    this.filter.Q.setValueAtTime(2.0, now);
    this.filter.connect(this.masterGain);

    // LFO para modulación de respiración orgánica
    this.lfo = this.ctx.createOscillator();
    this.lfoGain = this.ctx.createGain();
    this.lfo.frequency.setValueAtTime(0.06, now);
    this.lfoGain.gain.setValueAtTime(100, now);
    this.lfo.connect(this.lfoGain);
    this.lfoGain.connect(this.filter.frequency);
    this.lfo.start();

    // Osciladores con micro-desafinación (efecto chorus analógico)
    this.oscillators = this.padFrequencies.map((freq, index) => {
      const osc = this.ctx.createOscillator();
      const oscGain = this.ctx.createGain();
      osc.type = index % 2 === 0 ? "triangle" : "sawtooth";
      osc.frequency.setValueAtTime(freq, now);
      osc.detune.setValueAtTime((index - 2) * 4.5, now);
      oscGain.gain.setValueAtTime(0.25 / this.padFrequencies.length, now);
      osc.connect(oscGain);
      oscGain.connect(this.filter);
      osc.start();
      return osc;
    });

    this.isPlaying = true;
  }

  setVolume(newVolume) {
    if (!this.isPlaying || !this.masterGain || !this.ctx) return;
    const now = this.ctx.currentTime;
    this.masterGain.gain.cancelScheduledValues(now);
    this.masterGain.gain.linearRampToValueAtTime(Math.max(Number(newVolume) || 0, 0.0001), now + 0.1);
  }

  stop() {
    if (!this.isPlaying || !this.masterGain || !this.ctx) return;
    const now = this.ctx.currentTime;
    try {
      this.masterGain.gain.cancelScheduledValues(now);
      this.masterGain.gain.setValueAtTime(Math.max(this.masterGain.gain.value, 0.0001), now);
      this.masterGain.gain.exponentialRampToValueAtTime(0.0001, now + 1.8);
    } catch (e) {
      /* ignore */
    }

    const oscillators = this.oscillators.slice();
    const lfo = this.lfo;
    const filter = this.filter;
    const masterGain = this.masterGain;
    const lfoGain = this.lfoGain;

    setTimeout(() => {
      oscillators.forEach((osc) => {
        try {
          osc.stop();
          osc.disconnect();
        } catch (e) {
          /* ignore */
        }
      });
      if (lfo) {
        try {
          lfo.stop();
          lfo.disconnect();
        } catch (e) {
          /* ignore */
        }
      }
      try {
        lfoGain?.disconnect();
        filter?.disconnect();
        masterGain?.disconnect();
      } catch (e) {
        /* ignore */
      }
      this.oscillators = [];
      this.lfo = null;
      this.lfoGain = null;
      this.filter = null;
      this.masterGain = null;
      this.isPlaying = false;
    }, 1900);
  }
}

export const aposentoSound = new AposentoSoundEngine();

// Compatibilidad con scripts clásicos / consola
if (typeof window !== "undefined") {
  window.AposentoSoundEngine = AposentoSoundEngine;
  window.aposentoSound = aposentoSound;
  window.RV = window.RV || {};
  window.RV.aposentoSound = aposentoSound;
}
