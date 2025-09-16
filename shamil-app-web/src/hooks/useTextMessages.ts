import { useCallback, useState } from 'react';
import { supabase } from '../services/supabase';
import type { Message, MessageStatus } from './types/messageTypes';
import { generateTempId, updateMessageStatus, updateTempMessage, updateConversationSettings } from './useChatMessagesBase';

export const useTextMessages = (
  conversationId: string | undefined,
  userId: string | undefined,
  setMessages: React.Dispatch<React.SetStateAction<Message[]>>,
  processingMessagesRef: React.MutableRefObject<Set<string>>
) => {
  const [isProcessingMessage, setIsProcessingMessage] = useState(false);

  const sendMessage = useCallback(
    async (text: string) => {
      if (!text.trim() || !conversationId || !userId || isProcessingMessage) return;

      setIsProcessingMessage(true);
      const tempId = generateTempId(userId);

      try {
        // إضافة رسالة مؤقتة فوراً قبل إرسالها للخادم
        setMessages((currentMessages) => {
          // التحقق من عدم وجود رسالة بنفس المحتوى من نفس المستخدم في آخر ثانية
          const isDuplicate = currentMessages.some(msg =>
            msg.senderId === userId &&
            msg.text === text.trim() &&
            new Date().getTime() - new Date(msg.timestamp).getTime() < 1000 &&
            msg.status !== 'failed'
          );

          if (isDuplicate) {
            setIsProcessingMessage(false);
            return currentMessages;
          }

          return [
            ...currentMessages,
            {
              id: tempId,
              conversationId: conversationId,
              text: text.trim(),
              senderId: userId,
              timestamp: new Date().toISOString(),
              message_type: 'text' as const,
              signedUrl: null,
              status: 'sending' as MessageStatus,
              isTemp: true,
            },
          ];
        });

        // إرسال الرسالة إلى الخادم
        const { data, error } = await supabase.from('messages').insert({
          conversation_id: conversationId,
          sender_id: userId,
          content: text.trim(),
          message_type: 'text',
        }).select();

        if (error) throw error;

        // إضافة المعرّف الجديد إلى قائمة الرسائل قيد المعالجة
        if (data && data.length > 0) {
          processingMessagesRef.current.add(data[0].id);

          // تحديث الرسالة المؤقتة بالرسالة الفعلية من الخادم
          updateTempMessage(setMessages, tempId, data[0]);
        }

        // تحديث إعدادات المحادثة
        await updateConversationSettings(conversationId, userId);

      } catch (err: any) {
        console.error('Error sending message:', err);
        // تحديث حالة الرسالة إلى "فشل الإرسال" بدلاً من حذفها
        updateMessageStatus(setMessages, tempId, 'failed');
        throw err;
      } finally {
        setIsProcessingMessage(false);
      }
    },
    [conversationId, userId, isProcessingMessage, setMessages, processingMessagesRef]
  );

  // دالة لإعادة إرسال رسالة فشل إرسالها
  const resendMessage = useCallback(async (messageId: string, messages: Message[]) => {
    const message = messages.find(msg => msg.id === messageId);
    if (!message || message.status !== 'failed') return;

    // تحديث حالة الرسالة إلى "جاري الإرسال"
    updateMessageStatus(setMessages, messageId, 'sending');

    try {
      const { data, error } = await supabase.from('messages').insert({
        conversation_id: conversationId,
        sender_id: userId,
        content: message.text,
        message_type: message.message_type,
      }).select();

      if (error) throw error;

      if (data && data.length > 0) {
        const newMessage = data[0];
        // إضافة المعرّف الجديد إلى قائمة الرسائل قيد المعالجة
        processingMessagesRef.current.add(newMessage.id);

        // تحديث الرسالة بالمعرف الجديد والحالة
        setMessages(currentMessages =>
          currentMessages.map(msg =>
            msg.id === messageId
              ? {
                  ...msg,
                  id: newMessage.id,
                  timestamp: new Date(newMessage.created_at).toISOString(),
                  status: 'sent' as MessageStatus,
                  isTemp: false,
                }
              : msg
          )
        );
      }
    } catch (error) {
      console.error('Error resending message:', error);
      updateMessageStatus(setMessages, messageId, 'failed');
    }
  }, [conversationId, userId, setMessages, processingMessagesRef]);

  return {
    sendMessage,
    resendMessage,
    isProcessingMessage
  };
};
