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
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 5. إعادة إنشاء دالة check_user_exists
CREATE OR REPLACE FUNCTION public.check_user_exists(p_user_id uuid)
RETURNS boolean AS $$
BEGIN
    RETURN EXISTS (SELECT 1 FROM public.users WHERE id = p_user_id);
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 6. منح الصلاحيات
GRANT EXECUTE ON FUNCTION public.ensure_user_exists(uuid) TO authenticated;
GRANT EXECUTE ON FUNCTION public.ensure_user_exists(uuid) TO service_role;
GRANT EXECUTE ON FUNCTION public.check_user_exists(uuid) TO authenticated;
GRANT EXECUTE ON FUNCTION public.check_user_exists(uuid) TO service_role;

-- 7. إضافة المستخدمين المطلوبين من auth.users إلى public.users
DO $$
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
    COUNT(*) as count
FROM public.users
UNION ALL
SELECT 
    'المحادثات' as table_name,
    COUNT(*) as count
FROM public.conversations
UNION ALL
SELECT 
    'الرسائل' as table_name,
    COUNT(*) as count
FROM public.messages;