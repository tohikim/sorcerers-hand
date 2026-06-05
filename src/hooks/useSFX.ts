import { useCallback, useRef } from "react";

export const useSFX = (soundPath: string, volume: number = 0.4) => {
  const audioRef = useRef<HTMLAudioElement | null>(null);

  if (!audioRef.current && typeof window !== "undefined") {
    audioRef.current = new Audio(soundPath);
    audioRef.current.volume = volume;
    audioRef.current.preload = "auto";
  }

  const playSound = useCallback(() => {
    if (!audioRef.current) return;

    const soundClone = audioRef.current.cloneNode(true) as HTMLAudioElement;
    soundClone.volume = audioRef.current.volume;

    soundClone.play().catch((err) => {
      console.log("SFX playback paused or blocked:", err);
    });
  }, []);

  return playSound;
};
