"use client";

import { useCallback, useEffect, useRef, useState, type CSSProperties } from "react";
import { gsap, useGSAP, EASE } from "@/lib/gsap";
import { birthday } from "@/config/birthday";
import { useAdventureStore } from "@/store/useAdventureStore";
import { useAudio } from "@/hooks/useAudio";
import { useReducedMotion } from "@/hooks/useReducedMotion";
import { prefersReducedMotion } from "@/lib/device";
import { EggSVG } from "@/components/art/scenery";
import { DragonSilhouette } from "@/components/art/DragonAvatar";
import { burstAt } from "@/components/effects/ParticlesCanvas";
import { scrollToTarget } from "@/lib/lenis";
import { clamp } from "@/lib/utils";

/** Velocidad de carga al mantener presionado (1 / segundos). */
const HOLD_SPEED = 0.8;
/** Velocidad de descarga al soltar. */
const DECAY_SPEED = 0.45;
/** Progreso mínimo que aporta un toque rápido (accesibilidad táctil). */
const TAP_BONUS = 0.07;
/** Umbrales donde aparece cada grieta. */
const CRACK_THRESHOLDS = [0.2, 0.42, 0.64, 0.84];

/**
 * Prólogo: un huevo de dragón que vibra, se agrieta y eclosiona.
 * Se puede mantener presionado (mouse/touch/teclado) o tocar repetidas veces.
 */
