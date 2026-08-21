/**
 * Éfata RevelatiO — storage.js
 * Persistencia local del Cuaderno del Peregrino + garbage collection por TTL.
 */
(function (global) {
    "use strict";

    const RV = (global.RV = global.RV || {});

    const STORAGE_KEY_BASE = "revelatio_cuaderno_v1";
    /** Retención de notas temporales (días). */
    const RETENTION_DAYS = 30;
    const TTL_MS = RETENTION_DAYS * 24 * 60 * 60 * 1000;
    const CUOTA_MAX = 180 * 1024;

    function parseJson(raw, fallback) {
        try {
            return JSON.parse(raw);
        } catch {
            return fallback;
        }
    }

    function emailKey(email) {
        return String(email || "")
            .trim()
            .toLowerCase()
            .replace(/[^a-z0-9@._+-]/g, "");
    }

    function storageKey(email) {
        const key = emailKey(email);
        return key ? `${STORAGE_KEY_BASE}__${key}` : STORAGE_KEY_BASE;
    }

    function resolveKey() {
        try {
            const perfil = parseJson(localStorage.getItem("revelatio_perfil_v1"), null);
            return storageKey(perfil?.email);
        } catch {
            return STORAGE_KEY_BASE;
        }
    }

    function uid() {
        return (global.crypto?.randomUUID && global.crypto.randomUUID()) || `rv-${Date.now()}-${Math.random().toString(16).slice(2)}`;
    }

    function nowIso() {
        return new Date().toISOString();
    }

    /** Fecha y hora exactas para índice de apuntes (es-ES). */
    function formatDateTime(iso) {
        const d = new Date(iso || Date.now());
        if (Number.isNaN(d.getTime())) return "—";
        return d.toLocaleString("es-ES", {
            day: "2-digit",
            month: "short",
            year: "numeric",
            hour: "2-digit",
            minute: "2-digit",
            second: "2-digit",
        });
    }

    function expiresAt(item) {
        if (!item || item.archivo === "permanente") return null;
        const start = Date.parse(item.createdAt || item.updatedAt || 0);
        if (!start) return null;
        return start + TTL_MS;
    }

    function isExpired(item, now = Date.now()) {
        const end = expiresAt(item);
        return end !== null && end <= now;
    }

    function daysLeft(item, now = Date.now()) {
        const end = expiresAt(item);
        if (end === null) return null;
        return Math.ceil((end - now) / 86400000);
    }

    /**
     * Garbage collection: elimina entradas temporales que superan la retención.
     * Conserva archivo permanente.
     * @returns {{ store: object, purged: number, kept: number }}
     */
    function garbageCollect(store, opts = {}) {
        const now = opts.now || Date.now();
        const items = Array.isArray(store?.items) ? store.items : [];
        const kept = [];
        let purged = 0;
        for (const item of items) {
            if (isExpired(item, now)) {
                purged += 1;
                continue;
            }
            kept.push(item);
        }
        return {
            store: { items: kept },
            purged,
            kept: kept.length,
        };
    }

    function readRaw(key) {
        const k = key || resolveKey();
        let data = parseJson(localStorage.getItem(k), null);
        if (data && Array.isArray(data.items)) return { key: k, data };
        if (k !== STORAGE_KEY_BASE) {
            const legacy = parseJson(localStorage.getItem(STORAGE_KEY_BASE), null);
            if (legacy && Array.isArray(legacy.items) && legacy.items.length) {
                try {
                    localStorage.setItem(k, JSON.stringify(legacy));
                } catch { /* cuota */ }
                return { key: k, data: legacy };
            }
        }
        return { key: k, data: { items: [] } };
    }

    function writeRaw(store, key) {
        const k = key || resolveKey();
        localStorage.setItem(k, JSON.stringify({ items: store.items || [] }));
        return store;
    }

    /** Lee el cuaderno y aplica GC automáticamente. */
    function readNotebook(opts = {}) {
        const { key, data } = readRaw(opts.key);
        const result = garbageCollect(data, opts);
        if (result.purged > 0 || opts.forceWrite) {
            try {
                writeRaw(result.store, key);
            } catch { /* ignore */ }
        }
        return {
            key,
            items: result.store.items,
            purged: result.purged,
            retentionDays: RETENTION_DAYS,
        };
    }

    function writeNotebook(items, opts = {}) {
        const key = opts.key || resolveKey();
        const cleaned = garbageCollect({ items: Array.isArray(items) ? items : [] }, opts);
        writeRaw(cleaned.store, key);
        return cleaned;
    }

    /**
     * Inserta un apunte con marca de fecha/hora exacta.
     */
    function addEntry(parcial = {}) {
        const nb = readNotebook();
        const createdAt = parcial.createdAt || nowIso();
        const item = {
            id: parcial.id || uid(),
            tipo: parcial.tipo || "nota",
            titulo: parcial.titulo || "",
            referencia: parcial.referencia || "",
            texto: parcial.texto || "",
            color: parcial.color || null,
            archivo: parcial.archivo || "temporal",
            createdAt,
            updatedAt: nowIso(),
            createdAtLabel: formatDateTime(createdAt),
            supabaseId: parcial.supabaseId || null,
            sync: parcial.sync || "local",
            source: parcial.source || "manual",
            tags: Array.isArray(parcial.tags) ? parcial.tags.filter(Boolean) : [],
            oia: parcial.oia || null,
        };
        nb.items.unshift(item);
        writeNotebook(nb.items);
        try {
            global.dispatchEvent(
                new CustomEvent("revelatio:cuaderno-add", { detail: { item, purged: nb.purged } })
            );
        } catch { /* ignore */ }
        return item;
    }

    function cuotaBytes(items) {
        return new Blob([JSON.stringify(items || [])]).size;
    }

    function toMarkdown(items) {
        const list = Array.isArray(items) ? items : readNotebook().items;
        const head = `# Cuaderno del Peregrino — Éfata RevelatiO\n\nExportado el ${formatDateTime(nowIso())}\nRetención temporal: ${RETENTION_DAYS} días\n\n`;
        return (
            head +
            list
                .map((item) => {
                    const when = formatDateTime(item.createdAt || item.updatedAt);
                    const kind = item.tipo || "nota";
                    const ref = item.referencia || item.titulo || "Sin referencia";
                    const arch = item.archivo === "permanente" ? "Archivo permanente" : `Temporal (${RETENTION_DAYS} días)`;
                    return `## ${kind} · ${ref}\n\n_${when}_\n\n${item.texto || "_Vacío_"}\n\n*${arch}*`;
                })
                .join("\n\n---\n\n")
        );
    }

    function toPlainText(items) {
        return toMarkdown(items)
            .replace(/^#+\s*/gm, "")
            .replace(/\*/g, "")
            .replace(/^---$/gm, "————————");
    }

    RV.storage = {
        STORAGE_KEY_BASE,
        RETENTION_DAYS,
        TTL_MS,
        CUOTA_MAX,
        uid,
        nowIso,
        formatDateTime,
        expiresAt,
        isExpired,
        daysLeft,
        garbageCollect,
        readNotebook,
        writeNotebook,
        addEntry,
        cuotaBytes,
        toMarkdown,
        toPlainText,
        resolveKey,
    };
})(typeof window !== "undefined" ? window : globalThis);
