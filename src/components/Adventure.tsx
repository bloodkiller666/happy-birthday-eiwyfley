"use client";

import { useEffect, useRef, useState } from "react";
import { gsap, useGSAP, ScrollTrigger } from "@/lib/gsap";
import {
  useAdventureStore,
  CHAPTER_ORDER,
  type ChapterId,
} from "@/store/useAdventureStore";
import type { GemId } from "@/config/birthday";
import { birthday } from "@/config/birthday";
import { useLenis } from "@/hooks/useLenis";
import { useAudio } from "@/hooks/useAudio";
import { useReducedMotion } from "@/hooks/useReducedMotion";
import { ParticlesCanvas } from "@/components/effects/ParticlesCanvas";
import { useParticleBudget } from "@/hooks/useParticleBudget";
import { Loader } from "@/components/ui/Loader";
import { Hud } from "@/components/ui/Hud";
import { SoundToggle } from "@/components/ui/SoundToggle";
import { ChapterController } from "@/components/ChapterController";
import { Prologue } from "@/components/chapters/Prologue";
import { Flight } from "@/components/chapters/Flight";
import { ChallengeMap } from "@/components/chapters/ChallengeMap";
import { TreasureCave } from "@/components/chapters/TreasureCave";
import { Celebration } from "@/components/chapters/Celebration";
import { scrollToTarget } from "@/lib/lenis";
import { GameOverlay } from "@/components/games/GameOverlay";
import { BloomGame } from "@/components/games/BloomGame";
import { DodgeGame } from "@/components/games/DodgeGame";
import { MemoryGame } from "@/components/games/MemoryGame";
import { SpriteCatchGame } from "@/components/games/SpriteCatchGame";
import type { GameProps } from "@/components/games/types";

/**
 * Corazón de la experiencia: mantiene sincronizados el scroll (Lenis), los
 * capítulos, el estado global y los adornos globales (HUD, partículas).
 */
