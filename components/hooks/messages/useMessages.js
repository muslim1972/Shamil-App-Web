import { useState } from 'react';
import { useTextMessaging } from './useTextMessaging';
import { useMediaMessaging } from './useMediaMessaging';
import { useRealtimeMessages } from './useRealtimeMessages';

export const useMessages = (conversationId) => {
  const [messages, setMessages] = useState([]);

  // استخدام الـ hooks المقسمة
  const { isSending, sendTextMessage } = useTextMessaging(conversationId);
  const { isUploading, sendImageMessage, sendAudioMessage } = useMediaMessaging(conversationId);
  const { isLoading, fetchMessages } = useRealtimeMessages(conversationId, messages, setMessages);

  // دالة موحدة لإرسال الرسائل النصية
  const handleSendText = async (text) => {
    await sendTextMessage(text);
  };

  // دالة موحدة لاختيار وإرسال الوسائط
  const pickAndSendMedia = async () => {
    await sendImageMessage();
  };

  return {
    messages,
    setMessages,
    isLoading,
    isSending,
    isUploading,
    handleSendText,
    pickAndSendMedia,
    sendAudioMessage,
    fetchMessages
  };
};

export default useMessages;
