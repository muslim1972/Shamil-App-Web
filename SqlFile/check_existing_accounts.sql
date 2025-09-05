-- التحقق من جميع الحسابات الموجودة
-- نفذ هذا في Supabase SQL Editor

-- 1. عرض جميع المستخدمين في auth.users
SELECT 
    id,
    email,
    created_at,
    last_sign_in_at,
    email_confirmed_at IS NOT NULL as email_confirmed
FROM auth.users 
ORDER BY created_at DESC;

-- 2. عرض جميع المستخدمين في public.users
SELECT 
    id,
    email,
    username,
    display_name,
    created_at
FROM public.users 
ORDER BY created_at DESC;

-- 3. البحث عن أي حسابات تحتوي على "test"
SELECT 
    id,
    email,
    created_at
FROM auth.users 
WHERE email LIKE '%test%' 
ORDER BY created_at DESC;