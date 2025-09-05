-- إصلاح شامل لمشكلة تسجيل الخروج الفوري بعد تسجيل الدخول
-- هذا السكربت يعالج جميع المشاكل المتعلقة بجدول users والدوال

-- 1. إنشاء جدول users بشكل كامل إذا لم يكن موجوداً
CREATE TABLE IF NOT EXISTS users (
    id uuid PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
    username text,
    email text UNIQUE,
    created_at timestamptz DEFAULT NOW(),
    updated_at timestamptz DEFAULT NOW()
);

-- 2. إضافة الأعمدة المفقودة إذا كان الجدول موجوداً
DO $$
BEGIN
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'users' AND column_name = 'created_at') THEN
        ALTER TABLE users ADD COLUMN created_at timestamptz DEFAULT NOW();
    END IF;
    
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'users' AND column_name = 'updated_at') THEN
        ALTER TABLE users ADD COLUMN updated_at timestamptz DEFAULT NOW();
    END IF;
END$$;

-- 3. إنشاء دالة ensure_user_exists مع معالجة الأخطاء
CREATE OR REPLACE FUNCTION ensure_user_exists(user_id uuid)
RETURNS boolean AS $$
DECLARE
    user_exists boolean := false;
BEGIN
    -- التحقق من وجود المستخدم في جدول users
    SELECT EXISTS (SELECT 1 FROM users WHERE id = user_id) INTO user_exists;
    
    -- إذا لم يكن موجوداً، إنشاؤه
    IF NOT user_exists THEN
        INSERT INTO users (id, username, email, created_at, updated_at)
        SELECT 
            au.id,
            COALESCE(au.raw_user_meta_data->>'username', 
                    COALESCE(au.raw_user_meta_data->>'full_name', 'User')),
            au.email,
            au.created_at,
            au.updated_at
        FROM auth.users au
        WHERE au.id = user_id
        ON CONFLICT (id) DO NOTHING;
        
        -- التحقق من أن الإدراج تم بنجاح
        SELECT EXISTS (SELECT 1 FROM users WHERE id = user_id) INTO user_exists;
    END IF;
    
    RETURN user_exists;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 4. إنشاء دالة check_user_exists
CREATE OR REPLACE FUNCTION check_user_exists(p_user_id uuid)
RETURNS boolean AS $$
BEGIN
    RETURN EXISTS (SELECT 1 FROM users WHERE id = p_user_id);
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 5. منح الصلاحيات المناسبة
GRANT EXECUTE ON FUNCTION ensure_user_exists(uuid) TO authenticated;
GRANT EXECUTE ON FUNCTION ensure_user_exists(uuid) TO service_role;
GRANT EXECUTE ON FUNCTION check_user_exists(uuid) TO authenticated;
GRANT EXECUTE ON FUNCTION check_user_exists(uuid) TO service_role;

-- 6. إصلاح سياسات RLS لجدول users
-- إزالة السياسات القديمة إذا كانت موجودة
DROP POLICY IF EXISTS "Users can read own profile" ON users;
DROP POLICY IF EXISTS "Users can update own profile" ON users;
DROP POLICY IF EXISTS "Enable read access for all users" ON users;
DROP POLICY IF EXISTS "Enable insert for authenticated users only" ON users;

-- إنشاء سياسات جديدة
CREATE POLICY "Enable read access for all users" ON users
    FOR SELECT USING (true);

CREATE POLICY "Enable insert for authenticated users only" ON users
    FOR INSERT WITH CHECK (auth.uid() = id);

CREATE POLICY "Enable update for users based on id" ON users
    FOR UPDATE USING (auth.uid() = id);

-- 7. مزامنة جميع المستخدمين من auth.users إلى users
INSERT INTO users (id, username, email, created_at, updated_at)
SELECT 
    au.id,
    COALESCE(au.raw_user_meta_data->>'username', 
            COALESCE(au.raw_user_meta_data->>'full_name', 'User')),
    au.email,
    au.created_at,
    au.updated_at
FROM auth.users au
LEFT JOIN users u ON au.id = u.id
WHERE u.id IS NULL
ON CONFLICT (id) DO NOTHING;

-- 8. التحقق من النتائج
SELECT 
    'users table count: ' || COUNT(*) as result
FROM users;

SELECT 
    'auth.users count: ' || COUNT(*) as result
FROM auth.users;

-- 9. اختبار الدوال
SELECT ensure_user_exists((SELECT id FROM auth.users LIMIT 1));
SELECT check_user_exists((SELECT id FROM auth.users LIMIT 1));