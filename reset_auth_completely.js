// ملف لإعادة تعيين المصادقة بشكل كامل وشامل

import AsyncStorage from '@react-native-async-storage/async-storage';
import { Alert } from 'react-native';
import { supabase, resetSupabaseClient } from './lib/supabase';

// دالة لتنظيف جميع بيانات المصادقة من التخزين المؤقت
export const clearAllAuthData = async () => {
  try {
    // الحصول على جميع المفاتيح في AsyncStorage
    const keys = await AsyncStorage.getAllKeys();
    
    // تصفية المفاتيح المتعلقة بالمصادقة في Supabase
    const supabaseKeys = keys.filter(key => 
      key.includes('supabase') || 
      key.includes('sb-') ||
      key.includes('@supabase')
    );
    
    // حذف المفاتيح المتعلقة بالمصادقة
    if (supabaseKeys.length > 0) {
      await AsyncStorage.multiRemove(supabaseKeys);
      console.log('تم تنظيف جميع بيانات المصادقة:', supabaseKeys);
    }
    
    return true;
  } catch (error) {
    console.error('خطأ في تنظيف بيانات المصادقة:', error);
    return false;
  }
};

// دالة لإعادة تعيين عميل Supabase بالكامل
export const resetSupabaseCompletely = async () => {
  try {
    // 1. تسجيل الخروج من الجلسة الحالية
    await supabase.auth.signOut({ scope: 'global' });
    
    // 2. تنظيف جميع بيانات المصادقة
    await clearAllAuthData();
    
    // 3. إعادة تعيين عميل Supabase
    const newClient = resetSupabaseClient();
    
    // 4. استبدال العميل القديم بالجديد
    Object.assign(supabase, newClient);
    
    console.log('تم إعادة تعيين عميل Supabase بالكامل');
    return true;
  } catch (error) {
    console.error('خطأ في إعادة تعيين عميل Supabase:', error);
    return false;
  }
};

// دالة لإعادة تعيين المصادقة بالكامل وإظهار رسالة للمستخدم
export const resetAuthCompletely = async () => {
  try {
    // إظهار مؤشر التحميل أو رسالة للمستخدم هنا إذا لزم الأمر
    
    // إعادة تعيين عميل Supabase بالكامل
    const result = await resetSupabaseCompletely();
    
    if (result) {
      Alert.alert(
        'تم بنجاح',
        'تم إعادة تعيين المصادقة بالكامل. يرجى إعادة تسجيل الدخول.',
        [{ text: 'حسناً', style: 'default' }]
      );
    } else {
      Alert.alert(
        'خطأ',
        'حدث خطأ أثناء إعادة تعيين المصادقة. يرجى المحاولة مرة أخرى.',
        [{ text: 'حسناً', style: 'default' }]
      );
    }
    
    return result;
  } catch (error) {
    console.error('خطأ في إعادة تعيين المصادقة:', error);
    
    Alert.alert(
      'خطأ',
      'حدث خطأ غير متوقع. يرجى المحاولة مرة أخرى.',
      [{ text: 'حسناً', style: 'default' }]
    );
    
    return false;
  }
};

// كيفية استخدام هذا الملف:
// 1. استيراد الدالة في الملف المطلوب:
// import { resetAuthCompletely } from './reset_auth_completely';
//
// 2. استدعاء الدالة عند الحاجة:
// resetAuthCompletely();
//
// 3. يمكن إضافة زر في شاشة تسجيل الدخول أو الإعدادات لاستدعاء هذه الدالة:
// <Button title="إعادة تعيين المصادقة" onPress={resetAuthCompletely} />