"use client";

/**
 * Gestor de audio.
 *
 * - Usa Howler.js para los archivos de audio (`/assets/audio/*`).
 * - Si un archivo NO existe, no falla: cae en un sintetizador WebAudio muy
 *   liviano para que la experiencia tenga sonido igual.
 * - Nunca suena antes de la primera interacción: hay que llamar a `unlock()`
 *   desde un gesto del usuario (botón "Comenzar aventura").
 */

import { Howler, Howl } from "howler";
import { birthday } from "@/config/birthday";

export type SfxName =
  | "click"
  | "hover"
  | "hatch"
  | "gem"
  | "bloom"
  | "pop"
  | "match"
  | "win"
  | "whoosh"
  | "sparkle"
  | "candle"
  | "firework";

/** Rutas preparadas: si agregás los mp3 con estos nombres, se usan solos. */
const SFX_FILES: Record<SfxName, string> = {
  click: "/assets/audio/sfx-click.mp3",
  hover: "/assets/audio/sfx-hover.mp3",
  hatch: "/assets/audio/sfx-hatch.mp3",
  gem: "/assets/audio/sfx-gem.mp3",
  bloom: "/assets/audio/sfx-bloom.mp3",
  pop: "/assets/audio/sfx-pop.mp3",
  match: "/assets/audio/sfx-match.mp3",
  win: "/assets/audio/sfx-win.mp3",
  whoosh: "/assets/audio/sfx-whoosh.mp3",
  sparkle: "/assets/audio/sfx-sparkle.mp3",
  candle: "/assets/audio/sfx-candle.mp3",
  firework: "/assets/audio/sfx-firework.mp3",
};

const AMBIENT_FILE = birthday.assets.ambientAudio;
const DEFAULT_MUSIC_VOLUME = 0.35;

/** Receta de cada sonido sintetizado (se usa cuando falta el archivo). */
interface SynthRecipe {
  type: OscillatorType;
  from: number;
  to: number;
  duration: number;
  gain: number;
  /** Semitonos extra para hacer un pequeño arpegio. */
  extra?: number[];
}

const SYNTH: Record<SfxName, SynthRecipe> = {
  click: { type: "square", from: 660, to: 520, duration: 0.07, gain: 0.07 },
  hover: { type: "sine", from: 880, to: 990, duration: 0.05, gain: 0.035 },
  hatch: { type: "triangle", from: 420, to: 90, duration: 0.5, gain: 0.12 },
  gem: { type: "sine", from: 880, to: 1320, duration: 0.22, gain: 0.1, extra: [1760] },
  bloom: { type: "sine", from: 520, to: 880, duration: 0.32, gain: 0.09, extra: [660] },
  pop: { type: "triangle", from: 300, to: 980, duration: 0.14, gain: 0.09 },
  match: { type: "sine", from: 700, to: 1400, duration: 0.18, gain: 0.08, extra: [1050] },
  win: { type: "triangle", from: 660, to: 990, duration: 0.4, gain: 0.11, extra: [880, 1320] },
  whoosh: { type: "sawtooth", from: 220, to: 660, duration: 0.34, gain: 0.06, extra: [440] },
  sparkle: { type: "sine", from: 1760, to: 2200, duration: 0.16, gain: 0.05, extra: [2640] },
  candle: { type: "triangle", from: 320, to: 520, duration: 0.26, gain: 0.07 },
  firework: { type: "sine", from: 120, to: 60, duration: 0.6, gain: 0.14, extra: [2400] },
};

type AudioContextConstructor = new () => AudioContext;

function resolveAudioContext(): AudioContextConstructor | null {
  if (typeof window === "undefined") return null;
  const candidate =
    window.AudioContext ??
    (window as unknown as { webkitAudioContext?: AudioContextConstructor }).webkitAudioContext;
  return candidate ?? null;
}

class AudioManager {
  private enabled = true;
  private unlocked = false;
  /** ¿Existe el archivo? undefined = todavía no lo sabemos. */
  private fileAvailability = new Map<string, boolean>();
  private ambient: Howl | null = null;
  private context: AudioContext | null = null;
  private master: GainNode | null = null;

  constructor() {
    if (typeof window !== "undefined") {
      Howler.volume(0.6);
    }
  }

