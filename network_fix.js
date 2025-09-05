
import { supabase } from './lib/supabase';
import { Alert } from 'react-native';

// دالة للتحقق من الاتصال بالإنترنت
export const checkInternetConnection = async () => {
  try {
    // محاولة إرسال طلب بسيط للتحقق من الاتصال
    const response = await fetch('https://www.google.com', { 
      method: 'HEAD', 
      timeout: 5000 
    });
    return response.status === 200;
  } catch (error) {
    console.log('فشل الاتصال بالإنترنت:', error);
    return false;
  }
};

// دالة للتحقق من اتصال Supabase
export const checkSupabaseConnection = async () => {
  try {
    // محاولة الاتصال المباشر بخادم Supabase أولاً
    const supabaseUrl = 'https://vrsuvebfqubzejpmoqqe.supabase.co';
    const response = await fetch(`${supabaseUrl}/rest/v1/`, {
      method: 'GET',
      headers: {
        'apikey': 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InZyc3V2ZWJmcXViemVqcG1vcXFlIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTQ1MjEzODIsImV4cCI6MjA3MDA5NzM4Mn0.Mn0GUTVR_FlXBlA2kDkns31wSysWxwG7u7DEWNdF08Q',
        'Content-Type': 'application/json'
      },
      timeout: 10000
    });

    if (response.ok) {
      // إذا نجح الاتصال المباشر، جرب الاستعلام عن جدول profiles
      try {
        const { data, error } = await supabase.from('profiles').select('count', { count: 'exact', head: true });
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
export const showNetworkError = (error) => {
  let errorMessage = 'حدث خطأ في الاتصال بالشبكة. يرجى التحقق من اتصالك بالإنترنت والمحاولة مرة أخرى.';

  if (error.message) {
    if (error.message.includes('Network request failed')) {
      errorMessage = 'فشل الاتصال بالخادم. يرجى التحقق من اتصالك بالإنترنت والمحاولة مرة أخرى.';
    } else if (error.message.includes('timeout')) {
      errorMessage = 'استغرق الطلب وقتاً طويلاً. يرجى التحقق من اتصالك بالإنترنت والمحاولة مرة أخرى.';
    }
  }

  Alert.alert('خطأ في الاتصال', errorMessage);
};

// دالة محسّنة لتسجيل الدخول مع معالجة أفضل لأخطاء الشبكة
export const enhancedSignIn = async (email, password) => {
  try {
    // أولاً، تحقق من الاتصال بالإنترنت
    const hasInternet = await checkInternetConnection();
    if (!hasInternet) {
      showNetworkError({ message: 'Network request failed' });
      return { error: { message: 'No internet connection' } };
    }

    // ثانياً، تحقق من الاتصال بـ Supabase
    const canConnectToSupabase = await checkSupabaseConnection();
    if (!canConnectToSupabase) {
      showNetworkError({ message: 'Cannot connect to Supabase' });
      return { error: { message: 'Cannot connect to server' } };
    }

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
    } catch (authError) {
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
        } catch (retryError) {
          showNetworkError(retryError);
          return { error: { message: retryError.message } };
        }
      } else {
        showNetworkError(authError);
        return { error: { message: authError.message } };
      }
    }
  } catch (error) {
    showNetworkError(error);
    return { error: { message: error.message } };
  }
};

// دالة محسّنة لإنشاء حساب مع معالجة أفضل لأخطاء الشبكة
export const enhancedSignUp = async (email, password, options) => {
  try {
    // أولاً، تحقق من الاتصال بالإنترنت
    const hasInternet = await checkInternetConnection();
    if (!hasInternet) {
      showNetworkError({ message: 'Network request failed' });
      return { error: { message: 'No internet connection' } };
    }

    // ثانياً، تحقق من الاتصال بـ Supabase
    const canConnectToSupabase = await checkSupabaseConnection();
    if (!canConnectToSupabase) {
      showNetworkError({ message: 'Cannot connect to Supabase' });
      return { error: { message: 'Cannot connect to server' } };
    }

    // إذا كان كل شيء على ما يرام، حاول إنشاء الحساب
    try {
      const response = await supabase.auth.signUp({ email, password, options });

      if (response.error) {
        // إذا كان الخطأ متعلقًا بالشبكة، حاول مرة أخرى
        if (response.error.message.includes('Network request failed') || 
            response.error.message.includes('timeout') ||
            response.error.message.includes('fetch')) {
          console.log('محاولة إنشاء الحساب مرة أخرى بعد فشل الشبكة...');

          // انتظر قليلاً قبل المحاولة مرة أخرى
          await new Promise(resolve => setTimeout(resolve, 1000));

          // محاولة إنشاء الحساب مرة أخرى
          const retryResponse = await supabase.auth.signUp({ email, password, options });
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
    } catch (authError) {
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
          const retryResponse = await supabase.auth.signUp({ email, password, options });
          if (retryResponse.error) {
            showNetworkError(retryResponse.error);
            return retryResponse;
          }
          return retryResponse;
        } catch (retryError) {
          showNetworkError(retryError);
          return { error: { message: retryError.message } };
        }
      } else {
        showNetworkError(authError);
        return { error: { message: authError.message } };
      }
    }
  } catch (error) {
    showNetworkError(error);
    return { error: { message: error.message } };
  }
};
