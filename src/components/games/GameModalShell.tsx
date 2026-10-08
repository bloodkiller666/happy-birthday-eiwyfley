"use client";

import type { ReactNode } from "react";
import { birthday } from "@/config/birthday";
import { cn } from "@/lib/utils";

export interface GameModalShellProps {
  /** Nombre o etiqueta del minijuego. */
  title: string;
  /** Instrucción principal (se muestra solo una vez en el header). */
  instruction: string;
  /** Color de acento de la estación. */
  accent: string;
  /** Mensaje de estado para el pie del modal (progreso, aciertos, etc.). */
  status: string;
  /** Etiqueta del contador (ej. "Brasas", "Pares", "Capullos"). */
  progressLabel?: string;
  /** Valor actual del progreso. */
  progressValue?: number;
  /** Valor objetivo del progreso. */
  progressMax?: number;
  /** Habilitar botón de saltar reto tras 2 fallos. */
  canSkip?: boolean;
  onSkip?: () => void;
  /** Cerrar modal y volver al mapa sin penalización. */
  onClose: () => void;
  /** Área de juego garantizada. */
  children: ReactNode;
  /** Clase CSS adicional para el contenedor del playfield si se requiere. */
  playfieldClassName?: string;
}

/**
 * Cascarón modal común para todos los minijuegos.
 *
 * Garantiza:
 * - Modal centrado con ancho fijo responsive: width `min(94vw, 760px)` y `max-height: 92dvh`.
 * - Header con nombre, instrucción (una sola vez), chip de contador y botón X.
 * - Playfield con tamaño garantizado contra colapsos:
 *   - Desktop: `height: clamp(280px, 52vh, 460px)`, `min-height: 280px`.
 *   - Móvil: `height: clamp(260px, 50dvh, 420px)`, `min-height: 260px`.
 * - Pie con mensaje de estado exclusivo y botón opcional "Saltar reto".
 */
export function GameModalShell({
  title,
  instruction,
  accent,
  status,
  progressLabel,
  progressValue,
  progressMax,
  canSkip = false,
  onSkip,
  onClose,
  children,
  playfieldClassName,
}: GameModalShellProps) {
  const showProgress =
    progressLabel !== undefined && progressValue !== undefined && progressMax !== undefined;

  return (
    <div
      className={cn(
        "sticker-lg relative flex w-[94vw] max-w-[760px] max-h-[92dvh] flex-col",
        "rounded-[2rem] bg-cream/95 p-3.5 sm:p-6 shadow-2xl overflow-hidden",
      )}
      role="region"
      aria-label={title}
    >
      {/* Header común */}
      <div className="flex shrink-0 items-center justify-between gap-2 border-b border-ink/10 pb-2.5 sm:pb-3">
        <div className="min-w-0 pr-2">
          <p className="eyebrow truncate text-xs" style={{ color: accent }}>
            {title}
          </p>
          <p className="font-display text-xs sm:text-sm font-semibold text-ink/80 truncate">
            {instruction}
          </p>
        </div>

        <div className="flex shrink-0 items-center gap-2">
          {showProgress && (
            <span
              className="rounded-full px-2.5 py-0.5 sm:px-3 sm:py-1 font-display text-[11px] sm:text-xs font-semibold text-ink shadow-sm"
              style={{ backgroundColor: `${accent}33` }}
            >
              {progressLabel}: {progressValue}/{progressMax}
            </span>
          )}

          <button
            type="button"
            onClick={onClose}
            aria-label={birthday.buttons.backToMap}
            className="grid h-7 w-7 sm:h-8 sm:w-8 place-items-center rounded-full border-2 border-ink/20 text-xs sm:text-sm font-semibold text-ink/70 transition-all hover:bg-white/80 hover:scale-105 active:scale-95 cursor-pointer"
          >
            ✕
          </button>
        </div>
      </div>

      {/* Área de juego con tamaño garantizado (nunca colapsa a 0) */}
      <div
        className={cn(
          "relative w-full shrink-0 my-2 sm:my-3 overflow-hidden rounded-2xl",
          "h-[clamp(260px,50dvh,420px)] sm:h-[clamp(280px,52vh,460px)]",
          "min-h-[260px] sm:min-h-[280px]",
          playfieldClassName,
        )}
      >
        {children}
      </div>

      {/* Pie con solo mensajes de estado */}
      <div className="flex shrink-0 items-center justify-between gap-3 pt-1 border-t border-ink/5">
        <p aria-live="polite" className="text-xs sm:text-sm font-semibold text-ink/75 truncate">
          {status}
        </p>

        {canSkip && onSkip && (
          <button
            type="button"
            onClick={onSkip}
            className="shrink-0 rounded-full border-2 border-ink/20 px-3 py-1 text-xs font-semibold text-ink/70 transition-all hover:bg-white/80 cursor-pointer"
          >
            {birthday.buttons.skip}
          </button>
        )}
      </div>
    </div>
  );
}

/** Re-export con compatibilidad hacia atrás */
export { GameModalShell as GameShell };
