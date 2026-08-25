// Estado Reactivo de la Tarjeta
export const cardState = {
  background: 'midnight', // 'midnight', 'pergamino', 'obsidian'
  typography: 'cinzel',    // 'editorial', 'cinzel', 'serif'
  passage: 'Romanos 12:2',
  version: 'RVR1960',
  verseText: 'No os conforméis a este siglo, sino transformaos por medio de la renovación de vuestro entendimiento, para que comprobéis cuál sea la buena voluntad de Dios, agradable y perfecta.'
};

// 1. ABRIR Y RENDERIZAR MODAL DE TARJETA
export function openCardGenerator(passage, text, version = 'RVR1960') {
  const globalPassage = (typeof window !== 'undefined' && (window.activeStudyPassage || window.currentSelectedPassage)) || '';
  const globalText = (typeof window !== 'undefined' && (window.activeStudyText || window.currentSelectedText)) || '';
  cardState.passage = passage || globalPassage || cardState.passage;
  cardState.verseText = text || globalText || cardState.verseText;
  cardState.version = version || cardState.version;

  let modal = document.getElementById('efata-cards-modal');
  if (!modal) {
    modal = document.createElement('div');
    modal.id = 'efata-cards-modal';
    document.body.appendChild(modal);
  }

  modal.className = 'fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-md p-4 overflow-y-auto animate-in fade-in duration-200';
  modal.innerHTML = `
    <div class="bg-[#FAF7F2] border border-[#E8DFC8] rounded-2xl max-w-lg w-full p-6 shadow-2xl space-y-5 font-serif text-stone-900 relative my-auto">
      
      <!-- Encabezado Modal -->
      <div class="flex items-center justify-between pb-3 border-b border-[#E8DFC8]">
        <div class="flex items-center gap-2">
          <span class="text-xl">✨</span>
          <span class="font-mono text-xs font-bold tracking-widest text-[#855D10] uppercase">ÉFATA CARDS · GENERADOR</span>
        </div>
        <button onclick="document.getElementById('efata-cards-modal').remove()" class="text-stone-400 hover:text-stone-800 text-xl font-bold px-2">&times;</button>
      </div>

      <!-- VISTA PREVIA DE LA TARJETA (CANVAS CONTENEDOR) -->
      <div class="flex justify-center">
        <div id="efata-card-preview" class="w-full max-w-[340px] aspect-[4/5] rounded-2xl p-6 shadow-2xl flex flex-col justify-between items-center text-center transition-all duration-300 relative overflow-hidden border border-white/20">
          
          <!-- Logo Superior -->
          <div class="pt-2">
            <span id="card-logo-badge" class="px-3 py-1 rounded-full text-[10px] font-mono tracking-widest uppercase font-bold bg-[#DFB743]/20 text-[#DFB743] border border-[#DFB743]/40">
              REVELATIO IA
            </span>
          </div>

          <!-- Texto del Versículo -->
          <div class="my-auto px-2">
            <p id="card-verse-quote" class="text-base leading-relaxed select-text transition-all duration-200">
              «${cardState.verseText}»
            </p>
          </div>

          <!-- Referencia Bíblica y Branding -->
          <div class="pb-2 space-y-1">
            <div class="w-12 h-[1px] bg-[#DFB743]/50 mx-auto mb-2"></div>
            <h4 id="card-verse-reference" class="font-bold text-xs tracking-widest uppercase">
              ${cardState.passage} (${cardState.version})
            </h4>
            <p class="text-[9px] font-mono tracking-wider opacity-60 uppercase">
              Éfata RevelatiO · Discernimiento
            </p>
          </div>
        </div>
      </div>

      <!-- CONTROLES: FONDOS -->
      <div class="space-y-1.5">
        <label class="font-mono text-[10px] font-bold text-[#855D10] tracking-widest uppercase block">FONDO SAGRADO</label>
        <div class="grid grid-cols-3 gap-2">
          <button type="button" onclick="window.setCardBackground('midnight')" id="bg-btn-midnight" 
                  class="card-ctrl-btn p-2 rounded-xl border-2 border-[#DFB743] bg-[#0A192F] text-amber-200 text-xs font-mono font-bold flex items-center justify-center gap-1.5 shadow-sm transition-all">
            <span>🌌</span> Noche
          </button>
          <button type="button" onclick="window.setCardBackground('pergamino')" id="bg-btn-pergamino" 
                  class="card-ctrl-btn p-2 rounded-xl border border-[#E8DFC8] bg-[#F4EBD9] text-[#5C4018] text-xs font-mono font-bold flex items-center justify-center gap-1.5 shadow-sm transition-all hover:border-[#DFB743]">
            <span>📜</span> Pergamino
          </button>
          <button type="button" onclick="window.setCardBackground('obsidian')" id="bg-btn-obsidian" 
                  class="card-ctrl-btn p-2 rounded-xl border border-[#E8DFC8] bg-[#18181B] text-amber-100 text-xs font-mono font-bold flex items-center justify-center gap-1.5 shadow-sm transition-all hover:border-[#DFB743]">
            <span>🕋</span> Obsidiana
          </button>
        </div>
      </div>

      <!-- CONTROLES: TIPOGRAFÍAS -->
      <div class="space-y-1.5">
        <label class="font-mono text-[10px] font-bold text-[#855D10] tracking-widest uppercase block">TIPOGRAFÍA</label>
        <div class="grid grid-cols-3 gap-2">
          <button type="button" onclick="window.setCardTypography('editorial')" id="font-btn-editorial" 
                  class="font-ctrl-btn p-2 rounded-xl border border-[#E8DFC8] bg-white text-stone-800 text-xs font-serif italic flex items-center justify-center transition-all hover:border-[#DFB743]">
            Itálica Cálida
          </button>
          <button type="button" onclick="window.setCardTypography('cinzel')" id="font-btn-cinzel" 
                  class="font-ctrl-btn p-2 rounded-xl border-2 border-[#DFB743] bg-[#DFB743]/15 text-[#0A192F] text-xs font-serif font-bold uppercase tracking-wider flex items-center justify-center transition-all">
            Monumental
          </button>
          <button type="button" onclick="window.setCardTypography('serif')" id="font-btn-serif" 
                  class="font-ctrl-btn p-2 rounded-xl border border-[#E8DFC8] bg-white text-stone-800 text-xs font-serif flex items-center justify-center transition-all hover:border-[#DFB743]">
            Lectura Serif
          </button>
        </div>
      </div>

      <!-- ACCIONES PRINCIPALES (BOTONES DE ALTO CONTRASTE) -->
      <div class="space-y-2 pt-2 border-t border-[#E8DFC8]">
        <div class="grid grid-cols-2 gap-2">
          <button type="button" onclick="window.downloadCardImage()" id="btn-card-download" 
                  class="py-2.5 px-3 bg-[#0A192F] hover:bg-[#1E293B] text-[#DFB743] border border-[#DFB743]/40 font-mono font-bold text-xs rounded-xl tracking-wider uppercase shadow-md transition-all flex items-center justify-center gap-1.5 cursor-pointer">
            <span>💾</span> DESCARGAR PNG
          </button>
          <button type="button" onclick="window.copyCardImageToClipboard()" id="btn-card-copy" 
                  class="py-2.5 px-3 bg-[#C59B27] hover:bg-[#B3891F] text-[#0A192F] font-mono font-bold text-xs rounded-xl tracking-wider uppercase shadow-md transition-all flex items-center justify-center gap-1.5 cursor-pointer">
            <span>📋</span> COPIAR IMAGEN
          </button>
        </div>
        <button type="button" onclick="window.openShareModal()" 
                class="w-full py-2.5 px-4 bg-white hover:bg-amber-50 text-[#0A192F] border-2 border-[#C59B27] font-mono font-bold text-xs rounded-xl tracking-widest uppercase shadow-sm transition-all flex items-center justify-center gap-2 cursor-pointer">
          <span>🌐</span> COMPARTIR EN REDES SOCIALES
        </button>
      </div>

    </div>
  `;

  // Aplicar estilos iniciales
  applyCardTheme();
}

