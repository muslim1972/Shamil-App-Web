-- إنشاء دالة ensure_user_exists لضمان وجود المستخدم في جدول public.users
CREATE OR REPLACE FUNCTION public.ensure_user_exists(user_uuid uuid)
RETURNS boolean AS $$
DECLARE
    user_email text;
    user_metadata jsonb;
    username_value text;
    display_name_value text;
BEGIN
    -- التحقق من وجود المستخدم في جدول auth.users
    SELECT email, raw_user_meta_data INTO user_email, user_metadata
    FROM auth.users 
    WHERE id = user_uuid;
    
    IF user_email IS NULL THEN
        RETURN false;
    END IF;
    
    -- التحقق من وجود المستخدم في جدول public.users
    IF NOT EXISTS (SELECT 1 FROM public.users WHERE id = user_uuid) THEN
        -- استخراج اسم المستخدم من metadata أو البريد الإلكتروني
        username_value := COALESCE(
            user_metadata->>'username',
            user_metadata->>'display_name',
            SPLIT_PART(user_email, '@', 1)
        );
        
        display_name_value := COALESCE(
            user_metadata->>'display_name',
            user_metadata->>'username',
            SPLIT_PART(user_email, '@', 1)
        );
        
        -- إضافة المستخدم إلى جدول public.users
        INSERT INTO public.users (
            id, 
            email, 
            username, 
            display_name, 
            created_at, 
            updated_at
        ) VALUES (
            user_uuid,
            user_email,
            username_value,
            display_name_value,
            NOW(),
            NOW()
        );
        
        RETURN true;
    END IF;
    
    RETURN true;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- منح الصلاحيات
GRANT EXECUTE ON FUNCTION public.ensure_user_exists(uuid) TO authenticated;
GRANT EXECUTE ON FUNCTION public.ensure_user_exists(uuid) TO service_role;

-- دالة مساعدة للتحقق من وجود المستخدم
CREATE OR REPLACE FUNCTION public.check_user_exists(p_user_id uuid)
RETURNS boolean AS $$
BEGIN
    RETURN EXISTS (SELECT 1 FROM public.users WHERE id = p_user_id);
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

GRANT EXECUTE ON FUNCTION public.check_user_exists(uuid) TO authenticated;
GRANT EXECUTE ON FUNCTION public.check_user_exists(uuid) TO service_role;