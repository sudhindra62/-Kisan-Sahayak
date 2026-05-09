'use client';

import { useState, useRef, useEffect, useTransition } from 'react';
import { useFirestore, useDoc, useMemoFirebase, setDocument } from '@/firebase';
import { doc } from 'firebase/firestore';
import { ArrowLeft, ArrowUp, Bot, WifiOff, Mic, MicOff, Languages, Loader2 } from 'lucide-react';
import type { ChatMessage, FarmerProfileInput } from '@/ai/schemas';
import { getChatbotResponse, translateText, textToSpeech } from '@/app/actions';
import ChatMessageDisplay from './ChatMessage';
import Link from 'next/link';
import { getOfflineChatbotResponse } from '@/lib/offline-chat-engine';
import { useToast } from '@/hooks/use-toast';

declare global {
    interface Window {
        SpeechRecognition: any;
        webkitSpeechRecognition: any;
    }
}

type ChatWindowProps = {
  farmerProfile: FarmerProfileInput;
  userId: string;
};

interface DisplayMessage extends ChatMessage {
  originalContent?: string;
  translations?: Record<string, string>; // Client-side cache for translations
}

const initialMessage: DisplayMessage = { 
    role: 'model', 
    content: 'Hello! I am your KisanSahayak assistant. How can I help you today?',
    originalContent: 'Hello! I am your KisanSahayak assistant. How can I help you today?',
    translations: {}
};

const speechLanguages = [
    { code: 'en-IN', name: 'English' },
    { code: 'hi-IN', name: 'Hindi' },
    { code: 'kn-IN', name: 'Kannada' },
]

