"use client";

import { useCallback, useEffect, useRef, useState, type KeyboardEvent as ReactKeyboardEvent } from "react";
import { gsap, useGSAP } from "@/lib/gsap";
import { birthday } from "@/config/birthday";
import { audio } from "@/lib/audio";
import { GemGlyphCollage } from "@/components/art/scenery";
import { shuffle } from "@/lib/utils";
import { GameModalShell } from "./GameModalShell";
import type { GameProps } from "./types";

const PAIRS = 6;
const PAIR_COLORS = ["#27c9ee", "#d8e02a", "#7cc43a", "#f05a63", "#ff9d4d", "#8ee8e8"];

interface CardData {
  key: number;
  pair: number;
}

function buildDeck(): CardData[] {
  const deck: CardData[] = [];
  for (let pair = 0; pair < PAIRS; pair += 1) {
    deck.push({ key: pair * 2, pair }, { key: pair * 2 + 1, pair });
  }
  return shuffle(deck);
}

/**
 * Cueva de Cristales — "Memoria de gemas".
 * 12 cartas (4x3), 6 pares.
 * Cartas con `aspect-ratio: 3/4`, volteo 3D con GSAP y navegación accesible por teclado.
 */
export function MemoryGame({
  accent,
  reducedMotion,
  canSkip,
  onSkip,
  onClose,
  onComplete,
  onFail,
}: GameProps) {
  const boardRef = useRef<HTMLDivElement | null>(null);
  const cardRefs = useRef<Array<HTMLButtonElement | null>>([]);
  const busyRef = useRef(false);
  const doneRef = useRef(false);
  const [deck] = useState<CardData[]>(() => buildDeck());
  const [flipped, setFlipped] = useState<number[]>([]);
  const [matched, setMatched] = useState<number[]>([]);
  const [status, setStatus] = useState("Buscá los 6 pares de gemas");

  const pairsFound = matched.length / 2;

  // Volteo 3D: la animación sigue al estado de React
  useGSAP(
    () => {
      cardRefs.current.forEach((element, index) => {
        if (!element) return;
        const faceUp = flipped.includes(index) || matched.includes(index);
        gsap.to(element, {
          rotateY: faceUp ? 180 : 0,
          duration: reducedMotion ? 0.01 : 0.45,
          ease: "power2.inOut",
        });
      });
    },
    { dependencies: [flipped, matched, reducedMotion], scope: boardRef },
  );

  useEffect(() => {
    if (pairsFound < PAIRS || doneRef.current) return;
    doneRef.current = true;
    audio.play("win");
    setStatus(birthday.games.memory.completeLabel);
    const timer = window.setTimeout(() => onComplete(), reducedMotion ? 250 : 900);
    return () => window.clearTimeout(timer);
  }, [onComplete, pairsFound, reducedMotion]);

  const flip = useCallback(
    (index: number) => {
      if (busyRef.current || flipped.includes(index) || matched.includes(index)) return;
      audio.play("click");

      const next = [...flipped, index];
      if (next.length === 1) {
        setFlipped(next);
        return;
      }

      const [first, second] = next;
      const isMatch = deck[first].pair === deck[second].pair;
      setFlipped(next);

      if (isMatch) {
        busyRef.current = true;
        window.setTimeout(() => {
          setMatched((previous) => [...previous, first, second]);
          setFlipped([]);
          setStatus(`¡Par de cristales encontrado! (${(matched.length + 2) / 2}/${PAIRS})`);
          audio.play("match");
          const card1 = cardRefs.current[first];
          const card2 = cardRefs.current[second];
          if (card1 && card2) {
            gsap.fromTo(
              [card1, card2],
              { scale: 1 },
              { scale: 1.08, duration: 0.2, yoyo: true, repeat: 1, ease: "power2.out" },
            );
          }
          busyRef.current = false;
        }, reducedMotion ? 80 : 380);
      } else {
        busyRef.current = true;
        onFail();
        window.setTimeout(() => {
          setFlipped([]);
          setStatus("No coincidieron, ¡intentá otra vez!");
          audio.play("pop");
          busyRef.current = false;
        }, reducedMotion ? 350 : 850);
      }
    },
    [deck, flipped, matched, onFail, reducedMotion],
  );

  const handleKeyDown = (event: ReactKeyboardEvent<HTMLButtonElement>, index: number) => {
    const cols = 4;
    const total = 12;
    let nextIndex: number | null = null;

    if (event.key === "ArrowRight") nextIndex = (index + 1) % total;
    else if (event.key === "ArrowLeft") nextIndex = (index - 1 + total) % total;
    else if (event.key === "ArrowDown") nextIndex = (index + cols) % total;
    else if (event.key === "ArrowUp") nextIndex = (index - cols + total) % total;
    else if (event.key === "Enter" || event.key === " ") {
      event.preventDefault();
      flip(index);
      return;
    }

    if (nextIndex !== null) {
      event.preventDefault();
      cardRefs.current[nextIndex]?.focus();
    }
  };

  return (
    <GameModalShell
      title={birthday.games.memory.title}
      instruction={birthday.games.memory.instruction}
      accent={accent}
      status={status}
      progressLabel={birthday.games.memory.pairsLabel}
      progressValue={pairsFound}
      progressMax={PAIRS}
      canSkip={canSkip}
      onSkip={onSkip}
      onClose={onClose}
    >
      <div className="flex h-full w-full items-center justify-center rounded-2xl border-4 border-white bg-deep/15 p-2 sm:p-3 overflow-hidden">
        <div
          ref={boardRef}
          className="grid w-full max-w-[580px] grid-cols-4 grid-rows-3 gap-2 sm:gap-3 place-items-center justify-center"
          style={{ perspective: "1000px" }}
        >
          {deck.map((card, index) => {
            const isUp = flipped.includes(index) || matched.includes(index);
            const isMatched = matched.includes(index);

            return (
              <div
                key={card.key}
                className="w-full flex items-center justify-center"
                style={{ aspectRatio: "3 / 4", maxHeight: "110px" }}
              >
                <button
                  type="button"
                  ref={(element) => {
                    cardRefs.current[index] = element;
                  }}
                  onClick={() => flip(index)}
                  onKeyDown={(e) => handleKeyDown(e, index)}
                  disabled={isMatched}
                  aria-label={`Carta ${index + 1}${isUp ? ", boca arriba" : ", oculta"}`}
                  aria-pressed={isUp}
                  className="relative h-full w-full select-none cursor-pointer transition-transform duration-150 hover:scale-105 active:scale-95 disabled:cursor-default"
                  style={{
                    aspectRatio: "3 / 4",
                    transformStyle: "preserve-3d",
                    willChange: "transform",
                  }}
                >
                  {/* Cara dorsal (oculta) */}
                  <span
                    className="absolute inset-0 grid place-items-center rounded-xl border-2 sm:border-[3px] border-white bg-gradient-to-br from-cyan to-deep font-display text-base sm:text-xl font-semibold text-white shadow-md select-none"
                    style={{ backfaceVisibility: "hidden" }}
                  >
                    ?
                  </span>

                  {/* Cara frontal (gema revelada) */}
                  <span
                    className="absolute inset-0 grid place-items-center rounded-xl border-2 sm:border-[3px] border-white bg-cream p-1 shadow-md select-none"
                    style={{
                      backfaceVisibility: "hidden",
                      transform: "rotateY(180deg)",
                      backgroundColor: isMatched ? "#faffea" : "#fff8f3",
                    }}
                  >
                    <GemGlyphCollage
                      variant={card.pair}
                      color={PAIR_COLORS[card.pair % PAIR_COLORS.length]}
                      className="h-3/4 w-3/4"
                    />
                  </span>
                </button>
              </div>
            );
          })}
        </div>
      </div>
    </GameModalShell>
  );
}
