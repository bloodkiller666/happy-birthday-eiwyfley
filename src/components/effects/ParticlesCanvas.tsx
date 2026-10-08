"use client";

import { useEffect, useRef } from "react";
import { gsap } from "@/lib/gsap";
import { resolveParticleBudget } from "@/lib/device";

interface ParticleFieldOptions {
  /** Cantidad de partículas; se ajusta sola según el dispositivo. */
  count: number;
  reducedMotion: boolean;
}

interface Particle {
  x: number;
  y: number;
  radius: number;
  speed: number;
  drift: number;
  phase: number;
  spin: number;
  color: string;
  alpha: number;
  kind: "petal" | "ember" | "sparkle";
}

const COLORS = ["#d8e02a", "#7cc43a", "#8ee8e8", "#ff9d4d", "#f05a63", "#71cfce", "#fdf0e8"];

/**
 * Capa de partículas ambientales (pétalos, brasas y chispas) en Canvas 2D.
 * Sólo anima en el navegador, se pausa si la pestaña no está visible y respeta
 * `prefers-reduced-motion` (se dibuja un fotograma estático).
 */
export function ParticlesCanvas({ count, reducedMotion }: ParticleFieldOptions) {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const context = canvas.getContext("2d");
    if (!context) return;

    let width = window.innerWidth;
    let height = window.innerHeight;
    let particles: Particle[] = [];
    let frame = 0;
    let running = true;

    const dpr = Math.min(window.devicePixelRatio || 1, 2);

    const createParticle = (fromBottom = false): Particle => {
      const kindRoll = Math.random();
      const kind: Particle["kind"] = kindRoll > 0.78 ? "sparkle" : kindRoll > 0.5 ? "ember" : "petal";
      return {
        x: Math.random() * width,
        y: fromBottom ? height + 20 : Math.random() * height,
        radius: kind === "sparkle" ? 2 + Math.random() * 2 : 3 + Math.random() * 5,
        speed: kind === "ember" ? 0.5 + Math.random() * 0.7 : 0.25 + Math.random() * 0.6,
        drift: (Math.random() - 0.5) * 0.5,
        phase: Math.random() * Math.PI * 2,
        spin: (Math.random() - 0.5) * 0.02,
        color: COLORS[Math.floor(Math.random() * COLORS.length)],
        alpha: kind === "sparkle" ? 0.55 + Math.random() * 0.4 : 0.35 + Math.random() * 0.45,
        kind,
      };
    };

    const resize = () => {
      width = window.innerWidth;
      height = window.innerHeight;
      canvas.width = Math.floor(width * dpr);
      canvas.height = Math.floor(height * dpr);
      canvas.style.width = `${width}px`;
      canvas.style.height = `${height}px`;
      context.setTransform(dpr, 0, 0, dpr, 0, 0);
      const budget = Math.min(count, resolveParticleBudget());
      particles = Array.from({ length: budget }, () => createParticle());
    };

    const drawParticle = (particle: Particle, time: number) => {
      const wobble = Math.sin(particle.phase + time * 0.001) * 14;
      context.save();
      context.globalAlpha = particle.alpha;
      context.translate(particle.x + wobble, particle.y);
      context.rotate(particle.spin * time * 0.05);
      context.fillStyle = particle.color;

      if (particle.kind === "petal") {
        context.beginPath();
        context.ellipse(0, 0, particle.radius, particle.radius * 0.55, 0.6, 0, Math.PI * 2);
        context.fill();
      } else if (particle.kind === "ember") {
        context.beginPath();
        context.arc(0, 0, particle.radius * 0.6, 0, Math.PI * 2);
        context.fill();
        context.globalAlpha = particle.alpha * 0.25;
        context.beginPath();
        context.arc(0, 0, particle.radius * 1.8, 0, Math.PI * 2);
        context.fill();
      } else {
        context.strokeStyle = particle.color;
        context.lineWidth = 1.4;
        const size = particle.radius * 2.2;
        context.beginPath();
        context.moveTo(-size, 0);
        context.lineTo(size, 0);
        context.moveTo(0, -size);
        context.lineTo(0, size);
        context.stroke();
      }
      context.restore();
    };

    const render = (time: number) => {
      context.clearRect(0, 0, width, height);
      for (const particle of particles) {
        drawParticle(particle, time);
        if (reducedMotion) continue;
        particle.y -= particle.speed;
        particle.x += particle.drift + Math.sin((time * 0.0004 + particle.phase) * 1.2) * 0.25;
        if (particle.y < -30) Object.assign(particle, createParticle(true));
        if (particle.x < -40) particle.x = width + 20;
        if (particle.x > width + 40) particle.x = -20;
      }
    };

    const loop = (time: number) => {
      if (!running) return;
      render(time);
      frame = requestAnimationFrame(loop);
    };

    const onVisibility = () => {
      if (document.hidden) {
        running = false;
        cancelAnimationFrame(frame);
      } else if (!running) {
        running = true;
        frame = requestAnimationFrame(loop);
      }
    };

    resize();
    window.addEventListener("resize", resize);
    document.addEventListener("visibilitychange", onVisibility);

    if (reducedMotion) {
      render(0);
    } else {
      frame = requestAnimationFrame(loop);
    }

    return () => {
      running = false;
      cancelAnimationFrame(frame);
      window.removeEventListener("resize", resize);
      document.removeEventListener("visibilitychange", onVisibility);
    };
  }, [count, reducedMotion]);

  return (
    <canvas
      ref={canvasRef}
      aria-hidden="true"
      className="pointer-events-none fixed inset-0 z-20 h-full w-full opacity-80"
    />
  );
}

/** Utilidad para ráfagas de partículas puntuales (clics, gemas, explosiones). */
export function burstAt(x: number, y: number, colors: string[] = COLORS, amount = 18): void {
  if (typeof document === "undefined") return;
  for (let index = 0; index < amount; index += 1) {
    const dot = document.createElement("span");
    const size = 4 + Math.random() * 8;
    dot.style.position = "fixed";
    dot.style.left = `${x}px`;
    dot.style.top = `${y}px`;
    dot.style.width = `${size}px`;
    dot.style.height = `${size}px`;
    dot.style.borderRadius = Math.random() > 0.5 ? "50%" : "40% 60% 45% 55%";
    dot.style.background = colors[Math.floor(Math.random() * colors.length)];
    dot.style.pointerEvents = "none";
    dot.style.zIndex = "45";
    dot.style.willChange = "transform, opacity";
    document.body.appendChild(dot);

    const angle = Math.random() * Math.PI * 2;
    const distance = 40 + Math.random() * 90;
    gsap.to(dot, {
      x: Math.cos(angle) * distance,
      y: Math.sin(angle) * distance - 40,
      scale: 0,
      opacity: 0,
      duration: 0.9 + Math.random() * 0.6,
      ease: "power2.out",
      onComplete: () => dot.remove(),
    });
  }
}
