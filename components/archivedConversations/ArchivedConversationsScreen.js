import React, { useEffect, useCallback } from "react";
import { useFocusEffect } from '@react-navigation/native';
import { BackHandler } from 'react-native';
import { useAuth } from '../../context/AuthContext';
import { useArchivedConversations } from './useArchivedConversations';
import { useArchivedConversationsActions } from './useArchivedConversationsActions';
import { ArchivedConversationsUI } from './ArchivedConversationsUI';

export default function ArchivedConversationsScreen({ navigation }) {
  const { user } = useAuth();
  const userId = user?.id;

  // استخدام الـ hooks المقسمة
  const {
    conversations,
    setConversations,
    isLoading,
    fetchArchivedConversations
  } = useArchivedConversations(user);

  const {
    isProcessing,
    selectedConversation,
    isActionMenuVisible,
    handleConversationOptions,
    closeActionMenu,
    getActionMenuActions
  } = useArchivedConversationsActions(conversations, setConversations, fetchArchivedConversations);

  // التعامل مع زر الرجوع
  useFocusEffect(
    useCallback(() => {
      const onBackPress = () => {
        // إغلاق القائمة أولاً إذا كانت مفتوحة
        if (isActionMenuVisible) {
          closeActionMenu();
          return true;
        }
        navigation.goBack();
        return true;
      };
      const subscription = BackHandler.addEventListener('hardwareBackPress', onBackPress);
      return () => subscription.remove();
    }, [navigation, isActionMenuVisible, closeActionMenu])
  );

  // جلب المحادثات عند التركيز على الشاشة
  useFocusEffect(
    useCallback(() => {
      fetchArchivedConversations();
    }, [fetchArchivedConversations])
  );

  // التعامل مع اختيار المحادثة
  const handleSelectConversation = (conversation) => {
    navigation.navigate("Chat", { conversationId: conversation.id });
  };

  return (
    <ArchivedConversationsUI
      conversations={conversations}
      isLoading={isLoading}
      isProcessing={isProcessing}
      selectedConversation={selectedConversation}
      isActionMenuVisible={isActionMenuVisible}
      actionMenuActions={getActionMenuActions()}
      handleSelectConversation={handleSelectConversation}
      handleConversationOptions={handleConversationOptions}
      closeActionMenu={closeActionMenu}
      navigation={navigation}
    />
  );
}
