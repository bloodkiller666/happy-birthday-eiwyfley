"use client";

import { useCallback, useEffect, useRef, useState, type KeyboardEvent as ReactKeyboardEvent } from "react";
import { gsap } from "@/lib/gsap";
import { birthday } from "@/config/birthday";
import { audio } from "@/lib/audio";
import { burstAt } from "@/components/effects/ParticlesCanvas";
import { DragonSilhouette } from "@/components/art/DragonAvatar";
import { clamp } from "@/lib/utils";
import { GameShell } from "./GameShell";
import type { GameProps } from "./types";

const TARGET_EMBERS = 5;
const MAX_HEARTS = 3;
const ROUND_SECONDS = 20;
const PLAYER_W = 72;
const PLAYER_H = 58;
/** Cada cuánto aparece una roca o brasa. */
const SPAWN_INTERVAL = 0.7;

interface Item {
  el: HTMLDivElement;
  x: number;
  y: number;
  vy: number;
  size: number;
  kind: "rock" | "ember";
  dead: boolean;
}

/**
 * Volcán — "Aliento de Fuego".
 * Movés a la dragona con el mouse, el dedo o las flechas; esquivás rocas y
 * recogés brasas. Dificultad amable: 3 corazones y reintentos sin castigo.
 */
export function DodgeGame({
  accent,
  reducedMotion,
  canSkip,
  onSkip,
  onClose,
  onComplete,
  onFail,
}: GameProps) {
  const areaRef = useRef<HTMLDivElement | null>(null);
  const playerRef = useRef<HTMLDivElement | null>(null);
  const itemsRef = useRef<Item[]>([]);
  const targetXRef = useRef(0);
  const currentXRef = useRef(0);
  const keysRef = useRef({ left: false, right: false });
  const sizeRef = useRef({ width: 0, height: 0 });
  const finishedRef = useRef(false);

  const [embers, setEmbers] = useState(0);
  const [hearts, setHearts] = useState(MAX_HEARTS);
  const [timeLeft, setTimeLeft] = useState(ROUND_SECONDS);
  const [running, setRunning] = useState(false);
  const [status, setStatus] = useState(birthday.games.dodge.instruction);
  const [outcome, setOutcome] = useState<"none" | "win" | "fail">("none");

  const spawnItem = useCallback(() => {
    const area = areaRef.current;
    if (!area) return;
    const { width } = sizeRef.current;
    if (width <= 0) return;

    const isEmber = Math.random() < 0.45;
    const size = isEmber ? 26 : 34 + Math.random() * 18;
    const el = document.createElement("div");
    el.style.position = "absolute";
    el.style.left = "0px";
    el.style.top = "0px";
    el.style.width = `${size}px`;
    el.style.height = `${size}px`;
    el.style.willChange = "transform";
    el.style.pointerEvents = "none";
    if (isEmber) {
      el.style.borderRadius = "50%";
      el.style.background = `radial-gradient(circle at 35% 35%, #fff6cf, ${accent})`;
      el.style.boxShadow = `0 0 18px ${accent}`;
      el.style.border = "2px solid #ffffff";
    } else {
      el.style.background = "#6b2a14";
      el.style.boxShadow = "inset -6px -6px 0 rgba(0,0,0,0.25)";
      el.style.border = "3px solid #ffffff";
      el.style.borderRadius = size > 44 ? "45% 55% 40% 60%" : "50%";
    }
    area.appendChild(el);

    itemsRef.current.push({
      el,
      x: 20 + Math.random() * Math.max(1, width - size - 40),
      y: -size,
      vy: (isEmber ? 210 : 250) + Math.random() * 140,
      size,
      kind: isEmber ? "ember" : "rock",
      dead: false,
    });
  }, [accent]);

  const finish = useCallback(
    (kind: "win" | "fail") => {
      if (finishedRef.current) return;
      finishedRef.current = true;
      setRunning(false);
      setOutcome(kind);
      if (kind === "win") {
        audio.play("win");
        setStatus(birthday.games.dodge.completeLabel);
        window.setTimeout(() => onComplete(), reducedMotion ? 200 : 900);
      } else {
        audio.play("pop");
        setStatus(birthday.games.dodge.failLabel);
        onFail();
      }
    },
    [onComplete, onFail, reducedMotion],
  );

  /** Bucle principal del juego. */
  useEffect(() => {
    const area = areaRef.current;
    if (!area || !running) return;

    const measure = () => {
      const rect = area.getBoundingClientRect();
      sizeRef.current = { width: rect.width, height: rect.height };
      if (currentXRef.current === 0) {
        currentXRef.current = rect.width / 2;
        targetXRef.current = rect.width / 2;
      }
    };
    measure();
    window.addEventListener("resize", measure);

    let frame = 0;
    let last = performance.now();
    let elapsed = 0;
    let spawnTimer = 0;
    let heartsLeft = MAX_HEARTS;
    let collected = 0;

    const tick = (now: number) => {
      const dt = Math.min((now - last) / 1000, 0.05);
      last = now;
      elapsed += dt;

      const { width, height } = sizeRef.current;
      const playerW = Math.min(PLAYER_W, width * 0.24);
      const playerH = Math.min(PLAYER_H, height * 0.2);
      const playerY = height - playerH - 6;

      // movimiento del jugador
      const step = (keysRef.current.right ? 1 : 0) - (keysRef.current.left ? 1 : 0);
      if (step !== 0) targetXRef.current += step * 520 * dt;
      targetXRef.current = clamp(targetXRef.current, playerW / 2, width - playerW / 2);
      const smoothing = reducedMotion ? 1 : 0.22;
      currentXRef.current += (targetXRef.current - currentXRef.current) * smoothing;

      if (playerRef.current) {
        playerRef.current.style.width = `${playerW}px`;
        playerRef.current.style.transform = `translate3d(${currentXRef.current - playerW / 2}px, ${playerY}px, 0)`;
      }

      // aparición de objetos
      spawnTimer += dt;
      if (spawnTimer >= SPAWN_INTERVAL) {
        spawnTimer = 0;
        spawnItem();
      }

      // física y colisiones
      for (const item of itemsRef.current) {
        if (item.dead) continue;
        item.y += item.vy * dt;
        item.el.style.transform = `translate3d(${item.x}px, ${item.y}px, 0)`;

        const itemCenterX = item.x + item.size / 2;
        const itemCenterY = item.y + item.size / 2;
        const hitX = Math.abs(itemCenterX - currentXRef.current) < item.size / 2 + playerW * 0.34;
        const hitY = Math.abs(itemCenterY - (playerY + playerH / 2)) < item.size / 2 + playerH * 0.34;

        if (hitX && hitY) {
          item.dead = true;
          item.el.remove();
          const rect = area.getBoundingClientRect();
          if (item.kind === "ember") {
            collected += 1;
            setEmbers(collected);
            audio.play("gem");
            burstAt(
              rect.left + itemCenterX,
              rect.top + itemCenterY,
              [accent, "#fff6cf"],
              reducedMotion ? 6 : 12,
            );
            if (collected >= TARGET_EMBERS) {
              finish("win");
              return;
            }
          } else {
            heartsLeft -= 1;
            setHearts(heartsLeft);
            audio.play("pop");
            burstAt(rect.left + itemCenterX, rect.top + itemCenterY, ["#6b2a14", "#ffffff"], 10);
            gsap.fromTo(
              area,
              { x: -8 },
              { x: 0, duration: 0.4, ease: "elastic.out(1, 0.4)" },
            );
            if (heartsLeft <= 0) {
              finish("fail");
              return;
            }
          }
        } else if (item.y > height + 40) {
          item.dead = true;
          item.el.remove();
        }
      }

      itemsRef.current = itemsRef.current.filter((item) => !item.dead);

      const remaining = Math.max(0, ROUND_SECONDS - elapsed);
      setTimeLeft((previous) => (Math.abs(previous - remaining) > 0.25 ? remaining : previous));

      if (elapsed >= ROUND_SECONDS) {
        finish(collected >= TARGET_EMBERS ? "win" : "fail");
        return;
      }

      frame = requestAnimationFrame(tick);
    };

    frame = requestAnimationFrame(tick);

    return () => {
      cancelAnimationFrame(frame);
      window.removeEventListener("resize", measure);
      itemsRef.current.forEach((item) => item.el.remove());
      itemsRef.current = [];
    };
  }, [accent, finish, reducedMotion, running, spawnItem]);

  /** Cuenta regresiva y arranque. */
  useEffect(() => {
    const timer = window.setTimeout(() => setRunning(true), 900);
    return () => window.clearTimeout(timer);
  }, []);

  /** Puntero: la dragona sigue el mouse o el dedo. */
  useEffect(() => {
    const area = areaRef.current;
    if (!area) return;

    const onPointerMove = (event: PointerEvent) => {
      const rect = area.getBoundingClientRect();
      targetXRef.current = clamp(event.clientX - rect.left, 0, rect.width);
    };
    const onTouchMove = (event: TouchEvent) => {
      const touch = event.touches[0];
      if (!touch) return;
      const rect = area.getBoundingClientRect();
      targetXRef.current = clamp(touch.clientX - rect.left, 0, rect.width);
    };

    area.addEventListener("pointermove", onPointerMove, { passive: true });
    area.addEventListener("touchmove", onTouchMove, { passive: true });
    return () => {
      area.removeEventListener("pointermove", onPointerMove);
      area.removeEventListener("touchmove", onTouchMove);
    };
  }, []);

  /** Teclado: flechas izquierda/derecha. */
  const handleKey = (event: ReactKeyboardEvent<HTMLDivElement>, pressed: boolean) => {
    if (event.key === "ArrowLeft" || event.key === "a") {
      event.preventDefault();
      keysRef.current.left = pressed;
    } else if (event.key === "ArrowRight" || event.key === "d") {
      event.preventDefault();
      keysRef.current.right = pressed;
    }
  };

  const restart = () => {
    finishedRef.current = false;
    setEmbers(0);
    setHearts(MAX_HEARTS);
    setTimeLeft(ROUND_SECONDS);
    setOutcome("none");
    setStatus(birthday.games.dodge.instruction);
    itemsRef.current.forEach((item) => item.el.remove());
    itemsRef.current = [];
    setRunning(true);
  };

  return (
    <div className="h-full">
      <GameShell
        title={birthday.games.dodge.title}
        instruction={birthday.games.dodge.instruction}
        accent={accent}
        status={status}
        progressLabel={birthday.games.dodge.scoreLabel}
        progressValue={embers}
        progressMax={TARGET_EMBERS}
        canSkip={canSkip}
        onSkip={onSkip}
        onClose={onClose}
      >
        <div
          ref={areaRef}
          role="application"
          aria-label={birthday.games.dodge.title}
          tabIndex={0}
          onKeyDown={(event) => handleKey(event, true)}
          onKeyUp={(event) => handleKey(event, false)}
          className="relative h-full w-full cursor-crosshair touch-none overflow-hidden rounded-2xl border-4 border-white bg-gradient-to-b from-bark/90 via-ember/60 to-lime/30"
        >
          {/* cielo del volcán */}
          <div className="pointer-events-none absolute inset-0 opacity-70 [background:radial-gradient(circle_at_50%_120%,rgba(255,157,77,0.75),transparent_60%)]" />

          <div ref={playerRef} className="pointer-events-none absolute left-0 top-0 w-[72px] will-change-transform">
            <DragonSilhouette className="w-full drop-shadow-[0_6px_10px_rgba(0,0,0,0.35)]" />
          </div>

          <div className="pointer-events-none absolute left-3 top-3 flex items-center gap-2">
            <span className="sticker rounded-full bg-cream/90 px-3 py-1 font-display text-xs font-semibold">
              {birthday.games.dodge.timeLabel}: {Math.ceil(timeLeft)}s
            </span>
            <span className="sticker rounded-full bg-cream/90 px-3 py-1 font-display text-xs font-semibold">
              {"♥".repeat(Math.max(0, hearts))}
              <span className="opacity-30">{"♥".repeat(Math.max(0, MAX_HEARTS - hearts))}</span>
            </span>
          </div>

          {!running && outcome === "none" && (
            <div className="absolute inset-0 grid place-items-center bg-ink/25">
              <p className="sticker rounded-full bg-cream/95 px-5 py-2 font-display font-semibold">
                ¡Preparada… ya!
              </p>
            </div>
          )}

          {outcome !== "none" && (
            <div className="absolute inset-0 grid place-items-center gap-3 bg-ink/35 p-4 text-center">
              <div className="flex flex-col items-center gap-3">
                <p className="sticker rounded-2xl bg-cream/95 px-5 py-3 font-display font-semibold text-ink">
                  {outcome === "win" ? birthday.games.dodge.completeLabel : birthday.games.dodge.failLabel}
                </p>
                {outcome === "fail" && (
                  <button
                    type="button"
                    onClick={restart}
                    className="sticker rounded-full bg-eiwy px-5 py-2 font-display text-sm font-semibold transition-transform hover:-translate-y-0.5"
                  >
                    {birthday.buttons.retry}
                  </button>
                )}
              </div>
            </div>
          )}
        </div>
      </GameShell>
    </div>
  );
}
