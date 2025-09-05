-- إضافة المستخدم muslimakeel@yahoo.com إلى جدول public.users
-- أولاً: الحصول على user_id من auth.users
SELECT id, email FROM auth.users WHERE email = 'muslimakeel@yahoo.com';

-- ثانياً: إذا لم يكن موجوداً في public.users، أضفه
INSERT INTO public.users (id, email, username, display_name, created_at, updated_at)
SELECT 
    id,
    email,
    COALESCE(raw_user_meta_data->>'username', SPLIT_PART(email, '@', 1)),
    COALESCE(raw_user_meta_data->>'display_name', SPLIT_PART(email, '@', 1)),
    created_at,
    updated_at
FROM auth.users 
WHERE email = 'muslimakeel@yahoo.com'
AND NOT EXISTS (SELECT 1 FROM public.users WHERE public.users.id = auth.users.id);

-- ثالثاً: التحقق من الإضافة
SELECT * FROM public.users WHERE email = 'muslimakeel@yahoo.com';