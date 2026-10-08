"use client";

import { useCallback, useEffect, useRef, useState, type CSSProperties } from "react";
import { gsap, useGSAP, ScrollTrigger } from "@/lib/gsap";
import { birthday } from "@/config/birthday";
import { useAdventureStore, selectGemCount, TOTAL_GEMS } from "@/store/useAdventureStore";
import { useReducedMotion } from "@/hooks/useReducedMotion";
import { useViewportWidth } from "@/hooks/useViewportWidth";
import { prefersReducedMotion } from "@/lib/device";
import { scrollToTarget } from "@/lib/lenis";
import { Cloud, MountainRange } from "@/components/art/scenery";
import { cn } from "@/lib/utils";
import { StationPanel } from "@/components/games/StationPanel";

/** Panel de introducción + una estación por gema. */
const PANEL_COUNT = birthday.stations.length + 1;

/** Progreso exacto de cada panel dentro del recorrido horizontal. */
const SNAP_POINTS = Array.from({ length: PANEL_COUNT }, (_, index) => index / (PANEL_COUNT - 1));

/**
 * Capítulo 2 — El Mapa de Desafíos.
 *
 * Sección alta con una escena "sticky": el scroll vertical mueve un mapa enorme
 * en horizontal, con camino SVG que se traza, snaps por estación y un
 * indicador de progreso.
 *
 * DECISIÓN DE DISEÑO: usamos `position: sticky` en lugar de `pin: true` de
 * ScrollTrigger. El resultado visual es idéntico (la escena queda fija mientras
 * el scroll avanza) pero sin pin-spacers: la geometría es determinista, no hay
 * saltos de layout y se comporta igual en móvil. El scrub, los snaps y el
 * trazado del camino siguen siendo 100% ScrollTrigger.
 */
