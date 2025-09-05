import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';

export const UserItem = ({ user, onPress }) => {
  const displayName = user.display_name || user.username || 'مستخدم غير معروف';
  const avatarLetter = displayName.charAt(0).toUpperCase();
  
  return (
    <TouchableOpacity style={styles.userItem} onPress={() => onPress(user)}>
      <View style={styles.avatar}>
        <Text style={styles.avatarText}>{avatarLetter}</Text>
      </View>
      <View style={styles.userInfo}>
        <Text style={styles.username}>{displayName}</Text>
        {user.email && <Text style={styles.userEmail}>{user.email}</Text>}
      </View>
    </TouchableOpacity>
  );
};

const styles = StyleSheet.create({
  userItem: {
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
    backgroundColor: '#25D366',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 15,
  },
  avatarText: { 
    fontSize: 20, 
    color: 'white', 
    fontWeight: 'bold' 
  },
  userInfo: {
    flex: 1,
  },
  username: { 
    fontSize: 16, 
    fontWeight: 'bold', 
    color: '#333' 
  },
  userEmail: { 
    fontSize: 14, 
    color: '#666', 
    marginTop: 2 
  },
});

export default UserItem;