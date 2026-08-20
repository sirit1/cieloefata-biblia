/* RevelatiO audio engine: HTML5 ambient music plus Latin-American Web Speech. */
(() => {
  class RevelatioAudio {
    constructor() { this.audio = null; this.tracks = []; this.voice = null; this.baseVolume = 0.4; }
    configure(tracks = []) { this.tracks = tracks; }
    pickVoice() { const voices = window.speechSynthesis?.getVoices?.() || []; const latin = /^(es-MX|es-US|es-CO|es-419|es-AR)$/i; const preferred = /Paulina|Sabina|Paloma|Jimena|Dalia|Jorge|Google español/i; return voices.filter(v => latin.test(v.lang) && !/english|robot|es-ES/i.test(v.name + v.lang)).find(v => preferred.test(v.name)) || voices.find(v => latin.test(v.lang)) || null; }
    speak(text, options = {}) { if (!text || !window.speechSynthesis) return; window.speechSynthesis.cancel(); const u = new SpeechSynthesisUtterance(String(text)); this.voice = this.voice || this.pickVoice(); if (this.voice) u.voice = this.voice; u.lang = this.voice?.lang || options.lang || 'es-MX'; u.rate = options.rate || 0.9; u.pitch = options.pitch || 1; window.speechSynthesis.speak(u); }
    stopSpeaking() { window.speechSynthesis?.cancel?.(); }
    async play(track) { if (!track?.url) return false; if (!this.audio || this.audio.src !== track.url) { this.audio?.pause(); this.audio = new Audio(track.url); this.audio.loop = true; this.audio.preload = 'auto'; this.audio.crossOrigin = 'anonymous'; this.audio.volume = 0; } try { await this.audio.play(); this.fadeTo(this.baseVolume); return true; } catch { return false; } }
    fadeTo(volume, duration = 1800) { if (!this.audio) return; const start = this.audio.volume; const delta = volume - start; const began = performance.now(); const tick = now => { const progress = Math.min(1, (now - began) / duration); if (this.audio) this.audio.volume = start + delta * progress; if (progress < 1) requestAnimationFrame(tick); }; requestAnimationFrame(tick); }
    duck(active) { this.fadeTo(active ? 0.15 : this.baseVolume, 900); }
    stop() { this.fadeTo(0, 700); setTimeout(() => this.audio?.pause(), 750); }
  }
  window.revelatioAudio = new RevelatioAudio();
  window.speechSynthesis?.addEventListener?.('voiceschanged', () => window.revelatioAudio.voice = window.revelatioAudio.pickVoice());
})();
