import React, { useState, useEffect, useCallback, useRef, useMemo } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { useForwarding } from '../context/ForwardingContext';
import { useChatMessages } from '../hooks/useChatMessages';
import { useRecording } from '../hooks/useRecording';
import { useLocation } from '../hooks/useLocation';
import { ChatHeader } from './chat/ChatHeader';
import { MessageList } from './chat/MessageList';
import { MessageForm } from './chat/MessageForm';
// import { AppFooter } from './common/AppFooter'; // Removed
import { toast } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';
import { supabase } from '../services/supabase';
import { useGlobalUIStore } from '../stores/useGlobalUIStore'; // Added

import { Pin, X } from 'lucide-react';
import type { Message } from '../types';

const ChatScreen: React.FC = () => {
  const { conversationId } = useParams<{ conversationId: string }>();
  const navigate = useNavigate();
  const { user } = useAuth();
  const { startForwarding } = useForwarding();

  // Global UI Store
  const {
    selectionMode,
    selectedItems,
    setSelectionMode,
    clearSelection,
    toggleSelectedItem,
    lastTriggeredAction,
  } = useGlobalUIStore();

  const isSelectionMode = selectionMode === 'messages';
  const selectedMessages = selectedItems as Message[];

  // State
  const [newMessage, setNewMessage] = useState('');
  const [isAttachmentMenuOpen, setAttachmentMenuOpen] = useState(false);
  const [isSending, setIsSending] = useState(false);
  const [isOnline, setIsOnline] = useState(navigator.onLine);

  const [pinnedMessage, setPinnedMessage] = useState<Message | null>(null);

  const inputRef = useRef<HTMLTextAreaElement>(null);

  // Custom hooks
  const { messages, loading, sendMessage, messagesEndRef, isUploading, pickAndSendMedia, sendAudioMessage, conversationDetails, scrollToBottom, removeMessagesByIds } = useChatMessages({ conversationId });
  const { isRecording, recordingDuration, handleStartRecording, handleCancelRecording, handleSendRecording } = useRecording({ sendAudioMessage });
  const { handleSendLocation } = useLocation({ sendMessage });

  const handleMessageClick = (message: Message, e?: React.MouseEvent | React.TouchEvent) => {
    if (!isSelectionMode) return;
    if (e) e.stopPropagation();
    toggleSelectedItem(message, 'message');
  };

  const handleMessageLongPress = useCallback((target: EventTarget | null, message: Message) => {
    if (!target) return;
    toggleSelectedItem(message, 'message');
    if (!isSelectionMode) {
      setSelectionMode('messages');
    }
  }, [isSelectionMode, toggleSelectedItem, setSelectionMode]);

  const displayConversationName = conversationDetails?.name || 'محادثة';

  useEffect(() => {
    const handleOnline = () => { setIsOnline(true); toast.success('تم استعادة الاتصال بالإنترنت'); };
    const handleOffline = () => { setIsOnline(false); toast.error('فقدت الاتصال بالإنترنت'); };
    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);
    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
    };
  }, []);

  const handleSendMessage = (e: React.FormEvent) => {
    e.preventDefault();
    if (newMessage.trim() === '' || !conversationId || !isOnline) return;
    sendMessage(newMessage);
    setNewMessage('');
    inputRef.current?.focus();
  };

  const handleBack = () => navigate('/conversations');

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
    }
    finally {
      setIsSending(false);
    }
    return success;
  };

  // const clearSelection = () => { // Removed, using global clearSelection
  //   setSelectedMessages([]);
  //   setIsSelectionMode(false);
  // };

  const handleContainerClick = (e: React.MouseEvent | React.TouchEvent) => {
    if (isSelectionMode && !(e.target as HTMLElement).closest('[data-id]')) {
      clearSelection();
    }
  };

  const handleForwardMessages = useCallback(() => {
    if (selectedMessages.length === 0) return;
    startForwarding(selectedMessages);
    navigate('/conversations');
    clearSelection();
  }, [selectedMessages, startForwarding, navigate, clearSelection]);

  const canDeleteForAll = useMemo(() => {
    if (!user || selectedMessages.length === 0) return false;
    return selectedMessages.every(msg => msg.senderId === user.id);
  }, [selectedMessages, user]);

  const canPin = useMemo(() => {
    if (!user || selectedMessages.length !== 1) return false;
    return selectedMessages[0].senderId === user.id;
  }, [selectedMessages, user]);

  const handlePinMessage = useCallback(() => {
    if (!canPin) return;
    setPinnedMessage(selectedMessages[0]);
    clearSelection();
  }, [canPin, selectedMessages, clearSelection]);

  const handleDeleteForMe = useCallback(async () => {
    const messageIds = selectedMessages.map(m => m.id);
    const { error } = await supabase.rpc('hide_messages_for_user', { p_message_ids: messageIds });
    if (error) {
      toast.error('فشل حذف الرسائل.');
      console.error('Error hiding messages:', error);
    } else {
      removeMessagesByIds(messageIds);
    }
    clearSelection();
  }, [selectedMessages, removeMessagesByIds, clearSelection]);

  const handleDeleteForEveryone = useCallback(async () => {
    if (!canDeleteForAll) return;
    const messageIds = selectedMessages.map(m => m.id);
    const { error } = await supabase.rpc('delete_messages_for_all', { p_message_ids: messageIds });
    if (error) {
      toast.error('فشل حذف الرسائل لدى الجميع.');
      console.error('Error deleting for all:', error);
    } else {
      removeMessagesByIds(messageIds);
    }
    clearSelection();
  }, [canDeleteForAll, selectedMessages, removeMessagesByIds, clearSelection]);

  // Listen for actions triggered by the global footer
  useEffect(() => {
    if (lastTriggeredAction) {
      if (lastTriggeredAction.type === 'deleteForMe') {
        handleDeleteForMe();
      } else if (lastTriggeredAction.type === 'deleteForAll') {
        handleDeleteForEveryone();
      } else if (lastTriggeredAction.type === 'pin') {
        handlePinMessage();
      } else if (lastTriggeredAction.type === 'forward') {
        handleForwardMessages();
      }
    }
  }, [lastTriggeredAction, handleDeleteForMe, handleDeleteForEveryone, handlePinMessage, handleForwardMessages]);

  return (
    <div className="flex flex-col h-screen bg-gray-50" onClick={handleContainerClick}>
      <ChatHeader displayConversationName={displayConversationName} onBack={handleBack} />

      {pinnedMessage && (
        <div className="bg-white border-b border-gray-200 p-2 flex justify-between items-center text-sm">
          <div className="flex items-center text-gray-600 overflow-hidden">
            <Pin size={16} className="mx-2 flex-shrink-0" />
            <p className="truncate">{pinnedMessage.text}</p>
          </div>
          <div className="flex items-center">
            <span className="text-green-600 font-semibold ml-2">رسالة مثبتة</span>
            <button onClick={() => setPinnedMessage(null)} className="p-1 rounded-full hover:bg-gray-200 ml-2">
              <X size={16} />
            </button>
          </div>
        </div>
      )}

      <div
        className="flex-1 overflow-y-auto overflow-x-hidden p-4 bg-gray-100 flex flex-col-reverse min-h-0"
        id="messages-container"
      >
        {loading ? (
          <div className="flex items-center justify-center h-full">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-500 mx-auto"></div>
            <p className="mt-4 text-gray-600">جاري تحميل الرسائل...</p>
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
        {isSending && <div className="text-center text-xs text-gray-500 py-1">جاري الإرسال...</div>}
        <MessageForm {...{ newMessage, setNewMessage, onSendMessage: handleSendMessage, isAttachmentMenuOpen, setAttachmentMenuOpen, onStartRecording: handleStartRecording, isUploading, isRecording, recordingDuration, handleCancelRecording, handleSendRecording: handleSendRecordingWithCaption, pickAndSendMedia, handleSendLocation, disabled: !isOnline || isSending, inputRef }} />
      </div>
      {/* <AppFooter // Removed
        activeScreen="chat"
        isSelectionMode={isSelectionMode}
        selectedMessagesCount={selectedMessages.length}
        onDeleteForMeClick={handleDeleteForMe}
        onDeleteForAllClick={handleDeleteForEveryone}
        onPinClick={handlePinMessage}
        onForwardClick={handleForwardMessages}
        canPin={canPin}
        onHomeClick={handleBack}
      /> */}
    </div>
  );
};

export default ChatScreen;
