import { useState } from 'react';
import * as ImagePicker from 'expo-image-picker';
import { supabase } from '../../../../lib/supabase';

export const useMediaMessaging = (conversationId) => {
  const [isUploading, setIsUploading] = useState(false);

  const uploadFile = async (uri, type) => {
    if (!uri || !conversationId) return null;

    setIsUploading(true);
    try {
      // استخراج اسم الملف من المسار
      const fileName = uri.split('/').pop();
      const fileExt = fileName.split('.').pop();

      // إنشاء اسم فريد للملف
      const uniqueFileName = `${conversationId}/${Date.now()}.${fileExt}`;

      // رفع الملف إلى التخزين
      const { data, error } = await supabase.storage
        .from('message_media')
        .upload(uniqueFileName, {
          uri,
          type: `${type}/${fileExt}`,
          name: fileName,
        });

      if (error) throw error;

      // الحصول على الرابط العام للملف
      const { publicURL } = supabase.storage
        .from('message_media')
        .getPublicUrl(data.path);

      return publicURL;
    } catch (error) {
      console.error('Error uploading file:', error);
      return null;
    } finally {
      setIsUploading(false);
    }
  };

  const sendImageMessage = async () => {
    // طلب الإذن للوصول إلى المعرض
    const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (status !== 'granted') {
      alert('نحن نحتاج إلى إذن للوصول إلى المعرض');
      return;
    }

    // فتح المعرض
    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      allowsEditing: true,
      aspect: [4, 3],
      quality: 0.5,
    });

    if (!result.cancelled) {
      // رفع الصورة والحصول على رابطها
      const imageUrl = await uploadFile(result.uri, 'image');

      if (imageUrl) {
        // حفظ الرسالة في قاعدة البيانات
        const { error } = await supabase
          .from('messages')
          .insert([{
            conversation_id: conversationId,
            content: imageUrl,
            type: 'image'
          }]);

        if (error) throw error;
      }
    }
  };

  const sendAudioMessage = async (uri, duration, caption = '') => {
    if (!uri || !conversationId) return;

    // رفع الملف الصوتي والحصول على رابطه
    const audioUrl = await uploadFile(uri, 'audio');

    if (audioUrl) {
      // حفظ الرسالة في قاعدة البيانات
      const { error } = await supabase
        .from('messages')
        .insert([{
          conversation_id: conversationId,
          content: audioUrl,
          type: 'audio',
          metadata: {
            duration,
            caption
          }
        }]);

      if (error) throw error;
    }
  };

  return {
    isUploading,
    sendImageMessage,
    sendAudioMessage
  };
};
