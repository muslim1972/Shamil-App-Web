/**
 * سكربت تشخيص لمشكلة عدم حفظ الجلسة
 * يقوم بفحص كل خطوة من عملية المصادقة ويعرض تفاصيل الخطأ
 * نسخة معدلة للعمل مع Node.js
 */

import AsyncStorage from '@react-native-async-storage/async-storage';
import { createClient } from '@supabase/supabase-js';
import fs from 'fs';
import path from 'path';

// قراءة متغيرات البيئة من ملف .env
const envPath = path.join(process.cwd(), '.env');
let SUPABASE_URL = '';
let SUPABASE_ANON_KEY = '';

try {
  const envContent = fs.readFileSync(envPath, 'utf8');
  const lines = envContent.split('\n');
  for (const line of lines) {
    const [key, value] = line.split('=');
    if (key && value) {
      if (key.trim() === 'SUPABASE_URL') SUPABASE_URL = value.trim();
      if (key.trim() === 'SUPABASE_ANON_KEY') SUPABASE_ANON_KEY = value.trim();
    }
  }
} catch (error) {
  console.error('❌ لم يتمكن من قراءة ملف .env:', error.message);
}

// تكوين Supabase
let supabase;
if (SUPABASE_URL && SUPABASE_ANON_KEY) {
  const authOptions = {
    storage: AsyncStorage,
    autoRefreshToken: true,
    persistSession: true,
    detectSessionInUrl: false,
    debug: false,
    storageKey: 'supabase.auth.token',
    flowType: 'pkce',
  };

  supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY, {
    auth: authOptions,
  });
} else {
  console.error('❌ إعدادات Supabase غير مكتملة');
}

// دالة لعرض حالة التخزين الحالية
const checkStorageState = async () => {
  console.log('🔍 فحص حالة التخزين...');
  try {
    const keys = await AsyncStorage.getAllKeys();
    console.log('جميع المفاتيح:', keys);
    
    const authKeys = keys.filter(key => 
      key.includes('supabase.auth') || 
      key.includes('sb-') ||
      key.includes('@supabase')
    );
    console.log('مفاتيح المصادقة:', authKeys);
    
    for (const key of authKeys) {
      const value = await AsyncStorage.getItem(key);
      console.log(`${key}: ${value ? 'يوجد قيمة' : 'لا توجد قيمة'}`);
      if (value && key.includes('token')) {
        try {
          const parsed = JSON.parse(value);
          console.log(`  - expires_at: ${parsed.expires_at ? new Date(parsed.expires_at * 1000).toLocaleString() : 'غير محدد'}`);
          console.log(`  - user_id: ${parsed.user?.id || 'غير محدد'}`);
        } catch (e) {
          console.log(`  - لا يمكن تحليل القيمة`);
        }
      }
    }
    
    return authKeys.length > 0;
  } catch (error) {
    console.error('خطأ في فحص التخزين:', error);
    return false;
  }
};

// دالة للتحقق من إعدادات Supabase
const checkSupabaseConfig = () => {
  console.log('🔍 فحص إعدادات Supabase...');
  
  console.log('SUPABASE_URL موجود:', !!SUPABASE_URL);
  console.log('SUPABASE_ANON_KEY موجود:', !!SUPABASE_ANON_KEY);
  
  if (!SUPABASE_URL || !SUPABASE_ANON_KEY) {
    console.error('❌ إعدادات Supabase غير مكتملة!');
    console.log('SUPABASE_URL:', SUPABASE_URL || 'غير محدد');
    console.log('SUPABASE_ANON_KEY:', SUPABASE_ANON_KEY ? SUPABASE_ANON_KEY.substring(0, 20) + '...' : 'غير محدد');
    return false;
  }
  
  console.log('✅ إعدادات Supabase مكتملة');
  return true;
};

