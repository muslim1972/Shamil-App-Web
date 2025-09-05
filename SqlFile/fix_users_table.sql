-- إصلاح جدول users ووظيفة ensure_user_exists

-- أولاً: التحقق من هيكل جدول users الحالي
SELECT 
    column_name, 
    data_type, 
    is_nullable,
    column_default
FROM information_schema.columns 
WHERE table_name = 'users'
ORDER BY ordinal_position;

-- إذا كان الجدول موجوداً لكنه يفتقد إلى الأعمدة الصحيحة
-- إنشاء جدول users بشكل صحيح
CREATE TABLE IF NOT EXISTS users (
    id uuid PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
    username text,
    email text UNIQUE,
    created_at timestamptz DEFAULT NOW(),
    updated_at timestamptz DEFAULT NOW()
);

-- إضافة الأعمدة المفقودة إذا كان الجدول موجوداً بالفعل
DO $$
BEGIN
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'users' AND column_name = 'created_at') THEN
        ALTER TABLE users ADD COLUMN created_at timestamptz DEFAULT NOW();
    END IF;
    
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'users' AND column_name = 'updated_at') THEN
        ALTER TABLE users ADD COLUMN updated_at timestamptz DEFAULT NOW();
    END IF;
END$$;

-- إعادة إنشاء وظيفة ensure_user_exists بالشكل الصحيح
CREATE OR REPLACE FUNCTION ensure_user_exists(user_id uuid)
RETURNS void AS $$
BEGIN
    -- التحقق من وجود المستخدم في جدول users
    IF NOT EXISTS (
        SELECT 1 FROM users WHERE id = user_id
    ) THEN
        -- إدراج المستخدم الجديد مع الأعمدة الصحيحة
        INSERT INTO users (id, username, email, created_at, updated_at)
        SELECT 
            user_id,
            COALESCE(raw_user_meta_data->>'username', 'User'),
            email,
            NOW(),
            NOW()
        FROM auth.users 
        WHERE id = user_id
        ON CONFLICT (id) DO NOTHING;
    END IF;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- منح الصلاحيات المناسبة
GRANT EXECUTE ON FUNCTION ensure_user_exists(uuid) TO authenticated;
GRANT EXECUTE ON FUNCTION ensure_user_exists(uuid) TO service_role;

-- التحقق من وجود وظيفة check_user_exists أيضاً
CREATE OR REPLACE FUNCTION check_user_exists(p_user_id uuid)
RETURNS boolean AS $$
BEGIN
    RETURN EXISTS (
        SELECT 1 FROM users WHERE id = p_user_id
    );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

GRANT EXECUTE ON FUNCTION check_user_exists(uuid) TO authenticated;
GRANT EXECUTE ON FUNCTION check_user_exists(uuid) TO service_role;

-- التحقق من أن كل المستخدمين في auth.users لديهم إدخال في جدول users
INSERT INTO users (id, username, email, created_at, updated_at)
SELECT 
    au.id,
    COALESCE(au.raw_user_meta_data->>'username', 'User'),
    au.email,
    au.created_at,
    au.updated_at
FROM auth.users au
LEFT JOIN users u ON au.id = u.id
WHERE u.id IS NULL
ON CONFLICT (id) DO NOTHING;

-- التحقق من النتائج
SELECT 
    'users table count: ' || COUNT(*) as result
FROM users;

SELECT 
    'auth.users count: ' || COUNT(*) as result
FROM auth.users;