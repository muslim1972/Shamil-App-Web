// إصلاح اتصال Supabase في التطبيق

// 1. تحديث ملف .env
// تم تحديث ملف .env بالفعل بمعلومات Supabase الصحيحة:
// SUPABASE_URL=https://xuigvkwnjnfgxxnuhnhr.supabase.co
// SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Inh1aWd2a3duam5mZ3h4bnVobmhyIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTE3NTMwNjcsImV4cCI6MjA2NzMyOTA2N30.RTmIQFG0edxMAWK4FUHqlks9Nc9GcsMWZquYuFT4ayU

// 2. تحديث معرف مشروع Expo في App.js
// تم تحديث معرف مشروع Expo في App.js بالفعل:
// token = (await Notifications.getExpoPushTokenAsync({ projectId: '5840bcfc-eaa3-49ed-ad79-66e65bee179d' })).data;

// 3. خطوات إضافية لإصلاح المشكلة:

// أ. تنظيف ذاكرة التخزين المؤقت للتطبيق
// يمكن تنفيذ ذلك عن طريق إضافة الكود التالي في بداية التطبيق (في App.js):
/*
import AsyncStorage from '@react-native-async-storage/async-storage';

// دالة لتنظيف ذاكرة التخزين المؤقت
const clearCache = async () => {
  try {
    // حذف بيانات الجلسة فقط (وليس كل البيانات)
    await AsyncStorage.removeItem('supabase.auth.token');
    console.log('تم تنظيف ذاكرة التخزين المؤقت بنجاح');
  } catch (error) {
    console.error('خطأ في تنظيف ذاكرة التخزين المؤقت:', error);
  }
};

// استدعاء الدالة عند بدء التطبيق
clearCache();
*/

// ب. إعادة تعيين عميل Supabase
// يمكن إضافة هذا الكود في ملف lib/supabase.js لإعادة تعيين عميل Supabase:
/*
// دالة لإعادة تعيين عميل Supabase
export const resetSupabaseClient = () => {
  // إعادة إنشاء عميل Supabase بنفس المعلومات
  return createClient(supabaseUrl, supabaseAnonKey, {
    auth: {
      storage: AsyncStorage,
      autoRefreshToken: true,
      persistSession: true,
      detectSessionInUrl: false,
    },
  });
};
*/

// ج. التحقق من اتصال Supabase
// يمكن إضافة هذا الكود في أي مكان للتحقق من اتصال Supabase:
/*
const checkSupabaseConnection = async () => {
  try {
    const { data, error } = await supabase.from('users').select('id').limit(1);
    if (error) {
      console.error('خطأ في الاتصال بـ Supabase:', error);
      return false;
    }
    console.log('تم الاتصال بـ Supabase بنجاح');
    return true;
  } catch (error) {
    console.error('خطأ غير متوقع في الاتصال بـ Supabase:', error);
    return false;
  }
};
*/

// 4. ملاحظات إضافية:
// - تأكد من تثبيت التطبيق من جديد بعد تحديث ملف .env
// - تأكد من إعادة تشغيل خادم التطوير بعد تحديث ملف .env
// - تأكد من تنفيذ ملف SQL لإصلاح نظام الإشعارات في قاعدة البيانات Supabase