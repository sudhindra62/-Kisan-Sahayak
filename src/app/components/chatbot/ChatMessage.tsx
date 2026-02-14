'use client';

import { Bot, Languages, User, Loader2, Volume2, Waves } from 'lucide-react';
import type { ChatMessage } from '@/ai/schemas';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Button } from '@/components/ui/button';
import { useState } from 'react';

type ChatMessageDisplayProps = {
  message: ChatMessage;
  onTranslate: (targetLanguage: string) => void;
  isTranslating: boolean;
  isAudioAvailable: boolean;
  isCurrentlyPlaying: boolean;
  onPlayAudio: () => void;
};

const targetLanguages = [
    'English', 'Hindi', 'Marathi', 'Kannada', 'Telugu', 
    'Tamil', 'Bengali', 'Gujarati', 'Punjabi', 'Malayalam'
];

export default function ChatMessageDisplay({ 
  message, 
  onTranslate, 
  isTranslating,
  isAudioAvailable,
  isCurrentlyPlaying,
  onPlayAudio,
}: ChatMessageDisplayProps) {
  const isUser = message.role === 'user';
  const [popoverOpen, setPopoverOpen] = useState(false);

  const handleLanguageSelect = (lang: string) => {
    setPopoverOpen(false);
    onTranslate(lang);
  }

  return (
    <div className={`chat-message ${isUser ? 'user-message' : 'assistant-message'}`}>
      <div className="avatar">
        {isUser ? <User className="h-5 w-5" /> : <Bot className="h-5 w-5" />}
      </div>
      <div className="message-content">
        <p>{message.content}</p>
      </div>
      
      {!isUser && (
        <div className="message-actions">
          {isAudioAvailable && (
            <button 
              className="translate-btn" 
              title="Play audio"
              onClick={onPlayAudio}
              disabled={isCurrentlyPlaying}
            >
              {isCurrentlyPlaying ? (
                 <Waves className="h-4 w-4 text-amber-400" />
              ) : (
                 <Volume2 className="h-4 w-4" />
              )}
            </button>
          )}
          {isTranslating ? (
            <div className="action-spinner">
                <Loader2 className="h-4 w-4 animate-spin text-slate-400" />
            </div>
          ) : (
            <Popover open={popoverOpen} onOpenChange={setPopoverOpen}>
                <PopoverTrigger asChild>
                    <button className="translate-btn" title="Translate message">
                        <Languages className="h-4 w-4" />
                    </button>
                </PopoverTrigger>
                <PopoverContent className="w-auto p-2 bg-slate-800 border-slate-700" side="top" align="start">
                    <p className="p-2 text-xs font-medium text-slate-400">Translate to:</p>
                    <div className="grid grid-cols-2 gap-1">
                        {targetLanguages.map(lang => (
                            <Button
                                key={lang}
                                variant="ghost"
                                size="sm"
                                className="justify-start px-2 py-1 h-auto text-white hover:bg-slate-700 hover:text-white"
                                onClick={() => handleLanguageSelect(lang)}
                            >
                                {lang}
                            </Button>
                        ))}
                    </div>
                </PopoverContent>
            </Popover>
          )}
        </div>
      )}
    </div>
  );
}
