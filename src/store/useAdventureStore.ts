"use client";

import { create } from "zustand";
import type { GemId } from "@/config/birthday";

/** Estados globales de la travesía. */
export type Phase = "loading" | "prologue" | "adventure";
export type ChapterId = "flight" | "map" | "cave" | "celebration";

/** Orden de las estaciones del mapa = orden de las gemas. */
export const STATION_ORDER: readonly GemId[] = ["flowers", "volcano", "crystals", "city"] as const;

export const TOTAL_GEMS = STATION_ORDER.length;
export const TOTAL_CHESTS = STATION_ORDER.length;

const emptyRecord = (): Record<GemId, boolean> => ({
  flowers: false,
  volcano: false,
  crystals: false,
  city: false,
});

const emptyAttempts = (): Record<GemId, number> => ({
  flowers: 0,
  volcano: 0,
  crystals: 0,
  city: 0,
});

interface AdventureState {
  /** Fase del recorrido: cargando → prólogo (huevo) → aventura (scroll). */
  phase: Phase;
  /** Capítulo visible actualmente (lo actualiza el HUD con ScrollTrigger). */
  chapter: ChapterId;
  /** Gemas conseguidas. */
  gems: Record<GemId, boolean>;
  /** Intentos por estación; el botón "Saltar reto" aparece a partir del 2.º. */
  attempts: Record<GemId, number>;
  soundEnabled: boolean;
  /** El audio sólo puede arrancar tras una interacción real del usuario. */
  audioUnlocked: boolean;
  /** Claves de bloqueo del scroll (varias fuentes pueden pedirlo a la vez). */
  scrollLocks: string[];
  candlesLit: boolean;
  chestsOpened: number;
  celebrationRevealed: boolean;
  /** Sube en cada "Volver a volar": vuelve a montar los capítulos desde cero. */
  runId: number;

  startPrologue: () => void;
  beginAdventure: () => void;
  setChapter: (chapter: ChapterId) => void;
  completeStation: (id: GemId) => void;
  registerAttempt: (id: GemId) => void;
  lockScroll: (key: string) => void;
  unlockScroll: (key: string) => void;
  toggleSound: () => void;
  lightCandles: () => void;
  openChest: () => void;
  revealCelebration: () => void;
  replayFinal: () => void;
  replayAdventure: () => void;
}

export const useAdventureStore = create<AdventureState>()((set, get) => ({
  phase: "loading",
  chapter: "flight",
  gems: emptyRecord(),
  attempts: emptyAttempts(),
  soundEnabled: true,
  audioUnlocked: false,
  scrollLocks: [],
  candlesLit: false,
  chestsOpened: 0,
  celebrationRevealed: false,
  runId: 0,

  startPrologue: () => set({ phase: "prologue", audioUnlocked: true }),

  beginAdventure: () => set({ phase: "adventure", chapter: "flight" }),

  setChapter: (chapter) => {
    if (get().chapter !== chapter) set({ chapter });
  },

  completeStation: (id) =>
    set((state) => (state.gems[id] ? state : { gems: { ...state.gems, [id]: true } })),

  registerAttempt: (id) =>
    set((state) => ({ attempts: { ...state.attempts, [id]: state.attempts[id] + 1 } })),

  lockScroll: (key) =>
    set((state) =>
      state.scrollLocks.includes(key) ? state : { scrollLocks: [...state.scrollLocks, key] },
    ),

  unlockScroll: (key) =>
    set((state) =>
      state.scrollLocks.includes(key)
        ? { scrollLocks: state.scrollLocks.filter((item) => item !== key) }
        : state,
    ),

  toggleSound: () => set((state) => ({ soundEnabled: !state.soundEnabled })),

  lightCandles: () => set({ candlesLit: true }),

  openChest: () =>
    set((state) => ({ chestsOpened: Math.min(state.chestsOpened + 1, TOTAL_CHESTS) })),

  revealCelebration: () => set({ celebrationRevealed: true }),

  replayFinal: () => set({ candlesLit: false, celebrationRevealed: false }),

  replayAdventure: () =>
    set((state) => ({
      runId: state.runId + 1,
      phase: "adventure",
      chapter: "flight",
      gems: emptyRecord(),
      attempts: emptyAttempts(),
      chestsOpened: 0,
      candlesLit: false,
      celebrationRevealed: false,
      scrollLocks: [],
    })),
}));

/** Cantidad de gemas conseguidas (0–4). */
export const selectGemCount = (state: AdventureState): number =>
  STATION_ORDER.reduce((total, id) => total + (state.gems[id] ? 1 : 0), 0);