// 2. FUNCIÓN PARA CAMBIO DE FONDO Y CONTRASTE
export function setCardBackground(bgKey) {
  cardState.background = bgKey;
  
  // Actualizar botones visuales
  document.querySelectorAll('.card-ctrl-btn').forEach(btn => {
    btn.classList.remove('border-2', 'border-[#DFB743]', 'ring-2', 'ring-[#DFB743]/30');
    btn.classList.add('border', 'border-[#E8DFC8]');
  });
  const activeBtn = document.getElementById(`bg-btn-${bgKey}`);
  if (activeBtn) {
    activeBtn.classList.remove('border', 'border-[#E8DFC8]');
    activeBtn.classList.add('border-2', 'border-[#DFB743]', 'ring-2', 'ring-[#DFB743]/30');
  }

  applyCardTheme();
}

// 3. FUNCIÓN PARA CAMBIO DE TIPOGRAFÍA
export function setCardTypography(fontKey) {
  cardState.typography = fontKey;

  // Actualizar botones visuales
  document.querySelectorAll('.font-ctrl-btn').forEach(btn => {
    btn.classList.remove('border-2', 'border-[#DFB743]', 'bg-[#DFB743]/15');
    btn.classList.add('border', 'border-[#E8DFC8]', 'bg-white');
  });
  const activeBtn = document.getElementById(`font-btn-${fontKey}`);
  if (activeBtn) {
    activeBtn.classList.remove('border', 'border-[#E8DFC8]', 'bg-white');
    activeBtn.classList.add('border-2', 'border-[#DFB743]', 'bg-[#DFB743]/15');
  }

  applyCardTheme();
}

