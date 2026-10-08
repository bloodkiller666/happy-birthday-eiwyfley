"use client";

import { useCallback, useEffect, useRef, useState, type ReactNode } from "react";
import type { GemId, StationConfig } from "@/config/birthday";
import { birthday } from "@/config/birthday";
import { useAdventureStore } from "@/store/useAdventureStore";
import { useAudio } from "@/hooks/useAudio";
import { flyGemToHud } from "@/lib/gemFlight";
import { GemSVG, CrystalArt, FlowerArt, SpriteArt } from "@/components/art/scenery";
import { DragonSilhouette } from "@/components/art/DragonAvatar";
import { cn } from "@/lib/utils";
import { BloomGame } from "./BloomGame";
import { DodgeGame } from "./DodgeGame";
import { MemoryGame } from "./MemoryGame";
import { SpriteCatchGame } from "./SpriteCatchGame";
import type { GameProps } from "./types";

type Mode = "idle" | "playing" | "done";

const ILLUSTRATION: Record<GemId, ReactNode> = {
  flowers: <FlowerArt open className="w-28 sm:w-36" />,
  volcano: <DragonSilhouette className="w-40 sm:w-52" />,
  crystals: <CrystalArt color="#27c9ee" className="w-24 sm:w-32" />,
  city: <SpriteArt tone="#d8e02a" className="h-20 w-20 sm:h-24 sm:w-24" />,
};

interface StationPanelProps {
  station: StationConfig;
  /** Índice dentro del mapa (0 = primera estación). */
  index: number;
  total: number;
  reducedMotion: boolean;
  /** Avisa al mapa de que empieza un reto (congela el desplazamiento). */
  onEnterChallenge?: () => void;
  /** Ir a la siguiente estación (o al capítulo final si es la última). */
  onNext: () => void;
}

/**
 * Estación del mapa: presenta el reto, monta el minijuego y, al superarlo,
 * hace volar la gema hasta el HUD.
 */
