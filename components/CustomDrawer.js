import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';

const options = [
  { label: 'جهات الاتصال' },
  { label: 'محادثة جماعية' },
  { label: 'بحث' },
  { label: 'تسجيل خروج' }
];

export default function CustomDrawer({ onSelect }) {
  return (
    <View style={styles.drawer}>
      {options.map(opt => (
        <TouchableOpacity key={opt.label} style={styles.option} onPress={() => onSelect(opt.label)}>
          <Text style={styles.text}>{opt.label}</Text>
        </TouchableOpacity>
      ))}
    </View>
  );
}

const styles = StyleSheet.create({
  drawer: {
    position: 'absolute',
    top: 0,
    left: 0,
    width: 220,
    height: '100%',
    backgroundColor: '#388e3c',
    paddingTop: 50,
    zIndex: 100
  },
  option: {
    padding: 20,
    borderBottomWidth: 1,
    borderColor: '#fff'
  },
  text: {
    color: '#fff',
    fontSize: 18
  }
});