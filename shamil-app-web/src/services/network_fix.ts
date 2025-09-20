// ملف إصلاح مشاكل الشبكة والمصادقة
import { supabase } from './supabase';

// دالة للتحقق من الاتصال بالإنترنت
export const checkInternetConnection = async (): Promise<boolean> => {
  try {
    // محاولة إرسال طلب بسيط للتحقق من الاتصال
    const response = await fetch('https://www.google.com', {
      method: 'HEAD',
      signal: AbortSignal.timeout(5000)
    });
    return response.status === 200;
  } catch (error) {
    console.log('فشل الاتصال بالإنترنت:', error);
    return false;
  }
};

// دالة للتحقق من اتصال Supabase
export const checkSupabaseConnection = async (): Promise<boolean> => {
  try {
    // محاولة الاتصال المباشر بخادم Supabase أولاً
    const supabaseUrl = import.meta.env.VITE_SUPABASE_URL || 'https://vrsuvebfqubzejpmoqqe.supabase.co';
    const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY || 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InZyc3V2ZWJmcXViemVqcG1vcXFlIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTQ1MjEzODIsImV4cCI6MjA3MDA5NzM4Mn0.Mn0GUTVR_FlXBlA2kDkns31wSysWxwG7u7DEWNdF08Q';

    const response = await fetch(`${supabaseUrl}/rest/v1/`, {
      method: 'GET',
      headers: {
        'apikey': supabaseAnonKey,
        'Content-Type': 'application/json'
      },
      signal: AbortSignal.timeout(10000)
    });

    if (response.ok) {
      // إذا نجح الاتصال المباشر، جرب الاستعلام عن جدول profiles
      try {
        const { error } = await supabase.from('profiles').select('count', { count: 'exact', head: true });
        return !error;
      } catch (innerError) {
        console.log('فشل الاستعلام عن profiles لكن الاتصال بالخادم يعمل:', innerError);
        return true; // الاتصال بالخادم يعمل حتى لو فشل الاستعلام
      }
    } else {
      console.log('فشل الاتصال المباشر بالخادم:', response.status);
      return false;
    }
  } catch (error) {
    console.log('فشل الاتصال بـ Supabase:', error);
    return false;
  }
};

// دالة لإظهار رسالة خطأ مناسبة للمستخدم
export const showNetworkError = (error: any): void => {
  let errorMessage = 'حدث خطأ في الاتصال بالشبكة. يرجى التحقق من اتصالك بالإنترنت والمحاولة مرة أخرى.';

  if (error.message) {
    if (error.message.includes('Network request failed')) {
      errorMessage = 'فشل الاتصال بالخادم. يرجى التحقق من اتصالك بالإنترنت والمحاولة مرة أخرى.';
    } else if (error.message.includes('timeout')) {
      errorMessage = 'استغرق الطلب وقتاً طويلاً. يرجى التحقق من اتصالك بالإنترنت والمحاولة مرة أخرى.';
    }
  }

  alert(`خطأ في الاتصال: ${errorMessage}`);
};

