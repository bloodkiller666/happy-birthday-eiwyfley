"use client";

import { useCallback, useEffect, useRef, useState, type KeyboardEvent as ReactKeyboardEvent } from "react";
import { birthday } from "@/config/birthday";
import { audio } from "@/lib/audio";
import { burstAt } from "@/components/effects/ParticlesCanvas";
import { DragonSilhouette } from "@/components/art/DragonAvatar";
import { clamp } from "@/lib/utils";
import { GameModalShell } from "./GameModalShell";
import type { GameProps } from "./types";

const TARGET_EMBERS = 5;
const MAX_HEARTS = 3;
const ROUND_SECONDS = 25;
const PLAYER_W = 64;
const PLAYER_H = 48;
const SPAWN_INTERVAL = 0.65;

interface GameItem {
  id: number;
  x: number;
  y: number;
  vy: number;
  size: number;
  kind: "rock" | "ember";
  dead: boolean;
  rotation: number;
  vRot: number;
}

/**
 * Volcán — "Aliento de Fuego".
 * Mueve a la dragona con mouse, táctil o flechas del teclado.
 * Esquiva rocas volcánicas y junta 5 brasas ardientes.
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
  const containerRef = useRef<HTMLDivElement | null>(null);
  const playerRef = useRef<HTMLDivElement | null>(null);
  const itemsRef = useRef<GameItem[]>([]);
  const targetXRef = useRef<number | null>(null);
  const currentXRef = useRef<number | null>(null);
  const keysRef = useRef({ left: false, right: false });
  const sizeRef = useRef({ width: 0, height: 0 });
  const finishedRef = useRef(false);
  const nextItemIdRef = useRef(0);

  const [embers, setEmbers] = useState(0);
  const [hearts, setHearts] = useState(MAX_HEARTS);
  const [timeLeft, setTimeLeft] = useState(ROUND_SECONDS);
  const [running, setRunning] = useState(false);
  const [status, setStatus] = useState("Mové a la dragona para juntar 5 brasas");
  const [outcome, setOutcome] = useState<"none" | "win" | "fail">("none");
  const [renderItems, setRenderItems] = useState<GameItem[]>([]);

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

  // ResizeObserver para garantizar dimensiones antes de empezar el loop
  useEffect(() => {
    const container = containerRef.current;
    if (!container) return;

    const observer = new ResizeObserver((entries) => {
      for (const entry of entries) {
        const { width, height } = entry.contentRect;
        if (width > 0 && height > 0) {
          sizeRef.current = { width, height };
          if (currentXRef.current === null) {
            currentXRef.current = width / 2;
            targetXRef.current = width / 2;
          }
          if (!running && outcome === "none" && !finishedRef.current) {
            setRunning(true);
          }
        }
      }
    });

    observer.observe(container);
    return () => observer.disconnect();
  }, [outcome, running]);

  // Loop principal del juego con físicas y colisiones
  useEffect(() => {
    if (!running) return;

    let frameId = 0;
    let lastTime = performance.now();
    let elapsed = 0;
    let spawnTimer = 0;
    let currentHearts = hearts;
    let currentEmbers = embers;

    const tick = (now: number) => {
      const dt = Math.min((now - lastTime) / 1000, 0.05);
      lastTime = now;
      elapsed += dt;

      const { width, height } = sizeRef.current;
      if (width <= 0 || height <= 0) {
        frameId = requestAnimationFrame(tick);
        return;
      }

      // Temporizador
      const remainingTime = Math.max(0, ROUND_SECONDS - elapsed);
      setTimeLeft(remainingTime);

      // Movimiento con teclado
      const moveSpeed = width * 1.1 * dt;
      if (keysRef.current.left) {
        targetXRef.current = Math.max(PLAYER_W / 2, (targetXRef.current ?? width / 2) - moveSpeed);
      }
      if (keysRef.current.right) {
        targetXRef.current = Math.min(width - PLAYER_W / 2, (targetXRef.current ?? width / 2) + moveSpeed);
      }

      // Suavizado del movimiento de la dragona
      if (targetXRef.current !== null) {
        const current = currentXRef.current ?? targetXRef.current;
        const diff = targetXRef.current - current;
        currentXRef.current = current + diff * (reducedMotion ? 1 : Math.min(1, dt * 14));
      }

      // Actualizar posición DOM del jugador
      const px = clamp(currentXRef.current ?? width / 2, PLAYER_W / 2, width - PLAYER_W / 2);
      const py = height - PLAYER_H - 12;

      if (playerRef.current) {
        playerRef.current.style.transform = `translate3d(${px - PLAYER_W / 2}px, ${py}px, 0)`;
      }

      // Spawn de rocas y brasas
      spawnTimer += dt;
      if (spawnTimer >= SPAWN_INTERVAL) {
        spawnTimer = 0;
        const isEmber = Math.random() < 0.45;
        const size = isEmber ? 26 : 34 + Math.random() * 14;
        const item: GameItem = {
          id: nextItemIdRef.current++,
          x: 16 + Math.random() * Math.max(1, width - size - 32),
          y: -size - 10,
          vy: (isEmber ? 170 : 210) + Math.random() * 80,
          size,
          kind: isEmber ? "ember" : "rock",
          dead: false,
          rotation: Math.random() * 360,
          vRot: (Math.random() - 0.5) * 120,
        };
        itemsRef.current.push(item);
      }

      // Actualizar y comprobar colisiones
      const playerBox = {
        left: px - PLAYER_W * 0.4,
        right: px + PLAYER_W * 0.4,
        top: py + 4,
        bottom: py + PLAYER_H - 4,
      };

      const updatedItems: GameItem[] = [];

      for (const item of itemsRef.current) {
        if (item.dead) continue;

        item.y += item.vy * dt;
        item.rotation += item.vRot * dt;

        // Comprobar colisión con la dragona
        const itemBox = {
          left: item.x,
          right: item.x + item.size,
          top: item.y,
          bottom: item.y + item.size,
        };

        const collided =
          itemBox.right >= playerBox.left &&
          itemBox.left <= playerBox.right &&
          itemBox.bottom >= playerBox.top &&
          itemBox.top <= playerBox.bottom;

        if (collided) {
          item.dead = true;
          if (item.kind === "ember") {
            currentEmbers += 1;
            setEmbers(currentEmbers);
            audio.play("gem");
            setStatus(`¡Brasa recogida! (${currentEmbers}/${TARGET_EMBERS})`);

            if (containerRef.current) {
              const rect = containerRef.current.getBoundingClientRect();
              burstAt(
                rect.left + item.x + item.size / 2,
                rect.top + item.y + item.size / 2,
                ["#fff6cf", "#ff9d4d", accent],
                reducedMotion ? 4 : 10,
              );
            }

            if (currentEmbers >= TARGET_EMBERS) {
              finish("win");
              return;
            }
          } else {
            currentHearts -= 1;
            setHearts(currentHearts);
            audio.play("pop");
            setStatus(currentHearts > 0 ? `¡Cuidado con las rocas! ♥ ${currentHearts} restantes` : "¡Sin corazones!");

            if (containerRef.current) {
              const rect = containerRef.current.getBoundingClientRect();
              burstAt(
                rect.left + item.x + item.size / 2,
                rect.top + item.y + item.size / 2,
                ["#6b2a14", "#ff5a63"],
                reducedMotion ? 4 : 10,
              );
            }

            if (currentHearts <= 0) {
              finish("fail");
              return;
            }
          }
          continue;
        }

        // Si sobrepasa la parte inferior, descartar
        if (item.y > height + 20) {
          item.dead = true;
          continue;
        }

        updatedItems.push(item);
      }

      itemsRef.current = updatedItems;
      setRenderItems([...updatedItems]);

      frameId = requestAnimationFrame(tick);
    };

    frameId = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(frameId);
  }, [accent, finish, hearts, embers, reducedMotion, running]);

  // Controladores de puntero para mover a la dragona
  useEffect(() => {
    const container = containerRef.current;
    if (!container) return;

    const onPointerMove = (e: PointerEvent) => {
      const rect = container.getBoundingClientRect();
      if (rect.width > 0) {
        targetXRef.current = clamp(e.clientX - rect.left, PLAYER_W / 2, rect.width - PLAYER_W / 2);
      }
    };

    const onTouchMove = (e: TouchEvent) => {
      const touch = e.touches[0];
      if (!touch) return;
      const rect = container.getBoundingClientRect();
      if (rect.width > 0) {
        targetXRef.current = clamp(touch.clientX - rect.left, PLAYER_W / 2, rect.width - PLAYER_W / 2);
      }
    };

    container.addEventListener("pointermove", onPointerMove, { passive: true });
    container.addEventListener("touchmove", onTouchMove, { passive: true });

    return () => {
      container.removeEventListener("pointermove", onPointerMove);
      container.removeEventListener("touchmove", onTouchMove);
    };
  }, []);

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
    setStatus("Mové a la dragona para juntar 5 brasas");
    itemsRef.current = [];
    setRenderItems([]);
    setRunning(true);
  };

  return (
    <GameModalShell
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
        ref={containerRef}
        role="application"
        aria-label={birthday.games.dodge.title}
        tabIndex={0}
        onKeyDown={(e) => handleKey(e, true)}
        onKeyUp={(e) => handleKey(e, false)}
        className="relative h-full w-full select-none touch-none overflow-hidden rounded-2xl border-4 border-white bg-gradient-to-b from-bark/90 via-ember/60 to-lime/30"
      >
        {/* Fondo resplandeciente */}
        <div className="pointer-events-none absolute inset-0 opacity-70 [background:radial-gradient(circle_at_50%_120%,rgba(255,157,77,0.75),transparent_60%)]" />

        {/* Indicadores en esquina: vidas y tiempo */}
        <div className="pointer-events-none absolute left-3 top-3 z-10 flex items-center gap-2">
          <span className="sticker rounded-full bg-cream/90 px-2.5 py-0.5 font-display text-xs font-semibold shadow-sm">
            {"♥".repeat(Math.max(0, hearts))}
            <span className="opacity-25">{"♥".repeat(Math.max(0, MAX_HEARTS - hearts))}</span>
          </span>
          <span className="sticker rounded-full bg-cream/90 px-2.5 py-0.5 font-display text-xs font-semibold shadow-sm">
            ⏳ {Math.ceil(timeLeft)}s
          </span>
        </div>

        {/* Elementos que caen (rocas y brasas) */}
        {renderItems.map((item) => (
          <div
            key={item.id}
            className="pointer-events-none absolute will-change-transform"
            style={{
              width: `${item.size}px`,
              height: `${item.size}px`,
              transform: `translate3d(${item.x}px, ${item.y}px, 0) rotate(${item.rotation}deg)`,
              borderRadius: item.kind === "ember" ? "50%" : item.size > 42 ? "45% 55% 40% 60%" : "50%",
              background:
                item.kind === "ember"
                  ? `radial-gradient(circle at 35% 35%, #ffffff, #fff6cf 40%, ${accent} 85%)`
                  : "#5a2210",
              boxShadow:
                item.kind === "ember"
                  ? `0 0 16px ${accent}, 0 0 6px #fff`
                  : "inset -4px -4px 0 rgba(0,0,0,0.35)",
              border: item.kind === "ember" ? "2px solid #ffffff" : "2.5px solid #ffffff",
            }}
          />
        ))}

        {/* Dragona del jugador */}
        <div
          ref={playerRef}
          className="pointer-events-none absolute left-0 top-0 will-change-transform"
          style={{ width: `${PLAYER_W}px`, height: `${PLAYER_H}px` }}
        >
          <DragonSilhouette className="w-full h-full drop-shadow-[0_6px_10px_rgba(0,0,0,0.4)]" />
        </div>

        {/* Overlay de fin de partida o reintento */}
        {outcome !== "none" && (
          <div className="absolute inset-0 z-20 grid place-items-center gap-3 bg-ink/40 p-4 text-center backdrop-blur-[2px]">
            <div className="flex flex-col items-center gap-3">
              <p className="sticker rounded-2xl bg-cream/95 px-5 py-3 font-display font-semibold text-ink shadow-lg">
                {outcome === "win" ? birthday.games.dodge.completeLabel : birthday.games.dodge.failLabel}
              </p>
              {outcome === "fail" && (
                <button
                  type="button"
                  onClick={restart}
                  className="sticker rounded-full bg-eiwy px-6 py-2.5 font-display text-sm font-semibold transition-transform hover:-translate-y-0.5 active:translate-y-0 cursor-pointer shadow-md"
                >
                  {birthday.buttons.retry}
                </button>
              )}
            </div>
          </div>
        )}
      </div>
    </GameModalShell>
  );
}
