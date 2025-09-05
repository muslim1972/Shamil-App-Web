import React from 'react';
import { View, Text, ActivityIndicator, StyleSheet } from 'react-native';
import Modal from 'react-native-modal';

// هذا المكون مسؤول فقط عن عرض شاشة "جاري المعالجة..."
export const ProcessingModal = ({ visible }) => (
  <Modal 
    isVisible={visible}
    transparent={true}
    animationIn="fadeIn"
    animationOut="fadeOut"
    backdropColor="black"
    backdropOpacity={0.5}
    // إضافة onBackdropPress لإغلاق المودل عند النقر خارجه
    onBackdropPress={() => {}} 
  >
    <View style={styles.modalBackground}>
      <View style={styles.modalContainer}>
        <ActivityIndicator size="large" color="#25D366" />
        <Text style={styles.modalText}>جاري المعالجة...</Text>
      </View>
    </View>
  </Modal>
);

const styles = StyleSheet.create({
  modalBackground: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center'
  },
  modalContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FFFFFF',
    borderRadius: 10,
    padding: 20,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
  },
  modalText: {
    marginLeft: 15, // تغيير المسافة لتكون أفقية
    color: '#333',
    fontSize: 16

  }
});