"use client";

import { useEffect } from "react";
import Lenis from "lenis";
import { gsap, ScrollTrigger } from "@/lib/gsap";
import { getLenisInstance, setLenisInstance, getScrollLimit } from "@/lib/lenis";

interface UseLenisOptions {
  /** Si es false, el scroll queda bloqueado (loader, prólogo, minijuegos). */
  enabled: boolean;
  /** Con `prefers-reduced-motion` no creamos Lenis: scroll nativo y predecible. */
  reducedMotion?: boolean;
}

/**
 * Scroll suave con Lenis sincronizado con ScrollTrigger y compuertas de capítulo.
 *
 * Reglas de compuerta implementadas:
 * - Hacia arriba SIEMPRE se permite el scroll.
 * - Hacia abajo se cancela en `virtualScroll` si se intenta sobrepasar la compuerta vigente (`scrollLimit`).
 * - En el evento `scroll` se aplica clamp de seguridad instantáneo:
 *   `if (scroll > scrollLimit) lenis.scrollTo(scrollLimit, { immediate: true, force: true })`.
 */
export function useLenis({ enabled, reducedMotion = false }: UseLenisOptions): void {
  useEffect(() => {
    if (reducedMotion || typeof window === "undefined") return;

    const lenis = new Lenis({
      lerp: 0.09,
      smoothWheel: true,
      wheelMultiplier: 1,
      touchMultiplier: 1.6,
      syncTouch: false,
      virtualScroll: (data) => {
        const limit = getScrollLimit();
        // Si el usuario intenta hacer scroll hacia abajo (deltaY > 0) y ya está en o más allá del límite, cancelar evento
        if (data.deltaY > 0 && lenis.scroll >= limit - 1) {
          return false;
        }
        // Hacia arriba (deltaY < 0) o dentro de límites permitidos siempre se acepta
        return true;
      },
    });

    setLenisInstance(lenis);

    lenis.on("scroll", (e) => {
      ScrollTrigger.update();
      const limit = getScrollLimit();
      // Garantía principal contra arrastre de barra, teclado o cualquier overshoot
      if (e.scroll > limit) {
        lenis.scrollTo(limit, { immediate: true, force: true });
      }
    });

    const tick = (time: number) => lenis.raf(time * 1000);
    gsap.ticker.add(tick);
    gsap.ticker.lagSmoothing(0);

    return () => {
      gsap.ticker.remove(tick);
      lenis.destroy();
      setLenisInstance(null);
    };
  }, [reducedMotion]);

  useEffect(() => {
    if (reducedMotion) {
      // Sin Lenis el scroll lo controlamos con CSS (html bloqueado).
      document.documentElement.classList.toggle("scroll-locked", !enabled);
      return;
    }
    const lenis = getLenisInstance();
    if (!lenis) return;
    if (enabled) lenis.start();
    else lenis.stop();
  }, [enabled, reducedMotion]);
}
