import React, { useState, useEffect, useMemo, useCallback, Fragment } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { useForwarding } from '../context/ForwardingContext';
import { useConversations } from '../hooks/useConversations';
import { useConversationListActions } from '../hooks/useConversationListActions';
import useLongPress from '../hooks/useLongPress';
import type { Conversation } from '../types';
import { formatDistanceToNow } from 'date-fns';
import { ar } from 'date-fns/locale';
import { LogOut, MessageSquarePlus, Archive, Trash2, Ban, QrCode, Image, Camera, X } from 'lucide-react';
import { Menu, Transition } from '@headlessui/react';
import SearchDialog from './SearchDialog';
import { supabase } from '../services/supabase';
import toast from 'react-hot-toast';

const ConversationItem: React.FC<{ conversation: Conversation; }> = React.memo(({ conversation }) => {
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
    <div className="p-3 sm:p-4 hover:bg-slate-100 dark:hover:bg-slate-700 cursor-pointer transition-colors border-b border-slate-200 dark:border-slate-700">
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
    </div>
  );
});

ConversationItem.displayName = 'ConversationItem';

const ConversationListScreen: React.FC = () => {
  const navigate = useNavigate();
  const { user, signOut } = useAuth();
  const { isForwarding, messagesToForward, completeForwarding } = useForwarding();
  const { conversations, loading, error, fetchConversations, setConversations } = useConversations();

  const [menu, setMenu] = useState<{ x: number; y: number; conversation: Conversation } | null>(null);
  const [showQRMenu, setShowQRMenu] = useState(false);

  const { handleConversationOptions, handleArchiveConversation, handleHideConversation, handleDeleteConversationForAll, closeActionMenu } = useConversationListActions(setConversations, fetchConversations);

  const handleLongPress = useCallback((target: EventTarget | null) => {
    if (!target || isForwarding) return; // Disable long press in forwarding mode

    const targetElement = target as HTMLElement;
    const conversationId = targetElement.dataset.id;
    const conversation = conversations.find(c => c.id === conversationId);

    if (!conversation) return;

    handleConversationOptions(conversation);

    const rect = targetElement.getBoundingClientRect();
    setMenu({ x: rect.left, y: rect.bottom, conversation });

  }, [conversations, handleConversationOptions, isForwarding]);

  const handleSelectConversation = useCallback(async (conversationId: string) => {
    if (isForwarding && user) {
        const loadingToast = toast.loading('جاري تحويل الرسائل...');
        try {
            const { error } = await supabase.from('messages').insert({
                conversation_id: conversationId,
                sender_id: user.id,
                content: JSON.stringify(messagesToForward),
                message_type: 'forwarded_block',
            });

            if (error) throw error;

            toast.success('تم تحويل الرسائل بنجاح!');
            completeForwarding();
            navigate(`/chat/${conversationId}`);

        } catch (err) {
            console.error('Error forwarding messages:', err);
            toast.error('فشل تحويل الرسائل.');
        } finally {
            toast.dismiss(loadingToast);
        }
        return; // Stop execution here
    }

    navigate(`/chat/${conversationId}`);
  }, [navigate, isForwarding, user, messagesToForward, completeForwarding]);

  const handleConversationClick = (event: React.MouseEvent<HTMLElement> | React.TouchEvent<HTMLElement>) => {
    const conversationElement = (event.currentTarget as HTMLElement);
    const conversationId = conversationElement.dataset.id;
    if (conversationId) {
        handleSelectConversation(conversationId);
    }
  };

  const longPressEvents = useLongPress(handleLongPress, handleConversationClick, { delay: 500 });

  const handleCloseMenu = () => {
    setMenu(null);
    closeActionMenu();
  };

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (showQRMenu && !(event.target as Element).closest('.relative')) {
        setShowQRMenu(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [showQRMenu]);

  const handleGenerateQR = () => {
    setShowQRMenu(false);
    toast.success('سيتم إنشاء رمز QR');
  };

  const handleOpenCamera = () => {
    setShowQRMenu(false);
    toast.success('سيتم فتح الكاميرا لقراءة رمز QR');
  };

  const handleCreateConversation = async (userId: string) => {
    if (!user) return;

    try {
      const { data, error } = await supabase.rpc('create_or_get_conversation_with_user', { p_other_user_id: userId });

      if (error) {
        toast.error('لم نتمكن من بدء المحادثة.');
        console.error('Error creating/getting conversation:', error);
        return;
      }

      if (data) {
        navigate(`/chat/${data}`);
      }
    } catch (err) {
      console.error('Error in handleCreateConversation:', err);
      toast.error('حدث خطأ أثناء إنشاء المحادثة');
    }
  };

  useEffect(() => {
    if (!user) {
      navigate('/auth');
    }
  }, [user, navigate]);

  const handleCreateNewConversation = useCallback(() => { navigate('/users'); }, [navigate]);
  const handleLogout = useCallback(async () => { /* ... */ }, [signOut, navigate]);

  if (loading) { return <div>Loading...</div>; }
  if (error) { return <div>Error...</div>; }

  return (
    <div className="h-screen bg-slate-100 dark:bg-slate-900">
      <main className="w-full h-full flex flex-col bg-white dark:bg-slate-800 shadow-2xl sm:max-w-2xl sm:mx-auto">

        {isForwarding && (
            <div className="bg-blue-100 border-b-2 border-blue-500 p-3 text-center">
                <div className="flex justify-between items-center">
                    <p className="font-semibold text-blue-800">اختر محادثة لتحويل الرسائل إليها</p>
                    <button onClick={() => completeForwarding()} className="p-1 rounded-full hover:bg-blue-200">
                        <X size={20} className="text-blue-800" />
                    </button>
                </div>
            </div>
        )}

        <header className="bg-slate-50 dark:bg-slate-900/70 backdrop-blur-lg p-4 shadow-sm border-b border-slate-200 dark:border-slate-700 z-10">
          <div className="flex justify-between items-center">
            <h1 className="text-xl font-bold text-slate-800 dark:text-slate-50">المحادثات</h1>
            <div className="flex items-center space-x-2 rtl:space-x-reverse">
              <button onClick={handleCreateNewConversation} aria-label="محادثة جديدة">
                <MessageSquarePlus size={20} />
              </button>
              <button onClick={() => navigate('/archived')} aria-label="المحادثات المؤرشفة">
                <Archive size={20} />
              </button>
              <button onClick={handleLogout} aria-label="تسجيل الخروج">
                <LogOut size={20} />
              </button>
            </div>
          </div>
          <div className="mt-4 flex justify-between items-center">
            <div className="relative flex-1">
              <SearchDialog
                onOpenConversation={handleCreateConversation}
                onGenerateQR={handleGenerateQR}
                onOpenCamera={handleOpenCamera}
              />
            </div>
            <div className="relative">
              <button
                className="ml-2 p-2 bg-indigo-600 text-white rounded-full hover:bg-indigo-700 transition-colors"
                aria-label="بحث عن مستخدم"
                onClick={() => setShowQRMenu(!showQRMenu)}
              >
                <QrCode size={20} />
              </button>
              {showQRMenu && (
                <div className="absolute right-0 mt-2 w-56 bg-white dark:bg-slate-800 border border-indigo-200 rounded-xl shadow-xl z-50 overflow-hidden">
                  <div className="p-3 bg-indigo-50 dark:bg-indigo-900/20 border-b border-indigo-100 dark:border-indigo-800">
                    <div className="text-sm text-indigo-700 dark:text-indigo-300 font-medium">خيارات QR</div>
                  </div>
                  <button
                    className="w-full text-right p-4 hover:bg-indigo-50 dark:hover:bg-indigo-900/20 transition-colors"
                    onClick={handleGenerateQR}
                  >
                    <div className="flex items-center">
                      <div className="w-8 h-8 rounded-lg bg-indigo-100 dark:bg-indigo-800/50 flex items-center justify-center ml-3">
                        <Image className="h-5 w-5 text-indigo-600 dark:text-indigo-400" />
                      </div>
                      <div className="text-right">
                        <div className="font-medium text-slate-800 dark:text-slate-100">من الاستوديو</div>
                        <div className="text-xs text-slate-500 dark:text-slate-400">إنشاء رمز QR من صورة</div>
                      </div>
                    </div>
                  </button>
                  <button
                    className="w-full text-right p-4 hover:bg-indigo-50 dark:hover:bg-indigo-900/20 transition-colors border-t border-slate-100 dark:border-slate-700"
                    onClick={handleOpenCamera}
                  >
                    <div className="flex items-center">
                      <div className="w-8 h-8 rounded-lg bg-indigo-100 dark:bg-indigo-800/50 flex items-center justify-center ml-3">
                        <Camera className="h-5 w-5 text-indigo-600 dark:text-indigo-400" />
                      </div>
                      <div className="text-right">
                        <div className="font-medium text-slate-800 dark:text-slate-100">باستخدام الكاميرا</div>
                        <div className="text-xs text-slate-500 dark:text-slate-400">فتح الكاميرا لمسح QR</div>
                      </div>
                    </div>
                  </button>
                </div>
              )}
            </div>
          </div>
        </header>

        <div className="flex-1 overflow-y-auto">
          <ul>
            {conversations.map((conversation) => (
              <li key={conversation.id} data-id={conversation.id} {...longPressEvents}>
                <ConversationItem conversation={conversation} />
              </li>
            ))}
          </ul>
        </div>
      </main>

      <Transition as={Fragment} show={!!menu}>
        {/* ... Menu backdrop ... */}
      </Transition>
      <Transition as={Fragment} show={!!menu}>
        <Menu as="div" className="fixed z-30" style={{ top: menu?.y, left: menu?.x }}>
          <Menu.Items static className="origin-top-left mt-2 w-56 rounded-md shadow-lg bg-white dark:bg-slate-800 ring-1 ring-black ring-opacity-5 focus:outline-none">
            <div className="py-1">
              <Menu.Item>{({ active }) => (<button onClick={() => { handleArchiveConversation(); handleCloseMenu(); }} className={`${active ? 'bg-slate-100' : ''} group flex items-center w-full px-4 py-2 text-sm text-slate-700`}><Archive className="mr-3 h-5 w-5" />أرشفة المحادثة</button>)}</Menu.Item>
              <Menu.Item>{({ active }) => (<button onClick={() => { handleHideConversation(); handleCloseMenu(); }} className={`${active ? 'bg-slate-100' : ''} group flex items-center w-full px-4 py-2 text-sm text-slate-700`}><Trash2 className="mr-3 h-5 w-5" />حذف المحادثة لدي</button>)}</Menu.Item>
              <Menu.Item>{({ active }) => (<button onClick={() => { handleDeleteConversationForAll(); handleCloseMenu(); }} className={`${active ? 'bg-slate-100' : ''} group flex items-center w-full px-4 py-2 text-sm text-red-600`}><Trash2 className="mr-3 h-5 w-5" />حذف المحادثة لدى الجميع</button>)}</Menu.Item>
              <Menu.Item>{({ active }) => (<button onClick={() => handleCloseMenu()} className={`${active ? 'bg-slate-100' : ''} group flex items-center w-full px-4 py-2 text-sm text-red-600`}><Ban className="mr-3 h-5 w-5" />حظر المستخدم</button>)}</Menu.Item>
            </div>
          </Menu.Items>
        </Menu>
      </Transition>


    </div>
  );
};

export default React.memo(ConversationListScreen);