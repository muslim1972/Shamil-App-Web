import { useState } from 'react';
import { supabase } from '../../../../lib/supabase';

export const useTextMessaging = (conversationId) => {
  const [isSending, setIsSending] = useState(false);

  const sendTextMessage = async (text) => {
    if (!text.trim() || !conversationId) return;

    setIsSending(true);
    try {
      const { error } = await supabase
        .from('messages')
        .insert([{
          conversation_id: conversationId,
          content: text.trim(),
          type: 'text'
        }]);

      if (error) throw error;
    } catch (error) {
      console.error('Error sending text message:', error);
    } finally {
      setIsSending(false);
    }
  };

  return {
    isSending,
    sendTextMessage
  };
};
