--44

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

$$
;

CREATE OR REPLACE FUNCTION public.check_user_exists(user_uuid uuid)
RETURNS boolean
LANGUAGE sql
SECURITY DEFINER
AS
$$

    SELECT EXISTS (SELECT 1 FROM public.users WHERE id = user_uuid);

$$
;

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
-------------------------------------------------------
--22 --




-- الإصلاح النهائي الشامل لمشكلات قاعدة البيانات
-- هذا الملف يعالج جميع المشكلات المذكورة: الأعمدة المفقودة، تعارضات الدوال، وإضافة المستخدمين

-- 1. إصلاح جدول users لإضافة الأعمدة المفقودة
DO
$$

BEGIN
-- إضافة عمود username إذا لم يكن موجوداً
IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'users' AND column_name = 'username') THEN
ALTER TABLE public.users ADD COLUMN username text;
END IF;

    -- إضافة عمود display_name إذا لم يكن موجوداً
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'users' AND column_name = 'display_name') THEN
        ALTER TABLE public.users ADD COLUMN display_name text;
    END IF;

    -- إضافة عمود created_at إذا لم يكن موجوداً
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'users' AND column_name = 'created_at') THEN
        ALTER TABLE public.users ADD COLUMN created_at timestamptz DEFAULT NOW();
    END IF;

    -- إضافة عمود updated_at إذا لم يكن موجوداً
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'users' AND column_name = 'updated_at') THEN
        ALTER TABLE public.users ADD COLUMN updated_at timestamptz DEFAULT NOW();
    END IF;

END $$;

-- 2. حذف الدوال القديمة المتعارضة
DROP FUNCTION IF EXISTS public.ensure_user_exists(uuid) CASCADE;
DROP FUNCTION IF EXISTS public.check_user_exists(uuid) CASCADE;

-- 3. إعادة إنشاء الدالة ensure_user_exists مع معالجة الأخطاء
CREATE OR REPLACE FUNCTION public.ensure_user_exists(user_uuid uuid)
RETURNS boolean AS $$
DECLARE
user_email text;
user_metadata jsonb;
username_value text;
display_name_value text;
BEGIN
-- التحقق من وجود المستخدم في جدول auth.users
SELECT email, raw_user_meta_data INTO user_email, user_metadata
FROM auth.users
WHERE id = user_uuid;

    IF user_email IS NULL THEN
        RAISE NOTICE 'المستخدم غير موجود في auth.users: %', user_uuid;
        RETURN false;
    END IF;

    -- التحقق من وجود المستخدم في جدول public.users
    IF NOT EXISTS (SELECT 1 FROM public.users WHERE id = user_uuid) THEN
        -- استخراج اسم المستخدم من metadata أو البريد الإلكتروني
        username_value := COALESCE(
            user_metadata->>'username',
            user_metadata->>'display_name',
            SPLIT_PART(user_email, '@', 1)
        );

        display_name_value := COALESCE(
            user_metadata->>'display_name',
            user_metadata->>'username',
            SPLIT_PART(user_email, '@', 1)
        );

        -- إضافة المستخدم إلى جدول public.users
        INSERT INTO public.users (
            id,
            email,
            username,
            display_name,
            created_at,
            updated_at
        ) VALUES (
            user_uuid,
            user_email,
            username_value,
            display_name_value,
            NOW(),
            NOW()
        );

        RAISE NOTICE 'تم إضافة المستخدم بنجاح: %', user_email;
        RETURN true;
    END IF;

    RETURN true;

END;

$$
LANGUAGE plpgsql SECURITY DEFINER;

-- 4. إعادة إنشاء دالة check_user_exists
CREATE OR REPLACE FUNCTION public.check_user_exists(p_user_id uuid)
RETURNS boolean AS
$$

BEGIN
RETURN EXISTS (SELECT 1 FROM public.users WHERE id = p_user_id);
END;

$$
LANGUAGE plpgsql SECURITY DEFINER;

-- 5. منح الصلاحيات
GRANT EXECUTE ON FUNCTION public.ensure_user_exists(uuid) TO authenticated;
GRANT EXECUTE ON FUNCTION public.ensure_user_exists(uuid) TO service_role;
GRANT EXECUTE ON FUNCTION public.check_user_exists(uuid) TO authenticated;
GRANT EXECUTE ON FUNCTION public.check_user_exists(uuid) TO service_role;

-- 6. إضافة المستخدم muslimakeel@yahoo.com يدوياً إذا لم يكن موجوداً
DO
$$

