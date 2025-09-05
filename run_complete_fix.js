#!/usr/bin/env node
/**
 * سكريبت الإصلاح الشامل للمشكلات المتعددة
 * هذا السكريبت يقوم بتنفيذ جميع الإصلاحات تلقائياً
 */

const { execSync } = require('child_process');
const fs = require('fs');
const path = require('path');

console.log('🚀 بدء عملية الإصلاح الشاملة...\n');

// الأوامر التي سيتم تنفيذها
const commands = [
    {
        name: 'تنفيذ الإصلاح الشامل',
        command: 'npx supabase db reset --schema public',
        file: 'الإصلاح_النهائي_الشامل.sql'
    },
    {
        name: 'تشغيل استعلامات التحقق',
        command: 'npx supabase sql < تجربة_المستخدمين_المحدث.sql',
        file: 'تجربة_المستخدمين_المحدث.sql'
    }
];

// دالة لتنفيذ الأمر وعرض النتائج
function executeCommand(cmd, description) {
    console.log(`📋 ${description}...`);
    try {
        const result = execSync(cmd, { 
            encoding: 'utf8', 
            cwd: process.cwd(),
            stdio: 'inherit'
        });
        console.log(`✅ تم بنجاح: ${description}\n`);
        return result;
    } catch (error) {
        console.error(`❌ خطأ في: ${description}`);
        console.error(error.message);
        return null;
    }
}

// دالة للتحقق من وجود الملفات
function checkFiles() {
    const requiredFiles = [
        'الإصلاح_النهائي_الشامل.sql',
        'تجربة_المستخدمين_المحدث.sql'
    ];
    
    console.log('🔍 التحقق من وجود الملفات المطلوبة...\n');
    
    requiredFiles.forEach(file => {
        if (fs.existsSync(path.join(process.cwd(), file))) {
            console.log(`✅ ${file} موجود`);
        } else {
            console.log(`❌ ${file} غير موجود`);
        }
    });
    
    console.log('\n');
}

// دالة لعرض التعليمات النهائية
function showFinalInstructions() {
    console.log('\n🎯 الخطوات النهائية:');
    console.log('1. أعد تشغيل التطبيق: npx expo start --clear');
    console.log('2. جرب تسجيل الدخول بحساب: muslimakeel@yahoo.com');
    console.log('3. يجب أن تظهر واجهة المحادثات مع محادثة ترحيبية');
    console.log('4. للتحقق من قاعدة البيانات: npx supabase dashboard');
    console.log('\n📖 راجع ملف: دليل_تطبيق_الإصلاحات_النهائي.md للمزيد من التفاصيل');
}

// التنفيذ الرئيسي
function main() {
    console.log('📊 معلومات النظام:');
    console.log(`المجلد الحالي: ${process.cwd()}`);
    console.log(`نظام التشغيل: ${process.platform}`);
    console.log(`وقت التشغيل: ${new Date().toLocaleString('ar-SA')}\n`);
    
    // التحقق من الملفات
    checkFiles();
    
    // تنفيذ الإصلاحات
    console.log('🔄 بدء تنفيذ الإصلاحات...\n');
    
    try {
        // تنفيذ الإصلاح الشامل
        console.log('📁 تنفيذ ملف الإصلاح الشامل...');
        const sqlContent = fs.readFileSync('الإصلاح_النهائي_الشامل.sql', 'utf8');
        console.log('✅ تم تحميل محتوى الإصلاح بنجاح');
        
        // إنشاء ملف تنفيذي مؤقت
        const tempFile = 'temp_fix.sql';
        fs.writeFileSync(tempFile, sqlContent);
        
        // تنفيذ SQL
        console.log('⚙️ تنفيذ الأوامر SQL...');
        execSync(`npx supabase sql < ${tempFile}`, { stdio: 'inherit' });
        
        // تنظيف
        fs.unlinkSync(tempFile);
        
        console.log('\n🎉 تم تنفيذ جميع الإصلاحات بنجاح!');
        showFinalInstructions();
        
    } catch (error) {
        console.error('\n❌ خطأ في التنفيذ:', error.message);
        console.log('\n💡 الحل البديل:');
        console.log('1. افتح Supabase Dashboard يدوياً');
        console.log('2. انسخ محتوى ملف الإصلاح_النهائي_الشامل.sql');
        console.log('3. نفذ الأوامر يدوياً في SQL Editor');
    }
}

// تشغيل السكريبت
if (require.main === module) {
    main();
}

module.exports = { executeCommand, checkFiles, showFinalInstructions };