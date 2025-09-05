import AsyncStorage from '@react-native-async-storage/async-storage';
import { Alert } from 'react-native';
import { supabase, resetSession, validateAndRefreshSession } from './lib/supabase';

/**
 * وظيفة لتصحيح مشكلة العودة إلى شاشة تسجيل الدخول
 * تقوم بالتحقق من حالة الجلسة وتجديدها إذا كانت صالحة
 */
export const fixPersistentLogin = async () => {
  try {
    console.log('بدء إصلاح مشكلة استمرار تسجيل الدخول...');
    
    // التحقق من وجود جلسة مخزنة
    const { data: { session } } = await supabase.auth.getSession();
    
    if (!session) {
      console.log('لا توجد جلسة مخزنة، التحقق من وجود بيانات مصادقة في التخزين المحلي...');
      
      // محاولة استعادة الجلسة من التخزين المحلي
      const keys = await AsyncStorage.getAllKeys();
      const authKeys = keys.filter(key => 
        key.includes('supabase.auth') || 
        key.includes('sb-') || 
        key.includes('@supabase')
      );
      
      if (authKeys.length > 0) {
        console.log('تم العثور على بيانات مصادقة في التخزين المحلي، محاولة استعادة الجلسة...');
        
        // محاولة تجديد الجلسة
        const { data, error } = await supabase.auth.refreshSession();
        
        if (error) {
          console.error('فشل في تجديد الجلسة:', error.message);
          return false;
        }
        
        if (data?.session) {
          console.log('تم استعادة الجلسة بنجاح!');
          return true;
        }
      } else {
        console.log('لا توجد بيانات مصادقة في التخزين المحلي.');
        return false;
      }
    } else {
      console.log('تم العثور على جلسة نشطة، التحقق من صلاحيتها...');
      
      // التحقق من صلاحية الجلسة وتجديدها إذا لزم الأمر
      const isValid = await validateAndRefreshSession();
      
      if (isValid) {
        console.log('الجلسة صالحة وتم تجديدها بنجاح!');
        return true;
      } else {
        console.log('الجلسة غير صالحة، إعادة تعيين...');
        await resetSession();
        return false;
      }
    }
    
    return false;
  } catch (error) {
    console.error('خطأ أثناء إصلاح مشكلة استمرار تسجيل الدخول:', error);
    return false;
  }
};

/**
 * وظيفة لتطبيق الإصلاح التلقائي عند بدء التطبيق
 * يمكن استدعاؤها في App.js
 */
export const applyPersistentLoginFix = async () => {
  try {
    const result = await fixPersistentLogin();
    return result;
  } catch (error) {
    console.error('خطأ أثناء تطبيق إصلاح استمرار تسجيل الدخول:', error);
    return false;
  }
};

/**
 * وظيفة لإصلاح مشكلة استمرار تسجيل الدخول يدوياً
 * يمكن استدعاؤها من زر في واجهة المستخدم
 */
export const manualFixPersistentLogin = async () => {
  try {
    Alert.alert(
      'جاري إصلاح مشكلة تسجيل الدخول...',
      'يرجى الانتظار لحظة واحدة.',
      [{ text: 'حسناً', style: 'cancel' }]
    );
    
    const result = await fixPersistentLogin();
    
    if (result) {
      Alert.alert(
        'تم الإصلاح بنجاح',
        'تم إصلاح مشكلة استمرار تسجيل الدخول بنجاح. يرجى إعادة تشغيل التطبيق.',
        [{ text: 'حسناً', style: 'default' }]
      );
    } else {
      Alert.alert(
        'فشل الإصلاح',
        'لم يتم إصلاح المشكلة. يرجى تسجيل الخروج وإعادة تسجيل الدخول.',
        [{ text: 'حسناً', style: 'default' }]
      );
    }
    
    return result;
  } catch (error) {
    console.error('خطأ أثناء الإصلاح اليدوي لمشكلة استمرار تسجيل الدخول:', error);
    
    Alert.alert(
      'خطأ',
      'حدث خطأ أثناء محاولة إصلاح المشكلة. يرجى تسجيل الخروج وإعادة تسجيل الدخول.',
      [{ text: 'حسناً', style: 'default' }]
    );
    
    return false;
  }
};