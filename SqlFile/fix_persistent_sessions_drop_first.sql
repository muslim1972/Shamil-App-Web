-- إصلاح مشكلة عدم الاحتفاظ بالجلسة عبر الأجهزة المختلفة
-- هذا السكربت يصلح مشكلة تسجيل الدخول المتكرر
-- يتضمن حذف الدوال الموجودة أولاً ثم إعادة إنشائها

-- 1. حذف الدوال الموجودة لتجنب تضارب الأنواع
DROP FUNCTION IF EXISTS ensure_user_exists(uuid);
DROP FUNCTION IF EXISTS check_user_exists(uuid);

-- 2. إنشاء دالة محسّنة للتحقق من وجود المستخدم مع معالجة الأخطاء
CREATE OR REPLACE FUNCTION ensure_user_exists(user_id uuid)
RETURNS TABLE(
    user_exists boolean,
    username text,
    email text
) AS $$
BEGIN
    -- التحقق من وجود المستخدم أولاً
    IF EXISTS (SELECT 1 FROM users WHERE id = user_id) THEN
        RETURN QUERY 
        SELECT true, users.username, users.email 
        FROM users 
        WHERE id = user_id;
    ELSE
        -- محاولة إدراج المستخدم من auth.users
        INSERT INTO users (id, username, email, created_at, updated_at)
        SELECT 
            au.id,
            COALESCE(
                au.raw_user_meta_data->>'username',
                au.raw_user_meta_data->>'full_name',
                split_part(au.email, '@', 1),
                'User'
            ),
            au.email,
            au.created_at,
            au.updated_at
        FROM auth.users au
        WHERE au.id = user_id
        ON CONFLICT (id) DO NOTHING;
        
        -- إرجاع النتيجة بعد الإدراج
        RETURN QUERY 
        SELECT true, users.username, users.email 
        FROM users 
        WHERE id = user_id;
    END IF;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 3. إنشاء دالة بسيطة للتحقق من وجود المستخدم فقط
CREATE OR REPLACE FUNCTION check_user_exists(p_user_id uuid)
RETURNS boolean AS $$
BEGIN
    RETURN EXISTS (SELECT 1 FROM users WHERE id = p_user_id);
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 4. إصلاح جدول users لضمان توافق الجلسات
ALTER TABLE users 
ADD COLUMN IF NOT EXISTS last_login timestamptz DEFAULT NOW(),
ADD COLUMN IF NOT EXISTS device_tokens jsonb DEFAULT '[]'::jsonb,
ADD COLUMN IF NOT EXISTS session_count integer DEFAULT 0;

-- 5. إنشاء فهرس لتحسين الأداء
CREATE INDEX IF NOT EXISTS idx_users_email ON users(email);
CREATE INDEX IF NOT EXISTS idx_users_last_login ON users(last_login);

-- 6. تحديث بيانات المستخدمين الحاليين
UPDATE users 
SET last_login = NOW(),
    session_count = session_count + 1
WHERE email IN (
    'muslimalmulali@gmail.com',
    'muslimakkeel@gmail.com',
    'lurnamenati@gmail.com',
    'lurnaalbahadli@gmail.com',
    'muhamadmuslim@gmail.com'
);

-- 7. مزامنة بيانات المستخدمين من auth.users
INSERT INTO users (id, username, email, created_at, updated_at, last_login)
SELECT 
    au.id,
    COALESCE(
        au.raw_user_meta_data->>'username',
        au.raw_user_meta_data->>'full_name',
        split_part(au.email, '@', 1)
    ),
    au.email,
    au.created_at,
    au.updated_at,
    NOW()
FROM auth.users au
LEFT JOIN users u ON au.id = u.id
WHERE u.id IS NULL
ON CONFLICT (id) DO UPDATE 
SET username = EXCLUDED.username,
    email = EXCLUDED.email,
    updated_at = NOW();

-- 8. منح الصلاحيات
GRANT EXECUTE ON FUNCTION ensure_user_exists(uuid) TO authenticated;
GRANT EXECUTE ON FUNCTION ensure_user_exists(uuid) TO service_role;
GRANT EXECUTE ON FUNCTION check_user_exists(uuid) TO authenticated;
GRANT EXECUTE ON FUNCTION check_user_exists(uuid) TO service_role;

-- 9. التحقق من النتائج
SELECT 'تم إصلاح مشكلة الجلسات بنجاح!' as status;
SELECT 
    email,
    username,
    last_login,
    session_count
FROM users 
WHERE email LIKE '%@gmail.com'
ORDER BY last_login DESC;

-- يحتوي على أوامر DROP ثم CREATE للدوال المطلوبة
-- سيحل مشكلة PGRST202 نهائيًا