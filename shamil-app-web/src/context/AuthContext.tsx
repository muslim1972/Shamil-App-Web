import React, { createContext, useContext, useEffect, useState } from 'react';
import { supabase } from '../services/supabase';
import { enhancedSignIn, enhancedSignUp } from '../services/network_fix';
import { signInWithAlternativeClient, signUpWithAlternativeClient } from '../services/alternative_network_fix';
import type { Session, User } from '@supabase/supabase-js';

interface AuthContextType {
  session: Session | null;
  user: User | null;
  loading: boolean;
  signIn: (email: string, password: string) => Promise<any>;
  signUp: (email: string, password: string, name: string) => Promise<any>; // Added signUp
  signOut: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [session, setSession] = useState<Session | null>(null);
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let isMounted = true;

    const fetchSession = async () => {
      try {
        const { data, error } = await supabase.auth.getSession();
        if (isMounted) {
          if (error) {
            setSession(null);
            setUser(null);
          } else {
            setSession(data.session);
            setUser(data.session?.user ?? null);
          }
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
      }
    });

    return () => {
      isMounted = false;
      authListener?.subscription?.unsubscribe();
    };
  }, []);

  const signIn = async (email: string, password: string) => {
    // محاولة تسجيل الدخول باستخدام العميل الأصلي أولاً
    let response = await enhancedSignIn(email, password);

    // إذا فشل العميل الأصلي، جرب العميل البديل
    if (response.error && response.error.message.includes('Cannot connect to server')) {
      console.log('محاولة تسجيل الدخول باستخدام العميل البديل...');
      alert('جاري محاولة الاتصال بطريقة بديلة...');

      try {
        response = await signInWithAlternativeClient(email, password);
      } catch (altError: any) {
        console.log('فشل العميل البديل أيضاً:', altError);
        response = { error: { message: 'فشل جميع محاولات الاتصال بالخادم' } };
      }
    }

    // التحقق من وجود خاصية data في الاستجابة قبل الوصول إليها
    const data = 'data' in response ? response.data : null;
    const error = response.error;
    if (error) throw error;
    return data;
  };

  const signUp = async (email: string, password: string, name: string) => {
    console.log('بدء عملية إنشاء حساب جديد...');
    
    // محاولة إنشاء الحساب باستخدام العميل الأصلي أولاً
    console.log('محاولة إنشاء الحساب باستخدام العميل الأصلي...');
    let response = await enhancedSignUp(
      email,
      password,
      { data: { username: name } }
    );
    
    

    // إذا فشل العميل الأصلي، جرب العميل البديل
    if (response.error && 
        (response.error.message.includes('Cannot connect to server') || 
         response.error.message.includes('Network request failed') ||
         response.error.message.includes('fetch'))) {
      console.log('محاولة إنشاء الحساب باستخدام العميل البديل...');
      alert('جاري محاولة الاتصال بطريقة بديلة...');

      try {
        response = await signUpWithAlternativeClient(
          email,
          password,
          { data: { username: name } }
        );
        console.log('نتيجة المحاولة الثانية:', response);
      } catch (altError: any) {
        console.log('فشل العميل البديل أيضاً:', altError);
        response = { error: { message: 'فشل جميع محاولات الاتصال بالخادم' } };
      }
    }

    // التحقق من وجود خاصية data في الاستجابة قبل الوصول إليها
    const data = 'data' in response ? response.data : null;
    const error = response.error;
    
    if (error) {
      console.error('خطأ نهائي في إنشاء الحساب:', error);
      throw error;
    }
    
    console.log('تم إنشاء الحساب بنجاح:', data);
    return data;
  };

  const signOut = async () => {
    const { error } = await supabase.auth.signOut();
    if (error) throw error;
  };

  const value = {
    session,
    user,
    loading,
    signIn,
    signUp,
    signOut,
  };

  return (
    <AuthContext.Provider value={value}>
      {!loading && children}
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