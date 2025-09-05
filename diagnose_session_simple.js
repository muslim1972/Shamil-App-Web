#!/usr/bin/env node

/**
 * أداة تشخيص مشكلة الجلسة المتكررة - نسخة مبسطة
 * تقوم بتحليل حالة كل حساب وعرض التفاصيل الكاملة
 */

require('dotenv').config();

const SUPABASE_URL = process.env.SUPABASE_URL;
const SUPABASE_ANON_KEY = process.env.SUPABASE_ANON_KEY;

// إنشاء Supabase client بشكل مباشر
const { createClient } = require('@supabase/supabase-js');
const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY);

async function diagnoseSessionIssue() {
    console.log('🔍 بدء تشخيص مشكلة الجلسة...\n');

    try {
        // 1. التحقق من جدول users
        console.log('📊 فحص جدول users:');
        const { data: users, error: usersError } = await supabase
            .from('users')
            .select('*')
            .order('created_at', { ascending: false });

        if (usersError) {
            console.error('❌ خطأ في جلب بيانات users:', usersError.message);
        } else {
            console.log(`📋 عدد المستخدمين: ${users.length}`);
            users.forEach(user => {
                console.log(`   👤 ${user.email || 'No email'} - ${user.username || 'No username'} - ${user.created_at || 'No date'}`);
            });
        }

        // 2. التحقق من وجود الدوال
        console.log('\n🧪 اختبار وجود الدوال:');
        
        const testUserId = 'ac2c7057-e91d-4c5a-bdc2-6019953d5511'; // muslimalmulali@gmail.com
        
        try {
            const { data: checkResult, error: checkError } = await supabase
                .rpc('check_user_exists', { p_user_id: testUserId });
            
            if (checkError) {
                console.log(`❌ check_user_exists خطأ: ${checkError.message}`);
            } else {
                console.log(`✅ check_user_exists نتيجة: ${checkResult}`);
            }
        } catch (e) {
            console.log(`❌ check_user_exists استثناء: ${e.message}`);
        }
        
        try {
            const { data: ensureResult, error: ensureError } = await supabase
                .rpc('ensure_user_exists', { user_id: testUserId });
            
            if (ensureError) {
                console.log(`❌ ensure_user_exists خطأ: ${ensureError.message}`);
            } else {
                console.log(`✅ ensure_user_exists نتيجة: ${ensureResult}`);
            }
        } catch (e) {
            console.log(`❌ ensure_user_exists استثناء: ${e.message}`);
        }

        // 3. التحقق من البيانات المفقودة
        console.log('\n📋 التحقق من البيانات المفقودة:');
        
        const { data: authUsers, error: authError } = await supabase
            .from('auth.users')
            .select('id, email, raw_user_meta_data')
            .in('email', [
                'muslimalmulali@gmail.com',
                'muslimakkeel@gmail.com',
                'lurnamenati@gmail.com',
                'lurnaalbahadli@gmail.com',
                'muhamadmuslim@gmail.com'
            ]);

        if (authError) {
            console.error('❌ خطأ في جلب بيانات auth.users:', authError.message);
        } else {
            console.log(`📋 الحسابات في auth.users: ${authUsers.length}`);
            authUsers.forEach(user => {
                const meta = user.raw_user_meta_data || {};
                console.log(`   🔑 ${user.email} - username: ${meta.username || meta.full_name || 'MISSING'}`);
            });
        }

        // 4. التوصيات النهائية
        console.log('\n💡 التوصيات النهائية:');
        console.log('1. ✅ شغل سكربت fix_persistent_sessions.sql في Supabase');
        console.log('2. ✅ شغل: node quick_fix_session.js');
        console.log('3. ✅ أعد تشغيل التطبيق: npx expo start --clear');
        console.log('4. ✅ جرب تسجيل الدخول من كل حساب');

    } catch (error) {
        console.error('❌ خطأ عام:', error.message);
    }
}

// تشغيل التشخيص
if (require.main === module) {
    diagnoseSessionIssue()
        .then(() => process.exit(0))
        .catch(() => process.exit(1));
}

module.exports = { diagnoseSessionIssue };