import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { useChatMessages } from '../hooks/useChatMessages';
import { useRecording } from '../hooks/useRecording';
import { useLocation } from '../hooks/useLocation';
import { ChatHeader } from './chat/ChatHeader';
import { MessageList } from './chat/MessageList';
import { MessageForm } from './chat/MessageForm';
import { MicrophonePermissionDialog } from './MicrophonePermissionDialog';
import { toast } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';

const ChatScreen: React.FC = () => {
  const { conversationId } = useParams<{ conversationId: string }>();
  const navigate = useNavigate();
  useAuth(); // نستدعي useAuth بدون الحاجة لاستخراج المستخدم حالياً

  // State
  const [newMessage, setNewMessage] = useState('');
  const [isAttachmentMenuOpen, setAttachmentMenuOpen] = useState(false);
  const [isSending, setIsSending] = useState(false);
  const [isOnline, setIsOnline] = useState(navigator.onLine);

  // Custom hooks
  const {
    messages,
    loading,
    sendMessage,
    messagesEndRef,
    isUploading,
    pickAndSendMedia,
    sendAudioMessage,
    conversationDetails,
    scrollToBottom
  } = useChatMessages({ conversationId });

  const {
    isRecording,
    recordingDuration,
    handleStartRecording,
    handleCancelRecording,
    handleSendRecording,
    showPermissionDialog,
    setShowPermissionDialog,
    openBrowserSettings
  } = useRecording({ sendAudioMessage });

  const { handleSendLocation } = useLocation({ sendMessage });

  // Calculate display conversation name
  const displayConversationName = conversationDetails?.name || 'محادثة';

  // مراقبة حالة الاتصال بالإنترنت
  useEffect(() => {
    const handleOnline = () => {
      setIsOnline(true);
      toast.success('تم استعادة الاتصال بالإنترنت');
    };

    const handleOffline = () => {
      setIsOnline(false);
      toast.error('فقدت الاتصال بالإنترنت');
    };

    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);

    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
    };
  }, []);

  const handleSendMessage = async (e: React.FormEvent) => {
    e.preventDefault();
    if (newMessage.trim() === '' || !conversationId) return;

    // التحقق من الاتصال بالإنترنت
    if (!isOnline) {
      toast.error('لا يوجد اتصال بالإنترنت');
      return;
    }

    try {
      setIsSending(true);
      
      // إرسال الرسالة وتفريغ الحقل
      const messagePromise = sendMessage(newMessage);
      setNewMessage('');

      // انتظار اكتمال الإرسال
      await messagePromise;

      // التمرير إلى آخر رسالة بعد الإرسال
      scrollToBottom();
      
      // إظهار رسالة نجاح
      toast.success('تم إرسال الرسالة');
    } catch (error) {
      console.error('فشل في إرسال الرسالة:', error);
      toast.error('فشل في إرسال الرسالة، حاول مرة أخرى');
    } finally {
      setIsSending(false);
    }
  };

  const handleBack = () => {
    navigate('/conversations');
  };

  // دالة معدلة لإرسال التسجيل الصوتي مع النص ككابشن
  const handleSendRecordingWithCaption = async (caption?: string) => {
    try {
      setIsSending(true);
      
      // استدعاء دالة إرسال التسجيل الصوتي مع النص ككابشن
      const success = await handleSendRecording(caption);
      
      if (success) {
        // التمرير إلى آخر رسالة بعد الإرسال
        scrollToBottom();
        
        // إظهار رسالة نجاح
        toast.success('تم إرسال الرسالة الصوتية');
      } else {
        // فشل الإرسال
        toast.error('فشل في إرسال الرسالة الصوتية، حاول مرة أخرى');
      }
    } catch (error) {
      console.error('فشل في إرسال الرسالة الصوتية:', error);
      toast.error('فشل في إرسال الرسالة الصوتية، حاول مرة أخرى');
    } finally {
      setIsSending(false);
    }
  };

  return (
    <div className="flex flex-col h-screen bg-gray-50">
      {/* مؤشر حالة الاتصال */}
      {!isOnline && (
        <div className="bg-red-500 text-white text-center py-1 text-sm">
          غير متصل بالإنترنت
        </div>
      )}
      
      <ChatHeader
        displayConversationName={displayConversationName}
        onBack={handleBack}
      />

      {/* Messages Area */}
      <div className="flex-1 overflow-y-auto p-4 bg-gray-100" id="messages-container">
        {loading ? (
          <div className="flex items-center justify-center h-full">
            <div className="text-center">
              <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-500 mx-auto"></div>
              <p className="mt-4 text-gray-600">جاري تحميل الرسائل...</p>
            </div>
          </div>
        ) : (
          <MessageList
            messages={messages}
            loading={loading}
            messagesEndRef={messagesEndRef}
          />
        )}
      </div>

      {/* Message Input */}
      <div className={`bg-white border-t border-gray-200 ${isSending ? 'opacity-75' : ''}`}>
        {isSending && (
          <div className="text-center text-xs text-gray-500 py-1">
            جاري الإرسال...
          </div>
        )}
        <MessageForm
          newMessage={newMessage}
          setNewMessage={setNewMessage}
          onSendMessage={handleSendMessage}
          isAttachmentMenuOpen={isAttachmentMenuOpen}
          setAttachmentMenuOpen={setAttachmentMenuOpen}
          onStartRecording={handleStartRecording}
          isUploading={isUploading}
          isRecording={isRecording}
          recordingDuration={recordingDuration}
          handleCancelRecording={handleCancelRecording}
          handleSendRecording={handleSendRecordingWithCaption}
          pickAndSendMedia={pickAndSendMedia}
          handleSendLocation={handleSendLocation}
          disabled={!isOnline || isSending}
        />
      </div>

      {/* Microphone Permission Dialog */}
      <MicrophonePermissionDialog
        isOpen={showPermissionDialog}
        onClose={() => setShowPermissionDialog(false)}
        onOpenSettings={openBrowserSettings}
      />
    </div>
  );
};

export default ChatScreen;