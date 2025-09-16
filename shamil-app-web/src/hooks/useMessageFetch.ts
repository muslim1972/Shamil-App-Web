import { useState, useCallback } from 'react';
import { supabase } from '../services/supabase';
import type { Message } from './types/messageTypes';
import { formatMessage } from './utils/messageHelpers';

export const useMessageFetch = (conversationId?: string) => {
  const [messages, setMessages] = useState<Message[]>([]);
  const [loading, setLoading] = useState(true);
  const [conversationDetails, setConversationDetails] = useState<any>(null);

  // Fetch messages for the conversation
  const fetchMessages = useCallback(async () => {
    if (!conversationId) return;

    setLoading(true);
    try {
      const { data, error } = await supabase
        .from('messages')
        .select('*')
        .eq('conversation_id', conversationId)
        .order('created_at', { ascending: true });

      if (error) throw error;

      // Format messages and add signed URLs for media files
      const formattedMessages: Message[] = await Promise.all(
        data.map(async (msg: any) => await formatMessage(msg))
      );

      setMessages(formattedMessages);
    } catch (error) {
      console.error('Error fetching messages:', error);
    } finally {
      setLoading(false);
    }
  }, [conversationId]);

  // Fetch conversation details
  const fetchConversationDetails = useCallback(async () => {
    if (!conversationId) return;

    try {
      const { data, error } = await supabase
        .from('conversations')
        .select('*')
        .eq('id', conversationId)
        .single();

      if (error) throw error;
      setConversationDetails(data);
    } catch (error) {
      console.error('Error fetching conversation details:', error);
    }
  }, [conversationId]);

  return {
    messages,
    setMessages,
    loading,
    conversationDetails,
    fetchMessages,
    fetchConversationDetails
  };
};
