"use client";

import { useCallback, useEffect } from "react";
import { audio, type SfxName } from "@/lib/audio";
import { useAdventureStore } from "@/store/useAdventureStore";

interface UseAudioResult {
  play: (name: SfxName) => void;
}

/** Conecta el gestor de audio con el estado global (encendido / desbloqueado). */
export function useAudio(): UseAudioResult {
  const soundEnabled = useAdventureStore((state) => state.soundEnabled);
  const audioUnlocked = useAdventureStore((state) => state.audioUnlocked);

  useEffect(() => {
    audio.setEnabled(soundEnabled);
  }, [soundEnabled]);

  useEffect(() => {
    if (audioUnlocked) audio.unlock();
  }, [audioUnlocked]);

  const play = useCallback((name: SfxName) => {
    audio.play(name);
  }, []);

  return { play };
}
