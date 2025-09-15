import { useState, useEffect, useCallback } from 'react';
import { supabase } from '../services/supabase';
import type { Conversation } from '../types';

export const useConversations = () => {
  const [conversations, setConversations] = useState<Conversation[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchConversations = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('المستخدم غير مسجل الدخول');

      const { data, error } = await supabase.rpc('get_user_conversations', { p_user_id: user.id });

      if (error) {
        throw error;
      }

      if (data) {
        const formattedConversations: Conversation[] = data.map((conv: any) => ({
          id: conv.id,
          name: conv.other_username,
          participants: conv.participants,
          lastMessage: conv.last_message,
          timestamp: conv.updated_at,
          unread: conv.unread_count > 0,
          archived: false,
        }));
        setConversations(formattedConversations);
      }

    } catch (err: any) {
      console.error('Error fetching conversations:', err);
      setError(err.message || 'فشل في تحميل المحادثات');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchConversations();
  }, [fetchConversations]);

  return {
    conversations,
    loading,
    error,
    fetchConversations,
    setConversations,
  };
};