"use client";

import { useCallback, useRef, type CSSProperties } from "react";
import { gsap, useGSAP } from "@/lib/gsap";
import { birthday } from "@/config/birthday";
import {
  useAdventureStore,
  selectGemCount,
  TOTAL_GEMS,
} from "@/store/useAdventureStore";
import { useReducedMotion } from "@/hooks/useReducedMotion";
import { useViewportWidth } from "@/hooks/useViewportWidth";
import { prefersReducedMotion } from "@/lib/device";
import { Cloud, MountainRange } from "@/components/art/scenery";
import { cn } from "@/lib/utils";
import { StationPanel } from "@/components/games/StationPanel";

/** Panel de introducción + una estación por gema. */
const PANEL_COUNT = birthday.stations.length + 1;

/**
 * Capítulo 2 — El Mapa de Desafíos.
 *
 * Bug B fix: eliminado el scrub horizontal. El track ahora se mueve por estado:
 * `gsap.to(track, { x: -currentStation * width })` cuando cambia `currentStation`.
 * Ni la rueda ni el toque mueven el mapa; solo avanza al completar un juego.
 *
 * Bug B fix: los juegos se renderizan en un overlay portal a pantalla completa,
 * fuera del track, manejado por StationPanel + GameOverlay.
 *
 * Estaciones secuenciales: solo la estación `currentStation` tiene botón "Jugar"
 * activo; las demás se ven bloqueadas (candado, atenuadas).
 */
export function ChallengeMap() {
  const sectionRef = useRef<HTMLElement | null>(null);
  const trackRef = useRef<HTMLDivElement | null>(null);
  const currentStation = useAdventureStore((state) => state.currentStation);
  const advanceStation = useAdventureStore((state) => state.advanceStation);
  const gemCount = useAdventureStore(selectGemCount);
  const gems = useAdventureStore((state) => state.gems);
  const reducedMotion = useReducedMotion();
  const panelWidth = useViewportWidth();

  // Animate track to current station position
  useGSAP(
    () => {
      const track = trackRef.current;
      if (!track || panelWidth <= 0) return;

      // The intro panel is panel 0, first station is panel 1.
      // When currentStation=0, we want to show panel 1 (first station).
      // But initially show the intro (panel 0).
      const targetPanel = currentStation === 0 && gemCount === 0 ? 0 : currentStation + 1;
      const targetX = -targetPanel * panelWidth;

      gsap.to(track, {
        x: targetX,
        duration: prefersReducedMotion() ? 0.3 : 1.4,
        ease: "power2.inOut",
      });
    },
    { dependencies: [currentStation, panelWidth, gemCount], scope: sectionRef },
  );

  // Trail drawing based on station progress
  useGSAP(
    () => {
      const section = sectionRef.current;
      if (!section || panelWidth <= 0) return;

      const progress = gemCount / TOTAL_GEMS;
      gsap.to(".map-trail", {
        strokeDashoffset: 1 - progress,
        duration: 0.8,
        ease: "power2.out",
      });
    },
    { dependencies: [gemCount, panelWidth], scope: sectionRef },
  );

  const handleGameComplete = useCallback(() => {
    advanceStation();
  }, [advanceStation]);

  const goToFirstStation = useCallback(() => {
    const track = trackRef.current;
    if (!track || panelWidth <= 0) return;
    gsap.to(track, {
      x: -panelWidth,
      duration: prefersReducedMotion() ? 0.3 : 1.2,
      ease: "power2.inOut",
    });
  }, [panelWidth]);

  // Active panel index for the dots indicator
  const activeDotIndex =
    currentStation === 0 && gemCount === 0 ? 0 : currentStation + 1;

  return (
    <section
      id="map"
      data-chapter="map"
      ref={sectionRef}
      aria-label={`${birthday.map.eyebrow}: ${birthday.map.title}`}
      style={
        {
          "--map-panel-width": panelWidth > 0 ? `${panelWidth}px` : "100vw",
        } as CSSProperties
      }
      className="relative h-dvh w-full"
    >
      <div
        className={cn(
          "relative h-full w-full overflow-hidden bg-gradient-to-b from-sky-top via-aqua to-eiwy/70",
        )}
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

        {/* pista horizontal — moves by state, not by scroll */}
        <div
          ref={trackRef}
          data-map-track
          style={{ width: `calc(var(--map-panel-width) * ${PANEL_COUNT})` }}
          className={cn(
            "relative flex h-full",
            !reducedMotion && "will-change-transform",
          )}
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
              <p className="max-w-lg text-base font-semibold text-ink/75">
                {birthday.map.intro}
              </p>
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
                onClick={goToFirstStation}
                className="sticker rounded-full bg-eiwy px-6 py-3 font-display font-semibold text-ink transition-transform duration-200 hover:-translate-y-1"
              >
                {birthday.buttons.play}
              </button>
              <p className="text-xs font-semibold text-ink/60">
                Completá cada reto para avanzar
              </p>
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
              isActive={currentStation === index}
              isCompleted={gems[station.id]}
              onEnterChallenge={() => {
                // Nothing needed — games now open in portal overlay
              }}
              onGameComplete={handleGameComplete}
            />
          ))}
        </div>

        {/* indicador de progreso del mapa — solo indicadores, no clickeables */}
        <div className="pointer-events-none absolute inset-x-0 bottom-2 z-20 flex items-center justify-center gap-2">
          {Array.from({ length: PANEL_COUNT }, (_, index) => (
            <span
              key={index}
              className={cn(
                "h-2 w-8 rounded-full border-2 border-white transition-colors duration-300",
                index === activeDotIndex ? "bg-ink/80" : "bg-white/50",
              )}
            />
          ))}
        </div>
      </div>
    </section>
  );
}
