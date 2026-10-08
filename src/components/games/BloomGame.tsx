"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { gsap } from "@/lib/gsap";
import { burstAt } from "@/components/effects/ParticlesCanvas";
import { FlowerArt } from "@/components/art/scenery";
import { audio } from "@/lib/audio";
import { clamp, cn } from "@/lib/utils";
import { GameModalShell } from "./GameModalShell";
import type { GameProps } from "./types";

const BUD_COUNT = 6;
/** Mantener presionado llena la barra en ~1,1 s. */
const HOLD_SPEED = 0.95;
const DECAY_SPEED = 0.7;
/** Un toque corto también aporta un poco. */
const TAP_BONUS = 0.08;

/**
 * Prado de Flores — "Hazlas florecer".
 * Mantener presionado cada capullo (mouse, dedo o barra espaciadora) para
 * llenar su barra de aliento y hacerlo florecer con pétalos completos, centro dorado y chispas.
 */
export function BloomGame({
  accent,
  reducedMotion,
  canSkip,
  onSkip,
  onClose,
  onComplete,
}: GameProps) {
  const budRefs = useRef<Array<HTMLButtonElement | null>>([]);
  const fillRefs = useRef<Array<HTMLDivElement | null>>([]);
  const progressRef = useRef<number[]>(Array.from({ length: BUD_COUNT }, () => 0));
  const openedRef = useRef<boolean[]>(Array.from({ length: BUD_COUNT }, () => false));
  const holdingRef = useRef<number | null>(null);
  const doneRef = useRef(false);
  const [opened, setOpened] = useState<boolean[]>(Array.from({ length: BUD_COUNT }, () => false));
  const [status, setStatus] = useState("Mantené presionado cada capullo para que florezca");
  const openedCount = opened.filter(Boolean).length;
  const sleepingCount = BUD_COUNT - openedCount;

  const paintFill = useCallback((index: number) => {
    const fill = fillRefs.current[index];
    if (!fill) return;
    const value = progressRef.current[index];
    fill.style.width = `${Math.round(value * 100)}%`;
    fill.style.opacity = value > 0.02 ? "1" : "0";
  }, []);

  const openBud = useCallback(
    (index: number) => {
      if (openedRef.current[index]) return;
      openedRef.current[index] = true;
      progressRef.current[index] = 1;
      paintFill(index);

      // Actualizar estado en React para montar la flor abierta
      setOpened((previous) => {
        const next = [...previous];
        next[index] = true;
        return next;
      });

      const bud = budRefs.current[index];
      if (bud) {
        const rect = bud.getBoundingClientRect();
        const duration = reducedMotion ? 0.15 : 0.65;

        // Rebote elástico alegre al florecer
        gsap.fromTo(
          bud,
          { scale: 0.92 },
          { scale: 1.06, duration, ease: "back.out(2)", yoyo: true, repeat: 1 },
        );

        burstAt(
          rect.left + rect.width / 2,
          rect.top + rect.height * 0.42,
          ["#fdf0e8", "#d8e02a", accent, "#ff9d4d"],
          reducedMotion ? 6 : 18,
        );
      }

      audio.play("bloom");
      setStatus(`¡Flor florecida! (${index + 1}/${BUD_COUNT})`);
    },
    [accent, paintFill, reducedMotion],
  );

  // Loop único: carga el capullo sostenido y descarga el resto
  useEffect(() => {
    let last = performance.now();
    let frame = 0;
    const tick = (now: number) => {
      const delta = Math.min((now - last) / 1000, 0.05);
      last = now;
      for (let index = 0; index < BUD_COUNT; index += 1) {
        if (openedRef.current[index]) continue;
        const speed = holdingRef.current === index ? HOLD_SPEED : -DECAY_SPEED;
        const next = clamp(progressRef.current[index] + delta * speed, 0, 1);
        if (next !== progressRef.current[index]) {
          progressRef.current[index] = next;
          paintFill(index);
        }
        if (next >= 1) openBud(index);
      }
      frame = requestAnimationFrame(tick);
    };
    frame = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(frame);
  }, [openBud, paintFill]);

  // Se completa cuando los seis capullos florecieron
  useEffect(() => {
    if (openedCount < BUD_COUNT || doneRef.current) return;
    doneRef.current = true;
    audio.play("win");
    setStatus("¡El prado entero floreció!");
    const timer = window.setTimeout(() => onComplete(), reducedMotion ? 300 : 900);
    return () => window.clearTimeout(timer);
  }, [onComplete, openedCount, reducedMotion]);

  useEffect(() => {
    const release = () => {
      holdingRef.current = null;
    };
    window.addEventListener("pointerup", release);
    window.addEventListener("pointercancel", release);
    return () => {
      window.removeEventListener("pointerup", release);
      window.removeEventListener("pointercancel", release);
    };
  }, []);

  const start = (index: number) => {
    if (openedRef.current[index]) return;
    holdingRef.current = index;
    audio.play("click");
    progressRef.current[index] = clamp(progressRef.current[index] + TAP_BONUS, 0, 1);
    paintFill(index);
    if (progressRef.current[index] >= 1) openBud(index);
  };

  return (
    <GameModalShell
      title="Prado de Flores"
      instruction="Mantené presionado cada capullo para que florezca"
      accent={accent}
      status={status}
      progressLabel="Capullos dormidos"
      progressValue={sleepingCount}
      progressMax={BUD_COUNT}
      canSkip={canSkip}
      onSkip={onSkip}
      onClose={onClose}
    >
      <div className="grid h-full w-full grid-cols-3 place-items-center gap-2 sm:gap-4 p-2 pt-4 sm:pt-6 rounded-2xl border-4 border-white bg-gradient-to-b from-sky-top/40 via-aqua/25 to-lime/30 overflow-visible select-none">
        {Array.from({ length: BUD_COUNT }, (_, index) => {
          const isOpened = opened[index];

          return (
            <div
              key={index}
              className="flex w-full flex-col items-center justify-end gap-1.5 sm:gap-2 overflow-visible"
            >
              <button
                type="button"
                ref={(element) => {
                  budRefs.current[index] = element;
                }}
                aria-label={`Flor ${index + 1}${isOpened ? " (florecida)" : " (capullo dormido)"}`}
                onPointerDown={(event) => {
                  event.preventDefault();
                  start(index);
                }}
                onPointerUp={() => {
                  holdingRef.current = null;
                }}
                onPointerLeave={() => {
                  if (holdingRef.current === index) holdingRef.current = null;
                }}
                onKeyDown={(event) => {
                  if (event.key !== " " && event.key !== "Enter") return;
                  event.preventDefault();
                  if (event.repeat) return;
                  start(index);
                }}
                onKeyUp={(event) => {
                  if (event.key === " " || event.key === "Enter") holdingRef.current = null;
                }}
                className={cn(
                  "relative w-3/4 max-w-[5.5rem] sm:max-w-[6.5rem] cursor-pointer touch-none transition-transform duration-200 select-none overflow-visible",
                  isOpened ? "scale-105" : "hover:scale-105 active:scale-95",
                )}
              >
                <FlowerArt open={isOpened} color="#fdf0e8" className="w-full h-auto drop-shadow-sm" />
              </button>

              <div className="h-2 w-2/3 max-w-[5rem] overflow-hidden rounded-full bg-white/70 shadow-inner">
                <div
                  ref={(element) => {
                    fillRefs.current[index] = element;
                  }}
                  data-bud-fill={index}
                  className="h-full w-0 rounded-full opacity-0 transition-[opacity] duration-200"
                  style={{ backgroundColor: accent }}
                />
              </div>
            </div>
          );
        })}
      </div>
    </GameModalShell>
  );
}
