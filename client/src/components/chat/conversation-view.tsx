import { useState, useEffect } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { queryClient } from "@/lib/queryClient";
import { apiRequest } from "@/lib/queryClient";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { useWebSocket } from "@/hooks/use-websocket";
import { useChat } from "@/hooks/use-chat";
import CustomerInfoPanel from "./customer-info-panel";
import MessageInput from "./message-input";
import { ArrowRight, X, ExternalLink, Phone, ArrowUp, Undo } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import type { ChatSession, Customer, User, Message } from "@shared/schema";

interface ConversationViewProps {
  session?: ChatSession & { customer?: Customer; agent?: User };
  onSessionUpdate?: () => void;
}

export default function ConversationView({ session, onSessionUpdate }: ConversationViewProps) {
  const [transferAgent, setTransferAgent] = useState<string>("");
  const { toast } = useToast();

  const { data: agents = [] } = useQuery({
    queryKey: ['/api/agents'],
    enabled: !!session
  });

  const { data: messages = [] } = useQuery({
    queryKey: ['/api/chat/sessions', session?.sessionId, 'messages'],
    enabled: !!session?.sessionId,
    refetchInterval: 1000
  });

  const { sendMessage } = useWebSocket('/ws');
  const { sendChatMessage, isConnected } = useChat(session?.sessionId || '');

  const transferMutation = useMutation({
    mutationFn: async ({ sessionId, newAgentId, reason }: { sessionId: string, newAgentId: string, reason: string }) => {
      const response = await apiRequest('POST', '/api/chat/transfer', {
        sessionId,
        newAgentId,
        reason
      });
      return response.json();
    },
    onSuccess: () => {
      toast({ title: "Chat transferred successfully" });
      queryClient.invalidateQueries({ queryKey: ['/api/chat/sessions'] });
      onSessionUpdate?.();
      setTransferAgent("");
    },
    onError: () => {
      toast({ title: "Failed to transfer chat", variant: "destructive" });
    }
  });

  const endSessionMutation = useMutation({
    mutationFn: async (sessionId: string) => {
      const response = await apiRequest('POST', `/api/chat/end/${sessionId}`, {});
      return response.json();
    },
    onSuccess: () => {
      toast({ title: "Chat session ended" });
      queryClient.invalidateQueries({ queryKey: ['/api/chat/sessions'] });
      onSessionUpdate?.();
    },
    onError: () => {
      toast({ title: "Failed to end chat session", variant: "destructive" });
    }
  });

  const handleTransfer = () => {
    if (!session?.sessionId || !transferAgent) return;
    
    const targetAgent = agents.find((agent: User) => agent.id === transferAgent);
    if (!targetAgent) return;

    transferMutation.mutate({
      sessionId: session.sessionId,
      newAgentId: transferAgent,
      reason: `Manual transfer to ${targetAgent.role.replace('_', ' ')}`
    });
  };

  const handleEndSession = () => {
    if (!session?.sessionId) return;
    endSessionMutation.mutate(session.sessionId);
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
    if (message.senderType === 'customer') {
      return session?.customer?.name || 'Customer';
    } else if (message.senderType === 'agent') {
      return session?.agent?.name || 'Agent';
    } else {
      return 'System';
    }
  };

  const getRoleColor = (role?: string) => {
    switch (role) {
      case 'agent': return 'bg-secondary text-secondary-foreground';
      case 'senior_agent': return 'bg-warning text-white';
      case 'team_lead': return 'bg-accent text-accent-foreground';
      case 'admin': return 'bg-destructive text-destructive-foreground';
      default: return 'bg-muted text-muted-foreground';
    }
  };

  const getRoleLabel = (role?: string) => {
    switch (role) {
      case 'agent': return 'Agent';
      case 'senior_agent': return 'Senior Agent';
      case 'team_lead': return 'Team Lead';
      case 'admin': return 'Admin';
      default: return 'Unknown';
    }
  };

  if (!session) {
    return (
      <div className="flex-1 flex items-center justify-center bg-muted/20" data-testid="empty-state-conversation">
        <div className="text-center">
          <div className="w-12 h-12 mx-auto mb-4 bg-muted rounded-full flex items-center justify-center">
            <ArrowRight className="h-6 w-6 text-muted-foreground" />
          </div>
          <h3 className="text-lg font-medium text-foreground">Select a conversation</h3>
          <p className="text-muted-foreground">Choose a chat from the sidebar to start viewing the conversation</p>
        </div>
      </div>
    );
  }

  return (
    <div className="flex-1 flex" data-testid="conversation-view">
      {/* Chat Messages */}
      <div className="flex-1 flex flex-col">
        {/* Chat Header */}
        <div className="bg-card border-b border-border px-6 py-4" data-testid="chat-header">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-4">
              <Avatar className="w-12 h-12">
                <AvatarFallback>
                  {session.customer?.name.charAt(0) || 'U'}
                </AvatarFallback>
              </Avatar>
              <div>
                <h3 className="font-semibold text-foreground" data-testid="text-customer-name">
                  {session.customer?.name || 'Unknown Customer'}
                </h3>
                <p className="text-sm text-muted-foreground" data-testid="text-customer-email">
                  {session.customer?.email || 'No email'}
                </p>
                <div className="flex items-center space-x-4 mt-1">
                  <span className="text-xs text-muted-foreground">
                    Session ID: <span data-testid="text-session-id">{session.sessionId}</span>
                  </span>
                  <span className="text-xs text-muted-foreground">
                    Started: <span data-testid="text-session-start">{formatTime(session.startTime)}</span>
                  </span>
                </div>
              </div>
            </div>
            
            <div className="flex items-center space-x-3">
              {/* Agent Transfer Controls */}
              <div className="flex items-center space-x-2">
                <Select value={transferAgent} onValueChange={setTransferAgent}>
                  <SelectTrigger className="w-48" data-testid="select-transfer-agent">
                    <SelectValue placeholder="Transfer to..." />
                  </SelectTrigger>
                  <SelectContent>
                    {agents.map((agent: User) => (
                      <SelectItem key={agent.id} value={agent.id}>
                        {agent.name} ({getRoleLabel(agent.role)})
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                <Button 
                  onClick={handleTransfer}
                  disabled={!transferAgent || transferMutation.isPending}
                  data-testid="button-initiate-transfer"
                >
                  <ArrowRight className="h-4 w-4 mr-2" />
                  Transfer
                </Button>
              </div>
              
              <Button 
                variant="destructive"
                onClick={handleEndSession}
                disabled={endSessionMutation.isPending}
                data-testid="button-end-chat"
              >
                <X className="h-4 w-4 mr-2" />
                End Chat
              </Button>
            </div>
          </div>
        </div>

        {/* Messages Area */}
        <div className="flex-1 overflow-y-auto p-6 space-y-4" data-testid="messages-area">
          {messages.length === 0 ? (
            <div className="flex items-center justify-center h-32 text-muted-foreground">
              <p>No messages in this conversation</p>
            </div>
          ) : (
            messages.map((message: Message) => (
              <div key={message.id} data-testid={`message-${message.id}`}>
                {message.senderType === 'system' ? (
                  <div className="flex justify-center my-4">
                    <div className="bg-accent bg-opacity-10 text-accent px-3 py-2 rounded-full text-sm font-medium">
                      <ArrowRight className="inline h-4 w-4 mr-2" />
                      {message.content}
                    </div>
                  </div>
                ) : (
                  <div className={`flex items-start space-x-3 ${
                    message.senderType === 'agent' ? 'flex-row-reverse' : ''
                  }`}>
                    <Avatar className="w-8 h-8">
                      <AvatarFallback>
                        {getMessageSender(message).charAt(0)}
                      </AvatarFallback>
                    </Avatar>
                    <div className={`max-w-md ${message.senderType === 'agent' ? 'ml-auto' : ''}`}>
                      <div className={`rounded-2xl px-4 py-3 ${
                        message.senderType === 'customer'
                          ? 'bg-muted rounded-tl-sm text-foreground'
                          : 'bg-primary text-primary-foreground rounded-tr-sm'
                      }`}>
                        <p>{message.content}</p>
                      </div>
                      <div className={`flex items-center space-x-2 mt-2 ${
                        message.senderType === 'agent' ? 'justify-end' : ''
                      }`}>
                        <span className="text-xs text-muted-foreground">
                          {getMessageSender(message)}
                          {message.senderType === 'agent' && session.agent && (
                            <span className="ml-1">
                              ({getRoleLabel(session.agent.role)})
                            </span>
                          )}
                        </span>
                        <span className="text-xs text-muted-foreground">
                          {formatTime(message.timestamp)}
                        </span>
                      </div>
                    </div>
                  </div>
                )}
              </div>
            ))
          )}
        </div>

        {/* Message Input */}
        <MessageInput
          sessionId={session.sessionId}
          onSendMessage={sendChatMessage}
          disabled={!isConnected || session.status !== 'active'}
        />
      </div>

      {/* Right Sidebar - Customer Info */}
      <CustomerInfoPanel 
        session={session}
        onQuickAction={(action) => {
          console.log('Quick action:', action);
          // Implement quick actions
        }}
      />
    </div>
  );
}
