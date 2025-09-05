/**
 * سكربت تشخيص للاستخدام داخل التطبيق React Native
 * يعرض حالة الجلسة والمشاكل المحتملة في واجهة المستخدم
 * يتم تشغيله من داخل التطبيق عبر زر في شاشة تسجيل الدخول
 */

import React, { useState, useEffect } from 'react';
import { View, Text, Button, ScrollView, StyleSheet, Alert } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { supabase } from './lib/supabase';

const DiagnoseSession = ({ onComplete }) => {
  const [diagnosis, setDiagnosis] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  const runDiagnosis = async () => {
    setIsLoading(true);
    setDiagnosis('');
    
    let report = '🚀 بدء تشخيص مشكلة عدم حفظ الجلسة...\n\n';

    try {
      // 1. فحص إعدادات Supabase
      report += '🔍 فحص إعدادات Supabase...\n';
      const supabaseUrl = supabase?.supabaseUrl || 'غير محدد';
      const supabaseKey = supabase?.supabaseKey ? supabase.supabaseKey.substring(0, 10) + '...' : 'غير محدد';
      
      report += `SUPABASE_URL: ${supabaseUrl}\n`;
      report += `SUPABASE_KEY: ${supabaseKey}\n`;
      
      if (!supabaseUrl || !supabaseKey) {
        report += '❌ إعدادات Supabase غير مكتملة!\n';
      } else {
        report += '✅ إعدادات Supabase مكتملة\n';
      }

      // 2. فحص التخزين
      report += '\n🔍 فحص حالة التخزين...\n';
      const keys = await AsyncStorage.getAllKeys();
      report += `عدد المفاتيح الكلي: ${keys.length}\n`;
      
      const authKeys = keys.filter(key => 
        key.includes('supabase.auth') || 
        key.includes('sb-') ||
        key.includes('@supabase')
      );
      report += `مفاتيح المصادقة: ${authKeys.length}\n`;
      
      if (authKeys.length > 0) {
        report += 'المفاتيح: ' + authKeys.join(', ') + '\n';
        
        // فحص محتوى الرمز
        for (const key of authKeys) {
          const value = await AsyncStorage.getItem(key);
          if (value && key.includes('token')) {
            try {
              const parsed = JSON.parse(value);
              const expiresAt = parsed.expires_at ? new Date(parsed.expires_at * 1000).toLocaleString() : 'غير محدد';
              report += `  - expires_at: ${expiresAt}\n`;
            } catch (e) {
              report += `  - لا يمكن تحليل القيمة\n`;
            }
          }
        }
      }

      // 3. فحص الجلسة الحالية
      report += '\n🔍 فحص الجلسة الحالية...\n';
      const { data, error } = await supabase.auth.getSession();
      
      if (error) {
        report += `❌ خطأ في الحصول على الجلسة: ${error.message}\n`;
        report += `تفاصيل الخطأ: ${JSON.stringify(error, null, 2)}\n`;
      } else if (!data.session) {
        report += '⚠️ لا توجد جلسة نشطة\n';
      } else {
        report += '✅ جلسة نشطة موجودة\n';
        report += `معرف المستخدم: ${data.session.user?.id}\n`;
        report += `البريد الإلكتروني: ${data.session.user?.email}\n`;
        report += `وقت الانتهاء: ${new Date(data.session.expires_at * 1000).toLocaleString()}\n`;
      }

      // 4. فحص وظيفة ensure_user_exists
      report += '\n🔍 فحص وظيفة ensure_user_exists...\n';
      if (data.session) {
        try {
          const { data: result, error: rpcError } = await supabase
            .rpc('ensure_user_exists', { user_id: data.session.user.id });
          
          if (rpcError) {
            report += `❌ خطأ في وظيفة ensure_user_exists: ${rpcError.message}\n`;
            report += `قد يكون هذا سبب تسجيل الخروج التلقائي!\n`;
          } else {
            report += `✅ وظيفة ensure_user_exists تعمل بشكل صحيح\n`;
          }
        } catch (e) {
          report += `❌ استثناء في وظيفة ensure_user_exists: ${e.message}\n`;
        }
      }

      // 5. تحليل النتائج
      report += '\n📊 تحليل النتائج:\n';
      
      if (!configValid) {
        report += '❌ المشكلة: إعدادات Supabase غير مكتملة\n';
      } else if (!storageHasData && !data.session) {
        report += '❌ المشكلة: لا توجد بيانات في التخزين ولا جلسة نشطة\n';
        report += '💡 الحل: جرب تسجيل الدخول مرة أخرى\n';
      } else if (storageHasData && !data.session) {
        report += '❌ المشكلة: توجد بيانات في التخزين لكن لا توجد جلسة نشطة\n';
        report += '💡 الحل: قد تكون الجلسة منتهية، جرب إعادة تسجيل الدخول\n';
      } else if (data.session) {
        report += '✅ الجلسة تعمل بشكل صحيح\n';
        report += '💡 إذا كان التطبيق لا يزال يفتح على شاشة تسجيل الدخول، قد تكون المشكلة في:\n';
        report += '   - راوتر التنقل لا يتحقق من الجلسة بشكل صحيح\n';
        report += '   - وظيفة ensure_user_exists تسبب تسجيل الخروج\n';
      }

      setDiagnosis(report);
      
    } catch (error) {
      report += `❌ خطأ غير متوقع: ${error.message}\n`;
      setDiagnosis(report);
    }
    
    setIsLoading(false);
  };

  const resetAuth = async () => {
    Alert.alert(
      'إعادة تعيين المصادقة',
      'هل أنت متأكد من حذف جميع بيانات المصادقة؟',
      [
        { text: 'إلغاء', style: 'cancel' },
        {
          text: 'نعم',
          onPress: async () => {
            try {
              await supabase.auth.signOut({ scope: 'global' });
              const keys = await AsyncStorage.getAllKeys();
              const authKeys = keys.filter(key => 
                key.includes('supabase.auth') || 
                key.includes('sb-') ||
                key.includes('@supabase')
              );
              await AsyncStorage.multiRemove(authKeys);
              Alert.alert('تم إعادة تعيين المصادقة', 'جرب تسجيل الدخول مرة أخرى');
              runDiagnosis();
            } catch (error) {
              Alert.alert('خطأ', error.message);
            }
          }
        }
      ]
    );
  };

  return (
    <ScrollView style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.title}>تشخيص مشكلة الجلسة</Text>
      </View>
      
      <View style={styles.section}>
        <Button 
          title={isLoading ? 'جاري التشخيص...' : 'تشغيل التشخيص'}
          onPress={runDiagnosis}
          disabled={isLoading}
        />
      </View>

      {diagnosis && (
        <View style={styles.section}>
          <Text style={styles.diagnosisTitle}>نتائج التشخيص:</Text>
          <Text style={styles.diagnosisText}>{diagnosis}</Text>
        </View>
      )}

      <View style={styles.section}>
        <Button 
          title="إعادة تعيين المصادقة الكاملة"
          onPress={resetAuth}
          color="#ff4444"
        />
      </View>

      {onComplete && (
        <View style={styles.section}>
          <Button title="إغلاق" onPress={onComplete} />
        </View>
      )}
    </ScrollView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: 20,
    backgroundColor: '#f5f5f5',
  },
  header: {
    marginBottom: 20,
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    textAlign: 'center',
    color: '#333',
  },
  section: {
    marginBottom: 20,
  },
  diagnosisTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    marginBottom: 10,
    color: '#333',
  },
  diagnosisText: {
    fontSize: 14,
    color: '#666',
    fontFamily: 'monospace',
  },
});

export default DiagnoseSession;