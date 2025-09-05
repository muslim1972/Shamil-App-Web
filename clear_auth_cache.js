// ملف لتنظيف ذاكرة التخزين المؤقت للمصادقة
// يمكن استخدام هذا الملف مباشرة في التطبيق لتنظيف ذاكرة التخزين المؤقت

import AsyncStorage from '@react-native-async-storage/async-storage';

// دالة لتنظيف ذاكرة التخزين المؤقت المتعلقة بالمصادقة فقط
export const clearAuthCache = async () => {
  try {
    // حذف بيانات الجلسة فقط
    await AsyncStorage.removeItem('supabase.auth.token');
    await AsyncStorage.removeItem('supabase.auth.refreshToken');
    console.log('تم تنظيف ذاكرة التخزين المؤقت للمصادقة بنجاح');
    return true;
  } catch (error) {
    console.error('خطأ في تنظيف ذاكرة التخزين المؤقت:', error);
    return false;
  }
};

// دالة لتنظيف جميع بيانات التخزين المؤقت (استخدم بحذر)
export const clearAllCache = async () => {
  try {
    await AsyncStorage.clear();
    console.log('تم تنظيف جميع بيانات التخزين المؤقت');
    return true;
  } catch (error) {
    console.error('خطأ في تنظيف التخزين المؤقت:', error);
    return false;
  }
};

// دالة لعرض جميع مفاتيح التخزين المؤقت (للتشخيص)
export const getAllKeys = async () => {
  try {
    const keys = await AsyncStorage.getAllKeys();
    console.log('جميع مفاتيح التخزين المؤقت:', keys);
    return keys;
  } catch (error) {
    console.error('خطأ في جلب مفاتيح التخزين المؤقت:', error);
    return [];
  }
};

// دالة لعرض قيمة مفتاح معين (للتشخيص)
export const getItem = async (key) => {
  try {
    const value = await AsyncStorage.getItem(key);
    console.log(`قيمة المفتاح ${key}:`, value);
    return value;
  } catch (error) {
    console.error(`خطأ في جلب قيمة المفتاح ${key}:`, error);
    return null;
  }
};

// كيفية استخدام هذا الملف في التطبيق:
/*
import { clearAuthCache, clearAllCache, getAllKeys, getItem } from './clear_auth_cache';

// في دالة أو مكون React:
const handleClearAuthCache = async () => {
  const success = await clearAuthCache();
  if (success) {
    // إعادة تشغيل التطبيق أو إعادة توجيه المستخدم إلى شاشة تسجيل الدخول
  }
};

// للتشخيص:
const diagnoseCache = async () => {
  const keys = await getAllKeys();
  // عرض قيم المفاتيح المتعلقة بالمصادقة
  if (keys.includes('supabase.auth.token')) {
    await getItem('supabase.auth.token');
  }
  if (keys.includes('supabase.auth.refreshToken')) {
    await getItem('supabase.auth.refreshToken');
  }
};
*/