import { useEffect, useRef, useCallback } from 'react';
import type { Message } from './types/messageTypes';

export const useMessageUI = (
  messages: Message[],
  userId?: string,
  conversationId?: string
) => {
  const messagesEndRef = useRef<HTMLDivElement>(null);

  // Scroll to bottom when new messages arrive
  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  const scrollToBottom = useCallback(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, []);

  // تحديث حالة الرسائل إلى "تم التسليم" عند فتح المحادثة
  useEffect(() => {
    if (!conversationId || !userId) return;

    const markMessagesAsDelivered = async () => {
      try {
        // تحديث الرسائل التي لم يتم تسليمها بعد
        const undeliveredMessages = messages.filter(
          msg => msg.senderId !== userId && msg.status === 'sent'
        );

        if (undeliveredMessages.length > 0) {
          // تحديث حالة الرسائل إلى "تم التسليم"
          // ملاحظة: هذا التحديث محلي فقط، يمكن إضافة إشعار للخادم إذا لزم الأمر
          // في الوقت الحالي، هذا التحديث يهدف فقط لتحسين واجهة المستخدم
        }
      } catch (error) {
        console.error('Error marking messages as delivered:', error);
      }
    };

    markMessagesAsDelivered();
  }, [conversationId, messages, userId]);

  return {
    messagesEndRef,
    scrollToBottom
  };
};
