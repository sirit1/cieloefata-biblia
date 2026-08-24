/**
 * Éfata RevelatiO — notebook.js
 * Puente de apuntes: localStorage + RV.storage + UI del Cuaderno del Peregrino.
 */
(function (global) {
  "use strict";

  const RV = (global.RV = global.RV || {});
  const NOTEBOOK_KEY = "efata_cuaderno_apuntes";

  const CATEGORY_TO_TIPO = {
    RESALTADOS: "resaltado",
    NOTAS: "nota",
    ESTUDIOS: "estudio",
    IA: "ia",
    SERMONES: "sermon",
  };

  const TIPO_TO_CATEGORY = {
    resaltado: "RESALTADOS",
    nota: "NOTAS",
    estudio: "ESTUDIOS",
    estudio_oia: "ESTUDIOS",
    ia: "IA",
    sermon: "SERMONES",
  };

  function escapeHtml(s) {
    return String(s || "")
      .replace(/&/g, "&amp;")
      .replace(/</g, "&lt;")
      .replace(/>/g, "&gt;")
      .replace(/"/g, "&quot;");
  }

  function formatDate(isoOrDate) {
    const d = isoOrDate instanceof Date ? isoOrDate : new Date(isoOrDate || Date.now());
    if (Number.isNaN(d.getTime())) {
      return new Date().toLocaleDateString("es-ES", {
        day: "2-digit",
        month: "short",
        year: "numeric",
        hour: "2-digit",
        minute: "2-digit",
      });
    }
    return d.toLocaleDateString("es-ES", {
      day: "2-digit",
      month: "short",
      year: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    });
  }

  function readLegacyMirror() {
    try {
      return JSON.parse(localStorage.getItem(NOTEBOOK_KEY)) || [];
    } catch {
      return [];
    }
  }

  function writeLegacyMirror(entries) {
    try {
      localStorage.setItem(NOTEBOOK_KEY, JSON.stringify(entries || []));
    } catch (err) {
      console.warn("[notebook] localStorage:", err?.message || err);
    }
  }

  function storageItemsToEntries(items) {
    return (items || []).map((item) => ({
      id: item.id,
      passage: item.referencia || item.titulo || "",
      text: item.texto || "",
      category: TIPO_TO_CATEGORY[item.tipo] || "NOTAS",
      color: item.color || null,
      date: item.createdAtLabel || formatDate(item.createdAt),
      customNote: item.titulo && item.tipo === "nota" ? String(item.titulo) : "",
      _tipo: item.tipo,
    }));
  }

  function getNotebookEntries() {
    if (RV.storage?.readNotebook) {
      try {
        const nb = RV.storage.readNotebook();
        const entries = storageItemsToEntries(nb.items);
        writeLegacyMirror(entries);
        return entries;
      } catch {
        /* fall through */
      }
    }
    return readLegacyMirror();
  }

  function updateNotebookStorageUsage() {
    const data = localStorage.getItem(NOTEBOOK_KEY) || "";
    let bytes = data.length;
    try {
      bytes = new Blob([data]).size;
    } catch {
      /* ignore */
    }
    if (RV.storage?.readNotebook) {
      try {
        bytes = RV.storage.cuotaBytes(RV.storage.readNotebook().items);
      } catch {
        /* ignore */
      }
    }
    const kb = (bytes / 1024).toFixed(1);
    const maxKb = Math.round((RV.storage?.CUOTA_MAX || 180 * 1024) / 1024);
    const el =
      document.getElementById("notebook-usage-counter") ||
      document.getElementById("cuota-label");
    if (el) {
      if (el.id === "cuota-label") {
        el.textContent = `${kb} KB / ${maxKb} KB`;
      } else {
        el.textContent = `${kb} KB DE ${maxKb} KB`;
      }
    }
  }

  function renderNotebook(filterCategory = "TODO") {
    const container =
      document.getElementById("notebook-entries-container") ||
      document.getElementById("cuaderno-lista") ||
      document.getElementById("lista-cuaderno");
    if (!container) return;

    // Si el listado oficial del Cuaderno está activo, pedimos refresco al núcleo
    if (container.id === "lista-cuaderno") {
      try {
        document.dispatchEvent(
          new CustomEvent("revelatio:cuaderno-refresh", {
            detail: {
              filtro:
                filterCategory === "TODO" || filterCategory === "TODAS"
                  ? "todas"
                  : CATEGORY_TO_TIPO[filterCategory] || String(filterCategory).toLowerCase(),
            },
          })
        );
      } catch {
        /* ignore */
      }
      updateNotebookStorageUsage();
      return;
    }

    const entries = getNotebookEntries();
    const filtered =
      filterCategory === "TODO" || filterCategory === "TODAS"
        ? entries
        : entries.filter((e) => e.category === filterCategory);

    if (filtered.length === 0) {
      container.innerHTML = `
      <div class="py-12 px-4 text-center text-stone-400 font-serif">
        <p class="text-xs uppercase tracking-wider font-mono mb-1 text-stone-500">Bandeja Vacía</p>
        <p class="text-xs italic leading-relaxed">No hay apuntes registrados en esta categoría.</p>
      </div>`;
      updateNotebookStorageUsage();
      return;
    }

    container.innerHTML = filtered
      .map((item) => {
        const colorBorder =
          item.color === "gozo" || item.color === "yellow" || item.color === "oro"
            ? "border-amber-400 bg-amber-100/60"
            : item.color === "bondad" || item.color === "green"
              ? "border-emerald-400 bg-emerald-100/60"
              : item.color === "paz" || item.color === "blue"
                ? "border-sky-400 bg-sky-100/60"
                : item.color === "amor" || item.color === "red"
                  ? "border-rose-400 bg-rose-100/60"
                  : item.color === "paciencia" || item.color === "purple"
                    ? "border-purple-400 bg-purple-100/60"
                    : "";
        return `
    <div class="bg-white border border-[#E8DFC8] rounded-xl p-4 shadow-sm hover:border-[#C59B27] transition-all text-left font-serif mb-3 relative group" data-nb-id="${escapeHtml(item.id)}">
      <div class="flex items-center justify-between pb-1.5 mb-2 border-b border-stone-100">
        <span class="text-xs font-mono font-bold text-[#855D10]">${escapeHtml(item.passage)}</span>
        <div class="flex items-center gap-2">
          <span class="text-[9px] font-mono font-bold px-1.5 py-0.5 rounded ${
            item.category === "RESALTADOS"
              ? "bg-amber-100 text-amber-800"
              : item.category === "IA"
                ? "bg-purple-100 text-purple-800"
                : "bg-stone-100 text-stone-700"
          }">${escapeHtml(item.category)}</span>
          <button type="button" data-nb-delete="${escapeHtml(item.id)}" class="text-stone-300 hover:text-rose-600 text-xs" aria-label="Eliminar">&times;</button>
        </div>
      </div>
      <p class="text-xs text-[#0F172A] leading-relaxed italic ${colorBorder ? `p-2 rounded-lg border-l-2 ${colorBorder}` : ""}">
        «${escapeHtml(item.text)}»
      </p>
      ${item.customNote ? `<p class="mt-2 text-xs text-stone-600 font-sans border-t border-stone-100 pt-1.5">${escapeHtml(item.customNote)}</p>` : ""}
      <span class="block mt-2 text-[10px] font-mono text-stone-400 text-right">${escapeHtml(item.date)}</span>
    </div>`;
      })
      .join("");

    updateNotebookStorageUsage();
  }

  function saveNotebookEntry(entry = {}) {
    const category = String(entry.category || "NOTAS").toUpperCase();
    const tipo = CATEGORY_TO_TIPO[category] || "nota";
    const passage = String(entry.passage || "").trim();
    const text = String(entry.text || "").trim();
    const customNote = String(entry.customNote || "").trim();
    const color = entry.color || null;

    let saved = null;
    if (RV.storage?.addEntry) {
      saved = RV.storage.addEntry({
        tipo,
        titulo: customNote || (tipo === "resaltado" ? `Resaltado · ${passage}` : ""),
        referencia: passage,
        texto: text,
        color,
        archivo: "temporal",
        source: entry.source || "verse-actions",
      });
    } else {
      const entries = readLegacyMirror();
      saved = {
        id: Date.now().toString(),
        passage,
        text,
        category,
        color,
        date: formatDate(new Date()),
        customNote,
      };
      entries.unshift(saved);
      writeLegacyMirror(entries);
    }

    // Espejo plano para lecturas rápidas
    writeLegacyMirror(getNotebookEntries());

    renderNotebook(category === "RESALTADOS" ? "RESALTADOS" : category === "NOTAS" ? "NOTAS" : "TODO");
    updateNotebookStorageUsage();

    try {
      document.dispatchEvent(
        new CustomEvent("revelatio:cuaderno-refresh", {
          detail: { filtro: tipo, item: saved },
        })
      );
    } catch {
      /* ignore */
    }

    return saved
      ? {
          id: saved.id,
          passage: saved.referencia || passage,
          text: saved.texto || text,
          category,
          color,
          date: saved.createdAtLabel || formatDate(saved.createdAt),
          customNote,
        }
      : null;
  }

  function deleteNotebookEntry(id) {
    const target = String(id || "");
    if (!target) return;

    if (RV.storage?.readNotebook && RV.storage?.writeNotebook) {
      const nb = RV.storage.readNotebook();
      RV.storage.writeNotebook((nb.items || []).filter((e) => e.id !== target));
    } else {
      writeLegacyMirror(readLegacyMirror().filter((e) => e.id !== target));
    }
    writeLegacyMirror(getNotebookEntries());
    renderNotebook();
    updateNotebookStorageUsage();
    try {
      document.dispatchEvent(new CustomEvent("revelatio:cuaderno-refresh", { detail: {} }));
    } catch {
      /* ignore */
    }
  }

  function openNotebookDrawer(filterCategory) {
    const filtroRaw = String(filterCategory || "TODO").toUpperCase();
    const filtro =
      filtroRaw === "TODO" || filtroRaw === "TODAS"
        ? "todas"
        : CATEGORY_TO_TIPO[filtroRaw] || filtroRaw.toLowerCase();

    if (typeof RV.ui?.abrirCuaderno === "function") {
      RV.ui.abrirCuaderno();
    } else {
      document.getElementById("abrir-cuaderno")?.click();
      document.getElementById("modulo-cuaderno")?.classList.add("is-open");
    }

    setTimeout(() => {
      const tab = document.querySelector(`#filtros-cuaderno [data-filtro="${filtro}"]`);
      if (tab) tab.click();
      else {
        try {
          document.dispatchEvent(
            new CustomEvent("revelatio:cuaderno-refresh", { detail: { filtro } })
          );
        } catch {
          /* ignore */
        }
      }
      renderNotebook(filtroRaw === "TODO" ? "TODO" : filtroRaw);
    }, 60);
  }

  document.addEventListener("click", (event) => {
    const del = event.target.closest?.("[data-nb-delete]");
    if (!del) return;
    event.preventDefault();
    deleteNotebookEntry(del.getAttribute("data-nb-delete"));
  });

  const api = {
    NOTEBOOK_KEY,
    getNotebookEntries,
    saveNotebookEntry,
    renderNotebook,
    updateNotebookStorageUsage,
    deleteNotebookEntry,
    openNotebookDrawer,
  };

  RV.notebook = api;
  global.getNotebookEntries = getNotebookEntries;
  global.saveNotebookEntry = saveNotebookEntry;
  global.renderNotebook = renderNotebook;
  global.updateNotebookStorageUsage = updateNotebookStorageUsage;
  global.deleteNotebookEntry = deleteNotebookEntry;
  global.openNotebookDrawer = openNotebookDrawer;

  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", () => updateNotebookStorageUsage());
  } else {
    updateNotebookStorageUsage();
  }
})(typeof window !== "undefined" ? window : globalThis);
