import React from 'react';
import { View, TextInput, TouchableOpacity, StyleSheet, Platform, ActivityIndicator } from 'react-native';
import { MaterialIcons } from '@expo/vector-icons';
const ChatInput = ({
  newMessage,
  setNewMessage,
  handleSendMessage,
  onPickMedia,
  onStartRecording,
  isSending,
  isUploading,
  isRecordingAudio
}) => {
  // --- [تحسين] منطق واضح ومحدد لحالة الزر والنص المؤقت ---

  // 1. تحديد حالة زر الإرسال
  const isSendDisabled = (() => {
    // إذا كان التطبيق يسجل صوتاً، يجب تعطيل زر الإرسال دائماً وبشكل مطلق
    if (isRecordingAudio) {
      return true;
    }
    // في الوضع العادي، يتم تعطيله إذا كان فارغاً أو قيد الإرسال
    return isSending || newMessage.trim().length === 0;
  })();

  // 2. تحديد النص المؤقت المناسب حسب الحالة
  const placeholderText = isRecordingAudio ? "اكتب تعليقاً للمقطع الصوتي..." : "اكتب رسالتك...";
  // [جديد] 3. تحديد حالة زر الإرفاق
  const isAttachmentDisabled = isUploading || isRecordingAudio;
  // [جديد] 4. تحديد حالة زر التسجيل
  const isRecordingDisabled = isUploading || isRecordingAudio || newMessage.trim().length > 0;
  // [جديد] 5. تحديد ما إذا كان يجب إظهار زر الإرسال بدلاً من زر التسجيل
  const showSendButton = newMessage.trim().length > 0 || isSending;
  return (
    <View style={styles.inputContainer}>
      <TouchableOpacity
        onPress={onPickMedia}
        style={styles.iconButton}
        disabled={isAttachmentDisabled}
      >
        {isUploading ? (
          <ActivityIndicator size="small" color="#128C7E" />
        ) : (
          <MaterialIcons
            name="attachment" size={24}
            color={isAttachmentDisabled ? '#BDBDBD' : '#555'} // لون رمادي باهت عند التعطيل
            style={{ transform: [{ rotate: '45deg' }] }} />
        )}
      </TouchableOpacity>
      <TextInput
        style={styles.input}
        value={newMessage}
        onChangeText={setNewMessage}
        placeholder={placeholderText}
        multiline
        editable={!isRecordingAudio}
        autoFocus={!isRecordingAudio}
      />
      {showSendButton ? (
        <TouchableOpacity
          onPress={handleSendMessage}
          style={[styles.sendButton, isSendDisabled && styles.disabledButton]}
          disabled={isSendDisabled}
        >
          <MaterialIcons name="send" size={24} color="white" />
        </TouchableOpacity>
      ) : (
        <TouchableOpacity
          onPress={onStartRecording}
          style={[styles.sendButton, isRecordingDisabled && styles.disabledButton]}
          disabled={isRecordingDisabled}
        >
          <MaterialIcons name="mic" size={24} color="white" />
        </TouchableOpacity>
      )}
    </View>
  );
};
const styles = StyleSheet.create({
  inputContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 8,
    backgroundColor: '#F0F0F0',
    borderTopWidth: 1,
    borderTopColor: '#DDD',
  },
  input: {
    flex: 1,
    backgroundColor: 'white',
    borderRadius: 20,
    paddingHorizontal: 15,
    paddingVertical: Platform.OS === 'ios' ? 10 : 5,
    maxHeight: 100,
    marginHorizontal: 8,
    fontSize: 16,
    textAlign: 'right',
  },
  iconButton: {
    padding: 5,
  },
  sendButton: {
    backgroundColor: '#128C7E',
    borderRadius: 25,
    width: 50,
    height: 50,
    justifyContent: 'center',
    alignItems: 'center',
  },
  disabledButton: {
    backgroundColor: '#99D9D1', // لون باهت لزر الإرسال المعطل
  },
});
export default ChatInput;