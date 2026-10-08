"use client";

import { useRef } from "react";
import { gsap, useGSAP, EASE } from "@/lib/gsap";
import { birthday } from "@/config/birthday";
import { useAdventureStore, selectGemCount, STATION_ORDER, TOTAL_GEMS } from "@/store/useAdventureStore";
import { cn } from "@/lib/utils";

/**
 * Contador de gemas 0/4. Cada slot lleva `data-gem-slot="<id>"` para que la
 * gema pueda volar desde la estación hasta acá con Flip.
 */
export function GemCounter() {
  const gems = useAdventureStore((state) => state.gems);
  const count = useAdventureStore(selectGemCount);
  const rootRef = useRef<HTMLDivElement | null>(null);

  useGSAP(
    () => {
      STATION_ORDER.forEach((id) => {
        if (!gems[id]) return;
        const slot = rootRef.current?.querySelector<HTMLElement>(`[data-gem-slot="${id}"]`);
        if (!slot) return;
        gsap.fromTo(
          slot.querySelector(".gem-shape"),
          { scale: 0, rotate: -140 },
          { scale: 1, rotate: 0, duration: 0.6, ease: EASE.pop },
        );
      });
    },
    { dependencies: [gems], scope: rootRef },
  );

  return (
    <div
      ref={rootRef}
      className="sticker flex items-center gap-2 rounded-full bg-cream/90 px-3 py-2"
      aria-label={`Gemas conseguidas: ${count} de ${TOTAL_GEMS}`}
    >
      <span className="eyebrow hidden text-ink/70 sm:block">{birthday.map.gemsLabel}</span>
      <ul className="flex items-center gap-1.5" role="list">
        {STATION_ORDER.map((id) => {
          const station = birthday.stations.find((item) => item.id === id);
          const owned = gems[id];
          return (
            <li key={id}>
              <span
                data-gem-slot={id}
                title={station?.gemLabel}
                className={cn(
                  "grid h-7 w-7 place-items-center rounded-full border-2 transition-colors duration-300",
                  owned ? "bg-white/90" : "border-dashed border-ink/25 bg-white/35",
                )}
              >
                <svg
                  viewBox="0 0 24 24"
                  aria-hidden="true"
                  className={cn(
                    "gem-shape h-4 w-4 transition-opacity duration-300",
                    owned ? "opacity-100" : "opacity-25",
                  )}
                >
                  <path
                    d="M12 2.5 21 9l-3.6 12.5H6.6L3 9z"
                    fill={station?.accent ?? "#71cfce"}
                    stroke="#ffffff"
                    strokeWidth="1.6"
                    strokeLinejoin="round"
                  />
                  <path d="M12 2.5 8.4 9l3.6 12.5L15.6 9z" fill="#ffffff" opacity="0.35" />
                </svg>
              </span>
            </li>
          );
        })}
      </ul>
      <span aria-hidden="true" className="font-display text-sm font-semibold text-ink/80">
        {count}/{TOTAL_GEMS}
      </span>
    </div>
  );
}
