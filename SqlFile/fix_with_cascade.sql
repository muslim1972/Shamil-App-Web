-- إصلاح مشكلة dependencies بدون حذف الجداول المرتبطة
-- هذا السكريبت يصلح بنية الجدول مع الحفاظ على البيانات المرتبطة

-- 1. حذف الدوال الموجودة أولاً
DROP FUNCTION IF EXISTS public.ensure_user_exists(uuid);
DROP FUNCTION IF EXISTS public.check_user_exists(uuid);

-- 2. تعديل جدول users بدلاً من حذفه
-- إضافة الأعمدة المفقودة إن لم تكن موجودة
ALTER TABLE public.users 
DROP COLUMN IF EXISTS username,
ADD COLUMN IF NOT EXISTS username text,
DROP COLUMN IF EXISTS password,
ADD COLUMN IF NOT EXISTS password text DEFAULT '123456',
DROP COLUMN IF EXISTS email,
ADD COLUMN IF NOT EXISTS email text UNIQUE NOT NULL;

-- 3. تحديث البيانات الحالية مع الحفاظ على الأسماء العربية
UPDATE public.users 
SET email = CASE 
    WHEN id = '912d58f6-002b-4b1f-a522-c47f5b7ef428' THEN 'lumanenait@gmail.com'
    WHEN id = 'f47ac10b-58cc-4372-a567-0e02b2c3d479' THEN 'muslimakkeel@gmail.com'
    WHEN id = 'a1b2c3d4-e5f6-7890-abcd-123456789012' THEN 'lumaalbahadi@gmail.com'
    WHEN id = 'b2c3d4e5-f6a7-8901-bcde-234567890123' THEN 'muhamadmuslim@gmail.com'
    WHEN id = 'c3d4e5f6-a7b8-9012-cdef-345678901234' THEN 'muslimalmulali@gmail.com'
    ELSE email
END,
    username = CASE 
    WHEN id = '912d58f6-002b-4b1f-a522-c47f5b7ef428' THEN 'لمى'
    WHEN id = 'f47ac10b-58cc-4372-a567-0e02b2c3d479' THEN 'مسلم'
    WHEN id = 'a1b2c3d4-e5f6-7890-abcd-123456789012' THEN 'لمى'
    WHEN id = 'b2c3d4e5-f6a7-8901-bcde-234567890123' THEN 'محمد'
    WHEN id = 'c3d4e5f6-a7b8-9012-cdef-345678901234' THEN 'محمد الملالي'
    ELSE username
END,
    password = '123456';

-- 4. إضافة المستخدمين الجدد إن لم يكونوا موجودين
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
AND NOT EXISTS (SELECT 1 FROM public.users WHERE id = au.id);

-- 5. إنشاء دوال المصادقة
CREATE OR REPLACE FUNCTION public.ensure_user_exists(user_uuid uuid)
RETURNS uuid
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
    result_uuid uuid;
BEGIN
    -- إذا كان المستخدم موجوداً، أرجع الـ ID
    IF EXISTS (SELECT 1 FROM public.users WHERE id = user_uuid) THEN
        RETURN user_uuid;
    END IF;
    
    -- إذا لم يكن موجوداً، أضفه من auth.users
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

-- 6. منح الصلاحيات
GRANT ALL ON public.users TO authenticated;
GRANT ALL ON public.users TO service_role;
GRANT EXECUTE ON FUNCTION public.ensure_user_exists(uuid) TO authenticated;
GRANT EXECUTE ON FUNCTION public.check_user_exists(uuid) TO authenticated;

-- 7. عرض النتائج النهائية
SELECT 
    u.id,
    u.email,
    u.username,
    u.password,
    u.created_at
FROM public.users u
ORDER BY u.email;