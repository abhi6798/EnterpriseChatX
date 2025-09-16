import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Search, Download } from "lucide-react";
import { cn } from "@/lib/utils";
import type { ChatSession, Customer, User } from "@shared/schema";

interface ChatSidebarProps {
  sessions: (ChatSession & { customer?: Customer; agent?: User; lastMessage?: any })[];
  selectedSessionId: string | null;
  onSelectSession: (sessionId: string | null) => void;
}

export default function ChatSidebar({ sessions, selectedSessionId, onSelectSession }: ChatSidebarProps) {
  const [searchQuery, setSearchQuery] = useState("");
  const [roleFilter, setRoleFilter] = useState("all");
  const [statusFilter, setStatusFilter] = useState("all");

  const filteredSessions = sessions.filter(session => {
    const matchesSearch = !searchQuery || 
      session.customer?.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      session.customer?.email.toLowerCase().includes(searchQuery.toLowerCase()) ||
      session.lastMessage?.content.toLowerCase().includes(searchQuery.toLowerCase());

    const matchesRole = roleFilter === "all" || session.agent?.role === roleFilter;
    const matchesStatus = statusFilter === "all" || session.status === statusFilter;

    return matchesSearch && matchesRole && matchesStatus;
  });

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
      case 'senior_agent': return 'Senior';
      case 'team_lead': return 'Team Lead';
      case 'admin': return 'Admin';
      default: return 'Unknown';
    }
  };

  const getStatusIndicator = (status?: string) => {
    switch (status) {
      case 'active': return 'bg-secondary';
      case 'waiting': return 'bg-warning';
      case 'resolved': return 'bg-muted-foreground';
      default: return 'bg-muted-foreground';
    }
  };

  const formatTimeAgo = (timestamp?: Date) => {
    if (!timestamp) return 'Unknown';
    const now = new Date();
    const diff = now.getTime() - new Date(timestamp).getTime();
    const minutes = Math.floor(diff / 60000);
    
    if (minutes < 1) return 'Just now';
    if (minutes < 60) return `${minutes} min ago`;
    const hours = Math.floor(minutes / 60);
    if (hours < 24) return `${hours} hour${hours > 1 ? 's' : ''} ago`;
    const days = Math.floor(hours / 24);
    return `${days} day${days > 1 ? 's' : ''} ago`;
  };

  const handleExportChats = () => {
    window.open('/api/export/conversations/all?format=json', '_blank');
  };

  return (
    <div className="w-96 bg-card border-r border-border flex flex-col" data-testid="chat-sidebar">
      {/* Sidebar Header */}
      <div className="p-4 border-b border-border">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-lg font-semibold text-foreground" data-testid="title-active-chats">
            Active Chats
          </h2>
          <Button 
            size="sm" 
            onClick={handleExportChats}
            data-testid="button-export-chats"
          >
            <Download className="h-4 w-4 mr-2" />
            Export
          </Button>
        </div>
        
        {/* Search and Filters */}
        <div className="space-y-3">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Search conversations..."
              className="pl-10"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              data-testid="input-search-conversations"
            />
          </div>
          
          <div className="flex space-x-2">
            <Select value={roleFilter} onValueChange={setRoleFilter}>
              <SelectTrigger className="flex-1" data-testid="select-role-filter">
                <SelectValue placeholder="All Agents" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Agents</SelectItem>
                <SelectItem value="agent">Agent Level</SelectItem>
                <SelectItem value="senior_agent">Senior Level</SelectItem>
                <SelectItem value="team_lead">Team Lead</SelectItem>
                <SelectItem value="admin">Admin</SelectItem>
              </SelectContent>
            </Select>
            <Select value={statusFilter} onValueChange={setStatusFilter}>
              <SelectTrigger className="flex-1" data-testid="select-status-filter">
                <SelectValue placeholder="All Status" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Status</SelectItem>
                <SelectItem value="active">Active</SelectItem>
                <SelectItem value="waiting">Waiting</SelectItem>
                <SelectItem value="resolved">Resolved</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>
      </div>

      {/* Chat List */}
      <div className="flex-1 overflow-y-auto">
        {filteredSessions.length === 0 ? (
          <div className="flex items-center justify-center h-32 text-muted-foreground" data-testid="empty-state-sessions">
            <p>No active chat sessions</p>
          </div>
        ) : (
          filteredSessions.map((session) => (
            <div
              key={session.id}
              className={cn(
                "p-4 border-b border-border hover:bg-muted/50 cursor-pointer transition-colors",
                selectedSessionId === session.sessionId && "bg-accent bg-opacity-10 border-l-4 border-l-accent"
              )}
              onClick={() => onSelectSession(session.sessionId)}
              data-testid={`session-item-${session.sessionId}`}
            >
              <div className="flex items-start space-x-3">
                <Avatar className="w-10 h-10">
                  <AvatarFallback>
                    {session.customer?.name.charAt(0) || 'U'}
                  </AvatarFallback>
                </Avatar>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center justify-between">
                    <h4 className="text-sm font-medium text-foreground truncate" data-testid={`text-customer-name-${session.sessionId}`}>
                      {session.customer?.name || 'Unknown Customer'}
                    </h4>
                    <div className="flex items-center space-x-2">
                      <Badge className={cn("text-xs", getRoleColor(session.agent?.role))}>
                        {getRoleLabel(session.agent?.role)}
                      </Badge>
                      <div 
                        className={cn("w-2 h-2 rounded-full", getStatusIndicator(session.status))}
                        data-testid={`status-indicator-${session.sessionId}`}
                      />
                    </div>
                  </div>
                  <p className="text-sm text-muted-foreground truncate mt-1" data-testid={`text-last-message-${session.sessionId}`}>
                    {session.lastMessage?.content || 'No messages yet'}
                  </p>
                  <div className="flex items-center justify-between mt-2">
                    <span className="text-xs text-muted-foreground" data-testid={`text-agent-name-${session.sessionId}`}>
                      Agent: {session.agent?.name || 'Unassigned'}
                    </span>
                    <span className="text-xs text-muted-foreground" data-testid={`text-timestamp-${session.sessionId}`}>
                      {formatTimeAgo(session.startTime)}
                    </span>
                  </div>
                </div>
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
}
