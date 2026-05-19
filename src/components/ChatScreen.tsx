import { useMemo, useState } from 'react';
import { useForm } from 'react-hook-form';
import { z } from 'zod';
import { zodResolver } from '@hookform/resolvers/zod';
import { Message } from '../types';
import VoiceBubble from './VoiceBubble';
import { useVoiceRecorder } from '../hooks/useVoiceRecorder';
import { messageService } from '../services/messageService';

interface ChatScreenProps {
  chatId: string;
  messages: Message[];
  recipientName: string;
  onSend?: (message: Message) => void;
}

const schema = z.object({ text: z.string().min(1, 'Type a message') });

type FormData = z.infer<typeof schema>;

export default function ChatScreen({ chatId, messages, recipientName, onSend }: ChatScreenProps) {
  const [error, setError] = useState<string | null>(null);
  const { recording, blobUrl, recordedBlob, startRecording, stopRecording } = useVoiceRecorder();
  const { register, handleSubmit, reset } = useForm<FormData>({ resolver: zodResolver(schema) });

  const unreadCount = useMemo(() => messages.filter((message) => !message.read).length, [messages]);

  async function submit(data: FormData) {
    try {
      const message = await messageService.sendMessage(chatId, data.text);
      onSend?.(message);
      reset();
    } catch (err) {
      setError('Unable to send message.');
    }
  }

  async function uploadVoice() {
    if (!recordedBlob) return;
    try {
      const message = await messageService.sendVoiceMessage(chatId, recordedBlob);
      onSend?.(message);
    } catch {
      setError('Unable to upload voice message.');
    }
  }

  return (
    <div className="rounded-3xl border border-border bg-surface p-5">
      <div className="mb-4 flex items-center justify-between">
        <div>
          <h2 className="text-lg font-semibold text-text">{recipientName}</h2>
          <p className="text-sm text-text-secondary">{unreadCount} unread</p>
        </div>
      </div>
      <div className="space-y-4">
        {messages.length ? (
          messages.map((message) => <VoiceBubble key={message.id} message={message} isMine={message.senderId !== chatId} />)
        ) : (
          <p className="text-sm text-text-secondary">No messages yet. Say hello.</p>
        )}
      </div>

      <form onSubmit={handleSubmit(submit)} className="mt-6 space-y-3">
        <textarea
          {...register('text')}
          className="w-full resize-none rounded-3xl border border-border bg-background p-4 text-sm text-text outline-none focus:border-white"
          rows={3}
          placeholder="Type your message"
        />
        <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <div className="flex gap-2">
            <button type="button" onClick={recording ? stopRecording : startRecording} className="rounded-2xl bg-primary px-4 py-3 text-sm font-semibold text-primary-text transition hover:bg-surface">
              {recording ? 'Stop' : 'Record'} Voice
            </button>
            {recordedBlob ? (
              <button type="button" onClick={uploadVoice} className="rounded-2xl bg-surface px-4 py-3 text-sm text-text transition hover:bg-background">
                Upload Voice
              </button>
            ) : null}
          </div>
          <button type="submit" className="rounded-2xl bg-primary px-4 py-3 text-sm font-semibold text-primary-text transition hover:bg-surface">
            Send
          </button>
        </div>
      </form>
      {blobUrl ? <audio controls src={blobUrl} className="mt-4 w-full" /> : null}
      {error ? <p className="mt-3 text-sm text-text-secondary">{error}</p> : null}
    </div>
  );
}
