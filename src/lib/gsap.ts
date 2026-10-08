"use client";

/**
 * Registro único de plugins GSAP.
 *
 * Importá SIEMPRE gsap y los plugins desde este módulo (`@/lib/gsap`), nunca
 * desde "gsap" directamente: así garantizamos que los plugins se registren una
 * sola vez y que el `useGSAP` de @gsap/react sepa limpiar las animaciones.
 */
import { gsap } from "gsap";
import { useGSAP } from "@gsap/react";
import { ScrollTrigger } from "gsap/ScrollTrigger";
import { SplitText } from "gsap/SplitText";
import { Flip } from "gsap/Flip";
import { MotionPathPlugin } from "gsap/MotionPathPlugin";
import { Draggable } from "gsap/Draggable";
import { CustomEase } from "gsap/CustomEase";

let registered = false;

/** Nombres de las eases personalizadas disponibles en el proyecto. */
export const EASE = {
  soft: "eiwySoft",
  pop: "eiwyPop",
  drift: "eiwyDrift",
} as const;

export function registerGsap(): void {
  // Guard para SSR: GSAP sólo puede registrarse en el navegador.
  if (registered || typeof window === "undefined") return;

  gsap.registerPlugin(useGSAP, ScrollTrigger, SplitText, Flip, MotionPathPlugin, Draggable, CustomEase);

  CustomEase.create(EASE.soft, "M0,0 C0.22,0.61 0.36,1 1,1");
  CustomEase.create(EASE.pop, "M0,0 C0.34,1.56 0.64,1 1,1");
  CustomEase.create(EASE.drift, "M0,0 C0.4,0 0.2,1 1,1");

  // Evita el warning de "Invalid property" al animar scroll-behavior con Lenis.
  ScrollTrigger.config({ ignoreMobileResize: true });

  registered = true;
}

registerGsap();

export { gsap, useGSAP, ScrollTrigger, SplitText, Flip, MotionPathPlugin, Draggable, CustomEase };
