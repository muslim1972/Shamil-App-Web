-- إصلاح خطأ syntax error - نسخة مبسطة
-- قم بتشغيل هذا السكريبت كاملاً في مرة واحدة

-- 1. حذف الدوال الموجودة
DROP FUNCTION IF EXISTS public.ensure_user_exists(uuid);
DROP FUNCTION IF EXISTS public.check_user_exists(uuid);

-- 2. حذف الجدول وإعادة إنشائه
DROP TABLE IF EXISTS public.users;

CREATE TABLE public.users (
    id uuid PRIMARY KEY,
    email text UNIQUE NOT NULL,
    username text,
    password text DEFAULT '123456',
    created_at timestamptz DEFAULT now(),
    updated_at timestamptz DEFAULT now()
);

-- 3. إضافة المستخدمين مع الأسماء العربية
INSERT INTO public.users (id, email, username, password) VALUES
('912d58f6-002b-4b1f-a522-c47f5b7ef428', 'lumanenait@gmail.com', 'لمى', '123456'),
('f47ac10b-58cc-4372-a567-0e02b2c3d479', 'muslimakkeel@gmail.com', 'مسلم', '123456'),
('a1b2c3d4-e5f6-7890-abcd-123456789012', 'lumaalbahadi@gmail.com', 'لمى', '123456'),
('b2c3d4e5-f6a7-8901-bcde-234567890123', 'muhamadmuslim@gmail.com', 'محمد', '123456'),
('c3d4e5f6-a7b8-9012-cdef-345678901234', 'muslimalmulali@gmail.com', 'محمد الملالي', '123456')
ON CONFLICT (id) DO NOTHING;

-- 4. إنشاء دوال المصادقة
CREATE OR REPLACE FUNCTION public.ensure_user_exists(user_uuid uuid)
RETURNS uuid AS $$
BEGIN
    RETURN user_uuid;
END;
$$ LANGUAGE plpgsql;

CREATE OR REPLACE FUNCTION public.check_user_exists(user_uuid uuid)
RETURNS boolean AS $$
BEGIN
    RETURN EXISTS (SELECT 1 FROM public.users WHERE id = user_uuid);
END;
$$ LANGUAGE plpgsql;

-- 5. منح الصلاحيات
GRANT ALL ON public.users TO authenticated;
GRANT EXECUTE ON ALL FUNCTIONS IN SCHEMA public TO authenticated;

-- 6. عرض النتائج
SELECT * FROM public.users ORDER BY email;