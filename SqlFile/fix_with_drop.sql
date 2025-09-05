-- حل مشكلة تغيير نوع الإرجاع في دالة ensure_user_exists
-- هذا السكربت يحذف الدالة القديمة ثم ينشئها من جديد

-- 1. حذف الدالة القديمة أولاً
DROP FUNCTION IF EXISTS ensure_user_exists(uuid);
DROP FUNCTION IF EXISTS check_user_exists(uuid);

-- 2. إنشاء جدول users بشكل صحيح إذا لم يكن موجوداً
CREATE TABLE IF NOT EXISTS users (
    id uuid PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
    username text,
    email text UNIQUE,
    created_at timestamptz DEFAULT NOW(),
    updated_at timestamptz DEFAULT NOW()
);

-- 3. إضافة الأعمدة المفقودة
DO $$
BEGIN
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'users' AND column_name = 'created_at') THEN
        ALTER TABLE users ADD COLUMN created_at timestamptz DEFAULT NOW();
    END IF;
    
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'users' AND column_name = 'updated_at') THEN
        ALTER TABLE users ADD COLUMN updated_at timestamptz DEFAULT NOW();
    END IF;
    
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'users' AND column_name = 'email') THEN
        ALTER TABLE users ADD COLUMN email text UNIQUE;
    END IF;
END$$;

-- 4. إنشاء الدالة ensure_user_exists من جديد
CREATE OR REPLACE FUNCTION ensure_user_exists(user_id uuid)
RETURNS boolean AS $$
DECLARE
    user_exists boolean := false;
BEGIN
    -- التحقق من وجود المستخدم
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
        
        -- التحقق من الإدراج
        SELECT EXISTS (SELECT 1 FROM users WHERE id = user_id) INTO user_exists;
    END IF;
    
    RETURN user_exists;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 5. إنشاء دالة check_user_exists
CREATE OR REPLACE FUNCTION check_user_exists(p_user_id uuid)
RETURNS boolean AS $$
BEGIN
    RETURN EXISTS (SELECT 1 FROM users WHERE id = p_user_id);
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 6. منح الصلاحيات
GRANT EXECUTE ON FUNCTION ensure_user_exists(uuid) TO authenticated;
GRANT EXECUTE ON FUNCTION ensure_user_exists(uuid) TO service_role;
GRANT EXECUTE ON FUNCTION check_user_exists(uuid) TO authenticated;
GRANT EXECUTE ON FUNCTION check_user_exists(uuid) TO service_role;

-- 7. مزامنة جميع المستخدمين
INSERT INTO users (id, username, email, created_at, updated_at)
SELECT 
    au.id,
    COALESCE(au.raw_user_meta_data->>'username', 
            COALESCE(au.raw_user_meta_data->>'full_name', split_part(au.email, '@', 1))),
    au.email,
    au.created_at,
    au.updated_at
FROM auth.users au
LEFT JOIN users u ON au.id = u.id
WHERE u.id IS NULL
ON CONFLICT (id) DO NOTHING;

-- 8. التحقق من النتائج
SELECT 'تم إصلاح قاعدة البيانات بنجاح!' as status;
SELECT COUNT(*) as "عدد المستخدمين في جدول users" FROM users;
SELECT COUNT(*) as "عدد المستخدمين في auth.users" FROM auth.users;

-- 9. اختبار الدوال
SELECT ensure_user_exists((SELECT id FROM auth.users LIMIT 1)) as "اختبار ensure_user_exists";
SELECT check_user_exists((SELECT id FROM auth.users LIMIT 1)) as "اختبار check_user_exists";