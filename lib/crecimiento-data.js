const CRECIMIENTO_DATA = {
  tabs: [
    { id: 'mentoría', label: 'Mentoría', icon: 'M12 4v16m8-8H4' },
    { id: 'oración', label: 'Oración', icon: 'M12 3v18m9-9H3' },
    { id: 'memorización', label: 'Memorizar', icon: 'M4 5h16v14H4z' },
    { id: 'santuario', label: 'Santuario', icon: 'M6 3h12v18H6z' }
  ],
  prompts: [
    '¿Qué está revelando Dios sobre mi corazón?',
    '¿Qué verdad estoy evitando obedecer?',
    '¿Qué paso concreto de arrepentimiento puedo dar hoy?'
  ],
  verses: [
    { ref: 'Romanos 12:2', text: 'Sean transformados mediante la renovación de su mente.' },
    { ref: 'Salmo 139:23-24', text: 'Examíname, oh Dios, y conoce mi corazón.' },
    { ref: '1 Corintios 15:58', text: 'Estén firmes, constantes, abundando siempre en la obra del Señor.' }
  ],
  plans: [
    { id: 'crecimiento-21', title: '21 días de mente renovada', days: 21, description: 'Lectura, oración y obediencia diaria alrededor de Romanos 12:2.' },
    { id: 'oracion-7', title: '7 días de oración perseverante', days: 7, description: 'Un ritmo breve para volver a la presencia de Dios cada mañana.' }
  ]
};
window.CRECIMIENTO_DATA = CRECIMIENTO_DATA;
window.calcularSM2 = function (card, quality) {
  const q = Math.max(0, Math.min(5, Number(quality)));
  const repetitions = q < 3 ? 0 : (card.repetitions || 0) + 1;
  const ease = Math.max(1.3, (card.ease_factor || 2.5) + (0.1 - (5 - q) * (0.08 + (5 - q) * 0.02)));
  const interval = repetitions <= 1 ? 1 : repetitions === 2 ? 6 : Math.max(1, Math.round((card.interval_days || 1) * ease));
  return { repetitions, ease_factor: Number(ease.toFixed(2)), interval_days: interval, next_review_at: new Date(Date.now() + interval * 86400000).toISOString(), last_reviewed_at: new Date().toISOString() };
};
(function(){
  const key='revelatio-crecimiento-v1';
  window.cargarCrecimientoLocal = () => { try { return JSON.parse(localStorage.getItem(key)||'{}'); } catch (_) { return {}; } };
  window.guardarCrecimientoLocal = value => localStorage.setItem(key, JSON.stringify(value));
})();