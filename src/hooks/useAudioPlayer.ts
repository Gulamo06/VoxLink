import { useState, useEffect, useCallback, useRef } from 'react';
import { AudioPlayer, audioPlayerService, AudioPlayerOptions } from '../services/audioPlayerService';

interface UseAudioPlayerReturn {
  isPlaying: boolean;
  isLoaded: boolean;
  currentTime: number;
  duration: number;
  volume: number;
  playbackRate: number;
  error: Error | null;
  play: () => void;
  pause: () => void;
  stop: () => void;
  seek: (time: number) => void;
  setVolume: (volume: number) => void;
  setPlaybackRate: (rate: number) => void;
  destroy: () => void;
}

/**
 * Hook for easy audio playback with Howler.js
 * Includes state management and React lifecycle
 */
export function useAudioPlayer(
  audioUrl: string,
  playerId?: string,
  options?: AudioPlayerOptions
): UseAudioPlayerReturn {
  const [isPlaying, setIsPlaying] = useState(false);
  const [isLoaded, setIsLoaded] = useState(false);
  const [currentTime, setCurrentTime] = useState(0);
  const [duration, setDuration] = useState(0);
  const [volume, setVolumeState] = useState(options?.volume ?? 1);
  const [playbackRate, setPlaybackRateState] = useState(options?.rate ?? 1);
  const [error, setError] = useState<Error | null>(null);

  const playerRef = useRef<AudioPlayer | null>(null);
  const animationFrameRef = useRef<number | null>(null);
  const playerIdRef = useRef(playerId || `player-${Date.now()}-${Math.random()}`);

  // Create player on mount
  useEffect(() => {
    try {
      const player = audioPlayerService.create(
        playerIdRef.current,
        audioUrl,
        {
          ...options,
          onPlay: () => {
            setIsPlaying(true);
            options?.onPlay?.();
            startAnimationFrame();
          },
          onPause: () => {
            setIsPlaying(false);
            options?.onPause?.();
          },
          onEnd: () => {
            setIsPlaying(false);
            setCurrentTime(0);
            options?.onEnd?.();
          },
          onError: (err) => {
            setError(err);
            options?.onError?.(err);
          }
        }
      );

      playerRef.current = player;
      setIsLoaded(true);
      setDuration(player.getDuration());
    } catch (err) {
      const error = err instanceof Error ? err : new Error('Failed to create audio player');
      setError(error);
    }

    return () => {
      if (animationFrameRef.current) {
        cancelAnimationFrame(animationFrameRef.current);
      }
      audioPlayerService.destroy(playerIdRef.current);
      playerRef.current = null;
    };
  }, [audioUrl]); // Only recreate if URL changes

  // Animation frame for updating current time
  const startAnimationFrame = useCallback(() => {
    const updateTime = () => {
      if (playerRef.current && playerRef.current.isPlaying()) {
        setCurrentTime(playerRef.current.getSeek());
        animationFrameRef.current = requestAnimationFrame(updateTime);
      }
    };
    updateTime();
  }, []);

  const play = useCallback(() => {
    playerRef.current?.play();
  }, []);

  const pause = useCallback(() => {
    playerRef.current?.pause();
  }, []);

  const stop = useCallback(() => {
    playerRef.current?.stop();
    setCurrentTime(0);
  }, []);

  const seek = useCallback((time: number) => {
    if (playerRef.current) {
      playerRef.current.seek(time);
      setCurrentTime(time);
    }
  }, []);

  const setVolume = useCallback((vol: number) => {
    if (playerRef.current) {
      playerRef.current.setVolume(vol);
      setVolumeState(vol);
    }
  }, []);

  const setPlaybackRate = useCallback((rate: number) => {
    if (playerRef.current) {
      playerRef.current.setRate(rate);
      setPlaybackRateState(rate);
    }
  }, []);

  const destroy = useCallback(() => {
    if (animationFrameRef.current) {
      cancelAnimationFrame(animationFrameRef.current);
    }
    audioPlayerService.destroy(playerIdRef.current);
    playerRef.current = null;
  }, []);

  return {
    isPlaying,
    isLoaded,
    currentTime,
    duration,
    volume,
    playbackRate,
    error,
    play,
    pause,
    stop,
    seek,
    setVolume,
    setPlaybackRate,
    destroy
  };
}
