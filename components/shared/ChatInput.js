import React from 'react';
import { View, TextInput, TouchableOpacity, StyleSheet, Platform, ActivityIndicator } from 'react-native';
import { MaterialIcons } from '@expo/vector-icons';

const ChatInput = ({ 
  newMessage, 
  setNewMessage, 
  handleSend, 
  pickImage, 
  isSending, 
  isUploading 
}) => (
  <View style={styles.inputContainer}>
    <TouchableOpacity onPress={pickImage} style={styles.iconButton} disabled={isUploading}>
      {isUploading ? (
        <ActivityIndicator size="small" color="#075E54" />
      ) : (
        <MaterialIcons name="attach-file" size={24} color="#555" />
      )}
    </TouchableOpacity>

    <TextInput
      style={styles.input}
      value={newMessage}
      onChangeText={setNewMessage}
      placeholder="اكتب رسالة..."
      multiline
    />
    <TouchableOpacity 
      onPress={handleSend} 
      style={styles.sendButton} 
      disabled={isSending || newMessage.trim().length === 0}
    >
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
    paddingVertical: Platform.OS === 'ios' ? 10 : 8,
    maxHeight: 100,
    marginHorizontal: 8,
    fontSize: 16,
    textAlign: 'right',
  },
  iconButton: {
    padding: 5,
  },
  sendButton: {
    backgroundColor: '#25D366',
    borderRadius: 25,
    width: 50,
    height: 50,
    justifyContent: 'center',
    alignItems: 'center',
  },
});

export default ChatInput;