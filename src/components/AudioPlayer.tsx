import { useEffect, useRef } from 'react';
import { useAudioPlayer } from '../hooks/useAudioPlayer';
import { Play, Pause, Download, Volume2, VolumeX } from 'lucide-react';

interface AudioPlayerComponentProps {
  audioUrl: string;
  autoplay?: boolean;
  showDownload?: boolean;
  onPlayStart?: () => void;
  onPlayEnd?: () => void;
  className?: string;
}

export default function AudioPlayerComponent({
  audioUrl,
  autoplay = false,
  showDownload = true,
  onPlayStart,
  onPlayEnd,
  className = ''
}: AudioPlayerComponentProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const {
    isPlaying,
    isLoaded,
    currentTime,
    duration,
    volume,
    error,
    play,
    pause,
    seek,
    setVolume
  } = useAudioPlayer(audioUrl, undefined, {
    autoplay,
    onPlay: onPlayStart,
    onEnd: onPlayEnd
  });

  const progressPercent = duration > 0 ? (currentTime / duration) * 100 : 0;

  const formatTime = (seconds: number): string => {
    const mins = Math.floor(seconds / 60);
    const secs = Math.floor(seconds % 60);
    return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  };

  const handleProgressClick = (e: React.MouseEvent<HTMLDivElement>) => {
    if (!containerRef.current || !isLoaded) return;

    const rect = containerRef.current.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const percent = x / rect.width;
    const newTime = percent * duration;

    seek(newTime);
  };

  const handleDownload = () => {
    const a = document.createElement('a');
    a.href = audioUrl;
    a.download = `audio-${Date.now()}.webm`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
  };

  if (error) {
    return (
      <div className={`rounded-xl bg-red-500/10 border border-red-500/20 p-3 ${className}`}>
        <p className="text-sm text-red-400">Error playing audio</p>
      </div>
    );
  }

  return (
    <div className={`space-y-2 rounded-xl bg-surface border border-border p-4 ${className}`}>
      {/* Control Buttons */}
      <div className="flex items-center gap-3">
        <button
          onClick={() => (isPlaying ? pause : play)}
          disabled={!isLoaded}
          className="rounded-full bg-primary p-2 text-primary-text transition hover:bg-primary/90 disabled:opacity-50"
          title={isPlaying ? 'Pause' : 'Play'}
        >
          {isPlaying ? (
            <Pause className="h-5 w-5 fill-current" />
          ) : (
            <Play className="h-5 w-5 fill-current" />
          )}
        </button>

        {/* Time Display */}
        <div className="text-xs text-text-secondary min-w-[40px]">
          {formatTime(currentTime)} / {formatTime(duration)}
        </div>

        {/* Volume Control */}
        <div className="flex items-center gap-1 ml-auto">
          {volume > 0 ? (
            <Volume2 className="h-4 w-4 text-text-secondary" />
          ) : (
            <VolumeX className="h-4 w-4 text-text-secondary" />
          )}
          <input
            type="range"
            min="0"
            max="1"
            step="0.1"
            value={volume}
            onChange={(e) => setVolume(parseFloat(e.target.value))}
            className="w-16 cursor-pointer"
          />
        </div>

        {/* Download Button */}
        {showDownload && (
          <button
            onClick={handleDownload}
            className="rounded-full bg-surface border border-border p-2 text-text transition hover:bg-primary/10"
            title="Download audio"
          >
            <Download className="h-4 w-4" />
          </button>
        )}
      </div>

      {/* Progress Bar */}
      <div
        ref={containerRef}
        onClick={handleProgressClick}
        className="group relative h-1 w-full cursor-pointer rounded-full bg-background transition"
      >
        <div
          className="absolute inset-y-0 left-0 rounded-full bg-primary transition-all"
          style={{ width: `${progressPercent}%` }}
        />

        {/* Hover Indicator */}
        <div
          className="absolute top-1/2 h-3 w-3 -translate-y-1/2 rounded-full bg-primary opacity-0 transition-opacity group-hover:opacity-100"
          style={{ left: `${progressPercent}%`, transform: 'translateX(-50%) translateY(-50%)' }}
        />
      </div>

      {/* Loading State */}
      {!isLoaded && (
        <div className="flex items-center justify-center gap-2 py-2">
          <div className="h-2 w-2 rounded-full bg-primary animate-bounce" />
          <span className="text-xs text-text-secondary">Loading audio...</span>
        </div>
      )}
    </div>
  );
}