export function Prologue() {
  const rootRef = useRef<HTMLDivElement | null>(null);
  const eggRef = useRef<HTMLDivElement | null>(null);
  const fillRef = useRef<HTMLDivElement | null>(null);
  const labelRef = useRef<HTMLSpanElement | null>(null);
  const progressRef = useRef(0);
  const cracksDrawnRef = useRef(0);
  const holdingRef = useRef(false);
  const hatchedRef = useRef(false);
  const hatchRef = useRef<() => void>(() => {});
  const wobbleRef = useRef<gsap.core.Timeline | null>(null);

  const [phase, setPhase] = useState<"idle" | "hatching" | "hatched">("idle");
  const beginAdventure = useAdventureStore((state) => state.beginAdventure);
  const reducedMotion = useReducedMotion();
  const { play } = useAudio();

  const paint = useCallback(() => {
    const value = progressRef.current;
    if (fillRef.current) fillRef.current.style.width = `${Math.round(value * 100)}%`;
    if (labelRef.current) labelRef.current.textContent = `${Math.round(value * 100)}%`;
  }, []);

  const drawCracks = useCallback((progress: number) => {
    const total = CRACK_THRESHOLDS.filter((threshold) => progress >= threshold).length;
    const scope = rootRef.current;
    if (!scope) return;
    for (let index = cracksDrawnRef.current; index < total; index += 1) {
      const crack = scope.querySelectorAll<SVGPathElement>(".egg-crack")[index];
      if (!crack) continue;
      gsap.to(crack, { strokeDashoffset: 0, duration: reducedMotion ? 0.1 : 0.45, ease: "power2.out" });
    }
    cracksDrawnRef.current = Math.max(cracksDrawnRef.current, total);
  }, [reducedMotion]);

  /** Secuencia de eclosión → transición con máscara circular al Capítulo 1. */
  const runHatch = useCallback(() => {
    if (hatchedRef.current) return;
    hatchedRef.current = true;
    holdingRef.current = false;
    setPhase("hatching");
    play("hatch");

    const scope = rootRef.current;
    const egg = eggRef.current;
    if (!scope || !egg) return;

    const soft = prefersReducedMotion();
    const rect = egg.getBoundingClientRect();
    burstAt(
      rect.left + rect.width / 2,
      rect.top + rect.height / 2,
      ["#8ee8e8", "#d8e02a", "#ffffff", "#71cfce"],
      soft ? 10 : 34,
    );

    const timeline = gsap.timeline({
      onComplete: () => {
        setPhase("hatched");
        play("win");
      },
    });

    timeline
      .to(".prologue-wobble", { scale: 1.08, duration: 0.18, ease: "power2.out" }, 0)
      .to(".prologue-flash", { autoAlpha: 0.95, duration: 0.14, ease: "power2.in" }, 0.18)
      .to(".prologue-flash", { autoAlpha: 0, duration: 0.55, ease: "power2.out" }, 0.36)
      .to(".egg-body", { scale: 1.25, autoAlpha: 0, duration: 0.5, ease: "power2.out" }, 0.3)
      .fromTo(
        ".prologue-dragon",
        { yPercent: 40, scale: 0.6, autoAlpha: 0 },
        { yPercent: 0, scale: 1, autoAlpha: 1, duration: 0.9, ease: EASE.pop },
        0.45,
      );

    // La dragona ya no responde a más toques durante la eclosión.
    timeline.to(".prologue-egg-button", { autoAlpha: 0.35, duration: 0.3 }, 0.3);

    // Salida hacia el Capítulo 1 con máscara circular.
    timeline.call(
      () => {
        beginAdventure();
        scrollToTarget(0, { immediate: true });
        gsap.to(scope, {
          clipPath: "circle(0% at 50% 45%)",
          duration: soft ? 0.5 : 1.15,
          ease: EASE.soft,
        });
      },
      [],
      soft ? "+=0.6" : "+=1.5",
    );
  }, [beginAdventure, play]);

  // El loop de ticker necesita siempre la última versión de la eclosión.
  useEffect(() => {
    hatchRef.current = runHatch;
  }, [runHatch]);

  // Loop único: carga al mantener, descarga al soltar, eclosión al llegar al 100%.
  useGSAP(
    () => {
      const tick = (_time: number, deltaTime: number) => {
        if (hatchedRef.current) return;
        const delta = (deltaTime / 1000) * (holdingRef.current ? HOLD_SPEED : -DECAY_SPEED);
        const next = clamp(progressRef.current + delta, 0, 1);
        if (next === progressRef.current) return;
        progressRef.current = next;
        paint();
        drawCracks(next);
        if (next >= 1) hatchRef.current();
      };
      gsap.ticker.add(tick);
      return () => gsap.ticker.remove(tick);
    },
    { scope: rootRef },
  );

  // Vibración del huevo mientras se sostiene.
  useGSAP(
    () => {
      if (reducedMotion) return;
      const wobble = gsap.timeline({ repeat: -1, yoyo: true, paused: true });
      wobble.to(".prologue-wobble", { rotate: 1.8, x: 2, duration: 0.09, ease: "none" });
      wobbleRef.current = wobble;
      return () => {
        wobble.kill();
        wobbleRef.current = null;
      };
    },
    { dependencies: [reducedMotion], scope: rootRef },
  );

  const startHold = useCallback(() => {
    if (hatchedRef.current) return;
    holdingRef.current = true;
    wobbleRef.current?.play();
  }, []);

  const endHold = useCallback(() => {
    holdingRef.current = false;
    wobbleRef.current?.pause();
    if (eggRef.current) gsap.to(eggRef.current, { rotate: 0, x: 0, duration: 0.25, ease: EASE.soft });
  }, []);

  const handlePointerDown = () => {
    startHold();
    if (hatchedRef.current) return;
    play("click");
    // Un toque corto igual suma un poquito de progreso.
    progressRef.current = clamp(progressRef.current + TAP_BONUS, 0, 1);
    paint();
    drawCracks(progressRef.current);
    if (progressRef.current >= 1) hatchRef.current();
  };

  return (
    <div
      ref={rootRef}
      data-prologue
      className="fixed inset-0 z-30 flex flex-col items-center justify-center gap-6 overflow-hidden px-6 text-center sky-gradient"
      style={
        {
          "--sky-top": "var(--eiwy-sky-top)",
          "--sky-bottom": "var(--eiwy-sky-bottom)",
          clipPath: "circle(140% at 50% 50%)",
        } as CSSProperties
      }
    >
      <div className="pointer-events-none absolute inset-0 [background:radial-gradient(circle_at_50%_35%,rgba(255,255,255,0.7),transparent_62%)]" />

      <div className="relative flex flex-col items-center gap-3">
        <p className="eyebrow">{birthday.prologue.eyebrow}</p>
        <h1 className="ink-outline text-4xl text-white sm:text-6xl">{birthday.prologue.title}</h1>
        <p className="max-w-md text-base font-semibold text-ink/75">{birthday.prologue.intro}</p>
      </div>

      {/* Escenario del huevo */}
      <div className="relative grid h-[46vh] w-full place-items-center sm:h-[52vh]">
        <div className="prologue-flash pointer-events-none absolute h-[60vmin] w-[60vmin] rounded-full bg-white opacity-0 blur-2xl" />

        <div className="prologue-dragon pointer-events-none absolute w-[62vmin] max-w-lg opacity-0">
          <DragonSilhouette className="w-full" />
        </div>

        <div ref={eggRef} className="prologue-wobble relative">
          <button
            type="button"
            data-egg-anchor
            aria-label={birthday.prologue.press}
            aria-describedby="prologue-status"
            disabled={phase !== "idle"}
            onPointerDown={handlePointerDown}
            onPointerUp={endHold}
            onPointerLeave={endHold}
            onPointerCancel={endHold}
            onKeyDown={(event) => {
              if (event.key !== " " && event.key !== "Enter") return;
              event.preventDefault();
              if (event.repeat) return;
              handlePointerDown();
            }}
            onKeyUp={(event) => {
              if (event.key !== " " && event.key !== "Enter") return;
              endHold();
            }}
            className="prologue-egg-button relative cursor-pointer touch-none rounded-[50%] transition-transform duration-200 hover:scale-[1.03] focus-visible:scale-[1.03] disabled:cursor-default"
          >
            <EggSVG className="w-[38vmin] max-w-xs drop-shadow-[0_18px_30px_rgba(42,159,174,0.35)]" />
          </button>
        </div>
      </div>

      <div className="relative flex w-full max-w-sm flex-col items-center gap-3">
        <p
          aria-live="polite"
          className="font-display text-sm font-semibold text-ink/80"
        >
          <span id="prologue-status">
            {phase === "idle"
              ? birthday.prologue.press
              : phase === "hatching"
                ? birthday.prologue.readyLabel
                : birthday.prologue.hatched}
          </span>
        </p>

        <div className="flex w-full items-center gap-3">
          <span className="eyebrow whitespace-nowrap text-ink/70">{birthday.prologue.loadingLabel}</span>
          <div className="h-4 flex-1 overflow-hidden rounded-full border-2 border-white/80 bg-white/45">
            <div
              ref={fillRef}
              className="h-full w-0 rounded-full bg-gradient-to-r from-leaf via-lime to-ember"
            />
          </div>
          <span ref={labelRef} className="w-10 font-display text-sm font-semibold text-ink/75">
            0%
          </span>
        </div>
      </div>
    </div>
  );
}
