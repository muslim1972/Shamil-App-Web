// ملف لتشخيص حالة المصادقة وعرض معلومات مفصلة عن المشكلة

import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, ScrollView, ActivityIndicator } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { supabase } from './lib/supabase';

/**
 * الحصول على حالة الجلسة الحالية
 */
const getSessionStatus = async () => {
  try {
    const { data: { session } } = await supabase.auth.getSession();
    
    if (!session) {
      return { hasSession: false, message: 'لا توجد جلسة' };
    }
    
    const now = Math.floor(Date.now() / 1000);
    const expiresAt = session?.expires_at;
    const isExpired = expiresAt && now >= expiresAt;
    
    return { 
      hasSession: true, 
      isExpired, 
      expiresAt,
      currentTime: now,
      timeRemaining: expiresAt ? expiresAt - now : null,
      user: session.user
    };
  } catch (error) {
    return { hasSession: false, error, message: 'خطأ في الحصول على حالة الجلسة' };
  }
};

/**
 * الحصول على مفاتيح التخزين المؤقت المتعلقة بالمصادقة
 */
const getAuthStorageKeys = async () => {
  try {
    const keys = await AsyncStorage.getAllKeys();
    const authKeys = keys.filter(key => 
      key.includes('supabase.auth') || 
      key.includes('sb-') ||
      key.includes('@supabase')
    );
    
    const authData = {};
    
    // الحصول على قيم المفاتيح
    for (const key of authKeys) {
      try {
        const value = await AsyncStorage.getItem(key);
        authData[key] = value;
      } catch (error) {
        authData[key] = `خطأ في الحصول على القيمة: ${error.message}`;
      }
    }
    
    return { authKeys, authData };
  } catch (error) {
    return { error, message: 'خطأ في الحصول على مفاتيح التخزين المؤقت' };
  }
};

/**
 * التحقق من وجود المستخدم في قاعدة البيانات
 */
const checkUserInDatabase = async (userId) => {
  if (!userId) {
    return { exists: false, message: 'معرف المستخدم غير متوفر' };
  }
  
  try {
    // التحقق من وجود المستخدم في جدول profiles
    const { data: profile, error: profileError } = await supabase
      .from('profiles')
      .select('*')
      .eq('id', userId)
      .single();
    
    if (profileError) {
      return { exists: false, error: profileError, message: 'خطأ في التحقق من وجود المستخدم' };
    }
    
    return { exists: !!profile, profile };
  } catch (error) {
    return { exists: false, error, message: 'خطأ في التحقق من وجود المستخدم' };
  }
};

/**
 * مكون واجهة المستخدم لتشخيص حالة المصادقة
 */
