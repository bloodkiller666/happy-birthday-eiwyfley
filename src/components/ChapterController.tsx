"use client";

import { useCallback, useEffect, useRef } from "react";
import { gsap, ScrollTrigger } from "@/lib/gsap";
import {
  useAdventureStore,
  selectGemCount,
  TOTAL_GEMS,
  TOTAL_CHESTS,
} from "@/store/useAdventureStore";
import { getLenisInstance, scrollToTarget, setScrollLimit } from "@/lib/lenis";
import { prefersReducedMotion } from "@/lib/device";

/**
 * ChapterController — orquestador central de las compuertas de scroll y transiciones entre capítulos.
 *
 * Reglas de compuerta implementadas:
 * - Prólogo: sin scroll hasta presionar "Comenzar aventura".
 * - Cap. 1 (El Vuelo): scroll libre en ambos sentidos; pasa al mapa sin bloqueo.
 * - Cap. 2 (Mapa de Desafíos): scroll hacia arriba libre (vuelve al Cap. 1). Hacia abajo bloqueado
 *   en el final del mapa hasta completar las 4 gemas. Al conseguir la 4.ª:
 *   1. Se expande `scrollLimit` primero.
 *   2. Autoscroll suave al Cap. 3.
 * - Cap. 3 (Cueva del Tesoro): entrada con zoom hacia abajo permitida. Al llegar a los cofres,
 *   hacia abajo bloqueado hasta abrir los 4 cofres. Al abrir el 4.º:
 *   1. Se expande `scrollLimit = Infinity` primero.
 *   2. Autoscroll suave al Cap. 4.
 * - Cap. 4 (Celebración): scroll libre dentro de la celebración.
 */
