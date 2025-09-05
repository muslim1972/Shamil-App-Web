// ملف اختبار تسجيل الدخول - يمكن تشغيله للتحقق من أن التطبيق يعمل
// هذا الملف للاختبار فقط

const { createClient } = require('@supabase/supabase-js');
require('dotenv').config();

// إعداد Supabase client
const supabase = createClient(
  process.env.SUPABASE_URL,
  process.env.SUPABASE_ANON_KEY
);

// حسابات اختبار مؤقتة
const testAccounts = [
  {
    email: 'test1@example.com',
    password: 'Test123456',
    username: 'مسلم'
  },
  {
    email: 'test2@example.com', 
    password: 'Test123456',
    username: 'ابو سجاد العنزي'
  }
];

// دالة لإنشاء حسابات الاختبار
async function createTestAccounts() {
  console.log('🔄 إنشاء حسابات اختبار...');
  
  for (const account of testAccounts) {
    try {
      // تسجيل حساب جديد
      const { data: authData, error: authError } = await supabase.auth.signUp({
        email: account.email,
        password: account.password,
        options: {
          data: {
            username: account.username
          }
        }
      });

      if (authError) {
        console.log(`⚠️ الحساب ${account.email} موجود بالفعل أو حدث خطأ`);
      } else {
        console.log(`✅ تم إنشاء الحساب: ${account.email}`);
        
        // إضافة المستخدم إلى جدول users
        if (authData.user) {
          const { error: userError } = await supabase
            .from('users')
            .insert([
              {
                id: authData.user.id,
                email: account.email,
                username: account.username,
                created_at: new Date().toISOString(),
                updated_at: new Date().toISOString()
              }
            ]);

          if (userError) {
            console.log(`⚠️ لم يتم إضافة المستخدم إلى جدول users: ${userError.message}`);
          } else {
            console.log(`✅ تم إضافة المستخدم إلى جدول users`);
          }
        }
      }
    } catch (error) {
      console.error(`❌ خطأ في إنشاء الحساب ${account.email}:`, error.message);
    }
  }
}

// دالة لاختبار تسجيل الدخول
async function testLogin() {
  console.log('🔄 اختبار تسجيل الدخول...');
  
  for (const account of testAccounts) {
    try {
      const { data, error } = await supabase.auth.signInWithPassword({
        email: account.email,
        password: account.password
      });

      if (error) {
        console.log(`❌ فشل تسجيل الدخول ${account.email}: ${error.message}`);
      } else {
        console.log(`✅ تم تسجيل الدخول بنجاح: ${account.email}`);
        console.log(`   Username: ${account.username}`);
        console.log(`   User ID: ${data.user.id}`);
      }
    } catch (error) {
      console.error(`❌ خطأ في تسجيل الدخول ${account.email}:`, error.message);
    }
  }
}

// تشغيل الاختبار
async function runTest() {
  console.log('🚀 بدء اختبار حسابات تسجيل الدخول...\n');
  
  await createTestAccounts();
  console.log('\n' + '='.repeat(50) + '\n');
  await testLogin();
  
  console.log('\n📋 ملخص الحسابات:');
  testAccounts.forEach(account => {
    console.log(`   ${account.email} / ${account.password} (${account.username})`);
  });
}

// تشغيل الاختبار إذا تم تنفيذ الملف مباشرة
if (require.main === module) {
  runTest().catch(console.error);
}

module.exports = { createTestAccounts, testLogin };