// 4. APLICAR ESTILOS A LA VISTA PREVIA
export function applyCardTheme() {
  const card = document.getElementById('efata-card-preview');
  const quote = document.getElementById('card-verse-quote');
  const ref = document.getElementById('card-verse-reference');
  const badge = document.getElementById('card-logo-badge');
  if (!card || !quote || !ref) return;

  // Temas de Fondo y Color
  if (cardState.background === 'midnight') {
    card.style.background = 'linear-gradient(145deg, #0A192F 0%, #0F172A 50%, #1E293B 100%)';
    quote.style.color = '#F8FAFC';
    ref.style.color = '#DFB743';
    if (badge) badge.className = 'px-3 py-1 rounded-full text-[10px] font-mono tracking-widest uppercase font-bold bg-[#DFB743]/20 text-[#DFB743] border border-[#DFB743]/40';
  } else if (cardState.background === 'pergamino') {
    card.style.background = 'linear-gradient(145deg, #F9F4E8 0%, #F4EBD9 50%, #E8DFC8 100%)';
    quote.style.color = '#292524';
    ref.style.color = '#855D10';
    if (badge) badge.className = 'px-3 py-1 rounded-full text-[10px] font-mono tracking-widest uppercase font-bold bg-[#855D10]/15 text-[#855D10] border border-[#855D10]/30';
  } else if (cardState.background === 'obsidian') {
    card.style.background = 'linear-gradient(145deg, #18181B 0%, #09090B 100%)';
    quote.style.color = '#FAFAFA';
    ref.style.color = '#EAB308';
    if (badge) badge.className = 'px-3 py-1 rounded-full text-[10px] font-mono tracking-widest uppercase font-bold bg-[#EAB308]/20 text-[#EAB308] border border-[#EAB308]/40';
  }

  // Temas de Tipografía
  if (cardState.typography === 'editorial') {
    quote.style.fontFamily = 'Georgia, serif';
    quote.style.fontStyle = 'italic';
    quote.style.letterSpacing = '0.01em';
    ref.style.fontFamily = 'Georgia, serif';
  } else if (cardState.typography === 'cinzel') {
    quote.style.fontFamily = 'Cinzel, "Times New Roman", serif';
    quote.style.fontStyle = 'normal';
    quote.style.letterSpacing = '0.05em';
    ref.style.fontFamily = 'Cinzel, "Times New Roman", serif';
  } else if (cardState.typography === 'serif') {
    quote.style.fontFamily = 'Merriweather, Cambria, serif';
    quote.style.fontStyle = 'normal';
    quote.style.letterSpacing = 'normal';
    ref.style.fontFamily = 'Merriweather, Cambria, serif';
  }
}

