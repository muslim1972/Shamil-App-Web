import React from 'react';
import type { Message } from '../../types';
import { useAuth } from '../../context/AuthContext';
import { MessageBubble } from './MessageBubble';

interface MessageListProps {
  messages: Message[];
  loading: boolean;
  messagesEndRef: React.RefObject<HTMLDivElement>;
  onMessageLongPress: (target: EventTarget | null, message: Message) => void;
  selectedMessages: string[];
  onMessageClick?: (message: Message) => void;
}

export const MessageList: React.FC<MessageListProps> = React.memo(({ messages, messagesEndRef, onMessageLongPress, selectedMessages, onMessageClick }) => {
  const { user } = useAuth();

  if (messages.length === 0) {
    return (
      <div className="text-center text-gray-500 py-8">
        لا توجد رسائل. ابدأ المحادثة الآن!
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {messages.map((message, index) => {
        // إنشاء مفتاح فريد يجمع بين معرف الرسالة وموقعها في القائمة والطابع الزمني
        const uniqueKey = `${message.id}-${index}-${message.timestamp}`;

        const isOwnMessage = message.senderId === user?.id;
        const isSelected = selectedMessages.includes(message.id);

        return (
          <div
            key={uniqueKey} // Use unique key combining id, index and timestamp
            className={`flex ${isOwnMessage ? 'justify-end' : 'justify-start'}`}
          >
            <MessageBubble
              message={message}
              isOwnMessage={isOwnMessage}
              onLongPress={onMessageLongPress}
              isSelected={isSelected}
              onClick={() => onMessageClick && onMessageClick(message)}
              messageId={message.id}
            />
          </div>
        );
      })}
      <div ref={messagesEndRef} />
    </div>
  );
});

MessageList.displayName = 'MessageList';
