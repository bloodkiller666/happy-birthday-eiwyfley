"use client";

import { useAdventureStore, selectChapterProgress } from "@/store/useAdventureStore";
import { cn } from "@/lib/utils";

/**
 * Barra superior con el progreso global de la aventura.
 * Bug C fix: el progreso se basa en los capítulos completados, no en `scrollY`.
 */
export function ProgressBar({ className }: { className?: string }) {
  const progress = useAdventureStore(selectChapterProgress);
  const percentage = Math.round(progress * 100);

  return (
    <div className={cn("flex items-center gap-2", className)}>
      <div className="h-2.5 w-24 overflow-hidden rounded-full border-2 border-white/80 bg-white/40 sm:w-40">
        <div
          className="h-full rounded-full bg-gradient-to-r from-cyan via-eiwy to-ember transition-all duration-700 ease-out"
          style={{
            width: `${percentage}%`,
            transformOrigin: "left center",
          }}
        />
      </div>
      <span className="w-9 font-display text-xs font-semibold text-ink/70">
        {percentage}%
      </span>
    </div>
  );
}
