import React from 'react';
import type { Message } from '../../types';

interface MiniMessageBubbleProps {
  message: Message;
  isOwnMessage: boolean;
}

// This is a simplified version of MessageBubble for displaying forwarded messages.
// It does not have any interaction logic.
export const MiniMessageBubble: React.FC<MiniMessageBubbleProps> = React.memo(({ message, isOwnMessage }) => {
  const formatTime = (timestamp: string) => {
    const date = new Date(timestamp);
    return date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
  };

  return (
    <div
      className={`max-w-xs lg:max-w-md px-3 py-1.5 rounded-lg my-1 ${
      isOwnMessage
        ? 'bg-indigo-500 text-white'
        : 'bg-white text-gray-800 shadow-sm'
      }`}>
      <p className="text-sm">{message.text}</p>
      <div
        className={`flex items-center justify-end text-xs mt-1 w-full ${
          isOwnMessage ? 'text-indigo-200' : 'text-gray-500'
        }`}
      >
        {formatTime(message.timestamp)}
      </div>
    </div>
  );
});

MiniMessageBubble.displayName = 'MiniMessageBubble';