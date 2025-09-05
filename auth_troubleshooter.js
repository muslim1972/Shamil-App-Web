// أداة تشخيص وإصلاح مشاكل المصادقة في تطبيق Call

import AsyncStorage from '@react-native-async-storage/async-storage';
import { supabase, resetSupabaseClient, checkSession } from './lib/supabase';

// دالة لتشخيص حالة المصادقة الحالية
export const diagnoseAuthState = async () => {
  console.log('=== بدء تشخيص حالة المصادقة ===');
  
  try {
    // 1. التحقق من الجلسة الحالية
    console.log('1. التحقق من الجلسة الحالية...');
    const session = await checkSession();
    console.log('حالة الجلسة:', session ? 'موجودة' : 'غير موجودة');
    if (session) {
      console.log('معرف المستخدم:', session.user.id);
      console.log('البريد الإلكتروني:', session.user.email);
      console.log('وقت انتهاء الجلسة:', new Date(session.expires_at * 1000).toLocaleString());
    }
    
    // 2. التحقق من مفاتيح التخزين المؤقت
    console.log('\n2. التحقق من مفاتيح التخزين المؤقت...');
    const keys = await AsyncStorage.getAllKeys();
    const authKeys = keys.filter(key => key.includes('supabase.auth'));
    console.log('مفاتيح المصادقة الموجودة:', authKeys);
    
    // 3. التحقق من وجود رمز التحديث
    console.log('\n3. التحقق من وجود رمز التحديث...');
    const refreshToken = await AsyncStorage.getItem('supabase.auth.refreshToken');
    console.log('رمز التحديث:', refreshToken ? 'موجود' : 'غير موجود');
    
    // 4. محاولة تحديث الجلسة
    console.log('\n4. محاولة تحديث الجلسة...');
    const { data, error } = await supabase.auth.refreshSession();
    if (error) {
      console.error('خطأ في تحديث الجلسة:', error.message);
    } else {
      console.log('تم تحديث الجلسة بنجاح:', data.session ? 'جلسة جديدة' : 'لا توجد جلسة');
    }
    
    console.log('\n=== انتهاء التشخيص ===');
    return { session, authKeys, refreshTokenExists: !!refreshToken, refreshResult: { data, error } };
  } catch (e) {
    console.error('خطأ أثناء التشخيص:', e.message);
    return { error: e.message };
  }
};

// دالة لإصلاح مشاكل المصادقة
export const fixAuthIssues = async () => {
  console.log('=== بدء إصلاح مشاكل المصادقة ===');
  
  try {
    // 1. تنظيف ذاكرة التخزين المؤقت للمصادقة
    console.log('1. تنظيف ذاكرة التخزين المؤقت للمصادقة...');
    await AsyncStorage.removeItem('supabase.auth.token');
    await AsyncStorage.removeItem('supabase.auth.refreshToken');
    console.log('تم تنظيف ذاكرة التخزين المؤقت للمصادقة');
    
    // 2. إعادة تعيين عميل Supabase
    console.log('\n2. إعادة تعيين عميل Supabase...');
    const newClient = resetSupabaseClient();
    console.log('تم إعادة تعيين عميل Supabase');
    
    // 3. تسجيل الخروج لضمان حالة نظيفة
    console.log('\n3. تسجيل الخروج لضمان حالة نظيفة...');
    await supabase.auth.signOut();
    console.log('تم تسجيل الخروج بنجاح');
    
    console.log('\n=== تم إصلاح مشاكل المصادقة ===');
    console.log('يمكنك الآن إعادة تسجيل الدخول إلى التطبيق');
    
    return { success: true };
  } catch (e) {
    console.error('خطأ أثناء الإصلاح:', e.message);
    return { success: false, error: e.message };
  }
};

// دالة للتحقق من وجود المستخدم في قاعدة البيانات
export const checkUserInDatabase = async (userId) => {
  if (!userId) {
    console.error('لم يتم توفير معرف المستخدم');
    return { exists: false, error: 'لم يتم توفير معرف المستخدم' };
  }
  
  try {
    const { data, error } = await supabase.rpc('check_user_exists', { p_user_id: userId });
    if (error) {
      console.error('خطأ في التحقق من وجود المستخدم:', error.message);
      return { exists: false, error: error.message };
    }
    
    console.log('نتيجة التحقق من وجود المستخدم:', data);
    return { exists: !!data };
  } catch (e) {
    console.error('استثناء أثناء التحقق من وجود المستخدم:', e.message);
    return { exists: false, error: e.message };
  }
};

// كيفية استخدام هذا الملف في التطبيق:
/*
import { diagnoseAuthState, fixAuthIssues, checkUserInDatabase } from './auth_troubleshooter';

// في دالة أو مكون React:
const handleDiagnose = async () => {
  const result = await diagnoseAuthState();
  // يمكن استخدام النتيجة لعرض معلومات التشخيص للمستخدم
};

const handleFix = async () => {
  const result = await fixAuthIssues();
  if (result.success) {
    // إعادة توجيه المستخدم إلى شاشة تسجيل الدخول
  } else {
    // عرض رسالة خطأ
  }
};

const handleCheckUser = async (userId) => {
  const result = await checkUserInDatabase(userId);
  console.log('المستخدم موجود في قاعدة البيانات:', result.exists);
};
*/