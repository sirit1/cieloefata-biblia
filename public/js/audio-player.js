/**
 * Éfata RevelatiO — audio-player.js
 * Ambiente instrumental de oración/meditación + persistencia de volumen/estado.
 * Reutiliza #rv-music si existe para no duplicar pistas.
 */
(function (global) {
  'use strict';

  const PREFS_KEY = 'revelatio_ambient_v1';
  const CDN_TRACKS = [
    'https://cdn.pixabay.com/download/audio/2022/05/27/audio_1808fbf07a.mp3?filename=meditation-piano-ambient-112191.mp3',
    'https://cdn.pixabay.com/audio/2022/05/27/audio_1808fbf07a.mp3',
    '/audio/oracion-instrumental.m4a',
  ];

  function loadPrefs() {
    try {
      return {
        playing: false,
        volume: 0.28,
        ...JSON.parse(localStorage.getItem(PREFS_KEY) || '{}'),
      };
    } catch {
      return { playing: false, volume: 0.28 };
    }
  }

  function savePrefs(prefs) {
    try {
      localStorage.setItem(PREFS_KEY, JSON.stringify(prefs));
    } catch { /* ignore */ }
  }

  class AmbientAudioController {
    constructor() {
      this.prefs = loadPrefs();
      this.tracks = CDN_TRACKS.slice();
      this.trackIndex = 0;
      this.isPlaying = false;
      this.audioElement =
        document.getElementById('rv-music') ||
        Object.assign(document.createElement('audio'), { id: 'rv-music', playsInline: true });
      if (!this.audioElement.isConnected) {
        document.body.appendChild(this.audioElement);
      }
      this.audioElement.loop = true;
      this.audioElement.preload = 'none';
      this.audioElement.volume = Math.max(0, Math.min(1, Number(this.prefs.volume) || 0.28));
      this._bindErrorFallback();
      this.initControls();
      this.syncUi();
    }

    _bindErrorFallback() {
      this.audioElement.addEventListener('error', () => {
        this.trackIndex += 1;
        if (this.trackIndex < this.tracks.length && this.isPlaying) {
          this.audioElement.src = this.tracks[this.trackIndex];
          this.audioElement.play().catch(() => {});
        }
      });
    }

    _source() {
      return this.tracks[this.trackIndex] || this.tracks[0];
    }

    initControls() {
      if (this._wired) return;
      this._wired = true;
      document.addEventListener('change', (e) => {
        const id = e.target?.id;
        if (id === 'ambient-audio-toggle' || id === 'entrar-con-musica') {
          if (e.target.checked) this.play();
          else this.pause();
        }
      });
      document.addEventListener('click', (e) => {
        if (e.target.closest?.('#reader-audio-play, #dock-musica')) {
          e.preventDefault();
          this.toggle();
        }
      });
      document.addEventListener('input', (e) => {
        if (e.target?.id === 'reader-audio-vol' || e.target?.id === 'dock-vol-musica') {
          this.setVolume(Number(e.target.value) > 1 ? Number(e.target.value) / 100 : Number(e.target.value));
        }
      });
    }

    setVolume(vol) {
      const v = Math.max(0, Math.min(1, Number(vol) || 0));
      this.prefs.volume = v;
      this.audioElement.volume = v;
      savePrefs(this.prefs);
      this.syncUi();
    }

    play() {
      const src = this._source();
      if (!this.audioElement.getAttribute('src') || this.audioElement.src.indexOf('blob:') === 0) {
        this.audioElement.src = src;
      } else if (!this.audioElement.src.includes('112191') && !this.audioElement.src.includes('oracion-instrumental')) {
        this.audioElement.src = src;
      }
      this.audioElement.loop = true;
      this.audioElement.muted = false;
      this.audioElement.volume = this.prefs.volume;
      this.audioElement
        .play()
        .then(() => {
          this.isPlaying = true;
          this.prefs.playing = true;
          savePrefs(this.prefs);
          this.syncUi();
        })
        .catch((err) => {
          console.warn('Autoplay bloqueado por el navegador:', err);
          this.isPlaying = false;
          this.syncUi();
        });
    }

    pause() {
      try {
        this.audioElement.pause();
      } catch { /* ignore */ }
      this.isPlaying = false;
      this.prefs.playing = false;
      savePrefs(this.prefs);
      this.syncUi();
    }

    toggle() {
      if (this.isPlaying && !this.audioElement.paused) this.pause();
      else this.play();
    }

    syncUi() {
      const on = Boolean(this.isPlaying && !this.audioElement.paused);
      const toggle = document.getElementById('ambient-audio-toggle');
      if (toggle) toggle.checked = on;
      const home = document.getElementById('entrar-con-musica');
      if (home) home.checked = on;
      const playBtn = document.getElementById('reader-audio-play');
      if (playBtn) {
        playBtn.textContent = on ? '⏸' : '▶';
        playBtn.setAttribute('aria-pressed', String(on));
        playBtn.classList.toggle('is-on', on);
      }
      const title = document.getElementById('dock-track-title');
      if (title) title.textContent = on ? 'Oración Instrumental' : 'Oración Instrumental · en silencio';
      const vol = document.getElementById('reader-audio-vol');
      if (vol && document.activeElement !== vol) {
        const max = Number(vol.max) || 1;
        vol.value = String(max > 1 ? Math.round(this.prefs.volume * 100) : this.prefs.volume);
      }
      const status = document.getElementById('estado-audio');
      if (status && on) status.textContent = 'BGM · Oración Instrumental';
    }
  }

  function boot() {
    if (global.ambientAudio instanceof AmbientAudioController) return global.ambientAudio;
    const ctrl = new AmbientAudioController();
    global.ambientAudio = ctrl;
    global.RV = global.RV || {};
    global.RV.ambientAudio = ctrl;
    return ctrl;
  }

  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', boot);
  else boot();
})(typeof window !== 'undefined' ? window : globalThis);
