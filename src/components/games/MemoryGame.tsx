"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { gsap, useGSAP } from "@/lib/gsap";
import { birthday } from "@/config/birthday";
import { audio } from "@/lib/audio";
import { GemGlyphCollage } from "@/components/art/scenery";
import { shuffle } from "@/lib/utils";
import { GameShell } from "./GameShell";
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
 * 12 cartas (4x3), 6 pares. Volteo 3D con GSAP y navegación por teclado.
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
  const [status, setStatus] = useState(birthday.games.memory.instruction);

  const pairsFound = matched.length / 2;

  // Volteo 3D: la animación sigue siempre al estado de React.
  useGSAP(
    () => {
      cardRefs.current.forEach((element, index) => {
        if (!element) return;
        const faceUp = flipped.includes(index) || matched.includes(index);
        gsap.to(element, {
          rotateY: faceUp ? 180 : 0,
          duration: reducedMotion ? 0.01 : 0.5,
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
          setStatus(birthday.games.memory.matchLabel);
          audio.play("match");
          const card = cardRefs.current[second];
          if (card) {
            gsap.fromTo(
              card,
              { scale: 1 },
              { scale: 1.12, duration: 0.18, yoyo: true, repeat: 1, ease: "power2.out" },
            );
          }
          busyRef.current = false;
        }, reducedMotion ? 80 : 380);
      } else {
        busyRef.current = true;
        onFail();
        window.setTimeout(() => {
          setFlipped([]);
          setStatus(birthday.games.memory.instruction);
          audio.play("pop");
          busyRef.current = false;
        }, reducedMotion ? 350 : 850);
      }
    },
    [deck, flipped, matched, onFail, reducedMotion],
  );

  return (
    <div className="h-full">
      <GameShell
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
        <div
          ref={boardRef}
          className="grid h-full grid-cols-3 grid-rows-4 gap-2 rounded-2xl border-4 border-white bg-deep/15 p-2 sm:grid-cols-4 sm:grid-rows-3"
          style={{ perspective: "1100px" }}
        >
          {deck.map((card, index) => {
            const isUp = flipped.includes(index) || matched.includes(index);
            return (
              <button
                key={card.key}
                type="button"
                ref={(element) => {
                  cardRefs.current[index] = element;
                }}
                onClick={() => flip(index)}
                disabled={matched.includes(index)}
                aria-label={`Carta ${index + 1}${isUp ? ", boca arriba" : ", oculta"}`}
                aria-pressed={isUp}
                className="relative h-full w-full cursor-pointer transition-transform duration-150 hover:-translate-y-0.5 disabled:cursor-default"
                style={{ transformStyle: "preserve-3d", willChange: "transform" }}
                data-cursor-grow
              >
                <span
                  className="absolute inset-0 grid place-items-center rounded-xl border-[3px] border-white bg-gradient-to-br from-cyan to-deep font-display text-xl font-semibold text-white shadow-sticker"
                  style={{ backfaceVisibility: "hidden" }}
                >
                  ?
                </span>
                <span
                  className="absolute inset-0 grid place-items-center rounded-xl border-[3px] border-white bg-cream shadow-sticker"
                  style={{ backfaceVisibility: "hidden", transform: "rotateY(180deg)" }}
                >
                  <GemGlyphCollage
                    variant={card.pair}
                    color={PAIR_COLORS[card.pair % PAIR_COLORS.length]}
                    className="h-2/3 w-2/3"
                  />
                </span>
              </button>
            );
          })}
        </div>
      </GameShell>
    </div>
  );
}