export default function ChatWindow({ farmerProfile, userId }: ChatWindowProps) {
  const [input, setInput] = useState('');
  const [messages, setMessages] = useState<DisplayMessage[]>([initialMessage]);
  const [isSending, setIsSending] = useState(false);
  const [isOnline, setIsOnline] = useState(true);
  const [isPending, startTransition] = useTransition();
  
  const chatBodyRef = useRef<HTMLDivElement>(null);
  const audioPlayerRef = useRef<HTMLAudioElement>(null);
  const recognitionRef = useRef<any>(null);

  const [translatingMessageIndex, setTranslatingMessageIndex] = useState<number | null>(null);
  
  // Voice & Audio State
  const [speechApiSupported, setSpeechApiSupported] = useState(false);
  const [isRecording, setIsRecording] = useState(false);
  const [speechLang, setSpeechLang] = useState('en-IN');
  const [audioDataCache, setAudioDataCache] = useState<Record<string, string>>({});
  const [audioLoadingIndex, setAudioLoadingIndex] = useState<number | null>(null);
  const [audioPlayingIndex, setAudioPlayingIndex] = useState<number | null>(null);
  const { toast } = useToast();

  const firestore = useFirestore();

  useEffect(() => {
    if (typeof window !== 'undefined') {
        const SpeechRecognition = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
        setSpeechApiSupported(!!SpeechRecognition);
        setIsOnline(navigator.onLine);
        
        const handleOnline = () => setIsOnline(true);
        const handleOffline = () => setIsOnline(false);
        window.addEventListener('online', handleOnline);
        window.addEventListener('offline', handleOffline);
        
        return () => {
          window.removeEventListener('online', handleOnline);
          window.removeEventListener('offline', handleOffline);
          if (recognitionRef.current) recognitionRef.current.abort();
        };
    }
  }, []);

  const chatHistoryRef = useMemoFirebase(() => 
    firestore ? doc(firestore, 'users', userId, 'chat_history', userId) : null
  , [firestore, userId]);
  
  const { data: chatHistoryDoc } = useDoc<{ messages: ChatMessage[] }>(chatHistoryRef);
  
  useEffect(() => {
    if (chatHistoryDoc?.messages && chatHistoryDoc.messages.length > 0) {
      startTransition(() => {
        const displayMessages: DisplayMessage[] = chatHistoryDoc.messages.map(m => ({
            ...m,
            originalContent: m.role === 'model' ? m.content : undefined,
            translations: {},
        }));
        setMessages(displayMessages);
      });
    }
  }, [chatHistoryDoc]);

  useEffect(() => {
    if (chatBodyRef.current) {
      chatBodyRef.current.scrollTop = chatBodyRef.current.scrollHeight;
    }
  }, [messages, isSending, translatingMessageIndex]);

  const handleAudioEnd = () => {
    setAudioPlayingIndex(null);
    setAudioLoadingIndex(null);
  };

  const playAudio = async (textContent: string | undefined, index: number) => {
    if (!textContent || !audioPlayerRef.current) return;

    if (audioPlayingIndex === index || audioLoadingIndex === index) {
      audioPlayerRef.current.pause();
      setAudioPlayingIndex(null);
      setAudioLoadingIndex(null);
      return;
    }

    setAudioLoadingIndex(index);
    
    try {
      let audioSrc = audioDataCache[textContent];
      if (!audioSrc) {
        const response = await textToSpeech({ text: textContent });
        if (response.error) throw new Error(response.error);
        audioSrc = response.audioData;
        setAudioDataCache(prev => ({...prev, [textContent]: audioSrc}));
      }
      
      if (audioPlayerRef.current) {
        audioPlayerRef.current.src = audioSrc;
        setAudioPlayingIndex(index);
        setAudioLoadingIndex(null);
        audioPlayerRef.current.play().catch(() => {
          setAudioPlayingIndex(null);
          setAudioLoadingIndex(null);
        });
      }
    } catch (e) {
      setAudioLoadingIndex(null);
      setAudioPlayingIndex(null);
    }
  };

  const handleTranslate = async (index: number, lang: string) => {
    const msg = messages[index];
    const sourceText = msg.originalContent || msg.content;
    
    if (lang === 'English' && msg.originalContent) {
        setMessages(prev => {
            const next = [...prev];
            next[index] = { ...next[index], content: msg.originalContent! };
            return next;
        });
        return;
    }

    if (msg.translations?.[lang]) {
        setMessages(prev => {
            const next = [...prev];
            next[index] = { ...next[index], content: msg.translations![lang] };
            return next;
        });
        return;
    }

    setTranslatingMessageIndex(index);
    try {
      const res = await translateText({ text: sourceText, targetLanguage: lang });
      const translatedText = res.translatedText;
      
      setMessages(prev => {
        const next = [...prev];
        const updatedMsg = { ...next[index] };
        updatedMsg.content = translatedText;
        updatedMsg.translations = { ...updatedMsg.translations, [lang]: translatedText };
        next[index] = updatedMsg;
        return next;
      });
      
    } catch (error) {
      toast({
        variant: "destructive",
        title: "Translation failed",
        description: "Could not translate message at this time."
      });
    } finally {
      setTranslatingMessageIndex(null);
    }
  };

  const handleSendMessage = async (e?: React.FormEvent, messageContent?: string) => {
    if (e) e.preventDefault();
    const content = (messageContent || input).trim();
    if (!content || isSending) return;

    const userMessage: DisplayMessage = { role: 'user', content, translations: {} };
    const historyWithUser = [...messages, userMessage];
    
    setMessages(historyWithUser);
    setInput('');
    setIsSending(true);

    try {
      let aiResponse: string;
      if (isOnline) {
        const historyForAI = messages.slice(-10).map((m) => ({
          role: m.role,
          content: m.originalContent || m.content,
        }));
        
        try {
            aiResponse = await getChatbotResponse({ farmerProfile, history: historyForAI, message: content });
        } catch (serverError) {
            console.warn("AI Service unavailable, falling back to local engine.");
            aiResponse = getOfflineChatbotResponse(content, farmerProfile);
        }
      } else {
        aiResponse = getOfflineChatbotResponse(content, farmerProfile);
      }

      const aiMessage: DisplayMessage = {
        role: 'model',
        content: aiResponse,
        originalContent: aiResponse,
        translations: {},
      };

      const finalMessages = [...historyWithUser, aiMessage];
      setMessages(finalMessages);
      
      if (isOnline && chatHistoryRef) {
        setDocument(chatHistoryRef, {
          id: userId,
          messages: finalMessages.map(m => ({ role: m.role, content: m.originalContent || m.content })),
          updatedAt: new Date(),
        }, { merge: true });
      }
    } catch (error) {
        setMessages(prev => [...prev, { role: 'model', content: "I'm experiencing a bit of difficulty right now. Please try again or check your connectivity.", translations: {} }]);
    } finally {
      setIsSending(false);
    }
  };

  const handleMicClick = () => {
    if (isRecording) {
      recognitionRef.current?.stop();
      return;
    }
    
    const SpeechRecognition = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
    if (!SpeechRecognition) return;
    
    recognitionRef.current = new SpeechRecognition();
    recognitionRef.current.lang = speechLang;
    recognitionRef.current.interimResults = true;
    recognitionRef.current.onstart = () => setIsRecording(true);
    recognitionRef.current.onend = () => setIsRecording(false);
    recognitionRef.current.onresult = (event: any) => {
        if (!event.results || !event.results[0]) return;
        const transcript = event.results[0][0].transcript;
        setInput(transcript);
        if (event.results[0].isFinal) handleSendMessage(undefined, transcript);
    };
    recognitionRef.current.start();
  };

  return (
    <div className="chat-page-container">
      <audio ref={audioPlayerRef} onEnded={handleAudioEnd} onPause={() => setAudioPlayingIndex(null)} className="hidden" />
      <div className="chat-header">
        <Link href="/" className="chat-back-btn">
            <ArrowLeft className="h-5 w-5" />
        </Link>
        <h3 className="chat-title">Assistant</h3>
        {!isOnline && <div className="offline-indicator"><WifiOff className="h-4 w-4" /> Offline</div>}
      </div>

      <div className="chat-body" ref={chatBodyRef}>
        {messages.map((msg, index) => (
          <ChatMessageDisplay 
            key={index} 
            message={msg} 
            isTranslating={translatingMessageIndex === index}
            onTranslate={(lang) => handleTranslate(index, lang)}
            areOnlineActionsAvailable={isOnline}
            isFetchingThisAudio={audioLoadingIndex === index}
            isPlayingThisAudio={audioPlayingIndex === index}
            onPlayAudio={() => playAudio(msg.content, index)}
          />
        ))}
         {isSending && (
            <div className="chat-message assistant-message is-thinking">
                <div className="avatar"><Bot className="h-5 w-5" /></div>
                <div className="message-content"><div className="typing-indicator"><span></span><span></span><span></span></div></div>
            </div>
        )}
      </div>

      <div className="chat-footer">
        <form onSubmit={handleSendMessage} className="chat-input-form">
          {speechApiSupported && (
            <div className="voice-lang-selector">
                <Languages className="h-4 w-4" />
                <select value={speechLang} onChange={(e) => setSpeechLang(e.target.value)} className="lang-select-native">
                    {speechLanguages.map(l => <option key={l.code} value={l.code}>{l.name}</option>)}
                </select>
            </div>
          )}
          <input
            type="text"
            value={input}
            onChange={(e) => setInput(e.target.value)}
            placeholder={isRecording ? "Listening..." : "Type a message..."}
            className="chat-input"
            disabled={isSending}
          />
          {speechApiSupported && (
            <button type="button" className={`chat-tool-btn ${isRecording ? 'is-recording' : ''}`} onClick={handleMicClick}>
                {isRecording ? <MicOff className="h-5 w-5" /> : <Mic className="h-5 w-5" />}
            </button>
          )}
          <button type="submit" className="chat-send-btn" disabled={!input.trim() || isSending}>
            {isSending ? <Loader2 className="h-5 w-5 animate-spin" /> : <ArrowUp className="h-5 w-5" />}
          </button>
        </form>
      </div>
    </div>
  );
}
