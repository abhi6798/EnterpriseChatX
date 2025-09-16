import { sql } from "drizzle-orm";
import { pgTable, text, varchar, timestamp, integer, jsonb, boolean } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod";

export const users = pgTable("users", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  username: text("username").notNull().unique(),
  password: text("password").notNull(),
  role: text("role").notNull().default("agent"), // agent, senior_agent, team_lead, admin
  name: text("name").notNull(),
  email: text("email").notNull(),
  isOnline: boolean("is_online").default(false),
  createdAt: timestamp("created_at").defaultNow(),
});

export const customers = pgTable("customers", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  name: text("name").notNull(),
  email: text("email").notNull(),
  customerId: text("customer_id").unique(),
  memberSince: timestamp("member_since").defaultNow(),
  totalOrders: integer("total_orders").default(0),
  status: text("status").default("regular"), // regular, premium, vip
});

export const chatSessions = pgTable("chat_sessions", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  sessionId: text("session_id").notNull().unique(),
  customerId: varchar("customer_id").references(() => customers.id),
  agentId: varchar("agent_id").references(() => users.id),
  status: text("status").default("active"), // active, waiting, resolved, terminated
  startTime: timestamp("start_time").defaultNow(),
  endTime: timestamp("end_time"),
  transferHistory: jsonb("transfer_history").default([]),
  rating: integer("rating"),
});

export const messages = pgTable("messages", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  sessionId: varchar("session_id").references(() => chatSessions.id),
  senderId: varchar("sender_id"), // can be customer or agent
  senderType: text("sender_type").notNull(), // customer, agent, system
  content: text("content").notNull(),
  messageType: text("message_type").default("text"), // text, file, system
  timestamp: timestamp("timestamp").defaultNow(),
  readBy: jsonb("read_by").default([]),
});

export const sopDocuments = pgTable("sop_documents", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  title: text("title").notNull(),
  category: text("category").notNull(),
  content: text("content").notNull(),
  keywords: text("keywords").array(),
  version: text("version").default("1.0"),
  lastUpdated: timestamp("last_updated").defaultNow(),
  uploadedBy: varchar("uploaded_by").references(() => users.id),
});

export const quickReplies = pgTable("quick_replies", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  title: text("title").notNull(),
  content: text("content").notNull(),
  category: text("category"),
  createdBy: varchar("created_by").references(() => users.id),
});

// Insert schemas
export const insertUserSchema = createInsertSchema(users).pick({
  username: true,
  password: true,
  role: true,
  name: true,
  email: true,
});

export const insertCustomerSchema = createInsertSchema(customers).pick({
  name: true,
  email: true,
  customerId: true,
  totalOrders: true,
  status: true,
});

export const insertChatSessionSchema = createInsertSchema(chatSessions).pick({
  sessionId: true,
  customerId: true,
  agentId: true,
  status: true,
});

export const insertMessageSchema = createInsertSchema(messages).pick({
  sessionId: true,
  senderId: true,
  senderType: true,
  content: true,
  messageType: true,
});

export const insertSOPSchema = createInsertSchema(sopDocuments).pick({
  title: true,
  category: true,
  content: true,
  keywords: true,
  version: true,
  uploadedBy: true,
});

export const insertQuickReplySchema = createInsertSchema(quickReplies).pick({
  title: true,
  content: true,
  category: true,
  createdBy: true,
});

// Types
export type InsertUser = z.infer<typeof insertUserSchema>;
export type User = typeof users.$inferSelect;

export type InsertCustomer = z.infer<typeof insertCustomerSchema>;
export type Customer = typeof customers.$inferSelect;

export type InsertChatSession = z.infer<typeof insertChatSessionSchema>;
export type ChatSession = typeof chatSessions.$inferSelect;

export type InsertMessage = z.infer<typeof insertMessageSchema>;
export type Message = typeof messages.$inferSelect;

export type InsertSOPDocument = z.infer<typeof insertSOPSchema>;
export type SOPDocument = typeof sopDocuments.$inferSelect;

export type InsertQuickReply = z.infer<typeof insertQuickReplySchema>;
export type QuickReply = typeof quickReplies.$inferSelect;

// WebSocket message types
export type WSMessage = {
  type: 'chat_message' | 'agent_typing' | 'customer_typing' | 'session_transfer' | 'session_ended' | 'agent_status' | 'join_session' | 'leave_session';
  sessionId?: string;
  data?: any;
  userId?: string;
  userType?: 'customer' | 'agent';
};
