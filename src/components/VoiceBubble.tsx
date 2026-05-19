import { Message } from '../types';
import { formatTime } from '../utils/formatTime';

interface VoiceBubbleProps {
  message: Message;
  isMine?: boolean;
}

export default function VoiceBubble({ message, isMine = false }: VoiceBubbleProps) {
  return (
    <div className={`rounded-3xl p-4 ${isMine ? 'bg-white/10 self-end' : 'bg-surface'}`}>
      {message.text ? <p className="text-sm leading-6 text-text">{message.text}</p> : null}
      {message.voiceUrl ? (
        <audio controls src={message.voiceUrl} className="mt-3 w-full" />
      ) : null}
      <div className="mt-2 text-xs text-text-secondary">{formatTime(message.createdAt)}</div>
    </div>
  );
}
