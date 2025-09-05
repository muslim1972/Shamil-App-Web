// ملف تنفيذي لتطبيق إصلاحات المصادقة

import AsyncStorage from '@react-native-async-storage/async-storage';
import { Alert } from 'react-native';
import { supabase, resetSupabaseClient } from './lib/supabase';

// دالة لتطبيق جميع الإصلاحات
export const applyAllFixes = async () => {
  try {
    // 1. تنظيف ذاكرة التخزين المؤقت للمصادقة
    await clearAuthCache();
    
    // 2. إعادة تعيين عميل Supabase
    resetSupabaseClient();
    
    // 3. تسجيل الخروج
    await supabase.auth.signOut();
    
    // 4. عرض رسالة نجاح
    Alert.alert(
      'تم التطبيق بنجاح',
      'تم تطبيق جميع الإصلاحات بنجاح. يرجى إعادة تسجيل الدخول.',
      [{ text: 'حسناً', style: 'default' }]
    );
    
    return true;
  } catch (error) {
    console.error('خطأ في تطبيق الإصلاحات:', error);
    
    // عرض رسالة خطأ
    Alert.alert(
      'خطأ',
      'حدث خطأ أثناء تطبيق الإصلاحات: ' + error.message,
      [{ text: 'حسناً', style: 'default' }]
    );
    
    return false;
  }
};

// دالة لتنظيف ذاكرة التخزين المؤقت للمصادقة
const clearAuthCache = async () => {
  try {
    // حذف بيانات الجلسة فقط
    await AsyncStorage.removeItem('supabase.auth.token');
    await AsyncStorage.removeItem('supabase.auth.refreshToken');
    console.log('تم تنظيف ذاكرة التخزين المؤقت للمصادقة بنجاح');
    return true;
  } catch (error) {
    console.error('خطأ في تنظيف ذاكرة التخزين المؤقت:', error);
    throw error;
  }
};

// كيفية استخدام هذا الملف في التطبيق:
/*
// في App.js أو أي مكون آخر
import { applyAllFixes } from './apply_auth_fixes';

// إضافة زر لتطبيق الإصلاحات
<Button 
  title="إصلاح مشاكل تسجيل الدخول" 
  onPress={applyAllFixes} 
/>
*/