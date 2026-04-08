// @/hooks/use-game-clips-player.ts
import { useCallback, useRef, useEffect } from 'react';
import { useGameClipsStore } from '@/stores/game-clips-store';
import { useScreenSize } from '@/hooks/use-screen';

interface UseGameClipsPlayerProps {
  clipId: string;
  isActive: boolean;
  onAutoNext?: () => void;
  onAutoPrev?: () => void;
}

export function useGameClipsPlayer({
  clipId,
  isActive,
  onAutoNext,
  onAutoPrev,
}: UseGameClipsPlayerProps) {
  const videoRef = useRef<HTMLVideoElement>(null);
  const {
    isGloballyPaused,
    muted,
    volume,
    playbackRates,
    setActiveClip,
    setGlobalPause,
  } = useGameClipsStore();

  const { isMobile } = useScreenSize();

  // Gestion de la lecture quand l'état change
  useEffect(() => {
    const video = videoRef.current;
    if (!video) return;

    const shouldPlay = isActive && !isGloballyPaused;
    const playbackRate = playbackRates[clipId] || 1;

    video.muted = muted;
    video.volume = volume;
    video.playbackRate = playbackRate;

    if (shouldPlay) {
      const playPromise = video.play();
      if (playPromise !== undefined) {
        playPromise.catch((error) => {
          console.warn('Playback prevented:', error);
        });
      }
    } else {
      video.pause();
    }
  }, [isActive, isGloballyPaused, muted, volume, playbackRates, clipId]);

  // Mise à jour du clip actif
  useEffect(() => {
    if (isActive) {
      setActiveClip(clipId);
    }
  }, [isActive, clipId, setActiveClip]);

  // Gestionnaire de fin de vidéo
  useEffect(() => {
    const video = videoRef.current;
    if (!video || !isActive) return;

    const handleEnded = () => {
      if (onAutoNext && !isGloballyPaused) {
        onAutoNext();
      }
    };

    video.addEventListener('ended', handleEnded);
    return () => video.removeEventListener('ended', handleEnded);
  }, [isActive, isGloballyPaused, onAutoNext]);

  const togglePlayPause = useCallback(() => {
    setGlobalPause(!isGloballyPaused);
  }, [isGloballyPaused, setGlobalPause]);

  const handleAreaClick = useCallback(
    (e: React.MouseEvent<HTMLDivElement>) => {
      const target = e.target as HTMLElement;
      
      // Ne pas naviguer si on clique sur un bouton d'action
      if (target.closest('.action-button')) {
        return;
      }

      const rect = (e.currentTarget as HTMLDivElement).getBoundingClientRect();
      const x = e.clientX - rect.left;
      const width = rect.width;
      
      // Zone centrale pour pause/play (60% du milieu)
      const centerStart = width * 0.2;
      const centerEnd = width * 0.8;

      if (x >= centerStart && x <= centerEnd) {
        togglePlayPause();
      } else if (x < centerStart) {
        // Zone gauche - précédent
        if (onAutoPrev) onAutoPrev();
      } else {
        // Zone droite - suivant
        if (onAutoNext) onAutoNext();
      }
    },
    [togglePlayPause, onAutoNext, onAutoPrev]
  );

  return {
    videoRef,
    isPlaying: isActive && !isGloballyPaused,
    togglePlayPause,
    handleAreaClick,
    isMuted: muted,
    toggleMute: () => useGameClipsStore.getState().toggleMute(),
  };
}