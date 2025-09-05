import { useEffect, useState, useCallback } from 'react';
import { supabase } from '../../../../lib/supabase';

export const useRealtimeMessages = (conversationId, initialMessages, setMessages) => {
  const [isLoading, setIsLoading] = useState(true);
  const [channel, setChannel] = useState(null);

  // دالة لتحميل الرسائل الأولية
  const fetchMessages = useCallback(async () => {
    if (!conversationId) return;

    setIsLoading(true);
    try {
      const { data, error } = await supabase
        .from('messages')
        .select(`
          *,
          sender:sender_id(id, username)
        `)
        .eq('conversation_id', conversationId)
        .order('created_at', { ascending: true });

      if (error) throw error;

      setMessages(data || []);
    } catch (error) {
      console.error('Error fetching messages:', error);
    } finally {
      setIsLoading(false);
    }
  }, [conversationId, setMessages]);

  // دالة للاستماع للرسائل الجديدة
  useEffect(() => {
    if (!conversationId) return;

    // تحميل الرسائل الأولية
    fetchMessages();

    // إنشاء قناة Realtime
    const messagesChannel = supabase
      .channel(`messages:${conversationId}`)
      .on('postgres_changes', {
        event: 'INSERT',
        schema: 'public',
        table: 'messages',
        filter: `conversation_id=eq.${conversationId}`
      }, async (payload) => {
        

        // جلب معلومات المرسل من جدول users
        const { data: senderData } = await supabase
          .from('users')
          .select('id, username')
          .eq('id', payload.new.sender_id)
          .single();

        // إضافة الرسالة الجديدة إلى القائمة مع معلومات المرسل
        setMessages(prevMessages => [...prevMessages, {
          ...payload.new,
          sender: senderData
        }]);
      })
      .subscribe((status) => {
        console.log('--- [DEBUG] Realtime subscription status:', status);
        if (status === 'SUBSCRIBED') {
          console.log('--- [DEBUG] Successfully subscribed to realtime updates');
        } else if (status === 'CHANNEL_ERROR') {
          console.error('--- [DEBUG] Failed to subscribe to realtime updates');
        }
      });

    
    setChannel(messagesChannel);

    // إلغاء الاشتراك عند تفكيك المكون
    return () => {
      if (messagesChannel) {
        supabase.removeChannel(messagesChannel);
      }
    };
  }, [conversationId, fetchMessages, setMessages]);

  return {
    isLoading,
    fetchMessages,
    channel
  };
};
