// Polyfill for structuredClone, required in environments without native support (like older JSC).
// See: https://github.com/zloirock/core-js#structuredclone

import 'react-native-url-polyfill/auto';
import 'core-js/actual/structured-clone';
import React, { useEffect } from 'react';
import { fixMissingAuthSession } from './auto_fix_auth'; // استيراد دالة إصلاح مشكلة المصادقة
import { applyPersistentLoginFix } from './fix_persistent_login';
import { applyAuthAndLoggingFixes } from './disable_supabase_logs'; // استيراد دالة إيقاف رسائل التصحيح
import { View, ActivityIndicator, StyleSheet, Platform, Alert } from 'react-native';
import { AuthProvider, useAuth } from './context/AuthContext';
import { NavigationContainer } from '@react-navigation/native';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import * as Device from 'expo-device';
import * as Notifications from 'expo-notifications';
import { supabase } from './lib/supabase';

// استيراد جميع الشاشات هنا
import AuthScreen from './components/AuthScreen';
import ConversationListScreen from './components/ConversationListScreen';
import UserListScreen from './components/UserListScreen';
import ChatScreen from './components/ChatScreen';
// import CallScreen from './components/CallScreen';
import ArchivedConversationsScreen from './components/ArchivedConversationsScreen'; // *** إضافة جديدة ***

const Stack = createNativeStackNavigator();
// إعداد طريقة تعامل التطبيق مع الإشعارات عندما يكون مفتوحاً
Notifications.setNotificationHandler({
  handleNotification: async () => ({
    shouldShowAlert: true,
    shouldPlaySound: true,
    shouldSetBadge: false,
  }),
});

// دالة لطلب الإذن والحصول على معرّف الإشعارات
async function registerForPushNotificationsAsync() {
  let token;
  // إعداد قناة الإشعارات لنظام أندرويد
  if (Platform.OS === 'android') {
    await Notifications.setNotificationChannelAsync('default', {
      name: 'default',
      importance: Notifications.AndroidImportance.MAX,
      vibrationPattern: [0, 250, 250, 250],
      lightColor: '#FF231F7C',
    });
  }

  // التحقق من أن التطبيق يعمل على جهاز حقيقي
  if (Device.isDevice) {
    const { status: existingStatus } = await Notifications.getPermissionsAsync();
    let finalStatus = existingStatus;
    if (existingStatus !== 'granted') {
      const { status } = await Notifications.requestPermissionsAsync();
      finalStatus = status;
    }
    if (finalStatus !== 'granted') {
      Alert.alert('فشل!', 'فشل الحصول على إذن الإشعارات!');
      return;
    }
    // *** هام جداً ***: استبدل النص التالي بمعرّف مشروعك في Expo
    token = (await Notifications.getExpoPushTokenAsync({ projectId: '5840bcfc-eaa3-49ed-ad79-66e65bee179d' })).data;
  } else {
    Alert.alert('تنبيه', 'يجب استخدام جهاز حقيقي لتجربة الإشعارات.');
  }

  return token;
}

