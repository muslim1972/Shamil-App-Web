import React, { useState } from 'react';
import { View, Text, TextInput, TouchableOpacity, Modal, StyleSheet, Alert } from 'react-native';
import { MaterialIcons } from '@expo/vector-icons';

const SearchDialog = ({ visible, onClose, onSearch, onGenerateQR, onOpenCamera }) => {
  const [searchText, setSearchText] = useState('');

  const handleSearch = () => {
    if (!searchText.trim()) {
      Alert.alert('تنبيه', 'الرجاء إدخال بريد إلكتروني أو اسم مستخدم');
      return;
    }
    onSearch(searchText);
    setSearchText('');
  };

  return (
    <Modal
      animationType="slide"
      transparent={true}
      visible={visible}
      onRequestClose={onClose}
    >
      <TouchableOpacity
        style={styles.modalContainer}
        activeOpacity={1}
        onPressOut={onClose}
      >
        <TouchableOpacity
          style={styles.modalContent}
          activeOpacity={1}
          onPress={(e) => e.stopPropagation()}
        >
          <View style={styles.header}>
            <Text style={styles.title}>بحث عن مستخدم</Text>
            <TouchableOpacity onPress={onClose} style={styles.closeButton}>
              <MaterialIcons name="close" size={24} color="white" />
            </TouchableOpacity>
          </View>

          <View style={styles.inputContainer}>
            <TextInput
              style={styles.input}
              placeholder="البريد الإلكتروني أو اسم المستخدم"
              placeholderTextColor="#888"
              value={searchText}
              onChangeText={setSearchText}
              autoCapitalize="none"
              keyboardType="email-address"
            />
          </View>

          <TouchableOpacity style={styles.button} onPress={handleSearch}>
            <Text style={styles.buttonText}>بحث</Text>
          </TouchableOpacity>

          <TouchableOpacity style={styles.button} onPress={onGenerateQR}>
            <Text style={styles.buttonText}>بواسطة QR من الاستوديو</Text>
          </TouchableOpacity>

          <TouchableOpacity style={styles.button} onPress={onOpenCamera}>
            <Text style={styles.buttonText}>افتح كاميرا لقراءة QR</Text>
          </TouchableOpacity>

          <View style={styles.footerButtons}>
            <TouchableOpacity style={[styles.footerButton, styles.cancelButton]} onPress={onClose}>
              <Text style={styles.footerButtonText}>إلغاء</Text>
            </TouchableOpacity>
            <TouchableOpacity style={[styles.footerButton, styles.okButton]} onPress={handleSearch}>
              <Text style={styles.footerButtonText}>موافق</Text>
            </TouchableOpacity>
          </View>
        </TouchableOpacity>
      </TouchableOpacity>
    </Modal>
  );
};

const styles = StyleSheet.create({
  modalContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
  },
  modalContent: {
    width: '90%',
    backgroundColor: 'white',
    borderRadius: 10,
    padding: 20,
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.25,
    shadowRadius: 3.84,
    elevation: 5,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 20,
    paddingBottom: 10,
    borderBottomWidth: 1,
    borderBottomColor: '#eee',
  },
  title: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#333',
  },
  closeButton: {
    padding: 5,
  },
  inputContainer: {
    marginBottom: 15,
  },
  input: {
    height: 50,
    borderWidth: 1,
    borderColor: '#ddd',
    borderRadius: 8,
    paddingHorizontal: 15,
    fontSize: 16,
    color: '#333',
    backgroundColor: '#f9f9f9',
  },
  button: {
    height: 50,
    backgroundColor: '#25D366',
    borderRadius: 8,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 10,
  },
  buttonText: {
    color: 'white',
    fontSize: 16,
    fontWeight: 'bold',
  },
  footerButtons: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginTop: 10,
  },
  footerButton: {
    flex: 1,
    height: 45,
    borderRadius: 8,
    justifyContent: 'center',
    alignItems: 'center',
    marginHorizontal: 5,
  },
  cancelButton: {
    backgroundColor: '#f0f0f0',
  },
  okButton: {
    backgroundColor: '#25D366',
  },
  footerButtonText: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#333',
  },
  okButtonText: {
    color: 'white',
  },
});

export default SearchDialog;
