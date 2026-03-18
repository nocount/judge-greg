import { useState, useCallback } from 'react';
import { ChatMessage } from '@/types/ChatMessage';

function generateId(): string {
  return Math.random().toString(36).slice(2) + Date.now().toString(36);
}

export interface ChatViewModel {
  messages: ChatMessage[];
  inputText: string;
  isLoading: boolean;
  toolActivity: string | null;
  setInputText: (text: string) => void;
  sendMessage: () => Promise<void>;
  clearSession: () => void;
}

export function useChatViewModel(): ChatViewModel {
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [inputText, setInputText] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [toolActivity, setToolActivity] = useState<string | null>(null);

  const sendMessage = useCallback(async () => {
    const text = inputText.trim();
    if (!text || isLoading) return;

    const userMessage: ChatMessage = {
      id: generateId(),
      role: 'user',
      content: text,
      timestamp: new Date(),
    };

    setMessages((prev) => [...prev, userMessage]);
    setInputText('');
    setIsLoading(true);

    // Phase 1 stub — replaced in Phase 2 with real Claude API call
    await new Promise((resolve) => setTimeout(resolve, 1000));

    const stubReply: ChatMessage = {
      id: generateId(),
      role: 'judge',
      content: "I'm Judge Greg. Claude API integration coming in Phase 2.",
      timestamp: new Date(),
    };

    setMessages((prev) => [...prev, stubReply]);
    setIsLoading(false);
  }, [inputText, isLoading]);

  const clearSession = useCallback(() => {
    setMessages([]);
    setInputText('');
    setIsLoading(false);
    setToolActivity(null);
  }, []);

  return {
    messages,
    inputText,
    isLoading,
    toolActivity,
    setInputText,
    sendMessage,
    clearSession,
  };
}
