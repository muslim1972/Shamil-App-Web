-- التحقق من كلمة المرور للمستخدم
-- نفذ هذا في Supabase SQL Editor

-- عرض تفاصيل المستخدم
SELECT 
    id,
    email,
    encrypted_password IS NOT NULL as has_password,
    email_confirmed_at,
    created_at,
    last_sign_in_at,
    raw_user_meta_data
FROM auth.users 
WHERE email = 'muslimalmulali@gmail.com';

-- إذا كانت كلمة المرور مفقودة، يمكنك إعادة تعيينها
-- (هذا يتطلب service_role key أو admin access)

-- البديل: استخدم Supabase Dashboard -> Authentication -> Users
-- ابحث عن المستخدم واضغط على "Reset Password"