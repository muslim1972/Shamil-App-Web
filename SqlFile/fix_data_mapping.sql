-- إصلاح تطابق الأعمدة والبيانات بين auth.users و public.users
-- الخطوة 1: حذف البيانات القديمة وتصحيح البنية
DROP TABLE IF EXISTS public.users CASCADE;

-- إنشاء الجدول ببنية صحيحة
CREATE TABLE public.users (
    id uuid PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
    email text UNIQUE NOT NULL,
    username text,
    password text DEFAULT '123456',
    created_at timestamp with time zone DEFAULT timezone('utc'::text, now()),
    updated_at timestamp with time zone DEFAULT timezone('utc'::text, now())
);

-- الخطوة 2: مزامنة البيانات من auth.users
INSERT INTO public.users (id, email, username)
SELECT 
    au.id,
    au.email,
    COALESCE(au.raw_user_meta_data->>'username', split_part(au.email, '@', 1))
FROM auth.users au
ON CONFLICT (id) DO UPDATE SET
    email = EXCLUDED.email,
    username = EXCLUDED.username;

-- الخطوة 3: تصحيح البيانات الحالية بناءً على المعلومات التي أعطيتها
-- تحديث المستخدمين بالمعلومات الصحيحة
UPDATE public.users 
SET username = CASE 
    WHEN email = 'lumanenait@gmail.com' THEN 'لمى'
    WHEN email = 'muslimakkeel@gmail.com' THEN 'مسلم'
    WHEN email = 'lumaalbahadi@gmail.com' THEN 'لمى'
    WHEN email = 'muhamadmuslim@gmail.com' THEN 'محمد'
    WHEN email = 'muslimalmulali@gmail.com' THEN 'محمد الملالي'
    ELSE username
END,
password = '123456'
WHERE email IN ('lumanenait@gmail.com', 'muslimakkeel@gmail.com', 'lumaalbahadi@gmail.com', 'muhamadmuslim@gmail.com', 'muslimalmulali@gmail.com');

-- الخطوة 4: إنشاء الدوال المطلوبة
CREATE OR REPLACE FUNCTION public.ensure_user_exists(user_uuid uuid)
RETURNS uuid
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
    result_uuid uuid;
BEGIN
    INSERT INTO public.users (id, email, username)
    SELECT 
        au.id,
        au.email,
        COALESCE(au.raw_user_meta_data->>'username', split_part(au.email, '@', 1))
    FROM auth.users au
    WHERE au.id = user_uuid
    ON CONFLICT (id) DO UPDATE SET
        email = EXCLUDED.email,
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

-- الخطوة 5: منح الصلاحيات
GRANT ALL ON public.users TO authenticated;
GRANT ALL ON public.users TO service_role;
GRANT EXECUTE ON FUNCTION public.ensure_user_exists(uuid) TO authenticated;
GRANT EXECUTE ON FUNCTION public.check_user_exists(uuid) TO authenticated;

-- الخطوة 6: إنشاء فهرس لتحسين الأداء
CREATE INDEX IF NOT EXISTS idx_users_email ON public.users(email);
CREATE INDEX IF NOT EXISTS idx_users_username ON public.users(username);

-- عرض النتائج
SELECT 
    u.id,
    u.email,
    u.username,
    u.password
FROM public.users u
ORDER BY u.email;