import React, { useState, useRef, useEffect, useCallback } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { useMessages } from '../hooks/useMessages';
import { supabase } from '../services/supabase';
import type { Message } from '../types';
import { Paperclip, Send, Image, File as FileIcon, MapPin, Mic, Download, Trash2 } from 'lucide-react'; // Import icons
import { AudioPlayer } from './AudioPlayer';

// Helper component for the recording UI
const RecordingHeader = ({ duration, onCancel, onSend }: { duration: number, onCancel: () => void, onSend: () => void }) => {
    const formatDuration = (ms: number) => {
        const seconds = Math.floor(ms / 1000);
        const minutes = Math.floor(seconds / 60);
        const remainingSeconds = seconds % 60;
        return `${minutes.toString().padStart(2, '0')}:${remainingSeconds.toString().padStart(2, '0')}`;
    };

    return (
        <div className="flex items-center justify-between w-full bg-gradient-to-r from-red-600 to-red-700 p-3 rounded-lg shadow-lg">
            <div className="flex items-center space-x-2">
                <button 
                    onClick={onCancel} 
                    className="p-2 text-white hover:bg-red-800 rounded-full transition-colors flex items-center justify-center"
                    title="إلغاء التسجيل"
                >
                    <Trash2 size={20} />
                </button>
                <div className="flex items-center bg-red-800 px-3 py-1 rounded-full">
                    <div className="w-2 h-2 bg-red-300 rounded-full animate-pulse mr-2"></div>
                    <span className="text-white font-mono text-sm">{formatDuration(duration)}</span>
                </div>
            </div>
            <div className="flex items-center space-x-2">
                <div className="text-white text-sm bg-red-800 px-3 py-1 rounded-full">
                    جاري التسجيل...
                </div>
                <button 
                    onClick={onSend} 
                    className="p-2 text-white hover:bg-green-600 rounded-full transition-colors flex items-center justify-center bg-green-500 hover:bg-green-600"
                    title="إرسال الرسالة الصوتية"
                >
                    <Send size={20} />
                </button>
            </div>
        </div>
    );
};

