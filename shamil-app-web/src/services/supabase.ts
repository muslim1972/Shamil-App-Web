import { createClient, type AuthFlowType } from '@supabase/supabase-js';

// استخدم متغيرات البيئة أو قيم افتراضية للتطوير
export const supabaseUrl = import.meta.env.VITE_SUPABASE_URL || 'https://your-project-id.supabase.co';
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY || 'your-anon-key';

// إعدادات المصادقة
const authOptions = {
  storage: localStorage,
  autoRefreshToken: true,
  persistSession: true,
  detectSessionInUrl: false,
  debug: false,
  storageKey: 'supabase.auth.token',
  flowType: 'pkce' as AuthFlowType, // Corrected type
};

// إنشاء عميل Supabase
export const supabase = createClient(supabaseUrl, supabaseAnonKey, {
  auth: authOptions,
});

// دالة لإعادة تعيين الجلسة بالكامل
export const resetSession = async () => {
  try {
    const keys = Object.keys(localStorage);
    const supabaseKeys = keys.filter(key =>
      key.includes('supabase.auth') ||
      key.includes('sb-') ||
      key.includes('@supabase')
    );

    if (supabaseKeys.length > 0) {
      supabaseKeys.forEach(key => localStorage.removeItem(key));
      console.log('تم تنظيف ذاكرة التخزين المؤقت للمصادقة');
    }

    await supabase.auth.signOut({ scope: 'local' });

    return true;
  } catch (error) {
    console.error('خطأ في إعادة تعيين الجلسة:', error);
    return false;
  }
};

// Other functions seem to be unused or problematic, commenting them out for now

/*
// تهيئة Supabase
export const initializeSupabase = () => {
  console.log('Supabase initialized with URL:', supabaseUrl);
  return supabase;
};

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
  } catch (e: any) {
    console.error('استثناء أثناء التحقق من الجلسة:', e.message);
    return null;
  }
};

// دالة للتحقق من صلاحية الجلسة وتجديدها إذا لزم الأمر
export const validateAndRefreshSession = async () => {
  try {
    const { data: { session } } = await supabase.auth.getSession();
    if (!session) {
      return false;
    }

    const expiresAt = session.expires_at;
    if (!expiresAt) return false; // Check if expiresAt exists

    const now = Math.floor(Date.now() / 1000);

    if (expiresAt - now < 300) {
      const { error } = await supabase.auth.refreshSession();
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
*/