"use client";

const REDUCED_MOTION_QUERY = "(prefers-reduced-motion: reduce)";

/** Estima cuántas partículas puede mover el dispositivo (0 fuera del navegador). */
export function resolveParticleBudget(): number {
  if (typeof window === "undefined") return 0;
  const cores = navigator.hardwareConcurrency || 4;
  const width = window.innerWidth;
  if (width < 640) return cores >= 8 ? 22 : 14;
  if (width < 1280) return cores >= 8 ? 34 : 24;
  return cores >= 8 ? 48 : 32;
}

/** Consulta puntual (sin re-render) para usar dentro de código GSAP. */
export function prefersReducedMotion(): boolean {
  if (typeof window === "undefined") return false;
  return window.matchMedia(REDUCED_MOTION_QUERY).matches;
}

export { REDUCED_MOTION_QUERY };