  /** Comprueba una sola vez si el archivo existe (evita errores de Howler). */
  private async probe(url: string): Promise<boolean> {
    const cached = this.fileAvailability.get(url);
    if (cached !== undefined) return cached;
    try {
      const response = await fetch(url, { method: "HEAD" });
      const exists = response.ok;
      this.fileAvailability.set(url, exists);
      return exists;
    } catch {
      this.fileAvailability.set(url, false);
      return false;
    }
  }

  /** Precalienta la comprobación de archivos (llamado al desbloquear el audio). */
  async warmup(): Promise<void> {
    await Promise.all([this.probe(AMBIENT_FILE), ...Object.values(SFX_FILES).map((url) => this.probe(url))]);
  }

  setEnabled(enabled: boolean): void {
    this.enabled = enabled;
    if (typeof window === "undefined") return;
    Howler.mute(!enabled);
    if (this.master && this.context) {
      this.master.gain.setTargetAtTime(enabled ? 1 : 0, this.context.currentTime, 0.05);
    }
    if (enabled && this.unlocked) void this.startAmbient();
  }

  isEnabled(): boolean {
    return this.enabled;
  }

  /** Debe llamarse desde un gesto del usuario (click del botón de inicio). */
  unlock(): void {
    if (this.unlocked) return;
    this.unlocked = true;
    const context = this.ensureContext();
    if (context && context.state === "suspended") void context.resume();
    void this.warmup().then(() => {
      if (this.enabled) void this.startAmbient();
    });
  }

  private async startAmbient(): Promise<void> {
    if (this.ambient) {
      this.ambient.play();
      return;
    }
    const exists = await this.probe(AMBIENT_FILE);
    if (!exists || typeof window === "undefined") return;
    this.ambient = new Howl({
      src: [AMBIENT_FILE],
      loop: true,
      html5: true,
      volume: 0,
      onloaderror: () => {
        this.ambient = null;
      },
    });
    this.ambient.play();
    this.ambient.fade(0, DEFAULT_MUSIC_VOLUME, 2500);
  }

  private ensureContext(): AudioContext | null {
    if (typeof window === "undefined") return null;
    if (!this.context) {
      const Ctor = resolveAudioContext();
      if (!Ctor) return null;
      try {
        this.context = new Ctor();
      } catch {
        return null;
      }
      this.master = this.context.createGain();
      this.master.gain.value = this.enabled ? 1 : 0;
      this.master.connect(this.context.destination);
    }
    if (this.context.state === "suspended") void this.context.resume();
    return this.context;
  }

  /** Reproduce un SFX: archivo si existe, si no sintetizado. */
  play(name: SfxName): void {
    if (!this.enabled || typeof window === "undefined") return;
    const url = SFX_FILES[name];
    const availability = this.fileAvailability.get(url);

    if (availability === true) {
      const sound = new Howl({ src: [url], volume: 0.6 });
      sound.play();
      return;
    }
    if (availability === undefined) {
      // Todavía no sabemos si existe: lo averiguamos para la próxima y suena el sintetizador.
      void this.probe(url);
    }
    this.playSynth(name);
  }

  private playSynth(name: SfxName): void {
    const context = this.ensureContext();
    if (!context || !this.master) return;
    const recipe = SYNTH[name];
    const now = context.currentTime;
    const notes = [recipe.from, ...(recipe.extra ?? [])];

    notes.forEach((frequency, index) => {
      const start = now + index * 0.045;
      const oscillator = context.createOscillator();
      const gain = context.createGain();
      oscillator.type = recipe.type;
      oscillator.frequency.setValueAtTime(frequency, start);
      oscillator.frequency.exponentialRampToValueAtTime(
        Math.max(40, index === 0 ? recipe.to : frequency * 1.25),
        start + recipe.duration,
      );
      gain.gain.setValueAtTime(0, start);
      gain.gain.linearRampToValueAtTime(recipe.gain, start + 0.012);
      gain.gain.exponentialRampToValueAtTime(0.0001, start + recipe.duration);
      oscillator.connect(gain);
      gain.connect(this.master as GainNode);
      oscillator.start(start);
      oscillator.stop(start + recipe.duration + 0.05);
    });
  }
}

export const audio = new AudioManager();
