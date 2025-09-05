// ملف تنفيذي لإصلاح مشكلة المصادقة يدوياً

import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity, ScrollView, Alert } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { supabase, resetSupabaseClient } from './lib/supabase';
import { clearAuthCache, fixMissingAuthSession } from './auto_fix_auth';

/**
 * تنظيف جميع بيانات التخزين المؤقت
 */
const clearAllCache = async () => {
  try {
    await AsyncStorage.clear();
    Alert.alert('تم التنفيذ', 'تم تنظيف جميع بيانات التخزين المؤقت بنجاح');
    return true;
  } catch (error) {
    console.error('خطأ في تنظيف جميع البيانات:', error);
    Alert.alert('خطأ', 'حدث خطأ أثناء تنظيف البيانات');
    return false;
  }
};

/**
 * إعادة تعيين عميل Supabase وتسجيل الخروج
 */
const resetSupabaseAndSignOut = async () => {
  try {
    // إعادة تعيين عميل Supabase
    await resetSupabaseClient();
    
    // تسجيل الخروج
    await supabase.auth.signOut();
    
    Alert.alert('تم التنفيذ', 'تم إعادة تعيين عميل Supabase وتسجيل الخروج بنجاح');
    return true;
  } catch (error) {
    console.error('خطأ في إعادة تعيين عميل Supabase:', error);
    Alert.alert('خطأ', 'حدث خطأ أثناء إعادة تعيين عميل Supabase');
    return false;
  }
};

/**
 * الحصول على جميع مفاتيح التخزين المؤقت
 */
const getAllStorageKeys = async () => {
  try {
    const keys = await AsyncStorage.getAllKeys();
    return keys;
  } catch (error) {
    console.error('خطأ في الحصول على المفاتيح:', error);
    return [];
  }
};

/**
 * تطبيق جميع الإصلاحات
 */
const applyAllFixes = async () => {
  try {
    // تنظيف ذاكرة التخزين المؤقت للمصادقة
    await clearAuthCache();
    
    // إعادة تعيين عميل Supabase
    await resetSupabaseClient();
    
    // تسجيل الخروج
    await supabase.auth.signOut();
    
    Alert.alert(
      'تم التنفيذ',
      'تم تطبيق جميع الإصلاحات بنجاح. يرجى إعادة تشغيل التطبيق وتسجيل الدخول مرة أخرى.',
      [{ text: 'حسناً', style: 'default' }]
    );
    
    return true;
  } catch (error) {
    console.error('خطأ في تطبيق الإصلاحات:', error);
    
    Alert.alert(
      'خطأ',
      'حدث خطأ أثناء تطبيق الإصلاحات. يرجى المحاولة مرة أخرى.',
      [{ text: 'حسناً', style: 'default' }]
    );
    
    return false;
  }
};

/**
 * مكون واجهة المستخدم لإصلاح مشكلة المصادقة
 */
