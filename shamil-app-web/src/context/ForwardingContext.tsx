import React, { createContext, useState, useContext, useMemo } from 'react';
import type { Message } from '../types';

interface ForwardingContextType {
  isForwarding: boolean;
  messagesToForward: Message[];
  startForwarding: (messages: Message[]) => void;
  completeForwarding: () => void;
}

const ForwardingContext = createContext<ForwardingContextType | undefined>(undefined);

export const ForwardingProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [messagesToForward, setMessagesToForward] = useState<Message[]>([]);

  const startForwarding = (messages: Message[]) => {
    // We need to strip out properties that are not part of the core message data
    // to avoid issues with JSON serialization and sending to the backend.
    const cleanMessages = messages.map(msg => ({
        id: msg.id, // The original ID is useful for context but will be new on the backend
        conversationId: msg.conversationId,
        text: msg.text,
        senderId: msg.senderId,
        timestamp: msg.timestamp,
        message_type: msg.message_type,
        caption: msg.caption,
        media_metadata: msg.media_metadata,
        // We don't include signedUrl or status
    }));
    setMessagesToForward(cleanMessages as Message[]);
  };

  const completeForwarding = () => {
    setMessagesToForward([]);
  };

  const value = useMemo(() => ({
    isForwarding: messagesToForward.length > 0,
    messagesToForward,
    startForwarding,
    completeForwarding,
  }), [messagesToForward]);

  return (
    <ForwardingContext.Provider value={value}>
      {children}
    </ForwardingContext.Provider>
  );
};

export const useForwarding = () => {
  const context = useContext(ForwardingContext);
  if (context === undefined) {
    throw new Error('useForwarding must be used within a ForwardingProvider');
  }
  return context;
};