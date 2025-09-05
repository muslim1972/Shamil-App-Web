// هذا الملف لحل مشكلة عدم الاحتفاظ بالجلسة والانتقال بعد تسجيل الدخول
// قم بتشغيل هذا الملف قبل اختبار التطبيق

import AsyncStorage from '@react-native-async-storage/async-storage';
import { supabase } from './lib/supabase';

export async function clearAuthCacheAndTest() {
  try {
    console.log('🔄 بدء تنظيف ذاكرة التخزين المؤقت...');
    
    // 1. مسح جميع مفاتيح المصادقة من AsyncStorage
    const keys = await AsyncStorage.getAllKeys();
    const authKeys = keys.filter(key => 
      key.includes('supabase.auth') || 
      key.includes('sb-') ||
      key.includes('@supabase')
    );
    
    if (authKeys.length > 0) {
      await AsyncStorage.multiRemove(authKeys);
      console.log(`✅ تم مسح ${authKeys.length} مفتاح مصادقة`);
    }
    
    // 2. إعادة تعيين جلسة Supabase
    await supabase.auth.signOut();
    console.log('✅ تم تسجيل الخروج من Supabase');
    
    // 3. محاولة الحصول على جلسة جديدة
    const { data: { session }, error } = await supabase.auth.getSession();
    
    if (error) {
      console.error('❌ خطأ في الحصول على الجلسة:', error.message);
    } else {
      console.log('✅ تم الحصول على الجلسة بنجاح:', session ? 'جلسة موجودة' : 'لا توجد جلسة');
    }
    
    console.log('🎉 تم الانتهاء من التنظيف! يمكنك الآن اختبار تسجيل الدخول مرة أخرى.');
    
  } catch (error) {
    console.error('❌ خطأ في عملية التنظيف:', error);
  }
}

// دالة للاختبار السريع
export async function testLoginFlow() {
  console.log('🧪 اختبار تدفق تسجيل الدخول...');
  
  try {
    // محاولة تسجيل دخول تجريبي
    const { data, error } = await supabase.auth.signInWithPassword({
      email: 'test@example.com',
      password: 'test123'
    });
    
    if (error) {
      console.log('⚠️ تسجيل الدخول فشل (طبيعي إذا لم يكن الحساب موجود):', error.message);
    } else {
      console.log('✅ تسجيل الدخول ناجح:', data.user.email);
    }
    
  } catch (e) {
    console.error('❌ خطأ غير متوقع:', e);
  }
}

// تعليمات الاستخدام
console.log(`
📋 تعليمات استخدام ملف fix_session_and_navigation.js:

1. استيراد الدوال في ملف App.js أو أي مكان مناسب:
   import { clearAuthCacheAndTest } from './fix_session_and_navigation.js';

2. تشغيل دالة التنظيف عند بدء التطبيق:
   useEffect(() => {
     clearAuthCacheAndTest();
   }, []);

3. أو تشغيلها يدوياً من وحدة التحكم:
   node fix_session_and_navigation.js

4. بعد التنظيف، جرب تسجيل الدخول مرة أخرى.
`);

// تشغيل تلقائي إذا تم تنفيذ الملف مباشرة
if (typeof window === 'undefined') {
  clearAuthCacheAndTest();
}