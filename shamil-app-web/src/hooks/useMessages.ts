import { useChatMessagesBase } from './useChatMessagesBase';
import type { UseChatMessagesProps } from './types/messageTypes';
import { useTextMessages } from './useTextMessages';
import { useFileMessages } from './useFileMessages';

export const useChatMessages = (props: UseChatMessagesProps) => {
  const {
    messages,
    setMessages,
    loading,
    conversationDetails,
    messagesEndRef,
    scrollToBottom,
    processingMessagesRef,
    fetchMessages,
    fetchConversationDetails,
    user
  } = useChatMessagesBase(props);

  const {
    sendMessage,
    resendMessage,
    isProcessingMessage
  } = useTextMessages(
    props.conversationId,
    user?.id,
    setMessages,
    processingMessagesRef
  );

  const {
    isUploading,
    uploadProgress,
    pickAndSendMedia,
    sendAudioMessage
  } = useFileMessages(
    props.conversationId,
    user?.id,
    setMessages
  );

  return {
    messages,
    loading,
    sendMessage,
    messagesEndRef,
    isUploading,
    uploadProgress,
    pickAndSendMedia,
    sendAudioMessage,
    conversationDetails,
    scrollToBottom,
    resendMessage,
    isProcessingMessage,
    fetchMessages,
    fetchConversationDetails
  };
};