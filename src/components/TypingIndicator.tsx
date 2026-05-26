import { Loader2 } from 'lucide-react';

interface TypingIndicatorProps {
  typingUsers: string[];
}

export default function TypingIndicator({ typingUsers }: TypingIndicatorProps) {
  if (typingUsers.length === 0) {
    return null;
  }

  const userList = typingUsers.slice(0, 2).join(', ');
  const more = typingUsers.length > 2 ? ` +${typingUsers.length - 2}` : '';

  return (
    <div className="flex items-center gap-2 px-4 py-2 text-sm text-text-secondary">
      <div className="flex gap-1">
        <div className="h-2 w-2 rounded-full bg-primary animate-bounce" style={{ animationDelay: '0ms' }} />
        <div className="h-2 w-2 rounded-full bg-primary animate-bounce" style={{ animationDelay: '150ms' }} />
        <div className="h-2 w-2 rounded-full bg-primary animate-bounce" style={{ animationDelay: '300ms' }} />
      </div>
      <span>
        {userList}{more} is typing...
      </span>
    </div>
  );
}
