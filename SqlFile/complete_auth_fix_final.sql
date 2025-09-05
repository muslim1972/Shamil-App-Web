-- إصلاح شامل لمشكلة عدم وجود دوال المصادقة
-- والتي تسبب توقف التطبيق عند تسجيل الدخول

-- 1. حذف جميع الدوال الموجودة أولاً لضمان عدم التعارض
DROP FUNCTION IF EXISTS public.ensure_user_exists(uuid);
DROP FUNCTION IF EXISTS public.ensure_user_exists(user_id uuid);
DROP FUNCTION IF EXISTS public.check_user_exists(uuid);
DROP FUNCTION IF EXISTS public.check_user_exists(user_id uuid);

-- 2. إعادة إنشاء دالة ensure_user_exists بالصيغة الصحيحة
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

-- 3. إعادة إنشاء دالة check_user_exists بالصيغة الصحيحة
CREATE OR REPLACE FUNCTION public.check_user_exists(user_uuid uuid)
RETURNS boolean
LANGUAGE sql
SECURITY DEFINER
AS $$
    SELECT EXISTS (SELECT 1 FROM public.users WHERE id = user_uuid);
$$;

-- 4. إنشاء دالة إضافية لضمان وجود المستخدم مع معلومات كاملة
CREATE OR REPLACE FUNCTION public.ensure_user_with_data(
    user_uuid uuid,
    user_email text DEFAULT NULL,
    user_username text DEFAULT NULL
)
RETURNS uuid
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
    result_uuid uuid;
BEGIN
    -- إذا كان المستخدم موجوداً، حدث البيانات
    IF EXISTS (SELECT 1 FROM public.users WHERE id = user_uuid) THEN
        UPDATE public.users 
        SET 
            email = COALESCE(user_email, email),
            username = COALESCE(user_username, username),
            updated_at = timezone('utc'::text, now())
        WHERE id = user_uuid;
        RETURN user_uuid;
    END IF;
    
    -- إذا لم يكن موجوداً، أضفه
    INSERT INTO public.users (id, email, username, password)
    SELECT 
        au.id,
        COALESCE(user_email, au.email),
        COALESCE(user_username, au.raw_user_meta_data->>'username', split_part(au.email, '@', 1)),
        '123456'
    FROM auth.users au
    WHERE au.id = user_uuid
    ON CONFLICT (id) DO UPDATE SET
        email = COALESCE(user_email, EXCLUDED.email),
        username = COALESCE(user_username, EXCLUDED.username),
        updated_at = timezone('utc'::text, now())
    RETURNING id INTO result_uuid;
    
    RETURN result_uuid;
END;
$$;

-- 5. منح الصلاحيات للأدوار المطلوبة
GRANT EXECUTE ON FUNCTION public.ensure_user_exists(uuid) TO authenticated;
GRANT EXECUTE ON FUNCTION public.check_user_exists(uuid) TO authenticated;
GRANT EXECUTE ON FUNCTION public.ensure_user_with_data(uuid, text, text) TO authenticated;
GRANT EXECUTE ON FUNCTION public.ensure_user_exists(uuid) TO service_role;
GRANT EXECUTE ON FUNCTION public.check_user_exists(uuid) TO service_role;
GRANT EXECUTE ON FUNCTION public.ensure_user_with_data(uuid, text, text) TO service_role;

-- 6. منح الصلاحيات لجميع المستخدمين
GRANT ALL ON public.users TO authenticated;
GRANT ALL ON public.users TO service_role;

-- 7. التحقق من أن جميع الدوال تم إنشاؤها بنجاح
SELECT 
    routine_name,
    routine_schema,
    string_agg(p.parameter_name || ' ' || p.data_type, ', ' ORDER BY p.parameter_name) as parameters
FROM information_schema.routines r
LEFT JOIN information_schema.parameters p ON r.specific_name = p.specific_name
WHERE routine_name IN ('ensure_user_exists', 'check_user_exists', 'ensure_user_with_data')
AND routine_schema = 'public'
GROUP BY routine_name, routine_schema
ORDER BY routine_name;

-- 8. التحقق من وجود البيانات للمستخدمين الثلاثة
SELECT 
    id,
    email,
    username,
    password,
    created_at
FROM public.users 
WHERE id IN (
    'ac2c7067-e91d-4c5a-bdc2-60f9953d5511', -- muslimalmulali@gmail.com
    '51badf47-5a8f-484f-a790-1fcb12958fc1', -- muslimakkeel@gmail.com
    '6c4ceb61-d307-457e-a527-2c3c61d26103'  -- lumaalbahadli@gmail.com
)
ORDER BY email;