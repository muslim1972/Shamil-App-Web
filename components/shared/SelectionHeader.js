import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet, Platform } from 'react-native';
import { MaterialIcons } from '@expo/vector-icons';

// هذا المكون مسؤول عن عرض رأس الصفحة في وضع التأشير
export const SelectionHeader = ({ selectedCount, onCancel, onDelete, onCopy, onForward, canCopy }) => {
  return (
      <View style={styles.header}>
        <TouchableOpacity onPress={onCancel} style={styles.button}>
          <MaterialIcons name="close" size={26} color="white" />
        </TouchableOpacity>
        <Text style={styles.title}>{selectedCount}</Text>
        <View style={styles.actionsContainer}>
          <TouchableOpacity onPress={onForward} style={styles.button}>
              <MaterialIcons name="reply" size={24} color="white" style={{ transform: [{ scaleX: -1 }] }} />
          </TouchableOpacity>
          {/* [إصلاح] إظهار زر النسخ فقط إذا كانت هناك رسائل نصية محددة */}
          {canCopy && (
            <TouchableOpacity onPress={onCopy} style={styles.button}>
                <MaterialIcons name="content-copy" size={24} color="white" />
            </TouchableOpacity>
          )}
          <TouchableOpacity onPress={onDelete} style={styles.button}>
              <MaterialIcons name="delete" size={24} color="white" />
          </TouchableOpacity>
        </View>
      </View>
  );
};

const styles = StyleSheet.create({
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: '#128C7E', // لون داكن متناسق
    paddingVertical: 10,
    paddingHorizontal: 10,
    paddingTop: Platform.OS === 'android' ? 40 : 50,
    paddingBottom: 15,
  },
  title: {
    color: 'white',
    fontSize: 20,
    fontWeight: 'bold',
  },
  actionsContainer: {
    flexDirection: 'row',
  },
  button: {
    padding: 10,
  },
});