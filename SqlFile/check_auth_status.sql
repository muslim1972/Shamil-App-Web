-- التحقق من حالة المصادقة للمستخدمين
-- نفذ هذا في Supabase SQL Editor

-- 1. التحقق من المستخدمين في auth.users
SELECT 
    id,
    email,
    email_confirmed_at,
    phone_confirmed_at,
    confirmed_at,
    created_at,
    updated_at,
    last_sign_in_at,
    raw_user_meta_data
FROM auth.users 
WHERE email IN ('muslimalmulali@gmail.com', 'muslimakkeel@gmail.com')
ORDER BY email;

-- 2. التحقق من المستخدمين في public.users
SELECT 
    id,
    email,
    username,
    display_name,
    created_at
FROM public.users 
WHERE email IN ('muslimalmulali@gmail.com', 'muslimakkeel@gmail.com')
ORDER BY email;

-- 3. عرض جميع المستخدمين في auth.users
SELECT 
    email,
    email_confirmed_at IS NOT NULL as email_confirmed,
    confirmed_at IS NOT NULL as account_confirmed,
    last_sign_in_at
FROM auth.users 
ORDER BY created_at;