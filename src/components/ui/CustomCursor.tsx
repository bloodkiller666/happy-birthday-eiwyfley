"use client";

import { useEffect, useRef } from "react";
import { gsap } from "@/lib/gsap";
import { prefersFinePointer } from "@/lib/device";

/**
 * Cursor personalizado: una llamita turquesa que sigue al mouse con inercia.
 * Sólo se activa en dispositivos con puntero fino (mouse/trackpad) y se
 * desactiva por completo con `prefers-reduced-motion`.
 */
export function CustomCursor() {
  const flameRef = useRef<HTMLDivElement | null>(null);
  const dotRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    if (!prefersFinePointer()) return;
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;

    const flame = flameRef.current;
    const dot = dotRef.current;
    if (!flame || !dot) return;

    document.documentElement.classList.add("custom-cursor-active");
    gsap.set([flame, dot], { xPercent: -50, yPercent: -50, autoAlpha: 0 });

    const flameX = gsap.quickTo(flame, "x", { duration: 0.55, ease: "power3.out" });
    const flameY = gsap.quickTo(flame, "y", { duration: 0.55, ease: "power3.out" });
    const dotX = gsap.quickTo(dot, "x", { duration: 0.12, ease: "power2.out" });
    const dotY = gsap.quickTo(dot, "y", { duration: 0.12, ease: "power2.out" });

    let visible = false;

    const onMove = (event: PointerEvent) => {
      if (!visible) {
        visible = true;
        gsap.to([flame, dot], { autoAlpha: 1, duration: 0.3 });
      }
      flameX(event.clientX);
      flameY(event.clientY);
      dotX(event.clientX);
      dotY(event.clientY);
    };

    const onLeave = () => {
      visible = false;
      gsap.to([flame, dot], { autoAlpha: 0, duration: 0.25 });
    };

    const onDown = () => gsap.to(flame, { scale: 0.7, duration: 0.15 });
    const onUp = () => gsap.to(flame, { scale: 1, duration: 0.25 });

    const onOver = (event: PointerEvent) => {
      const target = event.target as HTMLElement | null;
      const interactive = target?.closest("button, a, [role='button'], input, [data-cursor-grow]");
      gsap.to(flame, { scale: interactive ? 1.6 : 1, duration: 0.3, overwrite: "auto" });
    };

    window.addEventListener("pointermove", onMove, { passive: true });
    window.addEventListener("pointerdown", onDown);
    window.addEventListener("pointerup", onUp);
    window.addEventListener("pointerover", onOver, { passive: true });
    document.addEventListener("pointerleave", onLeave);

    return () => {
      document.documentElement.classList.remove("custom-cursor-active");
      window.removeEventListener("pointermove", onMove);
      window.removeEventListener("pointerdown", onDown);
      window.removeEventListener("pointerup", onUp);
      window.removeEventListener("pointerover", onOver);
      document.removeEventListener("pointerleave", onLeave);
    };
  }, []);

  return (
    <div aria-hidden="true" className="pointer-events-none fixed inset-0 z-[65] hidden md:block">
      <div ref={flameRef} className="absolute left-0 top-0 h-10 w-10">
        <svg viewBox="0 0 40 40" className="h-full w-full drop-shadow-[0_2px_6px_rgba(39,201,238,0.6)]">
          <path
            d="M20 3c5 6 9 9 9 15.5A9 9 0 0 1 20 28a9 9 0 0 1-9-9.5c0-3 1.6-5.2 3.4-7.3C16.3 9 18.2 6.4 20 3Z"
            fill="#71cfce"
            stroke="#fff"
            strokeWidth="2"
            strokeLinejoin="round"
          />
          <path d="M20 12c2.4 3 4 4.6 4 7a4 4 0 0 1-8 0c0-2.4 1.6-4 4-7Z" fill="#ff9d4d" opacity="0.9" />
        </svg>
      </div>
      <div ref={dotRef} className="absolute left-0 top-0 h-1.5 w-1.5 rounded-full bg-ink/70" />
    </div>
  );
}
