"use client";

import { Flip, gsap } from "@/lib/gsap";
import { prefersReducedMotion } from "@/lib/device";
import { burstAt } from "@/components/effects/ParticlesCanvas";

interface FlyGemOptions {
  /** Elemento de origen (la gema en la estación). */
  from: HTMLElement;
  /** Identificador de la gema: busca `[data-gem-slot="id"]` en el HUD. */
  gemId: string;
  color: string;
  onArrive?: () => void;
}

/**
 * Hace volar una gema desde la estación hasta su slot del HUD:
 * 1. crea una copia flotante en la posición de origen,
 * 2. la recorre con MotionPath (arco),
 * 3. ajusta forma y tamaño al slot con `Flip.fit` antes de desaparecer.
 * Con `prefers-reduced-motion` sólo se muestra un destello en el HUD.
 */
export function flyGemToHud({ from, gemId, color, onArrive }: FlyGemOptions): void {
  if (typeof document === "undefined") return;

  const slot = document.querySelector<HTMLElement>(`[data-gem-slot="${gemId}"]`);

  if (prefersReducedMotion() || !slot) {
    const rect = (slot ?? from).getBoundingClientRect();
    burstAt(rect.left + rect.width / 2, rect.top + rect.height / 2, [color, "#ffffff"], 12);
    onArrive?.();
    return;
  }

  const fromRect = from.getBoundingClientRect();
  const toRect = slot.getBoundingClientRect();
  const size = 44;

  const flyer = document.createElement("div");
  flyer.setAttribute("aria-hidden", "true");
  flyer.style.cssText = `position:fixed;left:0;top:0;width:${size}px;height:${size}px;z-index:50;pointer-events:none`;
  flyer.innerHTML = `
    <svg viewBox="0 0 24 24" style="width:100%;height:100%;filter:drop-shadow(0 6px 14px ${color})">
      <path d="M12 2.5 21 9l-3.6 12.5H6.6L3 9z" fill="${color}" stroke="#ffffff" stroke-width="1.4" stroke-linejoin="round" />
      <path d="M12 2.5 8.4 9l3.6 12.5L15.6 9z" fill="#ffffff" opacity="0.4" />
    </svg>`;
  document.body.appendChild(flyer);

  const startX = fromRect.left + fromRect.width / 2 - size / 2;
  const startY = fromRect.top + fromRect.height / 2 - size / 2;
  const endX = toRect.left + toRect.width / 2 - size / 2;
  const endY = toRect.top + toRect.height / 2 - size / 2;
  const midX = (startX + endX) / 2;
  const midY = Math.min(startY, endY) - 120;

  gsap.set(flyer, { x: startX, y: startY, scale: 0.2, autoAlpha: 0 });

  const timeline = gsap.timeline({
    onComplete: () => {
      Flip.fit(flyer, slot, { duration: 0.22, ease: "power2.inOut" });
      gsap.to(flyer, {
        autoAlpha: 0,
        duration: 0.22,
        delay: 0.16,
        onComplete: () => {
          flyer.remove();
          burstAt(toRect.left + toRect.width / 2, toRect.top + toRect.height / 2, [color, "#ffffff"], 14);
          onArrive?.();
        },
      });
    },
  });

  timeline
    .to(flyer, { autoAlpha: 1, scale: 1, duration: 0.25, ease: "back.out(2)" })
    .to(
      flyer,
      {
        motionPath: {
          path: [
            { x: startX, y: startY },
            { x: midX, y: midY },
            { x: endX, y: endY },
          ],
          curviness: 1.4,
        },
        rotate: 260,
        duration: 0.95,
        ease: "power2.inOut",
      },
      "+=0.05",
    );
}