DECLARE
target_user_id uuid;
BEGIN
-- الحصول على user_id من auth.users
SELECT id INTO target_user_id
FROM auth.users
WHERE email = 'muslimakeel@yahoo.com';

    IF target_user_id IS NOT NULL THEN
        -- التأكد من وجوده في public.users
        IF NOT EXISTS (SELECT 1 FROM public.users WHERE id = target_user_id) THEN
            INSERT INTO public.users (id, email, username, display_name, created_at, updated_at)
            VALUES (
                target_user_id,
                'muslimakeel@yahoo.com',
                'muslimakeel',
                'muslimakeel',
                NOW(),
                NOW()
            );
            RAISE NOTICE 'تم إضافة المستخدم muslimakeel@yahoo.com بنجاح';
        END IF;
    ELSE
        RAISE NOTICE 'لم يتم العثور على المستخدم muslimakeel@yahoo.com في auth.users';
    END IF;

END $$;

-- 7. إصلاح جدول conversations لإضافة الأعمدة المفقودة
DO $$
BEGIN
-- إضافة عمود created_by إذا لم يكن موجوداً
IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'conversations' AND column_name = 'created_by') THEN
ALTER TABLE public.conversations ADD COLUMN created_by uuid REFERENCES public.users(id);
END IF;

    -- إضافة عمود type إذا لم يكن موجوداً
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'conversations' AND column_name = 'type') THEN
        ALTER TABLE public.conversations ADD COLUMN type text DEFAULT 'direct';
    END IF;

END $$;

-- 8. إنشاء محادثة ترحيبية افتراضية للمستخدمين الجدد
DO $$
DECLARE
admin_user_id uuid;
welcome_conversation_id uuid;
BEGIN
-- الحصول على معرف المسؤول (أول مستخدم)
SELECT id INTO admin_user_id FROM public.users ORDER BY created_at ASC LIMIT 1;

    IF admin_user_id IS NOT NULL THEN
        -- إنشاء محادثة ترحيبية
        INSERT INTO public.conversations (title, type, created_by, created_at, updated_at)
        VALUES ('محادثة ترحيبية', 'group', admin_user_id, NOW(), NOW())
        RETURNING id INTO welcome_conversation_id;

        -- إضافة جميع المستخدمين إلى المحادثة
        INSERT INTO public.conversation_participants (conversation_id, user_id, joined_at)
        SELECT welcome_conversation_id, id, NOW()
        FROM public.users;

        -- إضافة رسالة ترحيبية
        INSERT INTO public.messages (conversation_id, sender_id, content, type, created_at)
        VALUES (
            welcome_conversation_id,
            admin_user_id,
            'مرحباً بكم في تطبيق شميل للدردشة! يمكنكم الآن بدء المحادثات بحرية.',
            'text',
            NOW()
        );

        RAISE NOTICE 'تم إنشاء محادثة ترحيبية بنجاح';
    END IF;

END $$;

-- 9. تحديث test_user_conversations.sql ليعمل بدون أخطاء
-- هذا الاستعلام سيعمل بعد التحديثات أعلاه

-----------------------------------------------------

--29

-- الإصلاح النهائي الشامل - بدون أخطاء
-- نسخ هذا الكود وتنفيذه في Supabase SQL Editor

-- 1. حذف أي triggers قد تسبب مشاكل مؤقتاً
DROP TRIGGER IF EXISTS on_message_created ON public.messages;
DROP FUNCTION IF EXISTS public.handle_new_message() CASCADE;

-- 2. إصلاح جدول users لإضافة الأعمدة المفقودة
DO $$
BEGIN
-- إضافة عمود username إذا لم يكن موجوداً
IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'users' AND column_name = 'username') THEN
ALTER TABLE public.users ADD COLUMN username text;
END IF;

    -- إضافة عمود display_name إذا لم يكن موجوداً
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'users' AND column_name = 'display_name') THEN
        ALTER TABLE public.users ADD COLUMN display_name text;
    END IF;

    -- إضافة عمود created_at إذا لم يكن موجوداً
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'users' AND column_name = 'created_at') THEN
        ALTER TABLE public.users ADD COLUMN created_at timestamptz DEFAULT NOW();
    END IF;

    -- إضافة عمود updated_at إذا لم يكن موجوداً
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'users' AND column_name = 'updated_at') THEN
        ALTER TABLE public.users ADD COLUMN updated_at timestamptz DEFAULT NOW();
    END IF;

END $$;

-- 3. حذف الدوال القديمة المتعارضة
DROP FUNCTION IF EXISTS public.ensure_user_exists(uuid) CASCADE;
DROP FUNCTION IF EXISTS public.check_user_exists(uuid) CASCADE;

