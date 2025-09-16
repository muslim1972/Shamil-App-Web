import { useCallback, useState } from 'react';
import { supabase, supabaseUrl } from '../services/supabase';
import * as tus from 'tus-js-client';
import type { Message, MessageStatus } from './types/messageTypes';
import { generateTempId, updateMessageStatus, updateTempMessage, updateConversationSettings } from './useChatMessagesBase';

export const useFileMessages = (
  conversationId: string | undefined,
  userId: string | undefined,
  setMessages: React.Dispatch<React.SetStateAction<Message[]>>
) => {
  const [isUploading, setIsUploading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);

  // دالة لرفع الملف إلى التخزين
  const uploadFile = useCallback(async (file: File, filePath: string, tempId: string): Promise<void> => {
    const { data: { session }, error: sessionError } = await supabase.auth.getSession();
    if (sessionError || !session || !session.user) throw new Error("User is not authenticated for upload.");

    return new Promise<void>((resolve, reject) => {
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
          updateMessageStatus(setMessages, tempId, 'failed');
          reject(error);
        },
        onProgress: (bytesUploaded, bytesTotal) => {
          const percentage = (bytesUploaded / bytesTotal * 100).toFixed(2);
          setUploadProgress(Number(percentage));
        },
        onSuccess: async () => {
          resolve();
        },
      });
      upload.start();
    });
  }, [setMessages]);

  // دالة لإرسال رسالة الملف بعد رفعها
  const sendFileMessageAfterUpload = useCallback(async (filePath: string, messageType: 'image' | 'video' | 'audio' | 'file', tempId: string) => {
    if (!conversationId || !userId) return;

    const { data: newMessage, error: insertError } = await supabase.from('messages').insert({
      conversation_id: conversationId,
      sender_id: userId,
      content: filePath,
      message_type: messageType,
    }).select().single();

    if (insertError) {
      throw insertError;
    } else if (newMessage) {
      const { data: signedUrlData } = await supabase.storage.from('call-files').createSignedUrl(newMessage.content, 3600);

      // تحديث الرسالة المؤقتة بالرسالة الفعلية
      updateTempMessage(setMessages, tempId, newMessage, signedUrlData?.signedUrl || null);

      // تحديث إعدادات المحادثة
      await updateConversationSettings(conversationId, userId);
    }
  }, [conversationId, userId, setMessages]);

  const sendFileMessage = useCallback(async (file: File, messageType: 'image' | 'video' | 'audio' | 'file') => {
    if (!file || !conversationId || !userId) return;

    setIsUploading(true);
    setUploadProgress(0);
    const tempId = generateTempId(userId);

    try {
      // إضافة رسالة مؤقتة للملف
      setMessages((currentMessages) => [
        ...currentMessages,
        {
          id: tempId,
          conversationId: conversationId || '',
          text: file.name,
          senderId: userId || '',
          timestamp: new Date().toISOString(),
          message_type: messageType,
          signedUrl: URL.createObjectURL(file), // استخدام URL مؤقت للمعاينة
          status: 'sending' as MessageStatus,
          isTemp: true,
        },
      ]);

      const fileExt = file.name.split('.').pop();
      const fileName = `${userId}_${Date.now()}.${fileExt}`;
      const filePath = `public/${fileName}`;

      // رفع الملف أولاً
      await uploadFile(file, filePath, tempId);

      // ثم إرسال رسالة الملف
      await sendFileMessageAfterUpload(filePath, messageType, tempId);
    } catch (error) {
      console.error(`Error sending ${messageType} message:`, error);
      // تم تحديث حالة الرسالة في معالج الأخطاء
    } finally {
      setIsUploading(false);
      setUploadProgress(0);
    }
  }, [conversationId, userId, uploadFile, sendFileMessageAfterUpload, setMessages]);

  const pickAndSendMedia = useCallback(async (accept: string = '*/*') => {
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
  }, [sendFileMessage]);

  const sendAudioMessage = useCallback(async (audioBlob: Blob, _duration: number, _caption: string = '') => {
    if (!audioBlob || !userId) return;

    // تحويل Blob إلى File لاستخدامه في sendFileMessage
    const fileName = `recording_${Date.now()}.webm`;
    const contentType = audioBlob.type || 'audio/webm';
    const audioFile = new File([audioBlob], fileName, { type: contentType });

    // استخدام نفس المسار المستخدم لإرسال الملفات الصوتية من الاستوديو
    await sendFileMessage(audioFile, 'audio');
    return;
  }, [sendFileMessage, userId]);

  return {
    isUploading,
    uploadProgress,
    sendFileMessage,
    pickAndSendMedia,
    sendAudioMessage
  };
};
