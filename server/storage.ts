import { 
  type User, type InsertUser,
  type Customer, type InsertCustomer,
  type ChatSession, type InsertChatSession,
  type Message, type InsertMessage,
  type SOPDocument, type InsertSOPDocument,
  type QuickReply, type InsertQuickReply
} from "@shared/schema";
import { randomUUID } from "crypto";

export interface IStorage {
  // User management
  getUser(id: string): Promise<User | undefined>;
  getUserByUsername(username: string): Promise<User | undefined>;
  createUser(user: InsertUser): Promise<User>;
  updateUserOnlineStatus(id: string, isOnline: boolean): Promise<void>;
  getAgentsByRole(role: string): Promise<User[]>;
  getOnlineAgents(): Promise<User[]>;

  // Customer management
  getCustomer(id: string): Promise<Customer | undefined>;
  getCustomerByEmail(email: string): Promise<Customer | undefined>;
  createCustomer(customer: InsertCustomer): Promise<Customer>;
  updateCustomer(id: string, updates: Partial<Customer>): Promise<Customer | undefined>;

  // Chat session management
  getChatSession(id: string): Promise<ChatSession | undefined>;
  getChatSessionBySessionId(sessionId: string): Promise<ChatSession | undefined>;
  createChatSession(session: InsertChatSession): Promise<ChatSession>;
  updateChatSession(id: string, updates: Partial<ChatSession>): Promise<ChatSession | undefined>;
  getActiveSessions(): Promise<ChatSession[]>;
  getSessionsByAgent(agentId: string): Promise<ChatSession[]>;
  getSessionsByCustomer(customerId: string): Promise<ChatSession[]>;

  // Message management
  getMessage(id: string): Promise<Message | undefined>;
  getMessagesBySession(sessionId: string): Promise<Message[]>;
  createMessage(message: InsertMessage): Promise<Message>;
  getRecentMessages(sessionId: string, limit: number): Promise<Message[]>;

  // SOP management
  getSOPDocument(id: string): Promise<SOPDocument | undefined>;
  getSOPDocuments(): Promise<SOPDocument[]>;
  getSOPByCategory(category: string): Promise<SOPDocument[]>;
  searchSOPs(keywords: string[]): Promise<SOPDocument[]>;
  createSOPDocument(sop: InsertSOPDocument): Promise<SOPDocument>;
  updateSOPDocument(id: string, updates: Partial<SOPDocument>): Promise<SOPDocument | undefined>;
  deleteSOPDocument(id: string): Promise<boolean>;

  // Quick replies
  getQuickReplies(): Promise<QuickReply[]>;
  getQuickRepliesByCategory(category: string): Promise<QuickReply[]>;
  createQuickReply(reply: InsertQuickReply): Promise<QuickReply>;
}

export class MemStorage implements IStorage {
  private users: Map<string, User> = new Map();
  private customers: Map<string, Customer> = new Map();
  private chatSessions: Map<string, ChatSession> = new Map();
  private messages: Map<string, Message> = new Map();
  private sopDocuments: Map<string, SOPDocument> = new Map();
  private quickReplies: Map<string, QuickReply> = new Map();

  constructor() {
    this.seedData();
  }