// 5. EXPORTACIÓN CANVAS NATIVO / HTML2CANVAS (ALTA RESOLUCIÓN)
export async function renderCardToBlob() {
  const cardElement = document.getElementById('efata-card-preview');
  if (!cardElement) throw new Error('Elemento de tarjeta no encontrado');

  if (typeof window !== 'undefined' && window.html2canvas) {
    const canvas = await window.html2canvas(cardElement, { scale: 3, useCORS: true, backgroundColor: null });
    return new Promise(resolve => canvas.toBlob(resolve, 'image/png'));
  }

  // Fallback Canvas Nativo 1080x1350
  const canvas = document.createElement('canvas');
  canvas.width = 1080;
  canvas.height = 1350;
  const ctx = canvas.getContext('2d');

  // Fondo
  const gradient = ctx.createLinearGradient(0, 0, 1080, 1350);
  if (cardState.background === 'pergamino') {
    gradient.addColorStop(0, '#F9F4E8');
    gradient.addColorStop(1, '#E8DFC8');
    ctx.fillStyle = gradient;
    ctx.fillRect(0, 0, 1080, 1350);
    ctx.fillStyle = '#292524';
  } else {
    gradient.addColorStop(0, '#0A192F');
    gradient.addColorStop(1, '#0F172A');
    ctx.fillStyle = gradient;
    ctx.fillRect(0, 0, 1080, 1350);
    ctx.fillStyle = '#F8FAFC';
  }

  // Texto versículo
  ctx.font = cardState.typography === 'editorial' ? 'italic 48px Georgia' : '52px Cinzel, serif';
  ctx.textAlign = 'center';
  wrapText(ctx, `«${cardState.verseText}»`, 540, 580, 880, 70);

  // Referencia
  ctx.fillStyle = '#DFB743';
  ctx.font = 'bold 36px Cinzel, serif';
  ctx.fillText(`${cardState.passage} (${cardState.version})`, 540, 1100);

  return new Promise(resolve => canvas.toBlob(resolve, 'image/png'));
}

export function wrapText(ctx, text, x, y, maxWidth, lineHeight) {
  const words = text.split(' ');
  let line = '';
  for (let n = 0; n < words.length; n++) {
    const testLine = line + words[n] + ' ';
    const metrics = ctx.measureText(testLine);
    if (metrics.width > maxWidth && n > 0) {
      ctx.fillText(line, x, y);
      line = words[n] + ' ';
      y += lineHeight;
    } else {
      line = testLine;
    }
  }
  ctx.fillText(line, x, y);
}

// 6. DESCARGA PNG
export async function downloadCardImage() {
  const btn = document.getElementById('btn-card-download');
  if (btn) btn.textContent = '⏳ GENERANDO...';

  try {
    const blob = await renderCardToBlob();
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `Efata-${cardState.passage.replace(/\s+/g, '_')}.png`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  } catch (err) {
    alert('Error al descargar: ' + err.message);
  } finally {
    if (btn) btn.innerHTML = '<span>💾</span> DESCARGAR PNG';
  }
}

