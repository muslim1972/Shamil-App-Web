-- إصلاح شامل لجميع مشكلات المصادقة والمستخدمين
-- هذا السكربت يعالج:
-- 1. تزامن بيانات المستخدمين بين auth.users و public.users
-- 2. إنشاء جميع الوظائف المطلوبة
-- 3. التحقق من وجود المستخدمين الثلاثة المحددين

-- أولاً: التحقق من وجود المستخدمين الثلاثة في auth.users
SELECT 'التحقق من المستخدمين في auth.users:' as check_name;
SELECT id, email, raw_user_meta_data->>'username' as username 
FROM auth.users 
WHERE email IN ('muslimalmulali@gmail.com', 'muslimakkeel@gmail.com', 'lumaalbahadli@gmail.com');

-- ثانياً: التحقق من وجود المستخدمين في public.users
SELECT 'التحقق من المستخدمين في public.users:' as check_name;
SELECT id, email, username FROM public.users 
WHERE email IN ('muslimalmulali@gmail.com', 'muslimakkeel@gmail.com', 'lumaalbahadli@gmail.com');

-- ثالثاً: إنشاء أو تحديث وظيفة ensure_user_exists بالمعلمة الصحيحة
DROP FUNCTION IF EXISTS public.ensure_user_exists(UUID) CASCADE;
DROP FUNCTION IF EXISTS public.ensure_user_exists(TEXT) CASCADE;

CREATE OR REPLACE FUNCTION public.ensure_user_exists(user_uuid UUID)
RETURNS VOID
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
    -- التحقق من وجود المستخدم في auth.users
    IF NOT EXISTS (SELECT 1 FROM auth.users WHERE id = user_uuid) THEN
        RAISE EXCEPTION 'User not found in auth.users';
    END IF;

    -- إدراج أو تحديث المستخدم في public.users
    INSERT INTO public.users (id, email, username, password, created_at, updated_at)
    SELECT 
        au.id,
        au.email,
        COALESCE(
            au.raw_user_meta_data->>'username',
            SPLIT_PART(au.email, '@', 1)
        ) as username,
        '123456' as password,
        au.created_at,
        au.updated_at
    FROM auth.users au
    WHERE au.id = user_uuid
    ON CONFLICT (id) DO UPDATE SET
        email = EXCLUDED.email,
        username = EXCLUDED.username,
        updated_at = EXCLUDED.updated_at;
END;
$$;

-- ربط وظيفة ensure_user_exists بالمستخدمين الثلاثة
SELECT public.ensure_user_exists('ac2c7067-e91d-4c5a-bdc2-60f9953d5511');
SELECT public.ensure_user_exists('51badf47-5a8f-484f-a790-1fcb12958fc1');
SELECT public.ensure_user_exists('6c4ceb61-d307-457e-a527-2c3c61d26103');

-- رابعاً: إنشاء وظيفة check_user_exists
DROP FUNCTION IF EXISTS public.check_user_exists(UUID) CASCADE;
DROP FUNCTION IF EXISTS public.check_user_exists(TEXT) CASCADE;

CREATE OR REPLACE FUNCTION public.check_user_exists(user_uuid UUID)
RETURNS BOOLEAN
LANGUAGE sql
SECURITY DEFINER
AS $$
    SELECT EXISTS (SELECT 1 FROM public.users WHERE id = user_uuid);
$$;

-- خامساً: إنشاء وظيفة create_or_get_conversation_with_user
DROP FUNCTION IF EXISTS public.create_or_get_conversation_with_user(UUID) CASCADE;

CREATE OR REPLACE FUNCTION public.create_or_get_conversation_with_user(p_other_user_id UUID)
RETURNS UUID
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
    v_current_user_id UUID;
    v_conversation_id UUID;
    v_participant_ids UUID[];
BEGIN
    -- الحصول على معرف المستخدم الحالي
    v_current_user_id := auth.uid();
    
    -- التحقق من أن المستخدمين مختلفين
    IF v_current_user_id = p_other_user_id THEN
        RAISE EXCEPTION 'Cannot create conversation with yourself';
    END IF;
    
    -- التحقق من وجود المستخدم الآخر
    IF NOT EXISTS (SELECT 1 FROM public.users WHERE id = p_other_user_id) THEN
        RAISE EXCEPTION 'Other user does not exist';
    END IF;
    
    -- ترتيب المعرفات لضمان تطابق
    v_participant_ids := ARRAY[
        LEAST(v_current_user_id, p_other_user_id),
        GREATEST(v_current_user_id, p_other_user_id)
    ];
    
    -- البحث عن محادثة موجودة
    SELECT c.id INTO v_conversation_id
    FROM conversations c
    WHERE c.participants @> v_participant_ids
      AND NOT EXISTS (
          SELECT 1 FROM conversations c2 
          WHERE c2.participants @> v_participant_ids 
          AND c2.id != c.id
      );
    
    -- إذا لم توجد محادثة، إنشاء واحدة جديدة
    IF v_conversation_id IS NULL THEN
        INSERT INTO conversations (participants, created_at, updated_at)
        VALUES (v_participant_ids, NOW(), NOW())
        RETURNING id INTO v_conversation_id;
    END IF;
    
    RETURN v_conversation_id;
END;
$$;

-- سادساً: منح الصلاحيات اللازمة
GRANT EXECUTE ON FUNCTION public.ensure_user_exists(UUID) TO authenticated;
GRANT EXECUTE ON FUNCTION public.check_user_exists(UUID) TO authenticated;
GRANT EXECUTE ON FUNCTION public.create_or_get_conversation_with_user(UUID) TO authenticated;

-- سابعاً: التحقق النهائي من وجود جميع المستخدمين
SELECT 'النتيجة النهائية للمستخدمين:' as final_check;
SELECT 
    u.id,
    u.email,
    u.username,
    au.raw_user_meta_data->>'username' as auth_username,
    CASE 
        WHEN au.id IS NOT NULL THEN 'موجود في auth.users'
        ELSE 'غير موجود في auth.users'
    END as auth_status
FROM public.users u
LEFT JOIN auth.users au ON u.id = au.id
WHERE u.email IN ('muslimalmulali@gmail.com', 'muslimakkeel@gmail.com', 'lumaalbahadli@gmail.com')
ORDER BY u.email;