"use client";

import { useAdventureStore } from "@/store/useAdventureStore";
import { useAudio } from "@/hooks/useAudio";
import { cn } from "@/lib/utils";

/** Botón de silencio: siempre visible durante toda la experiencia. */
export function SoundToggle() {
  const soundEnabled = useAdventureStore((state) => state.soundEnabled);
  const toggleSound = useAdventureStore((state) => state.toggleSound);
  const { play } = useAudio();

  return (
    <button
      type="button"
      onClick={() => {
        toggleSound();
        play("click");
      }}
      aria-label={soundEnabled ? "Silenciar el sonido" : "Activar el sonido"}
      aria-pressed={!soundEnabled}
      className={cn(
        "sticker fixed bottom-4 right-4 z-[60] grid h-12 w-12 place-items-center rounded-full",
        "bg-cream/90 text-ink transition-transform duration-200 hover:-translate-y-0.5 hover:bg-white",
      )}
    >
      <span aria-hidden="true" className="text-xl leading-none">
        {soundEnabled ? "🔊" : "🔇"}
      </span>
    </button>
  );
}
