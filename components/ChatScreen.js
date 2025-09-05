import React, { useState, useEffect, useCallback, useRef } from 'react';
import {
  View,
  FlatList,
  StyleSheet,
  Alert,
  ActivityIndicator,
  KeyboardAvoidingView,
  Platform,
  Text,
  BackHandler,
} from 'react-native';
import { useRoute, useFocusEffect, useNavigation } from '@react-navigation/native';
import { supabase } from '../lib/supabase';
import { useAuth } from '../context/AuthContext';
import { Audio } from 'expo-av';
// Import the new hooks and components
import { useMessages } from './hooks/useMessages';
import { useMessageSelection } from './hooks/useMessageSelection';
import MessageBubble from './MessageBubble';
import ChatHeader from './ChatHeader';
import { SelectionHeader } from './shared/SelectionHeader';
import ChatInput from './ChatInput';
import ImageViewer from './shared/ImageViewer';
import RecordingHeader from './shared/RecordingHeader';

export default function ChatScreen() {
  const { user } = useAuth();
  const route = useRoute();
  const navigation = useNavigation();
  const { conversationId } = route.params;
  const [conversationDetails, setConversationDetails] = useState(null);
  const [viewingImage, setViewingImage] = useState(null);
  const [newMessageText, setNewMessageText] = useState('');
  const flatListRef = useRef(null);

  // --- حالات لتسجيل الصوت ---
  const [isRecording, setIsRecording] = useState(false);
  const [recording, setRecording] = useState(null);
  const [recordingDuration, setRecordingDuration] = useState(0);
  const [isSendingAudio, setIsSendingAudio] = useState(false);

  // --- Use our custom hooks ---
  const {
    messages,
    setMessages,
    isLoading,
    isSending,
    isUploading,
    handleSendText,
    pickAndSendMedia,
    sendAudioMessage,
  } = useMessages(conversationId);

  const {
    selectedMessages,
    isSelectionMode,
    canCopy,
    handleLongPressMessage,
    handlePressMessage,
    handleCancelSelection,
    handleCopyMessages,
    handleDeleteMessages,
    handleForwardMessages,
  } = useMessageSelection(messages, setMessages, user?.id);

  // --- Fetch conversation details ---
  const fetchConversationDetails = useCallback(async () => {
    if (!conversationId || !user) return;
    const { data: convData, error: convError } = await supabase
      .from('conversations')
      .select('id, created_at, updated_at, participants')
      .eq('id', conversationId)
      .single();

    if (convError) {
      console.error('Error fetching conversation details:', convError);
      Alert.alert('خطأ', 'لم نتمكن من جلب تفاصيل المحادثة.');
      return;
    }

    if (convData && convData.participants) {
      const otherUserId = convData.participants.find(id => id !== user.id);
      if (otherUserId) {
        const { data: userData, error: userError } = await supabase
          .from('users')
          .select('id, username, email')
          .eq('id', otherUserId)
          .single();

        if (userError) {
          console.error('Error fetching other user details:', userError);
        } else if (userData) {
          setConversationDetails({
            id: convData.id,
            name: userData.username,
            email: userData.email,
            created_at: convData.created_at,
            updated_at: convData.updated_at
          });
        }
      } else {
        setConversationDetails({
            id: convData.id,
            name: 'محادثة جماعية',
            email: '',
            created_at: convData.created_at,
            updated_at: convData.updated_at
        });
      }
    }
  }, [conversationId, user]);

  useEffect(() => {
    fetchConversationDetails();
  }, [fetchConversationDetails]);

  // --- [الحل الرصين] دالة التمرير للأسفل ---
  const scrollToBottom = useCallback(() => {
    // استخدام setTimeout كـ microtask يضمن أن التمرير يحدث بعد اكتمال دورة العرض (Render Pass)
    // هذا ليس تخمينًا للوقت، بل هو أسلوب معياري في React لضمان تنفيذ الإجراء بعد التحديث.
    setTimeout(() => flatListRef.current?.scrollToEnd({ animated: true }), 50);
  }, []);

  // --- Handle back button press ---
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

  const onSend = () => {
    handleSendText(newMessageText, scrollToBottom); // [تعديل] تمرير دالة التمرير
    setNewMessageText('');
  };

  // --- دوال التعامل مع تسجيل الصوت ---
  const handleStartRecording = async () => {
    try {
      const { status } = await Audio.requestPermissionsAsync();
      if (status !== 'granted') {
        Alert.alert('عذراً', 'نحتاج إلى إذن الوصول إلى الميكروفون لتسجيل الصوت.');
        return;
      }
      await Audio.setAudioModeAsync({ allowsRecordingIOS: true, playsInSilentModeIOS: true });
      const { recording: newRecording } = await Audio.Recording.createAsync(
         Audio.RecordingOptionsPresets.HIGH_QUALITY
      );
      setRecording(newRecording);
      setIsRecording(true);
      newRecording.setOnRecordingStatusUpdate(status => {
        if (status.isRecording) {
          setRecordingDuration(status.durationMillis);
        }
      });
    } catch (err) {
      console.error('Failed to start recording', err);
      Alert.alert('خطأ', 'فشل بدء التسجيل.');
      setIsRecording(false);
    }
  };

  const handleCancelRecording = async () => {
    if (!recording || isSendingAudio) return;
    setIsSendingAudio(true);
    setIsRecording(false);
    setRecordingDuration(0);
    await recording.stopAndUnloadAsync();
    setRecording(null);
  };

  const handleSendRecording = async () => {
    if (!recording) return;
    const caption = newMessageText;
    setNewMessageText('');
    setIsRecording(false);
    setRecording(null);
    try {
      await recording.stopAndUnloadAsync();
      const uri = recording.getURI();
      await sendAudioMessage(uri, recordingDuration, caption, scrollToBottom); // [تعديل] تمرير دالة التمرير
      setRecordingDuration(0);
    } catch (error) {
      console.error('Error sending audio:', error);
      Alert.alert('خطأ', 'فشل إرسال المقطع الصوتي.');
    } finally {
      setIsSendingAudio(false);
    }
  };

  const renderItem = useCallback(({ item }) => (
      <MessageBubble
        item={item}
        user={user}
        isGroupChat={conversationDetails?.is_group || false}
        isSelected={selectedMessages.includes(item.id)}
        isSelectionMode={isSelectionMode}
        onPress={handlePressMessage}
        onLongPress={handleLongPressMessage}
        onPressImage={setViewingImage}
        onImageLoad={scrollToBottom} // [تعديل] تمرير دالة التمرير لفقاعة الرسالة
      />
    ),
    [user, conversationDetails, selectedMessages, isSelectionMode, handlePressMessage, handleLongPressMessage, scrollToBottom]
  );

  if (isLoading) {
    return <ActivityIndicator style={styles.centered} size="large" color="#25D366" />;
  }

  return (
    <KeyboardAvoidingView
      style={styles.container}
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
      keyboardVerticalOffset={Platform.OS === 'ios' ? 90 : 0}
    >
      {isSelectionMode ? (
        <SelectionHeader
          selectedCount={selectedMessages.length}
          canCopy={canCopy}
          onCancel={handleCancelSelection}
          onDelete={handleDeleteMessages}
          onCopy={handleCopyMessages}
          onForward={handleForwardMessages}
        />
      ) : isRecording ? (
        <RecordingHeader
          duration={recordingDuration}
          onCancel={handleCancelRecording}
          onSend={handleSendRecording}
        />
      ) : (
        <ChatHeader conversationDetails={conversationDetails} onStartRecording={handleStartRecording} />
      )}
      <FlatList
        ref={flatListRef}
        data={messages}
        renderItem={renderItem}
        keyExtractor={(item) => item.id.toString()}
        style={styles.messageList}
        contentContainerStyle={styles.messageListContent}
        // [تعديل] التمرير عند تغيير حجم المحتوى (للرسائل النصية والتحميل الأولي)
        onContentSizeChange={scrollToBottom} 
        ListEmptyComponent={() => (
          <View style={styles.emptyContainer}>
            <Text style={styles.emptyText}>لا توجد رسائل. ابدأ المحادثة!</Text>
          </View>
        )}
      />
      {!isSelectionMode && (
        <ChatInput
          newMessage={newMessageText}
          setNewMessage={setNewMessageText}
          handleSendMessage={onSend}
          onPickMedia={(mediaType) => pickAndSendMedia(mediaType, scrollToBottom)} // [تعديل] تمرير دالة التمرير
          isSending={isSending || isSendingAudio}
          isUploading={isUploading}
          isRecordingAudio={isRecording} 
        />
      )}
      <ImageViewer
        imageUrl={viewingImage}
        onClose={() => setViewingImage(null)}
      />
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#ECE5DD',
  },
  centered: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  messageList: {
    flex: 1,
  },
  messageListContent: {
    flexGrow: 1,
    paddingHorizontal: 10,
    paddingTop: 10,
    paddingBottom: 10,
  },
  emptyContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  emptyText: {
    fontSize: 16,
    color: 'grey',
  },
});
