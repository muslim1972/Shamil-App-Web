import { useCallback, useRef } from 'react';
import { BackHandler } from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { supabase } from '../../../lib/supabase';

export const useChatFunctions = (conversationId, user, isSelectionMode, handleCancelSelection) => {
  const navigation = useNavigation();
  const flatListRef = useRef(null);
  const initialScrollDone = useRef(false);
  const prevMessagesLength = useRef(0);

  // دالة لجلب تفاصيل المحادثة
  const fetchConversationDetails = useCallback(async () => {
    if (!conversationId || !user) return;
    const { data, error } = await supabase
      .rpc('get_conversation_details', { p_conversation_id: conversationId });
    if (error) {
      console.error('Error fetching conversation details:', error);
    } else if (data && data.length > 0) {
      return data[0];
    }
    return null;
  }, [conversationId, user]);

  // دالة للتعامل مع زر الرجوع
  useFocusEffect(
    useCallback(() => {
      const onBackPress = () => {
        if (isSelectionMode) {
          handleCancelSelection();
          return true;
        }
        navigation.goBack();
        return true;
      };
      const subscription = BackHandler.addEventListener('hardwareBackPress', onBackPress);
      return () => subscription.remove();
    }, [navigation, isSelectionMode, handleCancelSelection])
  );

  // دالة لإرسال رسالة نصية
  const handleSendText = async (newMessageText, handleSendText) => {
    handleSendText(newMessageText);
  };

  return {
    flatListRef,
    initialScrollDone,
    prevMessagesLength,
    fetchConversationDetails,
    handleSendText
  };
};
