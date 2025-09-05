import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';
import Modal from 'react-native-modal';

const ActionMenu = ({ visible, title, message, actions, onRequestClose }) => {
  return (
    <Modal
      isVisible={visible}
      onBackdropPress={onRequestClose}
      onBackButtonPress={onRequestClose}
      style={styles.modal}
    >
      <View style={styles.modalContent}>
        <Text style={styles.title}>{title}</Text>
        {message && <Text style={styles.message}>{message}</Text>}
        {actions.map((action, index) => (
          <TouchableOpacity
            key={index}
            style={[
              styles.actionButton,
              action.style === 'destructive' && styles.destructiveButton,
            ]}
            onPress={() => {
              onRequestClose();
              action.onPress();
            }}
          >
            <Text style={styles.actionText}>{action.text}</Text>
          </TouchableOpacity>
        ))}
        <TouchableOpacity style={styles.cancelButton} onPress={onRequestClose}>
          <Text style={styles.cancelText}>إلغاء</Text>
        </TouchableOpacity>
      </View>
    </Modal>
  );
};

const styles = StyleSheet.create({
  modal: {
    justifyContent: 'flex-end',
    margin: 0,
  },
  modalContent: {
    backgroundColor: 'white',
    padding: 20,
    borderTopLeftRadius: 10,
    borderTopRightRadius: 10,
    alignItems: 'center',
  },
  title: {
    fontSize: 18,
    fontWeight: 'bold',
    marginBottom: 10,
  },
  message: {
    fontSize: 16,
    marginBottom: 20,
    textAlign: 'center',
  },
  actionButton: {
    padding: 10,
    width: '100%',
    alignItems: 'center',
  },
  actionText: {
    fontSize: 16,
    color: '#25D366',
  },
  destructiveButton: {
    // يمكنك إضافة تصميم خاص بالأزرار المدمرة هنا إذا أردت
  },
  cancelButton: {},
  cancelText: {
    fontSize: 16,
    color: 'grey',
  },
});

export default ActionMenu;

