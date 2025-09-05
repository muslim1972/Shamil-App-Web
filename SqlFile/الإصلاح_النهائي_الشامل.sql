-- الإصلاح النهائي الشامل لمشكلات قاعدة البيانات
-- هذا الملف يعالج جميع المشكلات المذكورة: الأعمدة المفقودة، تعارضات الدوال، وإضافة المستخدمين

-- 1. إصلاح جدول users لإضافة الأعمدة المفقودة
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
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 4. إعادة إنشاء دالة check_user_exists
CREATE OR REPLACE FUNCTION public.check_user_exists(p_user_id uuid)
RETURNS boolean AS $$
BEGIN
    RETURN EXISTS (SELECT 1 FROM public.users WHERE id = p_user_id);
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 5. منح الصلاحيات
GRANT EXECUTE ON FUNCTION public.ensure_user_exists(uuid) TO authenticated;
GRANT EXECUTE ON FUNCTION public.ensure_user_exists(uuid) TO service_role;
GRANT EXECUTE ON FUNCTION public.check_user_exists(uuid) TO authenticated;
GRANT EXECUTE ON FUNCTION public.check_user_exists(uuid) TO service_role;

-- 6. إضافة المستخدم muslimakeel@yahoo.com يدوياً إذا لم يكن موجوداً
DO $$
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
        INSERT INTO public.conversations (name, type, created_by, created_at, updated_at)
        VALUES ('محادثة ترحيبية', 'group', admin_user_id, NOW(), NOW())
        RETURNING id INTO welcome_conversation_id;
        
        -- إضافة جميع المستخدمين إلى المحادثة
        INSERT INTO public.conversation_members (conversation_id, user_id, joined_at)
        SELECT welcome_conversation_id, id, NOW()
        FROM public.users;
        
        -- إضافة رسالة ترحيبية
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
END $$;

-- 9. تحديث test_user_conversations.sql ليعمل بدون أخطاء
-- هذا الاستعلام سيعمل بعد التحديثات أعلاه