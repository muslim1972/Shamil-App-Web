-- إصلاح مشكلة تسجيل الدخول للمستخدمين
-- هذا الملف سيعيد تعيين كلمات المرور للمستخدمين للاختبار

-- 1. التحقق من وجود المستخدمين المذكورين
SELECT 'التحقق من المستخدمين:' as check_users;
SELECT id, email, raw_user_meta_data->>'username' as username, created_at
FROM auth.users 
WHERE email IN ('muslimalmulali@gmail.com', 'muslimakkeel@gmail.com');

-- 2. إعادة تعيين كلمات المرور لسهولة الاختبار
-- كلمة المرور الجديدة: Test123456

-- للمستخدم الأول: muslimalmulali@gmail.com
UPDATE auth.users 
SET encrypted_password = crypt('Test123456', gen_salt('bf'))
WHERE email = 'muslimalmulali@gmail.com';

-- للمستخدم الثاني: muslimakkeel@gmail.com
UPDATE auth.users 
SET encrypted_password = crypt('Test123456', gen_salt('bf'))
WHERE email = 'muslimakkeel@gmail.com';

-- 3. التحقق من تحديث كلمات المرور
SELECT 'بعد التحديث:' as after_update;
SELECT id, email, raw_user_meta_data->>'username' as username, created_at
FROM auth.users 
WHERE email IN ('muslimalmulali@gmail.com', 'muslimakkeel@gmail.com');

-- 4. التحقق من وجود المستخدمين في جدول users العام
SELECT 'جدول users العام:' as public_users;
SELECT * FROM public.users WHERE id IN (
    SELECT id FROM auth.users 
    WHERE email IN ('muslimalmulali@gmail.com', 'muslimakkeel@gmail.com')
);

-- 5. إذا لم يكن المستخدمين موجودين في جدول users، قم بإنشائهم
INSERT INTO public.users (id, email, username, created_at, updated_at)
SELECT 
    au.id,
    au.email,
    au.raw_user_meta_data->>'username' as username,
    au.created_at,
    au.updated_at
FROM auth.users au
WHERE au.email IN ('muslimalmulali@gmail.com', 'muslimakkeel@gmail.com')
AND NOT EXISTS (
    SELECT 1 FROM public.users pu WHERE pu.id = au.id
);