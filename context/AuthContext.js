import React, { useState, useEffect, useContext, createContext } from 'react';
import { supabase, checkSession, resetSupabaseClient } from '../lib/supabase';
import AsyncStorage from '@react-native-async-storage/async-storage';

const AuthContext = createContext({
  session: null,
  user: null,
  loading: true,
  signOut: async () => {},
  resetSession: async () => {},
});

export const AuthProvider = ({ children }) => {
  const [session, setSession] = useState(null);
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let isMounted = true;
    const initSession = async () => {
      try {
        const { data, error } = await supabase.auth.getSession();
        if (!isMounted) return;
        if (error) {
          setSession(null);
          setUser(null);
        } else if (data?.session) {
          setSession(data.session);
          setUser(data.session.user);
        } else {
          setSession(null);
          setUser(null);
        }
      } finally {
        if (isMounted) setLoading(false);
      }
    };
    initSession();
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      (_event, session) => {
        if (!isMounted) return;
        if (_event === 'SIGNED_IN' && session) {
          setSession(session);
          setUser(session.user);
        } else if (_event === 'SIGNED_OUT') {
          setSession(null);
          setUser(null);
        } else if (_event === 'TOKEN_REFRESHED' && session) {
          setSession(session);
          setUser(session.user);
        }
      }
    );
    return () => {
      isMounted = false;
      subscription?.unsubscribe();
    };
  }, []);

  // دالة لتنظيف ذاكرة التخزين المؤقت المتعلقة بالمصادقة
  const clearAuthCache = async () => {
    try {
      // الحصول على جميع المفاتيح في AsyncStorage
      const keys = await AsyncStorage.getAllKeys();
      
      // تصفية المفاتيح المتعلقة بالمصادقة في Supabase
      const supabaseKeys = keys.filter(key => 
        key.includes('supabase.auth') || 
        key.includes('sb-') ||
        key.includes('@supabase')
      );
      
      // حذف المفاتيح المتعلقة بالمصادقة
      if (supabaseKeys.length > 0) {
        await AsyncStorage.multiRemove(supabaseKeys);
  // ...existing code...
      } else {
        // حذف المفاتيح القديمة للتأكد
        await AsyncStorage.removeItem('supabase.auth.token');
        await AsyncStorage.removeItem('supabase.auth.refreshToken');
  // ...existing code...
      }
    } catch (error) {
      console.error('خطأ في تنظيف ذاكرة التخزين المؤقت:', error);
    }
  };

  // دالة لإعادة تعيين الجلسة - مبسطة
  const resetSession = async () => {
  setLoading(true);
    
    const attemptReset = async () => {
      try {
        // تنظيف ذاكرة التخزين المؤقت أولاً لضمان عدم وجود بيانات قديمة
  await clearAuthCache();
        
        // إعادة تعيين عميل Supabase
  const newClient = resetSupabaseClient();
  Object.assign(supabase, newClient);
        
        // التحقق من الجلسة الحالية
  const currentSession = await checkSession();
        
  if (!currentSession) {
          // محاولة تحديث الجلسة
          const { data, error } = await supabase.auth.refreshSession();
          
          if (error) {
            // في حالة خطأ في الشبكة، لا نسجل الخروج تلقائياً
            if (error.message && error.message.includes('network')) {
              console.log('خطأ في الشبكة، محاولة مرة أخرى...');
              return false;
            }
            
            // فقط في حالة أخطاء أخرى نسجل الخروج
            await supabase.auth.signOut({ scope: 'local' });
            setUser(null);
            setSession(null);
            return false;
          } else if (data.session) {
            // التحقق من وجود المستخدم في قاعدة البيانات
            try {
              const { error: userError } = await supabase.rpc('ensure_user_exists', {
                user_uuid: data.session.user.id,
              });
              
              if (userError) {
                // نعيد المحاولة مع check_user_exists
                const { data: userExists } = await supabase.rpc('check_user_exists', { 
                  p_user_id: data.session.user.id 
                });
                if (!userExists) {
                  return false;
                }
              }
              setUser(data.session.user);
              setSession(data.session);
              return true;
            } catch (err) {
              setUser(data.session.user);
              setSession(data.session);
              return true; // نعيد الجلسة على أي حال
            }
          } else {
            setUser(null);
            setSession(null);
            return false;
          }
        } else {
          // التحقق من وقت انتهاء الصلاحية
          const expiresAt = currentSession.expires_at;
          const now = Math.floor(Date.now() / 1000);
          
          // إذا كانت الجلسة على وشك الانتهاء (أقل من 5 دقائق) أو منتهية
          if (expiresAt - now < 300 || expiresAt <= now) {
            const { data, error } = await supabase.auth.refreshSession();
            
            if (error) {
              // في حالة خطأ في الشبكة، لا نسجل الخروج
              if (error.message && error.message.includes('network')) {
                console.log('خطأ في الشبكة أثناء التجديد...');
                return false;
              }
              
              await clearAuthCache();
              await supabase.auth.signOut({ scope: 'local' });
              setUser(null);
              setSession(null);
              return false;
            } else if (data.session) {
              // التحقق من وجود المستخدم
              try {
                await supabase.rpc('ensure_user_exists', {
                  user_uuid: data.session.user.id,
                });
                setUser(data.session.user);
                setSession(data.session);
                return true;
              } catch (err) {
                console.error('خطأ في ensure_user_exists:', err);
                setUser(data.session.user);
                setSession(data.session);
                return true;
              }
            }
            return false;
          } else {
            // الجلسة صالحة، التحقق من وجود المستخدم
            try {
              const { error: userError } = await supabase.rpc('ensure_user_exists', {
                user_uuid: currentSession.user.id,
              });
            } catch (err) {}
            setUser(currentSession.user);
            setSession(currentSession);
            return true;
          }
        }
      } catch (e) {
  // ...existing code...
        
        // في حالة خطأ الشبكة، لا نسجل الخروج تلقائياً
        if (e.message && (e.message.includes('network') || e.message.includes('offline'))) {
          return false;
        }
        
        // فقط في حالة أخطاء حرجة نسجل الخروج
  await clearAuthCache();
  await supabase.auth.signOut({ scope: 'local' });
  const newClient = resetSupabaseClient();
  Object.assign(supabase, newClient);
  setUser(null);
  setSession(null);
  return false;
      }
    };
    
    try {
      // محاولة واحدة فقط لإعادة تعيين الجلسة
      await attemptReset();
    } finally {
      setLoading(false);
    }
  };

  const value = {
    session,
    user,
    loading,
    signOut: async () => {
      setLoading(true);
      try {
        await clearAuthCache();
        const { error } = await supabase.auth.signOut({ scope: 'global' });
        if (error) {
          await supabase.auth.signOut({ scope: 'local' });
        }
        const newClient = resetSupabaseClient();
        Object.assign(supabase, newClient);
        setUser(null);
        setSession(null);
        await clearAuthCache();
        return { error };
      } catch (e) {
        setUser(null);
        setSession(null);
        await clearAuthCache();
        return { error: e };
      } finally {
        setLoading(false);
      }
    },
    resetSession,
  };

  // لا نعرض أي واجهة حتى انتهاء تحميل الجلسة
  return (
    <AuthContext.Provider value={value}>
      {loading ? null : children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};