/**
 * Éfata RevelatiO — app-state.js
 * Estado central reactivo de lectura (libro / capítulo / versión).
 */
export const AppState = {
  currentBook: 'Romanos',
  currentChapter: 12,
  currentVersion: 'RVR1960',
  generation: 0,
  subscribers: [],

  subscribe(callback) {
    this.subscribers.push(callback);
    return () => {
      this.subscribers = this.subscribers.filter((cb) => cb !== callback);
    };
  },

  async setPassage(book, chapter, version = null) {
    const nextBook = String(book || '').trim();
    const nextChap = Number(chapter) || 1;
    if (!nextBook) return this.generation;
    this.currentBook = nextBook;
    this.currentChapter = nextChap;
    if (version) this.currentVersion = version;
    this.generation += 1;
    const gen = this.generation;
    this.subscribers.forEach((cb) => {
      try {
        cb(this, gen);
      } catch (err) {
        console.warn('[AppState] subscriber error', err);
      }
    });
    return gen;
  },
};

export default AppState;
