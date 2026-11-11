import { useEffect } from 'react';
import { createSilentWavUrl } from '@/lib/silentAudio';

export function useKeepAliveAudio(isActive: boolean) {
  useEffect(() => {
    if (!isActive) return;
    const audio = new Audio(createSilentWavUrl());
    audio.loop = true;
    void audio.play().catch(() => {});
    return () => {
      audio.pause();
      audio.removeAttribute('src');
      audio.load();
    };
  }, [isActive]);
}
