import { supabase } from '../../services/supabase';
import type { Message, MessageStatus } from '../types/messageTypes';

// دالة لإنشاء معرّف فريد للرسائل المؤقتة
export const generateTempId = (userId?: string) => 
  `temp-${userId}-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;

// دالة لتحديث حالة رسالة
export const updateMessageStatus = (
  setMessages: React.Dispatch<React.SetStateAction<Message[]>>,
  messageId: string,
  status: MessageStatus
) => {
  setMessages(currentMessages =>
    currentMessages.map(msg =>
      msg.id === messageId ? { ...msg, status } : msg
    )
  );
};

// دالة لتحديث رسالة مؤقتة بالرسالة الفعلية من الخادم
export const updateTempMessage = (
  setMessages: React.Dispatch<React.SetStateAction<Message[]>>,
  tempId: string,
  newMessage: any,
  signedUrl?: string | null
) => {
  setMessages(currentMessages =>
    currentMessages.map(msg =>
      msg.id === tempId
        ? {
            id: newMessage.id,
            conversationId: newMessage.conversation_id,
            text: newMessage.content,
            senderId: newMessage.sender_id,
            timestamp: new Date(newMessage.created_at).toISOString(),
            message_type: newMessage.message_type as 'image' | 'video' | 'audio' | 'file',
            caption: newMessage.caption,
            media_metadata: newMessage.media_metadata,
            signedUrl: signedUrl || null,
            status: 'sent' as MessageStatus,
            isTemp: false,
          }
        : msg
    )
  );
};

// دالة لتحديث إعدادات المحادثة
export const updateConversationSettings = async (conversationId: string, userId: string) => {
  if (!conversationId || !userId) return;

  await supabase
    .from('user_conversation_settings')
    .upsert(
      {
        user_id: userId,
        conversation_id: conversationId,
        is_hidden: false,
        hidden_at: null,
      },
      { onConflict: 'user_id,conversation_id' }
    );
};

// دالة لتحويل رسالة من تنسيق قاعدة البيانات إلى تنسيق واجهة المستخدم
export const formatMessage = async (msg: any): Promise<Message> => {
  let signedUrl = null;
  if (msg.message_type !== 'text') {
    const { data: signedUrlData } = await supabase.storage
      .from('call-files')
      .createSignedUrl(msg.content, 3600);
    signedUrl = signedUrlData?.signedUrl || null;
  }

  return {
    id: msg.id,
    conversationId: msg.conversation_id,
    text: msg.content,
    senderId: msg.sender_id,
    timestamp: new Date(msg.created_at).toISOString(),
    message_type: msg.message_type,
    caption: msg.caption,
    media_metadata: msg.media_metadata,
    signedUrl,
    status: 'sent' as MessageStatus,
    isTemp: false,
  };
};
