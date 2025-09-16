import { useState, useEffect } from "react";
import { useQuery } from "@tanstack/react-query";
import ChatSidebar from "@/components/chat/chat-sidebar";
import ConversationView from "@/components/chat/conversation-view";
import SOPModal from "@/components/sop/sop-modal";
import ExportCenter from "@/components/export/export-center";
import { useWebSocket } from "@/hooks/use-websocket";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Bell, MessageSquare, Book, Download, BarChart3 } from "lucide-react";
import type { ChatSession } from "@shared/schema";

export default function Dashboard() {
  const [selectedSessionId, setSelectedSessionId] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState<'conversation' | 'sop' | 'exports' | 'analytics'>('conversation');
  const [currentUser] = useState({
    id: 'admin-1',
    name: 'Sarah Chen',
    role: 'System Admin',
    avatar: 'https://images.unsplash.com/photo-1494790108755-2616b612b786?w=32&h=32&fit=crop&crop=face'
  });

  const { data: stats } = useQuery({
    queryKey: ['/api/dashboard/stats'],
    refetchInterval: 5000
  });

  const { data: sessions = [], refetch: refetchSessions } = useQuery({
    queryKey: ['/api/chat/sessions'],
    refetchInterval: 2000
  });

  const { sendMessage, lastMessage } = useWebSocket('/ws');

  useEffect(() => {
    if (lastMessage) {
      refetchSessions();
    }
  }, [lastMessage, refetchSessions]);

  const selectedSession = sessions.find((s: ChatSession & { customer?: any; agent?: any }) => 
    s.sessionId === selectedSessionId
  );

  const handleTabChange = (tab: typeof activeTab) => {
    setActiveTab(tab);
  };

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="bg-card border-b border-border shadow-sm" data-testid="dashboard-header">
        <div className="flex items-center justify-between px-6 py-4">
          <div className="flex items-center space-x-4">
            <h1 className="text-2xl font-bold text-foreground" data-testid="title-brand">
              ChatSupport Pro
            </h1>
            <Badge className="bg-secondary text-secondary-foreground" data-testid="badge-enterprise">
              Enterprise
            </Badge>
          </div>
          
          <div className="flex items-center space-x-4">
            {/* Real-time stats */}
            <div className="flex items-center space-x-6 text-sm">
              <div className="flex items-center space-x-2">
                <div className="w-2 h-2 bg-secondary rounded-full animate-pulse" data-testid="indicator-active"></div>
                <span className="text-muted-foreground">Active Chats:</span>
                <span className="font-semibold text-foreground" data-testid="stat-active-chats">
                  {stats?.activeChats || 0}
                </span>
              </div>
              <div className="flex items-center space-x-2">
                <div className="w-2 h-2 bg-warning rounded-full" data-testid="indicator-waiting"></div>
                <span className="text-muted-foreground">Waiting:</span>
                <span className="font-semibold text-foreground" data-testid="stat-waiting-chats">
                  {stats?.waitingChats || 0}
                </span>
              </div>
              <div className="flex items-center space-x-2">
                <div className="w-2 h-2 bg-primary rounded-full" data-testid="indicator-agents"></div>
                <span className="text-muted-foreground">Agents Online:</span>
                <span className="font-semibold text-foreground" data-testid="stat-online-agents">
                  {stats?.onlineAgents || 0}
                </span>
              </div>
            </div>
            
            {/* User menu */}
            <div className="flex items-center space-x-3">
              <Button variant="ghost" size="icon" className="relative" data-testid="button-notifications">
                <Bell className="h-5 w-5" />
                <span className="absolute -top-1 -right-1 w-3 h-3 bg-destructive rounded-full" data-testid="notification-dot"></span>
              </Button>
              <div className="flex items-center space-x-3 px-3 py-2 border border-border rounded-lg">
                <Avatar className="w-8 h-8" data-testid="avatar-user">
                  <AvatarImage src={currentUser.avatar} />
                  <AvatarFallback>SC</AvatarFallback>
                </Avatar>
                <div className="text-sm">
                  <div className="font-medium text-foreground" data-testid="text-user-name">
                    {currentUser.name}
                  </div>
                  <div className="text-muted-foreground text-xs" data-testid="text-user-role">
                    {currentUser.role}
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </header>

      <div className="flex h-screen">
        {/* Sidebar */}
        <ChatSidebar
          sessions={sessions}
          selectedSessionId={selectedSessionId}
          onSelectSession={setSelectedSessionId}
        />

        {/* Main Content Area */}
        <div className="flex-1 flex flex-col">
          {/* Tab Navigation */}
          <div className="bg-card border-b border-border px-6 py-3" data-testid="tab-navigation">
            <div className="flex space-x-1">
              <Button
                variant={activeTab === 'conversation' ? 'default' : 'ghost'}
                size="sm"
                onClick={() => handleTabChange('conversation')}
                data-testid="tab-conversation"
              >
                <MessageSquare className="h-4 w-4 mr-2" />
                Conversation
              </Button>
              <Button
                variant={activeTab === 'sop' ? 'default' : 'ghost'}
                size="sm"
                onClick={() => handleTabChange('sop')}
                data-testid="tab-sop"
              >
                <Book className="h-4 w-4 mr-2" />
                SOP Library
              </Button>
              <Button
                variant={activeTab === 'exports' ? 'default' : 'ghost'}
                size="sm"
                onClick={() => handleTabChange('exports')}
                data-testid="tab-exports"
              >
                <Download className="h-4 w-4 mr-2" />
                Export Center
              </Button>
              <Button
                variant={activeTab === 'analytics' ? 'default' : 'ghost'}
                size="sm"
                onClick={() => handleTabChange('analytics')}
                data-testid="tab-analytics"
              >
                <BarChart3 className="h-4 w-4 mr-2" />
                Analytics
              </Button>
            </div>
          </div>

          {/* Tab Content */}
          <div className="flex-1">
            {activeTab === 'conversation' && (
              <ConversationView 
                session={selectedSession}
                onSessionUpdate={refetchSessions}
              />
            )}
            {activeTab === 'sop' && <SOPModal isOpen={true} onClose={() => setActiveTab('conversation')} />}
            {activeTab === 'exports' && <ExportCenter />}
            {activeTab === 'analytics' && (
              <div className="flex items-center justify-center h-full">
                <div className="text-center">
                  <BarChart3 className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
                  <h3 className="text-lg font-medium text-foreground">Analytics Dashboard</h3>
                  <p className="text-muted-foreground">Coming soon...</p>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