export function ChallengeMap() {
  const sectionRef = useRef<HTMLElement | null>(null);
  const trackRef = useRef<HTMLDivElement | null>(null);
  const triggerRef = useRef<ScrollTrigger | null>(null);
  const [activePanel, setActivePanel] = useState(0);
  /** Hay un minijuego en curso: no se snapea ni se mueve el mapa. */
  const lockingRef = useRef(false);
  const gameRunning = useAdventureStore((state) => state.scrollLocks.length > 0);
  const gemCount = useAdventureStore(selectGemCount);
  const reducedMotion = useReducedMotion();
  const panelWidth = useViewportWidth();
  const distance = panelWidth * (PANEL_COUNT - 1);

  // Mientras se juega, el mapa se queda quieto: ni snaps ni desplazamientos.
  useEffect(() => {
    lockingRef.current = gameRunning;
  }, [gameRunning]);

  /**
   * Al empezar un reto: corta el snap en vuelo y alinea el mapa exactamente con
   * la estación, para que nadie juegue con la tarjeta fuera de pantalla.
   */
  const alignToPanel = useCallback(
    (index: number) => {
      const trigger = triggerRef.current;
      lockingRef.current = true;
      // El snap de ScrollTrigger es un tween sobre el scroller: así se cancela.
      gsap.killTweensOf(window);
      if (!trigger) return;
      const width = document.documentElement.clientWidth || window.innerWidth;
      scrollToTarget(Number(trigger.start) + width * index, { immediate: true });
    },
    [],
  );

  const goToPanel = useCallback((index: number) => {
    const trigger = triggerRef.current;
    if (prefersReducedMotion() || !trigger) {
      document
        .querySelector<HTMLElement>(`[data-map-panel="${index}"]`)
        ?.scrollIntoView({ behavior: "smooth", block: "nearest", inline: "start" });
      return;
    }
    const width = document.documentElement.clientWidth || window.innerWidth;
    scrollToTarget(Number(trigger.start) + width * index + 4, { duration: 1.3 });
  }, []);

  useGSAP(
    () => {
      const section = sectionRef.current;
      const track = trackRef.current;
      if (!section || !track) return;

      const soft = prefersReducedMotion();
      // Sin ancho de viewport conocido todavía no hay geometría que animar.
      if (soft || panelWidth <= 0) return;

      const travel = () => panelWidth * (PANEL_COUNT - 1);
      const triggerVars = () => ({
        trigger: section,
        start: "top top",
        end: () => `+=${travel()}`,
        scrub: 1,
        invalidateOnRefresh: true,
      });

      const tween = gsap.to(track, {
        x: () => -travel(),
        ease: "none",
        scrollTrigger: {
          id: "challenge-map",
          ...triggerVars(),
          snap: {
            // Un punto de anclaje por panel (portada + 4 estaciones).
            // Con un reto en curso no se snapea: el mapa se queda donde está.
            snapTo: (value: number, self?: ScrollTrigger) => {
              // Con un reto en curso: devolvemos el progreso real (sin inercia),
              // así el snap no mueve nada y el mapa queda congelado.
              if (lockingRef.current) return self ? self.progress : value;
              return ScrollTrigger.snapDirectional(SNAP_POINTS)(value, self?.direction ?? 1);
            },
            duration: { min: 0.25, max: 0.7 },
            delay: 0.06,
            ease: "power1.inOut",
          },
          onUpdate: (self) => {
            const index = Math.round(self.progress * (PANEL_COUNT - 1));
            setActivePanel((previous) => (previous === index ? previous : index));
          },
        },
      });

      triggerRef.current = tween.scrollTrigger ?? null;

      // El camino se traza a medida que el mapa avanza.
      gsap.fromTo(
        ".map-trail",
        { strokeDashoffset: 1 },
        { strokeDashoffset: 0, ease: "none", scrollTrigger: triggerVars() },
      );

      // Las nubes del fondo se mueven más lento (profundidad).
      gsap.to(".map-clouds", {
        xPercent: -12,
        ease: "none",
        scrollTrigger: { ...triggerVars(), scrub: 1.4 },
      });

      return () => {
        tween.scrollTrigger?.kill();
        triggerRef.current = null;
      };
    },
    { dependencies: [reducedMotion, panelWidth], scope: sectionRef },
  );

  return (
    <section
      id="map"
      data-chapter="map"
      ref={sectionRef}
      aria-label={`${birthday.map.eyebrow}: ${birthday.map.title}`}
      style={
        {
          "--map-panel-width": panelWidth > 0 ? `${panelWidth}px` : "100vw",
          height: reducedMotion ? "100dvh" : `calc(100dvh + ${distance}px)`,
        } as CSSProperties
      }
      className="relative w-full"
    >
      <div
        className={cn(
          "sticky top-0 h-dvh w-full overflow-hidden bg-gradient-to-b from-sky-top via-aqua to-eiwy/70",
          // Con movimiento reducido el mapa se recorre deslizando la escena a mano.
          reducedMotion && "overflow-x-auto overflow-y-hidden no-scrollbar",
        )}
        style={reducedMotion ? { scrollSnapType: "x mandatory" } : undefined}
      >
        {/* fondo del mapa */}
        <div className="pointer-events-none absolute inset-0">
          <div className="map-clouds absolute inset-0">
            <Cloud className="absolute left-[4%] top-[12%] w-32 opacity-80 sm:w-44" />
            <Cloud className="absolute left-[38%] top-[8%] w-28 opacity-70 sm:w-40" />
            <Cloud className="absolute left-[72%] top-[16%] w-36 opacity-75 sm:w-48" />
          </div>
          <div className="absolute bottom-0 left-0 h-[34vh] w-full opacity-70">
            <MountainRange depth={0} />
          </div>
        </div>

        {/* pista horizontal */}
        <div
          ref={trackRef}
          data-map-track
          style={{ width: `calc(var(--map-panel-width) * ${PANEL_COUNT})` }}
          className={cn("relative flex h-full", !reducedMotion && "will-change-transform")}
        >
          {/* camino dibujado con SVG */}
          <svg
            className="pointer-events-none absolute inset-x-0 bottom-4 h-24 w-full"
            viewBox="0 0 5000 200"
            preserveAspectRatio="none"
            aria-hidden="true"
          >
            <path
              d="M0 150 C 400 40 800 190 1300 120 C 1800 50 2200 180 2700 110 C 3200 40 3600 170 4100 100 C 4500 40 4800 150 5000 90"
              fill="none"
              stroke="#ffffff"
              strokeWidth="18"
              strokeLinecap="round"
              opacity="0.6"
            />
            <path
              className="map-trail"
              d="M0 150 C 400 40 800 190 1300 120 C 1800 50 2200 180 2700 110 C 3200 40 3600 170 4100 100 C 4500 40 4800 150 5000 90"
              fill="none"
              stroke="#38444c"
              strokeWidth="7"
              strokeLinecap="round"
              strokeDasharray="1"
              strokeDashoffset="1"
              pathLength={1}
              opacity="0.7"
            />
          </svg>

          {/* panel 0: portada del mapa */}
          <div
            data-map-panel={0}
            style={{ width: "var(--map-panel-width)" }}
            className="flex h-full shrink-0 snap-center items-center justify-center px-4 pb-10 pt-20 sm:px-8"
          >
            <div className="sticker-lg flex w-full max-w-2xl flex-col items-center gap-4 rounded-[2rem] bg-cream/95 px-6 py-8 text-center">
              <p className="eyebrow">{birthday.map.eyebrow}</p>
              <h2 className="ink-outline text-3xl font-semibold text-deep sm:text-5xl">
                {birthday.map.title}
              </h2>
              <p className="max-w-lg text-base font-semibold text-ink/75">{birthday.map.intro}</p>
              <div className="flex items-center gap-2">
                {birthday.stations.map((station, index) => (
                  <span
                    key={station.id}
                    className={cn(
                      "h-3 w-3 rounded-full border-2 border-white transition-colors",
                      gemCount > index ? "bg-lime" : "bg-ink/25",
                    )}
                  />
                ))}
                <span className="ml-2 font-display text-sm font-semibold text-ink/70">
                  {birthday.map.gemsLabel} {gemCount}/{TOTAL_GEMS}
                </span>
              </div>
              {gemCount === TOTAL_GEMS && (
                <p className="sticker rounded-full bg-lime px-4 py-2 font-display text-sm font-semibold">
                  {birthday.map.completeLabel}
                </p>
              )}
              <button
                type="button"
                onClick={() => goToPanel(1)}
                className="sticker rounded-full bg-eiwy px-6 py-3 font-display font-semibold text-ink transition-transform duration-200 hover:-translate-y-1"
              >
                {birthday.buttons.play}
              </button>
              <p className="text-xs font-semibold text-ink/60">{birthday.map.hint}</p>
            </div>
          </div>

          {/* estaciones */}
          {birthday.stations.map((station, index) => (
            <StationPanel
              key={station.id}
              station={station}
              index={index}
              total={birthday.stations.length}
              reducedMotion={reducedMotion}
              onEnterChallenge={() => alignToPanel(index + 1)}
              onNext={() => {
                if (index + 1 < birthday.stations.length) goToPanel(index + 2);
                else goToCave(triggerRef.current);
              }}
            />
          ))}
        </div>

        {/* indicador de progreso del mapa */}
        <div className="pointer-events-none absolute inset-x-0 bottom-2 z-20 flex items-center justify-center gap-2">
          {Array.from({ length: PANEL_COUNT }, (_, index) => (
            <span
              key={index}
              className={cn(
                "h-2 w-8 rounded-full border-2 border-white transition-colors duration-300",
                index === activePanel ? "bg-ink/80" : "bg-white/50",
              )}
            />
          ))}
        </div>
      </div>
    </section>
  );
}

/** Baja hasta el inicio del Capítulo 3 (cueva). */
function goToCave(trigger: ScrollTrigger | null): void {
  if (trigger) {
    scrollToTarget(Number(trigger.end) + 12, { duration: 1.4 });
    return;
  }
  document.getElementById("cave")?.scrollIntoView({ behavior: "smooth" });
}
