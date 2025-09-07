import { useState, useCallback } from "react";
import { Alert } from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { supabase } from '../../lib/supabase';
import { useAuth } from '../../context/AuthContext'; // استيراد useAuth

export const useArchivedConversationsActions = (conversations, setConversations, fetchArchivedConversations) => {
  const { user } = useAuth(); // الحصول على المستخدم الحالي
  const navigation = useNavigation();
  const [isProcessing, setIsProcessing] = useState(false);
  const [selectedConversation, setSelectedConversation] = useState(null);
  const [isActionMenuVisible, setIsActionMenuVisible] = useState(false);

  const handleArchive = async (conversationId) => {
    if (!user) return; // التأكد من وجود المستخدم
    setIsActionMenuVisible(false); // إغلاق القائمة
    setIsProcessing(true);

    // استخدام دالة archive_conversation الموجودة في قاعدة البيانات
    const { error } = await supabase.rpc('archive_conversation', { 
      p_conversation_id: conversationId 
    });

    if (error) {
      Alert.alert("خطأ", "لم نتمكن من أرشفة المحادثة.");
      console.error("Error archiving:", error);
    } else {
      // إعادة جلب المحادثات المؤرشفة لتحديث الواجهة
      fetchArchivedConversations();
    }
    setIsProcessing(false);
  };

  const handleUnarchive = async (conversationId) => {
    if (!user) return; // التأكد من وجود المستخدم
    setIsActionMenuVisible(false); // إغلاق القائمة
    setIsProcessing(true);

    // استخدام دالة unarchive_conversation الموجودة في قاعدة البيانات
    const { error } = await supabase.rpc('unarchive_conversation', { 
      p_conversation_id: conversationId 
    });

    if (error) {
      Alert.alert("خطأ", "لم نتمكن من إلغاء أرشفة المحادثة.");
      console.error("Error unarchiving:", error);
    } else {
      // إعادة جلب المحادثات المؤرشفة لتحديث الواجهة
      fetchArchivedConversations();

      // إعلام واجهة المحادثات الرئيسية بوجود تحديث
      // نستخدم DeviceEventEmitter لإعلام الشاشة الرئيسية بوجود تحديث
      const { DeviceEventEmitter } = require('react-native');
      DeviceEventEmitter.emit('conversationUnarchived');

      // العودة إلى شاشة المحادثات الرئيسية بعد إلغاء الأرشفة بنجاح
      navigation.goBack();
    }
    setIsProcessing(false);
  };

  const handleConversationOptions = (conversation) => {
    setSelectedConversation(conversation);
    setIsActionMenuVisible(true);
  };

  const closeActionMenu = () => {
    setIsActionMenuVisible(false);
    setSelectedConversation(null);
  };

  const getActionMenuActions = () => {
    if (!selectedConversation) return [];

    const actions = [];
    // إضافة خيار إلغاء الأرشفة إذا كانت المحادثة مؤرشفة
    if (selectedConversation.archived_at) {
      actions.push({
        text: "إلغاء الأرشفة",
        onPress: () => handleUnarchive(selectedConversation.id),
      });
    } else {
      // إضافة خيار الأرشفة إذا لم تكن المحادثة مؤرشفة
      actions.push({
        text: "أرشفة المحادثة",
        onPress: () => handleArchive(selectedConversation.id),
      });
    }
    // يمكنك إضافة المزيد من الإجراءات هنا إذا لزم الأمر
    return actions;
  };

  return {
    isProcessing,
    selectedConversation,
    isActionMenuVisible,
    handleConversationOptions,
    closeActionMenu,
    getActionMenuActions
  };
};