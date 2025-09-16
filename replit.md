# Customer Support Chat System

## Overview

This is a real-time customer support chat system built with React (frontend) and Express.js (backend). The system features WebSocket-based communication for instant messaging, agent management, customer tracking, and comprehensive chat session handling. It includes advanced features like chat transfers between agents, SOP (Standard Operating Procedures) management, quick replies, and data export capabilities.

## User Preferences

Preferred communication style: Simple, everyday language.

## System Architecture

### Frontend Architecture
The frontend is built with React and uses a modern component architecture:

- **UI Framework**: React with TypeScript using shadcn/ui component library for consistent design
- **Routing**: Wouter for client-side routing with support for dashboard and widget views
- **State Management**: TanStack Query (React Query) for server state management and caching
- **Styling**: Tailwind CSS with custom theme variables and responsive design
- **Real-time Communication**: Custom WebSocket hooks for bidirectional chat communication

### Backend Architecture
The backend follows a RESTful API design with WebSocket support:

- **Server Framework**: Express.js with TypeScript for type safety
- **WebSocket Integration**: Built-in WebSocket server for real-time chat functionality
- **Storage Layer**: Abstract storage interface with in-memory implementation (easily replaceable with database)
- **Session Management**: PostgreSQL session storage with connect-pg-simple
- **Development Tools**: Vite integration for hot reloading and development server

### Data Storage Solutions
The system uses PostgreSQL as the primary database:

- **Database**: PostgreSQL with Drizzle ORM for type-safe database operations
- **Schema Design**: Comprehensive schema covering users, customers, chat sessions, messages, SOP documents, and quick replies
- **Connection**: Neon Database serverless PostgreSQL connection
- **Migrations**: Drizzle Kit for database schema migrations and management

### Authentication and Authorization
Role-based access control system:

- **User Roles**: Four-tier system (agent, senior_agent, team_lead, admin) with different permissions
- **Session Management**: Express sessions with PostgreSQL storage
- **User States**: Online/offline status tracking for real-time agent availability

### Real-time Communication
WebSocket-based messaging system:

- **Message Types**: Support for text, file uploads, and system messages
- **Session Management**: Real-time session joining, leaving, and status updates
- **Typing Indicators**: Live typing status between customers and agents
- **Agent Transfer**: Seamless handoff of conversations between agents with history tracking

## External Dependencies

### Core Dependencies
- **@neondatabase/serverless**: Serverless PostgreSQL database connection
- **drizzle-orm & drizzle-kit**: Type-safe ORM and migration tools for PostgreSQL
- **ws**: WebSocket library for real-time communication
- **connect-pg-simple**: PostgreSQL session store for Express sessions

### UI and Frontend Libraries
- **@radix-ui/***: Comprehensive set of accessible UI components
- **@tanstack/react-query**: Server state management and caching
- **class-variance-authority**: Utility for building variant-based component APIs
- **tailwindcss**: Utility-first CSS framework with custom design system

### Development and Build Tools
- **vite**: Fast build tool and development server
- **tsx**: TypeScript execution environment for development
- **esbuild**: Fast JavaScript bundler for production builds
- **@replit/vite-plugin-***: Replit-specific development plugins for enhanced DX

### Utility Libraries
- **date-fns**: Date manipulation and formatting
- **jspdf**: PDF generation for chat exports
- **zod**: Runtime type validation and schema validation
- **wouter**: Lightweight client-side routing

The system is designed to be modular and scalable, with clear separation of concerns between the frontend dashboard, customer chat widget, and backend API services.