const AuthDiagnosticScreen = () => {
  const [sessionStatus, setSessionStatus] = useState(null);
  const [authStorage, setAuthStorage] = useState(null);
  const [userStatus, setUserStatus] = useState(null);
  const [loading, setLoading] = useState(false);
  
  // تحميل بيانات التشخيص
  const loadDiagnosticData = async () => {
    setLoading(true);
    
    // الحصول على حالة الجلسة
    const session = await getSessionStatus();
    setSessionStatus(session);
    
    // الحصول على مفاتيح التخزين المؤقت
    const storage = await getAuthStorageKeys();
    setAuthStorage(storage);
    
    // التحقق من وجود المستخدم في قاعدة البيانات
    if (session.hasSession && session.user) {
      const user = await checkUserInDatabase(session.user.id);
      setUserStatus(user);
    } else {
      setUserStatus({ exists: false, message: 'لا توجد جلسة مستخدم' });
    }
    
    setLoading(false);
  };
  
  // تحميل البيانات عند فتح الشاشة
  useEffect(() => {
    loadDiagnosticData();
  }, []);
  
  // تنسيق التاريخ
  const formatDate = (timestamp) => {
    if (!timestamp) return 'غير متوفر';
    return new Date(timestamp * 1000).toLocaleString('ar-SA');
  };
  
  // تنسيق الوقت المتبقي
  const formatTimeRemaining = (seconds) => {
    if (!seconds) return 'غير متوفر';
    if (seconds <= 0) return 'منتهي الصلاحية';
    
    const hours = Math.floor(seconds / 3600);
    const minutes = Math.floor((seconds % 3600) / 60);
    const remainingSeconds = seconds % 60;
    
    return `${hours} ساعة ${minutes} دقيقة ${remainingSeconds} ثانية`;
  };
  
  return (
    <View style={styles.container}>
      <Text style={styles.title}>تشخيص حالة المصادقة</Text>
      
      <TouchableOpacity 
        style={styles.refreshButton} 
        onPress={loadDiagnosticData}
        disabled={loading}
      >
        <Text style={styles.buttonText}>تحديث البيانات</Text>
      </TouchableOpacity>
      
      {loading ? (
        <ActivityIndicator size="large" color="#2196F3" style={styles.loader} />
      ) : (
        <ScrollView style={styles.contentContainer}>
          {/* حالة الجلسة */}
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>حالة الجلسة</Text>
            
            {sessionStatus ? (
              <View>
                <Text style={styles.statusItem}>
                  الحالة: {sessionStatus.hasSession ? 'موجودة' : 'غير موجودة'}
                </Text>
                
                {sessionStatus.hasSession && (
                  <>
                    <Text style={styles.statusItem}>
                      منتهية الصلاحية: {sessionStatus.isExpired ? 'نعم' : 'لا'}
                    </Text>
                    <Text style={styles.statusItem}>
                      تاريخ انتهاء الصلاحية: {formatDate(sessionStatus.expiresAt)}
                    </Text>
                    <Text style={styles.statusItem}>
                      الوقت المتبقي: {formatTimeRemaining(sessionStatus.timeRemaining)}
                    </Text>
                    <Text style={styles.statusItem}>
                      معرف المستخدم: {sessionStatus.user?.id || 'غير متوفر'}
                    </Text>
                    <Text style={styles.statusItem}>
                      البريد الإلكتروني: {sessionStatus.user?.email || 'غير متوفر'}
                    </Text>
                  </>
                )}
                
                {sessionStatus.error && (
                  <Text style={styles.errorText}>
                    خطأ: {sessionStatus.error.message || JSON.stringify(sessionStatus.error)}
                  </Text>
                )}
              </View>
            ) : (
              <Text>لا توجد معلومات</Text>
            )}
          </View>
          
          {/* حالة المستخدم في قاعدة البيانات */}
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>حالة المستخدم في قاعدة البيانات</Text>
            
            {userStatus ? (
              <View>
                <Text style={styles.statusItem}>
                  موجود في قاعدة البيانات: {userStatus.exists ? 'نعم' : 'لا'}
                </Text>
                
                {userStatus.exists && userStatus.profile && (
                  <>
                    <Text style={styles.statusItem}>
                      الاسم: {userStatus.profile.full_name || 'غير متوفر'}
                    </Text>
                    <Text style={styles.statusItem}>
                      تاريخ الإنشاء: {formatDate(userStatus.profile.created_at)}
                    </Text>
                  </>
                )}
                
                {userStatus.error && (
                  <Text style={styles.errorText}>
                    خطأ: {userStatus.error.message || JSON.stringify(userStatus.error)}
                  </Text>
                )}
                
                {userStatus.message && (
                  <Text style={styles.messageText}>{userStatus.message}</Text>
                )}
              </View>
            ) : (
              <Text>لا توجد معلومات</Text>
            )}
          </View>
          
          {/* مفاتيح التخزين المؤقت */}
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>مفاتيح التخزين المؤقت المتعلقة بالمصادقة</Text>
            
            {authStorage ? (
              <View>
                {authStorage.error ? (
                  <Text style={styles.errorText}>
                    خطأ: {authStorage.error.message || JSON.stringify(authStorage.error)}
                  </Text>
                ) : (
                  <>
                    <Text style={styles.statusItem}>
                      عدد المفاتيح: {authStorage.authKeys?.length || 0}
                    </Text>
                    
                    {authStorage.authKeys && authStorage.authKeys.length > 0 ? (
                      authStorage.authKeys.map((key, index) => (
                        <View key={index} style={styles.keyItem}>
                          <Text style={styles.keyName}>{key}</Text>
                          <Text style={styles.keyValue}>
                            {authStorage.authData[key] ? (
                              authStorage.authData[key].length > 100 ? 
                                authStorage.authData[key].substring(0, 100) + '...' : 
                                authStorage.authData[key]
                            ) : 'لا توجد قيمة'}
                          </Text>
                        </View>
                      ))
                    ) : (
                      <Text>لا توجد مفاتيح متعلقة بالمصادقة</Text>
                    )}
                  </>
                )}
              </View>
            ) : (
              <Text>لا توجد معلومات</Text>
            )}
          </View>
          
          {/* التشخيص والتوصيات */}
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>التشخيص والتوصيات</Text>
            
            {sessionStatus && (
              <View>
                {!sessionStatus.hasSession && (
                  <Text style={styles.diagnosisText}>
                    المشكلة: لا توجد جلسة مصادقة نشطة.
                    التوصية: قم بتسجيل الدخول مرة أخرى.
                  </Text>
                )}
                
                {sessionStatus.hasSession && sessionStatus.isExpired && (
                  <Text style={styles.diagnosisText}>
                    المشكلة: جلسة المصادقة منتهية الصلاحية.
                    التوصية: قم بتنظيف ذاكرة التخزين المؤقت للمصادقة وتسجيل الدخول مرة أخرى.
                  </Text>
                )}
                
                {sessionStatus.hasSession && !sessionStatus.isExpired && userStatus && !userStatus.exists && (
                  <Text style={styles.diagnosisText}>
                    المشكلة: جلسة المصادقة صالحة ولكن المستخدم غير موجود في قاعدة البيانات.
                    التوصية: قم بتسجيل الخروج وتسجيل الدخول مرة أخرى.
                  </Text>
                )}
                
                {sessionStatus.hasSession && !sessionStatus.isExpired && userStatus && userStatus.exists && (
                  <Text style={styles.diagnosisText}>
                    التشخيص: جلسة المصادقة صالحة والمستخدم موجود في قاعدة البيانات.
                    لا توجد مشاكل في المصادقة.
                  </Text>
                )}
              </View>
            )}
          </View>
        </ScrollView>
      )}
    </View>
  );
};

