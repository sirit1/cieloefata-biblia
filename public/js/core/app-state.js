/**
 * Éfata RevelatiO — app-state.js
 * Estado central reactivo de lectura (libro / capítulo / versión).
 */
export const AppState = {
  currentBook: 'Romanos',
  currentChapter: 12,
  currentVersion: 'RVR1960',
  subscribers: [],

  subscribe(callback) {
    this.subscribers.push(callback);
    return () => {
      this.subscribers = this.subscribers.filter((cb) => cb !== callback);
    };
  },

  async setPassage(book, chapter, version = null) {
    this.currentBook = book;
    this.currentChapter = Number(chapter) || 1;
    if (version) this.currentVersion = version;
    this.subscribers.forEach((cb) => {
      try {
        cb(this);
      } catch (err) {
        console.warn('[AppState] subscriber error', err);
      }
    });
  },
};

export default AppState;
