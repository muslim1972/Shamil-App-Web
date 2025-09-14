// useChatMessages Hook
// This hook handles chat messages display and scrolling

import { useState, useEffect, useCallback, useRef } from 'react';

import { useAuth } from '../context/AuthContext';
import { useChatMessages as useMessages } from './useMessages';
import { supabase } from '../services/supabase';

interface UseChatMessagesProps {
  conversationId?: string;
}

interface ConversationDetails {
  id: string;
  name: string;
}

export const useChatMessages = ({ conversationId }: UseChatMessagesProps = {}) => {
  const { user } = useAuth();
  const { messages, loading, sendMessage, messagesEndRef, isUploading, pickAndSendMedia, sendAudioMessage } = useMessages({ conversationId });
  const [conversationDetails, setConversationDetails] = useState<ConversationDetails | null>(null);
  
  // Ref for messages container
  const messagesContainerRef = useRef<HTMLDivElement>(null);

  // دالة للتمرير إلى آخر رسالة
  const scrollToBottom = useCallback(() => {
    if (messagesEndRef.current) {
      messagesEndRef.current.scrollIntoView({ behavior: 'smooth', block: 'end' });
      // التأكد من وصول التمرير إلى القاع تمامًا
      const container = document.getElementById('messages-container');
      if (container) {
        container.scrollTop = container.scrollHeight;
      }
    }
  }, [messagesEndRef]);

  const fetchConversationDetails = useCallback(async () => {
    if (!conversationId || !user?.id) return;

    try {
      const { data: convData, error: convError } = await supabase
        .from('conversations')
        .select('id, participants')
        .eq('id', conversationId)
        .single();

      if (convError) {
        console.error('Error fetching conversation details:', convError);
        return;
      }

      if (convData && convData.participants) {
        const otherUserId = convData.participants.find((id: string) => id !== user.id);
        if (otherUserId) {
          const { data: userData, error: userError } = await supabase
            .from('users')
            .select('username')
            .eq('id', otherUserId)
            .single();

          if (userError) {
            console.error('Error fetching other user details:', userError);
          } else if (userData) {
            setConversationDetails({
              id: convData.id,
              name: userData.username,
            });
          }
        } else {
          setConversationDetails({
            id: convData.id,
            name: 'محادثة جماعية',
          });
        }
      }
    } catch (err) {
      console.error('Unexpected error fetching conversation details:', err);
    }
  }, [conversationId, user]);

  useEffect(() => {
    fetchConversationDetails();
  }, [fetchConversationDetails]);

  useEffect(() => {
    // تم إزالة markMessagesAsRead لأنها غير موجودة في useMessages
  }, [conversationId]);

  // التمرير إلى آخر رسالة عند تحديث الرسائل أو اكتمال التحميل
  useEffect(() => {
    // فقط قم بالتمرير عندما لا تكون هناك رسائل قيد التحميل
    if (!loading && messages.length > 0) {
      // استخدام requestAnimationFrame لضمان التمرير بعد اكتمال العرض
      requestAnimationFrame(() => {
        scrollToBottom();
      });
    }
  }, [messages, loading, scrollToBottom]);

  return {
    messages,
    loading,
    sendMessage,
    messagesEndRef,
    isUploading,
    pickAndSendMedia,
    sendAudioMessage,
    conversationDetails,
    scrollToBottom,
    messagesContainerRef
  };
};
