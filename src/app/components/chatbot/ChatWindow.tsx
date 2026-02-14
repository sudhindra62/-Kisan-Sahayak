'use client';

import { useState, useRef, useEffect } from 'react';
import { useAuth, useFirestore, useDoc, useMemoFirebase } from '@/firebase';
import { doc, setDoc } from 'firebase/firestore';
import { ArrowUp, Bot, X } from 'lucide-react';
import type { ChatMessage, FarmerProfileInput } from '@/ai/schemas';
import { getChatbotResponse } from '@/app/actions';
import ChatMessageDisplay from './ChatMessage';

type ChatWindowProps = {
  farmerProfile: FarmerProfileInput;
  userId: string;
  onClose: () => void;
};

const initialMessages: ChatMessage[] = [
    { role: 'model', content: 'Hello! I am your KisanSahayak AI assistant. How can I help you today?' },
];

export default function ChatWindow({ farmerProfile, userId, onClose }: ChatWindowProps) {
  const [input, setInput] = useState('');
  const [isSending, setIsSending] = useState(false);
  const chatBodyRef = useRef<HTMLDivElement>(null);
  
  const firestore = useFirestore();

  const chatHistoryRef = useMemoFirebase(() => 
    firestore ? doc(firestore, 'users', userId, 'chat_history', userId) : null
  , [firestore, userId]);
  
  const { data: chatHistoryDoc, isLoading: isHistoryLoading } = useDoc<{ messages: ChatMessage[], updatedAt: string }>(chatHistoryRef);
  const messages = chatHistoryDoc?.messages ?? initialMessages;

  // Auto-scroll to bottom
  useEffect(() => {
    if (chatBodyRef.current) {
      chatBodyRef.current.scrollTop = chatBodyRef.current.scrollHeight;
    }
  }, [messages, isSending]);

  const handleSendMessage = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!input.trim() || isSending) return;

    const newMessage: ChatMessage = { role: 'user', content: input };
    const newHistory = [...messages, newMessage];
    
    setInput('');
    setIsSending(true);

    try {
        const aiResponse = await getChatbotResponse({
            farmerProfile,
            history: messages, // Send history *before* the new message
            message: input,
        });

        const aiMessage: ChatMessage = { role: 'model', content: aiResponse };
        const finalHistory = [...newHistory, aiMessage];
        
        if (chatHistoryRef) {
            await setDoc(chatHistoryRef, { 
                id: userId,
                messages: finalHistory,
                updatedAt: new Date().toISOString()
            }, { merge: true });
        }

    } catch (error) {
      console.error("Failed to get chat response:", error);
       if (chatHistoryRef) {
            const errorMessage: ChatMessage = { role: 'model', content: 'Sorry, I encountered an error. Please try again.' };
            const historyWithError = [...newHistory, errorMessage];
             await setDoc(chatHistoryRef, { 
                id: userId,
                messages: historyWithError,
                updatedAt: new Date().toISOString()
            }, { merge: true });
       }
    } finally {
        setIsSending(false);
    }
  };


  return (
    <div className="chat-window">
      <div className="chat-header">
        <Bot className="h-6 w-6 text-amber-300" />
        <h3 className="chat-title">KisanSahayak Assistant</h3>
        <button onClick={onClose} className="chat-close-btn">
          <X className="h-5 w-5" />
        </button>
      </div>

      <div className="chat-body" ref={chatBodyRef}>
        {isHistoryLoading && messages.length <= 1 && (
            <div className="chat-loading-history">
                <div className="loading-spinner-small"></div>
                <p>Loading history...</p>
            </div>
        )}
        {messages.map((msg, index) => (
          <ChatMessageDisplay key={index} message={msg} />
        ))}
         {isSending && (
            <div className="chat-message assistant-message is-thinking">
                <div className="avatar">
                    <Bot className="h-5 w-5" />
                </div>
                <div className="message-content">
                    <div className="typing-indicator">
                        <span></span><span></span><span></span>
                    </div>
                </div>
            </div>
        )}
      </div>

      <div className="chat-footer">
        <form onSubmit={handleSendMessage} className="chat-input-form">
          <input
            type="text"
            value={input}
            onChange={(e) => setInput(e.target.value)}
            placeholder="Ask me anything..."
            className="chat-input"
            disabled={isSending || isHistoryLoading}
          />
          <button type="submit" className="chat-send-btn" disabled={!input.trim() || isSending}>
            <ArrowUp className="h-5 w-5" />
          </button>
        </form>
      </div>
    </div>
  );
}

    