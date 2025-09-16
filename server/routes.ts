import type { Express } from "express";
import { createServer, type Server } from "http";
import { WebSocketServer, WebSocket } from "ws";
import { storage } from "./storage";
import { z } from "zod";
import { 
  insertMessageSchema, 
  insertChatSessionSchema, 
  insertCustomerSchema,
  insertSOPSchema,
  type WSMessage,
  type User,
  type ChatSession 
} from "@shared/schema";
import { randomUUID } from "crypto";

interface ConnectedClient {
  ws: WebSocket;
  userId?: string;
  userType: 'customer' | 'agent';
  sessionId?: string;
}

export async function registerRoutes(app: Express): Promise<Server> {
  const httpServer = createServer(app);
  const wss = new WebSocketServer({ server: httpServer, path: '/ws' });
  
  const connectedClients = new Map<string, ConnectedClient>();

  // WebSocket connection handling
  wss.on('connection', (ws) => {
    const clientId = randomUUID();
    connectedClients.set(clientId, { ws, userType: 'customer' });

    ws.on('message', async (data) => {
      try {
        const message: WSMessage = JSON.parse(data.toString());
        const client = connectedClients.get(clientId);
        if (!client) return;

        switch (message.type) {
          case 'join_session':
            client.userId = message.userId;
            client.userType = message.userType as 'customer' | 'agent';
            client.sessionId = message.sessionId;
            
            // Broadcast user joined
            broadcastToSession(message.sessionId!, {
              type: 'agent_status',
              data: { status: 'joined', userId: message.userId, userType: message.userType }
            });
            break;

          case 'chat_message':
            if (message.sessionId && message.data) {
              // Save message to storage
              const newMessage = await storage.createMessage({
                sessionId: message.sessionId,
                senderId: message.userId!,
                senderType: message.userType!,
                content: message.data.content,
                messageType: 'text'
              });

              // Broadcast to all clients in session
              broadcastToSession(message.sessionId, {
                type: 'chat_message',
                sessionId: message.sessionId,
                data: {
                  ...newMessage,
                  senderName: message.data.senderName
                }
              });
            }
            break;

          case 'agent_typing':
          case 'customer_typing':
            if (message.sessionId) {
              broadcastToSession(message.sessionId, message, clientId);
            }
            break;

          case 'session_transfer':
            if (message.sessionId && message.data) {
              // Update session in storage
              const session = await storage.getChatSessionBySessionId(message.sessionId);
              if (session) {
                const transferHistory = Array.isArray(session.transferHistory) ? session.transferHistory : [];
                transferHistory.push({
                  fromAgent: session.agentId,
                  toAgent: message.data.newAgentId,
                  timestamp: new Date(),
                  reason: message.data.reason
                });

                await storage.updateChatSession(session.id, {
                  agentId: message.data.newAgentId,
                  transferHistory
                });

                // Broadcast transfer
                broadcastToSession(message.sessionId, {
                  type: 'session_transfer',
                  sessionId: message.sessionId,
                  data: message.data
                });
              }
            }
            break;

          case 'session_ended':
            if (message.sessionId) {
              const session = await storage.getChatSessionBySessionId(message.sessionId);
              if (session) {
                await storage.updateChatSession(session.id, {
                  status: 'resolved',
                  endTime: new Date()
                });

                broadcastToSession(message.sessionId, {
                  type: 'session_ended',
                  sessionId: message.sessionId,
                  data: { endedBy: message.userId }
                });
              }
            }
            break;
        }
      } catch (error) {
        console.error('WebSocket message error:', error);
      }
    });

    ws.on('close', () => {
      const client = connectedClients.get(clientId);
      if (client && client.sessionId) {
        broadcastToSession(client.sessionId, {
          type: 'agent_status',
          data: { status: 'left', userId: client.userId, userType: client.userType }
        });
      }
      connectedClients.delete(clientId);
    });
  });

  function broadcastToSession(sessionId: string, message: WSMessage, excludeClientId?: string) {
    for (const [clientId, client] of connectedClients.entries()) {
      if (client.sessionId === sessionId && clientId !== excludeClientId && client.ws.readyState === WebSocket.OPEN) {
        client.ws.send(JSON.stringify(message));
      }
    }
  }

  // Authentication endpoint
  app.post('/api/auth/login', async (req, res) => {
    try {
      const { username, password } = req.body;
      const user = await storage.getUserByUsername(username);
      
      if (!user || user.password !== password) {
        return res.status(401).json({ error: 'Invalid credentials' });
      }

      await storage.updateUserOnlineStatus(user.id, true);
      res.json({ user: { ...user, password: undefined } });
    } catch (error) {
      res.status(500).json({ error: 'Internal server error' });
    }
  });

  // Chat session endpoints
  app.post('/api/chat/start', async (req, res) => {
    try {
      const { customerEmail, customerName } = req.body;
      
      let customer = await storage.getCustomerByEmail(customerEmail);
      if (!customer) {
        customer = await storage.createCustomer({
          name: customerName,
          email: customerEmail,
          customerId: `CUS-${Date.now()}`,
          totalOrders: 0,
          status: 'regular'
        });
      }

      // Find available agent
      const availableAgents = await storage.getAgentsByRole('agent');
      const onlineAgent = availableAgents.find(agent => agent.isOnline);

      if (!onlineAgent) {
        return res.status(503).json({ error: 'No agents available' });
      }

      const sessionId = `CHT-${Date.now()}-${randomUUID().slice(0, 8)}`;
      const session = await storage.createChatSession({
        sessionId,
        customerId: customer.id,
        agentId: onlineAgent.id,
        status: 'active'
      });

      res.json({ session, customer, agent: onlineAgent });
    } catch (error) {
      res.status(500).json({ error: 'Failed to start chat session' });
    }
  });

  app.get('/api/chat/sessions', async (req, res) => {
    try {
      const sessions = await storage.getActiveSessions();
      const enrichedSessions = await Promise.all(
        sessions.map(async (session) => {
          const customer = session.customerId ? await storage.getCustomer(session.customerId) : null;
          const agent = session.agentId ? await storage.getUser(session.agentId) : null;
          const messages = await storage.getRecentMessages(session.id, 1);
          
          return {
            ...session,
            customer,
            agent,
            lastMessage: messages[0]
          };
        })
      );
      
      res.json(enrichedSessions);
    } catch (error) {
      res.status(500).json({ error: 'Failed to fetch chat sessions' });
    }
  });

  app.get('/api/chat/sessions/:sessionId/messages', async (req, res) => {
    try {
      const { sessionId } = req.params;
      const session = await storage.getChatSessionBySessionId(sessionId);
      
      if (!session) {
        return res.status(404).json({ error: 'Session not found' });
      }

      const messages = await storage.getMessagesBySession(session.id);
      res.json(messages);
    } catch (error) {
      res.status(500).json({ error: 'Failed to fetch messages' });
    }
  });

  app.post('/api/chat/transfer', async (req, res) => {
    try {
      const { sessionId, newAgentId, reason } = req.body;
      const session = await storage.getChatSessionBySessionId(sessionId);
      
      if (!session) {
        return res.status(404).json({ error: 'Session not found' });
      }

      const newAgent = await storage.getUser(newAgentId);
      if (!newAgent) {
        return res.status(404).json({ error: 'Agent not found' });
      }

      // Update transfer history
      const transferHistory = Array.isArray(session.transferHistory) ? session.transferHistory : [];
      transferHistory.push({
        fromAgent: session.agentId,
        toAgent: newAgentId,
        timestamp: new Date(),
        reason
      });

      const updatedSession = await storage.updateChatSession(session.id, {
        agentId: newAgentId,
        transferHistory
      });

      // Create system message
      await storage.createMessage({
        sessionId: session.id,
        senderId: 'system',
        senderType: 'system',
        content: `Chat transferred to ${newAgent.name} (${newAgent.role.replace('_', ' ')})`,
        messageType: 'system'
      });

      res.json(updatedSession);
    } catch (error) {
      res.status(500).json({ error: 'Failed to transfer chat' });
    }
  });

  app.post('/api/chat/end/:sessionId', async (req, res) => {
    try {
      const { sessionId } = req.params;
      const session = await storage.getChatSessionBySessionId(sessionId);
      
      if (!session) {
        return res.status(404).json({ error: 'Session not found' });
      }

      const updatedSession = await storage.updateChatSession(session.id, {
        status: 'resolved',
        endTime: new Date()
      });

      res.json(updatedSession);
    } catch (error) {
      res.status(500).json({ error: 'Failed to end chat session' });
    }
  });

  // Agent management endpoints
  app.get('/api/agents', async (req, res) => {
    try {
      const agents = await storage.getOnlineAgents();
      res.json(agents.map(agent => ({ ...agent, password: undefined })));
    } catch (error) {
      res.status(500).json({ error: 'Failed to fetch agents' });
    }
  });

  app.get('/api/agents/by-role/:role', async (req, res) => {
    try {
      const { role } = req.params;
      const agents = await storage.getAgentsByRole(role);
      res.json(agents.map(agent => ({ ...agent, password: undefined })));
    } catch (error) {
      res.status(500).json({ error: 'Failed to fetch agents by role' });
    }
  });

  // SOP endpoints
  app.get('/api/sop', async (req, res) => {
    try {
      const sops = await storage.getSOPDocuments();
      res.json(sops);
    } catch (error) {
      res.status(500).json({ error: 'Failed to fetch SOP documents' });
    }
  });

  app.get('/api/sop/category/:category', async (req, res) => {
    try {
      const { category } = req.params;
      const sops = await storage.getSOPByCategory(decodeURIComponent(category));
      res.json(sops);
    } catch (error) {
      res.status(500).json({ error: 'Failed to fetch SOP documents by category' });
    }
  });

  app.post('/api/sop/search', async (req, res) => {
    try {
      const { keywords } = req.body;
      const keywordArray = Array.isArray(keywords) ? keywords : [keywords];
      const sops = await storage.searchSOPs(keywordArray);
      res.json(sops);
    } catch (error) {
      res.status(500).json({ error: 'Failed to search SOP documents' });
    }
  });

  app.post('/api/sop', async (req, res) => {
    try {
      const sopData = insertSOPSchema.parse(req.body);
      const sop = await storage.createSOPDocument(sopData);
      res.json(sop);
    } catch (error) {
      res.status(500).json({ error: 'Failed to create SOP document' });
    }
  });

  app.put('/api/sop/:id', async (req, res) => {
    try {
      const { id } = req.params;
      const updates = req.body;
      const sop = await storage.updateSOPDocument(id, updates);
      
      if (!sop) {
        return res.status(404).json({ error: 'SOP document not found' });
      }
      
      res.json(sop);
    } catch (error) {
      res.status(500).json({ error: 'Failed to update SOP document' });
    }
  });

  app.delete('/api/sop/:id', async (req, res) => {
    try {
      const { id } = req.params;
      const deleted = await storage.deleteSOPDocument(id);
      
      if (!deleted) {
        return res.status(404).json({ error: 'SOP document not found' });
      }
      
      res.json({ success: true });
    } catch (error) {
      res.status(500).json({ error: 'Failed to delete SOP document' });
    }
  });

  // Export endpoints
  app.get('/api/export/conversations/:type', async (req, res) => {
    try {
      const { type } = req.params; // customer-wise, agent-wise, all
      const { format = 'json' } = req.query;
      
      let sessions: ChatSession[] = [];
      
      if (type === 'all') {
        sessions = Array.from((storage as any).chatSessions.values());
      } else if (type === 'customer-wise') {
        const { customerId } = req.query;
        if (customerId) {
          sessions = await storage.getSessionsByCustomer(customerId as string);
        }
      } else if (type === 'agent-wise') {
        const { agentId } = req.query;
        if (agentId) {
          sessions = await storage.getSessionsByAgent(agentId as string);
        }
      }

      // Enrich sessions with messages and user data
      const exportData = await Promise.all(
        sessions.map(async (session) => {
          const customer = session.customerId ? await storage.getCustomer(session.customerId) : null;
          const agent = session.agentId ? await storage.getUser(session.agentId) : null;
          const messages = await storage.getMessagesBySession(session.id);
          
          return {
            session: {
              ...session,
              customer: customer ? { ...customer } : null,
              agent: agent ? { ...agent, password: undefined } : null
            },
            messages
          };
        })
      );

      if (format === 'csv') {
        // Convert to CSV format
        const csvData = exportData.flatMap(({ session, messages }) =>
          messages.map(message => ({
            sessionId: session.sessionId,
            customerName: session.customer?.name || 'Unknown',
            customerEmail: session.customer?.email || 'Unknown',
            agentName: session.agent?.name || 'Unknown',
            agentRole: session.agent?.role || 'Unknown',
            messageContent: message.content,
            senderType: message.senderType,
            timestamp: message.timestamp,
            sessionStart: session.startTime,
            sessionEnd: session.endTime,
            sessionStatus: session.status
          }))
        );

        res.setHeader('Content-Type', 'text/csv');
        res.setHeader('Content-Disposition', `attachment; filename="conversations-${type}-${Date.now()}.csv"`);
        
        // Simple CSV generation
        const headers = Object.keys(csvData[0] || {}).join(',');
        const rows = csvData.map(row => Object.values(row).map(val => `"${val}"`).join(','));
        res.send([headers, ...rows].join('\n'));
      } else {
        res.setHeader('Content-Type', 'application/json');
        res.setHeader('Content-Disposition', `attachment; filename="conversations-${type}-${Date.now()}.json"`);
        res.json(exportData);
      }
    } catch (error) {
      res.status(500).json({ error: 'Failed to export conversations' });
    }
  });

  // Quick replies endpoints
  app.get('/api/quick-replies', async (req, res) => {
    try {
      const replies = await storage.getQuickReplies();
      res.json(replies);
    } catch (error) {
      res.status(500).json({ error: 'Failed to fetch quick replies' });
    }
  });

  app.get('/api/quick-replies/category/:category', async (req, res) => {
    try {
      const { category } = req.params;
      const replies = await storage.getQuickRepliesByCategory(category);
      res.json(replies);
    } catch (error) {
      res.status(500).json({ error: 'Failed to fetch quick replies by category' });
    }
  });

  // Dashboard stats endpoint
  app.get('/api/dashboard/stats', async (req, res) => {
    try {
      const activeSessions = await storage.getActiveSessions();
      const onlineAgents = await storage.getOnlineAgents();
      
      const activeChats = activeSessions.filter(s => s.status === 'active').length;
      const waitingChats = activeSessions.filter(s => s.status === 'waiting').length;
      
      res.json({
        activeChats,
        waitingChats,
        onlineAgents: onlineAgents.length,
        totalSessions: activeSessions.length
      });
    } catch (error) {
      res.status(500).json({ error: 'Failed to fetch dashboard stats' });
    }
  });

  return httpServer;
}
