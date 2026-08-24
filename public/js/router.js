/**
 * Éfata RevelatiO — router.js
 * Ruteador SPA: carga vistas desde /views sin recargar la página.
 * Incluye la lógica de navegación entre Dashboard, Estudio y Acompañamiento.
 */
(function (global) {
    "use strict";

    const RV = (global.RV = global.RV || {});
    const VERSION = "lensAiFallback1";

    /** Rutas nombradas → archivos en /views */
    const ROUTES = {
        dashboard: "views/dashboard.html",
        estudio: "views/estudio.html",
        acompanamiento: "views/acompanamiento.html",
    };

    const OVERLAYS_URL = "views/shared-overlays.html";

    /** @type {Map<string, HTMLElement>} */
    const slots = new Map();
    /** @type {Map<string, Promise<HTMLElement>>} */
    const inflight = new Map();
    let appEl = null;
    let overlaysReady = false;
    let current = null;

    function app() {
        if (!appEl) appEl = document.getElementById("rv-app");
        return appEl;
    }

    function viewUrl(nameOrPath) {
        if (ROUTES[nameOrPath]) return `${ROUTES[nameOrPath]}?v=${VERSION}`;
        const path = String(nameOrPath || "").replace(/^\//, "");
        return `${path}?v=${VERSION}`;
    }

    async function fetchHtml(url) {
        const res = await fetch(url, { cache: "no-cache" });
        if (!res.ok) throw new Error(`[router] No se pudo cargar ${url} (${res.status})`);
        return res.text();
    }

    function wrapSlot(name, html) {
        const slot = document.createElement("div");
        slot.className = "rv-route";
        slot.dataset.route = name;
        slot.setAttribute("data-rv-route", name);
        if (name === "acompanamiento") {
            const trimmed = String(html || "").trim();
            if (trimmed.startsWith('<div id="rv-acompanamiento"') && !/\shidden[\s>]/.test(trimmed.slice(0, 90))) {
                html = trimmed.replace('<div id="rv-acompanamiento"', '<div id="rv-acompanamiento" hidden', 1);
            }
        }
        slot.innerHTML = html;
        slot.hidden = true;
        return slot;
    }

    function applyBodyFor(name) {
        const body = document.body;
        if (name === "estudio") {
            body.classList.add("is-santuario", "visor-active");
            body.classList.remove("is-acompanamiento");
        } else if (name === "acompanamiento") {
            body.classList.add("is-acompanamiento");
            body.classList.remove("is-santuario", "visor-active");
        } else {
            body.classList.remove("is-santuario", "is-acompanamiento", "visor-active");
        }
    }

    async function ensureOverlays() {
        if (overlaysReady) return;
        const host = document.getElementById("rv-overlays");
        if (!host) {
            overlaysReady = true;
            return;
        }
        if (host.childElementCount > 0) {
            overlaysReady = true;
            try { RV.audio?.mount?.(); } catch { /* ignore */ }
            return;
        }
        const html = await fetchHtml(`${OVERLAYS_URL}?v=${VERSION}`);
        host.innerHTML = html;
        overlaysReady = true;
        try {
            RV.audio?.mount?.();
        } catch { /* ignore */ }
    }

    async function ensure(name) {
        if (!ROUTES[name]) throw new Error(`[router] Vista desconocida: ${name}`);
        if (slots.has(name)) return slots.get(name);
        if (inflight.has(name)) return inflight.get(name);

        const pending = (async () => {
            const host = app();
            if (!host) throw new Error("[router] Falta #rv-app en el shell");
            // Reutilizar slot ya presente en el DOM (p. ej. carrera previa)
            const existing = host.querySelector(`[data-rv-route="${name}"]`);
            if (existing) {
                slots.set(name, existing);
                return existing;
            }
            const html = await fetchHtml(viewUrl(name));
            if (slots.has(name)) return slots.get(name);
            const again = host.querySelector(`[data-rv-route="${name}"]`);
            if (again) {
                slots.set(name, again);
                return again;
            }
            const slot = wrapSlot(name, html);
            host.appendChild(slot);
            slots.set(name, slot);
            return slot;
        })();

        inflight.set(name, pending);
        try {
            return await pending;
        } finally {
            inflight.delete(name);
        }
    }

    /**
     * Carga una vista por nombre (dashboard|estudio|acompanamiento)
     * o por ruta relativa (ej. views/dashboard.html).
     */
    async function load(nameOrPath) {
        await ensureOverlays();
        let name = nameOrPath;
        if (String(nameOrPath).indexOf("views/") === 0 || String(nameOrPath).indexOf("/views/") === 0) {
            const file = String(nameOrPath).replace(/^\/?views\//, "").replace(/\.html$/i, "");
            name = file === "dashboard" || file === "estudio" || file === "acompanamiento" ? file : nameOrPath;
        }
        if (ROUTES[name]) {
            await ensure(name);
            return show(name);
        }
        // Carga genérica en #rv-app (reemplazo simple)
        const host = app();
        if (!host) throw new Error("[router] Falta #rv-app");
        const html = await fetchHtml(viewUrl(nameOrPath));
        host.innerHTML = html;
        current = nameOrPath;
        applyBodyFor("dashboard");
        return host;
    }

    function dedupeRouteSlots(name) {
        const host = app();
        if (!host) return null;
        const nodes = [...host.querySelectorAll(`[data-rv-route="${name}"]`)];
        if (!nodes.length) return slots.get(name) || null;
        const keep = nodes[0];
        nodes.slice(1).forEach((el) => {
            try { el.remove(); } catch { /* ignore */ }
        });
        slots.set(name, keep);
        return keep;
    }

    function show(name) {
        // Sana duplicados por carrera de arranque (shell + main.js)
        Object.keys(ROUTES).forEach((routeName) => dedupeRouteSlots(routeName));
        if (!slots.has(name)) {
            const found = dedupeRouteSlots(name);
            if (!found) {
                console.warn(`[router] show('${name}') sin ensure — no-op`);
                return Promise.resolve(null);
            }
        }
        for (const [key, el] of slots) {
            el.hidden = key !== name;
        }
        // Cualquier huérfano fuera del Map también se oculta
        const host = app();
        if (host) {
            host.querySelectorAll("[data-rv-route]").forEach((el) => {
                const route = el.getAttribute("data-rv-route");
                el.hidden = route !== name;
            });
        }
        current = name;
        applyBodyFor(name);
        try {
            global.dispatchEvent(new CustomEvent("rv:route", { detail: { name, current } }));
        } catch { /* ignore */ }
        try {
            if (name === "dashboard") RV.navigation?.onDashboardReady?.();
            if (name === "estudio") RV.navigation?.onEstudioReady?.();
            if (name === "acompanamiento") RV.navigation?.onAcompReady?.();
        } catch (err) {
            console.warn("[router] ready hook", err);
        }
        return Promise.resolve(slots.get(name));
    }

    async function go(name) {
        await ensureOverlays();
        await ensure(name);
        return show(name);
    }

    /** Precarga las tres vías maestras. */
    async function bootstrap(preferred) {
        await ensureOverlays();
        await Promise.all(["dashboard", "estudio", "acompanamiento"].map((n) => ensure(n)));
        return show(preferred || "dashboard");
    }

    function routeFromLocation() {
        const hash = String(location.hash || "").replace(/^#/, "").toLowerCase();
        if (hash === "acompanamiento") return "acompanamiento";
        if (
            hash === "santuario" ||
            hash === "lectura" ||
            hash.indexOf("lectura/") === 0 ||
            hash.indexOf("lectura?") === 0
        ) {
            return "estudio";
        }
        return "dashboard";
    }

    function wireHashSync() {
        if (global.__RV_ROUTER_HASH__) return;
        global.__RV_ROUTER_HASH__ = true;
        const sync = () => {
            const route = routeFromLocation();
            if (getCurrent() === route) return;
            show(route);
        };
        global.addEventListener("popstate", sync);
        global.addEventListener("hashchange", sync);
    }

    function getCurrent() {
        return current;
    }

    RV.router = {
        ROUTES,
        VERSION,
        ensure,
        ensureOverlays,
        load,
        go,
        show,
        bootstrap,
        getCurrent,
        routeFromLocation,
        wireHashSync,
        applyBodyFor,
        slots,
    };

    // Alias de navegación (misma API que usaba navigation.js)
    RV.navigation = Object.assign(RV.navigation || {}, {
        go: (route, opts) => go(route).then(() => {
            if (opts?.silent) return;
            try {
                if (route === "dashboard") history.replaceState(null, "", "#inicio");
                else if (route === "acompanamiento") {
                    history.pushState(
                        { revelatio: "acompanamiento" },
                        "",
                        `${location.pathname}${location.search || ""}#acompanamiento`
                    );
                }
            } catch { /* ignore */ }
        }),
        routeFromLocation,
        applyBodyFor,
        wireHashSync,
    });
})(typeof window !== "undefined" ? window : globalThis);
