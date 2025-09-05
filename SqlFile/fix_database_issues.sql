-- إصلاح شامل لمشاكل قاعدة البيانات
-- يجب تنفيذ هذا الملف في Supabase SQL Editor

-- 1. إضافة المستخدمين المفقودين من auth.users إلى public.users
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

-- 2. التحقق من وجود المستخدمين المطلوبين
DO $$
DECLARE
    target_emails text[] := ARRAY['muslimalmulali@gmail.com', 'muslimakkeel@gmail.com'];
    email_item text;
    auth_user_id uuid;
BEGIN
    FOREACH email_item IN ARRAY target_emails
    LOOP
        -- البحث عن المستخدم في auth.users
        SELECT id INTO auth_user_id
        FROM auth.users 
        WHERE email = email_item;
        
        IF auth_user_id IS NOT NULL THEN
            -- التأكد من وجوده في public.users
            IF NOT EXISTS (SELECT 1 FROM public.users WHERE id = auth_user_id) THEN
                INSERT INTO public.users (id, email, username, display_name, created_at, updated_at)
                VALUES (
                    auth_user_id,
                    email_item,
                    SPLIT_PART(email_item, '@', 1),
                    SPLIT_PART(email_item, '@', 1),
                    NOW(),
                    NOW()
                );
                RAISE NOTICE 'تم إضافة المستخدم: %', email_item;
            ELSE
                RAISE NOTICE 'المستخدم موجود بالفعل: %', email_item;
            END IF;
        ELSE
            RAISE NOTICE 'المستخدم غير موجود في auth.users: %', email_item;
        END IF;
    END LOOP;
END $$;

-- 3. إنشاء محادثة ترحيبية إذا لم تكن موجودة
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
    ELSE
        RAISE NOTICE 'محادثة ترحيبية موجودة بالفعل';
    END IF;
END $$;

-- 4. عرض النتائج النهائية
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