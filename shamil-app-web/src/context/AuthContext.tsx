import React, { createContext, useContext, useEffect, useState, useCallback, useMemo } from 'react';
import { supabase } from '../services/supabase';
import type { Session, User } from '@supabase/supabase-js';

// مفاتيح التخزين المحلي
const AUTH_CACHE_KEY = 'shamil_auth_cache';
const SESSION_CACHE_KEY = 'shamil_session_cache';

interface AuthContextType {
  session: Session | null;
  user: User | null;
  loading: boolean;
  signIn: (email: string, password: string) => Promise<any>;
  signUp: (email: string, password: string, name: string) => Promise<any>;
  signOut: () => Promise<void>;
  clearCache: () => void;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

// دالة مساعدة للحصول على البيانات المخزنة محلياً
const getCacheData = (key: string) => {
  try {
    const data = localStorage.getItem(key);
    return data ? JSON.parse(data) : null;
  } catch (error) {
    console.error('Error getting cache data:', error);
    return null;
  }
};

// دالة مساعدة لتخزين البيانات محلياً
const setCacheData = (key: string, data: any) => {
  try {
    localStorage.setItem(key, JSON.stringify(data));
  } catch (error) {
    console.error('Error setting cache data:', error);
  }
};

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [session, setSession] = useState<Session | null>(null);
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);

  // دالة لمسح التخزين المؤقت
  const clearCache = useCallback(() => {
    localStorage.removeItem(AUTH_CACHE_KEY);
    localStorage.removeItem(SESSION_CACHE_KEY);
  }, []);

  // تحسين جلب الجلسة مع التخزين المؤقت
  useEffect(() => {
    let isMounted = true;

    const fetchSession = async () => {
      try {
        // محاولة الحصول على البيانات من التخزين المؤقت أولاً
        const cachedSession = getCacheData(SESSION_CACHE_KEY);
        const cachedUser = getCacheData(AUTH_CACHE_KEY);

        if (cachedSession && cachedUser && isMounted) {
          setSession(cachedSession);
          setUser(cachedUser);
        }

        // جلب البيانات من الخادم
        const { data, error } = await supabase.auth.getSession();

        if (isMounted) {
          if (error) {
            setSession(null);
            setUser(null);
            clearCache();
          } else {
            setSession(data.session);
            setUser(data.session?.user ?? null);

            // تخزين البيانات في التخزين المؤقت
            if (data.session) {
              setCacheData(SESSION_CACHE_KEY, data.session);
              setCacheData(AUTH_CACHE_KEY, data.session?.user);
            }
          }
        }
      } catch (error) {
        console.error('Error fetching session:', error);
        if (isMounted) {
          setSession(null);
          setUser(null);
          clearCache();
        }
      } finally {
        if (isMounted) {
          setLoading(false);
        }
      }
    };

    fetchSession();

    const { data: authListener } = supabase.auth.onAuthStateChange((_event, session) => {
      if (isMounted) {
        setSession(session);
        setUser(session?.user ?? null);

        // تحديث التخزين المؤقت عند تغيير حالة المصادقة
        if (session) {
          setCacheData(SESSION_CACHE_KEY, session);
          setCacheData(AUTH_CACHE_KEY, session?.user);
        } else {
          clearCache();
        }
      }
    });

    return () => {
      isMounted = false;
      authListener?.subscription?.unsubscribe();
    };
  }, [clearCache]);

  // تحسين وظائف المصادقة
  const signIn = useCallback(async (email: string, password: string) => {
    const { data, error } = await supabase.auth.signInWithPassword({ email, password });
    if (error) throw error;
    return data;
  }, []);

  const signUp = useCallback(async (email: string, password: string, name: string) => {
    const { data, error } = await supabase.auth.signUp({
      email,
      password,
      options: {
        data: { name },
      },
    });
    if (error) throw error;
    return data;
  }, []);

  const signOut = useCallback(async () => {
    const { error } = await supabase.auth.signOut();
    if (error) throw error;
    // مسح التخزين المؤقت عند تسجيل الخروج
    clearCache();
  }, [clearCache]);

  // استخدام useMemo لمنع إعادة إنشاء الكائن عند كل تصيير
  const value = useMemo(() => ({
    session,
    user,
    loading,
    signIn,
    signUp,
    signOut,
    clearCache,
  }), [session, user, loading, signIn, signUp, signOut, clearCache]);

  return (
    <AuthContext.Provider value={value}>
      {children}
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