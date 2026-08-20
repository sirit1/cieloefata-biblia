(() => {
  const existingBar = document.getElementById('revelatio-selection-bar');
  if (existingBar) existingBar.remove();

  const bar = document.createElement('div');
  bar.id = 'revelatio-selection-bar';
  bar.style.cssText = `
    display: none;
    position: fixed;
    z-index: 2147483647;
    transform: translate(-50%, -100%);
    margin-top: -12px;
    background-color: #0f172a;
    color: #f8fafc;
    border: 1px solid rgba(245, 158, 11, 0.5);
    border-radius: 12px;
    padding: 6px 12px;
    box-shadow: 0 20px 25px -5px rgba(0, 0, 0, 0.6);
    align-items: center;
    gap: 8px;
    font-family: system-ui, -apple-system, sans-serif;
    user-select: none;
  `;

  bar.innerHTML = `
    <button id="sel-btn-copy" style="background:none;border:none;color:#fbbf24;cursor:pointer;font-size:12px;font-weight:700;display:flex;align-items:center;gap:4px;padding:4px 6px;">📋 Copiar</button>
    <span style="color:#334155;">|</span>
    <button id="sel-btn-note" style="background:none;border:none;color:#f8fafc;cursor:pointer;font-size:12px;font-weight:600;display:flex;align-items:center;gap:4px;padding:4px 6px;">📝 Cuaderno</button>
    <span style="color:#334155;">|</span>
    <button id="sel-btn-metanoia" style="background:none;border:none;color:#34d399;cursor:pointer;font-size:12px;font-weight:700;display:flex;align-items:center;gap:4px;padding:4px 6px;">🌱 Metanoia</button>
    <span style="color:#334155;">|</span>
    <button id="sel-btn-speak" style="background:none;border:none;color:#f8fafc;cursor:pointer;font-size:12px;font-weight:600;display:flex;align-items:center;gap:4px;padding:4px 6px;">🔊 Escuchar</button>
  `;

  document.body.appendChild(bar);

  let currentText = '';
  bar.addEventListener('mousedown', event => event.preventDefault());

  const hide = () => { bar.style.display = 'none'; };
  const copyText = async text => {
    try { await navigator.clipboard.writeText(text); }
    catch {
      const input = document.createElement('textarea');
      input.value = text; input.style.cssText = 'position:fixed;opacity:0';
      document.body.appendChild(input); input.select(); document.execCommand('copy'); input.remove();
    }
  };

  document.getElementById('sel-btn-copy').onclick = () => { if (currentText) copyText(currentText); hide(); };
  document.getElementById('sel-btn-note').onclick = () => {
    window.dispatchEvent(new CustomEvent('add-margin-note', { detail: { text: currentText } })); hide();
  };
  document.getElementById('sel-btn-metanoia').onclick = () => {
    window.dispatchEvent(new CustomEvent('send-to-omnibar', { detail: { prompt: 'Metanoia sobre: "' + currentText + '"' } })); hide();
  };
  document.getElementById('sel-btn-speak').onclick = () => {
    if (currentText && window.revelatioAudio?.speakPassage) window.revelatioAudio.speakPassage(currentText);
    else if (currentText && window.speechSynthesis) {
      const utterance = new SpeechSynthesisUtterance(currentText); utterance.lang = 'es-MX'; utterance.rate = 0.9; window.speechSynthesis.speak(utterance);
    }
    hide();
  };

  function updateMenu() {
    setTimeout(() => {
      const selection = window.getSelection();
      if (!selection || selection.isCollapsed || !selection.rangeCount) return hide();
      const text = selection.toString().trim();
      if (text.length < 2) return hide();
      currentText = text;
      const rect = selection.getRangeAt(0).getBoundingClientRect();
      if (!rect.width && !rect.height) return hide();
      const menuWidth = 320;
      const left = Math.max(menuWidth / 2 + 10, Math.min(window.innerWidth - menuWidth / 2 - 10, rect.left + rect.width / 2));
      bar.style.left = `${left}px`;
      bar.style.top = `${Math.max(56, rect.top - 8)}px`;
      bar.style.display = 'flex';
    }, 30);
  }

  document.addEventListener('mouseup', updateMenu);
  document.addEventListener('touchend', updateMenu, { passive: true });
  document.addEventListener('selectionchange', () => {
    const selection = window.getSelection();
    if (!selection || selection.isCollapsed) hide();
  });
  document.addEventListener('mousedown', event => { if (!bar.contains(event.target)) hide(); });
  window.addEventListener('scroll', hide, { passive: true });
  window.addEventListener('resize', hide, { passive: true });
  document.addEventListener('keydown', event => { if (event.key === 'Escape') hide(); });
})();
