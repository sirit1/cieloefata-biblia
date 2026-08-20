class RevelatioAudio {
  constructor() {
    this.bg = new Audio();
    this.bg.loop = true;
    this.bg.crossOrigin = 'anonymous';
    this.tracks = {
      piano: 'https://cdn.pixabay.com/download/audio/2022/05/27/audio_1808fbf07a.mp3?filename=meditation-piano-112621.mp3',
      cuerdas: 'https://cdn.pixabay.com/download/audio/2022/01/18/audio_d0a13f69d2.mp3?filename=ambient-worship-10825.mp3',
      pad: 'https://cdn.pixabay.com/download/audio/2022/10/14/audio_9939f792cb.mp3?filename=worship-pad-123405.mp3'
    };
    this.bg.src = this.tracks.piano;
    this.bg.volume = 0.50;
    this.synth = window.speechSynthesis || null;
    this.voices = [];
    this.voice = null;
    this.speechActive = false;
    this.loadVoices();
    if (this.synth) this.synth.onvoiceschanged = () => this.loadVoices();
  }
  loadVoices() { this.voices = this.synth?.getVoices?.() || []; this.voice = this.pickLatinVoice(); return this.voices; }
  pickLatinVoice() {
    const latin = v => /MX|US|419|CO|AR/i.test(v.lang) || /Paulina|Sabina|Google español/i.test(v.name);
    return this.voices.find(v => latin(v) && !/es-ES|english|robot/i.test(`${v.lang} ${v.name}`)) || this.voices.find(v => /^es/i.test(v.lang)) || null;
  }
  playTrack(key = 'piano') {
    if (this.tracks[key]) this.bg.src = this.tracks[key];
    this.bg.volume = 0.50;
    this.bg.play().catch(() => {});
  }
  playAmbient(key = 'piano') { this.playTrack(key); }
  stopAmbient() { this.bg.pause(); }
  duck(active) { this.bg.volume = active ? 0.15 : 0.50; }
  speak(text) {
    if (!this.synth) return;
    this.synth.cancel();
    const cleanText = String(text || '').replace(/\[.*?\]/g, '');
    const u = new SpeechSynthesisUtterance(cleanText);
    const trySpeak = (attempts = 0) => {
      const voices = this.synth.getVoices();
      if (voices.length === 0 && attempts < 10) {
        setTimeout(() => trySpeak(attempts + 1), 100);
        return;
      }
      let bestVoice = voices.find(v =>
        (v.lang.includes('MX') || v.lang.includes('US') || v.lang.includes('419')) &&
        (v.name.includes('Natural') || v.name.includes('Google') || v.name.includes('Paulina') || v.name.includes('Sabina'))
      );
      if (!bestVoice) bestVoice = voices.find(v => v.lang.startsWith('es-') && !v.lang.includes('ES'));
      if (bestVoice) {
        u.voice = bestVoice;
        u.lang = bestVoice.lang;
      } else {
        u.lang = 'es-MX';
      }
      u.rate = 0.88;
      u.pitch = 0.98;
      this.bg.volume = 0.15;
      this.speechActive = true;
      u.onend = () => { this.bg.volume = 0.50; this.speechActive = false; };
      u.onerror = () => { this.bg.volume = 0.50; this.speechActive = false; };
      this.synth.speak(u);
    };
    trySpeak();
  }
  speakPassage(text) { this.speak(text); }
  stop() { this.bg.pause(); this.synth?.cancel?.(); this.speechActive = false; this.bg.volume = 0.50; }
  stopAll() { this.stop(); }
}
window.revelatioAudio = new RevelatioAudio();
