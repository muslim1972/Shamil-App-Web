import { useEffect, useCallback } from "react";
import { useNavigation } from '@react-navigation/native';
import { Alert } from 'react-native';
import { supabase } from '../../lib/supabase';
import * as Notifications from 'expo-notifications';

export const useConversationListRealtime = (userId, fetchConversations) => {
  const navigation = useNavigation();

  // التعامل مع الإشعارات
  useEffect(() => {
    // لا تقم بإعداد المستمعين إذا لم يكن هناك مستخدم
    if (!userId) return;
    const notificationReceivedListener = Notifications.addNotificationReceivedListener(notification => {
      console.log('--- [Debug Push] Notification Received while app is foregrounded:', notification);
      fetchConversations();
    });
    const notificationResponseListener = Notifications.addNotificationResponseReceivedListener(response => {
      console.log('--- [Debug Push] Notification Tapped by user:', response);
      const data = response.notification.request.content.data;
      if (data && data.conversationId) {
        navigation.navigate('Chat', { conversationId: data.conversationId });
      }
    });
    // دالة التنظيف عند مغادرة الشاشة بشكل نهائي
    return () => {
      Notifications.removeNotificationSubscription(notificationReceivedListener);
      Notifications.removeNotificationSubscription(notificationResponseListener);
    };
  }, [userId, fetchConversations, navigation]); // الاعتماديات مستقرة

  // إعداد Realtime
  const setupRealtime = useCallback(() => {
    if (!userId) return;

    const realtimeChannel = supabase
      .channel(`conversations-list-for-${userId}`)
      .on(
        "postgres_changes",
        { event: "*", schema: "public", table: "conversation_members" },
        () => { console.log('Realtime: conversation_members change, fetching.'); fetchConversations(); }
      )
      .on(
        'postgres_changes',
        { event: 'UPDATE', schema: 'public', table: 'conversations' },
        () => { console.log('Realtime: conversations change, fetching.'); fetchConversations(); }
      )
      .on(
        'postgres_changes',
        { event: 'INSERT', schema: 'public', table: 'messages' },
        
      )
      .subscribe((status, err) => {
        if (status === 'CHANNEL_ERROR' || status === 'TIMED_OUT') {
          console.error(`--- [ConversationListScreen] Realtime channel FAILED for user ${userId}. Status: ${status}`, err);
          Alert.alert('خطأ في الاتصال', 'فشل الاتصال الفوري، قد لا يتم تحديث المحادثات تلقائياً.');
        }
      });

    // دالة التنظيف (Cleanup) - إزالة اشتراك Realtime عند مغادرة الشاشة
    return () => {
      supabase.removeChannel(realtimeChannel);
    };
  }, [userId, fetchConversations]);

  return {
    setupRealtime
  };
};