const FixAuthScreen = ({ navigation }) => {
  const [storageKeys, setStorageKeys] = React.useState([]);
  const [loading, setLoading] = React.useState(false);
  
  // تحميل مفاتيح التخزين المؤقت عند فتح الشاشة
  React.useEffect(() => {
    loadStorageKeys();
  }, []);
  
  // تحميل مفاتيح التخزين المؤقت
  const loadStorageKeys = async () => {
    setLoading(true);
    const keys = await getAllStorageKeys();
    setStorageKeys(keys);
    setLoading(false);
  };
  
  return (
    <View style={styles.container}>
      <Text style={styles.title}>أداة إصلاح مشكلة المصادقة</Text>
      
      <ScrollView style={styles.actionsContainer}>
        <TouchableOpacity 
          style={styles.actionButton} 
          onPress={async () => {
            await fixMissingAuthSession();
            Alert.alert('تم التنفيذ', 'تم إصلاح مشكلة جلسة المصادقة المفقودة');
          }}
        >
          <Text style={styles.buttonText}>إصلاح مشكلة "Auth session missing!"</Text>
        </TouchableOpacity>
        
        <TouchableOpacity 
          style={styles.actionButton} 
          onPress={async () => {
            await clearAuthCache();
            Alert.alert('تم التنفيذ', 'تم تنظيف ذاكرة التخزين المؤقت للمصادقة');
            loadStorageKeys();
          }}
        >
          <Text style={styles.buttonText}>تنظيف ذاكرة التخزين المؤقت للمصادقة</Text>
        </TouchableOpacity>
        
        <TouchableOpacity 
          style={styles.actionButton} 
          onPress={async () => {
            await resetSupabaseAndSignOut();
            loadStorageKeys();
          }}
        >
          <Text style={styles.buttonText}>إعادة تعيين عميل Supabase وتسجيل الخروج</Text>
        </TouchableOpacity>
        
        <TouchableOpacity 
          style={styles.actionButton} 
          onPress={async () => {
            await clearAllCache();
            loadStorageKeys();
          }}
        >
          <Text style={styles.buttonText}>تنظيف جميع بيانات التخزين المؤقت</Text>
        </TouchableOpacity>
        
        <TouchableOpacity 
          style={[styles.actionButton, styles.applyAllButton]} 
          onPress={applyAllFixes}
        >
          <Text style={styles.buttonText}>تطبيق جميع الإصلاحات</Text>
        </TouchableOpacity>
        
        <TouchableOpacity 
          style={styles.actionButton} 
          onPress={loadStorageKeys}
        >
          <Text style={styles.buttonText}>تحديث قائمة المفاتيح</Text>
        </TouchableOpacity>
      </ScrollView>
      
      <View style={styles.keysContainer}>
        <Text style={styles.subtitle}>مفاتيح التخزين المؤقت الحالية:</Text>
        {loading ? (
          <Text>جاري التحميل...</Text>
        ) : (
          <ScrollView style={styles.keysList}>
            {storageKeys.length > 0 ? (
              storageKeys.map((key, index) => (
                <Text key={index} style={styles.keyItem}>{key}</Text>
              ))
            ) : (
              <Text>لا توجد مفاتيح</Text>
            )}
          </ScrollView>
        )}
      </View>
    </View>
  );
};

// الأنماط
const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: 16,
    backgroundColor: '#f5f5f5',
  },
  title: {
    fontSize: 20,
    fontWeight: 'bold',
    marginBottom: 16,
    textAlign: 'center',
  },
  subtitle: {
    fontSize: 16,
    fontWeight: 'bold',
    marginBottom: 8,
  },
  actionsContainer: {
    marginBottom: 16,
  },
  actionButton: {
    backgroundColor: '#2196F3',
    padding: 12,
    borderRadius: 8,
    marginBottom: 8,
  },
  applyAllButton: {
    backgroundColor: '#4CAF50',
  },
  buttonText: {
    color: 'white',
    textAlign: 'center',
    fontWeight: 'bold',
  },
  keysContainer: {
    flex: 1,
    marginTop: 16,
  },
  keysList: {
    flex: 1,
    backgroundColor: 'white',
    borderRadius: 8,
    padding: 8,
  },
  keyItem: {
    padding: 4,
    borderBottomWidth: 1,
    borderBottomColor: '#eee',
  },
});

// تصدير المكون والدوال
export { FixAuthScreen, applyAllFixes, clearAuthCache, resetSupabaseAndSignOut, clearAllCache };

// كيفية استخدام هذا الملف:
/*
1. إضافة الشاشة إلى نظام التنقل في التطبيق:

import { FixAuthScreen } from './fix_auth_manually';

// في ملف التنقل
<Stack.Screen name="FixAuth" component={FixAuthScreen} options={{ title: 'إصلاح المصادقة' }} />

2. إضافة زر للانتقال إلى شاشة الإصلاح (مثلاً في شاشة تسجيل الدخول):

import { useNavigation } from '@react-navigation/native';

const LoginScreen = () => {
  const navigation = useNavigation();
  
  return (
    <View>
      {/* عناصر شاشة تسجيل الدخول */}
      
      <TouchableOpacity onPress={() => navigation.navigate('FixAuth')}>
        <Text>إصلاح مشكلة المصادقة</Text>
      </TouchableOpacity>
    </View>
  );
};

3. أو استخدام دالة applyAllFixes مباشرة في أي مكان في التطبيق:

import { applyAllFixes } from './fix_auth_manually';

<TouchableOpacity onPress={applyAllFixes}>
  <Text>إصلاح مشكلة المصادقة</Text>
</TouchableOpacity>
*/