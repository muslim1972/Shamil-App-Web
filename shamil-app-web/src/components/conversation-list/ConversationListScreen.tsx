import React, { useState, useEffect, useCallback, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { useConversations } from '../../hooks/useConversations';
import { useConversationListActions } from '../../hooks/useConversationListActions';
import useLongPress from '../../hooks/useLongPress';
import type { Conversation } from '../../types';
import { WaterBackgroundOptimized as WaterBackground } from '../WaterBackground_optimized';
import { supabase } from '../../services/supabase';
import toast from 'react-hot-toast';

// استيراد المكونات الفرعية
import { ConversationHeader } from './ConversationHeader';
import { VirtualizedConversationList } from './VirtualizedConversationList';
import { ConversationContextMenu } from './ConversationContextMenu';
import { ConversationEmptyState } from './ConversationEmptyState';

export const ConversationListScreen: React.FC = () => {
  const navigate = useNavigate();
  const { user, signOut } = useAuth();
  const { conversations, loading, error, fetchConversations, setConversations } = useConversations();

  const [menu, setMenu] = useState<{ x: number; y: number; conversation: Conversation } | null>(null);
  const [showQRMenu, setShowQRMenu] = useState(false);
  const longPressTriggered = useRef(false); // Ref to prevent click after long press

  // استخدام دوال إجراءات المحادثات
  const {
    handleConversationOptions,
    handleArchiveConversation,
    handleDeleteConversationForAll,
    closeActionMenu
  } = useConversationListActions(setConversations, fetchConversations);

  const handleLongPress = useCallback((target: EventTarget | null) => {
    if (!target) return;
    longPressTriggered.current = true; // Set flag to indicate a long press occurred

    const targetElement = target as HTMLElement;
    const conversationId = targetElement.dataset.id;
    const conversation = conversations.find(c => c.id === conversationId);

    if (!conversation) return;

    // استخدام دالة التعامل مع خيارات المحادثة الجديدة
    handleConversationOptions(conversation);

    // We need to get the position from the element itself if the event is stale
    const rect = targetElement.getBoundingClientRect();
    setMenu({ x: rect.left, y: rect.bottom, conversation });

  }, [conversations, handleConversationOptions]);

  useLongPress(handleLongPress, { delay: 500 });

  const handleCloseMenu = useCallback(() => {
    setMenu(null);
    closeActionMenu();
  }, [closeActionMenu]);

  // إغلاق قائمة QR عند النقر خارجها
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

  const handleGenerateQR = useCallback(() => {
    // سيتم تنفيذ هذه الوظيفة في المرحلة الثانية
    setShowQRMenu(false);
    toast.success('سيتم إنشاء رمز QR');
  }, []);

  const handleOpenCamera = useCallback(() => {
    // سيتم تنفيذ هذه الوظيفة في المرحلة الثانية
    setShowQRMenu(false);
    toast.success('سيتم فتح الكاميرا لقراءة رمز QR');
  }, []);

  const handleCreateConversation = useCallback(async (userId: string) => {
    if (!user) return;

    try {
      // إنشاء محادثة جديدة أو الحصول على محادثة موجودة
      const { data, error } = await supabase.rpc('create_or_get_conversation_with_user', {
        p_other_user_id: userId
      });

      if (error) {
        toast.error('لم نتمكن من بدء المحادثة.');
        console.error('Error creating/getting conversation:', error);
        return;
      }

      if (data) {
        // الانتقال إلى شاشة المحادثة
        navigate(`/chat/${data}`);
      }
    } catch (err) {
      console.error('Error in handleCreateConversation:', err);
      toast.error('حدث خطأ أثناء إنشاء المحادثة');
    }
  }, [user, navigate]);

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

  const handleLogout = useCallback(async () => { 
    try {
      await signOut();
      navigate('/auth');
    } catch (error) {
      console.error('Error signing out:', error);
      toast.error('حدث خطأ أثناء تسجيل الخروج');
    }
  }, [signOut, navigate]);

  if (loading) { 
    return (
      <div className="flex items-center justify-center h-screen bg-slate-50 dark:bg-slate-900">
        <div className="w-16 h-16 border-4 border-indigo-600 border-t-transparent rounded-full animate-spin"></div>
        <p className="mt-4 text-slate-600 dark:text-slate-300 mr-4">جاري تحميل المحادثات...</p>
      </div>
    ); 
  }

  if (error) { 
    return (
      <div className="flex flex-col items-center justify-center h-screen bg-slate-50 dark:bg-slate-900">
        <div className="text-red-500 text-lg mb-4">حدث خطأ في تحميل المحادثات</div>
        <button 
          onClick={fetchConversations}
          className="px-4 py-2 bg-indigo-600 text-white rounded-md hover:bg-indigo-700 transition-colors"
        >
          إعادة المحاولة
        </button>
      </div>
    ); 
  }

  return (
    <div className="h-screen bg-slate-100 dark:bg-slate-900 relative">
      <WaterBackground />
      <main className="w-full h-full flex flex-col bg-white bg-opacity-70 dark:bg-slate-800 bg-opacity-70 shadow-2xl sm:max-w-2xl sm:mx-auto relative z-10">

        {/* Header */}
        <ConversationHeader
          onCreateNewConversation={handleCreateNewConversation}
          onNavigateToArchived={() => navigate('/archived')}
          onLogout={handleLogout}
          onGenerateQR={handleGenerateQR}
          onOpenCamera={handleOpenCamera}
          onCreateConversation={handleCreateConversation}
          showQRMenu={showQRMenu}
          setShowQRMenu={setShowQRMenu}
        />

        {/* Virtualized Conversations List */}
        {conversations.length > 0 ? (
          <VirtualizedConversationList
            conversations={conversations}
            onSelectConversation={handleSelectConversation}
          />
        ) : (
          <ConversationEmptyState onCreateNewConversation={handleCreateNewConversation} />
        )}

        {/* Context Menu */}
        <ConversationContextMenu
          menu={menu}
          onArchiveConversation={handleArchiveConversation}
          onDeleteConversationForAll={handleDeleteConversationForAll}
          onCloseMenu={handleCloseMenu}
        />
      </main>
    </div>
  );
};
