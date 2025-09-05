// ملف لإصلاح مشكلة المصادقة تلقائياً عند بدء التطبيق

import AsyncStorage from '@react-native-async-storage/async-storage';
import { Alert } from 'react-native';

// دالة لتنظيف ذاكرة التخزين المؤقت للمصادقة
export const clearAuthCache = async () => {
  try {
    // الحصول على جميع المفاتيح في AsyncStorage
    const keys = await AsyncStorage.getAllKeys();
    
    // تصفية المفاتيح المتعلقة بالمصادقة في Supabase
    const supabaseKeys = keys.filter(key => 
      key.includes('supabase.auth') || 
      key.includes('sb-') ||
      key.includes('@supabase')
    );
    
    // حذف المفاتيح المتعلقة بالمصادقة
    if (supabaseKeys.length > 0) {
      await AsyncStorage.multiRemove(supabaseKeys);
      console.log('تم تنظيف ذاكرة التخزين المؤقت للمصادقة:', supabaseKeys);
    } else {
      // حذف المفاتيح القديمة للتأكد
      await AsyncStorage.removeItem('supabase.auth.token');
      await AsyncStorage.removeItem('supabase.auth.refreshToken');
      console.log('تم تنظيف مفاتيح المصادقة القديمة');
    }
    
    return true;
  } catch (error) {
    console.error('خطأ في تنظيف ذاكرة التخزين المؤقت:', error);
    return false;
  }
};

// دالة للتحقق من وجود خطأ في الجلسة وإصلاحه تلقائياً
export const autoFixAuthSession = async () => {
  try {
    // التحقق من وجود جلسة صالحة
    const sessionStr = await AsyncStorage.getItem('supabase.auth.token');
    if (!sessionStr) {
      console.log('لا توجد جلسة مخزنة، لا حاجة للإصلاح');
      return false;
    }
    
    try {
      // محاولة تحليل بيانات الجلسة
      const session = JSON.parse(sessionStr);
      const expiresAt = session?.expiresAt || 0;
      const now = Math.floor(Date.now() / 1000);
      
      // التحقق مما إذا كانت الجلسة منتهية الصلاحية
      if (expiresAt < now) {
        console.log('الجلسة منتهية الصلاحية، جاري تنظيف الذاكرة المؤقتة...');
        await clearAuthCache();
        return true;
      }
    } catch (parseError) {
      console.error('خطأ في تحليل بيانات الجلسة:', parseError);
      // في حالة وجود خطأ في تحليل البيانات، قم بتنظيف الذاكرة المؤقتة
      await clearAuthCache();
      return true;
    }
    
    return false;
  } catch (error) {
    console.error('خطأ في التحقق من الجلسة:', error);
    return false;
  }
};

// دالة لإصلاح مشكلة "Auth session missing!"
export const fixMissingAuthSession = async () => {
  try {
    // تنظيف ذاكرة التخزين المؤقت للمصادقة
    await clearAuthCache();
    console.log('تم تنظيف ذاكرة التخزين المؤقت لإصلاح مشكلة "Auth session missing!"');
    return true;
  } catch (error) {
    console.error('خطأ في إصلاح مشكلة "Auth session missing!":', error);
    return false;
  }
};

// كيفية استخدام هذا الملف في التطبيق:
// 1. قم باستيراد الدالة في ملف App.js:
// import { autoFixAuthSession, fixMissingAuthSession } from './auto_fix_auth';

// 2. قم باستدعاء الدالة في useEffect عند بدء التطبيق:
/*
useEffect(() => {
  // محاولة إصلاح مشكلة المصادقة تلقائياً عند بدء التطبيق
  autoFixAuthSession();
  
  // أو استخدم هذه الدالة لإصلاح مشكلة "Auth session missing!"
  // fixMissingAuthSession();
}, []);
*/