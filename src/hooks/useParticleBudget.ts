"use client";

import { useSyncExternalStore } from "react";
import { resolveParticleBudget } from "@/lib/device";

function subscribe(onChange: () => void): () => void {
  window.addEventListener("resize", onChange);
  return () => window.removeEventListener("resize", onChange);
}

/** Cantidad de partículas adecuada al dispositivo actual (0 en el servidor). */
export function useParticleBudget(): number {
  return useSyncExternalStore(subscribe, resolveParticleBudget, () => 0);
}
