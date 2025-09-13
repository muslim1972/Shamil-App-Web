// useRecording Hook
// This hook handles audio recording functionality

import { useState, useRef, useCallback } from 'react';

interface UseRecordingProps {
  sendAudioMessage: (audioBlob: Blob, duration: number, caption?: string) => Promise<void>;
}

export const useRecording = ({ sendAudioMessage }: UseRecordingProps) => {
  const [isRecording, setIsRecording] = useState(false);
  const [recordingDuration, setRecordingDuration] = useState(0);
  const [recordingTimer, setRecordingTimer] = useState<NodeJS.Timeout | null>(null);
  const [showPermissionDialog, setShowPermissionDialog] = useState(false);
  const [permissionErrorType, setPermissionErrorType] = useState<string>('');
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const audioChunksRef = useRef<Blob[]>([]);
  const audioBlobRef = useRef<Blob | null>(null);
  const audioUrlRef = useRef<string | null>(null);

  const openBrowserSettings = useCallback(() => {
    // Create a more user-friendly approach to guide users to browser settings
    const userAgent = navigator.userAgent.toLowerCase();
    let instructions = '';
    
    if (userAgent.indexOf('chrome') > -1) {
      instructions = `لتفعيل الميكروفون في متصفح Chrome:\n\n` +
        `1. انقر على أيقونة القفل في شريط العنوان\n` +
        `2. ابحث عن إعدادات الميكروفون\n` +
        `3. غيّر الإذن من "محظور" إلى "السماح"\n` +
        `4. أعد تحميل الصفحة وحاول مرة أخرى`;
    } else if (userAgent.indexOf('firefox') > -1) {
      instructions = `لتفعيل الميكروفون في متصفح Firefox:\n\n` +
        `1. انقر على أيقونة القفل في شريط العنوان\n` +
        `2. ابحث عن إعدادات الميكروفون\n` +
        `3. غيّر الإذن من "محظور" إلى "السماح"\n` +
        `4. أعد تحميل الصفحة وحاول مرة أخرى`;
    } else if (userAgent.indexOf('safari') > -1) {
      instructions = `لتفعيل الميكروفون في متصفح Safari:\n\n` +
        `1. افتح "تفضيلات النظام"\n` +
        `2. اذهب إلى "الأمان والخصوصية"\n` +
        `3. اختر "الميكروفون"\n` +
        `4. ابحث عن المتصفح وغيّر الإذن إلى "السماح"\n` +
        `5. أعد تحميل الصفحة وحاول مرة أخرى`;
    } else {
      instructions = `لتفعيل الميكروفون:\n\n` +
        `1. ابحث عن إعدادات الخصوصية في متصفحك\n` +
        `2. ابحث عن إعدادات الميكروفون\n` +
        `3. غيّر الإذن إلى "السماح"\n` +
        `4. أعد تحميل الصفحة وحاول مرة أخرى`;
    }
    
    alert(instructions);
    setShowPermissionDialog(false);
  }, []);

  const handleStartRecording = useCallback(async () => {
    if (isRecording) return;

    try {
      // Check if we already have permission
      const permissions = await navigator.permissions.query({ name: 'microphone' as PermissionName });

      if (permissions.state === 'denied') {
        setPermissionErrorType('NotAllowedError');
        setShowPermissionDialog(true);
        return;
      }

      // Request access to the microphone
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });

      // Initialize MediaRecorder
      mediaRecorderRef.current = new MediaRecorder(stream);
      audioChunksRef.current = [];

      // Set up event handlers
      mediaRecorderRef.current.ondataavailable = (event) => {
        if (event.data.size > 0) {
          audioChunksRef.current.push(event.data);
        }
      };

      mediaRecorderRef.current.onstop = () => {
        // Combine all audio chunks into a single Blob
        const audioBlob = new Blob(audioChunksRef.current, { type: 'audio/webm' });
        audioBlobRef.current = audioBlob;

        // Create a URL for the audio blob (for playback)
        const audioUrl = URL.createObjectURL(audioBlob);
        audioUrlRef.current = audioUrl;

        // Stop all tracks to release the microphone
        stream.getTracks().forEach(track => track.stop());
      };

      // Start recording
      mediaRecorderRef.current.start();
      setIsRecording(true);

      // Start timer
      const startTime = Date.now();
      const timer = setInterval(() => {
        setRecordingDuration(Date.now() - startTime);
      }, 1000);
      setRecordingTimer(timer);

    } catch (err) {
      console.error('Error accessing microphone:', err);

      if (err instanceof Error) {
        if (err.name === 'NotAllowedError' || err.name === 'PermissionDeniedError') {
          setPermissionErrorType('NotAllowedError');
          setShowPermissionDialog(true);
        } else if (err.name === 'NotFoundError') {
          setPermissionErrorType('NotFoundError');
          setShowPermissionDialog(true);
        } else if (err.name === 'NotReadableError') {
          setPermissionErrorType('NotReadableError');
          setShowPermissionDialog(true);
        } else if (err.name === 'OverconstrainedError') {
          setPermissionErrorType('OverconstrainedError');
          setShowPermissionDialog(true);
        } else {
          setPermissionErrorType('GenericError');
          setShowPermissionDialog(true);
        }
      } else {
        setPermissionErrorType('GenericError');
        setShowPermissionDialog(true);
      }
    }
  }, [isRecording, sendAudioMessage]);

  const handleCancelRecording = useCallback(() => {
    if (!isRecording) return;

    if (recordingTimer) {
      clearInterval(recordingTimer);
      setRecordingTimer(null);
    }

    if (mediaRecorderRef.current && mediaRecorderRef.current.state === 'recording') {
      mediaRecorderRef.current.stop();
    }

    setIsRecording(false);
    setRecordingDuration(0);
    audioChunksRef.current = [];
    audioBlobRef.current = null;
  }, [isRecording, recordingTimer]);

  const handleSendRecording = useCallback(async (caption?: string) => {
    // تحقق من وجود تسجيل صوتي أو إذا كان التسجيل لا يزال نشطًا
    if (!audioBlobRef.current && !isRecording) {
      console.error('No audio recording to send');
      return false;
    }

    // إيقاف المؤقت
    if (recordingTimer) {
      clearInterval(recordingTimer);
      setRecordingTimer(null);
    }

    // إذا كان التسجيل لا يزال نشطًا، قم بإيقافه
    if (isRecording && mediaRecorderRef.current && mediaRecorderRef.current.state === 'recording') {
      return new Promise<boolean>((resolve) => {
        // تعريف معالج حدث onstop مؤقت
        const originalOnStop = mediaRecorderRef.current?.onstop;
        
        mediaRecorderRef.current!.onstop = () => {
          // استعادة معالج الحدث الأصلي إذا كان موجودًا
          if (originalOnStop) {
            originalOnStop.call(mediaRecorderRef.current);
          }
          
          // الآن أرسل التسجيل بعد إيقافه
          sendAudioRecording(caption).then(resolve);
        };
        
        // إيقاف التسجيل
        mediaRecorderRef.current!.stop();
        setIsRecording(false);
      });
    } else {
      // إذا لم يكن التسجيل نشطًا، أرسله مباشرة
      return sendAudioRecording(caption);
    }
  }, [isRecording, recordingTimer, sendAudioMessage]);

  // دالة مساعدة لإرسال التسجيل الصوتي
  const sendAudioRecording = useCallback(async (caption?: string): Promise<boolean> => {
    try {
      // تحقق مرة أخرى من وجود تسجيل صوتي
      if (!audioBlobRef.current) {
        console.error('No audio recording to send');
        return false;
      }

      // إرسال الرسالة الصوتية مع الكابشن إذا وجد
      await sendAudioMessage(audioBlobRef.current, recordingDuration, caption);

      // تنظيف الموارد
      if (audioUrlRef.current) {
        URL.revokeObjectURL(audioUrlRef.current);
        audioUrlRef.current = null;
      }
      audioBlobRef.current = null;
      setRecordingDuration(0);
      
      return true; // إرجاع قيمة نجاح
    } catch (error) {
      console.error('Failed to send audio message:', error);
      return false; // إرجاع قيمة فشل
    }
  }, [sendAudioMessage, recordingDuration]);

  return {
    isRecording,
    recordingDuration,
    handleStartRecording,
    handleCancelRecording,
    handleSendRecording,
    showPermissionDialog,
    setShowPermissionDialog,
    permissionErrorType,
    openBrowserSettings
  };
};