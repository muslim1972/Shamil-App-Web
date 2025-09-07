import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';
import Icon from 'react-native-vector-icons/MaterialCommunityIcons';

const menuItems = [
  { icon: 'school', label: 'ألعاب تعليمية' },
  { icon: 'book-outline', label: 'دراستي' },
  { icon: 'palette', label: 'ثيمات' },
  { icon: 'account-group', label: 'محادثة جماعية' },
  { icon: 'cart-outline', label: 'تسوق' },
  { icon: 'camera-outline', label: 'سكاي جرام (skygram)' },
  { icon: 'exit-to-app', label: 'تسجيل خروج' },
];

export default function CustomDrawer({ onSelect }) {
  return (
    <View style={styles.drawer}>
      {menuItems.map((item, idx) => (
        <TouchableOpacity
          key={idx}
          style={styles.menuItem}
          activeOpacity={0.7}
          onPress={() => onSelect(item.label)}
        >
          <Icon name={item.icon} size={28} color="#388e3c" style={styles.icon} />
          <Text style={styles.label}>{item.label}</Text>
        </TouchableOpacity>
      ))}
    </View>
  );
}

const styles = StyleSheet.create({
  drawer: {
    backgroundColor: '#fff',
    borderRadius: 16,
    paddingVertical: 10,
    elevation: 10,
    shadowColor: '#222',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.14,
    shadowRadius: 10,
    margin: 20,
  },
  menuItem: {
    flexDirection: 'row-reverse',
    alignItems: 'center',
    paddingVertical: 14,
    paddingHorizontal: 18,
    borderBottomWidth: 0.7,
    borderBottomColor: '#eee',
  },
  icon: {
    marginLeft: 14,
  },
  label: {
    fontSize: 18,
    color: '#222',
    fontWeight: '500',
    fontFamily: 'Cairo',
  },
});