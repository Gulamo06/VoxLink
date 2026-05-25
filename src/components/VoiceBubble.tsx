import { useState, useRef } from 'react';
import { Play, Pause, Volume2 } from 'lucide-react';
import { Message } from '../types';
import { formatTime } from '../utils/formatTime';

interface VoiceBubbleProps {
  message: Message;
  isMine?: boolean;
}

export default function VoiceBubble({ message, isMine = false }: VoiceBubbleProps) {
  const audioRef = useRef<HTMLAudioElement>(null);
  const [isPlaying, setIsPlaying] = useState(false);
  const [duration, setDuration] = useState(0);
  const [currentTime, setCurrentTime] = useState(0);

  const handlePlayPause = () => {
    if (audioRef.current) {
      if (isPlaying) {
        audioRef.current.pause();
      } else {
        audioRef.current.play();
      }
      setIsPlaying(!isPlaying);
    }
  };

  const handleLoadedMetadata = () => {
    if (audioRef.current) {
      setDuration(audioRef.current.duration);
    }
  };

  const handleTimeUpdate = () => {
    if (audioRef.current) {
      setCurrentTime(audioRef.current.currentTime);
    }
  };

  const handleEnded = () => {
    setIsPlaying(false);
    if (audioRef.current) {
      audioRef.current.currentTime = 0;
    }
  };

  const handleProgressClick = (e: React.MouseEvent<HTMLDivElement>) => {
    if (!audioRef.current) return;
    const rect = e.currentTarget.getBoundingClientRect();
    const percent = (e.clientX - rect.left) / rect.width;
    audioRef.current.currentTime = percent * duration;
  };

  const formatSeconds = (seconds: number) => {
    if (!seconds || isNaN(seconds)) return '0:00';
    const mins = Math.floor(seconds / 60);
    const secs = Math.floor(seconds % 60);
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  return (
    <div className={`flex ${isMine ? 'justify-end' : 'justify-start'}`}>
      <div className={`rounded-2xl p-4 max-w-xs ${isMine ? 'bg-primary/20 text-primary-text' : 'bg-surface text-text'}`}>
        {/* Text content if exists */}
        {message.text && <p className="text-sm leading-6 mb-3">{message.text}</p>}

        {/* Audio player if voice message */}
        {message.voiceUrl && (
          <div className="space-y-3">
            {/* Hidden audio element */}
            <audio
              ref={audioRef}
              src={message.voiceUrl}
              onLoadedMetadata={handleLoadedMetadata}
              onTimeUpdate={handleTimeUpdate}
              onEnded={handleEnded}
            />

            {/* Custom Player UI */}
            <div className={`rounded-xl p-3 ${isMine ? 'bg-primary/30' : 'bg-background'}`}>
              <div className="flex items-center gap-3">
                {/* Play/Pause Button */}
                <button
                  onClick={handlePlayPause}
                  className={`flex-shrink-0 rounded-full p-2 transition ${
                    isMine ? 'hover:bg-primary/40' : 'hover:bg-surface'
                  }`}
                  aria-label={isPlaying ? 'Pause' : 'Play'}
                >
                  {isPlaying ? <Pause size={20} /> : <Play size={20} fill="currentColor" />}
                </button>

                {/* Progress Bar */}
                <div className="flex-1 flex flex-col gap-1">
                  <div
                    onClick={handleProgressClick}
                    className={`h-1 rounded-full cursor-pointer transition ${
                      isMine ? 'bg-primary/50 hover:bg-primary/70' : 'bg-border hover:bg-text-secondary'
                    }`}
                    style={{
                      background: `linear-gradient(to right, currentColor 0%, currentColor ${
                        duration ? (currentTime / duration) * 100 : 0
                      }%, ${isMine ? 'rgba(255,255,255,0.3)' : 'rgb(100, 100, 100)'} ${
                        duration ? (currentTime / duration) * 100 : 0
                      }%, ${isMine ? 'rgba(255,255,255,0.3)' : 'rgb(100, 100, 100)'} 100%)`
                    }}
                  />
                  {/* Time display */}
                  <div className="flex justify-between text-xs opacity-70">
                    <span>{formatSeconds(currentTime)}</span>
                    <span>{formatSeconds(duration)}</span>
                  </div>
                </div>

                {/* Speaker Icon */}
                <Volume2 size={16} className="flex-shrink-0 opacity-70" />
              </div>
            </div>
          </div>
        )}

        {/* Timestamp */}
        <div className={`mt-3 text-xs ${isMine ? 'text-primary-text/70' : 'text-text-secondary'}`}>
          {formatTime(message.createdAt)}
        </div>
      </div>
    </div>
  );
}
