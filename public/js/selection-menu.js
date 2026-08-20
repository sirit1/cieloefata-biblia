/* RevelatiO selection actions - Vanilla JS module */
(() => {
      let selectedText = ''; let savedRange = null; let selectionTimer;
      const menu = document.getElementById('revelatio-selection-tooltip');
      const hideMenu = () => { if (menu) menu.style.display = 'none'; };
      const copy = async text => { try { await navigator.clipboard.writeText(text); } catch { const input = document.createElement('textarea'); input.value = text; input.style.cssText = 'position:fixed;opacity:0'; document.body.append(input); input.select(); document.execCommand('copy'); input.remove(); } };
      window.revelatioActions = {
        copy() { if (!selectedText) return; copy(selectedText); hideMenu(); },
        highlight() { if (!savedRange) return hideMenu(); try { const mark = document.createElement('mark'); mark.className = 'revelatio-highlight'; mark.style.cssText = 'background:#fde68a;color:#1c1917;border-radius:.18em;padding:.04em .12em;'; savedRange.surroundContents(mark); } catch {} hideMenu(); },
        marginNote() { if (selectedText) window.dispatchEvent(new CustomEvent('add-margin-note', { detail: { text: selectedText } })); hideMenu(); },
        metanoia() { if (selectedText) window.dispatchEvent(new CustomEvent('send-to-omnibar', { detail: { prompt: `Metanoia y renovación mental sobre: "${selectedText}"` } })); hideMenu(); },
        speak() { if (selectedText && window.speechSynthesis) { window.speechSynthesis.cancel(); const utter = new SpeechSynthesisUtterance(selectedText); utter.lang = 'es-MX'; utter.rate = 0.90; utter.pitch = 1.0; window.speechSynthesis.speak(utter); } hideMenu(); }
      };
      const showMenu = rect => { const width = Math.min(360, window.innerWidth - 20); const left = Math.max(width / 2 + 10, Math.min(window.innerWidth - width / 2 - 10, rect.left + rect.width / 2)); const top = Math.max(58, rect.top - 12); menu.style.left = `${left}px`; menu.style.top = `${top}px`; menu.style.display = 'flex'; };
      const checkSelection = () => { clearTimeout(selectionTimer); selectionTimer = setTimeout(() => { const sel = window.getSelection(); const text = sel?.toString?.().trim() || ''; if (!sel || sel.isCollapsed || text.length < 2 || !sel.rangeCount) return hideMenu(); const range = sel.getRangeAt(0); const rect = range.getBoundingClientRect(); if (!rect.width && !rect.height) return hideMenu(); selectedText = text; savedRange = range.cloneRange(); showMenu(rect); }, 20); };
      if (!menu) return;
      menu.addEventListener('mousedown', event => event.preventDefault());
      document.addEventListener('mouseup', checkSelection); document.addEventListener('touchend', checkSelection, { passive: true });
      document.addEventListener('mousedown', event => { if (!menu.contains(event.target)) hideMenu(); });
      window.addEventListener('scroll', hideMenu, { passive: true }); window.addEventListener('resize', hideMenu, { passive: true });
      document.addEventListener('keydown', event => { if (event.key === 'Escape') hideMenu(); });
    })();

(() => {
      const bar = document.getElementById('revelatio-universal-action-bar'); if (!bar) return;
      let text = ''; let range = null; let reference = 'Selección';
      const refEl = bar.querySelector('[data-universal-reference]'); const fragmentEl = bar.querySelector('[data-universal-fragment]');
      const hide = () => { bar.classList.remove('is-visible'); window.getSelection()?.removeAllRanges?.(); text = ''; range = null; };
      const contextReference = node => node?.closest?.('[data-reference], [data-versiculo], [data-verse], .rv-verse-surface, .rv-verse, .verse, .bible-verse')?.dataset?.reference || node?.closest?.('[data-reference], [data-versiculo], [data-verse]')?.dataset?.versiculo || 'Selección';
      const show = (selection, fallbackNode) => { const value = selection?.toString?.().trim() || ''; if (value.length < 3 && !fallbackNode) return; text = value || fallbackNode?.textContent?.trim() || ''; range = selection?.rangeCount ? selection.getRangeAt(0).cloneRange() : null; reference = contextReference(fallbackNode || range?.commonAncestorContainer?.parentElement); refEl.textContent = reference; fragmentEl.textContent = text.slice(0, 180); bar.classList.add('is-visible'); };
      const persistHighlight = () => { if (!range) return; try { const mark = document.createElement('mark'); mark.className = 'revelatio-highlight'; mark.style.cssText = 'background:#fde68a;color:#1c1917;border-radius:.18em;padding:.04em .12em;'; range.surroundContents(mark); const saved = JSON.parse(localStorage.getItem('revelatio_highlights') || '[]'); saved.unshift({ text, reference, createdAt: new Date().toISOString() }); localStorage.setItem('revelatio_highlights', JSON.stringify(saved.slice(0, 200))); } catch (_) {} };
      const dispatch = (name, detail) => document.dispatchEvent(new CustomEvent(name, { detail: { text, reference, ...(detail || {}) } }));
      bar.addEventListener('click', event => { const action = event.target.closest('[data-universal-action]')?.dataset.universalAction; if (!action) return; if (action === 'close') return hide(); if (action === 'highlight') { persistHighlight(); return hide(); } if (action === 'note') { dispatch('revelatio:open-notebook'); return; } if (action === 'metanoia') { dispatch('revelatio:open-journal'); return; } if (action === 'ai') { dispatch('revelatio:ask-ai', { prompt: `Profundiza exegéticamente en: ${text}` }); return hide(); } if (action === 'listen') { const app = window.Alpine?.$data(document.body); app?.speechService?.speak?.(text); return; } if (action === 'copy') { navigator.clipboard?.writeText(text); return; } });
      document.addEventListener('mouseup', () => { const selection = window.getSelection(); if (selection?.toString?.().trim().length > 2) show(selection); });
      document.addEventListener('touchend', () => setTimeout(() => { const selection = window.getSelection(); if (selection?.toString?.().trim().length > 2) show(selection); }, 40), { passive: true });
      document.addEventListener('click', event => { const verse = event.target.closest?.('.rv-verse-surface, .rv-verse, [data-verse], [data-versiculo], .verse, .bible-verse'); if (verse && !event.target.closest('button,a')) show(null, verse); });
      document.addEventListener('keydown', event => { if (event.key === 'Escape') hide(); });
    })();
