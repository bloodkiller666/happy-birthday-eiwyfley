"use client";

import type Lenis from "lenis";

/**
 * Acceso al singleton de Lenis fuera de React.
 * Permite que cualquier componente pida scroll suave o bloquee el scroll.
 */
let instance: Lenis | null = null;

export function setLenisInstance(lenis: Lenis | null): void {
  instance = lenis;
}

export function getLenisInstance(): Lenis | null {
  return instance;
}

/** Lleva el scroll a un elemento o posición, con Lenis si está disponible. */
export function scrollToTarget(
  target: HTMLElement | string | number,
  options: { offset?: number; duration?: number; immediate?: boolean } = {},
): void {
  const { offset = 0, duration = 1.4, immediate = false } = options;
  const lenis = instance;
  if (lenis) {
    lenis.scrollTo(target, { offset, duration, immediate, lock: false });
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
