-- سكربت لتفريغ جميع جداول public + حذف جميع المستخدمين من auth.users في Supabase

-- 1. تفريغ جداول public (مع إعادة العدادات)
TRUNCATE TABLE
  conversation_members,
  conversations,
  hidden_messages,
  message_reads,
  messages,
  profiles,
  push_tokens,
  users
RESTART IDENTITY CASCADE;

-- 2. حذف جميع المستخدمين من auth.users (Supabase Auth)
-- ملاحظة: لا يمكن تنفيذ DELETE مباشرة على auth.users من SQL Editor في Supabase، يجب استخدام واجهة Supabase Auth أو API
-- إذا كان لديك صلاحية superuser يمكنك تنفيذ:
-- DELETE FROM auth.users;
-- لكن غالباً ستحتاج حذفهم يدوياً من لوحة تحكم Supabase > Authentication > Users

-- 3. (اختياري) حذف بيانات جداول أخرى إذا لزم الأمر
-- TRUNCATE TABLE other_table RESTART IDENTITY CASCADE;

-- بعد التنفيذ يمكنك إدخال مستخدم جديد من التطبيق واختبار التدفق الكامل.
