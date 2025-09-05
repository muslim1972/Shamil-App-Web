// disable_supabase_logs.js
// ملف لإيقاف رسائل التصحيح المفرطة في Supabase وإصلاح مشكلة الجلسة المفقودة

import AsyncStorage from '@react-native-async-storage/async-storage';
import { supabase, resetSupabaseClient } from './lib/supabase';

/**
 * دالة لإيقاف رسائل التصحيح في Supabase
 * يجب استدعاء هذه الدالة في بداية التطبيق
 */
export const disableSupabaseLogs = () => {
  // إيقاف رسائل التصحيح في وحدة GoTrueClient
  if (global.console && console.log) {
    const originalLog = console.log;
    console.log = (...args) => {
      // تجاهل رسائل GoTrueClient وجميع رسائل المصادقة
      if (
        args.length > 0 &&
        typeof args[0] === 'string' &&
        (args[0].includes('GoTrueClient') || 
         args[0].includes('#__loadSession') ||
         args[0].includes('#_autoRefreshTokenTick') ||
         args[0].includes('#_useSession') ||
         args[0].includes('#_acquireLock') ||
         args[0].includes('لا توجد جلسة') ||
         args[0].includes('جلسة') ||
         args[0].includes('مصادقة') ||
         args[0].includes('تسجيل الدخول') ||
         args[0].includes('Authentication') ||
         args[0].includes('Auth') ||
         args[0].includes('token') ||
         args[0].includes('Token') ||
         args[0].includes('تم تنظيف') ||
         args[0].includes('تم إعادة تعيين') ||
         args[0].includes('تم إصلاح') ||
         args[0].includes('بدء إصلاح') ||
         args[0].includes('بدء تهيئة') ||
         args[0].includes('Expo Push Token') ||
         args[0].includes('refresh') ||
         args[0].includes('Refresh') ||
         args[0].includes('تحديث') ||
         args[0].includes('SIGNED_IN') ||
         args[0].includes('SIGNED_OUT') ||
         args[0].includes('TOKEN_REFRESHED') ||
         args[0].includes('USER_UPDATED') ||
         args[0].includes('PASSWORD_RECOVERY') ||
         args[0].includes('onAuthStateChange'))
      ) {
        // تجاهل هذه الرسائل
        return;
      }
      
      // السماح بمرور الرسائل الأخرى
      originalLog.apply(console, args);
    };
    
    // تجاهل رسائل الخطأ المتعلقة بالمصادقة
    const originalError = console.error;
    console.error = (...args) => {
      if (
        args.length > 0 &&
        typeof args[0] === 'string' &&
        (args[0].includes('Auth session missing') ||
         args[0].includes('خطأ في تحديث الجلسة') ||
         args[0].includes('خطأ في تجديد الجلسة') ||
         args[0].includes('استثناء أثناء إعادة تعيين الجلسة') ||
         args[0].includes('خطأ في تنظيف ذاكرة التخزين المؤقت'))
      ) {
        // تجاهل رسائل الخطأ المتعلقة بالمصادقة
        return;
      }
      
      // السماح بمرور رسائل الخطأ الأخرى
      originalError.apply(console, args);
    };
  }
};

/**
 * دالة لإصلاح مشكلة الجلسة المفقودة
 * تقوم بالتحقق من وجود جلسة في التخزين المحلي وتحاول استعادتها
 */
export const fixMissingAuthSessionEnhanced = async () => {
  try {
    // التحقق من وجود جلسة في التخزين المحلي
    const sessionStr = await AsyncStorage.getItem('supabase.auth.token');
    
    if (!sessionStr) {
      console.log('لا توجد بيانات جلسة في التخزين المحلي');
      return false;
    }
    
    // محاولة تحميل الجلسة من التخزين المحلي
    const { data, error } = await supabase.auth.getSession();
    
    if (error || !data.session) {
      console.log('محاولة إعادة تحميل الجلسة من التخزين المحلي...');
      
      // محاولة تجديد الجلسة
      const refreshResult = await supabase.auth.refreshSession();
      
      if (refreshResult.error) {
        console.error('فشل في تجديد الجلسة:', refreshResult.error.message);
        return false;
      }
      
      if (refreshResult.data.session) {
        console.log('تم استعادة الجلسة بنجاح');
        return true;
      }
    } else {
      console.log('الجلسة موجودة ونشطة');
      return true;
    }
  } catch (e) {
    console.error('خطأ أثناء إصلاح جلسة المصادقة المفقودة:', e.message);
    return false;
  }
  
  return false;
};

/**
 * دالة لتطبيق جميع الإصلاحات المتعلقة بالمصادقة والرسائل
 */
export const applyAuthAndLoggingFixes = async () => {
  // إيقاف رسائل التصحيح
  disableSupabaseLogs();
  
  // إصلاح مشكلة الجلسة المفقودة
  const sessionFixed = await fixMissingAuthSessionEnhanced();
  
  return sessionFixed;
};