// الأنماط
const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: 16,
    backgroundColor: '#f5f5f5',
  },
  title: {
    fontSize: 20,
    fontWeight: 'bold',
    marginBottom: 16,
    textAlign: 'center',
  },
  refreshButton: {
    backgroundColor: '#2196F3',
    padding: 12,
    borderRadius: 8,
    marginBottom: 16,
  },
  buttonText: {
    color: 'white',
    textAlign: 'center',
    fontWeight: 'bold',
  },
  loader: {
    marginTop: 32,
  },
  contentContainer: {
    flex: 1,
  },
  section: {
    backgroundColor: 'white',
    borderRadius: 8,
    padding: 16,
    marginBottom: 16,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    marginBottom: 8,
    borderBottomWidth: 1,
    borderBottomColor: '#eee',
    paddingBottom: 8,
  },
  statusItem: {
    marginBottom: 4,
  },
  errorText: {
    color: 'red',
    marginTop: 8,
  },
  messageText: {
    fontStyle: 'italic',
    marginTop: 8,
  },
  keyItem: {
    marginTop: 8,
    paddingTop: 8,
    borderTopWidth: 1,
    borderTopColor: '#eee',
  },
  keyName: {
    fontWeight: 'bold',
  },
  keyValue: {
    marginTop: 4,
    fontSize: 12,
    color: '#666',
  },
  diagnosisText: {
    backgroundColor: '#e3f2fd',
    padding: 8,
    borderRadius: 4,
    marginTop: 8,
  },
});

// تصدير المكون والدوال
export { AuthDiagnosticScreen, getSessionStatus, getAuthStorageKeys, checkUserInDatabase };

// كيفية استخدام هذا الملف:
/*
1. إضافة الشاشة إلى نظام التنقل في التطبيق:

import { AuthDiagnosticScreen } from './تشخيص_حالة_المصادقة';

// في ملف التنقل
<Stack.Screen name="AuthDiagnostic" component={AuthDiagnosticScreen} options={{ title: 'تشخيص المصادقة' }} />

2. إضافة زر للانتقال إلى شاشة التشخيص (مثلاً في شاشة الإعدادات):

import { useNavigation } from '@react-navigation/native';

const SettingsScreen = () => {
  const navigation = useNavigation();
  
  return (
    <View>
      {/* عناصر شاشة الإعدادات */}
      
      <TouchableOpacity onPress={() => navigation.navigate('AuthDiagnostic')}>
        <Text>تشخيص حالة المصادقة</Text>
      </TouchableOpacity>
    </View>
  );
};
*/