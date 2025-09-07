import React, { useState } from 'react';
import { Modal, View, Text, TextInput, Button, FlatList, TouchableOpacity, StyleSheet } from 'react-native';

export default function SearchUserModal({ visible, onClose }) {
  const [query, setQuery] = useState('');
  const [results, setResults] = useState([]);
  // افترض نتائج وهمية هنا، يمكن ربطها بـ API لاحقاً
  const fakeUsers = [
    { id: '1', name: 'أحمد' },
    { id: '2', name: 'سارة' },
    { id: '3', name: 'محمد' }
  ];

  const handleSearch = () => {
    setResults(fakeUsers.filter(u => u.name.includes(query)));
  };

  return (
    <Modal visible={visible} animationType="slide" transparent>
      <View style={styles.overlay}>
        <View style={styles.box}>
          <Text style={styles.title}>بحث عن مستخدم</Text>
          <TextInput
            style={styles.input}
            placeholder="اكتب اسم المستخدم"
            value={query}
            onChangeText={setQuery}
          />
          <Button title="بحث" onPress={handleSearch} />
          <FlatList
            data={results}
            keyExtractor={item => item.id}
            renderItem={({ item }) => (
              <TouchableOpacity style={styles.result}>
                <Text>{item.name}</Text>
              </TouchableOpacity>
            )}
          />
          <Button title="إغلاق" onPress={onClose} />
        </View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  overlay: { flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: 'rgba(0,0,0,0.5)' },
  box: { width: '85%', backgroundColor: '#fff', padding: 20, borderRadius: 12 },
  title: { fontSize: 20, marginBottom: 10, color: '#388e3c' },
  input: { borderWidth: 1, borderRadius: 8, padding: 8, marginBottom: 10 },
  result: { padding: 10, borderBottomWidth: 1, borderColor: '#eee' }
});