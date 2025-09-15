import { useState, useEffect, useCallback, useRef } from 'react';
import { supabase, supabaseUrl } from '../services/supabase';
import { useAuth } from '../context/AuthContext';
import { RealtimeChannel } from '@supabase/supabase-js';
import * as tus from 'tus-js-client';

interface Message {
  id: string;
  conversationId: string;
  text: string;
  senderId: string;
  timestamp: string;
  message_type: 'text' | 'image' | 'video' | 'audio' | 'file';
  signedUrl: string | null;
  caption?: string | null;
  media_metadata?: { duration: number } | null;
}

interface UseChatMessagesProps {
  conversationId?: string;
}

export const useChatMessages = ({ conversationId }: UseChatMessagesProps) => {
  const { user } = useAuth();
  const [messages, setMessages] = useState<Message[]>([]);
  const [loading, setLoading] = useState(true);
  const [isUploading, setIsUploading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [conversationDetails, setConversationDetails] = useState<any>(null);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const messagesChannelRef = useRef<RealtimeChannel | null>(null);

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
        data.map(async (msg: any) => {
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
          };
        })
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

  // Initialize real-time subscription
  useEffect(() => {
    if (!conversationId) return;

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
          let signedUrl = null;

          if (newMessage.message_type !== 'text') {
            const { data: signedUrlData } = await supabase.storage
              .from('call-files')
              .createSignedUrl(newMessage.content, 3600);
            signedUrl = signedUrlData?.signedUrl || null;
          }

          const formattedNewMessage: Message = {
            id: newMessage.id,
            conversationId: newMessage.conversation_id,
            text: newMessage.content,
            senderId: newMessage.sender_id,
            timestamp: new Date(newMessage.created_at).toISOString(),
            message_type: newMessage.message_type,
            caption: newMessage.caption,
            media_metadata: newMessage.media_metadata,
            signedUrl,
          };

          setMessages((currentMessages) => [...currentMessages, formattedNewMessage]);
        }
      )
      .subscribe();

    messagesChannelRef.current = channel;

    return () => {
      supabase.removeChannel(channel);
    };
  }, [conversationId]);

  // Initial data fetch
  useEffect(() => {
    if (conversationId) {
      fetchMessages();
      fetchConversationDetails();
    }
  }, [conversationId, fetchMessages, fetchConversationDetails]);

  // Scroll to bottom when new messages arrive
  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  const sendMessage = useCallback(
    async (text: string) => {
      if (!text.trim() || !conversationId || !user) return;

      try {
        const { data, error } = await supabase.from('messages').insert({
          conversation_id: conversationId,
          sender_id: user.id,
          content: text.trim(),
          message_type: 'text',
        }).select();

        if (error) throw error;

        // Optimistically update the UI
        if (data && data.length > 0) {
          const newMessage = data[0];
          const tempMessageId = `temp-${Date.now()}`;

          // إضافة رسالة مؤقتة أثناء الإرسال
          setMessages((currentMessages) => [
            ...currentMessages,
            {
              id: tempMessageId,
              conversationId: newMessage.conversation_id,
              text: newMessage.content,
              senderId: newMessage.sender_id,
              timestamp: new Date().toISOString(),
              message_type: 'text' as const,
              signedUrl: null,
            },
          ]);

          // بعد استلام الرسالة من الخادم، استبدال الرسالة المؤقتة بالرسالة الفعلية
          setTimeout(() => {
            setMessages((currentMessages) => 
              currentMessages.map(msg => 
                msg.id === tempMessageId 
                  ? {
                      id: newMessage.id,
                      conversationId: newMessage.conversation_id,
                      text: newMessage.content,
                      senderId: newMessage.sender_id,
                      timestamp: new Date(newMessage.created_at).toISOString(),
                      message_type: 'text' as const,
                      signedUrl: null,
                    }
                  : msg
              )
            );
          }, 1000);
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
    },
    [conversationId, user]
  );

  const sendFileMessage = async (file: File, messageType: 'image' | 'video' | 'audio' | 'file') => {
    if (!file) return;

    setIsUploading(true);
    setUploadProgress(0);

    try {
        const { data: { session }, error: sessionError } = await supabase.auth.getSession();
        if (sessionError || !session || !session.user) throw new Error("User is not authenticated for upload.");
        
        const user = session.user;

        const fileExt = file.name.split('.').pop();
        const fileName = `${user.id}_${Date.now()}.${fileExt}`;
        const filePath = `public/${fileName}`;

        await new Promise<void>((resolve, reject) => {
            const upload = new tus.Upload(file, {
                endpoint: `${supabaseUrl}/storage/v1/upload/resumable`,
                retryDelays: [0, 3000, 5000, 10000, 20000],
                headers: {
                    authorization: `Bearer ${session.access_token}`,
                    'x-upsert': 'true',
                },
                metadata: {
                    bucketName: 'call-files',
                    objectName: filePath,
                    contentType: file.type,
                },
                chunkSize: 6 * 1024 * 1024,
                onError: (error) => {
                    console.error("Failed because: ", error);
                    reject(error);
                },
                onProgress: (bytesUploaded, bytesTotal) => {
                    const percentage = (bytesUploaded / bytesTotal * 100).toFixed(2);
                    setUploadProgress(Number(percentage));
                },
                onSuccess: async () => {
                    const { data: newMessage, error: insertError } = await supabase.from('messages').insert({
                        conversation_id: conversationId,
                        sender_id: user.id,
                        content: filePath,
                        message_type: messageType,
                    }).select().single();

                    if (insertError) {
                        reject(insertError);
                    } else if (newMessage) {
                        const { data: signedUrlData } = await supabase.storage.from('call-files').createSignedUrl(newMessage.content, 3600);

                        const formattedNewMessage: Message = {
                            id: newMessage.id,
                            conversationId: newMessage.conversation_id,
                            text: newMessage.content,
                            senderId: newMessage.sender_id,
                            timestamp: new Date(newMessage.created_at).toISOString(),
                            message_type: newMessage.message_type as 'image' | 'video' | 'audio' | 'file',
                            caption: newMessage.caption,
                            media_metadata: newMessage.media_metadata,
                            signedUrl: signedUrlData?.signedUrl || null,
                        };

                        setMessages(currentMessages => [...currentMessages, formattedNewMessage]);
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
                        resolve();
                    }
                },
            });
            upload.start();
        });
    } catch (error) {
        console.error(`Error sending ${messageType} message:`, error);
        alert(`فشل إرسال الملف: ${error instanceof Error ? error.message : 'خطأ غير معروف'}`);
    } finally {
        setIsUploading(false);
        setUploadProgress(0);
    }
  };

  const pickAndSendMedia = async (accept: string = '*/*') => {
    const input = document.createElement('input');
    input.type = 'file';
    input.accept = accept;

    input.onchange = async (event) => {
      const file = (event.target as HTMLInputElement).files?.[0];
      if (!file) return;

      let messageType: 'image' | 'video' | 'audio' | 'file' = 'file'; // Default to file
      const fileName = file.name.toLowerCase();
      const fileExt = fileName.split('.').pop() || '';

      const audioExtensions = ['dat', 'mp3', 'wav', 'ogg', 'm4a', 'flac', 'aac', 'wma'];

      if (file.type.startsWith('image/')) {
        messageType = 'image';
      } else if (file.type.startsWith('video/')) {
        messageType = 'video';
      } else if (file.type.startsWith('audio/') || audioExtensions.includes(fileExt)) {
        messageType = 'audio';
        if (!file.type || file.type === '' || file.type === 'application/octet-stream') {
          Object.defineProperty(file, 'type', {
            writable: true,
            value: 'audio/webm'
          });
        }
      }

      await sendFileMessage(file, messageType);
    };

    input.click();
  };

  const sendAudioMessage = async (audioBlob: Blob, _duration: number, _caption: string = '') => {
    if (!audioBlob) return;

    // تحويل Blob إلى File لاستخدامه في sendFileMessage
    const fileName = `recording_${Date.now()}.webm`;
    const contentType = audioBlob.type || 'audio/webm';
    const audioFile = new File([audioBlob], fileName, { type: contentType });

    // استخدام نفس المسار المستخدم لإرسال الملفات الصوتية من الاستوديو
    await sendFileMessage(audioFile, 'audio');
    return;
  };


  useEffect(() => {
    if (!conversationId) return;

    const messagesChannel = supabase
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

    return () => {
      supabase.removeChannel(messagesChannel);
    };
  }, [conversationId]);

  return {
    messages,
    loading,
    sendMessage,
    messagesEndRef,
    isUploading,
    uploadProgress,
    pickAndSendMedia,
    sendAudioMessage,
    conversationDetails,
    scrollToBottom,
  };
};