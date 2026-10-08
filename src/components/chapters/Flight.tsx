"use client";

import { useRef } from "react";
import { gsap, useGSAP, SplitText, ScrollTrigger, EASE } from "@/lib/gsap";
import { birthday } from "@/config/birthday";
import { useReducedMotion } from "@/hooks/useReducedMotion";
import { prefersReducedMotion } from "@/lib/device";
import { Cloud, Meadow, MountainRange, Sun } from "@/components/art/scenery";
import { DragonSilhouette } from "@/components/art/DragonAvatar";
import { cn } from "@/lib/utils";

const PARALLAX: Array<{ selector: string; distance: number; scale?: number }> = [
  { selector: ".layer-stars", distance: -6 },
  { selector: ".layer-sun", distance: -14 },
  { selector: ".layer-mountains-far", distance: -22, scale: 1.06 },
  { selector: ".layer-clouds-far", distance: -38 },
  { selector: ".layer-mountains-mid", distance: -58, scale: 1.1 },
  { selector: ".layer-clouds-near", distance: -95 },
  { selector: ".layer-meadow", distance: -170, scale: 1.2 },
];

/**
 * Capítulo 1 — El Vuelo.
 * 6 capas de parallax con scrub, la dragona cruza el cielo por una MotionPath
 * ligada al scroll y las frases épicas se revelan palabra por palabra.
 *
 * Bug A fix: frases ocultas en CSS (`.flight-line { opacity:0; visibility:hidden }`),
 * mostradas una a la vez con scrub timeline + SplitText por words.
 * Cada frase usa `white-space: normal`, `max-width`, y `text-wrap: balance`.
 * Backdrop oscuro translúcido para legibilidad sobre las nubes claras.
 */
