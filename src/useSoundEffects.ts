import { useCallback, useRef } from 'react';

const SOUND_URLS: Record<string, string> = {
  hitSuper: `${import.meta.env.BASE_URL}audio/hit-super-effective.mp3`,
  hitWeak:  `${import.meta.env.BASE_URL}audio/hit-weak-not-very-effective.mp3`,
  money:    `${import.meta.env.BASE_URL}audio/pokemon_money.mp3`,
};

export function useSoundEffects(enabled: boolean = true) {
  const refs = useRef<Record<string, HTMLAudioElement>>({});

  const playSound = useCallback((key: keyof typeof SOUND_URLS, volume = 0.45) => {
    if (!enabled) return;
    const url = SOUND_URLS[key];
    if (!url) return;
    try {
      let audio = refs.current[key];
      if (!audio) {
        audio = new Audio(url);
        refs.current[key] = audio;
      }
      audio.currentTime = 0;
      audio.volume = volume;
      audio.play().catch(() => {});
    } catch {}
  }, [enabled]);

  return { playSound };
}