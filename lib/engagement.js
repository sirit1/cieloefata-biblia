window.REVELATIO_ENGAGEMENT = {
  modules: [
    { id: 'oracion', title: 'Muro de oración', description: 'Comparte una petición y acompaña a otros con respeto.', status: 'Disponible' },
    { id: 'creditos', title: 'Créditos RevelatiO IA', description: 'Consulta el uso diario antes de iniciar una conversación.', status: 'Disponible' },
    { id: 'crecimiento', title: 'Tu crecimiento', description: 'Observa tu constancia como una ayuda, no como un mérito espiritual.', status: 'Disponible' },
    { id: 'parejas', title: 'Parejas de oración', description: 'Conecta con consentimiento y sin exponer datos personales.', status: 'En preparación' },
    { id: 'voz', title: 'Lectura por voz', description: 'Escucha pasajes y estudios cuando el adaptador esté configurado.', status: 'En preparación' },
    { id: 'arte', title: 'Verse Art', description: 'Crea una pieza visual compartible a partir de un versículo.', status: 'Requiere configuración' }
  ],
  prayers: [
    { id: 'sample-1', title: 'Por perseverancia en la fe', request: 'Oremos por quienes atraviesan una prueba y necesitan permanecer firmes.', category: 'Perseverancia', prayed: 12, answered: false, anonymous: true },
    { id: 'sample-2', title: 'Por familias que buscan reconciliación', request: 'Que el Señor conceda sabiduría, humildad y restauración.', category: 'Familia', prayed: 8, answered: false, anonymous: true }
  ],
  today: { used: 0, daily: 5000, bonus: 0, streak: 1, maxStreak: 1, activeDays: 1 },
  load() { try { return JSON.parse(localStorage.getItem('revelatio-engagement') || '{}') } catch (_) { return {} } },
  save(data) { try { localStorage.setItem('revelatio-engagement', JSON.stringify(data)) } catch (_) {} }
};
window.REVELATIO_ENGAGEMENT.prayers = [...window.REVELATIO_ENGAGEMENT.prayers, ...(window.REVELATIO_ENGAGEMENT.load().prayers || [])];
function engagementText(value) { return String(value || '').replace(/[<>]/g, '').trim().slice(0, 500); }
