import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';
import { useNavigation } from '@react-navigation/native';

// هذا المكون مسؤول عن عرض صف "المحادثات المؤرشفة"
export const ArchivedRow = () => {
  const navigation = useNavigation();

  return (
    <TouchableOpacity
      style={styles.archivedRow}
      onPress={() => navigation.navigate('Archived')}
    >
      <View style={styles.archiveIconContainer}>
        <Text style={styles.archiveIcon}>🗄️</Text>
      </View>
      <Text style={styles.archivedText}>المحادثات المؤرشفة</Text>
    </TouchableOpacity>
  );
};

const styles = StyleSheet.create({
  archivedRow: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 15,
    backgroundColor: '#f7f7f7',
    borderBottomWidth: 1,
    borderBottomColor: '#e0e0e0',
  },
  archiveIconContainer: {
    width: 50,
    height: 50,
    borderRadius: 25,
    backgroundColor: '#e9e9e9',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 15,
  },
  archiveIcon: {
    fontSize: 24,
  },
  archivedText: {
    fontSize: 16,
    fontWeight: 'bold',
  },
});