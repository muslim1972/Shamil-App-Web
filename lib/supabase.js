import AsyncStorage from '@react-native-async-storage/async-storage';
import { createClient } from '@supabase/supabase-js';
import { SUPABASE_URL, SUPABASE_ANON_KEY } from '@env';

const supabaseUrl = SUPABASE_URL;
const supabaseAnonKey = SUPABASE_ANON_KEY;

// تكوين خيارات المصادقة بشكل أكثر تفصيلاً
const authOptions = {
  storage: AsyncStorage,
  autoRefreshToken: true,
  persistSession: true,
  detectSessionInUrl: false,
  debug: false, // تعطيل وضع التصحيح في جميع البيئات
  storageKey: 'supabase.auth.token',
  flowType: 'pkce', // استخدام PKCE للأمان
  // إعدادات إضافية للتعامل مع انتهاء صلاحية الجلسة
  onAuthStateChange: (event, session) => {
    // تقليل الرسائل المطبوعة
    if (event === 'SIGNED_OUT' || event === 'TOKEN_REFRESHED') {
      // console.log('تم تحديث حالة المصادقة:', event);
    }
  },
  // إعدادات إضافية للتعامل مع أخطاء الشبكة
  fetch: (url, options) => {
    // إضافة مهلة للطلبات
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 15000); // 15 ثانية

    return fetch(url, {
      ...options,
      signal: controller.signal
    }).finally(() => {
      clearTimeout(timeoutId);
    });
  }
};

export const supabase = createClient(supabaseUrl, supabaseAnonKey, {
  auth: authOptions,
});

// دالة لإعادة تعيين عميل Supabase
export const resetSupabaseClient = () => {
  return createClient(supabaseUrl, supabaseAnonKey, {
    auth: authOptions,
  });
};

// دالة للتحقق من حالة الجلسة الحالية
export const checkSession = async () => {
  try {
    const { data, error } = await supabase.auth.getSession();
    if (error) {
      console.error('خطأ في جلب الجلسة:', error.message);
      return null;
    }
    return data.session;
  } catch (e) {
    console.error('استثناء أثناء التحقق من الجلسة:', e.message);
    return null;
  }
};

// دالة لإعادة تعيين الجلسة بالكامل
export const resetSession = async () => {
  try {
    // 1. تنظيف ذاكرة التخزين المؤقت للمصادقة
    const keys = await AsyncStorage.getAllKeys();
    const supabaseKeys = keys.filter(key => 
      key.includes('supabase.auth') || 
      key.includes('sb-') ||
      key.includes('@supabase')
    );
    
    if (supabaseKeys.length > 0) {
      await AsyncStorage.multiRemove(supabaseKeys);
      // console.log('تم تنظيف ذاكرة التخزين المؤقت للمصادقة');
    }
    
    // 2. تسجيل الخروج من الجلسة الحالية
    await supabase.auth.signOut({ scope: 'local' });
    
    // 3. إعادة تعيين عميل Supabase
    const newClient = resetSupabaseClient();
    
    // 4. استبدال العميل القديم بالجديد
    Object.assign(supabase, newClient);
    
    // console.log('تم إعادة تعيين الجلسة بنجاح');
    return true;
  } catch (error) {
    console.error('خطأ في إعادة تعيين الجلسة:', error);
    return false;
  }
};

// دالة للتحقق من صلاحية الجلسة وتجديدها إذا لزم الأمر
export const validateAndRefreshSession = async () => {
  try {
    const session = await checkSession();
    if (!session) {
      // console.log('لا توجد جلسة نشطة');
      return false;
    }
    
    // التحقق من وقت انتهاء الصلاحية
    const expiresAt = session.expires_at;
    const now = Math.floor(Date.now() / 1000);
    
    // إذا كانت الجلسة على وشك الانتهاء (أقل من 5 دقائق)
    if (expiresAt - now < 300) {
      // console.log('الجلسة على وشك الانتهاء، جاري تجديدها...');
      const { data, error } = await supabase.auth.refreshSession();
      if (error) {
        console.error('خطأ في تجديد الجلسة:', error.message);
        return false;
      }
      
    }
    
    return true;
  } catch (error) {
    console.error('خطأ في التحقق من صلاحية الجلسة:', error);
    return false;
  }
};