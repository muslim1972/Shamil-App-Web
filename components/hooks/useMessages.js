import { useState, useCallback, useEffect } from 'react';
import { Alert } from 'react-native';
import { supabase } from '../../lib/supabase';
import * as ImagePicker from 'expo-image-picker';
import * as tus from 'tus-js-client';
import * as ImageManipulator from 'expo-image-manipulator';
import { useAuth } from '../../context/AuthContext';

export const useMessages = (conversationId) => {
  const { user } = useAuth();
  const [messages, setMessages] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isSending, setIsSending] = useState(false);
  const [isUploading, setIsUploading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(null);

  const fetchMessages = useCallback(async () => {
    if (!conversationId) return;
    setIsLoading(true);

    const { data, error } = await supabase.rpc('get_visible_messages', {
      p_conversation_id: conversationId,
    });

    if (error) {
      Alert.alert('خطأ', 'فشل تحميل الرسائل.');
      console.error('Error fetching messages via RPC:', error);
      setMessages([]);
    } else {
      const messagesWithUrls = await Promise.all(
        (data || []).map(async (message) => {
          if ((message.message_type === 'image' || message.message_type === 'video' || message.message_type === 'audio') && message.content) {
            const { data: signedUrlData } = await supabase.storage
              .from('call-files')
              .createSignedUrl(message.content, 3600);
            return { ...message, signedUrl: signedUrlData?.signedUrl || null };
          }
          return message;
        })
      );
      setMessages(messagesWithUrls);
    }
    setIsLoading(false);
  }, [conversationId]);

  const handleSendText = async (newMessageText, callback) => {
    if (newMessageText.trim().length === 0 || isSending) return;
    setIsSending(true);
    const messageData = {
      conversation_id: conversationId,
      sender_id: user.id,
      content: newMessageText.trim(),
      message_type: 'text',
    };
    const { data, error } = await supabase
      .from('messages')
      .insert(messageData)
      .select()
      .single();

    if (error) {
      Alert.alert('خطأ', 'لم نتمكن من إرسال الرسالة.');
      console.error('Error sending message:', error);
    } else if (data) {
      setMessages(currentMessages => [...currentMessages, data]);
      if (callback) callback(); // [تعديل] استدعاء دالة التمرير
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
    }
    setIsSending(false);
  };

  const pickAndSendMedia = async (mediaType, callback) => {
    const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (status !== 'granted') {
      Alert.alert('عذراً', 'نحتاج إلى إذن الوصول إلى الوسائط لإرسالها.');
      return;
    }
    let result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.All,
      allowsEditing: false,
      videoQuality: ImagePicker.UIImagePickerControllerQualityType.Medium,
    });

    if (!result.canceled && result.assets && result.assets.length > 0) {
      const asset = result.assets[0];
      if (!asset.uri) return;
      setIsUploading(true);
      setUploadProgress(0);
      try {
        let fileForTus, fileName, filePath, contentType, messageType;

        if (asset.type === 'image') {
          messageType = 'image';
          const manipResult = await ImageManipulator.manipulateAsync(
            asset.uri,
            [{ resize: { width: 1024 } }],
            { compress: 0.8, format: ImageManipulator.SaveFormat.WEBP }
          );
          fileName = `${user.id}_${Date.now()}.webp`;
          contentType = 'image/webp';
          fileForTus = { uri: manipResult.uri, name: fileName, type: contentType };
        } else if (asset.type === 'video') {
          messageType = 'video';
          const extension = asset.uri.split('.').pop();
          fileName = `${user.id}_${Date.now()}.${extension}`;
          contentType = asset.mimeType || `video/${extension}`;
          fileForTus = { uri: asset.uri, name: fileName, type: contentType };
        } else {
          throw new Error('Unsupported file type');
        }

        filePath = `public/${fileName}`;
        const { data: { session }, error: sessionError } = await supabase.auth.getSession();
        if (sessionError || !session) throw new Error("User is not authenticated for upload.");

        await new Promise((resolve, reject) => {
          const upload = new tus.Upload(fileForTus, {
            endpoint: `${supabase.supabaseUrl}/storage/v1/upload/resumable`,
            retryDelays: [0, 3000, 5000, 10000, 20000],
            headers: {
              authorization: `Bearer ${session.access_token}`,
              'x-upsert': 'true',
            },
            metadata: {
              bucketName: 'call-files',
              objectName: filePath,
              contentType: contentType,
            },
            chunkSize: 6 * 1024 * 1024,
            onError: (error) => reject(error),
            onProgress: (bytesUploaded, bytesTotal) => setUploadProgress((bytesUploaded / bytesTotal * 100)),
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
                const messageWithUrl = { ...newMessage, signedUrl: signedUrlData?.signedUrl || null };
                setMessages(currentMessages => [...currentMessages, messageWithUrl]);
                if (callback) callback(); // [تعديل] استدعاء دالة التمرير
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
        console.error("Error during resumable upload process:", error);
        Alert.alert("خطأ", "فشل إرسال الملف.");
      } finally {
        setIsUploading(false);
        setUploadProgress(null);
      }
    }
  };

  const sendAudioMessage = async (uri, duration, caption, callback) => {
    if (!uri) return;
    setIsUploading(true);
    setUploadProgress(0);
    try {
      const extension = uri.split('.').pop();
      const fileName = `${user.id}_${Date.now()}.${extension}`;
      const filePath = `public/${fileName}`;
      const contentType = `audio/${extension}`;
      const fileForTus = { uri: uri, name: fileName, type: contentType };

      const { data: { session }, error: sessionError } = await supabase.auth.getSession();
      if (sessionError || !session) throw new Error("User is not authenticated for upload.");

      await new Promise((resolve, reject) => {
        const upload = new tus.Upload(fileForTus, {
          endpoint: `${supabase.supabaseUrl}/storage/v1/upload/resumable`,
          retryDelays: [0, 3000, 5000, 10000, 20000],
          headers: {
            authorization: `Bearer ${session.access_token}`,
            'x-upsert': 'true',
          },
          metadata: {
            bucketName: 'call-files',
            objectName: filePath,
            contentType: contentType,
          },
          chunkSize: 6 * 1024 * 1024,
          onError: (error) => reject(error),
          onProgress: (bytesUploaded, bytesTotal) => setUploadProgress((bytesUploaded / bytesTotal * 100)),
          onSuccess: async () => {
            const { data: newMessage, error: insertError } = await supabase.from('messages').insert({
              conversation_id: conversationId,
              sender_id: user.id,
              content: filePath,
              message_type: 'audio',
              caption: caption || null,
              media_metadata: { duration: duration },
            }).select().single();

            if (insertError) {
              reject(insertError);
            } else if (newMessage) {
              const { data: signedUrlData } = await supabase.storage.from('call-files').createSignedUrl(newMessage.content, 3600);
              const messageWithUrl = { ...newMessage, signedUrl: signedUrlData?.signedUrl || null };
              setMessages(currentMessages => [...currentMessages, messageWithUrl]);
              if (callback) callback(); // [تعديل] استدعاء دالة التمرير
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
      console.error("Error during audio upload process:", error);
      Alert.alert("خطأ", "فشل إرسال المقطع الصوتي.");
    } finally {
      setIsUploading(false);
      setUploadProgress(null);
    }
  };

  useEffect(() => {
    if (conversationId) {
      fetchMessages();
    }
  }, [fetchMessages]);

  useEffect(() => {
    if (!conversationId || !user?.id) return;

    const messagesChannel = supabase
      .channel(`chat-room-${conversationId}`)
      .on('postgres_changes', {
        event: 'INSERT',
        schema: 'public',
        table: 'messages',
        filter: `conversation_id=eq.${conversationId}`
      }, async (payload) => {
        const newMessage = payload.new;
        if (newMessage.sender_id === user.id) {
          return;
        }
        const { data: senderData } = await supabase.from('users').select('username').eq('id', newMessage.sender_id).single();
        newMessage.sender = senderData;
        if ((newMessage.message_type === 'image' || newMessage.message_type === 'video' || newMessage.message_type === 'audio') && newMessage.content) {
          const { data: signedUrlData } = await supabase.storage.from('call-files').createSignedUrl(newMessage.content, 3600);
          newMessage.signedUrl = signedUrlData?.signedUrl || null;
        }
        setMessages(currentMessages => [...currentMessages, newMessage]);
      })
      .on('postgres_changes', {
        event: 'DELETE',
        schema: 'public',
        table: 'messages',
        filter: `conversation_id=eq.${conversationId}`
      }, (payload) => {
        setMessages(currentMessages => currentMessages.filter(msg => msg.id !== payload.old.id));
      })
      .subscribe();

    const hiddenMessagesChannel = supabase
      .channel(`hidden-messages-for-${user.id}`)
      .on('postgres_changes', {
        event: 'INSERT',
        schema: 'public',
        table: 'hidden_messages',
        filter: `user_id=eq.${user.id}`
      }, (payload) => {
        setMessages(currentMessages => currentMessages.filter(msg => msg.id !== payload.new.message_id));
      })
      .subscribe();

    return () => {
      supabase.removeChannel(messagesChannel);
      supabase.removeChannel(hiddenMessagesChannel);
    };
  }, [conversationId, user?.id]);

  return {
    messages,
    setMessages,
    isLoading,
    isSending,
    isUploading,
    uploadProgress,
    handleSendText,
    pickAndSendMedia,
    sendAudioMessage,
  };
};