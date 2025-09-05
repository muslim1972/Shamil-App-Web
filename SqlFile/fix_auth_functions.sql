

-- حذف الدوال الموجودة أولاً
DROP FUNCTION IF EXISTS public.ensure_user_exists();
DROP FUNCTION IF EXISTS public.check_user_exists(p_user_id uuid);

-- إنشاء دالة ensure_user_exists المطلوبة لتطبيق ShamilApp
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

-- إنشاء دالة check_user_exists المطلوبة أيضاً
CREATE OR REPLACE FUNCTION public.check_user_exists(p_user_id uuid)
RETURNS boolean
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  RETURN EXISTS (SELECT 1 FROM public.users WHERE id = p_user_id);
END;
$$;

-- رسالة تأكيد
SELECT 'تم إنشاء الدوال المطلوبة بنجاح!' AS result;

