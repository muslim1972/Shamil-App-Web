const { createClient } = require('@supabase/supabase-js');
require('dotenv').config();

const supabase = createClient(
  process.env.EXPO_PUBLIC_SUPABASE_URL,
  process.env.EXPO_PUBLIC_SUPABASE_ANON_KEY
);

async function verifyDatabaseIntegrity() {
  console.log('🔍 بدء فحص سلامة قاعدة البيانات...\n');

  // 1. فحص جدول public.users
  console.log('📋 فحص جدول public.users:');
  const { data: users, error: usersError } = await supabase
    .from('users')
    .select('*')
    .order('created_at', { ascending: true });

  if (usersError) {
    console.error('❌ خطأ في جلب users:', usersError);
  } else {
    console.log(`✅ عدد المستخدمين: ${users.length}`);
    users.forEach(user => {
      console.log(`   ID: ${user.id} | Email: ${user.email} | Username: ${user.username} | Password: ${user.password ? 'exists' : 'missing'}`);
    });
  }

  // 2. فحص auth.users
  console.log('\n📋 فحص auth.users:');
  const { data: authUsers, error: authError } = await supabase
    .from('auth.users')
    .select('id, email, raw_user_meta_data')
    .order('created_at', { ascending: true });

  if (authError) {
    console.error('❌ خطأ في جلب auth.users:', authError);
  } else {
    console.log(`✅ عدد المستخدمين في auth: ${authUsers.length}`);
    authUsers.forEach(user => {
      const meta = user.raw_user_meta_data || {};
      console.log(`   ID: ${user.id} | Email: ${user.email} | Username: ${meta.username || 'missing'}`);
    });
  }

  // 3. مقارنة الIDs
  console.log('\n🔍 مقارنة الIDs:');
  if (users && authUsers) {
    const userIds = users.map(u => u.id);
    const authIds = authUsers.map(u => u.id);
    
    const missingInPublic = authIds.filter(id => !userIds.includes(id));
    const extraInPublic = userIds.filter(id => !authIds.includes(id));
    
    console.log(`📊 المستخدمين في auth ليسوا في public.users: ${missingInPublic.length}`);
    missingInPublic.forEach(id => console.log(`   - ${id}`));
    
    console.log(`📊 المستخدمين في public.users ليسوا في auth: ${extraInPublic.length}`);
    extraInPublic.forEach(id => console.log(`   - ${id}`));
  }

  // 4. فحص تركيب الجداول
  console.log('\n🔍 فحص تركيب الجداول:');
  const tableChecks = [
    'SELECT column_name, data_type FROM information_schema.columns WHERE table_name = \'users\' AND table_schema = \'public\'',
    'SELECT column_name, data_type FROM information_schema.columns WHERE table_name = \'conversations\' AND table_schema = \'public\'',
    'SELECT column_name, data_type FROM information_schema.columns WHERE table_name = \'messages\' AND table_schema = \'public\''
  ];

  for (const query of tableChecks) {
    const { data, error } = await supabase.rpc('exec_sql', { sql: query });
    if (error) {
      console.error('❌ خطأ في فحص الجدول:', error);
    } else {
      console.log(`✅ نتائج:`, data);
    }
  }

  // 5. فحص البيانات الحالية
  console.log('\n🔍 فحص البيانات الحالية:');
  const { data: currentUser } = await supabase.auth.getUser();
  console.log(`🎯 المستخدم الحالي: ${currentUser.user?.id || 'لا يوجد'}`);
  console.log(`📧 البريد: ${currentUser.user?.email || 'لا يوجد'}`);

  // 6. اقتراحات الإصلاح
  console.log('\n💡 اقتراحات الإصلاح:');
  if (missingInPublic && missingInPublic.length > 0) {
    console.log('📝 يجب مزامنة المستخدمين من auth.users إلى public.users');
    missingInPublic.forEach(id => {
      const authUser = authUsers.find(u => u.id === id);
      if (authUser) {
        console.log(`   INSERT INTO users (id, email, username, password) VALUES ('${id}', '${authUser.email}', '${authUser.raw_user_meta_data?.username || ''}', '123456');`);
      }
    });
  }

  console.log('\n✅ اكتمل الفحص');
}

// تشغيل الفحص
verifyDatabaseIntegrity().catch(console.error);