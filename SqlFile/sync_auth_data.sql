-- مزامنة البيانات من auth.users إلى public.users
-- استخراج username من raw_user_meta_data وتحديث الجدول public.users

-- 1. حذف الدوال الموجودة أولاً
DROP FUNCTION IF EXISTS public.ensure_user_exists(uuid);
DROP FUNCTION IF EXISTS public.check_user_exists(uuid);

-- 2. التأكد من وجود جميع الأعمدة المطلوبة
ALTER TABLE public.users 
ADD COLUMN IF NOT EXISTS password VARCHAR(255);

-- 3. تحديث البيانات من auth.users بما في ذلك username من raw_user_meta_data
UPDATE public.users 
SET 
    email = COALESCE(
        (SELECT au.email FROM auth.users au WHERE au.id = users.id),
        users.email
    ),
    username = COALESCE(
        (SELECT au.raw_user_meta_data->>'username' FROM auth.users au WHERE au.id = users.id),
        users.username,
        split_part(users.email, '@', 1)
    ),
    password = COALESCE(password, '123456')
WHERE EXISTS (SELECT 1 FROM auth.users au WHERE au.id = users.id);

-- 4. إضافة أي مستخدمين جدد من auth.users مع username الصحيح من raw_user_meta_data
INSERT INTO public.users (id, email, username, password) 
SELECT 
    au.id,
    au.email,
    COALESCE(au.raw_user_meta_data->>'username', split_part(au.email, '@', 1)),
    '123456'
FROM auth.users au
WHERE NOT EXISTS (SELECT 1 FROM public.users WHERE id = au.id);

-- 5. التحقق من البيانات المزامنة
SELECT 
    u.id,
    u.email,
    u.username,
    u.password,
    au.raw_user_meta_data->>'username' as username_from_auth,
    au.encrypted_password as password_hash_in_auth
FROM public.users u
JOIN auth.users au ON u.id = au.id
ORDER BY u.email;

-- 6. إنشاء دوال المصادقة المحدثة
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
    
    -- إذا لم يكن موجوداً، أضفه من auth.users مع username من raw_user_meta_data
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

-- 7. منح الصلاحيات
GRANT ALL ON public.users TO authenticated;
GRANT ALL ON public.users TO service_role;
GRANT EXECUTE ON FUNCTION public.ensure_user_exists(uuid) TO authenticated;
GRANT EXECUTE ON FUNCTION public.check_user_exists(uuid) TO authenticated;

-- 8. عرض النتائج النهائية للتحقق
SELECT 
    u.id,
    u.email,
    u.username,
    u.password,
    u.created_at
FROM public.users u
ORDER BY u.email;