export function StationPanel({
  station,
  index,
  total,
  reducedMotion,
  onEnterChallenge,
  onNext,
}: StationPanelProps) {
  const acquired = useAdventureStore((state) => state.gems[station.id]);
  const attempts = useAdventureStore((state) => state.attempts[station.id]);
  const completeStation = useAdventureStore((state) => state.completeStation);
  const registerAttempt = useAdventureStore((state) => state.registerAttempt);
  const lockScroll = useAdventureStore((state) => state.lockScroll);
  const unlockScroll = useAdventureStore((state) => state.unlockScroll);
  const [mode, setMode] = useState<Mode>(() => (acquired ? "done" : "idle"));
  const [skipped, setSkipped] = useState(false);
  const gemRef = useRef<HTMLDivElement | null>(null);
  const pendingRewardRef = useRef(false);
  const { play } = useAudio();

  const lockKey = `station-${station.id}`;

  // Mientras se juega, el scroll queda congelado (el mapa no se mueve).
  useEffect(() => {
    if (mode !== "playing") return;
    lockScroll(lockKey);
    return () => unlockScroll(lockKey);
  }, [lockKey, lockScroll, mode, unlockScroll]);

  // Vuelo de la gema hasta el HUD → ahí se marca como conseguida.
  useEffect(() => {
    if (mode !== "done" || !pendingRewardRef.current) return;
    pendingRewardRef.current = false;
    const gem = gemRef.current;
    if (!gem) {
      completeStation(station.id);
      return;
    }
    flyGemToHud({
      from: gem,
      gemId: station.id,
      color: station.accent,
      onArrive: () => {
        completeStation(station.id);
        play("gem");
      },
    });
  }, [completeStation, mode, play, station.accent, station.id]);

  const finish = useCallback((wasSkipped: boolean) => {
    setSkipped(wasSkipped);
    pendingRewardRef.current = true;
    setMode("done");
  }, []);

  const gameProps: GameProps = {
    accent: station.accent,
    reducedMotion,
    canSkip: attempts >= 2,
    onSkip: () => finish(true),
    onClose: () => setMode("idle"),
    onComplete: () => finish(false),
    onFail: () => registerAttempt(station.id),
  };

  const renderGame = () => {
    switch (station.id) {
      case "flowers":
        return <BloomGame {...gameProps} />;
      case "volcano":
        return <DodgeGame {...gameProps} />;
      case "crystals":
        return <MemoryGame {...gameProps} />;
      case "city":
        return <SpriteCatchGame {...gameProps} />;
      default:
        return null;
    }
  };

  return (
    <div
      data-map-panel={index + 1}
      style={{ width: "var(--map-panel-width)" }}
      className="flex h-full shrink-0 snap-center items-center justify-center px-2 pb-6 pt-20 sm:px-6 sm:pb-10 sm:pt-24"
    >
      <article
        className={cn(
          "sticker-lg flex h-full max-h-[600px] w-full max-w-3xl flex-col rounded-[2rem] bg-cream/95 p-4 sm:p-6",
        )}
        aria-label={`${station.eyebrow}: ${station.title}`}
      >
        {mode === "playing" ? (
          renderGame()
        ) : (
          <div className="flex h-full min-h-0 flex-col gap-4 sm:flex-row sm:items-center">
            <div className="flex shrink-0 flex-col items-center gap-2 sm:w-2/5">
              <div className="grid h-32 w-full place-items-center rounded-2xl border-4 border-white bg-white/60 sm:h-44">
                {mode === "done" ? (
                  <div ref={gemRef} className="grid place-items-center">
                    <GemSVG color={station.accent} className="h-16 w-16 drop-shadow-[0_8px_16px_rgba(56,68,76,0.35)]" />
                  </div>
                ) : (
                  ILLUSTRATION[station.id]
                )}
              </div>
              {mode === "done" && (
                <p className="font-display text-xs font-semibold" style={{ color: station.accent }}>
                  {skipped ? birthday.map.doorLabel : station.gemLabel}
                </p>
              )}
            </div>

            <div className="flex min-h-0 flex-1 flex-col justify-center gap-3">
              <p className="eyebrow" style={{ color: station.accent }}>
                {station.eyebrow} · {index + 1}/{total}
              </p>
              <h3 className="font-display text-2xl font-semibold text-ink sm:text-3xl">{station.title}</h3>
              <p className="font-display text-sm font-semibold text-ink/70">«{station.challenge}»</p>
              <p className="text-sm leading-relaxed text-ink/75">
                {mode === "done" ? (skipped ? birthday.map.lockedLabel : station.gemLabel) : station.description}
              </p>
              <p className="text-xs font-semibold italic text-ink/55">{station.hint}</p>

              <div className="mt-1 flex flex-wrap items-center gap-3">
                {mode === "idle" ? (
                  <button
                    type="button"
                    onClick={() => {
                      play("click");
                      // Primero se congela el mapa, después se monta el reto.
                      onEnterChallenge?.();
                      setMode("playing");
                    }}
                    className="sticker rounded-full px-6 py-3 font-display font-semibold text-ink transition-transform duration-200 hover:-translate-y-1"
                    style={{ backgroundColor: station.accent }}
                  >
                    {birthday.buttons.play}
                  </button>
                ) : (
                  <button
                    type="button"
                    onClick={() => {
                      play("click");
                      onNext();
                    }}
                    className="sticker rounded-full bg-eiwy px-6 py-3 font-display font-semibold text-ink transition-transform duration-200 hover:-translate-y-1"
                  >
                    {index + 1 >= total ? birthday.cave.enterLabel : birthday.buttons.nextStation}
                  </button>
                )}
                {attempts >= 2 && mode === "idle" && (
                  <button
                    type="button"
                    onClick={() => finish(true)}
                    className="rounded-full border-2 border-ink/20 px-4 py-2 text-xs font-semibold text-ink/60"
                  >
                    {birthday.buttons.skip}
                  </button>
                )}
              </div>
            </div>
          </div>
        )}
      </article>
    </div>
  );
}