const ChatScreen: React.FC = () => {
  const { conversationId } = useParams<{ conversationId: string }>();
  const navigate = useNavigate();
  const { user } = useAuth();
  const { messages, loading, error, sendMessage, markMessagesAsRead, messagesEndRef, isUploading, pickAndSendMedia, sendAudioMessage } = useMessages(conversationId || '');
  const [newMessage, setNewMessage] = useState('');
  const [conversationDetails, setConversationDetails] = useState<{ id: string; name: string; } | null>(null);
  const [isAttachmentMenuOpen, setAttachmentMenuOpen] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);

  // New state for recording
  const [isRecording, setIsRecording] = useState(false);
  const [recordingDuration, setRecordingDuration] = useState(0);
  const [recordingTimer, setRecordingTimer] = useState<NodeJS.Timeout | null>(null);
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const audioChunksRef = useRef<Blob[]>([]);
  const audioBlobRef = useRef<Blob | null>(null);
  const audioUrlRef = useRef<string | null>(null);

  // Helper to extract filename from path
  const getFilenameFromPath = (path: string) => {
    try {
      return path.split('/').pop()?.split('_').slice(1).join('_') || 'file';
    } catch {
      return 'file';
    }
  };

  // دالة للتمرير إلى آخر رسالة
  const scrollToBottom = useCallback(() => {
    if (messagesEndRef.current) {
      messagesEndRef.current.scrollIntoView({ behavior: 'smooth', block: 'end' });
      // التأكد من وصول التمرير إلى القاع تمامًا
      const container = document.getElementById('messages-container');
      if (container) {
        container.scrollTop = container.scrollHeight;
      }
    }
  }, []);

  const fetchConversationDetails = useCallback(async () => {
    if (!conversationId || !user?.id) return;

    try {
      const { data: convData, error: convError } = await supabase
        .from('conversations')
        .select('id, participants')
        .eq('id', conversationId)
        .single();

      if (convError) {
        console.error('Error fetching conversation details:', convError);
        return;
      }

      if (convData && convData.participants) {
        const otherUserId = convData.participants.find((id: string) => id !== user.id);
        if (otherUserId) {
          const { data: userData, error: userError } = await supabase
            .from('users')
            .select('username')
            .eq('id', otherUserId)
            .single();

          if (userError) {
            console.error('Error fetching other user details:', userError);
          } else if (userData) {
            setConversationDetails({
              id: convData.id,
              name: userData.username,
            });
          }
        } else {
          setConversationDetails({
            id: convData.id,
            name: 'محادثة جماعية',
          });
        }
      }
    } catch (err) {
      console.error('Unexpected error fetching conversation details:', err);
    }
  }, [conversationId, user]);

  useEffect(() => {
    fetchConversationDetails();
  }, [fetchConversationDetails]);

  useEffect(() => {
    if (conversationId) {
      markMessagesAsRead();
    }
  }, [conversationId, markMessagesAsRead]);

  // التمرير إلى آخر رسالة عند تحديث الرسائل أو اكتمال التحميل
  useEffect(() => {
    // فقط قم بالتمرير عندما لا تكون هناك رسائل قيد التحميل
    if (!loading && messages.length > 0) {
      // استخدام requestAnimationFrame لضمان التمرير بعد اكتمال العرض
      requestAnimationFrame(() => {
        scrollToBottom();
      });
    }
  }, [messages, loading, scrollToBottom]);

  const handleSendMessage = async (e: React.FormEvent) => {
    e.preventDefault();
    if (newMessage.trim() === '' || !conversationId) return;

    try {
      // حفظ حالة التركيز قبل الإرسال
      const wasInputFocused = document.activeElement === inputRef.current;
      
      // إرسال الرسالة وتفريغ الحقل
      const messagePromise = sendMessage(newMessage);
      setNewMessage('');
      
      // الحفاظ على التركيز أثناء الإرسال
      if (wasInputFocused && inputRef.current) {
        inputRef.current.focus();
      }
      
      // انتظار اكتمال الإرسال
      await messagePromise;
      
      // التمرير إلى آخر رسالة بعد الإرسال
      scrollToBottom();
      
      // إعادة التركيز بعد اكتمال جميع العمليات
      if (inputRef.current) {
        // استخدام requestAnimationFrame لضمان التركيز بعد تحديث DOM
        requestAnimationFrame(() => {
          if (inputRef.current) {
            inputRef.current.focus();
            // منع إخفاء لوحة المفاتيح عن طريق التمرير الناعم
            window.scrollTo(0, window.pageYOffset);
          }
        });
      }
    } catch (error) {
      console.error('فشل في إرسال الرسالة:', error);
    }
  };

  const handleBack = () => {
    navigate('/conversations');
  };

  const formatTime = (timestamp: string) => {
    const date = new Date(timestamp);
    return date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
  };

  // دالة للتحقق مما إذا كانت الرسالة تحتوي على موقع
  const isLocationMessage = (text: string) => {
    return text.includes('موقعي الحالي') && text.includes('[عرض على الخريطة]');
  };

  // دالة لاستخراج إحداثيات الموقع من الرسالة
  const extractLocationFromMessage = (text: string) => {
    const match = text.match(/(\d+\.\d+),\s*(\d+\.\d+)/);
    if (match && match.length >= 3) {
      return {
        latitude: parseFloat(match[1]),
        longitude: parseFloat(match[2])
      };
    }
    return null;
  };

  // دالة لاستخراج رابط الخريطة من الرسالة
  const extractMapUrlFromMessage = (text: string) => {
    const match = text.match(/\[عرض على الخريطة\]\(([^)]+)\)/);
    return match && match[1] ? match[1] : null;
  };

  // Function to start recording audio
  const handleStartRecording = async () => {
    if (isRecording) return;

    try {
      // Check if we already have permission
      const permissions = await navigator.permissions.query({ name: 'microphone' as PermissionName });

      if (permissions.state === 'denied') {
        // Show a more informative message with guidance
        const userResponse = confirm('تم رفض إذن استخدام الميكروفون. هل تذهب إلى إعدادات المتصفح لتفعيل الإذن؟');
        if (userResponse) {
          // Open browser settings
          if (navigator.permissions) {
            try {
              // Note: navigator.permissions.request may not be available in all browsers
              if (navigator.permissions) {
                // Note: navigator.permissions.request may not be available in all browsers
              if ((navigator.permissions as any)?.request) {
                await (navigator.permissions as any).request({ name: 'microphone' as PermissionName });
              }
              }
            } catch (e) {
              console.error('Failed to request microphone permission:', e);
            }
          }
          // Fallback: Open a help page
          window.open('https://support.google.com/chrome/answer/2693767', '_blank');
        }
        return;
      }

      // Request microphone permission
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });

      // Initialize media recorder
      mediaRecorderRef.current = new MediaRecorder(stream);
      audioChunksRef.current = [];

      mediaRecorderRef.current.ondataavailable = (event) => {
        audioChunksRef.current.push(event.data);
      };

      mediaRecorderRef.current.onstop = () => {
        // Create blob from recorded chunks
        audioBlobRef.current = new Blob(audioChunksRef.current, { type: 'audio/webm' });

        // Create URL for playback
        if (audioUrlRef.current) {
          URL.revokeObjectURL(audioUrlRef.current);
        }
        audioUrlRef.current = URL.createObjectURL(audioBlobRef.current);

        // Stop all tracks
        stream.getTracks().forEach(track => track.stop());
      };

      // Start recording
      mediaRecorderRef.current.start();
      setIsRecording(true);

      // Start timer
      setRecordingDuration(0);
      const timer = setInterval(() => {
        setRecordingDuration(prev => prev + 1000);
      }, 1000);
      setRecordingTimer(timer);

    } catch (err) {
      console.error('Error accessing microphone:', err);

      // Provide more specific error messages
      if (err instanceof Error) {
        if (err.name === 'NotAllowedError' || err.name === 'PermissionDeniedError') {
          alert('تم رفض إذن استخدام الميكروفون. يرجى السماح بالوصول إلى الميكروفون من إعدادات المتصفح ثم حاول مرة أخرى.');
        } else if (err.name === 'NotFoundError') {
          alert('لم يتم العثور على ميكروفون متاح. يرجى التحقق من توصيل الميكروفون وإعادة المحاولة.');
        } else if (err.name === 'NotReadableError') {
          alert('الميكروفون قيد الاستخدام بواسطة تطبيق آخر. يرجى إغلاق التطبيقات الأخرى التي تستخدم الميكروفون وحاول مرة أخرى.');
        } else if (err.name === 'OverconstrainedError') {
          alert('لا يتوافق الميكروفون مع متطلبات التطبيق. يرجى محاولة استخدام ميكروفون آخر.');
        } else {
          alert(`فشل الوصول إلى الميكروفون: ${err.message}`);
        }
      } else {
        alert('فشل الوصول إلى الميكروفون. يرجى التحقق من الإعدادات وإعادة المحاولة.');
      }
    }
  };

  const handleCancelRecording = () => {
    if (!isRecording) return;

    if (recordingTimer) {
      clearInterval(recordingTimer);
      setRecordingTimer(null);
    }

    if (mediaRecorderRef.current && mediaRecorderRef.current.state !== 'inactive') {
      mediaRecorderRef.current.stop();
    }

    setIsRecording(false);
    setRecordingDuration(0);

    // Clean up
    if (audioUrlRef.current) {
      URL.revokeObjectURL(audioUrlRef.current);
      audioUrlRef.current = null;
    }
    audioBlobRef.current = null;
    audioChunksRef.current = [];
  };

  const handleSendRecording = async () => {
    if (!isRecording || !audioBlobRef.current) return;

    // Stop the recording timer
    if (recordingTimer) {
      clearInterval(recordingTimer);
      setRecordingTimer(null);
    }

    // Stop the media recorder if it's active
    if (mediaRecorderRef.current && mediaRecorderRef.current.state !== 'inactive') {
      mediaRecorderRef.current.stop();
    }

    setIsRecording(false);

    try {
      // Get user
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('المستخدم غير مسجل الدخول');

      // Use sendAudioMessage function from hook which handles the upload
      await sendAudioMessage(audioBlobRef.current, recordingDuration, newMessage || '');

      // Update conversation settings
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

      // Reset form
      setNewMessage('');
      setRecordingDuration(0);

      // Clean up
      if (audioUrlRef.current) {
        URL.revokeObjectURL(audioUrlRef.current);
        audioUrlRef.current = null;
      }
      audioBlobRef.current = null;
      audioChunksRef.current = [];

    } catch (error) {
      console.error('Error sending audio:', error);

      // Provide user-friendly error messages
      if (error instanceof Error) {
        if (error.message.includes('network')) {
          alert('فشل الإرسال بسبب مشكلة في الشبكة. يرجى التحقق من اتصالك بالإنترنت وحاول مرة أخرى.');
        } else if (error.message.includes('permission')) {
          alert('ليس لديك إذن لإرسال رسائل في هذه المحادثة.');
        } else if (error.message.includes('storage')) {
          alert('لا توجد مساحة كافية في التخزين لإرسال الملف.');
        } else {
          alert(`فشل إرسال المقطع الصوتي: ${error.message}`);
        }
      } else {
        alert('فشل إرسال المقطع الصوتي. يرجى المحاولة مرة أخرى.');
      }
    }
  };

  // دالة لإرسال الموقع
  const handleSendLocation = async () => {
    setAttachmentMenuOpen(false);
    
    if (!navigator.geolocation) {
      alert('المتصفح الخاص بك لا يدعم خدمة تحديد الموقع.');
      return;
    }
    
    try {
      // طلب إذن الوصول إلى الموقع
      const permissions = await navigator.permissions.query({ name: 'geolocation' });
      
      if (permissions.state === 'denied') {
        alert('تم رفض إذن الوصول إلى الموقع. يرجى تفعيل خدمة الموقع من إعدادات المتصفح.');
        return;
      }
      
      // الحصول على الموقع الحالي
      const position = await new Promise<GeolocationPosition>((resolve, reject) => {
        navigator.geolocation.getCurrentPosition(resolve, reject, {
          enableHighAccuracy: true,
          timeout: 10000,
          maximumAge: 0
        });
      });
      
      const { latitude, longitude } = position.coords;
      
      // إنشاء رابط خرائط جوجل للموقع
      const locationUrl = `https://maps.google.com/?q=${latitude},${longitude}`;
      
      // إرسال الموقع كرسالة مع تنسيق خاص لعرض الخريطة
      const locationMessage = `📍 موقعي الحالي\n${latitude}, ${longitude}\n[عرض على الخريطة](${locationUrl})`;
      await sendMessage(locationMessage);
      
    } catch (error) {
      console.error('Error getting location:', error);
      
      if (error instanceof Error) {
        if (error.name === 'NotAllowedError' || error.name === 'PermissionDeniedError') {
          alert('تم رفض الوصول إلى الموقع. يرجى تفعيل خدمة الموقع من إعدادات المتصفح.');
        } else if (error.name === 'PositionUnavailableError') {
          alert('لا يمكن الوصول إلى معلومات الموقع في الوقت الحالي.');
        } else if (error.name === 'TimeoutError') {
          alert('استغرق الحصول على الموقع وقتاً طويلاً جداً. يرجى المحاولة مرة أخرى.');
        } else {
          alert(`فشل الحصول على الموقع: ${error.message}`);
        }
      } else {
        alert('فشل الحصول على الموقع. يرجى المحاولة مرة أخرى.');
      }
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-screen bg-gray-50">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-600 mx-auto"></div>
          <p className="mt-4 text-gray-600">جاري تحميل الرسائل...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex items-center justify-center h-screen bg-gray-50">
        <div className="text-center p-8 bg-white rounded-lg shadow-md">
          <h2 className="text-xl font-bold text-red-600 mb-4">حدث خطأ</h2>
          <p className="text-gray-700 mb-4">{error}</p>
          <button
            onClick={() => window.location.reload()}
            className="px-4 py-2 bg-indigo-600 text-white rounded-md hover:bg-indigo-700 transition-colors"
          >
            إعادة المحاولة
          </button>
        </div>
      </div>
    );
  }

  const displayConversationName = conversationDetails?.name || 'محادثة';

  return (
    <div className="flex flex-col h-screen">
      {/* Chat Header */}
      <div className="bg-indigo-600 text-white p-4 shadow-md flex items-center">
        <button
          onClick={handleBack}
          className="mr-2 p-2 rounded-full hover:bg-indigo-500 transition-colors"
          aria-label="العودة"
        >
          <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
          </svg>
        </button>
        <div className="flex-shrink-0 h-10 w-10 rounded-full bg-indigo-500 flex items-center justify-center text-indigo-100 font-bold mr-3">
          {displayConversationName.charAt(0)}
        </div>
        <div>
          <h2 className="text-lg font-semibold">{displayConversationName}</h2>
        </div>
      </div>

      {/* Messages Area */}
      <div className="flex-1 overflow-y-auto p-4 bg-gray-100" id="messages-container">
        {messages.length === 0 ? (
          <div className="text-center text-gray-500 py-8">
            لا توجد رسائل. ابدأ المحادثة الآن!
          </div>
        ) : (
          <div className="space-y-4">
            {messages.map((message: Message) => (
              <div
                key={message.id}
                className={`flex ${message.senderId === user?.id ? 'justify-end' : 'justify-start'}`}
              >
                <div
                  className={`max-w-xs lg:max-w-md px-4 py-2 rounded-lg ${
                    message.senderId === user?.id
                      ? 'bg-indigo-500 text-white'
                      : 'bg-white text-gray-800 shadow-sm'
                  }`}
                >
                  {(message as any).message_type === 'image' && (message as any).signedUrl ? (
                    <img
                      src={(message as any).signedUrl}
                      alt="Image message"
                      className="rounded-lg max-w-full h-auto"
                      style={{ maxHeight: '300px' }}
                    />
                  ) : (message as any).message_type === 'video' && (message as any).signedUrl ? (
                    <video
                      src={(message as any).signedUrl}
                      controls
                      className="rounded-lg max-w-full h-auto"
                      style={{ maxHeight: '300px' }}
                    />
                  ) : (message as any).message_type === 'file' && (message as any).signedUrl ? (
                    <a
                      href={(message as any).signedUrl}
                      download
                      target="_blank"
                      rel="noopener noreferrer"
                      className="flex items-center p-2 bg-gray-200 rounded-lg hover:bg-gray-300"
                    >
                      <FileIcon className="w-6 h-6 mr-2 text-gray-600" />
                      <span className="truncate text-sm font-medium text-gray-800">{getFilenameFromPath(message.text)}</span>
                      <Download className="w-5 h-5 ml-auto text-gray-500" />
                    </a>
                  ) : (
                    // التحقق من أن الرسالة من نوع صوتي سواء من message_type أو من امتداد الملف
                    ((message as any).message_type === 'audio' || 
                    ((message as any).signedUrl && ['dat', 'mp3', 'wav', 'ogg', 'm4a', 'aac', 'flac'].includes(
                      (message as any).signedUrl.split('.').pop()?.toLowerCase() || ''
                    ))) && (message as any).signedUrl ? (
                      <div className="w-full">
                        <AudioPlayer
                          message={message}
                          isOwnMessage={message.senderId === user?.id}
                        />
                      </div>
                    ) : (
                      // التحقق مما إذا كانت الرسالة تحتوي على موقع
                      isLocationMessage(message.text) ? (
                        <div className="w-full">
                          <div className="bg-white rounded-lg overflow-hidden shadow-md border border-gray-200">
                            <div className="p-2 bg-gray-100 text-center font-medium text-gray-700">
                              📍 موقعي الحالي
                            </div>
                            <div className="relative h-40 bg-gray-200">
                              <img 
                                src={`https://maps.googleapis.com/maps/api/staticmap?center=${extractLocationFromMessage(message.text)?.latitude},${extractLocationFromMessage(message.text)?.longitude}&zoom=15&size=400x200&markers=color:red%7C${extractLocationFromMessage(message.text)?.latitude},${extractLocationFromMessage(message.text)?.longitude}&key=AIzaSyB41DRUbKWJHPxaFjMAwdrzWzbVKartNGg`}
                                alt="موقع على الخريطة"
                                className="w-full h-full object-cover"
                              />
                              <div className="absolute inset-0 flex items-center justify-center bg-black bg-opacity-20 opacity-0 hover:opacity-100 transition-opacity cursor-pointer"
                                onClick={() => {
                                  const mapUrl = extractMapUrlFromMessage(message.text);
                                  if (mapUrl) {
                                    window.open(mapUrl, '_blank');
                                  }
                                }}>
                                <div className="bg-white px-4 py-2 rounded-lg shadow-lg flex items-center">
                                  <MapPin size={16} className="ml-2 text-green-500" />
                                  <span className="font-medium">فتح في الخرائط</span>
                                </div>
                              </div>
                            </div>
                            <div className="p-2 text-xs text-gray-500 text-center bg-gray-50 border-t border-gray-200">
                              {extractLocationFromMessage(message.text)?.latitude.toFixed(6)}, {extractLocationFromMessage(message.text)?.longitude.toFixed(6)}
                            </div>
                          </div>
                        </div>
                      ) : (
                        <p>{message.text}</p>
                      )
                    )
                  )}
                  <div
                    className={`text-xs mt-1 text-right w-full ${
                      message.senderId === user?.id ? 'text-indigo-200' : 'text-gray-500'
                    }`}
                  >
                    {formatTime(message.timestamp)}
                  </div>
                </div>
              </div>
            ))}
            <div ref={messagesEndRef} />
          </div>
        )}
      </div>

      {/* Message Input */}
      <form 
        className="bg-white border-t border-gray-200 p-4 relative" 
        onSubmit={handleSendMessage}
        onKeyDown={(e) => {
          // منع السلوك الافتراضي الذي قد يسبب فقدان التركيز
          if (e.key === 'Enter' && !e.shiftKey) {
            e.preventDefault();
            handleSendMessage(e as any);
          }
        }}
      >
        {isAttachmentMenuOpen && (
            <div className="absolute bottom-16 left-2 bg-white rounded-lg shadow-xl z-20 w-56 border border-gray-100">
              <ul>
                <li
                  className="p-3 hover:bg-gray-100 cursor-pointer flex items-center text-gray-700"
                  onClick={() => {
                      pickAndSendMedia("image/*,video/*");
                      setAttachmentMenuOpen(false);
                  }}
                >
                  <Image size={20} className="mr-3 text-purple-500" />
                  <span>صور وفيديوهات</span>
                </li>
                <li 
                  className="p-3 hover:bg-gray-100 cursor-pointer flex items-center text-gray-700" 
                  onClick={() => {
                      pickAndSendMedia("audio/*");
                      setAttachmentMenuOpen(false);
                  }}
                >
                  <Mic size={20} className="mr-3 text-red-500" />
                  <span>مقطع صوتي</span>
                </li>
                <li 
                  className="p-3 hover:bg-gray-100 cursor-pointer flex items-center text-gray-700" 
                  onClick={handleSendLocation}
                >
                  <MapPin size={20} className="mr-3 text-green-500" />
                  <span>موقع</span>
                </li>
                <li className="p-3 hover:bg-gray-100 cursor-pointer flex items-center text-gray-700" onClick={() => {
                    pickAndSendMedia('*/*');
                    setAttachmentMenuOpen(false);
                }}>
                  <FileIcon size={20} className="mr-3 text-blue-500" />
                  <span>ملف</span>
                </li>
              </ul>
            </div>
        )}

        {isRecording && (
            <RecordingHeader
                duration={recordingDuration}
                onCancel={handleCancelRecording}
                onSend={handleSendRecording}
            />
        )}

        <div className="flex items-center px-2">
          <button
            type="button"
            onClick={() => setAttachmentMenuOpen(prev => !prev)}
            disabled={isUploading || isRecording}
            className="p-2 text-gray-600 hover:text-gray-800 focus:outline-none focus:ring-2 focus:ring-indigo-500 rounded-full disabled:opacity-50 flex-shrink-0"
          >
            <Paperclip size={24} className="rotate-45" />
          </button>
          <input
            type="text"
            ref={inputRef}
            value={newMessage}
            onChange={(e) => setNewMessage(e.target.value)}
            placeholder="اكتب رسالة..."
            className="flex-1 border border-gray-300 rounded-full py-2 px-4 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent mx-2 min-w-0"
            disabled={isRecording}
            onFocus={(e) => {
              // منع السلوك الافتراضي الذي قد يسبب فقدان التركيز
              e.preventDefault();
              // التركيز على حقل الإدخال
              if (inputRef.current) {
                inputRef.current.focus();
              }
              // منع إخفاء لوحة المفاتيح
              e.stopPropagation();
            }}
          />
          {newMessage.length > 0 ? (
            <button
                type="submit"
                className="bg-indigo-600 text-white rounded-full p-3 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 flex-shrink-0"
            >
                <Send size={20} />
            </button>
          ) : (
            <button
                type="button"
                onClick={handleStartRecording}
                disabled={isUploading || isRecording}
                className="bg-indigo-600 text-white rounded-full p-3 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 disabled:opacity-50 relative group flex-shrink-0"
                title="اضغط لتسجيل رسالة صوتية"
            >
                <Mic size={20} />
                <div className="absolute bottom-full left-1/2 transform -translate-x-1/2 mb-2 hidden group-hover:block bg-black text-white text-xs rounded py-1 px-2 whitespace-nowrap z-50">
                    اضغط لتسجيل رسالة صوتية
                    <div className="absolute top-full left-1/2 transform -translate-x-1/2 border-4 border-transparent border-t-black"></div>
                </div>
            </button>
          )}

        </div>
      </form>
    </div>
  );
};

export default ChatScreen;