export function Flight() {
  const sectionRef = useRef<HTMLElement | null>(null);
  const stageRef = useRef<HTMLDivElement | null>(null);
  const reducedMotion = useReducedMotion();

  useGSAP(
    () => {
      const section = sectionRef.current;
      const stage = stageRef.current;
      if (!section || !stage) return;

      const soft = prefersReducedMotion();
      // Fábrica de variables: cada ScrollTrigger recibe su propio objeto.
      const scrub = () => ({
        trigger: section,
        start: "top top",
        end: "bottom bottom",
        scrub: 1,
        invalidateOnRefresh: true,
      });

      // Día → atardecer, animando las variables del tema.
      if (!soft) {
        gsap.to(stage, {
          "--sky-top": "#6d5aa6",
          "--sky-bottom": "#ff9f6b",
          ease: "none",
          scrollTrigger: scrub(),
        });
        gsap.to(".layer-stars", {
          opacity: 0.9,
          ease: "none",
          scrollTrigger: { ...scrub(), scrub: 1.4 },
        });

        PARALLAX.forEach(({ selector, distance, scale }) => {
          gsap.to(selector, {
            yPercent: distance,
            scale: scale ?? 1,
            ease: "none",
            scrollTrigger: scrub(),
          });
        });

        // La dragona vuela siguiendo una curva (MotionPathPlugin).
        gsap.to(".flight-dragon", {
          motionPath: {
            path: "#flight-path",
            align: "#flight-path",
            alignOrigin: [0.5, 0.5],
            autoRotate: 4,
          },
          ease: "none",
          scrollTrigger: { ...scrub(), scrub: 1.2 },
        });
      } else {
        gsap.set(".flight-dragon", {
          xPercent: 0,
          yPercent: 0,
          left: "55%",
          top: "22%",
        });
        gsap.set(".layer-stars", { opacity: 0.5 });
      }

      // Frases: revelado palabra por palabra con SplitText.
      // Esperamos a que las fuentes estén listas para que SplitText mida bien.
      const lines = gsap.utils.toArray<HTMLElement>(".flight-line");
      const splits: SplitText[] = [];

      const buildTextTimeline = () => {
        // Cleanup previous splits if fonts reload
        splits.forEach((s) => s.revert());
        splits.length = 0;

        if (!soft && lines.length > 0) {
          // Set initial hidden state via GSAP (CSS already hides them)
          gsap.set(lines, { autoAlpha: 0 });

          const timeline = gsap.timeline({
            defaults: { ease: EASE.soft },
            scrollTrigger: { ...scrub(), scrub: 1.1 },
          });

          const phraseLen = 1.6;
          const holdLen = 0.4;
          const exitLen = 0.8;

          lines.forEach((line, index) => {
            const split = SplitText.create(line, {
              type: "words",
              wordsClass: "flight-word",
              mask: "words",
              autoSplit: true,
              onSplit(self: { words?: Element[] }) {
                // Re-set initial state after re-split using self instance
                if (self?.words?.length) {
                  gsap.set(self.words, {
                    yPercent: 130,
                    autoAlpha: 0,
                    rotate: 4,
                  });
                }
              },
            });
            splits.push(split);

            const at = index * (phraseLen + holdLen + exitLen);

            // Enter: show the phrase container then stagger words in
            timeline
              .set(line, { autoAlpha: 1 }, at)
              .fromTo(
                split.words,
                { yPercent: 130, autoAlpha: 0, rotate: 4 },
                {
                  yPercent: 0,
                  autoAlpha: 1,
                  rotate: 0,
                  duration: phraseLen,
                  stagger: 0.09,
                  immediateRender: false,
                },
                at,
              )
              // Exit: hide the phrase before the next one
              .to(
                split.words,
                {
                  yPercent: -130,
                  autoAlpha: 0,
                  duration: exitLen,
                  stagger: 0.05,
                  ease: "power2.in",
                },
                at + phraseLen + holdLen,
              )
              .set(line, { autoAlpha: 0 }, at + phraseLen + holdLen + exitLen);
          });
        }

        ScrollTrigger.refresh();
      };

      // Wait for fonts then build
      if (document.fonts?.ready) {
        document.fonts.ready.then(buildTextTimeline);
      } else {
        buildTextTimeline();
      }

      // El título del capítulo se despide al empezar el vuelo.
      gsap.to(".flight-heading", {
        autoAlpha: 0,
        yPercent: -60,
        ease: "none",
        scrollTrigger: { ...scrub(), end: "18% top" },
      });

      // Pista de scroll: se apaga sola.
      gsap.to(".flight-hint", {
        autoAlpha: 0,
        ease: "none",
        scrollTrigger: { ...scrub(), start: "5% top", end: "16% top" },
      });

      return () => {
        splits.forEach((split) => split.revert());
      };
    },
    { dependencies: [reducedMotion], scope: sectionRef },
  );

  return (
    <section
      id="flight"
      data-chapter="flight"
      ref={sectionRef}
      aria-label={`${birthday.flight.eyebrow}: ${birthday.flight.title}`}
      className="relative h-[520vh]"
    >
      <div
        ref={stageRef}
        className="sticky top-0 h-dvh w-full overflow-hidden sky-gradient"
      >
        {/* estrellas del atardecer */}
        <div className="layer-stars pointer-events-none absolute inset-0 opacity-0">
          {[
            [8, 12],
            [18, 26],
            [27, 8],
            [36, 20],
            [46, 10],
            [58, 24],
            [67, 14],
            [78, 28],
            [88, 16],
            [93, 34],
            [14, 40],
            [72, 42],
          ].map(([left, top], index) => (
            <span
              key={index}
              className="absolute h-1.5 w-1.5 rounded-full bg-white/90"
              style={{ left: `${left}%`, top: `${top}%` }}
            />
          ))}
        </div>

        {/* capas de parallax */}
        <div className="layer-sun absolute right-[12%] top-[14%] will-change-transform">
          <Sun className="h-24 w-24 sm:h-32 sm:w-32" />
        </div>

        <div className="layer-mountains-far absolute bottom-[18%] left-0 h-[42vh] w-full will-change-transform">
          <MountainRange depth={0} simple />
        </div>

        <div className="layer-clouds-far absolute inset-0 will-change-transform">
          <Cloud className="absolute left-[6%] top-[24%] w-40 opacity-80 sm:w-52" />
          <Cloud className="absolute left-[54%] top-[16%] w-32 opacity-70 sm:w-44" />
          <Cloud className="absolute left-[76%] top-[38%] w-36 opacity-60 sm:w-48" />
        </div>

        <div className="layer-mountains-mid absolute bottom-[12%] left-0 h-[38vh] w-full will-change-transform">
          <MountainRange depth={1} />
        </div>

        <div className="layer-clouds-near absolute inset-0 will-change-transform">
          <Cloud className="absolute left-[20%] top-[52%] w-56 opacity-90 sm:w-72" />
          <Cloud className="absolute left-[62%] top-[60%] w-48 opacity-85 sm:w-64" />
          <Cloud className="absolute left-[86%] top-[46%] w-40 opacity-80 sm:w-56" />
        </div>

        {/* camino invisible para MotionPath */}
        <svg
          className="pointer-events-none absolute inset-0 h-full w-full"
          viewBox="0 0 1000 700"
          preserveAspectRatio="none"
          aria-hidden="true"
        >
          <path
            id="flight-path"
            d="M-140 470 C 120 300 300 560 560 380 C 760 246 860 320 1140 150"
            fill="none"
            stroke="none"
          />
        </svg>

        {/* la dragona */}
        <div className="flight-dragon pointer-events-none absolute left-0 top-0 w-32 will-change-transform sm:w-48 md:w-56">
          <DragonSilhouette className="drop-shadow-[0_12px_22px_rgba(42,159,174,0.35)]" />
        </div>

        {/* pradera en primer plano */}
        <div className="layer-meadow absolute bottom-0 left-0 h-[26vh] w-full will-change-transform">
          <Meadow />
        </div>

        {/* textos */}
        <div className="flight-heading pointer-events-none absolute inset-x-0 top-[16%] z-10 flex flex-col items-center gap-2 px-6 text-center">
          <p className="eyebrow text-ink/70">{birthday.flight.eyebrow}</p>
          <h2 className="ink-outline text-4xl text-white sm:text-6xl">
            {birthday.flight.title}
          </h2>
          <p className="font-display text-sm font-semibold text-ink/70">
            {birthday.flight.dawnLabel} → {birthday.flight.duskLabel}
          </p>
        </div>

        {/* Fondo oscuro translúcido para legibilidad */}
        <div className="flight-text-backdrop pointer-events-none absolute inset-0 z-[9]" />

        <div
          className={cn(
            "pointer-events-none absolute inset-0 z-10",
            reducedMotion &&
              "flex flex-col items-center justify-center gap-5 px-6 text-center",
          )}
        >
          {birthday.flight.lines.map((line) => (
            <p
              key={line}
              className={cn(
                "flight-line ink-outline px-6 text-center font-display font-semibold text-white",
                reducedMotion
                  ? "text-xl sm:text-3xl"
                  : "absolute inset-x-0 top-1/2 mx-auto -translate-y-1/2 text-2xl sm:text-4xl md:text-5xl",
              )}
              style={
                reducedMotion
                  ? undefined
                  : {
                      maxWidth: "min(22ch, 80vw)",
                      whiteSpace: "normal",
                      textAlign: "center",
                      textWrap: "balance",
                      textShadow:
                        "0 0 12px rgba(23, 32, 46, 0.7), 0 4px 8px rgba(23, 32, 46, 0.45), 0 0 8px rgba(255, 255, 255, 0.75), 0 3px 0 rgba(56, 68, 76, 0.18)",
                    }
              }
            >
              {line}
            </p>
          ))}
        </div>

        <p className="flight-hint absolute inset-x-0 bottom-8 z-10 text-center font-display text-sm font-semibold text-ink/70">
          ↓ {birthday.flight.hint}
        </p>
      </div>
    </section>
  );
}