-- 4. إعادة إنشاء الدالة ensure_user_exists
CREATE OR REPLACE FUNCTION public.ensure_user_exists(user_uuid uuid)
RETURNS boolean AS $$
DECLARE
user_email text;
user_metadata jsonb;
username_value text;
display_name_value text;
BEGIN
-- التحقق من وجود المستخدم في جدول auth.users
SELECT email, raw_user_meta_data INTO user_email, user_metadata
FROM auth.users
WHERE id = user_uuid;

    IF user_email IS NULL THEN
        RAISE NOTICE 'المستخدم غير موجود في auth.users: %', user_uuid;
        RETURN false;
    END IF;

    -- التحقق من وجود المستخدم في جدول public.users
    IF NOT EXISTS (SELECT 1 FROM public.users WHERE id = user_uuid) THEN
        -- استخراج اسم المستخدم من metadata أو البريد الإلكتروني
        username_value := COALESCE(
            user_metadata->>'username',
            user_metadata->>'display_name',
            SPLIT_PART(user_email, '@', 1)
        );

        display_name_value := COALESCE(
            user_metadata->>'display_name',
            user_metadata->>'username',
            SPLIT_PART(user_email, '@', 1)
        );

        -- إضافة المستخدم إلى جدول public.users
        INSERT INTO public.users (
            id,
            email,
            username,
            display_name,
            created_at,
            updated_at
        ) VALUES (
            user_uuid,
            user_email,
            username_value,
            display_name_value,
            NOW(),
            NOW()
        );

        RAISE NOTICE 'تم إضافة المستخدم بنجاح: %', user_email;
        RETURN true;
    END IF;

    RETURN true;

END;

$$
LANGUAGE plpgsql SECURITY DEFINER;

-- 5. إعادة إنشاء دالة check_user_exists
CREATE OR REPLACE FUNCTION public.check_user_exists(p_user_id uuid)
RETURNS boolean AS
$$

BEGIN
RETURN EXISTS (SELECT 1 FROM public.users WHERE id = p_user_id);
END;

$$
LANGUAGE plpgsql SECURITY DEFINER;

-- 6. منح الصلاحيات
GRANT EXECUTE ON FUNCTION public.ensure_user_exists(uuid) TO authenticated;
GRANT EXECUTE ON FUNCTION public.ensure_user_exists(uuid) TO service_role;
GRANT EXECUTE ON FUNCTION public.check_user_exists(uuid) TO authenticated;
GRANT EXECUTE ON FUNCTION public.check_user_exists(uuid) TO service_role;

-- 7. إضافة المستخدمين المطلوبين من auth.users إلى public.users
DO
$$

DECLARE
auth_user RECORD;
BEGIN
-- البحث عن المستخدمين في auth.users الذين ليسوا في public.users
FOR auth_user IN
SELECT au.id, au.email, au.raw_user_meta_data
FROM auth.users au
LEFT JOIN public.users pu ON au.id = pu.id
WHERE pu.id IS NULL
LOOP
-- إضافة المستخدم إلى public.users
INSERT INTO public.users (
id,
email,
username,
display_name,
created_at,
updated_at
) VALUES (
auth_user.id,
auth_user.email,
COALESCE(
auth_user.raw_user_meta_data->>'username',
SPLIT_PART(auth_user.email, '@', 1)
),
COALESCE(
auth_user.raw_user_meta_data->>'display_name',
auth_user.raw_user_meta_data->>'username',
SPLIT_PART(auth_user.email, '@', 1)
),
NOW(),
NOW()
);

        RAISE NOTICE 'تم إضافة المستخدم: %', auth_user.email;
    END LOOP;

END $$;

-- 8. إصلاح جدول conversations لإضافة الأعمدة المفقودة
DO $$
BEGIN
-- إضافة عمود created_by إذا لم يكن موجوداً
IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'conversations' AND column_name = 'created_by') THEN
ALTER TABLE public.conversations ADD COLUMN created_by uuid REFERENCES public.users(id);
END IF;

    -- إضافة عمود type إذا لم يكن موجوداً
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'conversations' AND column_name = 'type') THEN
        ALTER TABLE public.conversations ADD COLUMN type text DEFAULT 'direct';
    END IF;

END $$;

