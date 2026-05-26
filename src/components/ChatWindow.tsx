import { useEffect, useRef } from 'react';
import { useChat } from '../hooks/useChat';
import { useAuthStore } from '../store/useAuthStore';
import { useChatRealTimeStore } from '../store/useChatRealTimeStore';
import ChatMessage from './ChatMessage';
import ChatInput from './ChatInput';
import TypingIndicator from './TypingIndicator';
import { MessageCircle, Loader2 } from 'lucide-react';

interface ChatWindowProps {
  chatId: string;
  chatName?: string;
}

export default function ChatWindow({ chatId, chatName }: ChatWindowProps) {
  const { currentUser } = useAuthStore();
  const { clearUnread } = useChatRealTimeStore();
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);

  const { messages, typingUsers, sendMessage, sendVoiceMessage, sendTypingIndicator } = useChat({
    chatId,
    onMessageReceived: () => {
      // Auto-scroll to bottom on new message
      setTimeout(() => {
        messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
      }, 0);
    }
  });

  // Clear unread when viewing chat
  useEffect(() => {
    clearUnread(chatId);
  }, [chatId, clearUnread]);

  // Auto-scroll to bottom on mount or when messages change
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages.length]);

  const handleSendMessage = async (text: string) => {
    await sendMessage(text);
    sendTypingIndicator(false);
  };

  const handleTyping = (isTyping: boolean) => {
    sendTypingIndicator(isTyping);
  };

  if (!currentUser) {
    return (
      <div className="flex items-center justify-center h-96 text-text-secondary">
        <p>Please log in to view messages</p>
      </div>
    );
  }

  return (
    <div
      ref={containerRef}
      className="flex flex-col h-full bg-background rounded-2xl border border-border overflow-hidden"
    >
      {/* Header */}
      <div className="border-b border-border bg-surface px-4 py-3 flex items-center gap-2">
        <MessageCircle className="h-5 w-5 text-primary" />
        <div>
          <p className="font-semibold text-text">{chatName || 'Direct Message'}</p>
          <p className="text-xs text-text-secondary">
            {messages.length} message{messages.length !== 1 ? 's' : ''}
          </p>
        </div>
      </div>

      {/* Messages area */}
      <div className="flex-1 overflow-y-auto p-4 space-y-2 scroll-smooth">
        {messages.length === 0 ? (
          <div className="flex flex-col items-center justify-center h-full text-text-secondary">
            <MessageCircle className="h-12 w-12 mb-2 opacity-50" />
            <p>No messages yet. Start the conversation!</p>
          </div>
        ) : (
          messages.map((message) => (
            <ChatMessage
              key={message.id}
              message={message}
              isOwn={message.senderId === currentUser.id}
            />
          ))
        )}

        {/* Typing indicator */}
        {typingUsers.length > 0 && <TypingIndicator typingUsers={typingUsers} />}

        {/* Scroll anchor */}
        <div ref={messagesEndRef} />
      </div>

      {/* Input area */}
      <ChatInput
        onSendMessage={handleSendMessage}
        onSendVoiceMessage={sendVoiceMessage}
        onTyping={handleTyping}
        disabled={!currentUser}
      />
    </div>
  );
}
