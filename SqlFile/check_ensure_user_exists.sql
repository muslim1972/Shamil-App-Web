-- التحقق من وجود وظيفة ensure_user_exists وإصلاحها إذا لزم الأمر

-- 1. التحقق من وجود الوظيفة
SELECT 
    routine_name,
    routine_definition
FROM information_schema.routines 
WHERE routine_name = 'ensure_user_exists';

-- 2. عرض هيكل جدول users الفعلي
SELECT 
    column_name, 
    data_type, 
    is_nullable,
    column_default
FROM information_schema.columns 
WHERE table_name = 'users'
ORDER BY ordinal_position;

-- 3. التحقق من وجود جدول users
SELECT * FROM information_schema.tables 
WHERE table_schema = 'public' AND table_name = 'users';

-- 4. عرض بيانات المستخدمين الحاليين
SELECT COUNT(*) as user_count FROM users;

-- 5. إعادة إنشاء الوظيفة بشكل صحيح مع التعامل مع أعمدة موجودة فعلاً
CREATE OR REPLACE FUNCTION ensure_user_exists(user_id uuid)
RETURNS void AS $$
BEGIN
    -- التحقق من وجود المستخدم في جدول users
    IF NOT EXISTS (
        SELECT 1 FROM users WHERE id = user_id
    ) THEN
        -- إدراج المستخدم الجديد مع الأعمدة المتوفرة فقط
        INSERT INTO users (id, username, email)
        SELECT 
            user_id,
            COALESCE(raw_user_meta_data->>'username', 'User'),
            email
        FROM auth.users 
        WHERE id = user_id;
    END IF;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 6. منح الصلاحيات المناسبة
GRANT EXECUTE ON FUNCTION ensure_user_exists(uuid) TO authenticated;
GRANT EXECUTE ON FUNCTION ensure_user_exists(uuid) TO service_role;

-- 7. إذا لم يكن جدول users موجوداً، إنشاؤه
CREATE TABLE IF NOT EXISTS users (
    id uuid PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
    username text,
    email text UNIQUE
);

-- 8. اختبار الوظيفة يدوياً
-- SELECT ensure_user_exists('USER_ID_HERE');