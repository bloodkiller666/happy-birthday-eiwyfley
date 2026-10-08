"use client";

import { useEffect } from "react";
import Lenis from "lenis";
import { gsap, ScrollTrigger } from "@/lib/gsap";
import { getLenisInstance, setLenisInstance } from "@/lib/lenis";

interface UseLenisOptions {
  /** Si es false, el scroll queda bloqueado (loader, prólogo, minijuegos). */
  enabled: boolean;
  /** Con `prefers-reduced-motion` no creamos Lenis: scroll nativo y predecible. */
  reducedMotion?: boolean;
}

/**
 * Scroll suave con Lenis sincronizado con ScrollTrigger.
 * - `lenis.on("scroll", ScrollTrigger.update)`
 * - un único loop de animación: el `gsap.ticker` maneja el raf de Lenis.
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
    });

    setLenisInstance(lenis);
    lenis.on("scroll", ScrollTrigger.update);

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
