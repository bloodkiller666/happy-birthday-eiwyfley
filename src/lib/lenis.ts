"use client";

import type Lenis from "lenis";

/**
 * Singleton de Lenis y control del límite dinámico de scroll (`scrollLimit`).
 * Permite que cualquier componente consulte o restrinja el avance vertical
 * de acuerdo con la compuerta activa (capítulo actual).
 */
let instance: Lenis | null = null;
let currentScrollLimit: number = Infinity;

export function setLenisInstance(lenis: Lenis | null): void {
  instance = lenis;
}

export function getLenisInstance(): Lenis | null {
  return instance;
}

/** Establece el límite máximo en píxeles al que se permite hacer scroll hacia abajo. */
export function setScrollLimit(limit: number): void {
  currentScrollLimit = limit;
}

/** Obtiene el límite máximo actual de scroll. */
export function getScrollLimit(): number {
  return currentScrollLimit;
}

/** Lleva el scroll a un elemento o posición, con Lenis si está disponible. */
export function scrollToTarget(
  target: HTMLElement | string | number,
  options: {
    offset?: number;
    duration?: number;
    immediate?: boolean;
    lock?: boolean;
    force?: boolean;
  } = {},
): void {
  const { offset = 0, duration = 1.4, immediate = false, lock = false, force = false } = options;
  const lenis = instance;
  if (lenis) {
    lenis.scrollTo(target, { offset, duration, immediate, lock, force });
    return;
  }
  if (typeof window === "undefined") return;
  if (typeof target === "number") {
    window.scrollTo({ top: target + offset, behavior: immediate ? "auto" : "smooth" });
    return;
  }
  const element = typeof target === "string" ? document.querySelector<HTMLElement>(target) : target;
  if (!element) return;
  const top = element.getBoundingClientRect().top + window.scrollY + offset;
  window.scrollTo({ top, behavior: immediate ? "auto" : "smooth" });
}
