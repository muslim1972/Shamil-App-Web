-- اختبار دالة get_user_conversations للمستخدم muslimakeel@yahoo.com
-- أولاً: الحصول على user_id للمستخدم الجديد
SELECT id, email, username 
FROM auth.users 
WHERE email = 'muslimakeel@yahoo.com';

-- ثانياً: التحقق من وجود المستخدم في جدول public.users
SELECT * 
FROM public.users 
WHERE email = 'muslimakeel@yahoo.com';

-- ثالثاً: اختبار دالة get_user_conversations
-- استبدل USER_ID_HERE بالمعرف الفعلي من النتيجة أعلاه
-- SELECT * FROM public.get_user_conversations();

-- رابعاً: إذا لم تكن هناك محادثات، يمكننا إنشاء محادثة ترحيبية
-- INSERT INTO public.conversations (title, type, created_by) 
-- VALUES ('محادثة ترحيبية', 'direct', 'USER_ID_HERE');

-- خامساً: إضافة المستخدم إلى المحادثة
-- INSERT INTO public.conversation_participants (conversation_id, user_id, joined_at)
-- VALUES (LAST_INSERT_ID(), 'USER_ID_HERE', NOW());