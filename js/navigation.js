/**
 * Éfata RevelatiO — navigation.js
 * Capa fina: delega en router.js (fuente de verdad de las vistas).
 */
(function (global) {
    "use strict";

    const RV = (global.RV = global.RV || {});

    function whenRouterReady(fn) {
        if (RV.router) {
            fn(RV.router);
            return;
        }
        // Si este archivo carga antes que router.js, reintenta en el siguiente tick.
        setTimeout(() => {
            if (RV.router) fn(RV.router);
        }, 0);
    }

    whenRouterReady((router) => {
        RV.navigation = Object.assign(RV.navigation || {}, {
            go: (route, opts) => router.go(route).then(() => {
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
            routeFromLocation: () => router.routeFromLocation(),
            applyBodyFor: (route) => router.applyBodyFor(route),
            wireHashSync: () => router.wireHashSync(),
            onEstudioReady: RV.navigation?.onEstudioReady || null,
            onDashboardReady: RV.navigation?.onDashboardReady || null,
            onAcompReady: RV.navigation?.onAcompReady || null,
        });
    });
})(typeof window !== "undefined" ? window : globalThis);
