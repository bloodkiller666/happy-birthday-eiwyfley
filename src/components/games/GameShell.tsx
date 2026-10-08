"use client";

import type { ReactNode } from "react";
import { birthday } from "@/config/birthday";
import { cn } from "@/lib/utils";

interface GameShellProps {
  title: string;
  instruction: string;
  accent: string;
  /** Texto de estado anunciado por lectores de pantalla. */
  status: string;
  progressLabel: string;
  progressValue: number;
  progressMax: number;
  canSkip: boolean;
  onSkip: () => void;
  onClose: () => void;
  children: ReactNode;
}

/** Marco común de los minijuegos: título, progreso, área de juego y "Saltar reto". */
export function GameShell({
  title,
  instruction,
  accent,
  status,
  progressLabel,
  progressValue,
  progressMax,
  canSkip,
  onSkip,
  onClose,
  children,
}: GameShellProps) {
  return (
    <div className="flex h-full w-full flex-col gap-3">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <div>
          <p className="eyebrow" style={{ color: accent }}>
            {title}
          </p>
          <p className="font-display text-sm font-semibold text-ink/75">{instruction}</p>
        </div>
        <div className="flex items-center gap-2">
          <span
            className="rounded-full px-3 py-1 font-display text-xs font-semibold text-ink"
            style={{ backgroundColor: `${accent}33` }}
          >
            {progressLabel}: {progressValue}/{progressMax}
          </span>
          <button
            type="button"
            onClick={onClose}
            aria-label={birthday.buttons.backToMap}
            className="grid h-8 w-8 place-items-center rounded-full border-2 border-ink/20 text-sm font-semibold text-ink/70 transition-colors hover:bg-white/70"
          >
            ✕
          </button>
        </div>
      </div>

      <div className="relative min-h-0 flex-1">{children}</div>

      <div className="flex items-center justify-between gap-3">
        <p aria-live="polite" className="text-sm font-semibold text-ink/75">
          {status}
        </p>
        <button
          type="button"
          onClick={onSkip}
          className={cn(
            "rounded-full border-2 border-ink/20 px-3 py-1.5 text-xs font-semibold text-ink/70",
            "transition-colors hover:bg-white/70",
            canSkip ? "opacity-100" : "pointer-events-none opacity-0",
          )}
          aria-hidden={!canSkip}
          tabIndex={canSkip ? 0 : -1}
        >
          {birthday.buttons.skip}
        </button>
      </div>
    </div>
  );
}
