-- الخطوة 1: إنشاء دالة مساعدة مع صلاحيات SECURITY DEFINER لكسر حلقة الاستدعاء الذاتي.
-- هذه الدالة تتحقق مما إذا كان المستخدم الحالي عضواً في محادثة معينة.
-- باستخدام SECURITY DEFINER، تتجاوز هذه الدالة سياسات RLS عند الاستعلام، مما يمنع الخطأ.
CREATE OR REPLACE FUNCTION public.is_conversation_member(p_conversation_id uuid)
RETURNS boolean
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  RETURN EXISTS (
    SELECT 1
    FROM public.conversation_members
    WHERE conversation_id = p_conversation_id AND user_id = auth.uid()
  );
END;
$$;

-- الخطوة 2: حذف جميع السياسات القديمة والخاطئة لتجنب أي تعارضات.
DROP POLICY IF EXISTS "Allow read access to own conversations" ON public.conversations;
DROP POLICY IF EXISTS "Allow read access to own conversation members" ON public.conversation_members;
DROP POLICY IF EXISTS "Allow read access to messages in user's conversations" ON public.messages;
DROP POLICY IF EXISTS "Allow insert access for conversation members" ON public.messages;

-- الخطوة 3: إنشاء سياسات جديدة وصحيحة تستخدم الدالة المساعدة.

-- سياسة لجدول المحادثات
-- تسمح للمستخدم برؤية المحادثة فقط إذا كان عضواً فيها.
CREATE POLICY "Allow read access to own conversations"
ON public.conversations FOR SELECT
USING (public.is_conversation_member(id));

-- سياسة لجدول أعضاء المحادثة
-- تسمح للمستخدم برؤية أعضاء المحادثة فقط إذا كان هو نفسه عضواً فيها.
CREATE POLICY "Allow read access to own conversation members"
ON public.conversation_members FOR SELECT
USING (public.is_conversation_member(conversation_id));

-- سياسة لجلب الرسائل
-- تسمح للمستخدم بقراءة الرسائل في المحادثة فقط إذا كان عضواً فيها.
CREATE POLICY "Allow read access to messages in user's conversations"
ON public.messages FOR SELECT
USING (public.is_conversation_member(conversation_id));

-- سياسة لإرسال الرسائل
-- تسمح للمستخدم بإرسال رسالة في المحادثة فقط إذا كان عضواً فيها.
CREATE POLICY "Allow insert access for conversation members"
ON public.messages FOR INSERT
WITH CHECK (public.is_conversation_member(conversation_id));

-- الخطوة 4: منح صلاحية تنفيذ الدالة لدور المستخدمين المسجلين.
GRANT EXECUTE ON FUNCTION public.is_conversation_member(uuid) TO authenticated;

SELECT 'تم إصلاح سياسات RLS بنجاح! من المفترض أن مشكلة الاستدعاء الذاتي قد حُلَّت.' AS result;