export function ChapterController() {
  const phase = useAdventureStore((state) => state.phase);
  const completeChapter = useAdventureStore((state) => state.completeChapter);
  const gemCount = useAdventureStore(selectGemCount);
  const chestsOpened = useAdventureStore((state) => state.chestsOpened);
  const runId = useAdventureStore((state) => state.runId);

  const prevGemsRef = useRef(gemCount);
  const prevChestsRef = useRef(chestsOpened);
  const autoScrollTimeoutRef = useRef<number | null>(null);

  /**
   * Calcula el límite inferior exacto de desplazamiento vertical permitido (en px).
   * Siempre permite scroll hacia arriba (0..limit).
   */
  const computeScrollLimit = useCallback((): number => {
    if (phase !== "adventure") return 0;

    const mapSection = document.getElementById("map");
    const caveSection = document.getElementById("cave");
    const celebrationSection = document.getElementById("celebration");

    // Compuerta 1: Mapa (mientras gemCount < 4).
    // El mapa mide exactamente 100dvh: restar innerHeight deja el scroll máximo
    // justo donde el mapa llena la pantalla, sin asomar la Cueva (Cap. 3).
    if (gemCount < TOTAL_GEMS) {
      if (caveSection) {
        return Math.max(0, caveSection.offsetTop - window.innerHeight);
      }
      if (mapSection) {
        return Math.max(
          0,
          mapSection.offsetTop + mapSection.offsetHeight - window.innerHeight,
        );
      }
    }

    // Compuerta 2: Cueva (mientras chestsOpened < 4)
    if (chestsOpened < TOTAL_CHESTS) {
      if (celebrationSection) {
        return celebrationSection.offsetTop - window.innerHeight;
      }
      if (caveSection) {
        return caveSection.offsetTop + caveSection.offsetHeight - window.innerHeight;
      }
    }

    // Celebración: scroll libre
    return Infinity;
  }, [phase, gemCount, chestsOpened]);

  // Actualizar el límite en Lenis y recalcular anclajes ante resize / ScrollTrigger.refresh()
  useEffect(() => {
    const updateLimit = () => {
      const limit = computeScrollLimit();
      setScrollLimit(limit);

      // Verificación de seguridad instantánea
      const lenis = getLenisInstance();
      const currentY = lenis ? lenis.scroll : window.scrollY;
      if (currentY > limit && limit < Infinity) {
        if (lenis) {
          lenis.scrollTo(limit, { immediate: true, force: true });
        } else {
          window.scrollTo({ top: limit, behavior: "auto" });
        }
      }
    };

    updateLimit();

    const onRefresh = () => updateLimit();
    ScrollTrigger.addEventListener("refresh", onRefresh);
    window.addEventListener("resize", onRefresh);
    window.addEventListener("orientationchange", onRefresh);

    // Ticker continuo como red de seguridad contra arrastre nativo o saltos bruscos
    const onTick = () => {
      const limit = computeScrollLimit();
      const lenis = getLenisInstance();
      const currentY = lenis ? lenis.scroll : window.scrollY;
      if (currentY > limit + 1 && limit < Infinity) {
        if (lenis) {
          lenis.scrollTo(limit, { immediate: true, force: true });
        } else {
          window.scrollTo({ top: limit, behavior: "auto" });
        }
      }
    };
    gsap.ticker.add(onTick);

    return () => {
      ScrollTrigger.removeEventListener("refresh", onRefresh);
      window.removeEventListener("resize", onRefresh);
      window.removeEventListener("orientationchange", onRefresh);
      gsap.ticker.remove(onTick);
    };
  }, [computeScrollLimit, runId]);

  // Vuelo -> cuando el usuario scrollea por el Vuelo, se desbloquea el Mapa
  useEffect(() => {
    if (phase !== "adventure") return;

    const flightSection = document.getElementById("flight");
    if (!flightSection) return;

    const trigger = ScrollTrigger.create({
      trigger: flightSection,
      start: "bottom bottom",
      onEnter: () => {
        completeChapter("flight");
      },
    });

    return () => trigger.kill();
  }, [phase, runId, completeChapter]);

  // Compuerta 1 superada: 4 gemas conseguidas -> expandir límite y autoscroll a la Cueva
  useEffect(() => {
    if (phase !== "adventure") return;

    const justCompletedGems = prevGemsRef.current < TOTAL_GEMS && gemCount >= TOTAL_GEMS;
    prevGemsRef.current = gemCount;

    if (justCompletedGems) {
      completeChapter("map");

      // 1. PRIMERO actualizar scrollLimit para permitir la llegada a la cueva
      const caveSection = document.getElementById("cave");
      const celebrationSection = document.getElementById("celebration");
      const newLimit = celebrationSection
        ? celebrationSection.offsetTop - window.innerHeight
        : caveSection
          ? caveSection.offsetTop + caveSection.offsetHeight - window.innerHeight
          : Infinity;
      setScrollLimit(newLimit);

      // 2. LUEGO autoscroll suave al Capítulo 3 (Cueva)
      if (caveSection) {
        if (autoScrollTimeoutRef.current !== null) {
          window.clearTimeout(autoScrollTimeoutRef.current);
        }
        autoScrollTimeoutRef.current = window.setTimeout(() => {
          const soft = prefersReducedMotion();
          scrollToTarget(caveSection, {
            duration: soft ? 0.3 : 1.6,
            immediate: soft,
            lock: true,
            force: true,
          });
        }, 350);
      }
    }
  }, [gemCount, phase, completeChapter]);

  // Compuerta 2 superada: 4 cofres abiertos -> expandir límite a Infinity y autoscroll a Celebración
  useEffect(() => {
    if (phase !== "adventure") return;

    const justCompletedChests = prevChestsRef.current < TOTAL_CHESTS && chestsOpened >= TOTAL_CHESTS;
    prevChestsRef.current = chestsOpened;

    if (justCompletedChests) {
      completeChapter("cave");

      // 1. PRIMERO actualizar scrollLimit a Infinity
      setScrollLimit(Infinity);

      // 2. LUEGO autoscroll suave al Capítulo 4 (Celebración)
      const celebrationSection = document.getElementById("celebration");
      if (celebrationSection) {
        if (autoScrollTimeoutRef.current !== null) {
          window.clearTimeout(autoScrollTimeoutRef.current);
        }
        autoScrollTimeoutRef.current = window.setTimeout(() => {
          const soft = prefersReducedMotion();
          scrollToTarget(celebrationSection, {
            duration: soft ? 0.3 : 1.6,
            immediate: soft,
            lock: true,
            force: true,
          });
        }, 750);
      }
    }
  }, [chestsOpened, phase, completeChapter]);

  // Limpiar timers pendientes al desmontar
  useEffect(() => {
    return () => {
      if (autoScrollTimeoutRef.current !== null) {
        window.clearTimeout(autoScrollTimeoutRef.current);
      }
    };
  }, []);

  return null;
}
