-- إصلاح مشكلة عدم وجود دالة ensure_user_exists
-- والتي تسبب توقف التطبيق عند تسجيل الدخول

-- 1. التحقق من وجود الدالة
SELECT 
    routine_name,
    routine_schema,
    data_type as return_type,
    parameter_name,
    parameter_mode,
    data_type as parameter_type
FROM information_schema.routines r
LEFT JOIN information_schema.parameters p ON r.specific_name = p.specific_name
WHERE routine_name = 'ensure_user_exists'
AND routine_schema = 'public';

-- 2. حذف الدالة القديمة إذا كانت موجودة
DROP FUNCTION IF EXISTS public.ensure_user_exists(user_id uuid);
DROP FUNCTION IF EXISTS public.ensure_user_exists(uuid);

-- 3. إعادة إنشاء الدالة بالصيغة الصحيحة
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

-- 4. إنشاء دالة check_user_exists أيضاً
CREATE OR REPLACE FUNCTION public.check_user_exists(user_uuid uuid)
RETURNS boolean
LANGUAGE sql
SECURITY DEFINER
AS $$
    SELECT EXISTS (SELECT 1 FROM public.users WHERE id = user_uuid);
$$;

-- 5. منح الصلاحيات
GRANT EXECUTE ON FUNCTION public.ensure_user_exists(uuid) TO authenticated;
GRANT EXECUTE ON FUNCTION public.check_user_exists(uuid) TO authenticated;
GRANT EXECUTE ON FUNCTION public.ensure_user_exists(uuid) TO service_role;
GRANT EXECUTE ON FUNCTION public.check_user_exists(uuid) TO service_role;

-- 6. التحقق من أن الدوال تم إنشاؤها بنجاح
SELECT 
    routine_name,
    routine_schema,
    parameter_name,
    data_type
FROM information_schema.routines r
LEFT JOIN information_schema.parameters p ON r.specific_name = p.specific_name
WHERE routine_name IN ('ensure_user_exists', 'check_user_exists')
AND routine_schema = 'public'
ORDER BY routine_name, parameter_name;