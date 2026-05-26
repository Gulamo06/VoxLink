import { useState, useRef, useEffect } from 'react';
import { Mic, Square, CheckCircle, AlertCircle, Loader2 } from 'lucide-react';

interface AudioRecorderProps {
  onAudioRecorded: (audioBlob: Blob, audioUrl: string) => void;
  maxDuration?: number;
  minDuration?: number;
  disabled?: boolean;
}

export default function AudioRecorder({
  onAudioRecorded,
  maxDuration = 300, // 5 minutes
  minDuration = 1,   // 1 second
  disabled = false
}: AudioRecorderProps) {
  const [isRecording, setIsRecording] = useState(false);
  const [recordingTime, setRecordingTime] = useState(0);
  const [error, setError] = useState<string | null>(null);
  const [isProcessing, setIsProcessing] = useState(false);

  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const chunksRef = useRef<BlobPart[]>([]);
  const timerRef = useRef<NodeJS.Timeout | null>(null);

  useEffect(() => {
    return () => {
      if (timerRef.current) clearInterval(timerRef.current);
      if (streamRef.current) {
        streamRef.current.getTracks().forEach(track => track.stop());
      }
    };
  }, []);

  const startRecording = async () => {
    try {
      setError(null);
      chunksRef.current = [];

      const stream = await navigator.mediaDevices.getUserMedia({
        audio: {
          echoCancellation: true,
          noiseSuppression: true,
          autoGainControl: true
        }
      });

      streamRef.current = stream;

      const mimeType = MediaRecorder.isTypeSupported('audio/webm')
        ? 'audio/webm'
        : MediaRecorder.isTypeSupported('audio/mp4')
        ? 'audio/mp4'
        : 'audio/wav';

      const mediaRecorder = new MediaRecorder(stream, { mimeType });

      mediaRecorder.ondataavailable = (event) => {
        if (event.data.size > 0) {
          chunksRef.current.push(event.data);
        }
      };

      mediaRecorder.onstop = () => {
        const blob = new Blob(chunksRef.current, { type: mimeType });
        const audioUrl = URL.createObjectURL(blob);
        
        setIsProcessing(true);
        // Give UI time to update
        setTimeout(() => {
          onAudioRecorded(blob, audioUrl);
          setIsProcessing(false);
          setRecordingTime(0);
        }, 100);

        // Stop tracks
        stream.getTracks().forEach(track => track.stop());
      };

      mediaRecorderRef.current = mediaRecorder;
      mediaRecorder.start();
      setIsRecording(true);
      setRecordingTime(0);

      // Timer
      timerRef.current = setInterval(() => {
        setRecordingTime(prev => {
          if (prev >= maxDuration) {
            stopRecording();
            return maxDuration;
          }
          return prev + 1;
        });
      }, 1000);
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Failed to start recording';
      setError(message);
      setIsRecording(false);
    }
  };

  const stopRecording = () => {
    if (mediaRecorderRef.current && isRecording) {
      mediaRecorderRef.current.stop();
      setIsRecording(false);

      if (timerRef.current) {
        clearInterval(timerRef.current);
      }

      // Check minimum duration
      if (recordingTime < minDuration) {
        setError(`Recording must be at least ${minDuration} second${minDuration !== 1 ? 's' : ''}`);
      }
    }
  };

  const formatTime = (seconds: number): string => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  };

  const isMaxDurationReached = recordingTime >= maxDuration;
  const canStop = recordingTime >= minDuration;

  return (
    <div className="space-y-3">
      {/* Recording Status */}
      {isRecording && (
        <div className="rounded-xl bg-red-500/10 border border-red-500/20 p-3 flex items-center gap-3">
          <div className="h-2 w-2 rounded-full bg-red-500 animate-pulse" />
          <div className="flex-1">
            <p className="text-sm font-medium text-red-400">Recording...</p>
            <p className="text-xs text-red-400/70">{formatTime(recordingTime)}</p>
          </div>
          {isMaxDurationReached && (
            <span className="text-xs text-red-400 font-semibold">MAX REACHED</span>
          )}
        </div>
      )}

      {/* Error Message */}
      {error && (
        <div className="rounded-xl bg-red-500/10 border border-red-500/20 p-3 flex items-start gap-2">
          <AlertCircle className="h-4 w-4 text-red-400 mt-0.5 flex-shrink-0" />
          <p className="text-sm text-red-400">{error}</p>
        </div>
      )}

      {/* Progress Bar */}
      {isRecording && (
        <div className="w-full bg-surface rounded-full h-1 overflow-hidden">
          <div
            className={`h-full transition-all ${
              isMaxDurationReached ? 'bg-red-500' : 'bg-primary'
            }`}
            style={{ width: `${(recordingTime / maxDuration) * 100}%` }}
          />
        </div>
      )}

      {/* Buttons */}
      <div className="flex gap-2">
        {!isRecording ? (
          <button
            onClick={startRecording}
            disabled={disabled || isProcessing}
            className="flex-1 flex items-center justify-center gap-2 rounded-xl bg-primary px-4 py-3 font-semibold text-primary-text transition hover:bg-primary/90 disabled:opacity-50"
          >
            {isProcessing ? (
              <>
                <Loader2 className="h-5 w-5 animate-spin" />
                Processing...
              </>
            ) : (
              <>
                <Mic className="h-5 w-5" />
                Start Recording
              </>
            )}
          </button>
        ) : (
          <>
            <button
              onClick={stopRecording}
              disabled={!canStop}
              className="flex-1 flex items-center justify-center gap-2 rounded-xl bg-green-500 px-4 py-3 font-semibold text-white transition hover:bg-green-600 disabled:opacity-50"
            >
              <CheckCircle className="h-5 w-5" />
              Send ({formatTime(recordingTime)})
            </button>

            <button
              onClick={() => {
                if (mediaRecorderRef.current) {
                  mediaRecorderRef.current.stop();
                  setIsRecording(false);
                  if (timerRef.current) clearInterval(timerRef.current);
                  chunksRef.current = [];
                  setRecordingTime(0);
                }
              }}
              className="rounded-xl bg-surface border border-border px-4 py-3 text-text transition hover:bg-red-500/10"
            >
              <Square className="h-5 w-5" />
            </button>
          </>
        )}
      </div>

      {/* Info Text */}
      {!isRecording && (
        <p className="text-xs text-text-secondary text-center">
          Max duration: {Math.floor(maxDuration / 60)}m {maxDuration % 60}s • Min: {minDuration}s
        </p>
      )}
    </div>
  );
}
