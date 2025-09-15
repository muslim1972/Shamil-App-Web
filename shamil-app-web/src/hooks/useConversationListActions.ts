import { useState, useCallback } from "react";
import { supabase } from '../services/supabase';

export const useConversationListActions = (setConversations: React.Dispatch<React.SetStateAction<any[]>>, fetchConversations: () => Promise<void>) => {
  const [isProcessing, setIsProcessing] = useState(false);
  const [selectedConversation, setSelectedConversation] = useState<any | null>(null);
  const [isActionMenuVisible, setIsActionMenuVisible] = useState(false);

  const handleDbOperation = useCallback(async (operation: () => Promise<{ error: any }>, errorMessage: string, operationType: string) => {
    setIsProcessing(true);
    // إغلاق القائمة قبل بدء العملية
    setIsActionMenuVisible(false);

    try {
      const { error } = await operation();
      if (error) {
        alert('خطأ: ' + errorMessage);
        console.error(errorMessage, error);
      } else {
        // تحديث الواجهة فوراً بدلاً من انتظار إعادة الجلب
        if (operationType === 'archive' || operationType === 'hide') {
          // دائماً قم بإعادة جلب المحادثات لضمان التحديث الصحيح
          await fetchConversations();
        } else {
          await fetchConversations(); // إعادة الجلب للحالات الأخرى
        }
      }
    } catch (err: any) {
      alert('خطأ: ' + errorMessage);
      console.error(errorMessage, err);
    } finally {
      setIsProcessing(false);
      setSelectedConversation(null); // مسح المحادثة المحددة
    }
  }, [fetchConversations, selectedConversation, setConversations]);

  const handleConversationOptions = useCallback((conversation: any) => {
    setSelectedConversation(conversation);
    setIsActionMenuVisible(true);
  }, []);

  const handleArchiveConversation = useCallback(() => {
    if (!selectedConversation) return;

    handleDbOperation(
      async () => {
        const { error } = await supabase.rpc('archive_conversation', { p_conversation_id: selectedConversation.id });
        return { error };
      },
      'لم نتمكن من أرشفة المحادثة.',
      'archive' // تحديد نوع العملية
    );
  }, [selectedConversation, handleDbOperation]);

  const handleHideConversation = useCallback(() => {
    if (!selectedConversation) return;

    handleDbOperation(
      async () => {
        const { error } = await supabase.rpc('clear_and_hide_conversation', { p_conversation_id: selectedConversation.id });
        return { error };
      },
      'حدث خطأ أثناء محاولة حذف المحادثة.',
      'hide' // تحديد نوع العملية
    );
  }, [selectedConversation, handleDbOperation]);

  const handleDeleteConversationForAll = useCallback(() => {
    if (!selectedConversation) return;

    if (confirm("هل أنت متأكد؟ سيتم حذف هذه المحادثة وكل رسائلها بشكل نهائي لك وللجميع.")) {
      handleDbOperation(
        async () => {
          const { error } = await supabase.rpc('delete_conversation_for_all', { p_conversation_id: selectedConversation.id });
          return { error };
        },
        'لم نتمكن من حذف المحادثة للجميع.',
        'delete_all' // تحديد نوع العملية
      );
    }
  }, [selectedConversation, handleDbOperation]);

  const closeActionMenu = useCallback(() => {
    setIsActionMenuVisible(false);
    setSelectedConversation(null);
  }, []);

  return {
    isProcessing,
    selectedConversation,
    isActionMenuVisible,
    handleConversationOptions,
    handleArchiveConversation,
    handleHideConversation,
    handleDeleteConversationForAll,
    closeActionMenu
  };
};
