"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { gsap } from "@/lib/gsap";
import { birthday } from "@/config/birthday";
import { burstAt } from "@/components/effects/ParticlesCanvas";
import { FlowerArt } from "@/components/art/scenery";
import { audio } from "@/lib/audio";
import { clamp, cn } from "@/lib/utils";
import { GameShell } from "./GameShell";
import type { GameProps } from "./types";

const BUD_COUNT = 6;
/** Mantener presionado llena la barra en ~1,1 s. */
const HOLD_SPEED = 0.9;
const DECAY_SPEED = 0.7;
/** Un toque corto también aporta un poco. */
const TAP_BONUS = 0.08;

/**
 * Prado de Flores — "Hazlas florecer".
 * Mantener presionado cada capullo (mouse, dedo o barra espaciadora) para
 * llenar su barra de aliento y hacerlo florecer. Sin límite de tiempo.
 */
export function BloomGame({ accent, reducedMotion, canSkip, onSkip, onClose, onComplete }: GameProps) {
  const rootRef = useRef<HTMLDivElement | null>(null);
  const budRefs = useRef<Array<HTMLButtonElement | null>>([]);
  const fillRefs = useRef<Array<HTMLDivElement | null>>([]);
  const progressRef = useRef<number[]>(Array.from({ length: BUD_COUNT }, () => 0));
  const openedRef = useRef<boolean[]>(Array.from({ length: BUD_COUNT }, () => false));
  const holdingRef = useRef<number | null>(null);
  const doneRef = useRef(false);
  const [opened, setOpened] = useState<boolean[]>(Array.from({ length: BUD_COUNT }, () => false));
  const [status, setStatus] = useState(birthday.games.bloom.instruction);
  const openedCount = opened.filter(Boolean).length;

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

      const bud = budRefs.current[index];
      if (bud) {
        const petals = bud.querySelectorAll(".flower-petal");
        const sepal = bud.querySelector(".flower-sepal");
        const core = bud.querySelector(".flower-core");
        const group = bud.querySelector(".flower-petals");
        const duration = reducedMotion ? 0.15 : 0.6;

        gsap.to(group, { y: -16, duration, ease: "back.out(1.6)" });
        gsap.to(petals, {
          scaleX: 1.4,
          scaleY: 1.75,
          duration: reducedMotion ? 0.15 : 0.7,
          ease: "back.out(1.7)",
          stagger: reducedMotion ? 0 : 0.04,
        });
        gsap.to(core, { scale: 1.8, duration, ease: "back.out(2)" });
        gsap.to(sepal, { autoAlpha: 0, scaleY: 0.4, duration: 0.3 });

        const rect = bud.getBoundingClientRect();
        burstAt(
          rect.left + rect.width / 2,
          rect.top + rect.height / 2,
          ["#fdf0e8", "#d8e02a", accent],
          reducedMotion ? 6 : 16,
        );
      }

      audio.play("bloom");
      setOpened((previous) => {
        const next = [...previous];
        next[index] = true;
        return next;
      });
      setStatus(birthday.games.bloom.completeLabel);
    },
    [accent, paintFill, reducedMotion],
  );

  // Loop único: carga el capullo sostenido y descarga el resto.
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

  // Se completa cuando los seis capullos florecieron.
  useEffect(() => {
    if (openedCount < BUD_COUNT || doneRef.current) return;
    doneRef.current = true;
    audio.play("win");
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
    <div ref={rootRef} className="h-full">
      <GameShell
        title={birthday.games.bloom.title}
        instruction={birthday.games.bloom.instruction}
        accent={accent}
        status={status}
        progressLabel={birthday.games.bloom.petalsLeft}
        progressValue={BUD_COUNT - openedCount}
        progressMax={BUD_COUNT}
        canSkip={canSkip}
        onSkip={onSkip}
        onClose={onClose}
      >
        <div className="grid h-full grid-cols-3 place-items-end gap-2 sm:gap-5">
          {Array.from({ length: BUD_COUNT }, (_, index) => (
            <div key={index} className="flex w-full flex-col items-center gap-2">
              <button
                type="button"
                ref={(element) => {
                  budRefs.current[index] = element;
                }}
                aria-label={`Capullo ${index + 1}${opened[index] ? " (florecido)" : ""}`}
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
                  "w-3/4 max-w-[7rem] cursor-pointer touch-none transition-transform duration-200",
                  opened[index] ? "scale-105" : "hover:scale-105 active:scale-95",
                )}
                data-cursor-grow
              >
                <FlowerArt className="w-full" />
              </button>
              <div className="h-2.5 w-2/3 max-w-[6rem] overflow-hidden rounded-full bg-white/70">
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
          ))}
        </div>
      </GameShell>
    </div>
  );
}
