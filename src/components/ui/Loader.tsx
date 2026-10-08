"use client";

import { useEffect, useRef, useState, type CSSProperties } from "react";
import { gsap, useGSAP, EASE } from "@/lib/gsap";
import { birthday } from "@/config/birthday";
import { useAdventureStore } from "@/store/useAdventureStore";
import { useAudio } from "@/hooks/useAudio";
import { cn } from "@/lib/utils";

interface LoaderProps {
  /** Se llama cuando la cortina termina de cerrarse (ya se ve el prólogo). */
  onFinished: () => void;
}

const MIN_LOADING_MS = 1100;

/**
 * Pantalla de carga. El botón "Comenzar aventura" es la primera interacción
 * del usuario: a partir de ahí se habilita el audio (nunca antes).
 */
export function Loader({ onFinished }: LoaderProps) {
  const rootRef = useRef<HTMLDivElement | null>(null);
  const [progress, setProgress] = useState(0);
  const [ready, setReady] = useState(false);
  const [leaving, setLeaving] = useState(false);
  const startPrologue = useAdventureStore((state) => state.startPrologue);
  const { play } = useAudio();

  useEffect(() => {
    let cancelled = false;
    const startedAt = performance.now();

    const finishWhenReady = async () => {
      try {
        await document.fonts?.ready;
      } catch {
        // Si no hay Font Loading API seguimos igual.
      }
      const elapsed = performance.now() - startedAt;
      const remaining = Math.max(0, MIN_LOADING_MS - elapsed);
      window.setTimeout(() => {
        if (!cancelled) setReady(true);
      }, remaining);
    };

    void finishWhenReady();
    return () => {
      cancelled = true;
    };
  }, []);

  // Barra de progreso decorativa hasta que todo esté listo.
  useGSAP(
    () => {
      const tween = gsap.to(
        {},
        {
          duration: 1.1,
          ease: "power1.inOut",
          onUpdate: () => setProgress(Math.round(tween.progress() * 100)),
        },
      );
      return () => tween.kill();
    },
    { scope: rootRef },
  );

  useGSAP(
    () => {
      // Estado inicial explícito + tween "to": así el montaje doble de React
      // (StrictMode) nunca deja elementos colgados en su estado de entrada.
      const targets = [".loader-eyebrow", ".loader-title", ".loader-subtitle", ".loader-bottom"];
      gsap.set(targets, { autoAlpha: 0, y: 24 });
      const timeline = gsap.timeline({ defaults: { ease: EASE.soft } });
      timeline
        .to(".loader-eyebrow", { y: 6, autoAlpha: 1, duration: 0.6 })
        .to(".loader-title", { y: 0, autoAlpha: 1, duration: 0.8 }, "-=0.35")
        .to(".loader-subtitle", { y: 0, autoAlpha: 1, duration: 0.7 }, "-=0.5")
        .to(".loader-bottom", { y: 0, autoAlpha: 1, duration: 0.7 }, "-=0.45");
      return () => timeline.kill();
    },
    { scope: rootRef },
  );

  useGSAP(
    () => {
      if (!ready) return;
      gsap.fromTo(
        ".loader-cta",
        { scale: 0.85, autoAlpha: 0 },
        { scale: 1, autoAlpha: 1, duration: 0.5, ease: EASE.pop },
      );
    },
    { dependencies: [ready], scope: rootRef },
  );

  const handleStart = () => {
    if (leaving) return;
    setLeaving(true);
    play("click");
    // Primero mostramos el prólogo debajo para que la máscara lo revele.
    startPrologue();

    const root = rootRef.current;
    const target = document.querySelector<HTMLElement>("[data-egg-anchor]");
    const rect = target?.getBoundingClientRect();
    const originX = rect ? ((rect.left + rect.width / 2) / window.innerWidth) * 100 : 50;
    const originY = rect ? ((rect.top + rect.height / 2) / window.innerHeight) * 100 : 50;

    gsap.to(root, {
      duration: 1,
      ease: EASE.soft,
      clipPath: `circle(0% at ${originX}% ${originY}%)`,
      onComplete: onFinished,
    });
  };

  return (
    <div
      ref={rootRef}
      role="dialog"
      aria-modal="true"
      aria-labelledby="loader-title"
      className={cn(
        "fixed inset-0 z-[70] flex flex-col items-center justify-center gap-8 px-6 text-center",
        "sky-gradient",
      )}
      style={
        {
          "--sky-top": "var(--eiwy-deep)",
          "--sky-bottom": "var(--eiwy-aqua)",
        } as CSSProperties
      }
    >
      <div className="pointer-events-none absolute inset-0 opacity-40 [background:radial-gradient(circle_at_50%_35%,rgba(255,255,255,0.75),transparent_60%)]" />

      <div className="relative flex max-w-2xl flex-col items-center gap-4">
        <p className="loader-eyebrow eyebrow text-ink/80">Una aventura interactiva</p>
        <h1 id="loader-title" className="loader-title ink-outline text-4xl leading-tight text-white sm:text-6xl">
          {birthday.title}
        </h1>
        <p className="loader-subtitle text-lg font-semibold text-ink/80">{birthday.subtitle}</p>
      </div>

      <div className="loader-bottom flex w-full max-w-md flex-col items-center gap-4">
        <div
          role="progressbar"
          aria-valuemin={0}
          aria-valuemax={100}
          aria-valuenow={progress}
          aria-label={birthday.loader.loading}
          className="h-3 w-full overflow-hidden rounded-full border-2 border-white/80 bg-white/40"
        >
          <div
            className="h-full rounded-full bg-eiwy transition-[width] duration-150"
            style={{ width: `${progress}%` }}
          />
        </div>
        <p aria-live="polite" className="text-sm font-semibold text-ink/75">
          {ready ? `${birthday.loader.readyLabel} · ${birthday.loader.hint}` : birthday.loader.loading}
        </p>
        <button
          type="button"
          onClick={handleStart}
          disabled={!ready}
          className={cn(
            "loader-cta sticker rounded-full bg-eiwy px-8 py-4 font-display text-lg font-semibold text-ink",
            "transition-transform duration-200 hover:-translate-y-1 hover:bg-aqua active:translate-y-0",
            "disabled:cursor-not-allowed disabled:opacity-0",
          )}
        >
          {birthday.loader.start}
        </button>
      </div>
    </div>
  );
}
