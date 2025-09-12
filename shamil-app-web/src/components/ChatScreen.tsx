import React, { useState, useRef, useEffect, useCallback } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { useMessages } from '../hooks/useMessages';
import { supabase } from '../services/supabase';
import type { Message } from '../types';
import { Paperclip, Send } from 'lucide-react'; // Import Paperclip icon

const ChatScreen: React.FC = () => {
  const { conversationId } = useParams<{ conversationId: string }>();
  const navigate = useNavigate();
  const { user } = useAuth();
  const { messages, loading, error, sendMessage, markMessagesAsRead, messagesEndRef, isUploading, pickAndSendMedia } = useMessages(conversationId || '');
  const [newMessage, setNewMessage] = useState('');
  const [conversationDetails, setConversationDetails] = useState<{ id: string; name: string; } | null>(null);

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

  const handleSendMessage = async (e: React.FormEvent) => {
    e.preventDefault();
    if (newMessage.trim() === '' || !conversationId) return;

    try {
      await sendMessage(newMessage);
      setNewMessage('');
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
      <div className="flex-1 overflow-y-auto p-4 bg-gray-100">
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
                      ? 'bg-indigo-500 text-white rounded-br-none'
                      : 'bg-white text-gray-800 rounded-bl-none shadow-sm'
                  }`}
                >
                  {message.message_type === 'image' && message.signedUrl ? (
                    <img
                      src={message.signedUrl}
                      alt="Image message"
                      className="rounded-lg max-w-full h-auto"
                      style={{ maxHeight: '300px' }}
                    />
                  ) : (
                    <p>{message.text}</p>
                  )}
                  <div
                    className={`text-xs mt-1 ${
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
      <div className="bg-white border-t border-gray-200 p-4">
        <form onSubmit={handleSendMessage} className="flex items-center">
          <button
            type="button"
            onClick={() => pickAndSendMedia('image')} // Correctly call the function with the desired media type
            disabled={isUploading} // Disable button while uploading
            className="p-2 text-gray-600 hover:text-gray-800 focus:outline-none focus:ring-2 focus:ring-indigo-500 rounded-full"
          >
            {isUploading ? (
              <span className="animate-spin h-5 w-5 border-b-2 border-gray-600 rounded-full block"></span>
            ) : (
              <Paperclip size={24} className="rotate-45" />
            )}
          </button>
          <input
            type="text"
            value={newMessage}
            onChange={(e) => setNewMessage(e.target.value)}
            placeholder="اكتب رسالة..."
            className="flex-1 border border-gray-300 rounded-full py-2 px-4 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent mx-2"
          />
          <button
            type="submit"
            className="bg-indigo-600 text-white rounded-full p-2 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
            aria-label="إرسال"
          >
            <Send size={24} />
          </button>
        </form>
      </div>
    </div>
  );
};

export default ChatScreen;
