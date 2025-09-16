import jsPDF from 'jspdf';
import type { ChatSession, Customer, User, Message } from '@shared/schema';

interface ExportData {
  session: ChatSession & { customer?: Customer; agent?: User };
  messages: Message[];
}

export const exportUtils = {
  /**
   * Generate CSV content from conversation data
   */
  generateCSV(data: ExportData[], type: string): string {
    const headers = [
      'Session ID',
      'Customer Name',
      'Customer Email',
      'Customer ID',
      'Agent Name',
      'Agent Role',
      'Session Status',
      'Start Time',
      'End Time',
      'Message Count',
      'Duration (minutes)',
      'Transfer Count'
    ];

    const rows = data.map(({ session, messages }) => {
      const duration = session.endTime && session.startTime
        ? Math.round((new Date(session.endTime).getTime() - new Date(session.startTime).getTime()) / (1000 * 60))
        : 0;

      const transferCount = Array.isArray(session.transferHistory) ? session.transferHistory.length : 0;

      return [
        session.sessionId,
        session.customer?.name || 'Unknown',
        session.customer?.email || 'Unknown',
        session.customer?.customerId || 'N/A',
        session.agent?.name || 'Unassigned',
        session.agent?.role?.replace('_', ' ') || 'Unknown',
        session.status,
        session.startTime ? new Date(session.startTime).toLocaleString() : 'Unknown',
        session.endTime ? new Date(session.endTime).toLocaleString() : 'Ongoing',
        messages.length,
        duration,
        transferCount
      ];
    });

    const csvContent = [
      headers.join(','),
      ...rows.map(row => row.map(cell => `"${cell}"`).join(','))
    ].join('\n');

    return csvContent;
  },

  /**
   * Generate and download CSV file
   */
  downloadCSV(data: ExportData[], type: string): void {
    const csvContent = this.generateCSV(data, type);
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    
    if (link.download !== undefined) {
      const url = URL.createObjectURL(blob);
      link.setAttribute('href', url);
      link.setAttribute('download', `conversations-${type}-${Date.now()}.csv`);
      link.style.visibility = 'hidden';
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
    }
  },

  /**
   * Generate and download JSON file
   */
  downloadJSON(data: ExportData[], type: string): void {
    const jsonContent = JSON.stringify(data, null, 2);
    const blob = new Blob([jsonContent], { type: 'application/json;charset=utf-8;' });
    const link = document.createElement('a');
    
    if (link.download !== undefined) {
      const url = URL.createObjectURL(blob);
      link.setAttribute('href', url);
      link.setAttribute('download', `conversations-${type}-${Date.now()}.json`);
      link.style.visibility = 'hidden';
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
    }
  },

  /**
   * Generate PDF report
   */
  async generatePDF(data: ExportData[], type: string): Promise<void> {
    const doc = new jsPDF();
    const pageHeight = doc.internal.pageSize.height;
    let yPosition = 20;

    // Title
    doc.setFontSize(20);
    doc.text('Conversation Export Report', 20, yPosition);
    yPosition += 15;

    // Metadata
    doc.setFontSize(12);
    doc.text(`Export Type: ${type.replace('-', ' ').toUpperCase()}`, 20, yPosition);
    yPosition += 8;
    doc.text(`Generated: ${new Date().toLocaleString()}`, 20, yPosition);
    yPosition += 8;
    doc.text(`Total Conversations: ${data.length}`, 20, yPosition);
    yPosition += 15;

    // Summary Statistics
    doc.setFontSize(14);
    doc.text('Summary Statistics', 20, yPosition);
    yPosition += 10;

    const totalMessages = data.reduce((sum, { messages }) => sum + messages.length, 0);
    const avgMessagesPerConversation = data.length > 0 ? (totalMessages / data.length).toFixed(1) : '0';
    const activeConversations = data.filter(({ session }) => session.status === 'active').length;
    const resolvedConversations = data.filter(({ session }) => session.status === 'resolved').length;

    doc.setFontSize(10);
    doc.text(`• Total Messages: ${totalMessages}`, 30, yPosition);
    yPosition += 6;
    doc.text(`• Average Messages per Conversation: ${avgMessagesPerConversation}`, 30, yPosition);
    yPosition += 6;
    doc.text(`• Active Conversations: ${activeConversations}`, 30, yPosition);
    yPosition += 6;
    doc.text(`• Resolved Conversations: ${resolvedConversations}`, 30, yPosition);
    yPosition += 15;

    // Conversation Details
    doc.setFontSize(14);
    doc.text('Conversation Details', 20, yPosition);
    yPosition += 10;

    for (let i = 0; i < Math.min(data.length, 10); i++) {
      const { session, messages } = data[i];
      
      // Check if we need a new page
      if (yPosition > pageHeight - 40) {
        doc.addPage();
        yPosition = 20;
      }

      doc.setFontSize(12);
      doc.text(`${i + 1}. Session ${session.sessionId}`, 20, yPosition);
      yPosition += 8;

      doc.setFontSize(10);
      doc.text(`   Customer: ${session.customer?.name || 'Unknown'} (${session.customer?.email || 'N/A'})`, 20, yPosition);
      yPosition += 6;
      doc.text(`   Agent: ${session.agent?.name || 'Unassigned'} (${session.agent?.role?.replace('_', ' ') || 'Unknown'})`, 20, yPosition);
      yPosition += 6;
      doc.text(`   Status: ${session.status} | Messages: ${messages.length}`, 20, yPosition);
      yPosition += 6;
      doc.text(`   Started: ${session.startTime ? new Date(session.startTime).toLocaleString() : 'Unknown'}`, 20, yPosition);
      yPosition += 10;
    }

    if (data.length > 10) {
      doc.text(`... and ${data.length - 10} more conversations`, 20, yPosition);
    }

    // Save the PDF
    doc.save(`conversations-${type}-${Date.now()}.pdf`);
  },

  /**
   * Format conversation data for display
   */
  formatConversationData(data: ExportData[]): any[] {
    return data.map(({ session, messages }) => ({
      sessionId: session.sessionId,
      customer: {
        name: session.customer?.name || 'Unknown',
        email: session.customer?.email || 'Unknown',
        id: session.customer?.customerId || 'N/A',
        status: session.customer?.status || 'Unknown'
      },
      agent: {
        name: session.agent?.name || 'Unassigned',
        role: session.agent?.role || 'Unknown',
        email: session.agent?.email || 'Unknown'
      },
      session: {
        status: session.status,
        startTime: session.startTime,
        endTime: session.endTime,
        transferHistory: session.transferHistory || [],
        rating: session.rating
      },
      metrics: {
        messageCount: messages.length,
        duration: session.endTime && session.startTime
          ? Math.round((new Date(session.endTime).getTime() - new Date(session.startTime).getTime()) / (1000 * 60))
          : null,
        transferCount: Array.isArray(session.transferHistory) ? session.transferHistory.length : 0
      },
      messages: messages.map(msg => ({
        id: msg.id,
        content: msg.content,
        senderType: msg.senderType,
        timestamp: msg.timestamp,
        messageType: msg.messageType
      }))
    }));
  },

  /**
   * Validate export data
   */
  validateExportData(data: any[]): boolean {
    if (!Array.isArray(data)) return false;
    if (data.length === 0) return true; // Empty data is valid
    
    return data.every(item => 
      item && 
      typeof item === 'object' && 
      item.session && 
      Array.isArray(item.messages)
    );
  },

  /**
   * Get export file size estimate
   */
  getEstimatedFileSize(data: ExportData[], format: 'json' | 'csv' | 'pdf'): string {
    const dataSize = JSON.stringify(data).length;
    
    let multiplier;
    switch (format) {
      case 'json':
        multiplier = 1.2; // JSON formatting overhead
        break;
      case 'csv':
        multiplier = 0.6; // CSV is more compact
        break;
      case 'pdf':
        multiplier = 2.5; // PDF has more overhead
        break;
      default:
        multiplier = 1;
    }

    const estimatedBytes = dataSize * multiplier;
    
    if (estimatedBytes < 1024) {
      return `${Math.round(estimatedBytes)} B`;
    } else if (estimatedBytes < 1024 * 1024) {
      return `${Math.round(estimatedBytes / 1024)} KB`;
    } else {
      return `${Math.round(estimatedBytes / (1024 * 1024))} MB`;
    }
  }
};
