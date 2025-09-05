-- دالة لضمان إنشاء المستخدم في جدول users عند تسجيل الدخول
CREATE OR REPLACE FUNCTION public.ensure_user_exists()
RETURNS void AS $$
DECLARE
    user_record RECORD;
BEGIN
    -- التحقق من وجود المستخدم في جدول public.users
    IF NOT EXISTS (SELECT 1 FROM public.users WHERE id = auth.uid()) THEN
        -- إضافة المستخدم إلى جدول public.users
        INSERT INTO public.users (id, email, username, display_name, created_at, updated_at)
        SELECT 
            id,
            email,
            COALESCE(raw_user_meta_data->>'username', SPLIT_PART(email, '@', 1)),
            COALESCE(raw_user_meta_data->>'display_name', SPLIT_PART(email, '@', 1)),
            created_at,
            updated_at
        FROM auth.users 
        WHERE id = auth.uid();
    END IF;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- منح الصلاحيات
GRANT EXECUTE ON FUNCTION public.ensure_user_exists() TO authenticated;
GRANT EXECUTE ON FUNCTION public.ensure_user_exists() TO service_role;

-- إنشاء trigger للتأكد من تنفيذ الدالة عند تسجيل الدخول
-- (يمكن استدعاؤها من داخل التطبيق عند تسجيل الدخول)