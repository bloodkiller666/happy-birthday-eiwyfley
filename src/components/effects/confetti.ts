"use client";

import confetti from "canvas-confetti";

/** Colores de fuegos artificiales y confeti, tomados de la paleta del tema. */
export const CELEBRATION_COLORS = [
  "#71cfce",
  "#8ee8e8",
  "#27c9ee",
  "#d8e02a",
  "#7cc43a",
  "#ff9d4d",
  "#f05a63",
  "#fdf0e8",
];

/** Cañón de confeti desde el centro de la escena. */
export function celebrateBurst(reduced = false, origin: { x: number; y: number } = { x: 0.5, y: 0.6 }): void {
  if (typeof window === "undefined") return;
  confetti({
    particleCount: reduced ? 40 : 140,
    spread: reduced ? 60 : 90,
    startVelocity: reduced ? 28 : 48,
    origin,
    colors: CELEBRATION_COLORS,
    scalar: 1.05,
    ticks: 220,
    zIndex: 80,
  });
}

/** Dos cañones laterales, para el momento de encender las velas. */
export function sideCannons(): void {
  if (typeof window === "undefined") return;
  const options = {
    particleCount: 70,
    spread: 60,
    colors: CELEBRATION_COLORS,
    scalar: 1,
    ticks: 200,
    zIndex: 80,
  } as const;
  confetti({ ...options, angle: 60, origin: { x: 0, y: 0.85 } });
  confetti({ ...options, angle: 120, origin: { x: 1, y: 0.85 } });
}

/**
 * Fuegos artificiales durante un rato.
 * Devuelve una función para detenerlos (usar en el cleanup del efecto).
 */
export function startFireworks(durationMs = 6500, reduced = false): () => void {
  if (typeof window === "undefined") return () => {};

  const end = Date.now() + durationMs;
  const interval = window.setInterval(
    () => {
      if (Date.now() > end) {
        window.clearInterval(interval);
        return;
      }
      confetti({
        particleCount: reduced ? 26 : 64,
        spread: 360,
        startVelocity: reduced ? 22 : 32,
        gravity: 0.9,
        decay: 0.92,
        scalar: 0.95,
        ticks: 180,
        colors: CELEBRATION_COLORS,
        origin: { x: 0.1 + Math.random() * 0.8, y: 0.15 + Math.random() * 0.35 },
        zIndex: 80,
      });
    },
    reduced ? 1100 : 430,
  );

  return () => window.clearInterval(interval);
}
