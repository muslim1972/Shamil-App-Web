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
  const recordingStartTimeRef = useRef<number>(0);

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
      // Show a message to the user before requesting permissions
      alert('سيتم طلب الإذن للوصول إلى الميكروفون لتسجيل الرسالة الصوتية. يرجى السماح بالوصول عندما يظهر الطلب.');

      // Request access to the microphone
      let stream: MediaStream;
      try {
        // التحقق من الصلاحية الحالية
        const permissions = await navigator.permissions.query({ name: 'microphone' as PermissionName });

        // إذا كانت الصلاحية ممنوحة مسبقاً، نطلبها مرة أخرى للتأكد
        // إذا كانت الصلاحية محددة، نطلبها بشكل صريح
        if (permissions.state === 'granted' || permissions.state === 'prompt') {
          // استخدام خيارات أكثر وضوحاً لطلب الصلاحية
          const constraints = { 
            audio: {
              echoCancellation: false,
              noiseSuppression: false,
              autoGainControl: false,
              sampleRate: 44100,
              channelCount: 1
            }, 
            video: false 
          };
          stream = await navigator.mediaDevices.getUserMedia(constraints);
        } else {
          // إذا كانت الصلاحية مرفوضة، نطلبها بشكل صريح
          const constraints = { 
            audio: {
              echoCancellation: false,
              noiseSuppression: false,
              autoGainControl: false,
              sampleRate: 44100,
              channelCount: 1
            }, 
            video: false 
          };
          stream = await navigator.mediaDevices.getUserMedia(constraints);
        }
      } catch (err) {
        // هنا حدث خطأ، مثل رفض المستخدم للصلاحية
        console.error('خطأ في الوصول إلى الميكروفون: ', err);

        // عرض رسالة خطأ أكثر تفصيلاً للمستخدم
        if (err instanceof Error) {
          let errorMessage = 'حدث خطأ في الوصول إلى الميكروفون. ';

          if (err.name === 'NotAllowedError' || err.name === 'PermissionDeniedError') {
            errorMessage += 'يرجى السماح بالوصول إلى الميكروفون في إعدادات المتصفح.';
          } else if (err.name === 'NotFoundError') {
            errorMessage += 'لم يتم العثور على ميكروفون. يرجى التأكد من توصيل الميكروفون.';
          } else if (err.name === 'NotReadableError') {
            errorMessage += 'لا يمكن الوصول إلى الميكروفون. قد يكون قيد الاستخدام من قبل تطبيق آخر.';
          } else {
            errorMessage += err.message;
          }

          alert(errorMessage);
        }

        throw err;
      }

      // Initialize MediaRecorder - استخدام تنسيق متوافق مع معظم المتصفحات
      let options = { mimeType: 'audio/webm' };

      // التحقق من دعم المتصفح للنوع المطلوب
      if (!MediaRecorder.isTypeSupported(options.mimeType)) {
        // استخدام بديل إذا لم يكن النوع مدعومًا
        console.warn('audio/webm not supported, trying audio/ogg');
        options = { mimeType: 'audio/ogg' };

        if (!MediaRecorder.isTypeSupported(options.mimeType)) {
          console.warn('audio/ogg not supported, using default');
          mediaRecorderRef.current = new MediaRecorder(stream);
        } else {
          mediaRecorderRef.current = new MediaRecorder(stream, options);
        }
      } else {
        mediaRecorderRef.current = new MediaRecorder(stream, options);
      }

      audioChunksRef.current = [];

      // Set up event handlers
      mediaRecorderRef.current.ondataavailable = (event) => {
        if (event.data.size > 0) {
          audioChunksRef.current.push(event.data);
        }
      };

      mediaRecorderRef.current.onstop = () => {
        // Combine all audio chunks into a single Blob
        // استخدام نفس نوع التسجيل
        const mimeType = mediaRecorderRef.current?.mimeType || 'audio/webm';
        const audioBlob = new Blob(audioChunksRef.current, { type: mimeType });
        audioBlobRef.current = audioBlob;



        // Create a URL for the audio blob (for playback)
        const audioUrl = URL.createObjectURL(audioBlob);
        audioUrlRef.current = audioUrl;



        // Stop all tracks to release the microphone
        stream.getTracks().forEach(track => track.stop());
      };

      // Start recording - بدون تجزئة للحصول على أفضل جودة
      mediaRecorderRef.current.start();
      setIsRecording(true);

      // حفظ وقت بدء التسجيل لحساب المدة بدقة
      recordingStartTimeRef.current = Date.now();

      // Start timer
      const timer = setInterval(() => {
        // حساب المدة الفعلية من وقت البدء
        const actualDuration = Date.now() - recordingStartTimeRef.current;
        setRecordingDuration(actualDuration);
      }, 100);
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

  // دالة مساعدة لإرسال التسجيل الصوتي
  const sendAudioRecording = useCallback(async (caption?: string): Promise<boolean> => {
    try {
      // تحقق مرة أخرى من وجود تسجيل صوتي
      if (!audioBlobRef.current) {
        console.error('No audio recording to send');
        return false;
      }

      // التحقق من صحة المدة
      let durationToSend = recordingDuration;
      if (isNaN(durationToSend) || durationToSend <= 0) {
        // إذا كانت المدة غير صالحة، استخدم قيمة افتراضية
        durationToSend = 1000; // ثانية واحدة كقيمة افتراضية
        console.warn('Invalid recording duration, using default value:', durationToSend);
      }

      // إرسال الرسالة الصوتية مع الكابشن إذا وجد
      await sendAudioMessage(audioBlobRef.current, durationToSend, caption);

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

        mediaRecorderRef.current!.onstop = async () => {
          // استعادة معالج الحدث الأصلي إذا كان موجودًا
          if (originalOnStop && mediaRecorderRef.current) {
            // إنشاء حدث وهمي لتمريره إلى originalOnStop
            const event = new Event('stop');
            originalOnStop.call(mediaRecorderRef.current, event);
          }

          // التحقق من وجود بيانات صوتية
          if (audioChunksRef.current.length === 0) {
            console.error('No audio data recorded');
            setIsRecording(false);
            resolve(false);
            return;
          }

          // حساب المدة الفعلية للتسجيل الصوتي
          const actualDuration = Date.now() - recordingStartTimeRef.current;

          // تحديث مدة التسجيل
          setRecordingDuration(actualDuration);



          // الآن أرسل التسجيل بعد إيقافه
          const result = await sendAudioRecording(caption);
          resolve(result);
        };

        // إيقاف التسجيل
        mediaRecorderRef.current!.stop();
        setIsRecording(false);
      });
    } else {
      // إذا لم يكن التسجيل نشطًا، أرسله مباشرة
      return sendAudioRecording(caption);
    }
  }, [isRecording, recordingTimer, sendAudioMessage, sendAudioRecording]);

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