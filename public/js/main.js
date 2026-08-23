/**
 * Éfata RevelatiO — main.js
 * Arranque tras el shell: precarga vías, monta el núcleo.
 * La vista inicial (dashboard) la dispara el script del index.html vía router.load.
 */
(function (global) {
    "use strict";

    async function boot() {
        const RV = (global.RV = global.RV || {});
        if (!RV.router) {
            console.error("[main] router.js no cargó");
            return;
        }

        // Legal compacto: expandir/ocultar detalle sin ocupar altura fija
        if (!global.__RV_FOOTER_LEGAL__) {
            global.__RV_FOOTER_LEGAL__ = true;
            document.addEventListener("click", (event) => {
                const btn = event.target.closest?.("[data-rv-legal-toggle]");
                if (!btn) return;
                const box = document.getElementById("rv-footer-legal");
                if (!box) return;
                const open = box.hasAttribute("hidden");
                if (open) box.removeAttribute("hidden");
                else box.setAttribute("hidden", "");
                btn.setAttribute("aria-expanded", open ? "true" : "false");
                btn.textContent = open ? "Cerrar" : "Legal";
            });
        }

        try {
            RV.router.wireHashSync?.();
        } catch (err) {
            console.warn("[main] hash sync", err);
        }

        const preferred = RV.router.routeFromLocation?.() || "dashboard";

        try {
            // Precarga estudio + acompañamiento (dashboard ya lo pide el shell).
            await RV.router.ensureOverlays?.();
            await Promise.all([
                RV.router.ensure("dashboard"),
                RV.router.ensure("estudio"),
                RV.router.ensure("acompanamiento"),
            ]);
            await RV.router.show(preferred === "estudio" || preferred === "acompanamiento" ? preferred : "dashboard");
        } catch (err) {
            console.error("[main] bootstrap de vistas falló", err);
            // Fallback: al menos el dashboard
            try {
                await RV.router.go("dashboard");
            } catch (e2) {
                console.error("[main] fallback dashboard", e2);
                return;
            }
        }

        try {
            if (typeof RV.bootEstudioApp === "function") RV.bootEstudioApp();
            else console.error("[main] estudio-app.js no expuso bootEstudioApp");
        } catch (err) {
            console.error("[main] bootEstudioApp", err);
        }

        try {
            if (preferred === "estudio") RV.navigation?.onEstudioReady?.();
            if (preferred === "acompanamiento") RV.navigation?.onAcompReady?.();
        } catch (err) {
            console.warn("[main] ready hooks", err);
        }
    }

    if (document.readyState === "loading") {
        document.addEventListener("DOMContentLoaded", () => {
            boot().catch((err) => console.error("[main]", err));
        });
    } else {
        boot().catch((err) => console.error("[main]", err));
    }
})(typeof window !== "undefined" ? window : globalThis);