// دالة محسّنة لتسجيل الدخول مع معالجة أفضل لأخطاء الشبكة
export const enhancedSignIn = async (email: string, password: string) => {
  try {
    


    // إذا كان كل شيء على ما يرام، حاول تسجيل الدخول
    try {
      const response = await supabase.auth.signInWithPassword({ email, password });

      if (response.error) {
        // إذا كان الخطأ متعلقًا بالشبكة، حاول مرة أخرى
        if (response.error.message.includes('Network request failed') ||
            response.error.message.includes('timeout') ||
            response.error.message.includes('fetch')) {
          console.log('محاولة تسجيل الدخول مرة أخرى بعد فشل الشبكة...');

          // انتظر قليلاً قبل المحاولة مرة أخرى
          await new Promise(resolve => setTimeout(resolve, 1000));

          // محاولة تسجيل الدخول مرة أخرى
          const retryResponse = await supabase.auth.signInWithPassword({ email, password });
          if (retryResponse.error) {
            showNetworkError(retryResponse.error);
            return retryResponse;
          }
          return retryResponse;
        } else {
          showNetworkError(response.error);
        }
      }

      return response;
    } catch (authError: any) {
      console.log('خطأ في المصادقة:', authError);

      // إذا كان الخطأ متعلقًا بالشبكة، حاول مرة أخرى
      if (authError.message.includes('Network request failed') ||
          authError.message.includes('timeout') ||
          authError.message.includes('fetch')) {
        console.log('محاولة تسجيل الدخول مرة أخرى بعد فشل الشبكة...');

        // انتظر قليلاً قبل المحاولة مرة أخرى
        await new Promise(resolve => setTimeout(resolve, 1000));

        // محاولة تسجيل الدخول مرة أخرى
        try {
          const retryResponse = await supabase.auth.signInWithPassword({ email, password });
          if (retryResponse.error) {
            showNetworkError(retryResponse.error);
            return retryResponse;
          }
          return retryResponse;
        } catch (retryError: any) {
          showNetworkError(retryError);
          return { error: { message: retryError.message } };
        }
      } else {
        showNetworkError(authError);
        return { error: { message: authError.message } };
      }
    }
  } catch (error: any) {
    showNetworkError(error);
    return { error: { message: error.message } };
  }
};

// دالة محسّنة لإنشاء حساب مع معالجة أفضل لأخطاء الشبكة
export const enhancedSignUp = async (email: string, password: string, options: any) => {
  try {
    


    // إذا كان كل شيء على ما يرام، حاول إنشاء الحساب
    try {
      const response = await supabase.auth.signUp({ email: email, password: password, options: options });

      if (response.error) {
        console.log('خطأ في إنشاء الحساب:', response.error);
        
        // إذا كان الخطأ متعلقًا بالشبكة، حاول مرة أخرى
        if (response.error.message.includes('Network request failed') ||
            response.error.message.includes('timeout') ||
            response.error.message.includes('fetch') ||
            response.error.message.includes('Cannot connect to server')) {
          console.log('محاولة إنشاء الحساب مرة أخرى بعد فشل الشبكة...');

          // انتظر قليلاً قبل المحاولة مرة أخرى
          await new Promise(resolve => setTimeout(resolve, 1000));

          // محاولة إنشاء الحساب مرة أخرى
          try {
            const retryResponse = await supabase.auth.signUp({ email: email, password: password, options: options });
            if (retryResponse.error) {
              console.log('فشلت المحاولة الثانية:', retryResponse.error);
              showNetworkError(retryResponse.error);
              return retryResponse;
            }
            return retryResponse;
          } catch (retryError: any) {
            console.log('استثناء في المحاولة الثانية:', retryError);
            showNetworkError(retryError);
            return { error: { message: retryError.message } };
          }
        } else {
          // عرض رسالة الخطأ الأصلية للمستخدم
          alert(`فشل إنشاء الحساب: ${response.error.message}`);
          return response;
        }
      }

      return response;
    } catch (authError: any) {
      console.log('خطأ في إنشاء الحساب:', authError);

      // إذا كان الخطأ متعلقًا بالشبكة، حاول مرة أخرى
      if (authError.message.includes('Network request failed') ||
          authError.message.includes('timeout') ||
          authError.message.includes('fetch')) {
        console.log('محاولة إنشاء الحساب مرة أخرى بعد فشل الشبكة...');

        // انتظر قليلاً قبل المحاولة مرة أخرى
        await new Promise(resolve => setTimeout(resolve, 1000));

        // محاولة إنشاء الحساب مرة أخرى
        try {
          const retryResponse = await supabase.auth.signUp({ email: email, password: password, options: options });
          if (retryResponse.error) {
            showNetworkError(retryResponse.error);
            return retryResponse;
          }
          return retryResponse;
        } catch (retryError: any) {
          showNetworkError(retryError);
          return { error: { message: retryError.message } };
        }
      } else {
        showNetworkError(authError);
        return { error: { message: authError.message } };
      }
    }
  } catch (error: any) {
    showNetworkError(error);
    return { error: { message: error.message } };
  }
};
