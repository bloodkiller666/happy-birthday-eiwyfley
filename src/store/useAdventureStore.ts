"use client";

import { create } from "zustand";
import type { GemId } from "@/config/birthday";

/** Estados globales de la travesía. */
export type Phase = "loading" | "prologue" | "adventure";

/** Orden de capítulos para el bloqueo secuencial. */
export const CHAPTER_ORDER = [
  "prologue",
  "flight",
  "map",
  "cave",
  "celebration",
] as const;

export type ChapterId = (typeof CHAPTER_ORDER)[number];

/** Orden de las estaciones del mapa = orden de las gemas. */
export const STATION_ORDER: readonly GemId[] = [
  "flowers",
  "volcano",
  "crystals",
  "city",
] as const;

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
  /**
   * Capítulo más avanzado al que el usuario tiene acceso.
   * Usamos el índice en CHAPTER_ORDER para comparar.
   */
  unlockedChapter: ChapterId;
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
  /** Estación actual del mapa (0-3). Solo la actual es jugable. */
  currentStation: number;

  startPrologue: () => void;
  beginAdventure: () => void;
  setChapter: (chapter: ChapterId) => void;
  completeChapter: (id: ChapterId) => void;
  completeStation: (id: GemId) => void;
  advanceStation: () => void;
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

function chapterIndex(id: ChapterId): number {
  return CHAPTER_ORDER.indexOf(id);
}

export const useAdventureStore = create<AdventureState>()((set, get) => ({
  phase: "loading",
  chapter: "flight",
  unlockedChapter: "flight",
  gems: emptyRecord(),
  attempts: emptyAttempts(),
  soundEnabled: true,
  audioUnlocked: false,
  scrollLocks: [],
  candlesLit: false,
  chestsOpened: 0,
  celebrationRevealed: false,
  runId: 0,
  currentStation: 0,

  startPrologue: () => set({ phase: "prologue", audioUnlocked: true }),

  beginAdventure: () =>
    set({ phase: "adventure", chapter: "flight", unlockedChapter: "flight" }),

  setChapter: (chapter) => {
    if (get().chapter !== chapter) set({ chapter });
  },

  completeChapter: (id) => {
    const state = get();
    const currentIdx = chapterIndex(state.unlockedChapter);
    const completedIdx = chapterIndex(id);
    // Only advance if completing the current unlocked chapter
    if (completedIdx === currentIdx) {
      const nextIdx = completedIdx + 1;
      if (nextIdx < CHAPTER_ORDER.length) {
        set({ unlockedChapter: CHAPTER_ORDER[nextIdx] });
      }
    }
  },

  completeStation: (id) =>
    set((state) =>
      state.gems[id] ? state : { gems: { ...state.gems, [id]: true } },
    ),

  advanceStation: () =>
    set((state) => ({
      currentStation: Math.min(
        state.currentStation + 1,
        STATION_ORDER.length - 1,
      ),
    })),

  registerAttempt: (id) =>
    set((state) => ({
      attempts: { ...state.attempts, [id]: state.attempts[id] + 1 },
    })),

  lockScroll: (key) =>
    set((state) =>
      state.scrollLocks.includes(key)
        ? state
        : { scrollLocks: [...state.scrollLocks, key] },
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
    set((state) => ({
      chestsOpened: Math.min(state.chestsOpened + 1, TOTAL_CHESTS),
    })),

  revealCelebration: () => set({ celebrationRevealed: true }),

  replayFinal: () => set({ candlesLit: false, celebrationRevealed: false }),

  replayAdventure: () =>
    set((state) => ({
      runId: state.runId + 1,
      phase: "adventure",
      chapter: "flight",
      unlockedChapter: "flight",
      gems: emptyRecord(),
      attempts: emptyAttempts(),
      chestsOpened: 0,
      candlesLit: false,
      celebrationRevealed: false,
      scrollLocks: [],
      currentStation: 0,
    })),
}));

/** Cantidad de gemas conseguidas (0–4). */
export const selectGemCount = (state: AdventureState): number =>
  STATION_ORDER.reduce((total, id) => total + (state.gems[id] ? 1 : 0), 0);

/** Progreso global basado en hitos reales completados (0–1). */
export const selectChapterProgress = (state: AdventureState): number => {
  if (state.phase === "loading" || state.phase === "prologue") return 0;

  let progress = 0.05; // Aventura iniciada en el Vuelo

  // Vuelo completado (desbloqueado mapa o posterior) -> +15% (20% total)
  const unlockedIdx = chapterIndex(state.unlockedChapter);
  if (unlockedIdx >= 2) {
    progress += 0.15;
  }

  // Gemas conseguidas (hasta 4 gemas -> +10% c/u, total +40% -> 60% total)
  const gemsCount = selectGemCount(state);
  progress += (gemsCount / TOTAL_GEMS) * 0.4;

  // Cofres abiertos en la Cueva (hasta 4 cofres -> +6.25% c/u, total +25% -> 85% total)
  progress += (state.chestsOpened / TOTAL_CHESTS) * 0.25;

  // Celebración final
  if (state.candlesLit) {
    progress += 0.1; // 95%
  }
  if (state.celebrationRevealed) {
    progress += 0.05; // 100%
  }

  return Math.min(1, Math.max(0, progress));
};
