class RevelatioAudio {
  constructor() {
    this.bgAudio = new Audio();
    this.bgAudio.loop = true;
    this.bgAudio.crossOrigin = 'anonymous';
    this.speechSynth = window.speechSynthesis;
    this.voices = [];
    this.selectedVoice = null;
    this.baseVolume = 0.50;
    this.duckVolume = 0.15;

    this.tracks = {
      piano: 'https://ia801503.us.archive.org/15/items/gentle-piano-worship-peace/gentle-piano-worship.mp3',
      cuerdas: 'https://ia801402.us.archive.org/20/items/ambient-prayer-pads/ambient-prayer-strings.mp3',
      pad: 'https://ia601402.us.archive.org/20/items/ambient-prayer-pads/deep-worship-pad.mp3'
    };
    this.bgAudio.src = this.tracks.piano;

    this.loadVoices();
    if (this.speechSynth && this.speechSynth.onvoiceschanged !== undefined) {
      this.speechSynth.onvoiceschanged = () => this.loadVoices();
    }
  }

  loadVoices() {
    if (!this.speechSynth) return;
    this.voices = this.speechSynth.getVoices();

    const latinPatterns = [
      /Paulina/i, /Sabina/i, /Paloma/i, /Jimena/i,
      /Microsoft Dalia/i, /Microsoft Jorge/i,
      /Google español de Estados Unidos/i, /Google.*(MX|US|419)/i
    ];

    for (const pattern of latinPatterns) {
      const match = this.voices.find(v => pattern.test(v.name) || (pattern.test(v.lang) && !v.lang.includes('ES')));
      if (match) {
        this.selectedVoice = match;
        break;
      }
    }

    if (!this.selectedVoice) {
      this.selectedVoice = this.voices.find(v => v.lang.startsWith('es-') && !v.lang.includes('es-ES')) ||
                           this.voices.find(v => v.lang.startsWith('es'));
    }
  }

  playAmbient(track = 'piano') {
    if (this.tracks[track]) this.bgAudio.src = this.tracks[track];
    this.bgAudio.volume = this.baseVolume;
    this.bgAudio.play().catch(() => {});
  }

  stopAmbient() {
    this.bgAudio.pause();
  }

  speakPassage(text) {
    if (!this.speechSynth) return;
    this.speechSynth.cancel();

    const cleanText = text.replace(/\[[GH]?\d+\]/g, '').replace(/^\d+\s+/gm, '').trim();
    const utterance = new SpeechSynthesisUtterance(cleanText);

    if (!this.selectedVoice) this.loadVoices();
    if (this.selectedVoice) utterance.voice = this.selectedVoice;

    utterance.rate = 0.86;
    utterance.pitch = 0.98;

    utterance.onstart = () => { this.bgAudio.volume = this.duckVolume; };
    utterance.onend = () => { this.bgAudio.volume = this.baseVolume; };
    utterance.onerror = () => { this.bgAudio.volume = this.baseVolume; };

    this.speechSynth.speak(utterance);
  }

  stopAll() {
    if (this.speechSynth) this.speechSynth.cancel();
    this.stopAmbient();
  }
}

window.revelatioAudio = new RevelatioAudio();
