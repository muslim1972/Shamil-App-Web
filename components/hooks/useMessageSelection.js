import { useState, useCallback, useMemo } from 'react';
import { Alert } from 'react-native';
import * as Clipboard from 'expo-clipboard';
import { useNavigation } from '@react-navigation/native';
import { supabase } from '../../lib/supabase';

// هذا الـ Hook مسؤول عن كل ما يتعلق بتحديد الرسائل
export const useMessageSelection = (messages, setMessages, userId) => {
  const navigation = useNavigation();
  const [selectedMessages, setSelectedMessages] = useState([]);
  // [جديد] التحقق مما إذا كانت هناك رسائل نصية قابلة للنسخ
  const canCopy = useMemo(() => {
    if (selectedMessages.length === 0) return false;
    // ابحث عن أول رسالة محددة تكون نصية
    return messages.some(msg => selectedMessages.includes(msg.id) && msg.message_type === 'text');
  }, [selectedMessages, messages]);

  const isSelectionMode = selectedMessages.length > 0;

  const handleLongPressMessage = useCallback((message) => {
    setSelectedMessages([message.id]);
  }, []);

  const handlePressMessage = useCallback((message) => {
    // [إصلاح نهائي] جعل الدالة مستقرة باستخدام functional update.
    // التحقق من وضع التحديد يتم الآن بشكل موثوق داخل MessageBubble.
    setSelectedMessages(currentSelected =>
      currentSelected.includes(message.id)
        ? currentSelected.filter(id => id !== message.id)
        : [...currentSelected, message.id]
    );
  }, []); // إزالة الاعتمادية يجعل الدالة مستقرة ولا تتغير

  const handleCancelSelection = useCallback(() => {
    setSelectedMessages([]);
  }, []);

  const handleCopyMessages = useCallback(async () => {
    const textToCopy = messages
      .filter(msg => selectedMessages.includes(msg.id) && msg.message_type === 'text')
      .map(msg => msg.content)
      .join('\n');

    if (textToCopy) {
      // [إصلاح] استخدام الدالة الصحيحة من مكتبة إكسبو
      await Clipboard.setStringAsync(textToCopy);
      Alert.alert('تم النسخ', 'تم نسخ الرسائل إلى الحافظة.');
    } else {
      Alert.alert('تنبيه', 'لا يمكن نسخ الصور، تم تحديد رسائل غير نصية فقط.');
    }
    handleCancelSelection();
  }, [messages, selectedMessages, handleCancelSelection]);

  const handleDeleteMessages = useCallback(() => {
    // البحث عن كائنات الرسائل المحددة بالكامل
    const selectedMessageObjects = messages.filter(msg => selectedMessages.includes(msg.id));
    // التحقق مما إذا كان المستخدم الحالي هو مرسل *جميع* الرسائل المحددة
    const canDeleteForAll = userId && selectedMessageObjects.length > 0 && selectedMessageObjects.every(msg => msg.sender_id === userId);

    const alertButtons = [];

    // إضافة خيار "الحذف لدى الجميع" فقط إذا كان ممكناً
    if (canDeleteForAll) {
      alertButtons.push({
        text: 'الحذف لدى الجميع',
        style: 'destructive',
        onPress: async () => {
          // استدعاء الدالة الجديدة التي أنشأناها
          const { error } = await supabase.rpc('delete_messages_for_all', {
            p_message_ids: selectedMessages,
          });

          if (error) {
            Alert.alert('خطأ', 'فشل حذف الرسائل لدى الجميع.');
            console.error('Error deleting for all:', error);
          } else {
            // الحذف من الواجهة يجب أن يتم عبر Realtime، لكن سنقوم به يدوياً كحل احتياطي
            setMessages(current => current.filter(msg => !selectedMessages.includes(msg.id)));
          }
          handleCancelSelection();
        },
      });
    }

    // إضافة خيار "الحذف لدي" دائماً
    alertButtons.push({
      text: 'الحذف لدي',
      style: 'destructive',
      onPress: async () => {
        console.log(`--- [DEBUG] Hiding messages for userId: ${userId}`);
        
        // [إصلاح] استدعاء الدالة الصحيحة التي تخفي الرسائل للمستخدم الحالي فقط
        // هذه الدالة تقوم بإضافة سجل في جدول `hidden_messages` ولا تحذف الرسالة الأساسية
        const { error } = await supabase.rpc('hide_messages_for_user', {
          p_message_ids: selectedMessages,
        });
        if (error) {
          Alert.alert('خطأ', 'فشل حذف الرسائل.');
          console.error('Error hiding messages:', error);
        } else {
          // تحديث الواجهة فورياً. سيقوم Realtime أيضاً بتأكيد هذا الحذف لاحقاً
          setMessages(current => current.filter(msg => !selectedMessages.includes(msg.id)));
        }
        handleCancelSelection();
      },
    });

    // إضافة زر الإلغاء
    alertButtons.push({ text: 'إلغاء', style: 'cancel', onPress: handleCancelSelection });

    Alert.alert('تأكيد الحذف', 'كيف تريد حذف هذه الرسائل؟', alertButtons);
  }, [messages, selectedMessages, userId, setMessages, handleCancelSelection]);

  const handleForwardMessages = useCallback(() => {
    navigation.navigate('UserList', { selectedMessages });
    handleCancelSelection();
  }, [navigation, selectedMessages, handleCancelSelection]);

  return {
    selectedMessages, isSelectionMode, canCopy,
    handleLongPressMessage, handlePressMessage, handleCancelSelection,
    handleCopyMessages, handleDeleteMessages, handleForwardMessages,
  };
};