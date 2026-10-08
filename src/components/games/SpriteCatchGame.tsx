"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { gsap } from "@/lib/gsap";
import { birthday } from "@/config/birthday";
import { audio } from "@/lib/audio";
import { burstAt } from "@/components/effects/ParticlesCanvas";
import { SpriteArt } from "@/components/art/scenery";
import { cn } from "@/lib/utils";
import { GameShell } from "./GameShell";
import type { GameProps } from "./types";

const SPRITE_COUNT = 6;
const SPRITE_TONES = ["#d8e02a", "#8ee8e8", "#ff9d4d", "#f05a63", "#7cc43a", "#71cfce"];

interface SpriteState {
  id: number;
  caught: boolean;
}

/**
 * Ciudad Flotante — "Travesura".
 * Fase 1: atrapar a los duendecillos que se esconden entre las nubes.
 * Fase 2: mini quiz sobre dragones, con tono divertido y sin castigo.
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
  const [status, setStatus] = useState(birthday.games.catch.instruction);

  const caughtCount = sprites.filter((sprite) => sprite.caught).length;

  // Los duendecillos saltan y se esconden solos (timelines infinitas de GSAP).
  useEffect(() => {
    if (phase !== "catch") return;
    const area = areaRef.current;
    if (!area) return;
    const { width, height } = area.getBoundingClientRect();

    timelinesRef.current = spriteRefs.current.map((element, index) => {
      if (!element) return gsap.timeline();
      const randomX = () => 8 + Math.random() * Math.max(20, width - element.offsetWidth - 16);
      const randomY = () => 8 + Math.random() * Math.max(20, height - element.offsetHeight - 16);
      const timeline = gsap.timeline({ repeat: -1, repeatRefresh: true, delay: index * 0.25 });
      timeline
        .set(element, { x: randomX, y: randomY, autoAlpha: 1, scale: 1 })
        .to(element, {
          autoAlpha: 0,
          scale: 0.6,
          duration: 0.25,
          delay: () => gsap.utils.random(1.3, 2.1),
        })
        .to({}, { duration: () => gsap.utils.random(0.25, 0.7) });
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
    setStatus(birthday.games.catch.quizLabel);
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
        duration: reducedMotion ? 0.1 : 0.3,
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
    setStatus(birthday.games.catch.completeLabel);
    setSprites((previous) =>
      previous.map((item) => (item.id === index ? { ...item, caught: true } : item)),
    );
  };

  // Al atrapar a los seis, pasamos al quiz.
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
    if (correct) setCorrectCount((previous) => previous + 1);
    else onFail();
    audio.play(correct ? "sparkle" : "pop");
    setStatus(correct ? birthday.games.catch.correctLabel : birthday.games.catch.wrongLabel);
  };

  const nextQuestion = () => {
    audio.play("click");
    if (questionIndex + 1 >= birthday.quiz.length) {
      onComplete();
      return;
    }
    setQuestionIndex((previous) => previous + 1);
    setAnswer(null);
    setStatus(birthday.games.catch.quizLabel);
  };

  return (
    <div className="h-full">
      <GameShell
        title={birthday.games.catch.title}
        instruction={phase === "catch" ? birthday.games.catch.instruction : birthday.games.catch.quizLabel}
        accent={accent}
        status={status}
        progressLabel={phase === "catch" ? birthday.games.catch.caughtLabel : birthday.games.catch.quizLabel}
        progressValue={phase === "catch" ? caughtCount : questionIndex + 1}
        progressMax={phase === "catch" ? SPRITE_COUNT : birthday.quiz.length}
        canSkip={canSkip}
        onSkip={onSkip}
        onClose={onClose}
      >
        {phase === "catch" ? (
          <div
            ref={areaRef}
            className="relative h-full w-full overflow-hidden rounded-2xl border-4 border-white bg-gradient-to-b from-sky-top via-aqua to-eiwy/60"
          >
            {[
              [12, 18],
              [58, 12],
              [30, 58],
              [74, 62],
            ].map(([left, top], index) => (
              <span
                key={index}
                className="pointer-events-none absolute h-16 w-28 rounded-full bg-white/70 blur-[1px]"
                style={{ left: `${left}%`, top: `${top}%` }}
              />
            ))}

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
                  "absolute left-0 top-0 cursor-pointer p-1",
                  sprite.caught && "pointer-events-none",
                )}
                style={{ willChange: "transform", opacity: 0 }}
                data-cursor-grow
              >
                <SpriteArt tone={SPRITE_TONES[sprite.id % SPRITE_TONES.length]} className="h-10 w-10 sm:h-12 sm:w-12" />
              </button>
            ))}
          </div>
        ) : (
          <div className="flex h-full flex-col items-center justify-center gap-4 rounded-2xl border-4 border-white bg-cream/95 p-4 text-center">
            <p className="eyebrow text-ink/60">{birthday.games.catch.quizLabel}</p>
            <h3 className="max-w-xl font-display text-lg font-semibold text-ink sm:text-xl">
              {question.question}
            </h3>
            <ul className="flex w-full max-w-lg flex-col gap-2">
              {question.options.map((option, optionIndex) => {
                const isAnswer = optionIndex === question.answer;
                const isChosen = answer === optionIndex;
                return (
                  <li key={option}>
                    <button
                      type="button"
                      onClick={() => choose(optionIndex)}
                      className={cn(
                        "sticker w-full rounded-2xl px-4 py-2 text-left font-semibold transition-transform hover:-translate-y-0.5",
                        answer === null
                          ? "bg-white text-ink"
                          : isAnswer
                            ? "bg-leaf/80 text-white"
                            : isChosen
                              ? "bg-coral/70 text-white"
                              : "bg-white/60 text-ink/60",
                      )}
                      disabled={answer !== null}
                    >
                      {option}
                    </button>
                  </li>
                );
              })}
            </ul>

            {answer !== null && (
              <div className="flex flex-col items-center gap-3">
                <p className="max-w-md text-sm font-semibold text-ink/75">{question.fact}</p>
                <button
                  type="button"
                  onClick={nextQuestion}
                  className="sticker rounded-full bg-eiwy px-5 py-2 font-display text-sm font-semibold transition-transform hover:-translate-y-0.5"
                >
                  {questionIndex + 1 >= birthday.quiz.length ? birthday.buttons.continue : birthday.games.catch.quizLabel}
                </button>
                <p className="text-xs font-semibold text-ink/60">
                  {birthday.games.catch.correctLabel} {correctCount}/{birthday.quiz.length}
                </p>
              </div>
            )}
          </div>
        )}
      </GameShell>
    </div>
  );
}
