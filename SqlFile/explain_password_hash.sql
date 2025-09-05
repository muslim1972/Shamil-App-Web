-- شرح سبب بقاء عمود password_hash فارغاً في auth.users
-- والفرق بين password_hash و password

-- 1. عرض البنية الفعلية لجدول auth.users
SELECT 
    'auth.users structure' as table_info,
    column_name,
    data_type,
    is_nullable
FROM information_schema.columns 
WHERE table_name = 'users' 
AND table_schema = 'auth'
ORDER BY ordinal_position;

-- 2. عرض البنية الفعلية لجدول public.users
SELECT 
    'public.users structure' as table_info,
    column_name,
    data_type,
    is_nullable
FROM information_schema.columns 
WHERE table_name = 'users' 
AND table_schema = 'public'
ORDER BY ordinal_position;

-- 3. عرض password_hash من auth.users (هذا طبيعي أن يكون مشفراً)
SELECT 
    au.id,
    au.email,
    CASE 
        WHEN au.encrypted_password IS NOT NULL THEN 'HAS_HASH'
        ELSE 'NO_HASH'
    END as password_status,
    LENGTH(au.encrypted_password) as hash_length
FROM auth.users au
ORDER BY au.email;

-- 4. عرض password من public.users (الذي قمنا بتحديثه)
SELECT 
    pu.id,
    pu.email,
    pu.username,
    pu.password,
    CASE 
        WHEN pu.password = '123456' THEN 'DEFAULT_PASSWORD'
        ELSE 'CUSTOM_PASSWORD'
    END as password_type
FROM public.users pu
ORDER BY pu.email;