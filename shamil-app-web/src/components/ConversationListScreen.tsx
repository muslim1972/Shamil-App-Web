import React, { useState, useEffect, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { useConversations } from '../hooks/useConversations';
import type { Conversation } from '../types';
import { formatDistanceToNow } from 'date-fns';
import { ar } from 'date-fns/locale';
import { LogOut, MessageSquarePlus, Search, User } from 'lucide-react';

// Component for each conversation item in the list
const ConversationItem: React.FC<{ conversation: Conversation; onSelect: (id: string) => void; }> = ({ conversation, onSelect }) => {
  const formattedTimestamp = useMemo(() => {
    if (!conversation.timestamp) return '';
    try {
      return formatDistanceToNow(new Date(conversation.timestamp), { addSuffix: true, locale: ar });
    } catch (error) {
      console.error("Error formatting date:", error);
      return '';
    }
  }, [conversation.timestamp]);

  return (
    <li
      key={conversation.id}
      className="p-3 sm:p-4 hover:bg-slate-100 dark:hover:bg-slate-700 cursor-pointer transition-colors border-b border-slate-200 dark:border-slate-700"
      onClick={() => onSelect(conversation.id)}
    >
      <div className="flex items-center space-x-4 rtl:space-x-reverse">
        <div className="flex-shrink-0">
          <div className="relative inline-flex items-center justify-center w-12 h-12 overflow-hidden bg-slate-200 dark:bg-slate-600 rounded-full">
            <span className="font-medium text-slate-600 dark:text-slate-300 uppercase">
              {(conversation.name || '#').charAt(0)}
            </span>
          </div>
        </div>
        <div className="flex-1 min-w-0">
          <div className="flex justify-between items-center mb-1">
            <p className={`text-sm font-semibold truncate ${conversation.unread ? 'text-indigo-600 dark:text-indigo-400' : 'text-slate-800 dark:text-slate-50'}`}>
              {conversation.name || 'مستخدم غير معروف'}
            </p>
            <span className="text-xs text-slate-500 dark:text-slate-400">
              {formattedTimestamp}
            </span>
          </div>
          <p className={`text-sm truncate ${conversation.unread ? 'text-slate-700 dark:text-slate-300 font-medium' : 'text-slate-500 dark:text-slate-400'}`}>
            {conversation.lastMessage || 'لا توجد رسائل بعد'}
          </p>
        </div>
        {conversation.unread && (
          <div className="flex-shrink-0 w-3 h-3 rounded-full bg-indigo-500"></div>
        )}
      </div>
    </li>
  );
};

const ConversationListScreen: React.FC = () => {
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

  const handleCreateNewConversation = () => {
    navigate('/users');
  };

  const handleLogout = async () => {
    try {
      await signOut();
      navigate('/auth');
    } catch (error) {
      console.error('فشل تسجيل الخروج:', error);
    }
  };

  const filteredConversations = useMemo(() => 
    conversations.filter(conversation =>
      (conversation.name || '').toLowerCase().includes(searchTerm.toLowerCase())
    ), [conversations, searchTerm]);

  if (loading) {
    return (
      <div className="flex items-center justify-center h-screen bg-slate-50 dark:bg-slate-900">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-500 mx-auto"></div>
          <p className="mt-4 text-slate-600 dark:text-slate-300">جاري تحميل المحادثات...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex items-center justify-center h-screen bg-slate-50 dark:bg-slate-900">
        <div className="text-center p-8 bg-white dark:bg-slate-800 rounded-lg shadow-md">
          <h2 className="text-xl font-bold text-red-600 dark:text-red-500 mb-4">حدث خطأ</h2>
          <p className="text-slate-700 dark:text-slate-300 mb-4">{error}</p>
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
    <div className="h-screen bg-slate-100 dark:bg-slate-900 flex justify-center">
      <main className="w-full max-w-2xl h-screen flex flex-col bg-white dark:bg-slate-800 shadow-2xl">
        

        {/* Header */}
        <header className="bg-slate-50 dark:bg-slate-900/70 backdrop-blur-lg p-4 shadow-sm border-b border-slate-200 dark:border-slate-700 z-10">
          <div className="flex justify-between items-center">
            <h1 className="text-xl font-bold text-slate-800 dark:text-slate-50">المحادثات</h1>
            <div className="flex items-center space-x-2 rtl:space-x-reverse">
              <button
                onClick={handleCreateNewConversation}
                className="p-2 rounded-full text-slate-600 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-slate-700 transition-colors"
                aria-label="محادثة جديدة"
              >
                <MessageSquarePlus size={20} />
              </button>
              <button
                onClick={handleLogout}
                className="p-2 rounded-full text-slate-600 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-slate-700 transition-colors"
                aria-label="تسجيل الخروج"
              >
                <LogOut size={20} />
              </button>
            </div>
          </div>

          {/* Search Bar */}
          <div className="mt-4">
            <div className="relative">
              <span className="absolute inset-y-0 left-0 flex items-center pl-3 rtl:pl-0 rtl:right-3">
                <Search className="text-slate-400" size={20} />
              </span>
              <input
                type="text"
                placeholder="بحث عن محادثة..."
                className="w-full p-2 pl-10 rtl:pr-10 rounded-lg bg-slate-200 dark:bg-slate-700 text-slate-800 dark:text-slate-200 placeholder-slate-500 dark:placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-indigo-500 border border-transparent focus:border-transparent"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
              />
            </div>
          </div>
        </header>

        {/* Conversations List */}
        <div className="flex-1 overflow-y-auto">
          {filteredConversations.length === 0 ? (
            <div className="text-center p-8 text-slate-500 dark:text-slate-400 flex flex-col items-center justify-center h-full">
              <User size={48} className="mb-4" />
              <h3 className="font-semibold text-lg">{searchTerm ? 'لا توجد نتائج' : 'لا توجد محادثات'}</h3>
              <p className="text-sm">{searchTerm ? 'جرّب كلمة بحث أخرى' : 'ابدأ محادثة جديدة من الأيقونة في الأعلى'}</p>
            </div>
          ) : (
            <ul>
              {filteredConversations.map((conversation) => (
                <ConversationItem key={conversation.id} conversation={conversation} onSelect={handleSelectConversation} />
              ))}
            </ul>
          )}
        </div>
      </main>
    </div>
  );
};

export default ConversationListScreen;