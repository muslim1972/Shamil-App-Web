-- إصلاح سياسة أمان الصفوف لجدول push_tokens

-- التحقق من وجود الجدول
DO $$ 
BEGIN
  IF NOT EXISTS (SELECT FROM pg_tables WHERE schemaname = 'public' AND tablename = 'push_tokens') THEN
    CREATE TABLE public.push_tokens (
      id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
      token TEXT NOT NULL UNIQUE,
      user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
      created_at TIMESTAMP WITH TIME ZONE DEFAULT now() NOT NULL,
      updated_at TIMESTAMP WITH TIME ZONE DEFAULT now() NOT NULL
    );
  END IF;
END $$;

-- إنشاء الدالة المساعدة للتحقق من المستخدم الحالي
CREATE OR REPLACE FUNCTION public.is_current_user(user_id UUID)
RETURNS BOOLEAN AS $$
BEGIN
  RETURN user_id = auth.uid();
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- حذف السياسات الموجودة إذا كانت موجودة
DROP POLICY IF EXISTS push_tokens_insert_policy ON public.push_tokens;
DROP POLICY IF EXISTS push_tokens_select_policy ON public.push_tokens;
DROP POLICY IF EXISTS push_tokens_update_policy ON public.push_tokens;
DROP POLICY IF EXISTS push_tokens_delete_policy ON public.push_tokens;

-- تمكين RLS على الجدول
ALTER TABLE public.push_tokens ENABLE ROW LEVEL SECURITY;

-- إنشاء سياسات جديدة
-- سياسة الإدراج: يمكن للمستخدم إدراج رمز إشعارات خاص به فقط
CREATE POLICY push_tokens_insert_policy ON public.push_tokens
  FOR INSERT
  WITH CHECK (user_id = auth.uid());

-- سياسة التحديث: يمكن للمستخدم تحديث رمز الإشعارات الخاص به فقط
CREATE POLICY push_tokens_update_policy ON public.push_tokens
  FOR UPDATE
  USING (user_id = auth.uid());

-- سياسة الحذف: يمكن للمستخدم حذف رمز الإشعارات الخاص به فقط
CREATE POLICY push_tokens_delete_policy ON public.push_tokens
  FOR DELETE
  USING (user_id = auth.uid());

-- سياسة الاختيار: يمكن للمستخدم رؤية رمز الإشعارات الخاص به فقط
CREATE POLICY push_tokens_select_policy ON public.push_tokens
  FOR SELECT
  USING (user_id = auth.uid());

-- منح الصلاحيات للمستخدمين المصادق عليهم
GRANT ALL ON public.push_tokens TO authenticated;
GRANT USAGE, SELECT ON SEQUENCE public.push_tokens_id_seq TO authenticated;