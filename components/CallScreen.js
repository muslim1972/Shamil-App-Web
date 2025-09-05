import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';

export default function CallScreen({ onHangup }) {
  return (
    <View style={styles.container}>
      <View style={styles.callInfo}>
        <Text style={styles.username}>اسم المستخدم</Text>
        <Text style={styles.callStatus}>جاري الاتصال...</Text>
      </View>

      <View style={styles.controls}>
        <TouchableOpacity style={[styles.controlButton, styles.hangupButton]} onPress={onHangup}>
          <Text style={styles.controlText}>إنهاء</Text>
        </TouchableOpacity>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#2c3e50',
    justifyContent: 'space-between',
    paddingBottom: 50,
    paddingTop: 100,
  },
  callInfo: {
    alignItems: 'center',
  },
  username: {
    fontSize: 28,
    color: 'white',
    fontWeight: 'bold',
    marginBottom: 10,
  },
  callStatus: {
    fontSize: 18,
    color: '#bdc3c7',
  },
  controls: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
  },
  controlButton: {
    width: 70,
    height: 70,
    borderRadius: 35,
    justifyContent: 'center',
    alignItems: 'center',
    marginHorizontal: 20,
  },
  hangupButton: {
    backgroundColor: '#e74c3c',
  },
  controlText: {
    color: 'white',
    fontSize: 16,
  },
});