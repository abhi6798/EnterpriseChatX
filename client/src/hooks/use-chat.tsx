import { useEffect, useCallback, useState } from 'react';
import { useWebSocket } from './use-websocket';
import type { WSMessage } from '@shared/schema';

export function useChat(sessionId: string, userId?: string, userType: 'customer' | 'agent' = 'customer') {
  const { isConnected, sendMessage, lastMessage } = useWebSocket('/ws');
  const [isTyping, setIsTyping] = useState(false);
  const [remoteTyping, setRemoteTyping] = useState(false);
  
  // Join session when connected
  useEffect(() => {
    if (isConnected && sessionId) {
      const joinMessage: WSMessage = {
        type: 'join_session',
        sessionId,
        userId: userId || `${userType}-${Date.now()}`,
        userType
      };
      sendMessage(joinMessage);
    }
  }, [isConnected, sessionId, userId, userType, sendMessage]);

  // Handle incoming messages
  useEffect(() => {
    if (lastMessage) {
      switch (lastMessage.type) {
        case 'agent_typing':
          if (userType === 'customer') {
            setRemoteTyping(true);
            setTimeout(() => setRemoteTyping(false), 3000);
          }
          break;
        case 'customer_typing':
          if (userType === 'agent') {
            setRemoteTyping(true);
            setTimeout(() => setRemoteTyping(false), 3000);
          }
          break;
        case 'session_transfer':
          // Handle session transfer notifications
          console.log('Session transferred:', lastMessage.data);
          break;
        case 'session_ended':
          // Handle session end notifications
          console.log('Session ended:', lastMessage.data);
          break;
      }
    }
  }, [lastMessage, userType]);

  const sendChatMessage = useCallback((content: string, senderName?: string) => {
    if (!sessionId || !isConnected) return false;

    const message: WSMessage = {
      type: 'chat_message',
      sessionId,
      userId: userId || `${userType}-${Date.now()}`,
      userType,
      data: {
        content,
        senderName: senderName || (userType === 'customer' ? 'Customer' : 'Agent')
      }
    };

    return sendMessage(message);
  }, [sessionId, isConnected, userId, userType, sendMessage]);

  const sendTypingIndicator = useCallback((typing: boolean) => {
    if (!sessionId || !isConnected) return false;

    setIsTyping(typing);
    
    const message: WSMessage = {
      type: userType === 'customer' ? 'customer_typing' : 'agent_typing',
      sessionId,
      userId: userId || `${userType}-${Date.now()}`,
      userType,
      data: { typing }
    };

    return sendMessage(message);
  }, [sessionId, isConnected, userId, userType, sendMessage]);

  const transferSession = useCallback((newAgentId: string, reason?: string) => {
    if (!sessionId || !isConnected || userType !== 'agent') return false;

    const message: WSMessage = {
      type: 'session_transfer',
      sessionId,
      userId: userId || `${userType}-${Date.now()}`,
      userType,
      data: {
        newAgentId,
        reason: reason || 'Manual transfer'
      }
    };

    return sendMessage(message);
  }, [sessionId, isConnected, userId, userType, sendMessage]);

  const endSession = useCallback((reason?: string) => {
    if (!sessionId || !isConnected) return false;

    const message: WSMessage = {
      type: 'session_ended',
      sessionId,
      userId: userId || `${userType}-${Date.now()}`,
      userType,
      data: {
        reason: reason || 'Session ended',
        endedBy: userId || userType
      }
    };

    return sendMessage(message);
  }, [sessionId, isConnected, userId, userType, sendMessage]);

  const leaveSession = useCallback(() => {
    if (!sessionId || !isConnected) return false;

    const message: WSMessage = {
      type: 'leave_session',
      sessionId,
      userId: userId || `${userType}-${Date.now()}`,
      userType
    };

    return sendMessage(message);
  }, [sessionId, isConnected, userId, userType, sendMessage]);

  return {
    isConnected,
    isTyping,
    remoteTyping,
    sendChatMessage,
    sendTypingIndicator,
    transferSession,
    endSession,
    leaveSession,
    lastMessage
  };
}