-- 9. إنشاء محادثة ترحيبية بدون trigger
DO $$
DECLARE
admin_user_id uuid;
welcome_conversation_id uuid;
conversation_exists boolean := false;
BEGIN
-- التحقق من وجود محادثة ترحيبية
SELECT EXISTS(
SELECT 1 FROM public.conversations
WHERE name = 'محادثة ترحيبية'
) INTO conversation_exists;

    IF NOT conversation_exists THEN
        -- الحصول على أول مستخدم كمدير
        SELECT id INTO admin_user_id
        FROM public.users
        ORDER BY created_at ASC
        LIMIT 1;

        IF admin_user_id IS NOT NULL THEN
            -- إنشاء المحادثة
            INSERT INTO public.conversations (name, is_group, type, created_by, created_at, updated_at)
            VALUES ('محادثة ترحيبية', true, 'group', admin_user_id, NOW(), NOW())
            RETURNING id INTO welcome_conversation_id;

            -- إضافة جميع المستخدمين
            INSERT INTO public.conversation_members (conversation_id, user_id, joined_at, is_admin)
            SELECT welcome_conversation_id, id, NOW(), (id = admin_user_id)
            FROM public.users;

            -- إضافة رسالة ترحيبية بدون تشغيل trigger
            INSERT INTO public.messages (conversation_id, sender_id, content, message_type, created_at)
            VALUES (
                welcome_conversation_id,
                admin_user_id,
                'مرحباً بكم في تطبيق شميل للدردشة! يمكنكم الآن بدء المحادثات بحرية.',
                'text',
                NOW()
            );

            RAISE NOTICE 'تم إنشاء محادثة ترحيبية بنجاح';
        END IF;
    ELSE
        RAISE NOTICE 'محادثة ترحيبية موجودة بالفعل';
    END IF;

END $$;

-- 10. عرض النتائج النهائية
SELECT
'المستخدمين' as table_name,
COUNT(_) as count
FROM public.users
UNION ALL
SELECT
'المحادثات' as table_name,
COUNT(_) as count
FROM public.conversations
UNION ALL
SELECT
'الرسائل' as table_name,
COUNT(\*) as count
FROM public.messages;

--------------------------------------------------------------------

--31

-- سكربت SQL لعرض جميع الجداول، الأعمدة، العلاقات، الدوال، والتريجرات في قاعدة بيانات PostgreSQL/Supabase

-- 1. عرض جميع الجداول وأعمدتها
SELECT table_schema, table_name, column_name, data_type, is_nullable
FROM information_schema.columns
WHERE table_schema NOT IN ('information_schema', 'pg_catalog')
ORDER BY table_schema, table_name, ordinal_position;

-- 2. عرض المفاتيح الأجنبية (العلاقات بين الجداول)
SELECT
tc.table_schema, tc.table_name, kcu.column_name,
ccu.table_schema AS foreign_table_schema,
ccu.table_name AS foreign_table_name,
ccu.column_name AS foreign_column_name
FROM information_schema.table_constraints AS tc
JOIN information_schema.key_column_usage AS kcu
ON tc.constraint_name = kcu.constraint_name AND tc.table_schema = kcu.table_schema
JOIN information_schema.constraint_column_usage AS ccu
ON ccu.constraint_name = tc.constraint_name AND ccu.table_schema = tc.table_schema
WHERE tc.constraint_type = 'FOREIGN KEY';

-- 3. عرض جميع الدوال (functions)
SELECT routine_schema, routine_name, routine_type, data_type
FROM information_schema.routines
WHERE routine_schema NOT IN ('pg_catalog', 'information_schema')
ORDER BY routine_schema, routine_name;

-- 4. عرض جميع التريجرات (triggers)
SELECT event_object_schema, event_object_table, trigger_name, action_timing, event_manipulation, action_statement
FROM information_schema.triggers
ORDER BY event_object_schema, event_object_table, trigger_name;

-- 5. عرض جميع الفهارس (اختياري)
SELECT schemaname, tablename, indexname, indexdef
FROM pg_indexes
WHERE schemaname NOT IN ('pg_catalog', 'information_schema')
ORDER BY schemaname, tablename, indexname;

-- ملاحظة: نفذ هذا السكربت في SQL Editor في لوحة تحكم Supabase أو أي أداة PostgreSQL لديك.

---------------------------------------------------------

--32

-- دالة تضيف سجل في profiles عند إضافة مستخدم جديد في users
CREATE OR REPLACE FUNCTION create_profile_on_user_insert()
RETURNS TRIGGER AS $$
BEGIN
-- إذا لم يوجد سجل في profiles بنفس id، أضفه
IF NOT EXISTS (SELECT 1 FROM profiles WHERE id = NEW.id) THEN
INSERT INTO profiles (id, username, updated_at)
VALUES (NEW.id, NEW.username, NOW());
END IF;
RETURN NEW;
END;

$$
LANGUAGE plpgsql;

