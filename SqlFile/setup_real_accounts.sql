-- إنشاء الحسابات الحقيقية التي طلبتها
-- أنفذ هذا الملف في Supabase SQL Editor

-- 1. إنشاء المستخدم الأول: muslimalmulali@gmail.com
INSERT INTO auth.users (
    id, 
    email, 
    encrypted_password, 
    email_confirmed_at, 
    raw_user_meta_data, 
    created_at, 
    updated_at,
    aud,
    role
) VALUES (
    'a1b2c3d4-e5f6-7890-abcd-1234567890ab',
    'muslimalmulali@gmail.com',
    crypt('123456', gen_salt('bf')),
    NOW(),
    '{"username":"مسلم"}',
    NOW(),
    NOW(),
    'authenticated',
    'authenticated'
);

-- 2. إنشاء المستخدم الثاني: muslimakkeel@gmail.com
INSERT INTO auth.users (
    id, 
    email, 
    encrypted_password, 
    email_confirmed_at, 
    raw_user_meta_data, 
    created_at, 
    updated_at,
    aud,
    role
) VALUES (
    'b2c3d4e5-f6g7-8901-bcde-2345678901bc',
    'muslimakkeel@gmail.com',
    crypt('123456', gen_salt('bf')),
    NOW(),
    '{"username":"ابو سجاد العنزي"}',
    NOW(),
    NOW(),
    'authenticated',
    'authenticated'
);

-- 3. إنشاء المستخدم الثالث: lumamenati@gmail.com
INSERT INTO auth.users (
    id, 
    email, 
    encrypted_password, 
    email_confirmed_at, 
    raw_user_meta_data, 
    created_at, 
    updated_at,
    aud,
    role
) VALUES (
    'c3d4e5f6-g7h8-9012-cdef-3456789012cd',
    'lumamenati@gmail.com',
    crypt('123456', gen_salt('bf')),
    NOW(),
    '{"username":"لمى"}',
    NOW(),
    NOW(),
    'authenticated',
    'authenticated'
);

-- 4. إضافة المستخدمين إلى جدول users العام
INSERT INTO public.users (id, email, username, created_at, updated_at) VALUES
('a1b2c3d4-e5f6-7890-abcd-1234567890ab', 'muslimalmulali@gmail.com', 'مسلم', NOW(), NOW()),
('b2c3d4e5-f6g7-8901-bcde-2345678901bc', 'muslimakkeel@gmail.com', 'ابو سجاد العنزي', NOW(), NOW()),
('c3d4e5f6-g7h8-9012-cdef-3456789012cd', 'lumamenati@gmail.com', 'لمى', NOW(), NOW());

-- 5. التحقق من إنشاء الحسابات
SELECT email, raw_user_meta_data->>'username' as username 
FROM auth.users 
WHERE email IN ('muslimalmulali@gmail.com', 'muslimakkeel@gmail.com', 'lumamenati@gmail.com');

-- 6. التحقق من وجودهم في جدول users
SELECT email, username FROM public.users WHERE email IN ('muslimalmulali@gmail.com', 'muslimakkeel@gmail.com', 'lumamenati@gmail.com');