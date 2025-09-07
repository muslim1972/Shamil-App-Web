import React, { useState } from 'react';
import { View, Text, TextInput, TouchableOpacity, StyleSheet, Image } from 'react-native';

export default function RegisterScreen({ navigation }) {
  const [email, setEmail] = useState('');
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');

  return (
    <View style={styles.container}>
      <Image source={require('../assets/logo.png')} style={styles.logo} />
      <Text style={styles.title}>Shamil App</Text>
      <Text style={styles.subtitle}>إنشاء حساب جديد</Text>
      <TextInput
        style={styles.input}
        placeholder="البريد الإلكتروني"
        value={email}
        onChangeText={setEmail}
        keyboardType="email-address"
        textAlign="right"
      />
      <TextInput
        style={styles.input}
        placeholder="اسم المستخدم"
        value={username}
        onChangeText={setUsername}
        textAlign="right"
      />
      <TextInput
        style={styles.input}
        placeholder="كلمة المرور"
        value={password}
        onChangeText={setPassword}
        secureTextEntry
        textAlign="right"
      />
      <TouchableOpacity style={styles.button}>
        <Text style={styles.buttonText}>إنشاء حساب</Text>
      </TouchableOpacity>
      <TouchableOpacity onPress={() => navigation.navigate('Login')}>
        <Text style={styles.link}>لدي حساب؟ تسجيل الدخول</Text>
      </TouchableOpacity>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: '#f9f9f9' },
  logo: { width: 100, height: 100, marginBottom: 18 },
  title: { fontSize: 32, fontWeight: 'bold', color: '#388e3c', fontFamily: 'Cairo' },
  subtitle: { fontSize: 18, color: '#444', marginBottom: 12, fontFamily: 'Cairo' },
  input: { width: '80%', height: 50, backgroundColor: '#fff', borderRadius: 12, marginVertical: 6, paddingHorizontal: 18, fontSize: 17, borderWidth: 1, borderColor: '#e3e3e3' },
  button: { width: '80%', backgroundColor: '#81c784', borderRadius: 14, paddingVertical: 14, marginTop: 12, alignItems: 'center', elevation: 2 },
  buttonText: { color: '#fff', fontSize: 20, fontWeight: 'bold', letterSpacing: 1 },
  link: { color: '#388e3c', fontSize: 16, marginTop: 18, fontFamily: 'Cairo' },
});
