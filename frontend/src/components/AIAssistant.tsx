import React, { useState, useRef, useEffect } from 'react';
import { Send, Trash2 } from 'lucide-react';

interface ChatMessage {
  content: string;
  role: 'user' | 'assistant';
  timestamp: string;
  isError?: boolean;
}

interface AIResponse {
  success: boolean;
  message: string;
  action?: string;
  data?: any;
}

type Environment = 'test' | 'prod';

const STORAGE_KEY = 'ai_chat_messages';
const MAX_MESSAGES = 25;

const AIAssistant = () => {
  const [env, setEnv] = useState<Environment>('test');
  const [messages, setMessages] = useState<ChatMessage[]>(() => {
    const stored = sessionStorage.getItem(STORAGE_KEY);
    return stored ? JSON.parse(stored) : [];
  });
  const [input, setInput] = useState('');
  const [isTyping, setIsTyping] = useState(false);
  const [sessionId] = useState(() => {
    const existing = sessionStorage.getItem('ai_session_id');
    if (existing) return existing;
    const newId = `session_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    sessionStorage.setItem('ai_session_id', newId);
    return newId;
  });
  
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLTextAreaElement>(null);

  const getEndpoint = () => {
    return env === 'test'
      ? 'http://localhost:5678/webhook-test/brickworks-agent'
      : 'http://localhost:5678/webhook/brickworks-agent';
  };

  const addMessage = (content: string, role: 'user' | 'assistant', isError = false) => {
    const newMessage: ChatMessage = {
      content,
      role,
      timestamp: new Date().toISOString(),
      isError,
    };
    setMessages(prev => {
      const updated = [...prev, newMessage].slice(-MAX_MESSAGES);
      sessionStorage.setItem(STORAGE_KEY, JSON.stringify(updated));
      return updated;
    });
  };

  const clearChat = () => {
    setMessages([]);
    sessionStorage.removeItem(STORAGE_KEY);
  };

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages, isTyping]);

  const sendMessage = async (messageText: string) => {
    setIsTyping(true);
    
    try {
      const response = await fetch(getEndpoint(), {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Accept': 'application/json'
        },
        body: JSON.stringify({
          message: messageText,
          userId: 'brickworks_user',
          sessionId,
          timestamp: new Date().toISOString(),
          source: 'brickworks_app'
        })
      });

      if (!response.ok) {
        throw new Error(`HTTP ${response.status}`);
      }

      const result: AIResponse = await response.json();
      
      if (result.success) {
        addMessage(result.message, 'assistant');
      } else {
        addMessage(result.message || 'An error occurred', 'assistant', true);
      }
      
    } catch (error) {
      console.error('AI webhook error:', error);
      addMessage('Connection failed. Tap to retry.', 'assistant', true);
    } finally {
      setIsTyping(false);
    }
  };

  const handleSend = async () => {
    if (!input.trim() || isTyping) return;
    
    const userMessage = input.trim();
    setInput('');
    addMessage(userMessage, 'user');
    await sendMessage(userMessage);
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  const handleRetry = async (message: ChatMessage) => {
    if (message.role === 'user') {
      await sendMessage(message.content);
    }
  };

  const quickPrompts = [
    "This month profit",
    "Top due customers",
    "Production vs sales",
    "Material usage this week"
  ];

  return (
    <div className="min-h-screen flex flex-col" style={{ backgroundColor: '#1C1C1E' }}>
      {/* Header */}
      <header className="flex items-center justify-between px-4 py-3 border-b" style={{ borderColor: '#2A2A2E' }}>
        <h1 className="text-lg font-semibold" style={{ color: '#FFFFFF' }}>AI Assistant</h1>
        
        {/* Environment Toggle */}
        <div className="flex items-center gap-2">
          <button
            onClick={() => setEnv('test')}
            className="px-3 py-1 text-sm rounded-md transition-colors"
            style={{
              backgroundColor: env === 'test' ? '#FF6B00' : 'transparent',
              color: env === 'test' ? '#FFFFFF' : '#9A9AA0',
              border: '1px solid',
              borderColor: env === 'test' ? '#FF6B00' : '#2A2A2E'
            }}
          >
            Test
          </button>
          <button
            onClick={() => setEnv('prod')}
            className="px-3 py-1 text-sm rounded-md transition-colors"
            style={{
              backgroundColor: env === 'prod' ? '#FF6B00' : 'transparent',
              color: env === 'prod' ? '#FFFFFF' : '#9A9AA0',
              border: '1px solid',
              borderColor: env === 'prod' ? '#FF6B00' : '#2A2A2E'
            }}
          >
            Prod
          </button>
        </div>

        {/* Clear Button */}
        <button
          onClick={clearChat}
          className="p-2 rounded-md transition-colors"
          style={{ color: '#9A9AA0' }}
          title="Clear chat"
          onMouseEnter={(e) => e.currentTarget.style.backgroundColor = '#2A2A2E'}
          onMouseLeave={(e) => e.currentTarget.style.backgroundColor = 'transparent'}
        >
          <Trash2 className="h-5 w-5" />
        </button>
      </header>

      {/* Chat Area */}
      <div className="flex-1 overflow-y-auto px-4 py-4 space-y-3">
        {messages.length === 0 && (
          <div className="text-center py-8" style={{ color: '#9A9AA0' }}>
            <p className="text-sm">Start a conversation with your factory assistant</p>
          </div>
        )}
        
        {messages.map((msg, idx) => (
          <div
            key={idx}
            className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}
          >
            <div
              className="max-w-[85%] rounded-lg px-4 py-2 cursor-pointer"
              style={{
                backgroundColor: msg.role === 'user' 
                  ? '#FF6B00' 
                  : msg.isError 
                  ? '#DC2626' 
                  : '#2A2A2E',
                color: '#FFFFFF'
              }}
              onClick={() => msg.isError && handleRetry(msg)}
            >
              <p className="text-sm whitespace-pre-wrap break-words">{msg.content}</p>
              <p className="text-xs mt-1 opacity-70">
                {new Date(msg.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
              </p>
            </div>
          </div>
        ))}

        {/* Typing Indicator */}
        {isTyping && (
          <div className="flex justify-start">
            <div className="rounded-lg px-4 py-2" style={{ backgroundColor: '#2A2A2E', color: '#9A9AA0' }}>
              <p className="text-sm">Assistant is thinking...</p>
            </div>
          </div>
        )}
        
        <div ref={messagesEndRef} />
      </div>

      {/* Quick Prompts */}
      <div className="px-4 py-2 flex gap-2 overflow-x-auto">
        {quickPrompts.map((prompt, idx) => (
          <button
            key={idx}
            onClick={() => {
              setInput(prompt);
              inputRef.current?.focus();
            }}
            disabled={isTyping}
            className="px-3 py-1 text-xs rounded-md whitespace-nowrap transition-colors flex-shrink-0"
            style={{
              backgroundColor: '#2A2A2E',
              color: '#9A9AA0',
              border: '1px solid #2A2A2E'
            }}
            onMouseEnter={(e) => {
              e.currentTarget.style.borderColor = '#FF6B00';
              e.currentTarget.style.color = '#FFFFFF';
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.borderColor = '#2A2A2E';
              e.currentTarget.style.color = '#9A9AA0';
            }}
          >
            {prompt}
          </button>
        ))}
      </div>

      {/* Input Bar */}
      <div className="px-4 py-3 border-t" style={{ borderColor: '#2A2A2E' }}>
        <div className="flex items-end gap-2">
          <textarea
            ref={inputRef}
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder="Ask about sales, production, dues, profit…"
            disabled={isTyping}
            rows={1}
            className="flex-1 px-4 py-2 rounded-lg text-sm resize-none focus:outline-none"
            style={{
              backgroundColor: '#2A2A2E',
              color: '#FFFFFF',
              border: '1px solid #2A2A2E',
              minHeight: '40px',
              maxHeight: '120px'
            }}
            onFocus={(e) => e.target.style.borderColor = '#FF6B00'}
            onBlur={(e) => e.target.style.borderColor = '#2A2A2E'}
          />
          <button
            onClick={handleSend}
            disabled={!input.trim() || isTyping}
            className="p-2 rounded-lg transition-colors"
            style={{
              backgroundColor: input.trim() && !isTyping ? '#FF6B00' : '#2A2A2E',
              color: '#FFFFFF',
              minWidth: '40px',
              minHeight: '40px'
            }}
          >
            <Send className="h-5 w-5" />
          </button>
        </div>
      </div>
    </div>
  );
};

export default AIAssistant;