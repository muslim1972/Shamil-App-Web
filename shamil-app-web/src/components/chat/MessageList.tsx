import React, { useCallback } from 'react';
import type { Message } from '../../types';
import { useAuth } from '../../context/AuthContext';
import { MessageBubble } from './MessageBubble';

interface MessageListProps {
  messages: Message[];
  loading: boolean;
  messagesEndRef: React.RefObject<HTMLDivElement>;
  onMessageLongPress: (target: EventTarget | null, message: Message) => void;
  selectedMessages?: Message[];
  onMessageClick?: (message: Message, e?: React.MouseEvent | React.TouchEvent) => void; // Updated type
}

export const MessageList: React.FC<MessageListProps> = React.memo(({ messages, messagesEndRef, onMessageLongPress, selectedMessages = [], onMessageClick }) => {
  const { user } = useAuth();

  const renderMessage = useCallback((message: Message) => {
    const isOwnMessage = message.senderId === user?.id;

    return (
      <div
        key={message.id} // Use stable key
        className={`flex ${isOwnMessage ? 'justify-end' : 'justify-start'}`}>
        <MessageBubble
          message={message}
          isOwnMessage={isOwnMessage}
          onLongPress={onMessageLongPress}
          isSelected={selectedMessages.some(m => m.id === message.id)}
          onClick={(message: Message, e?: React.MouseEvent | React.TouchEvent) => { // Updated type
            // منع انتشار الحدث لضمان عدم التأثير على التمرير
            if (e) {
              e.stopPropagation();
            }
            if (onMessageClick) {
              onMessageClick(message, e);
            }
          }}
        />
      </div>
    );
  }, [user?.id, onMessageLongPress, selectedMessages, onMessageClick]);

  if (messages.length === 0) {
    return (
      <div className="text-center text-gray-500 py-8">
        لا توجد رسائل. ابدأ المحادثة الآن!
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {messages.slice().reverse().map(renderMessage)}
      <div ref={messagesEndRef} />
    </div>
  );
});

MessageList.displayName = 'MessageList';