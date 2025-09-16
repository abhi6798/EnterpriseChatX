import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Separator } from "@/components/ui/separator";
import { Download, FileText, Users, User, Calendar, Filter } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { exportUtils } from "@/lib/export-utils";
import type { User as UserType, Customer } from "@shared/schema";

export default function ExportCenter() {
  const [exportType, setExportType] = useState<'all' | 'customer-wise' | 'agent-wise'>('all');
  const [selectedEntity, setSelectedEntity] = useState<string>('');
  const [exportFormat, setExportFormat] = useState<'json' | 'csv' | 'pdf'>('json');
  const [dateRange, setDateRange] = useState<'today' | 'week' | 'month' | 'all'>('all');
  
  const { toast } = useToast();

  const { data: agents = [] } = useQuery({
    queryKey: ['/api/agents']
  });

  const { data: sessions = [] } = useQuery({
    queryKey: ['/api/chat/sessions']
  });

  const { data: stats } = useQuery({
    queryKey: ['/api/dashboard/stats']
  });

  const customers = Array.from(
    new Map(sessions.filter((s: any) => s.customer).map((s: any) => [s.customer.id, s.customer])).values()
  );

  const handleExport = async () => {
    try {
      let url = `/api/export/conversations/${exportType}?format=${exportFormat}`;
      
      if (exportType === 'customer-wise' && selectedEntity) {
        url += `&customerId=${selectedEntity}`;
      } else if (exportType === 'agent-wise' && selectedEntity) {
        url += `&agentId=${selectedEntity}`;
      }

      if (exportFormat === 'pdf') {
        // For PDF, we'll get JSON data and convert it client-side
        const response = await fetch(url.replace('format=pdf', 'format=json'));
        const data = await response.json();
        await exportUtils.generatePDF(data, exportType);
      } else {
        // For JSON and CSV, let the server handle it
        window.open(url, '_blank');
      }

      toast({
        title: "Export initiated",
        description: `Your ${exportFormat.toUpperCase()} export will download shortly.`
      });
    } catch (error) {
      toast({
        title: "Export failed",
        description: "There was an error generating your export.",
        variant: "destructive"
      });
    }
  };

  const getExportDescription = () => {
    switch (exportType) {
      case 'all':
        return 'Export all conversation data including customer information, agent details, and complete message history.';
      case 'customer-wise':
        return 'Export conversations grouped by customer with their complete interaction history.';
      case 'agent-wise':
        return 'Export conversations handled by specific agents with performance metrics.';
      default:
        return '';
    }
  };

  const getEstimatedSize = () => {
    const baseSize = sessions.length * 2; // Rough estimate in KB
    switch (exportFormat) {
      case 'json': return `~${Math.round(baseSize * 1.5)}KB`;
      case 'csv': return `~${Math.round(baseSize * 0.8)}KB`;
      case 'pdf': return `~${Math.round(baseSize * 2.5)}KB`;
      default: return 'Unknown';
    }
  };

  return (
    <div className="flex-1 p-6 bg-background" data-testid="export-center">
      <div className="max-w-4xl mx-auto space-y-6">
        {/* Header */}
        <div>
          <h2 className="text-2xl font-bold text-foreground" data-testid="title-export-center">
            Export Center
          </h2>
          <p className="text-muted-foreground mt-2">
            Export conversation data in various formats for analysis and reporting.
          </p>
        </div>

        {/* Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <Card>
            <CardContent className="pt-6">
              <div className="flex items-center space-x-2">
                <FileText className="h-4 w-4 text-muted-foreground" />
                <div>
                  <div className="text-2xl font-bold text-foreground" data-testid="stat-total-conversations">
                    {sessions.length}
                  </div>
                  <p className="text-xs text-muted-foreground">Total Conversations</p>
                </div>
              </div>
            </CardContent>
          </Card>
          
          <Card>
            <CardContent className="pt-6">
              <div className="flex items-center space-x-2">
                <Users className="h-4 w-4 text-muted-foreground" />
                <div>
                  <div className="text-2xl font-bold text-foreground" data-testid="stat-unique-customers">
                    {customers.length}
                  </div>
                  <p className="text-xs text-muted-foreground">Unique Customers</p>
                </div>
              </div>
            </CardContent>
          </Card>
          
          <Card>
            <CardContent className="pt-6">
              <div className="flex items-center space-x-2">
                <User className="h-4 w-4 text-muted-foreground" />
                <div>
                  <div className="text-2xl font-bold text-foreground" data-testid="stat-active-agents">
                    {agents.length}
                  </div>
                  <p className="text-xs text-muted-foreground">Active Agents</p>
                </div>
              </div>
            </CardContent>
          </Card>
          
          <Card>
            <CardContent className="pt-6">
              <div className="flex items-center space-x-2">
                <Download className="h-4 w-4 text-muted-foreground" />
                <div>
                  <div className="text-2xl font-bold text-foreground">
                    {getEstimatedSize()}
                  </div>
                  <p className="text-xs text-muted-foreground">Estimated Size</p>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Export Configuration */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center space-x-2" data-testid="title-export-config">
              <Download className="h-5 w-5" />
              <span>Export Configuration</span>
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-6">
            {/* Export Type Selection */}
            <div className="space-y-3">
              <label className="text-sm font-medium text-foreground">Export Type</label>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                <Card 
                  className={`cursor-pointer transition-colors ${
                    exportType === 'all' ? 'ring-2 ring-primary bg-primary/5' : 'hover:bg-muted/50'
                  }`}
                  onClick={() => setExportType('all')}
                  data-testid="export-type-all"
                >
                  <CardContent className="pt-4">
                    <div className="text-center">
                      <FileText className="h-8 w-8 mx-auto mb-2 text-primary" />
                      <h4 className="font-medium text-foreground">All Conversations</h4>
                      <p className="text-xs text-muted-foreground mt-1">Complete dataset</p>
                    </div>
                  </CardContent>
                </Card>

                <Card 
                  className={`cursor-pointer transition-colors ${
                    exportType === 'customer-wise' ? 'ring-2 ring-primary bg-primary/5' : 'hover:bg-muted/50'
                  }`}
                  onClick={() => setExportType('customer-wise')}
                  data-testid="export-type-customer"
                >
                  <CardContent className="pt-4">
                    <div className="text-center">
                      <Users className="h-8 w-8 mx-auto mb-2 text-secondary" />
                      <h4 className="font-medium text-foreground">Customer-wise</h4>
                      <p className="text-xs text-muted-foreground mt-1">Grouped by customer</p>
                    </div>
                  </CardContent>
                </Card>

                <Card 
                  className={`cursor-pointer transition-colors ${
                    exportType === 'agent-wise' ? 'ring-2 ring-primary bg-primary/5' : 'hover:bg-muted/50'
                  }`}
                  onClick={() => setExportType('agent-wise')}
                  data-testid="export-type-agent"
                >
                  <CardContent className="pt-4">
                    <div className="text-center">
                      <User className="h-8 w-8 mx-auto mb-2 text-accent" />
                      <h4 className="font-medium text-foreground">Agent-wise</h4>
                      <p className="text-xs text-muted-foreground mt-1">Grouped by agent</p>
                    </div>
                  </CardContent>
                </Card>
              </div>
            </div>

            {/* Entity Selection */}
            {(exportType === 'customer-wise' || exportType === 'agent-wise') && (
              <div className="space-y-3">
                <label className="text-sm font-medium text-foreground">
                  Select {exportType === 'customer-wise' ? 'Customer' : 'Agent'}
                </label>
                <Select value={selectedEntity} onValueChange={setSelectedEntity}>
                  <SelectTrigger data-testid="select-export-entity">
                    <SelectValue placeholder={`Choose ${exportType === 'customer-wise' ? 'customer' : 'agent'}...`} />
                  </SelectTrigger>
                  <SelectContent>
                    {exportType === 'customer-wise' ? (
                      customers.map((customer: Customer) => (
                        <SelectItem key={customer.id} value={customer.id}>
                          <div className="flex items-center space-x-2">
                            <Avatar className="w-6 h-6">
                              <AvatarFallback className="text-xs">
                                {customer.name.charAt(0)}
                              </AvatarFallback>
                            </Avatar>
                            <span>{customer.name}</span>
                            <Badge variant="secondary" className="ml-auto">
                              {customer.status}
                            </Badge>
                          </div>
                        </SelectItem>
                      ))
                    ) : (
                      agents.map((agent: UserType) => (
                        <SelectItem key={agent.id} value={agent.id}>
                          <div className="flex items-center space-x-2">
                            <Avatar className="w-6 h-6">
                              <AvatarFallback className="text-xs">
                                {agent.name.charAt(0)}
                              </AvatarFallback>
                            </Avatar>
                            <span>{agent.name}</span>
                            <Badge variant="outline" className="ml-auto">
                              {agent.role.replace('_', ' ')}
                            </Badge>
                          </div>
                        </SelectItem>
                      ))
                    )}
                  </SelectContent>
                </Select>
              </div>
            )}

            <Separator />

            {/* Format and Options */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="space-y-3">
                <label className="text-sm font-medium text-foreground">Export Format</label>
                <Select value={exportFormat} onValueChange={(value: 'json' | 'csv' | 'pdf') => setExportFormat(value)}>
                  <SelectTrigger data-testid="select-export-format">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="json">JSON - Structured data</SelectItem>
                    <SelectItem value="csv">CSV - Spreadsheet compatible</SelectItem>
                    <SelectItem value="pdf">PDF - Formatted report</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-3">
                <label className="text-sm font-medium text-foreground">Date Range</label>
                <Select value={dateRange} onValueChange={(value: 'today' | 'week' | 'month' | 'all') => setDateRange(value)}>
                  <SelectTrigger data-testid="select-date-range">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="today">Today</SelectItem>
                    <SelectItem value="week">Last 7 days</SelectItem>
                    <SelectItem value="month">Last 30 days</SelectItem>
                    <SelectItem value="all">All time</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>

            {/* Description */}
            <div className="bg-muted/50 p-4 rounded-lg">
              <h4 className="font-medium text-foreground mb-2">Export Details</h4>
              <p className="text-sm text-muted-foreground" data-testid="text-export-description">
                {getExportDescription()}
              </p>
              <div className="flex items-center justify-between mt-3 text-xs text-muted-foreground">
                <span>Estimated file size: {getEstimatedSize()}</span>
                <span>Format: {exportFormat.toUpperCase()}</span>
              </div>
            </div>

            {/* Export Button */}
            <div className="flex justify-end">
              <Button 
                onClick={handleExport}
                size="lg"
                disabled={
                  (exportType !== 'all' && !selectedEntity)
                }
                data-testid="button-start-export"
              >
                <Download className="h-4 w-4 mr-2" />
                Start Export
              </Button>
            </div>
          </CardContent>
        </Card>

        {/* Recent Exports */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center space-x-2">
              <Calendar className="h-5 w-5" />
              <span>Recent Exports</span>
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-center py-8 text-muted-foreground" data-testid="empty-state-recent-exports">
              <Download className="h-8 w-8 mx-auto mb-2 opacity-50" />
              <p>No recent exports</p>
              <p className="text-xs mt-1">Your export history will appear here</p>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
