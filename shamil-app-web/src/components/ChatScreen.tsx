import React, { useState, useEffect, useCallback, Fragment } from 'react';
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
import { Menu, Transition } from '@headlessui/react';
import { Pin, Trash2, CheckSquare } from 'lucide-react';
import type { Message } from '../types';

const ChatScreen: React.FC = () => {
  const { conversationId } = useParams<{ conversationId: string }>();
  const navigate = useNavigate();
  const { user } = useAuth();

  // State
  const [newMessage, setNewMessage] = useState('');
  const [isAttachmentMenuOpen, setAttachmentMenuOpen] = useState(false);
  const [isSending, setIsSending] = useState(false);
  const [isOnline, setIsOnline] = useState(navigator.onLine);
  const [messageMenu, setMessageMenu] = useState<{ x: number; y: number; message: Message } | null>(null);

  // Custom hooks
  const { messages, loading, sendMessage, messagesEndRef, isUploading, pickAndSendMedia, sendAudioMessage, conversationDetails, scrollToBottom } = useChatMessages({ conversationId });
  const { isRecording, recordingDuration, handleStartRecording, handleCancelRecording, handleSendRecording } = useRecording({ sendAudioMessage });
  const { handleSendLocation } = useLocation({ sendMessage });

  // Menu Handlers
  const handleMessageLongPress = useCallback((target: EventTarget | null, message: Message) => {
    if (!target) return;
    const targetElement = target as HTMLElement;
    const rect = targetElement.getBoundingClientRect();
    setMessageMenu({ x: rect.left, y: rect.bottom, message });
  }, []);

  const handleCloseMessageMenu = () => {
    setMessageMenu(null);
  };

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

    if (!isOnline) {
      toast.error('لا يوجد اتصال بالإنترنت');
      return;
    }

    try {
      setIsSending(true);
      const messagePromise = sendMessage(newMessage);
      setNewMessage('');
      await messagePromise;
      scrollToBottom();
      toast.success('تم إرسال الرسالة');

      // التركيز على حقل الإدخال بعد إرسال الرسالة
      setTimeout(() => {
        const inputElement = document.querySelector('textarea') as HTMLTextAreaElement;
        if (inputElement) {
          inputElement.focus();
        }
      }, 100);
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

      <div className="flex-1 overflow-y-auto overflow-x-hidden p-4 bg-gray-100 flex flex-col justify-end" id="messages-container">
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
        />
      </div>

      {/* Message Context Menu */}
      <Transition as={Fragment} show={!!messageMenu}>
        <div className="fixed inset-0 z-20" onClick={handleCloseMessageMenu} />
      </Transition>
      <Transition
        as={Fragment}
        show={!!messageMenu}
        enter="transition ease-out duration-100" enterFrom="transform opacity-0 scale-95" enterTo="transform opacity-100 scale-100"
        leave="transition ease-in duration-75" leaveFrom="transform opacity-100 scale-100" leaveTo="transform opacity-0 scale-95"
      >
        <Menu as="div" className="fixed z-30" style={{ top: messageMenu?.y, left: messageMenu?.x }}>
          <Menu.Items static className="origin-top-left mt-2 w-56 rounded-md shadow-lg bg-white ring-1 ring-black ring-opacity-5 focus:outline-none">
            <div className="py-1">
              <Menu.Item>{({ active }) => (<button onClick={handleCloseMessageMenu} className={`${active ? 'bg-gray-100' : ''} group flex items-center w-full px-4 py-2 text-sm text-gray-700`}><CheckSquare className="mr-3 h-5 w-5" />تأشير</button>)}</Menu.Item>
              {messageMenu?.message?.senderId === user?.id && (
                <Menu.Item>{({ active }) => (<button onClick={handleCloseMessageMenu} className={`${active ? 'bg-gray-100' : ''} group flex items-center w-full px-4 py-2 text-sm text-gray-700`}><Pin className="mr-3 h-5 w-5" />تثبيت</button>)}</Menu.Item>
              )}
              <div className="px-4 my-1"><hr /></div>
              <Menu.Item>{({ active }) => (<button onClick={handleCloseMessageMenu} className={`${active ? 'bg-gray-100' : ''} group flex items-center w-full px-4 py-2 text-sm text-gray-700`}><Trash2 className="mr-3 h-5 w-5" />حذف لدي</button>)}</Menu.Item>
              <Menu.Item>{({ active }) => (<button onClick={handleCloseMessageMenu} className={`${active ? 'bg-gray-100' : ''} group flex items-center w-full px-4 py-2 text-sm text-red-600`}><Trash2 className="mr-3 h-5 w-5" />حذف لدى الجميع</button>)}</Menu.Item>
            </div>
          </Menu.Items>
        </Menu>
      </Transition>
    </div>
  );
};

export default ChatScreen;