const RootNavigator = () => {
  const { user, loading, resetSession } = useAuth();
  
  // تهيئة بسيطة للمصادقة بدون إعادة تعيين مفرطة
  // تم تعطيل إصلاحات المصادقة التلقائية حتى لا يتم حذف الجلسة عند كل تشغيل
  // إذا احتجت للإصلاح اليدوي، يمكنك استدعاء الدوال التالية عند الحاجة فقط:
  // await fixMissingAuthSession();
  // await applyPersistentLoginFix();
  // await applyAuthAndLoggingFixes();
  //
  // ملاحظة: إذا ظهرت مشكلة حقيقية في الجلسة، نفذها يدويًا فقط.

  useEffect(() => {
    if (user) {
      // تأخير تسجيل رمز الإشعارات للتأكد من اكتمال عملية المصادقة
      const timer = setTimeout(() => {
        registerForPushNotificationsAsync().then(token => {
          if (token) {
            // حفظ المعرّف في قاعدة البيانات
            const saveToken = async () => {
              try {
                // التحقق من الجلسة قبل محاولة حفظ الرمز
                const session = await supabase.auth.getSession();
                if (!session.data.session) {
                  // محاولة تجديد الجلسة قبل الاستسلام
                  const refreshResult = await supabase.auth.refreshSession();
                  if (!refreshResult.data.session) {
                    // لا نطبع رسالة الخطأ هنا لأننا قمنا بتجاهلها في disable_supabase_logs.js
                    return;
                  }
                }
                
                // محاولة حفظ رمز الإشعارات
                //                 console.log('Debug: Token before upsert:', token);
                //                 console.log('Debug: User ID before upsert:', user.id);
                const { error } = await supabase
                  .from('push_tokens')
                  .upsert({ 
                    token: token, 
                    user_id: user.id 
                  }, {
                    onConflict: 'token' // في حال وجود المعرّف مسبقاً، لا تفعل شيئاً
                  });

                if (error) {
                  // في حالة وجود خطأ في سياسة أمان الصفوف
                  if (error.code === '42501') {
                    //                     console.log('خطأ في سياسة أمان الصفوف، محاولة إعادة المصادقة...');
                    // تجديد الجلسة ثم إعادة المحاولة
                    await supabase.auth.refreshSession();
                    // إعادة المحاولة بعد تجديد الجلسة
                    const { error: retryError } = await supabase
                      .from('push_tokens')
                      .upsert({ 
                        token: token, 
                        user_id: user.id 
                      }, {
                        onConflict: 'token'
                      });
                    
                    if (retryError) {
                      //                       console.error('فشل في حفظ رمز الإشعارات بعد إعادة المحاولة:', retryError);
                    } else {
                      //                       console.log('تم حفظ معرّف الإشعارات بنجاح بعد إعادة المحاولة!');
                    }
                  } else {
                    //                     console.error('خطأ في حفظ رمز الإشعارات:', error);
                  }
                } else {
                  //                   console.log('تم حفظ معرّف الإشعارات بنجاح!');
                }
              } catch (e) {
                //                 console.error('استثناء أثناء حفظ رمز الإشعارات:', e);
              }
            };
            saveToken();
          }
        });
      }, 2000); // تأخير لمدة 2 ثانية للتأكد من اكتمال عملية المصادقة
      
      return () => clearTimeout(timer);
    }
  }, [user, resetSession]);

  if (loading) {
    return (
      <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center' }}>
        <ActivityIndicator size="large" color="#25D366" />
      </View>
    );
  }

  return (
    // بدلاً من عرض الشاشات بشكل شرطي، نعرّفها كلها
    // ونحدد شاشة البداية بناءً على حالة تسجيل الدخول
    <Stack.Navigator
      screenOptions={{ headerShown: false }}
      initialRouteName={user ? 'ConversationList' : 'Auth'}
    >
      {/* شاشة المصادقة قبل تسجيل الدخول */}
      <Stack.Screen name="Auth" component={AuthScreen} />
      {/* مجموعة الشاشات التي تظهر بعد تسجيل الدخول */}
      <Stack.Screen
        name="ConversationList" 
        component={ConversationListScreen}
      />
      <Stack.Screen
        name="UserList"
        component={UserListScreen}

      />
      <Stack.Screen
        name="Chat"
        component={ChatScreen}
      />
      {/* <Stack.Screen 
        name="Call" 
        component={CallScreen}
         // هذه الشاشة لديها هيدر خاص بها

      /> */}
      <Stack.Screen 
        name="Archived" 
        component={ArchivedConversationsScreen} 
        options={{ headerShown: false }} // *** إضافة جديدة ***
      />      
    </Stack.Navigator>
  );
};

export default function App() {
  return (
    <AuthProvider>
      <NavigationContainer>
        <RootNavigator />
      </NavigationContainer>
    </AuthProvider>
  );
}

