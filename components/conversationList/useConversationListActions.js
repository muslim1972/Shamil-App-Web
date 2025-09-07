import { useState, useCallback } from "react";
import { Alert } from 'react-native';
import { supabase } from '../../lib/supabase';

export const useConversationListActions = (conversations, setConversations, fetchConversations) => {
  const [isProcessing, setIsProcessing] = useState(false);
  const [selectedConversation, setSelectedConversation] = useState(null);
  const [isActionMenuVisible, setIsActionMenuVisible] = useState(false);

  const handleDbOperation = useCallback(async (operation, errorMessage, operationType) => {
    setIsProcessing(true);
    // إغلاق القائمة قبل بدء العملية
    setIsActionMenuVisible(false);

    try {
      const { error } = await operation();
      if (error) {
        Alert.alert('خطأ', errorMessage);
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
    } catch (err) {
      Alert.alert('خطأ', errorMessage);
      console.error(errorMessage, err);
    } finally {
      setIsProcessing(false);
      setSelectedConversation(null); // مسح المحادثة المحددة
    }
  }, [fetchConversations, selectedConversation, setConversations]);

  const handleConversationOptions = useCallback((conversation) => {
    setSelectedConversation(conversation);
    setIsActionMenuVisible(true);
  }, []);

  const getActionMenuActions = useCallback(() => {
    if (!selectedConversation) return [];

    return [
      {
        text: "أرشفة المحادثة",
        onPress: () => handleDbOperation(
          () => supabase.rpc('archive_conversation', { p_conversation_id: selectedConversation.id }),
          'لم نتمكن من أرشفة المحادثة.',
          'archive' // تحديد نوع العملية
        ),
      },
      {
        text: "حذف المحادثة لدي",
        style: 'destructive',
        onPress: () => handleDbOperation(
          () => supabase.rpc('clear_and_hide_conversation', { p_conversation_id: selectedConversation.id }),
          'حدث خطأ أثناء محاولة حذف المحادثة.',
          'hide' // تحديد نوع العملية
        ),
      },
      {
        text: "الحذف لدى الجميع",
        style: "destructive",
        onPress: () => {
          Alert.alert(
            "تأكيد الحذف النهائي",
            "هل أنت متأكد؟ سيتم حذف هذه المحادثة وكل رسائلها بشكل نهائي لك وللجميع.",
            [
              {
                text: "نعم، احذف للجميع",
                style: "destructive",
                onPress: () => handleDbOperation(
                  () => supabase.rpc('delete_conversation_for_all', { p_conversation_id: selectedConversation.id }),
                  'لم نتمكن من حذف المحادثة للجميع.',
                  'delete_all' // تحديد نوع العملية
                ),
              },
              { text: "إلغاء", style: "cancel" },
            ]
          );
        },
      },
    ];
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
    getActionMenuActions,
    closeActionMenu
  };
};
