'use client';

import { useState, useRef, useEffect } from 'react';
import { useFirestore, useDoc, useMemoFirebase, setDocument } from '@/firebase';
import { doc } from 'firebase/firestore';
import { ArrowLeft, ArrowUp, Bot, WifiOff, Mic, MicOff, Languages } from 'lucide-react';
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
  originalContent?: string; // The original English message from the AI
}

const initialMessage: DisplayMessage = { role: 'model', content: 'Hello! I am your KisanSahayak assistant. How can I help you today?' };
initialMessage.originalContent = initialMessage.content;

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
        const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
        setSpeechApiSupported(!!SpeechRecognition);
    }
  }, []);

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
      if (recognitionRef.current) {
        recognitionRef.current.abort();
      }
    };
  }, []);

  const chatHistoryRef = useMemoFirebase(() => 
    firestore ? doc(firestore, 'users', userId, 'chat_history', userId) : null
  , [firestore, userId]);
  
  const { data: chatHistoryDoc, isLoading: isHistoryLoading } = useDoc<{ messages: ChatMessage[] }>(chatHistoryRef);
  
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

  useEffect(() => {
    if (chatBodyRef.current) {
      chatBodyRef.current.scrollTop = chatBodyRef.current.scrollHeight;
    }
  }, [messages, isSending, translatingMessageIndex]);

  const handleTextToSpeech = async (textContent: string) => {
    if (!textContent) {
      return null;
    }
    // Check cache first
    if (audioDataCache[textContent]) {
      return audioDataCache[textContent];
    }

    const response = await textToSpeech({ text: textContent });

    if (response.error) {
        // The server now provides the user-friendly error message directly.
        toast({
            variant: 'destructive',
            title: 'Text-to-Speech Error',
            description: response.error,
        });
        return null;
    }
    
    // Only cache and return if there was no error
    setAudioDataCache(prev => ({...prev, [textContent]: response.audioData}));
    return response.audioData;
  }

  const playAudio = async (textContent: string | undefined, index: number) => {
    if (!textContent || !audioPlayerRef.current) return;
    
    // If clicking the currently playing message, stop it.
    if (audioPlayingIndex === index) {
        audioPlayerRef.current.pause(); // onPause handler will set playing index to null
        return;
    }

    // Stop any currently playing audio before fetching a new one
    if (audioPlayerRef.current && !audioPlayerRef.current.paused) {
        audioPlayerRef.current.pause();
    }

    setAudioLoadingIndex(index);
    try {
        const audioSrc = await handleTextToSpeech(textContent);
        
        // Guard against race conditions: if user clicked another button while this one was loading
        if (audioLoadingIndex !== index) return;

        if (audioSrc && audioPlayerRef.current) {
            audioPlayerRef.current.src = audioSrc;
            setAudioPlayingIndex(index);
            audioPlayerRef.current.play().catch(e => {
                toast({
                    variant: 'destructive',
                    title: 'Audio Playback Error',
                    description: 'Could not play the generated audio file.',
                });
                setAudioPlayingIndex(null); // Reset on error
            });
        }
    } finally {
        // Ensure loading state is cleared only if it belongs to this request
        if (audioLoadingIndex === index) {
            setAudioLoadingIndex(null);
        }
    }
  }

  const handleSendMessage = async (e?: React.FormEvent, messageContent?: string) => {
    if (e) e.preventDefault();
    const content = (messageContent || input).trim();
    if (!content || isSending) return;

    const userMessage: DisplayMessage = { role: 'user', content };
    const newMessages = [...messages, userMessage];

    setMessages(newMessages);
setInput('');
    setIsSending(true);

    let aiMessage: DisplayMessage;

    if (isOnline) {
      try {
        const historyForAI = messages.map((m) => ({
          role: m.role,
          content: m.originalContent || m.content,
        }));

        const aiResponse = await getChatbotResponse({
          farmerProfile,
          history: historyForAI,
          message: content,
        });

        aiMessage = {
          role: 'model',
          content: aiResponse,
          originalContent: aiResponse,
        };
      } catch (error) {
        const errorMessage = error instanceof Error ? error.message : 'An unknown error occurred.';
        console.error('Failed to get chat response:', error);
        aiMessage = {
          role: 'model',
          content: `Sorry, I'm having trouble connecting. Reason: ${errorMessage}`,
          originalContent: `Sorry, I'm having trouble connecting. Reason: ${errorMessage}`,
        };
      }
    } else {
      const offlineResponse = getOfflineChatbotResponse(content, farmerProfile);
      aiMessage = {
        role: 'model',
        content: offlineResponse,
        originalContent: offlineResponse,
      };
    }

    const finalMessages = [...newMessages, aiMessage];
    setMessages(finalMessages);
    setIsSending(false);

    // Save history to Firestore
    if (isOnline && chatHistoryRef && !aiMessage.content.startsWith('Sorry')) {
      const historyToSave = finalMessages.map((m) => ({
        role: m.role,
        content: m.originalContent || m.content,
      }));
      setDocument(
        chatHistoryRef,
        {
          id: userId,
          messages: historyToSave,
          updatedAt: new Date(),
        },
        { merge: true }
      );
    }
  };

  const handleTranslateMessage = async (messageIndex: number, targetLanguage: string) => {
    const messageToTranslate = messages[messageIndex];
    if (messageToTranslate.role !== 'model' || !messageToTranslate.originalContent) return;

    // Stop audio before translating
    if (audioPlayerRef.current && !audioPlayerRef.current.paused) {
      audioPlayerRef.current.pause();
    }

    if (targetLanguage === 'English') {
        const updatedMessages = [...messages];
        updatedMessages[messageIndex] = {
            ...updatedMessages[messageIndex],
            content: messageToTranslate.originalContent,
        };
        setMessages(updatedMessages);
        playAudio(messageToTranslate.originalContent, messageIndex);
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
        playAudio(response.translatedText, messageIndex);
    } catch (error) {
        const errorMessage = error instanceof Error ? error.message : 'An unknown error occurred.';
        toast({
            variant: 'destructive',
            title: 'Translation Error',
            description: `Could not translate message. Reason: ${errorMessage}`,
        });
    } finally {
        setTranslatingMessageIndex(null);
    }
  };

  const handleMicClick = () => {
    if (isRecording) {
      recognitionRef.current?.stop();
      return;
    }
    
    if (!speechApiSupported) {
        toast({
            variant: 'destructive',
            title: 'Unsupported Browser',
            description: "Sorry, your browser doesn't support speech recognition.",
        });
        return;
    }
    
    const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
    recognitionRef.current = new SpeechRecognition();
    recognitionRef.current.lang = speechLang;
    recognitionRef.current.continuous = false;
    recognitionRef.current.interimResults = true;

    recognitionRef.current.onstart = () => setIsRecording(true);
    recognitionRef.current.onend = () => setIsRecording(false);
    
    recognitionRef.current.onerror = (event: any) => {
        console.error('Speech recognition error', event.error);
        let errorMessage = 'An unknown error occurred during speech recognition.';
        switch (event.error) {
            case 'no-speech':
                errorMessage = 'No speech was detected. Please try again.';
                break;
            case 'audio-capture':
                errorMessage = 'Could not start audio capture. Please check your microphone.';
                break;
            case 'not-allowed':
                errorMessage = 'Microphone access was denied. Please allow microphone access in your browser settings.';
                break;
            case 'network':
                errorMessage = 'A network error occurred. Please check your connection.';
                break;
            case 'aborted':
                return;
        }
        toast({
            variant: 'destructive',
            title: 'Voice Error',
            description: errorMessage,
        });
        setIsRecording(false);
    };
    
    recognitionRef.current.onresult = (event: any) => {
        const transcript = Array.from(event.results)
            .map((result: any) => result[0])
            .map((result: any) => result.transcript)
            .join('');
        setInput(transcript);
        if (event.results[0].isFinal) {
            handleSendMessage(undefined, transcript);
        }
    };
    
    recognitionRef.current.start();
  };

  const isChatDisabled = isSending || isHistoryLoading;

  return (
    <div className="chat-page-container">
      <audio ref={audioPlayerRef} onEnded={() => setAudioPlayingIndex(null)} onPause={() => setAudioPlayingIndex(null)} className="hidden" />
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
            areOnlineActionsAvailable={isOnline}
            isFetchingThisAudio={audioLoadingIndex === index}
            isPlayingThisAudio={audioPlayingIndex === index}
            isAnyAudioFetching={audioLoadingIndex !== null}
            onPlayAudio={() => playAudio(msg.content, index)}
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
          {speechApiSupported && (<div className="voice-lang-selector">
            <Languages className="h-4 w-4" />
            <select
                value={speechLang}
                onChange={(e) => setSpeechLang(e.target.value)}
                className="lang-select-native"
                disabled={isRecording}
            >
                {speechLanguages.map(lang => (
                    <option key={lang.code} value={lang.code}>{lang.name}</option>
                ))}
            </select>
          </div>)}
          <input
            type="text"
            value={input}
            onChange={(e) => setInput(e.target.value)}
            placeholder={isRecording ? "Listening..." : "Ask me anything..."}
            className="chat-input"
            disabled={isChatDisabled}
          />
          {speechApiSupported && (
            <button type="button" className={`chat-tool-btn ${isRecording ? 'is-recording' : ''}`} onClick={handleMicClick} disabled={isChatDisabled}>
                {isRecording ? <MicOff className="h-5 w-5" /> : <Mic className="h-5 w-5" />}
            </button>
          )}
          <button type="submit" className="chat-send-btn" disabled={!input.trim() || isChatDisabled}>
            <ArrowUp className="h-5 w-5" />
          </button>
        </form>
      </div>
    </div>
  );
}
