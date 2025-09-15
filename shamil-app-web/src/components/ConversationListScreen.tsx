import React, { useState, useEffect, useMemo, useCallback, Fragment, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { useConversations } from '../hooks/useConversations';
import useLongPress from '../hooks/useLongPress';
import type { Conversation } from '../types';
import { formatDistanceToNow } from 'date-fns';
import { ar } from 'date-fns/locale';
import { LogOut, MessageSquarePlus, Search, Archive, Lock, Trash2, Ban } from 'lucide-react';
import { Menu, Transition } from '@headlessui/react';

// Component for each conversation item in the list
const ConversationItem: React.FC<{ conversation: Conversation; onSelect: (id: string) => void; }> = React.memo(({ conversation, onSelect }) => {
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
        {conversation.unread && (
          <div className="flex-shrink-0 w-3 h-3 rounded-full bg-indigo-500"></div>
        )}
      </div>
    </li>
  );
});

ConversationItem.displayName = 'ConversationItem';

const ConversationListScreen: React.FC = () => {
  const navigate = useNavigate();
  const { user, signOut } = useAuth();
  const { conversations, loading, error } = useConversations();
  const [searchTerm, setSearchTerm] = useState('');
  const [menu, setMenu] = useState<{ x: number; y: number; conversation: Conversation } | null>(null);
  const longPressTriggered = useRef(false); // Ref to prevent click after long press

  const handleLongPress = useCallback((target: EventTarget | null) => {
    if (!target) return;
    longPressTriggered.current = true; // Set flag to indicate a long press occurred

    const targetElement = target as HTMLElement;
    const conversationId = targetElement.dataset.id;
    const conversation = conversations.find(c => c.id === conversationId);

    if (!conversation) return;

    // We need to get the position from the element itself if the event is stale
    const rect = targetElement.getBoundingClientRect();
    setMenu({ x: rect.left, y: rect.bottom, conversation });

  }, [conversations]);

  const longPressEvents = useLongPress(handleLongPress, { delay: 500 });

  const handleCloseMenu = () => {
    setMenu(null);
  };

  useEffect(() => {
    if (!user) {
      navigate('/auth');
    }
  }, [user, navigate]);

  const handleSelectConversation = useCallback((conversationId: string) => {
    // Check the flag. If a long press just happened, reset the flag and do nothing.
    if (longPressTriggered.current) {
      longPressTriggered.current = false;
      return;
    }
    navigate(`/chat/${conversationId}`);
  }, [navigate]);

  const handleCreateNewConversation = useCallback(() => { navigate('/users'); }, [navigate]);
  const handleLogout = useCallback(async () => { /* ... */ }, [signOut, navigate]);
  const handleSearchChange = useCallback((e: React.ChangeEvent<HTMLInputElement>) => { setSearchTerm(e.target.value); }, []);

  const filteredConversations = useMemo(() =>
    conversations.filter(c => (c.name || '').toLowerCase().includes(searchTerm.toLowerCase())),
    [conversations, searchTerm]
  );

  if (loading) { return <div>Loading...</div>; }
  if (error) { return <div>Error...</div>; }

  return (
    <div className="h-screen bg-slate-100 dark:bg-slate-900 flex justify-center">
      <main className="w-full max-w-2xl h-screen flex flex-col bg-white dark:bg-slate-800 shadow-2xl">

        {/* Header */}
        <header className="bg-slate-50 dark:bg-slate-900/70 backdrop-blur-lg p-4 shadow-sm border-b border-slate-200 dark:border-slate-700 z-10">
          <div className="flex justify-between items-center">
            <h1 className="text-xl font-bold text-slate-800 dark:text-slate-50">المحادثات</h1>
            <div className="flex items-center space-x-2 rtl:space-x-reverse">
              <button onClick={handleCreateNewConversation} aria-label="محادثة جديدة">
                <MessageSquarePlus size={20} />
              </button>
              <button onClick={handleLogout} aria-label="تسجيل الخروج">
                <LogOut size={20} />
              </button>
            </div>
          </div>
          <div className="mt-4">
            <div className="relative">
              <span className="absolute inset-y-0 left-0 flex items-center pl-3 rtl:pl-0 rtl:right-3"><Search size={20} /></span>
              <input
                type="text"
                placeholder="بحث عن محادثة..."
                className="w-full p-2 pl-10 rtl:pr-10 rounded-lg bg-slate-200 dark:bg-slate-700"
                value={searchTerm}
                onChange={handleSearchChange}
              />
            </div>
          </div>
        </header>

        {/* Conversations List */}
        <div className="flex-1 overflow-y-auto">
          <ul>
            {filteredConversations.map((conversation) => (
              <div key={conversation.id} data-id={conversation.id} {...longPressEvents}>
                <ConversationItem conversation={conversation} onSelect={handleSelectConversation} />
              </div>
            ))}
          </ul>
        </div>
      </main>

      {/* Context Menu */}
      <Transition as={Fragment} show={!!menu}>
        {/* ... Menu backdrop ... */}
      </Transition>
      <Transition as={Fragment} show={!!menu}>
        <Menu as="div" className="fixed z-30" style={{ top: menu?.y, left: menu?.x }}>
          <Menu.Items static className="origin-top-left mt-2 w-56 rounded-md shadow-lg bg-white dark:bg-slate-800 ring-1 ring-black ring-opacity-5 focus:outline-none">
            <div className="py-1">
              <Menu.Item>{({ active }) => (<button onClick={() => handleCloseMenu()} className={`${active ? 'bg-slate-100' : ''} group flex items-center w-full px-4 py-2 text-sm text-slate-700`}><Archive className="mr-3 h-5 w-5" />أرشفة المحادثة</button>)}</Menu.Item>
              <Menu.Item>{({ active }) => (<button onClick={() => handleCloseMenu()} className={`${active ? 'bg-slate-100' : ''} group flex items-center w-full px-4 py-2 text-sm text-slate-700`}><Lock className="mr-3 h-5 w-5" />قفل المحادثة</button>)}</Menu.Item>
              <div className="px-4 my-1"><hr className="border-slate-200"/></div>
              <Menu.Item>{({ active }) => (<button onClick={() => handleCloseMenu()} className={`${active ? 'bg-slate-100' : ''} group flex items-center w-full px-4 py-2 text-sm text-slate-700`}><Trash2 className="mr-3 h-5 w-5" />حذف المحادثة لدي فقط</button>)}</Menu.Item>
              <Menu.Item>{({ active }) => (<button onClick={() => handleCloseMenu()} className={`${active ? 'bg-slate-100' : ''} group flex items-center w-full px-4 py-2 text-sm text-red-600`}><Trash2 className="mr-3 h-5 w-5" />حذف المحادثة لدى الجميع</button>)}</Menu.Item>
              <Menu.Item>{({ active }) => (<button onClick={() => handleCloseMenu()} className={`${active ? 'bg-slate-100' : ''} group flex items-center w-full px-4 py-2 text-sm text-red-600`}><Ban className="mr-3 h-5 w-5" />حظر المستخدم</button>)}</Menu.Item>
            </div>
          </Menu.Items>
        </Menu>
      </Transition>
    </div>
  );
};

export default React.memo(ConversationListScreen);
