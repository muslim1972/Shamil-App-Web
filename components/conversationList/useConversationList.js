import { useState, useCallback } from "react";
import { Alert } from 'react-native';
import { supabase } from '../../lib/supabase';

export const useConversationList = (userId) => {
  const [conversations, setConversations] = useState([]);
  const [isLoading, setIsLoading] = useState(true);

  const fetchConversations = useCallback(async () => {
    if (!userId) {
      setIsLoading(false);
      return;
    }
    
    try {
      console.log("Calling get_user_conversations for user:", userId);
      const { data, error } = await supabase
        .rpc('get_user_conversations', { p_user_id: userId });
      
      
      if (error) {
        Alert.alert('خطأ', 'لم نتمكن من تحميل المحادثات. يرجى المحاولة مرة أخرى.');
        console.error('Error fetching conversations:', error.message);
        setConversations([]);
      } else {
        setConversations(data || []);
      }
    } catch (error) {
      console.error('Unexpected error fetching conversations:', error);
      setConversations([]);
    } finally {
      setIsLoading(false);
    }
  }, [userId, setIsLoading]);

  return {
    conversations,
    isLoading,
    setIsLoading,
    fetchConversations
  };
};