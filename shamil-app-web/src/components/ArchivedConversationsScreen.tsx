import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { useConversations } from '../hooks/useConversations';
import type { Conversation } from '../types';

const ArchivedConversationsScreen: React.FC = () => {
  const navigate = useNavigate();
  const { user, signOut } = useAuth();
  const { conversations, loading, error } = useConversations();
  const [searchTerm, setSearchTerm] = useState('');

  useEffect(() => {
    if (!user) {
      navigate('/auth');
    }
  }, [user, navigate]);

  const handleSelectConversation = (conversationId: string) => {
    navigate(`/chat/${conversationId}`);
  };

  const handleBack = () => {
    navigate('/conversations');
  };

  const handleLogout = async () => {
    try {
      await signOut();
      navigate('/auth');
    } catch (error) {
      console.error('فشل تسجيل الخروج:', error);
    }
  };

  // تصفية المحادثات المؤرشفة فقط
  const archivedConversations = conversations.filter(conversation => 
    conversation.archived
  );

  const filteredConversations = archivedConversations.filter(conversation =>
    conversation.name.toLowerCase().includes(searchTerm.toLowerCase())
  );

  if (loading) {
    return (
      <div className="flex items-center justify-center h-screen bg-gray-50">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-600 mx-auto"></div>
          <p className="mt-4 text-gray-600">جاري تحميل المحادثات المؤرشفة...</p>
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

  return (
    <div className="flex flex-col h-screen">
      {/* Header */}
      <div className="bg-indigo-600 text-white p-4 shadow-md">
        <div className="flex justify-between items-center">
          <div className="flex items-center">
            <button
              onClick={handleBack}
              className="mr-2 p-2 rounded-full hover:bg-indigo-500 transition-colors"
              aria-label="العودة"
            >
              <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
              </svg>
            </button>
            <h1 className="text-xl font-bold">المحادثات المؤرشفة</h1>
          </div>
          <button
            onClick={handleLogout}
            className="p-2 rounded-full hover:bg-indigo-500 transition-colors"
            aria-label="تسجيل الخروج"
          >
            <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" />
            </svg>
          </button>
        </div>

        {/* Search Bar */}
        <div className="mt-4">
          <div className="relative">
            <input
              type="text"
              placeholder="بحث عن محادثة مؤرشفة..."
              className="w-full p-2 pl-10 rounded-lg bg-indigo-500 text-white placeholder-indigo-200 focus:outline-none focus:ring-2 focus:ring-indigo-300"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
            <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 absolute left-3 top-2.5 text-indigo-200" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
            </svg>
          </div>
        </div>
      </div>

      {/* Archived Conversations List */}
      <div className="flex-1 overflow-y-auto bg-gray-50">
        {filteredConversations.length === 0 ? (
          <div className="text-center p-8 text-gray-500">
            {searchTerm ? 'لا توجد محادثات مؤرشفة تطابق بحثك' : 'لا توجد محادثات مؤرشفة'}
          </div>
        ) : (
          <ul className="divide-y divide-gray-200">
            {filteredConversations.map((conversation: Conversation) => (
              <li
                key={conversation.id}
                className={`p-4 hover:bg-gray-100 cursor-pointer transition-colors ${conversation.unread ? 'bg-blue-50' : ''}`}
                onClick={() => handleSelectConversation(conversation.id)}
              >
                <div className="flex items-center">
                  <div className="flex-shrink-0 h-12 w-12 rounded-full bg-indigo-100 flex items-center justify-center text-indigo-800 font-bold">
                    {conversation.name.charAt(0)}
                  </div>
                  <div className="ml-4 flex-1 min-w-0">
                    <div className="flex justify-between">
                      <h3 className={`text-sm font-medium truncate ${conversation.unread ? 'text-indigo-700 font-bold' : 'text-gray-900'}`}>
                        {conversation.name}
                      </h3>
                      <span className="text-xs text-gray-500">
                        {conversation.timestamp}
                      </span>
                    </div>
                    <p className={`text-sm truncate ${conversation.unread ? 'text-indigo-600 font-medium' : 'text-gray-500'}`}>
                      {conversation.lastMessage}
                    </p>
                  </div>
                  {conversation.unread && (
                    <div className="ml-2 flex-shrink-0">
                      <span className="h-3 w-3 rounded-full bg-indigo-600 inline-block"></span>
                    </div>
                  )}
                </div>
              </li>
            ))}
          </ul>
        )}
      </div>
    </div>
  );
};

export default ArchivedConversationsScreen;
