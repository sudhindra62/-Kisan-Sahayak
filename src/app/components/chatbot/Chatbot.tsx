'use client';

import { useState } from 'react';
import { MessageCircle } from 'lucide-react';
import ChatWindow from './ChatWindow';
import type { FarmerProfileInput } from '@/ai/schemas';

type ChatbotProps = {
  farmerProfile: FarmerProfileInput | null;
  userId: string | undefined;
};

export default function Chatbot({ farmerProfile, userId }: ChatbotProps) {
  const [isOpen, setIsOpen] = useState(false);

  // Don't render the chatbot if there's no farmer profile or user
  if (!farmerProfile || !userId) {
    return null;
  }

  return (
    <>
      <button onClick={() => setIsOpen(true)} className="chatbot-trigger">
        <MessageCircle className="h-8 w-8" />
      </button>

      {isOpen && (
        <ChatWindow 
          farmerProfile={farmerProfile}
          userId={userId}
          onClose={() => setIsOpen(false)}
        />
      )}
    </>
  );
}

    