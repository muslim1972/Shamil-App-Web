// سكربت تنظيف شامل لذاكرة التخزين المؤقت والمصادقة
// يستخدم لحل مشاكل عدم الاتساق عبر الأجهزة

import AsyncStorage from '@react-native-async-storage/async-storage';
import { supabase } from './lib/supabase';

/**
 * تنظيف شامل لذاكرة التخزين المؤقت والمصادقة
 */
export const performCompleteCleanup = async () => {
  try {
    console.log('بدء عملية التنظيف الشاملة...');
    
    // 1. تنظيف ذاكرة التخزين المؤقت للمصادقة
    await clearAuthCache();
    
    // 2. تنظيف ذاكرة التخزين المؤقت للمحادثات
    await clearConversationsCache();
    
    // 3. تنظيف ذاكرة التخزين المؤقت للمستخدمين
    await clearUsersCache();
    
    // 4. إعادة تعيين عميل Supabase
    await resetSupabaseClient();
    
    // 5. إعادة تهيئة الجلسة
    await reinitializeSession();
    
    console.log('اكتملت عملية التنظيف بنجاح');
    return { success: true };
  } catch (error) {
    console.error('خطأ في عملية التنظيف:', error);
    return { success: false, error: error.message };
  }
};

/**
 * تنظيف ذاكرة التخزين المؤقت للمصادقة
 */
const clearAuthCache = async () => {
  try {
    const keys = await AsyncStorage.getAllKeys();
    
    // تصفية المفاتيح المتعلقة بالمصادقة
    const authKeys = keys.filter(key => 
      key.includes('supabase.auth') || 
      key.includes('sb-') ||
      key.includes('@supabase') ||
      key.includes('auth') ||
      key.includes('session') ||
      key.includes('token')
    );
    
    if (authKeys.length > 0) {
      await AsyncStorage.multiRemove(authKeys);
      console.log('تم حذف مفاتيح المصادقة:', authKeys);
    }
    
    // حذف المفاتيح القديمة
    const oldKeys = [
      'supabase.auth.token',
      'supabase.auth.refreshToken',
      'user',
      'session',
      'auth_token',
      'refresh_token'
    ];
    
    for (const key of oldKeys) {
      try {
        await AsyncStorage.removeItem(key);
      } catch (e) {
        // تجاهل الأخطاء للمفاتيح غير الموجودة
      }
    }
    
    console.log('تم تنظيف ذاكرة التخزين المؤقت للمصادقة');
  } catch (error) {
    console.error('خطأ في تنظيف ذاكرة التخزين المؤقت للمصادقة:', error);
    throw error;
  }
};

/**
 * تنظيف ذاكرة التخزين المؤقت للمحادثات
 */
const clearConversationsCache = async () => {
  try {
    const keys = await AsyncStorage.getAllKeys();
    
    const conversationKeys = keys.filter(key => 
      key.includes('conversation') ||
      key.includes('chat') ||
      key.includes('message')
    );
    
    if (conversationKeys.length > 0) {
      await AsyncStorage.multiRemove(conversationKeys);
      console.log('تم حذف مفاتيح المحادثات:', conversationKeys);
    }
    
    console.log('تم تنظيف ذاكرة التخزين المؤقت للمحادثات');
  } catch (error) {
    console.error('خطأ في تنظيف ذاكرة التخزين المؤقت للمحادثات:', error);
    throw error;
  }
};

/**
 * تنظيف ذاكرة التخزين المؤقت للمستخدمين
 */
const clearUsersCache = async () => {
  try {
    const keys = await AsyncStorage.getAllKeys();
    
    const userKeys = keys.filter(key => 
      key.includes('user') &&
      !key.includes('auth') &&
      !key.includes('session')
    );
    
    if (userKeys.length > 0) {
      await AsyncStorage.multiRemove(userKeys);
      console.log('تم حذف مفاتيح المستخدمين:', userKeys);
    }
    
    console.log('تم تنظيف ذاكرة التخزين المؤقت للمستخدمين');
  } catch (error) {
    console.error('خطأ في تنظيف ذاكرة التخزين المؤقت للمستخدمين:', error);
    throw error;
  }
};

/**
 * إعادة تعيين عميل Supabase
 */
const resetSupabaseClient = async () => {
  try {
    // تسجيل الخروج من جميع الجلسات
    await supabase.auth.signOut({ scope: 'global' });
    
    console.log('تم تسجيل الخروج من جميع الجلسات');
  } catch (error) {
    console.error('خطأ في إعادة تعيين عميل Supabase:', error);
    // تجاهل الأخطاء هنا لأننا نريد الاستمرار
  }
};

/**
 * إعادة تهيئة الجلسة
 */
const reinitializeSession = async () => {
  try {
    // محاولة الحصول على الجلسة الحالية
    const { data: { session }, error } = await supabase.auth.getSession();
    
    if (error) {
      console.log('لا توجد جلسة حالية، يجب على المستخدم تسجيل الدخول مرة أخرى');
    } else if (session) {
      console.log('تم استعادة الجلسة بنجاح');
      
      // التأكد من وجود المستخدم في جدول users
      const { error: userError } = await supabase.rpc('ensure_user_exists', {
        user_uuid: session.user.id
      });
      
      if (userError) {
        console.error('خطأ في إنشاء المستخدم:', userError);
      } else {
        console.log('تم التحقق من وجود المستخدم');
      }
    }
  } catch (error) {
    console.error('خطأ في إعادة تهيئة الجلسة:', error);
  }
};

/**
 * إعادة تعيين التطبيق بالكامل (للاستخدام في حالات الطوارئ)
 */
export const resetAppCompletely = async () => {
  try {
    console.log('بدء إعادة تعيين التطبيق بالكامل...');
    
    // تنظيف كل شيء
    await AsyncStorage.clear();
    console.log('تم مسح جميع البيانات المحلية');
    
    // إعادة تعيين عميل Supabase
    await resetSupabaseClient();
    
    console.log('تم إعادة تعيين التطبيق بالكامل');
    return { success: true };
  } catch (error) {
    console.error('خطأ في إعادة تعيين التطبيق:', error);
    return { success: false, error: error.message };
  }
};

/**
 * التحقق من حالة النظام
 */
export const checkSystemHealth = async () => {
  try {
    const checks = {
      auth: false,
      users: false,
      conversations: false,
      messages: false
    };
    
    // التحقق من المصادقة
    const { data: { session }, error: authError } = await supabase.auth.getSession();
    checks.auth = !authError && session !== null;
    
    if (session) {
      // التحقق من وجود المستخدم
      const { data: userData, error: userError } = await supabase
        .from('users')
        .select('id')
        .eq('id', session.user.id)
        .single();
      checks.users = !userError && userData !== null;
      
      // التحقق من جدول المحادثات
      const { data: convData, error: convError } = await supabase
        .from('conversations')
        .select('id')
        .limit(1);
      checks.conversations = !convError;
      
      // التحقق من جدول الرسائل
      const { data: msgData, error: msgError } = await supabase
        .from('messages')
        .select('id')
        .limit(1);
      checks.messages = !msgError;
    }
    
    console.log('نتائج فحص صحة النظام:', checks);
    return { success: true, checks };
  } catch (error) {
    console.error('خطأ في فحص صحة النظام:', error);
    return { success: false, error: error.message };
  }
};