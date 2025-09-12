import { useState, useEffect, useRef, useCallback } from 'react';
import { supabase } from '../services/supabase';
import type { Message } from '../types';

export const useMessages = (conversationId: string) => {
  const [messages, setMessages] = useState<Message[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const [isUploading, setIsUploading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);

  const fetchMessages = useCallback(async () => {
    if (!conversationId) return;
    setLoading(true);
    setError(null);

    try {
      const { data, error: rpcError } = await supabase.rpc('get_visible_messages', {
        p_conversation_id: conversationId,
      });

      if (rpcError) {
        throw rpcError;
      }

      const formattedMessages: Message[] = data.map((msg: any) => ({
        id: msg.id,
        conversationId: msg.conversation_id,
        text: msg.content,
        senderId: msg.sender_id,
        timestamp: new Date(msg.created_at).toISOString(),
        message_type: msg.message_type,
        signedUrl: null,
      }));

      const messagesWithUrls = await Promise.all(
        formattedMessages.map(async (message: Message) => {
          if ((message.message_type === 'image' || message.message_type === 'video' || message.message_type === 'audio') && message.text) {
            const { data: signedUrlData, error: signedUrlError } = await supabase.storage
              .from('call-files')
              .createSignedUrl(message.text, 3600);

            if (signedUrlError) {
              console.error('Error creating signed URL:', signedUrlError);
              return message;
            }
            return { ...message, signedUrl: signedUrlData?.signedUrl || null };
          }
          return message;
        })
      );
      setMessages(messagesWithUrls);
    } catch (err: any) {
      console.error('Error fetching messages:', err);
      setError(err.message || 'فشل في تحميل الرسائل');
    } finally {
      setLoading(false);
    }
  }, [conversationId]);

  useEffect(() => {
    fetchMessages();
  }, [fetchMessages]);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  const uploadFile = async (file: File, type: string): Promise<string | null> => {
    if (!file || !conversationId) return null;

    setIsUploading(true);
    setUploadProgress(0);

    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('المستخدم غير مسجل الدخول');

      const fileExt = file.name.split('.').pop();
      const uniqueFileName = `${user.id}/${Date.now()}_${conversationId}.${fileExt}`;
      const filePath = `public/${uniqueFileName}`;

      const { error: uploadError } = await supabase.storage
        .from('call-files')
        .upload(filePath, file, {
          contentType: file.type,
          upsert: false,
        });

      if (uploadError) {
        throw uploadError;
      }

      return filePath;

    } catch (error) {
      console.error('Error uploading file:', error);
      return null;
    } finally {
      setIsUploading(false);
      setUploadProgress(100);
    }
  };

  const sendFileMessage = async (file: File, messageType: 'image' | 'video' | 'audio') => {
    if (!file) return;

    try {
      // Step 1: Upload the file
      const filePath = await uploadFile(file, messageType);
      if (!filePath) throw new Error('File upload failed to return a path.');

      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('User not logged in');

      // Step 2: Insert the message record into the database
      const { data: insertedData, error: insertError } = await supabase
        .from('messages')
        .insert({
          conversation_id: conversationId,
          content: filePath,
          sender_id: user.id,
          message_type: messageType,
        })
        .select()
        .single();

      if (insertError) throw insertError;

      // Step 3: Get the signed URL for the newly uploaded file
      const { data: signedUrlData, error: signedUrlError } = await supabase.storage
        .from('call-files')
        .createSignedUrl(filePath, 3600);

      if (signedUrlError) throw signedUrlError;

      // Step 4: Create the final message object with all data
      const newMessage: Message = {
        id: insertedData.id,
        conversationId: insertedData.conversation_id,
        text: insertedData.content,
        senderId: insertedData.sender_id,
        timestamp: new Date(insertedData.created_at).toISOString(),
        message_type: insertedData.message_type,
        signedUrl: signedUrlData.signedUrl,
      };

      // Step 5: Update the UI once with the complete message object
      setMessages(currentMessages => [...currentMessages, newMessage]);

    } catch (error) {
      console.error(`Error sending ${messageType} message:`, error);
      alert(`فشل إرسال الملف: ${error instanceof Error ? error.message : 'خطأ غير معروف'}`);
    }
  };

  const sendMessage = async (text: string): Promise<void> => {
    if (!conversationId || !text.trim()) return;

    try {
      const { data: { user } } = await supabase.auth.getUser();

      if (!user) {
        throw new Error('المستخدم غير مسجل الدخول');
      }

      const { data, error: insertError } = await supabase
        .from('messages')
        .insert([
          {
            conversation_id: conversationId,
            content: text,
            sender_id: user.id,
            message_type: 'text',
          }
        ]).select('*');

      if (insertError) {
        throw insertError;
      }

      if (data && data.length > 0) {
        const newMessage: Message = {
          id: data[0].id,
          conversationId: data[0].conversation_id,
          text: data[0].content,
          senderId: data[0].sender_id,
          timestamp: new Date(data[0].created_at).toISOString(),
          message_type: data[0].message_type,
          signedUrl: null
        };
        setMessages(currentMessages => [...currentMessages, newMessage]);
      }

      await supabase
        .from('user_conversation_settings')
        .upsert(
          {
            user_id: user.id,
            conversation_id: conversationId,
            is_hidden: false,
            hidden_at: null,
          },
          { onConflict: 'user_id,conversation_id' }
        );

    } catch (err: any) {
      console.error('Error sending message:', err);
      throw err;
    }
  };

  const pickAndSendMedia = async (mediaType: 'image' | 'video' | 'audio') => {
    const input = document.createElement('input');
    input.type = 'file';
    input.accept = `${mediaType}/*`;
    input.onchange = async (event) => {
      const file = (event.target as HTMLInputElement).files?.[0];
      if (file) {
        await sendFileMessage(file, mediaType);
      }
    };
    input.click();
  };

  const markMessagesAsRead = useCallback(async (): Promise<void> => {
    // يمكنك إضافة منطق تحديث حالة الرسائل هنا في المستقبل
  }, [conversationId]);


  useEffect(() => {
    if (!conversationId) return;

    const messagesChannel = supabase
      .channel(`chat-room-${conversationId}`)
      .on('postgres_changes', {
        event: 'INSERT',
        schema: 'public',
        table: 'messages',
        filter: `conversation_id=eq.${conversationId}`
      }, async (payload: any) => {
        const rawMessage = payload.new;

        const {data: {user}} = await supabase.auth.getUser();
        if (rawMessage.sender_id === user?.id) {
          return;
        }

        const formattedMessage: Message = {
          id: rawMessage.id,
          conversationId: rawMessage.conversation_id,
          text: rawMessage.content,
          senderId: rawMessage.sender_id,
          timestamp: new Date(rawMessage.created_at).toISOString(),
          message_type: rawMessage.message_type,
          signedUrl: null,
        };

        if ((formattedMessage.message_type === 'image' || formattedMessage.message_type === 'video' || formattedMessage.message_type === 'audio') && formattedMessage.text) {
            const { data: signedUrlData, error: signedUrlError } = await supabase.storage
              .from('call-files')
              .createSignedUrl(formattedMessage.text, 3600);

            if (signedUrlError) {
              console.error('Failed to get signed URL for incoming message:', signedUrlError);
            } else {
                formattedMessage.signedUrl = signedUrlData.signedUrl;
            }
        }

        setMessages(currentMessages => [...currentMessages, formattedMessage]);
      })
      .on('postgres_changes', {
        event: 'DELETE',
        schema: 'public',
        table: 'messages',
        filter: `conversation_id=eq.${conversationId}`
      }, (payload: any) => {
        setMessages(currentMessages => currentMessages.filter(msg => msg.id !== payload.old.id));
      })
      .subscribe();

    return () => {
      supabase.removeChannel(messagesChannel);
    };
  }, [conversationId]);


  return {
    messages,
    loading,
    error,
    sendMessage,
    markMessagesAsRead,
    messagesEndRef,
    isUploading,
    uploadProgress,
    pickAndSendMedia,
  };
};