// 7. COPIAR IMAGEN AL PORTAPAPELES
export async function copyCardImageToClipboard() {
  const btn = document.getElementById('btn-card-copy');
  if (btn) btn.textContent = '⏳ COPIANDO...';

  try {
    const blob = await renderCardToBlob();
    if (typeof navigator !== 'undefined' && navigator.clipboard && window.ClipboardItem) {
      await navigator.clipboard.write([new ClipboardItem({ 'image/png': blob })]);
      alert('✅ ¡Imagen copiada al portapapeles!');
    } else if (typeof navigator !== 'undefined' && navigator.clipboard) {
      await navigator.clipboard.writeText(`«${cardState.verseText}» — ${cardState.passage} (${cardState.version})`);
      alert('📋 Cita y texto copiados al portapapeles.');
    }
  } catch (e) {
    if (typeof navigator !== 'undefined' && navigator.clipboard) {
      await navigator.clipboard.writeText(`«${cardState.verseText}» — ${cardState.passage} (${cardState.version})`);
      alert('📋 Cita y texto copiados al portapapeles.');
    }
  } finally {
    if (btn) btn.innerHTML = '<span>📋</span> COPIAR IMAGEN';
  }
}

// 8. MODAL DE COMPARTIR MULTIPLATAFORMA (WHATSAPP, TELEGRAM, X, FACEBOOK)
export function openShareModal() {
  const shareText = `«${cardState.verseText}»\n\n— ${cardState.passage} (${cardState.version})\nÉfata RevelatiO`;
  const encodedText = encodeURIComponent(shareText);
  const shareUrl = encodeURIComponent('https://efatarevelatio.com');

  const waUrl = `https://api.whatsapp.com/send?text=${encodedText}`;
  const tgUrl = `https://t.me/share/url?url=${shareUrl}&text=${encodedText}`;
  const xUrl = `https://twitter.com/intent/tweet?text=${encodedText}`;
  const fbUrl = `https://www.facebook.com/sharer/sharer.php?u=${shareUrl}&quote=${encodedText}`;

  const shareModalHtml = `
    <div id="efata-social-modal" class="fixed inset-0 z-50 flex items-center justify-center bg-black/75 backdrop-blur-sm p-4 animate-in fade-in duration-150">
      <div class="bg-white border border-[#E8DFC8] rounded-2xl p-6 max-w-sm w-full shadow-2xl space-y-4 font-serif text-stone-900 relative">
        <button onclick="document.getElementById('efata-social-modal').remove()" class="absolute top-4 right-4 text-stone-400 hover:text-stone-800 text-lg font-bold">&times;</button>
        
        <div class="text-center space-y-1">
          <span class="text-2xl">🕊️</span>
          <h3 class="font-bold text-base text-[#0A192F]">Compartir Pasaje Bíblico</h3>
          <p class="text-xs text-stone-500 font-sans">${cardState.passage} (${cardState.version})</p>
        </div>

        <div class="space-y-2 pt-2">
          <!-- WhatsApp -->
          <a href="${waUrl}" target="_blank" rel="noopener noreferrer" 
             class="flex items-center justify-between p-3 rounded-xl bg-[#25D366]/10 hover:bg-[#25D366]/20 border border-[#25D366]/30 text-[#128C7E] font-sans font-semibold text-xs transition-colors">
            <span class="flex items-center gap-2.5"><span>💬</span> WhatsApp</span>
            <span class="text-[11px] text-stone-400 font-mono">Abrir →</span>
          </a>

          <!-- Telegram -->
          <a href="${tgUrl}" target="_blank" rel="noopener noreferrer" 
             class="flex items-center justify-between p-3 rounded-xl bg-[#0088CC]/10 hover:bg-[#0088CC]/20 border border-[#0088CC]/30 text-[#0088CC] font-sans font-semibold text-xs transition-colors">
            <span class="flex items-center gap-2.5"><span>✈️</span> Telegram</span>
            <span class="text-[11px] text-stone-400 font-mono">Abrir →</span>
          </a>

          <!-- X (Twitter) -->
          <a href="${xUrl}" target="_blank" rel="noopener noreferrer" 
             class="flex items-center justify-between p-3 rounded-xl bg-stone-100 hover:bg-stone-200 border border-stone-200 text-stone-800 font-sans font-semibold text-xs transition-colors">
            <span class="flex items-center gap-2.5"><span>𝕏</span> X (Twitter)</span>
            <span class="text-[11px] text-stone-400 font-mono">Publicar →</span>
          </a>

          <!-- Facebook -->
          <a href="${fbUrl}" target="_blank" rel="noopener noreferrer" 
             class="flex items-center justify-between p-3 rounded-xl bg-[#1877F2]/10 hover:bg-[#1877F2]/20 border border-[#1877F2]/30 text-[#1877F2] font-sans font-semibold text-xs transition-colors">
            <span class="flex items-center gap-2.5"><span>👥</span> Facebook</span>
            <span class="text-[11px] text-stone-400 font-mono">Compartir →</span>
          </a>

          <!-- Copiar Cita Directa -->
          <button onclick="navigator.clipboard.writeText(decodeURIComponent('${encodedText}')); alert('Copiado al portapapeles'); document.getElementById('efata-social-modal').remove();" 
                  class="w-full flex items-center justify-between p-3 rounded-xl bg-amber-50 hover:bg-amber-100 border border-[#C59B27]/40 text-[#855D10] font-sans font-semibold text-xs transition-colors">
            <span class="flex items-center gap-2.5"><span>📋</span> Copiar Cita y Texto</span>
            <span class="text-[11px] font-mono">Copiar</span>
          </button>
        </div>
      </div>
    </div>
  `;

  document.body.insertAdjacentHTML('beforeend', shareModalHtml);
}

