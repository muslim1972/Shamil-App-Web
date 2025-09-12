import { useState, useEffect, useRef, useCallback } from 'react';
import { supabase } from '../services/supabase';
import type { Message } from '../types';

export const useMessages = (conversationId: string) => {
  const [messages, setMessages] = useState<Message[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const [isUploading, setIsUploading] = useState(false);

  useEffect(() => {
    const fetchMessages = async () => {
      if (!conversationId) return;

      setLoading(true);
      setError(null);

      try {
        const { data, error } = await supabase
          .from('messages')
          .select('*')
          .eq('conversation_id', conversationId)
          .order('created_at', { ascending: true });

        if (error) {
          throw error;
        }

        if (data) {
          const formattedMessages: Message[] = data.map((msg: any) => ({
            id: msg.id,
            conversationId: msg.conversation_id,
            text: msg.content,
            senderId: msg.sender_id,
            timestamp: msg.created_at,
          }));
          setMessages(formattedMessages);
        }
      } catch (err: any) {
        console.error('Error fetching messages:', err);
        setError(err.message || 'فشل في تحميل الرسائل');
      } finally {
        setLoading(false);
      }
    };

    fetchMessages();

    const channel = supabase.channel(`public:messages:conversation_id=eq.${conversationId}`);
    const handleRealtimeInsert = (payload: any) => {
      const newMsg = payload.new;
      setMessages(prev => [
        ...prev,
        {
          id: newMsg.id,
          conversationId: newMsg.conversation_id,
          text: newMsg.content,
          senderId: newMsg.sender_id,
          timestamp: newMsg.created_at,
        }
      ]);
    };

    channel
      .on(
        'postgres_changes',
        { 
          event: 'INSERT', 
          schema: 'public', 
          table: 'messages',
          filter: `conversation_id=eq.${conversationId}`
        },
        handleRealtimeInsert
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [conversationId]);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  // Function to upload file to Supabase Storage
  const uploadFile = async (file: File, type: string): Promise<string | null> => {
    if (!file || !conversationId) return null;

    setIsUploading(true);
    try {
      const fileExt = file.name.split('.').pop();
      const uniqueFileName = `${conversationId}/${Date.now()}.${fileExt}`;

      // Convert File to Blob explicitly using fetch and URL.createObjectURL
      const objectURL = URL.createObjectURL(file);
      const response = await fetch(objectURL);
      const blob = await response.blob();
      URL.revokeObjectURL(objectURL); // Clean up the temporary URL

      const { data, error } = await supabase.storage
        .from('message_media')
        .upload(uniqueFileName, blob, { contentType: file.type });

      if (error) throw error;

      const { data: publicUrlData } = supabase.storage
        .from('message_media')
        .getPublicUrl(data.path);

      return publicUrlData.publicUrl;
    } catch (error) {
      console.error('Error uploading file:', error);
      return null;
    } finally {
      setIsUploading(false);
    }
  };

  // Function to send an image message
  const sendImageMessage = async (file: File) => {
    if (!file) return;

    try {
      const imageUrl = await uploadFile(file, 'image');

      if (imageUrl) {
        const { data: { user } } = await supabase.auth.getUser();
        if (!user) throw new Error('المستخدم غير مسجل الدخول');

        const { error } = await supabase
          .from('messages')
          .insert([
            {
              conversation_id: conversationId,
              content: imageUrl,
              sender_id: user.id,
              message_type: 'image',
            }
          ]);

        if (error) throw error;
      }
    } catch (error) {
      console.error('Error sending image message:', error);
      throw error;
    }
  };

  // Unified function to pick and send media (for web)
  const pickAndSendMedia = async () => {
    const input = document.createElement('input');
    input.type = 'file';
    input.accept = 'image/*'; // Accept only images
    input.onchange = async (event) => {
      const file = (event.target as HTMLInputElement).files?.[0];
      if (file) {
        await sendImageMessage(file);
      }
    };
    input.click();
  };

  const sendMessage = async (text: string): Promise<void> => {
    if (!conversationId || !text.trim()) return;

    try {
      const { data: { user } } = await supabase.auth.getUser();

      if (!user) {
        throw new Error('المستخدم غير مسجل الدخول');
      }

      const { error } = await supabase
        .from('messages')
        .insert([
          {
            conversation_id: conversationId,
            content: text,
            sender_id: user.id,
            message_type: 'text',
          }
        ]);

      if (error) {
        throw error;
      }

    } catch (err: any) {
      console.error('Error sending message:', err);
      throw err;
    }
  };

  const markMessagesAsRead = useCallback(async (): Promise<void> => {
    // DISABLED FOR NOW
  }, [conversationId]);

  return {
    messages,
    loading,
    error,
    sendMessage,
    markMessagesAsRead,
    messagesEndRef,
    isUploading,
    pickAndSendMedia,
  };
};