// دالة للتحقق من الجلسة الحالية بالتفصيل
const checkCurrentSession = async () => {
  console.log('🔍 فحص الجلسة الحالية...');
  
  if (!supabase) {
    console.error('❌ Supabase غير مهيأ');
    return null;
  }
  
  try {
    const { data, error } = await supabase.auth.getSession();
    
    if (error) {
      console.error('❌ خطأ في الحصول على الجلسة:', error.message);
      console.error('تفاصيل الخطأ:', error);
      return null;
    }
    
    if (!data.session) {
      console.log('⚠️ لا توجد جلسة نشطة');
      return null;
    }
    
    console.log('✅ جلسة نشطة موجودة');
    console.log('معرف المستخدم:', data.session.user?.id);
    console.log('البريد الإلكتروني:', data.session.user?.email);
    console.log('وقت الانتهاء:', new Date(data.session.expires_at * 1000).toLocaleString());
    
    return data.session;
  } catch (error) {
    console.error('❌ استثناء أثناء فحص الجلسة:', error);
    return null;
  }
};

// دالة لحذف جميع بيانات المصادقة وإعادة التهيئة
const resetAuthCompletely = async () => {
  console.log('\n🔄 إعادة تعيين المصادقة بالكامل...');
  
  try {
    // 1. تسجيل الخروج
    if (supabase) {
      await supabase.auth.signOut({ scope: 'global' });
      console.log('✅ تم تسجيل الخروج');
    }
    
    // 2. حذف جميع مفاتيح المصادقة
    const keys = await AsyncStorage.getAllKeys();
    const authKeys = keys.filter(key => 
      key.includes('supabase.auth') || 
      key.includes('sb-') ||
      key.includes('@supabase')
    );
    
    if (authKeys.length > 0) {
      await AsyncStorage.multiRemove(authKeys);
      console.log('✅ تم حذف مفاتيح المصادقة:', authKeys);
    }
    
    console.log('✅ تم إعادة تعيين المصادقة بالكامل');
  } catch (error) {
    console.error('❌ خطأ في إعادة التعيين:', error);
  }
};

// تشخيص شامل
const runFullDiagnosis = async () => {
  console.log('🚀 بدء تشخيص مشكلة عدم حفظ الجلسة...\n');
  
  // 1. فحص الإعدادات
  const configValid = checkSupabaseConfig();
  
  // 2. فحص التخزين
  const storageHasData = await checkStorageState();
  
  // 3. فحص الجلسة الحالية
  const currentSession = await checkCurrentSession();
  
  console.log('\n📊 نتائج التشخيص:');
  console.log('إعدادات Supabase صحيحة:', configValid);
  console.log('يوجد بيانات في التخزين:', storageHasData);
  console.log('يوجد جلسة نشطة:', !!currentSession);
  
  if (!configValid) {
    console.log('\n💡 الحلول المقترحة:');
    console.log('1. تأكد من وجود ملف .env مع القيم الصحيحة');
    console.log('2. تحقق من أن SUPABASE_URL و SUPABASE_ANON_KEY غير فارغين');
  }
  
  if (!storageHasData) {
    console.log('\n💡 الحلول المقترحة:');
    console.log('1. تأكد من أن persistSession: true في إعدادات المصادقة');
    console.log('2. تحقق من أن AsyncStorage يعمل بشكل صحيح');
    console.log('3. جرب إعادة تثبيت التطبيق');
  }
  
  if (!currentSession && storageHasData) {
    console.log('\n💡 الحلول المقترحة:');
    console.log('1. قد تكون الجلسة منتهية الصلاحية، جرب تسجيل الدخول مرة أخرى');
    console.log('2. تحقق من أن وظيفة ensure_user_exists تعمل بشكل صحيح');
    console.log('3. جرب إعادة تعيين المصادقة الكاملة');
  }
  
  console.log('\n🔧 خيارات الإصلاح:');
  console.log('1. إعادة تعيين المصادقة الكاملة: resetAuthCompletely()');
  console.log('2. فحص وظيفة ensure_user_exists في قاعدة البيانات');
  console.log('3. التحقق من سياسات RLS في Supabase');
};

// تشغيل التشخيص
if (require.main === module) {
  runFullDiagnosis()
    .then(() => process.exit(0))
    .catch(() => process.exit(1));
}

module.exports = { runFullDiagnosis };