-- تريجر ينفذ الدالة بعد كل إدراج في users
DROP TRIGGER IF EXISTS trg_create_profile_on_user_insert ON users;
CREATE TRIGGER trg_create_profile_on_user_insert
AFTER INSERT ON users
FOR EACH ROW
EXECUTE FUNCTION create_profile_on_user_insert();
-----------------------------------------------------
--34

-- سكربت لطباعة محتويات جميع الجداول مع أسماء الأعمدة بعد إدخال المستخدم الجديد

-- 1. طباعة محتويات جدول users
SELECT 'users' AS table_name, * FROM users;

-- 2. طباعة محتويات جدول profiles
SELECT 'profiles' AS table_name, * FROM profiles;

-- 3. طباعة محتويات جدول conversations
SELECT 'conversations' AS table_name, * FROM conversations;

-- 4. طباعة محتويات جدول conversation_members
SELECT 'conversation_members' AS table_name, * FROM conversation_members;

-- 5. طباعة محتويات جدول messages
SELECT 'messages' AS table_name, * FROM messages;

-- 6. طباعة محتويات جدول message_reads
SELECT 'message_reads' AS table_name, * FROM message_reads;

-- 7. طباعة محتويات جدول hidden_messages
SELECT 'hidden_messages' AS table_name, * FROM hidden_messages;

-- 8. طباعة محتويات جدول push_tokens
SELECT 'push_tokens' AS table_name, * FROM push_tokens;

-- يمكنك إضافة أو حذف جداول حسب الحاجة
------------------------------------------------------

--37




DROP POLICY IF EXISTS "Users can view members of their conversations" ON public.conversation_members;

CREATE POLICY "Users can view members of their conversations"
ON public.conversation_members
FOR SELECT
USING (
  EXISTS (
    SELECT 1 FROM public.conversation_members AS cm
    WHERE cm.conversation_id = conversation_members.conversation_id
      AND cm.user_id = auth.uid()
  )
);
----------------------------------------------------

--38




-- Query 3: Get RLS Policies (Corrected)
-- THIS IS THE MOST IMPORTANT ONE. Please run this query alone and paste the result.
SELECT
    n.nspname AS schemaname,
    c.relname AS tablename,
    p.polname AS policyname,
    CASE p.polcmd
        WHEN 'r' THEN 'SELECT'
        WHEN 'a' THEN 'INSERT'
        WHEN 'w' THEN 'UPDATE'
        WHEN 'd' THEN 'DELETE'
        WHEN '*' THEN 'ALL'
    END AS policy_for,
    pg_get_expr(p.polqual, p.polrelid) AS using_expression,
    pg_get_expr(p.polwithcheck, p.polrelid) AS with_check_expression
FROM
    pg_catalog.pg_policy p
JOIN
    pg_catalog.pg_class c ON p.polrelid = c.oid
JOIN
    pg_catalog.pg_namespace n ON c.relnamespace = n.oid
WHERE
    n.nspname = 'public';

--------------------------------------------------------


--40--




-- This RPC function fetches users with whom the current user has had conversations.
-- v4: Added display_name to the return table.

-- Drop the function if it exists to allow return type modification
DROP FUNCTION IF EXISTS public.get_contact_users(uuid);

CREATE OR REPLACE FUNCTION public.get_contact_users(p_user_id uuid)
RETURNS TABLE (
    id uuid,
    username character varying,
    email character varying,
    display_name character varying -- Changed type to character varying
)
LANGUAGE plpgsql
SECURITY DEFINER
AS
$$

BEGIN
RETURN QUERY
SELECT
u.id,
u.username,
u.email,
u.display_name -- Added display_name
FROM
public.users u
WHERE
u.id IN (
SELECT DISTINCT UNNEST(c.participants)
FROM public.conversations c
WHERE c.participants @> ARRAY[p_user_id]
)
AND u.id != p_user_id; -- Exclude the current user
END;

$$
;

-- Grant execute permissions
GRANT EXECUTE ON FUNCTION public.get_contact_users(uuid) TO authenticated;

SELECT 'RPC function get_contact_users created successfully.' as result;
-------------------------------------------------------

--41 --




CREATE OR REPLACE FUNCTION public.archive_conversation(p_conversation_id uuid)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
AS
$$

BEGIN
INSERT INTO public.user_conversation_settings (user_id, conversation_id, is_archived)
VALUES (auth.uid(), p_conversation_id, TRUE)
ON CONFLICT (user_id, conversation_id) DO UPDATE
SET is_archived = TRUE;
END;

$$
;

GRANT EXECUTE ON FUNCTION public.archive_conversation(uuid) TO authenticated;
-------------------------------------------------------
