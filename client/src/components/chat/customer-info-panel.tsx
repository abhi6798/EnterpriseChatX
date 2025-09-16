import { useQuery } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import { ShoppingCart, Undo, ArrowUp, Phone, Search } from "lucide-react";
import { useState } from "react";
import type { ChatSession, Customer, User } from "@shared/schema";

interface CustomerInfoPanelProps {
  session: ChatSession & { customer?: Customer; agent?: User };
  onQuickAction: (action: string) => void;
}

export default function CustomerInfoPanel({ session, onQuickAction }: CustomerInfoPanelProps) {
  const [sopSearch, setSopSearch] = useState("");

  const { data: quickSOPs = [] } = useQuery({
    queryKey: ['/api/sop'],
    select: (data: any[]) => data.slice(0, 3) // Show first 3 SOPs as quick access
  });

  const { data: previousChats = [] } = useQuery({
    queryKey: ['/api/chat/sessions'],
    select: (data: any[]) => 
      data.filter((s: any) => 
        s.customerId === session.customerId && 
        s.id !== session.id &&
        s.status === 'resolved'
      ).slice(0, 3)
  });

  const formatDate = (date?: Date | string) => {
    if (!date) return 'Unknown';
    return new Date(date).toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric'
    });
  };

  const getStatusColor = (status?: string) => {
    switch (status) {
      case 'premium': return 'bg-accent text-accent-foreground';
      case 'vip': return 'bg-destructive text-destructive-foreground';
      default: return 'bg-secondary text-secondary-foreground';
    }
  };

  return (
    <div className="w-80 bg-card border-l border-border overflow-y-auto" data-testid="customer-info-panel">
      {/* Customer Information */}
      <Card className="rounded-none border-0 border-b">
        <CardHeader className="pb-3">
          <CardTitle className="text-base" data-testid="title-customer-info">
            Customer Information
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-3 text-sm">
          <div className="flex items-center justify-between">
            <span className="text-muted-foreground">Customer ID:</span>
            <span className="font-medium text-foreground" data-testid="text-customer-id">
              {session.customer?.customerId || 'N/A'}
            </span>
          </div>
          <div className="flex items-center justify-between">
            <span className="text-muted-foreground">Member Since:</span>
            <span className="font-medium text-foreground" data-testid="text-member-since">
              {formatDate(session.customer?.memberSince)}
            </span>
          </div>
          <div className="flex items-center justify-between">
            <span className="text-muted-foreground">Total Orders:</span>
            <span className="font-medium text-foreground" data-testid="text-total-orders">
              {session.customer?.totalOrders || 0}
            </span>
          </div>
          <div className="flex items-center justify-between">
            <span className="text-muted-foreground">Status:</span>
            <Badge className={getStatusColor(session.customer?.status)} data-testid="badge-customer-status">
              {session.customer?.status || 'regular'}
            </Badge>
          </div>
        </CardContent>
      </Card>

      {/* Quick Actions */}
      <Card className="rounded-none border-0 border-b">
        <CardHeader className="pb-3">
          <CardTitle className="text-base" data-testid="title-quick-actions">
            Quick Actions
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-2">
          <Button
            variant="ghost"
            className="w-full justify-start text-sm"
            onClick={() => onQuickAction('view-orders')}
            data-testid="button-view-order-history"
          >
            <ShoppingCart className="h-4 w-4 mr-2 text-muted-foreground" />
            View Order History
          </Button>
          <Button
            variant="ghost"
            className="w-full justify-start text-sm"
            onClick={() => onQuickAction('process-refund')}
            data-testid="button-process-refund"
          >
            <Undo className="h-4 w-4 mr-2 text-muted-foreground" />
            Process Refund
          </Button>
          <Button
            variant="ghost"
            className="w-full justify-start text-sm"
            onClick={() => onQuickAction('escalate')}
            data-testid="button-escalate-issue"
          >
            <ArrowUp className="h-4 w-4 mr-2 text-muted-foreground" />
            Escalate Issue
          </Button>
          <Button
            variant="ghost"
            className="w-full justify-start text-sm"
            onClick={() => onQuickAction('schedule-callback')}
            data-testid="button-schedule-callback"
          >
            <Phone className="h-4 w-4 mr-2 text-muted-foreground" />
            Schedule Callback
          </Button>
        </CardContent>
      </Card>

      {/* SOP Quick Search */}
      <Card className="rounded-none border-0 border-b">
        <CardHeader className="pb-3">
          <CardTitle className="text-base" data-testid="title-sop-quick-search">
            SOP Quick Search
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Search procedures..."
              className="pl-10 text-sm"
              value={sopSearch}
              onChange={(e) => setSopSearch(e.target.value)}
              data-testid="input-sop-search"
            />
          </div>
          
          {/* Quick SOP Links */}
          <div className="space-y-1">
            {quickSOPs.map((sop: any) => (
              <Button
                key={sop.id}
                variant="ghost"
                className="w-full justify-start text-sm px-2 py-2 h-auto"
                onClick={() => onQuickAction(`sop-${sop.id}`)}
                data-testid={`button-sop-${sop.id}`}
              >
                <span className="mr-2">📋</span>
                <span className="text-left truncate">{sop.title}</span>
              </Button>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Chat History */}
      <Card className="rounded-none border-0">
        <CardHeader className="pb-3">
          <CardTitle className="text-base" data-testid="title-previous-chats">
            Previous Chats
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-2">
          {previousChats.length === 0 ? (
            <p className="text-sm text-muted-foreground" data-testid="text-no-previous-chats">
              No previous chat history
            </p>
          ) : (
            previousChats.map((chat: any) => (
              <div key={chat.id} className="p-2 border border-border rounded-md" data-testid={`chat-history-${chat.id}`}>
                <div className="font-medium text-foreground text-sm">
                  Session #{chat.sessionId}
                </div>
                <div className="text-muted-foreground text-xs">
                  {formatDate(chat.startTime)} - Agent: {chat.agent?.name}
                </div>
              </div>
            ))
          )}
        </CardContent>
      </Card>
    </div>
  );
}
