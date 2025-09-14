// MessageList Component
// This component renders the list of messages

import React, { useCallback } from 'react';
import type { Message } from '../../types';
import { useAuth } from '../../context/AuthContext';
import { MessageBubble } from './MessageBubble';

interface MessageListProps {
  messages: Message[];
  loading: boolean;
  messagesEndRef: React.RefObject<HTMLDivElement>;
}

export const MessageList: React.FC<MessageListProps> = React.memo(({ messages, messagesEndRef }) => {
  const { user } = useAuth();

  // استخدام useCallback لمنع إعادة إنشاء الدالة في كل مرة
  const renderMessage = useCallback((message: Message) => {
    const isOwnMessage = message.senderId === user?.id;
    
    return (
      <div
        key={`${message.id}-${Math.random().toString(36).substr(2, 9)}`}
        className={`flex ${isOwnMessage ? 'justify-end' : 'justify-start'}`}
      >
        <MessageBubble
          message={message}
          isOwnMessage={isOwnMessage}
        />
      </div>
    );
  }, [user?.id]);

  if (messages.length === 0) {
    return (
      <div className="text-center text-gray-500 py-8">
        لا توجد رسائل. ابدأ المحادثة الآن!
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {messages.map(renderMessage)}
      <div ref={messagesEndRef} />
    </div>
  );
});

MessageList.displayName = 'MessageList';