  private seedData() {
    // Create admin user
    const admin: User = {
      id: randomUUID(),
      username: "admin",
      password: "admin123",
      role: "admin",
      name: "Sarah Chen",
      email: "sarah.chen@company.com",
      isOnline: true,
      createdAt: new Date(),
    };
    this.users.set(admin.id, admin);

    // Create team lead
    const teamLead: User = {
      id: randomUUID(),
      username: "teamlead1",
      password: "password123",
      role: "team_lead",
      name: "Jennifer Park",
      email: "jennifer.park@company.com",
      isOnline: true,
      createdAt: new Date(),
    };
    this.users.set(teamLead.id, teamLead);

    // Create senior agent
    const seniorAgent: User = {
      id: randomUUID(),
      username: "senior1",
      password: "password123",
      role: "senior_agent",
      name: "David Kim",
      email: "david.kim@company.com",
      isOnline: true,
      createdAt: new Date(),
    };
    this.users.set(seniorAgent.id, seniorAgent);

    // Create regular agents
    const agents = [
      {
        id: randomUUID(),
        username: "agent1",
        password: "password123",
        role: "agent",
        name: "Mike Thompson",
        email: "mike.thompson@company.com",
        isOnline: true,
        createdAt: new Date(),
      },
      {
        id: randomUUID(),
        username: "agent2",
        password: "password123",
        role: "agent",
        name: "Anna Martinez",
        email: "anna.martinez@company.com",
        isOnline: true,
        createdAt: new Date(),
      }
    ];
    agents.forEach(agent => this.users.set(agent.id, agent));

    // Create sample customers
    const customers = [
      {
        id: randomUUID(),
        name: "Emma Wilson",
        email: "emma.wilson@email.com",
        customerId: "CUS-2024-5678",
        memberSince: new Date('2023-01-15'),
        totalOrders: 24,
        status: "premium",
      },
      {
        id: randomUUID(),
        name: "Alex Kumar",
        email: "alex.kumar@email.com",
        customerId: "CUS-2024-1234",
        memberSince: new Date('2023-03-20'),
        totalOrders: 12,
        status: "regular",
      }
    ];
    customers.forEach(customer => this.customers.set(customer.id, customer));

    // Create sample SOP documents
    const sopDocs = [
      {
        id: randomUUID(),
        title: "Payment Issue Resolution",
        category: "Payment & Billing",
        content: `## When customer reports payment not processed:
1. Verify customer identity using order number and email
2. Check payment status in the admin panel
3. If payment shows "pending", explain 24-48 hour processing time
4. If payment failed, guide customer to retry payment
5. For successful payments not reflected, escalate to senior agent

### Quick Response Templates:
**Payment Processing:** "I can see your payment is being processed. It typically takes 24-48 hours to reflect in our system. You'll receive an email confirmation once it's complete."

**Payment Failed:** "It looks like your payment didn't go through. This can happen due to insufficient funds or card restrictions. Please try again or use an alternative payment method."`,
        keywords: ["payment", "billing", "transaction", "failed payment", "pending"],
        version: "2.1",
        lastUpdated: new Date(),
        uploadedBy: admin.id,
      },
      {
        id: randomUUID(),
        title: "Refund Policy Guidelines",
        category: "Payment & Billing",
        content: `## Refund Processing Guidelines:
1. Check order date (must be within 30 days)
2. Verify item condition requirements
3. Process refund through admin panel
4. Send confirmation email to customer
5. Update order status

### Refund Timeframes:
- Credit card: 3-5 business days
- Digital wallet: 1-2 business days
- Bank transfer: 5-7 business days`,
        keywords: ["refund", "return", "money back", "cancellation"],
        version: "1.5",
        lastUpdated: new Date(),
        uploadedBy: admin.id,
      },
      {
        id: randomUUID(),
        title: "Shipping Delay Procedures",
        category: "Shipping & Returns",
        content: `## Handling Shipping Delays:
1. Check tracking information in system
2. Provide realistic delivery estimates
3. Offer compensation if delay exceeds 7 days
4. Update customer with regular communication
5. Escalate to logistics team if needed`,
        keywords: ["shipping", "delivery", "delay", "tracking", "logistics"],
        version: "1.0",
        lastUpdated: new Date(),
        uploadedBy: teamLead.id,
      }
    ];
    sopDocs.forEach(sop => this.sopDocuments.set(sop.id, sop));

    // Create quick replies
    const replies = [
      {
        id: randomUUID(),
        title: "Welcome Message",
        content: "Hello! Thank you for contacting our support team. How can I assist you today?",
        category: "greetings",
        createdBy: admin.id,
      },
      {
        id: randomUUID(),
        title: "Order Status Check",
        content: "I'll be happy to check your order status. Could you please provide your order number?",
        category: "orders",
        createdBy: admin.id,
      },
      {
        id: randomUUID(),
        title: "Escalation Notice",
        content: "I'm transferring your chat to a senior agent who can better assist you with this issue. Please hold on for a moment.",
        category: "escalation",
        createdBy: admin.id,
      }
    ];
    replies.forEach(reply => this.quickReplies.set(reply.id, reply));
  }

