"use client";

import { useEffect, useRef, type ReactNode } from "react";
import { createPortal } from "react-dom";
import { getLenisInstance } from "@/lib/lenis";

interface GameOverlayProps {
  children: ReactNode;
  /** Called when Escape key is pressed. */
  onEscape?: () => void;
}

/**
 * Portal a `document.body` para los minijuegos.
 * - `position: fixed; inset: 0; z-index: 60` (sobre el HUD)
 * - `touch-action: none; overscroll-behavior: none`
 * - Bloquea wheel + touchmove con `preventDefault()`
 * - Bloquea Lenis al montar, lo restaura al desmontar
 * - Escape cierra (cancela sin completar)
 *
 * El cascarón del modal (`GameModalShell`) maneja sus dimensiones y proporciones.
 */
export function GameOverlay({ children, onEscape }: GameOverlayProps) {
  const overlayRef = useRef<HTMLDivElement | null>(null);

  // Block scroll events from reaching the page
  useEffect(() => {
    const overlay = overlayRef.current;
    if (!overlay) return;

    const blockWheel = (e: WheelEvent) => {
      e.preventDefault();
      e.stopPropagation();
    };
    const blockTouch = (e: TouchEvent) => {
      e.preventDefault();
      e.stopPropagation();
    };
    const blockKeyScroll = (e: KeyboardEvent) => {
      const scrollKeys = [
        "ArrowUp",
        "ArrowDown",
        "PageUp",
        "PageDown",
        "Home",
        "End",
        " ",
      ];
      if (scrollKeys.includes(e.key)) {
        e.preventDefault();
      }
      if (e.key === "Escape") {
        onEscape?.();
      }
    };

    overlay.addEventListener("wheel", blockWheel, { passive: false });
    overlay.addEventListener("touchmove", blockTouch, { passive: false });
    document.addEventListener("keydown", blockKeyScroll);

    // Stop Lenis
    const lenis = getLenisInstance();
    lenis?.stop();

    return () => {
      overlay.removeEventListener("wheel", blockWheel);
      overlay.removeEventListener("touchmove", blockTouch);
      document.removeEventListener("keydown", blockKeyScroll);
      lenis?.start();
    };
  }, [onEscape]);

  if (typeof document === "undefined") return null;

  return createPortal(
    <div
      ref={overlayRef}
      className="game-overlay p-3 sm:p-6"
      role="dialog"
      aria-modal="true"
    >
      {children}
    </div>,
    document.body,
  );
}
