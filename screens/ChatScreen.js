import React, { useState } from 'react';
import { View, Text, TextInput, Button, FlatList, StyleSheet } from 'react-native';

export default function ChatScreen({ route }) {
  const { user } = route.params;
  const [messages, setMessages] = useState([
    { id: '1', text: 'مرحبا!', sender: user.name },
    { id: '2', text: 'أهلاً بك!', sender: 'أنا' },
  ]);
  const [input, setInput] = useState('');

  const sendMessage = () => {
    if (!input.trim()) return;
    setMessages([...messages, { id: Date.now().toString(), text: input, sender: 'أنا' }]);
    setInput('');
  };

  return (
    <View style={styles.container}>
      <Text style={styles.header}>الدردشة مع {user.name}</Text>
      <FlatList
        data={messages}
        keyExtractor={item => item.id}
        renderItem={({ item }) => (
          <View style={[styles.message, item.sender === 'أنا' ? styles.myMsg : styles.otherMsg]}>
            <Text>{item.text}</Text>
          </View>
        )}
      />
      <View style={styles.inputRow}>
        <TextInput
          style={styles.input}
          value={input}
          onChangeText={setInput}
          placeholder="اكتب رسالة..."
        />
        <Button title="إرسال" onPress={sendMessage} />
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, padding: 8, backgroundColor: '#fff' },
  header: { fontSize: 20, marginBottom: 10, color: '#388e3c' },
  message: { padding: 12, borderRadius: 8, marginVertical: 4, maxWidth: '70%' },
  myMsg: { alignSelf: 'flex-end', backgroundColor: '#c8e6c9' },
  otherMsg: { alignSelf: 'flex-start', backgroundColor: '#eee' },
  inputRow: { flexDirection: 'row', alignItems: 'center', marginTop: 8 },
  input: { flex: 1, borderWidth: 1, borderRadius: 8, padding: 8, marginRight: 8 }
});