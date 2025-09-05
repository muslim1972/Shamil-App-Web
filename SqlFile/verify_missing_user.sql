-- التحقق من وجود المستخدم المفقود: 912d58f6-002b-4b1f-a522-c47f5b7ef428
-- والتحقق من الاختلافات بين auth.users و public.users

-- 1. البحث عن المستخدم المفقود في auth.users
SELECT 
    'auth.users' as table_name,
    id,
    email,
    raw_user_meta_data->>'username' as username_from_meta,
    created_at,
    updated_at
FROM auth.users 
WHERE id = '912d58f6-002b-4b1f-a522-c47f5b7ef428'

UNION ALL

-- 2. البحث عن المستخدم المفقود في public.users
SELECT 
    'public.users' as table_name,
    id,
    email,
    username,
    created_at,
    updated_at
FROM public.users 
WHERE id = '912d58f6-002b-4b1f-a522-c47f5b7ef428';

-- 3. عرض جميع المستخدمين في auth.users الذين ليس لهم نظير في public.users
SELECT 
    au.id,
    au.email,
    au.raw_user_meta_data->>'username' as username_from_auth,
    au.created_at
FROM auth.users au
LEFT JOIN public.users pu ON au.id = pu.id
WHERE pu.id IS NULL
ORDER BY au.created_at;

-- 4. عرض جميع المستخدمين في public.users مع بياناتهم الكاملة
SELECT 
    id,
    email,
    username,
    password,
    created_at
FROM public.users
ORDER BY email;