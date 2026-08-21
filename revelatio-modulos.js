/**
 * Compatibilidad: el núcleo modular vive en /js.
 * Mantener este archivo evita roturas de referencias antiguas a revelatio-modulos.js.
 * Preferir: js/main.js + js/estudio-app.js
 */
(function () {
    if (window.__RV_ESTUDIO_APP__ || window.RV?.bootEstudioApp) return;
    console.warn("[revelatio-modulos] Carga diferida: usa index.html modular (js/main.js).");
})();
