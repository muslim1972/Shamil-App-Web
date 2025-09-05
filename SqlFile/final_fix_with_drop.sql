-- إصلاح شامل يتعامل مع خطأ 42P13 ويصلح بنية البيانات
-- الخطوة 1: حذف الدوال القديمة لتجنب خطأ 42P13
DROP FUNCTION IF EXISTS public.ensure_user_exists(uuid) CASCADE;
DROP FUNCTION IF EXISTS public.check_user_exists(uuid) CASCADE;

-- الخطوة 2: حذف الجدول القديم وإعادة إنشائه بالبنية الصحيحة
DROP TABLE IF EXISTS public.users CASCADE;

CREATE TABLE public.users (
    id uuid PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
    email text UNIQUE NOT NULL,
    username text,
    password text DEFAULT '123456',
    created_at timestamp with time zone DEFAULT timezone('utc'::text, now()),
    updated_at timestamp with time zone DEFAULT timezone('utc'::text, now())
);

-- الخطوة 3: مزامنة البيانات من auth.users مع الأسماء العربية الصحيحة
INSERT INTO public.users (id, email, username, password)
SELECT 
    au.id,
    au.email,
    CASE 
        WHEN au.email = 'lumanenait@gmail.com' THEN 'لمى'
        WHEN au.email = 'muslimakkeel@gmail.com' THEN 'مسلم'
        WHEN au.email = 'lumaalbahadi@gmail.com' THEN 'لمى'
        WHEN au.email = 'muhamadmuslim@gmail.com' THEN 'محمد'
        WHEN au.email = 'muslimalmulali@gmail.com' THEN 'محمد الملالي'
        ELSE COALESCE(au.raw_user_meta_data->>'username', split_part(au.email, '@', 1))
    END,
    '123456'
FROM auth.users au
WHERE au.email IN ('lumanenait@gmail.com', 'muslimakkeel@gmail.com', 'lumaalbahadi@gmail.com', 'muhamadmuslim@gmail.com', 'muslimalmulali@gmail.com')
ON CONFLICT (id) DO UPDATE SET
    email = EXCLUDED.email,
    username = EXCLUDED.username,
    updated_at = timezone('utc'::text, now());

-- الخطوة 4: إنشاء دوال المصادقة مع تصحيح نوع الإرجاع
CREATE OR REPLACE FUNCTION public.ensure_user_exists(user_uuid uuid)
RETURNS uuid
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
    result_uuid uuid;
BEGIN
    INSERT INTO public.users (id, email, username, password)
    SELECT 
        au.id,
        au.email,
        COALESCE(au.raw_user_meta_data->>'username', split_part(au.email, '@', 1)),
        '123456'
    FROM auth.users au
    WHERE au.id = user_uuid
    ON CONFLICT (id) DO UPDATE SET
        email = EXCLUDED.email,
        username = EXCLUDED.username,
        updated_at = timezone('utc'::text, now())
    RETURNING id INTO result_uuid;
    
    RETURN result_uuid;
END;
$$;

CREATE OR REPLACE FUNCTION public.check_user_exists(user_uuid uuid)
RETURNS boolean
LANGUAGE sql
SECURITY DEFINER
AS $$
    SELECT EXISTS (SELECT 1 FROM public.users WHERE id = user_uuid);
$$;

-- الخطوة 5: منح الصلاحيات الضرورية
GRANT ALL ON public.users TO authenticated;
GRANT ALL ON public.users TO service_role;
GRANT EXECUTE ON FUNCTION public.ensure_user_exists(uuid) TO authenticated;
GRANT EXECUTE ON FUNCTION public.check_user_exists(uuid) TO authenticated;

-- الخطوة 6: إنشاء الفهارس لتحسين الأداء
CREATE INDEX IF NOT EXISTS idx_users_email ON public.users(email);
CREATE INDEX IF NOT EXISTS idx_users_username ON public.users(username);

-- الخطوة 7: عرض النتائج النهائية للتحقق
SELECT 
    u.id,
    u.email,
    u.username,
    u.password
FROM public.users u
ORDER BY u.email;

-- الخطوة 8: التحقق من وجود الدوال
SELECT 
    proname as function_name,
    pg_get_function_identity_arguments(oid) as arguments,
    pg_get_function_result(oid) as return_type
FROM pg_proc 
WHERE proname IN ('ensure_user_exists', 'check_user_exists')
AND pronamespace = 'public'::regnamespace;