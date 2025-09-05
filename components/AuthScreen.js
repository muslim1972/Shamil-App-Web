import React, { useState, useEffect } from 'react';
import { View, Text, TextInput, TouchableOpacity, StyleSheet, Alert, Modal, Image, ActivityIndicator, Clipboard } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { supabase } from '../lib/supabase';
import { useNavigation } from '@react-navigation/native';
import { enhancedSignIn, enhancedSignUp, checkInternetConnection } from '../network_fix';
import { signInWithAlternativeClient, signUpWithAlternativeClient, testSupabaseConnectivity } from '../alternative_network_fix';

export default function AuthScreen() {
  const navigation = useNavigation(); 
  const [isLogin, setIsLogin] = useState(true);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [username, setUsername] = useState(''); // إضافة حالة لاسم المستخدم
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    const clearAuthCache = async () => {
      try {
        // تسجيل الخروج أولاً لمسح الجلسة من عميل Supabase
        await supabase.auth.signOut();

        // الحصول على جميع المفاتيح من AsyncStorage
        const keys = await AsyncStorage.getAllKeys();
        
        // تصفية المفاتيح المتعلقة بـ Supabase
        const supabaseKeys = keys.filter(key => 
          key.startsWith('sb-') || key.includes('supabase')
        );
        
        // حذف المفاتيح المتعلقة بالمصادقة
        if (supabaseKeys.length > 0) {
          await AsyncStorage.multiRemove(supabaseKeys);
        }
      } catch (error) {
        // لا نعرض خطأ للمستخدم، لكن نسجله في الكونسول
        console.error('Failed to clear auth cache:', error);
      }
    };

    // استدعاء دالة التنظيف عند عرض الشاشة
    clearAuthCache();
  }, []);


  const validateEmail = (email) => {
    const re = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return re.test(String(email).toLowerCase());
  };

  // تحديث منطق تعطيل الزر ليشمل التحقق من اسم المستخدم عند التسجيل
  const isButtonDisabled = loading || !validateEmail(email) || password.length < 6 || (!isLogin && username.trim().length < 3); // اسم المستخدم 3 أحرف على الأقل

  const handleAuth = async () => {
    if (loading) return;
    if (!validateEmail(email)) {
      Alert.alert('خطأ', 'الرجاء إدخال بريد إلكتروني صالح.');
      return;
    }
    if (password.length < 6) {
      Alert.alert('خطأ', 'يجب أن تتكون كلمة المرور من 6 أحرف على الأقل.');
      return;
    }
    if (!isLogin && username.trim().length < 3) {
      Alert.alert('خطأ', 'يجب أن يتكون اسم المستخدم من 3 أحرف على الأقل.');
      return;
    }

    setLoading(true);

    // التحقق من الاتصال بالإنترنت أولاً
    const hasInternet = await checkInternetConnection();
    if (!hasInternet) {
      Alert.alert('خطأ في الاتصال', 'فشل الاتصال بالإنترنت. يرجى التحقق من اتصالك بالإنترنت والمحاولة مرة أخرى.');
      setLoading(false);
      return;
    }

    let response;

    if (isLogin) {
      response = await enhancedSignIn(email.trim(), password);
    } else {
      // إضافة اسم المستخدم إلى بيانات التسجيل
      response = await enhancedSignUp(
        email.trim(), 
        password, 
        { data: { username: username.trim() } }
      );
    }

    const { data, error } = response;
    if (error) {
      // تم معالجة الخطأ بالفعل في الدوال المحسّنة
      console.log('خطأ في المصادقة:', error.message);
    } else if (data.user) {
      setLoading(false);
      navigation.reset({ index: 0, routes: [{ name: 'ConversationList' }] });
      return;
    }
    setLoading(false);
  };

  return (
    <View style={styles.container}>
      {/* شاشة التحميل الجديدة التي تحتوي على الفيديو */}
      <Modal
        transparent={true}
        animationType="fade"
        visible={loading}
      >
        <View style={styles.loadingOverlay}>
           <ActivityIndicator size="large" color="#25D366" />
          <Text style={styles.loadingText}>جاري التحميل...</Text> 
        </View>
      </Modal>

      <Image source={require('../assets/icon.png')} style={styles.logo} />
      <Text style={styles.title}>تطبيق Call</Text>
      <Text style={styles.subtitle}>
        {isLogin ? 'تسجيل الدخول' : 'إنشاء حساب جديد'}
      </Text>

      <TextInput
        style={styles.input}
        editable={!loading}
        placeholder="البريد الإلكتروني"
        value={email}
        onChangeText={setEmail}
        keyboardType="email-address"
        autoCapitalize="none"
      />

      {/* حقل اسم المستخدم يظهر فقط عند إنشاء حساب جديد */}
      {!isLogin && (
        <TextInput
          style={styles.input}
          editable={!loading}
          placeholder="اسم المستخدم"
          value={username}
          onChangeText={setUsername}
          autoCapitalize="none"
        />
      )}

      <TextInput
        style={styles.input}
        editable={!loading}
        placeholder="كلمة المرور"
        value={password}
        onChangeText={setPassword}
        secureTextEntry={true} // لإخفاء كلمة المرور
      />

      <TouchableOpacity
        style={[styles.button, isButtonDisabled && styles.disabledButton]}
        onPress={handleAuth}
        disabled={isButtonDisabled}
      >
        <Text style={styles.buttonText}>
          {isLogin ? 'تسجيل الدخول' : 'إنشاء حساب'}
        </Text>
      </TouchableOpacity>

      <TouchableOpacity
        style={styles.linkButton}
        onPress={() => setIsLogin(!isLogin)}
        disabled={loading}
      >
        <Text style={styles.linkText}>
          {isLogin ? 'ليس لدي حساب . أنشئ حساباً جديداً' : 'لدي حساب . تسجيل الدخول'}
        </Text>
      </TouchableOpacity>

    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#FFFFFF',
    justifyContent: 'center',
    paddingHorizontal: 20,
  },
  loadingOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.7)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  loadingVideo: {
    width: 200,
    height: 200,
  },
  loadingText: {
    marginTop: 20,
    fontSize: 18,
    color: 'white',
    fontWeight: 'bold',
  },
  logo: {
    width: 100,
    height: 100,
    alignSelf: 'center',
    marginBottom: 30,
  },
  title: {
    fontSize: 32,
    fontWeight: 'bold',
    textAlign: 'center',
    marginBottom: 10,
    color: '#128C7E',
  },
  subtitle: {
    fontSize: 18,
    textAlign: 'center',
    marginBottom: 40,
    color: '#666',
  },
  input: {
    backgroundColor: '#F6F6F6',
    padding: 15,
    marginBottom: 15,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: '#E8E8E8',
    textAlign: 'right',
    fontSize: 16,
  },
  button: {
    backgroundColor: '#25D366',
    padding: 15,
    borderRadius: 10,
    marginBottom: 15,
    alignItems: 'center',
    elevation: 3,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.2,
    shadowRadius: 2,
  },
  disabledButton: {
    backgroundColor: '#A5D6A7',
  },
  buttonText: {
    color: 'white',
    textAlign: 'center',
    fontSize: 18,
    fontWeight: 'bold',
  },
  linkButton: {
    padding: 10,
  },
  linkText: {
    color: '#128C7E',
    textAlign: 'center',
    fontSize: 16,
  },
});