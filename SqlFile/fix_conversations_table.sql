-- إصلاح جدول conversations وإضافة عمود participants المفقود

-- أولاً: التحقق من بنية جدول conversations الحالي
SELECT 'بنية جدول conversations الحالية:' as check_name;
SELECT column_name, data_type, is_nullable 
FROM information_schema.columns 
WHERE table_name = 'conversations' AND table_schema = 'public'
ORDER BY ordinal_position;

-- ثانياً: إذا كان الجدول موجوداً بدون عمود participants، نقوم بإضافته
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'conversations' AND column_name = 'participants' AND table_schema = 'public'
    ) THEN
        ALTER TABLE public.conversations ADD COLUMN participants UUID[] NOT NULL DEFAULT '{}'::UUID[];
    END IF;
END $$;

-- ثالثاً: إذا لم يكن الجدول موجوداً، نقوم بإنشائه بالكامل
CREATE TABLE IF NOT EXISTS public.conversations (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    participants UUID[] NOT NULL DEFAULT '{}'::UUID[],
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- رابعاً: إنشاء فهرس لتحسين الأداء على مصفوفة participants
CREATE INDEX IF NOT EXISTS idx_conversations_participants ON public.conversations USING GIN (participants);

-- خامساً: التحقق من أن الجدول يحتوي على العمود participants بعد الإصلاح
SELECT 'بنية جدول conversations بعد الإصلاح:' as check_name;
SELECT column_name, data_type, is_nullable 
FROM information_schema.columns 
WHERE table_name = 'conversations' AND table_schema = 'public'
ORDER BY ordinal_position;

-- سادساً: منح الصلاحيات
GRANT ALL ON public.conversations TO authenticated;
GRANT ALL ON public.conversations TO anon;

-- سابعاً: إعادة إنشاء وظيفة create_or_get_conversation_with_user بالشكل الصحيح
DROP FUNCTION IF EXISTS public.create_or_get_conversation_with_user(UUID) CASCADE;

CREATE OR REPLACE FUNCTION public.create_or_get_conversation_with_user(p_other_user_id UUID)
RETURNS UUID
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
    v_current_user_id UUID;
    v_conversation_id UUID;
    v_participants UUID[];
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
    v_participants := ARRAY[
        LEAST(v_current_user_id, p_other_user_id),
        GREATEST(v_current_user_id, p_other_user_id)
    ];
    
    -- البحث عن محادثة موجودة
    SELECT id INTO v_conversation_id
    FROM public.conversations c
    WHERE c.participants @> v_participants
      AND c.participants <@ v_participants
    ORDER BY c.created_at DESC
    LIMIT 1;
    
    -- إذا لم توجد محادثة، إنشاء واحدة جديدة
    IF v_conversation_id IS NULL THEN
        INSERT INTO public.conversations (participants, created_at, updated_at)
        VALUES (v_participants, NOW(), NOW())
        RETURNING id INTO v_conversation_id;
    END IF;
    
    RETURN v_conversation_id;
END;
$$;

-- ثامناً: منح الصلاحية للوظيفة
GRANT EXECUTE ON FUNCTION public.create_or_get_conversation_with_user(UUID) TO authenticated;

-- تاسعاً: التحقق من أن كل شيء يعمل
SELECT 'اختبار وظيفة create_or_get_conversation_with_user:' as test_name;
SELECT public.create_or_get_conversation_with_user('51badf47-5a8f-484f-a790-1fcb12958fc1') as test_conversation_id;