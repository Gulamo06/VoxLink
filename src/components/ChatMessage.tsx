import { Message } from '../types';
import { formatDistanceToNow } from 'date-fns';
import { CheckCheck, Loader2 } from 'lucide-react';
import AudioPlayer from './AudioPlayer';

interface ChatMessageProps {
  message: Message;
  isOwn: boolean;
  showTimestamp?: boolean;
}

export default function ChatMessage({ message, isOwn, showTimestamp = true }: ChatMessageProps) {
  const isVoiceMessage = !!message.voiceUrl && !message.text;

  return (
    <div className={`flex ${isOwn ? 'justify-end' : 'justify-start'} mb-3`}>
      <div
        className={`max-w-xs rounded-2xl px-4 py-2 ${
          isOwn
            ? 'bg-primary text-primary-text'
            : 'bg-surface border border-border text-text'
        }`}
      >
        {/* Text message */}
        {message.text && (
          <p className="break-words text-sm leading-relaxed">{message.text}</p>
        )}

        {/* Voice message with Howler.js player */}
        {isVoiceMessage && (
          <div className="min-w-[200px]">
            <AudioPlayer
              audioUrl={message.voiceUrl}
              autoplay={false}
              showDownload={false}
              className={isOwn ? 'bg-primary/20 border-primary/30' : ''}
            />
          </div>
        )}

        {/* Timestamp and read receipt */}
        {showTimestamp && (
          <div className={`mt-1 flex items-center gap-1 text-xs ${
            isOwn ? 'text-primary-text/70' : 'text-text-secondary'
          }`}>
            <span>
              {formatDistanceToNow(new Date(message.createdAt), { addSuffix: true })}
            </span>
            {isOwn && (
              <div>
                {message.read ? (
                  <CheckCheck className="h-3 w-3" />
                ) : (
                  <Loader2 className="h-3 w-3 animate-spin" />
                )}
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
