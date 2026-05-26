import { useState } from 'react';
import AudioRecorder from './AudioRecorder';
import AudioPlayer from './AudioPlayer';
import { Settings, RotateCw } from 'lucide-react';

interface VoiceMessageComposerProps {
  onAudioSend: (audioBlob: Blob, audioUrl: string) => Promise<void>;
  disabled?: boolean;
  maxDuration?: number;
}

export default function VoiceMessageComposer({
  onAudioSend,
  disabled = false,
  maxDuration = 300
}: VoiceMessageComposerProps) {
  const [recordedAudio, setRecordedAudio] = useState<{ blob: Blob; url: string } | null>(null);
  const [isSending, setIsSending] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [showSettings, setShowSettings] = useState(false);

  const handleAudioRecorded = (audioBlob: Blob, audioUrl: string) => {
    setRecordedAudio({ blob: audioBlob, url: audioUrl });
    setError(null);
  };

  const handleSendAudio = async () => {
    if (!recordedAudio) return;

    try {
      setIsSending(true);
      setError(null);

      await onAudioSend(recordedAudio.blob, recordedAudio.url);
      setRecordedAudio(null);
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Failed to send audio';
      setError(message);
    } finally {
      setIsSending(false);
    }
  };

  const handleDiscardAudio = () => {
    if (recordedAudio) {
      URL.revokeObjectURL(recordedAudio.url);
      setRecordedAudio(null);
      setError(null);
    }
  };

  return (
    <div className="space-y-4 rounded-2xl border border-border bg-surface p-4">
      {/* Header */}
      <div className="flex items-center justify-between">
        <h3 className="font-semibold text-text">Voice Message</h3>
        <button
          onClick={() => setShowSettings(!showSettings)}
          className="rounded-lg bg-background p-2 text-text-secondary transition hover:text-text"
          title="Settings"
        >
          <Settings className="h-4 w-4" />
        </button>
      </div>

      {/* Settings (Optional) */}
      {showSettings && (
        <div className="rounded-lg bg-background p-3 space-y-2 text-sm">
          <div className="text-text-secondary">
            <p>Max Duration: {Math.floor(maxDuration / 60)}m {maxDuration % 60}s</p>
            <p>Format: WebM/MP4 with noise suppression</p>
            <p>Echo Cancellation: Enabled</p>
          </div>
        </div>
      )}

      {/* Recorder or Player */}
      {!recordedAudio ? (
        <AudioRecorder
          onAudioRecorded={handleAudioRecorded}
          maxDuration={maxDuration}
          disabled={disabled || isSending}
        />
      ) : (
        <div className="space-y-3">
          {/* Audio Player */}
          <AudioPlayer audioUrl={recordedAudio.url} showDownload={false} />

          {/* Action Buttons */}
          <div className="flex gap-2">
            <button
              onClick={handleSendAudio}
              disabled={isSending || disabled}
              className="flex-1 rounded-xl bg-primary px-4 py-2 font-semibold text-primary-text transition hover:bg-primary/90 disabled:opacity-50"
            >
              {isSending ? 'Sending...' : 'Send Voice Message'}
            </button>

            <button
              onClick={handleDiscardAudio}
              disabled={isSending}
              className="flex items-center justify-center gap-2 rounded-xl border border-border bg-background px-4 py-2 text-text transition hover:bg-red-500/10"
            >
              <RotateCw className="h-4 w-4" />
              Redo
            </button>
          </div>

          {/* Error */}
          {error && (
            <div className="rounded-lg bg-red-500/10 border border-red-500/20 p-2">
              <p className="text-sm text-red-400">{error}</p>
            </div>
          )}
        </div>
      )}

      {/* Info */}
      <p className="text-xs text-text-secondary text-center">
        🎙️ High quality voice recording with noise suppression
      </p>
    </div>
  );
}
