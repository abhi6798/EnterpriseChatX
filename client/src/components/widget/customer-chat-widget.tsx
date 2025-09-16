import { useState, useEffect } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { queryClient } from "@/lib/queryClient";
import { apiRequest } from "@/lib/queryClient";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { useChat } from "@/hooks/use-chat";
import { MessageSquare, X, Send, ShoppingCart, Undo, CreditCard, HelpCircle } from "lucide-react";
import { cn } from "@/lib/utils";
import type { Message } from "@shared/schema";

export default function CustomerChatWidget() {
  const [isOpen, setIsOpen] = useState(false);
  const [customerInfo, setCustomerInfo] = useState({
    name: '',
    email: ''
  });
  const [isInfoCollected, setIsInfoCollected] = useState(false);
  const [currentSessionId, setCurrentSessionId] = useState<string | null>(null);
  const [message, setMessage] = useState('');

  const { sendChatMessage, isConnected } = useChat(currentSessionId || '');

  const { data: messages = [] } = useQuery({
    queryKey: ['/api/chat/sessions', currentSessionId, 'messages'],
    enabled: !!currentSessionId,
    refetchInterval: 1000
  });

  const startChatMutation = useMutation({
    mutationFn: async (customerData: { customerName: string; customerEmail: string }) => {
      const response = await apiRequest('POST', '/api/chat/start', customerData);
      return response.json();
    },
    onSuccess: (data) => {
      setCurrentSessionId(data.session.sessionId);
      setIsInfoCollected(true);
      queryClient.invalidateQueries({ queryKey: ['/api/chat/sessions'] });
    }
  });

  const handleStartChat = (e: React.FormEvent) => {
    e.preventDefault();
    if (customerInfo.name && customerInfo.email) {
      startChatMutation.mutate({
        customerName: customerInfo.name,
        customerEmail: customerInfo.email
      });
    }
  };

  const handleSendMessage = (e: React.FormEvent) => {
    e.preventDefault();
    if (message.trim() && currentSessionId) {
      sendChatMessage(message.trim());
      setMessage('');
    }
  };

  const handleQuickReply = (replyType: string) => {
    const quickReplies = {
      'order-status': 'Hi, I need help checking my order status.',
      'return-product': 'I would like to return or exchange a product.',
      'billing-issue': 'I have a billing or payment issue that needs to be resolved.',
      'other': 'I have a question that needs assistance.'
    };

    const replyMessage = quickReplies[replyType as keyof typeof quickReplies];
    if (replyMessage && currentSessionId) {
      sendChatMessage(replyMessage);
    }
  };

  const formatTime = (timestamp?: Date | string) => {
    if (!timestamp) return '';
    const date = new Date(timestamp);
    return date.toLocaleTimeString('en-US', {
      hour: 'numeric',
      minute: '2-digit',
      hour12: true
    });
  };

  const getMessageSender = (message: Message) => {
    return message.senderType === 'customer' ? 'You' : 'Support Agent';
  };

  return (
    <div className="fixed bottom-6 right-6 z-50" data-testid="customer-chat-widget">
      {/* Chat Bubble */}
      <div className="relative">
        <Button
          className={cn(
            "w-14 h-14 rounded-full shadow-lg hover:scale-105 transition-transform",
            isOpen ? "bg-destructive hover:bg-destructive/90" : "bg-primary hover:bg-primary/90"
          )}
          onClick={() => setIsOpen(!isOpen)}
          data-testid="button-toggle-chat"
        >
          {isOpen ? (
            <X className="h-6 w-6" />
          ) : (
            <MessageSquare className="h-6 w-6" />
          )}
        </Button>
        
        {/* Notification Dot */}
        {!isOpen && messages.length > 0 && (
          <div className="absolute -top-1 -right-1 w-4 h-4 bg-destructive rounded-full flex items-center justify-center" data-testid="notification-dot">
            <span className="text-white text-xs font-bold">
              {messages.filter((m: Message) => m.senderType === 'agent').length}
            </span>
          </div>
        )}
      </div>

      {/* Chat Window */}
      {isOpen && (
        <div className="absolute bottom-16 right-0 w-80 h-96 bg-card border border-border rounded-lg shadow-2xl animate-in slide-in-from-bottom-2 duration-300" data-testid="chat-window">
          {/* Header */}
          <div className="bg-primary text-primary-foreground p-4 rounded-t-lg">
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-3">
                <Avatar className="w-8 h-8">
                  <AvatarImage src="https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?w=32&h=32&fit=crop&crop=face" />
                  <AvatarFallback>CS</AvatarFallback>
                </Avatar>
                <div>
                  <div className="font-semibold" data-testid="text-support-title">Customer Support</div>
                  <div className="text-xs opacity-90" data-testid="text-support-status">
                    {isConnected ? "We're online • Avg reply: 2 min" : "Connecting..."}
                  </div>
                </div>
              </div>
              <Button 
                variant="ghost" 
                size="icon" 
                className="text-primary-foreground hover:bg-primary/20"
                onClick={() => setIsOpen(false)}
                data-testid="button-close-chat"
              >
                <X className="h-4 w-4" />
              </Button>
            </div>
          </div>

          {/* Content */}
          <div className="flex-1 flex flex-col h-80">
            {!isInfoCollected ? (
              /* Customer Info Collection */
              <div className="flex-1 p-4">
                <div className="text-center mb-4">
                  <h3 className="font-semibold text-foreground mb-2" data-testid="title-start-chat">
                    Start a conversation
                  </h3>
                  <p className="text-sm text-muted-foreground">
                    Please provide your details to begin chatting with our support team.
                  </p>
                </div>
                
                <form onSubmit={handleStartChat} className="space-y-4">
                  <div>
                    <Input
                      placeholder="Your full name"
                      value={customerInfo.name}
                      onChange={(e) => setCustomerInfo(prev => ({ ...prev, name: e.target.value }))}
                      required
                      data-testid="input-customer-name"
                    />
                  </div>
                  <div>
                    <Input
                      type="email"
                      placeholder="Your email address"
                      value={customerInfo.email}
                      onChange={(e) => setCustomerInfo(prev => ({ ...prev, email: e.target.value }))}
                      required
                      data-testid="input-customer-email"
                    />
                  </div>
                  <Button 
                    type="submit" 
                    className="w-full"
                    disabled={startChatMutation.isPending || !customerInfo.name || !customerInfo.email}
                    data-testid="button-start-chat"
                  >
                    {startChatMutation.isPending ? "Starting chat..." : "Start Chat"}
                  </Button>
                </form>
              </div>
            ) : messages.length === 0 ? (
              /* Welcome Message and Quick Replies */
              <div className="flex-1 p-4 space-y-4">
                <div className="flex items-start space-x-2">
                  <Avatar className="w-6 h-6">
                    <AvatarImage src="https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?w=24&h=24&fit=crop&crop=face" />
                    <AvatarFallback>CS</AvatarFallback>
                  </Avatar>
                  <div className="bg-muted rounded-lg rounded-tl-sm p-3 max-w-xs">
                    <p className="text-sm text-foreground" data-testid="text-welcome-message">
                      Hi {customerInfo.name}! Welcome to our support. How can I help you today?
                    </p>
                    <span className="text-xs text-muted-foreground">Just now</span>
                  </div>
                </div>

                {/* Quick Reply Options */}
                <div className="space-y-2">
                  <p className="text-xs text-muted-foreground px-2">Quick options:</p>
                  <Button
                    variant="outline"
                    className="w-full justify-start text-sm h-auto p-3"
                    onClick={() => handleQuickReply('order-status')}
                    data-testid="quick-reply-order-status"
                  >
                    <ShoppingCart className="h-4 w-4 mr-2 text-muted-foreground" />
                    Check my order status
                  </Button>
                  <Button
                    variant="outline"
                    className="w-full justify-start text-sm h-auto p-3"
                    onClick={() => handleQuickReply('return-product')}
                    data-testid="quick-reply-return"
                  >
                    <Undo className="h-4 w-4 mr-2 text-muted-foreground" />
                    Return or exchange a product
                  </Button>
                  <Button
                    variant="outline"
                    className="w-full justify-start text-sm h-auto p-3"
                    onClick={() => handleQuickReply('billing-issue')}
                    data-testid="quick-reply-billing"
                  >
                    <CreditCard className="h-4 w-4 mr-2 text-muted-foreground" />
                    Billing or payment issue
                  </Button>
                  <Button
                    variant="outline"
                    className="w-full justify-start text-sm h-auto p-3"
                    onClick={() => handleQuickReply('other')}
                    data-testid="quick-reply-other"
                  >
                    <HelpCircle className="h-4 w-4 mr-2 text-muted-foreground" />
                    Other questions
                  </Button>
                </div>
              </div>
            ) : (
              /* Messages */
              <div className="flex-1 overflow-y-auto p-4 space-y-3" data-testid="messages-container">
                {messages.map((msg: Message) => (
                  <div key={msg.id} data-testid={`message-${msg.id}`}>
                    {msg.senderType === 'system' ? (
                      <div className="flex justify-center my-2">
                        <Badge variant="secondary" className="text-xs">
                          {msg.content}
                        </Badge>
                      </div>
                    ) : (
                      <div className={`flex items-start space-x-2 ${
                        msg.senderType === 'customer' ? 'flex-row-reverse space-x-reverse' : ''
                      }`}>
                        <Avatar className="w-6 h-6">
                          <AvatarFallback className="text-xs">
                            {msg.senderType === 'customer' ? customerInfo.name.charAt(0) : 'CS'}
                          </AvatarFallback>
                        </Avatar>
                        <div className={`max-w-xs ${msg.senderType === 'customer' ? 'ml-auto' : ''}`}>
                          <div className={`rounded-lg p-3 ${
                            msg.senderType === 'customer'
                              ? 'bg-primary text-primary-foreground rounded-tr-sm'
                              : 'bg-muted text-foreground rounded-tl-sm'
                          }`}>
                            <p className="text-sm">{msg.content}</p>
                          </div>
                          <div className={`flex items-center space-x-1 mt-1 text-xs text-muted-foreground ${
                            msg.senderType === 'customer' ? 'justify-end' : ''
                          }`}>
                            <span>{getMessageSender(msg)}</span>
                            <span>•</span>
                            <span>{formatTime(msg.timestamp)}</span>
                          </div>
                        </div>
                      </div>
                    )}
                  </div>
                ))}
              </div>
            )}

            {/* Input (only show if chat is started) */}
            {isInfoCollected && (
              <div className="p-4 border-t border-border">
                <form onSubmit={handleSendMessage} className="flex space-x-2">
                  <Input
                    placeholder="Type a message..."
                    value={message}
                    onChange={(e) => setMessage(e.target.value)}
                    className="flex-1"
                    disabled={!isConnected}
                    data-testid="input-customer-message"
                  />
                  <Button 
                    type="submit"
                    size="icon"
                    disabled={!message.trim() || !isConnected}
                    data-testid="button-send-customer-message"
                  >
                    <Send className="h-4 w-4" />
                  </Button>
                </form>
                {!isConnected && (
                  <p className="text-xs text-muted-foreground mt-1 text-center">
                    Connecting to support...
                  </p>
                )}
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
