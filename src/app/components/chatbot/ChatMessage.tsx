'use client';

import { Bot, User } from 'lucide-react';
import type { ChatMessage } from '@/ai/schemas';

type ChatMessageProps = {
  message: ChatMessage;
};

export default function ChatMessageDisplay({ message }: ChatMessageProps) {
  const isUser = message.role === 'user';

  return (
    <div className={`chat-message ${isUser ? 'user-message' : 'assistant-message'}`}>
      <div className="avatar">
        {isUser ? <User className="h-5 w-5" /> : <Bot className="h-5 w-5" />}
      </div>
      <div className="message-content">
        <p>{message.content}</p>
      </div>
    </div>
  );
}

    