  // User methods
  async getUser(id: string): Promise<User | undefined> {
    return this.users.get(id);
  }

  async getUserByUsername(username: string): Promise<User | undefined> {
    return Array.from(this.users.values()).find(user => user.username === username);
  }

  async createUser(insertUser: InsertUser): Promise<User> {
    const id = randomUUID();
    const user: User = { 
      ...insertUser, 
      id, 
      role: insertUser.role || 'agent',
      isOnline: false,
      createdAt: new Date()
    };
    this.users.set(id, user);
    return user;
  }

  async updateUserOnlineStatus(id: string, isOnline: boolean): Promise<void> {
    const user = this.users.get(id);
    if (user) {
      user.isOnline = isOnline;
      this.users.set(id, user);
    }
  }

  async getAgentsByRole(role: string): Promise<User[]> {
    return Array.from(this.users.values()).filter(user => user.role === role);
  }

  async getOnlineAgents(): Promise<User[]> {
    return Array.from(this.users.values()).filter(user => 
      user.role !== 'customer' && user.isOnline
    );
  }

  // Customer methods
  async getCustomer(id: string): Promise<Customer | undefined> {
    return this.customers.get(id);
  }

  async getCustomerByEmail(email: string): Promise<Customer | undefined> {
    return Array.from(this.customers.values()).find(customer => customer.email === email);
  }

  async createCustomer(insertCustomer: InsertCustomer): Promise<Customer> {
    const id = randomUUID();
    const customer: Customer = {
      ...insertCustomer,
      id,
      customerId: insertCustomer.customerId || null,
      memberSince: new Date(),
      totalOrders: insertCustomer.totalOrders || 0,
      status: insertCustomer.status || "regular"
    };
    this.customers.set(id, customer);
    return customer;
  }

  async updateCustomer(id: string, updates: Partial<Customer>): Promise<Customer | undefined> {
    const customer = this.customers.get(id);
    if (customer) {
      const updated = { ...customer, ...updates };
      this.customers.set(id, updated);
      return updated;
    }
    return undefined;
  }

  // Chat session methods
  async getChatSession(id: string): Promise<ChatSession | undefined> {
    return this.chatSessions.get(id);
  }

  async getChatSessionBySessionId(sessionId: string): Promise<ChatSession | undefined> {
    return Array.from(this.chatSessions.values()).find(session => session.sessionId === sessionId);
  }

  async createChatSession(insertSession: InsertChatSession): Promise<ChatSession> {
    const id = randomUUID();
    const session: ChatSession = {
      ...insertSession,
      id,
      customerId: insertSession.customerId || null,
      agentId: insertSession.agentId || null,
      status: insertSession.status || "active",
      startTime: new Date(),
      endTime: null,
      transferHistory: [],
      rating: null
    };
    this.chatSessions.set(id, session);
    return session;
  }

  async updateChatSession(id: string, updates: Partial<ChatSession>): Promise<ChatSession | undefined> {
    const session = this.chatSessions.get(id);
    if (session) {
      const updated = { ...session, ...updates };
      this.chatSessions.set(id, updated);
      return updated;
    }
    return undefined;
  }

  async getActiveSessions(): Promise<ChatSession[]> {
    return Array.from(this.chatSessions.values()).filter(session => 
      session.status === "active" || session.status === "waiting"
    );
  }

