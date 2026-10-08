"use client";

import { useEffect, useRef, useState } from "react";
import { gsap, useGSAP, ScrollTrigger } from "@/lib/gsap";
import { useAdventureStore, type ChapterId } from "@/store/useAdventureStore";
import { useLenis } from "@/hooks/useLenis";
import { useAudio } from "@/hooks/useAudio";
import { useReducedMotion } from "@/hooks/useReducedMotion";
import { ParticlesCanvas } from "@/components/effects/ParticlesCanvas";
import { useParticleBudget } from "@/hooks/useParticleBudget";
import { Loader } from "@/components/ui/Loader";
import { Hud } from "@/components/ui/Hud";
import { SoundToggle } from "@/components/ui/SoundToggle";
import { CustomCursor } from "@/components/ui/CustomCursor";
import { Prologue } from "@/components/chapters/Prologue";
import { Flight } from "@/components/chapters/Flight";
import { ChallengeMap } from "@/components/chapters/ChallengeMap";
import { TreasureCave } from "@/components/chapters/TreasureCave";
import { Celebration } from "@/components/chapters/Celebration";

/**
 * Corazón de la experiencia: mantiene sincronizados el scroll (Lenis), los
 * capítulos, el estado global y los adornos globales (HUD, partículas, cursor).
 */
export function Adventure() {
  const phase = useAdventureStore((state) => state.phase);
  const scrollLocks = useAdventureStore((state) => state.scrollLocks);
  const runId = useAdventureStore((state) => state.runId);
  const setChapter = useAdventureStore((state) => state.setChapter);
  const reducedMotion = useReducedMotion();
  const [showLoader, setShowLoader] = useState(true);
  const particleBudget = useParticleBudget();
  const mainRef = useRef<HTMLElement | null>(null);

  useAudio();

  useLenis({
    enabled: phase === "adventure" && scrollLocks.length === 0,
    reducedMotion,
  });

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
          onEnter: () => setChapter(section.dataset.chapter as ChapterId),
          onEnterBack: () => setChapter(section.dataset.chapter as ChapterId),
        }),
      );
      return () => triggers.forEach((trigger) => trigger.kill());
    },
    { dependencies: [phase], scope: mainRef },
  );

  return (
    <>
      {particleBudget > 0 && (
        <ParticlesCanvas count={particleBudget} reducedMotion={reducedMotion} />
      )}

      <CustomCursor />
      <SoundToggle />
      <Hud />

      {phase === "prologue" && <Prologue />}

      {/* `key={runId}` remonta todos los capítulos al reiniciar la travesía. */}
      <main key={runId} ref={mainRef} className="relative z-10">
        <Flight />
        <ChallengeMap />
        <TreasureCave />
        <Celebration />
      </main>

      {showLoader && <Loader onFinished={() => setShowLoader(false)} />}
    </>
  );
}
