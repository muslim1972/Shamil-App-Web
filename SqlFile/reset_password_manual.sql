-- إعادة تعيين كلمة المرور يدوياً
-- نفذ هذا في Supabase SQL Editor

-- 1. عرض المستخدمين الحاليين
SELECT 
    id,
    email,
    created_at,
    last_sign_in_at
FROM auth.users 
ORDER BY created_at;

-- 2. لإعادة تعيين كلمة المرور، استخدم Supabase Dashboard:
-- اذهب إلى Authentication -> Users
-- ابحث عن muslimalmulali@gmail.com
-- اضغط على النقاط الثلاث (...) بجانب المستخدم
-- اختر "Reset Password"
-- أو اختر "Send Magic Link"

-- 3. أو احذف المستخدم وأعد إنشاؤه
-- DELETE FROM auth.users WHERE email = 'muslimalmulali@gmail.com';
-- (لا تنفذ هذا إلا إذا كنت متأكداً)