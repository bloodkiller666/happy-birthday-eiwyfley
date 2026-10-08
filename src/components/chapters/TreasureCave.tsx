"use client";

import { useRef, useState } from "react";
import { gsap, useGSAP, EASE } from "@/lib/gsap";
import { birthday } from "@/config/birthday";
import { useAdventureStore, selectGemCount, TOTAL_CHESTS, TOTAL_GEMS } from "@/store/useAdventureStore";
import { useAudio } from "@/hooks/useAudio";
import { useReducedMotion } from "@/hooks/useReducedMotion";
import { prefersReducedMotion } from "@/lib/device";
import { burstAt } from "@/components/effects/ParticlesCanvas";
import { ChestArt } from "@/components/art/scenery";
import { scrollToTarget } from "@/lib/lenis";
import { cn } from "@/lib/utils";

/**
 * Capítulo 3 — La Cueva del Tesoro.
 * La cámara se acerca a la entrada (scale + máscara) y dentro hay cuatro cofres:
 * cada uno se abre con una de las gemas conseguidas en el mapa.
 */
export function TreasureCave() {
  const sectionRef = useRef<HTMLElement | null>(null);
  const chestRefs = useRef<Array<HTMLDivElement | null>>([]);
  const flashRef = useRef<HTMLDivElement | null>(null);
  const gems = useAdventureStore((state) => state.gems);
  const chestsOpened = useAdventureStore((state) => state.chestsOpened);
  const openChest = useAdventureStore((state) => state.openChest);
  const revealCelebration = useAdventureStore((state) => state.revealCelebration);
  const gemCount = useAdventureStore(selectGemCount);
  const reducedMotion = useReducedMotion();
  const { play } = useAudio();
  const [opened, setOpened] = useState<boolean[]>(Array.from({ length: TOTAL_CHESTS }, () => false));

  useGSAP(
    () => {
      const section = sectionRef.current;
      if (!section) return;
      const soft = prefersReducedMotion();

      const timeline = gsap.timeline({
        defaults: { ease: "none" },
        scrollTrigger: {
          trigger: section,
          start: "top top",
          end: "bottom bottom",
          scrub: 1,
          invalidateOnRefresh: true,
        },
      });

      if (!soft) {
        // Zoom de cámara hacia la entrada de la cueva.
        timeline
          .fromTo(".cave-zoom", { scale: 1 }, { scale: 1.75, duration: 1 })
          .fromTo(".cave-veil", { opacity: 1 }, { opacity: 0, duration: 0.55 }, 0.3)
          .fromTo(".cave-inside", { autoAlpha: 0 }, { autoAlpha: 1, duration: 0.5 }, 0.3)
          .fromTo(
            ".cave-chest",
            { yPercent: 40, autoAlpha: 0 },
            { yPercent: 0, autoAlpha: 1, duration: 0.5, stagger: 0.11, ease: EASE.soft },
            0.45,
          );
      } else {
        gsap.set(".cave-inside", { autoAlpha: 1 });
      }

      return () => timeline.kill();
    },
    { dependencies: [reducedMotion], scope: sectionRef },
  );

  /** Abre un cofre usando la gema correspondiente. */
  const openTreasure = (index: number) => {
    const id = birthday.stations[index]?.id;
    if (!id || !gems[id] || opened[index]) return;

    const chest = chestRefs.current[index];
    const lid = chest?.querySelector(".chest-lid");
    const glow = chest?.querySelector(".chest-glow");

    if (chest) {
      const rect = chest.getBoundingClientRect();
      burstAt(
        rect.left + rect.width / 2,
        rect.top + rect.height / 2,
        [birthday.stations[index].accent, "#fff6cf", "#ffffff"],
        reducedMotion ? 8 : 26,
      );
      if (lid) {
        gsap.to(lid, {
          svgOrigin: "100 82",
          rotate: -34,
          duration: reducedMotion ? 0.15 : 0.7,
          ease: "back.out(1.5)",
        });
      }
      if (glow) gsap.to(glow, { autoAlpha: 1, duration: 0.5 });
      gsap.fromTo(chest, { y: -6 }, { y: 0, duration: 0.5, ease: "elastic.out(1, 0.5)" });
    }

    play("gem");
    setOpened((previous) => {
      const next = [...previous];
      next[index] = true;
      return next;
    });
    openChest();
  };

  const allOpened = chestsOpened >= TOTAL_CHESTS;

  // Explosión de luz al abrir el último cofre.
  useGSAP(
    () => {
      if (!allOpened) return;
      play("win");
      const soft = prefersReducedMotion();
      gsap.fromTo(
        flashRef.current,
        { autoAlpha: 0, scale: 0.4 },
        { autoAlpha: 0.95, scale: 1.6, duration: soft ? 0.3 : 0.7, ease: "power2.out", yoyo: true, repeat: 1 },
      );
      burstAt(window.innerWidth / 2, window.innerHeight / 2, ["#fff6cf", "#d8e02a", "#71cfce"], soft ? 12 : 40);
      revealCelebration();
    },
    { dependencies: [allOpened], scope: sectionRef },
  );

  return (
    <section
      id="cave"
      data-chapter="cave"
      ref={sectionRef}
      aria-label={`${birthday.cave.eyebrow}: ${birthday.cave.title}`}
      className="relative h-[240vh] bg-cave-top"
    >
      <div className="sticky top-0 flex h-dvh flex-col items-center justify-center overflow-hidden">
        {/* exterior: atardecer con la boca de la cueva */}
        <div className="cave-zoom absolute inset-0 will-change-transform">
          <div className="absolute inset-0 bg-gradient-to-b from-dusk-top via-dusk-bottom to-bark" />
          <div className="absolute bottom-0 left-0 h-[52vh] w-full">
            <svg viewBox="0 0 1200 400" preserveAspectRatio="none" className="h-full w-full" aria-hidden="true">
              <path d="M0 400 L0 250 C 180 160 300 210 420 240 L520 250 C 560 130 660 130 700 250 L820 250 C 940 200 1060 180 1200 260 L1200 400 Z" fill="#38444c" />
              <path
                d="M560 250 C 600 140 660 140 700 250 Z"
                fill="#17202e"
                stroke="#ffffff"
                strokeWidth="6"
              />
            </svg>
          </div>
        </div>

        {/* velo oscuro que se disipa al entrar */}
        <div className="cave-veil pointer-events-none absolute inset-0 bg-ink/70" />

        {/* interior de la cueva con los cofres */}
        <div className="cave-inside absolute inset-0 flex flex-col items-center justify-center gap-4 px-4 pt-20 pb-10">
          <div className="absolute inset-0 bg-gradient-to-b from-cave-top via-cave-bottom to-cave-top" />
          {!reducedMotion &&
            Array.from({ length: 14 }, (_, index) => (
              <span
                key={index}
                className="absolute h-1.5 w-1.5 rounded-full bg-lime/80"
                style={{
                  left: `${6 + ((index * 37) % 88)}%`,
                  top: `${8 + ((index * 23) % 80)}%`,
                  opacity: 0.6,
                }}
              />
            ))}

          <div className="relative flex flex-col items-center gap-2 text-center">
            <p className="eyebrow text-aqua">{birthday.cave.eyebrow}</p>
            <h2 className="ink-outline-dark text-3xl font-semibold text-white sm:text-5xl">
              {birthday.cave.title}
            </h2>
            <p className="max-w-xl text-sm font-semibold text-cream/85 sm:text-base">{birthday.cave.intro}</p>
          </div>

          <div className="relative grid w-full max-w-3xl grid-cols-2 gap-3 sm:grid-cols-4 sm:gap-5">
            {birthday.stations.map((station, index) => {
              const canOpen = Boolean(gems[station.id]);
              const isOpen = opened[index];
              return (
                <div
                  key={station.id}
                  ref={(element) => {
                    chestRefs.current[index] = element;
                  }}
                  className="cave-chest flex flex-col items-center gap-1"
                >
                  <button
                    type="button"
                    onClick={() => openTreasure(index)}
                    disabled={!canOpen || isOpen}
                    aria-label={
                      isOpen ? `${birthday.cave.openedLabel} ${index + 1}` : `${birthday.cave.chestLabel} ${index + 1}`
                    }
                    className={cn(
                      "w-full transition-transform duration-200",
                      canOpen && !isOpen ? "cursor-pointer hover:-translate-y-1" : "cursor-default",
                      !canOpen && "opacity-40 grayscale",
                    )}
                    data-cursor-grow
                  >
                    <ChestArt className="w-full" open={isOpen} />
                  </button>
                  <span
                    className="rounded-full px-2 py-0.5 font-display text-[0.7rem] font-semibold text-ink"
                    style={{ backgroundColor: station.accent }}
                  >
                    {isOpen ? birthday.cave.openedLabel : station.gemLabel}
                  </span>
                </div>
              );
            })}
          </div>

          <div className="relative flex flex-col items-center gap-3">
            <p aria-live="polite" className="font-display text-sm font-semibold text-cream/90">
              {allOpened
                ? birthday.cave.completeLabel
                : `${birthday.cave.chestLabel}: ${chestsOpened}/${TOTAL_CHESTS} · ${birthday.map.gemsLabel} ${gemCount}/${TOTAL_GEMS}`}
            </p>
            {allOpened && (
              <button
                type="button"
                onClick={() => {
                  play("click");
                  revealCelebration();
                  scrollToTarget("#celebration", { duration: 1.6 });
                }}
                className="sticker rounded-full bg-lime px-6 py-3 font-display font-semibold text-ink transition-transform duration-200 hover:-translate-y-1"
              >
                {birthday.cave.enterLabel}
              </button>
            )}
          </div>
        </div>

        <div
          ref={flashRef}
          className="pointer-events-none absolute inset-0 bg-white opacity-0"
          aria-hidden="true"
        />
      </div>
    </section>
  );
}
