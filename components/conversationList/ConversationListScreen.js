import React, { useEffect, useCallback } from "react";
import { useFocusEffect } from '@react-navigation/native';
import { useAuth } from '../../context/AuthContext';
import { useConversationList } from './useConversationList';
import { useConversationListRealtime } from './useConversationListRealtime';
import { useConversationListActions } from './useConversationListActions';
import { ConversationListUI } from './ConversationListUI';

export default function ConversationListScreen({ navigation }) {
  const { user } = useAuth();
  const userId = user?.id; // استخدام معرّف المستخدم المستقر كقيمة بدائية

  // استخدام الـ hooks المقسمة
  const {
    conversations,
    setConversations,
    isLoading,
    setIsLoading,
    fetchConversations
  } = useConversationList(userId);

  const { setupRealtime } = useConversationListRealtime(userId, fetchConversations);

  const {
    isProcessing,
    selectedConversation,
    isActionMenuVisible,
    handleConversationOptions,
    getActionMenuActions,
    closeActionMenu
  } = useConversationListActions(conversations, setConversations, fetchConversations);

  // إعداد Realtime عند التركيز على الشاشة
  useFocusEffect(
    useCallback(() => {
      if (!userId) {
        setIsLoading(false);
        return;
      }

      // تحميل البيانات عند التركيز على الشاشة
      fetchConversations();

      // إعداد Realtime
      const cleanupRealtime = setupRealtime();

      // الاستماع إلى حدث إلغاء الأرشفة
      const handleUnarchiveEvent = () => {
        fetchConversations();
      };

      // إضافة مستمع الحدث باستخدام DeviceEventEmitter
      const { DeviceEventEmitter } = require('react-native');
      const subscription = DeviceEventEmitter.addListener('conversationUnarchived', handleUnarchiveEvent);

      // دالة التنظيف
      return () => {
        cleanupRealtime();
        subscription.remove();
      };
    }, [userId, fetchConversations, setIsLoading, setupRealtime])
  );

  // التعامل مع اختيار المحادثة
  const handleSelectConversation = (conversation) => {
    navigation.navigate('Chat', { conversationId: conversation.id });
  };

  return (
    <ConversationListUI
      conversations={conversations}
      isLoading={isLoading}
      isProcessing={isProcessing}
      selectedConversation={selectedConversation}
      isActionMenuVisible={isActionMenuVisible}
      actionMenuActions={getActionMenuActions()}
      handleSelectConversation={handleSelectConversation}
      handleConversationOptions={handleConversationOptions}
      closeActionMenu={closeActionMenu}
    />
  );
}
