"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { gsap } from "@/lib/gsap";
import { birthday } from "@/config/birthday";
import { audio } from "@/lib/audio";
import { burstAt } from "@/components/effects/ParticlesCanvas";
import { SpriteArt } from "@/components/art/scenery";
import { cn } from "@/lib/utils";
import { GameModalShell } from "./GameModalShell";
import type { GameProps } from "./types";

const SPRITE_COUNT = 6;
const SPRITE_TONES = ["#d8e02a", "#8ee8e8", "#ff9d4d", "#f05a63", "#7cc43a", "#71cfce"];

// Coordenadas base en porcentaje para ubicar a los 6 duendecillos dentro del playfield
const SPRITE_SPAWN_ZONES = [
  { x: 12, y: 22 },
  { x: 72, y: 18 },
  { x: 42, y: 45 },
  { x: 18, y: 68 },
  { x: 76, y: 65 },
  { x: 50, y: 15 },
];

interface SpriteState {
  id: number;
  caught: boolean;
}

/**
 * Ciudad Flotante — "Travesura".
 * Fase 1: atrapar a los duendecillos que se esconden entre las nubes.
 * Fase 2: mini quiz sobre dragones dentro del mismo shell sin variar dimensiones.
 */
export function SpriteCatchGame({
  accent,
  reducedMotion,
  canSkip,
  onSkip,
  onClose,
  onComplete,
  onFail,
}: GameProps) {
  const areaRef = useRef<HTMLDivElement | null>(null);
  const spriteRefs = useRef<Array<HTMLButtonElement | null>>([]);
  const timelinesRef = useRef<gsap.core.Timeline[]>([]);
  const doneRef = useRef(false);
  const [sprites, setSprites] = useState<SpriteState[]>(
    Array.from({ length: SPRITE_COUNT }, (_, id) => ({ id, caught: false })),
  );
  const [phase, setPhase] = useState<"catch" | "quiz">("catch");
  const [questionIndex, setQuestionIndex] = useState(0);
  const [answer, setAnswer] = useState<number | null>(null);
  const [correctCount, setCorrectCount] = useState(0);
  const [status, setStatus] = useState("Tocá a los duendecillos antes de que se escondan");

  const caughtCount = sprites.filter((sprite) => sprite.caught).length;

  // Animaciones cíclicas de aparición/ocultamiento de los duendecillos
  useEffect(() => {
    if (phase !== "catch") return;

    timelinesRef.current = spriteRefs.current.map((element, index) => {
      if (!element) return gsap.timeline();
      const zone = SPRITE_SPAWN_ZONES[index % SPRITE_SPAWN_ZONES.length];

      const timeline = gsap.timeline({ repeat: -1, repeatRefresh: true, delay: index * 0.3 });
      timeline
        .set(element, {
          left: `${zone.x + (Math.random() * 12 - 6)}%`,
          top: `${zone.y + (Math.random() * 12 - 6)}%`,
          autoAlpha: 0,
          scale: 0.4,
        })
        .to(element, {
          autoAlpha: 1,
          scale: 1,
          duration: 0.3,
          ease: "back.out(1.8)",
        })
        .to(element, {
          y: -8,
          duration: 0.5,
          yoyo: true,
          repeat: 2,
          ease: "sine.inOut",
        })
        .to(element, {
          autoAlpha: 0,
          scale: 0.4,
          duration: 0.3,
          ease: "power2.in",
          delay: 0.4,
        })
        .to({}, { duration: 0.6 + Math.random() * 0.8 });

      return timeline;
    });

    return () => {
      timelinesRef.current.forEach((timeline) => timeline.kill());
      timelinesRef.current = [];
    };
  }, [phase, reducedMotion]);

  const goToQuiz = useCallback(() => {
    if (doneRef.current) return;
    doneRef.current = true;
    timelinesRef.current.forEach((timeline) => timeline.kill());
    setPhase("quiz");
    setStatus("¡Responde las preguntas del duende!");
    audio.play("gem");
  }, []);

  const catchSprite = (index: number) => {
    if (phase !== "catch") return;
    const sprite = sprites[index];
    if (!sprite || sprite.caught) return;

    const element = spriteRefs.current[index];
    timelinesRef.current[index]?.kill();
    if (element) {
      const rect = element.getBoundingClientRect();
      gsap.to(element, {
        scale: 0.2,
        autoAlpha: 0,
        duration: reducedMotion ? 0.1 : 0.25,
        ease: "power2.in",
      });
      burstAt(
        rect.left + rect.width / 2,
        rect.top + rect.height / 2,
        [SPRITE_TONES[index % SPRITE_TONES.length], "#ffffff"],
        reducedMotion ? 6 : 14,
      );
    }
    audio.play("pop");
    const nextCount = caughtCount + 1;
    setStatus(`¡Duendecillo atrapado! (${nextCount}/${SPRITE_COUNT})`);
    setSprites((previous) =>
      previous.map((item) => (item.id === index ? { ...item, caught: true } : item)),
    );
  };

  // Al atrapar a los seis, pasa al quiz
  useEffect(() => {
    if (phase !== "catch" || caughtCount < SPRITE_COUNT) return;
    const timer = window.setTimeout(goToQuiz, reducedMotion ? 250 : 800);
    return () => window.clearTimeout(timer);
  }, [caughtCount, goToQuiz, phase, reducedMotion]);

  const question = birthday.quiz[questionIndex];

  const choose = (optionIndex: number) => {
    if (answer !== null) return;
    setAnswer(optionIndex);
    const correct = optionIndex === question.answer;
    if (correct) {
      const nextCount = correctCount + 1;
      setCorrectCount(nextCount);
      audio.play("sparkle");
      setStatus(`¡Correcto! (${nextCount}/${birthday.quiz.length} acertadas)`);
    } else {
      onFail();
      audio.play("pop");
      setStatus("¡Casi! " + birthday.games.catch.wrongLabel);
    }
  };

  const nextQuestion = () => {
    audio.play("click");
    if (questionIndex + 1 >= birthday.quiz.length) {
      audio.play("win");
      onComplete();
      return;
    }
    setQuestionIndex((previous) => previous + 1);
    setAnswer(null);
    setStatus("¡Elige la respuesta correcta!");
  };

  return (
    <GameModalShell
      title={birthday.games.catch.title}
      instruction={
        phase === "catch" ? birthday.games.catch.instruction : birthday.games.catch.quizLabel
      }
      accent={accent}
      status={status}
      progressLabel={phase === "catch" ? "Duendecillos" : "Pregunta"}
      progressValue={phase === "catch" ? caughtCount : questionIndex + 1}
      progressMax={phase === "catch" ? SPRITE_COUNT : birthday.quiz.length}
      canSkip={canSkip}
      onSkip={onSkip}
      onClose={onClose}
    >
      {phase === "catch" ? (
        <div
          ref={areaRef}
          className="relative h-full w-full overflow-hidden rounded-2xl border-4 border-white bg-gradient-to-b from-sky-top via-aqua to-eiwy/60 select-none touch-none"
        >
          {/* Nubes decorativas */}
          {[
            [10, 15],
            [60, 10],
            [25, 55],
            [72, 60],
          ].map(([left, top], index) => (
            <span
              key={index}
              className="pointer-events-none absolute h-14 w-24 rounded-full bg-white/70 blur-[1px]"
              style={{ left: `${left}%`, top: `${top}%` }}
            />
          ))}

          {/* Duendecillos interactivos */}
          {sprites.map((sprite) => (
            <button
              key={sprite.id}
              type="button"
              ref={(element) => {
                spriteRefs.current[sprite.id] = element;
              }}
              onClick={() => catchSprite(sprite.id)}
              disabled={sprite.caught}
              aria-label={`Duendecillo ${sprite.id + 1}`}
              className={cn(
                "absolute cursor-pointer p-1 transition-transform active:scale-95 touch-none select-none",
                sprite.caught && "pointer-events-none",
              )}
              style={{
                left: `${SPRITE_SPAWN_ZONES[sprite.id].x}%`,
                top: `${SPRITE_SPAWN_ZONES[sprite.id].y}%`,
                willChange: "transform, opacity",
                opacity: 0,
              }}
            >
              <SpriteArt
                tone={SPRITE_TONES[sprite.id % SPRITE_TONES.length]}
                className="h-10 w-10 sm:h-12 sm:w-12 drop-shadow-md"
              />
            </button>
          ))}
        </div>
      ) : (
        <div className="flex h-full w-full flex-col items-center justify-between rounded-2xl border-4 border-white bg-cream/95 p-3 sm:p-4 text-center overflow-y-auto no-scrollbar select-none">
          <div className="w-full">
            <span className="eyebrow text-ink/60 text-xs">{birthday.games.catch.quizLabel}</span>
            <h3 className="mt-1 font-display text-base sm:text-lg font-semibold text-ink">
              {question.question}
            </h3>
          </div>

          <ul className="flex w-full max-w-md flex-col gap-1.5 sm:gap-2 my-1">
            {question.options.map((option, optionIndex) => {
              const isAnswer = optionIndex === question.answer;
              const isChosen = answer === optionIndex;
              return (
                <li key={option}>
                  <button
                    type="button"
                    onClick={() => choose(optionIndex)}
                    className={cn(
                      "sticker w-full rounded-xl px-3.5 py-2 text-left font-display text-xs sm:text-sm font-semibold transition-all hover:scale-[1.01] active:scale-[0.99] cursor-pointer",
                      answer === null
                        ? "bg-white text-ink shadow-sm"
                        : isAnswer
                          ? "bg-leaf text-white"
                          : isChosen
                            ? "bg-coral text-white"
                            : "bg-white/60 text-ink/50",
                    )}
                    disabled={answer !== null}
                  >
                    {option}
                  </button>
                </li>
              );
            })}
          </ul>

          <div className="flex w-full flex-col items-center gap-1 min-h-[50px] justify-center">
            {answer !== null ? (
              <>
                <p className="text-xs font-semibold text-ink/80 truncate max-w-md">
                  {question.fact}
                </p>
                <button
                  type="button"
                  onClick={nextQuestion}
                  className="sticker rounded-full bg-eiwy px-5 py-1 font-display text-xs sm:text-sm font-semibold transition-transform hover:-translate-y-0.5 cursor-pointer shadow-sm"
                >
                  {questionIndex + 1 >= birthday.quiz.length
                    ? birthday.buttons.continue
                    : "Siguiente pregunta →"}
                </button>
              </>
            ) : (
              <p className="text-[11px] text-ink/50 italic">
                Respondé para avanzar · Sin límite de tiempo
              </p>
            )}
          </div>
        </div>
      )}
    </GameModalShell>
  );
}