// Vincular botón flotante de tarjeta sobre el texto bíblico
export function openCardFromActiveVerse() {
  openCardGenerator(window.activeStudyPassage, window.activeStudyText);
}

// Compatibilidad retroactiva para llamadas globales
export function abrirEfataCard(detail = {}) {
  const passage = detail.passage || detail.ref || (typeof detail === 'string' ? detail : '');
  const text = detail.text || detail.verseText || '';
  const version = detail.version || 'RVR1960';
  return openCardGenerator(passage, text, version);
}

// Blindaje y vinculación global segura en el objeto window
if (typeof window !== 'undefined') {
  window.cardState = cardState;
  window.openCardGenerator = openCardGenerator;
  window.setCardBackground = setCardBackground;
  window.setCardTypography = setCardTypography;
  window.applyCardTheme = applyCardTheme;
  window.renderCardToBlob = renderCardToBlob;
  window.downloadCardImage = downloadCardImage;
  window.copyCardImageToClipboard = copyCardImageToClipboard;
  window.openShareModal = openShareModal;
  window.shareCardOnSocial = openShareModal;
  window.openCardFromActiveVerse = openCardFromActiveVerse;
  window.abrirEfataCard = abrirEfataCard;
  window.openEfataCard = openCardGenerator;

  // Registrar namespace RV para integración con la arquitectura de la app
  window.RV = window.RV || {};
  window.RV.cardsGenerator = {
    cardState,
    openCardGenerator,
    setCardBackground,
    setCardTypography,
    downloadCardImage,
    copyCardImageToClipboard,
    openShareModal,
    openCardFromActiveVerse,
    abrirEfataCard,
    shareCardOnSocial: openShareModal,
    openEfataCard: openCardGenerator
  };
  window.RV.openCardGenerator = openCardGenerator;
  window.RV.abrirEfataCard = abrirEfataCard;
  window.RV.openEfataCard = openCardGenerator;

  // Escuchar eventos personalizados
  document.addEventListener('revelatio:open-card', function(event) {
    const detail = event?.detail || {};
    abrirEfataCard(detail);
  });
}
