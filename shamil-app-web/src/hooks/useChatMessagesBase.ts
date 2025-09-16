import { useEffect, useRef } from 'react';
import { useAuth } from '../context/AuthContext';
import type { UseChatMessagesProps } from './types/messageTypes';
import { useMessageFetch } from './useMessageFetch';
import { useMessageSubscription } from './useMessageSubscription';
import { useMessageUI } from './useMessageUI';

export const useChatMessagesBase = ({ conversationId }: UseChatMessagesProps) => {
  const { user } = useAuth();

  // لتتبع الرسائل قيد المعالجة
  const processingMessagesRef = useRef<Set<string>>(new Set());

  // استخدام hooks لجلب البيانات
  const {
    messages,
    setMessages,
    loading,
    conversationDetails,
    fetchMessages,
    fetchConversationDetails
  } = useMessageFetch(conversationId);

  // استخدام hooks للاشتراك في التحديثات
  useMessageSubscription(
    conversationId,
    setMessages,
    () => {}, // سيتم التعامل مع تحديث المحادثة في useEffect منفصل
    processingMessagesRef
  );

  // استخدام hooks لإدارة واجهة المستخدم
  const {
    messagesEndRef,
    scrollToBottom
  } = useMessageUI(messages, user?.id, conversationId);

  // Initial data fetch
  useEffect(() => {
    if (conversationId) {
      fetchMessages();
      fetchConversationDetails();
    }
  }, [conversationId, fetchMessages, fetchConversationDetails]);

  return {
    messages,
    setMessages,
    loading,
    conversationDetails,
    messagesEndRef,
    scrollToBottom,
    processingMessagesRef,
    fetchMessages,
    fetchConversationDetails,
    user
  };
};

// تصدير الأنواع والوظائف المساعدة للاستخدام في الملفات الأخرى
export type { Message, MessageStatus } from './types/messageTypes';
export { generateTempId, updateMessageStatus, updateTempMessage, updateConversationSettings, formatMessage } from './utils/messageHelpers';
