import { useEffect, useRef } from 'react';
import { supabase } from '../services/supabase';
import { useAuth } from '../context/AuthContext';
import { RealtimeChannel } from '@supabase/supabase-js';
import type { Message } from './types/messageTypes';
import { formatMessage } from './utils/messageHelpers';

export const useMessageSubscription = (
  conversationId?: string,
  setMessages?: React.Dispatch<React.SetStateAction<Message[]>>,
  setConversationDetails?: React.Dispatch<React.SetStateAction<any>>,
  processingMessagesRef?: React.MutableRefObject<Set<string>>
) => {
  const { user } = useAuth();
  const messagesChannelRef = useRef<RealtimeChannel | null>(null);
  const conversationChannelRef = useRef<RealtimeChannel | null>(null);

  // Initialize real-time subscription for messages
  useEffect(() => {
    if (!conversationId || !setMessages || !processingMessagesRef) return;

    // Clean up previous subscription
    if (messagesChannelRef.current) {
      supabase.removeChannel(messagesChannelRef.current);
    }

    // Set up new subscription
    const channel = supabase
      .channel(`messages:${conversationId}`)
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'messages',
          filter: `conversation_id=eq.${conversationId}`,
        },
        async (payload: any) => {
          const newMessage = payload.new as any;

          // تجاهل الرسائل التي أرسلها المستخدم الحالي وهي قيد المعالجة
          if (newMessage.sender_id === user?.id && processingMessagesRef.current.has(newMessage.id)) {
            processingMessagesRef.current.delete(newMessage.id);
            return;
          }

          const formattedNewMessage = await formatMessage(newMessage);

          // التحقق من أن الرسالة غير موجودة بالفعل قبل إضافتها
          setMessages((currentMessages) => {
            // إذا كانت الرسالة موجودة بالفعل، لا تضفها مرة أخرى
            if (currentMessages.some(msg => msg.id === formattedNewMessage.id)) {
              return currentMessages;
            }
            return [...currentMessages, formattedNewMessage];
          });
        }
      )
      .subscribe();

    messagesChannelRef.current = channel;

    return () => {
      supabase.removeChannel(channel);
    };
  }, [conversationId, user?.id, setMessages, processingMessagesRef]);

  // Initialize real-time subscription for conversation updates
  useEffect(() => {
    if (!conversationId || !setConversationDetails) return;

    // Clean up previous subscription
    if (conversationChannelRef.current) {
      supabase.removeChannel(conversationChannelRef.current);
    }

    // Set up new subscription
    const channel = supabase
      .channel(`conversation-updates:${conversationId}`)
      .on(
        'postgres_changes',
        {
          event: 'UPDATE',
          schema: 'public',
          table: 'conversations',
          filter: `id=eq.${conversationId}`,
        },
        (payload: any) => {
          const { new: updatedConversation } = payload;
          setConversationDetails(updatedConversation);
        }
      )
      .subscribe();

    conversationChannelRef.current = channel;

    return () => {
      supabase.removeChannel(channel);
    };
  }, [conversationId, setConversationDetails]);

  // Clean up all subscriptions on unmount
  useEffect(() => {
    return () => {
      if (messagesChannelRef.current) {
        supabase.removeChannel(messagesChannelRef.current);
      }
      if (conversationChannelRef.current) {
        supabase.removeChannel(conversationChannelRef.current);
      }
    };
  }, []);
};
