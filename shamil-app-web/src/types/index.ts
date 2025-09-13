// Export all types from this directory
export interface User {
  id: string;
  name: string;
  email: string;
}

export interface Conversation {
  id: string;
  name: string;
  participants: string[]; // array of user IDs
  lastMessage?: string;
  timestamp?: string;
  unread: boolean;
  archived: boolean;
}

export interface Message {
  id: string;
  conversationId: string;
  text: string;
  senderId: string;
  timestamp: string;
  message_type?: 'text' | 'image' | 'video' | 'audio' | 'file';
  signedUrl?: string | null;
  caption?: string | null;
  media_metadata?: { duration?: number; [key: string]: any } | null;
}

export interface AuthState {
  user: User | null;
  isAuthenticated: boolean;
  isLoading: boolean;
}
