"use client";

import { useRef } from "react";
import { gsap, useGSAP, EASE } from "@/lib/gsap";
import { birthday } from "@/config/birthday";
import { useAdventureStore, type ChapterId } from "@/store/useAdventureStore";
import { GemCounter } from "./GemCounter";
import { ProgressBar } from "./ProgressBar";
import { cn } from "@/lib/utils";

const CHAPTER_LABEL: Record<ChapterId, { eyebrow: string; title: string }> = {
  flight: { eyebrow: birthday.flight.eyebrow, title: birthday.flight.title },
  map: { eyebrow: birthday.map.eyebrow, title: birthday.map.title },
  cave: { eyebrow: birthday.cave.eyebrow, title: birthday.cave.title },
  celebration: { eyebrow: birthday.celebration.eyebrow, title: birthday.celebration.title },
};

/** Barra superior fija: capítulo actual, progreso global y gemas. */
export function Hud() {
  const phase = useAdventureStore((state) => state.phase);
  const chapter = useAdventureStore((state) => state.chapter);
  const visible = phase === "adventure";
  const rootRef = useRef<HTMLDivElement | null>(null);
  const label = CHAPTER_LABEL[chapter];

  useGSAP(
    () => {
      gsap.to(rootRef.current, {
        autoAlpha: visible ? 1 : 0,
        y: visible ? 0 : -16,
        duration: 0.5,
        ease: EASE.soft,
      });
    },
    { dependencies: [visible], scope: rootRef },
  );

  return (
    <div
      ref={rootRef}
      className={cn(
        "invisible pointer-events-none fixed inset-x-0 top-0 z-40 flex items-start justify-between gap-3 p-3 sm:p-4",
        "opacity-0",
      )}
    >
      <div className="sticker flex items-center gap-3 rounded-full bg-cream/90 px-4 py-2">
        <span aria-hidden="true" className="text-lg leading-none">
          🐉
        </span>
        <span className="flex flex-col leading-tight">
          <span className="eyebrow text-ink/65">{label.eyebrow}</span>
          <span className="font-display text-sm font-semibold text-ink sm:text-base">{label.title}</span>
        </span>
      </div>

      <div className="flex items-center gap-3">
        <ProgressBar className="hidden sm:flex" />
        <div className="pointer-events-auto">
          <GemCounter />
        </div>
      </div>
    </div>
  );
}
