
-- ملف SQL شامل لتطبيق ShamilApp
-- يحتوي على الاستعلامات الأساسية الضرورية فقط

-- 1. حذف الدوال الموجودة أولاً
DROP FUNCTION IF EXISTS public.ensure_user_exists();
DROP FUNCTION IF EXISTS public.check_user_exists(p_user_id uuid);

-- 2. إنشاء دالة ensure_user_exists المطلوبة
CREATE OR REPLACE FUNCTION public.ensure_user_exists()
RETURNS boolean
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  -- التحقق من وجود المستخدم في جدول users
  IF EXISTS (SELECT 1 FROM public.users WHERE id = auth.uid()) THEN
    RETURN true;
  END IF;

  -- إضافة المستخدم إذا لم يكن موجوداً
  INSERT INTO public.users (id, email, username)
  VALUES (auth.uid(), auth.jwt()::jsonb->>'email', auth.jwt()::jsonb->>'username')
  ON CONFLICT (id) DO NOTHING;

  RETURN true;
EXCEPTION WHEN OTHERS THEN
  RETURN false;
END;
$$;

-- 3. إنشاء دالة check_user_exists المطلوبة
CREATE OR REPLACE FUNCTION public.check_user_exists(p_user_id uuid)
RETURNS boolean
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  RETURN EXISTS (SELECT 1 FROM public.users WHERE id = p_user_id);
END;
$$;

-- 4. إنشاء دالة create_or_get_conversation_with_user
CREATE OR REPLACE FUNCTION public.create_or_get_conversation_with_user(p_other_user_id uuid)
RETURNS uuid
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  v_current_user_id uuid := auth.uid();
  v_conversation_id uuid;
BEGIN
  -- البحث عن محادثة موجودة بين المستخدمين
  SELECT c.id INTO v_conversation_id
  FROM public.conversations c
  JOIN public.conversation_members cm1 ON c.id = cm1.conversation_id
  JOIN public.conversation_members cm2 ON c.id = cm2.conversation_id
  WHERE cm1.user_id = v_current_user_id
    AND cm2.user_id = p_other_user_id
    AND c.is_group = false;

  -- إذا تم العثور على محادثة، إرجاع معرفها
  IF v_conversation_id IS NOT NULL THEN
    RETURN v_conversation_id;
  END IF;

  -- إنشاء محادثة جديدة إذا لم تكن موجودة
  INSERT INTO public.conversations (is_group, created_by)
  VALUES (false, v_current_user_id)
  RETURNING id INTO v_conversation_id;

  -- إضافة المستخدمين إلى المحادثة
  INSERT INTO public.conversation_members (conversation_id, user_id)
  VALUES
    (v_conversation_id, v_current_user_id),
    (v_conversation_id, p_other_user_id);

  RETURN v_conversation_id;
END;
$$;

-- رسالة تأكيد
SELECT 'تم إنشاء الدوال الأساسية بنجاح!' AS result;
