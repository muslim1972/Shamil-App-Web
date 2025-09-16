export interface Message {
  id: string;
  conversationId: string;
  text: string;
  senderId: string;
  timestamp: string;
  message_type: 'text' | 'image' | 'video' | 'audio' | 'file';
  signedUrl: string | null;
  caption?: string | null;
  media_metadata?: { duration: number } | null;
  status: MessageStatus;
  isTemp?: boolean;
}

export type MessageStatus = 'sending' | 'sent' | 'delivered' | 'failed';

export interface UseChatMessagesProps {
  conversationId?: string;
}
