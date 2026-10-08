"use client";

import { useRef } from "react";
import { gsap, useGSAP, ScrollTrigger } from "@/lib/gsap";
import { cn } from "@/lib/utils";

/** Barra superior con el progreso global de la aventura (0 → 1). */
export function ProgressBar({ className }: { className?: string }) {
  const barRef = useRef<HTMLDivElement | null>(null);
  const labelRef = useRef<HTMLSpanElement | null>(null);

  useGSAP(() => {
    const bar = barRef.current;
    if (!bar) return;

    gsap.set(bar, { scaleX: 0, transformOrigin: "left center" });

    const trigger = ScrollTrigger.create({
      start: 0,
      end: "max",
      onUpdate: (self) => {
        gsap.set(bar, { scaleX: self.progress });
        if (labelRef.current) {
          labelRef.current.textContent = `${Math.round(self.progress * 100)}%`;
        }
      },
    });

    return () => trigger.kill();
  });

  return (
    <div className={cn("flex items-center gap-2", className)}>
      <div className="h-2.5 w-24 overflow-hidden rounded-full border-2 border-white/80 bg-white/40 sm:w-40">
        <div ref={barRef} className="h-full rounded-full bg-gradient-to-r from-cyan via-eiwy to-ember" />
      </div>
      <span ref={labelRef} className="w-9 font-display text-xs font-semibold text-ink/70">
        0%
      </span>
    </div>
  );
}
