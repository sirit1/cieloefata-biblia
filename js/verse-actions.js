/**
 * Éfata RevelatiO — verse-actions.js
 * Barra flotante + resaltados por Frutos del Espíritu.
 */
(function (global) {
  "use strict";

  const RV = (global.RV = global.RV || {});
  const LS_HL = "revelatio_verse_highlights_v1";

  /** Activos oficiales remasterizados (Arquitectura definitiva) */
  const BRAND = {
    logo: "assets/branding/revelatio-logo-master.jpeg",
    logoFull: "assets/branding/revelatio-logo-master.jpeg",
    logoAlt: "assets/branding/revelatio-logo-full-alt-new.jpeg",
    logoLegacy: "assets/branding/revelatio-logo.jpg",
    symbol: "assets/branding/revelatio-symbol-master.jpeg",
    wordmark: "assets/branding/revelatio-wordmark-master.jpeg",
    wordmarkLegacy: "assets/branding/revelatio-wordmark.jpg",
    cielo: "assets/branding/cielo-efata.jpg",
    cieloBw: "assets/branding/cielo-efata-bw.jpg",
    xtrametrik: "assets/branding/xtrametrik-logo.jpg",
    pwa: "assets/branding/revelatio-pwa-icon.jpg",
    navy: "#07101E",
    gold: "#C59B27",
  };
  RV.brand = Object.assign(RV.brand || {}, BRAND);

  /** Frutos del Espíritu — paleta sagrada */
  const COLORS = [
    {
      id: "gozo",
      legacy: ["oro"],
      emoji: "🟡",
      label: "Gozo / Luz",
      title: "Gozo / Luz — fruto del Espíritu",
      css: "gozo",
    },
    {
      id: "bondad",
      legacy: ["esmeralda", "verde"],
      emoji: "🟢",
      label: "Bondad / Gracia",
      title: "Bondad / Gracia — fruto del Espíritu",
      css: "bondad",
    },
    {
      id: "paz",
      legacy: ["zafiro", "azul"],
      emoji: "🔵",
      label: "Paz / Sosiego",
      title: "Paz / Sosiego — fruto del Espíritu",
      css: "paz",
    },
    {
      id: "amor",
      legacy: ["rubi"],
      emoji: "🔴",
      label: "Amor / Redención",
      title: "Amor / Redención — fruto del Espíritu",
      css: "amor",
    },
    {
      id: "paciencia",
      legacy: ["amatista", "purpura"],
      emoji: "🟣",
      label: "Paciencia / Mansedumbre",
      title: "Paciencia / Mansedumbre — fruto del Espíritu",
      css: "paciencia",
    },
  ];

  const CLASS_MAP = {
    gozo: "gozo",
    oro: "gozo",
    bondad: "bondad",
    esmeralda: "bondad",
    verde: "bondad",
    paz: "paz",
    zafiro: "paz",
    azul: "paz",
    amor: "amor",
    rubi: "amor",
    paciencia: "paciencia",
    amatista: "paciencia",
    purpura: "paciencia",
  };

  const ALL_HL_CLASSES = [
    "rv-hl-oro",
    "rv-hl-gozo",
    "rv-hl-verde",
    "rv-hl-bondad",
    "rv-hl-azul",
    "rv-hl-paz",
    "rv-hl-rubi",
    "rv-hl-amor",
    "rv-hl-purpura",
    "rv-hl-paciencia",
  ];

  function readHighlights() {
    try {
      return JSON.parse(localStorage.getItem(LS_HL) || "{}") || {};
    } catch {
      return {};
    }
  }

  function writeHighlights(map) {
    try {
      localStorage.setItem(LS_HL, JSON.stringify(map || {}));
    } catch (err) {
      console.warn("[verse-actions] localStorage:", err?.message || err);
    }
  }

  function versionLabel() {
    const v = String(localStorage.getItem("revelatio_version") || "RVR1960").toUpperCase();
    const labels = {
      RVR1960: "Reina-Valera 1960",
      RV1960: "Reina-Valera 1960",
      RVR1909: "Reina-Valera 1909",
      RV1909: "Reina-Valera 1909",
      DHH: "Dios Habla Hoy",
      TLA: "Traducción en Lenguaje Actual",
      NVI: "Nueva Versión Internacional",
      KJV: "King James Version",
      LXX: "Septuaginta (Griego)",
      SEPTUAGINTA: "Septuaginta (Griego)",
    };
    const fromData = global.RV_DATA?.VERSION_LABEL?.[v.toLowerCase()] || global.RV_DATA?.VERSION_LABEL?.[v];
    return fromData || labels[v] || v;
  }

  function verseTextFromEl(el) {
    if (!el) return "";
    const clone = el.cloneNode(true);
    clone
      .querySelectorAll(".rv-verse-num, .rv-strong-row, .rv-token-meta, .rv-strong-num, sup")
      ?.forEach?.((n) => n.remove());
    return String(clone.textContent || "").replace(/\s+/g, " ").trim();
  }

  function ensureBar() {
    let bar = document.getElementById("rv-verse-actions");
    if (bar) {
      // Migrar swatches si la barra ya existía con IDs viejos
      const group = bar.querySelector(".rv-va-swatches");
      if (group && !group.querySelector("[data-va-hl='gozo']")) {
        group.innerHTML = COLORS.map(
          (c) =>
            `<button type="button" class="rv-va-swatch rv-va-swatch--dot rv-va-swatch--${c.css}" data-va-hl="${c.id}" title="${c.title}" aria-label="${c.label}">${c.emoji}</button>`
        ).join("");
      }
      return bar;
    }
    bar = document.createElement("div");
    bar.id = "rv-verse-actions";
    bar.className = "rv-verse-actions";
    bar.hidden = true;
    bar.setAttribute("role", "toolbar");
    bar.setAttribute("aria-label", "Acciones del versículo");
    bar.innerHTML = `
      <div class="rv-va-swatches" role="group" aria-label="Resaltar · Frutos del Espíritu">
        ${COLORS.map(
          (c) =>
            `<button type="button" class="rv-va-swatch rv-va-swatch--dot rv-va-swatch--${c.css}" data-va-hl="${c.id}" title="${c.title}" aria-label="${c.label}">${c.emoji}</button>`
        ).join("")}
      </div>
      <span class="rv-va-sep" aria-hidden="true"></span>
      <div class="rv-va-acts">
        <button type="button" data-va-act="copy">📋 Copiar</button>
        <button type="button" data-va-act="card">🖼️ Tarjeta</button>
        <button type="button" data-va-act="study">📖 Estudio</button>
        <button type="button" data-va-act="ia">🧠 RevelatiO IA</button>
        <button type="button" data-va-act="clear" title="Deseleccionar">✕</button>
      </div>`;
    document.body.appendChild(bar);
    return bar;
  }

  function clearHighlightClasses(verseEl) {
    if (!verseEl) return;
    ALL_HL_CLASSES.forEach((c) => verseEl.classList.remove(c));
    delete verseEl.dataset.hl;
    verseEl.querySelectorAll(".rv-verse-text, .verse-text").forEach((span) => {
      ALL_HL_CLASSES.forEach((c) => span.classList.remove(c));
      delete span.dataset.hl;
    });
  }

  function applyHighlightClass(verseEl, colorId) {
    if (!verseEl) return;
    const css = CLASS_MAP[colorId] || colorId;
    clearHighlightClasses(verseEl);
    verseEl.classList.add(`rv-hl-${css}`);
    verseEl.dataset.hl = css;
    const textSpan = verseEl.querySelector(".rv-verse-text, .verse-text");
    if (textSpan) {
      textSpan.classList.add(`rv-hl-${css}`);
      textSpan.dataset.hl = css;
    }
  }

  function findVerseEl(passage) {
    const ref = String(passage || "").trim();
    if (!ref) return null;
    const esc = typeof CSS !== "undefined" && CSS.escape ? CSS.escape(ref) : ref.replace(/"/g, '\\"');
    return (
      document.querySelector(`#texto-biblico .rv-verse-surface[data-reference="${esc}"]`) ||
      document.querySelector(`#verses-container .rv-verse-surface[data-reference="${esc}"]`) ||
      document.querySelector(`#texto-biblico .rv-verse-surface[data-passage="${esc}"]`) ||
      document.querySelector(`#verses-container .rv-verse-surface[data-passage="${esc}"]`) ||
      document.querySelector(`.rv-verse-surface.is-va-active, .rv-verse-surface.is-verse-on`)
    );
  }

  function saveHighlightToNotebook(passage, text, colorId) {
    const save = global.saveNotebookEntry || RV.notebook?.saveNotebookEntry;
    if (typeof save !== "function") return null;
    return save({
      passage,
      text,
      category: "RESALTADOS",
      color: colorId,
      source: "highlight",
    });
  }

  function saveCopyToNotebook(passage, text) {
    const save = global.saveNotebookEntry || RV.notebook?.saveNotebookEntry;
    if (typeof save !== "function") return null;
    return save({
      passage,
      text,
      category: "NOTAS",
      customNote: "Copiado al portapapeles",
      source: "copy",
    });
  }

  function openNotebook(filter) {
    const open = global.openNotebookDrawer || RV.notebook?.openNotebookDrawer || RV.ui?.abrirCuaderno;
    if (typeof open === "function") open(filter);
    else document.getElementById("abrir-cuaderno")?.click();
  }

  function openIaWithVerse(ref, text) {
    const prompt = `Analiza y aplica ${ref || "este pasaje"}:\n«${text || ""}»`;
    if (typeof global.openAiModal === "function") {
      global.openAiModal("exegesis", prompt);
      return;
    }
    if (typeof RV.ai?.open === "function") {
      RV.ai.open(prompt, "exegesis");
      return;
    }
    document.dispatchEvent(new CustomEvent("revelatio:ask-ai", { detail: { prompt, mode: "exegesis" } }));
    document.getElementById("btn-asistente-ia")?.click();
  }

  /** API pública: resaltar versículo activo y registrar en Cuaderno → RESALTADOS */
  global.applyHighlight = function applyHighlight(colorName) {
    const passage = global.currentSelectedPassage || "";
    const text = global.currentSelectedText || "";
    if (!passage && !text) return;

    const colorId = CLASS_MAP[colorName] || colorName || "gozo";
    const el = findVerseEl(passage);
    if (el) applyHighlightClass(el, colorId);

    const map = readHighlights();
    if (passage) {
      map[passage] = colorId;
      writeHighlights(map);
    }

    if (passage && text) saveHighlightToNotebook(passage, text, colorId);

    const api = RV.verseActions;
    if (api?.hide) api.hide();
    else global.clearVerseSelection?.();
  };

  /** API pública: copiar + apunte en Cuaderno → NOTAS + abrir panel */
  global.copySelectedVerse = async function copySelectedVerse() {
    const passage = global.currentSelectedPassage || "";
    const text = global.currentSelectedText || "";
    if (!passage && !text) return;

    const fullText = `«${text}» — ${passage} (${versionLabel()}) · Éfata RevelatiO`;
    try {
      await navigator.clipboard.writeText(fullText);
    } catch {
      try {
        const ta = document.createElement("textarea");
        ta.value = fullText;
        document.body.appendChild(ta);
        ta.select();
        document.execCommand("copy");
        ta.remove();
      } catch {
        /* ignore */
      }
    }

    if (passage && text) saveCopyToNotebook(passage, text);
    openNotebook("NOTAS");

    const api = RV.verseActions;
    if (api?.hide) api.hide();
    else global.clearVerseSelection?.();
  };

  global.clearVerseSelection = function clearVerseSelection() {
    document
      .querySelectorAll(
        "#texto-biblico .is-verse-on, #texto-biblico .is-va-active, #verses-container .is-verse-on, #verses-container .is-va-active"
      )
      .forEach((n) => n.classList.remove("is-verse-on", "is-va-active"));
    document.body.classList.remove("is-verse-study");
    global.currentSelectedPassage = "";
    global.currentSelectedText = "";
    const bar = document.getElementById("rv-verse-actions");
    if (bar) {
      bar.hidden = true;
      bar.classList.remove("is-on");
    }
  };

  function restoreHighlights() {
    const map = readHighlights();
    Object.entries(map).forEach(([ref, colorId]) => {
      const el =
        document.querySelector(
          `#texto-biblico .rv-verse-surface[data-reference="${CSS.escape(ref)}"]`
        ) ||
        document.querySelector(
          `#verses-container .rv-verse-surface[data-reference="${CSS.escape(ref)}"]`
        ) ||
        document.querySelector(
          `#texto-biblico .rv-verse-surface[data-passage="${CSS.escape(ref)}"]`
        );
      if (el) applyHighlightClass(el, colorId);
    });
  }

  function wrapCanvasText(ctx, text, maxWidth) {
    const words = String(text || "")
      .replace(/\s+/g, " ")
      .trim()
      .split(" ");
    const lines = [];
    let line = "";
    for (const word of words) {
      const test = line ? `${line} ${word}` : word;
      if (ctx.measureText(test).width > maxWidth && line) {
        lines.push(line);
        line = word;
      } else line = test;
    }
    if (line) lines.push(line);
    return lines.slice(0, 16);
  }

  function roundRectPath(ctx, x, y, width, height, radius) {
    const r = Math.min(radius, width / 2, height / 2);
    ctx.beginPath();
    ctx.moveTo(x + r, y);
    ctx.arcTo(x + width, y, x + width, y + height, r);
    ctx.arcTo(x + width, y + height, x, y + height, r);
    ctx.arcTo(x, y + height, x, y, r);
    ctx.arcTo(x, y, x + width, y, r);
    ctx.closePath();
  }

  function fontStackForType(tipo) {
    if (tipo === "monumental") {
      return {
        verse: '600 46px Cinzel, "Playfair Display", Georgia, serif',
        ref: "600 22px Cinzel, Georgia, serif",
        align: "center",
        leadingFactor: 1.45,
      };
    }
    if (tipo === "italica" || tipo === "editorial") {
      return {
        verse: 'italic 500 48px "Cormorant Garamond", "Source Serif 4", Georgia, serif',
        ref: "600 22px Cinzel, Georgia, serif",
        align: "center",
        leadingFactor: 1.55,
      };
    }
    // lectura / serif editorial (altas y bajas)
    return {
      verse: '500 44px "Source Serif 4", "Playfair Display", Georgia, serif',
      ref: "600 20px Cinzel, Georgia, serif",
      align: "center",
      leadingFactor: 1.5,
    };
  }

  /**
   * Tarjeta compartible nocturna: scrim de alto contraste, logo sin marco cuadrado,
   * versículo en blanco nítido y acentos Oro Sacro.
   */
  function drawVerseCard(canvas, options = {}) {
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    const w = canvas.width || 1080;
    const h = canvas.height || 1350;
    const text = String(options.text || "")
      .replace(/^[\d\s]+/, "")
      .replace(/\s+/g, " ")
      .trim();
    const ref = String(options.ref || "").trim();
    const version = String(options.version || "").trim();
    const tipo = options.tipo || "lectura";
    const fonts = fontStackForType(tipo);
    const logoImg = options.logoImg || options.wordmark || null;
    const bgImg = options.bgImg || options.backgroundImg || null;

    ctx.clearRect(0, 0, w, h);

    // 1) Fondo fotográfico o noche sólida
    if (bgImg && bgImg.complete && bgImg.naturalWidth) {
      const scale = Math.max(w / bgImg.width, h / bgImg.height);
      const dw = bgImg.width * scale;
      const dh = bgImg.height * scale;
      ctx.drawImage(bgImg, (w - dw) / 2, (h - dh) / 2, dw, dh);
    } else {
      const night = ctx.createLinearGradient(0, 0, 0, h);
      night.addColorStop(0, "#0A192F");
      night.addColorStop(1, "#07101E");
      ctx.fillStyle = night;
      ctx.fillRect(0, 0, w, h);
    }

    // 2) Overlay degradado de alto contraste (Azul Noche profundo)
    const scrim = ctx.createLinearGradient(0, 0, 0, h);
    scrim.addColorStop(0, "rgba(7, 16, 30, 0.85)");
    scrim.addColorStop(0.5, "rgba(7, 16, 30, 0.70)");
    scrim.addColorStop(1, "rgba(7, 16, 30, 0.90)");
    ctx.fillStyle = scrim;
    ctx.fillRect(0, 0, w, h);

    // 3) Logotipo integrado (sin recuadro cuadrado)
    let brandBottom = h * 0.16;
    if (logoImg && logoImg.complete && logoImg.naturalWidth) {
      const logoW = Math.min(w * 0.45, 260);
      const logoH = (logoImg.height / Math.max(1, logoImg.width)) * logoW;
      const logoX = (w - logoW) / 2;
      const logoY = h * 0.08;
      ctx.save();
      ctx.shadowColor = "rgba(0, 0, 0, 0.5)";
      ctx.shadowBlur = 15;
      ctx.drawImage(logoImg, logoX, logoY, logoW, logoH);
      ctx.restore();
      brandBottom = logoY + logoH + h * 0.035;
    } else {
      ctx.save();
      ctx.font = "600 28px Cinzel, Georgia, serif";
      ctx.fillStyle = "#DFB743";
      ctx.textAlign = "center";
      ctx.shadowColor = "rgba(0, 0, 0, 0.55)";
      ctx.shadowBlur = 10;
      ctx.fillText("Éfata RevelatiO", w / 2, h * 0.12);
      ctx.restore();
      brandBottom = h * 0.16;
    }

    // Insignia superior
    const badge = "REFLEXIÓN BÍBLICA";
    ctx.font = "600 16px Cinzel, Georgia, serif";
    const bw = ctx.measureText(badge).width + 48;
    const bx = (w - bw) / 2;
    const by = brandBottom;
    ctx.fillStyle = "rgba(223, 183, 67, 0.15)";
    ctx.strokeStyle = "rgba(223, 183, 67, 0.4)";
    ctx.lineWidth = 1.5;
    roundRectPath(ctx, bx, by, bw, 40, 10);
    ctx.fill();
    ctx.stroke();
    ctx.fillStyle = "#DFB743";
    ctx.textAlign = "center";
    ctx.textBaseline = "middle";
    ctx.fillText(badge, w / 2, by + 20);
    ctx.textBaseline = "alphabetic";

    // Tipografía del versículo (blanco puro, altas y bajas)
    ctx.font = fonts.verse;
    const fontSizeMatch = String(fonts.verse).match(/(\d+)px/);
    const fontPx = fontSizeMatch ? Number(fontSizeMatch[1]) : 44;
    const leading = Math.round(fontPx * fonts.leadingFactor);
    const maxW = w - Math.round(w * 0.18);
    const lines = wrapCanvasText(ctx, text ? `«${text}»` : "", maxW);
    const blockH = lines.length * leading;
    let y = Math.max(by + 90, h * 0.42 - blockH / 2);
    const x = fonts.align === "left" ? Math.round(w * 0.11) : w / 2;
    ctx.textAlign = fonts.align;

    lines.forEach((line) => {
      ctx.save();
      ctx.shadowColor = "rgba(0, 0, 0, 0.85)";
      ctx.shadowBlur = 12;
      ctx.shadowOffsetY = 3;
      ctx.fillStyle = "#FFFFFF";
      ctx.fillText(line, x, y);
      ctx.restore();
      y += leading;
    });

    // Línea separadora oro tenue + cita
    const lineY = y + 28;
    ctx.strokeStyle = "rgba(197, 155, 39, 0.4)";
    ctx.lineWidth = 1.5;
    ctx.beginPath();
    ctx.moveTo(w / 2 - 100, lineY);
    ctx.lineTo(w / 2 + 100, lineY);
    ctx.stroke();

    ctx.font = fonts.ref;
    ctx.fillStyle = "#DFB743";
    ctx.textAlign = "center";
    ctx.shadowColor = "rgba(0, 0, 0, 0.45)";
    ctx.shadowBlur = 6;
    ctx.fillText((ref || "").toUpperCase(), w / 2, lineY + 42);
    ctx.shadowBlur = 0;

    if (version) {
      ctx.font = '500 16px "Source Serif 4", Georgia, serif';
      ctx.fillStyle = "rgba(248, 250, 252, 0.72)";
      ctx.fillText(version, w / 2, lineY + 72);
    }

    // Pie discreto
    ctx.font = '400 15px "Source Serif 4", Georgia, serif';
    ctx.fillStyle = "rgba(248, 250, 252, 0.55)";
    ctx.fillText("Éfata RevelatiO · Inteligencia Exegética", w / 2, h - 56);
  }

  global.drawVerseCard = drawVerseCard;
  RV.drawVerseCard = drawVerseCard;

  function createApi() {
    if (typeof document === "undefined" || !document.body) {
      return {
        show: () => {},
        hide: () => {},
        restoreHighlights: () => {},
      };
    }
    const bar = ensureBar();
    if (!bar) {
      return {
        show: () => {},
        hide: () => {},
        restoreHighlights: () => {},
      };
    }
    const legacy = document.getElementById("rv-popover");
    if (legacy) {
      legacy.hidden = true;
      legacy.setAttribute("aria-hidden", "true");
      legacy.style.display = "none";
    }

    let activeEl = null;
    let activeRef = "";
    let activeText = "";

    const hide = () => {
      bar.hidden = true;
      bar.classList.remove("is-on");
      activeEl?.classList.remove("is-va-active", "is-verse-on");
      activeEl = null;
      activeRef = "";
      activeText = "";
      global.currentSelectedPassage = "";
      global.currentSelectedText = "";
      document.body.classList.remove("is-verse-study");
    };

    const place = (el) => {
      const rect = el.getBoundingClientRect();
      bar.hidden = false;
      bar.classList.add("is-on");
      const w = bar.offsetWidth || 420;
      const h = bar.offsetHeight || 44;
      let left = rect.left + rect.width / 2 - w / 2;
      left = Math.max(8, Math.min(window.innerWidth - w - 8, left));
      let top = rect.top - h - 10;
      if (top < 8) top = rect.bottom + 10;
      bar.style.left = `${Math.round(left)}px`;
      bar.style.top = `${Math.round(top)}px`;
    };

    const show = (el, passageRef, verseText) => {
      if (!el) return;
      document
        .querySelectorAll(
          "#texto-biblico .is-verse-on, #texto-biblico .is-va-active, #verses-container .is-verse-on, #verses-container .is-va-active"
        )
        .forEach((n) => {
          if (n !== el) n.classList.remove("is-verse-on", "is-va-active");
        });
      activeEl?.classList.remove("is-va-active");
      activeEl = el;
      activeEl.classList.add("is-va-active", "is-verse-on");
      activeRef =
        passageRef ||
        el.dataset.reference ||
        el.dataset.passage ||
        "";
      if (activeRef) el.dataset.reference = activeRef;
      const textNode = el.querySelector(".rv-verse-text, .verse-text") || el;
      activeText =
        (verseText != null && String(verseText).trim()) ||
        el.dataset.text ||
        verseTextFromEl(textNode);
      global.currentSelectedPassage = activeRef;
      global.currentSelectedText = activeText;
      place(el);
      document.body.classList.add("is-verse-study");
      document.dispatchEvent(
        new CustomEvent("revelatio:verse-selected", {
          detail: { ref: activeRef, text: activeText, el },
        })
      );
    };

    /** API pública usada por reader-view.js */
    const selectVerseForAction = (el, passageRef, verseText) => {
      show(el, passageRef, verseText);
    };

    bar.addEventListener("click", async (event) => {
      event.preventDefault();
      event.stopPropagation();
      const hl = event.target.closest("[data-va-hl]");
      if (hl) {
        const colorId = hl.dataset.vaHl;
        const mapped = CLASS_MAP[colorId] || colorId;
        if (!activeEl) {
          activeEl = findVerseEl(global.currentSelectedPassage || activeRef);
        }
        if (!activeEl) return;
        if (!activeRef) {
          activeRef =
            activeEl.dataset.reference ||
            activeEl.dataset.passage ||
            global.currentSelectedPassage ||
            "";
        }
        if (!activeText) {
          activeText =
            activeEl.dataset.text ||
            global.currentSelectedText ||
            verseTextFromEl(activeEl);
        }
        global.currentSelectedPassage = activeRef;
        global.currentSelectedText = activeText;

        const current = activeEl.dataset.hl;
        const map = readHighlights();
        if (current === mapped) {
          clearHighlightClasses(activeEl);
          delete map[activeRef];
          writeHighlights(map);
        } else {
          applyHighlightClass(activeEl, mapped);
          map[activeRef] = mapped;
          writeHighlights(map);
          if (activeRef && activeText) {
            saveHighlightToNotebook(activeRef, activeText, mapped);
          }
        }
        return;
      }
      const act = event.target.closest("[data-va-act]")?.dataset?.vaAct;
      if (!act) return;

      if (act === "copy") {
        global.currentSelectedPassage = activeRef || global.currentSelectedPassage;
        global.currentSelectedText = activeText || global.currentSelectedText;
        await global.copySelectedVerse();
        return;
      }
      if (act === "card") {
        const cardDetail = {
          text: activeText,
          ref: activeRef,
          version: versionLabel(),
          brandLogo: BRAND.wordmark,
          brandWatermark: BRAND.cieloBw,
          brandNavy: BRAND.navy,
        };
        if (typeof global.abrirEfataCard === "function") {
          global.abrirEfataCard(cardDetail);
        } else {
          document.dispatchEvent(
            new CustomEvent("revelatio:open-card", {
              detail: cardDetail,
            })
          );
        }
        return;
      }
      if (act === "study") {
        document.dispatchEvent(
          new CustomEvent("revelatio:open-study-panel", {
            detail: { tab: "comentarios", ref: activeRef },
          })
        );
        RV.studyPanel?.open?.({ tab: "comentarios", ref: activeRef });
        return;
      }
      if (act === "ia") {
        openIaWithVerse(activeRef, activeText);
        return;
      }
      if (act === "clear") {
        global.clearVerseSelection?.();
        hide();
      }
    });

    const VERSE_SELECTOR =
      "#texto-biblico .rv-verse-surface, #verses-container .rv-verse-surface, #texto-biblico .verse-item, #verses-container .verse-item, #texto-biblico [data-versiculo], #verses-container [data-versiculo]";

    document.addEventListener("click", (event) => {
      const inVisor =
        document.body?.classList?.contains("is-santuario") ||
        document.body?.classList?.contains("visor-active") ||
        document.body?.classList?.contains("aposento-active") ||
        Boolean(document.getElementById("texto-biblico")?.contains?.(event.target));
      if (!inVisor) return;

      if (event.target.closest?.("#rv-verse-actions, #study-drawer, #rv-study-panel, #panel-asistente-ia")) {
        return;
      }
      if (event.target.closest?.("button, a, select, input, textarea, #rv-bible-nav")) {
        if (!event.target.closest?.(VERSE_SELECTOR)) {
          if (!event.target.closest?.("#rv-verse-actions")) {
            document.body.classList.remove("is-verse-study");
            hide();
          }
        }
        return;
      }
      const verse = event.target.closest?.(VERSE_SELECTOR);
      if (verse) {
        show(verse);
        return;
      }
      document.body.classList.remove("is-verse-study");
      hide();
    });

    document.addEventListener(
      "scroll",
      () => {
        if (activeEl && bar.classList.contains("is-on")) place(activeEl);
      },
      true
    );
    window.addEventListener("resize", () => {
      if (activeEl && bar.classList.contains("is-on")) place(activeEl);
    });

    document.addEventListener("rv:route", () => setTimeout(restoreHighlights, 400));
    document.addEventListener("revelatio:passage-ready", () => setTimeout(restoreHighlights, 200));

    // Exponer puente global para reader-view / legacy
    global.selectVerseForAction = selectVerseForAction;
    global.handleVerseClick = (el, ref, text) => show(el, ref, text);

    return { show, hide, restoreHighlights, selectVerseForAction };
  }

  let api = null;
  function mount() {
    if (api) return api;
    api = createApi();
    setTimeout(restoreHighlights, 600);
    RV.verseActions = api;
    global.selectVerseForAction = api.selectVerseForAction;
    return api;
  }

  RV.verseActions = { mount, restore: () => mount().restoreHighlights() };
  if (document.readyState === "loading") document.addEventListener("DOMContentLoaded", mount);
  else mount();
})(typeof window !== "undefined" ? window : globalThis);
