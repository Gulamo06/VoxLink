import { useState, useRef, useEffect } from 'react';
import { Send, Mic, StopCircle, Plus } from 'lucide-react';
import { useVoiceRecorder } from '../hooks/useVoiceRecorder';

interface ChatInputProps {
  onSendMessage: (text: string) => Promise<void>;
  onSendVoiceMessage: (blob: Blob) => Promise<void>;
  onTyping?: (isTyping: boolean) => void;
  disabled?: boolean;
  loading?: boolean;
}

export default function ChatInput({
  onSendMessage,
  onSendVoiceMessage,
  onTyping,
  disabled = false,
  loading = false
}: ChatInputProps) {
  const [text, setText] = useState('');
  const [isRecording, setIsRecording] = useState(false);
  const [recordingTime, setRecordingTime] = useState(0);
  const textInputRef = useRef<HTMLTextAreaElement>(null);
  const typingTimeoutRef = useRef<NodeJS.Timeout>();

  const { startRecording, stopRecording, isSupported: voiceSupported } = useVoiceRecorder();

  useEffect(() => {
    return () => {
      if (typingTimeoutRef.current) {
        clearTimeout(typingTimeoutRef.current);
      }
    };
  }, []);

  const handleTextChange = (value: string) => {
    setText(value);

    // Send typing indicator
    if (onTyping) {
      onTyping(true);

      // Clear previous timeout
      if (typingTimeoutRef.current) {
        clearTimeout(typingTimeoutRef.current);
      }

      // Stop typing after 1 second of no input
      typingTimeoutRef.current = setTimeout(() => {
        onTyping(false);
      }, 1000);
    }
  };

  const handleSendMessage = async () => {
    if (!text.trim() || loading) return;

    try {
      const messageText = text.trim();
      setText('');

      if (onTyping) {
        onTyping(false);
      }

      await onSendMessage(messageText);
    } catch (error) {
      console.error('Error sending message:', error);
      // Restore text on error
      setText(text);
    }
  };

  const handleKeyPress = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSendMessage();
    }
  };

  const handleStartRecording = async () => {
    try {
      setIsRecording(true);
      setRecordingTime(0);

      await startRecording();

      // Start recording timer
      const interval = setInterval(() => {
        setRecordingTime(prev => prev + 1);
      }, 1000);

      return () => clearInterval(interval);
    } catch (error) {
      console.error('Error starting recording:', error);
      setIsRecording(false);
    }
  };

  const handleStopRecording = async () => {
    try {
      setIsRecording(false);
      const audioBlob = await stopRecording();

      if (audioBlob) {
        await onSendVoiceMessage(audioBlob);
      }
    } catch (error) {
      console.error('Error stopping recording:', error);
    }
  };

  const minutes = Math.floor(recordingTime / 60);
  const seconds = recordingTime % 60;

  return (
    <div className="space-y-3 border-t border-border bg-background p-4">
      {/* Recording timer */}
      {isRecording && (
        <div className="flex items-center justify-center gap-2 rounded-lg bg-red-500/10 py-2 px-3 border border-red-500/20">
          <div className="h-2 w-2 rounded-full bg-red-500 animate-pulse" />
          <span className="text-sm font-medium text-red-400">
            Recording: {minutes}:{seconds.toString().padStart(2, '0')}
          </span>
        </div>
      )}

      {/* Input area */}
      <div className="flex gap-2">
        {/* Text input */}
        {!isRecording ? (
          <>
            <textarea
              ref={textInputRef}
              value={text}
              onChange={(e) => handleTextChange(e.target.value)}
              onKeyPress={handleKeyPress}
              placeholder="Type a message... (Shift+Enter for new line)"
              disabled={disabled || loading}
              className="flex-1 resize-none rounded-2xl border border-border bg-surface px-4 py-3 text-sm text-text outline-none focus:border-white focus:ring-1 focus:ring-white/10 disabled:opacity-50"
              rows={1}
            />

            <div className="flex gap-1">
              {/* Voice message button */}
              {voiceSupported && (
                <button
                  onClick={handleStartRecording}
                  disabled={disabled || loading || !text.trim() === false}
                  className="rounded-2xl border border-border bg-surface p-3 text-text transition hover:bg-primary/10 disabled:opacity-50"
                  title="Record voice message"
                >
                  <Mic className="h-5 w-5" />
                </button>
              )}

              {/* Send button */}
              <button
                onClick={handleSendMessage}
                disabled={disabled || loading || !text.trim()}
                className="rounded-2xl bg-primary px-4 py-3 text-primary-text transition hover:bg-primary/90 disabled:opacity-50"
              >
                <Send className="h-5 w-5" />
              </button>
            </div>
          </>
        ) : (
          /* Recording buttons */
          <div className="flex flex-1 gap-2">
            <button
              onClick={handleStopRecording}
              className="flex-1 rounded-2xl bg-green-500 px-4 py-3 font-semibold text-white transition hover:bg-green-600 flex items-center justify-center gap-2"
            >
              <StopCircle className="h-5 w-5" />
              Send Voice Message
            </button>

            <button
              onClick={() => setIsRecording(false)}
              className="rounded-2xl border border-border bg-surface px-4 py-3 text-text transition hover:bg-red-500/10"
            >
              Cancel
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
