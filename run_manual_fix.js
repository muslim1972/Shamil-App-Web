#!/usr/bin/env node
/**
 * سكريبت الإصلاح اليدوي - يعرض التعليمات فقط
 */

const fs = require('fs');
const path = require('path');

console.log('🚀 دليل الإصلاح اليدوي لقاعدة البيانات\n');

console.log('📋 الخطوات المطلوبة:\n');

console.log('1️⃣ افتح Supabase Dashboard:');
console.log('   https://supabase.com/dashboard/project/xuigvkwnjnfgxxnuhnhr\n');

console.log('2️⃣ اذهب إلى SQL Editor\n');

console.log('3️⃣ انسخ محتوى الملف التالي ونفذه:');
console.log('   📄 database_fix_final.sql\n');

// قراءة وعرض محتوى الملف
const sqlFile = 'database_fix_final.sql';
if (fs.existsSync(sqlFile)) {
    console.log('📝 محتوى الملف:');
    console.log('=' .repeat(50));
    const content = fs.readFileSync(sqlFile, 'utf8');
    console.log(content);
    console.log('=' .repeat(50));
} else {
    console.log('❌ الملف غير موجود: ' + sqlFile);
}

console.log('\n4️⃣ بعد التنفيذ، اختبر بالملف:');
console.log('   📄 test_users_fixed.sql\n');

console.log('5️⃣ أعد تشغيل التطبيق:');
console.log('   npx expo start --clear\n');

console.log('6️⃣ جرب تسجيل الدخول بـ:');
console.log('   📧 muslimalmulali@gmail.com');
console.log('   📧 muslimakkeel@gmail.com\n');

console.log('💡 ملاحظة: إذا لم تعمل الحسابات، تحقق من وجودها في auth.users أولاً\n');

console.log('🔍 للتحقق من auth.users، نفذ:');
console.log('   SELECT email FROM auth.users;\n');

console.log('✅ انتهى الدليل - ابدأ بالخطوة الأولى!');