  async getSessionsByAgent(agentId: string): Promise<ChatSession[]> {
    return Array.from(this.chatSessions.values()).filter(session => session.agentId === agentId);
  }

  async getSessionsByCustomer(customerId: string): Promise<ChatSession[]> {
    return Array.from(this.chatSessions.values()).filter(session => session.customerId === customerId);
  }

  // Message methods
  async getMessage(id: string): Promise<Message | undefined> {
    return this.messages.get(id);
  }

  async getMessagesBySession(sessionId: string): Promise<Message[]> {
    return Array.from(this.messages.values())
      .filter(message => message.sessionId === sessionId)
      .sort((a, b) => (a.timestamp?.getTime() || 0) - (b.timestamp?.getTime() || 0));
  }

  async createMessage(insertMessage: InsertMessage): Promise<Message> {
    const id = randomUUID();
    const message: Message = {
      ...insertMessage,
      id,
      sessionId: insertMessage.sessionId || null,
      senderId: insertMessage.senderId || null,
      messageType: insertMessage.messageType || "text",
      timestamp: new Date(),
      readBy: []
    };
    this.messages.set(id, message);
    return message;
  }

  async getRecentMessages(sessionId: string, limit: number): Promise<Message[]> {
    const messages = await this.getMessagesBySession(sessionId);
    return messages.slice(-limit);
  }

  // SOP methods
  async getSOPDocument(id: string): Promise<SOPDocument | undefined> {
    return this.sopDocuments.get(id);
  }

  async getSOPDocuments(): Promise<SOPDocument[]> {
    return Array.from(this.sopDocuments.values());
  }

  async getSOPByCategory(category: string): Promise<SOPDocument[]> {
    return Array.from(this.sopDocuments.values()).filter(sop => sop.category === category);
  }

  async searchSOPs(keywords: string[]): Promise<SOPDocument[]> {
    return Array.from(this.sopDocuments.values()).filter(sop => 
      keywords.some(keyword => 
        sop.title.toLowerCase().includes(keyword.toLowerCase()) ||
        sop.content.toLowerCase().includes(keyword.toLowerCase()) ||
        sop.keywords?.some(k => k.toLowerCase().includes(keyword.toLowerCase()))
      )
    );
  }

  async createSOPDocument(insertSOP: InsertSOPDocument): Promise<SOPDocument> {
    const id = randomUUID();
    const sop: SOPDocument = {
      ...insertSOP,
      id,
      keywords: insertSOP.keywords || null,
      uploadedBy: insertSOP.uploadedBy || null,
      version: insertSOP.version || "1.0",
      lastUpdated: new Date()
    };
    this.sopDocuments.set(id, sop);
    return sop;
  }

  async updateSOPDocument(id: string, updates: Partial<SOPDocument>): Promise<SOPDocument | undefined> {
    const sop = this.sopDocuments.get(id);
    if (sop) {
      const updated = { ...sop, ...updates, lastUpdated: new Date() };
      this.sopDocuments.set(id, updated);
      return updated;
    }
    return undefined;
  }

  async deleteSOPDocument(id: string): Promise<boolean> {
    return this.sopDocuments.delete(id);
  }

  // Quick reply methods
  async getQuickReplies(): Promise<QuickReply[]> {
    return Array.from(this.quickReplies.values());
  }

  async getQuickRepliesByCategory(category: string): Promise<QuickReply[]> {
    return Array.from(this.quickReplies.values()).filter(reply => reply.category === category);
  }

  async createQuickReply(insertReply: InsertQuickReply): Promise<QuickReply> {
    const id = randomUUID();
    const reply: QuickReply = { 
      ...insertReply, 
      id,
      category: insertReply.category || null,
      createdBy: insertReply.createdBy || null
    };
    this.quickReplies.set(id, reply);
    return reply;
  }
}

export const storage = new MemStorage();
