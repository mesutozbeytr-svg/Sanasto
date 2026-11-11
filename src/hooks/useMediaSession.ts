import { useEffect } from 'react';

interface MediaSessionOptions {
  title: string;
  artist: string;
  artworkUrl: string | null;
  isPlaying: boolean;
  onPlay: () => void;
  onPause: () => void;
  onNext: () => void;
  onPrevious: () => void;
}

export function useMediaSession({
  title,
  artist,
  artworkUrl,
  isPlaying,
  onPlay,
  onPause,
  onNext,
  onPrevious,
}: MediaSessionOptions) {
  const isSupported = typeof navigator !== 'undefined' && 'mediaSession' in navigator && 'MediaMetadata' in window;

  useEffect(() => {
    if (!isSupported) return;
    navigator.mediaSession.metadata = new MediaMetadata({
      title,
      artist,
      album: 'Sanasto Dinleme',
      artwork: artworkUrl ? [{ src: artworkUrl }] : [],
    });
    return () => {
      navigator.mediaSession.metadata = null;
    };
  }, [isSupported, title, artist, artworkUrl]);

  useEffect(() => {
    if (!isSupported) return;
    navigator.mediaSession.playbackState = isPlaying ? 'playing' : 'paused';
  }, [isSupported, isPlaying]);

  useEffect(() => {
    if (!isSupported) return;
    const session = navigator.mediaSession;
    session.setActionHandler('play', onPlay);
    session.setActionHandler('pause', onPause);
    session.setActionHandler('nexttrack', onNext);
    session.setActionHandler('previoustrack', onPrevious);
    return () => {
      session.setActionHandler('play', null);
      session.setActionHandler('pause', null);
      session.setActionHandler('nexttrack', null);
      session.setActionHandler('previoustrack', null);
    };
  }, [isSupported, onPlay, onPause, onNext, onPrevious]);
}
