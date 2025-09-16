import React, { memo } from 'react';
import { useParams } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { useChatMessages } from '../../hooks/useChatMessages';
import { useRecording } from '../../hooks/useRecording';
import { useLocation } from '../../hooks/useLocation';
import { ChatHeader } from './ChatHeader';
import { MessageForm } from './MessageForm';
import { WaterBackgroundOptimized as WaterBackground } from '../WaterBackground_optimized';
import { ConnectionStatus } from './ConnectionStatus';
import { MessagesContainer } from './MessagesContainer';
import { MessageContextMenu } from './MessageContextMenu';
import { useChatHandlers } from './useChatHandlers';
import { useChatPerformance } from './useChatPerformance';

/**
 * مكون شاشة الدردشة المحسنة
 */
const OptimizedChatScreen: React.FC = () => {
  const { conversationId } = useParams<{ conversationId: string }>();
  const { user } = useAuth();

  // State
  const [newMessage, setNewMessage] = React.useState('');
  const [isAttachmentMenuOpen, setAttachmentMenuOpen] = React.useState(false);
  const [isOnline, setIsOnline] = React.useState(navigator.onLine);

  // Performance optimization hooks
  const {
    shouldShowAnimatedBackground,
    handleToggleAttachmentMenu,
    getOptimizedConversationName,
    isLowEndDevice
  } = useChatPerformance();

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
    handleSendRecording 
  } = useRecording({ sendAudioMessage });

  const { handleSendLocation } = useLocation({ sendMessage });

  // Chat handlers
  const {
    isSending,
    selectedMessages,
    messageMenu,
    handleMessageLongPress,
    handleCloseMessageMenu,
    handleSelectMessage,
    handleDeselectAllMessages,
    handleSendMessage,
    handleBack,
    handleSendRecordingWithCaption
  } = useChatHandlers(
    conversationId,
    messagesEndRef,
    scrollToBottom,
    sendMessage,
    handleSendRecording
  );

  // Memoized values to prevent unnecessary re-renders
  const displayConversationName = React.useMemo(
    () => getOptimizedConversationName(conversationDetails || undefined),
    [conversationDetails, getOptimizedConversationName]
  );

  return (
    <div className="flex flex-col h-screen bg-gray-50 relative">
      {/* عرض الخلفية المتحركة فقط إذا كان الجهاز يدعمها */}
      {shouldShowAnimatedBackground && <WaterBackground />}
      <ConnectionStatus onStatusChange={setIsOnline} />

      <ChatHeader displayConversationName={displayConversationName} onBack={handleBack} />

      <MessagesContainer
        messages={messages}
        loading={loading}
        messagesEndRef={messagesEndRef}
        onMessageLongPress={handleMessageLongPress}
        selectedMessages={selectedMessages}
        onMessageClick={selectedMessages.length > 0 ? (message) => {
          if (selectedMessages.includes(message.id)) {
            handleDeselectAllMessages();
          } else {
            handleSelectMessage(message.id);
          }
        } : undefined}
        onDeselectAll={handleDeselectAllMessages}
      />

      <div className={`bg-white bg-opacity-80 backdrop-blur-sm border-t border-gray-200 ${isSending ? 'opacity-75' : ''}`}>
        {isSending && (
          <div className="text-center text-xs text-gray-500 py-1">جاري الإرسال...</div>
        )}
        <MessageForm
          newMessage={newMessage}
          setNewMessage={setNewMessage}
          onSendMessage={(e) => handleSendMessage(e, newMessage, setNewMessage, isOnline)}
          isAttachmentMenuOpen={isAttachmentMenuOpen}
          setAttachmentMenuOpen={() => handleToggleAttachmentMenu(setAttachmentMenuOpen)}
          onStartRecording={handleStartRecording}
          isUploading={isUploading}
          isRecording={isRecording}
          recordingDuration={recordingDuration}
          handleCancelRecording={handleCancelRecording}
          handleSendRecording={handleSendRecordingWithCaption}
          pickAndSendMedia={pickAndSendMedia}
          handleSendLocation={handleSendLocation}
          disabled={!isOnline || isSending}
          // تقليل التأثيرات البصرية على الأجهزة الضعيفة
          reducedEffects={isLowEndDevice}
        />
      </div>

      {/* Message Context Menu */}
      <MessageContextMenu
        messageMenu={messageMenu}
        onClose={handleCloseMessageMenu}
        onSelectMessage={handleSelectMessage}
        currentUserId={user?.id}
      />
    </div>
  );
};

export default memo(OptimizedChatScreen);
