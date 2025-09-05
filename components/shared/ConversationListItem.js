import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';

// هذا المكون مسؤول عن عرض عنصر واحد في قائمة المحادثات
// فصله في ملف خاص يجعل الكود أكثر نظافة وقابلية لإعادة الاستخدام
export const ConversationListItem = React.memo(({ item, onSelect, onLongPress }) => {
  // تصحيح: طباعة البيانات في وحدة التحكم
  

  // عرض الوقت بصيغة مناسبة
  const messageTime = item.updated_at
    ? new Date(item.updated_at).toLocaleTimeString('ar-IQ', {
        hour: '2-digit',
        minute: '2-digit',
      })
    : '';
    
  const otherUsername = item.other_username || 'محادثة';
  const lastMessage = item.last_message_content || 'آخر رسالة';

  return (
    <TouchableOpacity
      style={styles.conversationItem}
      onPress={() => onSelect(item)}
      onLongPress={() => onLongPress(item)}
    >
      <View style={styles.avatar}>
        <Text style={styles.avatarText}>
          {otherUsername.charAt(0).toUpperCase()}
        </Text>
      </View>
      <View style={styles.conversationDetails}>
        <Text style={styles.conversationName} numberOfLines={1}>{otherUsername}</Text>
        <Text style={styles.lastMessage} numberOfLines={1}>
          {lastMessage}
        </Text>
      </View>
      <Text style={styles.time}>{messageTime}</Text>
    </TouchableOpacity>
  );
});

const styles = StyleSheet.create({
    conversationItem: {
        flexDirection: 'row',
        padding: 15,
        borderBottomWidth: 1,
        borderBottomColor: '#f0f0f0',
        alignItems: 'center',
    },
    avatar: {
        width: 50,
        height: 50,
        borderRadius: 25,
        backgroundColor: '#e0e0e0',
        justifyContent: 'center',
        alignItems: 'center',
        marginRight: 15,
    },
    avatarText: {
        fontSize: 20,
        color: '#888',
    },
    conversationDetails: {
        flex: 1,
    },
    conversationName: {
        fontSize: 16,
        fontWeight: 'bold',
    },
    lastMessage: {
        color: 'grey',
    },
    time: {
        fontSize: 12,
        color: 'grey',
        marginLeft: 10,
    },
});