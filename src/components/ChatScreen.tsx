import { useEffect, useMemo, useState } from 'react';
import { useForm } from 'react-hook-form';
import { z } from 'zod';
import { zodResolver } from '@hookform/resolvers/zod';
import { Mic, Send, Trash2, Loader } from 'lucide-react';
import { Message } from '../types';
import VoiceBubble from './VoiceBubble';
import { useVoiceRecorder } from '../hooks/useVoiceRecorder';
import { messageService } from '../services/messageService';
import { useAuthStore } from '../store/useAuthStore';

interface ChatScreenProps {
  chatId: string;
  messages: Message[];
  recipientName: string;
  onSend?: (message: Message) => void;
}

const schema = z.object({ text: z.string().optional().default('') });

type FormData = z.infer<typeof schema>;

function prependUnique(messages: Message[], message: Message) {
  return [message, ...messages.filter((entry) => entry.id !== message.id)];
}

export default function ChatScreen({ chatId, messages, recipientName, onSend }: ChatScreenProps) {
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [localMessages, setLocalMessages] = useState<Message[]>(messages);
  const currentUser = useAuthStore((state) => state.currentUser);

  const { recording, blobUrl, recordedBlob, recordingTime, error: recorderError, startRecording, stopRecording, clearRecording, formatTime } =
    useVoiceRecorder();
  const { register, handleSubmit, reset, watch } = useForm<FormData>({ resolver: zodResolver(schema) });

  const textValue = watch('text');
  const unreadCount = useMemo(() => localMessages.filter((msg) => !msg.read).length, [localMessages]);

  // Setup Realtime listener
  useEffect(() => {
    const unsubscribe = messageService.subscribeToMessages(chatId, (newMessage) => {
      setLocalMessages((prev) => prependUnique(prev, newMessage));
      onSend?.(newMessage);
    });

    return () => unsubscribe();
  }, [chatId, onSend]);

  // Update local messages when prop changes
  useEffect(() => {
    setLocalMessages(messages);
  }, [messages]);

  async function submit(data: FormData) {
    if (!data.text?.trim() && !recordedBlob) return;

    setLoading(true);
    setError(null);

    try {
      if (data.text?.trim()) {
        const message = await messageService.sendMessage(chatId, data.text);
        setLocalMessages((prev) => prependUnique(prev, message));
        onSend?.(message);
        reset();
      }
    } catch (err) {
      const msg = err instanceof Error ? err.message : 'Unable to send message.';
      setError(msg);
    } finally {
      setLoading(false);
    }
  }

  async function uploadVoice() {
    if (!recordedBlob) return;

    setLoading(true);
    setError(null);

    try {
      const message = await messageService.sendVoiceMessage(chatId, recordedBlob);
      setLocalMessages((prev) => prependUnique(prev, message));
      onSend?.(message);
      clearRecording();
    } catch (err) {
      const msg = err instanceof Error ? err.message : 'Unable to upload voice message.';
      setError(msg);
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="rounded-3xl border border-border bg-surface p-5 flex flex-col h-full">
      {/* Header */}
      <div className="mb-4 flex items-center justify-between pb-4 border-b border-border">
        <div>
          <h2 className="text-lg font-semibold text-text">{recipientName}</h2>
          <p className="text-sm text-text-secondary">{unreadCount} unread</p>
        </div>
      </div>

      {/* Messages */}
      <div className="flex-1 space-y-4 overflow-y-auto mb-6">
        {localMessages.length ? (
          localMessages.map((message) => (
            <VoiceBubble
              key={message.id}
              message={message}
              isMine={message.senderId === currentUser?.id}
            />
          ))
        ) : (
          <p className="text-sm text-text-secondary">No messages yet. Say hello.</p>
        )}
      </div>

      {/* Input Form */}
      <form onSubmit={handleSubmit(submit)} className="space-y-3 border-t border-border pt-4">
        {/* Text Input */}
        <textarea
          {...register('text')}
          className="w-full resize-none rounded-2xl border border-border bg-background p-4 text-sm text-text outline-none focus:border-primary transition"
          rows={2}
          placeholder="Type your message..."
          disabled={recording}
        />

        {/* Recording Indicator */}
        {recording && (
          <div className="flex items-center gap-2 text-primary animate-pulse">
            <Mic size={16} />
            <span className="text-sm font-semibold">{formatTime(recordingTime)} Recording...</span>
          </div>
        )}

        {/* Preview Recorded Audio */}
        {blobUrl && !recording && (
          <div className="space-y-2 rounded-xl bg-background p-3">
            <p className="text-xs text-text-secondary">Recorded audio preview:</p>
            <audio controls src={blobUrl} className="w-full h-8" />
          </div>
        )}

        {/* Voice Recording Controls */}
        <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
          <div className="flex gap-2">
            <button
              type="button"
              onClick={recording ? stopRecording : startRecording}
              disabled={loading}
              className={`rounded-2xl px-4 py-3 text-sm font-semibold transition flex items-center gap-2 ${
                recording ? 'bg-red-500 text-white hover:bg-red-600' : 'bg-primary text-primary-text hover:bg-primary/90'
              } disabled:opacity-50 disabled:cursor-not-allowed`}
            >
              <Mic size={16} />
              {recording ? 'Stop Recording' : 'Record Audio'}
            </button>

            {recordedBlob && !recording && (
              <>
                <button
                  type="button"
                  onClick={clearRecording}
                  disabled={loading}
                  className="rounded-2xl bg-surface px-3 py-3 text-text transition hover:bg-background disabled:opacity-50"
                  title="Clear recording"
                >
                  <Trash2 size={18} />
                </button>
                <button
                  type="button"
                  onClick={uploadVoice}
                  disabled={loading}
                  className="rounded-2xl bg-primary px-4 py-3 text-sm font-semibold text-primary-text transition hover:bg-primary/90 flex items-center gap-2 disabled:opacity-50"
                >
                  {loading ? <Loader size={16} className="animate-spin" /> : <Send size={16} />}
                  {loading ? 'Sending...' : 'Send Audio'}
                </button>
              </>
            )}
          </div>

          {/* Send Text Button */}
          {!recordedBlob && (
            <button
              type="submit"
              disabled={loading || (!textValue?.trim() && !recordedBlob) || recording}
              className="rounded-2xl bg-primary px-4 py-3 text-sm font-semibold text-primary-text transition hover:bg-primary/90 flex items-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {loading ? <Loader size={16} className="animate-spin" /> : <Send size={16} />}
              {loading ? 'Sending...' : 'Send'}
            </button>
          )}
        </div>

        {/* Error Display */}
        {(error || recorderError) && (
          <p className="text-sm text-red-400">{error || recorderError}</p>
        )}
      </form>
    </div>
  );
}
