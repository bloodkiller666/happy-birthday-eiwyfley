"use client";

import { useSyncExternalStore } from "react";

/**
 * Se suscribe a resize y además observa el tamaño del documento: cuando
 * aparece o desaparece la barra de scroll el ancho útil cambia sin que se
 * dispare un `resize`, y el mapa horizontal necesita saberlo.
 */
function subscribe(onChange: () => void): () => void {
  window.addEventListener("resize", onChange);
  const observer = new ResizeObserver(onChange);
  observer.observe(document.documentElement);
  return () => {
    window.removeEventListener("resize", onChange);
    observer.disconnect();
  };
}

/** Ancho de layout (sin barra de scroll). 0 mientras no haya navegador. */
function getSnapshot(): number {
  return document.documentElement.clientWidth;
}

/**
 * Ancho real del viewport sin barra de scroll.
 * Se usa para dar al mapa horizontal medidas exactas y estables (nada de
 * depender de `100vw` + `scrollWidth`, que cambian según el momento de medición).
 */
export function useViewportWidth(): number {
  return useSyncExternalStore(subscribe, getSnapshot, () => 0);
}
