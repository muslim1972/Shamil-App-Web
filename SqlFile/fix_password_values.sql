-- إصلاح قيم password وتوضيح الفرق بين password_hash و password
-- 
-- password_hash: يوجد في auth.users ويحتوي على كلمة المرور المشفرة (bcrypt)
-- password: يوجد في public.users ويحتوي على كلمة المرور البسيطة (للعرض فقط)

-- 1. حذف الدوال الموجودة أولاً
DROP FUNCTION IF EXISTS public.ensure_user_exists(uuid);
DROP FUNCTION IF EXISTS public.check_user_exists(uuid);

-- 2. التأكد من وجود عمود password
ALTER TABLE public.users 
ADD COLUMN IF NOT EXISTS password VARCHAR(255);

-- 3. تحديث البيانات باستخدام الـ IDs الفعلية من قاعدة البيانات
UPDATE public.users 
SET 
    email = CASE 
        WHEN id = '6c4ceb61-d307-457e-a527-2c3c61d26103' THEN 'lumaalbahadli@gmail.com'
        WHEN id = '1b9ec129-1c1a-4d1c-bc55-290d71a548c4' THEN 'lumamenati@gmail.com'
        WHEN id = '9d368383-d7ef-4303-99f9-2ce4e09e23e7' THEN 'muhamadmuslim@gmail.com'
        WHEN id = '51badf47-5a8f-484f-a790-1fcb12958fc1' THEN 'muslimakkeel@gmail.com'
        WHEN id = 'ac2c7067-e91d-4c5a-bdc2-60f9953d5511' THEN 'muslimalmulali@gmail.com'
        ELSE email
    END,
    username = CASE 
        WHEN id = '6c4ceb61-d307-457e-a527-2c3c61d26103' THEN 'ام سجاد'
        WHEN id = '1b9ec129-1c1a-4d1c-bc55-290d71a548c4' THEN 'لمى'
        WHEN id = '9d368383-d7ef-4303-99f9-2ce4e09e23e7' THEN 'محمد الملالي'
        WHEN id = '51badf47-5a8f-484f-a790-1fcb12958fc1' THEN 'ابو سجاد العنزي'
        WHEN id = 'ac2c7067-e91d-4c5a-bdc2-60f9953d5511' THEN 'مسلم'
        ELSE username
    END,
    password = '123456'
WHERE id IN ('6c4ceb61-d307-457e-a527-2c3c61d26103', '1b9ec129-1c1a-4d1c-bc55-290d71a548c4', '9d368383-d7ef-4303-99f9-2ce4e09e23e7', '51badf47-5a8f-484f-a790-1fcb12958fc1', 'ac2c7067-e91d-4c5a-bdc2-60f9953d5511');

-- 4. إضافة أي مستخدمين جدد من auth.users
INSERT INTO public.users (id, email, username, password) 
SELECT 
    au.id,
    au.email,
    COALESCE(au.raw_user_meta_data->>'username', split_part(au.email, '@', 1)),
    '123456'
FROM auth.users au
WHERE NOT EXISTS (SELECT 1 FROM public.users WHERE id = au.id);

-- 5. إنشاء دوال المصادقة المحدثة
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

-- 8. عرض معلومات auth.users للمقارنة
SELECT 
    au.id,
    au.email,
    au.encrypted_password as password_hash,
    au.raw_user_meta_data
FROM auth.users au
WHERE au.email IN ('lumaalbahadli@gmail.com', 'lumamenati@gmail.com', 'muhamadmuslim@gmail.com', 'muslimakkeel@gmail.com', 'muslimalmulali@gmail.com')
ORDER BY au.email;