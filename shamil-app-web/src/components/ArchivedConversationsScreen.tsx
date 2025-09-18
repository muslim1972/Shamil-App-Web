import React, { useState, useEffect, useCallback, Fragment, useMemo, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { supabase } from '../services/supabase';
import type { Conversation } from '../types';
import { formatDistanceToNow } from 'date-fns';
import { ar } from 'date-fns/locale';
import { useArchivedConversationListActions } from '../hooks/useArchivedConversationListActions';
import { Archive, Trash2 } from 'lucide-react';
import { Menu, Transition } from '@headlessui/react';
import useLongPress from '../hooks/useLongPress';

const ArchivedConversationsScreen: React.FC = () => {
  const navigate = useNavigate();
  const { user } = useAuth(); // signOut is removed
  const [archivedConversations, setArchivedConversations] = useState<Conversation[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  // searchTerm state is removed
  const [menu, setMenu] = useState<{ x: number; y: number; conversation: Conversation } | null>(null);
  const longPressTriggered = useRef(false); // Ref to prevent click after long press

  // جلب المحادثات المؤرشفة
  const fetchArchivedConversations = useCallback(async () => {
    if (!user) {
      navigate('/auth');
      return;
    }

    setLoading(true);
    setError(null);

    try {
      const { data, error } = await supabase
        .rpc('get_user_archived_conversations');

      if (error) {
        throw error;
      }

      if (data) {
        const formattedConversations: Conversation[] = data.map((conv: any) => ({
          id: conv.id,
          name: conv.other_username,
          participants: conv.participants,
          lastMessage: conv.last_message,
          timestamp: conv.updated_at,
          unread: conv.unread_count > 0,
          archived: true,
        }));
        setArchivedConversations(formattedConversations);
      }
    } catch (err: any) {
      console.error('Error fetching archived conversations:', err);
      setError(err.message || 'فشل في تحميل المحادثات المؤرشفة');
    } finally {
      setLoading(false);
    }
  }, [user, navigate]);

  useEffect(() => {
    fetchArchivedConversations();
  }, [fetchArchivedConversations]);

  const handleSelectConversation = (conversationId: string) => {
    navigate(`/chat/${conversationId}`);
  };

  const handleCloseMenu = useCallback(() => {
    setMenu(null);
    longPressTriggered.current = false;
  }, []);

  // استخدام دوال إجراءات المحادثات المؤرشفة
  const {
    handleConversationOptions,
    handleUnarchiveConversation,
    handleHideConversation,
    handleDeleteConversationForAll
  } = useArchivedConversationListActions(setArchivedConversations, fetchArchivedConversations);

  const handleLongPress = useCallback((target: EventTarget | null) => {
    if (!target) return;

    const element = target as HTMLElement;
    const conversationElement = element.closest('[data-id]');
    if (!conversationElement) return;

    const conversationId = conversationElement.getAttribute('data-id');
    if (!conversationId) return;

    const conversation = archivedConversations.find(c => c.id === conversationId);
    if (!conversation) return;

    // Prevent click event from triggering
    longPressTriggered.current = true;

    // Get position for menu
    const rect = conversationElement.getBoundingClientRect();
    setMenu({
      x: rect.left,
      y: rect.bottom,
      conversation
    });

    // Use the action hook to select the conversation
    handleConversationOptions(conversation);
  }, [archivedConversations, handleConversationOptions]);

  const longPressEvents = useLongPress(handleLongPress, { delay: 500 });

  // Handle click events to prevent navigation after long press
  const handleItemClick = useCallback((conversationId: string) => {
    if (longPressTriggered.current) {
      longPressTriggered.current = false;
      return;
    }
    handleSelectConversation(conversationId);
  }, [handleSelectConversation]);

  const handleBack = () => {
    navigate('/conversations');
  };

  // handleLogout function is removed

  // filteredConversations logic is removed

  // Component for each archived conversation item in the list
  const ArchivedConversationItem: React.FC<{ conversation: Conversation; onSelect: (id: string) => void; }> = React.memo(({ conversation, onSelect }) => {
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
      // The onClick is now on the li itself
      <li
        onClick={() => onSelect(conversation.id)}
        className="p-3 sm:p-4 hover:bg-slate-100 dark:hover:bg-slate-700 cursor-pointer transition-colors border-b border-slate-200 dark:border-slate-700"
      >
        <div className="flex items-center space-x-4 rtl:space-x-reverse pointer-events-none">
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
        </div>
      </li>
    );
  });

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
          {/* Logout button removed */}
        </div>

        {/* Search Bar removed */}
      </div>

      {/* Archived Conversations List */}
      <div className="flex-1 overflow-y-auto bg-gray-50">
        {archivedConversations.length === 0 ? (
          <div className="text-center p-8 text-gray-500">
            {'لا توجد محادثات مؤرشفة'}
          </div>
        ) : (
          <ul>
            {archivedConversations.map((conversation) => (
              <div key={conversation.id} data-id={conversation.id} {...longPressEvents}>
                <ArchivedConversationItem conversation={conversation} onSelect={handleItemClick} />
              </div>
            ))}
          </ul>
        )}
      </div>

      {/* Context Menu */}
      <Transition as={Fragment} show={!!menu}>
        {/* ... Menu backdrop ... */}
      </Transition>
      <Transition as={Fragment} show={!!menu}>
        <Menu as="div" className="fixed z-30" style={{ top: menu?.y, left: menu?.x }}>
          <Menu.Items static className="origin-top-left mt-2 w-56 rounded-md shadow-lg bg-white dark:bg-slate-800 ring-1 ring-black ring-opacity-5 focus:outline-none">
            <div className="py-1">
              <Menu.Item>{({ active }) => (<button onClick={() => { handleUnarchiveConversation(); handleCloseMenu(); }} className={`${active ? 'bg-slate-100' : ''} group flex items-center w-full px-4 py-2 text-sm text-slate-700`}><Archive className="mr-3 h-5 w-5" />إلغاء أرشفة المحادثة</button>)}</Menu.Item>
              <div className="px-4 my-1"><hr className="border-slate-200"/></div>
              <Menu.Item>{({ active }) => (<button onClick={() => { handleHideConversation(); handleCloseMenu(); }} className={`${active ? 'bg-slate-100' : ''} group flex items-center w-full px-4 py-2 text-sm text-slate-700`}><Trash2 className="mr-3 h-5 w-5" />حذف المحادثة لدي فقط</button>)}</Menu.Item>
              <Menu.Item>{({ active }) => (<button onClick={() => { handleDeleteConversationForAll(); handleCloseMenu(); }} className={`${active ? 'bg-slate-100' : ''} group flex items-center w-full px-4 py-2 text-sm text-red-600`}><Trash2 className="mr-3 h-5 w-5" />حذف المحادثة لدى الجميع</button>)}</Menu.Item>
            </div>
          </Menu.Items>
        </Menu>
      </Transition>
    </div>
  );
};

export default ArchivedConversationsScreen;
