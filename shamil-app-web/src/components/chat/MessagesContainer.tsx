import React from 'react';
import { MessageList } from './MessageList';
import type { Message } from '../../types';

interface MessagesContainerProps {
  messages: Message[];
  loading: boolean;
  messagesEndRef: React.RefObject<HTMLDivElement>;
  onMessageLongPress: (target: EventTarget | null, message: Message) => void;
  selectedMessages: string[];
  onMessageClick?: (message: Message) => void;
  onDeselectAll: () => void;
}

export const MessagesContainer: React.FC<MessagesContainerProps> = ({
  messages,
  loading,
  messagesEndRef,
  onMessageLongPress,
  selectedMessages,
  onMessageClick,
  onDeselectAll
}) => {
  return (
    <div
      className="flex-1 overflow-y-auto overflow-x-hidden p-4 bg-gray-100 bg-opacity-70 backdrop-blur-sm"
      id="messages-container"
      onClick={(e) => {
        // إذا نقر المستخدم في مكان فارغ وليس على رسالة، قم بإلغاء تحديد جميع الرسائل
        if (selectedMessages.length > 0) {
          // تحقق مما إذا كان النقر على رسالة أو في مكان فارغ
          const target = e.target as HTMLElement;
          const isMessageClick = target.closest('[data-message-id]');

          // إذا كان النقر في مكان فارغ، قم بإلغاء التأشير
          if (!isMessageClick) {
            onDeselectAll();
          }
        }
      }}
    >
      {loading ? (
        <div className="flex items-center justify-center h-full">
          <div className="text-center">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-500 mx-auto"></div>
            <p className="mt-4 text-gray-600">جاري تحميل الرسائل...</p>
          </div>
        </div>
      ) : (
        <MessageList
          messages={messages}
          loading={loading}
          messagesEndRef={messagesEndRef}
          onMessageLongPress={onMessageLongPress}
          selectedMessages={selectedMessages}
          onMessageClick={onMessageClick}
        />
      )}
    </div>
  );
};
