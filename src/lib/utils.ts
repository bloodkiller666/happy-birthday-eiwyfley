/** Une clases condicionales sin dependencias extra. */
export function cn(...values: Array<string | false | null | undefined>): string {
  return values.filter(Boolean).join(" ");
}

export function clamp(value: number, min: number, max: number): number {
  return Math.min(Math.max(value, min), max);
}

export function lerp(from: number, to: number, amount: number): number {
  return from + (to - from) * amount;
}

/** Rango aleatorio entero, inclusivo en ambos extremos. */
export function randomInt(min: number, max: number): number {
  return Math.floor(Math.random() * (max - min + 1)) + min;
}

/** Barajado Fisher–Yates que devuelve una copia. */
export function shuffle<T>(input: readonly T[]): T[] {
  const output = [...input];
  for (let i = output.length - 1; i > 0; i -= 1) {
    const j = Math.floor(Math.random() * (i + 1));
    [output[i], output[j]] = [output[j], output[i]];
  }
  return output;
}
