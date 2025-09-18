import React, { useState, useEffect, useCallback, useRef } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { useChatMessages } from '../hooks/useChatMessages';
import { useRecording } from '../hooks/useRecording';
import { useLocation } from '../hooks/useLocation';
import { ChatHeader } from './chat/ChatHeader';
import { MessageList } from './chat/MessageList';
import { MessageForm } from './chat/MessageForm';
import { toast } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';

import { Pin, Trash2 } from 'lucide-react';
import type { Message } from '../types';

const ChatScreen: React.FC = () => {
  const { conversationId } = useParams<{ conversationId: string }>();
  const navigate = useNavigate();
  useAuth();

  // State
  const [newMessage, setNewMessage] = useState('');
  const [isAttachmentMenuOpen, setAttachmentMenuOpen] = useState(false);
  const [isSending, setIsSending] = useState(false);
  const [isOnline, setIsOnline] = useState(navigator.onLine);

  const [selectedMessages, setSelectedMessages] = useState<Message[]>([]);
  const [isSelectionMode, setIsSelectionMode] = useState(false);
  const inputRef = useRef<HTMLTextAreaElement>(null);

  // Custom hooks
  const { messages, loading, sendMessage, messagesEndRef, isUploading, pickAndSendMedia, sendAudioMessage, conversationDetails, scrollToBottom } = useChatMessages({ conversationId });
  const { isRecording, recordingDuration, handleStartRecording, handleCancelRecording, handleSendRecording } = useRecording({ sendAudioMessage });
  const { handleSendLocation } = useLocation({ sendMessage });

  // Menu Handlers


  const handleMessageClick = (message: Message, e?: React.MouseEvent) => {
    if (!isSelectionMode) return;

    // منع انتشار الحدث للحاوية الرئيسية
    if (e) {
      e.stopPropagation();
    }

    const isSelected = selectedMessages.some(m => m.id === message.id);
    if (isSelected) {
      const newSelectedMessages = selectedMessages.filter(m => m.id !== message.id);
      setSelectedMessages(newSelectedMessages);
      if (newSelectedMessages.length === 0) {
        setIsSelectionMode(false);
      }
    } else {
      setSelectedMessages([...selectedMessages, message]);
    }
  };

  const handleMessageLongPress = useCallback((target: EventTarget | null, message: Message) => {
    if (!target) return;



    // إذا لم نكن في وضع التحديد، ابدأ وضع التحديد
    if (!isSelectionMode) {
      setIsSelectionMode(true);
      setSelectedMessages([message]);
    } else {
      // إذا كنا بالفعل في وضع التحديد، أضف/أزل الرسالة من القائمة المحددة
      const isSelected = selectedMessages.some(m => m.id === message.id);
      if (isSelected) {
        const newSelectedMessages = selectedMessages.filter(m => m.id !== message.id);
        setSelectedMessages(newSelectedMessages);
        if (newSelectedMessages.length === 0) {
          setIsSelectionMode(false);
        }
      } else {
        setSelectedMessages([...selectedMessages, message]);
      }
    }
  }, [isSelectionMode, selectedMessages]);

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

  const handleSendMessage = (e: React.FormEvent) => {
    e.preventDefault();
    if (newMessage.trim() === '' || !conversationId) return;

    if (!isOnline) {
      toast.error('لا يوجد اتصال بالإنترنت');
      return;
    }

    sendMessage(newMessage); // Send message optimistically
    setNewMessage(''); // Clear the input

    // Focus should be handled carefully. Since the state update is quick,
    // a direct focus call should work as the component re-renders.
    inputRef.current?.focus();
  };

  const handleBack = () => {
    navigate('/conversations');
  };

  const handleSendRecordingWithCaption = async (caption?: string): Promise<boolean> => {
    let success = false;
    try {
      setIsSending(true);
      success = await handleSendRecording(caption);
      if (success) {
        scrollToBottom();
        toast.success('تم إرسال الرسالة الصوتية');
      } else {
        toast.error('فشل في إرسال الرسالة الصوتية، حاول مرة أخرى');
      }
    } catch (error) {
      console.error('فشل في إرسال الرسالة الصوتية:', error);
      toast.error('فشل في إرسال الرسالة الصوتية، حاول مرة أخرى');
      return false;
    } finally {
      setIsSending(false);
    }
    return success;
  };

  return (
    <div className="flex flex-col h-screen bg-gray-50">
      {!isOnline && (
        <div className="bg-red-500 text-white text-center py-1 text-sm">غير متصل بالإنترنت</div>
      )}

      <ChatHeader displayConversationName={displayConversationName} onBack={handleBack} />

      <div
        className="flex-1 overflow-y-auto overflow-x-hidden p-4 bg-gray-100 flex flex-col justify-end"
        id="messages-container"
        onClick={(e) => {
          // Only deselect if clicking directly on the container, not on a message
          if (isSelectionMode && e.target === e.currentTarget) {
            setSelectedMessages([]);
            setIsSelectionMode(false);
          }
        }}
        onTouchStart={(e) => {
          // Only deselect if touching directly on the container, not on a message
          if (isSelectionMode && e.target === e.currentTarget) {
            setSelectedMessages([]);
            setIsSelectionMode(false);
          }
        }}
      >
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
            onMessageLongPress={handleMessageLongPress}
            selectedMessages={selectedMessages}
            onMessageClick={handleMessageClick}
          />
        )}
      </div>

      <div className={`bg-white border-t border-gray-200 ${isSending ? 'opacity-75' : ''}`}>
        {isSending && (
          <div className="text-center text-xs text-gray-500 py-1">جاري الإرسال...</div>
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
          inputRef={inputRef}
        />
      </div>

      {/* Selection Mode Toolbar */}
      {isSelectionMode && (
        <div className="bg-white border-t border-gray-200 p-3 flex justify-between items-center">
          <div className="text-sm font-medium text-gray-700">
            {selectedMessages.length} رسالة محددة
          </div>
          <div className="flex space-x-4">
            <button
              className="p-2 rounded-full hover:bg-gray-100 text-gray-600"
              onClick={() => {
                setSelectedMessages([]);
                setIsSelectionMode(false);
              }}
            >
              <Trash2 size={20} />
            </button>
            <button
              className="p-2 rounded-full hover:bg-gray-100 text-gray-600"
              onClick={() => {
                // سيتم تنفيذ منطق التثبيت لاحقاً
                setSelectedMessages([]);
                setIsSelectionMode(false);
              }}
            >
              <Pin size={20} />
            </button>
            <button
              className="p-2 rounded-full hover:bg-gray-100 text-gray-600"
              onClick={() => {
                // سيتم تنفيذ منطق إعادة التوجيه لاحقاً
                setSelectedMessages([]);
                setIsSelectionMode(false);
              }}
            >
              <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <path d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
              </svg>
            </button>
            <button
              className="p-2 rounded-full hover:bg-gray-100 text-gray-600"
              onClick={() => {
                // سيتم تنفيذ منطق التعديل لاحقاً
                setSelectedMessages([]);
                setIsSelectionMode(false);
              }}
            >
              <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <path d="M11 4H4a2 2 0 00-2 2v14a2 2 0 002 2h14a2 2 0 002-2v-7" />
                <path d="M18.5 2.5a2.121 2.121 0 013 3L12 15l-4 1 1-4 9.5-9.5z" />
              </svg>
            </button>
          </div>
        </div>
      )}


    </div>
  );
};

export default ChatScreen;