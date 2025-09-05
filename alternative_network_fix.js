
// ملف إصلاح إضافي لمعالجة مشاكل الاتصال بشكل أفضل
import { supabase } from './lib/supabase';
import { Alert } from 'react-native';

// دالة لإنشاء عميل Supabase بديل مع إعدادات مختلفة
export const createAlternativeSupabaseClient = () => {
  const { createClient } = require('@supabase/supabase-js');
  const AsyncStorage = require('@react-native-async-storage/async-storage').default;

  // إعدادات بديلة للتعامل مع مشاكل الشبكة
  const alternativeAuthOptions = {
    storage: AsyncStorage,
    autoRefreshToken: true,
    persistSession: true,
    detectSessionInUrl: false,
    debug: false,
    storageKey: 'supabase.auth.token',
    flowType: 'pkce',
    // إعدادات fetch مختلفة
    fetch: (url, options = {}) => {
      // إضافة مهلة أطول للطلبات
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 30000); // 30 ثانية

      // نسخ الخيارات وتعديلها
      const fetchOptions = {
        ...options,
        signal: controller.signal,
        headers: {
          ...options.headers,
          // إضافة رؤوس إضافية قد تساعد في الاتصال
          'Cache-Control': 'no-cache',
          'Pragma': 'no-cache'
        }
      };

      return fetch(url, fetchOptions)
        .then(response => {
          clearTimeout(timeoutId);
          return response;
        })
        .catch(error => {
          clearTimeout(timeoutId);
          throw error;
        });
    }
  };

  // إنشاء عميل جديد بالإعدادات البديلة
  return createClient(
    'https://vrsuvebfqubzejpmoqqe.supabase.co',
    'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InZyc3V2ZWJmcXViemVqcG1vcXFlIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTQ1MjEzODIsImV4cCI6MjA3MDA5NzM4Mn0.Mn0GUTVR_FlXBlA2kDkns31wSysWxwG7u7DEWNdF08Q',
    { auth: alternativeAuthOptions }
  );
};

// دالة لتسجيل الدخول باستخدام العميل البديل
export const signInWithAlternativeClient = async (email, password) => {
  try {
    const alternativeClient = createAlternativeSupabaseClient();
    const response = await alternativeClient.auth.signInWithPassword({ email, password });

    // إذا نجحت المصادقة، قم بتحديث العميل الأصلي
    if (response.data.user && !response.error) {
      // نسخ بيانات الجلسة إلى العميل الأصلي
      const { data: { session } } = await alternativeClient.auth.getSession();
      if (session) {
        await supabase.auth.setSession({
          access_token: session.access_token,
          refresh_token: session.refresh_token
        });
      }
    }

    return response;
  } catch (error) {
    console.log('فشل تسجيل الدخول بالعميل البديل:', error);
    return { error: { message: error.message } };
  }
};

// دالة لإنشاء حساب باستخدام العميل البديل
export const signUpWithAlternativeClient = async (email, password, options) => {
  try {
    const alternativeClient = createAlternativeSupabaseClient();
    const response = await alternativeClient.auth.signUp({ email, password, options });

    // إذا نجح إنشاء الحساب، قم بتحديث العميل الأصلي
    if (response.data.user && !response.error) {
      // نسخ بيانات الجلسة إلى العميل الأصلي
      const { data: { session } } = await alternativeClient.auth.getSession();
      if (session) {
        await supabase.auth.setSession({
          access_token: session.access_token,
          refresh_token: session.refresh_token
        });
      }
    }

    return response;
  } catch (error) {
    console.log('فشل إنشاء الحساب بالعميل البديل:', error);
    return { error: { message: error.message } };
  }
};

// دالة للتحقق من إمكانية الوصول لخوادم Supabase
export const testSupabaseConnectivity = async () => {
  try {
    // محاولة الوصول مباشرة لخادم Supabase
    const response = await fetch('https://vrsuvebfqubzejpmoqqe.supabase.co/rest/v1/', {
      method: 'GET',
      headers: {
        'apikey': 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InZyc3V2ZWJmcXViemVqcG1vcXFlIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTQ1MjEzODIsImV4cCI6MjA3MDA5NzM4Mn0.Mn0GUTVR_FlXBlA2kDkns31wSysWxwG7u7DEWNdF08Q',
        'Content-Type': 'application/json'
      },
      timeout: 10000
    });

    return {
      success: response.ok,
      status: response.status,
      statusText: response.statusText
    };
  } catch (error) {
    return {
      success: false,
      error: error.message
    };
  }
};
