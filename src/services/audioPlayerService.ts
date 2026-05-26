import { Howl } from 'howler';

export interface AudioPlayerOptions {
  autoplay?: boolean;
  loop?: boolean;
  volume?: number;
  rate?: number;
  onPlay?: () => void;
  onPause?: () => void;
  onEnd?: () => void;
  onError?: (error: Error) => void;
}

export class AudioPlayer {
  private howl: Howl | null = null;
  private isReady = false;

  constructor(audioUrl: string, options: AudioPlayerOptions = {}) {
    const {
      autoplay = false,
      loop = false,
      volume = 1,
      rate = 1,
      onPlay,
      onPause,
      onEnd,
      onError
    } = options;

    this.howl = new Howl({
      src: [audioUrl],
      autoplay,
      loop,
      volume: Math.max(0, Math.min(1, volume)),
      rate: Math.max(0.5, Math.min(2, rate)),
      preload: true,
      onload: () => {
        this.isReady = true;
      },
      onplay: () => {
        onPlay?.();
      },
      onpause: () => {
        onPause?.();
      },
      onstop: () => {
        onPause?.();
      },
      onend: () => {
        onEnd?.();
      },
      onfail: (soundId, error) => {
        onError?.(new Error(`Audio playback failed: ${error}`));
      }
    });
  }

  /**
   * Play the audio
   */
  play(): void {
    if (!this.howl) return;
    this.howl.play();
  }

  /**
   * Pause the audio
   */
  pause(): void {
    if (!this.howl) return;
    this.howl.pause();
  }

  /**
   * Stop the audio
   */
  stop(): void {
    if (!this.howl) return;
    this.howl.stop();
  }

  /**
   * Set volume (0-1)
   */
  setVolume(volume: number): void {
    if (!this.howl) return;
    this.howl.volume(Math.max(0, Math.min(1, volume)));
  }

  /**
   * Get current volume (0-1)
   */
  getVolume(): number {
    if (!this.howl) return 0;
    return this.howl.volume();
  }

  /**
   * Set playback rate (0.5-2)
   */
  setRate(rate: number): void {
    if (!this.howl) return;
    this.howl.rate(Math.max(0.5, Math.min(2, rate)));
  }

  /**
   * Get playback rate
   */
  getRate(): number {
    if (!this.howl) return 1;
    return this.howl.rate();
  }

  /**
   * Seek to time (in seconds)
   */
  seek(seconds: number): void {
    if (!this.howl) return;
    this.howl.seek(Math.max(0, seconds));
  }

  /**
   * Get current seek position (in seconds)
   */
  getSeek(): number {
    if (!this.howl) return 0;
    return this.howl.seek() as number;
  }

  /**
   * Get duration (in seconds)
   */
  getDuration(): number {
    if (!this.howl) return 0;
    return this.howl.duration();
  }

  /**
   * Check if audio is playing
   */
  isPlaying(): boolean {
    if (!this.howl) return false;
    return this.howl.playing();
  }

  /**
   * Check if audio is loaded
   */
  isLoaded(): boolean {
    return this.isReady;
  }

  /**
   * Unload and cleanup
   */
  destroy(): void {
    if (!this.howl) return;
    this.howl.unload();
    this.howl = null;
  }
}

/**
 * Simple audio playback service
 * Manages multiple audio players
 */
export const audioPlayerService = {
  players: new Map<string, AudioPlayer>(),

  /**
   * Create a new audio player
   */
  create(id: string, audioUrl: string, options?: AudioPlayerOptions): AudioPlayer {
    // Destroy existing player with same id
    const existing = this.players.get(id);
    if (existing) {
      existing.destroy();
    }

    const player = new AudioPlayer(audioUrl, options);
    this.players.set(id, player);
    return player;
  },

  /**
   * Get player by id
   */
  get(id: string): AudioPlayer | undefined {
    return this.players.get(id);
  },

  /**
   * Destroy player by id
   */
  destroy(id: string): void {
    const player = this.players.get(id);
    if (player) {
      player.destroy();
      this.players.delete(id);
    }
  },

  /**
   * Destroy all players
   */
  destroyAll(): void {
    this.players.forEach(player => {
      player.destroy();
    });
    this.players.clear();
  },

  /**
   * Quick play (fire and forget)
   */
  quickPlay(audioUrl: string, volume: number = 1): void {
    const player = new AudioPlayer(audioUrl, { volume });
    setTimeout(() => {
      player.destroy();
    }, player.getDuration() * 1000 + 1000);
    player.play();
  }
};
