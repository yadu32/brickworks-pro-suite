import React, { useState, useRef, useEffect } from 'react';
import { Send, Mic, BarChart3, DollarSign, Package, HelpCircle } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { useToast } from '@/hooks/use-toast';

interface ChatMessage {
  id: string;
  content: string;
  role: 'user' | 'assistant';
  timestamp: Date;
  status?: 'sent' | 'delivered' | 'error';
}

interface AIResponse {
  success: boolean;
  message: string;
  action?: string;
  data?: any;
}

const AIAssistant = () => {
  const [messages, setMessages] = useState<ChatMessage[]>([
    {
      id: '1',
      content: 'Hello! I\'m your BrickWorks AI Assistant. I can help you add sales, check production data, manage inventory, and answer questions about your factory. Try asking me something!',
      role: 'assistant',
      timestamp: new Date(),
    }
  ]);
  const [inputValue, setInputValue] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [isTyping, setIsTyping] = useState(false);
  const [sessionId] = useState(() => {
    const existing = sessionStorage.getItem('ai_session_id');
    if (existing) return existing;
    const newId = `session_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    sessionStorage.setItem('ai_session_id', newId);
    return newId;
  });
  
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  const { toast } = useToast();

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages, isTyping]);

  const addChatMessage = (content: string, role: 'user' | 'assistant', status: 'sent' | 'delivered' | 'error' = 'delivered') => {
    const newMessage: ChatMessage = {
      id: `msg_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
      content,
      role,
      timestamp: new Date(),
      status,
    };
    setMessages(prev => [...prev, newMessage]);
  };

  const showSuccessToast = (message: string) => {
    toast({
      title: "Success",
      description: message,
      className: "bg-green-600 text-white border-green-600",
    });
  };

  const showErrorToast = (message: string) => {
    toast({
      title: "Error",
      description: message,
      variant: "destructive",
    });
  };

  const handleAIResponse = (result: AIResponse) => {
    if (result.success) {
      addChatMessage(result.message, 'assistant');
      
      // Handle specific actions
      if (result.action === 'sale_added') {
        showSuccessToast('Sale recorded successfully!');
        // Trigger refresh of sales data if needed
        window.dispatchEvent(new CustomEvent('refreshSalesData'));
      } else if (result.action === 'production_added') {
        showSuccessToast('Production entry added!');
        // Trigger refresh of production data if needed
        window.dispatchEvent(new CustomEvent('refreshProductionData'));
      } else if (result.action === 'material_usage_added') {
        showSuccessToast('Material usage recorded!');
        // Trigger refresh of materials data if needed
        window.dispatchEvent(new CustomEvent('refreshMaterialsData'));
      }
    } else {
      addChatMessage(result.message || 'An error occurred', 'assistant', 'error');
      showErrorToast(result.message || 'Failed to process your request');
    }
  };

  const sendMessageToAI = async (message: string) => {
    setIsLoading(true);
    setIsTyping(true);
    
    try {
      const response = await fetch('http://localhost:5678/webhook-test/brickworks-ai-agent', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Accept': 'application/json'
        },
        body: JSON.stringify({
          message: message,
          userId: 'brickworks_user',
          sessionId: sessionId,
          timestamp: new Date().toISOString(),
          source: 'brickworks_app'
        })
      });

      if (!response.ok) {
        throw new Error(`HTTP ${response.status}: ${response.statusText}`);
      }

      const result = await response.json();
      handleAIResponse(result);
      
    } catch (error) {
      console.error('AI webhook error:', error);
      addChatMessage('Sorry, I encountered an error connecting to the AI assistant. Please check if the N8N webhook is running and try again.', 'assistant', 'error');
      showErrorToast('Connection failed. Please check your N8N webhook endpoint.');
    } finally {
      setIsLoading(false);
      setIsTyping(false);
    }
  };

  const handleSendMessage = async () => {
    if (!inputValue.trim() || isLoading) return;

    const userMessage = inputValue.trim();
    setInputValue('');
    
    // Add user message to chat
    addChatMessage(userMessage, 'user', 'sent');
    
    // Send to AI
    await sendMessageToAI(userMessage);
    
    // Focus input for next message
    setTimeout(() => inputRef.current?.focus(), 100);
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSendMessage();
    }
  };

  const handleQuickCommand = (command: string) => {
    setInputValue(command);
    inputRef.current?.focus();
  };

  const quickCommands = [
    { icon: BarChart3, label: "Today's Stats", command: "Show me today's production and sales summary" },
    { icon: DollarSign, label: "Add Sale", command: "Which customer bought how many bricks?" },
    { icon: Package, label: "Stock Check", command: "What is my current inventory and material stock?" },
    { icon: HelpCircle, label: "Help", command: "Show me command examples" },
  ];

  return (
    <div className="min-h-screen bg-background">
      <div className="max-w-6xl mx-auto p-6">
        {/* Header */}
        <div className="mb-6">
          <h1 className="text-3xl font-bold text-foreground mb-2">🤖 AI Assistant</h1>
          <p className="text-muted-foreground text-lg">Chat with your factory assistant for queries and commands</p>
          <div className="mt-4">
            <div className="card-dark p-4 inline-block">
              <p className="text-sm text-secondary">Session Active • AI Commands Ready</p>
            </div>
          </div>
        </div>

        {/* Chat Container */}
        <div className="card-dark min-h-[600px] flex flex-col">
          {/* Messages Area */}
          <div className="flex-1 p-6 overflow-y-auto max-h-[500px]">
            <div className="space-y-4">
              {messages.map((message) => (
                <div
                  key={message.id}
                  className={`flex ${message.role === 'user' ? 'justify-end' : 'justify-start'}`}
                >
                  <div
                    className={`max-w-[80%] rounded-lg p-4 ${
                      message.role === 'user'
                        ? 'bg-primary text-primary-foreground'
                        : message.status === 'error'
                        ? 'bg-destructive/20 text-destructive border border-destructive/30'
                        : 'bg-secondary text-secondary-foreground'
                    }`}
                  >
                    <p className="text-sm leading-relaxed">{message.content}</p>
                    <p className="text-xs opacity-70 mt-2">
                      {message.timestamp.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                      {message.status === 'error' && ' • Failed'}
                    </p>
                  </div>
                </div>
              ))}
              
              {/* Typing Indicator */}
              {isTyping && (
                <div className="flex justify-start">
                  <div className="bg-secondary text-secondary-foreground rounded-lg p-4 max-w-[80%]">
                    <div className="flex items-center space-x-2">
                      <div className="flex space-x-1">
                        <div className="w-2 h-2 bg-primary rounded-full animate-bounce"></div>
                        <div className="w-2 h-2 bg-primary rounded-full animate-bounce" style={{ animationDelay: '0.1s' }}></div>
                        <div className="w-2 h-2 bg-primary rounded-full animate-bounce" style={{ animationDelay: '0.2s' }}></div>
                      </div>
                      <span className="text-sm text-muted-foreground">AI Assistant is typing...</span>
                    </div>
                  </div>
                </div>
              )}
            </div>
            <div ref={messagesEndRef} />
          </div>

          {/* Quick Commands */}
          <div className="border-t border-border p-4">
            <div className="grid grid-cols-2 md:grid-cols-4 gap-2 mb-4">
              {quickCommands.map((cmd, index) => {
                const Icon = cmd.icon;
                return (
                  <Button
                    key={index}
                    variant="outline"
                    size="sm"
                    onClick={() => handleQuickCommand(cmd.command)}
                    className="flex items-center gap-2 h-auto py-2 text-xs"
                    disabled={isLoading}
                  >
                    <Icon className="h-3 w-3" />
                    {cmd.label}
                  </Button>
                );
              })}
            </div>

            {/* Input Area */}
            <div className="flex items-center space-x-2">
              <div className="flex-1 relative">
                <Input
                  ref={inputRef}
                  value={inputValue}
                  onChange={(e) => setInputValue(e.target.value)}
                  onKeyPress={handleKeyPress}
                  placeholder="Ask about your factory or give commands..."
                  disabled={isLoading}
                  className="pr-12 bg-background border-border focus:border-primary"
                  autoFocus
                />
                <Button
                  size="sm"
                  variant="ghost"
                  className="absolute right-1 top-1/2 -translate-y-1/2 h-8 w-8 p-0 hover:bg-accent"
                  disabled={true}
                  title="Voice input (coming soon)"
                >
                  <Mic className="h-4 w-4 text-muted-foreground" />
                </Button>
              </div>
              <Button
                onClick={handleSendMessage}
                disabled={!inputValue.trim() || isLoading}
                className="h-10 px-4"
              >
                {isLoading ? (
                  <div className="w-4 h-4 border-2 border-current border-t-transparent rounded-full animate-spin" />
                ) : (
                  <Send className="h-4 w-4" />
                )}
              </Button>
            </div>
          </div>
        </div>

        {/* Command Examples */}
        <div className="mt-6 card-dark p-6">
          <h3 className="text-lg font-semibold text-foreground mb-4">Example Commands</h3>
          <div className="grid md:grid-cols-2 gap-6">
            <div>
              <h4 className="text-primary font-medium mb-2">Data Entry Commands:</h4>
              <ul className="space-y-1 text-sm text-muted-foreground">
                <li>• "Kumara bought 50 bricks at ₹32 each, paid ₹1000"</li>
                <li>• "Add production: made 200 4-inch bricks today"</li>
                <li>• "Material usage: used 3 bags of cement for batch production"</li>
                <li>• "Ravi paid ₹5000 towards his outstanding balance"</li>
              </ul>
            </div>
            <div>
              <h4 className="text-primary font-medium mb-2">Query Commands:</h4>
              <ul className="space-y-1 text-sm text-muted-foreground">
                <li>• "What is today's total production?"</li>
                <li>• "Show me all customers with unpaid balances"</li>
                <li>• "How much cement stock do we have?"</li>
                <li>• "Which customer owes the most money?"</li>
              </ul>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default AIAssistant;