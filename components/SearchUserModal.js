import React, { useState } from 'react';
import { View, Text, TextInput, TouchableOpacity, StyleSheet, Modal } from 'react-native';

export default function SearchUserModal({ visible, onClose }) {
  const [query, setQuery] = useState('');

  return (
    <Modal visible={visible} transparent animationType="fade">
      <View style={styles.overlay}>
        <View style={styles.modalBox}>
          <Text style={styles.title}>بحث عن مستخدم</Text>
          <TextInput
            style={styles.input}
            placeholder="البريد الإلكتروني أو اسم المستخدم."
            value={query}
            onChangeText={setQuery}
            textAlign="right"
          />
          <TouchableOpacity style={styles.searchBtn}>
            <Text style={styles.searchText}>بحث</Text>
          </TouchableOpacity>
          <TouchableOpacity style={styles.searchBtn}>
            <Text style={styles.searchText}>بواسطة QR من الاستوديو</Text>
          </TouchableOpacity>
          <TouchableOpacity style={styles.searchBtn}>
            <Text style={styles.searchText}>افتح كاميرا لقراءة QR</Text>
          </TouchableOpacity>
          <View style={styles.row}>
            <TouchableOpacity style={styles.okBtn}>
              <Text style={styles.okText}>موافق</Text>
            </TouchableOpacity>
            <TouchableOpacity style={styles.cancelBtn} onPress={onClose}>
              <Text style={styles.cancelText}>إلغاء</Text>
            </TouchableOpacity>
          </View>
        </View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  overlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.14)', justifyContent: 'center', alignItems: 'center' },
  modalBox: { backgroundColor: '#fff', borderRadius: 16, padding: 18, width: '86%', elevation: 6 },
  title: { fontSize: 22, fontWeight: 'bold', color: '#222', textAlign: 'center', marginBottom: 12, fontFamily: 'Cairo' },
  input: { backgroundColor: '#f8f8f8', borderRadius: 12, paddingHorizontal: 14, fontSize: 15, marginBottom: 8, borderWidth: 1, borderColor: '#eee' },
  searchBtn: { backgroundColor: '#388e3c', borderRadius: 8, paddingVertical: 11, marginHorizontal: 4, marginBottom: 8, alignItems: 'center' },
  searchText: { color: '#fff', fontSize: 16, fontWeight: '600' },
  row: { flexDirection: 'row-reverse', justifyContent: 'space-between', marginTop: 8 },
  okBtn: { backgroundColor: '#388e3c', borderRadius: 8, paddingVertical: 8, paddingHorizontal: 22, marginRight: 4 },
  okText: { color: '#fff', fontSize: 16, fontWeight: '600' },
  cancelBtn: { backgroundColor: '#eee', borderRadius: 8, paddingVertical: 8, paddingHorizontal: 22, marginLeft: 4 },
  cancelText: { color: '#222', fontSize: 16, fontWeight: '600' },
});