'use client';

import { useState, useRef, useEffect } from 'react';
import { useFirestore, useDoc, useMemoFirebase, setDocumentNonBlocking } from '@/firebase';
import { doc } from 'firebase/firestore';
import { ArrowLeft, ArrowUp, Bot, WifiOff } from 'lucide-react';
import type { ChatMessage, FarmerProfileInput } from '@/ai/schemas';
import { getChatbotResponse, translateText } from '@/app/actions';
import ChatMessageDisplay from './ChatMessage';
import Link from 'next/link';

type ChatWindowProps = {
  farmerProfile: FarmerProfileInput;
  userId: string;
};

interface DisplayMessage extends ChatMessage {
  originalContent?: string; // The original English message from the AI
}

const initialMessage: DisplayMessage = { role: 'model', content: 'Hello! I am your KisanSahayak AI assistant. How can I help you today?' };
initialMessage.originalContent = initialMessage.content;

export default function ChatWindow({ farmerProfile, userId }: ChatWindowProps) {
  const [input, setInput] = useState('');
  const [messages, setMessages] = useState<DisplayMessage[]>([initialMessage]);
  const [isSending, setIsSending] = useState(false);
  const [isOnline, setIsOnline] = useState(true);
  const chatBodyRef = useRef<HTMLDivElement>(null);
  const [translatingMessageIndex, setTranslatingMessageIndex] = useState<number | null>(null);
  
  const firestore = useFirestore();

  // Effect to track online/offline status
  useEffect(() => {
    const handleOnline = () => setIsOnline(true);
    const handleOffline = () => setIsOnline(false);
    
    if (typeof window !== 'undefined' && typeof navigator !== 'undefined') {
      setIsOnline(navigator.onLine);
      window.addEventListener('online', handleOnline);
      window.addEventListener('offline', handleOffline);
    }
    
    return () => {
      if (typeof window !== 'undefined') {
        window.removeEventListener('online', handleOnline);
        window.removeEventListener('offline', handleOffline);
      }
    };
  }, []);

  const chatHistoryRef = useMemoFirebase(() => 
    firestore ? doc(firestore, 'users', userId, 'chat_history', userId) : null
  , [firestore, userId]);
  
  const { data: chatHistoryDoc, isLoading: isHistoryLoading } = useDoc<{ messages: ChatMessage[] }>(chatHistoryRef);
  
  // Effect to sync messages from Firestore
  useEffect(() => {
    if (chatHistoryDoc?.messages && chatHistoryDoc.messages.length > 0) {
      const displayMessages: DisplayMessage[] = chatHistoryDoc.messages.map(m => ({
          ...m,
          originalContent: m.role === 'model' ? m.content : undefined,
      }));
      setMessages(displayMessages);
    } else {
      setMessages([initialMessage]);
    }
  }, [chatHistoryDoc]);

  // Auto-scroll to bottom
  useEffect(() => {
    if (chatBodyRef.current) {
      chatBodyRef.current.scrollTop = chatBodyRef.current.scrollHeight;
    }
  }, [messages, isSending, translatingMessageIndex]);

  const handleSendMessage = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!input.trim() || isSending || !isOnline) return;

    const userMessage: DisplayMessage = { role: 'user', content: input };
    const newMessages: DisplayMessage[] = [...messages, userMessage];
    
    setMessages(newMessages); // Optimistically update UI
    setInput('');
    setIsSending(true);

    try {
        // The history sent to the AI should be the original English content
        const historyForAI = messages.map(m => ({
            role: m.role,
            content: m.originalContent || m.content,
        }));

        const aiResponse = await getChatbotResponse({
            farmerProfile,
            history: historyForAI, 
            message: input,
        });

        const aiMessage: DisplayMessage = { 
            role: 'model', 
            content: aiResponse,
            originalContent: aiResponse // Store original response
        };
        
        const finalMessages = [...newMessages, aiMessage];
        setMessages(finalMessages); // Update UI with AI response
        
        if (chatHistoryRef) {
            // Save only the original English content to Firestore
            const historyToSave = finalMessages.map(m => ({
                role: m.role,
                content: m.originalContent || m.content
            }));
            setDocumentNonBlocking(chatHistoryRef, { 
                id: userId,
                messages: historyToSave,
                updatedAt: new Date().toISOString()
            }, { merge: true });
        }

    } catch (error) {
      console.error("Failed to get chat response:", error);
      const errorMessage: DisplayMessage = { role: 'model', content: 'Sorry, I couldn\'t connect to the AI assistant. Please check your internet connection and try again.', originalContent: 'Sorry, I couldn\'t connect to the AI assistant. Please check your internet connection and try again.'};
      setMessages(prev => [...prev, errorMessage]);
    } finally {
        setIsSending(false);
    }
  };

  const handleTranslateMessage = async (messageIndex: number, targetLanguage: string) => {
    const messageToTranslate = messages[messageIndex];
    if (messageToTranslate.role !== 'model' || !messageToTranslate.originalContent) return;

    if (targetLanguage === 'English') {
        const updatedMessages = [...messages];
        updatedMessages[messageIndex] = {
            ...updatedMessages[messageIndex],
            content: messageToTranslate.originalContent,
        };
        setMessages(updatedMessages);
        return;
    }

    setTranslatingMessageIndex(messageIndex);
    try {
        const response = await translateText({
            text: messageToTranslate.originalContent,
            targetLanguage,
        });

        const updatedMessages = [...messages];
        updatedMessages[messageIndex] = {
            ...updatedMessages[messageIndex],
            content: response.translatedText,
        };
        setMessages(updatedMessages);
    } catch (error) {
        console.error("Failed to translate message:", error);
    } finally {
        setTranslatingMessageIndex(null);
    }
  };


  const isChatDisabled = isSending || isHistoryLoading || !isOnline;

  return (
    <div className="chat-page-container">
      <div className="chat-header">
        <Link href="/" className="chat-back-btn">
            <ArrowLeft className="h-5 w-5" />
        </Link>
        <h3 className="chat-title">KisanSahayak Assistant</h3>
        {!isOnline && (
            <div className="offline-indicator" title="You are offline">
                <WifiOff className="h-5 w-5" />
                Offline
            </div>
        )}
      </div>

      <div className="chat-body" ref={chatBodyRef}>
        {isHistoryLoading && messages.length <= 1 && (
            <div className="chat-loading-history">
                <div className="loading-spinner-small"></div>
                <p>Loading history...</p>
            </div>
        )}
        {messages.map((msg, index) => (
          <ChatMessageDisplay 
            key={index} 
            message={msg} 
            isTranslating={translatingMessageIndex === index}
            onTranslate={(lang) => handleTranslateMessage(index, lang)}
          />
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
            placeholder={!isOnline ? "You are offline. Please reconnect." : "Ask me anything..."}
            className="chat-input"
            disabled={isChatDisabled}
          />
          <button type="submit" className="chat-send-btn" disabled={!input.trim() || isChatDisabled}>
            <ArrowUp className="h-5 w-5" />
          </button>
        </form>
      </div>
    </div>
  );
}
