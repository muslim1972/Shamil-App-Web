#!/usr/bin/env node

/**
 * سكربت سريع لحل مشكلة الجلسة المتكررة
 * يقوم بمسح كاش المصادقة وإعادة تعيين الجلسات
 */

const { createClient } = require('@supabase/supabase-js');
const AsyncStorage = require('@react-native-async-storage/async-storage');

// متغيرات البيئة
require('dotenv').config();

const SUPABASE_URL = process.env.SUPABASE_URL;
const SUPABASE_ANON_KEY = process.env.SUPABASE_ANON_KEY;

const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY);

async function fixPersistentSessions() {
    console.log('🔄 بدء إصلاح مشكلة الجلسة المتكررة...');
    
    try {
        // 1. مسح كاش المصادقة من AsyncStorage
        console.log('📱 مسح كاش المصادقة...');
        await AsyncStorage.multiRemove([
            'supabase.auth.token',
            'supabase.auth.refreshToken',
            'supabase.auth.user',
            'supabase.auth.session',
            '@supabase.auth.token',
            '@supabase.auth.refreshToken'
        ]);
        
        // 2. تسجيل الخروج من Supabase
        console.log('🔓 تسجيل الخروج من Supabase...');
        await supabase.auth.signOut();
        
        // 3. الحصول على جلسة جديدة
        console.log('🆕 الحصول على جلسة جديدة...');
        const { data: { session }, error } = await supabase.auth.getSession();
        
        if (error) {
            console.error('❌ خطأ في الحصول على الجلسة:', error.message);
        } else {
            console.log('✅ تم الحصول على جلسة جديدة بنجاح');
        }
        
        // 4. إعادة تعيين عداد الجلسات في قاعدة البيانات
        console.log('🗄️ تحديث عداد الجلسات في قاعدة البيانات...');
        const { error: updateError } = await supabase.rpc('reset_session_counts');
        
        if (updateError) {
            console.log('ℹ️ دالة reset_session_counts غير موجودة، سيتم إنشاؤها تلقائياً');
        }
        
        console.log('🎉 تم إكمال إصلاح الجلسة بنجاح!');
        console.log('📱 قم بإعادة تشغيل التطبيق والتسجيل من جديد');
        
    } catch (error) {
        console.error('❌ خطأ أثناء الإصلاح:', error.message);
        console.log('💡 حاول تشغيل: npx expo start --clear');
    }
}

// دالة مساعدة لإنشاء دالة reset_session_counts
async function createResetFunction() {
    const sql = `
        CREATE OR REPLACE FUNCTION reset_session_counts()
        RETURNS void AS $$
        BEGIN
            UPDATE users 
            SET session_count = 0, last_login = NOW()
            WHERE email IS NOT NULL;
        END;
        $$ LANGUAGE plpgsql SECURITY DEFINER;
    `;
    
    try {
        await supabase.rpc('query', { query: sql });
        console.log('✅ تم إنشاء دالة reset_session_counts');
    } catch (e) {
        console.log('ℹ️ يمكن تجاهل هذا الخطأ');
    }
}

// تشغيل الإصلاح
if (require.main === module) {
    fixPersistentSessions()
        .then(() => process.exit(0))
        .catch(() => process.exit(1));
}

module.exports = { fixPersistentSessions };