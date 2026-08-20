class RevelatioAudio {
  constructor() {
    this.bgAudio = new Audio();
    this.bgAudio.loop = true;
    this.bgAudio.crossOrigin = 'anonymous';
    this.speechSynth = window.speechSynthesis;
    this.voices = [];
    this.selectedVoice = null;
    this.baseVolume = 0.45;
    this.duckVolume = 0.15;
    this._voiceLoadPromise = null;
    this._speechToken = 0;

    this.tracks = {
      piano: 'https://ia801503.us.archive.org/15/items/gentle-piano-worship-peace/gentle-piano-worship.mp3',
      cuerdas: 'https://ia801402.us.archive.org/20/items/ambient-prayer-pads/ambient-prayer-strings.mp3',
      pad: 'https://ia601402.us.archive.org/20/items/ambient-prayer-pads/deep-worship-pad.mp3'
    };
    this.bgAudio.src = this.tracks.piano;

    this.loadVoices();
    if (this.speechSynth && 'onvoiceschanged' in this.speechSynth) {
      this.speechSynth.onvoiceschanged = () => this.loadVoices();
    }
  }

  loadVoices() {
    if (!this.speechSynth) return [];
    this.voices = this.speechSynth.getVoices();
    this.selectedVoice = this.pickLatinVoice(this.voices);
    return this.voices;
  }

  pickLatinVoice(voices) {
    const preferred = [
      v => /es-(MX|US|419)/i.test(v.lang),
      v => /Paulina|Sabina/i.test(v.name),
      v => /Google español/i.test(v.name),
      v => /es[-_]419|es[-_]MX|es[-_]US/i.test(`${v.name} ${v.lang}`)
    ];
    for (const match of preferred) {
      const voice = voices.find(match);
      if (voice) return voice;
    }
    return voices.find(v => /^es[-_]/i.test(v.lang)) || voices.find(v => /^es/i.test(v.lang)) || null;
  }

  async ensureVoices() {
    if (!this.speechSynth) return [];
    this.loadVoices();
    if (this.voices.length && this.selectedVoice) return this.voices;
    if (!this._voiceLoadPromise) {
      this._voiceLoadPromise = new Promise(resolve => {
        let attempts = 0;
        const retry = () => {
          this.loadVoices();
          if (this.voices.length || attempts >= 8) {
            this._voiceLoadPromise = null;
            resolve(this.voices);
            return;
          }
          attempts += 1;
          setTimeout(retry, 150);
        };
        retry();
      });
    }
    return this._voiceLoadPromise;
  }

  playAmbient(track = 'piano') {
    if (this.tracks[track]) this.bgAudio.src = this.tracks[track];
    this.bgAudio.volume = this.baseVolume;
    this.bgAudio.play().catch(() => {});
  }

  stopAmbient() {
    this.bgAudio.pause();
  }

  async speakPassage(text) {
    if (!this.speechSynth) return;
    const token = ++this._speechToken;
    this.speechSynth.cancel();
    const cleanText = String(text || '')
      .replace(/<[^>]*>/g, ' ')
      .replace(/\[[GH]?\d+\]/gi, ' ')
      .replace(/^\d+\s+/gm, '')
      .replace(/\s+/g, ' ')
      .trim();
    if (!cleanText) return;

    await this.ensureVoices();
    if (token !== this._speechToken) return;
    const utterance = new SpeechSynthesisUtterance(cleanText);
    if (this.selectedVoice) utterance.voice = this.selectedVoice;
    utterance.lang = this.selectedVoice?.lang || 'es-MX';
    utterance.rate = 0.86;
    utterance.pitch = 0.98;
    utterance.volume = 1;

    utterance.onstart = () => {
      if (token === this._speechToken) this.bgAudio.volume = this.duckVolume;
    };
    const restore = () => {
      if (token === this._speechToken) this.bgAudio.volume = this.baseVolume;
    };
    utterance.onend = restore;
    utterance.onerror = restore;
    this.speechSynth.speak(utterance);
  }

  stopAll() {
    this._speechToken += 1;
    if (this.speechSynth) this.speechSynth.cancel();
    this.bgAudio.volume = this.baseVolume;
    this.stopAmbient();
  }
}

window.revelatioAudio = new RevelatioAudio();