export function Adventure() {
  const phase = useAdventureStore((state) => state.phase);
  const scrollLocks = useAdventureStore((state) => state.scrollLocks);
  const runId = useAdventureStore((state) => state.runId);
  const setChapter = useAdventureStore((state) => state.setChapter);
  const completeChapter = useAdventureStore((state) => state.completeChapter);
  const replayAdventure = useAdventureStore((state) => state.replayAdventure);
  const reducedMotion = useReducedMotion();
  const [showLoader, setShowLoader] = useState(true);
  const [isDebug, setIsDebug] = useState(false);
  const [debugGame, setDebugGame] = useState<GemId | null>(null);
  const particleBudget = useParticleBudget();
  const mainRef = useRef<HTMLElement | null>(null);

  useAudio();

  useLenis({
    enabled: phase === "adventure" && scrollLocks.length === 0,
    reducedMotion,
  });

  // Check debug mode from URL (?debug=1 or ?debug=games)
  useEffect(() => {
    if (typeof window === "undefined") return;
    const debugParam = new URLSearchParams(window.location.search).get("debug");
    if (debugParam === "1" || debugParam === "games") {
      requestAnimationFrame(() => setIsDebug(true));
      if (debugParam === "games") {
        requestAnimationFrame(() => setDebugGame("flowers"));
      }
    }
  }, []);

  // Recalcula las medidas cuando cambia de fase (aparece/desaparece contenido).
  useEffect(() => {
    if (phase === "loading") return;
    const id = window.setTimeout(() => ScrollTrigger.refresh(), 260);
    return () => window.clearTimeout(id);
  }, [phase, runId]);

  // El HUD sigue al capítulo visible, con scroll nativo (Lenis incluido).
  useGSAP(
    () => {
      const sections = gsap.utils.toArray<HTMLElement>("[data-chapter]");
      const triggers = sections.map((section) =>
        ScrollTrigger.create({
          trigger: section,
          start: "top 55%",
          end: "bottom 45%",
          onEnter: () =>
            setChapter(section.dataset.chapter as ChapterId),
          onEnterBack: () =>
            setChapter(section.dataset.chapter as ChapterId),
        }),
      );
      return () => triggers.forEach((trigger) => trigger.kill());
    },
    { dependencies: [phase], scope: mainRef },
  );

  const getDebugGameProps = (gemId: GemId): GameProps => {
    const station = birthday.stations.find((s) => s.id === gemId) ?? birthday.stations[0];
    return {
      accent: station.accent,
      reducedMotion,
      canSkip: true,
      onSkip: () => setDebugGame(null),
      onClose: () => setDebugGame(null),
      onComplete: () => setDebugGame(null),
      onFail: () => {},
    };
  };

  const renderDebugGame = () => {
    if (!debugGame) return null;
    const props = getDebugGameProps(debugGame);
    switch (debugGame) {
      case "flowers":
        return <BloomGame {...props} />;
      case "volcano":
        return <DodgeGame {...props} />;
      case "crystals":
        return <MemoryGame {...props} />;
      case "city":
        return <SpriteCatchGame {...props} />;
      default:
        return null;
    }
  };

  return (
    <>
      {particleBudget > 0 && (
        <ParticlesCanvas count={particleBudget} reducedMotion={reducedMotion} />
      )}

      <SoundToggle />
      <Hud />
      <ChapterController />

      {phase === "prologue" && <Prologue />}

      {/* `key={runId}` remonta todos los capítulos al reiniciar la travesía. */}
      <main key={runId} ref={mainRef} className="relative z-10">
        <Flight />
        <ChallengeMap />
        <TreasureCave />
        <Celebration />
      </main>

      {showLoader && <Loader onFinished={() => setShowLoader(false)} />}

      {/* Modal directo de minijuegos para modo debug */}
      {debugGame && (
        <GameOverlay onEscape={() => setDebugGame(null)}>
          {renderDebugGame()}
        </GameOverlay>
      )}

      {/* Debug panel — activable con ?debug=1 o ?debug=games */}
      {isDebug && (
        <div className="fixed bottom-4 left-4 z-[100] flex flex-col gap-2 rounded-2xl border-2 border-white/60 bg-ink/90 p-3.5 backdrop-blur-md shadow-2xl text-xs max-w-xs">
          <div className="flex items-center justify-between gap-2 border-b border-white/10 pb-1.5">
            <p className="font-display font-semibold text-white/90">
              🛠️ Modo Debug
            </p>
            <span className="text-[10px] text-white/50">?debug=games</span>
          </div>

          <p className="text-[10px] font-semibold text-starlight/80">Probar Minijuegos:</p>
          <div className="grid grid-cols-2 gap-1.5">
            <button
              type="button"
              onClick={() => setDebugGame("flowers")}
              className="rounded-lg bg-white/10 hover:bg-white/20 p-1.5 text-left font-semibold text-white cursor-pointer transition-colors"
            >
              🌸 1. Flores
            </button>
            <button
              type="button"
              onClick={() => setDebugGame("volcano")}
              className="rounded-lg bg-white/10 hover:bg-white/20 p-1.5 text-left font-semibold text-white cursor-pointer transition-colors"
            >
              🌋 2. Volcán
            </button>
            <button
              type="button"
              onClick={() => setDebugGame("crystals")}
              className="rounded-lg bg-white/10 hover:bg-white/20 p-1.5 text-left font-semibold text-white cursor-pointer transition-colors"
            >
              💎 3. Memoria
            </button>
            <button
              type="button"
              onClick={() => setDebugGame("city")}
              className="rounded-lg bg-white/10 hover:bg-white/20 p-1.5 text-left font-semibold text-white cursor-pointer transition-colors"
            >
              ✨ 4. Ciudad
            </button>
          </div>

          <p className="text-[10px] font-semibold text-starlight/80 pt-1">Saltar a Capítulo:</p>
          <div className="flex flex-wrap gap-1">
            {CHAPTER_ORDER.filter((id) => id !== "prologue").map((id) => (
              <button
                key={id}
                type="button"
                onClick={() => {
                  completeChapter(id);
                  const section = document.querySelector<HTMLElement>(
                    `[data-chapter="${id}"]`,
                  );
                  if (section) {
                    scrollToTarget(section, { duration: 0.5 });
                  }
                }}
                className="rounded-full bg-eiwy/80 hover:bg-eiwy px-2.5 py-0.5 font-semibold text-ink cursor-pointer transition-colors"
              >
                → {id}
              </button>
            ))}
          </div>

          <button
            type="button"
            onClick={() => {
              replayAdventure();
              scrollToTarget(0, { immediate: true });
            }}
            className="mt-1 rounded-full bg-coral/80 hover:bg-coral px-3 py-1 font-semibold text-white cursor-pointer transition-colors text-center"
          >
            🔄 Reiniciar Aventura
          </button>
        </div>
      )}
    </>
  );
}
