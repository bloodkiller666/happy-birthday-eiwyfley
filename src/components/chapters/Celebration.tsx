"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { gsap, useGSAP, SplitText, EASE } from "@/lib/gsap";
import { birthday } from "@/config/birthday";
import { useAdventureStore, selectGemCount, TOTAL_GEMS } from "@/store/useAdventureStore";
import { useAudio } from "@/hooks/useAudio";
import { useReducedMotion } from "@/hooks/useReducedMotion";
import { prefersReducedMotion } from "@/lib/device";
import { Cake } from "@/components/art/Cake";
import { celebrateBurst, sideCannons, startFireworks } from "@/components/effects/confetti";
import { scrollToTarget } from "@/lib/lenis";
import { clamp, cn } from "@/lib/utils";

/** Velas decorativas. No representan edad alguna. */
const CANDLES = 5;
const HOLD_SPEED = 1 / 1.7;
const DECAY_SPEED = 0.55;

/**
 * Final — La Gran Celebración.
 * Se encienden las velas manteniendo presionado "Aliento de fuego"; después
 * llegan el confeti, los fuegos artificiales y el mensaje final.
 */
export function Celebration() {
  const rootRef = useRef<HTMLDivElement | null>(null);
  const fillRef = useRef<HTMLDivElement | null>(null);
  const labelRef = useRef<HTMLSpanElement | null>(null);
  const progressRef = useRef(0);
  const holdingRef = useRef(false);
  const litFlagsRef = useRef<boolean[]>(Array.from({ length: CANDLES }, () => false));
  const [litCount, setLitCount] = useState(0);
  const [status, setStatus] = useState(birthday.celebration.candleHint);

  const candlesLit = useAdventureStore((state) => state.candlesLit);
  const lightCandles = useAdventureStore((state) => state.lightCandles);
  const replayFinal = useAdventureStore((state) => state.replayFinal);
  const replayAdventure = useAdventureStore((state) => state.replayAdventure);
  const gemCount = useAdventureStore(selectGemCount);
  const reducedMotion = useReducedMotion();
  const { play } = useAudio();

  const paint = useCallback(() => {
    const value = progressRef.current;
    if (fillRef.current) fillRef.current.style.width = `${Math.round(value * 100)}%`;
    if (labelRef.current) labelRef.current.textContent = `${Math.round(value * 100)}%`;
  }, []);

  const lightCandle = useCallback(
    (index: number) => {
      const flames = rootRef.current?.querySelectorAll<SVGGElement>(".candle-flame");
      const flame = flames?.[index];
      if (!flame) return;
      gsap.fromTo(
        flame,
        { autoAlpha: 0, scale: 0.2 },
        { autoAlpha: 1, scale: 1, duration: reducedMotion ? 0.15 : 0.45, ease: "back.out(2.2)" },
      );
      if (!reducedMotion) {
        gsap.to(flame, {
          scaleY: 1.14,
          duration: 0.42,
          repeat: -1,
          yoyo: true,
          ease: "sine.inOut",
          delay: 0.45,
        });
      }
      play("candle");
      setLitCount((previous) => previous + 1);
      // La última vela dispara la celebración (confeti, fuegos y mensaje).
      if (index >= CANDLES - 1) lightCandles();
    },
    [lightCandles, play, reducedMotion],
  );

  // Loop del "aliento de fuego": mantener presionado enciende las velas.
  useEffect(() => {
    if (candlesLit) return;
    let last = performance.now();
    let frame = 0;
    const tick = (now: number) => {
      const delta = Math.min((now - last) / 1000, 0.05);
      last = now;
      const next = clamp(
        progressRef.current + delta * (holdingRef.current ? HOLD_SPEED : -DECAY_SPEED),
        0,
        1,
      );
      if (next !== progressRef.current) {
        progressRef.current = next;
        paint();
        for (let index = 0; index < CANDLES; index += 1) {
          if (litFlagsRef.current[index]) continue;
          if (next >= (index + 1) / CANDLES) {
            litFlagsRef.current[index] = true;
            lightCandle(index);
          }
        }
      }
      frame = requestAnimationFrame(tick);
    };
    frame = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(frame);
  }, [candlesLit, lightCandle, paint]);

  // Todas las velas encendidas → confeti, fuegos artificiales y mensaje.
  useGSAP(
    () => {
      if (!candlesLit) return;
      const soft = prefersReducedMotion();
      setStatus(birthday.celebration.litLabel);
      play("win");
      celebrateBurst(soft);
      if (!soft) {
        sideCannons();
        window.setTimeout(() => sideCannons(), 420);
      }
      const stopFireworks = startFireworks(soft ? 2500 : 7000, soft);

      const paragraphs = gsap.utils.toArray<HTMLElement>(".celebration-message");
      const splits: SplitText[] = [];

      const timeline = gsap.timeline({ delay: soft ? 0.1 : 0.7 });
      timeline.set(paragraphs, { autoAlpha: 1 });

      paragraphs.forEach((paragraph, index) => {
        if (soft) {
          timeline.fromTo(paragraph, { y: 12 }, { y: 0, autoAlpha: 1, duration: 0.3 }, index * 0.15);
          return;
        }
        const split = SplitText.create(paragraph, {
          type: "lines,words",
          mask: "lines",
          linesClass: "message-line",
        });
        splits.push(split);
        timeline.fromTo(
          split.words,
          { yPercent: 130, autoAlpha: 0 },
          { yPercent: 0, autoAlpha: 1, duration: 0.7, stagger: 0.026, ease: EASE.soft },
          index * 0.18,
        );
      });

      timeline
        .to(".celebration-signature", { autoAlpha: 1, y: 0, duration: 0.6, ease: EASE.soft })
        .to(".celebration-actions", { autoAlpha: 1, y: 0, duration: 0.5, ease: EASE.soft }, "-=0.25")
        .to(".celebration-community", { autoAlpha: 1, duration: 0.5 }, "-=0.3");

      return () => {
        stopFireworks();
        splits.forEach((split) => split.revert());
      };
    },
    { dependencies: [candlesLit], scope: rootRef },
  );

/**
 * "Repetir el final": apaga las velas y esconde el mensaje para volver a
 * soplar. El reinicio se hace en el manejador (no en un efecto) porque el
 * estado local de las velas es sólo visual.
 */
  const handleReplayFinal = () => {
    play("click");
    const scope = rootRef.current;
    progressRef.current = 0;
    holdingRef.current = false;
    litFlagsRef.current = Array.from({ length: CANDLES }, () => false);
    if (scope) {
      scope.querySelectorAll(".candle-flame").forEach((flame) => gsap.set(flame, { autoAlpha: 0, scale: 0.2 }));
      scope
        .querySelectorAll<HTMLElement>(
          ".celebration-message, .celebration-signature, .celebration-actions, .celebration-community",
        )
        .forEach((element) => gsap.set(element, { autoAlpha: 0 }));
    }
    paint();
    setLitCount(0);
    setStatus(birthday.celebration.candleHint);
    replayFinal();
  };

  const startHold = () => {
    if (candlesLit) return;
    holdingRef.current = true;
    play("click");
  };

  const endHold = () => {
    holdingRef.current = false;
  };

  return (
    <section
      id="celebration"
      data-chapter="celebration"
      aria-label={`${birthday.celebration.eyebrow}: ${birthday.celebration.title}`}
      className="relative min-h-dvh w-full overflow-hidden bg-gradient-to-b from-dusk-top via-ember/50 to-cream"
    >
      <div ref={rootRef} className="relative flex flex-col items-center gap-8 px-4 py-24 sm:py-28">
        {/* encabezado */}
        <div className="flex flex-col items-center gap-2 text-center">
          <p className="eyebrow text-cream/80">{birthday.celebration.eyebrow}</p>
          <h2 className="ink-outline-dark text-3xl font-semibold text-white sm:text-5xl">
            {birthday.celebration.title}
          </h2>
          <p className="font-display text-sm font-semibold text-cream/85">
            {birthday.map.gemsLabel} {gemCount}/{TOTAL_GEMS} · {birthday.celebration.cakeLabel}
          </p>
        </div>

        {/* pastel */}
        <div className="relative w-full max-w-lg">
          <div className="sticker-lg rounded-[2rem] bg-cream/40 p-3 backdrop-blur-sm">
            <Cake candles={CANDLES} className="w-full" />
          </div>
        </div>

        {/* aliento de fuego */}
        <div className="flex w-full max-w-md flex-col items-center gap-3">
          <button
            type="button"
            onPointerDown={(event) => {
              event.preventDefault();
              startHold();
            }}
            onPointerUp={endHold}
            onPointerLeave={endHold}
            onPointerCancel={endHold}
            onKeyDown={(event) => {
              if (event.key !== " " && event.key !== "Enter") return;
              event.preventDefault();
              if (event.repeat) return;
              startHold();
            }}
            onKeyUp={(event) => {
              if (event.key === " " || event.key === "Enter") endHold();
            }}
            disabled={candlesLit}
            aria-describedby="candle-status"
            className={cn(
              "sticker touch-none rounded-full px-7 py-4 font-display text-base font-semibold text-ink transition-transform duration-200",
              candlesLit
                ? "bg-lime"
                : "bg-gradient-to-r from-cyan to-ember hover:-translate-y-1 active:translate-y-0",
            )}
          >
            {candlesLit ? birthday.celebration.litLabel : birthday.buttons.reveal}
          </button>

          <div className="flex w-full items-center gap-3">
            <div
              role="progressbar"
              aria-valuemin={0}
              aria-valuemax={CANDLES}
              aria-valuenow={litCount}
              aria-label={birthday.celebration.candleHint}
              className="h-3 flex-1 overflow-hidden rounded-full border-2 border-white/80 bg-white/40"
            >
              <div
                ref={fillRef}
                className="h-full w-0 rounded-full bg-gradient-to-r from-cyan via-lime to-ember"
              />
            </div>
            <span ref={labelRef} className="w-10 font-display text-sm font-semibold text-ink/80">
              0%
            </span>
          </div>

          <p id="candle-status" aria-live="polite" className="text-center text-sm font-semibold text-ink/80">
            {status}
          </p>
        </div>

        {/* mensaje final */}
        <div className="flex w-full max-w-3xl flex-col items-center gap-4 text-center">
          {birthday.celebration.message.map((paragraph) => (
            <p
              key={paragraph}
              className="celebration-message opacity-0 font-display text-xl font-semibold leading-snug text-ink sm:text-3xl"
            >
              {paragraph}
            </p>
          ))}

          <p className="celebration-signature ink-outline translate-y-3 font-display text-base font-semibold text-deep opacity-0 sm:text-lg">
            {birthday.from}
          </p>
        </div>

        {/* acciones */}
        <div className="celebration-actions flex translate-y-3 flex-wrap items-center justify-center gap-3 opacity-0">
          <button
            type="button"
            onClick={() => {
              play("click");
              replayAdventure();
              scrollToTarget(0, { duration: 1.6 });
            }}
            className="sticker rounded-full bg-eiwy px-6 py-3 font-display font-semibold text-ink transition-transform duration-200 hover:-translate-y-1"
          >
            {birthday.celebration.replayLabel}
          </button>
          <button
            type="button"
            onClick={handleReplayFinal}
            className="sticker rounded-full bg-cream px-6 py-3 font-display font-semibold text-ink transition-transform duration-200 hover:-translate-y-1"
          >
            {birthday.celebration.replayFinalLabel}
          </button>
        </div>

        {/* mensajes de la comunidad */}
        <div className="celebration-community w-full max-w-3xl rounded-[2rem] border-4 border-white/70 bg-cream/75 p-5 opacity-0">
          <h3 className="text-center font-display text-lg font-semibold text-ink">
            {birthday.celebration.communityTitle}
          </h3>
          {birthday.communityMessages.length === 0 ? (
            <p className="mt-2 text-center text-sm font-semibold text-ink/65">
              {birthday.celebration.communityEmpty}
            </p>
          ) : (
            <ul className="mt-3 grid gap-3 sm:grid-cols-2">
              {birthday.communityMessages.map((message) => (
                <li
                  key={`${message.author}-${message.message}`}
                  className="rounded-2xl border-2 border-white bg-white/70 p-3"
                >
                  <p className="text-sm text-ink/80">{message.message}</p>
                  <p className="mt-1 font-display text-xs font-semibold text-deep">{message.author}</p>
                </li>
              ))}
            </ul>
          )}
        </div>

        <p className="text-center font-display text-xs font-semibold text-ink/60">
          Hecho con cariño para {birthday.honoree} · otra vuelta al sol
        </p>
      </div>
    </section>
  );
}
