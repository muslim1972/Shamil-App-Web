import React from 'react';
import { View, TextInput, TouchableOpacity, StyleSheet, Platform } from 'react-native';
import { MaterialIcons } from '@expo/vector-icons';

const ChatInput = ({ newMessage, setNewMessage, handleSendMessage, onPickMedia, isSending, isUploading, isRecordingAudio }) => (
  <View style={styles.inputContainer}>
    <TouchableOpacity onPress={onPickMedia} style={styles.iconButton}>
      <MaterialIcons name="attachment" size={24} color="#555" style={{ transform: [{ rotate: '45deg' }] }} />
    </TouchableOpacity>
    <TextInput
      style={styles.input}
      value={newMessage}
      onChangeText={setNewMessage}
      placeholder="اكتب رسالتك..."
      multiline
    />
    <TouchableOpacity onPress={handleSendMessage} style={styles.sendButton} disabled={!newMessage.trim() || isSending || isUploading || isRecordingAudio}>
      <MaterialIcons name="send" size={24} color="white" />
    </TouchableOpacity>
  </View>
);

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
});

export default ChatInput;
