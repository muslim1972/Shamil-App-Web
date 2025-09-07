import React from 'react';
import { View, Text, FlatList, TouchableOpacity } from 'react-native';

const contacts = [
  { id: '1', name: 'أحمد' },
  { id: '2', name: 'سارة' },
  { id: '3', name: 'محمد' },
  // أضف المزيد من جهات الاتصال هنا
];

export default function ContactsScreen({ navigation }) {
  return (
    <View style={{ flex: 1, backgroundColor: '#fff' }}>
      <Text style={{ fontSize: 22, color: '#388e3c', margin: 16 }}>جهات الاتصال</Text>
      <FlatList
        data={contacts}
        keyExtractor={item => item.id}
        renderItem={({ item }) => (
          <TouchableOpacity
            style={{ padding: 16, borderBottomWidth: 1, borderColor: '#eee' }}
            onPress={() => navigation.navigate('Chat', { user: item })}
          >
            <Text style={{ fontSize: 18 }}>{item.name}</Text>
          </TouchableOpacity>
        )}
      />
    </View>
  );
}