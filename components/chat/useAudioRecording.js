import { useState } from 'react';
import { Alert } from 'react-native';
import { Audio } from 'expo-av';

export const useAudioRecording = (sendAudioMessage, setNewMessageText) => {
  const [isRecording, setIsRecording] = useState(false);
  const [recording, setRecording] = useState(null);
  const [recordingDuration, setRecordingDuration] = useState(0);
  const [isSendingAudio, setIsSendingAudio] = useState(false);

  const handleStartRecording = async () => {
    try {
      const { status } = await Audio.requestPermissionsAsync();
      if (status !== 'granted') {
        Alert.alert('عذراً', 'نحتاج إلى إذن الوصول إلى الميكروفون لتسجيل الصوت.');
        return;
      }

      await Audio.setAudioModeAsync({
        allowsRecordingIOS: true,
        playsInSilentModeIOS: true,
      });

      console.log('Starting recording..');
      const { recording: newRecording } = await Audio.Recording.createAsync(
         Audio.RecordingOptionsPresets.HIGH_QUALITY
      );
      setRecording(newRecording);
      setIsRecording(true);

      // تحديث مدة التسجيل بشكل دوري
      newRecording.setOnRecordingStatusUpdate(status => {
        if (status.isRecording) {
          setRecordingDuration(status.durationMillis);
        }
      });

      console.log('Recording started');
    } catch (err) {
      console.error('Failed to start recording', err);
      Alert.alert('خطأ', 'فشل بدء التسجيل.');
      setIsRecording(false); // التأكد من إعادة الحالة لوضعها الطبيعي
    }
  };

  const handleCancelRecording = async () => {
    if (!recording || isSendingAudio) return; // منع الإرسال المتكرر
    setIsSendingAudio(true); // تعطيل الأزرار فوراً
    console.log('Cancelling recording..');
    setIsRecording(false);
    setRecordingDuration(0);
    await recording.stopAndUnloadAsync();
    setRecording(null);
  };

  const handleSendRecording = async () => {
    if (!recording) return;

    // احصل على التعليق وامسح الحقل فوراً
    const caption = newMessageText;
    setNewMessageText('');

    // قم بتحديث حالة الواجهة أولاً لإخفاء شريط التسجيل
    setIsRecording(false);
    setRecording(null);
    console.log('Stopping recording and sending..');

    try {
      // أوقف التسجيل وأرسل البيانات
      await recording.stopAndUnloadAsync();
      const uri = recording.getURI();
      

      // استخدم مدة التسجيل الحالية قبل إعادة تعيينها
      await sendAudioMessage(uri, recordingDuration, caption);
      setRecordingDuration(0);
    } catch (error) {
      console.error('Error sending audio:', error);
      Alert.alert('خطأ', 'فشل إرسال المقطع الصوتي.');
    } finally {
      setIsSendingAudio(false); // إعادة تفعيل الأزرار بعد انتهاء العملية
    }
  };

  return {
    isRecording,
    recording,
    recordingDuration,
    isSendingAudio,
    handleStartRecording,
    handleCancelRecording,
    handleSendRecording
  };
};
